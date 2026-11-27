#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Grade how well a claim is carried by evidence.

Does not decide whether a claim is true. Stdlib only; offline; writes nothing
unless the caller redirects stdout.

Exit codes:
  0 — chain scored (any verdict), unless --fail-below-threshold trips
  1 — not supported when --fail-below-threshold is set
  2 — usage or input error
"""

from __future__ import annotations

import argparse
import json
import re
import sys

TYPES = ("official", "paper", "data", "internal", "assertion")
VERIFIABLE = {
    "official": True,
    "paper": True,
    "data": True,
    "internal": False,
    "assertion": False,
}
LABEL = {
    "official": "official",
    "paper": "paper",
    "data": "data",
    "internal": "internal (not independently verifiable)",
    "assertion": "assertion (not independently verifiable)",
}
MARKER = re.compile(r"@(\w+)(?::(.*))?$", re.S)


def parse_evidence(raw: str) -> dict[str, str]:
    """Split ``text@type:source`` into parts. Missing marker ⇒ assertion."""
    text, src_type, source = raw.strip(), "assertion", ""
    match = MARKER.search(text)
    if match and match.group(1).lower() in TYPES:
        src_type = match.group(1).lower()
        source = (match.group(2) or "").strip()
        text = text[: match.start()].strip()
    return {"text": text, "type": src_type, "source": source}


def collect(evidences: list[str]) -> list[dict[str, str]]:
    out: list[dict[str, str]] = []
    for item in evidences:
        for piece in str(item).split("||"):
            if piece.strip():
                out.append(parse_evidence(piece))
    return out


def score_chain(
    evidence: list[dict[str, str]],
) -> tuple[int, int, list[str]]:
    """Return ``(score, verifiable_count, unverifiable_types)``."""
    if not evidence:
        return 0, 0, []
    strong = [item for item in evidence if VERIFIABLE.get(item["type"])]
    pct = round(100 * len(strong) / len(evidence))
    weak = sorted(
        {item["type"] for item in evidence if not VERIFIABLE.get(item["type"])}
    )
    return pct, len(strong), weak


def render(
    claim: str,
    evidence: list[dict[str, str]],
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
            "Supply at least one official, paper or data source before "
            "drawing a conclusion.",
            "",
        ]
    else:
        lines += [
            f"**{pct}/100** — {strong_n} of {total} items can be "
            f"independently verified (threshold {threshold}).",
            "",
        ]

    if evidence:
        lines += ["## Evidence", ""]
        for index, item in enumerate(evidence, 1):
            origin = item["source"] or "no source stated"
            lines.append(
                f"{index}. [{LABEL.get(item['type'], item['type'])}] "
                f"{item['text']}"
            )
            lines.append(f"   - source: {origin}")
        lines.append("")

    lines += ["## Verdict", ""]
    if not total:
        lines.append(
            "**Do not treat this claim as a conclusion.** There is no "
            "evidence chain to stand on."
        )
    elif pct >= threshold:
        lines.append(
            f"**{pct}/100 of the evidence can be independently verified**, "
            f"which meets the threshold of {threshold}. The claim is "
            f"**supported to that threshold**, and the original sources "
            f"still need a human check before anyone relies on it."
        )
    else:
        lean = f", and it leans on: {', '.join(weak)}." if weak else "."
        lines.append(
            f"**Do not treat this claim as a conclusion.** Only {pct}/100 "
            f"of the evidence can be independently verified{lean}"
        )
        lines.append(
            "Replace the unverifiable items with official, paper or data "
            "sources, then re-run."
        )
    return "\n".join(lines)


def _load_from_file(path: str) -> tuple[str, list[str]]:
    try:
        with open(path, encoding="utf-8") as handle:
            payload = json.load(handle)
    except (OSError, ValueError) as exc:
        print(f"[!] cannot read {path}: {exc}", file=sys.stderr)
        raise SystemExit(2) from exc
    claim = str(payload.get("claim", ""))
    raw: list[str] = []
    for item in payload.get("evidences", []) or []:
        if isinstance(item, str):
            raw.append(item)
            continue
        src_type = str(item.get("type", "assertion")).lower()
        src_type = src_type if src_type in TYPES else "assertion"
        source = str(item.get("source", "") or "")
        text = item.get("text", "")
        raw.append(f"{text}@{src_type}:{source}" if source else f"{text}@{src_type}")
    return claim, raw


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Grade a claim's evidence chain. Does not judge truth."
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
        default=50,
        help="score needed to count as supported (default 50)",
    )
    parser.add_argument(
        "--subject", default="", help="what the claim is about, for the header"
    )
    parser.add_argument(
        "--fail-below-threshold",
        action="store_true",
        help="exit 1 instead of 0 when the claim is not supported",
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
        return 2

    if not claim.strip():
        print("[!] claim is empty", file=sys.stderr)
        return 2

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
                    "evidence": evidence,
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

    if args.fail_below_threshold and not supported:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
