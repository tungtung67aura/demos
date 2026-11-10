// Zombis low-poly. Cada zombi es un esqueleto de Object3D vacíos (hombros, caderas, cabeza)
// y se dibujan todos juntos con InstancedMesh: 7 draw calls para toda la horda.
import * as THREE from 'https://esm.sh/three@0.160.0';

const PIEL = [0x6f8a5c, 0x7d8f6a, 0x8a9670, 0x5f7a60, 0x9a9a7a, 0x7a8a50];
const REMERA = [0x5a2a2a, 0x2a3a5a, 0x4a4a3a, 0x7a6a50, 0x305040, 0x6a3a6a, 0x8a8a8a, 0xa0a8b8];
const PANT = [0x1e2430, 0x3a3020, 0x252525, 0x2a3a5a];
const OJO = { normal: 0xffe14a, corredor: 0xff3020, tanque: 0xff8a00 };

export const TIPOS = {
  normal: { vida: 70, vel: 1.75, escala: 1, dano: 9, puntos: 100, alcance: 1.25 },
  corredor: { vida: 45, vel: 4.0, escala: 0.92, dano: 6, puntos: 150, alcance: 1.2 },
  tanque: { vida: 420, vel: 1.0, escala: 1.55, dano: 22, puntos: 400, alcance: 1.85 }
};

// partes: [nombre, geometría base, material]
const PARTES = {
  torso: { geo: new THREE.BoxGeometry(0.52, 0.68, 0.3), lit: true },
  mancha: { geo: new THREE.BoxGeometry(1, 1, 0.02), lit: true },
  cabeza: { geo: new THREE.BoxGeometry(0.3, 0.32, 0.3), lit: true },
  pelo: { geo: new THREE.BoxGeometry(0.32, 0.08, 0.32), lit: true },
  ojo: { geo: new THREE.BoxGeometry(0.06, 0.04, 0.02), lit: false },
  brazo: { geo: new THREE.BoxGeometry(0.13, 0.62, 0.13).translate(0, -0.29, 0), lit: true },
  pierna: { geo: new THREE.BoxGeometry(0.18, 0.78, 0.2).translate(0, -0.39, 0), lit: true }
};
const POR_ZOMBI = { torso: 1, mancha: 1, cabeza: 1, pelo: 1, ojo: 3, brazo: 2, pierna: 2 };

export class Horda {
  constructor(scene, max) {
    this.max = max; this.meshes = {};
    for (const k in PARTES) {
      const mat = PARTES[k].lit ? new THREE.MeshStandardMaterial({ roughness: 0.95 }) : new THREE.MeshBasicMaterial();
      const im = new THREE.InstancedMesh(PARTES[k].geo, mat, max * POR_ZOMBI[k]);
      im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      im.setColorAt(0, new THREE.Color()); im.instanceColor.setUsage(THREE.DynamicDrawUsage);
      im.frustumCulled = false; im.count = 0; scene.add(im); this.meshes[k] = im;
    }
    this.col = new THREE.Color(); this.rojo = new THREE.Color(1, 0.15, 0.1); this.blanco = new THREE.Color(3, 3, 3);
    this.cero = new THREE.Matrix4().makeScale(0, 0, 0);
  }
  // escribe las matrices de todos los zombis activos
  dibujar(lista) {
    const cnt = {}; for (const k in PARTES) cnt[k] = 0;
    const put = (k, obj, color) => {
      const im = this.meshes[k], i = cnt[k]++;
      im.setMatrixAt(i, obj.matrixWorld); im.setColorAt(i, color);
    };
    for (const z of lista) {
      z.g.updateMatrixWorld(true);
      const fl = z.flash > 0;
      const piel = fl ? this.rojo : z.cPiel;
      put('torso', z.torso, fl ? this.rojo : z.cRemera); put('mancha', z.mancha, z.cSangre);
      if (z.sinCabeza) { this.meshes.cabeza.setMatrixAt(cnt.cabeza++, this.cero); this.meshes.pelo.setMatrixAt(cnt.pelo++, this.cero); this.meshes.ojo.setMatrixAt(cnt.ojo++, this.cero); this.meshes.ojo.setMatrixAt(cnt.ojo++, this.cero); this.meshes.ojo.setMatrixAt(cnt.ojo++, this.cero); }
      else { put('cabeza', z.cabeza, piel); put('pelo', z.pelo, z.cPelo); put('ojo', z.ojos[0], z.vivo ? z.cOjo : z.cMuerto); put('ojo', z.ojos[1], z.vivo ? z.cOjo : z.cMuerto); put('ojo', z.boca, z.cBoca); }
      put('brazo', z.brazos[0], piel); put('brazo', z.brazos[1], piel);
      put('pierna', z.piernas[0], z.cPant); put('pierna', z.piernas[1], z.cPant);
    }
    for (const k in PARTES) {
      const im = this.meshes[k]; im.count = cnt[k];
      im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
    }
  }
}

