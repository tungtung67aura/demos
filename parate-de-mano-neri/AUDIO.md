# Audio de Párate de mano ñeri — lista de IDs

Generado con `node tools/audio-doc.mjs`. Total: **349 IDs**.

## Cómo cargar los audios
1. Guardá cada archivo en `audio/<carpeta>/` con el **nombre exacto del ID** y extensión `.ogg` (ej.: `audio/golpes/golpe.pina.ogg`).
2. Variantes al azar: `golpe.pina-1.ogg`, `golpe.pina-2.ogg`… Música y ambientes se repiten en loop solos.
3. Corré `node tools/audio-manifest.mjs --doc`: llena `audio/manifest.js` y actualiza esta lista. No hay que tocar el código del juego.
4. iPhone: Safari moderno reproduce OGG; para equipos viejos podés poner al lado el mismo nombre en `.m4a` y se usa si el OGG falla.
5. **Se puede cargar cualquier subconjunto** (por ejemplo sólo unas voces de amigos en `audio/voces/` y `audio/frases/`): lo que no tiene archivo sigue sonando como antes (sintetizado) o queda mudo, sin errores.
6. Volumen por ID: `AJUSTES.volumenId` en `audio/manifest.js`. Para que no suenen más los sonidos sintetizados originales: `AJUSTES.sinteDeRespaldo = false`.

Columna *respaldo*: el ID usa hoy el sonido sintetizado original hasta que tenga archivo. "—" = mudo hasta que lo cargues.

## Golpes del cuerpo (piñas, patadas, especiales) — `audio/golpes/` (13)

| ID | Qué es | Respaldo | Archivo |
|---|---|---|---|
| `golpe.pina` | Piña (jab / directo) | pina | — |
| `golpe.gancho` | Gancho / remate que tumba | fuerte | — |
| `golpe.patada` | Patada | patada | — |
| `golpe.voladora` | Patada voladora | patada | — |
| `golpe.especial` | Especial giratorio | fuerte | — |
| `golpe.rodilla` | Rodillazo en el agarre | pina | — |
| `golpe.revoleo` | Revoleo (el enemigo sale volando) | fuerte | — |
| `golpe.embestida` | Embestida de jefe / changuito | fuerte | — |
| `golpe.barrida` | Barrida al piso (El Rata) | patada | — |
| `golpe.contra` | Contragolpe del boxeador | fuerte | — |
| `golpe.pisoton` | Pisotón a un enemigo tirado | pisoton | — |
| `golpe.cabezazo` | Cabezazo desde el agarre | fuerte | — |
| `golpe.remate` | Remate cargado (golpe final del combo) | fuerte | — |

## Impactos contra cuerpos, piso y objetos — `audio/impactos/` (14)

| ID | Qué es | Respaldo | Archivo |
|---|---|---|---|
| `impacto.piso` | Cuerpo contra el piso | piso | — |
| `impacto.rebote` | Rebote del cuerpo | piso | — |
| `impacto.bloqueo` | Golpe bloqueado (Patovica / Bocha) | metal | — |
| `impacto.madera` | Golpe a madera (cajón, mesa, puesto) | madera | — |
| `impacto.metal` | Golpe a metal (tacho, revistero) | metal | — |
| `impacto.plastico` | Golpe a plástico (contenedor, conservadora) | madera | — |
| `impacto.carton` | Golpe a cartón | madera | — |
| `impacto.barro` | Maceta que se rompe | botella | — |
| `impacto.vidrio` | Vidrio roto (botella, cajón de cerveza) | botella | — |
| `impacto.explosion` | Explosión de garrafa | explosion | — |
| `impacto.fruta` | Naranja / tomate que revienta | pina | — |
| `impacto.agua` | Salpicón (ola, charco) | — | — |
| `impacto.fuego` | Quemadura en la parrilla | — | — |
| `impacto.contenedor` | Contenedor que choca a alguien | fuerte | — |

## Golpes y roturas de armas del piso — `audio/armas/` (18)

