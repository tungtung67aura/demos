// Generador procedural de sprites por capas.
// Esqueleto por pose -> partes (cuerpo + ropa) rasterizadas, cada una con su sombreado y contorno,
// compuestas en un cuadro que se recorta y se guarda una sola vez (costo por cuadro en juego: 1 drawImage).
import { Buf, col, MAPA_OSC, MAPA_CLA, MAPA_OSC2, MAPA_OSC3, MAPA_CLA2, MAPA_RIM, CONTORNO, OSCURAS, rgba32, tono, lienzo } from './pixel.js';
// densidad de los luchadores: subpíxeles por píxel del juego. Siempre igual a la densidad del lienzo (main.js),
// así cada subpíxel cae exacto en píxeles de pantalla (2 con escala par, 3 con escala 3, 1 con escala 1/5/7): nada de escalas 1,5×.
export let Q = 2;
export function fijarQ(q) { if (q !== Q) { Q = q; cacheSp.clear(); } }
import { CABEZAS, ARRIBAS, ABAJOS, CALZADOS } from './ropa.js';

const S = Math.sin, C = Math.cos, PI = Math.PI;
const NEG = rgba32(CONTORNO);

// ---------- POSES (mirando a la derecha) ----------
// Cada pose se arma por ARTICULACIONES (esqueleto 2D en vista 3/4). Unidades: hu = 1 cabeza (alto/5), ángulos en radianes.
//  g: giro del cuerpo hacia la cámara (0 = perfil, 0,55 ≈ 3/4)       x, y: corrimiento de la pelvis (y<0 = flexiona rodillas)
//  alto: altura absoluta de la pelvis (en el aire o en el piso)       lean: inclinación de la columna (+ adelante), enc: encorvado del pecho
//  head: giro de la cabeza    cara: expresión    mano: 'abierta' | 'puno'
//  pn / pf: pierna cercana (a cámara, atrás en guardia) / lejana (adelante).
//     [x, alza, angPie] = cinemática inversa: el pie va a x (desde la pelvis) y alza (desde el piso); la rodilla se resuelve sola, siempre hacia adelante
//     { fk: [cadera, rodilla, pie] } = ángulos (cadera desde abajo, + adelante; la rodilla sólo flexiona hacia atrás, -2,6..0)
//  bn / bf: brazo cercano (guardia al mentón) / lejano (el de la mano adelantada).
//     { m: [x, y] } = cinemática inversa del puño desde el hombro (el codo cae abajo/atrás, nunca al revés)
//     { fk: [hombro, codo] } = ángulos (hombro desde abajo, + adelante; el codo sólo flexiona hacia adelante, 0..2,6)
const G0 = { g: 0.55, x: 0, y: -0.3, lean: 0.12, enc: 0.06, head: -0.06, pn: [-0.7, 0, 0], pf: [0.72, 0, 0], bn: { m: [0.84, 0.04] }, bf: { m: [1.24, 0.12] } };
const P = (o) => Object.assign({}, G0, o);
function mezcla(a, b, t) {
  if (typeof a === 'number' && typeof b === 'number') return a + (b - a) * t;
  if (Array.isArray(a) && Array.isArray(b)) return a.map((v, i) => mezcla(v, b[i], t));
  if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
    const ka = Object.keys(a), kb = Object.keys(b); if (ka.length !== kb.length || ka.some((k) => !(k in b))) return t < 0.5 ? a : b; // IK ↔ FK: no se mezclan
    const o = {}; for (const k of ka) o[k] = mezcla(a[k], b[k], t); return o; }
  return a === undefined ? b : b === undefined ? a : t < 0.5 ? a : b;
}
function mezclaPose(a, b, t) { const o = {}; for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) o[k] = mezcla(a[k], b[k], t); return o; }
const Q0 = P({});
const ARMA = { m: [0.5, 0.02] }; // palo/botella en la mano cercana, a la altura del pecho, apuntando arriba-adelante
const caminar = (arma) => { const r = []; for (let i = 0; i < 8; i++) { const th = (i / 8) * PI * 2, c = C(th);
  // pie: medio ciclo apoyado (va hacia atrás respecto de la pelvis) y medio en el aire (punta abajo al despegar, talón al apoyar)
  const pie = (ph) => { const x = 0.62 * C(ph), sn = -S(ph), alza = 0.32 * Math.max(0, sn); return [x, alza, alza > 0.01 ? (C(ph) < 0 ? -0.55 : 0.22) * sn : 0]; };
  r.push(P({ g: 0.5, y: -0.16 - 0.12 * c * c, lean: 0.14, head: -0.04 + 0.02 * c, pn: pie(th), pf: pie(th + PI),
    bn: arma ? ARMA : { m: [0.76 - 0.16 * c, 0.0] }, bf: { m: [1.12 + 0.16 * c, 0.06] } })); } return r; };
const respirar = (arma) => [0, 1, 2, 1].map((i) => P({ y: -0.3 - i * 0.04, enc: 0.06 + i * 0.01, bn: arma ? ARMA : { m: [0.84, 0.04 - i * 0.04] }, bf: { m: [1.24, 0.12 - i * 0.04] } }));
const ataque = (a, g, r1) => [a, g, r1, mezclaPose(r1, Q0, 0.55)];
const piernaAtras = { pn: [-0.95, 0.12, -0.4] }; // talón de atrás levantado al rotar la cadera
export const POSES = {
  quieto: respirar(false),
  quietoArma: respirar(true),
  camina: caminar(false),
  caminaArma: caminar(true),
  // jab con la mano adelantada (lejana)
  pina1: ataque(P({ y: -0.34, x: -0.08, lean: 0.06, bf: { m: [0.78, 0.36] }, bn: { m: [0.66, 0.42] }, cara: 'enojo' }),
    P({ y: -0.36, x: 0.16, lean: 0.2, g: 0.6, pn: [-0.86, 0, 0], pf: [0.6, 0, 0], bf: { m: [2.1, 0.22] }, bn: { m: [0.68, 0.38] }, cara: 'grito' }),
    P({ y: -0.36, x: 0.14, lean: 0.18, g: 0.6, pn: [-0.84, 0, 0], pf: [0.62, 0, 0], bf: { m: [1.75, 0.24] }, bn: { m: [0.68, 0.38] }, cara: 'grito' })),
  // directo con la mano de atrás (cercana): la cadera y el hombro rotan, el talón de atrás se levanta
  pina2: ataque(P({ y: -0.38, x: -0.12, lean: 0.03, g: 0.62, bn: { m: [0.48, 0.26] }, bf: { m: [1.0, 0.36] }, cara: 'enojo' }),
    P({ y: -0.42, x: 0.22, lean: 0.3, g: 0.22, ...piernaAtras, pf: [0.52, 0, 0], bn: { m: [2.1, 0.12] }, bf: { m: [0.5, 0.3] }, cara: 'grito' }),
    P({ y: -0.42, x: 0.2, lean: 0.28, g: 0.26, ...piernaAtras, pf: [0.54, 0, 0], bn: { m: [1.8, 0.14] }, bf: { m: [0.52, 0.3] }, cara: 'grito' })),
  // gancho ascendente: se agacha y sube con la mano de atrás
  pina3: ataque(P({ y: -0.62, lean: 0.36, enc: 0.1, g: 0.48, bn: { m: [0.42, -0.6] }, bf: { m: [0.86, 0.22] }, cara: 'enojo' }),
    P({ y: -0.06, x: 0.16, lean: -0.1, enc: -0.04, g: 0.32, head: -0.22, ...piernaAtras, pf: [0.5, 0, 0], bn: { m: [0.78, 1.15] }, bf: { m: [0.6, 0.06] }, cara: 'grito' }),
    P({ y: -0.08, x: 0.14, lean: -0.14, enc: -0.04, g: 0.34, head: -0.26, ...piernaAtras, pf: [0.5, 0, 0], bn: { m: [0.7, 1.3] }, bf: { m: [0.6, 0.06] }, cara: 'grito' })),
  // patada frontal con la pierna de atrás: recoge la rodilla, extiende, vuelve
  patada: ataque(P({ y: -0.26, lean: 0.02, pn: { fk: [1.05, -1.95, -0.3] }, pf: [0.3, 0, 0], bn: { m: [0.66, 0.42] }, bf: { m: [1.0, 0.34] }, cara: 'enojo' }),
    P({ y: -0.14, x: -0.12, lean: -0.34, pn: { fk: [1.58, -0.06, -0.45] }, pf: [0.02, 0, 0], bn: { m: [0.72, 0.32] }, bf: { fk: [-0.55, 0.95] }, cara: 'grito' }),
    P({ y: -0.18, x: -0.08, lean: -0.26, pn: { fk: [1.3, -1.0, -0.35] }, pf: [0.1, 0, 0], bn: { m: [0.72, 0.36] }, bf: { fk: [-0.3, 1.1] }, cara: 'grito' })),
  // golpe con el arma (mano cercana): arriba atrás → abajo adelante
  golpe: ataque(P({ y: -0.28, lean: -0.14, g: 0.45, bn: { fk: [2.55, 1.45] }, bf: { m: [0.9, 0.3] }, cara: 'enojo' }),
    P({ y: -0.42, x: 0.22, lean: 0.36, g: 0.3, ...piernaAtras, pf: [0.56, 0, 0], bn: { fk: [1.45, 0.12] }, bf: { m: [0.6, 0.0] }, cara: 'grito' }),
    P({ y: -0.44, x: 0.24, lean: 0.42, g: 0.3, ...piernaAtras, pf: [0.58, 0, 0], bn: { fk: [0.85, 0.15] }, bf: { m: [0.6, -0.04] }, cara: 'grito' })),
  salto: [P({ alto: 2.95, lean: 0.1, pn: { fk: [0.35, -1.7, -0.3] }, pf: { fk: [1.0, -1.75, -0.2] }, bn: { m: [0.85, 0.46] }, bf: { m: [1.1, 0.46] }, cara: 'enojo' })],
  // patada voladora como la referencia: pierna cercana estirada, la otra recogida, brazo lejano atrás para equilibrar
  voladora: [P({ alto: 2.75, lean: -0.3, head: 0.1, pn: { fk: [1.6, -0.03, -0.45] }, pf: { fk: [0.55, -2.15, -0.3] }, bn: { m: [0.78, 0.42] }, bf: { fk: [-1.2, 0.55] }, cara: 'grito' })],
  // dolor: [alto aplastado, alto retroceso, panza aplastado, panza doblado]
  dolor: [P({ y: -0.42, lean: -0.22, head: -0.36, g: 0.6, bn: { fk: [-0.2, 1.35] }, bf: { fk: [-0.45, 1.15] }, pn: [-0.74, 0, 0], pf: [0.55, 0, 0], cara: 'dolor' }),
    P({ y: -0.3, x: -0.16, lean: -0.42, head: -0.3, bn: { fk: [-0.5, 0.9] }, bf: { fk: [-0.75, 0.8] }, pn: [-0.56, 0, 0], pf: [0.82, 0, 0], cara: 'dolor' }),
    P({ y: -0.56, lean: 0.46, enc: 0.2, head: 0.16, bn: { m: [0.42, -0.74] }, bf: { m: [0.58, -0.68] }, cara: 'dolor' }),
    P({ y: -0.52, lean: 0.6, enc: 0.24, head: 0.24, bn: { m: [0.46, -0.86] }, bf: { m: [0.62, -0.8] }, pn: [-0.6, 0, 0], pf: [0.6, 0, 0], cara: 'dolor' })],
  // vuela: [subiendo, arriba, cayendo]
  vuela: [P({ alto: 2.7, lean: -0.75, head: -0.4, bn: { fk: [-1.9, 0.6] }, bf: { fk: [-2.4, 0.5] }, pn: { fk: [0.7, -0.6] }, pf: { fk: [0.35, -1.0] }, cara: 'dolor' }),
    P({ alto: 2.5, lean: -1.12, head: -0.3, bn: { fk: [-2.4, 0.4] }, bf: { fk: [-2.8, 0.3] }, pn: { fk: [1.05, -0.5] }, pf: { fk: [0.75, -0.9] }, cara: 'dolor' }),
    P({ alto: 2.2, lean: -1.4, head: -0.15, bn: { fk: [-2.7, 0.6] }, bf: { fk: [-3.0, 0.5] }, pn: { fk: [1.35, -0.55] }, pf: { fk: [1.05, -1.0] }, cara: 'dolor' })],
  // piso: [golpe contra el piso (piernas arriba), tirado]
  piso: [P({ alto: 0.52, lean: -1.5, head: -0.35, bn: { fk: [-1.7, 0.7] }, bf: { fk: [-2.4, 0.5] }, pn: { fk: [1.95, -0.35, -0.3] }, pf: { fk: [1.65, -0.75, -0.2] }, cara: 'dolor' }),
    P({ alto: 0.46, lean: -1.57, head: -0.12, bn: { fk: [-1.0, 0.35] }, bf: { fk: [-2.0, 0.3] }, pn: { fk: [1.5, -0.1, -0.5] }, pf: { fk: [1.4, -0.45, -0.4] }, cara: 'ko' })],
  // levanta: [sentado, rodilla en el piso, una pierna arriba, parándose]
  levanta: [P({ alto: 0.56, lean: -0.5, head: 0.25, pn: [1.55, 0, 0.25], pf: [1.75, 0, 0.1], bn: { fk: [-0.75, 0.25] }, bf: { fk: [-0.95, 0.2] }, cara: 'dolor', mano: 'abierta' }),
    P({ alto: 1.42, lean: 0.85, enc: 0.15, head: -0.45, pn: { fk: [0.08, -1.7, -0.7] }, pf: [1.0, 0, 0], bn: { m: [0.3, -1.85] }, bf: { m: [0.55, -1.8] }, cara: 'dolor', mano: 'abierta' }),
    P({ alto: 2.0, lean: 0.5, head: -0.1, pn: [-0.95, 0.15, -0.7], pf: [0.85, 0, 0], bn: { m: [0.62, -1.2] }, bf: { m: [0.85, -1.15] }, cara: 'enojo' }),
    P({ y: -0.62, lean: 0.26, pn: [-0.62, 0, 0], pf: [0.5, 0, 0], bn: { m: [0.72, 0.16] }, bf: { m: [0.95, 0.1] }, cara: 'enojo' })],
  agarra: [P({ lean: 0.22, x: 0.1, bn: { m: [1.45, 0.12] }, bf: { m: [1.62, 0.22] }, cara: 'enojo', mano: 'abierta' })],
  rodilla: [P({ lean: 0.2, bn: { m: [1.35, 0.08] }, bf: { m: [1.5, 0.18] }, pn: { fk: [0.9, -1.6, -0.4] }, pf: [0.2, 0, 0], cara: 'enojo', mano: 'abierta' }),
    P({ lean: 0.34, bn: { m: [1.25, -0.06] }, bf: { m: [1.4, 0.04] }, pn: { fk: [1.5, -2.2, -0.5] }, pf: [0.1, 0, 0], cara: 'grito', mano: 'abierta' })],
  revolea: [P({ lean: 0.16, y: -0.5, bn: { m: [1.5, 0.28] }, bf: { m: [1.6, 0.38] }, cara: 'enojo', mano: 'abierta' }),
    P({ lean: -0.5, head: -0.2, x: -0.1, bn: { fk: [2.7, 0.3] }, bf: { fk: [2.5, 0.4] }, pn: [-0.9, 0, 0], pf: [0.4, 0, 0], cara: 'grito', mano: 'abierta' })],
  especial: [P({ g: 0.85, y: -0.2, lean: 0, bn: { fk: [1.57, 0.05] }, bf: { fk: [-1.5, 0.1] }, pn: { fk: [1.55, -0.05, -0.4] }, pf: [0, 0, 0], cara: 'grito' }),
    P({ g: 0.12, y: -0.2, lean: 0, bn: { fk: [-1.5, 0.1] }, bf: { fk: [1.57, 0.05] }, pn: [-0.1, 0, 0], pf: { fk: [-1.35, -0.1, -0.2] }, cara: 'grito' })],
  junta: [P({ y: -0.9, lean: 0.55, bn: { m: [0.9, -1.3] }, bf: { m: [1.0, -1.2] }, pn: [-0.5, 0, 0], pf: [0.6, 0, 0], mano: 'abierta' }),
    P({ y: -1.3, lean: 0.8, enc: 0.1, bn: { m: [1.0, -1.6] }, bf: { m: [1.1, -1.5] }, pn: [-0.5, 0, 0], pf: [0.6, 0, 0], mano: 'abierta' })],
  festeja: [P({ y: -0.15, bn: { fk: [3.0, 0.15] }, bf: { m: [0.4, -0.3] }, head: -0.12, cara: 'feliz' }), P({ y: -0.25, bn: { fk: [2.75, 0.6] }, bf: { m: [0.4, -0.35] }, head: -0.06, cara: 'feliz' })],
  agarrado: [P({ y: -0.45, lean: 0.45, enc: 0.15, head: 0.25, bn: { m: [0.6, -0.6] }, bf: { m: [0.8, -0.5] }, pn: [-0.5, 0, 0], pf: [0.5, 0, 0], cara: 'dolor' })],
};
// levanta: 4 cuadros (sentado, en cuatro patas, rodilla, parándose)
// fases por cuadro de ataque: a = arranque (anticipación), g = golpe activo, r = recuperación
export const FASES = { pina1: 'agrr', pina2: 'agrr', pina3: 'agrr', patada: 'agrr', golpe: 'agrr' };
// elige el cuadro de un ataque según el tiempo y las fases
export function cuadroAtaque(anim, t, A) {
  const f = FASES[anim]; if (!f) return t < A.ini ? 0 : t < A.ini + A.act + A.rec * 0.4 ? 1 : 2;
  let fase, prog; if (t < A.ini) { fase = 'a'; prog = t / Math.max(0.001, A.ini); } else if (t < A.ini + A.act) { fase = 'g'; prog = (t - A.ini) / Math.max(0.001, A.act); } else { fase = 'r'; prog = (t - A.ini - A.act) / Math.max(0.001, A.rec); }
  const idx = []; for (let i = 0; i < f.length; i++) if (f[i] === fase) idx.push(i);
  return idx[Math.min(idx.length - 1, Math.floor(prog * idx.length))];
}

