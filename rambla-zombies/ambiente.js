// Ambiente de la Rambla: el cartel MONTEVIDEO, kioscos, el carrito de chivitos, torres de guardavidas y sombrillas en la playa,
// pasos peatonales con semáforos, banderas uruguayas, tachos y plátanos. Casi todo se junta en pocas mallas (pocos draw calls).
import * as THREE from 'https://esm.sh/three@0.160.0';
import { aMundo, muestras, piso, NM, unir } from './world.js';

const tang = i => muestras[Math.round(i)].t;
const yawDe = i => { const t = tang(i); return Math.atan2(t.x, t.z); };      // el eje z local mira a lo largo de la rambla
const yawN = i => { const t = tang(i); return Math.atan2(-t.z, t.x); };      // el eje z local mira hacia la ciudad (perpendicular)
const caja = (w, h, d, x = 0, y = 0, z = 0) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3(1, 1, 1);

function rotulo(lineas, w, h, fondo, color, fuente, borde) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  if (fondo) { g.fillStyle = fondo; g.fillRect(0, 0, w, h); }
  g.font = fuente; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  lineas.forEach((l, i) => { const y = h * (i + 0.5) / lineas.length; if (borde) { g.lineWidth = borde[1]; g.strokeStyle = borde[0]; g.strokeText(l, w / 2, y); } g.fillStyle = color; g.fillText(l, w / 2, y); });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function pintar(g, hex, k = 1) { const c = new THREE.Color(hex).multiplyScalar(k), n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3); g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; }
const cb = (w, h, d, x, y, z, hex, k = 1) => pintar(caja(w, h, d, x, y, z), hex, k);

// junta geometrías por material y las lleva a su lugar en el mundo (yaw + posición)
class Lote {
  constructor() { this.l = {}; }
  add(clave, geo, x, y, z, yaw) { if (!geo.attributes.color && clave !== 'oscuro' && clave !== 'toldo') pintar(geo, 0x9a9aa0); geo.rotateY(yaw); geo.translate(x, y, z); (this.l[clave] || (this.l[clave] = [])).push(geo.index ? geo.toNonIndexed() : geo); }
  construir(scene, mats) { for (const k in this.l) scene.add(new THREE.Mesh(unir(this.l[k]), mats[k])); }
}

