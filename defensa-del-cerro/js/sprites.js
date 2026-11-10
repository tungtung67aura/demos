/* Defensa del Cerro — arte vectorial dibujado por código (personajes, barcos, torres, íconos). */
import { TOWERS, ENEMIES } from './data.js';

export const INK = '#211a2e';
const TAU = Math.PI * 2;

function ell(c, x, y, rx, ry, fill, stroke, lw) {
  c.beginPath(); c.ellipse(x, y, Math.abs(rx), Math.abs(ry), 0, 0, TAU);
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.lineWidth = lw; c.strokeStyle = stroke; c.stroke(); }
}
function rr(c, x, y, w, h, r, fill, stroke, lw) {
  c.beginPath(); c.roundRect(x, y, w, h, r);
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.lineWidth = lw; c.strokeStyle = stroke; c.stroke(); }
}
function poly(c, pts, fill, stroke, lw) {
  c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.closePath();
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.lineWidth = lw; c.strokeStyle = stroke; c.lineJoin = 'round'; c.stroke(); }
}
function line(c, x1, y1, x2, y2, col, lw, cap = 'round') { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.strokeStyle = col; c.lineWidth = lw; c.lineCap = cap; c.stroke(); }

// ---------- personajes (vista frontal "chibi", el que llama espeja según dirección) ----------
function chibi(c, u, f, o) {
  const lw = Math.max(1, u * 0.1);
  const ph = f / 4 * TAU, la = Math.sin(ph) * 0.1 * u, lb = -la;
  const bw = (o.bw || 0.62) * u, bh = (o.bh || 0.56) * u, hr = (o.hr || 0.36) * u;
  // piernas
  ell(c, -0.17 * u, 0.5 * u + la, 0.13 * u, 0.16 * u, o.legs || '#3b3048', INK, lw);
  ell(c, 0.17 * u, 0.5 * u + lb, 0.13 * u, 0.16 * u, o.legs || '#3b3048', INK, lw);
  if (o.back) o.back(c, u, lw, f);
  // cuerpo
  c.beginPath(); c.ellipse(0, 0.14 * u, bw / 2 + 0.02 * u, bh / 2 + 0.02 * u, 0, 0, TAU); c.fillStyle = INK; c.fill();
  ell(c, 0, 0.14 * u, bw / 2, bh / 2, o.coat);
  if (o.body) o.body(c, u, lw, f);
  // brillo
  c.globalAlpha = 0.18; ell(c, -bw * 0.18, 0.02 * u, bw * 0.16, bh * 0.22, '#fff'); c.globalAlpha = 1;
  // brazos
  const sw = Math.sin(ph) * 0.06 * u;
  ell(c, -bw / 2 - 0.02 * u, 0.16 * u - sw, 0.11 * u, 0.15 * u, o.arm || o.coat, INK, lw);
  ell(c, bw / 2 + 0.02 * u, 0.16 * u + sw, 0.11 * u, 0.15 * u, o.arm || o.coat, INK, lw);
  if (o.weapon) o.weapon(c, u, lw, f, sw);
  // cabeza
  const hy = -0.33 * u;
  ell(c, 0, hy, hr, hr * 0.95, o.skin || '#f0bf8e', INK, lw);
  if (o.face) o.face(c, u, lw, hy, hr); else {
    ell(c, -0.12 * u, hy + 0.02 * u, 0.045 * u, 0.06 * u, INK); ell(c, 0.12 * u, hy + 0.02 * u, 0.045 * u, 0.06 * u, INK);
  }
  if (o.hat) o.hat(c, u, lw, hy, hr);
}
const bandana = (col) => (c, u, lw, hy, hr) => {
  c.beginPath(); c.arc(0, hy, hr, Math.PI * 1.05, Math.PI * 1.95); c.closePath(); c.fillStyle = col; c.fill(); c.lineWidth = lw; c.strokeStyle = INK; c.stroke();
  ell(c, hr * 0.95, hy - hr * 0.3, 0.09 * u, 0.06 * u, col, INK, lw * 0.8);
};
const tricorn = (col, trim) => (c, u, lw, hy, hr) => {
  poly(c, [-hr * 1.45, hy - hr * 0.35, 0, hy - hr * 1.5, hr * 1.45, hy - hr * 0.35, 0, hy - hr * 0.62], col, INK, lw);
  if (trim) line(c, -hr * 1.3, hy - hr * 0.42, hr * 1.3, hy - hr * 0.42, trim, lw * 0.9);
};
const knife = (c, u, lw, f, sw) => { line(c, 0.36 * u, 0.2 * u + sw, 0.58 * u, -0.05 * u + sw, '#d9dde6', lw * 1.3); };
const sabre = (c, u, lw, f, sw) => {
  c.beginPath(); c.moveTo(0.36 * u, 0.22 * u + sw); c.quadraticCurveTo(0.75 * u, 0.0, 0.62 * u, -0.38 * u + sw); c.strokeStyle = INK; c.lineWidth = lw * 2.2; c.lineCap = 'round'; c.stroke();
  c.strokeStyle = '#e6eaf2'; c.lineWidth = lw * 1.1; c.stroke();
};

