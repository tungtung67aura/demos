// Sonidos generados con WebAudio: nada de archivos
let ctx = null, master = null, ruidoBuf = null, sfx = null, musBus = null, comp = null, desfase = 0; // desfase: solo para render offline (tráiler)

export function iniciarAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.connect(ctx.destination);
    master = ctx.createGain(); master.gain.value = 0.6; master.connect(comp);
    sfx = ctx.createGain(); sfx.gain.value = 1; sfx.connect(master);
    musBus = ctx.createGain(); musBus.gain.value = 0.5; musBus.connect(master);
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

function ruido({ dur = 0.2, f = 2000, q = 0.7, tipo = 'lowpass', vol = 0.8, a = 0.002, f2 = null, rate = 1, dest = null, delay = 0 }) {
  if (!ctx) return;
  const t = ctx.currentTime + desfase + delay, s = ctx.createBufferSource(); s.buffer = ruidoBuf; s.playbackRate.value = rate;
  const fl = ctx.createBiquadFilter(); fl.type = tipo; fl.frequency.setValueAtTime(f, t); fl.Q.value = q;
  if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
  const g = ctx.createGain(); env(g, t, a, vol, dur);
  s.connect(fl).connect(g).connect(dest || sfx); s.start(t, Math.random() * 0.5); s.stop(t + dur + a + 0.05);
}

function tono({ f = 440, f2 = null, dur = 0.2, tipo = 'sine', vol = 0.4, a = 0.003, delay = 0, dest = null }) {
  if (!ctx) return;
  const t = ctx.currentTime + desfase + delay, o = ctx.createOscillator(); o.type = tipo; o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  const g = ctx.createGain(); env(g, t, a, vol, dur);
  o.connect(g).connect(dest || sfx); o.start(t); o.stop(t + dur + a + 0.05);
}

export function volumen(v, musica = 0.5) { if (master) { master.gain.value = v; musBus.gain.value = musica; } }
export const audioListo = () => !!ctx;

