import { GLOSSARY } from '../glossary.js';
import { controls, loadSet, saveSet } from '../ui.js';

const PHRASES = [
  ["I'm long gamma.", "Je suis acheteur de gamma : je gagne quand le marché bouge, je paie du theta."],
  ["We're short vega into earnings.", "Nous avons vendu de la vol avant les résultats : on parie sur l'IV crush."],
  ["The book is delta-neutral.", "Le portefeuille est couvert en delta : insensible, au premier ordre, à un petit mouvement du spot."],
  ["Vol is bid.", "La volatilité est demandée : les acheteurs d'options font monter les prix et l'IV."],
  ["Vol is offered.", "La volatilité est offerte : les vendeurs dominent, l'IV baisse."],
  ["Hit the bid.", "Vendre au prix bid, c'est-à-dire accepter le prix de l'acheteur."],
  ["Lift the offer.", "Acheter au prix ask, c'est-à-dire accepter le prix du vendeur."],
  ["What's the market on the Dec 100 calls?", "Quelle est la cotation (bid/ask) des calls de strike 100 échéance décembre ?"],
  ["He's paying up for downside protection.", "Il paie cher pour se protéger à la baisse : le skew des puts s'accentue."],
  ["We're selling premium.", "On vend des options pour encaisser la prime (stratégies short vol : covered call, condor…)."],
  ["Let's roll the position out a month.", "Reconduire la position sur l'échéance suivante : on clôture l'option actuelle et on en ouvre une plus longue."],
  ["There's pin risk into the close.", "Le spot est collé au strike à l'approche de l'expiration : le delta peut basculer à tout moment."],
  ["What's the greeks on the book?", "Quelles sont les grecques agrégées du portefeuille (delta, gamma, vega, theta) ?"],
  ["We got run over on the gap.", "Le marché a ouvert avec un saut, sans possibilité de rebalancer la couverture : grosse perte (typique du short gamma)."],
];

const DECKS = {
  gloss: { name: 'Glossaire', cards: Object.entries(GLOSSARY).map(([k, [en, def]]) => ({ id: 'g:' + k, en: en.split(' (')[0], enFull: en, fr: def })) },
  desk: { name: 'Phrases de desk', cards: PHRASES.map(([en, fr], i) => ({ id: 'p:' + i, en, enFull: en, fr })) },
};
const KEY = 'grecques.known';

const shuffle = (a) => {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
};

export default {
  id: 'flashcards',
  title: 'Flashcards : vocabulaire de desk',
  blurb: 'Retiens les termes anglais et les phrases que tu entendras vraiment.',
  minutes: 10,
  html: () => `
    <p class="lead">Un terme que tu ne reconnais pas au moment où un collègue le prononce, c'est une conversation perdue. Entraîne-toi : retourne la carte, puis dis-toi honnêtement si tu le savais.</p>
    <ul>
      <li><b>Je savais</b> : la carte sort du paquet (mémorisée dans ton navigateur).</li>
      <li><b>À revoir</b> : la carte revient plus tard dans la session.</li>
    </ul>
    <div data-controls></div>
    <div class="flash" data-card aria-live="polite"></div>
    <div class="actions" data-actions>
      <button type="button" class="btn" data-flip>Retourner</button>
      <button type="button" class="btn secondary" data-know hidden>✅ Je savais</button>
      <button type="button" class="btn secondary" data-again hidden>🔁 À revoir</button>
    </div>
    <p data-progress class="readout"></p>
    <button type="button" class="btn secondary" data-reset>Réinitialiser ce paquet</button>
  `,
  init(root, done) {
    const st = {};
    let queue = [];
    let flipped = false;
    const known = loadSet(KEY);

    const card = root.querySelector('[data-card]');
    const flip = root.querySelector('[data-flip]');
    const know = root.querySelector('[data-know]');
    const again = root.querySelector('[data-again]');
    const progress = root.querySelector('[data-progress]');

    const deckCards = () => DECKS[st.deck].cards;
    const start = () => {
      queue = shuffle(deckCards().filter((c) => !known.has(c.id)));
      flipped = false;
      show();
    };
    const show = () => {
      const total = deckCards().length;
      const nKnown = deckCards().filter((c) => known.has(c.id)).length;
      progress.textContent = `${nKnown} / ${total} cartes maîtrisées · ${queue.length} restantes dans cette session`;
      if (!queue.length) {
        card.innerHTML = '<div>🎉 <b>Paquet terminé !</b><br><small>Tu peux réinitialiser pour réviser à nouveau.</small></div>';
        flip.hidden = know.hidden = again.hidden = true;
        if (nKnown === total) done();
        return;
      }
      const c = queue[0];
      const front = st.dir === 'en' ? c.en : c.fr;
      const back = st.dir === 'en' ? c.fr : c.enFull;
      card.innerHTML = `<div><small>${st.dir === 'en' ? 'Terme / phrase en anglais' : 'En français'}</small><div>${flipped ? `<span class="back">${back}</span>` : `<b>${front}</b>`}</div></div>`;
      flip.hidden = flipped;
      know.hidden = again.hidden = !flipped;
    };

    flip.addEventListener('click', () => {
      flipped = true;
      show();
    });
    know.addEventListener('click', () => {
      known.add(queue.shift().id);
      saveSet(KEY, known);
      flipped = false;
      show();
    });
    again.addEventListener('click', () => {
      queue.push(queue.shift());
      flipped = false;
      show();
    });
    root.querySelector('[data-reset]').addEventListener('click', () => {
      for (const c of deckCards()) known.delete(c.id);
      saveSet(KEY, known);
      start();
    });

    controls(root.querySelector('[data-controls]'), [
      { key: 'deck', type: 'toggle', label: 'Paquet', value: 'gloss', options: Object.entries(DECKS).map(([v, d]) => ({ v, l: `${d.name} (${d.cards.length})` })) },
      { key: 'dir', type: 'toggle', label: 'Sens', value: 'en', options: [{ v: 'en', l: 'Anglais → français' }, { v: 'fr', l: 'Français → anglais' }] },
    ], start, st);
  },
};
