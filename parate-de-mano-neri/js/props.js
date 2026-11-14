// Sprites de objetos (props rompibles, decorado y ítems del piso) con el mismo estilo: sombreado + contorno.
import { Buf, col, MAPA_OSC, MAPA_CLA, CONTORNO, rgba32, lienzo, textoCanvas } from './pixel.js';
const NEG = rgba32(CONTORNO);
function hacer(w, h, f, sombra = true) {
  const b = new Buf(w + 2, h + 2); f(b, (x) => x + 1); if (sombra) b.sombrear(MAPA_OSC, MAPA_CLA, 1); b.contorno(NEG);
  return { d: b.aCanvas(false), i: b.aCanvas(true), w: w + 2, h: h + 2 };
}
const c = col;
export const SP = {};
export function crearProps() {
  // contenedor verde de la IMM (≈1,8 m de ancho × 1,45 m de alto; escala 56 px/m)
  SP.contenedor = hacer(100, 82, (b) => {
    b.rect(3, 14, 94, 58, c('#3f7a45')); b.rect(0, 6, 100, 10, c('#2f5f36')); b.rect(1, 4, 98, 3, c('#4f8f55')); b.rect(2, 16, 96, 2, c('#2a5530'));
    for (let x = 10; x < 92; x += 10) b.rect(x, 22, 2, 44, c('#356a3b'));
    b.rect(3, 70, 94, 3, c('#2a5530'));
    b.rect(8, 72, 12, 10, c('#222')); b.disco(14, 77, 4, c('#1a1a1a')); b.rect(80, 72, 12, 10, c('#222')); b.disco(86, 77, 4, c('#1a1a1a')); // ruedas
    b.rect(-1, 30, 4, 8, c('#2a5530')); b.rect(97, 30, 4, 8, c('#2a5530')); // enganches
    b.rect(12, 28, 34, 18, c('#e9eef0')); const tc = c('#3f7a45'); // calcomanía IMM
    [[16, 31, 3, 12], [21, 31, 2, 12], [21, 31, 8, 2], [25, 31, 2, 12], [29, 31, 2, 12], [31, 31, 8, 2], [35, 31, 2, 12], [39, 31, 2, 12]].forEach(([x, y, w, h]) => b.rect(x, y, w, h, tc));
    b.rect(70, 26, 14, 22, c('#c8402e')); b.rect(72, 29, 10, 4, c('#f0f0f0')); b.rect(72, 37, 10, 4, c('#f0f0f0')); // reciclaje
    b.rect(54, 52, 30, 3, c('#c0c4c0')); // pedal
    b.rect(20, 0, 60, 6, c('#2f5f36')); b.rect(46, 2, 8, 3, c('#c8c8c8')); // tapa entreabierta
    b.poli([[22, 4], [30, 0], [34, 6]], c('#3a3a3a')); b.poli([[60, 5], [66, 1], [70, 6]], c('#c49a64')); // bolsas asomando
  });
  // moto chica (≈1,9 m × 1,1 m)
  SP.moto = hacer(106, 60, (b) => {
    b.disco(18, 44, 15, c('#1a1a1a')); b.disco(18, 44, 9, c('#5a5a62')); b.disco(18, 44, 6, c('#9a9aa0')); b.disco(18, 44, 2, c('#3a3a40'));
    b.disco(86, 44, 15, c('#1a1a1a')); b.disco(86, 44, 9, c('#5a5a62')); b.disco(86, 44, 6, c('#9a9aa0')); b.disco(86, 44, 2, c('#3a3a40'));
    b.poli([[6, 30], [16, 24], [30, 26], [26, 32]], c('#b8232a')); // guardabarros trasero
    b.poli([[28, 28], [70, 22], [80, 36], [34, 42]], c('#b8232a')); b.poli([[34, 30], [66, 25], [70, 30], [36, 34]], c('#d84a4a'));
    b.rect(30, 18, 34, 9, c('#1e1e1e')); b.rect(32, 18, 30, 2, c('#3a3a3a')); // asiento
    b.rect(44, 36, 22, 10, c('#6a6a70')); b.rect(46, 38, 18, 2, c('#9a9aa0')); // motor
    b.seg(30, 44, 6, 42, 3, 3, c('#c0c0c8')); // escape
    b.seg(76, 10, 90, 44, 3, 3, c('#9a9aa0')); // horquilla
    b.rect(68, 6, 18, 4, c('#333')); b.rect(84, 8, 8, 8, c('#e8e0b0')); b.rect(85, 9, 3, 3, c('#fffef0')); // manubrio y farol
    b.poli([[78, 30], [90, 26], [98, 32], [88, 34]], c('#b8232a')); // guardabarros delantero
    b.rect(4, 30, 6, 4, c('#d84a2a')); // luz trasera
  });
  // perro callejero mediano (≈0,8 m de largo, 0,55 m de alto)
  SP.perro = [0, 1, 2].map((f) => hacer(46, 32, (b) => {
    const pl = f === 1 ? 2 : 0, mor = f === 2;
    b.seg(8, 14, 2, 4 + pl * 2, 3, 2, c('#b98a52')); // cola
    b.elipse(21, 15, 14, 7, c('#b98a52')); b.elipse(22, 18, 11, 4, c('#d8b07a')); // cuerpo y panza
    b.rect(9 + pl, 18, 4, 13, c('#a77a46')); b.rect(15 - pl, 18, 4, 13, c('#b98a52')); b.rect(27 - pl, 18, 4, 13, c('#a77a46')); b.rect(32 + pl, 18, 4, 13, c('#b98a52'));
    for (const xx of [9 + pl, 15 - pl, 27 - pl, 32 + pl]) b.rect(xx, 29, 5, 2, c('#8a6036'));
    b.elipse(37, 7, 6, 5.5, c('#b98a52')); b.rect(40, 7, 6, 5, c('#c99a62')); b.rect(44, 6, 2, 2, c('#222')); // cabeza y hocico
    b.poli([[32, 3], [34, -3], [37, 2]], c('#8a6036')); b.poli([[36, 2], [39, -2], [40, 3]], c('#8a6036')); b.px(39, 5, c('#111')); b.px(40, 5, c('#111'));
    b.rect(30, 10, 4, 6, c('#c8402e')); b.px(31, 15, c('#e8c040')); // collar
    if (mor) { b.rect(41, 11, 5, 3, c('#b03030')); b.rect(42, 11, 3, 1, c('#f2f2f2')); }
  }));
  SP.carton = hacer(40, 16, (b) => { for (let i = 0; i < 4; i++) b.poli([[2 + i, 13 - i * 3], [36 - i, 12 - i * 3], [38 - i, 15 - i * 3], [0 + i, 16 - i * 3]], c(i % 2 ? '#c49a64' : '#b88a56')); });
  SP.pelota = [0, 1].map((f) => hacer(10, 10, (b) => { b.disco(5, 5, 4.5, c('#f2f2f2')); b.px(5, 5, c('#222')); b.px(4, 5, c('#222')); b.px(5, 4, c('#222')); b.px(f ? 2 : 7, f ? 7 : 2, c('#222')); b.px(f ? 7 : 2, 7, c('#222')); }));
  // rompibles
  SP.cajon = hacer(30, 22, (b) => {
    b.rect(0, 6, 30, 16, c('#b52a2a')); b.rect(2, 9, 26, 3, c('#7a1818'));
    for (let i = 0; i < 6; i++) { b.rect(2 + i * 5, 0, 3, 8, c('#2f5a2a')); b.rect(2 + i * 5, -1, 3, 2, c('#d8b040')); }
    b.rect(5, 14, 20, 5, c('#f0e6d0'));
  });
  SP.cajonRoto = hacer(30, 10, (b) => { b.rect(0, 4, 12, 6, c('#b52a2a')); b.rect(16, 2, 14, 8, c('#9a2222')); });
  SP.cajaBiz = hacer(30, 20, (b) => {
    b.rect(0, 6, 30, 14, c('#c8955a')); b.poli([[0, 6], [6, 0], [12, 6]], c('#d8a86a')); b.poli([[18, 6], [24, 0], [30, 6]], c('#d8a86a'));
    for (let i = 0; i < 5; i++) b.disco(5 + i * 5, 5, 2.4, c('#e8a640'));
    b.rect(4, 11, 22, 5, c('#f2ead8'));
  });
  // tacho de chapa (≈0,85 m)
  SP.tacho = hacer(30, 48, (b) => { b.rect(2, 7, 26, 41, c('#5d6670')); b.rect(0, 4, 30, 5, c('#7d8690')); b.rect(1, 3, 28, 1, c('#9aa2ac')); for (let x = 6; x < 26; x += 5) b.rect(x, 12, 2, 32, c('#4a525a')); b.rect(2, 22, 26, 2, c('#7d8690')); b.rect(2, 36, 26, 2, c('#7d8690')); b.rect(11, 0, 8, 3, c('#7d8690')); b.rect(12, 0, 6, 1, c('#9aa2ac')); });
  SP.tachoRoto = hacer(36, 16, (b) => { b.poli([[0, 4], [28, 0], [36, 12], [4, 16]], c('#5d6670')); b.rect(8, 6, 18, 2, c('#4a525a')); b.poli([[24, 12], [32, 10], [34, 16], [26, 16]], c('#7d8690')); });
  // ítems
  SP.palo = hacer(48, 4, (b) => { b.rect(0, 1, 48, 3, c('#9a6a3a')); b.rect(0, 1, 9, 3, c('#6a4424')); b.px(20, 1, c('#7a5028')); b.px(33, 2, c('#7a5028')); b.rect(46, 1, 2, 3, c('#c8a070')); }); // palo de ≈0,85 m (alcance 46 coincide)
  SP.botella = hacer(8, 20, (b) => { b.rect(1, 7, 6, 13, c('#2f7a35')); b.rect(2, 2, 4, 6, c('#2f7a35')); b.rect(2, 0, 4, 2, c('#d8b040')); b.rect(1, 11, 6, 5, c('#f0e6d0')); });
  SP.garrafa = hacer(20, 32, (b) => { b.rect(1, 9, 18, 21, c('#d02a2a')); b.elipse(10, 9, 9, 4, c('#d02a2a')); b.rect(6, 0, 8, 2, c('#888')); b.rect(4, 2, 2, 5, c('#888')); b.rect(14, 2, 2, 5, c('#888')); b.rect(8, 3, 4, 3, c('#c8a040')); b.rect(3, 16, 14, 4, c('#f2f2f2')); b.rect(1, 29, 18, 3, c('#7a1818')); b.rect(3, 12, 2, 14, c('#e84a4a')); }); // garrafa de supergás (≈0,57 m)
  SP.termo = hacer(9, 24, (b) => { b.rect(1, 4, 7, 20, c('#c0c4cc')); b.rect(2, 0, 5, 5, c('#2a2a30')); b.rect(1, 9, 7, 2, c('#6a7080')); b.rect(1, 18, 7, 2, c('#6a7080')); });
  SP.bizcochos = hacer(18, 10, (b) => { b.elipse(9, 7, 9, 3, c('#f2f2ea')); b.disco(5, 4, 3, c('#e2a040')); b.disco(10, 3, 3, c('#d89838')); b.disco(14, 5, 3, c('#e8b050')); b.px(9, 2, c('#f8e0a0')); });
  SP.chivito = hacer(22, 12, (b) => { b.elipse(11, 9, 11, 3, c('#f2f2ea')); b.elipse(11, 5, 9, 3, c('#d8a050')); b.rect(3, 6, 16, 2, c('#5aa83a')); b.rect(4, 7, 14, 1, c('#e0503a')); b.rect(3, 4, 16, 1, c('#f4e070')); b.elipse(11, 3, 8, 2, c('#e8b060')); });
  SP.mate = hacer(12, 16, (b) => { b.elipse(6, 11, 5, 5, c('#7a4a2a')); b.rect(2, 5, 8, 3, c('#c8a040')); b.rect(3, 6, 6, 1, c('#4f8f35')); b.seg(7, 6, 10, 0, 1.4, 1.4, c('#c8c8d0')); });
  SP.billete = hacer(14, 8, (b) => { b.rect(0, 0, 14, 8, c('#c96aa0')); b.rect(2, 2, 4, 4, c('#e8a8c8')); b.rect(8, 2, 4, 1, c('#8a3a6a')); b.rect(8, 5, 4, 1, c('#8a3a6a')); });
  SP.cartelPaso = null;
}

// Silueta de sombra elíptica cacheada
const somb = new Map();
export function sombra(w) {
  w = Math.max(6, Math.round(w / 2) * 2); let s = somb.get(w); if (s) return s;
  const h = Math.max(3, Math.round(w / 4)); const [cv, x] = lienzo(w, h);
  x.fillStyle = 'rgba(30,14,40,0.45)';
  for (let j = 0; j < h; j++) { const t = (j + 0.5) / h * 2 - 1; const ww = Math.round(w * Math.sqrt(1 - t * t)); x.fillRect((w - ww) >> 1, j, ww, 1); }
  somb.set(w, cv); return cv;
}
export { textoCanvas };
