// Verifica que cada ID de audio que usa el código exista en el catálogo (audio-ids.js).
import fs from 'fs';
import { CATALOGO } from '../js/audio-ids.js';
import { ATQ, ITEMS, ROMPIBLES } from '../js/datos.js';
import { NIVELES } from '../js/niveles.js';
const usados = new Map(); const add = (id, de) => { if (!usados.has(id)) usados.set(id, de); };
for (const f of fs.readdirSync('js').filter((f) => f.endsWith('.js') && f !== 'audio-ids.js')) {
  const s = fs.readFileSync('js/' + f, 'utf8');
  for (const m of s.matchAll(/(?:sonar|musica|ambiente)\(\s*'([a-z0-9.]+)'\s*[,)]/g)) add(m[1], f);
  for (const m of s.matchAll(/'((?:item|mus|evento|ui)\.[a-z0-9.]+)'/g)) add(m[1], f);
  for (const m of s.matchAll(/son:\s*'([a-z0-9.]+)'/g)) add(m[1], f);
  for (const m of s.matchAll(/UI = \{([^}]*)\}/g)) for (const k of m[1].matchAll(/'([a-z.]+)'/g)) add(k[1], f);
}
for (const a of Object.values(ATQ)) if (a.son) add(a.son, 'ATQ');
for (const i of Object.values(ITEMS)) if (i.son) add(i.son, 'ITEMS');
for (const r of Object.values(ROMPIBLES)) add('impacto.' + r.mat, 'ROMPIBLES');
for (const n of NIVELES) { add(n.musica, n.id); add(n.ambiente, n.id); }
const faltan = [...usados].filter(([id]) => !CATALOGO[id]);
console.log('IDs usados:', usados.size, '· catálogo:', Object.keys(CATALOGO).length, '· faltan:', faltan.length);
for (const [id, de] of faltan) console.log('  FALTA', id, '(' + de + ')');
const sinUso = Object.keys(CATALOGO).filter((id) => !usados.has(id) && !/^(voz|frase)\./.test(id));
console.log('Sin uso directo (no voz/frase):', sinUso.join(' ') || '—');
process.exit(faltan.length ? 1 : 0);
