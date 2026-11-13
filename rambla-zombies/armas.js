// Armas: definiciones y modelos en primera persona (hechos a mano con cajas y cilindros)
import * as THREE from 'https://esm.sh/three@0.160.0';

export const ARMAS = [
  { id: 'pistola', nombre: 'Pistola', precio: 0, desc: 'La de siempre. Balas infinitas en la reserva.', tipo: 'fuego', dano: 34, cadencia: 0.28, cargador: 12, reserva: Infinity, recarga: 1.1, alcance: 80, disp: 0.012, perdigones: 1, retroceso: 0.06, sonido: 'pistola', auto: false },
  { id: 'escopeta', nombre: 'Escopeta', precio: 250, desc: 'De cerca no perdona. Nueve perdigones y empuje.', tipo: 'fuego', dano: 16, cadencia: 0.85, cargador: 6, reserva: 24, recarga: 2.0, alcance: 28, disp: 0.09, perdigones: 9, retroceso: 0.22, sonido: 'escopeta', auto: false, empuje: 3 },
  { id: 'metralleta', nombre: 'Metralleta', precio: 450, desc: 'Automática. Mantené apretado y barré la rambla.', tipo: 'fuego', dano: 21, cadencia: 0.085, cargador: 30, reserva: 90, recarga: 1.6, alcance: 70, disp: 0.03, perdigones: 1, retroceso: 0.035, sonido: 'metralleta', auto: true },
  { id: 'rifle', nombre: 'Rifle de caza', precio: 700, desc: 'Lento pero atraviesa hasta tres zombis.', tipo: 'fuego', dano: 160, cadencia: 1.1, cargador: 5, reserva: 15, recarga: 2.2, alcance: 200, disp: 0.002, perdigones: 1, retroceso: 0.3, sonido: 'rifle', auto: false, atraviesa: 3 },
  { id: 'termo', nombre: 'Termo', precio: 0, desc: 'El compañero fiel. ¡Toc! en la cabeza.', tipo: 'cuerpo', dano: 30, cadencia: 0.5, alcance: 2.6, empuje: 11, sonido: 'termo', arco: 0.55 },
  { id: 'bate', nombre: 'Bate', precio: 100, desc: 'Buen daño y buen empuje.', tipo: 'cuerpo', dano: 55, cadencia: 0.6, alcance: 2.9, empuje: 10, sonido: 'golpe', arco: 0.5 },
  { id: 'machete', nombre: 'Machete', precio: 180, desc: 'Rápido y filoso. Corta brazos.', tipo: 'cuerpo', dano: 80, cadencia: 0.42, alcance: 2.4, empuje: 2.5, sonido: 'corte', arco: 0.6 },
  { id: 'sarten', nombre: 'Sartén de la abuela', precio: 140, desc: '¡BONG! El que más empuja.', tipo: 'cuerpo', dano: 45, cadencia: 0.55, alcance: 2.5, empuje: 18, sonido: 'sarten', arco: 0.55 },
  { id: 'revolver', nombre: 'Revólver .38', precio: 380, desc: 'Seis tiros que tumban. Atraviesa a dos.', tipo: 'fuego', dano: 95, cadencia: 0.55, cargador: 6, reserva: 30, recarga: 2.3, alcance: 90, disp: 0.006, perdigones: 1, retroceso: 0.24, sonido: 'revolver', auto: false, atraviesa: 2, empuje: 1.8 }
];


