/* Defensa del Cerro — datos del juego (torres, enemigos, mapas, oleadas). Sin DOM: se usa también en las pruebas headless. */
export const COLS = 9, ROWS = 15;

// ---------- Torres ----------
// Cada torre: niveles 0,1 y en el 3er nivel dos ramas (a/b). Valores en casillas y segundos.
export const TOWERS = {
  mosq: {
    name: 'Mosqueteros', short: 'Mosquete', color: '#d8443a', cost: 70, air: true,
    desc: 'Tiro rápido a un solo enemigo. Le pegan a todo, hasta a lo que vuela.',
    lv: [
      { dmg: 13, cd: 0.62, range: 2.6 },
      { cost: 85, dmg: 23, cd: 0.55, range: 2.8 },
    ],
    br: {
      a: { cost: 180, name: 'Tiradores de élite', desc: 'Alcance enorme y tiros certeros: a veces el balazo pega el triple.', dmg: 70, cd: 1.0, range: 4.0, crit: 0.25, critMul: 3 },
      b: { cost: 170, name: 'Fusilería', desc: 'Dos tiradores que no paran de disparar.', dmg: 21, cd: 0.32, range: 2.9, double: true },
    },
  },
  canon: {
    name: 'Cañón', short: 'Cañón', color: '#3b3f4a', cost: 110, air: false,
    desc: 'Bala pesada que explota en área. Ideal contra grupos y botes. No apunta al aire.',
    lv: [
      { dmg: 30, cd: 1.6, range: 2.4, splash: 0.95 },
      { cost: 130, dmg: 52, cd: 1.5, range: 2.6, splash: 1.05 },
    ],
    br: {
      a: { cost: 240, name: 'Culebrina', desc: 'Bala gigante: daño bárbaro y deja aturdido al que agarra.', dmg: 125, cd: 1.8, range: 2.9, splash: 1.25, stun: 0.6 },
      b: { cost: 220, name: 'Metralla', desc: 'Escupe metralla en abanico: barre todo lo que tenga adelante.', dmg: 44, cd: 1.0, range: 2.5, cone: 0.85 },
    },
  },
  mortero: {
    name: 'Mortero', short: 'Mortero', color: '#6b5a44', cost: 130, air: false, pierce: 0.5,
    desc: 'Largo alcance, bomba lenta que ignora la mitad de la armadura. No tira muy cerca.',
    lv: [
      { dmg: 46, cd: 3.0, range: 4.2, min: 1.2, splash: 1.1 },
      { cost: 150, dmg: 82, cd: 2.8, range: 4.6, min: 1.2, splash: 1.2 },
    ],
    br: {
      a: { cost: 280, name: 'Bombarda', desc: 'La bomba más grande del Río de la Plata.', dmg: 230, cd: 3.4, range: 5.2, min: 1.3, splash: 1.5 },
      b: { cost: 260, name: 'Brea ardiente', desc: 'Deja un charco prendido fuego que quema a los que pasan.', dmg: 90, cd: 2.6, range: 4.8, min: 1.2, splash: 1.2, fire: 34, fireT: 3.2 },
    },
  },
  pampero: {
    name: 'Pampero', short: 'Pampero', color: '#5fb6e8', cost: 90, air: true, aura: true,
    desc: 'Viento helado del sur: frena a todos los que estén cerca, incluso a los que vuelan.',
    lv: [
      { dmg: 4, cd: 0.5, range: 1.8, slow: 0.35 },
      { cost: 110, dmg: 8, cd: 0.5, range: 2.0, slow: 0.45 },
    ],
    br: {
      a: { cost: 210, name: 'Helada', desc: 'Frena más y a veces deja a alguno congelado.', dmg: 12, cd: 0.5, range: 2.2, slow: 0.55, freeze: 0.1, freezeT: 1.2 },
      b: { cost: 220, name: 'Sudestada', desc: 'Cada tanto, una ráfaga los empuja para atrás.', dmg: 14, cd: 0.5, range: 2.2, slow: 0.45, push: 0.8, pushCd: 4 },
    },
  },
  faro: {
    name: 'Faro', short: 'Faro', color: '#f2c94c', cost: 100, air: true, support: true,
    desc: 'No dispara: descubre a los invisibles y mejora a las torres que alumbra.',
    lv: [
      { range: 2.6, bRange: 0.1, bDmg: 0, bRate: 0 },
      { cost: 120, range: 3.0, bRange: 0.15, bDmg: 0.1, bRate: 0 },
    ],
    br: {
      a: { cost: 220, name: 'Faro de guerra', desc: 'Las torres alumbradas pegan más fuerte y más rápido.', range: 3.0, bRange: 0.2, bDmg: 0.25, bRate: 0.15 },
      b: { cost: 200, name: 'Faro vigía', desc: 'Alumbra lejísimo y marca enemigos: reciben 20% más de daño.', range: 4.0, bRange: 0.15, bDmg: 0.1, bRate: 0, mark: 0.2 },
    },
  },
  ballesta: {
    name: 'Ballesta', short: 'Ballesta', color: '#8a5a2b', cost: 120, air: true,
    desc: 'Virote que atraviesa a varios enemigos en línea. Le pega al aire.',
    lv: [
      { dmg: 34, cd: 1.5, range: 3.2, pierce: 3 },
      { cost: 140, dmg: 58, cd: 1.4, range: 3.4, pierce: 4 },
    ],
    br: {
      a: { cost: 250, name: 'Arponera', desc: 'Arpón que atraviesa armaduras y a seis enemigos.', dmg: 165, cd: 1.8, range: 3.9, pierce: 6, armorPierce: 1 },
      b: { cost: 240, name: 'Repetidora', desc: 'Dispara virotes como si no hubiera mañana.', dmg: 44, cd: 0.45, range: 3.4, pierce: 3 },
    },
  },
};
export const TOWER_ORDER = ['mosq', 'canon', 'pampero', 'mortero', 'ballesta', 'faro'];
export const TARGET_MODES = [
  { id: 'first', label: 'Primero' }, { id: 'last', label: 'Último' },
  { id: 'strong', label: 'Más fuerte' }, { id: 'close', label: 'Más cerca' },
];
export const SELL_RATE = 0.7;

