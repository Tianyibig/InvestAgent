"""Quote metadata shared by every research data provider.

``source_tier`` is derived only from ``source_class``. The five classes below
use the same weights as ``skills/public/evidence-chain`` (official 100, data
80, paper 60, sellside 40, unknown 0). Scraped and delayed vendor prints are
``data``. Nothing in this package claims ``official``.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

SOURCE_TIERS: dict[str, int] = {
    "official": 100,
    "data": 80,
    "paper": 60,
    "sellside": 40,
    "unknown": 0,
}
SOURCE_CLASSES = frozenset(SOURCE_TIERS)


def source_tier(source_class: str) -> int:
    """Map a source class to its evidence weight. Unknown classes score 0."""
    return SOURCE_TIERS.get(source_class, 0)


def utc_now() -> str:
    """UTC timestamp with an offset, truncated to seconds."""
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def market_of(ticker: str) -> str:
    prefix = ticker[:2]
    if prefix in {"sh", "sz", "hk"}:
        return prefix
    return ""


def code_of(ticker: str) -> str:
    return ticker[2:] if len(ticker) > 2 else ticker


def evidence_citation(record: QuoteRecord) -> str:
    """Marker the evidence-chain script can score.

    Failed quotes are not evidence. Successful quotes are ``@data:<provider>``
    (or another declared class) and must not be tagged official.
    """
    if record.error:
        return ""
    return (
        f"{record.ticker} last {record.last}"
        f"@{record.source_class}:{record.source}"
    )


@dataclass(slots=True)
class QuoteRecord:
    """One ticker print, including provenance for evidence-chain scoring."""

    ticker: str
    market: str
    name: str
    code: str
    last: str
    prev_close: str
    open: str
    volume_lots: str
    amount: str
    change_pct: str
    source: str
    source_class: str
    source_tier: int
    as_of: str
    retrieved_at: str
    delayed: bool
    license_note: str
    error: str | None = None

    def to_dict(self) -> dict[str, Any]:
        """Tool payload. Historical quote keys stay; provenance is additive."""
        return {
            "name": self.name,
            "code": self.code,
            "last": self.last,
            "prev_close": self.prev_close,
            "open": self.open,
            "volume_lots": self.volume_lots,
            "amount": self.amount,
            "change_pct": self.change_pct,
            "ticker": self.ticker,
            "market": self.market,
            "source": self.source,
            "source_class": self.source_class,
            "source_tier": self.source_tier,
            "as_of": self.as_of,
            "retrieved_at": self.retrieved_at,
            "delayed": self.delayed,
            "license_note": self.license_note,
            "error": self.error,
            "evidence_citation": evidence_citation(self),
        }


def make_quote(
    *,
    ticker: str,
    source: str,
    source_class: str,
    delayed: bool,
    license_note: str,
    retrieved_at: str,
    as_of: str | None = None,
    name: str = "",
    last: str = "",
    prev_close: str = "",
    open_price: str = "",
    volume_lots: str = "",
    amount: str = "",
    change_pct: str = "",
    error: str | None = None,
) -> QuoteRecord:
    """Build a record and stamp ``source_tier`` from ``source_class``."""
    return QuoteRecord(
        ticker=ticker,
        market=market_of(ticker),
        name=name,
        code=code_of(ticker),
        last=last,
        prev_close=prev_close,
        open=open_price,
        volume_lots=volume_lots,
        amount=amount,
        change_pct=change_pct,
        source=source,
        source_class=source_class,
        source_tier=source_tier(source_class),
        as_of=as_of or retrieved_at,
        retrieved_at=retrieved_at,
        delayed=delayed,
        license_note=license_note,
        error=error,
    )
