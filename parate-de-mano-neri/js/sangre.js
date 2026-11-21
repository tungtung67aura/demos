// Sangre y heridas: gotas con gravedad que caen y manchan, niebla roja, dientes y saliva, chorros arteriales,
// manchas en el piso (con perspectiva, se borran de a poco y la lluvia las lava), salpicaduras en la pared a la altura
// de los pies, salpicón en "la cámara" en los remates grandes, destello rojo en los bordes cuando estás hecho pomada,
// rastro de gotas y arrastre de cuerpos, y heridas sobre los sprites por etapas según la vida.
// Todo con pools fijos (sin crear objetos por cuadro) y sprites chicos cacheados por densidad y por hora (gradados).
// GORE.nivel: 2 = normal (a full), 1 = reducida, 0 = apagada (costo cero: no se llama nada).
import { PISO } from './escenario.js';
import { lienzo } from './pixel.js';
import { canvasG } from './grado.js';
// copia gradada: conserva el tamaño lógico (gw/gh) del sprite original
let idCal = 0;
// máscara de bits → lienzo (lienzo de trabajo reusado; sólo en un fallo de caché del recorte)
let mcv = null, mcx = null;
function mascaraCv(m) { if (!mcv || mcv.width < m.w || mcv.height < m.h) { [mcv, mcx] = lienzo(Math.max(m.w, mcv ? mcv.width : 0, 64), Math.max(m.h, mcv ? mcv.height : 0, 64)); }
  const img = mcx.createImageData(m.w, m.h), d = img.data, b = m.bits; for (let k = 0, n = m.w * m.h; k < n; k++) if (b[k >> 3] & (1 << (k & 7))) d[k * 4 + 3] = 255;
  mcx.clearRect(0, 0, mcv.width, mcv.height); mcx.putImageData(img, 0, 0); return mcv; } const REC = []; // cuadros con recortes de heridas cacheados (tope global)
function cG(cv, G) { const r = canvasG(cv, G); if (r !== cv && r.gw === undefined) { r.gw = cv.gw; r.gh = cv.gh; } return r; }
import { Q } from './sprites.js';

export const GORE = { nivel: 2 };
const NIVEL_TXT = ['APAGADA', 'REDUCIDA', 'NORMAL'];
export function textoGore() { return NIVEL_TXT[GORE.nivel]; }

const MAXG = 240, MAXN = 20, MAXM = 80, MAXCH = 48, MAXP = 16, MAXC = 3; // manchas grandes y gotitas en anillos separados (las gotitas no pisan los charcos)
const GRAV = 780;
// paleta: muy oscura, oscura, media, clara, brillo
const R = ['#4a060c', '#7a0c12', '#a8141a', '#d0281f', '#ff5a4a'];
const DIENTE = '#f4ecd8', SALIVA = '#e8b8b4';

// ---------------------------------------------------------------- utilidades de color (gradado por hora)
const cacheHex = new Map();
function hexG(c, G) {
  if (!G) return c; const k = G.clave + c; let r = cacheHex.get(k); if (r) return r;
  let rr = parseInt(c.slice(1, 3), 16), gg = parseInt(c.slice(3, 5), 16), bb = parseInt(c.slice(5, 7), 16);
  if (G.sat !== 1) { const l = 0.3 * rr + 0.59 * gg + 0.11 * bb; rr = l + (rr - l) * G.sat; gg = l + (gg - l) * G.sat; bb = l + (bb - l) * G.sat; }
  const cl = (v) => Math.max(0, Math.min(255, v | 0));
  r = '#' + [G.lut[0][cl(rr)], G.lut[1][cl(gg)], G.lut[2][cl(bb)]].map((v) => v.toString(16).padStart(2, '0')).join(''); cacheHex.set(k, r); return r;
}
let palSin = null;
// grado "legible" para la sangre: la noche la oscurece a medias (si no, de noche ni se ve); cacheado en G
function gS(G) { if (!G || G._esS) return G; if (G._gs) return G._gs; const m = (v, id) => id + (v - id) * 0.5;
  const H = { mul: G.mul.map((v) => m(v, 1)), add: G.add.map((v) => m(v, 0)), sat: Math.max(1, G.sat), gam: m(G.gam || 1, 1), clave: G.clave + '·s', _esS: true };
  H.lut = [0, 1, 2].map((c) => { const t = new Uint8ClampedArray(256); for (let v = 0; v < 256; v++) t[v] = Math.round(255 * Math.pow(Math.min(1, Math.max(0, v * H.mul[c] + H.add[c]) / 255), H.gam)); return t; });
  return (G._gs = H); }
