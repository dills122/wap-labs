package origin

import (
	"bytes"
	"context"
	"encoding/json"
	"encoding/xml"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"slices"
	"strings"
	"sync"
	"testing"
	"time"
)

var fixedTime = time.Date(2026, time.July, 26, 12, 34, 56, 0, time.UTC)

type testClock struct {
	mu  sync.Mutex
	now time.Time
}

func (clock *testClock) Now() time.Time {
	clock.mu.Lock()
	defer clock.mu.Unlock()
	return clock.now
}

func (clock *testClock) Advance(duration time.Duration) {
	clock.mu.Lock()
	clock.now = clock.now.Add(duration)
	clock.mu.Unlock()
}

func newTestApp(t *testing.T, mutate func(*Config)) (*App, *testClock) {
	t.Helper()
	clock := &testClock{now: fixedTime}
	config := Config{
		Clock: clock.Now,
		NewID: func() (string, error) { return "0123456789abcdef", nil },
	}
	if mutate != nil {
		mutate(&config)
	}
	app, err := New(config)
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}
	return app, clock
}

func perform(handler http.Handler, method, target, body, contentType string) *httptest.ResponseRecorder {
	request := httptest.NewRequest(method, target, strings.NewReader(body))
	if contentType != "" {
		request.Header.Set("Content-Type", contentType)
	}
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, request)
	return response
}

func embeddedExampleNames(t *testing.T) []string {
	t.Helper()
	entries, err := exampleFiles.ReadDir("routes")
	if err != nil {
		t.Fatal(err)
	}
	names := make([]string, 0, len(entries))
	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".wml") {
			names = append(names, entry.Name())
		}
	}
	return names
}

func registerAndLogin(t *testing.T, app *App, username string) string {
	t.Helper()
	handler := app.Handler()
	register := perform(handler, http.MethodPost, "/register", "username="+username+"&pin=1234", "application/x-www-form-urlencoded")
	if register.Code != http.StatusOK || !strings.Contains(register.Body.String(), `id="register-ok"`) {
		t.Fatalf("register response = %d %s", register.Code, register.Body.String())
	}
	login := perform(handler, http.MethodPost, "/login", "username="+username+"&pin=1234", "application/x-www-form-urlencoded")
	if login.Code != http.StatusOK || !strings.Contains(login.Body.String(), `id="login-ok"`) {
		t.Fatalf("login response = %d %s", login.Code, login.Body.String())
	}
	return "0123456789abcdef"
}

func TestNewValidatesDTDVersion(t *testing.T) {
	for _, version := range []string{"1.1", "1.2", "1.3"} {
		t.Run(version, func(t *testing.T) {
			app, err := New(Config{DTDVersion: version})
			if err != nil || app.dtdVersion != version {
				t.Fatalf("New(%q) = %#v, %v", version, app, err)
			}
		})
	}
	if _, err := New(Config{DTDVersion: "2.0"}); err == nil {
		t.Fatal("New() accepted an unsupported DTD")
	}
}

func TestNewValidatesOptionalOriginInstanceID(t *testing.T) {
	for _, valid := range []string{"", "origin-run-7", strings.Repeat("a", 63)} {
		if _, err := New(Config{OriginInstanceID: valid}); err != nil {
			t.Fatalf("New() rejected origin instance %q: %v", valid, err)
		}
	}
	for _, invalid := range []string{"UPPER", "../escape", "has_underscore", strings.Repeat("a", 64)} {
		if _, err := New(Config{OriginInstanceID: invalid}); err == nil {
			t.Fatalf("New() accepted invalid origin instance %q", invalid)
		}
	}
}

func TestNewRequiresRunIdentityForE2EFixtureMode(t *testing.T) {
	if _, err := New(Config{E2EFixtureMode: true}); err == nil || !strings.Contains(err.Error(), "WML_ORIGIN_INSTANCE_ID") {
		t.Fatalf("New() fixture mode error = %v, want missing run identity", err)
	}
	if _, err := New(Config{E2EFixtureMode: true, OriginInstanceID: "origin-run-7"}); err != nil {
		t.Fatalf("New() rejected fixture mode with run identity: %v", err)
	}
}

func TestE2EActionCorrelationIsDisabledByDefault(t *testing.T) {
	app, _ := newTestApp(t, nil)

	form := perform(app.Handler(), http.MethodGet, "/register?e2e_action=bad!", "", "")
	if form.Code != http.StatusOK {
		t.Fatalf("ordinary GET /register status = %d", form.Code)
	}
	if strings.Contains(form.Body.String(), "e2e_action") {
		t.Fatalf("ordinary origin exposed fixture correlation: %s", form.Body.String())
	}
	oracle := perform(app.InternalHandler(), http.MethodGet, "/e2e/actions/register-flow-a1", "", "")
	if oracle.Code != http.StatusNotFound {
		t.Fatalf("ordinary origin oracle status = %d, want 404", oracle.Code)
	}
	slow := perform(app.Handler(), http.MethodGet, "/e2e/navigation/slow-case-a1/slow.wml", "", "")
	if slow.Code != http.StatusNotFound {
		t.Fatalf("ordinary origin slow fixture status = %d, want 404", slow.Code)
	}
}

