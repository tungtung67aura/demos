// Efectos: chispas, polvo, explosiones, proyectiles y pedazos de zombi. Todo con pools, sin crear nada por cuadro.
import * as THREE from 'https://esm.sh/three@0.160.0';
import { brilloTex } from './world.js';

function puntoTex() {
  const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d');
  const g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,0.8)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 32, 32); return new THREE.CanvasTexture(c);
}

// sistema de partículas genérico en un solo Points (color por partícula)
class Particulas {
  constructor(scene, n, { tam, aditivo, gravedad, roce }) {
    this.n = n; this.i = 0; this.g = gravedad; this.roce = roce;
    this.pos = new Float32Array(n * 3).fill(-999); this.col = new Float32Array(n * 3);
    this.vel = new Float32Array(n * 3); this.vida = new Float32Array(n); this.vida0 = new Float32Array(n); this.c0 = new Float32Array(n * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage));
    this.p = new THREE.Points(geo, new THREE.PointsMaterial({ size: tam, map: puntoTex(), vertexColors: true, transparent: true, depthWrite: false,
      blending: aditivo ? THREE.AdditiveBlending : THREE.NormalBlending }));
    this.p.frustumCulled = false; scene.add(this.p); this.vivas = 0;
  }
  emitir(x, y, z, vx, vy, vz, vida, r, g, b) {
    const i = this.i = (this.i + 1) % this.n, k = i * 3;
    this.pos[k] = x; this.pos[k + 1] = y; this.pos[k + 2] = z; this.vel[k] = vx; this.vel[k + 1] = vy; this.vel[k + 2] = vz;
    this.vida[i] = this.vida0[i] = vida; this.c0[k] = r; this.c0[k + 1] = g; this.c0[k + 2] = b; this.vivas = 1;
  }
  sim(dt) {
    if (!this.vivas) return;
    let vivas = 0; const fr = Math.exp(-this.roce * dt);
    for (let i = 0; i < this.n; i++) {
      if (this.vida[i] <= 0) continue;
      this.vida[i] -= dt; const k = i * 3;
      if (this.vida[i] <= 0) { this.pos[k + 1] = -999; continue; }
      vivas++;
      this.vel[k + 1] -= this.g * dt; this.vel[k] *= fr; this.vel[k + 1] *= fr; this.vel[k + 2] *= fr;
      this.pos[k] += this.vel[k] * dt; this.pos[k + 1] += this.vel[k + 1] * dt; this.pos[k + 2] += this.vel[k + 2] * dt;
      if (this.pos[k + 1] < 0.5 && this.g > 0) { this.pos[k + 1] = 0.5; this.vel[k + 1] *= -0.3; }
      const f = this.vida[i] / this.vida0[i];
      this.col[k] = this.c0[k] * f; this.col[k + 1] = this.c0[k + 1] * f; this.col[k + 2] = this.c0[k + 2] * f;
    }
    this.vivas = vivas;
    this.p.geometry.attributes.position.needsUpdate = true; this.p.geometry.attributes.color.needsUpdate = true;
  }
  limpiar() { this.vida.fill(0); this.pos.fill(-999); this.vivas = 1; }
}

