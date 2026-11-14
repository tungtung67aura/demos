// Arte de los zombis v8 "Rambla: Zona Cero": ropa uruguaya, caras, cuerpos y accesorios SIN sumar draw calls.
// - Un atlas (DataTexture 2048x2048, 16x16 celdas de 128 px; torsos en 4x2 celdas) pintado en canvas al cargar: camisetas de cuadros (solo colores y rayas,
//   sin escudos ni marcas), disfraces, pantalones, caras podridas, brazos con heridas.
// - Cada pieza instanciada (torso, manga, cadera, pierna, cabeza, brazo, mandíbula, chaleco) lleva un atributo por instancia
//   aTile = (tile + 1, semilla). 0 = sin atlas (se ve como antes). El alfa del atlas marca la zona que se tiñe con el color de
//   instancia (piel, remera lisa); lo demás se ve con su color propio (rayas de Peñarol, sangre, dientes).
// - Accesorios nuevos (galera, tambor, caña, boina, vincha, rodete, termo bajo el brazo, mate, delantal, poncho, pelos)
//   son filas extra de la tabla DET de zombis.js: van en las mismas InstancedMesh que ya existen.
// Hooks en zombis.js (ver ARTE-API.md): ...ARTE_DET en DET, ...ARTE_FLAGS en FLAGS, hombro0 en padres,
// instalarArte(this) en el constructor de Horda, this._za = z en dibujar, vestirZombi(z, tipo) al final de prepararZombi.
import * as THREE from 'https://esm.sh/three@0.160.0';

// ---------------------------------------------------------------- accesorios (filas DET) ----------------------------------------------
// [pieza, hueso, posición, escala, rotación, color, bandera, límite] — mismo formato que DET en zombis.js.
// Colores: 'acc1' / 'acc2' / 'piel' / 'pelo' / 'sangre' son del zombi; el resto sale de ARTE_K (se suman a horda.K).
export const ARTE_K = { maderaA: 0x6e3f1c, parche: 0xe6dcc2, canaA: 0x2c2a26, calabaza: 0x5a3c16, plata2: 0xc8ccd2, negro2: 0x141416, lazo: 0xc01818 };
export const ARTE_FLAGS = ['galera', 'tamborC', 'canaP', 'gorroP', 'vincha', 'boina', 'poncho', 'rodete', 'termoA', 'mate', 'delantal', 'melena', 'cresta', 'afro', 'huesoB', 'gorroL'];
const TAMB_C = [-0.15, 0.02, 0.24], TAMB_E = [1.1, 0, 0.3], TAMB_A = [-0.296, 0.434, 0.851]; // centro, giro y eje del tambor (colgado del hombro, adelante a la izquierda)
const enEje = (k) => TAMB_C.map((c, i) => c + TAMB_A[i] * k);
export const ARTE_DET = [
  // galera de murga: copa, ala y cinta
  ['cilindro', 'cabeza', [0, 0.37, -0.012], [0.3, 0.21, 0.3], [-0.08, 0, 0.04], 'acc1', 'galera', 'c'],
  ['cilindro', 'cabeza', [0, 0.268, -0.004], [0.46, 0.016, 0.46], [-0.08, 0, 0.04], 'acc1', 'galera', 'c'],
  ['cilindro', 'cabeza', [0, 0.3, -0.006], [0.306, 0.05, 0.306], [-0.08, 0, 0.04], 'acc2', 'galera', 'c'],
  // tambor de candombe: cuerpo de madera, parche, dos flejes, correa cruzada y el palo en la mano
  ['cilindro', 'cuerpo', TAMB_C, [0.27, 0.6, 0.27], TAMB_E, 'maderaA', 'tamborC', null],
  ['cilindro', 'cuerpo', enEje(0.305), [0.262, 0.02, 0.262], TAMB_E, 'parche', 'tamborC', null],
  ['cilindro', 'cuerpo', enEje(0.2), [0.282, 0.035, 0.282], TAMB_E, 'acc2', 'tamborC', null],
  ['cilindro', 'cuerpo', enEje(-0.2), [0.282, 0.035, 0.282], TAMB_E, 'acc2', 'tamborC', null],
  ['caja', 'torso', [0.01, 0.07, 0.152], [0.05, 0.64, 0.02], [0, 0, 0.72], 'cuero', 'tamborC', null],
  ['cilindro', 'hombro1', [0, -0.7, 0.07], [0.024, 0.34, 0.024], [-1.35, 0, 0], 'maderaA', 'tamborC', 'b1'],
  // caña de pescar en la mano (apunta para arriba y adelante) con el reel
  ['cilindro', 'hombro1', [0, -1.02, 0.63], [0.022, 1.6, 0.022], [-1.0, 0, 0], 'canaA', 'canaP', 'b1'],
  ['cilindro', 'hombro1', [0.055, -0.77, 0.2], [0.075, 0.05, 0.075], [0, 0, 1.57], 'plata2', 'canaP', 'b1'],
  // gorro de pescador (piluso): copa + ala
  ['gorra', 'cabeza', [0, 0.1, -0.004], [1.04, 0.86, 1.04], [0, 0, 0], 'acc2', 'gorroP', 'c'],
  ['cilindro', 'cabeza', [0, 0.112, 0], [0.47, 0.012, 0.47], [0.05, 0, 0], 'acc2', 'gorroP', 'c'],
  // vincha de corredor
  ['toro', 'cabeza', [0, 0.17, 0.004], [0.31, 0.45, 0.31], [0, 0, 0], 'acc1', 'vincha', 'c'],
  // boina (gaucho) con el pirulín
  ['esfera', 'cabeza', [0.02, 0.258, -0.012], [0.38, 0.1, 0.38], [-0.12, 0, 0.14], 'negro2', 'boina', 'c'],
  ['esfera', 'cabeza', [0.03, 0.31, -0.02], [0.03, 0.035, 0.03], [0, 0, 0], 'negro2', 'boina', 'c'],
  // poncho: la malla del chaleco más grande, con su tile del atlas
  ['chaleco', 'torso', [0, 0.03, 0], [1.17, 1.07, 1.22], [0, 0, 0], 'acc2', 'poncho', null],
  // abuela: rodete, termo bajo el brazo (con tapa) y el mate con bombilla en la mano
  ['esfera', 'cabeza', [0, 0.2, -0.13], [0.14, 0.12, 0.13], [0, 0, 0], 'pelo', 'rodete', 'c'],
  ['cilindro', 'torso', [-0.29, -0.04, 0.05], [0.095, 0.34, 0.095], [0.2, 0, -0.1], 'acc2', 'termoA', null],
  ['cilindro', 'torso', [-0.271, 0.145, 0.088], [0.08, 0.06, 0.08], [0.2, 0, -0.1], 'plata2', 'termoA', null],
  ['cilindro', 'hombro1', [0, -0.6, 0.067], [0.085, 0.09, 0.085], [1.3, 0, 0], 'calabaza', 'mate', 'b1'],
  ['cilindro', 'hombro1', [0.02, -0.575, 0.15], [0.012, 0.11, 0.012], [1.3, 0, 0.3], 'plata2', 'mate', 'b1'],
  // delantal de feriante (la pechera va pintada en el tile del torso)
  ['caja', 'cadera', [0, -0.17, 0.128], [0.34, 0.37, 0.012], [0.04, 0, 0], 'acc2', 'delantal', null],
  // pelos: melena, cresta, afro
  ['caja', 'cabeza', [0, 0.05, -0.115], [0.29, 0.27, 0.09], [0.12, 0, 0], 'pelo', 'melena', 'c'],
  ['caja', 'cabeza', [0, 0.285, 0], [0.035, 0.075, 0.27], [0, 0, 0], 'pelo', 'cresta', 'c'],
  ['esfera', 'cabeza', [0, 0.155, -0.02], [0.42, 0.38, 0.43], [0, 0, 0], 'pelo', 'afro', 'c'],
  // hueso del antebrazo al aire
  ['cilindro', 'brazo0', [0.03, -0.36, 0.045], [0.026, 0.17, 0.026], [0, 0, 0.12], 'hueso', 'huesoB', 'b0'],
  // gorro de lana de hincha con pompón
  ['gorra', 'cabeza', [0, 0.102, -0.004], [1.03, 1.06, 1.03], [0, 0, 0], 'acc1', 'gorroL', 'c'],
  ['esfera', 'cabeza', [0, 0.292, -0.004], [0.075, 0.075, 0.075], [0, 0, 0], 'acc2', 'gorroL', 'c']
];

// ---------------------------------------------------------------- atlas ------------------------------------------------------------------
const TW = 128, COLS = 16, FILAS = 16, SV = 2; // SV: sobremuestreo vertical al pintar (la remapeo de arco interpola entre filas)
const TILE = {}, ANCHO = {}; const PINTORES = []; let celdaLibre = 0; // id -> celda del atlas
// tipo: 'lathe' (cápsula: u=0 adelante, se pinta en largo de arco), 'esfera' (u=0.25 adelante), 'plano' (sin corrimiento)
// Torsos y chalecos (donde van los textos y números) usan tiles grandes de 4x2 celdas (512x256): 4 veces la resolución de antes,
// así "URUGUAY", "1811" o "MONTEVIDEO" se leen de cerca. Las caras van en tiles dobles (256x128). Todo se pinta igual en 128x128 lógicos.
function tile(id, tipo, geo, pintar) {
  const ancho = geo === 'torso' || geo === 'chaleco' ? 4 : geo === 'cabeza' ? 2 : 1, alto = ancho === 4 ? 2 : 1;
  ANCHO[id] = ancho; PINTORES.push({ id, tipo, geo, pintar, celda: -1, ancho, alto });
}
// ubica los tiles en el atlas: primero los grandes (de a pares de filas), después dobles y simples en lo que queda
function ubicarTiles() {
  const libre = new Uint8Array(COLS * FILAS); let max = 0;
  const cabe = (c, an, al) => { if (c % COLS + an > COLS || Math.floor(c / COLS) + al > FILAS) return false; for (let j = 0; j < al; j++) for (let i = 0; i < an; i++) if (libre[c + j * COLS + i]) return false; return true; };
  for (const an of [4, 2, 1]) for (const P of PINTORES) if (P.ancho === an) {
    let c = 0; while (c < COLS * FILAS && !cabe(c, P.ancho, P.alto)) c++;
    if (c >= COLS * FILAS) { console.error('zombis-arte: el atlas se quedó sin lugar', P.id); c = 0; }
    for (let j = 0; j < P.alto; j++) for (let i = 0; i < P.ancho; i++) libre[c + j * COLS + i] = 1;
    P.celda = c; TILE[P.id] = c; max = Math.max(max, c + (P.alto - 1) * COLS + P.ancho);
  }
  celdaLibre = max;
}

