// Núcleo del juego: luchadores, combate, armas, rompibles, oleadas y render del mundo.
// La IA vive en ia.js, los eventos y peligros del escenario en eventos.js, las partículas en fx.js.
import { generar, cuadroAtaque, dibujarCuadro, siluetaBlanca, vigente, partida, lista as listaAnim, cuadroListo, Q } from './sprites.js';
import { SP, sombra } from './props.js';
import { PISO, ALTO, EXTRA, calle, lejos, medio, cielo, sol } from './escenario.js';
import { JUGADORES, ENEMIGOS, ATQ, ITEMS, FRASES, ROMPIBLES, pick } from './datos.js';
import { NIVELES } from './niveles.js';
import { sonar, voz, frase, musica, ambiente } from './audio.js';
import { texto, lienzo, CONTORNO } from './pixel.js';
import { FX } from './fx.js';
import { Sangre, GORE, etapa } from './sangre.js';
import { director, pensar, seguirCombo } from './ia.js';
import { Eventos } from './eventos.js';
import { gradoSuave, cuadroG, spriteG, silueta, purgarGrado } from './grado.js';
import { Cinematica, retratoCara } from './cinematica.js';
import { guionInicio, JEFE, FIN } from './guion.js';
import { efectos } from './progreso.js';

const GRAV = 920;
let uid = 1;
const porY = (a, b) => a._ys - b._ys;
// ataques con arma: cada clase de arma tiene su cadena (piña, piña, piña…), derivada de los golpes base según la
// velocidad y el alcance del arma (cacheado por arma y paso, sin crear objetos por golpe)
// [anim, ×daño, ×alcance, extras]
// reacción al golpe: estos entran al cuerpo (se dobla); el resto a la cara (cabeza para atrás)
const AL_CUERPO = { patada: 1, rodilla: 1, pina2: 1, barrida: 1, empuja: 1 };
const MOVES = {
  contundente: [['golpe', 1, 1], ['pina2', 0.9, 1.05, { stun: 0.4 }], ['pina3', 1.4, 0.95, { tumba: true, vz: 180, kb: 170, hs: 0.11, remate: true, txt: '¡ESTOCADA!' }]],
  pesada: [['golpe', 1, 1], ['especial', 1.2, 1, { giro: true, tumba: true, vz: 200, kb: 190, hs: 0.1, remate: true, txt: '¡MOLINETE!' }]],
  corta: [['pina1', 0.7, 0.9, { ini: 0.04, rec: 0.08 }], ['pina2', 0.8, 1], ['pina1', 0.7, 0.9, { ini: 0.04, rec: 0.08 }], ['pina3', 1.5, 0.9, { tumba: true, vz: 150, kb: 120, hs: 0.12, remate: true, txt: '¡DESTRIPE!' }]],
  botella: [['golpe', 1, 1], ['pina2', 1.1, 1, { stun: 0.5 }]],
  impro: [['golpe', 1, 1], ['pina2', 0.9, 1], ['golpe', 1.3, 1.05, { tumba: true, vz: 170, kb: 180, hs: 0.1, remate: true, txt: '¡A LO BRUTO!' }]],
};
const IMPRO = { termo: 1, corvina: 1, bandeja: 1, cana: 1 };
export function claseArma(t) { const d = ITEMS[t]; return d.corta ? 'corta' : d.rompe ? 'botella' : d.pesada ? 'pesada' : IMPRO[t] ? 'impro' : 'contundente'; }
const ATQ_ARMA = {};
export function atqArma(t, paso = 0) {
  const k = t + paso; let a = ATQ_ARMA[k]; if (a) return a; const d = ITEMS[t], v = d.vel || 1, M = MOVES[claseArma(t)], m = M[Math.min(paso, M.length - 1)];
  const g = ATQ[m[0]], ex = m[3] || {}, al = Math.round(d.alcance * m[2]);
  a = ATQ_ARMA[k] = { ...g, anim: g.anim, ini: (ex.ini || g.ini) / v, act: g.act, rec: (ex.rec || g.rec) / v, x: ex.giro ? [-al, al] : [6, al], kb: ex.kb || d.kb || ATQ.golpe.kb, stun: ex.stun || d.stun || ATQ.golpe.stun,
    tumba: !!(ex.tumba || d.tumba), vz: ex.vz || (d.tumba ? 150 : 0), son: d.son || ATQ.golpe.son, hs: ex.hs || (d.pesada ? 0.11 : ATQ.golpe.hs), remate: !!(ex.remate || d.pesada), pesada: !!d.pesada,
    giro: !!ex.giro, arma: true, paso, n: M.length, kDmg: m[1], txt: ex.txt || null, dmg: 0 };
  return a;
}
const TIRO = { anim: 'golpe', ini: 0.08, act: 0, rec: 0.18, dmg: 0, x: [0, 0], son: 'arma.tiro', hs: 0 };
const ROTO = { cajon: 'cajonRoto', tacho: 'tachoRoto', cajaBiz: 'carton' };
const MUERTE_ARMA = {
  palo: { txt: '¡PALAZO Y A DORMIR!', vuelo: 210, vz: 200, gira: 0.4 }, cano: { txt: '¡CAÑAZO! LO MANDASTE AL CERRO', vuelo: 300, vz: 230, gira: 0.7 },
  silla: { txt: '¡SILLAZO DE BOLICHE!', vuelo: 340, vz: 240, gira: 0.6 }, pata: { txt: '¡LA PATA DE LA SILLA!', vuelo: 180, vz: 180 },
  botella: { txt: '¡BOTELLAZO! SALUD', vuelo: 160, vz: 160, sangra: 2.5 }, pico: { txt: '¡TAJO DE PICO!', seca: true, sangra: 5, col: '#ff5a5a' },
  faca: { txt: '¡FACAZO! SE DESANGRA', seca: true, sangra: 5.5, col: '#ff5a5a' }, termo: { txt: '¡TERMAZO! ...Y NO SE ROMPIÓ', vuelo: 220, vz: 190 },
  corvina: { txt: '¡CORVINAZO! QUEDÓ OLIENDO A PESCADO', vuelo: 170, vz: 170, gira: 0.3 }, bandeja: { txt: '¡BANDEJAZO! LA CUENTA', vuelo: 160, vz: 170 },
  escoba: { txt: '¡ESCOBAZO! BARRIDO', vuelo: 200, vz: 140 }, cana: { txt: '¡LO PESCASTE!', vuelo: 150, vz: 220 },
};
const FRENTE = { cuadra: ['carton', 'cajon', 'garrafa', 'cajaBiz', 'carton', 'botella'], feria: ['cajonFruta', 'carton', 'cajonF', 'naranja', 'carton'], avenida: ['cono', 'carton', 'botella', 'cajaBiz'],
  barriosur: ['carton', 'ladrillo', 'tacho', 'botella', 'cajaBiz'], ciudadvieja: ['barril', 'cajonFruta', 'botella', 'carton'], rambla: ['conservadora', 'carton', 'cajon', 'corvina'], boliche: ['barril', 'cajon', 'carton', 'botella'], cerro: ['ladrillo', 'carton', 'tacho', 'botella', 'cajon'] };

export class Juego {
  // nivel: índice en NIVELES; previo: {puntos, vidas, comboMax} que vienen del nivel anterior
  constructor(claveJugador, vista, ropa = null, nivel = 0, previo = null, opciones = null) {
    this.ropa = ropa; this.vista = vista; this.nivelIdx = nivel; const nv = this.nv = NIVELES[nivel];
    this.capaCalle = calle(nv).canvas;
    this.capaLejos = lejos(1600, nv.lejos, nv.hora); this.capaMedio = medio(2400, nv.medio, nv.hora); this.sol = sol(nv.hora);
    this.grado = gradoSuave(nv.hora); this.dif = nv.dif || 1; this.hpMul = 1 + (nv.num - 1) * 0.06;
    this.cieloC = null; this.cieloKey = '';
    this.ents = []; this.items = []; this.rompibles = []; this.decor = []; this.globos = []; this.perros = [];
    this.cam = 0; this.camPrev = 0; this.lock = null; this.ola = 0; this.colaSpawn = []; this.tSpawn = 0;
    this.hitstop = 0; this.temblor = 0; this.lento = 0; this.tiempo = 300; this.t = 0;
    this.puntos = previo ? previo.puntos : 0; this.vidas = previo ? previo.vidas : 3; this.combo = 0; this.tCombo = 0; this.comboMax = previo ? previo.comboMax : 0;
    this.dale = 0; this.estado = 'jugando'; this.tEstado = 0; this.jefe = null; this.miniActual = null; this.mensaje = null; this.bonus = 0;
    this.proxVida = previo && previo.proxVida ? previo.proxVida : 100000;
    this.stats = { golpes: 0, recibidos: 0, ko: 0 }; this._pan = { x: 0.5 };
    this.fx = new FX(); this.ev = new Eventos(this); this.sangre = new Sangre(this); if (GORE.nivel) this.sangre.calentar(this.grado);
    this.mods = efectos(); this.plataNivel = { enemigos: 0, objetos: 0 }; this.mods.vel0 = 1;
    this.j = this.crearJugador(claveJugador, 80, 228);
    { const j = this.j, m = this.mods; j.st = Object.assign({}, j.st, { vel: (j.st.vel || 60) * m.vel, atk: (j.st.atk || 1) * m.atk }); j.hpMax = Math.round(j.hpMax * m.hp) + m.hpExtra; j.hp = j.hpMax;
      this.vidas += m.vida; if (m.manoLlena) j.mano = 100; if (m.arma && ITEMS[m.arma]) { const it = this.soltarItem(m.arma, j.x, j.y, 0, 0); this.darArma(j, it); } }
    for (const d of nv.decor) this.decor.push({ ...d, sp: SP[d.t], solido: d.t !== 'carton' && d.t !== 'cono', vx: 0, golpeados: null, px: d.x });
    for (const r of nv.rompibles) this.rompibles.push({ ...r, hp: (ROMPIBLES[r.t] || { hp: 2 }).hp, roto: false, sacude: 0, id: uid++ });
    for (const it of nv.items) this.soltarItem(it.t, it.x, it.y, 0, 0);
    for (const p of nv.perros || []) this.perros.push({ x: p.x, y: p.y, f: 0, t: 0, est: 'quieto', cara: 1, ladra: 0 });
    // primer plano (parallax 1.25): cosas de la vereda de adelante, oscurecidas
    this.frente = []; const tipos = FRENTE[nv.escena] || FRENTE.cuadra;
    for (let fx = 260, i = 0; fx < nv.L * 1.25; fx += 300 + ((i * 137) % 220), i++) this.frente.push({ x: fx, sp: oscurecer(spriteG(SP[tipos[i % tipos.length]], this.grado)), baja: 8 + (i * 7) % 10 });
    this.olas = nv.oleadas.map((o) => ({ ...o }));
    { const sets = [this.j.sp]; for (const o of this.olas) for (const [k, v] of o.enemigos) sets.push(generar(k, v)); if (nv.oleadas.some((o) => (o.eventos || []).some((e) => e.t === 'llamadas'))) for (let v = 0; v < 3; v++) sets.push(generar('tambor', v)); partida(sets); this.setsG = sets; purgarGrado(sets, this.grado ? this.grado.clave : null); }
    this.olas[this.olas.length - 1].cam = nv.L - vista.w;
    // cinemáticas del nivel: sets de actores y retratos se preparan ya (al arrancar), no en medio de la pelea
    this.cine = null; this.t0 = 0; this.jefeClave = null;
    for (const o of nv.oleadas) for (const [k, v] of o.enemigos) if (ENEMIGOS[k].jefe) this.jefeClave = [k, v];
    { const gi = guionInicio(nv.id), gj = this.jefeClave ? JEFE[this.jefeClave[0]] : null, gf = FIN[nv.id]; const extra = [];
      for (const gl of [gi, gj, gf]) if (gl) for (const c of gl) { if (c.c === 'aparece') extra.push(generar(c.clave, c.v || 0)); if (c.c === 'dice') { const sp = c.id === 'j' ? this.j.sp : c.id === 'jefe' && this.jefeClave ? generar(this.jefeClave[0], this.jefeClave[1]) : c.clave ? generar(c.clave, c.v || 0) : null; if (sp) retratoCara(sp, c.cara); } }
      if (extra.length) partida([this.j.sp, ...extra]);
      this.sinCine = !!(opciones && opciones.sinCine);
      if (gi.length && !this.sinCine) this.iniciarCine(gi, () => { this.t0 = this.t; }); }
    musica(nv.musica); ambiente(nv.ambiente); sonar('evento.nivel.inicio'); this.dale = 3; this.cartel = 3.2;
  }
  // ------------------------------------------------------------- cinemáticas
  iniciarCine(guion, alTerminar) {
    const j = this.j; if (j && !j.muerto && j.est !== 'piso' && j.est !== 'vuela' && j.est !== 'agarrado') { if (j.agarrando) this.soltarAgarre(j); j.est = j.est === 'festeja' ? 'festeja' : 'quieto'; j.t = 0; j.atq = null; j.vx = j.vy = 0; }
    for (const e of this.ents) if (e.equipo === 'e' && !e.muerto && e.est === 'ataca') { e.est = 'quieto'; e.t = 0; e.atq = null; }
    this.cine = new Cinematica(this, guion, () => { this.cine = null; if (this.j) this.j.invul = Math.max(this.j.invul, 0.8); if (alTerminar) alTerminar(); });
    const bb = globalThis.__bb; if (bb && bb.bot && !bb.verCine) this.cine.saltar();
  }
  pasoCine(dt, entrada) {
    this.cine.paso(dt, entrada);
    for (const e of this.ents) this.fisica(e, dt);
    this.pasoItems(dt); this.fx.paso(dt); if (GORE.nivel) this.sangre.paso(dt);
    { const G = this.globos; let k = 0; for (let i = 0; i < G.length; i++) { const g = G[i]; g.t += dt; if (g.t < g.dur && !g.e.borrar) G[k++] = g; } G.length = k; }
    compactar(this.ents); compactar(this.items);
  }
  // ------------------------------------------------------------- creación
  crearJugador(clave, x, y) {
    const st = JUGADORES[clave]; const sp = generar(clave, 0, this.ropa);
    const e = this.nuevoLuchador(sp, x, y); Object.assign(e, { equipo: 'j', clave, st, hp: st.hp, hpMax: st.hp, nombre: st.nombre, mano: 0, invul: 1.0, combo: 0, escape: 0 });
    this.ents.push(e); return e;
  }
  nuevoLuchador(sp, x, y) {
    return { id: uid++, sp, x, y, z: 0, vx: 0, vy: 0, vz: 0, px: x, py: y, pz: 0, cara: 1, est: 'quieto', t: 0, anim: 'quieto', fr: 0, hp: 1, hpMax: 1, invul: 0,
      atq: null, golpeados: new Set(), conecto: false, cadena: 0, agarrando: null, agarradoPor: null, rodillas: 0, arma: null, tStun: 0, rebotes: 0, proyectil: null, muerto: false, borrar: false,
      intent: { mx: 0, my: 0 }, aereo: false, tAg: 0, juggle: 0, blink: 0, lanzo: false, buff: 0, tiron: 0, revolea: false };
  }
  crearEnemigo(clave, variante, x, y, mini = null) {
    const st = ENEMIGOS[clave]; const sp = generar(clave, variante);
    const e = this.nuevoLuchador(sp, x, y); const hp = Math.round(st.hp * this.hpMul * (mini ? mini.hp || 1.8 : 1));
    Object.assign(e, { equipo: 'e', clave, st, hp, hpMax: hp, nombre: pick(st.nombres), ia: { rol: 'rodear', retro: 0, cd: 0.6 + Math.random(), react: 0, ang: Math.random() * 6.28, tiro: 2 + Math.random() * 3, frase: 2 + Math.random() * 6, tCerca: 0, hits: 0, seguidos: 0, bloqueos: 0, dd: 0 } });
    if (st.jefe) { e.nombre = st.nombres[0]; this.jefe = e;
      const gj = JEFE[clave]; if (gj && !this._jefeCine && !this.sinCine) { this._jefeCine = true; this.iniciarCine(gj, () => { this.jefeIntro = 2.2; this.jefeIntroMax = 2.2; sonar('evento.jefe.aparece'); }); } }
    if (mini) { e.mini = true; e.nombre = mini.nombre; this.miniActual = e; this.mensaje = { txt: '¡' + mini.nombre + '!', t: 0, dur: 2 }; sonar('evento.mini.aparece'); this.globo(e, pick(FRASES.mini), 1.6); }
    if (st.armaFija) { const it = this.soltarItem(st.armaFija, x, y, 0, 0); this.darArma(e, it); it.fija = !st.suelta; }
    e.cara = x < this.j.x ? 1 : -1;
    this.ents.push(e); return e;
  }
  soltarItem(t, x, y, z = 0, vz = 0, vx = 0) {
    const d = ITEMS[t]; const it = { id: uid++, t, x, y, z, vz, vx, vy: 0, px: x, py: y, pz: z, est: z > 0 || vz ? 'cae' : 'piso', dur: (d && d.dur) || 0, mun: (d && d.municion) || 0, vida: 0, rot: 0, dueno: null, equipo: null, dmg: 0, arco: false, rebota: 0, vuelve: false, tVuelo: 0, reservado: null, fija: false };
    this.items.push(it); return it;
  }
  darArma(e, it) { e.arma = it; it.est = 'mano'; it.dueno = e; it.reservado = null; if (e.equipo === 'j') sonar('item.arma', this.pan(e.x)); }
  sinArma(e) { const it = e.arma; if (!it) return; e.arma = null; it.borrar = true; this.fx.astillas(e.x, e.y, 40, '#2a2a30'); sonar('arma.rompe', this.pan(e.x)); }
  pan(x) { this._pan.x = Math.max(0, Math.min(1, (x - this.cam) / this.vista.w)); return this._pan; }
  globo(e, txt, dur = 1.6) { for (let i = 0; i < this.globos.length; i++) if (this.globos[i].e === e) this.globos.splice(i--, 1); this.globos.push({ e, txt, t: 0, dur }); frase(txt, this.pan(e.x)); }
  globoLibre(x, y, txt) { this.fx.flotante(x, y, 0, txt, '#ffffff'); frase(txt, this.pan(x)); }

