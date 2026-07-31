# Waves Engine Inspector

The D0-04 Engine Inspector is an optional, first-party, read-only consumer of the generated D0-03
host commands. It is part of the existing docked and detached Developer Tools workspace. It does
not add engine controls, a remote listener, replay, raw-source access, or a second debug session.

## Host policy and lifecycle

The Inspector reflects the host's default-disabled policy rather than presenting a frontend
preference as enablement:

1. Launch the native host with `WAVES_ENGINE_DEBUG_POLICY=enabled`.
2. Open Developer Tools, select **Inspector**, and choose **Start Inspector**.
3. The frontend requests one protocol-v1 session, takes an initial bounded snapshot, and polls from
   the opaque cursor returned by the host.
4. Polling runs only while at least one docked or detached Inspector surface is visible. Hiding the
   panel pauses the consumer timer without changing engine ordering.
5. **Stop** cancels frontend polling and closes the local host session. Session errors also stop
   polling and make an idempotent close attempt. Application disposal/unmount performs the same
   cleanup.
6. Starting again opens a new host identity and clears the prior in-memory capture.

`DEBUG_DISABLED`, `SESSION_LIMIT_REACHED`, cursor/session failures, and sanitized source failures
remain typed, non-fatal Inspector states. Their host messages and thrown implementation details are
not rendered or exported. Ordinary deck loading, navigation, focus, input, timers, scripts, and
rendering do not depend on the Inspector lifecycle.

## Consumer capacities

The engine and host keep their generated contract limits. D0-04 adds smaller frontend presentation
and artifact limits:

| Surface                                  |                  Limit |
| ---------------------------------------- | ---------------------: |
| Events requested per poll                |                  `100` |
| Events retained in frontend memory       |     `512`, drop oldest |
| Event rows rendered after filtering      |  `200`, newest matches |
| Filter query                             |        `80` characters |
| Postfield resolutions retained per event |                   `64` |
| Snapshot variables retained              |                  `128` |
| Snapshot timers retained                 |                   `32` |
| Snapshot variables/timers rendered       |            `32` / `16` |
| Events considered for export             | `256`, newest retained |
| Text units per exported field            |                  `512` |
| Serialized JSON artifact                 |         `262144` bytes |

Producer `droppedCount` values and frontend drop-oldest counts are tracked separately. The event
sequence string is the only ordering key; polling cadence and monotonic time never reorder events.
When an export would exceed the byte ceiling, the oldest candidate events are removed until the
complete UTF-8 JSON document fits.

## Versioned capture schema

The file name is `waves-engine-debug-capture-v1.json`. Its explicit top-level allowlist is:

- `schemaVersion`: `1`
- `kind`: `waves-engine-debug-capture`
- `protocolVersion`
- `limits`
- generated capability booleans and numeric bounds
- `accounting`: producer gaps, frontend drops, retained/exported counts, retained sequence bounds,
  and export truncation
- optional bounded `snapshot`
- bounded `events`

Session identifiers, wall-clock timestamps, filters, host status, credentials, request bodies, raw
WML/source, transport secrets, arbitrary error internals, and masked original values are not part
of the schema. Events, payload variants, values, capabilities, snapshots, and collection summaries
are reconstructed field by field before they enter frontend retention. `masked` and `omitted`
values serialize only their state and reason.

The exporter trusts the engine-owned D0-02 classification of `visible`, `masked`, and `omitted`
values. It does not offer unmasking and does not attempt to recover or post-process original secret
material.

## Filters and accessibility

Filtering is presentation-only. Operators can select a fixed event family and search the bounded
retained projection by sequence, kind, card identifier, or projected summary. Filters never change
the cursor, recorder, snapshot, or runtime.

The Inspector uses the Developer Tools roving tab pattern, native buttons/select/search controls,
labelled regions, a polite status output in the detached window, visible focus styling, and
keyboard-operable disclosures. The docked application keeps its single global live-announcement
channel.
