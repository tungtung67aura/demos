// v13: TIENDA PLENA MORTAL. Moneda propia (FICHAS) que sólo se gana peleando en PLENA MORTAL (libre, torres, supervivencia)
// y en el modo infinito; trajes exclusivos (cambian prendas y accesorios a nivel del armado del sprite), mejoras permanentes
// que valen SOLO en las peleas de PLENA MORTAL (nunca en la campaña ni en el beat 'em up), títulos para la pantalla VS,
// festejos de victoria y frases del relator. Todo vive dentro del guardado de siempre (P.pelea.tienda).
import { P, guardar, DIOS } from '../progreso.js';
import { DEFS } from '../sprites.js';
import { LUCHADORES, POR_ID } from './luchadores.js';

// ---------------------------------------------------------------- catálogo
// TRAJES: por luchador; `def` pisa rasgos de accesorios (lentes, cadena, espalda) y `ropa` cambia las 4 prendas
const T = (pj, id, nombre, precio, desc, ropa, def = {}) => ({ tipo: 'traje', id: pj + '.' + id, pj, sid: id, nombre, precio, desc, ropa, def });
export const TRAJES = [
  T('neri', 'celeste', 'CELESTE DEL 50', 160, 'LA DEL MARACANÁ: CAMISETA CELESTE, SHORT NEGRO Y VINCHA', { cabeza: 'vinchaCeleste', arriba: 'celeste50', abajo: 'shortNegro', calzado: 'zapaNegra' }),
  T('neri', 'llamadas', 'NOCHE DE LLAMADAS', 220, 'TAMBORIL A LA ESPALDA, PAÑUELO Y CAMISA DE COMPARSA', { cabeza: 'panueloLlamadas', arriba: 'camisaLlamadas', abajo: 'vestirBlanco', calzado: 'zapaBlanca' }, { espalda: 'tambor' }),
  T('patovica', 'gala', 'PATOVA DE GALA', 180, 'SACO, MOÑO Y LENTES NEGROS: LA PUERTA DEL CASAMIENTO', { cabeza: 'nada', arriba: 'sacoGala', abajo: 'vestirNegro', calzado: 'zapatos' }, { lentes: true }),
  T('patovica', 'brava', 'GUARDAVIDAS DE LA BRAVA', 160, 'VISERA, SHORT AMARILLO Y OJOTAS: NADIE SE AHOGA EN SU TURNO', { cabeza: 'viseraRoja', arriba: 'remeraGuardavidas', abajo: 'shortGuardavidas', calzado: 'ojotas' }, { lentes: true }),
  T('turro', 'marca', 'TURRO DE MARCA', 150, 'CAMPERA INFLADA BLANCA Y GORRA DORADA, CADENA INCLUIDA', { cabeza: 'gorraDorada', arriba: 'pufferBlanca', abajo: 'depNegro', calzado: 'zapaBlanca' }),
  T('turro', 'cumbia', 'TURRO CUMBIERO', 150, 'PILUSA BLANCA Y CAMISA FLOREADA PARA EL BAILE DEL SÁBADO', { cabeza: 'pilusaBlanca', arriba: 'camisaCumbia', abajo: 'jean', calzado: 'zapaBlanca' }),
  T('fachero', 'punta', 'FACHERO DE PUNTA', 180, 'PANAMÁ, SACO DE LINO Y TODO BLANCO: TEMPORADA EN LA PARADA 5', { cabeza: 'panama', arriba: 'sacoLino', abajo: 'vestirBlanco', calzado: 'zapatosBlancos' }),
  T('fachero', 'boliche', 'FACHERO DE BOLICHE', 140, 'CAMISA VIOLETA ABIERTA Y JEAN OSCURO: SALE A LAS DOS', { cabeza: 'nada', arriba: 'camisaBoliche', abajo: 'jeanOscuro', calzado: 'zapatos' }, { lentes: false }),
  T('vecino', 'asado', 'VECINO DEL ASADO', 140, 'DELANTAL DE CUERO Y GORRA: EL DOMINGO LA PARRILLA ES SUYA', { cabeza: 'gorraAtrasVecino', arriba: 'delantalAsado', abajo: 'jean', calzado: 'zapaGris' }),
  T('vecino', 'tribuna', 'VECINO DE TRIBUNA', 140, 'CAMISETA A RAYAS Y GORRO DE LANA: GRITA MÁS QUE EN LA ASAMBLEA', { cabeza: 'gorroGris', arriba: 'bohemiaTribuna', abajo: 'jeanOscuro', calzado: 'zapaNegra' }),
  T('abogado', 'playa', 'DOCTOR EN LA PLAYA', 160, 'CAMISA FLOREADA, BERMUDA Y OJOTAS: EL ESTUDIO CIERRA EN ENERO', { cabeza: 'pilusa', arriba: 'camisaHawaiana', abajo: 'shortCargo', calzado: 'ojotas' }, { lentes: true }),
  T('abogado', 'estancia', 'DOCTOR DE ESTANCIA', 180, 'BOINA, CHALECO Y BOMBACHA DE CAMPO: ABOGADO DE TACUAREMBÓ', { cabeza: 'boinaNegra', arriba: 'chalecoCampo', abajo: 'bombacha', calzado: 'botitas' }),
  T('zombi', 'murga', 'ZOMBI MURGUISTA', 200, 'GALERA Y LEVITA DE MURGA: RETIRADA DESDE EL MÁS ALLÁ', { cabeza: 'galeraMurga', arriba: 'levitaMurga', abajo: 'vestirMurga', calzado: 'zapatos' }),
  T('zombi', 'pescador', 'PESCADOR DE LA RAMBLA', 150, 'CAMPERA DE AGUA Y GORRO: SALIÓ A PESCAR EN 1987 Y NO VOLVIÓ', { cabeza: 'gorroPescador', arriba: 'camperaPescador', abajo: 'jeanRoto', calzado: 'botasGoma' }),
  T('rapero', 'oro', 'MC DE ORO', 160, 'GORRA DORADA, CAMPERA INFLADA CON VIVOS DE ORO Y LENTES', { cabeza: 'gorraDorada', arriba: 'pufferOro', abajo: 'depNegro', calzado: 'zapaBlanca' }, { lentes: true }),
  T('fisico', 'box', 'BOXEADOR DEL PALACIO', 160, 'VINCHA, SHORT ROJO Y BOTAS DE BOX: PELEA DE FONDO EL VIERNES', { cabeza: 'vinchaBox', arriba: 'musculosaBox', abajo: 'shortBoxRojo', calzado: 'botasBox' }),
  T('chef', 'chivito', 'CHEF DE CHIVITERÍA', 140, 'CHAQUETA NEGRA CON VIVOS DORADOS: EL CANADIENSE MÁS CARO DE CARRASCO', { cabeza: 'gorroChefNegro', arriba: 'chaquetaNegra', abajo: 'vestirNegro', calzado: 'zapatos' }),
  T('policia', 'moto', 'POLICÍA MOTORIZADA', 150, 'CASCO Y CHALECO FLÚO: LLEGA ANTES QUE LA AMBULANCIA', { cabeza: 'cascoPolicia', arriba: 'chalecoMotorizada', abajo: 'vestirAzulOsc', calzado: 'borcegos' }),
  T('youtuber', 'vivo', 'STREAMER DE MADRUGADA', 140, 'BUZO NEGRO DEL DIRECTO, AURICULARES Y CERO HORAS DE SUEÑO', { cabeza: 'auris', arriba: 'buzoLive', abajo: 'depVioleta', calzado: 'zapaRoja' }),
  T('gitano', 'tango', 'TANGUERO DEL SUR', 160, 'FUNYI, SACO NEGRO Y CORBATA ROJA: DE LA GUITARRA AL BANDONEÓN', { cabeza: 'sombreroTango', arriba: 'sacoTango', abajo: 'vestirNegro', calzado: 'zapatos' }),
  T('canillita', 'diariero', 'DIARIERO DEL 18', 130, 'GORRA PLANA, CAMISA A CUADROS Y TIRADORES: ¡EXTRA DESDE 1950!', { cabeza: 'boinaCuadros', arriba: 'lenadora', abajo: 'pantMarron', calzado: 'botitas' }),
];
// MEJORAS PERMANENTES (sólo PLENA MORTAL): 3 niveles, precio por nivel
const M = (id, nombre, precios, desc) => ({ tipo: 'mejora', id, nombre, precios, desc, max: precios.length });
export const MEJORAS = [
  M('vida', 'CHIVITO AL PLATO', [90, 200, 360], (n) => '+' + n * 3 + '% DE VIDA MÁXIMA'),
  M('super', 'MATE CEBADO', [100, 220, 380], (n) => '+' + n * 7 + '% DE SÚPER GANADO'),
  M('ini', 'ARRANQUE CON MANIJA', [120, 240, 420], (n) => 'CADA RONDA ARRANCÁS CON ' + n * 10 + ' DE SÚPER'),
  M('zafa', '¡ZAFÉ! DE BARRIO', [80, 180, 300], (n) => '¡ZAFÉ! CUESTA ' + (50 - n * 5) + ' DE SÚPER Y TE CUBRE MÁS'),
  M('superv', 'TUPPER DE LA VIEJA', [80, 160, 280], (n) => 'SUPERVIVENCIA: CURÁS ' + (25 + n * 10) + '% ENTRE PELEAS'),
  M('fichas', 'ALCANCÍA DEL CHIQUILÍN', [100, 220, 380], (n) => '+' + n * 10 + '% DE FICHAS GANADAS'),
];
const TI = (id, nombre, precio, req) => ({ tipo: 'titulo', id: 't.' + id, nombre, precio, desc: 'SE VE DEBAJO DE TU NOMBRE EN LA PANTALLA VS', req });
export const TITULOS = [
  TI('cuadra', 'CAMPEÓN DE LA CUADRA', 40), TI('cordon', 'EL TERROR DEL CORDÓN', 50), TI('afloja', 'EL QUE NO AFLOJA', 50), TI('candombe', 'HIJO DEL CANDOMBE', 60),
  TI('doctor', 'DOCTOR EN PIÑAS', 60), TI('cerro', 'PATRIMONIO DEL CERRO', 60), TI('chivito', 'EL ÚLTIMO CHIVITO', 70), TI('zafe', 'MAESTRO DEL ¡ZAFÉ!', 70),
  TI('garra', 'GARRA CHARRÚA', 90), TI('infierno', 'LEYENDA DEL INFIERNO', 150, { torre: 'infierno', txt: 'COMPLETÁ LA TORRE DEL INFIERNO' }),
];
const FE = (id, nombre, precio) => ({ tipo: 'festejo', id: 'f.' + id, pose: id, nombre, precio, desc: 'TU FESTEJO CUANDO GANÁS LA RONDA (CON CUALQUIER LUCHADOR)' });
export const FESTEJOS = [FE('mate', 'MATECITO DE LA VICTORIA', 90), FE('baile', 'CANDOMBE DE FESTEJO', 90), FE('flex', 'SACAR CHAPA', 80), FE('reverencia', 'LA REVERENCIA', 70), FE('burla', 'LA CARGADA', 80), FE('saludo', 'SALUDO A LA HINCHADA', 70)];
const RE = (id, frase, precio) => ({ tipo: 'relator', id: 'r.' + id, nombre: frase, frase, precio, desc: 'EL RELATOR LO GRITA CUANDO GANÁS POR K.O.' });
export const RELATOR = [RE('cama', '¡LO DEJASTE DE CAMA!', 50), RE('gardel', '¡ANDÁ A CANTARLE A GARDEL!', 50), RE('termo', '¡SE LE CAYÓ EL TERMO!', 50), RE('papelon', '¡QUÉ PAPELÓN, BO!', 50), RE('campito', '¡A LLORAR AL CAMPITO!', 50), RE('avivate', '¡TOMÁ MATE Y AVIVATE!', 50)];
export const SECCIONES = [['TRAJES', TRAJES], ['MEJORAS', MEJORAS], ['FESTEJOS', FESTEJOS], ['TÍTULOS', TITULOS], ['RELATOR', RELATOR]];
export const POR_ITEM = new Map([...TRAJES, ...TITULOS, ...FESTEJOS, ...RELATOR].map((i) => [i.id, i]));