// ---------- Enemigos ----------
// kind: land | sea | air. threat = costo para armar oleadas.
export const ENEMIES = {
  grumete: { name: 'Grumete', kind: 'land', hp: 58, spd: 1.0, gold: 4, threat: 1, r: 0.26, melee: 8,
    desc: 'Pirata raso. Viene de a montones.' },
  corsario: { name: 'Corsario', kind: 'land', hp: 42, spd: 1.85, gold: 5, threat: 1.2, r: 0.24, melee: 6,
    desc: 'Rapidísimo. Si no lo frenás, se te cuela.' },
  acorazado: { name: 'Coraza', kind: 'land', hp: 175, spd: 0.68, gold: 10, threat: 3, armor: 0.5, r: 0.31, melee: 16,
    desc: 'Armadura gruesa: la mitad de los tiros le rebotan. Mortero y arpón lo atraviesan.' },
  escudero: { name: 'Escudero', kind: 'land', hp: 95, spd: 0.9, gold: 9, threat: 2.4, shield: 120, r: 0.28, melee: 10,
    desc: 'Escudo que se recarga si lo dejás tranquilo. Las explosiones lo rompen más rápido.' },
  carreton: { name: 'Carretón', kind: 'land', hp: 230, spd: 0.7, gold: 8, threat: 4, armor: 0.2, r: 0.36, split: ['grumete', 3], melee: 12,
    desc: 'Cuando lo rompés, salen tres grumetes de adentro.' },
  cirujano: { name: 'Cirujano', kind: 'land', hp: 105, spd: 0.85, gold: 9, threat: 2.6, heal: 14, healR: 1.5, r: 0.27, melee: 6,
    desc: 'Cura a los que tiene alrededor. Bajalo primero.' },
  contrab: { name: 'Contrabandista', kind: 'land', hp: 88, spd: 1.2, gold: 9, threat: 2.2, stealth: true, r: 0.26, melee: 8,
    desc: 'Invisible. Las torres solo lo ven de muy cerca, salvo que lo alumbre un Faro o una Bengala.' },
  loro: { name: 'Loro pirata', kind: 'air', hp: 40, spd: 1.15, gold: 5, threat: 1.3, r: 0.24,
    desc: 'Vuela directo a la fortaleza. Cañón y mortero no lo alcanzan.' },
  bote: { name: 'Bote', kind: 'sea', hp: 130, spd: 0.82, gold: 8, threat: 2.5, r: 0.34,
    desc: 'Desembarco por agua. Poné torres cerca de la costa.' },
  lancha: { name: 'Lancha cañonera', kind: 'sea', hp: 260, spd: 0.72, gold: 14, threat: 5, armor: 0.4, r: 0.4,
    desc: 'Bote blindado. Aguanta mucho castigo.' },
  // jefes
  tuerto: { name: 'Contramaestre Tuerto', kind: 'land', boss: true, hp: 950, spd: 0.62, gold: 80, threat: 0, armor: 0.2, r: 0.46, life: 3, charge: true, melee: 40,
    desc: 'Jefe. Cada tanto agarra envión y sale corriendo.' },
  malacara: { name: 'Capitán Malacara', kind: 'land', boss: true, hp: 2600, spd: 0.5, gold: 160, threat: 0, armor: 0.3, r: 0.52, life: 5, summon: ['grumete', 3, 9], rally: true, melee: 60,
    desc: 'Jefe. Llama grumetes y apura a la tropa que tiene cerca.' },
  galeona: { name: 'La Galeona Negra', kind: 'sea', boss: true, hp: 2300, spd: 0.34, gold: 220, threat: 0, armor: 0.4, r: 0.62, life: 6, broadside: true,
    desc: 'Jefa naval. Sus cañonazos dejan torres fuera de combate un rato.' },
  almirante: { name: 'Almirante Sombra', kind: 'land', boss: true, hp: 9000, spd: 0.44, gold: 400, threat: 0, armor: 0.35, r: 0.56, life: 15, summon: ['contrab', 2, 10], vanish: true, phase: 1600, melee: 90,
    desc: 'Jefe final. Se vuelve invisible, llama contrabandistas y a media vida saca un escudo.' },
};

