"""Unofficial delayed Tencent quotes (``qt.gtimg.cn``).

Stdlib HTTP only. Tests inject a fake opener. Prints are ``source_class=data``
and ``delayed=true``. This is not an official exchange feed.
"""

from __future__ import annotations

import urllib.error
import urllib.parse
import urllib.request
from collections.abc import Callable
from typing import Any

from connectors.schema import QuoteRecord, make_quote, utc_now

# Host is fixed — do not make it configurable.
QUOTE_HOST = "qt.gtimg.cn"
ENDPOINT_TEMPLATE = "https://{host}/q={codes}"
PROVIDER_NAME = "tencent_delayed"
SOURCE_CLASS = "data"

DISCLAIMER = (
    "Unofficial Tencent quotes (qt.gtimg.cn); may be delayed. "
    "Not a broker feed — research use only."
)
LICENSE_NOTE = (
    "Unofficial delayed Tencent quote (qt.gtimg.cn). "
    "source_class=data (tier 80), not an official exchange feed. "
    "Research use only."
)

# Field indexes in the `~`-separated Tencent payload (0-based).
IDX_NAME = 1
IDX_CODE = 2
IDX_LAST = 3
IDX_PREV_CLOSE = 4
IDX_OPEN = 5
IDX_VOLUME = 6
IDX_AMOUNT = 7
IDX_DATE = 30
IDX_TIME = 31
IDX_CHANGE_PCT = 32

Opener = Callable[[str], bytes]


def default_opener(url: str) -> bytes:
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "InvestAgent-stock-quote/1.0"},
    )
    with urllib.request.urlopen(request, timeout=15) as response:
        return response.read()


def build_url(codes: list[str]) -> str:
    """URL-encode the code list; host stays hardcoded."""
    encoded = urllib.parse.quote(",".join(codes), safe=",")
    return ENDPOINT_TEMPLATE.format(host=QUOTE_HOST, codes=encoded)


def _field(fields: list[str], index: int) -> str:
    if index >= len(fields):
        return ""
    return fields[index]


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
        row: dict[str, Any] = {
            "name": fields[IDX_NAME],
            "code": fields[IDX_CODE],
            "last": fields[IDX_LAST],
            "prev_close": fields[IDX_PREV_CLOSE],
            "open": fields[IDX_OPEN],
            "volume_lots": fields[IDX_VOLUME],
            "amount": fields[IDX_AMOUNT],
            "change_pct": fields[IDX_CHANGE_PCT],
        }
        trade_date = _field(fields, IDX_DATE)
        trade_time = _field(fields, IDX_TIME)
        if trade_date:
            row["trade_date"] = trade_date
        if trade_time:
            row["trade_time"] = trade_time
        rows.append(row)
    return rows


def fetch_quotes(
    codes: list[str], opener: Opener | None = None
) -> list[dict[str, Any]]:
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


def tencent_as_of(trade_date: str, trade_time: str) -> str | None:
    """Turn a vendor clock into an ISO timestamp in China time (+08:00)."""
    if not (
        len(trade_date) == 8
        and trade_date.isdigit()
        and trade_time.isdigit()
        and 4 <= len(trade_time) <= 6
    ):
        return None
    clock = trade_time.zfill(6)
    return (
        f"{trade_date[0:4]}-{trade_date[4:6]}-{trade_date[6:8]}"
        f"T{clock[0:2]}:{clock[2:4]}:{clock[4:6]}+08:00"
    )


def _error_records(tickers: list[str], message: str, retrieved_at: str) -> list[QuoteRecord]:
    return [
        make_quote(
            ticker=ticker,
            source=PROVIDER_NAME,
            source_class=SOURCE_CLASS,
            delayed=True,
            license_note=LICENSE_NOTE,
            retrieved_at=retrieved_at,
            error=message,
        )
        for ticker in tickers
    ]


class TencentDelayedProvider:
    """``QuoteProvider`` for the legacy ``qt.gtimg.cn`` endpoint."""

    name = PROVIDER_NAME
    source_class = SOURCE_CLASS

    def __init__(self, opener: Opener | None = None) -> None:
        self._opener = opener

    def get_quotes(self, tickers: list[str]) -> list[QuoteRecord]:
        retrieved_at = utc_now()
        try:
            rows = fetch_quotes(tickers, opener=self._opener)
        except RuntimeError as exc:
            return _error_records(tickers, str(exc), retrieved_at)

        by_code = {str(row.get("code", "")): row for row in rows}
        records: list[QuoteRecord] = []
        for ticker in tickers:
            row = by_code.get(ticker[2:])
            if row is None:
                records.append(
                    make_quote(
                        ticker=ticker,
                        source=PROVIDER_NAME,
                        source_class=SOURCE_CLASS,
                        delayed=True,
                        license_note=LICENSE_NOTE,
                        retrieved_at=retrieved_at,
                        error="not in quote response",
                    )
                )
                continue
            as_of = tencent_as_of(
                str(row.get("trade_date", "")),
                str(row.get("trade_time", "")),
            )
            records.append(
                make_quote(
                    ticker=ticker,
                    source=PROVIDER_NAME,
                    source_class=SOURCE_CLASS,
                    delayed=True,
                    license_note=LICENSE_NOTE,
                    retrieved_at=retrieved_at,
                    as_of=as_of,
                    name=str(row.get("name", "")),
                    last=str(row.get("last", "")),
                    prev_close=str(row.get("prev_close", "")),
                    open_price=str(row.get("open", "")),
                    volume_lots=str(row.get("volume_lots", "")),
                    amount=str(row.get("amount", "")),
                    change_pct=str(row.get("change_pct", "")),
                )
            )
        return records
