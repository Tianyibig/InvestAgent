---
name: portfolio-review
description: >
  Review a portfolio or watchlist: attribution, thesis drift, risk concentration,
  and what to hold / trim / add / exit. Trigger on 复盘, portfolio review,
  持仓复盘, watchlist check, or when the user pastes holdings and asks what
  changed. Uses invest-research-protocol gates and can call stock-quote for tape
  context; deep single-name work hands off to equity-research.
---

# Portfolio Review

## When to use

Multi-name holdings or a watchlist, not a first-time IC pack. For one ticker use
`equity-research`. For a theme map use `sector-scan`. Load
`invest-research-protocol` first if no protocol card exists.

## Workflow

1. Protocol card: decision = rebalance / hold / trim / add; deadline and
   falsifiers for the book, not only for one name.
2. Ingest the holdings table (ticker, weight or shares, cost, thesis one-liner,
   entry date). Ask only for missing fields that change the review.
3. Refresh tape with `stock-quote` for CN/HK names when a live check helps.
4. Score each name for thesis intact / drifted / broken; note concentration and
   correlated risks.
5. Evidence-chain any action claim that would change size (threshold 50 draft /
   80 before size-up or exit memo).
6. Write `/mnt/user-data/outputs/portfolio-review-{date}.md`, then archive to
   the Portfolio / book Project shelf per `invest-research-protocol` Step 8.

## Output template

```markdown
# Portfolio review — {as_of}

- Decision this review informs: rebalance | hold | trim | add
- Book: [mandate / account]
- Locale: zh_CN | en

## Snapshot
| Ticker | Weight | P/L vs cost | Thesis status | Action |
| --- | ---: | ---: | --- | --- |
| … | … | … | intact / drifted / broken | hold / trim / add / exit |

## Attribution
What drove P/L: beta, sector, idiosyncratic. Cite sources.

## Concentration and correlation
Top weights, shared factors, liquidity or single-event risk.

## Thesis drift
Per name: original thesis → evidence update → status.

## Recommended actions
Prioritized list with size guidance and what would reverse each action.

## Devil's Advocate
Strongest case that the proposed actions are wrong.

## Risks and monitoring
Triggers to re-open the review; next check date.

## Sources
Dated list. Mark gaps explicitly.
```

## Hard rules

- Do not invent holdings, costs, or weights.
- Do not upgrade a tape check into a full equity note without saying so.
- Size-up / exit recommendations need falsifiers and an evidence-chain gate.
- If the user only wants quotes, stop at `stock-quote`.
