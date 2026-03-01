from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class WspRequestEnvelope:
    """Logical WSP request envelope at the transport boundary."""

    target_url: str
    method: str
    headers: dict[str, str]


def build_wsp_envelope(
    *, target_url: str, method: str, headers: dict[str, str]
) -> WspRequestEnvelope:
    if method.upper() != "GET":
        raise ValueError(f"WSP envelope only supports GET for MVP, got: {method}")
    return WspRequestEnvelope(target_url=target_url, method="GET", headers=dict(headers))
