// v9: mando (Gamepad API, mapeo estándar: Xbox, PlayStation, MFi en Safari de iPhone, genéricos).
// Juego: stick izq. moverse (L3 corre), stick der. mirar, RT tirar, LT apuntar / cargar, RB golpe rápido, B alterna cuerpo a cuerpo,
// X recargar, Y / LB cambiar arma, A interactuar, cruceta cambiar arma, Start pausa.
// Menús: cruceta o stick izq. mueven el foco (navegación espacial sobre los botones visibles), A elige, B vuelve, LB/RB cambian de pestaña.
export const BT = { A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7, SEL: 8, START: 9, LS: 10, RS: 11, ARR: 12, ABA: 13, IZQ: 14, DER: 15 };
const NOM = {
  xbox: ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'View', 'Menu', 'L3', 'R3', '↑', '↓', '←', '→'],
  ps: ['✕', '○', '□', '△', 'L1', 'R1', 'L2', 'R2', 'Share', 'Options', 'L3', 'R3', '↑', '↓', '←', '→'],
  gen: ['A', 'B', 'X', 'Y', 'L', 'R', 'ZL', 'ZR', '−', '+', 'L3', 'R3', '↑', '↓', '←', '→']
};
export function tipoDe(id = '') {
  if (/054c|playstation|dualsense|dualshock|ps4|ps5/i.test(id)) return 'ps';
  if (/xbox|xinput|045e|microsoft/i.test(id)) return 'xbox';
  if (/wireless controller/i.test(id)) return 'ps'; // así se anuncia el DualShock/DualSense en Safari
  return 'xbox'; // MFi y genéricos: letras A B X Y como el Xbox
}
let tipoAct = 'xbox';
export const glifo = b => `<span class="gl gl-${tipoAct} gl-b${b}">${NOM[tipoAct][b]}</span>`;
export const tipoMando = () => tipoAct;

