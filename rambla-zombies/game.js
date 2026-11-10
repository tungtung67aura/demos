// Zombis en la Rambla — juego principal
import * as THREE from 'https://esm.sh/three@0.160.0';
import { crearMundo, local, aMundo, piso, NM, brilloTex } from './world.js';
import { ARMAS, crearModelos } from './armas.js';
import { Horda, crearZombi, prepararZombi, animarZombi, TIPOS } from './zombis.js';
import { iniciarAudio, sonido, volumen, musica } from './audio.js';
import { crearEfectos } from './efectos.js';
import { OLEADAS_TOTAL, mezcla, cantidad, JEFES, MEJORAS, precioMejora, EQUIPO, VENTAJAS, PESOS, LOGROS, cargarPerfil, guardarPerfil } from './datos.js';

const $ = id => document.getElementById(id);
const movil = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
if (movil) document.body.classList.add('es-movil');

// ---------- Ajustes ----------
const AJ = Object.assign({ fps: 0, calidad: movil ? 'media' : 'alta', sens: 1, contador: false, volumen: 0.7, musica: 0.5, invertir: false,
  asistencia: true, autoFuego: false, vibrar: true, botones: 1, modo: 'normal' }, JSON.parse(localStorage.getItem('rz-ajustes') || '{}'));
const CAL = {
  baja: { pr: 1, maxZ: 12, sangre: 160, olasLivianas: true },
  media: { pr: 1.5, maxZ: 16, sangre: 260, olasLivianas: true },
  alta: { pr: 2, maxZ: 22, sangre: 420, olasLivianas: false }
};
const guardarAjustes = () => { try { localStorage.setItem('rz-ajustes', JSON.stringify(AJ)); } catch (e) { } };
const perfil = cargarPerfil();
const vibrar = ms => { if (AJ.vibrar && navigator.vibrate) try { navigator.vibrate(ms); } catch (e) { } };

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
mundo.alSonarFuegos = () => { if (estado !== 'inicio') sonido.fuegoArtificial(); };
const ef = crearEfectos(scene);
const luzJugador = new THREE.PointLight(0xffd8a8, 3.5, 16, 1.5); camera.add(luzJugador); // linterna tenue + fogonazo

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
  redimensionar(true);
}
// Tamaño de la vista: el CSS manda (canvas fijo a 100vw x 100dvh) y el buffer se ajusta a lo que mide el canvas.
// En iOS el 'resize' al girar el celular llega a veces con innerWidth viejo, así que se re-mide varias veces
// y además se chequea en cada cuadro (leer clientWidth es barato).
let aspecto = 1, vistaW = 0, vistaH = 0;
const lienzo = renderer.domElement;
function medida() {
  const w = lienzo.clientWidth || innerWidth, h = lienzo.clientHeight || innerHeight;
  return [Math.max(1, Math.round(w)), Math.max(1, Math.round(h))];
}
function redimensionar(forzar) {
  const [w, h] = medida();
  if (!forzar && w === vistaW && h === vistaH) return;
  vistaW = w; vistaH = h; aspecto = w / h;
  renderer.setSize(w, h, false); // false: no tocar el CSS del canvas
  // campo visual horizontal ~90°, también en vertical (celular parado)
  camera.fov = Math.min(95, THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(45)) / aspecto)));
  camera.fov = Math.max(camera.fov, 62);
  camera.aspect = aspecto; camera.updateProjectionMatrix();
  vmCam.aspect = aspecto; vmCam.updateProjectionMatrix();
  document.body.classList.toggle('apaisado', w > h && h < 560);
  revisarGiro();
}
function remedirLuego() {
  requestAnimationFrame(() => redimensionar());
  setTimeout(() => redimensionar(), 120);
  setTimeout(() => redimensionar(), 350);
  setTimeout(() => redimensionar(), 800);
}
addEventListener('resize', remedirLuego);
addEventListener('orientationchange', remedirLuego);
if (window.visualViewport) visualViewport.addEventListener('resize', remedirLuego);
if (window.ResizeObserver) new ResizeObserver(() => redimensionar()).observe(lienzo);

// ---------- Sangre (partículas en un solo Points) ----------
function gota() { const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.beginPath(); x.arc(16, 16, 14, 0, 7); x.fill(); return new THREE.CanvasTexture(c); }
const NS = CAL.alta.sangre;
const sPos = new Float32Array(NS * 3).fill(-999), sVel = new Float32Array(NS * 3), sVida = new Float32Array(NS);
const gSangre = new THREE.BufferGeometry(); gSangre.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
gSangre.attributes.position.setUsage(THREE.DynamicDrawUsage);
const sangre = new THREE.Points(gSangre, new THREE.PointsMaterial({ color: 0x8a0606, size: 0.06, sizeAttenuation: true, map: gota(), transparent: true, alphaTest: 0.3, depthWrite: false }));
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

// ---------- Pickups (balas y chivitos que sueltan los zombis) — pool fijo, sin crear mallas en juego ----------
const texGlow = { balas: brilloTex('rgba(120,255,120,1)'), chivito: brilloTex('rgba(255,90,90,1)') };
function mallaPickup(tipo) {
  const g = new THREE.Group();
  if (tipo === 'chivito') { // pan, carne, huevo: un chivito como la gente
    const pan = new THREE.MeshStandardMaterial({ color: 0xd9a050 });
    const a = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.32), pan); a.position.y = 0.05; g.add(a);
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.06, 0.3), new THREE.MeshStandardMaterial({ color: 0x6a3018 })); c.position.y = 0.13; g.add(c);
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 0.2), new THREE.MeshStandardMaterial({ color: 0xfff6e0, emissive: 0x332200 })); h.position.y = 0.17; g.add(h);
    const b = a.clone(); b.position.y = 0.23; g.add(b);
  } else {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.5), new THREE.MeshStandardMaterial({ color: 0x3a5a2a, emissive: 0x0a2000 }));
    m.position.y = 0.18; g.add(m);
    const f = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.08, 0.52), new THREE.MeshStandardMaterial({ color: 0x222222 })); f.position.y = 0.18; g.add(f);
  }
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: texGlow[tipo], blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  s.position.y = 0.6; s.scale.setScalar(2.2); g.add(s);
  g.visible = false; scene.add(g);
  return g;
}
const poolPick = [];
for (let i = 0; i < 6; i++) { poolPick.push({ g: mallaPickup('balas'), tipo: 'balas', t: 0 }); poolPick.push({ g: mallaPickup('chivito'), tipo: 'chivito', t: 0 }); }
function soltarPickup(tipo, x, z) {
  const p = poolPick.find(p => p.t <= 0 && p.tipo === tipo); if (!p) return;
  const l = local(x, z);
  p.g.position.set(x, piso(l.d), z); p.g.visible = true; p.t = 25;
}

// ---------- Estado del juego ----------
const MAXZ = 40;
const horda = new Horda(scene, MAXZ);
const poolZ = []; for (let i = 0; i < MAXZ; i++) poolZ.push(crearZombi());
let zombis = [];
const J = { pos: new THREE.Vector3(), yaw: 0, pitch: 0, vida: 100, vidaMax: 100, blindaje: 0, velY: 0, bob: 0, mov: 0, lento: 0 };
let dios = false, estado = 'inicio', oleada = 0, puntos = 0, pesos = 0, bajas = 0, porSalir = 0, spawnT = 0, descanso = 0, tiempo = 0;
let armaSel = 'pistola', tiene = new Set(), cargador = {}, reserva = {}, niveles = {}, ventajas = new Set();
let cdArma = 0, recargaT = 0, recargaTotal = 1, cambioT = 0, swingT = 0, swingHecho = true, disparando = false, autoDisparo = false;
let shake = 0, retroceso = 0, kick = 0, flashT = 0, hitT = 0, hitTipo = '', vineta = 0, flashDano = 0, swayX = 0, swayY = 0, lookDX = 0, lookDY = 0;
let jefe = null, jefePendiente = null, jefeT = 0, comboN = 0, comboT = 0, finT = 0, tiendaT = 0;
let S = {}; // estadísticas de la partida
const A = id => ARMAS.find(a => a.id === id);
const LIM_I0 = NM / 2 - 70, LIM_I1 = NM / 2 + 70;
const MODO = () => AJ.modo === 'pesadilla' ? { vida: 1.5, dano: 1.4, pesos: 1.25 } : { vida: 1, dano: 1, pesos: 1 };

// stats de arma con mejoras y ventajas
const nv = (id, k) => (niveles[id] && niveles[id][k]) || 0;
const danoDe = a => a.dano * (1 + 0.2 * nv(a.id, 'dano')) * (a.tipo === 'cuerpo' && ventajas.has('garra') ? 1.35 : 1);
const cargMax = a => Math.round(a.cargador * (1 + 0.3 * nv(a.id, 'cargador')));
const resMax = a => a.reserva === Infinity ? Infinity : Math.round(a.reserva * (1 + 0.3 * nv(a.id, 'cargador')));
const tRecarga = a => a.recarga * (1 - 0.2 * nv(a.id, 'recarga')) * (ventajas.has('manos') ? 0.7 : 1);
const cadenciaDe = a => a.cadencia / (1 + 0.15 * nv(a.id, 'cadencia'));
const empujeDe = a => (a.empuje || 0) * (a.tipo === 'cuerpo' && ventajas.has('garra') ? 1.35 : 1);

function reiniciar() {
  camVictoria = false;
  for (const z of zombis) poolZ.push(z); zombis = [];
  for (const p of poolPick) { p.t = 0; p.g.visible = false; }
  ef.limpiar(); sVida.fill(0); sPos.fill(-999);
  aMundo(NM / 2, 2, J.pos); J.pos.y = piso(2);
  J.yaw = 0; J.pitch = -0.03; J.vidaMax = 100; J.vida = 100; J.blindaje = 0; J.lento = 0;
  oleada = 0; puntos = 0; pesos = 0; bajas = 0; porSalir = 0; descanso = 2.5; tiempo = 0; jefe = null; jefePendiente = null; tiendaT = 0; comboN = 0; comboT = 0;
  tiene = new Set(['pistola', 'termo']); niveles = {}; ventajas = new Set();
  for (const a of ARMAS) if (a.tipo === 'fuego') { cargador[a.id] = cargMax(a); reserva[a.id] = a.reserva === Infinity ? Infinity : a.cargador * 2; }
  S = { disparos: 0, aciertos: 0, cabezas: 0, recibido: 0, gastado: 0, porArma: {}, olaSinDano: true, explosionMax: 0, inicio: performance.now(), jefes: 0, logrosNuevos: [] };
  elegirArma('pistola', true); recargaT = 0; vineta = 0;
  mundo.setAlba(0); armarBarra(); hud();
}

// ---------- Armas ----------
function elegirArma(id, sinAnim) {
  if (!tiene.has(id) || (id === armaSel && !sinAnim)) return;
  armaSel = id; recargaT = 0; swingT = 0; swingHecho = true;
  cambioT = sinAnim ? 0 : 0.3; cdArma = Math.max(cdArma, sinAnim ? 0 : 0.2);
  for (const a of ARMAS) modelos[a.id].visible = a.id === id;
  $('mira').className = A(id).tipo === 'fuego' ? 'fuego' : 'melee';
  if (!sinAnim) sonido.clic();
  hud();
}
function ciclarArma(dir) {
  const lista = ARMAS.filter(a => tiene.has(a.id));
  const i = lista.findIndex(a => a.id === armaSel);
  elegirArma(lista[(i + dir + lista.length) % lista.length].id);
}
function recargar() {
  const a = A(armaSel);
  if (a.tipo !== 'fuego' || recargaT > 0 || cargador[a.id] >= cargMax(a) || reserva[a.id] <= 0) return;
  recargaT = recargaTotal = tRecarga(a); sonido.recarga();
}

