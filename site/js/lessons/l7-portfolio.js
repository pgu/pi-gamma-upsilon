import { lineChart } from '../charts.js';
import { greeks } from '../bs.js';
import { controls, quiz, callout, hint, nf, sgn } from '../ui.js';
import { T } from '../glossary.js';

const S0 = 100;
const SIG0 = 0.25;
const R = 0.03;

const PRESETS = {
  straddle: { name: 'Long straddle', story: 'Tu achètes un call et un put au même strike : tu paries sur un <b>gros mouvement</b>, quel que soit le sens. Long gamma, long vega, short theta.', legs: [{ t: 'call', q: 1, K: 100, d: 60 }, { t: 'put', q: 1, K: 100, d: 60 }] },
  covered: { name: 'Covered call', story: 'Tu détiens l\'action et tu vends un call OTM pour encaisser la premium : le grand classique des gérants. Delta réduit, short gamma, short vega, long theta.', legs: [{ t: 'stock', q: 1 }, { t: 'call', q: -1, K: 105, d: 30 }] },
  rr: { name: 'Risk reversal', story: 'Long call OTM, short put OTM : exposition directionnelle haussière quasi sans coût. Très « delta », exposé au skew.', legs: [{ t: 'call', q: 1, K: 105, d: 60 }, { t: 'put', q: -1, K: 95, d: 60 }] },
  strangle: { name: 'Short strangle', story: 'Tu vends un call et un put OTM : tu encaisses beaucoup de premium tant que le marché reste dans la fourchette. Short gamma, short vega, long theta. C\'est le trade « vendeur de vol ».', legs: [{ t: 'call', q: -1, K: 110, d: 45 }, { t: 'put', q: -1, K: 90, d: 45 }] },
};

const legLabel = (l) => (l.t === 'stock' ? `${l.q > 0 ? 'Long' : 'Short'} action` : `${l.q > 0 ? 'Long' : 'Short'} ${l.t} ${l.K} (${l.d} j)`);

function legValue(l, S, sigma, elapsed) {
  if (l.t === 'stock') return S;
  return greeks({ S, K: l.K, T: Math.max(l.d - elapsed, 0) / 365, r: R, sigma, type: l.t }).price;
}

function legGreeks(l) {
  if (l.t === 'stock') return { delta: 1, gamma: 0, vega: 0, theta: 0, rho: 0 };
  return greeks({ S: S0, K: l.K, T: l.d / 365, r: R, sigma: SIG0, type: l.t });
}

