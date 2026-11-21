// Entrada unificada: teclado, joystick (Gamepad API) y controles táctiles (D-pad de 8 direcciones + botones).
// Doble toque izquierda/derecha (≤ 280 ms) = correr mientras se mantiene (E.corre = -1/1); vale para cruceta, teclado y pad.
export const E = { dx: 0, dy: 0, corre: 0, buf: { pina: 0, patada: 0, salto: 0, especial: 0, pausa: 0, ok: 0, atras: 0 }, mant: { pina: false, patada: false, salto: false, especial: false }, tactil: false, ultimo: 'teclado', taps: [] };
const teclas = new Set();
const MAPA = { KeyJ: 'pina', KeyZ: 'pina', KeyK: 'patada', KeyX: 'patada', KeyL: 'salto', Space: 'salto', KeyC: 'salto', KeyI: 'especial', KeyU: 'especial', KeyV: 'especial', Escape: 'pausa', KeyP: 'pausa', Enter: 'ok' };
const BUF = 0.16;
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
  const zona = raiz.querySelector('#zona-stick'); let tid = null, cx = 0, cy = 0; const MUERTA = 12;
  const pintar = () => { brazos.up.classList.toggle('on', E.tdy < 0); brazos.dn.classList.toggle('on', E.tdy > 0); brazos.lf.classList.toggle('on', E.tdx < 0); brazos.rt.classList.toggle('on', E.tdx > 0); };
  const dir = (t) => { const dx = t.clientX - cx, dy = t.clientY - cy; if (Math.hypot(dx, dy) < MUERTA) { E.tdx = 0; E.tdy = 0; } else { const s = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)); const a = s * Math.PI / 4; E.tdx = Math.round(Math.cos(a)); E.tdy = Math.round(Math.sin(a)); } pintar(); };
  zona.addEventListener('touchstart', (e) => {
    e.preventDefault(); E.tactil = true; E.ultimo = 'tactil'; if (tid !== null) return; const t = e.changedTouches[0]; tid = t.identifier;
    const r = dpad.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; dpad.classList.add('activo'); dir(t);
  }, { passive: false });
  const fin = (e) => { for (const t of e.changedTouches) if (t.identifier === tid) { tid = null; E.tdx = 0; E.tdy = 0; dpad.classList.remove('activo'); pintar(); } };
  zona.addEventListener('touchmove', (e) => { e.preventDefault(); for (const t of e.changedTouches) if (t.identifier === tid) dir(t); }, { passive: false });
  zona.addEventListener('touchend', fin); zona.addEventListener('touchcancel', fin);
  E.dpad = dpad;
  raiz.querySelectorAll('[data-b]').forEach((el) => {
    const b = el.dataset.b;
    el.addEventListener('touchstart', (e) => { e.preventDefault(); E.tactil = true; E.ultimo = 'tactil'; apretar(b); el.classList.add('on'); if (navigator.vibrate && b !== 'pausa') navigator.vibrate(8); }, { passive: false });
    const up = (e) => { e.preventDefault(); soltar(b); el.classList.remove('on'); };
    el.addEventListener('touchend', up); el.addEventListener('touchcancel', up);
    el.addEventListener('mousedown', (e) => { e.preventDefault(); apretar(b); }); el.addEventListener('mouseup', () => soltar(b));
  });
}
// toques/clicks sobre el canvas (menús) en coordenadas internas
export function registrarTap(x, y) { E.taps.push([x, y]); }
let padPrev = [];
export function leerEntrada() {
  let dx = 0, dy = 0;
  if (teclas.has('ArrowLeft') || teclas.has('KeyA')) dx -= 1; if (teclas.has('ArrowRight') || teclas.has('KeyD')) dx += 1;
  if (teclas.has('ArrowUp') || teclas.has('KeyW')) dy -= 1; if (teclas.has('ArrowDown') || teclas.has('KeyS')) dy += 1;
  if (E.tdx || E.tdy) { const m = Math.hypot(E.tdx, E.tdy); if (m > 0.28) { dx = E.tdx; dy = E.tdy; const k = Math.min(1, m) / m; dx *= k; dy *= k; } }
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  for (const p of pads) {
    if (!p) continue;
    const ax = p.axes[0] || 0, ay = p.axes[1] || 0;
    if (Math.hypot(ax, ay) > 0.3) { dx = ax; dy = ay; E.ultimo = 'pad'; }
    const bt = (i) => p.buttons[i] && p.buttons[i].pressed;
    if (bt(14)) dx = -1; if (bt(15)) dx = 1; if (bt(12)) dy = -1; if (bt(13)) dy = 1;
    const m = { 2: 'pina', 3: 'patada', 0: 'salto', 1: 'especial', 5: 'especial', 9: 'pausa' };
    for (const i in m) { const v = bt(+i); const prev = padPrev[p.index * 20 + +i]; if (v && !prev) { apretar(m[i]); E.ultimo = 'pad'; } if (!v && prev) soltar(m[i]); padPrev[p.index * 20 + +i] = v; }
  }
  E.dx = Math.max(-1, Math.min(1, dx)); E.dy = Math.max(-1, Math.min(1, dy));
  // doble toque horizontal = correr (el bot de pruebas no corre)
  const hx = Math.abs(E.dx) > 0.5 ? Math.sign(E.dx) : 0;
  if (hx !== hPrev) { if (hx) { const now = performance.now(); E.corre = hx === hUlt && now - tUlt < 280 && !(globalThis.__bb && globalThis.__bb.bot) ? hx : 0; hUlt = hx; tUlt = now; } else E.corre = 0; hPrev = hx; }
  if (E.dpad) E.dpad.classList.toggle('corre', !!E.corre);
}
let hPrev = 0, hUlt = 0, tUlt = -1e9;
export function consumir(b) { if (E.buf[b] > 0) { E.buf[b] = 0; return true; } return false; }
export function tickBuf(dt) { for (const k in E.buf) if (E.buf[k] > 0) E.buf[k] = Math.max(0, E.buf[k] - dt); }
