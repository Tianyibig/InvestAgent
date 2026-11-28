"""AKShare quote provider. Import of ``akshare`` happens inside the fetch.

AKShare is MIT and optional. Scraped East Money prints are ``source_class=data``
(tier 80), never official. Hong Kong board data and index snapshots are marked
delayed. A-share bid/ask is still scraped vendor data.
"""

from __future__ import annotations

from collections.abc import Iterable, Iterator
from typing import Any

from connectors.schema import QuoteRecord, make_quote, utc_now

PROVIDER_NAME = "akshare"
SOURCE_CLASS = "data"
LICENSE_NOTE = (
    "AKShare (MIT) scraped East Money quote. "
    "source_class=data (tier 80), not an official exchange or filing. "
    "Research use only."
)
HK_DELAY_NOTE = " Hong Kong East Money board quotes are about 15 minutes delayed."
INDEX_DELAY_NOTE = " Index board quotes are a delayed snapshot."


class ProviderUnavailable(RuntimeError):
    """The AKShare extra is not installed or failed to import."""


def _import_akshare() -> Any:
    """Import AKShare only when a quote is actually requested."""
    try:
        import akshare as ak
    except ImportError as exc:
        raise ProviderUnavailable(
            "AKShare is not installed. Install the optional extra with "
            "`uv sync --extra akshare --project backend` or "
            "`pip install 'deerflow-harness[akshare]'`, "
            "or leave it unset to use the Tencent fallback."
        ) from exc
    return ak


def is_cn_index(ticker: str) -> bool:
    """Shanghai ``000*`` and Shenzhen ``399*`` codes are index prints."""
    market, digits = ticker[:2], ticker[2:]
    if market == "sh" and digits.startswith("000"):
        return True
    return market == "sz" and digits.startswith("399")


def akshare_delayed(ticker: str) -> bool:
    return ticker.startswith("hk") or is_cn_index(ticker)


def format_value(value: object) -> str:
    if value is None or isinstance(value, bool):
        return "" if value is None else str(value)
    if isinstance(value, int):
        return str(value)
    if isinstance(value, float):
        if value != value:  # NaN
            return ""
        return f"{value:.4f}".rstrip("0").rstrip(".")
    text = str(value).strip()
    if text.lower() in {"nan", "none", "<na>"}:
        return ""
    return text


def iter_records(frame: object) -> Iterator[Any]:
    if frame is None:
        return
    iterrows = getattr(frame, "iterrows", None)
    if callable(iterrows):
        for _, row in iterrows():
            yield row
        return
    if isinstance(frame, Iterable) and not isinstance(frame, (str, bytes)):
        yield from frame


def _row_get(row: Any, keys: tuple[str, ...]) -> object:
    for key in keys:
        try:
            if key in row:
                return row[key]
        except TypeError:
            continue
    return ""


def _item_value_pairs(frame: object) -> list[tuple[str, object]]:
    pairs: list[tuple[str, object]] = []
    for row in iter_records(frame):
        item = _row_get(row, ("item", "Item"))
        if item == "":
            continue
        pairs.append((str(item), _row_get(row, ("value", "Value"))))
    return pairs


def row_from_bid_ask(frame: object) -> dict[str, str]:
    mapped = dict(_item_value_pairs(frame))
    if "最新" not in mapped and "last" not in mapped:
        raise LookupError("bid/ask quote had no last price")
    return {
        "name": format_value(mapped.get("名称", mapped.get("name", ""))),
        "last": format_value(mapped.get("最新", mapped.get("last", ""))),
        "change_pct": format_value(mapped.get("涨幅", mapped.get("change_pct", ""))),
        "open": format_value(mapped.get("今开", mapped.get("open", ""))),
        "prev_close": format_value(mapped.get("昨收", mapped.get("prev_close", ""))),
        "volume_lots": format_value(mapped.get("总手", mapped.get("volume_lots", ""))),
        "amount": format_value(mapped.get("金额", mapped.get("amount", ""))),
        "as_of": format_value(mapped.get("时间", mapped.get("as_of", ""))),
    }


def _digits(code: str) -> str:
    return "".join(ch for ch in code if ch.isdigit())


