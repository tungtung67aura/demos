// Audio sintetizado con WebAudio: golpes, efectos y un loop de candombe (chico, repique y piano + bajo).
let ctx = null, master = null, musGain = null, sfxGain = null, ruidoBuf = null, musicaOn = true, sfxOn = true, prox = 0, paso = 0, timerMus = null;
export function iniciarAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.8; master.connect(ctx.destination);
  const comp = ctx.createDynamicsCompressor(); comp.connect(master);
  sfxGain = ctx.createGain(); sfxGain.gain.value = 0.9; sfxGain.connect(comp);
  musGain = ctx.createGain(); musGain.gain.value = 0.32; musGain.connect(comp);
  ruidoBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); const d = ruidoBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
}
export function audioOk() { return !!ctx; }
export function setMusica(v) { musicaOn = v; if (musGain) musGain.gain.value = v ? 0.32 : 0; }
export function setSfx(v) { sfxOn = v; if (sfxGain) sfxGain.gain.value = v ? 0.9 : 0; }
export function suspender(s) { if (!ctx) return; if (s) ctx.suspend(); else ctx.resume(); }

function ruido(t, dur, f, q = 1, vol = 0.5, tipo = 'bandpass', dest = sfxGain, fFin = null) {
  const s = ctx.createBufferSource(); s.buffer = ruidoBuf; s.playbackRate.value = 0.8 + Math.random() * 0.4;
  const fl = ctx.createBiquadFilter(); fl.type = tipo; fl.frequency.setValueAtTime(f, t); if (fFin) fl.frequency.exponentialRampToValueAtTime(fFin, t + dur); fl.Q.value = q;
  const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  s.connect(fl); fl.connect(g); g.connect(dest); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
}
function tonoS(t, dur, f0, f1, vol = 0.4, tipo = 'sine', dest = sfxGain) {
  const o = ctx.createOscillator(); o.type = tipo; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.02);
}
const ult = {};
export function sfx(n, fuerza = 1) {
  if (!ctx || !sfxOn) return; const t = ctx.currentTime;
  if (ult[n] && t - ult[n] < 0.025) return; ult[n] = t;
  switch (n) {
    case 'aire': ruido(t, 0.09, 1800, 0.8, 0.12, 'bandpass', sfxGain, 600); break;
    case 'pina': tonoS(t, 0.09, 180, 60, 0.55 * fuerza); ruido(t, 0.06, 2200, 0.7, 0.35 * fuerza, 'bandpass'); break;
    case 'patada': tonoS(t, 0.13, 140, 45, 0.7 * fuerza); ruido(t, 0.08, 1200, 0.8, 0.4, 'bandpass'); break;
    case 'fuerte': tonoS(t, 0.22, 120, 35, 0.9); ruido(t, 0.16, 900, 0.6, 0.55, 'lowpass', sfxGain, 200); break;
    case 'piso': tonoS(t, 0.2, 90, 30, 0.7); ruido(t, 0.18, 400, 0.6, 0.4, 'lowpass'); break;
    case 'botella': for (let i = 0; i < 4; i++) tonoS(t + i * 0.02, 0.12, 2400 + Math.random() * 2000, 1800, 0.12, 'triangle'); ruido(t, 0.18, 5000, 0.8, 0.35, 'highpass'); break;
    case 'madera': tonoS(t, 0.07, 420, 200, 0.4, 'triangle'); ruido(t, 0.12, 900, 2, 0.4); break;
    case 'metal': tonoS(t, 0.25, 900, 880, 0.18, 'square'); tonoS(t, 0.3, 1330, 1300, 0.12, 'triangle'); ruido(t, 0.1, 3000, 3, 0.3); break;
    case 'explosion': tonoS(t, 0.5, 100, 25, 1.0); ruido(t, 0.7, 1200, 0.5, 0.9, 'lowpass', sfxGain, 80); break;
    case 'agarra': ruido(t, 0.08, 700, 1, 0.3); break;
    case 'come': [523, 659, 784, 1046].forEach((f, i) => tonoS(t + i * 0.06, 0.1, f, f, 0.18, 'square')); break;
    case 'item': tonoS(t, 0.08, 660, 990, 0.2, 'square'); break;
    case 'plata': [988, 1318].forEach((f, i) => tonoS(t + i * 0.07, 0.12, f, f, 0.18, 'square')); break;
    case 'especial': tonoS(t, 0.4, 200, 900, 0.3, 'sawtooth'); ruido(t, 0.4, 600, 1, 0.4, 'bandpass', sfxGain, 3000); break;
    case 'dale': [784, 784, 1046].forEach((f, i) => tonoS(t + i * 0.1, 0.09, f, f, 0.2, 'square')); break;
    case 'ko': tonoS(t, 0.6, 300, 60, 0.4, 'sawtooth'); break;
    case 'bocina': tonoS(t, 0.5, 330, 330, 0.25, 'sawtooth'); tonoS(t, 0.5, 415, 415, 0.2, 'sawtooth'); break;
    case 'perro': tonoS(t, 0.08, 700, 400, 0.25, 'square'); tonoS(t + 0.12, 0.08, 700, 400, 0.25, 'square'); break;
    case 'menu': tonoS(t, 0.05, 880, 880, 0.12, 'square'); break;
    case 'pausa': tonoS(t, 0.1, 600, 300, 0.15, 'square'); break;
  }
}