  // ------------------------------------------------------------- lógica
  paso(dt, entrada) {
    this.t += dt;
    for (const e of this.ents) { e.px = e.x; e.py = e.y; e.pz = e.z; }
    for (const it of this.items) { it.px = it.x; it.py = it.y; it.pz = it.z; }
    for (const d of this.decor) d.px = d.x;
    this.camPrev = this.cam;
    if (this.estado === 'gana' || this.estado === 'pierde') this.tEstado += dt;
    if (this.cartel > 0) this.cartel -= dt;
    if (this.lento > 0) { this.lento -= dt; dt *= 0.35; }
    this.temblor = Math.max(0, this.temblor - dt);
    if (this.cine) { this.temblor = Math.max(0, this.temblor - dt); this.pasoCine(dt, entrada); return; }
    if (this.estado === 'gana' && !this._finCine && this.tEstado > 1.1) { this._finCine = true; const gf = FIN[this.nv.id]; if (gf && !this.sinCine) this.iniciarCine(gf, null); }
    if (this.hitstop > 0) { this.hitstop -= dt; this.fx.paso(dt * 0.3); if (GORE.nivel) this.sangre.paso(dt * 0.3); return; }
    if (this.estado === 'jugando' && !(this.jefeIntro > 0)) { this.tiempo -= dt; if (this.tiempo <= 0) { this.tiempo = 120; this.danar(this.j, null, 999, { tumba: true, kb: 0, vz: 100 }, true); } }
    if (this.tCombo > 0) { this.tCombo -= dt; if (this.tCombo <= 0) this.combo = 0; }
    this.dale = Math.max(0, this.dale - dt);
    this.controlJugador(dt, entrada);
    director(this, dt);
    for (const e of this.ents) if (e.equipo === 'e') pensar(this, e, dt);
    for (const e of this.ents) this.fisica(e, dt);
    this.separar();
    for (const e of this.ents) if (e.atq) this.chequearGolpes(e);
    this.pasoItems(dt); this.pasoDecor(dt); this.pasoPerros(dt); this.ev.paso(dt); this.fx.paso(dt); this.pasoSangrado(dt); if (GORE.nivel) this.sangre.paso(dt);
    { const G = this.globos; let k = 0; for (let i = 0; i < G.length; i++) { const g = G[i]; g.t += dt; if (g.t < g.dur && !g.e.borrar) G[k++] = g; } G.length = k; }
    compactar(this.ents); compactar(this.items);
    if (this.miniActual && (this.miniActual.borrar || this.miniActual.muerto)) this.miniActual = null;
    this.camara(dt); this.oleadas(dt);
  }