// ---------- CUERPOS (lo que no cambia con la ropa) ----------
export const DEFS = {
  seba: { nombre: 'EL SEBA', piel: '#e2a77c', pelo: '#3a2416', peinado: 'corto', escala: 1, ancho: 1, ropa: { cabeza: 'gorroUY', arriba: 'buzoUY', abajo: 'depRojo', calzado: 'zapaUY' } },
  pelado: { nombre: 'EL PELADO', piel: '#c98e64', pelo: '#2a1a12', peinado: 'pelado', barba: '#3a2618', cadena: true, tatuaje: true, escala: 1.08, ancho: 1.28, musculo: 1.14, mandibula: 1.15,
    ropa: { cabeza: 'nada', arriba: 'musculosa', abajo: 'jean', calzado: 'botitas' } },
  pato: { nombre: 'LA PATO', piel: '#eab48c', pelo: '#5a2e1a', peinado: 'cola', colita: '#e8458b', escala: 0.94, ancho: 0.86, mujer: true, mandibula: 0.85, pestanas: true,
    ropa: { cabeza: 'nada', arriba: 'celeste', abajo: 'calza', calzado: 'zapaRosa' } },
  // enemigos
  buzo: { nombre: 'CHUCHO', piel: '#d49a72', pelo: '#2a1a12', peinado: 'corto', escala: 1, ancho: 1.04, ceno: true, tatuajes: true, barba: '#3a2618', barbaCorta: true, ropa: { cabeza: 'gorraNegra', arriba: 'canguro', abajo: 'jean', calzado: 'zapaGris' } },
  mati: { nombre: 'MATI', piel: '#f0b88f', pelo: '#6b4024', peinado: 'flequillo', escala: 0.97, ancho: 0.82, flaco: true, ceno: true, mandibula: 0.92, ropa: { cabeza: 'nada', arriba: 'abierta', abajo: 'jean', calzado: 'zapaVerde' } },
  cacho: { nombre: 'CACHO', piel: '#e6a27c', pelo: '#2a1a12', peinado: 'rapado', escala: 1.0, ancho: 1.4, panza: 13, papada: true, cachetes: true, ceno: true, mandibula: 1.2, barba: '#4a3022', barbaCorta: true, ropa: { cabeza: 'gorraCAP', arriba: 'campera', abajo: 'depNegro', calzado: 'zapaNegra' } },
  tano: { nombre: 'EL TANO', piel: '#d8986c', pelo: '#15100c', peinado: 'engominado', bigote: '#15100c', lentes: true, cadena: true, escala: 1.12, ancho: 1.42, panza: 6, ceno: true, mandibula: 1.25,
    ropa: { cabeza: 'nada', arriba: 'saco', abajo: 'vestir', calzado: 'zapatos' } },
};
// variantes de enemigos: cambian ropa (camisetas de clubes incluidas) y a veces el pelo/piel → siluetas distintas
export const VARIANTES = {
  buzo: [{}, { piel: '#c48a62', ropa: { cabeza: 'capucha', arriba: 'buzoBordo', abajo: 'jeanOscuro', calzado: 'zapaNegra' } },
    { piel: '#e0aa80', peinado: 'rapado', ropa: { cabeza: 'gorroRojo', arriba: 'nacional', abajo: 'shortAzul', calzado: 'zapaGris' } },
    { peinado: 'rulos', ropa: { cabeza: 'nada', arriba: 'wanderers', abajo: 'depNegro', calzado: 'zapaNegra' } }],
  mati: [{}, { pelo: '#2a1a12', ropa: { cabeza: 'gorraAtras', arriba: 'penarol', abajo: 'depNegro', calzado: 'zapaNegra' } },
    { pelo: '#2a1a12', peinado: 'rulos', piel: '#b07850', ropa: { cabeza: 'nada', arriba: 'defensor', abajo: 'jean', calzado: 'zapaRoja' } },
    { pelo: '#c89050', ropa: { cabeza: 'viseraBlanca', arriba: 'torque', abajo: 'shortNegro', calzado: 'zapaUY' } }],
  cacho: [{}, { piel: '#d49a72', peinado: 'pelado', ropa: { cabeza: 'nada', arriba: 'danubio', abajo: 'depNegro', calzado: 'zapaNegra' } },
    { ropa: { cabeza: 'gorroGris', arriba: 'wanderers', abajo: 'jeanOscuro', calzado: 'zapaGris' } }],
};

// combina cuerpo + ropa en una definición plana para dibujar
function armarDef(clave, variante, ropa) {
  const base = DEFS[clave], v = (VARIANTES[clave] || [])[variante] || {};
  const def = Object.assign({}, base, v);
  const r = Object.assign({}, base.ropa, v.ropa || {}, ropa || {});
  def.ropa = r; def.cab = CABEZAS[r.cabeza] || CABEZAS.nada;
  if (def.cab.tipo === 'capucha' && ARRIBAS[r.arriba] && ARRIBAS[r.arriba].tipo === 'buzo') def.cab = Object.assign({}, def.cab, { c1: ARRIBAS[r.arriba].c2 || ARRIBAS[r.arriba].c1 }); def.arr = ARRIBAS[r.arriba] || ARRIBAS.camisetaBlanca; def.aba = ABAJOS[r.abajo] || ABAJOS.jean; def.cal = CALZADOS[r.calzado] || CALZADOS.zapaGris;
  return def;
}

