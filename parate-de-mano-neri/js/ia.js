// Inteligencia de enemigos: un director reparte turnos de ataque y cada tipo tiene su forma de pelear.
// Los jefes y mini jefes tienen patrones propios (fases, llamados, furia). Todo usa la API del Juego (g).
import { ATQ, ITEMS, FRASES, COMIDA, pick } from './datos.js';
import { PISO } from './escenario.js';
import { sonar, voz } from './audio.js';

// ataques propios de la IA (no los usa el jugador)
const A = {
  toque: { anim: 'tamborOnda', ini: 0.25, act: 0.02, rec: 0.9, dmg: 0, x: [0, 0], son: 'enem.tambor.toque', hs: 0, buffo: true },
  silbato: { anim: 'golpe', ini: 0.35, act: 0.02, rec: 0.7, dmg: 0, x: [0, 0], son: 'enem.silbato', hs: 0, silba: true },
  brasas: { anim: 'golpe', ini: 0.4, act: 0.02, rec: 0.6, dmg: 0, x: [0, 0], son: 'enem.parrilla.fuego', hs: 0, brasas: true },
  abre: { anim: 'bloquea', ini: 0.05, act: 1.5, rec: 0.2, dmg: 0, x: [0, 0], son: 'enem.paraguas.abre', hs: 0, cubre: true },
};
const cl = (v) => (v < -1 ? -1 : v > 1 ? 1 : v);
const vivosBuf = [], rodBuf = [];

// ---------- director: reparte quién ataca y dónde se paran los demás (cada 0,25 s)
export function director(g, dt) {
  g.tDir = (g.tDir || 0) - dt; if (g.tDir > 0) return; g.tDir = 0.25;
  const j = g.j; const vivos = vivosBuf; vivos.length = 0;
  for (const e of g.ents) if (e.equipo === 'e' && !e.muerto && e.est !== 'piso' && e.est !== 'vuela') vivos.push(e);
  for (const e of vivos) e.ia.dd = Math.abs(e.x - j.x) + Math.abs(e.y - j.y) * 2;
  vivos.sort((a, b) => a.ia.dd - b.ia.dd);
  const caido = j.est === 'piso' || j.est === 'levanta' || j.invul > 0.5;
  let cupo = caido ? 1 : (g.nv.cupo || 2) + (g.ola >= 2 && vivos.length >= 4 ? 1 : 0);
  const rod = rodBuf; rod.length = 0;
  for (const e of vivos) {
    if (e.st.jefe || e.mini) { e.ia.rol = 'atacar'; cupo--; continue; }
    // los de lejos (gomera, naranjas, bandejas) no ocupan turno de cuerpo a cuerpo
    if (e.st.ia === 'guri' || e.st.ia === 'tambor') { e.ia.rol = 'lejos'; continue; }
    if (cupo > 0 && e.ia.retro <= 0) { e.ia.rol = 'atacar'; cupo--; if (!e.vioAlerta) { e.vioAlerta = true; e.alerta = 0.7; } } else { e.ia.rol = 'rodear'; rod.push(e); }
  }
  for (let i = 0; i < rod.length; i++) { const e = rod[i]; e.ia.lado = i % 2 === 0 ? Math.sign(e.x - j.x) || 1 : -(Math.sign(rod[0].x - j.x) || 1); e.ia.dist = 70 + (i % 3) * 22; e.ia.dy = ((i * 37) % 60) - 30; }
}

