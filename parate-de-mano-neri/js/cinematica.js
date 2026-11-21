// Cinemáticas arcade dentro del motor: los luchadores de verdad caminan y hablan sobre el escenario del nivel.
// Guion por datos (js/guion.js): lista de comandos {c: ...}. Caja de diálogo con retrato (con expresión),
// texto a máquina de escribir, tocar/tecla para avanzar, SALTAR para terminar de golpe (aplica el estado final).
import { generar, retrato } from './sprites.js';
import { JUGADORES, ATQ } from './datos.js';
import { texto, textoCanvas, CONTORNO } from './pixel.js';
import { sonar, musica } from './audio.js';
import { PISO } from './escenario.js';

const VEL_TXT = 46; // letras por segundo
const cacheRet = new Map();
// retrato con expresión (se dibuja una vez por personaje + cara, a la densidad actual)
export function retratoCara(sp, cara) {
  const k = sp.q + '|' + sp.args.join('|') + '|' + (cara || ''); let r = cacheRet.get(k);
  if (!r) { r = retrato(sp.def, 48, cara || null); cacheRet.set(k, r); if (cacheRet.size > 80) cacheRet.delete(cacheRet.keys().next().value); }
  return r;
}
// parte el texto en renglones de como mucho n letras (por palabras)
function renglones(txt, n) {
  const out = []; let l = '';
  for (const p of txt.split(' ')) { if (l && (l + ' ' + p).length > n) { out.push(l); l = p; } else l = l ? l + ' ' + p : p; }
  if (l) out.push(l); return out;
}

