SHELL := /bin/bash

COMPOSE := docker compose
PROJECT_DIR := $(CURDIR)
RUST_COVERAGE_MIN ?= 90
RUST_FUNCTION_COVERAGE_MIN ?= 85

.PHONY: up down restart logs ps status smoke smoke-up clean smoke-transport-wap smoke-native-tauri-kannel-ui init-refresh \
	fmt lint test test-fast verify-fast verify-change verify-full verify-extended ci-local \
	coverage-rust coverage-rust-engine coverage-rust-transport \
	lint-rust lint-rust-engine lint-rust-transport lint-node lint-go lint-tofu \
	lint-network-preview-deploy \
	test-rust test-rust-engine test-rust-transport test-transport-fixtures test-node test-go \
	hooks-install hooks-update hooks-run \
	dev-wavenav-host \
	install-marketing-site dev-marketing-site build-marketing-site \
	dev-docs-portal build-docs-portal \
	preview-pages-local

up:
	$(COMPOSE) up -d --build

down:
	$(COMPOSE) down

restart: down up

logs:
	$(COMPOSE) logs -f --tail=150

ps:
	$(COMPOSE) ps

status:
	curl -s 'http://localhost:13000/status?password=changeme' | sed -n '1,30p'

smoke:
	./scripts/smoke.sh

smoke-up:
	$(COMPOSE) up -d --build
	./scripts/smoke.sh

smoke-transport-wap:
	./scripts/transport-wap-smoke.sh

smoke-native-tauri-kannel-ui:
	./scripts/native-tauri-kannel-e2e.sh

init-refresh:
	./scripts/init-refresh.sh

clean:
	$(COMPOSE) down -v --remove-orphans

# --- Repo-wide quality commands (polyglot) ---

fmt:
	@if command -v cargo >/dev/null 2>&1; then \
		echo "==> cargo fmt"; \
		cd engine-wasm/engine && cargo fmt; \
	else \
		echo "skip: cargo not found (engine-wasm fmt)"; \
	fi
	@if command -v go >/dev/null 2>&1; then \
		echo "==> gofmt (wml-server)"; \
		cd wml-server && gofmt -w $$(find . -name '*.go' -type f); \
	else \
		echo "skip: go not found (wml-server fmt)"; \
	fi
	@if command -v tofu >/dev/null 2>&1; then \
		echo "==> tofu fmt (network preview)"; \
		tofu fmt -recursive infra/network-preview; \
	else \
		echo "skip: tofu not found (network-preview fmt)"; \
	fi

lint: lint-rust lint-node lint-go lint-tofu

test: test-rust test-node test-go

test-fast: test-rust

verify-fast:
	pnpm run verify:fast

verify-change:
	pnpm run verify:change

verify-full:
	pnpm run verify:full

verify-extended:
	pnpm run verify:extended

ci-local:
	@echo "[ADVISORY] make ci-local is deprecated: local verification is not identical to GitHub-hosted CI."
	@echo "[ADVISORY] Running the strict deterministic offline profile; use make verify-full directly."
	@$(MAKE) verify-full

lint-rust:
	@$(MAKE) lint-rust-engine
	@$(MAKE) lint-rust-transport

lint-rust-engine:
	@if command -v cargo >/dev/null 2>&1; then \
		echo "==> cargo fmt --check (engine-wasm/engine)"; \
		cd engine-wasm/engine && cargo fmt --check; \
	else \
		echo "skip: cargo not found (engine-wasm lint)"; \
	fi

