---
name: invest-research-protocol
description: >
  Master protocol for investment research runs. Use when the user starts equity
  analysis, IC due diligence, sector scans, valuation, or portfolio review, or
  says 分析, 尽调, 扫描, 复盘, 投研协议, research protocol, due diligence, or
  investment memo. Enforces decision-first scoping, hypothesis-driven evidence,
  source grading, Bull/Base/Bear cases, Devil's Advocate, and publish gates.
  Prefer this skill before specialized equity-research, ic-memo, or sector-scan
  skills so the run shares one quality bar.
---

# Investment Research Protocol

## Purpose

Turn every invest research run into an auditable decision artifact: define the
decision, gather graded evidence, stress-test scenarios, challenge the thesis,
then publish only when gates pass.

## Hard rules

1. **Decision first.** Before searching, write the decision type, deadline,
   falsifiable assumptions, and success criteria.
2. **Hypothesis over fishing.** Each major section carries one core hypothesis
   to prove or refute.
3. **Sources are graded.** Prefer filings and primary data over IR decks and
   news. Two sell-side notes quoting the same management line count as **one**
   confirmation.
4. **No silent invention.** Missing data is stated as missing. Fermi estimates
   must label assumptions.
5. **Publish gates.** Do not mark a memo/note complete without Devil's Advocate,
   Top risks, action guidance, and an evidence-chain score that meets the
   threshold.

## Step 0 — Protocol card

Write this card to `/mnt/user-data/outputs/research-protocol.md` (or the
project docs folder) before deep work:

```markdown
# Research protocol

- Decision: [buy/hold/pass | initiate coverage | IC vote | scan only]
- Subject: [ticker / company / sector / project]
- Deadline: [date]
- Success criteria: [what must be true to decide]
- Falsifiers: [assumptions that would flip the decision]
- Template: [equity-note | ic-memo | sector-scan | portfolio-review]
- Scope / excludes: [...]
- Locale: [zh_CN | en]
```

If the user already supplied these fields, mirror them; ask only for gaps that
materially change the plan.

## Step 1 — Choose template and mode

| Intent | Skill / template | Mode hint |
| --- | --- | --- |
| Quote / tape check | `stock-quote` | Flash / fast |
| Single-name equity view | `equity-research` | Pro+ |
| Private / growth DD | `ic-memo` | Ultra |
| Sector / theme map | `sector-scan` | Ultra |
| Portfolio / watchlist review | `portfolio-review` | Pro+ |
| Implied growth from price | `reverse-dcf` | Pro+ |
| Publish gate | `evidence-chain` | any |

Load the matching specialized skill after the protocol card exists.

## Step 2 — Baseline before narrative

Order of sources:

1. Filings / prospectus / audited financials
2. Earnings transcripts / expert interviews
3. Industry primary data
4. Broker research
5. News / IR decks (read IR **last**)

Build a known / unknown list. Do not start valuation until the business model
can be stated in one plain paragraph without marketing language.

## Step 3 — Hypothesis tree (Plan Mode)

When plan mode / todos are available, map todos to **section hypotheses**, not
busywork. Example for equity:

- pending: Growth hypothesis — NTM revenue drivers
- pending: Margin hypothesis — operating leverage path
- pending: Moat hypothesis — switching costs / pricing power
- pending: Valuation hypothesis — reverse-DCF implied CAGR vs history
- pending: Risk hypothesis — Top 5 quantified risks
- pending: Devil's Advocate complete
- pending: Evidence-chain gate ≥ threshold

Update todos at meaningful milestones only.

## Step 4 — Evidence discipline

For every material number in the final artifact:

- Source URL or document id
- As-of date
- Confidence: high (multi-source primary) / medium (broker or single primary) /
  low (news, rumor, estimate)

Run `evidence-chain` before calling the work publishable:

```bash
python /mnt/skills/public/evidence-chain/scripts/evidence_chain.py \
  --claim "..." \
  --evidences "..." \
  --threshold 50
```

Use `--threshold 80` and `--fail-below-threshold` for IC / external publish.

## Step 5 — Scenarios and reverse check

Always produce Bull / Base / Bear with explicit drivers. Prefer adding a
`reverse-dcf` implied-growth check so "expensive/cheap" becomes a verifiable
statement about market-implied CAGR.

## Step 6 — Devil's Advocate and actions

After the base case:

1. Write "If I am wrong, the most likely reason is…"
2. List Top 5 risks with probability × impact where possible
3. End with a clear action: buy / hold / pass / watch / need more data, plus
   next evidence to collect

## Step 7 — Persistence

- Append entity updates; do not overwrite prior theses
- Keep Raw inputs immutable; write synthesis to outputs / project docs
- Log forecast errors > 20% into a learning note when reviewing later

## Anti-patterns

- Fishing without a decision question
- Stacking frameworks without obtainable data
- Treating dual citations of one management quote as independent proof
- Reading the IR deck before filings
- Publishing without Devil's Advocate or evidence score

## Related skills

- `equity-research`, `ic-memo`, `sector-scan`
- `reverse-dcf`, `stock-quote`, `evidence-chain`
- `deep-research`, `consulting-analysis`, `chart-visualization`