export function crearZombi() {
  const g = new THREE.Object3D(), o = () => new THREE.Object3D();
  const cuerpo = o(); cuerpo.position.y = 0.8; g.add(cuerpo);
  const torso = o(); torso.position.y = 0.34; cuerpo.add(torso);
  const mancha = o(); cuerpo.add(mancha);
  const cabeza = o(); cabeza.position.y = 0.86; cuerpo.add(cabeza);
  const pelo = o(); pelo.position.y = 0.17; cabeza.add(pelo);
  const ojos = [-1, 1].map(s => { const e = o(); e.position.set(s * 0.07, 0.03, 0.151); cabeza.add(e); return e; });
  const boca = o(); boca.position.set(0.02, -0.08, 0.152); boca.scale.set(1.8, 1.3, 1); boca.rotation.z = 0.15; cabeza.add(boca);
  const brazos = [-1, 1].map(s => { const b = o(); b.position.set(s * 0.33, 0.62, 0); cuerpo.add(b); return b; });
  const piernas = [-1, 1].map(s => { const p = o(); p.position.set(s * 0.13, 0.8, 0); g.add(p); return p; });
  return { g, cuerpo, torso, mancha, cabeza, pelo, ojos, boca, brazos, piernas, kb: new THREE.Vector3(),
    cPiel: new THREE.Color(), cRemera: new THREE.Color(), cPant: new THREE.Color(), cOjo: new THREE.Color(), cPelo: new THREE.Color(),
    cSangre: new THREE.Color(0x5a0a0a), cBoca: new THREE.Color(0x1a0303), cMuerto: new THREE.Color(0x111111) };
}

const elegir = a => a[Math.floor(Math.random() * a.length)];
// reinicia un zombi del pool con un tipo nuevo y colores al azar
export function prepararZombi(z, tipo) {
  const T = TIPOS[tipo];
  z.tipo = tipo; z.T = T; z.vida = T.vida * 1; z.vivo = true; z.fase = Math.random() * 6; z.golpeT = 0; z.flash = 0; z.ataque = 0;
  z.muerteT = 0; z.kb.set(0, 0, 0); z.velMult = 1; z.sube = false; z.gemido = 2 + Math.random() * 6; z.caida = 1; z.sinCabeza = false;
  z.g.rotation.set(0, 0, 0); z.cuerpo.rotation.set(0, 0, 0); z.cabeza.rotation.set(0, 0, 0);
  z.cPiel.setHex(elegir(PIEL)); z.cRemera.setHex(tipo === 'tanque' ? 0x4a1515 : elegir(REMERA)); z.cPant.setHex(elegir(PANT));
  z.cOjo.setHex(OJO[tipo]).multiplyScalar(2); z.cPelo.setHex(Math.random() < 0.3 ? 0x8a8a80 : 0x1a1410);
  z.pelo.scale.setScalar(Math.random() < 0.75 ? 1 : 0.001);
  z.mancha.scale.set(0.2 + Math.random() * 0.25, 0.15 + Math.random() * 0.25, 1);
  z.mancha.position.set((Math.random() - .5) * 0.2, 0.25 + Math.random() * 0.2, 0.16);
  z.esc = T.escala * (0.92 + Math.random() * 0.16);
  if (tipo === 'corredor') z.g.scale.set(z.esc * 0.85, z.esc, z.esc * 0.85); else z.g.scale.setScalar(z.esc);
  return z;
}

// caminar arrastrando los pies, manotazo y caída
export function animarZombi(z, dt, mov) {
  if (!z.vivo) {
    z.muerteT += dt;
    const k = Math.min(1, z.muerteT / 0.6);
    z.g.rotation.x = -z.caida * (Math.PI / 2) * (k * k);
    z.brazos[0].rotation.x = z.brazos[1].rotation.x = -2.6 * k;
    z.piernas[0].rotation.x *= 0.9; z.piernas[1].rotation.x *= 0.9;
    if (z.muerteT > 3) z.g.position.y -= dt * 0.6;
    if (z.flash > 0) z.flash -= dt;
    return;
  }
  const corre = z.tipo === 'corredor';
  z.fase += dt * (corre ? 9 : 4.2) * Math.max(0.3, mov);
  const s = Math.sin(z.fase), c = Math.cos(z.fase * 0.5);
  const amp = corre ? 0.9 : 0.5;
  z.piernas[0].rotation.x = s * amp; z.piernas[1].rotation.x = -s * amp;
  if (corre) { z.brazos[0].rotation.x = -s * 1.1 - 0.4; z.brazos[1].rotation.x = s * 1.1 - 0.4; z.cuerpo.rotation.x = 0.35; }
  else {
    z.brazos[0].rotation.x = -1.45 + c * 0.15; z.brazos[1].rotation.x = -1.35 - c * 0.15;
    z.cuerpo.rotation.z = c * 0.13; z.cuerpo.rotation.x = 0.12 + Math.abs(s) * 0.05;
    z.cabeza.rotation.z = Math.sin(z.fase * 0.3) * 0.35;
  }
  if (z.ataque > 0) {
    const a = Math.sin((1 - z.ataque / 0.5) * Math.PI);
    z.brazos[0].rotation.x = z.brazos[1].rotation.x = -1.6 - a * 0.9; z.cuerpo.rotation.x = 0.1 + a * 0.3;
  }
  z.cuerpo.position.y = 0.8 + Math.abs(s) * 0.04;
  if (z.flash > 0) z.flash -= dt;
}
