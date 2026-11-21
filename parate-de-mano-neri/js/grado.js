// Gradación de color de personajes y objetos según la hora del nivel (más suave que la del escenario,
// para que se lean bien pero no "floten" sobre una calle de noche). Se calcula una vez por cuadro y se cachea.
import { GRADOS } from './escenarios/pincel.js';
import { lienzo } from './pixel.js';

const SUAVE = { atardecer: null, manana: 0.5, mediodia: 0.45, noche: 0.62, gris: 0.6, tormenta: 0.62 };
export function gradoSuave(hora) {
  const g = GRADOS[hora], k = SUAVE[hora]; if (!g || !k) return null;
  const m = (v, id) => id + (v - id) * k;
  const G = { mul: g.mul.map((v) => m(v, 1)), add: g.add.map((v) => m(v, 0)), sat: m(g.sat ?? 1, 1), gam: m(g.gam || 1, 1), clave: hora };
  G.lut = [0, 1, 2].map((c) => { const t = new Uint8ClampedArray(256); for (let v = 0; v < 256; v++) t[v] = Math.round(255 * Math.pow(Math.min(1, (v * G.mul[c] + G.add[c]) / 255), G.gam)); return t; });
  return G;
}
const PF = (globalThis.__pf || (globalThis.__pf = { gen: 0, grad: 0, sil: 0, txt: 0, set: 0, nGen: 0, nGrad: 0 })); // perfil: ms gastados en generar en caliente
function gradarCanvas(src, G) {
  const tG = performance.now(); const [cv, x] = lienzo(src.width, src.height); if (!src.width || !src.height) return cv; x.drawImage(src, 0, 0);
  const img = x.getImageData(0, 0, cv.width, cv.height), d = img.data, s = G.sat, L = G.lut;
  for (let i = 0; i < d.length; i += 4) { if (!d[i + 3]) continue; let r = d[i], g = d[i + 1], b = d[i + 2];
    if (s !== 1) { const l = 0.3 * r + 0.59 * g + 0.11 * b; r = l + (r - l) * s; g = l + (g - l) * s; b = l + (b - l) * s; r = r < 0 ? 0 : r > 255 ? 255 : r; g = g < 0 ? 0 : g > 255 ? 255 : g; b = b < 0 ? 0 : b > 255 ? 255 : b; }
    d[i] = L[0][r | 0]; d[i + 1] = L[1][g | 0]; d[i + 2] = L[2][b | 0]; }
  x.putImageData(img, 0, 0); PF.grad += performance.now() - tG; PF.nGrad++; return cv;
}
// cuadro de luchador gradado (mismo formato que el original: d, q, pies, mano, parche)
export function cuadroG(f, G) {
  if (!G) return f; const k = G.clave; const c = f._g || (f._g = {}); let r = c[k]; if (r) return r;
  r = { d: gradarCanvas(f.d, G), q: f.q, pies: f.pies, mano: f.mano, parche: f.parche ? { c: gradarCanvas(f.parche.c, G), x: f.parche.x, y: f.parche.y } : null };
  c[k] = r; return r;
}
// sprite de objeto ({d, i, w, h}) gradado
export function spriteG(s, G) {
  if (!G || !s) return s; const k = G.clave; const c = s._g || (s._g = {}); let r = c[k]; if (r) return r;
  r = { d: gradarCanvas(s.d, G), i: s.i ? gradarCanvas(s.i, G) : null, w: s.w, h: s.h }; c[k] = r; return r;
}
export function canvasG(cv, G) { if (!G || !cv) return cv; const c = cv._g || (cv._g = {}); return c[G.clave] || (c[G.clave] = gradarCanvas(cv, G)); }
// silueta de color (aura de mini jefe / tambor), cacheada por cuadro
export function silueta(f, color) {
  const c = f._s || (f._s = {}); let r = c[color]; if (r) return r;
  const tS = performance.now(); const [cv, x] = lienzo(f.d.width, f.d.height); x.drawImage(f.d, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = color; x.fillRect(0, 0, cv.width, cv.height); PF.sil += performance.now() - tS;
  r = { d: cv, q: f.q, pies: f.pies, parche: null }; c[color] = r; return r;
}
// al cambiar de nivel: soltar las copias gradadas de otras horas (memoria en el teléfono)
export function purgarGrado(sets, clave) {
  const lim = (f) => { if (f && f._g) for (const k in f._g) if (k !== clave) delete f._g[k]; };
  for (const sp of sets) {
    for (const k in sp.parciales) for (const f of sp.parciales[k]) lim(f);
    for (const k of Object.keys(sp.anims)) { const d = Object.getOwnPropertyDescriptor(sp.anims, k); if (d && 'value' in d) for (const f of d.value) lim(f); }
  }
}
