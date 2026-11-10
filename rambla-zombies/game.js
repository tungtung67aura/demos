// Zombis en la Rambla — juego principal
import * as THREE from 'https://esm.sh/three@0.160.0';
import { crearMundo, local, aMundo, piso, muestras, NM, brilloTex } from './world.js';
import { ARMAS, DESBLOQUEOS, crearModelos } from './armas.js';
import { Horda, crearZombi, prepararZombi, animarZombi, TIPOS } from './zombis.js';
import { iniciarAudio, sonido, volumen } from './audio.js';

const $ = id => document.getElementById(id);
const movil = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
if (movil) document.body.classList.add('es-movil');

// ---------- Ajustes ----------
const AJ = Object.assign({ fps: 0, calidad: movil ? 'media' : 'alta', sens: 1, contador: false, volumen: 0.7 },
  JSON.parse(localStorage.getItem('rz-ajustes') || '{}'));
const CAL = {
  baja: { pr: 1, maxZ: 10, sangre: 160, olasLivianas: true },
  media: { pr: 1.5, maxZ: 14, sangre: 260, olasLivianas: true },
  alta: { pr: 2, maxZ: 20, sangre: 420, olasLivianas: false }
};
const guardarAjustes = () => localStorage.setItem('rz-ajustes', JSON.stringify(AJ));

// ---------- Render ----------
const renderer = new THREE.WebGLRenderer({ antialias: !movil, powerPreference: 'high-performance' });
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.autoClear = false;
document.body.prepend(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 2200);
camera.rotation.order = 'YXZ';
scene.add(camera);
const mundo = crearMundo(scene, CAL[AJ.calidad].olasLivianas);
const luzJugador = new THREE.PointLight(0xffd8a8, 4, 18, 1.5); camera.add(luzJugador); // linterna tenue + fogonazo

// arma en primera persona: escena aparte para que nunca atraviese paredes
const vmScene = new THREE.Scene(), vmCam = new THREE.PerspectiveCamera(60, 1, 0.01, 10);
vmScene.add(new THREE.HemisphereLight(0xa0b0e0, 0x403020, 2.2));
const vmLuz = new THREE.DirectionalLight(0xffd8b0, 2.2); vmLuz.position.set(1, 2, 1); vmScene.add(vmLuz);
const vmFlashLuz = new THREE.PointLight(0xffb050, 0, 3); vmFlashLuz.position.set(0.2, 0, -0.8); vmScene.add(vmFlashLuz);
const soporte = new THREE.Group(); vmScene.add(soporte); soporte.scale.setScalar(0.8);
const modelos = crearModelos();
const texFlash = brilloTex('rgba(255,200,90,1)');
for (const a of ARMAS) {
  const m = modelos[a.id]; m.visible = false; soporte.add(m);
  if (a.tipo === 'fuego') {
    const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: texFlash, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    f.position.copy(m.userData.punta); f.scale.setScalar(a.id === 'escopeta' ? 0.5 : 0.32); f.visible = false; m.add(f); m.userData.flash = f;
  }
}

function aplicarCalidad() {
  renderer.setPixelRatio(Math.min(devicePixelRatio, CAL[AJ.calidad].pr));
  redimensionar();
}
let aspecto = 1;
function redimensionar() {
  const w = innerWidth, h = innerHeight; aspecto = w / h;
  renderer.setSize(w, h);
  // campo visual horizontal ~90°, también en vertical (celular parado)
  camera.fov = Math.min(95, THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(45)) / aspecto)));
  camera.fov = Math.max(camera.fov, 62);
  camera.aspect = aspecto; camera.updateProjectionMatrix();
  vmCam.aspect = aspecto; vmCam.updateProjectionMatrix();
}
addEventListener('resize', redimensionar);
aplicarCalidad();

// ---------- Sangre (partículas en un solo Points) ----------
function gota() { const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.beginPath(); x.arc(16, 16, 14, 0, 7); x.fill(); return new THREE.CanvasTexture(c); }
const NS = CAL.alta.sangre;
const sPos = new Float32Array(NS * 3).fill(-999), sVel = new Float32Array(NS * 3), sVida = new Float32Array(NS);
const gSangre = new THREE.BufferGeometry(); gSangre.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
gSangre.attributes.position.setUsage(THREE.DynamicDrawUsage);
const sangre = new THREE.Points(gSangre, new THREE.PointsMaterial({ color: 0xb00a0a, size: 0.075, sizeAttenuation: true, map: gota(), transparent: true, alphaTest: 0.3, depthWrite: false }));
sangre.frustumCulled = false; scene.add(sangre);
let sIdx = 0;
function salpicar(x, y, z, n, fuerza = 3, dx = 0, dz = 0) {
  const lim = CAL[AJ.calidad].sangre;
  for (let k = 0; k < n; k++) {
    const i = sIdx = (sIdx + 1) % lim;
    sPos[i * 3] = x; sPos[i * 3 + 1] = y; sPos[i * 3 + 2] = z;
    sVel[i * 3] = (Math.random() - .5) * fuerza + dx; sVel[i * 3 + 1] = Math.random() * fuerza; sVel[i * 3 + 2] = (Math.random() - .5) * fuerza + dz;
    sVida[i] = 0.6 + Math.random() * 0.6;
  }
}
function simSangre(dt) {
  for (let i = 0; i < NS; i++) {
    if (sVida[i] <= 0) continue;
    sVida[i] -= dt;
    if (sVida[i] <= 0) { sPos[i * 3 + 1] = -999; continue; }
    sVel[i * 3 + 1] -= 14 * dt;
    sPos[i * 3] += sVel[i * 3] * dt; sPos[i * 3 + 1] += sVel[i * 3 + 1] * dt; sPos[i * 3 + 2] += sVel[i * 3 + 2] * dt;
  }
}

// ---------- Trazadoras (pool de líneas) ----------
const trazas = [];
for (let i = 0; i < 16; i++) {
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
  const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xffe0a0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  l.frustumCulled = false; l.visible = false; scene.add(l); trazas.push({ l, t: 0 });
}
let tIdx = 0;
function trazar(a, b) {
  const tr = trazas[tIdx = (tIdx + 1) % trazas.length], p = tr.l.geometry.attributes.position.array;
  p[0] = a.x; p[1] = a.y; p[2] = a.z; p[3] = b.x; p[4] = b.y; p[5] = b.z;
  tr.l.geometry.attributes.position.needsUpdate = true; tr.t = 0.06; tr.l.visible = true;
}

