// Escenarios: cielo, fondos con parallax (lejos / medio) y capa de la calle, por nivel y hora del día.
// Todo se pre-renderiza en lienzos grandes al empezar el nivel: cada cuadro cuesta 3-4 drawImage.
import { lienzo, rng, tono } from './pixel.js';
import { GRADOS, gradar, halo } from './escenarios/pincel.js';
import { pintarCuadra } from './escenarios/cuadra.js';
import { pintarFeria } from './escenarios/feria.js';
import { pintarAvenida } from './escenarios/avenida.js';
import { pintarBarrioSur } from './escenarios/barriosur.js';
import { pintarCiudadVieja } from './escenarios/ciudadvieja.js';
import { pintarRambla } from './escenarios/rambla.js';

export const PISO = { arriba: 182, abajo: 266 }; // rango de "y" (profundidad) caminable
export const ALTO = 270;
export const EXTRA = 40; // la capa de la calle tiene 40 px más arriba (fachadas que siguen)

// paletas por hora: cielo (bandas de arriba hacia abajo), nubes, fondo lejano y medio
export const PAL = {
  atardecer: { cielo: ['#3a2f6a', '#56397a', '#7e4580', '#a8507a', '#d0606a', '#e8785e', '#f49660', '#f8b468', '#ffcc7a', '#ffdc90'], nube: ['#c86a8a', '#e08a9a', '#f7a07a', '#ffc890'], lejos: ['#a5607e', '#8c5274', '#c7849a', '#ffd38a', '#7d4868', '#a56a88'], medio: ['#c07a7e', '#b56f80', '#cc8a80', '#a8667a'], mVent: '#6a4a64', mBrillo: '#f0a070', arbol: ['#3f6a3a', '#5a8a40'], tronco: '#5a3a3a', luces: 0.1, mar: ['#7e4580', '#a8507a', '#e8785e', '#ffcc7a'] },
  manana: { cielo: ['#5a9ad8', '#68a6de', '#78b2e4', '#88bee8', '#98c8ec', '#a8d2f0', '#b8dcf2', '#c8e4f4', '#d6eaf4', '#e2eef2'], nube: ['#e8f0f8', '#ffffff', '#dce8f2', '#f4f8fc'], lejos: ['#8aa2b8', '#7a92aa', '#a8bccc', '#d0dce6', '#6f879e', '#9ab0c4'], medio: ['#c8b8a8', '#b8a8a0', '#d4c4b0', '#a89c98'], mVent: '#5a6a80', mBrillo: '#c8e0f0', arbol: ['#3f7a3a', '#5aa040'], tronco: '#6a5a4a', luces: 0, mar: ['#3a7ab8', '#4a8ac8', '#6aa8d8', '#9ac8e8'] },
  mediodia: { cielo: ['#3a7ccc', '#4486d2', '#4e90d8', '#5a9adc', '#66a4e0', '#72aee4', '#80b8e8', '#90c2ec', '#a0ccee', '#b0d4ee'], nube: ['#f4f8fc', '#ffffff', '#e4eef6', '#ffffff'], lejos: ['#9aa4b4', '#8a94a6', '#b8c0cc', '#e0e6ec', '#7a8498', '#a4aebe'], medio: ['#d0c4b4', '#c4b4a8', '#dcd0bc', '#b4a8a4'], mVent: '#4a5a72', mBrillo: '#d8eaf6', arbol: ['#3a7a36', '#58a03e'], tronco: '#6a5a4a', luces: 0, mar: ['#2a6aa8', '#3a7ab8', '#5a98d0', '#8ab8e0'] },
  noche: { cielo: ['#06061a', '#0a0a22', '#0e1028', '#12142e', '#161a36', '#1a2040', '#20264a', '#262c52', '#2c325a', '#323860'], nube: ['#1a1e3a', '#22284a', '#2a3052', '#323a5e'], lejos: ['#1c1e3a', '#181a32', '#2a2c4a', '#ffd88a', '#14162c', '#24264a'], medio: ['#2a2a48', '#262640', '#30304e', '#22223c'], mVent: '#141428', mBrillo: '#3a3a5a', arbol: ['#141e1a', '#1c2a22'], tronco: '#1a1418', luces: 0.42, mar: ['#0c1028', '#141a36', '#1c2444', '#283050'] },
  gris: { cielo: ['#6a6a80', '#727288', '#7a7a8e', '#828296', '#8a8a9c', '#9292a2', '#9a9aa8', '#a2a2ae', '#aaa8b2', '#b2b0b8'], nube: ['#8a8a9a', '#9a9aa8', '#7a7a8c', '#a8a8b4'], lejos: ['#7a7a8c', '#6e6e82', '#9090a0', '#e8d8a8', '#626276', '#86869a'], medio: ['#a09aa0', '#948e98', '#aaa4a8', '#8c8690'], mVent: '#4a4a5c', mBrillo: '#b8b8c8', arbol: ['#3a4a3a', '#4a5a42'], tronco: '#4a4040', luces: 0.12, mar: ['#4a5a6a', '#5a6a7a', '#6a7a8a', '#8a96a2'] },
  tormenta: { cielo: ['#121420', '#161826', '#1a1c2c', '#1e2232', '#222838', '#262e40', '#2a3446', '#2e3a4c', '#344052', '#3a4658'], nube: ['#2a2e3e', '#343a4a', '#22262e', '#3e4454'], lejos: ['#262a3a', '#20243a', '#34384a', '#ffd88a', '#1a1e2e', '#2e3244'], medio: ['#30344a', '#2a2e44', '#363a50', '#262a3e'], mVent: '#181a2a', mBrillo: '#3a4258', arbol: ['#18221e', '#202e26'], tronco: '#1a1618', luces: 0.3, mar: ['#141c2a', '#1c2636', '#263244', '#3a4a5c'] },
};