export function crearEfectos(scene) {
  const chispas = new Particulas(scene, 220, { tam: 0.09, aditivo: true, gravedad: 9, roce: 1.5 });
  const humo = new Particulas(scene, 160, { tam: 1.6, aditivo: false, gravedad: -0.6, roce: 1.2 });
  const fuego = new Particulas(scene, 180, { tam: 1.4, aditivo: true, gravedad: -2, roce: 2.5 });
  const babas = new Particulas(scene, 120, { tam: 0.16, aditivo: true, gravedad: 9, roce: 0.5 });

  // luz de explosión compartida (una sola, se reubica)
  const luz = new THREE.PointLight(0xff8a30, 0, 26, 1.5); scene.add(luz); let luzT = 0;
  // anillo de onda expansiva
  const anillos = [];
  for (let i = 0; i < 3; i++) {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.8, 1, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xffc070, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    m.visible = false; scene.add(m); anillos.push({ m, t: 0, r: 1 });
  }
  let aIdx = 0;

  // proyectiles: escupitajos (bola verde que brilla) y piedras del Cerro
  const proy = [];
  const matBaba = new THREE.SpriteMaterial({ map: brilloTex('rgba(150,255,70,1)'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
  const geoPiedra = new THREE.DodecahedronGeometry(0.6, 0), matPiedra = new THREE.MeshStandardMaterial({ color: 0x4a4840, roughness: 1, flatShading: true });
  const matSombra = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 });
  const geoSombra = new THREE.CircleGeometry(1, 20).rotateX(-Math.PI / 2);
  const matAviso = new THREE.MeshBasicMaterial({ color: 0xff3010, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -5 });
  const geoAviso = new THREE.RingGeometry(0.85, 1, 28).rotateX(-Math.PI / 2);
  for (let i = 0; i < 14; i++) {
    const piedra = i >= 10;
    const obj = piedra ? new THREE.Mesh(geoPiedra, matPiedra) : new THREE.Sprite(matBaba);
    if (!piedra) obj.scale.setScalar(0.7);
    obj.visible = false; scene.add(obj);
    const sombra = new THREE.Mesh(geoSombra, matSombra); sombra.visible = false; scene.add(sombra);
    const aviso = new THREE.Mesh(geoAviso, matAviso); aviso.visible = false; scene.add(aviso);
    proy.push({ obj, sombra, aviso, piedra, vivo: false, p: new THREE.Vector3(), v: new THREE.Vector3(), radio: 0, dano: 0, yPiso: 0 });
  }

  // pedazos: brazos y cabezas que salen volando (instanciados, 2 draw calls)
  const matGib = new THREE.MeshStandardMaterial({ roughness: 0.8 });
  const gBrazo = new THREE.CapsuleGeometry(0.06, 0.5, 2, 6), gCabeza = new THREE.SphereGeometry(0.16, 8, 6);
  const imBrazo = new THREE.InstancedMesh(gBrazo, matGib, 10), imCabeza = new THREE.InstancedMesh(gCabeza, matGib, 6);
  [imBrazo, imCabeza].forEach(im => { im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.setColorAt(0, new THREE.Color()); im.count = 0; im.frustumCulled = false; scene.add(im); });
  const gibs = [];
  for (let i = 0; i < 16; i++) gibs.push({ cab: i >= 10, t: 0, p: new THREE.Vector3(), v: new THREE.Vector3(), r: new THREE.Euler(), w: new THREE.Vector3(), s: 1, c: new THREE.Color() });
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), vs = new THREE.Vector3();

  const ef = {
    // impacto contra metal/piedra: chispas + polvito
    impacto(p, nx, nz, metal) {
      const n = metal ? 10 : 5;
      for (let k = 0; k < n; k++) chispas.emitir(p.x, p.y, p.z, nx * 3 + (Math.random() - .5) * 5, Math.random() * 4, nz * 3 + (Math.random() - .5) * 5, 0.25 + Math.random() * 0.3, 1.6, 1.1, 0.5);
      for (let k = 0; k < 2; k++) humo.emitir(p.x, p.y, p.z, nx * 0.6 + (Math.random() - .5), 0.4, nz * 0.6 + (Math.random() - .5), 0.6, 0.35, 0.33, 0.3);
    },
    explosion(p, radio = 4, verde = false) {
      const r = verde ? 0.6 : 1.8, g = verde ? 1.6 : 0.8, b = verde ? 0.3 : 0.25;
      for (let k = 0; k < 36; k++) {
        const a = Math.random() * 6.28, e = Math.random() * 1.4, s = 3 + Math.random() * 6;
        fuego.emitir(p.x, p.y + 0.6, p.z, Math.cos(a) * Math.cos(e) * s, Math.sin(e) * s * 0.8 + 1, Math.sin(a) * Math.cos(e) * s, 0.35 + Math.random() * 0.4, r, g, b);
      }
      for (let k = 0; k < 18; k++) humo.emitir(p.x + (Math.random() - .5) * 2, p.y + 0.8 + Math.random(), p.z + (Math.random() - .5) * 2, (Math.random() - .5) * 3, 1 + Math.random() * 2, (Math.random() - .5) * 3, 1.4 + Math.random(), 0.22, 0.2, 0.2);
      for (let k = 0; k < 24; k++) chispas.emitir(p.x, p.y + 0.6, p.z, (Math.random() - .5) * 16, Math.random() * 10, (Math.random() - .5) * 16, 0.5 + Math.random() * 0.5, 1.8, 1.0, 0.4);
      luz.position.set(p.x, p.y + 2, p.z); luz.color.setHex(verde ? 0x80ff40 : 0xff8a30); luzT = 0.35;
      const an = anillos[aIdx = (aIdx + 1) % anillos.length]; an.m.position.set(p.x, p.y + 0.15, p.z); an.t = 0.45; an.r = radio; an.m.visible = true;
    },
    golpeSuelo(p, radio) { // pisotón del jefe: anillo + polvo
      for (let k = 0; k < 30; k++) { const a = k / 30 * 6.28; humo.emitir(p.x + Math.cos(a) * 1.5, p.y + 0.3, p.z + Math.sin(a) * 1.5, Math.cos(a) * 7, 0.6, Math.sin(a) * 7, 0.9, 0.4, 0.37, 0.32); }
      const an = anillos[aIdx = (aIdx + 1) % anillos.length]; an.m.position.set(p.x, p.y + 0.15, p.z); an.t = 0.45; an.r = radio; an.m.visible = true;
    },
    baba(p, n = 10) { for (let k = 0; k < n; k++) babas.emitir(p.x, p.y, p.z, (Math.random() - .5) * 4, Math.random() * 3, (Math.random() - .5) * 4, 0.5 + Math.random() * 0.4, 0.5, 1.4, 0.25); },
    // dispara un proyectil en arco hacia 'destino'; tiempo de vuelo fijo para que se pueda esquivar
    lanzar(tipo, desde, destino, vuelo, dano, radio, yPiso) {
      const piedra = tipo === 'piedra';
      const pr = proy.find(x => !x.vivo && x.piedra === piedra); if (!pr) return null;
      pr.vivo = true; pr.p.copy(desde); pr.dano = dano; pr.radio = radio; pr.yPiso = yPiso; pr.t = vuelo;
      pr.v.set((destino.x - desde.x) / vuelo, 0, (destino.z - desde.z) / vuelo);
      pr.v.y = (destino.y - desde.y + 0.5 * 14 * vuelo * vuelo) / vuelo;
      pr.obj.visible = true; pr.obj.position.copy(desde);
      pr.sombra.visible = true; pr.sombra.scale.setScalar(piedra ? 1.4 : 0.5);
      pr.aviso.visible = piedra; pr.aviso.position.set(destino.x, yPiso + 0.06, destino.z); pr.aviso.scale.setScalar(radio);
      return pr;
    },
    // avanza proyectiles; llama a alCaer(pr) cuando tocan el piso
    simProy(dt, pisoEn, alCaer) {
      for (const pr of proy) {
        if (!pr.vivo) continue;
        pr.v.y -= 14 * dt; pr.p.addScaledVector(pr.v, dt);
        pr.obj.position.copy(pr.p); if (pr.piedra) { pr.obj.rotation.x += dt * 5; pr.obj.rotation.z += dt * 3; }
        const yp = pisoEn(pr.p.x, pr.p.z);
        pr.sombra.position.set(pr.p.x, yp + 0.05, pr.p.z);
        if (pr.piedra) pr.aviso.material.opacity = 0.35 + 0.3 * Math.sin(performance.now() / 60);
        if (pr.p.y <= yp + 0.1 && pr.v.y < 0) { pr.vivo = false; pr.obj.visible = pr.sombra.visible = pr.aviso.visible = false; alCaer(pr); }
      }
    },
    gib(p, v, color, cab) {
      const g = gibs.find(x => x.t <= 0 && x.cab === cab); if (!g) return;
      g.t = 4; g.p.copy(p); g.v.copy(v); g.r.set(Math.random() * 3, Math.random() * 3, 0); g.w.set((Math.random() - .5) * 18, (Math.random() - .5) * 18, (Math.random() - .5) * 18); g.c.copy(color);
    },
    limpiar() { for (const pr of proy) { pr.vivo = false; pr.obj.visible = pr.sombra.visible = pr.aviso.visible = false; } for (const g of gibs) g.t = 0; chispas.limpiar(); humo.limpiar(); fuego.limpiar(); babas.limpiar(); },
    get proyectiles() { return proy; },
    sim(dt, pisoEn) {
      chispas.sim(dt); humo.sim(dt); fuego.sim(dt); babas.sim(dt);
      if (luzT > 0) { luzT -= dt; luz.intensity = Math.max(0, luzT / 0.35) * 160; } else luz.intensity = 0;
      for (const an of anillos) if (an.t > 0) { an.t -= dt; const k = 1 - an.t / 0.45; an.m.scale.setScalar(0.5 + k * an.r); an.m.material.opacity = (1 - k) * 0.8; if (an.t <= 0) an.m.visible = false; }
      let nb = 0, nc = 0;
      for (const g of gibs) {
        if (g.t <= 0) continue;
        g.t -= dt; const yp = pisoEn(g.p.x, g.p.z) + (g.cab ? 0.15 : 0.07);
        g.v.y -= 14 * dt; g.p.addScaledVector(g.v, dt);
        if (g.p.y < yp) { g.p.y = yp; g.v.multiplyScalar(0.4); g.v.y = Math.abs(g.v.y) * 0.3; g.w.multiplyScalar(0.5); }
        g.r.x += g.w.x * dt; g.r.y += g.w.y * dt; g.r.z += g.w.z * dt;
        q.setFromEuler(g.r); const s = g.t < 1 ? g.t : 1;
        m4.compose(g.p, q, vs.set(s, s, s));
        const im = g.cab ? imCabeza : imBrazo, i = g.cab ? nc++ : nb++;
        im.setMatrixAt(i, m4); im.setColorAt(i, g.c);
      }
      imBrazo.count = nb; imCabeza.count = nc;
      if (nb) { imBrazo.instanceMatrix.needsUpdate = true; imBrazo.instanceColor.needsUpdate = true; }
      if (nc) { imCabeza.instanceMatrix.needsUpdate = true; imCabeza.instanceColor.needsUpdate = true; }
    }
  };
  return ef;
}
