// Poses del motor de pelea, armadas con el MISMO esqueleto/IK del beat 'em up (sprites.js).
// Cada luchador tiene su diccionario propio: guardia y caminata según su estilo + sus golpes elegidos de la biblioteca.
// Convenciones (ver sprites.js): bn/bf = brazo cercano/lejano ({m:[adelante, arriba]} IK o {fk:[hombro, codo]}),
// pn/pf = pierna cercana/lejana ([x, alza, pie] IK o {fk:[cadera, rodilla, pie]}); y<0 flexiona; alto = pelvis en el aire.
import { P, mezclaPose, POSES } from '../sprites.js';

const S = Math.sin, C = Math.cos, PI = Math.PI;
const B = POSES; // poses del beat 'em up que se reutilizan tal cual (dolor, vuela, piso, levanta, agarrado...)
const at = (a, g, r) => [a, g, mezclaPose(g, r, 0.35), r];

// ---------- guardias por estilo ----------
export const GUARDIAS = {
  alta: { bn: { m: [0.84, 0.1] }, bf: { m: [1.2, 0.2] }, y: -0.38, lean: 0.12, enc: 0.08, head: 0.04 },                                  // boxeo: puños a la cara
  media: { bn: { m: [0.9, -0.18] }, bf: { m: [1.32, -0.02] }, y: -0.3, lean: 0.12, enc: 0.06 },
  baja: { bn: { m: [0.5, -0.9] }, bf: { m: [0.75, -0.8] }, y: -0.2, lean: 0.04, enc: 0.1, head: -0.12, mano: 'abierta' },               // manos abajo, provocador
  abierta: { bn: { m: [0.95, -0.06] }, bf: { m: [1.6, 0.1] }, y: -0.42, lean: 0.06, mano: 'abierta' },                                    // técnico (chef, abogado)
  elegante: { bn: { m: [0.3, -0.6] }, bf: { m: [1.4, 0.14] }, y: -0.22, lean: -0.02, head: -0.12, mano: 'abierta' },                      // una mano a la cintura
  zombi: { bn: { m: [1.75, -0.02] }, bf: { m: [1.9, 0.1] }, y: -0.34, lean: 0.38, enc: 0.14, head: 0.28, mano: 'abierta' },
  pesada: { bn: { m: [1.05, -0.45] }, bf: { m: [1.38, -0.34] }, y: -0.5, lean: 0.24, enc: 0.1, mano: 'abierta', pn: [-0.92, 0, 0], pf: [0.86, 0, 0] },
  militar: { bn: { m: [0.74, 0.02] }, bf: { m: [1.0, 0.12] }, y: -0.2, lean: -0.02, enc: 0, pn: [-0.56, 0, 0], pf: [0.56, 0, 0] },
  borracho: { bn: { m: [0.7, -0.5] }, bf: { m: [1.1, 0.25] }, y: -0.28, lean: -0.08, head: -0.2, mano: 'abierta' },
};
function base(E, o = {}) { const g = GUARDIAS[E.guardia] || GUARDIAS.media; return P(Object.assign({ y: g.y, lean: g.lean + (E.lean || 0), enc: g.enc || 0.06, head: (g.head || 0) + (E.head || 0), bn: g.bn, bf: g.bf, pn: g.pn || [-0.72 * (E.paso || 1), 0, 0], pf: g.pf || [0.72 * (E.paso || 1), 0, 0], mano: g.mano, cara: E.cara || 'enojo' }, o)); }

// ---------- movimiento ----------
function quieto(E) { const amp = E.rebote || 1;
  return [0, 1, 2, 1].map((i) => { const b = base(E); const o = { y: b.y - i * 0.035 * amp, enc: b.enc + i * 0.01 };
    if (E.guardia === 'borracho') { o.x = S(i * 1.6) * 0.16; o.lean = b.lean + S(i * 1.6) * 0.12; o.head = b.head + C(i * 1.6) * 0.12; }
    if (E.guardia === 'zombi') { o.head = b.head + (i - 1) * 0.08; o.bf = { m: [1.9, 0.1 - i * 0.05] }; }
    if (E.guardia === 'alta') { o.pn = [-0.78, i === 2 ? 0.06 : 0, i === 2 ? -0.3 : 0]; }
    return P(Object.assign({}, b, o)); }); }
