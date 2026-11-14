// Nivel 1: "La cuadra del Cana" — calle de barrio montevideano al atardecer.
// Se pre-renderiza todo en lienzos grandes (cielo, lejos, medio, calle) para que cada cuadro sea barato.
import { lienzo, textoCanvas, rng, tono } from './pixel.js';

export const PISO = { arriba: 182, abajo: 266 }; // rango de "y" (profundidad) caminable
export const ALTO = 270;
export const EXTRA = 40; // la capa de la calle tiene 40 px más arriba (fachadas que siguen)

function herramientas(x) {
  const R = (a, b, w, h, c) => { x.fillStyle = c; x.fillRect(Math.round(a), Math.round(b), Math.round(w), Math.round(h)); };
  const O = (a, b, w, h, c, borde = '#1b1220') => { R(a, b, w, h, borde); R(a + 1, b + 1, w - 2, h - 2, c); };
  const T = (s, a, b, c = '#fff', esc = 1, alin = 'izq', borde = '#1b1220') => {
    const t = textoCanvas(s, c, esc, borde); let dx = a - t._ox; if (alin === 'centro') dx = a - (t.width >> 1);
    x.drawImage(t, Math.round(dx), Math.round(b - t._oy));
  };
  // ventana con marco, vidrio y reflejo de atardecer
  const V = (a, b, w, h, luz = false, cortina = null) => {
    O(a, b, w, h, '#3a2a3a'); R(a + 2, b + 2, w - 4, h - 4, luz ? '#ffcf7a' : '#4d4060');
    if (!luz) { R(a + 2, b + 2, w - 4, 2, '#f0a070'); R(a + 3, b + 5, 2, h - 8, '#7a6080'); }
    if (cortina) R(a + 2, b + 2, (w - 4) >> 1, h - 4, cortina);
    R(a + (w >> 1), b + 1, 1, h - 2, '#3a2a3a'); R(a - 1, b + h, w + 2, 2, '#e8d8c8');
  };
  // cable caído (catenaria) entre dos puntos
  const cable = (x0, y0, x1, y1, caida, c = '#241826') => {
    x.fillStyle = c; const n = Math.max(2, Math.abs(x1 - x0)); let py = null;
    for (let i = 0; i <= n; i++) { const t = i / n; const xx = Math.round(x0 + (x1 - x0) * t), yy = Math.round(y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * caida); if (py !== null && Math.abs(yy - py) > 1) x.fillRect(xx, Math.min(yy, py), 1, Math.abs(yy - py)); x.fillRect(xx, yy, 1, 1); py = yy; }
  };
  return { R, O, T, V, cable };
}

// ---------------- CIELO ----------------
export function cielo(w, h) {
  const [cv, x] = lienzo(w, h);
  const off = h - ALTO;
  const bandas = [[0, '#3a2f6a'], [16, '#56397a'], [32, '#7e4580'], [48, '#a8507a'], [62, '#d0606a'], [76, '#e8785e'], [90, '#f49660'], [104, '#f8b468'], [118, '#ffcc7a'], [132, '#ffdc90']];
  for (let y = 0; y < h; y++) {
    const yy = y - off; let c = bandas[0][1];
    for (const [b, cc] of bandas) if (yy >= b) c = cc;
    x.fillStyle = c; x.fillRect(0, y, w, 1);
    // dithering entre bandas
    for (let i = 1; i < bandas.length; i++) if (yy === bandas[i][0] - 1 || yy === bandas[i][0] - 3) { x.fillStyle = bandas[i][1]; for (let xx = (yy & 1); xx < w; xx += 2) x.fillRect(xx, y, 1, 1); }
  }
  if (off > 0) { x.fillStyle = '#2e2860'; x.fillRect(0, 0, w, off); }
  // nubes alargadas rosadas
  const r = rng(7);
  for (let i = 0; i < 9; i++) {
    const cy = off + 30 + r() * 90, cx = r() * w, L = 40 + r() * 90;
    x.fillStyle = cy - off > 100 ? '#f7a07a' : '#c86a8a'; x.fillRect(Math.round(cx), Math.round(cy), Math.round(L), 2);
    x.fillStyle = cy - off > 100 ? '#ffc890' : '#e08a9a'; x.fillRect(Math.round(cx + 6), Math.round(cy - 1), Math.round(L * 0.6), 1);
  }
  return cv;
}
// sol (se dibuja con parallax casi nulo)
export function sol() {
  const [cv, x] = lienzo(44, 44); const c = 22;
  for (let y = 0; y < 44; y++) for (let xx = 0; xx < 44; xx++) { const d = Math.hypot(xx - c + 0.5, y - c + 0.5); if (d < 20) { x.fillStyle = d < 15 ? '#fff2b0' : '#ffd88a'; x.fillRect(xx, y, 1, 1); } }
  x.clearRect(0, 26, 44, 1); x.clearRect(0, 30, 44, 2); x.clearRect(0, 35, 44, 3);
  return cv;
}

