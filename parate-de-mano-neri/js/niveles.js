// Los seis niveles: escenario, hora, obstáculos, objetos, oleadas (con mini jefes), eventos y jefe.
// Coordenadas en px del mundo (56 px = 1 m). y: 182 (contra la pared) … 266 (vereda de adelante).
// Oleada: { cam, enemigos: [[clave, variante, {mini, nombre, hp}]...], eventos: [{t, en (s), ...}], max (simultáneos) }
// Dificultad: nv.dif multiplica el daño de los enemigos y nv.cupo cuántos atacan a la vez.
const MINI = (nombre, hp = 2.4) => ({ mini: true, nombre, hp });

export const NIVELES = [
  { id: 'cuadra', num: 1, nombre: 'LA CUADRA DEL CANA', lugar: 'BARRIO · ATARDECER', escena: 'cuadra', hora: 'atardecer', L: 3400, lejos: 'ciudad', medio: 'ciudad',
    musica: 'mus.nivel1', ambiente: 'amb.cuadra', dif: 1.0, cupo: 2, max: 4, mapa: [0.28, 0.42],
    decor: [{ t: 'contenedor', x: 296, y: 192, empuja: true }, { t: 'moto', x: 610, y: 196 }, { t: 'contenedor', x: 1100, y: 192, empuja: true }, { t: 'carton', x: 760, y: 268 },
      { t: 'contenedor', x: 1520, y: 192, empuja: true }, { t: 'contenedor', x: 2250, y: 192, empuja: true }, { t: 'moto', x: 2700, y: 196 }, { t: 'contenedor', x: 3260, y: 192 }],
    rompibles: [{ t: 'cajaBiz', x: 330, y: 250, da: 'bizcochos' }, { t: 'cajon', x: 690, y: 262, da: 'botella' }, { t: 'tacho', x: 980, y: 198, da: 'palo' },
      { t: 'cajaBiz', x: 1260, y: 262, da: 'mate' }, { t: 'cajon', x: 1560, y: 258, da: 'botella' }, { t: 'tacho', x: 1820, y: 200, da: 'billete' },
      { t: 'cajaBiz', x: 2080, y: 256, da: 'chivito' }, { t: 'tacho', x: 2420, y: 198, da: 'cano' }, { t: 'cajon', x: 2560, y: 262, da: 'botella' }, { t: 'cajaBiz', x: 2860, y: 254, da: 'alfajor' }],
    items: [{ t: 'garrafa', x: 880, y: 256 }, { t: 'palo', x: 430, y: 236 }, { t: 'garrafa', x: 2290, y: 246 }, { t: 'pelota', x: 1130, y: 240 }, { t: 'termo', x: 1700, y: 250 }, { t: 'ladrillo', x: 2000, y: 210 }],
    perros: [{ x: 250, y: 252 }],
    oleadas: [
      { cam: 300, enemigos: [['buzo', 0], ['buzo', 1], ['mati', 0]] },
      { cam: 820, enemigos: [['mati', 0], ['buzo', 2], ['cacho', 0], ['mati', 1]] },
      { cam: 1320, enemigos: [['buzo', 0], ['mati', 2], ['chorro', 0], ['cacho', 0], ['mati', 0]], eventos: [{ t: 'bondi', en: 5, linea: '121' }] },
      { cam: 1880, enemigos: [['cacho', 1], ['mati', 1], ['buzo', 2], ['chorro', 1], ['mati', 0]], eventos: [{ t: 'macetas', en: 3, n: 5 }] },
      { cam: 2420, enemigos: [['cacho', 0], ['mati', 2], ['buzo', 1], ['cacho', 2, MINI('EL GRAN CACHO')], ['mati', 3], ['buzo', 0]] },
      { cam: 9999, jefe: 'tano', enemigos: [['tano', 0]] }] },

  { id: 'feria', num: 2, nombre: 'FERIA DE TRISTÁN NARVAJA', lugar: 'CORDÓN · DOMINGO DE MAÑANA', escena: 'feria', hora: 'manana', L: 3600, lejos: 'feria', medio: 'ciudad',
    musica: 'mus.nivel2', ambiente: 'amb.feria', dif: 1.1, cupo: 2, max: 4, mapa: [0.36, 0.5],
    decor: [{ t: 'cono', x: 520, y: 214 }, { t: 'moto', x: 1500, y: 196 }, { t: 'contenedor', x: 2380, y: 192, empuja: true }, { t: 'banco', x: 3000, y: 190 }],
    rompibles: [{ t: 'puesto', x: 300, y: 200, da: 'naranja' }, { t: 'cajonFruta', x: 470, y: 262, da: 'tortafrita' }, { t: 'puesto', x: 960, y: 200, da: 'escoba' }, { t: 'cajonFruta', x: 1150, y: 258, da: 'cajonF' },
      { t: 'revistero', x: 1360, y: 198, da: 'billete' }, { t: 'puesto', x: 1760, y: 200, da: 'corvina' }, { t: 'cajonFruta', x: 1940, y: 262, da: 'naranja' }, { t: 'puesto', x: 2560, y: 200, da: 'tortafrita' },
      { t: 'cajonFruta', x: 2700, y: 256, da: 'mate' }, { t: 'maceta', x: 2980, y: 262, da: 'alfajor' }],
    items: [{ t: 'silla', x: 640, y: 250 }, { t: 'naranja', x: 800, y: 236 }, { t: 'termo', x: 1600, y: 248 }, { t: 'escoba', x: 2200, y: 236 }, { t: 'pelota', x: 2440, y: 250 }],
    perros: [{ x: 700, y: 256 }],
    oleadas: [
      { cam: 260, enemigos: [['dona', 0], ['chorro', 0], ['mati', 1]] },
      { cam: 820, enemigos: [['guri', 0], ['dona', 1], ['buzo', 3], ['chorro', 1]], eventos: [{ t: 'changuitos', en: 4, n: 3 }] },
      { cam: 1380, enemigos: [['cuida', 0], ['guri', 1], ['chorro', 2], ['dona', 0], ['mati', 2]] },
      { cam: 1960, enemigos: [['patova', 0, MINI('EL MUELLE', 1.6)], ['guri', 2], ['dona', 1], ['chorro', 0]], eventos: [{ t: 'carro', en: 6 }] },
      { cam: 2620, enemigos: [['cuida', 1], ['dona', 0], ['guri', 0], ['buzo', 1], ['chorro', 1], ['mati', 0]], eventos: [{ t: 'changuitos', en: 8, n: 4 }] },
      { cam: 9999, jefe: 'chola', enemigos: [['chola', 0]] }] },

  { id: 'avenida', num: 3, nombre: 'AVENIDA 18 DE JULIO', lugar: 'CENTRO · MEDIODÍA', escena: 'avenida', hora: 'mediodia', L: 3800, lejos: 'centro', medio: 'centro',
    musica: 'mus.nivel3', ambiente: 'amb.avenida', dif: 1.18, cupo: 3, max: 5, mapa: [0.46, 0.6],
    decor: [{ t: 'cono', x: 700, y: 212 }, { t: 'cono', x: 724, y: 222 }, { t: 'banco', x: 1600, y: 190 }, { t: 'banco', x: 1840, y: 190 }, { t: 'moto', x: 2500, y: 196 }, { t: 'contenedor', x: 3000, y: 192, empuja: true }],
    rompibles: [{ t: 'revistero', x: 2080, y: 198, da: 'billete' }, { t: 'revistero', x: 2160, y: 198, da: 'alfajor' }, { t: 'tacho', x: 460, y: 200, da: 'cano' }, { t: 'maceta', x: 1700, y: 196, da: 'mate' },
      { t: 'maceta', x: 1900, y: 196, da: 'ladrillo' }, { t: 'cajaBiz', x: 2700, y: 260, da: 'chivito' }, { t: 'tacho', x: 3360, y: 200, da: 'palo' }, { t: 'conservadora', x: 2840, y: 262, da: 'choripan' }],
    items: [{ t: 'garrafa', x: 1240, y: 258 }, { t: 'botella', x: 900, y: 240 }, { t: 'silla', x: 2620, y: 196 }, { t: 'pata', x: 1100, y: 250 }],
    perros: [],
    oleadas: [
      { cam: 300, enemigos: [['cuida', 0], ['chorro', 1], ['mati', 3], ['buzo', 0]] },
      { cam: 900, enemigos: [['patova', 1], ['chorro', 0], ['guri', 2], ['mati', 1]], eventos: [{ t: 'bondi', en: 4, linea: 'CA1' }] },
      { cam: 1520, enemigos: [['cuida', 1], ['chorro', 2], ['guri', 0], ['cacho', 1], ['mati', 0]], eventos: [{ t: 'palomas', en: 1 }] },
      { cam: 2160, enemigos: [['patova', 0], ['cuida', 0, MINI('EL CUIDA MAYOR')], ['chorro', 1], ['guri', 1], ['buzo', 2]], eventos: [{ t: 'bondi', en: 6, linea: '185' }, { t: 'bondi', en: 16, linea: '121', izq: true }] },
      { cam: 2780, enemigos: [['patova', 1], ['mozo', 0], ['chorro', 0], ['cuida', 1], ['mati', 2], ['guri', 2]], eventos: [{ t: 'carro', en: 5 }] },
      { cam: 9999, jefe: 'guarda', enemigos: [['guarda', 0]] }] },

  { id: 'barriosur', num: 4, nombre: 'BARRIO SUR, NOCHE DE LLAMADAS', lugar: 'BARRIO SUR · NOCHE', escena: 'barriosur', hora: 'noche', L: 3600, lejos: 'sur', medio: 'ciudad',
    musica: 'mus.nivel4', ambiente: 'amb.barriosur', dif: 1.2, cupo: 3, max: 5, mapa: [0.44, 0.74],
    decor: [{ t: 'contenedor', x: 380, y: 192, empuja: true }, { t: 'moto', x: 1880, y: 196 }, { t: 'contenedor', x: 2600, y: 192, empuja: true }],
    peligros: [{ t: 'fogata', x: 860, y: 194 }, { t: 'fogata', x: 2120, y: 196 }, { t: 'fogata', x: 3150, y: 194 }],
    rompibles: [{ t: 'tacho', x: 640, y: 198, da: 'palo' }, { t: 'cajaBiz', x: 1300, y: 258, da: 'bizcochos' }, { t: 'cajon', x: 1440, y: 262, da: 'botella' }, { t: 'barril', x: 1600, y: 196, da: 'cano' },
      { t: 'tacho', x: 2300, y: 200, da: 'mate' }, { t: 'cajon', x: 2760, y: 262, da: 'botella' }, { t: 'barril', x: 2960, y: 196, da: 'tortafrita' }],
    items: [{ t: 'ladrillo', x: 520, y: 250 }, { t: 'ladrillo', x: 1700, y: 240 }, { t: 'garrafa', x: 2480, y: 256 }, { t: 'silla', x: 1260, y: 196 }],
    perros: [{ x: 1000, y: 254 }],
    oleadas: [
      { cam: 280, enemigos: [['tambor', 0], ['buzo', 1], ['mati', 2], ['chorro', 0]] },
      { cam: 860, enemigos: [['cacho', 0], ['tambor', 1], ['chorro', 1], ['buzo', 3], ['mati', 0]], eventos: [{ t: 'llamadas', en: 2 }] },
      { cam: 1460, enemigos: [['patova', 0], ['chorro', 2], ['buzo', 0], ['mati', 1], ['guri', 1]], eventos: [{ t: 'apagon', en: 6, dur: 7 }] },
      { cam: 2040, enemigos: [['tambor', 0, MINI('EL PIANO MAYOR', 2.2)], ['tambor', 1], ['cacho', 2], ['chorro', 0], ['buzo', 2]], eventos: [{ t: 'llamadas', en: 3 }] },
      { cam: 2640, enemigos: [['patova', 1], ['cacho', 1], ['chorro', 1], ['mati', 3], ['guri', 0], ['tambor', 0]], eventos: [{ t: 'apagon', en: 10, dur: 6 }] },
      { cam: 9999, jefe: 'bocha', enemigos: [['bocha', 0]] }] },

  { id: 'ciudadvieja', num: 5, nombre: 'CIUDAD VIEJA Y EL MERCADO', lugar: 'CIUDAD VIEJA · DÍA GRIS', escena: 'ciudadvieja', hora: 'gris', L: 3800, lejos: 'puerto', medio: 'ciudad',
    musica: 'mus.nivel5', ambiente: 'amb.ciudadvieja', dif: 1.3, cupo: 3, max: 5, mapa: [0.3, 0.82],
    decor: [{ t: 'banco', x: 1300, y: 190 }, { t: 'cono', x: 2300, y: 214 }],
    peligros: [{ t: 'parrilla', x: 2620, y: 194 }, { t: 'parrilla', x: 3060, y: 194 }, { t: 'parrilla', x: 3480, y: 194 }],
    rompibles: [{ t: 'mesa', x: 690, y: 200, da: 'silla' }, { t: 'mesa', x: 820, y: 210, da: 'mate' }, { t: 'mesa', x: 950, y: 200, da: 'silla' }, { t: 'maceta', x: 1100, y: 196, da: 'alfajor' },
      { t: 'barril', x: 1700, y: 196, da: 'botella' }, { t: 'cajonFruta', x: 2050, y: 262, da: 'naranja' }, { t: 'barril', x: 2480, y: 196, da: 'choripan' }, { t: 'mesa', x: 2860, y: 204, da: 'silla' }, { t: 'conservadora', x: 3260, y: 262, da: 'chivito' }],
    items: [{ t: 'bandeja', x: 760, y: 250 }, { t: 'cano', x: 1500, y: 240 }, { t: 'botella', x: 1900, y: 252 }, { t: 'silla', x: 2200, y: 200 }, { t: 'corvina', x: 2760, y: 256 }],
    perros: [],
    oleadas: [
      { cam: 300, enemigos: [['mozo', 0], ['chorro', 0], ['mati', 2], ['buzo', 1]] },
      { cam: 900, enemigos: [['mozo', 1], ['cuida', 0], ['patova', 1], ['chorro', 1], ['guri', 2]], eventos: [{ t: 'turistas', en: 3 }] },
      { cam: 1520, enemigos: [['patova', 0], ['mozo', 0], ['chorro', 2], ['guri', 0], ['cacho', 1]], eventos: [{ t: 'lluvia', en: 0, dur: 30 }] },
      { cam: 2120, enemigos: [['mozo', 1, MINI('EL MAÎTRE', 2.6)], ['cuida', 1], ['chorro', 0], ['mati', 1], ['pescador', 1]], eventos: [{ t: 'turistas', en: 5 }] },
      { cam: 2780, enemigos: [['patova', 1], ['cacho', 0], ['mozo', 0], ['chorro', 1], ['guri', 1], ['pescador', 0]] },
      { cam: 9999, jefe: 'parrillero', enemigos: [['parrillero', 0]] }] },

  { id: 'rambla', num: 6, nombre: 'LA RAMBLA EN TORMENTA', lugar: 'RAMBLA · TORMENTA', escena: 'rambla', hora: 'tormenta', L: 3600, lejos: 'mar', medio: 'mar',
    musica: 'mus.nivel6', ambiente: 'amb.rambla', dif: 1.34, cupo: 3, max: 6, mapa: [0.62, 0.9], lluvia: true,
    decor: [{ t: 'banco', x: 274, y: 190 }, { t: 'banco', x: 594, y: 190 }, { t: 'banco', x: 1334, y: 190 }, { t: 'banco', x: 2334, y: 190 }],
    rompibles: [{ t: 'conservadora', x: 440, y: 262, da: 'corvina' }, { t: 'conservadora', x: 2560, y: 262, da: 'mate' }, { t: 'tacho', x: 1000, y: 200, da: 'cano' }, { t: 'cajaBiz', x: 1700, y: 258, da: 'choripan' },
      { t: 'tacho', x: 2100, y: 200, da: 'palo' }, { t: 'conservadora', x: 2760, y: 262, da: 'tortafrita' }, { t: 'cajon', x: 3000, y: 258, da: 'botella' }],
    items: [{ t: 'garrafa', x: 1240, y: 256 }, { t: 'ladrillo', x: 800, y: 240 }, { t: 'corvina', x: 2460, y: 250 }, { t: 'cano', x: 1900, y: 236 }],
    perros: [{ x: 1520, y: 256 }],
    oleadas: [
      { cam: 300, enemigos: [['pescador', 0], ['chorro', 1], ['guri', 0], ['mati', 3]] },
      { cam: 900, enemigos: [['patova', 1], ['pescador', 1], ['chorro', 0], ['dona', 0], ['buzo', 2]], eventos: [{ t: 'ola', en: 6 }] },
      { cam: 1520, enemigos: [['tambor', 1], ['cuida', 1], ['chorro', 2], ['guri', 2], ['mozo', 1], ['cacho', 0]], eventos: [{ t: 'gaviotas', en: 3 }] },
      { cam: 2140, enemigos: [['pescador', 1, MINI('DON CORVINA', 2.4)], ['patova', 0, MINI('EL HELADERA', 1.6)], ['chorro', 0], ['guri', 1]], eventos: [{ t: 'ola', en: 8 }, { t: 'ola', en: 20 }] },
      { cam: 2760, enemigos: [['patova', 1], ['pescador', 0], ['tambor', 0], ['chorro', 1], ['mozo', 0], ['cuida', 0], ['mati', 2]], eventos: [{ t: 'gaviotas', en: 4 }, { t: 'ola', en: 12 }] },
      { cam: 9999, jefe: 'capo', enemigos: [['capo', 0]] }] },
];
export const nivelPorId = (id) => NIVELES.find((n) => n.id === id) || NIVELES[0];
