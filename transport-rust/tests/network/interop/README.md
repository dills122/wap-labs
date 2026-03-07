# Transport Interop Replay Lane

This directory is the canonical fixture lane for protocol-profile promotion checks (`T0-22`) and the curated seed-corpus lane for `T0-24`.

Current seed corpus:

- `connect_session_seed.json`: deterministic WSP session-setup replay for minimal `Connect` / `ConnectReply` over connection-oriented service ports.
- `get_reply_seed.json`: deterministic WDP + WSP replay corpus for minimal `GET` / `REPLY` paths over known service ports.
- `retransmission_seed.json`: deterministic WTP retransmission replay path for timer-expiry and ACK completion sequencing.
- `duplicate_tid_seed.json`: deterministic duplicate-TID replay coverage for terminal replay and nonterminal duplicate drop behavior.

Schema contract:

1. Each fixture file carries corpus-level metadata:
   - `schemaVersion`
   - `corpus.id`
   - `corpus.sourceClass`
   - `corpus.provenance`
   - `corpus.legalReuse`
   - `corpus.derivedFrom`
2. Each case carries capture-level metadata:
   - `capture.captureId`
   - `capture.sourceFamily`
   - `capture.captureKind`
   - `capture.provenanceNote`
   - `capture.legalReuse`
3. Each case must define:
   - deterministic `expectedEvents`
   - deterministic `expectedTransactionOutcomes`

Legal/reuse posture:

1. Current seed files are `synthetic-derivative` artifacts derived from local baseline fixtures and protocol code paths.
2. Future PCAP-derivative cases must record provenance and reuse constraints before they are admitted to this lane.
3. External captures may inform replay realism, but they do not redefine local `RQ-*` requirements.

Planned expansion:

- richer `Connect` capability/error negotiation cases
- PCAP-derivative capture seeds once vetted local snapshots are available through `T0-23` intake rules