export default {
  id: 'portfolio',
  title: 'Pro : lire un portefeuille',
  blurb: 'Additionner les grecques et expliquer le P&L comme sur un desk.',
  minutes: 20,
  html: () => `
    <p class="lead">Un trader ne regarde pas une option isolée mais un <b>book</b> : des dizaines de positions. Les grecques ont une propriété magique : <b>elles s'additionnent</b>. Le delta du portefeuille est la somme des deltas, idem pour gamma, vega, theta.</p>

    <h2>🧪 Playground : choisis une stratégie</h2>
    <p>Marché de départ : spot = 100, σ = 25 %, taux = 3 %.</p>
    <div data-controls></div>
    <p data-story class="story"></p>
    <div data-legs></div>

    <h2>Le P&amp;L explain</h2>
    <p>Chaque matin, le desk doit expliquer d'où vient le P&amp;L de la veille. Bouge les curseurs de scénario : l'outil compare le <b>vrai P&amp;L</b> (on réévalue tout avec Black-Scholes) à l'<b>explication par les grecques</b>.</p>
    <div data-scn></div>
    <div data-pnl></div>
    <div data-chart></div>
    ${callout('try', 'À essayer', `<ul>
      <li>Choisis le <b>short strangle</b> et fais un gros mouvement de spot (±15 %). Compare « Delta seul » et « Delta + Gamma » : le gamma explique l'essentiel de la perte.</li>
      <li>Avec le <b>straddle</b>, fais passer 10 jours sans rien bouger : le theta explique toute la perte.</li>
      <li>Fais monter la vol de 10 points sur le straddle : le vega fait le P&amp;L.</li>
    </ul>`)}
    ${hint(`La ligne <b>« Non expliqué »</b> (résidu) vient des grecques d'ordre supérieur et des termes croisés. Si elle est grande, il faut regarder vanna, volga, charm… C'est un indicateur de qualité du risk reporting.`, 'Que veut dire le résidu ?')}

    ${callout('pro', 'En pratique, sur un desk', `<ul>
      <li>Le reporting de risque affiche des grecques agrégées par <b>sous-jacent</b> et par <b>échéance</b>. Le trader a des <b>limites</b> (ex. |delta| &lt; 5 M€, vega &lt; 200 k€/pt) à respecter.</li>
      <li>Le ${T('pnl')} explain est une exigence réglementaire et de contrôle : il valide que les grecques utilisées pour couvrir sont <em>bonnes</em>.</li>
      <li>Les grecques sont souvent exprimées en <b>cash</b> (« cash delta » = Δ × S × taille) pour pouvoir comparer et agréger des positions sur des actifs différents.</li>
    </ul>`)}

    <h2>Quiz</h2>
    <div data-quiz></div>
  `,
  init(root, done) {
    const legsEl = root.querySelector('[data-legs]');
    const pnlEl = root.querySelector('[data-pnl]');
    const chartEl = root.querySelector('[data-chart]');
    const p = {};
    const sc = {};

    const refresh = () => {
      const preset = PRESETS[p.preset ?? 'straddle'];
      const legs = preset.legs;
      root.querySelector('[data-story]').innerHTML = preset.story;

      const rows = legs.map((l) => ({ l, g: legGreeks(l) }));
      const tot = { delta: 0, gamma: 0, vega: 0, theta: 0, rho: 0 };
      for (const { l, g } of rows) for (const k of Object.keys(tot)) tot[k] += l.q * g[k];
      legsEl.innerHTML = `<div class="tbl-wrap"><table class="tbl num"><thead><tr><th>Position</th><th>Δ</th><th>Γ</th><th>ν</th><th>Θ/j</th><th>ρ</th></tr></thead><tbody>${rows
        .map(({ l, g }) => `<tr><td>${legLabel(l)}</td>${['delta', 'gamma', 'vega', 'theta', 'rho'].map((k) => `<td>${nf(l.q * g[k], k === 'gamma' ? 4 : 3)}</td>`).join('')}</tr>`)
        .join('')}<tr class="total"><td>Total portefeuille</td>${['delta', 'gamma', 'vega', 'theta', 'rho'].map((k) => `<td>${nf(tot[k], k === 'gamma' ? 4 : 3)}</td>`).join('')}</tr></tbody></table></div>`;

      const pct = sc.pct ?? 5;
      const dv = sc.dvol ?? 0;
      const days = sc.days ?? 1;
      const dS = (S0 * pct) / 100;
      const v0 = legs.reduce((a, l) => a + l.q * legValue(l, S0, SIG0, 0), 0);
      const v1 = legs.reduce((a, l) => a + l.q * legValue(l, S0 + dS, SIG0 + dv / 100, days), 0);
      const actual = v1 - v0;
      const c = { Delta: tot.delta * dS, Gamma: 0.5 * tot.gamma * dS * dS, Vega: tot.vega * dv, Theta: tot.theta * days };
      const explained = Object.values(c).reduce((a, b) => a + b, 0);
      pnlEl.innerHTML = `<div class="tbl-wrap"><table class="tbl num"><thead><tr><th>Source du P&amp;L</th><th>Formule</th><th>P&amp;L</th></tr></thead><tbody>
        <tr><td>Delta</td><td>Δ × ΔS</td><td>${sgn(c.Delta)}</td></tr>
        <tr><td>Gamma</td><td>½ × Γ × ΔS²</td><td>${sgn(c.Gamma)}</td></tr>
        <tr><td>Vega</td><td>ν × Δσ</td><td>${sgn(c.Vega)}</td></tr>
        <tr><td>Theta</td><td>Θ × jours</td><td>${sgn(c.Theta)}</td></tr>
        <tr class="total"><td>Expliqué par les grecques</td><td></td><td>${sgn(explained)}</td></tr>
        <tr><td>Vrai P&amp;L (réévaluation complète)</td><td></td><td><b>${sgn(actual)}</b></td></tr>
        <tr><td>Non expliqué</td><td></td><td>${sgn(actual - explained)}</td></tr></tbody></table></div>`;

      const xs = Array.from({ length: 61 }, (_, i) => -30 + i);
      const full = (x) => legs.reduce((a, l) => a + l.q * legValue(l, S0 * (1 + x / 100), SIG0, 0), 0) - v0;
      chartEl.innerHTML = lineChart({
        series: [
          { label: 'Réévaluation complète', color: 0, pts: xs.map((x) => [x, full(x)]) },
          { label: 'Delta seul', color: 1, dash: true, pts: xs.map((x) => [x, tot.delta * S0 * (x / 100)]) },
          { label: 'Delta + Gamma', color: 2, dash: true, pts: xs.map((x) => [x, tot.delta * S0 * (x / 100) + 0.5 * tot.gamma * (S0 * x / 100) ** 2]) },
        ],
        markers: [{ x: pct, y: full(pct), label: sgn(full(pct)) }],
        xLabel: 'Variation du spot (%) — vol et temps inchangés', yLabel: 'P&L du portefeuille',
      });
    };

    controls(root.querySelector('[data-controls]'), [
      { key: 'preset', type: 'toggle', label: 'Stratégie', value: 'straddle', options: Object.entries(PRESETS).map(([v, o]) => ({ v, l: o.name })) },
    ], refresh, p);
    controls(root.querySelector('[data-scn]'), [
      { key: 'pct', label: 'Variation du spot', min: -20, max: 20, step: 0.5, value: 5, fmt: (v) => sgn(v, 1) + ' %' },
      { key: 'dvol', label: 'Variation de la vol', min: -10, max: 10, step: 1, value: 0, fmt: (v) => sgn(v, 0) + ' pts' },
      { key: 'days', label: 'Jours écoulés', min: 0, max: 30, step: 1, value: 1, fmt: (v) => v + ' j' },
    ], refresh, sc);

    quiz(root.querySelector('[data-quiz]'), [
      { q: 'Un book a un delta de +1 000 (actions) et un gamma de −200 par point. Le spot monte de 5. Delta estimé après le mouvement ?', opts: ['+2 000', '+1 000', '0', '−1 000'], a: 2, why: 'Δ_new ≈ Δ + Γ·ΔS = 1 000 + (−200 × 5) = 0. Le gamma négatif a « mangé » le delta : tu es devenu moins long en montant.' },
      { q: 'Le vendeur d\'un strangle encaisse chaque jour…', opts: ['Du gamma', 'Du theta', 'Du vega', 'Du delta'], a: 1, why: 'Il est long theta (positif) — et short gamma/vega : c\'est le prix du risque qu\'il porte.' },
      { q: 'Pourquoi les grecques sont-elles pratiques pour un portefeuille ?', opts: ['Elles sont toujours petites', 'Elles s\'additionnent', 'Elles sont toujours positives', 'Elles remplacent le pricing'], a: 1, why: 'Linéarité de la dérivée : on peut agréger tout un book en quelques nombres.' },
    ], done);
  },
};
