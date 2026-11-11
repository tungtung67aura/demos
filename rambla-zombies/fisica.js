// Física del combate (Rambla Zombies 2.0 · Actualización 1): cadáveres con ragdoll (verlet de 9 puntos),
// cuerpos baratos para cuando no alcanzan las ranuras, choques entre cadáveres, explosiones radiales,
// grillas espaciales, sangre horneada (sangre.js) y marcas de bala. Todo en pools fijos: nada se crea por cuadro.
import * as THREE from 'https://esm.sh/three@0.160.0';
import { local, piso, muestras } from './world.js';
import { crearSangre, opacidad } from './sangre.js';

// ---------- obstáculos: cajas orientadas (autos, ómnibus, contenedores, bancos) o cilindros ----------
// radio que encierra todas las cajas del obstáculo (para descartar rápido)
export function radioAmplio(col) {
  for (const c of col) { c.rb = c.r; if (c.cajas) for (const k of c.cajas) c.rb = Math.max(c.rb, Math.hypot(k.cx - c.x, k.cz - c.z) + Math.hypot(k.hx, k.hz)); }
}
// rayo contra caja orientada (eje x local = (c, 0, -s), eje z local = (s, 0, c)). Devuelve t o Infinity; normal en n.
export function rayoCaja(ox, oy, oz, dx, dy, dz, k, n, m = 0) {
  const px = ox - k.cx, pz = oz - k.cz, HX = k.hx + m, HZ = k.hz + m, Y0 = k.y0 - m, Y1 = k.y1 + m;
  const lx = px * k.c - pz * k.s, lz = px * k.s + pz * k.c;
  const ex = dx * k.c - dz * k.s, ez = dx * k.s + dz * k.c;
  let t0 = -Infinity, t1 = Infinity, eje = -1, sg = 0, a, b, s, t;
  if (Math.abs(ex) < 1e-9) { if (lx < -HX || lx > HX) return Infinity; }
  else { a = (-HX - lx) / ex; b = (HX - lx) / ex; s = -1; if (a > b) { t = a; a = b; b = t; s = 1; } if (a > t0) { t0 = a; eje = 0; sg = s; } if (b < t1) t1 = b; if (t0 > t1) return Infinity; }
  if (Math.abs(dy) < 1e-9) { if (oy < Y0 || oy > Y1) return Infinity; }
  else { a = (Y0 - oy) / dy; b = (Y1 - oy) / dy; s = -1; if (a > b) { t = a; a = b; b = t; s = 1; } if (a > t0) { t0 = a; eje = 1; sg = s; } if (b < t1) t1 = b; if (t0 > t1) return Infinity; }
  if (Math.abs(ez) < 1e-9) { if (lz < -HZ || lz > HZ) return Infinity; }
  else { a = (-HZ - lz) / ez; b = (HZ - lz) / ez; s = -1; if (a > b) { t = a; a = b; b = t; s = 1; } if (a > t0) { t0 = a; eje = 2; sg = s; } if (b < t1) t1 = b; if (t0 > t1) return Infinity; }
  if (t1 < 0) return Infinity;
  if (t0 < 0) { n.x = -dx; n.y = -dy; n.z = -dz; return 0; }
  if (eje === 0) { n.x = sg * k.c; n.y = 0; n.z = -sg * k.s; }
  else if (eje === 1) { n.x = 0; n.y = sg; n.z = 0; }
  else { n.x = sg * k.s; n.y = 0; n.z = sg * k.c; }
  return t0;
}
// saca un punto (radio r) de una caja. yPrev: altura del paso anterior (si venía de arriba, se apoya en el techo)
function sacarDeCaja(P, i, r, yPrev, k) {
  const y = P[i + 1]; if (y > k.y1 + r || y < k.y0 - r) return 0;
  const px = P[i] - k.cx, pz = P[i + 2] - k.cz;
  const lx = px * k.c - pz * k.s, lz = px * k.s + pz * k.c, hx = k.hx + r, hz = k.hz + r;
  if (lx <= -hx || lx >= hx || lz <= -hz || lz >= hz) return 0;
  if (yPrev >= k.y1 + r - 0.08) { P[i + 1] = k.y1 + r; return 2; }
  let nx = lx, nz = lz;
  if (hx - Math.abs(lx) < hz - Math.abs(lz)) nx = lx > 0 ? hx : -hx; else nz = lz > 0 ? hz : -hz;
  P[i] = k.cx + nx * k.c + nz * k.s; P[i + 2] = k.cz - nx * k.s + nz * k.c;
  return 1;
}
function sacarDeCilindro(P, i, r, yPrev, c) {
  if (P[i + 1] > c.top + r) return 0;
  const dx = P[i] - c.x, dz = P[i + 2] - c.z, rr = c.r + r, d2 = dx * dx + dz * dz;
  if (d2 >= rr * rr) return 0;
  if (yPrev >= c.top + r - 0.08) { P[i + 1] = c.top + r; return 2; }
  const d = Math.sqrt(d2) || 1e-4; P[i] = c.x + dx / d * rr; P[i + 2] = c.z + dz / d * rr; return 1;
}
export function sacarPunto(P, i, r, yPrev, c) {
  const cj = c.cajas; if (cj) { let res = 0; for (let q = 0; q < cj.length; q++) res = sacarDeCaja(P, i, r, yPrev, cj[q]) || res; return res; }
  return sacarDeCilindro(P, i, r, yPrev, c);
}
// ¿el punto está metido en algún obstáculo? (para las pruebas)
export function adentro(x, y, z, r, col) {
  const P = _pt; P[0] = x; P[1] = y; P[2] = z;
  for (const c of col) {
    if ((c.x - x) ** 2 + (c.z - z) ** 2 > (c.rb + r) ** 2) continue;
    if (c.cajas) {
      for (const k of c.cajas) {
        if (y > k.y1 + r * 0.5 || y < k.y0) continue;
        const px = x - k.cx, pz = z - k.cz, lx = px * k.c - pz * k.s, lz = px * k.s + pz * k.c;
        if (Math.abs(lx) < k.hx - 0.02 && Math.abs(lz) < k.hz - 0.02 && y < k.y1 - 0.02) return true;
      }
    } else if (y < c.top - 0.02 && (c.x - x) ** 2 + (c.z - z) ** 2 < (c.r - 0.02) ** 2) return true;
  }
  return false;
}
const _pt = new Float32Array(3);

