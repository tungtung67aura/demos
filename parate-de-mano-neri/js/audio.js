// SISTEMA CENTRAL DE AUDIO. El juego sólo usa IDs (js/audio-ids.js); los archivos se asignan en audio/manifest.js.
//   sonar(id, {x, vol, tono})  efectos, golpes, voces, frases (x: posición en pantalla 0..1 para el paneo)
//   musica(id)                 cambia la música con fundido (null = silencio)
//   ambiente(id)               loop ambiental del nivel (null = nada)
//   voz(personaje, evento)     'voz.<personaje>.<evento>' (si no hay archivo, nada)
//   frase(texto)               la voz del globo de diálogo ('frase.<slug>')
// Archivos faltantes o que el navegador no decodifica: se marcan una vez y se ignoran (sin errores, sin reintentos).
import { CATALOGO, slug } from './audio-ids.js';
import { ARCHIVOS, AJUSTES } from '../audio/manifest.js';
import { sinteIniciar, sinteSfx, sinteMusica } from './audio-sinte.js';

const BASE = new URL('../audio/', import.meta.url).href;
let ctx = null, master = null, buses = {}, musicaOn = true, efectosOn = true;
const bufs = new Map(); // id -> { estado: 'cargando'|'ok'|'falta', lista: [AudioBuffer] }
const ultimo = new Map(); // id -> tiempo del último disparo (anti metralleta)
const activos = { voces: 0 };
let musActual = null, ambActual = null; // { id, src, gain }

export function iniciarAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  ctx = new AC(); master = ctx.createGain(); master.gain.value = AJUSTES.volumen.general; master.connect(ctx.destination);
  const comp = ctx.createDynamicsCompressor(); comp.connect(master);
  for (const k of ['musica', 'efectos', 'voces', 'ambiente']) { const g = ctx.createGain(); g.gain.value = AJUSTES.volumen[k]; g.connect(comp); buses[k] = g; }
  if (!musicaOn) buses.musica.gain.value = 0;
  sinteIniciar(ctx, buses.efectos, buses.musica);
  // los efectos cortos se decodifican de entrada (son chicos); música y ambiente cuando se piden
  for (const id in ARCHIVOS) { const c = CATALOGO[id]; if (c && c.cat !== 'musica' && c.cat !== 'ambiente' && c.cat !== 'frases') cargar(id); }
  if (pendienteMus) { const m = pendienteMus; pendienteMus = null; musica(m); }
  if (pendienteAmb) { const a = pendienteAmb; pendienteAmb = null; ambiente(a); }
}
export function audioOk() { return !!ctx; }
export function setMusica(v) { musicaOn = v; if (buses.musica) buses.musica.gain.value = v ? AJUSTES.volumen.musica : 0; }
export function setSfx(v) { efectosOn = v; }
export function suspender(s) { if (!ctx) return; if (s) ctx.suspend(); else ctx.resume(); }

