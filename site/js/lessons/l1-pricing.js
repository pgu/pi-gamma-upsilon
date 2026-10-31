import { lineChart } from '../charts.js';
import { price } from '../bs.js';
import { controls, quiz, callout, hint, stats, nf } from '../ui.js';
import { T } from '../glossary.js';

export default {
  id: 'pricing',
  title: 'D\'où viennent les grecques ?',
  blurb: 'Black-Scholes : 5 inputs, 1 prix, et 5 grecques.',
  minutes: 10,
  html: () => `
    <p class="lead">Le modèle de ${T('blackscholes', 'Black-Scholes')} transforme <b>5 paramètres</b> en un prix. Les grecques répondent à une seule question : <em>« si un de ces paramètres bouge un peu, de combien le prix bouge-t-il ? »</em> Mathématiquement, ce sont des dérivées partielles du prix.</p>

    <table class="tbl">
      <thead><tr><th>Input</th><th>Symbole</th><th>Grecque associée</th></tr></thead>
      <tbody>
        <tr><td>Prix de l'underlying (${T('spot')})</td><td>S</td><td>${T('delta')} (1ᵉʳ ordre) et ${T('gamma')} (2ᵉ ordre)</td></tr>
        <tr><td>${T('vol', 'Volatilité')}</td><td>σ</td><td>${T('vega')}</td></tr>
        <tr><td>Temps restant</td><td>T</td><td>${T('theta')}</td></tr>
        <tr><td>${T('rate', 'Taux sans risque')}</td><td>r</td><td>${T('rho')}</td></tr>
        <tr><td>${T('strike')}</td><td>K</td><td><em>aucune : K est fixé par le contrat</em></td></tr>
      </tbody>
    </table>

    <h2>🧪 Playground : le prix d'une option</h2>
    <p>La courbe pleine est le prix <em>aujourd'hui</em> ; la pointillée est le ${T('payoff')} à l'expiration. L'écart entre les deux est la ${T('timevalue')}.</p>
    <div data-controls></div>
    <div data-stats></div>
    <div data-chart></div>
    ${callout('try', 'À essayer', `<ul>
      <li>Descends la maturité vers 1 jour : la courbe pleine « se colle » au payoff. La time value disparaît.</li>
      <li>Monte la volatilité à 80 % : le prix de l'option ATM explose. Plus d'incertitude = option plus chère.</li>
      <li>Déplace le spot : l'option ATM a la plus grande time value.</li>
    </ul>`)}
    ${hint(`La ${T('timevalue')} = prix − ${T('intrinsic', 'valeur intrinsèque')}. Elle est maximale quand l'option est ATM, car c'est là que l'issue (ITM ou OTM à l'expiration) est la plus incertaine.`)}

    ${callout('info', 'Ce que Black-Scholes suppose', `Un ${T('european', 'option européenne')}, une volatilité constante, un taux constant, des prix qui évoluent « en continu » sans saut. Rien de tout ça n'est vrai exactement, mais le modèle reste la <em>langue commune</em> du marché : on cote les options en volatilité implicite et on mesure le risque en grecques Black-Scholes.`)}

    ${callout('pro', 'En pratique, sur un desk', `Les traders ne discutent presque jamais le prix d'une option en euros mais en <b>${T('iv', 'volatilité implicite')}</b> : « je te vends du 25 de vol ». Le prix est déduit en inversant Black-Scholes. Les grecques servent ensuite à agréger et couvrir le risque de tout le portefeuille.`)}

    <h2>Quiz</h2>
    <div data-quiz></div>
  `,
  init(root, done) {
    controls(
      root.querySelector('[data-controls]'),
      [
        { key: 'type', type: 'toggle', label: 'Type', value: 'call', options: [{ v: 'call', l: 'Call' }, { v: 'put', l: 'Put' }] },
        { key: 'S', label: 'Spot (S)', min: 60, max: 140, step: 1, value: 100 },
        { key: 'K', label: 'Strike (K)', min: 60, max: 140, step: 1, value: 100 },
        { key: 'days', label: 'Maturité (jours)', min: 1, max: 730, step: 1, value: 90 },
        { key: 'sig', label: 'Volatilité (σ)', min: 5, max: 100, step: 1, value: 25, fmt: (v) => v + ' %' },
        { key: 'r', label: 'Taux (r)', min: 0, max: 8, step: 0.25, value: 3, fmt: (v) => nf(v, 2) + ' %' },
      ],
      ({ type, S, K, days, sig, r }) => {
        const o = { S, K, T: days / 365, r: r / 100, sigma: sig / 100, type };
        const p = price(o);
        const intr = type === 'call' ? Math.max(S - K, 0) : Math.max(K - S, 0);
        root.querySelector('[data-stats]').innerHTML = stats([
          { k: 'Prix (premium)', v: nf(p) },
          { k: 'Valeur intrinsèque', v: nf(intr) },
          { k: 'Time value', v: nf(p - intr) },
        ]);
        const xs = Array.from({ length: 101 }, (_, i) => 40 + (i * 120) / 100);
        root.querySelector('[data-chart]').innerHTML = lineChart({
          series: [
            { label: 'Prix aujourd\'hui', color: 0, pts: xs.map((x) => [x, price({ ...o, S: x })]) },
            { label: 'Payoff à l\'expiration', color: 1, dash: true, pts: xs.map((x) => [x, type === 'call' ? Math.max(x - K, 0) : Math.max(K - x, 0)]) },
          ],
          markers: [{ x: S, y: p, label: nf(p) }],
          vlines: [{ x: K, label: 'K' }],
          xLabel: 'Spot', yLabel: 'Prix de l\'option',
        });
      },
    );

    quiz(root.querySelector('[data-quiz]'), [
      { q: 'Quelle est la seule grecque du lot qui dépend du <em>temps qui passe</em> ?', opts: ['Delta', 'Vega', 'Theta', 'Rho'], a: 2, why: 'Theta = ∂Prix/∂T : la sensibilité au passage du temps.' },
      { q: 'Une option est cotée 3,20 avec 1,50 de valeur intrinsèque. Sa time value ?', opts: ['1,50', '1,70', '3,20', '4,70'], a: 1, why: 'Time value = prix − intrinsèque = 3,20 − 1,50 = 1,70.' },
      { q: 'Pourquoi n\'y a-t-il pas de grecque pour le strike ?', opts: ['Il ne change pas le prix', 'Il est fixé par le contrat, ce n\'est pas un risque de marché', 'Il est toujours égal au spot', 'On le couvre avec le delta'], a: 1, why: 'Le strike est connu et constant pour un contrat donné. Les grecques mesurent l\'exposition à des variables qui bougent.' },
    ], done);
  },
};
