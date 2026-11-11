// Sangre en el piso que queda para siempre (Rambla Zombies 2.0 · Actualización 1).
// Cada mancha nace en un InstancedMesh (crece unos segundos) y después se "hornea" en la textura del tramo de rambla
// donde cayó: un render target por tramo, en coordenadas (índice de muestra, distancia lateral). Las manchas horneadas
// no cuestan nada: cada tramo visible es un solo draw, haya 1 o 5000 manchas. Nada se crea por cuadro.
import * as THREE from 'https://esm.sh/three@0.160.0';
import { local, piso, muestras, NM } from './world.js';

export const opacidad = (m, atlas) => { m.onBeforeCompile = sh => {
  sh.vertexShader = 'attribute vec2 aExtra;\nvarying float vOp;\n' + sh.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\n' +
    (atlas ? 'vMapUv = vMapUv * 0.5 + vec2(mod(aExtra.y, 2.0), 1.0 - floor(aExtra.y * 0.5)) * 0.5;\n' : '') + 'vOp = aExtra.x;');
  sh.fragmentShader = 'varying float vOp;\n' + sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\ndiffuseColor.a *= vOp;');
}; };

const D0 = -29.5, D1 = 22;                     // franja lateral con sangre: de la arena a la vereda de la ciudad
const NIVELES = [[-29.5, -12.1], [-12.1, -10.8], [-10.8, -2.5], [-2.5, 12], [12, 22]]; // escalones del piso
const TRAMO = 12;                              // muestras de rambla por textura (~20 m)
const NTR = Math.ceil(NM / TRAMO) + 1;
const ESP = muestras[1].p.distanceTo(muestras[0].p); // metros entre muestras
const BORDES = [-12.1, -10.8, -2.5, 12];

function atlas() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  const blob = (bx, by, r, a) => { const g = x.createRadialGradient(bx, by, 0, bx, by, r); g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(0.7, `rgba(255,255,255,${a * 0.92})`); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.beginPath(); x.arc(bx, by, r, 0, 7); x.fill(); };
  for (let cell = 0; cell < 4; cell++) {
    const ox = (cell % 2) * 64, oy = (cell >> 1) * 64, cx = ox + 32, cy = oy + 32;
    x.save(); x.beginPath(); x.rect(ox + 2, oy + 2, 60, 60); x.clip();
    if (cell < 2) { // charco: manchas superpuestas y gotitas alrededor
      blob(cx, cy, 17, 1);
      for (let k = 0; k < 8; k++) { const a = Math.random() * 6.28, d = 5 + Math.random() * 9; blob(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 6 + Math.random() * 7, 1); }
      for (let k = 0; k < 7; k++) { const a = Math.random() * 6.28, d = 20 + Math.random() * 8; blob(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 1.2 + Math.random() * 2.2, 1); }
    } else if (cell === 2) { // salpicadura
      blob(cx, cy, 9, 1);
      for (let k = 0; k < 16; k++) { const a = Math.random() * 6.28, d = 7 + Math.random() * 20; blob(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 1 + Math.random() * 3.2, 1); }
      for (let k = 0; k < 5; k++) { const a = Math.random() * 6.28; for (let q = 0; q < 6; q++) blob(cx + Math.cos(a) * (8 + q * 3.5), cy + Math.sin(a) * (8 + q * 3.5), 2.4 - q * 0.3, 0.9); }
    } else { // arrastre: alargado a lo largo de z
      for (let k = 0; k < 11; k++) blob(cx + (Math.random() - 0.5) * 7, oy + 9 + k * 4.4, 4.5 + Math.random() * 3.5, 0.85);
    }
    x.restore();
  }
  return new THREE.CanvasTexture(c);
}