const ENEMY_ART = {
  grumete: (c, u, f) => chibi(c, u, f, {
    coat: '#f4f1ea', arm: '#f4f1ea', hat: bandana('#d8443a'), weapon: knife,
    body: (c, u, lw) => { c.save(); c.beginPath(); c.ellipse(0, 0.14 * u, 0.31 * u, 0.28 * u, 0, 0, TAU); c.clip(); for (let i = -2; i <= 2; i++) rr(c, -0.4 * u, 0.06 * u + i * 0.12 * u, 0.8 * u, 0.05 * u, 0, '#2f5d9e'); c.restore(); },
  }),
  corsario: (c, u, f) => chibi(c, u, f, {
    coat: '#7a3fa0', arm: '#6a3590', bw: 0.52, hat: bandana('#f2b631'), weapon: sabre,
    back: (c, u, lw) => { c.globalAlpha = 0.5; for (let i = 0; i < 3; i++) line(c, -0.55 * u - i * 0.1 * u, -0.1 * u + i * 0.18 * u, -0.85 * u - i * 0.1 * u, -0.1 * u + i * 0.18 * u, '#fff', lw); c.globalAlpha = 1; },
  }),
  acorazado: (c, u, f) => chibi(c, u, f, {
    coat: '#9aa3b1', arm: '#7d8696', bw: 0.72, bh: 0.62, legs: '#4a4f5c',
    body: (c, u, lw) => { line(c, 0, -0.1 * u, 0, 0.42 * u, '#6b7382', lw); ell(c, 0, 0.1 * u, 0.12 * u, 0.1 * u, '#c9d0db', INK, lw * 0.7); },
    hat: (c, u, lw, hy, hr) => { // morrión
      c.beginPath(); c.ellipse(0, hy - hr * 0.2, hr * 1.5, hr * 0.38, 0, 0, TAU); c.fillStyle = '#b7bfcc'; c.fill(); c.lineWidth = lw; c.strokeStyle = INK; c.stroke();
      c.beginPath(); c.arc(0, hy - hr * 0.25, hr * 0.9, Math.PI, 0); c.closePath(); c.fillStyle = '#c9d0db'; c.fill(); c.stroke();
      poly(c, [-0.06 * u, hy - hr * 1.1, 0, hy - hr * 1.55, 0.06 * u, hy - hr * 1.1], '#c9d0db', INK, lw * 0.8);
    },
    weapon: (c, u, lw, f, sw) => { line(c, 0.42 * u, 0.35 * u + sw, 0.42 * u, -0.75 * u + sw, '#7a5230', lw * 1.4); poly(c, [0.32 * u, -0.7 * u + sw, 0.42 * u, -0.95 * u + sw, 0.52 * u, -0.7 * u + sw], '#d9dde6', INK, lw * 0.7); },
  }),
  escudero: (c, u, f) => chibi(c, u, f, {
    coat: '#2e7d5b', arm: '#286b4e', hat: tricorn('#2b2b38'),
    weapon: (c, u, lw, f, sw) => {
      ell(c, -0.28 * u, 0.2 * u, 0.36 * u, 0.4 * u, '#9b6a3a', INK, lw * 1.2);
      ell(c, -0.28 * u, 0.2 * u, 0.24 * u, 0.28 * u, null, '#6b4523', lw);
      ell(c, -0.28 * u, 0.2 * u, 0.08 * u, 0.08 * u, '#d7dbe3', INK, lw * 0.7);
    },
  }),
  cirujano: (c, u, f) => chibi(c, u, f, {
    coat: '#f7f7f2', arm: '#e9e9e2',
    body: (c, u, lw) => { rr(c, -0.06 * u, 0.0, 0.12 * u, 0.32 * u, 0.02 * u, '#3fbf6a'); rr(c, -0.16 * u, 0.1 * u, 0.32 * u, 0.12 * u, 0.02 * u, '#3fbf6a'); },
    hat: (c, u, lw, hy, hr) => { rr(c, -hr * 0.75, hy - hr * 1.75, hr * 1.5, hr * 1.1, hr * 0.15, '#2b2b38', INK, lw); rr(c, -hr * 1.15, hy - hr * 0.8, hr * 2.3, hr * 0.25, hr * 0.1, '#2b2b38', INK, lw); },
    face: (c, u, lw, hy, hr) => { ell(c, -0.12 * u, hy + 0.02 * u, 0.09 * u, 0.09 * u, '#cfe8ff', INK, lw * 0.6); ell(c, 0.12 * u, hy + 0.02 * u, 0.09 * u, 0.09 * u, '#cfe8ff', INK, lw * 0.6); },
    weapon: (c, u, lw) => { rr(c, 0.3 * u, 0.2 * u, 0.3 * u, 0.24 * u, 0.05 * u, '#8a4b2a', INK, lw); line(c, 0.36 * u, 0.2 * u, 0.42 * u, 0.12 * u, INK, lw); line(c, 0.54 * u, 0.2 * u, 0.48 * u, 0.12 * u, INK, lw); },
  }),
  contrab: (c, u, f) => chibi(c, u, f, {
    coat: '#2d2a3d', arm: '#25222f', skin: '#2d2a3d',
    hat: (c, u, lw, hy, hr) => { c.beginPath(); c.moveTo(-hr * 1.05, hy + hr * 0.6); c.quadraticCurveTo(-hr * 1.2, hy - hr * 1.5, 0, hy - hr * 1.35); c.quadraticCurveTo(hr * 1.2, hy - hr * 1.5, hr * 1.05, hy + hr * 0.6); c.fillStyle = '#3a3550'; c.fill(); c.lineWidth = lw; c.strokeStyle = INK; c.stroke(); ell(c, 0, hy + hr * 0.1, hr * 0.7, hr * 0.62, '#14121c'); },
    face: (c, u, lw, hy) => { ell(c, -0.1 * u, hy + 0.04 * u, 0.06 * u, 0.035 * u, '#7cf7d4'); ell(c, 0.1 * u, hy + 0.04 * u, 0.06 * u, 0.035 * u, '#7cf7d4'); },
    weapon: knife,
  }),
  carreton: (c, u, f) => {
    const lw = Math.max(1, u * 0.09);
    rr(c, -0.85 * u, -0.35 * u, 1.7 * u, 0.85 * u, 0.12 * u, '#9b6a3a', INK, lw);
    for (let i = -1; i <= 1; i++) line(c, -0.8 * u, 0.08 * u + i * 0.22 * u, 0.8 * u, 0.08 * u + i * 0.22 * u, '#7a5230', lw * 0.7);
    for (const bx of [-0.42, 0.05, 0.5]) { ell(c, bx * u, -0.48 * u, 0.24 * u, 0.3 * u, '#b07a42', INK, lw); line(c, bx * u - 0.22 * u, -0.5 * u, bx * u + 0.22 * u, -0.5 * u, '#5b3a1e', lw); }
    for (const wx of [-0.55, 0.55]) {
      ell(c, wx * u, 0.5 * u, 0.3 * u, 0.3 * u, '#6b4523', INK, lw);
      const a = f / 4 * Math.PI;
      for (let k = 0; k < 2; k++) { const aa = a + k * Math.PI / 2; line(c, wx * u - Math.cos(aa) * 0.24 * u, 0.5 * u - Math.sin(aa) * 0.24 * u, wx * u + Math.cos(aa) * 0.24 * u, 0.5 * u + Math.sin(aa) * 0.24 * u, '#3b2412', lw * 0.8); }
      ell(c, wx * u, 0.5 * u, 0.07 * u, 0.07 * u, '#3b2412');
    }
    // calavera pintada
    ell(c, 0, 0.12 * u, 0.13 * u, 0.12 * u, '#f4f1ea');
  },
  tuerto: (c, u, f) => chibi(c, u, f, {
    coat: '#b8392e', arm: '#a8322a', bw: 0.78, bh: 0.66, hr: 0.38, skin: '#e3a777',
    body: (c, u, lw) => { line(c, -0.3 * u, -0.05 * u, 0.25 * u, 0.4 * u, '#5b3a1e', lw * 1.6); },
    face: (c, u, lw, hy, hr) => { ell(c, 0.12 * u, hy + 0.02 * u, 0.05 * u, 0.06 * u, INK); ell(c, -0.12 * u, hy + 0.01 * u, 0.11 * u, 0.09 * u, INK); line(c, -0.3 * u, hy - 0.12 * u, 0.3 * u, hy - 0.06 * u, INK, lw * 0.8); c.beginPath(); c.arc(0, hy + 0.12 * u, 0.12 * u, 0.2, Math.PI - 0.2); c.strokeStyle = INK; c.lineWidth = lw; c.stroke(); },
    weapon: (c, u, lw, f, sw) => { // ancla
      line(c, 0.45 * u, 0.4 * u + sw, 0.45 * u, -0.5 * u + sw, '#5c6370', lw * 1.8);
      c.beginPath(); c.arc(0.45 * u, 0.25 * u + sw, 0.22 * u, 0.2, Math.PI - 0.2); c.strokeStyle = '#5c6370'; c.lineWidth = lw * 1.8; c.stroke();
      ell(c, 0.45 * u, -0.55 * u + sw, 0.08 * u, 0.08 * u, null, '#5c6370', lw * 1.2);
    },
  }),
  malacara: (c, u, f) => chibi(c, u, f, {
    coat: '#8f1f2b', arm: '#7d1a25', bw: 0.74, bh: 0.64, hr: 0.38,
    body: (c, u, lw) => { line(c, 0, -0.12 * u, 0, 0.44 * u, '#f2c94c', lw * 1.1); for (const y of [0.02, 0.16, 0.3]) ell(c, 0.08 * u, y * u, 0.03 * u, 0.03 * u, '#f2c94c'); },
    face: (c, u, lw, hy, hr) => {
      ell(c, -0.12 * u, hy - 0.02 * u, 0.05 * u, 0.06 * u, INK); ell(c, 0.12 * u, hy - 0.02 * u, 0.05 * u, 0.06 * u, INK);
      c.beginPath(); c.moveTo(-hr * 0.85, hy + 0.04 * u); c.quadraticCurveTo(0, hy + hr * 1.9, hr * 0.85, hy + 0.04 * u); c.quadraticCurveTo(0, hy + hr * 0.6, -hr * 0.85, hy + 0.04 * u); c.fillStyle = '#1c1a22'; c.fill();
    },
    hat: (c, u, lw, hy, hr) => { tricorn('#1c1a22', '#f2c94c')(c, u, lw, hy, hr); c.beginPath(); c.moveTo(hr * 0.2, hy - hr * 1.2); c.quadraticCurveTo(hr * 1.6, hy - hr * 2.4, hr * 1.9, hy - hr * 1.0); c.strokeStyle = '#e8f0ff'; c.lineWidth = lw * 2; c.stroke(); },
    weapon: (c, u, lw, f, sw) => { c.beginPath(); c.arc(0.5 * u, 0.36 * u + sw, 0.12 * u, -0.3, Math.PI * 1.2); c.strokeStyle = '#d9dde6'; c.lineWidth = lw * 1.5; c.stroke(); sabre(c, -u, lw, f, -sw); },
  }),
  almirante: (c, u, f) => chibi(c, u, f, {
    coat: '#20254a', arm: '#1a1e3e', bw: 0.76, bh: 0.66, hr: 0.38, skin: '#e9e4f5',
    back: (c, u, lw) => { c.beginPath(); c.moveTo(-0.45 * u, -0.1 * u); c.lineTo(-0.7 * u, 0.62 * u); c.lineTo(0.7 * u, 0.62 * u); c.lineTo(0.45 * u, -0.1 * u); c.closePath(); c.fillStyle = '#5b2a86'; c.fill(); c.strokeStyle = INK; c.lineWidth = lw; c.stroke(); },
    body: (c, u, lw) => { for (const s of [-1, 1]) rr(c, s * 0.42 * u - 0.12 * u, -0.08 * u, 0.24 * u, 0.1 * u, 0.04 * u, '#f2c94c', INK, lw * 0.6); line(c, -0.2 * u, 0.0, 0.2 * u, 0.36 * u, '#b04ad8', lw * 1.3); },
    face: (c, u, lw, hy, hr) => { ell(c, -0.12 * u, hy, 0.09 * u, 0.1 * u, '#14121c'); ell(c, 0.12 * u, hy, 0.09 * u, 0.1 * u, '#14121c'); ell(c, -0.12 * u, hy, 0.035 * u, 0.035 * u, '#d38cff'); ell(c, 0.12 * u, hy, 0.035 * u, 0.035 * u, '#d38cff'); for (let i = -2; i <= 2; i++) line(c, i * 0.05 * u, hy + 0.17 * u, i * 0.05 * u, hy + 0.24 * u, INK, lw * 0.6); },
    hat: (c, u, lw, hy, hr) => { // bicornio
      c.beginPath(); c.moveTo(-hr * 1.9, hy - hr * 0.55); c.quadraticCurveTo(0, hy - hr * 2.3, hr * 1.9, hy - hr * 0.55); c.quadraticCurveTo(0, hy - hr * 0.9, -hr * 1.9, hy - hr * 0.55); c.fillStyle = '#14121c'; c.fill(); c.strokeStyle = INK; c.lineWidth = lw; c.stroke();
      line(c, -hr * 1.6, hy - hr * 0.68, hr * 1.6, hy - hr * 0.68, '#f2c94c', lw); ell(c, 0, hy - hr * 1.15, 0.08 * u, 0.08 * u, '#e9e4f5', INK, lw * 0.6);
    },
    weapon: sabre,
  }),
};

