# Transport Interop Replay Lane

This directory is the canonical fixture lane for protocol-profile promotion checks (`T0-22`).

Current baseline:

- `get_reply_replay.json`: deterministic WDP + WSP replay corpus for minimal `GET` / `REPLY` paths over known service ports.
- same corpus also carries the first WTP retransmission replay path for timer-expiry and ACK completion sequencing.

Planned expansion:

- `connect_session_replay`
- `duplicate_tid_flow`
