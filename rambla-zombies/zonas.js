// Utilería de los mapas nuevos: Pocitos (la pared de edificios y la playa) y Punta Carretas (el faro, las rocas y la niebla).
// Todo va horneado por material o instanciado: cada mapa suma pocos draw calls y nada se crea durante el juego.
import * as THREE from 'https://esm.sh/three@0.160.0';
import { aMundo, muestras, piso, unir, hornear, brilloTex } from './world.js';
import { crearAuto, crearBus } from './autos.js';
import { texFachada } from './texturas.js';
import { MAPAS } from './mapas.js';

const yawDe = i => { const t = muestras[Math.round(i)].t; return Math.atan2(t.x, t.z); };     // z local a lo largo de la rambla
const yawN = i => { const t = muestras[Math.round(i)].t; return Math.atan2(-t.z, t.x); };     // z local hacia la ciudad
const _c = new THREE.Color();
function pintar(g, hex, k = 1) { g = g.index ? g.toNonIndexed() : g; _c.setHex(hex).multiplyScalar(k); const n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = _c.r; a[i * 3 + 1] = _c.g; a[i * 3 + 2] = _c.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; }
const cb = (w, h, d, x, y, z, hex, k) => pintar(new THREE.BoxGeometry(w, h, d).translate(x, y, z), hex, k);
const lugar = (g, x, y, z, yaw) => g.rotateY(yaw).translate(x, y, z);
function rotulo(txt, w, h, fondo, color, fuente) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  if (fondo) { g.fillStyle = fondo; g.fillRect(0, 0, w, h); }
  g.font = fuente; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = color; g.fillText(txt, w / 2, h / 2);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const r = Math.random;

