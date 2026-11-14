// Armas v8 "Rambla: Zona Cero": modelos low-poly en primera persona con texturas de canvas.
// Todas comparten UN material (MeshStandard) con un atlas de 1024² (16 celdas: acero pavonado, acero claro, maderas, polímero,
// pintura naranja, piel, manga, cinta aisladora, cuero, goma, chorizo, bizcocho, latón, grabado, plástico rojo) y un
// segundo atlas de datos (R = relieve, G = rugosidad, B = metalicidad). Así cada arma se hornea en UNA malla
// (+1 por cada pieza animable con name): 1-3 draw calls por arma, contra 5-7 de las viejas.
// Convención (ARMAS-LISTA.md): metros reales, origen en la empuñadura, armas de fuego hacia -Z con userData.punta;
// cuerpo a cuerpo hacia +Y con el mango en el origen. Sin logos ni marcas reales.
import * as THREE from 'https://esm.sh/three@0.160.0';

export const ARMAS_V8 = [
  { id: 'fal', nombre: 'Fusil FAL', tipo: 'fuego' }, { id: 'recortada', nombre: 'Recortada de dos caños', tipo: 'fuego' },
  { id: 'lanzagarrafas', nombre: 'Lanzagarrafas', tipo: 'fuego' }, { id: 'bengalera', nombre: 'Pistola de bengalas', tipo: 'fuego' },
  { id: 'gomera', nombre: 'Gomera de bizcochos', tipo: 'fuego' }, { id: 'cana', nombre: 'Caña de pescar', tipo: 'cuerpo' },
  { id: 'espeto', nombre: 'Espeto parrillero', tipo: 'cuerpo' }, { id: 'termo', nombre: 'Termo (v8)', tipo: 'cuerpo' },
  { id: 'escopeta', nombre: 'Escopeta (v8)', tipo: 'fuego' }, { id: 'bate', nombre: 'Bate (v8)', tipo: 'cuerpo' }
];

