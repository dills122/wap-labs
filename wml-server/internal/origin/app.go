package origin

import (
	"context"
	"crypto/rand"
	"crypto/subtle"
	"embed"
	"encoding/hex"
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
	defaultDTDVersion  = "1.1"
	defaultSessionTTL  = 30 * time.Minute
	defaultMaxUsers    = 128
	defaultMaxSessions = 256
	defaultMaxBody     = int64(8 << 10)
	maxUsernameBytes   = 32
	maxPINBytes        = 6
	maxSessionIDBytes  = 64
	pageSize           = 2
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
	DTDVersion   string
	Clock        func() time.Time
	NewID        func() (string, error)
	Logger       *slog.Logger
	SessionTTL   time.Duration
	MaxUsers     int
	MaxSessions  int
	MaxBody      int64
	AllowedHosts []string
	HomeHosts    []string
	FormsHosts   []string
	InteropHosts []string
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

type counters struct {
	requests      atomic.Uint64
	registered    atomic.Uint64
	loginSuccess  atomic.Uint64
	loginFailure  atomic.Uint64
	requestNumber atomic.Uint64
}

type App struct {
	dtdVersion   string
	clock        func() time.Time
	newID        func() (string, error)
	logger       *slog.Logger
	sessionTTL   time.Duration
	maxUsers     int
	maxSessions  int
	maxBody      int64
	allowedHosts map[string]bool
	hostProfiles map[string]string

	mu       sync.Mutex
	users    map[string]user
	sessions map[string]session
	counts   counters
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
		dtdVersion:   config.DTDVersion,
		clock:        config.Clock,
		newID:        config.NewID,
		logger:       config.Logger,
		sessionTTL:   config.SessionTTL,
		maxUsers:     config.MaxUsers,
		maxSessions:  config.MaxSessions,
		maxBody:      config.MaxBody,
		allowedHosts: allowedHosts,
		hostProfiles: hostProfiles,
		users:        make(map[string]user),
		sessions:     make(map[string]session),
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
	return a.logRequests(a.limitHosts(routeLabProfiles(denyExcludedRoutes(mux))))
}

func (a *App) InternalHandler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", a.health)
	mux.HandleFunc("GET /metrics", a.metrics)
	return mux
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

func (a *App) loginForm(w http.ResponseWriter, _ *http.Request) {
	a.sendWML(w, renderLoginDeck("", ""), http.StatusOK)
}

func (a *App) login(w http.ResponseWriter, r *http.Request) {
	form, ok := a.parseForm(w, r)
	if !ok {
		return
	}
	username := strings.TrimSpace(form.Get("username"))
	pin := strings.TrimSpace(form.Get("pin"))
	if username == "" || pin == "" {
		a.counts.loginFailure.Add(1)
		a.sendWML(w, renderLoginDeck(username, "Username and PIN are required."), http.StatusOK)
		return
	}
	if !validUsername(username) || len(pin) > maxPINBytes {
		a.counts.loginFailure.Add(1)
		a.sendWML(w, renderLoginDeck(username, "Invalid username or PIN."), http.StatusOK)
		return
	}

	a.mu.Lock()
	account, found := a.users[username]
	a.mu.Unlock()
	pinMatches := constantTimePINCompare(account.PIN, pin)
	if pinMatches != 1 || !found {
		a.counts.loginFailure.Add(1)
		a.sendWML(w, renderLoginDeck(username, "Invalid username or PIN."), http.StatusOK)
		return
	}

	sid, createdAt, err := a.createSession(username)
	if err != nil {
		a.logger.Error("session creation failed", "error", err)
		a.sendWML(w, errorCard("Service Busy", "Unable to create a session."), http.StatusServiceUnavailable)
		return
	}
	a.counts.loginSuccess.Add(1)
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

func (a *App) registerForm(w http.ResponseWriter, _ *http.Request) {
	a.sendWML(w, renderRegisterDeck("", ""), http.StatusOK)
}

func (a *App) register(w http.ResponseWriter, r *http.Request) {
	form, ok := a.parseForm(w, r)
	if !ok {
		return
	}
	username := strings.TrimSpace(form.Get("username"))
	pin := strings.TrimSpace(form.Get("pin"))
	if username == "" || pin == "" {
		a.sendWML(w, renderRegisterDeck(username, "Username and PIN are required."), http.StatusOK)
		return
	}
	if !validUsername(username) {
		a.sendWML(w, renderRegisterDeck(username, "Username must be valid text up to 32 bytes."), http.StatusOK)
		return
	}
	if !validPIN.MatchString(pin) {
		a.sendWML(w, renderRegisterDeck(username, "PIN must be 4-6 digits."), http.StatusOK)
		return
	}

	a.mu.Lock()
	if _, exists := a.users[username]; exists {
		a.mu.Unlock()
		a.sendWML(w, renderRegisterDeck(username, "Username already exists."), http.StatusOK)
		return
	}
	if len(a.users) >= a.maxUsers {
		a.mu.Unlock()
		a.sendWML(w, errorCard("Service Busy", "The demo user limit has been reached."), http.StatusServiceUnavailable)
		return
	}
	now := a.clock()
	a.users[username] = user{PIN: pin, CreatedAt: now}
	a.mu.Unlock()

	a.counts.registered.Add(1)
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