// variación chica en cada impacto para que no suene siempre igual
const vr = (x, p = 0.12) => x * (1 + (Math.random() * 2 - 1) * p);
let ultimoCae = 0;
export const sonido = {
  pistola() { ruido({ dur: 0.18, f: 2600, f2: 400, vol: 0.9 }); tono({ f: 160, f2: 60, dur: 0.12, vol: 0.5 }); },
  escopeta() {
    ruido({ dur: 0.45, f: 1400, f2: 120, vol: 1.2, rate: 0.7 }); tono({ f: 90, f2: 30, dur: 0.35, vol: 0.8, tipo: 'triangle' });
    // chak-chak del cargador
    ruido({ dur: 0.05, f: 3000, tipo: 'bandpass', q: 3, vol: 0.5 });
    setTimeout(() => { ruido({ dur: 0.06, f: 1800, tipo: 'bandpass', q: 4, vol: 0.6 }); setTimeout(() => ruido({ dur: 0.07, f: 2500, tipo: 'bandpass', q: 4, vol: 0.6 }), 110); }, 330);
  },
  metralleta() { ruido({ dur: 0.08, f: 3200, f2: 700, vol: 0.7 }); tono({ f: 200, f2: 80, dur: 0.06, vol: 0.3, tipo: 'square' }); },
  revolver() { ruido({ dur: 0.34, f: 3000, f2: 260, vol: 1.0 }); tono({ f: 120, f2: 45, dur: 0.24, vol: 0.65 }); },
  rifle() { ruido({ dur: 0.6, f: 3500, f2: 150, vol: 1.1 }); tono({ f: 140, f2: 35, dur: 0.4, vol: 0.7, tipo: 'sawtooth' }); },
  vacio() { tono({ f: 1800, dur: 0.03, vol: 0.2, tipo: 'square' }); },
  recarga() { ruido({ dur: 0.05, f: 2200, tipo: 'bandpass', q: 5, vol: 0.5 }); setTimeout(() => ruido({ dur: 0.06, f: 1400, tipo: 'bandpass', q: 5, vol: 0.6 }), 260); },
  swing() { ruido({ dur: 0.22, f: 400, f2: 2200, tipo: 'bandpass', q: 1.5, vol: 0.5, a: 0.05 }); },
  golpe() { ruido({ dur: vr(0.12), f: vr(600, 0.2), vol: 0.9, rate: vr(1, 0.15) }); tono({ f: vr(120), f2: 50, dur: 0.1, vol: 0.6 }); },
  corte() { ruido({ dur: 0.15, f: vr(5000, 0.2), f2: 1500, tipo: 'highpass', vol: 0.5 }); ruido({ dur: 0.1, f: vr(500, 0.2), vol: 0.7, rate: vr(1, 0.15) }); },
  termo() { // ¡toc! hueco de termo
    const k = vr(1, 0.06); tono({ f: 820 * k, f2: 700 * k, dur: 0.18, vol: 0.5 }); tono({ f: 1960 * k, dur: 0.12, vol: 0.2 }); ruido({ dur: 0.05, f: 1200, vol: 0.4 });
  },
  sarten() { // ¡BONG!
    [310, 742, 1225, 1810].forEach((f, i) => tono({ f, dur: 1.1 - i * 0.2, vol: 0.35 / (i + 1) + 0.1, tipo: 'sine' }));
    ruido({ dur: 0.05, f: 3000, vol: 0.5 });
  },
  carne() { ruido({ dur: vr(0.1, 0.25), f: vr(700, 0.25), f2: vr(200, 0.2), vol: vr(0.6, 0.15), rate: vr(1, 0.2) }); },
  cabeza() { ruido({ dur: 0.2, f: vr(900, 0.2), f2: 150, vol: 0.9, rate: vr(0.6, 0.15) }); tono({ f: vr(70), dur: 0.15, vol: 0.5 }); },
  crujido() { ruido({ dur: 0.07, f: vr(2600, 0.2), tipo: 'bandpass', q: 3, vol: 0.55 }); ruido({ dur: 0.05, f: vr(1500, 0.2), tipo: 'bandpass', q: 4, vol: 0.4, delay: 0.03 }); },
  madera() { ruido({ dur: 0.09, f: vr(1100, 0.2), tipo: 'bandpass', q: 2.5, vol: 0.5 }); tono({ f: vr(260, 0.15), f2: 180, dur: 0.08, vol: 0.18, tipo: 'triangle' }); },
  piedra() { ruido({ dur: 0.06, f: vr(3200, 0.25), tipo: 'bandpass', q: 1.5, vol: 0.3 }); },
  // cuerpo que cae al piso (con tope: si caen muchos juntos suena uno)
  cae(pesado, fuerza = 1) {
    if (!ctx) return; const t = ctx.currentTime + desfase; if (t - ultimoCae < (pesado ? 0 : 0.07)) return; ultimoCae = t;
    const v = Math.min(1, 0.35 + fuerza * 0.08);
    if (pesado) { tono({ f: 48, f2: 20, dur: 0.9, vol: 1.2 }); ruido({ dur: 0.8, f: 260, f2: 50, vol: 1.1, rate: 0.35 }); }
    else { ruido({ dur: vr(0.16), f: vr(320, 0.2), f2: 90, vol: 0.7 * v, rate: vr(0.6, 0.2) }); tono({ f: vr(75, 0.2), f2: 40, dur: 0.12, vol: 0.4 * v }); }
  },
  chapoteo() { ruido({ dur: vr(0.14), f: vr(1100, 0.3), f2: 300, vol: 0.35, rate: vr(0.8, 0.2) }); },
  gemido(grave = 1) {
    if (!ctx) return;
    const t = ctx.currentTime + desfase, d = 0.8 + Math.random() * 0.6;
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    const f0 = (80 + Math.random() * 40) * grave;
    o.frequency.setValueAtTime(f0, t); o.frequency.linearRampToValueAtTime(f0 * 1.3, t + d * 0.4); o.frequency.linearRampToValueAtTime(f0 * 0.7, t + d);
    const lfo = ctx.createOscillator(); lfo.frequency.value = 6 + Math.random() * 4;
    const lg = ctx.createGain(); lg.gain.value = 8; lfo.connect(lg).connect(o.frequency);
    const fl = ctx.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.value = 500 + Math.random() * 300; fl.Q.value = 2;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.25, t + 0.15); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(fl).connect(g).connect(sfx); o.start(t); lfo.start(t); o.stop(t + d + 0.05); lfo.stop(t + d + 0.05);
  },
  dolor() { tono({ f: 220, f2: 90, dur: 0.25, vol: 0.5, tipo: 'triangle' }); ruido({ dur: 0.15, f: 400, vol: 0.5 }); },
  agarrar() { tono({ f: 660, dur: 0.08, vol: 0.3, tipo: 'square' }); tono({ f: 990, dur: 0.12, vol: 0.3, tipo: 'square', delay: 0.08 }); },
  oleada() { [220, 277, 330, 440].forEach((f, i) => tono({ f, dur: 0.5, vol: 0.2, tipo: 'sawtooth', delay: i * 0.12 })); },
  explosion() {
    ruido({ dur: 1.1, f: 900, f2: 60, vol: 1.4, rate: 0.5 }); tono({ f: 70, f2: 25, dur: 0.8, vol: 1, tipo: 'sine' });
    ruido({ dur: 0.3, f: 3000, f2: 500, vol: 0.6 });
  },
  mecha() { tono({ f: 1400, dur: 0.05, vol: 0.18, tipo: 'square' }); },
  portazo() { ruido({ dur: 0.5, f: 600, f2: 120, vol: 1.0 }); tono({ f: 70, f2: 40, dur: 0.5, vol: 0.7, tipo: 'triangle' }); ruido({ dur: 0.2, f: 2500, tipo: 'bandpass', q: 4, vol: 0.4 }); },
  zap() { tono({ f: 1800, f2: 300, dur: 0.18, vol: 0.3, tipo: 'square' }); ruido({ dur: 0.15, f: 4000, tipo: 'bandpass', q: 2, vol: 0.35 }); },
  grito() { tono({ f: 650, f2: 1500, dur: 0.9, vol: 0.45, tipo: 'sawtooth' }); tono({ f: 990, f2: 1900, dur: 0.8, vol: 0.25, tipo: 'square' }); ruido({ dur: 0.9, f: 1800, f2: 3200, tipo: 'bandpass', q: 2, vol: 0.5 }); },
  escupe() { ruido({ dur: 0.25, f: 700, f2: 2400, tipo: 'bandpass', q: 3, vol: 0.6 }); tono({ f: 300, f2: 150, dur: 0.2, vol: 0.2, tipo: 'sawtooth' }); },
  salpica() { ruido({ dur: 0.3, f: 1500, f2: 300, vol: 0.5, rate: 0.8 }); },
  rebote() { tono({ f: 2400 + Math.random() * 1500, f2: 900, dur: 0.15, vol: 0.12, tipo: 'triangle' }); ruido({ dur: 0.04, f: 4000, tipo: 'highpass', vol: 0.3 }); },
  chapa() { ruido({ dur: 0.12, f: vr(2500, 0.2), tipo: 'bandpass', q: 2, vol: 0.4 }); tono({ f: 420 + Math.random() * 200, dur: 0.2, vol: 0.1, tipo: 'square' }); },
  rugido(grave = 1) {
    if (!ctx) return;
    const t = ctx.currentTime + desfase, d = 1.6;
    for (let k = 0; k < 3; k++) {
      const o = ctx.createOscillator(); o.type = 'sawtooth';
      const f0 = (55 + k * 13) * grave; o.frequency.setValueAtTime(f0, t); o.frequency.linearRampToValueAtTime(f0 * 1.5, t + 0.4); o.frequency.exponentialRampToValueAtTime(f0 * 0.6, t + d);
      const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 600; fl.Q.value = 4;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.35, t + 0.2); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(fl).connect(g).connect(sfx); o.start(t); o.stop(t + d + 0.05);
    }
    ruido({ dur: 1.4, f: 500, vol: 0.5, rate: 0.4 });
  },
  // v8: jefes y armas nuevas
  tambor(fuerte = 1) { tono({ f: 92, f2: 48, dur: 0.35, vol: 0.9 * fuerte }); ruido({ dur: 0.09, f: 1800, f2: 600, tipo: 'bandpass', q: 1.2, vol: 0.55 * fuerte }); },
  repique() { [0, 0.07, 0.14].forEach(d => ruido({ dur: 0.05, f: 2600, tipo: 'bandpass', q: 3, vol: 0.35, delay: d })); },
  latigo() { ruido({ dur: 0.25, f: 600, f2: 4200, tipo: 'bandpass', q: 2, vol: 0.5, a: 0.02 }); },
  engancha() { tono({ f: 900, f2: 300, dur: 0.15, vol: 0.3, tipo: 'square' }); ruido({ dur: 0.1, f: 3000, tipo: 'highpass', vol: 0.4 }); },
  bengala() { ruido({ dur: 0.9, f: 3000, f2: 1200, tipo: 'bandpass', q: 0.8, vol: 0.35 }); tono({ f: 300, f2: 120, dur: 0.15, vol: 0.3 }); },
  fuego() { ruido({ dur: 0.4, f: 900, f2: 400, tipo: 'bandpass', q: 0.7, vol: 0.25 }); },
  pito() { tono({ f: 1900, f2: 2100, dur: 0.35, vol: 0.25, tipo: 'square' }); tono({ f: 2100, dur: 0.25, vol: 0.22, tipo: 'square', delay: 0.4 }); },
  murga() { [523, 659, 784, 659, 523].forEach((f, i) => tono({ f, dur: 0.22, vol: 0.18, tipo: 'sawtooth', delay: i * 0.16 })); },
  bombo() { tono({ f: 70, f2: 40, dur: 0.4, vol: 0.9 }); ruido({ dur: 0.12, f: 400, vol: 0.4 }); },
  tubo() { ruido({ dur: 0.35, f: 400, f2: 120, vol: 0.9, rate: 0.6 }); tono({ f: 90, f2: 40, dur: 0.3, vol: 0.6 }); },
  gomera() { ruido({ dur: 0.08, f: 1500, f2: 3000, tipo: 'bandpass', q: 3, vol: 0.3 }); tono({ f: 500, f2: 900, dur: 0.06, vol: 0.15, tipo: 'triangle' }); },
  fal() { ruido({ dur: 0.4, f: 3300, f2: 220, vol: 1.05 }); tono({ f: 130, f2: 40, dur: 0.28, vol: 0.7 }); },
  recortada() { ruido({ dur: 0.55, f: 2200, f2: 120, vol: 1.2 }); tono({ f: 80, f2: 30, dur: 0.4, vol: 0.9 }); },
  pisoton() { tono({ f: 55, f2: 22, dur: 0.7, vol: 1.1 }); ruido({ dur: 0.6, f: 300, f2: 60, vol: 1, rate: 0.4 }); },
  carga() { ruido({ dur: 0.5, f: 200, f2: 800, vol: 0.6, rate: 0.5 }); },
  tiraPiedra() { ruido({ dur: 0.4, f: 300, f2: 1200, tipo: 'bandpass', q: 1, vol: 0.5, a: 0.1 }); },
  plata() { tono({ f: 1320, dur: 0.06, vol: 0.12, tipo: 'square' }); tono({ f: 1760, dur: 0.08, vol: 0.1, tipo: 'square', delay: 0.05 }); },
  comprar() { [523, 659, 784, 1046].forEach((f, i) => tono({ f, dur: 0.12, vol: 0.18, tipo: 'triangle', delay: i * 0.05 })); ruido({ dur: 0.1, f: 6000, tipo: 'highpass', vol: 0.2, delay: 0.2 }); },
  noPlata() { tono({ f: 200, dur: 0.15, vol: 0.25, tipo: 'square' }); tono({ f: 150, dur: 0.2, vol: 0.25, tipo: 'square', delay: 0.12 }); },
  clic() { tono({ f: 900, dur: 0.03, vol: 0.12, tipo: 'triangle' }); },
  logro() { [659, 784, 988, 1318].forEach((f, i) => tono({ f, dur: 0.25, vol: 0.15, tipo: 'sine', delay: i * 0.09 })); },
  armadura() { ruido({ dur: 0.08, f: 3500, tipo: 'bandpass', q: 6, vol: 0.4 }); tono({ f: 700, dur: 0.1, vol: 0.12, tipo: 'square' }); },
  jefe() { [110, 104, 98, 82].forEach((f, i) => tono({ f, dur: 0.9, vol: 0.3, tipo: 'sawtooth', delay: i * 0.35 })); tono({ f: 41, dur: 2.5, vol: 0.5, tipo: 'sine' }); },
  victoria() { [392, 523, 659, 784, 1046].forEach((f, i) => { tono({ f, dur: 0.8, vol: 0.18, tipo: 'triangle', delay: i * 0.18 }); tono({ f: f / 2, dur: 0.8, vol: 0.12, tipo: 'sine', delay: i * 0.18 }); }); },
  fuegoArtificial() { ruido({ dur: 0.5, f: 1800, f2: 200, vol: 0.25, delay: 0.05 }); ruido({ dur: 0.9, f: 6000, tipo: 'highpass', vol: 0.08, delay: 0.15 }); },
  muerte() { [300, 240, 180, 110].forEach((f, i) => tono({ f, f2: f * 0.8, dur: 0.5, vol: 0.3, tipo: 'sawtooth', delay: i * 0.25 })); }
};

