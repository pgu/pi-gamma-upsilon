import { lineChart } from '../charts.js';
import { binomial } from '../bs.js';
import { controls, quiz, callout, hint, stats, nf, sgn } from '../ui.js';
import { T } from '../glossary.js';

export default {
  id: 'american',
  title: 'Options américaines & exercice anticipé',
  blurb: 'Quand Black-Scholes ne suffit plus : le droit d\'exercer à tout moment.',
  minutes: 15,
  html: () => `
    <p class="lead">Black-Scholes valorise des options ${T('european', 'européennes')} : exerçables seulement à l'échéance. Beaucoup d'options cotées (actions et ETF américains) sont ${T('american', 'américaines')} : on peut les exercer à <b>tout moment</b>. Ce droit supplémentaire a une valeur : l'option américaine vaut au moins autant que l'européenne.</p>

    <p>Pas de formule fermée dans ce cas. On utilise un ${T('binomial', 'arbre binomial')} : on découpe le temps en pas, le spot monte ou baisse à chaque pas, et on remonte l'arbre en prenant à chaque nœud le <b>maximum</b> entre « garder l'option » et « l'exercer maintenant ».</p>

    <h2>🧪 Playground : américaine vs européenne</h2>
    <div data-controls></div>
    <div data-stats></div>
    <div data-chart></div>
    ${callout('try', 'À essayer', `<ul>
      <li><b>Put, taux 5 %</b> : baisse le spot à 60. La courbe américaine se colle à la valeur intrinsèque (K − S) : <b>l'exercice anticipé est optimal</b>. Le taux d'intérêt sur le strike encaissé tout de suite vaut plus que la valeur temps restante.</li>
      <li><b>Put, taux 0 %</b> : l'avantage américain disparaît presque. Sans intérêts à gagner, attendre ne coûte rien.</li>
      <li><b>Call, dividende 0 %</b> : les deux courbes sont identiques. Un call sans dividende ne s'exerce jamais avant l'échéance (on perdrait la valeur temps pour rien).</li>
      <li><b>Call, dividende 6 %</b> : l'avantage américain apparaît pour les calls très ITM : mieux vaut exercer avant la détente du dividende.</li>
    </ul>`)}
    ${hint(`Intuition : exercer, c'est échanger une option (qui a une valeur temps) contre sa valeur intrinsèque. C'est utile seulement si ce qu'on gagne en le faisant dépasse la valeur temps abandonnée : <b>les intérêts</b> sur le strike (put) ou <b>le dividende</b> manqué (call).`, 'Pourquoi exercer avant l\'échéance ?')}

    <h2>Ce que ça change pour les grecques</h2>
    <ul>
      <li>Les grecques d'une option américaine se calculent sur l'arbre (par bump du spot, de la vol…). Les ordres de grandeur sont proches de Black-Scholes, sauf <b>très ITM</b> où le delta d'un put américain approche −1 plus vite.</li>
      <li>La parité call-put devient une <em>inégalité</em>.</li>
      <li>Les options sur indices (SPX, Euro Stoxx 50) sont généralement <b>européennes</b> ; celles sur actions américaines et ETF sont <b>américaines</b>.</li>
    </ul>

    ${callout('pro', 'En pratique, sur un desk', `<ul>
      <li>Les ${T('earlyex', 'exercices anticipés')} sont surveillés autour des dates de détachement de dividende : un vendeur de call ITM peut se faire « assigner » la veille.</li>
      <li>Les desks utilisent des arbres ou des différences finies pour les américaines, et Black-Scholes comme approximation rapide pour les européennes.</li>
      <li>Un put américain très ITM se comporte presque comme une position vendeuse du sous-jacent : son delta est proche de −1 et son theta change de signe.</li>
    </ul>`)}

    <h2>Quiz</h2>
    <div data-quiz></div>
  `,
  init(root, done) {
    const st = {};
    controls(root.querySelector('[data-controls]'), [
      { key: 'type', type: 'toggle', label: 'Type', value: 'put', options: [{ v: 'put', l: 'Put' }, { v: 'call', l: 'Call' }] },
      { key: 'S', label: 'Spot (S)', min: 50, max: 150, step: 1, value: 80 },
      { key: 'K', label: 'Strike (K)', min: 80, max: 120, step: 1, value: 100 },
      { key: 'days', label: 'Maturité (jours)', min: 30, max: 730, step: 10, value: 365 },
      { key: 'sig', label: 'Volatilité (σ)', min: 10, max: 60, step: 1, value: 25, fmt: (v) => v + ' %' },
      { key: 'r', label: 'Taux (r)', min: 0, max: 8, step: 0.25, value: 5, fmt: (v) => nf(v, 2) + ' %' },
      { key: 'q', label: 'Dividende continu (q)', min: 0, max: 8, step: 0.25, value: 0, fmt: (v) => nf(v, 2) + ' %' },
    ], () => {
      const { type, S, K, days, sig, r, q } = st;
      const o = { S, K, T: days / 365, r: r / 100, sigma: sig / 100, q: q / 100, type };
      const intr = (x) => (type === 'call' ? Math.max(x - K, 0) : Math.max(K - x, 0));
      const am = binomial(o, 150, true);
      const eu = binomial(o, 150, false);
      const prem = am - eu;
      const exercise = am - intr(S) < 0.005;
      root.querySelector('[data-stats]').innerHTML = stats([
        { k: 'Américaine', v: nf(am) },
        { k: 'Européenne', v: nf(eu) },
        { k: 'Prime d\'exercice anticipé', v: nf(Math.max(prem, 0), 3), sub: prem > 0.005 ? 'le droit supplémentaire vaut quelque chose' : 'quasi nulle' },
        { k: 'Exercer maintenant ?', v: exercise ? 'Oui' : 'Non', sub: exercise ? 'valeur = intrinsèque' : 'on garde la valeur temps' },
      ]);

      const xs = Array.from({ length: 101 }, (_, i) => 50 + i);
      const rows = xs.map((x) => ({ x, am: binomial({ ...o, S: x }, 150, true), eu: binomial({ ...o, S: x }, 150, false) }));
      let boundary = null;
      if (type === 'put') {
        const b = rows.filter((p) => p.x < K && p.am - intr(p.x) < 0.005);
        if (b.length) boundary = Math.max(...b.map((p) => p.x));
      } else {
        const b = rows.filter((p) => p.x > K && p.am - intr(p.x) < 0.005);
        if (b.length) boundary = Math.min(...b.map((p) => p.x));
      }
      root.querySelector('[data-chart]').innerHTML = lineChart({
        series: [
          { label: 'Américaine', color: 0, pts: rows.map((p) => [p.x, p.am]) },
          { label: 'Européenne', color: 1, pts: rows.map((p) => [p.x, p.eu]) },
          { label: 'Valeur intrinsèque', color: 2, dash: true, pts: xs.map((x) => [x, intr(x)]) },
        ],
        markers: [{ x: S, y: am, label: nf(am) }],
        vlines: boundary ? [{ x: boundary, label: 'exercice optimal ' + (type === 'put' ? '≤' : '≥') + ' ' + boundary }] : [],
        xLabel: 'Spot', yLabel: 'Prix de l\'option',
      });
    }, st);

    quiz(root.querySelector('[data-quiz]'), [
      { q: 'Un call américain sur une action <em>sans dividende</em> vaut…', opts: ['Plus que le call européen', 'Autant que le call européen', 'Moins que le call européen', 'Zéro'], a: 1, why: 'L\'exercice anticipé ne rapporte rien (on perd la valeur temps et on ne touche aucun dividende) : on ne l\'exerce jamais avant l\'échéance.' },
      { q: 'Pour un put américain très ITM avec des taux élevés, l\'exercice anticipé peut être optimal parce que…', opts: ['Le spot va forcément remonter', 'Le strike encaissé tout de suite rapporte des intérêts', 'La vol est nulle', 'Il n\'y a plus de gamma'], a: 1, why: 'Recevoir K aujourd\'hui plutôt que dans 1 an rapporte les intérêts, ce qui peut dépasser la valeur temps restante.' },
      { q: 'L\'option américaine, comparée à l\'européenne équivalente, vaut…', opts: ['Toujours moins', 'Toujours autant', 'Au moins autant', 'Cela dépend de la couleur du strike'], a: 2, why: 'Elle donne tous les droits de l\'européenne, plus celui d\'exercer plus tôt.' },
    ], done);
  },
};