  // ---------- jugador
  controlJugador(dt, E) {
    const j = this.j; if (!j || j.muerto) return;
    j.intent.mx = E.dx; j.intent.my = E.dy; j.corre = E.corre || 0;
    if (j.est === 'agarrado') { // agarrado por el patova: machacá para zafar
      if (E.buf.pina > 0 || E.buf.patada > 0 || E.buf.salto > 0 || Math.abs(E.dx) > 0.8 && !this._zafo) { j.escape += 0.24; }
      this._zafo = Math.abs(E.dx) > 0.8; E.buf.pina = 0; E.buf.patada = 0; E.buf.salto = 0;
      const a = j.agarradoPor; if (a && j.escape >= 1 && !a.revolea) { j.escape = 0; this.soltarAgarre(a); a.est = 'dolor'; a.t = 0; a.tStun = 0.7; a.vx = -a.cara * 60; j.est = 'quieto'; j.t = 0; j.invul = 0.5; sonar('mov.esquive'); this.fx.flotante(j.x, j.y, 70, '¡ZAFÉ!', '#7aff7a'); }
      return;
    }
    if (j.est === 'agarra' && j.agarrando) return this.controlAgarre(j, E);
    const libre = j.est === 'quieto' || j.est === 'camina';
    const enAire = j.est === 'salto';
    const cadenaOk = j.atq && j.conecto && j.t > j.atq.ini + j.atq.act * 0.5 && (j.atq === ATQ.pina1 || j.atq === ATQ.pina2);
    if ((E.buf.especial > 0 || (E.buf.pina > 0 && E.buf.salto > 0 && Math.abs(E.buf.pina - E.buf.salto) < 0.06)) && (libre || j.est === 'dolor' && j.t > 0.08 || cadenaOk)) {
      E.buf.especial = 0; E.buf.pina = 0; E.buf.salto = 0;
      if (j.mano >= 100) { j.mano = 0; this.atacar(j, ATQ.especial); }
      else if (j.hp > 8) { j.hp -= 8; this.atacar(j, ATQ.especial); }
      if (j.atq === ATQ.especial) { j.invul = Math.max(j.invul, 0.45); sonar('evento.especial'); voz(j.clave, 'especial'); if (Math.random() < 0.4) this.globo(j, pick(FRASES.jugador), 1); }
      return;
    }
    if (enAire && !j.aereo && (E.buf.pina > 0 || E.buf.patada > 0) && j.t > 0.05) { E.buf.pina = 0; E.buf.patada = 0; j.aereo = true; this.atacar(j, ATQ.voladora, true); return; }
    // cadena con arma: cada arma tiene su combo (ver MOVES)
    if (j.arma && E.buf.pina > 0 && j.est === 'ataca' && j.atq && j.atq.arma && j.atq.paso + 1 < j.atq.n && j.t > j.atq.ini + j.atq.act * 0.5 && !ITEMS[j.arma.t].soloTiro) {
      E.buf.pina = 0; const a = atqArma(j.arma.t, j.atq.paso + 1); this.atacar(j, a); if (a.txt) this.fx.flotante(j.x, j.y, 74, a.txt, '#ffd040'); return; }
    if (cadenaOk && E.buf.pina > 0) { E.buf.pina = 0; this.atacar(j, j.atq === ATQ.pina1 ? ATQ.pina2 : ATQ.pina3); return; }
    if (this.mods.remate && j.est === 'ataca' && j.atq === ATQ.pina3 && j.conecto && j.t > j.atq.ini + j.atq.act && (E.buf.patada > 0 || E.buf.pina > 0)) { E.buf.patada = 0; E.buf.pina = 0; this.atacar(j, ATQ.remate); this.fx.flotante(j.x, j.y, 74, '¡REMATE!', '#ff6aff'); return; }
    if (j.est === 'ataca' && j.atq === ATQ.pina2 && j.conecto && E.buf.patada > 0 && j.t > j.atq.ini) { E.buf.patada = 0; this.atacar(j, ATQ.patada); return; }
    if (!libre) return;
    if (E.buf.salto > 0) { E.buf.salto = 0; this.saltar(j); return; }
    if (E.buf.pina > 0) {
      E.buf.pina = 0;
      if (j.arma) { if (ITEMS[j.arma.t].soloTiro) this.tirarArma(j); else this.atacar(j, atqArma(j.arma.t)); return; }
      const it = this.itemCerca(j); const enem = this.enemigoCerca(j, 34);
      if (it && !enem) { this.juntar(j, it); return; }
      this.atacar(j, ATQ.pina1); return;
    }
    if (E.buf.patada > 0) { E.buf.patada = 0; if (j.arma) { this.tirarArma(j); return; }
      // pisotón: hay un caído al alcance y nadie parado pegado
      const caido = this.caidoCerca(j); if (caido && !this.enemigoCerca(j, 26)) { j.cara = Math.sign(caido.x - j.x) || j.cara; this.atacar(j, ATQ.pisoton); return; }
      if (this.mods.barrida && (E.dy > 0.6 || (Math.abs(E.dx) > 0.6 && Math.sign(E.dx) === -j.cara))) { if (Math.abs(E.dx) > 0.6) j.cara = Math.sign(E.dx); this.atacar(j, ATQ.j_barrida); return; }
      this.atacar(j, ATQ.patada); return; }
    // agarre: caminar contra un enemigo
    if (Math.abs(E.dx) > 0.5 && j.est === 'camina') {
      for (const e of this.ents) if (e.equipo === 'e' && !e.muerto && (e.est === 'quieto' || e.est === 'camina' || e.est === 'dolor') && e.z === 0 && !((e.st.jefe || e.st.noAgarre) && e.est !== 'dolor')) {
        const dx = e.x - j.x; if (Math.sign(dx) === Math.sign(E.dx) && Math.abs(dx) < 27 && Math.abs(e.y - j.y) < 6) { this.agarrar(j, e); return; }
      }
    }
  }
  controlAgarre(j, E) {
    const e = j.agarrando; j.tAg += 1 / 120;
    if (!e || e.muerto || e.est !== 'agarrado') { this.soltarAgarre(j); return; }
    if (j.tAg > 1.8) { this.soltarAgarre(j); e.est = 'quieto'; e.t = 0; e.vx = e.cara * -60; return; }
    if (j.anim === 'rodilla' && j.t < 0.22) return;
    if (j.anim === 'revolea') return;
    if (this.mods.cabezazo && E.buf.especial > 0) { E.buf.especial = 0; this.soltarAgarre(j); j.est = 'quieto'; this.atacar(j, ATQ.cabezazo); j.golpeados.add(e.id); this.impacto(j, e, ATQ.cabezazo, e.x - j.cara * 4, e.y, 50); j.conecto = true; return; }
    const atras = Math.sign(E.dx) === -j.cara && Math.abs(E.dx) > 0.5;
    if (E.buf.patada > 0 || (E.buf.pina > 0 && atras)) { E.buf.patada = 0; E.buf.pina = 0; j.anim = 'revolea'; j.t = 0; j.revolea = true; sonar('golpe.revoleo'); voz(j.clave, 'agarra'); return; }
    if (E.buf.pina > 0) {
      E.buf.pina = 0; j.anim = 'rodilla'; j.t = 0; j.rodillas++;
      const fin = j.rodillas >= 3;
      this.impacto(j, e, fin ? RODILLA_FIN : ATQ.rodilla, e.x - j.cara * 4, e.y, 36);
      if (fin) this.soltarAgarre(j);
    }
  }
  agarrar(a, e) {
    a.est = 'agarra'; a.t = 0; a.anim = 'agarra'; a.agarrando = e; a.rodillas = 0; a.tAg = 0; a.vx = 0; a.cara = Math.sign(e.x - a.x) || 1; a.revolea = false;
    e.est = 'agarrado'; e.t = 0; e.agarradoPor = a; e.atq = null; e.cara = -a.cara; e.vx = 0; e.y = a.y; e.escape = 0; sonar('mov.agarre', this.pan(a.x));
  }
  soltarAgarre(a) { const e = a.agarrando; if (e) { e.agarradoPor = null; if (e.est === 'agarrado') { e.est = 'quieto'; e.t = 0; } } a.agarrando = null; a.revolea = false; a.est = 'quieto'; a.t = 0; a.anim = 'quieto'; }
  saltar(e) { e.est = 'salto'; e.t = 0; e.vz = 270 * (e.st.salto || 1); e.vx = e.intent.mx * (e.st.vel || 60) * 1.15; e.vy = e.intent.my * (e.st.vel || 60) * 0.5; e.aereo = false; sonar('mov.salto', this.pan(e.x)); if (e.equipo === 'j' && Math.random() < 0.3) voz(e.clave, 'salto'); }
  atacar(e, a, aire = false) {
    e.est = 'ataca'; e.atq = a; e.t = 0; e.golpeados.clear(); e.conecto = false; e.anim = a.anim; e.lanzo = false;
    if (!aire) { e.vx = 0; e.vy = 0; }
    if (a.corta && e.equipo === 'e') { const q = this.fx.nueva('bloqueo', e.x + e.cara * 16, e.y, (e.sp ? e.sp.h : 44) * 0.55, 0.2); void q; sonar('arma.tiro', this.pan(e.x)); } // brillo de la hoja: aviso legible del tajo
    if (e.intent && Math.abs(e.intent.mx) > 0.3 && !aire && e.equipo === 'j') e.cara = Math.sign(e.intent.mx);
    if (a.aviso) { this.fx.aviso(e, a.ini); sonar('enem.aviso', this.pan(e.x)); }
    else if (!a.proy && a.dmg) sonar('mov.aire', this.pan(e.x));
    if (Math.random() < (e.equipo === 'j' ? 0.25 : 0.3)) voz(e.clave, 'ataque', this.pan(e.x));
  }
  itemCerca(e) { let m = null, md = 1e9; for (const it of this.items) { const d0 = ITEMS[it.t]; if (it.est === 'piso' && d0 && !d0.pelota && !d0.npc && !d0.proy && !d0.auto) { const d = Math.abs(it.x - e.x) + Math.abs(it.y - e.y) * 2; if (Math.abs(it.x - e.x) < 18 && Math.abs(it.y - e.y) < 10 && d < md) { m = it; md = d; } } } return m; }
  caidoCerca(e) { for (const o of this.ents) if (o.equipo === 'e' && !o.muerto && o.est === 'piso' && o.t > 0.12 && (o.pisados || 0) < 2 && Math.abs(o.x - e.x) < 40 && Math.abs(o.y - e.y) < 10) return o; return null; }
  enemigoCerca(e, r) { for (const o of this.ents) if (o.equipo !== e.equipo && !o.muerto && Math.abs(o.x - e.x) < r && Math.abs(o.y - e.y) < 12 && o.est !== 'piso') return o; return null; }
  juntar(j, it) {
    const d = ITEMS[it.t]; j.est = 'junta'; j.t = 0; j.anim = 'junta'; j.vx = 0; j.vy = 0;
    if (d.cura) { j.hp = Math.min(j.hpMax, j.hp + d.cura * this.mods.comida); if (d.mano) j.mano = Math.min(100, j.mano + d.mano); it.borrar = true; sonar(it.t === 'mate' ? 'item.mate' : 'item.comida'); this.fx.flotante(it.x, it.y, 40, d.txt, '#7aff7a'); this.globo(j, pick(FRASES.come), 1.2); }
    else if (d.puntos) { this.puntos += d.puntos; if (d.plata) this.sumarPlata(d.plata, 'objetos'); it.borrar = true; sonar('item.plata'); this.fx.flotante(it.x, it.y, 30, d.txt); }
    else if (d.arma) { this.darArma(j, it); this.fx.flotante(it.x, it.y, 40, d.nombre, '#ffd040'); }
  }
  tirarArma(e) {
    const it = e.arma; if (!it) return; const d = ITEMS[it.t];
    e.est = 'ataca'; e.atq = TIRO; e.anim = 'golpe'; e.t = 0; e.golpeados.clear(); e.conecto = true; e.lanzo = true;
    sonar('arma.tiro', this.pan(e.x));
    if (d.municion) { // bolsa de naranjas: tira una por vez
      const p = this.soltarItem('naranja1', e.x + e.cara * 14, e.y, 46, 120, e.cara * 300); this.volar(p, e, ITEMS.naranja1.tiro * (e.st.dmg || 1) * 1.3, true);
      it.mun--; if (it.mun <= 0) { e.arma = null; it.borrar = true; } return;
    }
    e.arma = null;
    this.volar(it, e, e.equipo === 'j' ? d.tiro * (e.st.dmg || 1) : d.tiro * 0.7 * this.dif, it.t === 'garrafa');
    it.x = e.x + e.cara * 14; it.y = e.y; it.z = 44; it.vx = e.cara * (it.t === 'garrafa' ? 230 : 330); it.vz = it.t === 'garrafa' ? 150 : 0;
  }
  volar(it, e, dmg, arco) { it.est = 'vuela'; it.dueno = e; it.equipo = e.equipo; it.dmg = dmg; it.arco = arco; it.tVuelo = 0; }
  // proyectiles de enemigos (gomera, naranjas, bandejas, boletos, chorizos)
  lanzarProy(e, p) {
    const n = p.n || 1; const mul = e.st.dmg / 8 * this.dif * (e.mini ? 1.25 : 1) * (e.buff > 0 ? 1.18 : 1);
    for (let i = 0; i < n; i++) {
      const it = this.soltarItem(p.t, e.x + e.cara * 12, e.y, p.z || 46, p.vz || 0, e.cara * p.v);
      this.volar(it, e, (ITEMS[p.t].tiro || 6) * mul, !!p.arco); it.vy = (i - (n - 1) / 2) * (p.abanico || 0); it.vuelve = !!p.vuelve; it.rebota = p.rebota || 0;
      if (p.vuelve) e.ia.bandejaFuera = true;
    }
  }