func TestE2ESlowNavigationRecordsOneSuccessfulRequest(t *testing.T) {
	app, _ := newTestApp(t, func(config *Config) {
		config.E2EFixtureMode = true
		config.OriginInstanceID = "origin-run-7"
		config.E2ENavigationDelay = time.Millisecond
	})

	response := perform(app.Handler(), http.MethodGet, "/e2e/navigation/slow-case-a1/slow.wml", "", "")
	if response.Code != http.StatusOK || !strings.Contains(response.Body.String(), "Delayed navigation completed.") {
		t.Fatalf("slow navigation response = %d %s", response.Code, response.Body.String())
	}
	assertActionOracle(t, app, "slow-case-a1", "navigation", 1, "success")
}

func TestE2ESlowNavigationRejectsInvalidActionID(t *testing.T) {
	app, _ := newTestApp(t, func(config *Config) {
		config.E2EFixtureMode = true
		config.OriginInstanceID = "origin-run-7"
	})

	response := perform(app.Handler(), http.MethodGet, "/e2e/navigation/not-valid/slow.wml", "", "")
	if response.Code != http.StatusBadRequest {
		t.Fatalf("invalid slow navigation action status = %d, want 400", response.Code)
	}
}

func TestE2ESlowNavigationRecordsClientCancellation(t *testing.T) {
	app, _ := newTestApp(t, func(config *Config) {
		config.E2EFixtureMode = true
		config.OriginInstanceID = "origin-run-7"
		config.E2ENavigationDelay = time.Minute
	})
	request := httptest.NewRequest(
		http.MethodGet,
		"/e2e/navigation/cancel-case-a1/slow.wml",
		nil,
	)
	ctx, cancel := context.WithCancel(request.Context())
	cancel()
	response := httptest.NewRecorder()

	app.Handler().ServeHTTP(response, request.WithContext(ctx))

	assertActionOracle(t, app, "cancel-case-a1", "navigation", 1, "cancelled")
}

func TestFormsReloadSameDeckBeforeSubmittingPostfields(t *testing.T) {
	app, _ := newTestApp(t, nil)

	for _, path := range []string{"/register", "/login"} {
		t.Run(path, func(t *testing.T) {
			response := perform(app.Handler(), http.MethodGet, path, "", "")
			if response.Code != http.StatusOK {
				t.Fatalf("GET %s status = %d", path, response.Code)
			}
			body := response.Body.String()
			if !strings.Contains(body, `method="post" cache-control="no-cache" href="`+path+`"`) {
				t.Fatalf("GET %s omitted same-deck reload policy: %s", path, body)
			}
			for _, name := range []string{"username", "pin"} {
				if !strings.Contains(body, `<postfield name="`+name+`" value="$(`+name+`)"/>`) {
					t.Fatalf("GET %s omitted %s postfield: %s", path, name, body)
				}
			}
		})
	}
}

func TestE2EFormGETPreservesStrictActionIDIntoPOST(t *testing.T) {
	app, _ := newTestApp(t, func(config *Config) {
		config.E2EFixtureMode = true
		config.OriginInstanceID = "origin-run-7"
	})

	for _, test := range []struct {
		path string
		id   string
	}{
		{path: "/register", id: "register-flow-a1"},
		{path: "/login", id: "login-flow-a1"},
	} {
		t.Run(test.path, func(t *testing.T) {
			response := perform(app.Handler(), http.MethodGet, test.path+"?e2e_action="+test.id, "", "")
			if response.Code != http.StatusOK {
				t.Fatalf("GET %s status = %d", test.path, response.Code)
			}
			want := `method="post" cache-control="no-cache" href="` + test.path + `?e2e_action=` + test.id + `"`
			if !strings.Contains(response.Body.String(), want) {
				t.Fatalf("GET %s did not preserve a reload-safe action ID: %s", test.path, response.Body.String())
			}
		})
	}
}

func TestE2EActionCorrelationRejectsInvalidAndOversizedIDs(t *testing.T) {
	app, _ := newTestApp(t, func(config *Config) {
		config.E2EFixtureMode = true
		config.OriginInstanceID = "origin-run-7"
	})

	invalid := []string{
		"UPPER-a1",
		"escape/route-a1",
		"underscore_a1",
		"missing-attempt",
		"leading-zero-a01",
		"zero-a0",
		"too-many-a10000",
		strings.Repeat("a", 58) + "-a1234",
	}
	for _, actionID := range invalid {
		t.Run(actionID, func(t *testing.T) {
			get := perform(app.Handler(), http.MethodGet, "/register?e2e_action="+actionID, "", "")
			if get.Code != http.StatusBadRequest {
				t.Fatalf("invalid action GET status = %d, want 400", get.Code)
			}
			post := perform(app.Handler(), http.MethodPost, "/register?e2e_action="+actionID, "username=demo&pin=1234", "application/x-www-form-urlencoded")
			if post.Code != http.StatusBadRequest {
				t.Fatalf("invalid action POST status = %d, want 400", post.Code)
			}
		})
	}
	ambiguous := perform(app.Handler(), http.MethodGet, "/register?e2e_action=valid-a1&e2e_action=valid-a1", "", "")
	if ambiguous.Code != http.StatusBadRequest {
		t.Fatalf("ambiguous action GET status = %d, want 400", ambiguous.Code)
	}
}