function paleta(G) { G = gS(G); if (!G) return palSin || (palSin = [R[1], R[2], R[3], DIENTE, SALIVA]); return G._sangre || (G._sangre = [R[1], R[2], R[3], DIENTE, SALIVA].map((c) => hexG(c, G))); }
// generador determinista chico (las formas de las manchas salen siempre iguales por variante)
function rnd(seed) { let s = (seed * 2654435761) >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

// ---------------------------------------------------------------- sprites cacheados (densidad Q)
const spr = new Map();
function memo(k, f) { const kk = Q + ':' + k; let c = spr.get(kk); if (!c) { c = f(); spr.set(kk, c); } return c; }
// pinta "píxeles del juego" (bloques de Q subpíxeles) sobre un lienzo a densidad Q
function pinta(w, h, fn) { const [cv, x] = lienzo(Math.max(1, w * Q), Math.max(1, h * Q)); const px = (X, Y, c, a = 1) => { if (X < 0 || Y < 0 || X >= w || Y >= h) return; x.globalAlpha = a; x.fillStyle = c; x.fillRect(X * Q, Y * Q, Q, Q); }; fn(px, x); x.globalAlpha = 1; cv.gw = w; cv.gh = h; return cv; }
// mancha de piso aplastada por la perspectiva (alto ≈ 0,45 del ancho). s: 0 gota, 1 chica, 2 salpicón, 3 charco, 4 arrastre
function manchaSp(s, v) {
  return memo('m' + s + '_' + v, () => {
    const r = rnd(v * 31 + s * 7 + 3);
    const W = [4, 9, 18, 34, 20][s], H = [2, 4, 8, 13, 5][s];
    return pinta(W, H, (px) => {
      const cx = W / 2, cy = H / 2;
      if (s === 4) { // arrastre: franja con bordes cortados y vetas
        for (let x = 0; x < W; x++) { const k = x / W; const hh = Math.max(1, Math.round(H * (0.5 + 0.5 * Math.sin(k * 3 + v)) * (k < 0.15 ? k / 0.15 : 1))); const y0 = Math.round(cy - hh / 2 + (r() - 0.5));
          for (let y = y0; y < y0 + hh; y++) px(x, y, y === y0 ? R[2] : (x + y + v) % 5 === 0 ? R[2] : R[1], k < 0.2 ? 0.6 : 0.9); }
        return;
      }
      // cuerpo: elipse irregular
      const rx = W / 2 - (s >= 2 ? 3 : 0.5), ry = H / 2 - (s >= 2 ? 1.2 : 0.3);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry; const a = Math.atan2(dy, dx); const borde = 1 + 0.22 * Math.sin(a * 3 + v) + 0.12 * Math.sin(a * 5 + v * 2);
        const d = dx * dx + dy * dy; if (d < borde * borde) px(x, y, d < 0.3 * borde ? (s === 3 ? R[0] : R[1]) : d > 0.75 * borde * borde ? R[2] : R[1]);
      }
      if (s >= 1) { px(Math.round(cx - rx * 0.3), Math.round(cy - ry * 0.4), R[3]); if (s >= 2) px(Math.round(cx + rx * 0.2), Math.round(cy - ry * 0.5), R[4], 0.8); }
      // gotitas satélite alrededor (salpicón)
      if (s === 2 || s === 3) for (let i = 0; i < (s === 2 ? 7 : 5); i++) { const a = r() * 6.28, d = 1.05 + r() * 0.5; const X = Math.round(cx + Math.cos(a) * rx * d), Y = Math.round(cy + Math.sin(a) * ry * d); px(X, Y, R[1]); if (r() < 0.4) px(X + (Math.cos(a) > 0 ? 1 : -1), Y, R[2], 0.8); }
    });
  });
}
// salpicón direccional en píxeles duros (sin degradés ni bordes suaves): núcleo irregular en el punto de impacto,
// rayos afinados hacia la dirección del golpe que terminan en gota, gotas satélite y chorreaduras que bajan con cuenta al final.
// (ix, iy) impacto; L largo de los rayos; n rayos; abre: apertura del abanico (rad); cae: largo máx. de chorreadura
function salpicon(px, r, ix, iy, rc, L, n, abre, cae, gotas) {
  for (let y = -rc - 1; y <= rc + 1; y++) for (let x = -rc - 1; x <= rc + 1; x++) { const d = Math.hypot(x, y * 1.15), lim = rc + Math.sin(Math.atan2(y, x) * 3 + rc) * 0.9 + (x > 0 ? 0.8 : 0);
    if (d <= lim) px(ix + x, iy + y, d < lim * 0.45 ? COAG : d > lim - 1 ? R[2] : R[1]); }
  for (let k = 0; k < n; k++) { const a = (r() - 0.5) * abre * 2 + (r() - 0.5) * 0.2, l = L * (0.45 + r() * 0.55), cs = Math.cos(a), sn = Math.sin(a);
    let ex = ix, ey = iy; for (let t = rc * 0.6; t < l; t += 0.7) { const X = Math.round(ix + cs * t), Y = Math.round(iy + sn * t); ex = X; ey = Y; px(X, Y, t > l * 0.75 ? R[2] : R[1]); if (t < l * 0.45) px(X, Y + 1, R[1]); }
    px(ex + Math.sign(cs), ey, FRESCA); px(ex + Math.sign(cs), ey + 1, R[1]); px(ex + 2 * Math.sign(cs), ey, R[2]); }
  for (let i = 0; i < gotas; i++) { const a = (r() - 0.5) * abre * 2.4, t = L * (0.5 + r() * 0.8); const X = Math.round(ix + Math.cos(a) * t), Y = Math.round(iy + Math.sin(a) * t); px(X, Y, r() < 0.5 ? R[1] : R[2]); if (r() < 0.35) px(X - Math.sign(Math.cos(a)), Y, R[1]); }
  for (let k = 0; k < Math.max(1, Math.round(cae / 4)); k++) { const X = Math.round(ix - rc * 0.5 + r() * (rc + L * 0.5)); const l = Math.round(cae * (0.35 + r() * 0.65)); let y0 = iy;
    for (let y = y0; y < y0 + l; y++) px(X, y, y > y0 + l - 3 ? COAG : R[1]); px(X, y0 + l, COAG); px(X + 1, y0 + l - 1, R[0]); }
  px(ix - 1, iy - 1, BRILLO); px(ix + 1, iy - 1, FRESCA);
}
// salpicadura en la pared detrás del golpe: tam 0 = gota que pega, 1 = salpicón de golpe pesado. Mirando a la derecha (esp: espejada)
function paredSp(v, tam, esp) {
  return memo('p' + v + '_' + tam + (esp ? 'i' : 'd'), () => { const r = rnd(v * 17 + tam * 5 + 5); const W = tam ? 26 : 10, H = tam ? 22 : 12;
    const cv = pinta(W, H, (px) => { if (tam) salpicon(px, r, 5, 7, 2, 18, 6, 0.45, 13, 6); else salpicon(px, r, 3, 3, 1, 6, 2, 0.35, 7, 1); });
    if (!esp) return cv; const [m, x] = lienzo(cv.width, cv.height); x.translate(cv.width, 0); x.scale(-1, 1); x.drawImage(cv, 0, 0); m.gw = cv.gw; m.gh = cv.gh; return m; });
}
// salpicón "en la cámara" (remates grandes): mismo dibujo de píxeles duros, más grande; se dibuja a escala entera (×2)
function camaraSp(v, esp) {
  return memo('c' + v + (esp ? 'i' : 'd'), () => { const r = rnd(v * 13 + 11); const W = 54, H = 46;
    const cv = pinta(W, H, (px) => { salpicon(px, r, 9, 14, 4, 38, 9, 0.55, 28, 10); salpicon(px, r, 22 + Math.round(r() * 8), 9 + Math.round(r() * 6), 2, 14, 4, 0.5, 12, 3); });
    if (!esp) return cv; const [m, x] = lienzo(cv.width, cv.height); x.translate(cv.width, 0); x.scale(-1, 1); x.drawImage(cv, 0, 0); m.gw = cv.gw; m.gh = cv.gh; return m; });
}
// niebla roja (5 cuadros que se abren y se apagan)
function nieblaSp(fr) { return memo('n' + fr, () => { const r0 = 3 + fr * 2; const W = r0 * 2 + 2; return pinta(W, W, (px) => { const rr = rnd(fr + 1); for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { const d = Math.hypot(x - W / 2, y - W / 2); if (d < r0 && rr() < 0.55 * (1 - fr / 6)) px(x, y, rr() < 0.5 ? R[2] : R[1], 0.55 * (1 - fr / 5)); } }); }); }
// viñeta roja de los bordes (una por tamaño de pantalla)
let vin = null, vinK = '';
function vineta(W, H) {
  const k = W + 'x' + H; if (vinK === k) return vin; vinK = k; const [cv, x] = lienzo(W, H);
  const g1 = x.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.hypot(W, H) * 0.52); g1.addColorStop(0, 'rgba(120,0,8,0)'); g1.addColorStop(0.45, 'rgba(160,8,14,0.5)'); g1.addColorStop(1, 'rgba(100,0,8,0.95)');
  x.fillStyle = g1; x.fillRect(0, 0, W, H); vin = cv; return cv;
}

