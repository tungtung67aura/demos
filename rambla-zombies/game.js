// Rambla: Zona Cero — juego principal
import * as THREE from 'https://esm.sh/three@0.160.0';
import { crearMundo, local, aMundo, piso, NM, brilloTex, muestras, PUERTO_I0, unir } from './world.js';
import { crearFisica, rayoCaja, sacarPunto, adentro, crearGrillaDin } from './fisica.js';
import { ARMAS, crearModelos } from './armas.js';
import { modeloArma } from './armas-modelos.js'; // arte v8: modelos texturizados (null = usa el de armas.js)
import { Horda, crearZombi, prepararZombi, animarZombi, TIPOS } from './zombis.js';
import { iniciarAudio, sonido, volumen, musica } from './audio.js';
import { crearEfectos } from './efectos.js';
import { crearJefesFx, JEFES_INFO, ORDEN_JEFES } from './jefes.js';
import { MOD, SINERGIAS, RAREZA, calcular, ofrecer, cantidadInf, jefeInf, vidaInf, eventoInf, mezclaInf, EVENTOS } from './infinito.js';
import { MAPAS, ORDEN_MAPAS } from './mapas.js';
import { OLEADAS_TOTAL, mezcla, cantidad, JEFES, MEJORAS, precioMejora, EQUIPO, VENTAJAS, PESOS, LOGROS, cargarPerfil, guardarPerfil } from './datos.js';

const $ = id => document.getElementById(id);
const movil = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
if (movil) document.body.classList.add('es-movil');

// ---------- Ajustes ----------
const AJ = Object.assign({ fps: 0, calidad: movil ? 'media' : 'alta', sens: 1, contador: false, volumen: 0.7, musica: 0.5, invertir: false,
  asistencia: true, autoFuego: false, vibrar: true, botones: 1, modo: 'normal' }, JSON.parse(localStorage.getItem('rz-ajustes') || '{}'));
