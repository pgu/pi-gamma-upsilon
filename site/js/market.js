// Illustrative (simulated) market model: a volatility smile and a term structure.
// Not real market data: parameters are chosen to look like a typical equity index.

/** IV for strike K: put-side skew (lower strikes -> higher IV) plus a smile curvature. */
export function smileIV({ S, K, T, atm, skew, curv }) {
  const k = Math.log(K / S);
  const slope = skew / (1 + 2 * T); // skew flattens with maturity
  return Math.max(0.05, atm - slope * k + curv * k * k);
}

/** ATM vol by maturity (years): converges from `short` towards `long`. */
export function termIV(T, short, long) {
  return long + (short - long) * Math.exp(-T / 0.25);
}

export const roundTick = (x, tick = 0.05) => Math.round(x / tick) * tick;
