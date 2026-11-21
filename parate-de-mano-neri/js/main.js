// Arranque, escalado entero pixel-perfect, bucle de paso fijo (120 Hz) con interpolación y pantallas.
import { cuadroG } from './grado.js';
import { GORE, textoGore } from './sangre.js';
import { crearProps } from './props.js';
import { generar, DEFS, dibujarCuadro, fijarQ, calentar, partida, vigente } from './sprites.js';
import { SLOTS, opciones } from './ropa.js';
import { Juego } from './juego.js';
import { dibujarHUD } from './hud.js';
import { E, initEntrada, leerEntrada, tickBuf, registrarTap } from './entrada.js';
import { iniciarAudio, sonar, musica, setMusica, suspender } from './audio.js';
import { texto, lienzo, CONTORNO } from './pixel.js';
import { JUGADORES, ATQ, COMIDA, ITEMS } from './datos.js';
import { NIVELES } from './niveles.js';
import { abrirMapa, pasoMapa, dibujarMapa, precargarMapa } from './mapa.js';
import { calle, cielo, ALTO, EXTRA } from './escenario.js';

export const VERSION = 'bb-v8';
// sonidos de menú por ID (audio-ids.js): sin archivo, no suena (o suena el respaldo sintetizado si el ID lo tiene)
const UI = { menu: 'ui.mover', dale: 'ui.ok', pausa: 'ui.pausa', item: 'ui.ropa', atras: 'ui.atras' };
function sfx(k) { sonar(UI[k] || k); }
let nivelMax = Math.min(NIVELES.length - 1, +(localStorage.getItem('bb-nivel-max') || 0)), nivelSel = 0;
let ganados = (() => { try { return JSON.parse(localStorage.getItem('bb-ganados') || '[]'); } catch (e) { return []; } })(); let spMapa = null;
const musJuego = () => (juego ? (juego.lock && juego.lock.jefe ? (juego.nv.num === 6 ? 'mus.jefe.final' : 'mus.jefe') : juego.nv.musica) : 'mus.menu');
const DT = 1 / 120;
const cv = document.getElementById('juego'); const x = cv.getContext('2d', { alpha: false });
let W = 480, H = 270, escala = 2, D = 2; // D: densidad del lienzo (subpíxeles por píxel del juego; los luchadores se dibujan con el doble de detalle)
const raiz = document.getElementById('raiz');
const cfg = Object.assign({ musica: true, sangre: 2 }, JSON.parse(localStorage.getItem('bb-cfg') || '{}'));
GORE.nivel = [0, 1, 2].includes(cfg.sangre) ? cfg.sangre : 2;
let record = +(localStorage.getItem('bb-record') || 0);

function ajustar() {
  const dpr = window.devicePixelRatio || 1; const cs = getComputedStyle(raiz); const anchoUtil = innerWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
  const dw = Math.round(anchoUtil * dpr), dh = Math.round(innerHeight * dpr);
  escala = Math.max(1, Math.floor(dh / ALTO));
  H = Math.min(300, Math.floor(dh / escala)); W = Math.min(700, Math.floor(dw / escala));
  if (W < 400) { escala = Math.max(1, Math.floor(dw / 400)); W = Math.min(700, Math.floor(dw / escala)); H = Math.min(300, Math.max(ALTO, Math.floor(dh / escala))); }
  // densidad del lienzo = densidad de los luchadores (Q): siempre divide a la escala, así cada subpíxel ocupa un número
  // ENTERO de píxeles de pantalla (antes con escala 3 los sprites 2× quedaban a 1,5 px y se veían deformes)
  D = escala % 2 === 0 ? 2 : escala % 3 === 0 ? 3 : 1; fijarQ(D);
  cv.width = W * D; cv.height = H * D; x.setTransform(D, 0, 0, D, 0, 0); x.imageSmoothingEnabled = false;
  cv.style.width = (W * escala / dpr) + 'px'; cv.style.height = (H * escala / dpr) + 'px'; correcciones = 0;
  document.body.classList.toggle('vertical', innerHeight > innerWidth * 1.1);
  if (juego) { juego.vista.w = W; juego.vista.h = H; }
}
// con DPR fraccionario (2,625; 2,75...) el navegador puede redondear el tamaño CSS y estirar el lienzo ±1 px:
// eso duplica o saltea filas de píxeles (personajes "deformes"). Se mide el tamaño real en píxeles de pantalla y se corrige.
let correcciones = 0;
if (typeof ResizeObserver !== 'undefined') { try { new ResizeObserver((es) => { const b = es[0].devicePixelContentBoxSize && es[0].devicePixelContentBoxSize[0]; if (!b || correcciones > 3) return;
  const qw = W * escala, qh = H * escala; if (b.inlineSize === qw && b.blockSize === qh) return;
  if (Math.abs(b.inlineSize - qw) > 3 || Math.abs(b.blockSize - qh) > 3) return; // sólo el redondeo de ±1-3 px (una medida rara no se toca)
  correcciones++;
  cv.style.width = (parseFloat(cv.style.width) * qw / b.inlineSize) + 'px'; cv.style.height = (parseFloat(cv.style.height) * qh / b.blockSize) + 'px'; }).observe(cv, { box: 'device-pixel-content-box' }); } catch (e) { /* navegador sin device-pixel-content-box */ } }
// botones táctiles: si un luchador queda debajo, se vuelven casi transparentes (para no tapar la pelea)
const elBot = document.getElementById('botones'); let rBot = null, rCv = null;
function revisarTapado() {
  if (!juego) return; if (!rBot) { rBot = elBot.getBoundingClientRect(); rCv = cv.getBoundingClientRect(); } const k = rCv.width / W; let tap = false;
  for (const e of juego.ents) { if (e.muerto) continue; const sx = rCv.left + (e.x - juego.cam) * k, sy = rCv.top + (e.y - (e.z || 0) + H - ALTO) * k;
    if (sx > rBot.left - 14 * k && sx < rBot.right + 14 * k && sy > rBot.top && sy - 100 * k < rBot.bottom) { tap = true; break; } }
  document.body.classList.toggle('tapado', tap);
}
addEventListener('resize', () => { rBot = null; });
addEventListener('resize', ajustar); addEventListener('orientationchange', () => setTimeout(ajustar, 200));

