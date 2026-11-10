/* Defensa del Cerro — sonido sintetizado con WebAudio (sin archivos) + candombe procedural. */
export class Sound {
  constructor() { this.sfxOn = true; this.musicOn = true; this.ctx = null; this.last = {}; this.intensity = 0; this.mode = 'menu'; }
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const ctx = this.ctx = new AC();
    this.master = ctx.createGain(); this.master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 6;
    this.master.connect(comp); comp.connect(ctx.destination);
    this.sfx = ctx.createGain(); this.sfx.gain.value = this.sfxOn ? 0.75 : 0; this.sfx.connect(this.master);
    this.mus = ctx.createGain(); this.mus.gain.value = this.musicOn ? 0.32 : 0; this.mus.connect(this.master);
    const len = ctx.sampleRate; const buf = ctx.createBuffer(1, len, ctx.sampleRate); const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
    this.nextNote = ctx.currentTime + 0.1; this.step = 0; this.bar = 0;
    this.timer = setInterval(() => this.schedule(), 60);
  }
  setSfx(on) { this.sfxOn = on; if (this.sfx) this.sfx.gain.setTargetAtTime(on ? 0.75 : 0, this.ctx.currentTime, 0.05); }
  setMusic(on) { this.musicOn = on; if (this.mus) this.mus.gain.setTargetAtTime(on ? 0.32 : 0, this.ctx.currentTime, 0.2); }
  suspend() { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend(); }
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }

  // ---------- bloques ----------
  env(g, t, a, peak, dur) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
  tone(type, f0, f1, dur, vol, out, t, a = 0.005) {
    const c = this.ctx; t = t || c.currentTime;
    const o = c.createOscillator(), g = c.createGain(); o.type = type;
    o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    this.env(g, t, a, vol, dur); o.connect(g); g.connect(out || this.sfx); o.start(t); o.stop(t + dur + 0.02);
  }
  noise(dur, ftype, f0, f1, vol, out, t, q = 1, a = 0.003) {
    const c = this.ctx; t = t || c.currentTime;
    const s = c.createBufferSource(); s.buffer = this.noiseBuf; s.playbackRate.value = 0.8 + Math.random() * 0.4;
    const f = c.createBiquadFilter(); f.type = ftype; f.Q.value = q; f.frequency.setValueAtTime(f0, t); if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = c.createGain(); this.env(g, t, a, vol, dur);
    s.connect(f); f.connect(g); g.connect(out || this.sfx); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }

  play(name, k = 1) {
    if (!this.ctx || !this.sfxOn || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime, gap = THROTTLE[name] || 0.03;
    if (this.last[name] && now - this.last[name] < gap) return;
    this.last[name] = now;
    const v = (x) => x * k, r = 0.92 + Math.random() * 0.16;
    switch (name) {
      case 'musket': this.noise(0.12, 'bandpass', 2200 * r, 900, v(0.4), 0, 0, 0.9); this.tone('square', 240 * r, 70, 0.06, v(0.06)); break;
      case 'rifle': this.noise(0.2, 'bandpass', 1600 * r, 500, v(0.5), 0, 0, 0.8); this.tone('sine', 180, 60, 0.12, v(0.2)); break;
      case 'cannon': this.noise(0.45, 'lowpass', 900, 150, v(0.6)); this.tone('sine', 120 * r, 38, 0.35, v(0.55)); break;
      case 'mortar': this.tone('sine', 95 * r, 40, 0.28, v(0.5)); this.noise(0.22, 'lowpass', 500, 120, v(0.35)); this.tone('sine', 900, 1600, 0.25, v(0.04), 0, now + 0.05); break;
      case 'boom': this.noise(0.55, 'lowpass', 1100 * r, 160, v(0.5)); this.tone('sine', 75 * r, 30, 0.45, v(0.45)); break;
      case 'bigboom': this.noise(0.9, 'lowpass', 1400, 100, v(0.7)); this.tone('sine', 60, 25, 0.8, v(0.7)); this.noise(0.4, 'highpass', 3000, 1500, v(0.1), 0, now + 0.05); break;
      case 'bolt': this.tone('triangle', 700 * r, 180, 0.12, v(0.22)); this.noise(0.06, 'highpass', 3000, 2000, v(0.1)); break;
      case 'cone': this.noise(0.3, 'bandpass', 1400, 400, v(0.55), 0, 0, 0.6); this.tone('sawtooth', 160, 50, 0.2, v(0.12)); break;
      case 'gust': this.noise(0.45, 'bandpass', 500, 1600, v(0.07), 0, 0, 2, 0.08); break;
      case 'hit': this.noise(0.04, 'highpass', 2500 * r, 2500, v(0.12)); break;
      case 'death': this.tone('sine', 380 * r, 820 * r, 0.09, v(0.13)); this.noise(0.05, 'bandpass', 1800, 900, v(0.08)); break;
      case 'splash': this.noise(0.5, 'bandpass', 1200, 300, v(0.3), 0, 0, 0.7, 0.01); this.tone('sine', 300, 90, 0.3, v(0.15)); break;
      case 'squawk': this.tone('sawtooth', 900 * r, 1400, 0.08, v(0.08)); this.tone('sawtooth', 1300, 700, 0.1, v(0.07), 0, now + 0.08); break;
      case 'coin': this.tone('square', 988, 988, 0.06, v(0.05)); this.tone('square', 1319, 1319, 0.14, v(0.05), 0, now + 0.06); break;
      case 'build': this.tone('sine', 190, 120, 0.09, v(0.35)); this.noise(0.06, 'bandpass', 900, 600, v(0.2)); this.tone('sine', 220, 140, 0.09, v(0.3), 0, now + 0.11); this.noise(0.06, 'bandpass', 1000, 700, v(0.18), 0, now + 0.11); break;
      case 'upgrade': [523, 659, 784, 1047].forEach((f, i) => this.tone('triangle', f, f, 0.18, v(0.16), 0, now + i * 0.06)); break;
      case 'sell': [1047, 784, 659].forEach((f, i) => this.tone('square', f, f, 0.08, v(0.05), 0, now + i * 0.05)); break;
      case 'leak': this.tone('sawtooth', 110, 55, 0.45, v(0.22)); this.noise(0.3, 'lowpass', 500, 100, v(0.3)); break;
      case 'wave': [196, 262].forEach((f, i) => { this.tone('sawtooth', f, f, 0.5, v(0.09), 0, now + i * 0.28, 0.04); this.tone('triangle', f * 2, f * 2, 0.5, v(0.06), 0, now + i * 0.28, 0.04); }); break;
      case 'boss': [98, 92, 98].forEach((f, i) => { this.tone('sawtooth', f, f * 0.98, 0.7, v(0.16), 0, now + i * 0.45, 0.08); this.tone('square', f * 1.5, f * 1.5, 0.7, v(0.05), 0, now + i * 0.45, 0.08); }); this.noise(1.6, 'lowpass', 200, 80, v(0.4), 0, now, 1, 0.3); break;
      case 'victory': [523, 659, 784, 1047, 784, 1047].forEach((f, i) => this.tone('triangle', f, f, i === 5 ? 0.9 : 0.2, v(0.2), 0, now + i * 0.13)); [262, 330, 392].forEach((f) => this.tone('sine', f, f, 1.2, v(0.1), 0, now + 0.65, 0.05)); break;
      case 'defeat': [392, 349, 311, 262].forEach((f, i) => this.tone('triangle', f, f * (i === 3 ? 0.97 : 1), i === 3 ? 1.1 : 0.32, v(0.18), 0, now + i * 0.3)); this.noise(1.5, 'lowpass', 300, 60, v(0.3), 0, now + 0.9); break;
      case 'click': this.tone('sine', 1200, 900, 0.035, v(0.1)); break;
      case 'open': this.tone('sine', 600, 900, 0.06, v(0.08)); break;
      case 'error': this.tone('square', 140, 120, 0.12, v(0.08)); break;
      case 'bombcall': this.tone('sine', 1900, 350, 0.9, v(0.08), 0, now, 0.05); this.tone('sine', 1700, 300, 0.9, v(0.06), 0, now + 0.25, 0.05); break;
      case 'flare': this.tone('sine', 300, 1400, 0.25, v(0.1)); this.noise(1.6, 'highpass', 4000, 2000, v(0.12), 0, now + 0.2, 1, 0.05); break;
      case 'troops': [392, 523, 659, 784].forEach((f, i) => this.tone('square', f, f, i === 3 ? 0.35 : 0.11, v(0.07), 0, now + i * 0.1)); this.noise(0.3, 'lowpass', 400, 200, v(0.15), 0, now + 0.05); break;
      case 'freeze': this.tone('sine', 1800, 2400, 0.15, v(0.07)); this.tone('sine', 2600, 3100, 0.2, v(0.05), 0, now + 0.04); break;
      case 'heal': this.tone('sine', 660, 990, 0.2, v(0.05)); break;
      case 'shieldbreak': this.noise(0.18, 'highpass', 3500, 1800, v(0.25)); this.tone('triangle', 1500, 500, 0.18, v(0.12)); break;
      case 'disabled': this.tone('square', 200, 90, 0.2, v(0.12)); this.noise(0.25, 'bandpass', 1500, 500, v(0.2)); break;
      case 'push': this.noise(0.6, 'bandpass', 300, 1200, v(0.25), 0, 0, 1.5, 0.05); break;
      case 'slash': this.noise(0.08, 'highpass', 2500, 5000, v(0.12)); this.tone('triangle', 1200, 1800, 0.05, v(0.05)); break;
      case 'star': this.tone('triangle', 1319 * k, 1319 * k, 0.4, 0.18); this.tone('sine', 2637 * k, 2637 * k, 0.3, 0.05); break;
      case 'achievement': [784, 988, 1175, 1568].forEach((f, i) => this.tone('triangle', f, f, 0.3, v(0.12), 0, now + i * 0.07)); break;
      case 'tick': this.tone('sine', 1000, 1000, 0.05, v(0.06)); break;
    }
  }

  // ---------- candombe (madera, chico, repique, piano) + bajo y acordes ----------
  schedule() {
    const c = this.ctx; if (!c || c.state !== 'running') return;
    const bpm = this.mode === 'menu' ? 96 : 108 + this.intensity * 8, s16 = 60 / bpm / 4;
    while (this.nextNote < c.currentTime + 0.25) {
      const t = this.nextNote, i = this.step % 16, bar = this.bar;
      if (this.musicOn) this.beat(t, i, bar);
      this.nextNote += s16; this.step++;
      if (this.step % 16 === 0) this.bar++;
    }
  }
  beat(t, i, bar) {
    const out = this.mus, inten = this.intensity, menu = this.mode === 'menu';
    // madera (palo en el borde del tambor): clave del candombe
    if ([0, 3, 6, 10, 12].includes(i)) this.noise(0.03, 'bandpass', 3200, 3200, 0.18, out, t, 4);
    // chico: el corazón, constante
    if (i % 4 !== 0) this.tone('sine', i % 4 === 1 ? 520 : 470, 380, 0.07, i % 4 === 1 ? 0.12 : 0.07, out, t);
    // piano: graves
    const pianoHits = menu ? [0, 7, 8] : [0, 6, 8, 11, 14];
    if (pianoHits.includes(i)) this.tone('sine', i === 8 ? 82 : 110, 60, 0.22, 0.42, out, t);
    // repique: más llamadas cuando sube la intensidad
    if (!menu && ((i === 14 || i === 15) || (inten > 0.4 && [2, 5, 9, 13].includes(i)) || (inten > 0.8 && i % 2 === 1)))
      this.tone('sine', 300 + (i % 3) * 30, 200, 0.09, 0.14 + inten * 0.05, out, t);
    // armonía: La menor - Fa - Do - Sol, notas cortas de marimba
    const prog = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]][(bar >> 1) % 4];
    const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
    if (i === 0) this.tone('triangle', mtof(prog[0] - 12), mtof(prog[0] - 12), 0.5, 0.12, out, t, 0.01);
    if (i === 8 && !menu) this.tone('triangle', mtof(prog[2] - 12), mtof(prog[2] - 12), 0.35, 0.09, out, t, 0.01);
    const mel = [0, 3, 7, 10, 12, 14];
    if (mel.includes(i) && ((bar + i) % 3 !== 0)) { const n = prog[(i + bar) % 3] + 12; this.tone('sine', mtof(n), mtof(n), 0.18, 0.05, out, t, 0.004); }
  }
}
const THROTTLE = { musket: 0.05, rifle: 0.06, cannon: 0.08, mortar: 0.1, boom: 0.07, bigboom: 0.15, bolt: 0.06, gust: 0.35, hit: 0.04, death: 0.04, coin: 0.06, splash: 0.15, squawk: 0.2, heal: 0.3, freeze: 0.15, slash: 0.1, cone: 0.1, push: 0.3, tick: 0.2 };
