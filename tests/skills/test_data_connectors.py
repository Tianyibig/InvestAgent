"""Offline tests for the stock-quote data-connector layer."""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

import pytest

SCRIPTS = (
    Path(__file__).resolve().parents[2] / "skills/public/stock-quote/scripts"
)
EVIDENCE = (
    Path(__file__).resolve().parents[2]
    / "skills/public/evidence-chain/scripts/evidence_chain.py"
)


def _load(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


@pytest.fixture(scope="module")
def connectors():
    if str(SCRIPTS) not in sys.path:
        sys.path.insert(0, str(SCRIPTS))
    from connectors import akshare_provider, fundamentals, registry, schema, tencent

    return {
        "akshare": akshare_provider,
        "fundamentals": fundamentals,
        "registry": registry,
        "schema": schema,
        "tencent": tencent,
    }


def test_source_tier_table(connectors):
    schema = connectors["schema"]
    assert schema.source_tier("official") == 100
    assert schema.source_tier("data") == 80
    assert schema.source_tier("paper") == 60
    assert schema.source_tier("sellside") == 40
    assert schema.source_tier("unknown") == 0
    assert schema.source_tier("not-a-class") == 0


def test_source_tier_matches_evidence_chain(connectors):
    schema = connectors["schema"]
    evidence = _load("evidence_chain_for_tiers", EVIDENCE)
    for name in ("official", "data", "paper", "sellside", "unknown"):
        assert schema.source_tier(name) == evidence.WEIGHTS[name]


def test_default_falls_back_when_akshare_missing(connectors, monkeypatch):
    registry = connectors["registry"]
    monkeypatch.delenv(registry.ENV_QUOTE_PROVIDER, raising=False)
    monkeypatch.setattr(registry, "akshare_importable", lambda: False)
    provider, note = registry.resolve_provider()
    assert provider.name == "tencent_delayed"
    assert provider.source_class == "data"
    assert note is not None and "fell back" in note


def test_explicit_akshare_also_falls_back_when_missing(connectors, monkeypatch):
    registry = connectors["registry"]
    monkeypatch.setenv(registry.ENV_QUOTE_PROVIDER, "akshare")
    monkeypatch.setattr(registry, "akshare_importable", lambda: False)
    provider, note = registry.resolve_provider()
    assert provider.name == "tencent_delayed"
    assert note is not None


def test_tushare_stays_disabled(connectors, monkeypatch):
    registry = connectors["registry"]
    monkeypatch.setenv(registry.ENV_QUOTE_PROVIDER, "tushare")
    with pytest.raises(registry.ProviderUnavailable, match="disabled"):
        registry.resolve_provider()


def test_unknown_provider_rejected(connectors, monkeypatch):
    registry = connectors["registry"]
    monkeypatch.setenv(registry.ENV_QUOTE_PROVIDER, "bloomberg")
    with pytest.raises(registry.ProviderUnavailable, match="unknown"):
        registry.resolve_provider()


def test_tencent_provider_metadata_with_fake_opener(connectors):
    tencent = connectors["tencent"]
    # 23 separators after amount (index 7) place the trade date at index 30.
    body = (
        'v_sh600519="1~Kweichow Moutai~600519~1800.00~1790.00~1795.00~100~200'
        + ("~" * 23)
        + "20261128~150003~1.23~\";"
    ).encode("gbk")
    seen: list[str] = []

    def opener(url: str) -> bytes:
        seen.append(url)
        return body

    provider = tencent.TencentDelayedProvider(opener=opener)
    records = provider.get_quotes(["sh600519", "hk00700"])
    assert seen and seen[0].startswith("https://qt.gtimg.cn/q=")
    assert records[0].error is None
    assert records[0].ticker == "sh600519"
    assert records[0].market == "sh"
    assert records[0].code == "600519"
    assert records[0].last == "1800.00"
    assert records[0].source == "tencent_delayed"
    assert records[0].source_class == "data"
    assert records[0].source_tier == 80
    assert records[0].source_class != "official"
    assert records[0].delayed is True
    assert records[0].as_of == "2026-11-28T15:00:03+08:00"
    assert records[0].retrieved_at
    assert records[0].to_dict()["evidence_citation"].endswith(
        "@data:tencent_delayed"
    )
    missing = records[1]
    assert missing.ticker == "hk00700"
    assert missing.error == "not in quote response"
    assert missing.source_class == "data"
    assert missing.source_tier == 80
    assert missing.delayed is True


def test_tencent_request_failure_is_per_ticker(connectors):
    tencent = connectors["tencent"]
    import urllib.error

    def opener_url(_url: str) -> bytes:
        raise urllib.error.URLError("offline")

    records = tencent.TencentDelayedProvider(opener=opener_url).get_quotes(
        ["sh600519"]
    )
    assert len(records) == 1
    assert records[0].error
    assert records[0].source == "tencent_delayed"
    assert records[0].source_tier == 80
    assert records[0].to_dict()["evidence_citation"] == ""


def test_akshare_normalizes_without_network(connectors, monkeypatch):
    akshare = connectors["akshare"]
    calls: list[str] = []

    class FakeAk:
        def stock_bid_ask_em(self, symbol: str):
            calls.append(f"bid:{symbol}")
            if symbol == "000001":
                raise RuntimeError("vendor rejected sz000001")
            return [
                {"item": "最新", "value": 1800.5},
                {"item": "涨幅", "value": 1.25},
                {"item": "今开", "value": 1795},
                {"item": "昨收", "value": 1790},
                {"item": "总手", "value": 100},
                {"item": "金额", "value": 2000000000},
            ]

        def stock_hk_spot_em(self):
            calls.append("hk-board")
            return [
                {
                    "代码": "00700",
                    "名称": "腾讯控股",
                    "最新价": 380.2,
                    "涨跌幅": -0.4,
                    "今开": 382,
                    "昨收": 381.5,
                    "成交量": 1000,
                    "成交额": 5000,
                }
            ]

        def index_zh_spot_em(self):
            calls.append("index-board")
            return [
                {
                    "代码": "000001",
                    "名称": "上证指数",
                    "最新价": 3200,
                    "涨跌幅": 0.5,
                    "今开": 3190,
                    "昨收": 3184,
                    "成交量": 10,
                    "成交额": 20,
                }
            ]

    monkeypatch.setattr(akshare, "_import_akshare", lambda: FakeAk())
    payloads = akshare.fetch_akshare_spots(
        ["sh600519", "sz000001", "hk00700", "sh000001"]
    )
    assert calls == ["hk-board", "index-board", "bid:600519", "bid:000001"]
    assert payloads["sh600519"]["last"] == "1800.5"
    assert isinstance(payloads["sz000001"], RuntimeError)
    assert payloads["hk00700"]["name"] == "腾讯控股"
    assert payloads["sh000001"]["name"] == "上证指数"

    provider = akshare.AkshareQuoteProvider()
    monkeypatch.setattr(
        akshare,
        "fetch_akshare_spots",
        lambda tickers: payloads,
    )
    records = {row.ticker: row for row in provider.get_quotes(
        ["sh600519", "sz000001", "hk00700", "sh000001"]
    )}
    moutai = records["sh600519"]
    assert moutai.source == "akshare"
    assert moutai.source_class == "data"
    assert moutai.source_tier == 80
    assert moutai.delayed is False
    assert moutai.error is None
    assert moutai.market == "sh"
    assert "@data:akshare" in moutai.to_dict()["evidence_citation"]
    assert records["sz000001"].error
    assert records["sz000001"].source_class == "data"
    assert records["sz000001"].to_dict()["code"] == "000001"
    assert records["hk00700"].delayed is True
    assert records["hk00700"].source_tier == 80
    assert records["sh000001"].delayed is True
    assert "official" not in {
        records[key].source_class for key in records
    }


def test_import_akshare_missing_is_typed(connectors, monkeypatch):
    akshare = connectors["akshare"]
    real_import = __import__

    def fake_import(name, *args, **kwargs):
        if name == "akshare":
            raise ImportError("no module named akshare")
        return real_import(name, *args, **kwargs)

    monkeypatch.setattr("builtins.__import__", fake_import)
    with pytest.raises(akshare.ProviderUnavailable, match="not installed"):
        akshare._import_akshare()


def test_quote_module_does_not_import_akshare_at_load():
    before = "akshare" in sys.modules
    script = SCRIPTS / "quote.py"
    _load("stock_quote_lazy_guard", script)
    if not before:
        assert "akshare" not in sys.modules
    text = (SCRIPTS / "connectors/akshare_provider.py").read_text(encoding="utf-8")
    for line in text.splitlines():
        if "import akshare" in line:
            assert line.startswith((" ", "\t"))


def test_fundamentals_hook_is_unimplemented(connectors):
    hook = connectors["fundamentals"].unimplemented_fundamentals()
    assert hook.get_fundamentals("sh600519") is None
    assert hook.source_class == "unknown"
