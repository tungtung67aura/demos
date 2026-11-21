# Párate de mano ñeri (ex Barrio Bravo) — progreso (bb-v7 local, sin publicar; en línea sigue bb-v6)

Beat 'em up 2D en pixel art, PWA pensada primero para el celular. Referencia: ref/referencia.jpg. **NO PUBLICAR sin el OK del usuario.**

## Qué tiene
- Motor: Canvas 2D con resolución interna variable (alto de 270 a 300, ancho hasta 700) y escala ENTERA a píxeles de dispositivo (`image-rendering: pixelated`). Lógica a paso fijo de 1/120 s, con máx. 8 pasos por cuadro e interpolación de render (anda a 60, 120 y 240 Hz).
- Sprites 100% procedurales (js/sprites.js): esqueleto por pose → partes rasterizadas con sombreado y contorno propio. 21 animaciones por personaje, espejadas de antemano, unos 0,4 s al cargar. Retratos de frente para el HUD y el ícono.
- Nivel 1, "La cuadra del Cana":
  - Recorrido (3400 px): murales (CANDOMBE, CARBONERO, VAMO ARRIBA), Almacén El Cana con FRÍO, Bizcochos y PAN $, moto, parada 121 con mural de carnaval, Complejo CH 99 con banderas de Uruguay, Peñarol y Nacional y ropa tendida, cancha del Club El Cana y Bar Parrilla El Tano (CHIVITO $390).
  - Fondo: postes con maraña de cables, Palacio Salvo en el horizonte y cielo de atardecer.
  - Hay 5 oleadas con candado de pantalla y la flecha "¡DALE!". En la 3.ª pasa el ómnibus 121 y te atropella a vos o a los enemigos. Al final, el jefe El Tano: embestida, pisotón, llama a "los muchachos" al 50% y aguanta golpes; solo cae con remates.
- Combate:
  - Combo de 3 piñas (se encadena solo si conecta), piña, piña y después patada, patada (si el enemigo está aturdido, lo tira), salto y patada voladora, especial giratorio (cuesta 8 HP, o es gratis con la barra MANO llena).
  - Agarre al caminar contra un enemigo: rodillazo x3 o revoleo, y el revoleado sale como proyectil.
  - Derribos con rebote, hitstop, temblor de pantalla, estrella de impacto, contador de combo y BONUS % (100 + 50 por golpe, hasta 800%), puntos, vidas, tiempo y continuar.
- Ítems:
  - Armas: palo, botella (se rompe), termo y garrafa (se tira y explota).
  - Comida: bizcochos, chivito y mate (este último también carga MANO). También billete y una pelota que se patea.
  - Rompibles: cajón de cerveza, caja de bizcochos y tacho. Los ítems no se pierden fuera de la pantalla.
- IA: un director reparte turnos (2 atacan y el resto rodea por los dos lados), con retroceso después de atacar.
  - Chucho (buzo gris) tira botellas de lejos.
  - Mati esquiva y mete jabs rápidos.
  - Cacho es pesado, avisa con "!" antes de pegar y a veces ni se mosquea con los golpes.
  - Variantes de color, incluida una de Cacho de Nacional (BSO).
  - Frases en jerga: "¡QUÉ HACÉS, BOBO!", "¡ALTO GIL!", "¡AY, MAMITA!", "¡VAMO ARRIBA!", "¡QUÉ RICO, BO!" y más.
- Personajes:
  - El Seba: equilibrado.
  - El Pelado: fuerte y lento, 130 HP, pega x1.4 y recibe un 10% menos.
  - La Pato: rápida y débil, 82 HP, pega x0.82, ataca un 25% más rápido y salta más.
- Controles:
  - Táctil: stick flotante, botones PIÑA, PATADA, SALTO y ESP, y pausa. Respeta el safe-area.
  - Teclado: flechas o WASD; J/Z piña, K/X patada, L/Espacio/C salto, I/U/V especial, Esc/P pausa.
  - Joystick: estándar.
- Audio: SFX sintetizados y un loop de candombe (chico, repique, piano, madera, bajo y riff) con variante para el jefe.
- PWA: manifest horizontal, íconos y sw.js de red primero con caché `bb-v1`. Se actualiza solo en el menú; si estás jugando, recarga al salir al menú.

## Pruebas (headless, /workspace/fun/tools-bb)
- `partida.py <0|1|2> 4 tag`: el bot juega el nivel 1 completo con cada personaje. Ganó con los tres, sin errores JS.
- `perf.py`: render CPU p50 0,1 ms / p99 0,5 ms y lógica p99 0,2–0,4 ms por cuadro, en 852x393@3x, 1280x720 y 1920x1080.
- `swtest.py`: verificado que no recarga en medio de la partida y que recarga al volver al menú.
- `menus.py`, `fotos.py`, `smoke.py`, `hoja.py`: capturas y planilla de sprites.

## Pasada de pulido (13/11/2026)
- **Personajes**: sombreado de 4–5 tonos (sombra profunda, media, luz, borde cálido de atardecer arriba, tramado), contorno grueso, caras legibles (ojo con pupila, párpado, ceja que se frunce, nariz, boca), pliegues en rodilla, codo, ruedo y bolsillo. Más cuadros de animación: quieto 4, caminar 8, cada golpe con cuadro extra de recuperación.
- **Fondos**: manchas de humedad, aires acondicionados, caños, afiches (LLAMADAS, MURGA, TOQUE, SE ALQUILA…) y volantes, grafitis, plantas y macetas en balcones, championes colgados del cable, baldosas rotas, pasto, hojas de plátano, cordón pintado, cebra en la parada, 6 charcos que reflejan el atardecer, parches y tapas en el asfalto, mostrador del almacén con salames y balanza, cartel ABIERTO. Banderas: Uruguay, Peñarol y Artigas.
- **Primer plano**: contenedores, cartones, cajones, garrafas y tachos oscurecidos con parallax 1.25, cortados abajo y por delante de la acción.
- **Jefe**: ya no se va al borde. Se acomoda del lado del centro de la pantalla y tiene márgenes de arena (el jefe a 44 px del borde y el jugador a 24). A la mitad de vida cae un chivito.
- **Enemigos con armas**: levantan el palo, la botella o el termo del piso (reservan el ítem para no pelearse por él), pegan con `e_golpe` (×0.75 del daño del arma), el que tira botellas la revolea si la tiene en la mano, y la sueltan cuando caen.
- **Bug arreglado**: una pelota empujada sin dueño le pegaba al jugador en bucle hasta matarlo. Ahora solo lastima si alguien la pateó.
- **Bot de pruebas más humano**: tiempo de reacción de 0,18 s, esquiva el 80 % de los ataques con aviso y el 55 % de los rápidos, se pone del lado de afuera del grupo, junta armas, come cuando tiene poca vida, salta al bondi a la vereda, usa la especial si lo rodean y hace patadas voladoras.
- **Balance** (6 corridas del bot, nivel 1): todas ganadas. Seba perdió 0–1 vida (10–14 golpes recibidos), el Pelado 0 (7) y la Pato 1 (11–14). Ajustes: enemigos un poco más rápidos para reaccionar, buzo y mati con +1 de daño, cupo de 3 atacantes desde la oleada 3 con 4 o más enemigos, daño del Tano de 13 a 11,5.
- Pruebas nuevas: `tools-bb/armas.py` (los enemigos juntan armas), `tools-bb/entrega.py` (capturas de pelea y jefe), `tools-bb/traza.py` (traza del bot).
- Rendimiento: render p99 0,6 ms y lógica p99 0,3 ms (headless, 852×393 @3x).

