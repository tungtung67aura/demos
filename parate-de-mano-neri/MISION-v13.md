# bb-v13 — TIENDA PLENA MORTAL

Una tienda exclusiva del modo PLENA MORTAL. Sólo se entra desde el menú de PLENA MORTAL (última opción, **TIENDA PLENA MORTAL**). Tiene trajes exclusivos por luchador, mejoras permanentes que valen sólo en PLENA MORTAL, festejos, títulos para la VS y frases del relator. Todo se paga con **FICHAS**. No hay dinero real.

## Moneda: FICHAS, propia del modo (decisión y por qué)

**Decisión:** una moneda nueva, las **FICHAS**, que sólo se ganan peleando en PLENA MORTAL (LIBRE, TORRES y SUPERVIVENCIA). No se usan los $U de la campaña.

Por qué:
1. **La campaña queda intacta.** Los $U ya tienen su economía en el beat 'em up (tienda del almacén, atributos, armas). Mezclarlos cambiaría ese balance o haría competir dos tiendas por la misma plata.
2. **Los guardados viejos no rompen la tienda.** Hay guardados con miles de $U. Con $U se compraría todo el primer día y la tienda dejaría de ser una meta.
3. **Exclusividad real.** Si la moneda sólo sale de PLENA MORTAL, la tienda es de ese modo y el jugador tiene un motivo para jugarlo.
4. **Trucos.** Con el MODO DIOS (`bb-dios`) **no se ganan fichas**: ni por pelea, ni por torre, ni por oleada, ni por la bienvenida. La tienda lo avisa ("MODO DIOS: NO SE GANAN FICHAS"). El truco sigue desbloqueando luchadores como antes, pero no regala la tienda.
5. **Guardados viejos (v12.x):** reciben **una sola vez** una bienvenida por lo ya jugado: `min(400, 5 × peleas ganadas + 100 × torres completadas)`. Las torres ya completadas cuentan como "primera vez" ya cobrada (después pagan el premio de repetición), y los luchadores con los que ya ganaste no vuelven a pagar el bono de estreno. Si la migración se hace con el modo dios prendido, la bienvenida queda en espera hasta apagarlo.

### Cómo se ganan (×1.1 / ×1.2 / ×1.3 con la mejora ALCANCÍA DEL CHIQUILÍN)

| Fuente | Fichas |
|---|---|
| LIBRE: ganar | 5 + 10 × nivel de la CPU (15 / 25 / 35) |
| LIBRE: perder | 5 (por pelear) |
| TORRE: piso ganado | Barrio 20 · Caos 30 · Infierno 45 (×2 en pisos de jefe) |
| TORRE: completarla | 1.ª vez 250 / 450 / 800 · después 80 / 140 / 220 |
| SUPERVIVENCIA: cada pelea ganada | 10 + 3 × racha (tope 40) |
| Ronda PERFECTA | +10 (hasta 2 por pelea) |
| Primera victoria con un luchador nuevo | +25 |
| MODO INFINITO (oleadas) | 3 por oleada (tope 90) |
| Campaña, pelea de CPU contra CPU, modo dios | 0 |

**Ritmo:** con 2–3 peleas en LIBRE ya alcanza para un título o una frase. Con 4–6 alcanza para el primer traje. Una TORRE DEL BARRIO completa la primera vez da unas 400–450 fichas, o sea 2–3 cosas. La tienda completa cuesta **8.740 fichas**: son muchas sesiones, sin muros de grindeo, y cada sesión compra algo.

## Catálogo completo

### TRAJES (21, de 18 luchadores)
Son cambios de vestuario reales, no recoloreos. Cada traje es un cuerpo propio (`DEFS['cuerpo~traje']`) armado de cero con otras prendas (sombreros, camisas, pantalones, calzado) y accesorios: lentes, cadena, tambor de candombe a la espalda, guitarra. La anatomía y la cara del luchador no cambian. Se elige en la selección de personaje con el chip **< TRAJE >** (SÚPER/PATADA, el botón del mando o tocando el chip). Sólo se usan en PLENA MORTAL (LIBRE/TORRES/SUPERVIVENCIA).

| Luchador | Traje | Precio |
|---|---|---|
| EL ÑERI | CELESTE DEL 50: camiseta celeste "50", short negro, vincha | 160 |
| EL ÑERI | NOCHE DE LLAMADAS: tamboril a la espalda, pañuelo, camisa de comparsa | 220 |
| PATOVICA | PATOVA DE GALA: saco, moño, lentes negros | 180 |
| PATOVICA | GUARDAVIDAS DE LA BRAVA: visera, remera "BRAVA", short amarillo, ojotas | 160 |
| TURRO | TURRO DE MARCA: campera inflada blanca, gorra dorada, cadena | 150 |
| TURRO | TURRO CUMBIERO: pilusa blanca, camisa floreada | 150 |
| FACHERO | FACHERO DE PUNTA: panamá, saco de lino, todo blanco | 180 |
| FACHERO | FACHERO DE BOLICHE: camisa violeta abierta, jean oscuro | 140 |
| VECINO | VECINO DEL ASADO: delantal de cuero, gorra | 140 |
| VECINO | VECINO DE TRIBUNA: camiseta a rayas, gorro de lana | 140 |
| ABOGADO | DOCTOR EN LA PLAYA: camisa floreada, bermuda, ojotas, piluso | 160 |
| ABOGADO | DOCTOR DE ESTANCIA: boina, chaleco, bombacha de campo | 180 |
| ZOMBI | ZOMBI MURGUISTA: galera y levita de murga | 200 |
| ZOMBI | PESCADOR DE LA RAMBLA: campera de agua, gorro | 150 |
| RAPERO | MC DE ORO: gorra dorada, campera inflada con vivos de oro, lentes | 160 |
| FÍSICO | BOXEADOR DEL PALACIO: vincha, short rojo, botas de box | 160 |
| CHEF | CHEF DE CHIVITERÍA: chaqueta y gorro negros con vivos dorados | 140 |
| POLICÍA | POLICÍA MOTORIZADA: casco, chaleco flúo | 150 |
| YOUTUBER | STREAMER DE MADRUGADA: buzo negro del directo, auriculares | 140 |
| GITANO | TANGUERO DEL SUR: funyi, saco negro, corbata roja | 160 |
| CANILLITA | DIARIERO DEL 18: gorra plana, camisa a cuadros, tiradores | 130 |

