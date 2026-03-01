from __future__ import annotations

import subprocess
from pathlib import Path
from unittest.mock import patch

import pytest

from transport.wbxml_decoder import WbxmlDecodeError, decode_wmlc


def test_decode_wmlc_success() -> None:
    def fake_run(args: list[str], **_kwargs: object) -> subprocess.CompletedProcess[str]:
        output_path = Path(args[2])
        output_path.write_text(
            "<wml><card id='home'><p>Decoded</p></card></wml>\n",
            encoding="utf-8",
        )
        return subprocess.CompletedProcess(args=args, returncode=0, stdout="", stderr="")

    with patch("transport.wbxml_decoder.subprocess.run", side_effect=fake_run):
        decoded = decode_wmlc(b"\x03\x01\x6a\x00")
    assert decoded.startswith("<wml>")


def test_decode_wmlc_missing_tool() -> None:
    with patch("transport.wbxml_decoder.subprocess.run", side_effect=FileNotFoundError()):
        with pytest.raises(WbxmlDecodeError) as err:
            decode_wmlc(b"\x03\x01\x6a\x00")
    assert "not available" in str(err.value)


def test_decode_wmlc_nonzero_exit() -> None:
    completed = subprocess.CompletedProcess(
        args=["wbxml2xml", "-o", "/tmp/fake.xml", "/tmp/fake.wmlc"],
        returncode=1,
        stdout="",
        stderr="unsupported public id\n",
    )
    with patch("transport.wbxml_decoder.subprocess.run", return_value=completed):
        with pytest.raises(WbxmlDecodeError) as err:
            decode_wmlc(b"\x03\x01\x6a\x00")
    assert "unsupported public id" in str(err.value)
