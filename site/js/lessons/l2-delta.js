import { lineChart } from '../charts.js';
import { greeks } from '../bs.js';
import { controls, quiz, callout, hint, stats, nf, sgn } from '../ui.js';
import { T } from '../glossary.js';

export default {
  id: 'delta',
  title: 'Delta (Δ)',
  blurb: 'La sensibilité au spot — et la base de toute couverture.',
  minutes: 15,
  html: () => `
    <p class="lead">Le ${T('delta')} répond à : <b>« si le spot gagne 1, de combien l'option gagne-t-elle ? »</b> C'est la grecque la plus utilisée au quotidien.</p>

    <p class="formula">Δ = ∂V / ∂S</p>
    <ul>
      <li>${T('call', 'Call')} : delta entre <b>0 et +1</b>. Le call monte avec le spot.</li>
      <li>${T('put', 'Put')} : delta entre <b>−1 et 0</b>. Le put monte quand le spot baisse.</li>
      <li>Une option très ${T('itm')} se comporte comme l'action elle-même (|Δ| → 1) ; très ${T('otm')}, elle ne réagit presque plus (Δ → 0) ; ${T('atm')}, |Δ| ≈ 0,5.</li>
      <li>Delta est aussi un <b>hedge ratio</b> : le nombre d'actions à détenir pour compenser l'option.</li>
    </ul>

    <h2>🧪 Playground : courbe de delta</h2>
    <div data-controls></div>
    <div data-stats></div>
    <div data-chart></div>
    ${callout('try', 'À essayer', `<ul>
      <li>Réduis la maturité à quelques jours : la courbe devient une <b>marche</b> (0 → 1). À l'expiration, une option est soit ITM (delta 1) soit OTM (delta 0).</li>
      <li>Passe en <b>Put</b> : même courbe, mais en négatif.</li>
      <li>Monte la volatilité : la courbe s'aplatit — avec plus d'incertitude, même une option très OTM garde une chance de finir ITM.</li>
    </ul>`)}
    ${hint(`Delta n'est <em>pas exactement</em> la probabilité d'être ITM à l'expiration, mais l'ordre de grandeur est le bon : un call de delta 0,30 a environ 30 % de chances de finir ITM. Les traders utilisent ce raccourci pour désigner les strikes (« le 25-delta put »).`)}

    <h2>🧮 Application : combien d'actions pour se couvrir ?</h2>
    <p>Avec les réglages ci-dessus, imagine une position de <b>N contrats</b> (positif = acheté, négatif = vendu), chacun portant sur 100 actions (${T('multiplier')}).</p>
    <div data-calc-controls></div>
    <div data-calc class="readout"></div>
    ${hint(`Delta de la position = Δ × contrats × 100. Pour être ${T('deltaneutral')}, on prend la position <em>opposée</em> en actions. Position de delta −500 → on achète 500 actions.`, 'Comment calculer')}

    ${callout('pro', 'En pratique, sur un desk', `Un client achète 100 calls : le ${T('marketmaker')} les vend, devient <b>short delta</b> et achète immédiatement les actions correspondantes. Il ne parie pas sur la direction du marché, il facture un spread et se couvre. C'est le <b>delta hedging</b>. Mais comme le delta change quand le spot bouge, il doit rééquilibrer en permanence… ce qui nous amène au gamma.`)}
    ${callout('warn', 'Piège classique', 'Le delta est une approximation <em>locale</em>. Pour un gros mouvement du spot, le delta lui-même change : la prédiction « Δ × ΔS » devient fausse. La correction vient du gamma (leçon suivante).')}

    <h2>Quiz</h2>
    <div data-quiz></div>
  `,
  init(root, done) {
    const chart = root.querySelector('[data-chart]');
    const calcControls = root.querySelector('[data-calc-controls]');
    const st = {};
    const st2 = {};
    const refresh = () => {
      const { type, S, K, days, sig } = st;
      const o = { S, K, T: days / 365, r: 0.03, sigma: sig / 100, type };
      const g = greeks(o);
      root.querySelector('[data-stats]').innerHTML = stats([
        { k: 'Delta', v: nf(g.delta, 3), sub: `Si le spot gagne 1 → l'option ${g.delta >= 0 ? 'gagne' : 'perd'} ≈ ${nf(Math.abs(g.delta), 3)}` },
        { k: 'Prix', v: nf(g.price) },
      ]);
      const xs = Array.from({ length: 101 }, (_, i) => 50 + i);
      chart.innerHTML = lineChart({
        series: [
          { label: `Delta (${days} j)`, color: 0, pts: xs.map((x) => [x, greeks({ ...o, S: x }).delta]) },
          { label: 'Delta à 5 jours', color: 1, dash: true, pts: xs.map((x) => [x, greeks({ ...o, S: x, T: 5 / 365 }).delta]) },
        ],
        markers: [{ x: S, y: g.delta, label: 'Δ = ' + nf(g.delta, 2) }],
        vlines: [{ x: K, label: 'K' }],
        xLabel: 'Spot', yLabel: 'Delta',
      });
      const n = st2.n ?? -50;
      const posDelta = g.delta * n * 100;
      const hedge = -posDelta;
      root.querySelector('[data-calc]').innerHTML =
        `Delta de la position : <b>${sgn(posDelta, 0)} actions</b> · Pour être delta-neutral : <b>${hedge >= 0 ? 'acheter' : 'vendre'} ${nf(Math.abs(hedge), 0)} actions</b>`;
    };
    controls(root.querySelector('[data-controls]'), [
      { key: 'type', type: 'toggle', label: 'Type', value: 'call', options: [{ v: 'call', l: 'Call' }, { v: 'put', l: 'Put' }] },
      { key: 'S', label: 'Spot (S)', min: 50, max: 150, step: 1, value: 100 },
      { key: 'K', label: 'Strike (K)', min: 60, max: 140, step: 1, value: 100 },
      { key: 'days', label: 'Maturité (jours)', min: 5, max: 365, step: 1, value: 60 },
      { key: 'sig', label: 'Volatilité (σ)', min: 5, max: 100, step: 1, value: 25, fmt: (v) => v + ' %' },
    ], refresh, st);
    controls(calcControls, [
      { key: 'n', label: 'Contrats (négatif = vendus)', min: -100, max: 100, step: 1, value: -50, fmt: (v) => sgn(v, 0) },
    ], refresh, st2);

    quiz(root.querySelector('[data-quiz]'), [
      { q: 'Tu es long 10 calls (×100) de delta 0,60. Delta de ta position en actions ?', opts: ['6', '60', '600', '6 000'], a: 2, why: '0,60 × 10 × 100 = 600 actions équivalentes.' },
      { q: 'Le delta d\'un put est…', opts: ['entre 0 et +1', 'entre −1 et 0', 'toujours −0,5', 'supérieur à 1'], a: 1, why: 'Un put gagne quand le spot baisse : sa sensibilité au spot est négative, bornée par −1.' },
      { q: 'Tu as vendu 20 calls (×100) de delta 0,25. Pour être delta-neutral tu dois…', opts: ['Acheter 500 actions', 'Vendre 500 actions', 'Acheter 2 000 actions', 'Ne rien faire'], a: 0, why: 'Short 20 calls → delta −0,25 × 20 × 100 = −500. On compense avec +500 actions.' },
    ], done);
  },
};
