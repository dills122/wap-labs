from __future__ import annotations

import base64
import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

from fastapi import FastAPI
from pydantic import BaseModel, Field

DEFAULT_TIMEOUT_MS = 5000
DEFAULT_RETRIES = 1
SUPPORTED_METHODS = {"GET"}
SUPPORTED_WML_TYPES = {
    "text/vnd.wap.wml",
    "application/vnd.wap.wml+xml",
    "text/xml",
    "application/xml",
    "text/plain",
}


class FetchRequest(BaseModel):
    url: str = Field(description="Absolute URL to fetch through the gateway.")
    method: str = Field(default="GET")
    headers: dict[str, str] | None = None
    timeout_ms: int = Field(default=DEFAULT_TIMEOUT_MS, alias="timeoutMs", ge=100, le=30000)
    retries: int = Field(default=DEFAULT_RETRIES, ge=0, le=2)

    class Config:
        populate_by_name = True


class ErrorInfo(BaseModel):
    code: str
    message: str
    details: dict[str, Any] | None = None


class TimingMs(BaseModel):
    encode: float
    udp_rtt: float = Field(alias="udpRtt")
    decode: float

    class Config:
        populate_by_name = True


class RawPayload(BaseModel):
    bytes_base64: str = Field(alias="bytesBase64")
    content_type: str = Field(alias="contentType")

    class Config:
        populate_by_name = True


class EngineDeckInput(BaseModel):
    wml_xml: str = Field(alias="wmlXml")
    base_url: str = Field(alias="baseUrl")
    content_type: str = Field(alias="contentType")
    raw_bytes_base64: str | None = Field(default=None, alias="rawBytesBase64")

    class Config:
        populate_by_name = True


class FetchResponse(BaseModel):
    ok: bool
    status: int
    final_url: str = Field(alias="finalUrl")
    content_type: str = Field(alias="contentType")
    wml: str | None = None
    raw: RawPayload | None = None
    error: ErrorInfo | None = None
    timing_ms: TimingMs = Field(alias="timingMs")
    engine_deck_input: EngineDeckInput | None = Field(default=None, alias="engineDeckInput")

    class Config:
        populate_by_name = True


app = FastAPI(title="Lowband Transport Service API", version="0.1.0")


def _normalize_content_type(value: str | None) -> str:
    if not value:
        return "application/octet-stream"
    return value.split(";", 1)[0].strip().lower()


def _error_response(
    *,
    status: int,
    final_url: str,
    content_type: str,
    code: str,
    message: str,
    details: dict[str, Any] | None = None,
    udp_rtt_ms: float = 0.0,
) -> FetchResponse:
    return FetchResponse(
        ok=False,
        status=status,
        finalUrl=final_url,
        contentType=content_type,
        error=ErrorInfo(code=code, message=message, details=details),
        timingMs=TimingMs(encode=0.0, udpRtt=udp_rtt_ms, decode=0.0),
    )


def _build_engine_input(wml: str, final_url: str, content_type: str, raw: str) -> EngineDeckInput:
    return EngineDeckInput(
        wmlXml=wml,
        baseUrl=final_url,
        contentType=content_type,
        rawBytesBase64=raw,
    )


@app.get("/health")
def health() -> dict[str, str]:
    return {"ok": "true", "service": "lowband-transport-python"}


