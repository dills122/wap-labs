# WAP-193 compilation-unit fixtures

These byte-exact `.wmlsc.hex` fixtures are pinned from the effective
`WAP-193_101-WMLScript` binary layout:

- `wap-193-minimal-return-es.wmlsc.hex` encodes one external `main` function whose code array is
  the chapter 10 `RETURN_ES` instruction (`0x3b`).
- `wap-193-named-functions.wmlsc.hex` adds an external `todo` function. Its leading `0x14`
  instruction is structurally valid WAP-193 bytecode but intentionally outside this routing
  slice's executable subset.
- `wap-193-invalid-function-ref.wmlsc.hex` changes that instruction to short local call `0x62`,
  whose embedded function index `2` is outside the two-entry function pool. It proves that a
  reference failure in an unselected function quarantines the whole compilation unit before
  `main` can execute.

The fields follow WAP-193_101 sections 9.2-9.6 (version `1.1`, code size, UTF-8 MIBEnum `106`,
empty constant/pragma pools, external function-name table, function prologues, and code arrays).
The execution assertions are deliberately limited to `RETURN_ES`; the fixtures do not claim
operator, conversion, standard-library, or stack-dataflow coverage.
