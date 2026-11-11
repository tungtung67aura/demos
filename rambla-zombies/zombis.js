// Zombis low-poly con volumen: cápsulas y esferas, sombreado con oclusión falsa (colores de vértice)
// y un borde de luz (rim) para que se lean de noche. Cada zombi es un esqueleto de Object3D vacíos
// y toda la horda se dibuja con InstancedMesh: ~15 draw calls sin importar cuántos haya.
import * as THREE from 'https://esm.sh/three@0.160.0';

const PIEL = [0x7f9a68, 0x8ea37a, 0x9aa486, 0x6f8a70, 0xa9ab90, 0x8a9a5a, 0xb0a890, 0x7a8e90];
const REMERA = [0x8a2e2e, 0x2e4a80, 0x6a6a4a, 0x9a7a50, 0x3a6a4a, 0x7a3a7a, 0xa8a8a8, 0x7ab8e8, 0xd8b040, 0xd0d0c8, 0x4a4a4a, 0xc85a28];
const PANT = [0x26304a, 0x4a3a24, 0x2e2e2e, 0x34507a, 0x5a5040];
const OJO = { normal: 0xffe14a, corredor: 0xff3020, gateador: 0xfff0a0, escupidor: 0x80ff40, explosivo: 0xff7a10, tanque: 0xff8a00, griton: 0xd8f4ff, patovica: 0xff1010, cerro: 0xff2a00 };

