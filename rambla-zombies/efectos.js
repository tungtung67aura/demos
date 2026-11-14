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
    this.vel = new Float32Array(n * 3); this.suelo = new Float32Array(n).fill(0.5); this.vida = new Float32Array(n); this.vida0 = new Float32Array(n); this.c0 = new Float32Array(n * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage));
    this.p = new THREE.Points(geo, new THREE.PointsMaterial({ size: tam, map: puntoTex(), vertexColors: true, transparent: true, depthWrite: false,
      blending: aditivo ? THREE.AdditiveBlending : THREE.NormalBlending }));
    this.p.frustumCulled = false; scene.add(this.p); this.vivas = 0;
  }
  emitir(x, y, z, vx, vy, vz, vida, r, g, b, suelo = 0.5) {
    const i = this.i = (this.i + 1) % this.n, k = i * 3; this.suelo[i] = suelo;
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
      if (this.g > 0 && this.pos[k + 1] < this.suelo[i]) { this.pos[k + 1] = this.suelo[i]; this.vel[k + 1] *= -0.3; this.vel[k] *= 0.5; this.vel[k + 2] *= 0.5; }
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
  const astillas = new Particulas(scene, 90, { tam: 0.07, aditivo: false, gravedad: 11, roce: 1.2 }); // madera, piedra, asfalto

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
  // v8: además garrafas (jefe y lanzagarrafas) y bengalas (jefe y pistola de bengalas). Pool fijo por tipo.
  const matBengala = new THREE.SpriteMaterial({ map: brilloTex('rgba(255,70,30,1)'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
  const geoGarrafa = new THREE.CylinderGeometry(0.2, 0.2, 0.42, 10), matGarrafa = new THREE.MeshStandardMaterial({ color: 0xd8641c, roughness: 0.5, metalness: 0.3 });
  const TIPOS_P = [['baba', 10], ['piedra', 4], ['garrafa', 8], ['bengala', 8]];
  for (const [tipo, n] of TIPOS_P) for (let i = 0; i < n; i++) {
    const piedra = tipo === 'piedra';
    const obj = piedra ? new THREE.Mesh(geoPiedra, matPiedra) : tipo === 'garrafa' ? new THREE.Mesh(geoGarrafa, matGarrafa) : new THREE.Sprite(tipo === 'bengala' ? matBengala : matBaba);
    if (tipo === 'baba') obj.scale.setScalar(0.7); if (tipo === 'bengala') obj.scale.setScalar(0.9);
    obj.visible = false; scene.add(obj);
    const sombra = new THREE.Mesh(geoSombra, matSombra); sombra.visible = false; scene.add(sombra);
    const aviso = new THREE.Mesh(geoAviso, matAviso); aviso.visible = false; scene.add(aviso);
    proy.push({ obj, sombra, aviso, tipo, piedra, vivo: false, p: new THREE.Vector3(), v: new THREE.Vector3(), radio: 0, dano: 0, yPiso: 0, jugador: false, g: 14, eT: 0 });
  }

  // pedazos: brazos y cabezas que salen volando, rebotan y quedan en el piso (instanciados, 2 draw calls)
  const matGib = new THREE.MeshStandardMaterial({ roughness: 0.8 });
  const gBrazo = new THREE.CapsuleGeometry(0.06, 0.5, 2, 6), gCabeza = new THREE.SphereGeometry(0.16, 8, 6);
  const NB = 16, NCAB = 10, VIDA_GIB = 16;
  const imBrazo = new THREE.InstancedMesh(gBrazo, matGib, NB), imCabeza = new THREE.InstancedMesh(gCabeza, matGib, NCAB);
  [imBrazo, imCabeza].forEach(im => { im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.setColorAt(0, new THREE.Color()); im.count = 0; im.frustumCulled = false; scene.add(im); });
  const gibs = [];
  for (let i = 0; i < NB + NCAB; i++) gibs.push({ cab: i >= NB, t: 0, p: new THREE.Vector3(), v: new THREE.Vector3(), q: new THREE.Quaternion(), qf: new THREE.Quaternion(), w: new THREE.Vector3(),
    c: new THREE.Color(), quieto: false, asienta: 0, toco: false, orden: 0, P: new Float32Array(3) });
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), vs = new THREE.Vector3(), dq = new THREE.Quaternion(), eje = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
  let ordenGib = 0;

  // vainas que salta el arma (pool fijo, sin crear nada por tiro)
  const NV = 32, imV = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.008, 0.008, 0.03, 6).rotateZ(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xc8a040, metalness: 0.7, roughness: 0.35 }), NV);
  imV.instanceMatrix.setUsage(THREE.DynamicDrawUsage); imV.frustumCulled = false; imV.count = NV; scene.add(imV);
  const vP = new Float32Array(NV * 3), vV = new Float32Array(NV * 3), vT = new Float32Array(NV), vR = new Float32Array(NV), vQ = new Uint8Array(NV); let iVa = 0, vVivas = 0;
  const cero4 = new THREE.Matrix4().makeScale(0, 0, 0); for (let i = 0; i < NV; i++) imV.setMatrixAt(i, cero4); imV.visible = false;
  const ef = {
    // impacto contra metal/piedra: chispas + polvito
    // mat: true/'metal' chispas · 'madera' astillas · false/'piedra' polvo y cascotes
    impacto(p, nx, nz, metal, ny = 0, yp = 0.5) {
      const mat = metal === true ? 'metal' : metal || 'piedra';
      if (mat === 'metal') {
        for (let k = 0; k < 10; k++) chispas.emitir(p.x, p.y, p.z, nx * 3 + (Math.random() - .5) * 5, ny * 3 + Math.random() * 4, nz * 3 + (Math.random() - .5) * 5, 0.25 + Math.random() * 0.3, 1.6, 1.1, 0.5, yp + 0.02);
      } else if (mat === 'madera') {
        for (let k = 0; k < 8; k++) astillas.emitir(p.x, p.y, p.z, nx * 2.5 + (Math.random() - .5) * 3, ny * 2 + 1 + Math.random() * 3, nz * 2.5 + (Math.random() - .5) * 3, 0.5 + Math.random() * 0.4, 0.42, 0.27, 0.13, yp + 0.03);
        for (let k = 0; k < 2; k++) chispas.emitir(p.x, p.y, p.z, nx * 2 + (Math.random() - .5) * 3, Math.random() * 2, nz * 2 + (Math.random() - .5) * 3, 0.12, 0.9, 0.6, 0.3, yp + 0.02);
      } else {
        for (let k = 0; k < 6; k++) astillas.emitir(p.x, p.y, p.z, nx * 2 + (Math.random() - .5) * 3, ny * 2 + 0.8 + Math.random() * 2.5, nz * 2 + (Math.random() - .5) * 3, 0.45 + Math.random() * 0.3, 0.3, 0.29, 0.27, yp + 0.03);
        for (let k = 0; k < 3; k++) chispas.emitir(p.x, p.y, p.z, nx * 3 + (Math.random() - .5) * 5, Math.random() * 4, nz * 3 + (Math.random() - .5) * 5, 0.15 + Math.random() * 0.2, 1.4, 1.0, 0.5, yp + 0.02);
      }
      for (let k = 0; k < 2; k++) humo.emitir(p.x, p.y, p.z, nx * 0.6 + (Math.random() - .5), 0.4, nz * 0.6 + (Math.random() - .5), 0.6, 0.35, 0.33, 0.3);
    },
    llama(x, y, z) { fuego.emitir(x, y, z, (Math.random() - .5) * 0.5, 1.4 + Math.random(), (Math.random() - .5) * 0.5, 0.3 + Math.random() * 0.2, 1.5, 0.55, 0.12); },
    humoColor(x, y, z, n, r, g, b, abre = 3) { for (let k = 0; k < n; k++) humo.emitir(x + (Math.random() - .5) * 2, y + Math.random() * 1.5, z + (Math.random() - .5) * 2, (Math.random() - .5) * abre, 0.5 + Math.random(), (Math.random() - .5) * abre, 2 + Math.random() * 1.5, r, g, b); },
    confeti(x, y, z, dx, dz, n = 30) { const C = [[1.6, 0.3, 0.3], [0.3, 0.6, 1.6], [1.6, 1.4, 0.2], [0.3, 1.5, 0.4], [1.5, 0.4, 1.5]]; for (let k = 0; k < n; k++) { const c = C[k % 5], s = 4 + Math.random() * 6; chispas.emitir(x, y, z, dx * s + (Math.random() - .5) * 4, 1 + Math.random() * 3, dz * s + (Math.random() - .5) * 4, 0.6 + Math.random() * 0.5, c[0], c[1], c[2]); } },
    chispaAzul(x, y, z, n = 5) { for (let k = 0; k < n; k++) chispas.emitir(x, y, z, (Math.random() - .5) * 6, Math.random() * 4, (Math.random() - .5) * 6, 0.2 + Math.random() * 0.2, 0.5, 0.9, 2.0); },
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
    lanzar(tipo, desde, destino, vuelo, dano, radio, yPiso, jugador = false, grav = 14) {
      const piedra = tipo === 'piedra';
      const pr = proy.find(x => !x.vivo && x.tipo === tipo); if (!pr) return null;
      pr.vivo = true; pr.p.copy(desde); pr.dano = dano; pr.radio = radio; pr.yPiso = yPiso; pr.t = vuelo; pr.jugador = jugador; pr.g = grav; pr.eT = 0;
      pr.v.set((destino.x - desde.x) / vuelo, 0, (destino.z - desde.z) / vuelo);
      pr.v.y = (destino.y - desde.y + 0.5 * grav * vuelo * vuelo) / vuelo;
      pr.obj.visible = true; pr.obj.position.copy(desde);
      pr.sombra.visible = true; pr.sombra.scale.setScalar(piedra ? 1.4 : 0.5);
      pr.aviso.visible = !jugador && tipo !== 'baba'; pr.aviso.position.set(destino.x, yPiso + 0.06, destino.z); pr.aviso.scale.setScalar(radio);
      return pr;
    },
    // avanza proyectiles; llama a alCaer(pr) cuando tocan el piso (o cuando choque(pr) devuelve true: zombi/auto en el camino)
    simProy(dt, pisoEn, alCaer, choque) {
      for (const pr of proy) {
        if (!pr.vivo) continue;
        pr.v.y -= pr.g * dt; pr.p.addScaledVector(pr.v, dt);
        pr.obj.position.copy(pr.p);
        if (pr.piedra || pr.tipo === 'garrafa') { pr.obj.rotation.x += dt * 5; pr.obj.rotation.z += dt * 3; }
        if (pr.tipo === 'bengala' && (pr.eT -= dt) <= 0) { pr.eT = 0.03; fuego.emitir(pr.p.x, pr.p.y, pr.p.z, (Math.random() - .5) * 0.6, 0.4, (Math.random() - .5) * 0.6, 0.25, 1.8, 0.45, 0.15); }
        const yp = pisoEn(pr.p.x, pr.p.z);
        pr.sombra.position.set(pr.p.x, yp + 0.05, pr.p.z);
        if (pr.aviso.visible) pr.aviso.material.opacity = 0.35 + 0.3 * Math.sin(performance.now() / 60);
        if ((pr.p.y <= yp + 0.1 && pr.v.y < 0) || (choque && choque(pr))) { pr.vivo = false; pr.obj.visible = pr.sombra.visible = pr.aviso.visible = false; alCaer(pr); }
      }
    },
    gib(p, v, color, cab) {
      let g = null, viejo = null;
      for (const x of gibs) { if (x.cab !== cab) continue; if (x.t <= 0) { g = x; break; } if (!viejo || x.orden < viejo.orden) viejo = x; }
      g = g || viejo; if (!g) return;
      g.t = VIDA_GIB; g.p.copy(p); g.v.copy(v); g.orden = ++ordenGib; g.quieto = false; g.asienta = 0; g.toco = false;
      g.q.setFromAxisAngle(eje.set(Math.random() - .5, Math.random() - .5, Math.random() - .5).normalize(), Math.random() * 6);
      g.w.set((Math.random() - .5) * 18, (Math.random() - .5) * 18, (Math.random() - .5) * 18); g.c.copy(color);
    },
    // explosión: empuja los pedazos que haya cerca (caída cuadrática con la distancia)
    empujar(cx, cy, cz, R, F) {
      for (const g of gibs) {
        if (g.t <= 0) continue;
        const ex = g.p.x - cx, ey = g.p.y - cy, ez = g.p.z - cz, d = Math.hypot(ex, ey, ez); if (d > R) continue;
        const k = F * (1 - (d / R) ** 2) / (d || 1); g.v.x += ex * k; g.v.z += ez * k; g.v.y += Math.abs(ey) * k + F * 0.4 * (1 - d / R); g.quieto = false;
      }
    },
    alTocarGib: null, // (x, y, z, cab) cuando un pedazo toca el piso por primera vez
    limpiar() { for (const pr of proy) { pr.vivo = false; pr.obj.visible = pr.sombra.visible = pr.aviso.visible = false; } for (const g of gibs) g.t = 0; chispas.limpiar(); humo.limpiar(); fuego.limpiar(); babas.limpiar(); astillas.limpiar(); },
    get gibsActivos() { let n = 0; for (const g of gibs) if (g.t > 0) n++; return n; },
    gibsInfo() { return gibs.filter(g => g.t > 0).map(g => ({ cab: g.cab, x: g.p.x, y: g.p.y, z: g.p.z, quieto: g.quieto })); },
    get proyectiles() { return proy; },
    // colisionar(P, r, yPrev): saca el punto de autos/contenedores (lo pasa el juego)
    vaina(x, y, z, vx, vy, vz, grande) {
      const i = iVa; iVa = (iVa + 1) % NV; vP[i * 3] = x; vP[i * 3 + 1] = y; vP[i * 3 + 2] = z; vV[i * 3] = vx; vV[i * 3 + 1] = vy; vV[i * 3 + 2] = vz; vT[i] = 2.5; vR[i] = Math.random() * 6; vQ[i] = grande ? 2 : 1; vVivas = 1; imV.visible = true;
    },
    get vainas() { let n = 0; for (let i = 0; i < NV; i++) n += vT[i] > 0; return n; },
    sim(dt, pisoEn, colisionar) {
      if (vVivas) { vVivas = 0; // vainas: caen, rebotan en el piso y desaparecen
        for (let i = 0; i < NV; i++) {
          if (vT[i] <= 0) continue; vVivas++;
          vT[i] -= dt; const k = i * 3; vV[k + 1] -= 12 * dt; vP[k] += vV[k] * dt; vP[k + 1] += vV[k + 1] * dt; vP[k + 2] += vV[k + 2] * dt; vR[i] += dt * 18 * Math.min(1, Math.abs(vV[k]) + Math.abs(vV[k + 2]));
          const yp = pisoEn(vP[k], vP[k + 2]) + 0.01; if (vP[k + 1] < yp) { vP[k + 1] = yp; vV[k + 1] = Math.abs(vV[k + 1]) * 0.3; vV[k] *= 0.5; vV[k + 2] *= 0.5; }
          const s = vT[i] > 0 ? vQ[i] * (vT[i] < 0.3 ? vT[i] / 0.3 : 1) : 0;
          m4.compose(vs.set(vP[k], vP[k + 1], vP[k + 2]), q.setFromAxisAngle(Y, vR[i]), eje.set(s * (vQ[i] > 1 ? 1.6 : 1), s, s)); imV.setMatrixAt(i, m4);
        }
        imV.instanceMatrix.needsUpdate = true; imV.visible = vVivas > 0;
      }
      chispas.sim(dt); humo.sim(dt); fuego.sim(dt); babas.sim(dt); astillas.sim(dt);
      if (luzT > 0) { luzT -= dt; luz.intensity = Math.max(0, luzT / 0.35) * 160; } else luz.intensity = 0;
      for (const an of anillos) if (an.t > 0) { an.t -= dt; const k = 1 - an.t / 0.45; an.m.scale.setScalar(0.5 + k * an.r); an.m.material.opacity = (1 - k) * 0.8; if (an.t <= 0) an.m.visible = false; }
      let nb = 0, nc = 0;
      for (const g of gibs) {
        if (g.t <= 0) continue;
        g.t -= dt; const rg = g.cab ? 0.15 : 0.07;
        if (!g.quieto) {
          const ox = g.p.x, oy = g.p.y, oz = g.p.z, fO = pisoEn(ox, oz);
          g.v.y -= 14 * dt; g.p.addScaledVector(g.v, dt);
          let yp = pisoEn(g.p.x, g.p.z);
          if (yp > fO + 0.3 && g.p.y < yp + rg) { g.p.x = ox; g.p.z = oz; g.v.x *= -0.3; g.v.z *= -0.3; yp = fO; } // contra el muro: rebota de costado
          if (colisionar) { const P = g.P; P[0] = g.p.x; P[1] = g.p.y; P[2] = g.p.z; const r = colisionar(P, rg, oy); if (r) { g.p.set(P[0], P[1], P[2]); if (r === 1) { g.v.x *= -0.35; g.v.z *= -0.35; } else { g.v.y = Math.abs(g.v.y) * 0.25; g.v.x *= 0.6; g.v.z *= 0.6; } } }
          if (g.p.y < yp + rg) {
            g.p.y = yp + rg;
            if (!g.toco) { g.toco = true; if (ef.alTocarGib) ef.alTocarGib(g.p.x, yp, g.p.z, g.cab, g.v.length()); }
            g.v.x *= 0.55; g.v.z *= 0.55; g.v.y = Math.abs(g.v.y) * 0.32; g.w.multiplyScalar(0.55);
            if (g.v.lengthSq() < 0.35) { // se quedó: lo acuesta derecho en el piso
              g.quieto = true; g.asienta = 0;
              if (!g.cab) { eje.set(0, 1, 0).applyQuaternion(g.q); eje.y = 0; if (eje.lengthSq() < 1e-4) eje.set(1, 0, 0); eje.normalize(); g.qf.setFromUnitVectors(Y, eje); } else g.qf.copy(g.q);
            }
          }
          const wl = g.w.length();
          if (wl > 1e-4) { dq.setFromAxisAngle(eje.copy(g.w).multiplyScalar(1 / wl), wl * dt); g.q.premultiply(dq); }
        } else if (g.asienta < 1) { g.asienta = Math.min(1, g.asienta + dt * 5); g.q.slerp(g.qf, g.asienta); }
        if (g.t < 1.2) g.p.y -= dt * 0.12; // se hunde al final
        const s = g.t < 0.4 ? g.t / 0.4 : 1;
        m4.compose(g.p, g.q, vs.set(s, s, s));
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
