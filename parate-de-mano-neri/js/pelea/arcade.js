// Pantallas del modo arcade: menú principal, selección de luchador (30 casilleros), torres, pelea libre, supervivencia,
// resultados, récords y las peleas de jefe de la campaña. main.js delega aquí todo lo que es motor de pelea.
import { texto, CONTORNO, lienzo } from '../pixel.js';
import { armarDef, retrato, generar, dibujarCuadro, cuadroListo, siluetaBlanca } from '../sprites.js';
import { sonar, musica } from '../audio.js';
import { DIOS, P as PROG } from '../progreso.js';
import { LUCHADORES, POR_ID } from './luchadores.js';
import { Pelea, setLuchador } from './motor.js';
import { Escenario, ESCENARIOS, IDS_ESC } from './escenarios.js';
import { desbloqueado, torreAbierta, registrarPelea, registrarTorre, sumarPlataPelea, recordInfinito, PP , registrarVencido } from './progreso-pelea.js';
import { modoPelea, usaPad, nomBoton } from '../entrada.js';

export const TORRES = [
  { id: 'barrio', nombre: 'TORRE DEL BARRIO', dif: 'NORMAL', c: '#4aa03a', pisos: 7, medio: { piso: 4, id: 'patovica', hp: 1.3, esc: 'boliche' }, jefe: { id: 'parrillero', hp: 1.5, esc: 'ciudadvieja' }, cpu: (i) => (i < 3 ? 1 : 2), premio: 120, final: 1500,
    pool: ['turro', 'fachero', 'tachero', 'repartidor', 'feria', 'canillita', 'skate', 'borracho', 'cuidacoches', 'pizza', 'vecino', 'youtuber', 'policia', 'chef', 'mecanico', 'rapero'] },
  { id: 'caos', nombre: 'TORRE DEL CAOS', dif: 'DIFÍCIL', c: '#e8a020', pisos: 8, medio: { piso: 4, id: 'capo', hp: 1.25, esc: 'rambla' }, jefe: { id: 'monstruo', hp: 1.6, esc: 'cerro' }, cpu: (i) => (i < 4 ? 2 : 3), premio: 200, final: 3000, caos: true,
    pool: ['turro', 'fachero', 'tachero', 'repartidor', 'feria', 'canillita', 'skate', 'veterano', 'borracho', 'fisico', 'policia', 'reventado', 'rapero', 'skin', 'milico', 'pisterito', 'cuidacoches', 'pizza', 'vecino', 'gitano', 'chef', 'youtuber', 'trapero', 'abogado', 'mecanico', 'tano', 'chola', 'guarda', 'bocha', 'gallego', 'chapa'] },
  { id: 'infierno', nombre: 'TORRE DEL INFIERNO', dif: 'EXTREMO', c: '#e83a2a', pisos: 10, medio: { piso: 5, id: 'monstruo', hp: 1.5, esc: 'cerro' }, medio2: { piso: 8, id: 'capo', hp: 1.35, esc: 'rambla' }, jefe: { id: 'zombi', hp: 1.8, dmg: 1.2, esc: 'cerro' }, cpu: () => 3, premio: 350, final: 6000, caos: true, hp: 1.15,
    pool: ['veterano', 'fisico', 'policia', 'reventado', 'rapero', 'parrillero', 'skin', 'milico', 'pisterito', 'gitano', 'chef', 'trapero', 'abogado', 'mecanico', 'patovica', 'bocha', 'chapa', 'gallego', 'neri', 'fachero', 'turro'] },
];
const MODS = [{ k: 'dobleDanio', t: 'DAÑO X2', s: 'DAÑO DOBLE' }, { k: 'superLleno', t: 'SÚPER LLENO', s: 'SÚPER LLENO' }, { k: 'gigante', t: 'GIGANTE', s: 'RIVAL CON +50% DE VIDA' }, { k: 'sinReloj', t: 'SIN RELOJ', s: 'SIN RELOJ' }, { k: 'espejo', t: 'ESPEJO', s: 'PELEA ESPEJO' }, { k: 'dobleSuper', t: 'AUTO-SÚPER', s: 'SÚPER QUE SE CARGA SOLO' }];
const ESC_BOSS = { patovica: 'boliche', parrillero: 'ciudadvieja', capo: 'rambla', monstruo: 'cerro', zombi: 'cerro', tano: 'cuadra', chola: 'feria', guarda: 'avenida', bocha: 'barriosur', gallego: 'boliche', chapa: 'cerro' };
const DIFS = ['FÁCIL', 'NORMAL', 'DIFÍCIL'];
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const DT = 1 / 120;
// cortar un texto en renglones de n caracteres
export function cortar(s, n) { const r = []; let l = ''; for (const w of s.split(' ')) { if ((l + ' ' + w).trim().length > n) { if (l) r.push(l); l = w; } else l = (l + ' ' + w).trim(); } if (l) r.push(l); return r; }
const dentro = (t, r) => t && t[0] >= r[0] && t[0] <= r[0] + r[2] && t[1] >= r[1] && t[1] <= r[1] + r[3];
const retratos = new Map();
function retratoDe(id, T = 24) { const k = id + T; let r = retratos.get(k); if (r) return r; const L = POR_ID[id]; r = retrato(armarDef(L.cuerpo, 0, null), T); retratos.set(k, r); return r; }
function sombraDe(cv) { const [c, x] = lienzo(cv.width, cv.height); x.drawImage(cv, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = '#120a1c'; x.fillRect(0, 0, c.width, c.height); return c; }
const sombras = new Map(); function retratoBloq(id, T) { const k = id + T; let r = sombras.get(k); if (!r) { r = sombraDe(retratoDe(id, T)); sombras.set(k, r); } return r; }

export class Arcade {
  constructor(api) { this.api = api; this.vista = null; this.t = 0; this.sel = 0; this.pelea = null; this.pausa = null; this.fondo = null; this.msg = null; }
  get enPelea() { return this.vista === 'pelea' && !this.pausa; }
  get activo() { return !!this.vista; }
  // ------------------------------------------------------------------ entradas a pantallas
  abrirMenu() { this.vista = 'menu'; this.sel = 0; this.t = 0; this.pelea = null; modoPelea(false); this.api.controles(false); musica('mus.menu'); if (!this.fondo) this.fondo = new Escenario('cuadra'); }
  ir(v, o = {}) { this.vista = v; this.t = 0; this.sel = o.sel || 0; Object.assign(this, o); }
  abrirSeleccion(modo, etapa = 'p1') { this.ir('select', { modo, etapa }); this.cur = this.cur ?? 0; this.info = false; this.confirma = null; musica('mus.pelea.select'); }
  // pelea de jefe de la campaña: el beat 'em up pasa al motor de pelea y vuelve
  pelearCampana(o, fin) { this.campana = { o, fin }; this.lanzar({ p1: { id: o.p1, ropa: o.ropa, cpu: !!o.bot, dif: 3 }, p2: { id: o.p2, cpu: true, dif: o.dif || 2, hpMul: o.hpMul || 1, dmgMul: o.dmgMul || 1, jefe: true }, escenario: o.escenario, modo: 'campana', titulo: o.titulo, rondas: o.rondas || 2, musica: o.musica }); }
  lanzar(cfg) { cfg.dios = DIOS.on; if (cfg.p1.cpu === undefined) cfg.p1.cpu = false; this.cfgPelea = cfg; this.pelea = new Pelea(cfg); this.pausa = null; this.ir('pelea'); modoPelea(true); this.api.controles(true); window.__bb && (window.__bb.pelea = this.pelea); }
  // ------------------------------------------------------------------ paso fijo de la pelea (lo llama main a 120 Hz)
  pasoPelea(dt, E) { const p = this.pelea; if (!p) return; if (this.api.bot() && !p.F[0].cpu) { p.F[0].cpu = true; p.F[0].ia = new (p.F[1].ia.constructor)(p.F[0], 3); }
    p.paso(dt, E); const sl = !p.F[0].cpu && p.F[0].super >= 100; if (sl !== this._sl) { this._sl = sl; document.body.classList.toggle('super-lleno', sl); } if (E.buf.pausa > 0 && p.estado !== 'fin') { E.buf.pausa = 0; this.pausa = { sel: 0 }; sonar('ui.pausa'); }
    if (p.estado === 'fin' && p.tE > 1.6) this.finPelea(p.resultado); }
  finPelea(r) { const cfg = this.cfgPelea; modoPelea(false); this.api.controles(false); const gane = r.gana === 1;
    if (cfg.modo === 'campana') { const nuevos = [...(gane ? registrarVencido(cfg.p2.id) || [] : []), ...(registrarPelea(r, cfg) || [])]; this.ir('campanaFin', { res: r, nuevos }); return; }
    const nuevos = registrarPelea(r, cfg); let plata = 0;
    if (cfg.modo === 'torre') { const T = this.torre; if (gane) { plata = T.def.premio + (r.stats.perfectos ? 50 : 0); T.plata += plata; sumarPlataPelea(plata); } }
    else if (cfg.modo === 'libre') { if (gane) { plata = 40 * (cfg.p2.dif || 2); sumarPlataPelea(plata); } }
    else if (cfg.modo === 'superv') { const S = this.superv; if (gane) { S.ganadas++; S.hp = Math.min(this.pelea.F[0].hpMax, this.pelea.F[0].hp + this.pelea.F[0].hpMax * 0.25); plata = 30 + S.ganadas * 10; sumarPlataPelea(plata); } else { S.record = recordInfinito('superv', S.ganadas); } }
    this.ir('resultado', { res: r, nuevos, plata }); }
  // ------------------------------------------------------------------ menús (paso de pantalla)
  paso(dt, I) {
    this.t += dt; if (this.fondo) this.fondo.paso(dt); const n = I.n, t = I.tap; const v = this.vista;
    if (v === 'pelea') { if (this.pausa) this.pasoPausa(I); return; }
    if (v === 'menu') { const ops = this.opsMenu(); if (n.y) { this.sel = (this.sel + n.y + ops.length) % ops.length; sonar('ui.mover'); } let el = I.ok ? this.sel : -1; if (t) ops.forEach((o, i) => { if (dentro(t, this.zMenu(i))) el = i; });
      if (I.atras) { this.vista = null; this.api.titulo(); return; } if (el >= 0) { sonar('ui.ok'); this.sel = el; ops[el].f(); } return; }
    if (v === 'select') return this.pasoSel(I);
    if (v === 'torres') { if (n.x) { this.sel = (this.sel + n.x + 3) % 3; sonar('ui.mover'); } let el = I.ok ? this.sel : -1; if (t) for (let i = 0; i < 3; i++) if (dentro(t, this.zTorre(i))) { if (this.sel === i) el = i; else { this.sel = i; sonar('ui.mover'); } }
      if (dentro(t, this.zVolver()) || I.atras) { this.abrirMenu(); this.sel = 1; return; }
      if (el >= 0) { if (!torreAbierta(el)) { sonar('ui.atras'); this.msg = { s: 'TERMINÁ LA TORRE ANTERIOR', t: 1.4 }; return; } sonar('ui.ok'); this.torreSel = el; this.abrirSeleccion('torre'); } return; }
    if (v === 'torre') { if (I.ok || (t && !dentro(t, this.zVolver()))) { sonar('ui.ok'); this.pelearPiso(); return; } if (I.atras || dentro(t, this.zVolver())) { this.ir('torres', { sel: this.torreSel }); } return; }
    if (v === 'cfgLibre') return this.pasoCfg(I);
    if (v === 'infinito') { const ops = [['OLEADAS (BEAT \'EM UP)', () => this.api.infinito()], ['SUPERVIVENCIA PLENA MORTAL', () => this.abrirSeleccion('superv')], ['VOLVER', () => { this.abrirMenu(); this.sel = 2; }]];
      if (n.y) { this.sel = (this.sel + n.y + 3) % 3; sonar('ui.mover'); } let el = I.ok ? this.sel : -1; if (t) ops.forEach((o, i) => { if (dentro(t, this.zLista(i, 3))) el = i; }); if (I.atras) el = 2; if (el >= 0) { sonar('ui.ok'); ops[el][1](); } return; }
    if (v === 'records') { if (n.y) this.sel = Math.max(0, Math.min(LUCHADORES.length - 8, this.sel + n.y)); if (I.ok || I.atras || dentro(t, this.zVolver())) { this.abrirMenu(); this.sel = 4; } return; }
    if (v === 'resultado') return this.pasoRes(I);
    if (v === 'campanaFin') return this.pasoCampFin(I);
  }
  opsMenu() { return [
    { s: 'CAMPAÑA', d: 'LA HISTORIA DEL ÑERI: 8 NIVELES DE MONTEVIDEO', f: () => { this.vista = null; this.api.campana(); } },
    { s: 'PLENA MORTAL: TORRES', d: 'TRES TORRES DE PLENA MORTAL, MANO A MANO, CON JEFES', f: () => this.ir('torres') },
    { s: 'MODO INFINITO', d: 'OLEADAS SIN FIN O SUPERVIVENCIA DE PLENA MORTAL', f: () => this.ir('infinito') },
    { s: 'PLENA MORTAL: LIBRE', d: 'MANO A MANO CONTRA LA CPU: ELEGÍ RIVAL Y ESCENARIO', f: () => this.abrirSeleccion('libre') },
    { s: 'RÉCORDS', d: 'TUS NÚMEROS, LUCHADORES Y DESBLOQUEOS', f: () => this.ir('records') },
  ]; }
  zMenu(i) { const W = this.api.W(), H = this.api.H(); return [Math.round(W / 2 - 100), Math.round(H * 0.36) + i * 22 - 5, 200, 19]; }
  zLista(i, n) { const W = this.api.W(), H = this.api.H(); return [Math.round(W / 2 - 110), Math.round(H / 2 - n * 12) + i * 24 - 5, 220, 20]; }
  zVolver() { const H = this.api.H(); return [8, H - 26, 74, 20]; }
  zTorre(i) { const W = this.api.W(), H = this.api.H(); const cw = Math.min(140, (W - 40) / 3); const x0 = (W - cw * 3 - 20) / 2; return [Math.round(x0 + i * (cw + 10)), 46, Math.round(cw), H - 82]; }
  // ------------------------------------------------------------------ selección de luchador
  geo() { const W = this.api.W(), H = this.api.H(); const c = W >= 560 ? 28 : 25, g = 3, cols = 10; const gw = cols * (c + g) - g; return { c, g, cols, gw, x0: Math.round((W - gw) / 2), y0: H - 3 * (c + g) - 20, W, H }; }
  zCelda(i) { const G = this.geo(); return [G.x0 + (i % G.cols) * (G.c + G.g), G.y0 + Math.floor(i / G.cols) * (G.c + G.g), G.c, G.c]; }
  pasoSel(I) { const n = I.n, t = I.tap, N = LUCHADORES.length;
    if (this.confirma) { this.confirma.t += I.dt; if (this.confirma.t > 1.0 || (this.confirma.t > 0.3 && (I.ok || t))) { const c = this.confirma; this.confirma = null; this.elegido(c.id); } return; }
    if (n.x) { this.cur = (this.cur + n.x + N) % N; sonar('ui.mover'); } if (n.y) { this.cur = (this.cur + n.y * 10 + N) % N; sonar('ui.mover'); }
    let el = I.ok; if (t) { for (let i = 0; i < N; i++) if (dentro(t, this.zCelda(i))) { if (this.cur === i) el = true; else { this.cur = i; sonar('ui.mover'); } } if (dentro(t, this.zVolver())) { I.atras = true; } if (dentro(t, this.zElegir())) el = true; if (dentro(t, this.zInfo())) { this.info = !this.info; sonar('ui.mover'); } }
    if (I.esp) { this.info = !this.info; sonar('ui.mover'); }
    if (I.atras) { sonar('ui.atras'); if (this.etapa === 'p2') { this.etapa = 'p1'; this.cur = LUCHADORES.findIndex((l) => l.id === this.p1); } else if (this.modo === 'torre') this.ir('torres', { sel: this.torreSel }); else this.abrirMenu(); return; }
    if (el) { const L = LUCHADORES[this.cur]; if (!desbloqueado(L.id)) { sonar('ui.atras'); this.msg = { s: 'BLOQUEADO: ' + L.desbloq.txt, t: 1.8 }; return; } sonar('ui.ok'); sonar('pelea.elegir'); this.confirma = { id: L.id, t: 0 }; } }
  zElegir() { const G = this.geo(); return [G.W - 84, G.H - 26, 76, 20]; }
  zInfo() { const G = this.geo(); return [Math.round(G.W / 2 - 80), 34, 160, G.y0 - 40]; }
  elegido(id) {
    if (this.modo === 'libre' && this.etapa === 'p1') { this.p1 = id; this.etapa = 'p2'; this.cur = Math.floor(Math.random() * 30); return; }
    if (this.modo === 'libre') { this.p2 = id; this.ir('cfgLibre', { cfgL: this.cfgL || { dif: 1, esc: 0 } }); return; }
    if (this.modo === 'torre') { this.p1 = id; this.armarTorre(); return; }
    if (this.modo === 'superv') { this.p1 = id; this.superv = { ganadas: 0, hp: null }; this.pelearSuperv(); }
  }
  // ------------------------------------------------------------------ torres
  armarTorre() { const T = TORRES[this.torreSel]; const pool = T.pool.filter((i) => i !== this.p1); const pisos = [];
    for (let i = 0; i < T.pisos; i++) {
      let p; if (i === T.pisos - 1) p = { id: T.jefe.id, hp: T.jefe.hp, dmg: T.jefe.dmg || 1, tipo: 'JEFE FINAL', esc: T.jefe.esc, jefe: true };
      else if (T.medio && i === T.medio.piso - 1) p = { id: T.medio.id, hp: T.medio.hp, tipo: 'MEDIO JEFE', esc: T.medio.esc, jefe: true };
      else if (T.medio2 && i === T.medio2.piso - 1) p = { id: T.medio2.id, hp: T.medio2.hp, tipo: 'MEDIO JEFE', esc: T.medio2.esc, jefe: true };
      else { let id; do { id = pick(pool); } while (pisos.some((q) => q.id === id) && pool.length > T.pisos); p = { id, hp: T.hp || 1, esc: ESC_BOSS[id] || IDS_ESC[(i * 3 + this.torreSel) % IDS_ESC.length] }; }
      if (T.caos && !p.jefe && Math.random() < (T.id === 'caos' ? 0.8 : 0.5)) { const m = pick(MODS.filter((q) => q.k !== 'espejo' || !pisos.some((o) => o.mod && o.mod.k === 'espejo'))); p.mod = m; if (m.k === 'espejo') p.id = this.p1; }
      p.dif = T.cpu(i); pisos.push(p); }
    this.torre = { def: T, pisos, piso: 0, t0: performance.now(), plata: 0 }; this.ir('torre'); musica('mus.pelea.select'); }
  pelearPiso() { const T = this.torre, p = T.pisos[T.piso]; const mods = p.mod ? { [p.mod.k]: true } : {};
    this.lanzar({ p1: { id: this.p1 }, p2: { id: p.id, cpu: true, dif: p.dif, hpMul: p.hp, dmgMul: p.dmg || 1, jefe: !!p.jefe }, escenario: p.esc, modo: 'torre', mods, titulo: T.def.nombre + ' · PISO ' + (T.piso + 1) + (p.tipo ? ' · ' + p.tipo : '') + (p.mod ? ' · ' + p.mod.s : ''), musica: p.jefe ? 'mus.pelea.jefe' : 'mus.pelea' }); }
  // ------------------------------------------------------------------ supervivencia
  pelearSuperv() { const S = this.superv, k = S.ganadas; const jefe = k > 0 && (k + 1) % 5 === 0; const id = jefe ? pick(['monstruo', 'zombi', 'capo', 'patovica']) : pick(LUCHADORES.filter((l) => l.id !== this.p1 && l.id !== 'monstruo' && l.id !== 'zombi').map((l) => l.id));
    this.lanzar({ p1: { id: this.p1, hpIni: S.hp }, p2: { id, cpu: true, dif: k < 2 ? 1 : k < 6 ? 2 : 3, hpMul: (jefe ? 1.3 : 0.85) + k * 0.03, jefe }, escenario: pick(IDS_ESC), modo: 'superv', rondas: 1, titulo: 'SUPERVIVENCIA · PELEA ' + (k + 1) + (jefe ? ' · JEFE' : '') }); }
  // ------------------------------------------------------------------ pelea libre: dificultad y escenario
  pasoCfg(I) { const n = I.n, t = I.tap, c = this.cfgL; if (n.y) { this.sel = (this.sel + n.y + 3) % 3; sonar('ui.mover'); }
    const cambiar = (fila, d) => { if (fila === 0) c.dif = (c.dif + d + 3) % 3; else if (fila === 1) c.esc = (c.esc + d + IDS_ESC.length + 1) % (IDS_ESC.length + 1); sonar('ui.mover'); };
    if (n.x && this.sel < 2) cambiar(this.sel, n.x);
    if (t) for (let i = 0; i < 3; i++) { const r = this.zLista(i, 3); if (dentro(t, r)) { this.sel = i; if (i < 2) cambiar(i, t[0] < r[0] + r[2] / 2 ? -1 : 1); else I.ok = true; } }
    if (I.atras || dentro(t, this.zVolver())) { this.abrirSeleccion('libre', 'p2'); return; }
    if (I.ok && this.sel === 2 || (I.ok && this.sel < 2 && (this.sel = 2) && false)) { sonar('ui.ok'); const esc = c.esc === 0 ? pick(IDS_ESC) : IDS_ESC[c.esc - 1];
      this.lanzar({ p1: { id: this.p1 }, p2: { id: this.p2, cpu: true, dif: c.dif + 1 }, escenario: esc, modo: 'libre', titulo: 'LIBRE · ' + DIFS[c.dif] }); } else if (I.ok) { this.sel = 2; } }
  // ------------------------------------------------------------------ pausa dentro de la pelea
  opsPausa() { return ['SEGUIR', 'REINICIAR PELEA', 'CONTROLES', this.cfgPelea.modo === 'campana' ? 'PELEAR A LA ANTIGUA' : 'SALIR']; }
  pasoPausa(I) { const ops = this.opsPausa(); const n = I.n, t = I.tap;
    if (this.pausa.ctrl) { if (this.api.pasoControles(I)) { this.pausa.ctrl = false; sonar('ui.mover'); } return; }
    if (n.y) { this.pausa.sel = (this.pausa.sel + n.y + 4) % 4; sonar('ui.mover'); }
    let el = I.ok ? this.pausa.sel : -1; if (t) ops.forEach((o, i) => { if (dentro(t, this.zLista(i, 4))) el = i; }); if (I.pausa || I.atras) el = 0;
    if (el === 0) { this.pausa = null; } else if (el === 1) { this.lanzar(this.cfgPelea); } else if (el === 2) { this.pausa.ctrl = true; sonar('ui.mover'); } else if (el === 3) { this.pausa = null; modoPelea(false); this.api.controles(false);
      if (this.cfgPelea.modo === 'campana') { const c = this.campana; this.campana = null; this.vista = null; c.fin({ gana: false, clasico: true }); } else this.salirModo(); } }
  salirModo() { const m = this.cfgPelea && this.cfgPelea.modo; this.pelea = null; if (m === 'torre') this.ir('torres', { sel: this.torreSel }); else if (m === 'superv') this.ir('infinito', { sel: 1 }); else this.abrirMenu(); }
  // ------------------------------------------------------------------ resultados
  opsRes() { const m = this.cfgPelea.modo, g = this.res.gana === 1;
    if (m === 'torre') { const T = this.torre; if (g) return T.piso + 1 >= T.pisos.length ? [['¡TORRE COMPLETA!', () => this.completarTorre()]] : [['SIGUIENTE PISO', () => { T.piso++; this.ir('torre'); musica('mus.pelea.select'); }]]; return [['REINTENTAR PISO', () => this.pelearPiso()], ['ABANDONAR TORRE', () => this.ir('torres', { sel: this.torreSel })]]; }
    if (m === 'superv') return g ? [['SIGUIENTE RIVAL', () => this.pelearSuperv()], ['RETIRARSE', () => { recordInfinito('superv', this.superv.ganadas); this.ir('infinito', { sel: 1 }); }]] : [['OTRA VEZ', () => { this.superv = { ganadas: 0, hp: null }; this.pelearSuperv(); }], ['SALIR', () => this.ir('infinito', { sel: 1 })]];
    return [['REVANCHA', () => this.lanzar(this.cfgPelea)], ['ELEGIR OTRO RIVAL', () => this.abrirSeleccion('libre', 'p2')], ['MENÚ', () => this.abrirMenu()]]; }
  pasoRes(I) { if (this.t < 0.8) return; const ops = this.opsRes(); const n = I.n, t = I.tap; if (n.y) { this.sel = (this.sel + n.y + ops.length) % ops.length; sonar('ui.mover'); }
    let el = I.ok ? this.sel : -1; if (t) ops.forEach((o, i) => { if (dentro(t, this.zRes(i))) el = i; }); if (el >= 0) { sonar('ui.ok'); ops[el][1](); } }
  zRes(i) { const W = this.api.W(), H = this.api.H(); return [Math.round(W / 2 - 90), H - 70 + i * 20, 180, 18]; }
  completarTorre() { const T = this.torre; const s = (performance.now() - T.t0) / 1000; const nuevos = registrarTorre(T.def.id, this.p1, s, T.def.final); this.ir('torreFin', { nuevosT: nuevos, tiempoT: s }); musica('mus.final'); sonar('evento.final'); }
  pasoCampFin(I) { if (this.t < 1.0) return; const g = this.res.gana === 1; const ops = g ? [['SEGUIR', () => this.volverCampana(true)]] : [['REVANCHA', () => this.lanzar(this.cfgPelea)], ['PELEAR A LA ANTIGUA', () => this.volverCampana(false, true)]];
    const n = I.n, t = I.tap; if (n.y) { this.sel = (this.sel + n.y + ops.length) % ops.length; sonar('ui.mover'); } let el = I.ok ? this.sel : -1; if (t) ops.forEach((o, i) => { if (dentro(t, this.zRes(i))) el = i; }); if (this.api.bot()) el = !g && (this.campana._rev = (this.campana._rev || 0) + 1) > 1 ? 1 : 0;
    if (el >= 0) { sonar('ui.ok'); ops[el][1](); } }
  finInfinito(r) { modoPelea(false); this.ir('infFin', { infRes: r, sel: 0 }); sonar(r.record.nuevo ? 'evento.record' : 'pelea.derrota'); }
  pasoInfFin(I) { if (this.t < 0.8) return; const ops = [['OTRA VEZ', () => this.api.infinito()], ['MENÚ', () => this.ir('infinito')]]; const n = I.n, t = I.tap;
    if (n.y) { this.sel = (this.sel + n.y + 2) % 2; sonar('ui.mover'); } let el = I.ok ? this.sel : -1; if (t) ops.forEach((o, i) => { if (dentro(t, this.zRes(i))) el = i; }); if (I.atras) el = 1; if (el >= 0) { sonar('ui.ok'); ops[el][1](); } }
  dibujarInfFin(x, W, H) { const r = this.infRes; this.panel(x, W / 2 - 160, 16, 320, H - 32, '#ff5a3a'); this.titulo(x, 'FIN DEL MODO INFINITO', W, 26, '#ff5a3a');
    const fil = [['OLEADAS SUPERADAS', r.olas], ['MEJOR MARCA', r.record.mejor], ['ENEMIGOS AL PISO', r.ko], ['COMBO MÁXIMO', r.combo], ['PUNTOS', r.puntos], ['PLATA GANADA', '$U ' + r.plata]];
    fil.forEach(([a, b], i) => { const y = 62 + i * 16; texto(x, a, W / 2 - 130, y, '#b8a8c8', 1); texto(x, String(b), W / 2 + 130, y, '#ffffff', 1, 'der'); });
    if (r.record.nuevo && (this.t * 4 | 0) % 2) texto(x, '¡RÉCORD NUEVO!', W / 2, 62 + fil.length * 16 + 6, '#ffd23a', 2, 'centro', CONTORNO);
    ['OTRA VEZ', 'MENÚ'].forEach((s, i) => this.boton(x, this.zRes(i), s, this.sel === i)); }
  volverCampana(gana, clasico = false) { const c = this.campana; this.campana = null; this.vista = null; this.pelea = null; c.fin({ gana, clasico }); }
  // ------------------------------------------------------------------ dibujo
  dibujar(x, alfa, W, H) { const v = this.vista;
    if (v === 'pelea') { this.pelea.dibujar(x, this.pausa ? 1 : alfa, W, H); if (this.pausa) this.dibujarPausa(x, W, H); return; }
    this.dibujarFondo(x, W, H);
    if (v === 'menu') this.dibujarMenu(x, W, H); else if (v === 'select') this.dibujarSel(x, W, H); else if (v === 'torres') this.dibujarTorres(x, W, H); else if (v === 'torre') this.dibujarTorre(x, W, H);
    else if (v === 'cfgLibre') this.dibujarCfg(x, W, H); else if (v === 'infinito') this.dibujarInfinito(x, W, H); else if (v === 'records') this.dibujarRecords(x, W, H);
    else if (v === 'resultado') this.dibujarRes(x, W, H); else if (v === 'campanaFin') this.dibujarCampFin(x, W, H); else if (v === 'torreFin') this.dibujarTorreFin(x, W, H); else if (v === 'infFin') this.dibujarInfFin(x, W, H);
    if (this.msg) { this.msg.t -= 1 / 60; texto(x, this.msg.s, W / 2, H - 46, '#ff8a5a', 1, 'centro'); if (this.msg.t <= 0) this.msg = null; }
  }
  dibujarFondo(x, W, H) { if (!this.fondo) { this.fondo = new Escenario('cuadra'); } this.fondo.sinPublico = this.vista !== 'menu'; const ancho = this.fondo.ancho || 760; const mx = Math.max(0, ancho - W); const C = Math.round(mx / 2 + Math.sin(this.t * 0.07) * mx / 2); this.fondo.dibujar(x, C, H - 270, W, H); x.fillStyle = 'rgba(14,8,26,0.7)'; x.fillRect(0, 0, W, H); }
  panel(x, px, py, pw, ph, c = '#ffd23a') { px = Math.round(px); py = Math.round(py); pw = Math.round(pw); ph = Math.round(ph); x.fillStyle = CONTORNO; x.fillRect(px - 2, py - 2, pw + 4, ph + 4); x.fillStyle = 'rgba(24,13,36,0.94)'; x.fillRect(px, py, pw, ph); x.fillStyle = c; x.fillRect(px, py, pw, 2); }
  boton(x, r, s, sel, c = '#ffd23a') { const [bx, by, bw, bh] = r; x.fillStyle = CONTORNO; x.fillRect(bx - 1, by - 1, bw + 2, bh + 2); x.fillStyle = sel ? 'rgba(255,210,58,0.22)' : 'rgba(40,24,56,0.9)'; x.fillRect(bx, by, bw, bh); if (sel) { x.fillStyle = c; x.fillRect(bx, by, 2, bh); }
    texto(x, s, bx + bw / 2, by + Math.round((bh - 8) / 2), sel ? '#ffffff' : '#b8a8c8', 1, 'centro'); }
  titulo(x, s, W, y = 10, c = '#ffd23a') { texto(x, s, W / 2, y, c, 2, 'centro', CONTORNO, '#5a3a10'); }
  dibujarMenu(x, W, H) { texto(x, 'PÁRATE DE MANO', W / 2, Math.round(H * 0.1), '#ffd23a', 3, 'centro', CONTORNO, '#8a3a10'); texto(x, 'ÑERI', W / 2, Math.round(H * 0.1) + 30, '#ff5a3a', 2, 'centro', CONTORNO, '#5a0a0a');
    const ops = this.opsMenu(); ops.forEach((o, i) => this.boton(x, this.zMenu(i), o.s, this.sel === i)); const o = ops[this.sel]; texto(x, o.d, W / 2, Math.round(H * 0.36) + ops.length * 22 + 6, '#c8b8d8', 1, 'centro');
    texto(x, '$U ' + PROG.plata + ' · ' + PP().ganadas + ' PELEAS GANADAS', W / 2, H - 14, '#8a7a9a', 1, 'centro'); if (DIOS.on) texto(x, 'MODO DIOS', W - 8, 6, '#ff5a3a', 1, 'der'); }
  dibujarSel(x, W, H) { const G = this.geo(); const N = LUCHADORES.length;
    this.titulo(x, this.etapa === 'p2' ? 'ELEGÍ AL RIVAL' : 'ELEGÍ TU LUCHADOR', W, 6, this.etapa === 'p2' ? '#ff5a3a' : '#ffd23a');
    const t = this.t;
    for (let i = 0; i < N; i++) { const L = LUCHADORES[i], r = this.zCelda(i), ab = desbloqueado(L.id); x.fillStyle = CONTORNO; x.fillRect(r[0] - 1, r[1] - 1, r[2] + 2, r[3] + 2); x.fillStyle = ab ? L.color || '#444' : '#2a2034'; x.fillRect(r[0], r[1], r[2], r[3]);
      x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(r[0], r[1] + r[3] / 2, r[2], r[3] / 2);
      const secreto = !ab && (L.id === 'monstruo'); if (!secreto) x.drawImage(ab ? retratoDe(L.id, 30) : retratoBloq(L.id, 30), r[0], r[1], r[2], r[3]); if (!ab) texto(x, '?', r[0] + r[2] / 2, r[1] + r[3] / 2 - 4, secreto ? '#ff5a3a' : '#8a7a9a', 1, 'centro'); }
    const rc = this.zCelda(this.cur); const col = this.etapa === 'p2' ? '#ff3a2a' : '#ffd23a'; if ((t * 6 | 0) % 2 || this.confirma) { x.fillStyle = col; x.fillRect(rc[0] - 3, rc[1] - 3, rc[2] + 6, 2); x.fillRect(rc[0] - 3, rc[1] + rc[3] + 1, rc[2] + 6, 2); x.fillRect(rc[0] - 3, rc[1] - 3, 2, rc[3] + 6); x.fillRect(rc[0] + rc[2] + 1, rc[1] - 3, 2, rc[3] + 6); }
    texto(x, this.etapa === 'p2' ? '2P' : '1P', rc[0] + 1, rc[1] - 12, col, 1);
    // vista grande
    const L = LUCHADORES[this.cur], ab = desbloqueado(L.id); const fy = G.y0 - 12;
    const dib = (Lx, px, cara, conf) => { const sp = setLuchador(Lx); const an = conf ? 'intro' : 'quieto'; const fr = cuadroListo(sp, an, Math.floor(t * (conf ? 2.5 : 5)) % (conf ? 2 : 4)); x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(px - 24, fy - 2, 48, 4);
      if (conf && this.confirma.t < 0.12) dibujarCuadro(x, siluetaBlanca(fr), px, fy, cara); else dibujarCuadro(x, fr, px, fy, cara); };
    const conf = !!this.confirma;
    if (this.etapa === 'p2' && this.p1) dib(POR_ID[this.p1], Math.round(W * 0.15), 1, false);
    if (ab) dib(L, Math.round(this.etapa === 'p2' ? W * 0.85 : W * 0.17), this.etapa === 'p2' ? -1 : 1, conf); else { const sp = setLuchador(L); const fr = cuadroListo(sp, 'quieto', 0); const px = Math.round(this.etapa === 'p2' ? W * 0.85 : W * 0.17); x.globalAlpha = 0.9; dibujarCuadro(x, siluetaNegra(fr), px, fy, 1); x.globalAlpha = 1; }
    // ficha
    const ix = Math.round(W / 2), iy = 32; texto(x, ab ? L.nombre : (L.id === 'monstruo' ? '???' : L.nombre), ix, iy, ab ? (L.color === '#24242c' ? '#c8c8d8' : '#ffffff') : '#8a7a9a', 1, 'centro');
    texto(x, ab ? L.apodo : 'BLOQUEADO', ix, iy + 12, '#ffd23a', 1, 'centro');
    if (!ab) { cortar(L.desbloq.txt, 22).forEach((l, i) => texto(x, l, ix, iy + 30 + i * 11, '#ff8a5a', 1, 'centro')); }
    else if (this.info) { cortar(L.bio, Math.floor(Math.min(240, W * 0.42) / 8)).slice(0, 7).forEach((l, i) => texto(x, l, ix, iy + 28 + i * 10, '#d8d0e0', 1, 'centro')); }
    else { texto(x, L.estiloTxt, ix, iy + 25, '#9ad8f0', 1, 'centro'); const nom = ['POTENCIA', 'VELOCIDAD', 'AGUANTE', 'TÉCNICA']; const bx = ix - 62;
      nom.forEach((s, i) => { const yy = iy + 40 + i * 11; texto(x, s, bx, yy, '#b8a8c8', 1); for (let k = 0; k < 5; k++) { x.fillStyle = CONTORNO; x.fillRect(bx + 82 + k * 9 - 1, yy - 1, 8, 8); x.fillStyle = k < L.stats[i] ? ['#e8303a', '#2f8ad0', '#3a9a4a', '#a05ad0'][i] : '#2a2034'; x.fillRect(bx + 82 + k * 9, yy, 6, 6); } });
      texto(x, 'ESP: ' + L.s1.nombre, ix, iy + 86, '#ffffff', 1, 'centro'); texto(x, 'SÚPER: ' + L.ult.nombre, ix, iy + 97, '#5ad8ff', 1, 'centro');
      if (conf) texto(x, '"' + L.frases[0] + '"', ix, iy + 110, '#ffd23a', 1, 'centro'); }
    this.boton(x, this.zVolver(), 'VOLVER', false); this.boton(x, this.zElegir(), 'ELEGIR', true); texto(x, E_TACTIL() ? 'TOCÁ LA FICHA: BIO' : 'ESP: VER BIO', W / 2, H - 14, '#7a6a8a', 1, 'centro'); }
  dibujarTorres(x, W, H) { this.titulo(x, 'PLENA MORTAL · TORRES', W, 8);
    TORRES.forEach((T, i) => { const r = this.zTorre(i), ab = torreAbierta(i), sel = this.sel === i; this.panel(x, r[0], r[1], r[2], r[3], ab ? T.c : '#4a3a5a'); const cx = r[0] + r[2] / 2;
      // torre dibujada: pisos apilados
      const ph = Math.min(10, Math.floor((r[3] - 90) / T.pisos)); for (let k = 0; k < T.pisos; k++) { const w = Math.round(r[2] * 0.5 - k * 2), y = r[1] + r[3] - 46 - (k + 1) * ph; x.fillStyle = ab ? (k === T.pisos - 1 ? T.c : '#5a4a6a') : '#2a2034'; x.fillRect(Math.round(cx - w / 2), y, w, ph - 2); x.fillStyle = 'rgba(255,240,180,0.5)'; if (ab) for (let q = 0; q < 3; q++) x.fillRect(Math.round(cx - w / 2 + 4 + q * (w - 10) / 2), y + 2, 2, 2); }
      texto(x, T.nombre.replace('TORRE ', ''), cx, r[1] + 8, ab ? '#ffffff' : '#7a6a8a', 1, 'centro'); texto(x, T.dif, cx, r[1] + 20, ab ? T.c : '#5a4a6a', 1, 'centro');
      const rec = PP().torres[T.id]; texto(x, ab ? T.pisos + ' PISOS' : 'BLOQUEADA', cx, r[1] + r[3] - 38, '#c8b8d8', 1, 'centro'); if (rec && rec.hechas) texto(x, '* x' + rec.hechas, cx, r[1] + r[3] - 26, '#ffd23a', 1, 'centro'); else texto(x, '$U ' + T.final, cx, r[1] + r[3] - 26, '#7aff7a', 1, 'centro');
      if (sel) { x.fillStyle = (this.t * 6 | 0) % 2 ? '#ffffff' : T.c; x.fillRect(r[0] - 4, r[1] - 4, r[2] + 8, 2); x.fillRect(r[0] - 4, r[1] + r[3] + 2, r[2] + 8, 2); } });
    this.boton(x, this.zVolver(), 'VOLVER', false); }
  dibujarTorre(x, W, H) { const T = this.torre; this.titulo(x, T.def.nombre, W, 6, T.def.c); const n = T.pisos.length; const rh = Math.min(19, Math.floor((H - 70) / n)); const x0 = Math.round(W / 2 - 150);
    for (let i = 0; i < n; i++) { const p = T.pisos[i], y = H - 36 - (i + 1) * rh; const L = POR_ID[p.id]; const hecho = i < T.piso, act = i === T.piso; x.fillStyle = act ? 'rgba(255,210,58,0.25)' : hecho ? 'rgba(90,200,90,0.15)' : 'rgba(30,18,44,0.85)'; x.fillRect(x0, y, 300, rh - 2);
      if (act) { x.fillStyle = T.def.c; x.fillRect(x0, y, 3, rh - 2); }
      texto(x, String(i + 1).padStart(2, '0'), x0 + 8, y + (rh - 10) / 2, '#8a7a9a', 1); const s = rh - 4; const ver = i <= T.piso || !p.jefe; if (ver) x.drawImage(retratoDe(p.id, 30), x0 + 32, y + 1, s, s); else { x.fillStyle = '#120a1c'; x.fillRect(x0 + 32, y + 1, s, s); texto(x, '?', x0 + 32 + s / 2, y + 3, '#ff5a3a', 1, 'centro'); }
      texto(x, ver ? L.nombre.replace(/^(EL|LA) /, '') : '???', x0 + 38 + s, y + (rh - 10) / 2, hecho ? '#7aff7a' : '#ffffff', 1); const tag = p.tipo || (p.mod ? p.mod.t : DIFS[p.dif - 1]); texto(x, hecho ? 'OK' : tag, x0 + 294, y + (rh - 10) / 2, p.jefe ? '#ff5a3a' : p.mod ? '#e8a020' : '#8a7a9a', 1, 'der'); }
    texto(x, '$U GANADOS: ' + T.plata, W - 8, H - 26, '#7aff7a', 1, 'der'); if ((this.t * 2 | 0) % 2) texto(x, E_TACTIL() ? 'TOCÁ PARA PELEAR' : OK_TXT() + ': A PELEAR', W / 2, H - 14, '#ffd23a', 1, 'centro'); this.boton(x, this.zVolver(), 'VOLVER', false);
    // el jugador al pie de la torre
    const sp = setLuchador(POR_ID[this.p1]); dibujarCuadro(x, cuadroListo(sp, 'quieto', Math.floor(this.t * 5) % 4), Math.round(x0 - 44), H - 30, 1); }
  dibujarCfg(x, W, H) { this.titulo(x, 'PLENA MORTAL · LIBRE', W, 10); const c = this.cfgL; const ops = ['DIFICULTAD: < ' + DIFS[c.dif] + ' >', 'ESCENARIO: < ' + (c.esc === 0 ? 'AL AZAR' : ESCENARIOS[IDS_ESC[c.esc - 1]].nombre) + ' >', '¡A PELEAR!'];
    ops.forEach((s, i) => this.boton(x, this.zLista(i, 3), s, this.sel === i)); const a = POR_ID[this.p1], b = POR_ID[this.p2]; texto(x, a.nombre + '  VS  ' + b.nombre, W / 2, 34, '#ffffff', 1, 'centro'); this.boton(x, this.zVolver(), 'VOLVER', false); }
  dibujarInfinito(x, W, H) { this.titulo(x, 'MODO INFINITO', W, 10); const ops = ['OLEADAS (BEAT \'EM UP)', 'SUPERVIVENCIA PLENA MORTAL', 'VOLVER']; ops.forEach((s, i) => this.boton(x, this.zLista(i, 3), s, this.sel === i)); const r = PP().infinito;
    texto(x, 'RÉCORD OLEADAS: ' + (r.ola || 0) + '   ·   RÉCORD SUPERVIVENCIA: ' + (r.superv || 0), W / 2, H - 30, '#ffd23a', 1, 'centro'); texto(x, this.sel === 0 ? 'OLEADAS SIN FIN · JEFE CADA 5 · NOMBRES DEL BARRIO' : this.sel === 1 ? 'UNA RONDA POR RIVAL · LA VIDA NO SE RECUPERA DEL TODO' : '', W / 2, H - 16, '#c8b8d8', 1, 'centro'); }
  dibujarRecords(x, W, H) { this.titulo(x, 'RÉCORDS', W, 6); const p = PP(); const lx = Math.round(W / 2 - 200);
    const l = [['PELEAS GANADAS', p.ganadas], ['PELEAS PERDIDAS', p.perdidas], ['COMBO MÁXIMO', p.maxCombo], ['DEFINITIVOS', p.ults], ['IMPECABLES', p.perfectos], ['LUCHADORES ABIERTOS', LUCHADORES.filter((L) => desbloqueado(L.id)).length + '/30'], ['RÉCORD OLEADAS', p.infinito.ola || 0], ['RÉCORD SUPERVIVENCIA', p.infinito.superv || 0]];
    TORRES.forEach((T) => { const r = p.torres[T.id]; l.push([T.nombre.replace('TORRE ', 'T. '), r && r.hechas ? r.hechas + ' VECES · ' + Math.floor(r.mejor / 60) + ':' + String(r.mejor % 60).padStart(2, '0') : '-']); });
    l.forEach(([a, b], i) => { texto(x, a, lx, 30 + i * 12, '#c8b8d8', 1); texto(x, String(b), lx + 190, 30 + i * 12, '#ffffff', 1, 'der'); });
    const rx = lx + 210; texto(x, 'LUCHADOR      G   P  COMBO', rx, 30, '#ffd23a', 1); const rows = Math.floor((H - 70) / 11); const lista = LUCHADORES.slice(this.sel, this.sel + rows);
    lista.forEach((L, i) => { const s = p.porPj[L.id] || { g: 0, p: 0, combo: 0 }; const ab = desbloqueado(L.id); texto(x, (ab ? L.nombre.replace(/^(EL|LA) /, '') : '???').slice(0, 12).padEnd(12) + String(s.g).padStart(4) + String(s.p).padStart(4) + String(s.combo).padStart(6), rx, 42 + i * 11, ab ? '#ffffff' : '#6a5a7a', 1); });
    this.boton(x, this.zVolver(), 'VOLVER', false); texto(x, 'ARRIBA/ABAJO: MÁS', W / 2, H - 14, '#7a6a8a', 1, 'centro'); }
  dibujarRes(x, W, H) { const r = this.res, g = r.gana === 1; this.panel(x, W / 2 - 160, 16, 320, H - 32, g ? '#7aff7a' : '#ff5a3a');
    texto(x, g ? '¡GANASTE!' : 'PERDISTE', W / 2, 26, g ? '#7aff7a' : '#ff5a3a', 3, 'centro', CONTORNO, g ? '#1a5a1a' : '#5a0a0a');
    const a = this.pelea.F[0], b = this.pelea.F[1]; const gw = g ? a : b; dibujarCuadro(x, cuadroListo(gw.sp, 'gana', Math.floor(this.t * 3) % 2), Math.round(W / 2 - 110), 142, 1);
    const st = r.stats; const l = [['RONDAS', r.rondas[0] + ' - ' + r.rondas[1]], ['COMBO MÁXIMO', st.maxCombo], ['GOLPES', st.golpes], ['DEFINITIVOS', st.ults], ['IMPECABLES', st.perfectos], ['$U', '+' + (this.plata || 0)]];
    l.forEach(([k, v], i) => { texto(x, k, W / 2 - 50, 60 + i * 12, '#c8b8d8', 1); texto(x, String(v), W / 2 + 140, 60 + i * 12, '#ffffff', 1, 'der'); });
    if (this.cfgPelea.modo === 'superv') texto(x, 'RIVALES VENCIDOS: ' + this.superv.ganadas, W / 2 + 40, 136, '#ffd23a', 1, 'centro');
    if (this.nuevos && this.nuevos.length) texto(x, '¡NUEVO LUCHADOR: ' + this.nuevos.map((n) => n.nombre).join(', ') + '!', W / 2, 150, (this.t * 4 | 0) % 2 ? '#ffd23a' : '#ffffff', 1, 'centro');
    if (this.t > 0.8) this.opsRes().forEach((o, i) => this.boton(x, this.zRes(i), o[0], this.sel === i)); }
  dibujarCampFin(x, W, H) { const g = this.res.gana === 1; this.pelea.dibujar(x, 1, W, H); x.fillStyle = 'rgba(14,8,26,0.5)'; x.fillRect(0, 0, W, H);
    texto(x, g ? '¡JEFE DERROTADO!' : '¡TE DIERON VUELTA!', W / 2, 40, g ? '#7aff7a' : '#ff5a3a', 2, 'centro', CONTORNO);
    if (!g) texto(x, 'PODÉS PEDIR REVANCHA O PELEARLO A LA ANTIGUA', W / 2, 64, '#ffffff', 1, 'centro'); if (this.t > 1) (g ? [['SEGUIR']] : [['REVANCHA'], ['PELEAR A LA ANTIGUA']]).forEach((o, i) => this.boton(x, this.zRes(i), o[0], this.sel === i)); }
  dibujarTorreFin(x, W, H) { const T = this.torre; this.panel(x, W / 2 - 170, 20, 340, H - 40, T.def.c); texto(x, '¡' + T.def.nombre + ' COMPLETA!', W / 2, 30, '#ffd23a', 1, 'centro'); texto(x, '¡CAMPEÓN!', W / 2, 46, '#ffffff', 3, 'centro', CONTORNO, '#8a3a10');
    const sp = setLuchador(POR_ID[this.p1]); dibujarCuadro(x, cuadroListo(sp, 'gana', Math.floor(this.t * 3) % 2), W / 2, 176, 1);
    texto(x, 'PREMIO: $U ' + T.def.final + ' + $U ' + T.plata + ' DE LOS PISOS', W / 2, 186, '#7aff7a', 1, 'centro'); texto(x, 'TIEMPO: ' + Math.floor(this.tiempoT / 60) + ':' + String(Math.floor(this.tiempoT % 60)).padStart(2, '0'), W / 2, 198, '#ffffff', 1, 'centro');
    if (this.nuevosT && this.nuevosT.length) texto(x, '¡DESBLOQUEADO: ' + this.nuevosT.map((n) => n.nombre).join(', ') + '!', W / 2, 212, (this.t * 4 | 0) % 2 ? '#ffd23a' : '#ffffff', 1, 'centro');
    if (this.t > 1.2 && (this.t * 2 | 0) % 2) texto(x, E_TACTIL() ? 'TOCÁ PARA SEGUIR' : OK_TXT() + ' PARA SEGUIR', W / 2, H - 34, '#ffd23a', 1, 'centro'); }
  dibujarPausa(x, W, H) { x.fillStyle = 'rgba(14,8,26,0.6)'; x.fillRect(0, 0, W, H); this.titulo(x, 'PAUSA', W, Math.round(H / 2 - 80)); const ops = this.opsPausa();
    ops.forEach((s, i) => this.boton(x, this.zLista(i, 4), s, this.pausa.sel === i));
    texto(x, 'LEVE · FUERTE · ESP (→/← + ESP) · SÚPER (O)', W / 2, Math.round(H / 2 + 50), '#9a8aa8', 1, 'centro'); texto(x, 'AGARRE: LEVE+FUERTE · ↓→ / ↓← + GOLPE', W / 2, Math.round(H / 2 + 62), '#9a8aa8', 1, 'centro');
    if (this.pausa.ctrl && this.api.dibujarControles) this.api.dibujarControles(x, W, H); }
}
// la torre completa vuelve a la lista de torres con un toque
Arcade.prototype.pasoTorreFin = function (I) { if (this.t > 1.2 && (I.ok || I.tap)) { sonar('ui.ok'); this.ir('torres', { sel: this.torreSel }); musica('mus.menu'); } };
const _paso = Arcade.prototype.paso; Arcade.prototype.paso = function (dt, I) { if (this.vista === 'torreFin') { this.t += dt; return this.pasoTorreFin(I); } if (this.vista === 'infFin') { this.t += dt; if (this.fondo) this.fondo.paso(dt); return this.pasoInfFin(I); } return _paso.call(this, dt, I); };
function E_TACTIL() { return !usaPad() && document.body.classList.contains('tactil'); }
const OK_TXT = () => usaPad() ? nomBoton('ok') : 'PIÑA';
const negras = new WeakMap(); function siluetaNegra(f) { let r = negras.get(f); if (r) return r; const [cv, x] = lienzo(f.d.width, f.d.height); x.drawImage(f.d, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = '#0e0818'; x.fillRect(0, 0, cv.width, cv.height); r = { d: cv, q: f.q, pies: f.pies, parche: null }; negras.set(f, r); return r; }
void generar; void DT;