// ---------------- CIELO ----------------
export function cielo(w, h, hora = 'atardecer') {
  const P = PAL[hora]; const [cv, x] = lienzo(w, h); const off = h - ALTO; const bandas = P.cielo.map((c, i) => [i * 14, c]);
  for (let y = 0; y < h; y++) {
    const yy = y - off; let c = bandas[0][1];
    for (const [b, cc] of bandas) if (yy >= b) c = cc;
    x.fillStyle = c; x.fillRect(0, y, w, 1);
    for (let i = 1; i < bandas.length; i++) if (yy === bandas[i][0] - 1 || yy === bandas[i][0] - 3) { x.fillStyle = bandas[i][1]; for (let xx = (yy & 1); xx < w; xx += 2) x.fillRect(xx, y, 1, 1); }
  }
  if (off > 0) { x.fillStyle = P.cielo[0]; x.fillRect(0, 0, w, off); }
  const r = rng(7);
  if (hora === 'noche' || hora === 'tormenta') { for (let i = 0; i < (hora === 'noche' ? 70 : 12); i++) { x.fillStyle = r() < 0.3 ? '#fff6d0' : '#8a90b8'; x.fillRect(Math.round(r() * w), Math.round(off + r() * 100), 1, 1); } }
  const nN = hora === 'gris' || hora === 'tormenta' ? 22 : 9;
  for (let i = 0; i < nN; i++) {
    const cy = off + 20 + r() * (hora === 'tormenta' ? 70 : 90), cx = r() * w, L = 40 + r() * (hora === 'gris' || hora === 'tormenta' ? 200 : 90), alto2 = hora === 'gris' || hora === 'tormenta' ? 3 + Math.floor(r() * 5) : 2;
    x.fillStyle = cy - off > 100 ? P.nube[2] : P.nube[0]; x.fillRect(Math.round(cx), Math.round(cy), Math.round(L), alto2);
    x.fillStyle = cy - off > 100 ? P.nube[3] : P.nube[1]; x.fillRect(Math.round(cx + 6), Math.round(cy - 1), Math.round(L * 0.6), 1);
    if (hora === 'manana' || hora === 'mediodia') { x.fillStyle = P.nube[1]; x.fillRect(Math.round(cx + 10), Math.round(cy - 3), Math.round(L * 0.3), 3); }
  }
  return cv;
}
// sol o luna (parallax casi nulo); null si a esa hora no se ve
export function sol(hora = 'atardecer') {
  if (hora === 'mediodia' || hora === 'gris' || hora === 'tormenta') return null;
  const R = hora === 'manana' ? 12 : 20; const [cv, x] = lienzo(R * 2 + 4, R * 2 + 4); const c = R + 2;
  for (let y = 0; y < cv.height; y++) for (let xx = 0; xx < cv.width; xx++) { const d = Math.hypot(xx - c + 0.5, y - c + 0.5); if (d < R) {
    if (hora === 'noche') { const cr = Math.hypot(xx - c + 5.5, y - c + 2.5); if (cr < R * 0.95) continue; x.fillStyle = d < R - 2 ? '#f4eed8' : '#c8c4b0'; }
    else x.fillStyle = hora === 'manana' ? (d < R - 3 ? '#fffbe8' : '#fff0b8') : d < 15 ? '#fff2b0' : '#ffd88a'; x.fillRect(xx, y, 1, 1); } }
  if (hora === 'atardecer') { x.clearRect(0, 26, 44, 1); x.clearRect(0, 30, 44, 2); x.clearRect(0, 35, 44, 3); }
  return cv;
}