// ---------- Pickups (cajas de armas, balas y chivitos) ----------
const texGlow = { arma: brilloTex('rgba(255,180,60,1)'), balas: brilloTex('rgba(120,255,120,1)'), chivito: brilloTex('rgba(255,90,90,1)') };
function mallaPickup(tipo) {
  const g = new THREE.Group();
  if (tipo === 'chivito') { // pan, carne, huevo: un chivito como la gente
    const pan = new THREE.MeshStandardMaterial({ color: 0xd9a050 });
    const a = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.32), pan); a.position.y = 0.05; g.add(a);
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.06, 0.3), new THREE.MeshStandardMaterial({ color: 0x6a3018 })); c.position.y = 0.13; g.add(c);
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 0.2), new THREE.MeshStandardMaterial({ color: 0xfff6e0, emissive: 0x332200 })); h.position.y = 0.17; g.add(h);
    const b = a.clone(); b.position.y = 0.23; g.add(b);
  } else {
    const m = new THREE.Mesh(new THREE.BoxGeometry(tipo === 'arma' ? 0.9 : 0.5, tipo === 'arma' ? 0.55 : 0.35, 0.5),
      new THREE.MeshStandardMaterial({ color: tipo === 'arma' ? 0x6b4a22 : 0x3a5a2a, emissive: tipo === 'arma' ? 0x2a1500 : 0x0a2000 }));
    m.position.y = tipo === 'arma' ? 0.28 : 0.18; g.add(m);
    const f = new THREE.Mesh(new THREE.BoxGeometry(tipo === 'arma' ? 0.92 : 0.52, 0.08, 0.52), new THREE.MeshStandardMaterial({ color: 0x222222 }));
    f.position.y = m.position.y; g.add(f);
  }
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texGlow[tipo], blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  s.position.y = 0.6; s.scale.setScalar(2.2); g.add(s);
  return g;
}
const pickups = [];
function soltarPickup(tipo, x, z, arma = null) {
  const g = mallaPickup(tipo);
  if (arma) { const m = crearModelos()[arma]; m.scale.setScalar(1.6); m.position.y = 1.1; m.rotation.z = ARMAS.find(a => a.id === arma).tipo === 'cuerpo' ? 0.4 : 0; g.add(m); g.userData.icono = m; }
  const l = local(x, z);
  g.position.set(x, piso(l.d), z); scene.add(g);
  pickups.push({ g, tipo, arma, t: arma ? 1e9 : 30 });
}

// ---------- Estado del juego ----------
const horda = new Horda(scene, 40);
const poolZ = []; for (let i = 0; i < 40; i++) poolZ.push(crearZombi());
let zombis = [];
const J = { pos: new THREE.Vector3(), yaw: 0, pitch: 0, vida: 100, velY: 0, bob: 0, mov: 0, golpeado: 0 };
let dios = false, estado = 'inicio', oleada = 0, puntos = 0, bajas = 0, porSalir = 0, spawnT = 0, descanso = 0, tiempo = 0;
let armaSel = 'pistola', desbloq = new Set(['pistola', 'termo']), cargador = {}, reserva = {};
let cdArma = 0, recargaT = 0, cambioT = 0, swingT = 0, swingHecho = true, disparando = false, gatillo = false;
let shake = 0, retroceso = 0, kick = 0, flashT = 0, hitT = 0, hitKill = false, vineta = 0, swayX = 0, swayY = 0, lookDX = 0, lookDY = 0;
const record = () => +localStorage.getItem('rz-record') || 0;
const A = id => ARMAS.find(a => a.id === id);
const LIM_I0 = NM / 2 - 70, LIM_I1 = NM / 2 + 70;

function reiniciar() {
  for (const z of zombis) poolZ.push(z); zombis = [];
  for (const p of pickups) scene.remove(p.g); pickups.length = 0;
  aMundo(NM / 2, 2, J.pos); J.pos.y = piso(2);
  J.yaw = 0; J.pitch = -0.03; J.vida = 100;
  oleada = 0; puntos = 0; bajas = 0; porSalir = 0; descanso = 2.5; tiempo = 0;
  desbloq = new Set(['pistola', 'termo']);
  for (const a of ARMAS) if (a.tipo === 'fuego') { cargador[a.id] = a.cargador; reserva[a.id] = a.reserva === Infinity ? Infinity : a.cargador * 2; }
  elegirArma('pistola', true); recargaT = 0; vineta = 0;
  mundo.setAlba(0); armarBarra(); hud();
}

// ---------- Armas ----------
function elegirArma(id, sinAnim) {
  if (!desbloq.has(id) || (id === armaSel && !sinAnim)) return;
  armaSel = id; recargaT = 0; swingT = 0; swingHecho = true;
  cambioT = sinAnim ? 0 : 0.3; cdArma = Math.max(cdArma, sinAnim ? 0 : 0.2);
  for (const a of ARMAS) modelos[a.id].visible = a.id === id;
  armarBarra(); hud();
}
function ciclarArma(dir) {
  const lista = ARMAS.filter(a => desbloq.has(a.id));
  const i = lista.findIndex(a => a.id === armaSel);
  elegirArma(lista[(i + dir + lista.length) % lista.length].id);
}
function recargar() {
  const a = A(armaSel);
  if (a.tipo !== 'fuego' || recargaT > 0 || cargador[a.id] >= a.cargador || reserva[a.id] <= 0) return;
  recargaT = a.recarga; sonido.recarga();
}

const _o = new THREE.Vector3(), _d = new THREE.Vector3(), _r = new THREE.Vector3(), _u = new THREE.Vector3(), _f = new THREE.Vector3(), _fin = new THREE.Vector3();
// rayo contra esferas de cabeza/torso/piernas de cada zombi
function rayo(o, d, alcance, out) {
  out.length = 0;
  for (const z of zombis) {
    if (!z.vivo) continue;
    const p = z.g.position, e = z.esc;
    let mejor = Infinity, cab = false;
    for (let k = 0; k < 3; k++) {
      if (k === 0 && z.sinCabeza) continue;
      const cy = p.y + (k === 0 ? 1.7 : k === 1 ? 1.15 : 0.5) * e, r = (k === 0 ? 0.24 : k === 1 ? 0.38 : 0.3) * e * (movil ? 1.15 : 1);
      const ox = p.x - o.x, oy = cy - o.y, oz = p.z - o.z;
      const tc = ox * d.x + oy * d.y + oz * d.z; if (tc < 0) continue;
      const d2 = ox * ox + oy * oy + oz * oz - tc * tc; if (d2 > r * r) continue;
      const t = tc - Math.sqrt(r * r - d2);
      if (t < mejor) { mejor = t; cab = k === 0; }
    }
    if (mejor < alcance) out.push({ z, t: mejor, cab });
  }
  out.sort((a, b) => a.t - b.t);
  return out;
}
const golpes = [], danoAcum = new Map(), _e = new THREE.Euler(0, 0, 0, 'YXZ'), _q = new THREE.Quaternion();
function ojoJugador(o, f, r, u) {
  o.set(J.pos.x, J.pos.y + 1.65, J.pos.z);
  _q.setFromEuler(_e.set(J.pitch + retroceso * 0.5, J.yaw, 0));
  f.set(0, 0, -1).applyQuaternion(_q); r.set(1, 0, 0).applyQuaternion(_q); u.set(0, 1, 0).applyQuaternion(_q);
}