function decodificar(ab) { return new Promise((res, rej) => { try { const p = ctx.decodeAudioData(ab, res, rej); if (p && p.then) p.then(res, rej); } catch (e) { rej(e); } }); }
async function bajar(ruta) { const r = await fetch(BASE + ruta); if (!r.ok) throw new Error('falta'); return decodificar(await r.arrayBuffer()); }
// carga todas las variantes de un ID; si un formato falla, prueba el alternativo del mismo nombre (.m4a / .mp3)
function cargar(id) {
  let b = bufs.get(id); if (b) return b; const rutas = ARCHIVOS[id];
  b = { estado: rutas && rutas.length ? 'cargando' : 'falta', lista: [] }; bufs.set(id, b);
  if (b.estado === 'falta' || !ctx) return b;
  const grupos = new Map(); for (const r of rutas) { const base = r.replace(/\.[a-z0-9]+$/i, ''); if (!grupos.has(base)) grupos.set(base, []); grupos.get(base).push(r); }
  Promise.all([...grupos.values()].map(async (alts) => { for (const r of alts) { try { return await bajar(r); } catch (e) { /* probar el siguiente formato */ } } return null; }))
    .then((l) => { b.lista = l.filter(Boolean); b.estado = b.lista.length ? 'ok' : 'falta'; });
  return b;
}
const BUS = { voces: 'voces', frases: 'voces', musica: 'musica', ambiente: 'ambiente' };
export function sonar(id, o = {}) {
  if (!ctx || !efectosOn) return; const c = CATALOGO[id]; if (!c) return;
  const t = ctx.currentTime; const u = ultimo.get(id); if (u !== undefined && t - u < 0.03) return; ultimo.set(id, t);
  const b = ARCHIVOS[id] ? cargar(id) : null;
  if (b && b.estado === 'ok') {
    const bus = BUS[c.cat] || 'efectos'; if (bus === 'voces' && activos.voces >= 2) return;
    const src = ctx.createBufferSource(); src.buffer = b.lista[(Math.random() * b.lista.length) | 0];
    src.playbackRate.value = (o.tono || 1) * (bus === 'efectos' ? 0.95 + Math.random() * 0.1 : 1);
    const g = ctx.createGain(); g.gain.value = (o.vol || 1) * (AJUSTES.volumenId[id] ?? 1); let nodo = g;
    if (o.x !== undefined && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = Math.max(-0.8, Math.min(0.8, (o.x - 0.5) * 1.4)); g.connect(p); nodo = p; }
    src.connect(g); nodo.connect(buses[bus]);
    if (bus === 'voces') { activos.voces++; src.onended = () => { activos.voces--; }; }
    src.start(t); return;
  }
  if ((!b || b.estado === 'falta') && c.sinte && AJUSTES.sinteDeRespaldo && c.cat !== 'musica') sinteSfx(c.sinte, o.vol || 1);
}
export function voz(quien, ev, o) { const id = `voz.${quien}.${ev}`; if (ARCHIVOS[id]) sonar(id, o); }
export function frase(txt, o) { const id = 'frase.' + slug(txt); if (ARCHIVOS[id]) { cargar(id); sonar(id, o); } }

// --- loops (música y ambiente) con fundido
let pendienteMus = null, pendienteAmb = null;
function loop(id, bus, actual, fundido) {
  if (actual) { const a = actual; try { a.gain.gain.setTargetAtTime(0, ctx.currentTime, fundido / 3); a.src.stop(ctx.currentTime + fundido); } catch (e) { /* ya parado */ } }
  if (!id || !ARCHIVOS[id]) return null;
  const n = { id, src: null, gain: ctx.createGain() }; n.gain.gain.value = 0; n.gain.connect(buses[bus]);
  const b = cargar(id);
  const arrancar = () => { if (n.muerto || b.estado !== 'ok') return; const s = ctx.createBufferSource(); s.buffer = b.lista[0]; s.loop = CATALOGO[id] ? CATALOGO[id].loop !== false : true; s.connect(n.gain); s.start(); n.src = s;
    n.gain.gain.setTargetAtTime(AJUSTES.volumenId[id] ?? 1, ctx.currentTime, fundido / 3); };
  if (b.estado === 'ok') arrancar(); else { const espera = setInterval(() => { if (b.estado !== 'cargando') { clearInterval(espera); arrancar(); } }, 100); }
  return n;
}
export function musica(id) {
  if (!ctx) { pendienteMus = id; return; }
  if (musActual && musActual.id === id) return; if (!musActual && id === musSinte) return;
  if (musActual) musActual.muerto = true;
  musActual = loop(id, 'musica', musActual, 0.6);
  // respaldo: el candombe sintetizado original (sólo si ese ID no tiene archivo)
  const c = id && CATALOGO[id]; const sin = !musActual && c && c.sinte && AJUSTES.sinteDeRespaldo ? c.sinte : null;
  musSinte = sin ? id : null; sinteMusica(sin);
}
let musSinte = null;
export function ambiente(id) {
  if (!ctx) { pendienteAmb = id; return; }
  if (ambActual && ambActual.id === id) return; if (ambActual) ambActual.muerto = true;
  ambActual = loop(id, 'ambiente', ambActual, 1.2);
}
// para pruebas / AUDIO.md
export const __audio = { estado: () => ({ cargados: [...bufs].filter(([, b]) => b.estado === 'ok').length, faltan: [...bufs].filter(([, b]) => b.estado === 'falta').length, ids: Object.keys(CATALOGO).length }) };