// ---------------------------------------------------------------- heridas sobre el sprite
// etapa por vida: 0 sano, 1 moretones y cortes, 2 cara sangrando, 3 ropa empapada, 4 hecho pomada
export function etapa(o) { const k = o.hp / o.hpMax; return k > 0.8 ? 0 : k > 0.6 ? 1 : k > 0.4 ? 2 : k > 0.2 ? 3 : 4; }
// colores de herida: coágulo casi negro, sangre, sangre fresca y brillo húmedo; moretón violeta
const COAG = '#38040a', FRESCA = '#e0221c', BRILLO = '#ff6a52', MOR1 = '#4e2a48', MOR2 = '#7c4a68';
// decal de cara: coordenadas relativas a la cabeza (centro), mirando a la derecha; r = radio de la cabeza en px del juego.
// Se recorta a la piel del cráneo de cada cuadro (no pinta pelo, gorro ni el puño que tapa la cara)
function caraSp(st, r, esp) {
  return memo('h' + st + '_' + r + (esp ? 'i' : 'd'), () => { const W = r * 2 + 4, H = r * 2 + 8, cx = r + 2, cy = r + 2;
    const cv = pinta(W, H, (px) => { const P = (u, v, c, a = 1) => px(Math.round(cx + u * r), Math.round(cy + v * r), c, a);
      const lin = (u, v0, v1, w, cA, cB) => { const y0 = Math.round(cy + v0 * r), y1 = Math.round(cy + v1 * r), X = Math.round(cx + u * r); for (let y = y0; y <= y1; y++) for (let i = 0; i < w; i++) px(X + i, y, y >= y1 - 1 ? cB : cA); };
      // 1: moretón en el pómulo, ceja cortada y comisura partida
      if (st >= 1) { P(0.1 + 1 / r, 0.15, MOR1); P(0.1 + 2 / r, 0.15, MOR2); P(0.1, 0.15 + 1 / r, MOR2); P(0.1 + 1 / r, 0.15 + 1 / r, MOR1); P(0.1 + 2 / r, 0.15 + 1 / r, MOR1); P(0.1 + 1 / r, 0.15 + 2 / r, MOR2);
        P(0.4, -0.38, FRESCA); P(0.4 + 1 / r, -0.38, BRILLO); P(0.4, -0.38 + 1 / r, COAG); P(0.55, 0.55, COAG); P(0.55 + 1 / r, 0.55, FRESCA); }
      // 2: la nariz sangra hasta el mentón (chorro de 2 px: fresca arriba, coágulo abajo), labio partido, gota en el mentón
      if (st >= 2) { lin(0.6, 0.12, 0.78, 2, R[2], COAG); P(0.6, 0.12, BRILLO); P(0.6 + 1 / r, 0.35, FRESCA); P(0.45, 0.55, R[1]); P(0.62, 0.92, COAG); P(0.28, -0.12, MOR1); P(0.28 + 1 / r, -0.12, MOR2); }
      // 3: ceja abierta que chorrea al costado del ojo, mejilla embarrada, ojo hinchado
      if (st >= 3) { lin(0.3, -0.36, 0.42, 2, R[1], COAG); P(0.3, -0.36, BRILLO); P(0.3 + 1 / r, -0.2, FRESCA);
        for (let j = 0; j < 2; j++) for (let i = 0; i < 3; i++) P(-0.05 + i / r, 0.38 + j / r, (i + j) % 2 ? R[1] : COAG);
        P(0.45, -0.18, MOR1); P(0.45, -0.18 + 1 / r, MOR2); P(-0.15, -0.5, R[2]); P(-0.15 + 1 / r, -0.5, COAG); }
      // 4: media cara cubierta de sangre, con brillos húmedos
      if (st >= 4) { for (let v = -0.4; v <= 0.95; v += 1 / r) for (let u = -0.1; u <= 0.85; u += 1 / r) { const n = Math.sin(u * 23.1 + v * 41.7) * 0.5 + Math.sin(u * 9.3 - v * 13.9) * 0.5;
          const e = ((u - 0.5) / 0.32) ** 2 + ((v - 0.3) / 0.6) ** 2; if (e > 1 + n * 0.35) continue; if (u > 0.3 && u < 0.58 && v > -0.24 && v < -0.02) continue; // el ojo queda a la vista
          P(u, v, e > 0.8 + n * 0.3 ? R[2] : n > 0.5 ? COAG : n < -0.7 ? FRESCA : R[1], 1); }
        P(0.5, 0.05, BRILLO); P(0.62, 0.45, BRILLO); P(0.38, 0.7, BRILLO); P(-0.3, 0.15, R[2]); P(-0.3, 0.15 + 1 / r, COAG); }
    });
    if (!esp) return cv; const [m, x] = lienzo(cv.width, cv.height); x.translate(cv.width, 0); x.scale(-1, 1); x.drawImage(cv, 0, 0); m.gw = cv.gw; m.gh = cv.gh; return m; });
}
// decal de torso: la remera se empapa desde el cuello hacia abajo. Ancho de sobra: se recorta a la remera del cuadro
// (máscara de capa del esqueleto), así nunca pinta el brazo que cruza el pecho ni se sale en los flacos
function torsoSp(st, r, esp) {
  return memo('t' + st + '_' + r + (esp ? 'i' : 'd'), () => { const W = r * 3 + 2, H = Math.round(r * 3.4) + 2, cx = Math.round(W / 2), cy = 0; const rr = rnd(st * 7 + r);
    const cv = pinta(W, H, (px) => {
      // 2: chorreaduras desde el cuello
      if (st >= 2) { for (let k = 0; k < 3; k++) { const X = cx - 2 + k * 2 + (k === 2 ? 1 : 0); const L = 3 + Math.round(rr() * r * 0.5) + k; for (let y = 0; y < L; y++) px(X, cy + y, y === 0 ? FRESCA : y >= L - 1 ? COAG : R[1]); }
        px(cx - 1, cy, BRILLO); }
      // 3: babero empapado (borde irregular, núcleo oscuro, brillos)
      if (st >= 3) { const bh = Math.round(r * 1.5); for (let y = 0; y < bh; y++) { const k = y / bh; const lim = r * (0.75 - k * 0.35) + Math.sin(y * 1.9 + r) * 1.2;
          for (let x = -Math.round(lim); x <= Math.round(lim); x++) { const e = Math.abs(x) >= lim - 1; px(cx + x, cy + y, e ? R[1] : k < 0.45 ? COAG : rr() < 0.12 ? R[2] : R[1]); } }
        for (let k = 0; k < 3; k++) { const X = cx - Math.round(r * 0.4) + k * Math.round(r * 0.4); for (let y = bh; y < bh + 2 + Math.round(rr() * r * 0.6); y++) px(X, cy + y, R[1]); px(X, cy + bh + 3 + Math.round(r * 0.3), COAG); }
        for (let i = 0; i < 4; i++) px(cx - 2 + Math.round(rr() * 4), cy + 1 + Math.round(rr() * bh * 0.7), BRILLO); }
      // 4: empapado hasta la panza, salpicones a los costados
      if (st >= 4) { const y0 = Math.round(r * 1.2), bh = Math.round(r * 1.6); for (let y = 0; y < bh; y++) { const lim = r * 0.9 * (1 - Math.abs(y / bh - 0.4)) + Math.sin(y * 2.3) * 1.3;
          for (let x = -Math.round(lim); x <= Math.round(lim); x++) px(cx + x + 1, cy + y0 + y, Math.sin(x * 1.3 + y * 0.9) > 0.6 ? COAG : R[1]); }
        for (let i = 0; i < 10; i++) { const X = cx + Math.round((rr() - 0.5) * r * 2.6), Y = cy + Math.round(rr() * r * 3); px(X, Y, rr() < 0.5 ? R[1] : COAG); if (rr() < 0.4) px(X, Y - 1, FRESCA); }
        for (let i = 0; i < 4; i++) px(cx - 3 + Math.round(rr() * 6), cy + y0 + Math.round(rr() * bh), BRILLO); }
    });
    if (!esp) return cv; const [m, x] = lienzo(cv.width, cv.height); x.translate(cv.width, 0); x.scale(-1, 1); x.drawImage(cv, 0, 0); m.gw = cv.gw; m.gh = cv.gh; return m; });
}

