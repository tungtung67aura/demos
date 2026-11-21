// Mapa de Montevideo para elegir nivel: ciudad en pixel art (rasterizada a la resolución del juego, nítida a cualquier DPR),
// cada nivel es un hito ilustrado, recorrido animado, estados bloqueado / abierto / ganado, ficha con foto del nivel,
// retrato del jefe, hora y dificultad. Táctil, teclado y joystick. Sonidos por ID (ui.*).
import { texto, lienzo, CONTORNO, tono } from './pixel.js';
import { NIVELES } from './niveles.js';
import { calle, cielo, EXTRA } from './escenario.js';
import { generar } from './sprites.js';
import { sonar } from './audio.js';

const NOMBRE_JEFE = { tano: 'EL TANO', chola: 'DOÑA CHOLA', guarda: 'EL GUARDA', bocha: 'EL BOCHA', parrillero: 'EL PARRILLERO', capo: 'DON PEPE' };
const HORA = { atardecer: 'ATARDECER', manana: 'MAÑANA', mediodia: 'MEDIODÍA', noche: 'NOCHE', gris: 'NUBLADO', tormenta: 'TORMENTA' };
// dónde queda cada nivel en el mapa (u: oeste→este, v: norte→sur) y qué parte del nivel muestra la foto
const SITIO = {
  cuadra: { u: 0.43, v: 0.31, foto: 690, alto: 18 },
  feria: { u: 0.52, v: 0.53, foto: 760, alto: 6 },
  avenida: { u: 0.43, v: 0.655, foto: 760, alto: 14 },
  barriosur: { u: 0.445, v: 0.795, foto: 1330, alto: 10 },
  ciudadvieja: { u: 0.292, v: 0.725, foto: 2600, alto: 8 },
  rambla: { u: 0.80, v: 0.80, foto: 1120, alto: 0 },
};

// ---------- geografía ----------
const g2 = (u, c, s) => Math.exp(-(((u - c) / s) ** 2));
function costaSur(u) { return 0.805 + 0.105 * g2(u, 0.625, 0.022) + 0.045 * g2(u, 0.935, 0.03) - 0.025 * g2(u, 0.77, 0.06) + 0.006 * Math.sin(u * 47); }
function esAgua(u, v) {
  if (u >= 0.255 && u <= 0.35 && Math.abs(v - 0.735) < 0.032) { // península de Ciudad Vieja (punta redondeada)
    if (u < 0.275) return ((u - 0.275) / 0.02) ** 2 + ((v - 0.735) / 0.032) ** 2 > 1; return false; }
  if (u < 0.12) return v > 0.87 - 0.02 * Math.sin(u * 60); // costa del Cerro
  if (u < 0.255) { if (v > 0.66) return true; return ((u - 0.2) / 0.088) ** 2 + ((v - 0.6) / 0.11) ** 2 < 1; } // bahía
  if (u < 0.35) return v > 0.80 || (v > 0.70 && u < 0.27);
  return v > costaSur(u);
}
function hash(a, b) { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
const AV = [[0.35, 0.735], [0.43, 0.70], [0.52, 0.665], [0.6, 0.63], [0.75, 0.58], [1.0, 0.54]]; // 18 de Julio → Av. Italia
const BULEVAR = [[0.47, 0.18], [0.5, 0.4], [0.57, 0.62], [0.61, 0.78], [0.62, 0.87]]; // Bulevar Artigas → Punta Carretas
const AGRACIADA = [[0.35, 0.72], [0.33, 0.55], [0.3, 0.38], [0.25, 0.2], [0.22, 0.0]];
const PARQUES = [[0.19, 0.24, 0.06, 0.07], [0.555, 0.775, 0.03, 0.02], [0.69, 0.47, 0.045, 0.05], [0.88, 0.62, 0.035, 0.04]]; // Prado, Rodó, Batlle, Buceo
function enLinea(px, py, pts, W, H, ancho) { for (let i = 0; i < pts.length - 1; i++) { const ax = pts[i][0] * W, ay = pts[i][1] * H, bx = pts[i + 1][0] * W, by = pts[i + 1][1] * H; const dx = bx - ax, dy = by - ay; const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy))); if (Math.hypot(px - ax - t * dx, py - ay - t * dy) < ancho) return true; } return false; }
const HEX = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const P = { mar: HEX('#2b5d82'), mar2: HEX('#356d93'), bajo: HEX('#4a88a8'), espuma: HEX('#d6eaf0'), arena: HEX('#e4d09a'), arena2: HEX('#cdb57c'), rambla: HEX('#c8c2b6'), rambla2: HEX('#8e887e'),
  calle: HEX('#a3967c'), tierra: HEX('#bfae86'), techo: [HEX('#d9c9a2'), HEX('#cfbb92'), HEX('#e3d5b2'), HEX('#c9b48c'), HEX('#d7cbb4'), HEX('#d2c09a'), HEX('#ddcfae'), HEX('#c79a7a'), HEX('#d4c6a6'), HEX('#cdbd98')], viejo: [HEX('#b8a284'), HEX('#a99276'), HEX('#c3ae90'), HEX('#b0907a'), HEX('#bca88a')],
  pasto: HEX('#6f9a4e'), arbol: HEX('#4b7638'), arbol2: HEX('#3a5e2c'), cerro: HEX('#7e8f52'), cerro2: HEX('#66773f'), cerro3: HEX('#93a463'), av: HEX('#efe0ae'), av2: HEX('#8a7a58'), muelle: HEX('#8c8a90'), muelle2: HEX('#5e5c64') };
