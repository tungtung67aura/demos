// Utilidades de pixel art: lienzos, colores, sombreado, contorno y fuente bitmap.
import { GLIFOS } from './fuente-datos.js';

export function lienzo(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return [c, x];
}
export function hex(c) { // '#rrggbb' -> [r,g,b]
  const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function css(r, g, b) { return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1); }
export function tono(c, f) { // f<1 oscurece (y enfría), f>1 aclara (y calienta)
  let [r, g, b] = hex(c);
  if (f < 1) { r = r * f * 0.92; g = g * f * 0.95; b = Math.min(255, b * f + 12 * (1 - f)); }
  else { r = r + (255 - r) * (f - 1); g = g + (255 - g) * (f - 1) * 0.9; b = b + (255 - b) * (f - 1) * 0.75; }
  return css(Math.round(Math.max(0, Math.min(255, r))), Math.round(Math.max(0, Math.min(255, g))), Math.round(Math.max(0, Math.min(255, b))));
}
export function rgba32(c) { const [r, g, b] = hex(c); return ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0; }
export const CONTORNO = '#1b1220';

// --- Fuente bitmap (Press Start 2P, OFL) ---
const cacheTxt = new Map();
function glifo(ch) { return GLIFOS[ch] || GLIFOS[ch.toUpperCase()] || GLIFOS['?']; }
export function anchoTexto(s, esc = 1) { return s.length * 8 * esc; }
// Devuelve un canvas con el texto en color, con borde oscuro de 1px (escala entera).
export function textoCanvas(s, color = '#fff', esc = 1, borde = CONTORNO, sombra = null) {
  const k = s + '|' + color + '|' + esc + '|' + borde + '|' + sombra;
  let c = cacheTxt.get(k); if (c) return c;
  const w = s.length * 8, h = 11;
  const pad = 2;
  const [cv, x] = lienzo(w * esc + pad * 2 + 1, h * esc + pad * 2 + 1);
  const img = x.createImageData(cv.width, cv.height); const d = new Uint32Array(img.data.buffer);
  const col = rgba32(color), bc = borde ? rgba32(borde) : 0, sc = sombra ? rgba32(sombra) : 0;
  const mask = new Uint8Array(cv.width * cv.height);
  for (let i = 0; i < s.length; i++) {
    const g = glifo(s[i]);
    for (let yy = 0; yy < 12 && yy < h; yy++) for (let xx = 0; xx < 8; xx++) if (g[yy] & (1 << (7 - xx)))
      for (let ey = 0; ey < esc; ey++) for (let ex = 0; ex < esc; ex++) mask[(pad + yy * esc + ey) * cv.width + pad + (i * 8 + xx) * esc + ex] = 1;
  }
  const W = cv.width;
  for (let p = 0; p < mask.length; p++) if (mask[p]) {
    d[p] = col;
    // degradé: mitad inferior un poco más oscura (como el HUD de la referencia)
    if (esc > 1 && ((p / W) | 0) > pad + h * esc * 0.55) d[p] = rgba32(tono(color, 0.8));
  }
  if (sc) for (let p = 0; p < mask.length; p++) if (mask[p] && !mask[p + W + 1] && p + W + 1 < mask.length) { if (!d[p + W + 1]) d[p + W + 1] = sc; }
  if (bc) {
    const m2 = new Uint8Array(mask);
    for (let y = 0; y < cv.height; y++) for (let xx = 0; xx < W; xx++) {
      const p = y * W + xx; if (m2[p]) continue;
      if ((xx > 0 && m2[p - 1]) || (xx < W - 1 && m2[p + 1]) || (y > 0 && m2[p - W]) || (y < cv.height - 1 && m2[p + W]) ||
        (xx > 0 && y > 0 && m2[p - W - 1]) || (xx < W - 1 && y < cv.height - 1 && m2[p + W + 1]) || (xx > 0 && y < cv.height - 1 && m2[p + W - 1]) || (xx < W - 1 && y > 0 && m2[p - W + 1])) d[p] = bc;
    }
  }
  x.putImageData(img, 0, 0);
  cv._ox = pad; cv._oy = pad + 2 * esc;
  if (cacheTxt.size > 600) cacheTxt.clear();
  cacheTxt.set(k, cv); return cv;
}
export function texto(ctx, s, x, y, color = '#fff', esc = 1, alin = 'izq', borde = CONTORNO, sombra = null) {
  const c = textoCanvas(String(s), color, esc, borde, sombra);
  let dx = x - c._ox; if (alin === 'centro') dx = x - ((c.width - 1) >> 1); else if (alin === 'der') dx = x - c.width + c._ox;
  ctx.drawImage(c, Math.round(dx), Math.round(y - c._oy));
}

