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
  { id: 'sarten', nombre: 'Sartén de la abuela', precio: 140, desc: '¡BONG! El que más empuja.', tipo: 'cuerpo', dano: 45, cadencia: 0.55, alcance: 2.5, empuje: 18, sonido: 'sarten', arco: 0.55 }
];


const M = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.15, ...extra, metalness: Math.min(0.35, (extra.metalness ?? 0.15)) });
const metal = M(0x4a4e56, { metalness: 0.8, roughness: 0.35 }), metalClaro = M(0xb8bcc4, { metalness: 0.9, roughness: 0.2 });
const madera = M(0x6b3e1e, { metalness: 0 }), maderaClara = M(0xc89a5a, { metalness: 0 }), negro = M(0x111111);
const piel = M(0xd8a888, { metalness: 0 }), manga = M(0x3a4a6a, { metalness: 0 });

function caja(w, h, d, mat, x = 0, y = 0, z = 0) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); return m; }
function cil(rt, rb, h, mat, x = 0, y = 0, z = 0, rx = 0) { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 10), mat); m.position.set(x, y, z); m.rotation.x = rx; return m; }
function mano(g, x = 0, y = -0.06, z = 0.05) {
  g.add(caja(0.09, 0.09, 0.11, piel, x, y, z));
  g.add(caja(0.1, 0.1, 0.22, manga, x, y - 0.03, z + 0.16));
}

function modelo(id) {
  const g = new THREE.Group(), punta = new THREE.Vector3(0, 0, -0.3);
  switch (id) {
    case 'pistola':
      g.add(caja(0.05, 0.06, 0.26, metal, 0, 0.02, -0.08)); g.add(caja(0.045, 0.12, 0.06, negro, 0, -0.06, 0.01));
      g.add(caja(0.01, 0.015, 0.01, metalClaro, 0, 0.06, -0.19)); mano(g, 0, -0.08, 0.03); punta.set(0, 0.02, -0.22); break;
    case 'escopeta': {
      g.add(cil(0.022, 0.022, 0.75, metal, 0, 0.03, -0.3, Math.PI / 2));
      g.add(cil(0.018, 0.018, 0.6, metal, 0, -0.01, -0.25, Math.PI / 2));
      const bomba = caja(0.06, 0.05, 0.16, madera, 0, -0.01, -0.36); bomba.name = 'bomba'; g.add(bomba);
      g.add(caja(0.06, 0.08, 0.2, metal, 0, 0.0, 0.05)); g.add(caja(0.055, 0.1, 0.3, madera, 0, -0.05, 0.28));
      mano(g, 0, -0.07, 0.1); punta.set(0, 0.03, -0.68); break;
    }
    case 'metralleta':
      g.add(caja(0.07, 0.09, 0.36, metal, 0, 0.02, -0.08)); g.add(cil(0.015, 0.015, 0.2, metal, 0, 0.03, -0.35, Math.PI / 2));
      g.add(caja(0.04, 0.16, 0.06, negro, 0, -0.09, -0.12)); g.add(caja(0.05, 0.1, 0.05, negro, 0, -0.06, 0.04));
      g.add(caja(0.03, 0.05, 0.22, negro, 0, 0.0, 0.2)); g.add(caja(0.02, 0.03, 0.02, metalClaro, 0, 0.08, -0.2));
      mano(g, 0, -0.08, 0.05); punta.set(0, 0.03, -0.46); break;
    case 'rifle':
      g.add(cil(0.016, 0.02, 0.8, metal, 0, 0.03, -0.35, Math.PI / 2)); g.add(caja(0.06, 0.07, 0.5, madera, 0, -0.01, -0.05));
      g.add(caja(0.055, 0.11, 0.3, madera, 0, -0.04, 0.3)); g.add(cil(0.028, 0.028, 0.28, negro, 0, 0.1, -0.08, Math.PI / 2));
      g.add(cil(0.035, 0.03, 0.03, metalClaro, 0, 0.1, -0.23, Math.PI / 2));
      mano(g, 0, -0.08, 0.1); punta.set(0, 0.03, -0.76); break;
    case 'termo': { // termo de mate, verde clásico, con su mate al lado
      const verde = M(0x2f6b3a, { metalness: 0.5, roughness: 0.4 });
      g.add(cil(0.055, 0.055, 0.42, verde, 0, 0.12, 0)); g.add(cil(0.045, 0.055, 0.06, metalClaro, 0, 0.36, 0));
      g.add(cil(0.02, 0.03, 0.04, negro, 0, 0.41, 0)); g.add(caja(0.02, 0.2, 0.04, negro, 0.065, 0.14, 0));
      mano(g, 0, -0.04, 0.03); break;
    }
    case 'bate':
      g.add(cil(0.05, 0.02, 0.85, maderaClara, 0, 0.42, 0)); g.add(cil(0.022, 0.022, 0.15, negro, 0, 0.02, 0));
      g.add(cil(0.03, 0.03, 0.02, maderaClara, 0, -0.06, 0)); mano(g, 0, -0.02, 0.03); break;
    case 'machete': {
      const hoja = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.6, 0.08), metalClaro); hoja.position.set(0, 0.38, -0.01);
      const filo = caja(0.008, 0.6, 0.02, M(0xe8ecf0, { metalness: 1, roughness: 0.1 }), 0, 0.38, -0.055);
      g.add(hoja, filo); g.add(caja(0.035, 0.16, 0.04, negro, 0, 0.02, 0)); g.add(caja(0.02, 0.06, 0.12, M(0x7a1010), 0, 0.32, 0.0));
      mano(g, 0, -0.02, 0.03); break;
    }
    case 'sarten': {
      const pan = cil(0.2, 0.17, 0.04, M(0x1a1a1a, { metalness: 0.7, roughness: 0.4 }), 0, 0.55, 0, Math.PI / 2);
      g.add(pan); g.add(cil(0.17, 0.17, 0.005, M(0x3a3a3a, { metalness: 0.9, roughness: 0.2 }), 0, 0.55, -0.022, Math.PI / 2));
      g.add(caja(0.035, 0.36, 0.03, madera, 0, 0.18, 0)); mano(g, 0, -0.02, 0.03); break;
    }
  }
  g.userData.punta = punta;
  return g;
}

export function crearModelos() { const r = {}; ARMAS.forEach(a => r[a.id] = modelo(a.id)); return r; }