export function crearZonas(scene) {
  const col = [], grupos = {}; let VC, autos, G;
  // cada mapa en su grupo: el que no se juega se apaga entero (no suma draw calls ni triángulos)
  const abrir = id => { G = grupos[id] = new THREE.Group(); G.visible = false; scene.add(G); VC = { pintado: [], emisivo: [], metal: [], silueta: [] }; autos = new THREE.Group(); };
  const cerrar = () => { for (const k in VC) if (VC[k].length) G.add(new THREE.Mesh(unir(VC[k]), MAT[k])); hornear(G, autos); };
  const MAT = {
    pintado: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, metalness: 0.08 }),
    emisivo: new THREE.MeshStandardMaterial({ vertexColors: true, emissive: 0xffffff, emissiveIntensity: 0.9, roughness: 0.6 }),
    metal: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35, metalness: 0.8 }),
    // el faro se recorta contra la niebla: sin niebla, con colores ya mezclados con ella (se ve de lejos sin parecer pegado)
    silueta: new THREE.MeshBasicMaterial({ vertexColors: true, fog: false })
  };
  // vertexColors en emisivo: el color de vértice tiñe el difuso; para que brille con su color usamos un emisivo blanco tenue + color fuerte
  MAT.emisivo.onBeforeCompile = s => { s.fragmentShader = s.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance *= vColor;'); };
  const add = (k, g, x, y, z, yaw) => VC[k].push(lugar(g, x, y, z, yaw));
  const caja2 = (x, z, yaw, hx, hz, y0, y1, extra = {}) => col.push(Object.assign({ x, z, r: Math.hypot(hx, hz), top: y1, metal: true, cajas: [{ cx: x, cz: z, c: Math.cos(yaw), s: Math.sin(yaw), hx, hz, y0, y1 }] }, extra));
  const COLORES = [0x7a2222, 0x24345a, 0x8c9096, 0x2b2b30, 0xa88a38, 0x3c6a4a, 0xd8d8d0, 0x5a2a5a];
  function auto(i, d, giro, modelo, k, quemado) {
    if (Math.abs(i - MAPAS.pocitos.ini) < 9 || Math.abs(i - MAPAS.faro.ini) < 9) return; // el lugar donde arranca el jugador queda libre
    const A = crearAuto(modelo, COLORES[k % COLORES.length], k * 7 + 11, { quemado }), a = A.g, m = muestras[Math.round(i)], p = aMundo(i, d);
    a.position.set(p.x, 1.2, p.z); a.rotation.y = Math.atan2(-m.t.z, m.t.x) + giro; a.rotation.z = (k % 3 - 1) * 0.04; autos.add(a);
    const c = Math.cos(a.rotation.y), s = Math.sin(a.rotation.y), q = A.cajas, ox = q.rcx === undefined ? -0.2 : q.rcx;
    col.push({ x: p.x, z: p.z, r: q.hx + 0.05, top: 1.2 + q.ry1 - 0.1, metal: true, cajas: [
      { cx: p.x, cz: p.z, c, s, hx: q.hx, hz: q.hz, y0: 1.2, y1: 1.2 + q.y1 },
      { cx: p.x + c * ox, cz: p.z - s * ox, c, s, hx: q.rx, hz: q.hz - 0.09, y0: 1.2 + q.y1, y1: 1.2 + q.ry1 }] });
  }
  function valla(i, d) { // valla policial de la Intendencia
    const p = aMundo(i, d), y0 = piso(d), yaw = yawDe(i) + Math.PI / 2 + (r() - .5) * 0.3;
    add('pintado', cb(2.2, 0.28, 0.06, 0, 0.85, 0, 0xe8e8e0), p.x, y0, p.z, yaw); add('pintado', cb(2.2, 0.1, 0.07, 0, 0.85, 0, 0xc02020), p.x, y0, p.z, yaw);
    for (const x of [-0.95, 0.95]) add('metal', cb(0.06, 0.9, 0.5, x, 0.45, 0, 0x50545a), p.x, y0, p.z, yaw);
    caja2(p.x, p.z, yaw, 1.1, 0.25, y0, y0 + 1.0);
  }
  function barricada(i) { for (let d = -8.5; d <= 18; d += 2.4) valla(i, d); } // cierre del mapa en las puntas

  // ======================= POCITOS =======================
  abrir('pocitos');
  {
    const M = MAPAS.pocitos, tx = texFachada(0.5), geos = [], tonos = [0xf2ece0, 0xe6dccb, 0xd8d4cc, 0xefe2c8, 0xcfd6d8, 0xe8d8c0];
    // la pared de edificios frente a la playa: torres altas, pegadas, con balcones (textura) y locales abajo
    for (let i = M.i0 - 30; i < M.i1 + 30; i += 8 + r() * 3) {
      const w = 13 + r() * 5, d = 12 + r() * 4, h = 34 + r() * 42, off = 34 + d / 2 + r() * 2, p = aMundo(i, off), yaw = yawDe(i) + Math.PI / 2;
      const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv, u0 = r();
      for (let q = 0; q < 24; q++) { const f = q >> 2; if (f === 2 || f === 3) uv.setXY(q, 0.015, 0.99); else uv.setXY(q, uv.getX(q) * ((f < 2 ? d : w) / 12) + u0, uv.getY(q) * (h / 24)); }
      geos.push(lugar(pintar(g.translate(0, h / 2, 0), tonos[r() * tonos.length | 0], 0.8 + r() * 0.2), p.x, 1.3, p.z, yaw));
      // locales de planta baja: vidriera iluminada y toldo
      const fr = aMundo(i, off - d / 2 - 0.05);
      add('emisivo', cb(w * 0.8, 2.6, 0.1, 0, 1.6, 0, [0xffc070, 0xfff0d0, 0x80d0ff, 0xff8060][r() * 4 | 0], 0.9), fr.x, 1.3, fr.z, yaw);
      add('pintado', cb(w * 0.85, 0.12, 1.4, 0, 3.2, -0.7, [0x2a5a3a, 0x8a2020, 0x204080, 0x303030][r() * 4 | 0]), fr.x, 1.3, fr.z, yaw);
    }
    G.add(new THREE.Mesh(unir(geos), new THREE.MeshStandardMaterial({ vertexColors: true, map: tx.mapa, emissive: 0xffffff, emissiveMap: tx.emisivo, emissiveIntensity: 1.2, roughness: 0.9 })));
    // sombrillas, toallas y redes de vóley en la playa
    const somb = [], COLS = [0xd23a3a, 0x2a6ac8, 0xe8c030, 0x30a860, 0xe87a20, 0xf0f0f0];
    for (let k = 0; k < 34; k++) { const i = M.i0 + r() * (M.i1 - M.i0), d = -15 - r() * 13, p = aMundo(i, d), caida = r() < 0.3; somb.push([p, caida, COLS[k % COLS.length]]); }
    for (const [p, caida, hex] of somb) {
      const yaw = r() * 6.3, inc = caida ? 1.2 : (r() - .5) * 0.2;
      const palo = new THREE.CylinderGeometry(0.04, 0.04, 2.3, 5).translate(0, 1.15, 0).rotateZ(inc), cop = new THREE.ConeGeometry(1.2, 0.55, 8, 1, true).translate(0, 2.4, 0).rotateZ(inc);
      add('metal', pintar(palo, 0xa0a0a8), p.x, -0.45, p.z, yaw); add('pintado', pintar(cop, hex), p.x, -0.45 + (caida ? 0.3 : 0), p.z, yaw);
      if (r() < 0.6) add('pintado', pintar(new THREE.PlaneGeometry(1.8, 0.9).rotateX(-Math.PI / 2).translate(1.6, 0.02, 0), COLS[(r() * 6) | 0], 0.8), p.x, -0.45, p.z, yaw);
    }
    for (const i of [M.i0 + 30, M.i0 + 80, M.i1 - 25]) {
      const p = aMundo(i, -20), yaw = yawDe(i);
      for (const z of [-4.5, 4.5]) add('metal', cb(0.1, 2.5, 0.1, 0, 1.25, z, 0xd0d0d0), p.x, -0.45, p.z, yaw);
      add('pintado', cb(0.04, 0.9, 9, 0, 2.0, 0, 0x202020, 0.6), p.x, -0.45, p.z, yaw);
    }
    // torres de guardavidas
    for (const i of [M.i0 + 18, M.i0 + 62, M.i0 + 108]) {
      const p = aMundo(i, -24), yaw = yawN(i), y0 = -0.45;
      for (const [x, z] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) add('pintado', cb(0.14, 2.3, 0.14, x, 1.15, z, 0x8a6a40), p.x, y0, p.z, yaw);
      add('pintado', cb(1.8, 1.5, 1.8, 0, 3.1, 0, 0xe8e8e4), p.x, y0, p.z, yaw); add('pintado', cb(2.3, 0.1, 2.3, 0, 3.92, 0, 0xc82a2a), p.x, y0, p.z, yaw);
    }
    // cartel PLAYA POCITOS sobre la vereda, iluminado
    { const i = M.ini + 6, p = aMundo(i, -11.6), yaw = yawN(i);
      const cart = new THREE.Mesh(new THREE.PlaneGeometry(7, 1.2), new THREE.MeshBasicMaterial({ map: rotulo('PLAYA POCITOS', 1024, 176, '#10304a', '#ffe9a8', 'bold 110px "Bangers", Impact, sans-serif'), side: THREE.DoubleSide }));
      cart.position.set(p.x, 5.2, p.z); cart.rotation.y = yaw; G.add(cart);
      for (const x of [-3, 3]) add('metal', cb(0.15, 3.2, 0.15, x, 1.6, 0, 0x30343a), p.x, 2.6, p.z, yaw); }
    // el embotellamiento: autos abandonados en las dos manos, uno dado vuelta, un ómnibus
    let k = 0;
    for (let i = M.i0 + 10; i < M.i1 - 6; i += 11 + r() * 6) { const d = [1.5, 4.5, 7.5, 10][k % 4] + (r() - .5); auto(i, d, (r() - .5) * 0.9, ['sedan', 'hatch', 'taxi', 'pickup', 'combi', 'sedan', 'patrullero'][k % 7], k, k % 5 === 3); k++; }
    { const ib = M.ini - 30, mb = muestras[Math.round(ib)], pb = aMundo(ib, 6), bus = crearBus(11); bus.position.set(pb.x, 1.2, pb.z); bus.rotation.y = Math.atan2(-mb.t.z, mb.t.x) + 0.35; autos.add(bus);
      const cbus = { cx: pb.x, cz: pb.z, c: Math.cos(bus.rotation.y), s: Math.sin(bus.rotation.y), hx: 6, hz: 1.3, y0: 1.2, y1: 5 }, dir = new THREE.Vector3(Math.cos(bus.rotation.y), 0, -Math.sin(bus.rotation.y));
      for (let s = -5; s <= 5; s += 2.5) col.push({ x: pb.x + dir.x * s, z: pb.z + dir.z * s, r: 1.7, top: 5, metal: true, cajas: [cbus] }); }
    // carritos de helado en la vereda
    for (const i of [M.i0 + 40, M.i1 - 40]) { const p = aMundo(i, -8.4), y0 = piso(-8.4), yaw = yawN(i);
      add('pintado', cb(1.5, 0.9, 0.8, 0, 0.8, 0, 0xf0f0f0), p.x, y0, p.z, yaw); add('pintado', cb(1.52, 0.25, 0.82, 0, 1.1, 0, 0x2a7ac8), p.x, y0, p.z, yaw);
      add('pintado', pintar(new THREE.ConeGeometry(1.1, 0.45, 8, 1, true).translate(0, 2.5, 0), 0xe85a8a), p.x, y0, p.z, yaw); add('metal', cb(0.05, 1.4, 0.05, 0, 1.6, 0, 0x909090), p.x, y0, p.z, yaw);
      caja2(p.x, p.z, yaw, 0.8, 0.45, y0, y0 + 1.3); }
    barricada(M.i0 - 3); barricada(M.i1 + 3);
  }

  cerrar();
  // ======================= PUNTA CARRETAS =======================
  let haz = null, brilloFaro = null;
  abrir('faro');
  {
    const M = MAPAS.faro;
    // rocas negras mojadas donde en el resto de la costa hay arena
    const n = 220, roca = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: 0x3a3c3e, roughness: 0.55, metalness: 0.15, flatShading: true }), n);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s = new THREE.Vector3(), cc = new THREE.Color();
    for (let k = 0; k < n; k++) { const i = M.i0 - 20 + r() * (M.i1 - M.i0 + 40), d = -12.6 - Math.pow(r(), 0.7) * 26, p = aMundo(i, d), sc = 0.6 + r() * 2.2;
      e.set(r() * 3, r() * 6.3, r() * 3); q.setFromEuler(e); m4.compose(v.set(p.x, (d < -30 ? -1.1 : -0.6) + sc * 0.25, p.z), q, s.set(sc * (1 + r() * 0.6), sc * 0.6, sc)); roca.setMatrixAt(k, m4); roca.setColorAt(k, cc.setScalar(0.6 + r() * 0.5)); }
    G.add(roca);
    // el faro: torre blanca sobre la punta de rocas, linterna con el haz que gira
    const fi = M.i1 - 22, fp = aMundo(fi, -27), base = -0.4;
    const sil = (geo, hex) => add('silueta', pintar(geo, hex), fp.x, base, fp.z, 0);
    sil(new THREE.CylinderGeometry(5, 7, 2.4, 10).translate(0, 1.2, 0), 0x2e3a3c);
    { const t = new THREE.CylinderGeometry(1.25, 1.8, 19, 14).translate(0, 2.4 + 9.5, 0).toNonIndexed(), c = new THREE.Color(), cs = [];   // torre con luz de luna de un lado
      const pos = t.attributes.position; for (let k = 0; k < pos.count; k++) { const lado = 0.5 + 0.5 * Math.max(-1, Math.min(1, (pos.getX(k) - pos.getZ(k)) / 1.8)); c.setHex(0x6e8486).lerp(new THREE.Color(0xd6dcd6), lado); cs.push(c.r, c.g, c.b); }
      t.setAttribute('color', new THREE.Float32BufferAttribute(cs, 3)); add('silueta', t, fp.x, base, fp.z, 0); }
    for (const y of [7, 13]) sil(new THREE.CylinderGeometry(1.55, 1.65, 0.6, 14).translate(0, y, 0), 0xa02a24);       // franjas rojas
    sil(new THREE.CylinderGeometry(2.1, 2.1, 0.25, 14).translate(0, 21.5, 0), 0x1c2426);
    sil(new THREE.CylinderGeometry(1.0, 1.0, 1.8, 10).translate(0, 22.6, 0), 0xfff0b0);
    sil(new THREE.ConeGeometry(1.3, 1.2, 10).translate(0, 24.1, 0), 0x1c2426);
    add('silueta', pintar(new THREE.BoxGeometry(4, 2.6, 3).translate(3.2, 2.4 + 1.3, 0), 0x8a9a98), fp.x, base, fp.z, 0.4);
    haz = new THREE.Group(); haz.position.set(fp.x, base + 22.6, fp.z);
    const matHaz = new THREE.MeshBasicMaterial({ color: 0xfff2c0, transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
    const geoHaz = unir([new THREE.ConeGeometry(5, 90, 12, 1, true).translate(0, -45, 0).rotateZ(Math.PI / 2), new THREE.ConeGeometry(5, 90, 12, 1, true).translate(0, -45, 0).rotateZ(-Math.PI / 2)]);
    haz.add(new THREE.Mesh(geoHaz, matHaz)); G.add(haz);
    brilloFaro = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([fp.x, base + 22.6, fp.z], 3)),
      new THREE.PointsMaterial({ map: brilloTex('rgba(255,240,190,1)'), size: 46, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    G.add(brilloFaro);
    // botes de pescadores dados vuelta sobre las rocas y la arena
    for (let k = 0; k < 6; k++) { const i = M.i0 + 12 + k * 17 + r() * 6, p = aMundo(i, -14.5 - r() * 3), yaw = r() * 6.3;
      const casco = new THREE.CylinderGeometry(0.75, 0.75, 4, 10, 1, true, 0, Math.PI).rotateZ(Math.PI / 2).scale(1, 0.6, 1);
      add('pintado', pintar(casco, [0x2a6ac8, 0xd23a3a, 0xe8e8e0, 0x2a8a6a][k % 4]), p.x, -0.05, p.z, yaw); }
    // el viejo penal hecho shopping, iluminado, del lado de la ciudad
    { const i = M.ini + 10, off = 46, p = aMundo(i, off), yaw = yawDe(i) + Math.PI / 2;
      add('pintado', cb(44, 14, 22, 0, 7, 0, 0xb8a890), p.x, 1.3, p.z, yaw);
      add('pintado', cb(12, 22, 12, -14, 11, 0, 0xc0b098), p.x, 1.3, p.z, yaw);
      for (let x = -19; x <= 19; x += 3.2) add('emisivo', cb(1.6, 2.6, 0.1, x, 5, -11.06, 0xffd890, 0.7), p.x, 1.3, p.z, yaw);
      const fr = aMundo(i, off - 11.2), cart = new THREE.Mesh(new THREE.PlaneGeometry(16, 2.2), new THREE.MeshBasicMaterial({ map: rotulo('PUNTA CARRETAS', 1024, 140, null, '#ffffff', 'bold 104px "Bangers", Impact, sans-serif'), transparent: true }));
      cart.position.set(fr.x, 13, fr.z); cart.rotation.y = yaw + Math.PI; G.add(cart); }
    // calle con pocos autos, un patrullero y la barricada a medio armar
    let k = 3;
    for (let i = M.i0 + 14; i < M.i1 - 10; i += 17 + r() * 9) { auto(i, [2.5, 8.5, 5.5][k % 3] + (r() - .5), (r() - .5) * 1.4, ['patrullero', 'sedan', 'hatch', 'combi', 'pickup'][k % 5], k, k % 4 === 1); k++; }
    for (let d = -6; d <= 12; d += 3) if (r() < 0.75) valla(M.ini + 24 + (r() - .5) * 3, d);
    barricada(M.i0 - 3); barricada(M.i1 + 3);
  }

  cerrar();
  return {
    colisiones: col,
    mostrar(id) { for (const k in grupos) grupos[k].visible = k === id; },
    update(t) { if (haz && grupos.faro.visible) { haz.rotation.y = t * 0.55; brilloFaro.material.opacity = 0.35 + 0.65 * Math.pow(Math.abs(Math.cos(t * 0.55)), 6); } }
  };
}
