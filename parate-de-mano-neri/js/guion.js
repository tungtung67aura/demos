// Guion de la campaña "PÁRATE DE MANO, ÑERI": capítulos, intro, presentación de cada nivel y de cada jefe, cierres y final.
// Formato por datos (lo corre js/cinematica.js). Posiciones: fx = fracción del ancho de pantalla desde la cámara.
// Comandos: capitulo, aparece, pon, cara, camina, sale, dice, espera, anim, arma, pasa, sonido, musica, temblor, globo.
export const CAPITULOS = [
  { n: 'I', txt: 'EL TERMO', sub: 'TODO EMPEZÓ CON UN AMARGO', niveles: ['cuadra'] },
  { n: 'II', txt: 'LA FERIA', sub: 'EL TERMO CAMBIA DE MANO', niveles: ['feria', 'avenida'] },
  { n: 'III', txt: 'LA NOCHE', sub: 'TAMBORES, GUANTES Y GRAPPAMIEL', niveles: ['barriosur', 'boliche'] },
  { n: 'IV', txt: 'EL CERRO', sub: 'ACÁ SE PAGA PEAJE', niveles: ['cerro'] },
  { n: 'V', txt: 'EL CAPO', sub: 'MIL CUATROCIENTOS TERMOS', niveles: ['ciudadvieja', 'rambla'] },
];
const D = (id, cara, txt, extra) => Object.assign({ c: 'dice', id, cara, txt }, extra);

// la intro: un pibe, un cordón, un termo con historia
const INTRO = [
  { c: 'pon', id: 'j', fx: 0.3, y: 214, cara: 1 }, { c: 'arma', id: 'j', t: 'termo' },
  { c: 'espera', t: 0.5 },
  D('j', 'feliz', 'LA TARDE PERFECTA: SOL, CORDÓN Y UN AMARGO RECIÉN CEBADO. NADA PUEDE SALIR MAL.'),
  { c: 'aparece', id: 'rata', clave: 'chorro', v: 0, fx: 1.15, y: 222, cara: -1, nombre: 'EL RATA', vel: 120 },
  { c: 'camina', id: 'rata', fx: 0.44, y: 216, espera: true },
  D('rata', 'feliz', '¡QUÉ LINDO TERMO, BO! ¿ME CONVIDÁS UNO, MI REY?'),
  D('j', 'enojo', 'NI EN PEDO. EL TERMO ERA DE MI ABUELO Y EL MATE DE MI ABUELA. SON RELIQUIAS.'),
  { c: 'pasa', de: 'j', a: 'rata' }, { c: 'sonido', id: 'cine.robo' }, { c: 'temblor', t: 0.2 },
  D('rata', 'grito', '¡GRACIAS POR EL AMARGO, GIL! ¡SALUDOS DE PARTE DEL TANO!'),
  { c: 'sale', id: 'rata', fx: 1.3, y: 230, vel: 150 },
  { c: 'espera', t: 0.6 },
  D('j', 'grito', '¡ME ROBARON EL TERMO! ¡CON YERBA Y TODO, LA REPUTA MADRE QUE LO PARIÓ!'),
  { c: 'aparece', id: 'rosa', clave: 'dona', v: 0, fx: -0.1, y: 240, cara: 1, nombre: 'DOÑA ROSA', vel: 50 },
  { c: 'camina', id: 'rosa', fx: 0.12, y: 236, espera: true },
  D('rosa', 'enojo', '¡NENE! ESE ES EL RATA. LABURA PARA EL TANO, EL GORDO QUE SE CREE DUEÑO DE LA CUADRA.'),
  D('rosa', 'normal', 'Y ANDÁ CON CUIDADO, QUE LOS GURISES DEL TANO PEGAN Y DESPUÉS NI PIDEN PERDÓN.'),
  { c: 'cara', id: 'j', d: 1 },
  D('j', 'enojo', 'PÁRATE DE MANO, ÑERI. HOY SE COBRA TODO. HASTA EL BIZCOCHO QUE ME DEBÉS, ROSA.'),
  D('rosa', 'feliz', '¡ESE BIZCOCHO TE LO COMISTE VOS, ATORRANTE!'),
  { c: 'sale', id: 'rosa', fx: -0.2 },
];