export class Cinematica {
  constructor(g, guion, alTerminar = null) {
    this.g = g; this.cmds = guion; this.i = 0; this.alTerminar = alTerminar; this.act = new Map(); this.fin = false;
    this.t = 0; this.tCmd = 0; this.caja = null; this.cartel = null; this.barras = 0; this.esperas = [];
    this.prepararRetratos();
  }
  // sets y retratos que usa el guion: se dibujan ya (antes de que corra) para no trabar en medio
  prepararRetratos() {
    for (const c of this.cmds) {
      if (c.c === 'aparece') c._sp = generar(c.clave, c.v || 0);
      if (c.c === 'dice') { const sp = this.spDe(c); if (sp) retratoCara(sp, c.cara); }
    }
  }
  spDe(c) {
    if (c.id === 'j') return this.g.j.sp;
    if (c.clave) return generar(c.clave, c.v || 0);
    const ap = this.cmds.find((k) => k.c === 'aparece' && k.id === c.id); if (ap) return ap._sp || (ap._sp = generar(ap.clave, ap.v || 0));
    if (c.id === 'jefe' && this.g.jefe) return this.g.jefe.sp;
    return null;
  }
  ent(id) { if (id === 'j') return this.g.j; if (id === 'jefe') return this.g.jefe; return this.act.get(id) || null; }
  nombreDe(c) {
    if (c.nombre) return c.nombre;
    if (c.id === 'j') return JUGADORES[this.g.j.clave].nombre;
    const e = this.ent(c.id); if (e && e.nombre) return e.nombre;
    const ap = this.cmds.find((k) => k.c === 'aparece' && k.id === c.id); return ap && ap.nombre ? ap.nombre : '';
  }
  xDe(fx) { return this.g.cam + fx * this.g.vista.w; }
  // ---- comandos ----
  ejecutar(c, rapido) {
    const g = this.g;
    switch (c.c) {
      case 'capitulo': if (rapido) return true; this.cartel = { n: c.n, txt: c.txt, sub: c.sub || '', t: 0, dur: c.dur || 2.6 }; sonar('cine.capitulo'); return false;
      case 'aparece': {
        const sp = c._sp || generar(c.clave, c.v || 0); const e = g.nuevoLuchador(sp, this.xDe(c.fx), c.y || 230);
        Object.assign(e, { equipo: 'n', clave: c.clave, st: { vel: c.vel || 70 }, hp: 1, hpMax: 1, nombre: c.nombre || '', cara: c.cara || -1, actor: true });
        g.ents.push(e); this.act.set(c.id, e); return true;
      }
      case 'pon': { const e = this.ent(c.id); if (e) { if (c.fx !== undefined) e.x = e.px = this.xDe(c.fx); if (c.y) e.y = e.py = c.y; if (c.cara) e.cara = c.cara; e.vx = e.vy = 0; } return true; }
      case 'cara': { const e = this.ent(c.id); if (e) e.cara = typeof c.d === 'number' ? c.d : Math.sign(((this.ent(c.d) || e).x - e.x)) || e.cara; return true; }
      case 'camina': case 'sale': {
        const e = this.ent(c.id); if (!e) return true; const tx = this.xDe(c.fx), ty = c.y || e.y;
        if (rapido) { e.x = e.px = tx; e.y = e.py = Math.max(PISO.arriba, Math.min(PISO.abajo, ty)); e.intent.mx = e.intent.my = 0; if (c.c === 'sale') this.sacar(c.id, e); return true; }
        if (c.vel) e.st = Object.assign({}, e.st, { vel: c.vel });
        const w = { e, tx, ty, sale: c.c === 'sale', id: c.id }; this.esperas.push(w); e.est = 'quieto'; e.atq = null;
        return !c.espera ? true : (this.bloq = w, false);
      }
      case 'dice': {
        if (rapido) return true;
        const sp = this.spDe(c); const e = this.ent(c.id);
        const lado = c.lado || (e ? (e.x - g.cam < g.vista.w * 0.5 ? 'izq' : 'der') : (c.id === 'j' ? 'izq' : 'der'));
        this.caja = { txt: c.txt, n: 0, ret: sp ? retratoCara(sp, c.cara) : null, nombre: this.nombreDe(c), lado, renglones: null, total: c.txt.length, tBlip: 0, quien: e };
        if (e && c.anim) { e.est = c.anim; e.t = 0; }
        return false;
      }
      case 'espera': if (rapido) return true; this.tEsp = c.t; return false;
      case 'anim': { const e = this.ent(c.id); if (e) { e.est = c.a; e.t = 0; e.anim = c.a; e.vx = 0; } return true; }
      case 'arma': { const e = this.ent(c.id); if (e) { if (e.arma) { e.arma.borrar = true; e.arma = null; } if (c.t) { const it = g.soltarItem(c.t, e.x, e.y, 0, 0); g.darArma(e, it); it.cine = true; } } return true; }
      case 'pasa': { const a = this.ent(c.de), b = this.ent(c.a); if (a && b && a.arma) { const it = a.arma; a.arma = null; if (b.arma) { b.arma.borrar = true; } g.darArma(b, it); if (!rapido) sonar('item.arma'); } return true; }
      // gesto/golpe al aire (sin daño: durante la cinemática no se chequean golpes); bloquea lo que dura salvo espera:false
      case 'golpe': {
        const e = this.ent(c.id), a = ATQ[c.a]; if (!e || !a || rapido) return true;
        e.est = 'ataca'; e.atq = a; e.t = 0; e.lanzo = true; e.anim = a.anim; e.conecto = null; e.vx = 0; e.vy = 0; if (c.cara) e.cara = c.cara;
        sonar(c.son || 'mov.aire', g.pan(e.x)); if (c.temblor) g.temblor = Math.max(g.temblor, c.temblor);
        if (c.polvo) g.fx.polvo(e.x + e.cara * 14, e.y, 6);
        if (c.espera === false) return true; this.tEsp = c.espera || (a.ini + a.act + a.rec + 0.08); return false;
      }
      // presentación del jefe: franja con retrato grande, nombre y apodo, entra de costado
      case 'presenta': {
        if (rapido) return true; const e = this.ent(c.id); const sp = e ? e.sp : this.spDe(c);
        this.pres = { ret: sp ? retratoCara(sp, c.cara || 'enojo') : null, txt: c.txt, sub: c.sub || '', t: 0, dur: c.dur || 2.2 };
        sonar('cine.capitulo'); g.temblor = Math.max(g.temblor, 0.25); return false;
      }
      case 'sonido': if (!rapido) sonar(c.id); return true;
      case 'musica': musica(c.id); return true;
      case 'temblor': if (!rapido) g.temblor = Math.max(g.temblor, c.t || 0.3); return true;
      case 'globo': { const e = this.ent(c.id); if (e && !rapido) g.globo(e, c.txt, c.t || 1.4); return true; }
      default: return true;
    }
  }
  sacar(id, e) { e.borrar = true; if (e.arma) { e.arma.borrar = true; e.arma = null; } this.act.delete(id); }
  // ---- avanzar / saltar ----
  avanzar() {
    if (this.pres) { if (this.pres.t > 0.6) this.pres = null; return; }
    if (this.cartel) { if (this.cartel.t > 0.5) this.cartel = null; return; }
    const c = this.caja; if (!c) return;
    if (c.n < c.total) { c.n = c.total; return; }
    this.caja = null; sonar('cine.avanza');
  }
  saltar() {
    this.caja = null; this.cartel = null; this.pres = null; this.tEsp = 0; this.bloq = null;
    for (const w of this.esperas) { w.e.x = w.e.px = w.tx; w.e.y = w.e.py = w.ty; w.e.intent.mx = w.e.intent.my = 0; if (w.sale) this.sacar(w.id, w.e); }
    this.esperas.length = 0;
    while (this.i < this.cmds.length) this.ejecutar(this.cmds[this.i++], true);
    this.terminar(); sonar('cine.saltar');
  }
  terminar() {
    if (this.fin) return; this.fin = true;
    for (const [id, e] of this.act) if (!e.queda) this.sacar(id, e);
    for (const e of this.g.ents) { e.intent.mx = 0; e.intent.my = 0; }
    if (this.alTerminar) this.alTerminar();
  }
  tocar(t, W, H) { if (t[0] > W - 100 && t[1] > H - 34) this.saltar(); else this.avanzar(); }
  // ---- lógica ----
  paso(dt, E) {
    if (this.fin) return false;
    this.t += dt; this.barras = Math.min(1, this.barras + dt * 4);
    if (E) {
      if (E.buf.pausa > 0 || E.buf.atras > 0) { E.buf.pausa = 0; E.buf.atras = 0; this.saltar(); return false; }
      if (E.buf.pina > 0 || E.buf.ok > 0 || E.buf.patada > 0 || E.buf.salto > 0) { E.buf.pina = E.buf.ok = E.buf.patada = E.buf.salto = 0; E.buf.especial = 0; this.avanzar(); }
    }
    // los que caminan
    for (let k = 0; k < this.esperas.length; k++) {
      const w = this.esperas[k], e = w.e; const dx = w.tx - e.x, dy = w.ty - e.y;
      w.t = (w.t || 0) + dt; const fuera = w.sale && (e.x < this.g.cam - 34 || e.x > this.g.cam + this.g.vista.w + 34);
      if (w.t > 5) { e.x = w.tx; e.y = Math.max(PISO.arriba, Math.min(PISO.abajo, w.ty)); } // red de seguridad: trabado contra un borde
      if ((Math.abs(dx) < 3 && Math.abs(dy) < 3) || fuera || w.t > 5) { e.intent.mx = e.intent.my = 0; if (w.sale) this.sacar(w.id, e); this.esperas.splice(k--, 1); if (this.bloq === w) this.bloq = null; continue; }
      const m = Math.hypot(dx, dy * 1.6) || 1; e.intent.mx = dx / m; e.intent.my = dy * 1.6 / m; if (Math.abs(dx) > 2) e.cara = Math.sign(dx);
    }
    const c = this.caja;
    if (c) { const n0 = Math.floor(c.n); c.n = Math.min(c.total, c.n + dt * VEL_TXT); if (Math.floor(c.n) > n0 && (Math.floor(c.n) & 1) && c.txt[Math.floor(c.n) - 1] !== ' ') sonar('cine.letra'); }
    if (this.cartel) { this.cartel.t += dt; if (this.cartel.t > this.cartel.dur) this.cartel = null; }
    if (this.pres) { this.pres.t += dt; if (this.pres.t > this.pres.dur) this.pres = null; }
    if (this.tEsp > 0) this.tEsp -= dt;
    // siguiente comando cuando no hay nada bloqueando
    let guard = 0;
    while (!this.caja && !this.cartel && !this.pres && !(this.tEsp > 0) && !this.bloq && guard++ < 64) {
      if (this.i >= this.cmds.length) { if (!this.esperas.length) { this.terminar(); return false; } break; }
      this.ejecutar(this.cmds[this.i++], false);
    }
    return true;
  }
  // ---- dibujo (encima del mundo, en lugar del HUD) ----
  dibujar(x, W, H, tactil) {
    const bh = Math.round(18 * this.barras);
    x.fillStyle = '#07040c'; x.fillRect(0, 0, W, bh); x.fillRect(0, H - bh, W, bh);
    if (this.cartel) { // cartel de capítulo a pantalla completa
      const k = this.cartel, a = Math.min(1, k.t / 0.25, (k.dur - k.t) / 0.3 + 0.2);
      x.fillStyle = `rgba(7,4,12,${Math.min(1, a * 1.1).toFixed(3)})`; x.fillRect(0, 0, W, H);
      if (a > 0.5) { const cy = Math.round(H / 2); const kb = Math.min(1, k.t / 0.45), bw = Math.round(240 * kb); // las rayas se abren, el título entra letra por letra y tiembla al cerrar
        x.fillStyle = '#c8202a'; x.fillRect(Math.round(W / 2 - bw / 2), cy - 30, bw, 2); x.fillRect(Math.round(W / 2 - bw / 2), cy + 34, bw, 2);
        texto(x, 'CAPÍTULO ' + k.n, W / 2, cy - 22 - Math.round((1 - kb) * 10), '#9ad4ff', 1, 'centro');
        const esc = k.txt.length * 16 > W - 20 ? 1 : 2, cv = textoCanvas(k.txt, '#ffd23a', esc, CONTORNO), nl = Math.min(k.txt.length, Math.floor(Math.max(0, k.t - 0.3) * 14)); const lw = Math.min(cv.width, cv._ox * 2 + nl * 8 * esc);
        const sh = k.t > 0.3 + k.txt.length / 14 && k.t < 0.45 + k.txt.length / 14 ? Math.round(Math.sin(k.t * 90) * 2) : 0;
        if (lw > 0) x.drawImage(cv, 0, 0, lw, cv.height, Math.round(W / 2 - (cv.width >> 1)) + sh, cy - 8 - cv._oy, lw, cv.height);
        if (k.t > 0.4 + k.txt.length / 14)         if (k.sub) texto(x, k.sub, W / 2, cy + 18, '#e8e0f0', 1, 'centro'); }
    }
    if (this.pres) { // franja diagonal de presentación
      const k = this.pres, ent = Math.min(1, k.t / 0.22), sal = Math.max(0, (k.t - (k.dur - 0.2)) / 0.2); const off = Math.round((1 - ent) * W + sal * -W);
      const cy = Math.round(H * 0.5), hh = 108;
      x.fillStyle = 'rgba(7,4,12,0.55)'; x.fillRect(0, 0, W, H);
      x.fillStyle = CONTORNO; x.fillRect(off - 4, cy - hh / 2 - 3, W + 8, hh + 6); x.fillStyle = '#8a1018'; x.fillRect(off, cy - hh / 2, W, hh);
      x.fillStyle = '#c8202a'; x.fillRect(off, cy - hh / 2, W, 6); x.fillStyle = '#5a0810'; x.fillRect(off, cy + hh / 2 - 6, W, 6);
      for (let i = 0; i < 8; i++) { x.fillStyle = 'rgba(255,210,58,0.10)'; x.fillRect(off + ((i * 97 + Math.floor(k.t * 260)) % (W + 60)) - 30, cy - hh / 2 + 8, 14, hh - 16); }
      const rx = Math.max(12, Math.round(W * 0.5) - 190) + off;
      if (k.ret) { x.fillStyle = CONTORNO; x.fillRect(rx - 3, cy - 51, 102, 102); x.fillStyle = '#2a1a34'; x.fillRect(rx, cy - 48, 96, 96); x.drawImage(k.ret, rx, cy - 48, 96, 96); }
      const tx = rx + 112;
      texto(x, k.txt, tx, cy - 20, '#ffd23a', k.txt.length * 16 > W - tx - 8 ? 1 : 2, 'izq', CONTORNO, '#5a0810');
      if (k.sub) { if (k.sub.length * 8 > W - tx - 8 && k.sub.includes(' · ')) { const [s1, s2] = k.sub.split(' · '); texto(x, s1, tx, cy + 6, '#ffffff', 1, 'izq', CONTORNO); texto(x, s2, tx, cy + 18, '#ffffff', 1, 'izq', CONTORNO); } else texto(x, k.sub, tx, cy + 10, '#ffffff', 1, 'izq', CONTORNO); }
      if (k.t > 0.3 && Math.floor(k.t * 6) % 2) texto(x, '¡CUIDADO!', tx, cy + 32, '#ff8a5a', 1, 'izq', CONTORNO);
    }
    const c = this.caja;
    if (c) {
      const bx = 8, bw = W - 16, by = 22, bH = 64; const izq = c.lado === 'izq';
      x.fillStyle = CONTORNO; x.fillRect(bx - 2, by - 2, bw + 4, bH + 4); x.fillStyle = 'rgba(22,12,34,0.94)'; x.fillRect(bx, by, bw, bH);
      x.fillStyle = '#ffd23a'; x.fillRect(bx, by, bw, 2); x.fillStyle = '#5a3a6a'; x.fillRect(bx, by + bH - 2, bw, 2);
      const rx = izq ? bx + 6 : bx + bw - 58, tx0 = izq ? bx + 64 : bx + 8;
      if (c.ret) { x.fillStyle = CONTORNO; x.fillRect(rx - 2, by + 4, 56, 56); x.fillStyle = '#3a2a4a'; x.fillRect(rx, by + 6, 52, 52); x.drawImage(c.ret, rx + 2, by + 8, 48, 48); }
      if (c.nombre) texto(x, c.nombre, tx0, by + 6, '#ffd23a', 1, 'izq');
      const nch = Math.max(10, Math.floor((bw - 74) / 8)); if (!c.renglones || c.nch !== nch) { c.renglones = renglones(c.txt, nch); c.nch = nch; }
      let resto = Math.floor(c.n);
      for (let r = 0; r < c.renglones.length && resto > 0; r++) {
        const s = c.renglones[r]; const n = Math.min(s.length, resto); resto -= s.length + 1;
        const cv = textoCanvas(s, '#ffffff', 1, CONTORNO); const sw = Math.min(cv.width, cv._ox + n * 8 + 2);
        x.drawImage(cv, 0, 0, sw, cv.height, tx0 - cv._ox, by + 20 + r * 12 - cv._oy, sw, cv.height);
      }
      if (c.n >= c.total && Math.floor(this.t * 3) % 2 === 0) texto(x, '>', bx + bw - (izq ? 12 : 66), by + bH - 13, '#ffd23a', 1, 'izq');
    }
    if (!this.cartel || this.cartel.t > 0.3) {
      texto(x, 'SALTAR >>', W - 8, H - 13, '#c8b8d8', 1, 'der');
      if (c && this.t < 6) texto(x, tactil ? 'TOCÁ PARA SEGUIR' : 'PIÑA: SEGUIR · ESC: SALTAR', 8, H - 13, '#9a8aa8', 1, 'izq');
    }
  }
}
