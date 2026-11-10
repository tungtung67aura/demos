// Sonidos generados con WebAudio: nada de archivos
let ctx = null, master = null, ruidoBuf = null;

export function iniciarAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.6; master.connect(ctx.destination);
    ruidoBuf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
    const d = ruidoBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume();
}

function env(g, t, a, peak, dec) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
}

function ruido({ dur = 0.2, f = 2000, q = 0.7, tipo = 'lowpass', vol = 0.8, a = 0.002, f2 = null, rate = 1 }) {
  if (!ctx) return;
  const t = ctx.currentTime, s = ctx.createBufferSource(); s.buffer = ruidoBuf; s.playbackRate.value = rate;
  const fl = ctx.createBiquadFilter(); fl.type = tipo; fl.frequency.setValueAtTime(f, t); fl.Q.value = q;
  if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
  const g = ctx.createGain(); env(g, t, a, vol, dur);
  s.connect(fl).connect(g).connect(master); s.start(t, Math.random() * 0.5); s.stop(t + dur + a + 0.05);
}

function tono({ f = 440, f2 = null, dur = 0.2, tipo = 'sine', vol = 0.4, a = 0.003, delay = 0 }) {
  if (!ctx) return;
  const t = ctx.currentTime + delay, o = ctx.createOscillator(); o.type = tipo; o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  const g = ctx.createGain(); env(g, t, a, vol, dur);
  o.connect(g).connect(master); o.start(t); o.stop(t + dur + a + 0.05);
}

export function volumen(v) { if (master) master.gain.value = v; }

export const sonido = {
  pistola() { ruido({ dur: 0.18, f: 2600, f2: 400, vol: 0.9 }); tono({ f: 160, f2: 60, dur: 0.12, vol: 0.5 }); },
  revolver() { ruido({ dur: 0.35, f: 1800, f2: 200, vol: 1 }); tono({ f: 110, f2: 40, dur: 0.25, vol: 0.6, tipo: 'triangle' }); },
  escopeta() {
    ruido({ dur: 0.45, f: 1400, f2: 120, vol: 1.2, rate: 0.7 }); tono({ f: 90, f2: 30, dur: 0.35, vol: 0.8, tipo: 'triangle' });
    // chak-chak del cargador
    ruido({ dur: 0.05, f: 3000, tipo: 'bandpass', q: 3, vol: 0.5 });
    setTimeout(() => { ruido({ dur: 0.06, f: 1800, tipo: 'bandpass', q: 4, vol: 0.6 }); setTimeout(() => ruido({ dur: 0.07, f: 2500, tipo: 'bandpass', q: 4, vol: 0.6 }), 110); }, 330);
  },
  metralleta() { ruido({ dur: 0.08, f: 3200, f2: 700, vol: 0.7 }); tono({ f: 200, f2: 80, dur: 0.06, vol: 0.3, tipo: 'square' }); },
  rifle() { ruido({ dur: 0.6, f: 3500, f2: 150, vol: 1.1 }); tono({ f: 140, f2: 35, dur: 0.4, vol: 0.7, tipo: 'sawtooth' }); },
  vacio() { tono({ f: 1800, dur: 0.03, vol: 0.2, tipo: 'square' }); },
  recarga() { ruido({ dur: 0.05, f: 2200, tipo: 'bandpass', q: 5, vol: 0.5 }); setTimeout(() => ruido({ dur: 0.06, f: 1400, tipo: 'bandpass', q: 5, vol: 0.6 }), 260); },
  swing() { ruido({ dur: 0.22, f: 400, f2: 2200, tipo: 'bandpass', q: 1.5, vol: 0.5, a: 0.05 }); },
  golpe() { ruido({ dur: 0.12, f: 600, vol: 0.9 }); tono({ f: 120, f2: 50, dur: 0.1, vol: 0.6 }); },
  corte() { ruido({ dur: 0.15, f: 5000, f2: 1500, tipo: 'highpass', vol: 0.5 }); ruido({ dur: 0.1, f: 500, vol: 0.7 }); },
  termo() { // ¡toc! hueco de termo
    tono({ f: 820, f2: 700, dur: 0.18, vol: 0.5 }); tono({ f: 1960, dur: 0.12, vol: 0.2 }); ruido({ dur: 0.05, f: 1200, vol: 0.4 });
  },
  sarten() { // ¡BONG!
    [310, 742, 1225, 1810].forEach((f, i) => tono({ f, dur: 1.1 - i * 0.2, vol: 0.35 / (i + 1) + 0.1, tipo: 'sine' }));
    ruido({ dur: 0.05, f: 3000, vol: 0.5 });
  },
  carne() { ruido({ dur: 0.1, f: 700, f2: 200, vol: 0.6 }); },
  cabeza() { ruido({ dur: 0.2, f: 900, f2: 150, vol: 0.9, rate: 0.6 }); tono({ f: 70, dur: 0.15, vol: 0.5 }); },
  gemido(grave = 1) {
    if (!ctx) return;
    const t = ctx.currentTime, d = 0.8 + Math.random() * 0.6;
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    const f0 = (80 + Math.random() * 40) * grave;
    o.frequency.setValueAtTime(f0, t); o.frequency.linearRampToValueAtTime(f0 * 1.3, t + d * 0.4); o.frequency.linearRampToValueAtTime(f0 * 0.7, t + d);
    const lfo = ctx.createOscillator(); lfo.frequency.value = 6 + Math.random() * 4;
    const lg = ctx.createGain(); lg.gain.value = 8; lfo.connect(lg).connect(o.frequency);
    const fl = ctx.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.value = 500 + Math.random() * 300; fl.Q.value = 2;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.25, t + 0.15); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(fl).connect(g).connect(master); o.start(t); lfo.start(t); o.stop(t + d + 0.05); lfo.stop(t + d + 0.05);
  },
  dolor() { tono({ f: 220, f2: 90, dur: 0.25, vol: 0.5, tipo: 'triangle' }); ruido({ dur: 0.15, f: 400, vol: 0.5 }); },
  agarrar() { tono({ f: 660, dur: 0.08, vol: 0.3, tipo: 'square' }); tono({ f: 990, dur: 0.12, vol: 0.3, tipo: 'square', delay: 0.08 }); },
  oleada() { [220, 277, 330, 440].forEach((f, i) => tono({ f, dur: 0.5, vol: 0.2, tipo: 'sawtooth', delay: i * 0.12 })); },
  muerte() { [300, 240, 180, 110].forEach((f, i) => tono({ f, f2: f * 0.8, dur: 0.5, vol: 0.3, tipo: 'sawtooth', delay: i * 0.25 })); }
};
