// v9: MODO HISTORIA. «La Noche de la Rambla»: ocho capítulos sobre los mapas de siempre, con escenas en el motor,
// diálogos con retratos pintados a mano (canvas), objetivos (oleada, defender, llegar, escoltar, aguantar, jefe),
// armas que se ganan por capítulo y guardado para seguir después. Todo en rioplatense.
import * as THREE from 'https://esm.sh/three@0.160.0';
import { crearBus, crearAuto } from './autos.js';

// ---------- elenco ----------
export const ELENCO = {
  tano: { nombre: 'El Tano', rol: 'Parrillero de la rambla', color: '#e0703a' },
  negra: { nombre: 'La Negra Martínez', rol: 'Radio Rambla, 102.4', color: '#d84a8a' },
  washington: { nombre: 'Don Washington', rol: 'Chofer de la línea 121', color: '#4a8ad8' },
  doctora: { nombre: 'Doctora Fernández', rol: 'Médica de guardia', color: '#5ad0a0' },
  vos: { nombre: 'Vos', rol: '', color: '#ffd040' }
};
// ---------- capítulos ----------
// tomas de cámara: [i, d, altura] desde → hacia, mirando a [i, d, altura]
export const CAPITULOS = [
  { id: 1, titulo: 'La última del Tano', mapa: 'rambla', ini: [300, 6], oleada: 1, premio: ['facon'], pesos: 150,
    intro: { tomas: [{ de: [292, 14, 4.5], a: [297, 11, 3.2], mira: [304, 7, 1.6] }, { de: [310, -6, 2.6], a: [306, -2, 2.2], mira: [304, 7, 1.8] }, { de: [300, 2, 9], a: [300, 4, 12], mira: [318, -40, 0] }],
      dialogo: [['tano', '¡Pibe! ¿Vos también lo viste? Salen del agua, te lo juro por mi vieja.', 0], ['vos', 'Tano, apagá la parrilla y vamos. Esto no es joda.', 1],
        ['tano', '¿Apagar? Tengo cuatro kilos de chorizo en las brasas. Si se me queman, me muero dos veces.', 0], ['negra', '…acá La Negra Martínez, Radio Rambla, 102.4. Si me escuchan: no salgan de sus casas. Repito: NO salgan.', 2],
        ['tano', '¿Oíste? Hasta La Negra dice que no salgamos. Y nosotros acá, en la rambla. Cubrime el carrito, que yo termino la tanda.', 0]] },
    pasos: [{ t: 'oleada', n: 8, txt: 'Limpiá la rambla' }, { t: 'defender', obj: 'parrilla', en: [304, 7], seg: 50, vida: 700, cada: 1.25, txt: 'Defendé la parrilla del Tano' }],
    outro: { tomas: [{ de: [298, 12, 2.4], a: [301, 10, 2.0], mira: [304, 7, 1.4] }],
      dialogo: [['tano', 'Salvaste los chorizos y me salvaste a mí, en ese orden.', 0], ['tano', 'Tomá: el facón de mi abuelo. Corta chorizo, corta cuero, corta lo que venga. Mantené apretado para la estocada.', 0], ['negra', 'A cualquiera que me escuche: hay un ómnibus de la 121 parado en la rambla con gente arriba. Si alguien puede, que lo ayude.', 0]] } },
  { id: 2, titulo: 'El ómnibus de las 4', mapa: 'rambla', ini: [268, 9], oleada: 2, premio: ['llave', 'escopeta'], pesos: 200,
    intro: { tomas: [{ de: [270, 16, 3.0], a: [266, 14, 2.6], mira: [262, 6, 2.0] }, { de: [256, 1, 2.0], a: [258, 2, 2.2], mira: [264, 6, 2.6] }],
      dialogo: [['washington', '¡Eh, gurí! Treinta años manejando la 121 y nunca vi gente tan maleducada.', 0], ['vos', '¿Cuántos tiene arriba, Don Washington?', 1],
        ['washington', 'Once pasajeros y una abuela con un carrito de feria. El motor anda, pero si freno me lo llenan de muertos.', 1], ['washington', 'Vos caminá al lado y bajalos. Yo voy despacito hasta el Puerto del Buceo. Si te alejás, me paro.', 0]] },
    pasos: [{ t: 'escoltar', desde: 262, hasta: 352, vida: 1400, txt: 'Escoltá el ómnibus hasta el Buceo' }],
    outro: { tomas: [{ de: [356, 14, 2.6], a: [352, 14, 2.4], mira: [350, 6, 1.8] }],
      dialogo: [['washington', 'Llegamos. La abuela dice que sos un divino y que te quiere presentar a la nieta.', 0], ['washington', 'Tomá la llave cruz del bondi, pesa como un muerto. Y la escopeta que el guarda tenía abajo del asiento… no preguntes.', 0],
        ['negra', 'Reporte de los pescadores del Buceo: algo grande sale de entre los contenedores. Dicen que tiene un anzuelo del tamaño de un ancla.', 0]] } },
  { id: 3, titulo: 'Pesca sin devolución', mapa: 'puerto', ini: [392, 6], oleada: 3, premio: ['cadena', 'cana'], pesos: 260,
    intro: { tomas: [{ de: [386, 10, 6], a: [392, 8, 5], mira: [416, -6, 1.5] }],
      dialogo: [['negra', 'Si estás en el puerto: la radio de los pescadores quedó prendida en el muelle. Llegá hasta ahí y avisame qué ves.', 0], ['vos', 'Voy. Si no vuelvo, pasá algo de Jaime Roos.', 0]] },
    pasos: [{ t: 'llegar', en: [414, -6], txt: 'Llegá a la radio del muelle', usar: 'Prender la radio', goteo: 1.6 }, { t: 'escena', ref: 'medio' }, { t: 'jefe', tipo: 'anzuelo', txt: 'Bajá a Don Anzuelo' }],
    medio: { tomas: [{ de: [416, -3, 2.4], a: [418, -5, 2.0], mira: [420, -12, 0.5] }], dialogo: [['negra', 'Te escucho clarito. Ojo, que el sonar de los pescadores marca algo enorme subiendo por la escollera…', 0], ['vos', 'Lo veo. Tiene una caña. Y me está mirando a mí.', 0]] },
    outro: { tomas: [{ de: [410, 2, 3], a: [412, 0, 2.6], mira: [418, -8, 0.8] }],
      dialogo: [['vos', 'Se quedó con las ganas, Don Anzuelo.', 0], ['negra', 'Me llegó todo por la radio. Agarrá la cadena del muelle y la caña de los pescadores: te van a servir.', 0],
        ['negra', 'Ahora necesito que vayas a Pocitos. Hay una médica encerrada en un edificio frente a la playa. Dice que sabe qué es esto.', 0]] } },
  { id: 4, titulo: 'Pocitos no duerme', mapa: 'pocitos', ini: [120, 4], oleada: 4, premio: ['hockey', 'machete'], pesos: 320,
    intro: { tomas: [{ de: [112, -6, 3], a: [118, -4, 4], mira: [140, 22, 10] }],
      dialogo: [['doctora', '¿Hola? ¿Me escuchás? Soy la doctora Fernández. Estoy en el séptimo piso, frente a la playa.', 0], ['doctora', 'No es un virus común: viene del agua. Tengo las muestras. Pero abajo hay una horda y no puedo bajar.', 0],
        ['vos', 'Aguante un poco, doctora. Le hago lugar.', 0]] },
    pasos: [{ t: 'aguantar', seg: 75, txt: 'Aguantá hasta que la horda afloje', cada: 0.75 }, { t: 'llegar', en: [146, 15], txt: 'Llegá a la puerta del edificio', usar: 'Abrir la puerta', goteo: 2.2 }],
    outro: { tomas: [{ de: [140, 10, 2.2], a: [143, 12, 2.0], mira: [146, 16, 2.0] }],
      dialogo: [['doctora', 'Gracias. Tomá: el palo de hockey de mi hija y el machete del portero. Prefiero no saber de dónde lo sacó.', 0], ['doctora', 'Para transmitir el aviso necesitamos la antena de Punta Carretas. Y para llegar, combustible.', 0],
        ['negra', 'Hay una camioneta de garrafas varada en Pocitos. Llena. Pero alguien más la quiere.', 0]] } },
  { id: 5, titulo: 'Supergás para todos', mapa: 'pocitos', ini: [96, 4], oleada: 5, premio: ['pala', 'metralleta'], pesos: 380,
    intro: { tomas: [{ de: [92, 12, 3], a: [96, 10, 2.6], mira: [100, 6, 1.2] }],
      dialogo: [['doctora', 'Ahí está la camioneta. Yo la arranco, vos no dejes que la toquen. Sesenta segundos y nos vamos.', 0], ['vos', 'Y si explota con todas esas garrafas…', 0], ['doctora', 'Si explota, no vas a tener tiempo de preocuparte.', 0]] },
    pasos: [{ t: 'defender', obj: 'camioneta', en: [100, 6], seg: 60, vida: 900, cada: 1.0, txt: 'Defendé la camioneta' }, { t: 'jefe', tipo: 'garrafero', txt: 'Bajá al Garrafero' }],
    outro: { tomas: [{ de: [96, 12, 2.4], a: [98, 11, 2.2], mira: [100, 6, 1.2] }],
      dialogo: [['doctora', 'Arrancó. Agarrá la pala de los obreros y esta metralleta que alguien dejó en la caja. Nos vemos en el faro.', 0], ['negra', 'Cuidado en Punta Carretas: la niebla no deja ver a dos metros. Y los muertos no necesitan ver.', 0]] } },
  { id: 6, titulo: 'Niebla en el faro', mapa: 'faro', ini: [540, 2], oleada: 6, premio: ['remo', 'rifle'], pesos: 440,
    intro: { tomas: [{ de: [532, 6, 3.5], a: [538, 2, 3.2], mira: [563, -10, 6] }],
      dialogo: [['negra', 'La antena está detrás del faro. Hay que prender el generador y sostener la señal mientras subo la potencia.', 0], ['vos', 'Con esta niebla no veo ni mis pies.', 0], ['negra', 'Seguí mi voz. Y la luz.', 0]] },
    pasos: [{ t: 'llegar', en: [556, -6], txt: 'Llegá al generador', usar: 'Prender el generador', goteo: 1.8 }, { t: 'llegar', en: [572, -2], txt: 'Subí a la antena', goteo: 1.6 },
      { t: 'defender', obj: 'antena', en: [574, 2], seg: 70, vida: 1000, cada: 0.9, txt: 'Sostené la señal de la antena' }],
    outro: { tomas: [{ de: [566, 8, 3], a: [570, 6, 4], mira: [574, 2, 8] }],
      dialogo: [['negra', '¡Estamos al aire en todo Montevideo! El remo es de los pescadores de la Punta y el rifle, del guardia del faro.', 0], ['doctora', 'Mal dato: el aviso también lo escucharon ellos. Se están juntando en la rambla. Como hinchada.', 0]] } },
  { id: 7, titulo: 'Barra brava', mapa: 'rambla', ini: [330, 6], oleada: 8, premio: ['hacha', 'fal'], pesos: 520,
    intro: { tomas: [{ de: [324, 10, 3], a: [328, 8, 2.6], mira: [346, 6, 2.5] }],
      dialogo: [['negra', 'Oigo bombos. Bengalas en la rambla. Esto ya no es una horda, es una tribuna.', 0], ['vos', 'Y yo sin entrada.', 0]] },
    pasos: [{ t: 'aguantar', seg: 45, txt: 'Aguantá a la barra', cada: 0.6 }, { t: 'jefe', tipo: 'bengala', txt: 'Apagá al Bengala' }],
    outro: { tomas: [{ de: [326, 12, 2.4], a: [328, 10, 2.2], mira: [334, 4, 1.2] }],
      dialogo: [['washington', '¡Gurí! Te traje el hacha de los bomberos y un FAL de no sé qué cuartel. Treinta años en la 121, ya nada me sorprende.', 0], ['doctora', 'El origen está en el Cerro. Algo bajó de ahí. Si cae lo que sea que los manda, se caen todos.', 0]] } },
  { id: 8, titulo: 'El Cerro baja', mapa: 'rambla', ini: [300, 6], oleada: 10, premio: ['motosierra', 'lanzagarrafas'], pesos: 0, final: true,
    intro: { tomas: [{ de: [296, 4, 5], a: [300, 2, 9], mira: [380, -60, 25] }],
      dialogo: [['negra', 'Montevideo, acá Radio Rambla. Faltan minutos para el amanecer. El Tano montó una barricada con el carrito. Washington trajo el bondi.', 0],
        ['tano', '¡Pibe! El último chorizo te lo guardé. Pero primero tenés que ganártelo.', 0], ['doctora', 'Y se viene él. El del Cerro. Sostené la barricada y después, todo lo que tengas.', 0]] },
    pasos: [{ t: 'defender', obj: 'barricada', en: [304, 7], seg: 60, vida: 1400, cada: 0.6, txt: 'Sostené la barricada' }, { t: 'jefe', tipo: 'cerro', txt: 'Tirá abajo al Zombi del Cerro' }],
    outro: { amanecer: true, tomas: [{ de: [300, 2, 3], a: [300, -4, 6], mira: [330, -80, 4] }, { de: [304, 12, 2.2], a: [302, 10, 2.0], mira: [304, 7, 1.4] }],
      dialogo: [['negra', 'Montevideo… sale el sol por el río. Se terminó la noche. Acá Radio Rambla, 102.4: estamos vivos.', 0], ['doctora', 'Con lo que juntamos, hay vacuna. Gracias a vos.', 1],
        ['washington', 'Mañana la 121 sale en hora, como siempre. Bueno, casi siempre.', 1], ['tano', 'Y el chorizo, pibe. Prometido. Con chimichurri.', 1], ['vos', 'Ya está, bo.', 0]] } }
];
export const ARMAS_HIST_INI = ['pistola', 'termo'];

