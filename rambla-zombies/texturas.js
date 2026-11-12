// Texturas procedurales de la rambla (se dibujan una vez al cargar, en canvas): asfalto con grietas, baldosas,
// muro de piedra, arena y fachadas de edificios con balcones. Todas son tileables y claras: el color del material las tiñe.
import * as THREE from 'https://esm.sh/three@0.160.0';

const lienzo = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
function aTex(c, aniso = 4) { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; return t; }
const gris = (v, a = 1) => `rgba(${v | 0},${v | 0},${v | 0},${a})`;
function ruido(g, w, h, n, v0, v1, a) { for (let i = 0; i < n; i++) { g.fillStyle = gris(v0 + Math.random() * (v1 - v0), a * (0.4 + Math.random() * 0.6)); g.fillRect(Math.random() * w, Math.random() * h, 1 + (Math.random() < 0.15), 1); } }

export function texAsfalto() {
  const [c, g] = lienzo(256, 256);
  g.fillStyle = gris(205); g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 14; i++) { g.fillStyle = gris(185 + Math.random() * 40, 0.35); g.fillRect(Math.random() * 256, Math.random() * 256, 30 + Math.random() * 90, 20 + Math.random() * 70); } // parches
  ruido(g, 256, 256, 6500, 120, 255, 0.5);
  for (let i = 0; i < 8; i++) { // grietas: caminatas al azar
    let x = Math.random() * 256, y = Math.random() * 256, a = Math.random() * 6.3; g.strokeStyle = gris(60, 0.5); g.lineWidth = 0.8 + Math.random() * 0.8; g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 22; k++) { a += (Math.random() - 0.5) * 1.1; x += Math.cos(a) * (4 + Math.random() * 6); y += Math.sin(a) * (4 + Math.random() * 6); g.lineTo(x, y); } g.stroke();
  }
  for (let i = 0; i < 5; i++) { const x = Math.random() * 256, y = Math.random() * 256, r = 8 + Math.random() * 22, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, gris(70, 0.45)); gr.addColorStop(1, gris(70, 0)); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); } // manchas de aceite
  return aTex(c);
}
export function texBaldosa() { // baldosas de vereda de 1 m: junta oscura, cada una con su tono
  const [c, g] = lienzo(256, 256);
  for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { g.fillStyle = gris(205 + Math.random() * 40); g.fillRect(i * 64, j * 64, 64, 64); }
  ruido(g, 256, 256, 5000, 140, 255, 0.4);
  g.strokeStyle = gris(95, 0.9); g.lineWidth = 2; for (let k = 0; k <= 4; k++) { g.beginPath(); g.moveTo(k * 64, 0); g.lineTo(k * 64, 256); g.stroke(); g.beginPath(); g.moveTo(0, k * 64); g.lineTo(256, k * 64); g.stroke(); }
  for (let i = 0; i < 4; i++) { g.strokeStyle = gris(70, 0.4); g.lineWidth = 1; let x = Math.random() * 256, y = Math.random() * 256; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (Math.random() - 0.5) * 22; y += (Math.random() - 0.5) * 22; g.lineTo(x, y); } g.stroke(); }
  return aTex(c);
}
export function texPiedra() { // muro de bloques de piedra, hiladas desfasadas (tile de 4 m × 2 m)
  const [c, g] = lienzo(512, 256);
  for (let r = 0; r < 4; r++) { const off = (r % 2) * 64; for (let x = -64; x < 512; x += 128) { g.fillStyle = gris(190 + Math.random() * 55); g.fillRect(x + off, r * 64, 128, 64); } }
  ruido(g, 512, 256, 9000, 110, 255, 0.45);
  g.strokeStyle = gris(80, 0.95); g.lineWidth = 3;
  for (let r = 0; r <= 4; r++) { g.beginPath(); g.moveTo(0, r * 64); g.lineTo(512, r * 64); g.stroke(); }
  for (let r = 0; r < 4; r++) { const off = (r % 2) * 64; for (let x = off; x < 512 + 128; x += 128) { g.beginPath(); g.moveTo(x % 512, r * 64); g.lineTo(x % 512, r * 64 + 64); g.stroke(); } }
  for (let i = 0; i < 40; i++) { g.fillStyle = gris(60, 0.3); g.fillRect(Math.random() * 512, Math.random() * 256, 2 + Math.random() * 10, 1 + Math.random() * 3); } // musgo y manchas de humedad
  return aTex(c);
}
export function texArena() {
  const [c, g] = lienzo(256, 256);
  g.fillStyle = gris(225); g.fillRect(0, 0, 256, 256);
  ruido(g, 256, 256, 9000, 170, 255, 0.5);
  for (let i = 0; i < 10; i++) { g.strokeStyle = gris(170, 0.25); g.lineWidth = 2; g.beginPath(); const y = Math.random() * 256; g.moveTo(0, y); g.bezierCurveTo(80, y + (Math.random() - 0.5) * 30, 170, y + (Math.random() - 0.5) * 30, 256, y + (Math.random() - 0.5) * 20); g.stroke(); } // ondas de viento
  for (let i = 0; i < 30; i++) { g.fillStyle = gris(90 + Math.random() * 120, 0.5); g.fillRect(Math.random() * 256, Math.random() * 256, 2, 1.5); } // conchillas y piedritas
  return aTex(c);
}

