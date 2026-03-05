SHELL := /bin/bash

.PHONY: parse-base parse-new parse-remaining finalize-new promote provenance quality quality-strict parse-all ingest-new ingest-new-dryrun setup

parse-base:
	./parse-pdf.fish

parse-new:
	./parse-new-source-material.fish

parse-remaining:
	./parse-pdf-remaining.fish

finalize-new:
	./finalize-new-source-material.fish

promote:
	./scripts/promote-docling-cleaned.fish

provenance:
	./scripts/generate-docling-provenance.sh $(if $(DATE),$(DATE),$$(date +%F))

quality:
	./scripts/check-docling-cleaned-quality.sh

quality-strict:
	./scripts/check-docling-cleaned-quality.sh --strict

parse-all: parse-base parse-new parse-remaining

finalize-and-promote: parse-new finalize-new

ingest-new:
	./parse-new-source-material.fish
	./finalize-new-source-material.fish

ingest-new-dryrun:
	./parse-new-source-material.fish
	./finalize-new-source-material.fish --dry-run

setup:
	./setup-spec-parser-env.fish