function caminar(E, corre = false) { const r = [], n = corre ? 6 : 8, b = base(E), lar = (corre ? 1.05 : 0.62) * (E.paso || 1);
  for (let i = 0; i < n; i++) { const th = (i / n) * PI * 2, c = C(th);
    const pie = (ph) => { const x = lar * C(ph), sn = -S(ph), alza = (corre ? 0.75 : 0.42) * Math.max(0, sn); return [x, alza, alza > 0.01 ? (C(ph) < 0 ? -0.55 : 0.22) * sn : 0]; };
    if (corre) r.push(P({ g: 0.45, y: -0.36 - 0.14 * c * c, lean: 0.42 + (E.lean || 0) * 0.5, enc: 0.1, head: -0.12, pn: pie(th), pf: pie(th + PI), bn: { m: [0.7 + 0.5 * c, -0.1 + 0.25 * c] }, bf: { m: [0.9 - 0.5 * c, -0.1 - 0.25 * c] }, mano: 'puno', cara: 'enojo' }));
    else { const sw = E.guardia === 'zombi' ? 0.05 : 0.12; r.push(P(Object.assign({}, b, { g: 0.5, y: b.y + 0.12 - 0.12 * c * c, pn: pie(th), pf: pie(th + PI),
      x: E.guardia === 'borracho' ? S(th) * 0.18 : 0, lean: b.lean + (E.guardia === 'borracho' ? S(th * 2) * 0.1 : 0),
      bn: b.bn.m ? { m: [b.bn.m[0] - sw * c, b.bn.m[1]] } : b.bn, bf: b.bf.m ? { m: [b.bf.m[0] + sw * c, b.bf.m[1]] } : b.bf }))); } }
  return r; }
const salto = (E) => { const b = base(E); return [P({ alto: 2.95, lean: 0.12, pn: { fk: [0.35, -1.7, -0.3] }, pf: { fk: [1.0, -1.75, -0.2] }, bn: b.bn, bf: b.bf, mano: b.mano, cara: 'enojo' }),
  P({ alto: 3.05, lean: 0.2, enc: 0.12, pn: { fk: [0.9, -2.2, -0.3] }, pf: { fk: [1.3, -2.1, -0.2] }, bn: { m: [0.8, 0.3] }, bf: { m: [1.0, 0.36] }, cara: 'enojo' }),
  P({ alto: 2.6, lean: 0.06, pn: { fk: [0.1, -0.5, -0.2] }, pf: { fk: [0.5, -0.7, -0.1] }, bn: b.bn, bf: b.bf, mano: b.mano, cara: 'enojo' })]; };
const agacha = (E) => { const b = base(E); return [P({ y: -1.08, lean: 0.34 + (E.lean || 0) * 0.5, enc: 0.1, head: -0.05, pn: [-0.62, 0, 0], pf: [0.92, 0, 0], bn: { m: [0.85, 0.05] }, bf: { m: [1.15, 0.15] }, mano: b.mano, cara: 'enojo' })]; };
const bloq = () => [P({ y: -0.4, lean: 0.06, g: 0.62, bn: { m: [0.92, 0.3] }, bf: { m: [1.06, 0.36] }, pn: [-0.85, 0, 0], pf: [0.6, 0, 0], cara: 'enojo' })];
const bloqAg = () => [P({ y: -1.05, lean: 0.3, g: 0.62, enc: 0.12, bn: { m: [0.86, 0.16] }, bf: { m: [1.0, 0.22] }, pn: [-0.62, 0, 0], pf: [0.9, 0, 0], cara: 'enojo' })];
const dolorAg = () => [P({ y: -1.0, lean: -0.1, head: -0.3, bn: { fk: [-0.3, 1.2] }, bf: { fk: [-0.5, 1.0] }, pn: [-0.62, 0, 0], pf: [0.9, 0, 0], cara: 'dolor' })];

