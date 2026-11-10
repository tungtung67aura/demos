// Zombis low-poly con volumen: cápsulas y esferas, sombreado con oclusión falsa (colores de vértice)
// y un borde de luz (rim) para que se lean de noche. Cada zombi es un esqueleto de Object3D vacíos
// y toda la horda se dibuja con InstancedMesh: ~15 draw calls sin importar cuántos haya.
import * as THREE from 'https://esm.sh/three@0.160.0';

const PIEL = [0x7f9a68, 0x8ea37a, 0x9aa486, 0x6f8a70, 0xa9ab90, 0x8a9a5a, 0xb0a890, 0x7a8e90];
const REMERA = [0x8a2e2e, 0x2e4a80, 0x6a6a4a, 0x9a7a50, 0x3a6a4a, 0x7a3a7a, 0xa8a8a8, 0x7ab8e8, 0xd8b040, 0xd0d0c8, 0x4a4a4a, 0xc85a28];
const PANT = [0x26304a, 0x4a3a24, 0x2e2e2e, 0x34507a, 0x5a5040];
const OJO = { normal: 0xffe14a, corredor: 0xff3020, tanque: 0xff8a00 };

export const TIPOS = {
  normal: { vida: 70, vel: 1.75, escala: 1, dano: 9, puntos: 100, alcance: 1.25 },
  corredor: { vida: 45, vel: 4.0, escala: 0.92, dano: 6, puntos: 150, alcance: 1.2 },
  tanque: { vida: 420, vel: 1.0, escala: 1.55, dano: 22, puntos: 400, alcance: 1.85 }
};

// oclusión falsa: más oscuro abajo, un poco de mugre al azar
function ao(geo, oscuro = 0.55, ruido = 0.12) {
  geo.computeBoundingBox();
  const b = geo.boundingBox, p = geo.attributes.position, c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const k = (p.getY(i) - b.min.y) / ((b.max.y - b.min.y) || 1);
    const v = (oscuro + (1 - oscuro) * Math.pow(k, 0.7)) * (1 - Math.random() * ruido);
    c[i * 3] = c[i * 3 + 1] = c[i * 3 + 2] = v;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return geo;
}
const cap = (r, l, cs = 4, rs = 8) => new THREE.CapsuleGeometry(r, l, cs, rs);

const PARTES = {
  torso: { geo: ao(cap(0.19, 0.3, 3, 10).scale(1.25, 1, 0.78), 0.5), n: 1 },
  cadera: { geo: ao(cap(0.13, 0.16, 2, 8).rotateZ(Math.PI / 2).scale(1, 1, 0.9), 0.6), n: 1 },
  jiron: { geo: ao(new THREE.BoxGeometry(0.11, 0.16, 0.025).translate(0, -0.08, 0), 0.5), n: 3 },
  mancha: { geo: new THREE.CircleGeometry(0.5, 7), n: 2, basic: false },
  cabeza: { geo: ao(new THREE.SphereGeometry(0.155, 12, 9).scale(1, 1.12, 1.05), 0.6), n: 1 },
  mandibula: { geo: ao(new THREE.BoxGeometry(0.2, 0.07, 0.17, 2, 1, 2).translate(0, -0.035, 0.06), 0.7), n: 1 },
  boca: { geo: new THREE.BoxGeometry(0.13, 0.06, 0.05), n: 1 },
  pelo: { geo: ao(new THREE.SphereGeometry(0.165, 10, 5, 0, Math.PI * 2, 0, Math.PI * 0.42).scale(1, 1.1, 1.08), 0.7), n: 1 },
  ojo: { geo: new THREE.SphereGeometry(0.03, 6, 4), n: 2, basic: true },
  manga: { geo: ao(cap(0.082, 0.12, 2, 8).translate(0, -0.11, 0), 0.6), n: 2 },
  brazo: { geo: ao(cap(0.058, 0.46, 2, 7).translate(0, -0.29, 0), 0.65), n: 2 },
  mano: { geo: ao(new THREE.SphereGeometry(0.065, 7, 5).scale(0.9, 1.2, 0.7), 0.6), n: 2 },
  pierna: { geo: ao(cap(0.088, 0.58, 2, 8).translate(0, -0.38, 0), 0.45), n: 2 },
  zapato: { geo: ao(new THREE.BoxGeometry(0.13, 0.09, 0.25).translate(0, 0, 0.04), 0.6), n: 2 }
};

