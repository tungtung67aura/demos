// Utilería de la rambla: bancos, palmeras, contenedores, parada del ómnibus, el Palacio Salvo,
// barricadas en los extremos, bengalas y fuegos artificiales. Casi todo instanciado o horneado.
import * as THREE from 'https://esm.sh/three@0.160.0';
import { aMundo, muestras, piso, NM, brilloTex, unir } from './world.js';

const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s1 = new THREE.Vector3(1, 1, 1);
const caja = (w, h, d, x = 0, y = 0, z = 0) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
const angulo = i => { const t = muestras[Math.round(i)].t; return Math.atan2(t.x, t.z); }; // yaw que mira a lo largo de la rambla

function instanciar(scene, geo, mat, lista) {
  const im = new THREE.InstancedMesh(geo, mat, lista.length);
  lista.forEach((o, k) => { e.set(0, o.yaw, o.inc || 0); q.setFromEuler(e); m4.compose(v.set(o.x, o.y, o.z), q, o.s ? v.clone().set(o.s, o.s, o.s) : s1); im.setMatrixAt(k, m4); });
  scene.add(im); return im;
}

export function crearProps(scene) {
  const N = NM, C = N / 2;
  const col = [];
  // ---- bancos de la rambla (madera + hierro), mirando al río
  const geoBanco = unir([caja(1.9, 0.07, 0.42, 0, 0.45, 0), caja(1.9, 0.38, 0.06, 0, 0.72, 0.2), caja(0.08, 0.45, 0.4, -0.8, 0.22, 0), caja(0.08, 0.45, 0.4, 0.8, 0.22, 0)]);
  const bancos = [];
  for (let i = 4; i < N; i += 14) {
    const p = aMundo(i, -6.8); const yaw = angulo(i) + Math.PI / 2;
    bancos.push({ x: p.x, y: piso(-6.8), z: p.z, yaw });
    if (Math.abs(i - C) < 75) col.push({ x: p.x, z: p.z, r: 0.75, top: piso(-6.8) + 0.95, madera: true, cajas: [{ cx: p.x, cz: p.z, c: Math.cos(yaw), s: Math.sin(yaw), hx: 0.95, hz: 0.24, y0: piso(-6.8), y1: piso(-6.8) + 0.91 }] });
  }
  instanciar(scene, geoBanco, new THREE.MeshStandardMaterial({ color: 0x5a3a20, roughness: 0.9 }), bancos);

  // ---- palmeras (tronco curvo + hojas caídas), del lado de la ciudad y algunas en la vereda
  const tronco = [];
  for (let k = 0; k < 6; k++) tronco.push(new THREE.CylinderGeometry(0.2 - k * 0.015, 0.24 - k * 0.015, 1.25, 7).translate(Math.pow(k / 6, 2) * 0.8, 0.62 + k * 1.2, 0));
  const geoTronco = unir(tronco);
  const hojas = [];
  for (let k = 0; k < 9; k++) {
    const h = new THREE.PlaneGeometry(0.7, 3.2, 1, 4); const p = h.attributes.position;
    for (let j = 0; j < p.count; j++) { const y = p.getY(j) + 1.6; p.setY(j, y); p.setZ(j, -Math.pow(y / 3.2, 2) * 1.6); p.setX(j, p.getX(j) * (1 - y / 3.6)); }
    h.rotateX(-Math.PI / 2 + 0.5).rotateY(k / 9 * Math.PI * 2).translate(1.36, 7.4, 0); hojas.push(h);
  }
  const geoHojas = unir(hojas);
  const palmas = [];
  for (let i = 2; i < N; i += 9) {
    const lado = (i / 9 | 0) % 3 === 0 ? -4.2 : 14.2;
    const p = aMundo(i, lado); palmas.push({ x: p.x, y: piso(lado), z: p.z, yaw: Math.random() * 6.28, s: 0.85 + Math.random() * 0.35 });
    if (Math.abs(i - C) < 75 && lado < 0) col.push({ x: p.x, z: p.z, r: 0.35, top: 20, madera: true });
  }
  instanciar(scene, geoTronco, new THREE.MeshStandardMaterial({ color: 0x5a4632, roughness: 1 }), palmas);
  instanciar(scene, geoHojas, new THREE.MeshStandardMaterial({ color: 0x2f5a2a, roughness: 0.9, side: THREE.DoubleSide }), palmas);

  // ---- contenedores de la Intendencia (desbordados, como debe ser)
  const geoCont = unir([caja(1.9, 1.2, 1.1, 0, 0.75, 0), caja(2.0, 0.12, 1.2, 0, 1.4, 0).rotateZ(0.12), caja(0.15, 0.3, 0.15, -0.8, 0.15, -0.4), caja(0.15, 0.3, 0.15, 0.8, 0.15, 0.4)]);
  const geoBolsa = new THREE.IcosahedronGeometry(0.4, 0).scale(1, 0.8, 1);
  const conts = [], bolsas = [];
  for (const [i, d] of [[C - 8, 10.6], [C + 15, 10.6], [C + 33, 10.6], [C - 37, 10.6], [C - 55, 10.6], [C + 62, 10.6], [C + 3, -9.2], [C - 25, -9.2]]) {
    const p = aMundo(i, d), yaw = angulo(i) + Math.PI / 2 + (Math.random() - .5) * 0.3; conts.push({ x: p.x, y: piso(d), z: p.z, yaw });
    col.push({ x: p.x, z: p.z, r: 1.05, top: piso(d) + 1.5, metal: true, cajas: [{ cx: p.x, cz: p.z, c: Math.cos(yaw), s: Math.sin(yaw), hx: 1.0, hz: 0.6, y0: piso(d), y1: piso(d) + 1.47 }] });
    for (let b = 0; b < 4; b++) { const pb = aMundo(i + (Math.random() - .5) * 3, d + (Math.random() - .5) * 2.4); bolsas.push({ x: pb.x, y: piso(d) + 0.25, z: pb.z, yaw: Math.random() * 6, s: 0.6 + Math.random() * 0.6 }); }
  }
  instanciar(scene, geoCont, new THREE.MeshStandardMaterial({ color: 0x3d5a3a, roughness: 0.6, metalness: 0.3 }), conts);
  instanciar(scene, geoBolsa, new THREE.MeshStandardMaterial({ color: 0x0c0c0e, roughness: 0.3, metalness: 0.2, flatShading: true }), bolsas);

  // ---- parada de ómnibus con techo, banco y cartel
  {
    const ip = C + 9, dp = 13.4, p = aMundo(ip, dp), yaw = angulo(ip) + Math.PI / 2, y0 = piso(dp);
    const g = new THREE.Group(); g.position.set(p.x, y0, p.z); g.rotation.y = yaw;
    const fierro = new THREE.MeshStandardMaterial({ color: 0x333840, metalness: 0.6, roughness: 0.4 });
    const vidrio = new THREE.MeshStandardMaterial({ color: 0x9ab0c0, transparent: true, opacity: 0.25, roughness: 0.1, metalness: 0.5, depthWrite: false });
    g.add(new THREE.Mesh(caja(3.6, 0.1, 1.6, 0, 2.6, 0), fierro));
    for (const x of [-1.7, 1.7]) g.add(new THREE.Mesh(caja(0.08, 2.6, 0.08, x, 1.3, 0.7), fierro));
    g.add(new THREE.Mesh(caja(3.4, 2.0, 0.04, 0, 1.4, 0.75), vidrio));
    g.add(new THREE.Mesh(caja(2.6, 0.08, 0.4, 0, 0.5, 0.45), new THREE.MeshStandardMaterial({ color: 0x5a3a20 })));
    const cv = document.createElement('canvas'); cv.width = 128; cv.height = 128; const x = cv.getContext('2d');
    x.fillStyle = '#f2f2f2'; x.fillRect(0, 0, 128, 128); x.fillStyle = '#1a3a8a'; x.fillRect(0, 0, 128, 36);
    x.fillStyle = '#fff'; x.font = 'bold 22px sans-serif'; x.textAlign = 'center'; x.fillText('PARADA', 64, 26);
    x.fillStyle = '#111'; x.font = 'bold 26px sans-serif'; ['121', '183', '405'].forEach((l, k) => x.fillText(l, 64, 66 + k * 26));
    const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace;
    const cartel = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), new THREE.MeshBasicMaterial({ map: tx, side: THREE.DoubleSide }));
    cartel.position.set(2.2, 2.4, 0); cartel.rotation.y = Math.PI / 2; g.add(cartel);
    g.add(new THREE.Mesh(caja(0.06, 2.8, 0.06, 2.2, 1.4, 0), fierro));
    scene.add(g);
    col.push({ x: p.x, z: p.z, r: 1.0, top: y0 + 2.7 });
  }

  // ---- Palacio Salvo a lo lejos: base, cuerpo, coronas escalonadas y la aguja con luz roja
  let luzSalvo;
  {
    const p = aMundo(C + 128, 46), y0 = 1.3, g = new THREE.Group(); g.position.set(p.x, y0, p.z); g.rotation.y = angulo(C + 128);
    const cv = document.createElement('canvas'); cv.width = 64; cv.height = 256; const x = cv.getContext('2d');
    x.fillStyle = '#7a6a52'; x.fillRect(0, 0, 64, 256); x.fillStyle = '#16140f'; for (let yy = 4; yy < 256; yy += 8) for (let xx = 3; xx < 64; xx += 6) x.fillRect(xx, yy, 3, 4);
    for (let yy = 4; yy < 256; yy += 8) for (let xx = 3; xx < 64; xx += 6) if (Math.random() < 0.35) { x.fillStyle = Math.random() < 0.8 ? '#ffd890' : '#a8c8ff'; x.fillRect(xx, yy, 3, 4); }
    const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.magFilter = THREE.NearestFilter;
    const mat = new THREE.MeshStandardMaterial({ color: 0x8a7a62, map: tx, emissive: 0xffffff, emissiveMap: tx, emissiveIntensity: 1.2, roughness: 0.9 });
    const piedra = new THREE.MeshStandardMaterial({ color: 0x9a8a70, roughness: 1 });
    const partes = [[new THREE.BoxGeometry(46, 36, 30), 18, mat], [new THREE.BoxGeometry(24, 40, 24), 56, mat],
      [new THREE.CylinderGeometry(10, 12, 12, 8), 82, mat], [new THREE.CylinderGeometry(7, 8.5, 10, 8), 93, mat],
      [new THREE.CylinderGeometry(4.5, 5.5, 8, 8), 102, mat], [new THREE.CylinderGeometry(2.6, 3.4, 6, 8), 109, piedra],
      [new THREE.CylinderGeometry(0.2, 1.4, 14, 6), 119, piedra]];
    for (const [geo, y, m] of partes) { const ms = new THREE.Mesh(geo, m); ms.position.y = y; g.add(ms); }
    for (const sx of [-1, 1]) { const t = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 10, 8), piedra); t.position.set(sx * 12, 81, sx * 0); g.add(t); }
    scene.add(g);
    luzSalvo = new THREE.Sprite(new THREE.SpriteMaterial({ map: brilloTex('rgba(255,40,30,1)'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false }));
    luzSalvo.position.set(p.x, y0 + 127, p.z); luzSalvo.scale.setScalar(9); scene.add(luzSalvo);
  }

  // ---- barricadas en los extremos de la zona de juego (vallas a rayas + autos amontonados)
  const valla = new THREE.CanvasTexture((() => { const c = document.createElement('canvas'); c.width = 128; c.height = 16; const x = c.getContext('2d'); for (let k = 0; k < 8; k++) { x.fillStyle = k % 2 ? '#d8d8d8' : '#c81818'; x.beginPath(); x.moveTo(k * 16, 16); x.lineTo(k * 16 + 16, 0); x.lineTo(k * 16 + 32, 0); x.lineTo(k * 16 + 16, 16); x.fill(); } return c; })());
  valla.colorSpace = THREE.SRGBColorSpace;
  const matValla = new THREE.MeshStandardMaterial({ map: valla, roughness: 0.6, emissive: 0x220000 });
  const vallas = [];
  for (const sg of [-1, 1]) {
    const i = sg < 0 ? C - 73 : C + 131; /* U4: el lado este termina después del Puerto del Buceo */
    for (let d = -10; d <= 20; d += 2.6) { const p = aMundo(i + (Math.random() - .5), d); vallas.push({ x: p.x, y: piso(d) + 0.55, z: p.z, yaw: angulo(i) + Math.PI / 2 + (Math.random() - .5) * 0.3 }); }
  }
  instanciar(scene, unir([caja(2.4, 0.35, 0.1, 0, 0.3, 0), caja(0.08, 1.1, 0.5, -1, 0, 0), caja(0.08, 1.1, 0.5, 1, 0, 0)]), matValla, vallas);

  // ---- bengalas rojas tiradas en la calle (sin luz real: emisivo + halo + charco aditivo)
  const bengalas = [];
  const texRoja = brilloTex('rgba(255,50,30,1)');
  for (const [i, d] of [[C + 6, 3], [C - 18, 8], [C + 28, 1.5], [C - 44, 6]]) {
    const p = aMundo(i, d), y = piso(d);
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.3, 6).rotateZ(Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xff4020 })); b.position.set(p.x, y + 0.05, p.z); scene.add(b);
    const h = new THREE.Sprite(new THREE.SpriteMaterial({ map: texRoja, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); h.position.set(p.x, y + 0.3, p.z); h.scale.setScalar(1.6); scene.add(h);
    const c = new THREE.Mesh(new THREE.PlaneGeometry(7, 7).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: texRoja, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    c.position.set(p.x, y + 0.03, p.z); scene.add(c); bengalas.push({ h, c, f: Math.random() * 10 });
  }

  // ---- fuegos artificiales sobre la ciudad (pool de 3 estallidos en un solo Points)
  const NF = 3 * 90, fPos = new Float32Array(NF * 3).fill(-999), fCol = new Float32Array(NF * 3), fVel = new Float32Array(NF * 3), fVida = new Float32Array(NF), fC0 = new Float32Array(NF * 3);
  const gf = new THREE.BufferGeometry();
  gf.setAttribute('position', new THREE.BufferAttribute(fPos, 3).setUsage(THREE.DynamicDrawUsage)); gf.setAttribute('color', new THREE.BufferAttribute(fCol, 3).setUsage(THREE.DynamicDrawUsage));
  const fuegos = new THREE.Points(gf, new THREE.PointsMaterial({ size: 3.2, map: brilloTex('rgba(255,255,255,1)'), vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  fuegos.frustumCulled = false; scene.add(fuegos);
  let fIdx = 0, proximo = 6, activos = false;
  const PALETA = [[1, 0.3, 0.2], [0.3, 0.6, 1], [1, 0.85, 0.3], [0.5, 1, 0.4], [1, 0.4, 0.9], [1, 1, 1]];
  function estallido(centro) {
    const base = fIdx * 90; fIdx = (fIdx + 1) % 3;
    const c = PALETA[Math.floor(Math.random() * PALETA.length)], c2 = PALETA[Math.floor(Math.random() * PALETA.length)];
    for (let k = 0; k < 90; k++) {
      const i = base + k, th = Math.random() * 6.28, ph = Math.acos(2 * Math.random() - 1), sp = 14 + Math.random() * 4;
      fPos.set([centro.x, centro.y, centro.z], i * 3);
      fVel.set([Math.sin(ph) * Math.cos(th) * sp, Math.cos(ph) * sp, Math.sin(ph) * Math.sin(th) * sp], i * 3);
      const cc = k % 3 ? c : c2; fC0.set(cc, i * 3); fVida[i] = 1.6 + Math.random() * 0.6;
    }
    activos = true;
  }
  const _c = new THREE.Vector3();
  return {
    colisiones: col,
    fuegos(n = 3, centro) { for (let k = 0; k < n; k++) setTimeout(() => { _c.copy(centro || aMundo(C + (Math.random() - .5) * 120, 90 + Math.random() * 60)); _c.y = 55 + Math.random() * 35; estallido(_c); }, k * 450); return n; },
    update(t, dt, sonar) {
      luzSalvo.material.opacity = Math.sin(t * 2.5) > 0 ? 1 : 0.15;
      for (const b of bengalas) { const k = 0.75 + Math.sin(t * 23 + b.f) * 0.15 + Math.random() * 0.15; b.h.scale.setScalar(1.3 + k); b.c.material.opacity = 0.3 * k; }
      if ((proximo -= dt) <= 0) { proximo = 9 + Math.random() * 14; this.fuegos(1 + (Math.random() * 2 | 0)); if (sonar) sonar(); }
      if (!activos) return;
      let vivas = 0;
      for (let i = 0; i < NF; i++) {
        if (fVida[i] <= 0) continue;
        fVida[i] -= dt; const k = i * 3;
        if (fVida[i] <= 0) { fPos[k + 1] = -999; continue; }
        vivas++;
        fVel[k] *= 0.97; fVel[k + 1] = fVel[k + 1] * 0.97 - 6 * dt; fVel[k + 2] *= 0.97;
        fPos[k] += fVel[k] * dt; fPos[k + 1] += fVel[k + 1] * dt; fPos[k + 2] += fVel[k + 2] * dt;
        const f = Math.min(1, fVida[i]) * (0.7 + Math.random() * 0.3);
        fCol[k] = fC0[k] * f; fCol[k + 1] = fC0[k + 1] * f; fCol[k + 2] = fC0[k + 2] * f;
      }
      activos = vivas > 0;
      gf.attributes.position.needsUpdate = true; gf.attributes.color.needsUpdate = true;
    }
  };
}
