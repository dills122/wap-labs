# Waves User Onboarding Experience Plan

Status: planning-ready
Owner lane: `browser` + `docs`

## Purpose

Define a first-run and returning-user help experience for Waves that explains what the product is, how to use it, and how to learn progressively without sending users out to external documentation first.

Waves is niche. The onboarding problem is not only control discoverability; it is mental-model adoption:

1. what Waves is
2. what `Local` vs `Network` mode means
3. how WAP/WML navigation differs from modern browser assumptions
4. how to explore examples, forms, and debugging surfaces without getting lost

## Goals

1. Give a new user a clear answer to "what is this?" within the first screen.
2. Reduce abandonment caused by immediate network errors or unfamiliar terminology.
3. Teach the core Waves mental model through a mix of overview, guided interaction, and built-in examples.
4. Keep help accessible after first launch, not only during onboarding.
5. Reuse product-native content surfaces where possible so documentation is testable and ships with the app.

## Non-Goals (MVP)

1. Full product documentation site replacement.
2. Remote account or cloud-synced onboarding state.
3. Heavy analytics/telemetry dependency for onboarding success.
4. Interactive walkthroughs that mutate runtime state outside normal browser/engine boundaries.

## User Segments

### 1. Curious newcomer

Characteristics:

1. knows little or nothing about WAP/WML
2. launches Waves out of curiosity
3. needs orientation before exploring

Needs:

1. plain-language intro
2. a safe "try it now" path
3. fast explanation of `Local` vs `Network`

### 2. Technical evaluator

Characteristics:

1. understands historical mobile-web concepts or emulator tooling
2. wants to inspect behavior quickly
3. may care about debug state and protocol/runtime fidelity

Needs:

1. quick path to examples and diagnostics
2. concise architecture/feature overview
3. in-app access to troubleshooting and reference material

### 3. Returning operator

Characteristics:

1. already launched Waves before
2. may not remember exact controls or mode behavior

Needs:

1. replayable help entry point
2. quick links to examples and troubleshooting
3. optional hints, not forced tutorial repetition

## Experience Principles

1. Start with orientation, not configuration.
2. Teach by doing inside Waves where possible.
3. Explain mode and constraint differences explicitly.
4. Keep the first-run path skippable and replayable.
5. Treat help content as product content: versioned, testable, local-first.

## Proposed Experience Model

### 1. Welcome Home

Default first-run landing view shown before users are dropped into ordinary browsing.

Core actions:

1. `Take the tour`
2. `Try local examples`
3. `Connect to a WAP server`
4. `Open help`

Core content:

1. short explanation of Waves
2. short explanation of `Local` and `Network`
3. "what you can do here" examples:
- browse WML decks
- edit and submit forms
- inspect runtime/debug state

### 2. Guided Tour

Replayable, step-based product tour focused on core concepts rather than generic control labels.

Recommended MVP steps:

1. Browser shell overview
2. `Local` vs `Network` mode
3. Loading a local example
4. Navigating cards and forms
5. Opening developer tools and runtime state

Rules:

1. skippable at any step
2. replayable from Help
3. stateful enough to resume within a session, but no account dependency

### 3. Help Hub

Persistent in-app help surface available from the start page and app chrome.

Proposed sections:

1. `Start Here`
2. `Quickstart`
3. `Core Concepts`
4. `Tutorials`
5. `Troubleshooting`
6. `Developer Guide`
7. `Reference`

### 4. Tutorial Decks

Built-in interactive lessons that use local content/examples and teach through the viewport itself.

Initial tutorial set:

1. `Your first deck`
2. `Edit and submit a form`
3. `Understand local vs network mode`
4. `Inspect a runtime snapshot`

Why this matters:

1. users learn inside the same interaction model Waves is built around
2. examples can be versioned, reviewed, and tested like other shipped content

### 5. Contextual Hints

Lightweight, dismissible hints shown only when relevant.

Suggested triggers:

1. first switch into `Network` mode
2. first failed network fetch
3. first local example load
4. first focused form edit
5. first developer-tools open

Rules:

1. hints are optional and suppressible
2. hints should not block primary interaction
3. hints should point back to Help Hub when deeper reading is needed

## Information Architecture

### Start Here

Purpose:

1. orient new users in under one minute

Content:

1. what Waves is
2. what it is not
3. first recommended actions

### Quickstart

Purpose:

1. help users do something real immediately

Content:

1. run local examples
2. connect to a server
3. navigate, edit, submit

### Core Concepts

Purpose:

1. explain the product model

Content:

1. decks and cards
2. focus and softkey-style interaction
3. local vs network mode
4. external intents and captured submits

### Tutorials

Purpose:

1. task-oriented learning

Content:

1. tutorial decks with explicit goals and acceptance steps

### Troubleshooting

Purpose:

1. reduce confusion when things fail

Content:

1. no network available
2. local mode does not fetch
3. why a submit is captured instead of followed
4. where to look in dev tools

### Developer Guide

Purpose:

1. help technical users inspect and understand runtime behavior

Content:

1. session state
2. transport response
3. runtime snapshot
4. event timeline

### Reference

Purpose:

1. quick recall

Content:

1. keyboard shortcuts
2. mode behaviors
3. current limitations

## UX and Technical Approach

### Content Source Strategy

Use product-owned local content instead of external-only documentation for the first experience.

Recommended source types:

1. browser-native intro/help page content for the shell-level overview
2. local tutorial decks/examples for viewport-driven learning
3. versioned markdown or typed content modules for help sections

### State Model

Suggested local onboarding state:

1. `hasSeenWelcome`
2. `hasCompletedTour`
3. `dismissedHints`
4. `completedTutorialIds`

Storage posture:

1. local only
2. resettable from Help/Settings/dev path

### UI Surface Options

Preferred MVP split:

1. intro/help hub as browser-shell UI pages
2. tutorial lessons as local product content/examples
3. guided tour as browser-shell overlay/coaching layer

This avoids forcing all onboarding into either:

1. a pure webview page disconnected from the product, or
2. a pure tooltip system with no conceptual overview

## Rollout Phases

### Phase U0-01 Welcome Home

1. add first-run intro/start page
2. expose entry points for examples, network connect, tour, and help

### Phase U0-02 Guided Tour

1. add replayable step-based tour
2. cover core shell and mode concepts

### Phase U0-03 Help Hub

1. add durable in-app help center
2. ship overview, quickstart, troubleshooting, and reference sections

### Phase U0-04 Tutorial Decks

1. add local tutorial examples/lessons
2. tie them into help and onboarding flows

### Phase U0-05 Contextual Hints and Onboarding State

1. add just-in-time hints
2. persist dismissal/completion state locally

## Acceptance Criteria (Program)

1. a first-time user can understand what Waves is and choose a path within the first screen
2. a user can learn the product entirely inside the app without external docs
3. onboarding is replayable and does not trap returning users
4. help/tutorial content is versioned and maintainable inside the repo
5. onboarding/help features do not bypass engine/host boundaries or introduce browser-owned runtime state

## Open Questions

1. Should the intro page replace the current default start URL only on first run, or become the permanent home screen?
2. Should tutorial content be modeled as local examples metadata, dedicated help content, or both?
3. Where should "Help" live in the shell chrome for persistent discoverability?
4. How much onboarding state should be remembered across app restarts by default?
5. Do we want a future docs-export path from the in-app help content to external site docs?
