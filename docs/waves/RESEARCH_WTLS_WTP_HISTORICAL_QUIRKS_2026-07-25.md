# Research Memo: WTLS Security Posture, WTP State Machine, and Historical Browser Quirks

Date: 2026-07-25
Origin: three focused external-research follow-ups to the full architecture review at
`docs/waves/WAVES_ARCHITECTURE_REVIEW_2026-07-25.md`, which flagged these as areas needing
outside prior art (a live security-design question already sitting in written code, a protocol
buildout with well-known historical implementation pitfalls, and the project's own stated
differentiator) rather than further internal code reading.

Each section below was researched independently. Citations are inline; confidence levels are
stated explicitly where evidence is thin. This is a research/decision-support document, not an
implementation — no runtime, parser, or protocol code changes accompany it.

---

## Executive synthesis

- **WTLS**: the project already has a matching, dated ADR
  (`docs/architecture/decisions/0002-separate-modern-security-from-wtls-compatibility.md`,
  proposed 2026-07-24) that independently arrived at the same architecture the strongest external
  precedent found (the "Crypto Ancienne" project) converged on: real cryptography on any connection
  that touches the live network, historical protocol semantics only toward the emulated/sandboxed
  side. Recommendation: ratify that ADR, add one compiler-enforced boundary it doesn't yet specify
  (a marker type gating any code path that writes WTLS-protected bytes to a real socket), and treat
  `WTLS-00` (the fact that `waps://` currently *looks* secure via URL convention but actually sends
  fully unprotected WSP) as the more urgent near-term item — ahead of further WTLS wire-format work.
- **WTP**: the canonical state machine (WAP-224-WTP, read directly from the primary spec PDF) is
  precisely defined, and the single highest-risk correctness surface is TID (transaction
  identifier) validation gating delivery-to-user — not retransmission timing. This is backed by a
  real historical Kannel bug (wrong abort type sent on retry exhaustion) that maps directly onto a
  type-design fix. The codebase already has more WTP scaffolding than expected
  (`network::wtp::{duplicate_cache,retransmission,state_machine}` plus a separately-rooted
  `wtp_replay_window.rs`), but the one file actually named `state_machine.rs` is an orphaned,
  non-spec-conformant sketch that should likely be replaced, not extended, when real work starts.
- **Historical browser quirks**: genuine, citable evidence exists that cross-browser WML divergence
  was a real, acknowledged industry problem — strong enough that the WAP Forum published an
  official Generic Content Authoring Guide (GCAG) cataloguing ~40 concrete divergences. But
  precise vendor+version attribution ("Openwave 6.2.2 does X") is sparse — only two data points
  found, both secondary-source. Recommendation: transcribe the GCAG catalogue into a structured,
  source-cited data file now (zero runtime risk, pure documentation), but do not implement any
  vendor-specific behavior yet — the evidence isn't strong enough to avoid guessing.
- **Cross-cutting note**: all three research threads landed on the same shape of answer —
  something in this codebase (an ADR, a partial module, a compliance-evidence convention) had
  already anticipated the right structure; the research's job was to validate that structure
  against outside evidence and find the one or two concrete gaps, not to invent a new design from
  scratch. That's a good sign for how deliberately this project's prior decisions were made.

---

# Part 1: WTLS Security Posture

Scope: `transport-rust/src/network/wtls/{record.rs,handshake.rs,alerts.rs}` and its relationship
to the live fetch path.

## Summary

WTLS's historical weaknesses are real, specific, and well documented in the academic/industry
literature from 1999–2002, not just folklore ("the WAP Gap"). Separately, this project has
**already made an explicit, dated architectural decision** on this exact question
(`docs/architecture/decisions/0002-separate-modern-security-from-wtls-compatibility.md`, dated
2026-07-24, plus the backing research doc `docs/architecture/wtls-modernization-research.md` and
`docs/waves/SECURITY_BOUNDARY_TRACEABILITY.md`). That decision says: WTLS is a disabled-by-default,
allowlisted, non-fallback compatibility profile that must never be the default or an automatic
downgrade target; real security always rides on maintained TLS (Rustls) for `https://`; and no
production WTLS profile ships without independent crypto review. This matches the general industry
precedent found (protocol-fidelity emulation projects that keep old wire semantics toward the
"vintage" side while running real cryptography on the live wire — e.g. the Crypto Ancienne project
for old browsers) and matches how mainstream browsers handled SSLv3/RC4/export ciphers after
POODLE/FREAK (disable by default, no silent downgrade).

**Code verification finding: the concern is currently moot in practice.** `network::wtls` is not
called from anywhere in the live fetch path today. `transport-rust/src/native_fetch.rs` has zero
references to `wtls` (verified by grep). `waps://` resolves to UDP port 9202
(`native_fetch.rs:309`) but the request that goes out on that port is unprotected WSP sent
directly through the WDP UDP adapter — the WTLS modules are simply never invoked. So today there
is no live fetch that is "secured" by WTLS crypto, broken or otherwise; there's no crypto in the
`waps://` path at all yet, which is its own separate problem (mislabeled security) already tracked
as `WTLS-00` in the project's own backlog.

**Recommendation: adopt/ratify the existing ADR 0002 as-is** and additionally add one concrete
enforcement mechanism it doesn't yet specify: a type-level boundary (a marker/newtype) that makes
it a compile error for WTLS-derived key material to reach the live socket write path except
through an explicit, narrowly-scoped `WtlsCompatibility` adapter — see Recommendation section
below.

## 1. Historical WTLS weaknesses (cited)

### 1.1 The WAP Gap (gateway plaintext exposure)