export function crearAmbiente(scene) {
  const C = NM / 2;
  const col = [], L = new Lote(), flags = [], ambar = [];
  const MAT = {
    pintado: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.65, metalness: 0.15 }),
    metal: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, metalness: 0.8 }),
    emisivo: new THREE.MeshStandardMaterial({ vertexColors: true, color: 0xffffff, emissive: 0xffc870, emissiveIntensity: 1.3, roughness: 0.5 }),
    oscuro: new THREE.MeshStandardMaterial({ color: 0x0c0e12, roughness: 0.3, metalness: 0.6 }),
    toldo: new THREE.MeshStandardMaterial({ map: (() => { const c = document.createElement('canvas'); c.width = 128; c.height = 16; const g = c.getContext('2d'); for (let k = 0; k < 8; k++) { g.fillStyle = k % 2 ? '#f0ece0' : '#c0282a'; g.fillRect(k * 16, 0, 16, 16); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })(), side: THREE.DoubleSide, roughness: 0.8 })
  };

  // ---------- el cartel MONTEVIDEO, en la arena frente al centro de la zona de juego ----------
  {
    const i = C + 14, d = -27, p = aMundo(i, d), y = -0.4, yaw = yawN(i);
    const tx = rotulo(['MONTEVIDEO'], 2048, 300, null, '#f4f6f8', 'bold 215px "Bangers", "Impact", sans-serif', ['#2a7fc0', 26]);
    const cartel = new THREE.Mesh(new THREE.PlaneGeometry(30, 4.4), new THREE.MeshStandardMaterial({ map: tx, alphaTest: 0.45, side: THREE.DoubleSide, emissive: 0xffffff, emissiveMap: tx, emissiveIntensity: 0.28, roughness: 0.7 }));
    cartel.position.set(p.x, y + 3.1, p.z); cartel.rotation.y = yaw; scene.add(cartel);
    L.add('pintado', cb(31, 0.6, 1.0, 0, 0.3, 0, 0x9a948a), p.x, y, p.z, yaw);
    for (const x of [-12, 0, 12]) L.add('metal', cb(0.25, 2.2, 0.25, x, 1.4, -0.05, 0x3a3e44), p.x, y, p.z, yaw);
  }

  // ---------- kioscos de la rambla ----------
  function kiosco(i, d, hex, texto) {
    const p = aMundo(i, d), y0 = piso(d), yaw = yawN(i), c = Math.cos(yaw), s = Math.sin(yaw);
    L.add('pintado', cb(3.2, 2.6, 2.0, 0, 1.3, 0, hex), p.x, y0, p.z, yaw);
    L.add('pintado', cb(3.22, 0.22, 2.02, 0, 0.35, 0, 0x2a2a30), p.x, y0, p.z, yaw);
    L.add('pintado', cb(3.5, 0.14, 2.4, 0, 2.66, 0.1, 0x30343a), p.x, y0, p.z, yaw);
    L.add('oscuro', caja(2.7, 1.15, 0.05, 0, 1.55, 1.01), p.x, y0, p.z, yaw);
    L.add('emisivo', cb(2.5, 0.95, 0.02, 0, 1.55, 1.0, 0xffd890), p.x, y0, p.z, yaw);
    for (let k = 0; k < 18; k++) { const colr = [0xd03030, 0x2a60c0, 0xe0c030, 0x30a050, 0xe07020, 0xf0f0f0][k % 6]; L.add('pintado', cb(0.16, 0.2 + (k % 3) * 0.05, 0.08, -1.1 + (k % 9) * 0.27, 1.25 + (k / 9 | 0) * 0.42, 0.97, colr), p.x, y0, p.z, yaw); }
    L.add('pintado', cb(3.0, 0.1, 0.55, 0, 0.98, 1.25, 0x6a4a2a), p.x, y0, p.z, yaw);
    const to = new THREE.PlaneGeometry(3.7, 1.35); to.rotateX(-Math.PI / 2 + 0.55); to.translate(0, 2.5, 1.75); L.add('toldo', to, p.x, y0, p.z, yaw);
    const cart = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.5), new THREE.MeshBasicMaterial({ map: rotulo([texto], 512, 100, '#101820', '#ffd24a', 'bold 64px sans-serif') }));
    cart.position.set(p.x + Math.sin(yaw) * 1.06, y0 + 2.28, p.z + Math.cos(yaw) * 1.06); cart.rotation.y = yaw; scene.add(cart);
    col.push({ x: p.x, z: p.z, r: 1.95, top: y0 + 2.7, metal: true, cajas: [{ cx: p.x, cz: p.z, c: Math.cos(yaw + Math.PI / 2 * 0) , s: Math.sin(yaw), hx: 1.65, hz: 1.05, y0, y1: y0 + 2.7 }] });
    // la caja se alinea con el yaw del kiosco: x local → mundo (cos, -sin)
    const q = col[col.length - 1].cajas[0]; q.c = c; q.s = s;
  }
  kiosco(C - 50, -6.2, 0x2f6f8f, 'KIOSCO · DIARIOS');
  kiosco(C + 30, -6.2, 0x8a3a2a, 'KIOSCO · REFRESCOS');

  // ---------- el carrito de chivitos ----------
  {
    const i = C + 13, d = -8.6, p = aMundo(i, d), y0 = piso(d), yaw = yawN(i);
    L.add('pintado', cb(1.7, 0.9, 0.9, 0, 0.85, 0, 0xb83a1a), p.x, y0, p.z, yaw);
    L.add('pintado', cb(1.74, 0.1, 0.94, 0, 1.33, 0, 0x2a2a30), p.x, y0, p.z, yaw);
    L.add('metal', cb(1.1, 0.06, 0.6, 0.2, 1.4, 0, 0x2a2a2e), p.x, y0, p.z, yaw);
    L.add('emisivo', cb(0.5, 0.04, 0.4, -0.5, 1.4, 0, 0xff6a20), p.x, y0, p.z, yaw);
    for (const sx of [-0.7, 0.7]) { const r = new THREE.CylinderGeometry(0.32, 0.32, 0.08, 12).rotateX(Math.PI / 2); L.add('oscuro', r, 0, 0, 0, 0); L.l.oscuro.pop(); L.add('oscuro', r.translate(sx, 0.32, 0.5), p.x, y0, p.z, yaw); L.add('oscuro', new THREE.CylinderGeometry(0.32, 0.32, 0.08, 12).rotateX(Math.PI / 2).translate(sx, 0.32, -0.5), p.x, y0, p.z, yaw); }
    L.add('metal', cb(0.05, 1.7, 0.05, 0.7, 2.1, -0.35, 0x8a8a90), p.x, y0, p.z, yaw);
    const sb = new THREE.ConeGeometry(1.3, 0.5, 8, 1, true); sb.translate(0.7, 2.9, -0.35); L.add('toldo', sb, p.x, y0, p.z, yaw);
    const cart = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.4), new THREE.MeshBasicMaterial({ map: rotulo(['CHIVITOS AL PAN'], 512, 128, '#c8281a', '#fff2c0', 'bold 62px sans-serif') }));
    cart.position.set(p.x + Math.sin(yaw) * 0.47, y0 + 0.85, p.z + Math.cos(yaw) * 0.47); cart.rotation.y = yaw; scene.add(cart);
    col.push({ x: p.x, z: p.z, r: 1.1, top: y0 + 1.4, metal: true, cajas: [{ cx: p.x, cz: p.z, c: Math.cos(yaw), s: Math.sin(yaw), hx: 0.88, hz: 0.48, y0, y1: y0 + 1.4 }] });
  }

  // ---------- torres de guardavidas en la arena ----------
  for (const i of [C - 28, C + 40, C + 96]) {
    const d = -22, p = aMundo(i, d), y0 = -0.45, yaw = yawN(i);
    for (const [x, z] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) L.add('pintado', cb(0.14, 2.3, 0.14, x, 1.15, z, 0x8a6a40), p.x, y0, p.z, yaw);
    L.add('pintado', cb(2.2, 0.12, 2.2, 0, 2.3, 0, 0x8a6a40), p.x, y0, p.z, yaw);
    L.add('pintado', cb(1.8, 1.5, 1.8, 0, 3.1, 0, 0xe8e8e4), p.x, y0, p.z, yaw);
    L.add('pintado', cb(1.82, 0.28, 1.82, 0, 3.35, 0, 0xc82a2a), p.x, y0, p.z, yaw);
    L.add('oscuro', caja(1.4, 0.6, 0.04, 0, 3.25, 0.92), p.x, y0, p.z, yaw);
    L.add('pintado', cb(2.3, 0.1, 2.3, 0, 3.92, 0, 0xc82a2a), p.x, y0, p.z, yaw);
    L.add('pintado', cb(0.06, 1.4, 0.06, 1.1, 4.6, -1.0, 0xd8d8d8), p.x, y0, p.z, yaw);
    L.add('pintado', cb(0.9, 0.5, 0.03, 1.55, 5.1, -1.0, 0xd02020), p.x, y0, p.z, yaw);
    for (let k = 0; k < 4; k++) L.add('pintado', cb(0.9, 0.1, 0.12, 0, 0.3 + k * 0.5, 1.15, 0x8a6a40), p.x, y0 + k * 0, p.z, yaw); // escalera
  }

  // ---------- pasos peatonales con semáforos ----------
  const zebra = [];
  for (const i of [C - 34, C + 36, C + 104]) {
    const yaw = yawDe(i);
    for (let d = -1.8; d <= 11.4; d += 1.0) { const p = aMundo(i, d); zebra.push({ x: p.x, y: piso(d) + 0.02, z: p.z, yaw }); }
    for (const [d, lado] of [[-2.9, 1], [12.6, -1]]) {
      const p = aMundo(i + 1.6 * lado, d), y0 = piso(d), yw = yawN(i);
      L.add('metal', cb(0.12, 3.6, 0.12, 0, 1.8, 0, 0x2a2e34), p.x, y0, p.z, yw);
      L.add('pintado', cb(0.4, 1.1, 0.3, 0, 3.7, 0, 0x16181c), p.x, y0, p.z, yw);
      L.add('emisivo', cb(0.2, 0.2, 0.05, 0, 4.05, 0.16, 0xff2418), p.x, y0, p.z, yw * 1);
      const a = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.05), new THREE.MeshBasicMaterial({ color: 0xffa000 })); a.position.set(p.x + Math.sin(yw) * 0.17, y0 + 3.7, p.z + Math.cos(yw) * 0.17); a.rotation.y = yw; scene.add(a); ambar.push(a);
    }
  }
  {
    const im = new THREE.InstancedMesh(new THREE.BoxGeometry(0.5, 0.03, 3.3), new THREE.MeshStandardMaterial({ color: 0xdcdad0, roughness: 0.85, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }), zebra.length);
    zebra.forEach((o, k) => { _e.set(0, o.yaw, 0); _q.setFromEuler(_e); _m.compose(_v.set(o.x, o.y, o.z), _q, _s); im.setMatrixAt(k, _m); }); scene.add(im);
  }

  // ---------- banderas uruguayas en mástiles de la vereda ----------
  {
    const cv = document.createElement('canvas'); cv.width = 180; cv.height = 120; const g = cv.getContext('2d');
    for (let k = 0; k < 9; k++) { g.fillStyle = k % 2 ? '#2a5ab0' : '#f4f4f4'; g.fillRect(0, k * 13.4, 180, 13.4); }
    g.fillStyle = '#f4f4f4'; g.fillRect(0, 0, 67, 67); g.fillStyle = '#f2c230'; g.beginPath(); g.arc(33, 33, 14, 0, 6.3); g.fill();
    g.strokeStyle = '#f2c230'; g.lineWidth = 2; for (let k = 0; k < 16; k++) { const a = k / 16 * 6.283; g.beginPath(); g.moveTo(33 + Math.cos(a) * 15, 33 + Math.sin(a) * 15); g.lineTo(33 + Math.cos(a) * 23, 33 + Math.sin(a) * 23); g.stroke(); }
    const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace;
    for (const i of [C - 62, C - 18, C + 8, C + 52, C + 88, C + 120]) {
      const d = -9.9, p = aMundo(i, d), y0 = piso(d), yw = yawDe(i);
      L.add('metal', new THREE.CylinderGeometry(0.06, 0.09, 7.5, 6).translate(0, 3.75, 0), p.x, y0, p.z, 0);
      const gr = new THREE.Group(); gr.position.set(p.x, y0 + 6.7, p.z); const f = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.27, 6, 1), new THREE.MeshStandardMaterial({ map: tx, side: THREE.DoubleSide, roughness: 0.9 }));
      f.position.x = 0.95; gr.add(f); gr.rotation.y = yw + Math.PI / 2; scene.add(gr); flags.push({ gr, f, yw, k: Math.random() * 6 });
      col.push({ x: p.x, z: p.z, r: 0.18, top: y0 + 7.5, metal: true });
    }
  }

  // ---------- tachos de basura sobre la vereda del muro ----------
  for (let i = C - 66; i < C + 126; i += 19) {
    const d = -9.7, p = aMundo(i, d), y0 = piso(d), yw = yawDe(i);
    L.add('pintado', pintar(new THREE.CylinderGeometry(0.3, 0.26, 0.85, 8).translate(0, 0.45, 0), 0xd2681a), p.x, y0, p.z, yw);
    L.add('oscuro', new THREE.CylinderGeometry(0.32, 0.32, 0.07, 8).translate(0, 0.9, 0), p.x, y0, p.z, yw);
    col.push({ x: p.x, z: p.z, r: 0.34, top: y0 + 0.95, metal: true });
  }

  L.construir(scene, MAT);

  // ---------- sombrillas y toallas en la arena ----------
  {
    const N1 = 18, COL = [0xd23a3a, 0x2a6ac8, 0xe8c030, 0x30a860, 0xe87a20, 0xf0f0f0, 0x9a40c0], palos = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.04, 0.04, 2.3, 5).translate(0, 1.15, 0), new THREE.MeshStandardMaterial({ color: 0x9a9aa0, metalness: 0.7, roughness: 0.4 }), N1);
    const cop = new THREE.InstancedMesh(new THREE.ConeGeometry(1.15, 0.55, 8, 1, true).translate(0, 2.4, 0), new THREE.MeshStandardMaterial({ roughness: 0.8, side: THREE.DoubleSide }), N1);
    const tol = new THREE.InstancedMesh(new THREE.PlaneGeometry(1.8, 0.9).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ roughness: 0.95, side: THREE.DoubleSide }), 26);
    const c = new THREE.Color();
    for (let k = 0; k < N1; k++) {
      const i = C - 66 + k * 11 + Math.random() * 5, d = -15 - Math.random() * 11, p = aMundo(i, d), caida = Math.random() < 0.25;
      _e.set(caida ? 1.1 : (Math.random() - 0.5) * 0.25, Math.random() * 6.3, caida ? 0.4 : (Math.random() - 0.5) * 0.25); _q.setFromEuler(_e); _m.compose(_v.set(p.x, -0.45 + (caida ? 0.4 : 0), p.z), _q, _s);
      palos.setMatrixAt(k, _m); cop.setMatrixAt(k, _m); cop.setColorAt(k, c.setHex(COL[k % COL.length]));
    }
    for (let k = 0; k < 26; k++) { const i = C - 70 + Math.random() * 190, d = -14 - Math.random() * 13, p = aMundo(i, d); _e.set(0, Math.random() * 6.3, 0); _q.setFromEuler(_e); _m.compose(_v.set(p.x, -0.44, p.z), _q, _s); tol.setMatrixAt(k, _m); tol.setColorAt(k, c.setHex(COL[(k * 3) % COL.length]).multiplyScalar(0.8)); }
    scene.add(palos, cop, tol);
  }

  // ---------- plátanos del lado de la ciudad (alternan con las palmeras) ----------
  {
    const arboles = []; for (let i = C - 74; i < C + 132; i += 9) arboles.push({ p: aMundo(i + 4.5, 15.6), s: 0.9 + Math.random() * 0.5, h: Math.random() });
    const n = arboles.length, tr = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.2, 0.32, 4.6, 7).translate(0, 2.3, 0), new THREE.MeshStandardMaterial({ color: 0x5a5448, roughness: 1 }), n);
    const geoC = [new THREE.IcosahedronGeometry(2.3, 1).translate(0, 5.6, 0), new THREE.IcosahedronGeometry(1.7, 1).translate(1.3, 4.7, 0.5), new THREE.IcosahedronGeometry(1.6, 1).translate(-1.2, 5.0, -0.7)];
    const copa = new THREE.InstancedMesh(unir(geoC), new THREE.MeshStandardMaterial({ roughness: 0.95, flatShading: true }), n), c = new THREE.Color();
    arboles.forEach((a, k) => { _e.set(0, a.h * 6.3, 0); _q.setFromEuler(_e); _m.compose(_v.set(a.p.x, 1.3, a.p.z), _q, _s.set(a.s, a.s, a.s)); tr.setMatrixAt(k, _m); copa.setMatrixAt(k, _m); copa.setColorAt(k, c.setHSL(0.27 + a.h * 0.06, 0.38, 0.17 + a.h * 0.07)); });
    _s.set(1, 1, 1); scene.add(tr, copa);
  }

  return {
    colisiones: col,
    update(t) {
      for (const f of flags) { f.f.rotation.y = Math.sin(t * 1.7 + f.k) * 0.18; f.gr.rotation.y = f.yw + Math.PI / 2 + Math.sin(t * 0.5 + f.k) * 0.25; }
      const on = Math.sin(t * 5) > 0; for (const a of ambar) a.visible = on;
    }
  };
}