// los trajes se registran como cuerpos propios en DEFS (clave 'cuerpo~traje'): el sprite se arma de cero con esas prendas
export function claveTraje(L, sid) { return L.cuerpo + '~' + sid; }
for (const tr of TRAJES) { const L = POR_ID[tr.pj]; if (!L) continue; const base = DEFS[L.cuerpo]; if (!base) continue; const k = claveTraje(L, tr.sid);
  if (!DEFS[k]) DEFS[k] = Object.assign({}, base, tr.def, { ropa: Object.assign({}, base.ropa, tr.ropa), nombre: base.nombre, traje: tr.sid }); }
export const trajesDe = (pj) => TRAJES.filter((t) => t.pj === pj);

// ---------------------------------------------------------------- estado (dentro del guardado de siempre)
export function baseTienda() { return { v: 1, fichas: 0, ganadas: 0, gastadas: 0, compras: {}, mejoras: {}, trajes: {}, titulo: null, festejo: null, relator: null, ganoCon: [], torres1: {}, bienvenida: false }; }
// asegura el campo y migra guardados viejos (v12): bienvenida única según lo ya jugado en PLENA MORTAL (tope 400)
export function TP() { const p = P.pelea; if (!p) return baseTienda();
  if (!p.tienda || typeof p.tienda !== 'object') p.tienda = baseTienda(); const t = p.tienda; const b = baseTienda();
  for (const k in b) if (t[k] === undefined || (typeof b[k] === 'object' && b[k] !== null && (typeof t[k] !== 'object' || t[k] === null))) t[k] = b[k];
  if (!Number.isFinite(t.fichas) || t.fichas < 0) t.fichas = 0;
  if (!t.bienvenida && !DIOS.on) { t.bienvenida = true; const hechas = Object.values(p.torres || {}).filter((x) => x && x.hechas > 0).length; const n = Math.min(400, (p.ganadas || 0) * 5 + hechas * 100);
    for (const id in p.torres || {}) if (p.torres[id] && p.torres[id].hechas > 0) t.torres1[id] = true; // las primeras vueltas ya cobradas en la bienvenida
    for (const id of p.ganadores || []) if (!t.ganoCon.includes(id)) t.ganoCon.push(id);
    t.fichas += n; t.ganadas += n; t.bienvenidaN = n; guardar(); }
  return t; }