function disparar() {
  const a = A(armaSel);
  if (cargador[a.id] <= 0) { if (reserva[a.id] > 0) recargar(); else { sonido.vacio(); aviso('¡Sin balas! Usá otra arma'); } cdArma = 0.25; return; }
  cargador[a.id]--; cdArma = a.cadencia;
  ojoJugador(_o, _f, _r, _u); // la bala sale antes de que el retroceso levante la mira
  sonido[a.sonido](); flashT = 0.05; kick = 1; retroceso += a.retroceso; shake = Math.max(shake, a.retroceso * 0.8);
  danoAcum.clear();
  const caño = modelos[a.id].userData.punta;
  for (let p = 0; p < a.perdigones; p++) {
    const ang = Math.random() * Math.PI * 2, rad = a.disp * Math.sqrt(Math.random()) * (J.mov > 0.5 ? 1.5 : 1);
    _d.copy(_f).addScaledVector(_r, Math.cos(ang) * rad).addScaledVector(_u, Math.sin(ang) * rad).normalize();
    rayo(_o, _d, a.alcance, golpes);
    let fin = a.alcance * 0.6;
    const n = Math.min(golpes.length, a.atraviesa || 1);
    for (let k = 0; k < n; k++) {
      const h = golpes[k], mult = h.cab ? (a.perdigones > 1 ? 1.4 : 2.3) : 1;
      const prev = danoAcum.get(h.z) || { d: 0, cab: false, t: h.t };
      prev.d += a.dano * mult; prev.cab = prev.cab || h.cab; danoAcum.set(h.z, prev);
      fin = h.t;
      _fin.copy(_o).addScaledVector(_d, h.t);
      salpicar(_fin.x, _fin.y, _fin.z, h.cab ? 10 : 5, 3, _d.x * 3, _d.z * 3);
    }
    if (p < 3) { _fin.copy(_o).addScaledVector(_d, fin); _u2.copy(_o).addScaledVector(_r, 0.15).addScaledVector(_u, -0.12).addScaledVector(_f, 0.5); trazar(_u2, _fin); }
  }
  danoAcum.forEach((v, z) => herir(z, v.d, v.cab, _f, a.empuje || (a.id === 'rifle' ? 2 : 0.6), false));
  if (cargador[a.id] === 0 && reserva[a.id] > 0) setTimeout(() => { if (armaSel === a.id) recargar(); }, 250);
}
const _u2 = new THREE.Vector3();

function golpear() { // cuerpo a cuerpo: arranca el swing, el impacto llega al 40%
  const a = A(armaSel);
  cdArma = a.cadencia; swingT = a.cadencia; swingHecho = false; sonido.swing();
}
function impactoMelee() {
  const a = A(armaSel);
  _f.set(-Math.sin(J.yaw), 0, -Math.cos(J.yaw));
  let alguno = false;
  for (const z of zombis) {
    if (!z.vivo) continue;
    const dx = z.g.position.x - J.pos.x, dz = z.g.position.z - J.pos.z, dist = Math.hypot(dx, dz);
    if (dist > a.alcance + 0.35 * z.esc) continue;
    if ((dx * _f.x + dz * _f.z) / (dist || 1) < Math.cos(a.arco + 0.25)) continue;
    _d.set(dx / (dist || 1), 0, dz / (dist || 1));
    herir(z, a.dano, J.pitch > 0.15 && a.id === 'machete', _d, a.empuje, true);
    salpicar(z.g.position.x, z.g.position.y + 1.3 * z.esc, z.g.position.z, 12, 4, _d.x * 3, _d.z * 3);
    alguno = true;
  }
  if (alguno) { sonido[a.sonido](); shake = Math.max(shake, 0.35); kick = 0.6; }
}

function herir(z, dano, cab, dir, empuje, melee) {
  z.vida -= dano; z.flash = 0.1; z.velMult = melee ? 0.1 : 0.45;
  const kbm = z.tipo === 'tanque' ? 0.35 : 1;
  z.kb.x += dir.x * empuje * kbm; z.kb.z += dir.z * empuje * kbm;
  hitT = 0.12; hitKill = false;
  if (!melee) cab ? sonido.cabeza() : sonido.carne();
  if (z.vida <= 0) matar(z, cab, dir, melee);
}
function matar(z, cab, dir, melee) {
  z.vivo = false; z.muerteT = 0; hitKill = true; hitT = 0.25;
  // cae para el lado del golpe
  const fx = Math.sin(z.g.rotation.y), fz = Math.cos(z.g.rotation.y);
  z.caida = (fx * dir.x + fz * dir.z) > 0 ? -1 : 1;
  let p = z.T.puntos, txt = '';
  if (cab) { p += 50; txt = '¡A la cabeza!'; if (Math.random() < 0.6 || z.tipo !== 'tanque') { z.sinCabeza = true; salpicar(z.g.position.x, z.g.position.y + 1.7 * z.esc, z.g.position.z, 30, 5); } }
  if (melee) { p += 25; txt = ['¡A lo bestia!', '¡Tomá!', '¡Ta loco!', '¡De una!'][Math.floor(Math.random() * 4)]; }
  if (z.tipo === 'tanque') txt = '¡Cayó el grandote!';
  puntos += p; bajas++; flotante('+' + p); if (txt) aviso(txt);
  const r = Math.random();
  if (r < 0.12) soltarPickup('balas', z.g.position.x, z.g.position.z);
  else if (r < (J.vida < 50 ? 0.22 : 0.17)) soltarPickup('chivito', z.g.position.x, z.g.position.z);
  hud();
}