let semillaRnd = 1;
const rnd = () => { semillaRnd |= 0; semillaRnd = (semillaRnd + 0x6D2B79F5) | 0; let t = Math.imul(semillaRnd ^ (semillaRnd >>> 15), 1 | semillaRnd); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const hex = c => typeof c === 'number' ? '#' + c.toString(16).padStart(6, '0') : c;
// pinta algo en x y en x±128 (la tela da la vuelta)
function envolver(fn) { for (const dx of [-TW, 0, TW]) fn(dx); }
function fondo(g, m, col, teñido) { g.fillStyle = hex(col); g.fillRect(0, 0, TW, TW); m.fillStyle = teñido ? '#fff' : '#000'; m.fillRect(0, 0, TW, TW); }
function grano(g, n = 900, a = 0.10) { for (let i = 0; i < n; i++) { const v = rnd() < 0.5 ? 0 : 255; g.fillStyle = `rgba(${v},${v},${v},${a * (0.3 + rnd() * 0.7)})`; g.fillRect(rnd() * TW, rnd() * TW, 1 + (rnd() < 0.2), 1); } }
function tramaTela(g, a = 0.06) { for (let y = 0; y < TW; y += 2) { g.fillStyle = `rgba(0,0,0,${a})`; g.fillRect(0, y, TW, 1); } }
function pliegues(g, n = 6, a = 0.12) { for (let i = 0; i < n; i++) { const x = rnd() * TW, y = rnd() * TW, gr = g.createLinearGradient(x - 6, y, x + 6, y); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, `rgba(0,0,0,${a})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(x - 5, y); g.lineTo(x + 5, y); g.lineTo(x + 2 + (rnd() - 0.5) * 20, y + 20 + rnd() * 25); g.lineTo(x - 2 + (rnd() - 0.5) * 20, y + 20 + rnd() * 25); g.fill(); } }
function rayasV(g, cols, n, x0 = 0) { const w = TW / n; for (let i = -1; i <= n; i++) { g.fillStyle = hex(cols[(i + cols.length * 4) % cols.length]); g.fillRect(x0 + i * w, 0, Math.ceil(w), TW); } }
function cuello(g, m, col, v = true, ancho = 11, hondo = 16) { // franja en el polo de arriba + escote en V o redondo adelante (x=64)
  g.fillStyle = hex(col); g.fillRect(0, 0, TW, 4);
  if (v) { g.beginPath(); g.moveTo(64 - ancho, 0); g.lineTo(64 + ancho, 0); g.lineTo(64, hondo); g.closePath(); g.fill(); g.fillStyle = 'rgba(30,20,20,0.85)'; g.beginPath(); g.moveTo(64 - ancho + 3, 0); g.lineTo(64 + ancho - 3, 0); g.lineTo(64, hondo - 4); g.fill(); }
  else { g.beginPath(); g.ellipse(64, 0, ancho, hondo * 0.6, 0, 0, Math.PI); g.fill(); g.fillStyle = 'rgba(30,20,20,0.85)'; g.beginPath(); g.ellipse(64, 0, ancho - 3, hondo * 0.6 - 3, 0, 0, Math.PI); g.fill(); }
  if (m) { m.fillStyle = '#000'; m.fillRect(0, 0, TW, hondo + 1); }
}
function puños(g, col, alto = 12) { g.fillStyle = hex(col); g.fillRect(0, TW - alto, TW, alto); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, TW - alto, TW, 1.5); }
// el texto se rasteriza al tamaño real del tile: con la escala en el transform, Chrome agranda el glifo chico y queda pixelado
function escribir(g, txt, x, y, tam) { g.save(); g.translate(x, y); const T = g.getTransform(), k = Math.hypot(T.c, T.d) || 1; g.scale(1 / k, 1 / k); g.font = `bold ${tam * k}px sans-serif`; g.fillText(txt, 0, 0); g.restore(); }
function numero(g, txt, col, y = 52, tam = 30) { g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = hex(col); for (const x of [0, TW]) escribir(g, txt, x, y, tam); } // espalda: x=0 y x=128
function texto(g, txt, col, x, y, tam, rot = 0, m = null) { if (m) texto(m, txt, '#000', x, y, tam, rot); g.save(); g.translate(x, y); g.rotate(rot); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = hex(col); escribir(g, txt, 0, 0, tam); g.restore(); }
// manchas: sangre seca (no se tiñe), mugre marrón, agujeros/rasgones
function sangre(g, m, n = 3, tam = 1) {
  for (let i = 0; i < n; i++) {
    const x = rnd() * TW, y = 20 + rnd() * (TW - 25), r = (4 + rnd() * 9) * tam;
    const cols = ['rgba(90,6,6,0.92)', 'rgba(120,10,8,0.85)', 'rgba(60,4,4,0.9)'];
    g.fillStyle = cols[i % 3]; m.fillStyle = '#000';
    const pts = []; for (let k = 0; k < 9; k++) { const a = k / 9 * 6.283, rr = r * (0.6 + rnd() * 0.6); pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); }
    const gotas = []; for (let k = 0; k < 4; k++) gotas.push([x + (rnd() - 0.5) * r * 2.4, y + (rnd() - 0.5) * r * 2.4, 1 + rnd() * 2.2]);
    const chorro = rnd() < 0.6 ? [2 + rnd() * 2, 8 + rnd() * 18] : null;
    for (const ctx of [g, m]) {
      ctx.beginPath(); for (const p of pts) ctx.lineTo(p[0], p[1]); ctx.fill();
      for (const q of gotas) { ctx.beginPath(); ctx.arc(q[0], q[1], q[2], 0, 6.283); ctx.fill(); }
      if (chorro) ctx.fillRect(x - chorro[0] / 2, y, chorro[0], chorro[1]);
    }
  }
}
function mugre(g, n = 6, a = 0.25) { for (let i = 0; i < n; i++) { const x = rnd() * TW, y = rnd() * TW, r = 6 + rnd() * 16, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(60,45,25,${a})`); gr.addColorStop(1, 'rgba(60,45,25,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); } }
function rasgones(g, m, n = 2) { for (let i = 0; i < n; i++) { const x = rnd() * TW, y = 30 + rnd() * 80, w = 5 + rnd() * 9, h = 3 + rnd() * 6; g.fillStyle = 'rgba(40,14,12,0.95)'; m.fillStyle = '#000'; for (const c of [g, m]) { c.beginPath(); c.moveTo(x - w, y); c.lineTo(x - w * 0.3, y - h); c.lineTo(x + w * 0.2, y - h * 0.3); c.lineTo(x + w, y - h * 0.8); c.lineTo(x + w * 0.7, y + h); c.lineTo(x - w * 0.4, y + h * 0.6); c.fill(); } } }
function costura(g, x0, y0, x1, y1, col = 'rgba(0,0,0,0.3)') { g.strokeStyle = col; g.lineWidth = 1; g.setLineDash([2, 2]); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.setLineDash([]); }
function piel(g, m, y0, y1, x0 = 0, x1 = TW) { // zona de piel: blanca (la tiñe el color de piel del zombi) con venitas y mugre
  g.fillStyle = '#f2f2f2'; g.fillRect(x0, y0, x1 - x0, y1 - y0); m.fillStyle = '#fff'; m.fillRect(x0, y0, x1 - x0, y1 - y0);
  for (let i = 0; i < 4; i++) { g.strokeStyle = 'rgba(70,40,90,0.25)'; g.lineWidth = 1; let x = x0 + rnd() * (x1 - x0), y = y0 + rnd() * (y1 - y0); g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (rnd() - 0.5) * 10; y += rnd() * 7; g.lineTo(x, y); } g.stroke(); }
  for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(0,0,0,${0.05 + rnd() * 0.08})`; g.fillRect(x0 + rnd() * (x1 - x0), y0 + rnd() * (y1 - y0), 1, 1); }
}

// ---- camisetas de cuadros (torso, cápsula: y=0 cuello · y≈32 hombros · y=128 cintura; x=64 frente, x=0/128 espalda) ----
function camiseta(id, base, dibujo, cuelloCol, v = true) {
  tile(id, 'lathe', 'torso', (g, m) => { fondo(g, m, base, false); dibujo(g, m); tramaTela(g, 0.05); pliegues(g, 5, 0.1); cuello(g, m, cuelloCol, v); grano(g, 700, 0.06); mugre(g, 5, 0.22); sangre(g, m, 2 + (rnd() * 2 | 0)); rasgones(g, m, 1 + (rnd() * 2 | 0)); });
}
const AMARILLO = 0xf2c20e, NEGRO = 0x151515, BLANCO = 0xf1f1ee, AZUL = 0x16307a, ROJO = 0xc81e1e, CELESTE = 0x5fb2e6, VIOLETA = 0x5b2a8c;
camiseta('t_pena', AMARILLO, g => rayasV(g, [AMARILLO, NEGRO], 18, -3.56), NEGRO, false);
camiseta('t_nac', BLANCO, g => { g.fillStyle = hex(AZUL); g.fillRect(0, 26, TW, 3); g.fillStyle = hex(ROJO); g.fillRect(0, 29, TW, 2); numero(g, '10', AZUL, 60); }, AZUL, true);
camiseta('t_cel', CELESTE, g => { numero(g, '9', NEGRO, 60); g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(0, 34, TW, 2); }, BLANCO, true);
camiseta('t_danu', BLANCO, g => { g.fillStyle = hex(NEGRO); envolver(dx => { g.beginPath(); g.moveTo(dx + 34, 14); g.lineTo(dx + 50, 14); g.lineTo(dx + 104, 128); g.lineTo(dx + 88, 128); g.fill(); }); }, NEGRO, false);
camiseta('t_defe', VIOLETA, g => { g.fillStyle = hex(BLANCO); g.fillRect(0, 30, TW, 2); numero(g, '8', BLANCO, 60); }, BLANCO, true);
camiseta('t_wand', BLANCO, g => rayasV(g, [NEGRO, BLANCO], 18, -3.56), NEGRO, false);
camiseta('t_cerro', BLANCO, g => rayasV(g, [CELESTE, BLANCO], 18, -3.56), CELESTE, true);
camiseta('t_liver', NEGRO, g => rayasV(g, [0x1f4aa8, NEGRO], 18, -3.56), NEGRO, false);
// ---- disfraces y ropa de la rambla ----
tile('t_murga', 'lathe', 'torso', (g, m) => { // levita de murga: rombos de colores con lentejuelas
  fondo(g, m, 0x2a1050, false);
  const C = ['#e8243c', '#f6c40c', '#1ab0d8', '#20b850', '#f070c8', '#ff7a1a'];
  for (let j = -1; j < 9; j++) for (let i = -1; i < 9; i++) { g.fillStyle = C[(i + j * 3 + 12) % C.length]; const cx = i * 16 + (j % 2) * 8, cy = j * 16; g.beginPath(); g.moveTo(cx, cy - 9); g.lineTo(cx + 8, cy); g.lineTo(cx, cy + 9); g.lineTo(cx - 8, cy); g.fill(); }
  for (let i = 0; i < 1400; i++) { g.fillStyle = `rgba(255,255,255,${rnd() * 0.55})`; g.fillRect(rnd() * TW, rnd() * TW, 1, 1); } // lentejuelas
  g.fillStyle = '#f6c40c'; g.fillRect(62, 0, 4, TW); for (let y = 30; y < 120; y += 14) { g.fillStyle = '#fff'; g.beginPath(); g.arc(64, y, 2.4, 0, 6.3); g.fill(); } // botonera
  cuello(g, m, 0xffffff, true, 14, 20); mugre(g, 4, 0.2); sangre(g, m, 2);
});
tile('t_candombe', 'lathe', 'torso', (g, m) => { // camisa de comparsa: satén a franjas anchas con banda cruzada
  fondo(g, m, 0xe8b818, false); rayasV(g, ['#e8b818', '#1a8a3a', '#e8b818', '#c41c1c'], 8);
  const gr = g.createLinearGradient(0, 0, TW, 0); for (let k = 0; k <= 8; k++) gr.addColorStop(k / 8, k % 2 ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)'); g.fillStyle = gr; g.fillRect(0, 0, TW, TW); // brillo del satén
  g.fillStyle = '#f4f0e0'; envolver(dx => { g.beginPath(); g.moveTo(dx + 84, 10); g.lineTo(dx + 96, 10); g.lineTo(dx + 48, 128); g.lineTo(dx + 36, 128); g.fill(); });
  cuello(g, m, 0xf4f0e0, false, 13, 16); sangre(g, m, 2); rasgones(g, m, 1);
});
tile('t_pesca', 'lathe', 'torso', (g, m) => { // campera de nylon verde oliva con chaleco de bolsillos
  fondo(g, m, 0x5a6a3a, false); tramaTela(g, 0.07);
  for (const x of [40, 74]) { g.fillStyle = '#3e4a28'; g.fillRect(x, 50, 16, 14); g.fillRect(x, 74, 16, 16); g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x, 50, 16, 2); g.fillRect(x, 74, 16, 2); }
  g.fillStyle = '#9aa0a0'; g.fillRect(63, 12, 2, 116); pliegues(g, 8, 0.15); cuello(g, m, 0x3e4a28, false, 13, 12); mugre(g, 8, 0.3); sangre(g, m, 2);
});
tile('t_runner', 'lathe', 'torso', (g, m) => { // musculosa flúo con dorsal de carrera
  fondo(g, m, 0xb8f018, false); g.fillStyle = '#1a1a1a'; g.fillRect(0, 118, TW, 10);
  g.fillStyle = '#f8f8f8'; g.fillRect(46, 50, 36, 28); g.strokeStyle = '#333'; g.strokeRect(46.5, 50.5, 35, 27); texto(g, '1811', '#c01010', 64, 66, 15); texto(g, 'RAMBLA 10K', '#222', 64, 55, 6);
  piel(g, m, 0, 26, 0, 22); piel(g, m, 0, 26, 106, 128); piel(g, m, 0, 22, 44, 84); // sisas y escote grande: se ve la piel
  grano(g, 600, 0.06); sangre(g, m, 3); rasgones(g, m, 1);
});
tile('t_surf', 'lathe', 'torso', (g, m) => { // traje de neoprene con paneles y cierre en la espalda
  fondo(g, m, 0x1a1c20, false); g.fillStyle = '#2a7ab8'; g.fillRect(20, 26, 10, 102); g.fillRect(98, 26, 10, 102); g.fillStyle = '#e04a20'; g.fillRect(30, 26, 3, 102); g.fillRect(95, 26, 3, 102);
  g.fillStyle = '#555'; g.fillRect(0, 10, 3, 118); g.fillRect(125, 10, 3, 118); texto(g, 'PUNTA', '#d8d8d8', 64, 46, 9);
  for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(255,255,255,${rnd() * 0.06})`; g.fillRect(rnd() * TW, rnd() * TW, 2, 1); }
  cuello(g, m, 0x101010, false, 13, 9); sangre(g, m, 2); rasgones(g, m, 2);
});
tile('t_feria', 'lathe', 'torso', (g, m) => { // camisa a cuadros con pechera de delantal
  fondo(g, m, 0xb83228, false);
  for (let x = 0; x < TW; x += 16) { g.fillStyle = 'rgba(20,20,20,0.35)'; g.fillRect(x, 0, 7, TW); } for (let y = 0; y < TW; y += 16) { g.fillStyle = 'rgba(20,20,20,0.35)'; g.fillRect(0, y, TW, 7); }
  g.fillStyle = '#ece4d0'; g.fillRect(40, 34, 48, 94); g.fillStyle = '#d8ccb0'; g.fillRect(40, 34, 48, 3); g.fillRect(36, 34, 4, 94); g.fillRect(88, 34, 4, 94);
  g.fillStyle = '#ece4d0'; g.fillRect(44, 0, 5, 34); g.fillRect(79, 0, 5, 34); texto(g, 'FERIA', 'rgba(60,90,50,0.8)', 64, 70, 11); texto(g, 'TRISTÁN N.', 'rgba(60,90,50,0.7)', 64, 82, 6);
  mugre(g, 8, 0.35); sangre(g, m, 3); cuello(g, m, 0x8a2018, true, 9, 12);
});
tile('t_chofer', 'lathe', 'torso', (g, m) => { // camisa celeste de uniforme (genérico, sin logo de empresa), charreteras y bolsillos
  fondo(g, m, 0x9ec4e0, false); tramaTela(g, 0.05);
  g.fillStyle = '#1c2a4a'; g.fillRect(20, 20, 14, 6); g.fillRect(94, 20, 14, 6); // charreteras
  g.fillStyle = 'rgba(40,60,90,0.35)'; g.fillRect(42, 42, 16, 15); g.fillRect(70, 42, 16, 15); g.fillStyle = 'rgba(40,60,90,0.5)'; g.fillRect(42, 42, 16, 2); g.fillRect(70, 42, 16, 2);
  g.fillStyle = '#d8d0b0'; g.fillRect(71, 46, 9, 4); texto(g, '121', '#222', 76, 48, 5); // chapita con el número de línea
  g.fillStyle = 'rgba(255,255,255,0.7)'; for (let y = 22; y < 128; y += 16) { g.beginPath(); g.arc(61, y, 1.4, 0, 6.3); g.fill(); }
  pliegues(g, 6, 0.12); cuello(g, m, 0x8ab0d0, true, 10, 12); mugre(g, 5, 0.2); sangre(g, m, 3);
});
tile('t_abuela', 'lathe', 'torso', (g, m) => { // saquito de lana con flores bordadas sobre vestido
  fondo(g, m, 0x7a5a6a, false); for (let y = 0; y < TW; y += 3) { g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(0, y, TW, 1); }
  g.fillStyle = '#d8c8a8'; g.fillRect(52, 10, 24, 118); // vestido que asoma entre el saco abierto
  for (let i = 0; i < 18; i++) { const x = 53 + rnd() * 22, y = 14 + rnd() * 110; g.fillStyle = ['#c04060', '#4a7ab8', '#e0a020'][i % 3]; g.beginPath(); g.arc(x, y, 2, 0, 6.3); g.fill(); }
  for (const x of [48, 80]) for (let y = 26; y < 120; y += 18) { g.fillStyle = '#ece0c8'; g.beginPath(); g.arc(x, y, 2.2, 0, 6.3); g.fill(); }
  for (let i = 0; i < 6; i++) { const x = 14 + rnd() * 20 + (i % 2) * 70, y = 40 + rnd() * 70; g.fillStyle = '#e8c0c8'; for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(x + Math.cos(k * 1.26) * 3, y + Math.sin(k * 1.26) * 3, 2, 0, 6.3); g.fill(); } }
  cuello(g, m, 0xd8c8a8, false, 12, 12); mugre(g, 4, 0.2); sangre(g, m, 2);
});
// remeras lisas que se tiñen con el color de la remera del zombi (el alfa del atlas = zona teñida)
function remeraLisa(id, extra) { tile(id, 'lathe', 'torso', (g, m) => { fondo(g, m, '#ededed', true); tramaTela(g, 0.05); pliegues(g, 7, 0.12); if (extra) extra(g, m); grano(g, 800, 0.07); mugre(g, 6, 0.3); sangre(g, m, 2 + (rnd() * 3 | 0)); rasgones(g, m, 2); cuello(g, null, '#c8c8c8', false, 12, 12); }); }
remeraLisa('t_lisa');
remeraLisa('t_mvd', (g, m) => { texto(g, 'MONTEVIDEO', '#ffffff', 64, 52, 10, 0, m); for (const c of [g, m]) { c.strokeStyle = c === m ? '#000' : '#f2c20e'; c.lineWidth = 2; c.beginPath(); c.arc(64, 72, 8, 0, 6.3); c.stroke(); for (let k = 0; k < 16; k++) { const a = k / 16 * 6.283; c.beginPath(); c.moveTo(64 + Math.cos(a) * 10, 72 + Math.sin(a) * 10); c.lineTo(64 + Math.cos(a) * 14, 72 + Math.sin(a) * 14); c.stroke(); } } }); // sol (símbolo patrio, no marca)
remeraLisa('t_buzo', (g, m) => { g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(63, 14, 2, 114); g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(44, 84, 40, 24); g.save(); g.scale(1, 1.5); m.save(); m.scale(1, 1.5); texto(g, 'URUGUAY', 'rgba(255,255,255,0.92)', 64, 36, 8, 0, m); g.restore(); m.restore(); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 118, TW, 10); }); // buzo canguro
tile('t_cuadros', 'lathe', 'torso', (g, m) => { fondo(g, m, 0x2a4a7a, false); for (let x = 0; x < TW; x += 12) { g.fillStyle = 'rgba(230,230,210,0.35)'; g.fillRect(x, 0, 3, TW); } for (let y = 0; y < TW; y += 12) { g.fillStyle = 'rgba(230,230,210,0.35)'; g.fillRect(0, y, TW, 3); } for (let x = 6; x < TW; x += 24) { g.fillStyle = 'rgba(180,30,30,0.45)'; g.fillRect(x, 0, 2, TW); } g.fillStyle = 'rgba(255,255,255,0.6)'; for (let y = 22; y < 128; y += 16) { g.beginPath(); g.arc(61, y, 1.4, 0, 6.3); g.fill(); } pliegues(g, 6, 0.15); cuello(g, m, 0x1a3a6a, true, 10, 14); mugre(g, 5, 0.25); sangre(g, m, 3); rasgones(g, m, 1); });
tile('t_playa', 'lathe', 'torso', (g, m) => { fondo(g, m, 0xe86a2a, false); for (let i = 0; i < 26; i++) { const x = rnd() * TW, y = rnd() * TW; g.fillStyle = ['#fff2c0', '#2a9a8a', '#f8d020'][i % 3]; g.save(); g.translate(x, y); g.rotate(rnd() * 6); g.beginPath(); g.ellipse(0, 0, 7, 3, 0, 0, 6.3); g.fill(); g.restore(); } g.fillStyle = 'rgba(255,255,255,0.7)'; for (let y = 22; y < 128; y += 16) { g.beginPath(); g.arc(61, y, 1.4, 0, 6.3); g.fill(); } cuello(g, m, 0xc85a20, true, 12, 18); mugre(g, 4, 0.2); sangre(g, m, 3); });
tile('ch_poncho', 'lathe', 'chaleco', (g, m) => { // poncho de lana: guarda de franjas en los bordes y al medio
  fondo(g, m, 0x7a1a1a, false); for (let y = 0; y < TW; y += 2) { g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(0, y, TW, 1); }
  for (const x0 of [8, 56, 104]) { const F = ['#101010', '#e8e0c8', '#101010', '#2a3a7a', '#e8e0c8']; F.forEach((c, i) => { g.fillStyle = c; g.fillRect(x0 + i * 3, 0, 3, TW); }); }
  g.fillStyle = '#e8e0c8'; for (let x = 0; x < TW; x += 4) g.fillRect(x, 122, 2, 6); // flecos
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(255,255,255,${rnd() * 0.07})`; g.fillRect(rnd() * TW, rnd() * TW, 2, 1); } mugre(g, 6, 0.3); sangre(g, m, 2);
});
// ---- mangas (cápsula del brazo superior; y=128 es el puño) ----
function manga(id, base, puño, extra) { tile(id, 'lathe', 'manga', (g, m) => { fondo(g, m, base, false); if (extra) extra(g); tramaTela(g, 0.05); puños(g, puño, 14); grano(g, 300, 0.06); sangre(g, m, 1); }); }
manga('s_pena', NEGRO, AMARILLO); manga('s_nac', BLANCO, AZUL, g => { g.fillStyle = hex(ROJO); g.fillRect(0, 108, TW, 3); }); manga('s_cel', CELESTE, BLANCO); manga('s_danu', BLANCO, NEGRO);
manga('s_defe', VIOLETA, BLANCO); manga('s_wand', NEGRO, BLANCO); manga('s_cerro', CELESTE, BLANCO); manga('s_liver', 0x1f4aa8, NEGRO);
manga('s_surf', 0x1a1c20, 0x2a7ab8);
const cuadrille = (col, linea, paso = 16) => g => { for (let x = 0; x < TW; x += paso) { g.fillStyle = linea; g.fillRect(x, 0, paso * 0.45, TW); } for (let y = 0; y < TW; y += paso) { g.fillStyle = linea; g.fillRect(0, y, TW, paso * 0.45); } };
manga('s_feria', 0xb83228, 0x8a2018, cuadrille(0xb83228, 'rgba(20,20,20,0.35)')); manga('s_cuadros', 0x2a4a7a, 0x1a3a6a, cuadrille(0, 'rgba(230,230,210,0.3)', 12));
manga('s_chofer', 0x9ec4e0, 0x8ab0d0); manga('s_abuela', 0x7a5a6a, 0x6a4a5a, g => { for (let y = 0; y < TW; y += 3) { g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(0, y, TW, 1); } });
manga('s_pesca', 0x5a6a3a, 0x3e4a28); manga('s_playa', 0xe86a2a, 0xc85a20, g => { for (let i = 0; i < 12; i++) { g.fillStyle = ['#fff2c0', '#2a9a8a', '#f8d020'][i % 3]; g.beginPath(); g.ellipse(rnd() * TW, rnd() * TW, 7, 3, rnd() * 3, 0, 6.3); g.fill(); } });
manga('s_candombe', 0xe8b818, 0xf4f0e0, g => rayasV(g, ['#e8b818', '#1a8a3a', '#e8b818', '#c41c1c'], 8));
manga('s_murga', 0x2a1050, 0xf6c40c, g => { const C = ['#e8243c', '#f6c40c', '#1ab0d8', '#20b850', '#f070c8']; for (let j = -1; j < 9; j++) for (let i = -1; i < 9; i++) { g.fillStyle = C[(i + j * 3 + 10) % 5]; const cx = i * 16 + (j % 2) * 8, cy = j * 16; g.beginPath(); g.moveTo(cx, cy - 9); g.lineTo(cx + 8, cy); g.lineTo(cx, cy + 9); g.lineTo(cx - 8, cy); g.fill(); } for (let i = 0; i < 600; i++) { g.fillStyle = `rgba(255,255,255,${rnd() * 0.5})`; g.fillRect(rnd() * TW, rnd() * TW, 1, 1); } });
tile('s_lisa', 'lathe', 'manga', (g, m) => { fondo(g, m, '#ececec', true); tramaTela(g, 0.05); g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, 114, TW, 14); pliegues(g, 4, 0.12); sangre(g, m, 1); });
// ---- caderas (tela pareja) ----
function telaCadera(id, col, teñido = false) { tile(id, 'plano', 'cadera', (g, m) => { fondo(g, m, teñido ? '#e8e8e8' : col, teñido); tramaTela(g, 0.06); grano(g, 500, 0.07); mugre(g, 5, 0.25); if (!teñido) sangre(g, m, 1, 0.8); }); }
telaCadera('c_jean', 0x34507a); telaCadera('c_tint', 0, true); telaCadera('c_negro', 0x18181a); telaCadera('c_azul', 0x1a2a6a); telaCadera('c_blanco', 0xe8e8e4);
telaCadera('c_violeta', 0x5b2a8c); telaCadera('c_beige', 0xb8a47a); telaCadera('c_falda', 0x3a2a3a); telaCadera('c_navy', 0x1c2440); telaCadera('c_khaki', 0x8a7a50);
// ---- piernas (cápsula: y=0 cadera, y=128 tobillo; x=32 y x=96 son los costados) ----
tile('p_jean', 'lathe', 'pierna', (g, m) => { fondo(g, m, 0x34507a, false); for (let i = 0; i < 1600; i++) { g.fillStyle = `rgba(255,255,255,${rnd() * 0.08})`; g.fillRect(rnd() * TW, rnd() * TW, 1, 2); } const gr = g.createRadialGradient(64, 66, 2, 64, 66, 26); gr.addColorStop(0, 'rgba(200,215,235,0.35)'); gr.addColorStop(1, 'rgba(200,215,235,0)'); g.fillStyle = gr; g.fillRect(30, 36, 70, 60); costura(g, 32, 0, 32, 128, 'rgba(210,150,60,0.6)'); costura(g, 96, 0, 96, 128, 'rgba(210,150,60,0.6)'); piel(g, m, 62, 70, 52, 74); g.fillStyle = 'rgba(220,220,230,0.8)'; for (let x = 52; x < 74; x += 3) g.fillRect(x, 61 + rnd() * 2, 2, 1.5); mugre(g, 6, 0.3); sangre(g, m, 2); });
tile('p_jog', 'lathe', 'pierna', (g, m) => { fondo(g, m, '#e6e6e6', true); tramaTela(g, 0.04); pliegues(g, 6, 0.12); g.fillStyle = '#f4f4f4'; m.fillStyle = '#000'; for (const x of [28, 92]) { g.fillRect(x, 0, 3, TW); g.fillRect(x + 5, 0, 3, TW); m.fillRect(x, 0, 3, TW); m.fillRect(x + 5, 0, 3, TW); } g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 116, TW, 12); mugre(g, 6, 0.3); sangre(g, m, 2); });
function short(id, sh, me, banda) { // short de fútbol + rodillas + medias con banda
  tile(id, 'lathe', 'pierna', (g, m) => {
    fondo(g, m, sh, false); tramaTela(g, 0.05); g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(30, 0, 4, 52); g.fillRect(94, 0, 4, 52);
    piel(g, m, 52, 92); g.fillStyle = 'rgba(0,0,0,0.12)'; g.beginPath(); g.ellipse(64, 70, 10, 6, 0, 0, 6.3); g.fill(); // rodilla
    g.fillStyle = hex(me); g.fillRect(0, 92, TW, 36); m.fillStyle = '#000'; m.fillRect(0, 92, TW, 36); if (banda !== undefined) { g.fillStyle = hex(banda); g.fillRect(0, 94, TW, 5); } g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(0, 92, TW, 2);
    sangre(g, m, 2); mugre(g, 4, 0.25);
  });
}
short('p_pena', NEGRO, NEGRO, AMARILLO); short('p_nac', AZUL, AZUL, ROJO); short('p_cel', NEGRO, NEGRO, CELESTE); short('p_danu', NEGRO, BLANCO, NEGRO);
short('p_defe', BLANCO, VIOLETA, BLANCO); short('p_wand', NEGRO, NEGRO, BLANCO); short('p_cerro', BLANCO, CELESTE, BLANCO); short('p_liver', NEGRO, 0x1f4aa8, NEGRO);
tile('p_runner', 'lathe', 'pierna', (g, m) => { piel(g, m, 0, TW); g.fillStyle = '#1a1a1a'; g.fillRect(0, 0, TW, 30); m.fillStyle = '#000'; m.fillRect(0, 0, TW, 30); g.fillStyle = '#b8f018'; g.fillRect(0, 26, TW, 2); m.fillRect(0, 26, TW, 2); g.fillStyle = '#f4f4f4'; g.fillRect(0, 116, TW, 12); m.fillRect(0, 116, TW, 12); sangre(g, m, 3); });
tile('p_surf', 'lathe', 'pierna', (g, m) => { fondo(g, m, 0x1a1c20, false); g.fillStyle = '#2a2c30'; g.beginPath(); g.ellipse(64, 70, 14, 10, 0, 0, 6.3); g.fill(); g.fillStyle = '#2a7ab8'; g.fillRect(30, 0, 5, TW); g.fillRect(93, 0, 5, TW); rasgones(g, m, 2); sangre(g, m, 2); });
tile('p_bomb', 'lathe', 'pierna', (g, m) => { fondo(g, m, 0xb8a47a, false); pliegues(g, 12, 0.18); tramaTela(g, 0.05); g.fillStyle = '#2a1a10'; g.fillRect(0, 96, TW, 32); g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(0, 98, TW, 2); mugre(g, 8, 0.35); sangre(g, m, 1); }); // bombacha de campo y bota
tile('p_falda', 'lathe', 'pierna', (g, m) => { fondo(g, m, 0x3a2a3a, false); for (let i = 0; i < 30; i++) { g.fillStyle = ['#a04060', '#c8a040', '#6a8ab8'][i % 3]; g.beginPath(); g.arc(rnd() * TW, rnd() * 60, 1.8, 0, 6.3); g.fill(); } piel(g, m, 60, TW); g.fillStyle = 'rgba(160,120,90,0.35)'; g.fillRect(0, 60, TW, 68); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 58, TW, 3); sangre(g, m, 2); }); // pollera y medias de nylon
tile('p_chofer', 'lathe', 'pierna', (g, m) => { fondo(g, m, 0x1c2440, false); tramaTela(g, 0.05); g.fillStyle = 'rgba(255,255,255,0.1)'; g.fillRect(63, 0, 2, TW); pliegues(g, 5, 0.15); mugre(g, 4, 0.2); sangre(g, m, 1); });
tile('p_cargo', 'lathe', 'pierna', (g, m) => { fondo(g, m, 0x8a7a50, false); g.fillStyle = '#76683e'; g.fillRect(24, 22, 16, 18); g.fillRect(88, 22, 16, 18); piel(g, m, 50, 86); g.fillStyle = '#e0c020'; g.fillRect(0, 86, TW, 42); m.fillStyle = '#000'; m.fillRect(0, 86, TW, 42); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 86, TW, 3); mugre(g, 6, 0.3); sangre(g, m, 2); }); // bermuda y botas de goma amarillas
// ---- caras (esfera de la cabeza, frente en x=64; ojos en x≈56/72, y≈58; boca y≈78) ----
function cara(id, extra, base = true) {
  tile(id, 'esfera', 'cabeza', (g, m) => {
    piel(g, m, 0, TW);
    if (base) {
      for (const x of [56, 72]) { const gr = g.createRadialGradient(x, 58, 1, x, 58, 9); gr.addColorStop(0, 'rgba(30,10,20,0.75)'); gr.addColorStop(1, 'rgba(30,10,20,0)'); g.fillStyle = gr; g.fillRect(x - 10, 48, 20, 20); } // ojeras hundidas
      g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(52, 50, 24, 2.5); // ceño
      g.fillStyle = 'rgba(0,0,0,0.22)'; g.beginPath(); g.moveTo(64, 58); g.lineTo(61, 70); g.lineTo(67, 70); g.fill(); // nariz
      g.fillStyle = 'rgba(70,20,20,0.5)'; g.fillRect(56, 77, 16, 3);
      for (let i = 0; i < 5; i++) { const x = rnd() * TW, y = 20 + rnd() * 90, r = 5 + rnd() * 9, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(60,70,30,0.35)'); gr.addColorStop(1, 'rgba(60,70,30,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); } // manchas de podredumbre
      g.fillStyle = 'rgba(0,0,0,0.25)'; for (const x of [30, 98]) { g.beginPath(); g.ellipse(x, 62, 4, 7, 0, 0, 6.3); g.fill(); } // orejas
    }
    if (extra) extra(g, m);
  });
}
function herida(g, m, x, y, w, h, rot = 0, dientes = false) { for (const c of [g, m]) { c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = c === m ? '#000' : 'rgba(80,6,6,0.95)'; c.beginPath(); c.ellipse(0, 0, w, h, 0, 0, 6.3); c.fill(); c.restore(); } g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = 'rgba(30,0,0,0.9)'; g.beginPath(); g.ellipse(0, 0, w * 0.6, h * 0.5, 0, 0, 6.3); g.fill(); if (dientes) { g.fillStyle = '#e8e0c0'; for (let k = -2; k <= 2; k++) g.fillRect(k * w * 0.22 - 1, -h * 0.35, 2, h * 0.4); } g.restore(); }
cara('h_rot', (g, m) => { herida(g, m, 42, 46, 5, 3, 0.4); sangre(g, m, 1, 0.6); });
cara('h_mordida', (g, m) => { herida(g, m, 78, 74, 9, 5, -0.3, true); g.fillStyle = 'rgba(100,8,8,0.9)'; m.fillStyle = '#000'; for (const c of [g, m]) c.fillRect(76, 76, 3, 20); });
cara('h_cosido', (g, m) => { g.strokeStyle = 'rgba(40,10,10,0.9)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(40, 36); g.quadraticCurveTo(64, 28, 90, 40); g.stroke(); for (let k = 0; k < 9; k++) { const x = 42 + k * 5.5; g.beginPath(); g.moveTo(x, 30 + Math.abs(k - 4) * 0.8); g.lineTo(x + 1, 38 + Math.abs(k - 4) * 0.8); g.stroke(); } const gr = g.createRadialGradient(72, 60, 1, 72, 60, 11); gr.addColorStop(0, 'rgba(60,20,90,0.55)'); gr.addColorStop(1, 'rgba(60,20,90,0)'); g.fillStyle = gr; g.fillRect(60, 48, 24, 24); });
cara('h_craneo', (g, m) => { g.fillStyle = '#d8d0b4'; m.fillStyle = '#000'; for (const c of [g, m]) { c.beginPath(); c.ellipse(80, 18, 20, 13, 0.3, 0, 6.3); c.fill(); } g.strokeStyle = 'rgba(90,10,10,0.95)'; g.lineWidth = 3; g.beginPath(); g.ellipse(80, 18, 20, 13, 0.3, 0, 6.3); g.stroke(); g.strokeStyle = 'rgba(60,40,30,0.6)'; g.lineWidth = 1; g.beginPath(); g.moveTo(70, 14); g.lineTo(86, 22); g.stroke(); sangre(g, m, 1, 0.7); });
cara('h_venas', (g, m) => { g.strokeStyle = 'rgba(40,10,60,0.55)'; g.lineWidth = 1; for (let i = 0; i < 14; i++) { let x = 56 + (i % 2) * 16, y = 58; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (rnd() - 0.5) * 9; y += (rnd() - 0.3) * 7; g.lineTo(x, y); } g.stroke(); } g.fillStyle = 'rgba(110,6,6,0.9)'; m.fillStyle = '#000'; for (const c of [g, m]) { c.fillRect(54, 62, 2, 18); c.fillRect(72, 62, 2, 14); } });
cara('h_murga', (g, m) => { // maquillaje de murga: cara blanca, rombos de colores en los ojos, boca roja
  g.fillStyle = '#f4f2ee'; m.fillStyle = '#000'; for (const c of [g, m]) { c.beginPath(); c.ellipse(64, 64, 34, 42, 0, 0, 6.3); c.fill(); }
  const C = ['#e8243c', '#1ab0d8']; [56, 72].forEach((x, i) => { g.fillStyle = C[i]; g.beginPath(); g.moveTo(x, 44); g.lineTo(x + 7, 58); g.lineTo(x, 72); g.lineTo(x - 7, 58); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(x, 58, 3.5, 0, 6.3); g.fill(); });
  g.fillStyle = '#d01828'; g.beginPath(); g.ellipse(64, 79, 9, 3.5, 0, 0, 6.3); g.fill(); g.fillStyle = '#111'; g.fillRect(63, 64, 2, 8); g.fillStyle = '#f6c40c'; for (const x of [44, 84]) { g.beginPath(); g.arc(x, 72, 3, 0, 6.3); g.fill(); }
  for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(60,40,30,${rnd() * 0.15})`; g.fillRect(34 + rnd() * 60, 24 + rnd() * 80, 1, 1); } // maquillaje corrido y sucio
  g.fillStyle = 'rgba(30,10,10,0.6)'; g.fillRect(55, 60, 2, 20); g.fillRect(71, 60, 2, 16); // lágrimas negras
}, false);
cara('h_viejo', (g, m) => { g.strokeStyle = 'rgba(0,0,0,0.22)'; g.lineWidth = 1; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(48, 38 + k * 3); g.quadraticCurveTo(64, 35 + k * 3, 80, 38 + k * 3); g.stroke(); } for (const s of [-1, 1]) { g.beginPath(); g.moveTo(64 + s * 6, 70); g.quadraticCurveTo(64 + s * 12, 78, 64 + s * 9, 86); g.stroke(); } for (let i = 0; i < 10; i++) { g.fillStyle = 'rgba(90,60,30,0.3)'; g.beginPath(); g.arc(30 + rnd() * 70, 20 + rnd() * 30, 1.5 + rnd() * 2, 0, 6.3); g.fill(); } });
// ---- brazos (piel teñida con heridas) y mandíbula ----
tile('a_venas', 'lathe', 'brazo', (g, m) => { piel(g, m, 0, TW); for (let i = 0; i < 8; i++) { g.strokeStyle = 'rgba(40,20,70,0.35)'; let x = rnd() * TW, y = rnd() * 40; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 8; k++) { x += (rnd() - 0.5) * 8; y += 6 + rnd() * 6; g.lineTo(x, y); } g.stroke(); } herida(g, m, 70, 80, 4, 8, 0.2); });
tile('a_mordida', 'lathe', 'brazo', (g, m) => { piel(g, m, 0, TW); herida(g, m, 64, 70, 10, 7, 0, true); sangre(g, m, 2, 0.7); });
tile('a_tatu', 'lathe', 'brazo', (g, m) => { piel(g, m, 0, TW); g.strokeStyle = 'rgba(30,50,90,0.8)'; g.fillStyle = 'rgba(30,50,90,0.8)'; g.lineWidth = 1.5; g.beginPath(); g.arc(64, 40, 7, 0, 6.3); g.stroke(); for (let k = 0; k < 12; k++) { const a = k / 12 * 6.283; g.beginPath(); g.moveTo(64 + Math.cos(a) * 9, 40 + Math.sin(a) * 9); g.lineTo(64 + Math.cos(a) * 13, 40 + Math.sin(a) * 13); g.stroke(); } g.fillStyle = 'rgba(160,30,40,0.85)'; g.beginPath(); g.moveTo(64, 78); g.bezierCurveTo(50, 66, 54, 56, 64, 64); g.bezierCurveTo(74, 56, 78, 66, 64, 78); g.fill(); texto(g, 'MAMÁ', 'rgba(30,50,90,0.9)', 64, 86, 8); });
tile('j_dientes', 'plano', 'mandibula', (g, m) => { piel(g, m, 0, TW); g.fillStyle = '#5a0a0a'; m.fillStyle = '#000'; for (const c of [g, m]) c.fillRect(8, 0, 112, 34); g.fillStyle = '#e4dcb8'; for (let x = 12; x < 116; x += 13) g.fillRect(x, 2 + rnd() * 4, 10, 22 + rnd() * 8); g.fillStyle = 'rgba(120,8,8,0.9)'; m.fillStyle = '#000'; for (let k = 0; k < 3; k++) { const x = 20 + rnd() * 80, h = 20 + rnd() * 40; g.fillRect(x, 30, 4, h); m.fillRect(x, 30, 4, h); } });