  // ---------- física / máquina de estados común
  fisica(e, dt) {
    e.t += dt; if (e.invul > 0) e.invul -= dt;
    let vel = e.st.vel || 50; if (e.arma && ITEMS[e.arma.t].pesada && e.equipo === 'j') vel *= 0.82; if (e.buff > 0) vel *= 1.15;
    switch (e.est) {
      case 'quieto': case 'camina': {
        const mx = e.intent.mx, my = e.intent.my; const m = Math.hypot(mx, my);
        if (m > 0.15) {
          if (e.corre && Math.sign(mx) === e.corre && !e.agarrando) { vel *= 1.8; e.corriendo = true; if ((e._polvo = (e._polvo || 0) - dt) <= 0) { e._polvo = 0.09; this.fx.polvo(e.x - e.corre * 8, e.y, 1); } } else e.corriendo = false;
          e.vx = mx * vel; e.vy = my * vel * 0.62; if (Math.abs(mx) > 0.2 && e.equipo === 'j') e.cara = Math.sign(mx);
          if (e.est !== 'camina') { e.est = 'camina'; e.t = 0; }
        } else { e.vx *= 0.5; e.vy *= 0.5; if (e.est !== 'quieto') { e.est = 'quieto'; e.t = 0; } }
        e.anim = e.est === 'quieto' && e.ia && e.ia.guardia ? 'bloquea' : e.est; break;
      }
      case 'salto': e.anim = 'salto'; break;
      case 'bloquea': e.anim = 'bloquea'; e.vx *= 0.85; e.vy = 0; if (e.t > 0.3) { e.est = 'quieto'; e.t = 0; } break;
      case 'ataca': {
        const a = e.atq;
        if (!e.lanzo && e.t >= a.ini) { e.lanzo = true; this.alArrancar(e, a); }
        if (a.dash && e.t > a.ini && e.t < a.ini + a.act) { e.vx = e.cara * a.dash; if (Math.random() < 0.3) this.fx.polvo(e.x - e.cara * 10, e.y, 1); }
        else if (!a.aire) { e.vx *= 0.8; e.vy *= 0.8; }
        if (a.giro) { e.cara = (Math.floor(e.t / 0.09) % 2) ? 1 : -1; }
        if (a.aire) { if (e.z <= 0 && e.t > 0.05) { e.est = 'quieto'; e.t = 0; e.atq = null; e.anim = 'quieto'; } }
        else if (e.t >= a.ini + a.act + a.rec * (e.equipo === 'j' ? 1 / (e.st.atk || 1) : (e.mini || (e.ia && e.ia.furia) ? 0.75 : 1))) {
          if (e.equipo === 'e' && e.conecto !== null && seguirCombo(this, e)) break;
          e.est = 'quieto'; e.t = 0; e.atq = null; e.anim = 'quieto';
          if (e.equipo === 'e') { e.ia.cd = Math.max(e.ia.cd, (0.5 + Math.random() * 0.8 * (e.st.pesado ? 1.6 : 1)) * (e.mini ? 0.65 : 1)); if (Math.random() < 0.45 && !e.st.jefe && !e.mini) e.ia.retro = 0.35 + Math.random() * 0.3; }
        }
        break;
      }
      case 'dolor': if (e.tiron > 0) e.tiron -= dt; else e.vx *= 0.88; e.vy = 0; if (e.t > e.tStun) { e.est = 'quieto'; e.t = 0; } break;
      case 'agarrado': {
        const a = e.agarradoPor; if (!a) { e.est = 'quieto'; break; }
        if (a.revolea) { // revoleo por encima del hombro
          if (a.t > 0.12) { const k = Math.min(1, (a.t - 0.12) / 0.14); e.x = a.x + a.cara * 20 * (1 - 2 * k); e.z = Math.sin(k * Math.PI) * 36; }
          if (a.t > 0.28) { const dir = -a.cara; a.revolea = false; a.agarrando = null; e.agarradoPor = null; this.lanzar(e, a, dir, 230, 150, a.equipo === 'j' ? 12 * (a.st.dmg || 1) : a.st.dmg * 1.4 * this.dif); a.est = 'quieto'; a.t = 0; a.anim = 'quieto'; if (a.ia) a.ia.cd = 0.8; }
        } else { e.x = a.x + a.cara * 21; e.y = a.y; e.z = 0; }
        e.anim = 'agarrado'; e.vx = 0; break;
      }
      case 'vuela': e.anim = 'vuela'; if (e.gira > 0) { e.gira -= dt; if (Math.floor(e.gira / 0.07) % 2 !== Math.floor((e.gira + dt) / 0.07) % 2) e.cara = -e.cara; } break;
      case 'piso': e.vx *= 0.8; e.anim = 'piso';
        if (e.muerto && e.equipo === 'e') { if (e.t > 0.9) { e.blink = 1; if (e.t > 1.6) this.morir(e); } }
        else if (e.muerto) { /* jugador: lo resuelve revisarJugador */ }
        else if (e.t > (e.equipo === 'j' ? 0.55 * this.mods.levanta : 0.75)) { e.est = 'levanta'; e.t = 0; sonar('mov.levanta', this.pan(e.x)); }
        break;
      case 'levanta': e.anim = 'levanta'; e.juggle = 0; e.pisados = 0; e.invul = Math.max(e.invul, 0.1); if (e.t > 0.28) { e.est = 'quieto'; e.t = 0; e.invul = e.equipo === 'j' ? 0.9 : 0.3; } break;
      case 'junta': e.anim = 'junta'; if (e.t > 0.16) { e.est = 'quieto'; e.t = 0; } break;
      case 'agarra': if (!e.agarrando) { e.est = 'quieto'; e.t = 0; } else if (e.anim !== 'revolea' && e.anim !== 'rodilla') e.anim = 'agarra'; else if (e.anim === 'rodilla' && e.t > 0.2) e.anim = 'agarra'; break;
      case 'festeja': e.anim = 'festeja'; e.vx = 0; e.vy = 0; break;
    }
    if (e.est !== 'agarrado') {
      e.x += e.vx * dt; e.y += e.vy * dt;
      if (e.z > 0 || e.vz !== 0) {
        e.vz -= GRAV * dt; e.z += e.vz * dt;
        if (e.est === 'vuela' && e.proyectil) this.chequearProyectil(e);
        if (e.z <= 0) {
          e.z = 0;
          if (e.est === 'vuela') {
            if (e.vz < -230 && e.rebotes < 1) { e.vz = -e.vz * 0.32; e.vx *= 0.6; e.rebotes++; sonar('impacto.rebote', this.pan(e.x)); this.fx.polvo(e.x, e.y, 6); this.temblor = Math.max(this.temblor, 0.12); }
            else { e.vz = 0; e.est = 'piso'; e.t = 0; e.vx *= 0.4; e.proyectil = null; sonar('impacto.piso', this.pan(e.x)); this.fx.polvo(e.x, e.y, 8); if (e.hp <= 0) e.muerto = true; }
          } else { e.vz = 0; if (e.est === 'salto' || (e.est === 'ataca' && e.atq && e.atq.aire)) { e.est = 'quieto'; e.t = 0; e.atq = null; e.vx = 0; e.vy = 0; this.fx.polvo(e.x, e.y, 3); sonar('mov.aterriza', this.pan(e.x)); } }
        }
      }
    }
    // límites
    e.y = Math.max(PISO.arriba, Math.min(PISO.abajo, e.y));
    if (e.equipo === 'j') e.x = Math.max(this.cam + 12, Math.min(this.cam + this.vista.w - 12, e.x));
    else if (e.est === 'vuela' || e.est === 'piso') e.x = Math.max(this.cam - 30, Math.min(this.cam + this.vista.w + 30, e.x));
    e.x = Math.max(10, Math.min(this.nv.L - 10, e.x));
    if (this.lock && e.equipo === 'e' && !(e.entrando > 0) && e.est !== 'vuela' && !(e.ia && e.ia.escapa)) { const m = e.st.jefe ? 44 : 10; e.x = Math.max(this.cam + m, Math.min(this.cam + this.vista.w - m, e.x)); }
    if (this.lock && this.lock.jefe && e.equipo === 'j') e.x = Math.max(this.cam + 24, Math.min(this.cam + this.vista.w - 24, e.x));
    if (e.est !== 'vuela') this.chocarDecor(e);
  }
  // lo que pasa en el cuadro en que arranca el golpe (proyectiles, tambor, silbato, brasas)
  alArrancar(e, a) {
    if (a.proy) this.lanzarProy(e, a.proy);
    if (a.buffo) { let n = 0; for (const o of this.ents) if (o.equipo === e.equipo && o !== e && !o.muerto && Math.abs(o.x - e.x) < 200) { o.buff = 4; n++; } this.fx.aro(e.x, e.y); if (n) this.fx.flotante(e.x, e.y, 70, '¡SE AGRANDAN!', '#ffd040'); }
    if (a.silba) this.ev.bondi(this.ola % 2 ? '121' : 'CA1', this.j.x > this.cam + this.vista.w / 2);
    if (a.brasas) this.ev.brasas(this.j.x, e.ia.f50 ? 4 : 3);
    if (a.son && (a.proy || a.buffo || a.silba || a.brasas || a.cubre)) sonar(a.son, this.pan(e.x));
  }
  chocarDecor(e) {
    for (const d of this.decor) { if (!d.solido) continue; this.empujarCaja(e, d.x, d.y, d.sp.w * 0.5 - 4, 7); }
    for (const r of this.rompibles) if (!r.roto) this.empujarCaja(e, r.x, r.y, SP[r.t].w * 0.5 - 3, 5);
  }
  empujarCaja(e, cx, cy, hw, hd) {
    const dx = e.x - cx, dy = e.y - (cy - hd); const ox = hw + 5 - Math.abs(dx), oy = hd + 3 - Math.abs(dy);
    if (ox > 0 && oy > 0 && e.z < 18) { if (ox < oy * 1.6) e.x += Math.sign(dx || 1) * ox; else { e.y += Math.sign(dy || 1) * oy;
      /* un enemigo que choca de frente contra un decorado se desliza hacia la punta más cercana (con el borde de pantalla, hacia la otra): lo rodea en vez de quedarse caminando en el lugar */
      if (e.equipo === 'e' && e.intent && Math.abs(e.intent.my) > 0.2) { let lado = Math.sign(dx) || 1; if (e.x + lado * (hw + 12) < this.cam + 12 || e.x + lado * (hw + 12) > this.cam + this.vista.w - 12) lado = -lado; e.x += lado * 0.7; } } }
  }
  separar() {
    const es = this.ents;
    for (let i = 0; i < es.length; i++) for (let k = i + 1; k < es.length; k++) {
      const a = es[i], b = es[k]; if (a.est === 'agarrado' || b.est === 'agarrado' || a.est === 'piso' || b.est === 'piso' || a.est === 'vuela' || b.est === 'vuela') continue;
      if (a.equipo === 'j' || b.equipo === 'j') continue;
      const dx = b.x - a.x, dy = (b.y - a.y) * 2.2; const d = Math.hypot(dx, dy);
      if (d < 24 && d > 0.01) { const p = (24 - d) * 0.25; a.x -= dx / d * p; b.x += dx / d * p; a.y -= dy / d * p * 0.3; b.y += dy / d * p * 0.3; }
    }
  }
  lanzar(e, por, dir, vx, vz, dmg) {
    e.est = 'vuela'; e.t = 0; e.vx = dir * vx; e.vz = vz; e.z = Math.max(e.z, 2); e.rebotes = 0; e.cara = -dir; e.atq = null;
    const p = e.proyectil || (e.proyectil = { por: null, dmg: 0, golpeados: new Set() }); p.por = por; p.dmg = dmg; p.golpeados.clear(); p.golpeados.add(e.id);
    e.hp -= dmg; this.contarGolpe(por, dmg, e); this.temblor = Math.max(this.temblor, 0.15); sonar('golpe.revoleo', this.pan(e.x));
    if (e.hp <= 0) { e.hp = 0; if (e.equipo === 'e') this.koEnemigo(e); }
  }
  chequearProyectil(e) {
    const p = e.proyectil; if (!p) return;
    for (const o of this.ents) {
      if (o === e || o.muerto || p.golpeados.has(o.id) || o.equipo === p.por.equipo || o.est === 'piso' || o.est === 'vuela' || o.invul > 0) continue;
      if (Math.abs(o.x - e.x) < 22 && Math.abs(o.y - e.y) < 12 && e.z < 50) { p.golpeados.add(o.id); this.impacto(p.por, o, CUERPO, o.x, o.y, 30); }
    }
    for (const r of this.rompibles) if (!r.roto && Math.abs(r.x - e.x) < 20 && Math.abs(r.y - e.y) < 12 && e.z < 40) this.romper(r);
    for (const d of this.decor) if (d.empuja && !d.vx && Math.abs(d.x - e.x) < d.sp.w / 2 + 6 && Math.abs(d.y - e.y) < 14) this.empujarContenedor(d, Math.sign(e.vx) || 1, p.por);
  }

