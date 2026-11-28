---
name: deep-research
description: >
  Conduct deep, multi-track research on complex topics by spawning parallel
  subagents that independently search, verify primary sources, and synthesize
  cited reports. Use for broad surveys, multi-angle investigations, exhaustive
  comparisons, or when content generation needs current evidence. Do not use for
  simple factual lookups. Prefer this skill before equity-research, ic-memo, or
  sector-scan when the evidence base is still thin.
license: Apache-2.0
metadata:
  adapted_from: https://github.com/google-gemini/demolab/tree/main/skills/deep-research
  adapted_from_license: Apache-2.0
  version: "2.0.0"
---

# Deep Research

Act as a lead researcher: clarify only when needed, gather in parallel, keep
evidence primary, then synthesize a grounded report with unresolved gaps named.

This skill adapts Gemini DemoLab's parallel orchestration
([google-gemini/demolab](https://github.com/google-gemini/demolab), Apache-2.0)
to InvestAgent tools (`web_search`, `web_fetch`, task/subagents) and InvestAgent
publish gates.

## When to use

- Multi-angle investigations, surveys, or disputed claims
- Pre-research for presentations, notes, or frontend that need current facts
- Thin evidence base before `equity-research`, `ic-memo`, or `sector-scan`

**Skip** for single-fact lookups — answer directly or use at most one search.

## Workflow

### 1. Orient

Clarify scope only if genuinely ambiguous. If the topic is unfamiliar, run one
quick `web_search` to map the landscape.

Decompose into **non-overlapping** sub-questions:

| Depth | Sub-questions |
| --- | --- |
| Narrow / single-fact | 0–2 (often inline, no subagents) |
| Broad topic | 3–5 |
| Slow / high-thinking models | Cap at 2–3 |

For invest runs, align sub-questions with the protocol card decision and
falsifiers from `invest-research-protocol`.

### 2. Gather in parallel

When subagents are available (Ultra / `subagent_enabled`), spawn concurrent
research workers in **one turn**. If unavailable, run the tracks yourself with
the same budgets.

Each worker prompt must specify:

- Distinct angle, time frame, and source scope
- Budget: at most **8–12** `web_search` / tool steps
- Prefer primary sources over snippets; use `web_fetch` on key URLs
- Include exact quotes or raw figures for material numbers
- Return **partial verified findings + remaining gaps** when the budget hits —
  do not loop

Use the actual current date from context for time-sensitive queries (month+day
when the user means "today"; year alone is too coarse).

### 3. Keep evidence primary

| Prefer | Deprioritize |
| --- | --- |
| Filings, primary data, named studies | Search snippets alone |
| Full-page `web_fetch` of authoritative URLs | Dual citations of one quote |
| Dated figures with source | Undated "experts say" |

Two secondary notes quoting the same primary line count as **one** confirmation.
Grade invest claims with `evidence-chain` before publish (draft 50 / IC 80).

### 4. Resolve gaps without straggler stalls

Read findings as they arrive. If most workers finish and one stalls, cancel the
stalled worker and continue. Run **one** targeted follow-up pass only for
important gaps. Spawn a fresh verification worker only for high-stakes or
data-heavy reports.

Strip `Task Succeeded. Result: ` / `Task failed.` / `Task timed out.` prefixes
before parsing subagent payloads.

### 5. Synthesize

Write the report to `/mnt/user-data/outputs/` when available (or the project
docs folder). Keep chat to a short pointer plus key decisions.

Required shape:

1. **Top-line** — two sentences: what we know and what it implies
2. **Findings** — by sub-question, with inline citations (clickable URLs)
3. **Conflicts** — where sources disagree
4. **Unresolved** — missing data, failed fetches, budget cuts
5. **Sources** — dated list; mark primary vs secondary

Use clear, concrete language. Do not invent numbers. State remaining limits.

## Diversity check (before finishing)

Cover what the question needs among: facts/data, cases, expert views, trends,
comparisons, challenges. Omit irrelevant buckets; do not pad.

## Anti-patterns

- Fishing without a decision or research question
- Stopping on snippets without reading primary pages
- Waiting forever on one stalled subagent
- Presenting gaps as settled facts
- Skipping Unresolved when sources conflict

## Related skills

- Invest: `invest-research-protocol`, `equity-research`, `ic-memo`, `sector-scan`,
  `evidence-chain`
- Specialized: `github-deep-research`, `systematic-literature-review`,
  `consulting-analysis`
