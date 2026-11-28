# A-share and Hong Kong data connectors

InvestAgent reads secondary-market quotes through a small provider layer
inside the `stock-quote` skill
(`skills/public/stock-quote/scripts/connectors/`). The skill validates
tickers first, then asks the registry for a provider. This is a research
tape check. It does not place orders, move funds, or compute technical
indicators.

## Providers

| Provider | How to select it | License | `source_class` | Tier | Delayed |
| --- | --- | --- | --- | ---: | --- |
| AKShare | Default when the extra is installed (`INVESTAGENT_QUOTE_PROVIDER` unset or `akshare`) | MIT | `data` | 80 | Hong Kong board and CN index snapshots |
| Tencent delayed (`qt.gtimg.cn`) | Fallback, or `INVESTAGENT_QUOTE_PROVIDER=tencent_delayed` | Unofficial public endpoint, not a licensed feed | `data` | 80 | Always |
| Tushare Pro | `tushare` is refused | Token and credits; not fully open | — | — | — |

AKShare is scraped vendor data (East Money bid/ask for A-shares, the Hong
Kong spot board, and the CN index board). Do not label it `official`.
Reserve `official` (tier 100) for a future exchange or filing feed.

Tushare Pro is registered only as a disabled name. The default path does
not read a Tushare token and does not import the package.

## Install

The default install stays on the stdlib Tencent path. AKShare pulls pandas,
curl_cffi, and mini-racer, so it is an optional extra rather than a required
dependency:

```bash
uv sync --extra akshare --project backend
```

Equivalent: `pip install 'deerflow-harness[akshare]'`. The skill imports
AKShare only after the registry selects it. If the import is missing, the
registry falls back to `tencent_delayed` and says so in `provider_note`.

Required transitive licenses checked for AKShare 1.20.x are MIT, BSD,
Apache-2.0, ISC, and MPL-2.0 (`certifi`; `tqdm` is dual MIT and MPL-2.0).
Optional pandas extras such as PyQt5 are not part of this extra. Do not add
an AGPL package to fetch quotes.

## Record shape

Every quote carries:

| Field | Meaning |
| --- | --- |
| `ticker`, `market`, `code` | Normalized id (`sh600519`), market prefix, and the vendor code |
| `source` | Provider name: `akshare` or `tencent_delayed` |
| `source_class` | `official`, `data`, `paper`, `sellside`, or `unknown` |
| `source_tier` | Weight derived only from `source_class` |
| `as_of` | Vendor clock when the payload has one, otherwise `retrieved_at` |
| `retrieved_at` | UTC time of the fetch |
| `delayed` | True for Tencent, Hong Kong AKShare, and AKShare index snapshots |
| `license_note` | Short provenance sentence |
| `error` | Set on a per-ticker failure. Other tickers still return |
| `evidence_citation` | Empty when `error` is set. Otherwise a marker such as `@data:akshare` |

`source_tier` uses the same weights as `evidence-chain`: official 100, data
80, paper 60, sellside 40, unknown 0. Cite quote prints with that marker.
The evidence-chain script still only grades the type you declare; it does
not fetch the quote again.

The JSON tool response keeps the previous quote keys and the top-level
`source` value `qt.gtimg.cn` when Tencent served the request. New keys are
additive. Validation is unchanged: `sh`/`sz` plus 6 digits or `hk` plus 5
digits, at most 20 codes, URL-encoded Tencent query, US tickers rejected.

## Quote card

Table output includes a fenced `quote` block. Markdown artifacts in the
research workspace parse that fence and pin a quote card above the note:
ticker, last, change, as-of, and a provenance badge (source, tier, delayed,
and “data, not official”). The card does not chart prices.

## Adding a provider

1. Implement `get_quotes(tickers) -> list[QuoteRecord]`. Return one record
   per ticker. Put failures in `error` instead of raising for a partial
   board.
2. Set `source_class` honestly and let `make_quote` stamp `source_tier`.
3. Register it in `connectors/registry.py` and document the env value.
4. Cover it with an offline test. Stub the vendor call. Do not call a live
   market API from CI.

## Fundamentals hook

`connectors/fundamentals.py` defines `FundamentalRecord` and
`FundamentalProvider`. `FundamentalsNotImplemented.get_fundamentals` returns
`None`. No skill command fetches statements in this increment.

## Leftovers

- **Tushare Pro** stays optional and disabled (token, credits, license).
- **US / SEC** quotes and filings are not connected. US tickers stay rejected.
- **Technical analysis** (indicators, charts, backtests) is out of scope.
- **Fundamentals** stop at the hook above.
- **Primary-market data room** and broker, order, or funding APIs are out of
  scope.