// ---------- Mapas ----------
// Leyenda: . pasto  , pasto2  ~ agua  F fortaleza  t árbol  r roca  h casa  s arena
// Caminos: listas de casillas (col,fila) unidas en línea recta. Se marca solo el camino de tierra.
export const LEVELS = [
  {
    id: 1, name: 'La Subida', sub: 'Falda del Cerro',
    blurb: 'Desembarcaron en la playa y suben por la ladera. Un solo camino: aprendé a armar la defensa.',
    gold: 260, towers: ['mosq', 'canon', 'pampero', 'mortero'],
    grid: [
      '~.FFFFF.~',
      '~.FFFFF.~',
      '~,.....r~',
      '..,....,.',
      't.......h',
      '.r.....t.',
      '.........',
      ',......,.',
      '.t.....r.',
      '.........',
      'h....t..,',
      '..,......',
      '........t',
      'ss.r....s',
      'sss....ss',
    ],
    paths: [
      { kind: 'land', pts: [[4, 15.4], [4, 12], [1, 12], [1, 9], [7, 9], [7, 6], [2, 6], [2, 3], [4, 3], [4, 1.7]] },
      { kind: 'air', pts: [[4.5, 15.6], [2.5, 9], [4, 1.7]] },
    ],
    pool: [['grumete', 1], ['corsario', 3], ['acorazado', 6], ['escudero', 8], ['carreton', 11], ['cirujano', 13]],
    bosses: { 5: ['tuerto'], 10: ['malacara'], 15: ['tuerto', 'tuerto'], 20: ['malacara', 'tuerto'] },
    hpMul: 1.0,
  },
  {
    id: 2, name: 'La Bahía', sub: 'Por mar y por tierra',
    blurb: 'Botes por la bahía y tropa por la ladera. Ojo con los loros y los contrabandistas.',
    gold: 380, towers: ['mosq', 'canon', 'pampero', 'mortero', 'ballesta', 'faro'],
    grid: [
      '~~FFFFF.,',
      '~~FFFFF..',
      '~~.....t.',
      '~~s......',
      '~~s....r.',
      '~~s......',
      '~~s.....h',
      '~~~~s....',
      '~~~~s..t.',
      '~~s~s....',
      '~~s~s.r..',
      '~~s~s....',
      '~~~~s..t.',
      '~~~~s....',
      '~~~~ss...',
    ],
    paths: [
      { kind: 'land', pts: [[6, 15.4], [6, 11], [8, 11], [8, 7], [5, 7], [5, 1.7]] },
      { kind: 'sea', pts: [[1, 15.6], [1, 12], [3, 12], [3, 8], [1, 8], [1, 2.2]] },
      { kind: 'air', pts: [[7.5, 15.6], [3.2, 8.5], [4.5, 1.7]] },
    ],
    pool: [['grumete', 1], ['bote', 2], ['corsario', 3], ['acorazado', 4], ['loro', 6], ['escudero', 7], ['contrab', 9], ['lancha', 11], ['cirujano', 12], ['carreton', 14]],
    bosses: { 5: ['tuerto'], 10: ['galeona'], 15: ['malacara'], 20: ['galeona', 'malacara'] },
    hpMul: 0.88,
  },
  {
    id: 3, name: 'Villa del Cerro', sub: 'El asalto final',
    blurb: 'Vienen por dos calles, por agua y por aire. Aprovechá la Isla de Ratas. Al final aparece el Almirante Sombra.',
    gold: 460, towers: ['mosq', 'canon', 'pampero', 'mortero', 'ballesta', 'faro'],
    grid: [
      '..FFFFF~~',
      't.FFFFF~~',
      '.......~~',
      'h.....s~~',
      '.......~~',
      '..h...s~~',
      '.......~~',
      't.....s~s',
      '..h....~s',
      '......s~s',
      '.......~s',
      'h.....s~~',
      '..,....~~',
      '......s~~',
      'ss..ss.~~',
    ],
    paths: [
      { kind: 'land', pts: [[1, 15.4], [1, 10], [3, 10], [3, 7], [1, 7], [1, 4], [3, 4], [3, 1.7]] },
      { kind: 'land', pts: [[5, 15.4], [5, 12], [6, 12], [6, 5], [5, 5], [5, 1.7]] },
      { kind: 'sea', pts: [[8, 15.6], [8, 11], [7, 11], [7, 6], [8, 6], [8, 2.2], [7, 1.6]] },
      { kind: 'air', pts: [[4.2, 15.6], [2.2, 9], [4.5, 1.7]] },
    ],
    pool: [['grumete', 1], ['corsario', 1], ['bote', 2], ['acorazado', 3], ['loro', 4], ['escudero', 5], ['contrab', 6], ['cirujano', 8], ['lancha', 9], ['carreton', 11]],
    bosses: { 5: ['tuerto'], 10: ['galeona'], 15: ['tuerto', 'malacara'], 20: ['almirante'] },
    hpMul: 0.88,
  },
];
export const WAVES_PER_LEVEL = 20;

