import { lineChart } from '../charts.js';
import { STRATS, analyze } from '../strat.js';
import { controls, callout, hint, stats, nf, sgn } from '../ui.js';
import { T } from '../glossary.js';

const CHALLENGES = [
  {
    title: '1. Delta-neutre et long gamma',
    goal: 'Un trade insensible à une petite variation du spot, mais qui profite des gros mouvements.',
    solution: 'Un straddle ATM (call 100 + put 100 achetés) : les deltas se compensent, les gammas s\'additionnent.',
    checks: (m) => [
      ['|Δ| < 0,10', Math.abs(m.g.delta) < 0.1],
      ['Γ > 0 (long gamma)', m.g.gamma > 0.002],
    ],
  },
  {
    title: '2. Vendeur de vol, risque borné',
    goal: 'Encaisser du theta en pariant sur un marché calme, sans risque de perte illimitée.',
    solution: 'Un iron condor : vente put 90 / call 110, protégée par put 85 / call 115.',
    checks: (m) => [
      ['Γ < 0 (short gamma)', m.g.gamma < -0.002],
      ['Θ > 0 (gagne du temps)', m.g.theta > 0.005],
      ['Perte ≥ −10 si le spot tombe à 50 ou monte à 150', m.at(50) >= -10 && m.at(150) >= -10],
    ],
  },
  {
    title: '3. Haussier, à coût quasi nul',
    goal: 'Une exposition à la hausse sans payer de prime : le call acheté est financé par un put vendu.',
    solution: 'Un risk reversal : call 105 acheté, put 95 vendu. Attention : le risque à la baisse devient important.',
    checks: (m) => [
      ['Δ > 0,20', m.g.delta > 0.2],
      ['|coût d\'entrée| < 1,00', Math.abs(m.cost) < 1],
    ],
  },
  {
    title: '4. Protéger une position en actions',
    goal: 'Tu détiens l\'action et tu veux limiter la perte sans renoncer à toute la hausse.',
    solution: 'Un protective put (action + put 95 acheté) ou un collar.',
    checks: (m) => [
      ['Tu détiens des actions (position stock > 0)', m.stock > 0],
      ['Perte ≥ −10 si le spot tombe à 70', m.at(70) >= -10],
      ['Gain > 0 si le spot monte à 130', m.at(130) > 0],
    ],
  },
];

const defaultLeg = () => ({ t: 'call', q: 1, K: 100, d: 60 });