export const fichas = () => TP().fichas;
export const nivelMejora = (k) => Math.max(0, Math.min(3, TP().mejoras[k] | 0));
// suma fichas (la Alcancía multiplica). En MODO DIOS no se gana nada: el truco no regala moneda.
export function ganarFichas(n, motivo = '') { if (DIOS.on || !(n > 0)) return 0; const t = TP(); const v = Math.round(n * (1 + nivelMejora('fichas') * 0.1)); t.fichas += v; t.ganadas += v; guardar(); void motivo; return v; }

// ---------------------------------------------------------------- compras y equipo
export function tiene(it) { const t = TP(); if (it.tipo === 'mejora') return nivelMejora(it.id) >= it.max; return !!t.compras[it.id]; }
export function precioDe(it) { return it.tipo === 'mejora' ? (nivelMejora(it.id) >= it.max ? 0 : it.precios[nivelMejora(it.id)]) : it.precio; }
export function bloqueo(it) { if (it.req && it.req.torre) { const x = P.pelea.torres[it.req.torre]; if (!(x && x.hechas > 0) && !DIOS.on) return it.req.txt; } return null; }
export function estadoItem(it) { if (tiene(it)) return 'tiene'; if (bloqueo(it)) return 'bloq'; return fichas() >= precioDe(it) ? 'ok' : 'caro'; }
export function comprarItem(it) { if (estadoItem(it) !== 'ok') return false; const t = TP(); const pr = precioDe(it); t.fichas -= pr; t.gastadas += pr;
  if (it.tipo === 'mejora') t.mejoras[it.id] = nivelMejora(it.id) + 1; else { t.compras[it.id] = true; equipar(it, true); } guardar(); return true; }
