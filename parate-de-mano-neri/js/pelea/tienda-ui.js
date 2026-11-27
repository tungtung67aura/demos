// v13: pantalla de la TIENDA PLENA MORTAL (sólo se entra desde el menú de PLENA MORTAL).
// Táctil (tocar pestaña / fila / botón; tocar la fila elegida = acción), teclado y mando (←→ pestañas, ↑↓ lista,
// PIÑA/A acepta, ESC/B vuelve). Vista previa animada: el traje puesto en el luchador, el festejo, el título en la VS.
import { texto, CONTORNO } from '../pixel.js';
import { dibujarCuadro, cuadroListo, retrato, armarDef } from '../sprites.js';
import { sonar } from '../audio.js';
import { DIOS } from '../progreso.js';
import { POR_ID } from './luchadores.js';
import { setLuchador } from './motor.js';
import { SECCIONES, fichas, estadoItem, precioDe, comprarItem, equipar, equipado, tiene, bloqueo, nivelMejora, trajeActual, TP } from './tienda-pm.js';
import { usaPad, nomBoton } from '../entrada.js';

const dentro = (t, r) => t && t[0] >= r[0] && t[0] <= r[0] + r[2] && t[1] >= r[1] && t[1] <= r[1] + r[3];
function cortar(s, n) { const r = []; let l = ''; for (const w of s.split(' ')) { if ((l + ' ' + w).trim().length > n) { if (l) r.push(l); l = w; } else l = (l + ' ' + w).trim(); } if (l) r.push(l); return r; }
// ficha (moneda) en pixel art: disco dorado con borde y una Ñ grabada
export function dibujarFicha(x, cx, cy, r = 4) { cx = Math.round(cx); cy = Math.round(cy); x.fillStyle = CONTORNO; x.fillRect(cx - r, cy - r + 1, r * 2, r * 2 - 2); x.fillRect(cx - r + 1, cy - r, r * 2 - 2, r * 2);
  x.fillStyle = '#e8b830'; x.fillRect(cx - r + 1, cy - r + 2, r * 2 - 2, r * 2 - 4); x.fillRect(cx - r + 2, cy - r + 1, r * 2 - 4, r * 2 - 2); x.fillStyle = '#fff0a0'; x.fillRect(cx - r + 2, cy - r + 2, 2, 1); x.fillStyle = '#a06a10'; x.fillRect(cx - 1, cy - 1, 2, 2); }
const ROWS = 8;
// presupuesto por cuadro: armar un set de sprites nuevo cuesta 15–30 ms, así que en la tienda se arma como mucho UNO por cuadro
// (primero el de la vista previa) y los retratos chicos de la lista, de a tres (≈1,5 ms c/u). Lo ya armado queda en caché.
const LISTOS = new Set(), ICONOS = new Map(); let presuSet = 1, presuIco = 3;
function spT(L, traje = null, festejo = null) { const k = L.id + '|' + (traje || '') + '|' + (festejo || ''); if (!LISTOS.has(k)) { if (presuSet <= 0) return null; presuSet--; LISTOS.add(k); } return setLuchador(L, null, traje, festejo); }
function icono(q) { let r = ICONOS.get(q.id); if (r) return r; if (presuIco <= 0) return null; presuIco--; const L = POR_ID[q.pj]; r = retrato(armarDef(L.cuerpo + '~' + q.sid, 0, null), 13); ICONOS.set(q.id, r); return r; }
function dib(x, sp, an, i, px, py, cara) { if (sp) dibujarCuadro(x, cuadroListo(sp, an, i), px, py, cara); }

