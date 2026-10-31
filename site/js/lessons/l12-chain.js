import { greeks } from '../bs.js';
import { smileIV, roundTick } from '../market.js';
import { controls, quiz, callout, hint, nf } from '../ui.js';
import { T } from '../glossary.js';

const S = 100;
const STRIKES = Array.from({ length: 9 }, (_, i) => 80 + i * 5);

function buildChain({ days, atm, skew }) {
  const Tm = days / 365;
  return STRIKES.map((K) => {
    const iv = smileIV({ S, K, T: Tm, atm, skew, curv: 1 });
    const side = (type) => {
      const g = greeks({ S, K, T: Tm, r: 0.03, sigma: iv, type });
      const spread = Math.max(0.05, roundTick(0.05 * g.price));
      const bid = Math.max(0, roundTick(g.price - spread / 2));
      const ask = Math.max(0.05, roundTick(g.price + spread / 2));
      // illustrative liquidity: strongest around the money
      const oi = Math.round(8000 * Math.exp(-(((K - S) / 12) ** 2)) + 150);
      return { mid: g.price, bid, ask, delta: g.delta, iv, oi };
    };
    return { K, call: side('call'), put: side('put') };
  });
}

export default {
  id: 'chain',
  title: 'Marché : lire une option chain',
  blurb: 'Bid/ask, IV, delta, open interest : décoder un écran de cotation.',
  minutes: 15,
  html: () => `
    <p class="lead">L'<b>option chain</b> est la page de cotation d'un sous-jacent : une ligne par strike, les calls à gauche, les puts à droite. Tout ce que tu as appris s'y retrouve.</p>
    <p class="note">⚠️ Cette chaîne est <b>simulée</b> à partir d'un modèle de smile (spot = 100). Elle sert à s'entraîner à lire, pas à trader.</p>

    <div data-controls></div>
    <div class="tbl-wrap" data-table></div>

    <h2>Comment lire une ligne</h2>
    <ul>
      <li>${T('bidask', 'Bid / Ask')} : tu <b>vends au bid</b>, tu <b>achètes à l'ask</b>. L'écart est un coût de transaction immédiat.</li>
      <li><b>IV</b> : la vol implicite de cette option, déduite du prix (leçon précédente). Regarde comment elle varie selon le strike.</li>
      <li><b>Δ</b> : le delta. Le call ATM est vers +0,5, le put ATM vers −0,5.</li>
      <li><b>OI</b> (${T('openinterest', 'open interest')}) : contrats ouverts. Avec le ${T('volume', 'volume')} du jour, c'est un indicateur de liquidité : un spread large et peu d'OI = option difficile à négocier.</li>
    </ul>

    <h2>🧪 Exercices guidés</h2>
    <p>Utilise le tableau ci-dessus. Change la maturité ou le skew : les réponses se mettent à jour.</p>

    <h3>Exercice 1 : le mouvement implicite</h3>
    <p>Quel est le prix du ${T('straddle', 'straddle')} ATM (call 100 + put 100, au prix milieu) ? Que dit-il du mouvement attendu d'ici l'échéance ?</p>
    ${hint('<div data-a1></div>', 'Voir la réponse')}
    ${hint(`Le straddle ATM vaut environ 0,8 × σ × √T × S. Divisé par le spot, il donne le ${T('impliedmove', 'mouvement implicite')} : l'amplitude moyenne que le marché anticipe (dans un sens ou l'autre).`, 'Indice')}

    <h3>Exercice 2 : trouver le 25-delta put</h3>
    <p>Les traders désignent les strikes par leur delta. Quel strike est le plus proche d'un put de delta −0,25 ? Est-il OTM ou ITM ?</p>
    ${hint('<div data-a2></div>', 'Voir la réponse')}

    <h3>Exercice 3 : mesurer le skew</h3>
    <p>Calcule l'écart d'IV entre le put 90 et le call 110, deux options symétriques de part et d'autre du spot.</p>
    ${hint('<div data-a3></div>', 'Voir la réponse')}

    <h3>Exercice 4 : le coût d'entrée</h3>
    <p>Tu achètes le straddle ATM à l'ask et tu le revends tout de suite au bid. Combien perds-tu ?</p>
    ${hint('<div data-a4></div>', 'Voir la réponse')}

    ${callout('pro', 'En pratique, sur un desk', `<ul>
      <li>On ne négocie presque jamais « à l'ask » sur de gros ordres : on passe par un RFQ ou on place un ordre limite au milieu. Mais le spread reste le <b>coût de la liquidité</b>.</li>
      <li>L'open interest et les volumes aident à repérer où les autres acteurs sont positionnés (strikes « magnets » autour des expirations, voir ${T('pinrisk', 'pin risk')}).</li>
    </ul>`)}

    <h2>Quiz</h2>
    <div data-quiz></div>
  `,
  init(root, done) {
    const st = {};
    const refresh = () => {
      const chain = buildChain({ days: st.days, atm: st.atm / 100, skew: st.skew });
      const row = (r) =>
        `<tr class="${r.K === 100 ? 'atm' : ''}"><td>${nf(r.call.bid)}</td><td>${nf(r.call.ask)}</td><td>${nf(r.call.iv * 100, 1)} %</td><td>${nf(r.call.delta, 2)}</td><td>${nf(r.call.oi, 0)}</td>` +
        `<th>${r.K}</th>` +
        `<td>${nf(r.put.bid)}</td><td>${nf(r.put.ask)}</td><td>${nf(r.put.iv * 100, 1)} %</td><td>${nf(r.put.delta, 2)}</td><td>${nf(r.put.oi, 0)}</td></tr>`;
      root.querySelector('[data-table]').innerHTML =
        `<table class="tbl num chain"><thead><tr><th colspan="5">CALLS</th><th rowspan="2">Strike</th><th colspan="5">PUTS</th></tr><tr><th>Bid</th><th>Ask</th><th>IV</th><th>Δ</th><th>OI</th><th>Bid</th><th>Ask</th><th>IV</th><th>Δ</th><th>OI</th></tr></thead><tbody>${chain.map(row).join('')}</tbody></table>`;

      const Tm = st.days / 365;
      const atm = chain.find((r) => r.K === 100);
      const straddle = atm.call.mid + atm.put.mid;
      const approx = 0.8 * atm.call.iv * Math.sqrt(Tm) * S;
      root.querySelector('[data-a1]').innerHTML = `Straddle ≈ <b>${nf(straddle)}</b>, soit <b>±${nf((straddle / S) * 100, 1)} %</b> du spot. Contrôle : 0,8 × ${nf(atm.call.iv * 100, 1)} % × √(${st.days}/365) × 100 ≈ ${nf(approx)}. Le marché anticipe une amplitude d'environ ${nf(straddle, 1)} points.`;
      const best = chain.reduce((a, b) => (Math.abs(b.put.delta + 0.25) < Math.abs(a.put.delta + 0.25) ? b : a));
      root.querySelector('[data-a2]').innerHTML = `Le strike <b>${best.K}</b> (delta put ${nf(best.put.delta, 2)}). Spot à 100 : le put est <b>${best.K < S ? 'OTM' : 'ITM'}</b>. On l'appelle « le 25-delta put » : un repère de la protection à la baisse.`;
      const r90 = chain.find((r) => r.K === 90);
      const r110 = chain.find((r) => r.K === 110);
      root.querySelector('[data-a3]').innerHTML = `IV put 90 = ${nf(r90.put.iv * 100, 1)} %, IV call 110 = ${nf(r110.call.iv * 100, 1)} % → écart <b>${nf((r90.put.iv - r110.call.iv) * 100, 1)} points</b> de vol. Plus cet écart est grand, plus le skew est marqué ; mets le skew à 0 pour le voir disparaître (il reste la courbure).`;
      const cost = atm.call.ask + atm.put.ask - (atm.call.bid + atm.put.bid);
      root.querySelector('[data-a4]').innerHTML = `Achat : ${nf(atm.call.ask + atm.put.ask)} · Revente : ${nf(atm.call.bid + atm.put.bid)} → tu perds <b>${nf(cost)}</b> (${nf((cost / straddle) * 100, 1)} % de la valeur du straddle) sans que le marché ait bougé.`;
    };
    controls(root.querySelector('[data-controls]'), [
      { key: 'days', label: 'Maturité (jours)', min: 7, max: 180, step: 1, value: 30 },
      { key: 'atm', label: 'IV ATM', min: 10, max: 50, step: 1, value: 20, fmt: (v) => v + ' %' },
      { key: 'skew', label: 'Skew', min: 0, max: 1, step: 0.05, value: 0.4, fmt: (v) => nf(v, 2) },
    ], refresh, st);

    quiz(root.querySelector('[data-quiz]'), [
      { q: 'Le straddle ATM à 30 jours cote 7,0 sur un spot de 100. Le marché anticipe un mouvement d\'environ…', opts: ['±0,7 %', '±7 %', '±14 %', '±70 %'], a: 1, why: '7 / 100 = 7 % : c\'est le mouvement implicite.' },
      { q: 'Une option avec un bid/ask très large et un open interest minuscule est…', opts: ['Très liquide', 'Peu liquide : coûteuse à négocier', 'Gratuite à couvrir', 'Forcément mal pricée'], a: 1, why: 'Le spread est un coût direct ; un faible OI indique peu de contreparties.' },
      { q: 'Tu veux acheter un put : tu paies le…', opts: ['Bid', 'Ask', 'Milieu exact', 'Delta'], a: 1, why: 'L\'acheteur paie l\'ask, le vendeur reçoit le bid.' },
    ], done);
  },
};