// --- Rasterizador de partes con contorno y sombreado (para sprites) ---
export class Buf {
  // q = densidad: las coordenadas son "lógicas" (1 = 1 px del juego) y se rasterizan a q×q subpíxeles.
  // Con q=2 los contornos, el sombreado y los detalles finos (cara, dedos, cordones) tienen el doble de resolución.
  constructor(w, h, q = 1) { this.q = q; this.lw = w; this.lh = h; this.w = w * q; this.h = h * q; this.d = new Uint32Array(this.w * this.h); this.x0 = this.w; this.y0 = this.h; this.x1 = -1; this.y1 = -1; }
  // caja de lo dibujado: así sombrear/contorno/sobre recorren solo esa zona
  limpiar() { if (this.x1 >= 0) { for (let y = this.y0; y <= this.y1; y++) this.d.fill(0, y * this.w + this.x0, y * this.w + this.x1 + 1); } this.x0 = this.w; this.y0 = this.h; this.x1 = -1; this.y1 = -1; }
  // píxel fino (coordenadas del búfer)
  f(x, y, c) { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < this.w && y < this.h) { this.d[y * this.w + x] = c; if (x < this.x0) this.x0 = x; if (x > this.x1) this.x1 = x; if (y < this.y0) this.y0 = y; if (y > this.y1) this.y1 = y; } }
  // píxel lógico (bloque q×q)
  px(x, y, c) { const q = this.q; if (q === 1) { this.f(x, y, c); return; } const X = (x | 0) * q, Y = (y | 0) * q; for (let j = 0; j < q; j++) for (let i = 0; i < q; i++) this.f(X + i, Y + j, c); }
  // píxel fino en coordenadas lógicas con decimales
  pf(x, y, c) { this.f(Math.floor(x * this.q), Math.floor(y * this.q), c); }
  caja(m = 0) { return [Math.max(0, this.x0 - m), Math.max(0, this.y0 - m), Math.min(this.w - 1, this.x1 + m), Math.min(this.h - 1, this.y1 + m)]; }
  get(x, y) { const q = this.q; x = Math.floor(x * q + (q > 1 ? q / 2 : 0)); y = Math.floor(y * q + (q > 1 ? q / 2 : 0)); return (x >= 0 && y >= 0 && x < this.w && y < this.h) ? this.d[y * this.w + x] : 0; }
  rect(x, y, w, h, c) { const q = this.q; for (let j = 0; j < h * q; j++) for (let i = 0; i < w * q; i++) this.f(x * q + i, y * q + j, c); }
  // disco
  disco(cx, cy, r, c) { const q = this.q; cx *= q; cy *= q; r *= q; const r2 = r * r + r * 0.6; for (let j = -Math.ceil(r); j <= Math.ceil(r); j++) for (let i = -Math.ceil(r); i <= Math.ceil(r); i++) if (i * i + j * j <= r2) this.f(Math.round(cx + i), Math.round(cy + j), c); }
  elipse(cx, cy, rx, ry, c) { const q = this.q; cx *= q; cy *= q; rx *= q; ry *= q; for (let j = -Math.ceil(ry); j <= Math.ceil(ry); j++) for (let i = -Math.ceil(rx); i <= Math.ceil(rx); i++) if ((i * i) / (rx * rx + 0.3) + (j * j) / (ry * ry + 0.3) <= 1) this.f(Math.round(cx + i), Math.round(cy + j), c); }
  // segmento grueso de ancho a0 -> a1
  seg(x0, y0, x1, y1, a0, a1, c) {
    // cápsula de radio variable rasterizada por área (cada píxel se evalúa una vez)
    const q = this.q; x0 *= q; y0 *= q; x1 *= q; y1 *= q;
    const rr = (a) => { const r = a / 2 * q; return Math.max(0.5, r - 0.5 * q); };
    const R0 = rr(a0), R1 = rr(a1), Rm = Math.max(R0, R1);
    const dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy;
    const minX = Math.floor(Math.min(x0, x1) - Rm - 1), maxX = Math.ceil(Math.max(x0, x1) + Rm + 1), minY = Math.floor(Math.min(y0, y1) - Rm - 1), maxY = Math.ceil(Math.max(y0, y1) + Rm + 1);
    for (let Y = minY; Y <= maxY; Y++) for (let X = minX; X <= maxX; X++) {
      // los discos originales se dibujaban centrados en coordenadas redondeadas: se evalúa el centro del píxel
      let t = L2 > 0 ? ((X - x0) * dx + (Y - y0) * dy) / L2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
      const px = x0 + dx * t - X, py = y0 + dy * t - Y, R = R0 + (R1 - R0) * t;
      if (px * px + py * py <= R * R + R * 0.6) this.f(X, Y, c);
    }
  }
  // línea de 1 píxel fino (con q=2 queda de medio píxel lógico: pliegues y costuras finas)
  linea(x0, y0, x1, y1, c) { const q = this.q; x0 *= q; y0 *= q; x1 *= q; y1 *= q; const L = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); const n = Math.max(1, Math.ceil(L)); for (let k = 0; k <= n; k++) { const t = k / n; this.f(Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t), c); } }
  // línea gruesa de 1 píxel lógico
  lineaL(x0, y0, x1, y1, c) { if (this.q === 1) { this.linea(x0, y0, x1, y1, c); return; } const L = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); const n = Math.max(1, Math.ceil(L * this.q)); for (let k = 0; k <= n; k++) { const t = k / n; this.px(Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t), c); } }
  poli(pts, c) { // polígono convexo/simple por scanline
    const q = this.q; if (q !== 1) pts = pts.map((p) => [p[0] * q, p[1] * q]);
    let ymin = 1e9, ymax = -1e9; for (const p of pts) { ymin = Math.min(ymin, p[1]); ymax = Math.max(ymax, p[1]); }
    for (let y = Math.floor(ymin); y <= Math.ceil(ymax); y++) {
      const xs = []; const yc = y + 0.5;
      for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; if ((a[1] <= yc && b[1] > yc) || (b[1] <= yc && a[1] > yc)) xs.push(a[0] + (yc - a[1]) / (b[1] - a[1]) * (b[0] - a[0])); }
      xs.sort((p, q2) => p - q2);
      for (let i = 0; i + 1 < xs.length; i += 2) for (let x = Math.round(xs[i]); x < Math.round(xs[i + 1]); x++) this.f(x, y, c);
    }
  }
  // sombreado de 4-5 tonos: sombra profunda abajo/derecha, sombra media, base, luz arriba/izquierda
  // y "rim light" cálido del atardecer en el borde superior.
  sombrear(oscuro, claro, lado = 1, rim = true) {
    if (this.x1 < 0) return; const { w, h, d } = this; const o = new Uint32Array(d); const [X0, Y0, X1, Y1] = this.caja(0);
    const vacio = (x, y) => x < 0 || y < 0 || x >= w || y >= h || !o[y * w + x];
    for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) {
      const p = y * w + x, c = o[p]; if (!c) continue;
      const dR = vacio(x + lado, y) ? 1 : vacio(x + 2 * lado, y) ? 2 : vacio(x + 3 * lado, y) ? 3 : 9;
      const dD = vacio(x, y + 1) ? 1 : vacio(x, y + 2) ? 2 : 9;
      const dL = vacio(x - lado, y) ? 1 : vacio(x - 2 * lado, y) ? 2 : 9;
      const dU = vacio(x, y - 1) ? 1 : vacio(x, y - 2) ? 2 : 9;
      let n = null;
      if (dR === 1 || dD === 1) n = MAPA_OSC2.get(c);
      else if (dR === 2 || (dD === 2 && dR < 9)) n = oscuro.get(c);
      else if (dU === 1 && rim) n = MAPA_RIM.get(c);
      else if (dL === 1 || dU === 2) n = claro && claro.get(c);
      else if (dR === 3 && (x + y) % 2 === 0) n = oscuro.get(c); // tramado suave
      if (n) d[p] = n;
    }
  }
  // sombreado fino (cualquier q): luz cálida del atardecer arriba/izquierda, lado de sombra frío abajo/derecha.
  // Los umbrales se miden en píxeles del juego (no en subpíxeles), así el volumen es el mismo con q=1, 2 o 3.
  // En telas oscuras no hay tramas (en negro se ven como ruido): bandas lisas y un borde de luz suave.
  sombrearQ(rim = true) {
    if (this.x1 < 0) return; const { w, d } = this; const [X0, Y0, X1, Y1] = this.caja(0);
    const bw = X1 - X0 + 1, bh = Y1 - Y0 + 1, n = bw * bh, s = this.q / 2;
    const T = (v) => Math.max(1, Math.round(v * s)); const t2 = T(2), t1 = T(1), t4 = T(4), t6 = T(6), t3 = T(3);
    // distancias al borde (vacío) en cada dirección, en una pasada por dirección
    const R = new Uint8Array(n), L = new Uint8Array(n), U = new Uint8Array(n), Dn = new Uint8Array(n), DR = new Uint8Array(n);
    const lleno = (x, y) => d[(y + Y0) * w + x + X0] !== 0;
    for (let y = 0; y < bh; y++) { let r = 0; for (let x = bw - 1; x >= 0; x--) { const i = y * bw + x; r = lleno(x, y) ? Math.min(250, r + 1) : 0; R[i] = r; }
      let l = 0; for (let x = 0; x < bw; x++) { const i = y * bw + x; l = lleno(x, y) ? Math.min(250, l + 1) : 0; L[i] = l; } }
    for (let x = 0; x < bw; x++) { let u = 0; for (let y = 0; y < bh; y++) { const i = y * bw + x; u = lleno(x, y) ? Math.min(250, u + 1) : 0; U[i] = u; }
      let dd = 0; for (let y = bh - 1; y >= 0; y--) { const i = y * bw + x; dd = lleno(x, y) ? Math.min(250, dd + 1) : 0; Dn[i] = dd; } }
    for (let y = bh - 1; y >= 0; y--) for (let x = bw - 1; x >= 0; x--) { const i = y * bw + x; DR[i] = lleno(x, y) ? Math.min(250, (x + 1 < bw && y + 1 < bh ? DR[i + bw + 1] : 0) + 1) : 0; }
    const tr = (x, y) => (x + y) & 1;
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
      const i = y * bw + x, dR = R[i]; if (!dR) continue; const p = (y + Y0) * w + x + X0, c = d[p];
      const dD = Dn[i], dL = L[i], dU = U[i], dDR = DR[i], osc = OSCURAS.has(c);
      let nc = null;
      if (dR <= t2 || dD <= t1) nc = MAPA_OSC2.get(c);                     // sombra profunda (fría)
      else if (dR <= t4 || dD <= t2 || dDR <= t2) nc = MAPA_OSC.get(c);     // sombra
      else if (dR <= t6 && !osc && tr(x, y)) nc = MAPA_OSC3.get(c);        // media sombra tramada
      else if (dU <= t2 && rim) nc = MAPA_RIM.get(c);                       // borde de luz cálida
      else if (dL <= t2 || dU <= t3) nc = MAPA_CLA.get(c);                  // luz
      else if (dL <= t4 && !osc && tr(x, y)) nc = MAPA_CLA2.get(c);        // luz suave tramada
      if (nc) d[p] = nc;
    }
  }
  // limpia la silueta de una capa: saca píxeles sueltos/espuelas y rellena muescas de 1 píxel (bordes prolijos al contornear)
  pulir() {
    if (this.x1 < 0) return; const { w, h, d } = this; const [X0, Y0, X1, Y1] = this.caja(1);
    for (let pasada = 0; pasada < 2; pasada++) {
      const quitar = [], poner = [];
      for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) {
        const i = y * w + x; const l = x > 0 ? d[i - 1] : 0, r = x < w - 1 ? d[i + 1] : 0, u = y > 0 ? d[i - w] : 0, dn = y < h - 1 ? d[i + w] : 0;
        const nv = (l ? 1 : 0) + (r ? 1 : 0) + (u ? 1 : 0) + (dn ? 1 : 0);
        if (d[i]) { if (nv <= 1) quitar.push(i); }
        else if (nv >= 3 || (l && r) || (u && dn)) poner.push(i, l || r || u || dn);
      }
      for (const i of quitar) d[i] = 0; for (let k = 0; k < poner.length; k += 2) d[poner[k]] = poner[k + 1];
      if (!quitar.length && !poner.length) break;
    }
  }
  contorno(c) {
    if (this.x1 < 0) return; const { w, h, d } = this; const [X0, Y0, X1, Y1] = this.caja(1);
    const bw = X1 - X0 + 1, bh = Y1 - Y0 + 1; const o = new Uint8Array(bw * bh);
    for (let y = 0; y < bh; y++) { const fila = (y + Y0) * w + X0; for (let x = 0; x < bw; x++) o[y * bw + x] = d[fila + x] !== 0 ? 1 : 0; }
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
      const i = y * bw + x; if (o[i]) continue;
      if ((x > 0 && o[i - 1]) || (x < bw - 1 && o[i + 1]) || (y > 0 && o[i - bw]) || (y < bh - 1 && o[i + bw])) this.f(x + X0, y + Y0, c);
    }
  }
  sobre(otro) { if (otro.x1 < 0) return; const a = this.d, b = otro.d, w = this.w; for (let y = otro.y0; y <= otro.y1; y++) for (let x = otro.x0; x <= otro.x1; x++) { const i = y * w + x; if (b[i]) { a[i] = b[i]; if (x < this.x0) this.x0 = x; if (x > this.x1) this.x1 = x; if (y < this.y0) this.y0 = y; if (y > this.y1) this.y1 = y; } } }
  // recorte a canvas (para guardar solo la zona dibujada)
  aCanvasRec(rx, ry, rw, rh, espejo = false) {
    const [cv, x] = lienzo(rw, rh); const img = x.createImageData(rw, rh); const u = new Uint32Array(img.data.buffer);
    for (let y = 0; y < rh; y++) for (let xx = 0; xx < rw; xx++) { const sx = rx + (espejo ? rw - 1 - xx : xx), sy = ry + y; if (sx >= 0 && sy >= 0 && sx < this.w && sy < this.h) u[y * rw + xx] = this.d[sy * this.w + sx]; }
    x.putImageData(img, 0, 0); return cv;
  }
  aCanvas(espejo = false) {
    const [cv, x] = lienzo(this.w, this.h); const img = x.createImageData(this.w, this.h); const u = new Uint32Array(img.data.buffer);
    if (!espejo) u.set(this.d); else for (let y = 0; y < this.h; y++) for (let xx = 0; xx < this.w; xx++) u[y * this.w + xx] = this.d[y * this.w + this.w - 1 - xx];
    x.putImageData(img, 0, 0); return cv;
  }
}
// Mapas de sombreado por color (cacheados)
const mOsc = new Map(), mCla = new Map(), mOsc2 = new Map(), mRim = new Map(), mOsc3 = new Map(), mCla2 = new Map();
export const OSCURAS = new Set(); // telas casi negras: sombreado en bandas lisas, sin tramas
export function col(c) {
  const v = rgba32(c);
  if (!mOsc.has(v)) {
    mOsc.set(v, rgba32(tono(c, 0.74))); mCla.set(v, rgba32(tono(c, 1.16))); mOsc2.set(v, rgba32(tono(c, 0.52))); mOsc3.set(v, rgba32(tono(c, 0.86))); mCla2.set(v, rgba32(tono(c, 1.07)));
    const [r, g, b] = hex(c); const lum = 0.3 * r + 0.59 * g + 0.11 * b, k = lum < 70 ? 0.45 : 1; if (lum < 70) OSCURAS.add(v);
    mRim.set(v, rgba32(css(Math.min(255, Math.round(r * (1 - 0.4 * k) + 255 * 0.4 * k)), Math.min(255, Math.round(g * (1 - 0.38 * k) + 190 * 0.38 * k)), Math.min(255, Math.round(b * (1 - 0.34 * k) + 120 * 0.34 * k)))));
  }
  return v;
}
export const MAPA_OSC = mOsc, MAPA_CLA = mCla, MAPA_OSC2 = mOsc2, MAPA_RIM = mRim, MAPA_OSC3 = mOsc3, MAPA_CLA2 = mCla2;

// PRNG determinista
export function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