// ---------- Música procedural ----------
// Pad oscuro en La menor + pulso tipo latido + arpegio que aparece con la tensión. Con jefe, tambores graves.
// Se agenda con un reloj de lookahead para que no dependa de los FPS.
const ESCALA = [0, 3, 5, 7, 10, 12, 15]; // menor pentatónica sobre La
let mus = null;
export const musica = {
  iniciar() {
    if (!ctx || mus) return;
    const pad = ctx.createGain(); pad.gain.value = 0; pad.connect(musBus);
    const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 500; fl.Q.value = 2; fl.connect(pad);
    const oscs = [55, 55 * 1.006, 82.4, 110 * 0.997].map((f, i) => { const o = ctx.createOscillator(); o.type = i < 2 ? 'sawtooth' : 'triangle'; o.frequency.value = f; o.connect(fl); o.start(); return o; });
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07; const lg = ctx.createGain(); lg.gain.value = 260; lfo.connect(lg).connect(fl.frequency); lfo.start();
    mus = { pad, fl, oscs, tension: 0, jefe: false, menu: true, paso: 0, prox: ctx.currentTime + 0.1, timer: null, pausa: false };
    mus.timer = setInterval(agendar, 50);
  },
  set(tension, jefe, menu) { if (!mus) return; mus.tension = tension; mus.jefe = jefe; mus.menu = menu; },
  pausa(v) { if (mus) mus.pausa = v; }
};
function nota(f, t, dur, vol, tipo = 'triangle', cutoff = 2000) {
  const o = ctx.createOscillator(); o.type = tipo; o.frequency.value = f;
  const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = cutoff;
  const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(fl).connect(g).connect(musBus); o.start(t); o.stop(t + dur + 0.05);
}
function bombo(t, vol, f0 = 90) {
  const o = ctx.createOscillator(); o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(35, t + 0.25);
  const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
  o.connect(g).connect(musBus); o.start(t); o.stop(t + 0.4);
}
function agendar() {
  if (!mus || !ctx) return;
  const ahora = ctx.currentTime + desfase, tens = mus.pausa ? 0 : mus.tension;
  const objetivo = mus.pausa ? 0.03 : mus.menu ? 0.09 : 0.06 + tens * 0.05;
  mus.pad.gain.setTargetAtTime(objetivo, ahora, 0.8);
  const bpm = mus.menu ? 70 : 78 + tens * 40 + (mus.jefe ? 14 : 0), corchea = 60 / bpm / 2;
  while (mus.prox < ahora + 0.2) {
    const t = mus.prox, p = mus.paso++;
    if (!mus.pausa) {
      // latido: pum-pum cada negra doble
      if (p % 8 === 0 || p % 8 === 1 && tens > 0.15) bombo(t, mus.menu ? 0.18 : 0.22 + tens * 0.2);
      if (mus.jefe && p % 2 === 0) bombo(t, 0.22, 60);
      if (mus.jefe && p % 4 === 3) ruidoMus(t, 0.12);
      // arpegio: aparece con la tensión
      if (!mus.menu && tens > 0.2 && (p % 2 === 0 || tens > 0.6)) {
        const grado = ESCALA[(p * 3 + (p >> 3)) % ESCALA.length] + (p % 16 >= 8 ? 0 : -2);
        nota(220 * Math.pow(2, grado / 12), t, corchea * 1.8, 0.04 + tens * 0.03, 'square', 900 + tens * 1600);
      }
      if (mus.menu && p % 16 === 0) nota(440 * Math.pow(2, ESCALA[(p >> 4) % 5] / 12), t, 2.5, 0.035, 'sine');
      // campana lejana cada tanto
      if (p % 64 === 32) nota(880 * Math.pow(2, ESCALA[(p >> 6) % 4] / 12), t, 3, 0.03, 'sine');
    }
    mus.prox += corchea;
  }
}
function ruidoMus(t, vol) {
  const s = ctx.createBufferSource(); s.buffer = ruidoBuf; const fl = ctx.createBiquadFilter(); fl.type = 'highpass'; fl.frequency.value = 5000;
  const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
  s.connect(fl).connect(g).connect(musBus); s.start(t, Math.random()); s.stop(t + 0.1);
}

// v8: render offline con el mismo sintetizador (lo usa la herramienta del tráiler; el juego no lo llama)
export const audioOffline = {
  usar(oc) {
    if (mus && mus.timer) clearInterval(mus.timer); mus = null; ctx = oc; desfase = 0;
    comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.connect(ctx.destination);
    master = ctx.createGain(); master.gain.value = 0.6; master.connect(comp);
    sfx = ctx.createGain(); sfx.gain.value = 1; sfx.connect(master);
    musBus = ctx.createGain(); musBus.gain.value = 0.5; musBus.connect(master);
    ruidoBuf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate); const d = ruidoBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    musica.iniciar(); clearInterval(mus.timer); mus.timer = null;
  },
  en(t) { desfase = t; },
  musica(t, tension, jefe, menu) { desfase = t; if (mus) { mus.tension = tension; mus.jefe = jefe; mus.menu = menu; agendar(); } },
  volMusica(v) { if (musBus) musBus.gain.setValueAtTime(v, desfase); }
};
