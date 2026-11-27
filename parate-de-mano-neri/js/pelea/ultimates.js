// DEFINITIVOS: superflash (corte con el retrato y el nombre) + una escena propia por luchador, con golpes programados.
// Todo en pixel art dibujado con rectángulos enteros (sin suavizado) sobre la pelea; cada escena dura ~2,4–3,2 s.
import { texto, CONTORNO } from '../pixel.js';
import { dibujarCuadro, cuadroListo, generar, sombreado } from '../sprites.js';
import { dibujarObjeto } from './objetos.js';
import { sonar } from '../audio.js';
import { SUELO } from './escenarios.js';

const R = (x, c, X, Y, w, h) => { x.fillStyle = c; x.fillRect(Math.round(X), Math.round(Y), Math.round(w), Math.round(h)); };
const S = Math.sin, PI = Math.PI;
// ---------- superflash: pantalla oscura + franja con el retrato y el nombre del definitivo
export function superflash(x, fl, W, H) { const f = fl.f, k = fl.t / fl.dur; x.fillStyle = 'rgba(8,4,20,' + Math.min(0.72, k * 4) + ')'; x.fillRect(0, 0, W, H);
  const by = Math.round(H * 0.34), bh = 64, ent = Math.min(1, k * 4); const col = f.L.color || '#ffd23a';
  R(x, CONTORNO, 0, by - 2, W, bh + 4); R(x, col, 0, by, W, bh); for (let i = -2; i < W / 16 + 2; i++) { const xx = Math.round(i * 16 + (fl.t * 260) % 16); x.fillStyle = 'rgba(255,255,255,0.12)'; for (let j = 0; j < bh; j += 2) x.fillRect(xx + j / 2, by + j, 6, 2); }
  R(x, 'rgba(0,0,0,0.35)', 0, by + bh - 10, W, 10);
  const r = f.sp.retrato; if (r) { const s = 90, px = Math.round(-s + (s + 30) * ent); x.drawImage(r, px, by + bh - s + 14, s, s); }
  texto(x, f.L.ult.nombre, Math.round(W * 0.62 - (1 - ent) * 60), by + 14, '#ffffff', 2, 'centro', CONTORNO, '#000000'); texto(x, f.L.nombre, Math.round(W * 0.62), by + 40, '#1b1220', 1, 'centro', '#ffffff');
  if (k < 0.12) { x.fillStyle = 'rgba(255,255,255,' + (0.6 - k * 5) + ')'; x.fillRect(0, 0, W, H); } }

// ---------- ayudas de dibujo
// gente de las escenas: sprites reales del juego (los mismos de la calle), oscurecidos si son fondo
const GENTE = ['buzo', 'mati', 'cacho', 'guri', 'dona', 'mozo', 'pescador', 'cuida'];
const hashC = (c) => { let h = 0; for (const ch of String(c)) h = (h * 31 + ch.charCodeAt(0)) | 0; return Math.abs(h); };
let _pe = null, _cache = {};
function spGente(k, v) { const id = k + ':' + v; if (!(id in _cache)) { try { _cache[id] = generar(k, v, null, true); } catch (e) { _cache[id] = null; } } return _cache[id]; }
export function precargarGente(pe, ids) { if (_pe !== pe) { _pe = pe; _cache = {}; } for (const id of ids) { const D = ESC[id]; if (D && D.gente) for (const [k, v] of D.gente) spGente(k, v); } }
// v12: la gente de los definitivos es SIEMPRE decorado: silueta oscura, más chica, semitransparente, detrás de los dos luchadores
// (la pelea tiene que leerse 1 contra 1; nunca pegan ni tapan). a = opacidad extra (entrada/salida).
const SILUETA = 'rgba(16,8,32,0.8)';
function persona(x, X, Y, c, alto = 40, fase = 0, brazos = 0, k = null, v = null, a = 1) {
  const h = hashC(c); const key = k || GENTE[h % GENTE.length]; const sp = spGente(key, v ?? (h >> 3) % 2);
  if (!sp || a <= 0) return; const fr = sombreado(cuadroListo(sp, 'quieto', Math.floor(fase) % 4), SILUETA);
  const bob = brazos ? Math.round(Math.abs(Math.sin(fase)) * 4) : 0; const ga = x.globalAlpha; x.globalAlpha = ga * 0.65 * Math.min(1, a);
  dibujarCuadro(x, fr, Math.round(X), Math.round(Y - bob), X < 240 ? 1 : -1, Math.max(0.4, Math.min(0.52, alto / 90 * 0.52))); x.globalAlpha = ga; }
// entra y sale en 0,3 s
const aparece = (c, dur) => Math.max(0, Math.min(1, c.t / 0.3, (dur - c.t) / 0.3));
function cara(k) { const sp = spGente(k, 0); return sp && sp.retrato; }
function vehiculo(x, X, Y, tipo, cara = 1) { // X centro, Y piso
  const T = { taxi: { w: 96, h: 30, c: '#f2c21b', c2: '#1b1220', techo: 'TAXI' }, auto: { w: 96, h: 30, c: '#d8dce4', c2: '#7a8090' }, bondi: { w: 190, h: 62, c: '#e8eef4', c2: '#2a5ab0', techo: '121' }, moto: { w: 46, h: 22, c: '#c8202a', c2: '#2a2a2a' } }[tipo];
  const w = T.w, h = T.h, x0 = X - w / 2;
  if (tipo === 'moto') { R(x, CONTORNO, x0 + 4, Y - 18, 38, 10); R(x, T.c, x0 + 6, Y - 17, 34, 7); for (const ox of [8, 36]) { R(x, CONTORNO, x0 + ox - 7, Y - 14, 14, 14); R(x, '#3a3a44', x0 + ox - 5, Y - 12, 10, 10); R(x, '#9a9aa8', x0 + ox - 1, Y - 8, 2, 2); } R(x, '#e8a020', x0 + (cara > 0 ? 2 : 30), Y - 34, 14, 14); R(x, CONTORNO, x0 + (cara > 0 ? 2 : 30), Y - 34, 14, 2); return; }
  R(x, CONTORNO, x0 - 1, Y - h - 1, w + 2, h - 6); R(x, T.c, x0, Y - h, w, h - 8); R(x, T.c2, x0, Y - h * 0.45, w, 3);
  if (tipo === 'bondi') { for (let i = 0; i < 6; i++) R(x, '#4a6a8a', x0 + 10 + i * 29, Y - h + 6, 22, 18); R(x, '#f2c21b', x0 + (cara > 0 ? w - 30 : 8), Y - h - 8, 22, 8); texto(x, T.techo, x0 + (cara > 0 ? w - 19 : 19), Y - h - 8, '#1b1220', 1, 'centro', '#f2c21b'); R(x, '#2a5ab0', x0, Y - 22, w, 6); }
  else { R(x, CONTORNO, x0 + 18, Y - h - 13, w - 36, 14); R(x, T.c, x0 + 20, Y - h - 12, w - 40, 12); R(x, '#5a7a9a', x0 + 24, Y - h - 10, 22, 9); R(x, '#5a7a9a', x0 + 50, Y - h - 10, 22, 9);
    if (tipo === 'taxi') { R(x, CONTORNO, X - 12, Y - h - 20, 24, 8); R(x, '#fff0a0', X - 11, Y - h - 19, 22, 6); texto(x, 'TAXI', X, Y - h - 21, '#1b1220', 1, 'centro', '#fff0a0'); for (let i = 0; i < 12; i++) R(x, i % 2 ? '#1b1220' : '#f2c21b', x0 + i * 8, Y - h * 0.45 - 3, 8, 3); } }
  R(x, cara > 0 ? '#fff6c0' : '#ff3a2a', x0 + (cara > 0 ? w - 5 : 0), Y - h * 0.7, 5, 5); R(x, cara > 0 ? '#ff3a2a' : '#fff6c0', x0 + (cara > 0 ? 0 : w - 5), Y - h * 0.7, 5, 5);
  for (const ox of tipo === 'bondi' ? [30, w - 34] : [20, w - 20]) { R(x, CONTORNO, x0 + ox - 9, Y - 16, 18, 16); R(x, '#2a2a30', x0 + ox - 7, Y - 14, 14, 14); R(x, '#9a9aa8', x0 + ox - 2, Y - 9, 4, 4); } }