// ---------- estado global ----------
let pantalla = 'carga', juego = null, elegido = 0, tP = 0, pausaSel = 0, contador = 0, nuevaVersion = false, fondoMenu = null;
const CLAVES = ['seba', 'pelado', 'pato'];
const med = { fps: 0, frames: 0, t0: performance.now(), dtMax: 0, pasos: 0, hist: [] };

function marcarTactil() { document.body.classList.add('tactil'); }
if (matchMedia('(pointer:coarse)').matches) marcarTactil();
addEventListener('touchstart', marcarTactil, { passive: true, once: true });
function iniciar() {
  ajustar(); crearProps(); for (const k of CLAVES) generar(k, 0, ropaDe(k));
  fondoMenu = calle(NIVELES[0]).canvas;
  initEntrada(raiz); ajustar(); pantalla = 'titulo'; tP = 0;
  // pre-genera los enemigos del nivel de a uno, en ratos libres de los menús (así arrancar la partida no traba)
  const cola = []; { const vistos = new Set(); for (const o of NIVELES[Math.min(nivelMax, NIVELES.length - 1)].oleadas) for (const [k, v] of o.enemigos) { const id = k + v; if (!vistos.has(id)) { vistos.add(id); cola.push([k, v]); } } } // orden de aparición del último nivel abierto
  const siguiente = () => { if (!cola.length) return; if (pantalla === 'juego') { setTimeout(siguiente, 500); return; } const [k, v] = cola.shift(); setsNivel.push(generar(k, v)); setTimeout(siguiente, 60); };
  setTimeout(siguiente, 400);
  requestAnimationFrame(bucle);
}
cv.addEventListener('pointerdown', (ev) => {
  iniciarAudio(); musica(pantalla === 'juego' ? musJuego() : pantalla === 'titulo' ? 'mus.titulo' : 'mus.menu');
  const r = cv.getBoundingClientRect(); registrarTap((ev.clientX - r.left) / r.width * W, (ev.clientY - r.top) / r.height * H);
});
addEventListener('touchend', () => { iniciarAudio(); }, { passive: true });
addEventListener('keydown', () => { iniciarAudio(); musica(pantalla === 'juego' ? musJuego() : pantalla === 'titulo' ? 'mus.titulo' : 'mus.menu'); }, { once: false });
document.addEventListener('visibilitychange', () => { if (document.hidden) { if (pantalla === 'juego') { pantalla = 'pausa'; pausaSel = 0; } suspender(true); } else suspender(false); });

// navegación de menú (bordes de dirección)
let navPrev = { x: 0, y: 0 };
function nav() { const nx = Math.abs(E.dx) > 0.5 ? Math.sign(E.dx) : 0, ny = Math.abs(E.dy) > 0.5 ? Math.sign(E.dy) : 0; const r = { x: nx !== navPrev.x ? nx : 0, y: ny !== navPrev.y ? ny : 0 }; navPrev = { x: nx, y: ny }; return r; }
function ok() { if (E.buf.ok > 0 || E.buf.pina > 0) { E.buf.ok = 0; E.buf.pina = 0; E.buf.salto = 0; return true; } return false; }
function tap() { return E.taps.shift(); }

// ---------- ropa elegida (cosmética, se guarda por personaje) ----------
function ropaDe(k) { let r = null; try { r = JSON.parse(localStorage.getItem('bb-ropa-' + k) || 'null'); } catch (e) { r = null; } const base = Object.assign({}, DEFS[k].ropa);
  if (r) for (const [slot] of SLOTS) if (r[slot] && opciones(slot).includes(r[slot])) base[slot] = r[slot]; return base; }
function guardarRopa(k, r) { try { localStorage.setItem('bb-ropa-' + k, JSON.stringify(r)); } catch (e) { /* sin almacenamiento */ } }
let vest = { fila: 0, ropa: null };
function abrirVestuario() { vest = { fila: 0, ropa: ropaDe(CLAVES[elegido]) }; pantalla = 'vestuario'; tP = 0; }
function cambiarRopa(fila, d) { const [slot] = SLOTS[fila]; const ops = opciones(slot); const i = ops.indexOf(vest.ropa[slot]); vest.ropa[slot] = ops[(i + d + ops.length) % ops.length]; guardarRopa(CLAVES[elegido], vest.ropa); sfx('menu'); }
function ropaAlAzar() { for (const [slot] of SLOTS) { const ops = opciones(slot); vest.ropa[slot] = ops[Math.floor(Math.random() * ops.length)]; } guardarRopa(CLAVES[elegido], vest.ropa); sfx('item'); }
// zonas táctiles del vestuario (en píxeles de juego)
function zonasVest() {
  const px = Math.max(150, Math.round(W * 0.36)), x0 = px + 14, x1 = W - 12, fh = Math.min(44, Math.floor((H - 84) / 4));
  const filas = SLOTS.map((s, i) => { const y = 34 + i * fh; return { y, izq: [x0, y + 12, 26, 22], der: [x1 - 26, y + 12, 26, 22] }; });
  const by = H - 32; return { px, x0, x1, fh, filas, azar: [x0, by, 70, 24], volver: [x0 + 78, by, 70, 24], dale: [x1 - Math.min(150, x1 - x0 - 156), by, Math.min(150, x1 - x0 - 156), 24] };
}
const dentro = (t, r) => t[0] >= r[0] && t[0] <= r[0] + r[2] && t[1] >= r[1] && t[1] <= r[1] + r[3];

function empezar(nivel = 0, previo = null) {
  nivel = Math.max(0, Math.min(NIVELES.length - 1, nivel));
  juego = new Juego(CLAVES[elegido], { w: W, h: H }, ropaDe(CLAVES[elegido]), nivel, previo); pantalla = 'juego'; tP = 0; mostrarControles(true);
  window.__bb.juego = juego;
}
// después del vestuario: si ya hay niveles abiertos, se elige en el mapa de Montevideo
function aLaCancha() { if (nivelMax > 0) { pantalla = 'mapa'; tP = 0; nivelSel = Math.min(nivelSel || nivelMax, nivelMax); spMapa = generar(CLAVES[elegido], 0, ropaDe(CLAVES[elegido])); abrirMapa(nivelMax, nivelSel, ganados); } else empezar(0); }
function siguienteNivel() {
  const n = juego.nivelIdx + 1; const prev = { puntos: juego.puntos, vidas: juego.vidas, comboMax: juego.comboMax, proxVida: juego.proxVida };
  if (n >= NIVELES.length) { pantalla = 'final'; tP = 0; juego = null; mostrarControles(false); musica('mus.final'); sonar('evento.final'); return; }
  empezar(n, prev);
}
function mostrarControles(v) { document.body.classList.toggle('en-juego', v); }

