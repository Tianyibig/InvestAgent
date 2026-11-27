---
name: stock-quote
description: >
  Fetch real-time or latest quotes for A-shares, Hong Kong stocks, ETFs, and
  major China indices via the public Tencent quote API (no API key). Trigger on
  查股价, 行情, quote, stock price, ETF price, 上证, 创业板, or when the user
  only needs a fast tape check rather than a full equity note.
compatibility: Python 3.10+; network required for live quotes; urllib stdlib.
---

# Stock Quote (A / HK / indices)

## When to use

Fast quotes and index prints. For thesis work hand off to `equity-research`.
For US Mag7 / VIX boards prefer a dedicated US flow or web research — this
skill targets the Tencent `qt.gtimg.cn` endpoint used for CN/HK symbols.

## Codes

| Market | Format | Example |
| --- | --- | --- |
| Shanghai A | `sh` + 6 digits | `sh600519` |
| Shenzhen A | `sz` + 6 digits | `sz000001` |
| Hong Kong | `hk` + 5 digits | `hk00700` |
| SSE Composite | `sh000001` | |
| ChiNext | `sz399006` | |

## Command

```bash
python /mnt/skills/public/stock-quote/scripts/quote.py \
  --codes sh000001,sz399006,sh600519,hk00700
```

Optional:

```bash
python /mnt/skills/public/stock-quote/scripts/quote.py \
  --codes sh600519 --json
```

## Reporting

Print a compact table: name, last, change %, previous close, volume note.
Mark after-hours / delayed HK prints when the API returns stale session data.
Cap a single call at 20 codes.

## Notes

- Live network call; if it fails, report the error and stop — do not invent prices.
- Encoding from the endpoint is GBK; the script decodes it.
- Prefer this over browser scraping for CN/HK tape checks.
