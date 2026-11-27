// MOTOR DE PELEA 1 vs 1 (vista lateral): rondas al mejor de 3, reloj, barras, súper, combos con cancelaciones y juggles,
// escalado de daño, bloqueo alto/bajo, contragolpes, agarres, especiales, firma, definitivos con escena propia, hitstop,
// temblor/zoom de cámara. Hitboxes y hurtboxes salen del MISMO esqueleto que dibuja el sprite (articulaciones()), cuadro a cuadro.
import { generar, dibujarCuadro, cuadroListo, siluetaBlanca, articulaciones, partida, DEFS } from '../sprites.js';
import { FX } from '../fx.js';
import { GORE } from '../sangre.js';
import { sonar, musica } from '../audio.js';
import { texto, CONTORNO } from '../pixel.js';
import { ALTO } from '../escenario.js';
import { posesDe, TPL } from './poses-pelea.js';
import { POR_ID, numeros } from './luchadores.js';
import { Escenario, ANCHO, SUELO } from './escenarios.js';
import { dibujarObjeto } from './objetos.js';
import { crearUlt, superflash, precargarGente } from './ultimates.js';
import { IA } from './ia-pelea.js';

const GRAV = 1150, K_DMG = 9, RELOJ = 99;
const RANGO = { l: 1, lc: 1, la: 1, h: 2, hc: 2, ha: 2, firma: 2.5, agarre: 2.6, s1: 3, s2: 3, ult: 4 };
const NEUTRO = new Set(['quieto', 'camina', 'corre', 'agacha', 'bloqP', 'bloqAgP']);
const cachePoses = new Map();
export function posesLuchador(L) { let p = cachePoses.get(L.id); if (!p) { p = posesDe(L); cachePoses.set(L.id, p); } return p; }
export function setLuchador(L, ropa = null) { return generar(L.cuerpo, 0, ropa, false, posesLuchador(L), L.id); }

// movimiento = plantilla (frame data por defecto) + lo propio del luchador
function partir(s, n) { const out = []; let l = ''; for (const w of s.split(' ')) { if ((l + ' ' + w).trim().length > n && l) { out.push(l); l = w; } else l = (l + ' ' + w).trim(); } if (l) out.push(l); return out; }
function armarMov(L, k) {
  let tplN, o = {};
  if (k === 's1' || k === 's2') { o = Object.assign({}, L[k]); tplN = o.tpl; }
  else if (k === 'firma') { tplN = L.golpes.firma; o = Object.assign({ nombre: 'FIRMA' }, L.firma); }
  else if (k === 'ult') { tplN = L.golpes.ult; o = Object.assign({}, L.ult, { dmg: 0, tipo: 'ult' }); }
  else { const g = L.golpes[k]; if (Array.isArray(g)) { tplN = g[0]; o = g[1]; } else tplN = g; }
  const T = TPL[tplN]; const M = Object.assign({}, T, o, { k, anim: 'm_' + k, tpl: tplN }); delete M.poses;
  if (k === 'ult') M.dmg = 0; else M.dmg = (o.dmg != null ? o.dmg : T.dmg) * K_DMG;
  if (M.tipo === 'golpe' && M.multi && o.dmg != null) M.dmg = o.dmg * K_DMG;
  M.hs = M.hs || 0.17 + Math.min(0.3, M.dmg * 0.0016); M.bs = M.bs || 0.1 + Math.min(0.16, M.dmg * 0.0008); M.kb = M.kb || 60 + M.dmg * 0.55;
  if (M.tipo === 'salto' && !M.act) M.act = 0.6; M.especial = k === 's1' || k === 's2' || k === 'ult';
  return M;
}

export class Luchador {
  constructor(L, lado, op = {}) {
    this.L = L; this.lado = lado; this.N = numeros(L); this.op = null; this.cpu = !!op.cpu; this.dif = op.dif || 2;
    this.sp = setLuchador(L, op.ropa || null); this.def = this.sp.def; this.esc = this.def.escala; this.anchoC = 11 * this.esc * Math.min(1.5, this.def.ancho || 1);
    this.hpMax = Math.round(this.N.hp * (op.hpMul || 1)); this.dmgMul = op.dmgMul || 1; this.jefe = !!op.jefe;
    this.movs = {}; for (const k of ['l', 'h', 'lc', 'hc', 'la', 'ha', 'firma', 's1', 's2', 'ult']) this.movs[k] = armarMov(L, k);
    this.movs.agarre = { k: 'agarre', anim: 'agarra', limb: 'mF', r: 10, ini: 0.06, act: 0.06, rec: 0.3, dmg: 0, tipo: 'agarreN' };
    this.ia = this.cpu ? new IA(this, this.dif) : null; this.rondas = 0; this.super = 0; this.reset(lado);
  }
  reset(lado) {
    this.x = ANCHO / 2 + (lado === 1 ? -70 : 70); this.z = 0; this.vx = 0; this.vz = 0; this.cara = lado === 1 ? 1 : -1; this.hp = this.hpMax; this.hpRojo = this.hpMax;
    this.est = 'quieto'; this.t = 0; this.atq = null; this.stun = 0; this.invul = 0; this.blink = 0; this.comboN = 0; this.juggle = 0; this.cadena = []; this.ko = false;
    this.armadura = 0; this.buffT = 0; this.mareo = 0; this.aturde = 0; this.px = this.x; this.pz = 0; this.hist = []; this.dirAnt = 5; this.aereo = false; this.agarrado = null; this.sub = 0;
    this.inp = { dx: 0, dy: 0, l: 0, h: 0, s: 0, u: 0, g: 0, j: 0 }; this.guardia = false; this.tFase = ''; this.anim = 'quieto'; this.fr = 0;
  }
  get enSuelo() { return this.z <= 0.01; }
  fase() { const a = this.atq; if (!a) return ''; const t = this.t; if (t < a.ini) return 'ini'; if (a.tipo === 'salto' ? !this.aterrizo : t < a.ini + a.act) return 'act'; return t < a.ini + a.act + a.rec + (this.whiff || 0) ? 'rec' : 'fin'; }
}

