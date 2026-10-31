import { lineChart } from '../charts.js';
import { greeks, price } from '../bs.js';
import { controls, quiz, callout, hint, stats, nf } from '../ui.js';
import { T } from '../glossary.js';

export default {
  id: 'rho',
  title: 'Rho (ρ)',
  blurb: 'La sensibilité aux taux d\'intérêt.',
  minutes: 10,
  html: () => `
    <p class="lead">Le ${T('rho')} répond à : <b>« si les taux montent de 1 point, de combien l'option gagne-t-elle ? »</b></p>

    <p class="formula">ρ = ∂V / ∂r  <small>(affiché pour +1 point de taux)</small></p>
    <ul>
      <li>Rho est <b>positif pour un call</b> et <b>négatif pour un put</b> : un taux plus haut renchérit le forward (donc le call) et diminue la valeur actualisée du strike que l'on reçoit en exerçant un put.</li>
      <li>Il est <b>faible</b> pour les échéances courtes et <b>significatif pour les longues</b> (les ${T('leaps', 'LEAPS')}).</li>
    </ul>

    <h2>🧪 Playground : prix vs taux</h2>
    <div data-controls></div>
    <div data-stats></div>
    <div data-chart></div>
    ${callout('try', 'À essayer', `<ul>
      <li>Avec 30 jours : la courbe est quasi plate (rho ≈ 0). Passe à 2 ans : la pente devient visible.</li>
      <li>Passe de Call à Put : la pente change de signe.</li>
    </ul>`)}
    ${hint(`Pendant des années de taux à zéro, tout le monde ignorait rho. Depuis 2022, avec des taux à 4-5 %, il compte à nouveau pour les options longues et les produits structurés.`, 'Pourquoi on en parle à nouveau')}

    ${callout('pro', 'En pratique, sur un desk', `Le risque de taux d'un book d'options actions est généralement mineur et souvent couvert avec des futures ou swaps de taux. Les desks qui gèrent de longues maturités (produits structurés, LEAPS) suivent rho de près.`)}

    ${callout('info', 'Pour aller plus loin', `Les cinq grecques vues jusqu'ici suffisent pour comprendre 90 % du métier. La leçon suivante présente les grecques de 2ᵉ ordre (${T('vanna')}, ${T('volga')}, ${T('charm')}) : celles qui mesurent comment delta et vega eux-mêmes bougent.`)}

    <h2>Quiz</h2>
    <div data-quiz></div>
  `,
  init(root, done) {
    controls(root.querySelector('[data-controls]'), [
      { key: 'type', type: 'toggle', label: 'Type', value: 'call', options: [{ v: 'call', l: 'Call' }, { v: 'put', l: 'Put' }] },
      { key: 'K', label: 'Strike (K)', min: 70, max: 130, step: 1, value: 100 },
      { key: 'days', label: 'Maturité (jours)', min: 5, max: 1095, step: 5, value: 365 },
      { key: 'sig', label: 'Volatilité (σ)', min: 5, max: 80, step: 1, value: 25, fmt: (v) => v + ' %' },
      { key: 'r', label: 'Taux actuel (r)', min: 0, max: 10, step: 0.25, value: 3, fmt: (v) => nf(v, 2) + ' %' },
    ], ({ type, K, days, sig, r }) => {
      const o = { S: 100, K, T: days / 365, r: r / 100, sigma: sig / 100, type };
      const g = greeks(o);
      root.querySelector('[data-stats]').innerHTML = stats([
        { k: 'Rho', v: nf(g.rho, 4), sub: 'prix gagné pour +1 pt de taux' },
        { k: 'Prix', v: nf(g.price) },
        { k: 'Prix si r + 1 pt', v: nf(price({ ...o, r: o.r + 0.01 })) },
      ]);
      const rs = Array.from({ length: 81 }, (_, i) => i * 0.125);
      root.querySelector('[data-chart]').innerHTML = lineChart({
        series: [{ label: 'Prix', pts: rs.map((x) => [x, price({ ...o, r: x / 100 })]) }],
        markers: [{ x: r, y: g.price, label: nf(g.price) }],
        xLabel: 'Taux sans risque (%)', yLabel: 'Prix de l\'option',
      });
    });

    quiz(root.querySelector('[data-quiz]'), [
      { q: 'Les taux montent. Toutes choses égales, le call…', opts: ['Gagne de la valeur, le put en perd', 'Perd de la valeur, le put en gagne', 'Les deux gagnent', 'Rien ne change'], a: 0, why: 'ρ > 0 pour un call, ρ < 0 pour un put.' },
      { q: 'Où rho est-il le plus important ?', opts: ['Option à 3 jours', 'Option ATM à 1 mois', 'Option à 2 ans', 'Option très OTM à 1 semaine'], a: 2, why: 'Rho croît avec l\'échéance (ρ ∝ K·T·e^(−rT)·N(d₂)).' },
      { q: 'Rho d\'un call = 0,40 par point de taux. Les taux montent de 0,5 point. Variation de prix ?', opts: ['+0,05', '+0,10', '+0,20', '+0,40'], a: 2, why: '0,40 × 0,5 = +0,20.' },
    ], done);
  },
};
