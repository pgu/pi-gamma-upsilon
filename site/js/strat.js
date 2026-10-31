// Multi-leg strategy helpers shared by the strategies lesson and the builder.
import { greeks, price } from './bs.js';

export const S0 = 100;
const R = 0.03;

/** leg: { t: 'call'|'put'|'stock', q: signed quantity, K, d: days to expiry } */
export function legPrice(l, S, sigma, elapsed = 0) {
  if (l.t === 'stock') return S;
  return price({ S, K: l.K, T: Math.max(l.d - elapsed, 0) / 365, r: R, sigma, type: l.t });
}

export const entryCost = (legs, sigma) => legs.reduce((a, l) => a + l.q * legPrice(l, S0, sigma), 0);

export function netGreeks(legs, sigma) {
  const t = { delta: 0, gamma: 0, vega: 0, theta: 0, rho: 0 };
  for (const l of legs) {
    const g = l.t === 'stock' ? { delta: 1, gamma: 0, vega: 0, theta: 0, rho: 0 } : greeks({ S: S0, K: l.K, T: l.d / 365, r: R, sigma, type: l.t });
    for (const k of Object.keys(t)) t[k] += l.q * g[k];
  }
  return t;
}

/** Day at which the P&L at "maturity" is measured: the earliest option expiry. */
export function evalDay(legs) {
  const ds = legs.filter((l) => l.t !== 'stock' && l.q !== 0).map((l) => l.d);
  return ds.length ? Math.min(...ds) : 0;
}

export function analyze(legs, sigma) {
  const cost = entryCost(legs, sigma);
  const day = evalDay(legs);
  const pnl = (S, elapsed) => legs.reduce((a, l) => a + l.q * legPrice(l, S, sigma, elapsed), 0) - cost;
  const atEval = (S) => pnl(S, day);
  const now = (S) => pnl(S, 0);

  const grid = Array.from({ length: 300 }, (_, i) => i + 1);
  const vals = grid.map(atEval);
  const topSlope = vals[299] - vals[249];
  const max = topSlope > 0.01 * 50 ? Infinity : Math.max(...vals);
  const min = topSlope < -0.01 * 50 ? -Infinity : Math.min(...vals);

  const be = [];
  for (let x = 40; x < 160; x += 0.25) {
    const a = atEval(x);
    const b = atEval(x + 0.25);
    if ((a < 0 && b >= 0) || (a > 0 && b <= 0)) be.push(x + (0.25 * Math.abs(a)) / (Math.abs(a) + Math.abs(b)));
  }
  return { cost, day, atEval, now, max, min, be, greeks: netGreeks(legs, sigma) };
}

const leg = (t, q, K, d) => ({ t, q, K, d });
export const STRATS = {
  longcall: { name: 'Long call', view: 'Haussier', story: 'Le pari le plus simple : tu paies une prime pour profiter de la hausse. Perte limitée à la prime.', legs: (d) => [leg('call', 1, 100, d)] },
  covered: { name: 'Covered call', view: 'Neutre / légèrement haussier', story: 'Tu détiens l\'action et tu vends un call OTM : tu encaisses la prime mais tu renonces à la hausse au-delà du strike. Très utilisé par les gérants pour « générer du rendement ».', legs: (d) => [leg('stock', 1), leg('call', -1, 105, d)] },
  protective: { name: 'Protective put', view: 'Haussier avec assurance', story: 'Tu détiens l\'action et tu achètes un put : c\'est une assurance. Perte limitée sous le strike, au prix de la prime.', legs: (d) => [leg('stock', 1), leg('put', 1, 95, d)] },
  collar: { name: 'Collar', view: 'Protection à coût réduit', story: 'Action + put acheté + call vendu. Le call vendu finance (en partie) le put : on borne la perte, on borne aussi le gain.', legs: (d) => [leg('stock', 1), leg('put', 1, 95, d), leg('call', -1, 105, d)] },
  bullspread: { name: 'Bull call spread', view: 'Haussier modéré', story: 'Achat d\'un call 100, vente d\'un call 110. Moins cher qu\'un call seul ; en échange, le gain est plafonné à 110.', legs: (d) => [leg('call', 1, 100, d), leg('call', -1, 110, d)] },
  bearspread: { name: 'Bear put spread', view: 'Baissier modéré', story: 'Achat d\'un put 100, vente d\'un put 90. Le miroir du bull call spread.', legs: (d) => [leg('put', 1, 100, d), leg('put', -1, 90, d)] },
  straddle: { name: 'Long straddle', view: 'Gros mouvement attendu (sens inconnu)', story: 'Call + put ATM achetés. Gagne si le marché bouge plus que le mouvement implicite. Long gamma, long vega, short theta.', legs: (d) => [leg('call', 1, 100, d), leg('put', 1, 100, d)] },
  strangle: { name: 'Long strangle', view: 'Gros mouvement attendu', story: 'Comme le straddle mais avec des options OTM : moins cher, mais il faut un mouvement plus grand pour gagner.', legs: (d) => [leg('call', 1, 105, d), leg('put', 1, 95, d)] },
  riskreversal: { name: 'Risk reversal', view: 'Haussier à coût quasi nul', story: 'Call 105 acheté, put 95 vendu : le put finance le call. Exposition à la hausse presque gratuite, mais risque important à la baisse.', legs: (d) => [leg('call', 1, 105, d), leg('put', -1, 95, d)] },
  condor: { name: 'Iron condor', view: 'Marché dans une fourchette', story: 'Vente d\'un strangle (put 90 / call 110) protégé par l\'achat de put 85 / call 115. Crédit encaissé, gain max si le spot reste entre 90 et 110, risque borné.', legs: (d) => [leg('put', 1, 85, d), leg('put', -1, 90, d), leg('call', -1, 110, d), leg('call', 1, 115, d)] },
  calendar: { name: 'Calendar spread', view: 'Marché calme, vol stable', story: 'Vente du call 100 à court terme, achat du call 100 trois fois plus long. Profite du theta plus rapide de l\'option courte. P&L mesuré à l\'échéance courte.', legs: (d) => [leg('call', -1, 100, d), leg('call', 1, 100, d * 3)] },
};
