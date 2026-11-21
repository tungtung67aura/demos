// Nivel 5 — "Ciudad Vieja → Mercado del Puerto", día gris de invierno: Puerta de la Ciudadela, peatonal Sarandí
// de adoquines, casonas coloniales con balcón de hierro, café con mesas afuera, anticuario, y el Mercado del Puerto.
import { rng, tono } from '../pixel.js';
import { herramientas, pisoCalle, alto, Y0 } from './pincel.js';

export function pintarCiudadVieja(x, L, luces) {
  const r = rng(71); const H = herramientas(x, r); const { R, O, T, chico, pared, cornisa, ventana, puerta, toldo, cartel, afiche, persianaMetal, tag, grafiti, maceta, cable } = H;
  pisoCalle(x, r, L, H, { vereda: '#a8a4a0', adoquin: '#6a6470' });
  const brilla = [];
  // casona colonial: dos plantas visibles, puertas altas con banderola, balcón de hierro forjado arriba
  const casona = (a, w, c, { puertas = 2, rotulo = null, numero = null, abajo = null } = {}) => {
    pared(a, w, -40, c, { manchas: true }); cornisa(a, w, alto(3.0), c); R(a, alto(3.0) + 6, w, 3, tono(c, 0.9));
    for (let k = a; k < a + w; k += 6) R(k, -40, 1, alto(3.0) + 40, tono(c, 0.96)); // almohadillado
    const bx = a + 14, bw = w - 28, by = alto(3.4); for (let k = 0; k < Math.floor(bw / 54); k++) { const vx = bx + 8 + k * 54; O(vx, -40, 36, by + 40 + 2, '#3a3040'); R(vx + 2, -38, 32, by + 38, '#5a6a80'); R(vx + 17, -38, 1, by + 38, '#3a3040'); }
    R(bx, by, bw, 3, '#2a2228'); R(bx, by + 3, bw, 2, '#4a4048'); R(bx, by - 18, bw, 2, '#2a2228'); for (let k = bx; k < bx + bw; k += 5) R(k, by - 16, 1, 16, '#2a2228'); for (let k = bx + 10; k < bx + bw; k += 20) { x.strokeStyle = '#2a2228'; x.lineWidth = 1; x.beginPath(); x.arc(k, by - 9, 4, 0, 7); x.stroke(); } // balcón
    R(bx + 4, by + 5, 2, 6, '#2a2228'); R(bx + bw - 6, by + 5, 2, 6, '#2a2228');
    if (abajo) return abajo(a, w);
    for (let i = 0; i < puertas; i++) { const dx = a + (w / puertas) * (i + 0.5) - 26; puerta(dx, 52, i % 2 ? '#3a4a3a' : '#4a2a2a', { altoM: 2.9, numero: i === 0 ? numero : null, marco: tono(c, 1.15) }); x.fillStyle = '#5a6a80'; x.beginPath(); x.arc(dx + 26, alto(2.9) + 2, 24, Math.PI, 0); x.fill(); R(dx + 25, alto(2.9) - 20, 1, 22, '#2a2228'); }
    if (rotulo) cartel(a + w / 2 - rotulo.length * 4 - 8, alto(3.0) - 22, rotulo.length * 8 + 16, 14, '#e8e0d0', rotulo, '#3a2a20');
  };
  // 0: Puerta de la Ciudadela (arco de piedra)
  { R(0, -40, 300, Y0 + 40, '#8a8478'); for (let yy = -40; yy < Y0; yy += 10) for (let xx = ((yy / 10) & 1) * 14; xx < 300; xx += 28) { R(xx, yy, 27, 9, tono('#8a8478', r() < 0.5 ? 0.94 : 1.06)); R(xx, yy + 9, 28, 1, '#5a5650'); }
    const ax = 90, aw = 120, at = alto(3.2); R(ax, at, aw, Y0 - at, '#2a2630'); x.fillStyle = '#2a2630'; x.beginPath(); x.arc(ax + aw / 2, at, aw / 2, Math.PI, 0); x.fill(); R(ax + 6, at + 10, aw - 12, Y0 - at - 10, '#4a4652'); // por el arco se ve la plaza
    for (const px of [ax - 22, ax + aw + 4]) { R(px, -40, 18, Y0 + 40, '#9a9488'); R(px + 2, -40, 2, Y0 + 40, '#b8b2a6'); }
    T('1746', ax + aw / 2, -30, '#e8e0d0', 1, 'centro'); chico('PUERTA DE LA CIUDADELA', ax + aw / 2, Y0 - 10, '#e8e0d0', 'centro'); }
  // 300: Sarandí: anticuario
  casona(300, 330, '#d0b8a0', { abajo: (a, w) => { const lt = alto(2.6); O(a + 20, lt, w - 120, Y0 - lt, '#2a2020'); R(a + 22, lt + 2, w - 124, Y0 - lt - 4, '#5a4a40');
    for (let k = 0; k < 5; k++) { O(a + 30 + k * 36, lt + 20 + (k % 2) * 10, 24, 30, ['#c8a050', '#8a6a4a', '#a0a0a8', '#6a3a2a', '#d0c8a0'][k]); } x.fillStyle = '#c8a050'; x.beginPath(); x.arc(a + 120, lt + 90, 14, 0, 7); x.fill(); R(a + 118, lt + 70, 4, 30, '#6a4a2a'); // gramófono y reloj
    puerta(a + w - 86, 52, '#4a2a2a', { altoM: 2.6, numero: '622' }); cartel(a + 30, alto(3.0) - 22, 150, 14, '#2a2a2a', 'ANTIGÜEDADES', '#e8c060'); } });
  // 630: café con mesas en la peatonal
  casona(630, 380, '#c8c8b8', { abajo: (a, w) => { toldo(a + 10, w - 20, alto(2.75), '#7a2a2a', '#e8dcc8'); const lt = alto(2.5); O(a + 24, lt, w - 48, Y0 - lt, '#2a1a1a'); R(a + 26, lt + 2, w - 52, Y0 - lt - 4, '#6a4a3a'); brilla.push([a + 26, lt + 2, w - 52, 40]);
    R(a + 30, lt + 60, w - 60, 8, '#4a2a1a'); for (let k = 0; k < 8; k++) R(a + 40 + k * 38, lt + 44, 10, 16, ['#2a5a2a', '#6a2a2a', '#c8a050'][k % 3]); // botellas
    O(a + 40, lt + 8, 90, 30, '#1b1220'); chico('CORTADO $95', a + 85, lt + 12, '#f2f2e8', 'centro'); chico('MEDIALUNAS', a + 85, lt + 20, '#f2f2e8', 'centro'); chico('CHIVITO AL PAN', a + 85, lt + 28, '#f0d040', 'centro');
    cartel(a + w / 2 - 80, alto(3.0) - 24, 160, 16, '#1b3a2a', 'CAFÉ SARANDÍ', '#e8d0a0', { sub: 'DESDE 1877', subc: '#c8b070' }); } });
  // 1010: casonas con puertas altas y un pasaje
  casona(1010, 300, '#b8c4c8', { puertas: 2, numero: '588' }); { O(1316, alto(2.8), 40, 16, '#f2f2ea'); chico('SARANDÍ', 1336, alto(2.8) + 5, '#2a5aa0', 'centro'); }
  casona(1310, 320, '#e0c8a8', { puertas: 2, numero: '540' }); afiche(1330, alto(1.9), 'TOUR A PIE', '#f2f2e8', 'FREE · 11 HS'); grafiti(1480, alto(1.5), 100, null, '', '');
  // 1630: museo / edificio con columnas
  { pared(1630, 320, -40, '#e0dcd0', { manchas: false }); cornisa(1630, 320, alto(3.3), '#e0dcd0'); for (let k = 0; k < 4; k++) { const cx = 1650 + k * 84; R(cx, alto(3.3) + 8, 20, Y0 - alto(3.3) - 8, '#f0ece0'); R(cx + 17, alto(3.3) + 8, 3, Y0 - alto(3.3) - 8, '#c0bcb0'); R(cx - 3, alto(3.3) + 6, 26, 6, '#d0ccc0'); R(cx - 3, Y0 - 8, 26, 8, '#d0ccc0'); }
    for (let k = 0; k < 3; k++) O(1680 + k * 84, alto(2.6), 44, Y0 - alto(2.6), '#3a3028'); T('MUSEO DEL MATE', 1790, -30, '#4a4030', 1, 'centro', null); chico('ENTRADA LIBRE · TRAÉ TU TERMO', 1790, -16, '#6a5a40', 'centro'); }
  // 1950: casa de cambio + artesanos en la vereda
  casona(1950, 300, '#d8a8a0', { abajo: (a, w) => { persianaMetal(a + 20, 120, alto(2.6), '#8a8a92'); tag(a + 40, alto(2.0), '#4ad0e0'); const lt = alto(2.6); O(a + 160, lt, 120, Y0 - lt, '#2a3a2a'); R(a + 162, lt + 2, 116, 40, '#1a2a1a'); chico('CAMBIO', a + 220, lt + 6, '#6aff6a', 'centro'); chico('US$ 39,10', a + 220, lt + 16, '#f0d040', 'centro'); } });
  for (let k = 0; k < 3; k++) { const mx = 1990 + k * 80; R(mx, alto(0.8), 60, 3, '#6a4a2a'); R(mx + 4, alto(0.8) + 3, 2, 42, '#4a3a2a'); R(mx + 54, alto(0.8) + 3, 2, 42, '#4a3a2a'); for (let j = 0; j < 7; j++) R(mx + 3 + j * 8, alto(0.8) - 5, 6, 5, ['#c8a050', '#6a2a2a', '#4a6a8a', '#e8e0d0', '#8a3a6a'][j % 5]); } // mates y artesanías
  // 2250: calle que baja al puerto: grúas al fondo (sin fachada)
  { R(2250, alto(0.5), 200, Y0 - alto(0.5), '#8a8478'); R(2250, alto(0.5) - 3, 200, 3, '#b0aaa0'); chico('PÉREZ CASTELLANO', 2350, alto(0.5) + 10, '#2a2620', 'centro'); H.columnaLuz(2300, { colonial: true }); H.columnaLuz(2410, { colonial: true }); }
  // 2450: MERCADO DEL PUERTO: estructura de hierro, reloj y parrillas humeando adentro
  { const a = 2450, w = L - 2450; R(a, -40, w, Y0 + 40, '#4a3e3a'); for (let yy = alto(2.2); yy < alto(1.2); yy += 18) R(a, yy, w, 2, '#5a4a40'); for (let k = 0; k < w / 9; k++) R(a + r() * w, alto(2.2) + Math.floor(r() * 3) * 18 - 8, 4, 8, ['#2a5a2a', '#6a2a2a', '#c8a050', '#e8e0d0'][k % 4]);
    for (let k = a; k < a + w; k += 70) { R(k, -40, 8, Y0 + 40, '#6a2a2a'); R(k + 1, -40, 2, Y0 + 40, '#8a3a3a'); } for (let yy = -30; yy < alto(2.9); yy += 30) R(a, yy, w, 4, '#6a2a2a');
    for (let k = a + 8; k < a + w; k += 70) { for (let j = 0; j < 4; j++) R(k + j * 16, -26, 1, alto(2.9) + 26, '#2a2a30'); R(k + 2, -26, 60, alto(2.9) + 26, 'rgba(160,180,200,0.12)'); }
    // portón de entrada con reloj
    const px = a + 160; O(px, alto(3.3), 160, Y0 - alto(3.3), '#6a2a2a'); R(px + 10, alto(2.8), 140, Y0 - alto(2.8), '#2a1a1a'); x.fillStyle = '#2a1a1a'; x.beginPath(); x.arc(px + 80, alto(2.8), 70, Math.PI, 0); x.fill();
    x.fillStyle = '#f2ead8'; x.beginPath(); x.arc(px + 80, alto(3.3) - 18, 14, 0, 7); x.fill(); R(px + 79, alto(3.3) - 28, 2, 10, '#1b1220'); R(px + 79, alto(3.3) - 19, 9, 2, '#1b1220');
    cartel(px - 20, -34, 200, 18, '#6a2a2a', 'MERCADO DEL PUERTO', '#f2e0b0');
    // parrillas adentro: brasas y humo (las brasas brillan)
    for (const gx of [a + 30, px + 30, a + 420, a + 640, a + 860, a + 1080]) { if (gx > L - 120) continue; O(gx, alto(1.0), 110, 10, '#2a2a2a'); R(gx - 14, alto(1.0) - 40, 2, 40, 'rgba(0,0,0,0)'); for (let k = gx + 4; k < gx + 106; k += 6) R(k, alto(1.0) - 2, 4, 2, '#5a5a5a'); brilla.push([gx + 2, alto(1.0) + 2, 106, 6, '#ff7a2a']); luces.push([gx + 55, alto(1.0), 70, '#ff8a3a', 0.4]);
      for (let k = 0; k < 6; k++) R(gx + 8 + k * 16, alto(1.0) - 8, 12, 6, ['#8a3a2a', '#a04a2a', '#6a2a1a'][k % 3]); // chorizos y asado
      O(gx - 14, alto(0.85), 138, Y0 - alto(0.85), '#6a3a22'); R(gx - 14, alto(0.85), 138, 4, '#9a6a3a'); for (let k = gx - 8; k < gx + 120; k += 22) { R(k, alto(0.85) + 10, 1, Y0 - alto(0.85) - 12, '#4a2a18'); } // barra de madera
      for (let k = 0; k < 4; k++) { const sx = gx - 6 + k * 34; R(sx, alto(0.62), 16, 4, '#2a2a2a'); R(sx + 7, alto(0.62) + 4, 2, Y0 - alto(0.62) - 4, '#3a3a3a'); R(sx + 2, Y0 - 3, 12, 2, '#3a3a3a'); } // banquetas
      O(gx + 10, alto(1.9), 90, 14, '#4a4a52'); R(gx + 40, alto(2.5) + 16, 30, alto(1.9) - alto(2.5) - 16, '#4a4a52'); R(gx + 42, alto(2.5) + 16, 2, alto(1.9) - alto(2.5) - 16, '#6a6a72'); // campana
      for (let k = 0; k < 8; k++) R(gx + 20 + r() * 70, alto(1.2) - r() * 30, 6 + r() * 6, 4, 'rgba(220,220,230,0.35)'); // humo
      O(gx, alto(2.5), 110, 16, '#1b1220'); chico(['PARRILLA EL GORDO', 'LO DE TITO', 'EL PALENQUE CHICO', 'LA PROFE', 'DON MEDIO Y MEDIO', 'LA ESTANCIA'][Math.floor(gx / 7) % 6], gx + 55, alto(2.5) + 5, '#f0d040', 'centro'); }
    afiche(a + 330, alto(1.9), 'MEDIO Y MEDIO', '#f2e0b0', '$250 LA COPA'); }
  // faroles coloniales en la peatonal
  for (const fx of [320, 980, 1600, 2230]) { const [lx, ly] = H.columnaLuz(fx, { colonial: true }); luces.push([lx, ly, 50, '#ffd090', 0.35]); }
  for (let k = 0; k < 8; k++) { const px = 600 + r() * 1500, py = 164 + r() * 4; R(px, py, 5, 3, '#8a8a92'); R(px + 4, py - 1, 2, 2, '#6a6a7a'); } // palomas
  return (c) => { for (const [a, b, w, h, col] of brilla) { c.fillStyle = col || 'rgba(255,220,150,0.35)'; c.fillRect(a, b, w, h); } };
}
