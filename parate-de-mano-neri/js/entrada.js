// Entrada unificada: teclado, joystick (Gamepad API) y controles táctiles (D-pad de 8 direcciones + botones).
// Doble toque izquierda/derecha (≤ 280 ms) = correr mientras se mantiene (E.corre = -1/1); vale para cruceta, teclado y pad
// (en el mando también se corre manteniendo LB/L1).
export const E = { dx: 0, dy: 0, corre: 0, buf: { pina: 0, patada: 0, salto: 0, especial: 0, super: 0, pausa: 0, ok: 0, atras: 0 }, mant: { pina: false, patada: false, salto: false, especial: false, super: false }, tactil: false, ultimo: 'teclado', taps: [] };
const teclas = new Set();
const MAPA = { KeyJ: 'pina', KeyZ: 'pina', KeyK: 'patada', KeyX: 'patada', KeyL: 'salto', Space: 'salto', KeyC: 'salto', KeyI: 'especial', KeyU: 'especial', KeyV: 'especial', KeyO: 'super', KeyH: 'super', Escape: 'pausa', KeyP: 'pausa', Enter: 'ok' };
const BUF = 0.14; // búfer de entrada: lo apretado durante la recuperación se ejecuta apenas se puede (no se pierde)
// ---- esquema y disposición de los controles táctiles (se guardan en la partida: bb-cfg.ctrl)
// esquema: 'simple' (especial = botón + dirección, correr manteniendo, imán fuerte), 'clasico' (igual, imán leve), 'pro' (además los
// movimientos ↓↘→ / ↓↙← + golpe, sin correr manteniendo ni imán). cruceta: 'flotante' (aparece donde apoyás el pulgar) o 'fija'.
export const LAYOUT0 = { pina: [8, 40, 78], patada: [96, 8, 66], salto: [100, 92, 60], especial: [26, 130, 56] };
export const CTRL = { esquema: 'simple', cruceta: 'flotante', esc: 1, op: 0.5, pos: JSON.parse(JSON.stringify(LAYOUT0)) };
try { const c = JSON.parse(localStorage.getItem('bb-cfg') || '{}').ctrl; if (c) { Object.assign(CTRL, c); CTRL.pos = Object.assign(JSON.parse(JSON.stringify(LAYOUT0)), c.pos || {}); } } catch (e) { /* partida sin controles guardados */ }
export function guardarCtrl() { try { const c = JSON.parse(localStorage.getItem('bb-cfg') || '{}'); c.ctrl = CTRL; localStorage.setItem('bb-cfg', JSON.stringify(c)); } catch (e) { /* sin almacenamiento */ } }
export const ESQUEMAS = ['simple', 'clasico', 'pro']; export const NOM_ESQ = { simple: 'SIMPLE', clasico: 'CLÁSICO', pro: 'PRO' };
export const iman = () => CTRL.esquema === 'simple' ? 1 : CTRL.esquema === 'clasico' ? 0.55 : 0;
export function aplicarLayout() { const raiz = document.getElementById('botones'); if (!raiz) return; raiz.style.setProperty('--op', CTRL.op);
  raiz.querySelectorAll('[data-b], [data-orig]').forEach((el) => { const k = el.dataset.orig || el.dataset.b; const q = CTRL.pos[k]; if (!q) return; const d = Math.round(q[2] * CTRL.esc);
    el.style.right = q[0] + 'px'; el.style.bottom = q[1] + 'px'; el.style.width = d + 'px'; el.style.height = d + 'px'; }); }