// ---------- Oleadas ----------
function empezarOleada() {
  oleada++; porSalir = 6 + oleada * 4; spawnT = 0.5;
  mensaje('Oleada ' + oleada, oleada === 1 ? 'Del río y de la ciudad, atento' : 'Vienen más y más rápido');
  sonido.oleada(); hud();
}
function oleadaTerminada() {
  descanso = 8; puntos += oleada * 250;
  const nueva = DESBLOQUEOS.find(id => !desbloq.has(id));
  mensaje('¡Oleada ' + oleada + ' superada!', nueva ? 'Hay una caja con un arma nueva: ' + A(nueva).nombre : '+' + oleada * 250 + ' puntos');
  // caja delante del jugador
  _f.set(-Math.sin(J.yaw), 0, -Math.cos(J.yaw));
  let x = J.pos.x + _f.x * 5, z = J.pos.z + _f.z * 5;
  if (!posValida(x, z)) { x = J.pos.x; z = J.pos.z; const m = local(x, z); aMundo(m.i, Math.min(10, m.d + 4), _o); x = _o.x; z = _o.z; }
  soltarPickup('arma', x, z, nueva || null);
  if (!nueva) pickups[pickups.length - 1].tipo = 'balas';
  mundo.setAlba(Math.max(0, Math.min(1, (oleada - 4) / 7)));
  hud();
}
function elegirTipo() {
  const r = Math.random();
  if (oleada >= 3 && r < Math.min(0.14, 0.04 * (oleada - 2))) return 'tanque';
  if (oleada >= 2 && r < Math.min(0.45, 0.14 + 0.07 * (oleada - 2)) + 0.14) return 'corredor';
  return 'normal';
}
const _l = {};
function spawn() {
  const z = poolZ.pop(); if (!z) return false;
  prepararZombi(z, porSalir === 1 && oleada >= 3 && oleada % 2 === 1 ? 'tanque' : elegirTipo());
  const pl = local(J.pos.x, J.pos.z, _l);
  for (let intento = 0; intento < 10; intento++) {
    const r = Math.random(); let i, d;
    if (r < 0.45) { i = pl.i + (Math.random() - .5) * 60; d = -31 - Math.random() * 6; z.sube = true; }
    else if (r < 0.8) { i = pl.i + (Math.random() - .5) * 70; d = 23 + Math.random() * 7; }
    else { i = pl.i + (Math.random() < .5 ? -1 : 1) * (18 + Math.random() * 12); d = -8 + Math.random() * 19; }
    i = Math.max(LIM_I0 - 10, Math.min(LIM_I1 + 10, i));
    aMundo(i, d, _o);
    if (_o.distanceTo(J.pos) > 16 || intento === 9) {
      z.g.position.set(_o.x, z.sube ? -2.6 : piso(d), _o.z); if (!z.sube) z.sube = false; break;
    }
    z.sube = false;
  }
  if (z.g.position.y > -2) z.sube = false;
  z.vida *= 1 + (oleada - 1) * 0.06;
  zombis.push(z); porSalir--;
  return true;
}

// ---------- Jugador ----------
const colisiones = mundo.colisiones;
function posValida(x, z) {
  const l = local(x, z, _l);
  if (l.i < LIM_I0 || l.i > LIM_I1 || l.d < -10.4 || l.d > 20) return false;
  for (const c of colisiones) if ((c.x - x) ** 2 + (c.z - z) ** 2 < (c.r + 0.45) ** 2) return false;
  return true;
}
const teclas = {}, joy = { x: 0, y: 0 };
function moverJugador(dt) {
  let mx = joy.x, mz = -joy.y;
  if (teclas.KeyW || teclas.ArrowUp) mz += 1; if (teclas.KeyS || teclas.ArrowDown) mz -= 1;
  if (teclas.KeyD || teclas.ArrowRight) mx += 1; if (teclas.KeyA || teclas.ArrowLeft) mx -= 1;
  const len = Math.hypot(mx, mz); if (len > 1) { mx /= len; mz /= len; }
  const vel = (teclas.ShiftLeft || teclas.ShiftRight || len > 0.95 && movil ? 7.5 : 5.2);
  const sy = Math.sin(J.yaw), cy = Math.cos(J.yaw);
  const vx = (cy * mx - sy * mz) * vel, vz = (-sy * mx - cy * mz) * vel;
  const nx = J.pos.x + vx * dt, nz = J.pos.z + vz * dt;
  if (posValida(nx, nz)) { J.pos.x = nx; J.pos.z = nz; }
  else if (posValida(nx, J.pos.z)) J.pos.x = nx;
  else if (posValida(J.pos.x, nz)) J.pos.z = nz;
  J.mov = Math.min(1, Math.hypot(vx, vz) / 5.2);
  J.bob += dt * J.mov * 9;
  const l = local(J.pos.x, J.pos.z, _l);
  J.pos.y += (piso(l.d) - J.pos.y) * Math.min(1, dt * 12);
}

// ---------- Simulación (paso fijo: mismo ritmo a 60, 120 o 240 Hz) ----------
const PASO = 1 / 120;
function simular(dt) {
  tiempo += dt;
  simSangre(dt);
  for (const tr of trazas) if (tr.t > 0) { tr.t -= dt; tr.l.material.opacity = Math.max(0, tr.t / 0.06) * 0.8; if (tr.t <= 0) tr.l.visible = false; }
  for (let i = pickups.length - 1; i >= 0; i--) {
    const p = pickups[i]; p.t -= dt;
    p.g.rotation.y += dt * 1.5; if (p.g.userData.icono) p.g.userData.icono.position.y = 1.1 + Math.sin(tiempo * 3) * 0.1;
    p.g.visible = p.t > 5 || Math.sin(tiempo * 20) > 0;
    if (p.t <= 0) { scene.remove(p.g); pickups.splice(i, 1); continue; }
    if (estado === 'jugando' && (p.g.position.x - J.pos.x) ** 2 + (p.g.position.z - J.pos.z) ** 2 < 2.4 ** 2) { agarrar(p); scene.remove(p.g); pickups.splice(i, 1); }
  }
  // los zombis siguen moviéndose también en la pantalla de fin
  simZombis(dt);
  if (estado !== 'jugando') return;
  moverJugador(dt);
  // oleadas
  if (descanso > 0) { descanso -= dt; if (descanso <= 0) empezarOleada(); }
  else if (porSalir > 0) {
    spawnT -= dt;
    const vivos = zombis.reduce((n, z) => n + z.vivo, 0);
    if (spawnT <= 0 && vivos < CAL[AJ.calidad].maxZ) { spawn(); spawnT = Math.max(0.45, 2.0 - oleada * 0.15) * (0.6 + Math.random() * 0.8); }
  } else if (!zombis.some(z => z.vivo)) oleadaTerminada();
  // armas
  cdArma -= dt; cambioT = Math.max(0, cambioT - dt);
  if (recargaT > 0) {
    recargaT -= dt;
    if (recargaT <= 0) { const a = A(armaSel), n = Math.min(a.cargador - cargador[a.id], reserva[a.id]); cargador[a.id] += n; if (reserva[a.id] !== Infinity) reserva[a.id] -= n; hud(); }
  }
  if (swingT > 0) {
    swingT -= dt;
    const a = A(armaSel);
    if (!swingHecho && swingT < a.cadencia * 0.6) { swingHecho = true; impactoMelee(); }
  }
  const a = A(armaSel);
  if (disparando && cdArma <= 0 && cambioT <= 0 && recargaT <= 0) {
    if (a.tipo === 'fuego') disparar(); else golpear();
    gatillo = true; hud();
  }
  if (vineta > 0) vineta = Math.max(0, vineta - dt * 1.2);
  if (dios) J.vida = 100;
  if (J.vida <= 0) finDelJuego();
}

