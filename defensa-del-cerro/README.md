# Defensa del Cerro

Tower defense para el celular: defendé la Fortaleza del Cerro de Montevideo de piratas que llegan por tierra, por mar y por aire.
HTML5 + canvas, sin dependencias ni CDNs. PWA instalable que se juega sin conexión.

## Qué trae
- **3 frentes** que se desbloquean de a uno: *La Subida* (un camino, con tutorial), *La Bahía* (mar + tierra, islitas para construir) y *Villa del Cerro* (dos calles, mar, aire y jefe final).
- **20 oleadas por frente**, jefes cada 5 oleadas, **modo Sin Fin** en los frentes ganados.
- **Dificultad** Tranqui / Normal / Bravo (Bravo da un laurel). **Estrellas** según las vidas que te queden.
- **6 torres** con 2 mejoras y una especialidad a elegir en el nivel 3 (12 especialidades en total), venta al 70% y 4 modos de apuntar:
  Mosqueteros (Tiradores de élite / Fusilería), Cañón (Culebrina / Metralla), Mortero (Bombarda / Brea ardiente),
  Pampero (Helada / Sudestada), Ballesta (Arponera / Repetidora) y Faro (Faro de guerra / Faro vigía).
- **10 enemigos + 4 jefes**: grumete, corsario, coraza, escudero, carretón (se parte en 3), cirujano (cura), contrabandista (invisible),
  loro pirata (vuela), bote y lancha cañonera (por agua); Contramaestre Tuerto, Capitán Malacara, La Galeona Negra y el Almirante Sombra.
- **Poderes**: Bombardeo naval, Blandengues (frenan al enemigo en el camino) y Bengala.
- **Economía**: oro por baja, paga por oleada, intereses y bonus por llamar antes la oleada.
- **Cuartel**: medallas (estrellas, laureles y Sin Fin) que se gastan en mejoras permanentes. **15 logros**.
- Sonido sintetizado con WebAudio y música de candombe procedural. Vibración, modo ahorro y temblor de pantalla configurables.

## Controles
Tocá el pasto para construir (un toque muestra la info, otro construye). Tocá una torre para mejorarla, venderla o cambiar a quién apunta.
Tocá un enemigo para ver su ficha. En compu: Espacio llama oleada, F cambia velocidad, P/Esc pausa, 1-2-3 los poderes.

## Estructura del código
- `js/data.js`: torres, enemigos, mapas, oleadas, logros y mejoras (todo el balance está acá).
- `js/sim.js`: simulación pura sin DOM, paso fijo de 1/60 s y determinista (se puede correr en Node).
- `js/render.js` + `js/sprites.js`: dibujo en canvas (terreno pre-renderizado, sprites cacheados, partículas con pool fijo).
- `js/audio.js`: efectos y música sintetizados.
- `js/bot.js`: bot que juega solo (pruebas de balance y modo demo del menú).
- `js/main.js`: interfaz, guardado (`localStorage`), tutorial, logros y bucle principal.

## Modo prueba
`?bot=1&autostart=1&level=2&diff=normal&speed=8` arranca el frente 2 y lo juega el bot (`skill=newbie` para un jugador flojo, `endless=1` para Sin Fin).
`window.__dc` expone el estado para pruebas automáticas.

## Publicar
Subir la carpeta tal cual (rutas relativas), por ejemplo a `https://tungtung67aura.github.io/demos/defensa-del-cerro/`.
Si cambiás archivos, subí `CACHE` en `sw.js` (`defensa-cerro-v2`, …) para que los teléfonos que lo instalaron se actualicen.

## Llevarlo a las tiendas (Capacitor)
El juego no depende de nada del navegador que no tenga un WebView: se puede envolver tal cual.
1. `npm init -y && npm i @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios`
2. `npx cap init "Defensa del Cerro" uy.cerro.defensa --web-dir=.` (o copiar esta carpeta a `www/`)
3. `npx cap add android` / `npx cap add ios` y `npx cap sync`
4. En nativo el service worker no hace falta (no molesta). Para vibración nativa se puede cambiar `vib()` en `main.js` por `@capacitor/haptics`.

Fuentes: Lilita One y Nunito (SIL Open Font License). Todo el arte y el sonido se generan por código.