// ---- mapeo de largo de arco de cada cápsula (v → fracción de arco desde arriba) ----
function perfilArco(geo) {
  const p = geo.attributes.position, uv = geo.attributes.uv; if (!uv) return null;
  const col = [];
  for (let i = 0; i < p.count; i++) if (uv.getX(i) < 1e-4) col.push([uv.getY(i), Math.hypot(p.getX(i), p.getZ(i)), p.getY(i)]);
  col.sort((a, b) => b[0] - a[0]); // de arriba (v=1) hacia abajo
  const s = [0]; for (let i = 1; i < col.length; i++) s.push(s[i - 1] + Math.hypot(col[i][1] - col[i - 1][1], col[i][2] - col[i - 1][2]));
  const L = s[s.length - 1] || 1;
  return v => { // fracción de arco (0 arriba .. 1 abajo) para un v
    for (let i = 1; i < col.length; i++) if (v >= col[i][0]) { const a = col[i - 1], b = col[i], k = (a[0] - v) / ((a[0] - b[0]) || 1); return (s[i - 1] + (s[i] - s[i - 1]) * k) / L; }
    return 1;
  };
}

// La CapsuleGeometry de three reparte la v por puntos del perfil, no por largo: el tramo recto (el pecho, donde van los textos)
// se quedaba con 1/13 de las filas del tile. Se reescribe la v de cada cápsula para que sea proporcional al largo de arco
// (v = 1 arriba .. 0 abajo); así el tile se pinta derecho y el pecho recibe ~4 veces más filas. Una vez por geometría.
const GEOS_LATHE = ['torso', 'chaleco', 'manga', 'pierna', 'brazo'];
function vPorArco(geo) {
  if (!geo || geo.userData.vArco) return; const f = perfilArco(geo); if (!f) return;
  const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - f(uv.getY(i)));
  uv.needsUpdate = true; geo.userData.vArco = true;
}
let ATLAS = null;
// pinta todos los tiles y arma la DataTexture. geos: { torso, manga, pierna, brazo, chaleco, cabeza, cadera, mandibula } (BufferGeometry)
export function crearAtlas(geos) {
  if (ATLAS) return ATLAS;
  const t0 = performance.now();
  const W = TW * COLS, H = TW * FILAS, datos = new Uint8Array(W * H * 4); const d32 = new Uint32Array(datos.buffer); // little endian: ABGR
  const CW = TW * 4, CH = TW * 2 * SV; // lienzo del tile más grande (sobremuestreado en vertical)
  const c = document.createElement('canvas'); c.width = CW; c.height = CH; const g = c.getContext('2d', { willReadFrequently: true });
  const cm = document.createElement('canvas'); cm.width = CW; cm.height = CH; const m = cm.getContext('2d', { willReadFrequently: true });
  PINTORES.forEach((P, idx) => {
    semillaRnd = 1000 + idx * 7919;
    const AW = TW * P.ancho, AH = TW * P.alto, SH = P.alto > 1 ? AH : AH * SV; // los grandes ya tienen resolución de sobra: sin sobremuestreo // tamaño real del tile y alto del dibujo sobremuestreado (se pinta en 128x128 lógicos)
    g.setTransform(1, 0, 0, 1, 0, 0); m.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, CW, CH); m.clearRect(0, 0, CW, CH);
    g.setTransform(P.ancho, 0, 0, SH / TW, 0, 0); m.setTransform(P.ancho, 0, 0, SH / TW, 0, 0);
    P.pintar(g, m);
    const src = g.getImageData(0, 0, AW, SH).data, msk = m.getImageData(0, 0, AW, SH).data; const s32 = new Uint32Array(src.buffer);
    const arco = null; // las cápsulas ya tienen la v por largo de arco (vPorArco): el dibujo va derecho
    const corr = (P.tipo === 'lathe' ? 64 : P.tipo === 'esfera' ? 32 : 0) * P.ancho; // dónde cae el frente (x=64 del dibujo) en u
    const cx = (P.celda % COLS) * TW, cy = Math.floor(P.celda / COLS) * TW; // fila 0 de la textura = v 0 (abajo); DataTexture no se da vuelta
    for (let ry = 0; ry < AH; ry++) {
      const v = (ry + 0.5) / AH;                       // v de esta fila del tile
      // fila del dibujo (0 arriba), con parte fraccional: se mezclan las dos filas vecinas (antes era la más cercana y los textos se cortaban)
      const fy = Math.min(SH - 1, Math.max(0, (arco ? arco(v) : 1 - v) * SH - 0.5)), y0 = Math.floor(fy), y1 = Math.min(SH - 1, y0 + 1), k1 = fy - y0, k0 = 1 - k1;
      const f0 = y0 * AW, f1 = y1 * AW, dfila = ((cy + ry) * W + cx) * 4;
      if (k1 < 1e-4) { // fila exacta: copia de a 32 bits (color del dibujo + alfa de la máscara)
        const d0 = dfila >> 2;
        for (let rx = 0; rx < AW; rx++) { const si = f0 + (rx + corr) % AW; d32[d0 + rx] = (s32[si] & 0x00ffffff) | (msk[si * 4] << 24); }
        continue;
      }
      for (let rx = 0; rx < AW; rx++) {
        const sx = (rx + corr) % AW, a = (f0 + sx) * 4, b = (f1 + sx) * 4, di = dfila + rx * 4;
        datos[di] = src[a] * k0 + src[b] * k1; datos[di + 1] = src[a + 1] * k0 + src[b + 1] * k1; datos[di + 2] = src[a + 2] * k0 + src[b + 2] * k1; datos[di + 3] = msk[a] * k0 + msk[b] * k1;
      }
    }
  });
  const t = new THREE.DataTexture(datos, W, H, THREE.RGBAFormat);
  t.colorSpace = THREE.SRGBColorSpace; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.anisotropy = 8; t.needsUpdate = true;
  ATLAS = { tex: t, datos, W, H, tiles: { ...TILE }, ms: performance.now() - t0, n: PINTORES.length, celdas: celdaLibre };
  if (celdaLibre > COLS * FILAS) console.error('zombis-arte: el atlas se quedó sin lugar', celdaLibre);
  return ATLAS;
}