def row_from_board(frame: object, ticker: str) -> dict[str, str]:
    """Pick one row from an East Money board snapshot."""
    width = 5 if ticker.startswith("hk") else 6
    target = ticker[2:].zfill(width)
    for row in iter_records(frame):
        compact = _digits(format_value(_row_get(row, ("代码", "code"))))
        if not compact or compact.zfill(width) != target:
            continue
        return {
            "name": format_value(_row_get(row, ("名称", "name"))),
            "last": format_value(_row_get(row, ("最新价", "last"))),
            "change_pct": format_value(_row_get(row, ("涨跌幅", "change_pct"))),
            "open": format_value(_row_get(row, ("今开", "open"))),
            "prev_close": format_value(_row_get(row, ("昨收", "prev_close"))),
            "volume_lots": format_value(
                _row_get(row, ("成交量", "volume_lots", "volume"))
            ),
            "amount": format_value(_row_get(row, ("成交额", "amount"))),
            "as_of": format_value(_row_get(row, ("时间", "as_of"))),
        }
    raise LookupError(f"{ticker} not in AKShare board")


def fetch_akshare_spots(
    tickers: list[str],
) -> dict[str, dict[str, str] | BaseException]:
    """Call AKShare. Tests replace this function; it must not run in CI."""
    ak = _import_akshare()
    results: dict[str, dict[str, str] | BaseException] = {}
    hk = [ticker for ticker in tickers if ticker.startswith("hk")]
    indexes = [ticker for ticker in tickers if is_cn_index(ticker)]

    if hk:
        try:
            hk_frame = ak.stock_hk_spot_em()
        except Exception as exc:  # partial board failure, not a crash
            hk_frame = None
            for ticker in hk:
                results[ticker] = exc
    else:
        hk_frame = None

    if indexes:
        try:
            index_frame = ak.index_zh_spot_em()
        except Exception as exc:
            index_frame = None
            for ticker in indexes:
                results[ticker] = exc
    else:
        index_frame = None

    for ticker in tickers:
        if ticker in results:
            continue
        try:
            if ticker.startswith("hk"):
                results[ticker] = row_from_board(hk_frame, ticker)
            elif is_cn_index(ticker):
                results[ticker] = row_from_board(index_frame, ticker)
            else:
                results[ticker] = row_from_bid_ask(
                    ak.stock_bid_ask_em(symbol=ticker[2:])
                )
        except Exception as exc:
            results[ticker] = exc
    return results


def _license_note(ticker: str) -> str:
    if ticker.startswith("hk"):
        return (
            LICENSE_NOTE
            + HK_DELAY_NOTE
            + " volume_lots holds shares for this Hong Kong print."
        )
    if is_cn_index(ticker):
        return LICENSE_NOTE + INDEX_DELAY_NOTE
    return LICENSE_NOTE + " A-share volume from the East Money bid/ask print is in lots."


class AkshareQuoteProvider:
    """``QuoteProvider`` that lazy-imports AKShare."""

    name = PROVIDER_NAME
    source_class = SOURCE_CLASS

    def get_quotes(self, tickers: list[str]) -> list[QuoteRecord]:
        retrieved_at = utc_now()
        try:
            payloads = fetch_akshare_spots(tickers)
        except ProviderUnavailable as exc:
            return [
                make_quote(
                    ticker=ticker,
                    source=PROVIDER_NAME,
                    source_class=SOURCE_CLASS,
                    delayed=akshare_delayed(ticker),
                    license_note=_license_note(ticker),
                    retrieved_at=retrieved_at,
                    error=str(exc),
                )
                for ticker in tickers
            ]

        records: list[QuoteRecord] = []
        for ticker in tickers:
            payload = payloads.get(ticker)
            delayed = akshare_delayed(ticker)
            note = _license_note(ticker)
            if isinstance(payload, BaseException) or not isinstance(payload, dict):
                message = (
                    str(payload)
                    if isinstance(payload, BaseException)
                    else "AKShare returned no quote"
                )
                records.append(
                    make_quote(
                        ticker=ticker,
                        source=PROVIDER_NAME,
                        source_class=SOURCE_CLASS,
                        delayed=delayed,
                        license_note=note,
                        retrieved_at=retrieved_at,
                        error=message,
                    )
                )
                continue
            as_of = payload.get("as_of") or None
            records.append(
                make_quote(
                    ticker=ticker,
                    source=PROVIDER_NAME,
                    source_class=SOURCE_CLASS,
                    delayed=delayed,
                    license_note=note,
                    retrieved_at=retrieved_at,
                    as_of=as_of,
                    name=payload.get("name", ""),
                    last=payload.get("last", ""),
                    prev_close=payload.get("prev_close", ""),
                    open_price=payload.get("open", ""),
                    volume_lots=payload.get("volume_lots", ""),
                    amount=payload.get("amount", ""),
                    change_pct=payload.get("change_pct", ""),
                )
            )
        return records