## Pasada de personajes (13/11/2026, tarde)
- **Sprites por capas**: cuerpo del personaje (piel, pelo, contextura, barba/bigote/lentes) + ropa en 4 ranuras (cabeza, arriba, abajo, calzado), en `js/ropa.js`. Cada parte tiene su sombreado (4–5 tonos con luz de atardecer) y su contorno. Todo se genera una vez y se guarda recortado en canvas fuera de pantalla: en juego sigue siendo 1 drawImage por luchador.
- **Anatomía**: cabeza con perfil real (frente, nariz, labios, mentón, mandíbula según el personaje), oreja, peinados con forma (corto, flequillo, rapado, pelado, cola con gomita, rulos, engominado), brazos y piernas con bíceps, antebrazo y pantorrilla, puños con nudillos, manos abiertas al agarrar, zapatillas con suela, puntera, franja y cordones, ojotas, botitas y zapatos.
- **Caras con expresión**: normal, enojo (párpado y ceño), grito (boca abierta con dientes), dolor (ojo apretado), KO (ojos cerrados) y feliz.
- **Ropa**: buzo URUGUAY holgado con capucha caída, cordones y bolsillo canguro; musculosa con cadena y tatuaje (Pelado); celeste 10 con calza (Pato); campera deportiva con cierre y rayas; campera abierta con remera; saco con solapas (Tano); jean, deportivo con rayas y puño elástico, short con medias, calza, pantalón de vestir.
- **Camisetas de clubes** (solo colores y diseño genérico, sin escudos ni sponsors): Peñarol (rayas aurinegras), Nacional (blanca con azul y rojo), Danubio (blanca con franja diagonal negra), Defensor Sporting (violeta), Wanderers (rayas blanquinegras) y City Torque (celeste con marino). Las usan los enemigos (variantes) y se pueden elegir para los jugadores.
- **Variantes de enemigos** con ropa y pelo distintos (capucha puesta, gorra al revés, rulos, rapado, visera). En la oleada 5 se cambiaron 2 variantes para que aparezcan Wanderers y Torque (solo cambia la ropa).
- **Animación**: respiración en quieto (4 cuadros), caminata de 8 cuadros con rebote, golpes con anticipación, golpe y seguimiento (elegidos por fase arranque/activo/recuperación sin cambiar tiempos ni alcances), dolor alto/bajo con aplaste y retroceso, vuela subiendo y bajando, levantarse en 3 cuadros, rodillazo en 2, juntar en 2, festejo en 2, y quieto/caminar con arma (palo al hombro).
- **ARMÁ TU PINTA**: pantalla nueva después de elegir personaje. Vista previa animada a 2x, retrato del HUD, flechas por ranura (táctil, teclado y joystick), AZAR (botón o especial), VOLVER y ¡A LA CANCHA! Se guarda por personaje en localStorage (`bb-ropa-<clave>`). Es solo cosmético. El título, la selección y el HUD muestran la ropa guardada.
- Los enemigos del nivel se pre-generan de a uno en los menús (unos 120 ms cada uno en escritorio).
- SW `bb-v4` (incluye `js/ropa.js`).
- Pruebas nuevas: `tools-bb/vestuario.py`, `tools-bb/lineup.py` (con `tools/lineup.html`) y `tools-bb/tiempos.py`.

## Pendiente / ideas (histórico, ver bb-v7 al final)
- ~~Niveles 2 y 3~~ → hechos en bb-v7 (6 niveles).
- ~~Enemigos que levantan armas, más ataques del jefe~~ → hechos.
- Marcas reales: se evitó Coca-Cola/Pepsi y se usaron carteles genéricos (FRÍO). Faisán no aparece escrito.
- Probar en un iPhone real: para 120 fps en Safari hay que apagar el flag "Prefer Page Rendering Updates near 60fps".

## Escala real del escenario (13/11/2026, noche)
- Regla: 56 px ≈ 1 m, base de las fachadas en y=168. Persona 1,65–1,85 m (92–103 px), puerta 2,10 m (118 px), ventanas 0,95–2,20 m, local 2,35 m, refugio de la parada 2,40 m.
- `calle()` reescrita a escala: solo se ve la planta baja (losa del balcón del Complejo arriba, banderas colgadas de ahí); cielo solo por el baldío (muro 2,6 m), la parada (muro 2,5 m) y el alambrado de la cancha.
- La capa de la calle tiene 40 px extra arriba (`EXTRA`) para pantallas de hasta 300 px de alto (juego y menú).
- Props a escala: contenedor IMM 100×82, moto 106×60, perro 46×32, tacho 30×48, garrafa 20×32, palo 48 (coincide con alcance 46).
- Contenedores pasan a la vereda de atrás; el primer plano ya no usa contenedores ni tachos.
- Bondi 644×172 (≈11,5 m); el atropello cubre todo el largo y se borra a cam-700.
- El Tano baja de escala 1,26 a 1,12 (≈1,93 m, grandote pero no gigante).
- Textos de pecho (URUGUAY, números) ya no se ven al revés cuando el personaje mira a la izquierda.
- Herramientas: `tools-bb/proporcion.py`, `tools-bb/calle.py`. Caché del SW: bb-v4.