const _sep = new THREE.Vector3();
function simZombis(dt) {
  const ola = 1 + Math.min(0.6, (oleada - 1) * 0.07);
  for (let i = zombis.length - 1; i >= 0; i--) {
    const z = zombis[i], p = z.g.position;
    if (!z.vivo) {
      animarZombi(z, dt, 0);
      p.x += z.kb.x * dt; p.z += z.kb.z * dt; z.kb.multiplyScalar(Math.exp(-5 * dt));
      if (z.muerteT > 5) { zombis.splice(i, 1); poolZ.push(z); }
      continue;
    }
    const dx = J.pos.x - p.x, dz = J.pos.z - p.z, dist = Math.hypot(dx, dz) || 1;
    z.g.rotation.y = Math.atan2(dx, dz);
    z.velMult = Math.min(1, z.velMult + dt * 1.6);
    let v = z.T.vel * ola * z.velMult;
    if (estado !== 'jugando') v *= 0.4;
    const cerca = dist < z.T.alcance + 0.3;
    if (z.sube) { // sale del agua
      p.y += dt * 1.3; v *= 0.35;
      if (p.y >= -0.5) z.sube = false;
    }
    _sep.set(0, 0, 0);
    for (const o of zombis) {
      if (o === z || !o.vivo) continue;
      const ex = p.x - o.g.position.x, ez = p.z - o.g.position.z, e2 = ex * ex + ez * ez;
      const md = 0.7 * (z.esc + o.esc) * 0.5;
      if (e2 < md * md && e2 > 1e-6) { const e = Math.sqrt(e2); _sep.x += ex / e * (md - e); _sep.z += ez / e * (md - e); }
    }
    const mv = cerca ? 0 : v;
    p.x += (dx / dist * mv + z.kb.x + _sep.x * 4) * dt;
    p.z += (dz / dist * mv + z.kb.z + _sep.z * 4) * dt;
    z.kb.multiplyScalar(Math.exp(-4 * dt));
    for (const c of colisiones) {
      const cx = p.x - c.x, cz = p.z - c.z, c2 = cx * cx + cz * cz, rr = c.r + 0.3;
      if (c2 < rr * rr) { // empuja afuera y lo hace rodear el obstáculo hacia el jugador
        const c1 = Math.sqrt(c2) || 1, ux = cx / c1, uz = cz / c1;
        p.x = c.x + ux * rr; p.z = c.z + uz * rr;
        const sg = (-uz * dx + ux * dz) >= 0 ? 1 : -1;
        p.x += -uz * sg * Math.max(mv, 1) * dt; p.z += ux * sg * Math.max(mv, 1) * dt;
      }
    }
    if (!z.sube) { const l = local(p.x, p.z, _l); p.y += (piso(l.d) - p.y) * Math.min(1, dt * 5); }
    // ataque
    z.golpeT -= dt; if (z.ataque > 0) z.ataque -= dt;
    if (cerca && estado === 'jugando' && z.golpeT <= 0 && !z.sube) {
      z.golpeT = 1.1; z.ataque = 0.5;
      J.vida -= z.T.dano; vineta = 1; shake = Math.max(shake, 0.4); sonido.dolor();
      J.pos.x += dx / dist * 0.5; J.pos.z += dz / dist * 0.5;
      if (!posValida(J.pos.x, J.pos.z)) { J.pos.x -= dx / dist * 0.5; J.pos.z -= dz / dist * 0.5; }
      hud();
    }
    z.gemido -= dt;
    if (z.gemido <= 0) { z.gemido = 4 + Math.random() * 8; if (dist < 40) sonido.gemido(z.tipo === 'tanque' ? 0.6 : z.tipo === 'corredor' ? 1.4 : 1); }
    animarZombi(z, dt, cerca ? 0.3 : mv / 1.5);
  }
}

function agarrar(p) {
  sonido.agarrar();
  if (p.tipo === 'chivito') { J.vida = Math.min(100, J.vida + 35); aviso('¡Un chivito! +35 de vida'); }
  else if (p.tipo === 'balas') {
    for (const a of ARMAS) if (a.tipo === 'fuego' && desbloq.has(a.id) && a.reserva !== Infinity) reserva[a.id] = Math.min(a.reserva * 2, reserva[a.id] + a.cargador * 2);
    aviso('Balas para todas las armas');
  } else if (p.arma) {
    desbloq.add(p.arma); const a = A(p.arma);
    if (a.tipo === 'fuego') { cargador[a.id] = a.cargador; reserva[a.id] = a.reserva; }
    for (const b of ARMAS) if (b.tipo === 'fuego' && desbloq.has(b.id) && b.reserva !== Infinity) reserva[b.id] = Math.max(reserva[b.id], b.reserva);
    elegirArma(p.arma); aviso('¡Agarraste: ' + a.nombre + '!');
  }
  hud();
}

function finDelJuego() {
  estado = 'fin'; disparando = false; sonido.muerte();
  if (document.pointerLockElement) document.exitPointerLock();
  const nuevo = puntos > record(); if (nuevo) localStorage.setItem('rz-record', puntos);
  $('fin-txt').innerHTML = `Aguantaste hasta la oleada <b>${oleada}</b><br>${bajas} zombis liquidados · <b>${puntos}</b> puntos` +
    (nuevo ? '<br><span class="nuevo">¡Récord nuevo!</span>' : `<br>Récord: ${record()}`);
  setTimeout(() => { $('fin').classList.remove('oculto'); $('tactil').classList.add('oculto'); }, 1200);
}

