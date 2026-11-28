#!/usr/bin/env python3
"""Fetch CN/HK research quotes from a replaceable provider.

Default provider is AKShare when the optional extra is installed. Otherwise
the script falls back to the unofficial delayed Tencent endpoint. Validation
(whitelist, 20-code cap, URL-encoding, US rejection) stays in front of fetch.

Stdlib on the fallback path. AKShare is imported only inside its provider.
Tests inject a fake opener for Tencent. This is not a broker feed.

Exit codes:
  0 — success (partial per-ticker errors are included in the payload)
  2 — usage, validation, unknown provider, or every ticker failed
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

_SCRIPTS_DIR = Path(__file__).resolve().parent
if str(_SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(_SCRIPTS_DIR))

from connectors.registry import (  # noqa: E402
    ENV_QUOTE_PROVIDER,
    ProviderUnavailable,
    records_as_dicts,
    resolve_provider,
)
from connectors.schema import QuoteRecord  # noqa: E402
from connectors.tencent import (  # noqa: E402
    DISCLAIMER,
    ENDPOINT_TEMPLATE,
    QUOTE_HOST,
    Opener,
    build_url,
    default_opener,
    fetch_quotes,
    parse_body,
)
from connectors.validate import MAX_CODES, normalize_codes  # noqa: E402

__all__ = [
    "DISCLAIMER",
    "ENDPOINT_TEMPLATE",
    "ENV_QUOTE_PROVIDER",
    "MAX_CODES",
    "QUOTE_HOST",
    "build_url",
    "default_opener",
    "fetch_quotes",
    "main",
    "normalize_codes",
    "parse_body",
    "render_table",
]

AKSHARE_DISCLAIMER = (
    "AKShare (MIT) scraped East Money quotes. source_class=data (tier 80), "
    "not an official exchange feed. Not a broker feed — research use only."
)


def render_table(rows: list[dict[str, Any]], disclaimer: str = DISCLAIMER) -> str:
    lines = [
        f"> {disclaimer}",
        "",
        "| Name | Code | Last | Change % | Prev close |",
        "| --- | --- | ---: | ---: | ---: |",
    ]
    for row in rows:
        name = row["name"] or (row.get("error") or "")
        lines.append(
            f"| {name} | {row['code']} | {row['last']} | "
            f"{row['change_pct']} | {row['prev_close']} |"
        )
    lines.extend(
        [
            "",
            "```quote",
            json.dumps({"quotes": rows}, ensure_ascii=False),
            "```",
        ]
    )
    return "\n".join(lines)


def _disclaimer(provider_name: str) -> str:
    if provider_name == "tencent_delayed":
        return DISCLAIMER
    return AKSHARE_DISCLAIMER


def _top_level_source(provider_name: str) -> str:
    """Keep the historical Tencent host string on the legacy path."""
    if provider_name == "tencent_delayed":
        return QUOTE_HOST
    return provider_name


def main(argv: list[str] | None = None, opener: Opener | None = None) -> int:
    parser = argparse.ArgumentParser(
        description=(
            "CN/HK research quotes (AKShare when installed, else delayed Tencent)"
        )
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
        provider, note = resolve_provider(opener=opener)
        records: list[QuoteRecord] = provider.get_quotes(codes)
    except ValueError as exc:
        print(f"[!] {exc}", file=sys.stderr)
        return 2
    except ProviderUnavailable as exc:
        print(f"[!] {exc}", file=sys.stderr)
        return 2
    except RuntimeError as exc:
        print(f"[!] {exc}", file=sys.stderr)
        return 2

    if records and all(record.error for record in records):
        print(f"[!] {records[0].error}", file=sys.stderr)
        return 2

    rows = records_as_dicts(records)
    disclaimer = _disclaimer(provider.name)
    if args.json:
        payload: dict[str, Any] = {
            "quotes": rows,
            "disclaimer": disclaimer,
            "source": _top_level_source(provider.name),
            "provider": provider.name,
        }
        if note:
            payload["provider_note"] = note
        print(json.dumps(payload, ensure_ascii=False, indent=2))
    else:
        print(render_table(rows, disclaimer=disclaimer))
        if note:
            print(f"\n> {note}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
