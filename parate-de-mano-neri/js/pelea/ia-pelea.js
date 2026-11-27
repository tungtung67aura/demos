// CPU del motor de pelea, 3 niveles: FÁCIL (reacciona tarde, bloquea poco, combos cortos), NORMAL, DIFÍCIL (bloquea alto/bajo
// según el golpe, castiga, cancela a especiales, usa el definitivo cuando conecta seguro, anti-aéreos y agarres al que se cubre).
import { articulaciones } from '../sprites.js';

const PERFIL = {
  1: { reac: 0.34, bloq: 0.22, combo: 2, esp: 0.08, ult: 0.4, anti: 0.15, tech: 0.1, agr: 0.5, salta: 0.008, cancela: 0.2 },
  2: { reac: 0.2, bloq: 0.55, combo: 3, esp: 0.2, ult: 0.8, anti: 0.45, tech: 0.35, agr: 0.7, salta: 0.012, cancela: 0.6 },
  3: { reac: 0.1, bloq: 0.86, combo: 4, esp: 0.32, ult: 1, anti: 0.8, tech: 0.65, agr: 0.85, salta: 0.014, cancela: 0.95 },
};
const rnd = Math.random;
export class IA {
  constructor(f, dif) { this.f = f; this.dif = Math.max(1, Math.min(3, dif | 0)); this.P = PERFIL[this.dif]; this.plan = null; this.espera = 0; this.vistoAtq = null; this.defensa = null; this.corre = false; this.dashAtras = false; this.alc = {}; this.cubreN = 0; this.tPaso = 0; this.techDecidido = null; }
  alcance(k) { if (this.alc[k] != null) return this.alc[k]; const f = this.f, M = f.movs[k]; let a = 40 * f.esc;
    try { const P = f.sp.poses[M.anim]; if (P && M.limb) { const J = articulaciones(f.sp.def, P[Math.min(1, P.length - 1)], f.sp.w, f.sp.h); const p = J[M.limb] || J.mF; a = p[0] + (M.r || 9) * f.esc + (M.ext || 0) * f.esc; if (M.dash) a += M.dash * M.act * 0.8; } } catch (e) { /* sin pose */ }
    if (M.tipo === 'proy' || M.tipo === 'suelo') a = 400; if (M.tipo === 'salto') a = (M.vx || 170) * 0.7 + 30; if (M.tipo === 'agarre') a = (M.rg || 38) + 6; if (M.tipo === 'tele') a = 400;
    return (this.alc[k] = a); }
  escapaAgarre() { if (this.techDecidido === null) this.techDecidido = rnd() < this.P.tech; const r = this.techDecidido; if (this.f.t > 0.2) this.techDecidido = null; return r; }
  decidir(pe, I) {
    const f = this.f, op = f.op, P = this.P, dt = 1 / 120; this.tPaso += dt; I.dx = 0; I.dy = 0; this.corre = false;
    if (f.est === 'agarrado') return;
    const hacia = Math.sign(op.x - f.x) || f.cara; const dist = Math.abs(op.x - f.x) - f.anchoC - op.anchoC;
    // ---- defensa: el rival tira un golpe cerca (o un proyectil viene)
    const opAtq = op.est === 'ataque' && op.atq ? op.atq : null; const proy = pe.proy.find((p) => p.de === op && Math.sign(f.x - p.x) === Math.sign(p.vx) && Math.abs(p.x - f.x) < 150);
    const amenaza = opAtq && dist < 90 ? opAtq : proy ? { bajo: proy.suelo, alto: false, proy: true } : null;
    if (amenaza) { const id = amenaza.proy ? proy : opAtq;
      if (this.vistoAtq !== id) { this.vistoAtq = id; this.defensa = { t: P.reac * (0.6 + rnd() * 0.8), ok: rnd() < P.bloq, salta: amenaza.proy && !amenaza.bajo ? rnd() < P.anti * 0.3 : amenaza.bajo && rnd() < 0.2 * this.dif, ag: amenaza.bajo ? true : amenaza.alto ? false : rnd() < 0.4 }; }
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
    // ---- anti-aéreo
    if (!op.enSuelo && op.est === 'salto' && dist < 70 && Math.sign(op.vx || hacia * -1) === -hacia && rnd() < P.anti * 0.15) { const up = this.upper(); I[up[0]] = 1; if (up[1]) I.dy = up[1]; return; }
    // ---- en el aire: golpe al bajar
    if (f.est === 'salto') { if (f.vz < 60 && dist < 46 && !f.aereo) I[rnd() < 0.5 ? 'h' : 'l'] = 1; return; }
    // ---- castigo: el rival quedó en recuperación de un golpe al aire
    if (opAtq && op.fase() === 'rec' && !op.conecto && dist < this.alcance('h') && rnd() < 0.3 * this.dif) { this.empezarCombo(I, hacia, true); return; }
    // ---- agarre al que se cubre mucho
    if (dist < 16 && this.cubreN > 0.5 && rnd() < 0.08 * this.dif) { I.g = 1; this.cubreN = 0; return; }
    // ---- a distancia: proyectil / acercarse / saltar
    const proyK = ['s1', 's2'].find((k) => f.movs[k].tipo === 'proy' || f.movs[k].tipo === 'suelo');
    if (dist > 110 && proyK && rnd() < P.esp * 0.06 && !pe.proy.some((p) => p.de === f)) { I.s = 1; I.dx = proyK === 's2' ? -hacia : hacia; if (proyK === 's2') { I.dx = 0; I.dy = 1; } return; }
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
  empezarCombo(I, hacia, cerca) {
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
    this.plan = { seq, i: 1 }; this.apretar(I, seq[0], hacia); this.espera = 0.05 + (3 - this.dif) * 0.08;
  }
}
