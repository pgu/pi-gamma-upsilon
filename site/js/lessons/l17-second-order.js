import { lineChart } from '../charts.js';
import { greeks, secondOrder } from '../bs.js';
import { controls, quiz, callout, hint, stats, nf, sgn } from '../ui.js';
import { T } from '../glossary.js';

export default {
  id: 'second-order',
  title: 'Grecques de 2ᵉ ordre : vanna, volga, charm',
  blurb: 'Quand les grecques elles-mêmes bougent.',
  minutes: 20,
  html: () => `
    <p class="lead">Delta, vega, gamma… sont des sensibilités à un instant donné. Mais elles <b>changent</b> : quand le spot bouge (gamma), mais aussi quand la volatilité bouge ou que le temps passe. Les grecques de 2ᵉ ordre mesurent ces dérives. Tu n'en as pas besoin pour débuter, mais ce sont elles qui expliquent le « résidu » du P&amp;L explain.</p>

    <table class="tbl">
      <thead><tr><th>Grecque</th><th>Mesure</th><th>En une phrase</th></tr></thead>
      <tbody>
        <tr><td>${T('vanna')}</td><td>∂Δ / ∂σ</td><td>Le delta change quand la vol change.</td></tr>
        <tr><td>${T('volga')}</td><td>∂ν / ∂σ</td><td>Le vega change quand la vol change.</td></tr>
        <tr><td>${T('charm')}</td><td>∂Δ / ∂t</td><td>Le delta change quand le temps passe.</td></tr>
      </tbody>
    </table>
    <div data-controls></div>

    <h2>1. Vanna : delta × volatilité</h2>
    <p>Le graphique compare la courbe de delta à la vol actuelle (pleine) et à <b>+10 points de vol</b> (pointillée). L'écart entre les deux au niveau du spot, c'est le vanna.</p>
    <div data-stats1></div>
    <div data-chart1></div>
    ${callout('try', 'À essayer', `<ul>
      <li>Option <b>OTM</b> (strike au-dessus du spot pour un call) : quand la vol monte, le delta <b>monte</b> (vanna &gt; 0) : plus d'incertitude, plus de chance de finir ITM.</li>
      <li>Option <b>ITM</b> : l'effet s'inverse, le delta baisse quand la vol monte.</li>
      <li>Option <b>ATM</b> : vanna proche de zéro.</li>
    </ul>`)}
    ${hint(`Sur les indices actions, quand le spot baisse, la vol monte (corrélation spot/vol négative). Un book avec du vanna voit donc son delta bouger doublement : par le gamma <em>et</em> par le vanna. Les desks surveillent ce risque pour savoir combien de delta il faudra racheter ou revendre dans un krach.`, 'Pourquoi les desks y tiennent')}

    <h2>2. Volga : la convexité de la vol</h2>
    <p>Le vega n'est pas constant quand σ change. Pour une option ATM il est quasi plat ; pour une option très OTM ou ITM, il <b>grimpe</b> avec la vol. La courbure de cette courbe, c'est le volga.</p>
    <div data-stats2></div>
    <div data-chart2></div>
    ${callout('pro', 'En pratique, sur un desk', `Le volga est le risque de la « vol de vol ». Un trader long strangle (deux ailes OTM) est <b>long volga</b> : si la vol bouge fortement dans un sens ou l'autre, ses options OTM gagnent plus que linéairement. C'est aussi ce qui explique pourquoi les ailes du smile sont plus chères que le modèle plat ne l'indique.`)}

    <h2>3. Charm : le delta qui glisse avec le temps</h2>
    <p>Même si le spot ne bouge pas, ton delta change chaque jour : une option OTM voit son delta tendre vers 0, une option ITM vers ±1.</p>
    <div data-stats3></div>
    <div data-chart3></div>
    ${callout('pro', 'En pratique, sur un desk', `Le vendredi soir, le desk pense au week-end : deux jours de calendrier passent, le delta de couverture dérive (charm), et à l'ouverture du lundi le book n'est plus delta-neutre. Les traders pré-ajustent leur couverture en tenant compte du charm.`)}
    ${callout('info', 'Ordre de grandeur', 'Ces chiffres sont petits (de l\'ordre de 0,001 à 0,01) pour une option unitaire. Ils comptent à l\'échelle d\'un book de plusieurs millions de dollars de vega, ou quand on approche de l\'expiration.')}

    <h2>Quiz</h2>
    <div data-quiz></div>
  `,
  init(root, done) {
    const st = {};
    controls(root.querySelector('[data-controls]'), [
      { key: 'type', type: 'toggle', label: 'Type', value: 'call', options: [{ v: 'call', l: 'Call' }, { v: 'put', l: 'Put' }] },
      { key: 'S', label: 'Spot (S)', min: 70, max: 130, step: 1, value: 100 },
      { key: 'K', label: 'Strike (K)', min: 70, max: 130, step: 1, value: 110 },
      { key: 'days', label: 'Maturité (jours)', min: 5, max: 365, step: 1, value: 60 },
      { key: 'sig', label: 'Volatilité (σ)', min: 8, max: 80, step: 1, value: 25, fmt: (v) => v + ' %' },
    ], () => {
      const { type, S, K, days, sig } = st;
      const o = { S, K, T: days / 365, r: 0.03, sigma: sig / 100, type };
      const so = secondOrder(o);
      const g = greeks(o);

      // Vanna
      const up = greeks({ ...o, sigma: o.sigma + 0.1 });
      const xs = Array.from({ length: 81 }, (_, i) => 60 + (i * 80) / 80);
      root.querySelector('[data-stats1]').innerHTML = stats([
        { k: 'Vanna', v: nf(so.vanna, 4), sub: 'Δ gagné pour +1 pt de vol' },
        { k: 'Delta actuel', v: nf(g.delta, 3) },
        { k: 'Delta si σ + 10 pts', v: nf(up.delta, 3), sub: `${sgn(up.delta - g.delta, 3)} (≈ 10 × vanna)` },
      ]);
      root.querySelector('[data-chart1]').innerHTML = lineChart({
        series: [
          { label: `σ = ${sig} %`, pts: xs.map((x) => [x, greeks({ ...o, S: x }).delta]) },
          { label: `σ = ${sig + 10} %`, color: 1, dash: true, pts: xs.map((x) => [x, greeks({ ...o, S: x, sigma: o.sigma + 0.1 }).delta]) },
        ],
        markers: [{ x: S, y: g.delta, label: 'Δ = ' + nf(g.delta, 2) }],
        vlines: [{ x: K, label: 'K' }],
        xLabel: 'Spot', yLabel: 'Delta',
      });

      // Volga
      const sigs = Array.from({ length: 76 }, (_, i) => 5 + i);
      root.querySelector('[data-stats2]').innerHTML = stats([
        { k: 'Volga', v: nf(so.volga, 5), sub: 'vega gagné pour +1 pt de vol' },
        { k: 'Vega actuel', v: nf(g.vega, 4) },
        { k: 'Vega si σ + 10 pts', v: nf(up.vega, 4), sub: `${sgn(up.vega - g.vega, 4)}` },
      ]);
      root.querySelector('[data-chart2]').innerHTML = lineChart({
        series: [{ label: 'Vega selon la vol', pts: sigs.map((s) => [s, greeks({ ...o, sigma: s / 100 }).vega]) }],
        markers: [{ x: sig, y: g.vega, label: 'ν = ' + nf(g.vega, 3) }],
        xLabel: 'Volatilité (%)', yLabel: 'Vega',
      });

      // Charm
      const sgnK = type === 'call' ? 1 : -1;
      const ds = Array.from({ length: Math.max(days, 3) }, (_, i) => Math.max(days, 3) - i);
      const strikes = [[S - 10 * sgnK, 'ITM', 2], [S, 'ATM', 0], [S + 10 * sgnK, 'OTM', 1]];
      root.querySelector('[data-stats3]').innerHTML = stats([
        { k: 'Charm', v: nf(so.charm, 4), sub: 'variation du delta après 1 jour' },
        { k: 'Delta aujourd\'hui', v: nf(g.delta, 3) },
        { k: 'Delta demain (spot inchangé)', v: nf(g.delta + so.charm, 3) },
      ]);
      root.querySelector('[data-chart3]').innerHTML = lineChart({
        series: strikes.map(([k, l, c]) => ({ label: `${l} (K=${k})`, color: c, pts: ds.map((d) => [d, greeks({ ...o, K: k, T: d / 365 }).delta]) })),
        xReverse: true, xLabel: 'Jours restants (le temps passe →)', yLabel: 'Delta',
      });
    }, st);

    quiz(root.querySelector('[data-quiz]'), [
      { q: 'Quelle grecque mesure le changement de ton <em>delta</em> quand la <em>volatilité</em> bouge ?', opts: ['Gamma', 'Vanna', 'Volga', 'Charm'], a: 1, why: 'Vanna = ∂Δ/∂σ. Gamma est ∂Δ/∂S, charm ∂Δ/∂t, volga ∂ν/∂σ.' },
      { q: 'Tu es long un strangle (deux options OTM). La vol de vol augmente fortement. Tu es probablement…', opts: ['Perdant', 'Gagnant (long volga)', 'Insensible', 'Short vega'], a: 1, why: 'Les ailes OTM ont un vega qui grimpe avec la vol : le P&L est convexe en σ, c\'est du volga positif.' },
      { q: 'Le spot n\'a pas bougé de tout le week-end, mais ton delta d\'option OTM a baissé. C\'est dû au…', opts: ['Vega', 'Rho', 'Charm', 'Gamma'], a: 2, why: 'Charm : le passage du temps fait glisser le delta d\'une option OTM vers 0.' },
    ], done);
  },
};