// ---------------- LEJOS: skyline con el Palacio Salvo ----------------
export function lejos(ancho) {
  const [cv, x] = lienzo(ancho, ALTO); const { R } = herramientas(x); const r = rng(3);
  const c1 = '#a5607e', c2 = '#8c5274', vent = '#c7849a', vluz = '#ffd38a';
  let px = 0;
  while (px < ancho) {
    const w = 26 + Math.floor(r() * 40), h = 40 + Math.floor(r() * 70), top = 172 - h;
    R(px, top, w, h, r() < 0.5 ? c1 : c2);
    for (let wy = top + 5; wy < 165; wy += 6) for (let wx = px + 3; wx < px + w - 3; wx += 5) if (r() < 0.55) R(wx, wy, 2, 3, r() < 0.12 ? vluz : vent);
    if (r() < 0.3) R(px + (w >> 1), top - 8, 1, 8, c2);
    px += w + Math.floor(r() * 6);
  }
  // Palacio Salvo (silueta)
  const sx = 300;
  R(sx, 92, 60, 80, '#7d4868'); R(sx + 12, 62, 36, 30, '#7d4868'); R(sx + 18, 44, 24, 18, '#7d4868'); R(sx + 22, 30, 16, 14, '#7d4868'); R(sx + 26, 22, 8, 8, '#7d4868'); R(sx + 29, 12, 2, 10, '#7d4868');
  for (let wy = 96; wy < 166; wy += 6) for (let wx = sx + 4; wx < sx + 56; wx += 5) R(wx, wy, 2, 3, r() < 0.15 ? vluz : '#a56a88');
  for (let wy = 66; wy < 90; wy += 6) for (let wx = sx + 15; wx < sx + 46; wx += 5) R(wx, wy, 2, 3, '#a56a88');
  R(sx + 29, 10, 2, 2, '#ff6a5a');
  // otra copia más adelante
  R(sx + 820, 120, 30, 52, '#7d4868'); R(sx + 826, 100, 18, 20, '#7d4868');
  return cv;
}

// ---------------- MEDIO: edificios más cercanos, árboles ----------------
export function medio(ancho) {
  const [cv, x] = lienzo(ancho, ALTO); const { R } = herramientas(x); const r = rng(11);
  let px = 0;
  while (px < ancho) {
    const w = 50 + Math.floor(r() * 50), h = 60 + Math.floor(r() * 60), top = 176 - h;
    const base = ['#c07a7e', '#b56f80', '#cc8a80', '#a8667a'][Math.floor(r() * 4)];
    R(px, top, w, h, base); R(px, top, w, 2, tono(base, 1.2)); R(px + w - 3, top, 3, h, tono(base, 0.82));
    for (let wy = top + 6; wy < 168; wy += 11) for (let wx = px + 5; wx < px + w - 8; wx += 10) { R(wx, wy, 6, 7, '#6a4a64'); R(wx, wy, 6, 1, '#f0a070'); if (r() < 0.1) R(wx, wy, 6, 7, '#ffcf7a'); }
    if (r() < 0.4) { R(px + 6, top - 10, 14, 10, '#7a5a6a'); R(px + 8, top - 12, 10, 2, '#8a6a7a'); } // tanque de agua
    px += w + Math.floor(r() * 30);
  }
  // árboles (plátanos) en el medio
  for (let i = 0; i < ancho / 140; i++) {
    const tx = 40 + i * 140 + r() * 40; const ty = 120 + r() * 20;
    R(tx + 10, ty + 10, 4, 50, '#5a3a3a');
    for (let k = 0; k < 14; k++) { const cx = tx + r() * 26, cy = ty - 10 + r() * 26, rr = 6 + r() * 6; x.fillStyle = k < 8 ? '#3f6a3a' : '#5a8a40'; x.beginPath(); for (let a = 0; a < rr; a++) x.fillRect(Math.round(cx - rr + a), Math.round(cy - Math.sqrt(rr * rr - (a - rr / 2) ** 2) / 1.3), 1, Math.round(Math.sqrt(rr * rr - (a - rr / 2) ** 2) * 1.4)); }
  }
  return cv;
}

