/* Defensa del Cerro — render en canvas: terreno pre-dibujado, entidades, partículas y efectos. */
import { COLS, ROWS, TOWERS, ENEMIES, rng } from './data.js';
import { enemySprite, drawTower, INK, star } from './sprites.js';

const TAU = Math.PI * 2;
// navegadores viejos sin roundRect: aproximamos con rectángulo redondeado simple
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    r = Array.isArray(r) ? Math.max(...r) : r || 0; r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    this.moveTo(x + r, y); this.arcTo(x + w, y, x + w, y + h, r); this.arcTo(x + w, y + h, x, y + h, r); this.arcTo(x, y + h, x, y, r); this.arcTo(x, y, x + w, y, r); this.closePath();
  };
}
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const mkCanvas = (w, h) => Object.assign(document.createElement('canvas'), { width: w, height: h });

// ---------- partículas (pool fijo, sin basura) ----------
const PMAX = 900;
class Particles {
  constructor() { this.p = []; for (let i = 0; i < PMAX; i++) this.p.push({ on: false }); this.i = 0; this.n = 0; }
  add(kind, x, y, o) {
    const p = this.p[this.i]; this.i = (this.i + 1) % PMAX;
    p.on = true; p.kind = kind; p.x = x; p.y = y; p.vx = 0; p.vy = 0; p.g = 0; p.life = 0; p.max = 0.6; p.size = 4; p.color = '#fff'; p.rot = 0; p.vr = 0; p.text = ''; p.x2 = 0; p.y2 = 0; p.drag = 0;
    if (o) Object.assign(p, o);
    return p;
  }
  clear() { for (const p of this.p) p.on = false; }
}

export class Renderer {
  constructor(canvas) {
    this.cv = canvas; this.c = canvas.getContext('2d');
    this.parts = new Particles();
    this.shake = 0; this.redFlash = 0; this.whiteFlash = 0; this.time = 0;
    this.W = 1; this.H = 1; this.dpr = 1; this.TS = 40; this.ox = 0; this.oy = 0;
    this.sorted = [];
    this.lowFx = false;
  }
  layout(W, H, dpr, top, bottom) {
    this.W = W; this.H = H; this.dpr = dpr;
    this.cv.width = Math.round(W * dpr); this.cv.height = Math.round(H * dpr);
    const availH = H - top - bottom, availW = W - 8;
    this.TS = Math.floor(Math.min(availW / COLS, availH / ROWS) * 4) / 4;
    this.ox = Math.round((W - this.TS * COLS) / 2);
    this.oy = Math.round(top + (availH - this.TS * ROWS) / 2);
    this.parts.clear();
    if (this.g) this.buildBg();
  }
  X(x) { return this.ox + x * this.TS; }
  Y(y) { return this.oy + y * this.TS; }
  toWorld(px, py) { return [(px - this.ox) / this.TS, (py - this.oy) / this.TS]; }
  setGame(g) { this.g = g; this.parts.clear(); this.nextGroupsWave = -1; this.buildBg(); }

