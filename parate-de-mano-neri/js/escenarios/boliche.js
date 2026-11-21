// Nivel 5 — "El Boliche del Gallego" (interior): almacén de barrio adelante (estanterías con yerba, Colet, fiambre,
// "HOY NO SE FÍA"), el bar con el mostrador largo, la tele con el clásico, botellas y el salón del fondo (sede del club),
// que es la arena del Gallego. Piso de damero gastado, ventiladores de techo y lamparitas colgando.
import { rng, tono } from '../pixel.js';
import { herramientas, alto, Y0 } from './pincel.js';

export function pintarBoliche(x, L, luces) {
  const r = rng(131); const H = herramientas(x, r); const { R, O, T, chico, cartel, afiche, V } = H;
  // techo y paredes
  R(0, -40, L, 30, '#2a1e1c'); for (let xx = 0; xx < L; xx += 64) R(xx, -40, 2, 30, '#3a2a26'); R(0, -10, L, 3, '#5a4030'); R(0, -7, L, 1, '#1b1220');
  const tramos = [[0, 980, '#c8b878'], [980, 1220, '#8a9a6a'], [2200, L - 2200, '#7a5a4a']]; // almacén (crema), bar (verde gastado), salón (bordó)
  for (const [a, w, c] of tramos) { R(a, -6, w, 128, c); for (let i = 0; i < w / 40; i++) { const fx = a + r() * w, fy = r() * 100; R(fx, fy, 2 + r() * 10, 1 + r() * 3, tono(c, 0.88)); } for (let xx = a; xx < a + w; xx += 2) if (r() < 0.5) R(xx, 112 + r() * 8, 1, 10, tono(c, 0.9)); }
  // zócalo de madera (friso) y moldura
  R(0, 122, L, 46, '#6a4028'); for (let xx = 0; xx < L; xx += 22) { R(xx, 124, 1, 44, '#4a2a18'); R(xx + 2, 126, 18, 2, '#7a5034'); } R(0, 120, L, 3, '#8a5a3a'); R(0, 166, L, 2, '#3a2214');
  // piso de damero (baldosas blancas y negras gastadas) + borde contra la pared
  R(0, 168, L, 102, '#d8d0c0');
  for (let yy = 168, k = 0; yy < 270; yy += 12, k++) for (let xx = (k % 2) * 12; xx < L; xx += 24) { R(xx, yy, 12, 12, '#3e3844'); R(xx, yy, 12, 1, '#4a4450'); }
  for (let i = 0; i < L / 5; i++) { const fx = r() * L, fy = 170 + r() * 98; R(fx, fy, 1 + r() * 3, 1, r() < 0.5 ? 'rgba(120,100,80,0.35)' : 'rgba(255,255,255,0.18)'); }
  for (let i = 0; i < L / 70; i++) { const fx = r() * L, fy = 176 + r() * 90; R(fx, fy, 6 + r() * 14, 2 + r() * 3, 'rgba(90,60,30,0.22)'); } // manchas de vino y grasa
  R(0, 168, L, 2, '#1b1220');
  // ventiladores de techo y lamparitas
  for (let px = 160; px < L; px += 420) { R(px, -7, 2, 14, '#3a3a40'); O(px - 5, 6, 12, 5, '#4a4a52'); R(px - 26, 8, 22, 2, '#5a4a3a'); R(px + 6, 8, 22, 2, '#5a4a3a'); }
  for (let px = 360; px < L; px += 420) { R(px, -7, 1, 22, '#1b1220'); O(px - 3, 15, 7, 7, '#fff0b0'); luces.push([px, 20, 60, '#ffd890', 0.45]); }

  // ---------------- ALMACÉN (0..980)
  { // estanterías de pared con yerba, latas, Colet, fideos, vino en damajuana
    for (let s = 0; s < 4; s++) { const y = -2 + s * 28; R(30, y + 24, 640, 3, '#5a3a22'); R(30, y + 27, 640, 1, '#2a1a10');
      for (let i = 0; i < 40; i++) { const px = 34 + i * 16; const k = (i * 5 + s * 3) % 7;
        if (k === 0 || k === 3) { O(px, y + 6, 12, 18, '#f2f2ea'); R(px + 1, y + 7, 10, 5, '#2a8a3a'); R(px + 1, y + 18, 10, 5, '#2a8a3a'); R(px + 3, y + 13, 6, 4, '#e8c020'); } // paquete de yerba
        else if (k === 1) { O(px, y + 10, 10, 14, '#8a5a2a'); R(px + 1, y + 13, 8, 4, '#f2e2b0'); chico('COLET', px + 5, y + 14, '#8a3a10', 'centro'); } // chocolatada
        else if (k === 2) { O(px + 1, y + 12, 9, 12, '#c8202a'); R(px + 2, y + 15, 7, 4, '#f2f2ea'); } // lata de tomate
        else if (k === 4) { O(px, y + 4, 12, 20, '#3a6a2a'); R(px + 4, y + 1, 4, 4, '#2a4a1a'); R(px + 1, y + 12, 10, 6, '#e8e0c8'); } // damajuana
        else if (k === 5) { O(px, y + 14, 14, 10, '#e8c020'); R(px + 2, y + 17, 10, 3, '#c8202a'); } // fideos
        else { O(px + 1, y + 8, 10, 16, '#2a5ac8'); R(px + 2, y + 12, 8, 3, '#f2f2ea'); } // detergente
      } }
    cartel(80, -34, 220, 18, '#c8202a', 'ALMACÉN LA ESQUINA', '#ffd23a');
    afiche(330, -36, 'HOY NO SE FÍA, MAÑANA SÍ', '#f2f2e8'); afiche(470, -34, 'FIADO NO', '#f0d040', 'NI A TU MADRE');
    // mostrador del almacén con balanza, frasco de caramelos y fiambre
    O(80, 116, 520, 52, '#9a6a3a'); R(80, 116, 520, 6, '#c8905a'); for (let xx = 90; xx < 600; xx += 40) R(xx, 124, 1, 42, '#6a4a2a');
    O(140, 96, 34, 20, '#d8d8e0'); R(146, 92, 22, 4, '#a8a8b0'); O(150, 100, 14, 8, '#2a2a30'); chico('0,500', 157, 102, '#7aff7a', 'centro'); // balanza
    O(220, 98, 16, 18, '#c8e8f0'); for (let k = 0; k < 8; k++) R(222 + (k % 3) * 4, 104 + Math.floor(k / 3) * 4, 3, 3, ['#e04a8a', '#f0d040', '#4ad0e0'][k % 3]); // caramelos
    O(300, 100, 60, 16, '#e8b0a0'); R(302, 104, 56, 4, '#c87a6a'); chico('MORTADELA $U 89', 330, 90, '#1b1220', 'centro'); // fiambre
    O(420, 90, 30, 26, '#e8e0d0'); R(424, 94, 22, 8, '#2a8a3a'); chico('YERBA', 435, 104, '#1b1220', 'centro');
    cartel(620, 30, 120, 16, '#2a5aa0', 'HELADOS', '#ffffff'); O(640, 100, 90, 68, '#e8e8f0'); R(644, 104, 82, 30, '#9ad4ff'); for (let k = 0; k < 6; k++) R(648 + k * 13, 110, 10, 6, ['#f0d040', '#e04a8a', '#7aff7a'][k % 3]);
    // ventana a la calle (de noche) con un ómnibus que pasa: ómnibus urbano de colores propios del juego
    { const vx = 780, vt = 6, vw = 170, vh = 96; O(vx - 4, vt - 4, vw + 8, vh + 8, '#5a3a22'); R(vx, vt, vw, vh, '#14182e'); for (let k = 0; k < 14; k++) R(vx + r() * vw, vt + r() * 30, 1, 1, '#8a90b8');
      O(vx + 10, vt + 40, 150, 46, '#e8e0c8'); R(vx + 11, vt + 41, 148, 8, '#c8202a'); for (let k = 0; k < 5; k++) O(vx + 16 + k * 28, vt + 52, 22, 16, '#3a4a6a'); R(vx + 11, vt + 72, 148, 3, '#2a5aa0');
      O(vx + 120, vt + 30, 36, 10, '#1b1220'); chico('121 CERRO', vx + 138, vt + 33, '#ffd23a', 'centro'); for (const wx of [vx + 36, vx + 128]) { x.fillStyle = '#1b1220'; x.beginPath(); x.arc(wx, vt + 86, 7, 0, 7); x.fill(); }
      R(vx + vw / 2 - 1, vt, 2, vh, '#5a3a22'); R(vx, vt + vh / 2 - 1, vw, 2, '#5a3a22'); luces.push([vx + 140, vt + 70, 30, '#ffe0a0', 0.3]); }
  }
  // ---------------- BAR (980..2200)
  { const bx = 1000, bw = 1100;
    // estantes con botellas detrás de la barra y espejo
    O(bx + 40, -2, bw - 80, 90, '#3a4a4a'); R(bx + 44, 2, bw - 88, 82, '#5a6a6a'); for (let k = 0; k < 30; k++) R(bx + 50 + r() * (bw - 100), 4 + r() * 70, 2, 8 + r() * 10, 'rgba(255,255,255,0.08)');
    for (let s = 0; s < 3; s++) { const y = 8 + s * 26; R(bx + 44, y + 20, bw - 88, 3, '#6a4028');
      for (let i = 0; i < (bw - 100) / 12; i++) { const px = bx + 52 + i * 12; const c = ['#2f7a35', '#d89020', '#7a2a2a', '#c8c8b0', '#3a2a1a', '#e8c020'][(i * 7 + s) % 6]; R(px + 3, y + 2, 3, 5, c); R(px + 1, y + 7, 7, 13, c); R(px + 2, y + 10, 5, 4, '#f2f2ea'); R(px + 6, y + 8, 1, 10, 'rgba(255,255,255,0.3)'); } }
    cartel(bx + 300, -36, 280, 20, '#1b1220', 'BAR "EL GALLEGO"', '#ff6a3a'); luces.push([bx + 440, -26, 90, '#ff6a3a', 0.4]);
    // tele con el clásico
    O(bx + 70, -30, 70, 44, '#2a2a30'); R(bx + 74, -26, 62, 34, '#3a8a3a'); R(bx + 104, -26, 1, 34, '#e8f0e0'); R(bx + 80, -24, 22, 5, '#1b1220'); chico('URU 1-0 ARG', bx + 91, -23, '#ffffff', 'centro'); luces.push([bx + 105, -10, 40, '#9adfff', 0.3]);
    afiche(bx + 700, -34, 'PROHIBIDO ESCUPIR', '#f2f2e8', 'Y CANTAR TANGO'); afiche(bx + 850, -36, 'GRAPPAMIEL $U 120', '#f0d040');
    afiche(bx + 160, -30, 'SE VENDE TERMO', '#f2f2e8', 'PREGUNTAR AL GALLEGO');
    // la barra: madera con zócalo de chapa, canillas de cerveza y banquetas
    O(bx, 104, bw, 64, '#7a4a2a'); R(bx, 104, bw, 8, '#b07a4a'); R(bx, 112, bw, 2, '#4a2a18'); for (let xx = bx + 20; xx < bx + bw; xx += 60) { R(xx, 116, 2, 40, '#5a3420'); } R(bx, 156, bw, 12, '#9a9aa2'); R(bx, 156, bw, 1, '#d8d8e0');
    for (const tx of [bx + 200, bx + 520, bx + 860]) { O(tx, 82, 8, 22, '#c8c8d0'); O(tx - 6, 80, 20, 6, '#e8c020'); R(tx + 2, 90, 4, 10, '#8a8a92'); }
    for (let k = 0; k < 9; k++) { const sx = bx + 60 + k * 120; O(sx, 132, 26, 6, '#c8202a'); R(sx + 11, 138, 4, 30, '#5a5a62'); }
    for (let k = 0; k < 12; k++) { const gx = bx + 90 + r() * (bw - 180); O(gx, 96, 6, 8, '#f0e0a0'); R(gx + 1, 96, 4, 2, '#fff8e8'); } // vasos de cerveza
    for (let k = 0; k < 4; k++) luces.push([bx + 140 + k * 260, 60, 70, '#ffc070', 0.35]);
  }
  // ---------------- SALÓN DEL CLUB (2200..L): arena del Gallego
  { const sx = 2240;
    cartel(sx + 120, -36, 340, 20, '#c8202a', 'CLUB SOCIAL Y DEPORTIVO LOS GALLEGOS', '#ffffff');
    // vitrina de trofeos, banderines del club, rocola con luces y escenario chico para la orquesta
    O(sx + 40, 10, 120, 104, '#5a3a22'); R(sx + 46, 16, 108, 92, '#3a4a5a'); for (let s = 0; s < 3; s++) { R(sx + 46, 44 + s * 30, 108, 2, '#8a6a3a'); for (let k = 0; k < 5; k++) { const tx = sx + 54 + k * 20; R(tx + 3, 28 + s * 30, 6, 6, '#e8c020'); R(tx + 5, 34 + s * 30, 2, 6, '#c89020'); R(tx + 2, 40 + s * 30, 8, 3, '#8a6a3a'); } }
    for (let k = 0; k < 12; k++) { const bx2 = sx + 200 + k * 40; x.fillStyle = k % 2 ? '#c8202a' : '#2a5aa0'; x.beginPath(); x.moveTo(bx2, 4); x.lineTo(bx2 + 24, 4); x.lineTo(bx2 + 12, 22); x.fill(); } R(sx + 196, 2, 490, 2, '#1b1220');
    { const rx = sx + 520; O(rx, 40, 56, 128, '#c8202a'); R(rx + 4, 44, 48, 40, '#ffd23a'); x.fillStyle = '#ff6aff'; x.fillRect(rx + 6, 46, 44, 2); O(rx + 10, 90, 36, 30, '#1b1220'); for (let k = 0; k < 4; k++) R(rx + 14 + k * 8, 96, 4, 18, ['#ffd23a', '#4ad0e0', '#ff6aff', '#7aff7a'][k]); chico('ROCOLA', rx + 28, 126, '#ffffff', 'centro'); luces.push([rx + 28, 70, 70, '#ff6aff', 0.45]); }
    O(sx + 640, 70, 260, 98, '#4a2a3a'); R(sx + 640, 70, 260, 6, '#7a4a5a'); for (let k = 0; k < 6; k++) R(sx + 650 + k * 44, 76, 36, 92, k % 2 ? '#6a1a2a' : '#8a2a3a'); // telón del escenario
    T('ORQUESTA TÍPICA', sx + 770, 90, '#ffd23a', 1, 'centro'); chico('SÁBADOS · ENTRADA LIBRE · MAYORES DE 18', sx + 770, 104, '#f2f2e8', 'centro');
    afiche(sx + 220, 60, 'CUOTA SOCIAL $U 300', '#f2f2e8', 'AL DÍA O AFUERA'); afiche(sx + 380, 70, 'BAILE DE LOS JUBILADOS', '#f0d040');
    for (let k = 0; k < 3; k++) luces.push([sx + 160 + k * 300, 30, 80, '#ffd890', 0.4]);
  }
  // puerta del fondo (salida)
  { const px = L - 120; O(px, 14, 70, 154, '#5a3a22'); R(px + 6, 20, 58, 60, '#3a4a5a'); R(px + 50, 96, 6, 4, '#e8c020'); cartel(px - 6, -2, 82, 12, '#2a8a3a', 'SALIDA', '#ffffff'); luces.push([px + 35, 4, 30, '#7aff7a', 0.35]); }
  void V; void alto; void Y0;
}