const _o = new THREE.Vector3(), _d = new THREE.Vector3(), _r = new THREE.Vector3(), _u = new THREE.Vector3(), _f = new THREE.Vector3(), _fin = new THREE.Vector3(), _u2 = new THREE.Vector3(), _p = new THREE.Vector3();
// rayo contra las esferas de cada zombi (cabeza / torso / piernas; el gateador las tiene acostadas)
function rayo(o, d, alcance, out, extra = 1) {
  out.length = 0;
  for (const z of zombis) {
    if (!z.vivo) continue;
    const p = z.g.position, e = z.esc, fx = Math.sin(z.g.rotation.y), fz = Math.cos(z.g.rotation.y), H = z.T.hit;
    let mejor = Infinity, cab = false;
    for (let k = 0; k < 3; k++) {
      if (k === 0 && z.sinCabeza) continue;
      const h = H[k], cy = p.y + h[0] * e, r = h[1] * e * extra * (movil ? 1.15 : 1);
      const ox = p.x + fx * h[2] * e - o.x, oy = cy - o.y, oz = p.z + fz * h[2] * e - o.z;
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
// rayo contra autos, contenedores, bancos (cilindros con techo): devuelve la distancia o Infinity
const choque = { t: Infinity, c: null }, _lr = {};
function rayoObstaculos(o, d, alcance) {
  choque.t = Infinity; choque.c = null;
  const a = d.x * d.x + d.z * d.z; if (a < 1e-8) return choque;
  for (const c of colisiones) {
    const ox = o.x - c.x, oz = o.z - c.z, b = ox * d.x + oz * d.z, cc = ox * ox + oz * oz - c.r * c.r;
    const disc = b * b - a * cc; if (disc < 0) continue;
    let t = (-b - Math.sqrt(disc)) / a; if (t < 0) { if (cc < 0) t = 0; else continue; }
    if (t > alcance || t >= choque.t) continue;
    if (o.y + d.y * t > c.top) continue;
    choque.t = t; choque.c = c;
  }
  // el piso y el muro también frenan (tiros hacia abajo): se marcha por el rayo comparando con la altura del terreno
  if (d.y < -0.005) {
    const tMax = Math.min(alcance, choque.t, (o.y + 1.2) / -d.y);
    for (let t = 0.5; t < tMax; t += 0.4) {
      const x = o.x + d.x * t, z = o.z + d.z * t;
      if (o.y + d.y * t < piso(local(x, z, _lr).d)) { choque.t = t; choque.c = null; break; }
    }
  }
  return choque;
}
const golpes = [], danoAcum = new Map(), _e = new THREE.Euler(0, 0, 0, 'YXZ'), _q = new THREE.Quaternion();
function ojoJugador(o, f, r, u) {
  o.set(J.pos.x, J.pos.y + 1.65, J.pos.z);
  _q.setFromEuler(_e.set(J.pitch + retroceso * 0.5, J.yaw, 0));
  f.set(0, 0, -1).applyQuaternion(_q); r.set(1, 0, 0).applyQuaternion(_q); u.set(0, 1, 0).applyQuaternion(_q);
}
const sumaArma = (id, k, n = 1) => { const s = S.porArma[id] || (S.porArma[id] = { bajas: 0 }); s[k] = (s[k] || 0) + n; };

function disparar() {
  const a = A(armaSel);
  if (cargador[a.id] <= 0) { if (reserva[a.id] > 0) recargar(); else { sonido.vacio(); aviso('¡Sin balas! Usá otra arma'); } cdArma = 0.25; return; }
  cargador[a.id]--; cdArma = cadenciaDe(a); S.disparos++;
  ojoJugador(_o, _f, _r, _u); // la bala sale antes de que el retroceso levante la mira
  sonido[a.sonido](); flashT = 0.05; kick = 1; retroceso += a.retroceso; shake = Math.max(shake, a.retroceso * 0.8);
  if (a.id === 'escopeta' || a.id === 'rifle') vibrar(25);
  danoAcum.clear();
  let acerto = false, rebotes = 0;
  for (let p = 0; p < a.perdigones; p++) {
    const ang = Math.random() * Math.PI * 2, rad = a.disp * Math.sqrt(Math.random()) * (J.mov > 0.5 ? 1.5 : 1);
    _d.copy(_f).addScaledVector(_r, Math.cos(ang) * rad).addScaledVector(_u, Math.sin(ang) * rad).normalize();
    rayo(_o, _d, a.alcance, golpes, movil && AJ.asistencia ? 1.2 : 1);
    const ob = rayoObstaculos(_o, _d, a.alcance);
    let fin = Math.min(a.alcance * 0.6, ob.t);
    const n = Math.min(golpes.length, a.atraviesa || 1);
    for (let k = 0; k < n; k++) {
      const h = golpes[k]; if (h.t > ob.t) break; // el auto se comió la bala
      const mult = h.cab ? (a.perdigones > 1 ? 1.4 : 2.3) * (ventajas.has('ojo') ? 1.5 : 1) : 1;
      const prev = danoAcum.get(h.z) || { d: 0, cab: false, t: h.t };
      prev.d += danoDe(a) * mult; prev.cab = prev.cab || h.cab; danoAcum.set(h.z, prev);
      fin = h.t; acerto = true;
      _fin.copy(_o).addScaledVector(_d, h.t);
      salpicar(_fin.x, _fin.y, _fin.z, h.cab ? 10 : 5, 3, _d.x * 3, _d.z * 3);
    }
    if (fin === ob.t && ob.t < a.alcance && (!golpes.length || golpes[0].t > ob.t)) { // chispazo contra el obstáculo
      _fin.copy(_o).addScaledVector(_d, ob.t);
      const c = ob.c; let nx = -_d.x, nz = -_d.z;
      if (c) { const l = Math.hypot(_fin.x - c.x, _fin.z - c.z) || 1; nx = (_fin.x - c.x) / l; nz = (_fin.z - c.z) / l; }
      if (p % 3 === 0) ef.impacto(_fin, nx, nz, c ? c.metal : false);
      if (c && c.metal) rebotes++;
    }
    if (p < 3) { _fin.copy(_o).addScaledVector(_d, fin); _u2.copy(_o).addScaledVector(_r, 0.15).addScaledVector(_u, -0.12).addScaledVector(_f, 0.5); trazar(_u2, _fin); }
  }
  if (rebotes) Math.random() < 0.5 ? sonido.rebote() : sonido.chapa();
  if (acerto) S.aciertos++;
  danoAcum.forEach((v, z) => herir(z, v.d, v.cab, _f, a.empuje || (a.id === 'rifle' ? 2 : 0.6), false, a.id));
  if (cargador[a.id] === 0 && reserva[a.id] > 0) setTimeout(() => { if (armaSel === a.id && estado === 'jugando') recargar(); }, 250);
}

function golpear() { // cuerpo a cuerpo: arranca el swing, el impacto llega al 40%
  const a = A(armaSel);
  cdArma = cadenciaDe(a); swingT = cdArma; swingHecho = false; sonido.swing();
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
    const cab = (J.pitch > 0.15 && a.id === 'machete') || (z.tipo === 'gateador' && a.id !== 'machete' && J.pitch < -0.3);
    herir(z, danoDe(a), cab, _d, empujeDe(a), true, a.id);
    salpicar(z.g.position.x, z.g.position.y + 1.3 * z.esc, z.g.position.z, 12, 4, _d.x * 3, _d.z * 3);
    alguno = true;
  }
  if (alguno) { sonido[a.sonido](); shake = Math.max(shake, 0.35); kick = 0.6; vibrar(30); S.aciertos++; }
  S.disparos++;
}

const _gv = new THREE.Vector3();
function cortarBrazo(z, j, dir) {
  if (z.sinBrazo[j]) return;
  z.sinBrazo[j] = true;
  z.manos[j].getWorldPosition(_p); z.hombros[j].getWorldPosition(_fin);
  _gv.set(dir.x * 4 + (Math.random() - .5) * 3, 3 + Math.random() * 2, dir.z * 4 + (Math.random() - .5) * 3);
  ef.gib(_fin.lerp(_p, 0.5), _gv, z.cPiel, false);
  salpicar(_fin.x, _fin.y, _fin.z, 14, 4);
}
function herir(z, dano, cab, dir, empuje, melee, arma) {
  if (!z.vivo) return;
  if (z.aturdido > 0 && z.tipo === 'patovica') dano *= 1.6; // golpeado contra un auto: punto débil
  z.vida -= dano; z.flash = 0.1;
  const jefeZ = z.T.jefe;
  z.velMult = jefeZ ? 0.8 : melee ? 0.1 : 0.45;
  z.flinch = Math.min(jefeZ ? 0.05 : 0.22, 0.05 + dano / z.vidaMax * 0.5);
  if (melee && !jefeZ && z.prep > 0 && empuje > 8) z.prep = 0; // un buen golpe interrumpe el ataque
  const kbm = jefeZ ? 0.05 : z.tipo === 'tanque' ? 0.35 : 1;
  z.kb.x += dir.x * empuje * kbm; z.kb.z += dir.z * empuje * kbm;
  hitT = 0.12; hitTipo = cab ? 'cab' : '';
  if (!melee) cab ? sonido.cabeza() : sonido.carne();
  // desmembrar: escopetazo, rifle o machete pueden arrancar un brazo
  if (!jefeZ && z.vida > 0 && (arma === 'machete' ? Math.random() < 0.4 : dano >= 60 && Math.random() < 0.35)) cortarBrazo(z, Math.random() < 0.5 ? 0 : 1, dir);
  if (jefeZ) { hudJefe(); }
  if (z.vida <= 0) matar(z, cab, dir, melee, arma);
}
function matar(z, cab, dir, melee, arma, porExplosion) {
  z.vivo = false; z.muerteT = 0; hitT = 0.25; hitTipo = 'mata';
  const fx = Math.sin(z.g.rotation.y), fz = Math.cos(z.g.rotation.y);
  z.caida = (fx * dir.x + fz * dir.z) > 0 ? -1 : 1;
  const T = z.T;
  let p = T.puntos, txt = '';
  if (cab && !T.jefe) {
    p += 50; txt = '¡A la cabeza!'; S.cabezas++;
    if (z.tipo !== 'tanque' || Math.random() < 0.6) {
      z.sinCabeza = true; z.cab.getWorldPosition(_p);
      ef.gib(_p, _gv.set(dir.x * 3 + (Math.random() - .5) * 2, 5, dir.z * 3 + (Math.random() - .5) * 2), z.cPiel, true);
      salpicar(_p.x, _p.y, _p.z, 30, 5);
    }
  }
  if (melee) { p += 25; txt = ['¡A lo bestia!', '¡Tomá!', '¡Ta loco!', '¡De una!', '¡Al horno!'][Math.floor(Math.random() * 5)]; }
  if (porExplosion) { cortarBrazo(z, 0, dir); cortarBrazo(z, 1, dir); }
  if (z.tipo === 'tanque') txt = '¡Cayó el grandote!';
  if (z.tipo === 'escupidor') ef.baba(_p.copy(z.g.position).setY(z.g.position.y + 1.4 * z.esc), 14);
  // combo: matar seguido multiplica
  comboN = comboT > 0 ? comboN + 1 : 1; comboT = 2.6;
  const mult = Math.min(5, 1 + Math.floor((comboN - 1) / 2));
  p *= mult;
  const plata = Math.round((PESOS[z.tipo] || 10) * MODO().pesos * (cab ? 1.5 : 1) * (melee ? 1.25 : 1));
  puntos += p; pesos += plata; bajas++; S.bajasRonda = (S.bajasRonda || 0) + 1;
  if (arma) sumaArma(arma, 'bajas');
  flotante('+' + p + (mult > 1 ? ' ×' + mult : ''));
  feed(`${T.nombre}${cab ? ' (cabeza)' : ''}`, '+$' + plata);
  if (txt && !T.jefe) aviso(txt);
  sonido.plata(); $('pesos').classList.remove('pulso'); void $('pesos').offsetWidth; $('pesos').classList.add('pulso');
  if (mult > 1) { $('combo').textContent = 'COMBO ×' + mult; $('combo').style.opacity = 1; }
  if (z.tipo === 'explosivo' && !z.explotado) explotar(z, true);
  if (T.jefe) jefeMuerto(z);
  else {
    const r = Math.random();
    if (r < 0.1) soltarPickup('balas', z.g.position.x, z.g.position.z);
    else if (r < (J.vida < 50 ? 0.17 : 0.13)) soltarPickup('chivito', z.g.position.x, z.g.position.z);
  }
  logro('primera');
  if (perfil.bajas + bajas >= 100) logro('cien');
  if (S.cabezas >= 25) logro('cabezas');
  if ((S.porArma.sarten?.bajas || 0) >= 15) logro('sarten');
  if ((S.porArma.termo?.bajas || 0) >= 10) logro('termo');
  hud();
}

// explosión: el zombi explosivo (cuando llega o cuando lo matan) daña a todos alrededor
function explotar(z, porJugador) {
  z.explotado = true; z.vivo = false; z.muerteT = 0; z.sinCabeza = true; z.sinBrazo[0] = z.sinBrazo[1] = true;
  const p = z.g.position, R = 4.2;
  ef.explosion(_p.copy(p), R * 1.4); sonido.explosion(); salpicar(p.x, p.y + 1, p.z, 40, 7);
  for (let k = 0; k < 2; k++) ef.gib(_fin.set(p.x, p.y + 1, p.z), _gv.set((Math.random() - .5) * 10, 6, (Math.random() - .5) * 10), z.cPiel, false);
  const dj = Math.hypot(J.pos.x - p.x, J.pos.z - p.z);
  shake = Math.max(shake, Math.max(0.3, 1.2 - dj / 12)); vibrar(dj < 8 ? 120 : 40);
  if (dj < R && estado === 'jugando') recibirDano(z.T.dano * (1 - dj / R * 0.6) * MODO().dano, p.x, p.z);
  let muertos = 0;
  for (const o of zombis) {
    if (!o.vivo || o === z) continue;
    const d = Math.hypot(o.g.position.x - p.x, o.g.position.z - p.z);
    if (d > R) continue;
    _d.set((o.g.position.x - p.x) / (d || 1), 0, (o.g.position.z - p.z) / (d || 1));
    const dano = 140 * (1 - d / R * 0.5);
    const iba = o.vivo;
    o.vida -= dano; o.flash = 0.15; o.kb.x += _d.x * 12; o.kb.z += _d.z * 12;
    if (o.T.jefe) hudJefe();
    if (iba && o.vida <= 0) { matar(o, false, _d, false, porJugador ? 'explosion' : null, true); muertos++; }
  }
  if (porJugador) { S.explosionMax = Math.max(S.explosionMax, muertos); if (muertos >= 3) logro('explosion'); }
}

// ---------- Oleadas ----------
function empezarOleada() {
  oleada++; porSalir = cantidad(oleada); spawnT = 0.5; S.olaSinDano = true; S.vidaInicioOla = J.vida;
  const j = JEFES[oleada];
  if (j) {
    mensaje(oleada === OLEADAS_TOTAL ? 'Última oleada' : 'Oleada ' + oleada, j === 'cerro' ? 'Bajó el Zombi del Cerro. Aguantá hasta que salga el sol' : 'Viene el Patovica del Cordón. Hacelo chocar contra un auto', true);
    jefePendiente = j; jefeT = 2.2;
    sonido.jefe();
  } else {
    const subs = ['Del río y de la ciudad, atento', 'Ahora corren. Ojo', 'Algunos se arrastran y otros escupen', 'Cuidado con los que titilan', 'Vienen más grandes', 'No aflojes', 'Ya casi aclara'];
    mensaje('Oleada ' + oleada, subs[Math.min(subs.length - 1, oleada - 1)] || '');
    sonido.oleada();
  }
  hud();
}
function oleadaTerminada() {
  const bonus = Math.round(oleada * 60 * MODO().pesos);
  pesos += bonus; puntos += oleada * 250;
  if (S.olaSinDano) { logro('perfecta'); pesos += 100; }
  if (oleada >= 5) logro('ola5');
  mundo.fuegos(3 + (oleada >= OLEADAS_TOTAL ? 5 : 0));
  if (oleada >= OLEADAS_TOTAL) { victoria(); return; }
  mensaje('¡Oleada ' + oleada + ' superada!', `+$${bonus} de premio${S.olaSinDano ? ' · +$100 por no recibir daño' : ''}`);
  // el cielo empieza a clarear de a poco
  mundo.setAlba(Math.max(0, Math.min(0.55, (oleada - 3) / 11)));
  descanso = 0; tiendaT = 2.4; sonido.oleada();
  hud();
}
function elegirTipo() {
  const m = mezcla(oleada); let total = 0;
  for (const k in m) total += m[k];
  let r = Math.random() * total;
  for (const k in m) { r -= m[k]; if (r <= 0) return k; }
  return 'normal';
}
const _l = {};
function ubicar(z, cerca) {
  const pl = local(J.pos.x, J.pos.z, _l);
  z.sube = false;
  for (let intento = 0; intento < 12; intento++) {
    const r = Math.random(); let i, d, sube = false;
    if (cerca) { i = pl.i + (Math.random() - .5) * 24; d = -8 + Math.random() * 26; }
    else if (r < 0.45) { i = pl.i + (Math.random() - .5) * 60; d = -31 - Math.random() * 6; sube = true; }
    else if (r < 0.8) { i = pl.i + (Math.random() - .5) * 70; d = 23 + Math.random() * 7; }
    else { i = pl.i + (Math.random() < .5 ? -1 : 1) * (18 + Math.random() * 12); d = -8 + Math.random() * 19; }
    i = Math.max(LIM_I0 - 4, Math.min(LIM_I1 + 4, i));
    aMundo(i, d, _o);
    const lejos = _o.distanceTo(J.pos);
    if ((lejos > (cerca ? 8 : 16) && libre(_o.x, _o.z, 0.6)) || intento === 11) {
      z.sube = sube; z.g.position.set(_o.x, sube ? -2.6 : piso(d), _o.z); break;
    }
  }
}
function libre(x, z, r) { for (const c of colisiones) if ((c.x - x) ** 2 + (c.z - z) ** 2 < (c.r + r) ** 2) return false; return true; }
function spawn(tipo, cerca) {
  const z = poolZ.pop(); if (!z) return null;
  prepararZombi(z, tipo || elegirTipo());
  ubicar(z, cerca);
  if (z.tipo === 'gateador') z.sube = false;
  if (z.sube && z.g.position.y > -2) z.sube = false;
  const m = (1 + (oleada - 1) * 0.07) * MODO().vida;
  z.vida *= m; z.vidaMax = z.vida;
  zombis.push(z);
  return z;
}
function spawnJefe(tipo) {
  const z = spawn(tipo); if (!z) return;
  z.vida = z.vidaMax = TIPOS[tipo].vida * MODO().vida; z.sube = false;
  // aparece del lado de la ciudad, de frente
  const pl = local(J.pos.x, J.pos.z, _l); aMundo(pl.i + (Math.random() - .5) * 10, 18, _o); z.g.position.set(_o.x, piso(18), _o.z);
  jefe = z; z.rugidoT = 0.5; z.piedraT = 3; z.timerIA = 4; z.fase2 = false; z.fase3 = false;
  $('jefe').classList.remove('oculto'); $('jefe-nombre').textContent = TIPOS[tipo].nombre; hudJefe(true);
  shake = 0.8; vibrar([80, 60, 80]);
}
function jefeMuerto(z) {
  S.jefes++; jefe = null; $('jefe').classList.add('oculto');
  shake = 1.2; vibrar(200); sonido.explosion(); sonido.rugido(z.tipo === 'cerro' ? 0.5 : 0.8);
  ef.explosion(_p.copy(z.g.position), 6);
  mensaje(z.tipo === 'cerro' ? '¡Se cayó el Cerro!' : '¡Patovica afuera!', '+$' + PESOS[z.tipo] + ' para el almacén');
  logro(z.tipo === 'cerro' ? 'cerro' : 'patovica');
  mundo.fuegos(4);
  // los zombis chicos que quedaban se desarman
}
function hudJefe(reset) {
  if (!jefe) return;
  const k = Math.max(0, jefe.vida / jefe.vidaMax) * 100 + '%';
  $('jefe-rel').style.width = k; if (reset) $('jefe-dano').style.width = '100%'; else $('jefe-dano').style.width = k;
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
  let vel = (teclas.ShiftLeft || teclas.ShiftRight || len > 0.95 && movil ? 7.5 : 5.2) * (ventajas.has('mate') ? 1.15 : 1);
  if (J.lento > 0) { vel *= 0.55; J.lento -= dt; }
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
function empujarJugador(dx, dz, f) {
  const nx = J.pos.x + dx * f, nz = J.pos.z + dz * f;
  if (posValida(nx, nz)) { J.pos.x = nx; J.pos.z = nz; }
}
// daño al jugador: el chaleco frena el 60%, y aparece la flecha roja de dónde vino
const indicadores = [];
for (let i = 0; i < 4; i++) { const d = document.createElement('div'); d.className = 'ind'; $('indicadores').appendChild(d); indicadores.push({ d, t: 0, x: 0, z: 0 }); }
let indIdx = 0;
function recibirDano(cant, fx, fz) {
  if (dios || estado !== 'jugando') return;
  let resto = cant;
  if (J.blindaje > 0) { const abs = Math.min(J.blindaje, cant * 0.6); J.blindaje -= abs; resto -= abs; sonido.armadura(); }
  J.vida -= resto; S.recibido += cant; S.olaSinDano = false;
  vineta = Math.min(1, 0.5 + cant / 30); flashDano = 0.25; shake = Math.max(shake, 0.25 + cant / 60); sonido.dolor(); vibrar(cant > 20 ? 90 : 45);
  if (fx !== undefined) { const ind = indicadores[indIdx = (indIdx + 1) % 4]; ind.t = 1.3; ind.x = fx; ind.z = fz; }
  hud();
}

// ---------- Simulación (paso fijo: mismo ritmo a 60, 120 o 240 Hz) ----------
const PASO = 1 / 120;
let autoChequeo = 0;
const pisoEn = (x, z) => piso(local(x, z, _l).d);
function simular(dt) {
  tiempo += dt;
  simSangre(dt);
  ef.sim(dt, pisoEn);
  ef.simProy(dt, pisoEn, alCaerProyectil);
  for (const tr of trazas) if (tr.t > 0) { tr.t -= dt; tr.l.material.opacity = Math.max(0, tr.t / 0.06) * 0.8; if (tr.t <= 0) tr.l.visible = false; }
  for (const p of poolPick) {
    if (p.t <= 0) continue;
    p.t -= dt; p.g.rotation.y += dt * 1.5;
    p.g.visible = p.t > 0 && (p.t > 5 || Math.sin(tiempo * 20) > 0);
    if (p.t > 0 && estado === 'jugando' && (p.g.position.x - J.pos.x) ** 2 + (p.g.position.z - J.pos.z) ** 2 < 2.4 ** 2) { agarrar(p); p.t = 0; p.g.visible = false; }
  }
  if (comboT > 0) { comboT -= dt; if (comboT <= 0) { comboN = 0; $('combo').style.opacity = 0; } }
  // los zombis siguen moviéndose también en el menú y en la pantalla de fin
  simZombis(dt);
  if (estado !== 'jugando') return;
  moverJugador(dt);
  // oleadas
  if (tiendaT > 0) { tiendaT -= dt; if (tiendaT <= 0) abrirTienda(); }
  else if (descanso > 0) { descanso -= dt; if (descanso <= 0) empezarOleada(); }
  else if (porSalir > 0) {
    spawnT -= dt;
    let vivos = 0; for (const z of zombis) vivos += z.vivo;
    if (spawnT <= 0 && vivos < CAL[AJ.calidad].maxZ) { if (spawn()) porSalir--; spawnT = Math.max(0.4, 1.9 - oleada * 0.14) * (0.6 + Math.random() * 0.8); }
  } else if (oleada > 0 && !jefePendiente && !zombis.some(z => z.vivo)) oleadaTerminada();
  if (jefePendiente && (jefeT -= dt) <= 0) { spawnJefe(jefePendiente); jefePendiente = null; }
  // armas
  cdArma -= dt; cambioT = Math.max(0, cambioT - dt);
  const a = A(armaSel);
  if (recargaT > 0) {
    recargaT -= dt;
    if (recargaT <= 0) { const n = Math.min(cargMax(a) - cargador[a.id], reserva[a.id]); cargador[a.id] += n; if (reserva[a.id] !== Infinity) reserva[a.id] -= n; hud(); }
  }
  if (swingT > 0) {
    swingT -= dt;
    if (!swingHecho && swingT < cadenciaDe(a) * 0.6) { swingHecho = true; impactoMelee(); }
  }
  // celular: ayuda de puntería (la mira se "pega" un poco al zombi) y tiro automático
  if (movil && (AJ.asistencia || AJ.autoFuego)) asistir(dt, a);
  const quiere = disparando || autoDisparo;
  if (quiere && cdArma <= 0 && cambioT <= 0 && recargaT <= 0) {
    if (a.tipo === 'fuego') disparar(); else golpear();
    hud();
  }
  if (vineta > 0) vineta = Math.max(0, vineta - dt * 1.2);
  if (dios) J.vida = J.vidaMax;
  if (J.vida <= 0 && estado === 'jugando') finDelJuego();
}
const _ad = new THREE.Vector3();
function asistir(dt, a) {
  // busca el zombi más cercano a la mira dentro de un cono chico
  ojoJugador(_o, _f, _r, _u);
  let mejor = null, mejorAng = AJ.asistencia ? 0.12 : 0.05, mejorDist = 0;
  const alcance = a.tipo === 'fuego' ? a.alcance : a.alcance + 0.6;
  for (const z of zombis) {
    if (!z.vivo || z.sube) continue;
    const h = z.T.hit[1];
    _ad.set(z.g.position.x - _o.x, z.g.position.y + h[0] * z.esc - _o.y, z.g.position.z - _o.z);
    const d = _ad.length(); if (d > alcance) continue;
    const ang = Math.acos(Math.min(1, _ad.dot(_f) / d)) - Math.atan(h[1] * z.esc / d);
    if (ang < mejorAng) { mejorAng = ang; mejor = z; mejorDist = d; }
  }
  if (mejor && AJ.asistencia && (disparando || mirarId !== null)) {
    const h = mejor.T.hit[1];
    const dx = mejor.g.position.x - _o.x, dz = mejor.g.position.z - _o.z, dy = mejor.g.position.y + h[0] * mejor.esc - _o.y;
    const yaw = Math.atan2(-dx, -dz), pitch = Math.atan2(dy, Math.hypot(dx, dz));
    let dyaw = yaw - J.yaw; dyaw = Math.atan2(Math.sin(dyaw), Math.cos(dyaw));
    const k = Math.min(1, dt * 2.2); J.yaw += dyaw * k; J.pitch += (pitch - J.pitch) * k * 0.6;
  }
  // tiro automático: si la mira está sobre un zombi y no hay un auto en el medio
  autoChequeo -= dt;
  if (AJ.autoFuego && autoChequeo <= 0) {
    autoChequeo = 0.06;
    rayo(_o, _f, alcance, golpes, 1.1);
    autoDisparo = golpes.length > 0 && rayoObstaculos(_o, _f, alcance).t > golpes[0].t;
  } else if (!AJ.autoFuego) autoDisparo = false;
}
function alCaerProyectil(pr) {
  const dx = J.pos.x - pr.p.x, dz = J.pos.z - pr.p.z, d = Math.hypot(dx, dz);
  if (pr.piedra) {
    ef.golpeSuelo(pr.p, pr.radio * 1.5); ef.impacto(pr.p, 0, 0, false); sonido.pisoton();
    shake = Math.max(shake, Math.max(0.2, 0.9 - d / 30));
  } else { ef.baba(pr.p, 14); sonido.salpica(); }
  if (d < pr.radio && estado === 'jugando') {
    recibirDano(pr.dano * MODO().dano, pr.p.x - pr.v.x, pr.p.z - pr.v.z);
    if (!pr.piedra) { J.lento = 1.6; aviso('¡Baba! Te frena'); }
    else empujarJugador(dx / (d || 1), dz / (d || 1), 1.2);
  }
}

// ---------- Zombis: IA ----------
// Todos telegrafían el ataque (prep): se frenan, levantan los brazos y recién después pegan.
// Si te alejás a tiempo, el golpe sale al aire. Se abren en abanico para rodearte.
const _sep = new THREE.Vector3(), _dest = new THREE.Vector3();
let menuZ = false;
function golpeZombi(z, dist, dx, dz) {
  // resolvió la preparación: ¿todavía estás al alcance?
  z.ataque = 0.4;
  if (dist < z.T.alcance + 0.55 && estado === 'jugando') {
    recibirDano(z.T.dano * MODO().dano, z.g.position.x, z.g.position.z);
    empujarJugador(dx / dist, dz / dist, z.T.jefe ? 1.4 : 0.45);
  }
}
function simZombis(dt) {
  const enJuego = estado === 'jugando';
  const ola = 1 + Math.min(0.5, (oleada - 1) * 0.055);
  for (let i = zombis.length - 1; i >= 0; i--) {
    const z = zombis[i], p = z.g.position, T = z.T;
    if (!z.vivo) {
      animarZombi(z, dt, 0);
      p.x += z.kb.x * dt; p.z += z.kb.z * dt; z.kb.multiplyScalar(Math.exp(-5 * dt));
      if (z.muerteT > 5) { zombis.splice(i, 1); poolZ.push(z); }
      continue;
    }
    const dx = J.pos.x - p.x, dz = J.pos.z - p.z, dist = Math.hypot(dx, dz) || 0.001;
    z.velMult = Math.min(1, z.velMult + dt * 1.6);
    let v = T.vel * (T.jefe ? 1 : ola) * z.velMult;
    if (!enJuego) v *= 0.4;
    if (z.sube) { p.y += dt * 1.3; v *= 0.35; if (p.y >= -0.5) z.sube = false; }
    if (z.prep > 0 || z.ataque > 0 || z.aturdido > 0) v = 0;
    // a dónde va: directo si está cerca; si no, a un punto corrido al costado (rodear)
    let tx = dx / dist, tz = dz / dist;
    if (dist > 3.5 && !T.jefe) {
      const lado = z.flanco * Math.min(7, dist * 0.4);
      _dest.set(J.pos.x + -tz * lado, 0, J.pos.z + tx * lado);
      const ex = _dest.x - p.x, ez = _dest.z - p.z, el = Math.hypot(ex, ez) || 1; tx = ex / el; tz = ez / el;
    }
    let mira = Math.atan2(dx, dz);
    z.golpeT -= dt; if (z.ataque > 0) z.ataque -= dt; if (z.aturdido > 0) z.aturdido -= dt;
    const alcance = T.alcance;
    // --- comportamiento por tipo
    if (z.tipo === 'escupidor' && enJuego && !z.sube) {
      z.timerIA -= dt;
      if (dist < 14 && dist > 4.5 && local(p.x, p.z, _l).d > -10.4) { // en la arena no se planta: primero sube a la rambla
        v *= dist < 10 ? 0 : 0.6; // se planta a distancia
        if (z.timerIA <= 0 && z.prep <= 0) { z.prep = z.prepTotal = T.prep; z.accion = 'escupir'; z.timerIA = 3 + Math.random() * 1.5; }
      }
    }
    if (z.tipo === 'explosivo' && enJuego) {
      if (z.mecha > 0) {
        z.mecha -= dt; v = T.vel * 0.5;
        if (Math.floor(z.mecha * 8) !== Math.floor((z.mecha + dt) * 8)) sonido.mecha();
        if (z.mecha <= 0) { explotar(z, false); continue; }
      } else if (dist < 2.6) { z.mecha = 0.9; aviso('¡Se va a reventar!'); }
    }
    if (z.tipo === 'patovica' && enJuego) {
      z.timerIA -= dt;
      if (z.cargaT > 0) { // embestida en línea recta
        z.cargaT -= dt; v = 0;
        const cv = 12 * dt; p.x += z.cdx * cv; p.z += z.cdz * cv; mira = Math.atan2(z.cdx, z.cdz);
        if (Math.random() < 0.3) ef.impacto(_p.set(p.x, p.y + 0.2, p.z), -z.cdx, -z.cdz, false);
        if (Math.hypot(J.pos.x - p.x, J.pos.z - p.z) < 2.2) {
          recibirDano(32 * MODO().dano, p.x, p.z); empujarJugador(z.cdx, z.cdz, 2.5); z.cargaT = 0; shake = 1; z.golpeT = 1.2;
        }
        for (const c of colisiones) if ((c.x - p.x) ** 2 + (c.z - p.z) ** 2 < (c.r + 1.3) ** 2 && (c.x - p.x) * z.cdx + (c.z - p.z) * z.cdz > 0) { // se la dio contra un auto
          z.cargaT = 0; z.aturdido = 2.6; sonido.chapa(); sonido.golpe(); shake = Math.max(shake, 0.7); ef.impacto(_p.set(p.x, p.y + 2, p.z), -z.cdx, -z.cdz, true);
          aviso('¡Se la dio! Ahora pegale'); break;
        }
        if (local(p.x, p.z, _l).d < -10 || _l.d > 20) z.cargaT = 0;
      } else if (z.timerIA <= 0 && dist > 6 && dist < 22 && z.prep <= 0 && z.aturdido <= 0) {
        z.prep = z.prepTotal = 0.9; z.accion = 'cargar'; z.timerIA = 5 + Math.random() * 2; sonido.rugido(0.8); sonido.carga();
      }
    }
    if (z.tipo === 'cerro' && enJuego) {
      z.piedraT -= dt;
      if (z.piedraT <= 0 && dist > 7 && z.prep <= 0) { z.prep = z.prepTotal = 1.0; z.accion = 'piedra'; z.piedraT = (z.fase2 ? 3.2 : 4.5) + Math.random(); }
      // al perder vida llama refuerzos
      const k = z.vida / z.vidaMax;
      if (!z.fase2 && k < 0.66) { z.fase2 = true; refuerzos(5); }
      if (!z.fase3 && k < 0.33) { z.fase3 = true; refuerzos(6); }
    }
    if (z.rugidoT !== undefined && T.jefe) { z.rugidoT -= dt; if (z.rugidoT <= 0) { z.rugidoT = 7 + Math.random() * 5; if (enJuego) sonido.rugido(z.tipo === 'cerro' ? 0.55 : 0.8); } }
    // --- preparación y ataque cuerpo a cuerpo
    const cerca = dist < alcance + 0.2;
    if (cerca && enJuego && z.golpeT <= 0 && z.prep <= 0 && !z.sube && z.ataque <= 0 && z.aturdido <= 0 && z.tipo !== 'explosivo' && !(z.cargaT > 0)) {
      z.prep = z.prepTotal = T.prep * (MODO().dano > 1 ? 0.85 : 1); z.accion = z.tipo === 'cerro' ? 'pisoton' : 'golpe'; z.golpeT = 1.2 + Math.random() * 0.3;
      if (z.tipo === 'cerro') pisoAviso(p, 5.5, T.prep);
    }
    if (z.prep > 0) {
      z.prep -= dt;
      if (z.prep <= 0) {
        z.prep = 0;
        if (z.accion === 'golpe') golpeZombi(z, dist, dx, dz);
        else if (z.accion === 'pisoton') {
          z.ataque = 0.4; sonido.pisoton(); ef.golpeSuelo(p, 8); shake = Math.max(shake, 1); vibrar(120);
          if (dist < 5.5 && enJuego) { recibirDano(T.dano * MODO().dano, p.x, p.z); empujarJugador(dx / dist, dz / dist, 2.2); }
        } else if (z.accion === 'escupir' && enJuego) {
          _p.set(p.x, p.y + 1.6 * z.esc, p.z); _fin.set(J.pos.x, J.pos.y + 0.2, J.pos.z);
          ef.lanzar('baba', _p, _fin, Math.max(0.6, dist / 14), T.dano, 1.4, J.pos.y); sonido.escupe(); z.ataque = 0.4;
        } else if (z.accion === 'piedra' && enJuego) {
          _p.set(p.x, p.y + 5.5, p.z);
          _fin.set(J.pos.x + (Math.random() - .5) * 2, J.pos.y, J.pos.z + (Math.random() - .5) * 2);
          ef.lanzar('piedra', _p, _fin, 1.5, 28, 2.6, J.pos.y); sonido.tiraPiedra(); z.ataque = 0.4;
        } else if (z.accion === 'cargar' && enJuego) {
          z.cargaT = 1.6; z.cdx = dx / dist; z.cdz = dz / dist;
        }
      }
    }
    // separación entre zombis
    _sep.set(0, 0, 0);
    for (const o of zombis) {
      if (o === z || !o.vivo) continue;
      const ex = p.x - o.g.position.x, ez = p.z - o.g.position.z, e2 = ex * ex + ez * ez;
      const md = 0.75 * (z.esc + o.esc) * 0.5;
      if (e2 < md * md && e2 > 1e-6) { const e = Math.sqrt(e2), w = o.T.jefe ? 3 : 1; _sep.x += ex / e * (md - e) * w; _sep.z += ez / e * (md - e) * w; }
    }
    const mv = cerca ? 0 : v;
    z.g.rotation.y += Math.atan2(Math.sin(mira - z.g.rotation.y), Math.cos(mira - z.g.rotation.y)) * Math.min(1, dt * (T.jefe ? 4 : 10));
    p.x += (tx * mv + z.kb.x + _sep.x * 4) * dt;
    p.z += (tz * mv + z.kb.z + _sep.z * 4) * dt;
    z.kb.multiplyScalar(Math.exp(-4 * dt));
    const rz = T.jefe ? 0.3 * z.esc : 0.3;
    for (const c of colisiones) {
      const cx = p.x - c.x, cz = p.z - c.z, c2 = cx * cx + cz * cz, rr = c.r + rz;
      if (c2 < rr * rr) { // empuja afuera y lo hace rodear el obstáculo hacia el jugador
        const c1 = Math.sqrt(c2) || 1, ux = cx / c1, uz = cz / c1;
        p.x = c.x + ux * rr; p.z = c.z + uz * rr;
        // rodea siempre para el mismo lado un rato (si no, entre dos obstáculos se queda temblando)
        if (z.rodeoT <= 0) { z.rodeo = (-uz * dx + ux * dz) >= 0 ? 1 : -1; z.rodeoT = 1.2; }
        const sg = z.rodeo;
        p.x += -uz * sg * Math.max(mv, 1.2) * dt; p.z += ux * sg * Math.max(mv, 1.2) * dt;
      }
    }
    z.rodeoT -= dt;
    // ¿está trancado? cada 2 s mira si se acercó; si no, cambia de lado y de abanico; si sigue, reaparece
    if ((z.chequeoT = (z.chequeoT || 2) - dt) <= 0) {
      z.chequeoT = 2;
      if (!cerca && enJuego && !z.sube && z.prep <= 0 && z.aturdido <= 0 && dist > (z.distPrev || 1e9) - 0.6) {
        z.trancado = (z.trancado || 0) + 1; z.rodeo = -z.rodeo || 1; z.rodeoT = 2; z.flanco = (Math.random() * 2 - 1) * 0.3;
        if (z.trancado >= 4 && !T.jefe && dist > 15) { ubicar(z, false); z.trancado = 0; }
      } else z.trancado = 0;
      z.distPrev = dist;
    }
    // límites del mapa (los del río pueden estar en la arena)
    const lz = local(p.x, p.z, _l);
    if (lz.i < LIM_I0 - 6 || lz.i > LIM_I1 + 6) { aMundo(Math.max(LIM_I0 - 6, Math.min(LIM_I1 + 6, lz.i)), lz.d, _o); p.x = _o.x; p.z = _o.z; }
    if (!z.sube) p.y += (piso(lz.d) - p.y) * Math.min(1, dt * 5);
    // los que vienen del río saltan el muro
    if (lz.d > -12.4 && lz.d < -10.6 && !z.sube) p.y = Math.max(p.y, 2.6);
    // menú: si llegan a la cámara, vuelven a salir lejos
    if (estado === 'inicio' && dist < 5) ubicar(z, false);
    z.gemido -= dt;
    if (z.gemido <= 0) { z.gemido = 4 + Math.random() * 8; if (dist < 40 && estado !== 'inicio') sonido.gemido(z.tipo === 'tanque' ? 0.6 : z.tipo === 'corredor' ? 1.4 : z.T.jefe ? 0.45 : 1); }
    animarZombi(z, dt, cerca ? 0.3 : mv / 1.5);
  }
}
function refuerzos(n) {
  sonido.rugido(0.5); mensaje('¡Llamó a los suyos!', '', true);
  for (let k = 0; k < n; k++) { const z = spawn(k % 2 ? 'gateador' : 'corredor', true); if (z) z.sube = false; }
}
// aviso en el piso antes del pisotón del Cerro
const avisoPiso = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xff3010, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
avisoPiso.visible = false; scene.add(avisoPiso);
let avisoPisoT = 0, avisoPisoTot = 1;
function pisoAviso(p, r, t) { avisoPiso.position.set(p.x, p.y + 0.08, p.z); avisoPiso.scale.setScalar(r); avisoPiso.visible = true; avisoPisoT = avisoPisoTot = t; }

function agarrar(p) {
  sonido.agarrar(); vibrar(20);
  if (p.tipo === 'chivito') { J.vida = Math.min(J.vidaMax, J.vida + 35); aviso('¡Un chivito! +35 de vida'); }
  else {
    for (const a of ARMAS) if (a.tipo === 'fuego' && tiene.has(a.id) && a.reserva !== Infinity) reserva[a.id] = Math.min(resMax(a) * 2, reserva[a.id] + cargMax(a) * 2);
    aviso('Balas para todas las armas');
  }
  hud();
}

// ---------- Almacén entre oleadas ----------
let tab = 'armas';
function abrirTienda() {
  estado = 'tienda'; disparando = false; autoDisparo = false; recargaT = 0;
  if (document.pointerLockElement) document.exitPointerLock();
  // recarga gratis al entrar
  for (const a of ARMAS) if (a.tipo === 'fuego' && tiene.has(a.id)) { const n = Math.min(cargMax(a) - cargador[a.id], reserva[a.id]); cargador[a.id] += n; if (reserva[a.id] !== Infinity) reserva[a.id] -= n; }
  $('tienda-sub').textContent = `Oleada ${oleada} superada · La próxima: ${oleada + 1}${JEFES[oleada + 1] ? ' — ¡viene un jefe!' : ''}`;
  pintarTienda();
  mostrar('tienda'); $('tactil').classList.add('oculto'); $('hud').classList.add('oculto');
  musica.set(0.1, false, true);
}
function cerrarTienda() {
  ocultar('tienda'); estado = 'jugando'; descanso = 3; $('hud').classList.remove('oculto'); hud();
  if (movil) $('tactil').classList.remove('oculto'); else pedirLock();
  mensaje('Oleada ' + (oleada + 1), 'Preparate…');
}
function cobrar(precio) {
  if (pesos < precio) { sonido.noPlata(); $('tienda-plata').classList.remove('pulso'); void $('tienda-plata').offsetWidth; $('tienda-plata').classList.add('pulso'); return false; }
  pesos -= precio; S.gastado += precio; sonido.comprar(); vibrar(15);
  if (S.gastado >= 3000) logro('vip');
  return true;
}
function item(html, precio, accion, deshab, tieneCls) {
  const d = document.createElement('div'); d.className = 'item' + (tieneCls ? ' tiene' : '');
  d.innerHTML = html;
  if (accion) {
    const b = document.createElement('button');
    b.innerHTML = precio === null ? 'Listo' : `Comprar · $${precio}`;
    b.disabled = !!deshab || pesos < precio;
    b.addEventListener('click', () => { if (cobrar(precio)) { accion(); pintarTienda(); hud(); } });
    d.appendChild(b);
  }
  return d;
}
function barrasNivel(n, max) { let s = '<div class="nivel">'; for (let i = 0; i < max; i++) s += `<i class="${i < n ? 'on' : ''}"></i>`; return s + '</div>'; }
function pintarTienda() {
  $('tienda-plata').querySelector('span').textContent = pesos;
  document.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('sel', b.dataset.tab === tab));
  const L = $('tienda-lista'); L.innerHTML = '';
  if (tab === 'armas') {
    for (const a of ARMAS) {
      const t = tiene.has(a.id);
      const st = a.tipo === 'fuego' ? `<div class="stats-arma"><span>Daño ${a.dano}${a.perdigones > 1 ? '×' + a.perdigones : ''}</span><span>Cargador ${a.cargador}</span><span>${a.auto ? 'Automática' : 'Semi'}</span></div>`
        : `<div class="stats-arma"><span>Daño ${a.dano}</span><span>Empuje ${a.empuje}</span><span>Cuerpo a cuerpo</span></div>`;
      if (t && a.tipo === 'fuego' && a.reserva !== Infinity) {
        const falta = resMax(a) - reserva[a.id], precio = Math.max(20, Math.round(falta / a.cargador * 15 / 5) * 5);
        L.appendChild(item(`<div class="cab"><b>${a.nombre}</b><small>en la mochila</small></div><small>${a.desc}</small>${st}<small>Reserva ${reserva[a.id]} / ${resMax(a)}</small>`,
          precio, () => { reserva[a.id] = resMax(a); }, falta <= 0, true));
        L.lastChild.querySelector('button').innerHTML = falta <= 0 ? 'Reserva llena' : `Llenar reserva · $${precio}`;
      } else if (t) L.appendChild(item(`<div class="cab"><b>${a.nombre}</b><small>en la mochila</small></div><small>${a.desc}</small>${st}`, null, null, true, true));
      else L.appendChild(item(`<div class="cab"><b>${a.nombre}</b></div><small>${a.desc}</small>${st}`, a.precio, () => {
        tiene.add(a.id); if (a.tipo === 'fuego') { cargador[a.id] = cargMax(a); reserva[a.id] = resMax(a); }
        elegirArma(a.id, true); armarBarra(); if (tiene.size === ARMAS.length) logro('arsenal');
      }));
    }
  } else if (tab === 'mejoras') {
    for (const a of ARMAS) {
      if (!tiene.has(a.id)) continue;
      const d = document.createElement('div'); d.className = 'item';
      d.innerHTML = `<div class="cab"><b>${a.nombre}</b></div>`;
      for (const k in MEJORAS) {
        const M = MEJORAS[k]; if (a.tipo === 'cuerpo' && !M.cuerpo) continue;
        if (a.reserva === Infinity && k === 'cargador' && false) continue;
        const n = nv(a.id, k), precio = precioMejora(a.id, k, n), max = n >= M.max;
        const f = document.createElement('div'); f.className = 'cab'; f.style.alignItems = 'center';
        f.innerHTML = `<small><b style="font-size:15px">${M.nombre}</b> · ${M.desc}</small>${barrasNivel(n, M.max)}`;
        const b = document.createElement('button'); b.style.cssText = 'margin:2px 0 4px!important;padding:5px 8px!important;font-size:14px!important;flex:none';
        b.textContent = max ? 'Al máximo' : `$${precio}`; b.disabled = max || pesos < precio;
        b.addEventListener('click', () => { if (cobrar(precio)) { (niveles[a.id] || (niveles[a.id] = {}))[k] = n + 1; if (k === 'cargador' && a.tipo === 'fuego') cargador[a.id] = cargMax(a); pintarTienda(); hud(); } });
        d.appendChild(f); d.appendChild(b);
      }
      L.appendChild(d);
    }
  } else if (tab === 'equipo') {
    for (const e of EQUIPO) {
      let deshab = false, extra = '';
      if (e.id === 'chaleco') { deshab = J.blindaje >= 100; extra = `<small>Tenés ${Math.round(J.blindaje)} / 100</small>`; }
      if (e.id === 'chivito') { deshab = J.vida >= J.vidaMax; extra = `<small>Vida ${Math.ceil(J.vida)} / ${J.vidaMax}</small>`; }
      L.appendChild(item(`<div class="cab"><b>${e.nombre}</b></div><small>${e.desc}</small>${extra}`, e.precio, () => {
        if (e.id === 'chaleco') J.blindaje = Math.min(100, J.blindaje + 50);
        if (e.id === 'chivito') J.vida = J.vidaMax;
        if (e.id === 'balas') for (const a of ARMAS) if (a.tipo === 'fuego' && tiene.has(a.id)) reserva[a.id] = resMax(a);
      }, deshab));
    }
  } else {
    for (const v of VENTAJAS) {
      const t = ventajas.has(v.id);
      L.appendChild(item(`<div class="cab"><b>${v.nombre}</b>${t ? '<small>activa</small>' : ''}</div><small>${v.desc}</small>`, t ? null : v.precio, t ? null : () => {
        ventajas.add(v.id); if (v.id === 'corazon') { J.vidaMax += 25; J.vida += 25; }
      }, false, t));
    }
  }
  const nArmas = ARMAS.filter(a => tiene.has(a.id)).length;
  $('tienda-estado').innerHTML = `Vida ${Math.ceil(J.vida)}/${J.vidaMax} · Chaleco ${Math.round(J.blindaje)} · ${nArmas} armas · ${ventajas.size} ventajas`;
}
document.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; sonido.clic(); pintarTienda(); }));
$('b-seguir-ola').addEventListener('click', () => { sonido.clic(); cerrarTienda(); });

