// Ropa por capas: catálogos de cabeza / arriba / abajo / calzado.
// Todo es cosmético: el cuerpo (piel, pelo, contextura) es del personaje y la ropa se compone encima.
// Camisetas de clubes uruguayos: solo colores y diseño genérico (sin escudos, logos ni sponsors).
export const CABEZAS = {
  nada: { nombre: 'NADA', tipo: 'nada' },
  gorroUY: { nombre: 'GORRO CELESTE', tipo: 'lana', c1: '#2f6fc0', c2: '#e9eef5' },
  gorroCAP: { nombre: 'GORRO AURINEGRO', tipo: 'lana', c1: '#f2c21b', c2: '#141414' },
  gorroRojo: { nombre: 'GORRO ROJO', tipo: 'lana', c1: '#b8282e', c2: '#b8282e', liso: true },
  gorroGris: { nombre: 'GORRO GRIS', tipo: 'lana', c1: '#6d7078', c2: '#6d7078', liso: true },
  gorraNegra: { nombre: 'GORRA NEGRA', tipo: 'gorra', c1: '#26262c', c2: '#141418' },
  gorraCeleste: { nombre: 'GORRA CELESTE', tipo: 'gorra', c1: '#7cc4ee', c2: '#1b2a5a' },
  gorraRoja: { nombre: 'GORRA ROJA', tipo: 'gorra', c1: '#c8202a', c2: '#f2f2f2' },
  gorraCAP: { nombre: 'GORRA AMARILLA', tipo: 'gorra', c1: '#f2c21b', c2: '#141414', letra: true },
  gorraAtras: { nombre: 'GORRA AL REVÉS', tipo: 'gorra', c1: '#2a2a32', c2: '#c8202a', atras: true },
  viseraBlanca: { nombre: 'VISERA BLANCA', tipo: 'visera', c1: '#f2f2f2', c2: '#2b56c4' },
  viseraVioleta: { nombre: 'VISERA VIOLETA', tipo: 'visera', c1: '#6a2c91', c2: '#f2f2f2' },
  capucha: { nombre: 'CAPUCHA', tipo: 'capucha', c1: '#6e5a4a', npc: true },
  capuchaGris: { nombre: 'CAPUCHA GRIS', tipo: 'capucha', c1: '#5a5d66', npc: true },
};
export const ARRIBAS = {
  buzoUY: { nombre: 'BUZO URUGUAY', tipo: 'buzo', c1: '#1d2f5c', c2: '#2a4280', letras: 'URUGUAY', acento: '#e9eef5', raya: '#e9eef5' },
  canguro: { nombre: 'BUZO CANGURO', tipo: 'buzo', c1: '#8d9098', c2: '#a2a5ad', acento: '#e8e8e8' },
  buzoBordo: { nombre: 'BUZO BORDÓ', tipo: 'buzo', c1: '#6a2030', c2: '#7c2a3c', acento: '#e8e8e8' },
  campera: { nombre: 'CAMPERA DEPORTIVA', tipo: 'campera', c1: '#2b2b35', raya: '#f2c21b' },
  camperaAzul: { nombre: 'CAMPERA AZUL', tipo: 'campera', c1: '#1f2f6a', raya: '#ffffff' },
  abierta: { nombre: 'CAMPERA ABIERTA', tipo: 'abierta', c1: '#5aa83a', remera: '#f2f2f2' },
  camisetaBlanca: { nombre: 'CAMISETA LISA', tipo: 'camiseta', c1: '#ececec', cuello: '#c8c8c8' },
  camisetaNegra: { nombre: 'CAMISETA NEGRA', tipo: 'camiseta', c1: '#2b2b35', cuello: '#3a3a44' },
  musculosa: { nombre: 'MUSCULOSA', tipo: 'musculosa', c1: '#f1efe6' },
  celeste: { nombre: 'CELESTE 10', tipo: 'camiseta', c1: '#7cc4ee', cuello: '#ffffff', numero: '10', numCol: '#ffffff' },
  penarol: { nombre: 'AURINEGRA', club: 'Peñarol', tipo: 'camiseta', c1: '#f2c21b', c2: '#141414', patron: 'rayas', cuello: '#141414', manga: '#141414' },
  nacional: { nombre: 'TRICOLOR', club: 'Nacional', tipo: 'camiseta', c1: '#f4f4f4', cuello: '#1f3fa0', ribete: '#c8102e', manga: '#f4f4f4', puno: '#1f3fa0' },
  danubio: { nombre: 'FRANJA', club: 'Danubio', tipo: 'camiseta', c1: '#f4f4f4', c2: '#141414', patron: 'banda', cuello: '#141414' },
  defensor: { nombre: 'VIOLETA', club: 'Defensor Sporting', tipo: 'camiseta', c1: '#6a2c91', cuello: '#f2f2f2', ribete: '#f2f2f2', puno: '#f2f2f2' },
  wanderers: { nombre: 'BOHEMIA', club: 'Montevideo Wanderers', tipo: 'camiseta', c1: '#f2f2f2', c2: '#141414', patron: 'rayas', cuello: '#141414', manga: '#141414' },
  torque: { nombre: 'CELESTE Y MARINO', club: 'Montevideo City Torque', tipo: 'camiseta', c1: '#9ad6f4', cuello: '#1b2a5a', ribete: '#1b2a5a', puno: '#1b2a5a', hombros: '#1b2a5a' },
  saco: { nombre: 'SACO', tipo: 'saco', c1: '#7a1f24', remera: '#efe9dc', npc: true },
};
export const ABAJOS = {
  depRojo: { nombre: 'DEPORTIVO ROJO', tipo: 'deportivo', c1: '#c1272d', raya: '#ffffff' },
  depNegro: { nombre: 'DEPORTIVO NEGRO', tipo: 'deportivo', c1: '#2b2b35', raya: '#e9e9e9' },
  depAzul: { nombre: 'DEPORTIVO AZUL', tipo: 'deportivo', c1: '#1f2f6a', raya: '#7cc4ee' },
  depGris: { nombre: 'DEPORTIVO GRIS', tipo: 'deportivo', c1: '#6d7078', raya: null },
  jean: { nombre: 'JEAN', tipo: 'jean', c1: '#3f5f8f' },
  jeanOscuro: { nombre: 'JEAN OSCURO', tipo: 'jean', c1: '#2a3a5a' },
  shortNegro: { nombre: 'SHORT NEGRO', tipo: 'short', c1: '#2b2b35', raya: '#e9e9e9' },
  shortAzul: { nombre: 'SHORT AZUL', tipo: 'short', c1: '#1f3fa0', raya: '#f2f2f2' },
  shortCeleste: { nombre: 'SHORT CELESTE', tipo: 'short', c1: '#7cc4ee', raya: '#ffffff' },
  calza: { nombre: 'CALZA', tipo: 'calza', c1: '#1f1f2a', raya: '#7cc4ee' },
  vestir: { nombre: 'PANTALÓN DE VESTIR', tipo: 'vestir', c1: '#24242c', npc: true },
};
export const CALZADOS = {
  zapaUY: { nombre: 'BLANCAS Y AZULES', tipo: 'zapa', c1: '#f2f2f2', c2: '#2b56c4', suela: '#d03030' },
  zapaNegra: { nombre: 'NEGRAS', tipo: 'zapa', c1: '#26262c', c2: '#f2f2f2', suela: '#f2f2f2' },
  zapaRoja: { nombre: 'ROJAS', tipo: 'zapa', c1: '#c8202a', c2: '#f2f2f2', suela: '#f2f2f2' },
  zapaRosa: { nombre: 'BLANCAS Y ROSAS', tipo: 'zapa', c1: '#ffffff', c2: '#e8458b', suela: '#e8458b' },
  zapaGris: { nombre: 'GRISES', tipo: 'zapa', c1: '#c8c8c8', c2: '#7a7a7a', suela: '#4a4a4a' },
  zapaVerde: { nombre: 'BLANCAS Y VERDES', tipo: 'zapa', c1: '#e6e6e6', c2: '#4caf50', suela: '#666666' },
  botitas: { nombre: 'BOTITAS', tipo: 'bota', c1: '#5a3a24', c2: '#3a2416', suela: '#2a1a12' },
  ojotas: { nombre: 'OJOTAS', tipo: 'ojotas', c1: '#2f6fc0', c2: '#f2f2f2', suela: '#2f6fc0' },
  zapatos: { nombre: 'ZAPATOS', tipo: 'zapato', c1: '#1a1210', c2: '#3a2a20', suela: '#100a08', npc: true },
};
export const SLOTS = [['cabeza', 'CABEZA', CABEZAS], ['arriba', 'ARRIBA', ARRIBAS], ['abajo', 'ABAJO', ABAJOS], ['calzado', 'CALZADO', CALZADOS]];
export function opciones(slot) { const cat = SLOTS.find((s) => s[0] === slot)[2]; return Object.keys(cat).filter((k) => !cat[k].npc); }