// ---------- HUD ----------
function hud() {
  $('oleada').textContent = 'Oleada ' + Math.max(1, oleada);
  $('puntos').textContent = puntos;
  $('quedan').textContent = 'quedan ' + (porSalir + zombis.filter(z => z.vivo).length);
  $('vida-rel').style.width = Math.max(0, J.vida) + '%'; $('vida-txt').textContent = Math.max(0, Math.ceil(J.vida));
  const a = A(armaSel); $('arma-nombre').textContent = a.nombre;
  $('balas').textContent = a.tipo === 'fuego' ? `${cargador[a.id]} / ${reserva[a.id] === Infinity ? '∞' : reserva[a.id]}` : '—';
  $('balas').classList.toggle('poca', a.tipo === 'fuego' && cargador[a.id] <= Math.ceil(a.cargador / 4));
  document.querySelectorAll('#barra-armas div').forEach(d => d.classList.toggle('sel', d.dataset.id === armaSel));
}
function armarBarra() {
  const b = $('barra-armas'); b.innerHTML = '';
  ARMAS.forEach((a, i) => {
    if (!desbloq.has(a.id)) return;
    const d = document.createElement('div'); d.dataset.id = a.id;
    d.innerHTML = `<b>${i + 1}</b>${a.nombre.split(' ')[0]}`;
    d.addEventListener('pointerdown', e => { e.stopPropagation(); elegirArma(a.id); });
    b.appendChild(d);
  });
}
let mensajeT = 0, avisoT = 0;
function mensaje(t, sub = '') { $('mensaje').innerHTML = t + (sub ? `<small>${sub}</small>` : ''); $('mensaje').style.opacity = 1; mensajeT = 3; }
function aviso(t) { $('aviso').textContent = t; $('aviso').style.opacity = 1; avisoT = 1.6; }
const flotantes = [];
for (let i = 0; i < 6; i++) { const d = document.createElement('div'); d.className = 'flota'; $('hud').appendChild(d); flotantes.push({ d, t: 0 }); }
let fIdx = 0;
function flotante(t) { const f = flotantes[fIdx = (fIdx + 1) % 6]; f.d.textContent = t; f.t = 0.9; f.d.style.left = (50 + (Math.random() - .5) * 8) + '%'; }

// ---------- Entrada: PC ----------
const canvas = renderer.domElement;
addEventListener('keydown', e => {
  teclas[e.code] = true;
  if (estado !== 'jugando') return;
  if (e.code === 'KeyR') recargar();
  if (e.code === 'KeyQ') ciclarArma(1);
  if (e.code === 'Escape' || e.code === 'KeyP') pausar();
  const n = +e.key; if (n >= 1 && n <= 8) elegirArma(ARMAS[n - 1].id);
});
addEventListener('keyup', e => { teclas[e.code] = false; });
canvas.addEventListener('mousedown', e => {
  if (estado !== 'jugando' || movil) return;
  if (!document.pointerLockElement) pedirLock();
  if (e.button === 0) { disparando = true; gatillo = false; }
});
addEventListener('mouseup', e => { if (e.button === 0) disparando = false; });
addEventListener('mousemove', e => {
  if (!document.pointerLockElement || estado !== 'jugando') return;
  mirar(e.movementX * 0.0022, e.movementY * 0.0022);
});
addEventListener('wheel', e => { if (estado === 'jugando') ciclarArma(e.deltaY > 0 ? 1 : -1); }, { passive: true });
function mirar(dx, dy) {
  dx *= AJ.sens; dy *= AJ.sens;
  J.yaw -= dx; J.pitch = Math.max(-1.35, Math.min(1.35, J.pitch - dy)); lookDX += dx; lookDY += dy;
}
let teniaLock = false;
function pedirLock() { try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => { }); } catch (e) { } }
document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement) teniaLock = true;
  else if (teniaLock && estado === 'jugando') pausar();
});

// ---------- Entrada: celular ----------
let joyId = null, joyX0 = 0, joyY0 = 0, mirarId = null, mx0 = 0, my0 = 0;
const base = $('joy-base'), palo = $('joy-palo');
function tocar(e) {
  if (estado !== 'jugando') return;
  for (const t of e.changedTouches) {
    const el = t.target;
    if (el.id === 'b-fuego') { disparando = true; gatillo = false; $('b-fuego').classList.add('on'); if (mirarId === null) { mirarId = t.identifier; mx0 = t.clientX; my0 = t.clientY; } continue; }
    if (el.closest && el.closest('button, #barra-armas')) continue;
    if (t.clientX < innerWidth * 0.45 && joyId === null) {
      joyId = t.identifier; joyX0 = t.clientX; joyY0 = t.clientY;
      base.style.left = (t.clientX - 60) + 'px'; base.style.top = (t.clientY - 60) + 'px'; base.style.bottom = 'auto';
    } else if (mirarId === null) { mirarId = t.identifier; mx0 = t.clientX; my0 = t.clientY; }
  }
  e.preventDefault();
}
function arrastrar(e) {
  for (const t of e.changedTouches) {
    if (t.identifier === joyId) {
      let dx = t.clientX - joyX0, dy = t.clientY - joyY0; const l = Math.hypot(dx, dy), m = 50;
      if (l > m) { dx *= m / l; dy *= m / l; }
      joy.x = dx / m; joy.y = dy / m; palo.style.transform = `translate(${dx}px,${dy}px)`;
    } else if (t.identifier === mirarId) {
      mirar((t.clientX - mx0) * 0.0055, (t.clientY - my0) * 0.0055); mx0 = t.clientX; my0 = t.clientY;
    }
  }
  e.preventDefault();
}
function soltar(e) {
  for (const t of e.changedTouches) {
    if (t.identifier === joyId) { joyId = null; joy.x = joy.y = 0; palo.style.transform = ''; }
    if (t.identifier === mirarId) mirarId = null;
    if (t.target.id === 'b-fuego') { disparando = false; $('b-fuego').classList.remove('on'); }
  }
}
addEventListener('touchstart', tocar, { passive: false });
addEventListener('touchmove', arrastrar, { passive: false });
addEventListener('touchend', soltar); addEventListener('touchcancel', soltar);
const tap = (id, fn) => $(id).addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); fn(); tocar(e); }, { passive: false });
tap('b-recarga', () => recargar());
tap('b-cambiar', () => ciclarArma(1));
$('b-pausa').addEventListener('click', () => pausar());

// ---------- Pantallas ----------
function jugar() {
  iniciarAudio(); setVolumen();
  reiniciar(); estado = 'jugando';
  ['inicio', 'fin', 'pausa', 'ajustes'].forEach(id => $(id).classList.add('oculto'));
  $('hud').classList.remove('oculto'); if (movil) $('tactil').classList.remove('oculto');
  if (!movil) pedirLock();
  if (movil && document.documentElement.requestFullscreen && !document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => { });
}
function pausar() {
  if (estado !== 'jugando') return;
  estado = 'pausa'; disparando = false; $('pausa').classList.remove('oculto');
  if (document.pointerLockElement) document.exitPointerLock();
}
function seguir() { estado = 'jugando'; $('pausa').classList.add('oculto'); $('ajustes').classList.add('oculto'); if (!movil) pedirLock(); }
$('b-jugar').onclick = jugar; $('b-otra').onclick = jugar; $('b-seguir').onclick = seguir;
$('b-salir').onclick = () => { estado = 'inicio'; $('pausa').classList.add('oculto'); $('hud').classList.add('oculto'); $('tactil').classList.add('oculto'); $('inicio').classList.remove('oculto'); mostrarRecord(); };
function mostrarRecord() { $('record').textContent = record() ? 'Tu récord: ' + record() + ' puntos' : ''; }
mostrarRecord();