function pintarCiudad(W, H, Hc) {
  const Y0 = H - Hc; // el mapa se apoya en la costa: si sobra alto, se ve más ciudad hacia el norte (sin deformar)
  const [c, m] = lienzo(W, H); const img = m.createImageData(W, H); const d = img.data;
  const put = (i, col) => { d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255; };
  const agua = new Uint8Array(W * H); for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++) agua[y * W + xx] = esAgua((xx + 0.5) / W, (y + 0.5 - Y0) / Hc) ? 1 : 0;
  const A = (xx, y) => xx < 0 || y < 0 || xx >= W || y >= H ? 1 : agua[y * W + xx];
  const dCosta = (xx, y, r) => { for (let k = 1; k <= r; k++) if (A(xx, y + k) || A(xx, y - k) || A(xx + k, y) || A(xx - k, y)) return k; return 99; };
  const cerro = (xx, y) => { const dx = (xx / W - 0.065) / 0.06, dy = ((y - Y0) / Hc - 0.64) / 0.12; return dx * dx + dy * dy; };
  for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++) {
    const i = (y * W + xx) * 4, u = xx / W, v = (y - Y0) / Hc;
    if (agua[y * W + xx]) { // agua: más clara cerca de la costa, ondulada
      let k = 99; for (let r = 1; r <= 4 && k === 99; r++) if (!A(xx, y - r) || !A(xx - r, y) || !A(xx + r, y) || !A(xx, y + r)) k = r;
      put(i, k === 1 ? P.espuma : k <= 3 ? P.bajo : ((xx + y * 3) % 11 === 0 || (xx * 7 + y) % 23 === 0) ? P.mar2 : P.mar); continue; }
    const dc = dCosta(xx, y, 4);
    const sur = u > 0.36 && !A(xx, y + 1) === false;
    if (u > 0.36 && dc <= 2 && A(xx, y + dc)) { put(i, u > 0.66 && u < 0.9 ? (dc === 1 ? P.arena : P.arena2) : (dc === 1 ? P.rambla2 : P.rambla)); continue; } // playa / rambla
    if (u > 0.36 && dc === 3 && A(xx, y + 3)) { put(i, P.rambla); continue; }
    void sur;
    const ce = cerro(xx, y); if (ce < 1) { put(i, ce < 0.15 ? P.cerro3 : ce < 0.5 ? ((xx + y) % 3 ? P.cerro : P.cerro2) : P.cerro2); continue; }
    let parque = false; for (const [pu, pv, ru, rv] of PARQUES) if (((u - pu) / ru) ** 2 + ((v - pv) / rv) ** 2 < 1) parque = true;
    if (parque) { const h = hash(xx >> 1, y >> 1); put(i, h < 0.32 ? P.arbol : h < 0.4 ? P.arbol2 : P.pasto); continue; }
    if (enLinea(xx, y - Y0, AV, W, Hc, 1.3)) { put(i, P.av); continue; }
    if (enLinea(xx, y - Y0, AV, W, Hc, 2.2) || enLinea(xx, y - Y0, BULEVAR, W, Hc, 1.6) || enLinea(xx, y - Y0, AGRACIADA, W, Hc, 1.4)) { put(i, P.av2); continue; }
    // manzanas: cuadrícula de 7x6 con calles de 1 px; Ciudad Vieja más apretada y más vieja
    const viejo = u > 0.25 && u < 0.36 && v > 0.69 && v < 0.78; const gx = viejo ? 5 : 7, gy = viejo ? 4 : 6;
    const ox = xx + (u > 0.5 ? 3 : 0), mx = ox % gx, my = y % gy;
    if (mx === 0 || my === 0) { put(i, P.calle); continue; }
    const bx = Math.floor(ox / gx), by = Math.floor(y / gy); const h = hash(bx, by), pal = viejo ? P.viejo : P.techo;
    let col = pal[Math.floor(h * pal.length)];
    const hp = hash(xx, y); if (!viejo && hp < (v < 0.3 ? 0.11 : 0.045)) col = hp < 0.02 ? P.arbol2 : P.arbol; // árboles de vereda (más verde hacia los barrios del norte)
    else if (hp > 0.86) col = [col[0] * 0.93 | 0, col[1] * 0.93 | 0, col[2] * 0.93 | 0]; // casas sueltas dentro de la manzana
    if (mx === gx - 1 || my === gy - 1) col = [col[0] * 0.86 | 0, col[1] * 0.86 | 0, col[2] * 0.86 | 0]; // sombra de la manzana
    put(i, col);
  }
  // muelles del puerto (en la bahía, al norte de la península)
  for (let k = 0; k < 4; k++) { const py = Math.round(Y0 + Hc * (0.57 + k * 0.03)); const px = Math.round(W * 0.255); for (let xx = px - Math.round(W * 0.03); xx < px; xx++) { if (!A(xx, py)) continue; put((py * W + xx) * 4, P.muelle); if (py + 1 < H) put(((py + 1) * W + xx) * 4, P.muelle2); } }
  m.putImageData(img, 0, 0);
  return { c, agua };
}

