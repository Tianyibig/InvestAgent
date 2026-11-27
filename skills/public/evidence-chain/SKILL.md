---
name: evidence-chain
description: >
  Score whether a claim is carried by independently verifiable evidence. Use
  before publishing an equity note, IC memo, or sector scan, or when the user
  asks 有依据吗, 证据链, source check, back that up, or challenges a figure.
  Grades evidence types (official / paper / data / internal / assertion); does
  not judge whether the claim is true. Draft gate threshold 50; publish / IC
  gate 80.
compatibility: Python 3.10+ standard library only; offline; no network.
---

# Evidence Chain

## Boundary

**This tool grades evidence. It does not decide truth.**

- Score 100 ≠ true; it means every item is the kind of thing that could be checked.
- Low score ≠ false; it means **not established**.

Never upgrade "not established" into "false", or a high score into "verified".

## Types

| type | Independently verifiable? |
| --- | --- |
| `official` | yes — filing, primary issuer document |
| `paper` | yes — named study / method |
| `data` | yes — re-runnable measurements or exports |
| `internal` | no — private notes |
| `assertion` | no — restated claim or unnamed "studies say" |

## Workflow

1. Separate **one claim** (one sentence). Multi-part claims → multiple runs.
2. Tag each evidence item honestly; unknown → `assertion`.
3. Run the script:

```bash
python /mnt/skills/public/evidence-chain/scripts/evidence_chain.py \
  --claim "Device X failure rate is below 0.5%" \
  --evidences "2025 QA audit@official:QA dept" \
              "no complaints on record@internal:support" \
              "peer-reviewed cohort@paper:JAMA" \
  --threshold 50
```

Publish / IC:

```bash
python /mnt/skills/public/evidence-chain/scripts/evidence_chain.py \
  --from /mnt/user-data/outputs/claim.json \
  --threshold 80 \
  --fail-below-threshold \
  --json
```

4. Report score **and** the unverifiable list. Name what would replace each weak item.

## InvestAgent gates

| Artifact | Threshold |
| --- | --- |
| Draft equity / sector note | 50 |
| External or IC publish | 80 |
| Single unsourced figure challenged in chat | run immediately; do not soften |

Attach the script output under the note's Evidence score section.

## Limits

Does not fetch URLs, detect fake citations, weigh study quality, or resolve
conflicts. Conflicting verifiable sources both score; surface the conflict in
prose.
