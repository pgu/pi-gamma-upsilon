import { controls, callout, loadSet, saveSet } from '../ui.js';

const KEY = 'grecques.skills';

const SKILLS = [
  ['call-put', 'Expliquer call, put, strike, premium et la moneyness (ITM / ATM / OTM)'],
  ['hedge', 'Calculer combien d\'actions acheter ou vendre pour être delta-neutral'],
  ['gamma-theta', 'Expliquer pourquoi « le gamma se paie en theta »'],
  ['vega', 'Dire ce que fait le vega d\'une position quand l\'IV monte ou s\'effondre'],
  ['chain', 'Lire une option chain : bid/ask, IV, delta, mouvement implicite'],
  ['skew', 'Décrire le skew et pourquoi un put OTM coûte plus cher en vol qu\'un call OTM'],
  ['strategies', 'Choisir une stratégie (collar, condor, straddle…) selon une vue de marché'],
  ['pnl', 'Expliquer un P&L par grecque (delta, gamma, vega, theta) et le résidu'],
  ['rv-iv', 'Expliquer pourquoi vol réalisée vs vol implicite fait le P&L d\'un trade couvert en delta'],
  ['second', 'Définir vanna, volga et charm, et dire quand ils comptent'],
];

const PROFILES = {
  desk: {
    name: 'Salle de marché',
    html: `<ol>
      <li><b>Consolider la théorie :</b> lis Hull (chapitres sur Black-Scholes, les grecques et la couverture), puis Natenberg pour l'intuition de trading.</li>
      <li><b>Apprendre à coder :</b> Python (numpy, pandas) et SQL ; c'est aujourd'hui le minimum pour tout rôle quant, risk ou structuration.</li>
      <li><b>Aller vers les modèles :</b> volatilité locale et stochastique (Gatheral, Bergomi), calcul stochastique de base.</li>
      <li><b>Pratiquer :</b> reproduis un P&amp;L explain sur des données réelles, ou construis ton propre moteur de pricing avec des tests.</li>
      <li><b>Se certifier (optionnel) :</b> FRM (risque), CQF (finance quantitative), selon le métier visé.</li>
    </ol>`,
  },
  retail: {
    name: 'Investisseur particulier',
    html: `<ol>
      <li><b>Rester en risque défini :</b> commence par des positions dont la perte maximale est connue (spreads, collars, protective puts), pas de vente à nu.</li>
      <li><b>Comprendre l'assignation et la marge :</b> une option vendue peut être exercée contre toi. Lis les règles de ton courtier avant tout ordre réel.</li>
      <li><b>S'entraîner en simulation :</b> utilise un compte paper trading pendant plusieurs mois et note chaque trade (vue, stratégie, grecques, résultat).</li>
      <li><b>Dimensionner petit :</b> les options sont à effet de levier ; une taille raisonnable compte plus que la stratégie.</li>
      <li><b>Connaître la fiscalité :</b> elle varie selon le pays et le type de compte.</li>
    </ol>`,
  },
  dev: {
    name: 'Développeur / quant',
    html: `<ol>
      <li><b>Lire le code de ce site :</b> <code>site/js/bs.js</code> contient le pricing, les grecques, la vol implicite et l'arbre binomial, avec des tests dans <code>tests/</code>.</li>
      <li><b>Passer aux bibliothèques établies :</b> QuantLib, py_vollib, scipy.</li>
      <li><b>Aller plus loin sur les modèles :</b> Heston, SABR, volatilité locale ; calibrer une surface d'IV sur des cotations réelles.</li>
      <li><b>Exercice type :</b> implémenter un backtest de delta-hedging avec coûts de transaction et comparer la dispersion de P&amp;L selon la fréquence de rééquilibrage.</li>
    </ol>`,
  },
};

const BOOKS = [
  ['Options, Futures, and Other Derivatives', 'John C. Hull', 'Référence académique et professionnelle : Black-Scholes, grecques, couverture, modèles.', 'Intermédiaire'],
  ['Option Volatility and Pricing', 'Sheldon Natenberg', 'Le classique des traders : vol, grecques, stratégies, avec peu de maths.', 'Débutant → intermédiaire'],
  ['Options as a Strategic Investment', 'Lawrence G. McMillan', 'Catalogue très complet de stratégies et de leur logique.', 'Débutant → intermédiaire'],
  ['Volatility Trading', 'Euan Sinclair', 'Prévoir la vol, comparer IV et réalisée, dimensionner les trades.', 'Intermédiaire'],
  ['Dynamic Hedging', 'Nassim N. Taleb', 'Vision de praticien sur la gestion du risque d\'un book d\'options.', 'Avancé'],
  ['The Volatility Surface', 'Jim Gatheral', 'Modélisation du smile et de la surface d\'IV.', 'Avancé'],
];

