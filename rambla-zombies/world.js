// Mundo: el Río de la Plata, la rambla, los edificios, el Cerro y los autos abandonados
import * as THREE from 'https://esm.sh/three@0.160.0';

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

function cinta(ancho, off, alto, color) {
  const pts = curva.getSpacedPoints(300), pos = [], idx = [];
  pts.forEach((p, i) => {
    const t = curva.getTangentAt(i / 300);
    const n = new THREE.Vector3(-t.z, 0, t.x);
    const a = p.clone().addScaledVector(n, off), b = p.clone().addScaledVector(n, off + ancho);
    pos.push(a.x, alto, a.z, b.x, alto, b.z);
    if (i < 300) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide, roughness: 0.9 }));
}

function crearMar(scene, movil) {
  const sx = movil ? 70 : 120, sz = movil ? 40 : 60;
  const geo = new THREE.PlaneGeometry(1600, 900, sx, sz);
  geo.rotateX(-Math.PI / 2); geo.translate(0, 0, -470);
  const base = geo.attributes.position.array.slice();
  const mat = new THREE.MeshStandardMaterial({ color: 0x0a1a2e, roughness: 0.25, metalness: 0.9, flatShading: true });
  const mar = new THREE.Mesh(geo, mat); scene.add(mar);
  // reflejo de la luna: un solo Points (1 draw call)
  const nr = 50, pr = new Float32Array(nr * 3), fr = new Float32Array(nr);
  for (let i = 0; i < nr; i++) { const z = -60 - i * 12; pr.set([-60 + z * 0.35 + (Math.random() - .5) * 24, 0.2, z], i * 3); fr[i] = Math.random() * 6; }
  const gr = new THREE.BufferGeometry(); gr.setAttribute('position', new THREE.BufferAttribute(pr, 3));
  const reflejo = new THREE.Points(gr, new THREE.PointsMaterial({ map: brilloTex('rgba(230,235,255,1)'), size: 26, transparent: true, opacity: 0.45,
    blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(reflejo);
  let cuadro = 0;
  function update(t) {
    if (movil && (cuadro++ & 1)) return; // calidad baja/media: olas a la mitad de cuadros
    const p = geo.attributes.position.array;
    for (let i = 0; i < p.length; i += 3) {
      const x = base[i], z = base[i + 2];
      p[i + 1] = -0.9 + Math.sin(x * 0.03 + t * 1.2) * 0.5 + Math.sin(z * 0.05 + t * 0.9) * 0.4 + Math.sin((x + z) * 0.11 + t * 2.1) * 0.2;
    }
    geo.attributes.position.needsUpdate = true; geo.computeVertexNormals();
    reflejo.material.opacity = 0.35 + 0.15 * Math.sin(t * 2.3);
  }
  return { update };
}

function crearRambla(scene) {
  scene.add(cinta(14.5, -2.5, 1.2, 0x1b1b22));
  scene.add(cinta(8.3, -10.8, 1.6, 0x6b6157));
  scene.add(cinta(1.3, -12.1, 2.6, 0xb8ab98));
  scene.add(cinta(300, 12, 1.3, 0x14161a));
  scene.add(cinta(20, -32, -0.5, 0x3a3328));
  // líneas de la calle
  const lineas = cinta(0.25, 4.6, 1.22, 0xc9b25a); scene.add(lineas);
  const tex = brilloTex('rgba(255,190,110,1)');
  const n = 80;
  const postes = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.15, 0.2, 7, 6), new THREE.MeshStandardMaterial({ color: 0x222222 }), n + 1);
  const bulbos = new THREE.InstancedMesh(new THREE.SphereGeometry(0.5, 10, 8), new THREE.MeshStandardMaterial({ color: 0xffcc88, emissive: 0xffaa55, emissiveIntensity: 3 }), n + 1);
  const m4 = new THREE.Matrix4(), luces = [], pf = new Float32Array((n + 1) * 3);
  for (let i = 0; i <= n; i++) {
    const p = aMundo(i / n * N, -9);
    m4.makeTranslation(p.x, 5, p.z); postes.setMatrixAt(i, m4);
    m4.makeTranslation(p.x, 8.6, p.z); bulbos.setMatrixAt(i, m4);
    pf.set([p.x, 8.6, p.z], i * 3);
  }
  const gf = new THREE.BufferGeometry(); gf.setAttribute('position', new THREE.BufferAttribute(pf, 3));
  const halos = new THREE.Points(gf, new THREE.PointsMaterial({ map: tex, size: 9, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(halos);
  scene.add(postes, bulbos);
  // pocas luces reales, concentradas en la zona de juego
  for (let k = 0; k < 5; k++) {
    const p = aMundo(N * 0.5 + (k - 2) * 26, -9);
    const l = new THREE.PointLight(0xffb060, 70, 60, 1.6); l.position.set(p.x, 8.6, p.z); scene.add(l); luces.push(l);
  }
  return {
    update(t) {
      luces[1].intensity = Math.sin(t * 17) > -0.2 ? 70 : 10; // un farol que falla
    }
  };
}

function texVentanas() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#0c0d12'; g.fillRect(0, 0, 64, 128);
  for (let y = 4; y < 128; y += 8) for (let x = 4; x < 64; x += 8) {
    if (Math.random() < 0.3) {
      g.fillStyle = ['#ffd27a', '#ffe9b0', '#9ecbff', '#ffb35c', '#ff5040'][Math.floor(Math.random() * 5)];
      g.fillRect(x, y, 4, 5);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1.6, 2.5);
  return t;
}

function crearEdificios(scene) {
  const geo = new THREE.BoxGeometry(1, 1, 1), por = 55;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s = new THREE.Vector3();
  for (let k = 0; k < 4; k++) {
    const tx = texVentanas();
    const mat = new THREE.MeshStandardMaterial({ color: 0x15161c, emissive: 0xffffff, emissiveMap: tx, emissiveIntensity: 1.1, map: tx });
    const im = new THREE.InstancedMesh(geo, mat, por);
    for (let j = 0; j < por; j++) {
      const i = Math.random() * N, m = muestras[Math.round(i)];
      const w = 10 + Math.random() * 12, d = 10 + Math.random() * 10;
      const off = 33 + Math.random() * 150, h = 10 + Math.pow(Math.random(), 2) * (j < 25 ? 70 : 35);
      const p = aMundo(i, off);
      e.set(0, Math.atan2(m.t.x, m.t.z), 0); q.setFromEuler(e);
      m4.compose(v.set(p.x, 1.3 + h / 2, p.z), q, s.set(w, h, d)); im.setMatrixAt(j, m4);
    }
    scene.add(im);
  }
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
    new THREE.MeshBasicMaterial({ color: 0xfff2c0, transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  cono.rotation.z = Math.PI / 2; cono.position.x = 200; haz.add(cono); scene.add(haz);
  return { update: t => { haz.rotation.y = t * 0.8; brillo.material.opacity = 0.6 + 0.4 * Math.abs(Math.cos(t * 0.8)); } };
}

// Autos abandonados, el ómnibus cruzado y un auto prendido fuego
const matsAuto = new Map(), matAuto = c => { if (!matsAuto.has(c)) matsAuto.set(c, new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, metalness: 0.4 })); return matsAuto.get(c); };
const MR = new THREE.MeshStandardMaterial({ color: 0x111111 }), GR = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 10);
function vehiculo(largo, alto, ancho, color, bus) {
  const g = new THREE.Group();
  const mat = matAuto(color);
  const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(largo, alto, ancho), mat);
  cuerpo.position.y = alto / 2 + 0.4; g.add(cuerpo);
  if (bus) {
    const v = new THREE.Mesh(new THREE.BoxGeometry(largo * 0.9, alto * 0.3, ancho + 0.05),
      new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0x9a8a60, emissiveIntensity: 0.6 }));
    v.position.y = alto * 0.7 + 0.4; g.add(v);
    const franja = new THREE.Mesh(new THREE.BoxGeometry(largo + 0.02, 0.4, ancho + 0.02), new THREE.MeshStandardMaterial({ color: 0x8a1c1c }));
    franja.position.y = 1.2; g.add(franja);
  } else {
    const techo = new THREE.Mesh(new THREE.BoxGeometry(largo * 0.5, alto * 0.6, ancho * 0.9), mat);
    techo.position.set(-largo * 0.05, alto + 0.75, 0); g.add(techo);
  }
  const rueda = GR, mr = MR;
  [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([a, b]) => {
    const r = new THREE.Mesh(rueda, mr); r.rotation.x = Math.PI / 2; r.position.set(a * largo * 0.33, 0.4, b * ancho / 2); g.add(r);
  });
  return g;
}