// ---------- Logros ----------
const logroCola = [];
let logroMostrando = false;
function logro(id) {
  if (perfil.logros[id]) return;
  perfil.logros[id] = Date.now(); guardarPerfil(perfil);
  S.logrosNuevos && S.logrosNuevos.push(id);
  logroCola.push(id); if (!logroMostrando) siguienteLogro();
}
function siguienteLogro() {
  const id = logroCola.shift(); if (!id) { logroMostrando = false; return; }
  logroMostrando = true; const L = LOGROS.find(l => l.id === id);
  $('logro-nombre').textContent = L ? L.nombre : id; $('logro-toast').classList.add('on'); sonido.logro();
  setTimeout(() => { $('logro-toast').classList.remove('on'); setTimeout(siguienteLogro, 500); }, 2600);
}
function pintarLogros() {
  const n = LOGROS.filter(l => perfil.logros[l.id]).length;
  $('logros-stats').innerHTML = `<div><b>${perfil.record}</b>récord</div><div><b>${perfil.mejorOleada}</b>mejor oleada</div><div><b>${perfil.bajas}</b>zombis en total</div><div><b>${perfil.victorias}</b>amaneceres</div><div><b>${n}/${LOGROS.length}</b>logros</div>`;
  $('logros-lista').innerHTML = LOGROS.map(l => `<div class="logro ${perfil.logros[l.id] ? 'si' : ''}"><svg><use href="#i-trofeo"/></svg><div><b>${l.nombre}</b><small>${l.desc}</small></div></div>`).join('');
}

