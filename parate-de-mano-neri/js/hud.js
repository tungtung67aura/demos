// HUD con el layout de la referencia: retrato + nombre + puntaje + barras HP/MANO, BONUS, VIDAS, TIEMPO, COMBO.
import { texto, CONTORNO } from './pixel.js';

function barra(x, bx, by, w, h, v, c1, c2, fondo = '#2a1830') {
  x.fillStyle = CONTORNO; x.fillRect(bx - 1, by - 1, w + 2, h + 2); x.fillStyle = fondo; x.fillRect(bx, by, w, h);
  const ww = Math.round(w * Math.max(0, Math.min(1, v)));
  x.fillStyle = c1; x.fillRect(bx, by, ww, h); x.fillStyle = c2; x.fillRect(bx, by, ww, 1);
  x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(bx, by + h - 1, ww, 1);
}
export function dibujarHUD(x, g, W, H, tactil) {
  const j = g.j; const sp = j.sp;
  // retrato
  x.fillStyle = CONTORNO; x.fillRect(3, 3, 34, 34); x.fillStyle = '#5a3a6a'; x.fillRect(4, 4, 32, 32); x.fillStyle = '#7a4a7a'; x.fillRect(4, 4, 32, 10);
  x.drawImage(sp.retrato, 5, 5, 30, 30); x.fillStyle = 'rgba(255,220,140,0.35)'; x.fillRect(4, 4, 32, 1);
  texto(x, j.nombre, 41, 4, '#ffd23a', 1, 'izq', CONTORNO, '#8a5a10');
  texto(x, String(g.puntos).padStart(6, '0'), 170, 4, '#ffd23a', 1, 'der', CONTORNO, '#8a5a10');
  texto(x, 'HP', 41, 15, '#5ab4ff', 1); barra(x, 60, 15, 110, 7, j.hp / j.hpMax, '#2f8af0', '#9ad4ff');
  if (j.hp / j.hpMax < 0.3 && Math.floor(g.t * 4) % 2) { x.fillStyle = 'rgba(255,60,60,0.5)'; x.fillRect(60, 15, Math.round(110 * j.hp / j.hpMax), 7); }
  texto(x, 'MANO', 41, 25, '#ffd23a', 1); barra(x, 75, 25, 95, 6, j.mano / 100, '#f0c020', '#fff0a0');
  if (j.mano >= 100 && Math.floor(g.t * 5) % 2) texto(x, '¡LISTA!', 121, 25, '#ffffff', 1, 'centro');
  const bonus = 100 + Math.min(14, g.combo) * 50;
  texto(x, 'BONUS', 4, 40, '#ffffff', 1); texto(x, bonus + '%', 4, 50, '#ffd23a', 1, 'izq', CONTORNO, '#8a5a10');
  // arma en mano
  if (j.arma) { texto(x, j.arma.t.toUpperCase(), 58, 40, '#c8ffc8', 1); }
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
  if (g.jefe && !g.jefe.borrar && g.lock && g.lock.jefe) {
    const e = g.jefe; const w = Math.min(260, W - 80), bx = Math.round((W - w) / 2), by = H - 16;
    texto(x, e.nombre, bx, by - 11, '#ff5a4a', 1, 'izq', CONTORNO, '#5a0a0a');
    barra(x, bx, by, w, 7, e.hp / e.hpMax, '#e8303a', '#ff9a9a');
  }
  // ¡DALE! con flecha
  if (g.dale > 0 && Math.floor(g.t * 4) % 2 === 0) {
    const yy = Math.round(H * 0.42);
    texto(x, '¡DALE!', W - 46, yy, '#ffd23a', 2, 'centro', CONTORNO, '#8a5a10');
    x.fillStyle = CONTORNO; x.fillRect(W - 76, yy + 22, 46, 12); x.fillStyle = '#ffd23a'; x.fillRect(W - 75, yy + 25, 32, 6);
    for (let i = 0; i < 10; i++) { x.fillStyle = CONTORNO; x.fillRect(W - 44 + i, yy + 17 + i, 1, 22 - i * 2); x.fillStyle = '#ffd23a'; if (i < 9) x.fillRect(W - 44 + i, yy + 18 + i, 1, 20 - i * 2); }
  }
  if (g.t < 2.6 && g.estado === 'jugando') { // cartel de nivel
    const a = g.t < 0.3 ? g.t / 0.3 : g.t > 2.2 ? (2.6 - g.t) / 0.4 : 1; const yy = Math.round(H * 0.36), bw = Math.round(W * a);
    x.fillStyle = CONTORNO; x.fillRect(Math.round((W - bw) / 2), yy - 4, bw, 40); x.fillStyle = '#c8202a'; x.fillRect(Math.round((W - bw) / 2), yy - 2, bw, 2); x.fillRect(Math.round((W - bw) / 2), yy + 32, bw, 2);
    if (a > 0.9) { texto(x, 'NIVEL 1', Math.round(W / 2), yy + 1, '#ffffff', 1, 'centro'); texto(x, g.nv.nombre, Math.round(W / 2), yy + 13, '#ffd23a', 2, 'centro', CONTORNO, '#8a5a10'); }
  }
  if (g.mensaje) { const m = g.mensaje; if (Math.floor(m.t * 5) % 2 === 0) texto(x, m.txt, Math.round(W / 2), Math.round(H * 0.3), '#ffd23a', 2, 'centro', CONTORNO, '#8a3a10'); }
  if (g.jefeIntro > 0) { texto(x, '¡CUIDADO!', Math.round(W / 2), Math.round(H * 0.3), '#ff4a3a', 2, 'centro', CONTORNO, '#5a0a0a'); texto(x, 'SE VIENE EL TANO', Math.round(W / 2), Math.round(H * 0.3) + 22, '#ffffff', 1, 'centro'); }
}
