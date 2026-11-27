#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Fetch CN/HK quotes from the public Tencent quote endpoint.

Stdlib only. Live calls need network. Tests inject a fake opener.

Exit codes:
  0 — success
  2 — usage or request/parse failure
"""

from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.request
from collections.abc import Callable
from typing import Any

ENDPOINT = "https://qt.gtimg.cn/q={codes}"
MAX_CODES = 20

# Field indexes in the `~`-separated Tencent payload (0-based).
IDX_NAME = 1
IDX_CODE = 2
IDX_LAST = 3
IDX_PREV_CLOSE = 4
IDX_OPEN = 5
IDX_VOLUME = 6
IDX_AMOUNT = 7
IDX_CHANGE_PCT = 32


Opener = Callable[[str], bytes]


def default_opener(url: str) -> bytes:
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "DeerFlow-stock-quote/1.0"},
    )
    with urllib.request.urlopen(request, timeout=15) as response:
        return response.read()


def normalize_codes(raw: str) -> list[str]:
    codes = [part.strip().lower() for part in raw.split(",") if part.strip()]
    if not codes:
        raise ValueError("no codes provided")
    if len(codes) > MAX_CODES:
        raise ValueError(f"at most {MAX_CODES} codes per request")
    return codes


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
    url = ENDPOINT.format(codes=",".join(codes))
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
    parser = argparse.ArgumentParser(description="CN/HK quotes via Tencent API")
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
        print(json.dumps({"quotes": rows}, ensure_ascii=False, indent=2))
    else:
        print(render_table(rows))
    return 0


if __name__ == "__main__":
    sys.exit(main())
