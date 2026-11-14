// Mundo: el Río de la Plata, la rambla, los edificios, el Cerro y los autos abandonados
import * as THREE from 'https://esm.sh/three@0.160.0';
import { crearProps } from './props.js';
import { crearAuto, crearBus } from './autos.js';
import { texAsfalto, texBaldosa, texPiedra, texArena, texFachada } from './texturas.js';
import { crearAmbiente } from './ambiente.js';
import { crearZonas } from './zonas.js';
import { crearBarrio } from './barrio.js';

export function brilloTex(color) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, color); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

// Curva de la rambla
export const curva = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-500, 0, 40), new THREE.Vector3(-250, 0, 10), new THREE.Vector3(-80, 0, 30),
  new THREE.Vector3(80, 0, 0), new THREE.Vector3(250, 0, 25), new THREE.Vector3(500, 0, -20)
]);

// Tabla de muestras para pasar de (x,z) a (índice, distancia lateral)
const N = 600;
export const muestras = curva.getSpacedPoints(N).map((p, i) => {
  const t = curva.getTangentAt(i / N);
  return { p, t, n: new THREE.Vector3(-t.z, 0, t.x) };
});
export const NM = N;

// devuelve {i, d}: índice de muestra más cercano y desplazamiento lateral (+ ciudad, - río)
export function local(x, z, out = {}) {
  let lo = 0, hi = N;
  while (lo < hi) { const m = (lo + hi) >> 1; if (muestras[m].p.x < x) lo = m + 1; else hi = m; }
  let best = 1e9, bi = lo;
  for (let k = Math.max(0, lo - 10); k <= Math.min(N, lo + 10); k++) {
    const p = muestras[k].p, dd = (p.x - x) ** 2 + (p.z - z) ** 2;
    if (dd < best) { best = dd; bi = k; }
  }
  const m = muestras[bi];
  out.i = bi; out.d = (x - m.p.x) * m.n.x + (z - m.p.z) * m.n.z;
  return out;
}

// punto del mundo a partir de (índice, lateral)
export function aMundo(i, d, out = new THREE.Vector3()) {
  const m = muestras[Math.max(0, Math.min(N, Math.round(i)))];
  return out.copy(m.p).addScaledVector(m.n, d);
}

// altura del piso según la distancia lateral
export function piso(d) {
  if (d < -30) return -0.95;         // agua
  if (d < -12.1) return -0.5;        // arena
  if (d < -10.8) return 2.6;         // muro
  if (d < -2.5) return 1.6;          // vereda
  if (d < 12) return 1.2;            // calle
  return 1.3;                        // ciudad
}

function cinta(ancho, off, alto, color, tex = null, tile = 4) {
  const pts = curva.getSpacedPoints(300), pos = [], uv = [], idx = [], paso = curva.getLength() / 300;
  pts.forEach((p, i) => {
    const t = curva.getTangentAt(i / 300);
    const n = new THREE.Vector3(-t.z, 0, t.x);
    const a = p.clone().addScaledVector(n, off), b = p.clone().addScaledVector(n, off + ancho);
    pos.push(a.x, alto, a.z, b.x, alto, b.z); uv.push(i * paso / tile, 0, i * paso / tile, ancho / tile);
    if (i < 300) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color, map: tex, side: THREE.DoubleSide, roughness: 0.9 }));
}