// MeshStandard + borde de luz de luna, para que la silueta se separe del fondo
function materialZombi() {
  const m = new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0, vertexColors: true });
  m.onBeforeCompile = sh => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
       float rim = 1.0 - abs(dot(normal, normalize(vViewPosition)));
       totalEmissiveRadiance += vec3(0.30, 0.42, 0.48) * pow(rim, 3.0) * 0.5;`);
  };
  return m;
}

export class Horda {
  constructor(scene, max) {
    this.max = max; this.meshes = {};
    const lit = materialZombi();
    for (const k in PARTES) {
      const P = PARTES[k];
      const mat = P.basic ? new THREE.MeshBasicMaterial() :
        k === 'mancha' ? new THREE.MeshStandardMaterial({ roughness: 0.4, polygonOffset: true, polygonOffsetFactor: -3, side: THREE.DoubleSide }) :
        k === 'boca' ? new THREE.MeshBasicMaterial() : lit;
      const im = new THREE.InstancedMesh(P.geo, mat, max * P.n);
      im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      im.setColorAt(0, new THREE.Color()); im.instanceColor.setUsage(THREE.DynamicDrawUsage);
      im.frustumCulled = false; im.count = 0; scene.add(im); this.meshes[k] = im;
    }
    // brillo de los ojos: un solo Points para toda la horda
    this.pOjos = new Float32Array(max * 2 * 3).fill(-999);
    this.cOjos = new Float32Array(max * 2 * 3);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pOjos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('color', new THREE.BufferAttribute(this.cOjos, 3).setUsage(THREE.DynamicDrawUsage));
    const c = document.createElement('canvas'); c.width = c.height = 32;
    const x = c.getContext('2d'), gr = x.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,255,255,0.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 32, 32);
    this.brillo = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.13, map: new THREE.CanvasTexture(c), vertexColors: true, transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false }));
    this.brillo.frustumCulled = false; scene.add(this.brillo);
    this.rojo = new THREE.Color(1.2, 0.25, 0.2); this.cero = new THREE.Matrix4().makeScale(0, 0, 0);
    this.v = new THREE.Vector3(); this.cnt = {}; for (const k in PARTES) this.cnt[k] = 0;
  }
  dibujar(lista) {
    const cnt = this.cnt; for (const k in PARTES) cnt[k] = 0;
    const M = this.meshes;
    const put = (k, obj, color) => { const i = cnt[k]++; M[k].setMatrixAt(i, obj.matrixWorld); M[k].setColorAt(i, color); };
    const nada = k => M[k].setMatrixAt(cnt[k]++, this.cero);
    let ne = 0;
    for (const z of lista) {
      z.g.updateMatrixWorld(true);
      const fl = z.flash > 0, piel = fl ? this.rojo : z.cPiel, rem = fl ? this.rojo : z.cRemera;
      put('torso', z.torso, rem); put('cadera', z.cadera, z.cPant);
      for (let j = 0; j < 3; j++) put('jiron', z.jirones[j], rem);
      put('mancha', z.manchas[0], z.cSangre); put('mancha', z.manchas[1], z.cRasgon);
      for (let j = 0; j < 2; j++) {
        put('manga', z.mangas[j], rem); put('brazo', z.brazos[j], piel); put('mano', z.manos[j], piel);
        put('pierna', z.piernas[j], z.cPant); put('zapato', z.zapatos[j], z.cZapato);
      }
      if (z.sinCabeza) { nada('cabeza'); nada('mandibula'); nada('boca'); nada('pelo'); nada('ojo'); nada('ojo'); }
      else {
        put('cabeza', z.cab, piel); put('mandibula', z.mandibula, piel); put('boca', z.boca, z.cBoca); put('pelo', z.pelo, z.cPelo);
        const ojo = z.vivo ? z.cOjo : z.cMuerto;
        for (let j = 0; j < 2; j++) {
          put('ojo', z.ojos[j], ojo);
          if (z.vivo) {
            z.ojos[j].getWorldPosition(this.v);
            this.pOjos.set([this.v.x, this.v.y, this.v.z], ne * 3);
            this.cOjos[ne * 3] = z.cOjoBrillo.r; this.cOjos[ne * 3 + 1] = z.cOjoBrillo.g; this.cOjos[ne * 3 + 2] = z.cOjoBrillo.b; ne++;
          }
        }
      }
    }
    for (let i = ne; i < this.max * 2; i++) this.pOjos[i * 3 + 1] = -999;
    this.brillo.geometry.attributes.position.needsUpdate = true; this.brillo.geometry.attributes.color.needsUpdate = true;
    for (const k in PARTES) { const im = M[k]; im.count = cnt[k]; im.instanceMatrix.needsUpdate = true; im.instanceColor.needsUpdate = true; }
  }
}

export function crearZombi() {
  const o = (padre, x = 0, y = 0, z = 0) => { const n = new THREE.Object3D(); n.position.set(x, y, z); padre.add(n); return n; };
  const g = new THREE.Object3D();
  const cuerpo = o(g, 0, 0.86);
  const torso = o(cuerpo, 0, 0.36), cadera = o(g, 0, 0.9);
  const jirones = [o(cuerpo, -0.12, 0.13, 0.13), o(cuerpo, 0.08, 0.12, 0.14), o(cuerpo, 0.02, 0.13, -0.14)];
  const manchas = [o(cuerpo, 0, 0.4, 0.152), o(cuerpo, 0, 0.3, 0.152)];
  const cabeza = o(cuerpo, 0, 0.8);
  const cab = o(cabeza, 0, 0.1), pelo = o(cabeza, 0, 0.115, -0.005);
  const ojos = [-1, 1].map(s => o(cabeza, s * 0.058, 0.125, 0.14));
  const boca = o(cabeza, 0, 0.02, 0.115);
  const mandibula = o(cabeza, 0, 0.04, 0.0);
  const hombros = [-1, 1].map(s => o(cuerpo, s * 0.27, 0.58));
  const mangas = hombros.map(h => o(h)), brazos = hombros.map(h => o(h)), manos = hombros.map(h => o(h, 0, -0.62));
  const caderas = [-1, 1].map(s => o(g, s * 0.11, 0.86));
  const piernas = caderas.map(c => o(c)), zapatos = caderas.map(c => o(c, 0, -0.81, 0.0));
  return { g, cuerpo, torso, cadera, jirones, manchas, cabeza, cab, pelo, ojos, boca, mandibula, hombros, mangas, brazos, manos, caderas, piernas, zapatos,
    kb: new THREE.Vector3(),
    cPiel: new THREE.Color(), cRemera: new THREE.Color(), cPant: new THREE.Color(), cOjo: new THREE.Color(), cOjoBrillo: new THREE.Color(), cPelo: new THREE.Color(),
    cZapato: new THREE.Color(0x1a1714), cSangre: new THREE.Color(0x6a0808), cRasgon: new THREE.Color(), cBoca: new THREE.Color(0x200404), cMuerto: new THREE.Color(0x111111) };
}

const elegir = a => a[Math.floor(Math.random() * a.length)];
export function prepararZombi(z, tipo) {
  const T = TIPOS[tipo];
  z.tipo = tipo; z.T = T; z.vida = T.vida; z.vivo = true; z.fase = Math.random() * 6; z.golpeT = 0; z.flash = 0; z.ataque = 0;
  z.muerteT = 0; z.kb.set(0, 0, 0); z.velMult = 1; z.sube = false; z.gemido = 2 + Math.random() * 6; z.caida = 1; z.sinCabeza = false;
  z.g.rotation.set(0, 0, 0); z.cuerpo.rotation.set(0, 0, 0); z.cabeza.rotation.set(0, 0, 0);
  z.cPiel.setHex(elegir(PIEL)).offsetHSL(0, 0, (Math.random() - 0.5) * 0.08);
  z.cRemera.setHex(tipo === 'tanque' ? elegir([0x5a1a1a, 0x2a3a2a, 0x3a3a50]) : elegir(REMERA)).offsetHSL(0, -0.1 * Math.random(), -0.08 * Math.random());
  z.cPant.setHex(elegir(PANT)); z.cRasgon.copy(z.cPiel).multiplyScalar(0.8);
  z.cOjo.setHex(OJO[tipo]).multiplyScalar(1.2); z.cOjoBrillo.setHex(OJO[tipo]).multiplyScalar(0.6);
  z.cPelo.setHex(Math.random() < 0.25 ? 0x8a8a80 : elegir([0x1a1410, 0x2a1a10, 0x3a2a18]));
  z.pelo.scale.setScalar(Math.random() < 0.8 ? 1 : 0.001);
  // ropa rota: jirones de largo distinto, algunos arrancados
  z.jirones.forEach(j => { j.scale.set(0.7 + Math.random() * 0.8, Math.random() < 0.2 ? 0.001 : 0.6 + Math.random() * 1.2, 1); j.rotation.z = (Math.random() - .5) * 0.5; });
  z.manchas[0].scale.setScalar(0.12 + Math.random() * 0.14); z.manchas[0].position.set((Math.random() - .5) * 0.2, 0.3 + Math.random() * 0.2, 0.152);
  z.manchas[1].scale.setScalar(Math.random() < 0.6 ? 0.07 + Math.random() * 0.07 : 0.001); z.manchas[1].position.set((Math.random() - .5) * 0.25, 0.42 + Math.random() * 0.12, 0.153);
  const mangaLarga = Math.random() < 0.4;
  z.mangas.forEach(m => m.scale.set(1, mangaLarga ? 2.4 : 1, 1));
  z.esc = T.escala * (0.92 + Math.random() * 0.16);
  if (tipo === 'corredor') z.g.scale.set(z.esc * 0.85, z.esc, z.esc * 0.85);
  else if (tipo === 'tanque') z.g.scale.set(z.esc * 1.12, z.esc, z.esc * 1.05);
  else z.g.scale.setScalar(z.esc);
  z.fatiga = Math.random() < 0.5 ? 1 : -1; // de qué lado rengea
  return z;
}

export function animarZombi(z, dt, mov) {
  const B = z.hombros, P = z.caderas;
  if (!z.vivo) {
    z.muerteT += dt;
    const k = Math.min(1, z.muerteT / 0.6);
    z.g.rotation.x = -z.caida * (Math.PI / 2) * (k * k);
    B[0].rotation.x = B[1].rotation.x = -2.6 * k;
    P[0].rotation.x *= 0.9; P[1].rotation.x *= 0.9;
    z.mandibula.rotation.x = 0.5 * k;
    if (z.muerteT > 3) z.g.position.y -= dt * 0.6;
    if (z.flash > 0) z.flash -= dt;
    return;
  }
  const corre = z.tipo === 'corredor';
  z.fase += dt * (corre ? 9 : 4.2) * Math.max(0.3, mov);
  const s = Math.sin(z.fase), c = Math.cos(z.fase * 0.5);
  const amp = corre ? 0.9 : 0.5;
  P[0].rotation.x = s * amp; P[1].rotation.x = -s * amp * (corre ? 1 : 0.7);
  if (corre) {
    B[0].rotation.x = -s * 1.1 - 0.5; B[1].rotation.x = s * 1.1 - 0.5; B[0].rotation.z = -0.15; B[1].rotation.z = 0.15;
    z.cuerpo.rotation.x = 0.4; z.cabeza.rotation.x = -0.3;
  } else { // brazos hacia adelante, rengueando
    B[0].rotation.x = -1.4 + c * 0.15; B[1].rotation.x = -1.3 - c * 0.15; B[0].rotation.z = -0.08; B[1].rotation.z = 0.08;
    z.cuerpo.rotation.z = c * 0.13 + z.fatiga * 0.06; z.cuerpo.rotation.x = 0.14 + Math.abs(s) * 0.05;
    z.cabeza.rotation.z = Math.sin(z.fase * 0.3) * 0.35; z.cabeza.rotation.x = 0.1;
  }
  z.mandibula.rotation.x = 0.15 + Math.abs(Math.sin(z.fase * 0.7)) * 0.25;
  if (z.ataque > 0) {
    const a = Math.sin((1 - z.ataque / 0.5) * Math.PI);
    B[0].rotation.x = B[1].rotation.x = -1.6 - a * 0.9; z.cuerpo.rotation.x = 0.1 + a * 0.3; z.mandibula.rotation.x = 0.55;
  }
  z.cuerpo.position.y = 0.86 + Math.abs(s) * 0.04;
  if (z.flash > 0) z.flash -= dt;
}
