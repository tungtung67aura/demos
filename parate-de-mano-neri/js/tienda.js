// Almacén de Don Tito + entrenamiento: entre nivel y nivel se gasta la plata ($U) y se reparten los puntos de atributo.
// Táctil primero (tarjetas grandes, botones + / −), también teclado y joystick. Todo se guarda al momento (progreso.js).
import { texto, lienzo, CONTORNO } from './pixel.js';
import { P, PRODUCTOS, ATRIBUTOS, ATR_MAX, precio, estado, comprar, subir, bajar, abrirSesion, subidos } from './progreso.js';
import { generar } from './sprites.js';
import { retratoCara } from './cinematica.js';
import { sonar } from './audio.js';

const FRASES_TITO = ['¿QUÉ VA A LLEVAR, MIJO? FIADO NO.', 'LA GRAPPAMIEL ES PARA EL FRÍO. Y PARA LAS PIÑAS.', 'EL CHIVITO ES DE AYER, PERO ESTÁ BÁRBARO.',
  'SI ROMPÉS LA BOTELLA, QUEDA EL PICO. NO ME LA DEVUELVAS.', 'LA ESTAMPITA LA BENDIJO UN CURA DE VERDAD. CREO.', 'CON ESOS BRAZOS NO LE GANÁS NI A DOÑA ROSA. ENTRENÁ.'];