// ---------------- LEJOS: horizonte según el nivel ----------------
export function lejos(ancho, tipo = 'ciudad', hora = 'atardecer') {
  const P = PAL[hora]; const [cv, x] = lienzo(ancho, ALTO); const R = (a, b, w, h, c) => { x.fillStyle = c; x.fillRect(Math.round(a), Math.round(b), Math.round(w), Math.round(h)); }; const r = rng(3);
  const [c1, c2, vent, vluz, cs, csv] = P.lejos; const pLuz = 0.12 + P.luces;
  const edificios = (base, hMin, hVar, wMin = 26, wVar = 40) => { let px = 0; while (px < ancho) {
    const w = wMin + Math.floor(r() * wVar), h = hMin + Math.floor(r() * hVar), top = base - h;
    R(px, top, w, h, r() < 0.5 ? c1 : c2);
    for (let wy = top + 5; wy < base - 7; wy += 6) for (let wx = px + 3; wx < px + w - 3; wx += 5) if (r() < 0.55) R(wx, wy, 2, 3, r() < pLuz ? vluz : vent);
    if (r() < 0.3) R(px + (w >> 1), top - 8, 1, 8, c2);
    if (r() < 0.25) { R(px + 4, top - 6, 8, 6, cs); } // tanque de agua
    px += w + Math.floor(r() * 6); } };
  const salvo = (sx, k = 1, base = 172) => { // Palacio Salvo: torre escalonada con cúpula y antena
    const S = (a, b, w, h) => R(sx + a * k, base - (172 - b) * k, w * k, h * k, cs);
    S(0, 92, 60, 80); S(12, 62, 36, 30); S(18, 44, 24, 18); S(22, 30, 16, 14); S(26, 22, 8, 8); S(29, 12, 2, 10);
    for (let wy = 96; wy < 166; wy += 6) for (let wx = 4; wx < 56; wx += 5) R(sx + wx * k, base - (172 - wy) * k, 2 * k, 3 * k, r() < pLuz ? vluz : csv);
    for (let wy = 66; wy < 90; wy += 6) for (let wx = 15; wx < 46; wx += 5) R(sx + wx * k, base - (172 - wy) * k, 2 * k, 3 * k, csv);
    R(sx + 29 * k, base - 162 * k, 2 * k, 2 * k, '#ff6a5a');
  };
  if (tipo === 'ciudad' || tipo === 'sur') { edificios(172, 40, 70); salvo(300); R(1120, 120, 30, 52, cs); R(1126, 100, 18, 20, cs); }
  if (tipo === 'centro') { edificios(176, 70, 90, 30, 50); salvo(420, 1.5, 176); salvo(1500, 1.2, 176); }
  if (tipo === 'feria') { edificios(176, 26, 40, 30, 46); for (let i = 0; i < ancho / 260; i++) { const tx = 60 + i * 260 + r() * 80; R(tx, 140, 3, 36, cs); for (let k = 0; k < 10; k++) { x.fillStyle = k < 6 ? P.arbol[0] : P.arbol[1]; const cx = tx + (r() - 0.5) * 36, cy = 128 + r() * 18; x.fillRect(Math.round(cx - 7), Math.round(cy - 5), 14, 10); } }
    // cúpula de iglesia y la torre de la Universidad a lo lejos
    R(700, 110, 40, 66, cs); R(708, 92, 24, 18, cs); x.fillStyle = cs; for (let a = -12; a <= 12; a++) x.fillRect(720 + a, Math.round(92 - Math.sqrt(144 - a * a)), 1, Math.round(Math.sqrt(144 - a * a))); R(719, 70, 2, 10, cs); R(716, 73, 8, 2, cs); salvo(1250, 0.9, 176); }
  if (tipo === 'puerto' || tipo === 'mar') {
    // mar: franjas con brillos (el muelle / la bahía)
    const ym = tipo === 'mar' ? 120 : 150; for (let y = ym; y < ALTO; y++) { const k = Math.min(3, Math.floor((y - ym) / 12)); R(0, y, ancho, 1, P.mar[3 - k]); }
    for (let i = 0; i < ancho / 4; i++) R(r() * ancho, ym + 2 + r() * (ALTO - ym), 3 + r() * 6, 1, tono(P.mar[3], 1.15));
    if (tipo === 'mar') { // Cerro de Montevideo con la Fortaleza y el faro, al otro lado de la bahía
      const cx0 = 380; for (let a = -170; a <= 170; a++) { const h = Math.round(48 * Math.cos((a / 170) * Math.PI / 2) ** 1.4); R(cx0 + a, ym - h, 1, h, cs); }
      R(cx0 - 14, ym - 56, 28, 9, csv); R(cx0 - 10, ym - 60, 6, 4, csv); R(cx0 + 4, ym - 60, 6, 4, csv); R(cx0 + 18, ym - 66, 3, 12, cs); R(cx0 + 17, ym - 68, 5, 3, vluz);
      for (let i = 0; i < 3; i++) { const bx = 900 + i * 520; R(bx, ym - 6, 50, 5, cs); R(bx + 10, ym - 14, 18, 8, cs); R(bx + 24, ym - 22, 3, 8, cs); } // barcos
      edificios(ym, 10, 26, 22, 30); // costa lejana
    } else { // grúas del puerto, contenedores y la Catedral
      edificios(ym, 14, 30, 30, 50);
      for (const gx of [200, 640, 1180]) { R(gx, 60, 6, ym - 60, cs); R(gx - 50, 60, 120, 6, cs); R(gx + 60, 66, 2, 40, cs); R(gx + 56, 104, 10, 6, csv); for (let k = 0; k < 10; k++) R(gx - 48 + k * 12, 61, 1, 4, csv); }
      for (let i = 0; i < ancho / 70; i++) { const bx = r() * ancho; R(bx, ym - 10, 24, 10, ['#8a4a3a', '#3a5a7a', '#6a6a3a', '#5a3a5a'][i % 4]); }
      R(900, 80, 22, 70, cs); R(960, 80, 22, 70, cs); R(918, 100, 46, 50, cs); for (const tx of [900, 960]) { R(tx + 4, 66, 14, 14, cs); R(tx + 9, 56, 4, 10, cs); } R(936, 92, 10, 8, csv);
    }
  }
  return cv;
}