function crearMar(scene, movil) {
  const sx = movil ? 70 : 120, sz = movil ? 40 : 60;
  const geo = new THREE.PlaneGeometry(1600, 900, sx, sz);
  geo.rotateX(-Math.PI / 2); geo.translate(0, 0, -470);
  const mat = new THREE.MeshStandardMaterial({ color: 0x0a1a2e, roughness: 0.25, metalness: 0.9, flatShading: true });
  const uT = { value: 0 }; // olas en la GPU: cero trabajo de CPU por cuadro (flatShading saca la normal de las derivadas)
  mat.onBeforeCompile = s => {
    s.uniforms.uT = uT;
    s.vertexShader = 'uniform float uT;\n' + s.vertexShader.replace('#include <begin_vertex>',
      'vec3 transformed = vec3(position);\n transformed.y = -0.9 + sin(position.x * 0.03 + uT * 1.2) * 0.5 + sin(position.z * 0.05 + uT * 0.9) * 0.4 + sin((position.x + position.z) * 0.11 + uT * 2.1) * 0.2;');
  };
  const mar = new THREE.Mesh(geo, mat); scene.add(mar);
  // reflejo de la luna: un solo Points (1 draw call)
  const nr = 50, pr = new Float32Array(nr * 3), fr = new Float32Array(nr);
  for (let i = 0; i < nr; i++) { const z = -60 - i * 12; pr.set([-60 + z * 0.35 + (Math.random() - .5) * 24, 0.2, z], i * 3); fr[i] = Math.random() * 6; }
  const gr = new THREE.BufferGeometry(); gr.setAttribute('position', new THREE.BufferAttribute(pr, 3));
  const reflejo = new THREE.Points(gr, new THREE.PointsMaterial({ map: brilloTex('rgba(230,235,255,1)'), size: 26, transparent: true, opacity: 0.45,
    blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(reflejo);
  function update(t) {
    uT.value = t;
    reflejo.material.opacity = 0.35 + 0.15 * Math.sin(t * 2.3);
  }
  return { update };
}

let espuma = null;
function crearRambla(scene) {
  const tAsf = texAsfalto(), tBal = texBaldosa(), tPie = texPiedra(), tAre = texArena();
  // v8: las cintas y paredes que comparten textura van en UNA malla (el color pasa a color de vértice): 10 draw calls → 5
  const lotes = new Map(), sumar = (...ms) => { for (const m of ms) { const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry, c = m.material.color, n = g.attributes.position.count, a = new Float32Array(n * 3);
    for (let k = 0; k < n; k++) { a[k * 3] = c.r; a[k * 3 + 1] = c.g; a[k * 3 + 2] = c.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3));
    const key = m.material.map || 'liso'; if (!lotes.has(key)) lotes.set(key, { geos: [], r: m.material.roughness }); lotes.get(key).geos.push(g); m.material.dispose(); } };
  sumar(cinta(14.5, -2.5, 1.2, 0x3a3a44, tAsf, 6));
  sumar(cinta(8.3, -10.8, 1.6, 0x9c8f7c, tBal, 4));
  sumar(cinta(1.3, -12.1, 2.6, 0xc4b6a0, tBal, 4));
  sumar(cinta(2.5, 12, 1.45, 0x8a7e6e, tBal, 4));   // vereda del lado de la ciudad
  sumar(cinta(300, 14.5, 1.3, 0x2c2f36, tAsf, 10));
  sumar(cinta(20, -32, -0.5, 0x6a604c, tAre, 8));
  sumar(cinta(0.25, 4.6, 1.22, 0xd9c26a)); // línea amarilla
  // el muro de la rambla: cara de piedra hacia la arena y escalón hacia la vereda
  sumar(pared(-12.1, -0.5, 2.6, 0xb4a690, tPie), pared(-10.8, 1.6, 2.6, 0xc4b6a0, tPie));
  sumar(cinta(0.6, -12.25, 2.62, 0xd6c8b0, tBal, 2));
  lotes.forEach((l, key) => { const g = unir(l.geos); g.computeBoundingSphere(); scene.add(new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, map: key === 'liso' ? null : key, side: THREE.DoubleSide, roughness: l.r }))); });
  // espuma en la orilla: una cinta aditiva que respira con las olas
  espuma = cinta(2.2, -33.2, -0.42, 0xffffff);
  espuma.material = new THREE.MeshBasicMaterial({ color: 0x9ab0c8, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false });
  scene.add(espuma);
  // Faroles en las dos veredas: todo instanciado, la luz del piso es un "charco" aditivo, no una luz real
  const n = 110, total = (n + 1) * 2;
  const postes = new THREE.InstancedMesh(unir([new THREE.CylinderGeometry(0.12, 0.18, 7.4, 6).translate(0, 3.7, 0), new THREE.BoxGeometry(0.1, 0.1, 1.6).translate(0, 7.3, 0.8)]), /* v8: poste y brazo en una sola malla */ new THREE.MeshStandardMaterial({ color: 0x2a2c30, roughness: 0.6, metalness: 0.4 }), total);
  const cabezas = new THREE.InstancedMesh(new THREE.BoxGeometry(0.55, 0.22, 0.8), new THREE.MeshStandardMaterial({ color: 0xffe0b0, emissive: 0xffb060, emissiveIntensity: 2.5 }), total);
  const charcos = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ map: charcoTex(), color: 0xffa850, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }), total);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s1 = new THREE.Vector3(1, 1, 1), s2 = new THREE.Vector3();
  const pf = new Float32Array(total * 3), focos = [];
  let k = 0;
  for (const lado of [-1, 1]) for (let i = 0; i <= n; i++) {
    const idx = Math.min(N, (i + (lado > 0 ? 0.5 : 0)) / n * N), m = muestras[Math.round(idx)];
    const dPoste = lado < 0 ? -9.6 : 13.2, dCabeza = lado < 0 ? -8.1 : 11.7;
    const p = aMundo(idx, dPoste), c = aMundo(idx, dCabeza), yb = piso(dPoste);
    const yaw = Math.atan2(c.x - p.x, c.z - p.z);
    e.set(0, yaw, 0); q.setFromEuler(e);
    m4.compose(v.set(p.x, yb, p.z), q, s1); postes.setMatrixAt(k, m4);
    m4.compose(v.set(c.x, yb + 7.25, c.z), q, s1); cabezas.setMatrixAt(k, m4);
    const yp = piso(dCabeza) + 0.04;
    m4.compose(v.set(c.x, yp, c.z), q, s2.set(13, 1, 13)); charcos.setMatrixAt(k, m4);
    pf.set([c.x, yb + 7.1, c.z], k * 3);
    focos.push(new THREE.Vector3(c.x, yb + 7, c.z));
    k++;
  }
  scene.add(postes, cabezas, charcos);
  const gf = new THREE.BufferGeometry(); gf.setAttribute('position', new THREE.BufferAttribute(pf, 3));
  const halos = new THREE.Points(gf, new THREE.PointsMaterial({ map: brilloTex('rgba(255,190,110,1)'), size: 4.5, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(halos);
  // 4 luces reales que se mudan a los faroles más cercanos al jugador
  const luces = [];
  for (let j = 0; j < 4; j++) { const l = new THREE.PointLight(0xffb468, 38, 24, 1.4); scene.add(l); luces.push(l); }
  let reubicar = 0;
  const cerca = [];
  return {
    update(t, dt, jugador) {
      if (jugador && (reubicar -= dt) <= 0) {
        reubicar = 0.3; cerca.length = 0;
        for (const f of focos) { const d2 = (f.x - jugador.x) ** 2 + (f.z - jugador.z) ** 2; if (d2 < 3600) cerca.push([d2, f]); }
        cerca.sort((a, b) => a[0] - b[0]);
        luces.forEach((l, j) => { const f = cerca[j]; if (f) l.position.copy(f[1]); l.visible = true; l.intensity = f ? 38 : 0; });
      }
      if (espuma) espuma.material.opacity = 0.16 + 0.12 * Math.sin(t * 1.1);
      luces[3].intensity = cerca[3] ? (Math.sin(t * 17) > -0.3 || Math.sin(t * 2.1) > 0 ? 38 : 10) : 0; // uno que titila
    }
  };
}

function pared(off, y0, y1, color, tex = null) {
  const pts = curva.getSpacedPoints(300), pos = [], uv = [], idx = [], paso = curva.getLength() / 300;
  pts.forEach((p, i) => {
    const t = curva.getTangentAt(i / 300), n = new THREE.Vector3(-t.z, 0, t.x), a = p.clone().addScaledVector(n, off);
    pos.push(a.x, y0, a.z, a.x, y1, a.z); uv.push(i * paso / 4, y0 / 2, i * paso / 4, y1 / 2);
    if (i < 300) idx.push(i * 2, i * 2 + 2, i * 2 + 1, i * 2 + 1, i * 2 + 2, i * 2 + 3);
  });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  return new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color, map: tex, roughness: 0.95, side: THREE.DoubleSide }));
}

