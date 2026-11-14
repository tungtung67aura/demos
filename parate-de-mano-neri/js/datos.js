// Datos de juego: stats, ataques, ítems y frases (jerga uruguaya).
export const JUGADORES = {
  seba: { nombre: 'EL SEBA', desc: 'Equilibrado. Buena mano y buena pata.', vel: 74, hp: 100, dmg: 1.0, atk: 1.0, salto: 1.0, peso: 1.0, stats: [3, 3, 3] },
  pelado: { nombre: 'EL PELADO', desc: 'Lento pero pega como camión.', vel: 58, hp: 130, dmg: 1.4, atk: 0.88, salto: 0.9, peso: 1.6, stats: [5, 2, 4] },
  pato: { nombre: 'LA PATO', desc: 'Rápida y saltarina. Aguanta menos.', vel: 92, hp: 82, dmg: 0.82, atk: 1.25, salto: 1.18, peso: 0.8, stats: [2, 5, 2] },
};
// stats: [fuerza, velocidad, aguante]
export const ENEMIGOS = {
  buzo: { hp: 40, vel: 54, dmg: 7, reaccion: 0.26, nombres: ['CHUCHO', 'NACHO', 'TOTI', 'EL FLACO', 'RULO'], puntos: 200, tira: true },
  mati: { hp: 34, vel: 74, dmg: 6, reaccion: 0.17, nombres: ['MATI', 'JONA', 'BRIAN', 'KEVIN', 'EL PIBE'], puntos: 250, esquiva: 0.35 },
  cacho: { hp: 72, vel: 42, dmg: 11, reaccion: 0.38, nombres: ['CACHO', 'TITO', 'BETO', 'EL GORDO'], puntos: 400, pesado: true },
  tano: { hp: 380, vel: 50, dmg: 11.5, reaccion: 0.3, nombres: ['EL TANO'], puntos: 5000, jefe: true },
};
// ini: arranque, act: activo, rec: recuperación (segundos). x: alcance [desde, hasta] hacia adelante
export const ATQ = {
  pina1: { anim: 'pina1', ini: 0.05, act: 0.06, rec: 0.11, dmg: 5, x: [6, 34], kb: 26, stun: 0.3, sfx: 'pina', hs: 0.045 },
  pina2: { anim: 'pina2', ini: 0.05, act: 0.06, rec: 0.13, dmg: 6, x: [6, 36], kb: 30, stun: 0.32, sfx: 'pina', hs: 0.05 },
  pina3: { anim: 'pina3', ini: 0.08, act: 0.08, rec: 0.26, dmg: 10, x: [4, 34], kb: 150, tumba: true, vz: 170, sfx: 'fuerte', hs: 0.1 },
  patada: { anim: 'patada', ini: 0.11, act: 0.09, rec: 0.22, dmg: 9, x: [10, 46], kb: 110, stun: 0.45, sfx: 'patada', hs: 0.08, tumbaSiAturdido: true, vz: 140 },
  voladora: { anim: 'voladora', ini: 0.06, act: 9, rec: 0.0, dmg: 11, x: [4, 42], kb: 140, tumba: true, vz: 130, sfx: 'patada', hs: 0.08, aire: true },
  especial: { anim: 'especial', ini: 0.04, act: 0.36, rec: 0.16, dmg: 12, x: [-40, 40], kb: 160, tumba: true, vz: 190, sfx: 'fuerte', hs: 0.06, giro: true },
  rodilla: { anim: 'rodilla', ini: 0.05, act: 0.06, rec: 0.14, dmg: 6, x: [0, 30], kb: 0, stun: 0.5, sfx: 'pina', hs: 0.06 },
  golpe: { anim: 'golpe', ini: 0.1, act: 0.08, rec: 0.2, dmg: 0, x: [8, 44], kb: 90, stun: 0.45, sfx: 'madera', hs: 0.08, arma: true },
  e_golpe: { anim: 'golpe', ini: 0.3, act: 0.08, rec: 0.5, dmg: 1, x: [8, 44], kb: 100, stun: 0.45, sfx: 'madera', hs: 0.08, arma: true },
  // enemigos
  e_jab: { anim: 'pina1', ini: 0.16, act: 0.07, rec: 0.3, dmg: 1, x: [6, 32], kb: 30, stun: 0.32, sfx: 'pina', hs: 0.05 },
  e_cruz: { anim: 'pina2', ini: 0.12, act: 0.07, rec: 0.4, dmg: 1.2, x: [6, 34], kb: 40, stun: 0.36, sfx: 'pina', hs: 0.05 },
  e_patada: { anim: 'patada', ini: 0.26, act: 0.09, rec: 0.42, dmg: 1.4, x: [10, 44], kb: 120, tumba: true, vz: 120, sfx: 'patada', hs: 0.08 },
  e_pesada: { anim: 'pina3', ini: 0.5, act: 0.1, rec: 0.55, dmg: 1.2, x: [4, 38], kb: 160, tumba: true, vz: 160, sfx: 'fuerte', hs: 0.1, aviso: true },
  e_embestida: { anim: 'agarra', ini: 0.65, act: 1.4, rec: 0.6, dmg: 1.1, x: [0, 30], kb: 200, tumba: true, vz: 170, sfx: 'fuerte', hs: 0.1, aviso: true, dash: 230 },
  e_piston: { anim: 'golpe', ini: 0.45, act: 0.1, rec: 0.5, dmg: 1.0, x: [-60, 60], kb: 130, tumba: true, vz: 150, sfx: 'piso', hs: 0.1, aviso: true, onda: true },
};
export const ITEMS = {
  palo: { arma: true, dmg: 12, alcance: 46, dur: 8, sfx: 'madera', tiro: 14 },
  botella: { arma: true, dmg: 9, alcance: 36, dur: 2, sfx: 'botella', tiro: 12, rompe: true },
  termo: { arma: true, dmg: 10, alcance: 38, dur: 14, sfx: 'metal', tiro: 12 },
  garrafa: { arma: true, soloTiro: true, dmg: 0, alcance: 0, dur: 1, tiro: 22, explota: true },
  bizcochos: { cura: 25, txt: '¡BIZCOCHOS!' }, chivito: { cura: 100, txt: '¡CHIVITO!' }, mate: { cura: 35, mano: 50, txt: '¡UN MATE!' },
  billete: { puntos: 1000, txt: '+$1000' }, pelota: { pelota: true },
};
export const FRASES = {
  enemigo: ['¡QUÉ HACÉS, BOBO!', '¡VENÍ PA ACÁ!', '¡TE VOY A FAJAR!', '¡ALTO GIL!', '¡NO TE HAGAS EL VIVO!', '¡BO, VOS!', '¡ACÁ MANDAMOS NOSOTROS!', '¡DE ACÁ NO SALÍS!'],
  dolor: ['¡AY, MAMITA!', '¡TÁ, TÁ!', '¡PARÁ, PARÁ!', '¡UH, LOCO!', '¡LA PUCHA!'],
  ko: ['¡ME RINDO, BO!', '¡ME VOY PA CASA!', '¡NO DA MÁS!'],
  jugador: ['¡VAMO ARRIBA!', '¡TOMÁ, BO!', '¡DE UNA!', '¡AL PISO!', '¡QUÉ TE PENSÁS!'],
  come: ['¡QUÉ RICO, BO!', '¡ESTO ES VIDA!', '¡SALADO!'],
  jefe: ['¿QUIÉN SE METIÓ EN MI CUADRA?', '¡MUCHACHOS, A ÉL!', '¡TE VOY A HACER CHIVITO!', '¡ESTA CUADRA ES MÍA!'],
};
export const pick = (a) => a[Math.floor(Math.random() * a.length)];
