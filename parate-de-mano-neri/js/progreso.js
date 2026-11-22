// Progresión y economía (v9): plata ($U), puntos de atributo, compras del almacén y avance de la campaña.
// Guardado versionado en 'bb-v9'. La primera vez migra el guardado viejo (bb-nivel-max / bb-ganados por índice de la
// lista vieja de 6 niveles) y le regala plata y puntos por los niveles que ya tenía ganados.
// Se siguen escribiendo bb-nivel-max / bb-ganados (en el orden viejo) para no romper nada que los lea.
import { NIVELES } from './niveles.js';

const CLAVE = 'bb-v9';
const ORDEN_VIEJO = ['cuadra', 'feria', 'avenida', 'barriosur', 'ciudadvieja', 'rambla'];
export const ATRIBUTOS = [
  { k: 'fuerza', nombre: 'FUERZA', desc: (n) => '+' + n * 7 + '% DE DAÑO Y EMPUJE', c: '#e8303a' },
  { k: 'resistencia', nombre: 'RESISTENCIA', desc: (n) => '+' + n * 8 + '% VIDA · -' + n * 3 + '% DAÑO RECIBIDO', c: '#3a9a4a' },
  { k: 'velocidad', nombre: 'VELOCIDAD', desc: (n) => '+' + n * 4 + '% AL CAMINAR · +' + n * 4 + '% AL PEGAR', c: '#2f8ad0' },
  { k: 'aguante', nombre: 'AGUANTE', desc: (n) => '+' + n * 12 + '% MANO · TE PARÁS ' + n * 6 + '% ANTES', c: '#e0a020' },
  { k: 'tecnica', nombre: 'TÉCNICA', desc: (n) => n * 5 + '% CRÍTICO (x1,6) · REMATE ' + (n >= 3 ? 'ABIERTO' : 'EN TÉC. 3'), c: '#a05ad0' },
];
export const ATR_MAX = 8;
// el almacén de Don Tito: tipo 'uso' (sirve para el próximo nivel), 'perm' (para siempre), 'arma' (arrancás con ella),
// 'mov' (movimiento nuevo), 'punto' (punto de atributo; cada uno sale más caro)
export const PRODUCTOS = [
  { id: 'estampita', nombre: 'ESTAMPITA DE SAN CONO', desc: '+1 VIDA EN EL PRÓXIMO NIVEL', precio: 450, tipo: 'uso', icono: 'estampita' },
  { id: 'yerba', nombre: 'YERBA CANARIAS 1/2 KG', desc: 'ARRANCÁS CON LA MANO LLENA', precio: 140, tipo: 'uso', icono: 'yerba' },
  { id: 'grappamiel', nombre: 'GRAPPAMIEL DEL GALLEGO', desc: '+20% DE DAÑO UN NIVEL (Y NO MANEJES)', precio: 220, tipo: 'uso', icono: 'grappamiel' },
  { id: 'chivito', nombre: 'CHIVITO CANADIENSE', desc: 'VIDA +40 EXTRA AL ARRANCAR EL NIVEL', precio: 180, tipo: 'uso', icono: 'chivito' },
  { id: 'a_botella', nombre: 'BOTELLA DE PILSEN VACÍA', desc: 'ARRANCÁS CON BOTELLA (SE ROMPE: QUEDA EL PICO)', precio: 60, tipo: 'arma', arma: 'botella', icono: 'botella' },
  { id: 'a_palo', nombre: 'PALO DE ESCOBA DE LA ABUELA', desc: 'ARRANCÁS CON PALO', precio: 90, tipo: 'arma', arma: 'palo', icono: 'palo' },
  { id: 'a_cano', nombre: 'CAÑO DE OBRA', desc: 'ARRANCÁS CON CAÑO: PESADO Y BRUTO', precio: 170, tipo: 'arma', arma: 'cano', icono: 'cano' },
  { id: 'a_faca', nombre: 'FACA DEL TÍO', desc: 'ARRANCÁS CON FACA: CORTA Y SANGRA', precio: 260, tipo: 'arma', arma: 'faca', icono: 'faca' },
  { id: 'm_barrida', nombre: 'TUTORIAL DE YOUTUBE: BARRIDA', desc: 'ABAJO/ATRÁS + PATADA: BARRIDA QUE TUMBA', precio: 380, tipo: 'mov', icono: 'tutorial' },
  { id: 'm_cabezazo', nombre: 'CLASES DE CABEZAZO (CLUB SALUS)', desc: 'AGARRADO + ESPECIAL: CABEZAZO SIN GASTAR', precio: 420, tipo: 'mov', icono: 'tutorial' },
  { id: 'p_championes', nombre: 'CHAMPIONES CON CÁMARA', desc: '+8% VELOCIDAD PARA SIEMPRE', precio: 650, tipo: 'perm', icono: 'championes' },
  { id: 'p_campera', nombre: 'CAMPERA DE CUERO DEL FERIA', desc: '-10% DAÑO RECIBIDO PARA SIEMPRE', precio: 800, tipo: 'perm', icono: 'campera' },
  { id: 'p_guantes', nombre: 'GUANTES DE ALBAÑIL', desc: '+10% DAÑO A MANO LIMPIA PARA SIEMPRE', precio: 720, tipo: 'perm', icono: 'guantes' },
  { id: 'p_termo', nombre: 'TERMO STANLEY TRUCHO', desc: 'LA COMIDA CURA +50% PARA SIEMPRE', precio: 520, tipo: 'perm', icono: 'termo' },
  { id: 'p_rinonera', nombre: 'RIÑONERA DE LA FERIA', desc: '+25% DE PLATA QUE JUNTÁS', precio: 560, tipo: 'perm', icono: 'rinonera' },
  { id: 'libreta', nombre: 'LIBRETA DE ENTRENAMIENTO', desc: '+1 PUNTO DE ATRIBUTO', precio: 400, tipo: 'punto', icono: 'libreta' },
];
export const P = load();
function base() { return { v: 9, plata: 0, puntos: 0, attr: { fuerza: 0, resistencia: 0, velocidad: 0, aguante: 0, tecnica: 0 }, perm: {}, uso: {}, arma: null, libretas: 0, ganados: [], max: 'cuadra', migrado: false }; }
function load() {
  let p = null; try { p = JSON.parse(localStorage.getItem(CLAVE) || 'null'); } catch (e) { p = null; }
  if (p && p.v === 9) { const b = base(); return Object.assign(b, p, { attr: Object.assign(b.attr, p.attr || {}) }); }
  // migración desde el guardado viejo (por índice en la lista vieja de 6 niveles)
  p = base(); p.migrado = true;
  let max = 0, gan = []; try { max = +(localStorage.getItem('bb-nivel-max') || 0); gan = JSON.parse(localStorage.getItem('bb-ganados') || '[]'); } catch (e) { /* sin almacenamiento */ }
  p.ganados = gan.map((i) => ORDEN_VIEJO[i]).filter(Boolean);
  // abierto: el mismo nivel que tenía abierto (si pasó Barrio Sur, también queda abierto el Boliche, que es nuevo)
  const idMax = ORDEN_VIEJO[Math.max(0, Math.min(5, max))]; p.max = idMax;
  p.plata = p.ganados.length * 250; p.puntos = p.ganados.length * 2;
  guardar(p); return p;
}
export function guardar(p = P) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(p));
    // compatibilidad: claves viejas en el orden viejo
    const vMax = ORDEN_VIEJO.indexOf(p.max); localStorage.setItem('bb-nivel-max', String(vMax >= 0 ? vMax : ORDEN_VIEJO.indexOf('ciudadvieja')));
    localStorage.setItem('bb-ganados', JSON.stringify(p.ganados.map((id) => ORDEN_VIEJO.indexOf(id)).filter((i) => i >= 0)));
  } catch (e) { /* sin almacenamiento */ }
}
// índices en la lista actual de niveles
export const idx = (id) => Math.max(0, NIVELES.findIndex((n) => n.id === id));
export function nivelMaxIdx() { let m = idx(P.max); for (const id of P.ganados) m = Math.max(m, Math.min(NIVELES.length - 1, idx(id) + 1)); return m; }
export function ganadosIdx() { return P.ganados.map(idx); }
export function ganarNivel(id) {
  if (!P.ganados.includes(id)) P.ganados.push(id);
  const sig = NIVELES[Math.min(NIVELES.length - 1, idx(id) + 1)].id; if (idx(sig) > idx(P.max)) P.max = sig;
}
// ---- atributos ----
export function subir(k) { if (P.puntos <= 0 || P.attr[k] >= ATR_MAX) return false; P.puntos--; P.attr[k]++; sesion[k] = (sesion[k] || 0) + 1; guardar(); return true; }
let sesion = {}; export function abrirSesion() { sesion = {}; }
export function subidos(k) { return sesion[k] || 0; }
export function bajar(k) { if (P.attr[k] <= 0 || !(sesion[k] > 0)) return false; sesion[k]--; P.attr[k]--; P.puntos++; guardar(); return true; }
// ---- almacén ----
export function precio(pr) { return pr.tipo === 'punto' ? pr.precio + P.libretas * 150 : pr.precio; }
export function estado(pr) { // 'ok' | 'tiene' | 'caro'
  if (pr.tipo === 'perm' || pr.tipo === 'mov') { if (P.perm[pr.id]) return 'tiene'; }
  if (pr.tipo === 'uso' && P.uso[pr.id]) return 'tiene';
  if (pr.tipo === 'arma' && P.arma === pr.arma) return 'tiene';
  return P.plata >= precio(pr) ? 'ok' : 'caro';
}
export function comprar(pr) {
  if (estado(pr) !== 'ok') return false; P.plata -= precio(pr);
  if (pr.tipo === 'perm' || pr.tipo === 'mov') P.perm[pr.id] = true; else if (pr.tipo === 'uso') P.uso[pr.id] = true;
  else if (pr.tipo === 'arma') P.arma = pr.arma; else if (pr.tipo === 'punto') { P.libretas++; P.puntos++; }
  guardar(); return true;
}
// ---- efectos en la partida (se leen al crear el Juego) ----
export function efectos() {
  const a = P.attr, pm = P.perm, u = P.uso;
  return {
    dmg: (1 + a.fuerza * 0.07) * (u.grappamiel ? 1.2 : 1), dmgMano: pm.p_guantes ? 1.1 : 1, kb: 1 + a.fuerza * 0.05,
    hp: 1 + a.resistencia * 0.08, def: (1 - a.resistencia * 0.03) * (pm.p_campera ? 0.9 : 1),
    vel: (1 + a.velocidad * 0.04) * (pm.p_championes ? 1.08 : 1), atk: 1 + a.velocidad * 0.04,
    mano: 1 + a.aguante * 0.12, levanta: 1 - a.aguante * 0.06,
    crit: a.tecnica * 0.05, remate: a.tecnica >= 3,
    comida: pm.p_termo ? 1.5 : 1, plata: pm.p_rinonera ? 1.25 : 1,
    barrida: !!pm.m_barrida, cabezazo: !!pm.m_cabezazo,
    vida: u.estampita ? 1 : 0, manoLlena: !!u.yerba, hpExtra: u.chivito ? 40 : 0, arma: P.arma,
  };
}
// lo de un solo uso se gasta al empezar un nivel
export function gastarUso() { P.uso = {}; P.arma = null; guardar(); }
export function sumarPlata(n) { P.plata += n; guardar(); }
export function sumarPuntos(n) { P.puntos += n; guardar(); }

// truco de prueba (modo dios): clave propia 'bb-dios', fuera de la partida y de la economía
export const DIOS = { on: (() => { try { return localStorage.getItem('bb-dios') === '1'; } catch (e) { return false; } })() };
export function alternarDios() { DIOS.on = !DIOS.on; try { localStorage.setItem('bb-dios', DIOS.on ? '1' : '0'); } catch (e) { /* sin almacenamiento */ } return DIOS.on; }
