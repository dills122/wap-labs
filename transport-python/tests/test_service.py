from __future__ import annotations

import io
import os
import shutil
import subprocess
import tempfile
import urllib.error
import urllib.request
from collections.abc import Mapping
from pathlib import Path
from typing import Any
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

import service


class FakeResponse:
    def __init__(
        self,
        *,
        body: bytes,
        status: int = 200,
        url: str = "http://local.test/index.wml",
        headers: Mapping[str, str] | None = None,
    ) -> None:
        self._body = body
        self.status = status
        self._url = url
        self.headers = dict(headers or {"Content-Type": "text/vnd.wap.wml"})

    def __enter__(self) -> FakeResponse:
        return self

    def __exit__(self, *_args: Any) -> None:
        return None

    def read(self) -> bytes:
        return self._body

    def geturl(self) -> str:
        return self._url


def _encode_wml_to_wmlc(xml_text: str) -> bytes:
    if not shutil.which("xml2wbxml"):
        pytest.skip("xml2wbxml not installed; install libwbxml for real WBXML integration test")
    with tempfile.TemporaryDirectory() as temp_dir:
        src = Path(temp_dir) / "deck.wml"
        out = Path(temp_dir) / "deck.wmlc"
        src.write_text(xml_text, encoding="utf-8")
        proc = subprocess.run(
            ["xml2wbxml", "-o", str(out), str(src)],
            capture_output=True,
            text=True,
            check=False,
        )
        if proc.returncode != 0:
            pytest.skip(f"xml2wbxml encode failed: {(proc.stderr or '').strip()}")
        return out.read_bytes()


def test_health_endpoint() -> None:
    client = TestClient(service.app)
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["service"] == "lowband-transport-python"


def test_fetch_invalid_method_maps_invalid_request() -> None:
    client = TestClient(service.app)
    response = client.post(
        "/fetch",
        json={"url": "http://local.test/index.wml", "method": "POST"},
    )
    body = response.json()
    assert response.status_code == 200
    assert body["ok"] is False
    assert body["error"]["code"] == "INVALID_REQUEST"


def test_fetch_success_sets_engine_deck_input() -> None:
    client = TestClient(service.app)
    fake = FakeResponse(
        body=b"<wml><card id='home'><p>Hello</p></card></wml>",
        status=200,
        url="http://local.test/home.wml",
        headers={"Content-Type": "text/vnd.wap.wml; charset=utf-8"},
    )
    with patch("service.urllib.request.urlopen", return_value=fake):
        response = client.post("/fetch", json={"url": "http://local.test/home.wml"})
    body = response.json()
    assert response.status_code == 200
    assert body["ok"] is True
    assert body["engineDeckInput"]["baseUrl"] == "http://local.test/home.wml"
    assert "<wml>" in body["engineDeckInput"]["wmlXml"]
    assert body["timingMs"]["udpRtt"] >= 0


def test_fetch_unsupported_content_type() -> None:
    client = TestClient(service.app)
    fake = FakeResponse(
        body=b"binary",
        status=200,
        url="http://local.test/data.bin",
        headers={"Content-Type": "application/octet-stream"},
    )
    with patch("service.urllib.request.urlopen", return_value=fake):
        response = client.post("/fetch", json={"url": "http://local.test/data.bin"})
    body = response.json()
    assert response.status_code == 200
    assert body["ok"] is False
    assert body["error"]["code"] == "UNSUPPORTED_CONTENT_TYPE"


def test_fetch_timeout_or_unavailable_maps_transport_error() -> None:
    client = TestClient(service.app)
    with patch(
        "service.urllib.request.urlopen",
        side_effect=urllib.error.URLError("Connection refused"),
    ):
        response = client.post(
            "/fetch",
            json={"url": "http://127.0.0.1:3000/", "retries": 1},
        )
    body = response.json()
    assert response.status_code == 200
    assert body["ok"] is False
    assert body["error"]["code"] == "TRANSPORT_UNAVAILABLE"
    assert body["error"]["details"]["attempts"] == 2


def test_fetch_http_error_maps_protocol_error() -> None:
    client = TestClient(service.app)
    err = urllib.error.HTTPError(
        url="http://local.test/fail.wml",
        code=500,
        msg="Internal Server Error",
        hdrs=None,
        fp=io.BytesIO(b"boom"),
    )
    with patch("service.urllib.request.urlopen", side_effect=err):
        response = client.post("/fetch", json={"url": "http://local.test/fail.wml"})
    body = response.json()
    assert response.status_code == 200
    assert body["ok"] is False
    assert body["error"]["code"] == "PROTOCOL_ERROR"


