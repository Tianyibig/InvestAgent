"""Provider registry for research quotes.

``INVESTAGENT_QUOTE_PROVIDER`` selects ``akshare`` (default) or
``tencent_delayed``. When AKShare cannot be imported, resolution falls back
to Tencent and reports why. Tushare Pro is a named, disabled entry: it is
never selected by default and never imported.
"""

from __future__ import annotations

import importlib.util
import os

from connectors.akshare_provider import (
    AkshareQuoteProvider,
    ProviderUnavailable,
)
from connectors.schema import QuoteRecord
from connectors.tencent import Opener, TencentDelayedProvider

ENV_QUOTE_PROVIDER = "INVESTAGENT_QUOTE_PROVIDER"

TUSHARE_DISABLED = (
    "Tushare Pro is optional and disabled. It requires a token and credits "
    "and is not fully open data. It is not installed on the default path. "
    "Use akshare or tencent_delayed."
)


class QuoteProviderUnavailable(ProviderUnavailable):
    """A requested provider cannot be constructed."""


def akshare_importable() -> bool:
    """True when the optional extra is installed. Does not import AKShare."""
    return importlib.util.find_spec("akshare") is not None


def resolve_provider(
    opener: Opener | None = None,
) -> tuple[TencentDelayedProvider | AkshareQuoteProvider, str | None]:
    """Pick a provider. ``opener`` is the Tencent transport, including fakes.

    Returns ``(provider, note)``. ``note`` is set when the request fell back
    because AKShare was unavailable.
    """
    requested = os.environ.get(ENV_QUOTE_PROVIDER, "akshare").strip().lower()
    if requested in {"", "akshare", "default"}:
        if akshare_importable():
            return AkshareQuoteProvider(), None
        return (
            TencentDelayedProvider(opener=opener),
            "AKShare is not installed; fell back to tencent_delayed",
        )
    if requested in {"tencent_delayed", "tencent"}:
        return TencentDelayedProvider(opener=opener), None
    if requested == "tushare":
        raise QuoteProviderUnavailable(TUSHARE_DISABLED)
    raise QuoteProviderUnavailable(f"unknown quote provider: {requested}")


def records_as_dicts(records: list[QuoteRecord]) -> list[dict]:
    return [record.to_dict() for record in records]