// ---------- ESQUELETO (canon, articulaciones y vista 3/4) ----------
// Canon: el cuerpo estirado mide ALTO·escala px del juego (piso → coronilla) y 5 cabezas (1 cabeza = hu). En guardia (rodillas
// flexionadas) cada luchador queda a la misma altura en pantalla que antes (56 px/m: Seba 103, Cacho 100, Tano 110 px a q=2).
// Las longitudes de los huesos son las mismas para todos (proporcionales a la escala): el tipo de cuerpo cambia MASA
// (panza, pecho, cuello, grosor de miembros), nunca el largo de un hueso. Así nadie queda gigante, enano o deforme.
const ALTO = 104, CABEZAS_ALTO = 5.0; // estilizado de beat 'em up: cabeza algo grande (lectura), cuerpo con proporciones reales
function medidas(def) {
  const Hb = ALTO * def.escala, hu = Hb / CABEZAS_ALTO, mu = def.mujer ? 1 : 0, fl = def.flaco ? 1 : 0, mm = (def.musculo || 1) - 1;
  const g = Math.min(1, (def.panza || 0) / 13), an = 1 + ((def.ancho || 1) - 1) * 0.22;
  const lim = 1.12 * (1 - 0.14 * fl) * (1 + (an - 1) * 0.5);
  return { Hb, hu, g, an, k: hu / 13.6, e: def.escala,
    ank: 0.036 * Hb, thigh: 0.215 * Hb, shin: 0.22 * Hb, L: 0.3 * Hb, upper: 0.172 * Hb, fore: 0.142 * Hb,
    shJ: 0.1 * Hb * (1 - 0.12 * mu) * (1 + mm * 0.7) * (1 - 0.06 * fl) * an, hipJ: 0.05 * Hb * (1 + 0.06 * mu + 0.12 * g),
    wThigh: 0.104 * Hb * lim * (1 + 0.16 * g) * (1 + mm * 0.6), wShin: 0.072 * Hb * lim * (1 + 0.1 * g) * (1 + mm * 0.4),
    wArmU: 0.066 * Hb * lim * (1 + mm * 1.6) * (1 + 0.12 * g) * (1 - 0.1 * mu), wArmL: 0.058 * Hb * lim * (1 + mm * 1.2) * (1 + 0.06 * g) * (1 - 0.1 * mu),
    wNeck: 0.072 * Hb * (1 + mm * 1.5) * (1 + 0.35 * g) * (1 - 0.15 * mu) };
}
// secciones del tronco a lo largo de la columna (t = 0 cadera, t = 1 línea de hombros): [t, medio ancho, fondo adelante, fondo atrás] (en Hb)
const HEM = { camiseta: 0.08, musculosa: 0.1, buzo: -0.05, campera: 0, abierta: 0, saco: -0.1 };
function secciones(cm, def) {
  const g = cm.g, mm = (def.musculo || 1) - 1, mu = def.mujer ? 1 : 0, fl = def.flaco ? 0.9 : 1, ch = 1 + mm * 0.9, an = cm.an, A = def.arr ? def.arr.tipo : '';
  const holg = A === 'buzo' ? 0.012 : A === 'campera' || A === 'saco' || A === 'abierta' ? 0.007 : 0;
  return [
    [-0.22, 0.078 * (1 + 0.06 * mu), 0.05 + 0.01 * g, 0.064],                                           // entrepierna / cola
    [0, 0.1 * (1 + 0.06 * mu) * (1 + 0.1 * g), 0.06 + 0.024 * g, 0.072 + 0.008 * g],                    // cadera
    [0.22, 0.094 * (1 + 0.26 * g) * (1 - 0.03 * mu), 0.058 + 0.1 * g, 0.064 + 0.008 * g],              // bajo vientre (panza)
    [0.42, 0.088 * (1 + 0.34 * g) * (1 - 0.15 * mu), 0.056 + 0.115 * g, 0.058 + 0.008 * g],              // cintura (panza)
    [0.66, 0.104 * ch * (1 + 0.14 * g) * (1 - 0.06 * mu), (0.066 + 0.042 * g) * ch * (1 + 0.14 * mu), 0.066 * ch], // pecho bajo
    [0.86, 0.122 * ch * (1 + 0.05 * g) * (1 - 0.12 * mu), 0.068 * ch * (1 + 0.06 * mu) + 0.012 * g, 0.072 * ch],  // pecho alto
    [0.97, 0.128 * ch * (1 - 0.12 * mu), 0.056 * ch, 0.066 * ch + 0.008 * g],                              // hombros
    [1.035, 0.1 * ch * (1 - 0.1 * mu) * (1 + 0.1 * g), 0.044 * ch, 0.056 * ch + 0.008 * g],                // caída del hombro (redondeada)
    [1.07, 0.062 * (1 + mm) * (1 + 0.25 * g), 0.036, 0.042 + 0.008 * g],                                 // cuello de la prenda / trapecio
  ].map(([t, W, Df, Db]) => [t, (W * 1.1 * fl * an + holg) * cm.Hb, (Df * 1.1 * fl + holg) * cm.Hb, (Db * 1.1 * fl + holg) * cm.Hb]);
}
// dos huesos por cinemática inversa en el plano sagital (y hacia arriba). s = +1: la articulación cae del lado antihorario
// (rodilla siempre adelante), s = -1: horario (codo siempre abajo/atrás). Si el objetivo no se alcanza, el miembro queda estirado.
function ik2(ax, ay, tx, ty, L1, L2, s) {
  let dx = tx - ax, dy = ty - ay; const d0 = Math.hypot(dx, dy) || 0.001; const d = Math.max(Math.abs(L1 - L2) + 1, Math.min((L1 + L2) * 0.998, d0)); dx *= d / d0; dy *= d / d0;
  const ux = dx / d, uy = dy / d, a = (L1 * L1 - L2 * L2 + d * d) / (2 * d), hh = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  return [[ax + ux * a - uy * hh * s, ay + uy * a + ux * hh * s], [ax + dx, ay + dy]];
}
// arma el esqueleto de una pose: articulaciones en pantalla (px del juego) y el volumen del tronco por secciones.
// Proyección 3/4: x (adelante), y (arriba), l (lateral, + = lado cercano a cámara) → pantalla (FX + x·cos g − l·sen g, FY − y)
function esqueleto(def, pose, w, h) {
  const cm = medidas(def), hu = cm.hu, ca = C(pose.g), sa = S(pose.g);
  const FX = Math.round(w * 0.46), FY = h - 6;
  const scr = (x, y, l = 0) => [FX + x * ca - l * sa, FY - y];
  const legL = cm.thigh + cm.shin, Px = (pose.x || 0) * hu; let Py;
  if (pose.alto != null) Py = pose.alto * hu;
  else { Py = cm.ank + legL * 0.97 + (pose.y || 0) * hu; // pies apoyados: la pelvis nunca queda más alta de lo que dan las piernas (nada flota)
    for (const pie of [pose.pn, pose.pf]) if (Array.isArray(pie) && !pie[1]) { const dx = pie[0] * hu; Py = Math.min(Py, cm.ank + Math.sqrt(Math.max(0, (legL * 0.99) ** 2 - dx * dx))); } }
  const lean = pose.lean || 0, enc = pose.enc || 0, L = cm.L;
  const d1 = [S(lean), C(lean)], d2 = [S(lean + enc), C(lean + enc)];
  const sag = (t) => t <= 0.5 ? [Px + d1[0] * L * t, Py + d1[1] * L * t] : [Px + d1[0] * L * 0.5 + d2[0] * L * (t - 0.5), Py + d1[1] * L * 0.5 + d2[1] * L * (t - 0.5)];
  const secs = secciones(cm, def);
  const interp = (t) => { let i = 0; while (i < secs.length - 2 && secs[i + 1][0] < t) i++; const a = secs[i], b = secs[i + 1]; const u = Math.max(0, Math.min(1, (t - a[0]) / (b[0] - a[0]))); return [a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u, a[3] + (b[3] - a[3]) * u]; };
  const memo = new Map();
  const sec = (t) => { const key = Math.round(t * 400); let r = memo.get(key); if (r) return r; t = key / 400;
    const d = t <= 0.5 ? d1 : d2, nf = [d[1], -d[0]], s0 = sag(t), c = scr(s0[0], s0[1]);
    let Dx = d[0] * ca, Dy = -d[1]; const dl = Math.hypot(Dx, Dy) || 1; Dx /= dl; Dy /= dl; const N = [-Dy, Dx];
    const [W, Df, Db] = interp(t); const off = (f, l) => [f * nf[0] * ca - l * sa, -f * nf[1]];
    let fr = -1e9, bk = 1e9; for (let i = 0; i < 32; i++) { const ph = (i / 32) * PI * 2, cf = C(ph); const [ox, oy] = off(cf * (cf > 0 ? Df : Db), S(ph) * W); const p = ox * N[0] + oy * N[1]; if (p > fr) fr = p; if (p < bk) bk = p; }
    r = { t, c, N, W, Df, Db, off, fr, bk }; memo.set(key, r); return r; };
  // punto de la superficie del frente a la altura t; lf = posición lateral (-1 lado lejano … 0 esternón … +1 lado cercano)
  const S3 = (t, lf) => { const s = sec(t); const [ox, oy] = s.off(s.Df * Math.sqrt(Math.max(0, 1 - lf * lf)), lf * s.W); return [s.c[0] + ox, s.c[1] + oy]; };
  const sAt = (t, lf) => { const s = sec(t); const [ox, oy] = s.off(s.Df * Math.sqrt(Math.max(0, 1 - lf * lf)), lf * s.W); return ox * s.N[0] + oy * s.N[1]; };
  const T = (t, s) => { const q = sec(t); return [q.c[0] + q.N[0] * s, q.c[1] + q.N[1] * s]; };
  const c0 = sec(0).c, c1 = sec(1).c, Ls = Math.hypot(c1[0] - c0[0], c1[1] - c0[1]) || 1, ux = (c1[0] - c0[0]) / Ls, uy = (c1[1] - c0[1]) / Ls;
  const loc = (x, y) => { const dx = x + 0.5 - c0[0], dy = y + 0.5 - c0[1]; return [(dx * ux + dy * uy) / Ls, -dx * uy + dy * ux]; };
  // articulaciones
  const sh = (() => { const s = sag(0.955); return [s[0] - d2[1] * 0.012 * cm.Hb, s[1] + d2[0] * 0.012 * cm.Hb]; })();
  const pierna = (spec, l) => { let K, A, ang;
    if (Array.isArray(spec)) { [K, A] = ik2(Px, Py, Px + spec[0] * hu, cm.ank + (spec[1] || 0) * hu, cm.thigh, cm.shin, 1); ang = spec[2] || 0; }
    else { const [a1, f0, ex] = spec.fk, f = Math.max(-2.6, Math.min(0, f0)); K = [Px + S(a1) * cm.thigh, Py - C(a1) * cm.thigh]; const a = a1 + f; A = [K[0] + S(a) * cm.shin, K[1] - C(a) * cm.shin]; ang = a + (ex || 0); }
    return { H: scr(Px, Py, l), K: scr(K[0], K[1], l), A: scr(A[0], A[1], l), ang }; };
  const brazo = (spec, l) => { let E, Wr; const [sx, sy] = sh;
    if (spec.m) [E, Wr] = ik2(sx, sy, sx + spec.m[0] * hu, sy + spec.m[1] * hu, cm.upper, cm.fore, -1);
    else { const [a1, f0] = spec.fk, f = Math.max(0, Math.min(2.6, f0)); E = [sx + S(a1) * cm.upper, sy - C(a1) * cm.upper]; const a = a1 + f; Wr = [E[0] + S(a) * cm.fore, E[1] - C(a) * cm.fore]; }
    return { S: scr(sx, sy, l), E: scr(E[0], E[1], l), W: scr(Wr[0], Wr[1], l) }; };
  const nt = sag(1.17), NT = scr(nt[0] + d2[1] * 0.012 * cm.Hb, nt[1] - d2[0] * 0.012 * cm.Hb);
  const incl = Math.atan2(d2[0] * ca, d2[1]); // inclinación del pecho en pantalla
  return { cm, FX, FY, scr, sec, S3, sAt, T, loc, Ls, NT, incl, lean, pierna, brazo };
}
// polígono del tronco entre dos alturas (silueta = extremos proyectados de cada sección)
function poliSec(b, E, t0, t1, c) { const fr = [], bk = []; const n = Math.max(2, Math.ceil((t1 - t0) / 0.04));
  for (let i = 0; i <= n; i++) { const s = E.sec(t0 + ((t1 - t0) * i) / n); fr.push([s.c[0] + s.N[0] * s.fr, s.c[1] + s.N[1] * s.fr]); bk.push([s.c[0] + s.N[0] * s.bk, s.c[1] + s.N[1] * s.bk]); }
  b.poli([...fr, ...bk.reverse()], c); }
export function tamCuadro(def) { return { w: Math.round(150 * def.escala * Math.max(1, def.ancho * 0.9)), h: Math.round(160 * def.escala) }; }

// ---------- AYUDAS DE DIBUJO ----------
// miembro: cadena de puntos con anchos (bíceps, pantorrilla...)
function miembro(b, pts, ws, c) { for (let i = 0; i + 1 < pts.length; i++) b.seg(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], ws[i], ws[i + 1], c); }
// recolorea los píxeles de la capa que tengan color base según una función de (x, y)
function recolor(b, base, fn) { if (b.x1 < 0) return; const q = b.q; for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) { const i = y * b.w + x; if (b.d[i] === base) { const n = fn((x + 0.5) / q - 0.5, (y + 0.5) / q - 0.5, x, y); if (n) b.d[i] = n; } } }
// mini fuente 3x5 para letras de pecho y números
const MINI = { U: ['101', '101', '101', '101', '111'], R: ['110', '101', '110', '101', '101'], G: ['111', '100', '101', '101', '111'], A: ['010', '101', '111', '101', '101'], Y: ['101', '101', '010', '010', '010'],
  0: ['111', '101', '101', '101', '111'], 1: ['010', '110', '010', '010', '111'], 2: ['111', '001', '111', '100', '111'], 3: ['111', '001', '011', '001', '111'], 4: ['101', '101', '111', '001', '001'], 5: ['111', '100', '111', '001', '111'], 6: ['111', '100', '111', '101', '111'], 7: ['111', '001', '010', '010', '010'], 8: ['111', '101', '111', '101', '111'], 9: ['111', '101', '111', '001', '111'] };