// sprites que se terminan de dibujar en los menús (8 ms por cuadro): el personaje elegido y los enemigos del nivel, en orden de aparición
let saltarCal = 0; const setsNivel = [];
function prepararMenus() { if (pantalla === 'carga') return; for (let i = 0; i < setsNivel.length; i++) setsNivel[i] = vigente(setsNivel[i]); partida([generar(CLAVES[elegido], 0, ropaDe(CLAVES[elegido])), ...setsNivel]); }
// ---------- bucle ----------
let ultimo = performance.now(), acc = 0;
function bucle(ahora) {
  requestAnimationFrame(bucle);
  let dt = (ahora - ultimo) / 1000; ultimo = ahora; if (dt > 0.1) dt = 0.1; if (dt < 0) dt = 0;
  med.frames++; med.dtMax = Math.max(med.dtMax, dt); med.hist.push(dt * 1000); if (med.hist.length > 240) med.hist.shift();
  if (ahora - med.t0 > 1000) { med.fps = Math.round(med.frames * 1000 / (ahora - med.t0)); med.frames = 0; med.t0 = ahora; }
  const t0b = performance.now(); leerEntrada();
  if (window.__bb.bot && juego && pantalla === 'juego') botControl();
  if (window.__bb.bot && pantalla === 'continuar') { E.buf.ok = 0.1; }
  tP += dt;
  if (pantalla === 'juego') {
    E.taps.length = 0;
    const tb = window.__bb.turbo || 1; acc += dt * tb; let n = 0; const t0 = performance.now();
    while (acc >= DT && n < 8 * tb) { juego.paso(DT, E); tickBuf(DT); acc -= DT; n++; }
    if (n >= 8 * tb) acc = 0; med.pasos = n; med.tLogica = performance.now() - t0;
    if (E.buf.pausa > 0) { E.buf.pausa = 0; pantalla = 'pausa'; pausaSel = 0; sfx('pausa'); }
    if (juego.estado === 'pierde' && juego.tEstado > 1.2) { pantalla = 'continuar'; contador = 9.99; tP = 0; }
    if (juego.estado === 'gana' && juego.tEstado > 2.5) { pantalla = 'gana'; tP = 0; const p = juego.puntos; if (p > record) { record = p; localStorage.setItem('bb-record', p); sonar('evento.record'); }
      if (!ganados.includes(juego.nivelIdx)) { ganados.push(juego.nivelIdx); try { localStorage.setItem('bb-ganados', JSON.stringify(ganados)); } catch (e) { /* sin almacenamiento */ } }
      const abre = Math.min(NIVELES.length - 1, juego.nivelIdx + 1); if (abre > nivelMax) { nivelMax = abre; localStorage.setItem('bb-nivel-max', nivelMax); } nivelSel = abre; }
  } else { tickBuf(dt); acc = 0; menus(dt); }
  const PF = globalThis.__pf, pf0 = PF ? PF.gen + PF.grad + PF.sil + PF.set : 0, pfA = PF ? [PF.gen, PF.grad, PF.sil, PF.set, PF.nGen, PF.nGrad] : null;
  const t1 = performance.now();
  dibujar(acc / DT);
  med.tRender = performance.now() - t1; med.tGenR = PF ? PF.gen + PF.grad + PF.sil + PF.set - pf0 : 0; if (pfA && med.tGenR > 0.3) med.pfDet = [PF.gen - pfA[0], PF.grad - pfA[1], PF.sil - pfA[2], PF.set - pfA[3], PF.nGen - pfA[4], PF.nGrad - pfA[5]].map((v) => Math.round(v * 10) / 10); else med.pfDet = null;
  // cuadros de sprites pendientes, en el tiempo que sobra del cuadro (en juego poco; en menús más)
  { const t2 = performance.now(); if (pantalla !== 'juego') { prepararMenus(); if (nivelMax > 0 && (pantalla === 'vestuario' || pantalla === 'mapa' || pantalla === 'seleccion') && performance.now() - t0b < 6) precargarMapa(W, H); else calentar(8); } else if (saltarCal > 0) saltarCal--; else if (t2 - t0b < 6) { calentar(Math.max(0, 5 - (t2 - t0b)), juego && juego.grado ? juego.postG || (juego.postG = (f) => cuadroG(f, juego.grado)) : null); const t3 = performance.now(); if (juego && t3 - t0b < 5) juego.gradarOcioso(5 - (t3 - t0b)); saltarCal = Math.ceil((performance.now() - t2) / 3); } med.tCalentar = performance.now() - t2; }
}