function apretar(b) { E.buf[b] = BUF; if (b in E.mant) E.mant[b] = true; if (b === 'pina' || b === 'salto') E.buf.ok = BUF; }
function soltar(b) { if (b in E.mant) E.mant[b] = false; }
export function initEntrada(raiz) {
  addEventListener('keydown', (e) => {
    if (e.repeat) { if (MAPA[e.code]) e.preventDefault(); return; }
    teclas.add(e.code); E.ultimo = 'teclado'; const b = MAPA[e.code]; if (b) { apretar(b); e.preventDefault(); }
    if (e.code === 'Backspace') E.buf.atras = BUF;
    if (e.code.startsWith('Arrow')) e.preventDefault();
  });
  addEventListener('keyup', (e) => { teclas.delete(e.code); const b = MAPA[e.code]; if (b) soltar(b); });
  addEventListener('blur', () => { teclas.clear(); for (const k in E.mant) E.mant[k] = false; });
  // ---- táctil ----
  // D-pad de 8 direcciones: la zona táctil es toda la mitad izquierda; la dirección es el sector (de 45°) del dedo respecto
  // al centro de la cruceta, así se puede deslizar entre brazos y las diagonales salen apretando entre dos brazos
  const dpad = raiz.querySelector('#dpad'), brazos = { up: dpad.querySelector('.up'), dn: dpad.querySelector('.dn'), lf: dpad.querySelector('.lf'), rt: dpad.querySelector('.rt') };
  const zona = raiz.querySelector('#zona-stick'); let tid = null, cx = 0, cy = 0; const MUERTA = 9; const DIAG = 0.36; // |sen| > 0.36 (≈21°): diagonales de ~48° (más anchas que las rectas)
  const pintar = () => { brazos.up.classList.toggle('on', E.tdy < 0); brazos.dn.classList.toggle('on', E.tdy > 0); brazos.lf.classList.toggle('on', E.tdx < 0); brazos.rt.classList.toggle('on', E.tdx > 0); };
  const dir = (t) => { const dx = t.clientX - cx, dy = t.clientY - cy; const m = Math.hypot(dx, dy); if (m < MUERTA) { E.tdx = 0; E.tdy = 0; } else { const ux = dx / m, uy = dy / m; E.tdx = Math.abs(ux) > DIAG ? Math.sign(ux) : 0; E.tdy = Math.abs(uy) > DIAG ? Math.sign(uy) : 0; }
    // si el pulgar se va lejos, la cruceta flotante lo sigue (no hace falta volver al centro)
    if (CTRL.cruceta === 'flotante' && m > 70) { const k = (m - 70) / m; cx += dx * k; cy += dy * k; ubicar(); } pintar(); };
  const tac = raiz.querySelector('#tactil') || raiz; const ubicar = () => { const r = tac.getBoundingClientRect(); dpad.style.left = Math.round(cx - r.left - 66) + 'px'; dpad.style.top = Math.round(cy - r.top - 66) + 'px'; dpad.style.bottom = 'auto'; };
  zona.addEventListener('touchstart', (e) => {
    e.preventDefault(); E.tactil = true; E.ultimo = 'tactil'; if (tid !== null) return; const t = e.changedTouches[0]; tid = t.identifier;
    if (CTRL.cruceta === 'flotante') { cx = t.clientX; cy = t.clientY; ubicar(); } else { const r = dpad.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; } dpad.classList.add('activo'); dir(t);
  }, { passive: false });
  const fin = (e) => { for (const t of e.changedTouches) if (t.identifier === tid) { tid = null; E.tdx = 0; E.tdy = 0; dpad.classList.remove('activo'); if (CTRL.cruceta === 'flotante') { dpad.style.left = dpad.style.top = dpad.style.bottom = ''; } pintar(); } };
  zona.addEventListener('touchmove', (e) => { e.preventDefault(); for (const t of e.changedTouches) if (t.identifier === tid) dir(t); }, { passive: false });
  zona.addEventListener('touchend', fin); zona.addEventListener('touchcancel', fin);
  E.dpad = dpad; aplicarLayout(); iniciarEditor(raiz);
  raiz.querySelectorAll('[data-b]').forEach((el) => {
    // el botón se lee al tocar (en la pelea cambian de función: SALTO pasa a ser SÚPER)
    let b = el.dataset.b;
    el.addEventListener('touchstart', (e) => { e.preventDefault(); if (E.editando) return; E.tactil = true; E.ultimo = 'tactil'; b = el.dataset.b; apretar(b); el.classList.add('on'); if (navigator.vibrate && b !== 'pausa') try { navigator.vibrate(8); } catch (er) { /* iOS: sin vibración */ } }, { passive: false });
    const up = (e) => { e.preventDefault(); soltar(b); el.classList.remove('on'); };
    el.addEventListener('touchend', up); el.addEventListener('touchcancel', up);
    el.addEventListener('mousedown', (e) => { e.preventDefault(); if (E.editando) return; b = el.dataset.b; apretar(b); }); el.addEventListener('mouseup', () => soltar(b));
  });
}
// toques/clicks sobre el canvas (menús) en coordenadas internas
export function registrarTap(x, y) { E.taps.push([x, y]); }
// ---- mando (Gamepad API, mapeo estándar): PS5/PS4, Xbox, MFi y genéricos; un sondeo por cuadro, sin crear objetos
// 0 A/Cruz = SALTO y aceptar · 1 B/Círculo = ESPECIAL (en menús: atrás) · 2 X/Cuadrado = PIÑA · 3 Y/Triángulo = PATADA
// 4 LB/L1 = CORRER (mantener) · 5 RB/R1 = ESPECIAL · 6 LT/L2 = AGARRE (piña+patada) · 7 RT/R2 = SÚPER · 8 Select = atrás · 9 Start = pausa
const PAD_B = ['salto', 'especial', 'pina', 'patada', 'correr', 'especial', 'agarre', 'super', 'atras', 'pausa'];
const MUERTA_PAD = 0.24;
const padPrev = new Uint8Array(4 * 20); let padN = 0;
E.pad = { conectado: false, estilo: 'xbox', id: '' };
export const estiloPad = (id) => /054c|playstation|dualsense|dualshock|ps[345]|wireless controller/i.test(id) ? 'ps' : 'xbox';
// nombre del botón de cada acción en el estilo del mando en uso (o del teclado)
const NOM = { ps: { salto: 'CRUZ', especial: 'CÍRCULO', pina: 'CUADRADO', patada: 'TRIÁNGULO', correr: 'L1', agarre: 'L2', super: 'R2', atras: 'CÍRCULO', pausa: 'OPTIONS', ok: 'CRUZ', esp2: 'R1' },
  xbox: { salto: 'A', especial: 'B', pina: 'X', patada: 'Y', correr: 'LB', agarre: 'LT', super: 'RT', atras: 'B', pausa: 'START', ok: 'A', esp2: 'RB' },
  teclado: { salto: 'L', especial: 'I', pina: 'J', patada: 'K', correr: '2 TOQUES', agarre: 'J+K', super: 'O', atras: 'ESC', pausa: 'ESC', ok: 'J', esp2: 'U' } };
