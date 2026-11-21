// Nivel 6 — "La Rambla en tormenta": murito de la rambla con el mar detrás, letras de MONTEVIDEO, pescadores,
// carrito de chorizos, garita de guardavidas, bancos de hormigón, palmeras y la escollera final (arena del Capo).
import { rng, tono } from '../pixel.js';
import { herramientas, pisoCalle, alto, Y0 } from './pincel.js';

export function pintarRambla(x, L, luces) {
  const r = rng(89); const H = herramientas(x, r); const { R, O, T, chico, cartel, afiche, tag, grafiti } = H;
  pisoCalle(x, r, L, H, { asfalto: '#4a4852', vereda: '#c0b4a4', linea: '#e8e0b0' });
  // bicisenda roja en la vereda de atrás
  R(0, 186, L, 10, '#a85a4a'); for (let xx = 0; xx < L; xx += 40) R(xx, 190, 18, 2, '#e8e0d0');
  // el murito de la rambla (hormigón con lajas) y el mar detrás
  const mt = alto(0.95);
  for (let xx = 0; xx < L; xx += 2) { const h = 2 + Math.round(Math.sin(xx * 0.05) * 1.5 + r()); R(xx, mt - 6 - h, 2, h, '#e8f0f8'); } // espuma que pega contra el muro
  R(0, mt, L, Y0 - mt, '#c8c0b4'); R(0, mt, L, 4, '#e0d8cc'); R(0, mt + 4, L, 2, '#8a8478'); for (let xx = 0; xx < L; xx += 26) { R(xx, mt + 6, 1, Y0 - mt - 6, '#a8a094'); for (let k = 0; k < 3; k++) R(xx + 3 + r() * 20, mt + 8 + r() * 30, 3 + r() * 6, 1, '#b0a89c'); }
  for (let i = 0; i < L / 40; i++) { const fx = r() * L, fy = mt + 10 + r() * 30; R(fx, fy, 2 + r() * 4, 2, '#7a8a6a'); } // verdín
  // escaleras a la playa
  for (const ex of [700, 2100]) { R(ex, mt, 60, Y0 - mt, '#a8a094'); for (let k = 0; k < 6; k++) R(ex, mt + k * 8, 60, 1, '#8a8478'); R(ex - 2, mt - 20, 3, 20, '#5a5a62'); R(ex + 59, mt - 20, 3, 20, '#5a5a62'); }
  // MONTEVIDEO en letras de colores (las de Pocitos)
  { const s = 'MONTEVIDEO', cols = ['#c8202a', '#f08a20', '#f0d040', '#6ac04a', '#2a8ad0', '#7a4ac8', '#e04a8a', '#f2f2f2', '#2ab0a0', '#f0c040'], lx = 900;
    for (let i = 0; i < s.length; i++) { const bx = lx + i * 46, by = alto(2.0); const c = cols[i]; O(bx, by, 40, Y0 - by - 4, c); R(bx + 2, by + 2, 36, 3, tono(c, 1.25)); R(bx + 34, by + 4, 4, Y0 - by - 10, tono(c, 0.75)); T(s[i], bx + 20, by + 26, '#ffffff', 4, 'centro', '#1b1220'); }
    R(lx - 6, Y0 - 6, s.length * 46 + 8, 6, '#8a8478'); chico('#MONTEVIDEO', lx + 230, Y0 - 5, '#f2f2e8', 'centro'); }
  // garita de guardavidas
  { const gx = 1500, gt = alto(3.4); for (const p of [gx + 6, gx + 64]) R(p, gt + 40, 5, Y0 - gt - 40, '#6a5a4a'); O(gx, gt, 76, 44, '#e8e0d0'); R(gx, gt, 76, 6, '#c8202a'); O(gx + 10, gt + 12, 56, 20, '#4a5a7a'); R(gx - 4, gt - 6, 84, 6, '#c8202a');
    R(gx + 72, gt - 40, 2, 40, '#5a5a62'); R(gx + 74, gt - 40, 20, 12, '#c8202a'); R(gx + 74, gt - 34, 20, 6, '#f0d040'); chico('BANDERA ROJA', gx + 38, gt + 36, '#c8202a', 'centro'); afiche(gx + 4, alto(1.2), 'PROHIBIDO BAÑARSE', '#f2f2e8'); }
  // carrito de chorizos (se ve de lado contra el murito)
  { const cx = 1880, ct = alto(1.9); O(cx, ct, 120, Y0 - ct - 16, '#e8e0d0'); R(cx, ct, 120, 8, '#c8202a'); O(cx + 6, ct + 14, 108, 34, '#3a3a44'); for (let k = 0; k < 7; k++) R(cx + 12 + k * 14, ct + 30, 10, 5, '#8a3a2a'); luces.push([cx + 60, ct + 34, 50, '#ff8a3a', 0.35]);
    R(cx + 10, ct - 30, 100, 28, '#f0d040'); R(cx + 8, ct - 32, 104, 3, '#c8202a'); T('CHORIPÁN', cx + 60, ct - 24, '#c8202a', 1, 'centro', null); chico('$180 · CON CHIMI', cx + 60, ct - 12, '#1b1220', 'centro');
    for (const wx of [cx + 20, cx + 96]) { x.fillStyle = '#1b1220'; x.beginPath(); x.arc(wx, Y0 - 8, 9, 0, 7); x.fill(); R(wx - 2, Y0 - 10, 4, 4, '#8a8a92'); } }
  // pescadores: cañas apoyadas contra el murito con el sedal al mar
  for (const px of [380, 2500, 2700]) { R(px, mt - 50, 2, 56, '#3a2a20'); x.strokeStyle = '#e8e8f0'; x.lineWidth = 1; x.beginPath(); x.moveTo(px + 1, mt - 50); x.quadraticCurveTo(px + 40, mt - 60, px + 70, mt - 2); x.stroke(); O(px - 14, Y0 - 22, 26, 20, '#2a6aa0'); R(px - 14, Y0 - 24, 26, 3, '#f2f2f2'); chico('CARNADA', px - 1, Y0 - 14, '#f2f2e8', 'centro'); }
  // bancos de hormigón, palmeras y columnas de la rambla (doble brazo)
  for (const bx of [240, 560, 1300, 2300, 3000]) { R(bx, alto(0.45), 70, 6, '#b8b0a4'); R(bx, alto(0.45) + 6, 70, 1, '#8a8478'); R(bx + 6, alto(0.45) + 6, 8, Y0 - alto(0.45) - 6, '#a8a094'); R(bx + 56, alto(0.45) + 6, 8, Y0 - alto(0.45) - 6, '#a8a094'); }
  const palmera = (px) => { for (let k = 0; k < 9; k++) R(px + Math.round(Math.sin(k * 0.4) * 3), alto(4.2) + k * ((Y0 - alto(4.2)) / 9), 10, (Y0 - alto(4.2)) / 9 + 1, k % 2 ? '#7a6048' : '#8a7058'); for (let a = 0; a < 7; a++) { const ang = -Math.PI + a * (Math.PI / 6) + 0.1; for (let k = 0; k < 14; k++) R(px + 4 + Math.cos(ang) * k * 3.2, alto(4.2) + Math.sin(ang) * k * 2 + k * k * 0.12, 4, 3, k < 7 ? '#3a6a2e' : '#4f8a36'); } };
  for (const px of [140, 820, 1420, 2620, 3240]) palmera(px);
  for (let px = 300; px < L; px += 560) { R(px, -40, 5, Y0 + 46, '#7a7a82'); R(px, -40, 1, Y0 + 46, '#a8a8b0'); R(px - 28, -16, 61, 3, '#7a7a82'); for (const s of [-1, 1]) { O(px + 2 + s * 30 - 8, -14, 16, 6, '#4a4a52'); R(px + 2 + s * 30 - 6, -8, 12, 2, '#ffe8b0'); luces.push([px + 2 + s * 30, -4, 54, '#ffe0a0', 0.4]); } }
  // la escollera final (arena del Capo): rocas, faro chico y cartel "ZONA DE PESCA"
  { const ex = L - 560; for (let k = 0; k < 40; k++) { const rx = ex + r() * 540, ry = mt - 30 + r() * 30, rw = 20 + r() * 30; O(rx, ry, rw, 16 + r() * 14, ['#6a6470', '#5a5460', '#7a7480'][k % 3]); } R(ex, mt, 560, Y0 - mt, '#b8b0a4');
    O(L - 160, alto(3.6), 30, alto(0.95) - alto(3.6), '#f2f2ea'); for (let k = 0; k < 3; k++) R(L - 159, alto(3.6) + 10 + k * 34, 28, 12, '#c8202a'); O(L - 166, alto(3.6) - 14, 42, 14, '#3a3a44'); luces.push([L - 145, alto(3.6) - 7, 70, '#fff0a0', 0.55]);
    cartel(ex + 40, alto(1.8), 130, 16, '#2a5aa0', 'ZONA DE PESCA', '#ffffff'); chico('NO SE COBRA PEAJE (TODAVÍA)', ex + 105, alto(1.8) + 20, '#2a2620', 'centro'); }
  grafiti(1740, mt + 6, 110, 'VOLVÉ CARLITOS', '#f2f2e8', '#c8202a'); tag(2900, mt + 20, '#4ad0e0'); afiche(3200, mt + 10, 'SE PERDIÓ MATE', '#f0d040', 'TIENE NOMBRE');
}