export function equipado(it) { const t = TP(); if (it.tipo === 'traje') return t.trajes[it.pj] === it.sid; if (it.tipo === 'titulo') return t.titulo === it.id; if (it.tipo === 'festejo') return t.festejo === it.id; if (it.tipo === 'relator') return t.relator === it.id; return false; }
// equipar/desequipar (alterna); los trajes van por luchador
export function equipar(it, forzar = false) { const t = TP(); if (!t.compras[it.id]) return false; const on = forzar || !equipado(it);
  if (it.tipo === 'traje') { if (on) t.trajes[it.pj] = it.sid; else delete t.trajes[it.pj]; } else if (it.tipo === 'titulo') t.titulo = on ? it.id : null; else if (it.tipo === 'festejo') t.festejo = on ? it.id : null; else if (it.tipo === 'relator') t.relator = on ? it.id : null;
  guardar(); return true; }
// selector de traje en la selección: original + los comprados, en orden
export function opcionesTraje(pj) { const t = TP(); return [null, ...trajesDe(pj).filter((x) => t.compras[x.id]).map((x) => x.sid)]; }
export function trajeActual(pj) { const t = TP(); const s = t.trajes[pj]; return s && t.compras[pj + '.' + s] ? s : null; }
export function ciclarTraje(pj, d = 1) { const ops = opcionesTraje(pj); if (ops.length < 2) return false; const t = TP(); const i = Math.max(0, ops.indexOf(trajeActual(pj))); const s = ops[(i + d + ops.length) % ops.length]; if (s) t.trajes[pj] = s; else delete t.trajes[pj]; guardar(); return true; }
export const nombreTraje = (pj, sid) => { if (!sid) return 'ORIGINAL'; const it = POR_ITEM.get(pj + '.' + sid); return it ? it.nombre : 'ORIGINAL'; };