def test_fetch_wap_routes_through_gateway_bridge() -> None:
    client = TestClient(service.app)
    fake = FakeResponse(
        body=b"<wml><card id='home'><p>Hi</p></card></wml>",
        status=200,
        url="http://127.0.0.1:13002/home.wml",
        headers={"Content-Type": "text/vnd.wap.wml"},
    )
    captured: dict[str, Any] = {}

    def fake_urlopen(request: urllib.request.Request, timeout: float) -> FakeResponse:
        captured["url"] = request.full_url
        captured["timeout"] = timeout
        captured["headers"] = {k.lower(): v for k, v in request.header_items()}
        return fake

    with patch.dict(
        os.environ, {"GATEWAY_HTTP_BASE": "http://127.0.0.1:13002"}, clear=False
    ), patch("service.urllib.request.urlopen", side_effect=fake_urlopen):
        response = client.post(
            "/fetch",
            json={"url": "wap://example.test/home.wml?x=1", "method": "GET"},
        )

    body = response.json()
    assert response.status_code == 200
    assert body["ok"] is True
    assert captured["url"] == "http://127.0.0.1:13002/home.wml?x=1"
    assert captured["headers"]["host"] == "example.test"
    assert captured["headers"]["x-wap-target-url"] == "wap://example.test/home.wml?x=1"
    assert body["finalUrl"] == "wap://example.test/home.wml?x=1"


def test_fetch_wap_invalid_gateway_base_maps_transport_unavailable() -> None:
    client = TestClient(service.app)
    with patch.dict(os.environ, {"GATEWAY_HTTP_BASE": "not-a-url"}, clear=False):
        response = client.post("/fetch", json={"url": "wap://example.test/"})
    body = response.json()
    assert response.status_code == 200
    assert body["ok"] is False
    assert body["error"]["code"] == "TRANSPORT_UNAVAILABLE"


def test_fetch_wbxml_success_decodes_to_wml() -> None:
    client = TestClient(service.app)
    fake = FakeResponse(
        body=b"\x03\x01\x6a\x00\x45\x03X\x00\x01",
        status=200,
        url="http://local.test/home.wmlc",
        headers={"Content-Type": "application/vnd.wap.wmlc"},
    )
    with patch("service.urllib.request.urlopen", return_value=fake), patch(
        "service.decode_wmlc",
        return_value="<wml><card id='home'><p>Decoded</p></card></wml>",
    ):
        response = client.post("/fetch", json={"url": "http://local.test/home.wmlc"})
    body = response.json()
    assert response.status_code == 200
    assert body["ok"] is True
    assert body["contentType"] == "application/vnd.wap.wmlc"
    assert "<wml>" in (body["wml"] or "")
    assert body["engineDeckInput"]["wmlXml"].startswith("<wml>")


def test_fetch_wbxml_decode_failure_maps_error() -> None:
    client = TestClient(service.app)
    fake = FakeResponse(
        body=b"\x03\x01\x6a\x00",
        status=200,
        url="http://local.test/home.wmlc",
        headers={"Content-Type": "application/vnd.wap.wmlc"},
    )
    with patch("service.urllib.request.urlopen", return_value=fake), patch(
        "service.decode_wmlc",
        side_effect=service.WbxmlDecodeError("decoder failed"),
    ):
        response = client.post("/fetch", json={"url": "http://local.test/home.wmlc"})
    body = response.json()
    assert response.status_code == 200
    assert body["ok"] is False
    assert body["error"]["code"] == "WBXML_DECODE_FAILED"


def test_fetch_wbxml_real_decoder_round_trip() -> None:
    if not shutil.which("wbxml2xml"):
        pytest.skip("wbxml2xml not installed; install libwbxml for real WBXML integration test")
    client = TestClient(service.app)
    wml = (
        '<?xml version="1.0"?>\n'
        '<!DOCTYPE wml PUBLIC "-//WAPFORUM//DTD WML 1.1//EN" '
        '"http://www.wapforum.org/DTD/wml_1.1.xml">\n'
        "<wml><card id='home'><p>Real Decoder</p></card></wml>\n"
    )
    wmlc = _encode_wml_to_wmlc(wml)
    fake = FakeResponse(
        body=wmlc,
        status=200,
        url="http://local.test/home.wmlc",
        headers={"Content-Type": "application/vnd.wap.wmlc"},
    )
    with patch("service.urllib.request.urlopen", return_value=fake):
        response = client.post("/fetch", json={"url": "http://local.test/home.wmlc"})
    body = response.json()
    assert response.status_code == 200
    assert body["ok"] is True
    assert "Real Decoder" in (body["wml"] or "")
