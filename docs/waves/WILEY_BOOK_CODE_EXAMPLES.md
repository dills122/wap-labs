# Wiley Book PDF: Extracted Code Examples

Source PDF:
- `spec-processing/source-material/vdoc.pub_the-wireless-application-protocol-wap-a-wiley-tech-brief.pdf`

Extraction artifact used:
- `tmp/pdfs/wiley-tech-brief.layout.txt` (generated via `pdftotext -layout`)

Notes:
- These examples were re-checked against the actual PDF pages.
- Page numbers below are PDF page indices (1-based).
- This book includes many usable WML and WBXML examples, but very little executable WMLScript code.

## High-value examples

### 1) Minimal WML deck/card structure (PDF page 57)

```xml
<wml>
  <card id="first" title="Empyrean Design Works">
    <p>Empyrean Design Works is a full service software design and
    strategy firm for mobile, wireless, and handheld technologies.</p>
  </card>
</wml>
```

Use for:
- parser baseline fixture (`wml` root + single card + paragraph)
- render baseline snapshot fixture

### 2) `do` + `go` task wiring (PDF page 68)

```xml
<card id="LoadURL" title="URL Demo">
  <do type="accept" label="Load URL">
    <go href="sample.wml"/>
  </do>
  <p>Press 'Load URL' to retrieve the next deck.</p>
</card>
```

Use for:
- accept softkey/task dispatch
- internal deck navigation intent handling

### 3) Template shadowing across cards (PDF page 147)

```xml
<wml>
  <template>
    <do type="options" name="do1" label="default">
      <prev/>
    </do>
  </template>
  <card id="first">...</card>
  <card id="second">...</card>
  <card id="third">...</card>
</wml>
```

Use for:
- card/deck task shadowing precedence tests
- `do` inheritance and override behavior

### 4) Intrinsic event shorthand vs expanded form (PDF page 153)

```xml
<card onenterforward="/url"><p>Hello</p></card>
```

```xml
<card>
  <onevent type="onenterforward">
    <go href="/url"/>
  </onevent>
  <p>Hello</p>
</card>
```

Use for:
- parser/runtime equivalence tests between attribute shorthand and `onevent`
- event-trigger navigation conformance

### 5) `setvar` navigation side-effect (PDF page 157)

```xml
<setvar name="location" value="$(X)"/>
```

Use for:
- variable substitution and context mutation checks during task execution

### 6) Required prologue and DTD (PDF page 159)

```xml
<?xml version="1.0"?>
<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.2//EN"
  "http://www.wapforum.org/DTD/wml_1.2.xml">
```

Use for:
- prologue/DTD validation policy tests
- strict-vs-lenient parsing mode documentation

### 7) Timer-driven navigation (PDF pages 176-177)

```xml
<wml>
  <card ontimer="/next">
    <timer value="100"/>
    <p>Hello World!</p>
  </card>
</wml>
```

Use for:
- timer lifecycle tests (`ontimer`, expiration-driven `go`)
- deterministic timing event dispatch fixtures

### 8) Table rendering edge case (PDF page 183)

```xml
<table columns="2" align="LL">
  <tr><td>One</td><td>Two</td></tr>
  <tr><td>1</td></tr>
  <tr><td/><td>B</td><td>C<br/>D</td></tr>
</table>
```

Use for:
- table normalization/render fallback tests
- mismatched cell-count behavior

### 9) WBXML tokenized source-deck example (PDF page 200)

```xml
<wml>
  <card id="abc" ordered="true">
    <p>
      <do type="accept"><go href="http://xyz.org/s"/></do>
      X: $(X)<br/>
      Y: $(&#x59;)<br/>
      Enter name: <input type="text" name="N"/>
    </p>
  </card>
</wml>
```

Use for:
- WBXML encode/decode roundtrip fixtures
- variable-token and string-table interaction tests

### 10) WBXML token stream annotation table (PDF pages 200-201)

```text
02 -> WBXML Version 1.2
08 -> WML 1.2 Public ID
6A -> Charset=UTF-8
7F -> wml
E7 -> card
33 -> ordered="true"
```

Use for:
- deterministic token-map fixtures in transport codec tests
- assigned-token regression assertions

## Gaps in book examples

- The book has descriptive WMLScript sections but does not provide substantial WMLScript function-level code samples suitable for direct VM fixtures.
- Best direct fixture source for executable semantics remains canonical specs already in traceability docs (`WAP-191*`, `WAP-193*`, `WAP-194*`, `WAP-230`, `WAP-224`, `WAP-259`).
