SHELL := /bin/bash

COMPOSE := docker compose
PROJECT_DIR := $(CURDIR)
ENABLE_NODE_CHECKS ?= 0
RUST_COVERAGE_MIN ?= 90
RUST_FUNCTION_COVERAGE_MIN ?= 85

.PHONY: up down restart logs ps status smoke smoke-up clean smoke-transport \
	fmt lint test test-fast ci-local \
	coverage-rust \
	lint-rust lint-node lint-python \
	test-rust test-node test-python \
	check-transport-contract \
	hooks-install hooks-update hooks-run \
	dev-wavenav-host \
	install-marketing-site dev-marketing-site build-marketing-site \
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

smoke-transport:
	./scripts/transport-http-smoke.sh

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

lint: lint-rust lint-node lint-python

test: test-rust test-node test-python

test-fast: test-rust

ci-local: lint test

lint-rust:
	@if command -v cargo >/dev/null 2>&1; then \
		echo "==> cargo fmt --check"; \
		cd engine-wasm/engine && cargo fmt --check; \
	else \
		echo "skip: cargo not found (engine-wasm lint)"; \
	fi

test-rust:
	@if command -v cargo >/dev/null 2>&1; then \
		echo "==> cargo test"; \
		cd engine-wasm/engine && cargo test; \
	else \
		echo "skip: cargo not found (engine-wasm tests)"; \
	fi

coverage-rust:
	@if command -v cargo >/dev/null 2>&1; then \
		if (cd engine-wasm/engine && cargo llvm-cov --version >/dev/null 2>&1); then \
			echo "==> cargo llvm-cov --summary-only --fail-under-lines $(RUST_COVERAGE_MIN) --fail-under-functions $(RUST_FUNCTION_COVERAGE_MIN)"; \
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

lint-node:
	@if [ "$(ENABLE_NODE_CHECKS)" != "1" ]; then \
		echo "skip: node lint checks disabled (set ENABLE_NODE_CHECKS=1 to enable)"; \
	elif [ -f engine-wasm/host-sample/package.json ] && command -v pnpm >/dev/null 2>&1; then \
		echo "==> host-sample lint (if configured)"; \
		cd engine-wasm/host-sample && pnpm run lint || echo "skip: no lint script for host-sample"; \
	else \
		echo "skip: pnpm or host-sample package missing (node lint)"; \
	fi
	@echo "skip: electron-app lint (no package/scripts configured yet)"
	@echo "skip: wml-server lint (no lint script configured yet)"

check-transport-contract:
	@pnpm run check:transport-contract

test-node:
	@if [ "$(ENABLE_NODE_CHECKS)" != "1" ]; then \
		echo "skip: node tests/build checks disabled (set ENABLE_NODE_CHECKS=1 to enable)"; \
	elif [ -f engine-wasm/host-sample/package.json ] && command -v pnpm >/dev/null 2>&1; then \
		if [ ! -f engine-wasm/pkg/wavenav_engine.js ]; then \
			if command -v wasm-pack >/dev/null 2>&1; then \
				echo "==> build WaveNav wasm pkg (required by host-sample)"; \
				cd engine-wasm/engine && wasm-pack build --target web --out-dir ../pkg; \
				cd ../..; \
			else \
				echo "skip: missing engine-wasm/pkg/wavenav_engine.js and wasm-pack not installed"; \
				exit 0; \
			fi; \
		fi; \
		echo "==> host-sample build sanity"; \
		cd engine-wasm/host-sample && pnpm run build; \
		if [ -f marketing-site/package.json ]; then \
			echo "==> marketing-site build sanity"; \
			pnpm --dir marketing-site --ignore-workspace run build; \
		else \
			echo "skip: marketing-site package missing (node test/build)"; \
		fi; \
	else \
		echo "skip: pnpm or host-sample package missing (node test/build)"; \
	fi
	@echo "skip: electron-app tests (no package/tests configured yet)"
	@echo "skip: wml-server tests (no test script configured yet)"

lint-python:
	@if [ -x transport-python/.venv/bin/ruff ]; then \
		echo "==> ruff check transport-python"; \
		transport-python/.venv/bin/ruff check transport-python; \
	elif command -v ruff >/dev/null 2>&1; then \
		echo "==> ruff check transport-python"; \
		ruff check transport-python; \
	else \
		echo "skip: ruff not found (python lint)"; \
		echo "install with: python3 -m venv transport-python/.venv && transport-python/.venv/bin/python -m pip install -r transport-python/requirements.txt -r transport-python/requirements-dev.txt"; \
		exit 1; \
	fi

test-python:
	@if [ -x transport-python/.venv/bin/pytest ]; then \
		echo "==> pytest transport-python/tests"; \
		transport-python/.venv/bin/pytest transport-python/tests; \
	elif command -v pytest >/dev/null 2>&1; then \
		echo "==> pytest transport-python/tests"; \
		pytest transport-python/tests; \
	else \
		echo "skip: pytest not found (python tests)"; \
		echo "install with: python3 -m venv transport-python/.venv && transport-python/.venv/bin/python -m pip install -r transport-python/requirements.txt -r transport-python/requirements-dev.txt"; \
		exit 1; \
	fi

# --- Git hooks (pre-commit) ---

hooks-install:
	@if command -v pre-commit >/dev/null 2>&1; then \
		set -e; \
		git config core.hooksPath .githooks; \
		pre-commit install-hooks; \
		echo "installed repo-managed hooks via .githooks (pre-commit + pre-push)"; \
	else \
		echo "pre-commit is not installed. Install with: pipx install pre-commit"; \
		exit 1; \
	fi

hooks-update:
	@if command -v pre-commit >/dev/null 2>&1; then \
		pre-commit autoupdate; \
	else \
		echo "pre-commit is not installed. Install with: pipx install pre-commit"; \
		exit 1; \
	fi

hooks-run:
	@if command -v pre-commit >/dev/null 2>&1; then \
		pre-commit run --all-files; \
	else \
		echo "pre-commit is not installed. Install with: pipx install pre-commit"; \
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

preview-pages-local:
	./scripts/preview-pages.sh