function lineasVel(x, W, H, t, c = 'rgba(255,255,255,0.5)') { for (let i = 0; i < 14; i++) { const y = (i * 37 + 13) % H, l = 40 + (i * 53) % 90, xx = ((i * 97 - t * 900) % (W + 200) + W + 200) % (W + 200) - 100; R(x, c, xx, y, l, 1); } }
function velo(x, W, H, c) { x.fillStyle = c; x.fillRect(0, 0, W, H); }
function rafaga(f, t, rate = 12) { const ks = ['m_l', 'm_h', 'm_l', 'm_firma']; const k = Math.floor(t * rate); return [ks[k % 4], 1]; }
function cerca(c) { const f = c.f, op = c.op; f.x = op.x - f.cara * (f.anchoC + op.anchoC + 16); }
function grande(x, s, X, Y, c, e = 3, sb = '#3a0a0a') { texto(x, s, Math.round(X), Math.round(Y), c, e, 'centro', CONTORNO, sb); }
// ---------- escenas
// cada una: dur, golpes [[t, fracción, opciones]], ini(c), fondo(x, c), frente(x, c), pose(c) → [anim, cuadro]
const ESC = {
  candombe: { gente: [['tambor', 0], ['tambor', 1]], dur: 2.9, golpes: [[0.5, 0.12, { sfx: 'pelea.ult.tambor' }], [0.8, 0.12, { sfx: 'pelea.ult.tambor' }], [1.1, 0.12, { sfx: 'pelea.ult.tambor' }], [1.4, 0.14, { sfx: 'pelea.ult.tambor' }], [2.2, 0.5, { temblor: 0.6, hitstop: 0.2 }]], ini: cerca,
    fondo(x, c) { velo(x, c.W, c.H, 'rgba(30,10,30,0.55)'); for (let i = 0; i < 3; i++) { const X = c.sx(c.op) + (i - 1) * 64 + 40 * -c.f.cara; persona(x, X, c.suelo - 46, 'tambor' + i, 90, c.t * 8 + i, 1, 'tambor', i % 2, aparece(c, 2.9)); } },
    frente(x, c) { if (c.t < 0.5) grande(x, 'CANDOMBE', c.W / 2, 40, '#ffd23a', 2); if (c.t > 2.15) { grande(x, '¡PÁRATE DE MANO!', c.W / 2, 50, '#ffffff', 2); if (c.t < 2.35) velo(x, c.W, c.H, 'rgba(255,255,255,0.6)'); } },
    pose: (c) => (c.t > 2.0 ? ['m_s2', 1] : c.t > 0.45 ? rafaga(c.f, c.t, 8) : ['m_ult', 0]) },
  puerta: { dur: 2.8, golpes: [[0.6, 0.15], [0.95, 0.15], [1.3, 0.2], [2.1, 0.5, { temblor: 0.5, hitstop: 0.18 }]], ini: cerca,
    fondo(x, c) { const X = c.sx(c.op) + c.f.cara * 40, Y = c.suelo; velo(x, c.W, c.H, 'rgba(10,6,20,0.6)'); R(x, CONTORNO, X - 34, Y - 110, 68, 110); R(x, '#3a2030', X - 30, Y - 106, 60, 106); R(x, '#5a3048', X - 26, Y - 100, 24, 96); R(x, '#5a3048', X + 2, Y - 100, 24, 96);
      const on = (c.t * 9 | 0) % 5 !== 0; R(x, CONTORNO, X - 46, Y - 132, 92, 18); texto(x, 'LA CUEVA', X, Y - 128, on ? '#ff5ac8' : '#5a2a4a', 1, 'centro', on ? '#ffffff' : CONTORNO); for (const d of [-44, 44]) { R(x, '#c8a040', X + d - 2, Y - 34, 4, 34); } R(x, '#a8141a', X - 42, Y - 30, 84, 3); },
    frente(x, c) { if (c.t > 1.5 && c.t < 2.8) { const k = Math.min(1, (c.t - 1.5) * 4); const e = Math.max(2, Math.round(5 - k * 3)); grande(x, 'LISTA NEGRA', c.W / 2, 60, '#ff2a2a', e, '#3a0000'); } },
    pose: (c) => (c.t > 1.9 ? ['m_s2', 1] : rafaga(c.f, c.t, 6)) },
  barra: { gente: [['buzo', 0], ['buzo', 1], ['mati', 0], ['mati', 1], ['cacho', 0], ['cacho', 1]], dur: 2.8, golpes: [[0.9, 0.12], [1.1, 0.12], [1.3, 0.12], [1.5, 0.12], [1.7, 0.12], [2.1, 0.4, { temblor: 0.4 }]],
    ini: cerca,
    fondo(x, c) { velo(x, c.W, c.H, 'rgba(20,10,20,0.45)'); const X = c.sx(c.op), Y = c.suelo - 46; const k = Math.min(1, c.t / 0.6);
      for (let i = 0; i < 6; i++) { const lado = i % 2 ? 1 : -1; const px = X + lado * (150 + (i >> 1) * 40) + lado * 80 * (1 - k); persona(x, px, Y, 'barra' + i, 80, c.t * 12 + i, 1, ['buzo', 'mati', 'cacho'][i % 3], i % 2, aparece(c, 2.8)); } },
    frente(x, c) { if (c.t > 0.3 && c.t < 2.2) texto(x, '¡LA BARRA ALIENTA!', c.W / 2, 44, '#ffd23a', 2, 'centro', CONTORNO, '#5a3a10'); },
    pose: (c) => (c.t > 2.0 ? ['m_firma', 1] : c.t > 0.8 ? rafaga(c.f, c.t, 10) : ['burla' in c.f.sp.poses ? 'burla' : 'quieto', (c.t * 3 | 0) % 2]) },
  espejo: { dur: 2.7, golpes: [[0.7, 0.18], [1.1, 0.18], [1.5, 0.18], [2.1, 0.46, { temblor: 0.4 }]], ini: cerca, tapa: true,
    fondo(x, c) { R(x, '#1a2a3a', 0, 0, c.W, c.H); for (let i = 0; i < 7; i++) { const px = i * c.W / 7; R(x, '#9ad8f0', px + 2, 20, c.W / 7 - 4, c.H - 60); R(x, '#c8ecff', px + 6, 24, 6, c.H - 70); }
      const fr = sombreado(cuadroListo(c.f.sp, 'gana', 0), 'rgba(120,200,240,0.6)'); for (let i = 0; i < 7; i += 2) { x.globalAlpha = 0.3; dibujarCuadro(x, fr, i * c.W / 7 + c.W / 14, c.suelo - 46, i % 4 ? -1 : 1, 0.6); x.globalAlpha = 1; } /* reflejos en los espejos, no luchadores */
      for (let i = 0; i < 10; i++) { const a = c.t * 3 + i * 0.7; R(x, '#ffffff', (i * 61 + c.t * 40) % c.W, 30 + (i * 37) % (c.H - 80), 2 + (S(a) > 0.6 ? 2 : 0), 2); } },
    frente(x, c) { if (c.t > 2.0) grande(x, 'QUÉ FACHA', c.W / 2, 44, '#e8c840', 3); },
    pose: (c) => (c.t > 1.9 ? ['m_h', 1] : rafaga(c.f, c.t, 6)) },
  taxi: { dur: 2.6, golpes: [[1.05, 0.55, { temblor: 0.5, sfx: 'pelea.ult.choque' }], [1.95, 0.45, { temblor: 0.4, sfx: 'pelea.ult.choque' }]],
    fondo(x, c) { velo(x, c.W, c.H, 'rgba(10,6,20,0.35)'); lineasVel(x, c.W, c.H, c.t); },
    frente(x, c) { const X0 = c.sx(c.op), Y = c.suelo; const d = -c.f.cara; let vx; if (c.t < 1.4) vx = X0 + d * (-500 + 470 * (c.t / 1.05)); else vx = X0 - d * (-500 + 470 * ((c.t - 1.4) / 0.55)); vehiculo(x, vx, Y, 'taxi', c.t < 1.4 ? d : -d); if (c.t < 0.5) grande(x, '¡TAXI!', c.W / 2, 40, '#f2c21b', 3); if (c.t > 2.0) grande(x, 'BAJADA DE BANDERA', c.W / 2, 44, '#ffffff', 2); },
    pose: (c) => ['m_ult', (c.t * 4 | 0) % 2] },
  moto: { dur: 2.7, golpes: [[0.6, 0.2], [1.1, 0.2], [1.6, 0.2], [2.2, 0.4, { temblor: 0.4 }]],
    fondo(x, c) { velo(x, c.W, c.H, 'rgba(10,6,20,0.35)'); lineasVel(x, c.W, c.H, c.t, 'rgba(255,220,120,0.5)'); },
    frente(x, c) { const X = c.sx(c.op), Y = c.suelo; if (c.t < 1.9) { const k = (c.t % 0.5) / 0.5, dir = (c.t / 0.5 | 0) % 2 ? 1 : -1; vehiculo(x, X + dir * (-300 + 600 * k), Y, 'moto', dir); } else { const k = Math.min(1, (c.t - 1.9) / 0.3); R(x, CONTORNO, X - 24, Y - 160 + 110 * k, 48, 40); R(x, '#e8a020', X - 22, Y - 158 + 110 * k, 44, 36); texto(x, 'PEDIDO', X, Y - 146 + 110 * k, '#1b1220', 1, 'centro', '#e8a020'); }
      if (c.t > 2.2) grande(x, '¡PEDIDO GRANDE!', c.W / 2, 44, '#e8a020', 2); }, pose: (c) => ['m_s1', 1] },
  feria: { dur: 2.8, golpes: [[0.7, 0.14], [0.95, 0.14], [1.2, 0.14], [1.45, 0.14], [2.0, 0.44, { temblor: 0.5 }]],
    fondo(x, c) { velo(x, c.W, c.H, 'rgba(10,20,10,0.35)'); },
    frente(x, c) { const X = c.sx(c.op), Y = c.suelo; for (let i = 0; i < 8; i++) { const t0 = 0.3 + i * 0.2; if (c.t < t0) continue; const k = Math.min(1, (c.t - t0) / 0.35); const px = X + ((i * 17) % 40) - 20, py = Y - 220 + 190 * k - (i % 3) * 10; R(x, CONTORNO, px - 15, py - 11, 30, 22); R(x, '#a87a40', px - 14, py - 10, 28, 20); R(x, '#7a5a30', px - 14, py - 4, 28, 2); R(x, ['#d8282a', '#f08a20', '#4aa03a', '#f2c21b'][i % 4], px - 10, py - 14, 20, 5); }
      if (c.t < 0.6) grande(x, 'LIQUIDACIÓN', c.W / 2, 40, '#4aa03a', 2); if (c.t > 1.9) { R(x, CONTORNO, c.W / 2 - 60, 60, 120, 30); R(x, '#fff0a0', c.W / 2 - 58, 62, 116, 26); texto(x, '¡TODO A $100!', c.W / 2, 70, '#d8282a', 1, 'centro', '#fff0a0'); } }, pose: (c) => ['m_s1', (c.t * 4 | 0) % 2] },
  diarios: { dur: 2.8, golpes: [[0.5, 0.1], [0.75, 0.1], [1.0, 0.1], [1.25, 0.1], [1.5, 0.1], [2.1, 0.5, { temblor: 0.4 }]],
    fondo(x, c) { velo(x, c.W, c.H, 'rgba(20,20,30,0.45)'); },
    frente(x, c) { const X = c.sx(c.op), Y = c.suelo - 50; for (let i = 0; i < 16; i++) { const a = c.t * 7 + i * 0.4, r = 20 + (i % 4) * 12 - Math.min(1, c.t) * 6; dibujarObjeto(x, 'diario', X + Math.cos(a) * r, Y + S(a) * r * 0.5 - (i % 5) * 10, a, 1); }
      if (c.t > 1.9) { const k = Math.min(1, (c.t - 1.9) * 5); R(x, CONTORNO, c.W / 2 - 150 * k, 30, 300 * k, 46); R(x, '#f2f0e8', c.W / 2 - 148 * k, 32, 296 * k, 42); if (k >= 1) { texto(x, 'EXTRA · EXTRA', c.W / 2, 36, '#1b1220', 1, 'centro', '#f2f0e8'); texto(x, 'PALIZA EN EL BARRIO', c.W / 2, 50, '#1b1220', 2, 'centro', '#f2f0e8'); } } }, pose: (c) => rafaga(c.f, c.t, 10) },
  rampa: { dur: 2.6, golpes: [[1.5, 0.4, { temblor: 0.4 }], [1.7, 0.3], [2.0, 0.3, { temblor: 0.3 }]],
    ini(c) { c.x0 = c.f.x; }, fondo(x, c) { velo(x, c.W, c.H, 'rgba(10,20,30,0.4)'); const X = c.sx(c.op) - c.f.cara * 120, Y = c.suelo; x.fillStyle = CONTORNO; for (let i = 0; i < 40; i++) { const h = i * 1.2; R(x, '#8a8a98', X + c.f.cara * (i - 20) * 1.5, Y - h, 2, h); } },
    frente(x, c) { if (c.t > 0.5 && c.t < 1.5) { const k = (c.t - 0.5) / 1.0; c.f.z = S(k * PI) * 120; c.f.x = c.x0 + (c.op.x - c.x0) * k; dibujarObjeto(x, 'skate', c.sx(c.f), c.suelo - c.f.z + 4, k * 8, c.f.cara, 2); } else { c.f.z = 0; }
      if (c.t > 1.8) grande(x, '¡RAMPA DEL RODÓ!', c.W / 2, 44, '#2a8a6a', 2); }, pose: (c) => (c.t > 0.5 && c.t < 1.5 ? ['m_la', 1] : ['m_ha', 1]) },
  antiguo: { dur: 3.0, golpes: [[0.6, 0.1], [0.9, 0.1], [1.2, 0.1], [1.5, 0.1], [1.8, 0.1], [2.4, 0.5, { temblor: 0.6, hitstop: 0.2 }]], ini: cerca, gris: true,
    fondo() {}, frente(x, c) { for (let i = 0; i < 6; i++) R(x, 'rgba(255,255,255,0.25)', ((i * 113 + (c.t * 60 | 0) * 37) % c.W), 0, 1, c.H); R(x, 'rgba(0,0,0,0.35)', 0, 0, c.W, 14); R(x, 'rgba(0,0,0,0.35)', 0, c.H - 14, c.W, 14); if (c.t < 0.6) grande(x, 'MONTEVIDEO, 1974', c.W / 2, 40, '#e8e0c8', 2, '#000'); if (c.t > 2.3) grande(x, 'LA VIEJA ESCUELA', c.W / 2, 44, '#ffffff', 2, '#000'); },
    pose: (c) => (c.t > 2.2 ? ['m_firma', 1] : rafaga(c.f, c.t, 7)) },
  eructo: { dur: 2.6, golpes: [[1.0, 0.25, { temblor: 0.3 }], [1.4, 0.25, { temblor: 0.3 }], [1.8, 0.5, { temblor: 0.6 }]],
    fondo(x, c) { velo(x, c.W, c.H, 'rgba(30,40,10,0.35)'); }, frente(x, c) { const X = c.sx(c.f) + c.f.cara * 20, Y = c.suelo - 70; if (c.t > 0.8) for (let i = 0; i < 5; i++) { const r = ((c.t - 0.8) * 260 + i * 40) % 300; x.strokeStyle = 'rgba(160,220,80,' + Math.max(0, 1 - r / 300) + ')'; x.lineWidth = 3; x.beginPath(); x.ellipse(X, Y, r, r * 0.6, 0, -0.9, 0.9); if (c.f.cara < 0) { x.beginPath(); x.ellipse(X, Y, r, r * 0.6, 0, PI - 0.9, PI + 0.9); } x.stroke(); }
      for (let i = 0; i < 10; i++) { const k = (c.t * 0.8 + i * 0.1) % 1; R(x, '#c8e8a0', X + c.f.cara * k * 200, Y - 20 + S(i * 2 + c.t * 6) * 20, 3, 3); } if (c.t > 0.8) grande(x, '¡BUAAAARP!', c.W / 2, 44, '#a8d850', 3, '#2a3a0a'); }, pose: (c) => ['m_s2', 1] },
  pesa: { dur: 2.7, golpes: [[1.2, 0.5, { temblor: 0.6, hitstop: 0.18 }], [1.9, 0.5, { temblor: 0.6, hitstop: 0.18 }]],
    fondo(x, c) { velo(x, c.W, c.H, 'rgba(20,10,10,0.4)'); }, frente(x, c) { const X = c.sx(c.op), Y = c.suelo; let k = c.t < 1.2 ? c.t / 1.2 : c.t < 1.5 ? 1 - (c.t - 1.2) / 0.3 * 0.6 : c.t < 1.9 ? 0.4 + (c.t - 1.5) / 0.4 * 0.6 : 1; const py = Y - 260 + 220 * k;
      R(x, CONTORNO, X - 90, py - 3, 180, 6); R(x, '#c8c8d0', X - 88, py - 2, 176, 4); for (const d of [-1, 1]) { R(x, CONTORNO, X + d * 70 - 12, py - 26, 24, 52); R(x, '#2a2a34', X + d * 70 - 10, py - 24, 20, 48); texto(x, '200', X + d * 70, py - 4, '#ffd23a', 1, 'centro'); }
      if (c.t > 1.9) grande(x, 'DÍA DE PIERNAS', c.W / 2, 44, '#f2c21b', 2); }, pose: (c) => ['gana', 0] },
  sirena: { dur: 2.7, golpes: [[0.6, 0.15], [0.9, 0.15], [1.2, 0.15], [1.5, 0.15], [2.1, 0.4, { temblor: 0.4 }]], ini: cerca,
    fondo(x, c) { const on = (c.t * 8 | 0) % 2; velo(x, c.W, c.H, on ? 'rgba(200,20,30,0.28)' : 'rgba(20,60,220,0.28)'); },
    frente(x, c) { const on = (c.t * 8 | 0) % 2; R(x, on ? '#ff2a2a' : '#2a6aff', 0, 0, c.W, 6); R(x, on ? '#2a6aff' : '#ff2a2a', 0, c.H - 6, c.W, 6); if (c.t > 1.8) { for (let i = -1; i < c.W / 24 + 1; i++) R(x, i % 2 ? '#1b1220' : '#f2c21b', i * 24 + ((c.t * 60) % 24), 52, 24, 12); texto(x, 'NO PASAR · POLICÍA', c.W / 2, 54, '#ffffff', 1, 'centro'); } if (c.t < 0.6) grande(x, '¡OPERATIVO!', c.W / 2, 30, '#ffffff', 2); }, pose: (c) => rafaga(c.f, c.t, 8) },
  furia: { dur: 2.7, golpes: [[0.4, 0.07], [0.55, 0.07], [0.7, 0.07], [0.85, 0.07], [1.0, 0.07], [1.15, 0.07], [1.3, 0.07], [1.45, 0.07], [2.0, 0.44, { temblor: 0.6, hitstop: 0.2 }]], ini: cerca,
    fondo(x, c) { velo(x, c.W, c.H, 'rgba(160,10,10,' + (0.3 + S(c.t * 20) * 0.1) + ')'); }, frente(x, c) { const fr = cuadroListo(c.f.sp, 'm_h', 1); for (let i = 1; i < 4; i++) { x.globalAlpha = 0.3 / i; dibujarCuadro(x, fr, c.sx(c.f) - c.f.cara * i * 10, c.suelo, c.f.cara); } x.globalAlpha = 1; if (c.t > 1.9) grande(x, '¡SE PUDRIÓ TODO!', c.W / 2, 44, '#ff3a2a', 2); }, pose: (c) => (c.t > 1.9 ? ['m_firma', 1] : rafaga(c.f, c.t, 16)) },
  parlantes: { dur: 2.8, golpes: [[0.6, 0.14], [0.9, 0.14], [1.2, 0.14], [1.5, 0.14], [2.1, 0.44, { temblor: 0.5 }]],
    fondo(x, c) { velo(x, c.W, c.H, 'rgba(10,10,40,0.55)'); const b = 1 + Math.abs(S(c.t * 12)) * 0.12; for (const X of [40, c.W - 40]) { R(x, CONTORNO, X - 26, c.suelo - 130, 52, 130); R(x, '#2a2a34', X - 24, c.suelo - 128, 48, 126); for (const [yy, r] of [[-96, 16], [-40, 20]]) { const rr = r * b; R(x, '#4a4a58', X - rr, c.suelo + yy - rr, rr * 2, rr * 2); R(x, '#1a1a22', X - rr / 2, c.suelo + yy - rr / 2, rr, rr); } } },
    frente(x, c) { for (let i = 0; i < 8; i++) { const k = (c.t * 1.2 + i / 8) % 1; dibujarObjeto(x, 'nota', 40 + (c.sx(c.op) - 40) * k, c.suelo - 96 + S(k * PI * 2) * 20, 0, 1, 2); } if (c.t < 0.6) grande(x, 'BATALLA DE GALLOS', c.W / 2, 34, '#5ad8ff', 2); if (c.t > 2.0) grande(x, '¡TIEMPO!', c.W / 2, 44, '#ffd23a', 3); }, pose: (c) => ['gana', (c.t * 4 | 0) % 2] },
  parrilla: { dur: 2.8, golpes: [[0.8, 0.15, { sfx: 'pelea.ult.fuego' }], [1.1, 0.15, { sfx: 'pelea.ult.fuego' }], [1.4, 0.15, { sfx: 'pelea.ult.fuego' }], [2.0, 0.55, { temblor: 0.5 }]], ini: cerca,
    fondo(x, c) { velo(x, c.W, c.H, 'rgba(40,10,0,0.45)'); const X = c.sx(c.op), Y = c.suelo; R(x, CONTORNO, X - 70, Y - 8, 140, 8); for (let i = 0; i < 14; i++) R(x, '#5a5a64', X - 66 + i * 10, Y - 60, 3, 54); R(x, '#5a5a64', X - 68, Y - 60, 136, 3); },
    frente(x, c) { const X = c.sx(c.op), Y = c.suelo; for (let i = 0; i < 18; i++) { const h = 20 + Math.abs(S(c.t * 13 + i * 1.7)) * 40; R(x, i % 2 ? '#ff8a20' : '#ffd040', X - 60 + i * 7, Y - h, 5, h); R(x, '#ff3a20', X - 60 + i * 7, Y - h * 0.4, 5, h * 0.4); }
      for (let i = 0; i < 5; i++) { const k = (c.t * 0.9 + i * 0.2) % 1; dibujarObjeto(x, 'chorizo', X - 50 + i * 25, Y - 40 - S(k * PI) * 90, k * 6, 1); } if (c.t > 1.9) grande(x, '¡ASADO COMPLETO!', c.W / 2, 44, '#ff8a20', 2); }, pose: (c) => rafaga(c.f, c.t, 6) },
  terremoto: { dur: 2.7, golpes: [[0.7, 0.25, { temblor: 0.6 }], [1.3, 0.25, { temblor: 0.6 }], [1.9, 0.5, { temblor: 0.8 }]],
    fondo(x, c) { velo(x, c.W, c.H, 'rgba(30,20,10,0.35)'); }, frente(x, c) { const Y = c.suelo; let px = 0, py = Y + 2; x.fillStyle = CONTORNO; for (let i = 0; i < 40; i++) { const nx = px + 14, ny = Y + 2 + ((i * 7) % 5) - 2; R(x, '#1b1220', px, Math.min(py, ny), 14, 3); px = nx; py = ny; }
      for (let i = 0; i < 6; i++) { const k = ((c.t - 0.6) * 2 + i * 0.17) % 1; if (c.t < 0.6) break; R(x, '#7a6a5a', c.sx(c.op) - 60 + i * 24, Y - S(k * PI) * 60, 8, 7); } if (c.t > 1.8) grande(x, 'TERREMOTO', c.W / 2, 44, '#c8a070', 3); }, pose: (c) => ['m_lc' in c.f.sp.poses ? 'm_s2' : 'quieto', 1] },
  diana: { dur: 2.8, golpes: [[0.9, 0.2], [1.3, 0.2], [1.7, 0.2], [2.2, 0.4, { temblor: 0.5 }]],
    fondo(x, c) { velo(x, c.W, c.H, 'rgba(20,30,10,0.45)'); }, frente(x, c) { const X = c.sx(c.op), Y = c.suelo; for (let i = 0; i < 3; i++) { const t0 = 0.6 + i * 0.4; if (c.t < t0) continue; const k = Math.min(1, (c.t - t0) / 0.25); const py = Y - 200 + 180 * k; R(x, CONTORNO, X - 40 + i * 30, py - 40, 26, 46); R(x, '#2a2a20', X - 38 + i * 30, py - 38, 22, 42); R(x, '#2a2a20', X - 38 + i * 30, py, 34, 10); }
      for (let i = 0; i < 5; i++) dibujarObjeto(x, 'nota', c.sx(c.f) + c.f.cara * (20 + ((c.t * 80 + i * 30) % 150)), Y - 90 - i * 6, 0, 1); if (c.t < 0.7) grande(x, '¡TOQUE DE DIANA!', c.W / 2, 36, '#c8d870', 2); if (c.t > 2.1) grande(x, '¡A FORMAR!', c.W / 2, 44, '#ffffff', 3); }, pose: (c) => ['gana', 0] },
  surtidor: { dur: 2.8, golpes: [[0.8, 0.1], [1.0, 0.1], [1.2, 0.1], [2.0, 0.6, { temblor: 0.7, hitstop: 0.2, sfx: 'pelea.ult.explosion' }]],
    fondo(x, c) { velo(x, c.W, c.H, 'rgba(10,10,30,0.35)'); const X = c.sx(c.f) - c.f.cara * 40, Y = c.suelo; R(x, CONTORNO, X - 16, Y - 80, 32, 80); R(x, '#c8202a', X - 14, Y - 78, 28, 76); R(x, '#f2f2ee', X - 10, Y - 70, 20, 14); texto(x, 'SÚPER', X, Y - 68, '#c8202a', 1, 'centro', '#f2f2ee'); },
    frente(x, c) { const X = c.sx(c.f) + c.f.cara * 20, Y = c.suelo - 60, T = c.sx(c.op); if (c.t > 0.6 && c.t < 1.7) for (let i = 0; i < 20; i++) { const k = i / 20; R(x, i % 2 ? '#f2d21b' : '#9ad8f0', X + (T - X) * k, Y + S(k * PI) * -16 + S(c.t * 30 + i) * 2, 6, 4); }
      if (c.t > 1.9 && c.t < 2.6) { const r = (c.t - 1.9) * 260; R(x, '#fff0a0', T - r / 2, c.suelo - 60 - r / 3, r, r * 0.66); R(x, '#ff8a20', T - r / 3, c.suelo - 60 - r / 4.5, r * 0.66, r * 0.44); } if (c.t > 2.0) grande(x, 'SÚPER SIN PLOMO', c.W / 2, 40, '#ff5a2a', 2); }, pose: (c) => ['m_s2', 1] },
  auto: { dur: 2.6, golpes: [[1.3, 0.6, { temblor: 0.6, sfx: 'pelea.ult.choque' }], [1.6, 0.4, { temblor: 0.3 }]],
    fondo(x, c) { velo(x, c.W, c.H, 'rgba(10,6,20,0.3)'); }, frente(x, c) { const X = c.sx(c.op), Y = c.suelo, d = c.f.cara; const k = Math.min(1, c.t / 1.3); vehiculo(x, X + d * (300 - 250 * k), Y, 'auto', -d); if (c.t < 1.3) texto(x, '¡DALE, DALE, DALE!', c.sx(c.f), Y - 110, '#ffd23a', 1, 'centro'); if (c.t > 1.4 && (c.t * 8 | 0) % 2) texto(x, '¡UIIIU UIIIU!', X + d * 60, Y - 70, '#ff3a2a', 1, 'centro');
      if (c.t > 1.6) grande(x, 'LUGAR LIBRE', c.W / 2, 44, '#f08a20', 3); }, pose: (c) => ['burla' in c.f.sp.poses ? 'burla' : 'quieto', (c.t * 6 | 0) % 2] },
  pizza: { dur: 2.7, golpes: [[0.9, 0.3, { temblor: 0.4 }], [1.3, 0.2], [2.0, 0.5, { temblor: 0.6 }]],
    fondo(x, c) { velo(x, c.W, c.H, 'rgba(40,20,0,0.35)'); }, frente(x, c) { const X = c.sx(c.op), Y = c.suelo; const k = Math.min(1, c.t / 0.9); const r = 60; const py = Y - 300 + 260 * k; R(x, CONTORNO, X - r - 2, py - 12, r * 2 + 4, 24); R(x, '#e8b040', X - r, py - 10, r * 2, 20); R(x, '#f2d21b', X - r + 6, py - 8, r * 2 - 12, 14); for (let i = 0; i < 8; i++) R(x, '#c8202a', X - r + 12 + i * 14, py - 6 + (i % 2) * 6, 7, 5);
      if (c.t > 1.5) { const k2 = Math.min(1, (c.t - 1.5) / 0.5); const fy = Y - 260 + 220 * k2; R(x, CONTORNO, X - 32, fy - 16, 64, 32); R(x, '#e8a840', X - 30, fy - 14, 60, 28); R(x, '#c87a20', X - 30, fy + 6, 60, 8); texto(x, 'FAINÁ', X, fy - 6, '#5a3010', 1, 'centro', '#e8a840'); }
      if (c.t > 2.0) grande(x, '¡PIZZA FAMILIAR!', c.W / 2, 40, '#ffd23a', 2); }, pose: (c) => ['m_s1', 1] },
  vecinos: { gente: [['dona', 0], ['cacho', 0], ['mati', 0], ['buzo', 0], ['mozo', 0], ['pescador', 0]], dur: 2.8, golpes: [[0.7, 0.12], [0.9, 0.12], [1.1, 0.12], [1.3, 0.12], [1.5, 0.12], [2.0, 0.4, { temblor: 0.4 }]], tapa: false,
    fondo(x, c) { velo(x, c.W, c.H, 'rgba(10,6,20,0.45)'); for (let i = 0; i < 6; i++) { const X = 30 + i * (c.W - 60) / 5; R(x, CONTORNO, X - 17, 47, 34, 32); R(x, '#f2d88a', X - 15, 49, 30, 28); R(x, '#8a5a32', X - 19, 79, 38, 3); const rr = cara(['dona', 'cacho', 'mati', 'buzo', 'mozo', 'pescador'][i]); if (rr) x.drawImage(rr, Math.round(X - 13), 50 - ((c.t * 6 + i | 0) % 2) * 2, 26, 26); } },
    frente(x, c) { const objs = ['chancleta', 'botella', 'tomate', 'chancleta', 'diario', 'tuerca']; for (let i = 0; i < 12; i++) { const t0 = 0.3 + i * 0.12; if (c.t < t0) continue; const k = Math.min(1, (c.t - t0) / 0.4); const X0 = 30 + (i % 6) * (c.W - 60) / 5, X = X0 + (c.sx(c.op) - X0) * k; const Y = 70 + (c.suelo - 120) * k; if (k < 1) dibujarObjeto(x, objs[i % 6], X, Y, k * 10, 1); }
      if (c.t > 1.9) grande(x, '¡CACEROLAZO!', c.W / 2, 60, '#ffd23a', 3); }, pose: (c) => ['m_s2', 1] },
  duende: { dur: 3.0, golpes: [[0.8, 0.12, { sfx: 'pelea.ult.palmas' }], [1.1, 0.12, { sfx: 'pelea.ult.palmas' }], [1.4, 0.12, { sfx: 'pelea.ult.palmas' }], [1.7, 0.12, { sfx: 'pelea.ult.palmas' }], [2.4, 0.52, { temblor: 0.5 }]], ini: cerca,
    fondo(x, c) { velo(x, c.W, c.H, 'rgba(6,2,10,0.75)'); const X = c.sx(c.f); x.fillStyle = 'rgba(255,240,200,0.16)'; x.beginPath(); x.moveTo(X - 10, 0); x.lineTo(X + 10, 0); x.lineTo(X + 70, c.suelo + 6); x.lineTo(X - 70, c.suelo + 6); x.fill(); },
    frente(x, c) { for (let i = 0; i < 18; i++) { const k = (c.t * 0.5 + i / 18) % 1; R(x, i % 3 ? '#c8202a' : '#e8506a', (i * 53 + S(c.t * 2 + i) * 20) % c.W, k * c.H, 3, 2); } const p = (c.t * 3.3 | 0) % 2; if (c.t > 0.7 && c.t < 2.2) texto(x, p ? '¡OLÉ!' : '¡ASÍ SE BAILA!', c.W / 2 + (p ? -60 : 60), 50, '#ffd23a', 1, 'centro'); if (c.t > 2.3) grande(x, 'DUENDE', c.W / 2, 40, '#e8c870', 3, '#3a0a10'); },
    pose: (c) => (c.t > 2.2 ? ['m_firma', 1] : c.t > 0.7 ? ['m_s2', (c.t * 6 | 0) % 2 ? 1 : 0] : ['gana', 0]) },
  cocina: { dur: 2.9, golpes: [[0.6, 0.1], [0.8, 0.1], [1.0, 0.1], [1.2, 0.1], [1.6, 0.15, { sfx: 'pelea.ult.fuego' }], [2.2, 0.45, { temblor: 0.4 }]], ini: cerca, tapa: true,
    fondo(x, c) { for (let j = 0; j < c.H; j += 16) for (let i = 0; i < c.W; i += 16) R(x, ((i + j) / 16) % 2 ? '#e8e8e0' : '#c8d8e0', i, j, 16, 16); R(x, '#6a6a74', 0, c.suelo - 60, c.W, 6); R(x, '#8a8a94', 0, c.suelo - 54, c.W, 54); R(x, '#3a3a44', 0, c.suelo, c.W, c.H - c.suelo);
      R(x, CONTORNO, 0, c.suelo - 150, c.W, 3); R(x, '#9aa0a8', 0, c.suelo - 147, c.W, 4); for (let i = 0; i < 7; i++) { const X = 40 + i * (c.W - 80) / 6; R(x, '#5a5a64', X, c.suelo - 147, 1, 12); dibujarObjeto(x, i % 2 ? 'cucharon' : 'sarten', X, c.suelo - 128 + S(c.t * 3 + i) * 2, 1.57, 1); }
      for (let i = 0; i < 4; i++) { const X = 60 + i * (c.W - 120) / 3; R(x, CONTORNO, X - 18, c.suelo - 72, 36, 14); R(x, '#b8b8c0', X - 17, c.suelo - 71, 34, 12); for (let j = 0; j < 3; j++) R(x, 'rgba(240,240,250,0.35)', X - 8 + j * 7, c.suelo - 90 - ((c.t * 30 + j * 9 + i * 5) % 26), 4, 6); } },
    frente(x, c) { for (let i = 0; i < 6; i++) { const k = (c.t * 1.6 + i / 6) % 1; if (c.t > 1.4) break; dibujarObjeto(x, 'cuchilla', c.sx(c.f) + (c.sx(c.op) - c.sx(c.f)) * k, c.suelo - 60 - i * 4, 0, c.f.cara); }
      if (c.t > 1.4 && c.t < 2.1) for (let i = 0; i < 12; i++) { const h = 20 + Math.abs(S(c.t * 16 + i)) * 40; R(x, i % 2 ? '#ff8a20' : '#ffd040', c.sx(c.op) - 30 + i * 5, c.suelo - h, 4, h); }
      if (c.t > 2.1) { grande(x, 'MENÚ DEGUSTACIÓN', c.W / 2, 34, '#1b1220', 2, '#ffffff'); texto(x, '¡BON APPÉTIT!', c.W / 2, 60, '#c8202a', 1, 'centro'); } }, pose: (c) => (c.t > 2.0 ? ['m_firma', 1] : rafaga(c.f, c.t, 10)) },
  viral: { dur: 2.8, golpes: [[0.6, 0.12], [0.9, 0.12], [1.2, 0.12], [1.5, 0.12], [2.1, 0.52, { temblor: 0.5 }]],
    fondo(x, c) { velo(x, c.W, c.H, 'rgba(40,10,40,0.35)'); }, frente(x, c) { const W = c.W, H = c.H; R(x, CONTORNO, 20, 10, W - 40, 6); R(x, CONTORNO, 20, H - 16, W - 40, 6); R(x, CONTORNO, 20, 10, 6, H - 20); R(x, CONTORNO, W - 26, 10, 6, H - 20);
      R(x, '#e8202a', 34, 22, 58, 14); texto(x, '• EN VIVO', 63, 25, '#ffffff', 1, 'centro', '#e8202a'); const likes = Math.floor(Math.min(1, c.t / 2.2) * 99999); texto(x, likes.toLocaleString('es-UY') + ' LIKES', W - 36, 25, '#ffffff', 1, 'der');
      for (let i = 0; i < 10; i++) { const k = (c.t * 0.8 + i / 10) % 1; dibujarObjeto(x, 'like', W - 60 - (i % 3) * 16, H - 30 - k * (H - 70), 0, 1); } if (c.t > 2.0) grande(x, '¡VIRAL!', W / 2, 50, '#e8458b', 4); }, pose: (c) => (c.t > 2.0 ? ['m_h', 1] : ['m_s2', (c.t * 4 | 0) % 2]) },
  bajo: { dur: 2.8, golpes: [[1.0, 0.15], [1.25, 0.15], [1.5, 0.15], [2.1, 0.55, { temblor: 0.9, hitstop: 0.25, sfx: 'pelea.ult.bajo' }]],
    fondo(x, c) { velo(x, c.W, c.H, 'rgba(40,0,70,' + (0.5 + Math.abs(S(c.t * 8)) * 0.15) + ')'); }, frente(x, c) { const X = c.sx(c.f), Y = c.suelo - 60; for (let i = 0; i < 6; i++) { const r = ((c.t * 220) + i * 50) % 330; x.strokeStyle = 'rgba(200,120,255,' + Math.max(0, 1 - r / 330) + ')'; x.lineWidth = 4; x.beginPath(); x.arc(X, Y, r, 0, 7); x.stroke(); }
      if (c.t < 2.0) texto(x, c.t < 1 ? 'BAJÁ...' : 'BAJÁ... BAJÁ...', c.W / 2, 40, '#c890ff', 2, 'centro'); else grande(x, 'DROP', c.W / 2, 40, '#ffffff', 5, '#5a2a90'); }, pose: (c) => ['gana', (c.t * 4 | 0) % 2] },
  juicio: { dur: 2.8, golpes: [[0.9, 0.3, { temblor: 0.5, sfx: 'pelea.ult.martillo' }], [1.5, 0.3, { temblor: 0.5, sfx: 'pelea.ult.martillo' }], [2.1, 0.4, { temblor: 0.7, sfx: 'pelea.ult.martillo' }]], tapa: true,
    fondo(x, c) { for (let i = 0; i < c.W; i += 24) { R(x, '#5a3a20', i, 0, 24, c.suelo); R(x, '#4a2e18', i + 22, 0, 2, c.suelo); } R(x, '#3a2414', 0, c.suelo - 70, c.W, 70); R(x, '#2a1a10', 0, c.suelo, c.W, c.H - c.suelo); R(x, '#c8a040', c.W / 2 - 30, 20, 60, 30); texto(x, 'JUZGADO', c.W / 2, 31, '#3a2414', 1, 'centro', '#c8a040'); },
    frente(x, c) { const X = c.sx(c.op), Y = c.suelo; const ph = [0.9, 1.5, 2.1]; let k = 0; for (const p of ph) { const d = c.t - (p - 0.35); if (d > 0 && d < 0.5) k = d < 0.35 ? d / 0.35 : 1 - (d - 0.35) / 0.15 * 0.6; } const py = Y - 230 + 150 * k;
      R(x, CONTORNO, X - 32, py - 22, 64, 44); R(x, '#8a5a32', X - 30, py - 20, 60, 40); R(x, '#6a4020', X - 30, py + 10, 60, 6); R(x, CONTORNO, X - 4, py - 110, 8, 90); R(x, '#a87a4a', X - 3, py - 108, 6, 88);
      if (c.t > 2.1) { R(x, '#c8202a', c.W / 2 - 120, 50, 240, 34); grande(x, 'SENTENCIA FIRME', c.W / 2, 56, '#ffffff', 2, '#5a0a0a'); } else if (c.t < 0.6) grande(x, '¡ORDEN EN LA SALA!', c.W / 2, 50, '#ffd23a', 2); }, pose: (c) => ['m_s1', 1] },
  taller: { dur: 2.8, golpes: [[0.8, 0.12], [1.05, 0.12], [1.3, 0.12], [1.55, 0.12], [2.2, 0.52, { temblor: 0.6 }]], ini: cerca,
    fondo(x, c) { velo(x, c.W, c.H, 'rgba(20,20,30,0.5)'); const X = c.sx(c.op), Y = c.suelo; const k = c.t < 1.7 ? Math.min(1, c.t / 0.6) : Math.max(0, 1 - (c.t - 1.7) / 0.4); R(x, CONTORNO, X - 40, Y - 8 - 40 * k, 80, 8); R(x, '#c8202a', X - 38, Y - 7 - 40 * k, 76, 6); for (let i = 0; i < 4; i++) R(x, '#8a8a98', X - 30 + i * 18, Y - 40 * k, 4, 40 * k); if (c.op) c.op.z = 40 * k; },
    frente(x, c) { for (let i = 0; i < 8; i++) { const a = c.t * 20 + i; R(x, '#ffe27a', c.sx(c.op) + Math.cos(a) * 26, c.suelo - 50 + S(a) * 20 - c.op.z, 2, 2); } if (c.t > 2.1) grande(x, 'SERVICE COMPLETO', c.W / 2, 44, '#9ad8f0', 2); }, pose: (c) => rafaga(c.f, c.t, 8) },
  roca: { dur: 2.7, golpes: [[1.3, 0.6, { temblor: 0.9, hitstop: 0.22, sfx: 'pelea.ult.derrumbe' }], [1.8, 0.4, { temblor: 0.5 }]],
    fondo(x, c) { velo(x, c.W, c.H, 'rgba(30,20,10,0.45)'); }, frente(x, c) { const X = c.sx(c.op), Y = c.suelo, d = c.f.cara; const k = Math.min(1, c.t / 1.3); const bx = X - d * (380 - 380 * k) + (c.t > 1.3 ? d * (c.t - 1.3) * 120 : 0), r = 52, by = Y - r;
      R(x, CONTORNO, bx - r - 2, by - r + 6, r * 2 + 4, r * 2 - 4); R(x, '#7a6a5a', bx - r, by - r + 8, r * 2, r * 2 - 8); R(x, '#9a8a78', bx - r + 10, by - r + 14, r, r * 0.6); R(x, '#5a4a3a', bx, by + 10, r * 0.8, r * 0.5); for (let i = 0; i < 5; i++) R(x, '#5a4a3a', bx - r + 8 + i * 18, by + ((i * 13 + c.t * 50 | 0) % 30) - 10, 6, 6);
      if (c.t > 1.4) grande(x, 'LA FORTALEZA', c.W / 2, 44, '#c8a070', 3); }, pose: (c) => ['gana', 0] },
  muertos: { gente: [['f_zombi', 0]], dur: 3.0, golpes: [[0.9, 0.15], [1.2, 0.15], [1.5, 0.15], [1.8, 0.15], [2.4, 0.4, { temblor: 0.5 }]], ini: (c) => { c.manos = Array.from({ length: 7 }, (_, i) => ({ dx: (i - 3) * 22, t0: 0.3 + i * 0.12 })); },
    fondo(x, c) { velo(x, c.W, c.H, 'rgba(10,30,20,0.6)'); R(x, '#e8f0d0', c.W - 70, 20, 30, 30); R(x, 'rgba(10,30,20,0.6)', c.W - 62, 18, 30, 30);
      const X = c.sx(c.op), Y = c.suelo; x.save(); x.beginPath(); x.rect(0, 0, c.W, Y - 8); x.clip();
      c.manos.forEach((m, i) => { if (c.t < m.t0 || i % 2) return; const k = Math.min(1, (c.t - m.t0) / 0.5); persona(x, X + m.dx * 2.6, Y - 20 + Math.round(70 * (1 - k)), 'z' + i, 90, c.t * 4 + i, 0, 'f_zombi', 0, aparece(c, 3.0)); }); x.restore();
      for (const m of c.manos) if (c.t >= m.t0 && c.t < m.t0 + 0.5) for (let j = 0; j < 4; j++) R(x, '#5a4a32', X + m.dx * 2.6 - 12 + j * 7, Y - 10 - ((c.t * 40 + j * 5) % 10), 3, 3); },
    frente(x, c) { const X = c.sx(c.op), Y = c.suelo; for (const m of c.manos) { if (c.t < m.t0) continue; const k = Math.min(1, (c.t - m.t0) / 0.3); const h = 34 * k; R(x, CONTORNO, X + m.dx - 4, Y - h - 1, 8, h + 1); R(x, '#8aa07a', X + m.dx - 3, Y - h, 6, h); for (let f = 0; f < 3; f++) R(x, '#8aa07a', X + m.dx - 4 + f * 3, Y - h - 5, 2, 5); }
      for (let i = 0; i < 14; i++) R(x, 'rgba(160,220,160,0.25)', ((i * 73 + c.t * 30) % (c.W + 60)) - 30, Y - 14 + (i % 3) * 6, 60, 10); if (c.t > 2.3) grande(x, 'NOCHE DE LOS MUERTOS', c.W / 2, 40, '#a8d890', 2, '#0a2a10'); }, pose: (c) => ['gana', (c.t * 2 | 0) % 2] },
  bondi: { dur: 2.6, golpes: [[1.2, 0.7, { temblor: 0.8, hitstop: 0.22, sfx: 'pelea.ult.choque' }], [1.5, 0.3]],
    fondo(x, c) { velo(x, c.W, c.H, 'rgba(10,6,20,0.35)'); lineasVel(x, c.W, c.H, c.t); }, frente(x, c) { const X = c.sx(c.op), Y = c.suelo, d = -c.f.cara; const k = c.t / 1.2; vehiculo(x, X + d * (-560 + 560 * k), Y, 'bondi', d); if (c.t < 0.6) grande(x, '¡PASE AL FONDO!', c.W / 2, 34, '#ffffff', 2); if (c.t > 1.4) grande(x, 'EL 121 SIN FRENOS', c.W / 2, 40, '#5a9aff', 2); }, pose: (c) => ['m_s2', 1] },
  tormenta: { dur: 2.8, golpes: [[0.7, 0.15], [1.0, 0.15], [1.3, 0.15], [2.0, 0.55, { temblor: 0.8, hitstop: 0.2, sfx: 'pelea.ult.rayo' }]], ini: cerca,
    fondo(x, c) { velo(x, c.W, c.H, 'rgba(10,14,30,0.6)'); for (let i = 0; i < 60; i++) R(x, 'rgba(180,200,230,0.6)', (i * 47 + c.t * 300) % c.W, (i * 31 + c.t * 900) % c.H, 1, 6); },
    frente(x, c) { if (c.t > 1.95 && c.t < 2.25) { velo(x, c.W, c.H, 'rgba(255,255,255,0.55)'); let px = c.sx(c.op), py = 0; x.fillStyle = '#ffffff'; while (py < c.suelo - 40) { const nx = px + ((py * 7) % 11) - 5, ny = py + 14; R(x, '#ffffff', Math.min(px, nx), py, Math.abs(nx - px) + 3, 15); px = nx; py = ny; } }
      if (c.t > 2.2) grande(x, 'LA RAMBLA ES MÍA', c.W / 2, 40, '#e6e0d0', 2); }, pose: (c) => rafaga(c.f, c.t, 6) },
};
// gris para la escena antigua (blanco y negro): se aplica sobre todo lo dibujado
function gris(x, W, H) { x.save(); x.globalCompositeOperation = 'saturation'; x.fillStyle = '#808080'; x.fillRect(0, 0, W, H); x.restore(); x.save(); x.globalCompositeOperation = 'multiply'; x.fillStyle = '#e8d8b8'; x.fillRect(0, 0, W, H); x.restore(); }
export const ESCENAS = Object.keys(ESC);
export function crearUlt(id, pe, f, op) {
  const D = ESC[id] || ESC.candombe; let i = 0;
  const c = { id, f, op, pe, t: 0, W: 480, H: 270, C: 0, suelo: 0, sx: (q) => Math.round(q.x - c.C), listo: false, tapaFondo: !!D.tapa };
  if (D.ini) D.ini(c); sonar('pelea.ult.' + (id === 'candombe' ? 'tambor' : 'inicio'));
  c.paso = (dt) => { c.t += dt; while (i < D.golpes.length && c.t >= D.golpes[i][0]) { const g = D.golpes[i]; pe.golpeUlt(f, op, g[1], g[2] || {}); i++; } if (c.t >= D.dur) { c.listo = true; while (i < D.golpes.length) { pe.golpeUlt(f, op, D.golpes[i][1], {}); i++; } op.z = 0; } };
  c.fondo = (x, C, off, W, H) => { c.C = C; c.W = W; c.H = H; c.suelo = off + SUELO; if (c.tapaFondo) { D.fondo(x, c); } else D.fondo(x, c); };
  c.frente = (x, C, off, W, H) => { c.C = C; c.W = W; c.H = H; c.suelo = off + SUELO; D.frente(x, c); if (D.gris) gris(x, W, H); };
  c.pose = (q) => (q === f && D.pose ? D.pose(c) : null);
  return c;
}