// ---------- retratos pintados (canvas, 2x) ----------
const _ret = {};
export function retrato(id) {
  if (_ret[id]) return _ret[id];
  const c = document.createElement('canvas'); c.width = c.height = 192; const g = c.getContext('2d'); const E = ELENCO[id];
  const fondo = g.createRadialGradient(96, 80, 10, 96, 96, 120); fondo.addColorStop(0, E.color); fondo.addColorStop(1, '#120e18'); g.fillStyle = fondo; g.fillRect(0, 0, 192, 192);
  g.globalAlpha = 0.16; g.fillStyle = '#fff'; for (let y = 0; y < 192; y += 6) g.fillRect(0, y, 192, 2); g.globalAlpha = 1; // tramado de afiche
  const P = (f, s, w = 4) => { g.fillStyle = f; g.fill(); if (s) { g.lineWidth = w; g.strokeStyle = s; g.stroke(); } };
  const elipse = (x, y, rx, ry, f, s, w) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 6.283); P(f, s, w); };
  const piel = { tano: '#d89a70', negra: '#7a4a30', washington: '#e0b090', doctora: '#f0c8a8', vos: '#c89070' }[id];
  // torso / ropa
  g.beginPath(); g.moveTo(22, 192); g.quadraticCurveTo(30, 132, 96, 128); g.quadraticCurveTo(162, 132, 170, 192); g.closePath();
  P({ tano: '#f2f2ea', negra: '#2a2a38', washington: '#2c4a7a', doctora: '#f4f6f8', vos: '#2e3a2c' }[id], '#0c0a10', 5);
  if (id === 'tano') { g.beginPath(); g.moveTo(70, 140); g.lineTo(122, 140); g.lineTo(128, 192); g.lineTo(64, 192); P('#c03028', '#0c0a10', 4); } // delantal
  if (id === 'doctora') { g.beginPath(); g.moveTo(80, 132); g.quadraticCurveTo(70, 168, 92, 176); g.lineWidth = 4; g.strokeStyle = '#3a4048'; g.stroke(); elipse(94, 178, 7, 7, '#9aa4ae', '#0c0a10', 3); }
  if (id === 'washington') { g.fillStyle = '#d8b050'; g.fillRect(112, 150, 22, 8); }
  if (id === 'vos') { g.beginPath(); g.moveTo(40, 192); g.quadraticCurveTo(36, 120, 96, 112); g.quadraticCurveTo(156, 120, 152, 192); g.lineWidth = 10; g.strokeStyle = '#3c4a38'; g.stroke(); }
  // cuello y cabeza
  g.fillStyle = piel; g.fillRect(80, 112, 32, 26);
  if (id === 'negra') { for (let k = 0; k < 16; k++) { const a = k / 16 * 6.283; elipse(96 + Math.cos(a) * 46, 70 + Math.sin(a) * 40, 22, 22, '#1a1012'); } } // pelo afro
  if (id === 'doctora') { elipse(96, 64, 48, 46, '#4a2a1a', '#0c0a10', 4); elipse(140, 92, 12, 22, '#4a2a1a', '#0c0a10', 3); }
  elipse(96, 78, 38, 44, piel, '#0c0a10', 5);
  // ojos y cejas
  const ojo = (x) => { elipse(x, 76, 6, 4.5, '#fff'); elipse(x + 1, 76, 3, 3.2, '#1a1410'); };
  ojo(80); ojo(112); g.lineWidth = 4.5; g.strokeStyle = id === 'washington' ? '#c8c8c8' : '#20140c';
  g.beginPath(); g.moveTo(70, 66); g.lineTo(88, id === 'vos' ? 68 : 64); g.moveTo(104, id === 'vos' ? 68 : 64); g.lineTo(122, 66); g.stroke();
  // nariz y boca
  g.beginPath(); g.moveTo(96, 80); g.lineTo(91, 94); g.lineTo(98, 95); g.lineWidth = 3; g.strokeStyle = '#0c0a1080'; g.stroke();
  g.beginPath(); if (id === 'tano' || id === 'washington') { g.moveTo(84, 106); g.quadraticCurveTo(96, 102, 108, 106); } else { g.moveTo(84, 104); g.quadraticCurveTo(96, 112, 108, 104); } g.lineWidth = 3.5; g.strokeStyle = '#3a1410'; g.stroke();
  if (id === 'negra' || id === 'doctora') { g.beginPath(); g.moveTo(85, 104); g.quadraticCurveTo(96, 111, 107, 104); g.lineWidth = 3; g.strokeStyle = '#b02848'; g.stroke(); }
  // detalles de cada uno
  if (id === 'tano') { // bigote, boina
    g.beginPath(); g.moveTo(78, 100); g.quadraticCurveTo(96, 90, 114, 100); g.quadraticCurveTo(96, 96, 78, 100); P('#3a2a20', '#1a100c', 3);
    g.beginPath(); g.ellipse(96, 42, 46, 14, -0.1, 0, 6.283); P('#2a2a30', '#0c0a10', 4); elipse(96, 34, 6, 4, '#2a2a30');
  }
  if (id === 'negra') { // auriculares con micrófono y aros
    g.beginPath(); g.arc(96, 72, 48, Math.PI * 1.08, Math.PI * 1.92); g.lineWidth = 8; g.strokeStyle = '#1c1c22'; g.stroke();
    elipse(52, 80, 11, 16, '#e83a7a', '#0c0a10', 3); elipse(140, 80, 11, 16, '#e83a7a', '#0c0a10', 3);
    g.beginPath(); g.moveTo(50, 92); g.quadraticCurveTo(56, 116, 82, 110); g.lineWidth = 3.5; g.strokeStyle = '#1c1c22'; g.stroke(); elipse(84, 110, 5, 4, '#333');
    g.beginPath(); g.arc(60, 104, 7, 0, 6.283); g.lineWidth = 3; g.strokeStyle = '#ffd040'; g.stroke();
  }
  if (id === 'washington') { // lentes, gorra de chofer, canas
    g.lineWidth = 3; g.strokeStyle = '#1a1a1a'; g.strokeRect(68, 69, 24, 15); g.strokeRect(100, 69, 24, 15); g.beginPath(); g.moveTo(92, 75); g.lineTo(100, 75); g.stroke();
    elipse(60, 70, 8, 16, '#d8d8d8'); elipse(132, 70, 8, 16, '#d8d8d8');
    g.beginPath(); g.moveTo(52, 50); g.quadraticCurveTo(96, 14, 140, 50); g.lineTo(142, 56); g.lineTo(50, 56); g.closePath(); P('#1f3a66', '#0c0a10', 4);
    g.fillStyle = '#0e1a30'; g.fillRect(52, 54, 88, 7); g.fillStyle = '#d8b050'; g.font = 'bold 14px sans-serif'; g.textAlign = 'center'; g.fillText('121', 96, 48);
  }
  if (id === 'doctora') { g.lineWidth = 3; g.strokeStyle = '#2a2a3a'; g.beginPath(); g.arc(80, 77, 11, 0, 6.283); g.moveTo(123, 77); g.arc(112, 77, 11, 0, 6.283); g.moveTo(91, 76); g.lineTo(101, 76); g.stroke(); }
  if (id === 'vos') { // gorro de lana celeste y barba de tres días
    g.beginPath(); g.moveTo(56, 62); g.quadraticCurveTo(96, 6, 136, 62); g.closePath(); P('#6ab0e0', '#0c0a10', 4); g.fillStyle = '#4a90c8'; g.fillRect(56, 54, 80, 10);
    g.globalAlpha = 0.25; g.fillStyle = '#2a1a10'; g.beginPath(); g.ellipse(96, 104, 30, 16, 0, 0, Math.PI); g.fill(); g.globalAlpha = 1;
  }
  g.lineWidth = 6; g.strokeStyle = '#0c0a10'; g.strokeRect(3, 3, 186, 186);
  return (_ret[id] = c.toDataURL());
}

