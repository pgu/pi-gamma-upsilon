import { lineChart } from '../charts.js';
import { greeks, price } from '../bs.js';
import { controls, quiz, callout, hint, stats, nf, sgn } from '../ui.js';
import { T } from '../glossary.js';

export default {
  id: 'theta',
  title: 'Theta (Θ)',
  blurb: 'Le prix du temps qui passe — et le lien secret avec gamma.',
  minutes: 12,
  html: () => `
    <p class="lead">Le ${T('theta')} répond à : <b>« si un jour passe sans que rien d'autre ne bouge, de combien l'option perd-elle ? »</b> C'est le <em>time decay</em>.</p>

    <p class="formula">Θ = ∂V / ∂t  <small>(affiché ici par jour calendaire)</small></p>
    <ul>
      <li>Theta est généralement <b>négatif pour un acheteur</b> (l'option perd de la valeur temps) et <b>positif pour un vendeur</b>.</li>
      <li>Le decay n'est <b>pas linéaire</b> : une option ATM perd peu au début, puis de plus en plus vite à l'approche de l'expiration.</li>
      <li>Une option très ITM ou très OTM perd moins que l'ATM, car il y a moins de ${T('timevalue', 'time value')} à perdre.</li>
    </ul>

    <h2>🧪 Playground : la fonte de la valeur temps</h2>
    <p>Le temps s'écoule de gauche à droite jusqu'à l'expiration (à droite). Trois options : ITM, ATM et OTM de 10 points.</p>
    <div data-controls></div>
    <div data-stats></div>
    <div data-chart></div>
    <div data-chart2></div>
    ${callout('try', 'À essayer', `<ul>
      <li>Regarde la courbe ATM : elle est presque linéaire au début puis <b>plonge</b> dans les derniers jours.</li>
      <li>Augmente la volatilité : plus de valeur temps à perdre, donc un theta plus élevé en valeur absolue.</li>
      <li>Le second graphique montre le theta par jour : il devient énorme (en négatif) juste avant l'échéance pour l'ATM.</li>
    </ul>`)}

    <h2>Le lien theta ↔ gamma</h2>
    <p>Theta et gamma sont les deux faces d'une même pièce. Quand les taux sont nuls, pour une option ${T('atm')} :</p>
    <p class="formula">Θ ≈ − ½ · σ² · S² · Γ</p>
    <div data-link class="readout"></div>
    ${hint(`C'est l'idée centrale du trading d'options : <b>le gamma se paie en theta</b>. Être long gamma, c'est profiter des mouvements, mais l'option perd de la valeur chaque jour ; être short gamma, c'est encaisser le theta en prenant le risque d'un gros mouvement. Chacun parie sur la vol réalisée vs implicite (leçon « Delta-hedging »).`, 'Pourquoi c\'est important')}

    ${callout('pro', 'En pratique, sur un desk', `<ul>
      <li>Le theta est la première ligne du reporting P&amp;L du matin : « combien le book va-t-il perdre / gagner si rien ne bouge ? ».</li>
      <li>Le week-end : le marché est fermé, mais le calendrier avance. Selon les desks, on « fait passer » le theta de 3 jours le vendredi soir, ou on pondère en jours ouvrés.</li>
      <li>Un fonds qui vend des options pour « encaisser du theta » est en réalité short gamma / short vega : ce n'est pas un revenu gratuit.</li>
    </ul>`)}

    <h2>Quiz</h2>
    <div data-quiz></div>
  `,
  init(root, done) {
    controls(root.querySelector('[data-controls]'), [
      { key: 'type', type: 'toggle', label: 'Type', value: 'call', options: [{ v: 'call', l: 'Call' }, { v: 'put', l: 'Put' }] },
      { key: 'days', label: 'Maturité de départ (jours)', min: 10, max: 365, step: 1, value: 90 },
      { key: 'sig', label: 'Volatilité (σ)', min: 5, max: 80, step: 1, value: 25, fmt: (v) => v + ' %' },
      { key: 'r', label: 'Taux (r)', min: 0, max: 8, step: 0.25, value: 3, fmt: (v) => nf(v, 2) + ' %' },
    ], ({ type, days, sig, r }) => {
      const S = 100;
      const base = { S, T: days / 365, r: r / 100, sigma: sig / 100, type };
      const strikes = type === 'call' ? [[90, 'ITM', 2], [100, 'ATM', 0], [110, 'OTM', 1]] : [[110, 'ITM', 2], [100, 'ATM', 0], [90, 'OTM', 1]];
      const ds = Array.from({ length: days }, (_, i) => days - i);
      const atm = greeks({ ...base, K: 100 });
      root.querySelector('[data-stats]').innerHTML = stats([
        { k: 'Theta ATM aujourd\'hui', v: nf(atm.theta, 4), sub: 'par jour' },
        { k: 'Prix ATM', v: nf(atm.price) },
        { k: 'Perte sur 7 jours (≈)', v: nf(atm.theta * 7, 3) },
      ]);
      root.querySelector('[data-chart]').innerHTML = lineChart({
        series: strikes.map(([K, label, color]) => ({ label: `${label} (K=${K})`, color, pts: ds.concat([0]).map((d) => [d, price({ ...base, K, T: d / 365 })]) })),
        xReverse: true, xLabel: 'Jours restants avant l\'expiration (le temps passe →)', yLabel: 'Prix de l\'option',
      });
      root.querySelector('[data-chart2]').innerHTML = lineChart({
        series: [{ label: 'Theta ATM (par jour)', color: 0, pts: ds.map((d) => [d, greeks({ ...base, K: 100, T: d / 365 }).theta]) }],
        xReverse: true, xLabel: 'Jours restants (le temps passe →)', yLabel: 'Theta / jour',
      });
      const o0 = { S: 100, K: 100, T: days / 365, r: 0, sigma: sig / 100, type };
      const g0 = greeks(o0);
      root.querySelector('[data-link]').innerHTML =
        `Avec r = 0 : Θ × 365 = <b>${nf(g0.theta * 365, 3)}</b> · − ½σ²S²Γ = <b>${nf(-0.5 * (sig / 100) ** 2 * 100 ** 2 * g0.gamma, 3)}</b> → les deux sont identiques. ✨`;
    });

    quiz(root.querySelector('[data-quiz]'), [
      { q: 'Theta = −0,05 / jour. Environ combien perds-tu en une semaine, toutes choses égales par ailleurs ?', opts: ['−0,05', '−0,35', '−1,50', '−5,00'], a: 1, why: '7 × (−0,05) = −0,35 (en première approximation).' },
      { q: 'Quelle position gagne du theta quand rien ne bouge ?', opts: ['Long call', 'Long put', 'Short option (call ou put)', 'Long straddle'], a: 2, why: 'Le vendeur d\'option encaisse la décroissance de la valeur temps, en échange du risque gamma/vega.' },
      { q: 'À quel moment le theta d\'une option ATM est-il le plus fort (en valeur absolue) ?', opts: ['Loin de l\'expiration', 'À mi-vie', 'Près de l\'expiration', 'Il est constant'], a: 2, why: 'La valeur temps ATM décroît comme √T : la pente (donc theta) devient très forte à la fin.' },
    ], done);
  },
};
