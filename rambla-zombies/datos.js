// Datos del juego: oleadas, tienda, ventajas, logros y perfil guardado
export const OLEADAS_TOTAL = 10;

// mezcla de zombis por oleada (pesos relativos)
export function mezcla(n) {
  return {
    normal: 10,
    corredor: n >= 2 ? 2 + n * 0.8 : 0,
    gateador: n >= 3 ? 2 + n * 0.3 : 0,
    escupidor: n >= 3 ? 1 + n * 0.35 : 0,
    explosivo: n >= 4 ? 1 + n * 0.35 : 0,
    tanque: n >= 4 ? 0.5 + n * 0.25 : 0,
    griton: n >= 3 ? 0.6 + n * 0.2 : 0
  };
}
export function cantidad(n) {
  if (n === 5) return 14;          // la del Patovica: menos zombis, más jefe
  if (n === 10) return 22;         // la del Zombi del Cerro
  return 6 + n * 3;
}
export const JEFES = { 5: 'patovica', 10: 'cerro' };

// mejoras de armas: 3 niveles cada una
export const MEJORAS = {
  dano: { nombre: 'Daño', desc: '+20% de daño', base: 120, max: 3, cuerpo: true },
  cargador: { nombre: 'Cargador', desc: '+30% de balas por cargador', base: 100, max: 3, cuerpo: false },
  recarga: { nombre: 'Recarga', desc: '20% más rápida', base: 90, max: 3, cuerpo: false },
  cadencia: { nombre: 'Cadencia', desc: '+15% más rápido', base: 130, max: 3, cuerpo: true }
};
export const PRECIO_TIER = { pistola: 1, escopeta: 1.4, metralleta: 1.7, rifle: 2, termo: 0.8, bate: 1, machete: 1.2, sarten: 1.1 };
export const precioMejora = (arma, clave, nivel) => Math.round(MEJORAS[clave].base * (PRECIO_TIER[arma] || 1) * (nivel + 1) / 10) * 10;

export const EQUIPO = [
  { id: 'chaleco', nombre: 'Chaleco', desc: '+50 de blindaje (máx. 100). Frena el 60% del daño.', precio: 150 },
  { id: 'chivito', nombre: 'Chivito al pan', desc: 'Vida completa. Con huevo y todo.', precio: 90 },
  { id: 'balas', nombre: 'Cajón de balas', desc: 'Llena la reserva de todas tus armas.', precio: 60 }
];

export const VENTAJAS = [
  { id: 'mate', nombre: 'Mate amargo', desc: 'Te movés 15% más rápido.', precio: 300 },
  { id: 'garra', nombre: 'Garra charrúa', desc: '+35% de daño y empuje cuerpo a cuerpo.', precio: 300 },
  { id: 'manos', nombre: 'Manos rápidas', desc: 'Recargás 30% más rápido.', precio: 350 },
  { id: 'ojo', nombre: 'Ojo de halcón', desc: '+50% de daño a la cabeza.', precio: 400 },
  { id: 'corazon', nombre: 'Corazón de tablado', desc: '+25 de vida máxima.', precio: 400 }
];

export const PESOS = { normal: 10, corredor: 14, gateador: 12, escupidor: 20, explosivo: 18, tanque: 40, griton: 16, patovica: 300, cerro: 1000 };

export const LOGROS = [
  { id: 'primera', nombre: 'Primera sangre', desc: 'Matá tu primer zombi.' },
  { id: 'cien', nombre: 'Cien de cien', desc: '100 bajas sumando todas tus partidas.' },
  { id: 'cabezas', nombre: 'Cabecita', desc: '25 tiros a la cabeza en una partida.' },
  { id: 'ola5', nombre: 'Mitad de camino', desc: 'Sobreviví a la oleada 5.' },
  { id: 'patovica', nombre: 'Patovica afuera', desc: 'Derrotá al Patovica del Cordón.' },
  { id: 'cerro', nombre: 'El Cerro tiembla', desc: 'Derrotá al Zombi del Cerro.' },
  { id: 'amanecer', nombre: 'Amaneció', desc: 'Sobreviví hasta el amanecer.' },
  { id: 'sarten', nombre: 'Cocinero', desc: '15 bajas con la sartén en una partida.' },
  { id: 'termo', nombre: 'Cebador', desc: '10 bajas con el termo en una partida.' },
  { id: 'explosion', nombre: 'Fuegos artificiales', desc: '3 zombis con una sola explosión.' },
  { id: 'perfecta', nombre: 'Ni un rasguño', desc: 'Una oleada entera sin recibir daño.' },
  { id: 'arsenal', nombre: 'Arsenal completo', desc: 'Tené las 8 armas en una partida.' },
  { id: 'vip', nombre: 'Cliente VIP', desc: 'Gastá 3000 pesos en una partida.' },
  { id: 'pesadilla', nombre: 'Noche de terror', desc: 'Ganá en modo Pesadilla.' }
];

const CLAVE = 'rz-perfil';
export function cargarPerfil() {
  let p = {};
  try { p = JSON.parse(localStorage.getItem(CLAVE) || '{}'); } catch (e) { p = {}; }
  return Object.assign({ record: +localStorage.getItem('rz-record') || 0, mejorOleada: 0, bajas: 0, partidas: 0, victorias: 0, logros: {}, pesadilla: false, tipGiro: false, armasCamp: ['pistola', 'termo'], infArmas: ['pistola', 'termo'], inf: { mejorOleada: 0, record: 0, partidas: 0, bajas: 0 } }, p);
}
export function guardarPerfil(p) { try { localStorage.setItem(CLAVE, JSON.stringify(p)); } catch (e) { } }