  // ---------- terreno ----------
  buildBg() {
    const g = this.g, L = g.L, TS = this.TS, W = this.W, H = this.H, dpr = this.dpr;
    const bg = this.bg = mkCanvas(Math.round(W * dpr), Math.round(H * dpr));
    const c = bg.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.lineJoin = 'round'; c.lineCap = 'round';
    const R = rng(L.id * 1337 + 5);
    const X = (x) => this.ox + x * TS, Y = (y) => this.oy + y * TS;
    // mar
    const sea = c.createLinearGradient(0, 0, 0, H); sea.addColorStop(0, '#2a86c2'); sea.addColorStop(1, '#17598f');
    c.fillStyle = sea; c.fillRect(0, 0, W, H);
    const c0 = Math.floor(-this.ox / TS) - 1, c1 = COLS + Math.ceil((W - this.ox - COLS * TS) / TS) + 1;
    const r0 = Math.floor(-this.oy / TS) - 1, r1 = ROWS + Math.ceil((H - this.oy - ROWS * TS) / TS) + 1;
    const ch = (cc, r) => { const t = L.grid[clamp(r, 0, ROWS - 1)][clamp(cc, 0, COLS - 1)]; return t === 'F' ? '.' : t; };
    const land = (t) => t !== '~';
    this.water = [];
    const tiles = [];
    for (let r = r0; r <= r1; r++) for (let cc = c0; cc <= c1; cc++) tiles.push([cc, r, ch(cc, r)]);
    const blob = (cc, r, grow, rad, col, test) => {
      // esquinas redondeadas solo donde no hay vecino del mismo tipo (sin rendijas entre casillas)
      let radii = TS * rad;
      if (test) {
        const n = (dc, dr) => test(ch(cc + dc, r + dr));
        const k = (a, b) => (!a && !b ? TS * rad : 0);
        radii = [k(n(-1, 0), n(0, -1)), k(n(1, 0), n(0, -1)), k(n(1, 0), n(0, 1)), k(n(-1, 0), n(0, 1))];
      }
      c.beginPath(); c.roundRect(X(cc - grow), Y(r - grow), TS * (1 + 2 * grow), TS * (1 + 2 * grow), radii); c.fillStyle = col; c.fill();
    };
    const grass = (t) => land(t) && t !== 's';
    // agua baja alrededor de la costa
    for (const [cc, r, t] of tiles) if (land(t)) blob(cc, r, 0.75, 0.9, 'rgba(90,190,230,.22)');
    for (const [cc, r, t] of tiles) if (land(t)) blob(cc, r, 0.38, 0.6, 'rgba(120,215,240,.3)');
    for (const [cc, r, t] of tiles) if (land(t)) blob(cc, r, 0.2, 0.45, 'rgba(235,250,255,.55)', land);
    for (const [cc, r, t] of tiles) if (land(t)) blob(cc, r, 0.13, 0.42, '#ecd59e', land);
    for (const [cc, r, t] of tiles) if (grass(t)) blob(cc, r, 0.01, 0.3, '#7dbd4b', grass);
    for (const [cc, r, t] of tiles) if (!land(t)) this.water.push([cc, r, R() * 6.28, R()]);
    // textura del pasto
    for (const [cc, r, t] of tiles) {
      if (!land(t)) continue;
      if (t === 's') { for (let k = 0; k < 3; k++) { c.fillStyle = 'rgba(190,160,100,.35)'; c.beginPath(); c.arc(X(cc + R()), Y(r + R()), TS * 0.03, 0, TAU); c.fill(); } continue; }
      for (let k = 0; k < 2; k++) {
        c.fillStyle = R() < 0.5 ? 'rgba(60,120,40,.16)' : 'rgba(170,220,110,.18)';
        c.beginPath(); c.ellipse(X(cc + R()), Y(r + R()), TS * (0.25 + R() * 0.3), TS * (0.15 + R() * 0.2), R() * 3, 0, TAU); c.fill();
      }
      if (R() < 0.7) { const x = X(cc + 0.15 + R() * 0.7), y = Y(r + 0.2 + R() * 0.7); c.strokeStyle = 'rgba(40,100,30,.45)'; c.lineWidth = Math.max(1, TS * 0.03);
        for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(x + k * TS * 0.05, y); c.lineTo(x + k * TS * 0.09, y - TS * 0.12); c.stroke(); } }
      if (R() < 0.12) { const fx = X(cc + R()), fy = Y(r + R()); c.fillStyle = ['#fff6d5', '#ffd54a', '#f28bb0'][(R() * 3) | 0]; c.beginPath(); c.arc(fx, fy, TS * 0.04, 0, TAU); c.fill(); }
    }
    // rutas de agua y aire (guías punteadas)
    for (const p of g.paths) {
      if (p.kind === 'land') continue;
      c.save(); c.setLineDash([TS * 0.08, TS * 0.22]); c.lineWidth = Math.max(1.5, TS * 0.05);
      c.strokeStyle = p.kind === 'sea' ? 'rgba(220,245,255,.35)' : 'rgba(255,255,255,.18)';
      c.beginPath(); p.pts.forEach(([x, y], i) => (i ? c.lineTo(X(x), Y(y)) : c.moveTo(X(x), Y(y)))); c.stroke(); c.restore();
    }
    // caminos de tierra
    const strokePath = (p, w, col) => {
      c.beginPath(); const s = p.pts[0], s2 = p.pts[1];
      const ext = [s[0] + (s[0] - s2[0]) * 30, s[1] + (s[1] - s2[1]) * 30];
      c.moveTo(X(ext[0]), Y(ext[1]));
      for (const [x, y] of p.pts) c.lineTo(X(x), Y(y));
      c.lineWidth = TS * w; c.strokeStyle = col; c.stroke();
    };
    const lands = g.paths.filter((p) => p.kind === 'land');
    for (const p of lands) strokePath(p, 0.98, 'rgba(60,90,30,.35)');
    for (const p of lands) strokePath(p, 0.86, '#a77f4c');
    for (const p of lands) strokePath(p, 0.74, '#d9b67c');
    for (const p of lands) strokePath(p, 0.34, 'rgba(236,206,150,.55)');
    for (const p of lands) for (const [x, y] of p.samples) {
      if (R() < 0.55) continue;
      c.fillStyle = R() < 0.5 ? 'rgba(140,100,55,.45)' : 'rgba(255,240,210,.5)';
      c.beginPath(); c.ellipse(X(x + (R() - 0.5) * 0.6), Y(y + (R() - 0.5) * 0.6), TS * 0.045, TS * 0.03, R() * 3, 0, TAU); c.fill();
    }
    // decoración
    const deco = [];
    for (let r = 0; r < ROWS; r++) for (let cc = 0; cc < COLS; cc++) { const t = g.grid[r][cc]; if (!t.path && 'trh'.includes(t.ch)) deco.push([cc, r, t.ch]); }
    // árboles extra en los márgenes fuera del mapa
    for (const [cc, r, t] of tiles) if ((cc < 0 || cc >= COLS || r < 0 || r >= ROWS) && t === '.' && R() < 0.35) deco.push([cc, r, 't']);
    deco.sort((a, b) => a[1] - b[1]);
    for (const [cc, r, t] of deco) this.drawDeco(c, cc, r, t, R);
    this.drawFort(c, R);
    // viñeta suave
    const vg = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(10,20,40,.35)');
    c.fillStyle = vg; c.fillRect(0, 0, W, H);
  }
  drawDeco(c, cc, r, t, R) {
    const TS = this.TS, x = this.X(cc + 0.5 + (R() - 0.5) * 0.2), y = this.Y(r + 0.55 + (R() - 0.5) * 0.15), lw = Math.max(1, TS * 0.04);
    if (t === 't') {
      const s = TS * (0.36 + R() * 0.1);
      c.fillStyle = 'rgba(20,50,20,.3)'; c.beginPath(); c.ellipse(x + s * 0.2, y + s * 0.55, s * 0.95, s * 0.4, 0, 0, TAU); c.fill();
      c.fillStyle = '#6b4523'; c.fillRect(x - s * 0.1, y, s * 0.2, s * 0.5);
      const greens = R() < 0.3 ? ['#2f7a3a', '#3f9a47', '#5cb85c'] : ['#3a8a3c', '#4fa84a', '#79c95c'];
      const blobs = [[-0.35, -0.1, 0.55], [0.35, -0.12, 0.5], [0, -0.45, 0.6]];
      for (const [bx, by, br] of blobs) { c.beginPath(); c.arc(x + bx * s, y + by * s, br * s + lw, 0, TAU); c.fillStyle = INK; c.fill(); }
      for (const [bx, by, br] of blobs) { c.beginPath(); c.arc(x + bx * s, y + by * s, br * s, 0, TAU); c.fillStyle = greens[1]; c.fill(); }
      for (const [bx, by, br] of blobs) { c.beginPath(); c.arc(x + bx * s - br * s * 0.25, y + by * s - br * s * 0.25, br * s * 0.55, 0, TAU); c.fillStyle = greens[2]; c.fill(); }
    } else if (t === 'r') {
      const s = TS * 0.32;
      c.fillStyle = 'rgba(20,40,20,.25)'; c.beginPath(); c.ellipse(x, y + s * 0.5, s * 1.1, s * 0.4, 0, 0, TAU); c.fill();
      c.beginPath(); c.moveTo(x - s, y + s * 0.4); c.lineTo(x - s * 0.7, y - s * 0.4); c.lineTo(x - s * 0.1, y - s * 0.7); c.lineTo(x + s * 0.7, y - s * 0.35); c.lineTo(x + s, y + s * 0.4); c.closePath();
      c.fillStyle = '#9b958a'; c.fill(); c.strokeStyle = INK; c.lineWidth = lw; c.stroke();
      c.beginPath(); c.moveTo(x - s * 0.6, y - s * 0.3); c.lineTo(x - s * 0.1, y - s * 0.55); c.lineTo(x + s * 0.2, y - s * 0.1); c.closePath(); c.fillStyle = '#c4beb2'; c.fill();
    } else if (t === 'h') {
      const s = TS * 0.4, roof = ['#d8443a', '#e07b39', '#5aa9e6', '#f2c94c'][(R() * 4) | 0], wall = ['#f4efe4', '#f6e3c9', '#e7f0f4'][(R() * 3) | 0];
      c.fillStyle = 'rgba(20,40,20,.28)'; c.fillRect(x - s * 0.9, y + s * 0.2, s * 2.0, s * 0.55);
      c.beginPath(); c.rect(x - s * 0.85, y - s * 0.35, s * 1.7, s * 0.85); c.fillStyle = wall; c.fill(); c.strokeStyle = INK; c.lineWidth = lw; c.stroke();
      c.fillStyle = '#5b8fb8'; c.fillRect(x - s * 0.55, y - s * 0.1, s * 0.3, s * 0.28); c.fillRect(x + s * 0.25, y - s * 0.1, s * 0.3, s * 0.28);
      c.fillStyle = '#7a5230'; c.fillRect(x - s * 0.12, y + s * 0.05, s * 0.24, s * 0.45);
      c.beginPath(); c.moveTo(x - s * 1.05, y - s * 0.3); c.lineTo(x, y - s * 1.0); c.lineTo(x + s * 1.05, y - s * 0.3); c.closePath(); c.fillStyle = roof; c.fill(); c.stroke();
    }
  }
  drawFort(c, R) {
    const TS = this.TS, X = (x) => this.ox + x * TS, Y = (y) => this.oy + y * TS, lw = Math.max(1.2, TS * 0.05);
    const x0 = 2, x1 = 7, y0 = -0.35, y1 = 2.05;
    const out = [[x0 + 0.35, y0], [x1 - 0.35, y0], [x1 + 0.15, y0 + 0.6], [x1 - 0.2, y1 - 0.75], [x1 + 0.05, y1 - 0.1], [x1 - 0.85, y1], [(x0 + x1) / 2 + 0.6, y1 - 0.1], [(x0 + x1) / 2, y1 + 0.12], [(x0 + x1) / 2 - 0.6, y1 - 0.1], [x0 + 0.85, y1], [x0 - 0.05, y1 - 0.1], [x0 + 0.2, y1 - 0.75], [x0 - 0.15, y0 + 0.6]];
    const pathPoly = (pts, dy, grow) => { c.beginPath(); const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2; pts.forEach(([x, y], i) => { const gx = x + (x - cx) * grow, gy = y + (y - cy) * grow + dy; i ? c.lineTo(X(gx), Y(gy)) : c.moveTo(X(gx), Y(gy)); }); c.closePath(); };
    c.fillStyle = 'rgba(20,40,20,.35)'; pathPoly(out, 0.25, 0.04); c.fill();
    pathPoly(out, 0.12, 0); c.fillStyle = '#8f8573'; c.fill(); c.strokeStyle = INK; c.lineWidth = lw; c.stroke();
    pathPoly(out, 0, 0); c.fillStyle = '#cfc4ad'; c.fill(); c.stroke();
    // piedras
    c.save(); pathPoly(out, 0, 0); c.clip();
    c.strokeStyle = 'rgba(90,80,60,.25)'; c.lineWidth = Math.max(1, TS * 0.02);
    for (let yy = y0; yy < y1 + 0.2; yy += 0.18) { c.beginPath(); c.moveTo(X(x0 - 0.3), Y(yy)); c.lineTo(X(x1 + 0.3), Y(yy)); c.stroke(); }
    // patio
    pathPoly(out, -0.02, -0.18); c.fillStyle = '#b9ab8e'; c.fill(); c.strokeStyle = 'rgba(60,50,40,.5)'; c.lineWidth = lw * 0.8; c.stroke();
    c.restore();
    // edificios del patio
    const bx = X(x0 + 0.9), by = Y(0.35), bw = TS * 1.3, bh = TS * 0.6;
    c.fillStyle = '#f2ead8'; c.fillRect(bx, by, bw, bh); c.strokeStyle = INK; c.lineWidth = lw * 0.8; c.strokeRect(bx, by, bw, bh);
    c.fillStyle = '#c4553b'; c.beginPath(); c.moveTo(bx - TS * 0.08, by); c.lineTo(bx + bw / 2, by - TS * 0.38); c.lineTo(bx + bw + TS * 0.08, by); c.closePath(); c.fill(); c.stroke();
    for (let i = 0; i < 3; i++) { c.fillStyle = '#6b4523'; c.fillRect(bx + TS * (0.15 + i * 0.4), by + TS * 0.25, TS * 0.18, TS * 0.3); }
    const b2x = X(x1 - 2.2), b2y = Y(0.55);
    c.fillStyle = '#efe4cc'; c.fillRect(b2x, b2y, TS * 1.2, TS * 0.5); c.strokeRect(b2x, b2y, TS * 1.2, TS * 0.5);
    c.fillStyle = '#a8442e'; c.fillRect(b2x - TS * 0.05, b2y - TS * 0.2, TS * 1.3, TS * 0.22); c.strokeRect(b2x - TS * 0.05, b2y - TS * 0.2, TS * 1.3, TS * 0.22);
    // cañones en los baluartes
    for (const [x, y, a] of [[x0 + 0.1, y1 - 0.25, 2.3], [x1 - 0.1, y1 - 0.25, 0.8], [x0 - 0.0, y0 + 0.6, 3.0], [x1 + 0.0, y0 + 0.6, 0.1]]) {
      c.save(); c.translate(X(x), Y(y)); c.rotate(a); c.fillStyle = '#2b2f38'; c.beginPath(); c.roundRect(-TS * 0.05, -TS * 0.07, TS * 0.38, TS * 0.14, TS * 0.05); c.fill(); c.restore();
    }
    // portones donde llegan los caminos
    this.gates = [];
    for (const p of this.g.paths) if (p.kind === 'land') {
      const e = p.pts[p.pts.length - 1];
      const gx = X(e[0]), gy = Y(y1 - 0.05);
      c.fillStyle = '#3b2412'; c.beginPath(); c.moveTo(gx - TS * 0.32, gy + TS * 0.12); c.lineTo(gx - TS * 0.32, gy - TS * 0.25); c.arc(gx, gy - TS * 0.25, TS * 0.32, Math.PI, 0); c.lineTo(gx + TS * 0.32, gy + TS * 0.12); c.closePath(); c.fill();
      c.strokeStyle = INK; c.lineWidth = lw; c.stroke();
      c.strokeStyle = 'rgba(255,220,160,.25)'; c.lineWidth = Math.max(1, TS * 0.03);
      for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(gx + k * TS * 0.12, gy + TS * 0.1); c.lineTo(gx + k * TS * 0.12, gy - TS * 0.4); c.stroke(); }
      this.gates.push([e[0], y1 - 0.2]);
    }
    // muelle para los barcos
    for (const p of this.g.paths) if (p.kind === 'sea') {
      const e = p.pts[p.pts.length - 1];
      c.fillStyle = '#8a5a2b'; c.strokeStyle = INK; c.lineWidth = lw * 0.8;
      c.beginPath(); c.roundRect(X(e[0] - 0.45), Y(e[1] - 0.2), TS * 0.9, TS * 0.4, TS * 0.06); c.fill(); c.stroke();
      for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(X(e[0] - 0.45 + k * 0.25 + 0.1), Y(e[1] - 0.2)); c.lineTo(X(e[0] - 0.45 + k * 0.25 + 0.1), Y(e[1] + 0.2)); c.strokeStyle = 'rgba(40,20,10,.4)'; c.stroke(); }
    }
    this.fortTop = [X((x0 + x1) / 2 + 0.25), Y(0.4)];
  }

  // ---------- eventos del juego → efectos visuales ----------
  onEvent(ev) {
    const P = this.parts, TS = this.TS, X = (x) => this.ox + x * TS, Y = (y) => this.oy + y * TS;
    const low = this.lowFx;
    switch (ev.k) {
      case 'shot': {
        const t = ev.t, a = Math.atan2(ev.y - t.y, ev.x - t.x);
        const off = t.lvl === 2 && t.br === 'b' ? (ev.second ? 0.12 : -0.12) : 0;
        const mx = X(t.x + off) + Math.cos(a) * TS * 0.38, my = Y(t.y - 0.18) + Math.sin(a) * TS * 0.38;
        P.add('tracer', mx, my, { x2: X(ev.x), y2: Y(ev.y), max: 0.09, color: ev.elite ? '#fff4b0' : '#ffe08a', size: ev.elite ? 2.2 : 1.4 });
        P.add('flash', mx, my, { max: 0.07, size: TS * 0.22, color: '#ffd36b' });
        if (!low) P.add('smoke', mx, my, { vx: Math.cos(a) * 12, vy: Math.sin(a) * 12 - 8, max: 0.5, size: TS * 0.08, color: '210,210,210' });
        for (let i = 0; i < 2; i++) P.add('spark', X(ev.x), Y(ev.y), { vx: (Math.random() - 0.5) * 160, vy: (Math.random() - 0.5) * 160, max: 0.18, color: '#ffe9a8', size: 1.5 });
        if (ev.crit) P.add('text', X(ev.x), Y(ev.y) - TS * 0.5, { text: '¡CRÍTICO!', vy: -38, max: 0.8, color: '#ffb02e', size: TS * 0.3 });
        break;
      }
      case 'cannon': case 'mortar': {
        const t = ev.t, a = t.angle;
        const mx = X(t.x) + (ev.k === 'cannon' ? Math.cos(a) * TS * 0.5 : 0), my = Y(t.y - (ev.k === 'cannon' ? 0.15 : 0.3)) + (ev.k === 'cannon' ? Math.sin(a) * TS * 0.5 : 0);
        P.add('flash', mx, my, { max: 0.1, size: TS * (ev.big ? 0.5 : 0.36), color: '#ffcb6b' });
        for (let i = 0; i < (low ? 2 : 5); i++) P.add('smoke', mx, my, { vx: Math.cos(a) * 30 + (Math.random() - 0.5) * 30, vy: Math.sin(a) * 30 - 10 - Math.random() * 20, max: 0.7 + Math.random() * 0.4, size: TS * (0.1 + Math.random() * 0.08), color: '225,225,220', drag: 2 });
        this.shake = Math.max(this.shake, ev.big ? 2.5 : 1);
        break;
      }
      case 'cone': {
        const t = ev.t;
        for (let i = 0; i < (low ? 8 : 18); i++) { const a = ev.a + (Math.random() - 0.5) * 0.9, s = TS * (5 + Math.random() * 5); P.add('spark', X(t.x) + Math.cos(ev.a) * TS * 0.5, Y(t.y - 0.15) + Math.sin(ev.a) * TS * 0.5, { vx: Math.cos(a) * s, vy: Math.sin(a) * s, max: 0.25, color: '#ffd36b', size: 2 }); }
        P.add('flash', X(t.x) + Math.cos(ev.a) * TS * 0.6, Y(t.y - 0.15) + Math.sin(ev.a) * TS * 0.6, { max: 0.1, size: TS * 0.55, color: '#ffcb6b' });
        for (let i = 0; i < 4; i++) P.add('smoke', X(t.x) + Math.cos(ev.a) * TS * 0.6, Y(t.y - 0.15) + Math.sin(ev.a) * TS * 0.6, { vx: Math.cos(ev.a) * 40, vy: Math.sin(ev.a) * 40 - 10, max: 0.8, size: TS * 0.14, color: '220,220,215', drag: 2.5 });
        this.shake = Math.max(this.shake, 1.5);
        break;
      }
      case 'bolt': P.add('flash', X(ev.t.x), Y(ev.t.y - 0.2), { max: 0.05, size: TS * 0.15, color: '#fff3d0' }); break;
      case 'boom': {
        const x = X(ev.x), y = Y(ev.y), r = ev.r * TS;
        P.add('ring', x, y, { max: 0.35, size: r, color: 'rgba(255,240,200,' });
        P.add('flash', x, y, { max: 0.12, size: r * 0.9, color: '#ffcf70' });
        const n = low ? 5 : ev.big ? 14 : 9;
        for (let i = 0; i < n; i++) { const a = Math.random() * TAU, s = r * (1 + Math.random() * 2); P.add('fire', x, y, { vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.7 - 20, max: 0.35 + Math.random() * 0.25, size: TS * (0.1 + Math.random() * 0.1), drag: 3 }); }
        for (let i = 0; i < n; i++) { const a = Math.random() * TAU, s = r * (0.5 + Math.random()); P.add('smoke', x, y, { vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.6 - 15, max: 0.8 + Math.random() * 0.6, size: TS * (0.12 + Math.random() * 0.12), color: '90,85,80', drag: 2 }); }
        if (!low) for (let i = 0; i < 6; i++) { const a = Math.random() * TAU; P.add('debris', x, y, { vx: Math.cos(a) * 90, vy: -80 - Math.random() * 90, g: 400, max: 0.7, size: TS * 0.05, color: '#6b4523', vr: 10 }); }
        P.add('scorch', x, y, { max: 2.5, size: r * 0.6 });
        this.shake = Math.max(this.shake, ev.big ? 4 : 2);
        break;
      }
      case 'hit': for (let i = 0; i < 3; i++) P.add('spark', X(ev.x), Y(ev.y), { vx: (Math.random() - 0.5) * 140, vy: (Math.random() - 0.5) * 140, max: 0.2, color: '#fff', size: 1.5 }); break;
      case 'death': {
        const x = X(ev.x), y = Y(ev.y);
        if (ev.naval) { for (let i = 0; i < 14; i++) { const a = Math.random() * TAU; P.add('drop', x, y, { vx: Math.cos(a) * 70, vy: -60 - Math.random() * 80, g: 300, max: 0.7, size: TS * 0.05 }); } P.add('ring', x, y, { max: 0.6, size: TS * 0.8, color: 'rgba(230,250,255,' }); for (let i = 0; i < 5; i++) P.add('debris', x, y, { vx: (Math.random() - 0.5) * 120, vy: -60 - Math.random() * 60, g: 260, max: 0.9, size: TS * 0.07, color: '#8a5a2b', vr: 8 }); }
        else if (ev.flying) { for (let i = 0; i < 8; i++) P.add('feather', x, y - TS * 0.5, { vx: (Math.random() - 0.5) * 80, vy: -30 - Math.random() * 40, g: 60, max: 1.2, size: TS * 0.07, color: ['#36b865', '#e8413a', '#2f6fd8'][i % 3], vr: 5 }); }
        else { P.add('poof', x, y, { max: 0.45, size: TS * 0.45 }); for (let i = 0; i < 5; i++) P.add('smoke', x, y, { vx: (Math.random() - 0.5) * 60, vy: -20 - Math.random() * 30, max: 0.5, size: TS * 0.1, color: '240,240,240', drag: 3 }); }
        P.add('text', x, y - TS * 0.35, { text: '+' + ev.gold, vy: -30, max: 0.9, color: '#ffd54a', size: TS * 0.28 });
        if (ev.boss) {
          for (let i = 0; i < 24; i++) { const a = Math.random() * TAU; P.add('coin', x, y, { vx: Math.cos(a) * 140, vy: -120 - Math.random() * 140, g: 420, max: 1.3, size: TS * 0.1, vr: 12 }); }
          this.whiteFlash = 0.5; this.shake = 8;
        }
        break;
      }
      case 'leak': {
        this.redFlash = Math.min(1, 0.45 + ev.n * 0.08); this.shake = Math.max(this.shake, ev.boss ? 9 : 3.5);
        const [fx, fy] = this.fortTop || [this.W / 2, this.oy];
        P.add('text', X(ev.x), Y(ev.y) - TS * 0.4, { text: '-' + ev.n, vy: -24, max: 1.1, color: '#ff5a5a', size: TS * 0.36 });
        for (let i = 0; i < 6; i++) P.add('smoke', X(ev.x), Y(ev.y) - TS * 0.2, { vx: (Math.random() - 0.5) * 50, vy: -30, max: 1, size: TS * 0.16, color: '70,60,60', drag: 1.5 });
        break;
      }
      case 'build': case 'upgrade': {
        const x = X(ev.t.x), y = Y(ev.t.y);
        P.add('ring', x, y + TS * 0.2, { max: 0.45, size: TS * 0.8, color: 'rgba(255,240,180,' });
        for (let i = 0; i < 10; i++) { const a = Math.random() * TAU; P.add('smoke', x + Math.cos(a) * TS * 0.4, y + TS * 0.25 + Math.sin(a) * TS * 0.15, { vx: Math.cos(a) * 30, vy: -10, max: 0.6, size: TS * 0.12, color: '235,220,190', drag: 2 }); }
        if (ev.k === 'upgrade') for (let i = 0; i < 12; i++) P.add('star', x + (Math.random() - 0.5) * TS * 0.8, y, { vy: -40 - Math.random() * 50, max: 0.9, size: TS * 0.09, color: '#ffe17a', vr: 4 });
        ev.t.pop = 1;
        break;
      }
      case 'sell': for (let i = 0; i < 10; i++) { const a = Math.random() * TAU; P.add('coin', X(ev.t.x), Y(ev.t.y), { vx: Math.cos(a) * 80, vy: -100 - Math.random() * 60, g: 380, max: 0.9, size: TS * 0.09, vr: 12 }); } P.add('text', X(ev.t.x), Y(ev.t.y) - TS * 0.5, { text: '+' + ev.v, vy: -30, max: 1, color: '#ffd54a', size: TS * 0.32 }); break;
      case 'gust': if (!low && Math.random() < 0.5) { const t = ev.t, s = TOWERS.pampero; const a = Math.random() * TAU, r = TS * (0.6 + Math.random()); P.add('wind', X(t.x) + Math.cos(a) * r, Y(t.y) + Math.sin(a) * r, { vx: -Math.sin(a) * 60, vy: Math.cos(a) * 60, max: 0.5, size: TS * 0.25, rot: a }); } if (ev.t.lvl === 2 && ev.t.br === 'a') P.add('flake', X(ev.t.x) + (Math.random() - 0.5) * TS * 2, Y(ev.t.y) + (Math.random() - 0.5) * TS * 2, { vy: 15, max: 1, size: TS * 0.06, vr: 2 }); break;
      case 'push': { const t = ev.t; P.add('ring', X(t.x), Y(t.y), { max: 0.5, size: TS * 2.2, color: 'rgba(200,235,255,' }); for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; P.add('wind', X(t.x) + Math.cos(a) * TS * 0.6, Y(t.y) + Math.sin(a) * TS * 0.6, { vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, max: 0.45, size: TS * 0.3, rot: a + Math.PI / 2 }); } break; }
      case 'freeze': for (let i = 0; i < 6; i++) P.add('flake', X(ev.x) + (Math.random() - 0.5) * TS * 0.6, Y(ev.y) + (Math.random() - 0.5) * TS * 0.6, { vy: -10, max: 0.8, size: TS * 0.07, vr: 3 }); break;
      case 'heal': P.add('ring', X(ev.x), Y(ev.y), { max: 0.6, size: ev.r * TS, color: 'rgba(120,255,150,' }); for (let i = 0; i < 4; i++) P.add('plus', X(ev.x) + (Math.random() - 0.5) * TS * ev.r, Y(ev.y) + (Math.random() - 0.5) * TS * ev.r, { vy: -30, max: 0.8, size: TS * 0.12 }); break;
      case 'shieldbreak': for (let i = 0; i < 10; i++) { const a = Math.random() * TAU; P.add('shard', X(ev.x), Y(ev.y), { vx: Math.cos(a) * 110, vy: Math.sin(a) * 110 - 30, g: 200, max: 0.6, size: TS * 0.07, vr: 9 }); } break;
      case 'charge': case 'rally': case 'summon': case 'phase': case 'vanish':
        P.add('ring', X(ev.x), Y(ev.y), { max: 0.7, size: TS * (ev.k === 'rally' ? 2.3 : 1.2), color: ev.k === 'vanish' || ev.k === 'phase' ? 'rgba(200,140,255,' : 'rgba(255,120,90,' });
        if (ev.k === 'summon' || ev.k === 'vanish') for (let i = 0; i < 10; i++) P.add('smoke', X(ev.x) + (Math.random() - 0.5) * TS, Y(ev.y) + (Math.random() - 0.5) * TS * 0.5, { vy: -20, max: 0.9, size: TS * 0.2, color: ev.k === 'vanish' ? '120,80,160' : '80,70,70', drag: 1 });
        break;
      case 'broadside': for (let i = 0; i < 6; i++) P.add('smoke', X(ev.x) + (Math.random() - 0.5) * TS, Y(ev.y) + (Math.random() - 0.5) * TS, { vy: -15, max: 1.1, size: TS * 0.22, color: '230,230,230', drag: 1 }); P.add('flash', X(ev.x), Y(ev.y), { max: 0.12, size: TS * 0.9, color: '#ffcb6b' }); this.shake = Math.max(this.shake, 3); break;
      case 'disabled': for (let i = 0; i < 8; i++) P.add('smoke', X(ev.t.x) + (Math.random() - 0.5) * TS * 0.6, Y(ev.t.y) - TS * 0.2, { vy: -25, max: 1.2, size: TS * 0.16, color: '60,60,60', drag: 1 }); break;
      case 'slash': P.add('slash', X(ev.x), Y(ev.y) - TS * 0.1, { max: 0.18, size: TS * 0.35, rot: Math.random() * TAU }); break;
      case 'troops': for (let i = 0; i < 16; i++) { const a = Math.random() * TAU; P.add('smoke', X(ev.x) + Math.cos(a) * TS * 0.4, Y(ev.y) + Math.sin(a) * TS * 0.25, { vx: Math.cos(a) * 40, vy: -15, max: 0.8, size: TS * 0.18, color: '230,215,190', drag: 2 }); } break;
      case 'flare': this.flareStart = this.time; break;
      case 'bossdown': break;
    }
  }

  // ---------- cuadro ----------
  frame(dt, ui) {
    const g = this.g, c = this.c, TS = this.TS, dpr = this.dpr;
    this.time += dt;
    const time = this.time;
    const X = (x) => this.ox + x * TS, Y = (y) => this.oy + y * TS;
    let sx = 0, sy = 0;
    if (this.shake > 0.1 && !ui.reduceShake) { sx = (Math.random() - 0.5) * this.shake; sy = (Math.random() - 0.5) * this.shake; }
    this.shake *= Math.pow(0.0015, dt);
    c.setTransform(dpr, 0, 0, dpr, sx * dpr, sy * dpr);
    if (this.bg) c.drawImage(this.bg, -sx * 0, 0, this.W, this.H);
    // brillos del agua
    c.lineCap = 'round';
    c.strokeStyle = 'rgba(235,250,255,1)'; c.lineWidth = Math.max(1, TS * 0.035);
    for (const [cc, r, ph, k] of this.water) {
      const a = 0.5 + 0.5 * Math.sin(time * 1.3 + ph);
      if (a < 0.25) continue;
      c.globalAlpha = (a - 0.25) * 0.45;
      const x = X(cc + 0.3 + k * 0.4) + Math.sin(time * 0.6 + ph) * TS * 0.12, y = Y(r + 0.5);
      c.beginPath(); c.moveTo(x - TS * 0.16, y); c.quadraticCurveTo(x, y - TS * 0.07, x + TS * 0.16, y); c.stroke();
    }
    c.globalAlpha = 1;
    // pistas de construcción
    if (ui.hints) {
      c.fillStyle = 'rgba(255,255,255,.09)'; c.strokeStyle = 'rgba(255,255,255,.2)'; c.lineWidth = 1;
      for (let r = 0; r < ROWS; r++) for (let cc = 0; cc < COLS; cc++) if (g.buildable(cc, r)) { c.beginPath(); c.roundRect(X(cc) + TS * 0.12, Y(r) + TS * 0.12, TS * 0.76, TS * 0.76, TS * 0.16); c.fill(); c.stroke(); }
    }
    if (ui.troopAim) {
      c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
      c.globalAlpha = 0.35 + 0.2 * Math.sin(time * 6); c.strokeStyle = '#9fd8ff'; c.lineWidth = TS * 0.85;
      for (const p of g.paths) if (p.kind === 'land') { c.beginPath(); p.pts.forEach(([x, y], i) => (i ? c.lineTo(X(x), Y(y)) : c.moveTo(X(x), Y(y)))); c.stroke(); }
      c.restore();
    }
    // marcas de explosiones (debajo de todo)
    for (const p of this.parts.p) if (p.on && p.kind === 'scorch') { const k = p.life / p.max; c.globalAlpha = 0.28 * (1 - k); c.fillStyle = '#2b2118'; c.beginPath(); c.ellipse(p.x, p.y, p.size, p.size * 0.6, 0, 0, TAU); c.fill(); }
    c.globalAlpha = 1;
    // charcos de brea
    for (const z of g.zones) {
      const k = z.t / z.T, x = X(z.x), y = Y(z.y), r = z.r * TS;
      c.globalAlpha = Math.min(1, k * 2) * 0.8;
      const gr = c.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,190,60,.85)'); gr.addColorStop(0.6, 'rgba(230,80,20,.55)'); gr.addColorStop(1, 'rgba(60,20,10,0)');
      c.fillStyle = gr; c.beginPath(); c.ellipse(x, y, r, r * 0.7, 0, 0, TAU); c.fill();
      if (Math.random() < dt * 20 && !this.lowFx) this.parts.add('fire', x + (Math.random() - 0.5) * r, y + (Math.random() - 0.5) * r * 0.6, { vy: -30, max: 0.5, size: TS * 0.08 });
    }
    c.globalAlpha = 1;
    // indicadores de próxima oleada
    if (g.state === 'play' && !g.spawning && g.wave < g.totalWaves) {
      if (this.nextGroupsWave !== g.wave) { this.nextGroupsWave = g.wave; this.nextPaths = [...new Set(g.waveGroups(g.wave + 1).map((x) => x.path))]; }
      for (const pi of this.nextPaths) {
        const p = g.paths[pi], s = p.pts[0], s2 = p.pts[3] || p.pts[1];
        const bx = clamp(X(s[0]), 24, this.W - 24), by = Math.min(Y(s[1]), this.H - ui.bottom - 26);
        const col = p.kind === 'sea' ? '#6fd3ff' : p.kind === 'air' ? '#9ff08a' : '#ff6b5a';
        const pulse = 0.5 + 0.5 * Math.sin(time * 5);
        c.save(); c.translate(bx, by);
        c.globalAlpha = 0.85; c.fillStyle = 'rgba(20,16,32,.7)'; c.beginPath(); c.arc(0, 0, TS * 0.42 + pulse * 3, 0, TAU); c.fill();
        c.strokeStyle = col; c.lineWidth = 2.5; c.stroke();
        c.globalAlpha = 1; c.fillStyle = col;
        for (let k = 0; k < 2; k++) { const yy = -TS * 0.05 - k * TS * 0.16 - pulse * TS * 0.06; c.beginPath(); c.moveTo(-TS * 0.17, yy + TS * 0.1); c.lineTo(0, yy - TS * 0.04); c.lineTo(TS * 0.17, yy + TS * 0.1); c.lineWidth = 3; c.strokeStyle = col; c.stroke(); }
        c.restore();
      }
    }
    // rango del seleccionado / vista previa
    if (ui.range) {
      const { x, y, r, min, color } = ui.range;
      c.save(); c.fillStyle = color || 'rgba(255,255,255,.1)'; c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 2; c.setLineDash([6, 5]); c.lineDashOffset = -time * 20;
      c.beginPath(); c.arc(X(x), Y(y), r * TS, 0, TAU); c.fill(); c.stroke();
      if (min) { c.strokeStyle = 'rgba(255,120,100,.7)'; c.beginPath(); c.arc(X(x), Y(y), min * TS, 0, TAU); c.stroke(); }
      c.restore();
    }
    if (ui.faroLinks) for (const [a, b] of ui.faroLinks) { c.save(); c.strokeStyle = 'rgba(255,225,120,.6)'; c.lineWidth = 2; c.setLineDash([3, 5]); c.beginPath(); c.moveTo(X(a.x), Y(a.y)); c.lineTo(X(b.x), Y(b.y)); c.stroke(); c.restore(); }
    if (ui.tile) {
      const [cc, r] = ui.tile, ok = ui.tileOk;
      c.save(); c.strokeStyle = ok ? 'rgba(255,255,255,.95)' : 'rgba(255,90,90,.95)'; c.lineWidth = 2.5; c.fillStyle = ok ? 'rgba(255,255,255,.18)' : 'rgba(255,60,60,.2)';
      const pad = TS * (0.04 + 0.03 * Math.sin(time * 6));
      c.beginPath(); c.roundRect(X(cc) + pad, Y(r) + pad, TS - pad * 2, TS - pad * 2, TS * 0.18); c.fill(); c.stroke(); c.restore();
    }
    // entidades ordenadas por y
    const S = this.sorted; S.length = 0;
    for (const t of g.towers) S.push(t);
    for (const e of g.enemies) if (!e.flying) S.push(e);
    for (const s of g.soldiers) S.push(s);
    S.sort((a, b) => a.y - b.y);
    for (const o of S) {
      if (o.def) this.drawEnemy(c, o, time);
      else if (o.type) this.drawTowerAt(c, o, time, ui, dt);
      else this.drawSoldier(c, o, time);
    }
    if (ui.ghost) { c.save(); c.globalAlpha = 0.6; c.translate(X(ui.ghost.c + 0.5), Y(ui.ghost.r + 0.5)); drawTower(c, { type: ui.ghost.type, lvl: 0, angle: -Math.PI / 2, recoil: 0, id: 0 }, TS, time); c.restore(); }
    // proyectiles
    for (const p of g.projs) this.drawProj(c, p);
    // bombardeo entrante
    for (const s of g.strikes) {
      const h = s.t * 9, x = X(s.x), y = Y(s.y);
      c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(x, y, TS * 0.3 * (1 - s.t * 0.6), TS * 0.15 * (1 - s.t * 0.6), 0, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(255,80,60,.8)'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, s.r * TS * (0.4 + s.t * 0.5), 0, TAU); c.stroke();
      c.fillStyle = '#22252d'; c.beginPath(); c.arc(x, y - h * TS, TS * 0.16, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = TS * 0.06; c.beginPath(); c.moveTo(x, y - h * TS - TS * 0.2); c.lineTo(x, y - h * TS - TS * 1.2); c.stroke();
    }
    // voladores
    for (const e of g.enemies) if (e.flying) this.drawEnemy(c, e, time);
    // luz de faros
    c.globalCompositeOperation = 'lighter';
    for (const t of g.towers) if (t.type === 'faro' && t.disabledT <= 0) {
      const s = g.stats_(t), H = TS * (t.lvl === 2 && t.br === 'b' ? 0.95 : 0.8);
      const lx = X(t.x), ly = Y(t.y) - H, len = s.range * TS, a = t.angle;
      const gr = c.createRadialGradient(lx, ly, 0, lx, ly, len);
      const warm = t.lvl === 2 && t.br === 'a';
      gr.addColorStop(0, warm ? 'rgba(255,170,110,.32)' : 'rgba(255,240,170,.3)'); gr.addColorStop(1, 'rgba(255,230,150,0)');
      c.fillStyle = gr; c.beginPath(); c.moveTo(lx, ly); c.arc(lx, ly, len, a - 0.28, a + 0.28); c.closePath(); c.fill();
      c.beginPath(); c.arc(lx, ly, TS * 0.3, 0, TAU); c.fillStyle = 'rgba(255,240,180,.25)'; c.fill();
    }
    c.globalCompositeOperation = 'source-over';
    // partículas
    this.drawParticles(c, dt);
    // bengala
    if (g.flareT > 0) {
      const k = g.flareT / 10, fx = this.W * 0.5 + Math.sin(time * 0.8) * this.W * 0.15, fy = this.oy + TS * (2 + (1 - k) * 4);
      c.globalCompositeOperation = 'lighter';
      const gr = c.createRadialGradient(fx, fy, 0, fx, fy, this.W * 0.9);
      gr.addColorStop(0, `rgba(255,120,60,${0.25 * Math.min(1, g.flareT)})`); gr.addColorStop(1, 'rgba(255,80,40,0)');
      c.fillStyle = gr; c.fillRect(0, 0, this.W, this.H);
      c.fillStyle = '#fff2d0'; c.beginPath(); c.arc(fx, fy, 4 + Math.random() * 2, 0, TAU); c.fill();
      c.globalCompositeOperation = 'source-over';
      if (Math.random() < 0.5) this.parts.add('spark', fx, fy, { vx: (Math.random() - 0.5) * 40, vy: 30, max: 0.6, color: '#ffb36b', size: 1.5 });
    }
    // bandera y faro de la fortaleza
    this.drawFortFx(c, time, dt);
    // destellos de pantalla
    if (this.redFlash > 0) {
      const gr = c.createRadialGradient(this.W / 2, this.H / 2, Math.min(this.W, this.H) * 0.3, this.W / 2, this.H / 2, Math.max(this.W, this.H) * 0.7);
      gr.addColorStop(0, 'rgba(255,0,0,0)'); gr.addColorStop(1, `rgba(220,20,30,${this.redFlash * 0.55})`);
      c.fillStyle = gr; c.fillRect(-10, -10, this.W + 20, this.H + 20); this.redFlash = Math.max(0, this.redFlash - dt * 1.6);
    }
    if (this.whiteFlash > 0) { c.fillStyle = `rgba(255,250,235,${this.whiteFlash * 0.6})`; c.fillRect(-10, -10, this.W + 20, this.H + 20); this.whiteFlash = Math.max(0, this.whiteFlash - dt * 1.5); }
    if (ui.pointer) this.drawPointer(c, ui.pointer, time);
  }

  drawFortFx(c, time, dt) {
    const g = this.g, TS = this.TS;
    const fx = this.ox + 6.3 * TS, fy = this.oy + 0.1 * TS;
    // bandera de Uruguay
    c.strokeStyle = INK; c.lineWidth = Math.max(1.5, TS * 0.05); c.beginPath(); c.moveTo(fx, fy + TS * 0.6); c.lineTo(fx, fy - TS * 0.7); c.stroke();
    const fw = TS * 0.8, fh = TS * 0.5, top = fy - TS * 0.7;
    for (let i = 0; i < 9; i++) {
      c.beginPath();
      for (let k = 0; k <= 8; k++) { const x = fx + fw * k / 8, y = top + fh * i / 9 + Math.sin(time * 5 - k * 0.7) * TS * 0.04 * k / 8; k ? c.lineTo(x, y) : c.moveTo(x, y); }
      for (let k = 8; k >= 0; k--) { const x = fx + fw * k / 8, y = top + fh * (i + 1) / 9 + Math.sin(time * 5 - k * 0.7) * TS * 0.04 * k / 8; c.lineTo(x, y); }
      c.closePath(); c.fillStyle = i % 2 ? '#5aa9e6' : '#ffffff'; c.fill();
    }
    c.fillStyle = '#ffffff'; c.fillRect(fx, top, fw * 0.4, fh * 5 / 9);
    c.fillStyle = '#f2c94c'; c.beginPath(); c.arc(fx + fw * 0.2, top + fh * 2.5 / 9, fh * 0.17, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(33,26,46,.6)'; c.lineWidth = 1; c.strokeRect(fx, top, fw, fh);
    // humo si la fortaleza está golpeada
    if (g.lives < g.livesStart * 0.5 && Math.random() < dt * 6) this.parts.add('smoke', this.ox + (3 + Math.random() * 3) * TS, this.oy + Math.random() * 1.5 * TS, { vy: -18, vx: 6, max: 2, size: TS * 0.18, color: '60,55,55', drag: 0.4 });
  }
  drawPointer(c, p, time) {
    const x = this.ox + p.x * this.TS, y = this.oy + p.y * this.TS, b = Math.abs(Math.sin(time * 4)) * this.TS * 0.25;
    c.save(); c.translate(x, y - this.TS * 0.6 - b);
    c.fillStyle = '#ffd54a'; c.strokeStyle = INK; c.lineWidth = 3;
    c.beginPath(); c.moveTo(0, 0); c.lineTo(-this.TS * 0.28, -this.TS * 0.32); c.lineTo(-this.TS * 0.1, -this.TS * 0.32); c.lineTo(-this.TS * 0.1, -this.TS * 0.7); c.lineTo(this.TS * 0.1, -this.TS * 0.7); c.lineTo(this.TS * 0.1, -this.TS * 0.32); c.lineTo(this.TS * 0.28, -this.TS * 0.32); c.closePath();
    c.fill(); c.stroke(); c.restore();
    c.strokeStyle = `rgba(255,213,74,${0.8 - (time * 1.5 % 1) * 0.8})`; c.lineWidth = 3; c.beginPath(); c.arc(x, y, this.TS * (0.3 + (time * 1.5 % 1) * 0.4), 0, TAU); c.stroke();
  }

  drawTowerAt(c, t, time, ui, dt) {
    const TS = this.TS, x = this.ox + t.x * TS, y = this.oy + t.y * TS;
    c.save(); c.translate(x, y);
    if (t.pop > 0) { const k = 1 + Math.sin(t.pop * Math.PI) * 0.18; c.scale(k, 2 - k); t.pop = Math.max(0, t.pop - dt * 3.5); }
    if (ui.sel === t) { c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 2.5; c.beginPath(); c.ellipse(0, TS * 0.25, TS * 0.5, TS * 0.3, 0, 0, TAU); c.stroke(); }
    drawTower(c, t, TS * 1.1, time, { disabled: t.disabledT > 0 });
    if (t.disabledT > 0) {
      for (let i = 0; i < 3; i++) { const a = time * 4 + i * 2.1; star(c, Math.cos(a) * TS * 0.25, -TS * 0.75 + Math.sin(a) * TS * 0.08, TS * 0.08, '#ffe17a', INK, 1); }
    }
    c.restore();
  }
  drawSoldier(c, s, time) {
    const TS = this.TS, x = this.ox + s.x * TS, y = this.oy + s.y * TS, u = TS * 0.3;
    c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(x, y + u * 0.6, u * 0.7, u * 0.25, 0, 0, TAU); c.fill();
    const f = s.engaged.length ? ((time * 8) | 0) % 4 : 0;
    const spr = enemySprite('blandengue', u, f, '', this.dpr);
    const fade = s.life < 1 ? s.life : Math.min(1, (this.g.time - s.born) * 4);
    c.globalAlpha = Math.max(0, fade);
    c.save(); c.translate(x, y); if (s.side < 0) c.scale(-1, 1);
    c.drawImage(spr, -spr._half, -spr._half, spr._half * 2, spr._half * 2); c.restore();
    c.globalAlpha = 1;
    this.bar(c, x, y - u * 1.6, TS * 0.5, s.hp / s.maxHp, '#6fd3ff', 0);
  }
  bar(c, x, y, w, k, col, shieldK) {
    const h = Math.max(3, this.TS * 0.08);
    c.fillStyle = 'rgba(20,14,30,.85)'; c.beginPath(); c.roundRect(x - w / 2 - 1, y - 1, w + 2, h + 2, 2); c.fill();
    c.fillStyle = col; c.fillRect(x - w / 2, y, w * clamp(k, 0, 1), h);
    if (shieldK > 0) { c.fillStyle = 'rgba(140,210,255,.95)'; c.fillRect(x - w / 2, y - h * 0.9, w * clamp(shieldK, 0, 1), h * 0.7); }
  }
  drawEnemy(c, e, time) {
    const g = this.g, TS = this.TS, def = e.def;
    const u = def.r * TS * (def.kind === 'sea' ? 1.0 : 1.15);
    const x = this.ox + e.x * TS, y = this.oy + e.y * TS;
    const vis = g.visible(e);
    const moving = e.curSpd > 0.01;
    const f = moving || e.flying ? ((time * (e.flying ? 10 : 5 + def.spd * 3) + e.wobble) | 0) % 4 : 0;
    const variant = e.flash > 0 ? 'flash' : e.freezeT > 0 ? 'ice' : '';
    const age = g.time - e.born, fadeIn = Math.min(1, age * 3);
    let alpha = fadeIn;
    if (!vis) alpha *= 0.28 + 0.08 * Math.sin(time * 7 + e.wobble);
    c.globalAlpha = alpha;
    if (def.boss) { // aura
      const pr = 0.5 + 0.5 * Math.sin(time * 4);
      c.fillStyle = def.kind === 'sea' ? `rgba(40,20,60,${0.25 + pr * 0.1})` : `rgba(255,60,40,${0.18 + pr * 0.12})`;
      c.beginPath(); c.ellipse(x, y + u * 0.45, u * (1.3 + pr * 0.15), u * (0.55 + pr * 0.06), 0, 0, TAU); c.fill();
    }
    if (e.flying) {
      c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(x, y + TS * 0.35, u * 0.6, u * 0.22, 0, 0, TAU); c.fill();
      const lift = TS * 0.45 + Math.sin(time * 3 + e.wobble) * TS * 0.06;
      const spr = enemySprite(e.type, u, f, variant, this.dpr);
      c.save(); c.translate(x, y - lift); if (e.dir < 0) c.scale(-1, 1);
      c.drawImage(spr, -spr._half, -spr._half, spr._half * 2, spr._half * 2); c.restore();
      c.globalAlpha = 1;
      this.enemyHud(c, e, x, y - lift, u, vis, time);
      return;
    }
    if (e.naval) {
      // estela
      if (moving && Math.random() < 0.3 && !this.lowFx) this.parts.add('wake', x - e.hx * u, y - e.hy * u, { max: 1.1, size: u * 0.5 });
      const a = Math.atan2(e.hy, e.hx) + Math.sin(time * 2 + e.wobble) * 0.04;
      c.fillStyle = 'rgba(10,40,70,.25)'; c.beginPath(); c.ellipse(x + 3, y + 4, u * 1.15, u * 0.7, a, 0, TAU); c.fill();
      const spr = enemySprite(e.type, u, f, variant, this.dpr);
      c.save(); c.translate(x, y); c.rotate(a);
      c.drawImage(spr, -spr._half, -spr._half, spr._half * 2, spr._half * 2); c.restore();
      c.globalAlpha = 1;
      this.enemyHud(c, e, x, y - u * 0.4, u, vis, time);
      return;
    }
    c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(x, y + u * 0.62, u * 0.62, u * 0.22, 0, 0, TAU); c.fill();
    const bob = moving ? Math.abs(Math.sin(time * (6 + def.spd * 4) + e.wobble)) * u * 0.1 : 0;
    const spr = enemySprite(e.type, u, f, variant, this.dpr);
    c.save(); c.translate(x, y - bob);
    if (e.chargeT > 0) c.rotate(0.15 * e.dir);
    if (e.dir < 0) c.scale(-1, 1);
    c.drawImage(spr, -spr._half, -spr._half, spr._half * 2, spr._half * 2); c.restore();
    if (e.shield > 0 && vis) {
      c.strokeStyle = `rgba(140,210,255,${0.35 + 0.4 * e.shield / Math.max(1, e.shieldMax)})`; c.lineWidth = 2;
      c.beginPath(); c.arc(x, y - bob, u * 0.95, 0, TAU); c.stroke();
    }
    c.globalAlpha = 1;
    this.enemyHud(c, e, x, y - bob, u, vis, time);
  }
  enemyHud(c, e, x, y, u, vis, time) {
    const TS = this.TS;
    if (!vis) return;
    const top = y - u * (e.def.boss ? 1.5 : 1.25) - (e.naval ? u * 0.3 : 0);
    if (e.hp < e.maxHp || e.def.boss || e.shield < e.shieldMax) {
      const w = e.def.boss ? TS * 1.1 : Math.max(TS * 0.55, u * 1.5), k = e.hp / e.maxHp;
      this.bar(c, x, top, w, k, k > 0.6 ? '#6ee06a' : k > 0.3 ? '#ffd54a' : '#ff5a4a', e.shieldMax ? e.shield / e.shieldMax : 0);
    }
    let ix = x + u * 0.8;
    if (e.slow > 0 && e.slowT > 0) { c.fillStyle = '#9fe0ff'; c.font = `${Math.round(TS * 0.26)}px sans-serif`; c.beginPath(); c.arc(ix, top - 2, TS * 0.08, 0, TAU); c.fill(); ix += TS * 0.2; }
    if (e.markT > 0) { c.strokeStyle = '#ff4a4a'; c.lineWidth = 1.5; c.beginPath(); c.arc(x, y, u * 1.05, 0, TAU); c.stroke(); }
    if (e.stunT > 0 || e.freezeT > 0) for (let i = 0; i < 3; i++) { const a = time * 5 + i * 2.1; star(c, x + Math.cos(a) * u * 0.6, top - TS * 0.12 + Math.sin(a) * u * 0.15, TS * 0.07, e.freezeT > 0 ? '#c8f0ff' : '#ffe17a', INK, 1); }
    if (e.rallyT > 0 && !e.def.boss) { c.fillStyle = '#ff6b5a'; c.beginPath(); c.moveTo(x - u * 0.9, top + 4); c.lineTo(x - u * 0.6, top - 4); c.lineTo(x - u * 0.3, top + 4); c.fill(); }
    if (e.def.stealth && e.revealT > 0 && this.g.flareT <= 0) { c.fillStyle = 'rgba(255,230,140,.95)'; c.beginPath(); c.ellipse(x, top - TS * 0.18, TS * 0.12, TS * 0.07, 0, 0, TAU); c.fill(); c.fillStyle = INK; c.beginPath(); c.arc(x, top - TS * 0.18, TS * 0.04, 0, TAU); c.fill(); }
  }
  drawProj(c, p) {
    const TS = this.TS, X = (x) => this.ox + x * TS, Y = (y) => this.oy + y * TS;
    if (p.kind === 'bolt') {
      const a = Math.atan2(p.vy, p.vx), x = X(p.x), y = Y(p.y), L = TS * (p.big ? 0.6 : 0.42);
      c.save(); c.translate(x, y); c.rotate(a);
      c.strokeStyle = p.big ? '#c9d0db' : '#d9b27a'; c.lineWidth = Math.max(1.5, TS * (p.big ? 0.07 : 0.05)); c.beginPath(); c.moveTo(-L, 0); c.lineTo(0, 0); c.stroke();
      c.fillStyle = '#e6eaf2'; c.beginPath(); c.moveTo(TS * 0.12, 0); c.lineTo(0, -TS * 0.05); c.lineTo(0, TS * 0.05); c.fill();
      c.fillStyle = '#e8413a'; c.fillRect(-L, -TS * 0.05, TS * 0.1, TS * 0.1);
      c.restore();
      return;
    }
    const k = Math.min(1, p.t / p.T);
    const arc = p.kind === 'shell' ? 2.4 : p.kind === 'eball' ? 1.2 : 0.3;
    const h = Math.sin(k * Math.PI) * arc * TS;
    const x = X(p.x), y = Y(p.y);
    const r = TS * (p.kind === 'shell' ? (p.big ? 0.17 : 0.13) : p.big ? 0.13 : 0.1) * (1 + h / TS * 0.12);
    c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(x, y + TS * 0.1, r * 0.9, r * 0.45, 0, 0, TAU); c.fill();
    c.fillStyle = '#1f2229'; c.beginPath(); c.arc(x, y - h, r, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.arc(x - r * 0.35, y - h - r * 0.35, r * 0.3, 0, TAU); c.fill();
    if (p.kind === 'shell') { c.fillStyle = p.fire ? '#ff8a2a' : '#ffcf5a'; c.beginPath(); c.arc(x + r * 0.6, y - h - r * 0.9, r * 0.35 + Math.random() * 1.5, 0, TAU); c.fill(); }
    if (p.fire && Math.random() < 0.5) this.parts.add('fire', x, y - h, { vy: -10, max: 0.3, size: TS * 0.07 });
  }

  drawParticles(c, dt) {
    const TAUp = TAU;
    for (const p of this.parts.p) {
      if (!p.on) continue;
      p.life += dt;
      if (p.life >= p.max) { p.on = false; continue; }
      const k = p.life / p.max;
      if (p.drag) { const d = Math.exp(-p.drag * dt); p.vx *= d; p.vy *= d; }
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      switch (p.kind) {
        case 'scorch': break;
        case 'smoke': c.globalAlpha = (1 - k) * 0.5; c.fillStyle = `rgb(${p.color})`; c.beginPath(); c.arc(p.x, p.y, p.size * (1 + k * 1.5), 0, TAUp); c.fill(); break;
        case 'fire': c.globalCompositeOperation = 'lighter'; c.globalAlpha = 1 - k; c.fillStyle = k < 0.4 ? '#ffd36b' : k < 0.7 ? '#ff8a2a' : '#c0392b'; c.beginPath(); c.arc(p.x, p.y, p.size * (1 - k * 0.6), 0, TAUp); c.fill(); c.globalCompositeOperation = 'source-over'; break;
        case 'flash': c.globalCompositeOperation = 'lighter'; c.globalAlpha = 1 - k; c.fillStyle = p.color; c.beginPath(); c.arc(p.x, p.y, p.size * (0.6 + k * 0.6), 0, TAUp); c.fill(); c.globalCompositeOperation = 'source-over'; break;
        case 'spark': c.globalAlpha = 1 - k; c.strokeStyle = p.color; c.lineWidth = p.size; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04); c.stroke(); break;
        case 'tracer': c.globalAlpha = 1 - k; c.strokeStyle = p.color; c.lineWidth = p.size; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x2, p.y2); c.stroke(); break;
        case 'ring': c.globalAlpha = 1; c.strokeStyle = p.color + (1 - k) * 0.8 + ')'; c.lineWidth = 3 * (1 - k) + 1; c.beginPath(); c.arc(p.x, p.y, p.size * (0.3 + k * 0.8), 0, TAUp); c.stroke(); break;
        case 'debris': case 'shard': c.globalAlpha = 1 - k * k; c.fillStyle = p.kind === 'shard' ? '#bfe6ff' : p.color; c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.fillRect(-p.size, -p.size * 0.6, p.size * 2, p.size * 1.2); c.restore(); break;
        case 'drop': c.globalAlpha = 1 - k; c.fillStyle = '#d8f3ff'; c.beginPath(); c.arc(p.x, p.y, p.size, 0, TAUp); c.fill(); break;
        case 'feather': c.globalAlpha = 1 - k; c.fillStyle = p.color; c.save(); c.translate(p.x, p.y); c.rotate(Math.sin(p.rot) * 0.8); c.beginPath(); c.ellipse(0, 0, p.size * 1.6, p.size * 0.6, 0, 0, TAUp); c.fill(); c.restore(); p.vy = Math.min(p.vy, 25); break;
        case 'text': {
          const s = k < 0.15 ? 0.6 + k / 0.15 * 0.5 : 1.1 - Math.min(0.1, (k - 0.15));
          c.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
          c.font = `${Math.round(p.size * s)}px Lilita, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
          c.lineWidth = 3; c.strokeStyle = 'rgba(33,26,46,.9)'; c.strokeText(p.text, p.x, p.y); c.fillStyle = p.color; c.fillText(p.text, p.x, p.y);
          break;
        }
        case 'coin': c.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1; c.fillStyle = '#ffd54a'; c.strokeStyle = '#a8741a'; c.lineWidth = 1; c.beginPath(); c.ellipse(p.x, p.y, p.size * Math.abs(Math.cos(p.rot)) + 0.5, p.size, 0, 0, TAUp); c.fill(); c.stroke(); break;
        case 'star': c.globalAlpha = 1 - k; star(c, p.x, p.y, p.size, p.color); break;
        case 'flake': c.globalAlpha = 1 - k; c.strokeStyle = '#e6f8ff'; c.lineWidth = 1.2; c.save(); c.translate(p.x, p.y); c.rotate(p.rot); for (let i = 0; i < 3; i++) { c.rotate(Math.PI / 3); c.beginPath(); c.moveTo(-p.size, 0); c.lineTo(p.size, 0); c.stroke(); } c.restore(); break;
        case 'wind': c.globalAlpha = (1 - k) * 0.7; c.strokeStyle = '#eaf7ff'; c.lineWidth = 1.5; c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.beginPath(); c.arc(0, 0, p.size, -0.6, 0.6); c.stroke(); c.restore(); break;
        case 'plus': c.globalAlpha = 1 - k; c.fillStyle = '#6ef08a'; c.fillRect(p.x - p.size / 2, p.y - p.size / 6, p.size, p.size / 3); c.fillRect(p.x - p.size / 6, p.y - p.size / 2, p.size / 3, p.size); break;
        case 'poof': c.globalAlpha = (1 - k) * 0.9; c.strokeStyle = '#fff'; c.lineWidth = 2; for (let i = 0; i < 6; i++) { const a = i / 6 * TAUp; const r1 = p.size * (0.3 + k * 0.6), r2 = p.size * (0.5 + k * 0.8); c.beginPath(); c.moveTo(p.x + Math.cos(a) * r1, p.y + Math.sin(a) * r1 * 0.7); c.lineTo(p.x + Math.cos(a) * r2, p.y + Math.sin(a) * r2 * 0.7); c.stroke(); } break;
        case 'wake': c.globalAlpha = (1 - k) * 0.45; c.strokeStyle = '#eaf8ff'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(p.x, p.y, p.size * (0.4 + k), p.size * (0.25 + k * 0.6), 0, 0, TAUp); c.stroke(); break;
        case 'slash': c.globalAlpha = 1 - k; c.strokeStyle = '#fff'; c.lineWidth = 2.5; c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.beginPath(); c.arc(0, 0, p.size, -0.9 + k, 0.9 * k); c.stroke(); c.restore(); break;
      }
    }
    c.globalAlpha = 1;
  }
}