// ---------------------------------------------------------------- instalación en la Horda ------------------------------------------------
const CON_TILE = ['torso', 'manga', 'cadera', 'pierna', 'cabeza', 'brazo', 'mandibula', 'chaleco'];
export function instalarArte(horda) {
  const M = horda.meshes; if (!M.torso || horda.arteOk) return;
  const geos = {}; for (const k of CON_TILE) if (M[k]) geos[k] = M[k].geometry;
  for (const k of GEOS_LATHE) vPorArco(geos[k]);
  const atlas = crearAtlas(geos);
  for (const [k, v] of Object.entries(ARTE_K)) horda.K[k] = new THREE.Color(v);
  const lit = M.torso.material;
  lit.map = atlas.tex;
  const previo = lit.onBeforeCompile;
  lit.onBeforeCompile = (sh, r) => {
    if (previo) previo(sh, r);
    sh.vertexShader = sh.vertexShader.replace('void main() {', 'attribute vec2 aTile;\nvarying float vAtOn;\nvarying float vSemilla;\nvarying float vAO;\nvarying vec3 vInst;\nvoid main() {')
      .replace('#include <uv_vertex>', `#include <uv_vertex>
        { float tt = aTile.x - 1.0; vec2 cel = vec2(mod(tt, ${COLS}.0), floor(tt / ${COLS}.0));
          float an = floor(aTile.y) + 1.0; // 1 = tile simple, 2 = doble ancho, 4 = grande (4x2 celdas)
          float al = an > 3.5 ? 2.0 : 1.0;
          vMapUv = (cel + clamp(uv, vec2(0.006, 0.012), vec2(0.994, 0.988)) * vec2(an, al)) / vec2(${COLS}.0, ${FILAS}.0); vAtOn = step(0.5, aTile.x); vSemilla = fract(aTile.y); }`)
      .replace('#include <color_vertex>', `#include <color_vertex>
        vAO = color.r; vInst = vec3(1.0);
        #ifdef USE_INSTANCING_COLOR
          vInst = instanceColor;
        #endif`);
    sh.fragmentShader = sh.fragmentShader.replace('void main() {', 'varying float vAtOn;\nvarying float vSemilla;\nvarying float vAO;\nvarying vec3 vInst;\nvoid main() {')
      .replace('#include <map_fragment>', '')
      .replace('#include <color_fragment>', `
        vec4 atl = mix(vec4(1.0), texture2D(map, vMapUv), vAtOn);
        float flashRojo = step(1.05, vInst.r) * step(vInst.g, 0.45);          // golpe: todo se tiñe de rojo
        vec3 tinte = mix(vec3(vAO), vColor, max(atl.a, flashRojo));            // alfa = zona teñida (piel, remera lisa)
        vec2 qn = vMapUv * vec2(${COLS * 5}.0, ${FILAS * 5}.0) + vSemilla * 37.0; // mugre distinta en cada zombi (ruido de valor barato)
        vec2 i0 = floor(qn), fq = fract(qn); fq = fq * fq * (3.0 - 2.0 * fq);
        float h00 = fract(sin(dot(i0, vec2(127.1, 311.7))) * 43758.5453), h10 = fract(sin(dot(i0 + vec2(1.0, 0.0), vec2(127.1, 311.7))) * 43758.5453);
        float h01 = fract(sin(dot(i0 + vec2(0.0, 1.0), vec2(127.1, 311.7))) * 43758.5453), h11 = fract(sin(dot(i0 + vec2(1.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
        float mug = smoothstep(0.55, 0.95, mix(mix(h00, h10, fq.x), mix(h01, h11, fq.x), fq.y)) * 0.42 * vAtOn;
        diffuseColor.rgb *= atl.rgb * tinte * (vec3(1.0) - mug * vec3(0.5, 0.58, 0.68));`);
  };
  const clave = lit.customProgramCacheKey ? lit.customProgramCacheKey() : 'zombi';
  lit.customProgramCacheKey = () => clave + '-arte';
  lit.needsUpdate = true;
  horda.arteTiles = {};
  for (const k of CON_TILE) {
    const im = M[k]; if (!im) continue;
    const n = im.instanceMatrix.count, arr = new Float32Array(n * 2), at = new THREE.InstancedBufferAttribute(arr, 2).setUsage(THREE.DynamicDrawUsage);
    im.geometry.setAttribute('aTile', at); horda.arteTiles[k] = at;
    const orig = im.setColorAt.bind(im);
    im.setColorAt = (i, col) => { orig(i, col); const a = horda._za && horda._za.arte; arr[i * 2] = a ? a[k] || 0 : 0; arr[i * 2 + 1] = a ? (a[k + 'W'] || 0) + a.semilla : 0; at.needsUpdate = true; };
  }
  horda.arteOk = true;
}