// barcos: vista desde arriba, proa hacia +x
function boat(c, u, f, o) {
  const lw = Math.max(1, u * 0.08), L = o.len * u, B = o.beam * u;
  c.beginPath(); c.moveTo(L, 0); c.quadraticCurveTo(L * 0.5, -B, -L * 0.7, -B * 0.85); c.lineTo(-L * 0.8, B * 0.85); c.quadraticCurveTo(L * 0.5, B, L, 0); c.closePath();
  c.fillStyle = o.hull; c.fill(); c.strokeStyle = INK; c.lineWidth = lw; c.stroke();
  c.beginPath(); c.moveTo(L * 0.82, 0); c.quadraticCurveTo(L * 0.45, -B * 0.75, -L * 0.62, -B * 0.66); c.lineTo(-L * 0.68, B * 0.66); c.quadraticCurveTo(L * 0.45, B * 0.75, L * 0.82, 0); c.closePath();
  c.fillStyle = o.deck; c.fill();
  for (let i = -2; i <= 2; i++) line(c, -L * 0.6, i * B * 0.25, L * 0.55, i * B * 0.22, 'rgba(0,0,0,.12)', lw * 0.6);
  if (o.extra) o.extra(c, u, lw, L, B, f);
}
Object.assign(ENEMY_ART, {
  bote: (c, u, f) => boat(c, u, f, { len: 1.0, beam: 0.55, hull: '#8a5a2b', deck: '#b98a55', extra: (c, u, lw, L, B, f) => {
    const a = Math.sin(f / 4 * TAU) * 0.35;
    for (const s of [-1, 1]) for (const x of [-0.25, 0.25]) line(c, x * L, s * B * 0.5, x * L - Math.cos(a) * 0.25 * u, s * (B + 0.3 * u), '#5b3a1e', lw * 1.2);
    for (const x of [-0.35, 0.05, 0.42]) ell(c, x * L, 0, 0.16 * u, 0.16 * u, '#d8443a', INK, lw);
  } }),
  lancha: (c, u, f) => boat(c, u, f, { len: 1.05, beam: 0.6, hull: '#59606e', deck: '#8b919d', extra: (c, u, lw, L, B) => {
    for (const x of [-0.5, 0, 0.45]) ell(c, x * L, -B * 0.62, 0.06 * u, 0.06 * u, '#c9d0db'), ell(c, x * L, B * 0.62, 0.06 * u, 0.06 * u, '#c9d0db');
    rr(c, 0.2 * L, -0.11 * u, 0.75 * L, 0.22 * u, 0.08 * u, '#2b2f38', INK, lw);
    ell(c, -0.3 * L, 0, 0.22 * u, 0.22 * u, '#d8443a', INK, lw); line(c, -0.3 * L, -0.5 * B, -0.3 * L, 0.5 * B, '#5b3a1e', lw * 1.4);
  } }),
  galeona: (c, u, f) => boat(c, u, f, { len: 1.2, beam: 0.52, hull: '#2a2530', deck: '#5a4636', extra: (c, u, lw, L, B, f) => {
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) rr(c, (-0.55 + i * 0.32) * L, s > 0 ? B * 0.7 : -B * 0.7 - 0.08 * u, 0.14 * u, 0.08 * u, 0.02 * u, '#f2c94c');
    const sway = Math.sin(f / 4 * TAU) * 0.05 * u;
    for (const [x, w] of [[-0.5, 0.75], [0.0, 0.95], [0.5, 0.7]]) {
      c.beginPath(); c.moveTo(x * L - 0.06 * u, -w * u + sway); c.quadraticCurveTo(x * L + 0.22 * u, 0, x * L - 0.06 * u, w * u + sway); c.lineTo(x * L - 0.14 * u, w * u); c.quadraticCurveTo(x * L + 0.08 * u, 0, x * L - 0.14 * u, -w * u); c.closePath();
      c.fillStyle = '#e9e2d0'; c.fill(); c.strokeStyle = INK; c.lineWidth = lw; c.stroke();
      ell(c, x * L - 0.05 * u, 0, 0.07 * u, 0.07 * u, '#3b2412');
    }
    // calavera en la vela mayor
    ell(c, 0.03 * u, 0, 0.13 * u, 0.15 * u, '#211a2e'); ell(c, 0.0, -0.05 * u, 0.03 * u, 0.04 * u, '#e9e2d0'); ell(c, 0.0, 0.05 * u, 0.03 * u, 0.04 * u, '#e9e2d0');
    poly(c, [L, 0, L + 0.35 * u, -0.05 * u, L + 0.35 * u, 0.05 * u], '#5a4636', INK, lw * 0.7);
  } }),
  loro: (c, u, f) => {
    const lw = Math.max(1, u * 0.09), flap = Math.sin(f / 4 * TAU);
    // ala de atrás
    c.beginPath(); c.moveTo(-0.05 * u, -0.05 * u); c.quadraticCurveTo(-0.3 * u, -0.9 * u * flap - 0.1 * u, -0.6 * u, -0.6 * u * flap); c.quadraticCurveTo(-0.3 * u, 0.0, -0.05 * u, 0.1 * u); c.fillStyle = '#1f8f4e'; c.fill(); c.strokeStyle = INK; c.lineWidth = lw; c.stroke();
    // cola
    poly(c, [-0.35 * u, 0.1 * u, -0.95 * u, 0.32 * u, -0.9 * u, 0.12 * u, -0.95 * u, -0.05 * u], '#2f6fd8', INK, lw);
    ell(c, 0, 0.05 * u, 0.48 * u, 0.3 * u, '#36b865', INK, lw);
    ell(c, 0.38 * u, -0.16 * u, 0.25 * u, 0.24 * u, '#e8413a', INK, lw);
    poly(c, [0.58 * u, -0.22 * u, 0.82 * u, -0.08 * u, 0.6 * u, 0.0], '#f2e6c8', INK, lw * 0.8);
    ell(c, 0.42 * u, -0.22 * u, 0.06 * u, 0.06 * u, '#fff'); ell(c, 0.44 * u, -0.22 * u, 0.03 * u, 0.03 * u, INK);
    poly(c, [0.18 * u, -0.38 * u, 0.4 * u, -0.62 * u, 0.6 * u, -0.38 * u, 0.4 * u, -0.43 * u], '#1c1a22', INK, lw * 0.7);
    // ala de adelante
    c.beginPath(); c.moveTo(0.05 * u, 0.0); c.quadraticCurveTo(-0.1 * u, -1.0 * u * flap, -0.42 * u, -0.75 * u * flap); c.quadraticCurveTo(-0.2 * u, 0.1 * u, 0.05 * u, 0.15 * u); c.fillStyle = '#42c972'; c.fill(); c.strokeStyle = INK; c.lineWidth = lw; c.stroke();
  },
});