export default {
  id: 'builder',
  title: 'Atelier : construis ta stratégie',
  blurb: 'Compose tes propres positions et relève 4 défis.',
  minutes: 25,
  html: () => `
    <p class="lead">À toi de jouer. Ajoute jusqu'à 6 « jambes » (calls, puts, actions), choisis leurs strikes et échéances, et regarde en direct le P&amp;L et les grecques nettes.</p>
    <p class="note">Convention : quantité <b>positive = acheté</b>, <b>négative = vendu</b>. Spot de départ : 100. Le P&amp;L « à l'échéance » est mesuré à la première échéance parmi tes options.</p>

    <div data-controls></div>
    <div data-legs class="legs"></div>
    <div class="actions"><button type="button" class="btn secondary" data-add>＋ Ajouter une jambe</button><button type="button" class="btn secondary" data-clear>Vider</button></div>
    <div data-stats></div>
    <div data-chart></div>
    <div class="tbl-wrap" data-greeks></div>
    ${hint(`Un call acheté ET un put vendu au même strike reproduisent une position en actions (c'est la parité call-put). Essaie : quantité +1 call 100, −1 put 100 : le delta est proche de +1.`, 'Astuce : la parité call-put')}

    <h2>🎯 Les 4 défis</h2>
    <p>Construis une stratégie qui valide <b>toutes</b> les conditions, puis clique sur « Vérifier ». Chaque défi a une solution (en indice) : essaie d'abord sans.</p>
    <div data-challenges></div>
    ${callout('pro', 'En pratique, sur un desk', `C'est exactement le travail de structuration : partir d'un besoin client (« je veux être protégé sans payer »), puis choisir les jambes qui donnent le bon profil de P&amp;L et les bonnes grecques, en gardant un œil sur le ${T('debitcredit', 'coût d\'entrée')}.`)}
  `,
  init(root, done) {
    const st = {};
    let legs = [defaultLeg()];
    const solved = new Set();

    const legsEl = root.querySelector('[data-legs]');
    const num = (v, d) => (Number.isFinite(+v) && v !== '' ? +v : d);

    const metrics = () => {
      const active = legs.filter((l) => l.q !== 0);
      const a = analyze(active, st.sig / 100);
      return { a, g: a.greeks, cost: a.cost, at: a.atEval, stock: active.filter((l) => l.t === 'stock').reduce((s, l) => s + l.q, 0) };
    };

    const render = () => {
      legsEl.innerHTML = legs
        .map(
          (l, i) => `<div class="leg" data-i="${i}">
            <label>Type<select data-f="t"><option value="call"${l.t === 'call' ? ' selected' : ''}>Call</option><option value="put"${l.t === 'put' ? ' selected' : ''}>Put</option><option value="stock"${l.t === 'stock' ? ' selected' : ''}>Action</option></select></label>
            <label>Quantité<input type="number" data-f="q" min="-10" max="10" step="1" value="${l.q}"></label>
            <label>Strike<input type="number" data-f="K" min="50" max="150" step="1" value="${l.K ?? 100}" ${l.t === 'stock' ? 'disabled' : ''}></label>
            <label>Jours<input type="number" data-f="d" min="1" max="730" step="1" value="${l.d ?? 60}" ${l.t === 'stock' ? 'disabled' : ''}></label>
            <button type="button" class="del" data-del aria-label="Supprimer la jambe ${i + 1}">✕</button></div>`,
        )
        .join('');
      update();
    };

    const update = () => {
      const active = legs.filter((l) => l.q !== 0);
      const el = root.querySelector('[data-stats]');
      if (!active.length) {
        el.innerHTML = callout('info', 'Aucune position', 'Ajoute une jambe avec une quantité non nulle.');
        root.querySelector('[data-chart]').innerHTML = '';
        root.querySelector('[data-greeks]').innerHTML = '';
        return;
      }
      const { a, g } = metrics();
      const fmtLimit = (v) => (Number.isFinite(v) ? sgn(v) : v > 0 ? 'illimité' : 'illimitée');
      el.innerHTML = stats([
        { k: a.cost >= 0 ? 'Débit' : 'Crédit', v: nf(Math.abs(a.cost)) },
        { k: 'Gain maximum', v: fmtLimit(a.max) },
        { k: 'Perte maximale', v: fmtLimit(a.min) },
        { k: 'Breakeven(s)', v: a.be.length ? a.be.map((x) => nf(x, 1)).join(' / ') : '—' },
      ]);
      const xs = Array.from({ length: 201 }, (_, i) => 50 + i * 0.5);
      root.querySelector('[data-chart]').innerHTML = lineChart({
        series: [
          { label: a.day ? `P&L au jour ${a.day} (1ʳᵉ échéance)` : 'P&L', pts: xs.map((x) => [x, a.atEval(x)]) },
          { label: 'P&L aujourd\'hui', color: 1, dash: true, pts: xs.map((x) => [x, a.now(x)]) },
        ],
        markers: a.be.map((x) => ({ x, y: 0, label: nf(x, 0), color: 2 })),
        vlines: [{ x: 100, label: 'spot' }],
        xLabel: 'Spot', yLabel: 'P&L',
      });
      root.querySelector('[data-greeks]').innerHTML = `<table class="tbl num"><thead><tr><th>Grecques nettes</th><th>Δ</th><th>Γ</th><th>ν</th><th>Θ / jour</th><th>ρ</th></tr></thead><tbody><tr><th>Position</th><td>${nf(g.delta, 3)}</td><td>${nf(g.gamma, 4)}</td><td>${nf(g.vega, 3)}</td><td>${nf(g.theta, 3)}</td><td>${nf(g.rho, 3)}</td></tr></tbody></table>`;
    };

    legsEl.addEventListener('input', (e) => {
      const row = e.target.closest('.leg');
      if (!row) return;
      const l = legs[+row.dataset.i];
      const f = e.target.dataset.f;
      if (f === 't') {
        l.t = e.target.value;
        render();
        return;
      }
      if (f === 'q') l.q = Math.round(Math.max(-10, Math.min(10, num(e.target.value, 0))));
      if (f === 'K') l.K = Math.max(50, Math.min(150, num(e.target.value, 100)));
      if (f === 'd') l.d = Math.max(1, Math.min(730, Math.round(num(e.target.value, 60))));
      update();
    });
    legsEl.addEventListener('click', (e) => {
      if (!e.target.closest('[data-del]')) return;
      legs.splice(+e.target.closest('.leg').dataset.i, 1);
      render();
    });
    root.querySelector('[data-add]').addEventListener('click', () => {
      if (legs.length >= 6) return;
      legs.push(defaultLeg());
      render();
    });
    root.querySelector('[data-clear]').addEventListener('click', () => {
      legs = [];
      render();
    });

    controls(root.querySelector('[data-controls]'), [
      { key: 'preset', type: 'select', label: 'Charger un modèle', value: '', options: [{ v: '', l: '— Ma stratégie —' }, ...Object.entries(STRATS).map(([v, s]) => ({ v, l: s.name }))] },
      { key: 'sig', label: 'Volatilité (σ)', min: 10, max: 60, step: 1, value: 25, fmt: (v) => v + ' %' },
    ], (s) => {
      if (s.preset && s.preset !== st.loaded) {
        legs = STRATS[s.preset].legs(60).map((l) => ({ ...l }));
        st.loaded = s.preset;
        render();
      } else if (!s.preset) {
        st.loaded = '';
      }
      if (legsEl.children.length === 0 && legs.length) render();
      else if (legsEl.children.length) update();
    }, st);

    const chEl = root.querySelector('[data-challenges]');
    chEl.innerHTML = CHALLENGES.map(
      (c, i) => `<div class="challenge" data-c="${i}"><h3>${c.title}</h3><p>${c.goal}</p><button type="button" class="btn secondary" data-check>Vérifier</button><ul data-res></ul>${hint(c.solution, 'Solution')}</div>`,
    ).join('');
    chEl.addEventListener('click', (e) => {
      if (!e.target.closest('[data-check]')) return;
      const box = e.target.closest('.challenge');
      const i = +box.dataset.c;
      const active = legs.filter((l) => l.q !== 0);
      if (!active.length) {
        box.querySelector('[data-res]').innerHTML = '<li>⚠️ Construis d\'abord une stratégie ci-dessus.</li>';
        return;
      }
      const res = CHALLENGES[i].checks(metrics());
      const ok = res.every(([, v]) => v);
      box.querySelector('[data-res]').innerHTML = res.map(([t, v]) => `<li>${v ? '✅' : '❌'} ${t}</li>`).join('') + (ok ? '<li><b>🎉 Défi réussi !</b></li>' : '');
      if (ok) {
        solved.add(i);
        if (solved.size === CHALLENGES.length) done();
      }
    });
  },
};