// ---------- íconos (pixel art a mano, con contorno) ----------
function icono(tipo) {
  const S = 26; const [c, m] = lienzo(S, S); const R = (a, b, w, h, col) => { m.fillStyle = col; m.fillRect(a, b, w, h); };
  const O = (a, b, w, h, col) => { R(a - 1, b - 1, w + 2, h + 2, CONTORNO); R(a, b, w, h, col); };
  switch (tipo) {
    case 'cuadra': // almacén de esquina con toldo a rayas y la parada del 121
      O(4, 9, 16, 14, '#e8d0a0'); R(4, 9, 16, 2, '#f4e2b8'); for (let k = 0; k < 8; k++) R(4 + k * 2, 11, 1, 1, '#c8b080');
      O(3, 11, 18, 4, '#c8202a'); for (let k = 0; k < 9; k++) R(3 + k * 2, 11, 1, 4, '#f2f2e8');
      R(6, 16, 6, 7, '#3a2a20'); R(7, 17, 4, 3, '#ffd890'); R(14, 16, 4, 4, '#7ab0d0'); R(14, 21, 4, 2, '#5a3a2a');
      O(22, 7, 1, 16, '#9a9aa0'); O(20, 5, 5, 4, '#2a6ab8'); R(21, 6, 3, 1, '#f2f2e8'); break;
    case 'feria': // puesto de feria: toldo a rayas, cajones de fruta
      O(3, 6, 20, 5, '#2a8a4a'); for (let k = 0; k < 10; k++) R(3 + k * 2, 6, 1, 5, '#f2f2e8'); R(3, 11, 20, 1, '#1f6a38');
      O(4, 12, 1, 10, '#6a4a2a'); O(21, 12, 1, 10, '#6a4a2a'); O(5, 17, 16, 6, '#b88a4a'); R(5, 17, 16, 1, '#d8aa6a');
      for (let k = 0; k < 7; k++) { R(6 + k * 2, 15, 2, 2, k % 3 === 0 ? '#f08a20' : k % 3 === 1 ? '#c8202a' : '#7ac04a'); } R(9, 19, 8, 3, '#8a6a3a'); break;
    case 'avenida': // Palacio Salvo
      O(9, 2, 8, 3, '#d8d0c0'); O(11, 0, 4, 2, '#e8e0d0'); R(12, -1, 2, 1, CONTORNO); O(7, 5, 12, 6, '#cfc6b4'); O(5, 11, 16, 12, '#c4baa6');
      for (let k = 0; k < 3; k++) for (let q = 0; q < 2; q++) R(8 + k * 4, 6 + q * 3, 2, 2, '#5a6a8a'); for (let k = 0; k < 4; k++) for (let q = 0; q < 3; q++) R(7 + k * 4, 13 + q * 3, 2, 2, '#5a6a8a');
      R(5, 11, 16, 1, '#e8e0d0'); R(12, 20, 2, 3, '#3a2a20'); break;
    case 'barriosur': // tambor de candombe con lonjas y el palo
      O(7, 6, 12, 17, '#8a3a2a'); R(7, 6, 3, 17, '#a85a40'); for (let k = 0; k < 4; k++) R(7, 9 + k * 4, 12, 1, '#e8c040'); O(6, 4, 14, 3, '#f2ead8'); R(6, 4, 14, 1, '#ffffff');
      O(17, 1, 2, 9, '#d8b070'); R(17, 1, 2, 2, '#f0d090'); R(9, 23, 8, 1, CONTORNO); break;
    case 'ciudadvieja': // Mercado del Puerto: techo de hierro y torre del reloj
      O(2, 12, 22, 11, '#7a3a2a'); R(2, 12, 22, 2, '#a85a40'); for (let k = 0; k < 5; k++) R(4 + k * 4, 15, 2, 7, '#3a1a14');
      O(4, 9, 18, 3, '#5a5e66'); O(10, 3, 6, 7, '#6a6e76'); R(11, 4, 4, 4, '#f2ead8'); R(13, 5, 1, 2, CONTORNO); R(12, 6, 2, 1, CONTORNO); O(12, 0, 2, 3, '#5a5e66'); break;
    case 'rambla': { // letras de MONTEVIDEO con el mar atrás
      R(0, 14, S, 6, '#3a7898'); for (let k = 0; k < S; k += 4) R(k, 14, 2, 1, '#d6eaf0'); const cs = ['#c8202a', '#f0d040', '#2a8ad0', '#e04a8a'];
      for (let k = 0; k < 4; k++) { O(2 + k * 6, 8 + (k % 2), 5, 13 - (k % 2), cs[k]); R(3 + k * 6, 9 + (k % 2), 3, 1, tono(cs[k], 1.3)); }
      R(0, 22, S, 3, '#c8c2b6'); R(0, 22, S, 1, CONTORNO); break; }
    case 'fortaleza': O(4, 9, 14, 6, '#9a9080'); for (let k = 0; k < 4; k++) R(4 + k * 4, 7, 2, 2, '#9a9080'); O(9, 3, 4, 6, '#a89e8c'); R(10, 1, 1, 3, CONTORNO); R(11, 1, 3, 2, '#2a8ad0'); break;
    case 'legislativo': O(3, 10, 16, 6, '#e8e0d0'); O(6, 6, 10, 4, '#d8d0c0'); O(9, 2, 4, 4, '#cfc6b4'); for (let k = 0; k < 5; k++) R(4 + k * 3, 11, 1, 5, '#a89e8c'); break;
    case 'estadio': O(3, 7, 18, 9, '#c8c0b0'); R(6, 9, 12, 5, '#5a9a4a'); R(11, 9, 1, 5, '#f2f2e8'); O(16, 1, 2, 6, '#d8d0c0'); break;
    case 'faro': O(9, 3, 4, 13, '#f2f2e8'); R(9, 7, 4, 2, '#c8202a'); R(9, 12, 4, 2, '#c8202a'); O(8, 1, 6, 2, '#3a3a40'); R(10, 0, 2, 1, '#ffe080'); O(5, 16, 12, 3, '#8a8478'); break;
  }
  return c;
}
function apagado(cv) { // versión bloqueada: gris azulado oscuro
  const [c, m] = lienzo(cv.width, cv.height); m.drawImage(cv, 0, 0); const img = m.getImageData(0, 0, c.width, c.height), d = img.data;
  for (let i = 0; i < d.length; i += 4) { if (!d[i + 3]) continue; const l = (d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11) * 0.42; d[i] = l + 14; d[i + 1] = l + 12; d[i + 2] = l + 26; }
  m.putImageData(img, 0, 0); return c;
}
// rosa de los vientos chiquita (norte arriba)
function rosa() { return bitmap(['.........N.........', '........NNN........', '........nNn........', '.......nnNnn.......', '.......nnNnn.......', '......nnnNnnn......', '..o...nnnNnnn...o..', '...oo.nnnNnnn.oo...', '....oooccccccoo....', '.WWWWWccccccceeeee.', '....oooccccccoo....', '...oo.sssSsss.oo...', '..o...sssSsss...o..', '......sssSsss......', '.......ssSss.......', '.......ssSss.......', '........sSs........', '........SSS........', '.........S.........'], { N: '#ff5a4a', n: '#c8202a', S: '#f2ead8', s: '#b8ab90', W: '#d8ccb0', e: '#d8ccb0', o: '#8a7656', c: '#ffd23a' }); }
function candado() { return bitmap(['.ggg.', 'g...g', 'g...g', 'yyyyy', 'yYYYy', 'yy.yy', 'yy.yy', 'yyyyy'], { g: '#c8c8d0', y: '#e8b030', Y: '#ffe080' }); }
function estrella() { return bitmap(['....y....', '...yYy...', 'yyyyYyyyy', '.yyyyyyy.', '..yyyyy..', '.yyy.yyy.', '.yy...yy.'], { y: '#ffd23a', Y: '#fff2a0' }); }
// mapa de bits con paleta: cada carácter es un color ('.' transparente); contorno automático alrededor
function bitmap(filas, pal, borde = true) {
  const h = filas.length, w = filas[0].length; const [c, m] = lienzo(w + 2, h + 2);
  const lleno = (xx, yy) => yy >= 0 && yy < h && xx >= 0 && xx < w && filas[yy][xx] !== '.';
  if (borde) { m.fillStyle = CONTORNO; for (let yy = -1; yy <= h; yy++) for (let xx = -1; xx <= w; xx++) if (!lleno(xx, yy) && (lleno(xx - 1, yy) || lleno(xx + 1, yy) || lleno(xx, yy - 1) || lleno(xx, yy + 1))) m.fillRect(xx + 1, yy + 1, 1, 1); }
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) { const ch = filas[yy][xx]; if (ch === '.') continue; m.fillStyle = pal[ch]; m.fillRect(xx + 1, yy + 1, 1, 1); }
  return c;
}
const BM_HORA = {
  sol: [['...a.a...', '.a.....a.', '...sss...', '..sSSss..', 'a.sSsss.a', '..sssso..', '...soo...', '.a.....a.', '...a.a...'], { a: '#ffd860', s: '#ffd040', S: '#fff6c0', o: '#f0a020' }],
  atardecer: [['.........', '...sss...', '..sSsss..', '.ssssooo.', 'hhhhhhhhh', 'rrrrrrrrr', '.r.r.r.r.'], { s: '#f8a040', S: '#ffe0a0', o: '#e06a30', h: '#3a2a4a', r: '#c84a6a' }],
  noche: [['...mmm..', '..mMm...', '.mMm....', '.mMm..*.', '.mMm....', '.mmMm...', '..mmmm..', '...mm...'], { m: '#e8e0c0', M: '#fff8e0', '*': '#ffffff' }],
  gris: [['...nnn....', '..nNNnn...', '.nnNnnnnn.', 'nnnnnnnnnn', 'nnnnnnnnoo', '.oooooooo.'], { n: '#c8ccd8', N: '#eef0f6', o: '#8a90a0' }],
  tormenta: [['...nnn....', '..nNNnn...', '.nnnnnnnn.', 'nnnnnnnnoo', '.oooooooo.', '....yy....', '...yy.....', '....yy....', '.....y....'], { n: '#8a90a0', N: '#b8bcc8', o: '#5a6070', y: '#ffe060' }],
};
function iconoHora(h) { const k = h === 'mediodia' || h === 'manana' ? 'sol' : h; const [f, pal] = BM_HORA[k] || BM_HORA.sol; return bitmap(f, pal); }
// ---------- estado ----------
const ST = { sel: 0, max: 0, ganados: new Set(), marcador: 0, tCambio: 1, entrada: 0, salida: -1, alEmpezar: null, ciudad: null, ciudadK: '', iconos: null, fotos: {}, jefes: {}, pend: [] };
export function abrirMapa(nivelMax, nivelSel, ganados) {
  ST.max = nivelMax; ST.sel = Math.max(0, Math.min(NIVELES.length - 1, nivelSel)); ST.ganados = new Set(ganados); ST.marcador = ST.sel; ST.tCambio = 1; ST.entrada = 0; ST.salida = -1; ST.alEmpezar = null;
  sonar('ui.mapa');
}
const ICONOS_N = {}; export function iconoNivel(id) { return ICONOS_N[id] || (ICONOS_N[id] = icono(id)); } // también lo usa el cartel de nivel
export function mapaSel() { return ST.sel; }
export function puntosMapa(W, H) { const Z = zonas(W, H); return { hitos: NIVELES.map((_, i) => Z.pt(i)), dale: Z.dale, volver: Z.volver }; } // para pruebas
function zonas(W, H) {
  const pw = Math.max(150, Math.min(214, Math.round(W * 0.36))); const mx = 6, my = 26, mw = W - pw - 18, mh = H - my - 6; const ix = mx + mw + 6;
  const Hc = Math.min(mh, Math.round(mw / 1.15)), Y0 = mh - Hc; const P2 = (u, v) => [mx + Math.round(u * mw), my + Y0 + Math.round(v * Hc)];
  const by = H - 30, bw = pw - 4;
  return { mx, my, mw, mh, ix, pw, Hc, Y0, P2, volver: [ix + 2, by, Math.round(bw * 0.42), 24], dale: [ix + 2 + Math.round(bw * 0.42) + 4, by, bw - Math.round(bw * 0.42) - 4, 24],
    pin: (i) => { const s = SITIO[NIVELES[i].id]; return P2(s.u, s.v); }, pt: (i) => placas(W, H, mx, my, mw, mh, P2)[i] };
}
// las placas de los hitos se separan si no entran (pantallas angostas): parten del lugar real y se empujan entre sí
const PLACAS = {};
function placas(W, H, mx, my, mw, mh, P2) { const k = W + 'x' + H; if (PLACAS[k]) return PLACAS[k];
  const p = NIVELES.map((nv) => { const s = SITIO[nv.id]; return P2(s.u, s.v).slice(); }); const SEP = 36;
  for (let it = 0; it < 80; it++) { let mov = false;
    for (let a = 0; a < p.length; a++) for (let b = a + 1; b < p.length; b++) { const dx = p[b][0] - p[a][0], dy = p[b][1] - p[a][1]; const ox = SEP - Math.abs(dx), oy = SEP - Math.abs(dy);
      if (ox > 0 && oy > 0) { mov = true; if (ox < oy) { const e = ox / 2 + 0.5, sg = dx >= 0 ? 1 : -1; p[a][0] -= sg * e; p[b][0] += sg * e; } else { const e = oy / 2 + 0.5, sg = dy >= 0 ? 1 : -1; p[a][1] -= sg * e; p[b][1] += sg * e; } } }
    for (const q of p) { q[0] = Math.max(mx + 20, Math.min(mx + mw - 34, q[0])); q[1] = Math.max(my + 30, Math.min(my + mh - 12, q[1])); } if (!mov) break; }
  return (PLACAS[k] = p.map((q) => [Math.round(q[0]), Math.round(q[1])])); }