NOM.tactil = { salto: 'SALTO', especial: 'ESP', pina: 'PIÑA', patada: 'PATADA', correr: 'MANTENER', agarre: 'PIÑA+PATADA', super: 'SÚPER', atras: 'II', pausa: 'II', ok: 'TOCÁ', esp2: 'ESP' };
NOM.tactilP = Object.assign({}, NOM.tactil, { pina: 'LEVE', patada: 'FUERTE', agarre: 'LEVE+FUERTE', salto: 'ARRIBA' });
export function nomBoton(acc) { const tac = E.ultimo === 'tactil' || (E.ultimo !== 'pad' && E.tactil); const t = E.ultimo === 'pad' ? NOM[E.pad.estilo] : tac ? (document.body.classList.contains('en-pelea') ? NOM.tactilP : NOM.tactil) : NOM.teclado; return t[acc] || acc; }
export const usaPad = () => E.ultimo === 'pad';
let toastEl = null, toastT = 0;
function toast(s) { if (!toastEl) { toastEl = document.createElement('div'); toastEl.id = 'toast'; document.body.appendChild(toastEl); } toastEl.textContent = s; toastEl.classList.add('ve'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('ve'), 2200); }
let clasePad = false;
function marcarPad(on) { if (on !== clasePad) { clasePad = on; document.body.classList.toggle('pad', on); } }
function hayPad() { const ps = navigator.getGamepads ? navigator.getGamepads() : null; if (ps) for (let i = 0; i < ps.length; i++) if (ps[i] && ps[i].connected !== false) return ps[i]; return null; }
addEventListener('gamepadconnected', (e) => { const g = e.gamepad || hayPad(); E.pad.conectado = true; E.pad.id = g ? g.id : ''; E.pad.estilo = estiloPad(E.pad.id); toast('Mando conectado'); });
addEventListener('gamepaddisconnected', () => { const g = hayPad(); E.pad.conectado = !!g; padPrev.fill(0); for (const k in E.mant) E.mant[k] = false; E.padCorre = false;
  if (!g) { toast('Mando desconectado'); if (E.ultimo === 'pad') { E.ultimo = E.tactil ? 'tactil' : 'teclado'; marcarPad(false); } if (globalThis.__bb && globalThis.__bb.alDesconectar) globalThis.__bb.alDesconectar(); } });
