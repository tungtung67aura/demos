// v8 · El barrio: lo que hace que la rambla sea Montevideo y no cualquier costa.
// Pintadas de hinchada en el muro, la parrilla al paso con su humo, un tablado de carnaval con lamparitas,
// la feria del domingo, banderines cruzando la calle, carteles de calle, el ombú, pescadores en las rocas del faro.
// Todo sale de UN atlas pintado en canvas al cargar: por mapa son 3 draw calls (iluminado, sin luz y el humo).
import * as THREE from 'https://esm.sh/three@0.160.0';
import { aMundo, muestras, piso } from './world.js';

const tang = i => muestras[Math.round(i)].t;
const yawN = i => { const t = tang(i); return Math.atan2(-t.z, t.x); }; // z local hacia la ciudad
const W = 2048, H = 1024;

// ---------- el atlas ----------
// regiones [x, y, w, h] en píxeles del canvas
const R = {
  blanco: [2, 2, 12, 12],
  graf: k => [(k % 2) * 1024, 16 + (k / 2 | 0) * 128, 1024, 128],     // 10 pintadas de 1024x128 (y 16..656)
  calle: k => [(k % 4) * 256, 660, 256, 64],                          // 4 carteles de calle
  tablado: [1024, 660, 512, 192], parrilla: [1536, 660, 512, 96], feria: [1536, 760, 512, 96],
  toldo: k => [k * 128, 732, 128, 32],                                // 6 lonas rayadas
  murga: [0, 770, 512, 128], cosecha: [512, 770, 256, 64], sombra: [768, 770, 256, 128]
};
const GRAF = [
  // [texto, relleno, contorno, fondo/mancha, estilo]
  ['VAMO ARRIBA', '#f6c51b', '#111', ['#111', '#f6c51b'], 'rayas'],
  ['DALE BOLSO', '#ffffff', '#c8102e', ['#1b3d8f', '#c8102e', '#ffffff'], 'bandas'],
  ['SOY CELESTE', '#ffffff', '#1f5fae', ['#6cb4ee'], 'nube'],
  ['MANYA 1891', '#111', '#f6c51b', ['#f6c51b'], 'nube'],
  ['TRICOLOR DE CORAZÓN', '#c8102e', '#fff', ['#1b3d8f'], 'nube'],
  ['MURGA O NADA', '#f2e14a', '#5a1a7a', ['#7a2a9a', '#e8582a'], 'confeti'],
  ['NO SE VENDE', '#fff', '#222', ['#2a8a4a'], 'nube'],
  ['FUERA ZOMBIS', '#ff3b2a', '#fff', null, 'tag'],
  ['TOMATE UN MATE', '#a7e05a', '#1a3a10', ['#3a6a2a'], 'nube'],
  ['LA GARRA CHARRÚA', '#fff', '#1f5fae', ['#6cb4ee', '#ffffff'], 'rayasH']
];
const CALLES = [['RAMBLA', 'GRAN BRETAÑA'], ['EJIDO', ''], ['YI', ''], ['ANDES', '']];