export function crearSangre(scene) {
  const tex = atlas();
  // ---- manchas frescas (creciendo): InstancedMesh como antes
  const NV = 160; let iV = 0, usados = 0, sucio = false, total = 0, horneadas = 0; const _ac = new Float64Array(1); // acumulador sin boxear (un let de clausura con double pide memoria en cada escritura)
  const geo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const extra = new THREE.InstancedBufferAttribute(new Float32Array(NV * 2), 2); extra.setUsage(THREE.DynamicDrawUsage); geo.setAttribute('aExtra', extra);
  const mat = new THREE.MeshStandardMaterial({ map: tex, transparent: true, depthWrite: false, roughness: 0.72, metalness: 0, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  opacidad(mat, true);
  const im = new THREE.InstancedMesh(geo, mat, NV);
  im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.setColorAt(0, new THREE.Color()); im.instanceColor.setUsage(THREE.DynamicDrawUsage);
  im.frustumCulled = false; im.count = 0; im.renderOrder = 2; scene.add(im);
  const vX = new Float32Array(NV), vY = new Float32Array(NV), vZ = new Float32Array(NV), vRot = new Float32Array(NV), vSx = new Float32Array(NV), vSz = new Float32Array(NV);
  const vK = new Float32Array(NV), vCrece = new Float32Array(NV), vEdad = new Float32Array(NV), vViva = new Uint8Array(NV), vVar = new Uint8Array(NV);
  const vR = new Float32Array(NV), vG = new Float32Array(NV), vB = new Float32Array(NV);
  const cero = new THREE.Matrix4().makeScale(0, 0, 0); for (let i = 0; i < NV; i++) im.setMatrixAt(i, cero);
  const _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color(), _m4 = new THREE.Matrix4(), _Y = new THREE.Vector3(0, 1, 0), _l = {};

  // ---- cola para hornear (datos ya en coordenadas del tramo)
  const NQ = 256; let nq = 0;
  const qI = new Float32Array(NQ), qD = new Float32Array(NQ), qUi = new Float32Array(NQ), qUd = new Float32Array(NQ), qVi = new Float32Array(NQ), qVd = new Float32Array(NQ);
  const qR = new Float32Array(NQ), qG = new Float32Array(NQ), qB = new Float32Array(NQ), qVar = new Uint8Array(NQ);
  // escena del horno: los mismos quads, en el plano XY = (i, d), sin luz
  const geoH = new THREE.PlaneGeometry(1, 1);
  const extraH = new THREE.InstancedBufferAttribute(new Float32Array(NQ * 2), 2); extraH.setUsage(THREE.DynamicDrawUsage); geoH.setAttribute('aExtra', extraH);
  const matH = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }); // el paso (i, d) puede invertir la cara
  opacidad(matH, true);
  const imH = new THREE.InstancedMesh(geoH, matH, NQ); imH.setColorAt(0, new THREE.Color()); imH.frustumCulled = false;
  imH.instanceMatrix.setUsage(THREE.DynamicDrawUsage); imH.instanceColor.setUsage(THREE.DynamicDrawUsage);
  const horno = new THREE.Scene(); horno.add(imH);
  const camH = new THREE.OrthographicCamera(0, 1, D1, D0, -1, 1);
  const tramos = new Array(NTR).fill(null), marca = new Uint8Array(NTR), lista = new Int32Array(NTR);
  let resW = 512, resH = 1024, porLimpiar = false, maxT = 12, vista = 90, kc = 0, fc = 0, recicl = 0;
  const _cc = new THREE.Color();
  // material del tramo: la textura guarda color premultiplicado (así se mezclan bien las manchas); se des-premultiplica al leer
  function matTramo(rt) {
    const m = new THREE.MeshStandardMaterial({ map: rt.texture, transparent: true, depthWrite: false, roughness: 0.72, metalness: 0, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
    m.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', 'vec4 sdc = texture2D( map, vMapUv ); vec3 sc = sdc.rgb / max( sdc.a, 0.02 ); sc *= min( 1.0, 0.45 / max( max( sc.r, max( sc.g, sc.b ) ), 1e-4 ) ); diffuseColor *= vec4( sc, sdc.a );'); };
    m.customProgramCacheKey = () => 'sangreTramo';
    return m;
  }
  function geoTramo(k) {
    const i0 = k * TRAMO, i1 = Math.min(NM, i0 + TRAMO), nc = i1 - i0 + 1, pos = [], uv = [], idx = [];
    for (const [a, b] of NIVELES) {
      const y = piso((a + b) * 0.5) + 0.013, base = pos.length / 3;
      for (let c = 0; c < nc; c++) {
        const m = muestras[i0 + c];
        for (const d of [a, b]) { pos.push(m.p.x + m.n.x * d, y, m.p.z + m.n.z * d); uv.push(c / TRAMO, (d - D0) / (D1 - D0)); }
        if (c < nc - 1) { const v = base + c * 2; idx.push(v, v + 1, v + 2, v + 1, v + 3, v + 2); /* caras hacia arriba (si no, se ven de atrás y sin luz) */ }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(new Float32Array(pos.length).map((_, j) => (j % 3 === 1 ? 1 : 0)), 3));
    g.setIndex(idx); g.computeBoundingSphere(); return g;
  }
  function tramo(k, renderer) { // se crea la primera vez que le cae sangre; con el tope lleno se recicla el más lejano
    let t = tramos[k]; if (t) return t;
    let n = 0, lejos = null;
    for (const u of tramos) if (u) { n++; if (!lejos || Math.abs(u.k - kc) > Math.abs(lejos.k - kc)) lejos = u; }
    if (n >= maxT && lejos && Math.abs(lejos.k - kc) > Math.abs(k - kc)) {
      tramos[lejos.k] = null; t = lejos; t.k = k; t.mesh.geometry.dispose(); t.mesh.geometry = geoTramo(k); recicl++;
    } else if (n >= maxT + 4) return null; // todo lo guardado está más cerca que esta mancha: no se guarda
    else {
      const rt = new THREE.WebGLRenderTarget(resW, resH, { depthBuffer: false, stencilBuffer: false, generateMipmaps: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
      const mesh = new THREE.Mesh(geoTramo(k), matTramo(rt)); mesh.renderOrder = 1; scene.add(mesh);
      t = { rt, mesh, k };
    }
    tramos[k] = t; t.mesh.visible = Math.abs(k + 0.5 - fc) * TRAMO * ESP < vista + TRAMO * ESP;
    limpiarRT(renderer, t.rt);
    return t;
  }
  function limpiarRT(renderer, rt) {
    renderer.getClearColor(_cc); const a = renderer.getClearAlpha();
    renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.clear(true, false, false);
    renderer.setRenderTarget(null); renderer.setClearColor(_cc, a);
  }

  function aCola(x, z, rot, sx, sz, r, g, b, variante) {
    if (nq >= NQ) return; // nunca debería llenarse: se hornea en cada cuadro
    local(x, z, _l); const m = muestras[_l.i];
    const al = (x - m.p.x) * m.t.x + (z - m.p.z) * m.t.z;
    const q = nq++;
    qI[q] = _l.i + al / ESP; qD[q] = _l.d;
    // ejes del quad en el mundo (como el InstancedMesh: PlaneGeometry acostado y girado 'rot' en Y)
    const c = Math.cos(rot), s = Math.sin(rot);
    const ux = c * sx, uz = -s * sx, vx = -s * sz, vz = -c * sz;
    qUi[q] = (ux * m.t.x + uz * m.t.z) / ESP; qUd[q] = ux * m.n.x + uz * m.n.z;
    qVi[q] = (vx * m.t.x + vz * m.t.z) / ESP; qVd[q] = vx * m.n.x + vz * m.n.z;
    qR[q] = r; qG[q] = g; qB[q] = b; qVar[q] = variante;
  }
  function hornearSlot(i) {
    if (!vViva[i]) return;
    const k = vK[i]; aCola(vX[i], vZ[i], vRot[i], vSx[i] * k, vSz[i] * k, vR[i], vG[i], vB[i], vVar[i]);
    vViva[i] = 0; im.setMatrixAt(i, cero); sucio = true; horneadas++;
  }
  function escribir(i) {
    const k = vK[i];
    _q.setFromAxisAngle(_Y, vRot[i]); _m4.compose(_p.set(vX[i], vY[i], vZ[i]), _q, _s.set(vSx[i] * k, 1, vSz[i] * k));
    im.setMatrixAt(i, _m4); sucio = true;
  }
  function mancha(x, z, r, rz, rot, color, variante, crece) {
    local(x, z, _l); const d = _l.d; if (d < D0 || d > D1) return -1; // en el agua no queda
    for (const b of BORDES) { const e = Math.abs(d - b); if (e < r) { r = Math.max(0.1, e - 0.02); rz = Math.min(rz, r * 2.5); } }
    const i = iV; iV = (iV + 1) % NV;
    if (vViva[i]) hornearSlot(i); // el anillo da la vuelta: la vieja se hornea como esté
    vX[i] = x; vY[i] = piso(d) + 0.014; vZ[i] = z; vRot[i] = rot; vSx[i] = r * 2; vSz[i] = rz * 2;
    vK[i] = crece > 0 ? 0.15 : 1; vCrece[i] = crece; vEdad[i] = 0; vViva[i] = 1; vVar[i] = variante;
    _c.copy(color).multiplyScalar(0.62 + Math.random() * 0.12); vR[i] = _c.r; vG[i] = _c.g; vB[i] = _c.b;
    extra.array[i * 2] = 1; extra.array[i * 2 + 1] = variante; extra.needsUpdate = true;
    im.setColorAt(i, _c); im.instanceColor.needsUpdate = true;
    if (i + 1 > usados) { usados = i + 1; im.count = usados; } im.visible = true;
    escribir(i); total++;
    return i;
  }
  return {
    charco(x, z, r, color, crece = 0.35) { return mancha(x, z, r, r, Math.random() * 6.28, color, Math.random() < 0.5 ? 0 : 1, crece); },
    gota(x, z, r, color, rot = Math.random() * 6.28, arrastre = false) {
      return mancha(x, z, arrastre ? r * 0.55 : r, arrastre ? r * 1.4 : r, rot, color, arrastre ? 3 : 2, 0);
    },
    sim(dt) {
      _ac[0] += dt; if (_ac[0] < 1 / 30) return; const d = _ac[0]; _ac[0] = 0;
      for (let i = 0; i < usados; i++) {
        if (!vViva[i]) continue;
        vEdad[i] += d;
        if (vK[i] < 1) { vK[i] = Math.min(1, vK[i] + vCrece[i] * d * (1.4 - vK[i])); escribir(i); }
        if (vK[i] >= 1 && vEdad[i] > 0.05 || vEdad[i] > 12) hornearSlot(i); // terminó de crecer: al horno
      }
      if (sucio) { im.instanceMatrix.needsUpdate = true; sucio = false; }
      let vivas = 0; for (let i = 0; i < usados; i++) vivas += vViva[i]; im.visible = vivas > 0; // todas horneadas: el InstancedMesh no se dibuja
    },
    // una vez por cuadro, antes del render: pasa la cola a las texturas de los tramos
    hornear(renderer, cx, cz) {
      if (porLimpiar) { porLimpiar = false; for (const t of tramos) if (t) limpiarRT(renderer, t.rt); }
      if (cx !== undefined) { // solo se dibujan los tramos cerca de la cámara (más lejos la sangre no se distingue)
        local(cx, cz, _l); fc = _l.i / TRAMO; kc = Math.floor(fc); const lim = vista + TRAMO * ESP;
        for (let k = 0; k < NTR; k++) { const t = tramos[k]; if (t) t.mesh.visible = Math.abs(k + 0.5 - fc) * TRAMO * ESP < lim; }
      }
      if (!nq) return 0;
      let nt = 0;
      for (let q = 0; q < nq; q++) {
        _m4.set(qUi[q], qVi[q], 0, qI[q], qUd[q], qVd[q], 0, qD[q], 0, 0, 1, 0, 0, 0, 0, 1);
        imH.setMatrixAt(q, _m4); imH.setColorAt(q, _c.setRGB(qR[q], qG[q], qB[q]));
        extraH.array[q * 2] = 1; extraH.array[q * 2 + 1] = qVar[q];
        const ext = (Math.abs(qUi[q]) + Math.abs(qVi[q])) * 0.5 + 0.01;
        const k0 = Math.max(0, Math.floor((qI[q] - ext) / TRAMO)), k1 = Math.min(NTR - 1, Math.floor((qI[q] + ext) / TRAMO));
        for (let k = k0; k <= k1; k++) if (!marca[k]) { marca[k] = 1; lista[nt++] = k; }
      }
      imH.count = nq; imH.instanceMatrix.needsUpdate = true; imH.instanceColor.needsUpdate = true; extraH.needsUpdate = true;
      for (let j = 0; j < nt; j++) {
        const k = lista[j]; marca[k] = 0;
        const t = tramo(k, renderer); if (!t) continue;
        camH.left = k * TRAMO; camH.right = k * TRAMO + TRAMO; camH.updateProjectionMatrix();
        renderer.setRenderTarget(t.rt); renderer.render(horno, camH);
      }
      renderer.setRenderTarget(null);
      const n = nq; nq = 0; return n;
    },
    limpiar() {
      vViva.fill(0); for (let i = 0; i < NV; i++) im.setMatrixAt(i, cero); im.instanceMatrix.needsUpdate = true; usados = 0; im.count = 0; iV = 0;
      nq = 0; porLimpiar = true; total = 0; horneadas = 0;
    },
    config(c) { if (c.decal) { resW = c.decal[0]; resH = c.decal[1]; } if (c.tramos) maxT = c.tramos; if (c.vistaSangre) vista = c.vistaSangre; },
    get activas() { return total; },
    get frescas() { let n = 0; for (let i = 0; i < usados; i++) if (vViva[i]) n++; return n; },
    get horneadas() { return horneadas; },
    get tramos() { let n = 0; for (const t of tramos) if (t) n++; return n; },
    get _tramos() { return tramos; },
    get tramosVisibles() { let n = 0; for (const t of tramos) if (t && t.mesh.visible) n++; return n; },
    get reciclados() { return recicl; },
    // para las pruebas: píxeles con sangre en cada tramo [k, n, iMin, iMax, dMin, dMax]
    conteo(renderer) {
      const r = [];
      for (const t of tramos) { if (!t) continue; const w = t.rt.width, h = t.rt.height, b = new Uint8Array(w * h * 4); renderer.readRenderTargetPixels(t.rt, 0, 0, w, h, b);
        let n = 0, x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (b[(y * w + x) * 4 + 3] > 20) { n++; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
        r.push([t.k, n, +(t.k * TRAMO + x0 / w * TRAMO).toFixed(2), +(t.k * TRAMO + x1 / w * TRAMO).toFixed(2), +(D0 + y0 / h * (D1 - D0)).toFixed(2), +(D0 + y1 / h * (D1 - D0)).toFixed(2)]); }
      return r;
    },
    lugar(x, z) { local(x, z, _l); const m = muestras[_l.i], al = (x - m.p.x) * m.t.x + (z - m.p.z) * m.t.z; return [_l.i + al / ESP, _l.d]; },
    // para las pruebas: alfa (0-255) de la textura horneada en (x, z)
    muestra(x, z, renderer, buf) {
      local(x, z, _l); const m = muestras[_l.i], al = (x - m.p.x) * m.t.x + (z - m.p.z) * m.t.z, fi = _l.i + al / ESP, k = Math.floor(fi / TRAMO), t = tramos[k];
      if (!t) return 0;
      const u = (fi - k * TRAMO) / TRAMO, v = (_l.d - D0) / (D1 - D0);
      renderer.readRenderTargetPixels(t.rt, Math.min(resW - 1, Math.floor(u * t.rt.width)), Math.min(t.rt.height - 1, Math.floor(v * t.rt.height)), 1, 1, buf);
      return buf[3];
    },
    muestraRGBA(x, z, renderer, buf) { this.muestra(x, z, renderer, buf); return [buf[0], buf[1], buf[2], buf[3]]; }
  };
}
