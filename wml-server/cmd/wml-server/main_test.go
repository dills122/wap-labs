package main

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestRunHealthcheck(t *testing.T) {
	tests := []struct {
		name       string
		status     int
		body       string
		wantErrSub string
	}{
		{name: "healthy", status: http.StatusOK, body: `{"status":"ok"}`},
		{name: "bad status", status: http.StatusServiceUnavailable, body: `{"status":"down"}`, wantErrSub: "unexpected status"},
		{name: "bad body", status: http.StatusOK, body: `{"status":"unknown"}`, wantErrSub: "did not report status ok"},
		{name: "oversized", status: http.StatusOK, body: strings.Repeat("x", healthcheckBodyLimit+1), wantErrSub: "exceeded healthcheck limit"},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
				w.WriteHeader(test.status)
				fmt.Fprint(w, test.body)
			}))
			defer server.Close()

			err := runHealthcheck(server.URL)
			if test.wantErrSub == "" {
				if err != nil {
					t.Fatalf("runHealthcheck() error = %v", err)
				}
				return
			}
			if err == nil || !strings.Contains(err.Error(), test.wantErrSub) {
				t.Fatalf("runHealthcheck() error = %v, want substring %q", err, test.wantErrSub)
			}
		})
	}
}

func TestParseE2EFixtureMode(t *testing.T) {
	for _, test := range []struct {
		raw     string
		want    bool
		wantErr bool
	}{
		{raw: "", want: false},
		{raw: "false", want: false},
		{raw: "true", want: true},
		{raw: " TRUE ", want: true},
		{raw: "1", wantErr: true},
		{raw: "yes", wantErr: true},
	} {
		t.Run(test.raw, func(t *testing.T) {
			got, err := parseE2EFixtureMode(test.raw)
			if (err != nil) != test.wantErr {
				t.Fatalf("parseE2EFixtureMode(%q) error = %v, wantErr %t", test.raw, err, test.wantErr)
			}
			if got != test.want {
				t.Fatalf("parseE2EFixtureMode(%q) = %t, want %t", test.raw, got, test.want)
			}
		})
	}
}