// ---------- biblioteca de golpes ----------
// cada plantilla: { poses: [a, g, g2, r] | n cuadros, limb: miembro que pega, r: radio del hitbox, y frame data por defecto }
const pr = (o) => P(Object.assign({ cara: 'grito' }, o));
export const TPL = {
  jab: { limb: 'mF', r: 8, ini: 0.05, act: 0.06, rec: 0.11, dmg: 4, poses: (E) => B.pina1 },
  directo: { limb: 'mN', r: 9, ini: 0.09, act: 0.07, rec: 0.18, dmg: 7, poses: () => B.pina2 },
  gancho: { limb: 'mN', r: 11, dash: 110, arco: true, ext: 6, ini: 0.12, act: 0.08, rec: 0.24, dmg: 10, lanza: 330, poses: () => B.pina3 },
  patada: { limb: 'pN', r: 10, ini: 0.12, act: 0.08, rec: 0.24, dmg: 9, poses: () => B.patada },
  golpe: { limb: 'mN', r: 11, ext: 7, ini: 0.17, act: 0.09, rec: 0.42, dmg: 11, poses: () => B.golpe },
  cabezazo: { limb: 'cab', r: 9, ini: 0.12, act: 0.07, rec: 0.22, dmg: 10, poses: () => B.cabezazo },
  pisoton: { limb: 'pN', r: 11, ini: 0.16, act: 0.08, rec: 0.24, dmg: 10, bajo: true, poses: () => B.pisoton },
  martillo: { limb: 'mN', r: 12, ini: 0.18, act: 0.09, rec: 0.28, dmg: 13, alto: true, poses: () => B.tamborOnda },
  palma: { limb: 'mF', r: 11, ini: 0.12, act: 0.08, rec: 0.22, dmg: 9, poses: () => B.empuja.length >= 3 ? [B.empuja[0], B.empuja[1], B.empuja[1], B.empuja[2]] : B.empuja },
  patadaAlta: { limb: 'pN', r: 11, ini: 0.14, act: 0.08, rec: 0.26, dmg: 11, poses: () => at(
    pr({ y: -0.3, lean: -0.05, g: 0.4, pn: { fk: [1.2, -1.9, -0.3] }, pf: [0.2, 0, 0], bn: { m: [0.8, 0.3] }, bf: { m: [1.0, 0.2] }, cara: 'enojo' }),
    pr({ y: -0.14, x: -0.12, lean: -0.6, g: 0.25, head: 0.15, pn: { fk: [2.1, -0.08, -0.5] }, pf: [0.02, 0, 0], bn: { m: [0.6, 0.42] }, bf: { fk: [-0.9, 0.8] } }),
    pr({ y: -0.28, lean: -0.1, pn: { fk: [0.9, -1.6, -0.3] }, pf: [0.2, 0, 0], bn: { m: [0.8, 0.2] }, bf: { m: [1.1, 0.1] }, cara: 'enojo' })) },
  patadaBaja: { limb: 'pN', r: 10, ini: 0.1, act: 0.07, rec: 0.2, dmg: 7, bajo: true, poses: () => at(
    pr({ y: -0.32, lean: 0.1, pn: { fk: [0.7, -1.2, -0.3] }, pf: [0.3, 0, 0], bn: { m: [0.85, 0.1] }, bf: { m: [1.1, 0.15] }, cara: 'enojo' }),
    pr({ y: -0.4, x: -0.06, lean: 0.16, g: 0.4, pn: { fk: [1.2, -0.05, -0.25] }, pf: [0.1, 0, 0], bn: { m: [0.8, 0.2] }, bf: { m: [1.05, 0.24] } }),
    pr({ y: -0.34, lean: 0.1, pn: [-0.4, 0, 0], pf: [0.6, 0, 0], bn: { m: [0.85, 0.05] }, bf: { m: [1.2, 0.1] }, cara: 'enojo' })) },
  jabAg: { limb: 'mF', r: 8, ini: 0.07, act: 0.06, rec: 0.12, dmg: 4, bajo: true, poses: () => at(
    pr({ y: -1.08, lean: 0.36, bn: { m: [0.85, 0.05] }, bf: { m: [0.9, 0.0] }, pn: [-0.62, 0, 0], pf: [0.92, 0, 0], cara: 'enojo' }),
    pr({ y: -1.08, x: 0.1, lean: 0.42, g: 0.6, bn: { m: [0.85, 0.05] }, bf: { m: [2.1, -0.3] }, pn: [-0.62, 0, 0], pf: [0.92, 0, 0] }),
    pr({ y: -1.08, lean: 0.36, bn: { m: [0.85, 0.05] }, bf: { m: [1.15, 0.15] }, pn: [-0.62, 0, 0], pf: [0.92, 0, 0], cara: 'enojo' })) },
  barridaAg: { limb: 'pN', r: 11, ini: 0.12, act: 0.1, rec: 0.3, dmg: 9, bajo: true, tumba: true, poses: () => at(
    pr({ y: -1.15, lean: 0.5, g: 0.7, bn: { m: [0.6, -0.9] }, bf: { m: [0.9, -0.85] }, pn: [-0.6, 0, 0], pf: [0.9, 0, 0], cara: 'enojo', mano: 'abierta' }),
    pr({ alto: 0.95, lean: 0.62, g: 0.45, bn: { m: [0.5, -1.35] }, bf: { m: [0.9, -1.3] }, pn: { fk: [1.56, -0.04, -0.6] }, pf: { fk: [-0.5, -2.3, -0.3] }, mano: 'abierta' }),
    pr({ y: -1.1, lean: 0.45, bn: { m: [0.7, -0.6] }, bf: { m: [1.0, -0.5] }, pn: [-0.6, 0, 0], pf: [0.9, 0, 0], cara: 'enojo' })) },
  barrida: { limb: 'pN', r: 11, ini: 0.12, act: 0.16, rec: 0.3, dmg: 9, bajo: true, tumba: true, dash: 110, poses: () => B.barrida },
  codazo: { limb: 'cN', r: 10, ini: 0.09, act: 0.07, rec: 0.2, dmg: 8, poses: () => at(
    pr({ y: -0.34, lean: -0.05, g: 0.7, bn: { fk: [1.5, 2.5] }, bf: { m: [1.0, 0.2] }, cara: 'enojo' }),
    pr({ y: -0.42, x: 0.22, lean: 0.38, g: 0.25, pn: [-0.95, 0.12, -0.4], pf: [0.52, 0, 0], bn: { fk: [1.95, 2.45] }, bf: { m: [0.6, 0.2] } }),
    pr({ y: -0.38, lean: 0.2, bn: { m: [0.8, 0.1] }, bf: { m: [1.1, 0.1] }, cara: 'enojo' })) },
  cachetazo: { limb: 'mN', r: 10, ini: 0.1, act: 0.07, rec: 0.2, dmg: 7, poses: () => at(
    pr({ y: -0.3, lean: -0.12, g: 0.75, bn: { fk: [-0.6, 0.5] }, bf: { m: [1.0, 0.2] }, mano: 'abierta', cara: 'enojo' }),
    pr({ y: -0.38, x: 0.16, lean: 0.3, g: 0.3, pn: [-0.95, 0.12, -0.4], pf: [0.52, 0, 0], bn: { m: [2.05, 0.45] }, bf: { m: [0.6, -0.2] }, mano: 'abierta' }),
    pr({ y: -0.34, lean: 0.2, bn: { m: [1.7, 0.2] }, bf: { m: [0.7, -0.2] }, mano: 'abierta', cara: 'feliz' })) },
  zarpa: { limb: 'mN', r: 12, ini: 0.13, act: 0.09, rec: 0.24, dmg: 10, poses: () => at(
    pr({ y: -0.32, lean: 0.1, head: 0.2, bn: { fk: [2.7, 0.7] }, bf: { m: [1.6, 0.1] }, mano: 'abierta', cara: 'enojo' }),
    pr({ y: -0.46, x: 0.2, lean: 0.62, enc: 0.15, head: 0.35, pn: [-1.0, 0.1, -0.4], pf: [0.6, 0, 0], bn: { m: [1.95, -0.55] }, bf: { m: [1.4, 0.2] }, mano: 'abierta' }),
    pr({ y: -0.4, lean: 0.45, head: 0.3, bn: { m: [1.6, -0.7] }, bf: { m: [1.7, 0.0] }, mano: 'abierta', cara: 'enojo' })) },
  giroPuno: { limb: 'mF', r: 10, ini: 0.15, act: 0.08, rec: 0.24, dmg: 11, poses: () => at(
    pr({ y: -0.32, g: 1.05, lean: 0.1, bn: { m: [0.6, 0.0] }, bf: { m: [0.3, 0.2] }, cara: 'enojo' }),
    pr({ y: -0.36, x: 0.12, g: 0.2, lean: 0.12, pn: [-0.95, 0.12, -0.4], pf: [0.6, 0, 0], bn: { m: [0.4, -0.3] }, bf: { m: [2.15, 0.35] } }),
    pr({ y: -0.34, g: 0.4, lean: 0.12, bn: { m: [0.8, -0.1] }, bf: { m: [1.6, 0.2] }, cara: 'enojo' })) },
  patadaGiro: { limb: 'pF', r: 11, ini: 0.17, act: 0.09, rec: 0.28, dmg: 13, poses: () => at(
    pr({ y: -0.3, g: 1.1, lean: 0.25, pf: { fk: [0.9, -1.9, -0.3] }, pn: [-0.1, 0, 0], bn: { m: [0.7, 0.1] }, bf: { m: [0.9, 0.2] }, cara: 'enojo' }),
    pr({ y: -0.2, g: 0.15, lean: -0.55, x: -0.12, pf: { fk: [1.95, -0.05, -0.5] }, pn: [-0.05, 0, 0], bn: { fk: [-1.0, 0.6] }, bf: { m: [0.6, 0.4] } }),
    pr({ y: -0.3, g: 0.4, lean: -0.1, pf: { fk: [0.8, -1.5, -0.3] }, pn: [-0.2, 0, 0], bn: { m: [0.8, 0.1] }, bf: { m: [1.0, 0.2] }, cara: 'enojo' })) },
  rodilla: { limb: 'rN', r: 10, ini: 0.1, act: 0.08, rec: 0.2, dmg: 9, poses: () => [B.rodilla[0], B.rodilla[1], B.rodilla[1], B.rodilla[0]] },
  hombro: { limb: 'hN', r: 14, ext: 8, dash: 150, ini: 0.12, act: 0.14, rec: 0.26, dmg: 11, poses: () => at(
    pr({ y: -0.5, lean: 0.25, g: 0.8, bn: { m: [0.4, -0.3] }, bf: { m: [0.5, -0.2] }, cara: 'enojo' }),
    pr({ y: -0.46, x: 0.3, lean: 0.75, g: 0.7, head: 0.3, pn: [-1.15, 0.1, -0.3], pf: [0.5, 0, 0], bn: { m: [0.35, -0.3] }, bf: { m: [0.55, -0.15] } }),
    pr({ y: -0.42, lean: 0.4, bn: { m: [0.7, -0.2] }, bf: { m: [1.0, -0.1] }, cara: 'enojo' })) },
  panzazo: { limb: 'cadera', r: 14, ext: 22, dash: 120, ini: 0.13, act: 0.09, rec: 0.24, dmg: 10, poses: () => at(
    pr({ y: -0.3, lean: 0.2, x: -0.2, bn: { fk: [0.6, 1.2] }, bf: { fk: [0.6, 1.2] }, cara: 'enojo' }),
    pr({ y: -0.24, lean: -0.42, x: 0.42, head: 0.2, pn: [-0.95, 0, 0], pf: [0.4, 0, 0], bn: { fk: [-0.9, 0.4] }, bf: { fk: [-0.8, 0.5] } }),
    pr({ y: -0.28, lean: -0.2, x: 0.2, bn: { fk: [-0.4, 0.6] }, bf: { fk: [-0.3, 0.7] }, cara: 'feliz' })) },
  lanzar: { limb: 'mN', r: 9, ini: 0.16, act: 0.06, rec: 0.26, dmg: 0, poses: () => at(
    pr({ y: -0.3, lean: -0.22, g: 0.65, bn: { fk: [2.75, 1.7] }, bf: { m: [1.5, 0.6] }, pn: [-0.8, 0, 0], pf: [0.6, 0, 0], cara: 'enojo' }),
    pr({ y: -0.4, x: 0.18, lean: 0.36, g: 0.3, bn: { m: [2.0, 0.65] }, bf: { m: [0.5, -0.2] }, pn: [-0.95, 0.12, -0.4], pf: [0.6, 0, 0] }),
    pr({ y: -0.38, lean: 0.3, bn: { m: [1.6, -0.2] }, bf: { m: [0.7, -0.1] }, cara: 'enojo' })) },
  onda: { limb: 'mF', r: 10, ini: 0.15, act: 0.06, rec: 0.26, dmg: 0, poses: () => at(
    pr({ y: -0.46, lean: -0.08, g: 0.75, bn: { m: [-0.1, -0.5] }, bf: { m: [0.05, -0.42] }, mano: 'abierta', cara: 'enojo' }),
    pr({ y: -0.5, x: 0.14, lean: 0.3, g: 0.4, bn: { m: [2.0, 0.0] }, bf: { m: [2.1, 0.08] }, pn: [-1.0, 0, 0], pf: [0.7, 0, 0], mano: 'abierta' }),
    pr({ y: -0.42, lean: 0.2, bn: { m: [1.4, -0.1] }, bf: { m: [1.6, 0.0] }, mano: 'abierta', cara: 'enojo' })) },
  upper: { limb: 'mN', r: 12, dash: 70, arco: true, ini: 0.06, act: 0.2, rec: 0.32, dmg: 13, lanza: 420, sube: 230, invul: 0.12, poses: () => at(
    pr({ y: -0.85, lean: 0.4, enc: 0.12, g: 0.5, bn: { m: [0.45, -0.7] }, bf: { m: [0.85, 0.2] }, cara: 'enojo' }),
    pr({ alto: 2.9, lean: -0.08, g: 0.35, head: -0.25, pn: { fk: [0.3, -1.7, -0.3] }, pf: { fk: [0.1, -0.2, -0.3] }, bn: { m: [0.85, 0.95] }, bf: { m: [0.6, 0.1] } }),
    pr({ alto: 2.6, lean: 0.05, pn: { fk: [0.4, -1.2, -0.2] }, pf: { fk: [0.6, -1.0, -0.2] }, bn: { m: [0.9, 0.6] }, bf: { m: [1.0, 0.3] }, cara: 'enojo' })) },
  rafaga: { limb: 'mF', r: 10, ini: 0.08, act: 0.36, rec: 0.24, dmg: 3, multi: 5, poses: () => [B.pina1[0], B.pina1[1], B.pina2[1], B.pina1[1], B.pina2[1], B.pina2[3]], n: 6 },
  giratorio: { limb: 'mN', r: 14, ini: 0.1, act: 0.42, rec: 0.26, dmg: 3, multi: 4, dash: 90, poses: () => [B.especial[0], B.especial[1], B.especial[0], B.especial[1], B.especial[0], B.especial[1]], n: 6, giro: true },
  contra: { limb: 'mF', r: 12, ini: 0.04, act: 0.4, rec: 0.3, dmg: 12, poses: () => at(
    pr({ y: -0.5, lean: -0.12, g: 0.75, bn: { m: [0.6, 0.5] }, bf: { m: [1.4, 0.65] }, mano: 'abierta', cara: 'normal' }),
    pr({ y: -0.5, lean: -0.14, g: 0.8, bn: { m: [0.55, 0.55] }, bf: { m: [1.45, 0.7] }, mano: 'abierta', cara: 'feliz' }),
    pr({ y: -0.44, x: 0.2, lean: 0.4, g: 0.3, bn: { m: [2.1, 0.3] }, bf: { m: [0.6, 0.0] }, pn: [-0.95, 0.12, -0.4], pf: [0.6, 0, 0] })) },
  golpeSuelo: { limb: 'mF', r: 14, ini: 0.22, act: 0.08, rec: 0.32, dmg: 0, poses: () => at(
    pr({ y: -0.2, lean: -0.15, head: -0.2, bn: { fk: [2.9, 0.3] }, bf: { fk: [2.8, 0.4] }, cara: 'grito' }),
    pr({ y: -1.2, lean: 0.85, enc: 0.15, head: 0.2, bn: { m: [1.15, -1.9] }, bf: { m: [1.4, -1.8] }, pn: [-0.8, 0, 0], pf: [0.9, 0, 0] }),
    pr({ y: -0.9, lean: 0.5, bn: { m: [1.0, -1.0] }, bf: { m: [1.2, -0.9] }, cara: 'enojo' })) },
  selfie: { limb: 'mN', r: 9, ini: 0.12, act: 0.1, rec: 0.3, dmg: 0, poses: () => at(
    pr({ y: -0.26, lean: -0.05, head: -0.3, bn: { fk: [2.6, 0.9] }, bf: { m: [0.6, -0.4] }, cara: 'feliz', mano: 'abierta' }),
    pr({ y: -0.24, lean: -0.1, head: -0.35, bn: { fk: [2.75, 0.6] }, bf: { fk: [1.6, 2.3] }, cara: 'feliz', mano: 'abierta' }),
    pr({ y: -0.3, lean: 0.05, bn: { m: [0.9, 0.0] }, bf: { m: [1.2, 0.1] }, cara: 'feliz' })) },
  tomar: { limb: 'mN', r: 8, ini: 0.12, act: 0.3, rec: 0.25, dmg: 0, poses: () => at(
    pr({ y: -0.26, lean: -0.05, head: -0.1, bn: { m: [0.8, 0.5] }, bf: { m: [0.9, -0.4] }, cara: 'normal' }),
    pr({ y: -0.22, lean: -0.2, head: -0.45, bn: { m: [0.72, 1.0] }, bf: { m: [0.8, -0.5] }, cara: 'feliz' }),
    pr({ y: -0.3, lean: 0.05, bn: { m: [0.9, 0.0] }, bf: { m: [1.2, 0.1] }, cara: 'feliz' })) },
  // aéreos (cuerpo en el aire: 'alto')
  voladora: { limb: 'pN', r: 11, ini: 0.07, act: 0.22, rec: 0.12, dmg: 9, aereo: true, poses: () => [P({ alto: 2.95, lean: -0.05, pn: { fk: [0.9, -2.0, -0.3] }, pf: { fk: [0.6, -2.0, -0.3] }, bn: { m: [0.8, 0.42] }, bf: { m: [1.0, 0.3] }, cara: 'enojo' }), B.voladora[0], B.voladora[0], B.salto[0]] },
  pinaAerea: { limb: 'mF', r: 11, ext: 6, arco: true, ini: 0.06, act: 0.16, rec: 0.12, dmg: 6, aereo: true, poses: () => [P({ alto: 2.95, lean: 0.1, pn: { fk: [0.35, -1.7, -0.3] }, pf: { fk: [1.0, -1.75, -0.2] }, bn: { m: [0.8, 0.4] }, bf: { m: [0.6, 0.5] }, cara: 'enojo' }),
    P({ alto: 2.95, lean: 0.45, g: 0.4, pn: { fk: [0.35, -1.7, -0.3] }, pf: { fk: [1.0, -1.75, -0.2] }, bn: { m: [0.7, 0.3] }, bf: { m: [1.6, -1.15] }, cara: 'grito' }), null, null] },
  rodillaAerea: { limb: 'rN', r: 11, ini: 0.07, act: 0.2, rec: 0.12, dmg: 9, aereo: true, poses: () => [P({ alto: 3.0, lean: 0.0, pn: { fk: [0.6, -1.6, -0.3] }, pf: { fk: [0.2, -0.8, -0.2] }, bn: { m: [0.9, 0.5] }, bf: { m: [1.1, 0.4] }, cara: 'enojo' }),
    P({ alto: 3.0, lean: 0.15, pn: { fk: [1.75, -2.4, -0.4] }, pf: { fk: [-0.2, -0.6, -0.2] }, bn: { fk: [-0.7, 0.8] }, bf: { m: [1.3, 0.6] }, cara: 'grito' }), null, null] },
  codoAereo: { limb: 'cN', r: 11, arco: true, ini: 0.08, act: 0.2, rec: 0.12, dmg: 10, aereo: true, alto: true, poses: () => [P({ alto: 3.0, lean: -0.1, pn: { fk: [0.4, -1.6, -0.3] }, pf: { fk: [0.9, -1.8, -0.2] }, bn: { fk: [2.8, 2.2] }, bf: { m: [1.0, 0.3] }, cara: 'enojo' }),
    P({ alto: 2.9, lean: 0.55, enc: 0.1, pn: { fk: [0.3, -1.5, -0.3] }, pf: { fk: [0.8, -1.6, -0.2] }, bn: { fk: [1.25, 2.5] }, bf: { m: [0.8, 0.1] }, cara: 'grito' }), null, null] },
  pisoAereo: { limb: 'pF', r: 12, ini: 0.1, act: 0.24, rec: 0.12, dmg: 11, aereo: true, alto: true, poses: () => [P({ alto: 3.05, lean: 0.1, pn: { fk: [0.9, -2.1, -0.3] }, pf: { fk: [1.1, -2.2, -0.2] }, bn: { m: [0.6, 0.6] }, bf: { m: [0.8, 0.6] }, cara: 'enojo' }),
    P({ alto: 3.1, lean: -0.15, pn: { fk: [0.85, -0.1, 0.2] }, pf: { fk: [0.65, -0.1, 0.2] }, bn: { fk: [-1.2, 0.5] }, bf: { fk: [2.4, 0.4] }, cara: 'grito' }), null, null] },
  zarpaAerea: { limb: 'mN', r: 12, ini: 0.08, act: 0.2, rec: 0.12, dmg: 9, aereo: true, poses: () => [P({ alto: 3.0, lean: 0.1, head: 0.2, pn: { fk: [0.4, -1.7, -0.3] }, pf: { fk: [0.9, -1.8, -0.2] }, bn: { fk: [2.8, 0.6] }, bf: { m: [1.4, 0.2] }, mano: 'abierta', cara: 'enojo' }),
    P({ alto: 2.95, lean: 0.55, head: 0.3, pn: { fk: [0.4, -1.7, -0.3] }, pf: { fk: [0.9, -1.8, -0.2] }, bn: { m: [1.8, -0.8] }, bf: { m: [1.6, -0.2] }, mano: 'abierta', cara: 'grito' }), null, null] },
};
// golpe aéreo: [prep, activo, null, null] → se completa con salto
function poses4(E, nombre) { const t = TPL[nombre]; const p = t.poses(E).slice(); const sal = salto(E);
  for (let i = 0; i < p.length; i++) if (!p[i]) p[i] = i === p.length - 1 ? sal[2] : p[i - 1];
  return p; }