// ---------------- MEDIO: edificios más cercanos, árboles ----------------
export function medio(ancho, tipo = 'ciudad', hora = 'atardecer') {
  const P = PAL[hora]; const [cv, x] = lienzo(ancho, ALTO); const R = (a, b, w, h, c) => { x.fillStyle = c; x.fillRect(Math.round(a), Math.round(b), Math.round(w), Math.round(h)); }; const r = rng(11);
  if (tipo === 'mar' || tipo === 'puerto') return cv; // se ve el agua: sin capa media
  let px = 0; const hMin = tipo === 'centro' ? 90 : 60, hVar = tipo === 'centro' ? 70 : 60;
  while (px < ancho) {
    const w = 50 + Math.floor(r() * 50), h = hMin + Math.floor(r() * hVar), top = 176 - h;
    const base = P.medio[Math.floor(r() * 4)];
    R(px, top, w, h, base); R(px, top, w, 2, tono(base, 1.2)); R(px + w - 3, top, 3, h, tono(base, 0.82));
    for (let wy = top + 6; wy < 168; wy += 11) for (let wx = px + 5; wx < px + w - 8; wx += 10) { R(wx, wy, 6, 7, P.mVent); R(wx, wy, 6, 1, P.mBrillo); if (r() < 0.1 + P.luces) R(wx, wy, 6, 7, '#ffcf7a'); }
    if (r() < 0.4) { R(px + 6, top - 10, 14, 10, tono(base, 0.7)); R(px + 8, top - 12, 10, 2, tono(base, 0.8)); }
    px += w + Math.floor(r() * 30);
  }
  for (let i = 0; i < ancho / 140; i++) {
    const tx = 40 + i * 140 + r() * 40; const ty = 120 + r() * 20;
    R(tx + 10, ty + 10, 4, 50, P.tronco);
    for (let k = 0; k < 14; k++) { const cx = tx + r() * 26, cy = ty - 10 + r() * 26, rr = 6 + r() * 6; x.fillStyle = k < 8 ? P.arbol[0] : P.arbol[1]; for (let a = 0; a < rr; a++) x.fillRect(Math.round(cx - rr + a), Math.round(cy - Math.sqrt(rr * rr - (a - rr / 2) ** 2) / 1.3), 1, Math.round(Math.sqrt(rr * rr - (a - rr / 2) ** 2) * 1.4)); }
  }
  return cv;
}