## Pasada de detalle de personajes (13/11/2026, noche)
- Luchadores a densidad 2×2 (`Q=2` en sprites.js, `Buf(w,h,q)` en pixel.js): misma altura en pantalla (56 px/m), el doble de resolución.
- Lienzo principal a densidad D (2 en pantallas con escala par; 3 o 1 en el resto) con `setTransform`: fondos y textos iguales, luchadores con todo el detalle.
- Sombreado fino de 6 tonos (`sombrearQ`): luz cálida de atardecer arriba/izquierda, sombra fría abajo/derecha, tramas de transición. Contorno exterior de 2 subpíxeles e interior de 1.
- Caras: ojo con iris y brillo, párpado, ojera, cejas gruesas, nariz con fosa y luz, labios, barba de días tramada, pómulo y oreja.
- Manos abiertas con dedos y pulgar; puño con nudillos. Zapatillas con suela de 3 capas, cordones, talón y puntera, sin logos.
- Tres rayas finas en pantalones y mangas deportivas (sin marcas). Pliegues en torso, mangas, rodillas y tobillos.
- Poses: patada voladora como la referencia; caída en 3 cuadros, golpe contra el piso, levantada en 4 cuadros (se sienta, cuatro patas, rodilla, de pie). Destello blanco al recibir golpe, estrella de impacto más grande, '!' la primera vez que un enemigo va al frente.
- Cuerpos: Mati flaco (campera verde), Cacho panzón con papada y cachetes, Chucho (buzo gris + gorra) con tatuajes y barba de días.
- Retrato del HUD: primer plano dibujado aparte a densidad 2 (30 px), con la ropa elegida; recuadro más grande.
- Memoria: sin copias espejadas (se espeja al dibujar); textos del pecho con parche chico. ~7–9 MB por set, 150–190 ms de generación en PC.
- Botones táctiles más chicos y transparentes; se vuelven casi invisibles si hay un luchador debajo.
- Herramientas: `tools/retratos.html`, `tools-bb/retratos.py`, `tools-bb/escena.py`, `tools-bb/pelea.py`. SW bb-v4.