// ---------------- CALLE (capa principal) ----------------
export function calle(L) {
  const [cv, x] = lienzo(L, ALTO + EXTRA); x.translate(0, EXTRA); const { R, O, T, V, cable } = herramientas(x); const r = rng(21);
  // --- vereda de atrás ---
  R(0, 168, L, 34, '#a29aa6');
  for (let yy = 170; yy < 200; yy += 8) R(0, yy, L, 1, '#8a8090');
  for (let yy = 170, k = 0; yy < 200; yy += 8, k++) for (let xx = (k % 2) * 8; xx < L; xx += 16) R(xx, yy, 1, 8, '#8a8090');
  for (let i = 0; i < L / 6; i++) R(r() * L, 170 + r() * 30, 1, 1, r() < 0.5 ? '#b8aeb8' : '#7a7080');
  // cordón
  R(0, 200, L, 3, '#c8beca'); R(0, 203, L, 5, '#6a6276'); R(0, 208, L, 1, '#3a3446');
  // --- asfalto ---
  R(0, 209, L, 44, '#4e4658');
  for (let i = 0; i < L / 2.2; i++) R(r() * L, 209 + r() * 44, 1 + (r() < 0.2), 1, r() < 0.5 ? '#5c5468' : '#433c4e');
  for (let i = 0; i < L / 90; i++) { let cx = r() * L, cy = 212 + r() * 36; x.fillStyle = '#342e3e'; for (let k = 0; k < 18; k++) { x.fillRect(Math.round(cx), Math.round(cy), 1, 1); cx += 1; cy += (r() - 0.5) * 2; } } // grietas
  // reflejo cálido del atardecer en el asfalto
  for (let xx = 0; xx < L; xx += 2) if (r() < 0.25) R(xx, 210, 1, 1, '#8a6a78');
  // rejillas / alcantarillas
  for (let gx = 180; gx < L; gx += 520) { O(gx, 238, 26, 6, '#2a2430'); for (let k = 2; k < 25; k += 3) R(gx + k, 239, 1, 4, '#6a6276'); }
  for (let gx = 430; gx < L; gx += 700) { x.fillStyle = '#2a2430'; R(gx, 222, 18, 7, '#2a2430'); R(gx + 1, 223, 16, 5, '#5a5266'); R(gx + 3, 225, 12, 1, '#433c4e'); }
  // --- vereda de adelante ---
  R(0, 252, L, 2, '#c8beca'); R(0, 254, L, 16, '#9e96a2');
  for (let xx = 0; xx < L; xx += 14) R(xx, 254, 1, 16, '#857c8c'); R(0, 262, L, 1, '#857c8c');

  // ---------- FACHADAS (escala real: 56 px ≈ 1 m; base de la pared en y=168) ----------
  // persona 1,75 m ≈ 98 px · puerta 2,10 m ≈ 118 px · ventana 0,95–2,20 m · local 2,40 m · parada 2,40 m
  const M = 56, Y0 = 168, alto = (m) => Math.round(Y0 - m * M);
  const pared = (a, w, top, c, ladrillo = false) => {
    R(a, top, w, Y0 - top, c); if (top > -38) R(a, top, w, 2, tono(c, 1.15)); R(a, 160, w, 8, tono(c, 0.72)); R(a, 159, w, 1, tono(c, 1.1)); // zócalo
    if (ladrillo) for (let yy = top + 4; yy < 159; yy += 5) for (let xx = a + ((Math.floor((yy - top) / 5)) & 1) * 6; xx < a + w; xx += 12) R(xx, yy, 11, 4, tono(c, r() < 0.5 ? 0.92 : 1.04));
    for (let i = 0; i < w * (Y0 - top) / 50; i++) R(a + r() * w, top + r() * (Y0 - top), 1, 1, tono(c, r() < 0.5 ? 0.9 : 1.07)); // revoque
    for (let i = 0; i < w / 60; i++) { const fx = a + r() * w, fy = top + 10 + r() * 100; let cx = fx; for (let k = 0; k < 14; k++) { R(cx, fy + k, 1, 1, tono(c, 0.78)); cx += Math.round((r() - 0.5) * 2); } } // fisuras
  };
  const grafiti = (a, b, w, txt, c1, c2, esc = 1) => {
    const cols = ['#e04a8a', '#4ad0e0', '#f0d040', '#6ae06a', '#ff7a3a'];
    for (let i = 0; i < w / 3; i++) { x.fillStyle = cols[Math.floor(r() * cols.length)]; x.fillRect(Math.round(a + r() * w), Math.round(b + r() * 26), 2 + Math.floor(r() * 5), 1 + Math.floor(r() * 3)); }
    if (txt) T(txt, a + w / 2, b + 6, c1, esc, 'centro', c2);
  };
  // ventana a escala (alféizar ~0,95 m), con reja, persiana o cortina
  const ventana = (a, w, { top = alto(2.2), sill = alto(0.95), luz = false, cortina = null, reja = false, persiana = 0 } = {}) => {
    const h = sill - top; O(a - 3, top - 3, w + 6, h + 6, '#e8d8c8'); V(a, top, w, h, luz, cortina);
    if (persiana) { const ph = Math.round(h * persiana); R(a + 1, top + 1, w - 2, ph, '#8a7a6a'); for (let yy = top + 2; yy < top + ph; yy += 3) R(a + 1, yy, w - 2, 1, '#6a5a4a'); R(a + 1, top + ph - 1, w - 2, 2, '#4a3a2a'); }
    if (reja) { for (let xx = a + 4; xx < a + w - 2; xx += 7) R(xx, top, 2, h, '#2a2230'); R(a, top + (h >> 1), w, 2, '#2a2230'); for (let xx = a + 4; xx < a + w - 2; xx += 14) R(xx - 2, top + (h >> 1) - 3, 6, 2, '#2a2230'); }
    R(a - 5, sill + 3, w + 10, 4, '#d8c8b8'); R(a - 5, sill + 7, w + 10, 1, '#9a8a7a'); // alféizar
  };
  // puerta de 2,10 m con banderola, picaporte y escalón
  const puerta = (a, w, c, { vidrio = false, altoM = 2.1, numero = null } = {}) => {
    const top = alto(altoM); O(a - 4, top - 4, w + 8, Y0 - top + 4, '#e8dccc'); O(a, top, w, Y0 - top, c);
    const ban = 18; R(a + 2, top + 2, w - 4, ban, '#3a2c3a'); R(a + 3, top + 3, w - 6, 3, '#f0a070'); R(a + (w >> 1), top + 2, 1, ban, '#e8dccc'); // banderola
    if (vidrio) { R(a + 4, top + ban + 6, w - 8, Y0 - top - ban - 14, '#5a6a80'); R(a + 6, top + ban + 8, 3, 60, '#9ab0c8'); }
    else { O(a + 6, top + ban + 8, w - 12, 34, tono(c, 0.9)); O(a + 6, top + ban + 48, w - 12, 40, tono(c, 0.9)); }
    R(a + w - 9, alto(1.0), 5, 3, '#e8c040'); R(a + w - 7, alto(1.0) - 4, 2, 4, '#c8a030'); // picaporte
    R(a - 6, Y0 - 3, w + 12, 3, '#b8b0b8'); // escalón
    if (numero) { O(a + (w >> 1) - 19, top - 20, 38, 13, '#2a5aa0'); T(numero, a + (w >> 1), top - 18, '#ffffff', 1, 'centro', null); }
  };
  const aire = (a, b) => { O(a, b, 46, 26, '#d0ccc6'); for (let k = 3; k < 30; k += 3) R(a + k, b + 4, 1, 18, '#8a8690'); O(a + 32, b + 6, 12, 12, '#9a96a0'); R(a + 6, b + 26, 2, 30, '#5a5a62'); };
  const maceta = (a, g = 1) => { const w = Math.round(18 * g), h = Math.round(20 * g); O(a, Y0 - h, w, h, '#b8603a'); R(a + 1, Y0 - h + 1, w - 2, 3, '#d8805a'); for (let k = 0; k < 16; k++) { x.fillStyle = k % 2 ? '#3f7a3a' : '#5aa040'; x.fillRect(Math.round(a + 1 + r() * (w - 2)), Math.round(Y0 - h - 2 - r() * 22 * g), 2, 4 + Math.round(r() * 4)); } };

  // tramo 0: baldío con muro bajo (2,6 m) y murales; arriba se ve el cielo y la ciudad
  pared(0, 250, alto(2.6), '#a88a8a', true);
  R(0, alto(2.6) - 4, 250, 4, '#8a7070'); // coronamiento
  O(30, 52, 196, 92, '#2a5a8a'); // mural de candombe
  for (let i = 0; i < 3; i++) { const mx = 52 + i * 56; O(mx, 74, 34, 64, ['#c8402e', '#e8b040', '#3a8a4a'][i]); R(mx, 74, 34, 6, '#f0e6d0'); for (let k = 0; k < 3; k++) R(mx + 2, 90 + k * 14, 30, 2, '#5a3a2a'); x.fillStyle = '#e2a77c'; x.fillRect(mx + 8, 64, 6, 10); x.fillRect(mx + 20, 62, 6, 12); }
  T('CANDOMBE', 128, 56, '#ffd07a', 2, 'centro');
  grafiti(10, 30, 110, 'CARBONERO', '#f2c21b', '#111'); grafiti(130, 28, 110, 'VAMO ARRIBA', '#7cc4ee', '#1b1220');
  // casa con persiana (1 planta, la fachada sigue arriba de la pantalla)
  pared(250, 220, -40, '#d8b49a'); R(250, 0, 220, 6, '#c8a48a');
  ventana(266, 84, { persiana: 0.45, cortina: '#a85a5a' }); puerta(374, 52, '#5a3a2a', { numero: '2814' }); maceta(436); maceta(354, 0.8);
  aire(282, 4);
  // ---------- ALMACÉN EL CANA (470..910) ----------
  pared(470, 440, -40, '#e2d2bc');
  O(486, 2, 408, 34, '#c8202a'); R(487, 3, 406, 2, '#e85050'); R(487, 33, 406, 2, '#8a1018'); // cartel
  O(600, 4, 180, 30, '#f2f0ea'); T('ALMACÉN', 690, 6, '#1f4fa0', 1, 'centro', null); T('EL CANA', 690, 16, '#1f4fa0', 2, 'centro', '#0e2a60');
  T('FRÍO', 540, 12, '#ffffff', 1, 'centro', '#8a1018'); T('FRÍO', 840, 12, '#ffffff', 1, 'centro', '#8a1018');
  // boca del local (2,4 m) con interior
  const lt = alto(2.35); O(494, lt, 400, Y0 - lt, '#3a2c3a'); R(496, lt + 2, 396, Y0 - lt - 2, '#4a3a44');
  R(496, lt + 2, 396, 6, '#5a4a54'); for (let k = 0; k < 6; k++) R(520 + k * 64, lt + 4, 30, 2, '#fff6d0'); // tubos de luz
  // estantes con mercadería (0,9–2,0 m)
  for (let s2 = 0; s2 < 5; s2++) { const sy2 = alto(0.95) - s2 * 14; R(560, sy2, 120, 2, '#7a6050'); for (let k = 562; k < 678; k += 5) R(k, sy2 - 10 + (k % 3), 4, 10 - (k % 3), ['#d84a3a', '#f0c040', '#4aa04a', '#e8e0d0', '#4a7ad0', '#c86a2a'][Math.floor(r() * 6)]); for (let k = 562; k < 678; k += 10) R(k, sy2 - 9, 1, 1, '#ffffff'); }
  // heladera (1,9 m)
  { const ht = alto(1.9); O(502, ht, 46, Y0 - ht, '#1f5fb8'); O(506, ht + 14, 38, Y0 - ht - 24, '#bfe0f0'); R(503, ht + 1, 44, 12, '#d02a2a'); T('FRÍO', 525, ht + 3, '#fff', 1, 'centro', null);
    for (let s2 = 0; s2 < 5; s2++) { R(507, ht + 30 + s2 * 15, 36, 1, '#8ab0c8'); for (let k = 509; k < 541; k += 5) R(k, ht + 20 + s2 * 15, 3, 9, ['#c8402e', '#f0d040', '#2f7a35', '#f0f0f0', '#6a2a1a'][(k + s2) % 5]); } R(540, ht + 40, 2, 30, '#e8e8f0'); }
  // freezer de helados (0,85 m)
  { const ft = alto(0.85); O(590, ft, 80, Y0 - ft, '#e8e8f0'); R(591, ft + 1, 78, 8, '#4ab0e0'); O(600, ft + 14, 60, 16, '#f08a20'); T('HELADOS', 630, ft + 17, '#ffffff', 1, 'centro', null); }
  // mostrador (0,95 m) con balanza y frasco de caramelos
  { const mt = alto(0.95); O(688, mt, 112, Y0 - mt, '#8a5a3a'); R(689, mt + 1, 110, 3, '#b07a4a'); for (let k = 0; k < 4; k++) R(694 + k * 26, mt + 10, 22, 30, '#7a4a2a');
    O(700, mt - 14, 22, 14, '#c8c8d0'); R(702, mt - 18, 18, 4, '#9a9aa0'); O(760, mt - 18, 14, 18, 'rgba(200,230,240,0.7)'); R(762, mt - 12, 10, 5, '#e04a8a'); }
  for (let k = 0; k < 7; k++) { R(694 + k * 12, lt + 8, 1, 6 + (k % 2) * 4, '#3a2a2a'); O(690 + k * 12, lt + 14 + (k % 2) * 4, 9, 22, '#8a2a2a'); R(692 + k * 12, lt + 18 + (k % 2) * 4, 2, 10, '#b84a4a'); } // salamines
  // puerta con persiana a medio subir + cartel de bizcochos
  { const pt = alto(2.35); O(812, pt, 74, Y0 - pt, '#2a202a'); for (let yy = pt + 2; yy < pt + 50; yy += 4) R(813, yy, 72, 3, '#8a8a92'); R(813, pt + 50, 72, 3, '#5a5a62'); R(840, pt + 52, 2, 4, '#c8c8d0'); }
  O(806, alto(2.35) - 2, 86, 18, '#f08a20'); R(807, alto(2.35) - 1, 84, 1, '#ffb050'); T('Bizcochos', 849, alto(2.35) + 2, '#ffffff', 1, 'centro', '#8a4a10');
  O(700, alto(1.85), 64, 14, '#2a8a4a'); T('ABIERTO', 732, alto(1.85) + 2, '#ffffff', 1, 'centro', null);
  O(894, alto(1.6), 14, 4, '#7a6a5a'); // pizarra en la pared al costado
  { const pz = alto(1.75); O(896, pz, 0, 0, '#000'); }
  R(494, Y0 - 2, 400, 2, '#2a202a');
  // ---------- tramo con portón (910..1170) ----------
  pared(910, 260, -40, '#c8968a');
  ventana(930, 84, { reja: true, cortina: '#4a6a8a' }); aire(944, 6);
  { const pt = alto(2.3); O(1036, pt, 124, Y0 - pt, '#5a3a2a'); for (let yy = pt + 3; yy < Y0 - 2; yy += 5) R(1037, yy, 122, 1, '#4a2a1a'); R(1037, pt + 1, 122, 3, '#7a5a3a'); R(1096, pt, 2, Y0 - pt, '#3a2a1a'); grafiti(1046, 76, 104, 'MURGA', '#ff7a3a', '#1b1220', 2); }
  // ---------- PARADA 121 (1170..1470): muro de 2,5 m con mural, refugio y cartel ----------
  pared(1170, 300, alto(2.5), '#b8a08a', true); R(1170, alto(2.5) - 4, 300, 4, '#9a8270');
  O(1186, 40, 270, 70, '#3a5a7a'); for (let i = 0; i < 8; i++) { const mx = 1196 + i * 32; O(mx, 66, 16, 40, ['#e04a8a', '#f0c040', '#4ad0e0', '#c8402e', '#6ae06a', '#ffffff', '#ff7a3a', '#f0c040'][i]); x.fillStyle = '#e2a77c'; x.fillRect(mx + 3, 54, 10, 12); R(mx + 1, 48, 14, 6, ['#f0c040', '#e04a8a', '#ffffff'][i % 3]); }
  T('CARNAVAL', 1320, 42, '#ffd07a', 1, 'centro');
  { const rt = alto(2.4); R(1236, rt, 5, Y0 - rt, '#2a2a34'); R(1416, rt, 5, Y0 - rt, '#2a2a34'); O(1226, rt - 8, 206, 12, '#2464b4'); T('parada 121', 1329, rt - 6, '#ffffff', 1, 'centro', null);
    R(1242, rt + 6, 172, 84, 'rgba(190,220,240,0.32)'); R(1248, rt + 10, 3, 70, 'rgba(255,255,255,0.5)'); R(1300, rt + 10, 2, 50, 'rgba(255,255,255,0.35)');
    const bt = alto(0.45); O(1262, bt, 130, 7, '#3a6aa0'); R(1272, bt + 7, 4, Y0 - bt - 7, '#2a2a34'); R(1378, bt + 7, 4, Y0 - bt - 7, '#2a2a34'); O(1300, alto(1.3), 60, 40, '#f2f2ea'); T('121 · 149', 1330, alto(1.3) + 6, '#1b1220', 1, 'centro', null); T('405', 1330, alto(1.3) + 18, '#2464b4', 1, 'centro', null); }
  { const st = alto(2.7); R(1186, st, 4, Y0 - st, '#2a2a34'); O(1174, st, 28, 32, '#f2f2f2'); R(1175, st + 1, 26, 8, '#2464b4'); T('121', 1188, st + 14, '#1b1220', 1, 'centro', null); }
  // ---------- casa (1470..1670) ----------
  pared(1470, 200, -40, '#d0a884'); ventana(1488, 76, { luz: true, reja: true }); puerta(1590, 52, '#5a4a6a', { numero: '2950' }); maceta(1650, 0.8); aire(1500, 4);
  grafiti(1490, 128, 70, null);
  // ---------- COMPLEJO CH 99 (1670..2210): planta baja y losa del balcón arriba ----------
  pared(1670, 540, -40, '#cfc3b4'); R(1670, 0, 540, 10, '#a89a8a'); R(1670, 10, 540, 2, '#7a6a5a'); // losa del primer piso
  for (const wx of [1690, 1784, 1878]) ventana(wx, 70, { reja: true, luz: wx === 1784, cortina: wx === 1878 ? '#e09a4a' : null });
  ventana(1972, 70, { reja: true });
  // banderas colgadas de la baranda del balcón
  const banderaUY = (a, b) => { O(a, b, 52, 34, '#f2f2f2'); for (let i = 0; i < 4; i++) R(a + 1, b + 5 + i * 8, 50, 4, '#2464b4'); R(a + 1, b + 1, 18, 17, '#f2f2f2'); x.fillStyle = '#f0c040'; x.fillRect(a + 6, b + 5, 8, 8); x.fillRect(a + 4, b + 8, 12, 2); x.fillRect(a + 9, b + 3, 2, 12); };
  const banderaCAP = (a, b) => { O(a, b, 48, 34, '#f2c21b'); for (let i = 0; i < 6; i++) R(a + 3 + i * 8, b + 1, 4, 32, '#111'); };
  const banderaArtigas = (a, b) => { O(a, b, 48, 34, '#f2f2f2'); R(a + 1, b + 1, 46, 11, '#1f3fa0'); R(a + 1, b + 22, 46, 11, '#1f3fa0'); for (let i = 0; i < 46; i++) R(a + 1 + i, b + 1 + Math.round(i * 32 / 46) - 3, 1, 7, '#c8102e'); R(a, b, 48, 1, '#1b1220'); R(a, b + 33, 48, 1, '#1b1220'); };
  for (const bx2 of [1700, 1874, 2046]) { R(bx2 + 4, 10, 1, 4, '#3a2a3a'); R(bx2 + 40, 10, 1, 4, '#3a2a3a'); }
  banderaUY(1700, 13); banderaCAP(1874, 13); banderaArtigas(2046, 13);
  cable(1770, 14, 1860, 14, 6, '#e8e8e8'); [['#c8402e', 1780], ['#4a7ad0', 1800], ['#f0f0f0', 1820], ['#f0c040', 1838]].forEach(([c, k]) => R(k, 18, 12, 16, c)); // ropa tendida
  puerta(2120, 64, '#6a4a3a', { vidrio: true, altoM: 2.2 }); O(2104, alto(2.2) - 16, 96, 12, '#e8e0d0'); T('Complejo CH 99', 2152, alto(2.2) - 14, '#1b1220', 1, 'centro', null);
  O(2194, alto(1.4), 8, 14, '#9a9aa0'); for (let k = 0; k < 3; k++) R(2196, alto(1.4) + 3 + k * 3, 4, 1, '#3a3a40'); // portero eléctrico
  maceta(2096, 0.9); maceta(2190, 0.9);
  // ---------- cancha de baby con alambrado (2210..2650): se ve el cielo y la ciudad atrás ----------
  R(2210, 104, 440, 30, '#4f8a3f'); for (let k = 2210; k < 2650; k += 2) if (r() < 0.3) R(k, 104 + r() * 30, 1, 2, '#5f9a4a'); R(2210, 118, 440, 1, '#e8f0e0'); O(2380, 106, 60, 14, 'rgba(0,0,0,0)', '#e8f0e0');
  pared(2210, 440, alto(0.6), '#9aa08a');
  for (let k = 2210; k < 2650; k += 5) R(k, -40, 1, Y0 - 34 + 40, 'rgba(70,80,80,0.5)'); for (let k = -38; k < Y0 - 34; k += 5) R(2210, k, 440, 1, 'rgba(70,80,80,0.4)');
  for (let k = 2210; k <= 2650; k += 110) { R(k, -40, 4, Y0 + 40, '#b8b8c0'); R(k, -40, 1, Y0 + 40, '#e0e0e8'); }
  O(2290, 50, 130, 20, '#1f3fa0'); T('CLUB EL CANA', 2355, 56, '#f2f2f2', 1, 'centro', null);
  // ---------- BAR PARRILLA EL TANO (2650..) ----------
  pared(2650, L - 2650, -40, '#8a4a40', true);
  O(2740, 4, 340, 40, '#1b1220'); R(2742, 6, 336, 36, '#2a1a1a'); T('BAR Y PARRILLA', 2910, 8, '#f0c040', 1, 'centro', '#5a2a0a'); T('EL TANO', 2910, 20, '#ff5a4a', 2, 'centro', '#3a0a0a');
  for (let k = 0; k < 22; k++) R(2744 + k * 15, 46 + (k % 2), 6, 3, k % 2 ? '#ffd07a' : '#ff8a4a'); cable(2740, 46, 3080, 46, 4, '#1b1220');
  for (const wx of [2770, 2990]) { O(wx, alto(2.1), 116, alto(0.5) - alto(2.1), '#ffcf7a'); R(wx + 2, alto(2.1) + 2, 112, 6, '#ffe0a0'); for (let k = 0; k < 4; k++) { R(wx + 8 + k * 27, alto(0.5) - 34, 14, 34, '#5a3a2a'); R(wx + 10 + k * 27, alto(0.5) - 44, 10, 10, '#3a2a2a'); } R(wx + 58, alto(2.1), 2, alto(0.5) - alto(2.1), '#3a1a1a'); O(wx - 4, alto(0.5), 124, 6, '#5a2a20'); }
  puerta(2910, 56, '#3a1a1a', { vidrio: true }); 
  O(3130, alto(1.95), 56, 76, '#2a3a2a'); R(3132, alto(1.95) + 2, 52, 2, '#4a5a4a'); T('CHIVITO', 3158, alto(1.95) + 8, '#f0f0e0', 1, 'centro', null); T('$390', 3158, alto(1.95) + 22, '#f0d040', 1, 'centro', null); T('MUZZA', 3158, alto(1.95) + 38, '#f0f0e0', 1, 'centro', null); T('$180', 3158, alto(1.95) + 52, '#f0d040', 1, 'centro', null);
  grafiti(3210, 70, 150, 'EL TANO MANDA', '#ff5a4a', '#1b1220');
  aire(3260, 6); maceta(2880, 0.9);

  // ---------- DETALLE DE BARRIO ----------
  for (let xx = 0; xx < L; xx += 1) { const hgt = 10 + Math.round(Math.sin(xx * 0.05) * 4 + Math.sin(xx * 0.013) * 6); x.fillStyle = 'rgba(40,30,50,0.10)'; x.fillRect(xx, 160 - hgt, 1, hgt); } // humedad
  for (const cx of [466, 906, 1466, 2206]) { R(cx, -40, 4, Y0 + 40, '#6a6470'); R(cx, -40, 1, Y0 + 40, '#8a8490'); R(cx - 2, 150, 8, 4, '#6a6470'); } // caños
  // afiches a la altura de los ojos (1,4–1,9 m)
  const afiches = [[258, 128, 'SE ALQUILA', '#f2f2ea'], [966, 128, 'BAILE', '#f08aa0'], [1430, 112, 'TOQUE', '#7cc4ee'], [2400, 137, 'LLAMADAS', '#f0d040'], [2560, 137, 'MURGA', '#f0d040'], [2670, 80, 'ASADO', '#ff9a5a'], [3330, 120, 'VENDO', '#f2f2ea']];
  const ocupado = afiches.map(([ax, ay, t]) => [ax - 14, ay - 18, ax + t.length * 8 + 22, ay + 30]);
  for (const [ax, ay, t, c] of afiches) { const w = t.length * 8 + 8; O(ax, ay, w, 26, c); R(ax + 1, ay + 1, w - 2, 5, '#c8202a'); T(t, ax + w / 2, ay + 9, '#1b1220', 1, 'centro', null); R(ax + 3, ay + 20, w - 6, 1, '#8a7a7a'); x.clearRect(ax + w - 5, ay + 21, 5, 5); }
  const libre = (ax) => !((ax > 480 && ax < 905) || (ax > 1030 && ax < 1165) || (ax > 1180 && ax < 1460) || (ax > 2090 && ax < 2660) || (ax > 2760 && ax < 3110) || (ax > 3125 && ax < 3190) || (ax > 1680 && ax < 2050) || (ax > 260 && ax < 440) || (ax > 925 && ax < 1020) || (ax > 1480 && ax < 1650) || ax < 250);
  for (let i = 0; i < 90; i++) { const ax = r() * L, ay = 70 + r() * 60; if (!libre(ax) || ocupado.some(([a0, b0, a1, b1]) => ax > a0 && ax < a1 && ay > b0 && ay < b1)) continue; O(ax, ay, 12, 16, ['#f0f0e0', '#f0d040', '#f08aa0', '#9ad0f0'][i % 4]); R(ax + 2, ay + 4, 8, 1, '#5a4a5a'); R(ax + 2, ay + 7, 6, 1, '#5a4a5a'); R(ax + 2, ay + 10, 7, 1, '#5a4a5a'); }
  for (let i = 0; i < 50; i++) { const gx = r() * L, gy = 80 + r() * 60; if (!libre(gx) || ocupado.some(([a0, b0, a1, b1]) => gx + 34 > a0 && gx < a1 && gy + 8 > b0 && gy - 8 < b1)) continue; x.fillStyle = ['#1b1220', '#c8202a', '#2a5ab0', '#e04a8a'][i % 4]; for (let k = 0; k < 22; k++) x.fillRect(Math.round(gx + k * 1.5), Math.round(gy + Math.sin(k * 1.3 + i) * 4), 2, 2); }
  // zapatillas colgadas del cable
  const zapas = (zx, zy) => { R(zx, zy, 1, 10, '#241826'); R(zx + 5, zy, 1, 12, '#241826'); O(zx - 4, zy + 10, 10, 6, '#f2f2f2'); O(zx + 2, zy + 12, 10, 6, '#f2f2f2'); R(zx - 3, zy + 13, 8, 1, '#c8202a'); R(zx + 3, zy + 15, 8, 1, '#c8202a'); };
  zapas(640, 0); zapas(1990, 0); zapas(2900, -2);
  // vereda: baldosas rotas, pasto, hojas de plátano
  for (let i = 0; i < L / 25; i++) { const bx = Math.floor(r() * L / 16) * 16, by = 170 + Math.floor(r() * 4) * 8; R(bx + 1, by + 1, 15, 7, r() < 0.5 ? '#948a98' : '#aea4b0'); if (r() < 0.4) { R(bx + 3, by + 3, 6, 1, '#6a6070'); R(bx + 8, by + 4, 4, 1, '#6a6070'); } }
  for (let i = 0; i < L / 18; i++) { const gx = r() * L; x.fillStyle = r() < 0.5 ? '#5a8a3a' : '#7aa040'; x.fillRect(Math.round(gx), 166 + Math.round(r() * 2), 1, 3); x.fillRect(Math.round(gx) + 1, 167, 1, 2); }
  for (let i = 0; i < L / 30; i++) { x.fillStyle = ['#d89a3a', '#c07a2a', '#e8b050'][i % 3]; x.fillRect(Math.round(r() * L), Math.round(172 + r() * 28), 2, 1); x.fillRect(Math.round(r() * L), Math.round(255 + r() * 12), 2, 1); }
  for (let cx2 = 1160; cx2 < 1460; cx2 += 1) if (Math.floor(cx2 / 12) % 2) R(cx2, 203, 1, 5, '#e0b830');
  for (let k = 0; k < 7; k++) R(1480, 212 + k * 6, 46, 3, '#d8d4dc');
  const charco = (cx3, cy3, w) => {
    for (let j = 0; j < 7; j++) { const t = j / 6; const ww = Math.round(w * Math.sqrt(1 - (t * 2 - 1) ** 2)); x.fillStyle = ['#f8b468', '#f49660', '#e8785e', '#d0606a', '#a8507a', '#7e4580', '#56397a'][j]; x.fillRect(Math.round(cx3 - ww / 2), cy3 + j, ww, 1); }
    R(cx3 - w / 4, cy3 + 2, w / 6, 1, '#ffe0a0'); R(cx3 + 2, cy3 + 4, w / 8, 1, '#ffdca0'); R(cx3 - w / 2 + 3, cy3 - 1, w - 6, 1, '#3a3446');
  };
  for (const [cx3, cy3, w] of [[260, 228, 44], [770, 238, 30], [1380, 226, 52], [1940, 232, 38], [2480, 240, 46], [3020, 226, 40]]) charco(cx3, cy3, w);
  for (let i = 0; i < L / 200; i++) { const px3 = r() * L, py3 = 212 + r() * 30; R(px3, py3, 20 + r() * 20, 6 + r() * 6, '#453e50'); }
  for (let mx = 700; mx < L; mx += 900) { O(mx, 244, 16, 6, '#3a3446'); R(mx + 3, 246, 10, 1, '#5a5266'); }

  // ---------- POSTES Y CABLES (los cables van altos: apenas asoman arriba) ----------
  const postes = [];
  for (let px = 120; px < L; px += 330 + Math.floor(r() * 60)) postes.push(px);
  for (let i = 0; i < postes.length; i++) {
    const p = postes[i];
    R(p, -40, 8, 238, '#5a463e'); R(p, -40, 2, 238, '#7a6052'); R(p - 16, -30, 40, 5, '#5a463e');
    R(p - 3, -6, 14, 16, '#4a4a52'); R(p - 1, -4, 10, 2, '#6a6a72'); // transformador
    O(p - 2, alto(1.6), 12, 16, ['#f0f0e0', '#f0d040', '#f08aa0'][i % 3]); R(p - 1, alto(2.8), 10, 3, '#c8c8d0'); // volante y chapa
    if (i + 1 < postes.length) { const q = postes[i + 1]; cable(p - 14, -28, q - 14, -28, 44); cable(p + 20, -28, q + 20, -28, 50); cable(p + 4, 4, q + 4, 6, 30, '#1b1220'); }
    cable(p - 14, -28, p - 70, 12, 8); cable(p + 20, -24, p + 80, 14, 10); // bajadas a las casas
    for (let k = 0; k < 5; k++) cable(p - 2, 8 + k, p + 10, 14 + k * 2, 3 + k, '#1b1220'); // maraña
  }
  // pre-sombra del borde de fachadas sobre la vereda
  x.fillStyle = 'rgba(40,20,50,0.18)'; x.fillRect(0, 168, L, 4);
  return { canvas: cv, postes };
}

