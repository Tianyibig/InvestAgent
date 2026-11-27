"""Offline tests for the evidence-chain skill script."""

from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

import pytest

SCRIPT = (
    Path(__file__).resolve().parents[2]
    / "skills/public/evidence-chain/scripts/evidence_chain.py"
)


def load_module():
    spec = importlib.util.spec_from_file_location("evidence_chain_script", SCRIPT)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


@pytest.fixture(scope="module")
def ec():
    return load_module()


def test_parse_evidence_marker(ec):
    item = ec.parse_evidence("2025 QA audit@official:QA dept")
    assert item["type"] == "official"
    assert item["source"] == "QA dept"
    assert item["text"] == "2025 QA audit"


def test_parse_evidence_defaults_to_assertion(ec):
    item = ec.parse_evidence("someone said so")
    assert item["type"] == "assertion"
    assert item["source"] == ""


def test_score_mixed_chain(ec):
    evidence = ec.collect(
        [
            "2025 QA audit@official:QA",
            "no complaints@internal:support",
            "cohort study@paper:JAMA",
        ]
    )
    pct, strong_n, weak = ec.score_chain(evidence)
    assert pct == 67
    assert strong_n == 2
    assert weak == ["internal"]


def test_empty_chain_score(ec):
    assert ec.score_chain([]) == (0, 0, [])


def test_cli_json_and_gate(ec, capsys, tmp_path):
    payload = {
        "claim": "Failure rate below 0.5%",
        "evidences": [
            {"text": "QA audit", "type": "official", "source": "QA"},
            {"text": "gut feel", "type": "assertion", "source": ""},
        ],
    }
    path = tmp_path / "claim.json"
    path.write_text(json.dumps(payload), encoding="utf-8")

    code = ec.main(
        [
            "--from",
            str(path),
            "--threshold",
            "80",
            "--fail-below-threshold",
            "--json",
        ]
    )
    assert code == 1
    out = json.loads(capsys.readouterr().out)
    assert out["supported"] is False
    assert out["score"] == 50


def test_cli_supported_draft_threshold(ec, capsys):
    code = ec.main(
        [
            "--claim",
            "Revenue grew 30%",
            "--evidences",
            "10-K growth table@official:SEC",
            "sell-side note@paper:Broker",
            "--threshold",
            "50",
            "--json",
        ]
    )
    assert code == 0
    out = json.loads(capsys.readouterr().out)
    assert out["supported"] is True
    assert out["score"] == 100


def test_cli_requires_claim(ec, capsys):
    code = ec.main([])
    assert code == 2
    assert "supply --claim or --from" in capsys.readouterr().err