let TEXTOS = null; // textos del pecho/espalda del cuadro actual (para que el espejo no los invierta)
// fp = subpíxeles por píxel de la fuente (q = letra de 1 px del juego; menos = letra más chica y fina, cabe entera en el pecho)
function mini(b, s, x, y, c, solo, fp = b.q) {
  const X0 = Math.round(x * b.q), Y0 = Math.round(y * b.q), w = (s.length * 4 - 1) * fp, g = new Set(); let cx = X0;
  for (const ch of s) { const m = MINI[ch]; if (m) for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (m[j][i] === '1') for (let fy = 0; fy < fp; fy++) for (let fx = 0; fx < fp; fx++) {
    const X = cx + i * fp + fx, Y = Y0 + j * fp + fy; if (solo && !(X >= 0 && Y >= 0 && X < b.w && Y < b.h && b.d[Y * b.w + X])) continue; g.add(Y * 4096 + X); b.f(X, Y, c); }
    cx += 4 * fp; }
  if (TEXTOS) TEXTOS.push({ x0: X0, y0: Y0, w, h: 5 * fp, g });
}

// ---------- CABEZA ----------
// coordenadas locales de cabeza: u adelante, v abajo, en "unidades" (radio ≈ 6.6)
function marcoCabeza(cx, cy, la, k) { const fx = C(la), fy = S(la), dx = -S(la), dy = C(la); const H = (u, v) => [cx + (fx * u + dx * v) * k, cy + (fy * u + dy * v) * k];
  H.inv = (x, y) => { const X = x - cx, Y = y - cy; return [(C(la) * X + S(la) * Y) / k, (-S(la) * X + C(la) * Y) / k]; }; return H; }
function craneo(b, def, H) {
  const piel = col(def.piel), j = def.mandibula || 1, m = def.mujer;
  const nariz = m ? 6.9 : 7.4;
  b.poli([[-6.1, -0.6], [-5.6, -4.4], [-3.6, -6.6], [0, -7.2], [3.6, -6.5], [5.6, -4.4], [6.2, -2.0], [6.0, -0.7], [nariz, 1.5], [6.1, 2.3], [6.5, 3.5], [6.0, 4.4],
    [5.4 + 0.3 * j, 5.4 + 0.6 * (j - 1)], [3.8 * j, 6.4 + 0.5 * (j - 1)], [0.6, 6.0 + 0.6 * (j - 1)], [-1.6, 3.9], [-3.4, 3.4], [-5.4, 1.8]].map(([u, v]) => H(u, v)), piel);
  // oreja
  const [ox, oy] = H(-1.0, 0.6); b.elipse(ox, oy, 1.3 * H.k, 1.8 * H.k, col(tono(def.piel, 0.86)));
  const [ix, iy] = H(-0.9, 0.8); b.px(Math.round(ix), Math.round(iy), col(tono(def.piel, 0.62)));
  if (def.barba) { const bc = col(def.barba); const corta = def.barbaCorta;
    b.poli([[-1.2, 2.2], [1.5, 3.4], [4.0, 3.2], [6.3, 3.6], [6.0, 4.6], [5.6 + 0.3 * j, 5.6], [3.8 * j, 6.8], [0.4, 6.2], [-1.8, 3.6]].map(([u, v]) => H(u, v)), bc);
    if (corta) { const g = Math.max(2, b.q), sombra = col(tono(def.piel, 0.8)); // barba de días: piel sombreada con puntos en grilla (no damero ruidoso)
      recolor(b, bc, (x, y, fx, fy) => (fy % g === 0 && fx % g === (Math.floor(fy / g) % 2) * (g >> 1) ? 0 : sombra)); }
    if (!corta) { const [mx, my] = H(4.6, 4.0); b.rect(Math.round(mx), Math.round(my), Math.max(2, Math.round(1.6 * H.k)), 1, piel); } // boca despejada
  }
  if (def.papada) b.poli([[0.4, 5.4], [3.6, 6.6], [5.2, 6.2], [4.4, 8.0], [1.0, 8.2], [-1.4, 6.6]].map(([u, v]) => H(u, v)), piel);
  if (def.cachetes) b.elipse(...H(3.4, 3.4), 2.6 * H.k, 2.0 * H.k, piel);
  if (def.bigote) b.poli([[3.6, 2.6], [6.4, 2.4], [6.6, 3.3], [5.0, 3.5], [3.4, 3.6]].map(([u, v]) => H(u, v)), col(def.bigote));
}
function pelo(b, def, H, conGorro) {
  const p = col(def.pelo);
  const poli = (pts, c = p) => b.poli(pts.map(([u, v]) => H(u, v)), c);
  switch (def.peinado) {
    case 'corto': poli(conGorro ? [[-6.4, -0.4], [-6.2, -3.4], [-2.5, -3.6], [-1.6, 1.0], [-3.6, 2.0], [-5.6, 1.6]] : [[-6.5, -0.4], [-6.1, -4.8], [-3.8, -7.4], [0, -8.0], [3.8, -7.3], [6.0, -5.0], [5.4, -3.4], [4.0, -4.4], [2.0, -4.0], [0.2, -4.5], [-1.4, -2.6], [-1.4, 1.0], [-3.6, 2.0], [-5.6, 1.6]]);
      if (!conGorro) for (const [u, v] of [[-2, -8.3], [0.8, -8.5], [3.2, -7.9]]) poli([[u - 1.2, v + 1], [u + 0.2, v - 0.6], [u + 1.2, v + 1.2]]);
      break;
    case 'flequillo': poli([[-6.5, -0.4], [-6.2, -5], [-3.6, -7.8], [0.5, -8.4], [4.2, -7.6], [6.6, -5.2], [7.0, -2.8], [5.6, -3.4], [4.8, -2.4], [3.6, -3.6], [2.0, -2.6], [0.4, -4.0], [-1.4, -2.2], [-1.4, 1.2], [-3.6, 2.2], [-5.6, 1.6]]);
      break;
    case 'rapado': { const c2 = col(tono(def.pelo, 1.25)); poli([[-6.3, -0.6], [-5.8, -4.6], [-3.6, -6.9], [0, -7.5], [3.6, -6.8], [5.4, -4.8], [4.0, -4.6], [0, -4.8], [-1.6, -2.4], [-1.6, 0.8], [-5.4, 1.4]], c2); const g = Math.max(2, b.q), cp = col(tono(def.piel, 0.72)); recolor(b, c2, (x, y, fx, fy) => (fy % g === 0 && fx % g === (Math.floor(fy / g) % 2) * (g >> 1) ? 0 : cp)); break; }
    case 'pelado': { const [x0, y0] = H(1.0, -6.0); b.rect(Math.round(x0), Math.round(y0), Math.max(2, Math.round(2 * H.k)), 1, col(tono(def.piel, 1.35)));
      break; }
    case 'cola': poli([[-6.5, -0.4], [-6.1, -4.8], [-3.8, -7.4], [0, -8.0], [3.8, -7.3], [6.2, -5.0], [6.4, -3.0], [4.6, -3.6], [3.0, -2.4], [1.6, -4.0], [-0.6, -3.0], [-1.2, 1.0], [-3.6, 2.2], [-5.6, 1.6]]);
      break;
    case 'rulos': for (const [u, v, r] of [[-5.2, -2.8, 2.6], [-4.4, -5.6, 2.8], [-1.8, -7.4, 2.8], [1.2, -7.8, 2.7], [3.9, -6.7, 2.5], [5.4, -4.6, 2.0], [-5.6, 0.2, 2.2]]) { const [x, y] = H(u, v); b.disco(x, y, r * H.k, p); }
      recolor(b, p, (x, y, fx, fy) => ((fx * 7 + fy * 3) % 9 === 0 ? col(tono(def.pelo, 1.4)) : (fx * 5 + fy * 2) % 11 === 0 ? col(tono(def.pelo, 0.7)) : 0)); break;
    case 'engominado': poli([[-6.6, 0.2], [-6.4, -4.6], [-4.0, -7.4], [0, -8.0], [3.6, -7.4], [5.8, -5.4], [5.6, -4.2], [3.0, -4.6], [0, -4.6], [-1.8, -2.6], [-1.6, 0.6], [-3.6, 2.0], [-5.8, 2.0]]);
      { const [a0, b0] = H(-3, -6.4), [a1, b1] = H(2.6, -6.6); b.linea(a0, b0, a1, b1, col(tono(def.pelo, 2.4))); } break;
  }
}
function colaDeCaballo(b, def, H) { const [x0, y0] = H(-5.2, -4.6), [x1, y1] = H(-8.6, 0.6), [x2, y2] = H(-7.8, 5.4); const p = col(def.pelo); b.seg(x0, y0, x1, y1, 4.8 * H.k, 4.2 * H.k, p); b.seg(x1, y1, x2, y2, 4.2 * H.k, 1.8 * H.k, p); }
function gomita(b, def, H) { const [x, y] = H(-5.4, -4.2); b.disco(x, y, 1.4 * H.k, col(def.colita || '#e8458b')); }
function sombrero(b, def, H) {
  const c = def.cab; if (!c || c.tipo === 'nada') return;
  const c1 = col(c.c1), c2 = col(c.c2 || c.c1);
  const poli = (pts, cc) => b.poli(pts.map(([u, v]) => H(u, v)), cc);
  if (c.tipo === 'lana') {
    poli([[-6.8, -1.6], [-6.6, -5.0], [-4.2, -8.0], [0, -8.9], [4.2, -8.2], [6.6, -5.8], [6.8, -4.4], [6.4, -3.6], [-6.6, -1.2]], c1);
    if (!c.liso) recolor(b, c1, (x, y) => { const v = ((x - H(0, 0)[0]) * -S(H.la) + (y - H(0, 0)[1]) * C(H.la)) / H.k; return v < -4 && Math.floor((v + 20) / 1.4) % 2 ? c2 : 0; });
    poli([[-6.9, -1.0], [-6.8, -3.8], [6.9, -5.6], [7.0, -3.4]], col(tono(c.c1, 0.9))); // vuelta
    const [px, py] = H(-1.2, -9.4); b.disco(px, py, 1.7 * H.k, c2); // pompón
  } else if (c.tipo === 'gorra') {
    poli([[-6.6, -2.4], [-6.0, -6.0], [-3.2, -8.6], [0.6, -9.2], [4.2, -8.2], [6.4, -5.6], [6.6, -3.4]], c1);
    if (c.atras) poli([[-6.4, -3.6], [-11.0, -2.8], [-11.2, -1.8], [-6.4, -2.0]], c2);
    else poli([[5.4, -4.6], [11.6, -3.6], [11.8, -2.6], [5.6, -2.6]], c2);
    const [bx, by] = H(-0.4, -9.0); b.px(Math.round(bx), Math.round(by), c2); // botón
    if (c.letra) { const [lx, ly] = H(2.4, -7.2); b.rect(Math.round(lx), Math.round(ly), Math.max(3, Math.round(2.6 * H.k)), Math.max(2, Math.round(1.6 * H.k)), c2); }
  } else if (c.tipo === 'visera') {
    poli([[-6.6, -3.0], [-6.4, -4.8], [6.4, -4.8], [6.6, -3.0]], c1);
    poli([[5.4, -4.4], [11.4, -3.4], [11.6, -2.4], [5.6, -2.6]], c2);
  } else if (c.tipo === 'capucha') {
    poli([[-7.6, 3.2], [-8.4, -2.6], [-6.4, -8.2], [-1.4, -10.2], [3.6, -9.4], [6.6, -6.6], [7.4, -4.0], [5.4, -4.6], [2.0, -6.8], [-2.0, -5.8], [-3.6, -1.0], [-3.0, 3.6], [-1.0, 6.4], [-5.2, 6.6]], c1);
    const [a0, b0] = H(5.4, -4.6), [a1, b1] = H(-2.6, -2.0); b.linea(a0, b0, a1, b1, col(tono(c.c1, 0.6)));
  }
}
// rasgos: se dibujan sobre el cuadro ya sombreado, en subpíxeles (ojos, cejas, nariz, boca, barba de días, pómulos)
function tonosPiel(def) { const c = col(def.piel); return new Set([c, MAPA_OSC.get(c), MAPA_OSC2.get(c), MAPA_OSC3.get(c), MAPA_CLA.get(c), MAPA_CLA2.get(c), MAPA_RIM.get(c)]); }
function rasgos(b, def, H, cara) {
  // medidas en subpíxeles pensadas para q=2; o(n) las lleva a la densidad actual (q=1, 2 o 3) sin perder proporción
  const q = b.q, k = H.k, kq = k * q, R = Math.round, sq = q / 2;
  const o = (n) => (n === 0 ? 0 : Math.sign(n) * Math.max(1, R(Math.abs(n) * sq))), u1 = o(1);
  // punto fino en coordenadas de cabeza
  const F = (u, v) => { const [x, y] = H(u, v); return [Math.floor(x * q), Math.floor(y * q)]; };
  const caja = (X, Y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) b.f(X + i, Y + j, c); }, put = (X, Y, c) => caja(X, Y, u1, u1, c);
  const bl = rgba32('#f4efe6'), neg = rgba32('#1b1220'), ojo = rgba32(def.ojos || '#3a2416'), brillo = rgba32('#ffffff');
  const cc = rgba32(tono(def.pelo, 0.75)), labio = rgba32(tono(def.piel, 0.58)), labioC = rgba32(tono(def.piel, 0.8)), boca = rgba32('#4a1018'), dientes = rgba32('#f0e8e0'), lengua = rgba32('#c8505a');
  const sombraP = rgba32(tono(def.piel, 0.68)), luzP = rgba32(tono(def.piel, 1.18)), medio = rgba32(tono(def.piel, 0.84));
  const piel = tonosPiel(def);
  // --- zona de piel: barba de días, pómulo y sombra bajo el pómulo (sólo sobre píxeles de piel)
  { const [ax, ay] = H(-2, -8), [bx2, by2] = H(9, 9), [cx2, cy2] = H(-2, 9), [dx2, dy2] = H(9, -8);
    const X0 = Math.floor(Math.min(ax, bx2, cx2, dx2) * q), X1 = Math.ceil(Math.max(ax, bx2, cx2, dx2) * q), Y0 = Math.floor(Math.min(ay, by2, cy2, dy2) * q), Y1 = Math.ceil(Math.max(ay, by2, cy2, dy2) * q);
    const barbita = !def.mujer && !def.barba, tb = rgba32(tono(def.piel, 0.8)), tb2 = rgba32(tono(def.pelo, 1.5));
    // patrón de barba: puntos aislados en una grilla de ~1 px del juego (parejo, no ruido)
    const g = Math.max(2, q), punto = (X, Y) => X % g === (Math.floor(Y / g) % 2) * (g >> 1) && Y % g === 0;
    for (let Y = Math.max(0, Y0); Y <= Math.min(b.h - 1, Y1); Y++) for (let X = Math.max(0, X0); X <= Math.min(b.w - 1, X1); X++) {
      const i = Y * b.w + X; if (!piel.has(b.d[i])) continue; const [u, v] = H.inv((X + 0.5) / q, (Y + 0.5) / q);
      if (barbita && v > 2.6 && u > 0.3 && v < 7 && !(u > 3.6 && v > 3.4 && v < 4.6)) { if (punto(X, Y)) b.d[i] = (X * 3 + Y) % 7 === 0 ? tb2 : tb; continue; }
      if (u > 1.6 && u < 4.8 && v > 0.2 && v < 1.0) { b.d[i] = luzP; continue; } // pómulo con luz cálida
      if (u > 1.2 && u < 4.4 && v > 1.7 && v < 2.5) b.d[i] = medio; // sombra bajo el pómulo
      if (def.mujer && u > 2.2 && u < 4.2 && v > 0.9 && v < 2.2 && (X + Y) % 2 === 0) b.d[i] = rgba32('#e8907e'); // rubor
    }
  }
  // --- oreja: hélice y sombra interna
  { const [ox, oy] = F(-1.0, 0.6); const r = Math.max(o(2), R(1.1 * kq)); for (let j = -r; j <= r; j++) b.f(ox + R(Math.sqrt(Math.max(0, r * r - j * j)) * 0.4) - u1, oy + j, sombraP); caja(ox, oy, u1, o(2), labio); }
  // --- ojo
  const ew = Math.max(o(5), R(2.1 * kq)), eh = Math.max(o(3), R(1.25 * kq));
  const [EX, EY] = F(2.2, -1.9);
  const ceja = (incl, grosor = 2) => { const L = ew + o(3), gr = o(grosor); for (let i = 0; i < L; i++) { const yy = R(EY - o(3) - incl * (i / L - 0.5) * 3.2 * sq); caja(EX - o(2) + i, yy, 1, gr, cc); } caja(EX - o(2), R(EY - o(3) + incl * 1.6 * sq) + gr, u1, u1, cc); };
  if (def.lentes && cara !== 'ko') { caja(EX - o(3), EY - o(2), ew + o(6), eh + o(3), rgba32('#141418')); caja(EX - u1, EY - u1, ew + o(2), eh + u1, rgba32('#2a3240')); caja(EX + ew - u1, EY - u1, o(2), u1, rgba32('#9ab0c8')); put(EX, EY + eh - u1, rgba32('#4a5a6a')); caja(EX - o(6), EY - u1, o(4), u1, rgba32('#141418')); ceja(1.2); }
  else if (cara === 'dolor' || cara === 'ko') {
    if (cara === 'ko') { caja(EX, EY + u1, ew, u1, neg); put(EX + u1, EY, neg); put(EX + ew - o(2), EY + o(2), neg); }
    else { for (let i = 0; i < ew; i++) caja(EX + i, EY + R(Math.abs(i - ew / 2) * 0.5), 1, u1, neg); caja(EX, EY + eh - u1, ew, u1, sombraP); } // ojo apretado
    ceja(cara === 'dolor' ? -1.3 : 0);
  } else if (cara === 'feliz') { for (let i = 0; i < ew; i++) caja(EX + i, EY + u1 - R(Math.sin(i / (ew - 1) * PI) * 1.6 * sq), 1, u1, neg); ceja(-0.4); }
  else {
    const enojo = cara === 'enojo' || cara === 'grito' || def.ceno;
    caja(EX, EY, ew, eh, bl); caja(EX, EY + eh - u1, ew, u1, rgba32('#d8c8c0')); // blanco del ojo
    const iw = Math.max(o(2), R(ew * 0.45)); caja(EX + ew - iw, EY, iw, eh, ojo); put(EX + ew - iw, EY, brillo); // iris y brillo
    caja(EX - u1, EY - u1, ew + o(2), u1, neg); put(EX + ew + u1, EY, neg); // párpado superior
    if (enojo) { caja(EX, EY, ew - u1, u1, neg); put(EX + ew - o(2), EY + u1, neg); } // párpado caído
    caja(EX, EY + eh, ew, u1, sombraP); // ojera
    if (def.pestanas) { put(EX + ew + u1, EY - o(2), neg); put(EX + ew + o(2), EY - u1, neg); }
    ceja(enojo ? 1.5 : 0.1, def.mujer ? 1 : 2);
  }
  // --- nariz: fosa, sombra debajo y brillo en el tabique
  if (!def.bigote) { const [nx, ny] = F(6.0, 1.9); put(nx, ny, labio); put(nx - u1, ny, sombraP); const [sx2, sy2] = F(5.6, 2.6); caja(sx2 - u1, sy2, o(3), u1, sombraP); }
  { const [lx, ly] = F(6.4, 0.2); caja(lx, ly - u1, u1, o(2), luzP); }
  // --- boca
  const [MX, MY] = F(4.0, 4.0); const mw = Math.max(o(4), R(2.2 * kq));
  if (cara === 'grito' || cara === 'dolor') { const mh = Math.max(o(4), R(1.9 * kq)); caja(MX, MY - u1, mw + u1, mh, boca); caja(MX + u1, MY - u1, mw - u1, u1, dientes); caja(MX + u1, MY + mh - o(3), mw - o(2), o(2), lengua); if (cara === 'dolor') caja(MX + u1, MY + mh - o(2), mw - u1, u1, dientes); caja(MX - u1, MY - o(2), mw + o(2), u1, labio); }
  else if (cara === 'feliz') { for (let i = 0; i <= mw; i++) caja(MX + i, MY + u1 - R(Math.sin(i / mw * PI) * -1.2 * sq), 1, u1, boca); caja(MX + u1, MY, mw - u1, u1, dientes); put(MX - u1, MY - u1, labio); }
  else if (cara === 'ko') { caja(MX + u1, MY, o(3), o(3), boca); put(MX + o(2), MY + u1, lengua); }
  else { caja(MX, MY, mw, u1, labio); caja(MX + u1, MY + u1, mw - o(2), u1, labioC); if (def.ceno) put(MX - u1, MY + u1, labio); put(MX + mw, MY - u1, labio); }
  // --- tatuaje en el cuello (el del buzo gris)
  if (def.tatuajes) { const tc = rgba32('#3a4a6a'); const [tx, ty] = F(0.4, 8.6); put(tx, ty, tc); put(tx + u1, ty + u1, tc); put(tx + o(2), ty, tc); put(tx + u1, ty + o(2), tc); put(tx - u1, ty + o(2), tc); }
}