// ---------- Fin de partida ----------
function cerrarPartida(gano) {
  perfil.partidas++; perfil.bajas += bajas; perfil.mejorOleada = Math.max(perfil.mejorOleada, gano ? OLEADAS_TOTAL : oleada - 1);
  const nuevo = puntos > perfil.record; if (nuevo) perfil.record = puntos;
  if (gano) { perfil.victorias++; perfil.pesadilla = true; }
  guardarPerfil(perfil); try { localStorage.setItem('rz-record', perfil.record); } catch (e) { }
  const seg = Math.round((performance.now() - S.inicio) / 1000), pre = S.disparos ? Math.round(S.aciertos / S.disparos * 100) : 0;
  const fav = Object.entries(S.porArma).sort((a, b) => b[1].bajas - a[1].bajas)[0];
  $('fin-stats').innerHTML = [
    [puntos, 'puntos'], [bajas, 'zombis'], [S.cabezas, 'a la cabeza'], [pre + '%', 'puntería'],
    [`${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, '0')}`, 'tiempo'], ['$' + S.gastado, 'gastado'],
    [fav && A(fav[0]) ? A(fav[0]).nombre : '—', 'arma favorita'], [Math.round(S.recibido), 'daño recibido']
  ].map(([b, s]) => `<div><b>${b}</b><small>${s}</small></div>`).join('');
  $('fin-logros').innerHTML = (nuevo ? '<div class="nuevo">¡Récord nuevo!</div>' : `Récord: ${perfil.record}`) +
    (S.logrosNuevos.length ? '<br>Logros: ' + S.logrosNuevos.map(id => LOGROS.find(l => l.id === id)?.nombre).join(' · ') : '');
}
function finDelJuego() {
  estado = 'fin'; disparando = false; autoDisparo = false; sonido.muerte(); vibrar([100, 50, 200]);
  if (document.pointerLockElement) document.exitPointerLock();
  cerrarPartida(false);
  $('fin').classList.remove('victoria');
  $('fin-titulo').textContent = ['Te comieron, bo', 'Fuiste almuerzo', 'Se terminó la noche'][Math.floor(Math.random() * 3)];
  $('fin-sub').innerHTML = `Aguantaste hasta la oleada <b>${oleada}</b> de ${OLEADAS_TOTAL}.`;
  $('jefe').classList.add('oculto'); musica.set(0, false, true);
  setTimeout(() => { mostrar('fin'); $('tactil').classList.add('oculto'); $('hud').classList.add('oculto'); }, 1400);
}
function victoria() {
  estado = 'fin'; disparando = false; autoDisparo = false;
  if (document.pointerLockElement) document.exitPointerLock();
  logro('amanecer'); if (AJ.modo === 'pesadilla') logro('pesadilla');
  mundo.setAlba(1); sonido.victoria(); camVictoria = true; vibrar([60, 40, 60, 40, 200]);
  mensaje('Sobreviviste hasta el amanecer', 'El sol sale por el río. Ya está, bo.');
  cerrarPartida(true);
  $('fin').classList.add('victoria');
  $('fin-titulo').textContent = 'Sobreviviste hasta el amanecer';
  $('fin-sub').innerHTML = `Diez oleadas, el Patovica y el Cerro. La rambla es tuya${AJ.modo === 'pesadilla' ? ', y en Pesadilla' : ''}.${perfil.victorias === 1 ? '<br>Desbloqueaste el modo <b>Pesadilla</b>.' : ''}`;
  musica.set(0, false, true);
  setTimeout(() => { mostrar('fin'); $('tactil').classList.add('oculto'); $('hud').classList.add('oculto'); }, 4500);
}

