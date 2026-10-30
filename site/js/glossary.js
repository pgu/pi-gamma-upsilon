// Glossary: French explanation, English term kept (the vocabulary you will hear on a desk).

export const GLOSSARY = {
  option: ['Option', "Contrat donnant le droit (pas l'obligation) d'acheter ou de vendre un actif à un prix fixé, à une date donnée. On paie une premium pour ce droit."],
  call: ['Call', "Option d'achat : droit d'acheter l'underlying au strike. Gagnante si le spot monte."],
  put: ['Put', "Option de vente : droit de vendre l'underlying au strike. Gagnante si le spot baisse."],
  underlying: ['Underlying (sous-jacent)', "L'actif sur lequel porte l'option : une action, un indice, une devise, un taux…"],
  spot: ['Spot', "Prix actuel de l'underlying sur le marché. Noté S dans les formules."],
  strike: ['Strike (prix d\'exercice)', "Prix fixé dans le contrat auquel on pourra acheter (call) ou vendre (put). Noté K."],
  premium: ['Premium (prime)', "Prix payé par l'acheteur au vendeur pour obtenir l'option. C'est ce que calcule Black-Scholes."],
  expiry: ['Expiry / Maturity (échéance)', "Date à laquelle l'option expire. Le temps restant, T, est exprimé en années dans les formules (jours / 365)."],
  itm: ['ITM — In The Money', "Option qui rapporterait de l'argent si elle expirait maintenant : call avec S > K, put avec S < K."],
  atm: ['ATM — At The Money', 'Option dont le strike est (à peu près) égal au spot. C\'est là que les grecques sont les plus « nerveuses ».'],
  otm: ['OTM — Out of The Money', "Option qui ne rapporterait rien à l'expiration actuelle : call avec S < K, put avec S > K."],
  moneyness: ['Moneyness', "Position du spot par rapport au strike (ITM / ATM / OTM). Souvent exprimée en S/K."],
  payoff: ['Payoff', "Gain de l'option à l'expiration, avant d'avoir déduit la premium : max(S−K, 0) pour un call, max(K−S, 0) pour un put."],
  intrinsic: ['Intrinsic value (valeur intrinsèque)', "Ce que vaudrait l'option si elle expirait maintenant : son payoff immédiat."],
  timevalue: ['Time value (valeur temps)', 'Premium − valeur intrinsèque. Le prix de l\'incertitude restante : elle fond jusqu\'à zéro à l\'expiration.'],
  vol: ['Volatility (volatilité)', "Amplitude des variations du prix de l'underlying, en % annualisé. Noté σ (sigma)."],
  iv: ['Implied volatility (IV)', "Volatilité « déduite » du prix de marché de l'option : celle qu'il faut mettre dans Black-Scholes pour retrouver ce prix. C'est l'anticipation du marché."],
  rv: ['Realized volatility', "Volatilité effectivement constatée dans les prix passés. Le vendeur d'option gagne si realized < implied."],
  rate: ['Risk-free rate (taux sans risque)', "Taux d'un placement sans risque (ex. dépôt, T-bill). Noté r."],
  delta: ['Delta (Δ)', "Variation du prix de l'option pour +1 de spot. Aussi : nombre d'actions équivalentes."],
  gamma: ['Gamma (Γ)', "Variation du delta pour +1 de spot. Mesure la courbure du prix."],
  vega: ['Vega (ν)', "Variation du prix de l'option pour +1 point de volatilité."],
  theta: ['Theta (Θ)', "Variation du prix de l'option pour +1 jour qui passe (time decay)."],
  rho: ['Rho (ρ)', "Variation du prix de l'option pour +1 point de taux d'intérêt."],
  long: ['Long', "Position acheteuse : on possède l'option (ou l'actif)."],
  short: ['Short', "Position vendeuse : on a vendu l'option (ou l'actif). Les grecques changent de signe."],
  hedge: ['Hedge (couverture)', "Position prise pour neutraliser un risque (par ex. acheter des actions contre des calls vendus)."],
  deltaneutral: ['Delta-neutral', "Portefeuille dont le delta total est ≈ 0 : insensible, au premier ordre, à un petit mouvement du spot."],
  multiplier: ['Multiplier (taille de contrat)', "Nombre d'unités d'underlying par contrat. Pour les options sur actions US : 100."],
  pnl: ['P&L (Profit & Loss)', "Gain ou perte d'une position sur une période. « P&L explain » : décomposer le P&L par grecque."],
  desk: ['Desk', "Équipe de trading d'une banque ou d'un fonds, spécialisée sur un produit (ex. equity derivatives desk)."],
  marketmaker: ['Market maker', "Acteur qui cote en permanence prix d'achat et de vente (bid/ask) et gère ensuite ses grecques."],
  bidask: ['Bid / Ask', "Bid = prix auquel le market maker achète ; Ask = prix auquel il vend. L'écart est sa rémunération."],
  ivcrush: ['IV crush', "Chute brutale de la volatilité implicite après un événement attendu (résultats, décision de banque centrale)."],
  gammascalping: ['Gamma scalping', "Stratégie : long gamma + rebalancement du delta pour encaisser les mouvements, en payant le theta."],
  pinrisk: ['Pin risk', "Risque, près de l'expiration, que le spot « colle » au strike : delta et gamma deviennent instables."],
  blackscholes: ['Black-Scholes', "Modèle (1973) donnant le prix d'une option européenne à partir de S, K, T, r et σ. Les grecques en sont les dérivées."],
  european: ['European option', "Option exerçable uniquement à l'expiration (par opposition à American : exerçable à tout moment)."],
  leaps: ['LEAPS', "Options à très longue échéance (1 à 3 ans) : très sensibles à rho et vega."],
  skew: ['Skew / Smile', "Dans la réalité, l'IV varie selon le strike. Black-Scholes suppose une vol unique : une simplification importante."],
  vanna: ['Vanna', "Sensibilité du delta à la volatilité (∂Δ/∂σ). Grecque de 2ᵉ ordre."],
  volga: ['Volga / Vomma', "Sensibilité du vega à la volatilité (∂ν/∂σ). Grecque de 2ᵉ ordre."],
  straddle: ['Straddle', "Achat (ou vente) simultané d'un call et d'un put de même strike et même échéance. Pari sur l'amplitude du mouvement, pas sur son sens."],
  impliedmove: ['Implied move (mouvement implicite)', "Amplitude de mouvement que le marché « price » : à peu près le prix du straddle ATM divisé par le spot."],
  termstructure: ['Term structure (structure par terme)', "Courbe de la volatilité implicite selon l'échéance. Inversée (court terme > long terme) en période de stress."],
  riskreversal: ['Risk reversal', "Long call OTM + short put OTM (ou l'inverse). Sa cotation en volatilité (IV call − IV put) mesure le skew."],
  openinterest: ['Open interest', "Nombre de contrats ouverts (pas encore dénoués) sur un strike. À ne pas confondre avec le volume du jour."],
  volume: ['Volume', "Nombre de contrats échangés pendant la séance. Un volume faible et un spread large signalent peu de liquidité."],
  vrp: ['Variance risk premium', "En moyenne, l'IV est supérieure à la volatilité réalisée ensuite : les vendeurs d'options sont payés pour porter le risque."],
  earnings: ['Earnings (résultats)', "Publication des résultats d'une entreprise : événement attendu, qui fait monter l'IV avant puis la fait chuter après (IV crush)."],
  spread: ['Spread (vertical)', "Achat d'une option et vente d'une autre de même type et même échéance mais de strike différent. Réduit le coût et borne le gain et la perte."],
  collar: ['Collar', "Action détenue + put acheté (protection) + call vendu (qui finance le put). Coût quasi nul, plage de P&L bornée."],
  ironcondor: ['Iron condor', "Vente d'un strangle + achat de deux options plus éloignées pour limiter le risque. Gagne si le marché reste dans une fourchette."],
  calendar: ['Calendar spread', "Vente d'une option courte et achat d'une option de même strike mais d'échéance plus lointaine. Profite du temps qui passe et de la vol longue."],
  debitcredit: ['Debit / Credit', "Débit : la stratégie coûte de l'argent à l'entrée. Crédit : elle en rapporte (on encaisse plus de prime qu'on n'en paie)."],
  breakeven: ['Breakeven (point mort)', "Niveau de spot auquel le P&L du trade est nul."],
  charm: ['Charm', "Sensibilité du delta au passage du temps (∂Δ/∂t). Explique pourquoi le delta bouge même si le spot ne bouge pas."],
};

/** Inline glossary term: click for the definition. */
export const T = (key, label) =>
  `<button type="button" class="term" data-t="${key}">${label ?? GLOSSARY[key][0].split(' (')[0].split(' — ')[0]}</button>`;

let pop;
export function initGlossaryPopover() {
  pop = document.createElement('div');
  pop.className = 'popover';
  pop.hidden = true;
  pop.setAttribute('role', 'tooltip');
  document.body.append(pop);
  document.addEventListener('click', (e) => {
    const t = e.target.closest?.('.term');
    if (!t) {
      pop.hidden = true;
      return;
    }
    const [en, def] = GLOSSARY[t.dataset.t];
    pop.innerHTML = `<b>${en}</b><br>${def}`;
    pop.hidden = false;
    const r = t.getBoundingClientRect();
    const left = Math.min(Math.max(8, r.left + window.scrollX), window.scrollX + document.documentElement.clientWidth - pop.offsetWidth - 8);
    pop.style.left = `${left}px`;
    pop.style.top = `${r.bottom + window.scrollY + 6}px`;
  });
  document.addEventListener('keydown', (e) => e.key === 'Escape' && (pop.hidden = true));
}
