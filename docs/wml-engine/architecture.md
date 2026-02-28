# WASM Engine Architecture (Maintainable, MVP-First)

## 1. Design Constraints

- Keep module boundaries explicit.
- Avoid over-modeling unsupported spec areas in MVP.
- Keep public API stable while internal parser/runtime evolve.

## 2. Runtime Components

1. `parser/`
- Converts WML XML to AST/runtime nodes.
- Stores unknown/unsupported nodes for debug only.

2. `runtime/`
- Holds deck/card graph, active card, history, variable store (later), and task bindings.

3. `nav/`
- Focus traversal, link activation, URL resolution, and navigation intents.

4. `layout/`
- Converts active card nodes to flow lines and draw commands.

5. `render/`
- Defines serializable output model consumed by host canvas renderer.

6. `api (lib.rs wasm-bindgen)`
- Stable methods (`loadDeck`, `loadDeckContext`, `render`, `handleKey`, `navigateToCard`, metadata getters).

## 3. Data Model (Incremental)

MVP core:

- `Deck { cards: Vec<Card> }`
- `Card { id, nodes }`
- `Node::Paragraph(Vec<InlineNode>) | Node::Break`
- `InlineNode::Text | InlineNode::Link { text, href }`

Phase 2 additions:

- `CardMeta { title, access_domain, access_path, ordered, newcontext }`
- `TaskBinding { kind, label, target, method, postfields }`
- `VariableStore`

Phase 3 additions:

- `EventBinding`
- timer runtime state
- form controls model

## 4. API Boundary

Input boundary:

- `loadDeckContext(wmlXml, baseUrl, contentType, rawBytesBase64?)`

Output boundary:

- `render() -> RenderList`
- future: `drainEvents() -> EngineEvent[]` for nav/error/task events

Compatibility policy:

- Existing methods remain available.
- New methods/fields are additive.

## 5. Navigation Pipeline

1. key input -> focus/action intent
2. resolve active interactable
3. if `#fragment`: transition card
4. else: emit host navigation request (future explicit event queue)
5. refresh render state

## 6. Performance and Safety

- No heap-heavy DOM mirrors; keep compact node model.
- Cache parsed deck and precomputed interactables per card.
- Deterministic rendering for snapshot tests.
- Never panic across wasm boundary; convert to structured error.

## 7. Future-Proofing Without Overengineering

Do now:

- keep clear module seams
- preserve source metadata (`baseUrl`, `contentType`)
- define stable event/error enums

Defer now:

- full DTD validation
- full WMLScript execution
- full event/timer matrix
- pixel-perfect vendor quirks
