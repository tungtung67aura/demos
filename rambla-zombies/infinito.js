// Modo Infinito: oleadas sin fin y mods de armas (solo existen en este modo)
import { mezcla } from './datos.js';

export const RAREZA = { c: { nombre: 'Común', color: '#c8c8c8' }, r: { nombre: 'Rara', color: '#4aa8ff' }, l: { nombre: 'Legendaria', color: '#ffb020' } };
const FUEGO = ['pistola', 'escopeta', 'metralleta', 'rifle', 'revolver'], CUERPO = ['termo', 'bate', 'machete', 'sarten'];
const NO_ESC = ['pistola', 'metralleta', 'rifle', 'revolver'];
// f(s, n): modifica las estadísticas s (copia del arma) con n pilas del mod
export const MODS = [
  // --- para cualquier arma de fuego
  { id: 'manos', armas: FUEGO, nombre: 'Manos rápidas', desc: 'Recarga 20% más rápida', r: 'c', max: 3, f: (s, n) => { s.recarga *= 0.8 ** n; } },
  { id: 'gatillo', armas: FUEGO, nombre: 'Gatillo liviano', desc: 'Dispara 12% más rápido', r: 'c', max: 3, f: (s, n) => { s.cadencia *= 0.88 ** n; } },
  { id: 'punta', armas: FUEGO, nombre: 'Balas de punta', desc: '+15% de daño', r: 'c', max: 3, f: (s, n) => { s.dano *= 1.15 ** n; } },
  { id: 'laser', armas: NO_ESC, nombre: 'Mira láser', desc: 'Rayo rojo visible y 65% menos dispersión', r: 'c', max: 1, f: s => { s.disp *= 0.35; s.laser = true; } },
  { id: 'silen', armas: NO_ESC, nombre: 'Silenciador', desc: 'Casi no hace ruido (la horda no te oye) y fogonazo chico', r: 'c', max: 1, f: s => { s.ruido = 0.3; s.flash = 0.3; s.dano *= 0.95; s.silen = true; } },
  { id: 'incend', armas: FUEGO, nombre: 'Balas incendiarias', desc: 'Prenden fuego: 16 de daño por segundo durante 3 s', r: 'r', max: 2, f: (s, n) => { s.fuego = 16 * n; } },
  { id: 'rebote', armas: FUEGO, nombre: 'Rebote', desc: '35% de que la bala salte a otro zombi cercano', r: 'r', max: 2, f: (s, n) => { s.rebote = 0.35 + 0.25 * (n - 1); } },
  { id: 'vampiro', armas: FUEGO.concat(CUERPO), nombre: 'Colmillo de Drácula', desc: '+4 de vida por cada baja con esta arma', r: 'r', max: 3, f: (s, n) => { s.vampiro = 4 * n; } },
  { id: 'explos', armas: FUEGO, nombre: 'Balas explosivas', desc: '20% de que la baja reviente y empuje todo alrededor', r: 'l', max: 2, f: (s, n) => { s.explos = 0.2 + 0.15 * (n - 1); } },
  { id: 'cadena', armas: FUEGO, nombre: 'Descarga en cadena', desc: '22% de que un rayo salte a 3 zombis y los aturda', r: 'l', max: 2, f: (s, n) => { s.cadena = 0.22 + 0.18 * (n - 1); s.cadenaN = 3; } },
  // --- específicos
  { id: 'cargext', armas: ['pistola'], nombre: 'Cargador extendido', desc: '+60% de balas por cargador', r: 'c', max: 2, f: (s, n) => { s.cargador = Math.round(s.cargador * 1.6 ** n); s.cargExt = n; } },
  { id: 'rafaga', armas: ['pistola'], nombre: 'Kit de ráfaga', desc: 'Ráfaga: la pistola dispara más del doble de rápido y patea menos', r: 'l', max: 1, f: s => { s.auto = true; s.cadencia = Math.min(s.cadencia, 0.12); s.retroceso *= 0.6; } },
  { id: 'perdig', armas: ['escopeta'], nombre: 'Más perdigones', desc: '+4 perdigones por tiro', r: 'c', max: 2, f: (s, n) => { s.perdigones += 4 * n; } },
  { id: 'choke', armas: ['escopeta'], nombre: 'Choke ajustado', desc: '40% menos dispersión y 35% más alcance', r: 'c', max: 1, f: s => { s.disp *= 0.6; s.alcance *= 1.35; s.choke = true; } },
  { id: 'cartuch', armas: ['escopeta'], nombre: 'Cartuchera', desc: '+4 cartuchos por carga y más reserva', r: 'c', max: 2, f: (s, n) => { s.cargador += 4 * n; s.reserva += 12 * n; } },
  { id: 'dragon', armas: ['escopeta'], nombre: 'Aliento de dragón', desc: 'Cartuchos de fuego: 25 por segundo y el caño al rojo', r: 'l', max: 1, f: s => { s.fuego = (s.fuego || 0) + 25; s.dragon = true; } },
  { id: 'tambor', armas: ['metralleta'], nombre: 'Cargador de tambor', desc: 'El doble de balas, recarga un poco más lenta', r: 'r', max: 1, f: s => { s.cargador *= 2; s.reserva = Math.round(s.reserva * 1.5); s.recarga *= 1.25; s.tambor = true; } },
  { id: 'estab', armas: ['metralleta', 'rifle'], nombre: 'Estabilizador', desc: '55% menos retroceso y 40% menos dispersión', r: 'c', max: 1, f: s => { s.retroceso *= 0.45; s.disp *= 0.6; s.estab = true; } },
  { id: 'rapida', armas: ['revolver'], nombre: 'Cargador rápido', desc: 'Recarga el tambor en la mitad de tiempo', r: 'c', max: 1, f: s => { s.recarga *= 0.45; s.rapida = true; } },
  { id: 'hueca', armas: ['revolver'], nombre: 'Punta hueca', desc: '+25% de daño, +70% de empuje y atraviesa uno más', r: 'r', max: 2, f: (s, n) => { s.dano *= 1.25 ** n; s.empuje = (s.empuje || 1) * 1.7 ** n; s.atraviesa = (s.atraviesa || 1) + n; } },
  { id: 'suerte', armas: ['revolver'], nombre: 'Seis de la suerte', desc: 'La última bala del tambor hace triple daño y siempre revienta', r: 'l', max: 1, f: s => { s.suerte = true; s.dorado = true; } },
  { id: 'perfo', armas: ['rifle'], nombre: 'Bala perforante', desc: 'Atraviesa a 3 zombis más', r: 'r', max: 1, f: s => { s.atraviesa = (s.atraviesa || 3) + 3; } },
  { id: 'cerrojo', armas: ['rifle'], nombre: 'Cerrojo aceitado', desc: 'Dispara 30% más rápido', r: 'c', max: 2, f: (s, n) => { s.cadencia *= 0.7 ** n; } },
  // --- cuerpo a cuerpo
  { id: 'pesado', armas: CUERPO, nombre: 'Más pesado', desc: '+30% de daño y +50% de empuje, un poco más lento', r: 'c', max: 2, f: (s, n) => { s.dano *= 1.3 ** n; s.empuje *= 1.5 ** n; s.cadencia *= 1.1 ** n; s.escala = 1 + 0.15 * n; } },
  { id: 'largo', armas: CUERPO, nombre: 'Brazo largo', desc: 'Más alcance y un arco más ancho', r: 'c', max: 2, f: (s, n) => { s.alcance += 0.5 * n; s.arco += 0.12 * n; } },
  { id: 'llamas', armas: CUERPO, nombre: 'Prendido fuego', desc: 'Cada golpe prende fuego (22 por segundo)', r: 'r', max: 1, f: s => { s.fuego = 22; s.llamas = true; } },
  { id: 'electro', armas: CUERPO, nombre: 'Electrificado', desc: 'Cada golpe descarga un rayo a 2 zombis cercanos', r: 'l', max: 1, f: s => { s.cadena = 1; s.cadenaN = 2; s.electro = true; } },
  // --- del jugador (siempre hay algo para elegir)
  { id: 'chivito', armas: ['*'], nombre: 'Chivito canadiense', desc: '+20 de vida máxima y te cura entero', r: 'c', max: 5 },
  { id: 'chaleco', armas: ['*'], nombre: 'Chaleco de feria', desc: '+50 de blindaje', r: 'c', max: 9 },
  { id: 'mate', armas: ['*'], nombre: 'Mate cebado', desc: 'Te regenerás 1 de vida por segundo', r: 'r', max: 3 }
];
export const SINERGIAS = [
  { id: 'napalm', req: ['incend', 'explos'], nombre: 'Napalm', desc: 'Las explosiones prenden fuego a los que agarra' },
  { id: 'tormenta', req: ['rebote', 'cadena'], nombre: 'Tormenta', desc: 'Cada rebote también descarga un rayo' },
  { id: 'fantasma', req: ['laser', 'silen'], nombre: 'Fantasma', desc: 'Tiros a la cabeza: +60% de daño' }
];
export const MOD = id => MODS.find(m => m.id === id);

