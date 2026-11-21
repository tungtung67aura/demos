// CATÁLOGO DE AUDIO: todos los IDs que el juego dispara, con su categoría y descripción.
// El juego nunca nombra archivos: llama sonar('golpe.pina'), musica('mus.nivel2'), ambiente('amb.feria'), voz(...).
// Qué archivo suena para cada ID se define en audio/manifest.js (lo llena tools/audio-manifest.mjs leyendo la carpeta audio/).
// sinte: sonido sintetizado original que se usa SOLO si el ID todavía no tiene archivo (ver AJUSTES.sinteDeRespaldo).
import { FRASES, ENEMIGOS, JUGADORES } from './datos.js';

export const CATEGORIAS = {
  golpes: 'Golpes del cuerpo (piñas, patadas, especiales)',
  impactos: 'Impactos contra cuerpos, piso y objetos',
  armas: 'Golpes y roturas de armas del piso',
  items: 'Juntar objetos, comida y plata',
  mov: 'Movimientos (salto, aire, agarres)',
  enemigos: 'Sonidos propios de enemigos y jefes (no voces)',
  eventos: 'Eventos del nivel y del juego',
  ambiente: 'Loops ambientales por nivel y sonidos del entorno',
  musica: 'Música (loops)',
  voces: 'Voces por personaje (gritos, dolor, KO)',
  frases: 'Frases de los globos de diálogo (una por texto)',
  ui: 'Menús',
};
const C = {}; // id -> { cat, desc, sinte?, vol?, loop? }
const add = (cat, id, desc, o = {}) => { C[id] = Object.assign({ cat, desc }, o); };

// --- golpes
add('golpes', 'golpe.pina', 'Piña (jab / directo)', { sinte: 'pina' });
add('golpes', 'golpe.gancho', 'Gancho / remate que tumba', { sinte: 'fuerte' });
add('golpes', 'golpe.patada', 'Patada', { sinte: 'patada' });
add('golpes', 'golpe.voladora', 'Patada voladora', { sinte: 'patada' });
add('golpes', 'golpe.especial', 'Especial giratorio', { sinte: 'fuerte' });
add('golpes', 'golpe.rodilla', 'Rodillazo en el agarre', { sinte: 'pina' });
add('golpes', 'golpe.revoleo', 'Revoleo (el enemigo sale volando)', { sinte: 'fuerte' });
add('golpes', 'golpe.embestida', 'Embestida de jefe / changuito', { sinte: 'fuerte' });
add('golpes', 'golpe.barrida', 'Barrida al piso (El Rata)', { sinte: 'patada' });
add('golpes', 'golpe.contra', 'Contragolpe del boxeador', { sinte: 'fuerte' });
// --- impactos
add('impactos', 'impacto.piso', 'Cuerpo contra el piso', { sinte: 'piso' });
add('impactos', 'impacto.rebote', 'Rebote del cuerpo', { sinte: 'piso' });
add('impactos', 'impacto.bloqueo', 'Golpe bloqueado (Patovica / Bocha)', { sinte: 'metal' });
add('impactos', 'impacto.madera', 'Golpe a madera (cajón, mesa, puesto)', { sinte: 'madera' });
add('impactos', 'impacto.metal', 'Golpe a metal (tacho, revistero)', { sinte: 'metal' });
add('impactos', 'impacto.plastico', 'Golpe a plástico (contenedor, conservadora)', { sinte: 'madera' });
add('impactos', 'impacto.carton', 'Golpe a cartón', { sinte: 'madera' });
add('impactos', 'impacto.barro', 'Maceta que se rompe', { sinte: 'botella' });
add('impactos', 'impacto.vidrio', 'Vidrio roto (botella, cajón de cerveza)', { sinte: 'botella' });
add('impactos', 'impacto.explosion', 'Explosión de garrafa', { sinte: 'explosion' });
add('impactos', 'impacto.fruta', 'Naranja / tomate que revienta', { sinte: 'pina' });
add('impactos', 'impacto.agua', 'Salpicón (ola, charco)', {});
add('impactos', 'impacto.fuego', 'Quemadura en la parrilla', {});
add('impactos', 'impacto.contenedor', 'Contenedor que choca a alguien', { sinte: 'fuerte' });
// --- armas
for (const [k, d] of [['palo', 'Palo / pata de silla'], ['botella', 'Botella'], ['termo', 'Termo'], ['silla', 'Silla de bar'], ['cano', 'Caño'], ['escoba', 'Escoba'], ['ladrillo', 'Ladrillo'], ['cajon', 'Cajón de feria'], ['corvina', 'Corvina (pescado)'], ['bandeja', 'Bandeja de mozo'],
  ['cucharon', 'Cucharón de Doña Chola'], ['maquina', 'Máquina de boletos del Guarda'], ['pinza', 'Pinza del Parrillero'], ['paraguas', 'Paraguas del Capo'], ['faca', 'Faca / cuchillo (tajo)']])
  add('armas', 'arma.' + k, 'Golpe con ' + d, { sinte: k === 'botella' ? 'botella' : k === 'faca' ? 'tajo' : k === 'termo' || k === 'cano' || k === 'bandeja' || k === 'maquina' ? 'metal' : 'madera' });
