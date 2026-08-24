package origin

import (
	"context"
	"crypto/rand"
	"crypto/subtle"
	"embed"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"mime"
	"net"
	"net/http"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"time"
	"unicode"
	"unicode/utf8"
)

const (
	defaultDTDVersion    = "1.1"
	defaultSessionTTL    = 30 * time.Minute
	defaultMaxUsers      = 128
	defaultMaxSessions   = 256
	defaultMaxBody       = int64(8 << 10)
	defaultE2EActionTTL  = 15 * time.Minute
	defaultMaxE2EActions = 256
	maxUsernameBytes     = 32
	maxPINBytes          = 6
	maxSessionIDBytes    = 64
	maxExampleBytes      = 4 << 10
	maxE2EActionIDBytes  = 63
	maxE2EActionAttempt  = 9999
	pageSize             = 2
)

var (
	validPIN         = regexp.MustCompile(`^[0-9]{4,6}$`)
	validSessionID   = regexp.MustCompile(`^[a-f0-9]{16}$`)
	validExampleName = regexp.MustCompile(`^[a-zA-Z0-9._-]+\.wml$`)
	exampleDTD       = regexp.MustCompile(`<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML (1\.[123])//EN" "http://www\.wapforum\.org/DTD/wml_(1\.[123])\.xml">`)
	validDTDs        = map[string]bool{"1.1": true, "1.2": true, "1.3": true}
)

//go:embed routes/*.wml
var exampleFiles embed.FS

type Config struct {
	DTDVersion       string
	OriginInstanceID string
	Clock            func() time.Time
	NewID            func() (string, error)
	Logger           *slog.Logger
	SessionTTL       time.Duration
	MaxUsers         int
	MaxSessions      int
	MaxBody          int64
	E2EFixtureMode   bool
	E2EActionTTL     time.Duration
	MaxE2EActions    int
	AllowedHosts     []string
	HomeHosts        []string
	FormsHosts       []string
	InteropHosts     []string
}

type user struct {
	PIN       string
	CreatedAt time.Time
}

type session struct {
	Username   string
	CreatedAt  time.Time
	LastAccess time.Time
}

type e2eAction struct {
	ID        string    `json:"actionId"`
	Kind      string    `json:"kind"`
	Count     uint64    `json:"count"`
	Phase     string    `json:"phase"`
	UpdatedAt time.Time `json:"-"`
}

type counters struct {
	requests      atomic.Uint64
	registered    atomic.Uint64
	loginSuccess  atomic.Uint64
	loginFailure  atomic.Uint64
	requestNumber atomic.Uint64
}

type App struct {
	dtdVersion       string
	originInstanceID string
	clock            func() time.Time
	newID            func() (string, error)
	logger           *slog.Logger
	sessionTTL       time.Duration
	maxUsers         int
	maxSessions      int
	maxBody          int64
	e2eFixtureMode   bool
	e2eActionTTL     time.Duration
	maxE2EActions    int
	allowedHosts     map[string]bool
	hostProfiles     map[string]string

	mu       sync.Mutex
	users    map[string]user
	sessions map[string]session
	counts   counters

	actionMu sync.Mutex
	actions  map[string]e2eAction
}

type responseCapture struct {
	http.ResponseWriter
	status int
	bytes  int
}

type labProfileContextKey struct{}