// recorrido entre hitos (curvas suaves), muestreado cada ~3 px
function tramo(Z, i) { const [ax, ay] = Z.pt(i), [bx, by] = Z.pt(i + 1); const mx = (ax + bx) / 2, my = (ay + by) / 2; const nx = -(by - ay), ny = bx - ax; const L = Math.hypot(nx, ny) || 1; const k = (i % 2 ? 1 : -1) * 0.18 * L;
  const cx = mx + nx / L * k, cy = my + ny / L * k; const n = Math.max(4, Math.round(Math.hypot(bx - ax, by - ay) / 3)); const pts = [];
  for (let q = 0; q <= n; q++) { const t = q / n, a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c = t * t; pts.push([a * ax + b * cx + c * bx, a * ay + b * cy + c * by]); } return pts; }
// precarga en ratos libres: fotos de niveles y retratos de jefes (una cosa por llamada)
export function precargarMapa(W, H) {
  const Z = zonas(W, H); const [tw, th] = tamFoto(Z, H);
  for (const nv of NIVELES) { const k = nv.id + ':' + tw + 'x' + th; if (!ST.fotos[k]) { ST.fotos[k] = foto(nv, tw, th); return true; } }
  for (const nv of NIVELES) { const j = nv.oleadas[nv.oleadas.length - 1].jefe; if (j && !ST.jefes[j]) { ST.jefes[j] = generar(j, 0, null, true).retrato; return true; } }
  return false;
}
// la foto usa el alto que sobre en la ficha (entre 42% y 62% del ancho)
function tamFoto(Z, H) { const tw = Z.pw - 10; return [tw, Math.max(Math.round(tw * 0.42), Math.min(Math.round(tw * 0.62), H - Z.my - 160))]; }
function foto(nv, tw, th) {
  // se arma al doble y se reduce promediando: entra la fachada entera con su vereda, sin perder el pixelado
  const W2 = tw * 2, H2 = th * 2; const [g, gm] = lienzo(W2, H2); gm.drawImage(cielo(W2, H2, nv.hora), 0, 0);
  const x0 = Math.max(0, Math.min(nv.L - W2, SITIO[nv.id].foto - tw)); const cl = calle(nv, { x0, w: W2 }).canvas; const sx = 0; const sy = Math.max(0, EXTRA + 168 + 30 - H2 - (SITIO[nv.id].alto || 0));
  gm.drawImage(cl, sx, sy, W2, H2, 0, 0, W2, H2);
  const [c, m] = lienzo(tw, th); m.imageSmoothingEnabled = true; m.imageSmoothingQuality = 'high'; m.drawImage(g, 0, 0, tw, th); return c;
}
export function fotoNivel(i, tw, th) { return foto(NIVELES[i], tw, th); } // para pruebas
function retJefe(j) { return ST.jefes[j] || (ST.jefes[j] = generar(j, 0, null, true).retrato); }