// estadísticas efectivas de un arma con sus mods (mods = { idMod: pilas })
export function calcular(base, mods) {
  const s = { ...base, ruido: 1, flash: 1, escala: 1, sinergias: [] };
  if (!mods) return s;
  for (const k in mods) { const m = MOD(k); if (m && m.f) m.f(s, mods[k]); }
  for (const g of SINERGIAS) if (g.req.every(r => mods[r])) s.sinergias.push(g.id);
  if (s.sinergias.includes('fantasma')) s.cabeza = 1.6;
  if (s.sinergias.includes('tormenta')) s.tormenta = true;
  if (s.sinergias.includes('napalm')) s.napalm = true;
  return s;
}

// 3 opciones para elegir: sorteo con peso por rareza (la legendaria sale más en oleadas altas)
export function ofrecer(armas, mods, oleada, n = 3, rnd = Math.random) {
  const pool = [];
  for (const m of MODS) {
    const destinos = m.armas[0] === '*' ? ['*'] : m.armas.filter(a => armas.includes(a));
    for (const a of destinos) {
      const ya = (mods[a] && mods[a][m.id]) || 0; if (ya >= m.max) continue;
      const w = m.r === 'c' ? 60 : m.r === 'r' ? 24 + oleada * 0.6 : 5 + oleada * 0.5;
      pool.push({ mod: m.id, arma: a, w: a === '*' ? w * 0.5 : w, pilas: ya });
    }
  }
  const out = [];
  while (out.length < n && pool.length) {
    let t = 0; for (const p of pool) t += p.w;
    let r = rnd() * t, k = 0; for (; k < pool.length - 1; k++) { r -= pool[k].w; if (r <= 0) break; }
    const e = pool.splice(k, 1)[0]; out.push(e);
    for (let i = pool.length - 1; i >= 0; i--) if (pool[i].mod === e.mod) pool.splice(i, 1); // no el mismo mod dos veces
  }
  return out;
}