export function crearMando(G) {
  const prev = new Array(17).fill(false), ahora = new Array(17).fill(false);
  let activo = false, conectado = false, idAct = '', navT = 0, navDir = '', foco = null, empuje = 0;
  const marcarTipo = gp => { const t = tipoDe(gp.id); if (t !== tipoAct || gp.id !== idAct) { tipoAct = t; idAct = gp.id; document.body.dataset.mando = t; G.cambioTipo && G.cambioTipo(t); } };
  addEventListener('gamepadconnected', e => { conectado = true; marcarTipo(e.gamepad); G.conectado && G.conectado(true, tipoAct, e.gamepad.id); });
  addEventListener('gamepaddisconnected', () => { const q = lista(); conectado = !!q; if (!q) { setActivo(false); G.conectado && G.conectado(false); } });
  const lista = () => { const L = navigator.getGamepads ? navigator.getGamepads() : []; for (const g of L) if (g && g.connected) return g; return null; };
  function setActivo(v) { if (v === activo) return; activo = v; document.body.classList.toggle('con-mando', v); G.activo && G.activo(v); if (!v) quitarFoco(); }
  // si el jugador vuelve a tocar la pantalla o usa el teclado/mouse, deja de ser "con mando"
  for (const ev of ['touchstart', 'mousedown', 'keydown']) addEventListener(ev, () => setActivo(false), { passive: true, capture: true });
  const zm = (x, y, dz) => { const l = Math.hypot(x, y); if (l < dz) return [0, 0, 0]; const k = Math.min(1, (l - dz) / (1 - dz)) / l; return [x * k, y * k, Math.min(1, (l - dz) / (1 - dz))]; };
  // ---- menús: foco espacial
  function contenedor() {
    const d = document.querySelector('#dialogo.on'); if (d) return d;
    const ps = [...document.querySelectorAll('.pantalla:not(.oculto)')]; return ps.length ? ps[ps.length - 1] : null;
  }
  function candidatos(c) {
    return [...c.querySelectorAll('button:not([disabled]), input[type=range], label:has(input[type=checkbox]), [data-foco]')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; });
  }
  function ponerFoco(e) { if (foco === e) return; if (foco) foco.classList.remove('foco-mando'); foco = e; if (e) { e.classList.add('foco-mando'); e.scrollIntoView({ block: 'nearest', inline: 'nearest' }); G.sonidoFoco && G.sonidoFoco(); } }
  function quitarFoco() { if (foco) foco.classList.remove('foco-mando'); foco = null; }
  function mover(dir) {
    const c = contenedor(); if (!c) return; const L = candidatos(c); if (!L.length) return;
    if (!foco || !L.includes(foco)) { ponerFoco(c.querySelector('button.pri:not([disabled])') && L.includes(c.querySelector('button.pri:not([disabled])')) ? c.querySelector('button.pri:not([disabled])') : L[0]); return; }
    if (foco.matches('input[type=range]') && (dir === 'izq' || dir === 'der')) { const r = foco, st = +r.step || 1; r.value = Math.max(+r.min, Math.min(+r.max, +r.value + (dir === 'der' ? st : -st))); r.dispatchEvent(new Event('input', { bubbles: true })); G.sonidoFoco && G.sonidoFoco(); return; }
    const a = foco.getBoundingClientRect(), ax = a.left + a.width / 2, ay = a.top + a.height / 2;
    const [dx, dy] = { arr: [0, -1], aba: [0, 1], izq: [-1, 0], der: [1, 0] }[dir];
    let mejor = null, mv = Infinity;
    for (const e of L) {
      if (e === foco) continue; const r = e.getBoundingClientRect(), x = r.left + r.width / 2 - ax, y = r.top + r.height / 2 - ay;
      const par = x * dx + y * dy; if (par <= 2) continue; const perp = Math.abs(x * dy - y * dx);
      const v = par + perp * 2.2; if (v < mv) { mv = v; mejor = e; }
    }
    if (mejor) ponerFoco(mejor);
  }
  function elegir() {
    const c = contenedor(); if (!c) return false;
    if (!foco || !c.contains(foco)) { mover('aba'); return true; }
    if (foco.matches('label')) { foco.querySelector('input').click(); return true; }
    if (foco.matches('input[type=range]')) return true;
    foco.click(); setTimeout(() => { if (foco && !document.body.contains(foco)) foco = null; }, 0); return true;
  }
  function volver() {
    const c = contenedor(); if (!c) return;
    const v = [...c.querySelectorAll('.volver, [data-volver]')].find(e => e.getBoundingClientRect().width > 0);
    if (v) { v.click(); return; }
    G.atras && G.atras(c.id);
  }
  // ---- cada cuadro
  function poll(dt) {
    const gp = lista(); if (!gp) { if (activo) { G.mover(0, 0); G.fuego(false); G.apuntar(false); } return; }
    if (!conectado) { conectado = true; marcarTipo(gp); }
    const bs = gp.buttons; let algo = false;
    for (let i = 0; i < 17; i++) { const b = bs[i]; ahora[i] = !!b && (b.pressed || b.value > (i === 6 || i === 7 ? 0.35 : 0.5)); if (ahora[i]) algo = true; }
    const ax = gp.axes; const [lx, ly] = zm(ax[0] || 0, ax[1] || 0, 0.18), [rx, ry, rm] = zm(ax[2] || 0, ax[3] || 0, 0.12);
    if (algo || lx || ly || rx || ry) { if (!activo) marcarTipo(gp); setActivo(true); }
    const ap = i => ahora[i] && !prev[i];
    if (activo) {
      if (G.enDialogo && G.enDialogo()) { if (ap(BT.A) || ap(BT.X) || ap(BT.RT)) G.dialogoSeguir(); if (ap(BT.START) || ap(BT.B)) G.dialogoSaltar(); }
      else if (G.enJuego()) {
        quitarFoco();
        G.mover(lx, ly, ahora[BT.LS]);
        // mirar: curva de respuesta (precisión cerca del centro) + aceleración sostenida al fondo
        if (rm > 0) { empuje = rm > 0.94 ? Math.min(1, empuje + dt * 2.2) : Math.max(0, empuje - dt * 4); const v = Math.pow(rm, 2.2) * (2.8 + empuje * 1.7); G.mirar(rx / rm * v * dt, ry / rm * v * dt, rm); }
        else { empuje = 0; G.mirar(0, 0, 0); }
        G.fuego(ahora[BT.RT]); G.apuntar(ahora[BT.LT]);
        if (ap(BT.X)) G.recargar(); if (ap(BT.Y) || ap(BT.DER) || ap(BT.ABA)) G.cambiar(1); if (ap(BT.LB) || ap(BT.IZQ) || ap(BT.ARR)) G.cambiar(-1);
        if (ap(BT.RB)) G.golpe(); if (ap(BT.B)) G.alternarMelee(); if (ap(BT.A)) G.interactuar(); if (ap(BT.START) || ap(BT.SEL)) G.pausa();
      } else if (G.enMenu()) {
        let dir = ''; if (ahora[BT.ARR] || ly < -0.6) dir = 'arr'; else if (ahora[BT.ABA] || ly > 0.6) dir = 'aba'; else if (ahora[BT.IZQ] || lx < -0.6) dir = 'izq'; else if (ahora[BT.DER] || lx > 0.6) dir = 'der';
        if (dir) { if (dir !== navDir) { navDir = dir; navT = 0.38; mover(dir); } else if ((navT -= dt) <= 0) { navT = 0.11; mover(dir); } } else navDir = '';
        if (ap(BT.A)) elegir(); if (ap(BT.B)) volver();
        if (ap(BT.LB) || ap(BT.RB)) G.pestana && G.pestana(ap(BT.RB) ? 1 : -1);
        if (ap(BT.START)) G.start && G.start();
        if (!foco || !document.body.contains(foco) || !contenedor() || !contenedor().contains(foco)) { foco = null; const c = contenedor(); if (c) mover('aba'); }
      }
    }
    for (let i = 0; i < 17; i++) prev[i] = ahora[i];
  }
  return { poll, get activo() { return activo; }, get tipo() { return tipoAct; }, quitarFoco, mover, elegir, volver };
}