addEventListener('touchstart', () => { if (E.ultimo === 'pad') E.ultimo = 'tactil'; marcarPad(false); }, { passive: true, capture: true });
addEventListener('keydown', () => marcarPad(false), { capture: true });
// vibración opcional (golpes fuertes, definitivos): solo si el mando la soporta y se está usando
const EF = { startDelay: 0, duration: 0, weakMagnitude: 0, strongMagnitude: 0 };
export function vibrar(fuerza, ms) { if (E.ultimo === 'tactil') { if (navigator.vibrate) try { navigator.vibrate(Math.round(Math.min(40, ms * 0.3 * fuerza))); } catch (e) { /* iOS Safari: sin vibración */ } return; } if (E.ultimo !== 'pad') return; const g = hayPad(); const va = g && g.vibrationActuator; if (!va || !va.playEffect) return; EF.duration = ms; EF.weakMagnitude = Math.min(1, fuerza); EF.strongMagnitude = Math.min(1, fuerza * 0.7); try { va.playEffect(va.type || 'dual-rumble', EF).catch(() => {}); } catch (e) { /* sin vibración */ } }
function leerPads() {
  const pads = navigator.getGamepads ? navigator.getGamepads() : null; padN = 0; let dx = 0, dy = 0, uso = false; E.padCorre = false;
  if (!pads) return 0;
  for (let n = 0; n < pads.length && n < 4; n++) { const p = pads[n]; if (!p || p.connected === false) continue; padN++;
    const ax = p.axes[0] || 0, ay = p.axes[1] || 0, m = Math.sqrt(ax * ax + ay * ay);
    if (m > MUERTA_PAD) { const k = Math.min(1, (m - MUERTA_PAD) / (1 - MUERTA_PAD)) / m; dx = ax * k; dy = ay * k; uso = true; }
    const B = p.buttons, base = n * 20;
    if (B[14] && B[14].pressed) dx = -1; if (B[15] && B[15].pressed) dx = 1; if (B[12] && B[12].pressed) dy = -1; if (B[13] && B[13].pressed) dy = 1;
    if (B[12] && (B[12].pressed || B[13].pressed || B[14].pressed || B[15].pressed)) uso = true;
    for (let i = 0; i < PAD_B.length; i++) { const v = B[i] ? (B[i].pressed || B[i].value > 0.5) : false; const prev = padPrev[base + i] === 1;
      let a = PAD_B[i]; if (v) uso = true;
      if (a === 'correr') { if (v) E.padCorre = true; padPrev[base + i] = v ? 1 : 0; continue; }
      if (E.menu && (i === 1 || i === 8)) a = 'atras'; // en menús B/Círculo y Select vuelven atrás
      if (v && !prev) { if (a === 'agarre') { apretar('pina'); apretar('patada'); E.buf.ok = 0; } else if (a === 'atras') E.buf.atras = BUF; else apretar(a); }
      if (!v && prev) { if (a === 'agarre') { soltar('pina'); soltar('patada'); } else if (a !== 'atras') soltar(a); }
      padPrev[base + i] = v ? 1 : 0; }
  }
  if (uso) { if (E.ultimo !== 'pad' && !E.pad.conectado) { const g = hayPad(); E.pad.conectado = true; E.pad.id = g ? g.id : ''; E.pad.estilo = estiloPad(E.pad.id); } E.ultimo = 'pad'; marcarPad(true); E.pdx = dx; E.pdy = dy; return 1; }
  return 0;
}
export function leerEntrada() {
  let dx = 0, dy = 0;
  if (teclas.has('ArrowLeft') || teclas.has('KeyA')) dx -= 1; if (teclas.has('ArrowRight') || teclas.has('KeyD')) dx += 1;
  if (teclas.has('ArrowUp') || teclas.has('KeyW')) dy -= 1; if (teclas.has('ArrowDown') || teclas.has('KeyS')) dy += 1;
  if (E.tdx || E.tdy) { const m = Math.hypot(E.tdx, E.tdy); if (m > 0.28) { dx = E.tdx; dy = E.tdy; const k = Math.min(1, m) / m; dx *= k; dy *= k; } }
  if (leerPads() && (E.pdx || E.pdy)) { dx = E.pdx; dy = E.pdy; }
  E.dx = Math.max(-1, Math.min(1, dx)); E.dy = Math.max(-1, Math.min(1, dy));
  // doble toque horizontal = correr (el bot de pruebas no corre)
  const hx = Math.abs(E.dx) > 0.5 ? Math.sign(E.dx) : 0;
  if (hx !== hPrev) { tHx = performance.now(); if (hx) { const now = performance.now(); E.corre = hx === hUlt && now - tUlt < 280 && !(globalThis.__bb && globalThis.__bb.bot) ? hx : 0; hUlt = hx; tUlt = now; } else E.corre = 0; hPrev = hx; }
  if (hx && hx === hPrev && !E.corre && E.correMant && CTRL.esquema !== 'pro' && performance.now() - tHx > 250 && !(globalThis.__bb && globalThis.__bb.bot)) E.corre = hx; // mantener ~250 ms = correr
  if (E.padCorre && hx) E.corre = hx; else if (!E.padCorre && padCorreAnt && hx) E.corre = 0; padCorreAnt = E.padCorre;
  if (E.dpad) E.dpad.classList.toggle('corre', !!E.corre);
}
let hPrev = 0, hUlt = 0, tUlt = -1e9, padCorreAnt = false, tHx = 0;
export function consumir(b) { if (E.buf[b] > 0) { E.buf[b] = 0; return true; } return false; }
export function tickBuf(dt) { for (const k in E.buf) if (E.buf[k] > 0) E.buf[k] = Math.max(0, E.buf[k] - dt); }
// controles táctiles en modo pelea: PIÑA = LEVE, PATADA = FUERTE, ESP = ESPECIAL, SALTO → SÚPER (se salta con la cruceta arriba)
const ROT = { pina: ['PIÑA', 'LEVE'], patada: ['PATADA', 'FUERTE'], especial: ['ESP', 'ESP'], salto: ['SALTO', 'SUPER'] }; // (la fuente de los botones no tiene Ú)
export function modoPelea(on) {
  document.body.classList.toggle('en-pelea', on);
  document.querySelectorAll('#botones [data-b], #botones [data-orig]').forEach((el) => { const o = el.dataset.orig || el.dataset.b; el.dataset.orig = o; const r = ROT[o]; if (!r) return; el.textContent = r[on ? 1 : 0]; el.dataset.b = on && o === 'salto' ? 'super' : o; });
}
// ---- editor de botones táctiles (desde PAUSA → CONTROLES): arrastrar para mover, deslizadores de tamaño y opacidad
let ed = null;
function iniciarEditor(raiz) {
  const bs = raiz.querySelector('#botones'); if (!bs) return; let arr = null;
  bs.addEventListener('pointerdown', (e) => { if (!E.editando) return; const el = e.target.closest('[data-b]'); if (!el) return; e.preventDefault(); const k = el.dataset.orig || el.dataset.b; if (!CTRL.pos[k]) return;
    arr = { k, x: e.clientX, y: e.clientY, q: CTRL.pos[k].slice(), id: e.pointerId }; try { el.setPointerCapture(e.pointerId); } catch (er) { /* */ } });
  bs.addEventListener('pointermove', (e) => { if (!arr || e.pointerId !== arr.id) return; const q = CTRL.pos[arr.k]; q[0] = Math.max(0, Math.min(innerWidth * 0.5, arr.q[0] - (e.clientX - arr.x))); q[1] = Math.max(0, Math.min(innerHeight * 0.7, arr.q[1] - (e.clientY - arr.y))); aplicarLayout(); });
  const fin = () => { if (arr) { arr = null; guardarCtrl(); } }; bs.addEventListener('pointerup', fin); bs.addEventListener('pointercancel', fin);
}
export function abrirEditor(alCerrar) {
  if (ed) return; E.editando = true; document.body.classList.add('editando');
  ed = document.createElement('div'); ed.id = 'editor';
  ed.innerHTML = '<div class="tit">EDITAR BOTONES · ARRASTRALOS</div><label>TAMAÑO <input type="range" id="ed-esc" min="0.7" max="1.5" step="0.05"></label><label>OPACIDAD <input type="range" id="ed-op" min="0.2" max="0.95" step="0.05"></label><div class="fila"><button id="ed-rest">RESTABLECER</button><button id="ed-listo">LISTO</button></div>';
  document.getElementById('raiz').appendChild(ed); const esc = ed.querySelector('#ed-esc'), op = ed.querySelector('#ed-op'); esc.value = CTRL.esc; op.value = CTRL.op;
  esc.oninput = () => { CTRL.esc = +esc.value; aplicarLayout(); guardarCtrl(); }; op.oninput = () => { CTRL.op = +op.value; aplicarLayout(); guardarCtrl(); };
  ed.querySelector('#ed-rest').onclick = () => { CTRL.pos = JSON.parse(JSON.stringify(LAYOUT0)); CTRL.esc = 1; CTRL.op = 0.5; esc.value = 1; op.value = 0.5; aplicarLayout(); guardarCtrl(); };
  ed.querySelector('#ed-listo').onclick = () => cerrarEditor(alCerrar);
  for (const el of ed.querySelectorAll('button, input')) el.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
}
export function cerrarEditor(alCerrar) { if (!ed) return; ed.remove(); ed = null; E.editando = false; document.body.classList.remove('editando'); guardarCtrl(); for (const k in E.buf) E.buf[k] = 0; if (alCerrar) alCerrar(); }