The defining architectural weakness, independent of any cipher choice: because WTLS (client↔gateway)
and TLS/SSL (gateway↔origin) are wire-incompatible protocols, a WAP gateway must fully decrypt
WTLS traffic and re-encrypt it as TLS (or vice versa) to bridge the two legs. During that bridging
step, the plaintext exists in the gateway's memory. "Even if there is encryption between the
client and the gateway (using WTLS) and between the gateway and the originating server (using
HTTPS) the gateway acts as a man-in-the-middle" — Wikipedia's WTLS article, summarizing the
widely-cited industry description of the gap
(https://en.wikipedia.org/wiki/Wireless_Transport_Layer_Security). This is corroborated by
multiple independent secondary sources describing the same mechanism: "the WTLS content is
decrypted and then reencrypted using TLS... allowing a period of time when the message is
unencrypted and unprotected in the WAP gateway" (https://sourcedaddy.com/networking/the-wap-gap.html;
also see the SANS/GIAC writeup at https://www.giac.org/paper/gsec/1423/transport-layer-security-protocol-wap/102664).
This is an *architectural* problem, not a fixable cipher-strength problem — it exists even with a
hypothetically perfect WTLS cipher suite, as long as a real end-to-end secure tunnel doesn't exist
from client to origin.

### 1.2 Saarinen (1999), "Attacks against the WAP WTLS Protocol"

This is the foundational cryptanalysis, presented at IFIP CMS '99
(https://link.springer.com/chapter/10.1007/978-0-387-35568-9_14; PDF mirror:
https://scispace.com/pdf/attacks-against-the-wap-wtls-protocol-2pvso0xnxl.pdf). Findings include:

- **Chosen-plaintext data-recovery attack via predictable IVs.** WTLS, following the SSL/TLS
  CBC-chaining convention, derives the IV for a record from the previous record's ciphertext
  rather than using a fresh random IV per record. Combined with WTLS allowing the *receiver* to
  request retransmission (in the datagram/unreliable case) and with low-entropy secrets in some
  profiles, this predictability enables a chosen-plaintext attack that can recover data protected
  under low-entropy conditions.
- **Datagram truncation attack.** Because WTLS runs over unreliable datagram transports and uses
  explicit sequence numbers rather than TLS's implicit stream ordering, an attacker who can drop
  trailing records can truncate a message without the receiver detecting the truncation the way a
  reliable stream protocol would.
- **Message forgery attack.** Exploits weaknesses in how WTLS handles message authentication in
  combination with the datagram model.
- **Key-search shortcut for exportable (40-bit) ciphers.** WAP-261's registry includes explicit
  40-bit "export" variants of RC5/DES/IDEA. Saarinen documents a shortcut making key search even
  cheaper than the nominal 2^40 brute force for some of these modes.
- **Error-message oracle.** The `bad_certificate` and `decode_error` alert messages, in some
  implementations, act as a padding/format oracle usable to help an attacker discriminate valid
  vs. invalid guesses — an early instance of the general CBC-padding-oracle problem later
  formalized in the next citation.

### 1.3 Vaudenay (2002), CBC padding-oracle applicability to WTLS

Serge Vaudenay's Eurocrypt 2002 paper, "Security Flaws Induced by CBC Padding — Applications to
SSL, IPSEC, WTLS," explicitly names WTLS (alongside SSL/TLS and IPsec) as a protocol whose
CBC-then-MAC-with-padding construction is subject to a padding-oracle side channel: "decryption
needs to check if the format is valid, and validity of the format is easily leaked from
communication protocols... since the receiver usually sends an acknowledgment or an error
message" (https://link.springer.com/chapter/10.1007/3-540-46035-7_35; PDF at
https://www.iacr.org/archive/eurocrypt2002/23320530/cbc02_e02d.pdf). All of WAP-261's non-null
bulk ciphers are CBC-mode block ciphers with MAC-then-encrypt processing (per the project's own
`docs/architecture/wtls-modernization-research.md` bulk-cipher registry table), so this class of
attack applies directly to WTLS's record layer, not just to TLS/SSL.

### 1.4 Weak/short key and MAC registries (spec-documented, not just retrospective)

The WAP-261 spec's own bulk-cipher and MAC registries include options that were already considered
weak at ratification time:

- Bulk ciphers: `NULL`, `RC5_CBC_40`, `RC5_CBC_56`, `RC5_CBC` (128), `DES_CBC_40`, `DES_CBC` (56),
  `3DES_CBC_EDE`, `IDEA_CBC_40`, `IDEA_CBC_56`, `IDEA_CBC` (128), `RC5_CBC_64`, `IDEA_CBC_64`. No
  AES suite exists in WAP-261 at all — it predates AES's finalization as an active internet
  protocol choice in this context. (Source: project's own extraction from `WAP-261-WTLS-20010406-a.pdf`
  Appendix A, in `docs/architecture/wtls-modernization-research.md`, not independently re-derived
  from the PDF in this pass but internally consistent with the well-known historical record of
  40/56-bit export-grade ciphers being standard in this era.)
- The spec text itself reportedly warns that 40-bit ciphers are "highly susceptible to exhaustive
  search and ideally should not be supported" — i.e., the weakness was known contemporaneously,
  not just in hindsight.
- MAC registry includes truncated HMAC outputs down to 5 bytes (`SHA_40`, `MD5_40`), which
  materially weakens forgery resistance versus full HMAC-SHA-1/MD5. Wikipedia's WTLS article
  independently corroborates this general point: "HMAC digests are shortened to reduce bandwidth,
  which compromises integrity protection."
- Key-exchange registry includes fully anonymous options (`DH_anon`/unauthenticated ECDH) and
  512-/768-bit-limited RSA and DH forms — key sizes considered inadequate well before 2010, let
  alone today. The three security "classes" defined in the WAP architecture (roughly: no
  authentication, server-only authentication, mutual authentication) allowed a device/gateway pair
  to legitimately negotiate the weakest, unauthenticated class (Cisco's "WTLS Class 2 Support"
  product documentation confirms the class system existed and was a configurable gateway feature:
  https://www.cisco.com/c/en/us/td/docs/ios/12_2/12_2x/12_2xr/feature/guide/fx_wapsc.html — a crisp
  independent Class 1/2/3 breakdown was not found; flagged as a minor gap, not load-bearing).
- MD5 and SHA-1 (not SHA-2) are the only hash options in the MAC registry — both are now
  cryptographically weakened relative to modern standards, though this is a smaller factor than
  the truncation and key-size issues above for WTLS's specific threat model.

### 1.5 Net assessment

WTLS is not "TLS but slower" — it has the WAP Gap architectural problem (1.1), documented
practical cryptanalytic attacks against its actual design choices (1.2, 1.3), and a spec-sanctioned
registry of export-grade/anonymous/short-key options that a compliant implementation is *allowed*
to negotiate (1.4). None of this is disputed or fringe; it's the consensus reason WTLS was replaced
by TLS-over-the-wire approaches (and eventually just direct HTTPS) as soon as devices could handle
a real TLS stack.

## 2. Precedent from other projects (cited)

### 2.1 Crypto Ancienne — the closest direct analogue found

The strongest, most directly on-point precedent is "Crypto Ancienne," a project building a modern
TLS 1.2 library specifically to let vintage/retro browsers reach the real, modern HTTPS internet
(http://oldvcr.blogspot.com/2020/11/fun-with-crypto-ancienne-tls-for.html). Its architecture: old
browsers speak plain HTTP to a local proxy daemon ("carl"), which performs the *real* TLS 1.2
handshake to the actual remote server; the vintage client never negotiates real cryptography over
the live wire itself, and no attempt is made to give the vintage client "historically accurate but
broken" crypto for a connection that touches the real internet. The explicit rationale is that old
ciphers/protocol versions are unsuitable for protecting real data, so the design deliberately keeps
"old protocol semantics on the client side, modern cryptography on the wire." This is
architecturally the same shape as what ADR 0002 already proposes for Waves: historical wire
behavior toward the "old" side, real crypto on any connection that actually leaves the sandbox.

Related, less rigorous community projects in the same space (retroproxy, legacyproxy) go even
further and simply strip TLS/security outright rather than reimplementing it, explicitly scoping
themselves to "private, trusted LAN" use only
(https://github.com/humbertocsjr/retroproxy, referenced via
https://github.com/ssshake/retro-computing-internet-resources) — i.e., the community consensus,
even at the low-rigor end, is "don't expose this to a hostile network unprotected," never "give it
fake security."

### 2.2 MAME's preservation-vs-execution boundary

MAME's stated purpose is preservation/documentation of original hardware behavior — "the source
code to MAME serves as this documentation," verified against physical hardware down to the
gate/bus-cycle level (https://docs.mamedev.org/whatis.html, https://www.mamedev.org/). No
MAME-specific written policy on network sandboxing was found (most MAME-emulated systems have no
meaningful attack surface reachable from a live network in the first place, so it's not a live
design tension for that project the way it is for a system whose entire purpose is fetching content
from real servers). The transferable principle is narrower than expected: MAME's rigor is about
*faithfully reproducing observable behavior*, not about *exposing the reproduction to real-world
hazards it was never hardened against*. That maps onto Waves as: faithfully reproduce WTLS's wire
format and observable protocol behavior (records, handshake shapes, alerts, error paths) — that's
protocol-fidelity work with no live-network safety implication as long as it stays in
fixtures/tests. The safety implication only appears the moment someone points that reproduction at
a live untrusted socket and calls the result "secure."

### 2.3 Browser vendors and deprecated TLS/SSL — precedent for "no automatic downgrade, disabled by default"

After POODLE (CVE-2014-3566), all major browser vendors coordinated to disable SSLv3 by default
rather than leave it as a silent fallback option (Mozilla:
https://blog.mozilla.org/security/2014/10/14/the-poodle-attack-and-the-end-of-ssl-3-0/; industry
summary: https://threatpost.com/browser-vendors-move-to-disable-sslv3-in-wake-of-poodle-attack/108852/).
The broader current hardening consensus is to disable deprecated protocol versions and remove weak
cipher suites (RC4, 3DES, export ciphers) rather than keep them available as an automatic
compatibility fallback. The specific failure mode that made POODLE exploitable in practice was
that many clients/servers *would* silently fall back to SSLv3 after a failed negotiation with a
newer protocol — i.e., the "automatic downgrade" pattern is precisely the failure mode, and its
industry-standard fix is precisely "no automatic downgrade, explicit opt-in only for the weak
mode." This directly validates ADR 0002's "Downgrade and fallback rules" section (forbidding
retry-as-WTLS-after-HTTPS-failure, retry-as-clear-after-WTLS-failure, etc.) as consistent with how
the industry actually fixed the analogous real-world incident.

### 2.4 Synthesis of precedent

Across all three lines of precedent, the consistent line drawn is:

- Faithful reproduction of a broken protocol's *wire format and observable behavior* is fine and
  valuable (MAME's core value proposition; also what Phase A/B of the Waves WTLS roadmap already
  targets).
- Faithful reproduction of a broken protocol's *cryptographic protection* being relied upon for a
  connection that touches real, untrusted infrastructure is where every precedent project draws a
  hard line and substitutes modern crypto or refuses to run live (Crypto Ancienne, retroproxy/
  legacyproxy, and implicitly the browser-vendor SSLv3 response).
- No automatic/opportunistic downgrade into the weak mode, ever — this is the specific lesson from
  POODLE/FREAK-era browser hardening, and it's already written into ADR 0002 near-verbatim.

## 3. What this implies concretely for Waves

Given the project's own stated principle ("acceptable, and often necessary, for Waves to emulate
semantics without reproducing historical vulnerabilities") and the precedent above:

1. **WTLS should never be the thing actually protecting a live network fetch in the default,
   shipping product.** `https://` traffic should always ride real, maintained TLS (Rustls) — this
   is already true today per the project's own audit ("Direct `https://` requests already use that
   maintained TLS stack," `docs/architecture/wtls-modernization-research.md`).
2. **WTLS support existing in the codebase for protocol-fidelity purposes is fine and worth
   finishing** (wire-correct record/handshake/alert encode-decode, replay/sequence behavior,
   interop with real Kannel/WAP-261 gateways in a controlled/allowlisted setting) — this is
   legitimate emulator work, analogous to MAME reproducing a chip's exact undocumented timing
   quirks.
3. **The one place WTLS-negotiated key material is allowed to protect bytes that then cross a live
   socket is a narrow, explicit, allowlisted "legacy interop" profile** (ADR 0002's
   `WtlsCompatibility` profile) — gated per-gateway, never a default, never reachable by automatic
   fallback, always surfaced to the user/host as "legacy, unverified" security state, and not
   eligible for a production security claim without independent crypto review. This is not "WTLS
   may never touch a live socket" — it's "WTLS may only touch a live socket through one narrow,
   labeled, non-default gate," which matches how Crypto Ancienne and the browser vendors actually
   solved the equivalent problem.
4. **Everything else** — unit tests, fixtures, local loopback interop harnesses, the historical
   accuracy/education value of the emulator — should use WTLS freely without any live-network
   gate, because there's no real attacker on the other end of a fixture.

No grounds were found in either the crypto literature or the emulation-precedent research to
recommend anything stricter (e.g., "WTLS key material must never reach a socket, full stop, even
behind an allowlist") or looser (e.g., "just ship it, it's for authenticity") than what ADR 0002
already decides.

## 4. Current-code verification

Verified by grep against the actual worktree, not assumed:

- `network::wtls` module contents: `transport-rust/src/network/wtls/record.rs`,
  `transport-rust/src/network/wtls/handshake.rs`, `transport-rust/src/network/wtls/alerts.rs`.
  Declared via `transport-rust/src/network.rs:4` (`pub mod wtls;`).
- `grep -rln "wtls" transport-rust/src` returns exactly three files: `network.rs` (the `pub mod`
  declaration) and the two files under `network/wtls/` that reference `wtls` internally
  (`handshake.rs`, `record.rs`). **`transport-rust/src/native_fetch.rs` has zero occurrences of
  "wtls."** **`transport-rust/src/fetch_runtime/execution.rs` has zero occurrences of "wtls."**
  There is currently no call path from the live fetch execution path into the WTLS module at all —
  not weakly guarded, not feature-flagged, simply absent.
- `waps://` scheme handling in `native_fetch.rs`: line 84 matches it as a recognized scheme
  alongside `wap`; line 309 maps `"waps" => 9202` for UDP port selection; line 334 maps
  `"waps" => "https"` (used for some other normalization). No line in the file constructs a
  `WtlsRecord`, calls into `network::wtls::*`, or otherwise touches the WTLS module — the
  `waps://` path currently sends the same connectionless WSP payload as `wap://`, unprotected,
  straight through the WDP UDP adapter.
- This independently confirms the claim already written in
  `docs/architecture/wtls-modernization-research.md` ("The current native fetch path... never
  invokes the prototype WTLS modules... The current route is therefore unencrypted") and in
  `docs/waves/SECURITY_BOUNDARY_TRACEABILITY.md` ("`waps://` currently selects port 9202 but sends
  unprotected WSP without invoking these modules").
- **Today's actual risk is therefore not "WTLS's broken crypto might protect a live connection" —
  it's the adjacent, already-tracked problem that `waps://` currently claims to be a secure scheme
  (by URL convention) while providing zero protection and not clearly telling the user that.**
  That gap is already captured as `WTLS-00` in the project's backlog and as acceptance conditions
  1–2 in ADR 0002. No evidence was found that `WTLS-00` has shipped yet (no
  warning/`SecurityOutcome`-shaped code found under `transport-rust/src` in this pass — see Open
  Questions).

**Bottom line: no contradiction found. The existing docs describe today's code accurately, and
independent grep confirms it.**

## 5. Recommendation for this codebase (concrete, actionable)

Adopt ADR 0002 as-is (it's already well-reasoned and matches external precedent). Add one
code-level guardrail it doesn't yet specify, so the boundary is enforced by the type system rather
than only by doc/review discipline:

1. **Introduce a marker type that only the `WtlsCompatibility` adapter can construct**, e.g.
   `pub(crate) struct LiveWtlsAuthorized(());` (private constructor, only buildable inside a single
   narrow module such as `network/wtls/live_gate.rs` that implements exactly the allowlist/gateway-
   profile check from ADR 0002 §"WtlsCompatibility"). Any function that writes WTLS-protected bytes
   to a real socket (as opposed to a fixture reader/writer or an in-memory test harness) takes this
   token as a parameter. Fixture-driven tests never construct it. This makes "WTLS key material
   reaches a live socket" a compile-time-visible fact at every call site instead of something that
   has to be re-verified by grep on every future change.
2. **Keep `native_fetch.rs` free of any `wtls` import until `WTLS-08` ("Integrate live secure
   routes") is deliberately implemented**, and when it is, route it exclusively through the
   `LiveWtlsAuthorized`-gated adapter above rather than calling `network::wtls::*` directly from
   `native_fetch.rs`. This preserves the current, verified-clean separation as a structural
   property, not just a coincidence of nothing having wired it up yet.
3. **Ship `WTLS-00` (the `waps://` mislabeling fix) before or alongside any further WTLS wire work**,
   since that's the actual live user-facing risk today (a URL scheme that looks secure and isn't),
   not the WTLS crypto itself.
4. **When `WtlsCompatibility` is eventually built, make its "legacy, unverified" security state
   impossible to omit from the response type** — i.e. `SecurityOutcome.legacy: bool` and the
   warnings vector should not have a default/omittable value; require the caller to explicitly
   acknowledge it.
5. No stricter recommendation is warranted by the evidence — that would foreclose legitimate,
   already-planned interop testing against real historical/Kannel gateways (`WTLS-09` in the
   backlog), which is within this project's stated MVP-authenticity priorities in `AGENTS.md`
   ("realistic transport constraints"). The fix is scoping and labeling that use case tightly, not
   eliminating it.

## 6. Open questions / genuine uncertainty

- No code under `transport-rust/src` implementing the `SecurityOutcome`/`SecurityProfile`/
  `LegacyWtlsPolicy` shapes sketched in `docs/architecture/wtls-modernization-research.md`
  §"Contract direction" was found in this pass — those appear to be design shapes only. Worth
  confirming with the team before assuming `WTLS-00` has any code progress at all.
- The precise WAP-261 Class 1/2/3 authentication-level breakdown could not be independently
  verified against a primary or rigorous secondary source in this pass. Doesn't affect the
  recommendation, which doesn't depend on the exact class semantics.
- The Saarinen paper's full technical detail came from search-engine-summarized secondary
  excerpts, not a directly fetched full text (Springer/ResearchGate/scispace direct fetches were
  paywalled or blocked). The high-level claims are corroborated across multiple independent
  secondary sources and consistent with the well-established general CBC-IV-chaining weakness
  class.
- ADR 0002's status is "proposed," not "accepted," as of 2026-07-24. This memo treats its content
  as sound and worth ratifying, but formal acceptance is a team decision outside this memo's scope.

---

# Part 2: WTP Transaction State Machine

Scope: canonical behavior, historical pitfalls, and a design shape for `transport-rust/` ("Lowband").

## Summary

- The canonical WTP state machine is precisely specified in **WAP-224-WTP-20010710-a** ("Wireless
  Transaction Protocol", WAP Forum, 10-Jul-2001), fetched and read directly (PDF, 73 pages).
  Section 9 ("State Tables") gives literal event/condition/action/next-state tables for the
  Initiator (NULL, RESULT WAIT, RESULT RESP WAIT, WAIT TIMEOUT) and Responder (LISTEN, TIDOK WAIT,
  INVOKE RESP WAIT, RESULT WAIT, RESULT RESP WAIT, WAIT TIMEOUT) roles.
- The single riskiest correctness surface, confirmed both by the spec's own text and by a real
  historical bug in Kannel, is **TID (transaction identifier) validation and its interaction with
  retry/abort semantics** — not retransmission timing per se.
- The term "group acknowledgement / Ack-of-Acks" does not exist verbatim in the spec. What exists
  is the **Segmentation-and-Reassembly (SAR) "packet group" Ack/Nack** mechanism (§7.14.3–7.14.4,
  §7.15.3–7.15.4) — optional and orthogonal to the core Class 0/1/2 transaction state machine.
- **Current-code verification**: this repo already has substantially more WTP scaffolding than
  expected. `transport-rust/src/network/wtp/` contains `duplicate_cache.rs`, `retransmission.rs`,
  **and `state_machine.rs`** (239 lines, with a `WtpTransactionClass` / `WtpTransactionState` /
  `WtpTransactionEvent` enum triad and an `advance_wtp_transaction_state` pure function). However,
  `state_machine.rs` is an **orphan module**: nothing outside its own file references it, and —
  unlike `duplicate_cache` and `retransmission`, which are reused by `network::wtls::handshake` and
  have dedicated fixture directories — it has **no fixture-driven tests** and is not wired into
  `wsp::connectionless` or anything else. It is also a simplified approximation of the real spec
  state machine (single generic state set shared across all three classes, no TID/abort-type/
  RCR-vs-AEC distinction, no Responder role at all).

## 1. Canonical WTP state machine (WAP-224-WTP-20010710-a)

Source: WAP Forum, **WAP-224-WTP-20010710-a**, "Wireless Transaction Protocol", Version
10-Jul-2001. Fetched directly from
`https://www.openmobilealliance.org/tech/affiliates/wap/wap-224-wtp-20010710-a.pdf` and read as a
PDF (primary spec document, not a secondary source — section numbers below are as printed in the
document).

### 1.1 Transaction classes (§6, "Classes of Operation")

- **Class 0 — unreliable Invoke, no Result** (§6.1). Single Invoke PDU. "There is no duplicate
  removal or verification procedure performed." Stateless; cannot be aborted. Initiator still MUST
  increment its TID counter each transaction; Responder MUST NOT cache/update TID for Class 0.
  Intended as an occasional unreliable "push" augmentation within an existing session, not a
  primary datagram service (WDP is for that).
- **Class 1 — reliable Invoke, no Result** (§6.2). PDUs: Invoke, Ack, Abort. Responder checks the
  TID, decides whether TID verification is needed, and if not, delivers to the user and returns the
  "last acknowledgement" to the Initiator. Responder MUST keep enough state to retransmit that last
  Ack if it's lost. Used for reliable "push."
- **Class 2 — reliable Invoke, reliable Result** (§6.3). PDUs: Invoke, Result, Ack, Abort. "The
  Invoke of a Class 2 transaction can either explicitly be acknowledged by an Ack PDU, or implicitly
  by the Result PDU; the Result PDU must always be explicitly acknowledged." This is the class WSP
  uses for method invocations — i.e. what connection-oriented WSP over WTP actually rides on. If a
  Responder doesn't support Class 2 it MUST abort with reason `NOTIMPLEMENTEDCL2` (§6.3.4).

### 1.2 Initiator and Responder state machines (§9, "State Tables")

Transcribed directly from the PDF (§9.5–9.6):

**WTP Initiator** — states: `NULL`, `RESULT WAIT`, `RESULT RESP WAIT` (Class 2 only), `WAIT TIMEOUT`
(Class 2 only).

- `NULL` + `TR-Invoke.req`: sets `SendTID = GenTID`, sends Invoke PDU, resets RCR, starts retry
  timer `R[RCR]`; for Class 0 it stays in `NULL` (fire-and-forget); for Class 1/2 it moves to
  `RESULT WAIT`.
- `RESULT WAIT`: handles `RcvAck` (stops timer, generates confirm; for Class 2 sets `HoldOn=True`
  and *stays* in RESULT WAIT awaiting the Result), `RcvAbort`/`RcvErrorPDU` (abort + indicate),
  `TimerTO_R` (retry while `RCR < MAX_RCR`, else abort), and the TID-verification variant of
  `RcvAck` (`TIDve` condition → responds with `Ack(TIDok)`, increments RCR, restarts timer, stays in
  `RESULT WAIT`). `RcvResult` for Class 2 moves to `RESULT RESP WAIT`.
- `RESULT RESP WAIT` (Class 2 only): on `TR-Result.res` queues/sends the last Ack and moves to
  `WAIT TIMEOUT`; `TimerTO_A` increments the Ack-Expiration-Counter (AEC) up to `AEC_MAX`, then
  aborts with `NORESPONSE`.
- `WAIT TIMEOUT` (Class 2 only): retransmits the last Ack on duplicate `RcvResult` (RID=1), clears
  on `TimerTO_W`.

**WTP Responder** — states: `LISTEN`, `TIDOK WAIT`, `INVOKE RESP WAIT`, `RESULT WAIT` (Class 2
only), `RESULT RESP WAIT` (Class 2 only), `WAIT TIMEOUT` (Class 1 only).

- `LISTEN` + `RcvInvoke`: valid TID → generate `TR-Invoke.ind`, start Ack-interval timer `A`, go to
  `INVOKE RESP WAIT`; invalid TID → send `Ack(TIDve)` and go to `TIDOK WAIT` (three-way-handshake
  branch).
- `TIDOK WAIT`: on `RcvAck` with `TIDok` set, proceeds to `INVOKE RESP WAIT`; duplicate `RcvInvoke`
  during this window is ignored if `RID=0`, otherwise re-sent `Ack(TIDve)`.
- `INVOKE RESP WAIT`: `TR-Invoke.res` (Class 1) queues the final Ack → `WAIT TIMEOUT`; `TR-Result.req`
  (Class 2) sends Result → `RESULT WAIT`; `TimerTO_A` increments AEC until `AEC_MAX`, then aborts
  with `NORESPONSE`.
- `RESULT WAIT`/`RESULT RESP WAIT` (Class 2): mirror the Initiator's retry/AEC logic on the Result
  side; `TimerTO_R` retries the Result PDU up to `MAX_RCR` then aborts.
- `WAIT TIMEOUT` (Class 1 only): retransmits the last Ack on duplicate Invoke, clears on
  `TimerTO_W`.

### 1.3 Timers (§9.4.1–9.4.2, §7.1.4, §7.2)

There is conceptually **one transaction timer per transaction**, reused for three different
interval purposes (§9.4.1, Table 38–39):

| Name | Purpose |
|---|---|
| **Retry interval (R)** | bound before retransmitting a PDU (drives `TimerTO_R`) |
| **Acknowledgement interval (A)** | bound before an Ack must be sent, or a "hold-on" ack issued if the user hasn't responded yet (drives `TimerTO_A`) |
| **Wait timeout interval (W)** | bound on how long to retain state to answer a duplicate-of-the-last-message after the transaction is otherwise done (Class 2 Initiator, Class 1 Responder only; drives `TimerTO_W`) |

Two counters bound retry behavior (§9.4.2, Table 40):

- **RCR (Re-transmission Counter)**, max `RCR_MAX` — bounds PDU retransmissions.
- **AEC (Acknowledgement Expiration Counter)**, max `AEC_MAX` — bounds how many times the
  Ack-interval timer may expire/restart (i.e. how many "hold-on" cycles) before the transaction is
  aborted with `NORESPONSE`.

The spec explicitly allows the retry interval to be implemented as an **array indexed by RCR**,
i.e. exponential backoff via `R[RCR]` (§9.4.1: "An exponential back off algorithm can be implemented
by populating R[] with values that are increasing successive powers of 2"). Concrete interval
values are bearer-dependent and live in a non-normative appendix not read in this pass.

**Retransmission-Indicator (RID) semantics** (§7.2.4/§8.2.6) matter for correctness, not just
performance: the first transmission of a PDU has RID clear; every retransmission has RID set. A
receiver that gets two *identical* messages with RID=0 can safely treat the second as a
network-level duplicate. Once RID=1 appears, the receiver can no longer distinguish
provider-retransmission from network-duplication by RID alone — "the WTP provider should make a TID
validation" (§7.2.4) — this is the direct link between RID handling and TID validation: **RID alone
is not a substitute for the TID/duplicate-cache check.**

### 1.4 Hold-on acknowledgement (§7.1.5.3)

If the WTP user needs more time to service an invoke than the Ack-interval, the Responder MAY/
SHOULD/MUST (per profile) send a "hold on" Ack purely to stop the Initiator from retransmitting the
Invoke — this Ack does *not* carry the result. On receipt, the Initiator stops retransmitting and
generates `TR-Invoke.cnf`, but the transaction is *not* complete; it continues waiting for the
eventual Result. This is exactly the `HoldOn` boolean variable in the state tables (Table 41) and is
distinct from ordinary Ack-vs-Result disambiguation.

### 1.5 TID validation, verification handshake, and wraparound (§7.8–7.9)

This is the section most load-bearing for correctness, and the source of the historical Kannel bug
described in §2.

- **TID basics** (§7.8.1): a transaction is identified by the socket 4-tuple **plus** the 16-bit
  TID. The Initiator increments TID by one per initiated transaction; a "new" invoke always has a
  higher TID than the previous one from that Initiator, *modulo wraparound*. The high-order bit of
  the TID encodes direction (0 from Initiator, inverted at the Responder before it's echoed back) so
  simultaneous bidirectional transactions on the same socket association can't collide — usable TID
  space is therefore `2**15`.
- **The TID test** (§7.8.2.3, Tables 6–8): the Responder MAY cache `LastTID` per remote Initiator.
  Given window size `W` (spec's worked example uses `W = 2**14`, i.e. half the TID space) and
  `RcvTID` from an incoming Invoke:
  - if `RcvTID == LastTID` → **Fail** (exact duplicate)
  - if `RcvTID > LastTID` and `(RcvTID - LastTID) <= W` → **Ok** (new, in-window)
  - if `RcvTID > LastTID` and `(RcvTID - LastTID) > W` → **Fail**, but see §7.8.2.4
  - if `RcvTID < LastTID` and `|RcvTID - LastTID| < W` → **Fail** (per §7.8.2.4, still possibly a
    legitimate out-of-order message — do not just silently drop)
  - if `RcvTID < LastTID` and `|RcvTID - LastTID| >= W` → **Ok** (interpreted as wraparound)
  - "TID test Fail" does **not** mean "reject the transaction" — Table 6 says Fail while the
    underlying transport *can* guarantee no duplicates → still "Start transaction"; Fail while it
    *cannot* guarantee that → **invoke TID verification** (the three-way handshake), not an
    automatic abort.
- **Out-of-order delivery is explicitly anticipated** (§7.8.2.4): messages can arrive with a lower
  TID than a later one due to network reordering, which can cause the TID test to spuriously Fail.
  The spec says this "will not break the protocol" but "will lead to degraded performance" (an
  unnecessary verification handshake) and suggests, as a mitigation, caching an *array* of past TIDs
  rather than a single `LastTID` scalar, and accepting a TID unconditionally if it's found in that
  array.
- **TIDnew flag and non-monotonic TID** (§7.8.3.2, §8.3.1.2): the Initiator MAY generate a
  non-monotonic TID in two legitimate cases — a crash/reboot that re-picks a smaller TID, or genuine
  wraparound after `2**14` transactions to a *different* Responder while this Responder's cached
  `LastTID` goes stale. Neither breaks the protocol by itself, but both trigger unnecessary TID
  verification unless the Initiator proactively sets `TIDnew` in the next Invoke, which tells the
  Responder to invalidate its cached `LastTID` for that Initiator without a handshake. **Critical
  rule**: "When the Initiator uses the TIDnew flag it MUST NOT initiate any subsequent transaction
  until the TID verification has been completed" — because a delayed `TIDnew` packet racing with
  newer, normal-TID packets could get a lower TID erroneously accepted into the Responder's cache if
  this ordering isn't enforced.
- **Three-way TID-verification handshake** (§7.9, exact sequence quoted from the spec):
  ```
  (1) I -> R   This is the TID (Invoke PDU)
  (2) I <- R   Do you have an outstanding transaction with this TID? (Ack PDU, Tve flag set)
  (3) I -> R   Yes/No! (Ack PDU with TIDok set / Abort PDU with reason INVALIDTID)
  ```
  The invoke message **MUST NOT** be delivered to the WTP user until this handshake completes
  successfully (§7.9.1, §7.1.5.2). Outcome table (§7.9.3, Table 9): Valid TID + `TIDnew==True` →
  start transaction and reset `LastTID = RcvTID`; Valid TID + `TIDnew==False` → start transaction but
  leave `LastTID` **unchanged** (do not accidentally advance the cache on a verification success
  when TIDnew wasn't set); Invalid TID → abort.
- **TID space and rate bound**: "This MUST NOT be done faster than `2**14` steps in `2*MPL`"
  (Maximum Packet Lifetime) — i.e. the whole TID-wraparound safety argument is only valid under an
  assumed bound on how fast TID can cycle relative to how long a duplicate packet can still be
  in flight. The spec itself flags this as fragile for store-and-forward bearers with high-variance
  MPL (its own example: GSM SMS-C queuing) (§7.8.2.3, Note).

### 1.6 Abort PDU semantics (§7.7, §8.3.4)

Two abort **types** (§8.3.4.1, Table 18): `PROVIDER` (0x00, generated by the WTP provider itself)
and `USER` (0x01, generated because the WTP user issued `TR-Abort.req`; the reason code in this case
is opaque to WTP and owned by the user, e.g. WSP-defined codes). Provider abort reasons are a closed
enum (Table 19): `UNKNOWN`, `PROTOERR`, `INVALIDTID` (Initiator-only, negative TID-verification
result), `NOTIMPLEMENTEDCL2`, `NOTIMPLEMENTEDSAR`, `NOTIMPLEMENTEDUACK`, `WTPVERSIONONE`,
`CAPTEMPEXCEEDED`, `NORESPONSE` (AEC exhausted), `MESSAGETOOLARGE`, `NOTIMPLEMENTEDESAR`. Three
special-case abort procedures at the sender (§7.7.4): (A) message not yet sent → just discard
locally; (B) message sent/sending → send Abort PDU to peer; (C) receiving side of an Abort PDU →
generate `TR-Abort.ind` and discard all transaction data.

### 1.7 "Group acknowledgement" — actual mechanism is SAR packet groups, not Ack-of-Acks (§7.14–7.15)

There is no core-spec concept named "group ack" or "Ack-of-Acks." What exists, and is **optional**
(not part of the mandatory Class 0/1/2 machine), is:

- **Basic SAR packet groups** (§7.14.3–7.14.4): large messages are segmented into
  Segmented-Invoke/Result PDUs sent in stop-and-wait "packet groups"; the last packet of a group
  carries the `GTR` flag, the last packet of the whole message carries `TTR`. The receiver Acks a
  *complete* group cumulatively (Ack PDU carrying the PSN of the GTR packet) or Nacks it with the
  specific missing sequence numbers for selective retransmission — explicitly **not** a full-message
  resend, to minimize over-the-air traffic.
- **Extended SAR sliding window** (§7.15.3–7.15.4, for messages beyond 256 packets / the 8-bit PSN
  limit): multiple groups can be outstanding at once, bounded by a negotiated `NumGroups` ×
  `MaximumGroup` window; Ack is cumulative over the highest-PSN complete group, Nack lists missing
  PSNs with explicit high/low-byte disambiguation rules for PSN values that may have wrapped; the
  spec explicitly requires a **Nack hold-off timer** to avoid retransmission storms when duplicate
  Nacks for the same group arrive in a short window (§7.15.4), plus **mandatory exponential
  backoff** on retransmission in this mode.

This terminology gap (the task framing used "group ack/Ack-of-Acks," which isn't the spec's own
term) is flagged explicitly rather than silently substituted — see Open Questions.

## 2. Known historical implementation pitfalls (Kannel and general)

Kannel (`gateway-kannel/` in this repo) is directly relevant: it's a real, long-lived (1999–present)
open-source implementation of exactly this spec, and its bug history is decent evidence for where
real implementations get WTP wrong. Sources below are Kannel's own published ChangeLogs (primary,
first-party project history) plus Kannel's actual state-machine source files (`.def` macro tables
that mirror the spec's §9 tables almost 1:1 — useful as a cross-check on the spec reading above, not
just as "a pitfall list").

**1. Malformed/truncated PDU crash while deducing TID for an error response** — Kannel
`ChangeLog-1.4.1`, 2006-02-23, Stipe Tolj, bug #310: *"fixing bug #310, causing wapbox to panic while
gwlist_append() produces an assertion error if a malformed WTP datagram is tried to be processed and
we try to send an RcvError PDU deducing the TID value."* This is a textbook "trusted the TID field
of untrusted/truncated input before validating length" bug — a crash in production from exactly the
class of input this repo's transport steering doc already calls out (`RUST_TRANSPORT_STEERING.md`
§6: "Do not panic on network, protocol, WBXML, or user-controlled input," "Validate lengths before
slicing, indexing... conversion, or state mutation"). It's also the concrete argument for making
`RcvErrorPDU` handling a state-table-declared transition (§9.2, Table 37 in the spec explicitly has
a `RcvErrorPdu` entry precisely so a corrupt PDU never has to reach into fields it can't trust) rather
than an ad hoc code path.

**2. Wrong Abort *type* sent on retry exhaustion** — Kannel `ChangeLog-1.3.2`, 2003-12-05, bug #102:
*"In RESULT_RESP_WAIT state, when TimerTO_R occurs and MAX_RCR [is reached], we should send Abort
PDU with type PROVIDER instead of USER."* This is a subtle spec-conformance bug, not a crash: the
abort **type** field (§8.3.4.1) has semantic meaning to the peer (was this the WTP provider giving
up, or did the local application explicitly cancel?) and Kannel shipped a version that mislabeled a
provider-driven retry-exhaustion abort as a user abort. This maps directly onto "keep protocol
behavior/decisions in explicit enums, not string/bool proxies" — if `AbortType` and `AbortReason`
aren't distinct, statically-checked values threaded through every abort-emitting transition, this
exact bug is trivial to reintroduce.

**3. Resource-bound violation on oversized SAR objects** — Kannel `ChangeLog-1.3.2`, 2003-11-21:
*"fixing PANIC output in case object is larger [than the] maximum SAR limit of 256 packets."* The
spec itself defines the 256-packet ceiling as a hard structural limit (8-bit PSN, §7.14.1) and
Extended SAR exists specifically to work around it (§7.15.1) — but a naive implementation that
doesn't check the boundary before assuming a fixed-width PSN will panic instead of falling back to
Extended SAR or erroring cleanly. Directly relevant to this repo's "bound response bodies... reject
oversized or malformed input deterministically" rule.

**4. Architectural note from Kannel's actual state-machine source, not a bug but a design fact worth
importing**: Kannel's `wtp_init_states.def` (Initiator role) only implements **Class 0 and Class 1**
transitions — there is no Class 2 Initiator role in Kannel at all. This makes sense for what Kannel
*is*: a gateway whose WTP-Initiator role is only used for WAP Push (Class 0/1, one-way,
gateway-to-device); the gateway is always the **Responder** for Class 2 (client method invocations
coming from the phone/browser). **Waves is the inverse of Kannel here** — as a WML browser client,
Waves-as-Initiator needs full Class 2 Initiator behavior (RESULT WAIT → RESULT RESP WAIT → WAIT
TIMEOUT), which is exactly the role Kannel's own codebase doesn't exercise. This means Kannel's
source, while a good cross-check for Responder-side and Class 0/1 Initiator behavior, is **not** a
complete reference for the Class-2-Initiator path this project actually needs most — that path has
to be built and tested against the spec's state tables directly, not just "made to look like
Kannel."

No further first-party "lessons learned implementing WTP" retrospective beyond the ChangeLog entries
above and the spec's own explicitly-flagged fragility notes (§7.8.2.3's MPL-variance caveat,
§7.8.2.4's out-of-order-TID performance caveat) turned up in this pass — see Open Questions.

## 3. Recommended design shape for this codebase

Given the existing pattern (`network::{wdp, wcmp, wsp, wtls, wtp}`, fixture-driven per-clause tests,
pure functions over explicit enums, no hidden global mutable state, no wall-clock timing) and the
steering-doc constraints (`RUST_ENGINE_STEERING.md`/`RUST_TRANSPORT_STEERING.md`: explicit enums,
deterministic transitions, injectable scheduler, typed errors, bounded untrusted input), a
from-scratch WTP transaction state machine should look roughly like this. This is a design sketch,
not code.

### 3.1 Types

- **`WtpRole { Initiator, Responder }`** and **`WtpTransactionClass { Class0, Class1, Class2 }`** as
  separate, orthogonal enums — do not fold role into class or vice versa, because the legal state
  *sets* differ by role (Initiator: `Null/ResultWait/ResultRespWait/WaitTimeout`; Responder:
  `Listen/TidokWait/InvokeRespWait/ResultWait/ResultRespWait/WaitTimeout`), and some states are
  role-and-class-gated (`ResultRespWait`/one flavor of `WaitTimeout` is Class-2-only on the
  Initiator side, Class-1-only on the Responder side per §9.5/§9.6). Model that with **two separate
  state enums** (`WtpInitiatorState`, `WtpResponderState`) rather than one shared `WtpTransactionState`
  enum with role-dependent legality — a shared enum lets you construct nonsense combinations
  (`ResultRespWait` for a Responder-role Class-1 transaction) that the type system should simply
  make unrepresentable, matching the "prefer methods/types over `Copy`-shared value soup" API
  guidance already in `RUST_ENGINE_STEERING.md` §5.
- **`WtpAbortType { Provider, User }`** and **`WtpAbortReason`** (closed enum matching Table 19:
  `Unknown, ProtocolError, InvalidTid, NotImplementedClass2, NotImplementedSar, NotImplementedUAck,
  WtpVersionOne, CapacityTemporarilyExceeded, NoResponse, MessageTooLarge, NotImplementedExtendedSar`)
  as **distinct, always-paired fields** on any abort-emitting transition/decision — this is the
  direct type-level fix for Kannel bug #102 (§2.2 above): make it structurally impossible to emit an
  `AbortReason` without an explicit `AbortType` alongside it, so "which type do I send here" can
  never silently default to the wrong one.
- **`Tid(u16)`** newtype (not a bare `u16`) with the direction bit and the `2**15`-usable-space
  invariant encoded in its constructor/accessor methods, plus a **`TidWindow` / `tid_test` pure
  function** implementing the exact Table 7/8 comparison (this repo's existing
  `wtp_replay_window.rs::tid_distance`/`decide_responder_tid`/`decide_initiator_tid` already do
  almost exactly this and are a good starting point — see §4).
- **`WtpTimerKind { Retry, Ack, Wait }`** and counters **`RetransmissionCounter(u8)` /
  `AckExpirationCounter(u8)`** as distinct newtypes, not interchangeable `u8`s, so a
  `RetransmissionCounter` can never accidentally get compared against `AEC_MAX` or vice versa —
  these bound genuinely different things (PDU resend attempts vs. how many times the Ack-interval
  timer was allowed to lapse while waiting on the user) and conflating them was exactly the kind of
  ambiguity the spec itself is careful to keep separate (§9.4.2).
- **Deterministic scheduler boundary**: timers must be **data**, not `tokio::time`/`std::time`
  calls — a `WtpTimerEvent { kind: WtpTimerKind, deadline: LogicalTime }` value emitted by the pure
  transition function, with an injected `LogicalTime`/monotonic-tick source supplied by the caller
  (mirroring how `retransmission.rs::decide_retransmission` already takes `elapsed_ms` as an
  explicit argument rather than reading a clock — that pattern is already correct in this codebase
  and should be the template, not `std::time::Instant::now()` anywhere inside `network::wtp`).
- **Pure transition functions returning `(NextState, Vec<WtpAction>, WtpTransitionTrace)`**, where
  `WtpAction` is an enum of side-effect *requests* (`EmitPdu(...)`, `StartTimer(...)`, `StopTimer(...)`,
  `IndicateToUser(...)`, `AbortTransaction(type, reason)`) that the caller executes — the state
  machine itself never performs I/O, matching this repo's existing `advance_wtp_transaction_state`
  shape and the "internal functions return Rust errors/values, JS/IO boundary conversion happens at
  the edge" rule from `RUST_ENGINE_STEERING.md` §6/§8.

### 3.2 Three correctness traps to guard with types or tests specifically

1. **TID verification must gate delivery, and `LastTID` must only advance on the *correct* branch of
   Table 9.** The spec is explicit that (a) the invoke message "MUST NOT be delivered to the user"
   before a triggered three-way handshake completes (§7.9.1), and (b) on a *successful* verification
   with `TIDnew==False`, `LastTID` is explicitly left **unchanged**, only advancing when
   `TIDnew==True` (§7.9.3, Table 9) — get this backwards and you either replay old transactions to
   the user or silently desync the Responder's duplicate cache. Guard this with a type that makes
   "deliver to user" only constructible from a `TidVerified` or `TidInWindow` witness value, never
   directly from a raw `RcvInvoke` event — and a fixture-driven test (mirroring the existing
   `wtp_tid_replay_window_mapped` fixture pattern) that walks exactly the "TIDnew, verification
   succeeds" vs. "no TIDnew, verification succeeds" cases and asserts `LastTID` only changes in the
   first.
2. **Abort type/reason must never be separable in the API surface** (Kannel bug #102, §2.2 above).
   Any function/variant that can emit an Abort PDU should take `(WtpAbortType, WtpAbortReason)` as
   one inseparable value (e.g. a `WtpAbort { type: WtpAbortType, reason: WtpAbortReason }` struct
   built only via named constructors like `WtpAbort::provider(NoResponse)` /
   `WtpAbort::user(reason)`), not two independently-defaultable fields — and a test asserting that
   AEC-exhaustion and RCR-exhaustion transitions specifically produce `Provider` type aborts (per
   §9.5/§9.6's `AEC == AEC_MAX` / `RCR == MAX_RCR` rows), since that's precisely the row Kannel got
   wrong in production.
3. **RID/duplicate handling must never trust length-derived fields before bounds-checking, and a
   malformed/truncated PDU must resolve to a defined `RcvErrorPdu`-style event, not a panic or an
   attempt to read a TID out of bytes that were never validated** (Kannel bug #310, §2.1 above; also
   directly required by `RUST_TRANSPORT_STEERING.md` §6). Concretely: PDU parsing (fixed header,
   variable TPIs) must be a fallible operation returning a typed error *before* any TID/duplicate
   logic ever runs, and the state-machine layer should only ever see a value of a type that already
   proves "this PDU's fixed header, at minimum, was structurally valid enough to read a TID from" —
   never a raw byte slice. Test with property/fuzz-style truncation cases feeding 0..N-byte prefixes
   of valid Invoke/Ack/Abort PDUs and asserting every one resolves to a typed decode error, never a
   panic.

### 3.3 Sequencing note specific to this project

Per §2 point 4 above: because Waves is a **client**, the WTP work that actually unblocks
connection-oriented WSP is the **Initiator role, Class 2** state machine (`Null → ResultWait →
ResultRespWait → WaitTimeout`) — that's the path with the least existing local precedent (Kannel's
own Initiator code doesn't implement it either) and the one worth writing spec-table-driven fixture
tests against first, rather than starting from Responder/Class-1 (push) which is comparatively
well-trodden by Kannel's own Responder implementation and this repo's WTLS handshake reuse of
`duplicate_cache`/`retransmission`.

## 4. Current-code verification

All paths relative to the repo root.

**Module layout** — `transport-rust/src/network/wtp.rs` (3 lines) is just a re-export shim:

```rust
pub mod duplicate_cache;
pub mod retransmission;
pub mod state_machine;
```

pointing at `transport-rust/src/network/wtp/{duplicate_cache,retransmission,state_machine}.rs`.
There is also a **fourth**, separately-rooted WTP file at the crate top level:
`transport-rust/src/wtp_replay_window.rs` (205 lines), declared via `mod wtp_replay_window;` at
`transport-rust/src/lib.rs:24` — note this one is *not* under `network::wtp`, which is itself a
small organizational inconsistency worth flagging if/when this area gets real design attention
(four WTP files split across two different module roots).

**`network::wtp::duplicate_cache`** (`transport-rust/src/network/wtp/duplicate_cache.rs`, 142
lines): `WtpDuplicateCacheState` (line 27, wraps a `VecDeque<WtpDuplicateObservation>`) with a
`decide()` method (line 44) returning `Accept | ReplayCachedTerminal | DropAsDuplicate` given a
`(policy, tid, is_terminal_result)` triple. Policy (`WtpDuplicatePolicy`, line 8) is just
`{cache_terminal_responses: bool, max_cached_transactions: usize}` — a bounded FIFO cache keyed on
raw `tid: u16`, not the spec's `LastTID`-plus-window test; it has no notion of TID *distance*,
wraparound, or the three-way verification handshake at all. It is reused by
`network::wtls::handshake.rs:1,136` for WTLS's own retry/dedup logic (confirmed).

**`network::wtp::retransmission`** (`transport-rust/src/network/wtp/retransmission.rs`, 271 lines):
`WtpRetransmissionPolicy` (line 15: `max_retries, initial_delay_ms, max_delay_ms, backoff_kind,
backoff_step_ms, sar_enabled, nack_holdoff_ms`) and a pure `decide_retransmission()` function (line
88) taking an explicit `WtpRetransmissionEvent` (`TimerExpired | NackObserved{elapsed_ms} |
AckObserved | Reset`) — timing is passed in as data (`elapsed_ms: u64`), not read from a clock,
which is the correct pattern per the steering docs. It already models SAR Nack hold-off
(`nack_holdoff_ms`) at a policy level. Reused by `network::wtls::handshake.rs:4,137`. This module is
the best existing template for "pure, deterministic, injectable-time" design in this codebase.

**`network::wtp::state_machine`** (`transport-rust/src/network/wtp/state_machine.rs`, 239 lines):
`WtpTransactionClass{Class0UnreliableInvoke, Class1ReliableOneWay, Class2ReliableRequestResponse}`
(line 4), a single shared `WtpTransactionState{Idle, InvokeSent, AwaitingAck, AwaitingResult,
Completed, Aborted, TimedOut, Closed}` (line 11) used across *all three classes and with no
Initiator/Responder role distinction*, `WtpTransactionEvent{SendInvoke, ReceiveAck, ReceiveResult,
ReceiveNack, TimerExpired, Abort}` (line 23), and a single `advance_wtp_transaction_state()` match
function (line 58) with only inline `#[cfg(test)]` unit tests (lines 107–239) — **confirmed via
grep that no file outside this one references `state_machine::` or
`network::wtp::state_machine`, and no fixture directory under
`transport-rust/tests/fixtures/transport/` corresponds to it** (only
`wtp_duplicate_cache_policy_mapped/`, `wtp_retransmission_policy_mapped/`, and
`wtp_tid_replay_window_mapped/` exist, none named for `state_machine`). This is an orphaned,
simplified sketch, not a spec-conformant nor wired-up implementation: it has no `WtpAbortType`, no
TID handling, no RCR-vs-AEC distinction, no hold-on-Ack concept, and folds Initiator/Responder into
one state set.

**`wtp_replay_window.rs`** (crate-root, 205 lines — the closest existing thing to real spec-conformant
TID logic): defines `WTP_TID_MODULUS = 1 << 14` (line 5) and a `tid_distance()` helper (line 8) doing
modular subtraction, then two separate decision functions matching the spec's Initiator/Responder
split: `decide_responder_tid()` (line 117, → `Accept | ReplayCachedTerminal | DropAsDuplicate |
DropAsStale`) implementing something close to the Table 7/8 window test against a `WtpResponderPolicy
{replay_window, cache_mode, duplicate_assumption}`, and `decide_initiator_tid()` (line 161, →
`Accept{...} | DuplicateRetransmission | RequireRestart | OutOfReplayWindow`) bounding acceptance by
`max_replay_steps() = min(2*MPL, WTP_TID_MASK)` (line 86, matching the spec's `2**14` steps per
`2*MPL` rate bound from §7.8.2.3/§7.8.3.1). This is genuinely closer to spec-conformant than
`state_machine.rs`, but note it implements the **TID window test only** — not the three-way
verification handshake PDU exchange (§7.9), not `TIDnew` flag semantics as a stateful protocol step,
and not integration with the actual transaction state machine (it's tested only via
`wtp_tid_replay_window_mapped` fixtures through `transport-rust/src/tests/replay_profiles.rs:6`, in
isolation).

**Not present anywhere in the crate** (grepped for `group_ack|GroupAck|TID_OK|tid_ok|wraparound|
tid_wrap|Ack-of-Acks|ack_of_acks`, zero hits outside what's described above): the SAR packet-group
Ack/Nack mechanism, the `HoldOn`/hold-on-acknowledgement concept, `AbortType`/`AbortReason` as
distinct typed values, `RCR`/`AEC` as separate bounded counters, and any Responder-role or
Class-2-Initiator-role state machine at all.

**Net assessment**: this project has three genuinely useful, independently-tested *primitives*
(duplicate cache, retransmission/backoff policy, TID-window test) that are reasonable building
blocks, plus one *orphaned, non-spec-conformant sketch* (`state_machine.rs`) that should probably be
replaced rather than extended when the real state machine gets built — it doesn't yet encode enough
of the spec (no role split, no abort typing, no TID integration) to be worth preserving as a
starting point, though its "pure function + trace struct" shape is consistent with the rest of the
crate and worth keeping as a pattern.

## Open questions / what's still genuinely uncertain from available sources

1. **"Group acknowledgement (Ack-of-Acks)" terminology mismatch.** The actual spec mechanism is the
   SAR packet-group Ack/Nack (§7.14–7.15), which is optional and separate from the mandatory Class
   0/1/2 machine. If "group ack" was meant to refer to something else (e.g. a WSP- or WDP-layer
   concept, or a later WAP 2.x/OMA revision's terminology), it was not found in
   WAP-224-WTP-20010710-a, and later WAP 2.x transport specs were not chased since this project's
   compliance target is WAP 1.2.1/WML 1.3. Worth a direct confirmation before scoping SAR work.
2. **Concrete default timer values** (Appendix A of the spec, bearer-network-dependent tables) were
   not read in this pass — the normative body (through §10, page 58) was the stopping point. If
   default `R`, `A`, `W` intervals or `RCR_MAX`/`AEC_MAX` values are needed for an initial policy
   default, that's a follow-up fetch of the same PDF, later pages.
3. **No independent, non-Kannel "lessons learned implementing WTP" retrospective** turned up in this
   search pass beyond the two academic Petri-net/Event-B verification papers surfaced by search
   (Coloured Petri Nets analysis of Class 2 WTP; Event-B modeling of Class 2 WTP) — their full text
   was not fetched, so it's unclear whether they document concrete implementation bugs versus purely
   formal-verification findings.
4. **Kannel mailing list archives** (devel@kannel.org) were not directly searchable/fetchable in this
   pass — only the published ChangeLogs and `.def` state-table source files were used as evidence.
   The three ChangeLog bugs cited (#310, #102, and the SAR-256 panic) are a small, first-party-sourced
   sample, not a comprehensive bug-history audit.
5. Whether this project should keep `wtp_replay_window.rs` at crate root or fold it under
   `network::wtp/` alongside the other three files (module-layout inconsistency noted in §4) is a
   scoping/architecture call for whoever picks up the actual implementation slice.

---

# Part 3: Historical WAP Microbrowser Quirks (UP.Browser/Openwave and Nokia) vs. Formal WML Spec

**Purpose:** Assess how much citable, primary/secondary-source evidence exists for real-world
divergence between historical WAP microbrowsers and the formal WML 1.1/1.2/1.3 specification, to
inform whether/how this project should build a "compatibility floor: strict-historical-observable-
behavior" profile. Scope: web research only, conducted against ~1999–2006 material.

## Summary

There is genuine, citable evidence that cross-browser WML rendering divergence was a real,
acknowledged industry problem in 1999–2002 — strong enough that the WAP Forum itself published an
official "Generic Content Authoring Guide" (GCAG) in response. That document is the single best
source found and is analyzed in depth below. However, the *specificity* the project ultimately
wants — "Openwave UP.Browser version X does Y, Nokia browser version Z does W" — is only sparsely
available. Most industry documentation from the era anonymizes divergence as "some browsers,"
either out of WAP Forum's consortium neutrality policy or because secondary tutorial sites never
rigorously tested/attributed behavior. Exactly two sources were found that name a specific vendor +
version + concrete divergent behavior triple with any confidence, both discussed below. Primary
vendor documentation (developer.openwave.com, developer.phone.com, Nokia Forum archives) was not
directly recoverable in this session — Wayback Machine fetches are blocked in this environment,
and the live successor sites no longer host the old content. That is the largest gap; it is very
likely still partially recoverable with more targeted Wayback Machine or physical-archive research
that this session could not perform.

**Bottom line for the project:** there is enough evidence to justify building the compatibility
floor concept as a *data-driven, source-cited, opt-in* structure, and enough specific evidence to
seed it with a small number of well-attributed entries — but not enough to responsibly populate a
broad "UP.Browser quirk profile" or "Nokia quirk profile" without more research or without
explicitly marking most entries as low-confidence/pattern-only rather than vendor-attributed.

## UP.Browser / Openwave (Phone.com) quirks found

### High confidence, directly attributed

**1. Openwave 6.2.2 softkey assignment for `<do type="accept">` and `<do type="options">`.**
Per a period WML developer tutorial (DevelopersHome.com, "Programming Softkeys of Mobile Phones
and the `do` Element"): on Openwave 6.2.2, the *first* `<do type="accept">` element in a card
becomes the left softkey; a *second* accept-type `<do>` becomes the right softkey; any additional
accept-type `<do>` elements are pushed into a menu. Separately, the *first* `<do type="options">`
becomes the right softkey, and if multiple options-type `<do>` elements exist, it is labeled
"Menu." This is contrasted in the same tutorial against Nokia Mobile Browser 4.0 and Sony Ericsson
T610/T68i, which instead surface these as dedicated Options/Menu softkeys regardless of ordering.
— Source: https://www.developershome.com/wap/wml/wml_tutorial.asp?page=softkeys
— **Confidence: medium-high.** Named version (6.2.2) with a specific, falsifiable rule, from a
widely-cited period WAP developer tutorial site — but a secondary/tutorial source, not an Openwave
primary document or an independently reproduced test.

**2. `<select>` element rendered as a popup-style interaction on Phone.com browsers vs. a
navigable-menu style on Nokia.** Paul Smethers (then of Phone.com, Inc. — the company that became
Openwave) wrote, in a paper for the W3C's October 2000 "Digital Imaging/Appliances" workshop:
> "WAP defines a `SELECT` element for providing a list. Some devices interpret this as a popup menu
> list; others interpret it as a menu that can be used for navigation."

and, on the consequence of undeclared interaction models generally:
> "an application written for Nokia won't run in a usable manner on a Phone.com browser or other
> 3rd party browsers."

— Source: https://www.w3.org/2000/10/DIAWorkshop/smethers.html (Paul Smethers, Phone.com Inc.,
2000)
— **Confidence: high on the fact that this divergence existed and was acknowledged by an insider
at the company that built UP.Browser; medium on exact mechanics** — Smethers doesn't specify
precisely which UI Phone.com's own browser used vs. Nokia's, only that they differed. Still the
single most authoritative source found: a Phone.com employee, writing for a W3C workshop, naming
Nokia by name as the divergent counterpart.

### Lower confidence / secondary or unverified

**3. Non-standard/vendor-specific tag extensions.** Multiple secondary sources (OSnews 2006,
Microsoft's old ASP.NET WML mobile-adapter docs) describe UP.Browser as supporting carrier- and
vendor-specific tags beyond the WML spec, e.g. "custom KDDI and J-Phone tags," and note that
ASP.NET's mobile-controls framework shipped a distinct `UpWmlPageAdapter` / `UpWmlMobileTextWriter`
specifically to work around UP.Browser-specific rendering behavior (implying Microsoft's own
compatibility engineers found divergence significant enough to special-case). The specific list of
what that adapter compensates for could not be retrieved.
— Sources: https://www.osnews.com/story/13446/introduction-to-phone-web-browsers/ (2006, so
describes the *late* UP.Browser era, v6.2.x/v7.1.x, not the 1999–2001 WML-1.1/1.2 era this project
targets); https://learn.microsoft.com/en-us/previous-versions/aspnet/t32t3y06(v=vs.100)
— **Confidence: low-medium.** Confirms vendor-specific extensions existed as a category, but not
which tags/attributes specifically, and the OSnews source postdates the project's target era by
5+ years.

**4. Openwave WML Extensions tied to HDML lineage.** Several tutorial/reference sites assert that
Openwave's WML implementation carried forward extensions from its predecessor HDML (Handheld
Device Markup Language) to ease migration of existing HDML sites. A page purporting to explain this
in detail (thewirelessfaq.com, "What are Openwave WML Extensions and how do they work?") returned
HTTP 403 and could not be read in this session.
— **Confidence: low (unverified).** The HDML-lineage claim is plausible and repeated across
several tutorial-tier sources, but no primary or detailed secondary account of *which specific
extensions* resulted could be read. Concrete follow-up research target (see Open Questions).

**5. Simulator-vs-device image format mismatch.** A 2000 academic paper (WWW9 conference) is
reported, via search-engine summarization only, to state that "the UP simulator handled only the
BMP format and the DSR Wireless Application Reader accepted only GIF images" when the same WML
application was evaluated across three WAP platforms.
— Source: Kaasinen, Aaltonen, Kolari, Melakoski, Laakko, "Two Approaches to Bringing Internet
Services to WAP Devices," WWW9, May 2000 (VTT Information Technology). The paper could not be
fetched directly (archive.thewebconf.org is unreachable from this environment; ScienceDirect
returned 403); this claim comes from a search-result synthesis, not text read directly.
— **Confidence: low.** Explicitly flagged: not verified against the source text. Treat as "worth
chasing down," not as established fact.

### Not found / could not verify at all

No citable evidence was found in this session (positive or negative) regarding: UP.Browser's
specific unknown-tag/unknown-attribute error handling (spec says ignore; whether UP.Browser
actually did so, or errored, is unverified); UP.Browser deck/card caching heuristics beyond the
generic GCAG note about URL-keyed caching (see below, not UP.Browser-specific); UP.Browser
`<access>` element behavior; UP.Browser navigation-history/back-stack specifics; or any
WMLScript standard-library extensions specific to UP.Browser. These remain open questions.

## Nokia quirks found

Evidence for Nokia-specific divergence is thinner than for Openwave in this session's research.

**1. Nokia's softkey/menu convention differed from Phone.com's**, per the Smethers quote above
("an application written for Nokia won't run in a usable manner on a Phone.com browser") — evidence
*by contrast*, i.e. it tells us Nokia and Phone.com diverged, without independently documenting
Nokia's specific behavior beyond what's inferable (menu-style `<select>`/navigation rather than
popup).

**2. Nokia Mobile Browser 4.0 softkey placement**, per the same DevelopersHome.com tutorial cited
above: Options are accessed via a left "Options" softkey; template-based menus surface through the
device's dedicated Options softkey regardless of `<do>` declaration order (contrast with Openwave's
ordering-sensitive left/right/menu assignment). Same source and confidence caveats as Openwave item
1 above. Note this Nokia Mobile Browser 4.0 reference is a mid-2000s device, later than the
WML-1.1/1.2 era.

**3. Nokia WAP Toolkit / simulator leniency vs. real devices.** A commonly repeated claim (found on
TutorialsPoint's WAP emulators page, not independently corroborated) states that Nokia's WAP
Toolkit "is usually more tolerant of XML errors so that there are still pages that wouldn't be
displayed properly in an actual phone even though the simulator says it's OK." Nokia's own WAP
Toolkit 1.2 Developer's Guide was fetched directly (via a readkong.com mirror) looking for
simulator-vs-device divergence documentation and **none was found** — the guide documents Nokia's
implementation of the spec (`<select>` supporting single/multi-choice, `<input>` format masks,
`<do>` label-as-softkey-text) but does not itself disclose known gaps between simulator and
hardware behavior.
— Sources: https://www.tutorialspoint.com/wml/wap_emulators.htm (unsourced claim);
https://www.readkong.com/page/developer-s-guide-9421654 (Nokia WAP Toolkit 1.2 Developer's Guide,
official but silent on the divergence question)
— **Confidence: low on mechanics, but the general phenomenon (simulator more permissive than real
hardware) is an extremely common and plausible pattern for any embedded-device SDK of that era; it
should not be treated as Nokia-specific until corroborated.**

**4. Nokia WAP Toolkit as one of the reference simulators used in the WAP Forum's own GCAG
testing** — Nokia WAP Toolkit V1.3b and the physical Nokia 7110 handset were both in the WAP
Forum's tested-device list for the 2001 Generic Content Authoring Guide (see next section). This
confirms Nokia's browser was one of the concrete inputs behind the GCAG's "some browsers"
recommendations, but the document does not attribute any specific recommendation to Nokia by name.

**5. Toolkit-level (not in-browser) differences.** A contemporary WirelessDevNet comparison of the
three major WAP SDKs (Nokia, Ericsson, Phone.com) describes Nokia's WAP Toolkit 1.2 as a Windows
NT4-only, Java2-runtime-dependent, single integrated IDE with "a superior user interface" to
Ericsson's WapIDE 2.0 (which required jumping between separate applications and bundled Perl 5.0 /
Tcl/Tk / the Xitami web server). This is tooling/workflow evidence, not in-browser rendering
divergence, but is useful context for understanding why content targeting one vendor's toolkit
often diverged from another's in practice (developers wrote/tested against whichever SDK they had).
— Source: https://wirelessdevnet.com/first-look-wap-toolkits-from-nokia-ericsson-and-phone-com/
— **Confidence: medium on content, low on dating** — the page as served shows a September 2023
timestamp, almost certainly a CMS re-platforming date rather than the true original publication
date (internal content reads as contemporaneous with WAP Toolkit 1.2 / UP.SDK 4.0, i.e. circa
1999–2000); could not independently confirm original publication date via Wayback Machine in this
session (blocked).

### Not found / could not verify at all

No citable evidence found regarding: Nokia-specific unknown-tag/attribute handling; Nokia-specific
`<access>` element or navigation-history behavior; Nokia-specific character-encoding quirks; or any
Nokia-specific WMLScript standard-library extensions.

## Interoperability-era evidence found (cross-browser, not vendor-specific)

This is the strongest part of the research and deserves to be the anchor citation for any future
work in this area.

### WAP Forum, "Generic Content Authoring Guide for WML 1.1" (WAP-218-GCAG, Version 8, 8-Feb-2001)

URL: https://www.openmobilealliance.org/tech/affiliates/wap/WAP-218-GCAG-20010208-d.pdf
(official WAP Forum / Open Mobile Alliance archive; PDF text extracted directly with `pdftotext`
and read in full for this memo — the highest-confidence source in this whole memo).

This is an **official WAP Forum informative document** (explicitly not a normative spec) whose
entire purpose was to help developers write WML that "consistently display[s] and [is] usable
across a wide range of WAP devices," precisely because real-world browsers diverged. Its own
framing (§5.1) is directly relevant to this project's compatibility-floor concept:

> "Writing WML code for an application does not guarantee that the application will either appear
> or behave in the same way on all browsers. Each browser is a contract with the WML specification
> and even when the browser complies with the specification it can still differ from another
> browser in fulfilling that contract."

It names three distinct *causes* of divergence — non-compliance, spec ambiguity, and legitimate
vendor differentiation — which itself is a useful taxonomy for how this project might eventually
categorize quirks.

**Devices/simulators actually tested (§5.2, Table 2/3) — the closest thing to a "cast list" found
for any single piece of period evidence:**
- Simulators: Nokia WAP Toolkit V1.3b; Ericsson WAP IDE 2.0B8; Openwave UP.SDK v3.2 and v4.0
- Phones: Ericsson R380S, Ericsson R320S, Nokia 7110, Siemens S35, Phillips Azalis/Ozeo/Xenium,
  Mitsubishi Trium
- PDA: Ericsson MC218 v1.13; Palm IIIx with AU-System browser

**What the document does *not* do:** attribute any individual recommendation to a named browser.
Every behavioral justification in the document (there are ~40 of them) is phrased generically as
"some browsers..." This appears to be a deliberate consortium-neutrality choice (§7.1 states the
guide's goal is "not to define how vendors should make their browsers behave"), not an oversight.

**The specific documented divergences (verbatim justifications, anonymized by the source
itself) — this is the real payload, and every one of these is a candidate "shape" of quirk even
without vendor attribution:**

- Anchored text/images: "Some browsers display each anchored element on a separate line... some
  browsers do not scroll the screen properly when there are many links on the same line."
- Cursor loss on scroll: "some browsers lose the cursor when the screen is scrolled and the
  anchored text is large."
- List-continuation affordance: "A list of even a small number of items will flow off the screen
  of many browsers... While some browsers provide this indication, others do not."
- Select-list item ceiling: "Some browsers' support for select lists is inconsistent past nine
  items. Some browsers lose cursor context when navigating away from a list and back again."
- Accept-label collision: "Some browsers display the title of a link in place of the label for the
  'accept' event."
- Title truncation: "Some browsers display only the first 5 characters of the title of a link" /
  option title, "and only the first 5 characters" of `<do>` labels.
- Deck caching keyed by URL: "Some browsers will load decks from the cache instead of the server if
  they don't have a different URL" (test example `anchor4.cgi`) — the one direct, documented
  **caching quirk** found in this research.
- Card title display: "Some browsers will display a space for the title, even when none is
  defined" / "Some browsers do not display the title of the card on the screen."
- `order="false"` handling: "Some browsers display blank options... Some browsers display text
  preceding `<input>`s or `<select>`s on a different screen... Some browsers do not display
  anchored text properly on a card whose ordered attribute is set to false."
- `<do>` event visibility: "Some browsers display all do events on the screen" (vs. hiding some
  under a menu) — directly relevant to the softkey-model divergence Smethers describes.
- `<template>`-scoped `<do>`: "Some browsers display `<template>` defined `<do>` events separate
  from other `<do>` events, potentially accessible only by scrolling."
- 'options' event single-action limit: "Some browsers only allow one action to be defined for the
  'options' event."
- 'delete'/'help' event support: "Some browsers do not support 'delete' or 'help' events."
- `<prev>`/Back-key semantics (directly relevant to navigation-history behavior): "The different
  browsers have different default behaviour when the accept event is not defined... Some browsers
  do not provide users with a 'back' facility unless the `<prev>` action is defined. However, some
  other browsers have a hard 'Back' key which cannot be programmatically overridden." A genuinely
  important, concrete divergence: **some browsers had a hardware Back key that bypassed WML
  navigation semantics entirely**, while others required explicit `<prev>` wiring.
- Vendor-specific `<do>` types (`x-foo`, `vnd.foo`): "On some browsers, `<do>` events of generic,
  experimental or vendor-specific types are displayed as blank links" — direct evidence that
  vendor-specific `<do>` type extensions were a real, if fragile, practice.
- `<do>` label rendering near hardware keys: "Some browsers display the labels near the keys
  corresponding to these events. If spaces are present, it can look like an unlabeled key is
  labelled."
- `<fieldset>`: "Few browsers implement `<fieldset>`s. Where they are supported, `<fieldset>`s
  interfere with browser display of other elements."
- Image size floor: "The smallest screen width of the browser that supports images is 81 pixels...
  The smallest screen height of the browser that supports images is 44 pixels" — concrete numeric
  constraints derived from real device testing.
- `localsrc` (client-resident icon substitution): "Locally defined images are different for
  different browsers" — confirms `localsrc` was real but non-portable across vendors.
- WBMP vs. other image formats: "All browsers that support images support the wireless bitmap
  type, but not necessarily any other image type."
- `<select>` `onpick` quirks: "In some browsers, trying to select on the default option will not
  trigger the onpick event"; "Some browsers don't handle option items mixed with 'onpick' well";
  multi-select + `onpick` combination is "implemented differently on different browsers and its
  behaviour is inconsistent and generally non-sensical" (sic).
- `onenterbackward`/`onenterforward` and the **history/back-stack**: "`onenterbackward`, when used
  for navigation, adversely interferes with the history stack, unexpectedly trapping the user in
  the new card" — the clearest documented navigation-history divergence found.
- Text formatting: soft hyphens "not usefully supported by most browsers"; non-breaking spaces
  "does not work on every browser. Some browsers treat 'non-breaking' spaces as 'breaking spaces'";
  underscores in anchored text obscured because "some browsers underline anchored text."
- Tables: "Anchored text may destroy the format of the table"; nowrap-mode overflow "cannot be
  viewed in some browsers"; general recommendation to avoid tables entirely.

This single document is, on its own, a legitimate and citable foundation for the *shape* of a
compatibility-floor taxonomy, even without per-vendor attribution.

### Other cross-browser evidence (lower confidence)

- **wApua** (a hobbyist WML browser/debugger, still on GitHub): the README states the author's
  motivation was "frustration about commercial WML browsers (WinWAP et al.), that didn't fit my
  requirements," and specifically that wApua "interprets some tags that WinWAP 2.2/2.3 interprets
  very rudimentary or even wrong, e.g. tables." WinWAP is a different (PC-based) WML browser, not
  UP.Browser or Nokia's, but this is direct, named, versioned developer testimony about real WML
  interoperability pain in the era. — Source: https://github.com/xtaran/wApua
- **Kaasinen et al., WWW9 2000** (see UP.Browser section above, item 5) — reports testing a WML
  application across three separate WAP platforms/simulators and finding differing supported image
  formats. Not independently verified in this session.

## Recommended approach for this project

**(a) Is there enough recoverable primary-source evidence for real, citable quirk profiles?**

Partial yes, with an important caveat. There is more than enough evidence that (1) real,
substantial cross-browser WML divergence existed, and (2) the *categories* of divergence are well
documented (softkey/`<do>` event visibility and ordering, select-list scrolling/item limits,
title/label truncation lengths, deck caching-by-URL, `<prev>`/hardware-Back-key interaction,
vendor-specific `<do>` types, image size floors, `localsrc` non-portability, `onenterbackward`
history-stack trapping, table/nowrap handling, non-breaking-space/soft-hyphen support). That
categorical evidence is strong enough to build against today.

What is *not* sufficiently evidenced yet is precise **vendor attribution** — i.e., which of those
"some browsers" behaviors specifically describes UP.Browser vs. specifically describes Nokia's
browser, at a specific version, in a specific WAP-1.x era. Exactly two data points with
named-vendor+version attribution were found (the Openwave 6.2.2 softkey-assignment rule, and
Smethers' Phone.com-vs-Nokia SELECT-interaction-model claim), both from secondary/tutorial-tier
sources that could not be independently reproduced or corroborated against a primary
Openwave/Nokia document.

**(b) How should quirk documentation be structured so it doesn't silently become default
behavior?**

Given the confidence gradient found in this research (ranging from "WAP Forum official document"
down to "unsourced tutorial-site claim" down to "search-engine synthesis of a paper never read"),
the project should almost certainly:

1. Keep quirk data **out of the runtime engine's control flow entirely** by default. It should
   live as a structured, versioned data file (e.g. `docs/wml-engine/historical-quirks.{json,yaml}`
   or similar under `engine-wasm/`'s docs tree, not inside `engine-wasm/engine/src/`), with each
   entry carrying at minimum: `vendor`, `product`/`version` (or `null` if unattributed/pattern-only),
   `wml_construct` (tag/attribute/event), `claimed_behavior`, `source_url`, `source_type` (primary
   spec doc / vendor doc / contemporary trade press / tutorial site / modern retrospective /
   unverified-search-synthesis), and a `confidence` tier matching the gradient actually found (this
   memo's own three-tier informal scale — high/medium/low — is a reasonable starting taxonomy).
2. Treat every entry lacking a `source_type` of "primary" or "contemporary trade press" as
   **not implementation-ready** — i.e., something to record for future verification, not something
   the runtime should branch on yet.
3. When (if) a runtime-level compatibility profile type is eventually added per `AGENTS.md`'s
   multi-target/contract-first guidance, it should be **explicitly selected, never default** (e.g.
   an enum variant like `CompatibilityProfile::StrictWml13` (default) vs.
   `CompatibilityProfile::HistoricalObserved(SourcedQuirkSet)`), and any quirk it applies should be
   traceable back to a specific entry in the sourced data file — never inlined as an unattributed
   `if` branch in parser/runtime code. This keeps the existing WAP 1.2.1/WML 1.3 compliance-evidence
   program (which this repo already treats as authoritative and spot-checked) uncontaminated by
   speculative or low-confidence historical claims.
4. Because the GCAG's own "some browsers" phrasing means many entries will *never* get precise
   vendor attribution no matter how much more research is done, the data file should support
   **unattributed pattern entries** (source: WAP Forum GCAG, vendor: "generic period divergence,
   attribution unknown") as a legitimate, clearly-labeled category distinct from vendor-specific
   entries — rather than forcing false precision by guessing which vendor GCAG meant.

**(c) A reasonable, bounded first step vs. what should wait**

Bounded first step, if the project wants one now: transcribe the WAP-218-GCAG "some browsers"
catalog above into the structured, source-cited data file described in (b), as
**unattributed/pattern-tier entries** (confidence: high-on-existence, none-on-vendor-attribution),
plus the two named-vendor entries found (Openwave 6.2.2 softkey assignment; Phone.com-vs-Nokia
SELECT interaction model, both marked medium confidence with their tutorial/secondary-source
caveats attached verbatim). This is bounded, fully cited, and adds zero runtime behavior — it's
pure documentation that a future implementation slice could consume. It also directly satisfies
this repo's own compliance-context-retrieval convention of keeping "generated packs... project
evidence, not agent instructions" — the same posture should extend to this quirk data.

What should explicitly **wait**: any runtime `CompatibilityProfile` type, any change to
parser/runtime/layout behavior, and any claim of "Nokia does X" or "UP.Browser does Y" that isn't
already double-sourced above. In particular, do **not** implement the Openwave 6.2.2 softkey
left/right/menu-assignment rule or the SELECT popup-vs-menu distinction as actual runtime behavior
yet — both come from secondary sources that could not be independently verified, and implementing
them now would be exactly the "guessing" the original architecture review warned against, just
with better citations attached. The right next research step (see Open Questions) is trying harder
to reach primary Openwave/Nokia developer documentation before writing any code.

## Source scarcity / limitations (honest assessment)

- **Wayback Machine is unreachable from this research environment** (fetch errors on any
  `web.archive.org` URL). This is a major limitation: the most promising leads for primary
  vendor documentation — archived `developer.openwave.com`, `developer.phone.com`,
  Nokia Forum/`forum.nokia.com` WAP developer docs — are almost certainly only accessible via
  Wayback Machine today, since the live successor sites (Openwave no longer exists as such;
  Nokia's developer sites have been reorganized multiple times) do not host this material. This
  single tooling constraint is likely the largest reason this memo can't do better than it did.
- **thewirelessfaq.com returned HTTP 403** on the one page (`7.17 What are Openwave WML
  Extensions and how do they work?`) that looked most likely to directly answer the WMLScript /
  extension-tag part of the research question. Worth a manual retry outside this session.
- **The WWW9 2000 conference proceedings could not be fetched** (`archive.thewebconf.org` DNS
  failure) nor the ScienceDirect abstract (403) for the Kaasinen et al. paper, so that citation
  rests on a search-engine-generated summary rather than text read directly — flagged inline
  above and should be treated as unverified until someone reads the actual paper.
- **Usenet archives** (comp.protocols.wireless.wap, alt.cellular, etc.) were not directly
  searched — only web search queries targeting them were run, which returned no matching Usenet
  content, likely because Google Groups' Usenet archive isn't well indexed by general web search
  and needs to be searched directly at groups.google.com.
- **wapforum.org itself** (the original site) is defunct; its successor is the Open Mobile
  Alliance archive at openmobilealliance.org, which is where the one genuinely excellent source
  (GCAG) came from. It's plausible other WAP Forum informative documents in that same archive
  (input documents, interoperability test reports, errata) contain more per-vendor detail; only
  the GCAG was found and read, not the full archive index.
- One search result (a PDF nominally titled "WAP WML WAP-191-WML 19 February 2000") turned out,
  when fetched and run through `pdftotext`, to actually be the unrelated WAP-224-WTP (Wireless
  Transaction Protocol) specification — either a stale/incorrect search index entry or a
  since-changed redirect on the openmobilealliance.org archive. Flagging this as a concrete
  data-quality trap for anyone continuing this research: verify PDF contents after fetching, don't
  trust the search result title.
- Several sources found describe **later-era** browser versions (Nokia Mobile Browser 4.0, Sony
  Ericsson T610/T68i, Openwave 6.2.2/7.1.x, 2006 OSnews retrospective) that postdate the
  1999–2001 WML 1.1/1.2 heyday this project's compliance program (WAP 1.2.1/WML 1.3) most directly
  targets. They're included because they're the best evidence found, but readers should note the
  chronology mismatch — a 2006-era Openwave 7.1.x quirk is not evidence about what a WML 1.3-era
  UP.Browser did circa 2000–2001.
- This is, as the task framing anticipated, genuinely thin, scattered, 25-year-old niche material.
  Much of the *real* period detail likely exists only in things this session's tools cannot reach:
  physical magazine archives (Wireless Week, RCR Wireless), archived mailing lists not indexed by
  web search, or people's personal memory/blogs that have since gone offline without Wayback
  captures being findable via search.

## Open questions

1. **Wayback Machine access.** If a future session has working `web.archive.org` access, the
   highest-value next step is pulling archived snapshots of `developer.openwave.com`,
   `developer.phone.com`, and Nokia's WAP developer documentation (Nokia Forum / Nokia WAP
   Toolkit doc archives) directly, rather than relying on tutorial-site secondhand accounts.
2. **thewirelessfaq.com "Openwave WML Extensions" page** — retry with a different fetch method or
   a cached/mirrored copy; it's the single most directly on-topic page found and was the only one
   blocked purely by a 403 rather than by lacking content.
3. **Kaasinen et al. WWW9 2000 paper** — locate and actually read the full text (VTT research
   portal, ResearchGate, or Academia.edu mirrors were surfaced but not fetched) to verify the
   UP-simulator-BMP-only / DSR-reader-GIF-only claim before citing it anywhere more permanent than
   this memo.
4. **WAP Forum informative-document archive at openmobilealliance.org** — the GCAG was excellent;
   worth checking whether siblings exist (e.g., interoperability test reports, other
   WAP-2xx-series informative documents) with more explicit vendor attribution than GCAG chose to
   include.
5. **Usenet (Google Groups) direct search** — comp.protocols.wireless.wap and similar groups were
   never actually searched (only web-search queries *about* them were run); this is a distinct,
   unexplored avenue likely to contain first-hand 1999–2001 developer complaints with real
   specificity, exactly the kind of primary evidence this task is looking for.
6. **Physical/scanned trade press** — WirelessDevNet and AllNetDevices were named as sources of
   period comparison articles; only one WirelessDevNet article was actually retrieved and read.
   Both sites likely have more relevant archived comparison content not surfaced by the search
   queries run in this session.
7. **Should "confidence tier" be a first-class field in the eventual data file, or should
   low-confidence entries simply be excluded until upgraded?** This memo assumes the former
   (include with tier), but that's a design choice worth the project explicitly deciding rather
   than inheriting by default.