// ---------- HUD (solo toca el DOM cuando algo cambia) ----------
const prevHud = {};
function poner(id, prop, val) { const k = id + prop; if (prevHud[k] === val) return; prevHud[k] = val; const el = $(id); if (prop === 'text') el.textContent = val; else if (prop === 'w') el.style.width = val; else el[prop] = val; }
function hud() {
  poner('oleada', 'text', oleada ? (oleada === OLEADAS_TOTAL ? 'Última oleada' : `Oleada ${oleada}/${OLEADAS_TOTAL}`) : 'Preparate');
  poner('puntos', 'text', String(puntos));
  $('pesos').querySelector('span').textContent = pesos;
  let vivos = 0; for (const z of zombis) vivos += z.vivo;
  $('quedan').querySelector('span').textContent = porSalir + vivos;
  const vr = Math.max(0, J.vida) / J.vidaMax * 100 + '%';
  poner('vida-rel', 'w', vr); poner('vida-dano', 'w', vr); poner('vida-txt', 'text', String(Math.max(0, Math.ceil(J.vida))));
  $('vida').classList.toggle('baja', J.vida < 30);
  poner('blindaje-rel', 'w', J.blindaje + '%'); $('blindaje').classList.toggle('vacio', J.blindaje <= 0);
  const a = A(armaSel); poner('arma-nombre', 'text', a.nombre);
  poner('cargador', 'text', a.tipo === 'fuego' ? String(cargador[a.id]) : '—');
  poner('reserva', 'text', a.tipo === 'fuego' ? '/ ' + (reserva[a.id] === Infinity ? '∞' : reserva[a.id]) : '');
  $('balas').classList.toggle('poca', a.tipo === 'fuego' && cargador[a.id] <= Math.ceil(cargMax(a) / 4));
  if (prevHud.sel !== armaSel) { prevHud.sel = armaSel; document.querySelectorAll('#barra-armas div').forEach(d => d.classList.toggle('sel', d.dataset.id === armaSel)); }
}
function armarBarra() {
  const b = $('barra-armas'); b.innerHTML = ''; prevHud.sel = null;
  ARMAS.forEach((a, i) => {
    if (!tiene.has(a.id)) return;
    const d = document.createElement('div'); d.dataset.id = a.id;
    d.innerHTML = `<b>${i + 1}</b>${a.nombre.split(' ')[0]}`;
    d.addEventListener('pointerdown', e => { e.stopPropagation(); elegirArma(a.id); });
    b.appendChild(d);
  });
  hud();
}
let mensajeT = 0, avisoT = 0;
function mensaje(t, sub = '', rojo = false) { const m = $('mensaje'); m.innerHTML = t + (sub ? `<small>${sub}</small>` : ''); m.classList.add('on'); m.classList.toggle('jefe', rojo); mensajeT = 3.2; }
function aviso(t) { $('aviso').textContent = t; $('aviso').style.opacity = 1; avisoT = 1.6; }
const flotantes = [];
for (let i = 0; i < 6; i++) { const d = document.createElement('div'); d.className = 'flota'; $('hud').appendChild(d); flotantes.push({ d, t: 0 }); }
let fIdx = 0;
function flotante(t) { const f = flotantes[fIdx = (fIdx + 1) % 6]; f.d.textContent = t; f.t = 0.9; f.d.style.left = (50 + (Math.random() - .5) * 8) + '%'; }
function feed(txt, plata) {
  const f = $('feed'); const d = document.createElement('div'); d.innerHTML = `${txt} <span class="p">${plata}</span>`; f.prepend(d);
  while (f.children.length > 4) f.lastChild.remove();
  setTimeout(() => d.remove(), 2700);
}