func TestE2EValidationAdvancesToFreshAttemptAndCountsEachPOST(t *testing.T) {
	app, _ := newTestApp(t, func(config *Config) {
		config.E2EFixtureMode = true
		config.OriginInstanceID = "origin-run-7"
	})
	handler := app.Handler()

	firstID := "register-flow-a1"
	_ = perform(handler, http.MethodGet, "/register?e2e_action="+firstID, "", "")
	failed := perform(handler, http.MethodPost, "/register?e2e_action="+firstID, "username=canary-user", "application/x-www-form-urlencoded")
	if failed.Code != http.StatusOK || !strings.Contains(failed.Body.String(), `href="/register?e2e_action=register-flow-a2"`) {
		t.Fatalf("validation response did not advance attempt: %d %s", failed.Code, failed.Body.String())
	}
	assertActionOracle(t, app, firstID, "register", 1, "validation")
	assertActionOracle(t, app, "register-flow-a2", "register", 0, "form")

	succeeded := perform(handler, http.MethodPost, "/register?e2e_action=register-flow-a2", "username=canary-user&pin=9876", "application/x-www-form-urlencoded")
	if succeeded.Code != http.StatusOK || !strings.Contains(succeeded.Body.String(), `id="register-ok"`) {
		t.Fatalf("corrected registration response = %d %s", succeeded.Code, succeeded.Body.String())
	}
	assertActionOracle(t, app, firstID, "register", 1, "validation")
	assertActionOracle(t, app, "register-flow-a2", "register", 1, "success")

	duplicate := perform(handler, http.MethodPost, "/register?e2e_action=register-flow-a2", "username=canary-user&pin=9876", "application/x-www-form-urlencoded")
	if duplicate.Code != http.StatusOK {
		t.Fatalf("duplicate POST status = %d", duplicate.Code)
	}
	assertActionOracle(t, app, "register-flow-a2", "register", 2, "validation")

	oracle := perform(app.InternalHandler(), http.MethodGet, "/e2e/actions/register-flow-a2", "", "")
	for _, secret := range []string{"canary-user", "9876", "username", "pin"} {
		if strings.Contains(strings.ToLower(oracle.Body.String()), secret) {
			t.Fatalf("action oracle leaked %q: %s", secret, oracle.Body.String())
		}
	}
}

func TestE2ELoginValidationAdvancesAttempt(t *testing.T) {
	app, _ := newTestApp(t, func(config *Config) {
		config.E2EFixtureMode = true
		config.OriginInstanceID = "origin-run-7"
	})

	failed := perform(app.Handler(), http.MethodPost, "/login?e2e_action=login-flow-a1", "username=unknown&pin=9876", "application/x-www-form-urlencoded")
	if failed.Code != http.StatusOK || !strings.Contains(failed.Body.String(), `href="/login?e2e_action=login-flow-a2"`) {
		t.Fatalf("login validation response did not advance attempt: %d %s", failed.Code, failed.Body.String())
	}
	assertActionOracle(t, app, "login-flow-a1", "login", 1, "validation")
	assertActionOracle(t, app, "login-flow-a2", "login", 0, "form")
}

func TestE2EActionCorrelationCountsRejectedPOSTAttempts(t *testing.T) {
	app, _ := newTestApp(t, func(config *Config) {
		config.E2EFixtureMode = true
		config.OriginInstanceID = "origin-run-7"
	})

	response := perform(app.Handler(), http.MethodPost, "/register?e2e_action=register-rejected-a1", `{}`, "application/json")
	if response.Code != http.StatusUnsupportedMediaType {
		t.Fatalf("rejected POST status = %d", response.Code)
	}
	assertActionOracle(t, app, "register-rejected-a1", "register", 1, "request-rejected")
}

func TestE2EActionCorrelationIsBoundedAndExpires(t *testing.T) {
	app, clock := newTestApp(t, func(config *Config) {
		config.E2EFixtureMode = true
		config.OriginInstanceID = "origin-run-7"
		config.MaxE2EActions = 2
		config.E2EActionTTL = time.Minute
	})

	for _, id := range []string{"first-a1", "second-a1"} {
		response := perform(app.Handler(), http.MethodGet, "/register?e2e_action="+id, "", "")
		if response.Code != http.StatusOK {
			t.Fatalf("GET action %s status = %d", id, response.Code)
		}
	}
	full := perform(app.Handler(), http.MethodGet, "/register?e2e_action=third-a1", "", "")
	if full.Code != http.StatusServiceUnavailable {
		t.Fatalf("over-cap action status = %d, want 503", full.Code)
	}

	clock.Advance(time.Minute + time.Nanosecond)
	expired := perform(app.InternalHandler(), http.MethodGet, "/e2e/actions/first-a1", "", "")
	if expired.Code != http.StatusNotFound {
		t.Fatalf("expired action status = %d, want 404", expired.Code)
	}
	newAction := perform(app.Handler(), http.MethodGet, "/register?e2e_action=third-a1", "", "")
	if newAction.Code != http.StatusOK {
		t.Fatalf("new action after expiry status = %d", newAction.Code)
	}
}