lint-tofu:
	@if ! command -v tofu >/dev/null 2>&1; then \
		echo "FAIL: tofu not found (network-preview lint)"; \
		exit 1; \
	fi
	@echo "==> tofu fmt -check -recursive (network preview)"
	@tofu fmt -check -recursive infra/network-preview
	@echo "==> actionlint (network-preview workflows)"
	@scripts/ci/check-network-preview-workflows.sh
	@echo "==> tofu init -backend=false -lockfile=readonly (network preview)"
	@TF_VAR_admin_cidrs='[]' \
		TF_VAR_monitoring_alert_email=owner@example.com \
		TF_VAR_project_name=offline-validation \
		TF_VAR_region=nyc3 \
		TF_VAR_ssh_key_name=offline-validation \
		TF_VAR_state_encryption_passphrase=offline-validation-only-not-for-state \
		TF_VAR_tailscale_auth_key=tskey-auth-offline-validation \
		TF_VAR_wap_test_cidrs='[]' \
		tofu -chdir=infra/network-preview/environments/preview init -backend=false -lockfile=readonly -no-color >/dev/null
	@echo "==> tofu validate (network preview)"
	@TF_VAR_admin_cidrs='[]' \
		TF_VAR_monitoring_alert_email=owner@example.com \
		TF_VAR_project_name=offline-validation \
		TF_VAR_region=nyc3 \
		TF_VAR_ssh_key_name=offline-validation \
		TF_VAR_state_encryption_passphrase=offline-validation-only-not-for-state \
		TF_VAR_tailscale_auth_key=tskey-auth-offline-validation \
		TF_VAR_wap_test_cidrs='[]' \
		tofu -chdir=infra/network-preview/environments/preview validate -no-color
	@echo "==> rendered cloud-init semantics (network preview)"
	@scripts/ci/check-network-preview-cloud-init.sh
	@echo "==> POSIX syntax (network-preview CI scripts)"
	@sh -n scripts/ci/*network-preview*.sh
	@if command -v shellcheck >/dev/null 2>&1; then \
		echo "==> shellcheck (network-preview CI scripts)"; \
		shellcheck -x scripts/ci/*network-preview*.sh; \
	else \
		echo "skip: shellcheck not found (network-preview CI scripts)"; \
	fi
	@echo "==> Node syntax (network-preview local plan helper)"
	@node --check scripts/network-preview-local-plan.mjs
	@echo "==> encrypted offline plan check (network preview)"
	@TF_VAR_state_encryption_passphrase=offline-validation-only-not-for-state \
		scripts/ci/check-network-preview-encrypted-plan.sh
	@echo "==> protected workflow contract tests (network preview)"
	@node --test scripts/tests/network-preview-protected.test.mjs
	@$(MAKE) lint-network-preview-deploy

lint-network-preview-deploy:
	@echo "==> production deployment contracts (network preview)"
	@scripts/ci/check-network-preview-deploy.sh

test-rust:
	@$(MAKE) test-rust-engine
	@$(MAKE) test-rust-transport

test-rust-engine:
	@if command -v cargo >/dev/null 2>&1; then \
		echo "==> cargo test (engine-wasm/engine)"; \
		cd engine-wasm/engine && cargo test; \
	else \
		echo "skip: cargo not found (engine-wasm tests)"; \
	fi

coverage-rust:
	@$(MAKE) coverage-rust-engine
	@$(MAKE) coverage-rust-transport

coverage-rust-engine:
	@if command -v cargo >/dev/null 2>&1; then \
		if (cd engine-wasm/engine && cargo llvm-cov --version >/dev/null 2>&1); then \
			echo "==> cargo llvm-cov --summary-only --fail-under-lines $(RUST_COVERAGE_MIN) --fail-under-functions $(RUST_FUNCTION_COVERAGE_MIN) (engine-wasm/engine)"; \
			cd engine-wasm/engine && cargo llvm-cov --all-features --summary-only --fail-under-lines $(RUST_COVERAGE_MIN) --fail-under-functions $(RUST_FUNCTION_COVERAGE_MIN); \
		else \
			echo "skip: cargo-llvm-cov is not installed"; \
			echo "install with: cargo install cargo-llvm-cov"; \
			exit 1; \
		fi; \
	else \
		echo "skip: cargo not found (engine-wasm coverage)"; \
		exit 1; \
	fi

lint-rust-transport:
	@if command -v cargo >/dev/null 2>&1; then \
		echo "==> cargo fmt --check (transport-rust)"; \
		(cd transport-rust && cargo fmt --check); \
		echo "==> cargo clippy --all-targets --all-features -- -D warnings (transport-rust)"; \
		(cd transport-rust && cargo clippy --all-targets --all-features -- -D warnings); \
	else \
		echo "skip: cargo not found (transport-rust lint)"; \
	fi

test-rust-transport:
	@if command -v cargo >/dev/null 2>&1; then \
		echo "==> cargo test -- --test-threads=1 (transport-rust)"; \
		cd transport-rust && RUST_TEST_THREADS=1 cargo test -- --test-threads=1; \
	else \
		echo "skip: cargo not found (transport-rust tests)"; \
	fi

test-transport-fixtures:
	@if command -v cargo >/dev/null 2>&1; then \
		echo "==> cargo test --test fixture_harness (transport-rust)"; \
		(cd transport-rust && cargo test --test fixture_harness -- --test-threads=1); \
		echo "==> cargo test transport_fixture_mapped_ (transport-rust)"; \
		(cd transport-rust && cargo test transport_fixture_mapped_ -- --test-threads=1); \
	else \
		echo "skip: cargo not found (transport fixture tests)"; \
	fi

coverage-rust-transport:
	@if command -v cargo >/dev/null 2>&1; then \
		if (cd transport-rust && cargo llvm-cov --version >/dev/null 2>&1); then \
			echo "==> cargo llvm-cov --summary-only --fail-under-lines 85 --fail-under-functions 84 (transport-rust)"; \
			cd transport-rust && RUST_TEST_THREADS=1 cargo llvm-cov --all-features --summary-only --fail-under-lines 85 --fail-under-functions 84 -- --test-threads=1; \
		else \
			echo "skip: cargo-llvm-cov is not installed"; \
			echo "install with: cargo install cargo-llvm-cov"; \
			exit 1; \
		fi; \
	else \
		echo "skip: cargo not found (transport-rust coverage)"; \
		exit 1; \
	fi

lint-node:
	@if ! command -v pnpm >/dev/null 2>&1; then \
		echo "FAIL: pnpm not found (node lint)"; \
		exit 1; \
	fi
	@echo "==> pnpm lint:node"
	@pnpm lint:node

lint-go:
	@if ! command -v go >/dev/null 2>&1; then \
		echo "FAIL: go not found (wml-server lint)"; \
		exit 1; \
	fi
	@echo "==> gofmt -l (wml-server)"
	@test -z "$$(find wml-server -name '*.go' -type f -exec gofmt -l {} +)"
	@echo "==> go vet ./... (wml-server)"
	@cd wml-server && go vet ./...

test-node:
	@if ! command -v pnpm >/dev/null 2>&1; then \
		echo "FAIL: pnpm not found (node tests/builds)"; \
		exit 1; \
	fi
	@if [ ! -f engine-wasm/pkg/wavenav_engine.js ]; then \
		if ! command -v wasm-pack >/dev/null 2>&1; then \
			echo "FAIL: missing engine-wasm/pkg/wavenav_engine.js and wasm-pack not installed"; \
			exit 1; \
		fi; \
		echo "==> build WaveNav wasm pkg (required by host-sample)"; \
		cd engine-wasm/engine && wasm-pack build --target web --out-dir ../pkg; \
	fi
	@echo "==> pnpm test:node"
	@pnpm test:node
	@echo "==> pnpm build:node"
	@pnpm build:node

test-go:
	@if ! command -v go >/dev/null 2>&1; then \
		echo "FAIL: go not found (wml-server tests)"; \
		exit 1; \
	fi
	@echo "==> go test ./... (wml-server)"
	@cd wml-server && go test ./...

# --- Git hooks (pre-commit) ---

hooks-install:
	@if command -v pre-commit >/dev/null 2>&1; then \
		set -e; \
		git config core.hooksPath .githooks; \
		pre-commit install-hooks; \
		echo "installed repo-managed hooks via .githooks (pre-commit + pre-push)"; \
	else \
		echo "pre-commit is not installed. Install it with your package manager, then retry."; \
		exit 1; \
	fi

hooks-update:
	@if command -v pre-commit >/dev/null 2>&1; then \
		pre-commit autoupdate; \
	else \
		echo "pre-commit is not installed. Install it with your package manager, then retry."; \
		exit 1; \
	fi

hooks-run:
	@if command -v pre-commit >/dev/null 2>&1; then \
		pre-commit run --all-files; \
	else \
		echo "pre-commit is not installed. Install it with your package manager, then retry."; \
		exit 1; \
	fi

dev-wavenav-host:
	./scripts/dev-wavenav-host.sh

install-marketing-site:
	@if [ -f marketing-site/package.json ] && command -v pnpm >/dev/null 2>&1; then \
		echo "==> install marketing-site deps"; \
		pnpm --dir marketing-site --ignore-workspace install --frozen-lockfile; \
	else \
		echo "skip: pnpm or marketing-site package missing"; \
	fi

dev-marketing-site:
	@if [ -f marketing-site/package.json ] && command -v pnpm >/dev/null 2>&1; then \
		echo "==> start marketing-site dev server"; \
		pnpm --dir marketing-site --ignore-workspace run dev; \
	else \
		echo "skip: pnpm or marketing-site package missing"; \
		exit 1; \
	fi

build-marketing-site:
	@if [ -f marketing-site/package.json ] && command -v pnpm >/dev/null 2>&1; then \
		echo "==> build marketing-site"; \
		pnpm --dir marketing-site --ignore-workspace run build; \
	else \
		echo "skip: pnpm or marketing-site package missing"; \
		exit 1; \
	fi

dev-docs-portal:
	@if [ -f docs-portal/package.json ] && command -v pnpm >/dev/null 2>&1; then \
		echo "==> start project Atlas dev server"; \
		pnpm --dir docs-portal run dev; \
	else \
		echo "skip: pnpm or docs-portal package missing"; \
		exit 1; \
	fi

build-docs-portal:
	@if [ -f docs-portal/package.json ] && command -v pnpm >/dev/null 2>&1; then \
		echo "==> build project Atlas"; \
		pnpm --dir docs-portal run build; \
	else \
		echo "skip: pnpm or docs-portal package missing"; \
		exit 1; \
	fi

preview-pages-local:
	./scripts/preview-pages.sh
