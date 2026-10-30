import { test } from 'node:test';
import assert from 'node:assert/strict';
import { price, greeks, cdf } from '../site/js/bs.js';

const base = { S: 100, K: 100, T: 0.5, r: 0.03, sigma: 0.25 };
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) < tol, `${msg}: ${a} vs ${b}`);

test('cdf reference values', () => {
  near(cdf(0), 0.5, 1e-7, 'N(0)');
  near(cdf(1.96), 0.9750021, 1e-6, 'N(1.96)');
});

test('known price (Hull-style reference)', () => {
  // S=100 K=100 T=1 r=5% sigma=20% -> call 10.4506, put 5.5735
  const o = { S: 100, K: 100, T: 1, r: 0.05, sigma: 0.2 };
  near(price({ ...o, type: 'call' }), 10.4506, 1e-3, 'call');
  near(price({ ...o, type: 'put' }), 5.5735, 1e-3, 'put');
});

test('put-call parity', () => {
  const c = price({ ...base, type: 'call' });
  const p = price({ ...base, type: 'put' });
  near(c - p, base.S - base.K * Math.exp(-base.r * base.T), 1e-6, 'parity');
});

for (const type of ['call', 'put']) {
  test(`greeks match finite differences (${type})`, () => {
    const o = { ...base, type };
    const g = greeks(o);
    const h = 0.5;
    const up = (k, d) => price({ ...o, [k]: o[k] + d });
    near(g.delta, (up('S', h) - up('S', -h)) / (2 * h), 1e-4, 'delta');
    near(g.gamma, (up('S', h) - 2 * price(o) + up('S', -h)) / (h * h), 1e-4, 'gamma');
    near(g.vega, (up('sigma', 1e-4) - up('sigma', -1e-4)) / 2e-4 / 100, 1e-5, 'vega');
    near(g.rho, (up('r', 1e-4) - up('r', -1e-4)) / 2e-4 / 100, 1e-5, 'rho');
    near(g.theta, (up('T', -1e-4) - up('T', 1e-4)) / 2e-4 / 365, 1e-5, 'theta');
  });
}

test('theta-gamma relation when r = q = 0 (ATM)', () => {
  const o = { S: 100, K: 100, T: 0.25, r: 0, sigma: 0.3, type: 'call' };
  const g = greeks(o);
  near(g.theta * 365, -0.5 * o.sigma ** 2 * o.S ** 2 * g.gamma, 1e-9, 'theta = -1/2 sigma^2 S^2 gamma');
});

test('implied vol round-trips', async () => {
  const { impliedVol } = await import('../site/js/bs.js');
  for (const type of ['call', 'put']) {
    const o = { S: 100, K: 95, T: 0.3, r: 0.02, type };
    near(impliedVol(price({ ...o, sigma: 0.37 }), o), 0.37, 1e-6, `iv ${type}`);
  }
  assert.equal(impliedVol(0.0001, { S: 100, K: 50, T: 0.3, r: 0.02, type: 'call' }), null);
});