// tres rayas finas a lo largo de un tramo (pantalón/campera deportiva, sin marcas)
function tresRayas(b, x0, y0, x1, y1, c, sep = 1) { const L = Math.hypot(x1 - x0, y1 - y0) || 1; const nx = -(y1 - y0) / L, ny = (x1 - x0) / L; for (const o of [-sep, 0, sep]) b.linea(x0 + nx * o, y0 + ny * o, x1 + nx * o, y1 + ny * o, c); }
// ---------- BRAZOS ----------
// J = articulaciones en pantalla (hombro S, codo E, muñeca W) resueltas por el esqueleto
function brazo(b, def, J, p, frente, mano) {
  const A = def.arr, t = A.tipo;
  const [sx, sy] = J.S, [ex, ey] = J.E, [hx, hy] = J.W;
  const a1 = Math.atan2(ex - sx, ey - sy), a = Math.atan2(hx - ex, hy - ey);
  const f = frente ? 1 : 0.82;
  const oscura = OSCURAS.has(col(A.c1));
  const piel = col(tono(def.piel, f)), tela = col(tono(A.c1, f)), mangaCol = A.manga ? col(tono(A.manga, f)) : tela;
  const bx = (t2) => [sx + (ex - sx) * t2, sy + (ey - sy) * t2], fx = (t2) => [ex + (hx - ex) * t2, ey + (hy - ey) * t2];
  const wU = p.wArmU, wL = p.wArmL;
  const brazoPts = [[sx, sy], bx(0.45), [ex, ey]], brazoW = [wU * (frente ? 1.12 : 0.98), wU * 1.04, wU * 0.82];
  const anteb = [[ex, ey], fx(0.35), fx(0.92)], antebW = [wL * 0.9, wL * 1.04, wL * 0.74];
  if (t === 'musculosa') { miembro(b, brazoPts, brazoW, piel); miembro(b, anteb, antebW, piel); b.disco(sx, sy, wU * 0.62, piel); }
  else if (t === 'camiseta') {
    miembro(b, brazoPts, brazoW, piel); miembro(b, anteb, antebW, piel);
    const m1 = bx(0.62); b.seg(sx, sy, m1[0], m1[1], wU * 1.3, wU * 1.22, mangaCol); // manga corta
    // puño y hombro de la manga: bandas DENTRO de la manga (recolor por la posición a lo largo del húmero), nunca un disco encima
    if (A.puno || A.hombros) { const L2b = (ex - sx) ** 2 + (ey - sy) ** 2 || 1, pu = A.puno && col(tono(A.puno, f)), ho = A.hombros && col(tono(A.hombros, f));
      recolor(b, mangaCol, (x, y) => { const tt = ((x + 0.5 - sx) * (ex - sx) + (y + 0.5 - sy) * (ey - sy)) / L2b; return pu && tt > 0.53 ? pu : ho && tt < 0.2 ? ho : 0; }); }
  } else {
    const ancho = t === 'buzo' ? 1.07 : 1.03; // manga: ancha en el hombro, se afina hacia el puño (no un tubo)
    miembro(b, brazoPts, [wU * (frente ? 1.14 : 1.0) * ancho, wU * 1.04 * ancho, wU * 0.86 * ancho], tela); miembro(b, [[ex, ey], fx(0.35), fx(0.8)], [wL * 0.98 * ancho, wL * 0.98 * ancho, wL * 0.84 * ancho], tela);
    const p0 = fx(0.76), p1 = fx(0.9); b.seg(p0[0], p0[1], p1[0], p1[1], wL * 0.84, wL * 0.8, col(tono(A.c1, f * (oscura ? 1.35 : 0.72)))); // puño
    const pl = col(tono(A.c1, f * 0.62)); const c0 = bx(0.92), c1 = fx(0.1); if (!oscura) b.linea(c0[0] + C(a1) * 1.4, c0[1] - S(a1) * 1.4, c1[0] + C(a) * 1.4, c1[1] - S(a) * 1.4, pl); // pliegue del codo
    if (A.raya) { const rc = col(tono(A.raya, f)); tresRayas(b, sx, sy, ex, ey, rc); tresRayas(b, ex, ey, p0[0], p0[1], rc); }
    if (!oscura) { const fo = col(tono(A.c1, f * 0.7)); const q0 = fx(0.45), q1 = fx(0.62); b.linea(q0[0] - C(a) * 2, q0[1] + S(a) * 2, q1[0] + C(a) * 1, q1[1] - S(a) * 1, fo); const r0 = bx(0.3); b.linea(r0[0] - C(a1) * 2.5, r0[1] + S(a1) * 2.5, r0[0] + S(a1) * 3, r0[1] + C(a1) * 3, fo); } // pliegues de la manga
  }
  if (def.tatuajes && frente) { const m = fx(0.9); const tc = col('#3a4a6a'); b.pf(m[0] + 0.5, m[1], tc); b.pf(m[0], m[1] + 0.5, tc); b.pf(m[0] + 1, m[1] + 0.5, tc); }
  if (def.tatuaje && frente && (t === 'musculosa' || t === 'camiseta')) { const m = bx(0.62); const tc = col('#3a4a6a'); b.px(Math.round(m[0]), Math.round(m[1]), tc); b.px(Math.round(m[0]) + 1, Math.round(m[1]) - 1, tc); b.px(Math.round(m[0]) - 1, Math.round(m[1]) + 1, tc); b.px(Math.round(m[0]) + 1, Math.round(m[1]) + 1, tc); }
  // mano
  const dx = S(a), dy = C(a), mw = Math.max(5, wL * 0.95);
  if (mano === 'abierta') { // palma, cuatro dedos y pulgar
    b.seg(hx, hy, hx + dx * 2.4, hy + dy * 2.4, mw * 0.95, mw * 0.85, piel);
    const nx = C(a), ny = -S(a); for (let i = 0; i < 4; i++) { const o = (i - 1.5) * mw * 0.19, l = [3.0, 3.5, 3.3, 2.7][i]; const bx0 = hx + dx * 2.2 + nx * o, by0 = hy + dy * 2.2 + ny * o; b.seg(bx0, by0, bx0 + dx * l + nx * o * 0.25, by0 + dy * l + ny * o * 0.25, 1.35, 1.1, piel); }
    b.seg(hx + dx * 0.8 + nx * mw * 0.42, hy + dy * 0.8 + ny * mw * 0.42, hx + dx * 2.4 + nx * mw * 0.85, hy + dy * 2.4 + ny * mw * 0.85, 1.5, 1.2, piel); }
  else { b.seg(hx - dx * 0.5, hy - dy * 0.5, hx + dx * 2.2, hy + dy * 2.2, mw * 1.12, mw * 1.08, piel); }
  return [hx, hy, a];
}
// nudillos, dedos y pulgar en subpíxeles (después del sombreado)
function detalleMano(b, def, m, mano) { const [hx, hy, a] = m; const q = b.q; const c = rgba32(tono(def.piel, 0.6)), luz = rgba32(tono(def.piel, 1.18)); const dx = S(a), dy = C(a), nx = C(a), ny = -S(a); if (q < 2) return;
  const P = (u, v) => [Math.floor((hx + dx * u + nx * v) * q), Math.floor((hy + dy * u + ny * v) * q)];
  if (mano === 'abierta') { const mw = 5.5; for (let i = 0; i < 3; i++) { const o = (i - 1) * mw * 0.19; for (let u = 2.6; u < 4.6; u += 0.5) { const [X, Y] = P(u, o); if (b.d[Y * b.w + X]) b.f(X, Y, c); } } const [tx, ty] = P(1.2, 2.4); b.f(tx, ty, luz); return; }
  for (let i = -2; i <= 2; i++) { const [X, Y] = P(2.6, i * 0.6); b.f(X, Y, i % 2 ? c : luz); } // nudillos
  for (let i = -1; i <= 1; i++) { const [X, Y] = P(1.6, i * 1.1 + 0.4); b.f(X, Y, c); const [X2, Y2] = P(2.0, i * 1.1 + 0.4); b.f(X2, Y2, c); } // dedos cerrados
  const [tx, ty] = P(0.6, 2.2); b.f(tx, ty, luz); const [t2x, t2y] = P(1.2, 1.8); b.f(t2x, t2y, c); } // pulgar

