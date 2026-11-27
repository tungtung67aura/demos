// Récords, estadísticas por luchador, desbloqueos por reto y torres (todo dentro del guardado de progreso.js, campo 'pelea').
import { P, guardar, DIOS } from '../progreso.js';
import { LUCHADORES, POR_ID } from './luchadores.js';

export const PP = () => P.pelea;
export function desbloqueado(id) { const L = POR_ID[id]; if (!L || !L.desbloq) return true; return DIOS.on || P.pelea.desbloq.includes(id); }
export function torreAbierta(i) { if (DIOS.on || i === 0) return true; const ids = ['barrio', 'caos', 'infierno']; const t = P.pelea.torres[ids[i - 1]]; return !!(t && t.hechas > 0); }
function reto(k) { const p = P.pelea;
  switch (k) {
    case 'vencer_patovica': return p.vencidos.includes('patovica'); case 'vencer_parrillero': return p.vencidos.includes('parrillero'); case 'vencer_zombi': return p.vencidos.includes('zombi');
    case 'ganadas10': return p.ganadas >= 10; case 'combo8': return p.maxCombo >= 8; case 'gana_dif3': return p.dif3; case 'perfecto': return p.perfectos >= 1;
    case 'cinco_pj': return p.ganadores.length >= 5; case 'ult5': return p.ults >= 5;
    case 'torre_barrio': return !!(p.torres.barrio && p.torres.barrio.hechas); case 'torre_caos': return !!(p.torres.caos && p.torres.caos.hechas); case 'torre_infierno': return !!(p.torres.infierno && p.torres.infierno.hechas);
  } return false; }
// revisa los retos; devuelve los luchadores recién desbloqueados
export function revisarDesbloqueos() { const p = P.pelea; const nuevos = [];
  for (const L of LUCHADORES) if (L.desbloq && !p.desbloq.includes(L.id) && reto(L.desbloq.reto)) { p.desbloq.push(L.id); nuevos.push(L); }
  if (nuevos.length) guardar(); return nuevos; }
// registra una pelea terminada (jugador = p1)
export function registrarPelea(r, cfg) { const p = P.pelea, st = r.stats, yo = cfg.p1.id, el = cfg.p2.id; const gane = r.gana === 1;
  const pj = p.porPj[yo] || (p.porPj[yo] = { g: 0, p: 0, combo: 0, ults: 0 });
  if (gane) { p.ganadas++; pj.g++; if (!p.ganadores.includes(yo)) p.ganadores.push(yo); if (!p.vencidos.includes(el)) p.vencidos.push(el); if ((cfg.p2.dif || 2) >= 3) p.dif3 = true; } else { p.perdidas++; pj.p++; }
  p.maxCombo = Math.max(p.maxCombo, st.maxCombo); pj.combo = Math.max(pj.combo, st.maxCombo); p.ults += st.ults; pj.ults += st.ults; p.perfectos += st.perfectos;
  guardar(); return revisarDesbloqueos(); }
export function registrarTorre(id, pj, tiempo, plata) { const p = P.pelea; const t = p.torres[id] || (p.torres[id] = { hechas: 0, mejor: 0, pjs: [] }); t.hechas++; if (!t.mejor || tiempo < t.mejor) t.mejor = Math.round(tiempo); if (!t.pjs.includes(pj)) t.pjs.push(pj); P.plata += plata; guardar(); return revisarDesbloqueos(); }
export function sumarPlataPelea(n) { P.plata += n; guardar(); }
export function registrarVencido(id) { const p = P.pelea; if (!p.vencidos.includes(id)) p.vencidos.push(id); guardar(); return revisarDesbloqueos(); }
export function recordInfinito(k, v) { const p = P.pelea.infinito; const nuevo = v > (p[k] || 0); if (nuevo) p[k] = v; p.jugadas++; guardar(); return nuevo; }