// ---------- cache de sprites de enemigos ----------
const cache = new Map();
let cacheScale = 0;
export function enemySprite(type, u, frame, variant, dpr) {
  const key = type + '|' + frame + '|' + variant;
  if (cacheScale !== u * dpr) { cache.clear(); cacheScale = u * dpr; }
  let cv = cache.get(key);
  if (cv) return cv;
  const S = Math.ceil(u * 4.2 * dpr);
  cv = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(S, S) : Object.assign(document.createElement('canvas'), { width: S, height: S });
  const c = cv.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, S / 2, S / 2);
  c.lineJoin = 'round';
  ENEMY_ART[type](c, u, frame);
  if (variant) {
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalCompositeOperation = 'source-atop';
    c.fillStyle = variant === 'flash' ? 'rgba(255,255,255,.85)' : 'rgba(150,215,255,.6)';
    c.fillRect(0, 0, S, S);
    c.globalCompositeOperation = 'source-over';
  }
  cv._half = u * 2.1;
  cache.set(key, cv);
  return cv;
}
export function drawEnemyArt(c, type, u, frame) { ENEMY_ART[type](c, u, frame); }

// ---------- torres ----------
// Dibuja una torre centrada en (0,0) con TS = tamaño de casilla. t: {type,lvl,br,angle,recoil,fireT}, time en segundos.
export function drawTower(c, T, ts, time, opts = {}) {
  const u = ts / 2, lw = Math.max(1, ts * 0.045);
  const lvl = T.lvl || 0, br = T.br;
  c.lineJoin = 'round';
  // sombra
  ell(c, 0, u * 0.62, u * 0.86, u * 0.32, 'rgba(20,30,20,.28)');
  // base según nivel
  if (lvl === 0) {
    ell(c, 0, u * 0.32, u * 0.78, u * 0.5, '#7a5230', INK, lw);
    ell(c, 0, u * 0.18, u * 0.78, u * 0.5, '#b07a42', INK, lw);
    for (let i = -2; i <= 2; i++) line(c, i * u * 0.28, u * 0.18 - u * 0.44 * Math.cos(i * 0.36), i * u * 0.28, u * 0.18 + u * 0.44 * Math.cos(i * 0.36), 'rgba(80,45,20,.45)', lw * 0.7);
  } else {
    const stone = lvl === 2 ? '#cfc6b4' : '#b9b2a4', dark = lvl === 2 ? '#8f8573' : '#857e71';
    rr(c, -u * 0.8, u * 0.0, u * 1.6, u * 0.55, u * 0.25, dark, INK, lw);
    ell(c, 0, u * 0.02, u * 0.8, u * 0.48, stone, INK, lw);
    c.save(); c.beginPath(); c.ellipse(0, u * 0.02, u * 0.8, u * 0.48, 0, 0, TAU); c.clip();
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.3; line(c, Math.cos(a) * u * 0.45, u * 0.02 + Math.sin(a) * u * 0.27, Math.cos(a) * u * 0.85, u * 0.02 + Math.sin(a) * u * 0.5, 'rgba(60,50,40,.3)', lw * 0.6); }
    c.restore();
    ell(c, 0, u * 0.02, u * 0.45, u * 0.27, null, 'rgba(60,50,40,.3)', lw * 0.6);
    if (lvl === 2) { ell(c, 0, u * 0.02, u * 0.8, u * 0.48, null, '#f2c94c', lw * 1.2); }
  }
  const col = TOWERS[T.type].color;
  const disabled = opts.disabled;
  c.save();
  if (disabled) c.globalAlpha = 0.75;
  TOWER_TOP[T.type](c, u, lw, T, time, lvl, br);
  c.restore();
  // estrellitas de nivel
  if (!opts.noPips) for (let i = 0; i <= lvl; i++) {
    const x = (i - lvl / 2) * u * 0.32, y = u * 0.62;
    star(c, x, y, u * 0.13, lvl === 2 ? '#ffd54a' : '#fff1c4', INK, lw * 0.6);
  }
}
function star(c, x, y, r, fill, stroke, lw) {
  c.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr2 = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); }
  c.closePath(); c.fillStyle = fill; c.fill(); if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw; c.stroke(); }
}
export { star };