function charcoTex() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

function crearEdificios(scene) {
  const por = 55, techos = [], luzP = [];
  const tonos = [0xe4dccc, 0xc9c0b0, 0xb9b5ad, 0xd9c9b1, 0xc3b9a8, 0xd2d2cd, 0xbfa890, 0xa8b4b8];
  const pintar = (g, hex, k) => { const c = new THREE.Color(hex).multiplyScalar(k), n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3); g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; };
  const pos = (g, p, yaw, y) => { g.rotateY(yaw); g.translate(p.x, y, p.z); return g; };
  // una sola textura y una sola malla para los 220 edificios (antes 4 mallas): el desfase de UV ya los hace distintos
  const tx = texFachada(0.35);
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, map: tx.mapa, emissive: 0xffffff, emissiveMap: tx.emisivo, emissiveIntensity: 1.3, roughness: 0.95 });
  const geos = [];
  for (let k = 0; k < 4; k++) {
    for (let j = 0; j < por; j++) {
      const i = Math.random() * N, m = muestras[Math.round(i)];
      const w = 10 + Math.random() * 12, d = 10 + Math.random() * 10;
      const off = 33 + Math.random() * 150, h = 10 + Math.pow(Math.random(), 2) * (j < 25 ? 70 : 35);
      const p = aMundo(i, off);
      if (Math.abs(i - N * 0.5 - 128) < 28 && off < 110) { j--; continue; } // dejar ver el Palacio Salvo
      const yaw = Math.atan2(m.t.x, m.t.z), g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv, u0 = Math.random();
      for (let q = 0; q < 24; q++) {
        const f = q >> 2, u = uv.getX(q), v = uv.getY(q);
        if (f >= 2 && f <= 3) uv.setXY(q, 0.015, 0.99);               // techo y base: la esquina lisa de la textura
        else uv.setXY(q, u * ((f < 2 ? d : w) / 12) + u0, v * (h / 24));
      }
      pintar(g, tonos[Math.random() * tonos.length | 0], 0.72 + Math.random() * 0.28); geos.push(pos(g, p, yaw, 1.3 + h / 2));
      // azotea: cuarto de máquinas, tanque de agua y antena (en todos los edificios, en un solo mesh)
      const y0 = 1.3 + h, loc = (x, z) => ({ x: p.x + Math.cos(yaw) * x + Math.sin(yaw) * z, z: p.z - Math.sin(yaw) * x + Math.cos(yaw) * z });
      techos.push(pos(pintar(new THREE.BoxGeometry(w * 0.28, 2.6, d * 0.3), 0x6a6e74, 1), loc(-w * 0.2, d * 0.15), yaw, y0 + 1.3).rotateY(0));
      if (Math.random() < 0.5) { const q = loc(w * 0.22, -d * 0.2); techos.push(pos(pintar(new THREE.CylinderGeometry(1.3, 1.3, 2.2, 9), 0x7a6a58, 1), q, 0, y0 + 2.4)); for (const [dx, dz] of [[-0.9, -0.9], [0.9, 0.9]]) techos.push(pos(pintar(new THREE.BoxGeometry(0.2, 1.3, 0.2), 0x4a4e54, 1), { x: q.x + dx, z: q.z + dz }, 0, y0 + 0.65)); }
      if (Math.random() < 0.35 || h > 45) { const q = loc(w * 0.3, d * 0.25); techos.push(pos(pintar(new THREE.CylinderGeometry(0.06, 0.08, 7, 4), 0x30343a, 1), q, 0, y0 + 3.5)); if (h > 45) luzP.push(q.x, y0 + 7.1, q.z); }
    }
  }
  scene.add(new THREE.Mesh(unir(geos), mat));
  scene.add(new THREE.Mesh(unir(techos), new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.85 })));
  const gl = new THREE.BufferGeometry(); gl.setAttribute('position', new THREE.Float32BufferAttribute(luzP, 3));
  const luces = new THREE.Points(gl, new THREE.PointsMaterial({ map: brilloTex('rgba(255,40,30,1)'), size: 7, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  scene.add(luces);
  return { update(t) { luces.material.opacity = Math.sin(t * 2.2) > 0.2 ? 1 : 0.12; } };
}

function crearCerro(scene) {
  const g = new THREE.ConeGeometry(160, 70, 48, 6);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) if (p.getY(i) < 34) p.setX(i, p.getX(i) * (1 + Math.random() * 0.05));
  const cerro = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x0d1410, flatShading: true }));
  cerro.scale.set(1.6, 1, 1); cerro.position.set(-420, 30, -380); scene.add(cerro);
  const faro = new THREE.Mesh(new THREE.CylinderGeometry(2, 3, 14, 8), new THREE.MeshStandardMaterial({ color: 0xeeeeee, emissive: 0x333333 }));
  faro.position.set(-420, 72, -380); scene.add(faro);
  const luz = new THREE.Mesh(new THREE.SphereGeometry(2.2), new THREE.MeshBasicMaterial({ color: 0xfff2c0 }));
  luz.position.set(-420, 80, -380); scene.add(luz);
  const brillo = new THREE.Sprite(new THREE.SpriteMaterial({ map: brilloTex('rgba(255,240,190,1)'), blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  brillo.position.copy(luz.position); brillo.scale.set(40, 40, 1); scene.add(brillo);
  const haz = new THREE.Group(); haz.position.copy(luz.position);
  const cono = new THREE.Mesh(new THREE.ConeGeometry(14, 400, 24, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xfff2c0, transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  cono.rotation.z = Math.PI / 2; cono.position.x = 200; haz.add(cono); scene.add(haz);
  return { update: t => { haz.rotation.y = t * 0.8; brillo.material.opacity = 0.6 + 0.4 * Math.abs(Math.cos(t * 0.8)); } };
}

// Autos abandonados, el ómnibus cruzado y un auto prendido fuego (los modelos viven en autos.js)

function texTexto(lineas, w, h, fondo, color, fuente) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  g.fillStyle = fondo; g.fillRect(0, 0, w, h); g.fillStyle = color; g.font = fuente; g.textAlign = 'center'; g.textBaseline = 'middle';
  lineas.forEach((l, i) => g.fillText(l, w / 2, h * (i + 0.5) / lineas.length));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
// cartel de destino que brilla y el logo al costado: un CUTCSA como los de verdad
function cartelBus(bus, largo, alto, ancho) {
  const dest = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.42), new THREE.MeshBasicMaterial({ map: texTexto(['121  CIUDAD VIEJA'], 256, 48, '#120a00', '#ffb020', 'bold 30px monospace') }));
  dest.position.set(largo / 2 + 0.02, alto, 0); dest.rotation.y = Math.PI / 2; bus.add(dest);
  const logo = new THREE.MeshBasicMaterial({ map: texTexto(['CUTCSA'], 256, 64, '#e8e4da', '#9a1414', 'italic bold 48px sans-serif') });
  for (const s of [1, -1]) { const l = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.7), logo); l.position.set(-1.5, 1.0, s * (ancho / 2 + 0.05)); if (s < 0) l.rotation.y = Math.PI; bus.add(l); }
}