// junta todas las mallas de un grupo estático en una por material (menos draw calls)
function hornear(scene, grupo) {
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
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3); let o = 0;
    geos.forEach(g => { pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); o += g.attributes.position.count; g.dispose(); });
    const bg = new THREE.BufferGeometry();
    bg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); bg.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    scene.add(new THREE.Mesh(bg, mat));
  });
}

function crearChatarra(scene) {
  const col = [], colores = [0x6a2020, 0x24345a, 0x888888, 0x222222, 0x8a7030, 0x3c5a3c];
  const lista = [
    [N * 0.5 + 8, 2, 0.4, 0], [N * 0.5 - 14, 8, -0.3, 1], [N * 0.5 + 22, 6, 1.4, 2], [N * 0.5 - 30, 1, 0.1, 3],
    [N * 0.5 + 40, 9, -1.0, 4], [N * 0.5 - 45, 4, 2.5, 5], [N * 0.5 + 55, 3, 0.2, 0], [N * 0.5 - 60, 7, -0.6, 2]
  ];
  let fuego = null;
  const grupoChatarra = new THREE.Group();
  lista.forEach(([i, d, rot, c], k) => {
    const a = vehiculo(4.2, 1.2, 1.9, colores[c], false);
    const m = muestras[Math.round(i)], p = aMundo(i, d);
    a.position.set(p.x, 1.2, p.z); a.rotation.y = Math.atan2(-m.t.z, m.t.x) + rot; a.rotation.z = (k % 3 - 1) * 0.04;
    grupoChatarra.add(a); col.push({ x: p.x, z: p.z, r: 2.1 });
    if (k === 1) fuego = p.clone();
  });
  // ómnibus atravesado en la calle
  const ib = N * 0.5 - 22, mb = muestras[Math.round(ib)], pb = aMundo(ib, 5);
  const bus = vehiculo(12, 3.4, 2.6, 0xd9d2c0, true);
  bus.position.set(pb.x, 1.2, pb.z); bus.rotation.y = Math.atan2(-mb.t.z, mb.t.x) + 1.1; grupoChatarra.add(bus);
  const dir = new THREE.Vector3(Math.cos(bus.rotation.y), 0, -Math.sin(bus.rotation.y));
  for (let s = -5; s <= 5; s += 2.5) col.push({ x: pb.x + dir.x * s, z: pb.z + dir.z * s, r: 1.7 });
  // fuego
  const tex = brilloTex('rgba(255,140,40,1)'), llamas = [];
  for (let i = 0; i < 6; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    s.position.set(fuego.x + (Math.random() - .5) * 2, 2.6 + Math.random(), fuego.z + (Math.random() - .5) * 1.5);
    scene.add(s); llamas.push(s);
  }
  const luzFuego = new THREE.PointLight(0xff7a20, 50, 35, 1.6); luzFuego.position.set(fuego.x, 4, fuego.z); scene.add(luzFuego);
  hornear(scene, grupoChatarra);
  return {
    colisiones: col,
    update(t) {
      llamas.forEach((s, i) => { const k = 2 + Math.sin(t * 9 + i * 2) * 0.8 + Math.random() * 0.6; s.scale.set(k * 1.2, k * 1.8, 1); s.position.y = 2.6 + ((t * 1.5 + i * 0.3) % 1.2); });
      luzFuego.intensity = 40 + Math.sin(t * 13) * 10 + Math.random() * 15;
    }
  };
}

