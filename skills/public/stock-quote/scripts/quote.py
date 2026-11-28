#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Fetch CN/HK quotes from the public Tencent quote endpoint.

Stdlib only. Live calls need network. Tests inject a fake opener.

Quotes are unofficial Tencent prints and may be delayed. This is not a
broker feed and does not place orders.

Exit codes:
  0 — success
  2 — usage, validation, or request/parse failure
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from collections.abc import Callable
from typing import Any

# Host is fixed — do not make it configurable.
QUOTE_HOST = "qt.gtimg.cn"
ENDPOINT_TEMPLATE = "https://{host}/q={codes}"
MAX_CODES = 20

CODE_RE = re.compile(r"^(?:sh|sz)\d{6}$|^hk\d{5}$")
US_HINT_RE = re.compile(
    r"^(?:us[_-]?)?[a-z]{1,5}$|^(?:nyse|nasdaq)[:/].+$",
    re.I,
)

# Field indexes in the `~`-separated Tencent payload (0-based).
IDX_NAME = 1
IDX_CODE = 2
IDX_LAST = 3
IDX_PREV_CLOSE = 4
IDX_OPEN = 5
IDX_VOLUME = 6
IDX_AMOUNT = 7
IDX_CHANGE_PCT = 32

DISCLAIMER = (
    "Unofficial Tencent quotes (qt.gtimg.cn); may be delayed. "
    "Not a broker feed — research use only."
)

Opener = Callable[[str], bytes]


def default_opener(url: str) -> bytes:
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "InvestAgent-stock-quote/1.0"},
    )
    with urllib.request.urlopen(request, timeout=15) as response:
        return response.read()


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


def build_url(codes: list[str]) -> str:
    """URL-encode the code list; host stays hardcoded."""
    encoded = urllib.parse.quote(",".join(codes), safe=",")
    return ENDPOINT_TEMPLATE.format(host=QUOTE_HOST, codes=encoded)


def parse_body(body: bytes) -> list[dict[str, Any]]:
    text = body.decode("gbk", errors="replace")
    rows: list[dict[str, Any]] = []
    for line in text.splitlines():
        line = line.strip()
        if not line or '="' not in line:
            continue
        try:
            payload = line.split('="', 1)[1]
            if payload.endswith('";'):
                payload = payload[:-2]
            elif payload.endswith('"'):
                payload = payload[:-1]
            fields = payload.split("~")
        except (IndexError, ValueError):
            continue
        if len(fields) <= IDX_CHANGE_PCT:
            continue
        rows.append(
            {
                "name": fields[IDX_NAME],
                "code": fields[IDX_CODE],
                "last": fields[IDX_LAST],
                "prev_close": fields[IDX_PREV_CLOSE],
                "open": fields[IDX_OPEN],
                "volume_lots": fields[IDX_VOLUME],
                "amount": fields[IDX_AMOUNT],
                "change_pct": fields[IDX_CHANGE_PCT],
            }
        )
    return rows


def fetch_quotes(codes: list[str], opener: Opener | None = None) -> list[dict[str, Any]]:
    open_bytes = opener or default_opener
    url = build_url(codes)
    try:
        body = open_bytes(url)
    except urllib.error.URLError as exc:
        raise RuntimeError(f"quote request failed: {exc}") from exc
    rows = parse_body(body)
    if not rows:
        raise RuntimeError("quote response contained no parseable rows")
    return rows


def render_table(rows: list[dict[str, Any]]) -> str:
    lines = [
        f"> {DISCLAIMER}",
        "",
        "| Name | Code | Last | Change % | Prev close |",
        "| --- | --- | ---: | ---: | ---: |",
    ]
    for row in rows:
        lines.append(
            f"| {row['name']} | {row['code']} | {row['last']} | "
            f"{row['change_pct']} | {row['prev_close']} |"
        )
    return "\n".join(lines)


def main(argv: list[str] | None = None, opener: Opener | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="CN/HK quotes via Tencent API (unofficial; may be delayed)"
    )
    parser.add_argument(
        "--codes",
        required=True,
        help="comma-separated codes, e.g. sh000001,sz399006,hk00700",
    )
    parser.add_argument("--json", action="store_true", help="JSON output")
    args = parser.parse_args(argv)

    try:
        codes = normalize_codes(args.codes)
        rows = fetch_quotes(codes, opener=opener)
    except ValueError as exc:
        print(f"[!] {exc}", file=sys.stderr)
        return 2
    except RuntimeError as exc:
        print(f"[!] {exc}", file=sys.stderr)
        return 2

    if args.json:
        print(
            json.dumps(
                {
                    "quotes": rows,
                    "disclaimer": DISCLAIMER,
                    "source": QUOTE_HOST,
                },
                ensure_ascii=False,
                indent=2,
            )
        )
    else:
        print(render_table(rows))
    return 0


if __name__ == "__main__":
    sys.exit(main())
