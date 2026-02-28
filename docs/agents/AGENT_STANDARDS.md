# WAP/WML Browser Emulator --- Multi-Language Agent Standards & Guidelines (v2)

**Project Codename:** Kennel\
**Owner:** Dylan Steele\
**Target Platform:** Unix / macOS Tooling + Electron/Tauri Host\
**Rendering Engine:** Rust → WebAssembly\
**API / Transport Layer:** Python\
**Adapters / Host UI:** TypeScript

---

## 🎯 Purpose

This document defines operational standards and architectural contracts
for AI agents and contributors working across a **polyglot WAP 1.x
emulator stack**:

- 🦀 Rust (WML Rendering Engine → WASM)
- 🐍 Python (API + Network Translation Layer)
- 🟦 TypeScript (Browser Adapters / Harness / Samples)
- ⚡ Electron OR Tauri (Real-world Emulator Host)
- 🧰 Unix/macOS Tooling + Build Chain

The emulator must remain:

- Historically accurate to WAP 1.x networking behavior
- Layer-isolated
- Renderer-authentic to WML Deck/Card semantics

---

## 🧱 Architectural Overview

---

Layer Responsibility Language Runtime

---

WSP Gateway Session + Protocol Handling Node.js Server

Network WBXML Decode / Encode Python Service
Translation

Rendering WML Parsing + Layout Rust → WASM Browser Engine
Engine

Browser Input + Mounting TypeScript Host Runtime
Adapter

Emulator Window + Device UI Electron / Tauri Desktop
Shell

Toolchain Build + Test Bash / Make Unix/macOS

---

---

## 🧭 Guiding Principles

### 1. Protocol Fidelity \> Developer Convenience

- MUST mimic WAP MTU constraints
- MUST support Deck/Card navigation
- MUST simulate session resume behavior

### 2. Strict Layer Isolation

Layer MUST NOT

---

Python Perform rendering
Rust/WASM Perform network requests
TypeScript Decode WBXML
Host Shell Parse WML

---

## 🔌 Inter-Service Contracts

All language boundaries are treated as **formal message contracts**:

Interface Format Notes

---

Python ⇄ Node Protobuf / JSON Gateway Messaging
Python ⇄ Rust (via TS) Typed Array / IPC Deck Transfer
WASM ⇄ TS Host Memory Buffer Render Output
TS ⇄ Host Shell Native IPC Electron/Tauri

WASM must receive:

    Decoded WML Deck/Card Only

Never WBXML.

---

## 🧪 Emulator Authenticity Requirements

Agents must preserve support for:

- WSP (Connection-Oriented Mode)
- WBXML → WML Decoding (Python Layer)
- Deck/Card Navigation
- Softkey Input Model
- 1400 byte MTU Simulation
- Gateway-Terminated WTLS

---

## 🛠️ Development Guidelines

### Python Layer

- Async Only (aiohttp / asyncio)
- Handles:
  - WBXML Decode
  - Session Translation
  - MTU Enforcement
- No DOM / Layout Logic

---

### Rust → WASM Renderer

- Stateless Rendering Engine
- Accepts:
  - Parsed WML Deck/Card
- Produces:
  - Virtual DOM Representation
- MUST:
  - Avoid HTTP
  - Avoid Gateway State

---

### TypeScript Adapter Layer

- Mounts Renderer Output
- Handles:
  - Navigation
  - Input Simulation
  - Device UI

---

### Host Shell (Electron / Tauri)

- Emulates:
  - Viewport
  - Softkeys
  - Device Capabilities
- Responsible for:
  - Windowing
  - Runtime IPC

---

## 🔐 Security Notes

- WTLS terminated at Gateway
- Renderer sandboxed (WASM)
- Python Layer validates upstream Deck responses

---

## 📦 Versioning Strategy

Layer Versioning

---

Python Transport Date-based
Gateway SemVer
Renderer WASM Hash
Adapter Layer npm SemVer
Emulator Host Tagged Release

---

## 🤖 Agent Behavioral Rules

Agents MUST:

- Respect language boundaries
- Avoid HTML semantics in WML renderer
- Validate Deck schema before render
- Use schema-first IPC

Agents MUST NOT:

- Call network from WASM
- Parse WBXML in TypeScript
- Introduce modern DOM assumptions

---

## 📁 Suggested Repository Structure

    /gateway-node
    /transport-python
    /renderer-rust-wasm
    /adapters-typescript
    /host-electron
    /host-tauri (optional)
    /shared-proto
    /docs

---

## 📜 Compliance

All agents must adhere to:

- Layer isolation
- Typed IPC contracts
- Protocol authenticity

Architectural changes must be documented via ADR.
