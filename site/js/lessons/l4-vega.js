import { lineChart } from '../charts.js';
import { greeks, price } from '../bs.js';
import { controls, quiz, callout, hint, stats, nf, sgn } from '../ui.js';
import { T } from '../glossary.js';

export default {
  id: 'vega',
  title: 'Vega (ν)',
  blurb: 'La sensibilité à la volatilité — le vrai moteur du prix.',
  minutes: 12,
  html: () => `
    <p class="lead">Le ${T('vega')} répond à : <b>« si la volatilité monte de 1 point (ex. 25 % → 26 %), de combien l'option gagne-t-elle ? »</b> (Vega n'est pas une lettre grecque : c'est un nom d'usage, souvent noté ν.)</p>

    <p class="formula">ν = ∂V / ∂σ  <small>(affiché ici pour +1 point de vol)</small></p>
    <ul>
      <li>Vega est <b>positif pour un acheteur</b> d'option, call ou put : plus d'incertitude, plus de valeur.</li>
      <li>Call et put de même strike/échéance ont le <b>même vega</b>.</li>
      <li>Il est maximal ${T('atm')} et <b>croît avec l'échéance</b> (≈ √T) : une option à 2 ans est bien plus sensible à la vol qu'une option à 1 semaine.</li>
    </ul>

    <h2>🧪 Playground : prix vs volatilité</h2>
    <div data-controls></div>
    <div data-stats></div>
    <div data-chart></div>
    <div data-chart2></div>
    ${callout('try', 'À essayer', `<ul>
      <li>Premier graphique : le prix est quasi linéaire en σ pour une option ATM. La pente <em>est</em> le vega.</li>
      <li>Second graphique : compare le vega d'une option à 30 jours et à 1 an. Pour te couvrir contre une vol qui monte, quelle échéance achètes-tu ?</li>
    </ul>`)}
    ${hint(`Pourquoi la vol augmente le prix d'un call <em>et</em> d'un put ? Parce que l'acheteur a un gain illimité d'un côté et une perte limitée à la premium de l'autre. Plus le spot est volatil, plus les scénarios extrêmes (qui rapportent) sont probables, sans que le pire scénario s'aggrave.`)}

    <h2>IV vs volatilité réalisée</h2>
    <p>Dans Black-Scholes, σ est un input. Sur le marché on fait l'inverse : on observe le prix et on en déduit la <b>${T('iv', 'volatilité implicite')}</b>. Elle est comparée à la ${T('rv', 'volatilité réalisée')}, ce que l'underlying fait vraiment. <em>Acheter une option, c'est acheter de la vol à l'IV ; on gagne si la vol réalisée est plus haute.</em></p>

    ${callout('pro', 'En pratique, sur un desk', `<ul>
      <li>Les risques vega sont suivis par <b>buckets d'échéance</b> (1m, 3m, 1y…) : la vol court terme et long terme ne bougent pas ensemble.</li>
      <li>Avant des résultats d'entreprise, l'IV monte ; juste après, elle s'effondre : c'est l'${T('ivcrush', 'IV crush')}. Un acheteur de call peut avoir raison sur le sens et quand même perdre, parce que le vega fait mal.</li>
      <li>Sur le marché, l'IV dépend du strike (le ${T('skew', 'skew / smile')}). Le vega affiché ici suppose une vol unique — c'est une simplification.</li>
    </ul>`)}
    ${callout('warn', 'Unité', 'Les plateformes affichent vega « pour 1 point de vol » (comme ici) ou « pour 1.00 de vol » (×100). Vérifie toujours la convention avant de comparer deux chiffres.')}

    <h2>Quiz</h2>
    <div data-quiz></div>
  `,
  init(root, done) {
    controls(root.querySelector('[data-controls]'), [
      { key: 'type', type: 'toggle', label: 'Type', value: 'call', options: [{ v: 'call', l: 'Call' }, { v: 'put', l: 'Put' }] },
      { key: 'S', label: 'Spot (S)', min: 70, max: 130, step: 1, value: 100 },
      { key: 'K', label: 'Strike (K)', min: 70, max: 130, step: 1, value: 100 },
      { key: 'days', label: 'Maturité (jours)', min: 5, max: 730, step: 1, value: 60 },
      { key: 'sig', label: 'Volatilité (σ)', min: 5, max: 100, step: 1, value: 25, fmt: (v) => v + ' %' },
    ], ({ type, S, K, days, sig }) => {
      const o = { S, K, T: days / 365, r: 0.03, sigma: sig / 100, type };
      const g = greeks(o);
      const up = price({ ...o, sigma: o.sigma + 0.01 }) - g.price;
      root.querySelector('[data-stats]').innerHTML = stats([
        { k: 'Vega', v: nf(g.vega, 4), sub: 'prix gagné pour +1 pt de vol' },
        { k: 'Prix', v: nf(g.price) },
        { k: 'Prix si σ + 1 pt', v: nf(g.price + up), sub: `exact : ${sgn(up, 4)}` },
      ]);
      const sigs = Array.from({ length: 96 }, (_, i) => 5 + i);
      root.querySelector('[data-chart]').innerHTML = lineChart({
        series: [{ label: 'Prix', pts: sigs.map((s) => [s, price({ ...o, sigma: s / 100 })]) }],
        markers: [{ x: sig, y: g.price, label: nf(g.price) }],
        xLabel: 'Volatilité (%)', yLabel: 'Prix de l\'option',
      });
      const xs = Array.from({ length: 81 }, (_, i) => 60 + (i * 80) / 80);
      root.querySelector('[data-chart2]').innerHTML = lineChart({
        series: [
          { label: '30 jours', color: 1, pts: xs.map((x) => [x, greeks({ ...o, S: x, T: 30 / 365 }).vega]) },
          { label: `${days} jours`, color: 0, pts: xs.map((x) => [x, greeks({ ...o, S: x }).vega]) },
          { label: '1 an', color: 2, pts: xs.map((x) => [x, greeks({ ...o, S: x, T: 1 }).vega]) },
        ],
        markers: [{ x: S, y: g.vega, label: 'ν = ' + nf(g.vega, 3) }],
        vlines: [{ x: K, label: 'K' }],
        xLabel: 'Spot', yLabel: 'Vega',
      });
    });

    quiz(root.querySelector('[data-quiz]'), [
      { q: 'Call et put, même strike et même échéance : leur vega ?', opts: ['Identique', 'Opposé', 'Nul pour le put', 'Double pour le call'], a: 0, why: 'La vol augmente la valeur d\'un call comme d\'un put dans les mêmes proportions (parité call-put).' },
      { q: 'Ton option a un vega de 0,12. La vol implicite passe de 20 % à 23 %. Variation de prix ?', opts: ['+0,04', '+0,12', '+0,36', '+3,60'], a: 2, why: '0,12 par point × 3 points = +0,36 (approximation linéaire).' },
      { q: 'Veille de publication de résultats : tu es long un call, l\'IV est élevée. Après l\'annonce l\'IV s\'effondre. Que se passe-t-il ?', opts: ['Tu gagnes grâce au delta uniquement', 'Tu perds du vega (IV crush), même si le spot ne bouge pas', 'Rien, la vol n\'affecte pas les calls', 'Tu gagnes du theta'], a: 1, why: 'Long vega + baisse de vol = perte. Le spot doit bouger assez pour compenser.' },
    ], done);
  },
};