export default {
  id: 'next',
  title: 'Et maintenant ? Pour continuer',
  blurb: 'Auto-évaluation, parcours selon ton profil, livres, ressources et données.',
  minutes: 10,
  html: () => `
    <p class="lead">Tu as parcouru les bases, le marché réel, les stratégies et le pro. Voici comment transformer ça en compétence durable.</p>

    <h2>✅ Où en es-tu ? Auto-évaluation</h2>
    <p>Coche ce que tu sais <b>expliquer à voix haute</b> à un collègue, sans notes. Ce que tu ne peux pas cocher te dit quelle leçon relire.</p>
    <div data-skills class="skills"></div>
    <p data-skills-count class="readout"></p>

    <h2>🧭 Ton parcours selon ton profil</h2>
    <div data-profile-controls></div>
    <div data-profile class="story"></div>

    <h2>📚 Lectures recommandées</h2>
    <div class="tbl-wrap"><table class="tbl">
      <thead><tr><th>Livre</th><th>Pourquoi</th><th>Niveau</th></tr></thead>
      <tbody>${BOOKS.map(([t, a, w, l]) => `<tr><td><b>${t}</b><br><small>${a}</small></td><td>${w}</td><td>${l}</td></tr>`).join('')}</tbody>
    </table></div>

    <h2>🌐 Ressources gratuites et données</h2>
    <ul>
      <li><b>Formation :</b> <a href="https://www.optionseducation.org" target="_blank" rel="noopener noreferrer">Options Industry Council</a>, <a href="https://www.cboe.com/education/" target="_blank" rel="noopener noreferrer">Cboe Education</a>, <a href="https://www.cmegroup.com/education.html" target="_blank" rel="noopener noreferrer">CME Group Education</a>. Contenus pédagogiques gratuits, en anglais.</li>
      <li><b>Option chains (cotations différées) :</b> <a href="https://finance.yahoo.com" target="_blank" rel="noopener noreferrer">Yahoo Finance</a>, <a href="https://www.cboe.com" target="_blank" rel="noopener noreferrer">Cboe</a>. Idéal pour refaire les exercices de la leçon « lire une option chain » sur une vraie cotation.</li>
      <li><b>Taux d'intérêt :</b> <a href="https://fred.stlouisfed.org" target="_blank" rel="noopener noreferrer">FRED</a> (Réserve fédérale de Saint-Louis) pour les taux sans risque à utiliser comme <em>r</em>.</li>
      <li><b>Trading simulé :</b> la plupart des grands courtiers proposent un compte « paper trading » (par exemple Interactive Brokers ou thinkorswim paperMoney). À vérifier chez chacun : conditions d'ouverture, accès aux options.</li>
    </ul>
    ${callout('info', 'Pourquoi des liens vers les pages d\'accueil', 'Les adresses profondes des sites changent souvent. Utilise la recherche du site pour trouver le sujet voulu (« option greeks », « implied volatility »…).')}

    <h2>🐍 Python : notebooks du cours</h2>
    <p>Six notebooks refont les playgrounds en Python (Black-Scholes et grecques, volatilité implicite et smile, delta-hedging Monte Carlo, option chain avec pandas, stratégies et P&amp;L explain, options américaines). Ils sont livrés avec leurs résultats et testés contre le moteur JavaScript du site : <a href="https://github.com/pgu/pi-gamma-upsilon/tree/main/notebooks" target="_blank" rel="noopener noreferrer">dossier <code>notebooks/</code> sur GitHub</a>.</p>

    <h3>Premier script : Black-Scholes en 10 lignes</h3>
    <p>Ce que fait la leçon 1, en 10 lignes, sans bibliothèque externe. Le résultat doit être 10,4506 (call, S = K = 100, T = 1 an, r = 5 %, σ = 20 %).</p>
<pre><code>from math import log, sqrt, exp
from statistics import NormalDist

N = NormalDist().cdf

def bs_call(S, K, T, r, sigma):
    d1 = (log(S / K) + (r + sigma**2 / 2) * T) / (sigma * sqrt(T))
    d2 = d1 - sigma * sqrt(T)
    return S * N(d1) - K * exp(-r * T) * N(d2)

print(round(bs_call(100, 100, 1, 0.05, 0.2), 4))  # 10.4506
</code></pre>
    ${callout('try', 'À toi de jouer', `<ul>
      <li>Ajoute <code>delta_call</code> : c'est simplement <code>N(d1)</code> (0,6368 sur cet exemple).</li>
      <li>Vérifie le gamma par différences finies : <code>(delta(S+h) − delta(S−h)) / (2h)</code>.</li>
      <li>Écris l'inversion de la vol implicite par dichotomie, puis teste-la sur une cotation réelle.</li>
    </ul>`)}

    ${callout('warn', 'À garder en tête', 'Ce cours est pédagogique, pas un conseil en investissement. Les options sont des instruments à effet de levier : on peut perdre tout ou plus que la mise (ventes à nu). Les données et chaînes de ce site sont simulées. Teste toujours en simulation avant tout ordre réel.')}
  `,
  init(root, done) {
    const checked = loadSet(KEY);
    const box = root.querySelector('[data-skills]');
    const count = root.querySelector('[data-skills-count]');
    box.innerHTML = SKILLS.map(
      ([id, label]) => `<label class="skill"><input type="checkbox" data-id="${id}"${checked.has(id) ? ' checked' : ''}> <span>${label}</span></label>`,
    ).join('');
    const paint = () => {
      const n = SKILLS.filter(([id]) => checked.has(id)).length;
      count.textContent = n === SKILLS.length ? `🎉 ${n} / ${SKILLS.length} : tout est acquis. Bravo !` : `${n} / ${SKILLS.length} compétences cochées`;
      if (n === SKILLS.length) done();
    };
    box.addEventListener('change', (e) => {
      const id = e.target.dataset.id;
      if (!id) return;
      e.target.checked ? checked.add(id) : checked.delete(id);
      saveSet(KEY, checked);
      paint();
    });
    paint();

    const show = (k) => {
      root.querySelector('[data-profile]').innerHTML = PROFILES[k].html;
    };
    controls(root.querySelector('[data-profile-controls]'), [
      { key: 'p', type: 'toggle', label: 'Je suis plutôt…', value: 'desk', options: Object.entries(PROFILES).map(([v, p]) => ({ v, l: p.name })) },
    ], (s) => show(s.p));
  },
};