export const DIFFS = {
  tranqui: { name: 'Tranqui', hp: 0.78, gold: 1.1, desc: 'Para agarrarle la mano.' },
  normal: { name: 'Normal', hp: 1, gold: 1, desc: 'Como tiene que ser.' },
  bravo: { name: 'Bravo', hp: 1.32, gold: 0.92, desc: 'Para los guapos. Gana un laurel.' },
};

// ---------- Mejoras del Cuartel (meta-progresión, se pagan con medallas) ----------
export const META = [
  { id: 'gold', name: 'Arcas llenas', desc: '+40 de oro al empezar', max: 3, cost: [1, 1, 2] },
  { id: 'lives', name: 'Muralla reforzada', desc: '+3 vidas', max: 2, cost: [1, 2] },
  { id: 'dmg', name: 'Pólvora fina', desc: '+7% de daño de todas las torres', max: 3, cost: [1, 2, 2] },
  { id: 'cheap', name: 'Ingenieros', desc: 'Torres 6% más baratas', max: 2, cost: [1, 2] },
  { id: 'naval', name: 'Artillería naval', desc: 'Bombardeo +30% de daño y 5 s menos de espera', max: 2, cost: [1, 2] },
  { id: 'blandeng', name: 'Blandengues veteranos', desc: 'Refuerzos +40% de vida y daño', max: 2, cost: [1, 1] },
  { id: 'bank', name: 'Cuenta en el banco', desc: 'Tope de intereses +15', max: 1, cost: [1] },
];

// ---------- Poderes ----------
export const ABILITIES = {
  bomb: { name: 'Bombardeo naval', cd: 40, needsTarget: 'any', desc: 'La flota descarga tres bombazos donde toques.' },
  troops: { name: 'Blandengues', cd: 28, needsTarget: 'land', desc: 'Dos blandengues frenan al enemigo en el camino que toques.' },
  flare: { name: 'Bengala', cd: 45, needsTarget: null, desc: 'Descubre a los invisibles 10 s y todos reciben +15% de daño.' },
};