// ---------------------------------------------------------------- lo que se lleva el jugador a la pelea
export const MODOS_PM = new Set(['libre', 'torre', 'superv']);
// devuelve los extras del P1 para cfg.p1 (nada en campaña ni beat 'em up)
export function equipoP1(pj, modo) { if (!MODOS_PM.has(modo)) return {}; const t = TP(); const tit = t.titulo && t.compras[t.titulo] ? POR_ITEM.get(t.titulo) : null; const fe = t.festejo && t.compras[t.festejo] ? POR_ITEM.get(t.festejo) : null; const re = t.relator && t.compras[t.relator] ? POR_ITEM.get(t.relator) : null;
  return { traje: trajeActual(pj), titulo: tit ? tit.nombre : null, festejo: fe ? fe.pose : null, relator: re ? re.frase : null, mej: mejorasPM() }; }
export function mejorasPM() { const n = nivelMejora; return { hp: 1 + n('vida') * 0.03, sup: 1 + n('super') * 0.07, ini: n('ini') * 10, zafa: 50 - n('zafa') * 5, zafaInv: n('zafa') * 0.1, superv: 0.25 + n('superv') * 0.1 }; }

// ---------------------------------------------------------------- premios en fichas (se cobran al terminar cada pelea)
const PISO = { barrio: 20, caos: 30, infierno: 45 }, TORRE1 = { barrio: 250, caos: 450, infierno: 800 }, TORREN = { barrio: 80, caos: 140, infierno: 220 };
// r = resultado de la pelea, cfg = config, extra = { torre, jefe, superv }
export function premioPelea(r, cfg, extra = {}) { if (!MODOS_PM.has(cfg.modo) || cfg.p1.cpu) return { total: 0, items: [] }; if (DIOS.on) return { total: 0, items: [], dios: true }; const gane = r.gana === 1; const items = [];
  if (cfg.modo === 'libre') items.push(gane ? ['GANASTE (' + ['FÁCIL', 'NORMAL', 'DIFÍCIL'][(cfg.p2.dif || 1) - 1] + ')', 5 + 10 * (cfg.p2.dif || 1)] : ['POR PELEAR', 5]);
  if (cfg.modo === 'torre' && gane) { const b = PISO[extra.torre] || 20; items.push([extra.jefe ? 'PISO DE JEFE' : 'PISO GANADO', extra.jefe ? b * 2 : b]); }
  if (cfg.modo === 'superv' && gane) items.push(['RIVAL ' + (extra.superv || 1), Math.min(40, 10 + 3 * (extra.superv || 1))]);
  if (gane && r.stats && r.stats.perfectos) items.push(['¡IMPECABLE!', 10 * Math.min(2, r.stats.perfectos)]);
  const t = TP(); if (gane && !t.ganoCon.includes(cfg.p1.id)) { t.ganoCon.push(cfg.p1.id); items.push(['PRIMERA CON ' + (POR_ID[cfg.p1.id] ? POR_ID[cfg.p1.id].nombre : ''), 25]); }
  return cobrar(items); }
export function premioTorre(id) { const t = TP(); const primera = !t.torres1[id]; t.torres1[id] = true; return cobrar([[primera ? 'PRIMERA VEZ EN LA CIMA' : 'TORRE COMPLETA', primera ? TORRE1[id] || 200 : TORREN[id] || 60]]); }
export function premioInfinito(olas) { return cobrar(olas > 0 ? [['OLEADAS SUPERADAS: ' + olas, Math.min(90, olas * 3)]] : []); }
function cobrar(items) { if (DIOS.on) return { total: 0, items: [], dios: true }; let total = 0; for (const it of items) total += ganarFichas(it[1]); return { total, items }; }
void LUCHADORES;
