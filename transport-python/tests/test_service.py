from __future__ import annotations

import io
import urllib.error
from collections.abc import Mapping
from typing import Any
from unittest.mock import patch

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