// ---------- grillas espaciales (hash): obstáculos fijos y cuerpos que se mueven ----------
const hashC = (ix, iz, M) => (Math.imul(ix, 73856093) ^ Math.imul(iz, 19349663)) & M;
// obstáculos: se arma una vez. buscar(x, z, r, out) llena 'out' con los que tienen el círculo envolvente cerca
export function crearGrilla(col, celda = 4) {
  const NB = 4096, M = NB - 1, tmp = [];
  for (let b = 0; b < NB; b++) tmp.push(null);
  for (let q = 0; q < col.length; q++) {
    const c = col[q], r = Math.max(c.rb || c.r, c.r);
    const x0 = Math.floor((c.x - r) / celda), x1 = Math.floor((c.x + r) / celda), z0 = Math.floor((c.z - r) / celda), z1 = Math.floor((c.z + r) / celda);
    for (let ix = x0; ix <= x1; ix++) for (let iz = z0; iz <= z1; iz++) { const b = hashC(ix, iz, M); const L = tmp[b] || (tmp[b] = []); if (L[L.length - 1] !== q) L.push(q); }
  }
  const ini = new Int32Array(NB + 1), lista = [];
  for (let b = 0; b < NB; b++) { ini[b] = lista.length; if (tmp[b]) for (const q of tmp[b]) lista.push(q); }
  ini[NB] = lista.length;
  const it = Int32Array.from(lista), sello = new Uint32Array(col.length + 1); let s = 0;
  return {
    buscar(x, z, r, out, max = out.length) {
      s++; let n = 0;
      const x0 = Math.floor((x - r) / celda), x1 = Math.floor((x + r) / celda), z0 = Math.floor((z - r) / celda), z1 = Math.floor((z + r) / celda);
      for (let ix = x0; ix <= x1; ix++) for (let iz = z0; iz <= z1; iz++) {
        const b = hashC(ix, iz, M);
        for (let k = ini[b]; k < ini[b + 1]; k++) {
          const q = it[k]; if (sello[q] === s) continue; sello[q] = s;
          const c = col[q], rr = c.rb + r;
          if ((c.x - x) * (c.x - x) + (c.z - z) * (c.z - z) < rr * rr) { out[n++] = c; if (n >= max) return n; }
        }
      }
      return n;
    }
  };
}
// cuerpos (zombis vivos): se rearma en cada paso con listas enlazadas en arreglos tipados
export function crearGrillaDin(max, celda = 2) {
  const NB = 1024, M = NB - 1, cab = new Int32Array(NB).fill(-1), sig = new Int32Array(max), X = new Float32Array(max), Z = new Float32Array(max), refs = new Array(max).fill(null);
  const sello = new Uint32Array(max); let n = 0, s = 0;
  return {
    limpiar() { cab.fill(-1); for (let i = 0; i < n; i++) refs[i] = null; n = 0; },
    poner(x, z, ref) { if (n >= max) return; const b = hashC(Math.floor(x / celda), Math.floor(z / celda), M); X[n] = x; Z[n] = z; refs[n] = ref; sig[n] = cab[b]; cab[b] = n; n++; },
    buscar(x, z, r, out) {
      s++; let c = 0;
      const x0 = Math.floor((x - r) / celda), x1 = Math.floor((x + r) / celda), z0 = Math.floor((z - r) / celda), z1 = Math.floor((z + r) / celda);
      for (let ix = x0; ix <= x1; ix++) for (let iz = z0; iz <= z1; iz++) {
        for (let k = cab[hashC(ix, iz, M)]; k >= 0; k = sig[k]) {
          if (sello[k] === s) continue; sello[k] = s;
          if ((X[k] - x) * (X[k] - x) + (Z[k] - z) * (Z[k] - z) < r * r && c < out.length) out[c++] = refs[k];
        }
      }
      return c;
    },
    get n() { return n; }
  };
}

// ---------- ragdoll ----------
// puntos: 0 cadera izq, 1 cadera der, 2 hombro izq, 3 hombro der, 4 cabeza, 5 mano izq, 6 mano der, 7 pie izq, 8 pie der
const NP = 9, N3 = NP * 3;
const CAN = [-0.11, 0.86, 0, 0.11, 0.86, 0, -0.27, 1.44, 0, 0.27, 1.44, 0, 0, 1.76, 0, -0.27, 0.82, 0, 0.27, 0.82, 0, -0.11, 0.05, 0, 0.11, 0.05, 0];
const RAD = [0.12, 0.12, 0.13, 0.13, 0.15, 0.06, 0.06, 0.07, 0.07];
// [a, b, tipo, k1, k2]: 0 rígida · 1 rango (proporción del largo de reposo) · 2 distancia mínima (metros × escala)
const RES = [
  [0, 1, 0], [2, 3, 0], [0, 2, 0], [1, 3, 0], [0, 3, 0], [1, 2, 0],          // torso
  [4, 2, 0], [4, 3, 0], [4, 0, 1, 0.87, 1.0], [4, 1, 1, 0.87, 1.0],           // cabeza (bisagra con tope)
  [2, 5, 0], [3, 6, 0], [0, 7, 0], [1, 8, 0],                                 // brazos y piernas
  [5, 1, 2, 0.24], [6, 0, 2, 0.24], [5, 3, 2, 0.3], [6, 2, 2, 0.3],           // las manos no atraviesan el torso
  [7, 8, 2, 0.15], [7, 2, 1, 0.55, 1.0], [8, 3, 1, 0.55, 1.0], [7, 1, 2, 0.12], [8, 0, 2, 0.12]
];
const NR = RES.length;
// huesos largos que también chocan en el medio (no solo en las puntas): costados del torso, brazos, piernas
const HUESOS = [0, 2, 1, 3, 2, 5, 3, 6, 0, 7, 1, 8], NH = HUESOS.length / 2, TS = [0.33, 0.67];
// cuánto del impulso recibe cada punto según dónde pegó el tiro
const W_TORSO = [0.45, 0.45, 1, 1, 0.95, 0.85, 0.85, 0.12, 0.12];
const W_CAB = [0.12, 0.12, 0.5, 0.5, 1.35, 0.35, 0.35, 0, 0];
const W_PIERNA = [0.75, 0.75, 0.12, 0.12, 0.08, 0.2, 0.2, 1.15, 1.15];
// caras verticales de los escalones del piso (muro de la rambla, cordón): una esfera por debajo del borde alto
// no puede quedar a menos de su radio de la cara; se la corre de costado hacia el lado bajo
const BORDE = [-12.1, -10.8, -2.5, 12], NBO = BORDE.length, BLADO = new Int8Array(NBO), BALTO = new Float32Array(NBO), BBAJO = new Float32Array(NBO);
for (let e = 0; e < NBO; e++) { const a = piso(BORDE[e] - 1e-3), b = piso(BORDE[e] + 1e-3); BLADO[e] = b > a ? 1 : -1; BALTO[e] = Math.max(a, b); BBAJO[e] = Math.min(a, b); }
function caras(A, k, r, mpx, mpz, nx, nz) {
  const d = (A[k] - mpx) * nx + (A[k + 2] - mpz) * nz;
  for (let e = 0; e < NBO; e++) {
    const b = BORDE[e], ad = d - b; if (ad >= r || ad <= -r) continue;
    if (A[k + 1] >= BALTO[e] - 0.02) continue;          // arriba del borde: lo resuelve el piso
    const lado = BLADO[e], obj = b - lado * r, delta = obj - d;
    if (delta * lado >= 0) continue;                     // ya está del lado bajo a más de r
    A[k] += nx * delta; A[k + 2] += nz * delta; if (A[k + 1] < BBAJO[e] + r) A[k + 1] = BBAJO[e] + r;
    return 1;
  }
  return 0;
}
const VMAX = 25;            // m/s: tope de velocidad de un punto (0,21 m por paso a 120 Hz)
const PASO_FIS = 1 / 120;

const _v = new THREE.Vector3(), _up = new THREE.Vector3(), _rt = new THREE.Vector3(), _fw = new THREE.Vector3(), _a = new THREE.Vector3();
let _isx = 1, _isy = 1, _isz = 1;
const _m4 = new THREE.Matrix4(), _qi = new THREE.Quaternion(), _Y = new THREE.Vector3(0, 1, 0), _NY = new THREE.Vector3(0, -1, 0), _l = {}, _nr = { x: 0, y: 0, z: 0 };
const _PI = new Float32Array(N3), _S = new Float64Array(3);

function nuevoSlot(rig) {
  return { z: null, rig, p: new Float32Array(N3), o: new Float32Array(N3), pp: new Float32Array(N3), L: new Float32Array(NR * 2), toca: new Uint8Array(NP), t: 0, quieto: 0,
    cand: new Array(24).fill(null), nCand: 0, candT: 0, g: 15, pesado: false, tocoPecho: false, esc: 1, orden: 0, iters: 4, apoyo: 0, empujes: 0, vx: 0, vy: 0, vz: 0 };
}