// junta todas las mallas de un grupo estático en una por material (menos draw calls)
export function unir(geos) {
  geos = geos.map(g => g.index ? g.toNonIndexed() : g);
  let n = 0; geos.forEach(g => n += g.attributes.position.count);
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2); let o = 0;
  geos.forEach(g => { pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); if (g.attributes.uv) uv.set(g.attributes.uv.array, o * 2); o += g.attributes.position.count; g.dispose(); });
  const bg = new THREE.BufferGeometry();
  if (geos.every(g => g.attributes.color)) { const col = new Float32Array(n * 3); let q = 0; geos.forEach(g => { col.set(g.attributes.color.array, q * 3); q += g.attributes.color.count; }); bg.setAttribute('color', new THREE.BufferAttribute(col, 3)); }
  bg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); bg.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); bg.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return bg;
}
export function hornear(scene, grupo) {
  grupo.updateMatrixWorld(true);
  const cubetas = new Map();
  grupo.traverse(o => {
    if (!o.isMesh) return;
    const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    g.applyMatrix4(o.matrixWorld);
    if (!cubetas.has(o.material)) cubetas.set(o.material, []);
    cubetas.get(o.material).push(g);
  });
  cubetas.forEach((geos, mat) => {
    let n = 0; geos.forEach(g => n += g.attributes.position.count);
    scene.add(new THREE.Mesh(unir(geos), mat));
  });
}

