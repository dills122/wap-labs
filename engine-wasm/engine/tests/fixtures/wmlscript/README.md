# WAP-193 compilation-unit fixtures

These byte-exact `.wmlsc.hex` fixtures are pinned from the effective
`WAP-193_101-WMLScript` binary layout:

- `wap-193-minimal-return-es.wmlsc.hex` encodes one external `main` function whose code array is
  the chapter 10 `RETURN_ES` instruction (`0x3b`).
- `wap-193-named-functions.wmlsc.hex` adds an external `todo` function. Its leading `0x14`
  instruction and implicit empty-string return pin the transition from the WMLS-501 routing
  subset into WMLS-502 execution.
- `wap-193-operator-conversions.wmlsc.hex` executes a local two-argument function with an
  empty-initialized local, integer subtraction and equality, a verified conditional branch,
  integer-to-string addition/concatenation, and an explicit return. It returns `"1242"` from the
  external `main` function and pins argument order plus native/WASM result parity.
- `wap-193-invalid-function-ref.wmlsc.hex` changes that instruction to short local call `0x62`,
  whose embedded function index `2` is outside the two-entry function pool. It proves that a
  reference failure in an unselected function quarantines the whole compilation unit before
  `main` can execute.
- `wap-193-valid-library-refs.wmlsc.hex` pins valid calls at the WAP-194 Appendix A boundary for
  Lang, Float, String, URL, WMLBrowser, and Dialogs, with arguments matching the source function
  signatures. The paired invalid-library and invalid-library-function fixtures step one index
  outside those domains.
- The stack-dataflow fixtures pin WAP-193 chapter 10 effects and chapter 11 validity across fatal
  underflow, the strict 64-value resource ceiling, inconsistent conditional merges, a balanced
  backward loop, an unreachable `POP`, and implicit/explicit return paths. The 64-value ceiling
  matches the engine's existing bounded interpreter default; WAP-193 section 12.3.3.1 permits an
  implementation resource boundary and classifies exhaustion as fatal stack overflow.

The fields follow WAP-193_101 sections 9.2-9.6 (version `1.1`, code size, UTF-8 MIBEnum `106`,
empty constant/pragma pools, external function-name table, function prologues, and code arrays).
Library and URL calls remain verification-only pending WMLS-504 and WMLS-503. The WMLS-502
fixture establishes bounded local-call, operator, conversion, local-variable, branch, and return
execution without widening those later slices.