// oleadas: cada vez más, más duros y con jefes cada 5
export function cantidadInf(n) { return n % 5 === 0 ? 12 + n : Math.min(70, 6 + n * 3); }
export function jefeInf(n) { return n % 10 === 5 ? 'patovica' : n % 10 === 0 ? 'cerro' : null; }
export function vidaInf(n) { return 1 + (n - 1) * 0.08 + Math.max(0, n - 10) ** 1.5 * 0.02; }
export const EVENTOS = {
  niebla: { nombre: 'Niebla del Río', sub: 'No se ve nada. Escuchá' },
  estampida: { nombre: 'Estampida', sub: 'Vienen corriendo' },
  gritones: { nombre: 'Noche de Gritones', sub: 'Te van a escuchar desde Pocitos' },
  pesados: { nombre: 'Los Pesados', sub: 'Tanques y explosivos' }
};
export function eventoInf(n) { if (n < 6 || n % 3 !== 0 || n % 5 === 0) return null; const k = Object.keys(EVENTOS); return k[(n / 3 + Math.floor(n / 7)) % k.length | 0]; }
export function mezclaInf(n, ev) {
  const m = mezcla(Math.min(n, 10)), x = Math.max(0, n - 10);
  m.corredor += x * 0.6; m.tanque += x * 0.2; m.explosivo += x * 0.25; m.griton += x * 0.15; m.escupidor += x * 0.2;
  if (ev === 'estampida') m.corredor *= 4;
  if (ev === 'gritones') m.griton = (m.griton + 2) * 4;
  if (ev === 'pesados') { m.tanque *= 3; m.explosivo *= 3; }
  return m;
}