function menus(dt) {
  const n = nav(); const t = tap();
  if (pantalla === 'titulo') {
    if (ok() || t) { pantalla = 'seleccion'; tP = 0; sfx('menu'); musica('mus.menu'); }
  } else if (pantalla === 'seleccion') {
    if (n.x) { elegido = (elegido + n.x + 3) % 3; sfx('menu'); }
    if (t) { const cw = Math.min(150, (W - 40) / 3); const x0 = (W - cw * 3 - 20) / 2; for (let i = 0; i < 3; i++) { const cx = x0 + i * (cw + 10); if (t[0] > cx && t[0] < cx + cw && t[1] > 40 && t[1] < H - 40) { if (elegido === i) { sfx('dale'); abrirVestuario(); return; } elegido = i; sfx('menu'); } } if (t[1] > H - 34) { sfx('dale'); abrirVestuario(); return; } }
    if (ok()) { sfx('dale'); abrirVestuario(); }
    if (E.buf.atras > 0 || E.buf.pausa > 0) { E.buf.atras = 0; E.buf.pausa = 0; pantalla = 'titulo'; }
  } else if (pantalla === 'vestuario') {
    const Z = zonasVest(); const nf = SLOTS.length + 1;
    if (n.y) { vest.fila = (vest.fila + n.y + nf) % nf; sfx('menu'); }
    if (n.x && vest.fila < SLOTS.length) cambiarRopa(vest.fila, n.x);
    if (t) {
      Z.filas.forEach((f, i) => { if (dentro(t, f.izq)) { vest.fila = i; cambiarRopa(i, -1); } else if (dentro(t, f.der)) { vest.fila = i; cambiarRopa(i, 1); } else if (t[0] > Z.x0 && t[1] >= f.y && t[1] < f.y + Z.fh) vest.fila = i; });
      if (dentro(t, Z.azar)) ropaAlAzar(); else if (dentro(t, Z.volver)) { pantalla = 'seleccion'; tP = 0; sfx('menu'); return; } else if (dentro(t, Z.dale)) { sfx('dale'); aLaCancha(); return; }
    }
    if (E.buf.especial > 0) { E.buf.especial = 0; ropaAlAzar(); }
    if (ok()) { if (vest.fila < SLOTS.length) { vest.fila = SLOTS.length; sfx('menu'); } else { sfx('dale'); aLaCancha(); return; } }
    if (E.buf.atras > 0 || E.buf.pausa > 0) { E.buf.atras = 0; E.buf.pausa = 0; pantalla = 'seleccion'; tP = 0; }
  } else if (pantalla === 'pausa') {
    if (n.y) { pausaSel = (pausaSel + n.y + 4) % 4; sfx('menu'); }
    let elegir = ok() ? pausaSel : -1;
    if (t) { for (let i = 0; i < 4; i++) { const y = Math.round(H / 2 - 58) + 40 + i * 18; if (t[1] > y - 5 && t[1] < y + 13 && Math.abs(t[0] - W / 2) < 92) elegir = i; } }
    if (E.buf.pausa > 0) { E.buf.pausa = 0; elegir = 0; }
    if (elegir === 0) { pantalla = 'juego'; } else if (elegir === 1) { cfg.musica = !cfg.musica; setMusica(cfg.musica); localStorage.setItem('bb-cfg', JSON.stringify(cfg)); } else if (elegir === 2) { cfg.sangre = GORE.nivel = (GORE.nivel + 2) % 3; localStorage.setItem('bb-cfg', JSON.stringify(cfg)); if (!GORE.nivel && juego) juego.sangre.limpiar(); else if (juego) juego.sangre.calentar(juego.grado); sfx('menu'); } else if (elegir === 3) { pantalla = 'titulo'; juego = null; mostrarControles(false); musica('mus.menu'); if (nuevaVersion) location.reload(); }
  } else if (pantalla === 'continuar') {
    contador -= dt; juego.paso(0, E);
    if (ok() || t) { juego.vidas = 2; juego.puntos = 0; juego.proxVida = 100000; juego.estado = 'jugando'; sonar('evento.continuar'); const j = juego.j; j.hp = j.hpMax; j.muerto = false; j.est = 'levanta'; j.t = 0; j.invul = 3; pantalla = 'juego'; }
    else if (contador <= 0) { pantalla = 'titulo'; juego = null; mostrarControles(false); if (nuevaVersion) location.reload(); }
  } else if (pantalla === 'gana') {
    if ((ok() || t) && tP > 1.5) { sfx('dale'); if (nuevaVersion) { location.reload(); return; } siguienteNivel(); }
    if (E.buf.atras > 0 && tP > 1.5) { E.buf.atras = 0; pantalla = 'titulo'; juego = null; mostrarControles(false); musica('mus.menu'); }
  } else if (pantalla === 'mapa') {
    const atras = E.buf.atras > 0 || E.buf.pausa > 0; E.buf.atras = 0; E.buf.pausa = 0;
    const r = pasoMapa(dt, W, H, { nx: n.x, ny: n.y, ok: ok(), atras, tap: t || null });
    if (r && r.empezar !== undefined) { nivelSel = r.empezar; empezar(r.empezar); return; }
    if (r && r.volver) { pantalla = 'vestuario'; tP = 0; }
  } else if (pantalla === 'final') {
    if ((ok() || t) && tP > 2) { pantalla = 'titulo'; musica('mus.menu'); if (nuevaVersion) location.reload(); }
  }
}