  // ---------- golpes
  chequearGolpes(e) {
    const a = e.atq; if (e.t < a.ini || e.t > a.ini + a.act) return;
    if (a.aire && e.z <= 0) return; if (!a.dmg && !a.arma && !a.x[1]) return;
    const fac = e.equipo === 'j' ? 1.25 : 1.25; const a0 = a.x[0] * fac, a1 = a.x[1] * fac;
    for (const o of this.ents) {
      if (o === e || o.equipo === e.equipo || e.golpeados.has(o.id) || o.muerto) continue;
      if (a.alSuelo) { if (o.est !== 'piso' || (o.pisados || 0) >= 2) continue; }
      else if (o.est === 'piso' || o.est === 'levanta' || o.invul > 0) continue;
      if (o.est === 'agarrado' && o.agarradoPor !== e) continue;
      if (o.est === 'vuela' && o.juggle >= 2) continue;
      if (a.bajo && o.z > 10) continue; // la barrida no le pega al que salta
      const dx = (o.x - e.x) * (a.giro ? 1 : e.cara); const dy = Math.abs(o.y - e.y), dz = Math.abs(o.z - e.z);
      const ancho = o.st.ancho || (o.st.jefe ? 18 : 10);
      if (dy > (a.onda ? 18 : 11) || dz > (a.onda ? 6 : 36)) continue;
      if (a.giro || a.onda) { if (Math.abs(o.x - e.x) > a1 + ancho) continue; }
      else if (dx < a0 - ancho || dx > a1 + ancho) continue;
      e.golpeados.add(o.id); e.conecto = true;
      const hx = a.giro ? o.x : e.x + e.cara * Math.min(a1, Math.max(a0, dx));
      this.impacto(e, o, a, hx, (e.y + o.y) / 2, a.alSuelo ? 6 : a.aire ? e.z + 40 : (a === ATQ.pina3 ? 54 : a.anim === 'patada' ? 52 : 46));
      if (!a.onda && !a.giro && e.equipo === 'e') break;
    }
    if (e.equipo !== 'j') return;
    // rompibles
    for (const r of this.rompibles) {
      if (r.roto || e.golpeados.has(r.id)) continue;
      const hw = SP[r.t].w * 0.5; const dx = (r.x - e.x) * e.cara;
      if (Math.abs(r.y - e.y) < 14 && (a.giro ? Math.abs(r.x - e.x) < 44 + hw * 0.5 : dx > a0 - 10 - hw * 0.5 && dx < a1 + 6 + hw * 0.5)) {
        e.golpeados.add(r.id); r.hp -= a.pesada || a.tumba ? 2 : 1; r.sacude = 0.15; this.hitstop = 0.04; e.conecto = true;
        const R = ROMPIBLES[r.t] || {}; sonar('impacto.' + (R.mat || 'madera'), this.pan(r.x)); this.fx.chispa(r.x, r.y, 14);
        if (r.hp <= 0) this.romper(r);
      }
    }
    // contenedores con rueditas: se empujan de una patada
    if (a.empuja || a === ATQ.especial) for (const d of this.decor) {
      if (!d.empuja || e.golpeados.has(d)) continue; const dx = (d.x - e.x) * e.cara;
      if (Math.abs(d.y - e.y) < 16 && dx > 0 && dx < a1 + d.sp.w / 2) { e.golpeados.add(d); this.empujarContenedor(d, e.cara, e); this.hitstop = 0.05; }
    }
    // pelota
    for (const it of this.items) if (it.t === 'pelota' && it.est === 'piso' && !e.golpeados.has(it.id)) {
      const dx = (it.x - e.x) * e.cara; if (Math.abs(it.y - e.y) < 12 && dx > -4 && dx < a1 + 10) { e.golpeados.add(it.id); it.est = 'rueda'; it.vx = e.cara * 340; it.vz = 160; it.z = 2; it.dueno = e; it.equipo = e.equipo; sonar('golpe.patada'); }
    }
  }
  empujarContenedor(d, dir, por) { d.vx = dir * 280; d.por = por; d.golpeados = d.golpeados || new Set(); d.golpeados.clear(); sonar('evento.contenedor', this.pan(d.x)); this.fx.polvo(d.x - dir * 40, d.y, 4); }
  pasoDecor(dt) {
    for (const d of this.decor) {
      if (!d.vx) continue; d.x += d.vx * dt; d.vx *= Math.max(0, 1 - 2.2 * dt); if (Math.abs(d.vx) < 12) { d.vx = 0; continue; }
      if (Math.random() < 0.3) this.fx.polvo(d.x - Math.sign(d.vx) * d.sp.w / 2, d.y, 1);
      const hw = d.sp.w / 2;
      if (d.x < this.cam + hw || d.x > this.cam + this.vista.w - hw) { d.x = Math.max(this.cam + hw, Math.min(this.cam + this.vista.w - hw, d.x)); d.vx = -d.vx * 0.3; sonar('impacto.contenedor', this.pan(d.x)); this.temblor = Math.max(this.temblor, 0.12); }
      for (const o of this.ents) if (!o.muerto && o.est !== 'piso' && o.est !== 'vuela' && o.z < 30 && !d.golpeados.has(o.id) && o !== d.por && Math.abs(o.x - d.x) < hw + 8 && Math.abs(o.y - d.y) < 14) {
        d.golpeados.add(o.id); o.invul = 0; this.impacto(d.por || o, o, { dmg: o.equipo === 'j' ? 10 : 24, kb: 220, tumba: true, vz: 170, son: 'impacto.contenedor', hs: 0.07, crudo: true }, o.x, o.y, 40); o.vx = Math.sign(d.vx) * 240;
      }
      for (const r of this.rompibles) if (!r.roto && Math.abs(r.x - d.x) < hw + 10 && Math.abs(r.y - d.y) < 14) this.romper(r);
    }
  }
  romper(r) {
    r.roto = true; const R = ROMPIBLES[r.t] || { mat: 'madera', c: '#9a6a3a' };
    if (this.j && Math.random() < 0.7) this.soltarPlata(r.x, r.y, 10 + Math.round(Math.random() * 3) * 10, 'objetos');
    sonar('impacto.' + R.mat, this.pan(r.x));
    if (R.mat === 'vidrio') { this.fx.vidrios(r.x, r.y, 10); this.fx.astillas(r.x, r.y, 10, R.c); }
    else this.fx.astillas(r.x, r.y, 10, R.c);
    if (r.t === 'puesto' || r.t === 'cajonFruta') this.fx.fruta(r.x, r.y, 14);
    if (r.t === 'maceta') this.fx.polvo(r.x, r.y, 10); else this.fx.polvo(r.x, r.y, 6);
    if (r.da) this.soltarItem(r.da, r.x, r.y + 1, 14, 120);
  }
  // patova / Bocha / Capo con paraguas: paran golpes de frente
  bloquea(o, por, a) {
    if (!por || !o.ia || a.crudo || a.aire || a.giro || a === ATQ.especial || o.agarradoPor) return false;
    if ((Math.sign(por.x - o.x) || 1) !== o.cara) return false;
    if (o.est === 'ataca' && o.atq && o.atq.cubre) return true;
    if (o.est !== 'quieto' && o.est !== 'camina' && o.est !== 'bloquea') return false;
    if (a.arma) return false; // las armas rompen la guardia: para eso están
    if (o.st.ia === 'patova') return !a.remate && !a.empuja;
    if (o.ia.guardia) return !a.remate && !a.empuja;
    return false;
  }
  impacto(e, o, a, hx, hy, hz) {
    const conArma = a.arma && e.arma; const dArma = conArma ? ITEMS[e.arma.t] : null;
    if (e !== o && this.bloquea(o, e, a)) { // ¡bloqueado!
      this.fx.bloqueo(hx, hy, hz); sonar('impacto.bloqueo', this.pan(hx)); this.hitstop = Math.max(this.hitstop, 0.05);
      if (o.est !== 'ataca') { o.est = 'bloquea'; o.t = 0; o.vx = -o.cara * 30; } e.vx = -e.cara * 90; o.ia.bloqueos = (o.ia.bloqueos || 0) + 1;
      // no se queda bloqueando para siempre: el Bocha contragolpea enseguida; el patova, al tercer golpe parado, te agarra
      if (o.est === 'bloquea') { if (o.clave === 'bocha') { o.cara = Math.sign(e.x - o.x) || o.cara; this.atacar(o, ATQ.j_contra); } else if (o.st.ia === 'patova' && o.ia.bloqueos >= 3) { o.ia.bloqueos = 0; this.atacar(o, ATQ.e_agarre); } }
      if (e.equipo === 'j' && o.ia.bloqueos === 1 && !this.avisoBloqueo) { this.avisoBloqueo = true; this.fx.flotante(o.x, o.y, 80, '¡DE FRENTE NO! PATADA O DE ATRÁS', '#ffd040'); }
      return;
    }
    let dmg;
    if (a.crudo) dmg = a.dmg;
    else if (e.equipo === 'j') dmg = conArma && !dArma.npc ? dArma.dmg * (a.kDmg || 1) * (e.st.dmg || 1) : a.dmg * (e.st.dmg || 1);
    else { dmg = (conArma && !e.st.armaFija ? dArma.dmg * 0.75 : a.dmg * e.st.dmg) * this.dif * (e.mini ? 1.25 : 1) * (e.buff > 0 ? 1.18 : 1); }
    if (o.equipo === 'j' && o.clave === 'pelado') dmg *= 0.9;
    let crit = false;
    if (e.equipo === 'j' && !a.crudo) { const m = this.mods; dmg *= m.dmg * (conArma ? 1 : m.dmgMano); if (m.crit > 0 && Math.random() < m.crit) { dmg *= 1.6; crit = true; } }
    if (o.equipo === 'j') dmg *= this.mods.def;
    const grande = !!(a.tumba || dmg >= 10);
    this.fx.chispa(hx, hy, hz, grande);
    // tipo de golpe para la sangre, el hit-stop y el temblor: 0 piña, 1 patada, 2 pesado, 3 arma, 4 corte, 5 especial
    const corta = (conArma && dArma.corta) || a.corta || (conArma && dArma.rompe && e.arma.dur <= 1);
    const tipo = a === ATQ.especial || a.giro ? 5 : corta ? 4 : conArma ? (dArma.pesada ? 2 : 3) : (a.tumba || dmg >= 10 || a.remate) ? 2 : (a.anim === 'patada' || a.anim === 'rodilla' || a.anim === 'barrida') ? 1 : 0;
    if (o.hpMax) { if (GORE.nivel) this.sangre.golpe(o, e, hx, hy, hz, tipo, dmg, hz >= (o.sp ? o.sp.h * 0.62 : 30)); this._golpeado = o;
      if (corta) { o.sangra = Math.max(o.sangra || 0, o.equipo === 'j' ? 2.4 : 3.2); this.hitstop = Math.max(this.hitstop, 0.075); this.temblor = Math.max(this.temblor, 0.1); }
      if (tipo === 2 || tipo === 5) { this.hitstop = Math.max(this.hitstop, (a.hs || 0.05) + 0.02); this.temblor = Math.max(this.temblor, 0.18); } }
    if (conArma && dArma.metal) for (let i = 0; i < 6; i++) { const b = this.fx.nueva('brasa', hx, hy, hz, 0.25 + Math.random() * 0.2); b.vx = (Math.random() - 0.5) * 220; b.vz = 40 + Math.random() * 160; }
    sonar(conArma && dArma.son ? dArma.son : a.son || 'golpe.pina', { x: this.pan(hx).x, vol: grande ? 1.2 : 1 });
    this.hitstop = Math.max(this.hitstop, a.hs || 0.05);
    if (grande) this.temblor = Math.max(this.temblor, 0.14);
    this._armaGolpe = conArma ? e.arma.t : null; // para la muerte según el arma (se lee en danar)
    // durabilidad del arma (las armas propias de jefes no se gastan)
    if (conArma && !e.arma.fija && dArma.dur && (e.equipo === 'j' || !e.st.armaFija)) { const it = e.arma; it.dur--; if (it.dur <= 0) this.romperArma(e, it, hx, hy, hz); }
    if (e.equipo === 'j' && e !== o) this.contarGolpe(e, dmg, o);
    // el chorro te arrebata el arma o la plata
    if (a.roba && o.equipo === 'j' && e.ia) {
      if (o.arma) { const it = o.arma; o.arma = null; this.darArma(e, it); it.fija = false; this.fx.flotante(o.x, o.y, 70, '¡TE ROBÓ EL ' + ITEMS[it.t].nombre + '!', '#ff8a5a'); }
      else { const tot = this.plataNivel.enemigos + this.plataNivel.objetos, p = Math.min(80, tot); const pe = Math.min(p, this.plataNivel.enemigos); this.plataNivel.enemigos -= pe; this.plataNivel.objetos -= p - pe; e.ia.plata = (e.ia.plata || 0) + p; if (p) this.fx.flotante(o.x, o.y, 70, '-$U ' + p, '#ff8a5a'); }
      sonar('item.robado', this.pan(o.x)); e.ia.huye = 3.2; e.ia.dirHuye = 0; this.globo(e, pick(FRASES.robo), 1.2);
    }
    this.danar(o, e, dmg, a); this._armaGolpe = null;
    if (e.equipo === 'j' && o.hpMax) { if (this.mods.kb !== 1 && (o.est === 'vuela' || o.est === 'dolor')) o.vx *= this.mods.kb; if (crit) { this.fx.flotante(hx, hy, hz + 26, '¡CRÍTICO!', '#ff6aff'); this.hitstop = Math.max(this.hitstop, 0.08); this.temblor = Math.max(this.temblor, 0.12); } }
    // la caña engancha y te trae
    if (a.engancha && o.est === 'dolor') { o.vx = Math.sign(e.x - o.x) * 300; o.tiron = 0.32; sonar('enem.cana.engancha', this.pan(o.x)); }
    // el patova te agarra
    if (a.agarre && o.equipo === 'j' && !o.muerto && o.hp > 0 && o.est !== 'vuela') { this.agarrar(e, o); e.tAg = 0; o.escape = 0; this.fx.flotante(o.x, o.y, 80, '¡MACHACÁ PARA ZAFAR!', '#ffd040'); }
  }
  // remate según el arma: cada una deja al finado distinto (texto, vuelo, sangre)
  muerteArma(o, dir, t) {
    const d = ITEMS[t]; if (!d) return; const M = MUERTE_ARMA[t] || (d.corta ? MUERTE_ARMA.faca : d.pesada ? MUERTE_ARMA.cano : null); if (!M) return;
    if (M.vuelo) { o.vx = dir * Math.max(Math.abs(o.vx), M.vuelo); o.vz = Math.max(o.vz, M.vz || 180); }
    if (M.gira) o.gira = M.gira;
    if (M.seca) { o.vx = dir * 40; o.vz = 70; } // se desploma en el lugar
    if (M.sangra && GORE.nivel) o.sangra = Math.max(o.sangra || 0, M.sangra);
    this.fx.flotante(o.x, o.y, (o.sp ? o.sp.h : 44) + 18, M.txt, M.col || '#ffd040'); this.hitstop = Math.max(this.hitstop, 0.09); this.temblor = Math.max(this.temblor, 0.16);
  }
  romperArma(e, it, hx, hy, hz) {
    const d = ITEMS[it.t]; e.arma = null; it.borrar = true;
    if (d.rompe) { this.fx.vidrios(hx, hy, hz); sonar('impacto.vidrio', this.pan(hx)); }
    else { this.fx.astillas(hx, hy, hz, d.astilla || '#9a6a3a'); sonar('arma.rompe', this.pan(hx)); }
    if (d.deja) { const n = this.soltarItem(d.deja, e.x, e.y, 0, 0); this.darArma(e, n); this.fx.flotante(hx, hy, hz + 20, d.dejaTxt || '¡QUEDÓ LA PATA!', '#ffd040'); if (d.dejaTxt) sonar('arma.botella.rompe', this.pan(hx)); }
  }
  contarGolpe(e, dmg, o) {
    if (!e || e.equipo !== 'j') return;
    this.combo++; this.tCombo = 2.2; this.comboMax = Math.max(this.comboMax, this.combo); this.stats.golpes++;
    const bonus = 1 + Math.min(14, this.combo) * 0.5; this.puntos += Math.round(dmg * 10 * bonus);
    e.mano = Math.min(100, (e.mano || 0) + dmg * 1.6 * this.mods.mano); void o;
  }
  danar(o, por, dmg, a, sinInvul = false) {
    if (o.invul > 0 && !sinInvul) return;
    if (o.agarradoPor && o.agarradoPor !== por) this.soltarAgarre(o.agarradoPor);
    if (o.agarrando) this.soltarAgarre(o);
    o.hp -= dmg;
    if (GORE.nivel && o.hpMax && this._golpeado !== o && dmg > 0) this.sangre.golpe(o, por, o.x, o.y, (o.sp ? o.sp.h : 40) * 0.55, a.tumba ? 2 : 0, dmg, false);
    this._golpeado = null;
    if (o.equipo === 'j') { this.combo = 0; this.tCombo = 0; this.stats.recibidos++; if (o.arma && (a.tumba || o.hp <= 0)) this.soltarArma(o); if (Math.random() < 0.3) this.globo(o, pick(FRASES.dolor), 0.9); voz(o.clave, o.hp <= 0 ? 'ko' : 'dolor'); }
    else { if (o.ia) o.ia.hits++; if (o.hp > 0 && Math.random() < 0.12) this.globo(o, pick(FRASES.dolor), 0.9); if (Math.random() < 0.3) voz(o.clave, 'dolor', this.pan(o.x)); }
    if (a.alSuelo && o.est === 'piso') { o.pisados = (o.pisados || 0) + 1; o.t = 0; o.z = 0; o.vz = 0; o.vx = 0; this.temblor = Math.max(this.temblor, 0.12); this.fx.polvo(o.x, o.y, 6); if (o.hp <= 0) { o.hp = 0; o.muerto = true; if (GORE.nivel && !o.ko) this.sangre.ko(o, por, true); if (o.equipo === 'e') this.koEnemigo(o); } return; }
    const dir = por ? Math.sign(o.x - por.x) || por.cara : -o.cara;
    let tumba = a.tumba || (a.tumbaSiAturdido && o.est === 'dolor') || o.hp <= 0 || o.est === 'vuela' || o.z > 0;
    // jefes y mini jefes aguantan: sólo caen con remates
    if ((o.st.jefe || o.mini) && o.hp > 0) { if (!(a === ATQ.especial || a.remate || a.crudo || (a.tumbaSiAturdido && o.ia.hits >= 4))) tumba = false; if (o.est === 'ataca' && o.atq && (o.atq.dash || o.atq.onda) && !a.crudo) { o.blink = 0.08; return; } }
    if (o.st.pesado && !tumba && a.dmg < 6 && Math.random() < 0.3) { o.blink = 0.06; return; } // los pesados a veces ni se mosquean
    if (tumba) {
      if (o.arma && o.equipo === 'e' && !o.arma.fija) this.soltarArma(o);
      o.est = 'vuela'; o.t = 0; o.vx = dir * (a.kb || 100) / (o.st.peso || (o.st.jefe ? 1.6 : 1)); o.vz = a.vz || 140; o.z = Math.max(o.z, 1); o.rebotes = 0; o.atq = null; o.cara = -dir; o.juggle = (o.juggle || 0) + 1;
      if (o.z > 1) o.vz = Math.max(o.vz, 120);
      if (a.gira) o.gira = 0.55;
      if (o.ia) o.ia.hits = 0;
      if (o.hp <= 0 && o.equipo === 'e' && this._armaGolpe) this.muerteArma(o, dir, this._armaGolpe);
    } else {
      o.est = 'dolor'; o.t = 0; o.tStun = a.stun || 0.3; o.vx = dir * (a.kb || 30); o.atq = null; o.anim = 'dolor'; o.fr = (AL_CUERPO[a.anim] ? 1 : 0) ^ (Math.random() < 0.2 ? 1 : 0); // cabeza para atrás o doblado según dónde entró o.cara = -dir; o.juggle = 0;
    }
    if (o.hp <= 0) { o.hp = 0; if (GORE.nivel && !o.ko) this.sangre.ko(o, por, o.equipo === 'e' && (o.st.jefe || a === ATQ.especial || a.remate || a.giro || dmg >= 14)); if (o.equipo === 'e') this.koEnemigo(o); }
  }
  // sangrado por corte (faca, vidrio): saca de a poco pero nunca remata (queda en 1); y la herida del jugador se limpia al curarse
  pasoSangrado(dt) {
    for (const e of this.ents) if (e.sangra > 0 && e.hpMax) { e.sangra -= dt; if (e.hp > 1 && !e.muerto && this.estado === 'jugando') e.hp = Math.max(1, e.hp - (e.equipo === 'j' ? 1.6 : 3.5) * dt); }
    const j = this.j; if (!j || !j.hpMax) return; const st = etapa(j);
    if (j._st !== undefined && st < j._st && !j.muerto && j.hp > 0) { if (GORE.nivel) this.sangre.limpieza(j, this.fx); j.sangra = 0; if (st < 2) j.herC = 0; if (st < 3) j.herT = 0; }
    j._st = st;
  }
  koEnemigo(o) {
    if (o.ko) return; o.ko = true; this.stats.ko++; this.puntos += o.st.puntos * (o.mini ? 2 : 1); voz(o.clave, 'ko', this.pan(o.x));
    if (o.st.jefe) { this.lento = 1.4; this.temblor = 0.5; sonar('evento.jefe.ko'); this.globo(o, FRASES[o.clave].ko, 2); }
    else if (Math.random() < 0.5) this.globo(o, pick(FRASES.ko), 1.1);
    if (o.ia.botin) this.soltarItem(o.ia.botin, o.x, o.y, 20, 100);
    if (o.ia.plata) this.soltarPlata(o.x, o.y, o.ia.plata);
    this.soltarPlata(o.x, o.y, Math.round(o.st.puntos / (o.st.jefe ? 20 : 16)) * (o.mini ? 2 : 1));
    if (o.mini) this.soltarItem(pick(['chivito', 'choripan']), o.x, o.y, 20, 110);
    else if (!o.st.jefe && Math.random() < 0.12) this.soltarItem(pick(['billete', 'bizcochos', 'alfajor']), o.x, o.y, 20, 100);
  }
  // plata: monedas que saltan y se juntan solas (cada una vale lo suyo; como mucho 6 por golpe)
  soltarPlata(x, y, total, de = 'enemigos') {
    if (!(total > 0)) return; const n = Math.max(1, Math.min(6, Math.round(total / 15))); let resto = total;
    for (let i = 0; i < n; i++) { const v = i === n - 1 ? resto : Math.round(total / n); resto -= v; const it = this.soltarItem('moneda', x, y, 24, 110 + Math.random() * 70, (Math.random() - 0.5) * 120); it.vy = (Math.random() - 0.5) * 40; it.valor = v; it.de = de; }
  }
  sumarPlata(v, de) { const n = Math.round(v * this.mods.plata); this.plataNivel[de] += n; return n; }
  escapo(e) { // el chorro se fue con el botín
    e.borrar = true; e.muerto = true; if (e.arma) { e.arma.borrar = true; e.arma = null; }
    this.mensaje = { txt: e.ia.botin ? '¡SE LLEVÓ LA COMIDA!' : e.ia.plata ? '¡SE LLEVÓ TU PLATA!' : '¡SE TE ESCAPÓ!', t: 0, dur: 1.6 };
  }
  morir(e) { e.borrar = true; if (e.ia && e.ia.item) e.ia.item.reservado = null; if (e.arma) { if (e.arma.fija) e.arma.borrar = true; else this.soltarArma(e); } }
  soltarArma(e) { const it = e.arma; if (!it) return; e.arma = null; it.est = 'cae'; it.dueno = null; it.x = e.x; it.y = e.y; it.z = 30; it.vz = 120; it.vx = -e.cara * 40; it.fija = false; if (ITEMS[it.t].npc) it.borrar = true; }

