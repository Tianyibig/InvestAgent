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
    assert item["weight"] == 100


def test_parse_evidence_defaults_to_assertion(ec):
    item = ec.parse_evidence("someone said so")
    assert item["type"] == "assertion"
    assert item["source"] == ""
    assert item["weight"] == 0


def test_parse_unknown_tag_not_verified(ec):
    item = ec.parse_evidence("blurry cite@rumor:Twitter")
    assert item["type"] == "unknown"
    assert item["weight"] == 0
    assert item["source"] == "Twitter"


def test_score_weights_official_over_data_over_paper_over_sellside(ec):
    assert ec.WEIGHTS["official"] > ec.WEIGHTS["data"] > ec.WEIGHTS["paper"]
    assert ec.WEIGHTS["paper"] > ec.WEIGHTS["sellside"] > 0


def test_score_mixed_chain(ec):
    # official=100, internal=0, paper=60 → mean 53
    evidence = ec.collect(
        [
            "2025 QA audit@official:QA",
            "no complaints@internal:support",
            "cohort study@paper:JAMA",
        ]
    )
    pct, strong_n, weak = ec.score_chain(evidence)
    assert pct == 53
    assert strong_n == 2
    assert weak == ["internal"]


def test_empty_chain_score(ec):
    assert ec.score_chain([]) == (0, 0, [])


def test_sellside_not_fully_verified(ec, capsys):
    """Sell-side tagged as paper must not score 100; use sellside weight."""
    code = ec.main(
        [
            "--claim",
            "Revenue grew 30%",
            "--evidences",
            "10-K growth table@official:SEC",
            "sell-side note@sellside:Broker",
            "--threshold",
            "50",
            "--json",
        ]
    )
    # mean(100, 40) = 70 → draft gate exit 2, not publish 0
    assert code == 2
    out = json.loads(capsys.readouterr().out)
    assert out["supported"] is True
    assert out["score"] == 70
    assert out["score"] < 100
    types = {item["type"] for item in out["evidence"]}
    assert "sellside" in types


def test_misstagged_paper_broker_still_not_100(ec, capsys):
    """Even if someone wrongly uses @paper for a broker note, mean ≠ 100."""
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
    out = json.loads(capsys.readouterr().out)
    # mean(100, 60) = 80 → publish exit 0, but not a perfect 100 chain
    assert out["score"] == 80
    assert out["score"] < 100
    assert code == 0


def test_cli_json_draft_and_publish_exits(ec, capsys, tmp_path):
    payload = {
        "claim": "Failure rate below 0.5%",
        "evidences": [
            {"text": "QA audit", "type": "official", "source": "QA"},
            {"text": "gut feel", "type": "assertion", "source": ""},
        ],
    }
    path = tmp_path / "claim.json"
    path.write_text(json.dumps(payload), encoding="utf-8")

    code = ec.main(["--from", str(path), "--threshold", "80", "--json"])
    # mean(100, 0) = 50 → draft exit 2
    assert code == 2
    out = json.loads(capsys.readouterr().out)
    assert out["supported"] is False
    assert out["score"] == 50


def test_cli_publish_exit_zero(ec, capsys):
    code = ec.main(
        [
            "--claim",
            "Cash is positive",
            "--evidences",
            "10-K cash@official:SEC",
            "bank export@data:ledger.csv",
            "--json",
        ]
    )
    # mean(100, 80) = 90
    assert code == 0
    assert json.loads(capsys.readouterr().out)["score"] == 90


def test_cli_below_draft_exit_three(ec, capsys):
    code = ec.main(
        [
            "--claim",
            "Heard it somewhere",
            "--evidences",
            "friend said so@assertion:",
            "broker color@sellside:Desk",
            "--json",
        ]
    )
    # mean(0, 40) = 20
    assert code == 3
    assert json.loads(capsys.readouterr().out)["score"] == 20


def test_cli_requires_claim(ec, capsys):
    code = ec.main([])
    assert code == 1
    assert "supply --claim or --from" in capsys.readouterr().err


def test_gate_exit_code_helper(ec):
    assert ec.gate_exit_code(100) == 0
    assert ec.gate_exit_code(80) == 0
    assert ec.gate_exit_code(79) == 2
    assert ec.gate_exit_code(50) == 2
    assert ec.gate_exit_code(49) == 3
    assert ec.gate_exit_code(0) == 3