// ---------------------------------------------------------------- atlas ----------------------------------------------------------------
const CEL = 256, N = 4, NF = 5; // 4 columnas × 5 filas de 256 px (1024×1280)
export const REG = { metal: 0, acero: 1, madera: 2, maderaCl: 3, poli: 4, naranja: 5, piel: 6, manga: 7, cinta: 8, cuero: 9, goma: 10, chorizo: 11, bizcocho: 12, laton: 13, grabado: 14, rojo: 15, verde: 16, celeste: 17, hueso: 18, cromo: 19 };
let sem = 9;
const rnd = () => { sem |= 0; sem = (sem + 0x6D2B79F5) | 0; let t = Math.imul(sem ^ (sem >>> 15), 1 | sem); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const rgba = (r, g, b, a = 1) => `rgba(${r | 0},${g | 0},${b | 0},${a})`;
// cada pintor recibe el contexto de color (c) y el de datos (d) ya trasladados a la celda; d: R relieve, G rugosidad, B metal
function base(c, d, col, h, rough, metal) { c.fillStyle = col; c.fillRect(0, 0, CEL, CEL); d.fillStyle = rgba(h, rough * 255, metal * 255); d.fillRect(0, 0, CEL, CEL); }
function puntos(c, n, v0, v1, a, w = 1, h = 1) { for (let i = 0; i < n; i++) { const v = v0 + rnd() * (v1 - v0); c.fillStyle = rgba(v, v, v, a * (0.4 + rnd() * 0.6)); c.fillRect(rnd() * CEL, rnd() * CEL, w, h); } }
function cepillado(c, d, n, a) { for (let i = 0; i < n; i++) { const y = rnd() * CEL, v = 100 + rnd() * 155; c.fillStyle = rgba(v, v, v, a); c.fillRect(0, y, CEL, 1); d.fillStyle = rgba(118 + rnd() * 20, 0, 0, 0.15); d.fillRect(0, y, CEL, 1); } }
function rayones(c, d, n, col, rough) { for (let i = 0; i < n; i++) { const x = rnd() * CEL, y = rnd() * CEL, dx = (rnd() - 0.5) * 50, dy = (rnd() - 0.5) * 14; c.strokeStyle = col; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x, y); c.lineTo(x + dx, y + dy); c.stroke(); d.strokeStyle = rgba(90, rough * 255, 89); d.lineWidth = 0.8; d.beginPath(); d.moveTo(x, y); d.lineTo(x + dx, y + dy); d.stroke(); } }
function veta(c, d, oscuro, claro) {
  for (let x = 0; x < CEL; x++) { const k = 0.5 + 0.5 * Math.sin(x * 0.22 + Math.sin(x * 0.045) * 5); c.fillStyle = k > 0.5 ? claro : oscuro; c.globalAlpha = 0.25 + k * 0.25; c.fillRect(x, 0, 1, CEL); d.fillStyle = rgba(110 + k * 40, 150, 0); d.fillRect(x, 0, 1, CEL); }
  c.globalAlpha = 1;
  for (let i = 0; i < 300; i++) { c.fillStyle = rgba(40, 20, 10, 0.18); c.fillRect(rnd() * CEL, rnd() * CEL, 1, 10 + rnd() * 50); }
  for (let k = 0; k < 3; k++) { const x = rnd() * CEL, y = rnd() * CEL; for (let r = 14; r > 1; r -= 2.5) { c.strokeStyle = rgba(40, 20, 8, 0.35); c.beginPath(); c.ellipse(x, y, r * 0.6, r * 1.8, 0, 0, 6.3); c.stroke(); } }
  for (let i = 0; i < 14; i++) { const x = rnd() * CEL, y = rnd() * CEL, r = 8 + rnd() * 20, g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(255,230,190,0.18)'); g.addColorStop(1, 'rgba(255,230,190,0)'); c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r); } // gastado por las manos
}
const PINTA = [
  /* metal */ (c, d) => { base(c, d, '#3e434c', 128, 0.42, 0.35); cepillado(c, d, 700, 0.06); puntos(c, 3000, 40, 140, 0.25); rayones(c, d, 50, 'rgba(200,205,215,0.35)', 0.25); c.strokeStyle = 'rgba(190,195,205,0.45)'; c.lineWidth = 3; c.strokeRect(2, 2, CEL - 4, CEL - 4); },
  /* acero */ (c, d) => { base(c, d, '#a9aeb6', 128, 0.26, 0.35); cepillado(c, d, 1000, 0.08); puntos(c, 2000, 120, 255, 0.2); rayones(c, d, 60, 'rgba(255,255,255,0.4)', 0.18); for (let i = 0; i < 8; i++) { const x = rnd() * CEL, y = rnd() * CEL, r = 6 + rnd() * 16, g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(120,70,30,0.35)'); g.addColorStop(1, 'rgba(120,70,30,0)'); c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r); d.fillStyle = 'rgba(150,200,40,0.4)'; d.fillRect(x - r / 2, y - r / 2, r, r); } }, // óxido en manchitas
  /* madera */ (c, d) => { base(c, d, '#6e3c1e', 128, 0.6, 0); veta(c, d, '#3a1c0c', '#a0643a'); },
  /* maderaCl */ (c, d) => { base(c, d, '#c8925a', 128, 0.62, 0); veta(c, d, '#8a5a30', '#f0c890'); },
  /* poli */ (c, d) => { base(c, d, '#2e3136', 128, 0.72, 0.05); for (let i = 0; i < 5000; i++) { const up = rnd() < 0.5; c.fillStyle = up ? 'rgba(80,84,92,0.6)' : 'rgba(20,22,26,0.6)'; d.fillStyle = up ? 'rgba(170,180,0,1)' : 'rgba(90,190,0,1)'; const x = rnd() * CEL, y = rnd() * CEL, r = 0.7 + rnd(); c.beginPath(); c.arc(x, y, r, 0, 6.3); c.fill(); d.beginPath(); d.arc(x, y, r, 0, 6.3); d.fill(); } },
  /* naranja */ (c, d) => { base(c, d, '#e8641a', 140, 0.42, 0.05); puntos(c, 1500, 160, 255, 0.12, 2, 2); for (let i = 0; i < 30; i++) { const x = rnd() * CEL, y = rnd() * CEL; c.fillStyle = '#8a8e94'; d.fillStyle = rgba(100, 90, 89); c.beginPath(); d.beginPath(); for (let k = 0; k < 7; k++) { const a = k / 7 * 6.28, r = 2 + rnd() * 6; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); d.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.fill(); d.fill(); } },
  /* piel */ (c, d) => { base(c, d, '#d6a586', 128, 0.7, 0); puntos(c, 2500, 150, 230, 0.12); for (let i = 0; i < 40; i++) { c.strokeStyle = 'rgba(140,90,70,0.25)'; c.lineWidth = 1; const x = rnd() * CEL, y = rnd() * CEL; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 6 + rnd() * 6, y + (rnd() - 0.5) * 2); c.stroke(); } for (let i = 0; i < 10; i++) { const x = rnd() * CEL, y = rnd() * CEL, r = 10 + rnd() * 18, g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(200,110,90,0.18)'); g.addColorStop(1, 'rgba(200,110,90,0)'); c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r); } },
  /* manga */ (c, d) => { base(c, d, '#34445e', 128, 0.92, 0); for (let y = 0; y < CEL; y += 2) { c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(0, y, CEL, 1); d.fillStyle = 'rgba(110,240,0,1)'; d.fillRect(0, y, CEL, 1); } for (let x = 0; x < CEL; x += 3) { c.fillStyle = 'rgba(255,255,255,0.04)'; c.fillRect(x, 0, 1, CEL); } puntos(c, 1500, 0, 255, 0.05); },
  /* cinta */ (c, d) => { base(c, d, '#141517', 128, 0.3, 0); for (let i = 0; i < 14; i++) { const y = i * 19 + rnd() * 4; c.fillStyle = 'rgba(255,255,255,0.07)'; c.fillRect(0, y, CEL, 2); c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(0, y + 2, CEL, 1); d.fillStyle = 'rgba(160,70,0,1)'; d.fillRect(0, y, CEL, 2); } puntos(c, 800, 60, 120, 0.2); },
  /* cuero */ (c, d) => { base(c, d, '#6a3f22', 128, 0.66, 0); for (let i = 0; i < 4000; i++) { c.fillStyle = rnd() < 0.5 ? 'rgba(30,15,5,0.25)' : 'rgba(160,110,70,0.15)'; c.fillRect(rnd() * CEL, rnd() * CEL, 1.5, 1.5); } c.setLineDash([4, 3]); c.strokeStyle = 'rgba(220,200,160,0.7)'; c.lineWidth = 1.5; for (const y of [12, CEL - 12]) { c.beginPath(); c.moveTo(0, y); c.lineTo(CEL, y); c.stroke(); } c.setLineDash([]); },
  /* goma */ (c, d) => { base(c, d, '#c89a58', 128, 0.4, 0); for (let x = 0; x < CEL; x += 4) { c.fillStyle = 'rgba(255,240,200,0.08)'; c.fillRect(x, 0, 2, CEL); } puntos(c, 600, 80, 140, 0.15); },
  /* chorizo */ (c, d) => { base(c, d, '#8c3220', 140, 0.32, 0); for (let i = 0; i < 260; i++) { c.fillStyle = rnd() < 0.7 ? 'rgba(235,190,170,0.75)' : 'rgba(60,10,5,0.6)'; const x = rnd() * CEL, y = rnd() * CEL; c.beginPath(); c.ellipse(x, y, 1.5 + rnd() * 2, 1 + rnd() * 1.5, rnd() * 3, 0, 6.3); c.fill(); } for (let k = 0; k < 6; k++) { c.fillStyle = 'rgba(25,8,4,0.7)'; c.save(); c.translate(k * 44 + 10, 0); c.rotate(0.5); c.fillRect(0, -20, 8, CEL * 1.3); c.restore(); } for (let i = 0; i < 40; i++) { c.fillStyle = 'rgba(255,220,200,0.18)'; c.fillRect(rnd() * CEL, rnd() * CEL, 6, 2); } }, // con marcas de la parrilla
  /* bizcocho */ (c, d) => { const g = c.createLinearGradient(0, 0, 0, CEL); g.addColorStop(0, '#f2c070'); g.addColorStop(0.5, '#d88a30'); g.addColorStop(1, '#a85a18'); c.fillStyle = g; c.fillRect(0, 0, CEL, CEL); d.fillStyle = rgba(128, 120, 0); d.fillRect(0, 0, CEL, CEL); for (let y = 0; y < CEL; y += 9) { c.strokeStyle = 'rgba(110,50,10,0.45)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, y); for (let x = 0; x <= CEL; x += 16) c.lineTo(x, y + Math.sin(x * 0.1 + y) * 3); c.stroke(); } for (let i = 0; i < 300; i++) { c.fillStyle = 'rgba(255,250,220,0.35)'; c.fillRect(rnd() * CEL, rnd() * CEL, 2, 1); d.fillStyle = 'rgba(140,40,0,1)'; d.fillRect(rnd() * CEL, rnd() * CEL, 3, 2); } }, // almíbar que brilla
  /* laton */ (c, d) => { base(c, d, '#c9a040', 128, 0.28, 0.35); cepillado(c, d, 400, 0.08); puntos(c, 800, 90, 200, 0.2); },
  /* grabado */ (c, d) => { PINTA[0](c, d); c.font = 'bold 22px monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; for (const [t, y] of [['ZONA CERO · MVD', 90], ['CAL. 7,62 · Nº 1830', 130], ['HECHO EN URUGUAY', 170]]) { c.fillStyle = 'rgba(15,15,18,0.9)'; c.fillText(t, CEL / 2, y); c.fillStyle = 'rgba(220,220,230,0.35)'; c.fillText(t, CEL / 2, y + 1.5); d.fillStyle = rgba(70, 120, 89); d.font = c.font; d.textAlign = 'center'; d.textBaseline = 'middle'; d.fillText(t, CEL / 2, y); } },
  /* rojo */ (c, d) => { base(c, d, '#c41a16', 128, 0.48, 0); puntos(c, 1000, 120, 255, 0.08); c.fillStyle = '#f2f0e8'; c.fillRect(0, 96, CEL, 64); c.font = 'bold 30px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#c41a16'; c.fillText('BENGALA', CEL / 2, 118); c.font = 'bold 16px sans-serif'; c.fillStyle = '#222'; c.fillText('SEÑAL · ROJA', CEL / 2, 144); },
  /* verde */ (c, d) => { base(c, d, '#2f7a40', 140, 0.4, 0.2); puntos(c, 1500, 170, 230, 0.12, 2, 2); for (let i = 0; i < 26; i++) { const x = rnd() * CEL, y = rnd() * CEL; c.fillStyle = '#c8ccd2'; d.fillStyle = rgba(100, 70, 89); c.beginPath(); d.beginPath(); for (let k = 0; k < 7; k++) { const a = k / 7 * 6.28, r = 2 + rnd() * 6; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); d.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.fill(); d.fill(); } c.save(); c.translate(CEL / 2, CEL / 2); c.rotate(-Math.PI / 2); c.font = 'bold 34px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = 'rgba(240,240,230,0.9)'; c.fillText('TERMO · 1 L', 0, 0); c.restore(); }, // pintura verde saltada y calco (sin marca)
  /* celeste */ (c, d) => { base(c, d, '#5fb2e6', 140, 0.45, 0.05); puntos(c, 1200, 160, 255, 0.1, 2, 2); for (let i = 0; i < 6; i++) { c.fillStyle = 'rgba(255,255,255,0.9)'; c.fillRect(0, i * 46 + 10, CEL, 18); } }, // franjas celeste y blanco
  /* hueso */ (c, d) => { base(c, d, '#e4dcc4', 128, 0.6, 0); puntos(c, 2000, 140, 230, 0.15); },
  /* cromo */ (c, d) => { const g = c.createLinearGradient(0, 0, 0, CEL); for (let k = 0; k <= 6; k++) g.addColorStop(k / 6, k % 2 ? '#f4f6fa' : '#6a707a'); c.fillStyle = g; c.fillRect(0, 0, CEL, CEL); d.fillStyle = rgba(128, 0.12 * 255, 89); d.fillRect(0, 0, CEL, CEL); cepillado(c, d, 300, 0.05); }
];
let MAT = null, TEX = null;
export function texturasArmas() {
  if (TEX) return TEX;
  const col = document.createElement('canvas'), dat = document.createElement('canvas'); col.width = dat.width = CEL * N; col.height = dat.height = CEL * NF;
  const c = col.getContext('2d'), d = dat.getContext('2d');
  PINTA.forEach((p, i) => { sem = 77 + i * 131; const x = (i % N) * CEL, y = Math.floor(i / N) * CEL; for (const k of [c, d]) { k.save(); k.translate(x, y); k.beginPath(); k.rect(0, 0, CEL, CEL); k.clip(); } p(c, d); c.restore(); d.restore(); });
  const tc = new THREE.CanvasTexture(col); tc.colorSpace = THREE.SRGBColorSpace; tc.anisotropy = 8;
  const td = new THREE.CanvasTexture(dat); td.anisotropy = 8;
  TEX = { color: tc, datos: td, lienzo: col };
  return TEX;
}
export function materialArmas() {
  if (MAT) return MAT;
  const t = texturasArmas();
  MAT = new THREE.MeshStandardMaterial({ map: t.color, roughnessMap: t.datos, metalnessMap: t.datos, bumpMap: t.datos, bumpScale: 1.2, roughness: 1, metalness: 1 });
  return MAT;
}

// ---------------------------------------------------------------- piezas ---------------------------------------------------------------
const K = 2.4; // celdas por metro: una celda cubre ~42 cm
// lleva el uv (0..1 de la pieza) a un pedazo de la celda del material; su/sv = tamaño real (m) de la cara en u y v
function enCelda(u, v, reg, su, sv, ou, ov) {
  const fu = Math.min(1, su * K), fv = Math.min(1, sv * K), cu = reg % N, cv = Math.floor(reg / N);
  const x = ou * (1 - fu) + u * fu, y = ov * (1 - fv) + v * fv;
  return [(cu + 0.03 + 0.94 * x) / N, 1 - (cv + 0.03 + 0.94 * (1 - y)) / NF];
}
function uvCaja(geo, reg, w, h, d, completo) {
  const uv = geo.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]], ou = rnd(), ov = rnd();
  for (let q = 0; q < uv.count; q++) { const f = q >> 2, [a, b] = completo ? [9, 9] : dims[f]; const [x, y] = enCelda(uv.getX(q), uv.getY(q), reg, a, b, ou, ov); uv.setXY(q, x, y); }
}
function uvLargo(geo, reg, su, sv, completo) { const uv = geo.attributes.uv, ou = rnd(), ov = rnd(); for (let i = 0; i < uv.count; i++) { const [x, y] = enCelda(uv.getX(i), uv.getY(i), reg, completo ? 9 : su, completo ? 9 : sv, ou, ov); uv.setXY(i, x, y); } }
function uvCaja2(geo, reg) { // uv de extrusiones (vienen en metros): se normalizan y se escalan a tamaño real
  const uv = geo.attributes.uv; let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
  for (let i = 0; i < uv.count; i++) { u0 = Math.min(u0, uv.getX(i)); u1 = Math.max(u1, uv.getX(i)); v0 = Math.min(v0, uv.getY(i)); v1 = Math.max(v1, uv.getY(i)); }
  const su = u1 - u0 || 1, sv = v1 - v0 || 1, ou = rnd(), ov = rnd();
  for (let i = 0; i < uv.count; i++) { const [x, y] = enCelda((uv.getX(i) - u0) / su, (uv.getY(i) - v0) / sv, reg, su, sv, ou, ov); uv.setXY(i, x, y); }
}
const malla = (geo, x, y, z, rx = 0, ry = 0, rz = 0) => { const m = new THREE.Mesh(geo, materialArmas()); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); return m; };
function caja(reg, w, h, d, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, completo = false) { const g = new THREE.BoxGeometry(w, h, d); uvCaja(g, reg, w, h, d, completo); return malla(g, x, y, z, rx, ry, rz); }
// cilindro a lo largo de Z (eje = -Z adelante) salvo que se pida otro giro
function cil(reg, rt, rb, h, x = 0, y = 0, z = 0, rx = Math.PI / 2, ry = 0, rz = 0, seg = 14, abierto = false) { const g = new THREE.CylinderGeometry(rt, rb, h, seg, 1, abierto); uvLargo(g, reg, Math.PI * 2 * Math.max(rt, rb), h); return malla(g, x, y, z, rx, ry, rz); }
function esfera(reg, r, x, y, z, sx = 1, sy = 1, sz = 1, seg = 12) { const g = new THREE.SphereGeometry(r, seg, Math.max(6, seg * 0.6 | 0)); uvLargo(g, reg, Math.PI * 2 * r, Math.PI * r); g.scale(sx, sy, sz); return malla(g, x, y, z); }
function aro(reg, r, t, x, y, z, rx = 0, ry = 0, rz = 0, arco = Math.PI * 2, seg = 14) { const g = new THREE.TorusGeometry(r, t, 6, seg, arco); uvLargo(g, reg, Math.PI * 2 * r, 0.05); return malla(g, x, y, z, rx, ry, rz); }
// perfil lateral (z, y) extruido a lo ancho (x), centrado; agujeros opcionales
function perfil(reg, pts, ancho, bisel = 0.002, agujeros = []) {
  const sh = new THREE.Shape(pts.map(p => new THREE.Vector2(-p[0], p[1]))); for (const a of agujeros) sh.holes.push(new THREE.Path(a.map(p => new THREE.Vector2(-p[0], p[1]))));
  const g = new THREE.ExtrudeGeometry(sh, { depth: ancho - bisel * 2, bevelEnabled: bisel > 0, bevelThickness: bisel, bevelSize: bisel, bevelSegments: 1, curveSegments: 4 });
  g.translate(0, 0, -ancho / 2 + bisel); g.rotateY(Math.PI / 2); uvCaja2(g, reg); return malla(g, 0, 0, 0);
}
// sección (x, y) extruida a lo largo de -Z desde z0
function seccion(reg, pts, largo, z0, bisel = 0.002) {
  const sh = new THREE.Shape(pts.map(p => new THREE.Vector2(p[0], p[1])));
  const g = new THREE.ExtrudeGeometry(sh, { depth: largo - bisel * 2, bevelEnabled: bisel > 0, bevelThickness: bisel, bevelSize: bisel, bevelSegments: 1, curveSegments: 4 });
  g.translate(0, 0, z0 - largo + bisel); uvCaja2(g, reg); return malla(g, 0, 0, 0);
}
// mano derecha + manga (igual de construida que la de armas.js, pero en el atlas: no suma draw calls)
function mano(g, x = 0, y = -0.06, z = 0.05, giro = 0, mangaGiro = 0) { // mangaGiro: gira solo la manga en la muñeca (armas que el juego lleva apuntando, ej. el espeto)
  const h = new THREE.Group(); h.position.set(x, y, z); h.rotation.x = giro;
  h.add(seccion(REG.piel, [[-0.036, -0.045], [0.036, -0.045], [0.04, 0.03], [0.03, 0.046], [-0.03, 0.046], [-0.04, 0.03]], 0.072, 0.042, 0.006));
  for (let k = 0; k < 4; k++) { h.add(cil(REG.piel, 0.0115, 0.0115, 0.074 - k * 0.006, 0, 0.03 - k * 0.022, -0.038 + k * 0.003, 0, 0, Math.PI / 2, 8)); h.add(esfera(REG.piel, 0.0118, -0.037 + k * 0.003, 0.03 - k * 0.022, -0.036 + k * 0.003, 1, 1, 1, 6)); } // dedos y nudillos
  { const p = cil(REG.piel, 0.012, 0.0105, 0.06, -0.034, 0.042, -0.03, Math.PI / 2, 0, 0.12, 8); h.add(p); }
  h.add(cil(REG.piel, 0.047, 0.047, 0.03, 0, -0.006, 0.045, Math.PI / 2, 0, 0, 12));
  const mg = new THREE.Group(); mg.position.set(0, -0.006, 0.045); mg.rotation.x = mangaGiro; h.add(mg);
  mg.add(cil(REG.manga, 0.05, 0.056, 0.24, 0, -0.004, 0.125, Math.PI / 2, 0, 0, 12), cil(REG.manga, 0.058, 0.058, 0.02, 0, -0.004, 0.01, Math.PI / 2, 0, 0, 12)); // manga y puño
  g.add(h); return h;
}
// junta todas las mallas sin name (de cualquier profundidad, salvo dentro de piezas con name) en una sola; las piezas con name se hornean por dentro
function hornear(raiz) {
  const fijas = [];
  const juntar = (o, m) => { for (const h of [...o.children]) { if (h.name) continue; const mm = new THREE.Matrix4().multiplyMatrices(m, (h.updateMatrix(), h.matrix)); if (h.isMesh) fijas.push([h, mm]); juntar(h, mm); } };
  juntar(raiz, new THREE.Matrix4());
  if (fijas.length) {
    const geos = fijas.map(([h, mm]) => (h.geometry.index ? h.geometry.toNonIndexed() : h.geometry.clone()).applyMatrix4(mm));
    let n = 0; geos.forEach(x => n += x.attributes.position.count);
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2); let k = 0;
    for (const x of geos) { pos.set(x.attributes.position.array, k * 3); nor.set(x.attributes.normal.array, k * 3); uv.set(x.attributes.uv.array, k * 2); k += x.attributes.position.count; x.dispose(); }
    const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); bg.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); bg.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    bg.computeBoundingSphere();
    // saco todo lo horneado (mallas y grupos vacíos sin name)
    const limpiar = o => { for (const h of [...o.children]) { if (h.name) continue; limpiar(h); if (h.isMesh) h.geometry.dispose(); o.remove(h); } };
    limpiar(raiz);
    const m = new THREE.Mesh(bg, materialArmas()); m.name = ''; raiz.add(m);
  }
  for (const h of raiz.children) if (h.name && !h.isMesh && h.children.length) hornearPieza(h);
}
function hornearPieza(p) { const g = new THREE.Group(); for (const h of [...p.children]) { p.remove(h); g.add(h); } hornear(g); const m = g.children[0]; if (m) { p.add(m); } }
function pieza(nombre, x = 0, y = 0, z = 0) { const g = new THREE.Group(); g.name = nombre; g.position.set(x, y, z); return g; }

// ---------------------------------------------------------------- modelos ---------------------------------------------------------------
function construir(id, conMano) {
  const g = new THREE.Group(), punta = new THREE.Vector3(0, 0.03, -0.3), R = REG;
  sem = 1000 + id.length * 97 + id.charCodeAt(0);
  switch (id) {
    case 'fal': { // fusil de batalla genérico: cajón, tapa, guardamanos ranurado, asa, apagallamas, culata de madera
      g.add(caja(R.metal, 0.058, 0.052, 0.3, 0, 0.034, -0.04), caja(R.metal, 0.052, 0.05, 0.27, 0, -0.012, -0.03));
      g.add(caja(R.metal, 0.042, 0.014, 0.29, 0, 0.066, -0.045)); // tapa del cajón
      g.add(caja(R.grabado, 0.0012, 0.032, 0.15, 0.0296, 0.034, -0.02, 0, 0, 0, true), caja(R.grabado, 0.0012, 0.032, 0.15, -0.0296, 0.034, -0.02, 0, Math.PI, 0, true));
      g.add(caja(R.cinta, 0.004, 0.02, 0.06, 0.03, 0.044, -0.06)); // ventana de expulsión
      g.add(caja(R.acero, 0.03, 0.012, 0.012, -0.044, 0.046, -0.15), esfera(R.acero, 0.009, -0.06, 0.046, -0.15)); // manija de carga
      g.add(caja(R.poli, 0.012, 0.045, 0.012, 0, 0.09, -0.15), caja(R.poli, 0.012, 0.045, 0.012, 0, 0.09, -0.02), caja(R.poli, 0.014, 0.014, 0.16, 0, 0.116, -0.085)); // asa de transporte
      g.add(caja(R.metal, 0.024, 0.02, 0.03, 0, 0.078, 0.09), caja(R.metal, 0.006, 0.014, 0.008, 0, 0.095, 0.098)); // alza
      // guardamanos de polímero con ranuras de ventilación a los dos lados
      g.add(seccion(R.poli, [[-0.036, -0.03], [0.036, -0.03], [0.04, 0.0], [0.034, 0.05], [-0.034, 0.05], [-0.04, 0.0]], 0.25, -0.19, 0.004));
      for (let k = 0; k < 6; k++) for (const s of [-1, 1]) g.add(caja(R.cinta, 0.004, 0.032, 0.013, s * 0.039, 0.014, -0.23 - k * 0.032));
      g.add(cil(R.metal, 0.013, 0.013, 0.1, 0, 0.072, -0.47), caja(R.metal, 0.03, 0.05, 0.03, 0, 0.055, -0.53)); // tubo y block de gases
      g.add(cil(R.metal, 0.0115, 0.0115, 0.3, 0, 0.03, -0.585)); // caño
      g.add(cil(R.metal, 0.016, 0.016, 0.065, 0, 0.03, -0.765)); for (let k = 0; k < 4; k++) g.add(caja(R.cinta, 0.004, 0.034, 0.04, 0, 0.03, -0.77, 0, 0, k * Math.PI / 4)); // apagallamas con ranuras
      g.add(caja(R.metal, 0.004, 0.032, 0.012, 0.012, 0.072, -0.64), caja(R.metal, 0.004, 0.032, 0.012, -0.012, 0.072, -0.64), caja(R.acero, 0.003, 0.022, 0.006, 0, 0.068, -0.64)); // orejas y guión
      g.add(cil(R.acero, 0.006, 0.006, 0.05, 0.034, 0.06, -0.42, 0, 0, Math.PI / 2, 6)); // anilla de la correa
      // empuñadura de polímero y guardamonte
      { const e = perfil(R.poli, [[0.04, -0.035], [0.085, -0.035], [0.11, -0.14], [0.1, -0.155], [0.06, -0.155], [0.035, -0.06]], 0.036, 0.004); g.add(e); }
      g.add(aro(R.metal, 0.028, 0.004, 0, -0.045, 0.0, 0, Math.PI / 2, Math.PI, Math.PI), caja(R.acero, 0.006, 0.024, 0.008, 0, -0.045, -0.002, 0.2));
      // culata de madera con cantonera
      g.add(perfil(R.madera, [[0.11, 0.054], [0.25, 0.046], [0.42, 0.04], [0.43, -0.105], [0.41, -0.125], [0.27, -0.06], [0.12, -0.03]], 0.044, 0.004));
      g.add(caja(R.poli, 0.048, 0.17, 0.016, 0, -0.04, 0.432, 0.08));
      { const c = pieza('cargador', 0, -0.11, -0.12); c.add(caja(R.metal, 0.03, 0.17, 0.085, 0, 0, 0, 0.14)); for (let k = 0; k < 3; k++) c.add(caja(R.metal, 0.034, 0.006, 0.07, 0, -0.03 - k * 0.035, 0.004 * k, 0.14)); c.add(caja(R.metal, 0.036, 0.012, 0.092, 0, -0.086, 0.012, 0.14)); g.add(c); }
      if (conMano) mano(g, 0, -0.088, 0.075, 0.1);
      punta.set(0, 0.03, -0.8); break;
    }
    case 'recortada': { // doble caño recortado: los caños basculan (pieza 'canos'), cartuchos de repuesto en la culata ('cargador')
      const canos = pieza('canos', 0, 0.0, -0.005);
      for (const s of [-1, 1]) { canos.add(cil(R.acero, 0.0175, 0.0175, 0.4, s * 0.0176, 0.03, -0.2)); canos.add(cil(R.cinta, 0.0125, 0.0125, 0.004, s * 0.0176, 0.03, -0.401)); canos.add(cil(R.metal, 0.019, 0.019, 0.012, s * 0.0176, 0.03, -0.395)); }
      canos.add(caja(R.metal, 0.012, 0.008, 0.4, 0, 0.05, -0.2), caja(R.metal, 0.022, 0.012, 0.4, 0, 0.009, -0.2), esfera(R.laton, 0.004, 0, 0.056, -0.385));
      canos.add(seccion(R.madera, [[-0.026, -0.03], [0.026, -0.03], [0.03, -0.012], [0.026, 0.012], [-0.026, 0.012], [-0.03, -0.012]], 0.17, -0.04, 0.004)); // guardamanos (astillado en la punta)
      g.add(canos);
      g.add(caja(R.grabado, 0.052, 0.056, 0.075, 0, 0.022, 0.03, 0, 0, 0, true)); g.add(caja(R.metal, 0.03, 0.01, 0.05, 0, 0.055, 0.04)); // báscula grabada y llave
      g.add(caja(R.acero, 0.008, 0.024, 0.014, 0.013, 0.06, 0.075, -0.5), caja(R.acero, 0.008, 0.024, 0.014, -0.013, 0.06, 0.075, -0.5)); // martillos a la vista
      g.add(aro(R.metal, 0.026, 0.004, 0, -0.012, 0.045, 0, Math.PI / 2, Math.PI, Math.PI), caja(R.acero, 0.005, 0.022, 0.007, 0.006, -0.012, 0.035, 0.25), caja(R.acero, 0.005, 0.02, 0.007, -0.006, -0.012, 0.05, 0.25));
      g.add(perfil(R.madera, [[0.065, 0.045], [0.12, 0.036], [0.2, -0.05], [0.205, -0.12], [0.18, -0.135], [0.13, -0.13], [0.09, -0.03], [0.065, -0.005]], 0.042, 0.004)); // culata recortada a pistola
      for (let k = 0; k < 3; k++) g.add(caja(R.cinta, 0.046, 0.016, 0.046, 0, -0.055 - k * 0.02, 0.135 + k * 0.012, 0.45)); // cinta aisladora en la empuñadura
      { const c = pieza('cargador', 0.026, -0.01, 0.12); for (const z of [0, 0.034]) { c.add(cil(R.rojo, 0.0105, 0.0105, 0.05, 0, 0, z, 0, 0, 0, 10)); c.add(cil(R.laton, 0.0115, 0.0115, 0.016, 0, -0.026, z, 0, 0, 0, 10)); } c.add(caja(R.cuero, 0.006, 0.03, 0.07, -0.008, 0, 0.017)); c.rotation.x = -0.5; g.add(c); }
      if (conMano) mano(g, 0, -0.09, 0.13, 0.45);
      punta.set(0, 0.03, -0.41); break;
    }
    case 'lanzagarrafas': { // caño casero de 12 cm con cinta, empuñaduras de madera, chispero y una garrafita naranja asomando
      g.add(cil(R.acero, 0.06, 0.06, 0.72, 0, 0.03, -0.17, Math.PI / 2, 0, 0, 18, true), cil(R.cinta, 0.054, 0.054, 0.72, 0, 0.03, -0.17, Math.PI / 2, 0, 0, 18, true)); // tubo (por dentro oscuro)
      for (const z of [-0.47, -0.3, -0.06, 0.12]) g.add(cil(R.cinta, 0.0625, 0.0625, 0.035, 0, 0.03, z, Math.PI / 2, 0, 0, 18));
      g.add(cil(R.metal, 0.066, 0.066, 0.03, 0, 0.03, 0.2, Math.PI / 2, 0, 0, 18), cil(R.metal, 0.064, 0.064, 0.02, 0, 0.03, -0.53, Math.PI / 2, 0, 0, 18)); // tapa de atrás y boca
      for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283; g.add(cil(R.acero, 0.006, 0.006, 0.012, Math.cos(a) * 0.066, 0.03 + Math.sin(a) * 0.066, 0.218, Math.PI / 2, 0, 0, 6)); } // bulones
      g.add(caja(R.maderaCl, 0.032, 0.12, 0.045, 0, -0.085, -0.28, 0.12), caja(R.metal, 0.07, 0.014, 0.05, 0, -0.03, -0.28)); // empuñadura de adelante con abrazadera
      g.add(perfil(R.maderaCl, [[0.0, -0.03], [0.05, -0.03], [0.075, -0.14], [0.065, -0.155], [0.025, -0.155], [0.0, -0.06]], 0.034, 0.004));
      g.add(caja(R.metal, 0.074, 0.014, 0.07, 0, -0.03, 0.025));
      g.add(caja(R.rojo, 0.03, 0.04, 0.03, 0.05, -0.02, 0.0), caja(R.acero, 0.012, 0.012, 0.01, 0.05, -0.04, -0.017), cil(R.cinta, 0.003, 0.003, 0.2, 0.05, 0.0, -0.1, Math.PI / 2, 0, 0, 5)); // chispero de cocina y el cable
      g.add(aro(R.acero, 0.018, 0.0025, 0, 0.115, -0.05, 0, 0, 0), caja(R.acero, 0.003, 0.03, 0.003, 0, 0.1, -0.05), caja(R.acero, 0.004, 0.02, 0.004, 0, 0.1, -0.5)); // mira de alambre
      { const gar = pieza('garrafa', 0, 0.03, -0.56); gar.add(cil(R.naranja, 0.05, 0.05, 0.12, 0, 0, -0.02, Math.PI / 2, 0, 0, 16), esfera(R.naranja, 0.05, 0, 0, -0.08, 1, 1, 0.55, 16)); gar.add(cil(R.acero, 0.014, 0.014, 0.03, 0, 0, -0.115), cil(R.rojo, 0.017, 0.017, 0.012, 0, 0, -0.132), aro(R.naranja, 0.035, 0.007, 0, 0, -0.105, 0, 0, 0, Math.PI * 2, 12)); g.add(gar); } // garrafita con válvula y manija
      if (conMano) mano(g, 0, -0.09, 0.04, 0.12);
      punta.set(0, 0.03, -0.62); break;
    }
    case 'bengalera': { // pistola de bengalas de plástico naranja, boca ancha
      g.add(cil(R.naranja, 0.022, 0.024, 0.18, 0, 0.03, -0.12, Math.PI / 2, 0, 0, 16, true), cil(R.cinta, 0.019, 0.019, 0.18, 0, 0.03, -0.12, Math.PI / 2, 0, 0, 16, true), cil(R.naranja, 0.027, 0.027, 0.02, 0, 0.03, -0.205, Math.PI / 2, 0, 0, 16));
      g.add(caja(R.naranja, 0.044, 0.05, 0.08, 0, 0.022, 0.0), caja(R.naranja, 0.03, 0.012, 0.16, 0, 0.056, -0.09), caja(R.naranja, 0.008, 0.01, 0.01, 0, 0.066, -0.19)); // armazón, banda y mira
      g.add(cil(R.metal, 0.01, 0.01, 0.05, 0, 0.0, -0.03, 0, 0, Math.PI / 2, 8)); // bisagra
      g.add(perfil(R.naranja, [[0.0, -0.0], [0.05, 0.0], [0.08, -0.11], [0.07, -0.125], [0.025, -0.125], [0.005, -0.03]], 0.04, 0.005));
      for (let k = 0; k < 5; k++) g.add(caja(R.poli, 0.042, 0.006, 0.006, 0, -0.03 - k * 0.018, 0.03 + k * 0.006, 0.3)); // estrías de la empuñadura
      g.add(aro(R.naranja, 0.03, 0.005, 0, -0.012, -0.02, 0, Math.PI / 2, Math.PI, Math.PI), caja(R.acero, 0.006, 0.022, 0.008, 0, -0.01, -0.025, 0.2), caja(R.metal, 0.012, 0.026, 0.016, 0, 0.055, 0.045, -0.4));
      { const c = pieza('cargador', 0, 0.03, 0.035); c.add(cil(R.rojo, 0.0185, 0.0185, 0.05, 0, 0, 0, Math.PI / 2, 0, 0, 14), cil(R.laton, 0.021, 0.021, 0.008, 0, 0, 0.028, Math.PI / 2, 0, 0, 14)); g.add(c); }
      if (conMano) mano(g, 0, -0.07, 0.045, -0.2);
      punta.set(0, 0.03, -0.215); break;
    }
    case 'gomera': { // gomera en Y de madera, gomas de látex, cuero y un bizcocho (medialuna) cargado
      g.add(cil(R.madera, 0.015, 0.017, 0.11, 0, -0.07, 0, 0, 0, 0, 10)); // mango
      for (let k = 0; k < 4; k++) g.add(cil(R.cuero, 0.0175, 0.0175, 0.012, 0, -0.1 + k * 0.02, 0, 0, 0, 0, 10)); // tiras de cuero
      g.add(esfera(R.madera, 0.019, 0, -0.012, 0, 1.3, 0.9, 1));
      for (const s of [-1, 1]) { g.add(cil(R.madera, 0.011, 0.014, 0.085, s * 0.026, 0.025, 0, 0, 0, -s * 0.55, 10)); g.add(esfera(R.madera, 0.012, s * 0.05, 0.062, 0, 1, 1, 1, 8)); g.add(cil(R.goma, 0.013, 0.013, 0.012, s * 0.05, 0.068, 0, 0, 0, 0, 8)); }
      for (const s of [-1, 1]) { const dx = -s * 0.05, dz = 0.15, l = Math.hypot(dx, dz); g.add(cil(R.goma, 0.004, 0.004, l, s * 0.05 + dx / 2, 0.068, dz / 2, Math.PI / 2, 0, Math.atan2(dx, dz) * 0, 6)); g.children[g.children.length - 1].rotation.set(Math.PI / 2, 0, -Math.atan2(dx, dz)); }
      g.add(caja(R.cuero, 0.036, 0.022, 0.016, 0, 0.068, 0.158));
      { const c = pieza('cargador', 0, 0.075, 0.15); const bz = new THREE.TorusGeometry(0.02, 0.0095, 7, 12, Math.PI * 1.25); uvLargo(bz, R.bizcocho, 0.13, 0.06); bz.scale(1, 1, 0.8); const m = malla(bz, 0, 0, 0, 0, 0, -Math.PI * 0.12 - Math.PI / 2); m.rotation.x = -0.3; c.add(m, esfera(R.bizcocho, 0.009, 0.0, 0.02, 0.002, 1, 0.9, 0.8, 6)); g.add(c); }
      if (conMano) mano(g, 0, -0.075, 0.02, 0);
      punta.set(0, 0.07, -0.02); break;
    }
    case 'cana': { // caña de pescar con reel, anillas, tanza y plomada (a lo largo de +Y, mango en el origen)
      g.add(cil(R.maderaCl, 0.017, 0.016, 0.26, 0, 0.0, 0, 0, 0, 0, 12), cil(R.cinta, 0.019, 0.019, 0.025, 0, -0.14, 0, 0, 0, 0, 12)); // mango de corcho y taco
      g.add(cil(R.acero, 0.015, 0.015, 0.06, 0, 0.16, 0, 0, 0, 0, 12), cil(R.cinta, 0.0125, 0.0105, 1.35, 0, 0.865, 0, 0, 0, 0, 10)); // portareel y la caña
      for (let k = 0; k < 4; k++) g.add(cil(R.rojo, 0.0125 - k * 0.0006, 0.0125 - k * 0.0006, 0.006, 0, 0.26 + k * 0.012, 0, 0, 0, 0, 10)); // atadura roja
      // reel frontal colgando abajo de la caña
      g.add(caja(R.metal, 0.012, 0.05, 0.012, 0, 0.16, 0.03), cil(R.metal, 0.03, 0.03, 0.035, 0, 0.16, 0.065, 0, 0, Math.PI / 2, 14), cil(R.acero, 0.026, 0.026, 0.02, 0, 0.16, 0.065, 0, 0, Math.PI / 2, 14));
      g.add(cil(R.goma, 0.022, 0.022, 0.018, 0, 0.16 + 0.0, 0.065, 0, 0, Math.PI / 2, 14)); g.children[g.children.length - 1].position.x = 0.018; // tanza enrollada
      g.add(caja(R.acero, 0.05, 0.006, 0.006, -0.03, 0.16, 0.065), esfera(R.poli, 0.008, -0.055, 0.16, 0.075));
      // anillas que achican hacia la punta
      [0.38, 0.6, 0.85, 1.1, 1.32, 1.5].forEach((y, k) => { const r = 0.016 - k * 0.0022; g.add(aro(R.acero, r, 0.0016, 0, y, 0.012 + r, 0, Math.PI / 2, 0, Math.PI * 2, 10), caja(R.acero, 0.003, 0.003, r + 0.012, 0, y, 0.006 + r / 2)); });
      { const t = pieza('tanza', 0, 1.54, 0.01); t.add(cil(R.goma, 0.0012, 0.0012, 0.36, 0, -0.18, 0.0, 0, 0, 0, 4), esfera(R.acero, 0.011, 0, -0.37, 0, 1, 1.4, 1, 8), aro(R.acero, 0.008, 0.0012, 0, -0.395, 0, 0, Math.PI / 2, 0, Math.PI * 1.4, 8)); g.add(t); }
      if (conMano) mano(g, 0, -0.03, 0.03);
      break;
    }
    case 'espeto': { // espeto de acero con mango de madera, argolla y un chorizo pinchado
      g.add(cil(R.madera, 0.017, 0.018, 0.15, 0, 0.0, 0, 0, 0, 0, 12), cil(R.acero, 0.019, 0.019, 0.02, 0, 0.085, 0, 0, 0, 0, 12), cil(R.acero, 0.019, 0.019, 0.012, 0, -0.08, 0, 0, 0, 0, 12));
      g.add(aro(R.acero, 0.022, 0.004, 0, -0.11, 0, 0, Math.PI / 2, 0));
      g.add(caja(R.acero, 0.012, 0.69, 0.005, 0, 0.44, 0)); { const p = new THREE.ConeGeometry(0.0085, 0.05, 4); uvLargo(p, R.acero, 0.03, 0.05); g.add(malla(p, 0, 0.81, 0, 0, Math.PI / 4, 0)); }
      for (let k = 0; k < 2; k++) g.add(caja(R.acero, 0.014, 0.004, 0.007, 0, 0.12 + k * 0.012, 0)); // virola
      // chorizo pinchado: dos tramos con las puntas atadas
      g.add(cil(R.chorizo, 0.023, 0.023, 0.09, 0.004, 0.62, 0, 0, 0, 0.12, 12), cil(R.chorizo, 0.023, 0.023, 0.08, -0.004, 0.7, 0, 0, 0, -0.1, 12));
      g.add(esfera(R.chorizo, 0.023, 0.009, 0.575, 0, 1, 1, 1, 10), esfera(R.chorizo, 0.023, -0.008, 0.74, 0, 1, 1, 1, 10), cil(R.goma, 0.008, 0.004, 0.012, 0, 0.553, 0, 0, 0, 0, 6), cil(R.goma, 0.008, 0.004, 0.012, -0.01, 0.762, 0, 0, 0, 0, 6));
      if (conMano) mano(g, 0, -0.02, 0.03, 0, 1.1);
      break;
    }
    case 'termo': { // termo verde con la pintura saltada, manija, tapón cebador y el mate atado (v8)
      { const gg = new THREE.CylinderGeometry(0.055, 0.055, 0.42, 20); uvLargo(gg, R.verde, 0, 0, true); g.add(malla(gg, 0, 0.12, 0)); } // cuerpo verde con el calco entero
      g.add(cil(R.acero, 0.045, 0.055, 0.06, 0, 0.36, 0, 0, 0, 0, 18), cil(R.poli, 0.022, 0.03, 0.04, 0, 0.41, 0, 0, 0, 0, 12), cil(R.acero, 0.056, 0.056, 0.02, 0, -0.085, 0, 0, 0, 0, 18));
      g.add(caja(R.poli, 0.02, 0.2, 0.04, 0.075, 0.14, 0), caja(R.poli, 0.025, 0.02, 0.04, 0.062, 0.24, 0), caja(R.poli, 0.025, 0.02, 0.04, 0.062, 0.04, 0));
      g.add(aro(R.acero, 0.056, 0.004, 0, 0.33, 0, Math.PI / 2, 0, 0, Math.PI * 2, 20), aro(R.acero, 0.056, 0.004, 0, -0.07, 0, Math.PI / 2, 0, 0, Math.PI * 2, 20)); // anillos de acero
      // el mate atado con una piola al costado (calabaza, virola y bombilla)
      g.add(esfera(R.cuero, 0.036, -0.075, 0.2, 0.02, 1, 1.15, 1, 12), cil(R.cromo, 0.024, 0.026, 0.012, -0.075, 0.245, 0.02, 0, 0, 0, 12), cil(R.cromo, 0.003, 0.003, 0.12, -0.08, 0.28, 0.02, 0, 0, 0.18, 6), cil(R.goma, 0.002, 0.002, 0.1, -0.035, 0.27, 0.02, 0, 0, 0.9, 4));
      if (conMano) mano(g, 0, -0.04, 0.03);
      break;
    }
    case 'escopeta': { // escopeta de corredera v8: cajón grabado, caño y tubo de cartuchos, corredera de madera ('bomba'), culata
      g.add(cil(R.metal, 0.02, 0.02, 0.72, 0, 0.032, -0.32), cil(R.metal, 0.017, 0.017, 0.56, 0, -0.008, -0.26), cil(R.cinta, 0.014, 0.014, 0.004, 0, 0.032, -0.681));
      g.add(cil(R.metal, 0.023, 0.023, 0.02, 0, 0.032, -0.665), esfera(R.laton, 0.005, 0, 0.056, -0.66));
      g.add(caja(R.grabado, 0.062, 0.085, 0.22, 0, 0.0, 0.05, 0, 0, 0, true), caja(R.cinta, 0.004, 0.03, 0.06, 0.032, 0.02, 0.03));
      g.add(caja(R.metal, 0.03, 0.01, 0.2, 0, 0.047, 0.05)); // riel de arriba
      g.add(aro(R.metal, 0.03, 0.004, 0, -0.045, 0.1, 0, Math.PI / 2, Math.PI, Math.PI), caja(R.acero, 0.006, 0.026, 0.008, 0, -0.045, 0.098, 0.2));
      g.add(perfil(R.madera, [[0.16, 0.04], [0.45, 0.025], [0.46, -0.12], [0.44, -0.14], [0.26, -0.07], [0.16, -0.045]], 0.05, 0.005), caja(R.poli, 0.054, 0.17, 0.02, 0, -0.05, 0.462, 0.08));
      const b = pieza('bomba', 0, -0.01, -0.36); for (let k = 0; k < 7; k++) b.add(caja(R.madera, 0.062, 0.052 - (k % 2) * 0.004, 0.022, 0, 0, -0.07 + k * 0.023)); g.add(b);
      if (conMano) mano(g, 0, -0.07, 0.1);
      punta.set(0, 0.03, -0.69); break;
    }
    case 'bate': { // bate de madera clara con cinta, franja celeste y clavos (v8)
      { const p = new THREE.CylinderGeometry(0.05, 0.02, 0.85, 16); uvLargo(p, R.maderaCl, 0.3, 0.85); g.add(malla(p, 0, 0.42, 0)); }
      g.add(cil(R.cinta, 0.0235, 0.0225, 0.2, 0, 0.03, 0, 0, 0, 0, 12), cil(R.maderaCl, 0.032, 0.032, 0.02, 0, -0.075, 0, 0, 0, 0, 12));
      for (let k = 0; k < 8; k++) { const a = k * 2.4, y = 0.62 + (k % 4) * 0.05; g.add(cil(R.acero, 0.003, 0.003, 0.05, Math.cos(a) * 0.05, y, Math.sin(a) * 0.05, Math.PI / 2, 0, 0, 5)); g.children[g.children.length - 1].rotation.set(0, -a, Math.PI / 2); g.add(cil(R.acero, 0.006, 0.006, 0.004, Math.cos(a) * 0.026 + Math.cos(a) * 0.0, y, Math.sin(a) * 0.026, 0, 0, 0, 6)); g.children[g.children.length - 1].visible = false; }
      if (conMano) mano(g, 0, -0.02, 0.03);
      break;
    }
    default: return null;
  }
  hornear(g);
  g.userData.punta = punta; g.userData.v8 = true;
  return g;
}

// API (ARMAS-LISTA.md): modelo en primera persona (con mano) o null si no hay modelo v8 para ese id → se usa el viejo
export function modeloArma(id) { return construir(id, true); }
// versión para tirar en el piso (misma geometría, sin mano ni manga)
export function modeloPickup(id) { return construir(id, false); }
// todos los modelos v8 (para la preview)
export function modelosV8(conMano = true) { const r = {}; for (const a of ARMAS_V8) { const m = construir(a.id, conMano); if (m) r[a.id] = m; } return r; }
