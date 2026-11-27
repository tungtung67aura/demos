# PLAN v12 — Fighting Engine, 30 luchadores, Modo Torre, Modo Infinito

Brief completo: MISION-v12.md. Regla 1: NO recrear nada. El beat 'em up (Sistema A) queda igual; todo lo nuevo
se apoya en el esqueleto/IK de sprites.js, grado.js, audio por IDs (+ síntesis de respaldo), el guardado bb-v9
(se agrega `pelea` adentro, con migración) y el truco bb-dios.

## Arquitectura
- js/sprites.js: `generar(..., poses)` acepta un diccionario de poses propio por luchador (perezoso, cacheado);
  `articulaciones(def, pose)` devuelve las articulaciones sin rasterizar → hitboxes/hurtboxes exactos por cuadro.
  Ropa y rasgos nuevos (gorro de chef, casco, boina, auriculares, tirantes, corbata, placa, mochila, guitarra,
  peinados largo/cresta, piel de zombi) en ropa.js / sprites.js.
- js/pelea/poses-pelea.js: biblioteca de poses de pelea (guardias por estilo, ~40 plantillas de golpe) + frame data.
- js/pelea/luchadores.js: los 30 (cuerpo, ropa, estilo, golpes, 2 especiales, combo firma, definitivo, bio, frases,
  desbloqueo) + versiones de pelea de los jefes de campaña y de Pelado/Pato.
- js/pelea/motor.js: clase Pelea (rondas al mejor de 3, reloj, vida, súper, bloqueo alto/bajo, agarres, cadenas,
  cancelaciones, juggles, contador y escalado de daño, contraataque, hitstop, cámara, KO).
- js/pelea/ia-pelea.js: CPU con 3 niveles. js/pelea/ultimates.js: 32 escenas de definitivo distintas.
- js/pelea/arcade.js: pantallas (menú del modo, selección de 30, torres, versus, resultados, récords, infinito).
- js/infinito.js: oleadas sin fin del beat 'em up con jefes y nombres procedurales.

## Fases (commit + autoauditoría al final de cada una; checkpoint en PROGRESO.md)
1. Sprites: poses por luchador, articulaciones, ropa/rasgos nuevos.  
2. Datos: poses de pelea + 30 luchadores + jefes.  
3. Motor de pelea + IA + controles (táctil/teclado/pad).  
4. Definitivos (escenas) + efectos + audio nuevo (IDs en AUDIO.md).  
5. Menús: menú principal, selección arcade, Torre (3 torres), pelea libre, récords; progreso/desbloqueos en bb-v9.  
6. Campaña: jefes → pelea (ida y vuelta, sin trabas), Patovica del Cordón (evento en la feria) y Zombi del Cerro (secreto).  
7. Modo Infinito (beat 'em up) + Supervivencia (pelea).  
8. QA: 30×todos los ataques, 3 torres CPU vs CPU, transiciones de campaña, regresión vieja, migración, táctil, perf, capturas.  
9. bb-v12, bundle.

## Decisión: Modo Infinito
Oleadas del beat 'em up (lo natural: muchos enemigos, armas, comida, el motor que ya existe), en una arena fija
de un nivel que rota. Jefe cada 5 oleadas con nombre generado. Extra: SUPERVIVENCIA en el motor de pelea
(rivales sin fin, la vida se recupera poco entre peleas, "jefe" con apodo generado cada 5).