// ---------- PIERNAS Y CALZADO ----------
// J = articulaciones en pantalla (cadera H, rodilla K, tobillo A) resueltas por el esqueleto
function pierna(b, def, J, p, frente) {
  const B = def.aba, f = frente ? 1 : 0.8, oscura = OSCURAS.has(col(B.c1));
  const [hx, hy] = J.H, [kx, ky] = J.K, [fx, fy] = J.A;
  const a1 = Math.atan2(kx - hx, ky - hy), a = Math.atan2(fx - kx, fy - ky);
  const tx = (t) => [hx + (kx - hx) * t, hy + (ky - hy) * t], sx = (t) => [kx + (fx - kx) * t, ky + (fy - ky) * t];
  const back = [-C(a), S(a)]; // dirección "atrás" de la canilla (pantorrilla)
  const cal = sx(0.32); const calf = [cal[0] + back[0] * 0.9, cal[1] + back[1] * 0.9];
  const tela = col(tono(B.c1, f)), piel = col(tono(def.piel, f));
  const muslo = [[hx, hy], tx(0.5), [kx, ky]], musloW = [p.wThigh, p.wThigh * 0.98, p.wShin * 1.05];
  const canilla = [[kx, ky], calf, [fx, fy]], canW = [p.wShin, p.wShin * 1.1, p.wShin * 0.72];
  if (B.tipo === 'short') {
    miembro(b, muslo, musloW, piel); miembro(b, canilla, canW, piel);
    const s1 = tx(0.6); b.seg(hx, hy, s1[0], s1[1], p.wThigh * 1.06, p.wThigh * 1.08, tela);
    if (B.raya) { const o = [-C(a1) * p.wThigh * 0.3, S(a1) * p.wThigh * 0.3]; b.linea(hx + o[0], hy + o[1], s1[0] + o[0], s1[1] + o[1], col(tono(B.raya, f))); }
    const m0 = sx(0.8), m1 = sx(0.95); b.seg(m0[0], m0[1], m1[0], m1[1], p.wShin * 0.85, p.wShin * 0.8, col(tono('#f2f2f2', f))); // medias
  } else {
    const holgado = B.tipo === 'deportivo' ? 1.03 : B.tipo === 'calza' ? 0.92 : 1.0;
    miembro(b, muslo, musloW.map((w) => w * holgado), tela); miembro(b, canilla, canW.map((w, i) => w * (i === 2 ? (B.tipo === 'jean' || B.tipo === 'vestir' ? 1.16 : 1.04) : holgado)), tela);
    const pl = col(tono(B.c1, f * 0.58));
    if (!oscura) { const bx2 = kx + C(a1) * 1.5, by2 = ky - S(a1) * 1.5; b.linea(bx2 - S(a1) * 2, by2 - C(a1) * 2, bx2 + S(a) * 1.5, by2 + C(a) * 1.5, pl); } // rodilla
    if (B.tipo === 'deportivo') { const c0 = sx(0.86); b.seg(c0[0], c0[1], fx, fy, p.wShin * 0.82, p.wShin * 0.78, col(tono(B.c1, f * (oscura ? 1.3 : 0.72)))); } // puño elástico
    if (B.tipo === 'jean') { const m = tx(0.3); b.px(Math.round(m[0] + C(a1) * 2), Math.round(m[1] - S(a1) * 2), col(tono(B.c1, 1.3))); const r0 = sx(0.85); b.linea(r0[0] - C(a) * 3, r0[1] + S(a) * 3, r0[0] + C(a) * 3, r0[1] - S(a) * 3, col(tono(B.c1, 1.2))); }
    if (B.tipo === 'vestir') { const c0 = tx(0.1), c1 = sx(0.9); b.linea(c0[0] + C(a1) * 1.5, c0[1] - S(a1) * 1.5, kx + C(a1) * 1.5, ky - S(a1) * 1.5, col(tono(B.c1, 1.35))); b.linea(kx + C(a) * 1.2, ky - S(a) * 1.2, c1[0] + C(a) * 1.2, c1[1] - S(a) * 1.2, col(tono(B.c1, 1.35))); }
    if (B.raya) { const rc = col(tono(B.raya, f)); const e2 = sx(B.tipo === 'deportivo' ? 0.84 : 0.95); if (B.tipo === 'deportivo') { tresRayas(b, hx, hy, kx, ky, rc); tresRayas(b, kx, ky, e2[0], e2[1], rc); } else { b.linea(hx, hy, kx, ky, rc); b.linea(kx, ky, e2[0], e2[1], rc); } }
    if (!oscura) { const fo = col(tono(B.c1, f * 0.66)), fl = col(tono(B.c1, f * 1.2)); // pliegues (en telas negras se ven como rayones: no): rodilla y tela amontonada en el tobillo
      for (const tt of [0.62, 0.74]) { const c0 = sx(tt); b.linea(c0[0] - C(a) * 3, c0[1] + S(a) * 3, c0[0] + C(a) * 2 + S(a) * 1.5, c0[1] - S(a) * 2 + C(a) * 1.5, fo); }
      const t0 = tx(0.72); b.linea(t0[0] + C(a1) * 3, t0[1] - S(a1) * 3, t0[0] - C(a1) * 1 + S(a1) * 2, t0[1] + S(a1) * 1 + C(a1) * 2, fo);
      const t1 = tx(0.35); b.linea(t1[0] - C(a1) * 3.5, t1[1] + S(a1) * 3.5, t1[0] - C(a1) * 1, t1[1] + S(a1) * 1 + 1.5, fl); }
  }
  return [fx, fy, a];
}
function calzado(b, def, fx, fy, a, frente) {
  const Z = def.cal, f = frente ? 1 : 0.86, e = def.escala;
  const ux = C(a), uy = -S(a), vx = -S(a), vy = -C(a); // u adelante, v arriba
  const Pt = (u, v) => [fx + (ux * u + vx * v) * e, fy + (uy * u + vy * v) * e];
  const c1 = col(tono(Z.c1, f)), c2 = col(tono(Z.c2, f)), su = col(tono(Z.suela, f));
  const loc = (x, y) => { const dx = x + 0.5 - fx, dy = y + 0.5 - fy; return [(dx * ux + dy * uy) / e, (dx * vx + dy * vy) / e]; };
  if (Z.tipo === 'ojotas') {
    b.poli([[-3.6, -2.6], [9.6, -2.6], [10.2, -1.2], [8.8, 0.6], [4.0, 1.6], [0.6, 2.6], [-3.0, 1.2]].map(([u, v]) => Pt(u, v)), col(tono(def.piel, f)));
    b.poli([[-4.2, -3.8], [10.6, -3.8], [10.8, -2.6], [-4.2, -2.6]].map(([u, v]) => Pt(u, v)), su);
    const [a0, b0] = Pt(5.2, -1.0), [a1, b1] = Pt(2.0, 1.8), [a2, b2] = Pt(0.6, -1.6); b.linea(a0, b0, a1, b1, c2); b.linea(a1, b1, a2, b2, c2);
    return;
  }
  const L = Z.tipo === 'zapato' ? 10.4 : 10;
  const alto = Z.tipo === 'bota' ? 5.4 : Z.tipo === 'zapato' ? 2.2 : 3.4;
  b.poli([[-3.8, -3.4], [L, -3.4], [L + 0.6, -1.6], [L - 1.2, 0.6], [L - 4.8, 1.8], [1.6, alto], [-2.4, alto], [-4.0, 0.8]].map(([u, v]) => Pt(u, v)), c1);
  const suOsc = col(tono(Z.suela, f * 0.62)), punta = col(tono(Z.c1, f * 1.12)), lin = col(tono(Z.suela, f * 0.8));
  recolor(b, c1, (x, y) => { const [u, v] = loc(x, y);
    if (v < -2.9) return suOsc;                          // pisada
    if (v < -2.1) return Math.abs(v + 2.5) < 0.18 ? lin : su; // entresuela con línea
    if (Z.tipo === 'zapa') { if (u < -2.2 && v > -2.1) return c2; // talón
      if (v < -0.9 && u > 2.2 && u < L - 2.4) return c2;      // refuerzo lateral (dos tonos, sin logo)
      if (u > L - 2.6 && v < 0.2) return punta; }             // puntera
    if (Z.tipo === 'bota' && v > alto - 1.6) return c2; return 0; });
}
function detalleCalzado(b, def, fx, fy, a) { const Z = def.cal; if (Z.tipo !== 'zapa' && Z.tipo !== 'zapato' && Z.tipo !== 'bota') return; const q = b.q, e = def.escala, ux = C(a), uy = -S(a), vx = -S(a), vy = -C(a); if (q < 2) return;
  const P2 = (u, v) => [Math.floor((fx + (ux * u + vx * v) * e) * q), Math.floor((fy + (uy * u + vy * v) * e) * q)];
  if (Z.tipo === 'zapato') { const [x, y] = P2(L2(), 0); b.f(x, y, rgba32('#c8b8b0')); b.f(x - 1, y, rgba32('#8a7a70')); return; }
  const blanco = Z.c1 === '#f2f2f2' || Z.c1 === '#f4f4f4' || Z.c1 === '#ececec';
  const lc = rgba32(blanco ? '#9aa0b0' : '#f2f2f2'), sombra = rgba32(tono(Z.c1, 0.55));
  // cordones cruzados sobre el empeine
  for (let i = 0; i < 4; i++) { const u = 1.4 + i * 1.25, v = 2.5 - i * 0.55; const [x, y] = P2(u, v); b.f(x, y, lc); b.f(x + 1, y + 1, lc); b.f(x + 1, y, sombra); }
  // brillo en la puntera y ojal
  const [px2, py2] = P2(Z.tipo === 'bota' ? 8 : 8.4, 0.6); b.f(px2, py2, rgba32('#ffffff')); b.f(px2 + 1, py2, rgba32(tono(Z.c1, 1.3)));
}
function L2() { return 8.6; }

