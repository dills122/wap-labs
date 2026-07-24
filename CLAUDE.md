@AGENTS.md
@docs/agents/AGENT_STANDARDS.md
@docs/agents/RUST_ENGINE_STEERING.md
@docs/agents/RUST_TRANSPORT_STEERING.md
@docs/agents/SHELL_STEERING.md
@docs/agents/SCRIPTING_STEERING.md
@docs/agents/COMPLIANCE_CONTEXT_RETRIEVAL.md

# Claude Code repository entrypoint

The imported files contain the shared architecture, layer, Rust/shell/scripting, compliance-
retrieval, scope, test, and contribution rules for this repository. `AGENTS.md` is written for
Codex's steering convention, which Claude Code does not auto-load on its own — these imports
exist purely to pull the same steering in, not to duplicate it. Apply the nearest nested
`CLAUDE.md` if a future subdirectory adds more specific guidance.
