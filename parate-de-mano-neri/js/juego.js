// Núcleo del juego: luchadores, combate, IA, oleadas, ítems, partículas y render del mundo.
import { generar, cuadroAtaque, dibujarCuadro, siluetaBlanca, vigente, partida, lista, Q } from './sprites.js';
import { SP, sombra } from './props.js';
import { PISO, ALTO, EXTRA, calle, lejos, medio, cielo, sol, nivel1 } from './escenario.js';
import { JUGADORES, ENEMIGOS, ATQ, ITEMS, FRASES, pick } from './datos.js';
import { sfx, musica } from './audio.js';
import { texto, lienzo, CONTORNO } from './pixel.js';

const GRAV = 920;
let uid = 1;

export class Juego {
  constructor(claveJugador, vista, ropa = null) {
    this.ropa = ropa;
    this.vista = vista; // {w,h}
    this.nv = nivel1();
    this.capaCalle = calle(this.nv.L).canvas;
    this.capaLejos = lejos(1600); this.capaMedio = medio(2400); this.sol = sol();
    this.cieloC = null; this.cieloKey = '';
    this.ents = []; this.items = []; this.rompibles = []; this.decor = []; this.parts = []; this.globos = []; this.perros = [];
    this.cam = 0; this.camPrev = 0; this.camMax = 0; this.lock = null; this.ola = 0; this.colaSpawn = []; this.tSpawn = 0;
    this.hitstop = 0; this.temblor = 0; this.lento = 0; this.tiempo = 300; this.t = 0;
    this.puntos = 0; this.vidas = 3; this.combo = 0; this.tCombo = 0; this.comboMax = 0;
    this.dale = 0; this.estado = 'jugando'; this.tEstado = 0; this.bondi = null; this.jefe = null; this.mensaje = null;
    this.stats = { golpes: 0, recibidos: 0, ko: 0 };
    this.j = this.crearJugador(claveJugador, 80, 228);
    for (const d of this.nv.decor) this.decor.push({ ...d, sp: SP[d.t], solido: d.t !== 'carton' });
    for (const r of this.nv.rompibles) this.rompibles.push({ ...r, hp: r.t === 'tacho' ? 1 : 2, roto: false, sacude: 0, id: uid++ });
    for (const it of this.nv.items) this.soltarItem(it.t, it.x, it.y, 0, 0);
    for (const p of this.nv.perros) this.perros.push({ x: p.x, y: p.y, f: 0, t: 0, est: 'quieto', cara: 1, ladra: 0 });
    // primer plano (parallax 1.25): cosas tiradas en la vereda de adelante, un poco oscurecidas
    this.frente = []; const tipos = ['carton', 'cajon', 'garrafa', 'cajaBiz', 'carton', 'botella'];
    for (let fx = 260, i = 0; fx < this.nv.L * 1.25; fx += 300 + ((i * 137) % 220), i++) this.frente.push({ x: fx, sp: oscurecer(SP[tipos[i % tipos.length]]), baja: 8 + (i * 7) % 10 });
    this.olas = this.nv.oleadas.map((o) => ({ ...o }));
    // sets de esta partida: se liberan los que no se usan y se terminan de dibujar en segundo plano (calentar)
    { const sets = [this.j.sp]; for (const o of this.olas) for (const [k, v] of o.enemigos) sets.push(generar(k, v)); partida(sets); }
    this.olas[this.olas.length - 1].cam = this.nv.L - vista.w;
    musica('nivel'); this.dale = 3;
  }
  // ------------------------------------------------------------- creación
  crearJugador(clave, x, y) {
    const st = JUGADORES[clave]; const sp = generar(clave, 0, this.ropa);
    const e = this.nuevoLuchador(sp, x, y); Object.assign(e, { equipo: 'j', clave, st, hp: st.hp, hpMax: st.hp, nombre: st.nombre, mano: 0, invul: 1.0, combo: 0 });
    this.ents.push(e); return e;
  }
  nuevoLuchador(sp, x, y) {
    return { id: uid++, sp, x, y, z: 0, vx: 0, vy: 0, vz: 0, px: x, py: y, pz: 0, cara: 1, est: 'quieto', t: 0, anim: 'quieto', fr: 0, hp: 1, hpMax: 1, invul: 0,
      atq: null, golpeados: null, conecto: false, cadena: 0, agarrando: null, agarradoPor: null, rodillas: 0, arma: null, tStun: 0, rebotes: 0, proyectil: null, muerto: false, borrar: false, intent: { mx: 0, my: 0 }, aereo: false, tAg: 0, juggle: 0, blink: 0 };
  }
  crearEnemigo(clave, variante, x, y) {
    const st = ENEMIGOS[clave]; const sp = generar(clave, variante);
    const e = this.nuevoLuchador(sp, x, y);
    Object.assign(e, { equipo: 'e', clave, st, hp: st.hp, hpMax: st.hp, nombre: pick(st.nombres), ia: { rol: 'rodear', retro: 0, cd: 0.6 + Math.random(), react: 0, ang: Math.random() * 6.28, tiro: 2 + Math.random() * 3, frase: 2 + Math.random() * 6, tCerca: 0, hits: 0 } });
    if (st.jefe) { e.nombre = 'EL TANO'; this.jefe = e; }
    e.cara = x < this.j.x ? 1 : -1;
    this.ents.push(e); return e;
  }
  soltarItem(t, x, y, z = 0, vz = 0, vx = 0) {
    const d = ITEMS[t]; const it = { id: uid++, t, x, y, z, vz, vx, px: x, py: y, pz: z, est: z > 0 || vz ? 'cae' : 'piso', dur: d && d.dur || 0, vida: 0, rot: 0, dueno: null, equipo: null };
    this.items.push(it); return it;
  }
  // ------------------------------------------------------------- partículas
  chispa(x, y, z, grande = false) { this.parts.push({ k: 'chispa', x, y, z, t: 0, vida: grande ? 0.22 : 0.16, g: grande }); for (let i = 0; i < (grande ? 8 : 4); i++) this.parts.push({ k: 'brasa', x, y, z, vx: (Math.random() - 0.5) * 220, vz: Math.random() * 160, t: 0, vida: 0.3 + Math.random() * 0.2 }); }
  polvo(x, y, n = 6) { for (let i = 0; i < n; i++) this.parts.push({ k: 'polvo', x: x + (Math.random() - 0.5) * 20, y: y + (Math.random() - 0.5) * 4, z: 2, vx: (Math.random() - 0.5) * 60, vz: 10 + Math.random() * 20, t: 0, vida: 0.4 + Math.random() * 0.3 }); }
  vidrios(x, y, z, c = '#5ab060') { for (let i = 0; i < 10; i++) this.parts.push({ k: 'vidrio', x, y, z, vx: (Math.random() - 0.5) * 200, vz: 40 + Math.random() * 120, t: 0, vida: 0.7, c }); }
  astillas(x, y, z, c = '#b52a2a') { for (let i = 0; i < 10; i++) this.parts.push({ k: 'vidrio', x, y, z, vx: (Math.random() - 0.5) * 160, vz: 60 + Math.random() * 120, t: 0, vida: 0.8, c, gr: 1 }); }
  explosion(x, y) { this.parts.push({ k: 'boom', x, y, z: 10, t: 0, vida: 0.45 }); for (let i = 0; i < 16; i++) this.parts.push({ k: 'brasa', x, y, z: 10, vx: (Math.random() - 0.5) * 300, vz: Math.random() * 250, t: 0, vida: 0.5 + Math.random() * 0.3 }); this.polvo(x, y, 12); this.temblor = Math.max(this.temblor, 0.4); }
  globo(e, txt, dur = 1.6) { this.globos = this.globos.filter((g) => g.e !== e); this.globos.push({ e, txt, t: 0, dur }); }
  flotante(x, y, z, txt, c = '#ffd040') { this.parts.push({ k: 'txt', x, y, z, txt, c, t: 0, vida: 0.9, vz: 30 }); }

  // ------------------------------------------------------------- lógica
  paso(dt, entrada) {
    this.t += dt;
    for (const e of this.ents) { e.px = e.x; e.py = e.y; e.pz = e.z; }
    for (const it of this.items) { it.px = it.x; it.py = it.y; it.pz = it.z; }
    this.camPrev = this.cam;
    if (this.estado === 'gana' || this.estado === 'pierde') { this.tEstado += dt; }
    if (this.lento > 0) { this.lento -= dt; dt *= 0.35; }
    this.temblor = Math.max(0, this.temblor - dt);
    if (this.hitstop > 0) { this.hitstop -= dt; this.pasoParts(dt * 0.3); return; }
    if (this.estado === 'jugando' && !this.jefeIntro) { this.tiempo -= dt; if (this.tiempo <= 0) { this.tiempo = 120; this.danar(this.j, null, 999, { tumba: true, kb: 0, vz: 100 }, true); } }
    if (this.tCombo > 0) { this.tCombo -= dt; if (this.tCombo <= 0) this.combo = 0; }
    this.dale = Math.max(0, this.dale - dt);
    // control del jugador
    this.controlJugador(dt, entrada);
    this.director(dt);
    for (const e of this.ents) if (e.equipo === 'e') this.ia(e, dt);
    for (const e of this.ents) this.fisica(e, dt);
    this.separar();
    for (const e of this.ents) if (e.atq) this.chequearGolpes(e);
    this.pasoItems(dt); this.pasoPerros(dt); this.pasoBondi(dt); this.pasoParts(dt);
    for (const g of this.globos) g.t += dt; this.globos = this.globos.filter((g) => g.t < g.dur && !g.e.borrar);
    this.ents = this.ents.filter((e) => !e.borrar); this.items = this.items.filter((i) => !i.borrar);
    this.camara(dt); this.oleadas(dt);
  }

