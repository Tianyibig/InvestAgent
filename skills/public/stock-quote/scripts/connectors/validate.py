"""Ticker whitelist for A-share and Hong Kong research quotes.

US symbols are rejected. Illegal codes are rejected rather than dropped.
"""

from __future__ import annotations

import re

MAX_CODES = 20

CODE_RE = re.compile(r"^(?:sh|sz)\d{6}$|^hk\d{5}$")
US_HINT_RE = re.compile(
    r"^(?:us[_-]?)?[a-z]{1,5}$|^(?:nyse|nasdaq)[:/].+$",
    re.I,
)


def normalize_codes(raw: str) -> list[str]:
    """Whitelist CN/HK codes; reject illegal or US tickers instead of dropping."""
    parts = [part.strip().lower() for part in raw.split(",") if part.strip()]
    if not parts:
        raise ValueError("no codes provided")
    if len(parts) > MAX_CODES:
        raise ValueError(f"at most {MAX_CODES} codes per request")

    codes: list[str] = []
    for part in parts:
        if CODE_RE.fullmatch(part):
            codes.append(part)
            continue
        if US_HINT_RE.fullmatch(part) or part.startswith("us"):
            raise ValueError(
                f"US ticker rejected: {part!r}. "
                "This skill only accepts sh/sz (6 digits) and hk (5 digits); "
                "use a dedicated US quote flow or web research."
            )
        raise ValueError(
            f"illegal code: {part!r}. "
            "Allowed: sh######, sz######, hk##### (comma-separated, max "
            f"{MAX_CODES})."
        )
    return codes
