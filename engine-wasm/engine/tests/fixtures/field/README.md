# Field Examples Fixture Set

Source:

- `/Users/dsteele/Downloads/Additional WML Examples_DEMO_Version.pdf` (2011 Openwave-era examples)

Purpose:

- Preserve real-world WML examples as stable fixtures for parser/runtime regression tests.

Current files:

1. `openwave-2011-example-01-navigation.wml`
- MVP-relevant: cards, paragraphs, links, fragment navigation, unknown inline formatting tags.

2. `openwave-2011-example-02-softkeys-template.wml`
- Future-phase: `template`, `do`, `go`, `prev` task model.

3. `openwave-2011-example-05-forms-variables.wml`
- Future-phase: forms/inputs/select + variable substitution (`$(var)`).

Notes:

- These are normalized from the PDF for consistent testing.
- Keep one fixture per semantic cluster; avoid over-editing original intent.
