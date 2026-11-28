# Invest research (InvestAgent)

InvestAgent layers buy-side research skills on the DeerFlow harness. Use this
guide after [Skills & Tools](skills-and-tools.md) and
[Scheduled Tasks](scheduled-tasks.md).

## Composer entry points

Empty-state chips map to public skills:

| Chip (zh / en) | Skill | Typical mode |
| --- | --- | --- |
| 分析 / Analyze | `equity-research` + `invest-research-protocol` | 研判 / Diligence |
| 尽调 / Diligence | `ic-memo` | 尽调 / Collab DD |
| 扫描 / Scan | `sector-scan` | Collab DD |
| 复盘 / Review | `portfolio-review` | Diligence |

Modes are labeled for research work: **速答 / 研判 / 尽调 / 协作尽调** (Quick /
Analyze / Diligence / Collab DD). Flash remains the right place for
`stock-quote` tape checks only.

## Protocol and publish gates

1. Load `invest-research-protocol` and write the protocol card (decision,
   falsifiers, template, locale).
2. Prefer `deep-research` with parallel subagents when the evidence base is
   thin or multi-angle.
3. Draft with the matching template skill.
4. Gate material claims with `evidence-chain` — draft threshold **50**, publish /
   IC threshold **80**.
5. Save notes under `/mnt/user-data/outputs/`. Keep Raw uploads immutable;
   append entity updates instead of overwriting theses.
6. **Archive** the presented note onto the Project document shelf (see below).

## Conclusion bar

Equity notes and IC memos should include a fenced `conclusion` (or `~~~conclusion`)
block near the top with `rating`, `target_price`, `risk`, `as_of`, and optional
`evidence_score`. The artifact markdown preview pins those fields in a fixed
strip above the scrolling body. Bullet fields under the H1 still work as a
fallback for older notes.

## Analyze → Note → Archive

Projects are the ticker / company / sector container
([Projects](projects.md)). The shelf is user-curated: agents write outputs, then
you promote them.

1. Create a Project named `{Ticker} {Company}` (or a sector/watchlist book).
2. Start the chat **in that Project** (or Move to project).
3. Run 分析 / 尽调 / 扫描 / 复盘 until publish gates pass and the note is under
   `/mnt/user-data/outputs/`.
4. On the artifact card, click **保存到项目 / Save to project** (also available
   under Project → Documents → conversation files). Prefer a dated shelf name
   such as `{ticker}-equity-note-2026-11-27.md` so theses append.
5. Later runs in the same Project can `list_project_documents` /
   `read_project_document` the shelf. Archive the Project when the dossier is
   frozen.

## Portfolio daily review

Scheduled Tasks → **Quick create** → **持仓日更 / Portfolio daily review**.

- Default cron: `30 18 * * 1-5` (weekday 18:30 in the browser timezone — after
  CN A-share close).
- Replace `{{holdings}}` with ticker / weight / thesis rows, or leave empty so
  the run reuses the last `portfolio-review-*.md`.
- Each run should write `portfolio-review-{date}.md` and summarize at most five
  action items in chat.
- Enable IM notifications in Settings if you want Feishu / WeCom delivery of
  the run outcome ([scheduled tasks](scheduled-tasks.md)).

## Related skills

`invest-research-protocol`, `equity-research`, `ic-memo`, `sector-scan`,
`portfolio-review`, `reverse-dcf`, `evidence-chain`, `stock-quote`,
`deep-research`.

DemoLab craft fused into `deep-research` and `frontend-design` is attributed in
each skill's `ORIGIN.md` (Apache-2.0).
