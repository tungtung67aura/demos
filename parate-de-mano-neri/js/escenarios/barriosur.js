// Nivel 4 — "Barrio Sur, noche de llamadas": conventillos, casas bajas con rejas, murales de tambores, almacén
// con luz, boliche, callejón con ropa tendida y un baldío. Se pinta de día y se grada a noche; lo que brilla va en `despues`.
import { rng, tono } from '../pixel.js';
import { herramientas, pisoCalle, alto, Y0 } from './pincel.js';

export function pintarBarrioSur(x, L, luces) {
  const r = rng(57); const H = herramientas(x, r); const { R, O, T, chico, pared, cornisa, ventana, puerta, toldo, cartel, afiche, persianaMetal, tag, grafiti, aire, cable, maceta, zapas } = H;
  const brilla = []; // [x, y, w, h, color, interior?] ventanas y carteles encendidos
  // interior del almacén (se pinta encima de la luz, ya con colores de noche): estantes con mercadería, mostrador y el almacenero
  const almacen = (c, a, b, w, h) => { const F = (xx, yy, ww, hh, col) => { c.fillStyle = col; c.fillRect(xx, yy, ww, hh); }; const cols = ['#b8402a', '#3a6aa8', '#d8b040', '#4a8a4a', '#e8e0c8', '#8a5a3a'];
    for (let k = 0; k < 3; k++) { const sy = b + 10 + k * 20; F(a + 6, sy + 12, w - 12, 2, '#6a4026');
      if (k === 0) { for (let q = 0; q < Math.floor((w - 16) / 9); q++) { const X = a + 8 + q * 9; F(X, sy + 1, 7, 11, '#efe8d4'); F(X, sy + 5, 7, 3, '#2f7a35'); F(X, sy + 1, 7, 1, '#d8cca8'); F(X + 3, sy + 6, 2, 1, '#f0d040'); } continue; } // paquetes de yerba
      for (let q = 0; q < Math.floor((w - 16) / 9); q++) { const hh = 6 + ((q * 7 + k * 3) % 5); F(a + 8 + q * 9, sy + 12 - hh, 6, hh, cols[(q + k * 2) % cols.length]); F(a + 8 + q * 9, sy + 12 - hh, 6, 1, '#fff2c8'); } }
    const Yb = b + h; F(a + 66, Yb - 42, 13, 13, '#3a2418'); F(a + 62, Yb - 29, 21, 12, '#4a2a20'); F(a + 4, Yb - 20, w - 8, 18, '#5a3a22'); F(a + 4, Yb - 20, w - 8, 2, '#a8784a'); F(a + 20, Yb - 28, 18, 8, '#b8b8b0'); F(a + 110, Yb - 30, 12, 10, '#d8b040'); F(a + 128, Yb - 29, 22, 9, '#b89060'); };
  const luzV = (a, top, w, h, c = '#ffcf7a') => { brilla.push([a, top, w, h, c]); };
  pisoCalle(x, r, L, H, { asfalto: '#56505a', vereda: '#a49ca4' });
  const casa = (a, w, c, { n = 2, num = null, rejas = true, lit = [], pc = '#5a3a2a', top = alto(3.3) } = {}) => {
    pared(a, w, top, c); cornisa(a, w, top + 4, c); for (let k = a + 6; k < a + w - 6; k += 10) R(k, top - 10, 6, 10, tono(c, 0.95)); R(a, top - 12, w, 3, tono(c, 1.1)); // pretil con balaustres
    const dw = 50, dx = a + Math.round(w * 0.5) - 25; puerta(dx, dw, pc, { altoM: 2.6, numero: num });
    for (let i = 0; i < n; i++) { const vx = i === 0 ? a + 18 : a + w - 18 - 44; if (vx + 44 > dx - 6 && vx < dx + dw + 6) continue; ventana(vx, 44, { top: alto(2.4), sill: alto(0.9), reja: rejas, persiana: lit.includes(i) ? 0.2 : 0.65, marco: tono(c, 1.15) }); if (lit.includes(i)) luzV(vx + 2, alto(2.4) + 2 + Math.round((alto(0.9) - alto(2.4)) * 0.2), 40, Math.round((alto(0.9) - alto(2.4)) * 0.8) - 4); }
  };
  // 0: casas bajas
  casa(0, 220, '#d8b0a0', { num: '1104', lit: [0] }); casa(220, 200, '#b8c8d8', { num: '1098', lit: [1] }); tag(240, alto(1.2), '#e04a8a');
  // 420: el conventillo: portón ancho, patio con farol y cuartos al fondo
  { pared(420, 360, alto(3.6), '#c8b890'); cornisa(420, 360, alto(3.6) + 4, '#c8b890'); const a = 540, w = 120, tp = alto(2.9); O(a - 6, tp - 6, w + 12, Y0 - tp + 6, '#e0d4b0'); R(a, tp, w, Y0 - tp, '#2a2030');
    R(a + 4, tp + 30, w - 8, Y0 - tp - 30, '#3a3040'); for (let k = 0; k < 3; k++) { O(a + 10 + k * 36, tp + 50, 26, Y0 - tp - 50, '#5a4a3a'); } luzV(a + 46, tp + 56, 26, 30, '#ffd890'); for (let k = a + 4; k < a + w - 4; k += 8) R(k, tp, 2, Y0 - tp, '#1b1220');
    R(a + 4, tp + 24, w - 8, 1, '#8a8a8a'); for (let k = 0; k < 6; k++) R(a + 10 + k * 18, tp + 25, 10, 12 + (k % 2) * 4, ['#f2f2f2', '#4a7ac8', '#c8202a', '#f0d040', '#6ac04a', '#e8e8e0'][k]); // ropa tendida
    cartel(a - 8, tp - 26, w + 16, 14, '#e8dcc0', 'MEDIOMUNDO', '#3a2a20'); chico('CONVENTILLO · DESDE 1885', a + w / 2, tp - 34, '#e8dcc0', 'centro');
    ventana(440, 44, { top: alto(2.4), sill: alto(0.9), reja: true, persiana: 0.6 }); ventana(700, 44, { top: alto(2.4), sill: alto(0.9), reja: true, persiana: 0.15 }); luzV(702, alto(2.4) + 12, 40, 60); }
  // 780: mural de candombe (cuerda de tambores) sobre medianera
  { pared(780, 420, alto(3.0), '#e8e0d0', { ladrillo: true }); const my = alto(2.6); R(790, my, 400, Y0 - my - 14, '#2a5aa0'); for (let k = 0; k < 40; k++) R(790 + r() * 396, my + r() * 20, 6, 2, '#3a6ab8');
    const tambor = (tx, ty, h, c) => { O(tx, ty, 26, h, c); for (let k = ty + 6; k < ty + h - 4; k += 8) R(tx + 1, k, 24, 2, '#e8c040'); O(tx - 1, ty - 3, 28, 5, '#f2ead8'); R(tx + 4, ty + h, 18, 2, '#1b1220'); };
    const figura = (fx, c, h) => { R(fx + 4, my + 24, 14, 14, '#4a2a1a'); R(fx, my + 38, 22, 36, c); R(fx + 2, my + 74, 7, 30, '#1b1220'); R(fx + 13, my + 74, 7, 30, '#1b1220'); R(fx + 20, my + 46, 18, 5, '#4a2a1a'); };
    figura(820, '#f0d040'); tambor(850, my + 56, 50, '#8a3a2a'); figura(920, '#c8202a'); tambor(950, my + 60, 46, '#6a4a2a'); figura(1020, '#f2f2f2'); tambor(1050, my + 64, 40, '#9a5a2a');
    R(1100, my + 20, 60, 50, '#f0d040'); x.fillStyle = '#f0a020'; x.beginPath(); x.arc(1130, my + 45, 18, 0, 7); x.fill(); for (let k = 0; k < 12; k++) R(1130 + Math.cos(k) * 24, my + 45 + Math.sin(k) * 22, 3, 3, '#f0d040'); // sol/luna de la comparsa
    T('CHICO · REPIQUE · PIANO', 990, my + 4, '#f0d040', 1, 'centro'); chico('CUAREIM Y ISLA DE FLORES', 990, Y0 - 12, '#f2f2e8', 'centro'); }
  // 1200: almacén con luz: el corazón del barrio
  { pared(1200, 320, alto(3.2), '#e8d0a0'); cornisa(1200, 320, alto(3.2) + 4, '#e8d0a0'); toldo(1220, 280, alto(2.75), '#2a6a3a', '#e8e0d0');
    const lt = alto(2.45); O(1230, lt, 170, Y0 - lt, '#2a1a20'); luzV(1232, lt + 2, 166, Y0 - lt - 4, '#ffe0a0'); brilla[brilla.length - 1].push(almacen);
    O(1420, lt, 70, Y0 - lt, '#5a3a2a'); R(1426, lt + 6, 58, 50, '#8a6a4a'); luzV(1428, lt + 8, 54, 46, '#ffe0a0');
    cartel(1230, alto(3.2) + 10, 260, 16, '#2a3a6a', 'ALMACÉN LA LLAMADA', '#f0d040'); afiche(1500, alto(2.3), 'HAY HIELO', '#e8f0ff'); afiche(1500, alto(1.9), 'COLET', '#8a4a2a', 'FRÍO'); }
  // 1520: el callejón (pasaje oscuro con ropa tendida y un farol al fondo)
  { R(1520, -40, 160, Y0 + 40, '#3a3440'); for (let k = 0; k < 8; k++) R(1520 + k * 4, -40, 2, Y0 + 40, tono('#3a3440', 1 - k * 0.04)); for (let k = 0; k < 8; k++) R(1676 - k * 4, -40, 2, Y0 + 40, tono('#3a3440', 1 - k * 0.04));
    R(1560, alto(0.4), 80, 30, '#2a2430'); O(1570, alto(1.1), 24, 40, '#5a5a5a'); O(1604, alto(0.9), 30, 30, '#6a4a2a'); // tachos y cajas al fondo
    for (const [cy, n] of [[alto(3.0), 7], [alto(2.4), 5]]) { R(1520, cy, 160, 1, '#9a9a9a'); for (let k = 0; k < n; k++) R(1530 + k * 20, cy + 1, 12, 10 + (k % 3) * 4, ['#f2f2f2', '#c8202a', '#4a7ac8', '#f0d040', '#e88aa0', '#6ac04a', '#e8e8e0'][k]); }
    luces.push([1600, alto(2.0), 60, '#ffb060', 0.5]); brilla.push([1597, alto(2.0) - 6, 6, 8, '#ffe0a0']); chico('PASAJE', 1600, alto(3.4), '#c8c0c8', 'centro'); }
  // 1680: boliche con neón
  { casa(1680, 260, '#7a8aa0', { n: 1, pc: '#2a2a3a', lit: [0] }); const nx = 1790, ny = alto(3.0); brilla.push([nx - 70, ny, 140, 18, '#1a0a20']); luces.push([nx, ny + 9, 90, '#ff4a8a', 0.55]);
    despues.neon = [nx, ny]; afiche(1880, alto(2.2), 'TOQUE HOY', '#f0d040', '22 HS'); }
  // 1940: baldío con alambrado: se ve el barrio de atrás
  { R(1940, alto(0.3), 300, Y0 - alto(0.3), '#5a6a3a'); for (let k = 0; k < 120; k++) R(1940 + r() * 300, alto(0.3) + r() * 14, 1, 3, '#7a8a4a'); for (let k = 1940; k < 2240; k += 4) for (let yy = alto(1.6); yy < Y0; yy += 4) R(k + ((yy >> 2) & 1) * 2, yy, 1, 1, '#9a9aa2');
    for (const px of [1944, 2040, 2140, 2236]) R(px, alto(1.7), 3, Y0 - alto(1.7), '#6a5a4a'); O(2060, alto(0.7), 40, 26, '#8a3a2a'); grafiti(1960, alto(1.4), 120, 'NO TIRAR BASURA', '#f2f2e8', '#1b1220'); maceta(2200, 0.8); }
  // 2240..: más casas, una con puerta abierta y tele prendida
  casa(2240, 230, '#e0c0c8', { num: '1210', lit: [1] }); casa(2470, 240, '#c0d8b8', { num: '1222', pc: '#3a5a8a' });
  { const tv = [2470 + 18 + 8, alto(2.4) + 20, 22, 16]; brilla.push([...tv, '#8ab8ff']); luces.push([tv[0] + 11, tv[1] + 8, 40, '#6a9aff', 0.4]); }
  pared(2710, 230, alto(3.0), '#b8b0a8', { ladrillo: true }); grafiti(2730, alto(1.4), 190, 'LUBOLOS', '#f0d040', '#1b1220', 2); grafiti(2730, alto(2.4), 190, 'TAMBORES DEL SUR', '#f0d040', '#c8202a');
  // 2940: arena de jefe: gimnasio de boxeo de barrio (El Bocha)
  { pared(2940, L - 2940, alto(3.6), '#a8988a', { ladrillo: true }); cornisa(2940, L - 2940, alto(3.6) + 4, '#a8988a');
    cartel(3060, alto(3.4), 300, 20, '#c8202a', 'GIMNASIO EL BOCHA', '#ffffff', { esc: 1 }); chico('BOX · LOS JUEVES CANDOMBE', 3210, alto(3.4) - 10, '#f2f2e8', 'centro');
    for (const vx of [2980, 3120, 3260, 3400]) { ventana(vx, 80, { top: alto(2.6), sill: alto(1.2), marco: '#c8c0b0' }); luzV(vx + 2, alto(2.6) + 2, 76, alto(1.2) - alto(2.6) - 4, '#ffe8b0'); }
    O(3520, alto(2.4), 60, Y0 - alto(2.4), '#3a2a2a'); afiche(3480, alto(1.6), 'VELADA SÁBADO', '#f2f2e8', 'BOCHA VS NADIE'); }
  for (const fx of [360, 1150, 2200, 2900]) { const [lx, ly] = H.columnaLuz(fx, { brazo: 1 }); luces.push([lx, ly + 4, 70, '#ffc070', 0.55]); brilla.push([lx - 6, ly - 2, 12, 3, '#fff0c0']); }
  for (let k = 0; k < L; k += 400) cable(k, -30, k + 400, -30, 22);
  function despues(c) {
    for (const [a, b, w, h, col, interior] of brilla) {
      c.fillStyle = col; c.fillRect(a, b, w, h); if (interior) interior(c, a, b, w, h); if (w < 20 || h < 20) continue;
      // interior: degradé más cálido abajo, parante, cortina a un lado y luz que cae en la vereda
      c.fillStyle = 'rgba(200,110,40,0.22)'; c.fillRect(a, b + (h >> 1), w, h - (h >> 1));
      c.fillStyle = 'rgba(120,60,40,0.55)'; c.fillRect(a, b, Math.round(w * 0.22), h); c.fillRect(a + w - Math.round(w * 0.16), b, Math.round(w * 0.16), h);
      if (w < 100) { c.fillStyle = 'rgba(40,20,30,0.7)'; c.fillRect(a + (w >> 1), b, 1, h); c.fillRect(a, b + Math.round(h * 0.45), w, 1); }
      c.fillStyle = 'rgba(255,200,120,0.10)'; c.beginPath(); c.moveTo(a, Y0); c.lineTo(a + w, Y0); c.lineTo(a + w + 14, Y0 + 26); c.lineTo(a - 14, Y0 + 26); c.fill();
    }
    // gimnasio: bolsas colgadas a contraluz
    c.fillStyle = '#3a2028'; for (const bx of [3010, 3160, 3300, 3440]) { c.fillRect(bx, alto(2.6) + 2, 1, 14); c.fillRect(bx - 6, alto(2.6) + 16, 13, 34); c.fillRect(bx + 26, alto(2.6) + 40, 18, 30); c.fillRect(bx + 30, alto(2.6) + 30, 10, 10); }
    // siluetas detrás de las cortinas y reflejos
    c.fillStyle = 'rgba(60,30,30,0.45)'; c.fillRect(1260, alto(2.45) + 30, 30, 50); c.fillRect(1300, alto(2.45) + 20, 4, 60);
    c.fillStyle = '#2a1a1a'; for (let k = 0; k < 6; k++) c.fillRect(1250 + k * 24, alto(2.45) + 16, 14, 18);
    if (despues.neon) { const [nx, ny] = despues.neon; const H2 = herramientas(c, rng(1)); H2.T('EL TAMBOR', nx, ny + 4, '#ff6aa8', 1, 'centro', '#5a0a2a'); }
  }
  return despues;
}