// hit: esferas de impacto [altura, radio, adelanto] en unidades del modelo (se multiplican por la escala)
const HIT_PARADO = [[1.74, 0.24, 0.04], [1.2, 0.38, 0], [0.5, 0.3, 0]];
const HIT_GATEA = [[0.5, 0.24, 0.95], [0.32, 0.4, 0.45], [0.25, 0.3, -0.05]];
let slotZ = 0; // ángulo áureo: cada zombi tiene su lugar en el cerco
export const TIPOS = {
  normal: { nombre: 'Zombi', vida: 70, vel: 1.75, escala: 1, dano: 9, puntos: 100, alcance: 1.25, prep: 0.45, hit: HIT_PARADO },
  corredor: { nombre: 'Corredor', vida: 45, vel: 4.0, escala: 0.92, dano: 6, puntos: 150, alcance: 1.2, prep: 0.3, hit: HIT_PARADO },
  gateador: { nombre: 'Gateador', vida: 50, vel: 1.9, escala: 1, dano: 8, puntos: 120, alcance: 1.3, prep: 0.4, hit: HIT_GATEA },
  escupidor: { nombre: 'Escupidor', vida: 60, vel: 1.5, escala: 1.02, dano: 12, puntos: 180, alcance: 1.25, prep: 0.7, hit: HIT_PARADO, rango: true },
  explosivo: { nombre: 'Explosivo', vida: 55, vel: 2.3, escala: 1.05, dano: 35, puntos: 160, alcance: 2.0, prep: 0.7, hit: HIT_PARADO },
  tanque: { nombre: 'Tanque', vida: 420, vel: 1.0, escala: 1.55, dano: 22, puntos: 400, alcance: 1.85, prep: 0.65, hit: HIT_PARADO },
  griton: { nombre: 'Gritón', vida: 55, vel: 1.6, escala: 0.97, dano: 7, puntos: 170, alcance: 1.2, prep: 1.1, hit: HIT_PARADO },
  patovica: { nombre: 'El Patovica del Cordón', vida: 2400, vel: 1.35, escala: 2.15, dano: 26, puntos: 3000, alcance: 2.4, prep: 0.7, hit: HIT_PARADO, jefe: true },
  cerro: { nombre: 'El Zombi del Cerro', vida: 9000, vel: 1.25, escala: 3.4, dano: 30, puntos: 10000, alcance: 3.4, prep: 1.0, hit: HIT_PARADO, jefe: true }
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
    this.rojo = new THREE.Color(1.2, 0.25, 0.2); this.naranja = new THREE.Color(1.6, 0.5, 0.1); this.cero = new THREE.Matrix4().makeScale(0, 0, 0);
    this.v = new THREE.Vector3(); this.cnt = {}; for (const k in PARTES) this.cnt[k] = 0;
  }
  dibujar(lista) {
    const cnt = this.cnt; for (const k in PARTES) cnt[k] = 0;
    const M = this.meshes;
    const put = this._put || (this._put = (k, obj, color) => { const i = this.cnt[k]++; this.meshes[k].setMatrixAt(i, obj.matrixWorld); this.meshes[k].setColorAt(i, color); });
    const nada = this._nada || (this._nada = k => this.meshes[k].setMatrixAt(this.cnt[k]++, this.cero));
    let ne = 0;
    for (const z of lista) {
      if (!z.mOk) { z.g.updateMatrixWorld(true); if (z.dormido) z.mOk = true; } // los cadáveres quietos no recalculan matrices
      const fl = z.flash > 0, piel = fl ? this.rojo : z.cPiel;
      let rem = fl ? this.rojo : z.cRemera;
      if (z.tipo === 'explosivo' && z.vivo) { z.cTmp.copy(z.cRemera).lerp(this.naranja, z.pulso); rem = fl ? this.rojo : z.cTmp; }
      put('torso', z.torso, rem); put('cadera', z.cadera, z.cPant);
      for (let j = 0; j < 3; j++) put('jiron', z.jirones[j], rem);
      put('mancha', z.manchas[0], z.cSangre); put('mancha', z.manchas[1], z.cRasgon);
      for (let j = 0; j < 2; j++) {
        if (z.sinBrazo[j]) { nada('manga'); nada('brazo'); nada('mano'); }
        else { put('manga', z.mangas[j], rem); put('brazo', z.brazos[j], piel); put('mano', z.manos[j], piel); }
        if (z.tipo === 'gateador') { nada('pierna'); nada('zapato'); }
        else { put('pierna', z.piernas[j], z.cPant); put('zapato', z.zapatos[j], z.cZapato); }
      }
      if (z.sinCabeza) { nada('cabeza'); nada('mandibula'); nada('boca'); nada('pelo'); nada('ojo'); nada('ojo'); }
      else {
        put('cabeza', z.cab, piel); put('mandibula', z.mandibula, piel); put('boca', z.boca, z.cBoca); put('pelo', z.pelo, z.cPelo);
        const ojo = z.vivo ? z.cOjo : z.cMuerto;
        for (let j = 0; j < 2; j++) {
          put('ojo', z.ojos[j], ojo);
          if (z.vivo) {
            z.ojos[j].getWorldPosition(this.v);
            this.pOjos[ne * 3] = this.v.x; this.pOjos[ne * 3 + 1] = this.v.y; this.pOjos[ne * 3 + 2] = this.v.z;
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
    kb: new THREE.Vector3(), ultPts: new Float32Array(27), rag: null, snapDir: new THREE.Vector2(),
    cPiel: new THREE.Color(), cRemera: new THREE.Color(), cPant: new THREE.Color(), cOjo: new THREE.Color(), cOjoBrillo: new THREE.Color(), cPelo: new THREE.Color(),
    cZapato: new THREE.Color(0x1a1714), cTmp: new THREE.Color(), sinBrazo: [false, false], cSangre: new THREE.Color(0x6a0808), cRasgon: new THREE.Color(), cBoca: new THREE.Color(0x200404), cMuerto: new THREE.Color(0x111111) };
}

const elegir = a => a[Math.floor(Math.random() * a.length)];
export function prepararZombi(z, tipo) {
  const T = TIPOS[tipo];
  z.tipo = tipo; z.T = T; z.vida = T.vida; z.vidaMax = T.vida; z.vivo = true; z.fase = Math.random() * 6; z.golpeT = 0.6; z.flash = 0; z.ataque = 0;
  z.prep = 0; z.estadoIA = 'ir'; z.timerIA = 0; z.cargaT = 0; z.aturdido = 0; z.pulso = 0; z.mecha = 0; z.flinch = 0;
  z.muerteT = 0; z.kb.set(0, 0, 0); z.velMult = 1; z.sube = false; z.gemido = 2 + Math.random() * 6; z.caida = 1; z.sinCabeza = false;
  z.rag = null; z.dormido = false; z.mOk = false; z.yaRag = false; z.tienePts = false; z.nan = 0; z.hundir = false; z.cadT = 0; z.arma = null;
  z.snap = 0; z.tamb = 0; z.tambLado = 0; z.tropiezo = 0; z.tropLado = 0; z.rengo = 0; z.danoPiernas = 0; z.rastro = 0; z.parte = 1;
  z.hombros[0].rotation.set(0, 0, 0); z.hombros[1].rotation.set(0, 0, 0); z.caderas[0].rotation.set(0, 0, 0); z.caderas[1].rotation.set(0, 0, 0);
  z.mandibula.rotation.set(0, 0, 0);
  z.sinBrazo[0] = z.sinBrazo[1] = false; z.flanco = (Math.random() * 2 - 1); z.slot = (slotZ = (slotZ + 2.39996) % 6.2832); z.alerta = 0; z.quemaT = 0; z.quemaD = 0; z.decT = Math.random() * 0.1; z.dirX = undefined; z.modV = 1; z.rugidoT = 8; z.piedraT = 5; z.explotado = false; z.rodeo = 1; z.rodeoT = 0; z.chequeoT = 2; z.distPrev = 1e9; z.trancado = 0; z.accion = ''; z.cargaT = 0;
  z.g.rotation.set(0, 0, 0); z.cuerpo.rotation.set(0, 0, 0); z.cabeza.rotation.set(0, 0, 0); z.cuerpo.position.set(0, 0.86, 0);
  z.torso.scale.set(1, 1, 1); z.cab.scale.set(1, 1, 1); z.cadera.position.set(0, 0.9, 0); z.cadera.rotation.set(0, 0, 0);
  z.cPiel.setHex(elegir(PIEL)).offsetHSL(0, 0, (Math.random() - 0.5) * 0.08);
  z.cRemera.setHex(elegir(REMERA)).offsetHSL(0, -0.1 * Math.random(), -0.08 * Math.random());
  z.cPant.setHex(elegir(PANT)); z.cSangre.setHex(0x6a0808);
  z.cOjo.setHex(OJO[tipo] || 0xffe14a).multiplyScalar(1.2); z.cOjoBrillo.setHex(OJO[tipo] || 0xffe14a).multiplyScalar(0.6);
  z.cPelo.setHex(Math.random() < 0.25 ? 0x8a8a80 : elegir([0x1a1410, 0x2a1a10, 0x3a2a18]));
  z.pelo.scale.setScalar(Math.random() < 0.8 ? 1 : 0.001);
  if (tipo === 'tanque') z.cRemera.setHex(elegir([0x5a1a1a, 0x2a3a2a, 0x3a3a50]));
  if (tipo === 'escupidor') { z.cPiel.setHex(0x8aa050); z.cSangre.setHex(0x6aff30).multiplyScalar(0.6); z.cab.scale.set(1.1, 1.15, 1.1); }
  if (tipo === 'griton') { z.cPiel.setHex(0xc8c4b0); z.cRemera.setHex(0x30303a); z.cab.scale.set(0.95, 1.22, 0.95); z.pelo.scale.setScalar(0.001); }
  if (tipo === 'explosivo') { z.cPiel.setHex(0xa8a060); z.cRemera.setHex(0x8a7a30); z.torso.scale.set(1.45, 1.15, 1.6); z.cSangre.setHex(0xd06010); }
  if (tipo === 'patovica') { z.cPiel.setHex(0xb8c890); z.cRemera.setHex(0x3a3a44); z.cPant.setHex(0x1a1a24); z.cPelo.setHex(0x050505); z.pelo.scale.setScalar(0.8); z.torso.scale.set(1.25, 1.05, 1.1); }
  if (tipo === 'cerro') { z.cPiel.setHex(0x9ab878); z.cRemera.setHex(0x7a5a3a); z.cPant.setHex(0x4a4030); z.cPelo.setHex(0x203018); z.torso.scale.set(1.2, 1.1, 1.15); }
  // ropa rota: jirones de largo distinto, algunos arrancados
  z.jirones.forEach(j => { j.scale.set(0.7 + Math.random() * 0.8, Math.random() < 0.2 ? 0.001 : 0.6 + Math.random() * 1.2, 1); j.rotation.z = (Math.random() - .5) * 0.5; });
  z.manchas[0].scale.setScalar(0.12 + Math.random() * 0.14); z.manchas[0].position.set((Math.random() - .5) * 0.2, 0.3 + Math.random() * 0.2, 0.152);
  z.manchas[1].scale.setScalar(Math.random() < 0.6 ? 0.07 + Math.random() * 0.07 : 0.001); z.manchas[1].position.set((Math.random() - .5) * 0.25, 0.42 + Math.random() * 0.12, 0.153);
  if (tipo === 'explosivo') { z.manchas[0].position.z = 0.25; z.manchas[1].position.z = 0.25; }
  z.cRasgon.copy(z.cRemera).multiplyScalar(0.45);
  const mangaLarga = Math.random() < 0.4;
  z.mangas.forEach(m => m.scale.set(1, mangaLarga ? 2.4 : 1, 1));
  z.esc = T.escala * (T.jefe ? 1 : 0.92 + Math.random() * 0.16);
  if (tipo === 'corredor') z.g.scale.set(z.esc * 0.85, z.esc, z.esc * 0.85);
  else if (tipo === 'tanque' || tipo === 'patovica') z.g.scale.set(z.esc * 1.12, z.esc, z.esc * 1.05);
  else z.g.scale.setScalar(z.esc);
  z.fatiga = Math.random() < 0.5 ? 1 : -1;
  return z;
}

export function animarZombi(z, dt, mov, t) {
  const B = z.hombros, P = z.caderas;
  if (!z.vivo) {
    z.muerteT += dt;
    const k = Math.min(1, z.muerteT / 0.6);
    if (z.tipo !== 'gateador') z.g.rotation.x = -z.caida * (Math.PI / 2) * (k * k);
    B[0].rotation.x = B[1].rotation.x = -2.6 * k;
    P[0].rotation.x *= 0.9; P[1].rotation.x *= 0.9;
    z.mandibula.rotation.x = 0.5 * k;
    if (z.muerteT > 3) z.g.position.y -= dt * 0.6;
    if (z.flash > 0) z.flash -= dt;
    return;
  }
  const tipo = z.tipo, corre = tipo === 'corredor';
  // mezcla: la velocidad de la animación sigue a la real suavizada (sin saltos parado/caminar/correr)
  z.movS = (z.movS || 0) + (mov - (z.movS || 0)) * Math.min(1, dt * 6); mov = z.movS;
  z.fase += dt * (corre ? 9 : tipo === 'gateador' ? 5 : 4.2) * Math.max(0.3, mov);
  const s = Math.sin(z.fase), c = Math.cos(z.fase * 0.5);
  if (tipo === 'gateador') { // se arrastra con los brazos
    z.cuerpo.position.y = 0.3; z.cuerpo.rotation.x = 1.38; z.cabeza.rotation.x = -1.15;
    B[0].rotation.x = -2.6 + s * 0.6; B[1].rotation.x = -2.6 - s * 0.6; B[0].rotation.z = -0.25; B[1].rotation.z = 0.25;
    z.cuerpo.rotation.z = s * 0.08; z.cadera.position.set(0, 0.26, -0.15); z.cadera.rotation.x = 1.3;
  } else {
    const amp = (corre ? 0.9 : 0.5) * Math.min(1.25, 0.35 + mov * 0.75);
    P[0].rotation.x = s * amp; P[1].rotation.x = -s * amp * (corre ? 1 : 0.7);
    if (corre) {
      B[0].rotation.x = -s * 1.1 - 0.5; B[1].rotation.x = s * 1.1 - 0.5; B[0].rotation.z = -0.15; B[1].rotation.z = 0.15;
      z.cuerpo.rotation.x = 0.4; z.cabeza.rotation.x = -0.3;
    } else {
      B[0].rotation.x = -1.4 + c * 0.15; B[1].rotation.x = -1.3 - c * 0.15; B[0].rotation.z = -0.08; B[1].rotation.z = 0.08;
      z.cuerpo.rotation.z = c * 0.13 + z.fatiga * 0.06; z.cuerpo.rotation.x = 0.14 + Math.abs(s) * 0.05;
      z.cabeza.rotation.z = Math.sin(z.fase * 0.3) * 0.35; z.cabeza.rotation.x = 0.1;
    }
    z.cuerpo.position.y = 0.86 + Math.abs(s) * 0.04;
  }
  z.mandibula.rotation.x = 0.15 + Math.abs(Math.sin(z.fase * 0.7)) * 0.25;
  // preparación del ataque: se lee de lejos (brazos arriba, boca abierta, se echa para atrás)
  if (z.prep > 0) {
    const k = 1 - z.prep / (z.prepTotal || 0.5);
    if (tipo === 'escupidor') { z.cuerpo.rotation.x = -0.35 * k; z.cabeza.rotation.x = -0.5 * k; z.mandibula.rotation.x = 0.7; }
    else if (tipo === 'gateador') { B[0].rotation.x = B[1].rotation.x = -3.0; }
    else if (tipo === 'griton') { z.cuerpo.rotation.x = -0.3 * k; z.cabeza.rotation.x = -0.7 * k; z.mandibula.rotation.x = 1.0; B[0].rotation.x = B[1].rotation.x = -0.9 * k; B[0].rotation.z = 0.8 * k; B[1].rotation.z = -0.8 * k; }
    else if (tipo === 'explosivo') { z.torso.scale.set(1.45 + k * 0.35, 1.15 + k * 0.15, 1.6 + k * 0.35); }
    else { const w = Math.min(1, k * 3); B[0].rotation.x += (-2.4 - k * 0.6 - B[0].rotation.x) * w; B[1].rotation.x += (-2.4 - k * 0.6 - B[1].rotation.x) * w; z.cuerpo.rotation.x += (-0.2 * k - z.cuerpo.rotation.x) * w; z.mandibula.rotation.x = 0.65; }
  }
  if (z.ataque > 0) {
    const a = Math.sin((1 - z.ataque / 0.4) * Math.PI);
    if (tipo !== 'gateador') { B[0].rotation.x = B[1].rotation.x = -1.6 + a * 0.7; z.cuerpo.rotation.x = 0.1 + a * 0.45; }
    z.mandibula.rotation.x = 0.55;
  }
  if (z.cargaT > 0) { z.cuerpo.rotation.x = 0.6; B[0].rotation.x = B[1].rotation.x = 0.5; }
  if (z.aturdido > 0) { z.cuerpo.rotation.z = Math.sin(z.fase * 3) * 0.3; z.cabeza.rotation.x = 0.6; }
  if (z.flinch > 0) { z.cuerpo.rotation.x -= z.flinch * 2.2; z.flinch = Math.max(0, z.flinch - dt); }
  // reacciones según dónde pegó: cabeza que se va para atrás, torso que se tuerce, piernas que se doblan
  if (z.snap > 0) { const k = z.snap * z.snap; z.cabeza.rotation.x -= k * 1.1; z.cabeza.rotation.z += k * 0.5 * z.snapDir.x; z.cuerpo.rotation.x -= k * 0.25; z.snap = Math.max(0, z.snap - dt * 4.5); }
  if (z.tamb > 0) { const k = Math.sin(Math.min(1, z.tamb / 0.35) * Math.PI * 0.5); z.cuerpo.rotation.y = z.tambLado * k * 0.55; z.cuerpo.rotation.x -= k * 0.3; z.tamb = Math.max(0, z.tamb - dt); }
  else z.cuerpo.rotation.y *= 0.85;
  if (z.tropiezo > 0 && tipo !== 'gateador') { // se le dobla una rodilla y casi se cae
    const k = Math.sin(Math.min(1, z.tropiezo / 0.6) * Math.PI);
    z.cuerpo.position.y -= k * 0.14; z.cuerpo.rotation.x += k * 0.45; P[z.tropLado].rotation.x = 0.7 * k; P[1 - z.tropLado].rotation.x = -0.35 * k;
    B[0].rotation.x += k * 0.9; B[1].rotation.x += k * 0.7; z.tropiezo = Math.max(0, z.tropiezo - dt);
  }
  if (z.rengo > 0 && tipo !== 'gateador' && !(z.cargaT > 0)) { // rengo: una pierna dura que arrastra
    const ld = z.rengo > 1.5 ? 1 : 0; P[ld].rotation.x *= 0.25; P[ld].rotation.z = (ld ? -1 : 1) * 0.08;
    z.cuerpo.position.y -= Math.max(0, Math.sin(z.fase)) * 0.07; z.cuerpo.rotation.z += (ld ? -1 : 1) * (0.1 + Math.max(0, Math.sin(z.fase)) * 0.12);
  }
  if (tipo === 'explosivo') z.pulso = z.mecha > 0 ? (Math.sin(z.mecha * 40) > 0 ? 1 : 0.2) : 0.15 + 0.15 * Math.sin(z.fase * 2);
  if (z.flash > 0) z.flash -= dt;
}