| ID | Qué es | Respaldo | Archivo |
|---|---|---|---|
| `arma.palo` | Golpe con Palo / pata de silla | madera | — |
| `arma.botella` | Golpe con Botella | botella | — |
| `arma.termo` | Golpe con Termo | metal | — |
| `arma.silla` | Golpe con Silla de bar | madera | — |
| `arma.cano` | Golpe con Caño | metal | — |
| `arma.escoba` | Golpe con Escoba | madera | — |
| `arma.ladrillo` | Golpe con Ladrillo | madera | — |
| `arma.cajon` | Golpe con Cajón de feria | madera | — |
| `arma.corvina` | Golpe con Corvina (pescado) | madera | — |
| `arma.bandeja` | Golpe con Bandeja de mozo | metal | — |
| `arma.cucharon` | Golpe con Cucharón de Doña Chola | madera | — |
| `arma.maquina` | Golpe con Máquina de boletos del Guarda | metal | — |
| `arma.pinza` | Golpe con Pinza del Parrillero | madera | — |
| `arma.paraguas` | Golpe con Paraguas del Capo | madera | — |
| `arma.faca` | Golpe con Faca / cuchillo (tajo) | tajo | — |
| `arma.rompe` | Arma que se rompe (madera) | madera | — |
| `arma.tiro` | Tirar un arma (zumbido) | aire | — |
| `arma.botella.rompe` | La botella se rompe y queda el pico en la mano | botella | — |

## Juntar objetos, comida y plata — `audio/items/` (5)

| ID | Qué es | Respaldo | Archivo |
|---|---|---|---|
| `item.arma` | Juntar un arma | item | — |
| `item.comida` | Comer (bizcochos, chivito, torta frita...) | come | — |
| `item.mate` | Tomar mate (carga MANO) | come | — |
| `item.plata` | Juntar plata ($U): monedas y billetes | plata | — |
| `item.robado` | Te roban algo (El Rata) | — | — |

## Movimientos (salto, aire, agarres) — `audio/mov/` (7)

| ID | Qué es | Respaldo | Archivo |
|---|---|---|---|
| `mov.aire` | Golpe al aire (zumbido) | aire | — |
| `mov.salto` | Salto | aire | — |
| `mov.aterriza` | Caer de un salto | — | — |
| `mov.agarre` | Agarrar a alguien | agarra | — |
| `mov.arrebato` | Manotazo para robar | agarra | — |
| `mov.esquive` | Esquive / salto hacia atrás | — | — |
| `mov.levanta` | Levantarse del piso | — | — |

## Sonidos propios de enemigos y jefes (no voces) — `audio/enemigos/` (12)

| ID | Qué es | Respaldo | Archivo |
|---|---|---|---|
| `enem.aviso` | Aviso "!" antes de un golpe fuerte | — | — |
| `enem.gomera` | Gomera del Gurí | aire | — |
| `enem.tambor.toque` | Toque de tambor (buff a los demás) | — | — |
| `enem.tambor.golpe` | Tamborazo (onda) | fuerte | — |
| `enem.cana.lanza` | Lanzar la caña de pescar | aire | — |
| `enem.cana.engancha` | El anzuelo te engancha | agarra | — |
| `enem.bandeja.vuela` | Bandeja girando en el aire | — | — |
| `enem.silbato` | Silbato del Guarda | — | — |
| `enem.changuito` | Ruedas del changuito | — | — |
| `enem.parrilla.fuego` | Llamarada de la parrilla | — | — |
| `enem.chorizo` | Chorizo que rebota | — | — |
| `enem.paraguas.abre` | Paraguas que se abre (bloquea) | — | — |

## Eventos del nivel y del juego — `audio/eventos/` (27)