// ---------------------------------------------------------------- atuendos -------------------------------------------------------------
// Cada atuendo: tiles por pieza, colores (rem = color de los jirones/rasgón; acc1/acc2 accesorios; zap = zapatos) y extras(F, r, z)
ubicarTiles();
const T_ = id => TILE[id] + 1;
const ANCHO_DE = {}; // celda+1 -> ancho-1
for (const id in TILE) ANCHO_DE[TILE[id] + 1] = ANCHO[id] - 1;
const zapCh = [0x1a1714, 0xe8e8e4, 0x2a2a30, 0x5a3a20];
export const ATUENDOS = {
  penarol: { torso: 't_pena', manga: 's_pena', cadera: 'c_negro', pierna: ['p_pena', 'p_jean', 'p_jog'], rem: AMARILLO, acc1: NEGRO, acc2: AMARILLO, ex: (F, r) => { F.bufanda = r() < 0.25; F.gorroL = !F.bufanda && r() < 0.18; } },
  nacional: { torso: 't_nac', manga: 's_nac', cadera: 'c_azul', pierna: ['p_nac', 'p_jean', 'p_jog'], rem: BLANCO, acc1: AZUL, acc2: ROJO, ex: (F, r) => { F.bufanda = r() < 0.25; F.gorroL = !F.bufanda && r() < 0.18; } },
  celeste: { torso: 't_cel', manga: 's_cel', cadera: 'c_negro', pierna: ['p_cel', 'p_jean'], rem: CELESTE, acc1: CELESTE, acc2: BLANCO, ex: (F, r) => { F.bufanda = r() < 0.2; F.gorroL = !F.bufanda && r() < 0.15; } },
  danubio: { torso: 't_danu', manga: 's_danu', cadera: 'c_negro', pierna: ['p_danu', 'p_jean'], rem: BLANCO, acc1: NEGRO, acc2: BLANCO, ex: (F, r) => { F.bufanda = r() < 0.15; } },
  defensor: { torso: 't_defe', manga: 's_defe', cadera: 'c_blanco', pierna: ['p_defe', 'p_jean'], rem: VIOLETA, acc1: VIOLETA, acc2: BLANCO, ex: (F, r) => { F.bufanda = r() < 0.15; } },
  wanderers: { torso: 't_wand', manga: 's_wand', cadera: 'c_negro', pierna: ['p_wand', 'p_jean'], rem: BLANCO, acc1: NEGRO, acc2: BLANCO, ex: (F, r) => { F.bufanda = r() < 0.15; } },
  cerro: { torso: 't_cerro', manga: 's_cerro', cadera: 'c_blanco', pierna: ['p_cerro', 'p_jean'], rem: CELESTE, acc1: CELESTE, acc2: BLANCO, ex: (F, r) => { F.bufanda = r() < 0.15; } },
  liverpool: { torso: 't_liver', manga: 's_liver', cadera: 'c_negro', pierna: ['p_liver', 'p_jean'], rem: 0x1f4aa8, acc1: NEGRO, acc2: 0x1f4aa8, ex: (F, r) => { F.bufanda = r() < 0.15; } },
  murguero: { torso: 't_murga', manga: 's_murga', cadera: 'c_falda', pierna: ['p_chofer'], cabeza: 'h_murga', rem: 0x2a1050, acc1: [0x1a1a1a, 0xe8243c, 0x2a1050, 0xf6c40c], acc2: [0xf6c40c, 0xe8243c, 0x1ab0d8], zap: 0x111111, ex: F => { F.galera = true; } },
  candombe: { torso: 't_candombe', manga: 's_candombe', cadera: 'c_blanco', pierna: ['p_chofer', 'p_jean'], rem: 0xe8b818, acc1: 0xe8b818, acc2: [0x9aa0a8, 0xc8a030], zap: [0xe8e8e4, 0x1a1714], ex: (F, r) => { F.tamborC = true; F.vincha = r() < 0.3; } },
  pescador: { torso: 't_pesca', manga: 's_pesca', cadera: 'c_khaki', pierna: ['p_cargo'], rem: 0x5a6a3a, acc1: 0x5a6a3a, acc2: [0x6a6a50, 0x3a4a6a, 0xd8d0b0], zap: 0xe0c020, ex: (F, r) => { F.canaP = true; F.gorroP = r() < 0.75; F.barba = r() < 0.5; } },
  runner: { torso: 't_runner', manga: 's_lisa', cadera: 'c_negro', pierna: ['p_runner'], rem: 0xb8f018, acc1: [0xe8243c, 0x1ab0d8, 0xb8f018, 0xf070c8], acc2: 0x222222, zap: [0xf0f0f0, 0x1ab0d8, 0xe8243c], ex: (F, r) => { F.vincha = r() < 0.7; } },
  surfer: { torso: 't_surf', manga: 's_surf', cadera: 'c_negro', pierna: ['p_surf'], rem: 0x1a1c20, acc1: 0x2a7ab8, acc2: 0x1a1c20, zap: 0x1a1c20, pelo: [0xd8b860, 0xc89a40, 0x3a2a18], ex: (F, r) => { F.melena = r() < 0.5; } },
  feriante: { torso: 't_feria', manga: 's_feria', cadera: 'c_jean', pierna: ['p_jean', 'p_jog'], rem: 0xb83228, acc1: [0x2a5a2a, 0xd8d8d0], acc2: 0xece4d0, ex: (F, r) => { F.delantal = true; F.gorra = r() < 0.35; F.barba = r() < 0.4; } },
  chofer: { torso: 't_chofer', manga: 's_chofer', cadera: 'c_navy', pierna: ['p_chofer'], rem: 0x9ec4e0, acc1: 0x1c2a4a, acc2: 0x1c2a4a, zap: 0x0e0e10, ex: (F, r) => { F.corbata = r() < 0.7; F.gorra = r() < 0.5; F.lentes = r() < 0.15; } },
  gaucho: { torso: 't_cuadros', manga: 's_cuadros', cadera: 'c_beige', pierna: ['p_bomb'], chaleco: 'ch_poncho', rem: 0x7a1a1a, acc1: [0xc01818, 0x1a3a9a, 0xe8e0c8], acc2: 0x7a1a1a, zap: 0x2a1a10, ex: (F, r) => { F.poncho = true; F.boina = true; F.bufanda = r() < 0.7; F.barba = r() < 0.6; } },
  abuela: { torso: 't_abuela', manga: 's_abuela', cadera: 'c_falda', pierna: ['p_falda'], cabeza: 'h_viejo', rem: 0x7a5a6a, acc1: 0x8a6a7a, acc2: [0x2f7a40, 0xc8c8c8, 0x8a1c1c, 0x1a3a9a], zap: [0x3a2a20, 0x1a1714], pelo: [0xc8c8c0, 0xe0e0d8, 0x9a9a90], ex: (F, r) => { F.rodete = r() < 0.8; F.termoA = true; F.mate = r() < 0.75; F.lentes = r() < 0.2; } },
  lisa: { torso: 't_lisa', manga: 's_lisa', cadera: 'c_tint', pierna: ['p_jean', 'p_jog', 'p_jog'], lisa: true, ex: (F, r) => { F.gorra = r() < 0.18; F.mochila = r() < 0.15; F.termo = r() < 0.14; F.bufanda = !F.gorra && r() < 0.15; } },
  montevideo: { torso: 't_mvd', manga: 's_lisa', cadera: 'c_jean', pierna: ['p_jean', 'p_jog'], lisa: true, ex: (F, r) => { F.gorra = r() < 0.2; F.termo = r() < 0.2; } },
  buzo: { torso: 't_buzo', manga: 's_lisa', cadera: 'c_tint', pierna: ['p_jog', 'p_jean'], lisa: true, largo: true, ex: (F, r) => { F.mochila = r() < 0.2; } },
  cuadros: { torso: 't_cuadros', manga: 's_cuadros', cadera: 'c_jean', pierna: ['p_jean'], rem: 0x2a4a7a, acc1: 0x2a2a2a, acc2: 0x5a3a20, ex: (F, r) => { F.termo = r() < 0.25; F.barba = r() < 0.3; } },
  playa: { torso: 't_playa', manga: 's_playa', cadera: 'c_khaki', pierna: ['p_runner', 'p_cargo'], rem: 0xe86a2a, acc1: 0xf8d020, acc2: 0x2a9a8a, zap: [0xe8e8e4, 0x2a9a8a], ex: (F, r) => { F.lentes = r() < 0.4; } }
};
// pesos por tipo de zombi (la mayoría con la de Peñarol o la de Nacional)
const BASE = { penarol: 24, nacional: 22, celeste: 7, danubio: 3, defensor: 3, wanderers: 3, cerro: 2.5, liverpool: 2.5, murguero: 2.5, candombe: 2.5, pescador: 2.5, runner: 2, surfer: 1.5, feriante: 2.5, chofer: 2, gaucho: 1.5, abuela: 2.5, lisa: 6, montevideo: 2, buzo: 3, cuadros: 2, playa: 1.5 };
export const PESOS_ATUENDO = {
  normal: BASE,
  corredor: { ...BASE, runner: 12, surfer: 4, abuela: 0, gaucho: 0.5, candombe: 1, pescador: 1, chofer: 1 },
  gateador: { ...BASE, runner: 0.5, gaucho: 0.5, candombe: 0.5 },
  escupidor: { ...BASE, abuela: 1, runner: 1 },
  griton: { murguero: 30, abuela: 10, lisa: 8, buzo: 6, penarol: 12, nacional: 12, celeste: 4 },
  explosivo: { lisa: 5, montevideo: 2, buzo: 3 },          // torso teñido: el pulso naranja de la garrafa se tiene que ver
  tanque: { penarol: 26, nacional: 24, feriante: 10, chofer: 10, celeste: 6, lisa: 8, cuadros: 6, candombe: 4, gaucho: 4 }
};
// tipos de cuerpo: escala del esqueleto (alto) + grosor de torso, brazos y piernas. El esqueleto (hombros/caderas) no cambia de forma.
export const CUERPOS = {
  comun: { h: 1, w: 1, torso: [1, 1, 1], miembro: 1 },
  flaco: { h: 1.02, w: 0.94, torso: [0.86, 1, 0.84], miembro: 0.82 },
  gordo: { h: 0.98, w: 1.06, torso: [1.17, 1.02, 1.36], /* v8: menos ancho de costado: los brazos ya no se hunden en la panza */ miembro: 1.22, cadera: [1.22, 1, 1.22] },
  alto: { h: 1.1, w: 0.98, torso: [0.96, 1.02, 0.95], miembro: 0.95 },
  petiso: { h: 0.88, w: 1.03, torso: [1.06, 0.96, 1.05], miembro: 1.05 },
  viejo: { h: 0.94, w: 0.96, torso: [0.92, 0.98, 0.95], miembro: 0.86 },
  pibe: { h: 0.86, w: 0.88, torso: [0.88, 0.95, 0.86], miembro: 0.85, cab: 1.06 }
};
const PESOS_CUERPO = { comun: 30, flaco: 16, gordo: 14, alto: 12, petiso: 10, viejo: 8, pibe: 10 };
const CUERPO_ATUENDO = { abuela: { viejo: 70, petiso: 20, gordo: 10 }, runner: { flaco: 40, pibe: 25, alto: 25, comun: 10 }, surfer: { flaco: 35, alto: 30, pibe: 20, comun: 15 }, feriante: { gordo: 50, comun: 30, petiso: 20 }, chofer: { gordo: 45, comun: 35, viejo: 20 }, gaucho: { comun: 40, viejo: 30, flaco: 30 }, murguero: { flaco: 30, comun: 30, alto: 20, gordo: 20 } };
const PIEL_ROT = [0x7f9a68, 0x8ea37a, 0x9aa486, 0x6f8a70, 0xa9ab90, 0x8a9a5a, 0xb0a890, 0x7a8e90, 0x9a8a9a, 0xb8b49a, 0x6a7a58, 0xa0a878, 0x8a7a6a, 0x5f7468];
const PELO = [0x1a1410, 0x2a1a10, 0x3a2a18, 0x1a1a1a, 0x5a3a20, 0x8a8a80];
const REMERA_LISA = [0x8a2e2e, 0x2e4a80, 0x6a6a4a, 0x9a7a50, 0x3a6a4a, 0x7a3a7a, 0xa8a8a8, 0x7ab8e8, 0xd8b040, 0xd0d0c8, 0x4a4a4a, 0xc85a28, 0x1a1a1e, 0x2a5a8a];
const PANT_LISO = [0x26304a, 0x4a3a24, 0x2e2e2e, 0x34507a, 0x5a5040, 0x1a1a1e, 0x4a4a50];
// banderas cosméticas que el atuendo decide (las de heridas y las de cada tipo — garrafa, bultos, rocas, traje — no se tocan)
const COSM = ['pena', 'nac', 'gorra', 'bufanda', 'mochila', 'termo', 'lentes', 'corbata', 'chaleco', 'barba', ...ARTE_FLAGS];
const CARAS = ['h_rot', 'h_rot', 'h_mordida', 'h_cosido', 'h_craneo', 'h_venas'];
const BRAZOS = ['a_venas', 'a_venas', 'a_mordida', 'a_tatu'];