// ---------------------------------------------------------------- el sistema
export class Sangre {
  constructor(g) {
    this.g = g;
    this.go = []; for (let i = 0; i < MAXG; i++) this.go.push({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, t: 0, vida: 0, s: 0, k: 0, c: 0 }); this.ng = 0;
    this.ni = []; for (let i = 0; i < MAXN; i++) this.ni.push({ x: 0, y: 0, z: 0, vx: 0, vz: 0, t: 0, vida: 0 }); this.nn = 0;
    this.ma = []; for (let i = 0; i < MAXM + MAXCH; i++) this.ma.push({ on: false, x: 0, y: 0, s: 0, v: 0, t: 0, vida: 0, crece: 0, dir: 1 }); this.im = 0; this.ich = 0;
    this.pa = []; for (let i = 0; i < MAXP; i++) this.pa.push({ on: false, x: 0, ys: 0, dir: 1, tam: 1, v: 0, t: 0, vida: 0 }); this.ip = 0;
    this.ca = []; for (let i = 0; i < MAXC; i++) this.ca.push({ on: false, u: 0, v: 0, s: 0, t: 0, vida: 0 }); this.ic = 0;
    this.flash = 0; // destello rojo del borde (al recibir un golpe con poca vida)
  }
  get on() { return GORE.nivel > 0; }
  get k() { return GORE.nivel === 2 ? 1 : 0.4; }
  // ---- pools
  gota(x, y, z, vx, vy, vz, s, k = 0) { if (this.ng >= MAXG) return null; const q = this.go[this.ng++]; q.x = x; q.y = y; q.z = z; q.vx = vx; q.vy = vy; q.vz = vz; q.t = 0; q.vida = 2.5; q.s = s; q.k = k; q.c = (Math.random() * 3) | 0; return q; }
  niebla(x, y, z, vx) { if (this.nn >= MAXN) return; const q = this.ni[this.nn++]; q.x = x; q.y = y; q.z = z; q.vx = vx; q.vz = 10 + Math.random() * 16; q.t = 0; q.vida = 0.5 + Math.random() * 0.3; }
  mancha(x, y, s, vida = 26, dir = 1, crece = 0) {
    if (s === 1 || s === 2) { // gota que cae sobre una mancha fresca: la engorda en vez de gastar otra (las manchas duran más)
      for (let k = 1; k <= 20; k++) { const o = this.ma[(this.im - k + MAXM) % MAXM]; if (!o.on || o.s > 3 || o.s === 0) continue;
        if (Math.abs(o.x - x) < 8 && Math.abs(o.y - y) < 4) { if (o.s < 2 && s === 2) o.s = 2; if (o.t > 2) o.t = 2; return o; } } }
    let m; if (s === 0) { m = this.ma[MAXM + this.ich]; this.ich = (this.ich + 1) % MAXCH; } else { m = this.ma[this.im]; this.im = (this.im + 1) % MAXM; } // anillos: si está lleno pisa la más vieja de su tamaño
    m.on = true; m.x = x; m.y = Math.max(PISO.arriba + 1, Math.min(PISO.abajo + 4, y)); m.s = s; m.v = (Math.random() * 6) | 0; m.t = 0; m.vida = vida * (GORE.nivel === 2 ? 1 : 0.5); m.crece = crece; m.dir = dir; return m;
  }
  pared(x, ys, dir, tam = 1) { if (GORE.nivel < 2) return; const p = this.pa[this.ip]; this.ip = (this.ip + 1) % MAXP; p.on = true; p.x = x + (Math.random() - 0.5) * 8; p.ys = Math.max(PISO.arriba - 44, Math.min(PISO.arriba - 4, ys + (Math.random() - 0.5) * 8)); p.dir = dir < 0 ? -1 : 1; p.tam = tam; p.v = (Math.random() * 4) | 0; p.t = 0; p.vida = 30; }
  camara(fuerte, lado) { if (GORE.nivel < 2) return; const c = this.ca[this.ic]; this.ic = (this.ic + 1) % MAXC; c.on = true; const izqP = lado === undefined ? Math.random() < 0.5 : lado < 0; c.u = izqP ? Math.random() * 0.03 : 0.97 + Math.random() * 0.03; c.v = 0.42 + Math.random() * 0.3; c.s = (Math.random() * 3) | 0; c.t = 0; c.vida = fuerte ? 2.2 : 1.6; }
  limpiar() { this.ng = 0; this.nn = 0; for (const m of this.ma) m.on = false; for (const p of this.pa) p.on = false; for (const c of this.ca) c.on = false; this.flash = 0; }

