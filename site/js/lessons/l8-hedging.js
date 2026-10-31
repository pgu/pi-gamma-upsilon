import { lineChart, histogram } from '../charts.js';
import { greeks } from '../bs.js';
import { controls, quiz, callout, hint, stats, nf, sgn } from '../ui.js';
import { T } from '../glossary.js';

const N = 60; // days to expiry
const S0 = 100;
const K = 100;

function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function gauss(rand) {
  let u = 0;
  while (u === 0) u = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
}

/** Sell one ATM call at implied vol sigI, delta-hedge it while the spot moves with vol sigR. r = 0. */
function simulate({ sigI, sigR, every, seed }) {
  const rand = rng(seed);
  const dt = 1 / 365;
  const opt = (S, i) => ({ S, K, T: (N - i) / 365, r: 0, sigma: sigI, type: 'call' });
  let S = S0;
  const g0 = greeks(opt(S, 0));
  let d = g0.delta;
  let cash = g0.price - d * S; // premium received, shares bought
  const spots = [S];
  const deltas = [d];
  for (let i = 1; i <= N; i++) {
    S *= Math.exp(-0.5 * sigR * sigR * dt + sigR * Math.sqrt(dt) * gauss(rand));
    spots.push(S);
    if (i < N && every && i % every === 0) {
      const nd = greeks(opt(S, i)).delta;
      cash -= (nd - d) * S;
      d = nd;
    }
    deltas.push(d);
  }
  return { spots, deltas, premium: g0.price, pnl: cash + d * S - Math.max(S - K, 0) };
}