| ID | Qué es | Respaldo | Archivo |
|---|---|---|---|
| `evento.dale` | ¡DALE! (avanzar) | dale | — |
| `evento.nivel.inicio` | Cartel de nivel | — | — |
| `evento.nivel.fin` | Nivel terminado | dale | — |
| `evento.jefe.aparece` | Aparece el jefe | — | — |
| `evento.jefe.ko` | Jefe derrotado (cámara lenta) | ko | — |
| `evento.mini.aparece` | Aparece un mini jefe | — | — |
| `evento.vida` | Perdiste una vida | — | — |
| `evento.continuar` | Cuenta de ¿SEGUÍS? | — | — |
| `evento.especial` | Arranque del especial | especial | — |
| `evento.revive` | Volvés con una vida nueva (onda) | especial | — |
| `evento.aviso` | Alarma de evento (ómnibus, ola, changuito...) | — | — |
| `evento.bondi.bocina` | Bocina del ómnibus | bocina | — |
| `evento.bondi.pasa` | Ómnibus pasando | — | — |
| `evento.carro` | Carro del hurgador con caballo | — | — |
| `evento.changuito` | Changuito de la feria a toda velocidad | — | — |
| `evento.ola` | Ola que rompe contra el muro | — | — |
| `evento.apagon` | Se corta la luz | — | — |
| `evento.luz` | Vuelve la luz | — | — |
| `evento.llamadas` | Pasa la comparsa (llamadas) | — | — |
| `evento.gaviotas` | Gaviotas que bajan | — | — |
| `evento.trueno` | Trueno | — | — |
| `evento.contenedor` | Contenedor que rueda | — | — |
| `evento.record` | Récord nuevo | — | — |
| `evento.final` | Final del juego | — | — |
| `evento.perro` | Perro que ladra | perro | — |
| `cine.capitulo` | Cartel de capítulo (golpe de orquesta corto) | capitulo | — |
| `cine.robo` | El Rata manotea el termo | robo | — |

## Loops ambientales por nivel y sonidos del entorno — `audio/ambiente/` (7)

| ID | Qué es | Respaldo | Archivo |
|---|---|---|---|
| `amb.cuadra` | Loop ambiental: Barrio al atardecer (loop) | — | — |
| `amb.feria` | Loop ambiental: Feria de Tristán Narvaja (loop) | — | — |
| `amb.avenida` | Loop ambiental: Avenida 18 de Julio (loop) | — | — |
| `amb.barriosur` | Loop ambiental: Barrio Sur de noche (loop) | — | — |
| `amb.ciudadvieja` | Loop ambiental: Ciudad Vieja / Mercado del Puerto (loop) | — | — |
| `amb.rambla` | Loop ambiental: Rambla con tormenta (loop) | — | — |
| `amb.lluvia` | Loop de lluvia (loop) | — | — |

## Música (loops) — `audio/musica/` (15)

| ID | Qué es | Respaldo | Archivo |
|---|---|---|---|
| `mus.titulo` | Pantalla de título (loop) | menu | — |
| `mus.menu` | Menús (selección, vestuario, mapa) (loop) | menu | — |
| `mus.nivel1` | Nivel 1 (loop) | nivel | — |
| `mus.nivel2` | Nivel 2 (loop) | nivel | — |
| `mus.nivel3` | Nivel 3 (loop) | nivel | — |
| `mus.nivel4` | Nivel 4 (loop) | nivel | — |
| `mus.nivel5` | Nivel 5 (loop) | nivel | — |
| `mus.nivel6` | Nivel 6 (loop) | nivel | — |
| `mus.nivel7` | Nivel 7 (loop) | nivel | — |
| `mus.nivel8` | Nivel 8 (loop) | nivel | — |
| `mus.jefe` | Pelea con jefe (loop) | jefe | — |
| `mus.jefe.final` | Pelea con el jefe final (loop) | jefe | — |
| `mus.victoria` | Nivel ganado (jingle) | — | — |
| `mus.derrota` | Game over (jingle) | — | — |
| `mus.final` | Final del juego / créditos (loop) | — | — |

## Voces por personaje (gritos, dolor, KO) — `audio/voces/` (92)

