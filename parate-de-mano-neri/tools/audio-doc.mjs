// Genera AUDIO.md con todos los IDs de audio, agrupados por categoría, y el estado (si ya tienen archivo).
import { writeFileSync } from 'node:fs'; import { join, dirname } from 'node:path'; import { fileURLToPath } from 'node:url';
const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const { CATALOGO, CATEGORIAS } = await import('../js/audio-ids.js');
const { ARCHIVOS } = await import('../audio/manifest.js');
const carpeta = { golpes: 'golpes', impactos: 'impactos', armas: 'armas', items: 'items', mov: 'mov', enemigos: 'enemigos', eventos: 'eventos', ambiente: 'ambiente', musica: 'musica', voces: 'voces', frases: 'frases', ui: 'ui' };
let md = `# Audio de Párate de mano ñeri — lista de IDs\n\nGenerado con \`node tools/audio-doc.mjs\`. Total: **${Object.keys(CATALOGO).length} IDs**.\n\n`;
md += `## Cómo cargar los audios\n1. Guardá cada archivo en \`audio/<carpeta>/\` con el **nombre exacto del ID** y extensión \`.ogg\` (ej.: \`audio/golpes/golpe.pina.ogg\`).\n`;
md += `2. Variantes al azar: \`golpe.pina-1.ogg\`, \`golpe.pina-2.ogg\`… Música y ambientes se repiten en loop solos.\n`;
md += `3. Corré \`node tools/audio-manifest.mjs --doc\`: llena \`audio/manifest.js\` y actualiza esta lista. No hay que tocar el código del juego.\n`;
md += `4. iPhone: Safari moderno reproduce OGG; para equipos viejos podés poner al lado el mismo nombre en \`.m4a\` y se usa si el OGG falla.\n`;
md += `5. **Se puede cargar cualquier subconjunto** (por ejemplo sólo unas voces de amigos en \`audio/voces/\` y \`audio/frases/\`): lo que no tiene archivo sigue sonando como antes (sintetizado) o queda mudo, sin errores.\n`;
md += `6. Volumen por ID: \`AJUSTES.volumenId\` en \`audio/manifest.js\`. Para que no suenen más los sonidos sintetizados originales: \`AJUSTES.sinteDeRespaldo = false\`.\n\n`;
md += `Columna *respaldo*: el ID usa hoy el sonido sintetizado original hasta que tenga archivo. "—" = mudo hasta que lo cargues.\n\n`;
for (const [cat, titulo] of Object.entries(CATEGORIAS)) {
  const ids = Object.keys(CATALOGO).filter((k) => CATALOGO[k].cat === cat); if (!ids.length) continue;
  md += `## ${titulo} — \`audio/${carpeta[cat]}/\` (${ids.length})\n\n| ID | Qué es | Respaldo | Archivo |\n|---|---|---|---|\n`;
  for (const id of ids) { const c = CATALOGO[id]; md += `| \`${id}\` | ${c.desc.replace(/\|/g, '/')}${c.loop ? ' (loop)' : ''} | ${c.sinte && c.cat !== 'voces' ? c.sinte : '—'} | ${ARCHIVOS[id] ? '✅ ' + ARCHIVOS[id].join(', ') : '—'} |\n`; }
  md += '\n';
}
writeFileSync(join(raiz, 'AUDIO.md'), md); console.log('AUDIO.md listo');