## Personajes "distorsionados" en el teléfono (13/11/2026, bb-v5)
Causas encontradas:
- **Escala no entera de los subpíxeles**: los luchadores estaban a densidad 2 fija, pero con escala 3 (iPhone XR/11 apaisado, teléfonos de 1200-1300 px de ancho en vertical) el lienzo estaba a densidad 3 → cada subpíxel caía en 1,5 px de pantalla: filas/columnas dobles y simples alternadas (rayas cortadas, contornos de grosor irregular, barba "rota"). Con escala 1/5/7 el lienzo estaba a densidad 1 y se perdía la mitad de los subpíxeles.
- **Posición a medio píxel** con densidad 3 (1,5 px de pantalla): muestreo en el borde entre píxeles.
- **DPR fraccionario** (2,625; 2,75): el tamaño CSS del lienzo podía redondearse ±1 px y estirar la imagen.
- **Anatomía**: el ancho del cuerpo (1,4 en Cacho y el Tano) inflaba hombros, cadera, brazos y piernas por igual → cajón con brazos-tubo y piernas-bolsa; el hombro de atrás asomaba como joroba; el extremo redondo del muslo de adelante quedaba encima del torso ("globo" en la cintura); tramas y pliegues de 1 subpíxel en tela negra se veían como ruido; borde de luz marrón en el negro.
Arreglos:
- Densidad de los sprites = densidad del lienzo, que siempre divide a la escala (2 con escala par, 3 con escala 3/9, 1 con 1/5/7). El generador es independiente de la densidad (sombreado, contorno exterior de 1 px del juego, cara, manos y zapatillas escalados). Cambio de densidad al rotar: sprites regenerados.
- Posiciones en la grilla de 1/Q px. ResizeObserver con device-pixel-content-box corrige el redondeo de ±1-3 px. `image-rendering: pixelated` queda último.
- Medidas: el ancho pesa 50% en hombros/cadera y 28% en brazos/piernas; Cacho tiene panza (13) que sale abajo, el pecho no. Pelado músculo 1,14. Hombro de atrás metido, hombros caídos, mangas que se afinan hacia el puño, piernas menos holgadas y ruedo menos acampanado. Pierna de adelante antes que el torso.
- Telas oscuras (#2b2b35 en vez de casi negro): sombreado en bandas sin tramas, borde de luz suave, sin pliegues-rayón; puños en tono más claro. Barba de días y rapado como puntos en grilla. `pulir()` saca espuelas y rellena muescas antes del contorno.
- "URUGUAY" en letra fina que entra entera en el pecho. Retrato chico del HUD dibujado a su tamaño (antes se achicaba con suavizado = borroso).
- Memoria/tiempo: las animaciones se dibujan a demanda y se terminan en segundo plano (menús 8 ms/cuadro; en juego ≤1 pose cada varios cuadros). Los enemigos sólo calientan lo que su IA usa. Set inicial: 19 ms (q=2) / 29 ms (q=3).
- Alturas idénticas a bb-v4 con q=2 (Seba 103,5; Pato 92,5; Chucho 100; Mati 96; Cacho 100; Tano 109) y ±0,33 px con q=3.
- Herramientas: `tools-bb/cacho.py` (escena de teléfono + recorte ampliado), `tools-bb/poses4.sh` (Q=3 opcional), `tools/alturas.html`, `tools/mem.html`; `partida.py` acepta VW/VH/VD.

## Auditoría del generador de cuerpos (13/11/2026, antes de bb-v6) — por qué la anatomía falla desde el origen
Revisé `js/sprites.js` (partes → dibujarPose → torso/brazo/pierna/calzado → capa). Las fallas no son de dibujo sino de construcción:
1. **No hay canon de proporciones.** Las medidas salen de multiplicadores sueltos (`e = escala·1,45`): cabeza de 13,6 unidades × k=1,81 ≈ 25 px en un cuerpo de ~100 px → **4 cabezas de alto** (chibi), cadera a 0,41 de la altura (piernas cortas), antebrazo igual de largo que el brazo, cuello casi inexistente. El "ancho" del personaje multiplicaba también huesos/miembros.
2. **No hay esqueleto.** No existen hombros izquierdo/derecho ni caderas izquierda/derecha: los hombros son "adelante/atrás del torso" (`hombroF/B = s ± n·shW·0,3`) en un perfil plano, así que los brazos salen del pecho y de la espalda, no de los costados; las dos caderas salen casi del mismo punto (±2,5 px) → **las piernas se pisan**.
3. **Poses por ángulos crudos + corrimientos ad hoc.** `by` baja la cadera sin re-resolver las piernas (pies que flotan o se hunden, rodillas que no acompañan el peso), `lean`/`bx` mueven el torso sin redistribuir el peso. No hay límites articulares: nada impide codo o rodilla al revés.
4. **Tobillo trabado a 90°**: el pie se orienta con la canilla (`calzado(..., a)`), así que al inclinarse la pierna el pie se inclina con ella (pies "en puntas" o clavados en el piso).
5. **Torso = una losa de perfil** (un polígono 2D) mientras cabeza y miembros se leen de 3/4: hombros y pecho no tienen volumen ni giro; la panza se agregaba como un bulto al polígono.
6. **Contorno negro alrededor de CADA capa** (brazo, pierna, torso por separado): cada pieza queda recortada con línea negra → aspecto de muñeco "por partes", desarticulado.
Conclusión: hay que reconstruir el cuerpo desde un esqueleto 2D con canon, caderas y hombros a los costados (vista 3/4), poses por articulaciones (IK para pies apoyados y puños, límites de codo/rodilla, tobillo propio) y contornos interiores en tono oscuro del color (no negro) con contorno negro solo en la silueta.

## bb-v6: esqueleto nuevo + nombre "Párate de mano ñeri" (14/11/2026)
- Cuerpo reconstruido desde un esqueleto 2D (`medidas`, `secciones`, `esqueleto` en sprites.js): canon de 5 cabezas, huesos con el mismo largo para todos (proporcionales a la escala; el tipo de cuerpo cambia masa, no huesos), hombros y caderas a los costados en vista 3/4, IK de dos huesos para pies apoyados y puños (rodilla siempre adelante, codo siempre abajo/atrás, límites 0..2,6 rad), tobillo con ángulo propio, tronco por secciones con volumen (pecho, panza, espalda), pelvis + pierna cercana en una pieza, costuras en tono oscuro del color entre capas y contorno negro sólo en la silueta.
- Todas las poses reescritas por articulaciones (guardia de boxeo, jab con la mano adelantada, directo con rotación de cadera y talón levantado, gancho, patada frontal, caídas, levantada en 4 cuadros…). Alturas en pantalla iguales a bb-v5 (escala 56 px/m intacta).
- Ropa: número de camiseta centrado en el pecho (con parche para no espejarse), puños/hombros de manga como bandas dentro de la manga (antes eran discos encima).
- Nombre visible: título PÁRATE DE MANO / ÑERI, manifest ("Párate de mano ñeri" / "Párate ñeri"), apple title, og tags, ícono "ÑERI". Claves de localStorage `bb-*` sin cambios.
- Pruebas: partida completa ganada con Seba (852×393@3), Pelado (852×393@3) y Pato (1920×1080@1), 0 errores; lógica máx 0,3–0,9 ms; render p99 ~1 ms. Herramientas: `tools/anatomia.html` (+`tools-bb/anat.py`), `tools/combos.html`.

## bb-v7: expansión grande (20/11/2026) — local, SIN publicar
Commits: 26b8f9b (pintores de escenarios + arquitectura de audio), c1d1a86 (núcleo jugable), 12fb7b9 (balance), 3043028 (audio-check), 985139d, 9516907 y siguientes (QA). Caché del SW: `bb-v7`.

### 6 niveles (js/niveles.js, js/escenarios/*.js)
| # | Nivel | Hora | Eventos | Peligros | Mini jefe | Jefe |
|---|---|---|---|---|---|---|
| 1 | La cuadra del Cana (barrio) | atardecer | bondi 121, macetas que caen | — | El Gran Cacho | El Tano |
| 2 | Feria de Tristán Narvaja (Cordón) | domingo de mañana | changuitos desbocados, carro con caballo | — (puestos y cajones de fruta rompibles) | El Muelle (patova) | Doña Chola |
| 3 | Avenida 18 de Julio (Centro) | mediodía | bondis CA1/185/121 por el carril, palomas, carro | carril del bus | El Cuida Mayor | El Guarda |
| 4 | Barrio Sur, noche de llamadas | noche | comparsa que pasa y agranda a los enemigos, apagón | 3 fogatas | El Piano Mayor (tambor) | El Bocha |
| 5 | Ciudad Vieja y el Mercado | día gris | turistas (pegarles resta), lluvia | 3 parrillas | El Maître (mozo) | El Parrillero |
| 6 | La Rambla en tormenta | tormenta | olas que revientan contra el muro, gaviotas que se tiran en picada (pegales en el aire), lluvia y rayos | — | Don Corvina, El Heladera | Don Pepe, el Capo |
- Cada nivel: escenario propio pintado a escala (56 px = 1 m), decorado sólido (contenedores que se patean y aplastan, motos, bancos), rompibles con lo que sueltan (cajones, tachos, puestos, mesas, macetas, revisteros, conservadoras, barriles, cajas de bizcochos), armas en el piso, primer plano propio, gradación de color por hora, música y ambiente por ID, dificultad creciente (`dif` 1 → 1,42) y cupo de atacantes.
- Mapa de Montevideo para elegir nivel (se desbloquean al ganar; `bb-nivel-max`), pantalla de nivel ganado con bonus de tiempo, y final "¡MONTEVIDEO ES TUYO!". Puntos/vidas pasan de un nivel al siguiente; vida extra a los 100 000 y después cada 200 000 (con 50 000 se ganaban 2–3 vidas por nivel).

### Enemigos (js/ia.js, un comportamiento por tipo)
- Comunes: Chucho/buzo (tira botellas), Mati (rápido, esquiva), Cacho (pesado, aviso "!"), **chorro** (te roba la comida, el arma o la plata y se escapa: si sale de la pantalla se lo lleva; si lo bajás lo devuelve), **patova** (bloquea de frente, al 3.er bloqueo te agarra y te revolea; hay que machacar para zafar), **gurí** (gomera de lejos, se escapa 1 s y se planta), **cuidacoches** (palo largo con aviso), **doña** (escoba y naranjas por arriba), **tambor** (toca y agranda a los suyos 5 s, onda de cerca), **mozo** (bandeja que va y vuelve + combo rápido), **pescador** (caña que te engancha y te trae).
- Mini jefes con aura roja, barra "MINI JEFE · nombre", ×1,25 de daño, ×2 puntos y sueltan comida.
- Jefes con fases: **Tano** (embestida, pisotón, llama a los muchachos), **Doña Chola** (carrera con el changuito, naranjas en arco, cucharón; sobrinos al 50 %), **el Guarda** (silbato que llama un bondi, abanico de boletos, maquinazo), **el Bocha** (guardia, combos encadenados, contraataque, furia al 40 %), **el Parrillero** (brasas en el piso con aviso, chorizos que rebotan, pinza; aviva las parrillas al 50 %), **Don Pepe** (paraguas escudo, estocada, giro; llama a los muchachos al 60 %; al 30 % pierde el paraguas y se enfurece).
- Director de IA cada 0,25 s: cupo de atacantes por nivel; los de lejos no ocupan cupo; jefes y minis siempre pelean; tambor y gurí van al frente si quedan solos.

### Armas y objetos (js/datos.js ITEMS)
Medido con `tools-bb/armas7.py` (daño contra un muñeco, golpes hasta romperse = durabilidad):
palo 12 ×8 · botella 9 ×2 (se rompe en vidrios) · termo 10 ×14 · silla 16 ×3 (tumba; deja una pata) · pata 9 ×6 · caño 15 ×18 (aturde, lento) · escoba 7 ×10 (alcance 64) · cajón 13 ×2 (tumba) · corvina 8 ×5 (aturde) · bandeja 7 ×4 (rápida) · caña 6 ×6 (alcance 70) · garrafa 48 (explota, empuja contenedores, rompe todo) · ladrillo 20 (tiro) · naranjas 3 tiros de 9.
- Las armas rompen la guardia (patova, Bocha, paraguas). Las armas propias de jefes no se gastan; algunas de enemigos se sueltan al caer (palo, escoba, caña).
- Proyectiles de enemigos: piedra, boleto, naranja, chorizo (con rebote).
- Escenario interactivo: contenedores que se empujan a patadas o con cuerpos revoleados y aplastan, rompibles con premio, fogatas/parrillas/brasas que queman a todos, bondi que atropella a todos, ítems que nunca quedan dentro de un decorado sólido.

### Audio (sólo arquitectura; sin audios inventados)
- 297 IDs en `js/audio-ids.js` (categorías: ui, golpes, impactos, armas, mov, enemigos, items, eventos, voces, frases, musica, ambiente). Lista completa con descripción y carpeta: **AUDIO.md**.
- Para sumar audio: copiar `audio/<carpeta>/<ID>.ogg` (variantes `-1`, `-2`…), correr `node tools/audio-manifest.mjs`. Sin tocar código. Respaldo opcional: los sonidos sintetizados originales (`sinteDeRespaldo`).
- `node tools/audio-check.mjs`: verifica que cada ID usado por el código exista en el catálogo (hoy: 114 usados, 0 faltantes).
- Probado con OGG de prueba en una copia temporal (borrada): el manifiesto los detecta, ignora archivos con nombre que no es ID, carga variantes, la música arranca por ID, y los IDs sin archivo caen al sintetizado sin errores.

### QA (Playwright headless, 127.0.0.1)
- `niveles7.py` (bot, turbo 4): los 6 niveles ganados con Seba y con el Pelado, 0 errores JS. Atascos encontrados y arreglados: patova/Bocha bloqueando en bucle, gurí que huía para siempre, conos que encerraban, comida inalcanzable, tambor escondido detrás de un contenedor.
- `armas7.py` (matriz de armas), `eventos7.py` (13 eventos + brasas, 0 errores), `flujo7.py` (título → selección → vestuario → juego → pausa → gana → nivel 2 → continuar → menú → mapa → final: 18/18), `audio7.py`, `perf7.py`.
- `niveles7.py` también con la Pato: 6/6 ganados. `tactil7.py`: botones PIÑA/PATADA/SALTO, stick y pausa táctil OK en 852×393@3 con touch. `rotar7.py`: rotar/cambiar tamaño en plena pelea (densidad 2↔3) sin errores. `memoria7.py`: 6 niveles seguidos, una sola copia gradada por cuadro (heap JS 13→41 MB). `swtest.py`: SW bb-v7 no recarga en plena partida y sí al volver al menú. `vestuario.py` OK.
- `balance7.py` (sin ayudas, bot con reacción humana, Seba): 6/6 ganados sin continues; vidas que quedan 4 → 1–2 (la dificultad sube nivel a nivel).

### Rendimiento (headless, 852×393 @3, Chrome de escritorio sin GPU; no es un iPhone)
- Partida normal (`perf7.py N natural`, 40 s): render p50 0,2 ms / p99 0,7–0,9 ms, lógica p99 0,2 ms; pico máx. 2,8–6,4 ms (antes del pre-gradado: 24,6 ms).
- Caso extremo (`perf7.py`: apagón + lluvia + llamadas + palomas + brasas + bondi + 6–8 enemigos): render p99 1,8–2,1 ms; un pico al disparar todo junto.
- Presupuesto para 120 Hz: 8,3 ms por cuadro. En iPhone hay que mirar: Safari limita a 60 fps salvo que se apague "Prefer Page Rendering Updates near 60fps" (o en PWA instalada según versión de iOS).

### Bugs arreglados en esta etapa
- Reloj congelado toda la pelea con el jefe (venía de bb-v6: `!jefeIntro` con valor negativo). Ahora corre y el jefe arranca con ≥ 2:00.
- Bot y juego: comida dentro de un decorado sólido (inalcanzable) → los ítems se corren afuera; tambor/gurí que se quedaban lejos siendo los últimos → van al frente; relámpago muy fuerte (72 % blanco) → 36 %; carteles con typo ("REFUEGO") y una marca real → genéricos; pantalla final con textos superpuestos; al rotar el teléfono sólo se regeneraban los sprites en pantalla.
- Memoria: al pasar de nivel se sueltan las copias gradadas de la hora anterior.

### Pasada de terminación t72u (20/11/2026, noche): mapa nuevo + auto-auditoría
**Mapa de Montevideo nuevo (`js/mapa.js`)**
- Geografía reconocible pintada píxel a píxel: costa sur con Punta Carretas y playas, Rambla, Bahía con muelles del puerto, península de Ciudad Vieja, Cerro con la Fortaleza, eje 18 de Julio → Av. Italia, Bulevar Artigas, Agraciada, parques (Prado, Rodó, Batlle, Buceo), manzanas (más apretadas y viejas en Ciudad Vieja), árboles de vereda, rosa de los vientos, barrios rotulados (Prado, Tres Cruces, Pocitos, Buceo, Unión, Peñarol, Colón según el espacio).
- Cada nivel es un hito ilustrado (almacén con parada, puesto de feria, Palacio Salvo, tambor, Mercado del Puerto, letras MONTEVIDEO) + decorados (Fortaleza, Palacio Legislativo, Estadio, Faro de Punta Carretas).
- Estados: cerrado (ícono apagado + candado), abierto, ganado (placa verde + estrella; se guarda en `bb-ganados`). Recorrido animado en dorado sobre los tramos abiertos y punteado gris en los cerrados; la cara del jugador viaja por el camino.
- Ficha: foto del nivel (ventana real del escenario, reducida 2:1), NIVEL, nombre en ≤2 líneas, barrio, ícono y nombre de la hora, dificultad en 5 marcas, retrato y nombre del jefe (??? si está cerrado), botones VOLVER / ¡DALE! (CERRADO).
- Entrada/salida con fundido; teclado, mando y toque (tocar elige, volver a tocar entra); sonidos `ui.mapa`, `ui.mover`, `ui.ok`, `ui.atras`, `ui.bloqueado`.
- Pantallas angostas (4:3): la ciudad no se deforma (se ve más ciudad al norte), las placas que no entran se separan con un palito al lugar real y los rótulos esquivan hitos.
- Rendimiento: capas fijas cacheadas a la densidad de la pantalla → 1,4 ms/cuadro p50 a @3; fotos por ventana 20–90 ms (antes 200–460) y se precargan en el vestuario.
- Pruebas: `mapa7.py` (5 tamaños/DPR, nivel cerrado no entra), `mapa7t.py` (toque 21/21), `flujo7.py` 18/18.

**Auto-auditoría: qué encontré y arreglé**
- Pausa sin panel, encimada al cartel del nivel → panel propio, opción resaltada, ayuda según dispositivo; los carteles del HUD se ocultan en pausa/continuar/tablero.
- ¿SEGUÍS? era texto suelto → panel con anillo de cuenta regresiva y aviso de que los puntos vuelven a cero.
- Tablero de nivel: título dibujado dos veces, "TIEMPO" ambiguo → panel, "BONO TIEMPO", cifras que se cuentan.
- Pantalla final y título: texto sobre fondo cargado → panel / banda oscura; aviso "TOCÁ"/"APRETÁ PIÑA" según dispositivo y sin pisar a los personajes.
- Cambios de pantalla en corte seco → fundido corto desde negro en cada cambio.
- HUD sin respaldo (se perdía sobre fachadas; BONUS flotando) → placas, vida "fantasma" que se vacía de a poco, marcas cada 10 %, barra de MANO que brilla al estar lista, arma y durabilidad dentro de la placa.
- Aviso de jefe era texto suelto → franja roja con retrato que entra barriendo. Cartel de nivel con el ícono del mapa.
- Letterbox en negro plano (algunos DPR) → fondo con degradé y marco del lienzo.
- Identidad: vuelve COLET al afiche del almacén (estaba en la lista pedida), paquetes de yerba en los dos almacenes, termo y mate en el mostrador.
- Enemigos: revisados en fila (11 tipos × 3 variantes + 6 jefes): siluetas, contexturas y ropa de oficio distintas; no hay recolores.
- Bug de atasco: el chorro que no llegaba a escaparse quedaba "escapando" fuera de cuadro y la oleada no terminaba (visto como 1600 s en la feria) → vuelve a pelear + red de seguridad: cualquier enemigo >5 s fuera de cuadro vuelve a entrar.
- Balance por personaje (bot con reacción humana, sin ayudas): la curva tenía un pico en Barrio Sur (2 continues con Seba) y en la Rambla con la Pato → Bocha más lento y con reacción humana, jefes 2/5/6 con algo menos de vida, dificultad 1.20/1.30/1.37 en los niveles 4–6, Pato 92 HP y daño 0.88.

- Regresión final: el jugador podía quedar tirado para siempre si moría con la vida repuesta en el mismo cuadro (muerto con hp>0) → revive igual (0d40e76).

### Pendiente (sólo lo que necesita al usuario o hardware real)
- Audios de los amigos: el sistema acepta cualquier subconjunto de archivos (ver AUDIO.md); hoy suenan los sintetizados de respaldo.
- Probar en el iPhone real (120 Hz, táctil, PWA instalada): acá sólo hay emulación de tamaño/táctil en Chrome headless.

### Checkpoint (20/11 20:26)
- Hecho: mapa nuevo, auto-auditoría de pantallas/HUD/carteles, identidad (Colet, yerba, mate), balance (ver arriba), bug del chorro, bug del bot con termo.
- Balance sin ayudas (cada nivel con 3 vidas nuevas): Seba 6/6 (1 continue en niveles 4 y 6), Pelado 6/6 sin continues, Pato 6/6 (niveles 4–5 sin continues tras el ajuste; en la Rambla 1–2).
- Sigue: regresión completa → perf → bundle → hitos/collage → informe.

- Checkpoint (20/11 20:55): niveles7 18/18 gana (3 personajes × 6 niveles), 0 errores JS. Encontrado y arreglado: jugador podía quedar trabado en 'piso' si muerto con hp>0 (0d40e76). Siguiente: flujo7, tactil7, mapa7t, eventos7, armas7, rotar7, memoria7, vestuario, audit7, swtest (solo), perf7, bundle, hitos+collage, informe.
- Checkpoint (20/11 21:02): regresión OK — flujo7 18/18, tactil7 OK, mapa7t 21/21, eventos7 13 eventos + brasas OK, armas7 OK, rotar7 5 cambios OK (D/Q correctos), memoria7 heap ≤36 MB, vestuario OK, audit7 OK; 0 errores JS. Siguiente: swtest (solo), perf7, mapa7c, bundle, hitos+collage, informe.
- Checkpoint (20/11 21:07): swtest OK (sw.js restaurado, bb-v7). Perf 852x393@3 headless (render por software): natural render p50 0.2/p99 0.8 ms; estrés (apagón+lluvia+llamadas+brasas+bondi+7 enemigos) p50 0.5, p99 2.9–8.1 ms según corrida (picos de primera generación de sprites); lógica p99 0.3 ms; mapa p50 1.4/p99 2.7 ms. Siguiente: bundle, hitos+collage, informe.
- Checkpoint (20/11 21:10): bundle /workspace/fun/publish-bb.tgz rehecho desde c15a309 y verificado en :8995 (bb-v7, sin errores, sin 404). Hitos regenerados (12, con el mapa nuevo) en shots-bb7/hitos + shots-bb7/collage-bb7.png. Falta solo: informe final. NO publicado.
- Checkpoint (20/11 21:35): perfilado confirmado (med.tGenR): TODOS los cuadros >2 ms eran generación/gradado/silueta en caliente (hasta 62 ms en 24 cuadros de una animación nueva); sin eso p99 1,1 ms. Arreglo ad28783: el dibujo nunca genera (cuadroListo usa el cuadro listo más cercano y pide la animación al calentador, que además la gradúa), gradado ≤2 y silueta ≤1 por cuadro. Estrés n3 ×5: p99 1,3–1,4 ms, máx 3,7–5,9; n5 p99 1,6/máx 5,4; n0 p99 1,3/máx 3,4; natural p99 0,7/máx 1,1. Balance nivel 6 (post tambor/Capo): Seba gana 0 continues, Pelado gana 0, Pato gana 1 continue (reloj 2 s). Siguiente: regresión completa + Pato n6 otra vez, bundle, informe.
- Checkpoint (20/11 22:08): reloj del jefe con piso 150 s (180 s jefe final) — 29b0803. Pato n6: gana, 1 continue, quedan 85 s (antes 2 s / 23 s). Regresión previa sobre ad28783: niveles7 18/18, flujo7 18/18, mapa7t 21/21, todo sin errores. Siguiente: regresión completa sobre HEAD + swtest, bundle, informe.
- Checkpoint (20/11 22:50): regresión sobre 60f392d: flujo7 18/18, mapa7t 21/21, mapa7 5/5, tactil7, eventos7, armas7, rotar7, memoria7, vestuario, audit7, swtest OK, 0 errores JS; niveles7 16/18: 2 atascos raros con el Pelado (n4: chorro caminando en el lugar hacia un choripán escondido detrás de un contenedor en el borde; n6: bot frente a un arma inalcanzable). Arreglados en el commit siguiente; re-corriendo niveles7.
- Checkpoint (20/11 23:17): niveles7 sobre 6b98606: 18/18 gana, 0 errores JS. Siguiente: flujo7, eventos7, armas7, swtest, bundle.
- Checkpoint (20/11 23:22): flujo7 18/18, eventos7 13 eventos + brasas, armas7 OK, swtest OK (sw.js restaurado bb-v7), 0 errores JS. Siguiente: bundle desde HEAD.
- Checkpoint (20/11 23:23): bundle /workspace/fun/publish-bb.tgz (232 648 B, 23:21) desde 7df68a7, verificado extraído y servido aparte en :8995: bb-v7, juega, 0 errores, 0 respuestas ≥400; idéntico al árbol. Listo para publicar (lo hace el agente principal con el OK del usuario).
- Checkpoint (20/11 23:52): GORE paso 1 — js/sangre.js integrado (fx, manchas, heridas, opción en pausa, bb-v8). Falta: revisar heridas de cerca, faca + enemigo con faca, pruebas/capturas/perf/regresión/bundle.
- Checkpoint (20/11 23:56): GORE paso 2 — faca + EL FACA (fe04c59). Perf estrés n3 852x393@3: sangre apagada p99 1,4/máx 3,9; sangre normal p99 1,5–1,6/máx 3,7–4,0. Siguiente: capturas, regresión, bundle.
- Checkpoint (20/11 23:58): capturas de prueba OK (etapas, limpieza, remate con salpicón, faca con aviso); siguiente: regresión completa sobre HEAD, hitos shots-bb8, bundle.
- Checkpoint (21/11 00:40 UTC-3): fix sangre invisible en niveles gradados (74016db), precalentado (e515fd1), torso recortado a silueta (4962ad1); capturas en shots-bb8. Siguiente: regresión completa, perf, swtest, bundle.
- Checkpoint final gore (21/11 01:24 UTC-3): niveles7 18/18 (3 personajes × 6, EL FACA en n3-n6), flujo7 19/19 (incl. opción sangre), tactil7, mapa7t, eventos7 (13), armas7, rotar7, memoria7 (heap ≤34 MB), vestuario, audit7, swtest (bb-v8 → bb-v8-test) — 0 errores JS. Perf stress n3 (apagón+lluvia+8 enemigos): gore apagada p99 1.5–1.8 / max 4.1–6.6 ms; gore normal p99 1.7–2.0 / max 4.4–5.3 ms. Capturas en /workspace/fun/shots-bb8/.
- Checkpoint (21/11 02:25 UTC-3) sobre a803e1e: niveles7 18/18 (t 44–77 s), flujo7 19/19, audit7 y memoria7 (heap ≤41 MB) sin errores. (La máquina se reinició a la 01:55 y se perdió /tmp: scripts de captura ahora en tools-bb/gore/.)
- Checkpoint (21/11 02:30 UTC-3): capturas rehechas en shots-bb8 (01 etapas, 02 remate con salpicón de pared y cámara, 03 noche, 04 faca del jugador, curación, aviso de la faca, lluvia). Charcos debajo de los pies verificado (gotas a ras del piso van con el piso).
- Checkpoint (21/11 02:40 UTC-3): armas7 OK (faca: 6 golpes ~15 de daño con sangrado, 0 errores). Perf stress n3 tras el reinicio de la máquina (más lenta): gore apagada p99 1.8–2.0 / max 4.7–8.3; gore normal p99 1.9–2.4 / max 4.7–6 (un pico aislado de 23.5 ms no reproducible).
- Checkpoint final (21/11 02:43 UTC-3): swtest OK (bb-v8 → bb-v8-test), flujo7 + audit7 sobre HEAD sin errores; publish-bb.tgz reconstruido 02:41 desde c1d0eae y verificado solo (bb-v8, caché bb-v8, 0 errores/404). NO publicado.

## v9 — calidad comercial (en curso, ver PLAN-v9.md)
- [x] Paso 0 auditoría → PLAN-v9.md
- [x] Fase 1a: motor de cinemáticas por datos (js/cinematica.js) + guion de campaña (js/guion.js): capítulos I-IV,
  intro del termo robado (Rata, Doña Rosa), intro por nivel, presentación de los 6 jefes (+ gallego), cierres y final.
  Retratos con expresión (retrato(def, T, cara)), texto a máquina, tocar/piña avanza, ESC/SALTAR >> salta aplicando el estado final.
  Objetivo por nivel en el cartel. Los tests con __bb.empezar no ven cinemáticas (sinCine) salvo __bb.verCine; el bot las salta.
  Test: tools-bb/v9/cine.py (intro completa, jefe, saltar, cierre → pantalla gana, 0 errores).
- [x] Fase 2: economía $U + atributos + almacén (js/progreso.js, js/tienda.js). Guardado versionado 'bb-v9' con migración
  del guardado viejo (bb-nivel-max/bb-ganados → ids; regalo $U 250 y 2 puntos por nivel ganado); se siguen escribiendo
  las claves viejas en el orden viejo. Monedas que sueltan enemigos/rompibles (se juntan solas), billete = $U 100,
  el Rata roba plata. Resultados con plata (giles, cosas rotas, objetivo, tiempo) y +2/+3 puntos. Almacén de Don Tito:
  16 productos (un nivel / siempre / armas / movidas / libreta). ENTRENAR: FUERZA, RESISTENCIA, VELOCIDAD, AGUANTE,
  TÉCNICA (8 niveles, efecto escrito y aplicado: daño/empuje, vida/defensa, velocidad/ataque, mano/levantarse, crítico+remate).
  Test: tools-bb/v9/economia.py (migración, monedas, resultados, compra, entrenar, efectos, botella→pico; 0 errores).
- [x] Combate: pisotón a caídos (pose nueva, máx 2 por caída, puede rematar), REMATE tras la 3ª piña con TÉCNICA 3
  (el enemigo sale girando), barrida y cabezazo comprables (pose nueva), críticos ×1,6, botella que se rompe → PICO (corta).
  Test: tools-bb/v9/combate.py (0 errores).
- [x] Fase 3: nivel nuevo de interiores "EL BOLICHE DEL GALLEGO" (js/escenarios/boliche.js: almacén con yerba/Colet/fiambre
  y "HOY NO SE FÍA", bar con barra larga, tele con el clásico, botellas, ventana con el 121, salón del club con trofeos,
  rocola y escenario), insertado como nivel 5 (capítulo III). Jefe nuevo EL GALLEGO (IA propia: rondas de botellas,
  embestida, a la mitad paga una ronda y llama mamados). Enemigo nuevo EL MAMADO (zigzag, se cae solo, tira botellas).
  Mapa con hito e ícono nuevos, mus.nivel7. Ciudad Vieja y Rambla pasan a 6 y 7 (guardado migrado por id).
- [x] Gore por arma: remate distinto según el arma (MUERTE_ARMA en juego.js: facazo/pico se desploma y se desangra,
  cañazo/sillazo lo manda volando girando, botellazo, termazo, corvinazo, bandejazo, escobazo, "¡LO PESCASTE!").
  Prueba tools-bb/v9/muertes.py: 5 armas, 0 errores.
- [x] flujo9.py 23/23, 0 errores (arreglado: el mapa no tenía ícono del boliche → error 'off').
- [x] Autoauditoría fases 1-4 (pedido 04:21) y huecos cubiertos:
  - Cine: comando 'golpe' (gestos/golpes al aire con el esqueleto real, temblor, polvo) y 'presenta' (franja roja con
    retrato grande, nombre y apodo) → cada jefe entra caminando, tira su golpe firma, se presenta y el jugador se pone en guardia.
  - Combate: cadenas propias por arma (MOVES en juego.js): contundente (palo/escoba/pata: golpe→revés→ESTOCADA),
    pesada (caño/silla: golpe→MOLINETE giratorio), corta (faca/pico: puntazo→tajo→puntazo→DESTRIPE), botella (2),
    improvisadas (termo/corvina/bandeja/caña: golpe→revés→A LO BRUTO). Reacción al golpe: cuerpo (se dobla) o cara
    (cabeza para atrás) según el golpe. movesets.py: 7 armas OK, 0 errores.
  - Contenido: nivel nuevo EL CERRO (plaza con canchita y hamacas, bondi abandonado línea 427 sobre ladrillos con arte
    propio, frigorífico abandonado, autoservice con yerba/Colet, canchita de Los Pibes = territorio de banda). Jefe nuevo
    EL CHAPA (ladrillazos, barrida, combos, llama a la barra). Capítulo IV EL CERRO; ahora 8 niveles. Fondo lejano del Cerro con la Fortaleza.
- [x] Verificación de huecos (05:11): bondi propio (evento bondi + bondi abandonado 427 en El Cerro), yerba/Colet/termos en boliche/cerro/almacén, movimientos nuevos y objetos especiales en el almacén, efectos de atributos en ENTRENAR: ya estaban. Agregado: cartel de capítulo animado (rayas que se abren, título letra por letra con sacudón) y final con golpe del jugador + Rosa.
- [x] QA parcial (05:xx): niveles9 8 niveles × 3 personajes con bot: 24/24 ganados, 0 errores JS (t 41–83 s de juego en turbo).
  Regresión: flujo9 23/23, tactil7, mapa7 (5 tamaños), eventos7 (14 eventos), armas7 (15 armas), rotar7, memoria7,
  vestuario, audit7, movesets, economia (incluye migración desde guardado bb-v8), combate, muertes: todos 0 errores.
  Bug encontrado y arreglado: el bot de pruebas dejaba el stick táctil simulado apretado al apagarse (en el almacén no se podía entrenar).
