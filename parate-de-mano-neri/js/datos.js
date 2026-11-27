// Datos de juego: stats, ataques, armas, comida, rompibles y frases (jerga uruguaya).
// Todo lo que define "cómo se juega" un personaje, enemigo o arma vive acá; juego.js / ia.js sólo lo interpretan.
export const JUGADORES = {
  seba: { nombre: 'EL SEBA', desc: 'Equilibrado. Buena mano y buena pata.', vel: 74, hp: 100, dmg: 1.0, atk: 1.0, salto: 1.0, peso: 1.0, stats: [3, 3, 3] },
  pelado: { nombre: 'EL PELADO', desc: 'Lento pero pega como camión.', vel: 58, hp: 130, dmg: 1.4, atk: 0.88, salto: 0.9, peso: 1.6, stats: [5, 2, 4] },
  pato: { nombre: 'LA PATO', desc: 'Rápida y saltarina. Aguanta menos.', vel: 92, hp: 92, dmg: 0.88, atk: 1.25, salto: 1.18, peso: 0.8, stats: [2, 5, 2] },
};
// stats: [fuerza, velocidad, aguante]
// ia: módulo de comportamiento (js/ia.js). ancho: medio ancho del cuerpo para los golpes. voz: prefijo de sus IDs de audio.
export const ENEMIGOS = {
  // --- barrio (nivel 1 en adelante)
  buzo: { ia: 'base', hp: 40, vel: 54, dmg: 7, reaccion: 0.26, nombres: ['CHUCHO', 'NACHO', 'TOTI', 'EL FLACO', 'RULO'], puntos: 200, tira: true, desc: 'Tira botellas de lejos.' },
  mati: { ia: 'base', hp: 34, vel: 74, dmg: 6, reaccion: 0.17, nombres: ['MATI', 'JONA', 'BRIAN', 'KEVIN', 'EL PIBE'], puntos: 250, esquiva: 0.35, desc: 'Esquiva y mete jabs rápidos.' },
  cacho: { ia: 'base', hp: 72, vel: 42, dmg: 11, reaccion: 0.38, nombres: ['CACHO', 'TITO', 'BETO', 'EL GORDO'], puntos: 400, pesado: true, desc: 'Pesado: avisa y pega fuerte.' },
  // --- nuevos
  chorro: { ia: 'chorro', hp: 30, vel: 108, dmg: 6, reaccion: 0.14, nombres: ['EL RATA', 'LAUCHA', 'PIRAÑA', 'EL FIDEO'], puntos: 320, esquiva: 0.25, peso: 0.8, desc: 'Rapidísimo. Se roba la comida y tu arma; barrida al piso.' },
  patova: { ia: 'patova', hp: 140, noAgarre: true, vel: 36, dmg: 13, reaccion: 0.42, nombres: ['EL ROPERO', 'EL MUELLE', 'TYSON', 'EL HELADERA'], puntos: 800, pesado: true, guardia: true, peso: 2.3, ancho: 15, desc: 'Bloquea las piñas de frente. Te agarra y te revolea.' },
  guri: { ia: 'guri', armaFija: 'gomera', hp: 24, vel: 86, dmg: 5, reaccion: 0.2, nombres: ['EL GURÍ', 'PITUFO', 'CHIQUI', 'EL PEQUE'], puntos: 300, peso: 0.7, ancho: 8, desc: 'Gomera de lejos; si te acercás, se escapa.' },
  faca: { ia: 'faca', hp: 46, vel: 80, dmg: 9, reaccion: 0.22, nombres: ['EL FACA', 'TAJITO', 'EL CORTE', 'NAVAJA'], puntos: 420, armaFija: 'faca', suelta: true, desc: 'Anda con faca: brilla la hoja y te tira el tajo o el puntazo. El corte sangra.' },
  cuida: { ia: 'cuida', hp: 48, vel: 58, dmg: 8, reaccion: 0.24, nombres: ['EL CUIDA', 'FRANELA', 'EL CHALECO', 'JEFE'], puntos: 380, armaFija: 'palo', suelta: true, desc: 'Cuidacoches con palo: barre de lejos.' },
  dona: { ia: 'dona', hp: 52, vel: 50, dmg: 7, reaccion: 0.28, nombres: ['DOÑA ROSA', 'DOÑA TERE', 'DOÑA BETTY', 'DOÑA NELLY'], puntos: 380, armaFija: 'escoba', suelta: true, desc: 'Escoba larga y naranjas en bolsa.' },
  tambor: { ia: 'tambor', hp: 54, vel: 46, dmg: 8, reaccion: 0.3, nombres: ['EL PIANO', 'EL CHICO', 'EL REPIQUE'], puntos: 500, desc: 'Toca y los demás se agrandan. Bajalo primero.' },
  mozo: { ia: 'mozo', hp: 42, vel: 68, dmg: 7, reaccion: 0.2, nombres: ['EL MOZO', 'GARZÓN', 'EL PIBE DEL BAR'], puntos: 380, desc: 'Tira bandejas que vuelven.' },
  pescador: { ia: 'pescador', armaFija: 'cana', suelta: true, hp: 50, vel: 48, dmg: 8, reaccion: 0.28, nombres: ['EL PESCA', 'DON CORVINA', 'EL ANZUELO'], puntos: 450, desc: 'Te engancha con la caña y te trae.' },
  // --- jefes (cada uno con su patrón en ia.js)
  mamado: { ia: 'mamado', hp: 58, vel: 44, dmg: 9, reaccion: 0.34, nombres: ['EL MAMADO', 'EL CHUPA', 'TATO', 'EL ESPONJA'], puntos: 420, tira: true, peso: 1.2, desc: 'Borracho: se tambalea, tira botellas y a veces se cae solo. Pega como un ropero.' },
  tano: { ia: 'tano', hp: 380, vel: 50, dmg: 11.5, reaccion: 0.3, nombres: ['EL TANO'], puntos: 5000, jefe: true, ancho: 18 },
  chola: { ia: 'chola', armaFija: 'cucharon', hp: 400, vel: 50, dmg: 11, reaccion: 0.3, nombres: ['DOÑA CHOLA'], puntos: 6000, jefe: true, ancho: 18, peso: 1.8 },
  guarda: { ia: 'guarda', armaFija: 'maquina', hp: 440, vel: 58, dmg: 11, reaccion: 0.28, nombres: ['EL GUARDA'], puntos: 7000, jefe: true, ancho: 16 },
  bocha: { ia: 'bocha', guardia: true, hp: 420, vel: 64, dmg: 11, reaccion: 0.25, nombres: ['EL BOCHA'], puntos: 8000, jefe: true, ancho: 16, peso: 1.4 },
  parrillero: { ia: 'parrillero', armaFija: 'pinza', hp: 500, vel: 44, dmg: 13, reaccion: 0.34, nombres: ['EL PARRILLERO'], puntos: 9000, jefe: true, ancho: 20, peso: 2.2 },
  chapa: { ia: 'chapa', hp: 480, vel: 70, dmg: 12, reaccion: 0.24, nombres: ['EL CHAPA'], puntos: 9500, jefe: true, ancho: 17, peso: 1.5 },
  gallego: { ia: 'gallego', hp: 520, vel: 50, dmg: 12, reaccion: 0.3, nombres: ['EL GALLEGO'], puntos: 10000, jefe: true, ancho: 19, peso: 2.0 },
  capo: { ia: 'capo', armaFija: 'paraguas', hp: 580, vel: 60, dmg: 13, reaccion: 0.24, nombres: ['DON PEPE, EL CAPO'], puntos: 15000, jefe: true, ancho: 17, peso: 1.6 },
};
// ini: arranque, act: activo, rec: recuperación (segundos). x: alcance [desde, hasta] hacia adelante
// son: ID de audio del impacto (audio-ids.js). aviso: muestra "!" antes de pegar.
export const ATQ = {
  pina1: { anim: 'pina1', ini: 0.035, act: 0.06, rec: 0.09, dmg: 5, x: [6, 34], kb: 26, stun: 0.3, son: 'golpe.pina', hs: 0.045 },
  pina2: { anim: 'pina2', ini: 0.05, act: 0.06, rec: 0.11, dmg: 6, x: [6, 36], kb: 30, stun: 0.32, son: 'golpe.pina', hs: 0.05 },
  pina3: { anim: 'pina3', ini: 0.08, act: 0.08, rec: 0.26, dmg: 10, x: [4, 34], kb: 150, tumba: true, vz: 170, son: 'golpe.gancho', hs: 0.1, remate: true },
  patada: { anim: 'patada', ini: 0.11, act: 0.09, rec: 0.22, dmg: 9, x: [10, 46], kb: 110, stun: 0.45, son: 'golpe.patada', hs: 0.08, tumbaSiAturdido: true, vz: 140, empuja: true },
  voladora: { anim: 'voladora', ini: 0.06, act: 9, rec: 0.0, dmg: 11, x: [4, 42], kb: 140, tumba: true, vz: 130, son: 'golpe.voladora', hs: 0.08, aire: true, empuja: true },
  especial: { anim: 'especial', ini: 0.04, act: 0.36, rec: 0.16, dmg: 12, x: [-40, 40], kb: 160, tumba: true, vz: 190, son: 'golpe.especial', hs: 0.06, giro: true, remate: true },
  // v9: pisotón a un caído, remate (TÉCNICA 3), barrida y cabezazo (se compran en el almacén)
  pisoton: { anim: 'pisoton', ini: 0.13, act: 0.07, rec: 0.2, dmg: 7, x: [0, 32], kb: 0, son: 'golpe.pisoton', hs: 0.08, alSuelo: true },
  remate: { anim: 'patada', ini: 0.1, act: 0.09, rec: 0.3, dmg: 13, x: [8, 48], kb: 240, tumba: true, vz: 170, son: 'golpe.remate', hs: 0.15, remate: true, gira: true },
  j_barrida: { anim: 'barrida', ini: 0.1, act: 0.22, rec: 0.3, dmg: 8, x: [0, 36], kb: 100, tumba: true, vz: 120, son: 'golpe.barrida', hs: 0.07, dash: 230, bajo: true },
  cabezazo: { anim: 'cabezazo', ini: 0.09, act: 0.06, rec: 0.22, dmg: 13, x: [0, 30], kb: 170, tumba: true, vz: 130, son: 'golpe.cabezazo', hs: 0.13, remate: true },
  rodilla: { anim: 'rodilla', ini: 0.05, act: 0.06, rec: 0.14, dmg: 6, x: [0, 30], kb: 0, stun: 0.5, son: 'golpe.rodilla', hs: 0.06 },
  golpe: { anim: 'golpe', ini: 0.1, act: 0.08, rec: 0.2, dmg: 0, x: [8, 44], kb: 90, stun: 0.45, son: 'arma.palo', hs: 0.08, arma: true },
  e_golpe: { anim: 'golpe', ini: 0.3, act: 0.08, rec: 0.5, dmg: 1, x: [8, 44], kb: 100, stun: 0.45, son: 'arma.palo', hs: 0.08, arma: true },
  // enemigos (dmg = multiplicador del daño base del enemigo)
  e_jab: { anim: 'pina1', ini: 0.16, act: 0.07, rec: 0.3, dmg: 1, x: [6, 32], kb: 30, stun: 0.32, son: 'golpe.pina', hs: 0.05 },
  e_cruz: { anim: 'pina2', ini: 0.12, act: 0.07, rec: 0.4, dmg: 1.2, x: [6, 34], kb: 40, stun: 0.36, son: 'golpe.pina', hs: 0.05 },
  e_patada: { anim: 'patada', ini: 0.26, act: 0.09, rec: 0.42, dmg: 1.4, x: [10, 44], kb: 120, tumba: true, vz: 120, son: 'golpe.patada', hs: 0.08 },
  e_pesada: { anim: 'pina3', ini: 0.5, act: 0.1, rec: 0.55, dmg: 1.2, x: [4, 38], kb: 160, tumba: true, vz: 160, son: 'golpe.gancho', hs: 0.1, aviso: true },
  e_embestida: { anim: 'agarra', ini: 0.65, act: 1.4, rec: 0.6, dmg: 1.1, x: [0, 30], kb: 200, tumba: true, vz: 170, son: 'golpe.embestida', hs: 0.1, aviso: true, dash: 230 },
  e_piston: { anim: 'golpe', ini: 0.45, act: 0.1, rec: 0.5, dmg: 1.0, x: [-60, 60], kb: 130, tumba: true, vz: 150, son: 'impacto.piso', hs: 0.1, aviso: true, onda: true },
  e_barrida: { anim: 'barrida', ini: 0.2, act: 0.26, rec: 0.36, dmg: 1.1, x: [0, 34], kb: 90, tumba: true, vz: 120, son: 'golpe.barrida', hs: 0.06, dash: 210, bajo: true },
  e_arrebato: { anim: 'agarra', ini: 0.14, act: 0.1, rec: 0.25, dmg: 0.3, x: [0, 34], kb: 20, stun: 0.25, son: 'mov.arrebato', hs: 0.04, roba: true },
  e_agarre: { anim: 'agarra', ini: 0.42, act: 0.16, rec: 0.6, dmg: 0, x: [0, 34], kb: 0, son: 'mov.agarre', hs: 0.05, aviso: true, agarre: true, dash: 90 },
  e_barre: { anim: 'golpe', ini: 0.3, act: 0.1, rec: 0.42, dmg: 1, x: [10, 62], kb: 110, stun: 0.45, son: 'arma.escoba', hs: 0.07, arma: true },
  e_facazo: { anim: 'golpe', ini: 0.44, act: 0.08, rec: 0.42, dmg: 1.0, x: [6, 40], kb: 60, stun: 0.4, son: 'arma.faca', hs: 0.07, arma: true, aviso: true, corta: true },
  e_puntazo: { anim: 'pina2', ini: 0.58, act: 0.2, rec: 0.55, dmg: 1.25, x: [4, 38], kb: 110, tumba: true, vz: 90, son: 'arma.faca', hs: 0.09, arma: true, aviso: true, corta: true, dash: 160 },
  e_palazo: { anim: 'golpe', ini: 0.34, act: 0.1, rec: 0.45, dmg: 1.1, x: [8, 54], kb: 120, tumba: true, vz: 110, son: 'arma.palo', hs: 0.08, arma: true, aviso: true },
  e_tambor: { anim: 'tamborOnda', ini: 0.3, act: 0.08, rec: 0.5, dmg: 0.9, x: [-44, 44], kb: 140, tumba: true, vz: 120, son: 'enem.tambor.golpe', hs: 0.08, giro: true },
  // jefes
  j_pisoton: { anim: 'golpe', ini: 0.4, act: 0.1, rec: 0.5, dmg: 1.0, x: [-64, 64], kb: 130, tumba: true, vz: 150, son: 'impacto.piso', hs: 0.1, aviso: true, onda: true },
  j_changuito: { anim: 'empuja', ini: 0.7, act: 1.2, rec: 0.7, dmg: 1.2, x: [0, 44], kb: 220, tumba: true, vz: 170, son: 'golpe.embestida', hs: 0.1, aviso: true, dash: 250 },
  j_cucharon: { anim: 'golpe', ini: 0.36, act: 0.1, rec: 0.45, dmg: 1.2, x: [6, 50], kb: 140, tumba: true, vz: 150, son: 'arma.cucharon', hs: 0.09, aviso: true },
  j_maquinazo: { anim: 'golpe', ini: 0.42, act: 0.1, rec: 0.5, dmg: 1.3, x: [6, 48], kb: 160, tumba: true, vz: 160, son: 'arma.maquina', hs: 0.1, aviso: true },
  j_combo1: { anim: 'pina1', ini: 0.09, act: 0.06, rec: 0.12, dmg: 0.7, x: [6, 36], kb: 30, stun: 0.34, son: 'golpe.pina', hs: 0.05 },
  j_combo2: { anim: 'pina2', ini: 0.07, act: 0.06, rec: 0.14, dmg: 0.8, x: [6, 38], kb: 40, stun: 0.4, son: 'golpe.pina', hs: 0.05 },
  j_upper: { anim: 'pina3', ini: 0.22, act: 0.08, rec: 0.5, dmg: 1.5, x: [4, 40], kb: 170, tumba: true, vz: 220, son: 'golpe.gancho', hs: 0.12, aviso: true },
  j_contra: { anim: 'pina2', ini: 0.04, act: 0.07, rec: 0.3, dmg: 1.2, x: [4, 42], kb: 150, tumba: true, vz: 150, son: 'golpe.contra', hs: 0.12 },
  j_pinza: { anim: 'golpe', ini: 0.32, act: 0.1, rec: 0.42, dmg: 1.1, x: [8, 56], kb: 140, tumba: true, vz: 140, son: 'arma.pinza', hs: 0.09, aviso: true },
  j_paraguas: { anim: 'pina2', ini: 0.28, act: 0.12, rec: 0.38, dmg: 1.1, x: [8, 70], kb: 150, tumba: true, vz: 130, son: 'arma.paraguas', hs: 0.09, aviso: true, dash: 120 },
  // a distancia: proy = lo que sale disparado en el cuadro activo (n proyectiles en abanico; arco = con gravedad)
  e_gomera: { anim: 'apunta', ini: 0.42, act: 0.05, rec: 0.36, dmg: 0, x: [0, 0], son: 'enem.gomera', hs: 0, proy: { t: 'piedra', v: 330, z: 50, n: 1 } },
  e_naranja: { anim: 'golpe', ini: 0.3, act: 0.05, rec: 0.4, dmg: 0, x: [0, 0], son: 'arma.tiro', hs: 0, proy: { t: 'naranja1', v: 200, z: 56, vz: 150, arco: true, n: 1 } },
  e_bandeja: { anim: 'golpe', ini: 0.28, act: 0.05, rec: 0.45, dmg: 0, x: [0, 0], son: 'enem.bandeja.vuela', hs: 0, proy: { t: 'bandeja', v: 270, z: 50, n: 1, vuelve: true } },
  e_botella: { anim: 'golpe', ini: 0.16, act: 0.05, rec: 0.3, dmg: 0, x: [0, 0], son: 'arma.tiro', hs: 0, proy: { t: 'botella', v: 250, z: 46, n: 1 } },
  e_lanza: { anim: 'golpe', ini: 0.42, act: 0.14, rec: 0.55, dmg: 0.5, x: [12, 150], kb: 0, stun: 0.7, son: 'enem.cana.lanza', hs: 0.05, aviso: true, engancha: true, arma: true, linea: true },
  e_combo: { anim: 'pina2', ini: 0.1, act: 0.06, rec: 0.22, dmg: 0.9, x: [6, 34], kb: 34, stun: 0.3, son: 'golpe.pina', hs: 0.05 },
  j_boletos: { anim: 'golpe', ini: 0.3, act: 0.05, rec: 0.42, dmg: 0, x: [0, 0], son: 'arma.tiro', hs: 0, proy: { t: 'boleto', v: 300, z: 50, n: 5, abanico: 34 } },
  j_naranjas: { anim: 'golpe', ini: 0.34, act: 0.05, rec: 0.5, dmg: 0, x: [0, 0], son: 'arma.tiro', hs: 0, proy: { t: 'naranja1', v: 210, z: 60, vz: 170, arco: true, n: 3, abanico: 30 } },
  j_chorizos: { anim: 'golpe', ini: 0.32, act: 0.05, rec: 0.48, dmg: 0, x: [0, 0], son: 'enem.chorizo', hs: 0, proy: { t: 'chorizo', v: 190, z: 56, vz: 190, arco: true, n: 3, abanico: 36, rebota: 2 } },
  j_giro: { anim: 'especial', ini: 0.4, act: 0.6, rec: 0.5, dmg: 0.9, x: [-50, 50], kb: 160, tumba: true, vz: 170, son: 'golpe.especial', hs: 0.07, giro: true, aviso: true },
};
// Armas del piso. vel: velocidad del golpe (>1 más rápido). dur: golpes que aguanta. tiro: daño al tirarla.
// deja: lo que queda al romperse. rompe: se hace añicos (vidrio). soloTiro: no se pega con ella, se tira (patada o piña).
export const ITEMS = {
  palo: { nombre: 'PALO', arma: true, dmg: 12, alcance: 46, dur: 8, vel: 1, kb: 95, son: 'arma.palo', tiro: 14, astilla: '#9a6a3a' },
  faca: { nombre: 'FACA', arma: true, dmg: 11, alcance: 34, dur: 6, vel: 1.3, kb: 50, son: 'arma.faca', tiro: 18, corta: true, metal: true },
  botella: { nombre: 'BOTELLA', arma: true, dmg: 9, alcance: 36, dur: 2, vel: 1.15, son: 'arma.botella', tiro: 12, rompe: true, deja: 'pico', dejaTxt: '¡QUEDÓ EL PICO!' },
  pico: { nombre: 'PICO DE BOTELLA', arma: true, dmg: 10, alcance: 30, dur: 4, vel: 1.4, kb: 40, son: 'arma.faca', tiro: 10, corta: true, rompe: true },
  termo: { nombre: 'TERMO', arma: true, dmg: 10, alcance: 38, dur: 14, vel: 1.05, son: 'arma.termo', tiro: 12, astilla: '#c0c4cc' },
  garrafa: { nombre: 'GARRAFA', arma: true, soloTiro: true, dmg: 0, alcance: 0, dur: 1, tiro: 22, explota: true },
  silla: { nombre: 'SILLA', arma: true, dmg: 16, alcance: 52, dur: 3, vel: 0.72, kb: 170, tumba: true, son: 'arma.silla', tiro: 18, deja: 'pata', astilla: '#c8c8c0', pesada: true },
  pata: { nombre: 'PATA DE SILLA', arma: true, dmg: 9, alcance: 34, dur: 6, vel: 1.25, kb: 70, son: 'arma.palo', tiro: 10, astilla: '#a8a8a0' },
  cano: { nombre: 'CAÑO', arma: true, dmg: 15, alcance: 50, dur: 18, vel: 0.84, kb: 120, stun: 0.6, son: 'arma.cano', tiro: 16, astilla: '#8a8a92', pesada: true },
  escoba: { nombre: 'ESCOBA', arma: true, dmg: 7, alcance: 64, dur: 10, vel: 1.12, kb: 80, son: 'arma.escoba', tiro: 8, astilla: '#d8b050' },
  ladrillo: { nombre: 'LADRILLO', arma: true, soloTiro: true, dmg: 0, alcance: 0, dur: 1, tiro: 20, son: 'arma.ladrillo', seRompe: true },
  naranja: { nombre: 'NARANJAS', arma: true, soloTiro: true, dmg: 0, alcance: 0, dur: 1, tiro: 7, municion: 3, son: 'impacto.fruta', seRompe: true },
  cajonF: { nombre: 'CAJÓN', arma: true, dmg: 13, alcance: 40, dur: 2, vel: 0.8, kb: 140, tumba: true, son: 'arma.cajon', tiro: 16, astilla: '#c89a5a', pesada: true },
  corvina: { nombre: 'CORVINA', arma: true, dmg: 8, alcance: 40, dur: 5, vel: 1.3, kb: 60, stun: 0.55, son: 'arma.corvina', tiro: 10, astilla: '#c8d0d8' },
  bandeja: { nombre: 'BANDEJA', arma: true, dmg: 7, alcance: 36, dur: 4, vel: 1.35, kb: 60, son: 'arma.bandeja', tiro: 12, astilla: '#c8c8d0' },
  cana: { nombre: 'CAÑA DE PESCAR', arma: true, dmg: 6, alcance: 70, dur: 6, vel: 1.0, kb: 60, son: 'arma.palo', tiro: 8, astilla: '#5a4a3a' },
  // armas fijas de jefes y proyectiles (no se juntan)
  paraguas: { nombre: 'PARAGUAS', npc: true, arma: true, dmg: 10, alcance: 60, son: 'arma.paraguas' }, cucharon: { nombre: 'CUCHARÓN', npc: true, arma: true, dmg: 10, alcance: 46, son: 'arma.cucharon' },
  maquina: { nombre: 'MÁQUINA DE BOLETOS', npc: true, arma: true, dmg: 10, alcance: 40, son: 'arma.maquina' }, pinza: { nombre: 'PINZA', npc: true, arma: true, dmg: 10, alcance: 50, son: 'arma.pinza' },
  gomera: { nombre: 'GOMERA', npc: true, arma: true, dmg: 2, alcance: 20 },
  piedra: { proy: true, tiro: 5, seRompe: true, kb: 40, stun: 0.35, son: 'impacto.piso' }, boleto: { proy: true, tiro: 4, seRompe: true, kb: 20, stun: 0.25, son: 'golpe.pina' },
  naranja1: { proy: true, tiro: 7, seRompe: true, kb: 50, stun: 0.4, son: 'impacto.fruta', fruta: '#f08a20' }, chorizo: { proy: true, tiro: 8, seRompe: true, kb: 80, stun: 0.45, son: 'enem.chorizo', fruta: '#9a3a2a' },
  // comida y cosas
  bizcochos: { cura: 25, txt: '¡BIZCOCHOS!' }, chivito: { cura: 100, txt: '¡CHIVITO!' }, mate: { cura: 35, mano: 50, txt: '¡UN MATE!' },
  alfajor: { cura: 15, txt: '¡ALFAJOR!' }, tortafrita: { cura: 30, txt: '¡TORTA FRITA!' }, choripan: { cura: 60, txt: '¡CHORIPÁN!' },
  billete: { puntos: 1000, plata: 100, txt: '+$U 100' }, pelota: { pelota: true },
  moneda: { plata: 10, auto: true }, // plata suelta: se junta sola al pasar por arriba
};
export const COMIDA = ['bizcochos', 'chivito', 'mate', 'alfajor', 'tortafrita', 'choripan'];
// rompibles: golpes que aguantan, material (sonido y astillas) y lo que sueltan por defecto
export const ROMPIBLES = {
  cajaBiz: { hp: 2, mat: 'carton', c: '#c8955a' }, cajon: { hp: 2, mat: 'vidrio', c: '#b52a2a' }, tacho: { hp: 1, mat: 'metal', c: '#5d6670' },
  puesto: { hp: 3, mat: 'madera', c: '#c89a5a', ancho: 60 }, cajonFruta: { hp: 1, mat: 'madera', c: '#c89a5a' }, mesa: { hp: 2, mat: 'madera', c: '#8a5a3a' },
  maceta: { hp: 1, mat: 'barro', c: '#b8603a' }, revistero: { hp: 2, mat: 'metal', c: '#c8402e' }, conservadora: { hp: 2, mat: 'plastico', c: '#2a8ad0' },
  barril: { hp: 2, mat: 'madera', c: '#7a4a2a' },
};
export const FRASES = {
  enemigo: ['¡QUÉ HACÉS, BOBO!', '¡VENÍ PA ACÁ!', '¡TE VOY A FAJAR!', '¡ALTO GIL!', '¡NO TE HAGAS EL VIVO!', '¡BO, VOS!', '¡ACÁ MANDAMOS NOSOTROS!', '¡DE ACÁ NO SALÍS!'],
  dolor: ['¡AY, MAMITA!', '¡TÁ, TÁ!', '¡PARÁ, PARÁ!', '¡UH, LOCO!', '¡LA PUCHA!'],
  ko: ['¡ME RINDO, BO!', '¡ME VOY PA CASA!', '¡NO DA MÁS!'],
  jugador: ['¡VAMO ARRIBA!', '¡TOMÁ, BO!', '¡DE UNA!', '¡AL PISO!', '¡QUÉ TE PENSÁS!'],
  come: ['¡QUÉ RICO, BO!', '¡ESTO ES VIDA!', '¡SALADO!'],
  arma: ['¡AHORA SÍ!', '¡VENÍ, VENÍ!', '¡MIRÁ LO QUE TENGO!'],
  robo: ['¡GRACIAS, BOBO!', '¡ME LO LLEVO!', '¡ESTO ES MÍO, BO!'],
  turista: ['¡AY, MY GOD!', '¡NO PHOTO!', '¡SOCORRO!', '¡QUÉ PAÍS!'],
  sueltas: ['¡AHÍ VOY!', '¡PERMISO, PERMISO!', '¡MÁS BRASAS!'],
  mini: ['¿A QUIÉN BUSCÁS?', '¡LLEGÓ EL QUE FALTABA!', '¡AHORA CONMIGO!'],
  // por tipo de enemigo (si no tiene, usa "enemigo")
  chorro: ['¡ME LO LLEVO!', '¡ESTO ES MÍO, BO!', '¡NI ME VISTE!', '¡CORRÉ, GIL!'],
  patova: ['¡NO PASÁS!', '¡HOY NO ENTRÁS!', '¡CON ESAS CHAMPIONES NO!', '¡LISTA CERRADA!'],
  guri: ['¡TOMÁ, VIEJO!', '¡NO ME AGARRÁS!', '¡LE DIGO A MI MADRE!', '¡PUNTERÍA, BO!'],
  faca: ['¡TE MARCO, GIL!', '¡QUEDATE QUIETITO!', '¡MIRÁ LO QUE TENGO!', '¡TE ABRO COMO CHORIZO!'],
  cuida: ['¡TE LO CUIDO, JEFE!', '¡LA VOLUNTAD, MAESTRO!', '¡ACÁ NO ESTACIONÁS!', '¡DALE QUE TE LO LAVO!'],
  dona: ['¡ATORRANTE!', '¡QUÉ JUVENTUD!', '¡A MI EDAD!', '¡TE VOY A BARRER!', '¡LLAMO A TU MADRE!'],
  tambor: ['¡DALE QUE SUENA!', '¡CHICO, REPIQUE Y PIANO!', '¡QUE NO PARE!', '¡ESTO ES CANDOMBE!'],
  mamado: ['¡VOS SOS MI HERMANO, LOCO!', '¡TE QUIERO MUCHO, BOLUDO!', '¡NO ESTOY MAMADO, ESTOY FELIZ!', '¡OTRA VUELTA, GALLEGO!', '¡HIP!'],
  mozo: ['¡LA CUENTA, CABALLERO!', '¡SALE UNA BANDEJA!', '¡LA PROPINA APARTE!', '¡MESA PARA UNO!'],
  pescador: ['¡PICÓ!', '¡VENÍ, PESCADITO!', '¡HOY NO PICA NADA!', '¡A LA OLLA!'],
  // jefes: intro, frases durante la pelea, al pasar la mitad (furia) y al caer
  tano: { intro: '¿QUIÉN SE METIÓ EN MI CUADRA?', pelea: ['¡TE VOY A HACER CHIVITO!', '¡ESTA CUADRA ES MÍA!', '¡AHÍ VOY!'], furia: '¡MUCHACHOS, A ÉL!', ko: '¡ESTÁ BIEN, ESTÁ BIEN!' },
  chola: { intro: '¿QUIÉN ME TOCÓ LOS TOMATES?', pelea: ['¡LLEVÁ TRES, PAGÁ DOS!', '¡NO SE TOCA LA MERCADERÍA!', '¡FRESQUITAS!'], furia: '¡SOBRINOS, VENGAN!', ko: '¡ME ARRUINASTE LA FERIA!' },
  guarda: { intro: '¡BOLETO, CABALLERO!', pelea: ['¡PASE PARA EL FONDO!', '¡SIN BOLETO NO VIAJÁS!', '¡HAY LUGAR ATRÁS!'], furia: '¡QUE VENGA EL 121!', ko: '¡FIN DEL RECORRIDO!' },
  bocha: { intro: '¿VOS SOS EL GUAPO DEL BARRIO?', pelea: ['¡GUARDIA ALTA!', '¡ESTO ES BOX, NENE!', '¡AL CUERPO!'], furia: '¡AHORA ME ENOJÉ!', ko: '¡TIRO LA TOALLA!' },
  parrillero: { intro: '¡SE TE QUEMA EL ASADO!', pelea: ['¡VUELTA Y VUELTA!', '¡SALE CHORIZO!', '¡A LA PARRILLA!'], furia: '¡MÁS BRASAS!', ko: '¡SE ME APAGÓ EL FUEGO!' },
  chapa: { intro: '¡ESTO ES TERRITORIO DE LOS PIBES!', pelea: ['¡PEAJE, GIL!', '¡ACÁ MANDO YO!', '¡TOMÁ, DE PARTE DEL CERRO!'], furia: '¡MUCHACHOS, CAÑO!', ko: '¡TÁ, TÁ, PASÁ GRATIS!' },
  gallego: { intro: '¡EN MI BOLICHE SE CONSUME!', pelea: ['¡LA CASA INVITA!', '¡ESTO NO ES UN BAR, ES UNA IGLESIA!', '¡TOMÁ, CHAVAL!'], furia: '¡ESTA RONDA LA PAGO YO!', ko: '¡CERRAMOS POR HOY!' },
  capo: { intro: '¿VOS LIMPIASTE MONTEVIDEO?', pelea: ['¡LA RAMBLA ES MÍA!', '¡ME ARRUINASTE EL MATE!', '¡MUCHACHOS!'], furia: '¡SE ME VOLÓ EL PARAGUAS!', ko: '¡TÁ, LA RAMBLA ES TUYA!' },
};
export const pick = (a) => a[Math.floor(Math.random() * a.length)];