// ---------- texturas procedurales (canvas 256 px, compartidas por todas las armas, con mipmaps) ----------
const lienzo = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
const gris = (v, a = 1) => `rgba(${v | 0},${v | 0},${v | 0},${a})`;
function aTex(c, rep = true) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; if (rep) t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; }
function aDato(c, rep = true) { const t = new THREE.CanvasTexture(c); t.anisotropy = 4; if (rep) t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; }
// acero pavonado: cepillado, rayones y desgaste en los cantos; abajo una franja con el grabado del fabricante (calco)
function texMetal() {
  const [c, g] = lienzo(256, 256);
  g.fillStyle = gris(178); g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 900; i++) { g.fillStyle = gris(140 + Math.random() * 100, 0.12); g.fillRect(0, Math.random() * 256, 256, 1); }            // cepillado
  for (let i = 0; i < 2600; i++) { g.fillStyle = gris(120 + Math.random() * 135, 0.25); g.fillRect(Math.random() * 256, Math.random() * 256, 1, 1); }
  for (let i = 0; i < 40; i++) { g.strokeStyle = gris(235, 0.35); g.lineWidth = 0.6; g.beginPath(); const x = Math.random() * 256, y = Math.random() * 210; g.moveTo(x, y); g.lineTo(x + (Math.random() - .5) * 40, y + (Math.random() - .5) * 10); g.stroke(); } // rayones
  g.strokeStyle = gris(230, 0.5); g.lineWidth = 3; g.strokeRect(1.5, 1.5, 253, 207);                                                         // cantos gastados
  // franja del grabado (v 0..0.18 en la textura)
  g.fillStyle = gris(150); g.fillRect(0, 212, 256, 44);
  for (let i = 0; i < 200; i++) { g.fillStyle = gris(120 + Math.random() * 80, 0.2); g.fillRect(0, 212 + Math.random() * 44, 256, 1); }
  g.font = 'bold 15px monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = gris(60, 0.9); g.fillText('RAMBLA ARMS · MVD · URUGUAY', 128, 226); g.font = 'bold 12px monospace'; g.fillText('CAL. 9 × 19  ·  Nº 0067', 128, 244);
  g.fillStyle = gris(225, 0.5); g.fillText('CAL. 9 × 19  ·  Nº 0067', 128, 245);
  return c;
}
function texMadera() { // veta con nudos, tileable a lo largo
  const [c, g] = lienzo(128, 256);
  g.fillStyle = gris(200); g.fillRect(0, 0, 128, 256);
  for (let x = 0; x < 128; x++) { const v = 150 + Math.sin(x * 0.35 + Math.sin(x * 0.07) * 4) * 35 + Math.random() * 20; g.fillStyle = gris(v, 0.55); g.fillRect(x, 0, 1, 256); }
  for (let i = 0; i < 260; i++) { g.fillStyle = gris(90 + Math.random() * 60, 0.25); const x = Math.random() * 128; g.fillRect(x, Math.random() * 256, 1, 8 + Math.random() * 40); }
  for (let k = 0; k < 3; k++) { const x = Math.random() * 128, y = Math.random() * 256; for (let r = 9; r > 1; r -= 2) { g.strokeStyle = gris(80, 0.3); g.beginPath(); g.ellipse(x, y, r * 0.6, r * 1.6, 0, 0, 6.3); g.stroke(); } }
  return c;
}
function texPolimero() { // empuñadura punteada (stippling) + bump
  const [c, g] = lienzo(128, 128);
  g.fillStyle = gris(150); g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 2600; i++) { g.fillStyle = gris(Math.random() < 0.5 ? 120 : 185, 0.6); g.beginPath(); g.arc(Math.random() * 128, Math.random() * 128, 0.6 + Math.random() * 0.9, 0, 6.3); g.fill(); }
  return c;
}
function texPintura() { // pintura de termo con saltaduras que dejan ver el acero
  const [c, g] = lienzo(256, 256);
  g.fillStyle = gris(205); g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1500; i++) { g.fillStyle = gris(170 + Math.random() * 60, 0.3); g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2); }
  for (let i = 0; i < 26; i++) { const x = Math.random() * 256, y = Math.random() * 256; g.fillStyle = 'rgba(255,255,255,0.95)'; g.beginPath(); for (let k = 0; k < 7; k++) { const a = k / 7 * 6.3, r = 2 + Math.random() * 6; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.fill(); }
  g.save(); g.translate(128, 150); g.rotate(-Math.PI / 2); g.font = 'bold 30px sans-serif'; g.textAlign = 'center'; g.fillStyle = gris(245, 0.9); g.fillText('TERMOLAR', 0, 10); g.restore(); // calco
  return c;
}
const TX = (() => { const m = texMetal(), w = texMadera(), p = texPolimero(), t = texPintura();
  return { metal: aTex(m, false), metalB: aDato(m, false), madera: aTex(w), maderaB: aDato(w), poli: aTex(p), poliB: aDato(p), pintura: aTex(t, false) }; })();

