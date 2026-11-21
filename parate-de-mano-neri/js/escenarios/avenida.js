// Nivel 3 — "Avenida 18 de Julio": mediodía en el Centro. Galerías, casa de cambio, cine, farmacia, la Plaza
// Cagancha con su columna, quiosco con quiniela, zapatería en liquidación, un banco de columnas y la terminal.
import { rng, tono } from '../pixel.js';
import { herramientas, pisoCalle, alto, Y0 } from './pincel.js';

export function pintarAvenida(x, L) {
  const r = rng(43); const H = herramientas(x, r); const { R, O, T, chico, pared, cornisa, ventana, puerta, toldo, cartel, afiche, persianaMetal, tag, aire, cable, arbol } = H;
  pisoCalle(x, r, L, H, { asfalto: '#4e4c58', vereda: '#b8b4b8', linea: '#e8e8e0' });
  // carril SOLO BUS y cebra
  for (let xx = 200; xx < L; xx += 900) chico('SOLO BUS', xx, 242, '#e8e0a0', 'izq', 2);
  for (const zx of [1180, 2860]) for (let k = 0; k < 7; k++) R(zx, 212 + k * 6, 54, 3, '#e8e4e0');
  // vereda ancha de granito (baldosas grandes)
  for (let xx = 0; xx < L; xx += 28) R(xx, 170, 1, 30, '#9c98a0');
  // ---- edificios: planta baja comercial + marquesina; arriba se adivinan los pisos ----
  const edificio = (a, w, c, { pil = true } = {}) => { pared(a, w, -40, c, { manchas: false }); cornisa(a, w, alto(3.0), c); if (pil) for (let k = a; k <= a + w - 8; k += Math.max(60, Math.floor(w / 4))) { R(k, -40, 8, Y0 + 40, tono(c, 1.08)); R(k + 7, -40, 1, Y0 + 40, tono(c, 0.8)); } for (let k = a + 12; k < a + w - 30; k += 46) ventana(k, 30, { top: -36, sill: alto(3.2) - 4, marco: tono(c, 1.1), vidrio: '#5a6a84', brillo: '#c8e0f0' }); };
  const marquesina = (a, w, c = '#3a3a44') => { R(a, alto(2.75), w, 6, c); R(a, alto(2.75) + 6, w, 2, tono(c, 0.6)); R(a, alto(2.75) + 8, w, 8, 'rgba(30,18,40,0.18)'); };
  const vidriera = (a, w, fondo = '#3a3a4a') => { const lt = alto(2.6); O(a, lt, w, Y0 - lt, '#2a2a32'); R(a + 2, lt + 2, w - 4, Y0 - lt - 4, fondo); R(a + 4, lt + 4, 3, Y0 - lt - 30, 'rgba(255,255,255,0.35)'); R(a + w * 0.4, lt + 4, 2, 40, 'rgba(255,255,255,0.25)'); return lt; };
  // 0: galería comercial
  edificio(0, 330, '#c8c0b0'); marquesina(0, 330);
  { const lt = alto(2.6); O(70, lt, 190, Y0 - lt, '#1b1220'); R(72, lt + 2, 186, Y0 - lt - 2, '#5a5050'); for (let k = 0; k < 6; k++) R(74 + k * 32, lt + 6, 20, 2, '#fff6d0'); for (let k = 0; k < 4; k++) { O(84 + k * 44, lt + 30, 36, 50, ['#4a6a8a', '#8a4a4a', '#6a8a4a', '#8a7a4a'][k]); chico(['ROPA', 'CELU', 'LENTES', 'REGALOS'][k], 102 + k * 44, lt + 22, '#f0f0e0', 'centro'); } R(72, Y0 - 30, 186, 28, 'rgba(255,240,200,0.12)');
    cartel(80, alto(3.0) + 6, 170, 16, '#1f3f7a', 'GALERÍA 18', '#ffffff'); }
  // 330: casa de cambio
  edificio(330, 290, '#d8d0c4'); marquesina(330, 290, '#1f5a3a');
  { const lt = vidriera(346, 150, '#2a3a2a'); O(510, lt, 60, Y0 - lt, '#4a3a2a'); R(536, alto(1.0), 6, 3, '#e8c040');
    O(360, lt + 14, 122, 64, '#101418'); chico('COMPRA  VENTA', 421, lt + 18, '#f0f0e0', 'centro'); [['US$', '39,10', '41,40'], ['R$', '7,05', '8,20'], ['€', '42,30', '45,90'], ['AR$', '0,02', '0,06']].forEach(([m, c1, c2], i) => { chico(m === '€' ? 'EUR' : m, 368, lt + 28 + i * 11, '#f0d040'); chico(c1, 402, lt + 28 + i * 11, '#6aff6a'); chico(c2, 444, lt + 28 + i * 11, '#ff6a5a'); });
    cartel(360, alto(3.0) + 6, 200, 16, '#1f5a3a', 'CAMBIO', '#ffffff'); }
  // 620: cine con marquesina luminosa
  edificio(620, 300, '#b8a8b8'); { const mt = alto(3.05); O(636, mt, 268, 30, '#1b1220'); R(638, mt + 2, 264, 26, '#2a1a2a'); for (let k = 0; k < 34; k++) R(640 + k * 8, mt + 3, 2, 2, k % 2 ? '#ffd040' : '#ff7a3a'); for (let k = 0; k < 34; k++) R(640 + k * 8, mt + 25, 2, 2, k % 2 ? '#ff7a3a' : '#ffd040');
    chico('HOY: EL GUARDA CONTRAATACA', 770, mt + 9, '#f0f0e0', 'centro'); chico('TRASNOCHE: MATE AL ATARDECER', 770, mt + 17, '#f0c040', 'centro');
    const lt = alto(2.4); O(660, lt, 100, Y0 - lt, '#3a1a2a'); R(662, lt + 2, 96, Y0 - lt - 2, '#7a2a3a'); O(780, lt, 100, Y0 - lt, '#3a1a2a'); R(782, lt + 2, 96, Y0 - lt - 2, '#7a2a3a');
    O(672, lt + 14, 76, 92, '#f2e8d0'); R(676, lt + 18, 68, 60, '#4a6a9a'); R(700, lt + 40, 20, 38, '#c8c8d0'); R(696, lt + 30, 28, 10, '#4a4a5a'); chico('EL GUARDA', 710, lt + 84, '#1b1220', 'centro'); chico('CONTRAATACA', 710, lt + 92, '#c8202a', 'centro');
    O(792, lt + 14, 76, 92, '#f2e8d0'); R(796, lt + 18, 68, 60, '#e88a3a'); R(816, lt + 50, 28, 6, '#5a3a20'); R(824, lt + 36, 12, 14, '#7a4a2a'); chico('MATE AL', 830, lt + 84, '#1b1220', 'centro'); chico('ATARDECER', 830, lt + 92, '#c8202a', 'centro'); }
  // 920: farmacia
  edificio(920, 240, '#e0dcd4'); marquesina(920, 240, '#2a8a4a'); { const lt = vidriera(936, 208, '#e8f0ec'); for (let s = 0; s < 4; s++) { R(940, lt + 20 + s * 22, 200, 2, '#a0b0a8'); for (let k = 944; k < 1136; k += 7) R(k, lt + 10 + s * 22, 5, 10, ['#f2f2f2', '#4ab0e0', '#e84a6a', '#f0d040', '#6ac04a'][Math.floor(r() * 5)]); }
    O(1020, alto(3.4), 36, 36, '#2a8a4a'); R(1032, alto(3.4) + 6, 12, 24, '#ffffff'); R(1026, alto(3.4) + 12, 24, 12, '#ffffff'); cartel(950, alto(3.0) + 6, 60, 16, '#2a8a4a', null); chico('FARMACIA', 980, alto(3.0) + 11, '#ffffff', 'centro'); }
  // 1160: parada STM con refugio
  edificio(1160, 340, '#c4b8a8', { pil: false }); persianaMetal(1180, 140, alto(2.6), '#8a8a92'); tag(1200, alto(2.2), '#c8202a'); vidriera(1336, 150, '#2a2a3a'); chico('SE VENDE', 1411, alto(1.8), '#f0f0e0', 'centro'); chico('099 123 456', 1411, alto(1.65), '#f0d040', 'centro');
  { const rt = alto(2.5); R(1196, rt, 4, Y0 - rt + 30, '#2a2a34'); R(1430, rt, 4, Y0 - rt + 30, '#2a2a34'); O(1186, rt - 8, 258, 12, '#2a2a34'); R(1190, rt - 6, 250, 8, '#e8e8f0'); chico('18 DE JULIO Y EJIDO', 1315, rt - 5, '#2a2a34', 'centro');
    R(1202, rt + 6, 226, 70, 'rgba(190,220,240,0.30)'); R(1208, rt + 10, 3, 60, 'rgba(255,255,255,0.5)'); O(1250, alto(1.5), 70, 50, '#f2f2ea'); chico('STM', 1285, alto(1.5) + 4, '#2464b4', 'centro'); ['121 180', '183 185', 'D10 CA1'].forEach((l, i) => chico(l, 1285, alto(1.5) + 14 + i * 9, '#1b1220', 'centro'));
    const bt = alto(0.45); O(1330, bt, 90, 6, '#6a6a72'); R(1338, bt + 6, 3, Y0 - bt - 6, '#2a2a34'); R(1410, bt + 6, 3, Y0 - bt - 6, '#2a2a34'); }
  // 1500: Plaza Cagancha — se abre la vista: muro bajo, árboles y la Columna de la Paz
  pared(1500, 420, alto(0.5), '#a8a090', { zocalo: false, manchas: false }); R(1500, alto(0.5) - 3, 420, 3, '#c8c0b0');
  for (const tx of [1520, 1640, 1810, 1900]) arbol(tx, alto(3.0), 0.9);
  { const cx = 1720; O(cx - 26, alto(1.2), 52, 70, '#c8c0b0'); R(cx - 24, alto(1.2) + 2, 48, 4, '#e0d8c8'); O(cx - 9, -40, 18, alto(1.2) + 42, '#d8d0c0'); for (let yy = -36; yy < alto(1.2); yy += 10) R(cx - 8, yy, 16, 1, '#b0a898'); R(cx - 3, -40, 2, alto(1.2) + 40, '#e8e0d0');
    O(cx - 34, alto(0.5), 68, 30, '#b8b0a0'); chico('PLAZA CAGANCHA', cx, alto(0.5) + 10, '#4a4030', 'centro'); }
  for (const bx of [1560, 1850]) { R(bx, alto(0.45), 44, 4, '#7a5030'); R(bx, alto(0.45) - 10, 44, 3, '#7a5030'); R(bx + 4, alto(0.45) + 4, 3, 18, '#2a2a2a'); R(bx + 37, alto(0.45) + 4, 3, 18, '#2a2a2a'); }
  for (let k = 0; k < 9; k++) { const px = 1540 + r() * 360, py = 162 + r() * 5; R(px, py, 5, 3, '#8a8a92'); R(px + 4, py - 1, 2, 2, '#6a6a7a'); R(px + 5, py, 1, 1, '#e88a3a'); } // palomas
  // 1920: quiosco de diarios en la vereda
  edificio(1920, 340, '#d4c4b0'); marquesina(1920, 340, '#7a3a2a'); vidriera(1936, 150, '#3a3030'); chico('SE ALQUILA', 2011, alto(1.6), '#f0f0e0', 'centro'); vidriera(2104, 140, '#4a3a3a');
  { const qx = 2040, qt = alto(2.35); O(qx, qt, 120, Y0 - qt, '#2a5a3a'); R(qx + 2, qt + 2, 116, 10, '#3a7a4a'); O(qx + 10, qt + 16, 100, 60, '#f2ead8');
    for (let k = 0; k < 12; k++) O(qx + 12 + (k % 6) * 16, qt + 18 + Math.floor(k / 6) * 24, 14, 20, ['#c8202a', '#2a5ab0', '#f0c040', '#e8e8e0', '#e04a8a', '#2a2a2a'][k % 6]);
    R(qx + 10, qt + 66, 100, 10, '#7a5030'); for (let k = 0; k < 10; k++) R(qx + 14 + k * 9, qt + 60, 7, 6, ['#3a2010', '#c8a060', '#f2f2f2'][k % 3]); // alfajores
    cartel(qx + 6, qt - 18, 108, 16, '#f0c040', null); chico('DIARIOS · QUINIELA', qx + 60, qt - 13, '#1b1220', 'centro'); afiche(qx + 18, qt + 82, '5 DE ORO', '#f0d040', 'POZO $$$'); }
  // 2260: zapatería en liquidación
  edificio(2260, 320, '#c8b8c8'); marquesina(2260, 320, '#c8202a'); { const lt = vidriera(2276, 288, '#f2e8e0'); for (let s = 0; s < 3; s++) { R(2280, lt + 34 + s * 30, 280, 2, '#c8b8b0'); for (let k = 2286; k < 2556; k += 20) { R(k, lt + 26 + s * 30, 14, 6, ['#2a2a2a', '#7a4a2a', '#f2f2f2', '#c8202a', '#2a5ab0'][Math.floor(r() * 5)]); R(k, lt + 30 + s * 30, 16, 2, '#4a4a4a'); } }
    O(2330, lt + 8, 180, 18, '#c8202a'); chico('LIQUIDACIÓN 50% · LLEVÁ 2', 2420, lt + 14, '#ffffff', 'centro'); cartel(2300, alto(3.0) + 6, 240, 16, '#1b1220', 'ZAPATERÍA EL PIE', '#f0c040'); }
  // 2580: panchos y chivitos
  edificio(2580, 300, '#e0c8a8'); toldo(2596, 268, alto(2.75), '#f0c040', '#c8202a'); { const lt = vidriera(2600, 260, '#ffe0a0'); R(2604, lt + 60, 252, 6, '#8a5a3a'); for (let k = 0; k < 6; k++) { R(2612 + k * 40, lt + 40, 22, 20, '#3a2a3a'); R(2616 + k * 40, lt + 28, 14, 12, '#c89070'); }
    O(2770, lt + 8, 80, 44, '#2a2a2a'); chico('PANCHO $70', 2810, lt + 12, '#f0f0e0', 'centro'); chico('CHIVITO $390', 2810, lt + 20, '#f0f0e0', 'centro'); chico('REFRESCO', 2810, lt + 28, '#f0d040', 'centro'); chico('POSTRE CHAJÁ', 2810, lt + 36, '#f0f0e0', 'centro');
    cartel(2620, alto(3.05), 220, 16, '#c8202a', 'PANCHERÍA', '#ffffff'); }
  // 2880: banco viejo de columnas de piedra
  pared(2880, 400, -40, '#d8d0c0', { ladrillo: false, manchas: false }); cornisa(2880, 400, alto(3.2), '#d8d0c0');
  for (let k = 0; k < 5; k++) { const cx = 2900 + k * 86; R(cx, -40, 22, Y0 + 40, '#e8e0d0'); R(cx + 2, -40, 2, Y0 + 40, '#f8f4ec'); R(cx + 19, -40, 3, Y0 + 40, '#b8b0a0'); for (let yy = -36; yy < Y0 - 6; yy += 8) R(cx + 6, yy, 1, 6, '#c8c0b0'); R(cx - 4, Y0 - 8, 30, 8, '#c8c0b0'); }
  for (let k = 0; k < 4; k++) { const dx = 2930 + k * 86; O(dx, alto(2.6), 48, Y0 - alto(2.6), '#3a3020'); R(dx + 4, alto(2.6) + 4, 40, 4, '#c8a050'); }
  chico('BANCO DE LA ESQUINA · FUNDADO 1896', 3080, alto(3.2) + 10, '#7a6a50', 'centro');
  // 3280: terminal (arena del jefe): andén techado y reloj
  edificio(3280, L - 3280, '#bcb4ac', { pil: false }); { const tt = alto(3.0); O(3300, tt, L - 3320, 14, '#2a5aa0'); T('TERMINAL CENTRO', 3300 + (L - 3320) / 2, tt + 3, '#ffffff', 1, 'centro', null);
    for (let k = 3320; k < L - 20; k += 130) { R(k, tt + 14, 6, Y0 - tt - 14, '#4a4a54'); R(k, tt + 14, 2, Y0 - tt - 14, '#7a7a84'); }
    vidriera(3340, 120, '#3a3a4a'); chico('BOLETERÍA', 3400, alto(2.1), '#f0f0e0', 'centro'); vidriera(3480, 120, '#3a3a4a'); chico('ENCOMIENDAS', 3540, alto(2.1), '#f0f0e0', 'centro');
    x.fillStyle = '#f2f2ea'; x.beginPath(); x.arc(3660, alto(2.5), 16, 0, 7); x.fill(); x.strokeStyle = '#1b1220'; x.lineWidth = 2; x.stroke(); R(3659, alto(2.5) - 12, 2, 12, '#1b1220'); R(3659, alto(2.5) - 1, 10, 2, '#1b1220'); }
  // semáforos, papeleras naranjas de la IMM y columnas de luz
  for (const sx of [1150, 2840]) { R(sx, alto(3.0), 4, Y0 - alto(3.0) + 8, '#2a2a30'); O(sx - 4, alto(3.0) - 30, 12, 30, '#2a2a30'); R(sx - 1, alto(3.0) - 27, 6, 6, '#5a1a1a'); R(sx - 1, alto(3.0) - 19, 6, 6, '#5a4a10'); R(sx - 1, alto(3.0) - 11, 6, 6, '#3aff6a'); }
  for (let px = 260; px < L; px += 610) { O(px, alto(0.85), 16, 30, '#f08a20'); R(px + 2, alto(0.85) + 4, 12, 2, '#c86a10'); R(px + 6, alto(0.85) + 30, 4, Y0 - alto(0.85) - 30, '#3a3a40'); }
  for (let px = 120; px < L; px += 700) H.columnaLuz(px, { brazo: 1 });
  for (let k = 0; k < L; k += 500) cable(k, -36, k + 500, -36, 14, '#2a2a30'); // cables del trolebús (viejos)
  for (const [ax, t, c] of [[600, 'MARCHA 8 DE MARZO', '#c8a0e0'], [1470, 'CLASES DE GUITARRA', '#f2f2e8'], [3270, 'LLAMADAS 2026', '#f0d040']]) afiche(ax - 20, alto(2.0), t, c);
}