| ID | Qué es | Respaldo | Archivo |
|---|---|---|---|
| `voz.seba.ataque` | EL SEBA: grito al pegar | — | — |
| `voz.seba.especial` | EL SEBA: grito del especial | — | — |
| `voz.seba.dolor` | EL SEBA: le pegan | — | — |
| `voz.seba.ko` | EL SEBA: cae sin vida | — | — |
| `voz.seba.festeja` | EL SEBA: gana el nivel | — | — |
| `voz.seba.salto` | EL SEBA: salto | — | — |
| `voz.seba.agarra` | EL SEBA: agarra a alguien | — | — |
| `voz.pelado.ataque` | EL PELADO: grito al pegar | — | — |
| `voz.pelado.especial` | EL PELADO: grito del especial | — | — |
| `voz.pelado.dolor` | EL PELADO: le pegan | — | — |
| `voz.pelado.ko` | EL PELADO: cae sin vida | — | — |
| `voz.pelado.festeja` | EL PELADO: gana el nivel | — | — |
| `voz.pelado.salto` | EL PELADO: salto | — | — |
| `voz.pelado.agarra` | EL PELADO: agarra a alguien | — | — |
| `voz.pato.ataque` | LA PATO: grito al pegar | — | — |
| `voz.pato.especial` | LA PATO: grito del especial | — | — |
| `voz.pato.dolor` | LA PATO: le pegan | — | — |
| `voz.pato.ko` | LA PATO: cae sin vida | — | — |
| `voz.pato.festeja` | LA PATO: gana el nivel | — | — |
| `voz.pato.salto` | LA PATO: salto | — | — |
| `voz.pato.agarra` | LA PATO: agarra a alguien | — | — |
| `voz.buzo.ataque` | CHUCHO: grito al pegar | — | — |
| `voz.buzo.dolor` | CHUCHO: le pegan | — | — |
| `voz.buzo.ko` | CHUCHO: cae KO | — | — |
| `voz.mati.ataque` | MATI: grito al pegar | — | — |
| `voz.mati.dolor` | MATI: le pegan | — | — |
| `voz.mati.ko` | MATI: cae KO | — | — |
| `voz.cacho.ataque` | CACHO: grito al pegar | — | — |
| `voz.cacho.dolor` | CACHO: le pegan | — | — |
| `voz.cacho.ko` | CACHO: cae KO | — | — |
| `voz.chorro.ataque` | EL RATA: grito al pegar | — | — |
| `voz.chorro.dolor` | EL RATA: le pegan | — | — |
| `voz.chorro.ko` | EL RATA: cae KO | — | — |
| `voz.patova.ataque` | EL ROPERO: grito al pegar | — | — |
| `voz.patova.dolor` | EL ROPERO: le pegan | — | — |
| `voz.patova.ko` | EL ROPERO: cae KO | — | — |
| `voz.guri.ataque` | EL GURÍ: grito al pegar | — | — |
| `voz.guri.dolor` | EL GURÍ: le pegan | — | — |
| `voz.guri.ko` | EL GURÍ: cae KO | — | — |
| `voz.faca.ataque` | EL FACA: grito al pegar | — | — |
| `voz.faca.dolor` | EL FACA: le pegan | — | — |
| `voz.faca.ko` | EL FACA: cae KO | — | — |
| `voz.cuida.ataque` | EL CUIDA: grito al pegar | — | — |
| `voz.cuida.dolor` | EL CUIDA: le pegan | — | — |
| `voz.cuida.ko` | EL CUIDA: cae KO | — | — |
| `voz.dona.ataque` | DOÑA ROSA: grito al pegar | — | — |
| `voz.dona.dolor` | DOÑA ROSA: le pegan | — | — |
| `voz.dona.ko` | DOÑA ROSA: cae KO | — | — |
| `voz.tambor.ataque` | EL PIANO: grito al pegar | — | — |
| `voz.tambor.dolor` | EL PIANO: le pegan | — | — |
| `voz.tambor.ko` | EL PIANO: cae KO | — | — |
| `voz.mozo.ataque` | EL MOZO: grito al pegar | — | — |
| `voz.mozo.dolor` | EL MOZO: le pegan | — | — |
| `voz.mozo.ko` | EL MOZO: cae KO | — | — |
| `voz.pescador.ataque` | EL PESCA: grito al pegar | — | — |
| `voz.pescador.dolor` | EL PESCA: le pegan | — | — |
| `voz.pescador.ko` | EL PESCA: cae KO | — | — |
| `voz.mamado.ataque` | EL MAMADO: grito al pegar | — | — |
| `voz.mamado.dolor` | EL MAMADO: le pegan | — | — |
| `voz.mamado.ko` | EL MAMADO: cae KO | — | — |
| `voz.tano.ataque` | EL TANO: grito al pegar | — | — |
| `voz.tano.dolor` | EL TANO: le pegan | — | — |
| `voz.tano.ko` | EL TANO: derrotado | — | — |
| `voz.tano.risa` | EL TANO: se ríe / provoca | — | — |
| `voz.chola.ataque` | DOÑA CHOLA: grito al pegar | — | — |
| `voz.chola.dolor` | DOÑA CHOLA: le pegan | — | — |
| `voz.chola.ko` | DOÑA CHOLA: derrotado | — | — |
| `voz.chola.risa` | DOÑA CHOLA: se ríe / provoca | — | — |
| `voz.guarda.ataque` | EL GUARDA: grito al pegar | — | — |
| `voz.guarda.dolor` | EL GUARDA: le pegan | — | — |
| `voz.guarda.ko` | EL GUARDA: derrotado | — | — |
| `voz.guarda.risa` | EL GUARDA: se ríe / provoca | — | — |
| `voz.bocha.ataque` | EL BOCHA: grito al pegar | — | — |
| `voz.bocha.dolor` | EL BOCHA: le pegan | — | — |
| `voz.bocha.ko` | EL BOCHA: derrotado | — | — |
| `voz.bocha.risa` | EL BOCHA: se ríe / provoca | — | — |
| `voz.parrillero.ataque` | EL PARRILLERO: grito al pegar | — | — |
| `voz.parrillero.dolor` | EL PARRILLERO: le pegan | — | — |
| `voz.parrillero.ko` | EL PARRILLERO: derrotado | — | — |
| `voz.parrillero.risa` | EL PARRILLERO: se ríe / provoca | — | — |
| `voz.chapa.ataque` | EL CHAPA: grito al pegar | — | — |
| `voz.chapa.dolor` | EL CHAPA: le pegan | — | — |
| `voz.chapa.ko` | EL CHAPA: derrotado | — | — |
| `voz.chapa.risa` | EL CHAPA: se ríe / provoca | — | — |
| `voz.gallego.ataque` | EL GALLEGO: grito al pegar | — | — |
| `voz.gallego.dolor` | EL GALLEGO: le pegan | — | — |
| `voz.gallego.ko` | EL GALLEGO: derrotado | — | — |
| `voz.gallego.risa` | EL GALLEGO: se ríe / provoca | — | — |
| `voz.capo.ataque` | DON PEPE, EL CAPO: grito al pegar | — | — |
| `voz.capo.dolor` | DON PEPE, EL CAPO: le pegan | — | — |
| `voz.capo.ko` | DON PEPE, EL CAPO: derrotado | — | — |
| `voz.capo.risa` | DON PEPE, EL CAPO: se ríe / provoca | — | — |