const M = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.15, ...extra, metalness: Math.min(0.35, (extra.metalness ?? 0.15)) });
const metal = M(0x9aa0ac, { metalness: 0.8, roughness: 0.38, map: TX.metal, bumpMap: TX.metalB, bumpScale: 0.6, roughnessMap: TX.metalB });
const metalClaro = M(0xd0d4dc, { metalness: 0.9, roughness: 0.22, map: TX.metal, bumpMap: TX.metalB, bumpScale: 0.4 });
const madera = M(0x8a5028, { metalness: 0, roughness: 0.55, map: TX.madera, bumpMap: TX.maderaB, bumpScale: 0.8 }), maderaClara = M(0xe8b878, { metalness: 0, roughness: 0.6, map: TX.madera, bumpMap: TX.maderaB, bumpScale: 0.8 });
const negro = M(0x4a4c54, { roughness: 0.62, map: TX.poli, bumpMap: TX.poliB, bumpScale: 0.6 }), oscuro = negro; // los detalles oscuros comparten material (sin draw calls extra)
const piel = M(0xd8a888, { metalness: 0 }), manga = M(0x3a4a6a, { metalness: 0, map: TX.poli, bumpMap: TX.poliB, bumpScale: 0.5 });

// UV a escala real: la textura se repite cada ~16 cm; en el metal, las caras laterales (±x) pueden llevar el grabado
const KUV = 6;
function uvCaja(geo, w, h, d, mat, grabado) {
  const uv = geo.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]], esMetal = mat && mat.map === TX.metal;
  for (let q = 0; q < 24; q++) {
    const f = q >> 2, u = uv.getX(q), v = uv.getY(q), [a, b] = dims[f];
    if (esMetal) { if (grabado && f < 2) uv.setXY(q, f === 1 ? 1 - u : u, v * 0.17); else uv.setXY(q, u * Math.min(1, a * KUV * 0.6), 0.2 + v * Math.min(0.8, b * KUV * 0.5)); }
    else uv.setXY(q, u * a * KUV, v * b * KUV);
  }
}
function caja(w, h, d, mat, x = 0, y = 0, z = 0, grabado = false) { const g = new THREE.BoxGeometry(w, h, d); uvCaja(g, w, h, d, mat, grabado); const m = new THREE.Mesh(g, mat); m.position.set(x, y, z); return m; }
function cil(rt, rb, h, mat, x = 0, y = 0, z = 0, rx = 0, seg = 12) {
  const g = new THREE.CylinderGeometry(rt, rb, h, seg), uv = g.attributes.uv, esMetal = mat && mat.map === TX.metal, circ = Math.PI * 2 * Math.max(rt, rb);
  for (let i = 0; i < uv.count; i++) { const u = uv.getX(i), v = uv.getY(i); if (esMetal) uv.setXY(i, u * Math.min(1, circ * KUV), 0.2 + v * 0.8); else uv.setXY(i, u * circ * KUV, v * h * KUV); }
  const m = new THREE.Mesh(g, mat); m.position.set(x, y, z); m.rotation.x = rx; return m;
}
const aro = (r, t, mat, x, y, z, ry = 0, arco = Math.PI) => { const m = new THREE.Mesh(new THREE.TorusGeometry(r, t, 5, 10, arco), mat); m.position.set(x, y, z); m.rotation.set(0, Math.PI / 2 + ry, Math.PI); return m; }; // guardamonte
// uv de piezas extruidas: el metal mapea a su zona de la textura (0.2..1) sin repetir; el resto se repite a escala real
function uvExt(g, mat) {
  const uv = g.attributes.uv, esMetal = mat && mat.map === TX.metal; let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
  for (let i = 0; i < uv.count; i++) { const u = uv.getX(i), v = uv.getY(i); u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
  for (let i = 0; i < uv.count; i++) { const u = uv.getX(i), v = uv.getY(i); if (esMetal) uv.setXY(i, (u - u0) / (u1 - u0 || 1), 0.2 + 0.8 * (v - v0) / (v1 - v0 || 1)); else uv.setXY(i, u * KUV, v * KUV); }
}
// sección (x, y) extruida a lo largo de z desde z0 hacia atrás
function seccion(pts, largo, mat, z0, bisel = 0) {
  const sh = new THREE.Shape(pts.map(p => new THREE.Vector2(p[0], p[1])));
  const g = new THREE.ExtrudeGeometry(sh, { depth: largo - bisel * 2, bevelEnabled: bisel > 0, bevelThickness: bisel, bevelSize: bisel, bevelSegments: 1, curveSegments: 1 });
  g.translate(0, 0, z0 + bisel); uvExt(g, mat); return new THREE.Mesh(g, mat);
}
// perfil lateral (z, y) con agujeros, extruido a lo ancho (x), centrado
function perfil(pts, agujeros, ancho, mat, bisel = 0) {
  const sh = new THREE.Shape(pts.map(p => new THREE.Vector2(-p[0], p[1])));
  for (const a of agujeros) sh.holes.push(new THREE.Path(a.map(p => new THREE.Vector2(-p[0], p[1]))));
  const g = new THREE.ExtrudeGeometry(sh, { depth: ancho - bisel * 2, bevelEnabled: bisel > 0, bevelThickness: bisel, bevelSize: bisel, bevelSegments: 1, curveSegments: 1 });
  g.translate(0, 0, -ancho / 2 + bisel); g.rotateY(Math.PI / 2); uvExt(g, mat); return new THREE.Mesh(g, mat);
}
function mano(g, x = 0, y = -0.06, z = 0.05) { // palma, cuatro dedos que abrazan el mango, pulgar y manga (todo se hornea: mismo draw call)
  g.add(seccion([[-0.036, -0.045], [0.036, -0.045], [0.04, 0.03], [0.03, 0.046], [-0.03, 0.046], [-0.04, 0.03]].map(p => [p[0] + x, p[1] + y]), 0.072, piel, z - 0.03, 0.006));
  for (let k = 0; k < 4; k++) { const d = cil(0.0115, 0.0115, 0.074 - k * 0.006, piel, x, y + 0.03 - k * 0.022, z - 0.038 + k * 0.003, 0, 7); d.rotation.z = Math.PI / 2; g.add(d); }
  { const p = cil(0.012, 0.01, 0.06, piel, x - 0.034, y + 0.042, z - 0.03, Math.PI / 2, 7); p.rotation.z = 0.12; g.add(p); }
  g.add(cil(0.05, 0.056, 0.24, manga, x, y - 0.01, z + 0.17, Math.PI / 2, 10), cil(0.047, 0.047, 0.02, piel, x, y - 0.006, z + 0.05, Math.PI / 2, 10)); // manga y muñeca
}
// junta todo lo que no se anima en una malla por material: más detalle sin sumar draw calls
function hornearArma(g) {
  const fijas = g.children.filter(o => o.isMesh && !o.name), cub = new Map();
  for (const o of fijas) { o.updateMatrix(); const geo = (o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone()).applyMatrix4(o.matrix); if (!cub.has(o.material)) cub.set(o.material, []); cub.get(o.material).push(geo); g.remove(o); o.geometry.dispose(); }
  cub.forEach((geos, mat) => {
    let n = 0; geos.forEach(x => n += x.attributes.position.count);
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2); let k = 0;
    for (const x of geos) { pos.set(x.attributes.position.array, k * 3); nor.set(x.attributes.normal.array, k * 3); uv.set(x.attributes.uv.array, k * 2); k += x.attributes.position.count; x.dispose(); }
    const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); bg.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); bg.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.add(new THREE.Mesh(bg, mat));
  });
}

