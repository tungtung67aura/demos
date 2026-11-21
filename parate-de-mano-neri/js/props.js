// Sprites de objetos (props rompibles, decorado y ítems del piso) con el mismo estilo: sombreado + contorno.
import { Buf, col, MAPA_OSC, MAPA_CLA, CONTORNO, rgba32, lienzo, textoCanvas } from './pixel.js';
const NEG = rgba32(CONTORNO);
export function hacer(w, h, f, sombra = true) {
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
  SP.faca = hacer(18, 5, (b) => { // faca criolla: mango de madera con virola, hoja con filo brillante y punta
    b.rect(0, 1, 6, 3, c('#5a3a24')); b.rect(1, 1, 4, 1, c('#7a5232')); b.rect(6, 0, 1, 5, c('#8a8a92')); b.rect(7, 1, 9, 3, c('#b8bec8')); b.rect(7, 1, 9, 1, c('#eef2f8')); b.rect(16, 2, 2, 1, c('#d8dde6')); b.px(17, 1, c('#eef2f8')); b.rect(8, 3, 7, 1, c('#8a909a')); });
  SP.botella = hacer(8, 20, (b) => { b.rect(1, 7, 6, 13, c('#2f7a35')); b.rect(2, 2, 4, 6, c('#2f7a35')); b.rect(2, 0, 4, 2, c('#d8b040')); b.rect(1, 11, 6, 5, c('#f0e6d0')); });
  SP.garrafa = hacer(20, 32, (b) => { b.rect(1, 9, 18, 21, c('#d02a2a')); b.elipse(10, 9, 9, 4, c('#d02a2a')); b.rect(6, 0, 8, 2, c('#888')); b.rect(4, 2, 2, 5, c('#888')); b.rect(14, 2, 2, 5, c('#888')); b.rect(8, 3, 4, 3, c('#c8a040')); b.rect(3, 16, 14, 4, c('#f2f2f2')); b.rect(1, 29, 18, 3, c('#7a1818')); b.rect(3, 12, 2, 14, c('#e84a4a')); }); // garrafa de supergás (≈0,57 m)
  SP.termo = hacer(9, 24, (b) => { b.rect(1, 4, 7, 20, c('#c0c4cc')); b.rect(2, 0, 5, 5, c('#2a2a30')); b.rect(1, 9, 7, 2, c('#6a7080')); b.rect(1, 18, 7, 2, c('#6a7080')); });
  SP.bizcochos = hacer(18, 10, (b) => { b.elipse(9, 7, 9, 3, c('#f2f2ea')); b.disco(5, 4, 3, c('#e2a040')); b.disco(10, 3, 3, c('#d89838')); b.disco(14, 5, 3, c('#e8b050')); b.px(9, 2, c('#f8e0a0')); });
  SP.chivito = hacer(22, 12, (b) => { b.elipse(11, 9, 11, 3, c('#f2f2ea')); b.elipse(11, 5, 9, 3, c('#d8a050')); b.rect(3, 6, 16, 2, c('#5aa83a')); b.rect(4, 7, 14, 1, c('#e0503a')); b.rect(3, 4, 16, 1, c('#f4e070')); b.elipse(11, 3, 8, 2, c('#e8b060')); });
  SP.mate = hacer(12, 16, (b) => { b.elipse(6, 11, 5, 5, c('#7a4a2a')); b.rect(2, 5, 8, 3, c('#c8a040')); b.rect(3, 6, 6, 1, c('#4f8f35')); b.seg(7, 6, 10, 0, 1.4, 1.4, c('#c8c8d0')); });
  // pico de botella: la mitad de abajo con el vidrio partido en dientes (brillos claros en los filos)
  SP.pico = hacer(8, 14, (b) => { b.rect(1, 5, 6, 9, c('#2f7a35')); b.rect(1, 8, 6, 4, c('#f0e6d0')); b.rect(1, 8, 6, 1, c('#d8c8a0'));
    for (const [x, y, h] of [[1, 2, 3], [2, 4, 1], [3, 0, 5], [4, 3, 2], [5, 1, 4], [6, 4, 1]]) b.rect(x, y, 1, h, c('#3f9a45'));
    for (const [x, y] of [[1, 2], [3, 0], [5, 1]]) b.rect(x, y, 1, 1, c('#c8f0c0')); b.rect(6, 6, 1, 6, c('#1f5a25')); b.rect(2, 6, 1, 1, c('#8ad08a')); });
  // moneda de $U: dorada con brillo y el sol de la moneda grabado
  SP.moneda = hacer(7, 7, (b) => { b.rect(1, 0, 5, 7, c('#c89020')); b.rect(0, 1, 7, 5, c('#c89020')); b.rect(1, 1, 5, 5, c('#f0c040')); b.rect(2, 2, 3, 3, c('#ffe080')); b.rect(3, 3, 1, 1, c('#c89020')); b.rect(1, 1, 1, 1, c('#fff6c0')); });
  SP.billete = hacer(14, 8, (b) => { b.rect(0, 0, 14, 8, c('#c96aa0')); b.rect(2, 2, 4, 4, c('#e8a8c8')); b.rect(8, 2, 4, 1, c('#8a3a6a')); b.rect(8, 5, 4, 1, c('#8a3a6a')); });
  // ======== armas nuevas (escala 56 px/m; las largas apuntan a la derecha con el mango a la izquierda) ========
  SP.silla = hacer(28, 46, (b) => { // silla de bar de madera, de costado
    b.rect(2, 0, 4, 44, c('#8a5a34')); b.rect(3, 0, 1, 44, c('#a8784a')); b.rect(2, 22, 24, 5, c('#9a6a3e')); b.rect(2, 22, 24, 1, c('#c08a5a'));
    b.rect(22, 26, 4, 20, c('#8a5a34')); b.rect(2, 4, 4, 2, c('#6a4224')); b.rect(2, 10, 4, 2, c('#6a4224')); b.rect(6, 36, 18, 2, c('#6a4224')); });
  SP.pata = hacer(34, 4, (b) => { b.rect(0, 0, 34, 4, c('#8a5a34')); b.rect(0, 0, 34, 1, c('#a8784a')); b.rect(31, 0, 3, 4, c('#e8d0a0')); }); // con la punta astillada
  SP.cano = hacer(50, 5, (b) => { b.rect(0, 1, 50, 4, c('#7a7e88')); b.rect(0, 1, 50, 1, c('#b0b4bc')); b.rect(0, 0, 6, 5, c('#5a5e66')); b.rect(44, 0, 6, 5, c('#5a5e66')); b.rect(20, 2, 3, 2, c('#9a5a3a')); });
  SP.escoba = hacer(64, 10, (b) => { b.rect(0, 4, 48, 2, c('#c8a050')); b.rect(0, 4, 4, 2, c('#e04a4a')); b.rect(46, 1, 6, 8, c('#3a7ac0')); for (let k = 0; k < 8; k++) b.rect(52 + k * 1.5, 0 + (k % 2), 1, 10, c(k % 2 ? '#d8b040' : '#c8a030')); });
  SP.ladrillo = hacer(16, 8, (b) => { b.rect(0, 0, 16, 8, c('#b8502e')); b.rect(0, 0, 16, 1, c('#d8704a')); b.rect(4, 3, 3, 2, c('#7a2e1a')); b.rect(10, 3, 3, 2, c('#7a2e1a')); });
  SP.naranja = hacer(16, 14, (b) => { for (const [x, y] of [[4, 8], [11, 8], [7.5, 4]]) { b.disco(x, y, 3.6, c('#f08a20')); b.px(Math.round(x) - 1, Math.round(y) - 2, c('#ffc070')); } b.rect(1, 9, 14, 5, c('#e8e0c0')); for (let k = 2; k < 14; k += 3) b.rect(k, 9, 1, 5, c('#c8c0a0')); }); // bolsa de red
  SP.naranja1 = hacer(7, 7, (b) => { b.disco(3.5, 3.5, 3.4, c('#f08a20')); b.px(2, 2, c('#ffc070')); b.px(4, 0, c('#3a7a2a')); });
  SP.cajonF = hacer(30, 20, (b) => { b.rect(0, 6, 30, 14, c('#c89a5a')); for (let k = 0; k < 3; k++) b.rect(0, 8 + k * 4, 30, 2, c('#a87a3a')); for (let k = 0; k < 6; k++) b.disco(3 + k * 5, 5, 2.6, c(['#d02a2a', '#e8c040', '#5aa83a'][k % 3])); });
  SP.corvina = hacer(32, 11, (b) => { b.elipse(15, 5.5, 13, 5, c('#a8b4c0')); b.elipse(15, 7, 12, 3, c('#e0e6ea')); b.poli([[26, 5], [32, 0], [32, 11]], c('#8a96a2')); b.disco(5, 4, 1.4, c('#1b1220')); b.rect(2, 6, 3, 1, c('#7a2a2a')); for (let k = 9; k < 24; k += 4) b.rect(k, 3, 1, 4, c('#8a96a2')); });
  SP.bandeja = hacer(24, 5, (b) => { b.rect(0, 2, 24, 2, c('#c8c8d0')); b.rect(0, 1, 2, 3, c('#a0a0a8')); b.rect(22, 1, 2, 3, c('#a0a0a8')); b.rect(2, 2, 20, 1, c('#f2f2f8')); b.rect(8, 0, 6, 2, c('#f2f2f2')); }); // con la taza encima
  SP.cana = hacer(78, 4, (b) => { b.rect(0, 1, 18, 3, c('#3a2a20')); b.rect(18, 1, 60, 2, c('#5a4a3a')); b.disco(10, 3, 2.4, c('#8a8a92')); b.rect(76, 0, 2, 4, c('#c8c8d0')); });
  SP.paraguas = hacer(52, 6, (b) => { b.rect(0, 2, 8, 3, c('#6a3a1a')); b.rect(0, 1, 2, 5, c('#6a3a1a')); b.poli([[8, 0], [46, 2], [52, 3], [46, 4], [8, 6]], c('#1e1e26')); b.rect(10, 2, 34, 1, c('#3a3a48')); });
  SP.cucharon = hacer(40, 10, (b) => { b.rect(0, 3, 30, 3, c('#b0b4bc')); b.rect(0, 3, 30, 1, c('#e0e4ec')); b.elipse(34, 5, 6, 4.5, c('#a0a4ac')); b.elipse(34, 4, 4, 2, c('#d0d4dc')); });
  SP.maquina = hacer(22, 16, (b) => { b.rect(0, 7, 6, 3, c('#4a3a2a')); b.rect(6, 2, 16, 14, c('#3a3a44')); b.rect(8, 4, 12, 4, c('#c8e0a0')); for (let k = 0; k < 3; k++) b.rect(8 + k * 4, 10, 3, 3, c('#f2f2f2')); b.rect(20, 0, 2, 3, c('#f2f2ea')); });
  SP.pinza = hacer(44, 7, (b) => { b.rect(0, 2, 10, 3, c('#3a2a20')); b.rect(10, 1, 34, 2, c('#b0b4bc')); b.rect(10, 4, 34, 2, c('#9094a0')); b.rect(40, 0, 4, 7, c('#c8ccd4')); });
  SP.gomera = hacer(10, 12, (b) => { b.rect(4, 6, 2, 6, c('#7a4a2a')); b.rect(1, 1, 2, 6, c('#7a4a2a')); b.rect(7, 1, 2, 6, c('#7a4a2a')); b.rect(2, 2, 6, 1, c('#e04a4a')); });
  SP.piedra = hacer(5, 4, (b) => { b.elipse(2.5, 2, 2.4, 1.9, c('#8a8490')); b.px(1, 1, c('#b0aab8')); });
  SP.boleto = hacer(7, 4, (b) => { b.rect(0, 0, 7, 4, c('#f2f2ea')); b.rect(1, 1, 5, 1, c('#5a8a3a')); });
  SP.chorizo = hacer(14, 6, (b) => { b.elipse(7, 3, 6.5, 2.6, c('#9a3a2a')); b.rect(3, 2, 6, 1, c('#c8604a')); b.px(0, 3, c('#e8d0b0')); });
  SP.tamborProp = hacer(22, 34, (b) => { b.rect(1, 3, 20, 31, c('#8a3a2a')); b.elipse(11, 3, 10.5, 3, c('#f2ead8')); for (let k = 8; k < 32; k += 6) b.rect(1, k, 20, 2, c('#e8c040')); b.rect(4, 3, 2, 30, c('#a8503a')); b.rect(0, 33, 22, 1, c('#5a2a1a')); });
  SP.changuito = hacer(46, 40, (b) => { // changuito de feria (carrito de dos ruedas con la compra)
    b.rect(4, 4, 34, 26, c('#3a6aa0')); for (let k = 6; k < 38; k += 4) b.rect(k, 4, 1, 26, c('#2a4a70')); b.rect(4, 4, 34, 2, c('#5a8ac0'));
    b.disco(12, 2, 4, c('#5aa83a')); b.disco(22, 1, 4, c('#e04a2a')); b.disco(30, 3, 3.5, c('#f0c040')); // verduras asomando
    b.rect(38, 0, 3, 32, c('#8a8a92')); b.rect(36, 0, 10, 3, c('#2a2a30')); b.disco(10, 34, 5.5, c('#1b1b22')); b.disco(10, 34, 2, c('#8a8a92')); b.disco(32, 34, 5.5, c('#1b1b22')); b.disco(32, 34, 2, c('#8a8a92')); });
  // ======== comida ========
  SP.alfajor = hacer(12, 7, (b) => { b.elipse(6, 4, 6, 3, c('#3a2010')); b.rect(1, 3, 10, 1, c('#f2f2f2')); b.px(3, 2, c('#6a4020')); });
  SP.tortafrita = hacer(14, 7, (b) => { b.elipse(7, 4, 7, 3, c('#e0a050')); b.elipse(7, 3, 5, 1.6, c('#f0c070')); for (let k = 0; k < 4; k++) b.px(3 + k * 2, 3 + (k % 2), c('#f8f0e0')); });
  SP.choripan = hacer(24, 9, (b) => { b.elipse(12, 6, 12, 3.4, c('#e0b070')); b.elipse(12, 4, 10, 2.4, c('#9a3a2a')); b.rect(4, 3, 16, 1, c('#5aa83a')); b.elipse(12, 7, 11, 1.6, c('#c89050')); });
  // ======== rompibles nuevos ========
  SP.puesto = hacer(64, 48, (b) => { // puesto de feria con tablón, caballetes y cajones de fruta
    b.rect(0, 18, 64, 5, c('#a87a4a')); b.rect(0, 18, 64, 1, c('#c89a6a')); b.rect(4, 23, 4, 25, c('#7a5030')); b.rect(56, 23, 4, 25, c('#7a5030')); b.poli([[4, 30], [12, 48], [8, 48]], c('#7a5030'));
    for (let k = 0; k < 3; k++) { b.rect(4 + k * 20, 8, 18, 10, c('#c89a5a')); for (let j = 0; j < 4; j++) b.disco(7 + k * 20 + j * 4, 7, 2.4, c(['#d02a2a', '#f08a20', '#5aa83a'][k])); }
    b.rect(18, 26, 26, 10, c('#f2f2ea')); b.rect(20, 28, 22, 1, c('#c8202a')); b.rect(24, 31, 14, 1, c('#1b1220')); });
  SP.cajonFruta = hacer(28, 18, (b) => { b.rect(0, 5, 28, 13, c('#c89a5a')); for (let k = 0; k < 3; k++) b.rect(0, 7 + k * 4, 28, 1, c('#a87a3a')); for (let k = 0; k < 6; k++) b.disco(3 + k * 4.4, 4, 2.4, c(k % 2 ? '#f08a20' : '#e8c040')); });
  SP.mesa = hacer(36, 30, (b) => { b.elipse(18, 3, 18, 3, c('#7a4a2a')); b.elipse(18, 2, 16, 2, c('#9a6a3a')); b.rect(16, 5, 4, 22, c('#2a2a30')); b.rect(8, 27, 20, 3, c('#2a2a30')); b.rect(8, 0, 4, 2, c('#f2f2f2')); b.rect(24, -1, 3, 3, c('#c8a050')); });
  SP.maceta = hacer(22, 26, (b) => { b.rect(2, 12, 18, 14, c('#b8603a')); b.rect(0, 10, 22, 4, c('#d8805a')); for (let k = 0; k < 10; k++) b.disco(4 + (k * 7) % 15, 2 + (k * 5) % 9, 2.5, c(k % 3 ? '#4f7a36' : '#6a9a40')); b.disco(8, 3, 1.4, c('#e04a8a')); b.disco(15, 6, 1.4, c('#f0d040')); });
  SP.revistero = hacer(30, 44, (b) => { b.rect(2, 0, 26, 40, c('#c8402e')); b.rect(4, 2, 22, 36, c('#e8e0d0')); for (let k = 0; k < 4; k++) { b.rect(5, 4 + k * 9, 20, 7, c(['#2a5ab0', '#f0c040', '#e04a8a', '#3a3a44'][k])); b.rect(6, 5 + k * 9, 8, 1, c('#f2f2f2')); } b.rect(2, 40, 4, 4, c('#5a5a62')); b.rect(24, 40, 4, 4, c('#5a5a62')); });
  SP.conservadora = hacer(30, 22, (b) => { b.rect(0, 5, 30, 17, c('#2a8ad0')); b.rect(0, 2, 30, 4, c('#f2f2f2')); b.rect(10, 0, 10, 3, c('#f2f2f2')); b.rect(0, 12, 30, 2, c('#1a6aa8')); b.rect(4, 15, 10, 4, c('#f2f2f2')); });
  SP.barril = hacer(28, 36, (b) => { b.rect(2, 0, 24, 36, c('#7a4a2a')); b.rect(0, 6, 28, 24, c('#8a5a34')); for (const y of [4, 15, 28]) b.rect(0, y, 28, 3, c('#3a3a40')); for (let k = 6; k < 26; k += 5) b.rect(k, 0, 1, 36, c('#6a3a1e')); b.rect(8, 18, 12, 6, c('#e8dcc0')); });
  for (const [k, col0, col1] of [['puesto', '#a87a4a', '#c89a5a'], ['cajonFruta', '#c89a5a', '#f08a20'], ['mesa', '#7a4a2a', '#2a2a30'], ['maceta', '#b8603a', '#4f7a36'], ['revistero', '#c8402e', '#e8e0d0'], ['conservadora', '#2a8ad0', '#f2f2f2'], ['barril', '#7a4a2a', '#3a3a40']])
    SP[k + 'Roto'] = hacer(Math.min(40, SP[k].w), 12, (b) => { const w = Math.min(40, SP[k].w); b.poli([[0, 12], [w * 0.2, 5], [w * 0.45, 8], [w * 0.7, 3], [w, 12]], c(col0)); b.rect(w * 0.3, 7, w * 0.25, 3, c(col1)); b.rect(w * 0.65, 9, 4, 2, c(col1)); });
  // ======== decorado y escenario interactivo ========
  SP.fogata = hacer(26, 30, (b) => { b.rect(1, 6, 24, 24, c('#5a5a62')); for (const y of [9, 20]) b.rect(1, y, 24, 2, c('#3a3a40')); b.rect(1, 6, 24, 2, c('#7a7a82')); b.rect(4, 3, 18, 4, c('#2a1a14')); for (let k = 0; k < 5; k++) b.rect(5 + k * 3.5, 4, 2, 2, c('#ff8a2a')); }); // tanque con brasas (las llamas se animan en el juego)
  SP.banco = hacer(56, 26, (b) => { b.rect(0, 10, 56, 4, c('#7a5030')); b.rect(0, 2, 56, 3, c('#7a5030')); b.rect(0, 10, 56, 1, c('#9a7050')); b.rect(4, 5, 3, 21, c('#2a2a30')); b.rect(49, 5, 3, 21, c('#2a2a30')); });
  SP.cono = hacer(14, 22, (b) => { b.poli([[7, 0], [12, 20], [2, 20]], c('#f08a20')); b.rect(4, 8, 6, 3, c('#f2f2f2')); b.rect(0, 19, 14, 3, c('#2a2a30')); });
  SP.parrillaFuego = hacer(60, 34, (b) => { b.rect(0, 10, 60, 6, c('#2a2a2a')); for (let k = 2; k < 58; k += 5) b.rect(k, 8, 3, 2, c('#5a5a5a')); b.rect(2, 16, 4, 18, c('#2a2a2a')); b.rect(54, 16, 4, 18, c('#2a2a2a')); for (let k = 0; k < 7; k++) b.rect(4 + k * 7.5, 4, 6, 4, c(['#8a3a2a', '#a04a2a', '#6a2a1a'][k % 3])); b.rect(2, 12, 56, 3, c('#ff6a2a')); });
  SP.carroCaballo = hacer(170, 84, (b) => { // carro de hurgador con caballo (originales, a escala: caballo ≈1,5 m de alzada)
    b.rect(80, 30, 86, 30, c('#8a6a4a')); for (let k = 82; k < 166; k += 6) b.rect(k, 30, 1, 30, c('#6a4a2a')); b.rect(80, 26, 86, 4, c('#a88a6a'));
    for (let k = 0; k < 9; k++) b.rect(84 + k * 9, 14 + (k % 3) * 4, 10, 14, c(['#c49a64', '#e8e8e0', '#5a8a3a', '#b88a56', '#4a4a52'][k % 5])); // cartones y bolsas
    b.disco(122, 66, 16, c('#3a2a1a')); b.disco(122, 66, 12, c('#6a4a2a')); for (let a = 0; a < 6; a++) b.linea(122, 66, 122 + Math.cos(a) * 12, 66 + Math.sin(a) * 12, c('#3a2a1a'));
    b.rect(56, 44, 30, 3, c('#6a4a2a')); // varas
    b.elipse(36, 40, 22, 11, c('#8a5a3a')); b.rect(18, 46, 5, 34, c('#7a4a2a')); b.rect(26, 46, 5, 34, c('#6a3a1a')); b.rect(44, 46, 5, 34, c('#7a4a2a')); b.rect(52, 46, 5, 34, c('#6a3a1a'));
    b.poli([[10, 36], [2, 14], [8, 8], [18, 26]], c('#8a5a3a')); b.elipse(4, 12, 6, 4, c('#8a5a3a')); b.rect(0, 12, 3, 3, c('#3a2a1a')); b.px(5, 9, c('#1b1220'));
    b.poli([[8, 10], [16, 30], [12, 32], [5, 14]], c('#3a2418')); b.poli([[58, 36], [66, 54], [62, 56], [56, 42]], c('#3a2418')); // crin y cola
    for (const x of [18, 26, 44, 52]) b.rect(x - 1, 78, 7, 4, c('#2a1a10')); });
  SP.gaviota = [0, 1].map((f) => hacer(18, 10, (b) => { b.elipse(9, 6, 5, 2.4, c('#f2f2f2')); b.rect(13, 5, 3, 2, c('#f2f2f2')); b.px(16, 6, c('#f0a020')); b.px(14, 5, c('#1b1220'));
    if (f) { b.poli([[5, 5], [0, 0], [9, 4]], c('#c8c8d0')); b.poli([[9, 4], [13, 0], [12, 5]], c('#c8c8d0')); } else { b.poli([[4, 6], [0, 10], [9, 7]], c('#c8c8d0')); b.poli([[9, 6], [14, 10], [12, 6]], c('#c8c8d0')); } }));
  SP.turista = hacer(20, 40, (b) => { b.disco(10, 5, 4.5, c('#f0c8a0')); b.rect(4, 0, 12, 3, c('#f2f2ea')); b.rect(2, 2, 16, 2, c('#f2f2ea')); b.rect(4, 10, 12, 16, c('#e04a8a')); b.rect(5, 12, 10, 4, c('#2a2a30')); b.rect(4, 26, 5, 14, c('#f0c8a0')); b.rect(11, 26, 5, 14, c('#f0c8a0')); b.rect(3, 26, 14, 6, c('#c8c0a0')); }); // con cámara colgada
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
