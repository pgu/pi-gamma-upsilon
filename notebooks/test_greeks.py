"""Cross-check greeks.py against known values and the JavaScript engine (site/js/bs.js)."""
import math

import numpy as np
import pytest

import greeks as g

BASE = dict(S=100, K=105, T=60 / 365, r=0.03, sigma=0.25)

# Reference values produced by the JS engine (node, site/js/bs.js)
JS = {
    "call": dict(price=2.2713965483906904, delta=0.3512237115264581, gamma=0.03658901589991692, vega=0.15036581876678187, theta=-0.03402629234753888, rho=0.0540016020891865),
    "put": dict(price=6.754863020358812, delta=-0.648776288473542, gamma=0.03658901589991692, vega=0.15036581876678187, theta=-0.025438610171760682, rho=-0.11775204142637755),
}


def test_textbook_price():
    kw = dict(S=100, K=100, T=1, r=0.05, sigma=0.2)
    assert g.price(**kw, kind="call") == pytest.approx(10.4506, abs=1e-4)
    assert g.price(**kw, kind="put") == pytest.approx(5.5735, abs=1e-4)


@pytest.mark.parametrize("kind", ["call", "put"])
def test_matches_js_engine(kind):
    out = g.greeks(**BASE, kind=kind)
    for name, ref in JS[kind].items():
        assert float(out[name]) == pytest.approx(ref, abs=1e-5), name


def test_second_order_matches_js_engine():
    so = g.second_order(**BASE, kind="call")
    assert float(so["vanna"]) == pytest.approx(0.0071708095339729815, abs=1e-6)
    assert float(so["volga"]) == pytest.approx(0.001110662910850389, abs=1e-6)
    assert float(so["charm"]) == pytest.approx(-0.0018130973359272162, abs=1e-6)


def test_put_call_parity():
    c, p = g.price(**BASE, kind="call"), g.price(**BASE, kind="put")
    assert c - p == pytest.approx(BASE["S"] - BASE["K"] * math.exp(-BASE["r"] * BASE["T"]), abs=1e-10)


def test_greeks_vs_finite_differences():
    h = 1e-4
    up = lambda **kw: float(g.price(**{**BASE, **kw}, kind="call"))
    out = g.greeks(**BASE, kind="call")
    assert float(out["delta"]) == pytest.approx((up(S=100 + h) - up(S=100 - h)) / (2 * h), abs=1e-6)
    assert float(out["vega"]) == pytest.approx((up(sigma=0.25 + h) - up(sigma=0.25 - h)) / (2 * h) / 100, abs=1e-6)
    assert float(out["rho"]) == pytest.approx((up(r=0.03 + h) - up(r=0.03 - h)) / (2 * h) / 100, abs=1e-6)


def test_vectorised_over_spot():
    S = np.linspace(80, 120, 9)
    out = g.greeks(S, 100, 0.25, 0.03, 0.2, "put")
    assert out["delta"].shape == (9,) and np.all(out["delta"] < 0) and np.all(out["gamma"] > 0)


@pytest.mark.parametrize("kind", ["call", "put"])
def test_implied_vol_round_trip(kind):
    px = float(g.price(100, 95, 0.3, 0.02, 0.37, kind))
    assert g.implied_vol(px, 100, 95, 0.3, 0.02, kind) == pytest.approx(0.37, abs=1e-8)
    assert math.isnan(g.implied_vol(1e-6, 100, 50, 0.3, 0.02, "call"))


def test_implied_vol_matches_js_engine():
    assert g.implied_vol(2.4, 100, 100, 30 / 365, 0.03, "call") == pytest.approx(0.19915977221512504, abs=1e-6)


def test_binomial_matches_js_and_bs():
    kw = dict(S=80, K=100, T=1, r=0.05, sigma=0.25, kind="put")
    assert g.binomial(**kw, american=True) == pytest.approx(20.36625898200457, abs=1e-6)
    assert g.binomial(**kw, american=False) == pytest.approx(18.27077304630834, abs=1e-6)
    atm = dict(S=100, K=100, T=1, r=0.05, sigma=0.2)
    assert g.binomial(**atm, kind="call", steps=600, american=False) == pytest.approx(10.4506, abs=0.02)