// ---------- por enemigo, cada paso
export function pensar(g, e, dt) {
  const j = g.j, ia = e.ia; e.intent.mx = 0; e.intent.my = 0; if (e.alerta > 0) e.alerta -= dt; if (e.buff > 0) e.buff -= dt;
  if (e.muerto || e.est === 'agarrado' || e.est === 'vuela' || e.est === 'piso' || e.est === 'levanta' || e.est === 'dolor') return;
  if (e.est === 'agarra') return agarrando(g, e, dt);
  if (g.estado !== 'jugando' || (j.hp <= 0 && j.est === 'piso')) { if (e.est !== 'festeja' && j.hp <= 0) e.est = 'festeja'; return; }
  if (e.est === 'festeja') e.est = 'quieto';
  if (e.entrando > 0) { e.entrando -= dt; e.intent.mx = Math.sign(g.cam + g.vista.w / 2 - e.x); return; }
  ia.cd -= dt; ia.frase -= dt; if (ia.retro > 0) ia.retro -= dt; if (ia.tiro > 0) ia.tiro -= dt;
  if (ia.frase <= 0) { ia.frase = 6 + Math.random() * 8; if (Math.random() < 0.5) g.globo(e, pick(e.st.jefe ? FRASES[e.clave].pelea : (FRASES[e.clave] || FRASES.enemigo)), 1.4); }
  if (e.est !== 'quieto' && e.est !== 'camina') return;
  const dx = j.x - e.x, dy = j.y - e.y, adx = Math.abs(dx);
  // el chorro que huye no se da vuelta
  if (!(ia.huye > 0)) e.cara = Math.sign(dx) || e.cara;
  if (e.st.esquiva && j.est === 'ataca' && adx < 44 && Math.abs(dy) < 12 && Math.random() < e.st.esquiva * dt * 8) { e.vx = -Math.sign(dx) * 170; e.vy = (Math.random() - 0.5) * 60; e.est = 'salto'; e.vz = 120; e.t = 0; e.aereo = true; sonar('mov.esquive', g.pan(e.x)); return; }
  if (ia.retro > 0 && !e.st.jefe) { e.intent.mx = -Math.sign(dx) * 0.7; e.intent.my = (Math.random() - 0.5) * 0.4; return; }
  const f = TIPOS[e.st.ia] || base; f(g, e, dt, dx, dy, adx);
  if (!(ia.huye > 0) && !ia.escapa) { if (e.x < g.cam - 10) e.intent.mx = 1; if (e.x > g.cam + g.vista.w + 10) e.intent.mx = -1; }
}
function solo(g) { let n = 0; for (const o of g.ents) if (o.equipo === 'e' && !o.muerto) n++; return n === 1 && !g.colaSpawn.length; }
function ir(e, tx, ty, kx = 12, ky = 8, f = 1) { const ex = tx - e.x, ey = ty - e.y; if (Math.abs(ex) > 5 || Math.abs(ey) > 3) { e.intent.mx = cl(ex / kx) * f; e.intent.my = cl(ey / ky) * f; return false; } return true; }
function rodear(g, e, dt) {
  const j = g.j, ia = e.ia; const lado = ia.lado || (Math.sign(e.x - j.x) || 1); const tx = j.x + lado * (ia.dist || 80), ty = Math.max(PISO.arriba, Math.min(PISO.abajo, j.y + (ia.dy || 0)));
  if (ir(e, tx, ty, 30, 20, 0.75)) { ia.ang += dt; e.intent.my = Math.sin(ia.ang * 1.3) * 0.3; }
}
// acercarse al costado del jugador y pegar cuando está en rango
function cuerpoACuerpo(g, e, dt, dy, adx, rango, elegir, sep = 32) {
  const j = g.j, ia = e.ia; const lado = Math.sign(e.x - j.x) || 1;
  if (!ir(e, j.x + lado * sep, j.y, 12, 8)) ia.react = e.st.reaccion * (e.mini ? 0.6 : 1);
  if (adx < rango && Math.abs(dy) < 8 && ia.cd <= 0 && j.est !== 'piso' && j.est !== 'levanta') {
    ia.react -= dt; if (ia.react > 0) return; e.cara = Math.sign(j.x - e.x) || 1; g.atacar(e, elegir());
  }
}
// lejos y alineado en y: dispara (gomera, naranjas, bandeja, boletos)
function alineado(g, e, dy, adx, min, max) { return adx > min && adx < max && Math.abs(dy) < 10 && e.x > g.cam + 8 && e.x < g.cam + g.vista.w - 8; }