// ---------- entrada ----------
// i: { nx, ny, ok, atras, tap:[x,y]|null }  → devuelve { empezar: n } | { volver: true } | null
export function pasoMapa(dt, W, H, i) {
  const Z = zonas(W, H); ST.entrada = Math.min(1, ST.entrada + dt / 0.3); ST.tCambio = Math.min(1, ST.tCambio + dt / 0.22);
  // el marcador viaja por el recorrido hacia el elegido
  const d = ST.sel - ST.marcador; if (Math.abs(d) > 0.001) ST.marcador += Math.sign(d) * Math.min(Math.abs(d), dt * Math.max(3, Math.abs(d) * 5)); else ST.marcador = ST.sel;
  if (ST.salida >= 0) { ST.salida += dt; if (ST.salida > 0.42) { ST.salida = -1; return { empezar: ST.sel }; } return null; }
  const mover = (n) => { if (n === ST.sel) return; ST.sel = n; ST.tCambio = 0; sonar('ui.mover'); };
  const dale = () => { if (ST.sel <= ST.max) { ST.salida = 0; sonar('ui.ok'); } else sonar('ui.bloqueado'); };
  if (i.nx || i.ny) { const dd = i.nx || i.ny; mover(Math.max(0, Math.min(NIVELES.length - 1, ST.sel + dd))); }
  if (i.ok) dale();
  if (i.atras) { sonar('ui.atras'); return { volver: true }; }
  if (i.tap) { const [tx, ty] = i.tap;
    for (let n = 0; n < NIVELES.length; n++) { const [px, py] = Z.pt(n); if (Math.abs(tx - px) < 17 && Math.abs(ty - (py - 6)) < 18) { if (ST.sel === n) dale(); else mover(n); return null; } }
    const den = (r) => tx >= r[0] && tx <= r[0] + r[2] && ty >= r[1] && ty <= r[1] + r[3];
    if (den(Z.dale)) dale(); else if (den(Z.volver)) { sonar('ui.atras'); return { volver: true }; } }
  return null;
}

// ---------- dibujo ----------
function boton(x, r, txt, activo, color, apagadoB) {
  x.fillStyle = CONTORNO; x.fillRect(r[0] - 1, r[1] - 1, r[2] + 2, r[3] + 2); x.fillStyle = apagadoB ? '#3a3046' : activo ? color : '#4a3260'; x.fillRect(r[0], r[1], r[2], r[3]);
  x.fillStyle = 'rgba(255,255,255,0.18)'; x.fillRect(r[0], r[1], r[2], 2); x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(r[0], r[1] + r[3] - 2, r[2], 2);
  texto(x, txt, r[0] + r[2] / 2, r[1] + Math.round(r[3] / 2) - 4, apagadoB ? '#7a6a8a' : activo ? CONTORNO : '#ffffff', 1, 'centro', activo && !apagadoB ? null : CONTORNO);
}
// capa cacheada a la densidad de la pantalla (nítida en cualquier DPR); se rehace sólo si cambia la clave
function capa(prev, clave, w, h, D, pintar) { if (prev && prev.k === clave) return prev; const c = document.createElement('canvas'); c.width = Math.ceil(w * D); c.height = Math.ceil(h * D);
  const m = c.getContext('2d'); m.setTransform(D, 0, 0, D, 0, 0); m.imageSmoothingEnabled = false; pintar(m); return { k: clave, c }; }
