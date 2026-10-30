// Black-Scholes-Merton pricing + Greeks (European options, continuous dividend yield q).
//
// Conventions (those used on trading desks):
//   T      in years (days / 365)
//   sigma  as a decimal (0.25 = 25 %)
//   vega   per +1 vol point (1 %)
//   theta  per calendar day
//   rho    per +1 rate point (1 %)

const SQRT2PI = Math.sqrt(2 * Math.PI);

export const pdf = (x) => Math.exp(-0.5 * x * x) / SQRT2PI;

// Abramowitz & Stegun 26.2.17, abs. error < 7.5e-8
export function cdf(x) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const poly = t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  const p = pdf(x) * poly;
  return x >= 0 ? 1 - p : p;
}

export function d1d2({ S, K, T, r, sigma, q = 0 }) {
  const sq = sigma * Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / sq;
  return [d1, d1 - sq];
}

const intrinsic = ({ S, K, type }) => (type === 'call' ? Math.max(S - K, 0) : Math.max(K - S, 0));

export function price(o) {
  const { S, K, T, r, sigma, q = 0, type } = o;
  if (T <= 0 || sigma <= 0) return intrinsic(o);
  const [d1, d2] = d1d2(o);
  const eq = Math.exp(-q * T);
  const er = Math.exp(-r * T);
  return type === 'call'
    ? S * eq * cdf(d1) - K * er * cdf(d2)
    : K * er * cdf(-d2) - S * eq * cdf(-d1);
}

export function greeks(o) {
  const { S, K, T, r, sigma, q = 0, type } = o;
  const call = type === 'call';
  if (T <= 0 || sigma <= 0) {
    const itm = call ? S > K : S < K;
    return { price: intrinsic(o), delta: itm ? (call ? 1 : -1) : 0, gamma: 0, vega: 0, theta: 0, rho: 0 };
  }
  const sqT = Math.sqrt(T);
  const [d1, d2] = d1d2(o);
  const eq = Math.exp(-q * T);
  const er = Math.exp(-r * T);
  const nd1 = pdf(d1);
  const decay = (-S * eq * nd1 * sigma) / (2 * sqT);

  const gamma = (eq * nd1) / (S * sigma * sqT);
  const vega = S * eq * nd1 * sqT;
  let delta, theta, rho;
  if (call) {
    delta = eq * cdf(d1);
    theta = decay - r * K * er * cdf(d2) + q * S * eq * cdf(d1);
    rho = K * T * er * cdf(d2);
  } else {
    delta = -eq * cdf(-d1);
    theta = decay + r * K * er * cdf(-d2) - q * S * eq * cdf(-d1);
    rho = -K * T * er * cdf(-d2);
  }
  return { price: price(o), delta, gamma, vega: vega / 100, theta: theta / 365, rho: rho / 100, d1, d2 };
}

export function linspace(a, b, n) {
  return Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1));
}

/** Implied vol by bisection (price is monotone in sigma). Returns null if the price is not attainable. */
export function impliedVol(target, o) {
  if (o.T <= 0) return null;
  let lo = 1e-4;
  let hi = 5;
  const p = (s) => price({ ...o, sigma: s });
  if (target < p(lo) || target > p(hi)) return null;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (p(mid) < target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
