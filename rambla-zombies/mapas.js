// Mapas: todos viven sobre la misma curva de la costa (600 muestras, ~1,7 m cada una), cada uno en su tramo,
// con su utilería, sus límites y su clima. Así se reusan el mar, la rambla, la física y la sangre sin cargar nada extra.
export const MAPAS = {
  rambla: { id: 'rambla', nombre: 'Rambla Sur', sub: 'Centro, Palacio Salvo y Puerto del Buceo', i0: 230, i1: 428, ini: 300, puerto: true, desbloq: 0,
    atmo: { noche: 0x0e1834, niebla: 0x1a2444, densidad: 0.0042, horizonte: 0x2a3260, cielo: 0x8090d0, suelo: 0x2a2420 } },
  puerto: { id: 'puerto', nombre: 'Puerto del Buceo', sub: 'Contenedores, grúas y el muelle', i0: 366, i1: 428, ini: 392, puerto: true, desbloq: 0,
    atmo: { noche: 0x0c1424, niebla: 0x1c2230, densidad: 0.0055, horizonte: 0x283048, cielo: 0x7a88b8, suelo: 0x2a2620 } },
  pocitos: { id: 'pocitos', nombre: 'Pocitos', sub: 'La pared de edificios, la playa y el atardecer eterno', i0: 50, i1: 190, ini: 120, desbloq: 4,
    atmo: { noche: 0x2a1838, niebla: 0x553048, densidad: 0.0048, horizonte: 0x9a4a58, cielo: 0xc08aa0, suelo: 0x3a2a22 } },
  faro: { id: 'faro', nombre: 'Punta Carretas', sub: 'El faro, las rocas y una niebla que no deja ver nada', i0: 462, i1: 585, ini: 540, iniD: -1, desbloq: 8, mirar: [563, -27], // arranca mirando al faro
    atmo: { noche: 0x2c4248, niebla: 0x2c4248, densidad: 0.0115, horizonte: 0x2a4a52, cielo: 0x7aa8b0, suelo: 0x20282a, lejos: 330 } }
};
export const ORDEN_MAPAS = ['rambla', 'pocitos', 'faro', 'puerto'];
// ¿la muestra i está en una zona jugable? (para poner colisiones solo donde hace falta)
export const enZona = i => { for (const k in MAPAS) { const m = MAPAS[k]; if (i >= m.i0 - 8 && i <= m.i1 + 8) return true; } return false; };