func New(config Config) (*App, error) {
	if config.DTDVersion == "" {
		config.DTDVersion = defaultDTDVersion
	}
	if !validDTDs[config.DTDVersion] {
		return nil, fmt.Errorf("unsupported WML_DTD_VERSION %q; expected 1.1, 1.2, or 1.3", config.DTDVersion)
	}
	if config.OriginInstanceID != "" && !validBoundedID(config.OriginInstanceID) {
		return nil, errors.New("invalid WML_ORIGIN_INSTANCE_ID; expected a bounded lowercase ASCII identifier")
	}
	if config.E2EFixtureMode && config.OriginInstanceID == "" {
		return nil, errors.New("WML_ORIGIN_INSTANCE_ID is required when WML_E2E_FIXTURE_MODE is enabled")
	}
	if config.Clock == nil {
		config.Clock = time.Now
	}
	if config.NewID == nil {
		config.NewID = randomSessionID
	}
	if config.Logger == nil {
		config.Logger = slog.New(slog.NewJSONHandler(io.Discard, nil))
	}
	if config.SessionTTL <= 0 {
		config.SessionTTL = defaultSessionTTL
	}
	if config.MaxUsers <= 0 {
		config.MaxUsers = defaultMaxUsers
	}
	if config.MaxSessions <= 0 {
		config.MaxSessions = defaultMaxSessions
	}
	if config.MaxBody <= 0 {
		config.MaxBody = defaultMaxBody
	}
	if config.E2EActionTTL <= 0 {
		config.E2EActionTTL = defaultE2EActionTTL
	}
	if config.MaxE2EActions <= 0 {
		config.MaxE2EActions = defaultMaxE2EActions
	}
	if len(config.HomeHosts) == 0 {
		config.HomeHosts = []string{"home.wap.test"}
	}
	if len(config.FormsHosts) == 0 {
		config.FormsHosts = []string{"forms.wap.test"}
	}
	if len(config.InteropHosts) == 0 {
		config.InteropHosts = []string{"interop.wap.test"}
	}
	allowedHosts := normalizedHostSet(config.AllowedHosts)
	hostProfiles := make(map[string]string)
	addHostProfiles(hostProfiles, config.HomeHosts, "home")
	addHostProfiles(hostProfiles, config.FormsHosts, "forms")
	addHostProfiles(hostProfiles, config.InteropHosts, "interop")

	return &App{
		dtdVersion:       config.DTDVersion,
		originInstanceID: config.OriginInstanceID,
		clock:            config.Clock,
		newID:            config.NewID,
		logger:           config.Logger,
		sessionTTL:       config.SessionTTL,
		maxUsers:         config.MaxUsers,
		maxSessions:      config.MaxSessions,
		maxBody:          config.MaxBody,
		e2eFixtureMode:   config.E2EFixtureMode,
		e2eActionTTL:     config.E2EActionTTL,
		maxE2EActions:    config.MaxE2EActions,
		allowedHosts:     allowedHosts,
		hostProfiles:     hostProfiles,
		users:            make(map[string]user),
		sessions:         make(map[string]session),
		actions:          make(map[string]e2eAction),
	}, nil
}

func (a *App) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /{$}", a.home)
	mux.HandleFunc("GET /about", a.about)
	mux.HandleFunc("GET /login", a.loginForm)
	mux.HandleFunc("POST /login", a.login)
	mux.HandleFunc("GET /register", a.registerForm)
	mux.HandleFunc("POST /register", a.register)
	mux.HandleFunc("GET /portal", a.portal)
	mux.HandleFunc("GET /profile", a.profile)
	mux.HandleFunc("GET /messages", a.messages)
	mux.HandleFunc("GET /logout", a.logout)
	mux.HandleFunc("GET /examples/{file}", a.example)
	return a.logRequests(a.markOriginResponses(a.limitHosts(routeLabProfiles(denyExcludedRoutes(mux)))))
}

func (a *App) InternalHandler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", a.health)
	mux.HandleFunc("GET /metrics", a.metrics)
	if a.e2eFixtureMode {
		mux.HandleFunc("GET /e2e/actions/{actionID}", a.e2eActionStatus)
	}
	return a.markOriginResponses(mux)
}

func (a *App) logRequests(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		a.counts.requests.Add(1)
		requestID := a.counts.requestNumber.Add(1)
		capture := &responseCapture{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(capture, r)
		a.logger.Info("request",
			"request_id", requestID,
			"method", r.Method,
			"path", r.URL.Path,
			"remote_ip", remoteIP(r.RemoteAddr),
			"status", capture.status,
			"bytes", capture.bytes,
		)
	})
}

func (a *App) markOriginResponses(next http.Handler) http.Handler {
	if a.originInstanceID == "" {
		return next
	}
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Waves-Origin-Instance", a.originInstanceID)
		next.ServeHTTP(w, r)
	})
}

