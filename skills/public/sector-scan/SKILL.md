---
name: sector-scan
description: >
  Produce a 360-style sector or thematic scan for investment. Trigger on 扫描,
  sector scan, 赛道研究, industry map, thematic overview, or when the user asks
  for a landscape across a technology or industry vertical. Covers definition,
  timing, tech routes, value chain, company map, unit economics patterns,
  risks, and investment conclusions with a reproducible search log.
---

# Sector Scan (360°)

## When to use

Theme / industry landscapes. For a single listed name use `equity-research`;
for a single private deal use `ic-memo`. Start from `invest-research-protocol`.

## Chapter map

Mirror the proven 360° depth structure:

1. Definition, timing, market sizing
2. Technology routes and underlying logic
3. Value chain and profit pools
4. Company universe scan
5. Leaders and moats
6. Business model / unit-economics patterns
7. Team / org patterns (optional for pure public markets)
8. Strategic, policy, and geopolitical risks
9. Sector-specific digressions
10. Investment conclusion, valuation lenses, exit paths
11. Appendix: DD questions, timeline, glossary, sources

For a lighter scan, ship chapters 1–6 + 8 + 10 and state what was deferred.

## Reproducible search log

Before synthesis, write `/mnt/user-data/outputs/{sector}-search-log.md`:

```markdown
# Search log — {sector}
- Date: …
- Queries (exact strings):
- Filters (date / geography / language):
- Primary sources retained:
- Rejected / off-scope:
- Coverage gaps:
```

Do not invent papers or market sizes to fill gaps; record the gap.

## Workflow

1. Protocol card (decision often = "map opportunity set" or "pick watchlist").
2. Search log first; then parallel deep dives by chapter hypothesis.
3. Prefer primary industry data and filings over aggregated blog TAM figures.
4. Build a screening matrix (growth × profitability × valuation or strategic fit).
5. Devil's Advocate on the sector thesis; evidence-chain on the headline claim.
6. Save `/mnt/user-data/outputs/{sector}-sector-scan.md`, then archive to the
   sector Project shelf per `invest-research-protocol` Step 8 (dated shelf name).

## Output skeleton

```markdown
# {Sector} — Sector Scan

## 1. Definition and timing
## 2. Technology routes
## 3. Value chain and profit pools
## 4. Company map
## 5. Leaders and moats
## 6. Unit economics patterns
## 8. Risks
## 10. Investment takeaways
- What to own / avoid / watch
- Suggested next deep-dives
## Appendix
- Search log link
- Glossary
- Source list with as-of dates
```

## Quality bar

- Dual-method market sizing when citing TAM (top-down + bottom-up) or label as single-method.
- Company tables need stage, HQ, and one differentiating fact each.
- End with actionable watchlist, not only narrative.