// ---------- Entrada: PC ----------
const canvas = renderer.domElement;
addEventListener('keydown', e => {
  teclas[e.code] = true;
  if (e.code === 'Escape' && estado === 'pausa' && !document.pointerLockElement) { /* el Esc que sale del lock no reanuda */ }
  if (estado !== 'jugando') return;
  if (e.code === 'KeyR') recargar();
  if (e.code === 'KeyQ') ciclarArma(1);
  if (e.code === 'Escape' || e.code === 'KeyP') pausar();
  const n = +e.key; if (n >= 1 && n <= 8) elegirArma(ARMAS[n - 1].id);
});
addEventListener('keyup', e => { teclas[e.code] = false; });
addEventListener('blur', () => { for (const k in teclas) teclas[k] = false; disparando = false; if (estado === 'jugando') pausar(); });
canvas.addEventListener('mousedown', e => {
  if (estado !== 'jugando' || movil) return;
  if (!document.pointerLockElement) pedirLock();
  if (e.button === 0) disparando = true;
});
addEventListener('mouseup', e => { if (e.button === 0) disparando = false; });
addEventListener('mousemove', e => {
  if (!document.pointerLockElement || estado !== 'jugando') return;
  mirar(e.movementX * 0.0022, e.movementY * 0.0022);
});
addEventListener('wheel', e => { if (estado === 'jugando') ciclarArma(e.deltaY > 0 ? 1 : -1); }, { passive: true });
function mirar(dx, dy) {
  dx *= AJ.sens; dy *= AJ.sens * (AJ.invertir ? -1 : 1);
  J.yaw -= dx; J.pitch = Math.max(-1.35, Math.min(1.35, J.pitch - dy)); lookDX += dx; lookDY += dy;
}
let teniaLock = false;
function pedirLock() { try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => { }); } catch (e) { } }
document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement) teniaLock = true;
  else if (teniaLock && estado === 'jugando') pausar();
});
document.addEventListener('visibilitychange', () => { if (document.hidden && estado === 'jugando') pausar(); });

// ---------- Entrada: celular ----------
let joyId = null, joyX0 = 0, joyY0 = 0, mirarId = null, mx0 = 0, my0 = 0;
const base = $('joy-base'), palo = $('joy-palo');
const sonda = document.createElement('div');
sonda.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
document.body.appendChild(sonda);
function safeArea() { const s = getComputedStyle(sonda); return { t: parseFloat(s.paddingTop) || 0, r: parseFloat(s.paddingRight) || 0, b: parseFloat(s.paddingBottom) || 0, l: parseFloat(s.paddingLeft) || 0 }; }
function tocar(e) {
  if (estado !== 'jugando') return;
  for (const t of e.changedTouches) {
    const el = t.target;
    if (el.closest && el.closest('#b-fuego')) { disparando = true; $('b-fuego').classList.add('on'); vibrar(8); if (mirarId === null) { mirarId = t.identifier; mx0 = t.clientX; my0 = t.clientY; } continue; }
    if (el.closest && el.closest('button, #barra-armas')) continue;
    if (t.clientX < innerWidth * 0.45 && joyId === null) {
      joyId = t.identifier;
      const r = 60 * AJ.botones, sa = safeArea();
      // que la base nunca quede cortada por el borde (ni por la muesca), y en vertical por arriba de la barra de vida
      const cx = Math.max(sa.l + r + 6, Math.min(innerWidth * 0.45 - r, t.clientX));
      const cy = Math.max(sa.t + 110, Math.min(innerHeight - sa.b - (innerWidth > innerHeight ? r + 6 : r + 68), t.clientY));
      joyX0 = cx; joyY0 = cy;
      base.style.left = (cx - r) + 'px'; base.style.top = (cy - r) + 'px'; base.style.bottom = 'auto';
    } else if (mirarId === null) { mirarId = t.identifier; mx0 = t.clientX; my0 = t.clientY; }
  }
  e.preventDefault();
}
function arrastrar(e) {
  for (const t of e.changedTouches) {
    if (t.identifier === joyId) {
      let dx = t.clientX - joyX0, dy = t.clientY - joyY0; const l = Math.hypot(dx, dy), m = 50 * AJ.botones;
      if (l > m) { dx *= m / l; dy *= m / l; }
      joy.x = dx / m; joy.y = dy / m; palo.style.transform = `translate(${dx}px,${dy}px)`;
    } else if (t.identifier === mirarId) {
      mirar((t.clientX - mx0) * 0.0055, (t.clientY - my0) * 0.0055); mx0 = t.clientX; my0 = t.clientY;
    }
  }
  if (estado === 'jugando') e.preventDefault();
}
function soltar(e) {
  for (const t of e.changedTouches) {
    if (t.identifier === joyId) { joyId = null; joy.x = joy.y = 0; palo.style.transform = ''; base.style.left = base.style.top = base.style.bottom = ''; }
    if (t.identifier === mirarId) mirarId = null;
    if (t.target.closest && t.target.closest('#b-fuego')) { disparando = false; $('b-fuego').classList.remove('on'); }
  }
}
addEventListener('touchstart', tocar, { passive: false });
addEventListener('touchmove', arrastrar, { passive: false });
addEventListener('touchend', soltar); addEventListener('touchcancel', soltar);
const tap = (id, fn) => $(id).addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); fn(); vibrar(8); tocar(e); }, { passive: false });
tap('b-recarga', () => recargar());
tap('b-cambiar', () => ciclarArma(1));
$('b-pausa').addEventListener('click', () => pausar());
// deslizar sobre la barra de armas cambia de arma
{
  let x0 = null;
  $('barra-armas').addEventListener('touchstart', e => { x0 = e.changedTouches[0].clientX; }, { passive: true });
  $('barra-armas').addEventListener('touchend', e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) ciclarArma(dx < 0 ? 1 : -1); x0 = null; });
}
// aviso de celular parado (no bloquea: se puede jugar igual)
let giroOk = false;
function revisarGiro() { $('girar').classList.toggle('oculto', !(movil && estado === 'jugando' && vistaH > vistaW && !giroOk)); }
$('b-girar-ok').addEventListener('click', () => { giroOk = true; revisarGiro(); });
$('b-girar-ok').addEventListener('touchstart', e => { e.stopPropagation(); giroOk = true; revisarGiro(); }, { passive: true });