// ---------- dibujo ----------
function dibujar(alfa) {
  if (pantalla === 'juego' || pantalla === 'pausa' || pantalla === 'continuar' || (pantalla === 'gana' && juego)) {
    juego.dibujar(x, pantalla === 'juego' ? alfa : 1, W, H);
    dibujarHUD(x, juego, W, H, E.tactil || matchMedia('(pointer:coarse)').matches, pantalla !== 'juego');
    if (E.tactil && (med.frames & 7) === 0) revisarTapado();
    if (pantalla === 'pausa') {
      velo(0.55); const py = Math.round(H / 2 - 58); panel(W / 2 - 92, py, 184, 132);
      texto(x, 'PAUSA', W / 2, py + 9, '#ffd23a', 2, 'centro', CONTORNO, '#8a5a10');
      ['SEGUIR', 'MÚSICA: ' + (cfg.musica ? 'SÍ' : 'NO'), 'SANGRE: ' + textoGore(), 'SALIR AL MENÚ'].forEach((s, i) => { const yy = py + 40 + i * 18; const sel = pausaSel === i;
        if (sel) { x.fillStyle = 'rgba(255,210,58,0.16)'; x.fillRect(Math.round(W / 2 - 80), yy - 4, 160, 15); x.fillStyle = '#ffd23a'; x.fillRect(Math.round(W / 2 - 80), yy - 4, 2, 15); }
        texto(x, s, W / 2, yy, sel ? '#ffffff' : '#9a8aa8', 1, 'centro'); if (sel && Math.floor(tP * 3) % 2 === 0) texto(x, '>', W / 2 - 72, yy, '#ffd23a', 1); });
      texto(x, esTactil() ? 'TOCÁ UNA OPCIÓN' : 'ARRIBA/ABAJO · PIÑA', W / 2, py + 116, '#7a6a8a', 1, 'centro');
    }
    if (pantalla === 'continuar') { velo(0.62); const py = Math.round(H / 2 - 66); panel(W / 2 - 104, py, 208, 132, '#ff5a4a');
      texto(x, '¿SEGUÍS?', W / 2, py + 9, '#ff5a4a', 2, 'centro', CONTORNO, '#5a0a0a');
      // cuenta regresiva con un anillo que se va apagando dentro de cada segundo
      const cx = Math.round(W / 2), cy = py + 62, n = Math.max(0, Math.ceil(contador)), fr = contador - Math.floor(contador);
      for (let q = 0; q < 20; q++) { const a = -Math.PI / 2 + q / 20 * Math.PI * 2; const X = Math.round(cx + Math.cos(a) * 25) - 2, Y = Math.round(cy + Math.sin(a) * 25) - 2; x.fillStyle = CONTORNO; x.fillRect(X - 1, Y - 1, 6, 6); x.fillStyle = q / 20 < fr ? '#ffd23a' : '#3a2a4a'; x.fillRect(X, Y, 4, 4); }
      texto(x, String(n), cx, cy - 12, '#ffffff', 3, 'centro', CONTORNO);
      if (Math.floor(tP * 2.5) % 2 === 0) texto(x, esTactil() ? 'TOCÁ PARA SEGUIR' : 'APRETÁ PIÑA', W / 2, py + 98, '#ffd23a', 1, 'centro');
      texto(x, 'LOS PUNTOS VUELVEN A CERO', W / 2, py + 113, '#9a8aa8', 1, 'centro'); }
    if (pantalla === 'gana' || (juego && juego.estado === 'gana')) {
      if (juego.tEstado > 0.8) {
        const tit = juego.nv.num === NIVELES.length ? '¡MONTEVIDEO LIMPIO!' : '¡ZONA LIMPIA!';
        if (pantalla !== 'gana') texto(x, tit, W / 2, 60, '#ffd23a', 2, 'centro', CONTORNO, '#8a5a10');
        if (pantalla === 'gana') {
          velo(0.35); panel(W / 2 - 172, 46, 344, 160);
          texto(x, tit, W / 2, 60, '#ffd23a', 2, 'centro', CONTORNO, '#8a5a10'); texto(x, 'NIVEL ' + juego.nv.num + ' · ' + juego.nv.nombre, W / 2, 84, '#ffffff', 1, 'centro');
          // las cifras se cuentan de a poco (tablero de arcade)
          const k = Math.min(1, tP / 1.1), ke = 1 - (1 - k) ** 3; const cnt = (v) => String(Math.round(v * ke)).padStart(7);
          texto(x, 'PUNTOS       ' + cnt(juego.puntos), W / 2, 100, '#ffffff', 1, 'centro');
          texto(x, 'BONO TIEMPO  ' + cnt(juego.bonus), W / 2, 114, '#ffffff', 1, 'centro');
          texto(x, 'COMBO MÁXIMO ' + cnt(juego.comboMax), W / 2, 128, '#ffffff', 1, 'centro');
          texto(x, 'RÉCORD       ' + String(record).padStart(7), W / 2, 146, '#ffd23a', 1, 'centro');
          const sig = NIVELES[juego.nivelIdx + 1]; if (sig) { texto(x, 'SIGUIENTE: NIVEL ' + sig.num, W / 2, 168, '#7cc4ee', 1, 'centro'); texto(x, sig.nombre, W / 2, 180, '#7cc4ee', 1, 'centro'); } else texto(x, '¡TERMINASTE EL JUEGO!', W / 2, 176, '#7aff7a', 1, 'centro');
          if (tP > 1.5 && Math.floor(tP * 2) % 2) texto(x, 'TOCÁ PARA SEGUIR', W / 2, H - 30, '#ffffff', 1, 'centro');
        }
      }
    }
  } else if (pantalla === 'titulo') dibujarTitulo();
  else if (pantalla === 'seleccion') dibujarSeleccion();
  else if (pantalla === 'vestuario') dibujarVestuario();
  else if (pantalla === 'mapa') dibujarMapa(x, W, H, tP, spMapa);
  else if (pantalla === 'final') dibujarFinal();
  fundidoPantalla();
  if (window.__bb.debug) texto(x, med.fps + ' FPS', W - 4, H - 12, '#7aff7a', 1, 'der');
}
// fundido corto desde negro en cada cambio de pantalla (salvo los menús que van encima del juego)
let pantAnt = 'carga', fundido = 1, tFund = 0;
const ENCIMA = new Set(['juego>pausa', 'pausa>juego', 'juego>continuar', 'continuar>juego', 'juego>gana']);
function fundidoPantalla() {
  const ahora = performance.now();
  if (pantalla !== pantAnt) { if (!ENCIMA.has(pantAnt + '>' + pantalla) && pantAnt !== 'carga') fundido = 0; pantAnt = pantalla; tFund = ahora; }
  if (fundido < 1) { fundido = Math.min(1, (ahora - tFund) / 280); const a = 1 - fundido * fundido; x.fillStyle = `rgba(10,6,16,${a.toFixed(3)})`; x.fillRect(0, 0, W, H); }
}
// panel de menú: caja oscura con contorno, filetes de color y remaches en las esquinas
function panel(px, py, pw, ph, acento = '#ffd23a') {
  px = Math.round(px); py = Math.round(py); pw = Math.round(pw); ph = Math.round(ph);
  x.fillStyle = CONTORNO; x.fillRect(px - 2, py - 2, pw + 4, ph + 4); x.fillStyle = 'rgba(24,13,36,0.93)'; x.fillRect(px, py, pw, ph);
  x.fillStyle = 'rgba(255,255,255,0.05)'; x.fillRect(px, py + 2, pw, Math.round(ph * 0.3));
  x.fillStyle = acento; x.fillRect(px, py, pw, 2); x.fillRect(px, py + ph - 2, pw, 2);
  for (const [a, b] of [[px + 3, py + 5], [px + pw - 6, py + 5], [px + 3, py + ph - 8], [px + pw - 6, py + ph - 8]]) { x.fillStyle = CONTORNO; x.fillRect(a - 1, b - 1, 5, 5); x.fillStyle = acento; x.fillRect(a, b, 3, 3); }
}
const gruesa = matchMedia('(pointer:coarse)'); const esTactil = () => E.tactil || gruesa.matches;
function velo(a) { x.fillStyle = `rgba(20,10,30,${a})`; x.fillRect(0, 0, W, H); }
let cieloMenu = null, cieloMenuK = '';
function fondo(desp) {
  const k = W + 'x' + H; if (k !== cieloMenuK) { cieloMenu = cielo(W, H); cieloMenuK = k; }
  x.drawImage(cieloMenu, 0, 0); const off = H - ALTO;
  const sx = Math.round(desp) % (fondoMenu.width - W); x.drawImage(fondoMenu, sx, 0, W, ALTO + EXTRA, 0, off - EXTRA, W, ALTO + EXTRA);
}
function dibujarTitulo() {
  fondo(400 + Math.sin(tP * 0.2) * 60 + 60);
  velo(0.25);
  const cy = Math.round(H * 0.24);
  { const g = x.createLinearGradient(0, cy - 30, 0, cy + 110); g.addColorStop(0, 'rgba(18,10,26,0)'); g.addColorStop(0.22, 'rgba(18,10,26,0.72)'); g.addColorStop(0.8, 'rgba(18,10,26,0.72)'); g.addColorStop(1, 'rgba(18,10,26,0)'); x.fillStyle = g; x.fillRect(0, cy - 30, W, 140); }
  texto(x, 'PÁRATE DE MANO', W / 2, cy - 12, '#ffd23a', 3, 'centro', CONTORNO, '#a04a10');
  texto(x, 'ÑERI', W / 2, cy + 28, '#ff5a3a', 5, 'centro', CONTORNO, '#6a0a0a');
  texto(x, 'PIÑAS, BIZCOCHOS Y CANDOMBE', W / 2, cy + 76, '#ffffff', 1, 'centro');
  // personajes
  CLAVES.forEach((k, i) => { const s = generar(k, 0, ropaDe(k)); const f = s.anims.quieto[Math.floor(tP * 4 + i) % 4]; dibujarCuadro(x, f, Math.round(W / 2 - 100 + i * 70), H - 14, 1); });
  if (Math.floor(tP * 2) % 2 === 0) texto(x, esTactil() ? 'TOCÁ PARA ARRANCAR' : 'APRETÁ PIÑA PARA ARRANCAR', W / 2, cy + 94, '#ffd23a', 1, 'centro', CONTORNO, '#5a3a10');
  if (record) texto(x, 'RÉCORD ' + record, 6, H - 12, '#ffffff', 1);
  texto(x, nuevaVersion ? 'VERSIÓN NUEVA LISTA' : VERSION, W - 6, H - 12, nuevaVersion ? '#7aff7a' : '#9a8aa8', 1, 'der');
}
function dibujarSeleccion() {
  fondo(1180 + tP * 8); velo(0.45);
  texto(x, 'ELEGÍ TU PERSONAJE', W / 2, 10, '#ffd23a', 2, 'centro', CONTORNO, '#8a5a10');
  const cw = Math.min(150, (W - 40) / 3); const x0 = (W - cw * 3 - 20) / 2;
  CLAVES.forEach((k, i) => {
    const st = JUGADORES[k]; const s = generar(k, 0, ropaDe(k)); const cx = Math.round(x0 + i * (cw + 10)); const sel = i === elegido;
    x.fillStyle = sel ? '#ffd23a' : CONTORNO; x.fillRect(cx - 1, 39, cw + 2, H - 78); x.fillStyle = sel ? 'rgba(60,30,80,0.92)' : 'rgba(30,16,40,0.85)'; x.fillRect(cx + 1, 41, cw - 2, H - 82);
    texto(x, st.nombre, cx + cw / 2, 46, sel ? '#ffd23a' : '#ffffff', 1, 'centro');
    const an = sel ? s.anims.camina : s.anims.quieto; const f = an[Math.floor(tP * (sel ? 14 : 4)) % an.length];
    dibujarCuadro(x, f, Math.round(cx + cw / 2), 160, 1);
    ['FUERZA', 'VELOCIDAD', 'AGUANTE'].forEach((n, q) => { const yy = 166 + q * 12; texto(x, n, cx + 6, yy, '#c8b8d8', 1); for (let b = 0; b < 5; b++) { x.fillStyle = CONTORNO; x.fillRect(cx + cw - 46 + b * 8, yy, 7, 7); x.fillStyle = b < st.stats[q] ? ['#ff5a3a', '#5ab4ff', '#7ae07a'][q] : '#3a2a4a'; x.fillRect(cx + cw - 45 + b * 8, yy + 1, 5, 5); } });
    const palabras = st.desc.split(' '); let linea = '', ly = 207; const maxc = Math.floor((cw - 8) / 8);
    for (const p of palabras) { if ((linea + ' ' + p).trim().length > maxc) { texto(x, linea.trim(), cx + cw / 2, ly, '#ffffff', 1, 'centro'); ly += 10; linea = p; } else linea += ' ' + p; }
    texto(x, linea.trim(), cx + cw / 2, ly, '#ffffff', 1, 'centro');
  });
  if (Math.floor(tP * 2) % 2 === 0) texto(x, esTactil() ? 'TOCÁ DE NUEVO PARA SEGUIR' : '< >  ELEGÍ  ·  PIÑA: SEGUIR', W / 2, H - 28, '#ffd23a', 1, 'centro');
}