export class Pelea {
  // cfg: { p1: {id, cpu, dif, ropa}, p2: {id, cpu, dif, hpMul, dmgMul, jefe}, escenario, rondas (para ganar), modo, mods, dios, titulo, sinIntro }
  constructor(cfg) {
    this.cfg = cfg; this.modo = cfg.modo || 'libre'; this.mods = cfg.mods || {};
    const L1 = POR_ID[cfg.p1.id], L2 = POR_ID[cfg.p2.id];
    this.F = [new Luchador(L1, 1, cfg.p1), new Luchador(L2, 2, cfg.p2)]; this.F[0].op = this.F[1]; this.F[1].op = this.F[0];
    if (this.mods.gigante) { this.F[1].hpMax = Math.round(this.F[1].hpMax * 1.5); }
    this.esc = new Escenario(cfg.escenario || 'cuadra'); this.fx = new FX(); this.proy = []; this.trampas = []; this.anuncios = [];
    this.ganar = cfg.rondas || 2; this.ronda = 0; this.reloj = RELOJ; this.hitstop = 0; this.temblor = 0; this.zoom = 1; this.zoomT = 0; this.lento = 0; this.flash = null; this.ult = null; this.t = 0;
    this.cam = ANCHO / 2; this.camPrev = this.cam; this.estado = 'intro'; this.tE = 0; this.resultado = null; this.dios = !!cfg.dios;
    this.stats = { golpes: 0, maxCombo: 0, ults: 0, perfectos: 0, rondasG: 0, rondasP: 0, danio: 0 };
    partida([this.F[0].sp, this.F[1].sp, ...this.esc.publico.map((p) => p.sp)]); precargarGente(this, this.F.map((f) => f.L.ult.escena));
    if (cfg.sinIntro) this.empezarRonda(); else { for (const f of this.F) { f.est = 'intro'; f.t = 0; } }
    musica(cfg.musica || (this.F[1].jefe ? 'mus.pelea.jefe' : 'mus.pelea'));
  }
  anunciar(s, c = '#ffd23a', dur = 1.2, esc = 3, y = 0.38) { this.anuncios.push({ s, c, t: 0, dur, esc, y }); }
  empezarRonda() {
    this.ronda++; this.reloj = RELOJ; this.proy.length = 0; this.trampas.length = 0; for (const f of this.F) { const r = f.rondas, s = f.super; f.reset(f.lado); f.rondas = r; f.super = this.mods.superLleno ? 100 : s; }
    if (this.ronda === 1 && this.cfg.p1.hpIni) this.F[0].hp = this.F[0].hpRojo = Math.round(this.cfg.p1.hpIni);
    this.cam = ANCHO / 2; this.camPrev = this.cam; this.estado = 'ronda'; this.tE = 0; this.lento = 0; this.zoom = 1; this.koQuien = null;
    const fin = this.F[0].rondas === this.ganar - 1 && this.F[1].rondas === this.ganar - 1;
    this.anunciar(fin ? 'RONDA FINAL' : 'RONDA ' + this.ronda, '#ffffff', 1.1, 3); sonar(fin ? 'pelea.ronda.final' : 'pelea.ronda');
  }
  // ---------------------------------------------------------------- entradas
  leer(f, E) {
    const I = f.inp; I.l = I.h = I.s = I.u = I.g = I.j = 0;
    if (f.cpu) { f.ia.decidir(this, I); return; }
    I.dx = E.dx; I.dy = E.dy; const b = E.buf;
    if (b.pina > 0 && b.patada > 0) { I.g = 1; }
    else { if (b.pina > 0) I.l = 1; if (b.patada > 0) I.h = 1; }
    if (b.especial > 0) I.s = 1; if (b.super > 0) I.u = 1; if (b.salto > 0) I.j = 1;
  }
  consumir(f, E, k) { if (f.cpu) return; const m = { l: 'pina', h: 'patada', s: 'especial', u: 'super', j: 'salto' }; if (k === 'g') { E.buf.pina = 0; E.buf.patada = 0; } else E.buf[m[k]] = 0; }
  // dirección en notación numérica relativa a la cara (6 = adelante)
  dirNum(f) { const I = f.inp; const fx = Math.abs(I.dx) > 0.5 ? Math.sign(I.dx) * f.cara : 0, fy = I.dy > 0.5 ? -1 : I.dy < -0.5 ? 1 : 0; return 5 + fx + fy * 3; }
  movimiento(f, sec) { // ¿hizo el movimiento (236 / 214) en los últimos 0,45 s?
    const h = f.hist; let i = sec.length - 1; for (let j = h.length - 1; j >= 0 && i >= 0; j--) { if (this.t - h[j][1] > 0.45) break; if (h[j][0] === sec[i]) i--; } return i < 0; }
  // ---------------------------------------------------------------- paso
  paso(dt, E) {
    this.t += dt; this.tE += dt; this.fx.paso(dt); this.esc.paso(dt);
    for (const a of this.anuncios) a.t += dt; this.anuncios = this.anuncios.filter((a) => a.t < a.dur);
    if (this.temblor > 0) this.temblor -= dt; if (this.zoomT > 0) { this.zoomT -= dt; if (this.zoomT <= 0) this.zoomObj = 1; }
    this.zoom += ((this.zoomObj || 1) - this.zoom) * Math.min(1, dt * 10);
    for (const f of this.F) { f.px = f.x; f.pz = f.z; if (f.hpRojo > f.hp) f.hpRojo = Math.max(f.hp, f.hpRojo - (f.stun > 0 || f.est === 'vuela' ? 0 : 420 * dt)); }
    this.camPrev = this.cam;
    if (this.estado === 'intro') { for (const f of this.F) f.t += dt; if (this.tE > 2.6 || (E && (E.buf.ok > 0 || E.taps.length) && this.tE > 0.4)) { if (E) { E.buf.ok = 0; E.buf.pina = 0; } this.empezarRonda(); } return; }
    if (this.estado === 'ronda') { for (const f of this.F) { f.t += dt; this.animar(f); } if (this.tE > 1.1 && !this._peleen) { this._peleen = true; this.anunciar(this.F[1].jefe && this.ronda === 1 ? '¡A LAS PIÑAS!' : '¡PELEEN!', '#ff5a3a', 0.9, 4); sonar('pelea.peleen'); }
      if (this.tE > 1.6) { this.estado = 'pelea'; this.tE = 0; this._peleen = false; } return; }
    if (this.flash) { this.flash.t += dt; if (this.flash.t >= this.flash.dur) { const fl = this.flash; this.flash = null; fl.fin(); } return; }
    if (this.ult) { this.ult.paso(dt); for (const f of this.F) { if (f.blink > 0) f.blink -= dt; this.animar(f); } if (this.ult.listo) { const u = this.ult; this.ult = null; this.finUlt(u); } return; }
    if (this.hitstop > 0) { this.hitstop -= dt; return; }
    if (this.lento > 0) { this.lento -= dt; dt *= 0.35; }
    if (this.estado === 'pelea' && !this.mods.sinReloj) { this.reloj -= dt; if (this.reloj <= 0) { this.reloj = 0; this.tiempoFuera(); } }
    for (const f of this.F) { if (this.estado === 'pelea') this.leer(f, E); else { const I = f.inp; I.dx = I.dy = I.l = I.h = I.s = I.u = I.g = I.j = 0; } }
    for (const f of this.F) { const d = this.dirNum(f); if (d !== f.dirAnt) { f.hist.push([d, this.t]); if (f.hist.length > 12) f.hist.shift(); f.dirAnt = d; } }
    for (const f of this.F) this.actualizar(f, dt, E);
    for (const f of this.F) this.fisica(f, dt);
    this.empujar(); for (const f of this.F) this.golpes(f);
    this.pasoProy(dt); this.pasoTrampas(dt);
    for (const f of this.F) this.animar(f);
    this.camara(dt);
    if (this.estado === 'ko') this.pasoKO(dt);
    else if (this.estado === 'finRonda') { if (this.tE > 2.2) this.terminarRonda(); }
  }
  // ---------------------------------------------------------------- estados del luchador
  puedeActuar(f) { return NEUTRO.has(f.est) || (f.est === 'salto' && !f.aereo); }
  actualizar(f, dt, E) {
    f.t += dt; if (f.invul > 0) f.invul -= dt; if (f.blink > 0) f.blink -= dt; if (f.buffT > 0) { f.buffT -= dt; if (f.buffT <= 0) f.armadura = 0; }
    if (this.mods.dobleSuper && f.super < 100) f.super = Math.min(100, f.super + dt * 3);
    const I = f.inp, op = f.op, haciaOp = Math.sign(op.x - f.x) || f.cara;
    if (f.est === 'intro' || f.est === 'gana' || f.est === 'pierde') return;
    if (f.ko) { if (f.est === 'piso') return; }
    // en el suelo y neutral: mira al rival
    if (f.enSuelo && (NEUTRO.has(f.est) || f.est === 'levanta')) f.cara = haciaOp;
    // estados de castigo
    if (f.est === 'dolor' || f.est === 'dolorAg' || f.est === 'bloq' || f.est === 'bloqAg') { f.stun -= dt; f.vx *= Math.pow(0.0008, dt);
      // contraataque de guardia (cuesta 50 de súper): especial + adelante durante el bloqueo
      if ((f.est === 'bloq' || f.est === 'bloqAg') && I.s && f.super >= 50 && I.dx * f.cara > 0.5) { this.consumir(f, E, 's'); f.super -= 50; this.contraGuardia(f); return; }
      if (f.stun <= 0) { f.est = 'quieto'; f.t = 0; } else return; }
    if (f.est === 'piso') { f.vx *= Math.pow(0.001, dt); if (f.t > (f.ko ? 99 : 0.55)) { f.est = 'levanta'; f.t = 0; f.invul = 0.45; sonar('pelea.levanta'); } return; }
    if (f.est === 'levanta') { if (f.t > 0.36) { f.est = 'quieto'; f.t = 0; f.invul = 0.12; } return; }
    if (f.est === 'vuela') return;
    if (f.est === 'agarrado') return;
    if (f.est === 'agarra') { this.pasoAgarre(f, dt, E); return; }
    if (f.est === 'lanza') { if (f.t > 0.32) { f.est = 'quieto'; f.t = 0; } return; }
    if (f.est === 'atras') { if (f.t > 0.26) { f.est = 'quieto'; f.t = 0; f.vx = 0; } return; }
    if (f.est === 'ultAct') return;
    if (f.est === 'tele') { if (f.t > 0.22) { f.x = Math.max(24, Math.min(ANCHO - 24, op.x + haciaOp * 34)); f.cara = -haciaOp; this.fx.humo(f.x, SUELO, 20, 6); f.est = 'ataque'; f.t = 0; } return; }
    if (f.aturde > 0) { f.aturde -= dt; if (f.aturde > 0) { f.vx = 0; return; } }
    // ataque en curso
    if (f.est === 'ataque') { this.pasoAtaque(f, dt, E); if (f.est === 'ataque') { this.cancelar(f, E); return; } }
    if (!this.puedeActuar(f)) return;
    // ---- decisiones desde neutral
    if (this.intentarAtaque(f, E)) return;
    if (f.est === 'salto') return;
    // salto / agacharse / caminar / correr / bloqueo de cercanía
    const atrasO = I.dx * haciaOp < -0.5, adelante = I.dx * haciaOp > 0.5;
    if ((I.dy < -0.6 || I.j) && f.enSuelo) { this.consumir(f, E, 'j'); f.est = 'salto'; f.t = 0; f.aereo = false; f.vz = this.N(f).salto; f.vx = (Math.abs(I.dx) > 0.4 ? Math.sign(I.dx) : 0) * this.N(f).vel * 1.35; f.z = 0.5; sonar('pelea.salto'); return; }
    const amenaza = op.est === 'ataque' && Math.abs(op.x - f.x) < 140 || this.proy.some((p) => p.de === op && Math.abs(p.x - f.x) < 110);
    if (I.dy > 0.6) { f.est = atrasO && amenaza ? 'bloqAgP' : 'agacha'; f.vx = 0; return; }
    if (atrasO && amenaza) { f.est = 'bloqP'; f.vx = 0; return; }
    const corre = !f.cpu && E && E.corre && Math.sign(E.corre) === haciaOp || (f.cpu && f.ia.corre);
    const atrasDash = !f.cpu && E && E.corre && Math.sign(E.corre) === -haciaOp && f.est !== 'corre' || (f.cpu && f.ia.dashAtras);
    if (atrasDash && f.est !== 'atras' && f._dashOk !== false) { f.est = 'atras'; f.t = 0; f.vx = -haciaOp * 260; f.invul = 0.1; f._dashOk = false; if (f.cpu) f.ia.dashAtras = false; sonar('pelea.dash'); return; }
    if (!(E && E.corre) && !f.cpu) f._dashOk = true; if (f.cpu && !f.ia.dashAtras) f._dashOk = true;
    if (corre && adelante) { f.est = 'corre'; f.vx = haciaOp * this.N(f).corre; return; }
    if (Math.abs(I.dx) > 0.4) { f.est = 'camina'; f.vx = Math.sign(I.dx) * this.N(f).vel * (atrasO ? 0.8 : 1); return; }
    f.est = 'quieto'; f.vx = 0;
  }
  N(f) { return f.N; }
  // elige el movimiento según botones y dirección; devuelve true si empezó algo
  elegir(f) {
    const I = f.inp; const haciaOp = Math.sign(f.op.x - f.x) || f.cara; const aire = !f.enSuelo || f.est === 'salto';
    if (I.u && f.super >= 100 && !aire) return 'ult';
    if (I.s && !aire) { const d = this.dirNum(f); return d === 4 || d === 1 || d === 2 ? 's2' : 's1'; }
    if ((I.l || I.h) && !aire && this.movimiento(f, [2, 3, 6])) return 's1';
    if ((I.l || I.h) && !aire && this.movimiento(f, [2, 1, 4])) return 's2';
    const dist = Math.abs(f.op.x - f.x) - f.anchoC - f.op.anchoC;
    if (!aire && (I.g || (I.h && I.dx * haciaOp > 0.5 && dist < 16))) return 'agarre';
    if (aire) { if (f.aereo) return null; return I.l ? 'la' : I.h ? 'ha' : null; }
    const ag = I.dy > 0.6; const b = I.l ? 'l' : I.h ? 'h' : null; if (!b) return null;
    if (ag) return b + 'c';
    const sq = f.L.firma && f.L.firma.seq; if (sq && f.cadena.length >= sq.length - 1) { const n = sq.length - 1; const ult = f.cadena.slice(-n); if (ult.join() === sq.slice(0, n).join() && b === sq[n]) return 'firma'; }
    return b;
  }
  usarBoton(f, E, k) { const I = f.inp; if (k === 'ult') this.consumir(f, E, 'u'); else if (k === 's1' || k === 's2') { if (I.s) this.consumir(f, E, 's'); else { if (I.l) this.consumir(f, E, 'l'); if (I.h) this.consumir(f, E, 'h'); } } else if (k === 'agarre') { if (I.g) this.consumir(f, E, 'g'); else this.consumir(f, E, 'h'); } else { if (I.l) this.consumir(f, E, 'l'); else this.consumir(f, E, 'h'); } }
  intentarAtaque(f, E) { const k = this.elegir(f); if (!k) return false; this.usarBoton(f, E, k); if (k === 'ult') { this.iniciarUlt(f); return true; } this.iniciarMov(f, k); return true; }
  cancelar(f, E) { // cancelación de un golpe que conectó en otro de rango mayor (o cadena de leves)
    const a = f.atq; if (!a || !f.conecto) return; const fs = f.fase(); if (fs !== 'act' && fs !== 'rec') return; if (a.tipo === 'salto') return;
    const k = this.elegir(f); if (!k) return; const r0 = RANGO[a.k], r1 = RANGO[k];
    const ok = r1 > r0 || (a.k === 'l' && k === 'l' && f.cadena.length < 3 && fs === 'rec') || (k === 'firma');
    if (!ok || (r0 >= 3 && r1 < 4)) return; if (k === 'agarre') return;
    this.usarBoton(f, E, k); if (k === 'ult') { if (f.super >= 100) this.iniciarUlt(f); return; } this.iniciarMov(f, k, true);
  }
  iniciarMov(f, k, cancel = false) {
    const M = f.movs[k]; f.est = 'ataque'; f.atq = M; f.t = 0; f.conecto = false; f.hits = 0; f.sub = 0; f.aterrizo = false; f.whiff = 0; f.yaEfecto = false;
    if (!cancel) f.cadena = f.op.comboN > 0 ? f.cadena : [];
    if (k === 'la' || k === 'ha') f.aereo = true; else if (f.enSuelo) f.vx = 0;
    if (M.invul) f.invul = M.invul; if (M.especial || k === 'firma') { this.fx.flotante(f.x, SUELO, 120 * f.esc, M.nombre || '', f.L.color || '#ffd23a'); sonar(k === 'firma' ? 'pelea.firma' : 'pelea.especial'); } else sonar(M.dmg >= 70 ? 'pelea.aire.fuerte' : 'pelea.aire');
    if (M.tipo === 'tele') { f.est = 'tele'; f.t = 0; f.invul = 0.5; this.fx.humo(f.x, SUELO, 20, 6); sonar('pelea.tele'); }
    if (M.tipo === 'salto') { f.vz = M.vz; f.vx = f.cara * M.vx; f.z = 0.5; }
    if (k === 'firma') this.fx.aro(f.x, SUELO);
  }
  pasoAtaque(f, dt, E) {
    const a = f.atq, fs = f.fase(), op = f.op;
    if (fs === 'act') {
      if (a.dash && f.enSuelo) f.vx = f.cara * a.dash; if (a.sube && !f._subio) { f._subio = true; f.vz = a.sube; f.z = 0.5; }
      if (!f.yaEfecto) { f.yaEfecto = true; this.efecto(f, a); }
      // golpe aéreo normal: queda activo hasta caer (o conectar), como un salto con golpe de arcade
      if (a.aereo && a.k !== 's1' && a.k !== 's2' && !f.enSuelo && !f.hits && f.t > a.ini + a.act - dt * 1.5) f.t = a.ini + a.act - dt * 1.5;
    } else if (fs === 'rec') { if (f.enSuelo) f.vx *= Math.pow(0.001, dt); }
    else if (fs === 'fin') { if (!f.conecto && !f.cadena.length) f.cadena = []; f._subio = false; f.atq = null; f.est = f.enSuelo ? 'quieto' : 'salto'; f.t = 0; if (!f.enSuelo) f.aereo = true; return; }
    if (a.tipo === 'salto' && f.enSuelo && f.t > a.ini + 0.05 && !f.aterrizo) { f.aterrizo = true; f.t = a.ini + a.act; this.fx.polvo(f.x, SUELO, 8); sonar('pelea.cae'); this.temblor = 0.1; }
    if (a.tipo === 'contra' && fs === 'act') { f.contraOn = true; } else f.contraOn = false;
  }
  efecto(f, a) { // lo que hace el especial al entrar en la fase activa
    const t = a.tipo, ox = f.x + f.cara * 26 * f.esc;
    if (t === 'proy') { const n = a.multi || 1; for (let i = 0; i < n; i++) this.proy.push({ de: f, x: ox - f.cara * i * 18, z: 58 * f.esc + (a.obj === 'chancleta' ? 4 : 0), vx: f.cara * (a.vel || 230), vz: a.arco ? 160 : 0, g: a.arco ? 420 : 0, obj: a.obj, dmg: a.dmg / n, ang: 0, gira: a.gira, aturde: a.aturde || 0, vida: 2.6, r: 9, fx: a.fx, retraso: i * 0.08 }); sonar('pelea.lanza'); }
    else if (t === 'suelo') { this.proy.push({ de: f, x: ox, z: 4, vx: f.cara * (a.vel || 210), vz: 0, g: 0, obj: 'onda', suelo: true, dmg: a.dmg, vida: 1.8, r: 12, fx: a.fx || 'tierra', bajo: true, multi: a.multi || 1 }); this.temblor = 0.16; this.fx.polvo(ox, SUELO, 10); sonar('pelea.piso'); }
    else if (t === 'trampa') { this.trampas = this.trampas.filter((q) => q.de !== f); this.trampas.push({ de: f, x: Math.max(30, Math.min(ANCHO - 30, f.x + f.cara * 70)), t: 0, vida: 7, obj: 'cascara', dmg: a.dmg }); sonar('pelea.lanza'); }
    else if (t === 'buff') { if (a.cura) f.hp = Math.min(f.hpMax, f.hp + a.cura * 3); if (a.armadura) { f.armadura = 1; f.buffT = a.armadura; } if (a.super) f.super = Math.min(100, f.super + a.super); this.fx.aro(f.x, SUELO); this.fx.flotante(f.x, SUELO, 110 * f.esc, a.cura ? '+VIDA' : '+SÚPER', '#7aff7a'); sonar('pelea.buff'); }
    else if (t === 'agarre') { const op = f.op; const d = Math.abs(op.x - f.x) - f.anchoC - op.anchoC; if (d < (a.rg || 38) - 20 && op.enSuelo && op.invul <= 0 && !['vuela', 'piso', 'levanta'].includes(op.est)) this.agarrar(f, a, true); }
  }
  // ---------------------------------------------------------------- agarres
  agarrar(f, a, comando) { const op = f.op; f.est = 'agarra'; f.t = 0; f.agarrado = { op, a, comando, hits: 0 }; op.est = 'agarrado'; op.t = 0; op.vx = 0; op.z = 0; op.atq = null; op.cara = -f.cara; f.vx = 0; sonar('pelea.agarre'); f.conecto = true; }
  pasoAgarre(f, dt, E) { const g = f.agarrado, op = g.op; op.x = f.x + f.cara * (f.anchoC + op.anchoC + 4);
    const escapa = g.comando || op.t > 0.22 ? false : !op.cpu ? !!(E && E.buf.pina > 0 && E.buf.patada > 0 && op.t > 0.02) : op.ia.escapaAgarre(this);
    if (escapa) { // escape
      if (!op.cpu && E) { E.buf.pina = 0; E.buf.patada = 0; } f.est = 'quieto'; op.est = 'quieto'; f.vx = -f.cara * 180; op.vx = f.cara * 180; this.fx.bloqueo((f.x + op.x) / 2, SUELO, 60); this.fx.flotante((f.x + op.x) / 2, SUELO, 100, '¡ESCAPE!', '#9ad8f0'); sonar('pelea.bloqueo'); f.agarrado = null; return; }
    if (g.comando && f.t > 0.12 + g.hits * 0.16 && g.hits < 2) { g.hits++; this.fx.chispa(op.x, SUELO, 60 * op.esc, false); sonar('pelea.golpe.leve'); this.hitstop = 0.04; }
    if (f.t > (g.comando ? 0.5 : 0.34)) { // lanza
      const atras = !f.cpu ? (f.inp.dx * f.cara < -0.5) : Math.random() < 0.3; const dir = atras ? -f.cara : f.cara;
      f.est = 'lanza'; f.t = 0; f.agarrado = null; if (atras) { op.x = f.x - f.cara * 20; f.cara = -f.cara; }
      const dmg = g.comando ? g.a.dmg : 110; this.impacto(f, op, { dmg, tumba: true, lanza: 300, kb: 150, hs: 0.4, noBloq: true, agarre: true, dir }, op.x, 60 * op.esc); sonar('pelea.lanza.cuerpo'); this.temblor = 0.2; }
  }
  contraGuardia(f) { const op = f.op; f.est = 'ataque'; f.atq = Object.assign({}, f.movs.h, { k: 'contraG', dmg: 60, tumba: true, invul: 0.3, ini: 0.03, nombre: 'CONTRA' }); f.t = 0; f.conecto = false; f.hits = 0; f.invul = 0.3; f.stun = 0;
    this.fx.aro(f.x, SUELO); this.fx.flotante(f.x, SUELO, 110, '¡CONTRA!', '#9ad8f0'); sonar('pelea.contra'); void op; }
  // ---------------------------------------------------------------- definitivo
  iniciarUlt(f) { const op = f.op; f.super = 0; this.stats.ults += f === this.F[0] ? 1 : 0; f.est = 'ultAct'; f.t = 0; f.vx = 0; f.invul = 9; f.atq = f.movs.ult; this.zoomObj = 1.18; this.zoomT = 1.2; this.ultDe = f;
    sonar('pelea.superflash'); this.flash = { t: 0, dur: 0.85, f, fin: () => {
      // golpe de activación: ¿conecta?
      const L = f.L.ult, dist = Math.abs(op.x - f.x); const bloquea = this.bloquea(op, f, { alto: false, bajo: false }) && L.alcance < 900; const alc = (L.alcance || 100) * f.esc + op.anchoC;
      if (op.invul > 0 && op.est !== 'quieto' || dist > alc && L.alcance < 900 || op.ko) { f.est = 'ataque'; f.atq = f.movs.ult; f.t = 0; f.whiff = 0.3; f.invul = 0; sonar('pelea.aire.fuerte'); return; }
      if (bloquea) { f.est = 'ataque'; f.atq = f.movs.ult; f.t = 0; f.invul = 0; this.impacto(f, op, { dmg: L.dmg * 0.12, kb: 160, bs: 0.5, especial: true, chip: 1 }, op.x, 60); return; }
      this.ult = crearUlt(L.escena, this, f, op); f.est = 'ultAct'; op.est = 'dolor'; op.stun = 99; op.vx = 0; op.atq = null; musica('mus.pelea.ult'); } }; this.temblor = 0.3; }
  golpeUlt(f, op, frac, o = {}) { // golpe programado por la escena del definitivo
    const dmg = f.L.ult.dmg * frac * f.dmgMul * (this.mods.dobleDanio ? 1.5 : 1); this.danar(op, dmg, f); op.blink = 0.08; this.hitstop = o.hitstop ?? 0.06; this.temblor = Math.max(this.temblor, o.temblor ?? 0.2);
    this.fx.chispa(o.x ?? op.x, SUELO, o.z ?? 60 * op.esc, true); if (GORE.nivel) this.fx.vidrios(op.x, SUELO, 60, '#a8141a'); sonar(o.sfx || 'pelea.golpe.fuerte'); op.comboN++; f.comboVis = op.comboN; f.comboT = 1.5; this.esc.alentar(1); }
  finUlt(u) { const f = u.f, op = u.op; f.est = 'quieto'; f.t = 0; f.invul = 0.2; f.atq = null; op.stun = 0; op.est = 'vuela'; op.vz = 300; op.vx = f.cara * 160; op.z = Math.max(op.z, 2); op.t = 0; op.juggle = 9;
    musica(this.cfg.musica || (this.F[1].jefe ? 'mus.pelea.jefe' : 'mus.pelea')); if (op.hp <= 0) this.ko(op, f); this.zoomObj = 1; }
  // ---------------------------------------------------------------- física
  fisica(f, dt) {
    if (f.est === 'agarrado' || f.est === 'ultAct' || f.est === 'intro') return;
    f.x += f.vx * dt;
    if (!f.enSuelo || f.vz > 0) { f.vz -= GRAV * dt * (f.est === 'vuela' && f.juggle > 4 ? 1.4 : 1); f.z += f.vz * dt;
      if (f.z <= 0) { f.z = 0; const v = f.vz; f.vz = 0;
        if (f.est === 'vuela') { if (v < -380 && !f.rebote && !f.ko) { f.rebote = true; f.vz = 140; f.z = 0.5; this.fx.polvo(f.x, SUELO, 10); sonar('pelea.piso'); this.temblor = 0.12; } else { f.est = 'piso'; f.t = 0; f.vx *= 0.3; f.juggle = 0; f.rebote = false; f.comboN = 0; this.fx.polvo(f.x, SUELO, 12); sonar('pelea.cae'); if (f.ko) this.temblor = 0.3; } }
        else if (f.est === 'salto' || (f.est === 'ataque' && (f.atq.k === 'la' || f.atq.k === 'ha'))) { f.est = 'quieto'; f.t = 0; f.vx = 0; f.atq = null; f.aereo = false; this.fx.polvo(f.x, SUELO, 4); }
        else if (f.est === 'ataque' && f.atq && f.atq.tipo !== 'salto') { f.vx = 0; } } }
    if (f.est === 'camina' || f.est === 'corre') f.vx = f.est === 'corre' ? f.vx : f.vx;
    // límites: escenario y cámara
    const m = 18, l = Math.max(m, this.cam - this.vw / 2 + m), r = Math.min(ANCHO - m, this.cam + this.vw / 2 - m); if (f.x < l) { f.x = l; if (f.est === 'vuela') f.vx = Math.abs(f.vx) * 0.3; } if (f.x > r) { f.x = r; if (f.est === 'vuela') f.vx = -Math.abs(f.vx) * 0.3; }
  }
  empujar() { const [a, b] = this.F; if (a.est === 'agarrado' || b.est === 'agarrado' || this.ult) return; if (Math.abs(a.z - b.z) > 50) return; const min = a.anchoC + b.anchoC, d = b.x - a.x;
    if (Math.abs(d) < min) { const s = d === 0 ? (a.cara > 0 ? 1 : -1) : Math.sign(d); const p = (min - Math.abs(d)) / 2; a.x -= s * p; b.x += s * p;
      // contra la pared: el otro se corre
      for (const f of this.F) f.x = Math.max(18, Math.min(ANCHO - 18, f.x)); } }
  camara(dt) { const [a, b] = this.F; const c = (a.x + b.x) / 2, w = this.vw || 480; const obj = Math.max(w / 2, Math.min(ANCHO - w / 2, c)); this.cam += (obj - this.cam) * Math.min(1, dt * 8); }
  // ---------------------------------------------------------------- hitboxes
  articula(f) { const sp = f.sp, an = f.anim, i = f.fr; const k = an + ':' + i; const C = sp._art || (sp._art = new Map()); let a = C.get(k); if (!a) { const P = sp.poses[an]; a = articulaciones(sp.def, P[Math.min(i, P.length - 1)], sp.w, sp.h); C.set(k, a); } return a; }
  hitbox(f) { const a = f.atq; const J = this.articula(f); const p = J[a.limb] || J.mF; const ext = (a.ext || 0) * f.esc; const X = f.x + f.cara * (p[0] + ext * 0.5), Z = f.z - p[1]; return { x: X, z: Z, r: (a.r || 9) * f.esc + ext * 0.5 }; }
  // hurtbox: cabeza (círculo) + torso + piernas (cápsulas) del cuadro actual
  tocaCuerpo(v, X, Z, R) { const J = this.articula(v); const cx = (p) => v.x + v.cara * p[0], cz = (p) => v.z - p[1];
    if (Math.hypot(X - cx(J.cab), Z - cz(J.cab)) < R + J.rc) return true;
    const tr = 9 * v.esc * Math.min(1.5, v.def.ancho || 1); const seg = (p, q, rr) => { const ax = cx(p), az = cz(p), bx = cx(q), bz = cz(q); const dx = bx - ax, dz = bz - az; const L2 = dx * dx + dz * dz || 1; let t = ((X - ax) * dx + (Z - az) * dz) / L2; t = t < 0 ? 0 : t > 1 ? 1 : t; return Math.hypot(X - (ax + dx * t), Z - (az + dz * t)) < R + rr; };
    // núcleo: cápsula vertical centrada en el cuerpo, del ancho de la caja de empuje (consistencia en guardias raras)
    if (seg([0, J.cadera[1] * 0.85], [0, J.cuello[1]], v.anchoC * 0.95)) return true;
    return seg(J.cuello, J.cadera, tr) || seg(J.cadera, J.rN, 5 * v.esc) || seg(J.rN, J.pN, 4 * v.esc) || seg(J.cadera, J.rF, 5 * v.esc) || seg(J.rF, J.pF, 4 * v.esc) || seg(J.hN, J.cN, 4 * v.esc); }
  golpes(f) {
    const a = f.atq; if (f.est !== 'ataque' || !a || f.fase() !== 'act') return; if (a.tipo === 'agarreN') { this.probarAgarre(f); return; } if (a.dmg <= 0 && a.k !== 'contraG') return; if (a.tipo === 'proy' || a.tipo === 'suelo' || a.tipo === 'buff' || a.tipo === 'trampa' || a.tipo === 'contra' || a.tipo === 'agarre' || a.tipo === 'agarreN') { if (a.tipo === 'agarreN') this.probarAgarre(f); return; }
    const n = a.multi || 1; const sub = Math.min(n - 1, Math.floor((f.t - a.ini) / (a.act / n))); if (f.hits > sub) return;
    const v = f.op; if (v.invul > 0 || v.est === 'piso' || v.est === 'levanta' || v.est === 'agarrado' || v.ko && v.est !== 'vuela') return;
    const hb = this.hitbox(f); let toca = this.tocaCuerpo(v, hb.x, hb.z, hb.r);
    if (!toca && a.arco) { const J = this.articula(f); const h = (a.limb || '').endsWith('F') ? J.hF : J.hN, m = J[a.limb] || J.mN; for (const u of [0.35, 0.65]) { const X = f.x + f.cara * (h[0] + (m[0] - h[0]) * u), Z = f.z - (h[1] + (m[1] - h[1]) * u); if (this.tocaCuerpo(v, X, Z, hb.r * 0.9)) { toca = true; break; } } }
    if (!toca) return;
    f.hits = sub + 1; const dmg = a.dmg / (a.tipo === 'golpe' && n > 1 ? 1 : n > 1 ? n : 1);
    // contra (especial de contraataque) del rival en su ventana
    if (v.contraOn && v.est === 'ataque') { this.contraExito(v, f); return; }
    this.impacto(f, v, Object.assign({}, a, { dmg: n > 1 && a.tipo !== 'golpe' ? a.dmg / n : dmg, multiI: sub, multiN: n }), hb.x, hb.z);
  }
  probarAgarre(f) { const v = f.op; const d = Math.abs(v.x - f.x) - f.anchoC - v.anchoC; if (f.hits) return; f.hits = 1;
    if (d < 18 && v.enSuelo && v.invul <= 0 && !['vuela', 'piso', 'levanta', 'agarrado', 'agarra', 'ultAct'].includes(v.est) && !(v.est === 'ataque' && v.fase() === 'act' && v.atq.k !== 'agarre')) this.agarrar(f, f.atq, false);
    else f.whiff = 0.12; }
  contraExito(v, atk) { v.contraOn = false; const M = v.atq; v.invul = 0.4; this.fx.aro(v.x, SUELO); this.fx.flotante(v.x, SUELO, 120, M.nombre || '¡CONTRA!', '#9ad8f0'); sonar('pelea.contra'); this.hitstop = 0.18; this.zoomObj = 1.1; this.zoomT = 0.4;
    atk.atq = null; this.impacto(v, atk, { dmg: (M.dmg || 110) * 1.0, tumba: true, lanza: 280, kb: 140, hs: 0.5, noBloq: true, especial: true }, atk.x, 60 * atk.esc); v.t = M.ini + M.act; }
  // ¿el defensor bloquea este golpe?
  bloquea(v, atk, a) { if (a.noBloq) return false; if (!v.enSuelo || v.mareo > 0) return false; if (!(NEUTRO.has(v.est) || v.est === 'bloq' || v.est === 'bloqAg')) return false;
    const haciaA = Math.sign(atk.x - v.x) || v.cara; const atras = v.inp.dx * haciaA < -0.5; if (!atras) return false; const ag = v.inp.dy > 0.5; if (a.bajo && !ag) return false; if (a.alto && ag) return false; return true; }
  danar(v, dmg, por) { if (this.dios && !v.cpu) dmg = 0; v.hp = Math.max(0, v.hp - dmg); if (por === this.F[0]) this.stats.danio += dmg; }
  impacto(atk, v, a, X, Z) {
    const dir = a.dir || Math.sign(v.x - atk.x) || atk.cara; const mul = atk.dmgMul * (this.mods.dobleDanio ? 1.5 : 1) * (atk.buffT > 0 && atk.L.id === 'borracho' ? 1.15 : 1);
    if (this.bloquea(v, atk, a)) { // ---- bloqueado
      const ag = v.inp.dy > 0.5; v.est = ag ? 'bloqAg' : 'bloq'; v.t = 0; v.stun = a.bs || 0.14; v.vx = dir * (a.kb || 90) * 0.9 / v.N.peso; if (Math.abs(v.x - (dir > 0 ? ANCHO : 0)) < 40) atk.vx = -dir * 120;
      const chip = a.especial || a.chip ? a.dmg * 0.12 * mul : 0; if (chip) this.danar(v, chip, atk); atk.conecto = true; v.super = Math.min(100, v.super + 4); atk.super = Math.min(100, atk.super + 2);
      this.fx.bloqueo(X, SUELO, Z); this.hitstop = 0.045; sonar('pelea.bloqueo'); if (v.hp <= 0) this.ko(v, atk); return; }
    // ---- golpe que entra
    const contra = v.est === 'ataque' && v.fase() === 'ini';
    const escala = Math.max(0.3, 1 - 0.11 * v.comboN); let dmg = a.dmg * mul * escala * (contra ? 1.25 : 1); if (v.armadura) dmg *= 0.7; if (v.jefe) dmg *= 1;
    this.danar(v, dmg, atk); v.comboN++; atk.comboVis = v.comboN; atk.comboT = 1.6; atk.conecto = true; if (a.k && !a.especial) atk.cadena.push(a.k === 'firma' ? 'f' : a.k[0]);
    if (atk === this.F[0]) { this.stats.golpes++; this.stats.maxCombo = Math.max(this.stats.maxCombo, v.comboN); }
    atk.super = Math.min(100, atk.super + Math.min(14, dmg * 0.09) * (a.especial ? 0.5 : 1)); v.super = Math.min(100, v.super + Math.min(10, dmg * 0.05));
    if (contra && !a.agarre) { this.fx.flotante(v.x, SUELO, 120 * v.esc, '¡CONTRAGOLPE!', '#ff5a3a'); sonar('pelea.contragolpe'); }
    v.blink = 0.07; v.atq = null; v.contraOn = false;
    const fuerte = dmg >= 80 || a.lanza || a.tumba; this.fx.chispa(X, SUELO, Z, fuerte); if (GORE.nivel && (fuerte || Math.random() < 0.4)) this.fx.vidrios(X, SUELO, Z, '#a8141a');
    this.hitstop = Math.min(0.16, 0.045 + dmg * 0.0007) * (a.multiN > 1 && a.multiI < a.multiN - 1 ? 0.5 : 1); if (fuerte) this.temblor = Math.max(this.temblor, 0.14);
    sonar(a.agarre ? 'pelea.golpe.fuerte' : fuerte ? 'pelea.golpe.fuerte' : dmg >= 50 ? 'pelea.golpe.medio' : 'pelea.golpe.leve'); this.esc.alentar(fuerte ? 1 : 0.5);
    if (a.aturde) { v.aturde = a.aturde; v.est = 'dolor'; v.stun = a.aturde; v.t = 0; this.fx.flotante(v.x, SUELO, 110, '¡ESPOSADO!', '#9ad8f0'); }
    const aire = !v.enSuelo || v.est === 'vuela';
    if (v.hp <= 0) { this.ko(v, atk, dir); return; }
    if (v.armadura && !a.lanza && !a.tumba && !aire) { v.vx = dir * 30; return; } // aguanta sin inmutarse
    if (aire || a.lanza || a.tumba) { v.est = 'vuela'; v.t = 0; v.atq = null; v.juggle++; const dec = Math.max(0.35, 1 - 0.15 * (v.juggle - 1)); v.vz = (a.lanza || (aire ? 250 : 220)) * (aire ? dec : 1) * (v.jefe ? 0.85 : 1); v.vx = dir * (a.kb || 100) * 0.7 / v.N.peso; v.z = Math.max(v.z, 1); }
    else { v.est = v.inp.dy > 0.5 && v.est === 'agacha' ? 'dolorAg' : 'dolor'; v.t = 0; v.stun = (a.hs || 0.2) + (contra ? 0.1 : 0); v.vx = dir * (a.kb || 90) / v.N.peso; if (Math.abs(v.x - (dir > 0 ? ANCHO - 18 : 18)) < 8 || Math.abs(v.x - (this.cam + dir * (this.vw / 2 - 18))) < 6) atk.vx = -dir * (a.kb || 90) * 0.6; }
  }
  // ---------------------------------------------------------------- proyectiles y trampas
  pasoProy(dt) {
    for (const p of this.proy) { if (p.retraso > 0) { p.retraso -= dt; continue; } p.vida -= dt; p.x += p.vx * dt; if (p.g) { p.vz -= p.g * dt; p.z += p.vz * dt; if (p.z < 4) { p.z = 4; p.vida = 0; this.fx.fruta(p.x, SUELO, 4, p.obj === 'tomate' ? '#d8282a' : '#c8c8d0'); } } if (p.gira) p.ang += dt * 14 * Math.sign(p.vx);
      if (p.suelo && Math.random() < 0.5) this.fx.polvo(p.x, SUELO, 1);
      if (p.x < -20 || p.x > ANCHO + 20) p.vida = 0; if (p.vida <= 0) continue;
      const v = p.de.op; if (v.invul > 0 || ['piso', 'levanta', 'agarrado'].includes(v.est) || v.ko && v.est !== 'vuela') continue;
      if (this.tocaCuerpo(v, p.x, p.z, p.r)) { p.vida = 0; if (v.contraOn && v.est === 'ataque') { this.contraExito(v, p.de); continue; } this.impacto(p.de, v, { dmg: p.dmg, especial: true, bajo: p.suelo, kb: 110, hs: 0.3, aturde: p.aturde, tumba: p.suelo && p.multi > 1 }, p.x, p.z); } }
    // proyectiles que chocan entre sí se anulan
    for (const a of this.proy) for (const b of this.proy) if (a !== b && a.de !== b.de && a.vida > 0 && b.vida > 0 && Math.abs(a.x - b.x) < 14 && Math.abs(a.z - b.z) < 20) { a.vida = b.vida = 0; this.fx.chispa((a.x + b.x) / 2, SUELO, a.z, true); sonar('pelea.bloqueo'); }
    this.proy = this.proy.filter((p) => p.vida > 0);
  }
  pasoTrampas(dt) { for (const q of this.trampas) { q.t += dt; const v = q.de.op; if (q.t > 0.3 && v.enSuelo && Math.abs(v.x - q.x) < 14 && ['quieto', 'camina', 'corre', 'bloqP'].includes(v.est)) { q.vida = 0; this.fx.flotante(q.x, SUELO, 60, '¡RESBALÓ!', '#f2c21b'); this.impacto(q.de, v, { dmg: q.dmg * 1.6, tumba: true, lanza: 200, kb: 40, noBloq: true }, v.x, 20); } } this.trampas = this.trampas.filter((q) => q.t < q.vida); }
  // ---------------------------------------------------------------- KO, tiempo, rondas
  ko(v, atk, dir = 1) { if (v.ko) return; v.ko = true; v.hp = 0; v.est = 'vuela'; v.t = 0; v.vz = 320; v.vx = dir * 150; v.z = Math.max(1, v.z); v.atq = null; this.estado = 'ko'; this.tE = 0; this.lento = 1.1; this.koQuien = v;
    this.anunciar('K.O.', '#ff3a2a', 1.8, 5, 0.42); sonar('pelea.ko'); this.temblor = 0.5; this.zoomObj = 1.15; this.zoomT = 1.2; this.esc.alentar(2); }
  tiempoFuera() { if (this.estado !== 'pelea') return; const [a, b] = this.F; const ka = a.hp / a.hpMax, kb = b.hp / b.hpMax; this.anunciar('¡SE ACABÓ EL TIEMPO!', '#ffd23a', 1.6, 2, 0.4); sonar('pelea.tiempo');
    this.estado = 'ko'; this.tE = 0; this.koQuien = Math.abs(ka - kb) < 0.001 ? 'empate' : ka > kb ? b : a; }
  pasoKO() { if (this.tE < 1.6) return; const v = this.koQuien; if (this._finR) return; this._finR = true;
    if (v === 'empate') { for (const f of this.F) f.rondas++; this.anunciar('EMPATE', '#ffffff', 1.4, 3); }
    else { const g = v.op; g.rondas++; g.est = 'gana'; g.t = 0; g.vx = 0; if (!v.ko) { v.est = 'pierde'; v.t = 0; } sonar(g.cpu ? 'pelea.derrota' : 'pelea.victoria'); const fr = g.L.frases[Math.floor(Math.random() * g.L.frases.length)]; this.frase = { f: g, s: fr, t: 0 };
      if (g.hp >= g.hpMax) { this.anunciar('¡IMPECABLE!', '#7aff7a', 1.6, 3, 0.55); if (g === this.F[0]) this.stats.perfectos++; }
      if (g === this.F[0]) this.stats.rondasG++; else this.stats.rondasP++; }
    this.estado = 'finRonda'; this.tE = 0; this._finR = false; }
  terminarRonda() { const [a, b] = this.F; const fin = a.rondas >= this.ganar || b.rondas >= this.ganar || this.ronda >= 5;
    if (fin && !(a.rondas === b.rondas && this.ronda < 6)) { const g = a.rondas > b.rondas ? 1 : a.rondas < b.rondas ? 2 : (a.hp >= b.hp ? 1 : 2); this.resultado = { gana: g, stats: this.stats, rondas: [a.rondas, b.rondas] }; this.estado = 'fin'; this.tE = 0; musica(g === 1 ? 'mus.victoria' : 'mus.derrota'); return; }
    this.frase = null; this.empezarRonda(); }
  // ---------------------------------------------------------------- animación (qué cuadro mostrar)
  animar(f) { let an = 'quieto', i = 0; const t = f.t;
    switch (f.est) {
      case 'quieto': an = 'quieto'; i = Math.floor(this.t * 5 + f.lado) % 4; break;
      case 'camina': { an = 'camina'; const avanza = f.vx * f.cara >= 0; const k = Math.floor(this.t * 9) % 8; i = avanza ? k : 7 - k; break; }
      case 'corre': an = 'corre'; i = Math.floor(this.t * 12) % 6; break;
      case 'agacha': an = 'agacha'; break; case 'bloqP': case 'bloq': an = 'bloq'; break; case 'bloqAgP': case 'bloqAg': an = 'bloqAg'; break;
      case 'salto': case 'atras': an = 'salto'; i = f.est === 'atras' ? 2 : f.vz > 120 ? 0 : f.vz > -120 ? 1 : 2; break;
      case 'dolor': an = f.aturde > 0 ? 'dolorB' : (f.stun > 0.25 ? 'dolorB' : 'dolor'); i = t < 0.08 ? 0 : 1; break;
      case 'dolorAg': an = 'dolorAg'; break;
      case 'vuela': an = 'vuela'; i = f.vz > 0 ? 0 : 1; break;
      case 'piso': an = 'piso'; i = 0; break; case 'levanta': an = 'levanta'; i = t < 0.18 ? 0 : 1; break;
      case 'agarra': an = 'agarra'; i = f.agarrado && f.agarrado.comando ? (Math.floor(t * 8) % 2) : 0; break; case 'agarrado': an = 'agarrado'; break;
      case 'lanza': an = 'lanza'; i = t < 0.12 ? 0 : 1; break;
      case 'gana': an = 'gana'; i = Math.floor(t * 3) % 2; break; case 'pierde': an = 'pierde'; break; case 'intro': an = 'intro'; i = Math.floor(t * 2.5) % 2; break;
      case 'tele': an = 'agacha'; break;
      case 'ultAct': { an = f.atq ? f.atq.anim : 'm_ult'; i = 1; if (this.ult && this.ult.pose) { const p = this.ult.pose(f); if (p) { an = p[0]; i = p[1]; } } break; }
      case 'ataque': { const a = f.atq; an = a.anim; const P = f.sp.poses[an]; const n = P ? P.length : 1; const fs = f.fase();
        if (n === 4) i = fs === 'ini' ? 0 : fs === 'act' ? (a.multi > 1 ? 1 + (Math.floor((t - a.ini) / (a.act / a.multi)) % 2) : 1) : (t < a.ini + a.act + a.rec * 0.45 ? 2 : 3);
        else if (n > 4) { if (fs === 'ini') i = 0; else if (fs === 'act') i = 1 + Math.floor((t - a.ini) / a.act * (n - 2)) % (n - 2); else i = n - 1; }
        else i = fs === 'ini' ? 0 : fs === 'act' ? Math.min(1, n - 1) : n - 1; break; }
    }
    if (f.est === 'piso' && f.ko) i = 0; const P = f.sp.poses[an]; if (!P) { an = 'quieto'; i = 0; } else i = Math.min(i, P.length - 1); f.anim = an; f.fr = i; }
  // ---------------------------------------------------------------- dibujo
  dibujar(x, alfa, W, H) {
    this.vw = W; const off = H - ALTO; const cam = this.camPrev + (this.cam - this.camPrev) * alfa;
    let sx = 0, sy = 0; if (this.temblor > 0) { const k = Math.min(1, this.temblor * 6); sx = Math.round((Math.random() - 0.5) * 6 * k); sy = Math.round((Math.random() - 0.5) * 4 * k); }
    const C = Math.round(cam - W / 2) - sx; const z = this.zoom;
    x.save(); if (z > 1.01) { const fy = off + SUELO - 60; x.translate(W / 2, fy); x.scale(z, z); x.translate(-W / 2, -fy); }
    x.translate(0, sy);
    if (this.ult && this.ult.tapaFondo) this.ult.fondo(x, C, off, W, H); else { this.esc.dibujar(x, C, off, W, H); if (this.ult) this.ult.fondo(x, C, off, W, H); }
    const Y = off;
    // sombras
    for (const f of this.F) { const fx = f.px + (f.x - f.px) * alfa, fz = f.pz + (f.z - f.pz) * alfa; const w = Math.round((34 + 10 * (f.def.ancho || 1)) * f.esc * Math.max(0.4, 1 - fz / 200)); x.fillStyle = 'rgba(20,10,30,0.38)'; x.fillRect(Math.round(fx - C - w / 2), Y + SUELO - 2, w, 4); x.fillRect(Math.round(fx - C - w / 2 + 3), Y + SUELO - 3, w - 6, 6); }
    for (const q of this.trampas) dibujarObjeto(x, q.obj, q.x - C, Y + SUELO - 3, 0, 1);
    // luchadores: el que ataca adelante
    const orden = this.F[0].est === 'ataque' || this.F[0].est === 'agarra' || this.F[0].est === 'ultAct' ? [this.F[1], this.F[0]] : [this.F[0], this.F[1]];
    for (const f of orden) this.dibujarLuchador(x, f, alfa, C, Y);
    for (const p of this.proy) { if (p.retraso > 0) continue; const px = p.x - C, py = Y + SUELO - p.z; if (p.obj === 'onda') this.dibujarOnda(x, p, px, py); else dibujarObjeto(x, p.obj, px, py, p.ang, Math.sign(p.vx)); }
    this.fx.dibujar(x, C, Y);
    if (this.ult) this.ult.frente(x, C, off, W, H);
    x.restore();
    if (this.flash) superflash(x, this.flash, W, H);
    this.dibujarHUD(x, W, H);
  }
  dibujarOnda(x, p, px, py) { const c = p.fx === 'fuego' ? ['#ffb040', '#ff5a20'] : p.fx === 'agua' ? ['#c8ecff', '#6ab0e0'] : ['#e8d8b0', '#a88a60']; const t = this.t * 20;
    for (let i = 0; i < 4; i++) { const h = 6 + ((i * 7 + t) % 10); x.fillStyle = c[i & 1]; x.fillRect(Math.round(px - 8 + i * 4), Math.round(py - h), 3, h); } x.fillStyle = c[0]; x.fillRect(Math.round(px - 10), Math.round(py - 2), 20, 2); }
  dibujarLuchador(x, f, alfa, C, Y) {
    const fx = f.px + (f.x - f.px) * alfa, fz = f.pz + (f.z - f.pz) * alfa; if (f.est === 'tele' && f.t > 0.05) return;
    let fr = cuadroListo(f.sp, f.anim, f.fr); if (f.blink > 0 || (f.invul > 0 && f.est === 'levanta' && (this.t * 20 | 0) % 2)) fr = f.blink > 0 ? siluetaBlanca(fr) : fr;
    const X = Math.round(fx - C), Yp = Math.round(Y + SUELO - fz + (f.est === 'piso' ? 2 : 0));
    if (f.armadura && f.buffT > 0 && (this.t * 10 | 0) % 2) { x.globalAlpha = 0.5; dibujarCuadro(x, siluetaBlanca(fr), X + 1, Yp, f.cara); x.globalAlpha = 1; }
    dibujarCuadro(x, fr, X, Yp, f.cara);
    // objeto en la mano durante el golpe que lo usa
    const a = f.atq; if (a && a.prop && (f.est === 'ataque') && f.fase() !== 'fin') { const J = this.articula(f); const m = J[a.limb === 'mF' ? 'mF' : 'mN']; dibujarObjeto(x, a.prop, X + f.cara * m[0], Yp + m[1], f.fase() === 'act' ? -0.8 : 0.6, f.cara); }
    if (window.__bb && window.__bb.cajas) this.dibujarCajas(x, f, C, Y);
  }
  dibujarCajas(x, f, C, Y) { const J = this.articula(f); x.strokeStyle = '#00ff88'; for (const p of [J.cab, J.cuello, J.cadera, J.rN, J.pN, J.rF, J.pF]) { x.strokeRect(Math.round(f.x + f.cara * p[0] - C) - 2, Math.round(Y + SUELO - f.z + p[1]) - 2, 4, 4); }
    if (f.est === 'ataque' && f.atq && f.fase() === 'act' && f.atq.limb) { const hb = this.hitbox(f); x.strokeStyle = '#ff2a2a'; x.beginPath(); x.arc(hb.x - C, Y + SUELO - hb.z, hb.r, 0, 7); x.stroke(); } }
  dibujarHUD(x, W, H) {
    const [a, b] = this.F; const bw = Math.min(200, Math.floor(W / 2 - 46)), y0 = 8;
    const barra = (f, X, izq) => { const w = bw; x.fillStyle = CONTORNO; x.fillRect(X - 2, y0 - 2, w + 4, 13); x.fillStyle = '#3a1a24'; x.fillRect(X, y0, w, 9);
      const kr = f.hpRojo / f.hpMax, k = f.hp / f.hpMax; const wr = Math.round(w * kr), wv = Math.round(w * k);
      x.fillStyle = '#e83a2a'; if (izq) x.fillRect(X + w - wr, y0, wr, 9); else x.fillRect(X, y0, wr, 9);
      x.fillStyle = k > 0.5 ? '#f2d21b' : k > 0.25 ? '#f29a1b' : (this.t * 6 | 0) % 2 ? '#ff5a2a' : '#f2d21b'; if (izq) x.fillRect(X + w - wv, y0, wv, 9); else x.fillRect(X, y0, wv, 9);
      x.fillStyle = 'rgba(255,255,255,0.35)'; if (izq) x.fillRect(X + w - wv, y0, wv, 2); else x.fillRect(X, y0, wv, 2);
      const r = f.sp.retrato; if (r) { const s = 26, rx = izq ? X - s - 6 : X + w + 6; x.fillStyle = CONTORNO; x.fillRect(rx - 1, y0 - 3, s + 2, s + 2); x.fillStyle = f.L.color || '#444'; x.fillRect(rx, y0 - 2, s, s); if (izq) x.drawImage(r, rx, y0 - 2, s, s); else { x.save(); x.translate(rx + s, 0); x.scale(-1, 1); x.drawImage(r, 0, y0 - 2, s, s); x.restore(); } }
      texto(x, f.L.nombre.replace(/^(EL|LA) /, ''), izq ? X + w : X, y0 + 13, '#ffffff', 1, izq ? 'der' : 'izq');
      for (let i = 0; i < this.ganar; i++) { const px = izq ? X + w - 8 - i * 10 : X + 2 + i * 10; x.fillStyle = CONTORNO; x.fillRect(px - 1, y0 + 24, 8, 8); x.fillStyle = i < f.rondas ? '#ffd23a' : '#3a2a4a'; x.fillRect(px, y0 + 25, 6, 6); }
      // súper
      const sw = Math.round(bw * 0.62), sxp = izq ? X + w - sw : X, syp = H - 14; x.fillStyle = CONTORNO; x.fillRect(sxp - 2, syp - 2, sw + 4, 9); x.fillStyle = '#1a1a3a'; x.fillRect(sxp, syp, sw, 5);
      const ws = Math.round(sw * f.super / 100); const lleno = f.super >= 100; x.fillStyle = lleno ? ((this.t * 8 | 0) % 2 ? '#ffffff' : '#5ad8ff') : '#2a8aff'; if (izq) x.fillRect(sxp + sw - ws, syp, ws, 5); else x.fillRect(sxp, syp, ws, 5);
      texto(x, lleno ? '¡SÚPER!' : 'SÚPER', izq ? sxp + sw : sxp, syp - 12, lleno ? '#5ad8ff' : '#8a9ac8', 1, izq ? 'der' : 'izq');
      if (f.comboVis > 1 && f.comboT > 0) { f.comboT -= 1 / 120; const cx = izq ? 12 : W - 12; texto(x, f.comboVis + ' GOLPES', cx, 62, f.comboVis >= 8 ? '#ff5a3a' : '#ffd23a', f.comboVis >= 5 ? 2 : 1, izq ? 'izq' : 'der', CONTORNO, '#5a2a10'); }
    };
    barra(a, Math.round(W / 2 - 22 - bw), true); barra(b, Math.round(W / 2 + 22), false);
    // reloj
    const rs = String(Math.ceil(this.reloj)).padStart(2, '0'); x.fillStyle = CONTORNO; x.fillRect(Math.round(W / 2 - 18), y0 - 4, 36, 24); texto(x, this.mods.sinReloj ? '--' : rs, W / 2, y0, this.reloj < 10 ? '#ff5a3a' : '#ffffff', 2, 'centro');
    for (const n of this.anuncios) { const k = n.t / n.dur; const e = k < 0.12 ? Math.max(1, Math.round(n.esc * (1 + (0.12 - k) * 6))) : n.esc; if (k > 0.85 && (n.t * 20 | 0) % 2) continue; texto(x, n.s, W / 2, Math.round(H * n.y - e * 4), n.c, e, 'centro', CONTORNO, '#3a1a10'); }
    if (this.frase && this.estado === 'finRonda') { const f = this.frase.f; texto(x, '"' + this.frase.s + '"', W / 2, Math.round(H * 0.64), '#ffffff', 1, 'centro'); texto(x, f.L.nombre + ' GANA', W / 2, Math.round(H * 0.58), f.L.color || '#ffd23a', 1, 'centro'); }
    if (this.estado === 'intro') { const k = Math.min(1, this.tE / 0.4); x.fillStyle = 'rgba(10,6,20,' + (0.55 * k) + ')'; x.fillRect(0, Math.round(H * 0.32), W, 76);
      const nMax = Math.max(10, Math.floor((W / 2 - 34) / 8)); const claro = (c) => !c || c === '#24242c' || c === '#3a3a44' ? '#ffd23a' : c;
      texto(x, a.L.nombre.length > nMax ? a.L.nombre.slice(0, nMax) : a.L.nombre, Math.round(W * 0.25), Math.round(H * 0.36), claro(a.L.color), 1, 'centro', CONTORNO); texto(x, b.L.nombre.length > nMax ? b.L.nombre.slice(0, nMax) : b.L.nombre, Math.round(W * 0.75), Math.round(H * 0.36), claro(b.L.color), 1, 'centro', CONTORNO);
      texto(x, 'VS', W / 2, Math.round(H * 0.4), '#ff3a2a', 3, 'centro', CONTORNO, '#5a0a0a'); texto(x, this.esc.nombre, W / 2, Math.round(H * 0.32) + 82, '#e8e0f0', 1, 'centro', CONTORNO); partir('"' + a.L.frases[0] + '"', nMax).slice(0, 3).forEach((l, i) => texto(x, l, Math.round(W * 0.25), Math.round(H * 0.45) + i * 10, '#ffffff', 1, 'centro', CONTORNO));
      partir('"' + b.L.frases[0] + '"', nMax).slice(0, 3).forEach((l, i) => texto(x, l, Math.round(W * 0.75), Math.round(H * 0.45) + 12 + i * 10, '#ffffff', 1, 'centro', CONTORNO));
      texto(x, 'PLENA MORTAL', W / 2, Math.round(H * 0.25) - 22, '#ff3a2a', 2, 'centro', CONTORNO, '#5a0a0a'); if (this.cfg.titulo) texto(x, this.cfg.titulo, W / 2, Math.round(H * 0.25), '#ffd23a', 1, 'centro'); }
  }
}
