// CPU del motor de pelea, 3 niveles: FÁCIL (reacciona tarde, bloquea poco, combos cortos), NORMAL, DIFÍCIL (bloquea alto/bajo
// según el golpe, castiga, cancela a especiales, usa el definitivo cuando conecta seguro, anti-aéreos y agarres al que se cubre).
import { articulaciones } from '../sprites.js';

// v12.1: espacio (no tirar golpes que no llegan, con el alcance real de cada golpe de cada luchador), castigo al que falla,
// bloqueo por reacción a los especiales (se ven venir), anti-aéreo y "footsies" (pararse justo afuera del alcance del rival).
// espacio = probabilidad de respetar el alcance; castiga = de castigar una recuperación; bloqEsp/reacEsp = bloqueo a especiales;
// antiAire = por salto del rival; footsies = probabilidad de pelear desde afuera del alcance del rival cuando él tiene más.
const PERFIL = {
  1: { reac: 0.34, bloq: 0.22, combo: 2, esp: 0.08, ult: 0.4, anti: 0.15, tech: 0.1, agr: 0.5, salta: 0.008, cancela: 0.2, espacio: 0.2, castiga: 0.1, bloqEsp: 0.3, reacEsp: 0.3, antiAire: 0.15, footsies: 0 },
  2: { reac: 0.2, bloq: 0.55, combo: 3, esp: 0.2, ult: 0.8, anti: 0.45, tech: 0.35, agr: 0.7, salta: 0.012, cancela: 0.6, espacio: 0.65, castiga: 0.45, bloqEsp: 0.7, reacEsp: 0.16, antiAire: 0.45, footsies: 0.3 },
  3: { reac: 0.1, bloq: 0.86, combo: 4, esp: 0.32, ult: 1, anti: 0.8, tech: 0.65, agr: 0.85, salta: 0.014, cancela: 0.95, espacio: 1, castiga: 0.92, bloqEsp: 0.95, reacEsp: 0.07, antiAire: 0.85, footsies: 0.85 },
};
const NORMALES = ['l', 'h', 'lc', 'hc'];
const OFENSIVOS = new Set(['golpe', 'agarre', 'raf', 'rafaga', 'sube']);
// alcance real de un golpe: la hitbox en su cuadro activo (más lo que avanza si embiste), medido desde el centro del luchador.
// Se calcula una vez por luchador y golpe (cada pelea crea luchadores nuevos).
export function rangoDe(pe, f, k) {
  const C = f._rangos || (f._rangos = {}); if (C[k] != null) return C[k];
  const M = f.movs[k]; let r = 0;
  if (!M) r = 0;
  else if (M.tipo === 'proy' || M.tipo === 'suelo' || M.tipo === 'tele') r = 400;
  else if (M.tipo === 'salto') r = (M.vx || 170) * 0.7 + 30;
  else if (M.tipo === 'agarre' || M.tipo === 'agarreN' || k === 'agarre') r = f.anchoC + (M.rg || 38);
  else if (M.tipo === 'contra' || M.tipo === 'buff' || M.tipo === 'trampa') r = 0;
  else { const s = [f.est, f.atq, f.t, f.anim, f.fr]; try { f.est = 'ataque'; f.atq = M; f.t = (M.ini || 0) + (M.act || 0.06) * 0.5; pe.animar(f); const hb = pe.hitbox(f); r = (hb.x - f.x) * f.cara + hb.r; } catch (e) { r = 40 * f.esc; }
    [f.est, f.atq, f.t, f.anim, f.fr] = s; if (M.dash) r += M.dash * (M.act || 0.06) * 0.85; }
  return (C[k] = r);
}
const rnd = Math.random;
export class IA {
  constructor(f, dif) { this.f = f; this.dif = Math.max(1, Math.min(3, dif | 0)); this.P = PERFIL[this.dif]; this.plan = null; this.espera = 0; this.vistoAtq = null; this.defensa = null; this.corre = false; this.dashAtras = false; this.alc = {}; this.cubreN = 0; this.tPaso = 0; this.techDecidido = null; this.opAtqVisto = null; this.opTPrev = 0; this.castigo = false; this.saltoVisto = false; this.antiOk = false; this.tEsp = 0; this.respeta = true; this.tHover = 0; }
  // ¿llega este golpe mío ahora? (o el del rival a mí)
  llega(pe, k, margen = 0) { const f = this.f, op = f.op; const M = f.movs[k]; if (!M) return false; const adx = Math.abs(op.x - f.x); const ag = M.tipo === 'agarre' || k === 'agarre'; return rangoDe(pe, f, k) + (ag ? op.anchoC : op.anchoC * 0.9) + margen >= adx; }
  meLlega(pe, k, margen = 10) { const f = this.f, op = f.op; if (!k || !op.movs[k]) return true; return rangoDe(pe, op, k) + f.anchoC * 0.9 + margen >= Math.abs(op.x - f.x); }
  // mejor golpe que llega y arranca a tiempo (para castigar o abrir)
  mejor(pe, tMax = 9, conEsp = true) { const f = this.f; let best = null, bv = -1; const ks = conEsp ? [...NORMALES, 's1', 's2'] : NORMALES;
    for (const k of ks) { const M = f.movs[k]; if (!M || (k[0] === 's' && !OFENSIVOS.has(M.tipo)) || M.aereo) continue; if ((M.ini || 0) > tMax || !this.llega(pe, k)) continue; const v = (M.dmg || 1) * (M.tumba || M.lanza ? 1.25 : 1) / (0.1 + (M.ini || 0)); if (v > bv) { bv = v; best = k; } } return best; }
  maxRango(pe, g) { let m = 0; for (const k of NORMALES) m = Math.max(m, rangoDe(pe, g, k)); return m; }
  alcance(k) { if (this.alc[k] != null) return this.alc[k]; const f = this.f, M = f.movs[k]; let a = 40 * f.esc;
    try { const P = f.sp.poses[M.anim]; if (P && M.limb) { const J = articulaciones(f.sp.def, P[Math.min(1, P.length - 1)], f.sp.w, f.sp.h); const p = J[M.limb] || J.mF; a = p[0] + (M.r || 9) * f.esc + (M.ext || 0) * f.esc; if (M.dash) a += M.dash * M.act * 0.8; } } catch (e) { /* sin pose */ }
    if (M.tipo === 'proy' || M.tipo === 'suelo') a = 400; if (M.tipo === 'salto') a = (M.vx || 170) * 0.7 + 30; if (M.tipo === 'agarre') a = (M.rg || 38) + 6; if (M.tipo === 'tele') a = 400;
    return (this.alc[k] = a); }
  escapaAgarre() { if (this.techDecidido === null) this.techDecidido = rnd() < this.P.tech; const r = this.techDecidido; if (this.f.t > 0.2) this.techDecidido = null; return r; }
  decidir(pe, I) {
    const f = this.f, op = f.op, P = this.P, dt = 1 / 120; this.tPaso += dt; this._pe = pe; I.dx = 0; I.dy = 0; this.corre = false;
    if (f.est === 'agarrado') return;
    const hacia = Math.sign(op.x - f.x) || f.cara; const dist = Math.abs(op.x - f.x) - f.anchoC - op.anchoC;
    // ---- defensa: el rival tira un golpe cerca (o un proyectil viene)
    const opAtq = op.est === 'ataque' && op.atq ? op.atq : null; const proy = pe.proy.find((p) => p.de === op && Math.sign(f.x - p.x) === Math.sign(p.vx) && Math.abs(p.x - f.x) < 150);
    // un golpe nuevo del rival (los objetos de golpe se reusan: se detecta por cambio de golpe o porque su reloj volvió a cero)
    const nuevoAtq = opAtq && (opAtq !== this.opAtqVisto || op.t < this.opTPrev); this.opTPrev = opAtq ? op.t : 0; if (!opAtq) this.opAtqVisto = null;
    if (nuevoAtq) { this.opAtqVisto = opAtq; this.castigo = rnd() < P.castiga; this.lee = rnd() < P.espacio; this.vistoAtq = null; }
    const esEsp = opAtq && (opAtq.especial || opAtq.k === 's1' || opAtq.k === 's2' || opAtq.k === 'firma');
    // ¿me llega? (si sé leer el alcance, no me cubro de lo que no llega: me quedo listo para castigar)
    const llegaOp = opAtq && (opAtq.tipo === 'proy' || opAtq.tipo === 'suelo' || !this.lee || this.meLlega(pe, opAtq.k, 12));
    const enRec = opAtq && this.lee && op.fase() === 'rec' && opAtq.tipo !== 'proy'; // en su recuperación ya no hay amenaza: es hora de castigar
    const amenaza = opAtq && !enRec && dist < (esEsp ? 160 : 90) && llegaOp ? opAtq : proy ? { bajo: proy.suelo, alto: false, proy: true } : null;
    if (amenaza) { const id = amenaza.proy ? proy : opAtq;
      if (this.vistoAtq !== id) { this.vistoAtq = id; const rq = esEsp && !amenaza.proy ? Math.min(P.reac, P.reacEsp) : P.reac; this.defensa = { t: rq * (0.6 + rnd() * 0.8), ok: rnd() < (esEsp ? Math.max(P.bloq, P.bloqEsp) : P.bloq), salta: amenaza.proy && !amenaza.bajo ? rnd() < P.anti * 0.3 : amenaza.bajo && rnd() < 0.2 * this.dif, ag: amenaza.bajo ? true : amenaza.alto ? false : rnd() < 0.4 }; }
      const d = this.defensa; d.t -= dt;
      if (d.t <= 0 && d.ok && (f.est !== 'ataque' || f.fase() === 'rec')) { if (d.salta && f.enSuelo && f.est !== 'ataque') { I.dy = -1; I.dx = hacia * (amenaza.proy ? 1 : 0); return; } I.dx = -hacia; I.dy = d.ag ? 1 : 0; this.cubreN = 0; if (f.est === 'bloq' || f.est === 'bloqAg') { if (this.dif >= 2 && f.super >= 50 && rnd() < 0.01 * this.dif) { I.s = 1; I.dx = hacia; } } return; }
    } else this.vistoAtq = null;
    if (op.est === 'bloq' || op.est === 'bloqAg' || op.est === 'bloqP' || op.est === 'bloqAgP') this.cubreN += dt;
    if (f.est === 'dolor' || f.est === 'bloq' || f.est === 'bloqAg' || f.est === 'vuela' || f.est === 'piso' || f.est === 'levanta') { this.plan = null; return; }
    // ---- en combo: seguir la cadena cuando conecta
    if (f.est === 'ataque') { if (this.plan && this.plan.seq && f.conecto && this.plan.i < this.plan.seq.length) { const fs = f.fase(); if ((fs === 'act' || fs === 'rec') && rnd() < 0.5) { this.apretar(I, this.plan.seq[this.plan.i], hacia); this.plan.i++; } } return; }
    if (this.espera > 0) { this.espera -= dt; if (this.espera > 0) { if (this.plan && this.plan.atras) I.dx = -hacia; return; } }
    // ---- definitivo
    if (f.super >= 100 && f.enSuelo && rnd() < P.ult * 0.05) { const L = f.L.ult; const alc = L.alcance >= 900 ? 9999 : L.alcance * f.esc; if (dist < alc && !op.ko && op.est !== 'piso' && op.est !== 'levanta' && !(op.est === 'bloq' && L.alcance < 900)) { I.u = 1; return; } }
    // ---- anti-aéreo: se decide una vez por salto del rival; se tira cuando baja dentro del alcance
    const enAire = !op.enSuelo && (op.est === 'salto' || (op.est === 'ataque' && op.aereo));
    if (enAire && !this.saltoVisto) { this.saltoVisto = true; this.antiOk = rnd() < P.antiAire; } else if (!enAire) this.saltoVisto = false;
    if (enAire && this.antiOk && f.enSuelo && Math.sign(op.x - f.x) === hacia && (op.vz || 0) < 120) { const up = this.upper(); const kU = up[0] === 's' ? (up[1] ? 's2' : 's1') : 'h';
      if (rangoDe(pe, f, kU) + op.anchoC + 14 >= Math.abs(op.x - f.x)) { this.antiOk = false; I[up[0]] = 1; if (up[1]) I.dy = up[1]; return; } }
    if (!op.enSuelo && op.est === 'salto' && dist < 70 && Math.sign(op.vx || hacia * -1) === -hacia && rnd() < P.anti * 0.15 * (1 - P.espacio)) { const up = this.upper(); I[up[0]] = 1; if (up[1]) I.dy = up[1]; return; }
    // ---- en el aire: golpe al bajar
    if (f.est === 'salto') { if (f.vz < 60 && dist < 46 && !f.aereo) I[rnd() < 0.5 ? 'h' : 'l'] = 1; return; }
    // ---- castigo: el rival quedó en recuperación (falló, o se lo bloqueé): el mejor golpe que llegue y arranque a tiempo
    if (opAtq && op.enSuelo && op.fase() === 'rec' && this.castigo) { const resta = (opAtq.ini || 0) + (opAtq.act || 0) + (opAtq.rec || 0) - op.t; const k = this.mejor(pe, resta + 0.02);
      if (k) { this.castigo = false; const seq = k === 'l' ? ['l', 'l', 'h'].slice(0, P.combo) : k === 'lc' ? ['lc', 'hc'] : k === 'h' && f.L.firma ? f.L.firma.seq.slice() : [k]; const ge = ['s1', 's2'].filter((q) => f.movs[q].tipo === 'golpe'); if (ge.length && k[0] !== 's' && rnd() < P.cancela) seq.push(ge[(rnd() * ge.length) | 0]); if (seq[0] !== k) seq.unshift(k); this.plan = { seq, i: 1 }; this.apretar(I, k, hacia); return; }
      if (resta > 0.1 && Math.abs(op.x - f.x) - this.maxRango(pe, f) - op.anchoC < this.f.N.corre * resta * 1.2) { I.dx = hacia; this.corre = true; return; } }
    if (!this.castigo && opAtq && op.fase() === 'rec' && !op.conecto && dist < this.alcance('h') && rnd() < 0.3 * this.dif * (1 - P.espacio)) { this.empezarCombo(I, hacia, true); return; }
    // ---- agarre al que se cubre mucho
    if (dist < 16 && this.cubreN > 0.5 && rnd() < 0.08 * this.dif) { I.g = 1; this.cubreN = 0; return; }
    // ---- a distancia: proyectil / acercarse / saltar
    const proyK = ['s1', 's2'].find((k) => f.movs[k].tipo === 'proy' || f.movs[k].tipo === 'suelo');
    if (dist > 110 && proyK && rnd() < P.esp * 0.06 && !pe.proy.some((p) => p.de === f)) { I.s = 1; I.dx = proyK === 's2' ? -hacia : hacia; if (proyK === 's2') { I.dx = 0; I.dy = 1; } return; }
    // ---- espacio (se re-decide cada medio segundo si se respeta el alcance: el nivel 1 es desprolijo)
    this.tEsp -= dt; if (this.tEsp <= 0) { this.tEsp = 0.5; this.respeta = rnd() < P.espacio; this.footsies = rnd() < P.footsies; }
    if (this.respeta) {
      const adx = Math.abs(op.x - f.x), miAlc = this.maxRango(pe, f) + op.anchoC * 0.9, suAlc = this.maxRango(pe, op) + f.anchoC * 0.9;
      const k = this.mejor(pe, 9, false);
      if (!k) { // nada llega: acercarse (sin tirar golpes al aire)
        // footsies: si el rival tiene más alcance, pararse justo afuera del suyo y entrar cuando falla (con un límite de tiempo)
        const L = Math.max(18, pe.cam - (pe.vw || 480) / 2 + 18) + 24, Rr = Math.min(1e4, pe.cam + (pe.vw || 480) / 2 - 18) - 24; const atras = f.x - hacia * 20;
        if (this.footsies && suAlc > miAlc + 4 && adx < suAlc + 8 && op.est !== 'ataque' && this.tHover < 1.1 && atras > L && atras < Rr) { this.tHover += dt; I.dx = -hacia; return; }
        if (this.tHover >= 1.1) { this.tHover = 0; if (adx < 150 && rnd() < 0.5) { I.dy = -1; I.dx = hacia; } else { I.dx = hacia; this.corre = true; } return; } // se terminó la paciencia: entra saltando o corriendo
        if (this.footsies && suAlc > miAlc + 4 && adx < suAlc + 24 && op.est !== 'ataque') { this.tHover += dt; if (rnd() < 0.5) return; }
        for (const kk of ['s1', 's2']) { const M = f.movs[kk]; if ((M.tipo === 'golpe' && M.dash > 200 || M.tipo === 'salto' || M.tipo === 'tele') && this.llega(pe, kk) && rnd() < P.esp * 0.02) { I.s = 1; if (kk === 's2') I.dy = 1; else I.dx = hacia; return; } }
        if (adx > miAlc + 50 && rnd() < P.salta && adx < 170) { I.dy = -1; I.dx = hacia; return; }
        I.dx = hacia; this.corre = adx > miAlc + 60 && this.dif >= 2; return; }
      this.tHover = 0;
      if (rnd() < P.agr * 0.12) { this.empezarCombo(I, hacia, true, k); return; }
      if (rnd() < 0.006 * this.dif) { this.dashAtras = this.dif >= 2; return; }
      if (rnd() < 0.25) I.dx = hacia * (rnd() < 0.6 ? 1 : -1); return;
    }
    const alcL = this.alcance('l'), alcH = this.alcance('h');
    if (dist > alcH + 6) { if (rnd() < P.salta && dist < 150 && dist > 50) { I.dy = -1; I.dx = hacia; return; }
      if (rnd() < 0.002 * this.dif) { this.espera = 0.3 + rnd() * 0.4; this.plan = { atras: rnd() < 0.4 }; return; }
      // especiales de desplazamiento desde lejos
      for (const k of ['s1', 's2']) { const M = f.movs[k]; if ((M.tipo === 'golpe' && M.dash > 200 || M.tipo === 'salto' || M.tipo === 'tele') && dist < this.alcance(k) && rnd() < P.esp * 0.02) { I.s = 1; if (k === 's2') I.dx = -hacia; else I.dx = hacia; return; } }
      I.dx = hacia; this.corre = dist > 120 && this.dif >= 2 && rnd() < 0.7; return; }
    // ---- en rango: atacar (agresividad) o esperar un toque
    if (rnd() < P.agr * 0.12) { this.empezarCombo(I, hacia, dist < alcL); return; }
    if (rnd() < 0.01) { this.dashAtras = this.dif >= 2 && rnd() < 0.3; }
    if (rnd() < 0.3) I.dx = hacia * (rnd() < 0.7 ? 1 : -1);
  }
  upper() { const f = this.f; for (const k of ['s2', 's1']) { const M = f.movs[k]; if (M.tipo === 'golpe' && (M.lanza || M.sube)) return ['s', k === 's2' ? 1 : 0]; } return ['h', 0]; }
  apretar(I, b, hacia) { if (b === 's1') { I.s = 1; I.dx = hacia; } else if (b === 's2') { I.s = 1; I.dy = 1; } else if (b === 'lc') { I.l = 1; I.dy = 1; } else if (b === 'hc') { I.h = 1; I.dy = 1; } else if (b === 'f') { I.h = 1; } else I[b] = 1; }
  empezarCombo(I, hacia, cerca, primero = null) {
    const f = this.f, P = this.P; let seq;
    const firma = f.L.firma && f.L.firma.seq;
    const golpeEsp = ['s1', 's2'].filter((k) => f.movs[k].tipo === 'golpe' || f.movs[k].tipo === 'agarre');
    const r = rnd();
    if (firma && r < 0.3 + 0.1 * this.dif) seq = firma.slice();
    else if (r < 0.55) seq = ['l', 'l', 'h'].slice(0, P.combo);
    else if (r < 0.7) seq = ['lc', 'hc'];
    else if (r < 0.85) seq = ['h'];
    else seq = ['l', 'h'];
    if (golpeEsp.length && rnd() < P.cancela) seq.push(golpeEsp[Math.floor(rnd() * golpeEsp.length)]);
    if (!cerca && seq[0] === 'l') seq[0] = 'h';
    if (primero && seq[0] !== primero && !(seq[0] === 'l' && primero === 'l')) { const ok = f.movs[seq[0]] && f.ia === this && this._pe && this.llega(this._pe, seq[0]); if (!ok) seq = [primero, ...seq.slice(1)]; }
    this.plan = { seq, i: 1 }; this.apretar(I, seq[0], hacia); this.espera = 0.05 + (3 - this.dif) * 0.08;
  }
}
