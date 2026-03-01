from __future__ import annotations

import os
import subprocess
import tempfile
from pathlib import Path


class WbxmlDecodeError(Exception):
    """Raised when WBXML decode fails or is unavailable."""


def _wbxml2xml_binary() -> str:
    return os.getenv("WBXML2XML_BIN", "wbxml2xml")


def decode_wmlc(payload: bytes) -> str:
    if not payload:
        raise WbxmlDecodeError("WBXML decode failed: empty payload")

    tool = _wbxml2xml_binary()
    input_path: Path | None = None
    output_path: Path | None = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".wmlc", delete=False) as handle:
            handle.write(payload)
            input_path = Path(handle.name)
        with tempfile.NamedTemporaryFile(suffix=".xml", delete=False) as handle:
            output_path = Path(handle.name)

        try:
            proc = subprocess.run(
                [tool, "-o", str(output_path), str(input_path)],
                capture_output=True,
                text=True,
                check=False,
            )
        except FileNotFoundError as err:
            raise WbxmlDecodeError(
                f"WBXML decoder tool not available: {tool}. Install libwbxml/wbxml2xml."
            ) from err

        if proc.returncode != 0:
            stderr = (proc.stderr or "").strip().splitlines()
            details = stderr[0] if stderr else f"exit code {proc.returncode}"
            raise WbxmlDecodeError(f"WBXML decode failed: {details}")

        xml = output_path.read_text(encoding="utf-8").strip()
        if not xml:
            raise WbxmlDecodeError("WBXML decode failed: decoder returned empty output")
        return xml
    finally:
        if input_path:
            input_path.unlink(missing_ok=True)
        if output_path:
            output_path.unlink(missing_ok=True)