function modelo(id) {
  const g = new THREE.Group(), punta = new THREE.Vector3(0, 0, -0.3);
  switch (id) {
    case 'pistola': { // perfil real extruido (corredera biselada, armazón con guardamonte y empuñadura inclinada) para que se lea en primera persona
      // corredera: sección con los cantos de arriba achaflanados, bisel chico para que el canto agarre brillo
      g.add(seccion([[-0.025, 0.012], [0.025, 0.012], [0.025, 0.044], [0.016, 0.059], [-0.016, 0.059], [-0.025, 0.044]], 0.255, metal, -0.208, 0.0025));
      g.add(caja(0.0012, 0.022, 0.15, metal, 0.0262, 0.03, -0.11, true), caja(0.0012, 0.022, 0.15, metal, -0.0262, 0.03, -0.11, true)); // grabado en los dos lados
      for (let k = 0; k < 7; k++) g.add(caja(0.054, 0.03, 0.0035, oscuro, 0, 0.032, 0.008 + k * 0.0055)); // estrías de la corredera
      g.add(caja(0.004, 0.014, 0.04, oscuro, 0.026, 0.038, -0.075));                                       // ventana de expulsión
      g.add(cil(0.0105, 0.0105, 0.035, metal, 0, 0.034, -0.205, Math.PI / 2, 12), cil(0.0055, 0.0055, 0.037, oscuro, 0, 0.034, -0.205, Math.PI / 2, 8)); // caño asomado y boca
      g.add(caja(0.006, 0.01, 0.014, metal, 0, 0.064, -0.19), caja(0.026, 0.01, 0.012, metal, 0, 0.064, 0.036)); // miras
      g.add(caja(0.0115, 0.006, 0.004, oscuro, 0.0075, 0.065, 0.0425), caja(0.0115, 0.006, 0.004, oscuro, -0.0075, 0.065, 0.0425)); // muesca del alza
      // armazón de polímero de perfil (z, y): riel, guardamonte con agujero, cola de castor y empuñadura a 18°
      g.add(perfil([[-0.2, 0.013], [0.042, 0.013], [0.058, 0.004], [0.056, -0.012], [0.08, -0.128], [0.074, -0.142], [0.014, -0.142], [0.006, -0.13], [-0.01, -0.044],
        [-0.07, -0.044], [-0.086, -0.03], [-0.082, -0.004], [-0.2, -0.004], [-0.206, 0.006]], [[[-0.064, -0.036], [-0.02, -0.034], [-0.016, -0.006], [-0.074, -0.006], [-0.076, -0.026]]], 0.042, negro, 0.003));
      for (let k = 0; k < 3; k++) g.add(caja(0.044, 0.004, 0.006, oscuro, 0, -0.006, -0.18 + k * 0.016));     // ranuras del riel
      g.add(caja(0.006, 0.022, 0.008, metal, 0, -0.018, -0.032));                                           // disparador
      g.add(caja(0.004, 0.008, 0.022, oscuro, -0.023, 0.006, -0.02), caja(0.004, 0.006, 0.012, oscuro, -0.023, 0.0, -0.075)); // retén de corredera y palanca de desarme
      { const c = caja(0.034, 0.124, 0.046, metal, 0, -0.084, 0.04); c.rotation.x = -0.3; c.name = 'cargador'; g.add(c); } // cargador (asoma la base)
      mano(g, 0, -0.082, 0.036); punta.set(0, 0.034, -0.225); break;
    }
    case 'escopeta': {
      g.add(cil(0.022, 0.022, 0.75, metal, 0, 0.03, -0.3, Math.PI / 2));
      g.add(cil(0.018, 0.018, 0.6, metal, 0, -0.01, -0.25, Math.PI / 2));
      g.add(cil(0.024, 0.024, 0.02, oscuro, 0, 0.03, -0.67, Math.PI / 2), cil(0.005, 0.005, 0.01, metalClaro, 0, 0.056, -0.64, 0, 6)); // boca y mira de grano
      const bomba = caja(0.06, 0.05, 0.16, madera, 0, -0.01, -0.36); bomba.name = 'bomba'; g.add(bomba);
      g.add(caja(0.064, 0.085, 0.22, metal, 0, 0.0, 0.05, true));                                            // cajón de mecanismos grabado
      g.add(caja(0.004, 0.03, 0.06, oscuro, 0.033, 0.02, 0.04));                                             // ventana de expulsión
      g.add(aro(0.03, 0.004, metal, 0, -0.045, 0.1));
      g.add(caja(0.055, 0.1, 0.3, madera, 0, -0.05, 0.28)); g.add(caja(0.058, 0.11, 0.025, oscuro, 0, -0.055, 0.44)); // culata y cantonera
      mano(g, 0, -0.07, 0.1); punta.set(0, 0.03, -0.68); break;
    }
    case 'metralleta':
      g.add(caja(0.07, 0.09, 0.36, metal, 0, 0.02, -0.08, true)); g.add(cil(0.026, 0.026, 0.16, negro, 0, 0.03, -0.3, Math.PI / 2)); // cajón y guardamanos
      g.add(cil(0.012, 0.012, 0.12, metal, 0, 0.03, -0.42, Math.PI / 2)); g.add(cil(0.016, 0.016, 0.03, oscuro, 0, 0.03, -0.47, Math.PI / 2)); // caño y apagallamas
      { const c = caja(0.04, 0.16, 0.06, metal, 0, -0.09, -0.12); c.rotation.x = 0.12; c.name = 'cargador'; g.add(c); }
      { const e = caja(0.05, 0.11, 0.05, negro, 0, -0.065, 0.05); e.rotation.x = -0.2; g.add(e); }
      g.add(caja(0.012, 0.012, 0.24, metal, 0.022, 0.0, 0.2), caja(0.012, 0.012, 0.24, metal, -0.022, 0.0, 0.2), caja(0.06, 0.07, 0.015, negro, 0, -0.01, 0.32)); // culata plegable de alambre
      g.add(caja(0.02, 0.035, 0.02, metalClaro, 0, 0.085, -0.22), caja(0.03, 0.03, 0.02, metalClaro, 0, 0.08, 0.06)); // miras
      g.add(caja(0.03, 0.012, 0.012, metalClaro, 0.04, 0.04, -0.02));                                            // manija de carga
      g.add(aro(0.026, 0.004, metal, 0, -0.03, -0.0));
      mano(g, 0, -0.08, 0.05); punta.set(0, 0.03, -0.49); break;
    case 'rifle':
      g.add(cil(0.016, 0.02, 0.8, metal, 0, 0.03, -0.35, Math.PI / 2)); g.add(caja(0.06, 0.07, 0.5, madera, 0, -0.01, -0.05));
      { const cu = caja(0.055, 0.11, 0.3, madera, 0, -0.04, 0.3); cu.rotation.x = 0.06; g.add(cu); } g.add(caja(0.058, 0.12, 0.022, oscuro, 0, -0.05, 0.455));
      g.add(caja(0.05, 0.04, 0.16, metal, 0, 0.045, -0.02, true));                                                   // cerrojo grabado
      g.add(cil(0.022, 0.022, 0.28, negro, 0, 0.1, -0.08, Math.PI / 2)); g.add(cil(0.032, 0.026, 0.06, negro, 0, 0.1, -0.24, Math.PI / 2), cil(0.03, 0.026, 0.05, negro, 0, 0.1, 0.07, Math.PI / 2)); // mira telescópica
      g.add(cil(0.012, 0.012, 0.04, metal, 0, 0.075, -0.05), cil(0.012, 0.012, 0.04, metal, 0, 0.075, -0.13));                // anillas
      { const l = cil(0.027, 0.027, 0.004, M(0x3a6aa8, { roughness: 0.05, metalness: 0.3, emissive: 0x0a1a30 }), 0, 0.1, -0.272, Math.PI / 2); g.add(l); }      // lente
      g.add(cil(0.006, 0.006, 0.06, metalClaro, 0.035, 0.045, 0.04, 0, 6)); { const b = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), metalClaro); b.position.set(0.065, 0.045, 0.04); g.add(b); } // manija del cerrojo
      g.add(aro(0.03, 0.004, metal, 0, -0.045, 0.1));
      mano(g, 0, -0.08, 0.1); punta.set(0, 0.03, -0.76); break;
    case 'revolver': { // .38 de caño corto: el tambor se abre al recargar
      g.add(cil(0.017, 0.017, 0.2, metal, 0, 0.035, -0.2, Math.PI / 2)); g.add(caja(0.012, 0.012, 0.2, metal, 0, 0.054, -0.2)); // caño con banda
      g.add(caja(0.05, 0.05, 0.12, metal, 0, 0.03, -0.04, true));
      const t = cil(0.034, 0.034, 0.075, metalClaro, 0, 0.025, -0.07, Math.PI / 2, 6); t.name = 'tambor'; g.add(t);  // tambor hexagonal (estrías)
      { const e = caja(0.045, 0.13, 0.06, madera, 0, -0.06, 0.03); e.rotation.x = -0.25; g.add(e); }
      g.add(caja(0.01, 0.02, 0.01, metalClaro, 0, 0.065, -0.29)); g.add(caja(0.012, 0.03, 0.025, metal, 0, 0.065, 0.03)); // mira y martillo
      g.add(aro(0.024, 0.004, metal, 0, -0.015, -0.02));
      mano(g, 0, -0.09, 0.05); punta.set(0, 0.035, -0.31); break;
    }
    case 'termo': { // termo de mate, verde clásico con la pintura saltada, el calco y la manija
      const verde = M(0x2f7a40, { metalness: 0.4, roughness: 0.45, map: TX.pintura });
      g.add(cil(0.055, 0.055, 0.42, verde, 0, 0.12, 0, 0, 16)); g.add(cil(0.045, 0.055, 0.06, metalClaro, 0, 0.36, 0, 0, 16));
      g.add(cil(0.02, 0.03, 0.04, negro, 0, 0.41, 0)); g.add(cil(0.056, 0.056, 0.02, metalClaro, 0, -0.085, 0, 0, 16));
      g.add(caja(0.02, 0.2, 0.04, negro, 0.075, 0.14, 0), caja(0.025, 0.02, 0.04, negro, 0.062, 0.24, 0), caja(0.025, 0.02, 0.04, negro, 0.062, 0.04, 0));
      mano(g, 0, -0.04, 0.03); break;
    }
    case 'bate':
      g.add(cil(0.05, 0.02, 0.85, maderaClara, 0, 0.42, 0, 0, 14)); g.add(cil(0.023, 0.022, 0.18, negro, 0, 0.03, 0));  // madera y cinta de agarre
      g.add(cil(0.032, 0.032, 0.02, maderaClara, 0, -0.06, 0)); g.add(cil(0.051, 0.051, 0.03, M(0x8a1010, { roughness: 0.8 }), 0, 0.62, 0, 0, 14)); // perilla y franja roja
      mano(g, 0, -0.02, 0.03); break;
    case 'machete': {
      const hoja = caja(0.012, 0.6, 0.08, metalClaro, 0, 0.38, -0.01, true);
      const filo = caja(0.008, 0.6, 0.02, M(0xe8ecf0, { metalness: 1, roughness: 0.1 }), 0, 0.38, -0.055);
      g.add(hoja, filo); g.add(caja(0.036, 0.16, 0.042, madera, 0, 0.02, 0)); g.add(caja(0.02, 0.06, 0.12, M(0x7a1010), 0, 0.32, 0.0));
      for (const y of [-0.03, 0.06]) g.add(cil(0.006, 0.006, 0.044, metalClaro, 0, y, 0, 0, 6)); // remaches
      mano(g, 0, -0.02, 0.03); break;
    }
    case 'sarten': {
      const hierro = M(0x2a2a2a, { metalness: 0.7, roughness: 0.55, map: TX.poli, bumpMap: TX.poliB, bumpScale: 0.6 });
      const pan = cil(0.2, 0.17, 0.04, hierro, 0, 0.55, 0, Math.PI / 2, 18);
      g.add(pan); g.add(cil(0.17, 0.17, 0.005, M(0x3a3a3a, { metalness: 0.9, roughness: 0.2, map: TX.metal }), 0, 0.55, -0.022, Math.PI / 2, 18));
      g.add(caja(0.035, 0.36, 0.03, madera, 0, 0.18, 0)); g.add(cil(0.012, 0.012, 0.04, metalClaro, 0, 0.36, 0, Math.PI / 2, 6)); mano(g, 0, -0.02, 0.03); break;
    }
  }
  hornearArma(g);
  g.userData.punta = punta;
  return g;
}

export function crearModelos() { const r = {}; ARMAS.forEach(a => r[a.id] = modelo(a.id)); return r; }