// ---------- Pantallas ----------
const PANTALLAS = ['inicio', 'como', 'logros', 'pausa', 'tienda', 'fin', 'ajustes'];
function mostrar(id) { PANTALLAS.forEach(p => $(p).classList.toggle('oculto', p !== id)); }
function ocultar(id) { $(id).classList.add('oculto'); }
function telon(fn) { $('telon').classList.add('on'); setTimeout(() => { fn(); $('telon').classList.remove('on'); }, 340); }
let primeraVez = true;
function jugar() {
  iniciarAudio(); setVolumen(); musica.iniciar();
  telon(() => {
    reiniciar(); estado = 'jugando';
    PANTALLAS.forEach(ocultar);
    $('hud').classList.remove('oculto'); if (movil) $('tactil').classList.remove('oculto');
    $('jefe').classList.add('oculto');
    if (!movil) pedirLock();
    mensaje('Zombis en la Rambla', AJ.modo === 'pesadilla' ? 'Modo Pesadilla. Que Dios te ayude' : 'Aguantá hasta que amanezca', false);
    revisarGiro();
  });
  if (movil && primeraVez && document.documentElement.requestFullscreen && !document.fullscreenElement && !matchMedia('(display-mode: standalone)').matches)
    document.documentElement.requestFullscreen().catch(() => { });
  primeraVez = false;
}
function pausar() {
  if (estado !== 'jugando') return;
  estado = 'pausa'; disparando = false; autoDisparo = false; musica.pausa(true);
  $('pausa-info').textContent = `Oleada ${oleada} · ${puntos} puntos · $${pesos}`;
  mostrar('pausa');
  if (document.pointerLockElement) document.exitPointerLock();
}
function seguir() { estado = 'jugando'; musica.pausa(false); PANTALLAS.forEach(ocultar); if (!movil) pedirLock(); ultimo = performance.now(); }
function aMenu() {
  telon(() => {
    estado = 'inicio'; PANTALLAS.forEach(ocultar); mostrar('inicio');
    $('hud').classList.add('oculto'); $('tactil').classList.add('oculto'); $('girar').classList.add('oculto');
    reiniciar(); poblarMenu(); mostrarRecord(); musica.pausa(false); musica.set(0, false, true);
  });
}
const clic = (id, fn) => $(id).addEventListener('click', () => { iniciarAudio(); sonido.clic(); fn(); });
clic('b-jugar', jugar); clic('b-otra', jugar); clic('b-seguir', seguir); clic('b-salir', aMenu); clic('b-menu', aMenu);
let volverA = 'inicio';
clic('b-como', () => { volverA = 'inicio'; mostrar('como'); }); clic('b-como2', () => { volverA = 'pausa'; mostrar('como'); });
clic('b-logros', () => { volverA = 'inicio'; pintarLogros(); mostrar('logros'); });
document.querySelectorAll('.volver').forEach(b => b.addEventListener('click', () => { sonido.clic(); mostrar(volverA); }));
function mostrarRecord() {
  $('record').textContent = perfil.record ? `Tu récord: ${perfil.record} puntos · mejor oleada ${perfil.mejorOleada}` : '';
  document.querySelectorAll('[data-modo]').forEach(b => {
    b.classList.toggle('sel', b.dataset.modo === AJ.modo);
    if (b.dataset.modo === 'pesadilla') { b.disabled = !perfil.pesadilla; b.title = perfil.pesadilla ? '' : 'Ganá una vez para desbloquearlo'; b.textContent = perfil.pesadilla ? 'Pesadilla' : 'Pesadilla 🔒'; }
  });
  if (!perfil.pesadilla && AJ.modo === 'pesadilla') AJ.modo = 'normal';
}
document.querySelectorAll('[data-modo]').forEach(b => b.addEventListener('click', () => { if (b.disabled) return; AJ.modo = b.dataset.modo; guardarAjustes(); sonido.clic(); mostrarRecord(); }));

// ajustes
let ajustesDesde = 'inicio';
function abrirAjustes(desde) { ajustesDesde = desde; mostrar('ajustes'); }
clic('b-ajustes', () => abrirAjustes('inicio')); clic('b-ajustes2', () => abrirAjustes('pausa'));
clic('b-cerrar-aj', () => mostrar(ajustesDesde));
function setVolumen() { volumen(AJ.volumen, AJ.musica); }
function pintarAjustes() {
  document.querySelectorAll('[data-fps]').forEach(b => b.classList.toggle('sel', +b.dataset.fps === AJ.fps));
  document.querySelectorAll('[data-cal]').forEach(b => b.classList.toggle('sel', b.dataset.cal === AJ.calidad));
  $('aj-sens').value = AJ.sens; $('aj-sens-v').textContent = (+AJ.sens).toFixed(2);
  $('aj-vol').value = AJ.volumen; $('aj-mus').value = AJ.musica; $('aj-bt').value = AJ.botones; $('aj-bt-v').textContent = Math.round(AJ.botones * 100) + '%';
  $('aj-fps').checked = AJ.contador; $('aj-inv').checked = AJ.invertir; $('aj-asist').checked = AJ.asistencia; $('aj-auto').checked = AJ.autoFuego; $('aj-vib').checked = AJ.vibrar;
  $('contador').classList.toggle('oculto', !AJ.contador);
  document.documentElement.style.setProperty('--bt', AJ.botones);
}
document.querySelectorAll('[data-fps]').forEach(b => b.onclick = () => { AJ.fps = +b.dataset.fps; guardarAjustes(); pintarAjustes(); sonido.clic(); });
document.querySelectorAll('[data-cal]').forEach(b => b.onclick = () => { AJ.calidad = b.dataset.cal; guardarAjustes(); aplicarCalidad(); pintarAjustes(); sonido.clic(); });
$('aj-sens').oninput = e => { AJ.sens = +e.target.value; guardarAjustes(); pintarAjustes(); };
$('aj-vol').oninput = e => { AJ.volumen = +e.target.value; guardarAjustes(); setVolumen(); };
$('aj-mus').oninput = e => { AJ.musica = +e.target.value; guardarAjustes(); setVolumen(); };
$('aj-bt').oninput = e => { AJ.botones = +e.target.value; guardarAjustes(); pintarAjustes(); };
const chk = (id, k) => $(id).onchange = e => { AJ[k] = e.target.checked; guardarAjustes(); pintarAjustes(); };
chk('aj-fps', 'contador'); chk('aj-inv', 'invertir'); chk('aj-asist', 'asistencia'); chk('aj-auto', 'autoFuego'); chk('aj-vib', 'vibrar');

