#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Grade how well a claim is carried by declared evidence source types.

Does not decide whether a claim is true. Does not fetch URLs or verify facts.
Stdlib only; offline; writes nothing unless the caller redirects stdout.

Exit codes (InvestAgent publish gates — never the raw score):
  0 — score >= 80 (publish / IC gate)
  1 — script or input error
  2 — 50 <= score < 80 (draft gate only)
  3 — score < 50 (below draft)
"""

from __future__ import annotations

import argparse
import json
import re
import sys

# Declared source types and their weights (0–100). Higher outranks lower.
# Unknown tags are recorded as ``unknown`` with weight 0 (not verified).
WEIGHTS: dict[str, int] = {
    "official": 100,  # filings / primary issuer docs
    "data": 80,  # re-runnable measurements or exports
    "paper": 60,  # academic / peer-reviewed study
    "sellside": 40,  # sell-side research notes
    "internal": 0,
    "assertion": 0,
    "unknown": 0,
}
KNOWN_TYPES = frozenset(WEIGHTS) - {"unknown"}
VERIFIABLE = frozenset(
    name for name, weight in WEIGHTS.items() if weight > 0
)
LABEL = {
    "official": "official",
    "data": "data",
    "paper": "paper (academic)",
    "sellside": "sell-side research",
    "internal": "internal (not independently verifiable)",
    "assertion": "assertion (not independently verifiable)",
    "unknown": "unknown tag (not verified)",
}
MARKER = re.compile(r"@(\w+)(?::(.*))?$", re.S)

DRAFT_THRESHOLD = 50
PUBLISH_THRESHOLD = 80


def parse_evidence(raw: str) -> dict[str, str | int]:
    """Split ``text@type:source`` into parts.

    Missing marker ⇒ assertion. Unknown ``@tag`` ⇒ type ``unknown`` (weight 0).
    """
    text, src_type, source = raw.strip(), "assertion", ""
    match = MARKER.search(text)
    if match:
        tag = match.group(1).lower()
        source = (match.group(2) or "").strip()
        text = text[: match.start()].strip()
        src_type = tag if tag in KNOWN_TYPES else "unknown"
    return {
        "text": text,
        "type": src_type,
        "source": source,
        "weight": WEIGHTS[src_type],
    }


def collect(evidences: list[str]) -> list[dict[str, str | int]]:
    out: list[dict[str, str | int]] = []
    for item in evidences:
        for piece in str(item).split("||"):
            if piece.strip():
                out.append(parse_evidence(piece))
    return out


def score_chain(
    evidence: list[dict[str, str | int]],
) -> tuple[int, int, list[str]]:
    """Return ``(score, verifiable_count, weak_types)``.

    Score is the rounded mean of per-item source-type weights. Empty chain → 0.
    """
    if not evidence:
        return 0, 0, []
    weights = [int(item["weight"]) for item in evidence]
    pct = round(sum(weights) / len(weights))
    strong_n = sum(1 for item in evidence if item["type"] in VERIFIABLE)
    weak = sorted(
        {
            str(item["type"])
            for item in evidence
            if item["type"] not in VERIFIABLE
        }
    )
    return pct, strong_n, weak


def gate_exit_code(score: int) -> int:
    """Map score to process exit code for the 50 / 80 gates."""
    if score >= PUBLISH_THRESHOLD:
        return 0
    if score >= DRAFT_THRESHOLD:
        return 2
    return 3


def render(
    claim: str,
    evidence: list[dict[str, str | int]],
    pct: int,
    strong_n: int,
    weak: list[str],
    threshold: int,
    source_note: str,
) -> str:
    total = len(evidence)
    lines = ["# Evidence chain", ""]
    if source_note:
        lines += [f"> Subject: {source_note}", ""]
    lines += ["## Claim", "", claim, "", "## Evidence score", ""]
    if not total:
        lines += [
            "**No evidence was supplied.** Nothing here is established. "
            "Supply at least one official, data, paper, or sellside source "
            "before drawing a conclusion.",
            "",
        ]
    else:
        lines += [
            f"**{pct}/100** — weighted mean of declared source-type weights "
            f"({strong_n} of {total} items have a verifiable type; "
            f"caller threshold {threshold}).",
            "",
            "Weights: official=100, data=80, paper=60, sellside=40; "
            "internal / assertion / unknown = 0. This script does not fetch "
            "URLs or verify factual truth.",
            "",
        ]

    if evidence:
        lines += ["## Evidence", ""]
        for index, item in enumerate(evidence, 1):
            origin = item["source"] or "no source stated"
            kind = LABEL.get(str(item["type"]), str(item["type"]))
            lines.append(f"{index}. [{kind}] {item['text']}")
            lines.append(f"   - source: {origin}")
            lines.append(f"   - weight: {item['weight']}")
        lines.append("")

    lines += ["## Verdict", ""]
    if not total:
        lines.append(
            "**Do not treat this claim as a conclusion.** There is no "
            "evidence chain to stand on."
        )
    elif pct >= threshold:
        lines.append(
            f"**Weighted score {pct}/100** meets the caller threshold of "
            f"{threshold}. The claim is **supported to that threshold** by "
            f"declared source types only; original sources still need a "
            f"human check before anyone relies on it."
        )
    else:
        lean = f", and it leans on: {', '.join(weak)}." if weak else "."
        lines.append(
            f"**Do not treat this claim as a conclusion.** Weighted score "
            f"{pct}/100 is below threshold {threshold}{lean}"
        )
        lines.append(
            "Replace weak items with higher-weight official, data, or "
            "academic paper sources, then re-run."
        )
    return "\n".join(lines)


def _load_from_file(path: str) -> tuple[str, list[str]]:
    try:
        with open(path, encoding="utf-8") as handle:
            payload = json.load(handle)
    except (OSError, ValueError) as exc:
        print(f"[!] cannot read {path}: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc
    claim = str(payload.get("claim", ""))
    raw: list[str] = []
    for item in payload.get("evidences", []) or []:
        if isinstance(item, str):
            raw.append(item)
            continue
        src_type = str(item.get("type", "assertion")).lower()
        if src_type not in KNOWN_TYPES:
            src_type = "unknown" if item.get("type") else "assertion"
        source = str(item.get("source", "") or "")
        text = item.get("text", "")
        raw.append(
            f"{text}@{src_type}:{source}" if source else f"{text}@{src_type}"
        )
    return claim, raw


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Grade a claim by declared evidence source-type weights. "
            "Does not fetch URLs or judge factual truth."
        )
    )
    parser.add_argument("--claim", help="the claim to test")
    parser.add_argument(
        "--evidences",
        nargs="+",
        help="evidence items; one per argument or separated by '||'; "
        "optionally suffixed '@type:source'",
    )
    parser.add_argument(
        "--from",
        dest="from_file",
        help="JSON file: {claim, evidences:[{text, source, type}]}",
    )
    parser.add_argument(
        "--threshold",
        type=int,
        default=DRAFT_THRESHOLD,
        help="score needed to count as supported in the report "
        f"(default {DRAFT_THRESHOLD}; process exit still uses "
        f"{DRAFT_THRESHOLD}/{PUBLISH_THRESHOLD} gates)",
    )
    parser.add_argument(
        "--subject", default="", help="what the claim is about, for the header"
    )
    parser.add_argument("--json", action="store_true", help="machine-readable output")
    args = parser.parse_args(argv)

    if args.from_file:
        claim, evidences = _load_from_file(args.from_file)
    elif args.claim is not None:
        claim = args.claim
        evidences = args.evidences or []
    else:
        parser.print_usage(sys.stderr)
        print("[!] supply --claim or --from", file=sys.stderr)
        return 1

    if not claim.strip():
        print("[!] claim is empty", file=sys.stderr)
        return 1

    evidence = collect(evidences)
    pct, strong_n, weak = score_chain(evidence)
    supported = bool(evidence) and pct >= args.threshold

    if args.json:
        print(
            json.dumps(
                {
                    "claim": claim,
                    "score": pct,
                    "threshold": args.threshold,
                    "supported": supported,
                    "evidence_count": len(evidence),
                    "verifiable_count": strong_n,
                    "unverifiable_types": weak,
                    "weights": WEIGHTS,
                    "evidence": evidence,
                    "exit_gates": {
                        "publish": PUBLISH_THRESHOLD,
                        "draft": DRAFT_THRESHOLD,
                    },
                },
                ensure_ascii=False,
                indent=2,
            )
        )
    else:
        print(
            render(
                claim,
                evidence,
                pct,
                strong_n,
                weak,
                args.threshold,
                args.subject,
            )
        )

    return gate_exit_code(pct)


if __name__ == "__main__":
    sys.exit(main())