// ---------- tipos comunes
function base(g, e, dt, dx, dy, adx) {
  const ia = e.ia, j = g.j;
  if (juntarArma(g, e, dt)) return;
  if (e.st.tira && ia.tiro <= 0 && ia.rol !== 'atacar' && alineado(g, e, dy, adx, 90, 220)) { ia.tiro = 4 + Math.random() * 4; if (e.arma && e.arma.t === 'botella') g.tirarArma(e); else if (!e.arma) g.atacar(e, ATQ.e_botella); return; }
  if (ia.rol === 'atacar') cuerpoACuerpo(g, e, dt, dy, adx, 50, () => {
    if (e.arma) return ATQ.e_golpe;
    if (e.clave === 'cacho') return Math.random() < 0.6 ? ATQ.e_pesada : ATQ.e_cruz;
    if (e.clave === 'mati') { const a = Math.random() < 0.7 ? ATQ.e_jab : ATQ.e_cruz; if (a === ATQ.e_jab) ia.cd = 0.15; return a; }
    return Math.random() < 0.65 ? ATQ.e_jab : ATQ.e_patada;
  });
  else rodear(g, e, dt);
  void j;
}
// levantar palos, botellas y termos del piso (los que no tienen arma propia)
function juntarArma(g, e, dt) {
  const ia = e.ia, j = g.j; if (e.arma || e.st.armaFija || e.st.jefe) return false;
  if (!ia.item || ia.item.est !== 'piso' || ia.item.borrar) {
    ia.item = null; ia.buscaArma = (ia.buscaArma || 0) - dt;
    if (ia.buscaArma <= 0) { ia.buscaArma = 0.6; for (const it of g.items) { const d = ITEMS[it.t]; if (it.est === 'piso' && d && d.arma && !d.soloTiro && !d.npc && !it.reservado && Math.abs(it.x - e.x) < 130 && Math.abs(it.x - j.x) > 24 && it.x > g.cam && it.x < g.cam + g.vista.w) { ia.item = it; it.reservado = e.id; break; } } }
  }
  if (ia.item && ia.rol !== 'atacar') {
    const it = ia.item;
    if (Math.abs(it.x - e.x) < 10 && Math.abs(it.y - e.y) < 6) { g.darArma(e, it); ia.item = null; e.est = 'junta'; e.t = 0; e.anim = 'junta'; e.vx = 0; e.vy = 0; if (Math.random() < 0.6) g.globo(e, pick(FRASES.arma), 1.1); return true; }
    ir(e, it.x, it.y, 10, 6); return true;
  }
  return false;
}

