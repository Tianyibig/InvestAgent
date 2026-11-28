---
name: stock-quote
description: >
  Fetch A-share and Hong Kong quotes through a replaceable provider. Default
  is AKShare when installed; otherwise the unofficial delayed Tencent
  endpoint. Trigger on 查股价, 行情, quote, stock price, ETF price, 上证,
  创业板, or a fast tape check. Rejects US tickers. Prints are data-tier
  provenance, not an official feed.
compatibility: Python 3.10+ stdlib for the Tencent fallback. Optional AKShare extra needs Python 3.11.5+. No token on the default path.
---

# Stock Quote (A / HK)

## When to use

Fast quotes and index prints for research notes. For thesis work hand off to
`equity-research`. This skill **rejects** US tickers. It is not a broker,
order, or funding API.

## Providers

| Name | Role | Class | Tier |
| --- | --- | --- | --- |
| `akshare` | Default when the optional extra is installed | `data` | 80 |
| `tencent_delayed` | Fallback, and the explicit legacy path | `data` | 80 |
| `tushare` | Named in the registry, **disabled** | — | — |

AKShare (MIT) scrapes vendor pages such as East Money. Those prints are
**not official**. Hong Kong board quotes and index snapshots are marked
`delayed`. The Tencent path always calls `https://qt.gtimg.cn` and is always
`delayed`.

Select a provider with `INVESTAGENT_QUOTE_PROVIDER`:

- unset or `akshare` — AKShare, or Tencent when AKShare is not installed
- `tencent_delayed` — force the stdlib Tencent path
- `tushare` — refused. Tushare Pro needs a token and credits and is not open
  data. Do not put a token on the default path.

Install AKShare only when you want it:

```bash
uv sync --extra akshare --project backend
# or: pip install 'deerflow-harness[akshare]'
```

The default install does not include AKShare. Pandas, curl_cffi, and
mini-racer stay off the required dependency set. Transitive licenses for the
extra are permissive (MIT, BSD, Apache-2.0, ISC, MPL-2.0). Do not add an AGPL
package to reach a quote.

## Codes (whitelist)

| Market | Format | Example |
| --- | --- | --- |
| Shanghai A | `sh` + 6 digits | `sh600519` |
| Shenzhen A | `sz` + 6 digits | `sz000001` |
| Hong Kong | `hk` + 5 digits | `hk00700` |
| SSE Composite | `sh000001` | |
| ChiNext | `sz399006` | |

Illegal codes are **rejected** (not silently dropped). Cap **20** codes per
call. On the Tencent path the host stays `qt.gtimg.cn` and the code list is
URL-encoded.

## Command

```bash
python /mnt/skills/public/stock-quote/scripts/quote.py \
  --codes sh000001,sz399006,sh600519,hk00700
```

Optional JSON (same quote fields as before, plus provenance):

```bash
python /mnt/skills/public/stock-quote/scripts/quote.py \
  --codes sh600519 --json
```

Each quote object keeps `name`, `code`, `last`, `prev_close`, `open`,
`volume_lots`, `amount`, and `change_pct`. Added fields: `ticker`, `market`,
`source`, `source_class`, `source_tier`, `as_of`, `retrieved_at`, `delayed`,
`license_note`, `error`, `evidence_citation`. The top-level `source` is still
`qt.gtimg.cn` when the Tencent provider served the print. `provider` names
the registry entry.

A per-ticker failure sets `error` and still carries provenance. If every
ticker fails, the process exits 2 and does not invent prices.

## Reporting

The text report is a compact table plus a fenced `quote` block. When you
write a note under `/mnt/user-data/outputs/`, keep that fence so the research
workspace can show the quote card (ticker, last, change, as-of, and a
provenance badge). Do not draw a chart or a technical-analysis panel.

Cite a successful print with the evidence-chain marker in
`evidence_citation`, for example `@data:akshare` or `@data:tencent_delayed`.
Both score **80**. Do not tag them `@official`.

## Fundamentals

Statement data is not fetched. `connectors/fundamentals.py` defines
`FundamentalProvider` and a `FundamentalsNotImplemented` hook that returns
`None`. Do not fill ratios from memory.

## Notes

- If the network call fails, report the error and stop — do not invent prices.
- Tencent payloads are GBK. The script decodes them.
- AKShare is imported only after the registry selects it.
- US names and SEC filings are out of scope. Technical analysis is out of scope.
- Tushare stays disabled until a later change adds a token-gated provider on
  purpose.