// --------- MÚSICA: candombe ---------
// 16 semicorcheas por compás. chico: ostinato agudo; repique: llamadas; piano: base grave. + bajo y un riff.
const BPM = 126; const SEMI = 60 / BPM / 4;
const CHICO = [0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1].map((v, i) => i % 4 === 1 ? 0 : v || (i % 4 === 0 ? 0.6 : 0));
const MADERA = [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0]; // clave del candombe (madera)
const PIANO = [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0];
const REPI = [0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 1, 0];
const BAJO = [45, 0, 0, 45, 0, 0, 52, 0, 43, 0, 0, 43, 0, 0, 50, 0, 41, 0, 0, 41, 0, 0, 48, 0, 40, 0, 0, 40, 0, 47, 0, 40];
const RIFF = [69, 0, 72, 0, 74, 0, 72, 69, 0, 0, 67, 0, 69, 0, 0, 0, 65, 0, 69, 0, 72, 0, 69, 65, 0, 0, 64, 0, 67, 0, 0, 0];
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
let modo = 'nivel';
function tic() {
  if (!ctx) return;
  while (prox < ctx.currentTime + 0.12) {
    const i = paso % 16, k = paso % 32, t = prox, bar = Math.floor(paso / 16);
    if (musicaOn) {
      if (CHICO[i]) ruido(t, 0.05, 2600, 3, 0.18 * CHICO[i], 'bandpass', musGain);
      if (MADERA[i]) tonoS(t, 0.04, 1600, 1500, 0.08, 'square', musGain);
      if (PIANO[i]) { tonoS(t, 0.25, 95, 55, 0.6, 'sine', musGain); }
      if (REPI[i] && (bar % 2 === 1 || modo === 'jefe')) { tonoS(t, 0.1, 260, 160, 0.35, 'triangle', musGain); ruido(t, 0.06, 1800, 2, 0.15, 'bandpass', musGain); }
      if (BAJO[k]) { const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = mtof(BAJO[k] - 12 + (modo === 'jefe' ? -2 : 0)); const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500; const g = ctx.createGain(); g.gain.setValueAtTime(0.14, t); g.gain.exponentialRampToValueAtTime(0.001, t + SEMI * 2.5); o.connect(f); f.connect(g); g.connect(musGain); o.start(t); o.stop(t + SEMI * 3); }
      if (RIFF[k] && bar % 4 >= 2 && modo !== 'menu') { const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = mtof(RIFF[k] + (modo === 'jefe' ? -2 : 0)); const g = ctx.createGain(); g.gain.setValueAtTime(0.045, t); g.gain.exponentialRampToValueAtTime(0.001, t + SEMI * 1.8); o.connect(g); g.connect(musGain); o.start(t); o.stop(t + SEMI * 2); }
    }
    prox += SEMI; paso++;
  }
}
export function musica(m) {
  if (!ctx) return; modo = m;
  if (!timerMus) { prox = ctx.currentTime + 0.1; paso = 0; timerMus = setInterval(tic, 40); }
}