// ---------- chorro: rápido, roba comida o tu arma y sale corriendo; barrida
function chorro(g, e, dt, dx, dy, adx) {
  const ia = e.ia, j = g.j;
  if (ia.huye > 0) { // escapa con el botín hacia el borde más cercano
    ia.huye -= dt; ia.escapa = true; const dir = ia.dirHuye || (ia.dirHuye = e.x < g.cam + g.vista.w / 2 ? -1 : 1); e.cara = dir; e.intent.mx = dir; e.intent.my = cl((228 - e.y) / 20) * 0.3;
    if (e.x < g.cam - 30 || e.x > g.cam + g.vista.w + 30) g.escapo(e);
    return;
  }
  if (ia.escapa) { ia.escapa = false; ia.dirHuye = 0; } // no llegó a escaparse (lo frenaron): vuelve a pelear dentro de la pantalla
  // comida en el piso: va a robarla
  if (ia.rol !== 'atacar' || adx > 100) {
    let mejor = null; for (const it of g.items) if (it.est === 'piso' && it !== ia.ignora && COMIDA.includes(it.t) && Math.abs(it.x - e.x) < 220 && it.x > g.cam && it.x < g.cam + g.vista.w) { mejor = it; break; }
    if (mejor && mejor !== ia.ignora) { if (ia.meta !== mejor) { ia.meta = mejor; ia.tMeta = 0; } ia.tMeta += dt; if (ia.tMeta > 5) { ia.ignora = mejor; ia.meta = null; return; } /* no llega (algo en el medio): la deja */ if (ir(e, mejor.x, mejor.y, 8, 5)) { mejor.borrar = true; ia.botin = mejor.t; ia.huye = 3.5; sonar('item.robado', g.pan(e.x)); g.globo(e, pick(FRASES.robo), 1.2); g.fx.flotante(e.x, e.y, 50, '¡SE LLEVA EL ' + (mejor.t === 'chivito' ? 'CHIVITO' : 'MORFI') + '!', '#ff8a5a'); } return; }
  }
  if (ia.rol === 'atacar') cuerpoACuerpo(g, e, dt, dy, adx, j.arma ? 40 : 110, () => {
    if (j.arma && adx < 40) return ATQ.e_arrebato;
    if (adx > 50) return ATQ.e_barrida;
    return Math.random() < 0.3 ? ATQ.e_arrebato : ATQ.e_jab;
  }, j.arma ? 26 : 70);
  else rodear(g, e, dt);
}
// ---------- patova: lento, bloquea de frente, agarra y revolea
function patova(g, e, dt, dx, dy, adx) {
  const ia = e.ia;
  if (ia.rol !== 'atacar') return rodear(g, e, dt);
  cuerpoACuerpo(g, e, dt, dy, adx, 44, () => {
    if ((ia.bloqueos || 0) >= 2 || Math.random() < 0.3) { ia.bloqueos = 0; return ATQ.e_agarre; }
    return Math.random() < 0.55 ? ATQ.e_cruz : ATQ.e_pesada;
  }, 30);
}
function agarrando(g, e, dt) { // el patova tiene al jugador: lo aprieta y lo revolea
  const v = e.agarrando; if (!v || v.est !== 'agarrado') { e.agarrando = null; e.est = 'quieto'; e.t = 0; return; }
  e.tAg += dt;
  if (!e.revolea && e.tAg > 0.95) { e.anim = 'revolea'; e.t = 0; e.revolea = true; sonar('golpe.revoleo', g.pan(e.x)); }
}
// ---------- gurí: gomera de lejos; si te acercás, se escapa
function guri(g, e, dt, dx, dy, adx) {
  const ia = e.ia, j = g.j;
  // se escapa un ratito (1 s) y después se planta: así se lo puede agarrar
  ia.panico = (ia.panico || 0) - dt;
  if (adx < 80 && Math.abs(dy) < 30) {
    if (ia.panico > -2.2 && ia.panico <= 0 && !ia.huyendo) { ia.huyendo = true; ia.panico = 1.0; }
    if (ia.huyendo && ia.panico > 0) { e.intent.mx = (-Math.sign(dx) || 1) * 0.9; e.intent.my = cl(-dy / 30) * 0.5; return; }
    ia.huyendo = false; if (ia.panico < -2.2) ia.panico = 0;
    if (adx < 36 && ia.cd <= 0 && Math.abs(dy) < 8) { e.cara = Math.sign(dx) || 1; g.atacar(e, ATQ.e_jab); ia.cd = 0.9; return; }
    ir(e, g.j.x + (Math.sign(e.x - g.j.x) || 1) * 30, g.j.y, 12, 8, 0.6); return;
  }
  if (solo(g) && ia.panico < 0) { if (adx < 36 && ia.cd <= 0 && Math.abs(dy) < 8) { e.cara = Math.sign(dx) || 1; g.atacar(e, ATQ.e_jab); ia.cd = 0.9; return; } ir(e, j.x + (Math.sign(e.x - j.x) || 1) * 30, j.y, 12, 8, 0.7); return; }
  if (ia.cd <= 0 && alineado(g, e, dy, adx, 100, 280)) { e.cara = Math.sign(dx) || 1; g.atacar(e, ATQ.e_gomera); ia.cd = (1.5 + Math.random()) / (e.buff > 0 ? 1.6 : 1); return; }
  const lado = Math.sign(e.x - j.x) || 1; ir(e, Math.max(g.cam + 20, Math.min(g.cam + g.vista.w - 20, j.x + lado * 170)), j.y, 20, 8, 0.9);
}
// ---------- faca: tajo corto con brillo de aviso; si quedás a media distancia, puntazo con envión
function faca(g, e, dt, dx, dy, adx) {
  if (e.ia.rol === 'atacar') cuerpoACuerpo(g, e, dt, dy, adx, 44, () => (adx > 26 && Math.random() < 0.45 ? ATQ.e_puntazo : ATQ.e_facazo), 30); else rodear(g, e, dt);
}
// ---------- cuidacoches: palo largo con aviso
function cuida(g, e, dt, dx, dy, adx) {
  if (e.ia.rol === 'atacar') cuerpoACuerpo(g, e, dt, dy, adx, 62, () => (Math.random() < 0.6 ? ATQ.e_palazo : ATQ.e_barre), 44); else rodear(g, e, dt);
}
// ---------- doña: escoba larga, y te tira naranjas de la bolsa
function dona(g, e, dt, dx, dy, adx) {
  const ia = e.ia;
  if (ia.tiro <= 0 && alineado(g, e, dy, adx, 80, 220)) { ia.tiro = 3 + Math.random() * 2.5; e.cara = Math.sign(dx) || 1; g.atacar(e, ATQ.e_naranja); return; }
  if (ia.rol === 'atacar') cuerpoACuerpo(g, e, dt, dy, adx, 66, () => ATQ.e_barre, 48); else rodear(g, e, dt);
}
// ---------- tambor: toca y agranda a los suyos; de cerca, onda con el tambor
function tambor(g, e, dt, dx, dy, adx) {
  const ia = e.ia, j = g.j;
  if (adx < 44 && Math.abs(dy) < 10 && ia.cd <= 0) { e.cara = Math.sign(dx) || 1; g.atacar(e, ATQ.e_tambor); ia.cd = 1.2; return; }
  // si quedó solo, deja de tocar y va al frente (no se queda escondido en el borde)
  if (solo(g)) { ir(e, j.x + (Math.sign(e.x - j.x) || 1) * 34, j.y, 12, 8, 0.8); return; }
  ia.toque = (ia.toque ?? 1.5) - dt;
  if (ia.toque <= 0) { ia.toque = 5 + Math.random() * 2; g.atacar(e, A.toque); return; }
  const lado = Math.sign(e.x - j.x) || 1; ir(e, Math.max(g.cam + 24, Math.min(g.cam + g.vista.w - 24, j.x + lado * 130)), Math.max(PISO.arriba, j.y - 20), 20, 12, 0.7);
}
// ---------- mozo: bandejas que vuelven y combinación rápida
function mozo(g, e, dt, dx, dy, adx) {
  const ia = e.ia;
  if (ia.tiro <= 0 && !ia.bandejaFuera && alineado(g, e, dy, adx, 90, 240)) { ia.tiro = 2.8 + Math.random() * 2; e.cara = Math.sign(dx) || 1; g.atacar(e, ATQ.e_bandeja); return; }
  if (ia.rol === 'atacar') cuerpoACuerpo(g, e, dt, dy, adx, 46, () => { ia.cd = ia.seguidos++ % 2 ? 0.6 : 0.05; return ATQ.e_combo; }); else rodear(g, e, dt);
}
// ---------- pescador: te engancha de lejos con la caña y te trae
function pescador(g, e, dt, dx, dy, adx) {
  const ia = e.ia;
  if (ia.cd <= 0 && alineado(g, e, dy, adx, 60, 150)) { e.cara = Math.sign(dx) || 1; g.atacar(e, ATQ.e_lanza); ia.cd = 2.5; return; }
  if (ia.rol === 'atacar') cuerpoACuerpo(g, e, dt, dy, adx, 56, () => ATQ.e_golpe, 40); else rodear(g, e, dt);
}

