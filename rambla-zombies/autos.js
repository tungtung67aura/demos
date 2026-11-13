// Autos y ómnibus abandonados de la rambla: carrocería extruida con perfil real (capó, parabrisas, techo, baúl),
// vidrios, ruedas con llanta, paragolpes, ópticas, espejos, patente uruguaya y daños (vidrios rotos, sangre, puertas abiertas).
// Todo se arma con pocos materiales compartidos: world.js los "hornea" y quedan ~8 draw calls para todos los autos juntos.
import * as THREE from 'https://esm.sh/three@0.160.0';

// ---------- materiales compartidos ----------
function texMugre() { // mugre/óxido en escala de grises: se multiplica por el color de la pintura
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  g.fillStyle = '#e8e8e8'; g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 900; i++) { const v = 150 + Math.random() * 90 | 0; g.fillStyle = `rgba(${v},${v - 6},${v - 12},${0.12 + Math.random() * 0.25})`; g.fillRect(Math.random() * 128, Math.random() * 128, 1 + Math.random() * 3, 1 + Math.random() * 2); }
  for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(120,70,40,${0.08 + Math.random() * 0.12})`; g.beginPath(); g.arc(Math.random() * 128, Math.random() * 128, 2 + Math.random() * 9, 0, 6.3); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(0.45, 0.45); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const PLACAS = 8; // atlas de 8 patentes (4 × 2)
function texPlacas() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128; const g = c.getContext('2d');
  const L = 'ABCDEFGHJKLMNPRSTUV';
  for (let k = 0; k < PLACAS; k++) {
    const x = (k % 4) * 128, y = (k / 4 | 0) * 64;
    g.fillStyle = '#ecece6'; g.fillRect(x, y, 128, 64); g.fillStyle = '#1a3f9a'; g.fillRect(x, y, 128, 14);
    g.fillStyle = '#fff'; g.font = 'bold 10px sans-serif'; g.textAlign = 'center'; g.fillText('URUGUAY', x + 64, y + 11);
    g.fillStyle = '#111'; g.font = 'bold 30px monospace';
    g.fillText('S' + L[Math.random() * L.length | 0] + L[Math.random() * L.length | 0] + ' ' + (1000 + Math.random() * 8999 | 0), x + 64, y + 52);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
let MATS = null;
function mats() {
  if (MATS) return MATS;
  MATS = {
    pintura: new THREE.MeshStandardMaterial({ vertexColors: true, map: texMugre(), roughness: 0.5, metalness: 0.5 }),
    vidrio: new THREE.MeshStandardMaterial({ color: 0x070b10, emissive: 0x0c1826, roughness: 0.08, metalness: 0.9, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
    cromo: new THREE.MeshStandardMaterial({ color: 0xb4bac2, roughness: 0.3, metalness: 0.95 }),
    goma: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.55 }), // goma + cromo (color por vértice)
    luces: new THREE.MeshBasicMaterial({ vertexColors: true }),
    farol: new THREE.MeshStandardMaterial({ color: 0xfff4d0, emissive: 0xffe9a8, emissiveIntensity: 1.5, roughness: 0.2 }),
    luzRoja: new THREE.MeshStandardMaterial({ color: 0xb01818, emissive: 0xff2010, emissiveIntensity: 1.1, roughness: 0.3 }),
    luzAzul: new THREE.MeshStandardMaterial({ color: 0x1830c0, emissive: 0x2050ff, emissiveIntensity: 1.3, roughness: 0.3 }),
    luzAmbar: new THREE.MeshStandardMaterial({ color: 0xe8a010, emissive: 0xffa800, emissiveIntensity: 1.2, roughness: 0.3 }),
    placa: new THREE.MeshStandardMaterial({ map: texPlacas(), roughness: 0.6 })
  };
  return MATS;
}


// menos draw calls: cromo y goma comparten material (el color va por vértice) y todas las ópticas son una sola malla sin luz
const COL_LUZ = { farol: 0xfff0c8, luzRoja: 0xff2a18, luzAzul: 0x2a58ff, luzAmbar: 0xffa810 };
function compactar(B) {
  const pintarSi = (geos, hex, soloBlancos) => { _c.setHex(hex); for (const g of geos) { const a = g.attributes.color; if (!a) continue; for (let i = 0; i < a.count; i++) if (!soloBlancos || a.getX(i) > 0.99) a.setXYZ(i, _c.r, _c.g, _c.b); } return geos; };
  B.goma = B.goma.concat(pintarSi(B.cromo, 0xb4bac2, true)); B.cromo = [];
  B.luces = []; for (const k in COL_LUZ) if (B[k]) { B.luces = B.luces.concat(pintarSi(B[k], COL_LUZ[k], false)); B[k] = []; }
  return B;
}
// ---------- geometría ----------
const _c = new THREE.Color();
function teñir(geo, hex, oscuro = 0.62) { // color por vértice + oscurecido abajo (oclusión falsa)
  const g = geo.index ? geo.toNonIndexed() : geo, p = g.attributes.position, a = new Float32Array(p.count * 3); _c.setHex(hex);
  for (let i = 0; i < p.count; i++) { const k = oscuro + (1 - oscuro) * Math.min(1, Math.max(0, (p.getY(i) - 0.25) / 1.1)); a[i * 3] = _c.r * k; a[i * 3 + 1] = _c.g * k; a[i * 3 + 2] = _c.b * k; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3)); if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(p.count * 2), 2)); return g;
}
const caja = (w, h, d, x, y, z, hex = 0xffffff, osc) => teñir(new THREE.BoxGeometry(w, h, d).translate(x, y, z), hex, osc === undefined ? 1 : osc);
function extruir(pts, ancho, hex, bisel = 0.07) {
  const s = new THREE.Shape(); pts.forEach(([x, y], i) => i ? s.lineTo(x, y) : s.moveTo(x, y)); s.closePath();
  const prof = Math.max(0.05, ancho - 2 * bisel);
  const g = new THREE.ExtrudeGeometry(s, { depth: prof, bevelEnabled: true, bevelThickness: bisel, bevelSize: bisel * 0.7, bevelSegments: 2, steps: 1, curveSegments: 1 });
  g.translate(0, 0, -prof / 2); return teñir(g, hex);
}
function polig(pts, z) { // vidrio lateral (polígono en el plano x-y) a la altura z
  const s = new THREE.Shape(); pts.forEach(([x, y], i) => i ? s.lineTo(x, y) : s.moveTo(x, y)); s.closePath();
  const g = new THREE.ShapeGeometry(s).translate(0, 0, z); return teñir(g, 0x070b10, 1);
}
function quad(p0, p1, mitad, desvio = 0.02) { // plano inclinado a lo ancho (parabrisas / luneta)
  const dx = p1[0] - p0[0], dy = p1[1] - p0[1], l = Math.hypot(dx, dy) || 1, nx = dy / l * desvio, ny = -dx / l * desvio;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([p0[0] + nx, p0[1] + ny, -mitad, p0[0] + nx, p0[1] + ny, mitad, p1[0] + nx, p1[1] + ny, mitad, p0[0] + nx, p0[1] + ny, -mitad, p1[0] + nx, p1[1] + ny, mitad, p1[0] + nx, p1[1] + ny, -mitad], 3));
  g.computeVertexNormals(); return teñir(g, 0x070b10, 1);
}
function placaGeo(w, h, idx, x, y, z, mirando) { // idx: patente del atlas
  const g = new THREE.PlaneGeometry(w, h); const u = g.attributes.uv, c = idx % 4, f = idx / 4 | 0;
  for (let i = 0; i < u.count; i++) { u.setXY(i, (c + u.getX(i)) / 4, 1 - (f + 1 - u.getY(i)) / 2); }
  g.rotateY(mirando > 0 ? Math.PI / 2 : -Math.PI / 2).translate(x, y, z);
  return teñir(g, 0xffffff, 1);
}
function cilRueda(r, ancho, x, y, z, hex, seg = 14) { return teñir(new THREE.CylinderGeometry(r, r, ancho, seg).rotateX(Math.PI / 2).translate(x, y, z), hex, 1); }

// ---------- modelos ----------
// perfil: puntos [x, y] de la silueta lateral (x adelante). cab: [xTrasBase, xTrasTecho, xDelTecho, xDelBase, yBase, yTecho, xPilarB]
const MODELOS = {
  sedan: { L: 4.4, W: 1.82, R: 0.34, wb: 2.6, perfil: [[-2.2, 0.32], [-2.2, 0.82], [-2.05, 1.08], [-1.25, 1.13], [-0.92, 1.74], [0.45, 1.78], [0.98, 1.16], [1.95, 1.02], [2.2, 0.78], [2.2, 0.32]], cab: [-1.17, -0.88, 0.42, 0.95, 1.17, 1.71, -0.1], alto: 1.8, cajas: { hx: 2.2, hz: 0.93, y1: 1.6, rx: 1.0, ry1: 2.1 } },
  hatch: { L: 3.78, W: 1.66, R: 0.31, wb: 2.25, perfil: [[-1.89, 0.32], [-1.89, 1.05], [-1.64, 1.74], [0.4, 1.76], [0.86, 1.14], [1.7, 1.0], [1.89, 0.78], [1.89, 0.32]], cab: [-1.85, -1.6, 0.36, 0.82, 1.15, 1.7, -0.5], alto: 1.8, cajas: { hx: 1.9, hz: 0.85, y1: 1.6, rx: 1.0, ry1: 2.1 } },
  pickup: { L: 5.2, W: 1.9, R: 0.4, wb: 3.1, perfil: [[-0.9, 0.42], [-0.9, 1.92], [0.45, 1.94], [0.98, 1.34], [2.15, 1.22], [2.6, 0.98], [2.6, 0.42]], cab: [-0.88, -0.84, 0.42, 0.95, 1.38, 1.88, 0.0], alto: 1.95, cajas: { hx: 2.6, hz: 0.97, y1: 1.6, rx: 0.6, ry1: 2.2, rcx: 0.75 } },
  combi: { L: 4.3, W: 1.76, R: 0.36, wb: 2.4, perfil: [[-2.15, 0.34], [-2.15, 1.0], [-2.05, 1.86], [1.6, 1.9], [1.95, 1.8], [2.15, 1.1], [2.15, 0.34]], cab: [-2.12, -2.06, 1.97, 2.1, 1.15, 1.76, -0.4], alto: 1.92, cajas: { hx: 2.15, hz: 0.9, y1: 1.6, rx: 1.9, ry1: 2.2 } }
};

// azar repetible por auto (que el mismo auto salga igual si se vuelve a armar)
function rng(sem) { let a = (sem * 2654435761) >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const lerp = (a, b, k) => a + (b - a) * k;

// Devuelve { g, L, W, alto, cajas } — g mide en metros, adelante = +x, el piso en y = 0
export function crearAuto(tipo, color, sem = 1, opc = {}) {
  const M = MODELOS[tipo === 'taxi' || tipo === 'patrullero' ? 'sedan' : tipo], R = rng(sem * 977 + 13), P = mats();
  const quemado = !!opc.quemado, L2 = M.L / 2, W2 = M.W / 2, [xr0, xr1, xf1, xf0, yb, yt, bx] = M.cab;
  const B = { pintura: [], vidrio: [], cromo: [], goma: [], farol: [], luzRoja: [], luzAzul: [], luzAmbar: [], placa: [] };
  let pint = color;
  if (tipo === 'taxi') pint = 0x16161a; else if (tipo === 'patrullero') pint = 0xe6e8ee;
  if (quemado) pint = 0x1a1714;
  const cabEn = y => { const k = (y - yb) / (yt - yb); return [lerp(xr0, xr1, k), lerp(xf0, xf1, k)]; }; // borde trasero y delantero de la cabina a la altura y

  // carrocería
  if (tipo === 'combi') {
    const bajo = M.perfil.filter(p => p[1] <= 1.05), alta = [[-2.1, 1.0], [-2.05, 1.86], [1.6, 1.9], [1.95, 1.8], [2.13, 1.1], [2.13, 1.0]];
    B.pintura.push(extruir([[-2.15, 0.34], [-2.15, 1.0], [2.15, 1.0], [2.15, 0.34]], M.W, pint)); // faldón inferior
    B.pintura.push(extruir(alta, M.W - 0.02, quemado ? pint : 0xe8e4d6));
    void bajo;
  } else B.pintura.push(extruir(M.perfil, M.W, pint));
  if (tipo === 'pickup') { // caja de carga abierta
    B.goma.push(caja(1.6, 0.1, M.W - 0.16, -1.75, 0.55, 0, 0x1a1a1c, 1));
    for (const s of [-1, 1]) B.pintura.push(caja(1.7, 0.78, 0.09, -1.75, 0.88, s * (W2 - 0.045), pint));
    B.pintura.push(caja(0.09, 0.78, M.W, -2.55, 0.88, 0, pint)); B.pintura.push(caja(0.09, 0.7, M.W - 0.2, -0.98, 0.9, 0, pint));
    if (R() < 0.55) B.goma.push(caja(0.8, 0.5, 0.6, -1.9, 0.9, (R() - 0.5) * 0.6, 0x222226, 1)); // algo de carga
  }
  B.goma.push(caja(M.L - 0.4, 0.14, M.W - 0.3, 0, 0.36, 0, 0x0e0e10, 1)); // bajos oscuros: el auto se apoya en el piso

  // vidrios
  if (!quemado) {
    const ya = yb + 0.05, yz = yt - 0.07, pa = cabEn(ya), pz = cabEn(yz), bw = tipo === 'hatch' ? 0.42 : 0.1;
    for (const s of [-1, 1]) {
      const z = s * (W2 + 0.03);
      if (tipo === 'combi') { // ventanillas rectangulares de la kombi
        for (const [a, b] of [[-1.8, -1.0], [-0.9, -0.1], [0.0, 0.8], [1.05, 1.45]]) B.vidrio.push(polig([[a, 1.2], [a + 0.02, 1.72], [b, 1.72], [b + 0.02, 1.2]], z));
      } else {
        B.vidrio.push(polig([[pa[0] + 0.03, ya], [pz[0] + 0.03, yz], [bx - bw / 2 - 0.02, yz], [bx - bw / 2 - 0.02, ya]], z));
        B.vidrio.push(polig([[bx + bw / 2 + 0.02, ya], [bx + bw / 2 + 0.02, yz], [pz[1] - 0.03, yz], [pa[1] - 0.03, ya]], z));
      }
    }
    const ancho = M.W * 0.5 - 0.1;
    B.vidrio.push(quad([xf0, yb + 0.02], [xf1, yt - 0.04], ancho, 0.03)); // parabrisas
    if (tipo !== 'pickup') B.vidrio.push(quad([xr0, yb + 0.02], [xr1, yt - 0.04], ancho, -0.03)); // luneta
    else B.vidrio.push(quad([xr0 - 0.02, yb + 0.1], [xr1 - 0.02, yt - 0.1], ancho, -0.03));
    if (R() < 0.55) { // parabrisas astillado: telaraña
      const cx = xf0 - (xf0 - xf1) * 0.45, cy = yb + (yt - yb) * 0.5, n = 5 + (R() * 3 | 0);
      for (let i = 0; i < n; i++) { const a = R() * 6.28, l = 0.18 + R() * 0.3; B.cromo.push(teñir(new THREE.BoxGeometry(0.008, 0.008, l).translate(0, 0, l / 2).rotateX(a).translate(cx + 0.03, cy, (R() - 0.5) * 0.5), 0xdde4ea, 1)); }
    }
  } else { // quemado: cabina vacía y negra
    B.goma.push(caja((xf1 - xr1) * 0.9, yt - yb - 0.12, M.W - 0.3, (xf1 + xr1) / 2, (yb + yt) / 2, 0, 0x0a0908, 1));
  }
  // franjas de carrocería
  if (tipo === 'taxi') { for (const s of [-1, 1]) B.pintura.push(caja(M.L - 0.5, 0.1, 0.02, 0, 0.98, s * (W2 + 0.012), 0xe8b820, 1)); B.luzAmbar.push(caja(0.62, 0.2, 0.26, 0.1, yt + 0.12, 0)); B.cromo.push(caja(0.5, 0.04, 0.2, 0.1, yt + 0.02, 0)); }
  if (tipo === 'patrullero') {
    for (const s of [-1, 1]) { B.pintura.push(caja(M.L - 0.6, 0.34, 0.02, -0.1, 0.86, s * (W2 + 0.012), 0x1c3a9a, 1)); B.pintura.push(caja(1.4, 0.16, 0.02, -0.1, 0.62, s * (W2 + 0.012), 0xc82020, 1)); }
    B.pintura.push(caja(0.5, 0.02, 1.2, 0.0, yt + 0.0, 0, 0x1c3a9a, 1));
    B.luzRoja.push(caja(0.28, 0.14, 0.62, 0.0, yt + 0.12, -0.34)); B.luzAzul.push(caja(0.28, 0.14, 0.62, 0.0, yt + 0.12, 0.34)); B.goma.push(caja(0.34, 0.05, 1.4, 0.0, yt + 0.03, 0, 0x151518, 1));
  }
  if (tipo === 'combi') { B.cromo.push(caja(0.02, 0.5, 0.8, L2 + 0.01, 0.9, 0, 0xb4bac2, 1)); for (const s of [-1, 1]) B.cromo.push(caja(0.03, 0.05, 0.5, L2 + 0.01, 1.1, s * 0.42, 0xb4bac2, 1).rotateY(0)); }

  // rejilla, paragolpes, ópticas, patentes
  const fx = L2, hy = tipo === 'pickup' ? 0.75 : tipo === 'combi' ? 0.7 : 0.62;
  B.goma.push(caja(0.04, 0.2, M.W * 0.5, fx + 0.01, hy + 0.12, 0, 0x151517, 1));
  B.cromo.push(caja(0.14, 0.14, M.W - 0.06, fx - 0.02, 0.46, 0), caja(0.14, 0.14, M.W - 0.06, -fx + 0.02, 0.46, 0));
  const rota = i => R() < 0.28 && i === 1; // un faro roto
  for (const s of [-1, 1]) {
    if (!quemado) {
      if (rota(s + 1)) B.goma.push(caja(0.06, 0.15, 0.36, fx - 0.02, hy + 0.2, s * (W2 - 0.3), 0x1a1a1c, 1)); else B.farol.push(caja(0.06, 0.15, 0.36, fx - 0.02, hy + 0.2, s * (W2 - 0.3)));
      B.luzRoja.push(caja(0.06, 0.16, 0.34, -fx + 0.02, hy + 0.22, s * (W2 - 0.28)));
    }
    // espejos
    B.pintura.push(caja(0.1, 0.12, 0.16, (xf0 + xf1) / 2 + 0.05, yb + 0.12, s * (W2 + 0.12), pint, 1)); B.goma.push(caja(0.03, 0.03, 0.08, (xf0 + xf1) / 2 + 0.05, yb + 0.04, s * (W2 + 0.04), 0x111111, 1));
    // manijas y juntas de puertas
    B.cromo.push(caja(0.14, 0.025, 0.02, bx - 0.28, yb - 0.04, s * (W2 + 0.02), 0xb4bac2, 1), caja(0.14, 0.025, 0.02, bx + 0.45, yb - 0.04, s * (W2 + 0.02), 0xb4bac2, 1));
    for (const x of [bx - 0.04, bx + 1.08, bx - 1.1]) B.goma.push(caja(0.012, 0.62, 0.016, x, 0.78, s * (W2 + 0.005), 0x0e0e10, 1));
  }
  B.placa.push(placaGeo(0.34, 0.17, (R() * PLACAS) | 0, fx + 0.075, 0.58, 0, 1), placaGeo(0.34, 0.17, (R() * PLACAS) | 0, -fx - 0.075, 0.62, 0, -1));
  B.cromo.push(caja(0.012, 0.012, 0.012, 0, 0, 0)); // evita buffers vacíos

  // ruedas (llanta + neumático); una pinchada, a veces
  const pinchada = R() < 0.3 ? (R() * 4 | 0) : -1;
  [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([a, b], i) => {
    const r = i === pinchada ? M.R * 0.82 : M.R, x = a * M.wb / 2, z = b * (W2 - 0.12), y = r;
    B.goma.push(cilRueda(r, 0.24, x, y, z, 0x121214), teñir(new THREE.CircleGeometry(M.R * 1.28, 14).translate(0, 0, 0).rotateY(b > 0 ? 0 : Math.PI).translate(x, M.R + 0.05, b * (W2 + 0.003)), 0x0a0a0c, 1));
    B.cromo.push(cilRueda(r * 0.62, 0.25, x, y, z, 0xb4bac2, 10), cilRueda(r * 0.2, 0.27, x, y, z, 0x80858c, 6));
  });

  // daños: sangre y una puerta abierta
  const nSangre = (R() * 4 | 0) + (quemado ? 0 : 1);
  for (let i = 0; i < nSangre; i++) {
    const s = R() < 0.5 ? -1 : 1, x = lerp(-L2 + 0.5, L2 - 0.6, R()), y = 0.7 + R() * 0.4;
    B.pintura.push(caja(0.18 + R() * 0.3, 0.14 + R() * 0.26, 0.012, x, y, s * (W2 + 0.016), R() < 0.5 ? 0x4a0a0a : 0x2a0808, 1));
  }
  if (R() < 0.3) B.pintura.push(caja(0.5 + R() * 0.4, 0.012, 0.35 + R() * 0.3, lerp(0.5, L2 - 0.6, R()), (tipo === 'pickup' ? 1.34 : 1.07) + 0.02, (R() - 0.5) * 0.6, 0x4a0a0a, 1));
  if (!quemado && tipo !== 'combi' && R() < 0.4) { // puerta del conductor entreabierta (bisagra adelante)
    const s = R() < 0.5 ? -1 : 1, hx0 = xf0 - 0.05, zz = s * (W2 + 0.02);
    B.pintura.push(caja(0.95, 0.78, 0.07, -0.475, 0, 0, pint, 1).rotateY(s * 0.9).translate(hx0, 0.8, zz));
    B.vidrio.push(teñir(new THREE.BoxGeometry(0.8, 0.36, 0.08).translate(-0.475, 0.52, 0).rotateY(s * 0.9).translate(hx0, 0.8, zz), 0x070b10, 1));
  }

  // armar la malla final: una por material
  compactar(B);
  const g = new THREE.Group(); g.name = 'auto';
  for (const k in B) { if (!B[k].length) continue; const geos = B[k].map(x => x.index ? x.toNonIndexed() : x); let n = 0; geos.forEach(x => n += x.attributes.position.count);
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2), col = new Float32Array(n * 3); let o = 0;
    for (const x of geos) { if (!x.attributes.normal) x.computeVertexNormals(); pos.set(x.attributes.position.array, o * 3); nor.set(x.attributes.normal.array, o * 3); if (x.attributes.uv) uv.set(x.attributes.uv.array, o * 2); if (x.attributes.color) col.set(x.attributes.color.array, o * 3); else col.fill(1, o * 3, (o + x.attributes.position.count) * 3); o += x.attributes.position.count; x.dispose(); }
    const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); bg.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); bg.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); bg.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.add(new THREE.Mesh(bg, P[k])); }
  const c = M.cajas;
  return { g, L: M.L, W: M.W, alto: M.alto, cajas: c };
}

// ---------- ómnibus (CUTCSA) ----------
export function crearBus(sem = 5) {
  const P = mats(), R = rng(sem), L = 12, W = 2.6, L2 = L / 2, W2 = W / 2;
  const B = { pintura: [], vidrio: [], cromo: [], goma: [], farol: [], luzRoja: [], luzAmbar: [], placa: [] };
  B.pintura.push(extruir([[-6, 0.4], [-6, 3.5], [5.6, 3.56], [6, 3.15], [6, 0.55], [5.8, 0.4]], W, 0xe8e4da, 0.09));
  B.pintura.push(caja(L + 0.02, 0.5, W + 0.03, 0, 0.95, 0, 0x8a1c1c, 1), caja(L + 0.02, 0.12, W + 0.03, 0, 1.3, 0, 0xd8b050, 1));
  B.goma.push(caja(L - 0.6, 0.2, W - 0.4, 0, 0.36, 0, 0x0e0e10, 1));
  for (const s of [-1, 1]) { // ventanillas con pilares
    const z = s * (W2 + 0.03);
    for (let x = -5.45; x < 4.2; x += 1.14) B.vidrio.push(polig([[x, 1.78], [x, 3.12], [x + 1.0, 3.12], [x + 1.0, 1.78]], z));
    B.vidrio.push(polig([[4.45, 0.7], [4.45, 3.12], [5.3, 3.12], [5.3, 0.7]], z)); // puerta de vidrio
    B.goma.push(caja(0.04, 2.4, 0.02, 4.38, 1.9, s * (W2 + 0.012), 0x111111, 1));
  }
  B.vidrio.push(quad([6.0, 1.45], [5.97, 2.85], W2 - 0.15, 0.02)); B.goma.push(caja(0.04, 1.8, 0.05, 6.03, 2.3, 0, 0x111111, 1));
  B.vidrio.push(quad([-6.0, 2.0], [-6.0, 3.1], W2 - 0.4, -0.02));
  for (const s of [-1, 1]) {
    B.farol.push(caja(0.06, 0.2, 0.3, 6.0, 0.95, s * (W2 - 0.3))); B.luzRoja.push(caja(0.06, 0.3, 0.26, -6.0, 1.1, s * (W2 - 0.22)));
    B.cromo.push(caja(0.06, 0.4, 0.5, 5.4, 2.7, s * (W2 + 0.3)), caja(0.4, 0.04, 0.04, 5.6, 2.7, s * (W2 + 0.1))); // espejos grandes
    for (const x of [3.9, -3.3]) { const r = 0.52, z = s * (W2 - 0.18);
      B.goma.push(cilRueda(r, 0.34, x, r, z, 0x121214, 16), teñir(new THREE.CircleGeometry(0.62, 16).rotateY(s > 0 ? 0 : Math.PI).translate(x, 0.55, s * (W2 + 0.003)), 0x0a0a0c, 1));
      B.cromo.push(cilRueda(r * 0.6, 0.35, x, r, z, 0xb4bac2, 10)); }
  }
  B.placa.push(placaGeo(0.5, 0.25, (R() * PLACAS) | 0, 6.075, 0.6, 0.6, 1), placaGeo(0.5, 0.25, (R() * PLACAS) | 0, -6.075, 0.6, 0, -1));
  for (let i = 0; i < 3; i++) B.cromo.push(caja(0.9, 0.12, 0.7, -3 + i * 2.2, 3.62, 0, 0xb4bac2, 1)); // ventilaciones del techo
  B.pintura.push(caja(0.7, 0.55, 0.012, -1 + R() * 3, 1.1, W2 + 0.02, 0x4a0a0a, 1)); // sangre en la puerta
  const g = new THREE.Group(); g.name = 'bus';
  compactar(B);
  for (const k in B) { if (!B[k].length) continue; const geos = B[k].map(x => x.index ? x.toNonIndexed() : x); let n = 0; geos.forEach(x => n += x.attributes.position.count);
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2), col = new Float32Array(n * 3); let o = 0;
    for (const x of geos) { if (!x.attributes.normal) x.computeVertexNormals(); pos.set(x.attributes.position.array, o * 3); nor.set(x.attributes.normal.array, o * 3); if (x.attributes.uv) uv.set(x.attributes.uv.array, o * 2); if (x.attributes.color) col.set(x.attributes.color.array, o * 3); else col.fill(1, o * 3, (o + x.attributes.position.count) * 3); o += x.attributes.position.count; x.dispose(); }
    const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); bg.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); bg.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); bg.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.add(new THREE.Mesh(bg, P[k])); }
  return g;
}
