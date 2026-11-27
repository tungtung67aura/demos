// Objetos del motor de pelea (proyectiles, trampas y cosas en la mano), en pixel art de verdad: mapas de caracteres
// con paleta → lienzo con contorno oscuro. Las rotaciones (8) se precalculan con muestreo al vecino más cercano.
import { lienzo, CONTORNO } from '../pixel.js';

const PAL = { k: CONTORNO, w: '#ffffff', W: '#e8e0d0', r: '#d8282a', R: '#8a1414', o: '#f08a20', y: '#f2c21b', Y: '#fff0a0', g: '#4aa03a', G: '#2a6a2a', b: '#3a6ac8', B: '#1f3a7a', c: '#9ad8f0', C: '#4a8ab8',
  n: '#8a5a32', N: '#4a2e1a', s: '#c8c8d0', S: '#7a7a88', p: '#e8458b', P: '#a02a6a', v: '#a050e0', V: '#5a2a90', m: '#c89a64', M: '#7a5a34', l: '#d8c890', L: '#a89860', d: '#3a3a44', D: '#222228', e: '#f0b088', t: '#c87050', a: '#b0b0b8' };
const ARTE = {
  mate: ['....sS', '...sS.', '.nnSnn', 'nmmmmmn', 'nmMmmmn', 'nmmmmmn', '.nmmmn.', '..nnn..'],
  llave: ['ss.....', 'Ss.....', '.Ss....', '..Ss...', '...Ss..', '....Ssy', '....syy', '.....yy'],
  tomate: ['..gGg..', '.rrgrr.', 'rrrrrwr', 'rrrrrrr', 'rRrrrrr', '.rRrrr.', '..RRR..'],
  diario: ['WWWWWWWW', 'WddddddW', 'WWWWWWWW', 'WdWdWddW', 'WWWWWWWW', 'WddWdWdW', 'WWWWWWWW'],
  botella: ['..ss..', '..GG..', '..gG..', '.gggG.', '.gwgG.', '.ggGG.', '.gggG.', '.gggG.', '.GGGG.'],
  esposas: ['.sss...sss.', 's...s.s...s', 's...sSs...s', 's...s.s...s', '.sss...sss.'],
  rima: ['....yy', '....yY', '....y.', '....y.', '.yyyy.', 'yyyYy.', '.yyy..'],
  chorizo: ['.ttttttt.', 'tRtttttRt', 'tttRttttt', '.ttttttt.'],
  chancleta: ['..bbbbbb..', '.bBbbbbbb.', 'bbbbwwbbbb', 'bbbBbbbbbb', '.bbbbbbbb.'],
  like: ['....w...', '...ww...', '..www...', 'wwwwwww.', 'wwwwwwww', 'wwwwwww.', 'wwwwww..'],
  bajo: ['..vvvv..', '.v....v.', 'v..VV..v', 'v.V..V.v', 'v.V..V.v', 'v..VV..v', '.v....v.', '..vvvv..'],
  papeles: ['WWWWW.', 'WdddW.', 'WWWWWW', 'WddWdW', 'WWWWWW', '.WddW.', '.WWWW.'],
  tuerca: ['.sss.', 'sSkSs', 'sk.ks', 'sSkSs', '.sss.'],
  pizza: ['yyyyyyyy', 'oyrYyryo', '.yyyyyo.', '.oyrYyo.', '..yyyo..', '..oyyo..', '...yo...', '...o....'],
  boleto: ['WWWWWW', 'WrrrrW', 'WWWWWW', 'WddWdW', 'WWWWWW'],
  ladrillo: ['tttttttt', 'tRtttRtt', 'tttttttt', 'ttRtttRt', 'tttttttt'],
  chorro: ['.cc....', 'cwccc..', 'cccwccc', '.cccccc', '..ccc..'],
  rasgueo: ['.y...y..', 'y.y.y.y.', '...y...y', 'y.y.y.y.', '.y...y..'],
  cascara: ['...yy...', '..yYy...', '.yy.yy..', 'yy...yy.', 'Y.....Y.'],
  ladrilloRoto: ['ttt.', 'tRt.', '.tt.'],
  hielo: ['.cc.', 'cwcc', 'cccc', '.cc.'],
  nota: ['..yy', '..y.', 'yyy.', 'yy..'],
  baston: ['.nn.', 'n..n', '...n', '...n', '...n', '...n', '...n', '...N'],
  franela: ['yyyyy', 'yYyYy', 'yyyyy', 'yYyYy', '.yyy.'],
  cuchilla: ['ssssss.', 'sSSSSss', 'ssssssN', '.....NN'],
  sarten: ['.ddd.....', 'dDDDd....', 'dDDDdnnnn', 'dDDDd....', '.ddd.....'],
  maletin: ['..NN..', 'NNNNNN', 'NnnnnN', 'NnyynN', 'NnnnnN', 'NNNNNN'],
  paraguas: ['..ddd..', '.ddddd.', 'ddddddd', '...n...', '...n...', '...n...', '..nn...'],
  cucharon: ['ssss.', 'sSSs.', 'ssss.', '..n..', '..n..', '..n..'],
  skate: ['.kkkkkkkk.', 'kppppppppk', '.kkkkkkkk.', '..s....s..'],
  guitarra: ['.....NN', '....Nn.', '...Nn..', '.mmn...', 'mMmm...', 'mmMm...', '.mm....'],
  billete: ['gggggg', 'gGwwGg', 'gggggg'],
};
const cache = new Map();
function base(nombre) {
  let c = cache.get(nombre); if (c) return c; const A = ARTE[nombre] || ARTE.tuerca; const h = A.length, w = Math.max(...A.map((r) => r.length));
  const [cv, x] = lienzo(w + 2, h + 2);
  for (let j = 0; j < h; j++) for (let i = 0; i < A[j].length; i++) { const ch = A[j][i]; if (ch === '.') continue; x.fillStyle = PAL[ch] || '#f0f'; x.fillRect(i + 1, j + 1, 1, 1); }
  // contorno de 1 px alrededor de lo pintado
  const img = x.getImageData(0, 0, w + 2, h + 2), d = img.data, out = new Uint8Array((w + 2) * (h + 2));
  for (let j = 0; j < h + 2; j++) for (let i = 0; i < w + 2; i++) { if (d[(j * (w + 2) + i) * 4 + 3]) continue; let v = 0; for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ii = i + a, jj = j + b; if (ii >= 0 && jj >= 0 && ii < w + 2 && jj < h + 2 && d[(jj * (w + 2) + ii) * 4 + 3] && A[jj - 1] && A[jj - 1][ii - 1] !== 'k') v = 1; } out[j * (w + 2) + i] = v; }
  x.fillStyle = CONTORNO; for (let j = 0; j < h + 2; j++) for (let i = 0; i < w + 2; i++) if (out[j * (w + 2) + i]) x.fillRect(i, j, 1, 1);
  c = { cv, w: w + 2, h: h + 2, rot: [] }; cache.set(nombre, c); return c;
}
function rotado(nombre, k) { const b = base(nombre); if (b.rot[k]) return b.rot[k]; if (k === 0) return (b.rot[0] = b.cv);
  const L = Math.ceil(Math.hypot(b.w, b.h)) + 2; const [cv, x] = lienzo(L, L); x.translate(L / 2, L / 2); x.rotate(k * Math.PI / 4); x.drawImage(b.cv, -b.w / 2, -b.h / 2); return (b.rot[k] = cv); }
// dibuja el objeto centrado en (px, py) (px del juego); ang en radianes (se redondea a 45°); cara<0 espeja
export function dibujarObjeto(x, nombre, px, py, ang = 0, cara = 1, esc = 1) {
  const k = ((Math.round(ang / (Math.PI / 4)) % 8) + 8) % 8; const c = rotado(nombre, k); const w = c.width * esc, h = c.height * esc;
  if (cara >= 0) { x.drawImage(c, Math.round(px - w / 2), Math.round(py - h / 2), w, h); return; }
  x.save(); x.translate(Math.round(px), 0); x.scale(-1, 1); x.drawImage(c, Math.round(-w / 2), Math.round(py - h / 2), w, h); x.restore();
}
export function tamObjeto(nombre) { const b = base(nombre); return [b.w, b.h]; }
export const OBJETOS = Object.keys(ARTE);
