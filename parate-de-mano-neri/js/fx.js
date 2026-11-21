// Partículas con pool fijo (sin crear objetos ni arrays en cada paso) y destellos pre-dibujados en lienzos cacheados.
import { lienzo, texto } from './pixel.js';

const MAX = 320;
const GRAV = 920;
export class FX {
  constructor() { this.p = []; for (let i = 0; i < MAX; i++) this.p.push({ k: '', x: 0, y: 0, z: 0, vx: 0, vz: 0, t: 0, vida: 0, c: '', g: 0, txt: '', e: null }); this.n = 0; }
  // devuelve una partícula libre (si está lleno, recicla la más vieja: la 0)
  nueva(k, x, y, z, vida) {
    let q; if (this.n < MAX) q = this.p[this.n++]; else { q = this.p[0]; }
    q.k = k; q.x = x; q.y = y; q.z = z; q.vx = 0; q.vz = 0; q.t = 0; q.vida = vida; q.c = ''; q.g = 0; q.txt = ''; q.e = null; return q;
  }
  limpiar() { this.n = 0; }
  paso(dt) {
    const P = this.p; let i = 0;
    while (i < this.n) {
      const q = P[i]; q.t += dt;
      if (q.t >= q.vida) { this.n--; P[i] = P[this.n]; P[this.n] = q; continue; } // compacta sin crear arrays
      q.x += q.vx * dt;
      switch (q.k) {
        case 'brasa': case 'vidrio': case 'gota': case 'fruta': q.vz -= GRAV * 0.8 * dt; q.z += q.vz * dt; if (q.z < 0) { q.z = 0; q.vz = -q.vz * 0.3; q.vx *= 0.6; } break;
        case 'polvo': case 'humo': q.z += q.vz * dt; q.vx *= 0.95; break;
        case 'txt': q.z += q.vz * dt; break;
        case 'lluvia': q.z += q.vz * dt; if (q.z <= 0) q.t = q.vida; break;
      }
      i++;
    }
  }
  // ---- emisores
  chispa(x, y, z, grande) { const q = this.nueva('chispa', x, y, z, grande ? 0.22 : 0.16); q.g = grande ? 1 : 0; q.c = ((x * 7) | 0) % 3; for (let i = 0; i < (grande ? 8 : 4); i++) { const b = this.nueva('brasa', x, y, z, 0.3 + Math.random() * 0.2); b.vx = (Math.random() - 0.5) * 220; b.vz = Math.random() * 160; } }
  bloqueo(x, y, z) { const q = this.nueva('bloqueo', x, y, z, 0.18); void q; for (let i = 0; i < 3; i++) { const b = this.nueva('brasa', x, y, z, 0.2); b.vx = (Math.random() - 0.5) * 120; b.vz = 40 + Math.random() * 80; } }
  polvo(x, y, n = 6) { for (let i = 0; i < n; i++) { const q = this.nueva('polvo', x + (Math.random() - 0.5) * 20, y + (Math.random() - 0.5) * 4, 2, 0.4 + Math.random() * 0.3); q.vx = (Math.random() - 0.5) * 60; q.vz = 10 + Math.random() * 20; } }
  humo(x, y, z, n = 1) { for (let i = 0; i < n; i++) { const q = this.nueva('humo', x + (Math.random() - 0.5) * 10, y, z, 0.9 + Math.random() * 0.6); q.vx = (Math.random() - 0.3) * 14; q.vz = 18 + Math.random() * 14; } }
  vidrios(x, y, z, c = '#5ab060') { for (let i = 0; i < 10; i++) { const q = this.nueva('vidrio', x, y, z, 0.7); q.vx = (Math.random() - 0.5) * 200; q.vz = 40 + Math.random() * 120; q.c = c; } }
  astillas(x, y, z, c = '#b52a2a') { for (let i = 0; i < 10; i++) { const q = this.nueva('vidrio', x, y, z, 0.8); q.vx = (Math.random() - 0.5) * 160; q.vz = 60 + Math.random() * 120; q.c = c; q.g = 1; } }
  fruta(x, y, z, c = '#f08a20') { for (let i = 0; i < 8; i++) { const q = this.nueva('fruta', x, y, z, 0.5); q.vx = (Math.random() - 0.5) * 160; q.vz = 30 + Math.random() * 110; q.c = i % 3 ? c : '#fff0c0'; } }
  agua(x, y, n = 14) { for (let i = 0; i < n; i++) { const q = this.nueva('gota', x + (Math.random() - 0.5) * 60, y, 10 + Math.random() * 30, 0.7); q.vx = (Math.random() - 0.5) * 180; q.vz = 80 + Math.random() * 200; q.c = Math.random() < 0.5 ? '#d8eef8' : '#a8c8e0'; } }
  explosion(x, y) { this.nueva('boom', x, y, 10, 0.45); for (let i = 0; i < 16; i++) { const b = this.nueva('brasa', x, y, 10, 0.5 + Math.random() * 0.3); b.vx = (Math.random() - 0.5) * 300; b.vz = Math.random() * 250; } this.polvo(x, y, 12); }
  aro(x, y) { this.nueva('aro', x, y, 30, 0.4); }
  flotante(x, y, z, txt, c = '#ffd040') { const q = this.nueva('txt', x, y, z, 0.9); q.txt = txt; q.c = c; q.vz = 30; }
  aviso(e, vida) { const q = this.nueva('aviso', e.x, e.y, 0, vida); q.e = e; }
  // ---- dibujo
  dibujar(x, C, Y) {
    const P = this.p;
    for (let i = 0; i < this.n; i++) {
      const p = P[i]; const px = Math.round(p.x - C), py = Math.round(p.y - p.z + Y); const k = p.t / p.vida;
      switch (p.k) {
        case 'chispa': { const s = chispaSprite(p.g, Math.min(5, (k * 6) | 0), p.c); x.drawImage(s, px - (s.width >> 1), py - (s.height >> 1)); break; }
        case 'bloqueo': { const s = bloqueoSprite(Math.min(3, (k * 4) | 0)); x.drawImage(s, px - (s.width >> 1), py - (s.height >> 1)); break; }
        case 'brasa': x.fillStyle = k < 0.5 ? '#ffe27a' : '#ff8a3a'; x.fillRect(px, py, 1, k < 0.3 ? 2 : 1); break;
        case 'vidrio': case 'fruta': x.fillStyle = p.c; x.fillRect(px, py, p.g ? 2 : 1, 2); break;
        case 'gota': x.fillStyle = p.c; x.fillRect(px, py, 1, 2); break;
        case 'polvo': { const s = polvoSprite(Math.min(4, (k * 5) | 0)); x.drawImage(s, px - (s.width >> 1), py - (s.height >> 1)); break; }
        case 'humo': { const s = humoSprite(Math.min(4, (k * 5) | 0)); x.drawImage(s, px - (s.width >> 1), py - (s.height >> 1)); break; }
        case 'txt': texto(x, p.txt, px, py - 6, p.c, 1, 'centro'); break;
        case 'aviso': { const e = p.e; if (!e || e.borrar || e.est !== 'ataca') { p.t = p.vida; break; } if (((p.t * 16) | 0) % 2 === 0) { const ex = Math.round(e.x - C), ey = Math.round(e.y - e.z + Y - e.sp.h + 2); x.fillStyle = '#1b1220'; x.fillRect(ex - 3, ey - 16, 6, 14); x.fillStyle = '#ff2a2a'; x.fillRect(ex - 2, ey - 15, 4, 8); x.fillRect(ex - 2, ey - 5, 4, 2); } break; }
        case 'boom': { const s = boomSprite(Math.min(5, (k * 6) | 0)); x.drawImage(s, px - (s.width >> 1), py - s.height + 6); break; }
        case 'aro': { const s = aroSprite(Math.min(5, (k * 6) | 0)); x.drawImage(s, px - (s.width >> 1), py - (s.height >> 1)); break; }
      }
    }
  }
}
// ---- sprites cacheados (se dibujan una vez; después es un drawImage por partícula)
const cache = new Map();
function memo(k, f) { let c = cache.get(k); if (!c) { c = f(); cache.set(k, c); } return c; }
// estrella de impacto: rayos naranjas, estrella amarilla y núcleo blanco (6 cuadros, 3 rotaciones)
function chispaSprite(g, fr, rot) {
  return memo('ch' + g + fr + rot, () => { const k = fr / 6; const r = Math.round((g ? 22 : 13) * (k < 0.25 ? 0.5 + k * 2 : 1)); const S = r * 2 + 8; const [cv, x] = lienzo(S, S); const cx = S >> 1, cy = S >> 1; const a = rot * 0.33;
    if (k < 0.5) { x.fillStyle = 'rgba(255,240,180,0.35)'; x.beginPath(); x.arc(cx, cy, r * 0.9, 0, 7); x.fill(); }
    for (let i = 0; i < 12; i++) { const an = a + i * Math.PI / 6; const L = i % 2 ? r * 0.55 : r * (i % 4 ? 0.85 : 1.15); x.fillStyle = k < 0.5 ? '#ff9a2a' : '#ffb84a';
      for (let s = r * 0.3; s < L; s += 1) { const w = s < L * 0.6 ? 2 : 1; x.fillRect(cx + Math.round(Math.cos(an) * s) - (w >> 1), cy + Math.round(Math.sin(an) * s) - (w >> 1), w, w); } }
    x.fillStyle = '#ffd040'; for (let i = 0; i < 8; i++) { const an = a + i * Math.PI / 4 + 0.2; const L = i % 2 ? r * 0.35 : r * 0.6; for (let s = 0; s < L; s += 1) x.fillRect(cx + Math.round(Math.cos(an) * s) - 1, cy + Math.round(Math.sin(an) * s) - 1, 3, 3); }
    if (k < 0.7) { x.fillStyle = '#fff6d0'; x.fillRect(cx - 4, cy - 4, 8, 8); x.fillStyle = '#ffffff'; x.fillRect(cx - 3, cy - 3, 6, 6); }
    return cv; });
}
function bloqueoSprite(fr) { return memo('bl' + fr, () => { const [cv, x] = lienzo(24, 24); const r = 5 + fr * 3; x.fillStyle = fr < 2 ? '#e8f4ff' : '#9ac0e0'; for (let a = 0; a < 6.28; a += 0.5) x.fillRect(12 + Math.round(Math.cos(a) * r), 12 + Math.round(Math.sin(a) * r), 2, 2); if (fr < 2) { x.fillStyle = '#ffffff'; x.fillRect(10, 10, 4, 4); } return cv; }); }
function polvoSprite(fr) { return memo('po' + fr, () => { const r = 2 + fr; const [cv, x] = lienzo(r * 2, r * 2); x.fillStyle = 'rgba(220,200,200,' + (0.5 * (1 - fr / 5)).toFixed(2) + ')'; x.fillRect(0, 0, r * 2, r * 2); return cv; }); }
function humoSprite(fr) { return memo('hu' + fr, () => { const r = 3 + fr * 2; const [cv, x] = lienzo(r * 2 + 2, r * 2 + 2); x.fillStyle = 'rgba(200,196,206,' + (0.42 * (1 - fr / 5)).toFixed(2) + ')'; x.beginPath(); x.arc(r + 1, r + 1, r, 0, 7); x.fill(); return cv; }); }
function boomSprite(fr) { return memo('bo' + fr, () => { const k = fr / 6; const r = Math.round(10 + k * 34); const [cv, x] = lienzo(r * 2 + 4, r * 2); x.fillStyle = k < 0.3 ? '#fff6c0' : k < 0.6 ? '#ffb040' : '#8a4a4a'; for (let i = -r; i <= r; i += 2) { const h = Math.round(Math.sqrt(r * r - i * i) * 0.8); x.fillRect(r + 2 + i, r * 2 - h * 2 - 4, 2, h * 2); } return cv; }); }
function aroSprite(fr) { return memo('ar' + fr, () => { const r = Math.round(10 + (fr / 6) * 70); const [cv, x] = lienzo(r * 2 + 4, Math.round(r * 0.7) + 4); x.fillStyle = '#ffffff'; for (let a = 0; a < 6.28; a += 0.12) x.fillRect(r + 2 + Math.round(Math.cos(a) * r), (cv.height >> 1) + Math.round(Math.sin(a) * r * 0.35), 2, 2); return cv; }); }
