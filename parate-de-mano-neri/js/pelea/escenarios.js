// Escenarios del motor de pelea: una "ventana" de cada nivel de Montevideo (la misma calle del beat 'em up, pintada sólo
// en el tramo que se usa) + cielo, horizonte y fondo con parallax + público del barrio que alienta.
import { calle, lejos, medio, cielo, sol, ALTO, EXTRA } from '../escenario.js';
import { NIVELES } from '../niveles.js';
import { generar, dibujarCuadro, cuadroListo, sombreado } from '../sprites.js';

export const ANCHO = 760, SUELO = 246;
// tramo elegido de cada nivel (lo más lindo de la calle) y público (claves de enemigos del nivel que miran)
export const ESCENARIOS = {
  cuadra: { x0: 380, nombre: 'LA CUADRA DEL CANA', publico: [['buzo', 1], ['mati', 0], ['cacho', 1], ['mati', 2]] },
  feria: { x0: 860, nombre: 'FERIA DE TRISTÁN NARVAJA', publico: [['dona', 0], ['buzo', 2], ['mati', 1], ['cuida', 0]] },
  avenida: { x0: 600, nombre: 'AVENIDA 18 DE JULIO', publico: [['mati', 3], ['buzo', 0], ['cacho', 0], ['guri', 0]] },
  barriosur: { x0: 1000, nombre: 'BARRIO SUR · LLAMADAS', publico: [['tambor', 0], ['tambor', 1], ['buzo', 1], ['mati', 0]] },
  boliche: { x0: 500, nombre: 'EL BOLICHE DEL GALLEGO', publico: [['mozo', 0], ['mamado', 0], ['mamado', 1], ['buzo', 2]] },
  cerro: { x0: 900, nombre: 'EL CERRO · LA FORTALEZA', publico: [['chorro', 0], ['buzo', 0], ['cacho', 2], ['mati', 1]] },
  ciudadvieja: { x0: 700, nombre: 'MERCADO DEL PUERTO', publico: [['pescador', 0], ['mozo', 0], ['buzo', 1], ['mati', 2]] },
  rambla: { x0: 1100, nombre: 'LA RAMBLA · TORMENTA', publico: [['pescador', 0], ['mati', 0], ['buzo', 2], ['cacho', 1]] },
};
export const IDS_ESC = Object.keys(ESCENARIOS);
const cacheEsc = new Map();
export class Escenario {
  constructor(id) {
    const nv = NIVELES.find((n) => n.id === id) || NIVELES[0]; this.id = nv.id; this.nv = nv; const E = ESCENARIOS[nv.id] || ESCENARIOS.cuadra; this.nombre = E.nombre;
    const c = cacheEsc.get(nv.id);
    if (c) Object.assign(this, c); else {
      const x0 = Math.min(nv.L - ANCHO, E.x0); const t = calle(nv, { x0, w: ANCHO });
      const capa = { calle: t.canvas, lejos: lejos(1200, nv.lejos, nv.hora), medio: medio(1400, nv.medio, nv.hora), sol: sol(nv.hora) };
      if (cacheEsc.size > 2) cacheEsc.delete(cacheEsc.keys().next().value); cacheEsc.set(nv.id, capa); Object.assign(this, capa);
    }
    this.publico = []; let i = 0; for (const [k, v] of E.publico) { try { const sp = generar(k, v, null, true); this.publico.push({ sp, x: 90 + i * 170 + (i % 2) * 40, fase: i * 1.7, cara: i % 2 ? -1 : 1, salto: 0 }); } catch (e) { /* clave sin DEF */ } i++; }
    this.cieloK = '';
  }
  alentar(f = 1) { for (const p of this.publico) p.salto = Math.max(p.salto, 0.3 * f); }
  paso(dt) { for (const p of this.publico) { p.fase += dt; if (p.salto > 0) p.salto -= dt; } }
  dibujar(x, C, off, W, H) {
    const k = W + 'x' + H; if (this.cieloK !== k) { this.cieloC = cielo(W, H, this.nv.hora); this.cieloK = k; }
    if (this.nv.interior) { x.fillStyle = '#1e1614'; x.fillRect(0, 0, W, off - EXTRA + 1); }
    else { x.drawImage(this.cieloC, 0, 0); if (this.sol) x.drawImage(this.sol, Math.round(W * 0.62 - C * 0.02), off + (this.nv.hora === 'noche' ? 30 : this.nv.hora === 'manana' ? 50 : 96));
      const lj = Math.round(C * 0.15) % (this.lejos.width - W); x.drawImage(this.lejos, lj, 0, W, ALTO, 0, off, W, ALTO);
      const md = Math.min(this.medio.width - W, Math.round(C * 0.45)); x.drawImage(this.medio, md, 0, W, ALTO, 0, off, W, ALTO); }
    x.drawImage(this.calle, Math.max(0, C), 0, W, ALTO + EXTRA, 0, off - EXTRA, W, ALTO + EXTRA);
    // público (detrás de los luchadores, sobre la vereda del fondo)
    for (const p of this.publico) { const sx = Math.round(p.x - C); if (sx < -40 || sx > W + 40) continue; const f = cuadroListo(p.sp, 'quieto', Math.floor(p.fase * 4) % 4);
      const z = p.salto > 0 ? Math.round(Math.sin(p.salto / 0.3 * Math.PI) * 6) : 0; if (this.sinPublico) continue; /* público = decorado: silueta oscura, chica y semitransparente, bien atrás (la pelea es 1 contra 1) */ const ga = x.globalAlpha; x.globalAlpha = ga * 0.6; dibujarCuadro(x, sombreado(f, 'rgba(16,8,32,0.86)'), sx, off + 196 - z, p.cara, 0.58); x.globalAlpha = ga; }
  }
}