export const NIVEL = {
  cuadra: [],
  feria: [
    { c: 'pon', id: 'j', fx: 0.16, cara: 1 }, { c: 'espera', t: 0.3 },
    D('j', 'normal', 'TRISTÁN NARVAJA, DOMINGO. ACÁ VENDEN DE TODO: LIBROS, PERROS, ABUELAS Y TERMOS AJENOS.'),
    D('j', 'enojo', 'SI DOÑA CHOLA TIENE MI TERMO, SE LO SACO JUNTO CON LOS TOMATES.'),
  ],
  avenida: [
    { c: 'pon', id: 'j', fx: 0.16, cara: 1 },
    D('j', 'normal', '18 DE JULIO AL MEDIODÍA. BOCINAS, PALOMAS Y GENTE CORRIENDO EL BONDI COMO SI REGALARAN ALGO.'),
    { c: 'aparece', id: 'rata', clave: 'chorro', v: 0, fx: 1.1, y: 228, cara: -1, nombre: 'EL RATA', vel: 130 },
    { c: 'arma', id: 'rata', t: 'termo' },
    { c: 'camina', id: 'rata', fx: 0.6, y: 228, espera: true },
    D('rata', 'feliz', '¡EH, GIL! ¿BUSCÁS ESTO? EL GUARDA ME LO PRESTÓ PARA HACERTE CALENTAR. ¡CHAU!'),
    D('j', 'grito', '¡RATAAAA! ¡TE VOY A METER LA BOMBILLA DONDE NO DA EL SOL!'),
    { c: 'sale', id: 'rata', fx: 1.3, vel: 160 },
  ],
  barriosur: [
    { c: 'pon', id: 'j', fx: 0.16, cara: 1 },
    D('j', 'normal', 'NOCHE DE LLAMADAS EN BARRIO SUR. SI ME PIERDO, SIGO LOS TAMBORES.'),
    D('j', 'enojo', 'EL BOCHA ENTRENA ACÁ. DICEN QUE TIENE UNA IZQUIERDA QUE TE CAMBIA EL APELLIDO.'),
  ],
  boliche: [
    { c: 'pon', id: 'j', fx: 0.16, cara: 1 },
    D('j', 'normal', 'EL BOLICHE DEL GALLEGO. HUELE A GRAPPA, A FRITO Y A MALAS DECISIONES.'),
    { c: 'aparece', id: 'mozo', clave: 'mozo', v: 1, fx: 0.62, y: 222, cara: -1, nombre: 'EL MOZO VIEJO' },
    D('mozo', 'normal', '¿MESA PARA UNO? HOY HAY BUSECA, PIÑAS Y UNA BOTELLA QUE VUELA CADA CINCO MINUTOS.'),
    D('j', 'feliz', 'TRAEME LAS PIÑAS. LA BUSECA DESPUÉS, SI QUEDO VIVO.'),
    { c: 'sale', id: 'mozo', fx: 1.2 },
  ],
  cerro: [
    { c: 'pon', id: 'j', fx: 0.16, cara: 1 },
    { c: 'aparece', id: 'guri', clave: 'guri', v: 1, fx: 0.7, y: 230, cara: -1, nombre: 'EL VIGÍA' },
    D('guri', 'feliz', '¡ALTO AHÍ! ESTO ES TERRITORIO DE LOS PIBES. PARA PASAR SON CIEN PESOS O LAS ZAPATILLAS.'),
    D('j', 'enojo', 'TE DOY UNA PATADA EN EL ORTO Y TE QUEDÁS CON EL VUELTO.'),
    { c: 'golpe', id: 'j', a: 'pina1', espera: 0.2 },
    D('guri', 'grito', '¡CHAPAAAA! ¡HAY UN LOCO CON CARA DE TERMO!'),
    { c: 'sale', id: 'guri', fx: 1.3, vel: 160 },
  ],
  ciudadvieja: [
    { c: 'pon', id: 'j', fx: 0.16, cara: 1 },
    D('j', 'normal', 'CIUDAD VIEJA. ADOQUINES, TURISTAS PERDIDOS Y OLOR A ASADO DESDE EL MERCADO DEL PUERTO.'),
    D('j', 'enojo', 'SI EL CAPO TIENE GENTE ACÁ, LOS VOY A DEJAR MÁS ACHATADOS QUE UN CHIVITO AL PAN.'),
  ],
  rambla: [
    { c: 'pon', id: 'j', fx: 0.16, cara: 1 },
    D('j', 'normal', 'LA RAMBLA EN TORMENTA. NI LOS PESCADORES SE QUEDARON. BUENO, ALGUNOS SÍ. SON DE FIERRO.'),
    D('j', 'enojo', 'DON PEPE, EL CAPO. MIL CUATROCIENTOS TERMOS ROBADOS. HOY LE FALTA UNO.'),
  ],
};