func TestE2EConcurrentActionsHaveIndependentCounts(t *testing.T) {
	app, _ := newTestApp(t, func(config *Config) {
		config.E2EFixtureMode = true
		config.OriginInstanceID = "origin-run-7"
	})
	handler := app.Handler()
	ids := []string{"parallel-one-a1", "parallel-two-a1"}
	for _, id := range ids {
		_ = perform(handler, http.MethodGet, "/register?e2e_action="+id, "", "")
	}

	var wait sync.WaitGroup
	for index, id := range ids {
		wait.Add(1)
		go func(index int, id string) {
			defer wait.Done()
			body := fmt.Sprintf("username=parallel-%d&pin=1234", index)
			_ = perform(handler, http.MethodPost, "/register?e2e_action="+id, body, "application/x-www-form-urlencoded")
		}(index, id)
	}
	wait.Wait()
	for _, id := range ids {
		assertActionOracle(t, app, id, "register", 1, "success")
	}
}

func assertActionOracle(t *testing.T, app *App, actionID, kind string, count int, phase string) {
	t.Helper()
	response := perform(app.InternalHandler(), http.MethodGet, "/e2e/actions/"+actionID, "", "")
	if response.Code != http.StatusOK {
		t.Fatalf("action oracle %s status = %d: %s", actionID, response.Code, response.Body.String())
	}
	var got struct {
		ActionID string `json:"actionId"`
		Kind     string `json:"kind"`
		Count    int    `json:"count"`
		Phase    string `json:"phase"`
	}
	if err := json.Unmarshal(response.Body.Bytes(), &got); err != nil {
		t.Fatalf("decode action oracle %s: %v", actionID, err)
	}
	var fields map[string]json.RawMessage
	if err := json.Unmarshal(response.Body.Bytes(), &fields); err != nil {
		t.Fatalf("decode action oracle fields %s: %v", actionID, err)
	}
	if len(fields) != 4 {
		t.Fatalf("action oracle %s exposed fields %v, want exactly four bounded fields", actionID, fields)
	}
	for _, name := range []string{"actionId", "kind", "count", "phase"} {
		if _, exists := fields[name]; !exists {
			t.Fatalf("action oracle %s omitted %q: %v", actionID, name, fields)
		}
	}
	if got.ActionID != actionID || got.Kind != kind || got.Count != count || got.Phase != phase {
		t.Fatalf("action oracle %s = %#v, want kind=%q count=%d phase=%q", actionID, got, kind, count, phase)
	}
}

func TestOriginInstanceIdentityIsPresentOnPublicAndInternalSurfaces(t *testing.T) {
	app, _ := newTestApp(t, func(config *Config) {
		config.OriginInstanceID = "origin-run-7"
	})

	for _, path := range []string{"/", "/examples/interop-check.wml", "/gateway"} {
		public := perform(app.Handler(), http.MethodGet, path, "", "")
		if got := public.Header().Values("X-Waves-Origin-Instance"); !slices.Equal(got, []string{"origin-run-7"}) {
			t.Fatalf("origin response header for %s = %q", path, got)
		}
	}
	health := perform(app.InternalHandler(), http.MethodGet, "/health", "", "")
	if got := health.Header().Values("X-Waves-Origin-Instance"); !slices.Equal(got, []string{"origin-run-7"}) {
		t.Fatalf("internal health origin response header = %q", got)
	}
	if !strings.Contains(health.Body.String(), `"originInstanceId":"origin-run-7"`) {
		t.Fatalf("health omits origin instance: %s", health.Body.String())
	}
	metrics := perform(app.InternalHandler(), http.MethodGet, "/metrics", "", "")
	if got := metrics.Header().Values("X-Waves-Origin-Instance"); !slices.Equal(got, []string{"origin-run-7"}) {
		t.Fatalf("internal metrics origin response header = %q", got)
	}
	if !strings.Contains(metrics.Body.String(), `origin_instance_info{id="origin-run-7"} 1`) {
		t.Fatalf("metrics omit origin instance: %s", metrics.Body.String())
	}
	oracle := perform(app.InternalHandler(), http.MethodGet, "/e2e/actions/missing-action", "", "")
	if got := oracle.Header().Values("X-Waves-Origin-Instance"); !slices.Equal(got, []string{"origin-run-7"}) {
		t.Fatalf("internal action oracle origin response header = %q", got)
	}
}