function crearChatarra(scene) {
  const col = [], colores = [0x7a2222, 0x24345a, 0x8c9096, 0x2b2b30, 0xa88a38, 0x3c6a4a];
  // [i, d, giro, color, modelo]
  const lista = [
    [N * 0.5 + 8, 2, 0.4, 0, 'sedan'], [N * 0.5 - 14, 8, -0.3, 1, 'sedan'], [N * 0.5 + 22, 6, 1.4, 2, 'taxi'], [N * 0.5 - 30, 1, 0.1, 3, 'hatch'],
    [N * 0.5 + 40, 9, -1.0, 4, 'pickup'], [N * 0.5 - 45, 4, 2.5, 5, 'patrullero'], [N * 0.5 + 55, 3, 0.2, 0, 'combi'], [N * 0.5 - 60, 7, -0.6, 2, 'hatch']
  ];
  let fuego = null;
  const grupoChatarra = new THREE.Group();
  lista.forEach(([i, d, rot, c, modelo], k) => {
    const A = crearAuto(modelo, colores[c], k + 3, { quemado: k === 1 }), a = A.g;
    const m = muestras[Math.round(i)], p = aMundo(i, d);
    a.position.set(p.x, 1.2, p.z); a.rotation.y = Math.atan2(-m.t.z, m.t.x) + rot; a.rotation.z = (k % 3 - 1) * 0.04;
    grupoChatarra.add(a);
    { // cajas reales del auto (para balas, marcas y cadáveres): carrocería + techo; los números salen de cada modelo
      const c = Math.cos(a.rotation.y), s = Math.sin(a.rotation.y), q = A.cajas, ox = q.rcx === undefined ? -0.2 : q.rcx;
      col.push({ x: p.x, z: p.z, r: q.hx + 0.05, top: 1.2 + q.ry1 - 0.1, metal: true, cajas: [
        { cx: p.x, cz: p.z, c, s, hx: q.hx, hz: q.hz, y0: 1.2, y1: 1.2 + q.y1 },
        { cx: p.x + c * ox, cz: p.z - s * ox, c, s, hx: q.rx, hz: q.hz - 0.09, y0: 1.2 + q.y1, y1: 1.2 + q.ry1 }] });
    }
    if (k === 1) fuego = p.clone();
  });
  // ómnibus atravesado en la calle
  const ib = N * 0.5 - 22, mb = muestras[Math.round(ib)], pb = aMundo(ib, 5);
  const bus = crearBus(7); cartelBus(bus, 12, 3.05, 2.6);
  bus.position.set(pb.x, 1.2, pb.z); bus.rotation.y = Math.atan2(-mb.t.z, mb.t.x) + 1.1; grupoChatarra.add(bus);
  const dir = new THREE.Vector3(Math.cos(bus.rotation.y), 0, -Math.sin(bus.rotation.y));
  const cajaBus = [{ cx: pb.x, cz: pb.z, c: Math.cos(bus.rotation.y), s: Math.sin(bus.rotation.y), hx: 6, hz: 1.3, y0: 1.2, y1: 5.0 }];
  for (let s = -5; s <= 5; s += 2.5) col.push({ x: pb.x + dir.x * s, z: pb.z + dir.z * s, r: 1.7, top: 1.2 + 3.8, metal: true, cajas: cajaBus });
  // fuego
  // fuego del auto: 6 llamas en un solo Points (antes 6 sprites = 6 draw calls); titilan por color y suben
  const tex = brilloTex('rgba(255,140,40,1)'), llamas = [], lPos = new Float32Array(18), lCol = new Float32Array(18);
  for (let i = 0; i < 6; i++) llamas.push({ x: fuego.x + (Math.random() - .5) * 2, z: fuego.z + (Math.random() - .5) * 1.5 });
  const gLl = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(lPos, 3)).setAttribute('color', new THREE.BufferAttribute(lCol, 3));
  const pLl = new THREE.Points(gLl, new THREE.PointsMaterial({ map: tex, size: 4.4, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  pLl.frustumCulled = false; scene.add(pLl);
  const luzFuego = new THREE.PointLight(0xff7a20, 50, 35, 1.6); luzFuego.position.set(fuego.x, 4, fuego.z); scene.add(luzFuego);
  hornear(scene, grupoChatarra);
  return {
    colisiones: col,
    update(t) {
      llamas.forEach((s, i) => { const k = (2 + Math.sin(t * 9 + i * 2) * 0.8 + Math.random() * 0.6) / 2.6; lPos[i * 3] = s.x; lPos[i * 3 + 1] = 2.6 + ((t * 1.5 + i * 0.3) % 1.2); lPos[i * 3 + 2] = s.z; lCol[i * 3] = lCol[i * 3 + 1] = lCol[i * 3 + 2] = k; });
      gLl.attributes.position.needsUpdate = gLl.attributes.color.needsUpdate = true;
      luzFuego.intensity = 40 + Math.sin(t * 13) * 10 + Math.random() * 15;
    }
  };
}

// ---------- Zona nueva: el Puerto del Buceo (contenedores, muelle, grúa) ----------
// Se abre pasando el portón del extremo este; todos los contenedores tienen cajas reales (balas, marcas y ragdolls)
export const PUERTO_I0 = N * 0.5 + 74, PUERTO_I1 = N * 0.5 + 128;
const _lp = {};
function crearPuerto(scene) {
  const C = N * 0.5, col = [], grupo = new THREE.Group();
  const rayas = new THREE.CanvasTexture((() => { const c = document.createElement('canvas'); c.width = 64; c.height = 8; const g = c.getContext('2d');
    for (let x = 0; x < 64; x++) { const v = 150 + 105 * Math.abs(Math.sin(x / 64 * Math.PI * 14)); g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x, 0, 1, 8); } return c; })());
  rayas.colorSpace = THREE.SRGBColorSpace;
  const COLS = [0x2a5a8a, 0x9a2a20, 0x2a6a3a, 0xc06a20, 0x707070, 0x2a7a7a], mats = COLS.map(c => new THREE.MeshStandardMaterial({ color: c, map: rayas, roughness: 0.7, metalness: 0.3 }));
  const matCont = new THREE.MeshStandardMaterial({ map: rayas, vertexColors: true, roughness: 0.7, metalness: 0.3 }), matVC = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, metalness: 0.3 });
  const _c = new THREE.Color(), pint = (geo, hex) => { const g = geo.index ? geo.toNonIndexed() : geo.clone(); _c.setHex(hex); const a = new Float32Array(g.attributes.position.count * 3); for (let i = 0; i < a.length; i += 3) { a[i] = _c.r; a[i + 1] = _c.g; a[i + 2] = _c.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; }; /* todo el puerto en 2 draws (color por vértice) */
  const geoCont = new THREE.BoxGeometry(6.1, 2.6, 2.44), ang = i => { const m = muestras[Math.round(i)]; return Math.atan2(-m.t.z, m.t.x); };
  // [i, d, giro, color, pisos]
  const lista = [[C + 84, 2.5, 0, 0, 2], [C + 84, 9.5, 0.05, 1, 1], [C + 91, 16, 0, 2, 2], [C + 97, 5, 1.57, 3, 1], [C + 104, 12, 0.2, 4, 2],
    [C + 108, 1, 0, 5, 1], [C + 115, 16, 0, 0, 1], [C + 118, 6.5, -0.3, 2, 2], [C + 124, -0.5, 1.57, 1, 1], [C + 125, 13, 0, 3, 3]];
  let puerta = null;
  lista.forEach(([i, d, giro, ci, pisos], k) => {
    const p = aMundo(i, d), y0 = piso(d), yaw = ang(i) + giro, c = Math.cos(yaw), s = Math.sin(yaw);
    for (let h = 0; h < pisos; h++) { const m = new THREE.Mesh(pint(geoCont, COLS[(ci + h * 2) % COLS.length]), matCont); m.position.set(p.x, y0 + 1.3 + h * 2.6, p.z); m.rotation.y = yaw + (h ? (k % 2 ? 0.06 : -0.05) : 0); grupo.add(m); }
    const cajas = [{ cx: p.x, cz: p.z, c, s, hx: 3.05, hz: 1.22, y0, y1: y0 + 2.6 * pisos }];
    for (const t of [-1.85, 0, 1.85]) col.push({ x: p.x + c * t, z: p.z - s * t, r: 1.28, top: y0 + 2.6 * pisos, metal: true, cajas });
    if (k === 3) puerta = { x: p.x, z: p.z, c, s, yaw, y0 };
  });
  // portón de entrada con cartel
  const matPoste = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.6, metalness: 0.5 });
  const cartel = new THREE.MeshBasicMaterial({ map: texTexto(['PUERTO DEL BUCEO'], 512, 64, '#0a2a4a', '#f2e6c0', 'bold 40px sans-serif') });
  { const a = ang(C + 76);
    for (const d of [-2.2, 18.2]) { const p = aMundo(C + 76, d), m = new THREE.Mesh(pint(new THREE.BoxGeometry(0.4, 6, 0.4), 0x3a3a3a), matVC); m.position.set(p.x, piso(d) + 3, p.z); grupo.add(m); col.push({ x: p.x, z: p.z, r: 0.35, top: piso(d) + 6, metal: true }); }
    const pm = aMundo(C + 76, 8), viga = new THREE.Mesh(pint(new THREE.BoxGeometry(0.3, 0.5, 20.6), 0x3a3a3a), matVC); viga.position.set(pm.x, 7.6, pm.z); viga.rotation.y = a; grupo.add(viga);
    for (const sg of [1, -1]) { const t = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.1), cartel); t.position.set(pm.x - Math.cos(a) * 0.17 * sg, 6.8, pm.z + Math.sin(a) * 0.17 * sg); t.rotation.y = a + (sg > 0 ? -Math.PI / 2 : Math.PI / 2); grupo.add(t); } }
  // bitas de amarre sobre el muro
  const matBita = new THREE.MeshStandardMaterial({ color: 0x202020, roughness: 0.5, metalness: 0.6 }), geoBita = new THREE.CylinderGeometry(0.22, 0.28, 0.6, 8);
  for (let i = C + 80; i < C + 128; i += 7) { const p = aMundo(i, -9.6), m = new THREE.Mesh(pint(geoBita, 0x202020), matVC); m.position.set(p.x, piso(-9.6) + 0.3, p.z); grupo.add(m); col.push({ x: p.x, z: p.z, r: 0.3, top: piso(-9.6) + 0.6, metal: true }); }
  // muelle de madera hacia el río, con la grúa y un pesquero amarrado (decorado: fuera de la zona jugable)
  const matMadera = new THREE.MeshStandardMaterial({ color: 0x5a4430, roughness: 0.9 }), matGrua = new THREE.MeshStandardMaterial({ color: 0xd09a20, roughness: 0.6, metalness: 0.3 });
  { const im = C + 102, a = ang(im), pm = aMundo(im, -30), m = new THREE.Mesh(pint(new THREE.BoxGeometry(7, 0.4, 36), 0x5a4430), matVC); m.position.set(pm.x, 1.0, pm.z); m.rotation.y = a; grupo.add(m);
    for (let t = -16; t <= 16; t += 4) for (const l of [-3.2, 3.2]) { const q = aMundo(im, -30 + t); const pil = new THREE.Mesh(pint(new THREE.CylinderGeometry(0.18, 0.18, 3, 6), 0x5a4430), matVC); pil.position.set(q.x + Math.cos(a) * l, -0.5, q.z - Math.sin(a) * l); grupo.add(pil); }
    const g = aMundo(im, -36); // grúa: dos patas, viga y pluma
    for (const l of [-2.6, 2.6]) { const pa = new THREE.Mesh(pint(new THREE.BoxGeometry(0.5, 14, 0.5), 0xd09a20), matVC); pa.position.set(g.x + Math.cos(a) * l, 8, g.z - Math.sin(a) * l); grupo.add(pa); }
    const vg = new THREE.Mesh(pint(new THREE.BoxGeometry(6.4, 0.8, 0.8), 0xd09a20), matVC); vg.position.set(g.x, 15, g.z); vg.rotation.y = a; grupo.add(vg);
    const pl = new THREE.Mesh(pint(new THREE.BoxGeometry(0.6, 0.6, 22), 0xd09a20), matVC), pp = aMundo(im, -30); pl.position.set(pp.x, 15.6, pp.z); pl.rotation.y = a; grupo.add(pl);
    const b = aMundo(im + 6, -30), casco = new THREE.Mesh(pint(new THREE.BoxGeometry(12, 2.2, 3.6), 0xb02a20), matVC);
    casco.position.set(b.x, 0, b.z); casco.rotation.y = a + Math.PI / 2; grupo.add(casco);
    const cab = new THREE.Mesh(pint(new THREE.BoxGeometry(3, 2.2, 2.6), 0xe8e4da), matVC); cab.position.set(b.x, 2.2, b.z); cab.rotation.y = a + Math.PI / 2; grupo.add(cab); }
  // luces de sodio: postes altos con halo
  const texSodio = brilloTex('rgba(255,170,60,1)'), halos = [];
  for (const [i, d] of [[C + 88, 6], [C + 106, 7], [C + 122, 8]]) {
    const p = aMundo(i, d), m = new THREE.Mesh(pint(new THREE.CylinderGeometry(0.12, 0.16, 9, 6), 0x3a3a3a), matVC); m.position.set(p.x, piso(d) + 4.5, p.z); grupo.add(m); col.push({ x: p.x, z: p.z, r: 0.25, top: 20, metal: true });
    const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: texSodio, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); h.position.set(p.x, piso(d) + 9.1, p.z); h.scale.setScalar(4); scene.add(h); halos.push(h);
  }
  /* sin PointLight: una luz más encarece el sombreado de toda la escena */
  hornear(scene, grupo);
  // la puerta del contenedor que se abre (evento): dos hojas sueltas, del lado de la calle
  const hojas = [];
  if (puerta) for (const sg of [-1, 1]) { /* bisagra en la punta del contenedor (eje local x = largo, z = ancho) */
    const piv = new THREE.Group(), hoja = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.5, 1.22), mats[3]);
    hoja.position.set(0, 0, -sg * 0.61); piv.add(hoja);
    piv.position.set(puerta.x + puerta.c * 3.08 + puerta.s * sg * 1.22, puerta.y0 + 1.3, puerta.z - puerta.s * 3.08 + puerta.c * sg * 1.22);
    piv.rotation.y = puerta.yaw; scene.add(piv); hojas.push({ piv, sg, a: 0, obj: 0 });
  }
  return {
    colisiones: col, puerta,
    abrir() { for (const h of hojas) h.obj = 1; }, cerrar() { for (const h of hojas) { h.obj = 0; h.a = 0; h.piv.rotation.y = puerta.yaw; } },
    get abierta() { return hojas.length ? hojas[0].a : 0; },
    update(t, dt, jug) {
      const cerca = !jug || local(jug.x, jug.z, _lp).i > C + 40; /* lejos no se dibujan halos ni puertas: draws */
      for (const h of halos) h.visible = cerca; for (const h of hojas) h.piv.visible = cerca;
      if (!cerca) return;
      for (const h of halos) h.material.opacity = 0.85 + Math.sin(t * 50 + h.position.x) * 0.05;
      for (const h of hojas) if (h.a < h.obj) { h.a = Math.min(h.obj, h.a + dt * 2.5); const e = 1 - (1 - h.a) ** 3; h.piv.rotation.y = puerta.yaw - h.sg * e * 1.9; }
    }
  };
}

