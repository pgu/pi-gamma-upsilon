import { lineChart } from '../charts.js';
import { price, impliedVol, greeks } from '../bs.js';
import { controls, quiz, callout, hint, stats, nf, sgn } from '../ui.js';
import { T } from '../glossary.js';

export default {
  id: 'iv',
  title: 'Marché : la volatilité implicite',
  blurb: 'Retrouver σ à partir d\'un prix de marché.',
  minutes: 12,
  html: () => `
    <p class="lead">Jusqu'ici on a fourni σ à Black-Scholes pour obtenir un prix. Sur un marché réel, c'est <b>l'inverse</b> : le prix est observé (cotation), et on cherche le σ qui le reproduit. C'est la ${T('iv', 'volatilité implicite (IV)')}.</p>

    <p>Comme le prix augmente de façon monotone avec σ (le vega est positif), il existe un seul σ possible pour un prix donné. On le trouve par dichotomie : on essaie un σ, on compare le prix obtenu au prix du marché, on corrige, et on recommence.</p>

    <h2>🧪 Playground : le détecteur d'IV</h2>
    <p>Tu es devant ton écran, l'option est cotée à un certain prix. Quelle vol le marché « met » dedans ?</p>
    <div data-controls></div>
    <div data-stats></div>
    <div data-chart></div>
    ${callout('try', 'À essayer', `<ul>
      <li>Monte le prix du marché sans toucher au reste : l'IV monte. <b>Monter le prix, c'est monter l'IV</b> ; les traders disent d'ailleurs « l'option est chère » ou « la vol est chère ».</li>
      <li>Descends le prix sous la valeur intrinsèque : le message « aucun σ ne convient » apparaît. Le marché ne peut pas coter une option sous sa valeur intrinsèque actualisée (arbitrage).</li>
      <li>Regarde le vega affiché : c'est la pente de la courbe au point de l'IV. Plus il est élevé, plus un petit écart de prix correspond à un petit écart de vol.</li>
    </ul>`)}
    ${hint(`Le prix en euros ne permet pas de comparer deux options (strikes, échéances différents). L'IV, si : c'est une unité commune, comme le prix au kilo pour comparer des produits de poids différents.`, 'Pourquoi coter en vol ?')}

    <h2>IV vs vol réalisée</h2>
    <p>L'IV est une <b>anticipation</b> de la volatilité future ; la ${T('rv', 'vol réalisée')} est ce qui se passe vraiment. Elles diffèrent presque toujours. En moyenne l'IV est un peu supérieure à la vol réalisée qui suit : c'est la ${T('vrp', 'variance risk premium')}, la rémunération du vendeur d'options pour le risque qu'il porte.</p>
    <p>Rappelle-toi la leçon sur le delta-hedging : acheter de l'option, c'est parier que <em>vol réalisée &gt; IV payée</em>.</p>

    ${callout('pro', 'En pratique, sur un desk', `<ul>
      <li>Les ${T('marketmaker', 'market makers')} cotent en vol : « 22,5 bid / 23,5 offer ». Le prix est dérivé de ce chiffre par Black-Scholes.</li>
      <li>On compare l'IV actuelle à son historique (percentile, « IV rank ») pour savoir si les options sont chères ou bon marché par rapport à leur propre passé.</li>
      <li>Des indices comme le VIX sont des moyennes d'IV : le « fear gauge » du marché.</li>
    </ul>`)}
    ${callout('warn', 'Attention', 'L\'IV n\'est pas une prévision fiable : c\'est un prix, déterminé par l\'offre et la demande (besoin de couverture, aversion au risque…). Elle contient la prime de risque, pas seulement l\'espérance de vol.')}

    <h2>Quiz</h2>
    <div data-quiz></div>
  `,
  init(root, done) {
    controls(root.querySelector('[data-controls]'), [
      { key: 'type', type: 'toggle', label: 'Type', value: 'call', options: [{ v: 'call', l: 'Call' }, { v: 'put', l: 'Put' }] },
      { key: 'K', label: 'Strike (K)', min: 80, max: 120, step: 1, value: 100 },
      { key: 'days', label: 'Maturité (jours)', min: 7, max: 365, step: 1, value: 30 },
      { key: 'mkt', label: 'Prix coté sur le marché', min: 0.1, max: 25, step: 0.05, value: 2.4, fmt: (v) => nf(v, 2), hint: 'Le prix que tu lis sur l\'écran de cotation (milieu bid/ask).' },
    ], ({ type, K, days, mkt }) => {
      const o = { S: 100, K, T: days / 365, r: 0.03, type };
      const iv = impliedVol(mkt, o);
      const el = root.querySelector('[data-stats]');
      const chart = root.querySelector('[data-chart]');
      const sigs = Array.from({ length: 96 }, (_, i) => 5 + i);
      const curve = { label: 'Prix Black-Scholes selon σ', pts: sigs.map((s) => [s, price({ ...o, sigma: s / 100 })]) };
      if (iv === null) {
        el.innerHTML = callout('warn', 'Aucun σ ne convient', 'Ce prix est en dessous de la valeur intrinsèque actualisée (ou au-dessus du maximum théorique) : il ne peut pas exister sur un marché sans arbitrage.');
        chart.innerHTML = lineChart({ series: [curve], xLabel: 'Volatilité (%)', yLabel: 'Prix de l\'option' });
        return;
      }
      const g = greeks({ ...o, sigma: iv });
      const atmIv = 0.2;
      el.innerHTML = stats([
        { k: 'Volatilité implicite', v: nf(iv * 100, 2) + ' %' },
        { k: 'Vega à cette vol', v: nf(g.vega, 4), sub: 'prix par point de vol' },
        { k: 'Delta', v: nf(g.delta, 3) },
        { k: 'Vs 20 % de vol « normale »', v: sgn((iv - atmIv) * 100, 1) + ' pts', sub: iv > atmIv ? 'option chère' : 'option bon marché' },
      ]);
      chart.innerHTML = lineChart({
        series: [curve, { label: 'Prix du marché', color: 1, dash: true, pts: [[5, mkt], [100, mkt]] }],
        markers: [{ x: iv * 100, y: mkt, label: 'IV = ' + nf(iv * 100, 1) + ' %' }],
        xLabel: 'Volatilité (%)', yLabel: 'Prix de l\'option',
      });
    });

    quiz(root.querySelector('[data-quiz]'), [
      { q: 'La volatilité implicite, c\'est…', opts: ['La volatilité passée de l\'actif', 'La vol que le marché « met » dans le prix de l\'option', 'Une prévision garantie', 'Un chiffre fixé par la bourse'], a: 1, why: 'On inverse Black-Scholes : l\'IV est le σ qui redonne le prix observé.' },
      { q: 'Le prix d\'une option monte, spot et temps inchangés. L\'IV…', opts: ['Monte', 'Baisse', 'Reste identique', 'Dépend du strike'], a: 0, why: 'Le prix est croissant en σ (vega > 0) : un prix plus haut correspond à un σ plus haut.' },
      { q: 'Tu as vendu une option à 30 % d\'IV, couvert en delta. La vol réalisée a été de 22 %. Résultat probable ?', opts: ['Perte', 'Gain', 'Zéro exactement', 'On ne peut pas savoir'], a: 1, why: 'Tu as vendu de la vol plus chère que celle effectivement délivrée : P&L ≈ ½·Γ·S²·(σ_imp² − σ_réal²) > 0.' },
    ], done);
  },
};
