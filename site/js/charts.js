// Tiny dependency-free SVG charts. Colours come from CSS variables --c0..--c3.

const W = 640;
const H = 330;
const M = { l: 58, r: 18, t: 22, b: 46 };

function niceTicks(min, max, n = 5) {
  const span = max - min || 1;
  const raw = span / n;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
  const out = [];
  for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-9; v += step) out.push(+v.toPrecision(12));
  return out;
}

const defaultFmt = (v) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 }).format(v);

/**
 * series:  [{ label, pts: [[x, y], ...], color: 0..3, dash?: bool }]
 * markers: [{ x, y, label, color? }]   vlines: [{ x, label }]
 * xReverse draws large x on the left (e.g. "days remaining": time flows left to right).
 */
export function lineChart({ series, xLabel = '', yLabel = '', markers = [], vlines = [], xReverse = false, xFmt = defaultFmt, yFmt = defaultFmt, title = '' }) {
  const pts = series.flatMap((s) => s.pts);
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]).concat(markers.map((m) => m.y));
  const xmin = Math.min(...xs);
  const xmax = Math.max(...xs);
  let ymin = Math.min(...ys);
  let ymax = Math.max(...ys);
  const pad = (ymax - ymin) * 0.08 || 1;
  ymin -= pad;
  ymax += pad;

  const sx = (x) => M.l + ((xReverse ? xmax - x : x - xmin) / (xmax - xmin || 1)) * (W - M.l - M.r);
  const sy = (y) => H - M.b - ((y - ymin) / (ymax - ymin)) * (H - M.t - M.b);
  const f = (n) => n.toFixed(1);

  let g = '';
  for (const t of niceTicks(ymin, ymax)) {
    g += `<line class="grid${t === 0 ? ' zero' : ''}" x1="${M.l}" x2="${W - M.r}" y1="${f(sy(t))}" y2="${f(sy(t))}"/>`;
    g += `<text class="tick" x="${M.l - 8}" y="${f(sy(t) + 4)}" text-anchor="end">${yFmt(t)}</text>`;
  }
  for (const t of niceTicks(xmin, xmax, 6)) {
    g += `<line class="grid v" x1="${f(sx(t))}" x2="${f(sx(t))}" y1="${M.t}" y2="${H - M.b}"/>`;
    g += `<text class="tick" x="${f(sx(t))}" y="${H - M.b + 18}" text-anchor="middle">${xFmt(t)}</text>`;
  }
  for (const v of vlines) {
    g += `<line class="vline" x1="${f(sx(v.x))}" x2="${f(sx(v.x))}" y1="${M.t}" y2="${H - M.b}"/>`;
    if (v.label) g += `<text class="vlabel" x="${f(sx(v.x) + 4)}" y="${M.t + 12}">${v.label}</text>`;
  }
  for (const s of series) {
    const d = s.pts.map((p, i) => `${i ? 'L' : 'M'}${f(sx(p[0]))},${f(sy(p[1]))}`).join('');
    g += `<path class="line c${s.color ?? 0}${s.dash ? ' dash' : ''}" d="${d}"/>`;
  }
  for (const m of markers) {
    const right = sx(m.x) < W - 150;
    g += `<circle class="marker c${m.color ?? 0}" cx="${f(sx(m.x))}" cy="${f(sy(m.y))}" r="5"/>`;
    if (m.label) {
      g += `<text class="mlabel" x="${f(sx(m.x) + (right ? 9 : -9))}" y="${f(sy(m.y) - 9)}" text-anchor="${right ? 'start' : 'end'}">${m.label}</text>`;
    }
  }
  g += `<text class="axis" x="${(M.l + W - M.r) / 2}" y="${H - 6}" text-anchor="middle">${xLabel}</text>`;
  g += `<text class="axis" transform="translate(14 ${(M.t + H - M.b) / 2}) rotate(-90)" text-anchor="middle">${yLabel}</text>`;

  const legend = series
    .filter((s) => s.label)
    .map((s) => `<span class="lg"><i class="sw c${s.color ?? 0}${s.dash ? ' dash' : ''}"></i>${s.label}</span>`)
    .join('');
  return `<figure class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${title || yLabel + ' en fonction de ' + xLabel}">${g}</svg>${legend ? `<figcaption class="legend">${legend}</figcaption>` : ''}</figure>`;
}

export function histogram({ values, bins = 24, xLabel = '', markers = [], xFmt = defaultFmt }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const w = (max - min) / bins || 1;
  const counts = Array(bins).fill(0);
  for (const v of values) counts[Math.min(bins - 1, Math.floor((v - min) / w))]++;
  const cmax = Math.max(...counts);
  const sx = (x) => M.l + ((x - min) / (max - min || 1)) * (W - M.l - M.r);
  const bw = (W - M.l - M.r) / bins;
  let g = '';
  counts.forEach((c, i) => {
    const h = (c / cmax) * (H - M.t - M.b);
    g += `<rect class="bar" x="${(M.l + i * bw + 1).toFixed(1)}" y="${(H - M.b - h).toFixed(1)}" width="${(bw - 2).toFixed(1)}" height="${h.toFixed(1)}"/>`;
  });
  for (const t of niceTicks(min, max, 6)) {
    g += `<text class="tick" x="${sx(t).toFixed(1)}" y="${H - M.b + 18}" text-anchor="middle">${xFmt(t)}</text>`;
  }
  for (const m of markers) {
    if (m.x < min || m.x > max) continue;
    g += `<line class="vline" x1="${sx(m.x).toFixed(1)}" x2="${sx(m.x).toFixed(1)}" y1="${M.t}" y2="${H - M.b}"/>`;
    g += `<text class="vlabel" x="${(sx(m.x) + 4).toFixed(1)}" y="${M.t + 12}">${m.label}</text>`;
  }
  g += `<line class="grid zero" x1="${M.l}" x2="${W - M.r}" y1="${H - M.b}" y2="${H - M.b}"/>`;
  g += `<text class="axis" x="${(M.l + W - M.r) / 2}" y="${H - 6}" text-anchor="middle">${xLabel}</text>`;
  return `<figure class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Histogramme : ${xLabel}">${g}</svg></figure>`;
}