func TestHomeGoldenAndHeaders(t *testing.T) {
	app, _ := newTestApp(t, nil)
	response := perform(app.Handler(), http.MethodGet, "/", "", "")
	want, err := os.ReadFile("testdata/home.golden.wml")
	if err != nil {
		t.Fatal(err)
	}
	if response.Code != http.StatusOK {
		t.Fatalf("status = %d", response.Code)
	}
	if got := response.Header().Get("Content-Type"); got != "text/vnd.wap.wml; charset=utf-8" {
		t.Fatalf("Content-Type = %q", got)
	}
	if got := response.Header().Get("Cache-Control"); got != "no-store" {
		t.Fatalf("Cache-Control = %q", got)
	}
	if !bytes.Equal(response.Body.Bytes(), want) {
		t.Fatalf("body differs from golden\ngot:\n%s\nwant:\n%s", response.Body.Bytes(), want)
	}

	head := perform(app.Handler(), http.MethodHead, "/", "", "")
	if head.Code != http.StatusOK || head.Header().Get("Content-Type") != "text/vnd.wap.wml; charset=utf-8" {
		t.Fatalf("HEAD response = %d, %q", head.Code, head.Header().Get("Content-Type"))
	}
}

func TestHostProfilesAndAllowlist(t *testing.T) {
	app, _ := newTestApp(t, func(config *Config) {
		config.AllowedHosts = []string{"home.test", "forms.test", "interop.test"}
		config.HomeHosts = []string{"home.test"}
		config.FormsHosts = []string{"forms.test"}
		config.InteropHosts = []string{"interop.test"}
	})

	tests := []struct {
		host string
		want string
		code int
	}{
		{"home.test", `id="home"`, http.StatusOK},
		{"forms.test", `id="forms"`, http.StatusOK},
		{"interop.test", `id="interop"`, http.StatusOK},
		{"unknown.test", `title="Unknown Host"`, http.StatusMisdirectedRequest},
	}
	for _, test := range tests {
		t.Run(test.host, func(t *testing.T) {
			request := httptest.NewRequest(http.MethodGet, "http://"+test.host+"/", nil)
			response := httptest.NewRecorder()
			app.Handler().ServeHTTP(response, request)
			if response.Code != test.code || !strings.Contains(response.Body.String(), test.want) {
				t.Fatalf("response = %d %s", response.Code, response.Body.String())
			}
		})
	}

	for _, test := range []struct {
		path string
		want string
	}{
		{"/__lab/home/", `id="home"`},
		{"/__lab/forms/", `id="forms"`},
		{"/__lab/interop/", `id="interop"`},
	} {
		request := httptest.NewRequest(http.MethodGet, "http://home.test"+test.path, nil)
		response := httptest.NewRecorder()
		app.Handler().ServeHTTP(response, request)
		if response.Code != http.StatusOK || !strings.Contains(response.Body.String(), test.want) {
			t.Errorf("GET %s = %d %s", test.path, response.Code, response.Body.String())
		}
	}
}

func TestHostProfilesLinkToTheirExamples(t *testing.T) {
	app, _ := newTestApp(t, func(config *Config) {
		config.AllowedHosts = []string{"home.test", "forms.test", "interop.test"}
		config.HomeHosts = []string{"home.test"}
		config.FormsHosts = []string{"forms.test"}
		config.InteropHosts = []string{"interop.test"}
	})

	for _, test := range []struct {
		host string
		link string
	}{
		{"home.test", `/examples/pocket-portal.wml`},
		{"forms.test", `/examples/preferences.wml`},
		{"interop.test", `/examples/interop-check.wml`},
	} {
		request := httptest.NewRequest(http.MethodGet, "http://"+test.host+"/", nil)
		response := httptest.NewRecorder()
		app.Handler().ServeHTTP(response, request)
		if response.Code != http.StatusOK || !strings.Contains(response.Body.String(), `href="`+test.link+`"`) {
			t.Errorf("GET http://%s/ does not link %s: %d %s", test.host, test.link, response.Code, response.Body.String())
		}
	}
}

func TestAuthFormsRenderPINAsPasswordInput(t *testing.T) {
	app, _ := newTestApp(t, nil)
	for _, path := range []string{"/login", "/register"} {
		t.Run(path, func(t *testing.T) {
			response := perform(app.Handler(), http.MethodGet, path, "", "")
			if response.Code != http.StatusOK {
				t.Fatalf("GET %s status = %d", path, response.Code)
			}
			if !strings.Contains(response.Body.String(), `<input name="pin" type="password"`) {
				t.Fatalf("GET %s PIN input is not a password control", path)
			}
		})
	}
}