// ---------------- CALLE (capa principal) ----------------
const PINTORES = { cuadra: pintarCuadra, feria: pintarFeria, avenida: pintarAvenida, barriosur: pintarBarrioSur, ciudadvieja: pintarCiudadVieja, rambla: pintarRambla };
// devuelve { canvas, luces: [[x, y, radio, color]] } — las luces se pintan después de la gradación (de noche brillan)
// ven = { x0, w } pinta sólo una ventana del nivel (fotos del mapa): mismo dibujo, mucho menos trabajo de gradación
export function calle(nv, ven = null) {
  const L = nv.L, ox = ven ? ven.x0 : 0; const [cv, x] = lienzo(ven ? ven.w : L, ALTO + EXTRA); x.translate(-ox, EXTRA);
  const luces = []; const despues = PINTORES[nv.escena](x, L, luces, nv);
  x.setTransform(1, 0, 0, 1, 0, 0);
  if (GRADOS[nv.hora]) gradar(cv, GRADOS[nv.hora]);
  // lo que brilla (faroles, ventanas encendidas, neones) se pinta después de gradar, con su halo
  x.translate(-ox, EXTRA); if (typeof despues === 'function') despues(x);
  for (const [lx, ly, rad, c, f] of luces) { if (ven && (lx + rad < ox || lx - rad > ox + ven.w)) continue; const h = halo(rad, c, f ?? PAL[nv.hora].luces); x.drawImage(h, Math.round(lx - rad), Math.round(ly - rad)); }
  x.setTransform(1, 0, 0, 1, 0, 0);
  return { canvas: cv, luces };
}
