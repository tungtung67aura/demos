// HUD con el layout de la referencia: retrato + nombre + puntaje + barras HP/MANO, BONUS, VIDAS, TIEMPO, COMBO.
import { P as PROG } from './progreso.js';
import { texto, CONTORNO } from './pixel.js';
import { ITEMS } from './datos.js';
import { iconoNivel } from './mapa.js';

function barra(x, bx, by, w, h, v, c1, c2, fondo = '#2a1830') {
  x.fillStyle = CONTORNO; x.fillRect(bx - 1, by - 1, w + 2, h + 2); x.fillStyle = fondo; x.fillRect(bx, by, w, h);
  const ww = Math.round(w * Math.max(0, Math.min(1, v)));
  x.fillStyle = c1; x.fillRect(bx, by, ww, h); x.fillStyle = c2; x.fillRect(bx, by, ww, 1);
  x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(bx, by + h - 1, ww, 1);
}
// placa del HUD: fondo oscuro translúcido con contorno y filete claro arriba (lee bien sobre cualquier fachada)
function placa(x, px, py, pw, ph) { x.fillStyle = 'rgba(16,9,24,0.72)'; x.fillRect(px + 1, py, pw - 2, ph); x.fillRect(px, py + 1, pw, ph - 2); x.fillStyle = 'rgba(255,255,255,0.08)'; x.fillRect(px + 1, py, pw - 2, 1); x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(px + 1, py + ph - 1, pw - 2, 1); }
let fantasma = 1, fantasmaJ = null; // la vida perdida se vacía de a poco (franja clara detrás de la barra)
export function dibujarHUD(x, g, W, H, tactil, oculto = false) {
  const j = g.j; const sp = j.sp;
  placa(x, 1, 1, 174, j.arma ? 60 : 50);
  { const cx0 = Math.max(220, Math.round(W * 0.42)); placa(x, cx0 - 30, 1, 130, 33); }
  // retrato
  x.fillStyle = CONTORNO; x.fillRect(3, 3, 34, 34); x.fillStyle = '#5a3a6a'; x.fillRect(4, 4, 32, 32); x.fillStyle = '#7a4a7a'; x.fillRect(4, 4, 32, 10);
  x.drawImage(sp.retrato, 5, 5, 30, 30); x.fillStyle = 'rgba(255,220,140,0.35)'; x.fillRect(4, 4, 32, 1);
  texto(x, j.nombre, 41, 4, '#ffd23a', 1, 'izq', CONTORNO, '#8a5a10');
  texto(x, String(g.puntos).padStart(6, '0'), 170, 4, '#ffd23a', 1, 'der', CONTORNO, '#8a5a10');
  const v = Math.max(0, j.hp / j.hpMax); if (fantasmaJ !== j || v > fantasma) { fantasma = v; fantasmaJ = j; } else fantasma = Math.max(v, fantasma - 0.004);
  texto(x, 'HP', 41, 15, '#5ab4ff', 1); barra(x, 60, 15, 110, 7, fantasma, '#e8e0f0', '#ffffff'); { const ww = Math.round(110 * v); x.fillStyle = '#2f8af0'; x.fillRect(60, 15, ww, 7); x.fillStyle = '#9ad4ff'; x.fillRect(60, 15, ww, 1); x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(60, 21, ww, 1); }
  x.fillStyle = 'rgba(16,9,24,0.55)'; for (let q = 1; q < 10; q++) x.fillRect(60 + q * 11, 15, 1, 7); // marcas cada 10%
  if (j.hp / j.hpMax < 0.3 && Math.floor(g.t * 4) % 2) { x.fillStyle = 'rgba(255,60,60,0.5)'; x.fillRect(60, 15, Math.round(110 * j.hp / j.hpMax), 7); }
  texto(x, 'MANO', 41, 25, '#ffd23a', 1); barra(x, 75, 25, 95, 6, j.mano / 100, '#f0c020', '#fff0a0');
  if (j.mano >= 100) { const b = 0.35 + 0.35 * Math.sin(g.t * 8); x.fillStyle = `rgba(255,255,220,${b.toFixed(2)})`; x.fillRect(75, 25, 95, 6); if (Math.floor(g.t * 5) % 2) texto(x, '¡LISTA!', 122, 24, '#ffffff', 1, 'centro'); }
  const bonus = 100 + Math.min(14, g.combo) * 50;
  if (g.plataNivel) texto(x, '$U ' + (PROG.plata + g.plataNivel.enemigos + g.plataNivel.objetos), 170, 39, '#7aff7a', 1, 'der', CONTORNO, '#1a5a1a');
  texto(x, 'BONUS', 4, 39, '#c8b8d8', 1); texto(x, bonus + '%', 48, 39, bonus > 100 ? '#ffd23a' : '#ffffff', 1, 'izq', CONTORNO, bonus > 100 ? '#8a5a10' : null);
  // arma en mano
  if (j.arma) { const d = ITEMS[j.arma.t]; texto(x, d.nombre, 4, 50, '#c8ffc8', 1);
    if (d.municion) texto(x, '×' + j.arma.mun, 170, 50, '#ffffff', 1, 'der');
    else if (d.dur > 1) { const n = Math.min(18, d.dur), k = Math.ceil(j.arma.dur / d.dur * n); for (let i = 0; i < n; i++) { x.fillStyle = CONTORNO; x.fillRect(170 - (n - i) * 5, 51, 4, 6); x.fillStyle = i < k ? (k <= n * 0.3 ? '#ff6a4a' : '#8ae08a') : '#3a2a4a'; x.fillRect(171 - (n - i) * 5, 52, 2, 4); } } }
  // vidas y tiempo
  const cx = Math.max(220, Math.round(W * 0.42));
  texto(x, 'VIDAS', cx, 4, '#e8e8f0', 1, 'centro'); x.drawImage(sp.retratoChico, cx - 19, 14, 13, 13); texto(x, '×' + g.vidas, cx + 8, 17, '#ffffff', 1, 'centro');
  const tx = cx + 70; const t = Math.max(0, Math.ceil(g.tiempo)); const mm = String(Math.floor(t / 60)).padStart(2, '0'), ss = String(t % 60).padStart(2, '0');
  texto(x, 'TIEMPO', tx, 4, '#e8e8f0', 1, 'centro'); texto(x, mm + ':' + ss, tx, 14, t < 30 && Math.floor(g.t * 3) % 2 ? '#ff5a5a' : '#ffffff', 2, 'centro');
  // combo
  if (g.combo >= 2) {
    const rx = W - (tactil ? 46 : 8); const pulso = g.tCombo > 2.0 ? 1 : 0;
    texto(x, 'COMBO', rx - 30, 4, '#ff3a3a', 1, 'centro', CONTORNO, '#6a0a0a');
    texto(x, String(g.combo), rx - 52 - pulso, 13 - pulso, '#ff3a3a', 2, 'der', CONTORNO, '#6a0a0a');
    texto(x, 'GOLPES', rx, 21, '#ff3a3a', 1, 'der', CONTORNO, '#6a0a0a');
  }
  // jefe
  const mini = g.miniActual && !(g.lock && g.lock.jefe) ? g.miniActual : null;
  if ((g.jefe && !g.jefe.borrar && g.lock && g.lock.jefe) || mini) {
    const e = mini || g.jefe; const w = Math.min(260, W - 80), bx = Math.round((W - w) / 2), by = H - 16;
    texto(x, (mini ? 'MINI JEFE · ' : '') + e.nombre, bx, by - 11, '#ff5a4a', 1, 'izq', CONTORNO, '#5a0a0a');
    barra(x, bx, by, w, 7, e.hp / e.hpMax, '#e8303a', '#ff9a9a');
  }
  // ¡DALE! con flecha
  if (oculto) return; // en pausa / continuar / tablero: sin carteles encima del menú
  if (g.dale > 0 && Math.floor(g.t * 4) % 2 === 0) {
    const yy = Math.round(H * 0.42);
    texto(x, '¡DALE!', W - 46, yy, '#ffd23a', 2, 'centro', CONTORNO, '#8a5a10');
    x.fillStyle = CONTORNO; x.fillRect(W - 76, yy + 22, 46, 12); x.fillStyle = '#ffd23a'; x.fillRect(W - 75, yy + 25, 32, 6);
    for (let i = 0; i < 10; i++) { x.fillStyle = CONTORNO; x.fillRect(W - 44 + i, yy + 17 + i, 1, 22 - i * 2); x.fillStyle = '#ffd23a'; if (i < 9) x.fillRect(W - 44 + i, yy + 18 + i, 1, 20 - i * 2); }
  }
  const tc = g.t - (g.t0 || 0);
  if (tc < 4.2 && g.estado === 'jugando') { // cartel de nivel (arranca cuando termina la cinemática) + objetivo
    const a = tc < 0.3 ? tc / 0.3 : tc > 3.8 ? (4.2 - tc) / 0.4 : 1; const yy = Math.round(H * 0.34), bw = Math.round(W * a);
    x.fillStyle = CONTORNO; x.fillRect(Math.round((W - bw) / 2), yy - 4, bw, 52); x.fillStyle = '#c8202a'; x.fillRect(Math.round((W - bw) / 2), yy - 2, bw, 2); x.fillRect(Math.round((W - bw) / 2), yy + 44, bw, 2);
    if (a > 0.9) { const e2 = g.nv.nombre.length * 16 > W - 16 ? 1 : 2; texto(x, 'NIVEL ' + g.nv.num, Math.round(W / 2), yy + 1, '#ffffff', 1, 'centro'); texto(x, g.nv.nombre, Math.round(W / 2), yy + 13 + (e2 === 1 ? 4 : 0), '#ffd23a', e2, 'centro', CONTORNO, '#8a5a10'); texto(x, g.nv.lugar, Math.round(W / 2), yy + 33, '#9ad4ff', 1, 'centro'); if (g.nv.objetivo) { const ow = g.nv.objetivo.length * 8 + 12; x.fillStyle = CONTORNO; x.fillRect(Math.round((W - ow) / 2), yy + 52, ow, 14); texto(x, g.nv.objetivo, Math.round(W / 2), yy + 55, '#7aff7a', 1, 'centro'); }
      const tw = g.nv.nombre.length * 8 * e2, ic = iconoNivel(g.nv.id); if (W / 2 + tw / 2 + 40 < W) { x.drawImage(ic, Math.round(W / 2 - tw / 2 - 36), yy + 9); x.drawImage(ic, Math.round(W / 2 + tw / 2 + 10), yy + 9); } }
  }
  if (g.mensaje) { const m = g.mensaje; if (Math.floor(m.t * 5) % 2 === 0) texto(x, m.txt, Math.round(W / 2), Math.round(H * 0.3), '#ffd23a', m.txt.length * 16 > W - 16 ? 1 : 2, 'centro', CONTORNO, '#8a3a10'); }
  if (g.jefeIntro > 0 && g.jefe) { // cartel del jefe: franja roja con su retrato, entra barriendo de costado
    const yy = Math.round(H * 0.3), k = g.jefeIntroMax ? Math.min(1, (g.jefeIntroMax - g.jefeIntro) / 0.25) : 1, bw = Math.round(W * Math.min(1, k));
    x.fillStyle = 'rgba(20,6,10,0.88)'; x.fillRect(Math.round((W - bw) / 2), yy - 6, bw, 44); x.fillStyle = '#e8303a'; x.fillRect(Math.round((W - bw) / 2), yy - 6, bw, 2); x.fillRect(Math.round((W - bw) / 2), yy + 36, bw, 2);
    if (k >= 1) { const nom = 'SE VIENE ' + g.jefe.nombre, ancho = Math.max(9 * 16, nom.length * 8), x0 = Math.round(W / 2 - ancho / 2) - 22;
      const r = g.jefe.sp && g.jefe.sp.retrato; if (r) { x.fillStyle = CONTORNO; x.fillRect(x0 - 2, yy - 1, 34, 34); x.fillStyle = '#5a1a22'; x.fillRect(x0 - 1, yy, 32, 32); x.drawImage(r, x0, yy + 1, 30, 30); }
      texto(x, '¡CUIDADO!', Math.round(W / 2) + 18, yy, Math.floor(g.t * 6) % 2 ? '#ff4a3a' : '#ffd23a', 2, 'centro', CONTORNO, '#5a0a0a'); texto(x, nom, Math.round(W / 2) + 18, yy + 22, '#ffffff', 1, 'centro'); } }
}