function pintarAtlas(cv) {
  const g = cv.getContext('2d'); g.clearRect(0, 0, W, H);
  const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  g.fillStyle = '#fff'; g.fillRect(0, 0, 16, 16);
  const fuente = (px, extra = '') => `${extra} ${px}px "Bangers", "Impact", "Arial Black", sans-serif`;
  GRAF.forEach(([txt, fill, borde, fondo, estilo], k) => {
    const [x, y, w, h] = R.graf(k); g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    // revoque gastado de base
    g.fillStyle = '#8a8478'; g.fillRect(x, y, w, h);
    for (let n = 0; n < 260; n++) { g.fillStyle = `rgba(${rnd() < 0.5 ? '40,36,30' : '200,194,180'},${0.05 + rnd() * 0.12})`; g.fillRect(x + rnd() * w, y + rnd() * h, 2 + rnd() * 30, 1 + rnd() * 6); }
    const cx = x + w / 2, cy = y + h / 2;
    if (estilo === 'rayas' && fondo) for (let s = 0; s < 14; s++) { g.fillStyle = fondo[s % 2]; g.beginPath(); g.moveTo(x + 120 + s * 56, y + 12); g.lineTo(x + 176 + s * 56, y + 12); g.lineTo(x + 146 + s * 56, y + h - 12); g.lineTo(x + 90 + s * 56, y + h - 12); g.fill(); }
    else if (estilo === 'bandas' && fondo) { const bw = 760 / 3; fondo.forEach((c, s) => { g.fillStyle = c; g.fillRect(x + 132 + s * bw, y + 14, bw, h - 28); }); }
    else if (estilo === 'rayasH' && fondo) for (let s = 0; s < 5; s++) { g.fillStyle = fondo[s % 2]; g.fillRect(x + 90, y + 14 + s * (h - 28) / 5, w - 180, (h - 28) / 5); }
    else if (fondo) { // nube de aerosol irregular
      for (let n = 0; n < 40; n++) { g.fillStyle = fondo[n % fondo.length]; g.beginPath(); g.ellipse(x + 120 + rnd() * (w - 240), cy + (rnd() - 0.5) * 30, 40 + rnd() * 60, 34 + rnd() * 16, 0, 0, 6.3); g.fill(); }
    }
    if (estilo === 'confeti') for (let n = 0; n < 90; n++) { g.fillStyle = ['#f2e14a', '#e8582a', '#3ac0e0', '#e83a8a', '#7ad04a'][n % 5]; g.fillRect(x + rnd() * w, y + rnd() * h, 6, 6); }
    const px = Math.min(104, 1500 / txt.length);
    g.font = fuente(px); g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    g.save(); g.translate(cx, cy + 4); g.rotate((rnd() - 0.5) * 0.06);
    g.lineWidth = 14; g.strokeStyle = borde; g.strokeText(txt, 0, 0);
    g.fillStyle = fill; g.fillText(txt, 0, 0);
    g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,.35)'; g.strokeText(txt, 3, 3);
    g.restore();
    // chorreados de pintura
    for (let n = 0; n < 9; n++) { const dx = cx + (rnd() - 0.5) * px * txt.length * 0.5; g.fillStyle = n % 2 ? fill : borde; g.fillRect(dx, cy + px * 0.3, 3, 10 + rnd() * 34); }
    // firma del grafitero
    g.font = fuente(26, 'italic'); g.fillStyle = 'rgba(20,20,20,.75)'; g.fillText(['la 25', 'barra sur', 'los del cerro', 'el flaco', 'dmc'][k % 5], x + w - 90, y + h - 22);
    g.restore();
  });
  CALLES.forEach(([a, b], k) => { // cartel de calle de Montevideo: azul con letras blancas y borde blanco
    const [x, y, w, h] = R.calle(k); g.fillStyle = '#1d4f9a'; g.fillRect(x, y, w, h); g.strokeStyle = '#fff'; g.lineWidth = 4; g.strokeRect(x + 5, y + 5, w - 10, h - 10);
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    if (b) { g.font = 'bold 15px Arial, sans-serif'; g.fillText(a, x + w / 2, y + 21); g.font = 'bold 22px Arial, sans-serif'; g.fillText(b, x + w / 2, y + 43); }
    else { g.font = 'bold 34px Arial, sans-serif'; g.fillText(a, x + w / 2, y + h / 2 + 2); }
  });
  { // telón del tablado
    const [x, y, w, h] = R.tablado; const gr = g.createLinearGradient(x, y, x, y + h); gr.addColorStop(0, '#2a0f4a'); gr.addColorStop(1, '#7a1a5a'); g.fillStyle = gr; g.fillRect(x, y, w, h);
    for (let n = 0; n < 16; n++) { g.fillStyle = ['#f2c230', '#e8582a', '#3ac0e0', '#e83a8a'][n % 4]; g.beginPath(); g.moveTo(x + n * 32, y); g.lineTo(x + n * 32 + 32, y); g.lineTo(x + n * 32 + 16, y + 26); g.fill(); }
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = fuente(70); g.lineWidth = 8; g.strokeStyle = '#1a0830'; g.strokeText('TABLADO', x + w / 2, y + 82); g.fillStyle = '#f6d24a'; g.fillText('TABLADO', x + w / 2, y + 82);
    g.font = fuente(40); g.strokeText('DEL BARRIO SUR', x + w / 2, y + 136); g.fillStyle = '#fff'; g.fillText('DEL BARRIO SUR', x + w / 2, y + 136);
    g.font = fuente(24); g.fillStyle = '#ffb0d8'; g.fillText('CARNAVAL · MURGAS · PARODISTAS · LUBOLOS', x + w / 2, y + 172);
  }
  { // cartel de la parrilla (neón)
    const [x, y, w, h] = R.parrilla; g.fillStyle = '#140804'; g.fillRect(x, y, w, h); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = '#ff6a20'; g.shadowBlur = 18; g.font = fuente(58); g.fillStyle = '#ffd890'; g.fillText('PARRILLA EL TANO', x + w / 2, y + 42); g.shadowBlur = 0;
    g.font = 'bold 18px Arial, sans-serif'; g.fillStyle = '#ff8a40'; g.fillText('CHORIPÁN · ASADO · MORCILLA · PAMPLONA', x + w / 2, y + 80);
  }
  { // cartel de la feria
    const [x, y, w, h] = R.feria; g.fillStyle = '#f0e6c8'; g.fillRect(x, y, w, h); g.strokeStyle = '#2a6a2a'; g.lineWidth = 6; g.strokeRect(x + 4, y + 4, w - 8, h - 8);
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = fuente(52); g.fillStyle = '#2a6a2a'; g.fillText('FERIA DEL DOMINGO', x + w / 2, y + 40);
    g.font = 'bold 18px Arial, sans-serif'; g.fillStyle = '#7a2a1a'; g.fillText('BOLSÓN DE VERDURA $90 · FRUTA DE ESTACIÓN', x + w / 2, y + 76);
  }
  [['#f4f0e4', '#c8281a'], ['#f4f0e4', '#1f5fae'], ['#f6c51b', '#111'], ['#f4f0e4', '#2a8a3a'], ['#e8582a', '#f6d24a'], ['#6cb4ee', '#f4f0e4']].forEach((c, k) => {
    const [x, y, w, h] = R.toldo(k); for (let s = 0; s < 8; s++) { g.fillStyle = c[s % 2]; g.fillRect(x + s * 16, y, 16, h); }
  });
  { // pasacalle de la murga
    const [x, y, w, h] = R.murga; g.fillStyle = '#f2ead0'; g.fillRect(x, y, w, h); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = fuente(62); g.fillStyle = '#5a1a7a'; g.fillText('¡LLEGÓ LA MURGA!', x + w / 2, y + 52); g.font = 'bold 20px Arial, sans-serif'; g.fillStyle = '#c8281a'; g.fillText('DESFILE DE LLAMADAS · BARRIO SUR Y PALERMO', x + w / 2, y + 100);
  }
  { // cajón de fruta
    const [x, y, w, h] = R.cosecha; g.fillStyle = '#b08a50'; g.fillRect(x, y, w, h); g.strokeStyle = '#6a4a20'; g.lineWidth = 3; for (let s = 0; s < 4; s++) g.strokeRect(x, y + s * 16, w, 16);
  }
  { // mancha de sombra/hollín (para el piso bajo la parrilla y el tablado)
    const [x, y, w, h] = R.sombra; const gr = g.createRadialGradient(x + w / 2, y + h / 2, 4, x + w / 2, y + h / 2, h / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(x, y, w, h);
  }
}

