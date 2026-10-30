import { lineChart } from '../charts.js';
import { STRATS, analyze } from '../strat.js';
import { controls, quiz, callout, hint, stats, nf, sgn } from '../ui.js';
import { T } from '../glossary.js';

const qual = (v, th, pos, neg, flat = 'neutre') => (v > th ? pos : v < -th ? neg : flat);

export default {
  id: 'strategies',
  title: 'Stratégies courantes',
  blurb: 'Spreads, collars, straddles, condors : un profil de P&L et de grecques chacun.',
  minutes: 20,
  html: () => `
    <p class="lead">Une stratégie est une <b>combinaison d'options</b> (et parfois d'actions) conçue pour exprimer une vue de marché précise. Chaque stratégie a deux visages : sa courbe de P&amp;L, et son profil de grecques. Les deux racontent la même histoire.</p>

    <h2>🧪 Playground : le catalogue</h2>
    <div data-controls></div>
    <p class="story" data-story></p>
    <div data-stats></div>
    <div data-chart></div>
    <div class="tbl-wrap" data-greeks></div>
    ${callout('try', 'À essayer', `<ul>
      <li>Compare <b>Long call</b> et <b>Bull call spread</b> : le spread coûte moins cher, mais son gain est plafonné.</li>
      <li>Regarde la courbe en pointillés : c'est le P&amp;L <em>aujourd'hui</em>, avant l'expiration. Elle est lisse, alors que la courbe pleine (à l'expiration) a des angles.</li>
      <li>Passe du <b>Long straddle</b> à l'<b>Iron condor</b> : tous les signes des grecques s'inversent. L'un est long gamma/vega, l'autre est short.</li>
      <li>Diminue la maturité : les effets de gamma et de theta deviennent plus visibles.</li>
    </ul>`)}
    ${hint(`Regarde les grecques comme la carte d'identité d'une stratégie : <b>Δ</b> dit si tu es haussier ou baissier, <b>Γ</b> si tu aimes ou subis les mouvements, <b>ν</b> si tu aimes que la vol monte, <b>Θ</b> si le temps joue pour ou contre toi.`, 'Comment lire le tableau')}

    <h2>Vocabulaire des stratégies</h2>
    <ul>
      <li>${T('spread', 'Spread')} : deux options de même type, strikes différents. Limite risque et coût.</li>
      <li>${T('debitcredit', 'Debit / Credit')} : un trade en <em>débit</em> coûte de l'argent à l'entrée (long options) ; un trade en <em>crédit</em> en rapporte (short options). Le crédit est l'argent « qu'on peut perdre ».</li>
      <li>${T('breakeven', 'Breakeven')} : le spot à l'expiration pour lequel le P&amp;L est nul.</li>
      <li>${T('collar', 'Collar')}, ${T('ironcondor', 'iron condor')}, ${T('calendar', 'calendar spread')} : voir le glossaire.</li>
    </ul>

    ${callout('pro', 'En pratique, sur un desk', `<ul>
      <li>Les clients (fonds, gérants, entreprises) demandent rarement une option isolée : ils demandent une <b>stratégie packagée</b> (« collar zéro coût sur ma position », « put spread sur l'indice »). Le desk la price comme un tout, et couvre les grecques nettes.</li>
      <li>Les spreads sont préférés quand on veut un risque borné ; la marge exigée par le courtier est aussi plus faible que pour des options vendues nues.</li>
      <li>Vendre de la prime (covered call, condor) rapporte du theta la plupart du temps, mais l'événement rare (krach, gap) coûte cher : toujours regarder le <em>pire scénario</em>.</li>
    </ul>`)}

    <h2>Quiz</h2>
    <div data-quiz></div>
  `,
  init(root, done) {
    const st = {};
    controls(root.querySelector('[data-controls]'), [
      { key: 'strat', type: 'select', label: 'Stratégie', value: 'longcall', options: Object.entries(STRATS).map(([v, s]) => ({ v, l: `${s.name} : ${s.view}` })) },
      { key: 'days', label: 'Maturité (jours)', min: 10, max: 180, step: 5, value: 45 },
      { key: 'sig', label: 'Volatilité (σ)', min: 10, max: 60, step: 1, value: 25, fmt: (v) => v + ' %' },
    ], () => {
      const S = STRATS[st.strat];
      const legs = S.legs(st.days);
      const a = analyze(legs, st.sig / 100);
      root.querySelector('[data-story]').innerHTML = `<b>${S.name}</b> · ${S.view}. ${S.story}`;

      const fmtLimit = (v) => (Number.isFinite(v) ? sgn(v) : v > 0 ? 'illimité' : 'illimitée');
      root.querySelector('[data-stats]').innerHTML = stats([
        { k: a.cost >= 0 ? 'Coût d\'entrée (débit)' : 'Encaissé (crédit)', v: nf(Math.abs(a.cost)), sub: legs.some((l) => l.t === 'stock') ? 'actions incluses' : '' },
        { k: 'Gain maximum', v: fmtLimit(a.max) },
        { k: 'Perte maximale', v: fmtLimit(a.min), sub: 'spot entre 1 et 300' },
        { k: 'Breakeven(s)', v: a.be.length ? a.be.map((x) => nf(x, 1)).join(' / ') : '—' },
      ]);

      const xs = Array.from({ length: 201 }, (_, i) => 50 + i * 0.5);
      const label = a.day ? `P&L à l'échéance (jour ${a.day})` : 'P&L';
      root.querySelector('[data-chart]').innerHTML = lineChart({
        series: [
          { label, pts: xs.map((x) => [x, a.atEval(x)]) },
          { label: 'P&L aujourd\'hui (si le spot bouge maintenant)', color: 1, dash: true, pts: xs.map((x) => [x, a.now(x)]) },
        ],
        markers: a.be.map((x) => ({ x, y: 0, label: nf(x, 0), color: 2 })),
        vlines: [{ x: 100, label: 'spot' }],
        xLabel: 'Spot', yLabel: 'P&L par unité',
      });

      const g = a.greeks;
      root.querySelector('[data-greeks]').innerHTML = `<table class="tbl num"><thead><tr><th></th><th>Δ</th><th>Γ</th><th>ν</th><th>Θ / jour</th></tr></thead><tbody>
        <tr><th>Valeur</th><td>${nf(g.delta, 3)}</td><td>${nf(g.gamma, 4)}</td><td>${nf(g.vega, 3)}</td><td>${nf(g.theta, 3)}</td></tr>
        <tr><th>Lecture</th><td>${qual(g.delta, 0.1, 'haussier', 'baissier')}</td><td>${qual(g.gamma, 0.002, 'long gamma', 'short gamma', 'plat')}</td><td>${qual(g.vega, 0.02, 'long vega', 'short vega', 'plat')}</td><td>${qual(g.theta, 0.005, 'gagne du temps', 'perd du temps', 'plat')}</td></tr></tbody></table>`;
    }, st);

    quiz(root.querySelector('[data-quiz]'), [
      { q: 'En vendant un call OTM contre ton action (covered call), tu abandonnes…', opts: ['La protection à la baisse', 'La hausse au-delà du strike', 'Le dividende', 'Rien du tout'], a: 1, why: 'La prime encaissée amortit un peu la baisse, mais le gain est plafonné au strike : si le spot monte beaucoup, le call vendu te prend la hausse.' },
      { q: 'Iron condor : quand le gain est-il maximal ?', opts: ['Spot très haut', 'Spot très bas', 'Le spot reste entre les deux strikes courts', 'La vol explose'], a: 2, why: 'Tu as encaissé un crédit en vendant un strangle ; tu le gardes en entier si les options vendues expirent sans valeur.' },
      { q: 'Quelle stratégie borne à la fois la perte et le gain sur une position en actions, à coût quasi nul ?', opts: ['Long straddle', 'Collar', 'Calendar spread', 'Long call'], a: 1, why: 'Collar : put acheté (protection) financé par un call vendu (plafond).' },
    ], done);
  },
};
