import { quiz, callout } from '../ui.js';

const KEY = 'grecques.exam';

const QUESTIONS = [
  { q: '<b>Couverture.</b> Ton book est short 50 calls (×100) de delta 0,40 et long 1 000 actions. Delta net ?', opts: ['+1 000 actions', '−1 000 actions', '−2 000 actions', '+3 000 actions'], a: 1, why: 'Calls vendus : −0,40 × 50 × 100 = −2 000. Avec +1 000 actions : −1 000. Pour être delta-neutral, il faut acheter 1 000 actions de plus.' },
  { q: '<b>Gamma.</b> Δ = +200, Γ = −50 par point de spot. Le spot monte de 4 points. Delta estimé ensuite ?', opts: ['+400', '+200', '0', '−200'], a: 2, why: 'Δ_new ≈ Δ + Γ·ΔS = 200 + (−50 × 4) = 0.' },
  { q: '<b>P&L explain.</b> Book : theta +800 €/jour, vega −15 000 €/pt. L\'IV monte de 2 points, rien d\'autre ne change. P&L du jour ≈ ?', opts: ['+800 €', '−29 200 €', '−30 800 €', '+30 800 €'], a: 1, why: 'Vega : −15 000 × 2 = −30 000. Theta : +800. Total ≈ −29 200 €. Le theta d\'un jour est loin de compenser.' },
  { q: '<b>Earnings.</b> Tu achètes un straddle ATM la veille des résultats (IV 70 %, mouvement implicite ±8 %). L\'IV tombe à 35 % et l\'action bouge de 3 %. Résultat probable ?', opts: ['Gain, le spot a bougé', 'Perte : IV crush et mouvement inférieur à l\'implicite', 'Zéro', 'Gain grâce au theta'], a: 1, why: 'Tu perds du vega et le mouvement réel est loin du mouvement implicite que tu as payé.' },
  { q: '<b>Delta-hedging.</b> Tu vends une option à 20 % d\'IV et la couvres chaque jour. La vol réalisée est de 30 %. Résultat attendu ?', opts: ['Gain', 'Perte', 'Zéro', 'Dépend du delta initial'], a: 1, why: 'P&L ≈ ½·Γ·S²·(σ_imp² − σ_réal²)·dt < 0 : tu as vendu la vol trop bon marché.' },
  { q: '<b>Skew.</b> Sur un indice, le put 90 cote 28 % d\'IV, la vol ATM 24 %. Pricer ce put avec la vol ATM donne un prix…', opts: ['Trop bas', 'Trop haut', 'Exact', 'Négatif'], a: 0, why: 'Le prix croît avec σ : utiliser 24 % au lieu de 28 % sous-estime la prime que le marché demande.' },
  { q: '<b>Stratégie.</b> Tu attends un marché calme entre 90 et 110, veux encaisser un crédit et borner ton risque. Quelle structure ?', opts: ['Long straddle', 'Iron condor', 'Long call', 'Risk reversal'], a: 1, why: 'L\'iron condor : strangle vendu (put 90 / call 110) protégé par des ailes achetées. Crédit encaissé, risque borné.' },
  { q: '<b>Grecques de 2ᵉ ordre.</b> Le week-end passe, le spot est inchangé, mais le delta de ton option OTM a baissé. Quelle grecque l\'explique ?', opts: ['Vanna', 'Volga', 'Charm', 'Rho'], a: 2, why: 'Charm = ∂Δ/∂t : le temps qui passe fait glisser le delta d\'une option OTM vers 0.' },
  { q: '<b>Américaines.</b> Un put américain très ITM, avec des taux élevés. L\'exercice anticipé peut-il être optimal ?', opts: ['Jamais : on exerce seulement à l\'échéance', 'Oui : le strike encaissé tôt rapporte des intérêts', 'Seulement pour les calls', 'Non, la valeur temps est toujours supérieure'], a: 1, why: 'Recevoir K tout de suite peut valoir plus que la valeur temps restante, surtout quand les taux sont élevés.' },
];

export default {
  id: 'exam',
  title: 'Examen final : scénarios de desk',
  blurb: '9 mises en situation pour vérifier que tout est acquis.',
  minutes: 15,
  html: () => `
    <p class="lead">Dernier test. Pas de playground cette fois : des situations comme celles qu'un desk te soumettrait, avec chiffres. Prends un papier et un crayon si besoin.</p>
    ${callout('info', 'Règles', 'Une seule réponse par question, avec explication immédiate. Il faut <b>7 / 9</b> pour valider la leçon. Ton meilleur score est mémorisé dans ton navigateur.')}
    <div data-best class="readout"></div>
    <div data-quiz></div>
    <div data-verdict></div>
  `,
  init(root, done) {
    const best = root.querySelector('[data-best]');
    const paintBest = () => {
      let v = null;
      try {
        v = localStorage.getItem(KEY);
      } catch {
        /* storage unavailable */
      }
      best.textContent = v ? `Meilleur score : ${v} / ${QUESTIONS.length}` : 'Pas encore de score enregistré.';
    };
    paintBest();

    quiz(root.querySelector('[data-quiz]'), QUESTIONS, null, (right, total) => {
      try {
        const prev = +localStorage.getItem(KEY) || 0;
        if (right > prev) localStorage.setItem(KEY, String(right));
      } catch {
        /* storage unavailable */
      }
      paintBest();
      const verdict =
        right >= 8
          ? ['🏆 Desk-ready', 'Tu maîtrises les grecques et leur usage professionnel. Prochaine étape : pratiquer sur de vraies cotations.']
          : right >= 7
            ? ['✅ Solide', 'Tu as validé. Relis les explications des questions ratées pour les points fins.']
            : ['📚 À consolider', 'Relis les leçons concernées (delta/gamma/vega/theta, puis le P&L explain et le delta-hedging) et retente.'];
      root.querySelector('[data-verdict]').innerHTML = callout(right >= 7 ? 'info' : 'warn', `${verdict[0]} : ${right} / ${total}`, verdict[1]);
      if (right >= 7) done();
    });
  },
};