// ---------- geometría ----------
const _c = new THREE.Color();
function teñir(g, hex, k = 1) { g = g.index ? g.toNonIndexed() : g; _c.setHex(hex).multiplyScalar(k); const n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = _c.r; a[i * 3 + 1] = _c.g; a[i * 3 + 2] = _c.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; }
function uvA(g, reg) { // lleva las uv (0..1) de la geometría a una región del atlas
  const [x, y, w, h] = reg, uv = g.attributes.uv; if (!uv) return g;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (x + uv.getX(i) * w) / W, 1 - (y + (1 - uv.getY(i)) * h) / H);
  return g;
}
const liso = (g, hex, k) => uvA(teñir(g, hex, k), R.blanco);
const caja = (w, h, d, x, y, z, hex, k) => liso(new THREE.BoxGeometry(w, h, d).translate(x, y, z), hex, k);
const cil = (r0, r1, h, x, y, z, hex, s = 8, k) => liso(new THREE.CylinderGeometry(r0, r1, h, s).translate(x, y, z), hex, k);
const plano = (w, h, x, y, z, reg, hex = 0xffffff) => uvA(teñir(new THREE.PlaneGeometry(w, h).translate(x, y, z), hex), reg);

class Lote { // por mapa: 'luz' (iluminado) y 'neon' (sin luz)
  constructor() { this.luz = []; this.neon = []; }
  pon(capa, geos, i, d, giro = 0, dy = 0) { const p = aMundo(i, d), yaw = yawN(i) + giro, y = piso(d) + dy; for (let g of [].concat(geos)) { g = g.index ? g.toNonIndexed() : g; g.rotateY(yaw); g.translate(p.x, y, p.z); this[capa].push(g); } return { p, yaw, y }; }
}