// fachada de edificio de departamentos: 4 ventanas de ancho × 8 pisos (celda de 64 px). Devuelve el color y la luz por separado,
// así las ventanas encendidas brillan de noche y las demás quedan apagadas. La esquina superior izquierda (8×8 px) queda lisa y sin luz: sirve para los techos.
const LUCES = ['#ffd27a', '#ffe6a8', '#ffc060', '#bfe0ff', '#ff9a50', '#fff0c8', '#8ac0ff'];
export function texFachada(prob = 0.38) {
  const [c, g] = lienzo(256, 512), [e, ge] = lienzo(256, 512);
  g.fillStyle = '#d8d2c6'; g.fillRect(0, 0, 256, 512); ge.fillStyle = '#000'; ge.fillRect(0, 0, 256, 512);
  for (let x = 0; x < 256; x += 3) { g.fillStyle = gris(150 + Math.random() * 60, 0.10); g.fillRect(x, 0, 1 + Math.random() * 3, 512); } // chorreaduras de lluvia
  ruido(g, 256, 512, 5000, 120, 240, 0.25);
  for (let fila = 0; fila < 8; fila++) for (let col = 0; col < 4; col++) {
    const x0 = col * 64, y0 = fila * 64; if (fila === 0 && col === 0) { g.fillStyle = '#d8d2c6'; g.fillRect(0, 0, 10, 10); }
    const wx = x0 + 14, wy = y0 + 14, ww = 36, wh = 30;
    g.fillStyle = gris(55); g.fillRect(wx - 3, wy - 3, ww + 6, wh + 6); // marco
    g.fillStyle = '#141c28'; g.fillRect(wx, wy, ww, wh);
    g.fillStyle = 'rgba(120,150,190,0.18)'; g.beginPath(); g.moveTo(wx, wy + wh); g.lineTo(wx + ww * 0.55, wy); g.lineTo(wx + ww * 0.8, wy); g.lineTo(wx + ww * 0.25, wy + wh); g.fill(); // reflejo
    g.fillStyle = gris(70); g.fillRect(wx + ww / 2 - 1, wy, 2, wh); // travesaño
    g.fillStyle = gris(150, 0.9); g.fillRect(x0 + 6, y0 + 52, 52, 4); // losa del balcón
    if (Math.random() < 0.55) { g.fillStyle = gris(60, 0.85); for (let b = 0; b < 8; b++) g.fillRect(x0 + 8 + b * 6.4, y0 + 46, 1.4, 7); g.fillRect(x0 + 6, y0 + 45, 52, 1.5); } // baranda
    if (Math.random() < 0.18) { g.fillStyle = gris(215); g.fillRect(x0 + 40, y0 + 40, 14, 9); g.fillStyle = gris(120); g.fillRect(x0 + 42, y0 + 43, 10, 4); } // aire acondicionado
    if (Math.random() < 0.12) { g.fillStyle = ['#a03030', '#2a5aa0', '#d8c040'][Math.random() * 3 | 0]; g.fillRect(x0 + 8, y0 + 41, 9, 4); } // ropa tendida
    if (Math.random() < prob) {
      const col1 = LUCES[Math.random() * LUCES.length | 0]; ge.fillStyle = col1; ge.globalAlpha = 0.55 + Math.random() * 0.45; ge.fillRect(wx, wy, ww, wh);
      if (Math.random() < 0.45) { ge.globalAlpha = 0.9; ge.fillStyle = '#000'; ge.fillRect(wx, wy, ww * (0.18 + Math.random() * 0.2), wh); } // cortina corrida
      ge.globalAlpha = 1;
    }
  }
  const t = aTex(c), te = aTex(e); te.colorSpace = THREE.SRGBColorSpace; return { mapa: t, emisivo: te };
}
