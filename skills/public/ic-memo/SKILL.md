---
name: ic-memo
description: >
  Draft an investment-committee memo for private, pre-IPO, or growth-company due
  diligence. Trigger on 尽调, IC memo, investment memo, 投委会, DD package, or
  when the user asks whether to invest in a private project. Covers market,
  product, competition, unit economics, team, valuation/terms, risks, and a
  clear invest / pass / watch recommendation with evidence gates.
---

# Investment Committee Memo

## When to use

Private / growth diligence and IC packs. For listed equities use
`equity-research`. Start from `invest-research-protocol` when no protocol card
exists.

## Diligence dimensions (hypothesis per section)

| Section | Core question |
| --- | --- |
| Market | Is TAM/SAM/SOM credible top-down **and** bottom-up? |
| Product / tech | Differentiated and at a stated TRL / maturity? |
| Competition | Moat scored with evidence, not slogans? |
| Unit economics | LTV/CAC, payback, contribution margin path? |
| Team | Founder-market fit and governance risks? |
| Valuation / terms | Return in bull/base/bear; key protective terms? |
| Risks | Top 5 quantified with mitigants? |

Use the structured DD question bank in `references/dd-questions.md` when
interviewing or scanning materials.

## Workflow

1. Protocol card: decision = invest / pass / watch; falsifiers listed.
2. Ingest raw materials into uploads; treat them as immutable Raw.
3. Fill the memo template; mark gaps with `[gap]` rather than inventing.
4. Build Bull / Base / Bear MOIC or IRR ranges.
5. Devil's Advocate + evidence-chain on the invest thesis (threshold 80 for IC).
6. Write `/mnt/user-data/outputs/{project}-ic-memo.md`, then archive to the
   deal Project shelf per `invest-research-protocol` Step 8 (dated shelf name).

## Output template

```markdown
# IC Memo — {Company}

- Recommendation: Invest | Pass | Watch
- Round / instrument: …
- As of: YYYY-MM-DD
- Owner: …

~~~conclusion
rating: Invest
risk: High
as_of: YYYY-MM-DD
evidence_score: 80
evidence_threshold: 80
subject: {Company}
~~~

## 1. Executive Summary
One paragraph: what they do, why now, core risk.

## 2. Market opportunity
TAM/SAM/SOM with dual methods; lifecycle; policy window.

## 3. Product and technology
Architecture, differentiation, roadmap, TRL notes.

## 4. Business model
Revenue model, customers, unit economics (LTV/CAC, payback).

## 5. Competition and moat
Matrix + scored moat components with evidence.

## 6. Financials
History, forecast drivers, sensitivity table.

## 7. Valuation and terms
Method(s), comps, DCF/reverse checks, key terms, return distribution.

## 8. Team and governance
Fit, retention, cap table / control risks.

## 9. Risks and mitigants
Top 5 only; probability × impact where possible.

## 10. Devil's Advocate
Most likely way this memo is wrong.

## 11. Recommendation and next actions
Invest / Pass / Watch — conditions precedent and follow-ups.
Evidence-chain score: …
```

## Quality bar

- No Invest recommendation without unit-economics view or an explicit gap note.
- Customer concentration and regulatory risks must appear when relevant.
- Expert-interview plans belong in appendix when primary data is thin.
