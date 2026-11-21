// Eventos de nivel (bondis, macetas, changuitos, carro, palomas, llamadas, apagón, turistas, lluvia, olas, gaviotas, rayos)
// y peligros del escenario (fogatas, parrillas, brasas del Parrillero). Todo con objetos reciclados: nada se crea por cuadro.
import { SP, sombra } from './props.js';
import { generar } from './sprites.js';
import { dibujarCuadro, cuadroListo } from './sprites.js';
import { PISO } from './escenario.js';
import { FRASES, pick } from './datos.js';
import { sonar, ambiente } from './audio.js';
import { texto, lienzo, CONTORNO } from './pixel.js';
import { spriteG } from './grado.js';

const CARRIL = [212, 250]; // carril del ómnibus (calle)

export class Eventos {
  constructor(g) {
    this.g = g; this.cola = []; this.obj = []; this.peligros = [];
    this.bondis = []; this.apagon = 0; this.apagonDur = 0; this.lluvia = g.nv.lluvia ? 1 : 0; this.tLluvia = 0; this.flash = 0; this.tRayo = 6 + Math.random() * 6; this.ola = null; this.llamadas = 0; this.vineta = null;
    for (const p of g.nv.peligros || []) this.peligros.push({ t: p.t, x: p.x, y: p.y, r: p.t === 'parrilla' ? 34 : 18, vida: 1e9, aviso: 0, viva: 0, aviva: 0 });
    if (this.lluvia) ambiente('amb.lluvia');
  }
  // eventos de la oleada: se disparan "en" segundos después de trabar la cámara
  programar(lista) { if (!lista) return; for (const e of lista) this.cola.push({ ...e, falta: e.en || 0 }); }
  limpiarCola() { this.cola.length = 0; }
  hayBondi() { return this.bondis.length > 0; }
  paso(dt) {
    const g = this.g;
    for (let i = 0; i < this.cola.length; i++) { const c = this.cola[i]; c.falta -= dt; if (c.falta <= 0) { this.cola.splice(i--, 1); this.disparar(c); } }
    this.pasoBondis(dt); this.pasoObj(dt); this.pasoPeligros(dt);
    if (this.apagon > 0) { this.apagon -= dt; if (this.apagon <= 0) { sonar('evento.luz'); g.mensaje = { txt: '¡VOLVIÓ LA LUZ!', t: 0, dur: 1.4 }; } }
    if (this.llamadas > 0) { this.llamadas -= dt; for (const e of g.ents) if (e.equipo === 'e' && !e.muerto) e.buff = Math.max(e.buff || 0, 0.3); }
    if (this.flash > 0) this.flash -= dt;
    if (this.lluvia) { this.tLluvia += dt; if (g.nv.hora === 'tormenta') { this.tRayo -= dt; if (this.tRayo <= 0) { this.tRayo = 9 + Math.random() * 9; this.flash = 0.25; sonar('evento.trueno'); } } }
    if (this.ola) this.pasoOla(dt);
  }
  disparar(c) {
    const g = this.g, w = g.vista.w;
    switch (c.t) {
      case 'bondi': this.bondi(c.linea || '121', !!c.izq); break;
      case 'macetas': g.mensaje = { txt: '¡CUIDADO ARRIBA!', t: 0, dur: 1.8 }; sonar('evento.aviso'); for (let i = 0; i < (c.n || 4); i++) this.obj.push({ k: 'maceta', x: 0, y: 0, z: 200, t: -i * 0.8, sigue: true }); break;
      case 'changuitos': sonar('evento.changuito'); g.mensaje = { txt: '¡AHÍ VIENEN LOS CHANGUITOS!', t: 0, dur: 1.8 }; for (let i = 0; i < (c.n || 3); i++) { const y = PISO.arriba + 12 + ((i * 29) % (PISO.abajo - PISO.arriba - 20)); this.obj.push({ k: 'changuito', x: g.cam + w + 40 + i * 120, y, t: 0, vx: -150 - i * 14, golpe: 0 }); } break;
      case 'carro': sonar('evento.carro'); g.mensaje = { txt: '¡PASA EL CARRO! ¡CORRÉ!', t: 0, dur: 1.8 }; this.obj.push({ k: 'carro', x: g.cam - 190, y: 238, t: 0, vx: 70, golpe: 0 }); break;
      case 'palomas': for (let i = 0; i < 14; i++) this.obj.push({ k: 'paloma', x: g.cam + 60 + Math.random() * (w - 120), y: 200 + Math.random() * 50, z: 0, t: -Math.random() * 0.4, vx: (Math.random() - 0.5) * 120, vz: 0, f: 0 }); sonar('evento.aviso'); break;
      case 'llamadas': this.llamadas = c.dur || 12; sonar('evento.llamadas'); g.mensaje = { txt: '¡SALIERON LAS LLAMADAS!', t: 0, dur: 2 };
        for (let i = 0; i < 5; i++) this.obj.push({ k: 'comparsa', x: g.cam + w + 30 + i * 46, y: 186 + (i % 2) * 4, t: i * 0.13, vx: -40, sp: generar('tambor', i % 3) }); break;
      case 'apagon': this.apagon = this.apagonDur = c.dur || 6; sonar('evento.apagon'); g.mensaje = { txt: '¡SE CORTÓ LA LUZ!', t: 0, dur: 1.8 }; break;
      case 'turistas': for (let i = 0; i < 4; i++) this.obj.push({ k: 'turista', x: g.cam - 30 - i * 26, y: 196 + i * 6, t: i * 0.2, vx: 32, cae: 0, golpeado: false }); g.mensaje = { txt: 'CUIDADO CON LOS TURISTAS', t: 0, dur: 1.8 }; break;
      case 'lluvia': this.lluvia = 1; ambiente('amb.lluvia'); g.mensaje = { txt: 'SE LARGÓ A LLOVER', t: 0, dur: 1.6 }; break;
      case 'ola': this.ola = { t: 0, golpe: false }; sonar('evento.aviso'); g.mensaje = { txt: '¡OLA! ¡ALEJATE DEL MURO!', t: 0, dur: 2 }; break;
      case 'gaviotas': sonar('evento.gaviotas'); for (let i = 0; i < (c.n || 4); i++) this.obj.push({ k: 'gaviota', x: g.cam + (i % 2 ? -30 : w + 30), y: 0, z: 140 + i * 10, t: -i * 1.1, est: 'ronda', vx: 0, vz: 0, hp: 1 }); break;
      case 'rayo': this.flash = 0.3; sonar('evento.trueno'); break;
    }
  }
  // ---------- bondi (ómnibus CUTCSA a escala) que cruza por el carril
  bondi(linea, izq) {
    const g = this.g; const dir = izq ? 1 : -1; const x = dir < 0 ? g.cam + g.vista.w + 40 : g.cam - 40 - 644;
    this.bondis.push({ x, y: 252, t: 0, dir, linea, golpeados: new Set(), sp: spriteBondi(linea, dir) }); g.mensaje = { txt: '¡CUIDADO, EL ' + linea + '!', t: 0, dur: 2.2 };
  }
  pasoBondis(dt) {
    const g = this.g;
    for (let i = 0; i < this.bondis.length; i++) {
      const b = this.bondis[i]; b.t += dt;
      if (b.t < 2.0) { if (b.t < 1.8 && Math.floor(b.t * 4) !== Math.floor((b.t - dt) * 4)) sonar('evento.bondi.bocina', { x: b.dir < 0 ? 1 : 0 }); continue; }
      if (!b.paso) { b.paso = true; sonar('evento.bondi.pasa'); }
      b.x += b.dir * 330 * dt;
      for (const o of g.ents) if (!o.muerto && o.est !== 'vuela' && o.z < 20 && o.y > CARRIL[0] && o.y < CARRIL[1] && o.x > b.x - 4 && o.x < b.x + 644 && !b.golpeados.has(o.id)) {
        b.golpeados.add(o.id); o.invul = 0; g.impacto(o, o, { dmg: o.equipo === 'j' ? 14 : 30, kb: 260, tumba: true, vz: 200, son: 'golpe.embestida', hs: 0.06, crudo: true }, o.x, o.y, 40);
        o.vx = b.dir * 260; if (o.equipo === 'e') { g.puntos += 300; g.fx.flotante(o.x, o.y, 60, '+300'); }
      }
      // los objetos del carril también vuelan
      for (const r of g.rompibles) if (!r.roto && r.y > CARRIL[0] && r.y < CARRIL[1] && r.x > b.x && r.x < b.x + 644) g.romper(r);
      if ((b.dir < 0 && b.x < g.cam - 700) || (b.dir > 0 && b.x > g.cam + g.vista.w + 60)) { this.bondis.splice(i--, 1); }
    }
  }
  // ---------- objetos de eventos
  pasoObj(dt) {
    const g = this.g, j = g.j, w = g.vista.w;
    for (let i = 0; i < this.obj.length; i++) {
      const o = this.obj[i]; o.t += dt; let fuera = false;
      switch (o.k) {
        case 'maceta': // sigue al jugador con la sombra y cae
          if (o.t < 0) break;
          if (o.sigue && o.t < 0.6) { o.x = j.x + j.vx * 0.35; o.y = j.y; } else o.sigue = false;
          if (o.t > 1.0) { o.z -= 520 * dt; if (o.z <= 0) { fuera = true; sonar('impacto.barro', g.pan(o.x)); g.fx.astillas(o.x, o.y, 4, '#b8603a'); g.fx.polvo(o.x, o.y, 6);
            for (const e of g.ents) if (!e.muerto && e.est !== 'piso' && Math.abs(e.x - o.x) < 16 && Math.abs(e.y - o.y) < 9) g.impacto(e, e, { dmg: e.equipo === 'j' ? 10 : 20, kb: 40, tumba: true, vz: 90, son: 'impacto.barro', hs: 0.06, crudo: true }, e.x, e.y, 50);
            if (Math.random() < 0.3) g.soltarItem('alfajor', o.x, o.y, 4, 80); } }
          break;
        case 'changuito': case 'carro': {
          o.x += o.vx * dt; const ancho = o.k === 'carro' ? 170 : 40;
          if (o.k === 'changuito' && Math.random() < 0.2) g.fx.polvo(o.x + 20, o.y, 1);
          for (const e of g.ents) if (!e.muerto && e.est !== 'vuela' && e.est !== 'piso' && e.z < 20 && Math.abs(e.y - o.y) < (o.k === 'carro' ? 14 : 10) && e.x > o.x - 6 && e.x < o.x + ancho && e.invul <= 0)
            g.impacto(e, e, { dmg: e.equipo === 'j' ? (o.k === 'carro' ? 9 : 7) : 16, kb: 200, tumba: true, vz: 150, son: o.k === 'carro' ? 'golpe.embestida' : 'impacto.metal', hs: 0.05, crudo: true }, e.x, e.y, 30), e.vx = Math.sign(o.vx) * 220;
          for (const r of g.rompibles) if (!r.roto && Math.abs(r.y - o.y) < 14 && r.x > o.x && r.x < o.x + ancho) g.romper(r);
          if ((o.vx < 0 && o.x < g.cam - 220) || (o.vx > 0 && o.x > g.cam + w + 60)) fuera = true;
          break; }
        case 'paloma': if (o.t < 0) break; o.vz += 260 * dt; o.z += o.vz * dt; o.x += o.vx * dt; o.f = Math.floor(o.t * 14) % 2; if (o.z > 260) fuera = true; break;
        case 'comparsa': o.x += o.vx * dt; if (o.x < g.cam - 80) { if (this.llamadas > 0) o.x = g.cam + w + 60; else fuera = true; } break;
        case 'turista':
          if (o.cae > 0) { o.cae -= dt; if (o.cae <= 0) o.vx = -60; break; }
          o.x += o.vx * dt; if (o.x > g.cam + w + 40 || o.x < g.cam - 60) fuera = true;
          // si el jugador le pega, cae y le descuentan
          if (j.est === 'ataca' && j.atq && j.t >= j.atq.ini && j.t <= j.atq.ini + j.atq.act && !o.golpeado) {
            const dx = (o.x - j.x) * j.cara; if (Math.abs(o.y - j.y) < 10 && dx > 0 && dx < 44) { o.golpeado = true; o.cae = 1.4; g.puntos = Math.max(0, g.puntos - 500); g.fx.flotante(o.x, o.y, 50, '¡RESPETÁ AL TURISTA! -500', '#ff5a4a'); g.fx.chispa(o.x, o.y, 30); sonar('golpe.pina', g.pan(o.x)); g.globoLibre(o.x, o.y - 44, pick(FRASES.turista)); }
          }
          break;
        case 'gaviota':
          if (o.t < 0) break; o.f = Math.floor(o.t * 8) % 2;
          if (o.est === 'ronda') { const tx = j.x + Math.sin(o.t * 1.6) * 80; o.x += (tx - o.x) * Math.min(1, dt * 1.2); o.y = j.y; if (o.t > 2.2) { o.est = 'pica'; o.vx = Math.sign(j.x - o.x) * 180; o.vz = -150; sonar('evento.gaviotas', g.pan(o.x)); } }
          else if (o.est === 'pica') { o.x += o.vx * dt; o.z += o.vz * dt; o.y += (j.y - o.y) * Math.min(1, dt * 4);
            if (Math.abs(o.x - j.x) < 14 && Math.abs(o.y - j.y) < 10 && o.z < 70 && j.invul <= 0) { g.impacto(j, j, { dmg: 4, kb: 40, stun: 0.3, son: 'golpe.pina', hs: 0.03, crudo: true }, j.x, j.y, 60); o.est = 'sube'; }
            // si el jugador le pega en el aire, se va
            if (j.est === 'ataca' && Math.abs(o.x - j.x) < 40 && Math.abs(o.y - j.y) < 12 && o.z < 80) { o.est = 'sube'; g.fx.flotante(o.x, o.y, o.z, '¡CRÁ!', '#ffffff'); g.puntos += 100; }
            if (o.z < 30) { o.est = 'sube'; } }
          else { o.z += 160 * dt; o.x += o.vx * 0.5 * dt; if (o.z > 220) { if (o.t > 9) fuera = true; else { o.est = 'ronda'; o.t = 0.01; o.z = 140; } } }
          break;
      }
      if (fuera) { this.obj.splice(i--, 1); }
    }
  }
  // ---------- ola que salta el murito de la rambla
  pasoOla(dt) {
    const g = this.g, o = this.ola; o.t += dt;
    if (o.t > 1.6 && !o.golpe) { o.golpe = true; sonar('evento.ola'); g.temblor = Math.max(g.temblor, 0.3);
      for (let k = 0; k < 6; k++) g.fx.agua(g.cam + 30 + k * (g.vista.w - 60) / 5, 190, 10);
      for (const e of g.ents) if (!e.muerto && e.y < 216 && e.est !== 'piso') g.impacto(e, e, { dmg: e.equipo === 'j' ? 8 : 18, kb: 30, tumba: true, vz: 140, son: 'impacto.agua', hs: 0.04, crudo: true }, e.x, e.y, 30), e.vy = 120; }
    if (o.t > 2.6) this.ola = null;
  }
  // ---------- peligros: fogatas y parrillas queman; las brasas del Parrillero avisan y después queman
  brasas(cx, n = 3) { const g = this.g; for (let i = 0; i < n; i++) { const x = Math.max(g.cam + 30, Math.min(g.cam + g.vista.w - 30, cx + (i - (n - 1) / 2) * 70 + (Math.random() - 0.5) * 30)); const y = PISO.arriba + 10 + Math.random() * (PISO.abajo - PISO.arriba - 20); this.peligros.push({ t: 'brasa', x, y, r: 20, vida: 3.2, aviso: 0.9, viva: 0, aviva: 0 }); } }
  avivarParrillas() { for (const p of this.peligros) if (p.t === 'parrilla') { p.aviva = 1; p.r = 46; } }
  pasoPeligros(dt) {
    const g = this.g;
    for (let i = 0; i < this.peligros.length; i++) {
      const p = this.peligros[i]; p.vida -= dt; p.viva += dt; if (p.aviso > 0) { p.aviso -= dt; continue; }
      if (p.vida <= 0) { this.peligros.splice(i--, 1); continue; }
      if (Math.random() < dt * (p.t === 'parrilla' ? 4 : 3)) g.fx.humo(p.x + (Math.random() - 0.5) * p.r, p.y - 2, p.t === 'parrilla' ? 30 : 24, 1);
      for (const e of g.ents) {
        if (e.muerto || e.est === 'piso' || e.z > 14 || e.invul > 0 || (e.tQuema || 0) > g.t) continue;
        if (Math.abs(e.x - p.x) < p.r && Math.abs(e.y - p.y) < (p.t === 'parrilla' ? 10 : 8)) {
          e.tQuema = g.t + 0.9; g.fx.chispa(e.x, e.y, 20); g.impacto(e, e, { dmg: e.equipo === 'j' ? 7 : 16, kb: 120, tumba: true, vz: 170, son: 'impacto.fuego', hs: 0.05, crudo: true }, e.x, e.y, 24);
          e.vx = Math.sign(e.x - p.x || 1) * 160; if (e.equipo === 'e') g.fx.flotante(e.x, e.y, 60, '¡QUEMADO!', '#ff8a3a');
        }
      }
    }
  }
  // ---------- lista de dibujo: devuelve los objetos que se ordenan con los luchadores
  aLista(lista, C, W) {
    for (const b of this.bondis) if (b.t >= 2) lista.push(b);
    for (const o of this.obj) if (o.k !== 'comparsa' && o.x > C - 200 && o.x < C + W + 200) lista.push(o);
    for (const p of this.peligros) if (p.x > C - 80 && p.x < C + W + 80) lista.push(p);
  }
  // fondo: comparsa en la vereda de atrás (antes que todo)
  fondo(x, C, Y) {
    for (const o of this.obj) if (o.k === 'comparsa') { const sp = o.sp; const f = cuadroListo(sp, 'camina', Math.floor((this.g.t + o.t) * 10) % 8); dibujarCuadro(x, f, Math.round(o.x - C), Math.round(o.y + Y), -1);
      const s = SP.tamborProp; x.drawImage(s.i, Math.round(o.x - C - 12 - s.w / 2), Math.round(o.y + Y - 52)); }
  }
  dibujar(x, o, C, Y, G) {
    const g = this.g, t = g.t;
    if (o.golpeados) { // bondi
      if (o.t < 2) return; x.drawImage(o.sp, Math.round(o.x - C), Math.round(Y + 252 - o.sp.height)); return;
    }
    if (o.vida !== undefined) return this.dibujarPeligro(x, o, C, Y);
    const px = Math.round(o.x - C), py = Math.round(o.y + Y);
    switch (o.k) {
      case 'maceta': { if (o.t < 0) return; const k = Math.min(1, o.t / 1.0); const s = sombra(8 + k * 14); x.globalAlpha = 0.4 + k * 0.5; x.drawImage(s, px - s.width / 2, py - s.height / 2); x.globalAlpha = 1;
        if (o.t > 1.0) { const m = spriteG(SP.maceta, G); x.drawImage(m.d, px - m.w / 2, py - Math.round(o.z) - m.h); } else if ((t * 8 | 0) % 2) texto(x, '!', px, py - 30, '#ff3a2a', 1, 'centro'); return; }
      case 'changuito': { const s = spriteG(SP.changuito, G); x.drawImage(o.vx < 0 ? s.d : s.i, px - 6, py - s.h + 2); return; }
      case 'carro': { const s = spriteG(SP.carroCaballo, G); const bob = (t * 6 | 0) % 2; x.drawImage(o.vx > 0 ? s.i : s.d, px, py - s.h + bob); return; }
      case 'paloma': { if (o.t < 0) return; const s = SP.gaviota[o.f]; x.drawImage(s.d, px - 5, py - Math.round(o.z) - 6, 11, 6); return; }
      case 'turista': { const s = spriteG(SP.turista, G); if (o.cae > 0) { x.save(); x.translate(px, py); x.rotate(-1.4); x.drawImage(s.d, -s.w / 2, -s.h); x.restore(); return; } const bob = (t * 8 + o.t) % 2 < 1 ? 0 : 1; x.drawImage(o.vx > 0 ? s.d : s.i, px - s.w / 2, py - s.h + bob); return; }
      case 'gaviota': { if (o.t < 0) return; const s = SP.gaviota[o.f]; if (o.est !== 'sube' && o.z < 120) { const sh = sombra(10); x.drawImage(sh, px - 7, py - 2); } x.drawImage((o.vx || (g.j.x - o.x)) > 0 ? s.d : s.i, px - s.w / 2, py - Math.round(o.z)); return; }
    }
  }
  dibujarPeligro(x, p, C, Y) {
    const px = Math.round(p.x - C), py = Math.round(p.y + Y), t = this.g.t;
    if (p.t === 'fogata') { const s = SP.fogata; x.drawImage(s.d, px - s.w / 2, py - s.h); const f = llama(18, (t * 10 | 0) % 4); x.drawImage(f, px - f.width / 2, py - s.h - f.height + 6); return; }
    if (p.t === 'parrilla') { const s = SP.parrillaFuego; x.drawImage(s.d, px - s.w / 2, py - s.h); const n = p.aviva ? 4 : 2; for (let k = 0; k < n; k++) { const f = llama(p.aviva ? 16 : 10, ((t * 10 | 0) + k) % 4); x.drawImage(f, px - 24 + k * (48 / Math.max(1, n - 1)) - f.width / 2, py - s.h - f.height + 12); } return; }
    // brasa del Parrillero: aviso (círculo que titila) y después fuego en el piso
    if (p.aviso > 0) { if ((t * 10 | 0) % 2) { x.fillStyle = 'rgba(255,90,40,0.45)'; x.beginPath(); x.ellipse(px, py, p.r, p.r * 0.35, 0, 0, 7); x.fill(); } return; }
    for (let k = -1; k <= 1; k++) { const f = llama(12, ((t * 12 | 0) + k + 2) % 4); x.drawImage(f, px + k * 12 - f.width / 2, py - f.height + 3); }
  }
  // capas encima de todo: lluvia, apagón, relámpago, aviso de ola
  encima(x, W, H, Y, C) {
    const g = this.g;
    if (this.lluvia) { x.fillStyle = 'rgba(200,220,240,0.55)'; const T = this.tLluvia; for (let i = 0; i < 90; i++) { const sx = ((i * 97.3 + T * 60 + C * 0.9) % (W + 40)) - 20; const sy = ((i * 53.7 + T * (380 + (i % 5) * 30)) % (H + 20)) - 10; x.fillRect(W - sx | 0, sy | 0, 1, 5); }
      // salpicaduras en el piso
      x.fillStyle = 'rgba(220,235,250,0.6)'; for (let i = 0; i < 14; i++) { const k = ((T * 3 + i * 0.37) % 1); if (k < 0.2) { const sx = (i * 131 + (T | 0) * 47) % W, sy = Y + 190 + (i * 23) % 70; x.fillRect(sx - 1, sy, 3, 1); } } }
    if (this.apagon > 0) {
      const k = Math.min(1, (this.apagonDur - this.apagon) * 3, this.apagon * 2); const v = this.vineta || (this.vineta = crearLuz());
      const [cv, cx] = this.capa || (this.capa = lienzo(W, H)); if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
      cx.globalCompositeOperation = 'source-over'; cx.clearRect(0, 0, W, H); cx.fillStyle = 'rgba(6,4,18,0.86)'; cx.fillRect(0, 0, W, H); cx.globalCompositeOperation = 'destination-out';
      const j = g.j; cx.drawImage(v, Math.round(j.x - C - 90), Math.round(j.y + Y - 40 - 90)); for (const p of this.peligros) if (p.x > C - 100 && p.x < C + W + 100) cx.drawImage(v, Math.round(p.x - C - 90), Math.round(p.y + Y - 20 - 90));
      x.globalAlpha = k; x.drawImage(cv, 0, 0); x.globalAlpha = 1;
    }
    if (this.ola && this.ola.t < 1.6 && (this.ola.t * 6 | 0) % 2) { x.fillStyle = 'rgba(120,200,255,0.25)'; x.fillRect(0, Y + 182, W, 32); texto(x, '¡OLA!', W / 2, Y + 160, '#bfe8ff', 2, 'centro'); }
    if (this.flash > 0) { x.fillStyle = `rgba(240,245,255,${(this.flash * 1.2).toFixed(2)})`; x.fillRect(0, 0, W, H); }
    for (const b of this.bondis) if (b.t < 2 && Math.floor(b.t * 6) % 2) { const ax = b.dir < 0 ? W - 34 : 34; texto(x, '¡' + b.linea + '!', ax, Y + 216, '#ffd040', 1, 'centro'); x.fillStyle = '#ffd040'; const fx = b.dir < 0 ? W - 8 : 4; x.fillRect(fx, Y + 228, 4, 10); x.fillRect(b.dir < 0 ? fx - 4 : fx + 4, Y + 230, 4, 6); }
  }
  // luces que suman a la escena de noche (fogatas y parrillas)
  luces(x, C, Y) { const h = haloFuego(); x.globalCompositeOperation = 'lighter'; for (const p of this.peligros) if (p.t !== 'brasa' && p.x > C - 100 && p.x < C + this.g.vista.w + 100) x.drawImage(h, Math.round(p.x - C - 60), Math.round(p.y + Y - 30 - 60)); x.globalCompositeOperation = 'source-over'; }
}

