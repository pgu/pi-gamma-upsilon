import { lineChart } from '../charts.js';
import { greeks, price } from '../bs.js';
import { controls, quiz, callout, hint, stats, nf, sgn } from '../ui.js';
import { T } from '../glossary.js';

const S0 = 100;
const R = 0.03;

const straddle = (S, T, sigma) =>
  price({ S, K: S0, T, r: R, sigma, type: 'call' }) + price({ S, K: S0, T, r: R, sigma, type: 'put' });

export default {
  id: 'earnings',
  title: 'Marché : earnings & IV crush',
  blurb: 'Pourquoi avoir raison sur le mouvement ne suffit pas.',
  minutes: 15,
  html: () => `
    <p class="lead">Une entreprise publie ses ${T('earnings', 'résultats')} demain soir. Le marché sait qu'il y aura un gros mouvement mais pas dans quel sens : l'IV monte avant l'événement, puis <b>s'effondre juste après</b>, quel que soit le résultat. C'est l'${T('ivcrush', 'IV crush')}.</p>

    <p>Test : tu achètes un ${T('straddle', 'straddle')} ATM la veille de la publication. L'action bouge de 4 % le lendemain. Gagnes-tu ?</p>

    <h2>🧪 Simulateur d'événement</h2>
    <p>Le straddle est acheté la veille (échéance proche), puis revalorisé le lendemain, après l'annonce.</p>
    <div data-controls></div>
    <div data-stats></div>
    <div data-chart></div>
    ${callout('try', 'À essayer', `<ul>
      <li>Laisse l'IV après = l'IV avant (courbe bleue) : la perte à spot immobile se limite à un jour de theta, et le trade gagne dès que le mouvement dépasse un point mort proche du mouvement implicite. C'est le scénario « sans crush » que les débutants ont en tête.</li>
      <li>Remets une IV après plus basse : la courbe orange descend. Il faut un mouvement <b>beaucoup plus grand</b> pour atteindre le point mort.</li>
      <li>Compare le <b>mouvement implicite</b> (affiché) et le <b>point mort après crush</b> : l'acheteur gagne uniquement si le mouvement réel dépasse environ le mouvement implicite.</li>
    </ul>`)}
    ${hint(`Décomposition : l'acheteur de straddle est long gamma (il gagne quand le spot bouge) et long vega (il perd quand l'IV chute). Le jour de l'annonce, les deux effets se battent. La vol « déjà payée » dans le prix à l'entrée est précisément celle qui disparaît.`, 'Pourquoi ce piège ?')}

    <h2>Qui est en face ?</h2>
    <p>Le <b>vendeur</b> du straddle encaisse la prime et profite du crush. Il perd si le mouvement réel dépasse le mouvement implicite. Son risque est un <em>gap</em> : pas de possibilité de rebalancer le delta pendant la nuit. Ce risque s'ajoute au P&amp;L (voir leçon delta-hedging).</p>

    ${callout('pro', 'En pratique, sur un desk', `<ul>
      <li>Les traders comparent le <b>mouvement implicite</b> aux mouvements <em>historiques</em> du titre lors des 8 ou 12 dernières publications : si le marché price ±6 % mais le titre a bougé de ±3 % en moyenne, les options sont « chères » (et inversement).</li>
      <li>Une IV « haute » avant un événement n'est pas une anomalie : une partie du prix est la prime d'événement. On parle de « vol d'événement » à isoler de la vol de fond.</li>
      <li>L'effet vaut aussi pour les banques centrales, les élections, les décisions réglementaires…</li>
    </ul>`)}

    <h2>Quiz</h2>
    <div data-quiz></div>
  `,
  init(root, done) {
    controls(root.querySelector('[data-controls]'), [
      { key: 'days', label: 'Maturité à l\'achat (jours)', min: 2, max: 30, step: 1, value: 7 },
      { key: 'pre', label: 'IV avant l\'annonce', min: 20, max: 120, step: 1, value: 60, fmt: (v) => v + ' %' },
      { key: 'post', label: 'IV après l\'annonce', min: 15, max: 120, step: 1, value: 30, fmt: (v) => v + ' %' },
      { key: 'move', label: 'Mouvement réel du spot', min: -20, max: 20, step: 0.5, value: 4, fmt: (v) => sgn(v, 1) + ' %' },
    ], ({ days, pre, post, move }) => {
      const T0 = days / 365;
      const T1 = Math.max(days - 1, 0.01) / 365;
      const cost = straddle(S0, T0, pre / 100);
      const after = (x, iv) => straddle(S0 * (1 + x / 100), T1, iv / 100);
      const pnl = (x, iv) => after(x, iv) - cost;
      const real = pnl(move, post);
      const g0 = greeks({ S: S0, K: S0, T: T0, r: R, sigma: pre / 100, type: 'call' });
      const g1 = greeks({ S: S0, K: S0, T: T0, r: R, sigma: pre / 100, type: 'put' });
      const vegaPnl = (g0.vega + g1.vega) * (post - pre);

      const xs = Array.from({ length: 101 }, (_, i) => -25 + i * 0.5);
      const root0 = (iv) => {
        const up = xs.find((x) => x >= 0 && pnl(x, iv) >= 0);
        const dn = [...xs].reverse().find((x) => x <= 0 && pnl(x, iv) >= 0);
        return { up, dn };
      };
      const be = root0(post);
      const fmtBE = (b) => `${b.dn === undefined ? '< −25' : sgn(b.dn, 1)} % / ${b.up === undefined ? '> +25' : sgn(b.up, 1)} %`;

      root.querySelector('[data-stats]').innerHTML = stats([
        { k: 'Prix du straddle à l\'entrée', v: nf(cost), sub: `mouvement implicite ±${nf((cost / S0) * 100, 1)} %` },
        { k: 'P&L du lendemain', v: sgn(real), sub: real >= 0 ? 'gagnant' : 'perdant' },
        { k: 'dont effet vol (≈ vega × Δσ)', v: sgn(vegaPnl), sub: 'le crush' },
        { k: 'Points morts après crush', v: fmtBE(be), sub: 'mouvement nécessaire' },
      ]);
      root.querySelector('[data-chart]').innerHTML = lineChart({
        series: [
          { label: `P&L si l'IV tombe à ${post} %`, color: 1, pts: xs.map((x) => [x, pnl(x, post)]) },
          { label: `P&L si l'IV reste à ${pre} %`, color: 0, dash: true, pts: xs.map((x) => [x, pnl(x, pre)]) },
        ],
        markers: [{ x: move, y: real, label: sgn(real) }],
        xLabel: 'Mouvement du spot le lendemain (%)', yLabel: 'P&L du straddle',
      });
    });

    quiz(root.querySelector('[data-quiz]'), [
      { q: 'Tu achètes un straddle la veille des résultats, l\'IV passe de 60 % à 30 % et le spot bouge moins que le mouvement implicite. Résultat probable ?', opts: ['Gain', 'Perte', 'Zéro', 'Impossible'], a: 1, why: 'Tu perds du vega (IV crush) et le mouvement ne compense pas : le P&L est négatif.' },
      { q: 'Pourquoi l\'IV monte-t-elle avant l\'annonce ?', opts: ['Les taux montent', 'L\'incertitude sur un saut de prix connu à l\'avance augmente la demande d\'options', 'Les marchés sont fermés', 'Le delta augmente'], a: 1, why: 'Un événement binaire attendu ajoute de la variance aux prix : les options l\'intègrent, puis la libèrent une fois l\'incertitude levée.' },
      { q: 'Le vendeur d\'un straddle avant les résultats gagne si…', opts: ['Le mouvement réel est inférieur au mouvement implicite', 'Le mouvement réel est supérieur au mouvement implicite', 'L\'IV monte après l\'annonce', 'Le delta est positif'], a: 0, why: 'Il a encaissé le prix du mouvement implicite ; il gagne si le mouvement réel est plus petit (et que l\'IV chute).' },
    ], done);
  },
};
