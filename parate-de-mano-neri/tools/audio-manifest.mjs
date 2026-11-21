// Escanea audio/ y reescribe ARCHIVOS en audio/manifest.js: cada archivo cuyo nombre (sin extensión ni "-N") es un ID del catálogo.
// Uso: node tools/audio-manifest.mjs          (agrega --doc para regenerar también AUDIO.md)
import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const raiz = join(dirname(fileURLToPath(import.meta.url)), '..'); const dir = join(raiz, 'audio');
const { CATALOGO } = await import('../js/audio-ids.js');
const EXT = /\.(ogg|oga|opus|m4a|mp3|wav|webm)$/i;
const archivos = []; (function rec(d) { for (const n of readdirSync(d)) { const p = join(d, n); if (statSync(p).isDirectory()) rec(p); else if (EXT.test(n)) archivos.push(relative(dir, p).split('\\').join('/')); } })(dir);
const map = {}, sinId = [];
for (const f of archivos.sort()) {
  const base = f.split('/').pop().replace(EXT, '').replace(/-\d+$/, '');
  if (!CATALOGO[base]) { sinId.push(f); continue; }
  (map[base] ||= []).push(f);
}
// el OGG primero (si el navegador no lo decodifica, se prueba el siguiente del mismo nombre)
for (const k in map) map[k].sort((a, b) => (/\.ogg$/i.test(b) - /\.ogg$/i.test(a)) || a.localeCompare(b));
const cuerpo = Object.keys(map).sort().map((k) => `  '${k}': [${map[k].map((f) => `'${f}'`).join(', ')}],`).join('\n');
const mf = join(dir, 'manifest.js'); const s = readFileSync(mf, 'utf8');
const nuevo = s.replace(/(\/\/ ↓↓↓[^\n]*\n)[\s\S]*?(\/\/ ↑↑↑)/, `$1export const ARCHIVOS = {\n${cuerpo}${cuerpo ? '\n' : ''}};\n$2`);
writeFileSync(mf, nuevo);
console.log(`IDs con archivo: ${Object.keys(map).length} / ${Object.keys(CATALOGO).length}  (archivos: ${archivos.length})`);
if (sinId.length) console.log('Archivos cuyo nombre no es un ID (ignorados):\n  ' + sinId.join('\n  '));
if (process.argv.includes('--doc')) await import('./audio-doc.mjs');