func TestRegistrationLoginAndProtectedRoutes(t *testing.T) {
	app, _ := newTestApp(t, nil)
	sid := registerAndLogin(t, app, "demo")
	handler := app.Handler()

	for _, test := range []struct {
		path string
		want string
	}{
		{"/portal?sid=" + sid, "Welcome, demo"},
		{"/profile?sid=" + sid, "Account created: 2026-07-26T12:34:56Z"},
		{"/messages?sid=" + sid + "&page=1", "Gateway notice"},
		{"/messages?sid=" + sid + "&page=2", "Reminder"},
		{"/messages?sid=" + sid + "&page=3", "Exercise"},
		{"/messages?sid=" + sid + "&page=999", "No messages on this page"},
	} {
		response := perform(handler, http.MethodGet, test.path, "", "")
		if response.Code != http.StatusOK || !strings.Contains(response.Body.String(), test.want) {
			t.Errorf("GET %s = %d %s", test.path, response.Code, response.Body.String())
		}
	}

	logout := perform(handler, http.MethodGet, "/logout?sid="+sid, "", "")
	if logout.Code != http.StatusOK || !strings.Contains(logout.Body.String(), `id="logout"`) {
		t.Fatalf("logout = %d %s", logout.Code, logout.Body.String())
	}
	expired := perform(handler, http.MethodGet, "/portal?sid="+sid, "", "")
	if expired.Code != http.StatusUnauthorized || !strings.Contains(expired.Body.String(), `id="expired"`) {
		t.Fatalf("expired = %d %s", expired.Code, expired.Body.String())
	}
}

func TestLoginRejectsUnknownUserAndWrongPIN(t *testing.T) {
	app, _ := newTestApp(t, nil)
	handler := app.Handler()

	register := perform(handler, http.MethodPost, "/register", "username=demo&pin=1234", "application/x-www-form-urlencoded")
	if register.Code != http.StatusOK || !strings.Contains(register.Body.String(), `id="register-ok"`) {
		t.Fatalf("register = %d %s", register.Code, register.Body.String())
	}

	tests := []struct {
		name string
		body string
	}{
		{"unknown user", "username=nobody&pin=1234"},
		{"wrong pin", "username=demo&pin=9999"},
		{"shorter pin", "username=demo&pin=123"},
		{"longer pin", "username=demo&pin=12345"},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			response := perform(handler, http.MethodPost, "/login", test.body, "application/x-www-form-urlencoded")
			if response.Code != http.StatusOK || !strings.Contains(response.Body.String(), "Invalid username or PIN") {
				t.Fatalf("login case %q = %d %s", test.name, response.Code, response.Body.String())
			}
		})
	}

	if got := app.counts.loginFailure.Load(); got != uint64(len(tests)) {
		t.Fatalf("login failure count = %d, want %d", got, len(tests))
	}
	if got := app.counts.loginSuccess.Load(); got != 0 {
		t.Fatalf("login success count after failures = %d, want 0", got)
	}

	response := perform(handler, http.MethodPost, "/login", "username=demo&pin=1234", "application/x-www-form-urlencoded")
	if response.Code != http.StatusOK || !strings.Contains(response.Body.String(), `id="login-ok"`) {
		t.Fatalf("valid login = %d %s", response.Code, response.Body.String())
	}
	if got := app.counts.loginFailure.Load(); got != uint64(len(tests)) {
		t.Fatalf("login failure count after success = %d, want %d", got, len(tests))
	}
	if got := app.counts.loginSuccess.Load(); got != 1 {
		t.Fatalf("login success count = %d, want 1", got)
	}
}

func TestConstantTimePINCompare(t *testing.T) {
	tests := []struct {
		name      string
		stored    string
		submitted string
		want      int
	}{
		{"four-byte match", "1234", "1234", 1},
		{"six-byte match", "123456", "123456", 1},
		{"different content", "1234", "4321", 0},
		{"shorter submission", "1234", "123", 0},
		{"longer submission", "1234", "12345", 0},
		{"embedded padding byte", "1234", "1234\x00", 0},
		{"unknown account value", "", "1234", 0},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if got := constantTimePINCompare(test.stored, test.submitted); got != test.want {
				t.Fatalf("constantTimePINCompare() = %d, want %d", got, test.want)
			}
		})
	}
}

func TestValidationAndEscaping(t *testing.T) {
	app, _ := newTestApp(t, nil)
	handler := app.Handler()

	missing := perform(handler, http.MethodPost, "/register", "username=demo", "application/x-www-form-urlencoded")
	if missing.Code != http.StatusOK || !strings.Contains(missing.Body.String(), "Username and PIN are required") {
		t.Fatalf("missing fields = %d %s", missing.Code, missing.Body.String())
	}
	badPIN := perform(handler, http.MethodPost, "/register", "username=demo&pin=12ab", "application/x-www-form-urlencoded")
	if badPIN.Code != http.StatusOK || !strings.Contains(badPIN.Body.String(), "PIN must be 4-6 digits") {
		t.Fatalf("bad PIN = %d %s", badPIN.Code, badPIN.Body.String())
	}
	escaped := perform(handler, http.MethodPost, "/register", "username=a%26b%3Cc%3E%22%27&pin=1234", "application/x-www-form-urlencoded")
	if escaped.Code != http.StatusOK || !strings.Contains(escaped.Body.String(), "a&amp;b&lt;c&gt;&#34;&#39;") {
		t.Fatalf("escaped username = %d %s", escaped.Code, escaped.Body.String())
	}
	wrongType := perform(handler, http.MethodPost, "/login", `{}`, "application/json")
	if wrongType.Code != http.StatusUnsupportedMediaType {
		t.Fatalf("wrong content type = %d", wrongType.Code)
	}
	tooLarge := perform(handler, http.MethodPost, "/register", strings.Repeat("x", 9000), "application/x-www-form-urlencoded")
	if tooLarge.Code != http.StatusRequestEntityTooLarge {
		t.Fatalf("large body = %d", tooLarge.Code)
	}
}