  // ---------- jugador: muerte y vidas
  revisarJugador() {
    const j = this.j;
    if (j.hp <= 0 && j.est !== 'piso' && j.est !== 'vuela') { j.tCero = (j.tCero || 0) + 1 / 120; if (j.tCero > 0.4) { this.anomalias = (this.anomalias || 0) + 1; this.ultimaAnomalia = j.est + '/' + j.anim; j.tCero = 0; if (j.agarradoPor) this.soltarAgarre(j.agarradoPor); if (j.agarrando) this.soltarAgarre(j); j.est = 'vuela'; j.vz = 120; j.z = 1; j.atq = null; } } else j.tCero = 0;
    if ((j.hp <= 0 || j.muerto) && j.est === 'piso' && j.t > 0.8 && this.estado === 'jugando') {
      this.vidas--; this.vidasPerdidas = (this.vidasPerdidas || 0) + 1;
      if (this.vidas < 0) { this.estado = 'pierde'; this.tEstado = 0; this.vidas = 0; musica('mus.derrota'); return; }
      j.hp = j.hpMax; j.muerto = false; j.est = 'levanta'; j.t = 0; j.invul = 2.5; sonar('evento.revive');
      for (const e of this.ents) if (e.equipo === 'e' && !e.muerto && Math.abs(e.x - j.x) < 120) this.danar(e, j, 0, { tumba: true, kb: 140, vz: 130 }, true);
      this.fx.aro(j.x, j.y);
    }
  }

  // ---------- ítems
  pasoItems(dt) {
    for (const it of this.items) {
      it.vida += dt; const d = ITEMS[it.t] || {};
      if (it.est === 'mano') { const du = it.dueno; if (!du || du.borrar) { it.est = 'cae'; it.z = 20; if (d.npc) it.borrar = true; } else { it.x = du.x; it.y = du.y; } continue; }
      if (it.est === 'cae' || it.est === 'vuela' || it.est === 'rueda') {
        it.tVuelo += dt;
        // la bandeja del mozo vuelve como un bumerán
        if (it.vuelve && it.tVuelo > 0.65 && it.dueno && !it.dueno.borrar) { const du = it.dueno; const sx = Math.sign(du.x - it.x) || 1; it.vx += sx * 900 * dt; it.vx = Math.max(-300, Math.min(300, it.vx)); it.vy = (du.y - it.y) * 3; if (Math.abs(du.x - it.x) < 14 && it.tVuelo > 0.9) { it.borrar = true; du.ia.bandejaFuera = false; continue; } }
        it.x += it.vx * dt; it.y += it.vy * dt; if (it.est !== 'vuela' || it.arco) it.vz -= GRAV * dt; it.z += it.vz * dt; it.rot += dt * 14 * Math.sign(it.vx || 1);
        if ((it.est === 'vuela' || it.est === 'rueda') && it.equipo) {
          for (const o of this.ents) {
            if (o.equipo === it.equipo || o.muerto || o.est === 'piso' || o.invul > 0 || o === it.dueno) continue;
            if (Math.abs(o.x - it.x) < 14 && Math.abs(o.y - it.y) < 10 && it.z < 70) {
              if (it.t === 'garrafa') { this.explotar(it); break; }
              const pel = it.t === 'pelota';
              this.impacto(it.dueno || o, o, { dmg: pel ? 4 : it.dmg || 10, kb: d.kb || 110, tumba: !pel && !d.proy, vz: 120, stun: d.stun || 0.4, son: d.son || (it.t === 'botella' ? 'impacto.vidrio' : 'impacto.madera'), hs: 0.07, crudo: true }, it.x, it.y, it.z);
              if (it.t === 'botella') { it.borrar = true; this.fx.vidrios(it.x, it.y, it.z); }
              else if (d.seRompe) { it.borrar = true; if (d.fruta) this.fx.fruta(it.x, it.y, it.z, d.fruta); else this.fx.astillas(it.x, it.y, it.z, '#a8605a'); }
              else if (pel) { it.vx = -it.vx * 0.4; it.vz = 120; it.equipo = null; }
              else if (it.vuelve) { it.vx = -it.vx; }
              else { it.vx = -it.vx * 0.2; it.est = 'cae'; it.vz = 100; it.equipo = null; it.dur = Math.max(1, it.dur - 3); }
              break;
            }
          }
          // lo que tira el jugador rompe cajones y puestos
          if (it.est === 'vuela' && it.equipo === 'j') for (const r of this.rompibles) if (!r.roto && Math.abs(r.x - it.x) < SP[r.t].w / 2 && Math.abs(r.y - it.y) < 12 && it.z < SP[r.t].h + 4) { this.romper(r); if (d.seRompe || it.t === 'botella') it.borrar = true; else { it.vx = -it.vx * 0.2; it.est = 'cae'; it.equipo = null; } break; }
        }
        if (it.x < this.cam - 40 || it.x > this.cam + this.vista.w + 40) { if (it.est === 'vuela') it.borrar = true; }
        if (it.z <= 0) {
          it.z = 0;
          if (it.est === 'vuela') {
            if (it.t === 'garrafa') { this.explotar(it); continue; }
            if (it.rebota > 0) { it.rebota--; it.vz = 150; it.z = 1; sonar('impacto.piso', this.pan(it.x)); continue; }
            if (it.t === 'botella') { it.borrar = true; this.fx.vidrios(it.x, it.y, 4); sonar('impacto.vidrio', this.pan(it.x)); continue; }
            if (d.seRompe) { it.borrar = true; if (d.fruta) this.fx.fruta(it.x, it.y, 2, d.fruta); else this.fx.astillas(it.x, it.y, 2, '#8a8490'); sonar(d.son || 'impacto.piso', this.pan(it.x)); continue; }
            if (d.npc) { it.borrar = true; continue; }
          }
          if (it.vz < -90) { it.vz = -it.vz * 0.4; it.vx *= 0.6; } else { it.vz = 0; it.vx = it.t === 'pelota' ? it.vx * 0.97 : 0; it.vy = 0; if (Math.abs(it.vx) < 8) { it.est = 'piso'; it.equipo = null; } else it.est = 'rueda'; }
        }
      }
      it.y = Math.max(PISO.arriba, Math.min(PISO.abajo, it.y));
      if (it.est === 'piso') for (const d of this.decor) { if (!d.solido) continue; const hw = d.sp.w * 0.5 - 4; if (Math.abs(it.x - d.x) < hw && Math.abs(it.y - d.y) < 8) { it.y = d.y + 9 <= PISO.abajo ? d.y + 9 : d.y - 9; } /* siempre adelante del decorado: alcanzable en línea recta (atrás quedaba escondido e inalcanzable contra el borde) */ }
      if (it.est === 'piso' || it.est === 'cae') it.x = Math.max(this.cam + 10, Math.min(this.cam + this.vista.w - 10, it.x));
      if (it.t === 'moneda' && it.est === 'piso' && it.vida > 0.35) { const j = this.j; if (!j.muerto && Math.abs(j.x - it.x) < 18 && Math.abs(j.y - it.y) < 11 && j.z < 20) { it.borrar = true; const n = this.sumarPlata(it.valor || 10, it.de || 'enemigos'); sonar('item.plata', this.pan(it.x)); this.fx.flotante(it.x, it.y, 26, '+$U ' + n, '#7aff7a'); continue; } }
      if (it.t === 'pelota' && it.est === 'piso') { const j = this.j; if (Math.abs(j.x - it.x) < 10 && Math.abs(j.y - it.y) < 6 && j.est === 'camina') { it.est = 'rueda'; it.vx = j.cara * 120; it.vz = 40; it.equipo = null; it.dueno = j; } }
    }
  }
  explotar(it) {
    it.borrar = true; sonar('impacto.explosion', this.pan(it.x)); this.fx.explosion(it.x, it.y); this.hitstop = 0.08; this.temblor = Math.max(this.temblor, 0.4);
    for (const o of this.ents) { if (o.muerto || o.est === 'piso') continue; const d = Math.hypot(o.x - it.x, (o.y - it.y) * 2); if (d < 64) { o.invul = 0; this.impacto(it.dueno || o, o, { dmg: o.equipo === 'j' ? 14 : 24, kb: 180, tumba: true, vz: 220, son: 'impacto.explosion', hs: 0.05, crudo: true }, o.x, o.y, 30); } }
    for (const r of this.rompibles) if (!r.roto && Math.abs(r.x - it.x) < 60 && Math.abs(r.y - it.y) < 25) this.romper(r);
    for (const d of this.decor) if (d.empuja && Math.abs(d.x - it.x) < 90 && Math.abs(d.y - it.y) < 30) this.empujarContenedor(d, Math.sign(d.x - it.x) || 1, it.dueno);
  }

