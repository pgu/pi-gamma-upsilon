import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STRATS, analyze } from '../site/js/strat.js';

const run = (k, d = 45, sig = 0.25) => analyze(STRATS[k].legs(d), sig);

test('long call: loss capped at premium, gain unbounded, one breakeven above strike', () => {
  const a = run('longcall');
  assert.ok(Math.abs(a.min + a.cost) < 1e-9);
  assert.equal(a.max, Infinity);
  assert.equal(a.be.length, 1);
  assert.ok(Math.abs(a.be[0] - (100 + a.cost)) < 0.3);
});

test('iron condor: bounded both ways, credit, short gamma, positive theta', () => {
  const a = run('condor');
  assert.ok(a.cost < 0);
  assert.ok(Number.isFinite(a.max) && Number.isFinite(a.min));
  assert.ok(a.greeks.gamma < 0 && a.greeks.theta > 0);
});

test('straddle is near delta-neutral, long gamma, two breakevens', () => {
  const a = run('straddle');
  assert.ok(Math.abs(a.greeks.delta) < 0.1 && a.greeks.gamma > 0);
  assert.equal(a.be.length, 2);
});

test('covered call caps the upside; collar bounds both sides', () => {
  assert.ok(Number.isFinite(run('covered').max));
  const c = run('collar');
  assert.ok(Number.isFinite(c.max) && Number.isFinite(c.min));
});

test('naked short exposure is flagged unbounded', () => {
  const a = analyze([{ t: 'call', q: -1, K: 100, d: 30 }], 0.25);
  assert.equal(a.min, -Infinity);
});