// ---------- utilería de la historia (pocos materiales, sin luces nuevas: no recompila shaders) ----------
function utileria(tipo) {
  const g = new THREE.Group(); const M = (c, e = 0) => new THREE.MeshLambertMaterial({ color: c, emissive: e });
  const caja = (w, h, d, x, y, z, m) => { const k = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); k.position.set(x, y, z); g.add(k); return k; };
  if (tipo === 'parrilla' || tipo === 'barricada') { // carrito chorizero: rojo y blanco, brasas, toldo
    const rojo = M(0xb8261e), blanco = M(0xeae4d6), metal = M(0x55585e), brasa = M(0x301008, 0xff5a10);
    caja(2.0, 0.9, 1.0, 0, 0.75, 0, rojo); caja(2.04, 0.18, 1.04, 0, 1.25, 0, blanco); caja(1.7, 0.08, 0.8, 0, 1.36, 0, metal); caja(1.6, 0.04, 0.7, 0, 1.33, 0, brasa);
    for (const x of [-0.9, 0.9]) caja(0.06, 1.5, 0.06, x, 2.1, -0.45, metal);
    caja(2.2, 0.06, 1.3, 0, 2.86, -0.1, rojo).rotation.x = 0.12; caja(2.2, 0.25, 0.04, 0, 2.7, 0.5, blanco);
    for (const x of [-0.6, 0.6]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 12), metal); r.rotation.x = Math.PI / 2; r.position.set(x, 0.3, 0.52); g.add(r); }
    for (let k = 0; k < 6; k++) { const ch = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.22, 2, 6), M(0x8a2a1a, 0x401008)); ch.rotation.z = Math.PI / 2; ch.position.set(-0.6 + k * 0.24, 1.42, (k % 2) * 0.12 - 0.06); g.add(ch); }
    if (tipo === 'barricada') { const mad = M(0x6a4a2a); for (let k = 0; k < 5; k++) { const t = caja(3.2, 0.25, 0.25, (k - 2) * 0.4, 0.3 + k * 0.28, 1.0, mad); t.rotation.z = (k % 2 ? 0.2 : -0.2); } caja(1.2, 1.0, 1.0, 2.2, 0.5, 0.6, M(0x8a8a90)); caja(1.0, 0.8, 1.0, -2.2, 0.4, 0.7, M(0x2a5a8a)); }
    g.userData.fuego = [0, 1.45, 0]; g.userData.r = tipo === 'barricada' ? 2.0 : 1.2;
  } else if (tipo === 'camioneta') {
    const A = crearAuto('pickup', 0xe06a1a, 21, {}); g.add(A.g); A.g.position.y = 0;
    const gas = M(0xd8c020), gas2 = M(0x2a6ab0);
    for (let k = 0; k < 6; k++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.62, 10), k % 2 ? gas : gas2); c.position.set(-1.9 + (k % 3) * 0.42, 1.0, (k < 3 ? -0.4 : 0.4)); g.add(c); }
    g.userData.r = 2.2; g.userData.caja = [2.6, 1.0];
  } else if (tipo === 'antena') { // torre reticulada, con luz roja que titila
    const metal = M(0xb0b4ba), rojoL = M(0x400000, 0xff2010);
    for (const [x, z] of [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]]) { const p = caja(0.1, 14, 0.1, x * 0.5, 7, z * 0.5, metal); p.rotation.z = -x * 0.05; p.rotation.x = z * 0.05; }
    for (let y = 1; y < 14; y += 1.4) caja(0.9 - y * 0.03, 0.06, 0.9 - y * 0.03, 0, y, 0, metal);
    caja(1.6, 1.2, 1.2, 1.6, 0.6, 0, M(0x5a6a5a)); const l = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), rojoL); l.position.y = 14.2; g.add(l); g.userData.luz = l;
    g.userData.r = 1.6;
  }
  return g;
}
function baliza() { // columna de luz para «llegar»
  const g = new THREE.Group();
  const cil = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 30, 20, 1, true), new THREE.MeshBasicMaterial({ color: 0xffb030, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  cil.position.y = 15; g.add(cil);
  const aro = new THREE.Mesh(new THREE.RingGeometry(1.5, 1.85, 32), new THREE.MeshBasicMaterial({ color: 0xffd060, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  aro.rotation.x = -Math.PI / 2; aro.position.y = 0.06; g.add(aro); g.userData.aro = aro;
  return g;
}

// ---------- el motor de la historia ----------
export function crearHistoria(G) {
  const $ = id => document.getElementById(id);
  const raiz = new THREE.Group(); G.scene.add(raiz);
  let esperaT = 0, cap = null, paso = -1, P = null, pT = 0, objeto = null, bal = null, bus = null, ruta = null, rutaK = 0, spawnT = 0, jefeZ = null, escena = null, enCurso = false, usarListo = false, falloT = 0;
  const OBJ = G.OBJ, _v = new THREE.Vector3(), _w = new THREE.Vector3(), _q = {};
  const H = {
    get activo() { return enCurso; }, get cap() { return cap; }, get paso() { return P; }, get escena() { return escena; },
    get bus() { return bus; }, get pasoN() { return paso; }, get objeto() { return objeto; },
    empezar, sim, cuadro, limpiar, saltarEscena: () => escena && terminarEscena(), seguirDialogo: () => escena && seguir(),
    // pruebas: completar el paso actual al toque
    forzarPaso() { if (P) completar(); }
  };
  function limpiar() {
    while (raiz.children.length) raiz.remove(raiz.children[0]);
    objeto = bal = bus = ruta = null; OBJ.activo = false; jefeZ = null; escena = null; P = null; paso = -1; G.camEsc(null); G.interactuar(null);
    $('hist-obj').classList.remove('on'); $('hist-flecha').classList.remove('on'); $('hist-usar').classList.add('oculto'); $('dialogo').classList.remove('on'); $('franjas').classList.remove('on');
  }
  function empezar(c) {
    limpiar(); cap = c; enCurso = true; G.oleada(c.oleada);
    const d = c.pasos.find(q => q.t === 'defender'); if (d) colocar(d);
    if (c.intro) iniciarEscena(c.intro, () => siguientePaso()); else siguientePaso();
  }
  // ----- escenas
  function iniciarEscena(E, alTerminar) {
    escena = { E, k: 0, t: 0, letras: 0, toma: E.dialogo[0] ? E.dialogo[0][2] || 0 : 0, tomaT: 0, fin: alTerminar };
    G.estado('escena'); G.capa(false); $('franjas').classList.add('on'); $('dialogo').classList.add('on');
    if (E.amanecer) G.amanecer();
    mostrarLinea();
  }
  function mostrarLinea() {
    const [quien, txt, toma] = escena.E.dialogo[escena.k], E = ELENCO[quien];
    if ((toma || 0) !== escena.toma) { escena.toma = toma || 0; escena.tomaT = 0; }
    $('dlg-retrato').style.backgroundImage = `url(${retrato(quien)})`; $('dlg-nombre').textContent = E.nombre; $('dlg-nombre').style.color = E.color; $('dlg-rol').textContent = E.rol;
    $('dlg-texto').textContent = ''; escena.letras = 0; escena.t = 0; G.sonido('dialogo');
    $('dlg-pasos').textContent = `${escena.k + 1} / ${escena.E.dialogo.length}`;
  }
  function seguir() {
    const txt = escena.E.dialogo[escena.k][1];
    if (escena.letras < txt.length) { escena.letras = txt.length; $('dlg-texto').textContent = txt; return; } // primero completa el texto
    escena.k++; if (escena.k >= escena.E.dialogo.length) terminarEscena(); else mostrarLinea();
  }
  function terminarEscena() {
    const fin = escena.fin; escena = null; G.camEsc(null);
    $('franjas').classList.remove('on'); $('dialogo').classList.remove('on');
    if (enCurso) { G.estado('jugando'); G.capa(true); G.reanudar(); }
    fin && fin();
  }
  function camaraEscena(dt) {
    const E = escena.E, T = E.tomas[Math.min(escena.toma, E.tomas.length - 1)]; escena.tomaT += dt;
    const k = Math.min(1, escena.tomaT / 9), s = k * k * (3 - 2 * k);
    G.aMundo(T.de[0] + (T.a[0] - T.de[0]) * s, T.de[1] + (T.a[1] - T.de[1]) * s, _v); _v.y = G.piso(T.de[1] + (T.a[1] - T.de[1]) * s) + T.de[2] + (T.a[2] - T.de[2]) * s;
    G.aMundo(T.mira[0], T.mira[1], _w); _w.y = G.piso(T.mira[1]) + T.mira[2];
    const dx = _w.x - _v.x, dy = _w.y - _v.y, dz = _w.z - _v.z;
    G.camEsc({ pos: _v, yaw: Math.atan2(-dx, -dz), pitch: Math.atan2(dy, Math.hypot(dx, dz)) });
  }
  // ----- pasos
  function siguientePaso() {
    paso++; jefeZ = null; OBJ.activo = false; if (bal) { raiz.remove(bal); bal = null; } $('hist-usar').classList.add('oculto'); G.interactuar(null); usarListo = false;
    if (paso >= cap.pasos.length) { if (cap.outro) iniciarEscena(cap.outro, terminarCapitulo); else terminarCapitulo(); return; }
    P = cap.pasos[paso]; pT = 0; spawnT = 1.5;
    if (P.t === 'escena') { iniciarEscena(cap[P.ref], siguientePaso); return; }
    G.sonido('objetivo'); G.mensaje(P.txt, `Capítulo ${cap.id} · ${cap.titulo}`);
    if (P.t === 'oleada') { G.cola(P.n); }
    if (P.t === 'defender') {
      colocar(P);
      ponerObjetivo(objeto.position.x, objeto.position.z, objeto.userData.r, P.vida, objeto.userData.caja, objeto.rotation.y);
    }
    if (P.t === 'llegar') { bal = baliza(); G.aMundo(P.en[0], P.en[1], bal.position); bal.position.y = G.piso(P.en[1]); raiz.add(bal); }
    if (P.t === 'escoltar') armarBus();
    if (P.t === 'jefe') { G.jefe(P.tipo); jefeZ = G.jefeZ(); }
  }
  function colocar(Q) { // la utilería del objetivo ya está en escena desde la intro
    if (!objeto || objeto.userData.tipo !== Q.obj) { if (objeto) raiz.remove(objeto); objeto = utileria(Q.obj); objeto.userData.tipo = Q.obj; raiz.add(objeto); }
    const m = G.muestra(Q.en[0]); G.aMundo(Q.en[0], Q.en[1], objeto.position); objeto.position.y = G.piso(Q.en[1]); objeto.rotation.y = Math.atan2(-m.t.z, m.t.x);
  }
  function ponerObjetivo(x, z, r, vida, caja, rot) {
    Object.assign(OBJ, { activo: true, x, z, r, vida, vidaMax: vida, caja: caja || null, rot: rot || 0, golpeT: 0 });
  }
  function completar() {
    const t = P.t; G.sonido('objetivo');
    if (t === 'defender' || t === 'aguantar') G.limpiarHorda(t === 'defender');
    if (t === 'escoltar' && bus) bus.userData.v = 0;
    siguientePaso();
  }
  function fallar(motivo) { if (!enCurso) return; enCurso = false; OBJ.activo = false; G.fallo(motivo); }
  function terminarCapitulo() { enCurso = false; OBJ.activo = false; G.capituloListo(cap); }
  // ----- ómnibus
  function armarBus() {
    bus = crearBus(9); raiz.add(bus); ruta = [];
    for (let i = P.desde; i <= P.hasta; i++) { // carril libre (los autos tirados de la rambla quedan al costado)
      let d = 8.5; for (const c of [8.5, 7, 10, 5.5, 4]) { let ok = true; for (const s of [-1, 0, 1]) { G.aMundo(i + s * 2.5, c, _v); if (!G.libre(_v.x, _v.z, 1.7)) { ok = false; break; } } if (ok) { d = c; break; } }
      ruta.push(d);
    }
    for (let k = 1; k < ruta.length - 1; k++) ruta[k] = (ruta[k - 1] + ruta[k] * 2 + ruta[k + 1]) / 4; // suaviza los cambios de carril
    rutaK = 0; bus.userData.v = 0; ponerBus(0); ponerObjetivo(bus.position.x, bus.position.z, 0, P.vida, [6.1, 1.35], bus.rotation.y);
  }
  function ponerBus(k) {
    const i0 = Math.floor(k), f = k - i0, d = ruta[Math.min(ruta.length - 1, i0)] * (1 - f) + ruta[Math.min(ruta.length - 1, i0 + 1)] * f;
    G.aMundo(P.desde + k, d, bus.position); bus.position.y = 1.2;
    const m = G.muestra(P.desde + k), d2 = ruta[Math.min(ruta.length - 1, i0 + 3)] - d;
    bus.rotation.y = Math.atan2(-m.t.z, m.t.x) + Math.atan2(-d2, 5.1) * 0.6; // apunta un poco hacia el carril que viene
  }
  function empujarCaja(p, rad) { // saca un punto (jugador o zombi) de la caja del objetivo (OBB en el piso)
    const c = Math.cos(OBJ.rot), s = Math.sin(OBJ.rot), dx = p.x - OBJ.x, dz = p.z - OBJ.z;
    const lx = dx * c - dz * s, lz = dx * s + dz * c, hx = OBJ.caja[0] + rad, hz = OBJ.caja[1] + rad;
    if (Math.abs(lx) >= hx || Math.abs(lz) >= hz) return false;
    let nx = lx, nz = lz; if (hx - Math.abs(lx) < hz - Math.abs(lz)) nx = Math.sign(lx) * hx; else nz = Math.sign(lz) * hz;
    p.x = OBJ.x + nx * c + nz * s; p.z = OBJ.z - nx * s + nz * c; return true;
  }
  // ----- simulación (paso fijo, solo jugando)
  function sim(dt) {
    if (!enCurso || !P || escena) return;
    pT += dt;
    const J = G.J;
    if (OBJ.activo) {
      if (OBJ.caja) { empujarCaja(J.pos, 0.45); for (const z of G.zombis()) if (z.vivo && !z.T.jefe) { const p = z.g.position; if (Math.abs(p.x - OBJ.x) < 9 && Math.abs(p.z - OBJ.z) < 9) empujarCaja(p, 0.35); } }
      else { const dx = J.pos.x - OBJ.x, dz = J.pos.z - OBJ.z, d = Math.hypot(dx, dz), r = OBJ.r + 0.45; if (d < r && d > 0.01) { J.pos.x = OBJ.x + dx / d * r; J.pos.z = OBJ.z + dz / d * r; } }
      if (OBJ.vida <= 0) { fallar(P.t === 'escoltar' ? 'Se llenó el ómnibus de muertos' : P.obj === 'parrilla' ? 'Se perdió la parrilla del Tano' : P.obj === 'antena' ? 'Se cayó la señal' : 'Perdiste lo que tenías que cuidar'); return; }
    }
    const t = P.t;
    if (t === 'oleada') { if (G.quedan() === 0 && pT > 1) completar(); }
    else if (t === 'defender' || t === 'aguantar') {
      if ((spawnT -= dt) <= 0) { spawnT = P.cada * (0.7 + Math.random() * 0.6); if (G.vivos() < G.maxZ()) G.spawnHist(t === 'defender' && Math.random() < 0.65, P.oleada); }
      if (pT >= P.seg) completar();
    } else if (t === 'llegar') {
      if (P.goteo && (spawnT -= dt) <= 0) { spawnT = P.goteo * (0.7 + Math.random() * 0.6); if (G.vivos() < 14) G.spawnHist(false); }
      const d = Math.hypot(J.pos.x - bal.position.x, J.pos.z - bal.position.z);
      if (d < 3.2) {
        if (!P.usar) completar();
        else if (!usarListo) { usarListo = true; const b = $('hist-usar'); b.innerHTML = `${G.tecla()} ${P.usar}`; b.classList.remove('oculto'); G.interactuar(() => { if (usarListo) { usarListo = false; G.sonido('objetivo'); completar(); } }); }
      } else if (usarListo) { usarListo = false; $('hist-usar').classList.add('oculto'); G.interactuar(null); }
    } else if (t === 'escoltar') {
      const dJ = Math.hypot(J.pos.x - bus.position.x, J.pos.z - bus.position.z);
      let pegados = 0; for (const z of G.zombis()) if (z.vivo && z.atacaObj) pegados++;
      const quiere = dJ < 16 && pegados === 0 ? 2.4 : 0; bus.userData.v += (quiere - bus.userData.v) * Math.min(1, dt * 1.5);
      rutaK = Math.min(ruta.length - 1, rutaK + bus.userData.v * dt / 1.68); ponerBus(rutaK);
      OBJ.x = bus.position.x; OBJ.z = bus.position.z; OBJ.rot = bus.rotation.y;
      if ((spawnT -= dt) <= 0) { spawnT = 1.1 * (0.7 + Math.random() * 0.6); if (G.vivos() < G.maxZ()) G.spawnHist(Math.random() < 0.55); }
      if (falloT > 0) falloT -= dt; else if (dJ >= 16) { falloT = 4; G.aviso('El ómnibus se paró: volvé al lado'); } else if (pegados > 0) { falloT = 4; G.aviso('¡Te están frenando el bondi!'); }
      if (rutaK >= ruta.length - 1.01) completar();
    } else if (t === 'jefe') {
      if (jefeZ && !jefeZ.vivo && pT > 1) { jefeZ = null; G.limpiarHorda(true); P = { t: 'espera', txt: '' }; esperaT = 2.6; }
    } else if (t === 'espera') {
      if ((esperaT -= dt) <= 0) siguientePaso();
    }
  }
  // ----- por cuadro: escena, HUD del objetivo, flecha
  let hudT = 0;
  function cuadro(dt) {
    if (escena) {
      camaraEscena(dt);
      const txt = escena.E.dialogo[escena.k][1];
      if (escena.letras < txt.length) { escena.letras = Math.min(txt.length, escena.letras + dt * 52); $('dlg-texto').textContent = txt.slice(0, escena.letras | 0); }
      else if ((escena.t += dt) > 3.2 + txt.length * 0.045 && G.autoDialogo()) seguir(); // sigue solo después de un rato
    }
    if (objeto && objeto.userData.fuego && Math.random() < dt * 9) { const p = objeto.userData.fuego; G.llama(objeto.position.x + (Math.random() - .5) * 1.2, objeto.position.y + p[1], objeto.position.z + (Math.random() - .5) * 0.5); }
    if (objeto && objeto.userData.luz) objeto.userData.luz.visible = (performance.now() / 600 | 0) % 2 === 0;
    if (bal) { bal.userData.aro.rotation.z += dt; const s = 1 + Math.sin(performance.now() / 300) * 0.08; bal.userData.aro.scale.set(s, s, s); }
    if (!enCurso || !P || escena) { $('hist-obj').classList.remove('on'); $('hist-flecha').classList.remove('on'); return; }
    if ((hudT -= dt) > 0) return; hudT = 0.1;
    const t = P.t; let sub = '', k = -1;
    if (t === 'jefe' || t === 'espera') { $('hist-obj').classList.remove('on'); $('hist-flecha').classList.remove('on'); return; }
    if (t === 'oleada') sub = `Quedan ${G.quedan()}`;
    else if (t === 'defender' || t === 'aguantar') { const r = Math.max(0, P.seg - pT); sub = `${t === 'defender' ? 'Aguantá' : 'Quedan'} ${Math.ceil(r)} s`; k = OBJ.activo ? OBJ.vida / OBJ.vidaMax : -1; }
    else if (t === 'llegar') sub = `${Math.round(Math.hypot(G.J.pos.x - bal.position.x, G.J.pos.z - bal.position.z))} m`;
    else if (t === 'escoltar') { sub = `${Math.round(rutaK / (ruta.length - 1) * 100)}% del recorrido`; k = OBJ.vida / OBJ.vidaMax; }
    else if (t === 'jefe') sub = 'Jefe';
    $('hist-obj').classList.add('on'); $('ho-titulo').textContent = P.txt || ''; $('ho-sub').textContent = sub;
    $('ho-barra').style.display = k >= 0 ? '' : 'none'; if (k >= 0) { $('ho-rel').style.width = Math.max(0, k * 100) + '%'; $('ho-barra').classList.toggle('baja', k < 0.3); }
    // flecha al objetivo cuando está fuera de la pantalla
    let tx = null, tz = null; if (bal) { tx = bal.position.x; tz = bal.position.z; } else if (OBJ.activo) { tx = OBJ.x; tz = OBJ.z; }
    const f = $('hist-flecha');
    if (tx === null) { f.classList.remove('on'); return; }
    const J = G.J, dx = tx - J.pos.x, dz = tz - J.pos.z, ang = Math.atan2(-dx, -dz) - J.yaw, a = Math.atan2(Math.sin(ang), Math.cos(ang)), dist = Math.hypot(dx, dz);
    if (Math.abs(a) < 0.62 || dist < 4) { f.classList.remove('on'); return; }
    f.classList.add('on'); f.style.setProperty('--a', (-a) + 'rad'); f.querySelector('span').textContent = Math.round(dist) + ' m';
  }
  return H;
}