func TestSessionTTLAndBounds(t *testing.T) {
	ids := []string{"0000000000000001", "0000000000000002"}
	var idIndex int
	app, clock := newTestApp(t, func(config *Config) {
		config.MaxUsers = 2
		config.MaxSessions = 1
		config.NewID = func() (string, error) {
			id := ids[idIndex]
			idIndex++
			return id, nil
		}
	})
	handler := app.Handler()

	registerAndLoginWithID(t, handler, "first", ids[0])
	clock.Advance(defaultSessionTTL)
	atBoundary := perform(handler, http.MethodGet, "/portal?sid="+ids[0], "", "")
	if atBoundary.Code != http.StatusOK {
		t.Fatalf("session expired at TTL boundary: %d", atBoundary.Code)
	}
	clock.Advance(defaultSessionTTL + time.Nanosecond)
	expired := perform(handler, http.MethodGet, "/portal?sid="+ids[0], "", "")
	if expired.Code != http.StatusUnauthorized {
		t.Fatalf("session remained valid beyond TTL: %d", expired.Code)
	}

	registerAndLoginWithID(t, handler, "second", ids[1])
	full := perform(handler, http.MethodPost, "/register", "username=third&pin=1234", "application/x-www-form-urlencoded")
	if full.Code != http.StatusServiceUnavailable {
		t.Fatalf("user limit response = %d", full.Code)
	}
}

func registerAndLoginWithID(t *testing.T, handler http.Handler, username, sid string) {
	t.Helper()
	register := perform(handler, http.MethodPost, "/register", "username="+username+"&pin=1234", "application/x-www-form-urlencoded")
	if register.Code != http.StatusOK {
		t.Fatalf("register %q = %d", username, register.Code)
	}
	login := perform(handler, http.MethodPost, "/login", "username="+username+"&pin=1234", "application/x-www-form-urlencoded")
	if login.Code != http.StatusOK || !strings.Contains(login.Body.String(), sid) {
		t.Fatalf("login %q = %d %s", username, login.Code, login.Body.String())
	}
}

func TestExamplesAndClosedRoutes(t *testing.T) {
	app, _ := newTestApp(t, nil)
	handler := app.Handler()

	for _, file := range embeddedExampleNames(t) {
		response := perform(handler, http.MethodGet, "/examples/"+file, "", "")
		want, err := exampleFiles.ReadFile("routes/" + file)
		if err != nil {
			t.Fatal(err)
		}
		want, err = configureExampleDTD(want, app.dtdVersion)
		if err != nil {
			t.Fatal(err)
		}
		if response.Code != http.StatusOK || !bytes.Equal(response.Body.Bytes(), want) {
			t.Errorf("example %s differs: %d", file, response.Code)
		}
		repeat := perform(handler, http.MethodGet, "/examples/"+file, "", "")
		if !bytes.Equal(response.Body.Bytes(), repeat.Body.Bytes()) {
			t.Errorf("example %s is not deterministic", file)
		}
	}
	invalid := perform(handler, http.MethodGet, "/examples/nope.txt", "", "")
	if invalid.Code != http.StatusBadRequest {
		t.Fatalf("invalid example = %d", invalid.Code)
	}
	missing := perform(handler, http.MethodGet, "/examples/missing.wml", "", "")
	if missing.Code != http.StatusInternalServerError {
		t.Fatalf("missing example = %d", missing.Code)
	}
	for _, path := range []string{"/gateway", "/gateway/https://example.com", "/viewer", "/emulator", "/health", "/metrics"} {
		response := perform(handler, http.MethodGet, path, "", "")
		if response.Code != http.StatusNotFound {
			t.Errorf("GET %s = %d, want 404", path, response.Code)
		}
	}
	wrongMethod := perform(handler, http.MethodPut, "/login", "", "")
	if wrongMethod.Code != http.StatusMethodNotAllowed {
		t.Fatalf("PUT /login = %d", wrongMethod.Code)
	}
}

func TestExamplesUseConfiguredDTDVersion(t *testing.T) {
	for _, version := range []string{"1.1", "1.2", "1.3"} {
		t.Run(version, func(t *testing.T) {
			app, _ := newTestApp(t, func(config *Config) { config.DTDVersion = version })
			for _, file := range embeddedExampleNames(t) {
				response := perform(app.Handler(), http.MethodGet, "/examples/"+file, "", "")
				if response.Code != http.StatusOK {
					t.Fatalf("GET /examples/%s = %d", file, response.Code)
				}
				body := response.Body.String()
				if !strings.Contains(body, `-//WAPFORUM//DTD WML `+version+`//EN`) {
					t.Errorf("example %s public identifier does not use WML %s: %s", file, version, body)
				}
				if !strings.Contains(body, `http://www.wapforum.org/DTD/wml_`+version+`.xml`) {
					t.Errorf("example %s system identifier does not use WML %s: %s", file, version, body)
				}
			}
		})
	}
}

