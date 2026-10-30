import { lineChart } from '../charts.js';
import { price, greeks } from '../bs.js';
import { smileIV, termIV } from '../market.js';
import { controls, quiz, callout, hint, stats, nf, sgn } from '../ui.js';
import { T } from '../glossary.js';

export default {
  id: 'skew',
  title: 'Marché : smile, skew & term structure',
  blurb: 'Pourquoi l\'IV n\'est pas la même pour tous les strikes.',
  minutes: 15,
  html: () => `
    <p class="lead">Black-Scholes suppose <b>une seule volatilité</b> pour toutes les options du même sous-jacent. Le marché, lui, en utilise une différente pour chaque strike et chaque échéance. Tracer ces IV donne deux formes à connaître.</p>

    <h2>1. Smile / skew : l'IV selon le strike</h2>
    <p>Sur les indices actions, les options de <b>vente OTM</b> (protection contre un krach) sont structurellement plus chères que les calls OTM équivalents : leur IV est plus élevée. La courbe penche vers la gauche : c'est le ${T('skew', 'skew')}. La courbure restante forme le « smile ».</p>
    <p class="note">⚠️ Les chiffres de ce chapitre viennent d'un <b>modèle simulé</b> (illustratif), calé sur l'allure typique d'un indice actions. Ce ne sont pas des données de marché.</p>
    <div data-controls></div>
    <div data-chart></div>
    ${callout('try', 'À essayer', `<ul>
      <li>Mets le skew à 0 et la courbure à 0 : l'IV est plate, c'est l'hypothèse de Black-Scholes.</li>
      <li>Augmente le skew : le put 90 devient bien plus cher en vol que le call 110.</li>
      <li>Ajoute de la courbure : les deux ailes montent, la forme de « sourire » apparaît (typique des devises).</li>
    </ul>`)}

    <h2>Ce que ça change concrètement</h2>
    <p>Prix d'un put 90 à la maturité choisie, selon qu'on utilise une vol plate (l'IV ATM) ou la vol du marché sur ce strike :</p>
    <div data-stats></div>
    ${hint(`Si tu utilises la vol ATM pour pricer un put OTM, tu <b>sous-estimes</b> son prix. Le marché fait payer plus cher la protection, parce que la demande de couverture est forte et que les krachs sont plus brutaux que les hausses (« l'escalier monte, l'ascenseur descend »).`, 'Pourquoi un skew sur les actions ?')}

    <h2>2. Term structure : l'IV selon l'échéance</h2>
    <p>La ${T('termstructure', 'term structure')} montre l'IV ATM pour chaque échéance. En temps normal elle est <b>croissante</b> : l'incertitude s'accumule avec l'horizon. En période de stress, les investisseurs paient cher la protection immédiate : la courbe peut s'<b>inverser</b>.</p>
    <div data-controls2></div>
    <div data-chart2></div>

    ${callout('pro', 'En pratique, sur un desk', `<ul>
      <li>Le skew se cote avec des produits simples : le ${T('riskreversal', 'risk reversal')} 25Δ (IV du call 25Δ − IV du put 25Δ) et le butterfly 25Δ (la courbure).</li>
      <li>Le vega d'un book n'est pas un seul chiffre : on le ventile par <b>strike et échéance</b> (« vega surface »). Une même hausse de vol générale ne bouge pas toute la surface pareil.</li>
      <li>Les grecques calculées à vol plate sont incomplètes : si le spot bouge, l'IV du strike bouge aussi (c'est ce que mesure ${T('vanna', 'vanna')}).</li>
    </ul>`)}

    <h2>Quiz</h2>
    <div data-quiz></div>
  `,
  init(root, done) {
    const s = {};
    const s2 = {};
    const refresh = () => {
      const m = { S: 100, atm: s.atm / 100, skew: s.skew, curv: s.curv, T: s.days / 365 };
      const ks = Array.from({ length: 41 }, (_, i) => 80 + i);
      root.querySelector('[data-chart]').innerHTML = lineChart({
        series: [
          { label: 'IV du marché (simulée)', pts: ks.map((K) => [K, smileIV({ ...m, K }) * 100]) },
          { label: 'Vol plate (Black-Scholes)', color: 1, dash: true, pts: ks.map((K) => [K, m.atm * 100]) },
        ],
        vlines: [{ x: 100, label: 'ATM' }],
        xLabel: 'Strike', yLabel: 'Volatilité implicite (%)', yFmt: (v) => nf(v, 0),
      });
      const o = { S: 100, K: 90, T: m.T, r: 0.03, type: 'put' };
      const iv90 = smileIV({ ...m, K: 90 });
      const flat = greeks({ ...o, sigma: m.atm });
      const mkt = greeks({ ...o, sigma: iv90 });
      root.querySelector('[data-stats]').innerHTML = stats([
        { k: 'IV du put 90', v: nf(iv90 * 100, 1) + ' %', sub: `vs ${nf(m.atm * 100, 1)} % ATM` },
        { k: 'Prix à vol plate', v: nf(flat.price) },
        { k: 'Prix avec le skew', v: nf(mkt.price), sub: `${sgn(mkt.price - flat.price)} (${nf(((mkt.price / flat.price) - 1) * 100, 0)} %)` },
      ]);
      const Ts = Array.from({ length: 60 }, (_, i) => 0.03 + (i * 1.97) / 59);
      root.querySelector('[data-chart2]').innerHTML = lineChart({
        series: [{ label: s2.mode === 'stress' ? 'Marché sous stress (courbe inversée)' : 'Marché calme', pts: Ts.map((t) => [t * 12, termIV(t, s2.mode === 'stress' ? 0.38 : 0.16, 0.22) * 100]) }],
        xLabel: 'Échéance (mois)', yLabel: 'IV ATM (%)', yFmt: (v) => nf(v, 0),
      });
    };
    controls(root.querySelector('[data-controls]'), [
      { key: 'atm', label: 'IV ATM', min: 10, max: 50, step: 1, value: 20, fmt: (v) => v + ' %' },
      { key: 'skew', label: 'Skew', min: 0, max: 1, step: 0.05, value: 0.4, fmt: (v) => nf(v, 2), hint: 'Pente : de combien l\'IV monte quand le strike baisse. 0 = pas de skew.' },
      { key: 'curv', label: 'Courbure (smile)', min: 0, max: 4, step: 0.25, value: 1, fmt: (v) => nf(v, 2) },
      { key: 'days', label: 'Maturité (jours)', min: 7, max: 365, step: 1, value: 60 },
    ], refresh, s);
    controls(root.querySelector('[data-controls2]'), [
      { key: 'mode', type: 'toggle', label: 'Régime de marché', value: 'calm', options: [{ v: 'calm', l: 'Calme' }, { v: 'stress', l: 'Stress' }] },
    ], refresh, s2);

    quiz(root.querySelector('[data-quiz]'), [
      { q: 'Sur un indice actions, comparé à un call OTM 110, l\'IV d\'un put OTM 90 est généralement…', opts: ['Plus basse', 'Identique', 'Plus haute', 'Nulle'], a: 2, why: 'La demande de protection contre la baisse tire l\'IV des puts OTM vers le haut : c\'est le skew.' },
      { q: 'Tu pricées un put OTM avec la vol ATM alors que le marché cote une IV plus haute sur ce strike. Ton prix est…', opts: ['Trop élevé', 'Trop bas', 'Exact', 'Sans rapport'], a: 1, why: 'Le prix croît avec σ ; utiliser un σ trop faible sous-estime le prix.' },
      { q: 'Une term structure inversée (IV court terme > IV long terme) signale plutôt…', opts: ['Un marché très calme', 'Un stress à court terme', 'Une erreur de cotation', 'Des taux négatifs'], a: 1, why: 'Les investisseurs paient cher la protection immédiate, l\'incertitude du moment dépasse celle à long terme.' },
    ], done);
  },
};