// ajustes
let ajustesDesde = 'inicio';
function abrirAjustes(desde) { ajustesDesde = desde; $(desde).classList.add('oculto'); $('ajustes').classList.remove('oculto'); }
$('b-ajustes').onclick = () => abrirAjustes('inicio'); $('b-ajustes2').onclick = () => abrirAjustes('pausa');
$('b-cerrar-aj').onclick = () => { $('ajustes').classList.add('oculto'); $(ajustesDesde).classList.remove('oculto'); };
function setVolumen() { volumen(AJ.volumen); }
function pintarAjustes() {
  document.querySelectorAll('[data-fps]').forEach(b => b.classList.toggle('sel', +b.dataset.fps === AJ.fps));
  document.querySelectorAll('[data-cal]').forEach(b => b.classList.toggle('sel', b.dataset.cal === AJ.calidad));
  $('aj-sens').value = AJ.sens; $('aj-sens-v').textContent = (+AJ.sens).toFixed(2);
  $('aj-vol').value = AJ.volumen; $('aj-fps').checked = AJ.contador; $('contador').classList.toggle('oculto', !AJ.contador);
}
document.querySelectorAll('[data-fps]').forEach(b => b.onclick = () => { AJ.fps = +b.dataset.fps; guardarAjustes(); pintarAjustes(); });
document.querySelectorAll('[data-cal]').forEach(b => b.onclick = () => { AJ.calidad = b.dataset.cal; guardarAjustes(); aplicarCalidad(); pintarAjustes(); });
$('aj-sens').oninput = e => { AJ.sens = +e.target.value; guardarAjustes(); pintarAjustes(); };
$('aj-vol').oninput = e => { AJ.volumen = +e.target.value; guardarAjustes(); setVolumen(); };
$('aj-fps').onchange = e => { AJ.contador = e.target.checked; guardarAjustes(); pintarAjustes(); };
pintarAjustes();

// ---------- Arma en primera persona: bob, sway, retroceso, swing ----------
const BASE_F = new THREE.Vector3(0.19, -0.17, -0.52), BASE_M = new THREE.Vector3(0.3, -0.42, -0.62);
function animarArma(dt) {
  const a = A(armaSel), m = modelos[a.id];
  const k = Math.min(1, aspecto / 1.3) * 0.55 + 0.45; // en vertical, el arma más al centro
  const b = a.tipo === 'fuego' ? BASE_F : BASE_M;
  swayX += (-lookDX * 0.9 - swayX) * Math.min(1, dt * 10); swayY += (lookDY * 0.9 - swayY) * Math.min(1, dt * 10);
  swayX = Math.max(-0.08, Math.min(0.08, swayX)); swayY = Math.max(-0.06, Math.min(0.06, swayY));
  lookDX = 0; lookDY = 0;
  const bobX = Math.cos(J.bob) * 0.012 * J.mov, bobY = -Math.abs(Math.sin(J.bob)) * 0.016 * J.mov + Math.sin(tiempo * 1.6) * 0.003;
  kick *= Math.exp(-dt * 14);
  let px = b.x * k + bobX + swayX, py = b.y + bobY + swayY, pz = b.z, rx = 0, ry = 0, rz = 0;
  if (a.tipo === 'fuego') {
    pz += kick * 0.07; rx += kick * (a.retroceso * 1.6 + 0.08); py += kick * 0.015;
    if (recargaT > 0) { const p = 1 - recargaT / a.recarga, s = Math.sin(p * Math.PI); rx -= s * 0.7; ry += s * 0.3; py -= s * 0.12; }
    const bomba = m.getObjectByName('bomba');
    if (bomba) { const p = 1 - Math.max(0, cdArma) / a.cadencia; bomba.position.z = -0.36 + (p > 0.35 && p < 0.75 ? Math.sin((p - 0.35) / 0.4 * Math.PI) * 0.1 : 0); }
    m.userData.flash.visible = flashT > 0; m.userData.flash.material.rotation = Math.random() * 6;
  } else {
    rx = -0.45; rz = 0.35;
    if (swingT > 0) {
      const p = 1 - swingT / a.cadencia; // 0..1
      let s;
      if (p < 0.3) { s = p / 0.3; rz = 0.35 - s * 0.95; rx = -0.45 + s * 0.25; px += s * 0.08; py += s * 0.06; }         // carga
      else if (p < 0.5) { s = (p - 0.3) / 0.2; rz = -0.6 + s * 2.1; rx = -0.2 - s * 1.2; px += 0.08 - s * 0.42; py += 0.06 - s * 0.16; } // golpe
      else { s = (p - 0.5) / 0.5; const e = 1 - (1 - s) * (1 - s); rz = 1.5 - e * 1.15; rx = -1.4 + e * 0.95; px += -0.34 * (1 - e); py += -0.1 * (1 - e); }
    }
    pz -= kick * 0.05;
  }
  if (cambioT > 0) { const s = Math.sin(cambioT / 0.3 * Math.PI); py -= s * 0.35; rx -= s * 0.6; }
  const vert = aspecto < 0.8; soporte.scale.setScalar(vert ? 0.62 : 0.8);
  soporte.position.set(px, py - (vert ? 0.03 : 0), pz); soporte.rotation.set(rx, ry, rz);
  vmFlashLuz.intensity = flashT > 0 ? 6 : 0;
}

