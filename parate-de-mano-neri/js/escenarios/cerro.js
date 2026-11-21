// Nivel 6 — "El Cerro: territorio de Los Pibes": plaza con canchita y hamacas, un bondi abandonado sobre ladrillos,
// el frigorífico abandonado (chimenea, ventanas rotas, portón con cadena), casas de chapa con autoservice y
// la canchita de baby fútbol que es la base de la barra (arena del jefe). Se pinta de día; lo que brilla va en `despues`.
import { rng, tono } from '../pixel.js';
import { herramientas, pisoCalle, postes, alto, Y0 } from './pincel.js';

export function pintarCerro(x, L, luces) {
  const r = rng(83); const H = herramientas(x, r); const { R, O, T, chico, pared, cornisa, ventana, puerta, toldo, cartel, afiche, persianaMetal, tag, grafiti, maceta, arbol, zapas } = H;
  const brilla = [];
  pisoCalle(x, r, L, H, { asfalto: '#5e5a56', vereda: '#a8a094' });
  // pasto (plaza y baldíos) con matas
  const pasto = (a, w, top = alto(0.5)) => { R(a, top, w, Y0 - top, '#6a8a3a'); for (let k = 0; k < w / 3; k++) R(a + r() * w, top + r() * (Y0 - top - 3), 1, 3, r() < 0.5 ? '#4a6a2a' : '#8aaa4a'); };
  const alambrado = (a, w, top) => { for (let k = a; k < a + w; k += 4) for (let yy = top; yy < Y0; yy += 4) R(k + ((yy >> 2) & 1) * 2, yy, 1, 1, '#a8a8b0'); for (let px = a; px <= a + w; px += 60) R(px, top - 4, 3, Y0 - top + 4, '#7a7a82'); R(a, top - 4, w, 2, '#8a8a92'); };
  const cubierta = (cx, cy) => { O(cx - 9, cy - 9, 18, 18, '#2a2a2e'); R(cx - 4, cy - 4, 8, 8, '#4a4a50'); R(cx - 2, cy - 2, 4, 4, '#2a2a2e'); };

  // 0..760: PLAZA — canchita con arcos, hamacas, banco y el monumento de los vecinos
  pasto(0, 760, alto(1.2)); for (const tx of [24, 214, 586, 712]) arbol(tx, alto(3.0) + r() * 16, 0.9 + r() * 0.25);
  alambrado(260, 300, alto(1.6)); // canchita
  { const cy = alto(0.55); R(270, cy, 280, 1, '#f2f2e8'); R(410, alto(1.2), 1, Y0 - alto(1.2), '#f2f2e8'); O(272, alto(1.05), 4, Y0 - alto(1.05), '#f2f2e8'); O(272, alto(1.05), 20, 3, '#f2f2e8'); O(528, alto(1.05), 20, 3, '#f2f2e8'); O(544, alto(1.05), 4, Y0 - alto(1.05), '#f2f2e8'); O(400, Y0 - 12, 9, 9, '#f2f2e8'); R(403, Y0 - 9, 3, 3, '#1b1220'); }
  { const hx = 90; O(hx, alto(2.0), 4, Y0 - alto(2.0), '#c8202a'); O(hx + 90, alto(2.0), 4, Y0 - alto(2.0), '#c8202a'); O(hx, alto(2.0), 94, 4, '#c8202a'); // hamacas
    for (const sx of [hx + 18, hx + 58]) { R(sx, alto(2.0) + 4, 1, 62, '#4a4a52'); R(sx + 14, alto(2.0) + 4, 1, 62, '#4a4a52'); O(sx - 2, alto(2.0) + 66, 19, 5, '#3a6ab8'); } }
  { O(610, Y0 - 22, 70, 6, '#8a5a3a'); O(614, Y0 - 16, 4, 16, '#4a4a52'); O(672, Y0 - 16, 4, 16, '#4a4a52'); O(610, Y0 - 38, 70, 4, '#8a5a3a'); // banco de plaza con termo olvidado
    O(650, Y0 - 34, 7, 12, '#2f7a35'); R(651, Y0 - 36, 5, 2, '#d8d8d8'); O(638, Y0 - 30, 7, 8, '#8a5a2a'); R(640, Y0 - 32, 1, 4, '#d8d8d8'); }
  O(196, alto(3.2) + 14, 4, Y0 - alto(3.2) - 14, '#5a5a62'); O(320, alto(3.2) + 14, 4, Y0 - alto(3.2) - 14, '#5a5a62');
  cartel(150, alto(3.2), 220, 16, '#2a6a3a', 'PLAZA DEL CERRO', '#ffffff'); chico('PROHIBIDO JUGAR A LA PELOTA · FIRMA: NADIE', 260, alto(3.2) - 8, '#f2f2e8', 'centro');
  tag(300, alto(1.4), '#e04a8a'); grafiti(430, alto(1.3), 100, 'LOS PIBES', '#f0d040', '#1b1220');

  // 760..1260: el bondi abandonado sobre ladrillos (diseño propio, línea 427 "fuera de servicio")
  pasto(760, 500, alto(0.6));
  { const bx = 800, by = alto(2.15), bw = 400, bh = Y0 - 14 - by;
    for (const wx of [bx + 60, bx + 320]) { O(wx - 14, Y0 - 16, 28, 16, '#a8483a'); R(wx - 12, Y0 - 12, 24, 1, '#7a2a20'); } // ladrillos donde iban las ruedas
    O(bx, by, bw, bh, '#e6e0cc'); R(bx + 1, by + 1, bw - 2, 6, '#f4f0e0'); R(bx + 1, by + bh - 22, bw - 2, 8, '#2a7a5a'); R(bx + 1, by + bh - 13, bw - 2, 3, '#e0b030'); // franja propia: verde agua y amarillo
    R(bx + 1, by + bh - 10, bw - 2, 9, '#6a6a6a');
    for (let k = 0; k < 9; k++) { const vx = bx + 50 + k * 38; O(vx, by + 10, 32, 30, k % 3 === 1 ? '#2a2a34' : '#5a7080'); if (k % 3 !== 1) { R(vx + 2, by + 12, 28, 3, '#8aa0b0'); R(vx + 6 + (k * 7) % 14, by + 18, 2, 18, '#c8d8e0'); R(vx + 10, by + 22, 12, 1, '#c8d8e0'); } } // vidrios rotos
    O(bx + 6, by + 10, 38, bh - 24, '#4a4a52'); R(bx + 8, by + 12, 34, 30, '#3a3a44'); R(bx + 24, by + 12, 1, bh - 26, '#1b1220'); // puerta delantera abierta
    O(bx + 4, by - 14, 120, 14, '#1b1220'); chico('427 FUERA DE SERVICIO', bx + 64, by - 9, '#ff9a3a', 'centro'); // cartel de destino
    for (let k = 0; k < 30; k++) R(bx + r() * bw, by + r() * bh, 3 + r() * 10, 2 + r() * 5, r() < 0.5 ? '#a8582a' : '#8a3a1a'); // óxido
    R(bx + 140, by + bh - 40, 80, 18, '#3a3030'); for (let k = 0; k < 10; k++) R(bx + 140 + r() * 80, by + bh - 44 + r() * 6, 3, 6, '#2a2020'); // quemado
    grafiti(bx + 230, by + 44, 150, 'ZONA PIBES', '#e04a8a', '#1b1220'); tag(bx + 150, by + 48, '#4ac0f0');
    afiche(bx + bw - 60, by + 12, 'VENDO', '#f2f2e8', 'ASIENTOS'); }
  cubierta(1230, Y0 - 9); cubierta(1246, Y0 - 9); cubierta(1238, Y0 - 25);

  // 1260..2240: FRIGORÍFICO ABANDONADO — paredón de ladrillo, ventanas rotas, chimenea, portón con cadena
  { pared(1260, 980, alto(4.4), '#a86a4a', { ladrillo: true }); cornisa(1260, 980, alto(4.4) + 4, '#a86a4a');
    O(1300, alto(7.6), 46, alto(4.4) - alto(7.6), '#8a4a34'); for (let k = alto(7.6); k < alto(4.4); k += 10) R(1301, k, 44, 1, '#7a3a28'); R(1296, alto(7.6) - 6, 54, 6, '#5a2a1e'); // chimenea
    T('FRIGORÍFICO EL ATLÁNTICO', 1750, alto(4.2), '#e8d8b0', 1, 'centro', '#5a2a1e'); chico('FUNDADO 1911 · CERRADO 1957 · OCUPADO 2009', 1750, alto(4.2) + 14, '#e8d8b0', 'centro');
    for (let k = 0; k < 7; k++) { const vx = 1380 + k * 120; if (vx > 1610 && vx < 1890) continue; O(vx, alto(3.6), 60, 46, '#2a2a30');
      for (let q = 0; q < 6; q++) R(vx + 2 + (q % 3) * 19, alto(3.6) + 2 + (q >> 1 & 1) * 21, 17, 19, (q + k) % 4 === 0 ? '#1b1220' : '#4a5a64'); R(vx + 1, alto(3.6) + 22, 58, 2, '#2a2a30'); R(vx + 20, alto(3.6) + 1, 2, 44, '#2a2a30'); R(vx + 40, alto(3.6) + 1, 2, 44, '#2a2a30'); }
    // portón de chapa con cadena y candado
    { const px = 1640, pw = 220, pt = alto(3.2); O(px, pt, pw, Y0 - pt, '#6a7078'); for (let k = px + 4; k < px + pw; k += 8) R(k, pt + 2, 2, Y0 - pt - 3, '#5a6068'); R(px + pw / 2 - 1, pt, 2, Y0 - pt, '#3a3e44');
      for (let k = 0; k < 10; k++) R(px + 84 + k * 5, pt + 60 + (k % 2), 4, 3, '#c8c8c8'); O(px + 106, pt + 64, 10, 10, '#d8b040');
      for (let k = 0; k < 24; k++) R(px + r() * pw, pt + r() * (Y0 - pt), 4 + r() * 12, 2 + r() * 6, '#9a5a2a');
      grafiti(px + 20, pt + 20, 180, 'NO PASAR', '#f2f2e8', '#c8202a'); chico('EXCEPTO LOS PIBES', px + pw / 2, pt + 44, '#f2f2e8', 'centro'); }
    // tachos, cubiertas y el tanque herrumbrado
    O(1960, Y0 - 34, 26, 34, '#5a6a7a'); R(1962, Y0 - 30, 22, 2, '#7a8a9a'); O(1992, Y0 - 30, 26, 30, '#7a5a3a'); cubierta(2040, Y0 - 9); cubierta(2058, Y0 - 9);
    O(2100, alto(2.6), 90, Y0 - alto(2.6) - 20, '#8a6a4a'); R(2100, alto(2.6) + 14, 90, 3, '#6a4a2a'); R(2100, alto(2.6) + 40, 90, 3, '#6a4a2a'); O(2110, Y0 - 20, 6, 20, '#4a4a52'); O(2172, Y0 - 20, 6, 20, '#4a4a52');
    grafiti(1290, alto(1.6), 160, 'EL CHAPA MANDA', '#f0d040', '#1b1220'); tag(2000, alto(1.6), '#6ac04a'); afiche(1500, alto(1.8), 'FLETES', '#f2f2e8', '099 CHAPA'); }

  // 2240..2860: casas de chapa y bloques, con el autoservice del barrio
  { const chapa = (a, w, c) => { pared(a, w, alto(2.9), c); for (let k = a; k < a + w; k += 6) R(k, alto(3.25), 4, 18, k % 12 ? '#9aa0a8' : '#7a8088'); R(a - 4, alto(3.3), w + 8, 3, '#6a7078'); };
    chapa(2240, 150, '#c8b8a0'); puerta(2290, 44, '#3a5a8a', { altoM: 2.2 }); ventana(2250, 34, { top: alto(2.2), sill: alto(1.0), reja: true, persiana: 0.5 }); maceta(2350, 0.8);
    // autoservice
    pared(2390, 280, alto(3.2), '#e8d8a8'); cornisa(2390, 280, alto(3.2) + 4, '#e8d8a8'); toldo(2400, 260, alto(2.75), '#c8202a', '#f2f2e8');
    cartel(2400, alto(3.2) + 8, 260, 16, '#2a4a8a', 'AUTOSERVICE EL CERRITO', '#f0d040');
    { const lt = alto(2.45); O(2410, lt, 150, Y0 - lt, '#2a1a20'); R(2412, lt + 2, 146, Y0 - lt - 4, '#e8dcb8');
      for (let k = 0; k < 3; k++) { const sy = lt + 10 + k * 22; R(2414, sy + 14, 142, 2, '#6a4026');
        for (let q = 0; q < 15; q++) { const X = 2416 + q * 9; if (k === 0) { R(X, sy + 2, 7, 12, '#efe8d4'); R(X, sy + 6, 7, 4, '#2f7a35'); } else if (k === 1) { R(X + 1, sy + 3, 5, 11, q % 2 ? '#7a3a1a' : '#e8e0c8'); R(X + 1, sy + 6, 5, 3, '#d8b040'); } else R(X, sy + 6, 7, 8, ['#c8202a', '#3a6aa8', '#f0d040', '#6ac04a'][q % 4]); } }
      brilla.push([2412, lt + 2, 146, 8, '#fff2c0']); }
    O(2574, alto(2.45), 80, Y0 - alto(2.45), '#5a3a2a'); afiche(2578, alto(2.2), 'COLET', '#8a4a2a', 'BIEN FRÍA'); afiche(2578, alto(1.5), 'YERBA', '#2f7a35', '2 X $U 290');
    chico('SE VENDE GARRAFA · SE CARGA CELULAR · SE FÍA A NADIE', 2530, Y0 - 10, '#1b1220', 'centro');
    chapa(2670, 190, '#a8b8c8'); puerta(2720, 44, '#6a3a2a', { altoM: 2.2 }); ventana(2800, 34, { top: alto(2.2), sill: alto(1.0), reja: true, persiana: 0.2 }); zapas(2760, alto(3.3) - 30); }

  // 2860..L: LA CANCHITA DE LOS PIBES — arena del jefe: alambrado, tags, sillón tirado y tanque con fuego
  { pasto(2860, L - 2860, alto(1.0)); alambrado(2880, L - 2900, alto(2.4));
    grafiti(2900, alto(2.0), 240, 'TERRITORIO DE LOS PIBES', '#f0d040', '#c8202a'); grafiti(3180, alto(1.4), 160, 'EL CHAPA', '#f2f2e8', '#1b1220', 2);
    tag(3360, alto(1.2), '#e04a8a'); tag(3420, alto(1.6), '#4ac0f0');
    O(3040, Y0 - 26, 70, 26, '#7a3a5a'); R(3044, Y0 - 34, 62, 10, '#8a4a6a'); O(3040, Y0 - 34, 10, 30, '#7a3a5a'); O(3100, Y0 - 34, 10, 30, '#7a3a5a'); R(3060, Y0 - 22, 10, 6, '#c8a080'); // sillón viejo
    O(3250, Y0 - 36, 26, 36, '#5a5a62'); R(3252, Y0 - 30, 22, 2, '#7a7a82'); R(3252, Y0 - 16, 22, 2, '#7a7a82'); luces.push([3263, Y0 - 44, 80, '#ff8a3a', 0.7]); brilla.push([3254, Y0 - 44, 18, 8, '#ffb040']); // tanque con fuego
    cartel(3380, alto(3.0), 200, 14, '#1b1220', 'BABY FÚTBOL LOS PIBES', '#6ac04a'); chico('ENTRADA LIBRE · SALIDA NO', 3480, alto(3.0) - 8, '#f2f2e8', 'centro'); }
  postes(x, r, L, H, 220);
  function despues(c) {
    for (const [a, b, w, h, col] of brilla) { c.fillStyle = col; c.fillRect(a, b, w, h); }
    // llamas del tanque
    c.fillStyle = '#ffd040'; c.fillRect(3258, Y0 - 50, 4, 8); c.fillRect(3264, Y0 - 54, 4, 12); c.fillStyle = '#ff6a2a'; c.fillRect(3254, Y0 - 44, 6, 6); c.fillRect(3268, Y0 - 46, 5, 6);
  }
  return despues;
}
