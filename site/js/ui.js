// Shared UI helpers for lessons: sliders/toggles, quizzes, callouts, progress.

export const nf = (x, d = 2) =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d }).format(Object.is(x, -0) ? 0 : x);
export const sgn = (x, d = 2) => (x > 0 ? '+' : '') + nf(x, d);

export const callout = (kind, title, body) =>
  `<aside class="callout ${kind}"><strong>${title}</strong><div>${body}</div></aside>`;
export const hint = (body, label = 'Indice') =>
  `<details class="hint"><summary>💡 ${label}</summary><div>${body}</div></details>`;
export const stats = (items) =>
  `<dl class="stats">${items.map((i) => `<div><dt>${i.k}</dt><dd>${i.v}</dd>${i.sub ? `<small>${i.sub}</small>` : ''}</div>`).join('')}</dl>`;

/**
 * Build sliders / toggles inside `el`. Calls onChange(state) now and on every change.
 * Pass your own `state` object if onChange needs it before controls() returns.
 * spec: { key, label, min, max, step, value, fmt?, hint? }  (slider)
 *       { key, type:'toggle', label, options:[{v,l}], value, hint? }
 */
export function controls(el, specs, onChange, state = {}) {
  el.classList.add('controls');
  for (const s of specs) {
    state[s.key] = s.value;
    const wrap = document.createElement('div');
    wrap.className = 'ctl';
    const info = s.hint ? `<button type="button" class="ctl-info" aria-label="Aide : ${s.label}">?</button>` : '';
    if (s.type === 'toggle') {
      wrap.innerHTML =
        `<div class="ctl-head"><span>${s.label}</span>${info}</div>` +
        `<div class="seg" role="group" aria-label="${s.label}">${s.options
          .map((o) => `<button type="button" data-v="${o.v}" aria-pressed="${o.v === s.value}">${o.l}</button>`)
          .join('')}</div>`;
      const btns = wrap.querySelectorAll('.seg button');
      btns.forEach((b) =>
        b.addEventListener('click', () => {
          state[s.key] = b.dataset.v;
          btns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
          onChange(state);
        }),
      );
    } else if (s.type === 'select') {
      wrap.innerHTML =
        `<div class="ctl-head"><span>${s.label}</span>${info}</div>` +
        `<select aria-label="${s.label}">${s.options.map((o) => `<option value="${o.v}"${o.v === s.value ? ' selected' : ''}>${o.l}</option>`).join('')}</select>`;
      wrap.querySelector('select').addEventListener('change', (e) => {
        state[s.key] = e.target.value;
        onChange(state);
      });
    } else {
      const fmt = s.fmt || ((v) => nf(v, 0));
      wrap.innerHTML =
        `<div class="ctl-head"><span>${s.label}</span>${info}<output>${fmt(s.value)}</output></div>` +
        `<input type="range" min="${s.min}" max="${s.max}" step="${s.step}" value="${s.value}" aria-label="${s.label}">`;
      const input = wrap.querySelector('input');
      const out = wrap.querySelector('output');
      input.addEventListener('input', () => {
        state[s.key] = +input.value;
        out.textContent = fmt(+input.value);
        onChange(state);
      });
    }
    if (s.hint) {
      const p = document.createElement('p');
      p.className = 'ctl-hint';
      p.hidden = true;
      p.innerHTML = s.hint;
      wrap.append(p);
      wrap.querySelector('.ctl-info').addEventListener('click', () => (p.hidden = !p.hidden));
    }
    el.append(wrap);
  }
  onChange(state);
  return state;
}

/** questions: [{ q, opts: [...], a: index, why }] */
export function quiz(el, questions, onPerfect, onFinish) {
  let right = 0;
  let done = 0;
  el.innerHTML =
    questions
      .map(
        (q, i) =>
          `<div class="q" data-i="${i}"><p class="q-text">${i + 1}. ${q.q}</p><div class="opts">${q.opts
            .map((o, j) => `<button type="button" data-j="${j}">${o}</button>`)
            .join('')}</div><p class="q-fb" hidden></p></div>`,
      )
      .join('') + '<p class="q-score" aria-live="polite"></p>';
  el.querySelectorAll('.q').forEach((div) => {
    const q = questions[+div.dataset.i];
    const fb = div.querySelector('.q-fb');
    div.querySelectorAll('.opts button').forEach((b) =>
      b.addEventListener('click', () => {
        if (div.dataset.done) return;
        div.dataset.done = '1';
        const ok = +b.dataset.j === q.a;
        if (ok) right++;
        done++;
        div.querySelectorAll('.opts button').forEach((x, j) => {
          x.disabled = true;
          if (j === q.a) x.classList.add('good');
        });
        if (!ok) b.classList.add('bad');
        fb.hidden = false;
        fb.innerHTML = (ok ? '✅ Correct. ' : '❌ Pas tout à fait. ') + q.why;
        if (done === questions.length) {
          el.querySelector('.q-score').textContent = `Score : ${right} / ${questions.length}`;
          if (right === questions.length && onPerfect) onPerfect();
          if (onFinish) onFinish(right, questions.length);
        }
      }),
    );
  });
}

const KEY = 'grecques.done';
export function getDone() {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) || '[]'));
  } catch {
    return new Set();
  }
}
export function setDone(id, on) {
  const s = getDone();
  on ? s.add(id) : s.delete(id);
  try {
    localStorage.setItem(KEY, JSON.stringify([...s]));
  } catch {
    /* storage unavailable: progress simply isn't remembered */
  }
}

export function loadSet(key) {
  try {
    return new Set(JSON.parse(localStorage.getItem(key) || '[]'));
  } catch {
    return new Set();
  }
}
export function saveSet(key, set) {
  try {
    localStorage.setItem(key, JSON.stringify([...set]));
  } catch {
    /* storage unavailable */
  }
}