function soldierTop(c, u, lw, a, k, hat, gun) {
  // soldado visto de arriba apuntando con el mosquete
  c.save(); c.rotate(a);
  line(c, u * 0.05, u * 0.1 * k, u * 0.62 * k + (gun || 0), u * 0.06 * k, '#5b3a1e', lw * 1.8);
  line(c, u * 0.45 * k, u * 0.06 * k, u * 0.62 * k + (gun || 0), u * 0.06 * k, '#3a3f4a', lw * 1.3);
  ell(c, 0, 0, u * 0.24 * k, u * 0.3 * k, '#2f5aa8', INK, lw);
  ell(c, u * 0.18 * k, u * 0.12 * k, u * 0.08 * k, u * 0.08 * k, '#f0bf8e', INK, lw * 0.7);
  c.restore();
  ell(c, 0, -u * 0.02, u * 0.16 * k, u * 0.16 * k, '#f0bf8e', INK, lw * 0.8);
  if (hat === 'plume') { ell(c, 0, -u * 0.06, u * 0.2 * k, u * 0.12 * k, '#1d2340', INK, lw * 0.8); line(c, 0, -u * 0.12, u * 0.12, -u * 0.32, '#e8413a', lw * 1.6); }
  else poly(c, [-u * 0.22 * k, -u * 0.04, 0, -u * 0.22 * k, u * 0.22 * k, -u * 0.04, 0, u * 0.04], '#1d2340', INK, lw * 0.8);
}

