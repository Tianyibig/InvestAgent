"""Offline tests for the stock-quote skill script."""

from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path
from urllib.parse import unquote

import pytest

SCRIPT = (
    Path(__file__).resolve().parents[2]
    / "skills/public/stock-quote/scripts/quote.py"
)


def load_module():
    spec = importlib.util.spec_from_file_location("stock_quote_script", SCRIPT)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


@pytest.fixture(scope="module")
def quote():
    return load_module()


# 25 tildes after amount put change_% at Tencent field index 32.
SAMPLE = (
    'v_sh600519="1~Kweichow Moutai~600519~1800.00~1790.00~1795.00~100~2000000000'
    + ("~" * 25)
    + '1.23~;"'
).encode("gbk")


def test_normalize_codes(quote):
    assert quote.normalize_codes("SH600519, hk00700") == ["sh600519", "hk00700"]


def test_normalize_codes_rejects_empty(quote):
    with pytest.raises(ValueError, match="no codes"):
        quote.normalize_codes(" , ")


def test_normalize_codes_cap(quote):
    codes = ",".join(f"sh{i:06d}" for i in range(21))
    with pytest.raises(ValueError, match="at most"):
        quote.normalize_codes(codes)


def test_normalize_codes_rejects_illegal(quote):
    with pytest.raises(ValueError, match="illegal code"):
        quote.normalize_codes("sh60051")  # only 5 digits after sh
    with pytest.raises(ValueError, match="illegal code"):
        quote.normalize_codes("hk700")  # only 3 digits after hk
    with pytest.raises(ValueError, match="illegal code"):
        quote.normalize_codes("zz600519")


def test_normalize_codes_rejects_us_tickers(quote):
    with pytest.raises(ValueError, match="US ticker rejected"):
        quote.normalize_codes("AAPL")
    with pytest.raises(ValueError, match="US ticker rejected"):
        quote.normalize_codes("usAAPL")
    with pytest.raises(ValueError, match="US ticker rejected"):
        quote.normalize_codes("nasdaq:MSFT")


def test_normalize_does_not_silently_drop(quote):
    with pytest.raises(ValueError, match="illegal code"):
        quote.normalize_codes("sh600519,badticker,hk00700")


def test_build_url_encodes_and_keeps_host(quote):
    url = quote.build_url(["sh600519", "hk00700"])
    assert url.startswith("https://qt.gtimg.cn/q=")
    assert "qt.gtimg.cn" in url
    # Path query segment is encoded; comma stays as safe separator.
    encoded_part = url.split("/q=", 1)[1]
    assert unquote(encoded_part) == "sh600519,hk00700"
    assert quote.QUOTE_HOST == "qt.gtimg.cn"


def test_parse_body(quote):
    rows = quote.parse_body(SAMPLE)
    assert len(rows) == 1
    assert rows[0]["name"] == "Kweichow Moutai"
    assert rows[0]["last"] == "1800.00"
    assert rows[0]["change_pct"] == "1.23"


def test_main_json_with_fake_opener(quote, capsys):
    seen: list[str] = []

    def opener(url: str) -> bytes:
        seen.append(url)
        return SAMPLE

    code = quote.main(["--codes", "sh600519", "--json"], opener=opener)
    assert code == 0
    payload = json.loads(capsys.readouterr().out)
    assert payload["quotes"][0]["code"] == "600519"
    assert "Unofficial Tencent" in payload["disclaimer"]
    assert payload["source"] == "qt.gtimg.cn"
    assert seen and seen[0].startswith("https://qt.gtimg.cn/q=")


def test_main_table_with_fake_opener(quote, capsys):
    def opener(_url: str) -> bytes:
        return SAMPLE

    code = quote.main(["--codes", "sh600519"], opener=opener)
    assert code == 0
    out = capsys.readouterr().out
    assert "Kweichow Moutai" in out
    assert "1800.00" in out
    assert "Unofficial Tencent" in out


def test_main_rejects_us_via_cli(quote, capsys):
    code = quote.main(["--codes", "AAPL"])
    assert code == 2
    err = capsys.readouterr().err
    assert "US ticker rejected" in err


def test_main_rejects_over_cap(quote, capsys):
    codes = ",".join(f"sh{i:06d}" for i in range(21))
    code = quote.main(["--codes", codes])
    assert code == 2
    assert "at most" in capsys.readouterr().err


def test_fetch_quotes_empty_body(quote):
    def opener(_url: str) -> bytes:
        return b""

    with pytest.raises(RuntimeError, match="no parseable"):
        quote.fetch_quotes(["sh600519"], opener=opener)
