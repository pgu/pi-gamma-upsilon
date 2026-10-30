import { lineChart } from '../charts.js';
import { controls, quiz, callout, hint, nf, sgn } from '../ui.js';
import { T } from '../glossary.js';

export default {
  id: 'options',
  title: 'Les options en 5 minutes',
  blurb: 'Call, put, strike, premium : le vocabulaire de base.',
  minutes: 8,
  html: () => `
    <p class="lead">Avant les grecques, il faut savoir ce qu'on dérive. Une ${T('option')} est un contrat : en échange d'une ${T('premium')}, l'acheteur obtient le <b>droit</b> (jamais l'obligation) de traiter un ${T('underlying')} à un prix fixé d'avance, le ${T('strike')}, jusqu'à une date, l'${T('expiry')}.</p>

    <table class="tbl">
      <thead><tr><th></th><th>${T('call')}</th><th>${T('put')}</th></tr></thead>
      <tbody>
        <tr><th>Droit de…</th><td>acheter au strike</td><td>vendre au strike</td></tr>
        <tr><th>On le veut si on pense que le spot va…</th><td>monter 📈</td><td>baisser 📉</td></tr>
        <tr><th>${T('payoff')} à l'expiration</th><td>max(S − K, 0)</td><td>max(K − S, 0)</td></tr>
        <tr><th>${T('itm')} quand…</th><td>S &gt; K</td><td>S &lt; K</td></tr>
      </tbody>
    </table>

    <p>Deux personnes se font face : l'acheteur (${T('long')}) paie la premium et a un risque limité à cette premium ; le vendeur (${T('short')}) encaisse la premium mais s'engage à honorer le contrat. <b>Les grecques mesurent précisément le risque que porte le vendeur… et la sensibilité dont profite l'acheteur.</b></p>

    <h2>🧪 Playground : le P&amp;L à l'expiration</h2>
    <p>Le graphique montre le gain ou la perte (premium incluse) selon le prix du spot <em>le jour de l'expiration</em>.</p>
    <div data-controls></div>
    <div data-chart></div>
    <div data-info class="readout"></div>
    ${callout('try', 'À essayer', `<ul>
      <li>Passe de <b>Long</b> à <b>Short</b> : le graphique se retourne exactement comme dans un miroir. Le gain de l'un est la perte de l'autre.</li>
      <li>Augmente la premium : le point mort (<em>breakeven</em>) s'éloigne du strike. Une option chère est plus dure à rentabiliser.</li>
    </ul>`)}
    ${hint(`Le <b>breakeven</b> d'un call long est K + premium : le spot doit dépasser le strike <em>et</em> rembourser la premium payée. Pour un put : K − premium.`)}

    <h2>Moneyness : ITM, ATM, OTM</h2>
    <p>Le mot ${T('moneyness')} décrit où se situe le spot par rapport au strike. Une option ${T('atm')} est « au prix », ${T('itm')} elle a déjà de la valeur intrinsèque, ${T('otm')} elle n'en a pas. On retrouvera cette notion dans <em>chaque</em> leçon : les grecques dépendent énormément de la moneyness.</p>

    ${callout('pro', 'En pratique, sur un desk', `Une option sur actions US porte sur <b>100 actions</b> (le ${T('multiplier')}). Une premium cotée « 2,50 » coûte donc 250 $ par contrat. Les clients achètent ou vendent des options ; le ${T('marketmaker')} cote un ${T('bidask')} et se retrouve avec un portefeuille d'options dont il doit gérer le risque : c'est le rôle des grecques.`)}

    <h2>Quiz</h2>
    <div data-quiz></div>
  `,
  init(root, done) {
    controls(
      root.querySelector('[data-controls]'),
      [
        { key: 'type', type: 'toggle', label: 'Type', value: 'call', options: [{ v: 'call', l: 'Call' }, { v: 'put', l: 'Put' }] },
        { key: 'side', type: 'toggle', label: 'Position', value: 'long', options: [{ v: 'long', l: 'Long (acheteur)' }, { v: 'short', l: 'Short (vendeur)' }] },
        { key: 'K', label: 'Strike (K)', min: 60, max: 140, step: 1, value: 100 },
        { key: 'prem', label: 'Premium', min: 1, max: 25, step: 0.5, value: 6, fmt: (v) => nf(v, 1), hint: 'Prix de l\'option, par unité d\'underlying.' },
      ],
      ({ type, side, K, prem }) => {
        const sign = side === 'long' ? 1 : -1;
        const f = (S) => sign * ((type === 'call' ? Math.max(S - K, 0) : Math.max(K - S, 0)) - prem);
        const pts = Array.from({ length: 121 }, (_, i) => [40 + i, f(40 + i)]);
        const be = type === 'call' ? K + prem : K - prem;
        root.querySelector('[data-chart]').innerHTML = lineChart({
          series: [{ label: `${side === 'long' ? 'Long' : 'Short'} ${type}`, pts }],
          vlines: [{ x: K, label: 'K' }],
          markers: [{ x: be, y: 0, label: `breakeven ${nf(be, 1)}` }],
          xLabel: 'Spot à l\'expiration',
          yLabel: 'P&L',
        });
        const maxGain = side === 'long' ? (type === 'call' ? 'illimité' : nf(K - prem, 1)) : nf(prem, 1);
        const maxLoss = side === 'short' ? (type === 'call' ? 'illimitée' : nf(K - prem, 1)) : nf(prem, 1);
        root.querySelector('[data-info]').innerHTML = `Gain max : <b>${maxGain}</b> · Perte max : <b>${maxLoss}</b> · Breakeven : <b>${nf(be, 1)}</b> · P&amp;L si spot = strike : <b>${sgn(f(K), 1)}</b>`;
      },
    );

    quiz(root.querySelector('[data-quiz]'), [
      { q: 'Tu achètes un put de strike 100, premium 4. À l\'expiration le spot vaut 90. Ton P&L (par unité) ?', opts: ['−4', '+6', '+10', '+14'], a: 1, why: 'Le put rapporte 100 − 90 = 10, moins la premium 4 : +6.' },
      { q: 'Quelle position a une perte maximale <em>illimitée</em> ?', opts: ['Long call', 'Long put', 'Short call', 'Short put : non, perte bornée'], a: 2, why: 'Un spot qui monte sans limite fait perdre sans limite au vendeur d\'un call. Le short put est borné (le spot ne descend pas sous 0).' },
      { q: 'Un call de strike 100, spot à 110, est…', opts: ['ITM', 'ATM', 'OTM', 'impossible à dire'], a: 0, why: 'S > K pour un call : il a 10 de valeur intrinsèque, il est In The Money.' },
    ], done);
  },
};