// presentación de cada jefe cuando entra en escena (el cartel de SE VIENE sale al terminar)
export const JEFE = {
  tano: [
    { c: 'camina', id: 'jefe', fx: 0.74, espera: true },
    { c: 'golpe', id: 'jefe', a: 'e_pesada', cara: -1, temblor: 0.3, polvo: true },
    { c: 'presenta', id: 'jefe', txt: 'EL TANO', sub: 'DUEÑO DE LA CUADRA · 140 KG DE FUGAZZETA' },
    D('jefe', 'enojo', '¿QUIÉN SE METIÓ EN MI CUADRA? ¿VOS, FLACO? SI PARECÉS UN FIDEO CON ZAPATILLAS.'),
    D('j', 'enojo', 'VENGO POR MI TERMO, GORDO. EL RATA DIJO TU NOMBRE ANTES DE RAJAR.'),
    D('jefe', 'feliz', '¿EL TERMO VERDE? YA LO VENDÍ EN LA FERIA. ME DIERON UN CHIVITO Y MEDIO.'),
    D('j', 'grito', '¿¡UN CHIVITO Y MEDIO!? ¡ESE TERMO VALÍA DOS CANADIENSES COMO MÍNIMO!'),
    D('jefe', 'grito', '¡TE VOY A HACER CHIVITO A VOS! ¡CON HUEVO Y TODO!'),
    { c: 'golpe', id: 'j', a: 'pina1', espera: 0.15 }, { c: 'golpe', id: 'j', a: 'pina2', temblor: 0.12 },
  ],
  chola: [
    { c: 'camina', id: 'jefe', fx: 0.72, espera: true },
    { c: 'golpe', id: 'jefe', a: 'e_golpe', cara: -1, temblor: 0.2, polvo: true },
    { c: 'presenta', id: 'jefe', txt: 'DOÑA CHOLA', sub: 'REINA DE TRISTÁN NARVAJA · TOMATE EN MANO' },
    D('jefe', 'enojo', '¿QUIÉN ME TOCÓ LOS TOMATES? ¡NADIE TOCA LA MERCADERÍA DE LA CHOLA!'),
    D('j', 'normal', 'DOÑA, NO VINE POR LOS TOMATES. ¿DÓNDE ESTÁ MI TERMO?'),
    D('jefe', 'feliz', 'LO CAMBIÉ POR UN BOLETO DEL 121 Y UN KILO DE BONIATO. LO TIENE EL GUARDA, MIJO.'),
    D('j', 'grito', '¿Y EL MATE? ¡EL MATE VENÍA CON EL TERMO!'),
    D('jefe', 'grito', '¡EL MATE SE COBRA APARTE, NENE! ¡LLEVÁ TRES, PAGÁ DOS!'),
    { c: 'golpe', id: 'j', a: 'pina1', espera: 0.15 }, { c: 'golpe', id: 'j', a: 'pina2', temblor: 0.12 },
  ],
  guarda: [
    { c: 'camina', id: 'jefe', fx: 0.72, espera: true },
    { c: 'golpe', id: 'jefe', a: 'e_jab', cara: -1 },
    { c: 'golpe', id: 'jefe', a: 'e_cruz', cara: -1, temblor: 0.2, polvo: true },
    { c: 'presenta', id: 'jefe', txt: 'EL GUARDA', sub: 'LÍNEA 121 · NUNCA DIO UN VUELTO' },
    D('jefe', 'enojo', '¡BOLETO, CABALLERO! ¡ACÁ NADIE PASA SIN PAGAR!'),
    D('j', 'enojo', 'NO VINE A VIAJAR. VINE POR UN TERMO VERDE QUE TE DIO LA CHOLA.'),
    D('jefe', 'feliz', 'SE LO DI AL BOCHA, EL BOXEADOR DE BARRIO SUR. ME DEBÍA PLATA DE UNA APUESTA.'),
    D('j', 'grito', '¿TODO MONTEVIDEO ESTÁ TRAFICANDO MI TERMO? ¡ESTO ES PEOR QUE EL DÓLAR!'),
    D('jefe', 'grito', '¡PASE PARA EL FONDO QUE HAY LUGAR!'),
    { c: 'golpe', id: 'j', a: 'pina1', espera: 0.15 }, { c: 'golpe', id: 'j', a: 'pina2', temblor: 0.12 },
  ],
  bocha: [
    { c: 'camina', id: 'jefe', fx: 0.72, espera: true },
    { c: 'golpe', id: 'jefe', a: 'e_jab', cara: -1 },
    { c: 'golpe', id: 'jefe', a: 'e_jab', cara: -1 },
    { c: 'golpe', id: 'jefe', a: 'e_cruz', cara: -1 },
    { c: 'golpe', id: 'jefe', a: 'e_pesada', cara: -1, temblor: 0.3, polvo: true },
    { c: 'presenta', id: 'jefe', txt: 'EL BOCHA', sub: 'EX CAMPEÓN DE BARRIO SUR · 3 PELEAS, 3 DERROTAS' },
    D('jefe', 'enojo', '¿VOS SOS EL GUAPO DEL BARRIO? A VER ESA GUARDIA, PICHÓN.'),
    D('j', 'normal', 'SOY EL DUEÑO DE UN TERMO. DEVOLVEMELO Y NADIE TERMINA EN EL PASTEUR.'),
    D('jefe', 'feliz', 'LO CAMBIÉ EN EL BOLICHE DEL GALLEGO POR UNA GRAPPAMIEL. SIN RENCOR, CAMPEÓN.'),
    D('jefe', 'grito', '¡GUARDIA ALTA! ¡ESTO ES BOX, NENE!'),
    { c: 'golpe', id: 'j', a: 'pina1', espera: 0.15 }, { c: 'golpe', id: 'j', a: 'pina2', temblor: 0.12 },
  ],
  chapa: [
    { c: 'camina', id: 'jefe', fx: 0.72, espera: true },
    { c: 'golpe', id: 'jefe', a: 'e_jab', cara: -1 }, { c: 'golpe', id: 'jefe', a: 'e_barrida', cara: -1, temblor: 0.25, polvo: true },
    { c: 'presenta', id: 'jefe', txt: 'EL CHAPA', sub: 'JEFE DE LOS PIBES DEL CERRO · COBRA PEAJE HASTA AL VIENTO' },
    D('jefe', 'enojo', '¿QUIÉN TE DIO PERMISO PARA PISAR MI CANCHITA, VENDEDOR DE TERMOS?'),
    D('j', 'enojo', 'EL GALLEGO DICE QUE DON PEPE MANDÓ MI TERMO POR ACÁ. Y VOS LE COBRASTE PEAJE.'),
    D('jefe', 'feliz', 'ME LO QUEDÉ UNA SEMANA. LE TOMÉ MATE CON COCA. DESPUÉS VINO EL PARRILLERO Y ME LO CAMBIÓ POR UN CHORIZO.'),
    D('j', 'grito', '¿¡MATE CON COCA!? ¡A VOS NO TE PEGO, A VOS TE DENUNCIO A LA ONU!'),
    D('jefe', 'grito', '¡MUCHACHOS, A ESTE NO LO DEJEN SALIR DEL CERRO!'),
    { c: 'golpe', id: 'j', a: 'pina1', espera: 0.15 }, { c: 'golpe', id: 'j', a: 'pina2', temblor: 0.12 },
  ],
  gallego: [
    { c: 'camina', id: 'jefe', fx: 0.72, espera: true },
    { c: 'golpe', id: 'jefe', a: 'e_pesada', cara: -1, temblor: 0.35, polvo: true },
    { c: 'presenta', id: 'jefe', txt: 'EL GALLEGO', sub: 'DUEÑO DEL BOLICHE · FIADO NO' },
    D('jefe', 'enojo', '¡EN MI BOLICHE SE CONSUME O SE VA! ¿Y VOS QUÉ VAS A TOMAR, ESCUÁLIDO?'),
    D('j', 'enojo', 'MI TERMO. EL QUE TE CAMBIÓ EL BOCHA POR UNA GRAPPAMIEL.'),
    D('jefe', 'feliz', '¿ESE? SE LO VENDÍ A DON PEPE, EL CAPO. PAGÓ EN EFECTIVO. EN DÓLARES, CHAVAL.'),
    D('j', 'grito', '¡EN DÓLARES! ¡MI TERMO COTIZA EN BOLSA Y YO SIN UN PESO!'),
    D('jefe', 'grito', '¡LA CASA INVITA... A BOTELLAZOS!'),
    { c: 'golpe', id: 'j', a: 'pina1', espera: 0.15 }, { c: 'golpe', id: 'j', a: 'pina2', temblor: 0.12 },
  ],
  parrillero: [
    { c: 'camina', id: 'jefe', fx: 0.72, espera: true },
    { c: 'golpe', id: 'jefe', a: 'e_palazo', cara: -1, temblor: 0.25, polvo: true },
    { c: 'presenta', id: 'jefe', txt: 'EL PARRILLERO', sub: 'MERCADO DEL PUERTO · BRASA Y CUCHILLA' },
    D('jefe', 'enojo', '¡SE TE QUEMA EL ASADO! ¿QUIÉN TE DEJÓ ENTRAR AL MERCADO?'),
    D('j', 'normal', '¿VOS LABURÁS PARA DON PEPE?'),
    D('jefe', 'feliz', 'LE HAGO EL ASADO LOS DOMINGOS. Y TU MATE LO USA PARA SERVIR EL CHIMICHURRI.'),
    D('j', 'grito', '¿¡CHIMICHURRI EN MI MATE!? ¡ESO ES UN CRIMEN DE LESA HUMANIDAD, HIJO DE PUTA!'),
    D('jefe', 'grito', '¡VUELTA Y VUELTA, PIBE!'),
    { c: 'golpe', id: 'j', a: 'pina1', espera: 0.15 }, { c: 'golpe', id: 'j', a: 'pina2', temblor: 0.12 },
  ],
  capo: [
    { c: 'camina', id: 'jefe', fx: 0.72, espera: true },
    { c: 'golpe', id: 'jefe', a: 'especial', cara: -1, temblor: 0.4, polvo: true },
    { c: 'presenta', id: 'jefe', txt: 'DON PEPE', sub: 'EL CAPO DE LA RAMBLA · 1.400 TERMOS' },
    D('jefe', 'enojo', '¿VOS SOS EL QUE LIMPIÓ MONTEVIDEO? ME DEJASTE SIN EMPLEADOS. Y SIN PARRILLERO.'),
    D('j', 'enojo', 'VINE POR MI TERMO. Y POR MI MATE. Y POR LA BOMBILLA, QUE ES DE ALPACA.'),
    D('jefe', 'feliz', 'TENGO MIL CUATROCIENTOS TERMOS, PIBE. EL TUYO ES EL MÁS FEO. POR ESO ME GUSTA.'),
    { c: 'aparece', id: 'rata', clave: 'chorro', v: 0, fx: 1.1, y: 250, cara: -1, nombre: 'EL RATA', vel: 120 },
    { c: 'arma', id: 'rata', t: 'termo' },
    { c: 'camina', id: 'rata', fx: 0.88, y: 250, espera: true },
    D('rata', 'feliz', '¡JEFE! ¡ACÁ LE TRAJE EL TERMO DEL GIL, LUSTRADITO!'),
    D('jefe', 'grito', '¡LA RAMBLA ES MÍA, Y EL AMARGO TAMBIÉN! ¡RATA, RAJÁ DE ACÁ!'),
    { c: 'sale', id: 'rata', fx: 1.3, vel: 150 },
    { c: 'golpe', id: 'j', a: 'pina1', espera: 0.15 }, { c: 'golpe', id: 'j', a: 'pina2', temblor: 0.12 },
  ],
};