func (a *App) limitHosts(next http.Handler) http.Handler {
	if len(a.allowedHosts) == 0 {
		return next
	}
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !a.allowedHosts[normalizedRequestHost(r.Host)] {
			a.sendWML(w, errorCard("Unknown Host", "This host is not served by the WAP lab."), http.StatusMisdirectedRequest)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func denyExcludedRoutes(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/viewer" || r.URL.Path == "/emulator" ||
			r.URL.Path == "/gateway" || strings.HasPrefix(r.URL.Path, "/gateway/") {
			http.NotFound(w, r)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func routeLabProfiles(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		const prefix = "/__lab/"
		if !strings.HasPrefix(r.URL.Path, prefix) {
			next.ServeHTTP(w, r)
			return
		}
		remainder := strings.TrimPrefix(r.URL.Path, prefix)
		profile, path, found := strings.Cut(remainder, "/")
		if !found || (profile != "home" && profile != "forms" && profile != "interop") {
			http.NotFound(w, r)
			return
		}
		request := r.Clone(context.WithValue(r.Context(), labProfileContextKey{}, profile))
		request.URL.Path = "/" + path
		request.URL.RawPath = ""
		next.ServeHTTP(w, request)
	})
}

func (w *responseCapture) WriteHeader(status int) {
	w.status = status
	w.ResponseWriter.WriteHeader(status)
}

func (w *responseCapture) Write(body []byte) (int, error) {
	written, err := w.ResponseWriter.Write(body)
	w.bytes += written
	return written, err
}

func remoteIP(address string) string {
	host, _, err := net.SplitHostPort(address)
	if err == nil {
		return host
	}
	return "unknown"
}

func (a *App) home(w http.ResponseWriter, r *http.Request) {
	deck := renderHomeDeck()
	profile, _ := r.Context().Value(labProfileContextKey{}).(string)
	if profile == "" {
		profile = a.hostProfiles[normalizedRequestHost(r.Host)]
	}
	switch profile {
	case "forms":
		deck = renderFormsHomeDeck()
	case "interop":
		deck = renderInteropHomeDeck()
	}
	a.sendWML(w, deck, http.StatusOK)
}

func (a *App) about(w http.ResponseWriter, _ *http.Request) {
	a.sendWML(w,
		`<card id="about" title="About WAP Lab">`+
			`<p>Client -&gt; WSP -&gt; Kannel -&gt; HTTP -&gt; WML app.</p>`+
			`<p>The WML origin is private behind the local gateway.</p>`+
			`<p><a href="/">Back Home</a></p>`+
			`<do type="accept" label="Home"><go href="/"/></do>`+
			`</card>`,
		http.StatusOK,
	)
}

func (a *App) loginForm(w http.ResponseWriter, r *http.Request) {
	actionID, ok := a.prepareE2EForm(w, r, "login")
	if !ok {
		return
	}
	a.sendWML(w, renderLoginDeck("", "", actionID), http.StatusOK)
}

func (a *App) login(w http.ResponseWriter, r *http.Request) {
	actionID, ok := a.beginE2EPost(w, r, "login")
	if !ok {
		return
	}
	form, ok := a.parseForm(w, r)
	if !ok {
		a.setE2EActionPhase(actionID, "request-rejected")
		return
	}
	username := strings.TrimSpace(form.Get("username"))
	pin := strings.TrimSpace(form.Get("pin"))
	if username == "" || pin == "" {
		a.counts.loginFailure.Add(1)
		nextID, ok := a.prepareE2EValidation(w, actionID, "login")
		if !ok {
			return
		}
		a.sendWML(w, renderLoginDeck(username, "Username and PIN are required.", nextID), http.StatusOK)
		return
	}
	if !validUsername(username) || len(pin) > maxPINBytes {
		a.counts.loginFailure.Add(1)
		nextID, ok := a.prepareE2EValidation(w, actionID, "login")
		if !ok {
			return
		}
		a.sendWML(w, renderLoginDeck(username, "Invalid username or PIN.", nextID), http.StatusOK)
		return
	}

	a.mu.Lock()
	account, found := a.users[username]
	a.mu.Unlock()
	pinMatches := constantTimePINCompare(account.PIN, pin)
	if pinMatches != 1 || !found {
		a.counts.loginFailure.Add(1)
		nextID, ok := a.prepareE2EValidation(w, actionID, "login")
		if !ok {
			return
		}
		a.sendWML(w, renderLoginDeck(username, "Invalid username or PIN.", nextID), http.StatusOK)
		return
	}

	sid, createdAt, err := a.createSession(username)
	if err != nil {
		a.setE2EActionPhase(actionID, "service-error")
		a.logger.Error("session creation failed", "error", err)
		a.sendWML(w, errorCard("Service Busy", "Unable to create a session."), http.StatusServiceUnavailable)
		return
	}
	a.counts.loginSuccess.Add(1)
	a.setE2EActionPhase(actionID, "success")
	a.sendWML(w, renderLoginSuccess(username, sid, createdAt), http.StatusOK)
}

func constantTimePINCompare(storedPIN, submittedPIN string) int {
	var stored, submitted [maxPINBytes + 1]byte
	copy(stored[:maxPINBytes], storedPIN)
	copy(submitted[:maxPINBytes], submittedPIN)
	stored[maxPINBytes] = byte(len(storedPIN))
	submitted[maxPINBytes] = byte(len(submittedPIN))
	return subtle.ConstantTimeCompare(stored[:], submitted[:])
}

func (a *App) registerForm(w http.ResponseWriter, r *http.Request) {
	actionID, ok := a.prepareE2EForm(w, r, "register")
	if !ok {
		return
	}
	a.sendWML(w, renderRegisterDeck("", "", actionID), http.StatusOK)
}

func (a *App) register(w http.ResponseWriter, r *http.Request) {
	actionID, ok := a.beginE2EPost(w, r, "register")
	if !ok {
		return
	}
	form, ok := a.parseForm(w, r)
	if !ok {
		a.setE2EActionPhase(actionID, "request-rejected")
		return
	}
	username := strings.TrimSpace(form.Get("username"))
	pin := strings.TrimSpace(form.Get("pin"))
	if username == "" || pin == "" {
		nextID, ok := a.prepareE2EValidation(w, actionID, "register")
		if !ok {
			return
		}
		a.sendWML(w, renderRegisterDeck(username, "Username and PIN are required.", nextID), http.StatusOK)
		return
	}
	if !validUsername(username) {
		nextID, ok := a.prepareE2EValidation(w, actionID, "register")
		if !ok {
			return
		}
		a.sendWML(w, renderRegisterDeck(username, "Username must be valid text up to 32 bytes.", nextID), http.StatusOK)
		return
	}
	if !validPIN.MatchString(pin) {
		nextID, ok := a.prepareE2EValidation(w, actionID, "register")
		if !ok {
			return
		}
		a.sendWML(w, renderRegisterDeck(username, "PIN must be 4-6 digits.", nextID), http.StatusOK)
		return
	}

	a.mu.Lock()
	if _, exists := a.users[username]; exists {
		a.mu.Unlock()
		nextID, ok := a.prepareE2EValidation(w, actionID, "register")
		if !ok {
			return
		}
		a.sendWML(w, renderRegisterDeck(username, "Username already exists.", nextID), http.StatusOK)
		return
	}
	if len(a.users) >= a.maxUsers {
		a.mu.Unlock()
		a.setE2EActionPhase(actionID, "service-error")
		a.sendWML(w, errorCard("Service Busy", "The demo user limit has been reached."), http.StatusServiceUnavailable)
		return
	}
	now := a.clock()
	a.users[username] = user{PIN: pin, CreatedAt: now}
	a.mu.Unlock()

	a.counts.registered.Add(1)
	a.setE2EActionPhase(actionID, "success")
	a.sendWML(w, renderRegisterSuccess(username), http.StatusOK)
}

func (a *App) portal(w http.ResponseWriter, r *http.Request) {
	current, ok := a.requireSession(w, r)
	if !ok {
		return
	}
	a.sendWML(w, renderPortalDeck(current), http.StatusOK)
}

func (a *App) profile(w http.ResponseWriter, r *http.Request) {
	current, ok := a.requireSession(w, r)
	if !ok {
		return
	}
	a.mu.Lock()
	account, found := a.users[current.Username]
	a.mu.Unlock()
	createdAt := "unknown"
	if found {
		createdAt = account.CreatedAt.Format(time.RFC3339Nano)
	}
	a.sendWML(w, renderProfileDeck(current, createdAt), http.StatusOK)
}

func (a *App) messages(w http.ResponseWriter, r *http.Request) {
	current, ok := a.requireSession(w, r)
	if !ok {
		return
	}
	page := parsePage(r.URL.Query().Get("page"))
	a.sendWML(w, renderMessagesDeck(current.ID, page), http.StatusOK)
}

func (a *App) logout(w http.ResponseWriter, r *http.Request) {
	sid := strings.TrimSpace(r.URL.Query().Get("sid"))
	if len(sid) <= maxSessionIDBytes {
		a.mu.Lock()
		delete(a.sessions, sid)
		a.mu.Unlock()
	}
	a.sendWML(w, renderLogoutDeck(), http.StatusOK)
}

func (a *App) example(w http.ResponseWriter, r *http.Request) {
	fileName := r.PathValue("file")
	if !validExampleName.MatchString(fileName) {
		a.sendWML(w,
			`<card id="bad-file" title="Invalid File"><p>Example file name must end in .wml</p></card>`,
			http.StatusBadRequest,
		)
		return
	}
	body, err := exampleFiles.ReadFile("routes/" + fileName)
	if err != nil {
		a.sendWML(w,
			`<card id="error" title="Error"><p>Unable to load `+xmlEscape(fileName)+`</p><do type="prev" label="Back"><prev/></do></card>`,
			http.StatusInternalServerError,
		)
		return
	}
	body, err = configureExampleDTD(body, a.dtdVersion)
	if err != nil {
		a.logger.Error("invalid embedded example", "file", fileName, "error", err)
		a.sendWML(w,
			`<card id="error" title="Error"><p>Unable to load `+xmlEscape(fileName)+`</p><do type="prev" label="Back"><prev/></do></card>`,
			http.StatusInternalServerError,
		)
		return
	}
	if len(body) > maxExampleBytes {
		a.logger.Error("embedded example exceeds response limit", "file", fileName, "bytes", len(body))
		a.sendWML(w,
			`<card id="error" title="Error"><p>Unable to load `+xmlEscape(fileName)+`</p><do type="prev" label="Back"><prev/></do></card>`,
			http.StatusInternalServerError,
		)
		return
	}
	setWMLHeaders(w.Header())
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(body)
}

func configureExampleDTD(body []byte, version string) ([]byte, error) {
	matches := exampleDTD.FindAllStringSubmatch(string(body), 2)
	if len(matches) != 1 || len(matches[0]) != 3 || matches[0][1] != matches[0][2] {
		return nil, errors.New("example must contain exactly one consistent supported WML doctype")
	}
	replacement := fmt.Sprintf(
		`<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML %s//EN" "http://www.wapforum.org/DTD/wml_%s.xml">`,
		version,
		version,
	)
	return []byte(exampleDTD.ReplaceAllString(string(body), replacement)), nil
}

func (a *App) health(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")
	if a.originInstanceID != "" {
		_, _ = fmt.Fprintf(w, `{"status":"ok","service":"wml-server","originInstanceId":%q,"timestamp":%q}`+"\n", a.originInstanceID, a.clock().Format(time.RFC3339Nano))
		return
	}
	_, _ = fmt.Fprintf(w, `{"status":"ok","service":"wml-server","timestamp":%q}`+"\n", a.clock().Format(time.RFC3339Nano))
}

func (a *App) metrics(w http.ResponseWriter, _ *http.Request) {
	now := a.clock()
	a.mu.Lock()
	a.sweepExpiredSessionsLocked(now)
	users := len(a.users)
	sessions := len(a.sessions)
	a.mu.Unlock()

	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")
	_, _ = fmt.Fprintf(w,
		"requests_total %d\nusers_total %d\nsessions_total %d\nregister_success_total %d\nlogin_success_total %d\nlogin_failure_total %d\n",
		a.counts.requests.Load(), users, sessions, a.counts.registered.Load(),
		a.counts.loginSuccess.Load(), a.counts.loginFailure.Load(),
	)
	if a.originInstanceID != "" {
		_, _ = fmt.Fprintf(w, "origin_instance_info{id=%q} 1\n", a.originInstanceID)
	}
}

func (a *App) prepareE2EForm(w http.ResponseWriter, r *http.Request, kind string) (string, bool) {
	actionID, present, ok := a.e2eActionIDFromRequest(w, r)
	if !ok || !present {
		return "", ok
	}
	if err := a.ensureE2EAction(actionID, kind, "form"); err != nil {
		a.sendE2EActionError(w, err)
		return "", false
	}
	return actionID, true
}

func (a *App) beginE2EPost(w http.ResponseWriter, r *http.Request, kind string) (string, bool) {
	actionID, present, ok := a.e2eActionIDFromRequest(w, r)
	if !ok || !present {
		return "", ok
	}
	now := a.clock()
	a.actionMu.Lock()
	defer a.actionMu.Unlock()
	a.sweepExpiredE2EActionsLocked(now)
	current, exists := a.actions[actionID]
	if exists && current.Kind != kind {
		a.sendWML(w, errorCard("Invalid Test Action", "The test action belongs to another form."), http.StatusConflict)
		return "", false
	}
	if !exists {
		if len(a.actions) >= a.maxE2EActions {
			a.sendWML(w, errorCard("Test Fixture Busy", "The test action limit has been reached."), http.StatusServiceUnavailable)
			return "", false
		}
		current = e2eAction{ID: actionID, Kind: kind}
	}
	current.Count++
	current.Phase = "received"
	current.UpdatedAt = now
	a.actions[actionID] = current
	return actionID, true
}

func (a *App) prepareE2EValidation(w http.ResponseWriter, actionID, kind string) (string, bool) {
	if actionID == "" {
		return "", true
	}
	a.setE2EActionPhase(actionID, "validation")
	nextID, ok := nextE2EActionID(actionID)
	if !ok {
		a.sendWML(w, errorCard("Invalid Test Action", "The test action attempt cannot be advanced."), http.StatusBadRequest)
		return "", false
	}
	if err := a.ensureE2EAction(nextID, kind, "form"); err != nil {
		a.sendE2EActionError(w, err)
		return "", false
	}
	return nextID, true
}

func (a *App) e2eActionIDFromRequest(w http.ResponseWriter, r *http.Request) (string, bool, bool) {
	if !a.e2eFixtureMode {
		return "", false, true
	}
	values, present := r.URL.Query()["e2e_action"]
	if !present {
		return "", false, true
	}
	if len(values) != 1 || !validE2EActionID(values[0]) {
		a.sendWML(w, errorCard("Invalid Test Action", "The test action identifier is invalid."), http.StatusBadRequest)
		return "", true, false
	}
	return values[0], true, true
}

var (
	errE2EActionLimit    = errors.New("E2E action limit reached")
	errE2EActionConflict = errors.New("E2E action kind conflict")
)

func (a *App) ensureE2EAction(actionID, kind, phase string) error {
	now := a.clock()
	a.actionMu.Lock()
	defer a.actionMu.Unlock()
	a.sweepExpiredE2EActionsLocked(now)
	current, exists := a.actions[actionID]
	if exists {
		if current.Kind != kind {
			return errE2EActionConflict
		}
		current.UpdatedAt = now
		a.actions[actionID] = current
		return nil
	}
	if len(a.actions) >= a.maxE2EActions {
		return errE2EActionLimit
	}
	a.actions[actionID] = e2eAction{
		ID:        actionID,
		Kind:      kind,
		Phase:     phase,
		UpdatedAt: now,
	}
	return nil
}

func (a *App) setE2EActionPhase(actionID, phase string) {
	if actionID == "" {
		return
	}
	a.actionMu.Lock()
	current, exists := a.actions[actionID]
	if exists {
		current.Phase = phase
		current.UpdatedAt = a.clock()
		a.actions[actionID] = current
	}
	a.actionMu.Unlock()
}

func (a *App) sendE2EActionError(w http.ResponseWriter, err error) {
	if errors.Is(err, errE2EActionLimit) {
		a.sendWML(w, errorCard("Test Fixture Busy", "The test action limit has been reached."), http.StatusServiceUnavailable)
		return
	}
	a.sendWML(w, errorCard("Invalid Test Action", "The test action belongs to another form."), http.StatusConflict)
}

func (a *App) e2eActionStatus(w http.ResponseWriter, r *http.Request) {
	actionID := r.PathValue("actionID")
	if !validE2EActionID(actionID) {
		http.Error(w, "invalid action identifier", http.StatusBadRequest)
		return
	}
	now := a.clock()
	a.actionMu.Lock()
	a.sweepExpiredE2EActionsLocked(now)
	current, found := a.actions[actionID]
	a.actionMu.Unlock()
	if !found {
		http.NotFound(w, r)
		return
	}
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")
	_ = json.NewEncoder(w).Encode(current)
}

func (a *App) sweepExpiredE2EActionsLocked(now time.Time) {
	for actionID, action := range a.actions {
		if now.Sub(action.UpdatedAt) > a.e2eActionTTL {
			delete(a.actions, actionID)
		}
	}
}

func validE2EActionID(value string) bool {
	if len(value) > maxE2EActionIDBytes {
		return false
	}
	separator := strings.LastIndex(value, "-a")
	if separator <= 0 || separator+2 >= len(value) {
		return false
	}
	base := value[:separator]
	attemptText := value[separator+2:]
	if !validBoundedID(base) || len(attemptText) > 4 || attemptText[0] == '0' {
		return false
	}
	for _, character := range attemptText {
		if character < '0' || character > '9' {
			return false
		}
	}
	attempt, err := strconv.Atoi(attemptText)
	return err == nil && attempt >= 1 && attempt <= maxE2EActionAttempt
}

func nextE2EActionID(value string) (string, bool) {
	if !validE2EActionID(value) {
		return "", false
	}
	separator := strings.LastIndex(value, "-a")
	attempt, _ := strconv.Atoi(value[separator+2:])
	if attempt >= maxE2EActionAttempt {
		return "", false
	}
	next := value[:separator] + "-a" + strconv.Itoa(attempt+1)
	return next, validE2EActionID(next)
}

func (a *App) parseForm(w http.ResponseWriter, r *http.Request) (url.Values, bool) {
	mediaType, _, err := mime.ParseMediaType(r.Header.Get("Content-Type"))
	if err != nil || mediaType != "application/x-www-form-urlencoded" {
		a.sendWML(w, errorCard("Unsupported Request", "Expected a form-encoded request."), http.StatusUnsupportedMediaType)
		return nil, false
	}
	r.Body = http.MaxBytesReader(w, r.Body, a.maxBody)
	body, err := io.ReadAll(r.Body)
	if err != nil {
		var tooLarge *http.MaxBytesError
		if errors.As(err, &tooLarge) {
			a.sendWML(w, errorCard("Request Too Large", "The submitted form is too large."), http.StatusRequestEntityTooLarge)
			return nil, false
		}
		a.sendWML(w, errorCard("Invalid Request", "Unable to read the submitted form."), http.StatusBadRequest)
		return nil, false
	}
	form, err := url.ParseQuery(string(body))
	if err != nil {
		a.sendWML(w, errorCard("Invalid Request", "Unable to parse the submitted form."), http.StatusBadRequest)
		return nil, false
	}
	return form, true
}

type currentSession struct {
	ID        string
	Username  string
	CreatedAt time.Time
}

func (a *App) requireSession(w http.ResponseWriter, r *http.Request) (currentSession, bool) {
	sid := strings.TrimSpace(r.URL.Query().Get("sid"))
	if len(sid) > maxSessionIDBytes || !validSessionID.MatchString(sid) {
		a.sendSessionRequired(w)
		return currentSession{}, false
	}
	now := a.clock()
	a.mu.Lock()
	stored, found := a.sessions[sid]
	if found && now.Sub(stored.LastAccess) > a.sessionTTL {
		delete(a.sessions, sid)
		found = false
	}
	if found {
		stored.LastAccess = now
		a.sessions[sid] = stored
	}
	a.mu.Unlock()
	if !found {
		a.sendSessionRequired(w)
		return currentSession{}, false
	}
	return currentSession{ID: sid, Username: stored.Username, CreatedAt: stored.CreatedAt}, true
}

func (a *App) sendSessionRequired(w http.ResponseWriter) {
	a.sendWML(w,
		`<card id="expired" title="Session Required">`+
			`<p>Your session is invalid or expired.</p>`+
			`<p><a href="/login">Login again</a></p>`+
			`<do type="accept" label="Login"><go href="/login"/></do>`+
			`</card>`,
		http.StatusUnauthorized,
	)
}

func (a *App) createSession(username string) (string, time.Time, error) {
	now := a.clock()
	a.mu.Lock()
	defer a.mu.Unlock()
	a.sweepExpiredSessionsLocked(now)
	if len(a.sessions) >= a.maxSessions {
		a.evictOldestSessionLocked()
	}
	for attempts := 0; attempts < 4; attempts++ {
		sid, err := a.newID()
		if err != nil {
			return "", time.Time{}, err
		}
		if !validSessionID.MatchString(sid) {
			return "", time.Time{}, errors.New("identifier generator returned an invalid session ID")
		}
		if _, exists := a.sessions[sid]; exists {
			continue
		}
		a.sessions[sid] = session{Username: username, CreatedAt: now, LastAccess: now}
		return sid, now, nil
	}
	return "", time.Time{}, errors.New("identifier generator returned repeated session IDs")
}

func (a *App) sweepExpiredSessionsLocked(now time.Time) {
	for sid, stored := range a.sessions {
		if now.Sub(stored.LastAccess) > a.sessionTTL {
			delete(a.sessions, sid)
		}
	}
}

func (a *App) evictOldestSessionLocked() {
	var oldestID string
	var oldest time.Time
	for sid, stored := range a.sessions {
		if oldestID == "" || stored.LastAccess.Before(oldest) ||
			(stored.LastAccess.Equal(oldest) && sid < oldestID) {
			oldestID = sid
			oldest = stored.LastAccess
		}
	}
	if oldestID != "" {
		delete(a.sessions, oldestID)
	}
}

func (a *App) sendWML(w http.ResponseWriter, cards string, status int) {
	setWMLHeaders(w.Header())
	w.WriteHeader(status)
	_, _ = fmt.Fprintf(w,
		"<?xml version=\"1.0\"?>\n<!DOCTYPE wml PUBLIC \"-//WAPFORUM//DTD WML %s//EN\" \"http://www.wapforum.org/DTD/wml_%s.xml\">\n<wml>\n%s\n</wml>\n",
		a.dtdVersion,
		a.dtdVersion,
		cards,
	)
}

func setWMLHeaders(header http.Header) {
	header.Set("Content-Type", "text/vnd.wap.wml; charset=utf-8")
	header.Set("Cache-Control", "no-store")
	header.Set("X-Content-Type-Options", "nosniff")
}

func randomSessionID() (string, error) {
	bytes := make([]byte, 8)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func validUsername(username string) bool {
	if username == "" || len(username) > maxUsernameBytes || !utf8.ValidString(username) {
		return false
	}
	for _, character := range username {
		if unicode.IsControl(character) {
			return false
		}
	}
	return true
}

func validBoundedID(value string) bool {
	if value == "" || len(value) > 63 || value[0] == '-' || value[len(value)-1] == '-' {
		return false
	}
	for _, character := range value {
		if (character < 'a' || character > 'z') && (character < '0' || character > '9') && character != '-' {
			return false
		}
	}
	return true
}

func parsePage(raw string) int {
	page, err := strconv.Atoi(raw)
	if err != nil || page < 1 {
		return 1
	}
	const maxPage = 1000
	if page > maxPage {
		return maxPage
	}
	return page
}

func normalizedHostSet(hosts []string) map[string]bool {
	result := make(map[string]bool)
	for _, host := range hosts {
		if normalized := normalizedRequestHost(host); normalized != "" {
			result[normalized] = true
		}
	}
	return result
}

func addHostProfiles(profiles map[string]string, hosts []string, profile string) {
	for _, host := range hosts {
		if normalized := normalizedRequestHost(host); normalized != "" {
			profiles[normalized] = profile
		}
	}
}

func normalizedRequestHost(host string) string {
	host = strings.TrimSpace(strings.ToLower(host))
	if parsedHost, _, err := net.SplitHostPort(host); err == nil {
		return strings.TrimSuffix(parsedHost, ".")
	}
	return strings.TrimSuffix(host, ".")
}