export function crearMundo(scene, movil) {
  const NOCHE = new THREE.Color(0x050a1c), ALBA = new THREE.Color(0xf6a26b);
  scene.background = NOCHE.clone();
  scene.fog = new THREE.FogExp2(0x050a1c, 0.0045);
  const ambiente = new THREE.HemisphereLight(0x3a4a80, 0x0a0a10, 0.6); scene.add(ambiente);
  const luzLuna = new THREE.DirectionalLight(0xbfcaff, 0.8); luzLuna.position.set(-300, 300, -800); scene.add(luzLuna);
  const nEst = movil ? 1200 : 2500, pos = new Float32Array(nEst * 3);
  for (let i = 0; i < nEst; i++) {
    const th = Math.random() * Math.PI * 2, ph = Math.random() * Math.PI * 0.48;
    pos.set([1800 * Math.sin(ph) * Math.cos(th), 1800 * Math.cos(ph), 1800 * Math.sin(ph) * Math.sin(th)], i * 3);
  }
  const gEst = new THREE.BufferGeometry(); gEst.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const estrellas = new THREE.Points(gEst, new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false, transparent: true, fog: false }));
  scene.add(estrellas);
  const luna = new THREE.Mesh(new THREE.SphereGeometry(40, 24, 12), new THREE.MeshBasicMaterial({ color: 0xf4e8d0, fog: false }));
  luna.position.set(-400, 380, -1500); scene.add(luna);

  const mar = crearMar(scene, movil), rambla = crearRambla(scene);
  crearEdificios(scene);
  const cerro = crearCerro(scene), chatarra = crearChatarra(scene);
  let alba = 0, objetivo = 0;
  return {
    colisiones: chatarra.colisiones,
    setAlba(v) { objetivo = v; },
    update(t, dt, renderer) {
      mar.update(t); rambla.update(t); cerro.update(t); chatarra.update(t);
      alba += (objetivo - alba) * Math.min(1, dt * 0.5);
      scene.background.copy(NOCHE).lerp(ALBA, alba); scene.fog.color.copy(scene.background);
      estrellas.material.opacity = 1 - alba;
      ambiente.intensity = 0.6 + alba * 1.4; luzLuna.color.setHSL(0.6 - alba * 0.55, 0.6, 0.75);
      luzLuna.intensity = 0.8 + alba * 1.4; luna.position.y = 380 - alba * 300;
      renderer.toneMappingExposure = 1 + alba * 0.3;
    }
  };
}