// ---------- TORSO ----------
// el tronco se arma con las secciones del esqueleto (volumen real en 3/4: pecho, panza, espalda), no con una plancha de perfil
const ln = (b, p, q, c) => b.linea(p[0], p[1], q[0], q[1], c);
function pelvis(b, def, E) { poliSec(b, E, -0.22, 0.32, col(def.aba.c1)); }
function torso(b, def, E) {
  const A = def.arr, t = A.tipo, cm = E.cm, e = cm.e, hem = HEM[t] ?? 0.05;
  const base = col(A.c1), d = (f) => col(tono(A.c1, f)), lc = E.loc;
  // cuello (piel), con el grosor del tipo de cuerpo
  { const n0 = E.sec(0.97).c, n1 = E.NT; b.seg(n0[0], n0[1], n1[0], n1[1], cm.wNeck, cm.wNeck * 0.94, col(tono(def.piel, 0.86))); }
  // capucha caída del buzo (detrás del cuello)
  if (t === 'buzo' && def.cab.tipo !== 'capucha') { const s = E.sec(1.03); const h0 = E.T(1.03, s.bk * 0.62); b.elipse(h0[0], h0[1], 5.0 * e, 3.8 * e, col(A.c2 || tono(A.c1, 1.1))); }
  if (t === 'musculosa') { poliSec(b, E, 0.62, 1.07, col(def.piel)); poliSec(b, E, hem, 0.8, base);
    for (const lf of [0.5, -0.45]) { const p0 = E.S3(0.78, lf), p1 = E.S3(1.04, lf * 0.8); b.seg(p0[0], p0[1], p1[0], p1[1], 2.8 * e, 2.4 * e, base); } }
  else poliSec(b, E, hem, 1.07, base);
  if (t === 'camiseta' || t === 'musculosa') {
    const c2 = A.c2 ? col(A.c2) : 0, ancho = Math.max(2, Math.round(2.4 * e));
    recolor(b, base, (x, y) => { const [tt, s] = lc(x, y);
      if (A.patron === 'rayas' && Math.floor((s + 200) / ancho) % 2) return c2;
      if (A.patron === 'banda' && Math.abs(s + (tt - 0.5) * E.Ls * 0.95) < 3.2 * e) return c2;
      if (A.ribete && tt < hem + 0.07) return col(A.ribete);
      if (A.cuello && tt > 1.01) return col(A.cuello);
      return 0; });
    if (A.cuello) { const q0 = E.S3(1.04, 0.5), q1 = E.S3(0.92, 0.02), q2 = E.S3(1.04, -0.45); ln(b, q0, q1, col(A.cuello)); ln(b, q1, q2, col(A.cuello)); }
  } else if (t === 'buzo') {
    recolor(b, base, (x, y) => { const [tt, s] = lc(x, y); if (tt < hem + 0.08) return d(0.78); if (tt > hem + 0.1 && tt < 0.36 && s > E.sAt(tt, 0.55) && s < E.sAt(tt, -0.3)) return d(0.86); return 0; }); // ruedo y bolsillo canguro
    ln(b, E.S3(0.36, 0.55), E.S3(0.36, -0.3), d(0.62));
    const cord = col(A.acento || '#e8e8e8'); for (const lf of [0.2, -0.12]) ln(b, E.S3(1.0, lf), E.S3(0.78, lf), cord); // cordones
  } else if (t === 'campera') {
    recolor(b, base, (x, y) => { const [tt] = lc(x, y); return tt < hem + 0.07 ? d(0.72) : 0; });
    const z0 = E.S3(hem + 0.05, 0.04), z1 = E.S3(1.04, 0.04); ln(b, z0, z1, d(0.55)); ln(b, [z0[0] + 1 / b.q, z0[1]], [z1[0] + 1 / b.q, z1[1]], d(1.3)); // cierre
    const q0 = E.S3(1.04, 0.8), q1 = E.S3(1.07, -0.55); b.seg(q0[0], q0[1], q1[0], q1[1], 3.0 * e, 3.0 * e, d(1.2)); // cuello alto
    if (A.raya) { const s = E.sec(0.985); ln(b, E.T(0.985, s.bk * 0.92), E.S3(0.985, -0.1), col(A.raya)); } // vivo sobre los hombros
  } else if (t === 'abierta') {
    const rem = col(A.remera); recolor(b, base, (x, y) => { const [tt, s] = lc(x, y); if (tt > hem + 0.06 && s > E.sAt(tt, 0.32) && s < E.sAt(tt, -0.45)) return rem; if (tt < hem + 0.07) return d(0.78); return 0; });
    ln(b, E.S3(hem + 0.06, -0.45), E.S3(1.0, -0.45), d(0.6)); ln(b, E.S3(hem + 0.06, 0.32), E.S3(1.0, 0.32), d(0.6));
  } else if (t === 'saco') {
    const rem = col(A.remera); recolor(b, base, (x, y) => { const [tt, s] = lc(x, y); if (tt > 0.4) { const v = Math.min(1, (tt - 0.4) / 0.62); if (s > E.sAt(tt, 0.34 * v) && s < E.sAt(tt, -0.3 * v)) return rem; } return 0; });
    ln(b, E.S3(1.02, 0.4), E.S3(0.4, 0.03), d(0.58)); ln(b, E.S3(0.86, 0.46), E.S3(0.7, 0.3), d(0.58)); // solapas
    const bt = E.S3(0.3, 0.04); b.px(Math.round(bt[0]), Math.round(bt[1]), col('#e8d27a'));
  }
  if (t !== 'musculosa' && !OSCURAS.has(base)) { const fo = d(0.72), fl = d(1.15); // pliegues de tela: axila → cintura y tela amontonada arriba del ruedo
    ln(b, E.S3(0.8, -0.78), E.S3(0.52, -0.45), fo); ln(b, E.S3(0.7, -0.9), E.S3(0.54, -0.8), fo);
    ln(b, E.S3(hem + 0.12, 0.6), E.S3(hem + 0.16, 0.05), fo); ln(b, E.S3(0.62, 0.78), E.S3(0.46, 0.4), fl); }
  const derecho = Math.abs(E.lean) < 0.7;
  if (A.letras && derecho) { const fp = Math.max(1, b.q - 1), w = ((A.letras.length * 4 - 1) * fp) / b.q; const c = E.S3(0.56, 0.28); mini(b, A.letras, c[0] - w / 2, c[1] - (2.5 * fp) / b.q, col(A.acento), true, fp); }
  if (A.numero && derecho) { const fp = b.q, w = ((A.numero.length * 4 - 1) * fp) / b.q; const c = E.S3(0.62, 0.3); mini(b, A.numero, c[0] - w / 2, c[1] - 2.5, col(A.numCol || '#fff'), true, fp); } // centrado en el pecho, nunca fuera de la tela
  if (def.cadena) { const c0 = E.S3(1.03, 0.55), c1 = E.S3(0.8, 0.04), c2 = E.S3(1.03, -0.5); ln(b, c0, c1, col('#f0c840')); ln(b, c1, c2, col('#f0c840')); }
}

// ---------- COMPOSICIÓN ----------
const tmp = new Map();
function bufTmp(w, h, q) { const k = w + 'x' + h + 'x' + q; let b = tmp.get(k); if (!b) { b = new Buf(w, h, q); tmp.set(k, b); } b.limpiar(); return b; }
// Contorno selectivo: donde una capa se apoya sobre otra, la línea es un tono oscuro del color de adelante (en telas negras,
// una costura gris); el negro queda sólo para la silueta exterior. Así brazos, piernas y torso se leen como volúmenes
// conectados y no como recortes pegados con un borde negro cada uno.
const COSTURA = new Map();
function costura(c) { let v = COSTURA.get(c); if (v) return v; const r = c & 255, g = (c >>> 8) & 255, bl = (c >>> 16) & 255; const luma = 0.3 * r + 0.59 * g + 0.11 * bl;
  const m = luma < 70 ? [r + (118 - r) * 0.5, g + (116 - g) * 0.5, bl + (132 - bl) * 0.5] : [r * 0.42 + 27 * 0.25, g * 0.42 + 18 * 0.25, bl * 0.42 + 32 * 0.25];
  v = (255 << 24 | Math.round(m[2]) << 16 | Math.round(m[1]) << 8 | Math.round(m[0])) >>> 0; COSTURA.set(c, v); return v; }
function capa(frame, dibujar) { const b = bufTmp(frame.lw, frame.lh, frame.q); const r = dibujar(b); b.pulir(); b.sombrearQ();
  if (b.x1 >= 0) { const { w, h, d } = b, F = frame.d; const [X0, Y0, X1, Y1] = b.caja(1); const add = [];
    for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) { const i = y * w + x; if (d[i] || !F[i]) continue;
      const n = (x > 0 && d[i - 1]) || (x < w - 1 && d[i + 1]) || (y > 0 && d[i - w]) || (y < h - 1 && d[i + w]); if (n) add.push(x, y, costura(n)); }
    for (let k = 0; k < add.length; k += 3) b.f(add[k], add[k + 1], add[k + 2]); }
  frame.sobre(b); return r; }