export function crearFisica(scene, colisiones, cb = {}) {
  radioAmplio(colisiones);
  const grilla = crearGrilla(colisiones);
  const MAXR = 16, MAXB = 40, slots = [], rigs = [];
  for (let i = 0; i < MAXR; i++) slots.push(nuevoSlot(false));
  for (let i = 0; i < MAXB; i++) rigs.push(nuevoSlot(true));
  let capBase = 12, capRag = 12, itersCerca = 4, orden = 0, nivel = 0;
  const est = { aRigido: 0, dormidos: 0, asentados: 0, despertados: 0, ccd: 0, nan: 0 };
  const cuerpos = () => (cb.cuerpos ? cb.cuerpos() : null);

  function ponerPunto(P, i, obj, x, y, z) { _v.set(x, y, z).applyMatrix4(obj.matrixWorld); P[i * 3] = _v.x; P[i * 3 + 1] = _v.y; P[i * 3 + 2] = _v.z; }
  function velDe(s) { let m = 0; const P = s.p, O = s.o; for (let k = 0; k < N3; k++) { const d = Math.abs(P[k] - O[k]); if (d > m) m = d; } return m; }
  // libera una ranura de ragdoll: el que mejor se banca pasar a dormido o a cuerpo barato (nunca se congela en el aire)
  function tomarSlot(z) {
    if (z.rag && !z.rag.rig) return z.rag;
    if (z.rag) soltarSlot(z.rag);
    for (let i = 0; i < capRag; i++) if (!slots[i].z) return slots[i];
    let peor = null, pv = Infinity;
    for (let i = 0; i < MAXR; i++) {
      const s = slots[i]; if (!s.z) continue;
      const v = (s.apoyo >= 3 ? 0 : s.apoyo >= 2 ? 50 : 200) + velDe(s) * 1000 - s.t * 2 + (s.pesado ? 500 : 0);
      if (v < pv) { pv = v; peor = s; }
    }
    if (peor.apoyo >= 2 && velDe(peor) < 0.004) dormir(peor); else aRigido(peor);
    return peor;
  }
  function activosRag() { let n = 0; for (let i = 0; i < MAXR; i++) if (slots[i].z) n++; return n; }
  function soltarSlot(s) { if (s.z) { s.z.rag = null; s.z = null; } }
  function calcularL(s, z) {
    const sx = z.g.scale.x, sy = z.g.scale.y, sz = z.g.scale.z;
    s.esc = (sx + sy + sz) / 3;
    for (let j = 0; j < NR; j++) {
      const r = RES[j], a = r[0] * 3, b = r[1] * 3;
      const L = Math.hypot((CAN[a] - CAN[b]) * sx, (CAN[a + 1] - CAN[b + 1]) * sy, (CAN[a + 2] - CAN[b + 2]) * sz);
      if (r[2] === 0) { s.L[j * 2] = L; s.L[j * 2 + 1] = L; }
      else if (r[2] === 1) { s.L[j * 2] = L * r[3]; s.L[j * 2 + 1] = L * r[4]; }
      else { s.L[j * 2] = r[3] * s.esc; s.L[j * 2 + 1] = 1e9; }
    }
  }
  function prepararSlot(s, z) {
    s.z = z; z.rag = s; s.t = 0; s.quieto = 0; s.tocoPecho = false; s.orden = ++orden; s.candT = 0; s.nCand = 0; s.apoyo = 0;
    s.pesado = !!z.T.jefe; s.g = s.pesado ? 10.5 : 15; z.dormido = false; z.mOk = false; s.iters = itersCerca; s.empujes = 0;
    calcularL(s, z);
  }
  // arranca el ragdoll desde la pose actual del zombi. dx,dz: dirección del golpe; h/v: velocidad horizontal/vertical
  // punto (opcional): dónde pegó; reparte el impulso según la distancia de cada parte al impacto y le da giro según el lado
  function iniciar(z, dx, dz, h, v, parte, modo, punto) {
    const s = tomarSlot(z);
    prepararSlot(s, z);
    z.g.updateMatrixWorld(true);
    const P = s.p, O = s.o, sy = z.g.scale.y;
    ponerPunto(P, 0, z.cuerpo, -0.11, 0, 0); ponerPunto(P, 1, z.cuerpo, 0.11, 0, 0);
    ponerPunto(P, 2, z.hombros[0], 0, 0, 0); ponerPunto(P, 3, z.hombros[1], 0, 0, 0);
    ponerPunto(P, 4, z.cab, 0, 0, 0);
    ponerPunto(P, 5, z.manos[0], 0, 0, 0); ponerPunto(P, 6, z.manos[1], 0, 0, 0);
    if (z.tipo === 'gateador' && !z.yaRag) { // va acostado: las piernas siguen la línea del cuerpo, para atrás
      for (let j = 0; j < 2; j++) {
        const h0 = j * 3, sh = (2 + j) * 3, f = (7 + j) * 3;
        let ex = P[h0] - P[sh], ey = P[h0 + 1] - P[sh + 1], ez = P[h0 + 2] - P[sh + 2]; const l = Math.hypot(ex, ey, ez) || 1;
        P[f] = P[h0] + ex / l * 0.81 * sy; P[f + 1] = Math.max(P[h0 + 1], P[h0 + 1] + ey / l * 0.81 * sy); P[f + 2] = P[h0 + 2] + ez / l * 0.81 * sy;
      }
    } else { ponerPunto(P, 7, z.zapatos[0], 0, 0, 0); ponerPunto(P, 8, z.zapatos[1], 0, 0, 0); }
    z.yaRag = true;
    acomodar(s);
    // velocidades iniciales (verlet: posición anterior = actual - v·dt)
    const W = modo === 'explosion' ? null : parte === 0 ? W_CAB : parte === 2 ? W_PIERNA : W_TORSO;
    const lx = -dz, lz = dx;
    let lat = (Math.random() - 0.5) * 0.5;
    const mx = (P[0] + P[3] + P[6] + P[9]) * 0.25, my = (P[1] + P[4] + P[7] + P[10]) * 0.25, mz = (P[2] + P[5] + P[8] + P[11]) * 0.25;
    if (punto) { // giro: si pegó a un costado del eje del cuerpo, gira hacia ese lado
      const ox = punto.x - mx, oz = punto.z - mz, lado = ox * lx + oz * lz;
      lat = Math.max(-0.5, Math.min(0.5, lado * 2.2)) + (Math.random() - 0.5) * 0.12;
    }
    let kbx = z.kb.x * 0.15, kbz = z.kb.z * 0.15; const kl = Math.hypot(kbx, kbz); if (kl > 1.5) { kbx *= 1.5 / kl; kbz *= 1.5 / kl; } z.kb.set(0, 0, 0);
    for (let i = 0; i < NP; i++) {
      const k = i * 3;
      let w = W ? W[i] : 0.85 + Math.random() * 0.3;
      if (W && punto) { // mezcla la tabla de la parte con la cercanía real al impacto
        const dd = Math.hypot(P[k] - punto.x, P[k + 1] - punto.y, P[k + 2] - punto.z) / (0.9 * s.esc);
        w = w * 0.55 + Math.max(0.1, Math.min(1.3, 1.3 - dd)) * 0.45;
      }
      let vx = dx * h * w + kbx, vz = dz * h * w + kbz, vy = v * (W ? 0.55 + 0.45 * w : 0.8 + Math.random() * 0.4);
      const torcer = (lat + (Math.random() - 0.5) * 0.15) * h * 0.35 * w; vx += lx * torcer; vz += lz * torcer;
      if (modo === 'desplome') { // se le aflojan las piernas: cae casi en el lugar
        vx *= 0.45; vz *= 0.45; if (i < 2) vy -= 1.6; if (i >= 7) { vx -= dx * 0.4; vz -= dz * 0.4; }
      } else if (modo === 'explosion') { vx += (Math.random() - 0.5) * 1.2; vy += (Math.random() - 0.5) * 0.8; vz += (Math.random() - 0.5) * 1.2; }
      else if (modo === 'jefe') { // se viene abajo como un árbol
        const f = i >= 2 && i <= 6 ? 3.2 : i >= 7 ? -0.6 : 0.8; vx = dx * f; vz = dz * f; vy = 0;
      }
      O[k] = P[k] - vx * PASO_FIS; O[k + 1] = P[k + 1] - vy * PASO_FIS; O[k + 2] = P[k + 2] - vz * PASO_FIS;
    }
    s.pp.set(P);
    z.mandibula.rotation.x = 0.55;
    return s;
  }
  // si la pose arranca metida en algo (un pie en el muro, la esquina de un auto), se acomoda antes de simular
  function acomodar(s) {
    const P = s.p; s.o.set(P); candidatos(s);
    const T = _pt; T[0] = (P[0] + P[3]) * 0.5; T[1] = (P[1] + P[4]) * 0.5; T[2] = (P[2] + P[5]) * 0.5;
    const t0x = T[0], t0z = T[2];
    for (let c = 0; c < s.nCand; c++) sacarPunto(T, 0, 0.3 * s.esc, -1e9, s.cand[c]);
    const mx = T[0] - t0x, mz = T[2] - t0z, fP = piso(local(T[0], T[2], _l).d);
    for (let i = 0; i < NP; i++) {
      const k = i * 3, rr = RAD[i] * s.esc; P[k] += mx; P[k + 2] += mz;
      let f = piso(local(P[k], P[k + 2], _l).d);
      if (f > fP + 0.3 && P[k + 1] < f + rr) { P[k] = T[0] + (P[k] - T[0]) * 0.2; P[k + 2] = T[2] + (P[k + 2] - T[2]) * 0.2; f = piso(local(P[k], P[k + 2], _l).d); if (f > fP + 0.3) { P[k] = T[0]; P[k + 2] = T[2]; f = fP; } }
      for (let c = 0; c < s.nCand; c++) sacarPunto(P, k, rr, -1e9, s.cand[c]);
      if (P[k + 1] < f + rr) P[k + 1] = f + rr;
    }
  }
  // un cadáver dormido vuelve a simularse desde sus últimos puntos (patada, explosión)
  function despertar(z) {
    if (z.rag) return z.rag;
    if (!z.tienePts || z.hundir) return null;
    const s = tomarSlot(z); prepararSlot(s, z);
    s.p.set(z.ultPts); s.o.set(z.ultPts); s.pp.set(z.ultPts); candidatos(s); est.despertados++;
    return s;
  }
  function candidatos(s) {
    const P = s.p, mx = (P[0] + P[3] + P[6] + P[9]) * 0.25, mz = (P[2] + P[5] + P[8] + P[11]) * 0.25;
    let vel = 0; for (let i = 0; i < NP; i++) { const k = i * 3; vel = Math.max(vel, Math.abs(P[k] - s.o[k]) + Math.abs(P[k + 2] - s.o[k + 2])); }
    const margen = 1.6 * s.esc + vel * 120 * 0.15 + 0.3;
    s.nCand = grilla.buscar(mx, mz, margen, s.cand);
  }
  function dormir(s) {
    const z = s.z; if (!z) return;
    s.pp.set(s.p); posar(s, 1); z.ultPts.set(s.p); z.tienePts = true; z.dormido = true; z.rag = null; s.z = null; est.dormidos++;
    if (cb.alDormir) cb.alDormir(z, s.p);
  }
  // ---------- cuerpo barato: la pose queda fija y el cuerpo entero cae como un bloque hasta apoyarse ----------
  function tomarRig() {
    let viejo = null;
    for (let i = 0; i < MAXB; i++) { const b = rigs[i]; if (!b.z) return b; if (!viejo || b.orden < viejo.orden) viejo = b; }
    asentarYa(viejo); dormir(viejo); return viejo;
  }
  function aRigido(s) {
    const z = s.z, b = tomarRig();
    b.p.set(s.p); b.pp.set(s.pp); b.o.set(s.p);
    let vx = 0, vy = 0, vz = 0; for (let i = 0; i < NP; i++) { const k = i * 3; vx += s.p[k] - s.o[k]; vy += s.p[k + 1] - s.o[k + 1]; vz += s.p[k + 2] - s.o[k + 2]; }
    b.vx = vx / NP / PASO_FIS; b.vy = vy / NP / PASO_FIS; b.vz = vz / NP / PASO_FIS;
    b.z = z; b.esc = s.esc; b.g = s.g; b.pesado = s.pesado; b.t = 0; b.quieto = 0; b.orden = ++orden; b.candT = 0; b.tocoPecho = s.tocoPecho; b.apoyo = 0;
    s.z = null; z.rag = b; candidatos(b); est.aRigido++;
    return b;
  }
  function rigidoDesde(z) { // un dormido que se quedó sin apoyo (se hundió el de abajo): cae como bloque
    if (z.rag || !z.tienePts) return;
    const b = tomarRig(); b.p.set(z.ultPts); b.pp.set(z.ultPts); b.o.set(z.ultPts); b.vx = b.vy = b.vz = 0;
    b.z = z; z.rag = b; z.dormido = false; z.mOk = false; b.esc = (z.g.scale.x + z.g.scale.y + z.g.scale.z) / 3; b.g = z.T.jefe ? 10.5 : 15; b.pesado = !!z.T.jefe;
    b.t = 0; b.quieto = 0; b.orden = ++orden; b.candT = 0; b.tocoPecho = true; b.apoyo = 0; candidatos(b);
  }
  // baja el cuerpo hasta lo primero que tenga abajo (piso o techo de un obstáculo). Para los casos de apuro.
  function asentarYa(s) {
    const P = s.p; if (!s.nCand) candidatos(s);
    let gap = Infinity;
    for (let i = 0; i < NP; i++) {
      const k = i * 3, x = P[k], y = P[k + 1], z = P[k + 2], rr = RAD[i] * s.esc;
      let sop = piso(local(x, z, _l).d);
      for (let c = 0; c < s.nCand; c++) { const t = techoEn(s.cand[c], x, z, rr); if (t > sop && t <= y - rr + 0.12) sop = t; }
      gap = Math.min(gap, y - rr - sop);
    }
    if (gap > 0 && gap < 50) for (let i = 0; i < NP; i++) P[i * 3 + 1] -= gap;
    s.o.set(P); s.pp.set(P); est.asentados++;
  }
  // ¿hay un techo de obstáculo debajo de (x, z)? devuelve su altura o -Infinity
  function techoEn(c, x, z, r) {
    if (c.cajas) {
      let t = -Infinity;
      for (const k of c.cajas) { const px = x - k.cx, pz = z - k.cz, lx = px * k.c - pz * k.s, lz = px * k.s + pz * k.c; if (Math.abs(lx) < k.hx + r * 0.5 && Math.abs(lz) < k.hz + r * 0.5 && k.y1 > t) t = k.y1; }
      return t;
    }
    return (x - c.x) ** 2 + (z - c.z) ** 2 < (c.r + r * 0.5) ** 2 ? c.top : -Infinity;
  }

  // ---------- choques entre cadáveres: los cuerpos se apilan en vez de atravesarse ----------
  function contraCuerpos(s, P, aplicar) {
    const L = cuerpos(); if (!L) return 0;
    const z = s.z, esc = s.esc;
    const mx = (P[0] + P[3] + P[6] + P[9]) * 0.25, my = (P[1] + P[4] + P[7] + P[10]) * 0.25, mz = (P[2] + P[5] + P[8] + P[11]) * 0.25;
    let n = 0;
    for (let q = 0; q < L.length; q++) {
      const o = L[q]; if (o === z || o.vivo || o.hundir || !o.yaRag) continue;
      const r = o.rag, Q = r ? r.p : o.tienePts ? o.ultPts : null; if (!Q) continue;
      const e2 = r ? r.esc : o.esc;
      const qx = (Q[0] + Q[3] + Q[6] + Q[9]) * 0.25, qy = (Q[1] + Q[4] + Q[7] + Q[10]) * 0.25, qz = (Q[2] + Q[5] + Q[8] + Q[11]) * 0.25;
      const lim = 1.15 * (esc + e2); if ((qx - mx) ** 2 + (qy - my) ** 2 + (qz - mz) ** 2 > lim * lim) continue;
      const mitad = r && !r.rig ? 0.5 : 1; // contra otro ragdoll activo cada uno se corre la mitad
      for (let i = 0; i < NP; i++) {
        const k = i * 3, ri = RAD[i] * esc * 0.9;
        for (let j = 0; j < NP; j++) {
          const m = j * 3, rr = ri + RAD[j] * e2 * 0.9;
          const ex = P[k] - Q[m], ey = P[k + 1] - Q[m + 1], ez = P[k + 2] - Q[m + 2], d2 = ex * ex + ey * ey + ez * ez;
          if (d2 >= rr * rr) continue;
          const d = Math.sqrt(d2) || 1e-4, f = (rr - d) / d * mitad;
          if (aplicar) { P[k] += ex * f; P[k + 1] += ey * f; P[k + 2] += ez * f; if (ey > 0.3 * d) s.toca[i] = 1; }
          n++;
          if (!aplicar) { _nr.x = ex * f; _nr.y = ey * f; _nr.z = ez * f; return n; }
        }
      }
    }
    return n;
  }

  function sim(dt, camX = 0, camZ = 0) {
    for (let si = 0; si < MAXR; si++) { const s = slots[si]; if (s.z) simRag(s, dt, camX, camZ); }
    for (let bi = 0; bi < MAXB; bi++) { const b = rigs[bi]; if (b.z) simRig(b, dt); }
  }
  function simRag(s, dt, camX, camZ) {
    const z = s.z;
    s.pp.set(s.p);
    s.t += dt;
    const P = s.p, O = s.o, g = s.g * dt * dt, esc = s.esc, toca = s.toca, vmax = VMAX * dt, vmax2 = vmax * vmax;
    let vyPecho = 0;
    for (let i = 0; i < NP; i++) {
      const k = i * 3;
      let vx = (P[k] - O[k]) * 0.997, vy = (P[k + 1] - O[k + 1]) * 0.997, vz = (P[k + 2] - O[k + 2]) * 0.997;
      const v2 = vx * vx + vy * vy + vz * vz; if (v2 > vmax2) { const f = vmax / Math.sqrt(v2); vx *= f; vy *= f; vz *= f; }
      O[k] = P[k]; O[k + 1] = P[k + 1]; O[k + 2] = P[k + 2];
      P[k] += vx; P[k + 1] += vy - g; P[k + 2] += vz; toca[i] = 0;
      if (i === 2 || i === 3) vyPecho = Math.min(vyPecho, vy);
    }
    if ((s.candT -= dt) <= 0) {
      s.candT = 0.1; candidatos(s);
      const dx = P[0] - camX, dz = P[2] - camZ; s.iters = dx * dx + dz * dz > 625 ? 2 : itersCerca; // lejos de la cámara, menos iteraciones
    }
    // barrido (CCD): un punto rápido no puede saltar al otro lado de un banco o de la tapa de un contenedor
    for (let i = 0; i < NP; i++) {
      const k = i * 3, rr = RAD[i] * esc, ex = P[k] - O[k], ey = P[k + 1] - O[k + 1], ez = P[k + 2] - O[k + 2];
      if (ex * ex + ey * ey + ez * ez < rr * rr * 0.36) continue;
      let tMin = 1;
      for (let c = 0; c < s.nCand; c++) {
        const cj = s.cand[c].cajas; if (!cj) continue;
        for (let q = 0; q < cj.length; q++) { const t = rayoCaja(O[k], O[k + 1], O[k + 2], ex, ey, ez, cj[q], _nr, rr); if (t > 0 && t < tMin) tMin = t; }
      }
      if (tMin < 1) { const t = Math.max(0, tMin - 0.02); P[k] = O[k] + ex * t; P[k + 1] = O[k + 1] + ey * t; P[k + 2] = O[k + 2] + ez * t; toca[i] = 1; est.ccd++; }
    }
    local((P[0] + P[3]) * 0.5, (P[2] + P[5]) * 0.5, _l);
    const m = muestras[_l.i], mpx = m.p.x, mpz = m.p.z, nx = m.n.x, nz = m.n.z;
    const iters = s.iters;
    for (let it = 0; it < iters; it++) {
      for (let j = 0; j < NR; j++) {
        const r = RES[j], a = r[0] * 3, b = r[1] * 3;
        const ex = P[b] - P[a], ey = P[b + 1] - P[a + 1], ez = P[b + 2] - P[a + 2];
        const d = Math.sqrt(ex * ex + ey * ey + ez * ez) || 1e-6, lo = s.L[j * 2], hi = s.L[j * 2 + 1];
        let obj; if (d < lo) obj = lo; else if (d > hi) obj = hi; else continue;
        const f = (d - obj) / d * 0.5;
        P[a] += ex * f; P[a + 1] += ey * f; P[a + 2] += ez * f; P[b] -= ex * f; P[b + 1] -= ey * f; P[b + 2] -= ez * f;
      }
      if (it === iters - 1) contraCuerpos(s, P, true);
      // huesos: dos muestras por segmento contra obstáculos y piso; la corrección se reparte entre las puntas
      for (let h = 0; h < NH; h++) {
        const a = HUESOS[h * 2] * 3, b = HUESOS[h * 2 + 1] * 3, ra = RAD[HUESOS[h * 2]] * esc, rb = RAD[HUESOS[h * 2 + 1]] * esc;
        for (let q = 0; q < 2; q++) {
          const t = TS[q], u = 1 - t, r = ra * u + rb * t;
          const sx = P[a] * u + P[b] * t, sy = P[a + 1] * u + P[b + 1] * t, sz = P[a + 2] * u + P[b + 2] * t;
          _S[0] = sx; _S[1] = sy; _S[2] = sz;
          const yPrev = O[a + 1] * u + O[b + 1] * t;
          for (let c = 0; c < s.nCand; c++) sacarPunto(_S, 0, r, yPrev, s.cand[c]);
          const f = piso((_S[0] - mpx) * nx + (_S[2] - mpz) * nz) + r; if (_S[1] < f) _S[1] = f;
          caras(_S, 0, r * 0.8, mpx, mpz, nx, nz);
          const cx = _S[0] - sx, cy = _S[1] - sy, cz = _S[2] - sz;
          if (cx * cx + cy * cy + cz * cz < 1e-10) continue;
          const w = 1 / (u * u + t * t);
          P[a] += cx * u * w; P[a + 1] += cy * u * w; P[a + 2] += cz * u * w;
          P[b] += cx * t * w; P[b + 1] += cy * t * w; P[b + 2] += cz * t * w;
          toca[HUESOS[h * 2]] = 1; toca[HUESOS[h * 2 + 1]] = 1;
        }
      }
      for (let i = 0; i < NP; i++) {
        const k = i * 3, rr = RAD[i] * esc;
        for (let c = 0; c < s.nCand; c++) if (sacarPunto(P, k, rr, O[k + 1], s.cand[c])) toca[i] = 1;
        // piso: con escalones (el muro y el cordón frenan de costado en vez de subir)
        let f = piso((P[k] - mpx) * nx + (P[k + 2] - mpz) * nz) + rr;
        if (P[k + 1] < f) {
          const fO = piso((O[k] - mpx) * nx + (O[k + 2] - mpz) * nz);
          if (f - rr > fO + 0.3 && O[k + 1] < f - 0.05) { P[k] = O[k]; P[k + 2] = O[k + 2]; f = fO + rr; }
          if (P[k + 1] < f) { P[k + 1] = f; toca[i] = 1; }
        }
        if (caras(P, k, rr, mpx, mpz, nx, nz)) toca[i] = 1;
      }
    }
    // roce y rebote en los puntos que tocan algo; ¿se quedó quieto?
    let max2 = 0, ok = true, apoyo = 0;
    for (let i = 0; i < NP; i++) {
      const k = i * 3;
      if (toca[i]) {
        apoyo++;
        O[k] = P[k] - (P[k] - O[k]) * 0.8; O[k + 2] = P[k + 2] - (P[k + 2] - O[k + 2]) * 0.8;
        const vy = P[k + 1] - O[k + 1]; if (vy < 0) O[k + 1] = P[k + 1] + vy * 0.2;
      }
      const ex = P[k] - O[k], ey = P[k + 1] - O[k + 1], ez = P[k + 2] - O[k + 2], v2 = ex * ex + ey * ey + ez * ez;
      if (v2 > max2) max2 = v2;
      if (!(P[k] === P[k] && P[k + 1] === P[k + 1] && P[k + 2] === P[k + 2])) ok = false;
    }
    s.apoyo = apoyo;
    if (!ok) { // nunca debería pasar: vuelve a la pose del paso anterior y cae como bloque
      z.nan = (z.nan || 0) + 1; est.nan++; P.set(s.pp); O.set(s.pp); aRigido(s); return;
    }
    if (!s.tocoPecho && (toca[2] || toca[3])) {
      s.tocoPecho = true;
      if (cb.alGolpe) cb.alGolpe(z, (P[6] + P[9]) * 0.5, (P[7] + P[10]) * 0.5, (P[8] + P[11]) * 0.5, -vyPecho / dt, s.pesado);
    }
    if (max2 < 3.5e-6 && s.t > 0.45) s.quieto += dt; else s.quieto = 0;
    // "carpa": quieto con la cadera en el aire apoyado en hombros y pies (la fricción lo traba). Se lo empuja de costado para que se desplome.
    if (s.quieto > 0.08 && !toca[0] && !toca[1] && s.empujes < 8) {
      const hy = (P[1] + P[4]) * 0.5, fh = piso(((P[0] + P[3]) * 0.5 - mpx) * nx + ((P[2] + P[5]) * 0.5 - mpz) * nz);
      if (hy - fh > 0.42 * esc) {
        let lx = P[3] - P[0], lz = P[5] - P[2]; const ll = Math.hypot(lx, lz) || 1; lx /= ll; lz /= ll;
        const sg = (s.empujes & 1) ? -1 : 1, kk = 1.2 * PASO_FIS * sg;
        for (let i = 0; i < 2; i++) { O[i * 3] -= lx * kk; O[i * 3 + 2] -= lz * kk; O[i * 3 + 1] += 0.4 * PASO_FIS; }
        s.quieto = 0; s.empujes++;
      }
    }
    // sentado, apoyado en las manos: los hombros quedan arriba sin tocar nada. Se lo empuja para que termine de caer.
    if (s.quieto > 0.08 && !toca[2] && !toca[3] && s.empujes < 8) {
      const sx = (P[6] + P[9]) * 0.5, sy = (P[7] + P[10]) * 0.5, sz = (P[8] + P[11]) * 0.5;
      const fh = piso((sx - mpx) * nx + (sz - mpz) * nz);
      if (sy - fh > 0.42 * esc) {
        let ex = sx - (P[0] + P[3]) * 0.5, ez = sz - (P[2] + P[5]) * 0.5; let el = Math.hypot(ex, ez);
        if (el < 0.05) { ex = P[3] - P[0]; ez = P[5] - P[2]; el = Math.hypot(ex, ez) || 1; }
        const kk = 1.3 * PASO_FIS / el;
        for (let i = 2; i <= 4; i++) { O[i * 3] -= ex * kk; O[i * 3 + 2] -= ez * kk; }
        for (let i = 5; i <= 6; i++) { O[i * 3] += ex * kk * 0.6; O[i * 3 + 2] += ez * kk * 0.6; } // las manos resbalan para atrás
        s.quieto = 0; s.empujes++;
      }
    }
    if (s.quieto > 0.3 && apoyo >= 2) dormir(s);
    else if (s.t > (s.pesado ? 7 : 5)) { if (apoyo >= 2 && max2 < 1e-4) dormir(s); else aRigido(s); }
  }
  function simRig(b, dt) {
    b.pp.set(b.p); b.t += dt;
    const P = b.p, esc = b.esc;
    b.vy -= b.g * dt;
    const sp = Math.hypot(b.vx, b.vy, b.vz), lim = VMAX; if (sp > lim) { b.vx *= lim / sp; b.vy *= lim / sp; b.vz *= lim / sp; }
    const dx = b.vx * dt, dy = b.vy * dt, dz = b.vz * dt;
    for (let i = 0; i < NP; i++) { const k = i * 3; P[k] += dx; P[k + 1] += dy; P[k + 2] += dz; }
    if ((b.candT -= dt) <= 0) { b.candT = 0.1; candidatos(b); }
    local((P[0] + P[3]) * 0.5, (P[2] + P[5]) * 0.5, _l);
    const m = muestras[_l.i], mpx = m.p.x, mpz = m.p.z, nx = m.n.x, nz = m.n.z;
    let contacto = false, bloqueo = false;
    for (let pasada = 0; pasada < 2; pasada++) {
      let cx = 0, cy = 0, cz = 0;
      for (let i = 0; i < NP; i++) {
        const k = i * 3, rr = RAD[i] * esc;
        const f = piso((P[k] - mpx) * nx + (P[k + 2] - mpz) * nz) + rr;
        if (P[k + 1] < f) {
          const fO = piso((P[k] - dx - mpx) * nx + (P[k + 2] - dz - mpz) * nz);
          if (!bloqueo && f - rr > fO + 0.3 && P[k + 1] - dy < f - 0.05) bloqueo = true; // contra el muro: frena de costado
          else if (f - P[k + 1] > cy) cy = f - P[k + 1];
        }
        _S[0] = P[k]; _S[1] = P[k + 1]; _S[2] = P[k + 2];
        for (let c = 0; c < b.nCand; c++) sacarPunto(_S, 0, rr, P[k + 1] - dy, b.cand[c]);
        caras(_S, 0, rr, mpx, mpz, nx, nz);
        const ex = _S[0] - P[k], ey = _S[1] - P[k + 1], ez = _S[2] - P[k + 2];
        if (Math.abs(ex) > Math.abs(cx)) cx = ex; if (ey > cy) cy = ey; if (Math.abs(ez) > Math.abs(cz)) cz = ez;
      }
      if (b.nCand) for (let h = 0; h < NH; h++) { // los huesos tampoco atraviesan (el bloque se mueve entero)
        const a = HUESOS[h * 2] * 3, c2 = HUESOS[h * 2 + 1] * 3, ra = RAD[HUESOS[h * 2]] * esc, rb = RAD[HUESOS[h * 2 + 1]] * esc;
        for (let q = 0; q < 2; q++) {
          const t = TS[q], u = 1 - t, r = ra * u + rb * t;
          const sx = P[a] * u + P[c2] * t, sy = P[a + 1] * u + P[c2 + 1] * t, sz = P[a + 2] * u + P[c2 + 2] * t;
          _S[0] = sx; _S[1] = sy; _S[2] = sz;
          for (let c = 0; c < b.nCand; c++) sacarPunto(_S, 0, r, sy - dy, b.cand[c]);
          const ex = _S[0] - sx, ey = _S[1] - sy, ez = _S[2] - sz;
          if (Math.abs(ex) > Math.abs(cx)) cx = ex; if (ey > cy) cy = ey; if (Math.abs(ez) > Math.abs(cz)) cz = ez;
        }
      }
      if (bloqueo) { for (let i = 0; i < NP; i++) { P[i * 3] -= dx; P[i * 3 + 2] -= dz; } b.vx *= -0.2; b.vz *= -0.2; bloqueo = false; contacto = true; continue; }
      if (cx === 0 && cy === 0 && cz === 0) { // ¿se apoya en otro cadáver?
        if (contraCuerpos(b, P, false)) { cx = _nr.x; cy = Math.max(0, _nr.y); cz = _nr.z; } else break;
      }
      contacto = true;
      for (let i = 0; i < NP; i++) { const k = i * 3; P[k] += cx; P[k + 1] += cy; P[k + 2] += cz; }
      if (cy > 0 && b.vy < 0) b.vy = -b.vy * 0.15;
      if (cx || cz) { const l = Math.hypot(cx, cz) || 1, vn = (b.vx * cx + b.vz * cz) / l; if (vn < 0) { b.vx -= cx / l * vn * 1.2; b.vz -= cz / l * vn * 1.2; } }
    }
    if (contacto) { const f = Math.exp(-8 * dt); b.vx *= f; b.vz *= f; b.apoyo = 3; } else b.apoyo = 0;
    if (contacto && Math.hypot(b.vx, b.vy, b.vz) < 0.35) b.quieto += dt; else b.quieto = 0;
    if (!b.tocoPecho && contacto) { b.tocoPecho = true; if (cb.alGolpe) cb.alGolpe(b.z, (P[6] + P[9]) * 0.5, (P[7] + P[10]) * 0.5, (P[8] + P[11]) * 0.5, -b.vy, b.pesado); }
    if (b.quieto > 0.15) dormir(b);
    else if (b.t > 6) { asentarYa(b); dormir(b); }
  }
  // escribe la pose del ragdoll (interpolada entre los dos últimos pasos) en el esqueleto del zombi
  function posar(s, alfa = 1) {
    const z = s.z, A = s.pp, B = s.p;
    let P = B;
    if (alfa < 0.999) { P = _PI; for (let k = 0; k < N3; k++) P[k] = A[k] + (B[k] - A[k]) * alfa; }
    const mhx = (P[0] + P[3]) * 0.5, mhy = (P[1] + P[4]) * 0.5, mhz = (P[2] + P[5]) * 0.5;
    const msx = (P[6] + P[9]) * 0.5, msy = (P[7] + P[10]) * 0.5, msz = (P[8] + P[11]) * 0.5;
    _up.set(msx - mhx, msy - mhy, msz - mhz); const l = _up.length(); if (!(l > 1e-5)) return; _up.multiplyScalar(1 / l);
    _rt.set(P[9] - P[6] + P[3] - P[0], P[10] - P[7] + P[4] - P[1], P[11] - P[8] + P[5] - P[2]);
    _rt.addScaledVector(_up, -_rt.dot(_up));
    if (_rt.lengthSq() < 1e-8) { _rt.set(1, 0, 0).addScaledVector(_up, -_up.x); if (_rt.lengthSq() < 1e-8) _rt.set(0, 0, 1); }
    _rt.normalize(); _fw.crossVectors(_rt, _up);
    _m4.makeBasis(_rt, _up, _fw); z.g.quaternion.setFromRotationMatrix(_m4);
    const sx = z.g.scale.x, sy = z.g.scale.y, sz = z.g.scale.z;
    z.g.position.set(mhx - _up.x * 0.86 * sy, mhy - _up.y * 0.86 * sy, mhz - _up.z * 0.86 * sy);
    z.cuerpo.rotation.set(0, 0, 0); z.cuerpo.position.set(0, 0.86, 0); z.cadera.position.set(0, 0.9, 0); z.cadera.rotation.set(0, 0, 0);
    _qi.copy(z.g.quaternion).invert();
    _isx = 1 / sx; _isy = 1 / sy; _isz = 1 / sz;
    z.cabeza.quaternion.setFromUnitVectors(_Y, dirLocal(P[12] - msx, P[13] - msy, P[14] - msz));
    for (let j = 0; j < 2; j++) {
      const sh = (2 + j) * 3, ha = (5 + j) * 3, hi = j * 3, fo = (7 + j) * 3;
      z.hombros[j].quaternion.setFromUnitVectors(_NY, dirLocal(P[ha] - P[sh], P[ha + 1] - P[sh + 1], P[ha + 2] - P[sh + 2]));
      z.caderas[j].quaternion.setFromUnitVectors(_NY, dirLocal(P[fo] - P[hi], P[fo + 1] - P[hi + 1], P[fo + 2] - P[hi + 2]));
    }
    z.mOk = false;
  }
  function dirLocal(x, y, zz) { _a.set(x, y, zz).applyQuaternion(_qi); _a.x *= _isx; _a.y *= _isy; _a.z *= _isz; const n = _a.length(); if (n > 1e-6) _a.multiplyScalar(1 / n); else _a.set(0, 1, 0); return _a; }
  function posarTodos(alfa = 1) { for (let i = 0; i < MAXR; i++) if (slots[i].z) posar(slots[i], alfa); for (let i = 0; i < MAXB; i++) if (rigs[i].z) posar(rigs[i], alfa); }

  // ---------- explosión: un solo empujón radial para todos los cuerpos a la vez ----------
  // impulso por punto = fuerza · (1 - (d/R)²), hacia afuera desde el centro y un poco hacia arriba
  function explosion(cx, cy, cz, R, F) {
    const L = cuerpos(); if (!L) return 0;
    let n = 0;
    for (let q = 0; q < L.length; q++) {
      const z = L[q]; if (z.vivo || z.hundir || !z.yaRag) continue;
      let s = z.rag; const Q = s ? s.p : z.tienePts ? z.ultPts : null; if (!Q) continue;
      const mx = (Q[0] + Q[3] + Q[6] + Q[9]) * 0.25, mz = (Q[2] + Q[5] + Q[8] + Q[11]) * 0.25;
      const dc = Math.hypot(mx - cx, mz - cz); if (dc > R) continue;
      // dormido: vuelve a ragdoll si hay ranura libre; si no, cae como cuerpo barato con el mismo empujón
      if (!s) { if (activosRag() < capRag) s = despertar(z); else { rigidoDesde(z); s = z.rag; } if (!s) continue; }
      const esc = s.esc, masa = s.pesado ? 4 : Math.pow(Math.max(1, esc), 1.3);
      const P = s.p, O = s.o; let sx = 0, sy = 0, sz = 0;
      for (let i = 0; i < NP; i++) {
        const k = i * 3;
        let ex = P[k] - cx, ey = P[k + 1] - cy, ez = P[k + 2] - cz;
        const dh = Math.hypot(ex, ez), d = Math.hypot(dh, ey);
        if (dh < 0.05) { ex = Math.cos(i * 2.4); ez = Math.sin(i * 2.4); } // justo encima: para cualquier lado
        const hl = Math.hypot(ex, ez) || 1; ex /= hl; ez /= hl;
        const k01 = Math.max(0, 1 - (Math.min(d, R) / R) ** 2), mag = F * k01 / masa * (0.9 + 0.2 * ((i * 7) % 5) / 4);
        const up = 0.55 + 0.25 * (1 - k01);
        if (s.rig) { sx += ex * mag; sy += mag * up; sz += ez * mag; }
        else { O[k] -= ex * mag * PASO_FIS; O[k + 2] -= ez * mag * PASO_FIS; O[k + 1] -= mag * up * PASO_FIS; }
      }
      if (s.rig) { s.vx += sx / NP; s.vy += sy / NP; s.vz += sz / NP; }
      s.quieto = 0; s.t = Math.min(s.t, 1); s.orden = ++orden; n++;
    }
    return n;
  }


  const sangre = crearSangre(scene);
  const cero = new THREE.Matrix4().makeScale(0, 0, 0), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color();
  // ---------- marcas de bala: agujero que nace al rojo vivo y se enfría ----------
  const NM_ = 48; let iM = 0, usadosM = 0;
  const texM = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d');
    const g = x.createRadialGradient(16, 16, 0, 16, 16, 15); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.95)'); g.addColorStop(0.55, 'rgba(160,160,160,0.6)'); g.addColorStop(1, 'rgba(120,120,120,0)');
    x.fillStyle = g; x.beginPath(); x.arc(16, 16, 15, 0, 7); x.fill();
    return new THREE.CanvasTexture(c);
  })();
  const geoM = new THREE.PlaneGeometry(1, 1);
  const extraM = new THREE.InstancedBufferAttribute(new Float32Array(NM_ * 2), 2); extraM.setUsage(THREE.DynamicDrawUsage); geoM.setAttribute('aExtra', extraM);
  const matM = new THREE.MeshBasicMaterial({ map: texM, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  opacidad(matM, false);
  const imM = new THREE.InstancedMesh(geoM, matM, NM_);
  imM.instanceMatrix.setUsage(THREE.DynamicDrawUsage); imM.setColorAt(0, new THREE.Color()); imM.instanceColor.setUsage(THREE.DynamicDrawUsage);
  imM.frustumCulled = false; imM.count = 0; imM.renderOrder = 2; scene.add(imM);
  const mEdad = new Float32Array(NM_), mVida = new Float32Array(NM_), mTipo = new Uint8Array(NM_);
  for (let i = 0; i < NM_; i++) imM.setMatrixAt(i, cero);
  const CAL_M = new THREE.Color(4, 1.5, 0.35), FRIO = [new THREE.Color(0.05, 0.05, 0.055), new THREE.Color(0.13, 0.08, 0.04), new THREE.Color(0.09, 0.09, 0.085)];
  const _n = new THREE.Vector3(), _Z = new THREE.Vector3(0, 0, 1), _qr = new THREE.Quaternion();
  let acM = 0;
  const marcas = {
    // tipo: 0 metal, 1 madera, 2 piedra/asfalto
    marca(p, nx, ny, nz, tipo) {
      const i = iM; iM = (iM + 1) % NM_;
      _n.set(nx, ny, nz).normalize(); _q.setFromUnitVectors(_Z, _n); _qr.setFromAxisAngle(_Z, Math.random() * 6.28); _q.multiply(_qr);
      const s = tipo === 1 ? 0.1 : 0.075 + Math.random() * 0.03;
      _m4.compose(_p.set(p.x + _n.x * 0.012, p.y + _n.y * 0.012, p.z + _n.z * 0.012), _q, _s.set(s, s, s));
      imM.setMatrixAt(i, _m4); imM.instanceMatrix.needsUpdate = true;
      mEdad[i] = 0; mVida[i] = 10; mTipo[i] = tipo; extraM.array[i * 2] = 1; extraM.needsUpdate = true;
      imM.setColorAt(i, tipo === 0 ? CAL_M : FRIO[tipo]); imM.instanceColor.needsUpdate = true;
      if (i + 1 > usadosM) { usadosM = i + 1; imM.count = usadosM; }
    },
    sim(dt) {
      acM += dt; if (acM < 1 / 40) return; const d = acM; acM = 0;
      let col = false, op = false;
      for (let i = 0; i < usadosM; i++) {
        if (mVida[i] <= 0) continue;
        mEdad[i] += d; const e = mEdad[i];
        if (mTipo[i] === 0 && e < 0.9) { _c.copy(CAL_M).lerp(FRIO[0], Math.min(1, e / 0.9)); imM.setColorAt(i, _c); col = true; }
        else if (mTipo[i] === 0 && e - d < 0.9) { imM.setColorAt(i, FRIO[0]); col = true; }
        const resto = mVida[i] - e;
        if (resto < 2) { extraM.array[i * 2] = Math.max(0, resto / 2); op = true; }
        if (resto <= 0) { mVida[i] = 0; imM.setMatrixAt(i, cero); imM.instanceMatrix.needsUpdate = true; }
      }
      if (col) imM.instanceColor.needsUpdate = true; if (op) extraM.needsUpdate = true;
    },
    limpiar() { mVida.fill(0); for (let i = 0; i < NM_; i++) imM.setMatrixAt(i, cero); imM.instanceMatrix.needsUpdate = true; usadosM = 0; imM.count = 0; },
    get activas() { let n = 0; for (let i = 0; i < usadosM; i++) if (mVida[i] > 0) n++; return n; }
  };


  return {
    iniciar, sim, posarTodos, dormir, sangre, marcas, explosion, grilla, est,
    soltar(z) { if (z.rag) { z.rag.z = null; z.rag = null; } },
    // otro golpe a un cadáver: si se está moviendo se suma el impulso cerca del punto; si estaba quieto, se despierta
    patear(z, dx, dz, h, v, punto) {
      let s = z.rag;
      if (s && s.rig) { s.vx += dx * h * 0.7; s.vz += dz * h * 0.7; s.vy += v * 0.7; s.quieto = 0; s.t = Math.min(s.t, 3); return; }
      if (!s) s = despertar(z);
      if (!s) { iniciar(z, dx, dz, h, v, 1, 'normal'); return; }
      const P = s.p, O = s.o;
      for (let i = 0; i < NP; i++) {
        const k = i * 3; let w = 1;
        if (punto) w = Math.max(0.15, 1 - Math.hypot(P[k] - punto.x, P[k + 1] - punto.y, P[k + 2] - punto.z) / (0.9 * s.esc));
        O[k] -= dx * h * w * PASO_FIS; O[k + 1] -= v * w * PASO_FIS; O[k + 2] -= dz * h * w * PASO_FIS;
      }
      s.quieto = 0; s.t = Math.min(s.t, 3); s.orden = ++orden;
    },
    // se empieza a hundir un cadáver: los que estaban apoyados encima caen (no quedan flotando)
    alHundir(z) {
      const L = cuerpos(); if (!L) return;
      const A = z.rag ? z.rag.p : z.tienePts ? z.ultPts : null; if (!A) return;
      for (let q = 0; q < L.length; q++) {
        const o = L[q]; if (o === z || o.vivo || o.hundir || o.rag || !o.tienePts) continue;
        const B = o.ultPts; let encima = false;
        for (let i = 0; i < NP && !encima; i++) for (let j = 0; j < NP; j++) {
          const ex = B[i * 3] - A[j * 3], ez = B[i * 3 + 2] - A[j * 3 + 2], ey = B[i * 3 + 1] - A[j * 3 + 1];
          if (ey > 0.02 && ex * ex + ez * ez < 0.3 * 0.3 && ey < 0.6) { encima = true; break; }
        }
        if (encima) rigidoDesde(o);
      }
    },
    // puntos del cuerpo (activos o los últimos al dormirse) para apuntarle a un cadáver
    puntos(z) { return z.rag ? z.rag.p : z.tienePts ? z.ultPts : null; },
    config(c) { capBase = Math.min(MAXR, c.rag); capRag = Math.max(2, Math.round(capBase * [1, 0.75, 0.5][nivel])); sangre.config(c); },
    // nivel de carga (0 normal, 1 y 2 más liviano): baja ranuras de ragdoll e iteraciones
    set nivel(n) { nivel = Math.max(0, Math.min(2, n)); capRag = Math.max(2, Math.round(capBase * [1, 0.75, 0.5][nivel])); itersCerca = [4, 3, 3][nivel]; },
    get nivel() { return nivel; },
    limpiar() { for (const s of slots) { if (s.z) s.z.rag = null; s.z = null; } for (const b of rigs) { if (b.z) b.z.rag = null; b.z = null; } sangre.limpiar(); marcas.limpiar(); },
    get activos() { let n = 0; for (const s of slots) if (s.z) n++; return n; },
    get baratos() { let n = 0; for (const b of rigs) if (b.z) n++; return n; },
    get capRag() { return capRag; },
    techoEn, RAD, HUESOS, TS
  };
}
