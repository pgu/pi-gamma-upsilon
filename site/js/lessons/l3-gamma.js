import { lineChart } from '../charts.js';
import { greeks } from '../bs.js';
import { controls, quiz, callout, hint, stats, nf, sgn } from '../ui.js';
import { T } from '../glossary.js';

export default {
  id: 'gamma',
  title: 'Gamma (Γ)',
  blurb: 'La courbure : à quelle vitesse le delta change.',
  minutes: 15,
  html: () => `
    <p class="lead">Le ${T('gamma')} est la <b>dérivée du delta</b> : « si le spot gagne 1, de combien le delta change-t-il ? » C'est la grecque du <em>risque de couverture</em>.</p>

    <p class="formula">Γ = ∂Δ / ∂S = ∂²V / ∂S²</p>
    <ul>
      <li>Gamma est <b>toujours positif pour un acheteur</b> d'option (call ou put) et négatif pour un vendeur.</li>
      <li>Call et put de même strike/échéance ont <b>le même gamma</b>.</li>
      <li>Il est maximal ${T('atm')} et <b>explose quand l'expiration approche</b> : le delta passe brutalement de 0 à 1 autour du strike.</li>
    </ul>

    <h2>🧪 Playground 1 : où vit le gamma ?</h2>
    <div data-controls></div>
    <div data-chart></div>
    ${callout('try', 'À essayer', `<ul>
      <li>Compare les trois courbes : plus l'échéance est proche, plus le pic est haut <em>et étroit</em>. Une option à 2 jours ATM est extrêmement instable.</li>
      <li>Éloigne le spot du strike : le gamma s'effondre. Une option très OTM ou très ITM est « stable ».</li>
    </ul>`)}

    <h2>🧪 Playground 2 : le gamma corrige le delta</h2>
    <p>Le spot bouge de ΔS. Le delta change… de combien ? Gamma donne la réponse : Δ<sub>nouveau</sub> ≈ Δ + Γ × ΔS.</p>
    <div data-controls2></div>
    <div data-stats></div>
    ${hint(`Prix après mouvement ≈ <b>Δ·ΔS + ½·Γ·ΔS²</b>. Le premier terme est linéaire (delta), le second est le gain de « convexité » : il est <em>toujours positif pour un acheteur</em>, que le spot monte ou baisse. C'est pour ça qu'être long gamma est agréable… mais pas gratuit (voir theta).`, 'La formule de P&L')}

    ${callout('pro', 'En pratique, sur un desk', `<ul>
      <li><b>Long gamma</b> : chaque mouvement te fait gagner (tu achètes bas, tu vends haut en rééquilibrant ton delta). Tu paies ça en ${T('theta')}. C'est le ${T('gammascalping', 'gamma scalping')}.</li>
      <li><b>Short gamma</b> : tu encaisses du theta tant que le marché est calme, mais un gros mouvement te coûte cher, et tu dois acheter quand ça monte, vendre quand ça baisse. C'est la situation du vendeur d'options.</li>
      <li>Autour de l'expiration, le ${T('pinrisk', 'pin risk')} : si le spot est collé au strike, le delta peut passer de 0 à 1 en quelques ticks.</li>
    </ul>`)}

    <h2>Quiz</h2>
    <div data-quiz></div>
  `,
  init(root, done) {
    const chart = root.querySelector('[data-chart]');
    const s1 = {};
    const s2 = {};
    const refresh = () => {
      const { type, S, K, days, sig } = s1;
      const o = { S, K, T: days / 365, r: 0.03, sigma: sig / 100, type };
      const xs = Array.from({ length: 101 }, (_, i) => 60 + (i * 80) / 100);
      const d2 = Math.max(1, Math.round(days / 4));
      const d3 = Math.max(1, Math.round(days / 16));
      const g = greeks(o);
      chart.innerHTML = lineChart({
        series: [
          { label: `${days} j`, color: 0, pts: xs.map((x) => [x, greeks({ ...o, S: x }).gamma]) },
          { label: `${d2} j`, color: 1, pts: xs.map((x) => [x, greeks({ ...o, S: x, T: d2 / 365 }).gamma]) },
          { label: `${d3} j`, color: 2, pts: xs.map((x) => [x, greeks({ ...o, S: x, T: d3 / 365 }).gamma]) },
        ],
        markers: [{ x: S, y: g.gamma, label: 'Γ = ' + nf(g.gamma, 4) }],
        vlines: [{ x: K, label: 'K' }],
        xLabel: 'Spot', yLabel: 'Gamma',
        yFmt: (v) => nf(v, 3),
      });
      const dS = s2.dS ?? 5;
      const gNew = greeks({ ...o, S: S + dS });
      const approx = g.delta + g.gamma * dS;
      root.querySelector('[data-stats]').innerHTML = stats([
        { k: 'Delta actuel', v: nf(g.delta, 3) },
        { k: `Delta si spot ${sgn(dS, 0)}`, v: nf(gNew.delta, 3), sub: 'valeur exacte' },
        { k: 'Approx. Δ + Γ·ΔS', v: nf(approx, 3), sub: `erreur ${nf(Math.abs(approx - gNew.delta), 4)}` },
        { k: 'Sans gamma (Δ seul)', v: nf(g.delta, 3), sub: `erreur ${nf(Math.abs(g.delta - gNew.delta), 4)}` },
      ]);
    };
    controls(root.querySelector('[data-controls]'), [
      { key: 'type', type: 'toggle', label: 'Type', value: 'call', options: [{ v: 'call', l: 'Call' }, { v: 'put', l: 'Put' }] },
      { key: 'S', label: 'Spot (S)', min: 70, max: 130, step: 1, value: 100 },
      { key: 'K', label: 'Strike (K)', min: 70, max: 130, step: 1, value: 100 },
      { key: 'days', label: 'Maturité (jours)', min: 2, max: 365, step: 1, value: 60 },
      { key: 'sig', label: 'Volatilité (σ)', min: 5, max: 80, step: 1, value: 25, fmt: (v) => v + ' %' },
    ], refresh, s1);
    controls(root.querySelector('[data-controls2]'), [
      { key: 'dS', label: 'Mouvement du spot (ΔS)', min: -20, max: 20, step: 1, value: 5, fmt: (v) => sgn(v, 0) },
    ], refresh, s2);

    quiz(root.querySelector('[data-quiz]'), [
      { q: 'Où le gamma est-il le plus élevé ?', opts: ['Option très OTM, longue échéance', 'Option très ITM', 'Option ATM proche de l\'expiration', 'Option ATM très longue échéance'], a: 2, why: 'Gamma = pic étroit et haut autour du strike, d\'autant plus que l\'échéance est proche.' },
      { q: 'Tu es short gamma. Le marché fait un très gros mouvement (peu importe le sens). Avant theta, tu as tendance à…', opts: ['Gagner', 'Perdre', 'Rester stable', 'Dépend du signe du delta'], a: 1, why: 'Short gamma = P&L ≈ ½·Γ·ΔS² avec Γ négatif : toujours une perte pour un mouvement, quel que soit le sens.' },
      { q: 'Un call et un put de même strike et même échéance ont…', opts: ['Le même gamma', 'Des gammas opposés', 'Un gamma nul pour le put', 'Un gamma double pour le call'], a: 0, why: 'La parité call-put implique que call et put ne diffèrent que par un terme linéaire en S : leur courbure est identique.' },
    ], done);
  },
};