function sortear(pesos, r) { let tot = 0; for (const k in pesos) tot += pesos[k]; let x = r() * tot; for (const k in pesos) { x -= pesos[k]; if (x <= 0) return k; } return Object.keys(pesos)[0]; }
const uno = (v, r) => Array.isArray(v) ? v[Math.floor(r() * v.length)] : v;
// elige atuendo + cuerpo para un tipo (pesos: la mayoría Peñarol / Nacional). r: generador [0,1) opcional
export function elegirAtuendo(tipo, r = Math.random) {
  const atuendo = sortear(PESOS_ATUENDO[tipo] || PESOS_ATUENDO.normal, r);
  let cuerpo = sortear(CUERPO_ATUENDO[atuendo] || PESOS_CUERPO, r);
  if (tipo === 'tanque') cuerpo = r() < 0.75 ? 'gordo' : 'alto';
  if (tipo === 'corredor' && cuerpo === 'gordo') cuerpo = 'flaco';
  return { atuendo, cuerpo };
}

// Viste un zombi recién preparado (llamar al final de prepararZombi). op: { atuendo, cuerpo, r } para forzar (preview, jefes, eventos)
export function vestirZombi(z, tipo, op = {}) {
  const a = z.arte || (z.arte = { semilla: 0 });
  for (const k of CON_TILE) a[k] = 0;
  const r = op.r || Math.random; a.semilla = r() * 0.999;
  // reset del cuerpo (el pool reutiliza zombis). Si se llama dos veces seguidas (forzar un atuendo), se deshace el cuerpo anterior
  for (let j = 0; j < 2; j++) { z.brazos[j].scale.set(1, 1, 1); z.piernas[j].scale.set(1, 1, 1); }
  z.cadera.scale.set(1, 1, 1);
  z.jirones[0].position.z = 0.13; z.jirones[1].position.z = 0.14; z.jirones[2].position.z = -0.14; // valores de crearZombi
  if (a.C && a.gy === z.g.scale.y) { const P = a.C; z.g.scale.set(z.g.scale.x / P.w, z.g.scale.y / P.h, z.g.scale.z / P.w); z.esc /= P.h; if (a.tx) z.torso.scale.set(z.torso.scale.x / P.torso[0], z.torso.scale.y / P.torso[1], z.torso.scale.z / P.torso[2]); if (P.cab) z.cab.scale.multiplyScalar(1 / P.cab); }
  a.C = null;
  if (z.T && z.T.jefe && !op.atuendo) return a; // los jefes los arma el que los diseña
  const { atuendo, cuerpo } = op.atuendo ? { atuendo: op.atuendo, cuerpo: op.cuerpo || 'comun' } : elegirAtuendo(tipo, r);
  const A = ATUENDOS[atuendo] || ATUENDOS.lisa, C = CUERPOS[cuerpo] || CUERPOS.comun, F = z.f;
  a.atuendo = atuendo; a.cuerpo = cuerpo;
  // ---- ropa ----
  for (const k of COSM) F[k] = false;
  const pie = uno(A.pierna, r); // la cadera acompaña al pantalón largo (jean o jogging); con short/pollera va la del atuendo
  a.torso = T_(A.torso); a.manga = T_(A.manga); a.pierna = T_(pie); a.cadera = T_(pie === 'p_jean' ? 'c_jean' : pie === 'p_jog' ? 'c_tint' : A.cadera);
  a.brazo = T_(uno(BRAZOS, r)); a.mandibula = T_('j_dientes');
  a.cabeza = T_(A.cabeza || (cuerpo === 'viejo' && r() < 0.6 ? 'h_viejo' : uno(CARAS, r)));
  if (A.chaleco) a.chaleco = T_(A.chaleco);
  for (const k of CON_TILE) a[k + 'W'] = ANCHO_DE[a[k]] || 0;
  if (A.lisa) { if (tipo !== 'explosivo' && tipo !== 'griton') z.cRemera.setHex(uno(REMERA_LISA, r)).offsetHSL(0, -0.1 * r(), -0.08 * r()); }
  else z.cRemera.setHex(A.rem);
  z.cRasgon.copy(z.cRemera).multiplyScalar(0.45);
  z.cAcc1.setHex(uno(A.acc1 !== undefined ? A.acc1 : [0xb02020, 0x1a3a9a, 0x161616, 0x8a8a8a, 0xd8b020, 0x5ab4e8], r));
  z.cAcc2.setHex(uno(A.acc2 !== undefined ? A.acc2 : [0x2a3a5a, 0x4a2a2a, 0x2a4a2a, 0x5a5a5a, 0x7a3a8a], r));
  z.cZapato.setHex(uno(A.zap !== undefined ? A.zap : zapCh, r));
  // piel podrida: muchos tonos (los tipos con color propio — escupidor, gritón, explosivo — lo conservan)
  if (tipo !== 'escupidor' && tipo !== 'griton' && tipo !== 'explosivo') z.cPiel.setHex(uno(PIEL_ROT, r)).offsetHSL((r() - 0.5) * 0.03, (r() - 0.5) * 0.1, (r() - 0.5) * 0.1);
  // pantalón: el teñido usa un color liso; los demás tiles traen su color y la zona de piel (shorts, polleras) se tiñe con la piel
  if (a.cadera === T_('c_tint')) z.cPant.setHex(uno(PANT_LISO, r)); else z.cPant.copy(z.cPiel);
  // pelo
  z.cPelo.setHex(uno(A.pelo || (cuerpo === 'viejo' ? [0xc8c8c0, 0x9a9a90, 0x6a6a64] : PELO), r));
  const sombrero = () => F.galera || F.gorroP || F.boina || F.gorra || F.gorroL;
  if (A.ex) A.ex(F, r, z);
  if (tipo === 'griton') { F.gorra = F.gorroL = F.gorroP = F.boina = false; } // la cabeza larga del gritón
  if (tipo === 'explosivo') { F.bufanda = false; F.mochila = false; }
  if (tipo === 'escupidor') { F.gorra = F.gorroL = F.lentes = false; }
  if (!sombrero()) { const p = r(); if (cuerpo !== 'viejo' && atuendo !== 'abuela') { F.melena = F.melena || p < 0.08; F.cresta = p > 0.08 && p < 0.12; F.afro = p > 0.12 && p < 0.17; } }
  F.huesoB = r() < 0.08; F.barba = F.barba || (atuendo !== 'abuela' && r() < 0.15);
  if (tipo === 'tanque') { F.chaleco = atuendo === 'lisa' && r() < 0.6; if (F.chaleco) z.cAcc2.setHex(0xe86a10); }
  z.pelo.scale.setScalar(sombrero() || F.afro || F.cresta || (cuerpo === 'viejo' && r() < 0.4) || (r() < 0.12) ? 0.001 : 1);
  if (F.rodete || F.melena) z.pelo.scale.setScalar(1);
  // mangas: largas en buzo, abuela, pescador, gaucho, surfer y a veces chofer o remera lisa
  const largo = A.largo || atuendo === 'abuela' || atuendo === 'pescador' || atuendo === 'gaucho' || atuendo === 'surfer' || (atuendo === 'chofer' && r() < 0.4) || (A.lisa && r() < 0.35);
  // ---- cuerpo ----
  const g = z.g.scale, mi = C.miembro;
  g.set(g.x * C.w, g.y * C.h, g.z * C.w); z.esc *= C.h;
  if (tipo !== 'explosivo') z.torso.scale.set(z.torso.scale.x * C.torso[0], z.torso.scale.y * C.torso[1], z.torso.scale.z * C.torso[2]);
  if (C.cadera) z.cadera.scale.set(C.cadera[0], C.cadera[1], C.cadera[2]);
  if (C.cab) z.cab.scale.multiplyScalar(C.cab);
  a.C = C; a.gy = g.y; a.tx = tipo !== 'explosivo';
  // la mancha de sangre y el rasgón (decals de zombis.js) más chicos: que se vea la camiseta. Pegados al frente del torso según su grosor
  if (tipo !== 'explosivo') {
    const sz = z.torso.scale.z, m0 = z.manchas[0], m1 = z.manchas[1];
    m0.scale.setScalar(r() < 0.45 ? 0.001 : 0.045 + r() * 0.06); m1.scale.setScalar(r() < 0.6 ? 0.001 : 0.035 + r() * 0.04);
    m0.position.z = 0.148 * sz + 0.006; m1.position.z = 0.148 * sz + 0.007;
    // jirones (tiras de tela colgando, color liso): más finos y cortos, que no tapen la camiseta; con el color oscuro del rasgón
    z.jirones.forEach((j, k) => { j.scale.set(0.35 + r() * 0.35, r() < 0.35 ? 0.001 : 0.35 + r() * 0.6, 1); j.position.z = (k === 2 ? -1 : 1) * (0.148 * sz - 0.01); });
  }
  for (let j = 0; j < 2; j++) { z.brazos[j].scale.set(mi, 1, mi); z.piernas[j].scale.set(mi, 1, mi); z.mangas[j].scale.set(mi * 1.04 * Math.max(1, C.torso[0] * 0.92), largo ? 2.4 : 1, mi * 1.04 * Math.max(1, C.torso[2] * 0.85)); }
  return a;
}
// lista de atuendos y tiles (para la preview y para quien diseñe jefes o eventos)
export const ARTE_INFO = { atuendos: Object.keys(ATUENDOS), cuerpos: Object.keys(CUERPOS), tiles: TILE };