// ---------- Logros ----------
export const ACHIEVEMENTS = [
  { id: 'win1', name: 'Bautismo de fuego', desc: 'Ganá La Subida.' },
  { id: 'win3', name: 'El Cerro no se toca', desc: 'Ganá Villa del Cerro.' },
  { id: 'stars3', name: 'De diez', desc: 'Sacá 3 estrellas en un nivel.' },
  { id: 'perfect', name: 'Ni un rasguño', desc: 'Ganá un nivel sin perder vidas.' },
  { id: 'bravo', name: 'Guapo de verdad', desc: 'Ganá un nivel en Bravo.' },
  { id: 'legend', name: 'Leyenda del Cerro', desc: 'Ganá Villa del Cerro en Bravo.' },
  { id: 'early', name: 'El que avisa no traiciona', desc: 'Llamá 25 oleadas antes de tiempo.' },
  { id: 'towers12', name: 'Hasta las manos', desc: 'Tené 12 torres al mismo tiempo.' },
  { id: 'bosses', name: 'Cazajefes', desc: 'Derrotá 8 jefes.' },
  { id: 'galeona', name: 'A pique', desc: 'Hundí a La Galeona Negra.' },
  { id: 'maxall', name: 'Arsenal completo', desc: 'Llevá cada tipo de torre a su nivel máximo.' },
  { id: 'kills', name: 'Mil bajas', desc: 'Derrotá 1000 enemigos en total.' },
  { id: 'banker', name: 'Ahorrista', desc: 'Cobrá 300 de oro en intereses.' },
  { id: 'endless25', name: 'Aguante infinito', desc: 'Llegá a la oleada 25 en Sin Fin.' },
  { id: 'allstars', name: 'Coleccionista', desc: 'Juntá todas las estrellas.' },
];

// ---------- RNG determinista ----------
export function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}

// ---------- Generador de oleadas ----------
export function hpScale(w) { return 1 + 0.09 * (w - 1) + 0.0075 * (w - 1) * (w - 1); }

export function buildWave(level, w, endless) {
  const R = rng(level.id * 7919 + w * 104729 + (endless ? 31 : 0));
  const lands = level.paths.map((p, i) => [p, i]).filter(([p]) => p.kind === 'land').map(([, i]) => i);
  const seaIdx = level.paths.findIndex((p) => p.kind === 'sea');
  const airIdx = level.paths.findIndex((p) => p.kind === 'air');
  const pathFor = (type, k) => {
    const kind = ENEMIES[type].kind;
    if (kind === 'sea') return seaIdx; if (kind === 'air') return airIdx;
    return lands[k % lands.length];
  };
  const pool = level.pool.filter(([, from]) => from <= w || endless).map(([t]) => t);
  const fresh = endless ? [] : level.pool.filter(([, from]) => from === w).map(([t]) => t);
  let budget = 6 + w * 3.0 + w * w * 0.12;
  const bossKey = endless ? (w % 5 === 0 ? Object.keys(level.bosses)[((w / 5) - 1) % 4] : null) : (level.bosses[w] ? w : null);
  const bosses = bossKey ? level.bosses[bossKey] : [];
  if (bosses.length) budget *= 0.55;
  const groups = [];
  let t = 0, gi = 0;
  const addGroup = (type, pts) => {
    const e = ENEMIES[type];
    const count = Math.max(2, Math.round(pts / e.threat));
    const gap = Math.max(0.35, 0.95 / e.spd * (e.threat > 2 ? 1.35 : 1) * (w > 12 ? 0.8 : 1));
    groups.push({ type, count, gap, at: t, path: pathFor(type, gi) });
    t += count * gap * 0.55 + 1.2; gi++;
  };
  for (const f of fresh) { addGroup(f, budget * 0.35); budget *= 0.65; }
  const n = Math.min(5, 1 + Math.floor(w / 4) + (R() < 0.5 ? 1 : 0));
  for (let i = 0; i < n; i++) {
    // los tipos nuevos pesan más; los viejos siguen apareciendo
    const weights = pool.map((tp, k) => 0.6 + k * 0.25 + (tp === 'grumete' ? 0.6 : 0));
    let s = weights.reduce((a, b) => a + b, 0) * R(), k = 0;
    while (k < pool.length - 1 && (s -= weights[k]) > 0) k++;
    addGroup(pool[k], budget / n);
  }
  bosses.forEach((b, i) => { groups.push({ type: b, count: 1, gap: 1, at: t * 0.5 + i * 6, path: pathFor(b, i), boss: true }); });
  return groups.sort((a, b) => a.at - b.at);
}
