import { GLOSSARY, T } from '../glossary.js';
import { quiz, callout } from '../ui.js';

export default {
  id: 'cheatsheet',
  title: 'Aide-mémoire & quiz final',
  blurb: 'Tout sur une page, plus un glossaire searchable.',
  minutes: 10,
  html: () => `
    <p class="lead">Récapitulatif de ce que tu viens de voir. Imprime-le, c'est fait pour ça.</p>

    <div class="tbl-wrap"><table class="tbl cheat">
      <thead><tr><th>Grecque</th><th>Dérivée de V par rapport à…</th><th>Répond à</th><th>Long call</th><th>Long put</th><th>Max autour de</th></tr></thead>
      <tbody>
        <tr><td>${T('delta')} Δ</td><td>S</td><td>+1 de spot ?</td><td>0 → +1</td><td>−1 → 0</td><td>ITM (|Δ|→1)</td></tr>
        <tr><td>${T('gamma')} Γ</td><td>S (2ᵉ ordre)</td><td>Combien le delta change ?</td><td>+</td><td>+</td><td>ATM, court terme</td></tr>
        <tr><td>${T('vega')} ν</td><td>σ</td><td>+1 pt de vol ?</td><td>+</td><td>+</td><td>ATM, long terme</td></tr>
        <tr><td>${T('theta')} Θ</td><td>t</td><td>1 jour qui passe ?</td><td>−</td><td>−</td><td>ATM, juste avant l'échéance</td></tr>
        <tr><td>${T('rho')} ρ</td><td>r</td><td>+1 pt de taux ?</td><td>+</td><td>−</td><td>Options longues</td></tr>
      </tbody>
    </table></div>

    <h2>Positions long / short</h2>
    <div class="tbl-wrap"><table class="tbl">
      <thead><tr><th></th><th>Δ</th><th>Γ</th><th>ν</th><th>Θ</th></tr></thead>
      <tbody>
        <tr><th>Acheteur d'option</th><td>signe du call/put</td><td>+</td><td>+</td><td>−</td></tr>
        <tr><th>Vendeur d'option</th><td>signe opposé</td><td>−</td><td>−</td><td>+</td></tr>
      </tbody>
    </table></div>

    ${callout('info', 'Les 3 phrases à retenir', `<ol>
      <li><b>Delta</b> dit <em>où</em> tu es exposé, <b>gamma</b> dit à quelle vitesse ça change.</li>
      <li><b>Gamma se paie en theta</b> (et inversement) : c'est le compromis fondamental.</li>
      <li>Le P&amp;L d'un trade couvert, c'est <b>vol réalisée vs vol implicite</b>.</li>
    </ol>`)}

    <h2>Quiz final</h2>
    <div data-quiz></div>

    <h2>Glossaire</h2>
    <input type="search" class="search" placeholder="Rechercher un terme (ex. strike, hedge…)" aria-label="Rechercher dans le glossaire" data-search>
    <dl class="glossary" data-glossary></dl>
  `,
  init(root, done) {
    quiz(root.querySelector('[data-quiz]'), [
      { q: 'Tu veux profiter d\'un marché très agité sans parier sur le sens. Quelle position ?', opts: ['Short strangle', 'Long straddle', 'Covered call', 'Short put'], a: 1, why: 'Le long straddle est long gamma et long vega : il gagne de tout gros mouvement, dans les deux sens.' },
      { q: 'Quelle grecque a le même signe pour un call et un put acheteurs ?', opts: ['Delta', 'Rho', 'Gamma', 'Aucune'], a: 2, why: 'Gamma (et vega) sont positifs pour tout acheteur d\'option.' },
      { q: 'La veille d\'une annonce, l\'IV est très élevée. Que fais-tu si tu veux « vendre de la vol » ?', opts: ['Tu achètes des options', 'Tu vends des options (short vega)', 'Tu achètes de l\'action', 'Rien'], a: 1, why: 'Vendre vega quand l\'IV est haute te permet de bénéficier de l\'IV crush attendu — au prix d\'un risque gamma.' },
      { q: 'Delta d\'une option ATM de 3 mois : environ…', opts: ['±0,1', '±0,5', '±0,9', '0'], a: 1, why: 'ATM ≈ ±0,5 : une chance sur deux de finir ITM, c\'est le point de basculement.' },
      { q: 'Le theta d\'un book est +500 €/jour. C\'est…', opts: ['Un gain garanti', 'Un gain si le marché reste calme, avec un risque gamma/vega en face', 'Une perte', 'Du delta'], a: 1, why: 'Le theta n\'est jamais gratuit : tu es short gamma/vega, ce qui coûte cher en cas de gros mouvement.' },
    ], done);

    const list = root.querySelector('[data-glossary]');
    const render = (q = '') => {
      const needle = q.trim().toLowerCase();
      list.innerHTML = Object.values(GLOSSARY)
        .filter(([en, def]) => !needle || en.toLowerCase().includes(needle) || def.toLowerCase().includes(needle))
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([en, def]) => `<dt>${en}</dt><dd>${def}</dd>`)
        .join('') || '<dd>Aucun résultat.</dd>';
    };
    render();
    root.querySelector('[data-search]').addEventListener('input', (e) => render(e.target.value));
  },
};
