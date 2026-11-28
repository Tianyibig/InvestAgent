# Evidence type taxonomy

## official (weight 100)

Primary documents: audited filings, prospectuses, regulator notices, standards
bodies, or the issuing company/government itself. Name the document.

## data (weight 80)

Raw measurements, logs, or exports the reader could re-run. Prefer digests or
file paths when available inside the workspace.

## paper (weight 60)

Peer-reviewed literature or a dataset with an explicit academic method. A vague
"studies suggest" without a citation is **assertion**, not paper. Broker notes
are **sellside**, not paper.

## sellside (weight 40)

Sell-side / broker research, initiation notes, and model updates from a named
desk. Useful color, but outranked by filings, data, and academic work.

## internal (weight 0)

User notes, CRM snippets, undocumented internal KPIs. Useful context, but not
independently verifiable outside the conversation.

## assertion (weight 0)

Opinions, restated claims, analyst color without a note, or anything that
cannot be checked. Default when no `@type` marker is present.

## unknown tag (weight 0)

Any `@tag` that is not in the table above. Does **not** count as verified.

## Scoring

`score = round(mean(item weights))`. Official outranks data, which outranks
academic paper, which outranks sell-side. Thresholds: 50 draft / 80 publish.
The script never fetches URLs or checks factual truth.