// ---------- victoria, derrota, presentación, burla ----------
const FIN = {
  brazos: [P({ y: -0.12, bn: { fk: [3.0, 0.15] }, bf: { fk: [2.9, 0.2] }, head: -0.15, cara: 'grito' }), P({ y: -0.2, bn: { fk: [2.85, 0.4] }, bf: { fk: [2.75, 0.45] }, head: -0.1, cara: 'feliz' })],
  puno: [P({ y: -0.15, bn: { fk: [3.0, 0.15] }, bf: { m: [0.4, -0.3] }, head: -0.12, cara: 'feliz' }), P({ y: -0.25, bn: { fk: [2.75, 0.6] }, bf: { m: [0.4, -0.35] }, head: -0.06, cara: 'feliz' })],
  cruzado: [P({ y: -0.08, lean: -0.08, head: -0.18, bn: { m: [0.78, 0.18] }, bf: { m: [0.62, 0.24] }, pn: [-0.5, 0, 0], pf: [0.5, 0, 0], cara: 'feliz' }), P({ y: -0.1, lean: -0.1, head: -0.24, bn: { m: [0.78, 0.2] }, bf: { m: [0.62, 0.26] }, pn: [-0.5, 0, 0], pf: [0.5, 0, 0], cara: 'normal' })],
  saludo: [P({ y: -0.05, lean: -0.04, bn: { fk: [2.25, 2.45] }, bf: { m: [0.3, -1.1] }, pn: [-0.3, 0, 0], pf: [0.3, 0, 0], mano: 'abierta', cara: 'normal' }), P({ y: -0.05, lean: -0.04, bn: { fk: [2.3, 2.5] }, bf: { m: [0.3, -1.1] }, pn: [-0.3, 0, 0], pf: [0.3, 0, 0], mano: 'abierta', cara: 'enojo' })],
  flex: [P({ y: -0.25, lean: 0, g: 0.85, bn: { fk: [1.6, 2.45] }, bf: { fk: [-1.6, 2.45] }, pn: [-0.7, 0, 0], pf: [0.7, 0, 0], cara: 'grito' }), P({ y: -0.3, lean: 0.05, g: 0.85, bn: { fk: [1.7, 2.5] }, bf: { fk: [-1.5, 2.5] }, pn: [-0.75, 0, 0], pf: [0.75, 0, 0], cara: 'feliz' })],
  baile: [P({ y: -0.2, x: 0.14, lean: -0.1, g: 0.6, bn: { fk: [2.2, 1.0] }, bf: { m: [0.5, -0.6] }, pn: [-0.6, 0.15, -0.3], pf: [0.6, 0, 0], cara: 'feliz' }), P({ y: -0.2, x: -0.14, lean: 0.1, g: 0.6, bn: { m: [0.5, -0.6] }, bf: { fk: [2.2, 1.0] }, pn: [-0.6, 0, 0], pf: [0.6, 0.15, -0.3], cara: 'feliz' })],
  reverencia: [P({ y: -0.1, lean: 0.85, enc: 0.1, head: 0.2, bn: { m: [0.9, -0.4] }, bf: { fk: [-1.2, 0.5] }, pn: [-0.4, 0, 0], pf: [0.4, 0, 0], mano: 'abierta', cara: 'feliz' }), P({ y: -0.1, lean: 0.1, bn: { m: [0.9, -0.2] }, bf: { fk: [2.6, 0.6] }, pn: [-0.4, 0, 0], pf: [0.4, 0, 0], mano: 'abierta', cara: 'feliz' })],
  mate: [P({ y: -0.08, lean: -0.08, head: -0.2, bn: { m: [0.72, 0.95] }, bf: { m: [0.8, 0.1] }, pn: [-0.4, 0, 0], pf: [0.4, 0, 0], cara: 'feliz' }), P({ y: -0.08, lean: -0.12, head: -0.32, bn: { m: [0.7, 1.0] }, bf: { m: [0.8, 0.12] }, pn: [-0.4, 0, 0], pf: [0.4, 0, 0], cara: 'feliz' })],
  zombi: [P({ y: -0.3, lean: 0.4, head: 0.4, bn: { m: [1.9, 0.3] }, bf: { m: [2.0, 0.45] }, mano: 'abierta', cara: 'grito' }), P({ y: -0.36, lean: 0.48, head: 0.2, bn: { m: [1.9, 0.1] }, bf: { m: [2.0, 0.3] }, mano: 'abierta', cara: 'grito' })],
  burla: [P({ y: -0.2, lean: -0.1, head: -0.1, bn: { m: [0.4, -0.3] }, bf: { m: [2.1, 0.5] }, cara: 'feliz', mano: 'abierta' }), P({ y: -0.24, lean: -0.15, head: -0.18, bn: { m: [0.4, -0.35] }, bf: { m: [2.0, 0.6] }, cara: 'grito', mano: 'abierta' })],
  pecho: [P({ y: -0.2, lean: -0.15, head: -0.15, bn: { m: [0.55, 0.3] }, bf: { m: [0.5, 0.35] }, cara: 'grito' }), P({ y: -0.24, lean: -0.2, head: -0.2, bn: { m: [0.7, 0.1] }, bf: { m: [0.65, 0.15] }, cara: 'grito' })],
  nudillos: [P({ y: -0.26, lean: 0.1, bn: { m: [0.85, 0.05] }, bf: { m: [0.75, 0.1] }, cara: 'enojo' }), P({ y: -0.3, lean: 0.12, bn: { m: [0.8, 0.0] }, bf: { m: [0.78, 0.05] }, cara: 'grito' })],
};
const pierde = [P({ alto: 1.42, lean: 0.95, enc: 0.2, head: 0.5, pn: { fk: [0.08, -1.7, -0.7] }, pf: [1.0, 0, 0], bn: { m: [0.4, -1.75] }, bf: { m: [0.62, -1.7] }, cara: 'dolor', mano: 'abierta' })];

