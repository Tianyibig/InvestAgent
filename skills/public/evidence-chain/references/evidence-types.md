# Evidence type taxonomy

## official

Primary documents: audited filings, prospectuses, regulator notices, standards
bodies, or the issuing company/government itself. Name the document.

## paper

Peer-reviewed literature or a dataset with an explicit method. A vague
"studies suggest" without a citation is **assertion**, not paper.

## data

Raw measurements, logs, or exports the reader could re-run. Prefer digests or
file paths when available inside the workspace.

## internal

User notes, CRM snippets, undocumented internal KPIs. Useful context, but not
independently verifiable outside the conversation.

## assertion

Opinions, restated claims, analyst color without a note, or anything that
cannot be checked. Default when the type is unclear.

## Scoring

`score = round(100 * verifiable_count / total)`. Types are not weighted beyond
verifiable vs not. Thresholds are policy choices of the caller (50 draft / 80
publish in InvestAgent).
