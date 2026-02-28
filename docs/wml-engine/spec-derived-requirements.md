# Spec-Derived Requirements (WML 1.1 -> Engine)

This file translates WML 1.1 requirements into explicit engineering requirements for the WASM runtime.

## 1. Input Contract

Transport layer must normalize network payloads to:

- `wmlXml: string`
- `baseUrl: string`
- `contentType: string` (`text/vnd.wap.wml` or normalized from `application/vnd.wap.wmlc`)
- optional `rawBytesBase64: string`

Engine must not parse WBXML directly in MVP.

## 2. Deck/Card Structure

Engine parser must support the WML deck model where root contains cards and optional pre-card structures.

Required now:

- `<wml>` root
- one or more `<card>`
- `<p>`, `<br/>`, `<a href="...">`

Planned soon (already in WML model):

- `<head>`, `<template>`
- `<do>`, `<go>`, `<prev>`, `<noop>`, `<refresh>`
- `<onevent>`, `<timer>`

## 3. URL + Navigation Semantics

- `href="#cardId"` means same-deck card transition.
- Relative references resolve against `baseUrl`.
- Non-fragment URLs trigger host navigation request.
- History model must support back behavior per card/deck transitions.

## 4. State and Context Semantics

WML defines context models around state/history/new context. Engine requirements:

- Keep per-deck runtime state.
- Preserve history stack entries containing deck URL + active card + variable store snapshot.
- For context-changing actions, allow replace/push behavior in runtime API (already partly represented by history mode).

## 5. Access Control Metadata

WML cards can contain access hints (domain/path). Engine requirements:

- Parse and retain card access attributes in runtime model.
- Defer enforcement to host policy layer in MVP.
- Expose parsed access metadata for debug and later policy checks.

## 6. Variable and Substitution Semantics

WML text and URL-like values may contain variable references.

Requirements by phase:

- MVP: parse text literally, no substitution.
- Phase 2: add `VariableStore` and substitution for text + href + relevant attributes.
- Phase 3: apply substitution in task/form execution paths.

## 7. Tasks, Events, and Activation

WML includes task-driven navigation and event bindings.

Required progression:

- MVP: clickable `<a href>` and Enter activation only.
- Phase 2: `<do>` softkey task binding + `go|prev|noop|refresh` runtime behavior.
- Phase 3: `<onevent>` and timer dispatch with deterministic event loop hooks.

## 8. Rendering Semantics

Engine output remains a host render list, not HTML.

Minimum output guarantees:

- vertical flow
- line wrap by viewport columns
- deterministic y-order
- focused link state
- one active card rendered at a time

## 9. Error Semantics

- Parsing errors must be structured and surfaced to host.
- Unknown tags in MVP should be ignored or captured as unsupported nodes, not crash runtime.
- Invalid internal target (`#missing`) must emit a runtime error event.

## 10. Conformance Baseline (for this project)

MVP conformance target:

- Correct deck/card parse for supported elements.
- Correct card switch for valid internal anchors.
- Correct host handoff for external navigation.
- Deterministic focus movement and render list for same inputs.