  // ---------- perros
  pasoPerros(dt) {
    for (const p of this.perros) {
      p.t += dt; const j = this.j; let pelea = false; if (this.lock) for (const e of this.ents) if (e.equipo === 'e' && Math.abs(e.x - p.x) < 140) { pelea = true; break; }
      if (p.est === 'huye') { p.x += p.cara * 110 * dt; p.f = Math.floor(p.t * 10) % 2; if (p.x < this.cam - 60 || p.x > this.cam + this.vista.w + 60) p.est = 'fuera'; continue; }
      if (p.est === 'fuera') { if (!pelea && p.x < this.cam - 50) { p.x = this.cam + this.vista.w + 40; p.y = 250 + Math.random() * 12; p.est = 'quieto'; p.vuelve = true; } else if (!pelea && p.x > this.cam + this.vista.w + 30 && p.vuelve) { p.est = 'camina'; p.cara = -1; } continue; }
      if (p.est === 'camina') { p.x += p.cara * 40 * dt; p.f = Math.floor(p.t * 8) % 2; if (p.x < this.cam + this.vista.w * 0.75) p.est = 'quieto'; }
      if (pelea) { p.ladra -= dt; p.f = 2; if (p.ladra <= 0) { sonar('evento.perro', this.pan(p.x)); p.ladra = 0.8; p.cara = Math.sign(j.x - p.x) || 1; } if (p.t > 2.5) { p.est = 'huye'; p.t = 0; p.cara = -1; } }
      else if (p.est === 'quieto') { p.f = Math.abs(j.x - p.x) < 60 ? 2 : 0; p.cara = Math.sign(j.x - p.x) || 1; p.t = Math.min(p.t, 1); }
    }
  }

  // pre-gradar en el tiempo libre del cuadro los cuadros ya dibujados (evita tirones la primera vez que aparece una pose)
  gradarOcioso(ms) {
    const G = this.grado; if (!G || !this.setsG) return 0; const t0 = performance.now(); let n = 0;
    const pasar = (arr) => { for (const f of arr) { if (!f || (f._g && f._g[G.clave])) continue; cuadroG(f, G); n++; if (performance.now() - t0 > ms) return true; } return false; };
    for (const sp of this.setsG) {
      for (const k in sp.parciales) if (pasar(sp.parciales[k])) return n;
      for (const k of Object.keys(sp.anims)) { const d = Object.getOwnPropertyDescriptor(sp.anims, k); if (d && 'value' in d && pasar(d.value)) return n; }
    }
    return n;
  }
  // ---------- cámara y oleadas
  camara(dt) {
    const j = this.j; const w = this.vista.w;
    let objetivo = j.x - w * 0.42;
    const tope = this.lock ? this.lock.cam : (this.olas[this.ola] ? this.olas[this.ola].cam : this.nv.L - w);
    objetivo = Math.min(objetivo, tope, this.nv.L - w);
    if (objetivo > this.cam) this.cam += Math.min(objetivo - this.cam, Math.max(30, (objetivo - this.cam) * 6) * dt);
    this.cam = Math.max(0, this.cam);
  }
  encolar(l) { for (const c of l) this.colaSpawn.push(c); }
  oleadas(dt) {
    const w = this.vista.w;
    const o = this.olas[this.ola];
    if (!this.lock && o && this.cam >= o.cam - 0.5) {
      this.lock = o; this.encolar(o.enemigos); this.tSpawn = 0.3; this.tLock = 0; this.ev.programar(o.eventos);
      if (o.jefe) { if (this.sinCine || !JEFE[this.jefeClave && this.jefeClave[0]]) { this.jefeIntro = 2.2; this.jefeIntroMax = 2.2; } this.tiempo = Math.max(this.tiempo, this.nv.id === 'rambla' ? 180 : 150); /* piso de reloj para el jefe */ musica(this.nv.id === 'rambla' ? 'mus.jefe.final' : 'mus.jefe'); if (this.jefeIntro > 0) sonar('evento.jefe.aparece'); }
      for (const p of this.perros) if (p.est === 'quieto') p.t = 0;
    }
    if (this.lock) {
      this.tLock += dt;
      if (this.jefeIntro > 0) { this.jefeIntro -= dt; if (this.jefeIntro <= 0 && this.jefe) { if (!this._jefeCine) this.globo(this.jefe, FRASES[this.jefe.clave].intro, 2); voz(this.jefe.clave, 'risa'); } }
      this.tSpawn -= dt;
      let enPantalla = 0; for (const e of this.ents) if (e.equipo === 'e' && !e.muerto) enPantalla++;
      // red de seguridad: un enemigo que se quedó afuera de la pantalla (huyendo, trabado contra un decorado) más de 5 s vuelve a entrar por el borde
      for (const e of this.ents) { if (e.equipo !== 'e' || e.muerto || e.entrando > 0) continue; const fuera = e.x < this.cam - 6 || e.x > this.cam + w + 6;
        e.tFuera = fuera ? (e.tFuera || 0) + dt : 0; if (e.tFuera > 5) { e.tFuera = 0; const lado = e.x < this.cam ? -1 : 1; e.x = lado < 0 ? this.cam - 20 : this.cam + w + 20; e.px = e.x; e.y = Math.max(PISO.arriba + 6, Math.min(PISO.abajo - 6, e.y)); e.py = e.y; e.entrando = 0.6; e.cara = -lado; } }
      if (this.colaSpawn.length && this.tSpawn <= 0 && enPantalla < (this.lock.max || this.nv.max || 4)) {
        const [k, v, mini] = this.colaSpawn.shift(); const st = ENEMIGOS[k]; const lado = st.jefe ? 1 : (Math.random() < 0.55 ? 1 : -1);
        const x = lado > 0 ? this.cam + w + 26 : this.cam - 26; const y = PISO.arriba + 10 + Math.random() * (PISO.abajo - PISO.arriba - 20);
        const e = this.crearEnemigo(k, v, x, y, mini); e.entrando = st.jefe ? 1.6 : 0.5; e.cara = -lado;
        this.tSpawn = 0.7 + Math.random() * 0.6;
      }
      if (!this.colaSpawn.length && enPantalla === 0 && this.tLock > 1) {
        this.ev.limpiarCola();
        if (this.lock.jefe) { this.estado = 'gana'; this.tEstado = 0; this.ola++; this.j.est = 'festeja'; this.j.t = 0; this.bonus = Math.ceil(this.tiempo) * 10; this.puntos += this.bonus; sonar('evento.nivel.fin'); musica('mus.victoria'); voz(this.j.clave, 'festeja'); this.lock = null; return; }
        this.lock = null; this.ola++; this.dale = 3.2; sonar('evento.dale'); this.tiempo = Math.max(this.tiempo, 90);
        if (Math.random() < 0.6) this.globo(this.j, pick(FRASES.jugador), 1.2);
      }
    }
    if (this.puntos >= this.proxVida) { this.proxVida += 200000; this.vidas++; sonar('evento.vida'); this.fx.flotante(this.j.x, this.j.y, 80, '¡VIDA EXTRA!', '#7aff7a'); }
    if (this.mensaje) { this.mensaje.t += dt; if (this.mensaje.t > this.mensaje.dur) this.mensaje = null; }
    this.revisarJugador();
  }

