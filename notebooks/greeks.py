"""Black-Scholes-Merton pricing, Greeks, implied vol and a binomial tree.

Python twin of ``site/js/bs.js`` (same formulas, same desk conventions), used by
the notebooks. ``test_greeks.py`` cross-checks it against values produced by the
JavaScript engine.

Conventions
    T      in years (days / 365)
    sigma  decimal (0.25 = 25 %)
    vega   per +1 vol point      theta  per calendar day      rho  per +1 rate point
"""
from __future__ import annotations

import numpy as np
from scipy.optimize import brentq
from scipy.stats import norm


def _kind(kind: str) -> int:
    if kind not in ("call", "put"):
        raise ValueError("kind must be 'call' or 'put'")
    return 1 if kind == "call" else -1


def intrinsic(S, K, kind="call"):
    return np.maximum(_kind(kind) * (np.asarray(S, float) - K), 0.0)


def d1d2(S, K, T, r, sigma, q=0.0):
    S = np.asarray(S, float)
    sq = sigma * np.sqrt(T)
    d1 = (np.log(S / K) + (r - q + 0.5 * sigma**2) * T) / sq
    return d1, d1 - sq


def price(S, K, T, r, sigma, kind="call", q=0.0):
    """European option price. Works on numpy arrays for S (and K)."""
    s = _kind(kind)
    if T <= 0 or sigma <= 0:
        return intrinsic(S, K, kind)
    d1, d2 = d1d2(S, K, T, r, sigma, q)
    return s * (np.asarray(S, float) * np.exp(-q * T) * norm.cdf(s * d1) - K * np.exp(-r * T) * norm.cdf(s * d2))


def greeks(S, K, T, r, sigma, kind="call", q=0.0) -> dict:
    """Delta, gamma, vega (per vol point), theta (per day), rho (per rate point)."""
    s = _kind(kind)
    S = np.asarray(S, float)
    if T <= 0 or sigma <= 0:
        itm = (S > K) if s == 1 else (S < K)
        zero = np.zeros_like(S)
        return {"price": intrinsic(S, K, kind), "delta": np.where(itm, float(s), 0.0), "gamma": zero, "vega": zero, "theta": zero, "rho": zero}
    d1, d2 = d1d2(S, K, T, r, sigma, q)
    eq, er, nd1, sqT = np.exp(-q * T), np.exp(-r * T), norm.pdf(d1), np.sqrt(T)
    theta = -S * eq * nd1 * sigma / (2 * sqT) - s * r * K * er * norm.cdf(s * d2) + s * q * S * eq * norm.cdf(s * d1)
    return {
        "price": price(S, K, T, r, sigma, kind, q),
        "delta": s * eq * norm.cdf(s * d1),
        "gamma": eq * nd1 / (S * sigma * sqT),
        "vega": S * eq * nd1 * sqT / 100,
        "theta": theta / 365,
        "rho": s * K * T * er * norm.cdf(s * d2) / 100,
    }


def second_order(S, K, T, r, sigma, kind="call", q=0.0) -> dict:
    """vanna (delta per vol point), volga (vega per vol point), charm (delta change after one day)."""
    d1, d2 = d1d2(S, K, T, r, sigma, q)
    eq, nd1 = np.exp(-q * T), norm.pdf(d1)
    delta_today = greeks(S, K, T, r, sigma, kind, q)["delta"]
    delta_tomorrow = greeks(S, K, T - 1 / 365, r, sigma, kind, q)["delta"]
    return {
        "vanna": -eq * nd1 * d2 / sigma / 100,
        "volga": np.asarray(S, float) * eq * nd1 * np.sqrt(T) * d1 * d2 / sigma / 10000,
        "charm": delta_tomorrow - delta_today,
    }


def implied_vol(target, S, K, T, r, kind="call", q=0.0, lo=1e-4, hi=5.0) -> float:
    """Implied volatility by Brent's method. NaN if the price is not attainable."""
    f = lambda sig: float(price(S, K, T, r, sig, kind, q)) - target
    if T <= 0 or f(lo) > 0 or f(hi) < 0:
        return float("nan")
    return brentq(f, lo, hi, xtol=1e-12)


def binomial(S, K, T, r, sigma, kind="call", q=0.0, steps=150, american=True) -> float:
    """Cox-Ross-Rubinstein tree; american=True allows early exercise."""
    s = _kind(kind)
    dt = T / steps
    u = np.exp(sigma * np.sqrt(dt))
    d = 1 / u
    p = min(1.0, max(0.0, (np.exp((r - q) * dt) - d) / (u - d)))
    disc = np.exp(-r * dt)
    j = np.arange(steps + 1)
    v = np.maximum(s * (S * u ** (2 * j - steps) - K), 0.0)
    for i in range(steps - 1, -1, -1):
        v = disc * (p * v[1 : i + 2] + (1 - p) * v[: i + 1])
        if american:
            v = np.maximum(v, np.maximum(s * (S * u ** (2 * np.arange(i + 1) - i) - K), 0.0))
    return float(v[0])


# --- illustrative market model (same as site/js/market.js: simulated, not real data) ---
def smile_iv(S, K, T, atm, skew, curv):
    k = np.log(np.asarray(K, float) / S)
    return np.maximum(0.05, atm - skew / (1 + 2 * T) * k + curv * k**2)
