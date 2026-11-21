# PLAN v9 — "PÁRATE DE MANO, ÑERI" a calidad comercial

Regla: se EVOLUCIONA el proyecto existente (nada de prototipos ni sistemas duplicados). Cache SW: **bb-v9**.

## PASO 0 — Auditoría (hecha)
**Funciona y se reutiliza tal cual**
- Motor Canvas2D a 1/120 fijo con interpolación, escalado entero, densidad Q, grading LUT (grado.js).
- Esqueleto → sprites (sprites.js): poses por datos (P), cuadros a demanda + calentar, retrato(def), máscaras de capas.
- Combate (juego.js): piña1-2-3 encadenadas, piña2→patada, voladora, especial (mano/HP), agarre con rodillazos/revoleo,
  dolor alto/panza (4 cuadros), vuela/piso/levanta, hitstop, sacudón, invulnerabilidad, combos, armas (15 ítems, durabilidad, tiro).
- Gore v8 (sangre.js): salpicones, heridas por etapas, charcos, cámara, máscaras por cuadro.
- 6 niveles con escenarios únicos (Cuadra, Feria Tristán Narvaja, 18 de Julio, Barrio Sur, Ciudad Vieja, Rambla),
  12 enemigos + 6 jefes con IA propia, eventos (bondi, macetas), rompibles con drops, comida.
- Globos de diálogo (globo), cartel de jefe (jefeIntro), cartel de nivel, mapa de Montevideo, vestuario, pausa, continuar.
- Audio por IDs (audio-ids + sintetizador de respaldo), AUDIO.md.
- Guardado: bb-nivel-max, bb-ganados, bb-cfg, bb-record, bb-ropa-*.
- Perf: render p99 ~2 ms en estrés; sin asignaciones por cuadro en el camino caliente.

**Falta / a mejorar**
- No hay historia ni cinemáticas (sólo carteles y globos sueltos).
- No hay economía, pantalla de resultados con plata ni tienda.
- No hay progresión de atributos.
- No hay nivel de interiores; botella no se rompe en "pico"; no hay ataque a caídos del jugador.
- Guardado sin versión → hace falta clave nueva versionada + migración.

## Fases (orden por impacto)
1. **Cinemáticas + campaña** — js/cinematica.js (motor por datos dentro del Juego: actores reales caminando,
   retratos con expresión, caja con texto a máquina, tocar/tecla para avanzar, mantener para saltar)
   + js/guion.js (intro del termo robado, intro por nivel, presentación de cada jefe, cierre por capítulo, final).
   Capítulos: I "EL TERMO" (Cuadra), II "LA FERIA" (Feria, 18 de Julio), III "LA NOCHE" (Barrio Sur, nivel nuevo),
   IV "EL CAPO" (Ciudad Vieja, Rambla). Objetivo por nivel en el cartel.
2. **Economía $U + atributos + tienda** — js/progreso.js (guardado bb-v9 con migración de claves viejas),
   plata que sueltan enemigos/rompibles/objetivos, pantalla de resultados, tienda "ALMACÉN DON TITO" con productos
   uruguayos (curas, mejoras permanentes, movimientos nuevos, armas iniciales, objetos especiales) y reparto de
   puntos en FUERZA / RESISTENCIA / VELOCIDAD / AGUANTE / TÉCNICA con efecto visible.
3. **Contenido** — nivel nuevo de interiores (boliche/almacén) insertado como capítulo III con jefe nuevo, enemigo
   nuevo, botella que se rompe en pico (arma cortante), migración de índices de nivel en el guardado.
4. **Combate** — pisotón a caídos, remate (finisher) de 3ª piña cargada por TÉCNICA, variantes por arma.
5. **Audio** — IDs nuevos (cinemática, plata, tienda, botella rota, pisotón) en audio-ids + síntesis + AUDIO.md.
6. **QA y entrega** — bb-v9, bot de niveles extendido, regresión completa, perf, shots-bb9, bundle.

## Estado
- [x] Paso 0 auditoría
- [x] Fase 1 cinemáticas + campaña (guion.js, cinematica.js) — commit 852ed14
- [x] Fase 2 economía $U, resultados, almacén de Don Tito, 5 atributos, migración de guardado — commit 4c00999
- [x] Fase 4 combate: pisotón, remate, barrida, cabezazo, críticos, botella→pico — commit 4c00999
- [x] Fase 3 nivel boliche + Gallego + Mamado — commit 5aafab4
- [x] bb-v9 (VERSION + CACHE + precache de los js nuevos)
- [ ] Fase 5 audio doc / Fase 6 QA, regresión, capturas, bundle
- [x] Autoauditoría: presentaciones de jefe animadas, cadenas por arma, reacciones cabeza/cuerpo, nivel EL CERRO + jefe EL CHAPA
- [x] Fase 5 audio: mus.nivel8, AUDIO.md regenerado (audio-check: faltan 0)