function boton(r, txt, activo, color = '#ffd23a') {
  x.fillStyle = CONTORNO; x.fillRect(r[0] - 1, r[1] - 1, r[2] + 2, r[3] + 2); x.fillStyle = activo ? color : '#4a3260'; x.fillRect(r[0], r[1], r[2], r[3]);
  x.fillStyle = 'rgba(255,255,255,0.18)'; x.fillRect(r[0], r[1], r[2], 2); texto(x, txt, r[0] + r[2] / 2, r[1] + Math.round(r[3] / 2) - 4, activo ? CONTORNO : '#ffffff', 1, 'centro', activo ? null : CONTORNO);
}
function dibujarVestuario() {
  fondo(1500 + tP * 6); velo(0.5);
  const k = CLAVES[elegido], Z = zonasVest();
  texto(x, 'ARMÁ TU PINTA', W / 2, 8, '#ffd23a', 2, 'centro', CONTORNO, '#8a5a10');
  // vista previa (animación quieto a 2x, generada al vuelo y cacheada)
  const s = generar(k, 0, vest.ropa, true); const f = s.anims.quieto[Math.floor(tP * 4.4) % 4];
  x.fillStyle = CONTORNO; x.fillRect(9, 31, Z.px - 6, H - 38); x.fillStyle = 'rgba(40,20,56,0.9)'; x.fillRect(10, 32, Z.px - 8, H - 40);
  x.fillStyle = 'rgba(0,0,0,0.3)'; x.beginPath(); x.ellipse(10 + (Z.px - 8) / 2, H - 16, 34, 6, 0, 0, 7); x.fill();
  const esc = f.d.height / f.q * 2 <= H - 52 ? 2 : 1; x.imageSmoothingEnabled = false;
  dibujarCuadro(x, f, Math.round(10 + (Z.px - 8) / 2), H - 14, 1, esc);
  if (s.retrato) { x.fillStyle = CONTORNO; x.fillRect(13, 35, 34, 34); x.fillStyle = '#5a3a6a'; x.fillRect(14, 36, 32, 32); x.drawImage(s.retrato, 15, 37, 30, 30); }
  texto(x, JUGADORES[k].nombre, 48, 44, '#ffffff', 1);
  x.fillStyle = CONTORNO; x.fillRect(Z.x0 - 7, 31, Z.x1 - Z.x0 + 14, Z.fh * 4 + 6); x.fillStyle = 'rgba(28,14,40,0.9)'; x.fillRect(Z.x0 - 6, 32, Z.x1 - Z.x0 + 12, Z.fh * 4 + 4);
  SLOTS.forEach(([slot, nombre, cat], i) => {
    const fl = Z.filas[i], sel = vest.fila === i, it = cat[vest.ropa[slot]];
    if (sel) { x.fillStyle = 'rgba(255,210,58,0.16)'; x.fillRect(Z.x0 - 4, fl.y, Z.x1 - Z.x0 + 8, Z.fh - 2); }
    texto(x, nombre, Z.x0, fl.y + 2, sel ? '#ffd23a' : '#c8b8d8', 1);
    boton(fl.izq, '<', sel); boton(fl.der, '>', sel);
    const cx = (Z.x0 + 30 + Z.x1 - 30) / 2; texto(x, it.nombre, cx, fl.y + 19, '#ffffff', 1, 'centro');
    if (it.club) texto(x, it.club.toUpperCase(), cx, fl.y + 30, '#7cc4ee', 1, 'centro');
    else { const ops = opciones(slot); texto(x, (ops.indexOf(vest.ropa[slot]) + 1) + '/' + ops.length, cx, fl.y + 30, '#9a8aa8', 1, 'centro'); }
  });
  const enBot = vest.fila === SLOTS.length;
  boton(Z.azar, 'AZAR', false); boton(Z.volver, 'VOLVER', false); boton(Z.dale, '¡A LA CANCHA!', enBot || Math.floor(tP * 2) % 2 === 0, '#7ae07a');
  if (!E.tactil && Z.fh * 4 + 50 < H - 34) texto(x, 'ARRIBA/ABAJO: ELEGÍ  < >: CAMBIÁ', (Z.x0 + Z.x1) / 2, 31 + Z.fh * 4 + 12, '#9a8aa8', 1, 'centro');
}