  // ------------------------------------------------------------- render del mundo
  dibujar(x, alfa, W, H) {
    this.presG = 2; this.presS = 1; // presupuesto de trabajo en caliente por cuadro (lo demás lo hace el ocioso)
    const off = H - ALTO; this._a = alfa;
    const cam = this.lerp(this.camPrev, this.cam);
    let sx = 0, sy = 0; if (this.temblor > 0) { const k = Math.min(1, this.temblor * 8); sx = Math.round((Math.random() - 0.5) * 4 * k); sy = Math.round((Math.random() - 0.5) * 3 * k); }
    const C = Math.round(cam) - sx;
    const key = W + 'x' + H; if (this.cieloKey !== key) { this.cieloC = cielo(W, H, this.nv.hora); this.cieloKey = key; }
    if (this.nv.interior) { x.fillStyle = '#1e1614'; x.fillRect(0, 0, W, off + sy - EXTRA + 1); } else {
    x.drawImage(this.cieloC, 0, 0);
    if (this.sol) x.drawImage(this.sol, Math.round(W * 0.62 - cam * 0.02), off + (this.nv.hora === 'noche' ? 30 : this.nv.hora === 'manana' ? 50 : 96));
    const lj = Math.round(cam * 0.15) % (this.capaLejos.width - W); x.drawImage(this.capaLejos, lj, 0, W, ALTO, 0, off + sy, W, ALTO);
    const md = Math.min(this.capaMedio.width - W, Math.round(cam * 0.45)); x.drawImage(this.capaMedio, md, 0, W, ALTO, 0, off + sy, W, ALTO); }
    x.drawImage(this.capaCalle, Math.max(0, C), 0, W, ALTO + EXTRA, 0, off + sy - EXTRA, W, ALTO + EXTRA);
    const Y = off + sy;
    this.ev.fondo(x, C, Y);
    if (GORE.nivel) this.sangre.piso(x, C, Y, W, this.grado);
    // lista ordenada por profundidad (sin crear arrays: se reusa)
    const L = this._lista || (this._lista = []); L.length = 0;
    for (const d of this.decor) if (d.x > C - 80 && d.x < C + W + 80) L.push(d);
    for (const r of this.rompibles) if (r.x > C - 60 && r.x < C + W + 60) L.push(r);
    for (const it of this.items) if (it.est !== 'mano' && it.x > C - 40 && it.x < C + W + 40) L.push(it);
    for (const e of this.ents) L.push(e);
    for (const p of this.perros) if (p.est !== 'fuera') L.push(p);
    const n0 = L.length; this.ev.aLista(L, C, W); for (let i = n0; i < L.length; i++) L[i].ev = 1;
    for (const o of L) o._ys = o.py !== undefined && !o.ev ? this.lerp(o.py, o.y) : o.y;
    ordenar(L);
    for (const o of L) { // sombras
      if (o.ev) continue;
      const ox = o.px !== undefined ? this.lerp(o.px, o.x) : o.x, oz = o.pz !== undefined ? this.lerp(o.pz, o.z) : (o.z || 0);
      const w = o.hpMax ? ((o.st.jefe ? 56 : o.est === 'piso' ? 60 : 38) + (o.st.ancho ? 6 : 0)) * Math.max(0.5, 1 - oz / 160) : o.sp && o.sp.w ? o.sp.w * 0.9 : o.t === 'pelota' ? 10 : typeof o.t === 'string' && SP[o.t] && SP[o.t].w ? Math.min(60, SP[o.t].w * 0.9) : 26;
      const s = sombra(w); x.drawImage(s, Math.round(ox - C - s.width / 2), Math.round(o._ys + Y - s.height / 2));
    }
    for (const o of L) { if (o.ev) { o.ev = 0; this.ev.dibujar(x, o, C, Y, this.grado); } else this.dibujarObj(x, o, C, Y); }
    if (this.nv.hora === 'noche' || this.ev.apagon > 0) this.ev.luces(x, C, Y);
    this.fx.dibujar(x, C, Y);
    if (GORE.nivel) this.sangre.aire(x, C, Y, this.grado);
    for (const f of this.frente) { const fx = Math.round(f.x - cam * 1.25 - sx); if (fx < -80 || fx > W + 10) continue; x.drawImage(f.sp, fx, H - f.sp.height + f.baja + sy); }
    this.ev.encima(x, W, H, Y, C);
    if (GORE.nivel) this.sangre.pantalla(x, W, H, this.grado);
    // nombres y barras de enemigos comunes
    for (const e of this.ents) if (e.equipo === 'e' && !e.muerto && !e.st.jefe && !e.mini && e.x > C && e.x < C + W) {
      const ex = Math.round(this.lerp(e.px, e.x) - C), ey = Math.round(this.lerp(e.py, e.y) - this.lerp(e.pz, e.z) + Y - e.sp.h + 8);
      texto(x, e.nombre, ex, ey - 12, e.buff > 0 ? '#ffd040' : '#ffffff', 1, 'centro');
      x.fillStyle = '#1b1220'; x.fillRect(ex - 19, ey - 2, 38, 6); x.fillStyle = '#5a1018'; x.fillRect(ex - 18, ey - 1, 36, 4);
      const k = Math.round(36 * Math.max(0, e.hp) / e.hpMax); x.fillStyle = '#e8303a'; x.fillRect(ex - 18, ey - 1, k, 4); x.fillStyle = '#ff8a8a'; x.fillRect(ex - 18, ey - 1, k, 1);
    }
    // globos de diálogo
    for (const g of this.globos) {
      const e = g.e; const gx = Math.round(this.lerp(e.px, e.x) - C), gy = Math.round(this.lerp(e.py, e.y) - this.lerp(e.pz, e.z) + Y - e.sp.h - (e.equipo === 'e' && !e.st.jefe && !e.mini ? 18 : 2));
      const gy2 = Math.max(gy, 72); const w = g.txt.length * 8 + 8; const bx = Math.max(2, Math.min(W - w - 2, gx - w / 2));
      x.fillStyle = '#1b1220'; x.fillRect(bx - 1, gy2 - 15, w + 2, 15); x.fillStyle = '#fff8e8'; x.fillRect(bx, gy2 - 14, w, 13);
      x.fillStyle = '#fff8e8'; x.fillRect(gx - 2, gy2 - 2, 5, 3); x.fillStyle = '#1b1220'; x.fillRect(gx - 3, gy2 - 2, 1, 3); x.fillRect(gx + 3, gy2 - 2, 1, 3); x.fillRect(gx - 2, gy2 + 1, 5, 1);
      texto(x, g.txt, bx + 4, gy2 - 11, '#1b1220', 1, 'izq', null);
    }
  }
  lerp(a, b) { return a + (b - a) * this._a; }
  dibujarObj(x, o, C, Y) {
    const G = this.grado;
    if (o.hpMax) return this.dibujarLuchador(x, o, C, Y, G);
    if (o.sp && o.sp.w) { const s = spriteG(o.sp, G); x.drawImage(s.d, Math.round(this.lerp(o.px, o.x) - C - s.w / 2), Math.round(o.y + Y - s.h)); return; } // decorado
    if (o.hp !== undefined && o.t && SP[o.t]) { // rompible
      const s = spriteG(o.roto ? SP[ROTO[o.t] || o.t + 'Roto'] || SP.carton : SP[o.t], G); let sh = 0; if (o.sacude > 0) { o.sacude -= 1 / 120; sh = Math.floor(this.t * 50) % 2 ? 1 : -1; }
      x.drawImage(s.d, Math.round(o.x - C - s.w / 2) + sh, Math.round(o.y + Y - s.h)); return;
    }
    if (o.ladra !== undefined) { const s = spriteG(SP.perro[o.f || 0], G); x.drawImage(o.cara > 0 ? s.d : s.i, Math.round(o.x - C - s.w / 2), Math.round(o.y + Y - s.h)); return; }
    // ítem
    const s0 = o.t === 'pelota' ? SP.pelota[Math.floor(Math.abs(o.x) / 6) % 2] : SP[o.t]; if (!s0) return; const s = spriteG(s0, G);
    const ix = Math.round(this.lerp(o.px, o.x) - C), iy = Math.round(this.lerp(o.py, o.y) - this.lerp(o.pz, o.z) + Y);
    if (o.est === 'vuela' && o.t !== 'pelota') { x.save(); x.translate(ix, iy - s.h / 2); x.rotate(o.t === 'boleto' ? o.rot * 0.3 : o.rot); x.drawImage(s.d, -s.w / 2, -s.h / 2); x.restore(); return; }
    if (o.est === 'piso' && o.t !== 'pelota' && Math.floor(this.t * 3 + o.id) % 4 === 0) { x.fillStyle = '#fff6c0'; x.fillRect(ix - 1, iy - s.h - 4, 3, 1); x.fillRect(ix, iy - s.h - 5, 1, 3); }
    x.drawImage(s.d, Math.round(ix - s.w / 2), iy - s.h + 1);
  }
  dibujarLuchador(x, o, C, Y, G) {
    if (o.blink > 0) { o.blink -= 1 / 120; if (Math.floor(this.t * 30) % 2) return; }
    if (o.invul > 0 && o.equipo === 'j' && o.est !== 'ataca' && Math.floor(this.t * 20) % 2) return;
    const conArma = o.arma && (o.anim === 'quieto' || o.anim === 'camina');
    if (o.sp.q !== Q) { o.sp = vigente(o.sp); this.setsG = (this.setsG || []).map(vigente); const l = this.setsG.slice(); for (const e of this.ents) if (e.sp && e.sp.anims) l.push(e.sp = vigente(e.sp)); partida(l); }
    const nomA = conArma && (o.equipo === 'j' || listaAnim(o.sp, o.anim + 'Arma')) ? o.anim + 'Arma' : o.anim;
    let fi = 0;
    if (o.anim === 'quieto') fi = Math.floor(this.t * 4.4 + o.id) % 4;
    else if (o.anim === 'camina') fi = Math.floor(o.t * 15 * (o.st.vel || 60) / 70 * (o.corriendo ? 1.6 : 1)) % 8;
    else if (o.est === 'ataca' && o.atq) { const A = o.atq; fi = A.giro ? Math.floor(o.t / 0.09) % 2 : A.cubre ? 0 : cuadroAtaque(o.anim, o.t, A); }
    else if (o.anim === 'levanta') fi = o.t < 0.07 ? 0 : o.t < 0.14 ? 1 : o.t < 0.21 ? 2 : 3;
    else if (o.anim === 'piso') fi = o.t < 0.1 ? 0 : 1;
    else if (o.anim === 'dolor') fi = (o.fr || 0) * 2 + (o.t < 0.08 ? 0 : 1);
    else if (o.anim === 'vuela') fi = o.vz > 90 ? 0 : o.vz > -90 ? 1 : 2;
    else if (o.anim === 'revolea') fi = o.t < 0.12 ? 0 : 1;
    else if (o.anim === 'rodilla') fi = o.t < 0.07 ? 0 : 1;
    else if (o.anim === 'junta') fi = o.t < 0.06 ? 0 : 1;
    else if (o.anim === 'festeja') fi = Math.floor(this.t * 3) % 2;
    else if (o.anim === 'agarra' || o.anim === 'agarrado' || o.anim === 'bloquea') fi = 0;
    const f0 = cuadroListo(o.sp, nomA, fi); const f = !G || (f0._g && f0._g[G.clave]) || this.presG-- > 0 ? cuadroG(f0, G) : f0; // gradar en caliente: como mucho 2 por cuadro
    const X = Math.round((this.lerp(o.px, o.x) - C) * Q) / Q, Yp = Math.round((this.lerp(o.py, o.y) - this.lerp(o.pz, o.z) + Y) * Q) / Q;
    const sh = o.est === 'dolor' && o.t < 0.12 ? (Math.floor(o.t * 60) % 2 ? 1 : -1) : 0;
    // aura de mini jefe (rojo) o de agrandado por el tambor (amarillo)
    if ((o.mini || o.buff > 0) && o.est !== 'piso' && !o.muerto) { const col = o.mini ? '#ff3a2a' : '#ffd040'; const s = (f._s && f._s[col]) || (this.presS-- > 0 ? silueta(f, col) : null); if (s) { x.globalAlpha = 0.35 + 0.25 * Math.sin(this.t * 10); for (const [ax, ay] of AURA) dibujarCuadro(x, s, X + sh + ax, Yp + ay, o.cara); x.globalAlpha = 1; } }
    const bombo = o.clave === 'tambor' || (o.clave === 'chola' && o.anim === 'empuja');
    dibujarCuadro(x, f, X + sh, Yp, o.cara);
    if (GORE.nivel && o.hpMax && o.hp < o.hpMax * 0.8) this.sangre.heridas(x, o, f0, X + sh, Yp, G);
    if (o.est === 'dolor' && o.t < 0.06) { x.globalAlpha = 0.55 - o.t * 7; dibujarCuadro(x, siluetaBlanca(f0), X + sh, Yp, o.cara); x.globalAlpha = 1; }
    if (o.alerta > 0 && o.equipo === 'e' && o.est !== 'piso' && o.est !== 'vuela') { const ay = Yp - f.pies[1] / f.q - 12 + (o.alerta > 0.55 ? -2 : 0); texto(x, '!', X, ay, '#ff3a2a', 2, 'centro', CONTORNO, '#5a0a0a'); }
    // tambor colgado / changuito de la Chola
    if (bombo && o.est !== 'piso' && o.est !== 'vuela') {
      if (o.clave === 'tambor') { const s = spriteG(SP.tamborProp, G); x.drawImage(o.cara > 0 ? s.d : s.i, Math.round(X + o.cara * 9 - s.w / 2), Math.round(Yp - 50)); }
      else { const s = spriteG(SP.changuito, G); x.drawImage(o.cara > 0 ? s.i : s.d, Math.round(X + o.cara * 30 - s.w / 2), Math.round(Yp - s.h + 2)); }
    }
    // caña: sedal hacia adelante mientras lanza
    if (o.est === 'ataca' && o.atq && o.atq.linea && o.t > o.atq.ini - 0.1 && f.mano) {
      const [hx, hy] = f.mano; const mx = X + o.cara * (hx - f.pies[0]) / f.q, my = Yp + (hy - f.pies[1]) / f.q;
      const k = Math.min(1, Math.max(0, (o.t - o.atq.ini + 0.1) / (o.atq.act + 0.1))); const lx = mx + o.cara * (20 + k * 160), ly = Yp - 40;
      x.strokeStyle = 'rgba(240,240,250,0.8)'; x.lineWidth = 1; x.beginPath(); x.moveTo(mx + o.cara * 30, my - 22); x.quadraticCurveTo((mx + lx) / 2, my - 40, lx, ly); x.stroke(); x.fillStyle = '#c0c0c8'; x.fillRect(Math.round(lx) - 1, Math.round(ly), 2, 3);
    }
    if (o.arma && !(o.clave === 'chola' && o.anim === 'empuja')) { // arma en la mano
      const s0 = SP[o.arma.t]; if (!s0) return; const s = spriteG(s0, G); const [hx, hy, ang] = f.mano; const mx = X + o.cara * (hx - f.pies[0]) / f.q, my = Yp + (hy - f.pies[1]) / f.q;
      // sillas y cajones: de parado se llevan al frente, derechos (no tapan la cara); al pegar sí giran
      if ((o.arma.t === 'silla' || o.arma.t === 'cajonF') && o.est !== 'ataca') { x.drawImage(o.cara > 0 ? s.d : s.i, Math.round(mx - s.w / 2 + o.cara * 4), Math.round(my - s.h * 0.45)); return; }
      x.save(); x.translate(mx, my); x.rotate(o.cara > 0 ? Math.PI / 2 - ang : -(Math.PI / 2 - ang)); const img = o.cara > 0 ? s.d : s.i;
      if (s.h > s.w) x.rotate(o.cara > 0 ? Math.PI / 2 : -Math.PI / 2);
      x.drawImage(img, o.cara > 0 ? -4 : -s.w + 4, -Math.round(s.h / 2)); x.restore();
      if (o.arma.t === 'paraguas' && o.est === 'ataca' && o.atq && o.atq.cubre) { // paraguas abierto como escudo
        x.fillStyle = '#1b1220'; const px = Math.round(X + o.cara * 22); x.fillRect(px - 2, Math.round(Yp - 70), 4, 54); x.fillStyle = '#2a2a3a'; x.fillRect(px - 3 + o.cara * 1, Math.round(Yp - 72), 6, 58); x.fillStyle = '#4a4a62'; x.fillRect(px - 1, Math.round(Yp - 70), 2, 54);
      }
    }
  }
}
const RODILLA_FIN = { ...ATQ.rodilla, tumba: true, kb: 140, vz: 150, dmg: 9, remate: true };
const CUERPO = { dmg: 10, kb: 120, tumba: true, vz: 140, son: 'golpe.embestida', hs: 0.06, crudo: true };
const AURA = [[-1, 0], [1, 0], [0, -1]];
function compactar(a) { let k = 0; for (let i = 0; i < a.length; i++) if (!a[i].borrar) a[k++] = a[i]; a.length = k; }
function ordenar(a) { for (let i = 1; i < a.length; i++) { const v = a[i]; let k = i - 1; while (k >= 0 && a[k]._ys > v._ys) { a[k + 1] = a[k]; k--; } a[k + 1] = v; } }
void porY;
const cacheOsc = new Map();
function oscurecer(s) {
  let c = cacheOsc.get(s); if (c) return c;
  const [cv, x] = lienzo(s.w, s.h); x.drawImage(s.d, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(40,16,48,0.38)'; x.fillRect(0, 0, s.w, s.h);
  cacheOsc.set(s, cv); return cv;
}
