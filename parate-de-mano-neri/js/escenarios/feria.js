// Nivel 2 — "La feria de Tristán Narvaja": domingo de mañana en el Cordón. Casas de altos con balcones,
// puestos de fruta, libros usados, pájaros y antigüedades contra las fachadas; la calle cortada llena de cajones.
import { rng, tono } from '../pixel.js';
import { herramientas, pisoCalle, alto, Y0 } from './pincel.js';

export function pintarFeria(x, L) {
  const r = rng(32); const H = herramientas(x, r); const { R, O, T, chico, pared, cornisa, ventana, puerta, toldo, cartel, afiche, persianaMetal, maceta, aire, tag, cable, zapas } = H;
  pisoCalle(x, r, L, H, { asfalto: '#5c5866', vereda: '#b4aeb6' });
  // la calle está cortada: papeles, hojas, cáscaras y lonas en el asfalto
  for (let i = 0; i < L / 14; i++) { const px = r() * L, py = 212 + r() * 38; const c = ['#e8e0c8', '#f08a30', '#c8402e', '#6aa040', '#d8c890'][Math.floor(r() * 5)]; R(px, py, 2 + Math.floor(r() * 3), 1 + Math.floor(r() * 2), c); }
  for (let i = 0; i < L / 400; i++) { const px = 120 + i * 400 + r() * 100; R(px, 226 + r() * 14, 30 + r() * 20, 1, '#3a3446'); }
  // ---- fachadas: casas de altos con balcón, locales y una galería de libros ----
  const casaAltos = (a, w, c, { balcon = true, local = null, n = 2, vent = null } = {}) => {
    pared(a, w, -40, c); cornisa(a, w, alto(3.25), c);
    if (balcon) { const by = alto(3.25) - 14; R(a + 10, by, w - 20, 3, tono(c, 0.6)); for (let k = a + 12; k < a + w - 12; k += 4) R(k, by - 16, 1, 16, '#2a2a30'); R(a + 10, by - 17, w - 20, 2, '#2a2a30'); for (let k = a + 14; k < a + w - 14; k += 24) { R(k, by - 10, 6, 6, '#c84a3a'); R(k - 1, by - 14, 8, 5, '#4f8a3a'); } }
    if (!local) for (let i = 0; i < (vent ? vent.length : n); i++) { const wx = vent ? vent[i] : a + 16 + i * ((w - 32) / n) + 6; ventana(wx, vent ? 52 : Math.min(54, (w - 40) / n), { persiana: r() < 0.5 ? 0.35 : 0, reja: r() < 0.5, cortina: r() < 0.5 ? '#c8a080' : null }); }
  };
  // esquina: kiosco de diarios y la chapa de la calle
  pared(0, 220, -40, '#d8c8a8'); cornisa(0, 220, alto(3.25), '#d8c8a8');
  O(30, alto(3.0), 72, 16, '#2a4a9a'); chico('TRISTÁN', 66, alto(3.0) + 3, '#ffffff', 'centro'); chico('NARVAJA', 66, alto(3.0) + 9, '#ffffff', 'centro');
  ventana(120, 64, { persiana: 0.5, reja: true }); puerta(36, 54, '#4a5a3a', { numero: '1608' });
  // casa con balcón y librería de usados
  casaAltos(220, 300, '#e8b88a', { local: true });
  { const lt = alto(2.5); O(236, lt, 268, Y0 - lt, '#3a2a2a'); R(238, lt + 2, 264, Y0 - lt - 2, '#5a3a30');
    for (let s = 0; s < 6; s++) { const sy = lt + 12 + s * 20; R(240, sy + 14, 260, 2, '#7a5030'); for (let k = 242; k < 498; k += 3 + Math.floor(r() * 2)) R(k, sy + 2 + Math.floor(r() * 4), 2 + Math.floor(r() * 2), 12 - Math.floor(r() * 4), ['#8a2a2a', '#2a4a7a', '#3a6a3a', '#c8a050', '#5a3a5a', '#e8e0c8', '#2a2a2a'][Math.floor(r() * 7)]); }
    cartel(256, alto(3.0) - 4, 228, 18, '#f2ead8', 'LIBROS USADOS', '#5a2a1a', { sub: 'COMPRA · VENTA · CANJE', subc: '#8a5a3a' }); }
  // antigüedades + "se arreglan paraguas"
  casaAltos(520, 260, '#a8c4b0', { vent: [690] });
  { const lt = alto(2.4); O(540, lt, 120, Y0 - lt, '#2a2a2a'); R(542, lt + 2, 116, Y0 - lt - 2, '#4a4038'); // vidriera con cachivaches
    R(548, lt + 70, 30, 40, '#8a6a3a'); R(552, lt + 60, 22, 10, '#c8a050'); R(590, lt + 50, 14, 60, '#6a4a2a'); R(586, lt + 46, 22, 6, '#d8c070'); for (let k = 0; k < 5; k++) R(612 + k * 9, lt + 80, 7, 30, ['#c8402e', '#e8d0a0', '#4a6a9a', '#c8a050', '#5a3a5a'][k]); R(620, lt + 30, 30, 20, '#e8e0c8'); R(624, lt + 34, 22, 12, '#4a7a9a');
    cartel(540, lt - 22, 120, 16, '#2a2a2a', null); chico('ANTIGÜEDADES', 600, lt - 17, '#e8c860', 'centro');
    afiche(676, alto(2.55), 'SE ARREGLAN', '#f2f2e8', 'PARAGUAS'); }
  // pajarería (jaulas colgadas) — "canario que canta el himno"
  casaAltos(780, 240, '#e6d48a', { local: true });
  { const lt = alto(2.4); persianaMetal(790, 90, lt, '#7a8a8a'); O(890, lt, 120, Y0 - lt, '#3a3020'); R(892, lt + 2, 116, Y0 - lt - 2, '#5a5040');
    for (let k = 0; k < 4; k++) { const jx = 898 + k * 28, jy = lt + 14 + (k % 2) * 16; R(jx + 9, lt + 2, 1, jy - lt - 6, '#2a2a2a'); x.fillStyle = '#c8b060'; x.beginPath(); x.ellipse(jx + 10, jy, 10, 5, 0, Math.PI, 0); x.fill(); R(jx, jy, 20, 1, '#c8b060'); R(jx, jy + 23, 20, 2, '#8a7040'); for (let b = 0; b <= 20; b += 3) R(jx + b, jy, 1, 24, '#c8b060'); R(jx + 4, jy + 16, 12, 1, '#8a7040'); R(jx + 7, jy + 10, 6, 5, ['#f0d040', '#6ac04a', '#4ab0e0', '#f07a3a'][k]); R(jx + 11, jy + 10, 2, 1, '#1b1220'); R(jx + 12, jy + 12, 2, 1, '#e8a040'); }
    cartel(892, lt - 20, 116, 16, '#f0d040', null); chico('PAJARERÍA', 950, lt - 15, '#2a2a10', 'centro');
    afiche(830, alto(1.75), 'SE VENDE CANARIO', '#fff8e0', 'CANTA EL HIMNO'); }
  // casa con balcón y macetas
  casaAltos(1020, 200, '#c8a0b4', { vent: [1034] }); puerta(1090, 52, '#3a4a6a', { numero: '1720' }); maceta(1150); maceta(1036, 0.8);
  // bar de la esquina
  casaAltos(1220, 320, '#d8d0c0', { local: true });
  { toldo(1236, 288, alto(2.6) - 4, '#c8302a', '#f2f2ea'); const lt = alto(2.4); O(1240, lt + 8, 280, Y0 - lt - 8, '#3a2a2a'); R(1242, lt + 10, 276, Y0 - lt - 10, '#ffd890');
    for (let k = 0; k < 4; k++) { const mx = 1256 + k * 66; R(mx, alto(0.75), 40, 3, '#5a3a2a'); R(mx + 18, alto(0.75), 3, 40, '#4a2a1a'); R(mx + 2, alto(0.75) - 22, 10, 22, '#3a2a3a'); R(mx + 26, alto(0.75) - 22, 10, 22, '#2a3a4a'); R(mx + 4, alto(0.75) - 34, 8, 12, '#c89070'); R(mx + 28, alto(0.75) - 34, 8, 12, '#e0a880'); }
    R(1242, lt + 10, 276, 10, 'rgba(90,40,20,0.25)'); for (let k = 0; k < 18; k++) R(1250 + k * 15, lt + 24, 4, 12, ['#3a6a3a', '#8a2a2a', '#c8a050', '#2a2a2a'][k % 4]); R(1246, lt + 36, 270, 2, '#7a4a2a');
    O(1440, lt + 44, 60, 40, '#2a3a2a'); chico('MEDIO Y MEDIO', 1470, lt + 48, '#f0f0e0', 'centro'); chico('GRAPPAMIEL', 1470, lt + 56, '#f0f0e0', 'centro'); chico('CAFÉ $60', 1470, lt + 64, '#f0d040', 'centro'); chico('TOSTADO $90', 1470, lt + 72, '#f0d040', 'centro');
    cartel(1300, alto(3.15), 200, 18, '#1b1220', 'BAR LA FERIA', '#f0c040'); }
  // fiambrería / almacén con "NO SE FÍA"
  casaAltos(1540, 260, '#b8c8d8', { local: true });
  { const lt = alto(2.4); O(1556, lt, 228, Y0 - lt, '#3a2c3a'); R(1558, lt + 2, 224, Y0 - lt - 2, '#e8dcc0');
    for (let k = 0; k < 9; k++) { R(1566 + k * 24, lt + 8, 1, 10, '#3a2a2a'); R(1562 + k * 24, lt + 18, 9, 26, k % 2 ? '#a83a2a' : '#c8a060'); } // fiambres colgados
    R(1560, alto(0.95), 220, 4, '#7a5a3a'); O(1600, alto(0.95) - 18, 28, 18, '#e8e8f0'); R(1700, alto(0.95) - 12, 30, 12, '#f0e080');
    cartel(1580, alto(3.1), 180, 18, '#c8202a', 'FIAMBRERÍA', '#ffffff'); afiche(1700, alto(1.85), 'NO SE FÍA', '#fff8e0', 'NI MAÑANA'); }
  // casa celeste y portón
  casaAltos(1800, 300, '#a8d0e0', { vent: [1830, 1910] }); puerta(1990, 56, '#6a3a2a', { numero: '1801' });
  // muro con mural de la feria y un perro pintado
  pared(2100, 280, alto(2.6), '#d8b890', { ladrillo: true }); R(2100, alto(2.6) - 4, 280, 4, '#b89870');
  O(2116, 44, 248, 74, '#3a7ab0'); for (let k = 0; k < 6; k++) { const mx = 2128 + k * 38; O(mx, 82, 30, 30, ['#f08a30', '#c8402e', '#6ac04a', '#f0d040', '#e04a8a', '#ffffff'][k]); R(mx + 2, 76, 26, 6, '#e8e0c8'); }
  T('LA FERIA', 2240, 50, '#ffe070', 2, 'centro');
  // edificio con local de discos y mates
  casaAltos(2380, 320, '#e0c0a0', { local: true });
  { const lt = alto(2.4); O(2396, lt, 140, Y0 - lt, '#2a2a3a'); R(2398, lt + 2, 136, Y0 - lt - 2, '#4a4a5a'); for (let k = 0; k < 8; k++) { const dx = 2404 + (k % 4) * 32, dy = lt + 14 + Math.floor(k / 4) * 40; O(dx, dy, 28, 28, ['#c8402e', '#3a6aa0', '#f0c040', '#2a2a2a'][k % 4]); x.fillStyle = '#111'; x.beginPath(); x.arc(dx + 14, dy + 14, 9, 0, 7); x.fill(); R(dx + 13, dy + 13, 2, 2, '#e8e0c8'); }
    cartel(2400, lt - 20, 132, 16, '#2a2a3a', null); chico('DISCOS · CASETES', 2466, lt - 15, '#f0c040', 'centro');
    O(2552, lt, 132, Y0 - lt, '#4a3020'); R(2554, lt + 2, 128, Y0 - lt - 2, '#e8d0a0'); for (let k = 0; k < 12; k++) { const mx = 2562 + (k % 6) * 20, my = lt + 20 + Math.floor(k / 6) * 34; x.fillStyle = k % 3 ? '#7a4a2a' : '#5a3a20'; x.beginPath(); x.arc(mx + 6, my + 10, 7, 0, 7); x.fill(); R(mx + 3, my, 6, 4, '#c8a050'); R(mx + 8, my - 6, 1, 8, '#c8c8d0'); }
    cartel(2556, lt - 20, 124, 16, '#4a3020', null); chico('MATES Y TERMOS', 2618, lt - 15, '#f0e0a0', 'centro'); afiche(2560, alto(2.05), 'HOY LIQUIDACIÓN', '#fff8e0', 'DE TERMOS'); }
  // casa rosada + iglesia al fondo del tramo
  casaAltos(2700, 260, '#e8b0b0', { vent: [2730] }); puerta(2840, 52, '#3a5a3a', { numero: '1955' });
  pared(2960, L - 2960, -40, '#e8e0d0'); cornisa(2960, L - 2960, alto(3.25), '#e8e0d0');
  { O(3040, alto(3.2), 160, 26, '#f2f0ea'); T('SE ALQUILA', 3120, alto(3.2) + 8, '#c8202a', 1, 'centro', null); ventana(2990, 58, { reja: true }); ventana(3230, 58, { persiana: 0.6 }); persianaMetal(3070, 120, alto(2.4), '#9a8a8a'); tag(3090, alto(2.0), '#2a5ab0'); }
  // ---- puestos contra las fachadas (detrás de la acción: base en la línea de fachada) ----
  const puesto = (a, w, tipo, c1, c2) => {
    const top = alto(2.25); R(a, top, 2, Y0 + 6 - top, '#5a5a62'); R(a + w - 2, top, 2, Y0 + 6 - top, '#5a5a62'); toldo(a - 4, w + 8, top - 2, c1, c2, 10);
    const mt = alto(0.85) + 6; O(a + 2, mt, w - 4, 6, '#9a7a5a'); R(a + 6, mt + 6, 3, Y0 + 6 - mt - 6, '#6a4a3a'); R(a + w - 9, mt + 6, 3, Y0 + 6 - mt - 6, '#6a4a3a'); R(a + 4, mt + 6, w - 8, Y0 + 6 - mt - 6, 'rgba(240,240,232,0.35)');
    const fila = (yy, cols, rad = 2) => { for (let k = a + 6; k < a + w - 6; k += rad * 2 + 1) R(k, yy - rad * 2, rad * 2, rad * 2, cols[Math.floor(r() * cols.length)]); };
    if (tipo === 'fruta') { for (let c2i = 0; c2i < Math.floor((w - 12) / 26); c2i++) { const cx = a + 6 + c2i * 26; O(cx, mt - 12, 24, 12, '#c89a5a'); const cs = [['#f08a30', '#f8a040'], ['#c8202a', '#e83a3a'], ['#6ac04a', '#4a9a3a'], ['#f0d040', '#e8c030']][c2i % 4]; for (let k = 0; k < 10; k++) R(cx + 2 + (k % 5) * 4, mt - 15 + Math.floor(k / 5) * 3, 3, 3, cs[k % 2]); O(cx + 6, mt - 22, 12, 7, '#fff8e0'); chico('$' + (20 + c2i * 15), cx + 12, mt - 21, '#1b1220', 'centro'); } }
    if (tipo === 'libros') { for (let k = a + 6; k < a + w - 8; k += 3) R(k, mt - 8 - Math.floor(r() * 4), 2, 8, ['#8a2a2a', '#2a4a7a', '#3a6a3a', '#c8a050', '#e8e0c8'][Math.floor(r() * 5)]); R(a + 8, mt - 24, 30, 14, '#fff8e0'); chico('$50', a + 23, mt - 20, '#1b1220', 'centro'); }
    if (tipo === 'verdura') { fila(mt, ['#4a9a3a', '#6ac04a', '#3a7a2a'], 3); fila(mt - 6, ['#c8402e', '#e86a3a'], 2); O(a + w - 34, mt - 22, 26, 8, '#fff8e0'); chico('3 X $100', a + w - 21, mt - 20, '#1b1220', 'centro'); }
    if (tipo === 'ropa') { for (let k = 0; k < (w - 12) / 18; k++) { R(a + 8 + k * 18, top + 18, 1, 6, '#2a2a2a'); R(a + 4 + k * 18, top + 24, 12, 20, ['#c8402e', '#3a6aa0', '#f2f2f2', '#f0c040', '#2a2a2a'][k % 5]); } fila(mt, ['#2a2a3a', '#5a3a2a', '#e8e0d0'], 3); }
    if (tipo === 'tortas') { O(a + 8, mt - 18, w - 16, 18, '#e8e8f0'); for (let k = 0; k < (w - 24) / 10; k++) { x.fillStyle = '#d8a050'; x.beginPath(); x.ellipse(a + 16 + k * 10, mt - 8, 5, 3, 0, 0, 7); x.fill(); } O(a + 10, top + 18, w - 20, 14, '#c8202a'); chico('TORTAS FRITAS $25', a + w / 2, top + 22, '#ffffff', 'centro'); R(a + w - 24, mt - 34, 12, 16, '#5a5a62'); } // olla
  };
  puesto(240, 120, 'libros', '#3a6aa0', '#f2f2ea'); puesto(560, 110, 'fruta', '#e8402a', '#f2f2ea'); puesto(1050, 120, 'verdura', '#3a9a4a', '#f2f2ea');
  puesto(1820, 130, 'fruta', '#f0a020', '#f2f2ea'); puesto(1960, 110, 'ropa', '#7a3a9a', '#f2f2ea'); puesto(2400, 120, 'libros', '#c8302a', '#f2e8c8'); puesto(2720, 120, 'tortas', '#2a7ab0', '#f2f2ea'); puesto(3260, 120, 'verdura', '#e8402a', '#f2f2ea');
  // detalles: zapas colgadas, cables de una vereda a otra, guirnalda de banderines
  for (let k = 0; k < L; k += 380) cable(k, -32, k + 380, -32, 30);
  for (let k = 200; k < L - 200; k += 760) { cable(k, -20, k + 300, -24, 18, '#2a2a2a'); for (let t = 0; t < 1; t += 0.06) { const fx = k + t * 300, fy = -20 + Math.sin(t * Math.PI) * 18 - t * 4; x.fillStyle = ['#c8202a', '#f0c040', '#3a7ab0', '#4aa040', '#f2f2f2'][Math.round(t * 50) % 5]; x.beginPath(); x.moveTo(fx, fy); x.lineTo(fx + 6, fy); x.lineTo(fx + 3, fy + 7); x.fill(); } }
  zapas(1480, -4); zapas(2900, -2); aire(1030, -2); aire(2760, -4);
  // afiches pegados sólo en pared libre
  for (const [ax, ay, t, c, sub] of [[160, alto(1.75), 'TOQUE', '#f0d040', 'SÁBADO 22H'], [1166, alto(1.8), 'GATITOS', '#f2f2e8', 'REGALO'], [2110, alto(2.0), 'CLASES DE TANGO', '#f08aa0', null], [2300, alto(1.9), 'SE PERDIÓ PERRO', '#f2f2e8', 'SE LLAMA BOCHA'], [2900, alto(1.8), 'CAMBIO FIGURITAS', '#9ad0f0', null], [3360, alto(1.85), 'MURGA', '#f0d040', 'ENSAYO ABIERTO']]) afiche(ax, ay, t, c, sub);
}