const TOWER_TOP = {
  mosq(c, u, lw, T, time, lvl, br) {
    // parapeto
    const y0 = -u * 0.25;
    rr(c, -u * 0.58, y0 - u * 0.1, u * 1.16, u * 0.55, u * 0.18, lvl ? '#a39b8c' : '#8a5a2b', INK, lw);
    for (let i = -2; i <= 2; i++) rr(c, i * u * 0.24 - u * 0.08, y0 - u * 0.22, u * 0.16, u * 0.16, u * 0.03, lvl ? '#bdb5a5' : '#a06a36', INK, lw * 0.7);
    rr(c, -u * 0.18, y0 - u * 0.95, u * 0.06, u * 0.75, 0, '#5b3a1e');
    // banderita celeste y blanca
    const wave = Math.sin(time * 6) * u * 0.05;
    c.beginPath(); c.moveTo(-u * 0.12, y0 - u * 0.95); c.quadraticCurveTo(u * 0.1, y0 - u * 0.95 + wave, u * 0.28, y0 - u * 0.88); c.lineTo(u * 0.28, y0 - u * 0.62); c.quadraticCurveTo(u * 0.1, y0 - u * 0.68 + wave, -u * 0.12, y0 - u * 0.66); c.closePath();
    c.fillStyle = '#fff'; c.fill(); c.strokeStyle = INK; c.lineWidth = lw * 0.6; c.stroke();
    line(c, -u * 0.1, y0 - u * 0.86, u * 0.26, y0 - u * 0.8 + wave * 0.5, '#5aa9e6', lw * 1.1, 'butt'); line(c, -u * 0.1, y0 - u * 0.74, u * 0.26, y0 - u * 0.7 + wave * 0.5, '#5aa9e6', lw * 1.1, 'butt');
    c.save(); c.translate(0, y0 + u * 0.05);
    const kick = -T.recoil * u * 0.1;
    if (lvl === 2 && br === 'b') { c.save(); c.translate(-u * 0.25, 0); soldierTop(c, u, lw, T.angle, 0.85, null, kick); c.restore(); c.save(); c.translate(u * 0.25, 0); soldierTop(c, u, lw, T.angle + 0.15, 0.85, null, kick); c.restore(); }
    else soldierTop(c, u, lw, T.angle, lvl === 2 ? 1.3 : 1.2, lvl === 2 ? 'plume' : null, kick + (lvl === 2 ? u * 0.2 : 0));
    c.restore();
  },
  canon(c, u, lw, T, time, lvl, br) {
    const y0 = -u * 0.12;
    ell(c, 0, y0, u * 0.48, u * 0.4, '#6b4523', INK, lw);
    ell(c, 0, y0 - u * 0.04, u * 0.36, u * 0.3, '#8a5a2b', INK, lw * 0.8);
    c.save(); c.translate(0, y0 - u * 0.08); c.rotate(T.angle);
    const L = u * (lvl === 2 && br === 'a' ? 1.0 : 0.8), W = u * (lvl === 2 && br === 'a' ? 0.34 : 0.27), back = -T.recoil * u * 0.25;
    if (lvl === 2 && br === 'b') {
      poly(c, [back - u * 0.2, -W * 0.5, back + L * 0.75, -W * 0.45, back + L, -W * 1.05, back + L, W * 1.05, back + L * 0.75, W * 0.45, back - u * 0.2, W * 0.5], '#3b3f4a', INK, lw);
    } else {
      rr(c, back - u * 0.22, -W / 2, L + u * 0.22, W, W * 0.45, '#3b3f4a', INK, lw);
      rr(c, back + L - u * 0.12, -W * 0.62, u * 0.14, W * 1.24, u * 0.05, '#2b2f38', INK, lw * 0.8);
      line(c, back - u * 0.1, -W * 0.22, back + L - u * 0.15, -W * 0.22, 'rgba(255,255,255,.28)', lw);
    }
    if (lvl >= 1) for (const x of [0.1, 0.4]) line(c, back + x * L, -W * 0.52, back + x * L, W * 0.52, lvl === 2 ? '#f2c94c' : '#6b7280', lw * 1.2, 'butt');
    ell(c, back - u * 0.25, 0, u * 0.09, u * 0.09, '#3b3f4a', INK, lw * 0.7);
    c.restore();
  },
  mortero(c, u, lw, T, time, lvl, br) {
    const y0 = -u * 0.12, s = 1 + T.recoil * 0.08 + (lvl === 2 && br === 'a' ? 0.15 : 0);
    rr(c, -u * 0.5, y0 - u * 0.2, u * 1.0, u * 0.5, u * 0.1, '#7a5230', INK, lw);
    c.save(); c.translate(0, y0 - u * 0.1); c.scale(s, s);
    ell(c, 0, 0, u * 0.44, u * 0.4, '#3b3f4a', INK, lw);
    ell(c, 0, -u * 0.05, u * 0.32, u * 0.27, '#1a1c22', INK, lw * 0.8);
    if (lvl >= 1) ell(c, 0, 0, u * 0.44, u * 0.4, null, lvl === 2 ? '#f2c94c' : '#6b7280', lw * 1.2);
    if (lvl === 2 && br === 'b') { const g = 0.5 + 0.5 * Math.sin(time * 5); ell(c, 0, -u * 0.05, u * 0.24, u * 0.2, `rgba(255,${120 + g * 60 | 0},40,.95)`); }
    c.globalAlpha = 0.25; ell(c, -u * 0.18, -u * 0.18, u * 0.1, u * 0.07, '#fff'); c.globalAlpha = 1;
    c.restore();
  },
  pampero(c, u, lw, T, time, lvl, br) {
    const y0 = -u * 0.2;
    rr(c, -u * 0.32, y0 - u * 0.55, u * 0.64, u * 0.85, u * 0.12, lvl === 2 && br === 'b' ? '#5c6a85' : '#d9e8f2', INK, lw);
    poly(c, [-u * 0.42, y0 - u * 0.5, 0, y0 - u * 0.9, u * 0.42, y0 - u * 0.5], lvl === 2 && br === 'a' ? '#bfeaff' : '#3d7fb8', INK, lw);
    const spin = time * (3 + lvl) + T.id;
    c.save(); c.translate(0, y0 - u * 0.25);
    for (let i = 0; i < 4; i++) {
      c.save(); c.rotate(spin + i * Math.PI / 2);
      poly(c, [0, -u * 0.04, u * 0.72, -u * 0.13, u * 0.72, u * 0.07, 0, u * 0.04], '#f4f1ea', INK, lw * 0.8);
      line(c, u * 0.2, -u * 0.02, u * 0.7, -u * 0.05, 'rgba(60,110,160,.5)', lw * 0.7);
      c.restore();
    }
    ell(c, 0, 0, u * 0.1, u * 0.1, '#5b3a1e', INK, lw * 0.7);
    c.restore();
    if (lvl === 2 && br === 'a') for (let i = 0; i < 3; i++) { const a = time * 1.5 + i * 2.1; ell(c, Math.cos(a) * u * 0.6, y0 + Math.sin(a) * u * 0.3, u * 0.06, u * 0.06, '#e6f8ff'); }
  },
  faro(c, u, lw, T, time, lvl, br) {
    const H = u * (lvl === 2 && br === 'b' ? 1.75 : 1.45), y0 = u * 0.1;
    c.beginPath(); c.moveTo(-u * 0.38, y0); c.lineTo(-u * 0.22, y0 - H); c.lineTo(u * 0.22, y0 - H); c.lineTo(u * 0.38, y0); c.closePath();
    c.fillStyle = '#f7f4ec'; c.fill();
    c.save(); c.clip();
    for (let i = 0; i < 4; i++) rr(c, -u, y0 - H * (0.12 + i * 0.25), u * 2, H * 0.11, 0, lvl === 2 && br === 'a' ? '#c0392b' : '#d8443a');
    c.globalAlpha = 0.18; c.fillStyle = '#000'; c.fillRect(u * 0.08, y0 - H, u * 0.4, H); c.globalAlpha = 1;
    c.restore();
    c.beginPath(); c.moveTo(-u * 0.38, y0); c.lineTo(-u * 0.22, y0 - H); c.lineTo(u * 0.22, y0 - H); c.lineTo(u * 0.38, y0); c.closePath(); c.strokeStyle = INK; c.lineWidth = lw; c.stroke();
    rr(c, -u * 0.32, y0 - H - u * 0.05, u * 0.64, u * 0.1, u * 0.03, '#3b3f4a', INK, lw * 0.8);
    const g = 0.75 + 0.25 * Math.sin(time * 4);
    rr(c, -u * 0.2, y0 - H - u * 0.36, u * 0.4, u * 0.32, u * 0.06, `rgba(255,${lvl === 2 && br === 'a' ? 140 : 230},${lvl === 2 && br === 'a' ? 90 : 140},${g})`, INK, lw * 0.8);
    poly(c, [-u * 0.26, y0 - H - u * 0.36, 0, y0 - H - u * 0.6, u * 0.26, y0 - H - u * 0.36], '#3b3f4a', INK, lw * 0.8);
  },
  ballesta(c, u, lw, T, time, lvl, br) {
    const y0 = -u * 0.15;
    ell(c, 0, y0, u * 0.42, u * 0.34, '#6b4523', INK, lw);
    c.save(); c.translate(0, y0 - u * 0.06); c.rotate(T.angle);
    const big = lvl === 2 && br === 'a', k = big ? 1.2 : 1, pull = (1 - T.recoil) * u * 0.12;
    rr(c, -u * 0.45 * k, -u * 0.07, u * 0.95 * k, u * 0.14, u * 0.05, '#8a5a2b', INK, lw);
    c.beginPath(); c.moveTo(u * 0.32 * k, -u * 0.62 * k); c.quadraticCurveTo(u * 0.62 * k, 0, u * 0.32 * k, u * 0.62 * k); c.strokeStyle = INK; c.lineWidth = lw * 2.6; c.stroke(); c.strokeStyle = big ? '#9aa3b1' : '#5b3a1e'; c.lineWidth = lw * 1.5; c.stroke();
    c.beginPath(); c.moveTo(u * 0.32 * k, -u * 0.6 * k); c.lineTo(u * 0.1 * k - pull, 0); c.lineTo(u * 0.32 * k, u * 0.6 * k); c.strokeStyle = '#f4f1ea'; c.lineWidth = lw * 0.6; c.stroke();
    if (T.recoil < 0.5) { line(c, u * 0.1 * k - pull, 0, u * 0.62 * k, 0, big ? '#c9d0db' : '#d9b27a', lw * 1.2); poly(c, [u * 0.62 * k, -u * 0.06, u * 0.78 * k, 0, u * 0.62 * k, u * 0.06], '#c9d0db', INK, lw * 0.5); }
    if (lvl === 2 && br === 'b') rr(c, -u * 0.18, -u * 0.2, u * 0.3, u * 0.4, u * 0.05, '#5b3a1e', INK, lw * 0.8);
    c.restore();
  },
};