export function instalarTienda(Arcade) {
  const A = Arcade.prototype;
  A.abrirTienda = function () { TP(); this.ir('tienda'); this.tab = this.tab || 0; this.isel = 0; this.scroll = 0; this.conf = null; this.tT = 0; };
  A.itemsTab = function () { return SECCIONES[this.tab][1]; };
  A.itemSel = function () { return this.itemsTab()[this.isel]; };
  // geometría (lógica, 480×270 típico; se adapta al ancho)
  A.gTienda = function () { const W = this.api.W(), H = this.api.H(); const lw = Math.min(250, Math.round(W * 0.52)); const x0 = Math.max(6, Math.round(W / 2 - (lw + 4 + Math.min(210, W - lw - 16)) / 2));
    return { W, H, x0, lw, px: x0 + lw + 6, pw: Math.min(210, W - lw - 16 - (x0 - 6)), ty: 26, ly: 46, rh: 19 }; };
  A.zTab = function (i) { const g = this.gTienda(), n = SECCIONES.length, tw = Math.floor((g.lw + 6 + g.pw) / n); return [g.x0 + i * tw, g.ty, tw - 3, 16]; };
  A.zFila = function (i) { const g = this.gTienda(); return [g.x0, g.ly + i * g.rh, g.lw, g.rh - 2]; };
  A.zAccion = function () { const g = this.gTienda(); return [g.px + 8, g.H - 52, g.pw - 16, 20]; };
  A.zConf = function (i) { const W = this.api.W(), H = this.api.H(); return [Math.round(W / 2 - 84 + i * 90), Math.round(H / 2 + 14), 78, 20]; };
  A.accion = function () { const it = this.itemSel(); if (!it) return; const e = estadoItem(it);
    if (e === 'ok') { this.conf = { it, sel: 0, t: 0 }; sonar('ui.ok'); return; }
    if (e === 'tiene') { if (it.tipo === 'mejora') { sonar('ui.bloqueado'); this.msg = { s: 'YA ESTÁ AL MÁXIMO', t: 1.2 }; return; } equipar(it); sonar('ui.ropa'); return; }
    sonar('tienda.nopuede'); this.msg = { s: e === 'bloq' ? bloqueo(it) : 'TE FALTAN ' + (precioDe(it) - fichas()) + ' FICHAS: GANALAS PELEANDO', t: 1.6 }; };
  A.pasoTienda = function (I) { const n = I.n, t = I.tap; this.tT += I.dt || 1 / 60; const its = this.itemsTab();
    if (this.conf) { const c = this.conf; c.t += I.dt || 1 / 60; if (n.x) { c.sel = 1 - c.sel; sonar('ui.mover'); } let el = I.ok ? c.sel : -1; if (t) for (let i = 0; i < 2; i++) if (dentro(t, this.zConf(i))) el = i; if (I.atras) el = 1;
      if (el === 0 && c.t > 0.15) { if (comprarItem(c.it)) { sonar('tienda.compra'); this.msg = { s: '¡COMPRADO! ' + (c.it.tipo === 'mejora' ? 'NIVEL ' + nivelMejora(c.it.id) : 'YA LO TENÉS PUESTO'), t: 1.6 }; } this.conf = null; } else if (el === 1) { sonar('ui.atras'); this.conf = null; } return; }
    if (I.atras || dentro(t, this.zVolver())) { sonar('ui.atras'); this.abrirMenu(); this.sel = 5; return; }
    if (n.x) { this.tab = (this.tab + n.x + SECCIONES.length) % SECCIONES.length; this.isel = 0; this.scroll = 0; sonar('ui.mover'); return; }
    if (n.y) { this.isel = (this.isel + n.y + its.length) % its.length; sonar('ui.mover'); }
    if (t) { for (let i = 0; i < SECCIONES.length; i++) if (dentro(t, this.zTab(i))) { if (this.tab !== i) { this.tab = i; this.isel = 0; this.scroll = 0; sonar('ui.mover'); } return; }
      for (let i = 0; i < ROWS; i++) { const k = this.scroll + i; if (k < its.length && dentro(t, this.zFila(i))) { if (this.isel === k) this.accion(); else { this.isel = k; sonar('ui.mover'); } return; } }
      // flechas de desplazamiento (táctil)
      const g = this.gTienda(); if (dentro(t, [g.x0, g.ly + ROWS * g.rh, g.lw, 14])) { const up = t[0] < g.x0 + g.lw / 2; this.isel = up ? Math.max(0, this.scroll - ROWS) : Math.min(its.length - 1, this.scroll + ROWS); this.scroll = up ? Math.max(0, this.scroll - ROWS) : Math.min(its.length - ROWS, this.scroll + ROWS); sonar('ui.mover'); return; }
      if (dentro(t, this.zAccion())) { this.accion(); return; } }
    if (this.isel < this.scroll) this.scroll = this.isel; if (this.isel >= this.scroll + ROWS) this.scroll = this.isel - ROWS + 1;
    if (I.ok) this.accion(); };
  A.dibujarTienda = function (x, W, H) { const g = this.gTienda(); const its = this.itemsTab(); const it = this.itemSel(); presuSet = 1; presuIco = 3;
    this.titulo(x, 'TIENDA PLENA MORTAL', W, 6, '#ff5a3a');
    dibujarFicha(x, W - 12 - String(fichas()).length * 8 - 8, 11, 5); texto(x, String(fichas()), W - 8, 7, '#ffd23a', 1, 'der', CONTORNO);
    SECCIONES.forEach(([nom], i) => { const r = this.zTab(i), s = this.tab === i; x.fillStyle = CONTORNO; x.fillRect(r[0] - 1, r[1] - 1, r[2] + 2, r[3] + 2); x.fillStyle = s ? '#ff5a3a' : 'rgba(40,24,56,0.95)'; x.fillRect(r[0], r[1], r[2], r[3]); texto(x, nom, r[0] + r[2] / 2, r[1] + 4, s ? '#ffffff' : '#a898b8', 1, 'centro'); });
    // vista previa (primero: se lleva el presupuesto de armado)
    this.panel(x, g.px, g.ly - 3, g.pw, H - g.ly - 28, '#ffd23a'); if (it) this.dibujarPrevia(x, it, g);
    // lista
    this.panel(x, g.x0, g.ly - 3, g.lw, ROWS * g.rh + 16, '#ff5a3a');
    for (let i = 0; i < ROWS; i++) { const k = this.scroll + i; if (k >= its.length) break; const q = its[k], r = this.zFila(i), s = k === this.isel, e = estadoItem(q);
      if (s) { x.fillStyle = 'rgba(255,90,58,0.22)'; x.fillRect(r[0], r[1], r[2], r[3]); x.fillStyle = '#ff5a3a'; x.fillRect(r[0], r[1], 2, r[3]); }
      let nx = r[0] + 6; if (q.tipo === 'traje') { const ic = icono(q); if (ic) x.drawImage(ic, r[0] + 4, r[1] + 2, 14, 14); nx = r[0] + 22; }
      const nom = q.nombre; const maxc = Math.floor((r[0] + r[2] - 52 - nx) / 8); texto(x, nom.length > maxc ? nom.slice(0, maxc - 1) + '.' : nom, nx, r[1] + 5, s ? '#ffffff' : e === 'bloq' ? '#6a5a7a' : '#d8c8e8', 1);
      const dx = r[0] + r[2] - 4, dy = r[1] + 5;
      if (q.tipo === 'mejora') { const nv = nivelMejora(q.id); for (let p = 0; p < q.max; p++) { x.fillStyle = CONTORNO; x.fillRect(dx - 60 + p * 7, dy, 6, 7); x.fillStyle = p < nv ? '#5ad8ff' : '#2a2034'; x.fillRect(dx - 59 + p * 7, dy + 1, 4, 5); } }
      if (e === 'tiene') texto(x, q.tipo === 'mejora' ? 'MÁX' : equipado(q) ? 'PUESTO' : 'TUYO', dx, dy, q.tipo === 'mejora' || equipado(q) ? '#7aff7a' : '#ffffff', 1, 'der');
      else if (e === 'bloq') texto(x, 'BLOQ', dx, dy, '#6a5a7a', 1, 'der');
      else { const pr = String(precioDe(q)); texto(x, pr, dx, dy, e === 'caro' ? '#ff7a5a' : '#ffd23a', 1, 'der'); if (q.tipo !== 'mejora') dibujarFicha(x, dx - pr.length * 8 - 7, dy + 3, 3); } }
    if (its.length > ROWS) { const yb = g.ly + ROWS * g.rh + 1; const cxm = g.x0 + g.lw / 2; texto(x, (this.isel + 1) + '/' + its.length, cxm, yb, '#8a7a9a', 1, 'centro'); x.fillStyle = '#8a7a9a';
      if (this.scroll > 0) for (let i = 0; i < 4; i++) x.fillRect(cxm - 34 - i, yb + 1 + i, 1 + 2 * i, 1);
      if (this.scroll + ROWS < its.length) for (let i = 0; i < 4; i++) x.fillRect(cxm + 30 - (3 - i), yb + 1 + i, 1 + 2 * (3 - i), 1); }
    this.boton(x, this.zVolver(), 'VOLVER', false);
    const ayuda = usaPad() ? 'CRUCETA: ELEGIR · ' + nomBoton('ok') + ' ACEPTA · ' + nomBoton('atras') + ' VUELVE' : document.body.classList.contains('tactil') ? 'TOCÁ UNA FILA · TOCALA OTRA VEZ PARA COMPRAR' : 'FLECHAS: ELEGIR · PIÑA: ACEPTAR · ESC: VOLVER';
    texto(x, ayuda, W / 2 + 40, H - 18, '#7a6a8a', 1, 'centro');
    if (DIOS.on) texto(x, 'MODO DIOS: NO SE GANAN FICHAS', W / 2, H - 9, '#ff5a3a', 1, 'centro');
    if (this.conf) this.dibujarConf(x, W, H); };
  A.dibujarPrevia = function (x, it, g) { const cx = g.px + g.pw / 2, t = this.tT; let y = g.ly + 2;
    const pj = it.tipo === 'traje' ? it.pj : (this.p1 && POR_ID[this.p1] ? this.p1 : 'neri'); const L = POR_ID[pj];
    const fy = g.ly + 106; x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(Math.round(cx - 26), fy - 2, 52, 4);
    if (it.tipo === 'traje') { const sp = spT(L, it.sid); const an = (t % 4) < 2.6 ? 'quieto' : 'gana'; dib(x, sp, an, Math.floor(t * (an === 'quieto' ? 5 : 3)) % (an === 'quieto' ? 4 : 2), Math.round(cx - 22), fy, 1);
      const sp0 = spT(L); x.globalAlpha = 0.45; dib(x, sp0, 'quieto', Math.floor(t * 5) % 4, Math.round(cx + 44), fy, -1); x.globalAlpha = 1; texto(x, 'ANTES', Math.round(cx + 44), g.ly + 4, '#6a5a7a', 1, 'centro'); }
    else if (it.tipo === 'festejo') { dib(x, spT(L, trajeActual(pj), it.pose), 'gana', Math.floor(t * 3) % 2, Math.round(cx), fy, 1); }
    else if (it.tipo === 'titulo') { dib(x, spT(L, trajeActual(pj)), 'intro', Math.floor(t * 2.5) % 2, Math.round(cx), fy, 1);
      const yb = g.ly + 110; x.fillStyle = 'rgba(10,6,20,0.8)'; x.fillRect(g.px + 4, yb, g.pw - 8, 26); texto(x, L.nombre.length > 24 ? L.nombre.slice(0, 24) : L.nombre, cx, yb + 3, L.color === '#24242c' ? '#ffd23a' : L.color || '#ffd23a', 1, 'centro', CONTORNO); texto(x, it.nombre, cx, yb + 14, '#ffd23a', 1, 'centro', CONTORNO); }
    else if (it.tipo === 'relator') { dib(x, spT(L, trajeActual(pj)), 'gana', Math.floor(t * 3) % 2, Math.round(cx), fy, 1);
      const e = (t % 2.5) < 0.12 ? 2 : 1; cortar(it.frase, Math.floor((g.pw - 12) / (8 * e))).slice(0, 3).forEach((l, i) => texto(x, l, cx, y + 8 + i * 10 * e, '#ffd23a', e, 'centro', CONTORNO, '#3a1a10')); }
    else if (it.tipo === 'mejora') { const nv = nivelMejora(it.id); texto(x, it.nombre, cx, y + 8, '#5ad8ff', 1, 'centro', CONTORNO);
      for (let p = 0; p < it.max; p++) { const bx = Math.round(cx - 27 + p * 20); x.fillStyle = CONTORNO; x.fillRect(bx - 1, y + 24, 16, 12); x.fillStyle = p < nv ? '#5ad8ff' : '#2a2034'; x.fillRect(bx, y + 25, 14, 10); }
      texto(x, 'AHORA:', g.px + 8, y + 46, '#8a7a9a', 1); cortar(nv ? it.desc(nv) : 'SIN MEJORA', Math.floor((g.pw - 16) / 8)).slice(0, 2).forEach((l, i) => texto(x, l, g.px + 8, y + 57 + i * 10, '#ffffff', 1));
      if (nv < it.max) { texto(x, 'NIVEL ' + (nv + 1) + ':', g.px + 8, y + 80, '#8a7a9a', 1); cortar(it.desc(nv + 1), Math.floor((g.pw - 16) / 8)).slice(0, 2).forEach((l, i) => texto(x, l, g.px + 8, y + 91 + i * 10, '#7aff7a', 1)); }
      texto(x, 'SÓLO EN PLENA MORTAL', cx, y + 114, '#ff8a5a', 1, 'centro'); }
    // nombre + descripción + estado
    let yd = g.ly + 112; if (it.tipo === 'titulo') yd += 18; if (it.tipo !== 'mejora') { if (it.tipo !== 'titulo') texto(x, it.nombre.length > Math.floor(g.pw / 8) ? it.nombre.slice(0, Math.floor(g.pw / 8)) : it.nombre, cx, yd, '#ffffff', 1, 'centro'); if (it.tipo === 'traje') texto(x, L.nombre.length > Math.floor(g.pw / 8) ? L.nombre.slice(0, Math.floor(g.pw / 8)) : L.nombre, cx, yd + 10, L.color === '#24242c' ? '#c8c8d8' : L.color, 1, 'centro');
      cortar(it.desc, Math.floor((g.pw - 12) / 8)).slice(0, 3).forEach((l, i) => texto(x, l, cx, yd + 22 + i * 9, '#b8a8c8', 1, 'centro')); }
    const e = estadoItem(it); const r = this.zAccion();
    const lab = e === 'ok' ? 'COMPRAR · ' + precioDe(it) : e === 'caro' ? 'FALTAN ' + (precioDe(it) - fichas()) : e === 'bloq' ? 'BLOQUEADO' : it.tipo === 'mejora' ? 'AL MÁXIMO' : equipado(it) ? 'QUITAR' : 'PONERME';
    this.boton(x, r, lab, e === 'ok' || (e === 'tiene' && it.tipo !== 'mejora'), e === 'ok' ? '#ffd23a' : '#7aff7a');
    if (e === 'bloq') texto(x, bloqueo(it), cx, r[1] - 10, '#ff8a5a', 1, 'centro'); else if (e === 'tiene' && it.tipo !== 'mejora') texto(x, equipado(it) ? (it.tipo === 'traje' ? 'PUESTO · CAMBIALO EN LA SELECCIÓN' : 'PUESTO') : 'COMPRADO', cx, r[1] - 10, '#7aff7a', 1, 'centro'); };
  A.dibujarConf = function (x, W, H) { const c = this.conf; x.fillStyle = 'rgba(8,4,16,0.7)'; x.fillRect(0, 0, W, H); this.panel(x, W / 2 - 110, H / 2 - 44, 220, 88, '#ffd23a');
    texto(x, '¿LO COMPRÁS?', W / 2, H / 2 - 36, '#ffd23a', 1, 'centro'); const nm = c.it.nombre + (c.it.tipo === 'mejora' ? ' · NIVEL ' + (nivelMejora(c.it.id) + 1) : ''); cortar(nm, 26).slice(0, 2).forEach((l, i) => texto(x, l, W / 2, H / 2 - 22 + i * 10, '#ffffff', 1, 'centro'));
    const pr = String(precioDe(c.it)); const tw = (pr.length + 7) * 8; dibujarFicha(x, W / 2 - tw / 2 - 2, H / 2 + 3, 4); texto(x, pr + ' FICHAS', W / 2 + 6, H / 2, '#ffd23a', 1, 'centro');
    ['SÍ, DALE', 'NO'].forEach((s, i) => this.boton(x, this.zConf(i), s, c.sel === i)); };
  const _p = A.paso; A.paso = function (dt, I) { if (this.vista === 'tienda') { this.t += dt; if (this.fondo) this.fondo.paso(dt); return this.pasoTienda(Object.assign({ dt }, I)); } return _p.call(this, dt, I); };
  const _d = A.dibujar; A.dibujar = function (x, alfa, W, H) { if (this.vista !== 'tienda') return _d.call(this, x, alfa, W, H); this.dibujarFondo(x, W, H); this.dibujarTienda(x, W, H);
    if (this.msg) { this.msg.t -= 1 / 60; texto(x, this.msg.s, W / 2, H - 44, '#ff8a5a', 1, 'centro'); if (this.msg.t <= 0) this.msg = null; } };
  void tiene;
}