## Frases de los globos de diálogo (una por texto) — `audio/frases/` (125)

| ID | Qué es | Respaldo | Archivo |
|---|---|---|---|
| `frase.que_haces_bobo` | "¡QUÉ HACÉS, BOBO!" (enemigo) | — | — |
| `frase.veni_pa_aca` | "¡VENÍ PA ACÁ!" (enemigo) | — | — |
| `frase.te_voy_a_fajar` | "¡TE VOY A FAJAR!" (enemigo) | — | — |
| `frase.alto_gil` | "¡ALTO GIL!" (enemigo) | — | — |
| `frase.no_te_hagas_el_vivo` | "¡NO TE HAGAS EL VIVO!" (enemigo) | — | — |
| `frase.bo_vos` | "¡BO, VOS!" (enemigo) | — | — |
| `frase.aca_mandamos_nosotros` | "¡ACÁ MANDAMOS NOSOTROS!" (enemigo) | — | — |
| `frase.de_aca_no_salis` | "¡DE ACÁ NO SALÍS!" (enemigo) | — | — |
| `frase.ay_mamita` | "¡AY, MAMITA!" (dolor) | — | — |
| `frase.ta_ta` | "¡TÁ, TÁ!" (dolor) | — | — |
| `frase.para_para` | "¡PARÁ, PARÁ!" (dolor) | — | — |
| `frase.uh_loco` | "¡UH, LOCO!" (dolor) | — | — |
| `frase.la_pucha` | "¡LA PUCHA!" (dolor) | — | — |
| `frase.me_rindo_bo` | "¡ME RINDO, BO!" (ko) | — | — |
| `frase.me_voy_pa_casa` | "¡ME VOY PA CASA!" (ko) | — | — |
| `frase.no_da_mas` | "¡NO DA MÁS!" (ko) | — | — |
| `frase.vamo_arriba` | "¡VAMO ARRIBA!" (jugador) | — | — |
| `frase.toma_bo` | "¡TOMÁ, BO!" (jugador) | — | — |
| `frase.de_una` | "¡DE UNA!" (jugador) | — | — |
| `frase.al_piso` | "¡AL PISO!" (jugador) | — | — |
| `frase.que_te_pensas` | "¡QUÉ TE PENSÁS!" (jugador) | — | — |
| `frase.que_rico_bo` | "¡QUÉ RICO, BO!" (come) | — | — |
| `frase.esto_es_vida` | "¡ESTO ES VIDA!" (come) | — | — |
| `frase.salado` | "¡SALADO!" (come) | — | — |
| `frase.ahora_si` | "¡AHORA SÍ!" (arma) | — | — |
| `frase.veni_veni` | "¡VENÍ, VENÍ!" (arma) | — | — |
| `frase.mira_lo_que_tengo` | "¡MIRÁ LO QUE TENGO!" (arma) | — | — |
| `frase.gracias_bobo` | "¡GRACIAS, BOBO!" (robo) | — | — |
| `frase.me_lo_llevo` | "¡ME LO LLEVO!" (robo) | — | — |
| `frase.esto_es_mio_bo` | "¡ESTO ES MÍO, BO!" (robo) | — | — |
| `frase.ay_my_god` | "¡AY, MY GOD!" (turista) | — | — |
| `frase.no_photo` | "¡NO PHOTO!" (turista) | — | — |
| `frase.socorro` | "¡SOCORRO!" (turista) | — | — |
| `frase.que_pais` | "¡QUÉ PAÍS!" (turista) | — | — |
| `frase.ahi_voy` | "¡AHÍ VOY!" (sueltas) | — | — |
| `frase.permiso_permiso` | "¡PERMISO, PERMISO!" (sueltas) | — | — |
| `frase.mas_brasas` | "¡MÁS BRASAS!" (sueltas) | — | — |
| `frase.a_quien_buscas` | "¿A QUIÉN BUSCÁS?" (mini) | — | — |
| `frase.llego_el_que_faltaba` | "¡LLEGÓ EL QUE FALTABA!" (mini) | — | — |
| `frase.ahora_conmigo` | "¡AHORA CONMIGO!" (mini) | — | — |
| `frase.ni_me_viste` | "¡NI ME VISTE!" (chorro) | — | — |
| `frase.corre_gil` | "¡CORRÉ, GIL!" (chorro) | — | — |
| `frase.no_pasas` | "¡NO PASÁS!" (patova) | — | — |
| `frase.hoy_no_entras` | "¡HOY NO ENTRÁS!" (patova) | — | — |
| `frase.con_esas_championes_no` | "¡CON ESAS CHAMPIONES NO!" (patova) | — | — |
| `frase.lista_cerrada` | "¡LISTA CERRADA!" (patova) | — | — |
| `frase.toma_viejo` | "¡TOMÁ, VIEJO!" (guri) | — | — |
| `frase.no_me_agarras` | "¡NO ME AGARRÁS!" (guri) | — | — |
| `frase.le_digo_a_mi_madre` | "¡LE DIGO A MI MADRE!" (guri) | — | — |
| `frase.punteria_bo` | "¡PUNTERÍA, BO!" (guri) | — | — |
| `frase.te_marco_gil` | "¡TE MARCO, GIL!" (faca) | — | — |
| `frase.quedate_quietito` | "¡QUEDATE QUIETITO!" (faca) | — | — |
| `frase.te_abro_como_chorizo` | "¡TE ABRO COMO CHORIZO!" (faca) | — | — |
| `frase.te_lo_cuido_jefe` | "¡TE LO CUIDO, JEFE!" (cuida) | — | — |
| `frase.la_voluntad_maestro` | "¡LA VOLUNTAD, MAESTRO!" (cuida) | — | — |
| `frase.aca_no_estacionas` | "¡ACÁ NO ESTACIONÁS!" (cuida) | — | — |
| `frase.dale_que_te_lo_lavo` | "¡DALE QUE TE LO LAVO!" (cuida) | — | — |
| `frase.atorrante` | "¡ATORRANTE!" (dona) | — | — |
| `frase.que_juventud` | "¡QUÉ JUVENTUD!" (dona) | — | — |
| `frase.a_mi_edad` | "¡A MI EDAD!" (dona) | — | — |
| `frase.te_voy_a_barrer` | "¡TE VOY A BARRER!" (dona) | — | — |
| `frase.llamo_a_tu_madre` | "¡LLAMO A TU MADRE!" (dona) | — | — |
| `frase.dale_que_suena` | "¡DALE QUE SUENA!" (tambor) | — | — |
| `frase.chico_repique_y_piano` | "¡CHICO, REPIQUE Y PIANO!" (tambor) | — | — |
| `frase.que_no_pare` | "¡QUE NO PARE!" (tambor) | — | — |
| `frase.esto_es_candombe` | "¡ESTO ES CANDOMBE!" (tambor) | — | — |
| `frase.vos_sos_mi_hermano_loco` | "¡VOS SOS MI HERMANO, LOCO!" (mamado) | — | — |
| `frase.te_quiero_mucho_boludo` | "¡TE QUIERO MUCHO, BOLUDO!" (mamado) | — | — |
| `frase.no_estoy_mamado_estoy_feliz` | "¡NO ESTOY MAMADO, ESTOY FELIZ!" (mamado) | — | — |
| `frase.otra_vuelta_gallego` | "¡OTRA VUELTA, GALLEGO!" (mamado) | — | — |
| `frase.hip` | "¡HIP!" (mamado) | — | — |
| `frase.la_cuenta_caballero` | "¡LA CUENTA, CABALLERO!" (mozo) | — | — |
| `frase.sale_una_bandeja` | "¡SALE UNA BANDEJA!" (mozo) | — | — |
| `frase.la_propina_aparte` | "¡LA PROPINA APARTE!" (mozo) | — | — |
| `frase.mesa_para_uno` | "¡MESA PARA UNO!" (mozo) | — | — |
| `frase.pico` | "¡PICÓ!" (pescador) | — | — |
| `frase.veni_pescadito` | "¡VENÍ, PESCADITO!" (pescador) | — | — |
| `frase.hoy_no_pica_nada` | "¡HOY NO PICA NADA!" (pescador) | — | — |
| `frase.a_la_olla` | "¡A LA OLLA!" (pescador) | — | — |
| `frase.quien_se_metio_en_mi_cuadra` | "¿QUIÉN SE METIÓ EN MI CUADRA?" (tano) | — | — |
| `frase.te_voy_a_hacer_chivito` | "¡TE VOY A HACER CHIVITO!" (tano) | — | — |
| `frase.esta_cuadra_es_mia` | "¡ESTA CUADRA ES MÍA!" (tano) | — | — |
| `frase.muchachos_a_el` | "¡MUCHACHOS, A ÉL!" (tano) | — | — |
| `frase.esta_bien_esta_bien` | "¡ESTÁ BIEN, ESTÁ BIEN!" (tano) | — | — |
| `frase.quien_me_toco_los_tomates` | "¿QUIÉN ME TOCÓ LOS TOMATES?" (chola) | — | — |
| `frase.lleva_tres_paga_dos` | "¡LLEVÁ TRES, PAGÁ DOS!" (chola) | — | — |
| `frase.no_se_toca_la_mercaderia` | "¡NO SE TOCA LA MERCADERÍA!" (chola) | — | — |
| `frase.fresquitas` | "¡FRESQUITAS!" (chola) | — | — |
| `frase.sobrinos_vengan` | "¡SOBRINOS, VENGAN!" (chola) | — | — |
| `frase.me_arruinaste_la_feria` | "¡ME ARRUINASTE LA FERIA!" (chola) | — | — |
| `frase.boleto_caballero` | "¡BOLETO, CABALLERO!" (guarda) | — | — |
| `frase.pase_para_el_fondo` | "¡PASE PARA EL FONDO!" (guarda) | — | — |
| `frase.sin_boleto_no_viajas` | "¡SIN BOLETO NO VIAJÁS!" (guarda) | — | — |
| `frase.hay_lugar_atras` | "¡HAY LUGAR ATRÁS!" (guarda) | — | — |
| `frase.que_venga_el_121` | "¡QUE VENGA EL 121!" (guarda) | — | — |
| `frase.fin_del_recorrido` | "¡FIN DEL RECORRIDO!" (guarda) | — | — |
| `frase.vos_sos_el_guapo_del_barrio` | "¿VOS SOS EL GUAPO DEL BARRIO?" (bocha) | — | — |
| `frase.guardia_alta` | "¡GUARDIA ALTA!" (bocha) | — | — |
| `frase.esto_es_box_nene` | "¡ESTO ES BOX, NENE!" (bocha) | — | — |
| `frase.al_cuerpo` | "¡AL CUERPO!" (bocha) | — | — |
| `frase.ahora_me_enoje` | "¡AHORA ME ENOJÉ!" (bocha) | — | — |
| `frase.tiro_la_toalla` | "¡TIRO LA TOALLA!" (bocha) | — | — |
| `frase.se_te_quema_el_asado` | "¡SE TE QUEMA EL ASADO!" (parrillero) | — | — |
| `frase.vuelta_y_vuelta` | "¡VUELTA Y VUELTA!" (parrillero) | — | — |
| `frase.sale_chorizo` | "¡SALE CHORIZO!" (parrillero) | — | — |
| `frase.a_la_parrilla` | "¡A LA PARRILLA!" (parrillero) | — | — |
| `frase.se_me_apago_el_fuego` | "¡SE ME APAGÓ EL FUEGO!" (parrillero) | — | — |
| `frase.esto_es_territorio_de_los_pibes` | "¡ESTO ES TERRITORIO DE LOS PIBES!" (chapa) | — | — |
| `frase.peaje_gil` | "¡PEAJE, GIL!" (chapa) | — | — |
| `frase.aca_mando_yo` | "¡ACÁ MANDO YO!" (chapa) | — | — |
| `frase.toma_de_parte_del_cerro` | "¡TOMÁ, DE PARTE DEL CERRO!" (chapa) | — | — |
| `frase.muchachos_cano` | "¡MUCHACHOS, CAÑO!" (chapa) | — | — |
| `frase.ta_ta_pasa_gratis` | "¡TÁ, TÁ, PASÁ GRATIS!" (chapa) | — | — |
| `frase.en_mi_boliche_se_consume` | "¡EN MI BOLICHE SE CONSUME!" (gallego) | — | — |
| `frase.la_casa_invita` | "¡LA CASA INVITA!" (gallego) | — | — |
| `frase.esto_no_es_un_bar_es_una_iglesia` | "¡ESTO NO ES UN BAR, ES UNA IGLESIA!" (gallego) | — | — |
| `frase.toma_chaval` | "¡TOMÁ, CHAVAL!" (gallego) | — | — |
| `frase.esta_ronda_la_pago_yo` | "¡ESTA RONDA LA PAGO YO!" (gallego) | — | — |
| `frase.cerramos_por_hoy` | "¡CERRAMOS POR HOY!" (gallego) | — | — |
| `frase.vos_limpiaste_montevideo` | "¿VOS LIMPIASTE MONTEVIDEO?" (capo) | — | — |
| `frase.la_rambla_es_mia` | "¡LA RAMBLA ES MÍA!" (capo) | — | — |
| `frase.me_arruinaste_el_mate` | "¡ME ARRUINASTE EL MATE!" (capo) | — | — |
| `frase.muchachos` | "¡MUCHACHOS!" (capo) | — | — |
| `frase.se_me_volo_el_paraguas` | "¡SE ME VOLÓ EL PARAGUAS!" (capo) | — | — |
| `frase.ta_la_rambla_es_tuya` | "¡TÁ, LA RAMBLA ES TUYA!" (capo) | — | — |

## Menús — `audio/ui/` (14)

| ID | Qué es | Respaldo | Archivo |
|---|---|---|---|
| `ui.mover` | Moverse en un menú | menu | — |
| `ui.ok` | Confirmar | dale | — |
| `ui.atras` | Volver | menu | — |
| `ui.pausa` | Pausa | pausa | — |
| `ui.ropa` | Cambiar ropa en el vestuario | item | — |
| `ui.mapa` | Se abre el mapa de Montevideo | — | — |
| `cine.letra` | Texto a máquina de escribir en la caja de diálogo (cada 2 letras) | letra | — |
| `cine.avanza` | Pasar al siguiente diálogo | menu | — |
| `cine.saltar` | Saltear la cinemática | pausa | — |
| `tienda.compra` | Comprar en el almacén | caja | — |
| `tienda.nopuede` | No alcanza la plata / ya está comprado | nopuede | — |
| `ui.punto` | Asignar un punto de atributo | punto | — |
| `ui.conteo` | Conteo de cifras en la pantalla de resultados | letra | — |
| `ui.bloqueado` | Elegir un nivel que todavía está cerrado | menu | — |

