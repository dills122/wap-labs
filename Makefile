SHELL := /bin/bash

COMPOSE := docker compose
PROJECT_DIR := $(CURDIR)

.PHONY: up down restart logs ps status smoke smoke-up clean

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
