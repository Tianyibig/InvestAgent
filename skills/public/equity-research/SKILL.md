---
name: equity-research
description: >
  Produce a buy-side equity research note for a listed company (A-share, HK, US,
  or ADR). Trigger on 分析 [ticker], equity note, initiate coverage, 个股研究,
  目标价, rating, or when the user asks for Bull/Base/Bear on a public company.
  Follows invest-research-protocol: filings-first, graded sources, reverse-DCF
  check, Devil's Advocate, and evidence-chain gate before publish.
---

# Equity Research Note

## When to use

Use for public-company investment views. For private/growth IC packages use
`ic-memo`. For tape-only quotes use `stock-quote`. Always load
`invest-research-protocol` first if no protocol card exists.

## Workflow

1. Write / refresh the protocol card (decision, falsifiers, locale).
2. Baseline from filings and transcripts; read IR deck last.
3. Fill the note template below with dated sources.
4. Add Bull / Base / Bear and, when FCFF is usable, a `reverse-dcf` check.
5. Run `evidence-chain` on the rating thesis claim (threshold 50 draft / 80 publish).
6. Save to `/mnt/user-data/outputs/{ticker}-equity-note.md`, then follow
   `invest-research-protocol` Step 8 to archive into the ticker Project shelf
   (dated `shelf_name`, append — do not overwrite).

## Output template

```markdown
# {Name} ({Ticker}) — Equity Research Note

- Rating: Buy | Hold | Sell | Watch
- Target price (12m): ...
- As of: YYYY-MM-DD
- Decision this note informs: ...

## Executive thesis (≤120 words)
What the company does, why now, what must be true.

## Bull / Base / Bear
| Case | Price / return | Key drivers | Probability |
| --- | --- | --- | --- |
| Bull | | | |
| Base | | | |
| Bear | | | |

## Business model (plain language)
Revenue model, customer, pricing power, concentration.

## Recent results
Material KPIs vs consensus; surprises; quality of earnings notes.

## Valuation dashboard
- Multiples vs history and peers (state as-of dates)
- Reverse-DCF implied CAGR (if applicable) vs historical CAGR
- What the market is pricing in (one paragraph)

## Catalyst calendar (3–6 months)
Dated events only; mark confidence.

## Risks (Top 5)
Quantify where possible; include mitigants.

## Devil's Advocate
If the thesis is wrong, the most likely reason is…

## Evidence score
Claim scored: …
Score / threshold: … (attach evidence-chain output)

## Action
Buy / Hold / Sell / Watch — position sizing note if relevant.
Next evidence to collect: …
```

## Quality bar

- Every material figure has source + date.
- IR narrative vs filing gaps are called out explicitly.
- No rating without Bull/Base/Bear and Devil's Advocate.
- Prefer `chart-visualization` for valuation or KPI charts when helpful.