function dibujarFinal() {
  fondo(2000 + tP * 10); velo(0.4); panel(W / 2 - 192, 30, 384, 128);
  texto(x, '¡MONTEVIDEO ES TUYO!', W / 2, 40, '#ffd23a', 2, 'centro', CONTORNO, '#8a5a10');
  ['Le ganaste al Tano, a Doña Chola, al Guarda,', 'al Bocha, al Parrillero y a Don Pepe.', '', 'La rambla está tranquila. El mate, caliente.', 'Mañana hay feria.'].forEach((l, i) => texto(x, l.toUpperCase(), W / 2, 66 + i * 12, '#ffffff', 1, 'centro', CONTORNO));
  CLAVES.forEach((k, i) => { const s = generar(k, 0, ropaDe(k)); const an = s.anims.festeja || s.anims.quieto; const f = an[Math.floor(tP * 3 + i) % an.length]; dibujarCuadro(x, f, Math.round(W / 2 - 80 + i * 80), H - 16, 1); });
  texto(x, 'RÉCORD ' + record, W / 2, 128, '#7aff7a', 1, 'centro', CONTORNO);
  if (tP > 2 && Math.floor(tP * 2) % 2) texto(x, 'TOCÁ PARA VOLVER', W / 2, 142, '#ffd23a', 1, 'centro', CONTORNO);
}