// después de ganar el nivel (el jefe quedó tirado: habla desde el retrato)
export const FIN = {
  cuadra: [
    D('tano', 'ko', '¡TÁ, TÁ, ESTÁ BIEN! EL TERMO LO TIENE DOÑA CHOLA, LA DE LOS TOMATES. EN TRISTÁN NARVAJA.', { clave: 'tano', nombre: 'EL TANO', lado: 'der' }),
    D('j', 'enojo', 'MAÑANA ES DOMINGO. HAY FERIA. HAY GUERRA.'),
  ],
  feria: [
    D('chola', 'ko', 'EL GUARDA SE BAJA EN 18 DE JULIO... ¡Y ME DEBE EL BONIATO, DECILE!', { clave: 'chola', nombre: 'DOÑA CHOLA', lado: 'der' }),
    D('j', 'normal', 'UN BONDI, UN GUARDA Y UN TERMO. PARECE UN CHISTE. NO ME HACE GRACIA.'),
  ],
  avenida: [
    D('guarda', 'ko', 'FIN DEL RECORRIDO... EL BOCHA ENTRENA DE NOCHE. CUIDADO CON LA IZQUIERDA.', { clave: 'guarda', nombre: 'EL GUARDA', lado: 'der' }),
    D('j', 'feliz', 'Y VOS CUIDADO CON EL PISO, QUE LO TENÉS PEGADO A LA CARA.'),
  ],
  barriosur: [
    D('bocha', 'ko', 'EL BOLICHE DEL GALLEGO ESTÁ A DOS CUADRAS... NO ENTRES. ESE LUGAR ES PEOR QUE YO.', { clave: 'bocha', nombre: 'EL BOCHA', lado: 'der' }),
    D('j', 'enojo', 'PEOR QUE VOS NO HAY NADA. TENÉS LA GUARDIA DE UN MANIQUÍ.'),
  ],
  boliche: [
    D('gallego', 'ko', 'EL TERMO SE LO MANDÉ A DON PEPE... PERO CRUZÓ POR EL CERRO. Y EN EL CERRO EL CHAPA COBRA PEAJE.', { clave: 'gallego', nombre: 'EL GALLEGO', lado: 'der' }),
    D('j', 'normal', 'ANOTÁ LO QUE ROMPÍ. SE LO COBRÁS AL CAPO.'),
  ],
  cerro: [
    D('chapa', 'ko', 'EL PARRILLERO SE LO LLEVÓ AL MERCADO DEL PUERTO... DECILE QUE ME DEBE EL CHORIZO.', { clave: 'chapa', nombre: 'EL CHAPA', lado: 'der' }),
    D('j', 'normal', 'LOS PIBES DEL CERRO. MÁS QUE PIBES PARECÍAN JUBILADOS.'),
  ],
  ciudadvieja: [
    D('parrillero', 'ko', 'DON PEPE ESTÁ EN LA RAMBLA, CON TORMENTA Y TODO. TIENE UN PARAGUAS QUE PEGA COMO UN CAMIÓN.', { clave: 'parrillero', nombre: 'EL PARRILLERO', lado: 'der' }),
    D('j', 'enojo', 'Y YO TENGO UNA PIÑA QUE PEGA COMO UN 121 SIN FRENOS.'),
  ],
  // el final: termo recuperado, el mate vuelve, la yerba no
  rambla: [
    D('capo', 'ko', '¡TÁ! ¡LA RAMBLA ES TUYA! LLEVATE EL TERMO, PERO NO LE DIGAS A NADIE QUE PERDÍ CONTRA UN PIBE.', { clave: 'capo', nombre: 'DON PEPE, EL CAPO', lado: 'der' }),
    { c: 'arma', id: 'j', t: 'termo' }, { c: 'sonido', id: 'item.arma' },
    D('j', 'feliz', 'VOLVISTE, VIEJO. ESTÁS ABOLLADO Y HUELE A CHIMICHURRI, PERO SOS MÍO.'),
    { c: 'aparece', id: 'rata', clave: 'chorro', v: 0, fx: 1.1, y: 236, cara: -1, nombre: 'EL RATA', vel: 90 },
    { c: 'camina', id: 'rata', fx: 0.66, y: 236, espera: true },
    D('rata', 'dolor', 'TOMÁ EL MATE, ÑERI... PERDÓN POR TODO. ¿ME CONVIDÁS UNO? UNO SOLO.'),
    D('j', 'normal', 'UNO. Y DESPUÉS LAVÁS LA BOMBILLA, RATA ROÑOSA.'),
    { c: 'aparece', id: 'rosa', clave: 'dona', v: 0, fx: -0.1, y: 244, cara: 1, nombre: 'DOÑA ROSA', vel: 60 },
    { c: 'camina', id: 'rosa', fx: 0.2, y: 244, espera: true },
    D('rosa', 'enojo', '¡NENE! ¿Y LA YERBA? ¿TRAJISTE LA YERBA?'),
    D('j', 'dolor', '...¿QUÉ YERBA?'),
    D('rata', 'feliz', 'AH, LA YERBA LA VENDÍ EN LA FERIA. ME DIERON UN CHIVITO Y MEDIO.'),
    { c: 'temblor', t: 0.4 },
    D('j', 'grito', '¡PÁRATE DE MANO, ÑERIIIIIII!'),
    { c: 'golpe', id: 'j', a: 'pina3', temblor: 0.3, polvo: true, espera: 0.1 }, { c: 'golpe', id: 'rosa', a: 'e_golpe', espera: false },
    { c: 'sale', id: 'rata', fx: 1.4, vel: 170 },
    { c: 'espera', t: 0.8 },
  ],
};

export function capituloDe(id) { return CAPITULOS.find((c) => c.niveles.includes(id)) || null; }
// guion que corre al empezar el nivel: cartel de capítulo (si abre uno) + intro (la del termo en el primero)
export function guionInicio(id) {
  const cap = capituloDe(id); const l = [];
  if (cap && cap.niveles[0] === id) l.push({ c: 'capitulo', n: cap.n, txt: cap.txt, sub: cap.sub });
  if (id === 'cuadra') l.push(...INTRO); else l.push(...(NIVEL[id] || []));
  return l;
}
