---
name: evidence-chain
description: >
  Score whether a claim is carried by independently verifiable evidence. Use
  before publishing an equity note, IC memo, or sector scan, or when the user
  asks 有依据吗, 证据链, source check, back that up, or challenges a figure.
  Grades declared source types with weights (official outranks data, which
  outranks paper, which outranks sellside); unknown tags do not count as
  verified. Does not fetch URLs or judge whether the claim is true. Draft
  gate threshold 50; publish / IC gate 80 — encoded as process exit codes.
compatibility: Python 3.10+ standard library only; offline; no network.
---

# Evidence Chain

## Boundary

**This tool grades declared source types. It does not decide truth.**

- It only weights the `@type` you declare. It does **not** fetch URLs, open
  filings, or verify that a citation exists or that a figure is factually true.
- Score 100 ≠ true; it means the declared types are all `official`.
- Low score ≠ false; it means **not established** by the declared types.

Never upgrade "not established" into "false", or a high score into "verified".

## Types and weights

| type | Weight | Notes |
| --- | ---: | --- |
| `official` | 100 | filing, primary issuer / regulator document |
| `data` | 80 | re-runnable measurements or exports |
| `paper` | 60 | academic / peer-reviewed study (not sell-side) |
| `sellside` | 40 | broker / sell-side research note |
| `internal` | 0 | private notes — not independently verifiable |
| `assertion` | 0 | restated claim or unnamed "studies say" |
| unknown `@tag` | 0 | not verified; do not invent a type |

Score = rounded mean of item weights. Empty chain → 0.

`stock-quote` prints use this same scale. Cite a successful print as
`@data:akshare` or `@data:tencent_delayed` (tier 80). Do not tag scraped or
delayed quotes `@official`. The quote record's `source_tier` is checked
against this table in the stock-quote tests.

## Workflow

1. Separate **one claim** (one sentence). Multi-part claims → multiple runs.
2. Tag each evidence item honestly; unknown tag → weight 0. Sell-side notes use
   `@sellside:…`, not `@paper:…`.
3. Run the script:

```bash
python /mnt/skills/public/evidence-chain/scripts/evidence_chain.py \
  --claim "Device X failure rate is below 0.5%" \
  --evidences "2025 QA audit@official:QA dept" \
              "no complaints on record@internal:support" \
              "peer-reviewed cohort@paper:JAMA" \
  --threshold 50
```

Publish / IC (JSON):

```bash
python /mnt/skills/public/evidence-chain/scripts/evidence_chain.py \
  --from /mnt/user-data/outputs/claim.json \
  --threshold 80 \
  --json
```

4. Report score **and** the unverifiable list. Name what would replace each weak item.

## Process exit codes

The raw score is **never** used as the exit status. Gates are fixed:

| Exit | Meaning |
| ---: | --- |
| 0 | score ≥ 80 (publish / IC) |
| 1 | script or input error |
| 2 | 50 ≤ score < 80 (draft only) |
| 3 | score < 50 (below draft) |

`--threshold` only affects the report's `supported` flag; exit codes always use 50/80.

## InvestAgent gates

| Artifact | Threshold |
| --- | --- |
| Draft equity / sector note | 50 |
| External or IC publish | 80 |
| Single unsourced figure challenged in chat | run immediately; do not soften |

Attach the script output under the note's Evidence score section.

## Limits

Does not fetch URLs, detect fake citations, weigh study quality beyond the type
table, or resolve conflicts. Conflicting high-weight sources both score; surface
the conflict in prose.