// ---------- jefes
function acomodar(g, e, dx, dy, d = 40) { // se pone del lado del centro para que la pelea no se vaya al borde
  const j = g.j, centro = g.cam + g.vista.w / 2; const lado = j.x > centro + 30 ? -1 : j.x < centro - 30 ? 1 : (Math.sign(e.x - j.x) || 1);
  const tx = Math.max(g.cam + 50, Math.min(g.cam + g.vista.w - 50, j.x + lado * d)); e.intent.mx = cl((tx - e.x) / 20) * 0.85; e.intent.my = cl(dy / 10) * 0.85;
}
function fases(g, e, umbral, fn) { const ia = e.ia; if (!ia.f50 && e.hp < e.hpMax * umbral) { ia.f50 = true; g.globo(e, FRASES[e.clave].furia, 1.8); voz(e.clave, 'risa', g.pan(e.x)); fn(); } }
function tano(g, e, dt, dx, dy, adx) {
  const ia = e.ia, j = g.j;
  fases(g, e, 0.5, () => { g.encolar([['mati', 1], ['buzo', 2]]); g.soltarItem('chivito', g.cam + 40 + Math.random() * (g.vista.w - 80), 236, 60, 0, 0); });
  if (adx < 50 && Math.abs(dy) < 14) ia.tCerca += dt; else ia.tCerca = Math.max(0, ia.tCerca - dt);
  if (ia.cd > 0) return acomodar(g, e, dx, dy);
  if (ia.tCerca > 1.3) { ia.tCerca = 0; g.atacar(e, ATQ.e_piston); return; }
  if (adx > 110 && Math.abs(dy) < 10 && Math.random() < dt * 2.5) { e.cara = Math.sign(dx); g.atacar(e, ATQ.e_embestida); g.globo(e, '¡AHÍ VOY!', 0.8); return; }
  if (adx < 46 && Math.abs(dy) < 8) { e.cara = Math.sign(dx); g.atacar(e, Math.random() < 0.5 ? ATQ.e_cruz : ATQ.e_pesada); ia.cd = 0.4; return; }
  acomodar(g, e, dx, dy, 34); if (adx > 140 && Math.abs(dy) > 10) e.intent.my = Math.sign(dy); void j;
}
function chola(g, e, dt, dx, dy, adx) {
  const ia = e.ia;
  fases(g, e, 0.5, () => { g.encolar([['dona', 1], ['chorro', 0], ['dona', 2]]); g.soltarItem('tortafrita', g.cam + 60 + Math.random() * (g.vista.w - 120), 240, 60, 0, 0); });
  if (ia.cd > 0) return acomodar(g, e, dx, dy, 60);
  const furia = ia.f50 ? 0.7 : 1;
  if (adx > 120 && Math.abs(dy) < 10 && Math.random() < dt * 2) { e.cara = Math.sign(dx); g.atacar(e, ATQ.j_changuito); sonar('enem.changuito', g.pan(e.x)); g.globo(e, '¡PERMISO, PERMISO!', 0.9); ia.cd = 0.6 * furia; return; }
  if (alineado(g, e, dy, adx, 70, 230) && Math.random() < dt * 1.4) { e.cara = Math.sign(dx); g.atacar(e, ATQ.j_naranjas); ia.cd = 0.8 * furia; return; }
  if (adx < 54 && Math.abs(dy) < 8) { e.cara = Math.sign(dx); g.atacar(e, Math.random() < 0.6 ? ATQ.j_cucharon : ATQ.e_cruz); ia.cd = 0.45 * furia; return; }
  acomodar(g, e, dx, dy, 40);
}
function guarda(g, e, dt, dx, dy, adx) {
  const ia = e.ia, j = g.j;
  fases(g, e, 0.5, () => { g.encolar([['cuida', 0], ['mati', 2]]); ia.silbo = 0; });
  ia.silbo = (ia.silbo ?? 6) - dt;
  if (ia.cd > 0) return acomodar(g, e, dx, dy, 60);
  if (ia.silbo <= 0 && !g.ev.hayBondi()) { ia.silbo = ia.f50 ? 7 : 11; g.atacar(e, A.silbato); g.globo(e, ia.f50 ? '¡QUE VENGA EL 121!' : '¡PASE PARA EL FONDO!', 1.2); return; }
  if (alineado(g, e, dy, adx, 80, 240) && Math.random() < dt * 1.6) { e.cara = Math.sign(dx); g.atacar(e, ATQ.j_boletos); ia.cd = 0.7; return; }
  if (adx < 50 && Math.abs(dy) < 8) { e.cara = Math.sign(dx); if (Math.random() < 0.5) g.atacar(e, ATQ.j_maquinazo); else { g.atacar(e, ATQ.e_combo); ia.cadena = 1; } ia.cd = 0.4; return; }
  acomodar(g, e, dx, dy, 36); void j;
}
function bocha(g, e, dt, dx, dy, adx) {
  const ia = e.ia;
  fases(g, e, 0.4, () => { ia.furia = true; e.st = { ...e.st, vel: e.st.vel * 1.25 }; });
  ia.guardia = true; // con guardia alta para las piñas de frente (contragolpea)
  if (ia.contra) { ia.contra = false; e.cara = Math.sign(dx) || 1; g.atacar(e, ATQ.j_contra); ia.guardia = false; return; }
  if (ia.cd > 0) { // baila: se mueve de costado con guardia
    ia.ang += dt * 3; acomodar(g, e, dx, dy, 52); e.intent.my = Math.sin(ia.ang) * 0.8; return;
  }
  if (adx < 46 && Math.abs(dy) < 8) { e.cara = Math.sign(dx); ia.guardia = false; ia.combo = 0; g.atacar(e, ATQ.j_combo1); return; }
  if (adx > 90 && Math.abs(dy) < 10 && Math.random() < dt * 1.2) { e.cara = Math.sign(dx); ia.guardia = false; g.atacar(e, { ...ATQ.j_upper, dash: 200, ini: 0.3 }); return; }
  ir(e, g.j.x + (Math.sign(e.x - g.j.x) || 1) * 34, g.j.y, 12, 8);
}
// el combo del Bocha sigue solo: combo1 → combo2 → upper (lo llama juego.js al terminar cada golpe)
export function seguirCombo(g, e) {
  if (e.clave !== 'bocha' || !e.atq) return false; const ia = e.ia;
  if (e.atq === ATQ.j_combo1) { g.atacar(e, ATQ.j_combo2); return true; }
  if (e.atq === ATQ.j_combo2 && (ia.furia || Math.random() < 0.7)) { g.atacar(e, ATQ.j_upper); return true; }
  if (e.atq === ATQ.e_combo && e.clave === 'guarda') return false;
  return false;
}
function parrillero(g, e, dt, dx, dy, adx) {
  const ia = e.ia;
  fases(g, e, 0.5, () => { g.encolar([['mozo', 0], ['mozo', 2]]); g.ev.avivarParrillas(); });
  ia.brasas = (ia.brasas ?? 5) - dt;
  if (ia.cd > 0) return acomodar(g, e, dx, dy, 60);
  if (ia.brasas <= 0) { ia.brasas = ia.f50 ? 5 : 8; g.atacar(e, A.brasas); g.globo(e, '¡MÁS BRASAS!', 1); return; }
  if (alineado(g, e, dy, adx, 70, 220) && Math.random() < dt * 1.3) { e.cara = Math.sign(dx); g.atacar(e, ATQ.j_chorizos); ia.cd = 0.8; return; }
  if (adx < 58 && Math.abs(dy) < 8) { e.cara = Math.sign(dx); g.atacar(e, Math.random() < 0.6 ? ATQ.j_pinza : ATQ.e_pesada); ia.cd = 0.5; return; }
  acomodar(g, e, dx, dy, 44);
}
function capo(g, e, dt, dx, dy, adx) {
  const ia = e.ia;
  if (!ia.f60 && e.hp < e.hpMax * 0.6) { ia.f60 = true; g.globo(e, '¡MUCHACHOS!', 1.6); g.encolar([['patova', 0], ['chorro', 1], ['mati', 2]]); }
  if (!ia.f30 && e.hp < e.hpMax * 0.3) { ia.f30 = true; ia.furia = true; g.globo(e, FRASES.capo.furia, 1.8); g.sinArma(e); e.st = { ...e.st, vel: e.st.vel * 1.3 }; voz('capo', 'risa', g.pan(e.x)); }
  if (ia.cd > 0) return acomodar(g, e, dx, dy, 56);
  const r = Math.random();
  if (!ia.furia) {
    if (adx < 90 && Math.abs(dy) < 12 && r < dt * 1.5 && !ia.abrio) { ia.abrio = true; g.atacar(e, A.abre); return; } // paraguas abierto: escudo
    if (adx > 60 && adx < 140 && Math.abs(dy) < 8 && r < dt * 3) { e.cara = Math.sign(dx); g.atacar(e, ATQ.j_paraguas); ia.cd = 0.5; ia.abrio = false; return; }
    if (adx < 60 && Math.abs(dy) < 8) { e.cara = Math.sign(dx); g.atacar(e, r < 0.35 ? ATQ.j_giro : ATQ.e_golpe); ia.cd = 0.45; ia.abrio = false; return; }
  } else {
    if (adx < 50 && Math.abs(dy) < 8) { e.cara = Math.sign(dx); g.atacar(e, r < 0.25 ? ATQ.j_giro : r < 0.6 ? ATQ.e_combo : ATQ.j_upper); ia.cd = 0.25; return; }
    if (adx > 100 && Math.abs(dy) < 10 && r < dt * 2) { e.cara = Math.sign(dx); g.atacar(e, ATQ.e_embestida); return; }
  }
  acomodar(g, e, dx, dy, 38);
}
const TIPOS = { base, chorro, patova, guri, faca, cuida, dona, tambor, mozo, pescador, tano, chola, guarda, bocha, parrillero, capo };
export const ATQ_IA = A;
