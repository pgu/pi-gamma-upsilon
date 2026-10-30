import lessons from './lessons/index.js';
import { initGlossaryPopover } from './glossary.js';
import { getDone, setDone } from './ui.js';

const main = document.getElementById('main');
const nav = document.getElementById('nav');
const menuBtn = document.getElementById('menu');

initGlossaryPopover();

function renderNav(activeId) {
  const done = getDone();
  nav.innerHTML =
    `<a href="#/" class="nav-home${activeId === '' ? ' active' : ''}">🏠 Accueil</a><ol>` +
    lessons
      .map(
        (l, i) =>
          `<li><a href="#/${l.id}" class="${l.id === activeId ? 'active' : ''}"><span class="n">${done.has(l.id) ? '✓' : i}</span><span>${l.title}<small>${l.minutes} min</small></span></a></li>`,
      )
      .join('') +
    '</ol>';
}

function home() {
  const total = lessons.reduce((a, l) => a + l.minutes, 0);
  main.innerHTML = `
    <header class="hero">
      <p class="eyebrow">Γ Δ Θ ν ρ</p>
      <h1>Les grecques en finance</h1>
      <p class="lead">Un cours interactif pour débutant complet. On apprend en français, avec les termes anglais que tu entendras vraiment sur un desk : <em>strike, spot, hedge, delta-neutral, P&amp;L…</em></p>
      <a class="btn" href="#/${lessons[0].id}">Commencer le cours →</a>
    </header>
    <h2>Comment ça marche</h2>
    <ul class="how">
      <li>🧪 <b>Playgrounds</b> : des curseurs et des graphiques qui réagissent en direct.</li>
      <li>💡 <b>Indices</b> : clique pour déplier une explication quand tu bloques.</li>
      <li>📖 <b>Glossaire</b> : tout mot souligné en pointillés s'explique d'un clic.</li>
      <li>🏦 <b>« En pratique, sur un desk »</b> : le lien avec l'usage professionnel.</li>
      <li>✅ <b>Quiz</b> : pour vérifier que c'est compris. Ta progression est mémorisée dans ton navigateur.</li>
    </ul>
    <h2>Programme · ${total} min</h2>
    <ol class="toc">${lessons
      .map((l) => `<li><a href="#/${l.id}"><b>${l.title}</b><span>${l.blurb}</span><small>${l.minutes} min</small></a></li>`)
      .join('')}</ol>
    <p class="disclaimer">Contenu pédagogique, pas un conseil en investissement. Les calculs utilisent le modèle de Black-Scholes, une simplification de la réalité.</p>`;
  renderNav('');
  document.title = 'Les grecques en finance';
}

function lesson(l, idx) {
  const prev = lessons[idx - 1];
  const next = lessons[idx + 1];
  main.innerHTML = `
    <p class="eyebrow">Leçon ${idx} / ${lessons.length - 1} · ${l.minutes} min</p>
    <h1 tabindex="-1">${l.title}</h1>
    ${l.html()}
    <footer class="pager">
      ${prev ? `<a href="#/${prev.id}">← ${prev.title}</a>` : '<span></span>'}
      <button type="button" class="btn secondary" data-done></button>
      ${next ? `<a href="#/${next.id}">${next.title} →</a>` : '<span></span>'}
    </footer>`;
  const btn = main.querySelector('[data-done]');
  const paint = () => {
    const d = getDone().has(l.id);
    btn.textContent = d ? '✓ Terminée' : 'Marquer comme terminée';
    btn.setAttribute('aria-pressed', String(d));
    renderNav(l.id);
  };
  btn.addEventListener('click', () => {
    setDone(l.id, !getDone().has(l.id));
    paint();
  });
  l.init(main, () => {
    setDone(l.id, true);
    paint();
  });
  paint();
  document.title = `${l.title} — Les grecques en finance`;
}

function route() {
  const id = location.hash.replace(/^#\/?/, '');
  const idx = lessons.findIndex((l) => l.id === id);
  if (idx < 0) home();
  else lesson(lessons[idx], idx);
  nav.classList.remove('open');
  menuBtn.setAttribute('aria-expanded', 'false');
  window.scrollTo(0, 0);
  main.querySelector('h1')?.focus({ preventScroll: true });
}

menuBtn.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', String(open));
});
window.addEventListener('hashchange', route);
route();