  // ---------- jugador
  controlJugador(dt, E) {
    const j = this.j; if (!j || j.muerto) return;
    j.intent.mx = E.dx; j.intent.my = E.dy;
    if (j.est === 'agarra' && j.agarrando) return this.controlAgarre(j, E);
    const libre = j.est === 'quieto' || j.est === 'camina';
    const enAire = j.est === 'salto';
    const cadenaOk = j.atq && j.conecto && j.t > j.atq.ini + j.atq.act * 0.5 && (j.atq === ATQ.pina1 || j.atq === ATQ.pina2);
    // especial: botón o piña+salto juntos
    if ((E.buf.especial > 0 || (E.buf.pina > 0 && E.buf.salto > 0 && Math.abs(E.buf.pina - E.buf.salto) < 0.06)) && (libre || j.est === 'dolor' && j.t > 0.08 || cadenaOk)) {
      E.buf.especial = 0; E.buf.pina = 0; E.buf.salto = 0;
      if (j.mano >= 100) { j.mano = 0; this.atacar(j, ATQ.especial); }
      else if (j.hp > 8) { j.hp -= 8; this.atacar(j, ATQ.especial); }
      if (j.atq === ATQ.especial) { j.invul = Math.max(j.invul, 0.45); sfx('especial'); if (Math.random() < 0.4) this.globo(j, pick(FRASES.jugador), 1); }
      return;
    }
    if (enAire && !j.aereo && (E.buf.pina > 0 || E.buf.patada > 0) && j.t > 0.05) { E.buf.pina = 0; E.buf.patada = 0; j.aereo = true; this.atacar(j, ATQ.voladora, true); return; }
    if (cadenaOk && E.buf.pina > 0) { E.buf.pina = 0; this.atacar(j, j.atq === ATQ.pina1 ? ATQ.pina2 : ATQ.pina3); return; }
    if (j.est === 'ataca' && j.atq === ATQ.pina2 && j.conecto && E.buf.patada > 0 && j.t > j.atq.ini) { E.buf.patada = 0; this.atacar(j, ATQ.patada); return; }
    if (!libre) return;
    if (E.buf.salto > 0) { E.buf.salto = 0; this.saltar(j); return; }
    if (E.buf.pina > 0) {
      E.buf.pina = 0;
      if (j.arma) { if (ITEMS[j.arma.t].soloTiro) this.tirarArma(j); else this.atacar(j, ATQ.golpe); return; }
      const it = this.itemCerca(j); const enem = this.enemigoCerca(j, 34);
      if (it && !enem) { this.juntar(j, it); return; }
      this.atacar(j, ATQ.pina1); return;
    }
    if (E.buf.patada > 0) { E.buf.patada = 0; if (j.arma) { this.tirarArma(j); return; } this.atacar(j, ATQ.patada); return; }
    // agarre: caminar contra un enemigo
    if (Math.abs(E.dx) > 0.5 && j.est === 'camina') {
      for (const e of this.ents) if (e.equipo === 'e' && !e.muerto && (e.est === 'quieto' || e.est === 'camina' || e.est === 'dolor') && e.z === 0 && !(e.st.jefe && e.est !== 'dolor')) {
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
    const atras = Math.sign(E.dx) === -j.cara && Math.abs(E.dx) > 0.5;
    if (E.buf.patada > 0 || (E.buf.pina > 0 && atras)) { E.buf.patada = 0; E.buf.pina = 0; j.anim = 'revolea'; j.t = 0; j.revolea = true; sfx('agarra'); return; }
    if (E.buf.pina > 0) {
      E.buf.pina = 0; j.anim = 'rodilla'; j.t = 0; j.rodillas++;
      const fin = j.rodillas >= 3;
      this.impacto(j, e, fin ? { ...ATQ.rodilla, tumba: true, kb: 140, vz: 150, dmg: 9 } : ATQ.rodilla, e.x - j.cara * 4, e.y, 36);
      if (fin) this.soltarAgarre(j);
    }
  }
  agarrar(j, e) {
    j.est = 'agarra'; j.t = 0; j.anim = 'agarra'; j.agarrando = e; j.rodillas = 0; j.tAg = 0; j.vx = 0; j.cara = Math.sign(e.x - j.x) || 1;
    e.est = 'agarrado'; e.t = 0; e.agarradoPor = j; e.atq = null; e.cara = -j.cara; e.vx = 0; e.y = j.y; sfx('agarra');
  }
  soltarAgarre(j) { const e = j.agarrando; if (e) { e.agarradoPor = null; if (e.est === 'agarrado') { e.est = 'quieto'; e.t = 0; } } j.agarrando = null; j.revolea = false; j.est = 'quieto'; j.t = 0; j.anim = 'quieto'; }
  saltar(e) { e.est = 'salto'; e.t = 0; e.vz = 270 * (e.st.salto || 1); e.vx = e.intent.mx * (e.st.vel || 60) * 1.15; e.vy = e.intent.my * (e.st.vel || 60) * 0.5; e.aereo = false; sfx('aire'); }
  atacar(e, a, aire = false) {
    e.est = 'ataca'; e.atq = a; e.t = 0; e.golpeados = new Set(); e.conecto = false; e.anim = a.anim;
    if (!aire) { e.vx = 0; e.vy = 0; }
    if (e.intent && Math.abs(e.intent.mx) > 0.3 && !aire && e.equipo === 'j') e.cara = Math.sign(e.intent.mx);
    if (a.aviso) this.parts.push({ k: 'aviso', e, t: 0, vida: a.ini });
    if (!a.aviso) sfx('aire');
  }
  itemCerca(e) { let m = null, md = 1e9; for (const it of this.items) if (it.est === 'piso' && ITEMS[it.t] && !ITEMS[it.t].pelota) { const d = Math.abs(it.x - e.x) + Math.abs(it.y - e.y) * 2; if (Math.abs(it.x - e.x) < 18 && Math.abs(it.y - e.y) < 10 && d < md) { m = it; md = d; } } return m; }
  enemigoCerca(e, r) { for (const o of this.ents) if (o.equipo !== e.equipo && !o.muerto && Math.abs(o.x - e.x) < r && Math.abs(o.y - e.y) < 12 && o.est !== 'piso') return o; return null; }
  juntar(j, it) {
    const d = ITEMS[it.t]; j.est = 'junta'; j.t = 0; j.anim = 'junta'; j.vx = 0; j.vy = 0;
    if (d.cura) { j.hp = Math.min(j.hpMax, j.hp + d.cura); if (d.mano) j.mano = Math.min(100, j.mano + d.mano); it.borrar = true; sfx('come'); this.flotante(it.x, it.y, 40, d.txt, '#7aff7a'); this.globo(j, pick(FRASES.come), 1.2); }
    else if (d.puntos) { this.puntos += d.puntos; it.borrar = true; sfx('plata'); this.flotante(it.x, it.y, 30, d.txt); }
    else if (d.arma) { j.arma = it; it.est = 'mano'; it.dueno = j; sfx('item'); }
  }
  tirarArma(e) {
    const it = e.arma; if (!it) return; e.arma = null; const d = ITEMS[it.t];
    e.est = 'ataca'; e.atq = { ...ATQ.golpe, act: 0, rec: 0.18, ini: 0.08 }; e.anim = 'golpe'; e.t = 0; e.golpeados = new Set(); e.conecto = true;
    it.est = 'vuela'; it.dueno = e; it.equipo = e.equipo; it.x = e.x + e.cara * 14; it.y = e.y; it.z = 44; it.vx = e.cara * 330; it.vz = it.t === 'garrafa' ? 150 : 0; if (it.t === 'garrafa') it.vx = e.cara * 230; it.dmg = e.equipo === 'j' ? d.tiro * (e.st.dmg || 1) : d.tiro * 0.7; sfx('aire');
  }

  // ---------- física / máquina de estados común
  fisica(e, dt) {
    e.t += dt; if (e.invul > 0) e.invul -= dt;
    const vel = e.st.vel || 50;
    switch (e.est) {
      case 'quieto': case 'camina': {
        const mx = e.intent.mx, my = e.intent.my; const m = Math.hypot(mx, my);
        if (m > 0.15) {
          e.vx = mx * vel; e.vy = my * vel * 0.62; if (Math.abs(mx) > 0.2 && e.equipo === 'j') e.cara = Math.sign(mx);
          if (e.est !== 'camina') { e.est = 'camina'; e.t = 0; }
        } else { e.vx *= 0.5; e.vy *= 0.5; if (e.est !== 'quieto') { e.est = 'quieto'; e.t = 0; } }
        e.anim = e.est; break;
      }
      case 'salto': e.anim = 'salto'; break;
      case 'ataca': {
        const a = e.atq;
        if (a.dash && e.t > a.ini && e.t < a.ini + a.act) { e.vx = e.cara * a.dash; if (Math.random() < 0.3) this.polvo(e.x - e.cara * 10, e.y, 1); }
        else if (!a.aire) { e.vx *= 0.8; e.vy *= 0.8; }
        if (a.giro) { e.cara = (Math.floor(e.t / 0.09) % 2) ? 1 : -1; }
        if (a.aire) { if (e.z <= 0 && e.t > 0.05) { e.est = 'quieto'; e.t = 0; e.atq = null; e.anim = 'quieto'; } }
        else if (e.t >= a.ini + a.act + a.rec * (e.equipo === 'j' ? 1 / (e.st.atk || 1) : 1)) {
          if (e.arma && a === ATQ.golpe && ITEMS[e.arma.t].rompe && e.arma.dur <= 0) e.arma = null;
          e.est = 'quieto'; e.t = 0; e.atq = null; e.anim = 'quieto';
          if (e.equipo === 'e') { e.ia.cd = 0.5 + Math.random() * 0.8 * (e.st.pesado ? 1.6 : 1); if (Math.random() < 0.45 && !e.st.jefe) e.ia.retro = 0.35 + Math.random() * 0.3; }
        }
        break;
      }
      case 'dolor': e.vx *= 0.88; e.vy = 0; if (e.t > e.tStun) { e.est = 'quieto'; e.t = 0; } break;
      case 'agarrado': {
        const a = e.agarradoPor; if (!a) { e.est = 'quieto'; break; }
        if (a.revolea) { // revoleo por encima del hombro
          if (a.t > 0.12) { const k = Math.min(1, (a.t - 0.12) / 0.14); e.x = a.x + a.cara * 20 * (1 - 2 * k); e.z = Math.sin(k * Math.PI) * 36; }
          if (a.t > 0.28) { const dir = -a.cara; a.revolea = false; a.agarrando = null; e.agarradoPor = null; this.lanzar(e, a, dir, 230, 150, 12 * (a.st.dmg || 1)); a.est = 'quieto'; a.t = 0; a.anim = 'quieto'; }
        } else { e.x = a.x + a.cara * 21; e.y = a.y; e.z = 0; }
        e.anim = 'agarrado'; e.vx = 0; break;
      }
      case 'vuela': {
        e.anim = 'vuela';
        break;
      }
      case 'piso': e.vx *= 0.8; e.anim = 'piso';
        if (e.muerto && e.equipo === 'e') { if (e.t > 0.9) { e.blink = 1; if (e.t > 1.6) this.morir(e); } }
        else if (e.muerto) {}
        else if (e.t > (e.equipo === 'j' ? 0.55 : 0.75)) { e.est = 'levanta'; e.t = 0; }
        break;
      case 'levanta': e.anim = 'levanta'; e.juggle = 0; e.invul = Math.max(e.invul, 0.1); if (e.t > 0.28) { e.est = 'quieto'; e.t = 0; e.invul = e.equipo === 'j' ? 0.9 : 0.3; } break;
      case 'junta': e.anim = 'junta'; if (e.t > 0.16) { e.est = 'quieto'; e.t = 0; } break;
      case 'agarra': if (!e.agarrando) { e.est = 'quieto'; e.t = 0; } else if (e.anim !== 'revolea' && e.anim !== 'rodilla') e.anim = 'agarra'; else if (e.anim === 'rodilla' && e.t > 0.2) e.anim = 'agarra'; break;
      case 'festeja': e.anim = 'festeja'; e.vx = 0; e.vy = 0; break;
    }
    // integración
    if (e.est !== 'agarrado') {
      e.x += e.vx * dt; e.y += e.vy * dt;
      if (e.z > 0 || e.vz !== 0) {
        e.vz -= GRAV * dt; e.z += e.vz * dt;
        if (e.est === 'vuela' && e.proyectil) this.chequearProyectil(e);
        if (e.z <= 0) {
          e.z = 0;
          if (e.est === 'vuela') {
            if (e.vz < -230 && e.rebotes < 1) { e.vz = -e.vz * 0.32; e.vx *= 0.6; e.rebotes++; sfx('piso'); this.polvo(e.x, e.y, 6); this.temblor = Math.max(this.temblor, 0.12); }
            else { e.vz = 0; e.est = 'piso'; e.t = 0; e.vx *= 0.4; e.proyectil = null; sfx('piso'); this.polvo(e.x, e.y, 8); if (e.hp <= 0) e.muerto = true; }
          } else { e.vz = 0; if (e.est === 'salto' || (e.est === 'ataca' && e.atq && e.atq.aire)) { e.est = 'quieto'; e.t = 0; e.atq = null; e.vx = 0; e.vy = 0; this.polvo(e.x, e.y, 3); } }
        }
      }
    }
    // límites
    e.y = Math.max(PISO.arriba, Math.min(PISO.abajo, e.y));
    if (e.equipo === 'j') e.x = Math.max(this.cam + 12, Math.min(this.cam + this.vista.w - 12, e.x));
    else if (e.est === 'vuela' || e.est === 'piso') e.x = Math.max(this.cam - 30, Math.min(this.cam + this.vista.w + 30, e.x));
    e.x = Math.max(10, Math.min(this.nv.L - 10, e.x));
    if (this.lock && e.equipo === 'e' && !(e.entrando > 0) && e.est !== 'vuela') { const m = e.st.jefe ? 44 : 10; e.x = Math.max(this.cam + m, Math.min(this.cam + this.vista.w - m, e.x)); }
    if (this.lock && this.lock.jefe && e.equipo === 'j') e.x = Math.max(this.cam + 24, Math.min(this.cam + this.vista.w - 24, e.x));
    if (e.est !== 'vuela') this.chocarDecor(e);
  }
  chocarDecor(e) {
    for (const d of this.decor) { if (!d.solido) continue; this.empujarCaja(e, d.x, d.y, d.sp.w * 0.5 - 4, 7); }
    for (const r of this.rompibles) if (!r.roto) this.empujarCaja(e, r.x, r.y, SP[r.t].w * 0.5 - 3, 5);
  }
  empujarCaja(e, cx, cy, hw, hd) {
    const dx = e.x - cx, dy = e.y - (cy - hd); const ox = hw + 5 - Math.abs(dx), oy = hd + 3 - Math.abs(dy);
    if (ox > 0 && oy > 0 && e.z < 18) { if (ox < oy * 1.6) e.x += Math.sign(dx || 1) * ox; else e.y += Math.sign(dy || 1) * oy; }
  }
  separar() { // evita que los enemigos se encimen
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
    e.proyectil = { por, dmg, golpeados: new Set([e.id]) }; e.hp -= dmg; this.contarGolpe(por, dmg, e); this.temblor = Math.max(this.temblor, 0.15);
    if (e.hp <= 0) this.koEnemigo(e);
  }
  chequearProyectil(e) {
    const p = e.proyectil; if (!p) return;
    for (const o of this.ents) {
      if (o === e || o.muerto || p.golpeados.has(o.id) || o.equipo === p.por.equipo || o.est === 'piso' || o.est === 'vuela' || o.invul > 0) continue;
      if (Math.abs(o.x - e.x) < 22 && Math.abs(o.y - e.y) < 12 && e.z < 50) { p.golpeados.add(o.id); this.impacto(p.por, o, { dmg: 10, kb: 120, tumba: true, vz: 140, sfx: 'fuerte', hs: 0.06, crudo: true }, o.x, o.y, 30); }
    }
  }

  // ---------- golpes
  chequearGolpes(e) {
    const a = e.atq; if (e.t < a.ini || e.t > a.ini + a.act) return;
    if (a.aire && e.z <= 0) return;
    let alcance = [a.x[0] * 1.25, a.x[1] * 1.25];
    if (a.arma && e.arma) alcance = [6, ITEMS[e.arma.t].alcance * 1.2];
    for (const o of this.ents) {
      if (o === e || o.equipo === e.equipo || e.golpeados.has(o.id) || o.muerto) continue;
      if (o.est === 'piso' || o.est === 'levanta' || o.invul > 0) continue;
      if (o.est === 'agarrado' && o.agarradoPor !== e) continue;
      if (o.est === 'vuela' && o.juggle >= 2) continue;
      const dx = (o.x - e.x) * (a.giro ? 1 : e.cara); const dy = Math.abs(o.y - e.y), dz = Math.abs(o.z - e.z);
      const ancho = o.st.jefe ? 18 : 10;
      if (dy > (a.onda ? 18 : 11) || dz > (a.onda ? 6 : 36)) continue;
      if (a.giro || a.onda) { if (Math.abs(o.x - e.x) > alcance[1] + ancho) continue; }
      else if (dx < alcance[0] - ancho || dx > alcance[1] + ancho) continue;
      e.golpeados.add(o.id); e.conecto = true;
      const hx = a.giro ? o.x : e.x + e.cara * Math.min(alcance[1], Math.max(alcance[0], dx));
      this.impacto(e, o, a, hx, (e.y + o.y) / 2, a.aire ? e.z + 40 : (a === ATQ.pina3 ? 54 : a.anim === 'patada' ? 52 : 46));
      if (a.onda) {} // la onda pega a todos
      else if (!a.giro && e.equipo === 'e') break;
    }
    // rompibles
    if (e.equipo === 'j') for (const r of this.rompibles) {
      if (r.roto || e.golpeados.has(r.id)) continue;
      const dx = (r.x - e.x) * e.cara; if (Math.abs(r.y - e.y) < 14 && (a.giro ? Math.abs(r.x - e.x) < 44 : dx > alcance[0] - 10 && dx < alcance[1] + 12)) {
        e.golpeados.add(r.id); r.hp--; r.sacude = 0.15; this.hitstop = 0.04; e.conecto = true;
        sfx(r.t === 'tacho' ? 'metal' : 'madera'); this.chispa(r.x, r.y, 14);
        if (r.hp <= 0) this.romper(r);
      }
    }
    // pelota
    for (const it of this.items) if (it.t === 'pelota' && it.est === 'piso' && !e.golpeados.has(it.id)) {
      const dx = (it.x - e.x) * e.cara; if (Math.abs(it.y - e.y) < 12 && dx > -4 && dx < alcance[1] + 10) { e.golpeados.add(it.id); it.est = 'rueda'; it.vx = e.cara * 340; it.vz = 160; it.z = 2; it.dueno = e; it.equipo = e.equipo; sfx('patada'); }
    }
  }
  romper(r) {
    r.roto = true; const sp = SP[r.t];
    if (r.t === 'cajon') { sfx('botella'); this.vidrios(r.x, r.y, 10); this.astillas(r.x, r.y, 10); }
    else if (r.t === 'cajaBiz') this.astillas(r.x, r.y, 10, '#c8955a');
    else this.astillas(r.x, r.y, 10, '#5d6670');
    this.polvo(r.x, r.y, 6); void sp;
    if (r.da) this.soltarItem(r.da, r.x, r.y + 1, 14, 120);
  }
  impacto(e, o, a, hx, hy, hz) {
    let dmg = a.crudo ? a.dmg : a.arma && e.arma ? ITEMS[e.arma.t].dmg * (e.equipo === 'j' ? (e.st.dmg || 1) : 0.75) : (e.equipo === 'j' ? a.dmg * (e.st.dmg || 1) : a.dmg * e.st.dmg);
    if (o.equipo === 'j' && o.clave === 'pelado') dmg *= 0.9;
    const grande = !!(a.tumba || dmg >= 10);
    this.chispa(hx, hy, hz, grande);
    sfx(a.arma && e.arma ? ITEMS[e.arma.t].sfx : a.sfx || 'pina', grande ? 1.2 : 1);
    this.hitstop = Math.max(this.hitstop, a.hs || 0.05);
    if (grande) this.temblor = Math.max(this.temblor, 0.14);
    if (a.arma && e.arma) { e.arma.dur--; if (ITEMS[e.arma.t].rompe && e.arma.dur <= 0) { const it = e.arma; it.borrar = true; this.vidrios(hx, hy, hz); e.arma.dur = 0; e.arma = null; sfx('botella'); } else if (e.arma.dur <= 0) { e.arma.borrar = true; this.astillas(hx, hy, hz, '#9a6a3a'); e.arma = null; } }
    if (e.equipo === 'j' && e !== o) this.contarGolpe(e, dmg, o);
    this.danar(o, e, dmg, a);
  }
  contarGolpe(e, dmg, o) {
    if (!e || e.equipo !== 'j') return;
    this.combo++; this.tCombo = 2.2; this.comboMax = Math.max(this.comboMax, this.combo); this.stats.golpes++;
    const bonus = 1 + Math.min(14, this.combo) * 0.5; this.puntos += Math.round(dmg * 10 * bonus);
    e.mano = Math.min(100, (e.mano || 0) + dmg * 1.6); void o;
  }
  danar(o, por, dmg, a, sinInvul = false) {
    if (o.invul > 0 && !sinInvul) return;
    if (o.agarradoPor && o.agarradoPor !== por) this.soltarAgarre(o.agarradoPor);
    if (o.agarrando) this.soltarAgarre(o);
    o.hp -= dmg;
    if (o.equipo === 'j') { this.combo = 0; this.tCombo = 0; this.stats.recibidos++; if (o.arma && (a.tumba || o.hp <= 0)) this.soltarArma(o); if (Math.random() < 0.3) this.globo(o, pick(FRASES.dolor), 0.9); }
    else { if (o.ia) o.ia.hits++; if (o.hp > 0 && Math.random() < 0.12) this.globo(o, pick(FRASES.dolor), 0.9); }
    const dir = por ? Math.sign(o.x - por.x) || por.cara : -o.cara;
    let tumba = a.tumba || (a.tumbaSiAturdido && o.est === 'dolor') || o.hp <= 0 || o.est === 'vuela' || o.z > 0;
    // el jefe aguanta: solo cae con remates
    if (o.st.jefe && o.hp > 0) { if (!(a === ATQ.especial || a === ATQ.pina3 || a.crudo || (a.tumbaSiAturdido && o.ia.hits >= 4))) tumba = false; if (o.est === 'ataca' && o.atq && (o.atq.dash || o.atq.onda) && !a.crudo) { o.blink = 0.08; return; } }
    if (o.st.pesado && !tumba && a.dmg < 6 && Math.random() < 0.3) { o.blink = 0.06; return; } // Cacho a veces ni se mosquea
    if (tumba) {
      if (o.arma && o.equipo === 'e') this.soltarArma(o);
      o.est = 'vuela'; o.t = 0; o.vx = dir * (a.kb || 100) / (o.st.peso || (o.st.jefe ? 1.6 : 1)); o.vz = a.vz || 140; o.z = Math.max(o.z, 1); o.rebotes = 0; o.atq = null; o.cara = -dir; o.juggle = (o.juggle || 0) + 1;
      if (o.est === 'vuela' && o.z > 1) o.vz = Math.max(o.vz, 120);
      if (o.ia) o.ia.hits = 0;
    } else {
      o.est = 'dolor'; o.t = 0; o.tStun = a.stun || 0.3; o.vx = dir * (a.kb || 30); o.atq = null; o.anim = 'dolor'; o.fr = Math.random() < 0.5 ? 0 : 1; o.cara = -dir; o.juggle = 0;
    }
    if (o.hp <= 0) { o.hp = 0; if (o.equipo === 'e') this.koEnemigo(o); }
  }
  koEnemigo(o) {
    if (o.ko) return; o.ko = true; this.stats.ko++; this.puntos += o.st.puntos;
    if (Math.random() < 0.5) this.globo(o, pick(FRASES.ko), 1.1);
    if (o.st.jefe) { this.lento = 1.4; this.temblor = 0.5; sfx('ko'); }
    else if (Math.random() < 0.12) this.soltarItem(pick(['billete', 'bizcochos']), o.x, o.y, 20, 100);
  }
  morir(e) {
    e.borrar = true; if (e.ia && e.ia.item) e.ia.item.reservado = null; if (e.arma) this.soltarArma(e);
    if (e.equipo === 'j') {}
  }
  soltarArma(e) { const it = e.arma; if (!it) return; e.arma = null; it.est = 'cae'; it.dueno = null; it.x = e.x; it.y = e.y; it.z = 30; it.vz = 120; it.vx = -e.cara * 40; }

  // ---------- jugador: muerte y vidas
  revisarJugador() {
    const j = this.j;
    if (j.hp <= 0 && j.est !== 'piso' && j.est !== 'vuela') { j.tCero = (j.tCero || 0) + 1 / 120; if (j.tCero > 0.4) { this.anomalias = (this.anomalias || 0) + 1; this.ultimaAnomalia = j.est + '/' + j.anim; j.tCero = 0; j.est = 'vuela'; j.vz = 120; j.z = 1; j.atq = null; if (j.agarrando) this.soltarAgarre(j); j.est = 'vuela'; } } else j.tCero = 0;
    if (j.hp <= 0 && j.est === 'piso' && j.t > 0.8 && this.estado === 'jugando') {
      this.vidas--;
      if (this.vidas < 0) { this.estado = 'pierde'; this.tEstado = 0; this.vidas = 0; return; }
      j.hp = j.hpMax; j.muerto = false; j.est = 'levanta'; j.t = 0; j.invul = 2.5;
      for (const e of this.ents) if (e.equipo === 'e' && !e.muerto && Math.abs(e.x - j.x) < 120) this.danar(e, j, 0, { tumba: true, kb: 140, vz: 130 }, true);
      this.explosionVisual(j.x, j.y);
    }
  }
  explosionVisual(x, y) { this.parts.push({ k: 'aro', x, y, z: 30, t: 0, vida: 0.4 }); sfx('especial'); }

  // ---------- director de IA: reparte "turnos" de ataque
  director(dt) {
    this.tDir = (this.tDir || 0) - dt; if (this.tDir > 0) return; this.tDir = 0.25;
    const j = this.j; const vivos = this.ents.filter((e) => e.equipo === 'e' && !e.muerto && e.est !== 'piso' && e.est !== 'vuela');
    vivos.sort((a, b) => (Math.abs(a.x - j.x) + Math.abs(a.y - j.y) * 2) - (Math.abs(b.x - j.x) + Math.abs(b.y - j.y) * 2));
    let cupo = j.est === 'piso' || j.est === 'levanta' || j.invul > 0.5 ? 1 : (this.vidasDificultad || (this.ola >= 2 && vivos.length >= 4 ? 3 : 2));
    const lados = { '-1': 0, '1': 0 };
    for (const e of vivos) {
      if (e.st.jefe) { e.ia.rol = 'atacar'; cupo--; continue; }
      if (cupo > 0 && e.ia.retro <= 0) { e.ia.rol = 'atacar'; cupo--; if (!e.vioAlerta) { e.vioAlerta = true; e.alerta = 0.7; } } else e.ia.rol = 'rodear'; // '!' la primera vez que va al frente (solo visual)
      const lado = Math.sign(e.x - j.x) || 1; lados[lado]++;
    }
    // reparto de ángulos para rodear: mitad de cada lado
    const rod = vivos.filter((e) => e.ia.rol === 'rodear');
    rod.forEach((e, i) => { const lado = i % 2 === 0 ? Math.sign(e.x - j.x) || 1 : -(Math.sign(rod[0].x - j.x) || 1); e.ia.lado = lado; e.ia.dist = 70 + (i % 3) * 22; e.ia.dy = ((i * 37) % 60) - 30; });
  }
  ia(e, dt) {
    const j = this.j, ia = e.ia; e.intent.mx = 0; e.intent.my = 0; if (e.alerta > 0) e.alerta -= dt;
    if (e.muerto || e.est === 'agarrado' || e.est === 'vuela' || e.est === 'piso' || e.est === 'levanta' || e.est === 'dolor') return;
    if (this.estado !== 'jugando' || j.hp <= 0 && j.est === 'piso') { if (e.est !== 'festeja' && j.hp <= 0) { e.est = 'festeja'; } return; }
    if (e.est === 'festeja') { e.est = 'quieto'; }
    if (e.entrando > 0) { e.entrando -= dt; e.intent.mx = Math.sign(this.cam + this.vista.w / 2 - e.x); return; }
    ia.cd -= dt; ia.frase -= dt; if (ia.retro > 0) ia.retro -= dt;
    if (ia.frase <= 0) { ia.frase = 6 + Math.random() * 8; if (Math.random() < 0.5) this.globo(e, pick(e.st.jefe ? FRASES.jefe : FRASES.enemigo), 1.4); }
    if (e.est !== 'quieto' && e.est !== 'camina') return;
    const dx = j.x - e.x, dy = j.y - e.y, adx = Math.abs(dx);
    e.cara = Math.sign(dx) || e.cara;
    // esquive de Mati
    if (e.st.esquiva && j.est === 'ataca' && adx < 44 && Math.abs(dy) < 12 && Math.random() < e.st.esquiva * dt * 8) { e.vx = -Math.sign(dx) * 170; e.vy = (Math.random() - 0.5) * 60; e.est = 'salto'; e.vz = 120; e.t = 0; e.aereo = true; return; }
    if (ia.retro > 0) { e.intent.mx = -Math.sign(dx) * 0.7; e.intent.my = (Math.random() - 0.5) * 0.4; return; }
    if (e.st.jefe) return this.iaJefe(e, dt, dx, dy, adx);
    // levantar armas del piso (palo, botella, termo)
    if (!e.arma && !e.st.jefe) {
      if (!ia.item || ia.item.est !== 'piso' || ia.item.borrar) {
        ia.item = null; ia.buscaArma = (ia.buscaArma || 0) - dt;
        if (ia.buscaArma <= 0) { ia.buscaArma = 0.6; for (const it of this.items) if (it.est === 'piso' && (it.t === 'palo' || it.t === 'botella' || it.t === 'termo') && !it.reservado && Math.abs(it.x - e.x) < 130 && Math.abs(it.x - j.x) > 24 && it.x > this.cam && it.x < this.cam + this.vista.w) { ia.item = it; it.reservado = e.id; break; } }
      }
      if (ia.item && ia.rol !== 'atacar') {
        const it = ia.item, ix = it.x - e.x, iy = it.y - e.y;
        if (Math.abs(ix) < 10 && Math.abs(iy) < 6) { e.arma = it; it.est = 'mano'; it.dueno = e; it.reservado = null; ia.item = null; e.est = 'junta'; e.t = 0; e.anim = 'junta'; e.vx = 0; e.vy = 0; sfx('item'); if (Math.random() < 0.6) this.globo(e, pick(['¡AHORA SÍ!', '¡VENÍ, VENÍ!', '¡MIRÁ LO QUE TENGO!']), 1.1); return; }
        e.intent.mx = Math.max(-1, Math.min(1, ix / 10)); e.intent.my = Math.max(-1, Math.min(1, iy / 6)); return;
      }
    }
    // el del buzo tira botellas de lejos
    if (e.st.tira) { ia.tiro -= dt; if (ia.tiro <= 0 && adx > 90 && adx < 220 && Math.abs(dy) < 10 && ia.rol !== 'atacar') { ia.tiro = 4 + Math.random() * 4; e.cara = Math.sign(dx) || 1; if (e.arma && e.arma.t === 'botella') this.tirarArma(e); else if (!e.arma) this.tirarBotellaEnemigo(e); return; } }
    if (ia.rol === 'atacar') {
      const lado = Math.sign(e.x - j.x) || 1; const tx = j.x + lado * 32, ty = j.y;
      const ex = tx - e.x, ey = ty - e.y;
      if (Math.abs(ex) > 6 || Math.abs(ey) > 4) { e.intent.mx = Math.max(-1, Math.min(1, ex / 12)); e.intent.my = Math.max(-1, Math.min(1, ey / 8)); ia.react = e.st.reaccion; }
      if (adx < 50 && Math.abs(dy) < 8 && ia.cd <= 0 && j.est !== 'piso' && j.est !== 'levanta') {
        ia.react -= dt; if (ia.react > 0) return;
        let a; if (e.arma) a = ATQ.e_golpe; else if (e.clave === 'cacho') a = Math.random() < 0.6 ? ATQ.e_pesada : ATQ.e_cruz; else if (e.clave === 'mati') a = Math.random() < 0.7 ? ATQ.e_jab : ATQ.e_cruz; else a = Math.random() < 0.65 ? ATQ.e_jab : ATQ.e_patada;
        e.cara = Math.sign(dx) || 1; this.atacar(e, a); if (e.clave === 'mati' && a === ATQ.e_jab) ia.cd = 0.15;
      }
    } else {
      const lado = ia.lado || (Math.sign(e.x - j.x) || 1); const tx = j.x + lado * (ia.dist || 80), ty = Math.max(PISO.arriba, Math.min(PISO.abajo, j.y + (ia.dy || 0)));
      const ex = tx - e.x, ey = ty - e.y;
      if (Math.abs(ex) > 10 || Math.abs(ey) > 6) { e.intent.mx = Math.max(-1, Math.min(1, ex / 30)) * 0.75; e.intent.my = Math.max(-1, Math.min(1, ey / 20)) * 0.75; }
      else { ia.ang += dt; e.intent.my = Math.sin(ia.ang * 1.3) * 0.3; }
    }
    // no quedarse lejos de pantalla
    if (e.x < this.cam - 10) e.intent.mx = 1; if (e.x > this.cam + this.vista.w + 10) e.intent.mx = -1;
  }
  iaJefe(e, dt, dx, dy, adx) {
    const ia = e.ia, j = this.j;
    if (adx < 50 && Math.abs(dy) < 14) ia.tCerca += dt; else ia.tCerca = Math.max(0, ia.tCerca - dt);
    if (!ia.llamo && e.hp < e.hpMax * 0.5) { ia.llamo = true; this.globo(e, '¡MUCHACHOS, A ÉL!', 1.6); this.encolar([['mati', 1], ['buzo', 2]]); const it = this.soltarItem('chivito', this.cam + 40 + Math.random() * (this.vista.w - 80), 236, 60, 0, 0); it.est = 'cae'; }
    const centro = this.cam + this.vista.w / 2;
    if (ia.cd > 0) { // se acomoda: se pone del lado del centro para que la pelea no se vaya al borde
      const lado = j.x > centro + 30 ? -1 : j.x < centro - 30 ? 1 : (Math.sign(e.x - j.x) || 1);
      const tx = Math.max(this.cam + 50, Math.min(this.cam + this.vista.w - 50, j.x + lado * 40)); e.intent.mx = Math.max(-1, Math.min(1, (tx - e.x) / 20)) * 0.8; e.intent.my = Math.max(-1, Math.min(1, dy / 10)) * 0.8; return;
    }
    if (ia.tCerca > 1.3) { ia.tCerca = 0; this.atacar(e, ATQ.e_piston); return; }
    if (adx > 110 && Math.abs(dy) < 10 && Math.random() < dt * 2.5) { e.cara = Math.sign(dx); this.atacar(e, ATQ.e_embestida); this.globo(e, '¡AHÍ VOY!', 0.8); return; }
    if (adx < 46 && Math.abs(dy) < 8) { e.cara = Math.sign(dx); this.atacar(e, Math.random() < 0.5 ? ATQ.e_cruz : ATQ.e_pesada); ia.cd = 0.4; return; }
    { const lado = j.x > centro + 30 ? -1 : j.x < centro - 30 ? 1 : -Math.sign(dx) || 1; const tx = Math.max(this.cam + 50, Math.min(this.cam + this.vista.w - 50, j.x + lado * 34)); e.intent.mx = Math.max(-1, Math.min(1, (tx - e.x) / 20)); e.intent.my = Math.max(-1, Math.min(1, dy / 8)); }
    if (adx > 140 && Math.abs(dy) > 10) e.intent.my = Math.sign(dy);
  }
  tirarBotellaEnemigo(e) {
    this.atacar(e, { ...ATQ.golpe, act: 0, rec: 0.3, ini: 0.12 }); e.golpeados = new Set();
    const it = this.soltarItem('botella', e.x + e.cara * 12, e.y, 46, 0, e.cara * 250); it.est = 'vuela'; it.dueno = e; it.equipo = 'e'; it.dmg = 8;
  }

  // ---------- ítems
  pasoItems(dt) {
    for (const it of this.items) {
      it.vida += dt;
      if (it.est === 'mano') { const d = it.dueno; if (!d || d.borrar) { it.est = 'cae'; it.z = 20; } else { it.x = d.x; it.y = d.y; } continue; }
      if (it.est === 'cae' || it.est === 'vuela' || it.est === 'rueda') {
        it.x += it.vx * dt; it.y += (it.vy || 0) * dt; if (it.est !== 'vuela' || it.t === 'garrafa') { it.vz -= GRAV * dt; } it.z += it.vz * dt; it.rot += dt * 14 * Math.sign(it.vx || 1);
        if ((it.est === 'vuela' || it.est === 'rueda') && it.equipo) { // sin dueño (pelota empujada, rebotes) no lastima
          for (const o of this.ents) {
            if (o.equipo === it.equipo || o.muerto || o.est === 'piso' || o.invul > 0 || o.id === (it.dueno && it.dueno.id)) continue;
            if (Math.abs(o.x - it.x) < 14 && Math.abs(o.y - it.y) < 10 && it.z < 70) {
              if (it.t === 'garrafa') { this.explotar(it); break; }
              const fuerte = it.t !== 'pelota';
              this.impacto(it.dueno || o, o, { dmg: it.t === 'pelota' ? 4 : it.dmg || 10, kb: 110, tumba: fuerte, vz: 120, stun: 0.4, sfx: it.t === 'botella' ? 'botella' : 'fuerte', hs: 0.07, crudo: true }, it.x, it.y, it.z);
              if (it.t === 'botella') { it.borrar = true; this.vidrios(it.x, it.y, it.z); } else if (it.t === 'pelota') { it.vx = -it.vx * 0.4; it.vz = 120; it.equipo = null; } else { it.vx = -it.vx * 0.2; it.est = 'cae'; it.vz = 100; it.equipo = null; it.dur = Math.max(1, it.dur - 3); }
              break;
            }
          }
        }
        if (it.x < this.cam - 40 || it.x > this.cam + this.vista.w + 40) { if (it.est === 'vuela') it.borrar = true; }
        if (it.z <= 0) {
          it.z = 0;
          if (it.t === 'garrafa' && it.est === 'vuela') { this.explotar(it); continue; }
          if (it.t === 'botella' && it.est === 'vuela') { it.borrar = true; this.vidrios(it.x, it.y, 4); sfx('botella'); continue; }
          if (it.vz < -90) { it.vz = -it.vz * 0.4; it.vx *= 0.6; } else { it.vz = 0; it.vx = it.t === 'pelota' ? it.vx * 0.97 : 0; if (Math.abs(it.vx) < 8) { it.est = 'piso'; it.equipo = null; } else it.est = 'rueda'; }
        }
      }
      it.y = Math.max(PISO.arriba, Math.min(PISO.abajo, it.y));
      if (it.est === 'piso' || it.est === 'cae') it.x = Math.max(this.cam + 10, Math.min(this.cam + this.vista.w - 10, it.x));
      // pelota: el jugador la empuja caminando
      if (it.t === 'pelota' && it.est === 'piso') { const j = this.j; if (Math.abs(j.x - it.x) < 10 && Math.abs(j.y - it.y) < 6 && j.est === 'camina') { it.est = 'rueda'; it.vx = j.cara * 120; it.vz = 40; it.equipo = null; it.dueno = j; } }
    }
  }
  explotar(it) {
    it.borrar = true; sfx('explosion'); this.explosion(it.x, it.y); this.hitstop = 0.08;
    for (const o of this.ents) { if (o.muerto || o.est === 'piso') continue; const d = Math.hypot(o.x - it.x, (o.y - it.y) * 2); if (d < 64) { o.invul = 0; this.impacto(it.dueno || o, o, { dmg: o.equipo === 'j' ? 14 : 24, kb: 180, tumba: true, vz: 220, sfx: 'fuerte', hs: 0.05, crudo: true }, o.x, o.y, 30); } }
    for (const r of this.rompibles) if (!r.roto && Math.abs(r.x - it.x) < 60 && Math.abs(r.y - it.y) < 25) this.romper(r);
  }

  // ---------- perro, bondi, partículas
  pasoPerros(dt) {
    for (const p of this.perros) {
      p.t += dt; const j = this.j; const pelea = this.lock && this.ents.some((e) => e.equipo === 'e' && Math.abs(e.x - p.x) < 140);
      if (p.est === 'huye') { p.x += p.cara * 110 * dt; p.f = Math.floor(p.t * 10) % 2; if (p.x < this.cam - 60 || p.x > this.cam + this.vista.w + 60) { p.est = 'fuera'; } continue; }
      if (p.est === 'fuera') { if (!pelea && p.x < this.cam - 50) { p.x = this.cam + this.vista.w + 40; p.y = 250 + Math.random() * 12; p.est = 'quieto'; p.vuelve = true; } else if (!pelea && p.x > this.cam + this.vista.w + 30 && p.vuelve) { p.est = 'camina'; p.cara = -1; } continue; }
      if (p.est === 'camina') { p.x += p.cara * 40 * dt; p.f = Math.floor(p.t * 8) % 2; if (p.x < this.cam + this.vista.w * 0.75) p.est = 'quieto'; }
      if (pelea) { p.ladra -= dt; p.f = 2; if (p.ladra <= 0) { sfx('perro'); p.ladra = 0.8; p.cara = Math.sign(j.x - p.x) || 1; } if (p.t > 2.5) { p.est = 'huye'; p.t = 0; p.cara = -1; } }
      else if (p.est === 'quieto') { p.f = Math.abs(j.x - p.x) < 60 ? 2 : 0; p.cara = Math.sign(j.x - p.x) || 1; p.t = Math.min(p.t, 1); }
    }
  }
  pasoBondi(dt) {
    const b = this.bondi; if (!b) return;
    b.t += dt;
    if (b.t < 2.0) { if (b.t < 1.8 && Math.floor(b.t * 4) !== Math.floor((b.t - dt) * 4)) sfx('bocina'); return; }
    b.x -= 330 * dt;
    for (const o of this.ents) if (!o.muerto && o.est !== 'vuela' && o.z < 20 && o.y > 212 && o.y < 250 && o.x > b.x - 4 && o.x < b.x + 644 && !b.golpeados.has(o.id)) {
      b.golpeados.add(o.id); o.invul = 0; this.impacto(o, o, { dmg: o.equipo === 'j' ? 14 : 30, kb: 260, tumba: true, vz: 200, sfx: 'fuerte', hs: 0.06, crudo: true }, o.x, o.y, 40);
      o.vx = -260; if (o.equipo === 'e') this.puntos += 300;
    }
    if (b.x < this.cam - 700) this.bondi = null;
  }
  pasoParts(dt) {
    for (const p of this.parts) {
      p.t += dt;
      if (p.vx !== undefined) { p.x += p.vx * dt; }
      if (p.k === 'brasa' || p.k === 'vidrio') { p.vz -= GRAV * 0.8 * dt; p.z += p.vz * dt; if (p.z < 0) { p.z = 0; p.vz = -p.vz * 0.3; p.vx *= 0.6; } }
      else if (p.k === 'polvo') { p.z += p.vz * dt; p.vx *= 0.95; }
      else if (p.k === 'txt') p.z += p.vz * dt;
    }
    this.parts = this.parts.filter((p) => p.t < p.vida);
    if (this.parts.length > 260) this.parts.splice(0, this.parts.length - 260);
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
  encolar(lista) { for (const [k, v] of lista) this.colaSpawn.push([k, v]); }
  oleadas(dt) {
    const w = this.vista.w;
    const o = this.olas[this.ola];
    if (!this.lock && o && this.cam >= o.cam - 0.5) {
      this.lock = o; this.encolar(o.enemigos); this.tSpawn = 0.3; this.tLock = 0;
      if (o.jefe) { this.jefeIntro = 2.2; musica('jefe'); }
      for (const p of this.perros) if (p.est === 'quieto') { p.t = 0; }
    }
    if (this.lock) {
      this.tLock += dt;
      if (this.lock.bondi && !this.bondiHecho && this.tLock > 5) { this.bondiHecho = true; this.bondi = { x: this.cam + w + 40, y: 252, t: 0, golpeados: new Set() }; this.mensaje = { txt: '¡CUIDADO, EL 121!', t: 0, dur: 2.2 }; }
      if (this.jefeIntro > 0) { this.jefeIntro -= dt; if (this.jefeIntro <= 0 && this.jefe) this.globo(this.jefe, '¿QUIÉN SE METIÓ EN MI CUADRA?', 2); }
      this.tSpawn -= dt;
      const enPantalla = this.ents.filter((e) => e.equipo === 'e' && !e.muerto).length;
      if (this.colaSpawn.length && this.tSpawn <= 0 && enPantalla < 4) {
        const [k, v] = this.colaSpawn.shift(); const lado = k === 'tano' ? 1 : (Math.random() < 0.55 ? 1 : -1);
        const x = lado > 0 ? this.cam + w + 26 : this.cam - 26; const y = PISO.arriba + 10 + Math.random() * (PISO.abajo - PISO.arriba - 20);
        const e = this.crearEnemigo(k, v, x, y); e.entrando = k === 'tano' ? 1.6 : 0.5; e.cara = -lado;
        this.tSpawn = 0.7 + Math.random() * 0.6;
      }
      if (!this.colaSpawn.length && enPantalla === 0 && this.tLock > 1) {
        if (this.lock.jefe) { this.estado = 'gana'; this.tEstado = 0; this.ola++; this.j.est = 'festeja'; this.j.t = 0; sfx('dale'); this.lock = null; return; }
        this.lock = null; this.ola++; this.dale = 3.2; sfx('dale'); this.tiempo = Math.max(this.tiempo, 90);
        if (Math.random() < 0.6) this.globo(this.j, pick(FRASES.jugador), 1.2);
      }
    }
    if (this.mensaje) { this.mensaje.t += dt; if (this.mensaje.t > this.mensaje.dur) this.mensaje = null; }
    this.revisarJugador();
  }

  // ------------------------------------------------------------- render del mundo
  dibujar(x, alfa, W, H) {
    const off = H - ALTO;
    const lerp = (a, b) => a + (b - a) * alfa;
    let cam = lerp(this.camPrev, this.cam);
    let sx = 0, sy = 0; if (this.temblor > 0) { const k = Math.min(1, this.temblor * 8); sx = Math.round((Math.random() - 0.5) * 4 * k); sy = Math.round((Math.random() - 0.5) * 3 * k); }
    const C = Math.round(cam) - sx;
    // cielo
    const key = W + 'x' + H; if (this.cieloKey !== key) { this.cieloC = cielo(W, H); this.cieloKey = key; }
    x.drawImage(this.cieloC, 0, 0);
    x.drawImage(this.sol, Math.round(W * 0.62 - cam * 0.02), off + 96);
    const lj = Math.round(cam * 0.15) % (this.capaLejos.width - W); x.drawImage(this.capaLejos, lj, 0, W, ALTO, 0, off + sy, W, ALTO);
    const md = Math.min(this.capaMedio.width - W, Math.round(cam * 0.45)); x.drawImage(this.capaMedio, md, 0, W, ALTO, 0, off + sy, W, ALTO);
    x.drawImage(this.capaCalle, Math.max(0, C), 0, W, ALTO + EXTRA, 0, off + sy - EXTRA, W, ALTO + EXTRA);
    const Y = off + sy;
    // lista ordenada por profundidad
    const lista = this._lista || (this._lista = []); lista.length = 0;
    for (const d of this.decor) if (d.x > C - 80 && d.x < C + W + 80) lista.push(d);
    for (const r of this.rompibles) if (r.x > C - 60 && r.x < C + W + 60) lista.push(r);
    for (const it of this.items) if (it.est !== 'mano' && it.x > C - 40 && it.x < C + W + 40) lista.push(it);
    for (const e of this.ents) lista.push(e);
    for (const p of this.perros) if (p.est !== 'fuera') lista.push(p);
    if (this.bondi) lista.push(this.bondi);
    for (const o of lista) o._ys = !o.hpMax && o.sp && o.sp.w ? o.y : (o.py !== undefined ? lerp(o.py, o.y) : o.y);
    lista.sort((a, b) => a._ys - b._ys);
    // sombras
    for (const o of lista) {
      if (o === this.bondi) continue;
      const ox = o.px !== undefined ? lerp(o.px, o.x) : o.x, oz = o.pz !== undefined ? lerp(o.pz, o.z) : (o.z || 0);
      const w = o.hpMax ? (o.st.jefe ? 56 : o.est === 'piso' ? 60 : 38) * Math.max(0.5, 1 - oz / 160) : o.sp && o.sp.w ? o.sp.w * 0.9 : o.t === 'pelota' ? 10 : typeof o.t === 'string' && SP[o.t] && SP[o.t].w ? SP[o.t].w * 0.9 : 26;
      const s = sombra(w); x.drawImage(s, Math.round(ox - C - s.width / 2), Math.round(o._ys + Y - s.height / 2));
    }
    for (const o of lista) this.dibujarObj(x, o, C, Y, lerp);
    // partículas
    for (const p of this.parts) this.dibujarPart(x, p, C, Y);
    // primer plano
    for (const f of this.frente) { const fx = Math.round(f.x - cam * 1.25 - sx); if (fx < -80 || fx > W + 10) continue; x.drawImage(f.sp, fx, H - f.sp.height + f.baja + sy); }
    // nombres y barras de enemigos (como la referencia)
    for (const e of this.ents) if (e.equipo === 'e' && !e.muerto && !e.st.jefe && e.x > C && e.x < C + W) {
      const ex = Math.round(lerp(e.px, e.x) - C), ey = Math.round(lerp(e.py, e.y) - lerp(e.pz, e.z) + Y - e.sp.h + 8);
      texto(x, e.nombre, ex, ey - 12, '#ffffff', 1, 'centro');
      x.fillStyle = '#1b1220'; x.fillRect(ex - 19, ey - 2, 38, 6); x.fillStyle = '#5a1018'; x.fillRect(ex - 18, ey - 1, 36, 4);
      x.fillStyle = '#e8303a'; x.fillRect(ex - 18, ey - 1, Math.round(36 * Math.max(0, e.hp) / e.hpMax), 4); x.fillStyle = '#ff8a8a'; x.fillRect(ex - 18, ey - 1, Math.round(36 * Math.max(0, e.hp) / e.hpMax), 1);
    }
    // globos de diálogo
    for (const g of this.globos) {
      const e = g.e; const gx = Math.round(lerp(e.px, e.x) - C), gy = Math.round(lerp(e.py, e.y) - lerp(e.pz, e.z) + Y - e.sp.h - (e.equipo === 'e' && !e.st.jefe ? 18 : 2));
      const gy2 = Math.max(gy, 72); const w = g.txt.length * 8 + 8; let bx = Math.max(2, Math.min(W - w - 2, gx - w / 2));
      x.fillStyle = '#1b1220'; x.fillRect(bx - 1, gy2 - 15, w + 2, 15); x.fillStyle = '#fff8e8'; x.fillRect(bx, gy2 - 14, w, 13);
      x.fillStyle = '#fff8e8'; x.fillRect(gx - 2, gy2 - 2, 5, 3); x.fillStyle = '#1b1220'; x.fillRect(gx - 3, gy2 - 2, 1, 3); x.fillRect(gx + 3, gy2 - 2, 1, 3); x.fillRect(gx - 2, gy2 + 1, 5, 1);
      texto(x, g.txt, bx + 4, gy2 - 11, '#1b1220', 1, 'izq', null);
    }
  }
  dibujarObj(x, o, C, Y, lerp) {
    if (o === this.bondi) return this.dibujarBondi(x, o, C, Y);
    if (o.hpMax) { // luchador
      if (o.blink > 0) { o.blink -= 1 / 120; if (Math.floor(this.t * 30) % 2) return; }
      if (o.invul > 0 && o.equipo === 'j' && o.est !== 'ataca' && Math.floor(this.t * 20) % 2) return;
      // solo elección de cuadro (los tiempos y alcances de los golpes no cambian)
      const conArma = o.arma && (o.anim === 'quieto' || o.anim === 'camina');
      if (o.sp.q !== Q) { o.sp = vigente(o.sp); partida(this.ents.filter((e) => e.sp && e.sp.anims).map((e) => (e.sp = vigente(e.sp)))); } // cambió la densidad (rotación): sprites regenerados
      // las animaciones con arma de los enemigos se dibujan en segundo plano la primera vez (mientras, la normal)
      const nomA = conArma && (o.equipo === 'j' || lista(o.sp, o.anim + 'Arma')) ? o.anim + 'Arma' : o.anim;
      const an = o.sp.anims[nomA] || o.sp.anims.quieto; let fi = 0;
      if (o.anim === 'quieto') fi = Math.floor(this.t * 4.4 + o.id) % 4;
      else if (o.anim === 'camina') fi = Math.floor(o.t * 15 * (o.st.vel || 60) / 70) % 8;
      else if (o.est === 'ataca' && o.atq) { const A = o.atq; fi = A.giro ? Math.floor(o.t / 0.09) % 2 : cuadroAtaque(o.anim, o.t, A); }
      else if (o.anim === 'levanta') fi = o.t < 0.07 ? 0 : o.t < 0.14 ? 1 : o.t < 0.21 ? 2 : 3;
      else if (o.anim === 'piso') fi = o.t < 0.1 ? 0 : 1;
      else if (o.anim === 'dolor') fi = (o.fr || 0) * 2 + (o.t < 0.08 ? 0 : 1);
      else if (o.anim === 'vuela') fi = o.vz > 90 ? 0 : o.vz > -90 ? 1 : 2;
      else if (o.anim === 'revolea') fi = o.t < 0.12 ? 0 : 1;
      else if (o.anim === 'rodilla') fi = o.t < 0.07 ? 0 : 1;
      else if (o.anim === 'junta') fi = o.t < 0.06 ? 0 : 1;
      else if (o.anim === 'festeja') fi = Math.floor(this.t * 3) % 2;
      fi = Math.min(fi, an.length - 1);
      const f = an[fi];
      // posición en la grilla de subpíxeles (1/Q px): cada píxel del sprite cae exacto en el lienzo, sin muestreo a medias
      const X = Math.round((lerp(o.px, o.x) - C) * Q) / Q, Yp = Math.round((lerp(o.py, o.y) - lerp(o.pz, o.z) + Y) * Q) / Q;
      // temblor cuando le pegan
      const sh = o.est === 'dolor' && o.t < 0.12 ? (Math.floor(o.t * 60) % 2 ? 1 : -1) : 0;
      dibujarCuadro(x, f, X + sh, Yp, o.cara);
      if (o.est === 'dolor' && o.t < 0.06) { x.globalAlpha = 0.55 - o.t * 7; dibujarCuadro(x, siluetaBlanca(f), X + sh, Yp, o.cara); x.globalAlpha = 1; } // destello del impacto
      if (o.alerta > 0 && o.equipo === 'e' && o.est !== 'piso' && o.est !== 'vuela') { const ay = Yp - f.pies[1] / f.q - 12 + (o.alerta > 0.55 ? -2 : 0); texto(x, '!', X, ay, '#ff3a2a', 2, 'centro', CONTORNO, '#5a0a0a'); }
      if (o.arma) { // arma en la mano
        const s = SP[o.arma.t]; const [hx, hy, ang] = f.mano; const mx = X + o.cara * (hx - f.pies[0]) / f.q, my = Yp + (hy - f.pies[1]) / f.q;
        x.save(); x.translate(mx, my); x.rotate(o.cara > 0 ? Math.PI / 2 - ang : -(Math.PI / 2 - ang)); const img = o.cara > 0 ? s.d : s.i;
        const tall = s.h > s.w; if (tall) x.rotate(o.cara > 0 ? Math.PI / 2 : -Math.PI / 2);
        x.drawImage(img, o.cara > 0 ? -4 : -s.w + 4, -Math.round(s.h / 2)); x.restore();
      }
      return;
    }
    if (o.sp && o.sp.w) { // decorado
      const s = o.sp; x.drawImage(s.d, Math.round(o.x - C - s.w / 2), Math.round(o.y + Y - s.h)); return;
    }
    if (o.hp !== undefined && o.t && SP[o.t]) { // rompible
      const s = o.roto ? SP[o.t === 'cajon' ? 'cajonRoto' : o.t === 'tacho' ? 'tachoRoto' : 'carton'] : SP[o.t]; let sh = 0; if (o.sacude > 0) { o.sacude -= 1 / 120; sh = Math.floor(this.t * 50) % 2 ? 1 : -1; }
      x.drawImage(s.d, Math.round(o.x - C - s.w / 2) + sh, Math.round(o.y + Y - s.h)); return;
    }
    if (o.ladra !== undefined) { // perro
      const s = SP.perro[o.f || 0]; x.drawImage(o.cara > 0 ? s.d : s.i, Math.round(o.x - C - s.w / 2), Math.round(o.y + Y - s.h)); return;
    }
    // ítem
    const s = o.t === 'pelota' ? SP.pelota[Math.floor(Math.abs(o.x) / 6) % 2] : SP[o.t]; if (!s) return;
    const ix = Math.round(lerp(o.px, o.x) - C), iy = Math.round(lerp(o.py, o.y) - lerp(o.pz, o.z) + Y);
    if (o.est === 'vuela' && o.t !== 'pelota') { x.save(); x.translate(ix, iy - s.h / 2); x.rotate(o.rot); x.drawImage(s.d, -s.w / 2, -s.h / 2); x.restore(); return; }
    // brillo para que se note que se puede agarrar
    if (o.est === 'piso' && o.t !== 'pelota' && Math.floor(this.t * 3 + o.id) % 4 === 0) { x.fillStyle = '#fff6c0'; x.fillRect(ix - 1, iy - s.h - 4, 3, 1); x.fillRect(ix, iy - s.h - 5, 1, 3); }
    x.drawImage(s.d, Math.round(ix - s.w / 2), iy - s.h + 1);
  }
  dibujarBondi(x, b, C, Y) {
    if (!this.spBondi) this.spBondi = crearBondi();
    if (b.t < 2) { // aviso a la derecha
      if (Math.floor(b.t * 6) % 2) { texto(x, '¡121!', this.vista.w - 30, Y + 216, '#ffd040', 1, 'centro'); x.fillStyle = '#ffd040'; x.fillRect(this.vista.w - 8, Y + 228, 4, 10); x.fillRect(this.vista.w - 12, Y + 230, 4, 6); }
      return;
    }
    x.drawImage(this.spBondi, Math.round(b.x - C), Math.round(Y + 252 - this.spBondi.height));
  }
  dibujarPart(x, p, C, Y) {
    const px = Math.round(p.x - C), py = Math.round(p.y - p.z + Y);
    const k = p.t / p.vida;
    switch (p.k) {
      case 'chispa': { // estrella de impacto como la referencia: rayos naranjas, estrella amarilla y núcleo blanco
        const r = Math.round((p.g ? 22 : 13) * (k < 0.25 ? 0.5 + k * 2 : 1)); const a = (p.x * 7) % 1;
        if (k < 0.5) { x.fillStyle = 'rgba(255,240,180,0.35)'; x.beginPath(); x.arc(px, py, r * 0.9, 0, 7); x.fill(); }
        for (let i = 0; i < 12; i++) { const an = a + i * Math.PI / 6; const L = i % 2 ? r * 0.55 : r * (i % 4 ? 0.85 : 1.15); x.fillStyle = k < 0.5 ? '#ff9a2a' : '#ffb84a';
          for (let s = r * 0.3; s < L; s += 1) { const w = s < L * 0.6 ? 2 : 1; x.fillRect(px + Math.round(Math.cos(an) * s) - (w >> 1), py + Math.round(Math.sin(an) * s) - (w >> 1), w, w); } }
        x.fillStyle = '#ffd040'; for (let i = 0; i < 8; i++) { const an = a + i * Math.PI / 4 + 0.2; const L = i % 2 ? r * 0.35 : r * 0.6; for (let s = 0; s < L; s += 1) x.fillRect(px + Math.round(Math.cos(an) * s) - 1, py + Math.round(Math.sin(an) * s) - 1, 3, 3); }
        x.fillStyle = '#fff6d0'; x.fillRect(px - 4, py - 4, 8, 8); x.fillStyle = '#ffffff'; x.fillRect(px - 3, py - 3, 6, 6);
        break; }
      case 'brasa': x.fillStyle = k < 0.5 ? '#ffe27a' : '#ff8a3a'; x.fillRect(px, py, 1, 1 + (k < 0.3)); break;
      case 'vidrio': x.fillStyle = p.c; x.fillRect(px, py, p.gr ? 2 : 1, p.gr ? 2 : 2); break;
      case 'polvo': { x.fillStyle = 'rgba(220,200,200,' + (0.5 * (1 - k)).toFixed(2) + ')'; const r = 2 + Math.round(k * 4); x.fillRect(px - r, py - r, r * 2, r * 2); break; }
      case 'txt': texto(x, p.txt, px, py - 6, p.c, 1, 'centro'); break;
      case 'aviso': { const e = p.e; if (e.borrar || e.est !== 'ataca') { p.t = 99; break; } const ex = Math.round(e.x - C), ey = Math.round(e.y - e.z + Y - e.sp.h + 2); if (Math.floor(p.t * 16) % 2 === 0) { x.fillStyle = '#1b1220'; x.fillRect(ex - 3, ey - 16, 6, 14); x.fillStyle = '#ff2a2a'; x.fillRect(ex - 2, ey - 15, 4, 8); x.fillRect(ex - 2, ey - 5, 4, 2); } break; }
      case 'boom': { const r = Math.round(10 + k * 34); x.fillStyle = k < 0.3 ? '#fff6c0' : k < 0.6 ? '#ffb040' : '#8a4a4a'; for (let i = -r; i <= r; i += 2) { const h = Math.round(Math.sqrt(r * r - i * i) * 0.8); x.fillRect(px + i, py - h - 10, 2, h * 2); } break; }
      case 'aro': { const r = Math.round(10 + k * 70); x.fillStyle = '#ffffff'; for (let a = 0; a < 6.28; a += 0.12) x.fillRect(px + Math.round(Math.cos(a) * r), py + Math.round(Math.sin(a) * r * 0.35), 2, 2); break; }
    }
  }
}

const cacheOsc = new Map();
function oscurecer(s) {
  let c = cacheOsc.get(s); if (c) return c;
  const [cv, x] = lienzo(s.w, s.h); x.drawImage(s.d, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(40,16,48,0.38)'; x.fillRect(0, 0, s.w, s.h);
  cacheOsc.set(s, cv); return cv;
}
function crearBondi() {
  // ómnibus urbano a escala (≈11,5 m × 3 m → 644 × 168 px; ruedas de 1 m)
  const BW = 644, BH = 172; const [cv, x] = lienzo(BW, BH);
  const R = (a, b, w, h, c) => { x.fillStyle = c; x.fillRect(Math.round(a), Math.round(b), Math.round(w), Math.round(h)); };
  const top = 6, base = 150;
  R(0, top, BW, base - top, '#1b1220'); R(2, top + 2, BW - 4, base - top - 4, '#e8e4dc'); R(2, top + 2, BW - 4, 6, '#f6f4ee'); R(2, base - 12, BW - 4, 10, '#b8b4ac');
  R(2, 104, BW - 4, 14, '#2a8a4a'); R(2, 118, BW - 4, 4, '#1f6a38'); R(2, 98, BW - 4, 3, '#2a8a4a'); // franjas
  R(40, top - 4, 200, 6, '#9a9890'); R(400, top - 4, 120, 6, '#9a9890'); // equipos en el techo
  // parabrisas y cartel de destino
  R(4, 14, 40, 18, '#1b1220'); R(6, 16, 36, 14, '#2a1a10'); x.fillStyle = '#ffb040'; for (let i = 0; i < 3; i++) R(9 + i * 9, 19, 6, 8, '#ffb040');
  R(4, 34, 42, 62, '#1b1220'); R(6, 36, 38, 58, '#7aa8c8'); R(9, 38, 6, 50, '#bfe0f0'); R(26, 40, 10, 2, '#bfe0f0');
  // puerta delantera y trasera (2,1 m)
  const puertaB = (px) => { R(px, 30, 58, 120, '#1b1220'); R(px + 2, 32, 26, 114, '#5a7a90'); R(px + 30, 32, 26, 114, '#5a7a90'); R(px + 4, 34, 4, 100, '#9ac0d8'); R(px + 32, 34, 4, 100, '#9ac0d8'); R(px + 2, 88, 54, 2, '#1b1220'); };
  puertaB(52); puertaB(370);
  // ventanillas
  for (let wx = 118; wx < BW - 20; wx += 62) { if (wx > 350 && wx < 432) continue; R(wx, 32, 56, 56, '#1b1220'); R(wx + 2, 34, 52, 52, '#7aa8c8'); R(wx + 4, 36, 6, 46, '#bfe0f0'); R(wx + 2, 46, 52, 2, '#5a7a90');
    if ((wx / 62 | 0) % 3 === 0) { R(wx + 18, 60, 14, 26, '#3a2a3a'); R(wx + 20, 52, 10, 10, '#c89070'); } } // pasajeros
  R(470, 108, 140, 8, '#e8e4dc'); x.fillStyle = '#1b1220'; // número lateral
  for (let i = 0; i < 3; i++) R(480 + i * 16, 109, 10, 6, '#1b1220');
  R(BW - 10, 30, 6, 90, '#1b1220'); R(BW - 8, 40, 4, 10, '#d84a2a'); // trasera
  R(2, 124, 8, 8, '#fff6a0'); R(2, 136, 10, 6, '#3a3a40'); // faro y paragolpes
  for (const wx of [100, 520]) { R(wx - 38, 118, 76, 34, '#1b1220'); x.fillStyle = '#1a1a1a'; for (let j = -28; j <= 28; j++) { const ww = Math.round(Math.sqrt(28 * 28 - j * j)); R(wx - ww, 142 + j, ww * 2, 1, j * j < 16 * 16 ? (j * j < 8 * 8 ? '#aaaab0' : '#55555f') : '#1a1a1a'); } }
  return cv;
}