add('armas', 'arma.rompe', 'Arma que se rompe (madera)', { sinte: 'madera' });
add('armas', 'arma.tiro', 'Tirar un arma (zumbido)', { sinte: 'aire' });
// --- items
add('items', 'item.arma', 'Juntar un arma', { sinte: 'item' });
add('items', 'item.comida', 'Comer (bizcochos, chivito, torta frita...)', { sinte: 'come' });
add('items', 'item.mate', 'Tomar mate (carga MANO)', { sinte: 'come' });
add('items', 'item.plata', 'Juntar plata ($U): monedas y billetes', { sinte: 'plata' });
add('items', 'item.robado', 'Te roban algo (El Rata)', {});
// --- movimientos
add('mov', 'mov.aire', 'Golpe al aire (zumbido)', { sinte: 'aire' });
add('mov', 'mov.salto', 'Salto', { sinte: 'aire' });
add('mov', 'mov.aterriza', 'Caer de un salto', {});
add('mov', 'mov.agarre', 'Agarrar a alguien', { sinte: 'agarra' });
add('mov', 'mov.arrebato', 'Manotazo para robar', { sinte: 'agarra' });
add('mov', 'mov.esquive', 'Esquive / salto hacia atrás', {});
add('mov', 'mov.levanta', 'Levantarse del piso', {});
// --- enemigos (no voces)
add('enemigos', 'enem.aviso', 'Aviso "!" antes de un golpe fuerte', {});
add('enemigos', 'enem.gomera', 'Gomera del Gurí', { sinte: 'aire' });
add('enemigos', 'enem.tambor.toque', 'Toque de tambor (buff a los demás)', {});
add('enemigos', 'enem.tambor.golpe', 'Tamborazo (onda)', { sinte: 'fuerte' });
add('enemigos', 'enem.cana.lanza', 'Lanzar la caña de pescar', { sinte: 'aire' });
add('enemigos', 'enem.cana.engancha', 'El anzuelo te engancha', { sinte: 'agarra' });
add('enemigos', 'enem.bandeja.vuela', 'Bandeja girando en el aire', {});
add('enemigos', 'enem.silbato', 'Silbato del Guarda', {});
add('enemigos', 'enem.changuito', 'Ruedas del changuito', {});
add('enemigos', 'enem.parrilla.fuego', 'Llamarada de la parrilla', {});
add('enemigos', 'enem.chorizo', 'Chorizo que rebota', {});
add('enemigos', 'enem.paraguas.abre', 'Paraguas que se abre (bloquea)', {});
// --- eventos
add('eventos', 'evento.dale', '¡DALE! (avanzar)', { sinte: 'dale' });
add('eventos', 'evento.nivel.inicio', 'Cartel de nivel', {});
add('eventos', 'evento.nivel.fin', 'Nivel terminado', { sinte: 'dale' });
add('eventos', 'evento.jefe.aparece', 'Aparece el jefe', {});
add('eventos', 'evento.jefe.ko', 'Jefe derrotado (cámara lenta)', { sinte: 'ko' });
add('eventos', 'evento.mini.aparece', 'Aparece un mini jefe', {});
add('eventos', 'evento.vida', 'Perdiste una vida', {});
add('eventos', 'evento.continuar', 'Cuenta de ¿SEGUÍS?', {});
add('eventos', 'evento.especial', 'Arranque del especial', { sinte: 'especial' });
add('eventos', 'evento.revive', 'Volvés con una vida nueva (onda)', { sinte: 'especial' });
add('eventos', 'evento.aviso', 'Alarma de evento (ómnibus, ola, changuito...)', {});
add('eventos', 'evento.bondi.bocina', 'Bocina del ómnibus', { sinte: 'bocina' });
add('eventos', 'evento.bondi.pasa', 'Ómnibus pasando', {});
add('eventos', 'evento.carro', 'Carro del hurgador con caballo', {});
add('eventos', 'evento.changuito', 'Changuito de la feria a toda velocidad', {});
add('eventos', 'evento.ola', 'Ola que rompe contra el muro', {});
add('eventos', 'evento.apagon', 'Se corta la luz', {});
add('eventos', 'evento.luz', 'Vuelve la luz', {});
add('eventos', 'evento.llamadas', 'Pasa la comparsa (llamadas)', {});
add('eventos', 'evento.gaviotas', 'Gaviotas que bajan', {});
add('eventos', 'evento.trueno', 'Trueno', {});
add('eventos', 'evento.contenedor', 'Contenedor que rueda', {});
add('eventos', 'evento.record', 'Récord nuevo', {});
add('eventos', 'evento.final', 'Final del juego', {});
add('eventos', 'evento.perro', 'Perro que ladra', { sinte: 'perro' });
// --- ambiente (loops por nivel)
for (const [k, d] of [['cuadra', 'Barrio al atardecer'], ['feria', 'Feria de Tristán Narvaja'], ['avenida', 'Avenida 18 de Julio'], ['barriosur', 'Barrio Sur de noche'], ['ciudadvieja', 'Ciudad Vieja / Mercado del Puerto'], ['rambla', 'Rambla con tormenta']])
  add('ambiente', 'amb.' + k, 'Loop ambiental: ' + d, { loop: true });