export function crearMundo(scene, movil) {
  const NOCHE = new THREE.Color(0x0e1834), ALBA = new THREE.Color(0xf6a26b);
  scene.background = NOCHE.clone();
  scene.fog = new THREE.FogExp2(0x1a2444, 0.0042);
  const ambiente = new THREE.HemisphereLight(0x8090d0, 0x2a2420, 1.5); scene.add(ambiente);
  const luzLuna = new THREE.DirectionalLight(0xc8d4ff, 1.7); luzLuna.position.set(-300, 300, -800); scene.add(luzLuna);
  // cielo con degradé: más claro sobre el horizonte (resplandor de la ciudad)
  const cielo = new THREE.Mesh(new THREE.SphereGeometry(1900, 24, 12), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { arriba: { value: new THREE.Color(0x050a1c) }, horizonte: { value: new THREE.Color(0x2a3260) }, alba: { value: 0 } },
    vertexShader: 'varying float h; void main(){ h = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform vec3 arriba; uniform vec3 horizonte; uniform float alba; varying float h;
      void main(){ float k = pow(clamp(h, 0.0, 1.0), 0.45);
        vec3 c = mix(horizonte, arriba, k);
        vec3 d = mix(vec3(0.98,0.62,0.42), vec3(0.45,0.6,0.85), k);
        gl_FragColor = vec4(mix(c, d, alba), 1.0); }`
  }));
  cielo.renderOrder = -1; scene.add(cielo);
  const nEst = movil ? 1200 : 2500, pos = new Float32Array(nEst * 3);
  for (let i = 0; i < nEst; i++) {
    const th = Math.random() * Math.PI * 2, ph = Math.random() * Math.PI * 0.45;
    pos.set([1800 * Math.sin(ph) * Math.cos(th), 1800 * Math.cos(ph), 1800 * Math.sin(ph) * Math.sin(th)], i * 3);
  }
  const gEst = new THREE.BufferGeometry(); gEst.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const estrellas = new THREE.Points(gEst, new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false, transparent: true, fog: false }));
  scene.add(estrellas);
  const luna = new THREE.Mesh(new THREE.SphereGeometry(40, 24, 12), new THREE.MeshBasicMaterial({ color: 0xf8eed8, fog: false }));
  luna.position.set(-400, 380, -1500); scene.add(luna);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: brilloTex('rgba(200,210,255,0.6)'), blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  halo.scale.set(420, 420, 1); scene.add(halo);

  // sol del amanecer: sale sobre el río (solo se ve al final)
  const sol = new THREE.Sprite(new THREE.SpriteMaterial({ map: brilloTex('rgba(255,200,120,1)'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false, opacity: 0 }));
  sol.scale.set(520, 520, 1); scene.add(sol);
  const disco = new THREE.Mesh(new THREE.CircleGeometry(60, 32), new THREE.MeshBasicMaterial({ color: 0xffd080, fog: false, transparent: true, opacity: 0 }));
  scene.add(disco);
  const mar = crearMar(scene, movil), rambla = crearRambla(scene);
  const edif = crearEdificios(scene);
  const cerro = crearCerro(scene), chatarra = crearChatarra(scene), props = crearProps(scene), puerto = crearPuerto(scene), amb = crearAmbiente(scene), zonas = crearZonas(scene), barrio = crearBarrio(scene);
  let alba = 0, objetivo = 0;
  const FOG_N = new THREE.Color(0x1a2444);
  return {
    colisiones: chatarra.colisiones.concat(props.colisiones, puerto.colisiones, amb.colisiones, zonas.colisiones, barrio.colisiones), puerto,
    fuegos: (n, c) => props.fuegos(n, c), alSonarFuegos: null,
    setAlba(v) { objetivo = v; },
    setAtmo(a, id) { // clima de cada mapa: color de la noche, niebla, horizonte y luz ambiente (y se prende su utilería)
      zonas.mostrar(id); barrio.mostrar(id);
      NOCHE.setHex(a.noche); FOG_N.setHex(a.niebla); scene.fog.density = a.densidad; cielo.material.uniforms.horizonte.value.setHex(a.horizonte);
      ambiente.color.setHex(a.cielo); ambiente.groundColor.setHex(a.suelo);
    },
    get alba() { return alba; },
    update(t, dt, renderer, jugador) {
      mar.update(t); edif.update(t); zonas.update(t); barrio.update(t, dt); amb.update(t, dt, jugador); rambla.update(t, dt, jugador); cerro.update(t); chatarra.update(t); puerto.update(t, dt, jugador); props.update(t, dt, this.alSonarFuegos);
      alba += (objetivo - alba) * Math.min(1, dt * 0.5);
      cielo.material.uniforms.alba.value = alba;
      cielo.position.copy(jugador || cielo.position);
      if (jugador) { // el sol, del lado del río y bajito
        const ds = Math.max(0, alba - 0.45) / 0.55;
        sol.position.set(jugador.x + 200, jugador.y - 60 + ds * 200, jugador.z - 1500); disco.position.copy(sol.position); disco.lookAt(jugador);
        sol.material.opacity = ds; disco.material.opacity = ds;
      }
      scene.background.copy(NOCHE).lerp(ALBA, alba); scene.fog.color.copy(FOG_N).lerp(ALBA, alba);
      estrellas.material.opacity = 1 - alba;
      ambiente.intensity = 1.5 + alba * 1.2; luzLuna.color.setHSL(0.62 - alba * 0.55, 0.6, 0.8);
      luzLuna.intensity = 1.7 + alba * 1.2; luna.position.y = 380 - alba * 300; halo.position.copy(luna.position);
      renderer.toneMappingExposure = 1.25 + alba * 0.2;
    }
  };
}