const CAL = {
  // rag: cuerpos simulados a la vez · cad: cadáveres en el piso · vidaCad: segundos antes de hundirse · charcos/gotas: sangre en el piso
  // decal: resolución de la textura de sangre por tramo de rambla (~20 m × 51 m)
  baja: { pr: 1, maxZ: 12, sangre: 160, olasLivianas: true, rag: 6, cad: 10, vidaCad: 12, charcos: 24, gotas: 48, decal: [256, 512], tramos: 8, vistaSangre: 55 },
  media: { pr: 1.5, maxZ: 16, sangre: 260, olasLivianas: true, rag: 9, cad: 14, vidaCad: 16, charcos: 40, gotas: 80, decal: [256, 512], tramos: 10, vistaSangre: 70 },
  alta: { pr: 2, maxZ: 22, sangre: 420, olasLivianas: false, rag: 12, cad: 20, vidaCad: 22, charcos: 64, gotas: 120, decal: [512, 1024], tramos: 12, vistaSangre: 90 }
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
const jfx = crearJefesFx(scene); // v8: efectos telegrafiados de los jefes nuevos
const fis = crearFisica(scene, mundo.colisiones, { alGolpe: golpeCuerpo, alDormir: charcoCuerpo, cuerpos: () => zombis });
const luzJugador = new THREE.PointLight(0xffd8a8, 3.5, 16, 1.5); camera.add(luzJugador); // linterna tenue + fogonazo

// arma en primera persona: escena aparte para que nunca atraviese paredes
const vmScene = new THREE.Scene(), vmCam = new THREE.PerspectiveCamera(60, 1, 0.01, 10);
vmScene.add(new THREE.HemisphereLight(0xa0b0e0, 0x403020, 2.2));
const vmLuz = new THREE.DirectionalLight(0xffd8b0, 2.2); vmLuz.position.set(1, 2, 1); vmScene.add(vmLuz);
const vmRelleno = new THREE.DirectionalLight(0x9ab4ff, 1.5); vmRelleno.position.set(-1.6, 0.7, 0.6); vmScene.add(vmRelleno); // luz de recorte fría del lado izquierdo: el arma no queda negra contra la noche
const vmFlashLuz = new THREE.PointLight(0xffb050, 0, 3); vmFlashLuz.position.set(0.2, 0, -0.8); vmScene.add(vmFlashLuz);
const soporte = new THREE.Group(); vmScene.add(soporte); soporte.scale.setScalar(0.8);
const modelos = crearModelos(modeloArma);
const texFlash = brilloTex('rgba(255,200,90,1)');
for (const a of ARMAS) {
  const m = modelos[a.id]; m.visible = false; soporte.add(m);
  if (a.tipo === 'fuego') {
    const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: texFlash, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    f.position.copy(m.userData.punta); f.scale.setScalar((a.id === 'escopeta' ? 0.5 : a.id === 'revolver' || a.id === 'rifle' ? 0.42 : 0.32) ); m.userData.flashE = f.scale.x; f.visible = false; m.add(f); m.userData.flash = f;
  }
}

function aplicarCalidad() {
  fis.config(CAL[AJ.calidad]);
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
function trazar(a, b, color = 0xffe0a0) {
  const tr = trazas[tIdx = (tIdx + 1) % trazas.length], p = tr.l.geometry.attributes.position.array;
  p[0] = a.x; p[1] = a.y; p[2] = a.z; p[3] = b.x; p[4] = b.y; p[5] = b.z;
  tr.l.geometry.attributes.position.needsUpdate = true; tr.t = color === 0xffe0a0 ? 0.06 : 0.12; tr.l.visible = true; tr.l.material.color.setHex(color);
}

// ---------- Pickups (balas y chivitos que sueltan los zombis) — pool fijo, sin crear mallas en juego ----------
// Instanciados: 2 mallas (cajas de balas, chivitos) + 1 nube de puntos para el brillo, sin importar cuántos haya (antes 3-5 draw calls por pickup)
function geoPickup(tipo) {
  const pz = (w, h, d, y, hex) => { const g = new THREE.BoxGeometry(w, h, d).translate(0, y, 0).toNonIndexed(), c = new THREE.Color(hex), n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3); g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; };
  return tipo === 'chivito' ? unir([pz(0.5, 0.1, 0.32, 0.05, 0xd9a050), pz(0.46, 0.06, 0.3, 0.13, 0x6a3018), pz(0.2, 0.03, 0.2, 0.17, 0xfff6e0), pz(0.5, 0.1, 0.32, 0.23, 0xd9a050)])
    : unir([pz(0.5, 0.35, 0.5, 0.18, 0x3f6a2c), pz(0.52, 0.08, 0.52, 0.18, 0x222222)]);
}
const PICK_MAX = 6, matPick = new THREE.MeshStandardMaterial({ vertexColors: true, emissive: 0x0a1400 });
const imPick = { balas: new THREE.InstancedMesh(geoPickup('balas'), matPick, PICK_MAX), chivito: new THREE.InstancedMesh(geoPickup('chivito'), matPick, PICK_MAX) };
for (const k in imPick) { imPick[k].count = 0; imPick[k].frustumCulled = false; scene.add(imPick[k]); }
const glowPick = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(PICK_MAX * 6), 3)).setAttribute('color', new THREE.BufferAttribute(new Float32Array(PICK_MAX * 6), 3)),
  new THREE.PointsMaterial({ map: brilloTex('rgba(255,255,255,1)'), size: 2.2 / Math.tan(THREE.MathUtils.degToRad(35)), vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
glowPick.frustumCulled = false; scene.add(glowPick);
const COL_GLOW = { balas: new THREE.Color(0.47, 1, 0.47), chivito: new THREE.Color(1, 0.35, 0.35) };
function mallaPickup() { const g = new THREE.Object3D(); g.visible = false; return g; } // solo guarda posición/giro: se dibuja instanciado
function dibujarPickups() {
  const n = { balas: 0, chivito: 0 }, gp = glowPick.geometry.attributes.position, gc = glowPick.geometry.attributes.color; let q = 0;
  for (const p of poolPick) {
    if (!p.g.visible) continue;
    p.g.updateMatrix(); imPick[p.tipo].setMatrixAt(n[p.tipo]++, p.g.matrix);
    gp.setXYZ(q, p.g.position.x, p.g.position.y + 0.6, p.g.position.z); const c = COL_GLOW[p.tipo]; gc.setXYZ(q, c.r, c.g, c.b); q++;
  }
  for (const k in imPick) { imPick[k].count = n[k]; imPick[k].instanceMatrix.needsUpdate = true; }
  glowPick.geometry.setDrawRange(0, q); glowPick.visible = q > 0; gp.needsUpdate = gc.needsUpdate = true;
}
const poolPick = [];
for (let i = 0; i < PICK_MAX; i++) { poolPick.push({ g: mallaPickup('balas'), tipo: 'balas', t: 0 }); poolPick.push({ g: mallaPickup('chivito'), tipo: 'chivito', t: 0 }); }
function soltarPickup(tipo, x, z) {
  const p = poolPick.find(p => p.t <= 0 && p.tipo === tipo); if (!p) return;
  const l = local(x, z);
  p.g.position.set(x, piso(l.d), z); p.g.visible = true; p.t = 25;
}

// ---------- Estado del juego ----------
const MAXZ = 56; // vivos + cadáveres en el piso
const horda = new Horda(scene, MAXZ);
const poolZ = []; for (let i = 0; i < MAXZ; i++) poolZ.push(crearZombi());
let zombis = [];
const J = { pos: new THREE.Vector3(), yaw: 0, pitch: 0, vida: 100, vidaMax: 100, blindaje: 0, velY: 0, bob: 0, mov: 0, lento: 0 };
let dios = false, estado = 'inicio', oleada = 0, puntos = 0, pesos = 0, bajas = 0, porSalir = 0, spawnT = 0, descanso = 0, tiempo = 0;
let modoInf = false, armasInf = ['pistola', 'termo'], modsInf = {}, statsInf = {}, regenInf = 0, eventoInfAct = null, tiradasInf = 0, opcionesInf = [], modsHecho = false, explT = 0; /* Modo Infinito */
let modoPlay = false, cfgPlay = null; /* Modo Playground (sandbox) */
const colaExpl = [];
let armaSel = 'pistola', tiene = new Set(), cargador = {}, reserva = {}, niveles = {}, ventajas = new Set();
let cdArma = 0, recargaT = 0, recargaTotal = 1, cambioT = 0, swingT = 0, swingHecho = true, disparando = false, autoDisparo = false;
let parada = 0, lenta = 0, camGolpeP = 0, camGolpeR = 0; // hit-stop, cámara lenta, patada de cámara
let shake = 0, retroceso = 0, kick = 0, flashT = 0, hitT = 0, hitTipo = '', vineta = 0, flashDano = 0, swayX = 0, swayY = 0, lookDX = 0, lookDY = 0;
let jefe = null, jefePendiente = null, jefeT = 0, comboN = 0, comboT = 0, finT = 0, tiendaT = 0;
let S = {}; // estadísticas de la partida
const BASE = id => ARMAS.find(a => a.id === id);
const A = id => (modoInf && statsInf[id]) || BASE(id); /* en Infinito: estadísticas con mods */
const jefeDe = n => { if (!modoPlay) return modoInf ? jefeInf(n) : JEFES[n]; if (!cfgPlay.jefes) return null; const cada = cfgPlay.jefeCada || 3; if (n % cada) return null; const L = (cfgPlay.jefesTipos && cfgPlay.jefesTipos.length) ? cfgPlay.jefesTipos : ORDEN_JEFES; return L[(n / cada - 1) % L.length]; };
let LIM_I0 = NM / 2 - 70, LIM_I1 = NM / 2 + 128, MAPA = MAPAS.rambla;
const mapaLibre = M => modoPlay || (perfil.mejorOleada || 0) >= M.desbloq; /* U4: se suma el Puerto del Buceo */
const DIF_PLAY = { facil: { vida: 0.6, dano: 0.5, pesos: 1, vel: 0.85 }, normal: { vida: 1, dano: 1, pesos: 1, vel: 1 }, dificil: { vida: 1.6, dano: 1.5, pesos: 1, vel: 1.12 }, infierno: { vida: 2.6, dano: 2.2, pesos: 1, vel: 1.25 } };
const MODO_PES = { vida: 1.5, dano: 1.4, pesos: 1.25 }, MODO_NOR = { vida: 1, dano: 1, pesos: 1 }; // fijos: MODO() no crea objetos por llamada
const MODO = () => modoPlay ? DIF_PLAY[cfgPlay.dif] || DIF_PLAY.normal : AJ.modo === 'pesadilla' ? MODO_PES : MODO_NOR;

// stats de arma con mejoras y ventajas
const nv = (id, k) => (niveles[id] && niveles[id][k]) || 0;
const danoDe = a => a.dano * (1 + 0.2 * nv(a.id, 'dano')) * (a.tipo === 'cuerpo' && ventajas.has('garra') ? 1.35 : 1);
const cargMax = a0 => { const a = A(a0.id); return Math.round(a.cargador * (1 + 0.3 * nv(a.id, 'cargador'))); };
const resMax = a0 => { const a = A(a0.id); return a.reserva === Infinity ? Infinity : Math.round(a.reserva * (1 + 0.3 * nv(a.id, 'cargador'))); };
const tRecarga = a => a.recarga * (1 - 0.2 * nv(a.id, 'recarga')) * (ventajas.has('manos') ? 0.7 : 1);
const cadenciaDe = a => a.cadencia / (1 + 0.15 * nv(a.id, 'cadencia'));
const empujeDe = a => (a.empuje || 0) * (a.tipo === 'cuerpo' && ventajas.has('garra') ? 1.35 : 1);

const _vm = new THREE.Vector3();
function reiniciar() {
  camVictoria = false;
  for (const z of zombis) poolZ.push(z); zombis = [];
  for (const p of poolPick) { p.t = 0; p.g.visible = false; }
  ef.limpiar(); jfx.limpiar(); fis.limpiar(); sVida.fill(0); sPos.fill(-999); parada = 0; lenta = 0;
  MAPA = MAPAS[modoPlay ? cfgPlay.mapa : perfil.mapa] || MAPAS.rambla; if (!modoPlay && !mapaLibre(MAPA)) MAPA = MAPAS.rambla;
  LIM_I0 = MAPA.i0; LIM_I1 = MAPA.i1; mundo.setAtmo(MAPA.atmo, MAPA.id);
  camera.far = MAPA.atmo.lejos || 2200; camera.updateProjectionMatrix(); /* con niebla espesa no se dibuja lo que no se ve */
  aMundo(MAPA.ini, MAPA.iniD ?? 2, J.pos); J.pos.y = piso(MAPA.iniD ?? 2); eventoPuerto = false; GRITO[2] = -1; mundo.puerto.cerrar();
  J.yaw = 0; J.pitch = -0.03; if (MAPA.mirar) { aMundo(MAPA.mirar[0], MAPA.mirar[1], _vm); J.yaw = Math.atan2(-(_vm.x - J.pos.x), -(_vm.z - J.pos.z)); J.pitch = 0.05; } // de entrada, mirando a lo que identifica el mapa
  J.vidaMax = 100; J.vida = 100; J.blindaje = 0; J.lento = 0;
  oleada = 0; puntos = 0; pesos = 0; bajas = 0; porSalir = 0; descanso = 2.5; tiempo = 0; jefe = null; jefePendiente = null; tiendaT = 0; comboN = 0; comboT = 0;
  tiene = new Set(modoPlay ? cfgPlay.armas : modoInf ? armasInf : ['pistola', 'termo']); dios = modoPlay && cfgPlay.invencible; niveles = {}; ventajas = new Set();
  modsInf = {}; regenInf = 0; tiradasInf = 0; eventoInfAct = null; modsHecho = false; colaExpl.length = 0; scene.fog.density = MAPA.atmo.densidad; recalcInf();
  for (const a0 of ARMAS) if (a0.tipo === 'fuego') { const a = A(a0.id); cargador[a.id] = cargMax(a); reserva[a.id] = a.reserva === Infinity ? Infinity : a.cargador * 2; }
  if (modoPlay && cfgPlay.municion) for (const a0 of ARMAS) if (a0.tipo === 'fuego') reserva[a0.id] = Infinity;
  if (modoPlay) pesos = 99999;
  S = { disparos: 0, aciertos: 0, cabezas: 0, recibido: 0, gastado: 0, porArma: {}, olaSinDano: true, explosionMax: 0, inicio: performance.now(), jefes: 0, logrosNuevos: [] };
  armaSel = ''; elegirArma(tiene.has('pistola') ? 'pistola' : [...tiene][0], true); recargaT = 0; vineta = 0;
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
  if (a.id === 'revolver') { ojoJugador(_o, _f, _r, _u); const n = cargMax(a) - cargador[a.id]; for (let k = 0; k < n; k++) ef.vaina(_o.x + _r.x * 0.15 + _f.x * 0.3, _o.y - 0.2, _o.z + _r.z * 0.15 + _f.z * 0.3, (Math.random() - .5) * 0.8, -0.5, (Math.random() - .5) * 0.8, false); }
}

const _o = new THREE.Vector3(), _d = new THREE.Vector3(), _r = new THREE.Vector3(), _u = new THREE.Vector3(), _f = new THREE.Vector3(), _fin = new THREE.Vector3(), _u2 = new THREE.Vector3(), _p = new THREE.Vector3();
// rayo contra las esferas de cada zombi (cabeza / torso / piernas; el gateador las tiene acostadas)
const poolGolpe = Array.from({ length: 128 }, () => ({ z: null, t: 0, cab: false, parte: 1 })), porT = (a, b) => a.t - b.t; let nGolpe = 0;
function rayo(o, d, alcance, out, extra = 1) {
  out.length = 0;
  for (const z of zombis) {
    if (!z.vivo) continue;
    const p = z.g.position, e = z.esc, fx = Math.sin(z.g.rotation.y), fz = Math.cos(z.g.rotation.y), H = z.T.hit;
    let mejor = Infinity, cab = false, parte = 1;
    for (let k = 0; k < 3; k++) {
      if (k === 0 && z.sinCabeza) continue;
      const h = H[k], cy = p.y + h[0] * e, r = h[1] * e * extra * (movil ? 1.15 : 1);
      const ox = p.x + fx * h[2] * e - o.x, oy = cy - o.y, oz = p.z + fz * h[2] * e - o.z;
      const tc = ox * d.x + oy * d.y + oz * d.z; if (tc < 0) continue;
      const d2 = ox * ox + oy * oy + oz * oz - tc * tc; if (d2 > r * r) continue;
      const t = tc - Math.sqrt(r * r - d2);
      if (t < mejor) { mejor = t; cab = k === 0; parte = k; }
    }
    if (mejor < alcance) { const h = poolGolpe[nGolpe++ & 127]; h.z = z; h.t = mejor; h.cab = cab; h.parte = parte; out.push(h); } /* sin crear objetos por tiro */
  }
  if (out.length > 1) out.sort(porT);
  return out;
}
// rayo contra autos, contenedores, bancos (cilindros con techo): devuelve la distancia o Infinity
// autos, ómnibus, contenedores y bancos usan su caja real (la bala que pasa por la esquina sigue de largo);
// palmeras y parada, cilindros. Deja la normal de la superficie para chispas y marcas.
const choque = { t: Infinity, c: null, nx: 0, ny: 1, nz: 0 }, _lr = {}, _nc = { x: 0, y: 0, z: 0 };
let rayoN = 0;
const bajoPiso = (o, d, t) => o.y + d.y * t < piso(local(o.x + d.x * t, o.z + d.z * t, _lr).d);
function rayoObstaculos(o, d, alcance) {
  choque.t = Infinity; choque.c = null; rayoN++;
  const a = d.x * d.x + d.z * d.z;
  if (a > 1e-8) for (const c of colisiones) {
    const rb = c.cajas ? c.rb : c.r;
    const ox = o.x - c.x, oz = o.z - c.z, b = ox * d.x + oz * d.z, cc = ox * ox + oz * oz - rb * rb;
    const disc = b * b - a * cc; if (disc < 0) continue;
    let t = (-b - Math.sqrt(disc)) / a; if (t < 0) { if (cc < 0) t = 0; else continue; }
    if (t > alcance || t >= choque.t) continue;
    if (c.cajas) {
      for (const k of c.cajas) {
        if (k.rayo === rayoN) continue; k.rayo = rayoN; // el ómnibus comparte su caja entre varios círculos
        const tk = rayoCaja(o.x, o.y, o.z, d.x, d.y, d.z, k, _nc);
        if (tk < choque.t && tk <= alcance) { choque.t = tk; choque.c = c; choque.nx = _nc.x; choque.ny = _nc.y; choque.nz = _nc.z; }
      }
      continue;
    }
    if (o.y + d.y * t > c.top) continue;
    choque.t = t; choque.c = c;
    const hx = o.x + d.x * t - c.x, hz = o.z + d.z * t - c.z, l = Math.hypot(hx, hz) || 1; choque.nx = hx / l; choque.ny = 0; choque.nz = hz / l;
  }
  // el piso y el muro también frenan (tiros hacia abajo): se marcha por el rayo y se afina con bisección
  if (d.y < -0.005) {
    const tMax = Math.min(alcance, choque.t, (o.y + 1.2) / -d.y);
    let tPrev = 0;
    for (let t = 0.5; t < tMax; t += 0.4) {
      if (bajoPiso(o, d, t)) {
        let lo = tPrev, hi = t;
        for (let k = 0; k < 7; k++) { const m = (lo + hi) * 0.5; if (bajoPiso(o, d, m)) hi = m; else lo = m; }
        choque.t = hi; choque.c = null;
        const dHi = local(o.x + d.x * hi, o.z + d.z * hi, _lr).d, iHi = _lr.i, fHi = piso(dHi);
        const dLo = local(o.x + d.x * lo, o.z + d.z * lo, _lr).d, fLo = piso(dLo);
        if (fHi > fLo + 0.05 && o.y + d.y * lo < fHi) { const n = muestras[iHi].n, sg = dLo > dHi ? 1 : -1; choque.nx = n.x * sg; choque.ny = 0; choque.nz = n.z * sg; } // costado del muro / cordón
        else { choque.nx = 0; choque.ny = 1; choque.nz = 0; }
        break;
      }
      tPrev = t;
    }
  }
  return choque;
}
// rayo contra cadáveres (pecho y cadera): se les puede seguir pegando y reaccionan
let cadT = Infinity;
function rayoCadaver(o, d, tMax) {
  let mejor = null; cadT = tMax;
  for (const z of zombis) {
    if (z.vivo || z.hundir) continue;
    const P = fis.puntos(z); if (!P) continue;
    for (let s = 0; s < 2; s++) {
      const i = s ? 0 : 6, cx = (P[i] + P[i + 3]) * 0.5, cy = (P[i + 1] + P[i + 4]) * 0.5, cz = (P[i + 2] + P[i + 5]) * 0.5, r = 0.27 * z.esc;
      const ox = cx - o.x, oy = cy - o.y, oz = cz - o.z, tc = ox * d.x + oy * d.y + oz * d.z; if (tc < 0) continue;
      const d2 = ox * ox + oy * oy + oz * oz - tc * tc; if (d2 > r * r) continue;
      const t = tc - Math.sqrt(r * r - d2); if (t < cadT) { cadT = t; mejor = z; }
    }
  }
  return mejor;
}
const _candG = new Array(24).fill(null);
const colisionarPunto = (P, r, yPrev) => { let res = 0; const n = fis.grilla.buscar(P[0], P[2], r, _candG); for (let q = 0; q < n; q++) res = sacarPunto(P, 0, r, yPrev, _candG[q]) || res; return res; };
// impacto: dónde pegó el golpe que mata (para repartir el empujón del ragdoll); perdigonesN: cuántos perdigones de la escopeta entraron
let impacto = null, perdigonesN = 1, nAcum = 0;
const poolAcum = []; for (let i = 0; i < 16; i++) poolAcum.push({ d: 0, cab: false, t: 0, parte: 1, n: 0, p: new THREE.Vector3() });
const _imp = new THREE.Vector3(), _px4 = new Uint8Array(4);
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
  cargador[a.id]--; cdArma = cadenciaDe(a); S.disparos++; oir(J.pos.x, J.pos.z, (a.id === 'rifle' ? 70 : a.id === 'escopeta' ? 55 : 45) * (a.ruido || 1));
  const suerte = a.suerte && cargador[a.id] === 0; /* Infinito: la última del tambor */
  ojoJugador(_o, _f, _r, _u); // la bala sale antes de que el retroceso levante la mira
  sonido[a.sonido](); flashT = 0.05; kick = 1; retroceso += a.retroceso; shake = Math.max(shake, a.retroceso * 0.8);
  { const fl = modelos[a.id].userData.flash; fl.scale.setScalar(fl.userData.e || (fl.userData.e = fl.scale.x)); fl.scale.multiplyScalar((0.8 + Math.random() * 0.45) * (a.flash ?? 1)); } // fogonazo distinto cada tiro
  if (a.proyectil) { dispararProyectil(a); return; }
  if (a.id !== 'revolver' && !a.sinVaina) ef.vaina(_o.x + _r.x * 0.25 + _f.x * 0.55, _o.y - 0.22, _o.z + _r.z * 0.25 + _f.z * 0.55, _r.x * 2.4 + _f.x * 0.4 + (Math.random() - .5) * 0.6, 1.1 + Math.random() * 0.6, _r.z * 2.4 + _f.z * 0.4 + (Math.random() - .5) * 0.6, a.id === 'escopeta');
  if (a.id === 'escopeta' || a.id === 'rifle') vibrar(25);
  danoAcum.clear();
  let acerto = false, rebotes = 0, maderas = 0, piedras = 0;
  for (let p = 0; p < a.perdigones; p++) {
    const ang = Math.random() * Math.PI * 2, rad = a.disp * Math.sqrt(Math.random()) * (J.mov > 0.5 ? 1.5 : 1);
    _d.copy(_f).addScaledVector(_r, Math.cos(ang) * rad).addScaledVector(_u, Math.sin(ang) * rad).normalize();
    rayo(_o, _d, a.alcance, golpes, movil && AJ.asistencia ? 1.2 : 1);
    const ob = rayoObstaculos(_o, _d, a.alcance);
    let fin = Math.min(a.alcance * 0.6, ob.t);
    const n = Math.min(golpes.length, a.atraviesa || 1);
    for (let k = 0; k < n; k++) {
      const h = golpes[k]; if (h.t > ob.t) break; // el auto se comió la bala
      const mult = (h.cab ? (a.perdigones > 1 ? 1.4 : 2.3) * (ventajas.has('ojo') ? 1.5 : 1) * (a.cabeza || 1) : 1) * (suerte ? 3 : 1);
      let prev = danoAcum.get(h.z);
      if (!prev) { prev = poolAcum[nAcum++ % poolAcum.length]; prev.d = 0; prev.cab = false; prev.t = h.t; prev.parte = h.parte; prev.n = 0; prev.p.copy(_o).addScaledVector(_d, h.t); danoAcum.set(h.z, prev); }
      prev.d += danoDe(a) * mult; prev.cab = prev.cab || h.cab; if (h.parte === 0) prev.parte = 0; prev.n++;
      fin = h.t; acerto = true;
      _fin.copy(_o).addScaledVector(_d, h.t);
      salpicar(_fin.x, _fin.y, _fin.z, h.cab ? 10 : 5, 3, _d.x * 3, _d.z * 3);
    }
    // ¿le pegó a un cadáver antes que a otra cosa? reacciona y salpica
    if (!n || golpes[0].t > ob.t) {
      const cz = rayoCadaver(_o, _d, Math.min(ob.t, a.alcance * 0.6));
      if (cz) {
        fin = cadT; _fin.copy(_o).addScaledVector(_d, cadT);
        salpicar(_fin.x, _fin.y, _fin.z, 6, 2.5, _d.x * 2, _d.z * 2);
        if (cz.tiro !== S.disparos) { cz.tiro = S.disparos; patearCadaver(cz, _d, a.id === 'escopeta' ? 3.5 : a.id === 'rifle' ? 2.5 : 1.4, _fin); if (Math.random() < 0.5) sonido.carne(); }
      }
    }
    if (fin === ob.t && ob.t < a.alcance && (!golpes.length || golpes[0].t > ob.t)) { // chispazo y marca contra el obstáculo
      _fin.copy(_o).addScaledVector(_d, ob.t);
      const c = ob.c, mat = c ? (c.metal ? 'metal' : c.madera ? 'madera' : 'piedra') : 'piedra';
      if (p % 3 === 0) {
        ef.impacto(_fin, ob.nx, ob.nz, mat, ob.ny, pisoEn(_fin.x + ob.nx * 0.3, _fin.z + ob.nz * 0.3));
        fis.marcas.marca(_fin, ob.nx, ob.ny, ob.nz, mat === 'metal' ? 0 : mat === 'madera' ? 1 : 2);
      }
      if (mat === 'metal') rebotes++; else if (mat === 'madera') maderas++; else piedras++;
    }
    if (p < 3) { _fin.copy(_o).addScaledVector(_d, fin); _u2.copy(_o).addScaledVector(_r, 0.15).addScaledVector(_u, -0.12).addScaledVector(_f, 0.5); trazar(_u2, _fin); }
  }
  if (rebotes) Math.random() < 0.5 ? sonido.rebote() : sonido.chapa();
  if (maderas) sonido.madera(); else if (piedras && !rebotes) sonido.piedra();
  if (acerto) S.aciertos++;
  danoAcum.forEach((v, z) => { impacto = v.p; perdigonesN = v.n; herir(z, v.d, v.cab, _f, a.empuje || (a.id === 'rifle' ? 2 : 0.6), false, a.id, v.parte); if (a.aturde && z.vivo && !z.T.jefe) { z.aturdido = Math.max(z.aturdido, a.aturde); z.prep = 0; } if (modoInf) { impacto = null; alPegar(z, a, v.p, suerte); } });
  impacto = null; perdigonesN = 1;
  if (cargador[a.id] === 0 && reserva[a.id] > 0) setTimeout(() => { if (armaSel === a.id && estado === 'jugando') recargar(); }, 250);
}

// v8: armas que tiran un proyectil (lanzagarrafas en arco, bengala casi recta): apunta a lo primero que cruza la mira
function dispararProyectil(a) {
  rayo(_o, _f, a.alcance, golpes, 1); const ob = rayoObstaculos(_o, _f, a.alcance);
  let t = Math.min(a.alcance, ob.t); if (golpes.length && golpes[0].t < t) t = golpes[0].t;
  t = Math.max(2.5, t);
  _fin.copy(_o).addScaledVector(_f, t); const yp = pisoEn(_fin.x, _fin.z); if (_fin.y < yp) _fin.y = yp;
  _u2.copy(_o).addScaledVector(_r, 0.14).addScaledVector(_u, -0.08).addScaledVector(_f, 0.7);
  const garrafa = a.proyectil === 'garrafa', vuelo = garrafa ? Math.max(0.35, t / 24) : Math.max(0.12, t / 42);
  ef.lanzar(a.proyectil, _u2, _fin, vuelo, garrafa ? 40 : 16, a.radio || 2.4, yp, true, garrafa ? 9 : 3);
  if (garrafa) vibrar(40);
  if (cargador[a.id] === 0 && reserva[a.id] > 0) setTimeout(() => { if (armaSel === a.id && estado === 'jugando') recargar(); }, 300);
}
function golpear() { // cuerpo a cuerpo: arranca el swing, el impacto llega al 40%
  const a = A(armaSel);
  cdArma = cadenciaDe(a); swingT = cdArma; swingHecho = false; sonido.swing();
}
function impactoMelee() {
  const a = A(armaSel); oir(J.pos.x, J.pos.z, 12);
  _f.set(-Math.sin(J.yaw), 0, -Math.cos(J.yaw));
  let alguno = false, nGolpes = 0;
  const lista = a.atraviesa ? zombis.filter(z => z.vivo).sort((u, v) => u.g.position.distanceToSquared(J.pos) - v.g.position.distanceToSquared(J.pos)) : zombis; // el espeto: los más cercanos primero
  for (const z of lista) {
    if (!z.vivo) continue;
    const dx = z.g.position.x - J.pos.x, dz = z.g.position.z - J.pos.z, dist = Math.hypot(dx, dz);
    if (dist > a.alcance + 0.35 * z.esc) continue;
    if ((dx * _f.x + dz * _f.z) / (dist || 1) < Math.cos(a.arco + 0.25)) continue;
    if (a.atraviesa && nGolpes++ >= a.atraviesa) break;
    _d.set(dx / (dist || 1), 0, dz / (dist || 1));
    const cab = (J.pitch > 0.15 && a.id === 'machete') || (z.tipo === 'gateador' && a.id !== 'machete' && J.pitch < -0.3);
    const parte = z.tipo === 'gateador' ? (J.pitch < -0.3 ? 0 : 1) : J.pitch > 0.15 ? 0 : J.pitch < -0.32 ? 2 : 1;
    if (parte === 0 && a.id !== 'machete') sonido.crujido();
    impacto = _imp.set(z.g.position.x - _d.x * 0.25 * z.esc, z.g.position.y + (parte === 0 ? 1.65 : parte === 2 ? 0.5 : 1.15) * z.esc, z.g.position.z - _d.z * 0.25 * z.esc);
    herir(z, danoDe(a), cab, _d, empujeDe(a), true, a.id, parte); impacto = null;
    if (a.engancha && z.vivo && !z.T.jefe) { z.aturdido = Math.max(z.aturdido, 0.8); z.prep = 0; if (dist > 1.8) { z.kb.x -= _d.x * Math.min(9, (dist - 1.2) * 3.2); z.kb.z -= _d.z * Math.min(9, (dist - 1.2) * 3.2); } } // la caña: lo trae para vos
    if (modoInf) alPegar(z, a, _imp, false);
    salpicar(z.g.position.x, z.g.position.y + 1.3 * z.esc, z.g.position.z, 12, 4, _d.x * 3, _d.z * 3);
    alguno = true;
  }
  if (alguno) {
    sonido[a.sonido](); shake = Math.max(shake, 0.35); kick = 0.6; vibrar(30); S.aciertos++;
    // golpe con peso: el juego se frena un instante y la cámara acompaña el impacto
    const pesada = a.id === 'sarten' || a.id === 'bate';
    parada = Math.max(parada, pesada ? 0.05 : 0.035);
    camGolpeR += (pesada ? 0.055 : 0.035) * (Math.random() < 0.75 ? 1 : -1); camGolpeP -= pesada ? 0.03 : 0.018;
  }
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
  fis.sangre.gota(_fin.x + dir.x * 0.4, _fin.z + dir.z * 0.4, 0.3, z.cSangre);
}
function herir(z, dano, cab, dir, empuje, melee, arma, parte = cab ? 0 : 1) {
  if (!z.vivo) return;
  if (z.aturdido > 0 && z.tipo === 'patovica') dano *= 1.6; // golpeado contra un auto: punto débil
  if (z.tipo === 'garrafero' && z.cargaG > 0) z.rackDano += dano;
  if (z.enganche > 0) z.engDano += dano; // si le pegás mientras te arrastra, te suelta // con la carga prendida, las garrafas de la espalda son el punto débil
  if (z.aturdido > 0 && (z.tipo === 'garrafero' || z.tipo === 'lubolo')) dano *= 1.4;
  z.vida -= dano; z.flash = 0.1;
  const jefeZ = z.T.jefe;
  z.velMult = jefeZ ? 0.8 : melee ? 0.1 : 0.45;
  z.flinch = Math.min(jefeZ ? 0.05 : 0.22, 0.05 + dano / z.vidaMax * 0.5);
  if (melee && !jefeZ && z.prep > 0 && empuje > 8) z.prep = 0; // un buen golpe interrumpe el ataque
  // reacción según dónde pegó (los jefes y el tanque casi ni se mueven)
  if (!z.sube) {
    const fuerza = Math.min(1, 0.35 + dano / Math.max(40, z.vidaMax * 0.6)), red = jefeZ ? 0.3 : z.tipo === 'tanque' ? 0.6 : 1;
    if (parte === 0) { z.snap = Math.min(1, z.snap + (0.55 + fuerza * 0.45) * red); z.snapDir.x = Math.random() < 0.5 ? -1 : 1; }
    else if (parte === 2 && !jefeZ) {
      z.tropiezo = 0.6 * red; z.tropLado = Math.random() < 0.5 ? 0 : 1; z.velMult = Math.min(z.velMult, 0.12);
      z.danoPiernas += dano; if (!z.rengo && z.tipo !== 'gateador' && z.danoPiernas > z.vidaMax * 0.3) z.rengo = 1 + Math.random();
    } else {
      const fx = Math.sin(z.g.rotation.y), fz = Math.cos(z.g.rotation.y);
      z.tamb = (0.2 + fuerza * 0.15) * red; z.tambLado = (fx * dir.z - fz * dir.x) > 0 ? 1 : -1;
    }
  }
  // la sangre queda en el piso, detrás del zombi
  if (!z.sube && Math.random() < (melee ? 0.9 : 0.55)) {
    const dl = Math.hypot(dir.x, dir.z) || 1, k = (melee ? 0.4 : 0.6) + Math.random() * (melee ? 0.6 : 1.2);
    fis.sangre.gota(z.g.position.x + dir.x / dl * k, z.g.position.z + dir.z / dl * k, (0.16 + Math.random() * 0.22) * Math.min(1.6, z.esc), z.cSangre);
  }
  const kbm = jefeZ ? 0.05 : z.tipo === 'tanque' ? 0.35 : 1;
  z.kb.x += dir.x * empuje * kbm; z.kb.z += dir.z * empuje * kbm;
  hitT = 0.12; hitTipo = cab ? 'cab' : '';
  if (!melee) cab ? sonido.cabeza() : sonido.carne();
  // desmembrar: escopetazo, rifle o machete pueden arrancar un brazo
  if (!jefeZ && z.vida > 0 && (arma === 'machete' ? Math.random() < 0.4 : dano >= 60 && Math.random() < 0.35)) cortarBrazo(z, Math.random() < 0.5 ? 0 : 1, dir);
  if (jefeZ) { hudJefe(); }
  if (z.vida <= 0) matar(z, cab, dir, melee, arma, false, parte);
}
function matar(z, cab, dir, melee, arma, porExplosion, parte = cab ? 0 : 1) {
  z.vivo = false; z.muerteT = 0; hitT = 0.25; hitTipo = 'mata'; z.quemaT = 0;
  if (modoInf && arma && statsInf[arma]) alMatar(z, statsInf[arma]);
  const fx = Math.sin(z.g.rotation.y), fz = Math.cos(z.g.rotation.y);
  z.caida = (fx * dir.x + fz * dir.z) > 0 ? -1 : 1;
  const T = z.T;
  let p = T.puntos, txt = '';
  if (cab && !T.jefe) {
    p += 50; txt = '¡A la cabeza!'; S.cabezas++;
    if (z.tipo !== 'tanque' || Math.random() < 0.6) {
      z.sinCabeza = true; z.cab.getWorldPosition(_p);
      ef.gib(_p, _gv.set(dir.x * 3 + (Math.random() - .5) * 2, 5, dir.z * 3 + (Math.random() - .5) * 2), z.cPiel, true);
      salpicar(_p.x, _p.y, _p.z, 30, 5); sonido.crujido();
      fis.sangre.gota(_p.x + dir.x * 1.2, _p.z + dir.z * 1.2, 0.45, z.cSangre);
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
  if (!z.explotado) iniciarCadaver(z, dir, arma, parte, cab, porExplosion);
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

// ---------- Cadáveres ----------
// impulso de muerte por arma: [horizontal, vertical] en m/s
const IMPULSO = { pistola: [2.4, 0.7], metralleta: [2.0, 0.5], escopeta: [7.5, 2.6], rifle: [1.6, 0.2], termo: [3.6, 1.1], bate: [5.2, 1.6], machete: [2.4, 0.6], sarten: [8.5, 3.4], revolver: [4.2, 1.2] };
let fuerzaExpl = 1;
const _cHollin = new THREE.Color(0x0c0a08), _dc = new THREE.Vector3();
function iniciarCadaver(z, dir, arma, parte, cab, expl) {
  const I = IMPULSO[arma] || IMPULSO.pistola;
  let modo = 'normal', h = I[0], v = I[1];
  if (z.T.jefe) { modo = 'jefe'; h = 0; v = 0; }
  else if (expl || arma === 'explosion') { modo = 'explosion'; h = 0.6; v = 0.6; } // el empujón lo da fis.explosion (radial, para todos a la vez)
  else if (arma === 'escopeta') { // más perdigones adentro y más cerca = más empujón
    const d = Math.hypot(z.g.position.x - J.pos.x, z.g.position.z - J.pos.z), k = Math.max(0.45, 1.25 - d / 14) * (0.7 + 0.3 * Math.min(1, perdigonesN / 5)); h *= k; v *= k; }
  else if (arma === 'rifle' || (cab && arma !== 'sarten' && arma !== 'bate')) { modo = 'desplome'; h += 1; v = 0; } // el rifle y los tiros a la cabeza lo apagan en el lugar
  if (z.tipo === 'tanque') { h *= 0.55; v *= 0.5; }
  h *= 0.85 + Math.random() * 0.3;
  const l = Math.hypot(dir.x, dir.z) || 1;
  fis.iniciar(z, dir.x / l, dir.z / l, h, v, parte, modo, modo === 'explosion' || modo === 'jefe' ? null : impacto);
  z.muerteT = 0; z.arma = arma || (expl ? 'explosion' : null); z.charcoHecho = false;
  limitarCadaveres();
}
function patearCadaver(z, dir, h, punto, v = 0.6) {
  if (z.hundir || !z.yaRag) return;
  const l = Math.hypot(dir.x, dir.z) || 1;
  fis.patear(z, dir.x / l, dir.z / l, h, v, punto);
  z.muerteT = Math.min(z.muerteT, 2);
  if (punto) fis.sangre.gota(punto.x + dir.x / l * 0.5, punto.z + dir.z / l * 0.5, 0.18 + Math.random() * 0.15, z.cSangre);
}
// el pecho toca el piso por primera vez
function golpeCuerpo(z, x, y, zz, vel, pesado) {
  const dj = Math.hypot(x - J.pos.x, zz - J.pos.z);
  if (pesado) { // los jefes caen como un edificio
    ef.golpeSuelo(_dc.set(x, y - 0.3 * z.esc, zz), 6 + z.esc * 1.5); sonido.cae(true); shake = Math.max(shake, Math.max(0.5, 1.4 - dj / 30)); vibrar(160);
    fis.sangre.charco(x, zz, 0.9 * z.esc, z.cSangre, 0.2);
  } else if (vel > 2 && dj < 35) sonido.cae(false, vel);
}
// cuando el cuerpo se queda quieto, se le forma un charco abajo
function charcoCuerpo(z, P) {
  if (z.charcoHecho || estado === 'inicio') return; z.charcoHecho = true;
  const cx = (P[0] + P[3] + P[6] + P[9]) * 0.25, cz = (P[2] + P[5] + P[8] + P[11]) * 0.25;
  fis.sangre.charco(cx, cz, (0.5 + Math.random() * 0.35) * Math.min(2.2, z.esc), z.cSangre, z.T.jefe ? 0.12 : 0.3);
  if (z.sinCabeza) fis.sangre.charco(P[12], P[14], 0.38 * Math.min(2, z.esc), z.cSangre, 0.4);
}
function empezarHundir(z, rapido) {
  if (z.rag) fis.dormir(z.rag);
  fis.alHundir(z);
  z.hundir = true; z.hundirRapido = rapido; z.hundirT = rapido ? 0.8 : 2.8; z.mOk = false;
}
function limitarCadaveres() {
  let n = 0; for (const z of zombis) if (!z.vivo && !z.hundir && z.yaRag) n++;
  const cap = CAL[AJ.calidad].cad;
  while (n > cap) {
    let viejo = null; for (const z of zombis) if (!z.vivo && !z.hundir && z.yaRag && (!viejo || z.muerteT > viejo.muerteT)) viejo = z;
    if (!viejo) break; empezarHundir(viejo, true); n--;
  }
}
function quitarZombi(i) { const z = zombis[i]; fis.soltar(z); zombis.splice(i, 1); poolZ.push(z); }

// explosión: el zombi explosivo (cuando llega o cuando lo matan) daña a todos alrededor
function explotar(z, porJugador) {
  z.explotado = true; z.vivo = false; z.muerteT = 0; z.sinCabeza = true; z.sinBrazo[0] = z.sinBrazo[1] = true;
  const p = z.g.position, R = 4.2;
  ef.explosion(_p.copy(p), R * 1.4); sonido.explosion(); salpicar(p.x, p.y + 1, p.z, 40, 7);
  for (let k = 0; k < 2; k++) ef.gib(_fin.set(p.x, p.y + 1, p.z), _gv.set((Math.random() - .5) * 10, 6, (Math.random() - .5) * 10), z.cPiel, false);
  ef.gib(_fin.set(p.x, p.y + 1.6, p.z), _gv.set((Math.random() - .5) * 8, 8, (Math.random() - .5) * 8), z.cPiel, true);
  // quemado en el piso + salpicón alrededor
  fis.sangre.charco(p.x, p.z, 1.5, _cHollin, 6); fis.sangre.charco(p.x + (Math.random() - .5), p.z + (Math.random() - .5), 1.0, z.cSangre, 4);
  for (let k = 0; k < 5; k++) { const an = Math.random() * 6.28, dd = 1.2 + Math.random() * 2.5; fis.sangre.gota(p.x + Math.cos(an) * dd, p.z + Math.sin(an) * dd, 0.25 + Math.random() * 0.3, z.cSangre); }
  // el propio explosivo sale volando (el empujón se lo da fis.explosion, abajo)
  _d.set(Math.random() - .5, 0, Math.random() - .5).normalize(); iniciarCadaver(z, _d, 'explosion', 1, false, true);
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
  // un solo empujón radial para todos los cuerpos (los recién muertos, los que ya estaban tirados y los pedazos)
  fis.explosion(p.x, p.y + 0.35, p.z, R * 1.3, 7.5);
  ef.empujar(p.x, p.y + 0.35, p.z, R * 1.3, 9);
  if (porJugador) { S.explosionMax = Math.max(S.explosionMax, muertos); if (muertos >= 3) logro('explosion'); }
}

// ---------- Modo Infinito: efectos de los mods ----------
const _u3 = new THREE.Vector3(), _cand = [];
function alPegar(z, a, p, suerte) {
  if (a.fuego && z.vivo) { z.quemaT = 3; z.quemaD = Math.max(z.quemaD || 0, a.fuego); z.quemaArma = a.id; }
  if (a.rebote && Math.random() < a.rebote) rebotar(z, a, p);
  if (a.cadena && Math.random() < a.cadena) descarga(z, a, a.cadenaN || 3);
  if (suerte && colaExpl.length < 96) colaExpl.push(p.x, p.y, p.z, a.napalm ? 1 : 0);
}
function alMatar(z, a) {
  if (a.vampiro && estado === 'jugando') J.vida = Math.min(J.vidaMax, J.vida + a.vampiro);
  if (a.explos && Math.random() < a.explos && colaExpl.length < 96) colaExpl.push(z.g.position.x, z.g.position.y + 1, z.g.position.z, a.napalm ? 1 : 0);
}
function rebotar(z, a, p) { // la bala salta al zombi vivo más cercano (9 m)
  let best = null, bd = 81;
  for (const o of zombis) { if (!o.vivo || o === z) continue; const dx = o.g.position.x - p.x, dz = o.g.position.z - p.z, d = dx * dx + dz * dz; if (d < bd) { bd = d; best = o; } }
  if (!best) return;
  _u2.set(best.g.position.x, best.g.position.y + 1.2 * best.esc, best.g.position.z); trazar(p, _u2, 0xffc060);
  _d.set(_u2.x - p.x, 0, _u2.z - p.z).normalize(); impacto = _u2;
  herir(best, danoDe(a) * 0.6, false, _d, 0.8, false, a.id, 1); impacto = null;
  salpicar(_u2.x, _u2.y, _u2.z, 4, 2, _d.x * 2, _d.z * 2);
  if (a.fuego && best.vivo) { best.quemaT = 3; best.quemaD = Math.max(best.quemaD || 0, a.fuego); best.quemaArma = a.id; }
  if (a.tormenta) descarga(best, a, 2);
}
function descarga(z, a, n) { // rayo que salta a los n más cercanos (6 m) y los aturde
  const p = z.g.position; _u3.set(p.x, p.y + 1.2 * z.esc, p.z); _cand.length = 0;
  for (const o of zombis) if (o.vivo && o !== z && (o.g.position.x - p.x) ** 2 + (o.g.position.z - p.z) ** 2 < 36) _cand.push(o);
  if (!_cand.length) return;
  _cand.sort((u, v) => ((u.g.position.x - p.x) ** 2 + (u.g.position.z - p.z) ** 2) - ((v.g.position.x - p.x) ** 2 + (v.g.position.z - p.z) ** 2));
  ef.chispaAzul(_u3.x, _u3.y, _u3.z, 6); sonido.zap();
  for (let k = 0; k < Math.min(n, _cand.length); k++) {
    const o = _cand[k]; _u2.set(o.g.position.x, o.g.position.y + 1.2 * o.esc, o.g.position.z);
    trazar(_u3, _u2, 0x80c8ff); ef.chispaAzul(_u2.x, _u2.y, _u2.z, 5);
    if (!o.T.jefe) o.aturdido = Math.max(o.aturdido, 0.6);
    _d.set(_u2.x - _u3.x, 0, _u2.z - _u3.z).normalize(); herir(o, Math.max(12, danoDe(a) * 0.35), false, _d, 0.4, false, a.id, 1);
  }
}
function explosionMod(x, y, z, nap) { // bala explosiva: empuja cuerpos vivos y muertos (no lastima al jugador)
  const R = 3.2; _p.set(x, y - 1, z); ef.explosion(_p, R * 1.2); sonido.explosion();
  for (const o of zombis) {
    if (!o.vivo) continue;
    const d = Math.hypot(o.g.position.x - x, o.g.position.z - z); if (d > R) continue;
    _d.set((o.g.position.x - x) / (d || 1), 0, (o.g.position.z - z) / (d || 1));
    o.vida -= 90 * (1 - d / R * 0.5); o.flash = 0.15; o.kb.x += _d.x * 10; o.kb.z += _d.z * 10;
    if (nap) { o.quemaT = 3; o.quemaD = Math.max(o.quemaD || 0, 16); o.quemaArma = null; }
    if (o.T.jefe) hudJefe();
    if (o.vida <= 0) matar(o, false, _d, false, 'explosion', true);
  }
  fis.explosion(x, y - 0.65, z, R * 1.3, 6.5); ef.empujar(x, y - 0.65, z, R * 1.3, 8);
  const dj = Math.hypot(J.pos.x - x, J.pos.z - z); shake = Math.max(shake, Math.max(0.12, 0.6 - dj / 15));
}
function recalcInf() {
  statsInf = {};
  if (modoInf) for (const a of ARMAS) statsInf[a.id] = calcular(a, modsInf[a.id]);
  for (const a of ARMAS) vestirArma(a.id);
}
// lo que se ve de cada mod en el arma
const MM = {
  negro: new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.5, metalness: 0.3 }),
  oro: new THREE.MeshStandardMaterial({ color: 0xd8a830, roughness: 0.35, metalness: 0.35, emissive: 0x2a1800 }),
  rojo: new THREE.MeshStandardMaterial({ color: 0x501010, emissive: 0xff2010, emissiveIntensity: 0.7 }),
  naranja: new THREE.MeshStandardMaterial({ color: 0x3a1a08, emissive: 0xff6a10, emissiveIntensity: 0.9 }),
  azul: new THREE.MeshStandardMaterial({ color: 0x203040, emissive: 0x3090ff, emissiveIntensity: 0.9 })
};
const modCaja = (g, w, h, d, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); g.add(m); return m; };
const modCil = (g, r1, r2, h, mat, x, y, z, rx = Math.PI / 2, rz = 0) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, 12), mat); m.position.set(x, y, z); m.rotation.x = rx; m.rotation.z = rz; g.add(m); return m; };
function vestirArma(id) {
  const m = modelos[id], s = A(id), u = m.userData;
  if (u.mods) { m.remove(u.mods); u.mods.traverse(o => o.geometry && o.geometry.dispose()); }
  const g = u.mods = new THREE.Group(); m.add(g);
  if (!u.punta0) u.punta0 = u.punta.clone();
  const p0 = u.punta0; let tip = p0.z;
  m.scale.setScalar(s.escala || 1);
  const car = m.getObjectByName('cargador');
  if (car) { if (car.userData.s0 === undefined) car.userData.s0 = car.scale.y; car.scale.y = car.userData.s0 * (s.cargExt ? 1 + 0.55 * s.cargExt : 1); }
  const tam = m.getObjectByName('tambor');
  if (tam) { if (!tam.userData.m0) tam.userData.m0 = tam.material; tam.material = s.dorado ? MM.oro : tam.userData.m0; }
  u.laser = !!s.laser; u.llamas = !!s.llamas || !!s.dragon; u.electro = !!s.electro;
  if (BASE(id).tipo === 'fuego') {
    if (s.silen) { modCil(g, 0.024, 0.024, 0.17, MM.negro, p0.x, p0.y, p0.z - 0.085); tip -= 0.17; }
    if (s.choke) modCil(g, 0.042, 0.036, 0.05, MM.negro, p0.x, p0.y, p0.z - 0.02);
    if (s.dragon) modCil(g, 0.03, 0.03, 0.14, MM.naranja, p0.x, p0.y, p0.z + 0.08);
    if (s.laser) { modCaja(g, 0.028, 0.028, 0.07, MM.negro, p0.x, p0.y - 0.05, p0.z + 0.1); modCil(g, 0.006, 0.006, 0.005, MM.rojo, p0.x, p0.y - 0.05, p0.z + 0.064); }
    if (s.tambor) modCil(g, 0.075, 0.075, 0.06, MM.negro, 0, -0.13, -0.12, 0, Math.PI / 2);
    if (s.estab) modCaja(g, 0.03, 0.09, 0.03, MM.negro, 0, -0.08, p0.z * 0.45);
    if (s.fuego && !s.dragon) modCaja(g, 0.052, 0.012, 0.03, MM.naranja, 0, 0.042, p0.z * 0.4);
    if (s.cadena) modCaja(g, 0.052, 0.012, 0.03, MM.azul, 0, 0.042, p0.z * 0.4 + 0.035);
    if (s.explos) modCaja(g, 0.052, 0.012, 0.03, MM.rojo, 0, 0.042, p0.z * 0.4 - 0.035);
    if (s.auto && id === 'pistola') modCaja(g, 0.02, 0.05, 0.1, MM.negro, 0, -0.03, 0.08);
  } else {
    if (s.llamas) modCil(g, 0.036, 0.036, 0.5, MM.naranja, 0, 0.4, 0, 0);
    if (s.electro) modCil(g, 0.04, 0.04, 0.46, MM.azul, 0, 0.38, 0, 0);
    if (s.vampiro) modCaja(g, 0.06, 0.03, 0.06, MM.rojo, 0, 0.08, 0);
  }
  u.punta.set(p0.x, p0.y, tip); if (u.flash) u.flash.position.copy(u.punta);
}
// mira láser: un rayo en el mundo desde el arma hasta lo primero que toca, con un punto rojo
const laserRayo = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.01, 1).translate(0, 0, -0.5), new THREE.MeshBasicMaterial({ color: 0xff2a20, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
const laserPunto = new THREE.Sprite(new THREE.SpriteMaterial({ map: brilloTex('rgba(255,40,30,1)'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
laserRayo.visible = laserPunto.visible = false; laserRayo.frustumCulled = false; laserPunto.scale.setScalar(0.22); scene.add(laserRayo, laserPunto);
const golpesL = [];
let llamaT = 0;
function efectosArma(dt) {
  const u = modelos[armaSel] && modelos[armaSel].userData, si = modoInf && u && estado === 'jugando' && cambioT <= 0 && recargaT <= 0;
  if (si && u.laser) {
    ojoJugador(_o, _f, _r, _u);
    const ob = rayoObstaculos(_o, _f, 60); rayo(_o, _f, 60, golpesL, 1);
    let t = Math.min(60, ob.t); if (golpesL.length && golpesL[0].t < t) t = golpesL[0].t;
    _u3.copy(_o).addScaledVector(_r, 0.13).addScaledVector(_u, -0.16).addScaledVector(_f, 0.45);
    _fin.copy(_o).addScaledVector(_f, t);
    laserRayo.position.copy(_u3); laserRayo.lookAt(_fin); laserRayo.rotateY(Math.PI); laserRayo.scale.z = Math.max(0.1, _u3.distanceTo(_fin));
    laserPunto.position.copy(_fin).addScaledVector(_f, -0.05); laserRayo.visible = laserPunto.visible = true;
  } else laserRayo.visible = laserPunto.visible = false;
  if (si && (u.llamas || u.electro) && (llamaT -= dt) <= 0) { // el arma prendida fuego / con chispas, vista desde afuera
    llamaT = u.electro ? 0.25 : 0.08; ojoJugador(_o, _f, _r, _u);
    _u3.copy(_o).addScaledVector(_r, 0.35).addScaledVector(_u, 0.05).addScaledVector(_f, 0.9);
    if (u.electro) ef.chispaAzul(_u3.x, _u3.y, _u3.z, 2); else if (BASE(armaSel).tipo === 'cuerpo') ef.llama(_u3.x, _u3.y, _u3.z);
  }
}
// ---------- Modo Infinito: taller de mods entre oleadas ----------
function abrirMods() {
  estado = 'tienda'; disparando = false; autoDisparo = false; recargaT = 0;
  if (document.pointerLockElement) document.exitPointerLock();
  opcionesInf = ofrecer(armasInf, modsInf, oleada);
  if (!opcionesInf.length) { modsHecho = true; abrirTienda(); return; }
  $('mods-sub').textContent = `Oleada ${oleada} superada · Elegí un mod (gratis)${jefeDe(oleada + 1) ? ' · ¡la próxima viene con jefe!' : ''}`;
  pintarMods(); mostrar('mods'); capaJuego(false); musica.set(0.1, false, true);
}
const precioTirada = () => 80 + tiradasInf * 60;
function pintarMods() {
  const L = $('mods-lista'); L.innerHTML = '';
  opcionesInf.forEach((o, k) => {
    const m = MOD(o.mod), R = RAREZA[m.r], dueno = o.arma === '*' ? 'Para vos' : BASE(o.arma).nombre, tengo = modsInf[o.arma] || {};
    const sin = SINERGIAS.find(g => g.req.includes(m.id) && !tengo[m.id] && g.req.every(r => r === m.id || tengo[r]));
    const b = document.createElement('button'); b.className = 'mod r-' + m.r; b.dataset.k = k;
    b.innerHTML = `<small class="rar">${R.nombre}</small><b>${m.nombre}</b><span class="arma">${dueno}${m.max > 1 ? ` · ${o.pilas + 1}/${m.max}` : ''}</span><small>${m.desc}</small>${sin ? `<small class="sin">★ Arma la sinergia ${sin.nombre}: ${sin.desc}</small>` : ''}`;
    b.addEventListener('click', () => elegirMod(o)); L.appendChild(b);
  });
  const pr = precioTirada(); $('b-mods-tirar').textContent = `Volver a tirar · $${pr}`; $('b-mods-tirar').disabled = pesos < pr;
  $('mods-plata').querySelector('span').textContent = pesos;
  $('mods-tengo').innerHTML = resumenMods() || '<i>Todavía no tenés mods. Elegí uno.</i>';
}
function resumenMods() {
  const out = [];
  for (const id in modsInf) {
    const t = modsInf[id], nom = id === '*' ? 'Vos' : BASE(id).nombre;
    const l = Object.keys(t).map(k => MOD(k).nombre + (t[k] > 1 ? ' ×' + t[k] : '')).join(', ');
    const sg = id !== '*' && statsInf[id] ? statsInf[id].sinergias.map(g => SINERGIAS.find(x => x.id === g).nombre) : [];
    out.push(`<b>${nom}:</b> ${l}${sg.length ? ` <span class="sinergia">★ ${sg.join(' · ')}</span>` : ''}`);
  }
  return out.join('<br>');
}
function elegirMod(o) {
  const m = MOD(o.mod); sonido.comprar(); vibrar(20);
  const t = modsInf[o.arma] || (modsInf[o.arma] = {}); t[m.id] = (t[m.id] || 0) + 1;
  const antes = o.arma !== '*' && statsInf[o.arma] ? statsInf[o.arma].sinergias.slice() : [];
  if (o.arma === '*') { if (m.id === 'chivito') { J.vidaMax += 20; J.vida = J.vidaMax; } else if (m.id === 'chaleco') J.blindaje = Math.min(200, J.blindaje + 50); else if (m.id === 'mate') regenInf += 1; }
  recalcInf();
  if (o.arma !== '*') {
    const a = A(o.arma);
    if (a.tipo === 'fuego') { cargador[a.id] = cargMax(a); if (reserva[a.id] !== Infinity) reserva[a.id] = Math.max(reserva[a.id], Math.round(resMax(a) * 0.5)); }
    const nuevas = a.sinergias.filter(g => !antes.includes(g));
    if (nuevas.length) { const g = SINERGIAS.find(x => x.id === nuevas[0]); setTimeout(() => mensaje('¡Sinergia: ' + g.nombre + '!', g.desc), 400); }
  }
  modsHecho = true; ocultar('mods'); abrirTienda(); hud();
}

// ---------- Oleadas ----------
function empezarOleada() {
  oleada++; porSalir = modoPlay ? cfgPlay.cantidad : modoInf ? cantidadInf(oleada) : cantidad(oleada); spawnT = 0.5; S.olaSinDano = true; S.vidaInicioOla = J.vida;
  const j = jefeDe(oleada);
  if (modoInf) {
    eventoInfAct = j ? null : eventoInf(oleada); scene.fog.density = eventoInfAct === 'niebla' ? 0.012 : MAPA.atmo.densidad;
    if (oleada > 5 && oleada % 5 === 1) { eventoPuerto = false; mundo.puerto.cerrar(); } // el contenedor del puerto se vuelve a cargar
    if (!j) { const e = eventoInfAct && EVENTOS[eventoInfAct]; mensaje('Oleada ' + oleada, e ? e.nombre + ' · ' + e.sub : oleada < 8 ? 'Esto recién empieza' : 'Seguís vivo. Raro', !!e); sonido.oleada(); hud(); return; }
  }
  if (modoPlay && !j) { mensaje('Oleada ' + oleada, 'Playground · ' + MAPA.nombre); sonido.oleada(); hud(); return; }
  if (j) {
    mensaje(oleada === OLEADAS_TOTAL && !modoInf ? 'Última oleada' : 'Oleada ' + oleada, j === 'cerro' ? (modoInf ? 'Bajó el Zombi del Cerro. Y vino con amigos' : 'Bajó el Zombi del Cerro. Aguantá hasta que salga el sol') : 'Se viene ' + JEFES_INFO[j].nombre + '…', true);
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
  if (modoPlay) {
    if (cfgPlay.olas > 0 && oleada >= cfgPlay.olas) {
      estado = 'fin'; disparando = false; autoDisparo = false;
      if (document.pointerLockElement) document.exitPointerLock();
      mundo.setAlba(1); sonido.victoria(); camVictoria = true;
      mensaje('¡Playground superado!', 'Completaste las ' + cfgPlay.olas + ' oleadas en ' + MAPA.nombre);
      cerrarPartida(true);
      $('fin').classList.add('victoria');
      $('fin-titulo').textContent = '¡Playground superado!';
      $('fin-sub').innerHTML = `Playground en ${MAPA.nombre}: completaste las <b>${cfgPlay.olas}</b> oleadas.`;
      musica.set(0, false, true);
      setTimeout(() => { mostrar('fin'); capaJuego(false); }, 2000); return;
    }
    mensaje('¡Oleada ' + oleada + ' superada!', 'La próxima arranca en unos segundos'); descanso = cfgPlay.pausa; sonido.oleada(); hud(); return;
  }
  const bonus = Math.round(oleada * 60 * MODO().pesos);
  pesos += bonus; puntos += oleada * 250;
  if (S.olaSinDano) { logro('perfecta'); pesos += 100; }
  if (oleada >= 5) logro('ola5');
  mundo.fuegos(3 + (oleada >= OLEADAS_TOTAL ? 5 : 0));
  if (oleada >= OLEADAS_TOTAL && !modoInf) { victoria(); return; }
  mensaje('¡Oleada ' + oleada + ' superada!', `+$${bonus} de premio${S.olaSinDano ? ' · +$100 por no recibir daño' : ''}`);
  // el cielo empieza a clarear de a poco
  mundo.setAlba(modoInf ? 0.12 * (oleada % 5) / 4 : Math.max(0, Math.min(0.55, (oleada - 3) / 11)));
  descanso = 0; tiendaT = 2.4; sonido.oleada();
  hud();
}
function elegirTipo() {
  if (modoPlay) { const L = cfgPlay.tipos; return L[Math.random() * L.length | 0] || 'normal'; }
  const m = modoInf ? mezclaInf(oleada, eventoInfAct) : mezcla(oleada); let total = 0;
  for (const k in m) total += m[k];
  let r = Math.random() * total;
  for (const k in m) { r -= m[k]; if (r <= 0) return k; }
  return 'normal';
}
const _l = {};
// Aparición: anillo de 15-34 m alrededor del jugador, preferentemente fuera de la vista, en piso válido y sin props encima
// (antes podían salir a 40-50 m por la punta del mapa y había que ir a buscarlos)
const SPAWN_R0 = 15, SPAWN_R1 = 34;
function ubicar(z, cerca) {
  const pl = local(J.pos.x, J.pos.z, _l), fx = -Math.sin(J.yaw), fz = -Math.cos(J.yaw);
  z.sube = false; z.deambDesde = tiempo; z.trancado = 0; z.distPrev = undefined;
  let mejor = null;
  for (let intento = 0; intento < 18; intento++) {
    let i, d, sube = false;
    if (cerca) { i = pl.i + (Math.random() - .5) * 24; d = -8 + Math.random() * 26; }
    else if (Math.random() < 0.3) { i = pl.i + (Math.random() - .5) * 30; d = -31 - Math.random() * 3; sube = true; } // salen del río
    else {
      const an = Math.random() * 6.283, r = SPAWN_R0 + Math.random() * (SPAWN_R1 - SPAWN_R0);
      local(J.pos.x + Math.cos(an) * r, J.pos.z + Math.sin(an) * r, _l2); i = _l2.i; d = Math.max(-9.5, Math.min(29, _l2.d));
    }
    i = Math.max(LIM_I0 - 2, Math.min(LIM_I1 + 2, i));
    aMundo(i, d, _o);
    const dx = _o.x - J.pos.x, dz = _o.z - J.pos.z, lejos = Math.hypot(dx, dz) || 1;
    if (!libre(_o.x, _o.z, 0.6)) continue;
    if (cerca) { if (lejos > 8) { mejor = [_o.x, _o.z, d, sube]; break; } continue; }
    if (lejos < SPAWN_R0 - 1 || lejos > SPAWN_R1 + 4) continue;
    mejor = [_o.x, _o.z, d, sube];
    if (intento >= 10 || (fx * dx + fz * dz) / lejos < 0.6) break; // fuera del cono de visión (o ya probó bastante)
  }
  if (!mejor) { aMundo(Math.max(LIM_I0, Math.min(LIM_I1, pl.i + (Math.random() < .5 ? -1 : 1) * 20)), 2 + Math.random() * 8, _o); mejor = [_o.x, _o.z, null, false]; }
  const [x, q, d, sube] = mejor;
  z.sube = sube; z.g.position.set(x, sube ? -2.6 : piso(d === null ? local(x, q, _l2).d : d), q);
}
const _l2 = {};
// cuántos quedan en la oleada (vivos + por salir): cuando son pocos, todos vienen derecho al jugador
let quedanOla = 99;
const _candCol = new Array(64).fill(null);
// obstáculos cercanos por la grilla de la física (antes recorría los ~700 obstáculos en cada llamada)
function libre(x, z, r) { const n = fis.grilla.buscar(x, z, r, _candCol); for (let k = 0; k < n; k++) { const c = _candCol[k], dx = c.x - x, dz = c.z - z, rr = c.r + r; if (dx * dx + dz * dz < rr * rr) return false; } return true; }
function spawn(tipo, cerca) {
  let z = poolZ.pop();
  if (!z) { // sin lugar: se recicla el cadáver más viejo
    let k = -1; for (let i = 0; i < zombis.length; i++) if (!zombis[i].vivo && (k < 0 || zombis[i].muerteT > zombis[k].muerteT)) k = i;
    if (k < 0) return null; z = zombis[k]; fis.alHundir(z); fis.soltar(z); zombis.splice(k, 1);
  }
  prepararZombi(z, tipo || elegirTipo());
  if (z.T.jefe) initJefe(z);
  ubicar(z, cerca);
  if (z.tipo === 'gateador') z.sube = false;
  if (z.sube && z.g.position.y > -2) z.sube = false;
  const m = (modoInf ? vidaInf(oleada) : 1 + (oleada - 1) * 0.07) * MODO().vida;
  z.vida *= m; z.vidaMax = z.vida;
  zombis.push(z);
  return z;
}
function eventoContenedor() { /* U4: al entrar al puerto se abre un contenedor y sale parte de la oleada */
  if (!MAPA.puerto) return;
  const pu = mundo.puerto.puerta; if (!pu || local(J.pos.x, J.pos.z, _l).i < PUERTO_I0 + 8) return;
  eventoPuerto = true; mundo.puerto.abrir();
  const n = Math.min(5, porSalir); porSalir -= n;
  for (let k = 0; k < n; k++) {
    const z = spawn(k % 3 === 2 ? 'corredor' : 'normal', true); if (!z) break; z.sube = false;
    const t = 4 + (k >> 1) * 0.9, w = (k % 2 ? 0.6 : -0.6), x = pu.x + pu.c * t + pu.s * w, q = pu.z - pu.s * t + pu.c * w;
    z.g.position.set(x, piso(local(x, q, _l).d), q); z.alerta = 9; z.velMult = 0.3;
  }
  oir(pu.x, pu.z, 40); sonido.portazo(); mensaje('¡SE ABRIÓ UN CONTENEDOR!', 'Puerto del Buceo');
}
function spawnJefe(tipo) {
  const z = spawn(tipo); if (!z) return;
  z.vida = z.vidaMax = TIPOS[tipo].vida * MODO().vida * (modoInf ? 1 + Math.floor((oleada - 1) / 10) * 0.6 : 1); z.sube = false;
  // aparece del lado de la ciudad, de frente
  // el del anzuelo sube de la escollera (del lado del río); el resto, del lado de la ciudad
  const pl = local(J.pos.x, J.pos.z, _l), dJ = tipo === 'anzuelo' ? -9.5 : 18; aMundo(pl.i + (Math.random() - .5) * 10, dJ, _o); z.g.position.set(_o.x, piso(dJ), _o.z);
  jefe = z; z.rugidoT = 0.5; z.piedraT = 3; z.timerIA = 4; z.fase2 = false; z.fase3 = false; initJefe(z);
  $('jefe').classList.remove('oculto'); $('jefe-nombre').textContent = TIPOS[tipo].nombre; hudJefe(true);
  presentarJefe(tipo);
  shake = 0.8; vibrar([80, 60, 80]);
}
// v8: estado propio de cada jefe (timers de ataques y fases)
function initJefe(z) {
  z.t1 = 2.5 + Math.random(); z.t2 = 0; z.fase2 = false; z.fase3 = false; z.beatN = 0; z.beatT = 0; z.ganchoD = -1; z.enganche = 0; z.lances = 0;
  z.cargaG = 0; z.rackDano = 0; z.sinRack = false; z.saludoN = 0; z.saludoT = 0; z.saludoAng = 0; z.llamaT = 0; z.mandaT = 0; z.mandaCD = 6;
}
// tarjeta de presentación: nombre grande, apodo y cómo pelearle (3,4 s)
let introT = 0;
function presentarJefe(tipo) {
  const I = JEFES_INFO[tipo]; if (!I) return;
  $('ji-nombre').textContent = I.nombre; $('ji-epiteto').textContent = I.epiteto; $('ji-tip').textContent = I.tip;
  const el = $('jefe-intro'); el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); introT = 3.4;
  ({ lubolo: () => sonido.tambor(1.2), tablado: () => sonido.murga(), bengala: () => sonido.pito(), anzuelo: () => sonido.latigo(), garrafero: () => sonido.tubo() }[tipo] || (() => { }))();
}
function jefeMuerto(z) {
  S.jefes++; jefe = null; $('jefe').classList.add('oculto'); jfx.tanza(null); z.enganche = 0;
  shake = 1.2; vibrar(200); sonido.rugido(z.tipo === 'cerro' ? 0.5 : 0.8);
  lenta = 1.1; // cámara lenta mientras se viene abajo; el golpe contra el piso lo pone golpeCuerpo()
  ef.explosion(_p.copy(z.g.position).setY(z.g.position.y + 1.2 * z.esc), 3);
  const FRASE = { cerro: '¡Se cayó el Cerro!', patovica: '¡Patovica afuera!', anzuelo: '¡Don Anzuelo, a la bolsa!', garrafero: '¡Se quedó sin gas!', bengala: '¡Se apagó la tribuna!', lubolo: '¡Terminó la llamada!', tablado: '¡Bajó el telón!' };
  mensaje(FRASE[z.tipo] || '¡Jefe afuera!', '+$' + (PESOS[z.tipo] || 300) + ' para el almacén');
  logro(z.tipo);
  if (!modoPlay) { const v = perfil.jefesVistos || (perfil.jefesVistos = []); if (!v.includes(z.tipo)) v.push(z.tipo); if (ORDEN_JEFES.every(t => v.includes(t))) logro('barrio'); }
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
  return libre(x, z, 0.45);
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
const grillaZ = crearGrillaDin(MAXZ, 2), _vec = new Array(MAXZ).fill(null), _candZ = new Array(24).fill(null);
let escMax = 1;
function simular(dt) {
  tiempo += dt;
  // estado anterior, para dibujar interpolado entre pasos (120 Hz de física, cualquier Hz de pantalla)
  J.px = J.pos.x; J.py = J.pos.y; J.pz = J.pos.z;
  escMax = 1; grillaZ.limpiar();
  for (let i = 0; i < zombis.length; i++) {
    const z = zombis[i], p = z.g.position; z.ipx = p.x; z.ipy = p.y; z.ipz = p.z; z.iry = z.g.rotation.y; z.iOk = true;
    if (z.vivo) { grillaZ.poner(p.x, p.z, z); if (z.esc > escMax) escMax = z.esc; }
  }
  simSangre(dt);
  fis.sim(dt, J.pos.x, J.pos.z); fis.sangre.sim(dt); fis.marcas.sim(dt);
  ef.sim(dt, pisoEn, colisionarPunto);
  ef.simProy(dt, pisoEn, alCaerProyectil, choqueProyectil);
  jfx.sim(dt, J.pos.x, J.pos.z, golpeOnda, llamaFx, enFuego);
  if (introT > 0 && (introT -= dt) <= 0) $('jefe-intro').classList.remove('on');
  for (const tr of trazas) if (tr.t > 0) { tr.t -= dt; tr.l.material.opacity = Math.max(0, tr.t / 0.06) * 0.8; if (tr.t <= 0) tr.l.visible = false; }
  for (const p of poolPick) {
    if (p.t <= 0) continue;
    p.t -= dt; p.g.rotation.y += dt * 1.5;
    p.g.visible = p.t > 0 && (p.t > 5 || Math.sin(tiempo * 20) > 0);
    if (p.t > 0 && estado === 'jugando' && (p.g.position.x - J.pos.x) ** 2 + (p.g.position.z - J.pos.z) ** 2 < 2.4 ** 2) { agarrar(p); p.t = 0; p.g.visible = false; }
  }
  dibujarPickups();
  if (comboT > 0) { comboT -= dt; if (comboT <= 0) { comboN = 0; $('combo').style.opacity = 0; } }
  { let v = 0; for (const z of zombis) v += z.vivo; quedanOla = porSalir + v + (jefePendiente ? 1 : 0); }
  // los zombis siguen moviéndose también en el menú y en la pantalla de fin
  simZombis(dt);
  if (colaExpl.length && (explT -= dt) <= 0) { explosionMod(colaExpl[0], colaExpl[1], colaExpl[2], colaExpl[3]); colaExpl.splice(0, 4); explT = 0.08; }
  if (estado !== 'jugando') return;
  if (regenInf && J.vida > 0 && J.vida < J.vidaMax) J.vida = Math.min(J.vidaMax, J.vida + regenInf * dt);
  moverJugador(dt);
  // oleadas
  if (tiendaT > 0) { tiendaT -= dt; if (tiendaT <= 0) abrirTienda(); }
  else if (descanso > 0) { descanso -= dt; if (descanso <= 0) empezarOleada(); }
  else if (porSalir > 0) {
    spawnT -= dt;
    let vivos = 0; for (const z of zombis) vivos += z.vivo;
    if (spawnT <= 0 && vivos < CAL[AJ.calidad].maxZ) { if (spawn()) porSalir--; spawnT = modoPlay ? cfgPlay.dur / cfgPlay.cantidad * (0.6 + Math.random() * 0.8) : Math.max(0.4, 1.9 - oleada * 0.14) * (0.6 + Math.random() * 0.8); }
  } else if (oleada > 0 && !jefePendiente && !zombis.some(z => z.vivo)) oleadaTerminada();
  if (!eventoPuerto && porSalir > 2 && oleada >= 2) eventoContenedor();
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
// v8: ondas del tambor, fuego en el piso y proyectiles nuevos
function golpeOnda(o, nx, nz) {
  if (estado !== 'jugando') return;
  recibirDano(o.dano * MODO().dano, o.x, o.z); empujarJugador(nx, nz, 1.6); J.lento = Math.max(J.lento, 0.6); shake = Math.max(shake, 0.6); aviso('¡Metete en el hueco de la onda!');
}
const llamaFx = (x, y, z) => ef.llama(x, y, z);
function enFuego(f) { // cada 0,25 s por foco: quema al jugador y a los zombis que lo pisen
  const r2 = f.r * f.r;
  if (estado === 'jugando' && !f.deJugador && (J.pos.x - f.x) ** 2 + (J.pos.z - f.z) ** 2 < r2) { recibirDano(f.dano * 0.25 * MODO().dano, f.x, f.z); if (Math.random() < 0.3) aviso('¡Te estás quemando! Salí del fuego'); }
  for (const o of zombis) { if (!o.vivo || o.T.jefe) continue; if ((o.g.position.x - f.x) ** 2 + (o.g.position.z - f.z) ** 2 < r2) { o.quemaT = 3; o.quemaD = Math.max(o.quemaD || 0, f.deJugador ? 28 : 12); o.quemaArma = f.deJugador ? 'bengalera' : null; } }
}
// proyectiles del jugador: revientan al tocar un zombi (no solo el piso)
function choqueProyectil(pr) {
  if (!pr.jugador) return false;
  for (const z of zombis) { if (!z.vivo) continue; const dx = z.g.position.x - pr.p.x, dz = z.g.position.z - pr.p.z, r = 0.45 * z.esc; if (dx * dx + dz * dz < r * r && pr.p.y > z.g.position.y && pr.p.y < z.g.position.y + 1.9 * z.esc) { pr.blanco = z; return true; } }
  const nc = fis.grilla.buscar(pr.p.x, pr.p.z, 0.3, _candZ); for (let q = 0; q < nc; q++) { const c = _candZ[q]; if ((c.x - pr.p.x) ** 2 + (c.z - pr.p.z) ** 2 < (c.r + 0.2) ** 2 && pr.p.y < fis.techoEn(c, pr.p.x, pr.p.z, 0.2) + 0.1) return true; }
  return false;
}
// explosión de garrafa (del jefe o del lanzagarrafas): lastima al jugador si es del jefe, a los zombis siempre
function explosionGarrafa(x, y, zz, R, danoJ, danoZ, porJugador, excluir) {
  _p.set(x, y, zz); ef.explosion(_p, R * 1.35); sonido.explosion(); salpicar(x, y + 0.6, zz, 10, 5);
  fis.sangre.charco(x, zz, R * 0.4, _cHollin, 6);
  const dj = Math.hypot(J.pos.x - x, J.pos.z - zz); shake = Math.max(shake, Math.max(0.25, 1.1 - dj / 14)); vibrar(dj < 7 ? 110 : 30);
  if (!porJugador && dj < R && estado === 'jugando') { recibirDano(danoJ * (1 - dj / R * 0.6) * MODO().dano, x, zz); empujarJugador((J.pos.x - x) / (dj || 1), (J.pos.z - zz) / (dj || 1), 1.4); }
  let muertos = 0;
  for (const o of zombis) {
    if (!o.vivo || o === excluir) continue;
    const d = Math.hypot(o.g.position.x - x, o.g.position.z - zz); if (d > R) continue;
    _d.set((o.g.position.x - x) / (d || 1), 0, (o.g.position.z - zz) / (d || 1));
    const dn = danoZ * (1 - d / R * 0.5) * (o.T.jefe ? (porJugador ? 0.6 : 0.25) : 1);
    o.vida -= dn; o.flash = 0.15; if (!o.T.jefe) { o.kb.x += _d.x * 12; o.kb.z += _d.z * 12; }
    if (o.T.jefe) hudJefe();
    if (o.vida <= 0) { matar(o, false, _d, false, porJugador ? 'explosion' : null, true); muertos++; }
  }
  fis.explosion(x, y + 0.35, zz, R * 1.3, 7.5); ef.empujar(x, y + 0.35, zz, R * 1.3, 9);
  if (porJugador) { S.explosionMax = Math.max(S.explosionMax, muertos); if (muertos >= 3) logro('explosion'); }
  oir(x, zz, 30);
}
function alCaerProyectil(pr) {
  const dx = J.pos.x - pr.p.x, dz = J.pos.z - pr.p.z, d = Math.hypot(dx, dz);
  if (pr.tipo === 'garrafa') { explosionGarrafa(pr.p.x, pisoEn(pr.p.x, pr.p.z), pr.p.z, pr.radio, pr.dano, pr.jugador ? 150 : 90, pr.jugador, null); return; }
  if (pr.tipo === 'bengala') {
    const y = pisoEn(pr.p.x, pr.p.z); sonido.fuego();
    jfx.fuego(pr.p.x, y, pr.p.z, pr.radio, pr.jugador ? 4.5 : 5, pr.dano, pr.jugador);
    for (let k = 0; k < 6; k++) ef.llama(pr.p.x + (Math.random() - .5), y + 0.2, pr.p.z + (Math.random() - .5));
    if (pr.jugador && pr.blanco && pr.blanco.vivo) { const z = pr.blanco; _d.set(pr.v.x, 0, pr.v.z).normalize(); z.quemaT = 4; z.quemaD = Math.max(z.quemaD || 0, 34); z.quemaArma = 'bengalera'; herir(z, 40, false, _d, 1.5, false, 'bengalera', 1); }
    pr.blanco = null; return;
  }
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
// ---------- IA (Actualización 2): ruido, decisiones repartidas en el tiempo, rodeo de obstáculos, cerco ----------
// Los disparos y golpes hacen ruido: los zombis lejos que lo oyen se alertan y vienen; los que no, deambulan acercándose despacio.
const RUIDO = new Float64Array(4); // x, z, radio, tiempo
function oir(x, z, r) { if (r >= RUIDO[2] || tiempo - RUIDO[3] > 0.3) { RUIDO[0] = x; RUIDO[1] = z; RUIDO[2] = r; } RUIDO[3] = tiempo; }
const GRITO = new Float64Array([0, 0, -1]); let eventoPuerto = false; /* U4: grito del Gritón (x, z, hasta) y el contenedor del puerto */
const IA_ALERTA = 32; // m: más cerca de esto, cualquiera persigue
// al entrar a 10 m, cada zombi elige el sector libre del cerco (8 sectores) más cercano al lado por donde viene:
// los que llegan del mismo lado se abren hacia los flancos y la espalda en vez de hacer fila adelante
const _occ = new Float32Array(8);
function elegirLugar(z, p) {
  _occ.fill(0);
  for (let i = 0; i < zombis.length; i++) {
    const o = zombis[i]; if (o === z || !o.vivo || o.rag) continue;
    const ox = o.g.position.x - J.pos.x, oz = o.g.position.z - J.pos.z; if (ox * ox + oz * oz > 144) continue;
    const a = o.slotOk ? o.slot : Math.atan2(oz, ox); _occ[((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8] += 1;
  }
  const a0 = Math.atan2(p.z - J.pos.z, p.x - J.pos.x); let mejor = 0, costo = 1e9;
  for (let k = 0; k < 8; k++) {
    let da = k * Math.PI / 4 - a0; da = Math.abs(Math.atan2(Math.sin(da), Math.cos(da)));
    const c = _occ[k] * 2.4 + da * 0.6 + (posValida(J.pos.x + Math.cos(k * Math.PI / 4) * 1.2, J.pos.z + Math.sin(k * Math.PI / 4) * 1.2) ? 0 : 6); // pared o banco: ese lugar no sirve
    if (c < costo) { costo = c; mejor = k; }
  }
  z.slot = mejor * Math.PI / 4 + (Math.random() - 0.5) * 0.4; z.slotOk = true;
}
function decidir(z, p, dist, dx, dz) {
  const T = z.T;
  // ¿oyó algo? (el ruido dura 0,4 s)
  if (tiempo - RUIDO[3] < 0.4 && z.tipo !== 'tanque') { const rx = RUIDO[0] - p.x, rz = RUIDO[1] - p.z; if (rx * rx + rz * rz < RUIDO[2] * RUIDO[2]) { if (z.alerta <= 0) z.velMult = Math.min(z.velMult, 0.6); z.alerta = 9; } }
  z.deambula = false; let tx, tz, mod = 1; if (dist > 13) z.slotOk = false;
  const pocos = quedanOla <= 4 || modoPlay; // últimos de la oleada (o Playground): nadie deambula
  if (dist > IA_ALERTA && dist < 60 && z.alerta <= 0 && !T.jefe && !pocos && tiempo - (z.deambDesde || 0) < 8) { /* deambula como mucho 8 s */ /* más de 60 m (mapa largo con el puerto): vuelven derecho */ // deambula: hacia un punto corrido del jugador, lento
    const a = z.slot + tiempo * 0.05, ox = J.pos.x + Math.cos(a) * 14 - p.x, oz = J.pos.z + Math.sin(a) * 14 - p.z, ol = Math.hypot(ox, oz) || 1;
    tx = ox / ol; tz = oz / ol; mod = 0.55; z.deambula = true;
  } else if (dist > 10 || T.jefe) { // persigue: abanico (flanco) para no venir todos en fila
    tx = dx / dist; tz = dz / dist;
    if (dist > 3.5 && !T.jefe) {
      const lado = z.flanco * Math.min(9, dist * 0.45);
      const ex = J.pos.x - tz * lado - p.x, ez = J.pos.z + tx * lado - p.z, el = Math.hypot(ex, ez) || 1; tx = ex / el; tz = ez / el;
    }
  } else { // cerca: cada uno va a su lugar del cerco alrededor del jugador (rodean en vez de amontonarse adelante)
    if (!z.slotOk && !T.jefe) elegirLugar(z, p);
    // si su lugar queda del otro lado, lo rodea a ~3 m (de a 55° por vez) en vez de cruzar por adelante del jugador
    let ang = z.slot, r = Math.min(dist, Math.max(0.6, T.alcance * 0.7)); z.orbita = false;
    if (!T.jefe && dist < 7) { const ac = Math.atan2(p.z - J.pos.z, p.x - J.pos.x); let da = z.slot - ac; da = Math.atan2(Math.sin(da), Math.cos(da));
      if (Math.abs(da) > 0.7 && z.orbT > 2.5) { z.slot = ac; da = 0; } // lleva 2,5 s rodeando (algo lo tapa: poste, banco, otro zombi): se queda con el lado donde está y ataca
      if (Math.abs(da) > 0.7) { ang = ac + Math.sign(da) * Math.min(Math.abs(da), 0.95); r = Math.max(2.9, Math.min(dist, 4)); z.orbita = true; mod = 1.3; } } // rodeando se apura un poco: el cerco se cierra antes
    z.orbT = z.orbita ? z.orbT + 0.05 : 0; // decidir corre cada 0,05 s a menos de 12 m
    const sx = J.pos.x + Math.cos(ang) * r - p.x, sz = J.pos.z + Math.sin(ang) * r - p.z, sl = Math.hypot(sx, sz) || 1;
    /* desde 10 m ya se abren hacia su lugar del cerco (antes 7 m: llegaban todos del mismo lado) */ const k = Math.min(1, (10 - dist) / 5); tx = dx / dist * (1 - k) + sx / sl * k; tz = dz / dist * (1 - k) + sz / sl * k;
    const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
  }
  // por tipo
  if (z.tipo === 'corredor' && dist < 22 && dist > 3) { // si lo apuntás, zigzaguea
    const fx = -Math.sin(J.yaw), fz = -Math.cos(J.yaw), ap = -(fx * dx + fz * dz) / dist;
    if (ap > 0.94) { const s = Math.sin(tiempo * 5 + z.slot * 3) * 0.9; const nx = tx - tz * s, nz = tz + tx * s, l = Math.hypot(nx, nz); tx = nx / l; tz = nz / l; }
  } else if (z.tipo === 'escupidor' && dist < 12 && dist > 4.5) { // a distancia: se mueve de costado para no ser blanco fijo
    const s = Math.sin(tiempo * 0.7 + z.slot) > 0 ? 1 : -1; tx = -dz / dist * s; tz = dx / dist * s; mod = 0.5;
  } else if (z.tipo === 'gateador' && dist > 6) mod = 1.1;
  if (!T.jefe && !z.deambula && estado === 'jugando' && (dist > 30 || (pocos && dist > 14))) mod = Math.max(mod, 1.45); // lejos: se apura para llegar (no hay que ir a buscarlo)
  // obstáculos adelante (grilla estática): si el camino corta un auto/contenedor/banco, sale por la tangente del lado que ya eligió
  const rz = (T.jefe ? 0.3 * z.esc : 0.3) + 0.2, L = 2.2 + rz;
  const nc = fis.grilla.buscar(p.x + tx * L * 0.5, p.z + tz * L * 0.5, L * 0.5 + 1.2, _candZ);
  let mejor = 1e9, cx = 0, cz = 0, cr = 0;
  for (let q = 0; q < nc; q++) {
    const c = _candZ[q], ox = c.x - p.x, oz = c.z - p.z, t = ox * tx + oz * tz; if (t < 0 || t > L + c.r) continue;
    const px = ox - tx * t, pz = oz - tz * t, rr = c.r + rz; if (px * px + pz * pz >= rr * rr || t >= mejor) continue;
    mejor = t; cx = ox; cz = oz; cr = rr;
  }
  if (mejor < 1e9) {
    const cl = Math.hypot(cx, cz) || 1, ux = cx / cl, uz = cz / cl;
    if (z.rodeoT <= 0) { z.rodeo = (ux * tz - uz * tx) >= 0 ? 1 : -1; z.rodeoT = 1.5; } // del lado en que ya venía corrido
    const sg = z.rodeo, ax = -uz * sg, az = ux * sg, w = Math.min(1, cr / cl); // tangente
    const nx = tx * (1 - w) + ax * w * 1.2 - ux * Math.max(0, cr - cl) * 2, nz = tz * (1 - w) + az * w * 1.2 - uz * Math.max(0, cr - cl) * 2, l = Math.hypot(nx, nz) || 1;
    tx = nx / l; tz = nz / l;
  }
  z.dirX = tx; z.dirZ = tz; z.modV = mod;
  // las decisiones se reparten: los cercanos piensan más seguido
  z.decT = dist < 12 ? 0.05 : dist < IA_ALERTA ? 0.12 : 0.3;
}
function golpeZombi(z, dist, dx, dz) {
  // resolvió la preparación: ¿todavía estás al alcance?
  z.ataque = 0.4;
  if (dist < z.T.alcance + 0.55 && estado === 'jugando') {
    recibirDano(z.T.dano * MODO().dano, z.g.position.x, z.g.position.z);
    if (z.T.jefe) empujarJugador(dx / dist, dz / dist, 1.4);
    else { const seguido = tiempo - (J.ultEmp || -9) < 0.8; J.ultEmp = tiempo; empujarJugador(dx / dist, dz / dist, seguido ? 0.12 : 0.45); } // golpes en cadena de la horda: empujan menos (si no, una fila de un lado te arrastra y el cerco no se cierra)
  }
}
function simZombis(dt) {
  const enJuego = estado === 'jugando';
  const ola = 1 + Math.min(0.5, (oleada - 1) * 0.055);
  for (let i = zombis.length - 1; i >= 0; i--) {
    const z = zombis[i], p = z.g.position, T = z.T;
    if (!z.vivo) {
      if (!z.yaRag) { // sin ragdoll (no debería pasar): la caída de siempre
        animarZombi(z, dt, 0);
        p.x += z.kb.x * dt; p.z += z.kb.z * dt; z.kb.multiplyScalar(Math.exp(-5 * dt));
        if (z.muerteT > 5) quitarZombi(i);
        continue;
      }
      if (z.flash > 0) z.flash -= dt;
      z.muerteT += dt;
      if (z.hundir) { p.y -= dt * (z.hundirRapido ? 1.1 : 0.32) * Math.min(2.5, z.esc); z.mOk = false; if ((z.hundirT -= dt) <= 0) quitarZombi(i); }
      else if (!z.rag && z.muerteT > CAL[AJ.calidad].vidaCad * (T.jefe ? 1.5 : 1)) empezarHundir(z, false);
      continue;
    }
    const px0 = p.x, pz0 = p.z;
    const dx = J.pos.x - p.x, dz = J.pos.z - p.z, dist = Math.hypot(dx, dz) || 0.001;
    z.velMult = Math.min(1, z.velMult + dt * 1.6);
    if (z.quemaT > 0) { // Infinito: prendido fuego
      z.quemaT -= dt; z.vida -= z.quemaD * dt; z.flash = Math.max(z.flash, 0.03);
      if ((z.quemaE = (z.quemaE || 0) - dt) <= 0) { z.quemaE = 0.1; ef.llama(p.x + (Math.random() - .5) * 0.4, p.y + (0.5 + Math.random()) * z.esc, p.z + (Math.random() - .5) * 0.4); if (z.T.jefe) hudJefe(); }
      if (z.vida <= 0) { _d.set(-dx / dist, 0, -dz / dist); matar(z, false, _d, false, z.quemaArma, false); continue; }
    }
    let v = T.vel * (T.jefe ? 1 : ola) * z.velMult * (z.rengo ? 0.62 : 1) * (modoPlay ? MODO().vel : 1);
    if (!enJuego) v *= 0.4;
    if (z.sube) { p.y += dt * 1.3; v *= 0.35; if (p.y >= -0.5) z.sube = false; }
    if (z.prep > 0 || z.ataque > 0 || z.aturdido > 0) v = 0;
    // a dónde va: decisión cacheada (decidir) que se recalcula cada 0,05-0,3 s según la distancia
    if (z.alerta > 0) z.alerta -= dt;
    if ((z.decT -= dt) <= 0 || z.dirX === undefined) decidir(z, p, dist, dx, dz);
    let tx = z.dirX, tz = z.dirZ; v *= z.modV;
    if (dist < 2.5 && !z.orbita) { tx = dx / dist; tz = dz / dist; } // pegado: directo (salvo que esté rodeando hacia su lugar)
    let mira = Math.atan2(dx, dz);
    z.golpeT -= dt; if (z.ataque > 0) z.ataque -= dt; if (z.aturdido > 0) z.aturdido -= dt;
    const alcance = T.alcance;
    // --- comportamiento por tipo
    if (z.tipo === 'escupidor' && enJuego && !z.sube) {
      z.timerIA -= dt;
      if (dist < 14 && dist > 4.5 && local(p.x, p.z, _l).d > -10.4) { // en la arena no se planta: primero sube a la rambla
        v *= dist < (quedanOla <= 2 ? 6 : 10) ? 0 : 0.6; // se planta a distancia (si es de los últimos, se arrima: que no quede escondido escupiendo detrás de un auto)
        if (z.timerIA <= 0 && z.prep <= 0) { z.prep = z.prepTotal = T.prep; z.accion = 'escupir'; z.timerIA = 3 + Math.random() * 1.5; }
      }
    }
    if (z.tipo === 'griton' && enJuego && !z.sube) { /* U4: se planta y grita: alerta y apura a la horda cercana */
      z.timerIA -= dt;
      if (dist < 24 && dist > 3 && z.timerIA <= 0 && z.prep <= 0) { z.prep = z.prepTotal = T.prep; z.accion = 'gritar'; z.timerIA = 7 + Math.random() * 3; v = 0; }
    }
    if (tiempo < GRITO[2] && !T.jefe && z.tipo !== 'griton') { const gx = p.x - GRITO[0], gz = p.z - GRITO[1]; if (gx * gx + gz * gz < 900) v *= 1.3; }
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
        const nc = fis.grilla.buscar(p.x, p.z, 1.3, _candZ);
        for (let q = 0; q < nc; q++) { const c = _candZ[q]; if ((c.x - p.x) ** 2 + (c.z - p.z) ** 2 < (c.r + 1.3) ** 2 && (c.x - p.x) * z.cdx + (c.z - p.z) * z.cdz > 0) { // se la dio contra un auto
          z.cargaT = 0; z.aturdido = 2.6; sonido.chapa(); sonido.golpe(); shake = Math.max(shake, 0.7); ef.impacto(_p.set(p.x, p.y + 2, p.z), -z.cdx, -z.cdz, true);
          aviso('¡Se la dio! Ahora pegale'); break;
        } }
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
    if (T.jefe && enJuego && z.t1 !== undefined) { const r = iaJefe(z, p, dt, dist, dx, dz); if (r === 'quieto') v = 0; else if (r) v *= r; if (z.cargaT > 0 && z.tipo === 'garrafero') { mira = Math.atan2(z.cdx, z.cdz); } }
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
        } else if (z.accion === 'gritar' && enJuego) {
          oir(p.x, p.z, 40); GRITO[0] = p.x; GRITO[1] = p.z; GRITO[2] = tiempo + 4; sonido.grito(); z.ataque = 0.5;
          if (dist < 15) { shake = Math.max(shake, 0.35); aviso('¡Un Gritón llamó a la horda!'); }
        } else if (z.accion === 'escupir' && enJuego) {
          _p.set(p.x, p.y + 1.6 * z.esc, p.z); _fin.set(J.pos.x, J.pos.y + 0.2, J.pos.z);
          ef.lanzar('baba', _p, _fin, Math.max(0.6, dist / 14), T.dano, 1.4, J.pos.y); sonido.escupe(); z.ataque = 0.4;
        } else if (z.accion === 'piedra' && enJuego) {
          _p.set(p.x, p.y + 5.5, p.z);
          _fin.set(J.pos.x + (Math.random() - .5) * 2, J.pos.y, J.pos.z + (Math.random() - .5) * 2);
          ef.lanzar('piedra', _p, _fin, 1.5, 28, 2.6, J.pos.y); sonido.tiraPiedra(); z.ataque = 0.4;
        } else if (z.accion === 'cargar' && enJuego) {
          z.cargaT = 1.6; z.cdx = dx / dist; z.cdz = dz / dist;
        } else if (enJuego && z.T.jefe) ataqueJefe(z, p, dist, dx, dz);
      }
    }
    // separación entre zombis
    _sep.set(0, 0, 0);
    const nv = grillaZ.buscar(p.x, p.z, 0.375 * (z.esc + escMax) + 0.1, _vec);
    for (let q = 0; q < nv; q++) {
      const o = _vec[q]; if (o === z || !o.vivo) continue;
      const ex = p.x - o.g.position.x, ez = p.z - o.g.position.z, e2 = ex * ex + ez * ez;
      const md = 0.75 * (z.esc + o.esc) * 0.5;
      if (e2 < md * md && e2 > 1e-6) { const e = Math.sqrt(e2), w = o.T.jefe ? 3 : o.tipo === 'tanque' ? 2 : 1; _sep.x += ex / e * (md - e) * w; _sep.z += ez / e * (md - e) * w;
        // no se atraviesan: si se meten más de un 35 %, se corrige la posición ya (mitad cada uno, el grande empuja más)
        const pen = md * 0.65 - e; if (pen > 0) { const k = pen * (w / (w + (z.T.jefe ? 3 : z.tipo === 'tanque' ? 2 : 1))); p.x += ex / e * k; p.z += ez / e * k; }
      }
    }
    const mv = cerca ? 0 : v;
    z.g.rotation.y += Math.atan2(Math.sin(mira - z.g.rotation.y), Math.cos(mira - z.g.rotation.y)) * Math.min(1, dt * (T.jefe ? 4 : 10));
    p.x += (tx * mv + z.kb.x + _sep.x * 4) * dt;
    p.z += (tz * mv + z.kb.z + _sep.z * 4) * dt;
    z.kb.multiplyScalar(Math.exp(-4 * dt));
    const rz = T.jefe ? 0.3 * z.esc : 0.3;
    const nc = fis.grilla.buscar(p.x, p.z, rz, _candZ);
    for (let q = 0; q < nc; q++) {
      const c = _candZ[q], cx = p.x - c.x, cz = p.z - c.z, c2 = cx * cx + cz * cz, rr = c.r + rz;
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
        if (z.trancado >= (quedanOla <= 4 ? 2 : 3) && !T.jefe && dist > 15) { ubicar(z, false); z.trancado = 0; }
      } else z.trancado = 0;
      // muy lejos (se fue por la punta del mapa o quedó atrás): reaparece en el anillo, fuera de la vista
      if (enJuego && !T.jefe && !z.sube && dist > 48) ubicar(z, false);
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
    if (dist < 30 || (z.animPar = !z.animPar)) animarZombi(z, dist < 30 ? dt : dt * 2, cerca ? 0.3 : mv / 1.5); // lejos: se anima un paso sí, otro no
    // rastro de sangre: los que se arrastran, los rengos y los muy lastimados
    if (enJuego && !z.sube && !T.jefe && (z.tipo === 'gateador' || z.rengo || z.sinBrazo[0] || z.sinBrazo[1] || z.vida < z.vidaMax * 0.45)) {
      const mx = p.x - px0, mz = p.z - pz0; z.rastro += Math.sqrt(mx * mx + mz * mz);
      const arr = z.tipo === 'gateador';
      if (z.rastro > (arr ? 0.5 : 0.85 + Math.random() * 0.5)) {
        z.rastro = 0; const fx = Math.sin(z.g.rotation.y), fz = Math.cos(z.g.rotation.y);
        if (arr) fis.sangre.gota(p.x - fx * 0.25, p.z - fz * 0.25, 0.3, z.cSangre, z.g.rotation.y, true);
        else fis.sangre.gota(p.x + (Math.random() - .5) * 0.3, p.z + (Math.random() - .5) * 0.3, 0.07 + Math.random() * 0.09, z.cSangre);
      }
    }
  }
}
function refuerzos(n) {
  sonido.rugido(0.5); mensaje('¡Llamó a los suyos!', '', true);
  for (let k = 0; k < n; k++) { const z = spawn(k % 2 ? 'gateador' : 'corredor', true); if (z) z.sube = false; }
}
// ---------- v8: IA de los jefes nuevos ----------
// Todos telegrafían: línea en el piso (lance), círculo rojo (garrafa, bengala), onda con huecos (tambor), cono (murga).
const _mano = new THREE.Vector3();
function manoJefe(z, j = 1) { z.manos[j].updateWorldMatrix(true, false); return z.manos[j].getWorldPosition(_mano); }
function refuerzosDe(n, tipo, vestir) { for (let k = 0; k < n; k++) { const o = spawn(tipo, true); if (o) { o.sube = false; o.alerta = 9; if (vestir) vestir(o, k); } } }
const _ang = a => Math.atan2(Math.sin(a), Math.cos(a));
const AP_SALUDO = 1.1, R_SALUDO = 12;
function iaJefe(z, p, dt, dist, dx, dz) {
  const k = z.vida / z.vidaMax, ocupado = z.prep > 0 || z.ataque > 0 || z.aturdido > 0;
  z.t1 -= dt;
  switch (z.tipo) {
    case 'anzuelo': {
      if (!z.fase2 && k < 0.5) { z.fase2 = true; mensaje('¡Salieron de la escollera!', 'Don Anzuelo llamó a los suyos', true); refuerzosDe(4, 'gateador'); sonido.rugido(0.7); }
      if (z.ganchoD >= 0) { // el anzuelo vuela por la línea marcada
        z.ganchoD += 30 * dt;
        _p.set(p.x + z.gx * z.ganchoD, J.pos.y + 1.2, p.z + z.gz * z.ganchoD); jfx.tanza(manoJefe(z), _p);
        if (Math.hypot(J.pos.x - _p.x, J.pos.z - _p.z) < 1.05) { z.ganchoD = -1; z.enganche = 1.5; z.engDano = 0; sonido.engancha(); aviso('¡Te enganchó! Tirale para soltarte'); vibrar([40, 30, 40]); }
        else if (z.ganchoD > 19) { z.ganchoD = -1; jfx.tanza(null); if (--z.lances > 0) z.t1 = 0.35; }
        return 'quieto';
      }
      if (z.enganche > 0) { // te arrastra hacia él
        z.enganche -= dt;
        if (dist > 2.6) empujarJugador(-dx / dist, -dz / dist, 7 * dt);
        _p.set(J.pos.x, J.pos.y + 1.1, J.pos.z); jfx.tanza(manoJefe(z), _p);
        if (dist <= 2.6 || z.enganche <= 0 || z.engDano > z.vidaMax * 0.05) {
          if (dist <= 2.9) { recibirDano(z.T.dano * 1.2 * MODO().dano, p.x, p.z); empujarJugador(dx / dist, dz / dist, 1.6); shake = Math.max(shake, 0.8); sonido.golpe(); z.ataque = 0.4; }
          else aviso('¡Te soltaste!');
          z.enganche = 0; jfx.tanza(null); z.golpeT = 1.2;
        }
        return 'quieto';
      }
      if (!ocupado && z.t1 <= 0 && dist > 4.5 && dist < 18) {
        z.t1 = (z.fase2 ? 3.6 : 4.8) + Math.random(); if (z.lances <= 0) z.lances = z.fase2 ? 2 : 1;
        z.prep = z.prepTotal = 0.85; z.accion = 'lance'; z.gx = dx / dist; z.gz = dz / dist;
        jfx.linea(p.x, p.y, p.z, Math.atan2(-z.gx, -z.gz), 19, 1.2, 0.85);
      }
      return dist < 7 ? 0.5 : 1; // se queda a distancia de lance
    }
    case 'garrafero': {
      if (z.t2 > 0 && (z.t2 -= dt) <= 0) z.f.garrafaMano = true;
      if (!z.fase2 && k < 0.6) { z.fase2 = true; mensaje('¡Reparto doble!', 'Ahora tira de a tres', true); }
      if (!z.fase3 && k < 0.3 && !z.sinRack && !ocupado) { z.fase3 = true; z.prep = z.prepTotal = 1.1; z.accion = 'carga'; aviso('¡Prendió las garrafas! Tirale a la espalda'); sonido.mecha(); }
      if (z.cargaT > 0) { // embestida con la carga de la espalda prendida
        z.cargaT -= dt; z.cargaG = z.cargaT;
        z.cdx += (dx / dist - z.cdx) * Math.min(1, dt * 1.4); z.cdz += (dz / dist - z.cdz) * Math.min(1, dt * 1.4); const l = Math.hypot(z.cdx, z.cdz) || 1; z.cdx /= l; z.cdz /= l;
        p.x += z.cdx * 5.4 * dt; p.z += z.cdz * 5.4 * dt;
        if ((z.llamaT -= dt) <= 0) { z.llamaT = 0.04; ef.llama(p.x - z.cdx * 0.6 * z.esc, p.y + 1.5 * z.esc, p.z - z.cdz * 0.6 * z.esc); if (Math.random() < 0.15) sonido.mecha(); }
        if (z.rackDano > z.vidaMax * 0.07) reventarRack(z, true);
        else if (dist < 2.7 || z.cargaT <= 0) reventarRack(z, false);
        return 'quieto';
      }
      if (!ocupado && z.t1 <= 0 && dist > 5 && dist < 26) { z.t1 = (z.fase2 ? 2.7 : 3.4) + Math.random() * 0.8; z.prep = z.prepTotal = 0.8; z.accion = z.fase2 ? 'tirar3' : 'tirar'; }
      return dist < 8 ? 0.5 : 1;
    }
    case 'bengala': {
      if ((z.llamaT -= dt) <= 0) { z.llamaT = 0.07; const m = manoJefe(z, 1); ef.llama(m.x, m.y + 0.25 * z.esc, m.z); if (z.f.bengala2) { const m0 = manoJefe(z, 0); ef.llama(m0.x, m0.y + 0.25 * z.esc, m0.z); } }
      if (!z.fase2 && k < 0.6 && !ocupado) { z.fase2 = true; z.f.bengala2 = true; z.prep = z.prepTotal = 1.0; z.accion = 'llamar'; z.llamarTipo = 'barra'; }
      if (z.mandaT > 0) { z.mandaT -= dt; return 2.7; } // se manda de frente
      z.mandaCD -= dt;
      if (!ocupado && z.mandaCD <= 0 && dist > 7 && dist < 20) { z.mandaCD = 7 + Math.random() * 3; z.mandaT = 1.4; sonido.rugido(0.9); aviso('¡Se manda el Bengala!'); return 2.7; }
      if (!ocupado && z.t1 <= 0 && dist > 4 && dist < 22) { z.t1 = (z.fase2 ? 2.3 : 3.0) + Math.random() * 0.8; z.prep = z.prepTotal = 0.6; z.accion = 'tirar'; }
      return 1;
    }
    case 'lubolo': {
      if (!z.fase2 && k < 0.5 && !ocupado && z.beatN <= 0) { z.fase2 = true; z.prep = z.prepTotal = 1.0; z.accion = 'llamar'; z.llamarTipo = 'cuerda'; }
      if (z.beatN > 0) { // la llamada: golpes de tambor en ritmo, cada uno larga una onda
        z.beatT -= dt;
        if (z.beatT <= 0) { z.beatN--; z.beatT = z.fase2 ? 0.5 : 0.65; golpeTambor(z, p); }
        return 'quieto';
      }
      if (!ocupado && z.t1 <= 0 && dist < 20) { z.t1 = (z.fase2 ? 4.4 : 5.8) + Math.random(); z.prep = z.prepTotal = 0.75; z.accion = 'tambor'; sonido.repique(); }
      return 1;
    }
    case 'tablado': {
      if (!z.fase2 && k < 0.66 && !ocupado && z.saludoN <= 0) { z.fase2 = true; z.prep = z.prepTotal = 1.1; z.accion = 'llamar'; z.llamarTipo = 'coro'; }
      if (!z.fase3 && k < 0.33) { z.fase3 = true; mensaje('¡La retirada!', 'Don Tablado barre con todo', true); sonido.murga(); }
      if (z.saludoN > 0) { // retirada: barre a los costados
        z.saludoT -= dt;
        if (z.saludoT <= 0) {
          conoGolpe(z, z.saludoSig); z.saludoN--;
          if (z.saludoN > 0) { z.saludoSig = z.saludoBase - 0.95; jfx.cono(p.x, p.y, p.z, z.saludoSig + Math.PI, AP_SALUDO, R_SALUDO, 0.5); z.saludoT = 0.5; z.ataque = 0.35; }
        }
        return 'quieto';
      }
      if (!ocupado && z.t1 <= 0 && dist < 12) {
        z.t1 = (z.fase3 ? 4.2 : 4.8) + Math.random(); z.prep = z.prepTotal = 0.9; z.accion = 'saludo'; z.saludoAng = Math.atan2(dx, dz);
        jfx.cono(p.x, p.y, p.z, z.saludoAng + Math.PI, AP_SALUDO, R_SALUDO, 0.9); sonido.pito();
      }
      return dist > 12 ? 1.35 : 1;
    }
  }
  return 1;
}
function ataqueJefe(z, p, dist, dx, dz) {
  const a = z.accion;
  if (a === 'lance') { z.ganchoD = 0.6; sonido.latigo(); z.ataque = 0.4; }
  else if (a === 'tirar' || a === 'tirar3') {
    z.ataque = 0.4; const m = manoJefe(z); const ox = m.x, oy = m.y, oz = m.z, px = -dz / dist, pz = dx / dist;
    if (z.tipo === 'garrafero') {
      const n = a === 'tirar3' ? 3 : 1;
      for (let i = 0; i < n; i++) { const off = n > 1 ? (i - 1) * 3.4 : 0; _p.set(ox, oy, oz); _fin.set(J.pos.x + px * off + (Math.random() - .5) * 1.2, J.pos.y, J.pos.z + pz * off + (Math.random() - .5) * 1.2); ef.lanzar('garrafa', _p, _fin, 1.05 + dist / 35 + i * 0.12, 30, 3.4, J.pos.y); }
      sonido.tiraPiedra(); z.f.garrafaMano = false; z.t2 = 0.9;
    } else {
      const n = z.fase2 ? 2 : 1;
      for (let i = 0; i < n; i++) { const off = n > 1 ? (i ? 2.2 : -2.2) : 0; _p.set(ox, oy, oz); _fin.set(J.pos.x + px * off + (Math.random() - .5), J.pos.y, J.pos.z + pz * off + (Math.random() - .5)); ef.lanzar('bengala', _p, _fin, 0.9 + dist / 45, 14, 2.2, J.pos.y); }
      sonido.bengala();
    }
  }
  else if (a === 'tambor') { z.beatN = z.fase2 ? 4 : 3; z.beatT = 0; }
  else if (a === 'saludo') { conoGolpe(z, z.saludoAng); if (z.fase3) { z.saludoBase = z.saludoAng; z.saludoN = 2; z.saludoSig = z.saludoAng + 0.95; jfx.cono(p.x, p.y, p.z, z.saludoSig + Math.PI, AP_SALUDO, R_SALUDO, 0.5); z.saludoT = 0.5; } }
  else if (a === 'llamar') llamarJefe(z);
  else if (a === 'carga') { z.cargaT = 4.5; z.cdx = dx / dist; z.cdz = dz / dist; z.rackDano = 0; sonido.rugido(0.7); }
}
function reventarRack(z, porJugador) {
  const p = z.g.position, bx = p.x - Math.sin(z.g.rotation.y) * 0.5 * z.esc, bz = p.z - Math.cos(z.g.rotation.y) * 0.5 * z.esc;
  z.f.garrafas = false; z.sinRack = true; z.cargaT = 0; z.cargaG = 0;
  explosionGarrafa(bx, p.y + 0.4, bz, 5.5, porJugador ? 26 : 44, 130, false, z);
  z.vida -= z.vidaMax * (porJugador ? 0.16 : 0.08); z.aturdido = porJugador ? 3.2 : 1.2; z.flash = 0.3; hudJefe();
  mensaje(porJugador ? '¡Le reventaste las garrafas!' : '¡Reventó todo!', porJugador ? 'Está mareado: dale con todo' : 'La próxima tirale a la espalda', !porJugador);
  if (z.vida <= 0) { _d.set(Math.sin(z.g.rotation.y), 0, Math.cos(z.g.rotation.y)); matar(z, false, _d, false, porJugador ? 'explosion' : null, true); }
}
function golpeTambor(z, p) {
  sonido.tambor(); z.ataque = 0.3; shake = Math.max(shake, 0.25); ef.golpeSuelo(p, 3);
  let aj = Math.atan2(J.pos.z - p.z, J.pos.x - p.x); if (aj < 0) aj += Math.PI * 2;
  const g1 = (aj + (Math.random() - .5) * 2.0 + Math.PI * 2) % (Math.PI * 2);
  const dos = !z.fase2 || Math.random() < 0.4, g2 = dos ? (g1 + Math.PI * (0.7 + Math.random() * 0.6)) % (Math.PI * 2) : 9;
  jfx.onda(p.x, p.y, p.z, [g1, g2, 9], 8.5, 24, 20, z.fase2 ? 0.34 : 0.42, z.beatN % 2 ? 0x5ab4ff : 0xff6a20);
}
function conoGolpe(z, ang) {
  const p = z.g.position; z.ataque = 0.45; sonido.bombo();
  ef.confeti(p.x + Math.sin(ang) * 1.2, p.y + 1.6 * z.esc, p.z + Math.cos(ang) * 1.2, Math.sin(ang), Math.cos(ang), 36);
  const dx = J.pos.x - p.x, dz = J.pos.z - p.z, d = Math.hypot(dx, dz);
  if (estado === 'jugando' && d < R_SALUDO && Math.abs(_ang(Math.atan2(dx, dz) - ang)) < AP_SALUDO / 2) {
    recibirDano(26 * MODO().dano, p.x, p.z); J.lento = Math.max(J.lento, 1.5); empujarJugador(dx / (d || 1), dz / (d || 1), 1.2); aviso('¡Papelitos en los ojos! Salí del cono');
  }
}
function llamarJefe(z) {
  const p = z.g.position; z.ataque = 0.5;
  if (z.llamarTipo === 'barra') {
    mensaje('¡Avalancha!', 'El Bengala llamó a la barra', true); sonido.pito(); ef.humoColor(p.x, p.y + 1, p.z, 14, 0.9, 0.75, 0.12); ef.humoColor(p.x, p.y + 1, p.z, 10, 0.08, 0.08, 0.08);
    refuerzosDe(6, 'corredor', (o, k) => { if (k % 2) { o.f.pena = true; o.cRemera.setHex(0xe0b818); o.cAcc1.setHex(0x121212); } else { o.f.nac = true; o.cRemera.setHex(0xe6e6ea); o.cAcc1.setHex(0x1a3a9a); } o.cRasgon.copy(o.cRemera).multiplyScalar(0.45); });
  } else if (z.llamarTipo === 'cuerda') {
    mensaje('¡Llegó la cuerda!', 'El Lubolo Mayor llamó a los tambores', true); sonido.repique();
    refuerzosDe(4, 'normal', (o, k) => { o.f.tambor = true; o.f.pena = o.f.nac = false; o.cAcc1.setHex([0x2a6ad0, 0xd02a2a, 0x2aa04a, 0xe8c020][k % 4]); o.cAcc2.setHex(0xe8e8e8); o.cRemera.copy(o.cPiel); });
  } else if (z.llamarTipo === 'coro') {
    mensaje('¡Sube el coro!', 'Don Tablado trajo a la murga', true); sonido.murga();
    refuerzosDe(5, 'normal', (o, k) => { o.f.murga = true; o.f.gorra = o.f.pena = o.f.nac = false; o.cPiel.setHex(0xe0dcd0); o.pelo.scale.setScalar(0.001); o.cAcc1.setHex([0xf0c020, 0xd02a6a, 0x2ab0d0, 0x8ad02a, 0xff7a20][k % 5]); o.cAcc2.setHex([0x6a1a8a, 0x1a8a9a, 0xb01a1a][k % 3]); o.cRemera.setHex(0x3a1a5a); });
  }
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
  if (modoInf && !modsHecho) { abrirMods(); return; }
  estado = 'tienda'; disparando = false; autoDisparo = false; recargaT = 0;
  if (document.pointerLockElement) document.exitPointerLock();
  // recarga gratis al entrar
  for (const a0 of ARMAS) if (a0.tipo === 'fuego' && tiene.has(a0.id)) { const a = A(a0.id), n = Math.min(cargMax(a) - cargador[a.id], reserva[a.id]); cargador[a.id] += n; if (reserva[a.id] !== Infinity) reserva[a.id] -= n; }
  $('tienda-sub').textContent = `Oleada ${oleada} superada · La próxima: ${oleada + 1}${jefeDe(oleada + 1) ? ' — ¡viene un jefe!' : ''}`;
  pintarTienda();
  mostrar('tienda'); capaJuego(false);
  musica.set(0.1, false, true);
}
function cerrarTienda() {
  ocultar('tienda'); estado = 'jugando'; descanso = 3; modsHecho = false; capaJuego(true); hud();
  if (!movil) pedirLock();
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
    for (const a0 of ARMAS) {
      if (modoInf && !armasInf.includes(a0.id)) continue; const a = A(a0.id);
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
        if (!modoInf && !perfil.armasCamp.includes(a.id)) { perfil.armasCamp.push(a.id); guardarPerfil(perfil); } /* queda desbloqueada para el Infinito */
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
  if (perfil.logros[id] || modoPlay) return; /* el Playground no da logros */
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
  let nuevo = false;
  if (modoPlay) { /* sandbox: no toca récords ni progreso */ }
  else { perfil.partidas++; perfil.bajas += bajas; }
  if (modoPlay) { }
  else if (modoInf) { const I = perfil.inf; I.partidas++; I.bajas += bajas; I.mejorOleada = Math.max(I.mejorOleada, oleada - 1); nuevo = puntos > I.record; if (nuevo) I.record = puntos; }
  else { perfil.mejorOleada = Math.max(perfil.mejorOleada, gano ? OLEADAS_TOTAL : oleada - 1); nuevo = puntos > perfil.record; if (nuevo) perfil.record = puntos; }
  if (gano && !modoPlay) { perfil.victorias++; perfil.pesadilla = true; }
  guardarPerfil(perfil); try { localStorage.setItem('rz-record', perfil.record); } catch (e) { }
  const seg = Math.round((performance.now() - S.inicio) / 1000), pre = S.disparos ? Math.round(S.aciertos / S.disparos * 100) : 0;
  const fav = Object.entries(S.porArma).sort((a, b) => b[1].bajas - a[1].bajas)[0];
  $('fin-stats').innerHTML = [
    [puntos, 'puntos'], [bajas, 'zombis'], [S.cabezas, 'a la cabeza'], [pre + '%', 'puntería'],
    [`${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, '0')}`, 'tiempo'], ['$' + S.gastado, 'gastado'],
    [fav && A(fav[0]) ? A(fav[0]).nombre : '—', 'arma favorita'], [Math.round(S.recibido), 'daño recibido']
  ].map(([b, s]) => `<div><b>${b}</b><small>${s}</small></div>`).join('');
  $('fin-logros').innerHTML = (nuevo ? '<div class="nuevo">¡Récord nuevo!</div>' : `Récord${modoInf ? ' del Infinito' : ''}: ${modoInf ? perfil.inf.record : perfil.record}`) +
    (S.logrosNuevos.length ? '<br>Logros: ' + S.logrosNuevos.map(id => LOGROS.find(l => l.id === id)?.nombre).join(' · ') : '');
}
function finDelJuego() {
  estado = 'fin'; disparando = false; autoDisparo = false; sonido.muerte(); vibrar([100, 50, 200]);
  if (document.pointerLockElement) document.exitPointerLock();
  cerrarPartida(false);
  $('fin').classList.remove('victoria');
  $('fin-titulo').textContent = ['Te comieron, bo', 'Fuiste almuerzo', 'Se terminó la noche'][Math.floor(Math.random() * 3)];
  $('fin-sub').innerHTML = modoPlay ? `Playground en ${MAPA.nombre}: llegaste a la oleada <b>${oleada}</b>.` : modoInf ? `Modo Infinito: caíste en la oleada <b>${oleada}</b>. Tu mejor marca: oleada ${perfil.inf.mejorOleada}.` : `Aguantaste hasta la oleada <b>${oleada}</b> de ${OLEADAS_TOTAL}.`;
  $('jefe').classList.add('oculto'); musica.set(0, false, true);
  setTimeout(() => { mostrar('fin'); capaJuego(false); }, 1400);
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
  setTimeout(() => { mostrar('fin'); capaJuego(false); }, 4500);
}

// ---------- HUD (solo toca el DOM cuando algo cambia) ----------
const prevHud = {};
function poner(id, prop, val) { const k = id + prop; if (prevHud[k] === val) return; prevHud[k] = val; const el = $(id); if (prop === 'text') el.textContent = val; else if (prop === 'w') el.style.width = val; else el[prop] = val; }
function hud() {
  poner('oleada', 'text', oleada ? modoPlay ? (cfgPlay.olas > 0 ? `Oleada ${oleada}/${cfgPlay.olas} · Playground` : `Oleada ${oleada} · Playground`) : modoInf ? `Oleada ${oleada} ♾` : (oleada === OLEADAS_TOTAL ? 'Última oleada' : `Oleada ${oleada}/${OLEADAS_TOTAL}`) : 'Preparate');
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
  let i = 0;
  ARMAS.forEach(a => {
    if (!tiene.has(a.id)) return;
    const d = document.createElement('div'); d.dataset.id = a.id; i++;
    d.innerHTML = `<b>${i <= 10 ? i % 10 : ''}</b>${a.nombre.split(' ')[0]}`;
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
  const n = e.key === '0' ? 10 : +e.key; if (n >= 1) { const L = ARMAS.filter(x => tiene.has(x.id)); if (n <= L.length) elegirArma(L[n - 1].id); } // la n-ésima de las que tenés
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
let resumeIgnore = 0;
function enUI(el) { return el && el.closest && el.closest('#b-pausa, #b-fuego, #b-recarga, #b-cambiar, #barra-armas, #girar, .pantalla, button'); }
function tocar(e) {
  if (estado !== 'jugando') return;
  if (enUI(e.target) && e.target.closest && e.target.closest('#b-pausa, .pantalla, #girar')) return;
  if (performance.now() < resumeIgnore) { e.preventDefault(); return; }
  for (const t of e.changedTouches) {
    const el = t.target;
    if (el.closest && el.closest('#b-fuego')) { disparando = true; $('b-fuego').classList.add('on'); vibrar(8); if (mirarId === null) { mirarId = t.identifier; mx0 = t.clientX; my0 = t.clientY; } continue; }
    if (el.closest && el.closest('button, #barra-armas, #b-pausa')) continue;
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
(function () {
  const bp = $('b-pausa');
  const ir = e => { e.preventDefault(); e.stopPropagation(); pausar(); };
  bp.addEventListener('pointerdown', ir);
  bp.addEventListener('touchend', ir, { passive: false });
  bp.addEventListener('click', ir);
})();
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
function capaJuego(si) {
  $('hud').classList.toggle('oculto', !si);
  $('tactil').classList.toggle('oculto', !(si && movil));
  $('b-pausa').classList.toggle('oculto', !(si && movil));
}
const PANTALLAS = ['inicio', 'como', 'logros', 'pausa', 'tienda', 'fin', 'ajustes', 'infinito', 'mods', 'playground'];
function mostrar(id) { PANTALLAS.forEach(p => $(p).classList.toggle('oculto', p !== id)); }
function ocultar(id) { $(id).classList.add('oculto'); }
function telon(fn) { $('telon').classList.add('on'); setTimeout(() => { fn(); $('telon').classList.remove('on'); }, 340); }
let primeraVez = true;
function jugar() {
  iniciarAudio(); setVolumen(); musica.iniciar();
  telon(() => {
    reiniciar(); estado = 'jugando';
    PANTALLAS.forEach(ocultar);
    capaJuego(true);
    $('jefe').classList.add('oculto');
    if (!movil) pedirLock();
    if (modoPlay) mensaje('Playground', MAPA.nombre + ' · ' + cfgPlay.cantidad + ' zombis por oleada', false); else if (modoInf) mensaje('Modo Infinito', 'Hasta donde aguantes. Después de cada oleada, el taller', false); else mensaje(MAPA.id === 'rambla' ? 'Rambla: Zona Cero' : MAPA.nombre, AJ.modo === 'pesadilla' ? 'Modo Pesadilla. Que Dios te ayude' : 'Aguantá hasta que amanezca', false);
    revisarGiro();
  });
  if (movil && primeraVez && document.documentElement.requestFullscreen && !document.fullscreenElement && !matchMedia('(display-mode: standalone)').matches)
    document.documentElement.requestFullscreen().catch(() => { });
  primeraVez = false;
}
function soltarControles() {
  disparando = false; autoDisparo = false; joyId = null; mirarId = null; joy.x = joy.y = 0;
  palo.style.transform = ''; base.style.left = base.style.top = base.style.bottom = '';
  $('b-fuego').classList.remove('on');
}
function pausar() {
  if (estado !== 'jugando') return;
  estado = 'pausa'; soltarControles(); musica.pausa(true);
  $('pausa-info').textContent = `Oleada ${oleada} · ${puntos} puntos · $${pesos}`;
  mostrar('pausa');
  if (document.pointerLockElement) document.exitPointerLock();
}
function seguir() {
  estado = 'jugando'; soltarControles(); musica.pausa(false); PANTALLAS.forEach(ocultar);
  resumeIgnore = performance.now() + 280; acum = 0; ultimo = performance.now(); rafPrev = 0;
  if (!movil) pedirLock();
}
function aMenu() {
  if (modoInf && oleada > 1 && estado !== 'fin' && estado !== 'inicio') cerrarPartida(false); /* Infinito: salir también cuenta la marca */
  telon(() => {
    estado = 'inicio'; modoPlay = false; PANTALLAS.forEach(ocultar); mostrar('inicio'); pintarMapas();
    capaJuego(false); $('girar').classList.add('oculto');
    reiniciar(); poblarMenu(); mostrarRecord(); musica.pausa(false); musica.set(0, false, true);
  });
}
const clic = (id, fn) => {
  let t0 = 0;
  const ir = e => {
    e.preventDefault(); e.stopPropagation();
    const n = performance.now(); if (n - t0 < 400) return; t0 = n;
    iniciarAudio(); sonido.clic(); fn();
  };
  const el = $(id);
  el.addEventListener('pointerup', ir);
  el.addEventListener('click', ir);
};
clic('b-jugar', () => { modoPlay = false; if (modoInf) { modoInf = false; recalcInf(); } jugar(); });
clic('b-infinito', () => { volverA = 'inicio'; pintarInfinito(); mostrar('infinito'); });
clic('b-inf-jugar', () => { if (!armasInf.length) return; modoPlay = false; modoInf = true; perfil.infArmas = armasInf.slice(); guardarPerfil(perfil); jugar(); });
$('b-mods-tirar').addEventListener('click', () => { const pr = precioTirada(); if (pesos < pr) return; pesos -= pr; S.gastado += pr; tiradasInf++; sonido.comprar(); opcionesInf = ofrecer(armasInf, modsInf, oleada); pintarMods(); hud(); });

// ---------- Mapas (menú principal) ----------
function pintarMapas() {
  const L = $('mapas-sel'); if (!L) return; L.innerHTML = '';
  const sel = MAPAS[perfil.mapa] && mapaLibre(MAPAS[perfil.mapa]) ? perfil.mapa : 'rambla';
  for (const id of ORDEN_MAPAS) {
    const M = MAPAS[id], ok = mapaLibre(M), b = document.createElement('button');
    b.className = id === sel ? 'sel' : ''; b.disabled = !ok;
    b.innerHTML = `${ok ? '' : '🔒 '}${M.nombre}<small>${ok ? M.sub.split(',')[0] : 'Llegá a la oleada ' + M.desbloq}</small>`;
    b.addEventListener('click', () => { if (!ok || perfil.mapa === id) return; perfil.mapa = id; guardarPerfil(perfil); sonido.clic(); reiniciar(); poblarMenu(); pintarMapas(); });
    L.appendChild(b);
  }
}
// ---------- Playground: partida a medida (no toca récords ni progreso) ----------
const TIPOS_PLAY = [['normal', 'Comunes'], ['corredor', 'Corredores'], ['gateador', 'Gateadores'], ['escupidor', 'Escupidores'], ['explosivo', 'Explosivos'], ['griton', 'Gritones'], ['tanque', 'Tanques']];
const DIF_NOM = { facil: 'Fácil', normal: 'Normal', dificil: 'Difícil', infierno: 'Infierno' };
function cargarPlay() {
  let c = {}; try { c = JSON.parse(localStorage.getItem('rz-play') || '{}') || {}; } catch (e) { }
  const base = { mapa: 'rambla', cantidad: 25, dur: 60, dif: 'normal', tipos: ['normal', 'corredor', 'gateador'], armas: ['pistola', 'escopeta', 'termo'], municion: true, invencible: false, jefes: false, jefeCada: 3, olas: 0, pausa: 5 };
  c = Object.assign(base, c);
  if (!MAPAS[c.mapa]) c.mapa = 'rambla';
  c.tipos = (c.tipos || []).filter(t => TIPOS[t]); if (!c.tipos.length) c.tipos = ['normal'];
  c.armas = (c.armas || []).filter(a => ARMAS.some(x => x.id === a)); if (!c.armas.length) c.armas = ['pistola'];
  c.jefeCada = Math.max(2, Math.min(10, +c.jefeCada || 3));
  c.jefesTipos = (c.jefesTipos || ORDEN_JEFES.slice()).filter(t => ORDEN_JEFES.includes(t)); if (!c.jefesTipos.length) c.jefesTipos = ORDEN_JEFES.slice();
  c.olas = Math.max(0, Math.min(30, +c.olas || 0));
  return c;
}
function guardarPlay() { try { localStorage.setItem('rz-play', JSON.stringify(cfgPlay)); } catch (e) { } }
function pintarPlay() {
  const c = cfgPlay;
  const opc = (id, lista, actual, fn) => { const L = $(id); L.innerHTML = ''; for (const [k, t] of lista) { const b = document.createElement('button'); b.textContent = t; b.className = k === actual ? 'sel' : ''; b.onclick = () => { sonido.clic(); fn(k); guardarPlay(); pintarPlay(); }; L.appendChild(b); } };
  const chips = (id, lista, tiene, fn) => { const L = $(id); L.innerHTML = ''; for (const [k, t] of lista) { const b = document.createElement('button'); b.textContent = t; b.className = tiene(k) ? 'sel' : ''; b.onclick = () => { sonido.clic(); fn(k); guardarPlay(); pintarPlay(); }; L.appendChild(b); } };
  const alternar = (arr, k) => { const i = arr.indexOf(k); if (i >= 0) { if (arr.length > 1) arr.splice(i, 1); } else arr.push(k); };
  opc('pg-mapa', ORDEN_MAPAS.map(id => [id, MAPAS[id].nombre]), c.mapa, k => c.mapa = k);
  opc('pg-dif', Object.entries(DIF_NOM), c.dif, k => c.dif = k);
  chips('pg-tipos', TIPOS_PLAY, k => c.tipos.includes(k), k => alternar(c.tipos, k));
  chips('pg-armas', ARMAS.map(a => [a.id, a.nombre]), k => c.armas.includes(k), k => alternar(c.armas, k));
  chips('pg-extras', [['municion', 'Munición infinita'], ['invencible', 'Invencible'], ['jefes', 'Jefes']], k => c[k], k => c[k] = !c[k]);
  $('pg-cant').value = c.cantidad; $('pg-cant-v').textContent = c.cantidad;
  $('pg-dur').value = c.dur; $('pg-dur-v').textContent = c.dur + ' s';
  $('pg-olas').value = c.olas; $('pg-olas-v').textContent = c.olas > 0 ? c.olas : 'sin límite';
  $('pg-jefe').value = c.jefeCada; $('pg-jefe-v').textContent = c.jefeCada + ' oleadas';
  $('pg-jefe-fila').classList.toggle('oculto', !c.jefes);
  $('pg-jefes-fila').classList.toggle('oculto', !c.jefes);
  chips('pg-jefes', ORDEN_JEFES.map(t => [t, JEFES_INFO[t].nombre]), k => c.jefesTipos.includes(k), k => alternar(c.jefesTipos, k));
  $('b-pg-jugar').textContent = `¡A jugar! · ${MAPAS[c.mapa].nombre}`;
}
cfgPlay = cargarPlay();
$('pg-cant').oninput = e => { cfgPlay.cantidad = +e.target.value; $('pg-cant-v').textContent = cfgPlay.cantidad; guardarPlay(); };
$('pg-dur').oninput = e => { cfgPlay.dur = +e.target.value; $('pg-dur-v').textContent = cfgPlay.dur + ' s'; guardarPlay(); };
$('pg-olas').oninput = e => { cfgPlay.olas = +e.target.value; $('pg-olas-v').textContent = cfgPlay.olas > 0 ? cfgPlay.olas : 'sin límite'; guardarPlay(); };
$('pg-jefe').oninput = e => { cfgPlay.jefeCada = +e.target.value; $('pg-jefe-v').textContent = cfgPlay.jefeCada + ' oleadas'; guardarPlay(); };
clic('b-play', () => { volverA = 'inicio'; pintarPlay(); mostrar('playground'); });
clic('b-pg-jugar', () => { modoPlay = true; if (modoInf) { modoInf = false; recalcInf(); } guardarPlay(); jugar(); });
pintarMapas();
function pintarInfinito() {
  const L = $('inf-armas'); L.innerHTML = '';
  armasInf = (perfil.infArmas || []).filter(id => perfil.armasCamp.includes(id)); if (!armasInf.length) armasInf = ['pistola', 'termo'];
  for (const a of ARMAS) {
    const ok = perfil.armasCamp.includes(a.id), b = document.createElement('button');
    b.className = 'arma-sel' + (ok ? '' : ' bloq') + (armasInf.includes(a.id) ? ' sel' : ''); b.dataset.id = a.id;
    b.innerHTML = `<b>${a.nombre}</b><small>${ok ? (a.tipo === 'fuego' ? 'De fuego' : 'Cuerpo a cuerpo') + (armasInf.includes(a.id) ? ' · la llevás' : '') : '🔒 Comprala en el almacén de la campaña ($' + a.precio + ')'}</small>`;
    b.addEventListener('click', () => {
      if (!ok) { sonido.noPlata(); aviso('Primero comprala en la campaña'); return; }
      const i = armasInf.indexOf(a.id); if (i >= 0) { if (armasInf.length > 1) armasInf.splice(i, 1); } else armasInf.push(a.id);
      sonido.clic(); pintarInfinito2();
    });
    L.appendChild(b);
  }
  const I = perfil.inf;
  $('inf-record').textContent = I.partidas ? `Tu mejor: oleada ${I.mejorOleada} · ${I.record} puntos · ${I.partidas} partidas` : 'Todavía no jugaste el Infinito';
  $('b-inf-jugar').textContent = `¡A la rambla! (${armasInf.length} arma${armasInf.length > 1 ? 's' : ''})`;
}
function pintarInfinito2() { const keep = armasInf.slice(); perfil.infArmas = keep; pintarInfinito(); } clic('b-otra', jugar); clic('b-seguir', seguir); clic('b-salir', aMenu); clic('b-menu', aMenu);
let volverA = 'inicio';
clic('b-como', () => { volverA = 'inicio'; mostrar('como'); }); clic('b-como2', () => { volverA = 'pausa'; mostrar('como'); });
clic('b-logros', () => { volverA = 'inicio'; pintarLogros(); mostrar('logros'); });
document.querySelectorAll('.volver').forEach(b => b.addEventListener('click', () => { sonido.clic(); mostrar(volverA); }));
function mostrarRecord() {
  $('record').textContent = (perfil.record ? `Tu récord: ${perfil.record} puntos · mejor oleada ${perfil.mejorOleada}` : '') + (perfil.inf.partidas ? ` · Infinito: oleada ${perfil.inf.mejorOleada}` : '');
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
  let px = b.x * k + bobX + swayX, py = b.y + bobY + swayY, pz = b.z, rx = 0, ry = a.id === 'pistola' || a.id === 'revolver' ? 0.16 : 0, rz = 0; // las cortas, giradas hacia el centro: se ve el costado y no solo la cola
  if (a.tipo === 'fuego') {
    pz += kick * 0.07; rx += kick * (a.retroceso * 1.6 + 0.08); py += kick * 0.015;
    const car = m.userData.car || (m.userData.car = m.getObjectByName('cargador') || null), tam = m.userData.tam || (m.userData.tam = m.getObjectByName('tambor') || null);
    if (car && car.userData.y0 === undefined) car.userData.y0 = car.position.y;
    if (recargaT > 0) {
      const p = 1 - recargaT / recargaTotal, s = Math.sin(p * Math.PI); rx -= s * 0.7; ry += s * 0.3; py -= s * 0.12;
      // cargador: sale (15-40 %), entra (55-80 %) con un golpe al final; tambor: se abre de costado, gira y se cierra
      if (car) { const sale = p < 0.15 ? 0 : p < 0.4 ? (p - 0.15) / 0.25 : p < 0.55 ? 1 : p < 0.8 ? 1 - (p - 0.55) / 0.25 : 0; car.position.y = car.userData.y0 - sale * 0.22; car.visible = sale < 0.95; if (p > 0.8 && p < 0.86) py += 0.01; }
      if (tam) { const ab = Math.min(1, Math.min(p, 1 - p) * 6); tam.position.x = ab * 0.05; tam.rotation.z = p * 12; rz += ab * 0.35; }
    } else { if (car) { car.position.y = car.userData.y0; car.visible = true; } if (tam) { tam.position.x = 0; tam.rotation.z += Math.max(0, cdArma) * dt * 30; } }
    const gr = m.userData.gr !== undefined ? m.userData.gr : (m.userData.gr = m.getObjectByName('garrafa') || null);
    if (gr) gr.visible = cargador[a.id] > 0 && !(recargaT > 0 && recargaT / recargaTotal > 0.45);
    const canos = m.userData.canos !== undefined ? m.userData.canos : (m.userData.canos = m.getObjectByName('canos') || null);
    if (canos) { const p = recargaT > 0 ? 1 - recargaT / recargaTotal : 0; canos.rotation.x = -0.62 * Math.min(1, Math.min(p, 1 - p) * 5); } // la recortada se quiebra para recargar
    const bomba = m.getObjectByName('bomba');
    if (bomba) { const p = 1 - Math.max(0, cdArma) / cadenciaDe(a); bomba.position.z = -0.36 + (p > 0.35 && p < 0.75 ? Math.sin((p - 0.35) / 0.4 * Math.PI) * 0.1 : 0); }
    m.userData.flash.visible = flashT > 0; m.userData.flash.material.rotation = Math.random() * 6;
  } else {
    rx = -0.45; rz = 0.35;
    if (a.estocada) { rx = -1.1; rz = 0.25; py += 0.1; px -= 0.04; } // el espeto se lleva apuntando para adelante
    if (swingT > 0 && a.estocada) { const p = 1 - swingT / cadenciaDe(a), s = p < 0.25 ? -p / 0.25 * 0.4 : p < 0.45 ? -0.4 + (p - 0.25) / 0.2 * 1.4 : 1 - (p - 0.45) / 0.55; pz -= s * 0.32; py += s * 0.03; px -= s * 0.06; }
    else if (swingT > 0) {
      const p = 1 - swingT / cadenciaDe(a); // 0..1
      let s;
      if (p < 0.3) { s = p / 0.3; rz = 0.35 - s * 0.95; rx = -0.45 + s * 0.25; px += s * 0.08; py += s * 0.06; }         // carga
      else if (p < 0.5) { s = (p - 0.3) / 0.2; rz = -0.6 + s * 2.1; rx = -0.2 - s * 1.2; px += 0.08 - s * 0.42; py += 0.06 - s * 0.16; } // golpe
      else { s = (p - 0.5) / 0.5; const e = 1 - (1 - s) * (1 - s); rz = 1.5 - e * 1.15; rx = -1.4 + e * 0.95; px += -0.34 * (1 - e); py += -0.1 * (1 - e); }
    }
    const tz = m.userData.tz !== undefined ? m.userData.tz : (m.userData.tz = m.getObjectByName('tanza') || null);
    if (tz) { const p = swingT > 0 ? 1 - swingT / cadenciaDe(a) : 1; tz.scale.y = 1 + Math.sin(Math.min(1, p / 0.6) * Math.PI) * 2.5; } // la tanza de la caña se estira con el latigazo
    pz -= kick * 0.05;
  }
  if (cambioT > 0) { const q = cambioT / 0.3, s = Math.sin(q * Math.PI); py -= s * 0.35; rx -= s * 0.6; rz += (q > 0.5 ? 1 : -1) * s * 0.25; } // baja una, sube la otra con un giro
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
// ---- rendimiento: anillo de tiempos por cuadro (sin crear nada) y carga adaptativa
const NPERF = 1024, perfSim = new Float32Array(NPERF), perfCPU = new Float32Array(NPERF), perfPasos = new Uint8Array(NPERF);
let perfI = 0, perfN = 0, adaptT = 0, adaptSum = 0, adaptCuadros = 0, adaptAlto = 0, adaptBajo = 0, alfaUlt = 0, rafManual = false;
// tope de pasos por cuadro (8 = 66 ms; si no da, cámara lenta). ?maxpasos=N solo para pruebas en máquinas lentas
const MAX_PASOS = Math.max(1, Math.min(30, +(/[?&]maxpasos=(\d+)/.exec(location.search) || [0, 8])[1]));
const PRESUPUESTO_ALTO = 4.0, PRESUPUESTO_BAJO = 1.5; // ms de simulación por cuadro (promedio de 1 s)
function adaptar(msSim, dtCuadro) {
  adaptSum += msSim; adaptCuadros++; adaptT += dtCuadro;
  if (adaptT < 1) return;
  const prom = adaptSum / adaptCuadros; adaptT = 0; adaptSum = 0; adaptCuadros = 0;
  if (prom > PRESUPUESTO_ALTO) { adaptBajo = 0; if (++adaptAlto >= 2 && fis.nivel < 2) { fis.nivel = fis.nivel + 1; adaptAlto = 0; } }
  else if (prom < PRESUPUESTO_BAJO) { adaptAlto = 0; if (++adaptBajo >= 4 && fis.nivel > 0) { fis.nivel = fis.nivel - 1; adaptBajo = 0; } }
  else { adaptAlto = 0; adaptBajo = 0; }
}
// dibuja los zombis vivos (y los que se hunden) en la posición interpolada; después se restaura la de la simulación
function interpolarZombis(alfa, aplicar) {
  for (let i = 0; i < zombis.length; i++) {
    const z = zombis[i]; if (!z.iOk || (z.rag && !aplicar)) continue;
    if (z.rag || (!z.vivo && !z.hundir)) continue;
    const p = z.g.position;
    if (aplicar) {
      z.spx = p.x; z.spy = p.y; z.spz = p.z; z.sry = z.g.rotation.y;
      const dx = p.x - z.ipx, dy = p.y - z.ipy, dz = p.z - z.ipz;
      if (dx * dx + dy * dy + dz * dz > 4) { z.iTmp = false; continue; } // teletransporte: no se interpola
      z.iTmp = true;
      p.set(z.ipx + dx * alfa, z.ipy + dy * alfa, z.ipz + dz * alfa);
      if (z.vivo) { let dr = z.sry - z.iry; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); z.g.rotation.y = z.iry + dr * alfa; }
      z.mOk = false;
    } else if (z.iTmp) { p.set(z.spx, z.spy, z.spz); if (z.vivo) z.g.rotation.y = z.sry; z.iTmp = false; z.mOk = false; }
  }
}
let miraS = -1, vinS = -1, fdS = -1;
function bucle(ahora) {
  requestAnimationFrame(bucle);
  if (!rafManual) cuadro(ahora, false);
}
function cuadro(ahora, sinRender) {
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
  let pasos = 0, alfa = 1;
  if (parada > 0) { parada -= dt; acum = PASO * 0.999; } // hit-stop: el mundo se frena unos milisegundos (se ve el último paso)
  else if (estado === 'jugando' || estado === 'fin' || estado === 'inicio') {
    if (lenta > 0) { lenta -= dt; acum += dt * (lenta > 0.25 ? 0.3 : 0.3 + (0.25 - lenta) / 0.25 * 0.7); } else
    acum += dt;
    while (acum >= PASO && pasos < MAX_PASOS) { simular(PASO); acum -= PASO; pasos++; }
    if (pasos === MAX_PASOS && acum >= PASO) acum = PASO * 0.999; // el aparato no da: cámara lenta en vez de congelarse
  }
  alfa = Math.min(0.999, Math.max(0, acum / PASO)); alfaUlt = alfa;
  const cSim = performance.now() - c0;
  if (estado === 'inicio') { // cámara paseando en el menú
    const t = ahora / 1000;
    aMundo(MAPA.ini + Math.sin(t * 0.05) * 30, 1 + Math.sin(t * 0.08) * 5, J.pos); J.pos.y = piso(1);
    J.yaw = Math.sin(t * 0.11) * 0.9 + 0.2; J.pitch = 0.04 + Math.sin(t * 0.07) * 0.04;
  }
  if (camVictoria && estado === 'fin') { // gira despacio hacia el sol
    const yaw = Math.atan2(-0.13, 1); let d = yaw - J.yaw; d = Math.atan2(Math.sin(d), Math.cos(d));
    J.yaw += d * Math.min(1, dt * 0.8); J.pitch += (0.12 - J.pitch) * Math.min(1, dt * 0.8);
  }
  cuadroN++;
  // timers visuales
  flashT -= dt; hitT -= dt; shake *= Math.exp(-dt * 7); camGolpeP *= Math.exp(-dt * 13); camGolpeR *= Math.exp(-dt * 13); retroceso *= Math.exp(-dt * 9); flashDano = Math.max(0, flashDano - dt);
  if (mensajeT > 0) { mensajeT -= dt; if (mensajeT <= 0) $('mensaje').classList.remove('on'); }
  if (avisoT > 0) { avisoT -= dt; if (avisoT <= 0) $('aviso').style.opacity = 0; }
  if (estado === 'jugando' || estado === 'pausa' || estado === 'fin') {
    for (const f of flotantes) { if (f.t > 0) { f.t -= dt; f.d.style.opacity = Math.min(1, f.t * 2); f.d.style.transform = `translate(-50%, ${-60 - (0.9 - f.t) * 70}px)`; } else if (f.d.style.opacity !== '0') f.d.style.opacity = 0; }
    const hv = hitT > 0 ? 1 : 0; if (hm._v !== hv + hitTipo) { hm._v = hv + hitTipo; hm.style.opacity = hv; hm.className = hitTipo; }
    if (hitT > 0) hm.style.transform = `scale(${1 + Math.max(0, hitT) * (hitTipo === 'mata' ? 3 : 1.5)})`;
    const vv = Math.round(Math.max(vineta, J.vida < 30 && estado === 'jugando' ? 0.35 + Math.sin(tiempo * 5) * 0.15 : 0) * 200);
    if (vv !== vinS) { vinS = vv; vin.style.opacity = vv / 200; }
    const fv = Math.round(Math.min(1, flashDano * 2) * 100); if (fv !== fdS) { fdS = fv; fd.style.opacity = fv / 100; }
    const a = A(armaSel);
    rb.classList.toggle('on', recargaT > 0); if (recargaT > 0) rbi.style.width = ((1 - recargaT / recargaTotal) * 100).toFixed(1) + '%';
    const ms = Math.round((1 + retroceso * 4 + J.mov * 0.3 + (a.tipo === 'fuego' ? a.disp * 8 : 0)) * 200);
    if (ms !== miraS) { miraS = ms; mira.style.transform = `scale(${ms / 200})`; }
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
  // cámara (interpolada entre los dos últimos pasos de física)
  let cx = J.pos.x, cy = J.pos.y, cz = J.pos.z;
  if (J.px !== undefined && (cx - J.px) ** 2 + (cz - J.pz) ** 2 < 4) { cx = J.px + (cx - J.px) * alfa; cy = J.py + (cy - J.py) * alfa; cz = J.pz + (cz - J.pz) * alfa; }
  camera.position.set(cx, cy + 1.65 + Math.sin(J.bob * 2) * 0.03 * J.mov, cz);
  camera.rotation.set(J.pitch + retroceso * 0.5 + camGolpeP + (Math.random() - .5) * shake * 0.05, J.yaw + camGolpeR * 0.4 + (Math.random() - .5) * shake * 0.05, camGolpeR + (Math.random() - .5) * shake * 0.03);
  luzJugador.intensity = flashT > 0 ? 40 : 3.5;
  fis.posarTodos(alfa);
  interpolarZombis(alfa, true);
  horda.dibujar(zombis);
  interpolarZombis(alfa, false);
  gSangre.attributes.position.needsUpdate = true;
  animarArma(dt); efectosArma(dt);
  mundo.update(ahora / 1000, dt, renderer, J.pos);
  const cCPU = performance.now() - c0;
  perfSim[perfI] = cSim; perfCPU[perfI] = cCPU; perfPasos[perfI] = pasos; perfI = (perfI + 1) % NPERF; if (perfN < NPERF) perfN++;
  if (estado === 'jugando') adaptar(cSim, dt);
  fis.sangre.hornear(renderer, camera.position.x, camera.position.z); // también sin render: la cola nunca se llena
  if (sinRender) return;
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
// v8: precalentar shaders en el menú (efectos, jefes, proyectiles y armas están ocultos y si no se compilarían en el primer disparo o la primera explosión: tirón)
function precalentar() {
  const ocultos = [], ver = o => { if (!o.visible) { ocultos.push(o); o.visible = true; } };
  scene.traverse(ver); vmScene.traverse(ver);
  try { const par = renderer.compileAsync && renderer.extensions.has('KHR_parallel_shader_compile'); for (const [sc, cam] of [[scene, camera], [vmScene, vmCam]]) { if (par) renderer.compileAsync(sc, cam).catch(() => { }); else renderer.compile(sc, cam); } }
  catch (e) { /* sin compilación previa: se compila al usarse */ }
  for (const o of ocultos) o.visible = false;
}
setTimeout(() => { if (estado === 'inicio') precalentar(); }, 900);
requestAnimationFrame(() => requestAnimationFrame(() => { $('cargando').classList.add('fuera'); setTimeout(() => $('cargando').classList.add('oculto'), 700); }));
// la primera interacción arranca el audio (los navegadores lo exigen)
addEventListener('pointerdown', function arrancar() { iniciarAudio(); setVolumen(); musica.iniciar(); musica.set(0, false, true); removeEventListener('pointerdown', arrancar); });
// modo sin conexión / "Agregar a inicio"
if ('serviceWorker' in navigator && location.protocol === 'https:') { /* actualización: busca versión nueva al abrir y al volver a la app */
  const hadCtl = !!navigator.serviceWorker.controller; let recargado = false;
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(reg => {
    reg.update().catch(() => { });
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => { }); });
  }).catch(() => { });
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadCtl || recargado) return; /* primera instalación: no hace falta recargar */
    const recargar = () => { if (recargado) return; recargado = true; location.reload(); };
    if (estado === 'inicio' || estado === 'fin') { recargar(); return; }
    const b = document.createElement('button'); b.textContent = 'Nueva versión · tocá para actualizar';
    b.style.cssText = 'position:fixed;top:calc(8px + env(safe-area-inset-top));left:50%;transform:translateX(-50%);z-index:9999;padding:8px 14px;border-radius:10px;background:#a0280c;color:#fff;border:1px solid #ffb020;font-size:15px';
    b.addEventListener('click', e => { e.stopPropagation(); recargar(); }); b.addEventListener('pointerdown', e => e.stopPropagation()); document.body.appendChild(b);
    const vigia = setInterval(() => { if (estado === 'inicio' || estado === 'fin') { clearInterval(vigia); recargar(); } }, 1000); // si no tocó el botón, se actualiza solo al volver al menú (nunca a mitad de una partida)
  });
}

// ganchos para las pruebas automáticas
window.__rz = { get escena() { return scene; },
  get estado() { return estado; }, get oleada() { return oleada; }, set oleada(v) { oleada = v; }, get puntos() { return puntos; }, get bajas() { return bajas; },
  get pesos() { return pesos; }, set pesos(v) { pesos = v; hud(); }, get jefe() { return jefe && { tipo: jefe.tipo, vida: jefe.vida, max: jefe.vidaMax }; },
  get vida() { return J.vida; }, set vida(v) { J.vida = v; }, get dios() { return dios; }, set dios(v) { dios = v; }, get arma() { return armaSel; }, get desbloq() { return [...tiene]; },
  get play() { return { modo: modoPlay, cfg: cfgPlay && { ...cfgPlay, tipos: cfgPlay.tipos.slice(), armas: cfgPlay.armas.slice(), jefesTipos: (cfgPlay.jefesTipos || []).slice() } }; }, get reserva() { return { ...reserva }; },
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
  iaEstado() { return zombis.filter(z => z.vivo).map(z => ({ x: z.g.position.x, z: z.g.position.z, tipo: z.tipo, alerta: z.alerta, esc: z.esc, d: Math.hypot(z.g.position.x - J.pos.x, z.g.position.z - J.pos.z), tr: z.trancado, slot: z.slotOk ? +z.slot.toFixed(2) : null, orb: !!z.orbita, orbT: +(z.orbT || 0).toFixed(1) })); },
  ponerZombiXZ(x, w) { const v = window.__rzZ; v.g.position.set(x, piso(local(x, w, {}).d), w); v.sube = false; v.dirX = undefined; },
  ponerZombiAt(i, d) { const v = window.__rzZ; aMundo(i, d, _o); v.g.position.set(_o.x, piso(d), _o.z); v.sube = false; v.dirX = undefined; },
  localDe(x, z) { return local(x, z, {}); },
  buscarCol(x, z, r) { const c = []; const k = fis.grilla.buscar(x, z, r, c); return c.slice(0, k); },
  inf: { /* pruebas del Modo Infinito */
    get modo() { return modoInf; }, get armas() { return armasInf.slice(); }, set armasCamp(l) { perfil.armasCamp = l.slice(); },
    empezar(armas) { armasInf = armas.slice(); modoInf = true; reiniciar(); estado = 'jugando'; PANTALLAS.forEach(ocultar); capaJuego(true); },
    stats: id => ({ ...A(id), reserva: A(id).reserva === Infinity ? -1 : A(id).reserva, cargMax: A(id).tipo === 'fuego' ? cargMax(A(id)) : 0 }),
    mods: () => JSON.parse(JSON.stringify(modsInf)), opciones: () => opcionesInf.map(o => ({ ...o })),
    abrirMods() { modsHecho = false; abrirMods(); }, elegir(k) { elegirMod(opcionesInf[k]); },
    darMod(arma, mod) { const t = modsInf[arma] || (modsInf[arma] = {}); t[mod] = (t[mod] || 0) + 1; recalcInf(); const a = A(arma); if (a.tipo === 'fuego') cargador[a.id] = cargMax(a); },
    cola: () => colaExpl.length / 4, laser: () => laserRayo.visible, pintar() { pintarInfinito(); },
    calmar() { colaExpl.length = 0; for (const z of zombis) z.quemaT = 0; },
    quemarTodos() { for (const z of zombis) if (z.vivo) { z.quemaT = 60; z.quemaD = 0.01; } },
    quemando: () => zombis.filter(z => z.vivo && z.quemaT > 0).length, get vidaMax() { return J.vidaMax; }
  },
  puerto() { return { evento: eventoPuerto, abierta: mundo.puerto.abierta, puerta: mundo.puerto.puerta, i0: PUERTO_I0, lim: LIM_I1, grito: tiempo < GRITO[2] }; },
  efectos() { return { vainas: ef.vainas, gibs: ef.gibsActivos }; },
  ruido(r) { oir(J.pos.x, J.pos.z, r); },
  medirIA(n = 600) { let t = 0; for (let i = 0; i < n; i++) { const a = performance.now(); simZombis(PASO); t += performance.now() - a; tiempo += PASO; } return { msIA: t / n, vivos: zombis.filter(z => z.vivo).length }; },
  set fuego(v) { disparando = v; }, get armaLista() { return cambioT <= 0 && cdArma <= 0 && recargaT <= 0; }, /* pruebas: el arma terminó de cambiar/recargar */ recargar, ciclarArma, pausar, seguir, jugar, aMenu, cerrarTienda, abrirTienda,
  tab(t) { tab = t; pintarTienda(); },
  saltarA(n) { // salta a la oleada n (para probar jefes); limpia lo que haya
    for (const z of zombis) if (z.vivo) { z.vivo = false; z.muerteT = 4.9; } porSalir = 0; jefe = null; jefePendiente = null; $('jefe').classList.add('oculto'); jfx.limpiar();
    oleada = n - 1; descanso = 0.05; tiendaT = 0; if (estado === 'tienda') { ocultar('tienda'); estado = 'jugando'; }
  },
  jefeYa(tipo) { const z = spawn(tipo, true); if (!z) return null; jefe = z; z.sube = false; initJefe(z); $('jefe').classList.remove('oculto'); $('jefe-nombre').textContent = TIPOS[tipo].nombre; hudJefe(true); presentarJefe(tipo); window.__rzZ = z; return true; },
  jefeEstado() { const z = jefe; if (!z) return null; return { tipo: z.tipo, vida: z.vida, max: z.vidaMax, accion: z.accion, prep: z.prep, fase2: z.fase2, fase3: z.fase3, beatN: z.beatN, gancho: z.ganchoD, enganche: z.enganche, carga: z.cargaT, sinRack: z.sinRack, saludoN: z.saludoN, d: Math.hypot(z.g.position.x - J.pos.x, z.g.position.z - J.pos.z), fx: jfx.activos, proy: ef.proyectiles.filter(p => p.vivo).map(p => p.tipo) }; },
  danoJefe(f) { if (!jefe) return; _d.set(0, 0, 1); herir(jefe, jefe.vidaMax * f, false, _d, 1, false, 'pistola'); },
  spawnLejos(tipo) { const z = spawn(tipo, false); if (!z) return null; const p = z.g.position; return { d: Math.hypot(p.x - J.pos.x, p.z - J.pos.z), libre: libre(p.x, p.z, 0.55), sube: z.sube }; },
  limpiar() { for (const z of zombis) if (z.vivo) { z.vivo = false; z.muerteT = 4.9; } },
  porSalirSet(n) { porSalir = n; }, zRaw(i) { return zombis[i]; }, ponerVivosAnillo(r) { let k = 0; for (const z of zombis) { if (!z.vivo) continue; const a = k++ * 0.8; z.g.position.set(J.pos.x + Math.cos(a) * r, J.pos.y, J.pos.z + Math.sin(a) * r); z.sube = false; } }, get NM() { return NM; }, get quedanOla() { return quedanOla; },
  spawn(tipo, cerca = true) { const z = spawn(tipo, cerca); if (z) { z.sube = false; window.__rzZ = z; } return !!z; },
  rayoPrueba() { ojoJugador(_o, _f, _r, _u); return rayo(_o, _f, 200, []).map(h => ({ t: h.t, cab: h.cab, yo: h.z === window.__rzZ })); },
  obstaculo() { ojoJugador(_o, _f, _r, _u); const c = rayoObstaculos(_o, _f, 200); return { t: c.t, metal: c.c && c.c.metal }; },
  get retroceso() { return retroceso; }, get colisiones() { return colisiones.length; },
  bench(n = 600) { // costo de CPU: simulación (paso fijo) + preparar el cuadro, sin el render de la GPU
    const t0 = performance.now(); for (let i = 0; i < n; i++) simular(PASO); const t1 = performance.now();
    for (let i = 0; i < 100; i++) { fis.posarTodos(); horda.dibujar(zombis); animarArma(1 / 120); mundo.update(i / 120, 1 / 120, renderer, J.pos); } const t2 = performance.now();
    return { msPorPaso: (t1 - t0) / n, msPrepCuadro: (t2 - t1) / 100, zombis: zombis.length };
  },
  bench2() { const r = {}; let t = performance.now();
    for (let i = 0; i < 100; i++) { fis.posarTodos(); horda.dibujar(zombis); } r.horda = (performance.now() - t) / 100; t = performance.now();
    for (let i = 0; i < 100; i++) animarArma(1 / 120); r.arma = (performance.now() - t) / 100; t = performance.now();
    for (let i = 0; i < 100; i++) mundo.update(i / 120, 1 / 120, renderer, J.pos); r.mundo = (performance.now() - t) / 100; return r; },
  dbgZ() { return zombis.filter(z => z.vivo).map(z => { const l = local(z.g.position.x, z.g.position.z, {}); return { tipo: z.tipo, i: l.i, d: +l.d.toFixed(2), y: +z.g.position.y.toFixed(2), prep: z.prep, at: z.ataque, atur: z.aturdido, vm: z.velMult, sube: z.sube, kb: z.kb.length(), cerca: colisiones.filter(c => Math.hypot(c.x - z.g.position.x, c.z - z.g.position.z) < c.r + 1.5).map(c => [c.r, +Math.hypot(c.x - z.g.position.x, c.z - z.g.position.z).toFixed(2)]), jl: local(J.pos.x, J.pos.z, {}) }; }); },
  herirTodos(n = 99999) { _d.set(0, 0, 1); for (const z of zombis.slice()) if (z.vivo) herir(z, n, false, _d, 1, false, 'pistola'); },
  mirarPunto(i, d, h = 40) { aMundo(i, d, _o); const dx = _o.x - J.pos.x, dz = _o.z - J.pos.z; J.yaw = Math.atan2(-dx, -dz); J.pitch = Math.atan2(h, Math.hypot(dx, dz)); },
  mirarA(yaw, pitch) { J.yaw = yaw; J.pitch = pitch; },
  fila(n = 3, dist = 6, sep = 1.1, tipo = 'normal') { window.__rzF = []; _f.set(-Math.sin(J.yaw), 0, -Math.cos(J.yaw)); for (let i = 0; i < n; i++) { const z = spawn(tipo, true); if (!z) continue; z.sube = false; z.g.position.set(J.pos.x + _f.x * (dist + i * sep), J.pos.y, J.pos.z + _f.z * (dist + i * sep)); window.__rzF.push(z); } window.__rzZ = window.__rzF[0]; return window.__rzF.length; },
  filaEstado() { return (window.__rzF || []).map(z => ({ vida: Math.round(z.vida), vivo: z.vivo, at: +z.aturdido.toFixed(2), d: +Math.hypot(z.g.position.x - J.pos.x, z.g.position.z - J.pos.z).toFixed(2), quema: +(z.quemaT || 0).toFixed(2) })); },
  get municion() { return [cargador[armaSel], reserva[armaSel]]; }, get proyActivos() { return ef.proyActivos ? ef.proyActivos() : -1; },
  despejar() { for (const z of zombis) if (z !== window.__rzZ && z.vivo) { z.g.position.x += 60; } },
  irAPickup() { const p = poolPick.find(p => p.t > 0); if (!p) return false; J.pos.x = p.g.position.x; J.pos.z = p.g.position.z; return true; },
  // --- física (pruebas) ---
  fis: () => ({ activos: fis.activos, baratos: fis.baratos, cap: fis.capRag, nivel: fis.nivel, sangre: fis.sangre.activas, frescas: fis.sangre.frescas, horneadas: fis.sangre.horneadas, tramos: fis.sangre.tramos, tramosVis: fis.sangre.tramosVisibles, tramosRecicl: fis.sangre.reciclados,
    marcas: fis.marcas.activas, gibs: ef.gibsActivos, est: { ...fis.est },
    cadaveres: zombis.filter(z => !z.vivo).length, hundiendo: zombis.filter(z => !z.vivo && z.hundir).length, dormidos: zombis.filter(z => !z.vivo && z.dormido && !z.hundir).length, parada, lenta }),
  // --- Actualización 1: rendimiento, frecuencia de cuadros y sangre
  perf(n = 240) { // percentiles de los últimos n cuadros (ms de simulación y de CPU total sin GPU)
    const k = Math.min(n, perfN), S = [], C = [], P = [];
    for (let i = 0; i < k; i++) { const j = (perfI - 1 - i + NPERF) % NPERF; S.push(perfSim[j]); C.push(perfCPU[j]); P.push(perfPasos[j]); }
    const pc = (a, q) => { const b = a.slice().sort((x, y) => x - y); return b.length ? b[Math.min(b.length - 1, Math.floor(q * b.length))] : 0; };
    return { cuadros: k, sim: { p50: pc(S, .5), p95: pc(S, .95), p99: pc(S, .99) }, cpu: { p50: pc(C, .5), p95: pc(C, .95), p99: pc(C, .99) },
      pasos: { min: Math.min(...P), max: Math.max(...P), prom: P.reduce((a, b) => a + b, 0) / (k || 1) }, nivel: fis.nivel };
  },
  set rafManual(v) { rafManual = v; }, cuadro: (t, sinRender = true) => cuadro(t, sinRender), get tiempo() { return tiempo; }, get alfa() { return alfaUlt; },
  get acum() { return acum; }, reloj(t) { ultimo = t; rafPrev = 0; acum = 0; },
  // posición dibujada (interpolada) de un zombi vivo y de la cámara en el último cuadro
  dibujado() { const v = window.__rzZ; return { cam: [camera.position.x, camera.position.z], z: v ? [v.g.position.x, v.g.position.z] : null }; },
  interpZ(alfa) { interpolarZombis(alfa, true); const v = window.__rzZ, r = v ? [v.g.position.x, v.g.position.z] : null; interpolarZombis(alfa, false); return r; },
  _sangre: fis.sangre, _col: new THREE.Color(0x6a0808),
  sangreConteo() { return fis.sangre.conteo(renderer); },
  sangreRGBA(x, z) { return fis.sangre.muestraRGBA(x, z, renderer, _px4); },
  sangreMuestra(x, z) { return fis.sangre.muestra(x, z, renderer, _px4); },
  hornear() { return fis.sangre.hornear(renderer, J.pos.x, J.pos.z); },
  set nivel(n) { fis.nivel = n; }, get nivel() { return fis.nivel; },
  // avanza 'seg' segundos de simulación a paso fijo (sin rAF) y deja posados los cuerpos
  avanzar(seg, hornearCada = 60) { const n = Math.round(seg / PASO); for (let i = 0; i < n; i++) { simular(PASO); if (hornearCada && i % hornearCada === 0) fis.sangre.hornear(renderer, J.pos.x, J.pos.z); } fis.posarTodos(1); fis.sangre.hornear(renderer, J.pos.x, J.pos.z); return tiempo; },
  escopetazo() { tiene.add('escopeta'); if (armaSel !== 'escopeta') elegirArma('escopeta', true); cargador.escopeta = 99; cdArma = 0; disparar(); },
  alturaTorso() { const z = window.__rzZ, P = z && fis.puntos(z); if (!P) return null; let m = 0; for (const i of [0, 1, 2, 3]) { const x = P[i * 3], y = P[i * 3 + 1], w = P[i * 3 + 2], r = fis.RAD[i] * z.esc, d = local(x, w, {}).d; let sop = Math.max(piso(d - r), piso(d), piso(d + r)); for (const c of colisiones) if (Math.hypot(c.x - x, c.z - w) < (c.rb || c.r) + r + 1) { const t = fis.techoEn(c, x, w, r); if (t > sop && t <= y - r + 0.15) sop = t; } m = Math.max(m, y - sop); } return m; }, // piso o techo de obstáculo bajo el torso (cordón, banco, auto)
  hundirViejos(n = 1) { for (let k = 0; k < n; k++) { let v = null; for (const z of zombis) if (!z.vivo && !z.hundir && z.yaRag && (!v || z.muerteT > v.muerteT)) v = z; if (v) empezarHundir(v, true); } },
  soporte() { // ¿algún cadáver dormido quedó en el aire? (sin piso, techo de obstáculo ni otro cuerpo debajo)
    const malos = []; const R = fis.RAD;
    for (const z of zombis) {
      if (z.vivo || z.hundir || !z.yaRag || z.rag || !z.tienePts) continue;
      const P = z.ultPts; let gap = 9;
      for (let i = 0; i < 9; i++) {
        const x = P[i * 3], y = P[i * 3 + 1], w = P[i * 3 + 2], rr = R[i] * z.esc;
        let sop = piso(local(x, w, {}).d);
        for (const c of colisiones) if (Math.hypot(c.x - x, c.z - w) < c.rb + 1) { const t = fis.techoEn(c, x, w, rr); if (t > sop && t <= y + 0.05) sop = t; }
        let g = y - rr - sop;
        for (const o of zombis) { if (o === z || o.vivo || o.hundir || !o.tienePts || o.rag) continue; const Q = o.ultPts; for (let j = 0; j < 9; j++) { const d = Math.hypot(Q[j * 3] - x, Q[j * 3 + 1] - y, Q[j * 3 + 2] - w); if (d < rr + R[j] * o.esc + 0.06) g = Math.min(g, 0); } }
        gap = Math.min(gap, g);
      }
      if (gap > 0.08) malos.push({ tipo: z.tipo, gap: +gap.toFixed(3) });
    }
    return malos;
  },
  cadaveres() {
    return zombis.filter(z => !z.vivo && z.yaRag).map(z => {
      const P = fis.puntos(z), pts = P ? Array.from(P) : null; let minLibre = 9, dentro = false, finito = true, peorI = -1, peorD = 0;
      if (P) for (let i = 0; i < 9; i++) {
        const x = P[i * 3], y = P[i * 3 + 1], w = P[i * 3 + 2]; if (!isFinite(x + y + w)) finito = false;
        const dl = local(x, w, {}).d, ml = y - piso(dl) - fis.RAD[i] * z.esc * 0.6;
        if (ml < minLibre) { minLibre = ml; peorI = i; peorD = dl; }
        if (adentro(x, y, w, fis.RAD[i] * z.esc * 0.5, colisiones)) dentro = true;
      }
      let huesoDentro = false;
      if (P) for (let h = 0; h < 6; h++) for (const t of fis.TS) {
        const a = fis.HUESOS[h * 2] * 3, b = fis.HUESOS[h * 2 + 1] * 3, u = 1 - t;
        const x = P[a] * u + P[b] * t, y = P[a + 1] * u + P[b + 1] * t, w = P[a + 2] * u + P[b + 2] * t;
        if (adentro(x, y, w, 0.04, colisiones)) huesoDentro = true;
        minLibre = Math.min(minLibre, y - piso(local(x, w, {}).d) - 0.04);
      }
      const g = z.g.position;
      return { huesoDentro, barato: !!(z.rag && z.rag.rig), tipo: z.tipo, arma: z.arma, rag: !!z.rag, dormido: !!z.dormido, hundir: !!z.hundir, t: z.muerteT, nan: z.nan, sinCabeza: z.sinCabeza, sinBrazo: [...z.sinBrazo],
        pts, minLibre, peorI, peorD, esc: z.esc, dentro, finito: finito && isFinite(g.x + g.y + g.z), g: [g.x, g.y, g.z] };
    });
  },
  // trae un zombi de 'tipo' a 'dist' adelante y lo mata con 'arma' pegándole en 'parte' (0 cabeza, 1 torso, 2 piernas)
  matarCon(arma, parte = 1, tipo = 'normal', dist = 4) {
    const z = spawn(tipo, true); if (!z) return null; z.sube = false;
    _f.set(-Math.sin(J.yaw), 0, -Math.cos(J.yaw)); z.g.position.set(J.pos.x + _f.x * dist, piso(local(J.pos.x + _f.x * dist, J.pos.z + _f.z * dist, {}).d), J.pos.z + _f.z * dist);
    z.g.rotation.y = Math.atan2(-_f.x, -_f.z); animarZombi(z, 0.016, 1); const p0 = { x: z.g.position.x, z: z.g.position.z };
    const a = A(arma) || { tipo: 'fuego', empuje: 0 };
    if (arma === 'explosion') { z.vida = 1; matar(z, false, _f, false, 'explosion', true, 1); fis.explosion(z.g.position.x - _f.x * 1.5, z.g.position.y + 0.3, z.g.position.z - _f.z * 1.5, 5.5, 7.5); }
    else herir(z, 1e6, parte === 0, _f, a.empuje || 1, a.tipo === 'cuerpo', arma, parte);
    window.__rzZ = z; return { p0, dir: { x: _f.x, z: _f.z } };
  },
  cadaverDe() { const z = window.__rzZ; if (!z) return null; const P = fis.puntos(z); return { vivo: z.vivo, rag: !!z.rag, dormido: !!z.dormido, pts: P ? Array.from(P) : null, g: [z.g.position.x, z.g.position.y, z.g.position.z] }; },
  explosionPrueba(n = 5, dist = 9, junto = null) { // un explosivo con n zombis alrededor; lo revienta y devuelve el centro
    _f.set(-Math.sin(J.yaw), 0, -Math.cos(J.yaw));
    const cx = junto ? junto.x : J.pos.x + _f.x * dist, cz = junto ? junto.z : J.pos.z + _f.z * dist, cy = piso(local(cx, cz, {}).d);
    const ex = spawn('explosivo', true); ex.sube = false; ex.g.position.set(cx, cy, cz); animarZombi(ex, 0.016, 1);
    const anillo = [];
    for (let k = 0; k < n; k++) {
      const z = spawn('normal', true); if (!z) break; z.sube = false; const an = k / n * 6.283, r = 1.5 + (k % 3) * 0.8;
      const x = cx + Math.cos(an) * r, w = cz + Math.sin(an) * r; z.g.position.set(x, piso(local(x, w, {}).d), w); z.g.rotation.y = Math.random() * 6; animarZombi(z, 0.016, 1);
      anillo.push(z);
    }
    window.__rzAnillo = anillo; _d.copy(_f); herir(ex, 1e6, false, _d, 1, false, 'pistola', 1);
    return { cx, cz, n: anillo.length };
  },
  anillo() { return (window.__rzAnillo || []).map(z => { const P = fis.puntos(z); return { vivo: z.vivo, rag: !!z.rag, pts: P ? Array.from(P) : null }; }); },
  llenarSangre() { // llena el pool de sangre hasta el tope de la calidad actual
    const c = CAL[AJ.calidad], col = new THREE.Color(0x6a0808);
    for (let k = 0; k < c.charcos + 4; k++) fis.sangre.charco(J.pos.x + (Math.random() - .5) * 16, J.pos.z + (Math.random() - .5) * 16, 0.5 + Math.random() * 0.5, col, 1);
    for (let k = 0; k < c.gotas + 4; k++) fis.sangre.gota(J.pos.x + (Math.random() - .5) * 16, J.pos.z + (Math.random() - .5) * 16, 0.2 + Math.random() * 0.2, col);
    return fis.sangre.activas;
  },
  marcasPrueba(n = 48) { for (let k = 0; k < n; k++) { _p.set(J.pos.x + (Math.random() - .5) * 8, J.pos.y + 0.02, J.pos.z + (Math.random() - .5) * 8); fis.marcas.marca(_p, 0, 1, 0, k % 3); } return fis.marcas.activas; },
  obstaculosCerca() { return colisiones.filter(c => c.cajas && Math.hypot(c.x - J.pos.x, c.z - J.pos.z) < 60).map(c => ({ x: c.x, z: c.z, metal: !!c.metal, madera: !!c.madera, k: c.cajas[0] })); },
  ponerJugadorXZ(x, z, yaw) { J.pos.x = x; J.pos.z = z; J.pos.y = piso(local(x, z, {}).d); J.yaw = yaw; J.pitch = -0.1; },
  ponerJugador(i, d, yaw = 0) { aMundo(i, d, J.pos); J.pos.y = piso(d); J.yaw = yaw; J.pitch = -0.1; },
  calidad(c) { AJ.calidad = c; aplicarCalidad(); },
  get capCal() { return CAL[AJ.calidad]; },
  dibujables() { // pruebas: qué objetos visibles entran al frustum, agrupados
    const fr = new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)), r = {};
    const ver = (o, tag) => { if (!o.visible) return; const t = o.name || tag; if (o.isMesh || o.isPoints || o.isSprite || o.isLine) { if (o.isInstancedMesh && o.count === 0) return; if (o.frustumCulled && o.geometry && !(o.geometry.boundingSphere || o.geometry.computeBoundingSphere(), fr.intersectsObject(o))) return; const k = (t || '?') + '|' + (o.material.customProgramCacheKey && o.material.customProgramCacheKey() === 'sangreTramo' ? 'TRAMO' : '') + o.type + (o.isInstancedMesh ? 'I' + o.count : '') + '|' + (o.material.type || 'multi') + '|' + o.geometry.type + '|' + (o.parent && o.parent.type) + '|' + (o.parent && o.parent.parent && o.parent.parent.type); r[k] = (r[k] || 0) + (Array.isArray(o.material) ? o.material.length : 1); } for (const c of o.children) ver(c, t); };
    ver(scene, ''); return Object.entries(r).sort((a, b) => b[1] - a[1]); },
  dibujablesDet() { // pruebas: cada objeto visible en el frustum (tipo, vértices, posición, mapa, color)
    const fr = new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)), out = [];
    scene.traverseVisible(o => { if (!(o.isMesh || o.isPoints || o.isSprite || o.isLine)) return; if (o.isInstancedMesh && o.count === 0) return; if (o.frustumCulled && o.geometry && !(o.geometry.boundingSphere || o.geometry.computeBoundingSphere(), fr.intersectsObject(o))) return;
      const m = o.material, p = new THREE.Vector3(); o.getWorldPosition(p); out.push([o.type + (o.isInstancedMesh ? o.count : ''), m.type, o.geometry.attributes.position.count, [Math.round(p.x), Math.round(p.y), Math.round(p.z)], m.color ? m.color.getHexString() : '', m.size || 0, m.blending, !!m.map, o.name || (o.parent && o.parent.name) || '']); });
    return out; },
  info: () => ({ calls: medidas.ultCalls, tris: medidas.ultTris, geos: renderer.info.memory.geometries, texs: renderer.info.memory.textures, progs: renderer.info.programs.length })
};