@app.post("/fetch", response_model=FetchResponse)
def fetch(request: FetchRequest) -> FetchResponse:
    method = request.method.upper()
    if method not in SUPPORTED_METHODS:
        return _error_response(
            status=0,
            final_url=request.url,
            content_type="text/plain",
            code="INVALID_REQUEST",
            message=f"Unsupported method: {method}",
        )

    parsed = urllib.parse.urlparse(request.url)
    if not parsed.scheme:
        return _error_response(
            status=0,
            final_url=request.url,
            content_type="text/plain",
            code="INVALID_REQUEST",
            message="URL must include a scheme",
        )

    if parsed.scheme in {"wap", "waps"}:
        return _error_response(
            status=0,
            final_url=request.url,
            content_type="text/plain",
            code="TRANSPORT_UNAVAILABLE",
            message="WAP transport path not yet wired; start with http/https fetch flow",
        )

    headers = request.headers or {}
    timeout_seconds = max(request.timeout_ms / 1000.0, 0.1)
    retries = max(request.retries, 0)
    attempts = retries + 1
    last_error: str | None = None

    for attempt in range(1, attempts + 1):
        start = time.perf_counter()
        try:
            req = urllib.request.Request(url=request.url, method=method, headers=headers)
            with urllib.request.urlopen(req, timeout=timeout_seconds) as resp:
                body = resp.read()
                elapsed_ms = (time.perf_counter() - start) * 1000.0
                status = getattr(resp, "status", 200)
                final_url = resp.geturl()
                content_type = _normalize_content_type(resp.headers.get("Content-Type"))
                raw_b64 = base64.b64encode(body).decode("ascii")

                if content_type == "application/vnd.wap.wmlc":
                    return _error_response(
                        status=status,
                        final_url=final_url,
                        content_type=content_type,
                        code="WBXML_DECODE_FAILED",
                        message="WBXML decode path not implemented yet",
                        details={"attempt": attempt},
                        udp_rtt_ms=elapsed_ms,
                    )

                if content_type not in SUPPORTED_WML_TYPES:
                    return _error_response(
                        status=status,
                        final_url=final_url,
                        content_type=content_type,
                        code="UNSUPPORTED_CONTENT_TYPE",
                        message=f"Unsupported content type: {content_type}",
                        details={"attempt": attempt},
                        udp_rtt_ms=elapsed_ms,
                    )

                wml = body.decode("utf-8", errors="replace")
                return FetchResponse(
                    ok=True,
                    status=status,
                    finalUrl=final_url,
                    contentType=content_type,
                    wml=wml,
                    raw=RawPayload(bytesBase64=raw_b64, contentType=content_type),
                    timingMs=TimingMs(encode=0.0, udpRtt=elapsed_ms, decode=0.0),
                    engineDeckInput=_build_engine_input(wml, final_url, content_type, raw_b64),
                )
        except urllib.error.HTTPError as err:
            elapsed_ms = (time.perf_counter() - start) * 1000.0
            payload = err.read() if err.fp else b""
            body_text = payload.decode("utf-8", errors="replace") if payload else ""
            return _error_response(
                status=err.code,
                final_url=request.url,
                content_type="text/plain",
                code="PROTOCOL_ERROR",
                message=f"Upstream HTTP error: {err.code}",
                details={"body": body_text[:300], "attempt": attempt},
                udp_rtt_ms=elapsed_ms,
            )
        except urllib.error.URLError as err:
            last_error = str(err.reason)
            if attempt == attempts:
                elapsed_ms = (time.perf_counter() - start) * 1000.0
                code = "GATEWAY_TIMEOUT" if "timed out" in last_error.lower() else "TRANSPORT_UNAVAILABLE"
                return _error_response(
                    status=0,
                    final_url=request.url,
                    content_type="text/plain",
                    code=code,
                    message=last_error,
                    details={"attempts": attempts},
                    udp_rtt_ms=elapsed_ms,
                )
        except Exception as err:  # noqa: BLE001
            return _error_response(
                status=0,
                final_url=request.url,
                content_type="text/plain",
                code="INTERNAL_ERROR",
                message="Unexpected transport exception",
                details={"error": str(err)},
            )

    return _error_response(
        status=0,
        final_url=request.url,
        content_type="text/plain",
        code="RETRIES_EXHAUSTED",
        message=last_error or "Retries exhausted",
        details={"attempts": attempts},
    )


if __name__ == "__main__":
    import uvicorn

    bind = os.getenv("TRANSPORT_BIND", "127.0.0.1")
    port = int(os.getenv("TRANSPORT_PORT", "8765"))
    uvicorn.run(
        "service:app",
        host=bind,
        port=port,
        reload=False,
    )
