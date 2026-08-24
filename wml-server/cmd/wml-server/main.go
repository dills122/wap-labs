package main

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/dills122/wap-labs/wml-server/internal/origin"
)

const (
	defaultPublicAddress   = ":3000"
	defaultInternalAddress = ":3001"
	defaultHealthcheckURL  = "http://127.0.0.1:3001/health"
	shutdownTimeout        = 10 * time.Second
	healthcheckTimeout     = 3 * time.Second
	healthcheckBodyLimit   = 4 << 10
)

func main() {
	if len(os.Args) == 2 && os.Args[1] == "healthcheck" {
		if err := runHealthcheck(envOrDefault("WML_HEALTHCHECK_URL", defaultHealthcheckURL)); err != nil {
			fmt.Fprintln(os.Stderr, "healthcheck failed:", err)
			os.Exit(1)
		}
		return
	}
	if len(os.Args) != 1 {
		fmt.Fprintln(os.Stderr, "usage: wml-server [healthcheck]")
		os.Exit(2)
	}

	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	app, err := origin.New(origin.Config{
		DTDVersion:       strings.TrimSpace(envOrDefault("WML_DTD_VERSION", "1.1")),
		OriginInstanceID: strings.TrimSpace(os.Getenv("WML_ORIGIN_INSTANCE_ID")),
		Logger:           logger,
		AllowedHosts:     splitCSV(os.Getenv("WML_ALLOWED_HOSTS")),
		HomeHosts:        splitCSV(envOrDefault("WML_HOME_HOSTS", "home.wap.test")),
		FormsHosts:       splitCSV(envOrDefault("WML_FORMS_HOSTS", "forms.wap.test")),
		InteropHosts:     splitCSV(envOrDefault("WML_INTEROP_HOSTS", "interop.wap.test")),
	})
	if err != nil {
		logger.Error("invalid configuration", "error", err)
		os.Exit(1)
	}

	publicServer := newServer(envOrDefault("WML_ADDR", defaultPublicAddress), app.Handler())
	internalServer := newServer(
		envOrDefault("WML_INTERNAL_ADDR", defaultInternalAddress),
		app.InternalHandler(),
	)

	errCh := make(chan error, 2)
	startServer(logger, "public", publicServer, errCh)
	startServer(logger, "internal", internalServer, errCh)

	signalCtx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	select {
	case <-signalCtx.Done():
		logger.Info("shutdown requested")
	case err := <-errCh:
		logger.Error("server stopped", "error", err)
	}

	shutdownCtx, cancel := context.WithTimeout(context.Background(), shutdownTimeout)
	defer cancel()
	for _, server := range []*http.Server{publicServer, internalServer} {
		if err := server.Shutdown(shutdownCtx); err != nil {
			logger.Error("graceful shutdown failed", "address", server.Addr, "error", err)
		}
	}
}

func runHealthcheck(url string) error {
	client := &http.Client{Timeout: healthcheckTimeout}
	response, err := client.Get(url)
	if err != nil {
		return err
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return fmt.Errorf("unexpected status %s", response.Status)
	}
	body, err := io.ReadAll(io.LimitReader(response.Body, healthcheckBodyLimit+1))
	if err != nil {
		return err
	}
	if len(body) > healthcheckBodyLimit {
		return errors.New("response body exceeded healthcheck limit")
	}
	if !strings.Contains(string(body), `"status":"ok"`) {
		return errors.New("response did not report status ok")
	}
	return nil
}

func splitCSV(raw string) []string {
	var values []string
	for _, value := range strings.Split(raw, ",") {
		if trimmed := strings.TrimSpace(value); trimmed != "" {
			values = append(values, trimmed)
		}
	}
	return values
}

func envOrDefault(name, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(name)); value != "" {
		return value
	}
	return fallback
}

func newServer(address string, handler http.Handler) *http.Server {
	return &http.Server{
		Addr:              address,
		Handler:           handler,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      10 * time.Second,
		IdleTimeout:       30 * time.Second,
		MaxHeaderBytes:    8 << 10,
	}
}

func startServer(logger *slog.Logger, name string, server *http.Server, errCh chan<- error) {
	go func() {
		logger.Info("listener started", "listener", name, "address", server.Addr)
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			errCh <- errors.New(name + " listener: " + err.Error())
		}
	}()
}