const ICON = new Map();
// íconos de 20×20 en pixel art (paquete de yerba, termo, estampita, botella, etc.)
function icono(id) {
  let c = ICON.get(id); if (c) return c; const [cv, x] = lienzo(20, 20); const R = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
  switch (id) {
    case 'estampita': R(4, 1, 12, 18, CONTORNO); R(5, 2, 10, 16, '#f0e0b0'); R(6, 3, 8, 9, '#4a7ac8'); R(8, 4, 4, 4, '#f0c8a0'); R(7, 8, 6, 4, '#c8202a'); R(9, 3, 2, 1, '#ffe060'); R(6, 13, 8, 1, '#8a6a3a'); R(6, 15, 8, 1, '#8a6a3a'); break;
    case 'yerba': R(4, 1, 12, 18, CONTORNO); R(5, 2, 10, 16, '#f2f2ea'); R(5, 2, 10, 4, '#2a8a3a'); R(5, 12, 10, 6, '#2a8a3a'); R(7, 7, 6, 4, '#e8c020'); R(8, 8, 4, 2, '#c8202a'); R(5, 6, 10, 1, '#c8202a'); break;
    case 'grappamiel': R(7, 1, 6, 4, '#c8a040'); R(8, 0, 4, 1, '#3a2010'); R(5, 5, 10, 14, CONTORNO); R(6, 5, 8, 13, '#d89020'); R(6, 9, 8, 5, '#f2f2ea'); R(7, 10, 6, 1, '#8a3a10'); R(7, 12, 4, 1, '#8a3a10'); R(12, 6, 1, 3, '#ffd080'); break;
    case 'chivito': R(1, 9, 18, 7, CONTORNO); R(2, 10, 16, 2, '#e0a050'); R(2, 12, 16, 1, '#6ac04a'); R(2, 13, 16, 1, '#c8202a'); R(2, 14, 16, 1, '#8a4a2a'); R(3, 7, 14, 3, '#f0b860'); R(2, 15, 16, 2, '#d89040'); R(7, 8, 4, 1, '#fff0a0'); break;
    case 'botella': R(8, 0, 4, 2, '#d8b040'); R(8, 2, 4, 5, '#2f7a35'); R(6, 7, 8, 12, '#2f7a35'); R(6, 11, 8, 4, '#f0e6d0'); R(12, 8, 1, 9, '#5ab060'); break;
    case 'palo': for (let i = 0; i < 16; i++) R(2 + i, 17 - i, 2, 2, i % 5 ? '#9a6a3a' : '#7a4a2a'); break;
    case 'cano': for (let i = 0; i < 16; i++) { R(2 + i, 16 - i, 3, 3, '#7a7e88'); R(3 + i, 16 - i, 1, 1, '#c0c4cc'); } break;
    case 'faca': for (let i = 0; i < 6; i++) R(2 + i, 17 - i, 3, 2, '#6a3a1a'); R(8, 11, 3, 2, '#c8a040'); for (let i = 0; i < 8; i++) R(10 + i, 10 - i, 2, 2, i === 7 ? '#ffffff' : '#c8ccd8'); break;
    case 'tutorial': R(1, 3, 18, 14, CONTORNO); R(2, 4, 16, 12, '#e8e8f0'); R(3, 5, 14, 10, '#c8202a'); R(8, 7, 1, 6, '#ffffff'); R(9, 8, 1, 4, '#ffffff'); R(10, 9, 1, 2, '#ffffff'); break;
    case 'championes': R(2, 10, 16, 6, CONTORNO); R(3, 11, 14, 4, '#f2f2ea'); R(3, 15, 15, 2, '#c8202a'); R(4, 8, 7, 4, '#f2f2ea'); R(5, 9, 5, 1, '#2a5ac8'); R(12, 12, 4, 1, '#2a5ac8'); break;
    case 'campera': R(3, 3, 14, 16, CONTORNO); R(4, 4, 12, 14, '#3a2a20'); R(9, 4, 2, 14, '#c8a040'); R(5, 4, 3, 3, '#5a4030'); R(12, 4, 3, 3, '#5a4030'); R(1, 6, 3, 10, '#3a2a20'); R(16, 6, 3, 10, '#3a2a20'); break;
    case 'guantes': R(3, 5, 7, 11, CONTORNO); R(4, 6, 5, 9, '#e0c050'); R(10, 5, 7, 11, CONTORNO); R(11, 6, 5, 9, '#e0c050'); R(4, 13, 5, 2, '#8a6a20'); R(11, 13, 5, 2, '#8a6a20'); break;
    case 'termo': R(6, 0, 8, 3, '#2a2a30'); R(5, 3, 10, 16, CONTORNO); R(6, 3, 8, 15, '#3a8a4a'); R(12, 4, 1, 13, '#7ad08a'); R(7, 8, 6, 3, '#c0c4cc'); break;
    case 'rinonera': R(1, 7, 18, 9, CONTORNO); R(2, 8, 16, 7, '#c83a8a'); R(2, 10, 16, 1, '#ffd23a'); R(9, 11, 2, 2, '#c0c4cc'); R(0, 9, 2, 2, '#2a2a30'); R(18, 9, 2, 2, '#2a2a30'); break;
    case 'libreta': R(3, 1, 14, 18, CONTORNO); R(4, 2, 12, 16, '#e8d8a0'); R(4, 2, 2, 16, '#c8202a'); for (let k = 0; k < 5; k++) R(7, 5 + k * 3, 8, 1, '#8a8a92'); break;
    default: R(4, 4, 12, 12, '#8a8a92');
  }
  ICON.set(id, cv); return cv;
}
const ST = { tab: 0, sel: 0, pag: 0, frase: 0, msg: null, tMsg: 0, sig: '' };
const POR_PAG = 6;
export function abrirTienda(sig) { ST.tab = 0; ST.sel = 0; ST.pag = 0; ST.frase = Math.floor(Math.random() * FRASES_TITO.length); ST.msg = null; ST.sig = sig || ''; abrirSesion(); }
function zonas(W, H) {
  const x0 = 10, y0 = 62, cw = Math.floor((W - 20 - 8) / 2), ch = 30;
  const cartas = []; for (let i = 0; i < POR_PAG; i++) cartas.push([x0 + (i % 2) * (cw + 8), y0 + Math.floor(i / 2) * (ch + 4), cw, ch]);
  const filas = ATRIBUTOS.map((a, i) => { const y = 64 + i * 30; return { y, menos: [W - 92, y, 34, 24], mas: [W - 48, y, 34, 24] }; });
  return { cartas, filas, tabA: [10, 40, 120, 18], tabE: [136, 40, 140, 18], seguir: [W - 172, H - 28, 162, 22], pagIzq: [10, H - 28, 30, 22], pagDer: [46, H - 28, 30, 22], comprar: [W - 172, H - 56, 162, 22] };
}
const dentro = (t, r) => t[0] >= r[0] && t[0] <= r[0] + r[2] && t[1] >= r[1] && t[1] <= r[1] + r[3];
function aviso(s) { ST.msg = s; ST.tMsg = 1.6; }
function intentarComprar(pr) {
  const e = estado(pr);
  if (e === 'ok') { comprar(pr); sonar('tienda.compra'); aviso('¡LLEVASTE ' + pr.nombre + '!'); }
  else { sonar('tienda.nopuede'); aviso(e === 'tiene' ? 'YA LO TENÉS, MIJO' : 'NO TE ALCANZA. FIADO NO.'); }
}
// entrada: { nx, ny, ok, atras, tab, tap }. Devuelve { seguir: true } al salir.
export function pasoTienda(dt, W, H, inp) {
  if (ST.tMsg > 0) ST.tMsg -= dt;
  const Z = zonas(W, H); const nPag = Math.ceil(PRODUCTOS.length / POR_PAG);
  if (inp.tab) { ST.tab = 1 - ST.tab; ST.sel = 0; ST.pag = 0; sonar('ui.mover'); }
  if (inp.atras) { sonar('ui.ok'); return { seguir: true }; }
  const t = inp.tap;
  if (t) {
    if (dentro(t, Z.tabA)) { ST.tab = 0; sonar('ui.mover'); return null; }
    if (dentro(t, Z.tabE)) { ST.tab = 1; sonar('ui.mover'); return null; }
    if (dentro(t, Z.seguir)) { sonar('ui.ok'); return { seguir: true }; }
  }
  if (ST.tab === 0) {
    if (inp.nx) { ST.sel += inp.nx; } if (inp.ny) ST.sel += inp.ny * 2;
    if (inp.nx || inp.ny) { ST.sel = (ST.sel + PRODUCTOS.length) % PRODUCTOS.length; ST.pag = Math.floor(ST.sel / POR_PAG); sonar('ui.mover'); }
    if (t) {
      if (dentro(t, Z.pagIzq)) { ST.pag = (ST.pag + nPag - 1) % nPag; ST.sel = ST.pag * POR_PAG; sonar('ui.mover'); }
      else if (dentro(t, Z.pagDer)) { ST.pag = (ST.pag + 1) % nPag; ST.sel = ST.pag * POR_PAG; sonar('ui.mover'); }
      else if (dentro(t, Z.comprar)) intentarComprar(PRODUCTOS[ST.sel]);
      else Z.cartas.forEach((r, i) => { const k = ST.pag * POR_PAG + i; if (k < PRODUCTOS.length && dentro(t, r)) { if (ST.sel === k) intentarComprar(PRODUCTOS[k]); else { ST.sel = k; sonar('ui.mover'); } } });
    }
    if (inp.ok) intentarComprar(PRODUCTOS[ST.sel]);
  } else {
    if (inp.ny) { ST.sel = ((ST.sel % 5) + inp.ny + 5) % 5; sonar('ui.mover'); }
    const k = ATRIBUTOS[ST.sel % 5].k;
    if (inp.nx > 0 || inp.ok) { if (subir(k)) sonar('ui.punto'); else { sonar('tienda.nopuede'); aviso(P.puntos <= 0 ? 'NO TE QUEDAN PUNTOS' : 'YA ESTÁ AL MÁXIMO'); } }
    if (inp.nx < 0) { if (bajar(k)) sonar('ui.mover'); }
    if (t) Z.filas.forEach((f, i) => { const kk = ATRIBUTOS[i].k; if (dentro(t, f.mas)) { ST.sel = i; if (subir(kk)) sonar('ui.punto'); else { sonar('tienda.nopuede'); aviso(P.puntos <= 0 ? 'NO TE QUEDAN PUNTOS' : 'YA ESTÁ AL MÁXIMO'); } } else if (dentro(t, f.menos)) { ST.sel = i; if (bajar(kk)) sonar('ui.mover'); } else if (t[1] >= f.y && t[1] < f.y + 26) ST.sel = i; });
  }
  return null;
}
function boton(x, r, txt, col, activo = true) {
  x.fillStyle = CONTORNO; x.fillRect(r[0] - 1, r[1] - 1, r[2] + 2, r[3] + 2); x.fillStyle = activo ? col : '#3a3046'; x.fillRect(r[0], r[1], r[2], r[3]);
  x.fillStyle = 'rgba(255,255,255,0.18)'; x.fillRect(r[0], r[1], r[2], 2); texto(x, txt, r[0] + r[2] / 2, r[1] + (r[3] >> 1) - 4, activo ? '#ffffff' : '#8a7a9a', 1, 'centro');
}
export function dibujarTienda(x, W, H, tP, tactil) {
  // fondo: el mostrador del almacén (estanterías con yerba, latas y botellas)
  x.fillStyle = '#2a1a22'; x.fillRect(0, 0, W, H);
  for (let s = 0; s < 3; s++) { const y = 8 + s * 22; x.fillStyle = '#5a3a2a'; x.fillRect(0, y + 18, W, 3);
    for (let i = 0; i < W / 10; i++) { const c = ['#2a8a3a', '#c8202a', '#e8c020', '#f2f2ea', '#2a5ac8', '#d89020'][(i * 7 + s * 3) % 6]; x.fillStyle = c; x.fillRect(i * 10 + 2, y + 6 + ((i + s) % 3), 7, 12 - ((i + s) % 3)); } }
  x.fillStyle = 'rgba(20,10,22,0.82)'; x.fillRect(0, 0, W, H);
  const Z = zonas(W, H);
  // Don Tito + plata + puntos
  const tito = generar('mozo', 1); const r = retratoCara(tito, Math.floor(tP / 3) % 2 ? 'feliz' : 'normal');
  x.fillStyle = CONTORNO; x.fillRect(8, 4, 34, 34); x.fillStyle = '#5a3a2a'; x.fillRect(9, 5, 32, 32); x.drawImage(r, 10, 6, 30, 30);
  texto(x, 'ALMACÉN DE DON TITO', 48, 6, '#ffd23a', 1, 'izq', CONTORNO, '#8a5a10');
  texto(x, ST.tMsg > 0 && ST.msg ? ST.msg : FRASES_TITO[(ST.frase + Math.floor(tP / 6)) % FRASES_TITO.length], 48, 20, ST.tMsg > 0 ? '#7aff7a' : '#e8e0f0', 1, 'izq');
  texto(x, '$U ' + P.plata, W - 10, 6, '#7aff7a', 1, 'der', CONTORNO, '#1a5a1a'); texto(x, 'PUNTOS: ' + P.puntos, W - 10, 20, P.puntos > 0 ? '#ffd23a' : '#9a8aa8', 1, 'der');
  boton(x, Z.tabA, 'ALMACÉN', ST.tab === 0 ? '#c8202a' : '#4a3a5a'); boton(x, Z.tabE, 'ENTRENAR' + (P.puntos > 0 ? ' (' + P.puntos + ')' : ''), ST.tab === 1 ? '#7a3ac8' : P.puntos > 0 && Math.floor(tP * 2.5) % 2 ? '#a05ad0' : '#4a3a5a');
  if (ST.tab === 0) {
    for (let i = 0; i < POR_PAG; i++) {
      const k = ST.pag * POR_PAG + i; if (k >= PRODUCTOS.length) break; const pr = PRODUCTOS[k], rr = Z.cartas[i], e = estado(pr), sel = k === ST.sel;
      x.fillStyle = sel ? '#ffd23a' : CONTORNO; x.fillRect(rr[0] - 1, rr[1] - 1, rr[2] + 2, rr[3] + 2); x.fillStyle = e === 'tiene' ? '#1e3a26' : sel ? '#3a2a4a' : '#24182e'; x.fillRect(rr[0], rr[1], rr[2], rr[3]);
      x.drawImage(icono(pr.icono), rr[0] + 5, rr[1] + 5);
      const maxc = Math.floor((rr[2] - 34) / 8); const nom = pr.nombre.length > maxc ? pr.nombre.slice(0, maxc - 1) + '.' : pr.nombre;
      texto(x, nom, rr[0] + 30, rr[1] + 5, e === 'caro' ? '#9a8aa8' : '#ffffff', 1, 'izq');
      texto(x, e === 'tiene' ? (pr.tipo === 'perm' || pr.tipo === 'mov' ? 'COMPRADO' : 'EN LA MOCHILA') : '$U ' + precio(pr), rr[0] + 30, rr[1] + 17, e === 'tiene' ? '#7aff7a' : e === 'caro' ? '#c86a6a' : '#ffd23a', 1, 'izq');
      const tag = { uso: 'UN NIVEL', perm: 'SIEMPRE', arma: 'ARMA', mov: 'MOVIDA', punto: '+1 PUNTO' }[pr.tipo]; texto(x, tag, rr[0] + rr[2] - 4, rr[1] + 17, '#8a7a9a', 1, 'der');
    }
    const pr = PRODUCTOS[ST.sel]; const dy = H - 58; texto(x, pr.desc, 12, dy + 2, '#c8ffc8', 1, 'izq');
    const e = estado(pr); boton(x, Z.comprar, e === 'tiene' ? 'YA LO TENÉS' : 'COMPRAR $U ' + precio(pr), '#2a8a3a', e === 'ok');
    const nPag = Math.ceil(PRODUCTOS.length / POR_PAG); boton(x, Z.pagIzq, '<', '#4a3a5a'); boton(x, Z.pagDer, '>', '#4a3a5a'); texto(x, (ST.pag + 1) + '/' + nPag, 84, H - 21, '#9a8aa8', 1, 'izq');
  } else {
    ATRIBUTOS.forEach((a, i) => {
      const f = Z.filas[i], n = P.attr[a.k], sel = i === ST.sel % 5;
      if (sel) { x.fillStyle = 'rgba(255,210,58,0.12)'; x.fillRect(8, f.y - 2, W - 16, 28); x.fillStyle = '#ffd23a'; x.fillRect(8, f.y - 2, 2, 28); }
      texto(x, a.nombre, 16, f.y + 1, a.c, 1, 'izq', CONTORNO);
      for (let q = 0; q < ATR_MAX; q++) { x.fillStyle = CONTORNO; x.fillRect(118 + q * 11, f.y, 9, 9); x.fillStyle = q < n ? a.c : '#3a3046'; x.fillRect(119 + q * 11, f.y + 1, 7, 7); if (q < n && q >= n - subidos(a.k)) { x.fillStyle = '#ffffff'; x.fillRect(119 + q * 11, f.y + 1, 7, 1); } }
      texto(x, n > 0 ? a.desc(n) : 'SIN ENTRENAR', 16, f.y + 13, n > 0 ? '#e8e0f0' : '#7a6a8a', 1, 'izq');
      if (n < ATR_MAX && W > 420) texto(x, '> ' + a.desc(n + 1), 118 + ATR_MAX * 11 + 6, f.y + 1, '#7a9a7a', 1, 'izq');
      boton(x, f.menos, '-', '#5a3a6a', subidos(a.k) > 0); boton(x, f.mas, '+', a.c, P.puntos > 0 && n < ATR_MAX);
    });
  }
  boton(x, Z.seguir, ST.sig ? 'SEGUIR: ' + ST.sig : 'SEGUIR >', '#c8202a');
  if (!tactil) { if (ST.tab === 0) texto(x, 'FLECHAS · PIÑA COMPRA · PATADA: ENTRENAR · ESC: SEGUIR', W / 2, H - 70, '#6a5a7a', 1, 'centro'); else texto(x, 'DERECHA/PIÑA SUBE · IZQ. DESHACE', 12, H - 21, '#6a5a7a', 1, 'izq'); }
}
