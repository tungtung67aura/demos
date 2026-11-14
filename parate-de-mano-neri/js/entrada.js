// Entrada unificada: teclado, joystick (Gamepad API) y controles táctiles (stick flotante + botones).
export const E = { dx: 0, dy: 0, buf: { pina: 0, patada: 0, salto: 0, especial: 0, pausa: 0, ok: 0, atras: 0 }, mant: { pina: false, patada: false, salto: false, especial: false }, tactil: false, ultimo: 'teclado', taps: [] };
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
  const stick = raiz.querySelector('#stick'), perilla = raiz.querySelector('#perilla');
  let tid = null, ox = 0, oy = 0; const R = 46;
  const zonaStick = raiz.querySelector('#zona-stick');
  zonaStick.addEventListener('touchstart', (e) => {
    e.preventDefault(); E.tactil = true; E.ultimo = 'tactil';
    const t = e.changedTouches[0]; if (tid !== null) return; tid = t.identifier; ox = t.clientX; oy = t.clientY;
    stick.style.left = ox + 'px'; stick.style.top = oy + 'px'; stick.classList.add('activo'); perilla.style.transform = 'translate(-50%,-50%)';
  }, { passive: false });
  const mover = (e) => {
    for (const t of e.changedTouches) if (t.identifier === tid) {
      let dx = t.clientX - ox, dy = t.clientY - oy; const d = Math.hypot(dx, dy);
      if (d > R) { // el stick "sigue" al dedo
        ox += dx * (1 - R / d); oy += dy * (1 - R / d); stick.style.left = ox + 'px'; stick.style.top = oy + 'px'; dx = t.clientX - ox; dy = t.clientY - oy;
      }
      E.tdx = dx / R; E.tdy = dy / R; perilla.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    }
  };
  const fin = (e) => { for (const t of e.changedTouches) if (t.identifier === tid) { tid = null; E.tdx = 0; E.tdy = 0; stick.classList.remove('activo'); } };
  zonaStick.addEventListener('touchmove', (e) => { e.preventDefault(); mover(e); }, { passive: false });
  zonaStick.addEventListener('touchend', fin); zonaStick.addEventListener('touchcancel', fin);
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
}
export function consumir(b) { if (E.buf[b] > 0) { E.buf[b] = 0; return true; } return false; }
export function tickBuf(dt) { for (const k in E.buf) if (E.buf[k] > 0) E.buf[k] = Math.max(0, E.buf[k] - dt); }