export function dibujarPose(def, pose, w, h, caraDef) {
  const E = esqueleto(def, pose, w, h), cm = E.cm;
  const fr = new Buf(w, h, Q);
  const mano = pose.mano || 'puno', cara = pose.cara || caraDef;
  const out = {};
  const jf = E.brazo(pose.bf, -cm.shJ), jn = E.brazo(pose.bn, cm.shJ), lf = E.pierna(pose.pf, -cm.hipJ), lnr = E.pierna(pose.pn, cm.hipJ);
  // orden de profundidad (3/4): brazo lejano, pierna lejana (+zapa), pelvis + pierna cercana (una sola pieza: sin línea en la ingle),
  // zapa cercana, tronco + cuello, cabeza, brazo cercano
  out.manoB = capa(fr, (b) => brazo(b, def, jf, cm, false, mano));
  capa(fr, (b) => pierna(b, def, lf, cm, false));
  capa(fr, (b) => calzado(b, def, lf.A[0], lf.A[1], lf.ang, false)); detalleCalzado(fr, def, lf.A[0], lf.A[1], lf.ang);
  capa(fr, (b) => { pelvis(b, def, E); pierna(b, def, lnr, cm, true); });
  capa(fr, (b) => calzado(b, def, lnr.A[0], lnr.A[1], lnr.ang, true)); detalleCalzado(fr, def, lnr.A[0], lnr.A[1], lnr.ang);
  TEXTOS = []; capa(fr, (b) => torso(b, def, E)); const textos = TEXTOS; TEXTOS = null;
  const foto = textos.length ? fr.d.slice() : null;
  // cabeza: apoyada sobre el cuello, sigue la inclinación del pecho
  const la = E.incl * (Math.abs(E.lean) > 1 ? 0.95 : 0.6) + (pose.head || 0), k = cm.k;
  const u0 = -1.4, v0 = 4.6; const ccx = E.NT[0] - (C(la) * u0 - S(la) * v0) * k, ccy = E.NT[1] - (S(la) * u0 + C(la) * v0) * k;
  const H = marcoCabeza(ccx, ccy, la, k); H.k = k; H.la = la;
  const gorro = def.cab && def.cab.tipo !== 'nada' && def.cab.tipo !== 'visera';
  if (def.peinado === 'cola' && def.cab.tipo !== 'capucha') { capa(fr, (b) => colaDeCaballo(b, def, H)); }
  if (def.cab.tipo === 'capucha') capa(fr, (b) => sombrero(b, def, H)); // la capucha va detrás de la cara
  capa(fr, (b) => craneo(b, def, H));
  if (def.cab.tipo !== 'capucha') capa(fr, (b) => pelo(b, def, H, gorro));
  if (def.peinado === 'cola' && !gorro) capa(fr, (b) => gomita(b, def, H));
  if (def.cab.tipo !== 'capucha') capa(fr, (b) => sombrero(b, def, H));
  if (E.lean > -1.65) rasgos(fr, def, H, cara);
  out.manoF = capa(fr, (b) => brazo(b, def, jn, cm, true, mano));
  detalleMano(fr, def, out.manoF, mano);
  for (let i = 0; i < fr.q; i++) fr.contorno(NEG); // silueta exterior: 1 píxel del juego (q subpíxeles), parejo en cualquier densidad
  out.cabeza = [ccx, ccy]; out.pies = [E.FX, E.FY]; out.radio = 7.5 * k;
  out.huesos = { cuello: E.NT, cadera: lnr.H, hombroN: jn.S, codoN: jn.E, munecaN: jn.W, hombroF: jf.S, codoF: jf.E, munecaF: jf.W,
    caderaN: lnr.H, rodillaN: lnr.K, tobilloN: lnr.A, caderaF: lf.H, rodillaF: lf.K, tobilloF: lf.A, cabeza: [ccx, ccy] };
  if (foto) out.espejo = textoEspejado(fr, foto, textos);
  return { buf: fr, ...out };
}

// copia del cuadro con los textos dibujados al revés, para que al espejar se lean bien
function textoEspejado(fr, foto, textos) {
  const d = fr.d.slice(), W = fr.w; let cambio = false;
  for (const { x0, y0, w, h, g } of textos) for (let y = y0; y < y0 + h; y++) {
    if (y < 0 || y >= fr.h) continue;
    // color de letra y de tela en esta fila (los más comunes en la foto tomada tras el torso)
    const cl = new Map(), ct = new Map();
    for (let x = x0 - 1; x <= x0 + w; x++) { if (x < 0 || x >= W) continue; const v = foto[y * W + x]; if (!v) continue; const m = g.has(y * 4096 + x) ? cl : ct; m.set(v, (m.get(v) || 0) + 1); }
    const masComun = (m) => { let best = 0, n = -1; for (const [v, k] of m) if (k > n) { n = k; best = v; } return best; };
    const letra = masComun(cl), tela = masComun(ct); if (!letra || !tela) continue;
    for (let x = x0; x < x0 + w; x++) {
      if (x < 0 || x >= W) continue; const i = y * W + x; if (!foto[i] || fr.d[i] !== foto[i]) continue; // vacío o tapado por brazo/pierna
      const xm = 2 * x0 + w - 1 - x; const esN = g.has(y * 4096 + x), esM = g.has(y * 4096 + xm);
      if (esN && !esM) { d[i] = tela; cambio = true; } else if (esM && !esN) { d[i] = letra; cambio = true; }
    }
  }
  if (!cambio) return null; const b = new Buf(fr.lw, fr.lh, fr.q); b.d = d; b.x0 = fr.x0; b.y0 = fr.y0; b.x1 = fr.x1; b.y1 = fr.y1; b.textos = textos; return b;
}
// recorta el cuadro a lo dibujado (menos memoria). Sin copia espejada: se espeja al dibujar;
// si hay texto en el pecho se guarda un parche chico con el texto bien escrito para el lado espejado.
function recortar(r) {
  const b = r.buf, q = b.q; const [x0, y0, x1, y1] = b.caja(1); const w = x1 - x0 + 1, h = y1 - y0 + 1;
  const f = { d: b.aCanvasRec(x0, y0, w, h, false), q, pies: [r.pies[0] * q - x0, r.pies[1] * q - y0], mano: [r.manoF[0] * q - x0, r.manoF[1] * q - y0, r.manoF[2]], parche: null };
  if (r.espejo) { let rx0 = 1e9, ry0 = 1e9, rx1 = -1, ry1 = -1; for (const t of r.espejo.textos) { rx0 = Math.min(rx0, t.x0); ry0 = Math.min(ry0, t.y0); rx1 = Math.max(rx1, t.x0 + t.w - 1); ry1 = Math.max(ry1, t.y0 + t.h - 1); }
    rx0 = Math.max(rx0, x0); ry0 = Math.max(ry0, y0); rx1 = Math.min(rx1, x1); ry1 = Math.min(ry1, y1);
    if (rx1 >= rx0 && ry1 >= ry0) { const pw = rx1 - rx0 + 1, ph = ry1 - ry0 + 1; f.parche = { c: r.espejo.aCanvasRec(rx0, ry0, pw, ph, true), x: w - (rx0 - x0) - pw, y: ry0 - y0 }; } }
  return f;
}
// dibuja un cuadro con los pies en (x, y) (coordenadas del juego), mirando a la derecha (cara>0) o a la izquierda
export function dibujarCuadro(ctx, f, x, y, cara = 1, esc = 1) {
  const s = esc / f.q, w = f.d.width * s, h = f.d.height * s, top = y - f.pies[1] * s;
  if (cara > 0) { ctx.drawImage(f.d, x - f.pies[0] * s, top, w, h); return; }
  const izq = x - (f.d.width - 1 - f.pies[0]) * s; // borde izquierdo del cuadro espejado
  ctx.save(); ctx.translate(izq + w, 0); ctx.scale(-1, 1); ctx.drawImage(f.d, 0, top, w, h); ctx.restore();
  if (f.parche) { const p = f.parche; ctx.drawImage(p.c, izq + p.x * s, top + p.y * s, p.c.width * s, p.c.height * s); }
}
// silueta blanca (destello del golpe), creada la primera vez que se necesita
export function siluetaBlanca(f) { if (f.blanca) return f.blanca; const [cv, x] = lienzo(f.d.width, f.d.height); x.drawImage(f.d, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = '#fff6e0'; x.fillRect(0, 0, cv.width, cv.height); f.blanca = { d: cv, q: f.q, pies: f.pies, parche: null }; return f.blanca; }

// Retrato para el HUD: el mismo personaje (con la ropa elegida) dibujado en primer plano, cabeza y hombros
export function retrato(def, T = 30) {
  const d2 = Object.assign({}, def, { escala: T / ((7.5 * 2.6 * ALTO) / (CABEZAS_ALTO * 13.6)) }); const { w, h } = tamCuadro(d2);
  const r = dibujarPose(d2, P({ y: -0.05, head: -0.1, lean: 0.03, enc: 0.03, bn: { fk: [0.12, 0.25] }, bf: { fk: [0.1, 0.2] }, pn: [-0.3, 0, 0], pf: [0.3, 0, 0] }), w, h, def.ceno ? 'enojo' : 'normal');
  const q = r.buf.q, lado = T * q; const cx = Math.round((r.cabeza[0] - r.radio * 0.05) * q), cy = Math.round((r.cabeza[1] + r.radio * 0.02) * q);
  return r.buf.aCanvasRec(cx - (lado >> 1), cy - (lado >> 1), lado, lado, false);
}
// depuración (tools/anatomia.html): un cuadro sin recortar + las articulaciones del esqueleto
export function depurarPose(clave, anim, i = 0, variante = 0) { const def = armarDef(clave, variante, null); const { w, h } = tamCuadro(def);
  const r = dibujarPose(def, POSES[anim][Math.min(i, POSES[anim].length - 1)], w, h, def.ceno ? 'enojo' : 'normal'); return { lienzo: r.buf.aCanvas(false), q: r.buf.q, huesos: r.huesos, pies: r.pies, w, h }; }
// si cambió la densidad (rotar el teléfono), devuelve el set regenerado a la densidad nueva
export function vigente(sp) { return !sp || sp.q === Q ? sp : generar(...sp.args); }

// Genera las animaciones de un personaje: {anim: [{d, q, pies, mano, parche}...]}.
// Los cuadros se dibujan A DEMANDA (al pedir una animación por primera vez) y, mientras se juega, de a uno en los ratos
// libres (calentar). Así no se gasta memoria en animaciones que un enemigo nunca usa (con densidad 3 cada set pesa ~2,2× más).
const cacheSp = new Map();
const activos = new Set(); // sets de la partida actual (se calientan en segundo plano)
// lo que cada enemigo usa de verdad (su IA): se calienta sólo eso; lo demás (armas) se dibuja cuando hace falta
const BASE_E = ['quieto', 'camina', 'dolor', 'vuela', 'piso', 'levanta', 'agarrado'];
const USA_ENEMIGO = { buzo: [...BASE_E, 'pina1', 'patada'], mati: [...BASE_E, 'pina1', 'pina2'], cacho: [...BASE_E, 'pina2', 'pina3'], tano: [...BASE_E, 'pina1', 'patada', 'golpe', 'agarra'] };
// ¿la animación ya está dibujada? (si no, se pide en segundo plano)
export function lista(sp, nombre) { if (!sp.parciales[nombre]) return true; pedidos.add(sp); (sp.pedidos || (sp.pedidos = new Set())).add(nombre); return false; }
const pedidos = new Set();
export function claveRopa(r) { return r ? [r.cabeza, r.arriba, r.abajo, r.calzado].join('|') : ''; }
export function generar(clave, variante = 0, ropa = null, soloQuieto = false) {
  const k = Q + ':' + clave + ':' + variante + ':' + claveRopa(ropa) + (soloQuieto ? ':q' : ''); if (cacheSp.has(k)) return cacheSp.get(k);
  const def = armarDef(clave, variante, ropa);
  const { w, h } = tamCuadro(def);
  const caraBase = def.ceno ? 'enojo' : 'normal';
  const anims = {}, parciales = {};
  const cuadro = (nombre, i) => recortar(dibujarPose(def, POSES[nombre][i], w, h, caraBase));
  for (const nombre in POSES) {
    if (soloQuieto && nombre !== 'quieto') continue;
    parciales[nombre] = [];
    Object.defineProperty(anims, nombre, { enumerable: true, configurable: true, get() {
      const p = parciales[nombre]; for (let i = p.length; i < POSES[nombre].length; i++) p.push(cuadro(nombre, i));
      Object.defineProperty(anims, nombre, { value: p, enumerable: true, configurable: true, writable: true }); delete parciales[nombre]; return p; } });
  }
  void anims.quieto; // la de reposo siempre (menús, vestuario)
  const rt = retrato(def, 30); const res = { def, anims, parciales, cuadro, w, h, q: Q, k, args: [clave, variante, ropa, soloQuieto], retrato: rt, retratoChico: soloQuieto ? null : retrato(def, 13) };
  if (cacheSp.size > 40) for (const kk of cacheSp.keys()) { if (kk.endsWith(':q')) { cacheSp.delete(kk); break; } }
  cacheSp.set(k, res); return res;
}
// la partida declara qué sets usa: se liberan los demás (memoria) y se calientan éstos en segundo plano
const JUGADORES_K = ['seba', 'pelado', 'pato'];
export function partida(sets) { const keep = new Set(sets.map((s) => s.k)); for (const [kk, v] of cacheSp) if (!keep.has(kk) && !kk.endsWith(':q') && !JUGADORES_K.includes(v.args[0])) cacheSp.delete(kk); activos.clear(); for (const s of sets) activos.add(s); }
// dibuja cuadros pendientes de los sets activos hasta gastar ~ms milisegundos (como mínimo uno, si hay)
export function calentar(ms) {
  if (!activos.size && !pedidos.size) return 0; const t0 = performance.now(); let n = 0;
  for (const sp of [...pedidos, ...activos]) {
    const jugador = JUGADORES_K.includes(sp.args[0]);
    const orden = jugador ? Object.keys(sp.parciales) : [...(USA_ENEMIGO[sp.args[0]] || BASE_E), ...(sp.pedidos || [])];
    for (const nombre of orden) { const p = sp.parciales[nombre]; if (!p) continue;
      while (p.length < POSES[nombre].length) { p.push(sp.cuadro(nombre, p.length)); n++; if (performance.now() - t0 > ms) return n; }
      void sp.anims[nombre]; }
    pedidos.delete(sp);
  }
  return n;
}
