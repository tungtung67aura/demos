export function createAudio() {
  let ctx = null;
  let muted = false;
  let noise = null;
  let musicGain = null;
  let started = false;
  let stepTimer = 0;

  function ac() {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === "suspended") ctx.resume();
    if (!musicGain) {
      musicGain = ctx.createGain();
      musicGain.gain.value = muted ? 0 : 0.04;
      musicGain.connect(ctx.destination);
    }
    return ctx;
  }

  function noiseBuffer(c) {
    if (noise) return noise;
    const len = c.sampleRate * 0.2;
    noise = c.createBuffer(1, len, c.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return noise;
  }

  function tone(freq, dur, type, gain, slide, bus) {
    if (muted || !ctx) return;
    const c = ctx;
    const t = c.currentTime;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(Math.max(40, freq), t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g);
    g.connect(bus || c.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  function blipNoise(dur, gain) {
    if (muted || !ctx) return;
    const c = ctx;
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c);
    const filter = c.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 800;
    const g = c.createGain();
    const t = c.currentTime;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(c.destination);
    src.start(t);
    src.stop(t + dur);
  }

  const melody = [262, 294, 330, 392, 330, 294, 349, 330, 294, 262, 247, 294];

  function startBed() {
    if (started || !ctx || !musicGain) return;
    started = true;
    const c = ctx;
    const drone = c.createOscillator();
    const droneGain = c.createGain();
    drone.type = "sine";
    drone.frequency.value = 98;
    droneGain.gain.value = 0.35;
    drone.connect(droneGain);
    droneGain.connect(musicGain);
    drone.start();

    const tick = () => {
      stepTimer = window.setTimeout(tick, 520);
      if (!ctx || muted) return;
      const note = melody[Math.floor(c.currentTime / 0.52) % melody.length];
      const o = c.createOscillator();
      const g = c.createGain();
      const t = c.currentTime;
      o.type = "triangle";
      o.frequency.setValueAtTime(note, t);
      g.gain.setValueAtTime(0.22, t);
      g.gain.exponentialRampToValueAtTime(0.0008, t + 0.42);
      o.connect(g);
      g.connect(musicGain);
      o.start(t);
      o.stop(t + 0.46);
    };
    tick();
  }

  const play = {
    jump: () => tone(420, 0.09, "square", 0.045, 720),
    land: () => blipNoise(0.05, 0.035),
    coin: () => {
      tone(880, 0.06, "square", 0.045, 880);
      setTimeout(() => tone(1320, 0.08, "square", 0.04, 1320), 60);
    },
    pickup: () => tone(660, 0.07, "square", 0.05, 990),
    slash: () => {
      blipNoise(0.06, 0.045);
      tone(320, 0.09, "sawtooth", 0.03, 110);
    },
    throw: () => tone(980, 0.05, "square", 0.04, 420),
    hit: () => tone(220, 0.08, "square", 0.055, 80),
    hurt: () => tone(180, 0.16, "sawtooth", 0.06, 55),
    die: () => tone(240, 0.4, "sawtooth", 0.07, 48),
    goal: () => tone(520, 0.12, "square", 0.05, 780),
    checkpoint: () => {
      tone(523, 0.08, "square", 0.04, 523);
      setTimeout(() => tone(784, 0.12, "square", 0.04, 784), 80);
    },
    roar: () => tone(90, 0.45, "sawtooth", 0.07, 48),
    stomp: () => {
      tone(70, 0.2, "square", 0.07, 36);
      blipNoise(0.1, 0.05);
    },
    empty: () => tone(140, 0.05, "square", 0.03, 90),
    win: () => {
      [523, 659, 784, 1046].forEach((f, i) => {
        setTimeout(() => tone(f, 0.18, "square", 0.05, f), i * 120);
      });
    },
  };

  return {
    unlock() {
      try {
        ac();
        startBed();
      } catch {
        /* autoplay can reject until a gesture lands */
      }
    },
    toggle() {
      muted = !muted;
      if (musicGain) musicGain.gain.value = muted ? 0 : 0.04;
      return muted;
    },
    get muted() {
      return muted;
    },
    play(name) {
      const fn = play[name];
      if (fn) fn();
    },
  };
}