// ---------- Bucle principal con limitador de FPS ----------
let acum = 0, ultimo = performance.now(), ultimoCuadro = 0;
const medidas = { cuadros: 0, msCPU: 0, t0: performance.now(), fps: 0, ms: 0 };
const cont = $('contador');
function bucle(ahora) {
  requestAnimationFrame(bucle);
  if (AJ.fps > 0) {
    const intervalo = 1000 / AJ.fps;
    if (ahora - ultimoCuadro < intervalo - 1) return;
    ultimoCuadro = ahora - ((ahora - ultimoCuadro) % intervalo > 4 ? 0 : (ahora - ultimoCuadro) % intervalo);
  }
  const c0 = performance.now();
  let dt = Math.min(0.25, (ahora - ultimo) / 1000); ultimo = ahora;
  if (estado === 'jugando' || estado === 'fin' || estado === 'inicio') {
    acum += dt; let pasos = 0;
    while (acum >= PASO && pasos < 30) { simular(PASO); acum -= PASO; pasos++; }
    if (pasos === 30) acum = 0;
  }
  if (estado === 'inicio') { J.yaw = Math.sin(performance.now() / 9000) * 0.6; J.pitch = 0.05; } // cámara paseando en el menú
  // timers visuales
  flashT -= dt; hitT -= dt; shake *= Math.exp(-dt * 7); retroceso *= Math.exp(-dt * 9);
  mensajeT -= dt; if (mensajeT < 0) $('mensaje').style.opacity = 0;
  avisoT -= dt; if (avisoT < 0) $('aviso').style.opacity = 0;
  for (const f of flotantes) { if (f.t > 0) { f.t -= dt; f.d.style.opacity = Math.min(1, f.t * 2); f.d.style.transform = `translate(-50%, ${-60 - (0.9 - f.t) * 70}px)`; } else f.d.style.opacity = 0; }
  $('hitmark').style.opacity = hitT > 0 ? 1 : 0; $('hitmark').style.color = hitKill ? '#ff2a1a' : '#fff';
  $('hitmark').style.transform = `translate(-50%,-52%) scale(${hitKill ? 1.5 : 1})`;
  $('vineta').style.opacity = Math.max(vineta, J.vida < 30 && estado === 'jugando' ? 0.35 + Math.sin(tiempo * 5) * 0.15 : 0);
  $('recargando').style.opacity = recargaT > 0 ? 1 : 0;
  $('mira').style.transform = `scale(${1 + retroceso * 4 + J.mov * 0.3})`;
  // cámara
  camera.position.set(J.pos.x, J.pos.y + 1.65 + Math.sin(J.bob * 2) * 0.03 * J.mov, J.pos.z);
  camera.rotation.set(J.pitch + retroceso * 0.5 + (Math.random() - .5) * shake * 0.05, J.yaw + (Math.random() - .5) * shake * 0.05, (Math.random() - .5) * shake * 0.03);
  luzJugador.intensity = flashT > 0 ? 40 : 4;
  horda.dibujar(zombis);
  gSangre.attributes.position.needsUpdate = true;
  animarArma(dt);
  mundo.update(performance.now() / 1000, dt, renderer);
  renderer.clear();
  renderer.render(scene, camera);
  const info = renderer.info.render, calls = info.calls, tris = info.triangles;
  renderer.clearDepth();
  if (estado === 'jugando' || estado === 'pausa') renderer.render(vmScene, vmCam);
  medidas.ultCalls = calls + renderer.info.render.calls; medidas.ultTris = tris + renderer.info.render.triangles;
  medidas.cuadros++; medidas.msCPU += performance.now() - c0;
  if (ahora - medidas.t0 > 500) {
    medidas.fps = medidas.cuadros * 1000 / (ahora - medidas.t0); medidas.ms = medidas.msCPU / medidas.cuadros;
    if (AJ.contador) cont.textContent = `${medidas.fps.toFixed(0)} fps · ${medidas.ms.toFixed(1)} ms CPU · ${medidas.ultCalls} draws`;
    medidas.cuadros = 0; medidas.msCPU = 0; medidas.t0 = ahora;
  }
}
renderer.info.autoReset = true;
reiniciar(); estado = 'inicio';
$('cargando').classList.add('oculto');
requestAnimationFrame(bucle);

// ganchos para las pruebas automáticas
window.__rz = {
  get estado() { return estado; }, get oleada() { return oleada; }, get puntos() { return puntos; }, get bajas() { return bajas; },
  get vida() { return J.vida; }, set vida(v) { J.vida = v; }, set dios(v) { dios = v; }, get arma() { return armaSel; }, get desbloq() { return [...desbloq]; },
  get vivos() { return zombis.filter(z => z.vivo).length; }, get porSalir() { return porSalir; }, get descanso() { return descanso; },
  get medidas() { return { ...medidas }; }, get pickups() { return pickups.map(p => p.tipo + ':' + p.arma); }, J, AJ,
  zombis: () => zombis.filter(z => z.vivo).map(z => ({ sube: z.sube, vm: z.velMult, tipo: z.tipo, vida: z.vida, x: z.g.position.x, y: z.g.position.y, z: z.g.position.z, d: Math.hypot(z.g.position.x - J.pos.x, z.g.position.z - J.pos.z) })),
  apuntar(i = 0, cabeza = false) { // mira al zombi vivo más cercano (o al traído con traerZombi si i === 'traido')
    const v = i === 'traido' ? window.__rzZ : zombis.filter(z => z.vivo && !z.sube).sort((a, b) => a.g.position.distanceTo(J.pos) - b.g.position.distanceTo(J.pos))[i];
    if (!v) return false;
    const dx = v.g.position.x - J.pos.x, dz = v.g.position.z - J.pos.z, dy = v.g.position.y + (cabeza ? 1.7 : 1.15) * v.esc - (J.pos.y + 1.65);
    J.yaw = Math.atan2(-dx, -dz); J.pitch = Math.atan2(dy, Math.hypot(dx, dz)); return true;
  },
  traerZombi(dist = 2) { const v = zombis.find(z => z.vivo); if (!v) return false; _f.set(-Math.sin(J.yaw), 0, -Math.cos(J.yaw)); v.g.position.set(J.pos.x + _f.x * dist, J.pos.y, J.pos.z + _f.z * dist); v.sube = false; window.__rzZ = v; return { x: v.g.position.x, z: v.g.position.z, vida: v.vida }; },
  zombiPos() { const v = window.__rzZ; return v && { x: v.g.position.x, z: v.g.position.z, vida: v.vida, vivo: v.vivo }; },
  elegir: id => elegirArma(id), desbloquear: id => { desbloq.add(id); armarBarra(); },
  set fuego(v) { disparando = v; gatillo = false; }, recargar, ciclarArma, pausar, seguir,
  rayoPrueba() { ojoJugador(_o, _f, _r, _u); return rayo(_o, _f, 200, []).map(h => ({ t: h.t, cab: h.cab, yo: h.z === window.__rzZ })); },
  get retroceso() { return retroceso; },
  bench(n = 600) { // costo de CPU: simulación (paso fijo) + preparar el cuadro, sin el render de la GPU
    const t0 = performance.now(); for (let i = 0; i < n; i++) simular(PASO); const t1 = performance.now();
    for (let i = 0; i < 100; i++) { horda.dibujar(zombis); animarArma(1 / 120); mundo.update(i / 120, 1 / 120, renderer); } const t2 = performance.now();
    return { msPorPaso: (t1 - t0) / n, msPrepCuadro: (t2 - t1) / 100, zombis: zombis.length };
  },
  despejar() { for (const z of zombis) if (z !== window.__rzZ && z.vivo) { z.g.position.x += 60; } },
  irAPickup() { const p = pickups[0]; if (!p) return false; J.pos.x = p.g.position.x; J.pos.z = p.g.position.z; return true; }
};