add('ambiente', 'amb.lluvia', 'Loop de lluvia', { loop: true });
// --- música
add('musica', 'mus.titulo', 'Pantalla de título', { loop: true, sinte: 'menu' });
add('musica', 'mus.menu', 'Menús (selección, vestuario, mapa)', { loop: true, sinte: 'menu' });
for (let i = 1; i <= 8; i++) add('musica', 'mus.nivel' + i, 'Nivel ' + i, { loop: true, sinte: 'nivel' });
add('musica', 'mus.jefe', 'Pelea con jefe', { loop: true, sinte: 'jefe' });
add('musica', 'mus.jefe.final', 'Pelea con el jefe final', { loop: true, sinte: 'jefe' });
add('musica', 'mus.victoria', 'Nivel ganado (jingle)', {});
add('musica', 'mus.derrota', 'Game over (jingle)', {});
add('musica', 'mus.final', 'Final del juego / créditos', { loop: true });
// --- voces
const EV_J = [['ataque', 'grito al pegar'], ['especial', 'grito del especial'], ['dolor', 'le pegan'], ['ko', 'cae sin vida'], ['festeja', 'gana el nivel'], ['salto', 'salto'], ['agarra', 'agarra a alguien']];
for (const k of Object.keys(JUGADORES)) for (const [ev, d] of EV_J) add('voces', `voz.${k}.${ev}`, `${JUGADORES[k].nombre}: ${d}`);
const EV_E = [['ataque', 'grito al pegar'], ['dolor', 'le pegan'], ['ko', 'cae KO']];
const EV_JEFE = [['ataque', 'grito al pegar'], ['dolor', 'le pegan'], ['ko', 'derrotado'], ['risa', 'se ríe / provoca']];
for (const k of Object.keys(ENEMIGOS)) for (const [ev, d] of (ENEMIGOS[k].jefe ? EV_JEFE : EV_E)) add('voces', `voz.${k}.${ev}`, `${ENEMIGOS[k].nombres[0]}: ${d}`);
// --- frases: una por texto de globo (frase.<slug>)
export function slug(t) { return t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/ñ/g, 'n').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''); }
for (const [grupo, v] of Object.entries(FRASES)) {
  const lista = Array.isArray(v) ? v : [v.intro, ...v.pelea, v.furia, v.ko];
  for (const t of lista) { const id = 'frase.' + slug(t); if (!C[id]) add('frases', id, `"${t}" (${grupo})`); }
}
add('ui', 'ui.mover', 'Moverse en un menú', { sinte: 'menu' });
add('ui', 'ui.ok', 'Confirmar', { sinte: 'dale' });
add('ui', 'ui.atras', 'Volver', { sinte: 'menu' });
add('ui', 'ui.pausa', 'Pausa', { sinte: 'pausa' });
add('ui', 'ui.ropa', 'Cambiar ropa en el vestuario', { sinte: 'item' });
add('ui', 'ui.mapa', 'Se abre el mapa de Montevideo');
// --- cinemáticas, economía y progresión (v9)
add('ui', 'cine.letra', 'Texto a máquina de escribir en la caja de diálogo (cada 2 letras)', { sinte: 'letra' });
add('ui', 'cine.avanza', 'Pasar al siguiente diálogo', { sinte: 'menu' });
add('ui', 'cine.saltar', 'Saltear la cinemática', { sinte: 'pausa' });
add('eventos', 'cine.capitulo', 'Cartel de capítulo (golpe de orquesta corto)', { sinte: 'capitulo' });
add('eventos', 'cine.robo', 'El Rata manotea el termo', { sinte: 'robo' });
add('ui', 'tienda.compra', 'Comprar en el almacén', { sinte: 'caja' });
add('ui', 'tienda.nopuede', 'No alcanza la plata / ya está comprado', { sinte: 'nopuede' });
add('ui', 'ui.punto', 'Asignar un punto de atributo', { sinte: 'punto' });
add('ui', 'ui.conteo', 'Conteo de cifras en la pantalla de resultados', { sinte: 'letra' });
add('armas', 'arma.botella.rompe', 'La botella se rompe y queda el pico en la mano', { sinte: 'botella' });
add('golpes', 'golpe.pisoton', 'Pisotón a un enemigo tirado', { sinte: 'pisoton' });
add('golpes', 'golpe.cabezazo', 'Cabezazo desde el agarre', { sinte: 'fuerte' });
add('golpes', 'golpe.remate', 'Remate cargado (golpe final del combo)', { sinte: 'fuerte' });
add('ui', 'ui.bloqueado', 'Elegir un nivel que todavía está cerrado', { sinte: 'menu' });
export const CATALOGO = C;
