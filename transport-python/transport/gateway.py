from __future__ import annotations

import os
import urllib.parse
from collections.abc import Mapping
from dataclasses import dataclass

from transport.wsp_codec import build_wsp_envelope

DEFAULT_GATEWAY_HTTP_BASE = "http://127.0.0.1:13002"


@dataclass(frozen=True)
class GatewayRequest:
    request_url: str
    original_url: str
    target_http_url: str
    headers: dict[str, str]


def _normalize_gateway_http_base(raw_base: str) -> str:
    parsed = urllib.parse.urlparse(raw_base)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError("GATEWAY_HTTP_BASE must be an absolute http(s) URL")
    path = parsed.path.rstrip("/")
    return urllib.parse.urlunparse((parsed.scheme, parsed.netloc, path, "", "", ""))


def _wap_to_target_http_url(wap_url: str) -> str:
    parsed = urllib.parse.urlparse(wap_url)
    if parsed.scheme not in {"wap", "waps"}:
        raise ValueError(f"unsupported scheme for gateway bridge: {parsed.scheme}")
    target_scheme = "http" if parsed.scheme == "wap" else "https"
    path = parsed.path or "/"
    return urllib.parse.urlunparse(
        (target_scheme, parsed.netloc, path, parsed.params, parsed.query, "")
    )


def build_gateway_request(
    *,
    original_url: str,
    method: str,
    headers: Mapping[str, str] | None,
) -> GatewayRequest:
    target_http_url = _wap_to_target_http_url(original_url)
    base = _normalize_gateway_http_base(
        os.getenv("GATEWAY_HTTP_BASE", DEFAULT_GATEWAY_HTTP_BASE)
    )
    target = urllib.parse.urlparse(target_http_url)
    request_url = f"{base}{target.path or '/'}"
    if target.query:
        request_url = f"{request_url}?{target.query}"

    merged_headers = dict(headers or {})
    merged_headers.setdefault("Host", target.netloc)
    merged_headers.setdefault("X-Wap-Target-Url", original_url)

    build_wsp_envelope(target_url=target_http_url, method=method, headers=merged_headers)
    return GatewayRequest(
        request_url=request_url,
        original_url=original_url,
        target_http_url=target_http_url,
        headers=merged_headers,
    )