// Configuración del nivel 1: objetos, oleadas, candados de cámara
export function nivel1() {
  const L = 3400;
  return {
    nombre: 'LA CUADRA DEL CANA', L,
    decor: [ // decorado sólido (no rompible) en el piso
      { t: 'contenedor', x: 296, y: 192 }, { t: 'moto', x: 610, y: 196 }, { t: 'contenedor', x: 1100, y: 192 }, { t: 'carton', x: 760, y: 268 },
      { t: 'contenedor', x: 1520, y: 192 }, { t: 'contenedor', x: 2250, y: 192 }, { t: 'moto', x: 2700, y: 196 }, { t: 'contenedor', x: 3260, y: 192 },
    ],
    rompibles: [
      { t: 'cajaBiz', x: 330, y: 250, da: 'bizcochos' }, { t: 'cajon', x: 690, y: 262, da: 'botella' }, { t: 'tacho', x: 980, y: 198, da: 'palo' },
      { t: 'cajaBiz', x: 1260, y: 262, da: 'mate' }, { t: 'cajon', x: 1560, y: 258, da: 'botella' }, { t: 'tacho', x: 1820, y: 200, da: 'billete' },
      { t: 'cajaBiz', x: 2080, y: 256, da: 'chivito' }, { t: 'tacho', x: 2420, y: 198, da: 'termo' }, { t: 'cajon', x: 2560, y: 262, da: 'botella' }, { t: 'cajaBiz', x: 2860, y: 254, da: 'chivito' },
    ],
    items: [{ t: 'garrafa', x: 880, y: 256 }, { t: 'palo', x: 430, y: 236 }, { t: 'garrafa', x: 2290, y: 246 }, { t: 'pelota', x: 1130, y: 240 }],
    perros: [{ x: 250, y: 252 }],
    oleadas: [
      { cam: 300, enemigos: [['buzo', 0], ['buzo', 1], ['mati', 0]] },
      { cam: 820, enemigos: [['mati', 0], ['buzo', 2], ['cacho', 0], ['mati', 1]] },
      { cam: 1320, enemigos: [['buzo', 0], ['mati', 2], ['buzo', 1], ['cacho', 0], ['mati', 0]], bondi: true },
      { cam: 1880, enemigos: [['cacho', 1], ['mati', 1], ['buzo', 2], ['buzo', 0], ['mati', 0]] },
      { cam: 2420, enemigos: [['cacho', 0], ['cacho', 2], ['mati', 2], ['buzo', 1], ['mati', 3], ['buzo', 0]] }, // (variantes solo cambian la ropa)
      { cam: 9999, jefe: 'tano', enemigos: [['tano', 0]] },
    ],
  };
}