func TestEmbeddedExamplesAreWML13WellFormedLinkedAndBounded(t *testing.T) {
	names := embeddedExampleNames(t)
	if len(names) != 6 {
		t.Fatalf("embedded example count = %d, want 6: %v", len(names), names)
	}
	for _, file := range names {
		body, err := exampleFiles.ReadFile("routes/" + file)
		if err != nil {
			t.Fatal(err)
		}
		if len(body) > maxExampleBytes {
			t.Errorf("example %s = %d bytes, limit %d", file, len(body), maxExampleBytes)
		}
		if !strings.Contains(string(body), `-//WAPFORUM//DTD WML 1.3//EN`) ||
			!strings.Contains(string(body), `http://www.wapforum.org/DTD/wml_1.3.xml`) {
			t.Errorf("example %s does not declare the canonical embedded WML 1.3 doctype", file)
		}
		decoder := xml.NewDecoder(bytes.NewReader(body))
		for {
			if _, err = decoder.Token(); err == io.EOF {
				break
			}
			if err != nil {
				t.Errorf("example %s is not well-formed XML: %v", file, err)
				break
			}
		}
	}

	index, err := exampleFiles.ReadFile("routes/index.wml")
	if err != nil {
		t.Fatal(err)
	}
	for _, link := range []string{
		`href="/examples/pocket-portal.wml"`,
		`href="/examples/preferences.wml"`,
		`href="/examples/interop-check.wml"`,
	} {
		if !strings.Contains(string(index), link) {
			t.Errorf("example directory missing stable link %s", link)
		}
	}
}

func TestNewExamplesContainExpectedDeterministicFlows(t *testing.T) {
	for _, test := range []struct {
		file    string
		markers []string
	}{
		{"pocket-portal.wml", []string{`id="portal"`, `id="directory"`, `<table columns="2"`, `<prev/>`}},
		{"preferences.wml", []string{`id="preferences"`, `<input name="alias"`, `<select name="layout"`, `href="#saved"`, `Nothing is stored or sent.`}},
		{"interop-check.wml", []string{`id="wire-check"`, `Public ID</td><td>10`, `Cache</td><td>no-store`, `?probe=repeat`, `W13-A`}},
	} {
		body, err := exampleFiles.ReadFile("routes/" + test.file)
		if err != nil {
			t.Fatal(err)
		}
		for _, marker := range test.markers {
			if !strings.Contains(string(body), marker) {
				t.Errorf("example %s missing marker %q", test.file, marker)
			}
		}
	}
}

func TestInternalHealthMetricsAndRedactedLogs(t *testing.T) {
	var logOutput bytes.Buffer
	app, _ := newTestApp(t, func(config *Config) {
		config.Logger = slog.New(slog.NewJSONHandler(&logOutput, nil))
	})
	public := app.Handler()
	internal := app.InternalHandler()

	_ = perform(public, http.MethodGet, "/portal?sid=0123456789abcdef&password=secret", "", "")
	logText := logOutput.String()
	for _, secret := range []string{"0123456789abcdef", "password", "secret"} {
		if strings.Contains(logText, secret) {
			t.Fatalf("log contains redacted value %q: %s", secret, logText)
		}
	}
	if !strings.Contains(logText, `"path":"/portal"`) {
		t.Fatalf("log omits safe path: %s", logText)
	}

	health := perform(internal, http.MethodGet, "/health", "", "")
	if health.Code != http.StatusOK || health.Body.String() != "{\"status\":\"ok\",\"service\":\"wml-server\",\"timestamp\":\"2026-07-26T12:34:56Z\"}\n" {
		t.Fatalf("health = %d %s", health.Code, health.Body.String())
	}
	metrics := perform(internal, http.MethodGet, "/metrics", "", "")
	for _, metric := range []string{"requests_total 1", "users_total 0", "sessions_total 0", "login_failure_total 0"} {
		if !strings.Contains(metrics.Body.String(), metric) {
			t.Errorf("metrics missing %q: %s", metric, metrics.Body.String())
		}
	}
}

func TestConcurrentRegistrationIsBounded(t *testing.T) {
	app, _ := newTestApp(t, func(config *Config) { config.MaxUsers = 8 })
	handler := app.Handler()
	var wait sync.WaitGroup
	for index := 0; index < 32; index++ {
		wait.Add(1)
		go func() {
			defer wait.Done()
			response := perform(handler, http.MethodPost, "/register", "username=same&pin=1234", "application/x-www-form-urlencoded")
			_, _ = io.Copy(io.Discard, response.Result().Body)
		}()
	}
	wait.Wait()
	app.mu.Lock()
	users := len(app.users)
	app.mu.Unlock()
	if users != 1 {
		t.Fatalf("users = %d, want 1", users)
	}
}