// ---------- diccionario del luchador ----------
// L: { estilo: {guardia, lean, paso, rebote, cara}, golpes: { l, h, lc, hc, la, ha, s1, s2, firma, ult }, gana, intro }
export function posesDe(L) {
  const E = L.estilo; const d = {
    quieto: quieto(E), camina: caminar(E), corre: caminar(E, true), salto: salto(E), agacha: agacha(E), bloq: bloq(E), bloqAg: bloqAg(E),
    dolor: [B.dolor[0], B.dolor[1]], dolorB: [B.dolor[2], B.dolor[3]], dolorAg: dolorAg(), vuela: B.vuela, piso: B.piso, levanta: B.levanta,
    agarra: B.agarra, lanza: [B.revolea[0], B.revolea[1]], agarrado: B.agarrado, gana: FIN[L.gana] || FIN.puno, pierde, intro: FIN[L.intro] || FIN.nudillos, burla: FIN.burla };
  for (const k in L.golpes) { const g = L.golpes[k]; const nom = Array.isArray(g) ? g[0] : g.tpl || g; if (!TPL[nom]) throw new Error('plantilla ' + nom + ' (' + L.id + ')'); d['m_' + k] = TPL[nom].aereo ? poses4(E, nom) : TPL[nom].poses(E).slice(); }
  for (const k of ['s1', 's2']) { const sp = L[k]; if (!sp) continue; const nom = sp.tpl; if (!TPL[nom]) throw new Error('plantilla ' + nom + ' (' + L.id + ')'); d['m_' + k] = TPL[nom].aereo ? poses4(E, nom) : TPL[nom].poses(E).slice(); }
  d.m_agarre = B.agarra;
  return d;
}
