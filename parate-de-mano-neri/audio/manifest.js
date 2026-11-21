// MANIFIESTO DE AUDIO — qué archivo suena para cada ID (los IDs y su descripción están en AUDIO.md).
//
// Cómo agregar audios:
//   1. Copiá los archivos a esta carpeta (audio/), en la subcarpeta que quieras, con el NOMBRE DEL ID:
//        audio/golpes/golpe.pina.ogg     audio/musica/mus.nivel2.ogg     audio/frases/frase.vamo_arriba.ogg
//      Variantes (se elige una al azar cada vez): golpe.pina-1.ogg, golpe.pina-2.ogg, ...
//      Para iPhone viejos sin OGG podés sumar la misma pista en .m4a/.mp3 con el mismo nombre: se usa si el OGG falla.
//   2. Corré:  node tools/audio-manifest.mjs   → reescribe ARCHIVOS acá abajo (no hay que tocar código del juego).
//   (También se puede editar a mano: 'id': ['carpeta/archivo.ogg', ...].)
//
// Un ID sin archivo no hace nada (ni error ni costo). Si el ID tiene `sinte` en el catálogo y sinteDeRespaldo = true,
// suena el sonido sintetizado original del juego hasta que cargues el archivo.
export const AJUSTES = {
  sinteDeRespaldo: true, // false = sólo suenan los archivos (los IDs sin archivo quedan mudos)
  volumen: { general: 0.9, musica: 0.55, efectos: 0.9, voces: 1.0, ambiente: 0.5 },
  // volumen por ID (0..2) si algún archivo quedó fuerte o bajito: { 'golpe.pina': 0.8 }
  volumenId: {},
};
// ↓↓↓ generado por tools/audio-manifest.mjs ↓↓↓
export const ARCHIVOS = {
};
// ↑↑↑ generado por tools/audio-manifest.mjs ↑↑↑
