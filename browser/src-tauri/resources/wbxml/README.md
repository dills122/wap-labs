Place platform-specific `wbxml2xml` binaries here for app bundling.

Expected paths:
- `resources/wbxml/macos/wbxml2xml`
- `resources/wbxml/linux/wbxml2xml`
- `resources/wbxml/windows/wbxml2xml.exe`

At startup, the host resolves the current platform path and sets `WBXML2XML_BIN`
to that bundled binary when present. If missing, it falls back to `WBXML2XML_BIN`
from environment or `wbxml2xml` on absolute PATH entries and performs a startup
preflight check. Runtime decoding occurs in the subprocess with bounded execution
time and decoded output; WBXML is never parsed by native code in the host process.