### MEJORAS PERMANENTES (6 × 3 niveles; sólo en PLENA MORTAL)
No valen en la campaña, el beat 'em up, el modo infinito de oleadas ni las peleas de jefe de la campaña. Sólo el jugador las tiene; la CPU nunca.

| Mejora | Nivel 1 / 2 / 3 | Efecto por nivel (tope = nivel 3) |
|---|---|---|
| CHIVITO AL PLATO | 90 / 200 / 360 | +3 % de vida máxima (tope +9 %) |
| MATE CEBADO | 100 / 220 / 380 | +7 % de súper ganado (tope +21 %) |
| ARRANQUE CON MANIJA | 120 / 240 / 420 | cada ronda arranca con al menos 10 de súper (tope 30, nunca una súper entera) |
| ¡ZAFÉ! DE BARRIO | 80 / 180 / 300 | el ¡ZAFÉ! cuesta 5 menos de súper (50→35) y da +0,1 s de invulnerabilidad (0,4→0,7 s) |
| TUPPER DE LA VIEJA | 80 / 160 / 280 | SUPERVIVENCIA: curás 25 % + 10 % entre peleas (tope 55 %) |
| ALCANCÍA DEL CHIQUILÍN | 100 / 220 / 380 | +10 % de fichas ganadas (tope +30 %) |

Los topes son chicos a propósito: las torres siguen siendo un desafío. El bot de nivel 3 las completa sin mejoras, y con todas al máximo también, sin que quede trivial (ver QA-v13.md).

**No hay "continues de torre":** las torres ya permiten reintentar cada piso sin límite, así que esa mejora no aportaba nada.

### FESTEJOS (pose de victoria, con cualquier luchador)
MATECITO DE LA VICTORIA 90 · CANDOMBE DE FESTEJO 90 · SACAR CHAPA 80 · LA CARGADA 80 · LA REVERENCIA 70 · SALUDO A LA HINCHADA 70

### TÍTULOS (debajo de tu nombre en la pantalla VS)
CAMPEÓN DE LA CUADRA 40 · EL TERROR DEL CORDÓN 50 · EL QUE NO AFLOJA 50 · HIJO DEL CANDOMBE 60 · DOCTOR EN PIÑAS 60 · PATRIMONIO DEL CERRO 60 · EL ÚLTIMO CHIVITO 70 · MAESTRO DEL ¡ZAFÉ! 70 · GARRA CHARRÚA 90 · **LEYENDA DEL INFIERNO 150** (bloqueado hasta completar la TORRE DEL INFIERNO)

### RELATOR (lo grita cuando ganás por K.O.; 50 cada una)
¡LO DEJASTE DE CAMA! · ¡ANDÁ A CANTARLE A GARDEL! · ¡SE LE CAYÓ EL TERMO! · ¡QUÉ PAPELÓN, BO! · ¡A LLORAR AL CAMPITO! · ¡TOMÁ MATE Y AVIVATE!

**Totales:** trajes 3.350 · mejoras 3.910 · títulos 700 · festejos 480 · relator 300 = **8.740 fichas**.

## Pantalla de la tienda
- 5 pestañas (TRAJES · MEJORAS · FESTEJOS · TÍTULOS · RELATOR), lista de 8 filas con desplazamiento y un panel de vista previa animada:
  - traje: el traje puesto y, detrás, el original ("ANTES"); el retrato chico en cada fila;
  - festejo: la pose de victoria con tu traje;
  - título: maqueta del cartel de la VS;
  - relator: la frase en grande;
  - mejora: niveles, "AHORA" y "NIVEL n" y el aviso SÓLO EN PLENA MORTAL.
- Botón de acción: COMPRAR · N / FALTAN N / BLOQUEADO / PONERME / QUITAR / AL MÁXIMO. Para comprar hay que confirmar en "¿LO COMPRÁS?" (SÍ, DALE / NO). Lo comprado queda puesto enseguida.
- Controles:
  - teclado: flechas, PIÑA/Enter para aceptar, ESC para volver;
  - mando: cruceta o stick, A para aceptar, B para volver;
  - táctil: tocar la pestaña o la fila, tocar la fila elegida o el botón para comprar, flechas bajo la lista.
- Guardado: `localStorage['bb-v9'].pelea.tienda` (v:1). Se normaliza en cada lectura (campos faltantes o rotos se reparan). Los guardados viejos migran solos.
- Rendimiento: cada traje es un set de sprites del caché existente (cuadros generados y recortados una vez, a demanda). En la pelea dibujar un traje cuesta lo mismo que el original.
