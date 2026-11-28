"""Fundamentals hook. Not wired to a skill CLI in this increment.

A later provider can implement ``FundamentalProvider`` and return a
``FundamentalRecord``. Until then ``get_fundamentals`` returns ``None``.
Do not invent statement figures.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from connectors.schema import source_tier


@dataclass(slots=True)
class FundamentalRecord:
    """Reserved shape. Provenance fields match quote records."""

    ticker: str
    market: str
    source: str
    source_class: str
    source_tier: int
    as_of: str
    retrieved_at: str
    license_note: str
    metrics: dict[str, str]
    error: str | None = None


class FundamentalProvider(Protocol):
    name: str
    source_class: str

    def get_fundamentals(self, ticker: str) -> FundamentalRecord | None:
        """Return one statement snapshot, or ``None`` when unimplemented."""
        ...


class FundamentalsNotImplemented:
    """Documented no-op. Registry callers must not treat ``None`` as zero."""

    name = "unimplemented"
    source_class = "unknown"

    def get_fundamentals(self, ticker: str) -> FundamentalRecord | None:
        del ticker
        return None


def unimplemented_fundamentals() -> FundamentalsNotImplemented:
    """Factory kept next to the quote registry for a later provider."""
    assert source_tier("unknown") == 0
    return FundamentalsNotImplemented()
