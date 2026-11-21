// Pincel común de los escenarios: primitivas (rect, borde, texto, ventanas, cables), una letra chica 3×5 para
// cartelería, módulos de fachada reutilizables y la gradación de color por hora del día.
// Escala real en todos los niveles: 56 px = 1 m; la base de las fachadas está en y = 168 (vereda de atrás).
import { textoCanvas, tono, lienzo, hex } from '../pixel.js';

export const M = 56, Y0 = 168;
export const alto = (m) => Math.round(Y0 - m * M);

// letra chica 3×5 (carteles, precios, grafitis chicos)
const F3 = { A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', Ñ: '111000110101101', O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010', Z: '111001010100111',
  0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110', 4: '101101111001001', 5: '111100110001110', 6: '011100111101111', 7: '111001010010010', 8: '111101111101111', 9: '111101111001110', $: '011110010011110', '.': '000000000000010', ',': '000000000010100', '-': '000000111000000', '!': '010010010000010', '¡': '010000010010010', '?': '110001010000010', '¿': '010000010100011', '/': '001001010100100', ':': '000010000010000', "'": '010010000000000', '+': '000010111010000', '%': '101001010100101', '#': '101111101111101', ' ': '000000000000000', '·': '000000010000000', '&': '010101010101011', '"': '101101000000000', '(': '010100100100010', ')': '010001001001010' };
const DESAC = { Á: 'A', É: 'E', Í: 'I', Ó: 'O', Ú: 'U', Ü: 'U' };

export function herramientas(x, r) {
  const R = (a, b, w, h, c) => { x.fillStyle = c; x.fillRect(Math.round(a), Math.round(b), Math.round(w), Math.round(h)); };
  const O = (a, b, w, h, c, borde = '#1b1220') => { R(a, b, w, h, borde); R(a + 1, b + 1, w - 2, h - 2, c); };
  const T = (s, a, b, c = '#fff', esc = 1, alin = 'izq', borde = '#1b1220') => {
    const t = textoCanvas(s, c, esc, borde); let dx = a - t._ox; if (alin === 'centro') dx = a - (t.width >> 1);
    x.drawImage(t, Math.round(dx), Math.round(b - t._oy));
  };
  // texto chico 3×5 (4 px por letra). alin: 'izq' | 'centro'
  const chico = (s, a, b, c = '#1b1220', alin = 'izq', esc = 1) => {
    s = String(s).toUpperCase(); const w = s.length * 4 * esc - esc; let x0 = Math.round(alin === 'centro' ? a - w / 2 : a); x.fillStyle = c;
    for (const ch0 of s) { const ch = DESAC[ch0] || ch0; const g = F3[ch] || F3['?']; for (let i = 0; i < 15; i++) if (g[i] === '1') x.fillRect(x0 + (i % 3) * esc, Math.round(b) + ((i / 3) | 0) * esc, esc, esc); x0 += 4 * esc; }
    return w;
  };
  const V = (a, b, w, h, luz = false, cortina = null, vidrio = '#4d4060', brillo = '#f0a070') => {
    O(a, b, w, h, '#3a2a3a'); R(a + 2, b + 2, w - 4, h - 4, luz ? '#ffcf7a' : vidrio);
    if (!luz) { R(a + 2, b + 2, w - 4, 2, brillo); R(a + 3, b + 5, 2, h - 8, tono(vidrio, 1.3)); }
    if (cortina) R(a + 2, b + 2, (w - 4) >> 1, h - 4, cortina);
    R(a + (w >> 1), b + 1, 1, h - 2, '#3a2a3a'); R(a - 1, b + h, w + 2, 2, '#e8d8c8');
  };
  const cable = (x0, y0, x1, y1, caida, c = '#241826') => {
    x.fillStyle = c; const n = Math.max(2, Math.abs(x1 - x0)); let py = null;
    for (let i = 0; i <= n; i++) { const t = i / n; const xx = Math.round(x0 + (x1 - x0) * t), yy = Math.round(y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * caida); if (py !== null && Math.abs(yy - py) > 1) x.fillRect(xx, Math.min(yy, py), 1, Math.abs(yy - py)); x.fillRect(xx, yy, 1, 1); py = yy; }
  };
  // ---- módulos de fachada (todos a escala) ----
  const pared = (a, w, top, c, { ladrillo = false, zocalo = true, manchas = true } = {}) => {
    R(a, top, w, Y0 - top, c); if (top > -38) R(a, top, w, 2, tono(c, 1.15));
    if (zocalo) { R(a, 160, w, 8, tono(c, 0.72)); R(a, 159, w, 1, tono(c, 1.1)); }
    if (ladrillo) for (let yy = top + 4; yy < 159; yy += 5) for (let xx = a + ((Math.floor((yy - top) / 5)) & 1) * 6; xx < a + w; xx += 12) R(xx, yy, 11, 4, tono(c, r() < 0.5 ? 0.92 : 1.04));
    for (let i = 0; i < w * (Y0 - top) / 50; i++) R(a + r() * w, top + r() * (Y0 - top), 1, 1, tono(c, r() < 0.5 ? 0.9 : 1.07));
    if (manchas) for (let i = 0; i < w / 60; i++) { const fx = a + r() * w, fy = top + 10 + r() * 100; let cx = fx; for (let k = 0; k < 14; k++) { R(cx, fy + k, 1, 1, tono(c, 0.78)); cx += Math.round((r() - 0.5) * 2); } }
    if (manchas) for (let xx = a; xx < a + w; xx++) { const hgt = 8 + Math.round(Math.sin(xx * 0.05) * 3 + Math.sin(xx * 0.013) * 5); R(xx, 159 - hgt, 1, hgt, 'rgba(40,30,50,0.10)'); }
    luzPared(a, w, top);
  };
  // volumen de la pared: luz de arriba que se apaga hacia abajo (tramado) y oclusión en la base
  const luzPared = (a, w, top) => {
    const t0 = Math.max(top, -40); for (let yy = t0; yy < Y0; yy += 2) { const k = (yy - t0) / (Y0 - t0); if (k < 0.25) { x.fillStyle = 'rgba(255,248,230,' + (0.07 * (1 - k / 0.25)).toFixed(3) + ')'; x.fillRect(a, yy, w, 2); } if (k > 0.72) { x.fillStyle = 'rgba(30,18,40,' + (0.16 * (k - 0.72) / 0.28).toFixed(3) + ')'; x.fillRect(a, yy, w, 2); } }
    for (let xx = a; xx < a + w; xx += 2) { R(xx + ((xx >> 1) & 1), Y0 - 10, 1, 1, 'rgba(30,18,40,0.18)'); }
  };
  const cornisa = (a, w, y, c) => { R(a - 3, y - 1, w + 6, 1, '#1b1220'); R(a - 3, y, w + 6, 4, tono(c, 1.12)); R(a - 3, y + 4, w + 6, 2, tono(c, 0.7)); for (let k = a; k < a + w; k += 8) R(k, y + 6, 4, 3, tono(c, 0.82)); R(a, y + 9, w, 3, 'rgba(30,18,40,0.14)'); };
  const ventana = (a, w, { top = alto(2.2), sill = alto(0.95), luz = false, cortina = null, reja = false, persiana = 0, marco = '#e8d8c8', vidrio, brillo } = {}) => {
    const h = sill - top; O(a - 3, top - 3, w + 6, h + 6, marco); V(a, top, w, h, luz, cortina, vidrio, brillo);
    if (persiana) { const ph = Math.round(h * persiana); R(a + 1, top + 1, w - 2, ph, '#8a7a6a'); for (let yy = top + 2; yy < top + ph; yy += 3) R(a + 1, yy, w - 2, 1, '#6a5a4a'); R(a + 1, top + ph - 1, w - 2, 2, '#4a3a2a'); }
    if (reja) { for (let xx = a + 4; xx < a + w - 2; xx += 7) R(xx, top, 2, h, '#2a2230'); R(a, top + (h >> 1), w, 2, '#2a2230'); for (let xx = a + 4; xx < a + w - 2; xx += 14) R(xx - 2, top + (h >> 1) - 3, 6, 2, '#2a2230'); }
    R(a - 5, sill + 3, w + 10, 4, tono(marco, 0.93)); R(a - 5, sill + 7, w + 10, 1, tono(marco, 0.66));
  };
  const puerta = (a, w, c, { vidrio = false, altoM = 2.1, numero = null, marco = '#e8dccc' } = {}) => {
    const top = alto(altoM); O(a - 4, top - 4, w + 8, Y0 - top + 4, marco); O(a, top, w, Y0 - top, c);
    const ban = 18; R(a + 2, top + 2, w - 4, ban, '#3a2c3a'); R(a + 3, top + 3, w - 6, 3, '#f0a070'); R(a + (w >> 1), top + 2, 1, ban, marco);
    if (vidrio) { R(a + 4, top + ban + 6, w - 8, Y0 - top - ban - 14, '#5a6a80'); R(a + 6, top + ban + 8, 3, 60, '#9ab0c8'); }
    else { O(a + 6, top + ban + 8, w - 12, 34, tono(c, 0.9)); O(a + 6, top + ban + 48, w - 12, 40, tono(c, 0.9)); }
    R(a + w - 9, alto(1.0), 5, 3, '#e8c040'); R(a + w - 7, alto(1.0) - 4, 2, 4, '#c8a030');
    R(a - 6, Y0 - 3, w + 12, 3, '#b8b0b8');
    if (numero) { O(a + (w >> 1) - 19, top - 20, 38, 13, '#2a5aa0'); T(numero, a + (w >> 1), top - 18, '#ffffff', 1, 'centro', null); }
  };
  const aire = (a, b) => { O(a, b, 46, 26, '#d0ccc6'); for (let k = 3; k < 30; k += 3) R(a + k, b + 4, 1, 18, '#8a8690'); O(a + 32, b + 6, 12, 12, '#9a96a0'); R(a + 6, b + 26, 2, 30, '#5a5a62'); };
  const maceta = (a, g = 1) => { const w = Math.round(18 * g), h = Math.round(20 * g); O(a, Y0 - h, w, h, '#b8603a'); R(a + 1, Y0 - h + 1, w - 2, 3, '#d8805a'); for (let k = 0; k < 16; k++) { x.fillStyle = k % 2 ? '#3f7a3a' : '#5aa040'; x.fillRect(Math.round(a + 1 + r() * (w - 2)), Math.round(Y0 - h - 2 - r() * 22 * g), 2, 4 + Math.round(r() * 4)); } };
  const grafiti = (a, b, w, txt, c1, c2, esc = 1) => {
    const cols = ['#e04a8a', '#4ad0e0', '#f0d040', '#6ae06a', '#ff7a3a'];
    for (let i = 0; i < w / 3; i++) { x.fillStyle = cols[Math.floor(r() * cols.length)]; x.fillRect(Math.round(a + r() * w), Math.round(b + r() * 26), 2 + Math.floor(r() * 5), 1 + Math.floor(r() * 3)); }
    if (txt) T(txt, a + w / 2, b + 6, c1, esc, 'centro', c2);
  };
  // tag: firma de aerosol chica y cursiva
  const tag = (a, b, c) => { x.fillStyle = c; for (let k = 0; k < 22; k++) x.fillRect(Math.round(a + k * 1.5), Math.round(b + Math.sin(k * 1.3 + a) * 4), 2, 2); };
  const afiche = (a, b, t, c, sub = null) => { const w = Math.max(t.length * 4 + 8, 30); O(a, b, w, sub ? 22 : 16, c); R(a + 1, b + 1, w - 2, 3, '#c8202a'); chico(t, a + w / 2, b + 6, '#1b1220', 'centro'); if (sub) chico(sub, a + w / 2, b + 13, '#5a3a4a', 'centro'); x.clearRect(a + w - 4, b + (sub ? 18 : 12), 4, 4); return w; };
  const toldo = (a, w, y, c1, c2, h = 14) => { for (let k = 0; k < w; k += 8) R(a + k, y, Math.min(8, w - k), h, (k / 8) % 2 ? c2 : c1); R(a, y + h, w, 2, tono(c1, 0.6)); for (let k = 0; k < w; k += 8) R(a + k + 1, y + h + 2, 6, 3, (k / 8) % 2 ? c2 : c1); R(a, y, w, 1, tono(c1, 1.25)); R(a, y + h + 5, w, 6, 'rgba(30,14,40,0.18)'); R(a, y + h + 11, w, 4, 'rgba(30,14,40,0.08)'); };
  const persianaMetal = (a, w, top, c = '#8a8a92', tags = true) => { O(a, top, w, Y0 - top, c); for (let yy = top + 2; yy < Y0 - 2; yy += 4) { R(a + 1, yy, w - 2, 1, tono(c, 0.75)); R(a + 1, yy + 1, w - 2, 1, tono(c, 1.1)); } R(a + (w >> 1) - 3, Y0 - 8, 6, 3, '#3a3a40'); if (tags) { tag(a + 6, top + 20, '#1b1220'); tag(a + w - 40, top + 40, '#c8202a'); } };
  const cartel = (a, b, w, h, fondo, txt, color, { borde = '#1b1220', esc = 1, sub = null, subc = null } = {}) => { O(a, b, w, h, fondo, borde); R(a + 1, b + 1, w - 2, 1, tono(fondo, 1.25)); if (txt) T(txt, a + w / 2, b + Math.round((h - 8 * esc) / 2) - (sub ? 4 : 0), color, esc, 'centro', null); if (sub) chico(sub, a + w / 2, b + h - 8, subc || color, 'centro'); };
  // poste de luz de la IMM con brazo y luminaria (devuelve la posición de la lámpara para el brillo nocturno)
  const columnaLuz = (px, { brazo = 1, colonial = false } = {}) => {
    if (colonial) { R(px - 2, alto(3.4), 5, Y0 - alto(3.4) + 6, '#2a2a30'); R(px - 4, Y0 - 4, 9, 10, '#2a2a30'); O(px - 7, alto(3.4) - 18, 15, 18, '#3a3a40'); R(px - 5, alto(3.4) - 16, 11, 13, '#ffe0a0'); R(px - 8, alto(3.4) - 21, 17, 4, '#2a2a30'); return [px, alto(3.4) - 10]; }
    R(px, -40, 5, Y0 + 46, '#6a6a72'); R(px, -40, 1, Y0 + 46, '#9a9aa2'); const bx = px + brazo * 30; R(Math.min(px, bx), -10, 31, 3, '#6a6a72'); O(bx - 8, -8, 16, 6, '#4a4a52'); R(bx - 6, -2, 12, 2, '#ffe8b0'); return [bx, 0];
  };
  const arbol = (tx, ty = 40, s = 1) => { // plátano de vereda: tronco manchado y copa que asoma
    R(tx, ty, 8 * s, Y0 + 2 - ty, '#7a6a5a'); for (let k = 0; k < 10; k++) R(tx + r() * 6 * s, ty + r() * (Y0 - ty), 3, 4, r() < 0.5 ? '#a89a7a' : '#5a4a3a');
    for (let k = 0; k < 26; k++) { const cx = tx + 4 + (r() - 0.5) * 90 * s, cy = ty - 30 + (r() - 0.5) * 50 * s; x.fillStyle = k < 12 ? '#3a5a2e' : k < 20 ? '#4f7a36' : '#6a9a40'; const rr = (6 + r() * 9) * s; for (let a2 = -rr; a2 <= rr; a2++) { const hh = Math.round(Math.sqrt(rr * rr - a2 * a2) * 0.8); x.fillRect(Math.round(cx + a2), Math.round(cy - hh), 1, hh * 2); } }
  };
  const zapas = (zx, zy) => { R(zx, zy, 1, 10, '#241826'); R(zx + 5, zy, 1, 12, '#241826'); O(zx - 4, zy + 10, 10, 6, '#f2f2f2'); O(zx + 2, zy + 12, 10, 6, '#f2f2f2'); R(zx - 3, zy + 13, 8, 1, '#c8202a'); R(zx + 3, zy + 15, 8, 1, '#c8202a'); };
  const charco = (cx3, cy3, w, cols) => {
    for (let j = 0; j < 7; j++) { const t = j / 6; const ww = Math.round(w * Math.sqrt(1 - (t * 2 - 1) ** 2)); x.fillStyle = cols[j % cols.length]; x.fillRect(Math.round(cx3 - ww / 2), cy3 + j, ww, 1); }
    R(cx3 - w / 4, cy3 + 2, w / 6, 1, tono(cols[0], 1.3)); R(cx3 - w / 2 + 3, cy3 - 1, w - 6, 1, '#3a3446');
  };
  return { R, O, T, chico, V, cable, luzPared, pared, cornisa, ventana, puerta, aire, maceta, grafiti, tag, afiche, toldo, persianaMetal, cartel, columnaLuz, arbol, zapas, charco };
}

// calle estándar: vereda de atrás, cordón, asfalto, vereda de adelante (colores neutros de día)
export function pisoCalle(x, r, L, H, o = {}) {
  const { R } = H; const vered = o.vereda || '#a8a2aa', asf = o.asfalto || '#55505e';
  R(0, 168, L, 34, vered);
  for (let yy = 170; yy < 200; yy += 8) R(0, yy, L, 1, tono(vered, 0.86));
  for (let yy = 170, k = 0; yy < 200; yy += 8, k++) for (let xx = (k % 2) * 8; xx < L; xx += 16) R(xx, yy, 1, 8, tono(vered, 0.86));
  for (let i = 0; i < L / 6; i++) R(r() * L, 170 + r() * 30, 1, 1, r() < 0.5 ? tono(vered, 1.1) : tono(vered, 0.8));
  for (let i = 0; i < L / 25; i++) { const bx = Math.floor(r() * L / 16) * 16, by = 170 + Math.floor(r() * 4) * 8; R(bx + 1, by + 1, 15, 7, r() < 0.5 ? tono(vered, 0.92) : tono(vered, 1.05)); if (r() < 0.4) { R(bx + 3, by + 3, 6, 1, tono(vered, 0.7)); R(bx + 8, by + 4, 4, 1, tono(vered, 0.7)); } }
  R(0, 200, L, 3, tono(vered, 1.18)); R(0, 203, L, 5, tono(vered, 0.66)); R(0, 208, L, 1, '#3a3446');
  if (o.adoquin) { // adoquines de granito (Ciudad Vieja)
    R(0, 209, L, 44, o.adoquin);
    for (let yy = 209, k = 0; yy < 253; yy += 5, k++) { R(0, yy, L, 1, tono(o.adoquin, 0.7)); for (let xx = (k % 2) * 5; xx < L; xx += 10) { R(xx, yy, 1, 5, tono(o.adoquin, 0.7)); if (r() < 0.35) R(xx + 2, yy + 1, 5, 1, tono(o.adoquin, 1.15)); if (r() < 0.12) R(xx + 1, yy + 2, 8, 2, tono(o.adoquin, r() < 0.5 ? 0.88 : 1.08)); } }
  } else {
    R(0, 209, L, 44, asf);
    for (let i = 0; i < L / 2.2; i++) R(r() * L, 209 + r() * 44, 1 + (r() < 0.2), 1, r() < 0.5 ? tono(asf, 1.12) : tono(asf, 0.86));
    for (let i = 0; i < L / 90; i++) { let cx = r() * L, cy = 212 + r() * 36; x.fillStyle = tono(asf, 0.7); for (let k = 0; k < 18; k++) { x.fillRect(Math.round(cx), Math.round(cy), 1, 1); cx += 1; cy += (r() - 0.5) * 2; } }
    for (let i = 0; i < L / 200; i++) { const px3 = r() * L, py3 = 212 + r() * 30; R(px3, py3, 20 + r() * 20, 6 + r() * 6, tono(asf, 0.9)); }
    if (o.linea) for (let xx = 0; xx < L; xx += 48) R(xx, 230, 26, 2, o.linea);
  }
  for (let gx = 180; gx < L; gx += 520) { H.O(gx, 238, 26, 6, '#2a2430'); for (let k = 2; k < 25; k += 3) R(gx + k, 239, 1, 4, '#6a6276'); }
  R(0, 252, L, 2, tono(vered, 1.18)); R(0, 254, L, 16, tono(vered, 0.95));
  for (let xx = 0; xx < L; xx += 14) R(xx, 254, 1, 16, tono(vered, 0.8)); R(0, 262, L, 1, tono(vered, 0.8));
  for (let i = 0; i < L / 30; i++) { x.fillStyle = ['#d89a3a', '#c07a2a', '#e8b050'][i % 3]; x.fillRect(Math.round(r() * L), Math.round(255 + r() * 12), 2, 1); }
  for (let i = 0; i < L / 18; i++) { const gx = r() * L; x.fillStyle = r() < 0.5 ? '#5a8a3a' : '#7aa040'; x.fillRect(Math.round(gx), 166 + Math.round(r() * 2), 1, 3); }
}
// postes de madera con maraña de cables (barrio)
export function postes(x, r, L, H, desde = 120) {
  const { R, O, cable } = H; const ps = [];
  for (let px = desde; px < L; px += 330 + Math.floor(r() * 60)) ps.push(px);
  for (let i = 0; i < ps.length; i++) {
    const p = ps[i];
    R(p, -40, 8, 238, '#5a463e'); R(p, -40, 2, 238, '#7a6052'); R(p - 16, -30, 40, 5, '#5a463e');
    R(p - 3, -6, 14, 16, '#4a4a52'); R(p - 1, -4, 10, 2, '#6a6a72');
    O(p - 2, alto(1.6), 12, 16, ['#f0f0e0', '#f0d040', '#f08aa0'][i % 3]); R(p - 1, alto(2.8), 10, 3, '#c8c8d0');
    if (i + 1 < ps.length) { const q = ps[i + 1]; cable(p - 14, -28, q - 14, -28, 44); cable(p + 20, -28, q + 20, -28, 50); cable(p + 4, 4, q + 4, 6, 30, '#1b1220'); }
    cable(p - 14, -28, p - 70, 12, 8); cable(p + 20, -24, p + 80, 14, 10);
    for (let k = 0; k < 5; k++) cable(p - 2, 8 + k, p + 10, 14 + k * 2, 3 + k, '#1b1220');
  }
  return ps;
}

// ---- gradación de color por hora: se aplica una vez al lienzo pintado en colores de día ----
// mul: multiplicador por canal, add: suma por canal, sat: saturación, gam: gamma (oscurece medios si > 1)
export const GRADOS = {
  atardecer: null, // el nivel 1 ya está pintado con su luz
  manana: { mul: [1.0, 1.0, 1.04], add: [6, 4, 0], sat: 1.05, gam: 0.96 },
  mediodia: { mul: [1.04, 1.02, 0.98], add: [8, 6, 0], sat: 1.08, gam: 0.94 },
  noche: { mul: [0.34, 0.38, 0.62], add: [6, 6, 22], sat: 0.7, gam: 1.15 },
  gris: { mul: [0.82, 0.84, 0.92], add: [10, 10, 18], sat: 0.72, gam: 1.0 },
  tormenta: { mul: [0.42, 0.48, 0.62], add: [10, 12, 22], sat: 0.6, gam: 1.1 },
};
export function gradar(cv, g, y0 = 0) {
  if (!g) return; const x = cv.getContext('2d'); const img = x.getImageData(0, y0, cv.width, cv.height - y0); const d = img.data;
  const lut = [0, 1, 2].map((c) => { const t = new Uint8ClampedArray(256); for (let v = 0; v < 256; v++) t[v] = Math.round(255 * Math.pow((v * g.mul[c] + g.add[c]) / 255, g.gam || 1)); return t; });
  const s = g.sat ?? 1;
  for (let i = 0; i < d.length; i += 4) { if (!d[i + 3]) continue; let r = d[i], gg = d[i + 1], b = d[i + 2]; if (s !== 1) { const l = 0.3 * r + 0.59 * gg + 0.11 * b; r = l + (r - l) * s; gg = l + (gg - l) * s; b = l + (b - l) * s; r = r < 0 ? 0 : r > 255 ? 255 : r; gg = gg < 0 ? 0 : gg > 255 ? 255 : gg; b = b < 0 ? 0 : b > 255 ? 255 : b; }
    d[i] = lut[0][r | 0]; d[i + 1] = lut[1][gg | 0]; d[i + 2] = lut[2][b | 0]; }
  x.putImageData(img, 0, y0);
}
// halo de luz con tramado (para faroles, ventanas y carteles de noche): se pinta encima después de gradar
const halos = new Map();
export function halo(rad, color, fuerza = 0.5) {
  const k = rad + color + fuerza; let h = halos.get(k); if (h) return h;
  const [cv, x] = lienzo(rad * 2, rad * 2); const [cr, cg, cb] = hex(color);
  for (let y = 0; y < rad * 2; y++) for (let xx = 0; xx < rad * 2; xx++) { const d = Math.hypot(xx - rad + 0.5, (y - rad + 0.5) * 1.3) / rad; if (d >= 1) continue; const a = (1 - d) * (1 - d) * fuerza; const lvl = Math.round(a * 6) / 6; if ((xx + y) % 2 && a < 0.12) continue; x.fillStyle = `rgba(${cr},${cg},${cb},${lvl.toFixed(3)})`; x.fillRect(xx, y, 1, 1); }
  halos.set(k, cv); return cv;
}