// ---------- íconos para la interfaz (dataURL) ----------
export function iconURL(kind, id, px = 96, opts = {}) {
  const cv = document.createElement('canvas'); cv.width = cv.height = px;
  const c = cv.getContext('2d');
  c.lineJoin = 'round';
  if (kind === 'tower') {
    c.translate(px / 2, px * 0.58);
    drawTower(c, { type: id, lvl: opts.lvl || 0, br: opts.br || null, angle: -Math.PI / 4, recoil: 0, id: 1 }, px * 0.62, 0.3, { noPips: true });
  } else {
    const def = ENEMIES[id];
    const u = px * (def.kind === 'sea' ? 0.3 : def.boss ? 0.25 : id === 'carreton' ? 0.27 : 0.33);
    c.translate(px / 2, px * (def.kind === 'sea' ? 0.5 : 0.56));
    if (def.kind === 'sea') c.rotate(-Math.PI / 2);
    ENEMY_ART[id](c, u, 1);
  }
  return cv.toDataURL();
}

// Blandengue (refuerzos): uniforme azul con vivos rojos
ENEMY_ART.blandengue = (c, u, f) => chibi(c, u, f, {
  coat: '#2f5aa8', arm: '#284d91', legs: '#e9e4d8',
  body: (c, u, lw) => { line(c, -0.25 * u, -0.06 * u, 0.25 * u, 0.36 * u, '#f4f1ea', lw * 1.2); line(c, 0.25 * u, -0.06 * u, -0.25 * u, 0.36 * u, '#f4f1ea', lw * 1.2); },
  hat: (c, u, lw, hy, hr) => { rr(c, -hr * 0.85, hy - hr * 1.6, hr * 1.7, hr * 1.0, hr * 0.2, '#1d2340', INK, lw); line(c, 0, hy - hr * 1.6, hr * 0.3, hy - hr * 2.3, '#e8413a', lw * 2); rr(c, -hr * 1.0, hy - hr * 0.75, hr * 2.0, hr * 0.22, hr * 0.1, '#1d2340', INK, lw * 0.8); },
  weapon: (c, u, lw, f, sw) => { line(c, 0.42 * u, 0.4 * u + sw, 0.42 * u, -0.9 * u + sw, '#5b3a1e', lw * 1.4); poly(c, [0.36 * u, -0.85 * u + sw, 0.42 * u, -1.1 * u + sw, 0.48 * u, -0.85 * u + sw], '#d9dde6', INK, lw * 0.6); line(c, 0.42 * u, -0.8 * u + sw, 0.62 * u, -0.72 * u + sw, '#5aa9e6', lw * 1.2); },
});