// ---------- sprites cacheados
const memo = new Map();
function llama(h, fr) { const k = 'll' + h + ':' + fr; let c = memo.get(k); if (c) return c; const w = Math.round(h * 0.9); const [cv, x] = lienzo(w, h);
  const capas = [['#c8301a', 1], ['#f07a20', 0.72], ['#ffd040', 0.45], ['#fff6c0', 0.2]];
  for (const [col, s] of capas) { x.fillStyle = col; for (let yy = 0; yy < h; yy++) { const k2 = yy / h; const ww = Math.round(w * s * Math.sin(Math.PI * Math.min(1, k2 * 1.15 + 0.08)) * (0.75 + 0.25 * Math.sin(fr * 1.7 + yy * 0.6))); const off = Math.round(Math.sin(fr * 1.3 + yy * 0.35) * (1 - k2) * 2); if (ww > 0 && k2 > (1 - s) * 0.8) x.fillRect(Math.round(w / 2 - ww / 2) + off, yy, ww, 1); } }
  memo.set(k, cv); return cv; }
function haloFuego() { let c = memo.get('halo'); if (c) return c; const [cv, x] = lienzo(120, 120); const gr = x.createRadialGradient(60, 60, 0, 60, 60, 60); gr.addColorStop(0, 'rgba(255,150,60,0.28)'); gr.addColorStop(1, 'rgba(255,120,40,0)'); x.fillStyle = gr; x.fillRect(0, 0, 120, 120); memo.set('halo', cv); return cv; }
function crearLuz() { const [cv, x] = lienzo(180, 180); const gr = x.createRadialGradient(90, 90, 10, 90, 90, 90); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.5, 'rgba(0,0,0,0.75)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(0, 0, 180, 180); return cv; }
export function spriteBondi(linea, dir) {
  const k = 'bondi' + linea + dir; let c = memo.get(k); if (c) return c;
  const base = crearBondi(); let cv = base, x;
  if (dir > 0) { [cv, x] = lienzo(base.width, base.height); x.translate(base.width, 0); x.scale(-1, 1); x.drawImage(base, 0, 0); x.setTransform(1, 0, 0, 1, 0, 0); } else x = base.getContext('2d');
  const W = base.width, m = (v) => (dir > 0 ? W - v : v); // el texto nunca se espeja
  texto(x, linea, m(24), 19, '#ffb040', 1, 'centro', null); texto(x, linea, m(540), 109, '#1b1220', 1, 'centro', null);
  memo.set(k, cv); return cv;
}
function crearBondi() {
  // ómnibus urbano a escala (≈11,5 m × 3 m → 644 × 172 px; ruedas de 1 m)
  const BW = 644, BH = 172; const [cv, x] = lienzo(BW, BH);
  const R = (a, b, w, h, c) => { x.fillStyle = c; x.fillRect(Math.round(a), Math.round(b), Math.round(w), Math.round(h)); };
  const top = 6, base = 150;
  R(0, top, BW, base - top, '#1b1220'); R(2, top + 2, BW - 4, base - top - 4, '#e8e4dc'); R(2, top + 2, BW - 4, 6, '#f6f4ee'); R(2, base - 12, BW - 4, 10, '#b8b4ac');
  R(2, 104, BW - 4, 14, '#2a8a4a'); R(2, 118, BW - 4, 4, '#1f6a38'); R(2, 98, BW - 4, 3, '#2a8a4a'); // franjas
  R(40, top - 4, 200, 6, '#9a9890'); R(400, top - 4, 120, 6, '#9a9890'); // equipos en el techo
  // parabrisas y cartel de destino con la línea
  R(4, 14, 40, 18, '#1b1220'); R(6, 16, 36, 14, '#2a1a10');
  R(4, 34, 42, 62, '#1b1220'); R(6, 36, 38, 58, '#7aa8c8'); R(9, 38, 6, 50, '#bfe0f0'); R(26, 40, 10, 2, '#bfe0f0');
  const puertaB = (px) => { R(px, 30, 58, 120, '#1b1220'); R(px + 2, 32, 26, 114, '#5a7a90'); R(px + 30, 32, 26, 114, '#5a7a90'); R(px + 4, 34, 4, 100, '#9ac0d8'); R(px + 32, 34, 4, 100, '#9ac0d8'); R(px + 2, 88, 54, 2, '#1b1220'); };
  puertaB(52); puertaB(370);
  for (let wx = 118; wx < BW - 20; wx += 62) { if (wx > 350 && wx < 432) continue; R(wx, 32, 56, 56, '#1b1220'); R(wx + 2, 34, 52, 52, '#7aa8c8'); R(wx + 4, 36, 6, 46, '#bfe0f0'); R(wx + 2, 46, 52, 2, '#5a7a90');
    if ((wx / 62 | 0) % 3 === 0) { R(wx + 18, 60, 14, 26, '#3a2a3a'); R(wx + 20, 52, 10, 10, '#c89070'); } }
  R(470, 108, 140, 8, '#e8e4dc'); R(BW - 10, 30, 6, 90, '#1b1220'); R(BW - 8, 40, 4, 10, '#d84a2a');
  R(2, 124, 8, 8, '#fff6a0'); R(2, 136, 10, 6, '#3a3a40');
  for (const wx of [100, 520]) { R(wx - 38, 118, 76, 34, '#1b1220'); for (let j = -28; j <= 28; j++) { const ww = Math.round(Math.sqrt(28 * 28 - j * j)); R(wx - ww, 142 + j, ww * 2, 1, j * j < 16 * 16 ? (j * j < 8 * 8 ? '#aaaab0' : '#55555f') : '#1a1a1a'); } }
  return cv;
}
void CONTORNO;