// ---------- bot de prueba (juega solo) ----------
function botControl() {
  // bot de pruebas: juega "como una persona prolija" para que los números de dificultad signifiquen algo
  const g = juego, j = g.j; let dx = 0, dy = 0; E.tdx = 0; E.tdy = 0;
  const B = (botControl.m = botControl.m || { x: 0, t: 0, lado: 1, tLado: 0 });
  const enem = g.ents.filter((e) => e.equipo === 'e' && !e.muerto && e.est !== 'piso' && !(e.entrando > 0));
  const libre = j.est === 'quieto' || j.est === 'camina';
  B.ign = B.ign || new Set();
  const comida = g.items.find((it) => it.est === 'piso' && COMIDA.includes(it.t) && !B.ign.has(it) && Math.abs(it.x - j.x) < 220 && it.x > g.cam + 14 && it.x < g.cam + g.vista.w - 10);
  const arma = !j.arma && g.items.find((it) => it.est === 'piso' && !B.ign.has(it) && ITEMS[it.t] && ITEMS[it.t].arma && !ITEMS[it.t].npc && !ITEMS[it.t].soloTiro && !ITEMS[it.t].proy && Math.abs(it.x - j.x) < 90 && it.x > g.cam + 14);
  const cercaDe = (o, r) => enem.filter((e) => Math.abs(e.x - o.x) < r && Math.abs(e.y - o.y) < 14).length;
  // amenaza: alguien que está cargando un golpe y me alcanza
  // con tiempo de reacción humano (~0.18 s) y sin esquivar todo, para que la dificultad mida algo real
  B.visto = B.visto || new Map();
  const amenaza = enem.find((e) => {
    if (!(e.est === 'ataca' && e.atq && e.t < e.atq.ini && Math.abs(e.y - j.y) < 14 && Math.abs(e.x - j.x) < (e.atq === ATQ.e_embestida ? 400 : 62))) return false;
    const clave = e.id + ':' + e.atq.anim; let v = B.visto.get(clave);
    if (!v || g.t - v.t > 2) { v = { t: g.t, ok: Math.random() < (e.atq.aviso ? 0.8 : 0.55) }; B.visto.set(clave, v); }
    return v.ok && g.t - v.t > 0.18;
  });
  if (j.est === 'agarrado') { E.buf.pina = 0.1; }
  const bondiViene = g.ev.bondis.length && j.y > 205;
  if (bondiViene) { dy = -1; dx = 0; }
  else if (amenaza && libre) { dy = j.y > 222 ? -1 : j.y < 196 ? 1 : (j.y >= amenaza.y ? 1 : -1); dx = Math.sign(j.x - amenaza.x) * 0.5; }
  else if (comida && j.hp < j.hpMax * 0.65 && (enem.length === 0 || (j.hp < j.hpMax * 0.35 && cercaDe(j, 60) === 0))) { dx = Math.sign(comida.x - j.x); dy = Math.abs(comida.y - j.y) > 3 ? Math.sign(comida.y - j.y) : 0; if (Math.abs(comida.x - j.x) < 10 && Math.abs(comida.y - j.y) < 6 && libre) E.buf.pina = 0.1; if (B.obj !== comida) { B.obj = comida; B.tObj = g.t; } else if (g.t - B.tObj > 4) B.ign.add(comida); }
  else if (arma && cercaDe(j, 70) === 0) { dx = Math.abs(arma.x - j.x) > 3 ? Math.sign(arma.x - j.x) : 0; dy = Math.abs(arma.y - j.y) > 3 ? Math.sign(arma.y - j.y) : 0; if (Math.abs(arma.x - j.x) < 14 && Math.abs(arma.y - j.y) < 8 && libre) E.buf.pina = 0.1; if (B.obj !== arma) { B.obj = arma; B.tObj = g.t; } else if (g.t - B.tObj > 4) B.ign.add(arma); }
  else if (enem.length) {
    enem.sort((a, b) => Math.abs(a.x - j.x) + Math.abs(a.y - j.y) * 2 - Math.abs(b.x - j.x) - Math.abs(b.y - j.y) * 2); const e = enem[0];
    // pararse del lado de afuera del grupo para no quedar sándwich
    if (g.t - B.tLado > 1.2) { B.tLado = g.t; const media = enem.reduce((s, o) => s + o.x, 0) / enem.length; B.lado = enem.length > 1 ? (Math.sign(e.x - media) || Math.sign(j.x - e.x) || 1) : Math.sign(j.x - e.x) || 1; if (e.st.jefe) B.lado = Math.sign(j.x - e.x) || 1; }
    let tx = e.x + B.lado * 26; tx = Math.max(g.cam + 20, Math.min(g.cam + g.vista.w - 20, tx));
    dx = Math.abs(tx - j.x) > 4 ? Math.sign(tx - j.x) : 0; dy = Math.abs(e.y - j.y) > 3 ? Math.sign(e.y - j.y) : 0;
    const adx = Math.abs(e.x - j.x), ady = Math.abs(e.y - j.y);
    if (adx < 38 && ady < 7) {
      if (j.cara !== Math.sign(e.x - j.x)) dx = Math.sign(e.x - j.x) * 0.3;
      else { dx = 0; const n = cercaDe(j, 44); if (n >= 3 && (j.mano >= 100 || j.hp > 45)) E.buf.especial = 0.1; else if ((e.st.ia === 'patova' || (e.ia && e.ia.guardia)) && !j.arma) E.buf.patada = 0.1; else if (j.arma || e.st.jefe || Math.random() < 0.8) E.buf.pina = 0.1; else E.buf.patada = 0.1; }
    } else if (adx > 48 && adx < 70 && ady < 6 && j.cara === Math.sign(e.x - j.x) && libre && Math.random() < 0.02) { E.buf.salto = 0.1; }
    if (j.est === 'salto' && j.t > 0.18 && adx < 50) E.buf.patada = 0.1;
  } else dx = 1;
  // fuego en el camino (fogata, parrilla, brasas encendidas): cambiar de carril en vez de atravesarlo
  if (dx && !bondiViene) for (const p of g.ev.peligros) { if (p.aviso > 0 && p.t === 'brasa') continue; const ax = (p.x - j.x) * Math.sign(dx); if (ax > -6 && ax < 46 && Math.abs(p.y - j.y) < (p.r || 18) + 6) { dy = p.y >= j.y ? (j.y - 12 < 182 ? 1 : -1) : (j.y + 12 > 266 ? -1 : 1); break; } }
  // si está trabado contra algo, que lo rodee (con tiempo de juego, sirve en turbo)
  if (Math.abs(j.x - B.x) > 3 || !dx) { B.x = j.x; B.t = g.t; }
  else if (g.t - B.t > 0.4) { const k = Math.floor((g.t - B.t) / 1.5) % 2; dy = (j.y > 222 ? -1 : 1) * (k ? -1 : 1);
    // trabado contra un contenedor: patearlo para correrlo
    if (g.t - B.t > 1.2 && libre && g.decor.some((d) => d.empuja && Math.abs(d.x - j.x) < 70 && Math.abs(d.y - j.y) < 20) && Math.random() < 0.1) E.buf.patada = 0.1; }
  E.tdx = dx; E.tdy = dy; E.dx = dx; E.dy = dy;
}

window.__bb = { version: VERSION, med, bot: false, gore: GORE, debug: /debug/.test(location.search), get pantalla() { return pantalla; }, juego: null,
  empezar: (i = 0, nivel = 0) => { elegido = i; empezar(nivel); }, siguiente: () => siguienteNivel(), NIVELES, irA: (p) => { pantalla = p; }, ajustar, D: () => D, escala: () => escala };

// ---------- service worker: se actualiza solo en el menú ----------
if ('serviceWorker' in navigator && location.protocol !== 'file:' && !/nosw/.test(location.search)) {
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then((reg) => { setInterval(() => reg.update(), 60 * 60 * 1000); }).catch(() => {});
  let tenia = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!tenia) { tenia = true; return; }
    if (pantalla === 'titulo' || pantalla === 'seleccion' || pantalla === 'vestuario' || pantalla === 'carga') location.reload(); else nuevaVersion = true;
  });
}
iniciar();