  // ---- emisores de alto nivel
  // golpe: tipo 0 piña, 1 patada/rodilla, 2 pesado (tumba / gancho), 3 arma contundente, 4 corte (faca, vidrio), 5 especial
  golpe(o, por, x, y, z, tipo, dmg, cara) {
    if (!this.on || !o.hpMax) return;
    const dir = por ? (Math.sign(o.x - por.x) || por.cara || 1) : -(o.cara || 1); const K = this.k;
    const n = Math.round([6, 8, 16, 14, 18, 22][tipo] * K * (0.7 + Math.min(1.2, dmg / 12)));
    const vel = [90, 110, 180, 150, 230, 200][tipo];
    for (let i = 0; i < n; i++) {
      const arterial = (tipo === 2 || tipo === 4 || tipo === 5) && i < n * 0.6; // chorro con dirección (arco), el resto se abre
      const vx = arterial ? dir * (vel * (0.55 + (i / n) * 0.9)) : dir * vel * (0.15 + Math.random() * 0.7) + (Math.random() - 0.5) * 70;
      const vz = arterial ? 70 + (i / n) * 110 + Math.random() * 20 : 40 + Math.random() * (tipo >= 2 ? 170 : 110);
      this.gota(x + (Math.random() - 0.5) * 4, y + (Math.random() - 0.5) * 3, z, vx, (Math.random() - 0.5) * (tipo >= 2 ? 50 : 26), vz, tipo === 4 ? 3 : arterial || Math.random() < 0.3 ? 2 : 1);
    }
    if (tipo >= 2 && GORE.nivel === 2) { const m = tipo === 5 ? 3 : 2; for (let i = 0; i < m; i++) this.niebla(x + dir * (4 + i * 5), y, z + (Math.random() - 0.5) * 6, dir * (30 + Math.random() * 40)); }
    // dientes y saliva en los golpes fuertes a la cara
    if (cara && (tipo === 2 || tipo === 5) && GORE.nivel === 2) {
      if (Math.random() < 0.45) for (let i = 0; i < 1 + (Math.random() < 0.3); i++) this.gota(x, y, z + 2, dir * (80 + Math.random() * 90), (Math.random() - 0.5) * 30, 120 + Math.random() * 90, 2, 1);
      for (let i = 0; i < 4; i++) this.gota(x, y, z + 1, dir * (60 + Math.random() * 120), (Math.random() - 0.5) * 20, 50 + Math.random() * 80, 1, 2);
    }
    // contra la pared si el que cobra está pegado al fondo
    if (tipo >= 2 && o.y < PISO.arriba + 20 && GORE.nivel === 2) this.pared(o.x + dir * 3, o.y - z, dir, 1);
    // marca la herida donde pegó (cara o cuerpo)
    if (cara) o.herC = (o.herC || 0) + 1; else o.herT = (o.herT || 0) + 1;
    if (o.equipo === 'j') this.flash = Math.max(this.flash, o.hp / o.hpMax < 0.35 ? 0.9 : 0.35);
  }
  // remate: explosión grande, charco bajo el cuerpo y (si es grande) salpicón en la cámara
  ko(o, por, grande) {
    if (!this.on) return; const z = (o.sp ? o.sp.h : 40) * 0.6, dir = por ? (Math.sign(o.x - por.x) || 1) : 1, K = this.k;
    for (let i = 0; i < Math.round(30 * K); i++) this.gota(o.x, o.y, z, dir * (40 + Math.random() * 220) + (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 40, 60 + Math.random() * 200, Math.random() < 0.5 ? 2 : 1);
    if (GORE.nivel === 2) for (let i = 0; i < 3; i++) this.niebla(o.x + dir * i * 6, o.y, z, dir * (20 + i * 25));
    o.charco = 0.7; // el charco aparece cuando el cuerpo toca el piso
    if (grande) this.camara(true, (o.x - this.g.cam) < this.g.vista.w / 2 ? -1 : 1);
  }
  // el que se cura: la herida se limpia (destellos claros)
  limpieza(o, fx) { if (!fx) return; for (let i = 0; i < 10; i++) { const q = fx.nueva('gota', o.x + (Math.random() - 0.5) * 22, o.y, 10 + Math.random() * 40, 0.6); q.vx = (Math.random() - 0.5) * 50; q.vz = 40 + Math.random() * 60; q.c = i % 2 ? '#fff6d0' : '#d8eef8'; } fx.nueva('aro', o.x, o.y, 30, 0.35); }

  // ---- paso
  paso(dt) {
    if (!this.on) return; const g = this.g, lluvia = g.ev && g.ev.lluvia;
    const G = this.go; let i = 0;
    while (i < this.ng) { const q = G[i]; q.t += dt;
      q.x += q.vx * dt; q.y += q.vy * dt; q.vz -= GRAV * dt; q.z += q.vz * dt;
      let fin = q.t >= q.vida;
      if (!fin && q.y < PISO.arriba - 3 && q.z > 3 && q.k === 0) { this.pared(q.x, q.y - q.z, q.vx, 0); fin = true; } // contra la pared
      if (!fin && q.z <= 0) {
        if (q.k === 1 && q.vz < -60) { q.z = 0; q.vz = -q.vz * 0.35; q.vx *= 0.5; } // el diente rebota una vez
        else { if (q.k === 1) this.mancha(q.x, q.y, 0, 40).v = 9; else if (q.k === 0 && (GORE.nivel === 2 || Math.random() < 0.5)) this.mancha(q.x, q.y, q.s >= 2 ? (Math.random() < 0.35 ? 2 : Math.random() < 0.4 ? 1 : 0) : 0, q.s >= 2 ? 26 : 16); fin = true; }
      }
      if (fin) { this.ng--; G[i] = G[this.ng]; G[this.ng] = q; continue; } i++; }
    const N = this.ni; i = 0;
    while (i < this.nn) { const q = N[i]; q.t += dt; if (q.t >= q.vida) { this.nn--; N[i] = N[this.nn]; N[this.nn] = q; continue; } q.x += q.vx * dt; q.vx *= 0.92; q.z += q.vz * dt; i++; }
    const lav = lluvia ? 3.5 : 1;
    for (const m of this.ma) if (m.on) { m.t += dt * lav; if (m.t >= m.vida) m.on = false; }
    for (const p of this.pa) if (p.on) { p.t += dt * lav; if (p.t >= p.vida) p.on = false; }
    for (const c of this.ca) if (c.on) { c.t += dt; if (c.t >= c.vida) c.on = false; }
    if (this.flash > 0) this.flash -= dt * 1.4;
    // rastros: gotas de los que van heridos, arrastre de los que caen, charcos de los KO, sangrado por corte
    for (const e of g.ents) {
      if (!e.hpMax) continue; const st = etapa(e);
      if (e.charco > 0 && e.est === 'piso' && e.z < 1) { e.charco = 0; this.mancha(e.x, e.y + 1, 3, 40, 1, 1.4); }
      const herido = st >= 3 || e.sangra > 0;
      if (herido) { e.tGota = (e.tGota || 0) - dt; if (e.tGota <= 0) { e.tGota = e.sangra > 0 ? 0.22 : (st >= 4 ? 0.3 : 0.55) / (GORE.nivel === 2 ? 1 : 0.5); if (e.est !== 'piso') this.gota(e.x + (Math.random() - 0.5) * 8, e.y, (e.sp ? e.sp.h : 40) * (0.4 + Math.random() * 0.2), (e.vx || 0) * 0.3, 0, 0, 1); } }
      if (st >= 2 && (e.est === 'vuela' || e.est === 'piso') && e.z < 2 && Math.abs(e.vx) > 30) { const d = e.x - (e.uArr || -1e9); if (Math.abs(d) > 12) { e.uArr = e.x; this.mancha(e.x - Math.sign(e.vx) * 6, e.y, 4, 24, Math.sign(e.vx)); } }
    }
  }

  // precalienta todos los sprites de sangre (y sus copias gradadas) al empezar el nivel: nada se genera en caliente en la pelea
  calentar(G) { const Gs = gS(G); paleta(G);
    for (let a = 0; a < 5; a++) for (let v = 0; v < 6; v++) cG(manchaSp(a, v), Gs);
    for (let v = 0; v < 4; v++) for (let t = 0; t < 2; t++) for (const e of [false, true]) cG(paredSp(v, t, e), Gs); for (let v = 0; v < 3; v++) for (const e of [false, true]) cG(camaraSp(v, e), G); for (let f = 0; f < 5; f++) cG(nieblaSp(f), Gs); dienteSp();
    for (let r = 5; r <= 10; r++) for (const e of [false, true]) { for (let st = 1; st <= 4; st++) cG(caraSp(st, r, e), G); for (let st = 2; st <= 4; st++) cG(torsoSp(st, r, e), G); } }

  // ---- dibujo
  // capa del piso: manchas y salpicaduras de pared (antes de sombras y personajes)
  piso(x, C, Y, W, G) { G = gS(G); this.presR = 2;
    if (!this.on) return;
    for (const p of this.pa) { if (!p.on || p.x < C - 30 || p.x > C + W + 30) continue; const s = cG(paredSp(p.v, p.tam, p.dir < 0), G); const ix = p.tam ? 5 : 3, iy = p.tam ? 7 : 3; x.globalAlpha = p.t > p.vida * 0.75 ? Math.max(0, 1 - (p.t - p.vida * 0.75) / (p.vida * 0.25)) : 1; x.drawImage(s, Math.round(p.x - C - (p.dir < 0 ? s.gw - 1 - ix : ix)), Math.round(Y + p.ys - iy), s.gw, s.gh); }
    for (const m of this.ma) { if (!m.on || m.x < C - 30 || m.x > C + W + 30) continue;
      const s = m.v === 9 ? dienteSp() : cG(manchaSp(m.s, m.v), G); const fade = m.t > m.vida * 0.65 ? 1 - (m.t - m.vida * 0.65) / (m.vida * 0.35) : 1;
      x.globalAlpha = Math.max(0, fade) * (this.g.ev && this.g.ev.lluvia ? 0.78 : 0.95);
      let w = s.gw, h = s.gh; if (m.crece) { const k = Math.min(1, 0.35 + m.t / m.crece * 0.65); w = Math.round(w * k); h = Math.max(1, Math.round(h * k)); }
      if (m.dir < 0) { x.save(); x.translate(Math.round(m.x - C), 0); x.scale(-1, 1); x.drawImage(s, -Math.round(w / 2), Math.round(m.y + Y - h / 2), w, h); x.restore(); }
      else x.drawImage(s, Math.round(m.x - C - w / 2), Math.round(m.y + Y - h / 2), w, h); }
    x.globalAlpha = 1;
    this.gotas(x, C, Y, G, true);
  }
  // gotas y niebla en el aire (encima de los personajes)
  aire(x, C, Y, G) { G = gS(G);
    if (!this.on) return;
    for (let i = 0; i < this.nn; i++) { const q = this.ni[i]; const s = cG(nieblaSp(Math.min(4, (q.t / q.vida * 5) | 0)), G); x.drawImage(s, Math.round(q.x - C - s.gw / 2), Math.round(q.y - q.z + Y - s.gh / 2), s.gw, s.gh); }
    this.gotas(x, C, Y, G, false);
  }
  // gotas: las que van casi a ras del piso (z < 8) se dibujan con el piso, debajo de los personajes (nunca tapan los pies
  // de alguien que está adelante); las que vuelan, encima
  gotas(x, C, Y, G, bajo) {
    const P = paleta(G), c0 = P[0], c1 = P[1], c2 = P[2], cd = P[3], cs = P[4];
    for (let i = 0; i < this.ng; i++) { const q = this.go[i]; if ((q.z < 8) !== bajo) continue; const px = Math.round(q.x - C), py = Math.round(q.y - q.z + Y);
      if (q.k === 1) { x.fillStyle = cd; x.fillRect(px, py, 2, 2); x.fillStyle = c0; x.fillRect(px + 1, py + 1, 1, 1); continue; }
      if (q.k === 2) { x.fillStyle = cs; x.fillRect(px, py, 1, 1); continue; }
      x.fillStyle = q.c === 0 ? c0 : q.c === 1 ? c1 : c2;
      if (q.s >= 3) { const L = Math.min(4, 1 + Math.abs(q.vx) / 80) | 0; x.fillRect(q.vx > 0 ? px - L : px, py, L + 1, 1); } // estela del corte
      else if (q.s === 2) { x.fillRect(px, py, 2, 2); } else x.fillRect(px, py, 1, q.vz < -80 ? 2 : 1);
    }
  }
  // capas de pantalla (debajo del HUD): salpicón en la cámara y borde rojo cuando estás hecho pomada
  pantalla(x, W, H, G) {
    if (!this.on) return;
    for (const c of this.ca) { if (!c.on) continue; const der = c.u > 0.5; const s = cG(camaraSp(c.s, der), G); const k = c.t / c.vida; x.globalAlpha = k < 0.7 ? 1 : Math.max(0, 1 - (k - 0.7) / 0.3); const sc = 2, ix = der ? s.gw - 1 - 9 : 9; x.drawImage(s, Math.round(c.u * W) - ix * sc, Math.round(c.v * H) - 14 * sc, s.gw * sc, s.gh * sc); }
    x.globalAlpha = 1;
    const j = this.g.j; const bajo = j && j.hpMax && j.hp > 0 && j.hp / j.hpMax < 0.3;
    const a = Math.max(this.flash, bajo ? 0.5 + 0.2 * Math.sin(this.g.t * 6) : 0);
    if (a > 0.01) { x.globalAlpha = Math.min(1, a) * (GORE.nivel === 2 ? 1 : 0.6); x.drawImage(vineta(W, H), 0, 0); x.globalAlpha = 1; }
  }
  // heridas encima del cuadro del personaje (f0: cuadro sin gradar, con las anclas del esqueleto)
  heridas(x, o, f0, X, Y, G) {
    if (!this.on || !f0.cab) return; const st = etapa(o); if (!st) return;
    const r = Math.max(5, Math.min(10, Math.round(f0.rad / f0.q))); const esp = o.cara < 0, s = 1 / f0.q;
    const stC = o.herC ? st : Math.max(0, st - 1), stT = o.herT ? st : st - 1;
    const acostado = o.anim === 'piso' || o.anim === 'vuela';
    if (stC && !acostado) { const d = cG(caraSp(Math.min(4, stC), r, esp), G); const ax = X + o.cara * (f0.cab[0] - f0.pies[0]) * s, ay = Y + (f0.cab[1] - f0.pies[1]) * s; const ox = esp ? d.gw - (r + 2) : r + 2; this.recorte(x, d, ax - ox, ay - (r + 2), f0, X, Y, o.cara, f0.mc); }
    // remera empapada desde el cuello, recortada a la capa de la remera de este cuadro (sin brazo cercano ni cabeza)
    if (stT >= 2) { const d = cG(torsoSp(Math.min(4, stT), r, esp), G); const ax = X + o.cara * (f0.cue[0] - f0.pies[0]) * s, ay = Y + (f0.cue[1] - f0.pies[1]) * s; const c = Math.round(d.gw / 2); const ox = esp ? d.gw - c : c; this.recorte(x, d, ax - ox, ay, f0, X, Y, o.cara, f0.mt); }
  }
  // dibuja la calcomanía d en (dx, dy) recortada a una máscara de capa del cuadro (m: remera o piel del cráneo; si falta, la silueta).
  // El recorte se cachea en el propio cuadro (cuatro ranuras, tope global de 400; como mucho 2 recortes nuevos por cuadro de render): en régimen no se compone ni se asigna nada por frame
  recorte(x, d, dx, dy, f0, X, Y, cara, m) {
    const gw = d.gw, gh = d.gh, s = 1 / f0.q, w = f0.d.width * s, h = f0.d.height * s, top = Y - f0.pies[1] * s;
    const izq = cara > 0 ? X - f0.pies[0] * s : X - (f0.d.width - 1 - f0.pies[0]) * s;
    const lx = Math.round((dx - izq) * Q), ly = Math.round((dy - top) * Q); // posición en el cuadro (subpíxeles), no depende de X
    const id = d._id || (d._id = ++idCal); const k = id * 1e6 + (lx + 500) * 1000 + (ly + 500);
    const hm = f0._hm; let cv = null;
    if (hm) for (let i = 0; i < 4; i++) if (hm.k[i] === k) { cv = hm.c[i]; break; }
    if (!cv) {
      if (m === null || this.presR-- <= 0) return; // sin esa capa visible (p. ej. de espaldas) o ya se armaron 2 recortes en este cuadro: sale en el próximo (p. ej. de espaldas): nada que manchar
      if (REC.length >= 400) { for (const f of REC) f._hm = null; REC.length = 0; }
      const [c, sx] = lienzo(gw * Q, gh * Q); sx.drawImage(d, 0, 0, gw * Q, gh * Q); sx.globalCompositeOperation = 'destination-in';
      const k2 = Q * s; let src = f0.d, ox = 0, oy = 0, sw = f0.d.width, sh = f0.d.height;
      if (m) { src = mascaraCv(m); ox = m.x; oy = m.y; sw = m.w; sh = m.h; }
      if (cara > 0) sx.drawImage(src, 0, 0, sw, sh, ox * k2 - lx, oy * k2 - ly, sw * k2, sh * k2);
      else { sx.translate(w * Q - lx, 0); sx.scale(-1, 1); sx.drawImage(src, 0, 0, sw, sh, ox * k2, oy * k2 - ly, sw * k2, sh * k2); }
      const f1 = f0._hm || (f0._hm = { k: [0, 0, 0, 0], c: [null, null, null, null], t: 0 }); // 4 ranuras: cara y remera, mirando a cada lado
      f1.k[f1.t] = k; f1.c[f1.t] = c; f1.t = (f1.t + 1) & 3; REC.push(f0); cv = c;
    }
    x.drawImage(cv, izq + lx / Q, top + ly / Q, gw, gh);
  }


}
function dienteSp() { return memo('diente', () => pinta(3, 2, (px) => { px(0, 0, DIENTE); px(1, 0, DIENTE); px(1, 1, '#c8c0a8'); px(2, 1, R[1]); })); }