const choca = (a, b) => a[0] < b[0] + b[2] && b[0] < a[0] + a[2] && a[1] < b[1] + b[3] && b[1] < a[1] + a[3];
function partir(s, maxc) { const out = []; let l = ''; for (const w of s.split(' ')) { if ((l + ' ' + w).trim().length > maxc && l) { out.push(l.trim()); l = w; } else l += ' ' + w; } if (l.trim()) out.push(l.trim()); return out; }
export function dibujarMapa(x, W, H, tP, jugadorSp) {
  const Z = zonas(W, H);
  if (!ST.iconos) { ST.iconos = {}; for (const k of ['cuadra', 'feria', 'avenida', 'barriosur', 'ciudadvieja', 'rambla', 'fortaleza', 'legislativo', 'estadio', 'faro']) { const c = icono(k); ST.iconos[k] = { c, off: apagado(c) }; } ST.candado = candado(); ST.estrella = estrella(); ST.horas = {}; }
  const k = Z.mw + 'x' + Z.mh; if (k !== ST.ciudadK) { ST.ciudad = pintarCiudad(Z.mw, Z.mh, Z.Hc); ST.ciudadK = k; ST.olas = null; }
  const D = x.getTransform().a || 1;
  // capa fija de abajo: lámina, títulos, marco y la ciudad (se arma una vez por tamaño)
  ST.capaA = capa(ST.capaA, 'A' + W + 'x' + H + '@' + D, W, H, D, (c) => {
  // fondo de la pantalla: lámina oscura con trama
  c.fillStyle = '#1a1024'; c.fillRect(0, 0, W, H); c.fillStyle = '#22162e'; for (let yy = 0; yy < H; yy += 4) c.fillRect(0, yy, W, 1);
  texto(c, 'MONTEVIDEO', Z.mx + 2, 7, '#ffd23a', 2, 'izq', CONTORNO, '#8a5a10');
  texto(c, 'ELEGÍ DÓNDE PELEAR', Z.ix + Z.pw - 2, 11, '#c8b8d8', 1, 'der');
  // marco del mapa
  c.fillStyle = CONTORNO; c.fillRect(Z.mx - 3, Z.my - 3, Z.mw + 6, Z.mh + 6); c.fillStyle = '#8a6a3a'; c.fillRect(Z.mx - 2, Z.my - 2, Z.mw + 4, Z.mh + 4); c.fillStyle = '#c8a060'; c.fillRect(Z.mx - 2, Z.my - 2, Z.mw + 4, 1);
  c.drawImage(ST.ciudad.c, Z.mx, Z.my);
  });
  x.drawImage(ST.capaA.c, 0, 0, W, H);
  // agua viva: destellos que titilan y un barco que cruza el río
  if (!ST.olas) { ST.olas = []; const a = ST.ciudad.agua; for (let n = 0; n < 400 && ST.olas.length < 70; n++) { const xx = Math.floor(hash(n, 7) * Z.mw), yy = Math.floor(hash(n, 13) * Z.mh); if (a[yy * Z.mw + xx] && a[yy * Z.mw + Math.min(Z.mw - 1, xx + 3)]) ST.olas.push([xx, yy, hash(n, 3) * 6]); } }
  x.fillStyle = '#9cc8dc'; for (const [ox, oy, f] of ST.olas) { const s = Math.sin(tP * 2.2 + f); if (s > 0.55) x.fillRect(Z.mx + ox, Z.my + oy, s > 0.85 ? 3 : 2, 1); }
  { const bx = Z.mx + Math.round(((tP * 6) % (Z.mw + 40)) - 20), byy = Z.my + Z.mh - 22; if (bx > Z.mx && bx < Z.mx + Z.mw - 10) { x.fillStyle = CONTORNO; x.fillRect(bx - 1, byy - 1, 11, 4); x.fillStyle = '#f2f2e8'; x.fillRect(bx, byy, 9, 2); x.fillStyle = '#c8202a'; x.fillRect(bx + 3, byy - 3, 2, 3); x.fillStyle = '#d6eaf0'; x.fillRect(bx - 4, byy + 1, 3, 1); } }
  // hitos de la ciudad (decorado) y nombres de lugares: se ubican una vez por tamaño, esquivando hitos y entre sí
  if (ST.rotK !== k) { ST.rotK = k; const obst = [];
    for (let n = 0; n < NIVELES.length; n++) { const [px, py] = Z.pt(n); obst.push([px - 17, py - 26, 36, 36], [px + 11, py - 43, 21, 26]); }
    ST.decos = []; for (const [kk, u, v] of [['fortaleza', 0.065, 0.62], ['legislativo', 0.33, 0.44], ['estadio', 0.69, 0.47], ['faro', 0.625, 0.86]]) { const [px, py] = Z.P2(u, v); const r = [px - 12, py - 17, 26, 26];
      if (!obst.some((o) => choca(o, r))) { ST.decos.push([kk, px - 11, py - 16]); obst.push(r); } }
    ST.rosa = [Z.mx + Z.mw - 27, Z.my + 5]; obst.push([ST.rosa[0] - 2, ST.rosa[1] - 2, 26, 30]);
    ST.rotulos = []; for (const [t, u, v, col, bor] of [['RÍO DE LA PLATA', 0.6, 2, '#bfe0f0', '#1b3a52'], ['RÍO DE LA PLATA', 0.75, 2, '#bfe0f0', '#1b3a52'], ['RÍO DE LA PLATA', 0.45, 2, '#bfe0f0', '#1b3a52'], ['BAHÍA', 0.19, 0.585, '#bfe0f0', '#1b3a52'], ['CERRO', 0.07, 0.77, '#f2ead8', '#3a3a20'], ['PRADO', 0.2, 0.08, '#8a7656', '#efe4c8'], ['TRES CRUCES', 0.6, 0.3, '#8a7656', '#efe4c8'], ['POCITOS', 0.7, 0.66, '#8a7656', '#efe4c8'], ['BUCEO', 0.9, 0.58, '#8a7656', '#efe4c8'], ['UNIÓN', 0.82, 0.22, '#8a7656', '#efe4c8'], ['PEÑAROL', 0.4, -0.2, '#8a7656', '#efe4c8'], ['COLÓN', 0.15, -0.12, '#8a7656', '#efe4c8']]) {
      if (t[0] === 'R' && ST.rotulos.some((r) => r[0] === t)) continue; const [cx, cy0] = Z.P2(u, v); const cy = v === 2 ? Z.my + Z.mh - 13 : cy0; const w = t.length * 8 + 4; const fondo = v === 2;
      for (const [dx, dy] of [[0, 0], [0, -12], [0, 12], [-24, 0], [24, 0], [0, -24], [0, 24], [-24, -12], [24, 12]]) { const xx = Math.max(Z.mx + 2 + w / 2, Math.min(Z.mx + Z.mw - 2 - w / 2, cx + dx)), yy = cy + dy;
        const r = [xx - w / 2, yy - 2, w, 14]; if (yy < Z.my + 2 || yy > Z.my + Z.mh - (fondo ? 10 : 28) || (fondo && dy < -12) || obst.some((o) => choca(o, r))) continue; ST.rotulos.push([t, Math.round(xx), yy, col, bor]); obst.push(r); break; } } }
  // capa fija de arriba: hitos decorativos, rosa de los vientos, nombres y palitos de las placas corridas
  ST.capaB = capa(ST.capaB, 'B' + W + 'x' + H + '@' + D + ':' + ST.max, W, H, D, (c) => {
  for (const [kk, X, Y] of ST.decos) c.drawImage(ST.iconos[kk].c, X, Y);
  c.drawImage(ST.rosaC || (ST.rosaC = rosa()), ST.rosa[0], ST.rosa[1]);
  for (const [t, X, Y, col, bor] of ST.rotulos) texto(c, t, X, Y, col, 1, 'centro', bor);
  // si una placa se tuvo que correr, un palito la une con el lugar real
  for (let n = 0; n < NIVELES.length; n++) { const [ax, ay] = Z.pin(n), [px, py] = Z.pt(n); if (Math.abs(ax - px) + Math.abs(ay - py) < 6) continue;
    const st = Math.max(Math.abs(px - ax), Math.abs(py + 4 - ay)); for (let q = 0; q <= st; q += 2) { const X = Math.round(ax + (px - ax) * q / st), Y = Math.round(ay + (py + 4 - ay) * q / st); c.fillStyle = CONTORNO; c.fillRect(X - 1, Y - 1, 3, 3); c.fillStyle = '#f2ead8'; c.fillRect(X, Y, 1, 1); }
    c.fillStyle = CONTORNO; c.fillRect(ax - 2, ay - 2, 5, 5); c.fillStyle = n <= ST.max ? '#c8202a' : '#6a6478'; c.fillRect(ax - 1, ay - 1, 3, 3); }
  });
  x.drawImage(ST.capaB.c, 0, 0, W, H);
  // recorrido: los tramos abiertos marchan en dorado, los cerrados en gris punteado
  for (let i = 0; i < NIVELES.length - 1; i++) { const pts = tramo(Z, i); const abierto = i + 1 <= ST.max; const fase = Math.floor(tP * 8);
    for (let q = 1; q < pts.length - 1; q++) { const [px, py] = pts[q]; const on = abierto ? (q + fase) % 4 < 2 : q % 3 === 0; if (!on) continue; const X = Math.round(px), Y = Math.round(py);
      x.fillStyle = CONTORNO; x.fillRect(X - 1, Y - 1, 4, 4); x.fillStyle = abierto ? '#ffd23a' : '#6a6478'; x.fillRect(X, Y, 2, 2); } }
  // hitos de los niveles
  for (let n = 0; n < NIVELES.length; n++) { const nv = NIVELES[n]; const [px, py] = Z.pt(n); const abierto = n <= ST.max, sel = n === ST.sel, ganado = ST.ganados.has(n);
    const sube = sel ? Math.round(Math.sin(tP * 5) * 1.5) - 1 : 0; const X = px - 13, Y = py - 22 + sube;
    // placa
    x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(px - 10, py + 3, 20, 3);
    x.fillStyle = sel ? (Math.floor(tP * 4) % 2 ? '#ffffff' : '#ffd23a') : CONTORNO; x.fillRect(X - 2, Y - 2, 30, 30);
    x.fillStyle = abierto ? (ganado ? '#3a5a2a' : '#3a2a4a') : '#2a2632'; x.fillRect(X - 1, Y - 1, 28, 28); x.fillStyle = abierto ? (ganado ? '#4a7a36' : '#4e3a64') : '#34303e'; x.fillRect(X - 1, Y - 1, 28, 2);
    x.drawImage(abierto ? ST.iconos[nv.id].c : ST.iconos[nv.id].off, X, Y);
    // número del nivel en una chapita
    x.fillStyle = CONTORNO; x.fillRect(X - 4, Y + 18, 11, 11); x.fillStyle = abierto ? '#c8202a' : '#4a4456'; x.fillRect(X - 3, Y + 19, 9, 9); texto(x, String(nv.num), X + 2, Y + 20, '#ffffff', 1, 'centro', null);
    if (!abierto) x.drawImage(ST.candado, X + 18, Y + 18); else if (ganado) x.drawImage(ST.estrella, X + 18, Y + 17); }
  // marcador: la cara del jugador viaja por el recorrido
  { const m = ST.marcador; const i0 = Math.min(NIVELES.length - 2, Math.floor(m)), f = m - i0; let mx, my;
    if (f < 0.001 || m >= NIVELES.length - 1) [mx, my] = Z.pt(Math.round(m)); else { const pts = tramo(Z, i0); const p = pts[Math.round(f * (pts.length - 1))]; mx = p[0]; my = p[1]; }
    const b = Math.round(Math.abs(Math.sin(tP * 6)) * 2); const rt = jugadorSp && jugadorSp.retratoChico; const X = Math.round(mx) + 14, Y = Math.round(my) - 40 - b;
    x.fillStyle = CONTORNO; x.fillRect(X - 1, Y - 1, 17, 17); x.fillStyle = '#ffd23a'; x.fillRect(X, Y, 15, 15); if (rt) x.drawImage(rt, X + 1, Y + 1, 13, 13);
    x.fillStyle = CONTORNO; x.fillRect(X - 1, Y + 15, 6, 3); x.fillRect(X - 3, Y + 18, 4, 2); x.fillStyle = '#ffd23a'; x.fillRect(X, Y + 15, 4, 2); x.fillRect(X - 2, Y + 18, 2, 1); }
  // ---------- ficha del nivel ----------
  const nv = NIVELES[ST.sel]; const abierto = ST.sel <= ST.max; const e = 1 - (1 - ST.tCambio) ** 3; const ox = Math.round((1 - e) * 10);
  const ix = Z.ix + ox, iw = Z.pw; x.fillStyle = CONTORNO; x.fillRect(ix - 1, Z.my - 3, iw + 2, H - Z.my); x.fillStyle = '#2a1a38'; x.fillRect(ix, Z.my - 2, iw, H - Z.my - 2); x.fillStyle = '#3a2650'; x.fillRect(ix, Z.my - 2, iw, 2);
  x.globalAlpha = 0.35 + 0.65 * e;
  // el contenido de la ficha se arma una vez por nivel elegido
  const ganadoSel = ST.ganados.has(ST.sel); ST.capaP = capa(ST.capaP, 'P' + W + 'x' + H + '@' + D + ':' + ST.sel + abierto + ganadoSel, iw + 2, H, D, (c) => { const ix = 0;
  const [tw, th] = tamFoto(Z, H); const fk = nv.id + ':' + tw + 'x' + th; const fo = ST.fotos[fk] || (ST.fotos[fk] = foto(nv, tw, th));
  const fy = Z.my + 2; c.fillStyle = CONTORNO; c.fillRect(ix + 4, fy, tw + 2, th + 2); c.drawImage(fo, ix + 5, fy + 1);
  if (!abierto) { c.fillStyle = 'rgba(20,14,30,0.78)'; c.fillRect(ix + 5, fy + 1, tw, th); c.drawImage(ST.candado, ix + 5 + (tw >> 1) - 7, fy + (th >> 1) - 10, 14, 20); texto(c, 'GANÁ EL NIVEL ' + (nv.num - 1), ix + 5 + (tw >> 1), fy + th - 12, '#c8b8d8', 1, 'centro'); }
  else if (ST.ganados.has(ST.sel)) { c.drawImage(ST.estrella, ix + tw - 9, fy + 3); }
  const maxc = Math.floor((iw - 10) / 8); let yy = fy + th + 6;
  texto(c, 'NIVEL ' + nv.num, ix + 5, yy, '#9a8aa8', 1); yy += 11;
  for (const l of partir(abierto ? nv.nombre : '¿ ? ?', maxc).slice(0, 2)) { texto(c, l, ix + 5, yy, '#ffd23a', 1); yy += 10; }
  if (abierto) for (const l of partir(nv.lugar.split(' · ')[0], maxc).slice(0, 1)) { texto(c, l, ix + 5, yy, '#9ad4ff', 1); yy += 10; }
  yy += 2;
  // hora y dificultad
  const ih = ST.horas[nv.hora] || (ST.horas[nv.hora] = iconoHora(nv.hora)); if (abierto) c.drawImage(ih, ix + 5, yy - 1); texto(c, abierto ? HORA[nv.hora] || '' : '???', abierto ? ix + 20 : ix + 5, yy, '#ffffff', 1);
  yy += 13; const dif = Math.max(1, Math.min(5, 1 + Math.round((nv.dif - 1) / 0.42 * 4)));
  texto(c, 'DIFICULTAD', ix + 5, yy, '#c8b8d8', 1); const dx0 = ix + iw - 5 - 5 * 7;
  for (let q = 0; q < 5; q++) { c.fillStyle = CONTORNO; c.fillRect(dx0 + q * 7, yy, 6, 7); c.fillStyle = q < dif ? (dif >= 4 ? '#ff5a3a' : '#ffd23a') : '#3a2a4a'; c.fillRect(dx0 + q * 7 + 1, yy + 1, 4, 5); }
  yy += 12;
  // jefe
  const jefe = nv.oleadas[nv.oleadas.length - 1].jefe; const ry = Math.round(Math.max(yy, Math.min((yy + Z.volver[1] - 36) / 2, yy + 14)));
  if (ry + 32 <= Z.volver[1] - 2) { c.fillStyle = CONTORNO; c.fillRect(ix + 4, ry, 32, 32); c.fillStyle = abierto ? '#5a2a3a' : '#2a2632'; c.fillRect(ix + 5, ry + 1, 30, 30);
    if (abierto) c.drawImage(retJefe(jefe), ix + 5, ry + 1, 30, 30); else texto(c, '?', ix + 20, ry + 11, '#7a6a8a', 1, 'centro');
    texto(c, 'JEFE', ix + 41, ry + 4, '#ff5a4a', 1); const nl = partir(abierto ? NOMBRE_JEFE[jefe] || jefe.toUpperCase() : '???', Math.floor((iw - 46) / 8)); nl.slice(0, 2).forEach((l, q) => texto(c, l, ix + 41, ry + 15 + q * 10, '#ffffff', 1)); }
  });
  x.drawImage(ST.capaP.c, Z.ix + ox, 0, iw + 2, H);
  x.globalAlpha = 1;
  boton(x, Z.volver, 'VOLVER', false, '#ffd23a', false); boton(x, Z.dale, abierto ? '¡DALE!' : 'CERRADO', abierto && Math.floor(tP * 2) % 2 === 0, '#7ae07a', !abierto);
  // fundidos de entrada y de salida
  const neg = ST.salida >= 0 ? Math.min(1, ST.salida / 0.4) : 1 - ST.entrada; if (neg > 0) { x.fillStyle = `rgba(10,6,16,${neg.toFixed(3)})`; x.fillRect(0, 0, W, H); }
}