// menú con fondo vivo: zombis que caminan por la rambla mientras la cámara pasea
function poblarMenu() {
  for (let k = 0; k < 7; k++) { const z = spawn(['normal', 'normal', 'corredor', 'gateador', 'tanque', 'escupidor', 'normal'][k]); if (z) { z.sube = false; z.g.position.y = piso(local(z.g.position.x, z.g.position.z, _l).d); } }
}

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
    if (recargaT > 0) { const p = 1 - recargaT / recargaTotal, s = Math.sin(p * Math.PI); rx -= s * 0.7; ry += s * 0.3; py -= s * 0.12; }
    const bomba = m.getObjectByName('bomba');
    if (bomba) { const p = 1 - Math.max(0, cdArma) / cadenciaDe(a); bomba.position.z = -0.36 + (p > 0.35 && p < 0.75 ? Math.sin((p - 0.35) / 0.4 * Math.PI) * 0.1 : 0); }
    m.userData.flash.visible = flashT > 0; m.userData.flash.material.rotation = Math.random() * 6;
  } else {
    rx = -0.45; rz = 0.35;
    if (swingT > 0) {
      const p = 1 - swingT / cadenciaDe(a); // 0..1
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
let acum = 0, ultimo = performance.now();
const medidas = { cuadros: 0, msCPU: 0, t0: performance.now(), fps: 0, ms: 0 };
const cont = $('contador');
// Limitador: mide el ritmo real del rAF (lo que da la pantalla/navegador). Si el límite elegido es >= a ese ritmo,
// dibuja en TODOS los rAF; si es menor, usa un acumulador con tolerancia de medio cuadro para no perder cuadros por jitter.
let rafPrev = 0, rafDt = 16.7, limAcum = 0;
const raf = { n: 0, t0: performance.now(), max: 0, ventanas: 0, actual: 0 };
let limitado60 = false, cuadroN = 0, miraBlanco = false, camVictoria = false;
const hm = $('hitmark'), vin = $('vineta'), fd = $('flash-dano'), mira = $('mira'), rb = $('recarga-barra'), rbi = rb.firstChild;
function bucle(ahora) {
  requestAnimationFrame(bucle);
  const crudo = rafPrev ? ahora - rafPrev : rafDt; rafPrev = ahora;
  if (crudo > 0 && crudo < 100) rafDt += (crudo - rafDt) * 0.08;
  raf.n++;
  if (ahora - raf.t0 >= 1000) {
    raf.actual = raf.n * 1000 / (ahora - raf.t0); raf.n = 0; raf.t0 = ahora;
    if (!document.hidden) { raf.ventanas++; raf.max = Math.max(raf.max, raf.actual); }
    const quiereMas = AJ.fps === 0 || AJ.fps > 65;
    const lim = quiereMas && raf.ventanas >= 3 && raf.max <= 62 && raf.max >= 45; // ~60 fijo = tope del navegador, no falta de potencia
    if (lim !== limitado60) { limitado60 = lim; $('aviso-60').classList.toggle('oculto', !lim); }
  }
  if (AJ.fps > 0) {
    const intervalo = 1000 / AJ.fps;
    if (intervalo > rafDt * 1.08) {          // el límite es más bajo que la pantalla: saltear algunos rAF
      limAcum += crudo;
      if (limAcum < intervalo - rafDt * 0.5) return;
      limAcum -= intervalo;
      if (limAcum < -rafDt || limAcum > intervalo) limAcum = 0;
    } else limAcum = 0;                       // límite >= pantalla: se dibuja cada rAF
  }
  if (lienzo.clientWidth !== vistaW || lienzo.clientHeight !== vistaH) redimensionar();
  const c0 = performance.now();
  let dt = Math.min(0.25, (ahora - ultimo) / 1000); ultimo = ahora;
  if (estado === 'jugando' || estado === 'fin' || estado === 'inicio') {
    acum += dt; let pasos = 0;
    while (acum >= PASO && pasos < 30) { simular(PASO); acum -= PASO; pasos++; }
    if (pasos === 30) acum = 0;
  }
  if (estado === 'inicio') { // cámara paseando en el menú
    const t = ahora / 1000;
    aMundo(NM / 2 + Math.sin(t * 0.05) * 30, 1 + Math.sin(t * 0.08) * 5, J.pos); J.pos.y = piso(1);
    J.yaw = Math.sin(t * 0.11) * 0.9 + 0.2; J.pitch = 0.04 + Math.sin(t * 0.07) * 0.04;
  }
  if (camVictoria && estado === 'fin') { // gira despacio hacia el sol
    const yaw = Math.atan2(-0.13, 1); let d = yaw - J.yaw; d = Math.atan2(Math.sin(d), Math.cos(d));
    J.yaw += d * Math.min(1, dt * 0.8); J.pitch += (0.12 - J.pitch) * Math.min(1, dt * 0.8);
  }
  cuadroN++;
  // timers visuales
  flashT -= dt; hitT -= dt; shake *= Math.exp(-dt * 7); retroceso *= Math.exp(-dt * 9); flashDano = Math.max(0, flashDano - dt);
  if (mensajeT > 0) { mensajeT -= dt; if (mensajeT <= 0) $('mensaje').classList.remove('on'); }
  if (avisoT > 0) { avisoT -= dt; if (avisoT <= 0) $('aviso').style.opacity = 0; }
  if (estado === 'jugando' || estado === 'pausa' || estado === 'fin') {
    for (const f of flotantes) { if (f.t > 0) { f.t -= dt; f.d.style.opacity = Math.min(1, f.t * 2); f.d.style.transform = `translate(-50%, ${-60 - (0.9 - f.t) * 70}px)`; } else if (f.d.style.opacity !== '0') f.d.style.opacity = 0; }
    const hv = hitT > 0 ? 1 : 0; if (hm._v !== hv + hitTipo) { hm._v = hv + hitTipo; hm.style.opacity = hv; hm.className = hitTipo; }
    if (hitT > 0) hm.style.transform = `scale(${1 + Math.max(0, hitT) * (hitTipo === 'mata' ? 3 : 1.5)})`;
    vin.style.opacity = Math.max(vineta, J.vida < 30 && estado === 'jugando' ? 0.35 + Math.sin(tiempo * 5) * 0.15 : 0).toFixed(3);
    fd.style.opacity = (flashDano * 2).toFixed(2);
    const a = A(armaSel);
    rb.classList.toggle('on', recargaT > 0); if (recargaT > 0) rbi.style.width = ((1 - recargaT / recargaTotal) * 100).toFixed(1) + '%';
    mira.style.transform = `scale(${(1 + retroceso * 4 + J.mov * 0.3 + (a.tipo === 'fuego' ? a.disp * 8 : 0)).toFixed(3)})`;
    if (cuadroN % 3 === 0 && estado === 'jugando') { // la mira se pone roja sobre un zombi
      ojoJugador(_o, _f, _r, _u); rayo(_o, _f, a.tipo === 'fuego' ? a.alcance : a.alcance + 0.5, golpes);
      const b = golpes.length > 0 && rayoObstaculos(_o, _f, golpes[0].t + 0.1).t > golpes[0].t;
      if (b !== miraBlanco) { miraBlanco = b; mira.classList.toggle('blanco', b); }
    }
    for (const ind of indicadores) { // flecha roja hacia el que te pegó
      if (ind.t <= 0) { if (ind.d.style.opacity !== '0') ind.d.style.opacity = 0; continue; }
      ind.t -= dt; const ang = Math.atan2(ind.x - J.pos.x, ind.z - J.pos.z) - Math.atan2(-Math.sin(J.yaw), -Math.cos(J.yaw));
      ind.d.style.transform = `rotate(${(-ang * 180 / Math.PI).toFixed(1)}deg)`; ind.d.style.opacity = Math.min(1, ind.t).toFixed(2);
    }
    if (avisoPisoT > 0) { avisoPisoT -= dt; avisoPiso.material.opacity = 0.3 + 0.5 * (1 - avisoPisoT / avisoPisoTot); if (avisoPisoT <= 0) avisoPiso.visible = false; }
  }
  // música: la tensión sube con la oleada y con los zombis cerca
  if (cuadroN % 20 === 0) {
    let cerca = 0; for (const z of zombis) if (z.vivo && Math.abs(z.g.position.x - J.pos.x) + Math.abs(z.g.position.z - J.pos.z) < 14) cerca++;
    musica.set(estado === 'jugando' ? Math.min(1, oleada / OLEADAS_TOTAL * 0.7 + cerca * 0.05) : 0.05, !!jefe && estado === 'jugando', estado !== 'jugando');
  }
  // cámara
  camera.position.set(J.pos.x, J.pos.y + 1.65 + Math.sin(J.bob * 2) * 0.03 * J.mov, J.pos.z);
  camera.rotation.set(J.pitch + retroceso * 0.5 + (Math.random() - .5) * shake * 0.05, J.yaw + (Math.random() - .5) * shake * 0.05, (Math.random() - .5) * shake * 0.03);
  luzJugador.intensity = flashT > 0 ? 40 : 3.5;
  horda.dibujar(zombis);
  gSangre.attributes.position.needsUpdate = true;
  animarArma(dt);
  mundo.update(ahora / 1000, dt, renderer, J.pos);
  renderer.clear();
  renderer.render(scene, camera);
  const info = renderer.info.render, calls = info.calls, tris = info.triangles;
  renderer.clearDepth();
  if (estado === 'jugando' || estado === 'pausa' || estado === 'tienda') renderer.render(vmScene, vmCam);
  medidas.ultCalls = calls + (estado === 'inicio' || estado === 'fin' ? 0 : renderer.info.render.calls); medidas.ultTris = tris + renderer.info.render.triangles;
  medidas.cuadros++; medidas.msCPU += performance.now() - c0;
  if (ahora - medidas.t0 > 500) {
    medidas.fps = medidas.cuadros * 1000 / (ahora - medidas.t0); medidas.ms = medidas.msCPU / medidas.cuadros;
    if (AJ.contador) cont.textContent = `${medidas.fps.toFixed(0)} fps · ${medidas.ms.toFixed(1)} ms CPU · ${medidas.ultCalls} draws · ${(medidas.ultTris / 1000).toFixed(0)}k tris` + (limitado60 ? ' · el navegador limita a 60 (ver Ajustes)' : '');
    medidas.cuadros = 0; medidas.msCPU = 0; medidas.t0 = ahora;
  }
}
renderer.info.autoReset = true;
aplicarCalidad(); pintarAjustes(); setVolumen();
reiniciar(); estado = 'inicio'; poblarMenu(); mostrarRecord();
requestAnimationFrame(bucle);
requestAnimationFrame(() => requestAnimationFrame(() => { $('cargando').classList.add('fuera'); setTimeout(() => $('cargando').classList.add('oculto'), 700); }));
// la primera interacción arranca el audio (los navegadores lo exigen)
addEventListener('pointerdown', function arrancar() { iniciarAudio(); setVolumen(); musica.iniciar(); musica.set(0, false, true); removeEventListener('pointerdown', arrancar); });
// modo sin conexión / "Agregar a inicio"
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => { });

// ganchos para las pruebas automáticas
window.__rz = {
  get estado() { return estado; }, get oleada() { return oleada; }, set oleada(v) { oleada = v; }, get puntos() { return puntos; }, get bajas() { return bajas; },
  get pesos() { return pesos; }, set pesos(v) { pesos = v; hud(); }, get jefe() { return jefe && { tipo: jefe.tipo, vida: jefe.vida, max: jefe.vidaMax }; },
  get vida() { return J.vida; }, set vida(v) { J.vida = v; }, set dios(v) { dios = v; }, get arma() { return armaSel; }, get desbloq() { return [...tiene]; },
  get blindaje() { return J.blindaje; }, get ventajas() { return [...ventajas]; }, get niveles() { return JSON.parse(JSON.stringify(niveles)); },
  get vivos() { return zombis.filter(z => z.vivo).length; }, get porSalir() { return porSalir; }, get descanso() { return descanso; }, get S() { return S; }, perfil,
  get vista() { const v = new THREE.Vector2(); renderer.getSize(v); return { rw: v.x, rh: v.y, cw: lienzo.clientWidth, ch: lienzo.clientHeight, iw: innerWidth, ih: innerHeight, bw: renderer.domElement.width, bh: renderer.domElement.height }; },
  get medidas() { return { ...medidas, rafFps: raf.actual, rafMax: raf.max, limitado60 }; }, get pickups() { return poolPick.filter(p => p.t > 0).map(p => p.tipo); }, J, AJ,
  zombis: () => zombis.filter(z => z.vivo).map(z => ({ sube: z.sube, tipo: z.tipo, vida: z.vida, prep: z.prep, x: z.g.position.x, y: z.g.position.y, z: z.g.position.z, d: Math.hypot(z.g.position.x - J.pos.x, z.g.position.z - J.pos.z) })),
  apuntar(i = 0, cabeza = false) { // mira al zombi vivo más cercano (o al traído con traerZombi si i === 'traido')
    const v = i === 'traido' ? window.__rzZ : zombis.filter(z => z.vivo && !z.sube).sort((a, b) => a.g.position.distanceTo(J.pos) - b.g.position.distanceTo(J.pos))[i];
    if (!v) return false;
    const h = v.T.hit[cabeza ? 0 : 1], fx = Math.sin(v.g.rotation.y) * h[2] * v.esc, fz = Math.cos(v.g.rotation.y) * h[2] * v.esc;
    const dx = v.g.position.x + fx - J.pos.x, dz = v.g.position.z + fz - J.pos.z, dy = v.g.position.y + h[0] * v.esc - (J.pos.y + 1.65);
    J.yaw = Math.atan2(-dx, -dz); J.pitch = Math.atan2(dy, Math.hypot(dx, dz)); return true;
  },
  apuntarLibre(cabeza = false) { // el más cercano que no esté tapado por un auto
    const vs = zombis.filter(z => z.vivo && !z.sube).sort((a, b) => a.g.position.distanceTo(J.pos) - b.g.position.distanceTo(J.pos));
    for (let i = 0; i < vs.length; i++) { this.apuntar(i, cabeza); ojoJugador(_o, _f, _r, _u); const h = rayo(_o, _f, 200, []); if (h.length && rayoObstaculos(_o, _f, 200).t > h[0].t) return true; }
    return vs.length ? this.apuntar(0, cabeza) && false : false;
  },
  traerZombi(dist = 2, tipo) { const v = zombis.find(z => z.vivo && (!tipo || z.tipo === tipo)); if (!v) return false; _f.set(-Math.sin(J.yaw), 0, -Math.cos(J.yaw)); v.g.position.set(J.pos.x + _f.x * dist, J.pos.y, J.pos.z + _f.z * dist); v.sube = false; window.__rzZ = v; return { x: v.g.position.x, z: v.g.position.z, vida: v.vida, tipo: v.tipo }; },
  zombiPos() { const v = window.__rzZ; return v && { x: v.g.position.x, z: v.g.position.z, vida: v.vida, vivo: v.vivo, sinBrazo: [...v.sinBrazo], sinCabeza: v.sinCabeza }; },
  elegir: id => elegirArma(id), desbloquear: id => { tiene.add(id); const a = A(id); if (a.tipo === 'fuego') { cargador[id] = cargMax(a); reserva[id] = resMax(a); } armarBarra(); },
  set fuego(v) { disparando = v; }, recargar, ciclarArma, pausar, seguir, jugar, aMenu, cerrarTienda, abrirTienda,
  tab(t) { tab = t; pintarTienda(); },
  saltarA(n) { // salta a la oleada n (para probar jefes); limpia lo que haya
    for (const z of zombis) if (z.vivo) { z.vivo = false; z.muerteT = 4.9; } porSalir = 0; jefe = null; jefePendiente = null; $('jefe').classList.add('oculto');
    oleada = n - 1; descanso = 0.05; tiendaT = 0; if (estado === 'tienda') { ocultar('tienda'); estado = 'jugando'; }
  },
  spawn(tipo, cerca = true) { const z = spawn(tipo, cerca); if (z) { z.sube = false; window.__rzZ = z; } return !!z; },
  rayoPrueba() { ojoJugador(_o, _f, _r, _u); return rayo(_o, _f, 200, []).map(h => ({ t: h.t, cab: h.cab, yo: h.z === window.__rzZ })); },
  obstaculo() { ojoJugador(_o, _f, _r, _u); const c = rayoObstaculos(_o, _f, 200); return { t: c.t, metal: c.c && c.c.metal }; },
  get retroceso() { return retroceso; }, get colisiones() { return colisiones.length; },
  bench(n = 600) { // costo de CPU: simulación (paso fijo) + preparar el cuadro, sin el render de la GPU
    const t0 = performance.now(); for (let i = 0; i < n; i++) simular(PASO); const t1 = performance.now();
    for (let i = 0; i < 100; i++) { horda.dibujar(zombis); animarArma(1 / 120); mundo.update(i / 120, 1 / 120, renderer, J.pos); } const t2 = performance.now();
    return { msPorPaso: (t1 - t0) / n, msPrepCuadro: (t2 - t1) / 100, zombis: zombis.length };
  },
  bench2() { const r = {}; let t = performance.now();
    for (let i = 0; i < 100; i++) horda.dibujar(zombis); r.horda = (performance.now() - t) / 100; t = performance.now();
    for (let i = 0; i < 100; i++) animarArma(1 / 120); r.arma = (performance.now() - t) / 100; t = performance.now();
    for (let i = 0; i < 100; i++) mundo.update(i / 120, 1 / 120, renderer, J.pos); r.mundo = (performance.now() - t) / 100; return r; },
  dbgZ() { return zombis.filter(z => z.vivo).map(z => { const l = local(z.g.position.x, z.g.position.z, {}); return { tipo: z.tipo, i: l.i, d: +l.d.toFixed(2), y: +z.g.position.y.toFixed(2), prep: z.prep, at: z.ataque, atur: z.aturdido, vm: z.velMult, sube: z.sube, kb: z.kb.length(), cerca: colisiones.filter(c => Math.hypot(c.x - z.g.position.x, c.z - z.g.position.z) < c.r + 1.5).map(c => [c.r, +Math.hypot(c.x - z.g.position.x, c.z - z.g.position.z).toFixed(2)]), jl: local(J.pos.x, J.pos.z, {}) }; }); },
  herirTodos(n = 99999) { _d.set(0, 0, 1); for (const z of zombis.slice()) if (z.vivo) herir(z, n, false, _d, 1, false, 'pistola'); },
  mirarPunto(i, d, h = 40) { aMundo(i, d, _o); const dx = _o.x - J.pos.x, dz = _o.z - J.pos.z; J.yaw = Math.atan2(-dx, -dz); J.pitch = Math.atan2(h, Math.hypot(dx, dz)); },
  mirarA(yaw, pitch) { J.yaw = yaw; J.pitch = pitch; },
  despejar() { for (const z of zombis) if (z !== window.__rzZ && z.vivo) { z.g.position.x += 60; } },
  irAPickup() { const p = poolPick.find(p => p.t > 0); if (!p) return false; J.pos.x = p.g.position.x; J.pos.z = p.g.position.z; return true; },
  info: () => ({ calls: medidas.ultCalls, tris: medidas.ultTris, geos: renderer.info.memory.geometries, texs: renderer.info.memory.textures, progs: renderer.info.programs.length })
};
