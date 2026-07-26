package main

import (
	"context"
	"errors"
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
	shutdownTimeout        = 10 * time.Second
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	app, err := origin.New(origin.Config{
		DTDVersion:   strings.TrimSpace(envOrDefault("WML_DTD_VERSION", "1.1")),
		Logger:       logger,
		AllowedHosts: splitCSV(os.Getenv("WML_ALLOWED_HOSTS")),
		HomeHosts:    splitCSV(envOrDefault("WML_HOME_HOSTS", "home.wap.test")),
		FormsHosts:   splitCSV(envOrDefault("WML_FORMS_HOSTS", "forms.wap.test")),
		InteropHosts: splitCSV(envOrDefault("WML_INTEROP_HOSTS", "interop.wap.test")),
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