export function crearBarrio(scene) {
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; pintarAtlas(cv);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; tex.generateMipmaps = true;
  if (document.fonts && !document.fonts.check('60px Bangers')) document.fonts.load('60px Bangers').then(() => { pintarAtlas(cv); tex.needsUpdate = true; }).catch(() => {});
  const MAT = {
    luz: new THREE.MeshStandardMaterial({ map: tex, vertexColors: true, roughness: 0.8, metalness: 0.05, alphaTest: 0.3, side: THREE.DoubleSide }),
    neon: new THREE.MeshBasicMaterial({ map: tex, vertexColors: true, alphaTest: 0.3, side: THREE.DoubleSide })
  };
  const col = [], grupos = {}, humos = [];
  const choque = (o, hx, hz, alto) => col.push({ x: o.p.x, z: o.p.z, r: Math.hypot(hx, hz), top: o.y + alto, metal: true, cajas: [{ cx: o.p.x, cz: o.p.z, c: Math.cos(o.yaw), s: Math.sin(o.yaw), hx, hz, y0: o.y, y1: o.y + alto }] });

  // ---- piezas ----
  function pintadas(L, desde, hasta, paso, k0) { // sobre la cara del muro que da a la vereda (d = -10.8, de 1.6 a 2.6 m)
    let k = k0;
    for (let i = desde; i < hasta; i += paso) { L.pon('luz', plano(6.2, 0.86, 0, 0.5, 0, R.graf(k % GRAF.length)), i, -10.77, 0, 0); k++; }
  }
  function cartelCalle(L, i, d, k) {
    L.pon('luz', [cil(0.05, 0.05, 3.2, 0, 1.6, 0, 0x3a3e44), caja(0.06, 0.32, 1.25, 0, 3.05, 0.62, 0x1d4f9a)], i, d, 0);
    L.pon('luz', plano(1.2, 0.3, 0, 3.05, 0, R.calle(k)), i, d, Math.PI / 2, 0);
    // la placa tiene dos caras: el plano doble cara ya se lee de los dos lados (espejado del otro lado, como en la vida real no, pero no se nota a 3 m)
  }
  function banderines(L, i, d0, d1, alto, paleta) { // tira de banderines cruzando la calle, de poste a poste
    const n = Math.round((d1 - d0) / 0.55), a = aMundo(i, d0), b = aMundo(i, d1), ya = piso(d0) + alto, yb = piso(d1) + alto;
    for (let k = 0; k <= n; k++) {
      const t = k / n, x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t, y = ya + (yb - ya) * t - Math.sin(t * Math.PI) * 1.1;
      const tri = new THREE.BufferGeometry(); tri.setAttribute('position', new THREE.Float32BufferAttribute([-0.24, 0, 0, 0.24, 0, 0, 0, -0.5, 0], 3)); tri.computeVertexNormals(); tri.setAttribute('uv', new THREE.Float32BufferAttribute([0, 1, 1, 1, 0.5, 0], 2));
      liso(tri, paleta[k % paleta.length]); tri.rotateY(yawN(i) + Math.PI / 2 + (k % 2 ? 0.25 : -0.2)); tri.translate(x, y, z); L.luz.push(tri);
    }
    for (let k = 0; k < n; k++) { const t = (k + 0.5) / n, x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t, y = ya + (yb - ya) * t - Math.sin(t * Math.PI) * 1.1; const s = liso(new THREE.BoxGeometry(0.02, 0.02, 0.58), 0x222222); s.rotateY(yawN(i)); s.translate(x, y + 0.01, z); L.luz.push(s); }
  }
  function parrilla(L, i, d) { // carrito-parrilla al paso, mirando a la calle
    const giro = Math.PI, P = [];
    P.push(caja(3.2, 1.0, 1.3, 0, 0.5, 0, 0x7a2a1a, 0.9), caja(3.24, 0.12, 1.34, 0, 1.02, 0, 0x2a2a2a));
    for (let x = -1.45; x <= 1.46; x += 0.29) for (let y = 0.12; y < 0.95; y += 0.18) P.push(caja(0.27, 0.15, 0.02, x + ((y * 5.5 | 0) % 2) * 0.14 - 0.07, y, 0.66, 0x9a3a22, 0.75 + ((x * 7 + y * 3) % 1) * 0.2)); // ladrillos
    P.push(caja(2.0, 0.08, 0.9, -0.3, 1.25, 0, 0x1a1a1a), caja(0.08, 0.4, 0.9, -1.3, 1.25, 0, 0x2a2a2a), caja(0.08, 0.4, 0.9, 0.7, 1.25, 0, 0x2a2a2a));
    for (let k = 0; k < 9; k++) P.push(caja(2.0, 0.015, 0.02, -0.3, 1.31, -0.4 + k * 0.1, 0x6a6a6a)); // la parrilla
    for (let k = 0; k < 6; k++) { const ch = liso(new THREE.CapsuleGeometry(0.035, 0.22, 3, 6).rotateZ(Math.PI / 2).translate(-0.9 + k * 0.3, 1.36, -0.15 + (k % 2) * 0.22), k % 3 === 2 ? 0x2a0a0a : 0x8a2a14); P.push(ch); } // chorizos y morcillas
    P.push(caja(0.7, 0.04, 0.4, -0.2, 1.36, 0.25, 0x6a3018)); // un asado de tira
    P.push(cil(0.12, 0.14, 2.6, 1.2, 2.3, -0.4, 0x3a3a3a, 8), cil(0.2, 0.2, 0.18, 1.2, 3.62, -0.4, 0x2a2a2a, 8)); // chimenea
    P.push(caja(0.06, 2.4, 0.06, -1.55, 2.2, 0.6, 0x5a4a3a), caja(0.06, 2.4, 0.06, 1.55, 2.2, 0.6, 0x5a4a3a), caja(0.06, 2.4, 0.06, -1.55, 2.2, -0.6, 0x5a4a3a));
    const tol = plano(3.6, 1.8, 0, 0, 0, R.toldo(0)); tol.rotateX(-Math.PI / 2 + 0.25); tol.translate(0, 3.35, 0.1); P.push(tol);
    for (const x of [-1.2, -0.4, 0.4]) P.push(cil(0.18, 0.16, 0.05, x, 0.72, 1.3, 0xc8281a, 10), cil(0.025, 0.025, 0.7, x, 0.35, 1.3, 0x8a8a8a, 5)); // banquitos
    P.push(caja(0.3, 0.32, 0.3, 1.25, 1.24, 0.3, 0xe86a10), cil(0.04, 0.04, 0.24, 1.25, 1.52, 0.3, 0x2a2a2a, 6)); // la garrafa de supergás
    P.push(cil(0.09, 0.09, 0.34, 1.45, 1.25, -0.25, 0xe8e8e8, 8), cil(0.06, 0.07, 0.12, 1.15, 1.14, -0.3, 0x3a5a2a, 8)); // termo y mate
    const o = L.pon('luz', P, i, d, giro);
    L.pon('neon', [plano(2.8, 0.52, 0, 2.75, -0.62, R.parrilla), liso(new THREE.BoxGeometry(1.9, 0.03, 0.8).translate(-0.3, 1.21, 0), 0xff5a10)], i, d, giro); // brasas encendidas
    L.pon('luz', plano(4.2, 3.2, 0, 0.03, 0, R.sombra, 0x0a0806).rotateX(-Math.PI / 2), i, d, giro);
    choque(o, 1.65, 0.75, 1.5);
    const ch = aMundo(i, d).clone(); ch.x += 0; return { p: (() => { const v = new THREE.Vector3(1.2, 3.75, -0.4); v.applyAxisAngle(new THREE.Vector3(0, 1, 0), o.yaw); return v.add(new THREE.Vector3(o.p.x, o.y, o.p.z)); })() };
  }
  function tablado(L, i, d) { // escenario de madera con telón, lamparitas y parlantes
    const giro = Math.PI, P = [], N = [];
    P.push(caja(7.4, 1.0, 3.2, 0, 0.5, 0, 0x5a3a20, 0.85));
    for (let x = -3.6; x <= 3.61; x += 0.3) P.push(caja(0.28, 0.02, 3.2, x, 1.01, 0, 0x7a5430, 0.8 + ((x * 13) % 1 + 1) % 1 * 0.3)); // tablas
    P.push(caja(7.4, 0.3, 0.06, 0, 0.85, 1.62, 0xc8281a), caja(7.4, 0.3, 0.06, 0, 0.55, 1.62, 0xf2c230), caja(7.4, 0.25, 0.06, 0, 0.27, 1.62, 0x1f5fae));
    P.push(plano(7.2, 2.7, 0, 2.4, -1.5, R.tablado));
    for (const x of [-3.65, 3.65]) P.push(caja(0.16, 4.4, 0.16, x, 2.2, -1.5, 0x3a3a3a), caja(0.6, 1.0, 0.5, x * 0.86, 1.5, -1.2, 0x141414), cil(0.16, 0.16, 0.02, x * 0.86, 1.6, -0.94, 0x3a3a3a, 10).rotateX(Math.PI / 2)); // postes y parlantes
    P.push(caja(7.46, 0.16, 0.16, 0, 4.35, -1.5, 0x3a3a3a));
    P.push(caja(1.2, 0.2, 0.5, -2.8, 0.1, 2.1, 0x5a3a20), caja(1.2, 0.2, 0.5, -2.8, 0.4, 1.85, 0x5a3a20), caja(1.2, 0.2, 0.5, -2.8, 0.7, 1.6, 0x5a3a20)); // escalera
    // tambores del candombe (chico, repique, piano) apoyados en el escenario
    [[1.6, 0.56, 0.18], [2.2, 0.66, 0.21], [2.85, 0.76, 0.25]].forEach(([x, h, r], k) => { P.push(cil(r * 0.9, r, h, x, 1.0 + h / 2, -0.4, 0x8a5a2a, 10), cil(r * 0.92, r * 0.92, 0.02, x, 1.01 + h, -0.4, 0xe8dcc0, 10)); for (let s = 0; s < 4; s++) P.push(caja(0.02, h, 0.02, x + Math.cos(s * 1.57) * r, 1.0 + h / 2, -0.4 + Math.sin(s * 1.57) * r, 0xc8b070)); });
    // lamparitas colgando entre los postes (con su comba) y una tira al frente
    for (let k = 0; k <= 22; k++) { const t = k / 22, x = -3.6 + 7.2 * t, y = 4.25 - Math.sin(t * Math.PI) * 0.6; N.push(liso(new THREE.SphereGeometry(0.07, 6, 4).translate(x, y, -1.4), [0xffd870, 0xff6a5a, 0x7ad0ff, 0xa8ff7a, 0xff9ae0][k % 5])); }
    for (let k = 0; k <= 16; k++) { const t = k / 16, x = -3.6 + 7.2 * t, y = 1.12; N.push(liso(new THREE.SphereGeometry(0.05, 6, 4).translate(x, y, 1.64), [0xffd870, 0xff6a5a, 0x7ad0ff][k % 3])); }
    const o = L.pon('luz', P, i, d, giro); L.pon('neon', N, i, d, giro);
    choque(o, 3.7, 1.6, 1.0);
    return o;
  }
  function puesto(L, i, d, k) { // puesto de feria: caballete, toldo rayado, cajones con fruta y verdura
    const P = [], giro = Math.PI;
    P.push(caja(2.4, 0.06, 1.0, 0, 0.85, 0, 0x8a6a40), caja(0.06, 0.85, 0.06, -1.1, 0.42, -0.4, 0x5a4a30), caja(0.06, 0.85, 0.06, 1.1, 0.42, -0.4, 0x5a4a30), caja(0.06, 0.85, 0.06, -1.1, 0.42, 0.4, 0x5a4a30), caja(0.06, 0.85, 0.06, 1.1, 0.42, 0.4, 0x5a4a30));
    for (const x of [-1.15, 1.15]) for (const z of [-0.5, 0.5]) P.push(caja(0.05, 2.3, 0.05, x, 1.15, z, 0x9a9aa0));
    const t = plano(2.6, 1.3, 0, 0, 0, R.toldo((k + 1) % 6)); t.rotateX(-Math.PI / 2 + 0.2); t.translate(0, 2.35, 0); P.push(t);
    const FR = [[0xe02a1a, 0x30a040], [0xf08a10, 0xf0d020], [0x7a2a7a, 0x30a040], [0x3aa03a, 0xd0a040]][k % 4];
    for (let c = 0; c < 3; c++) {
      const cx = -0.75 + c * 0.75; P.push(uvA(teñir(new THREE.BoxGeometry(0.62, 0.22, 0.42).translate(cx, 0.99, 0.15), 0xffffff), R.cosecha));
      for (let n = 0; n < 7; n++) P.push(liso(new THREE.IcosahedronGeometry(0.075, 0).translate(cx - 0.2 + (n % 4) * 0.13, 1.13 + (n / 4 | 0) * 0.06, 0.05 + (n / 4 | 0) * 0.12 + (n % 2) * 0.05), FR[(c + n) % 2]));
    }
    P.push(caja(0.45, 0.4, 0.35, 0.8, 0.2, 0.75, 0x2a6a2a, 0.8)); // un cajón en el piso
    const o = L.pon('luz', P, i, d, giro); choque(o, 1.25, 0.6, 1.2);
  }
  function ombu(L, i, d, s = 1) { // el ombú: tronco ancho y retorcido, raíces afuera, copa enorme y baja
    const P = [];
    for (let k = 0; k < 7; k++) { const a = k / 7 * 6.28, r = liso(new THREE.CylinderGeometry(0.25 * s, 0.6 * s, 1.0 * s, 6).rotateZ(1.1).rotateY(-a).translate(Math.cos(a) * 1.2 * s, 0.25 * s, Math.sin(a) * 1.2 * s), 0x4a3a2a); P.push(r); }
    P.push(cil(0.9 * s, 1.5 * s, 2.6 * s, 0, 1.3 * s, 0, 0x5a4a38, 9), cil(0.5 * s, 0.85 * s, 1.6 * s, 0.4 * s, 3.2 * s, 0, 0x5a4a38, 8));
    for (let k = 0; k < 5; k++) { const a = k / 5 * 6.28 + 0.4; P.push(liso(new THREE.CylinderGeometry(0.2 * s, 0.4 * s, 3.4 * s, 6).rotateZ(0.95).rotateY(-a).translate(Math.cos(a) * 1.6 * s, 4.0 * s, Math.sin(a) * 1.6 * s), 0x5a4a38)); }
    const cop = [[0, 6.2, 0, 4.2], [3.2, 5.4, 1, 3.0], [-3, 5.6, -0.6, 3.1], [0.6, 5.3, -3.2, 2.8], [-0.8, 5.5, 3.0, 2.9], [2.2, 6.6, -1.8, 2.4]];
    cop.forEach(([x, y, z, r], k) => P.push(liso(new THREE.IcosahedronGeometry(r * s, 1).scale(1, 0.62, 1).translate(x * s, y * s, z * s), [0x2a4a1e, 0x34582a, 0x2e5022][k % 3])));
    L.pon('luz', P, i, d, 0);
  }
  function pescadores(L, i) { // sobre el muro de la rambla, mirando al río: cañas paradas en tubos, baldes, conservadora, reposera y el termo
    const P = [], d = -11.45;
    for (let k = 0; k < 3; k++) { const x = -1.8 + k * 1.6; P.push(cil(0.04, 0.04, 0.5, x, 0.25, -0.3, 0x8a8a90, 6)); P.push(liso(new THREE.CylinderGeometry(0.008, 0.02, 3.6, 5).translate(0, 1.8, 0).rotateX(0.5 + k * 0.08).translate(x, 0.3, -0.3), 0xe0d4a8)); P.push(cil(0.17, 0.14, 0.3, x + 0.45, 0.15, 0.25, [0x2a6ac8, 0xe8c030, 0xd03030][k], 9)); }
    P.push(caja(0.55, 0.38, 0.36, 2.3, 0.19, 0.1, 0x1f5fae), caja(0.57, 0.06, 0.38, 2.3, 0.41, 0.1, 0xf0f0f0));
    P.push(caja(0.5, 0.04, 0.5, -2.7, 0.36, 0.15, 0x2a8a4a), caja(0.5, 0.6, 0.04, -2.7, 0.66, 0.42, 0x2a8a4a));
    P.push(cil(0.09, 0.09, 0.34, 2.75, 0.17, 0.2, 0xe8e8e8, 8), cil(0.06, 0.07, 0.12, 2.75, 0.06, -0.15, 0x3a5a2a, 8));
    const o = L.pon('luz', P, i, d, 0); choque(o, 3.0, 0.4, 0.7);
  }
  function pasacalle(L, i, d0, d1, alto) { // pasacalle de tela cruzando la calle, colgado de dos postes
    const a = aMundo(i, d0), b = aMundo(i, d1), m = a.clone().add(b).multiplyScalar(0.5), largo = a.distanceTo(b), y = piso(5) + alto;
    for (const [p, dd] of [[a, d0], [b, d1]]) { const g = cil(0.07, 0.09, alto + 0.6, 0, (alto + 0.6) / 2, 0, 0x3a3e44, 6); g.translate(p.x, piso(dd), p.z); L.luz.push(g); }
    const tela = plano(Math.min(9, largo * 0.6), 1.3, 0, 0, 0, R.murga); tela.rotateY(yawN(i) - Math.PI / 2); tela.translate(m.x, y, m.z); L.luz.push(tela);
    const cuerda = liso(new THREE.BoxGeometry(0.02, 0.02, largo), 0x2a2a2a); cuerda.rotateY(yawN(i)); cuerda.translate(m.x, y + 0.66, m.z); L.luz.push(cuerda);
  }
  function humo(pos, n = 26) { humos.push({ pos: pos.clone(), n }); }

  // ---- Rambla Sur (también la ve el Puerto del Buceo) ----
  const C = 300;
  {
    const L = new Lote();
    pintadas(L, C - 70, C + 74, 6.5, 0);
    const P = [0x6cb4ee, 0xffffff, 0xf2c230];
    banderines(L, C - 12, -3.2, 12.6, 6.0, [0x6cb4ee, 0xffffff, 0xf2c230, 0xffffff]);
    banderines(L, C + 22, -3.2, 12.6, 6.2, [0xf6c51b, 0x111111]);
    banderines(L, C + 48, -3.2, 12.6, 6.0, [0xc8102e, 0xffffff, 0x1b3d8f]);
    banderines(L, C - 44, -3.2, 12.6, 6.1, P);
    pasacalle(L, C - 26, -3.4, 12.8, 5.2);
    cartelCalle(L, C - 34 + 2.2, 12.9, 0); cartelCalle(L, C + 36 + 2.2, 12.9, 1); cartelCalle(L, C + 104 + 2.2, 12.9, 2); cartelCalle(L, C - 34 - 2.2, -3.0, 3);
    const pr = parrilla(L, C - 1.5, 13.2); humo(pr.p);
    pescadores(L, C - 58); pescadores(L, C + 66);
    tablado(L, C + 58.5, 18.2);
    for (let k = 0; k < 3; k++) puesto(L, C - 22 + k * 4.4, 18.0, k);
    L.pon('luz', [plano(3.4, 0.62, 0, 2.7, 0, R.feria), cil(0.05, 0.05, 2.5, -1.5, 1.25, 0, 0x5a4a30), cil(0.05, 0.05, 2.5, 1.5, 1.25, 0, 0x5a4a30)], C - 26.2, 18.3, Math.PI);
    ombu(L, C + 16.5, 24.5, 1.05); ombu(L, C - 30.5, 26, 0.9);
    grupos.rambla = L;
  }
  // ---- Pocitos ----
  {
    const L = new Lote();
    pintadas(L, 56, 186, 7, 3);
    banderines(L, 96, -3.2, 12.6, 6.0, [0x6cb4ee, 0xffffff, 0xf2c230, 0xffffff]); banderines(L, 140, -3.2, 12.6, 6.0, [0xf6c51b, 0x111111]); banderines(L, 166, -3.2, 12.6, 6.1, [0xc8102e, 0xffffff, 0x1b3d8f]);
    const pr = parrilla(L, 129.5, 13.4); humo(pr.p);
    for (let k = 0; k < 2; k++) puesto(L, 104 + k * 4.4, 18.0, k + 2);
    ombu(L, 150.5, 25, 1);
    grupos.pocitos = L;
  }
  // ---- Punta Carretas ----
  {
    const L = new Lote();
    pintadas(L, 470, 560, 9, 6);
    pescadores(L, 548); pescadores(L, 512);
    grupos.faro = L;
  }

  // ---- mallas: por mapa un grupo con 2 mallas + el humo ----
  const G = {};
  for (const k in grupos) {
    const L = grupos[k], g = new THREE.Group(); g.name = 'barrio-' + k; g.visible = k === 'rambla';
    if (L.luz.length) g.add(new THREE.Mesh(unir2(L.luz), MAT.luz));
    if (L.neon.length) g.add(new THREE.Mesh(unir2(L.neon), MAT.neon));
    scene.add(g); G[k] = g;
  }
  // humo de las parrillas: unos pocos puntos que suben y se abren (1 draw call para todas)
  const nH = humos.reduce((s, h) => s + h.n, 0), pos = new Float32Array(nH * 3), vida = new Float32Array(nH), base = [];
  humos.forEach(h => { for (let k = 0; k < h.n; k++) base.push(h.pos); });
  for (let k = 0; k < nH; k++) vida[k] = Math.random();
  const gH = new THREE.BufferGeometry(); gH.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const texH = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 2, 32, 32, 30); gr.addColorStop(0, 'rgba(200,200,205,.55)'); gr.addColorStop(1, 'rgba(200,200,205,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); return t; })();
  const humoP = new THREE.Points(gH, new THREE.PointsMaterial({ map: texH, size: 2.2, transparent: true, depthWrite: false, opacity: 0.55, color: 0x9a9aa4 }));
  humoP.frustumCulled = false; scene.add(humoP);
  let mapa = 'rambla';
  return {
    colisiones: col,
    mostrar(id) { mapa = id === 'puerto' ? 'rambla' : id; for (const k in G) G[k].visible = k === mapa; },
    update(t, dt) {
      for (let k = 0; k < nH; k++) {
        vida[k] += dt * 0.28; if (vida[k] > 1) vida[k] -= 1;
        const v = vida[k], b = base[k], vientoX = v * v * 2.2, sp = v * 0.9;
        pos[k * 3] = b.x + vientoX + Math.sin(k * 7.1 + t) * sp; pos[k * 3 + 1] = b.y + v * 5.5; pos[k * 3 + 2] = b.z + Math.cos(k * 3.3 + t * 0.8) * sp;
      }
      gH.attributes.position.needsUpdate = true;
    }
  };
}
// como unir() de world.js pero conservando color y uv siempre (todas las piezas las tienen)
function unir2(geos) {
  let n = 0; geos.forEach(g => n += g.attributes.position.count);
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2), col = new Float32Array(n * 3); let o = 0;
  for (const g of geos) { const c = g.attributes.position.count; pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); if (g.attributes.uv) uv.set(g.attributes.uv.array, o * 2); if (g.attributes.color) col.set(g.attributes.color.array, o * 3); else col.fill(1, o * 3, (o + c) * 3); o += c; g.dispose(); }
  const bg = new THREE.BufferGeometry();
  bg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); bg.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); bg.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); bg.setAttribute('color', new THREE.BufferAttribute(col, 3));
  bg.computeBoundingSphere(); return bg;
}