export default {
  id: 'hedging',
  title: 'Pro : delta-hedging en action',
  blurb: 'Vendre une option, la couvrir, et voir d\'où vient le profit.',
  minutes: 20,
  html: () => `
    <p class="lead">Le trade de base d'un ${T('marketmaker')} : <b>vendre une option, puis neutraliser le delta</b> avec l'actif. Si tout se passe « bien », il ne gagne ni ne perd sur la direction. Mais alors, d'où vient son P&amp;L ?</p>

    <p>Réponse : de l'écart entre la volatilité <b>implicite</b> à laquelle il a vendu et la volatilité <b>réalisée</b> pendant la vie de l'option.</p>
    <p class="formula">P&amp;L (vendeur couvert) ≈ ½ · Σ Γ · S² · (σ<sub>implicite</sub>² − σ<sub>réalisée</sub>²) · dt</p>

    <h2>🧪 Simulateur</h2>
    <p>Tu vends un call ATM à 60 jours (S = K = 100, taux 0), tu encaisses la premium et tu te couvres en delta. Un chemin de prix aléatoire est tiré avec la vol réalisée choisie. <b>Le même chemin est réutilisé quand tu bouges les curseurs</b> : tu vois l'effet de chaque paramètre à hasard égal.</p>
    <div data-controls></div>
    <div data-actions class="actions">
      <button type="button" class="btn" data-new>🎲 Nouveau chemin</button>
      <button type="button" class="btn secondary" data-many>📊 Lancer 300 simulations</button>
    </div>
    <div data-stats></div>
    <div data-chart></div>
    <div data-chart2></div>
    <div data-many-out></div>
    ${callout('try', 'À essayer', `<ul>
      <li>Mets σ réalisée = σ implicite. Lance les 300 simulations : P&amp;L moyen ≈ 0, mais dispersion autour. Le métier est de gérer cette dispersion.</li>
      <li>Mets σ réalisée à 30 % pour une σ implicite à 20 % : le vendeur perd en moyenne, il a vendu l'option trop bon marché.</li>
      <li>Passe de couverture quotidienne à <b>aucune</b> : le résultat dépend uniquement de la direction ; la dispersion explose.</li>
      <li>Passe en hebdomadaire : la dispersion augmente (moins de rééquilibrages = moins bonne couverture du gamma).</li>
    </ul>`)}
    ${hint(`Rééquilibrer plus souvent réduit la dispersion du P&amp;L mais coûte des frais de transaction (non modélisés ici). C'est l'arbitrage permanent d'un desk : <em>précision de la couverture</em> vs <em>coûts</em>.`, 'Pourquoi pas toujours quotidien ?')}

    ${callout('pro', 'En pratique, sur un desk', `<ul>
      <li>Acheter des options = acheter du gamma et parier que ${T('rv', 'la vol réalisée')} sera supérieure à la ${T('iv', 'vol implicite')} payée. Vendre = l'inverse.</li>
      <li>Le trader vend la vol « chère » (IV élevée vs sa vue sur la vol réalisée) et achète la vol « bon marché » : c'est le <b>trading de volatilité</b>.</li>
      <li>Le P&amp;L d'un trade couvert se lit directement avec les grecques : gamma × (écart de variance) − theta payé.</li>
    </ul>`)}

    <h2>Quiz</h2>
    <div data-quiz></div>
  `,
  init(root, done) {
    const s = {};
    let seed = 7;
    const every = { daily: 1, weekly: 5, none: 0 };
    const run = () => simulate({ sigI: s.sigI / 100, sigR: s.sigR / 100, every: every[s.freq ?? 'daily'], seed });

    const refresh = () => {
      const sim = run();
      const days = sim.spots.map((_, i) => i);
      root.querySelector('[data-stats]').innerHTML = stats([
        { k: 'Premium encaissée', v: nf(sim.premium), sub: `σ implicite ${s.sigI} %` },
        { k: 'Spot final', v: nf(sim.spots[N]), sub: `strike ${K}` },
        { k: 'P&L final du trade couvert', v: sgn(sim.pnl), sub: sim.pnl >= 0 ? 'le vendeur gagne' : 'le vendeur perd' },
      ]);
      root.querySelector('[data-chart]').innerHTML = lineChart({
        series: [{ label: 'Spot simulé', pts: days.map((d) => [d, sim.spots[d]]) }],
        vlines: [], markers: [], xLabel: 'Jours écoulés', yLabel: 'Spot', title: 'Chemin de prix simulé',
      });
      root.querySelector('[data-chart2]').innerHTML = lineChart({
        series: [{ label: 'Delta de la couverture (actions détenues)', color: 1, pts: days.map((d) => [d, sim.deltas[d]]) }],
        xLabel: 'Jours écoulés', yLabel: 'Delta',
      });
    };

    controls(root.querySelector('[data-controls]'), [
      { key: 'sigI', label: 'σ implicite (vendue)', min: 10, max: 60, step: 1, value: 20, fmt: (v) => v + ' %' },
      { key: 'sigR', label: 'σ réalisée (marché)', min: 10, max: 60, step: 1, value: 20, fmt: (v) => v + ' %' },
      { key: 'freq', type: 'toggle', label: 'Rééquilibrage du delta', value: 'daily', options: [{ v: 'daily', l: 'Quotidien' }, { v: 'weekly', l: 'Hebdo' }, { v: 'none', l: 'Aucun' }] },
    ], refresh, s);

    root.querySelector('[data-new]').addEventListener('click', () => {
      seed += 1;
      refresh();
    });
    root.querySelector('[data-many]').addEventListener('click', () => {
      const pnls = Array.from({ length: 300 }, (_, k) => simulate({ sigI: s.sigI / 100, sigR: s.sigR / 100, every: every[s.freq], seed: 1000 + k }).pnl);
      const mean = pnls.reduce((a, b) => a + b, 0) / pnls.length;
      const sd = Math.sqrt(pnls.reduce((a, b) => a + (b - mean) ** 2, 0) / pnls.length);
      root.querySelector('[data-many-out]').innerHTML =
        stats([{ k: 'P&L moyen (300 chemins)', v: sgn(mean), sub: mean >= 0 ? 'vendeur gagnant en moyenne' : 'vendeur perdant en moyenne' }, { k: 'Écart-type', v: nf(sd) }]) +
        histogram({ values: pnls, xLabel: 'P&L final par trade', markers: [{ x: 0, label: '0' }, { x: mean, label: 'moyenne' }] });
    });

    quiz(root.querySelector('[data-quiz]'), [
      { q: 'Tu as vendu une option à 20 % d\'IV et la vol réalisée a été de 30 %. Tu es couvert en delta. Résultat attendu ?', opts: ['Gain', 'Perte', 'Zéro', 'Impossible à dire'], a: 1, why: 'Tu as vendu la vol trop bon marché : P&L ≈ ½·Γ·S²·(σ_imp² − σ_réal²)·dt < 0.' },
      { q: 'Quelle position profite d\'une vol réalisée supérieure à la vol implicite ?', opts: ['Short gamma', 'Long gamma', 'Short vega', 'Long theta'], a: 1, why: 'Long gamma : chaque mouvement du marché te profite, tu l\'as « acheté » à une vol implicite plus basse.' },
      { q: 'Pourquoi un desk ne rééquilibre-t-il pas son delta en continu ?', opts: ['Le delta ne change pas', 'Les frais de transaction', 'C\'est interdit', 'Le gamma est nul'], a: 1, why: 'Chaque rééquilibrage coûte (bid/ask, commissions). On cherche le bon compromis précision / coûts.' },
    ], done);
  },
};
