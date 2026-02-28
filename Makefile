SHELL := /bin/bash

COMPOSE := docker compose
PROJECT_DIR := $(CURDIR)
ENABLE_NODE_CHECKS ?= 0

.PHONY: up down restart logs ps status smoke smoke-up clean \
	fmt lint test test-fast ci-local \
	lint-rust lint-node lint-python \
	test-rust test-node test-python \
	hooks-install hooks-update hooks-run

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
	else \
		echo "skip: pnpm or host-sample package missing (node test/build)"; \
	fi
	@echo "skip: electron-app tests (no package/tests configured yet)"
	@echo "skip: wml-server tests (no test script configured yet)"

lint-python:
	@echo "skip: transport-python lint (implementation not bootstrapped yet)"

test-python:
	@echo "skip: transport-python tests (implementation not bootstrapped yet)"

# --- Git hooks (pre-commit) ---

hooks-install:
	@if command -v pre-commit >/dev/null 2>&1; then \
		pre-commit install; \
		pre-commit install --hook-type pre-push; \
		echo "installed git hooks: pre-commit, pre-push"; \
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
