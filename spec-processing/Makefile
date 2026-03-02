SHELL := /bin/bash

.PHONY: parse-base parse-remaining promote provenance quality quality-strict

parse-base:
	./spec-processing/parse-pdf.fish

parse-remaining:
	./spec-processing/parse-pdf-remaining.fish

promote:
	./spec-processing/scripts/promote-docling-cleaned.fish

provenance:
	./spec-processing/scripts/generate-docling-provenance.sh $(if $(DATE),$(DATE),$$(date +%F))

quality:
	./spec-processing/scripts/check-docling-cleaned-quality.sh

quality-strict:
	./spec-processing/scripts/check-docling-cleaned-quality.sh --strict
