/* Rambla Run — endless runner por la Rambla de Montevideo */
'use strict';
(function () {
  // ---------- utils ----------
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];
  const smooth = (t) => t * t * (3 - 2 * t);
  const easeOutBack = (t) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
  const rgb = (c, a) => a === undefined ? `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})` : `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
  };
  const QS = new URLSearchParams(location.search);

  // ---------- canvas / layout ----------
  const canvas = $('game');
  const ctx = canvas.getContext('2d');
  let W = 540, H = 800, scale = 1, dpr = 1, GY = 600, HORIZON = 430, PX = 100, safeTop = 0;
  const FONT = '"Lilita", "Nunito", system-ui, sans-serif';

  function resize() {
    const cw = Math.max(1, window.innerWidth), ch = Math.max(1, window.innerHeight);
    dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    // Mundo lógico: al menos 540 de ancho (vista suficiente en vertical), 800 de alto en apaisado.
    if (cw / ch * 800 < 540) { W = 540; scale = cw / 540; H = ch / scale; }
    else { H = 800; scale = ch / 800; W = cw / scale; }
    GY = Math.round(H - clamp(H * 0.21, 150, 260));
    HORIZON = GY - 150;
    PX = Math.round(Math.min(W * 0.2, 130));
    const probe = getComputedStyle($('safe-probe'));
    safeTop = (parseFloat(probe.paddingTop) || 0) / scale;
    buildSkyline();
  }

  // ---------- palettes / time of day ----------
  const PAL = [
    { top: '#3f8fe0', mid: '#7fc0f2', bot: '#d4f0ff', seaT: '#4a9bd0', seaB: '#1d5f8f', city: '#86a3c0', city2: '#a8c0d8', sun: '#fff4c2', dk: 0 },
    { top: '#4b6cc4', mid: '#f0a98c', bot: '#ffdda0', seaT: '#5c84b4', seaB: '#294d7a', city: '#6d6c98', city2: '#8d86ac', sun: '#ffd27a', dk: 0.12 },
    { top: '#2a1c5c', mid: '#d6487a', bot: '#ff9e5a', seaT: '#7c4278', seaB: '#2b224f', city: '#3a2450', city2: '#583466', sun: '#ff7a4a', dk: 0.28 },
    { top: '#060a24', mid: '#141e56', bot: '#2c3878', seaT: '#162250', seaB: '#070c22', city: '#11153a', city2: '#1b2050', sun: '#eef3ff', dk: 0.55 },
  ].map((p) => { const o = { dk: p.dk }; for (const k in p) if (k !== 'dk') o[k] = hex(p[k]); return o; });
  let tod = 2.05; // 0 día, 1 dorado, 2 atardecer, 3 noche
  function palette() {
    const t = ((tod % 4) + 4) % 4, i = Math.floor(t), j = (i + 1) % 4;
    const f = smooth(clamp((t - i - 0.35) / 0.65, 0, 1)); // mantener cada paleta un rato
    const a = PAL[i], b = PAL[j], o = { dk: lerp(a.dk, b.dk, f) };
    for (const k in a) if (k !== 'dk') o[k] = mixc(a[k], b[k], f);
    o.night = clamp(1 - Math.abs(t - 3) / 0.8, 0, 1) + (t < 0.2 ? (0.2 - t) / 0.2 * 0.3 : 0);
    return o;
  }

  // ---------- background data ----------
  let skyline = [], stars = [], clouds = [];
  const SKY_LEN = 2400;
  function buildSkyline() {
    skyline = [];
    let x = 0;
    while (x < SKY_LEN) {
      if (x > 900 && x < 1000 && !skyline.some((b) => b.salvo)) {
        skyline.push({ x, w: 74, h: 150, salvo: true, win: makeWins(74, 150) }); x += 84; continue;
      }
      const w = rand(28, 70), h = rand(40, 125) * (Math.random() < 0.15 ? 1.35 : 1);
      skyline.push({ x, w, h, roof: Math.random() < 0.25 ? 1 : 0, win: makeWins(w, h) });
      x += w + rand(-6, 8);
    }
    if (!stars.length) for (let i = 0; i < 90; i++) stars.push({ x: Math.random(), y: Math.random(), r: rand(0.6, 1.9), p: rand(0, 6.28) });
    if (!clouds.length) for (let i = 0; i < 6; i++) clouds.push({ x: rand(0, 1600), y: rand(0.15, 0.6), s: rand(0.7, 1.4) });
  }
  function makeWins(w, h) {
    const out = [];
    for (let yy = 8; yy < h - 6; yy += 11) for (let xx = 5; xx < w - 6; xx += 9) if (Math.random() < 0.38) out.push(xx, yy);
    return out;
  }

  // ---------- audio ----------
  const AudioFX = {
    ctx: null, master: null, sfxBus: null, musicBus: null, sfx: store.get('rr_sfx', true), music: store.get('rr_music', true),
    nextNote: 0, step: 0, timer: null, bar: 0,
    init() {
      if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -14; comp.ratio.value = 4;
      this.master = this.ctx.createGain(); this.master.gain.value = 0.9;
      this.sfxBus = this.ctx.createGain(); this.sfxBus.gain.value = this.sfx ? 1 : 0;
      this.musicBus = this.ctx.createGain(); this.musicBus.gain.value = this.music ? 0.55 : 0;
      this.sfxBus.connect(this.master); this.musicBus.connect(this.master); this.master.connect(comp); comp.connect(this.ctx.destination);
      const len = this.ctx.sampleRate * 1;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    },
    setSfx(on) { this.sfx = on; store.set('rr_sfx', on); if (this.sfxBus) this.sfxBus.gain.setTargetAtTime(on ? 1 : 0, this.ctx.currentTime, 0.02); },
    setMusic(on) { this.music = on; store.set('rr_music', on); if (this.musicBus) this.musicBus.gain.setTargetAtTime(on ? 0.55 : 0, this.ctx.currentTime, 0.05); },
    tone(f, dur, type, vol, f2, delay, bus) {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + (delay || 0);
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
      if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(bus || this.sfxBus); o.start(t); o.stop(t + dur + 0.02);
    },
    noise(dur, vol, freq, ftype, delay, bus, f2) {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + (delay || 0);
      const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf;
      const fl = this.ctx.createBiquadFilter(); fl.type = ftype || 'lowpass'; fl.frequency.setValueAtTime(freq, t);
      if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
      const g = this.ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(fl); fl.connect(g); g.connect(bus || this.sfxBus); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
    },
    play(name, n) {
      if (!this.ctx || !this.sfx) return;
      switch (name) {
        case 'jump': this.tone(330, 0.16, 'square', 0.07, 700); this.tone(660, 0.12, 'triangle', 0.08, 1100); break;
        case 'djump': this.tone(520, 0.2, 'triangle', 0.12, 1500); this.tone(1040, 0.14, 'sine', 0.05, 2200, 0.04); this.noise(0.15, 0.06, 3000, 'highpass'); break;
        case 'land': this.tone(160, 0.09, 'sine', 0.16, 60); this.noise(0.06, 0.05, 600); break;
        case 'slide': this.noise(0.32, 0.12, 2400, 'bandpass', 0, null, 500); break;
        case 'slam': this.tone(240, 0.12, 'sine', 0.2, 50); this.noise(0.12, 0.12, 900); break;
        case 'coin': {
          const f = 988 * Math.pow(2, Math.min(n || 0, 14) / 12);
          this.tone(f, 0.08, 'square', 0.035); this.tone(f * 1.5, 0.18, 'sine', 0.09, null, 0.055); break;
        }
        case 'near': this.noise(0.25, 0.14, 800, 'bandpass', 0, null, 4000); this.tone(880, 0.12, 'triangle', 0.06, 1760, 0.05); break;
        case 'mult': [0, 4, 7, 12].forEach((s, i) => this.tone(523 * Math.pow(2, (s + (n || 0) * 2) / 12), 0.16, 'square', 0.05, null, i * 0.06)); break;
        case 'power': [0, 5, 9, 12, 17].forEach((s, i) => this.tone(440 * Math.pow(2, s / 12), 0.2, 'triangle', 0.1, null, i * 0.05)); break;
        case 'shield': this.noise(0.4, 0.2, 5000, 'highpass'); this.tone(1200, 0.3, 'sine', 0.1, 300); break;
        case 'hit': this.noise(0.5, 0.35, 1600, 'lowpass', 0, null, 200); this.tone(180, 0.45, 'square', 0.12, 40); this.tone(90, 0.5, 'sine', 0.3, 35); break;
        case 'over': [7, 4, 0, -5].forEach((s, i) => this.tone(392 * Math.pow(2, s / 12), 0.28, 'triangle', 0.11, null, 0.35 + i * 0.16)); break;
        case 'record': [0, 4, 7, 12, 7, 12, 16].forEach((s, i) => this.tone(523 * Math.pow(2, s / 12), 0.22, 'square', 0.05, null, 0.4 + i * 0.09)); break;
        case 'click': this.tone(700, 0.05, 'triangle', 0.08, 900); break;
        case 'lose': this.tone(500, 0.18, 'triangle', 0.05, 250); break;
        case 'bell': this.tone(1760, 0.25, 'sine', 0.06); this.tone(2350, 0.25, 'sine', 0.04, null, 0.12); break;
      }
    },
    // Candombe liviano: madera, chico, piano + bajo
    startMusic() {
      if (!this.ctx || this.timer) return;
      this.nextNote = this.ctx.currentTime + 0.08; this.step = 0; this.bar = 0;
      this.timer = setInterval(() => this.schedule(), 25);
    },
    stopMusic() { clearInterval(this.timer); this.timer = null; },
    schedule() {
      const spb = 60 / 126 / 4;
      const madera = 'x.x.x.xx.x.x.x..', chico = '.xx..xx..xx..xx.', piano = 'x..x..x...x.x...';
      const roots = [110, 87.31, 130.81, 98];
      while (this.nextNote < this.ctx.currentTime + 0.12) {
        const s = this.step % 16, t = this.nextNote - this.ctx.currentTime, b = this.musicBus;
        if (madera[s] === 'x') this.noise(0.03, 0.09, 2800, 'bandpass', t, b);
        if (chico[s] === 'x') this.tone(s % 4 === 1 ? 420 : 380, 0.06, 'sine', s % 4 === 1 ? 0.08 : 0.05, 300, t, b);
        if (piano[s] === 'x') this.tone(85, 0.22, 'sine', 0.22, 55, t, b);
        if (s === 0 || s === 10) this.tone(roots[this.bar % 4], 0.38, 'triangle', 0.12, null, t, b);
        if (s % 4 === 2 && this.bar % 2 === 1) {
          const sc = [0, 3, 5, 7, 10, 12];
          this.tone(roots[this.bar % 4] * 4 * Math.pow(2, pick(sc) / 12), 0.14, 'triangle', 0.035, null, t, b);
        }
        this.nextNote += spb; this.step++; if (this.step % 16 === 0) this.bar++;
      }
    },
  };

  // ---------- game state ----------
  const G = 2800, JUMP_V = -1020, DJUMP_V = -900, SLIDE_T = 0.62, COMBO_T = 2.1;
  const MULT_AT = [0, 12, 30, 60, 100]; // combos necesarios para ×2..×5
  const PH = 80, PW = 30, SLIDE_H = 38;
  let state = 'menu', stateT = 0, elapsed = 0;
  let speed = 0, dist = 0, score = 0, pickups = 0, mates = 0;
  let combo = 0, comboT = 0, mult = 1, bestMult = 1, multPulse = 0;
  let best = store.get('rr_best', 0);
  let obstacles = [], coins = [], powerups = [], particles = [], popups = [];
  let spawnDist = 0, lastPattern = '', patternRepeat = 0, powerT = 0;
  let shake = 0, hitStop = 0, flash = 0, flashColor = '255,255,255', slowmo = 1;
  let hintT = 0, hint = '', seenGull = store.get('rr_seen_gull', false), worldX = 0;
  let newRecord = false;
  const player = {
    y: 0, vy: 0, onGround: true, jumps: 0, slideT: 0, sx: 1, sy: 1, svx: 0, svy: 0,
    phase: 0, rot: 0, flipT: 0, shield: 0, inv: 0, dustT: 0, dead: false, coyote: 0, buffer: 0, airT: 0,
  };
  function diff() { return 1 - Math.exp(-elapsed / 72); }
  function targetSpeed() { return state === 'play' ? 330 + 320 * diff() : 240; }

  function resetRun() {
    elapsed = 0; dist = 0; score = 0; pickups = 0; mates = 0; combo = 0; comboT = 0; mult = 1; bestMult = 1;
    obstacles = []; coins = []; powerups = []; popups = []; particles = [];
    spawnDist = 520; lastPattern = ''; patternRepeat = 0; powerT = rand(22, 30);
    Object.assign(player, { y: 0, vy: 0, onGround: true, jumps: 0, slideT: 0, sx: 1, sy: 1, svx: 0, svy: 0, rot: 0, flipT: 0, shield: 0, inv: 0, dead: false, coyote: 0, buffer: 0 });
    shake = 0; hitStop = 0; flash = 0; slowmo = 1; newRecord = false;
    hint = 'TOCÁ PARA SALTAR'; hintT = 3.2;
  }

  // ---------- spawning ----------
  const OB = {
    cone: { w: 34, h: 46 }, bench: { w: 104, h: 50 }, cart: { w: 96, h: 84 },
    gull: { w: 56, h: 30, fly: 62 }, bike: { w: 86, h: 72, vx: 150 },
  };
  function addOb(type, xOff) {
    const d = OB[type];
    const o = { type, x: W + 40 + (xOff || 0), w: d.w, h: d.h, vx: d.vx || 0, fly: d.fly || 0, t: rand(0, 6), passed: false, near: 999, dead: false };
    obstacles.push(o);
    if (type === 'bike') AudioFX.play('bell');
    if (type === 'gull' && !seenGull && state === 'play') { hint = 'DESLIZÁ ↓ PARA BARRERTE'; hintT = 2.6; seenGull = true; store.set('rr_seen_gull', true); }
    return o;
  }
  function coinArc(cx, rel) {
    // arco que sigue la parábola real del salto a la velocidad actual
    const v = speed + (rel || 0), air = -2 * JUMP_V / G, x0 = cx - v * air / 2;
    for (let i = 1; i < 9; i++) {
      const t = (i / 9) * air;
      coins.push({ x: x0 + v * t, y: GY - 40 - (-JUMP_V * t - 0.5 * G * t * t), bob: i * 0.5, got: false, rel: 0 });
    }
  }
  function coinLine(x, y, n, gap) { for (let i = 0; i < n; i++) coins.push({ x: x + i * gap, y, bob: i * 0.6, got: false, rel: 0 }); }

  function spawnPattern() {
    const d = diff(), opts = [['cone', 3], ['bench', 3]];
    if (elapsed > 7) opts.push(['gull', 2.4]);
    if (d > 0.12) opts.push(['cart', 2]);
    if (d > 0.3) opts.push(['bike', 1.6]);
    if (d > 0.36) opts.push(['cone2', 1.4]);
    if (d > 0.55) opts.push(['combo', 1.2], ['gull2', 1]);
    let total = 0; for (const o of opts) total += (o[0] === lastPattern && patternRepeat >= 1) ? 0 : o[1];
    let r = Math.random() * total, p = 'cone';
    for (const o of opts) { const w = (o[0] === lastPattern && patternRepeat >= 1) ? 0 : o[1]; if ((r -= w) <= 0) { p = o[0]; break; } }
    patternRepeat = p === lastPattern ? patternRepeat + 1 : 0; lastPattern = p;
    let len = 0;
    const withCoins = Math.random() < 0.7;
    switch (p) {
      case 'cone': case 'bench': case 'cart': {
        const o = addOb(p); len = o.w; if (withCoins) coinArc(o.x + o.w / 2); break;
      }
      case 'bike': { const o = addOb('bike'); len = o.w + 120; break; }
      case 'gull': { const o = addOb('gull'); len = o.w; if (withCoins) coinLine(o.x - 40, GY - 20, 4, 44); break; }
      case 'cone2': { addOb('cone'); addOb('cone', 140); len = 174; if (withCoins) coinArc(W + 40 + 87); break; }
      case 'gull2': { addOb('gull'); addOb('gull', 120); len = 176; if (withCoins) coinLine(W, GY - 20, 6, 40); break; }
      case 'combo': {
        addOb('cone'); const gx = Math.max(300, speed * 0.62); addOb('gull', gx); len = gx + 56;
        if (withCoins) { coinArc(W + 40 + 17); coinLine(W + 40 + gx - 30, GY - 20, 3, 44); } break;
      }
    }
    if (!withCoins && Math.random() < 0.5) coinLine(W + 40 + len + speed * 0.35, GY - 40, 5, 46);
    const react = lerp(1.3, 0.9, d) + rand(0, 0.6) * (1 - 0.45 * d) + Math.max(0, 15 - elapsed) / 15 * 0.45; // arranque más amable
    spawnDist = len + speed * react + (p === 'bike' ? speed * 0.25 : 0);
    if (state === 'play' && powerT <= 0 && p !== 'combo') {
      powerups.push({ x: W + 40 + len + (spawnDist - len) * 0.5, y: GY - 150, t: 0 });
      powerT = rand(28, 42);
    }
  }

  // ---------- particles & popups ----------
  function burst(x, y, n, colors, o) {
    o = o || {};
    for (let i = 0; i < n; i++) {
      const a = o.angle !== undefined ? o.angle + rand(-o.spread, o.spread) : rand(0, Math.PI * 2);
      const s = rand(o.min || 80, o.max || 320);
      particles.push({ x, y, vx: Math.cos(a) * s + (o.vx || 0), vy: Math.sin(a) * s, life: rand(0.35, o.life || 0.8), max: 0, r: rand(o.r0 || 2, o.r1 || 5),
        c: pick(colors), g: o.g === undefined ? 900 : o.g, shape: o.shape || 'c', spin: rand(-8, 8), a: rand(0, 6), drag: o.drag || 0.9 });
      particles[particles.length - 1].max = particles[particles.length - 1].life;
    }
  }
  let chain = null;
  function chainPopup(v) {
    // un solo cartel que acumula la racha de mates, arriba a la derecha del corredor
    if (chain && chain.life > 0.55 && popups.includes(chain)) {
      chain.val += v; chain.text = '+' + chain.val; chain.life = chain.max; chain.size = Math.min(40, chain.size + 1.2); chain.bump = 1;
    } else {
      chain = { text: '+' + v, val: v, x: PX + 70, y: GY + player.y - 120, life: 0.95, max: 0.95, color: '#ffd36b', size: 26, bump: 1 };
      popups.push(chain);
    }
    chain.color = ['#ffffff', '#ffd36b', '#ffa94d', '#ff7a7a', '#ff5ec4'][mult - 1];
  }
  function popup(text, x, y, color, size) { popups.push({ text, x, y, life: 0.95, max: 0.95, color: color || '#fff', size: size || 30 }); }

  function addCombo(x, y) {
    combo++; comboT = COMBO_T;
    let m = 1; for (let i = 1; i < MULT_AT.length; i++) if (combo >= MULT_AT[i]) m = i + 1;
    if (m > mult) {
      mult = m; multPulse = 1; bestMult = Math.max(bestMult, m);
      popup('×' + m + ' COMBO!', W / 2, GY - 260, '#ffd36b', 46);
      flash = 0.35; flashColor = '255,200,90';
      AudioFX.play('mult', m);
      burst(W / 2, GY - 270, 24, ['#ffd36b', '#ff7aa2', '#7fe0ff', '#fff'], { shape: 's', g: 300, max: 420 });
    }
  }

  // ---------- input ----------
  function jump() {
    if (state !== 'play' || player.dead) return;
    const p = player;
    if (p.onGround || p.coyote > 0) {
      p.vy = JUMP_V; p.onGround = false; p.jumps = 1; p.coyote = 0; p.slideT = 0;
      p.sy = 1.32; p.sx = 0.76; AudioFX.play('jump');
      burst(PX, GY, 8, ['#f3e7d3', '#e2d3bb'], { angle: Math.PI, spread: 0.9, min: 60, max: 180, g: 200, r0: 3, r1: 6, life: 0.5 });
    } else if (p.jumps < 2) {
      p.vy = DJUMP_V; p.jumps = 2; p.flipT = 0.42; p.sy = 1.25; p.sx = 0.8; AudioFX.play('djump');
      burst(PX, GY + p.y - 20, 14, ['#fff', '#bfeaff', '#ffd36b'], { shape: 's', g: 100, min: 60, max: 260, life: 0.6 });
    } else { p.buffer = 0.14; }
  }
  function slide() {
    if (state !== 'play' || player.dead) return;
    const p = player;
    if (!p.onGround) { p.vy = Math.max(p.vy, 2300); p.slam = true; p.buffer = 0; p.slideQueued = true; return; }
    if (p.slideT <= 0) { AudioFX.play('slide'); p.sx = 1.35; p.sy = 0.7; }
    p.slideT = SLIDE_T;
  }
  let touch = null;
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    AudioFX.init();
    if (state === 'menu' || state === 'over') return;
    touch = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId, swiped: false };
    jump();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!touch || touch.id !== e.pointerId || touch.swiped) return;
    const dy = e.clientY - touch.y, dx = e.clientX - touch.x;
    if (dy > 28 && dy > Math.abs(dx) * 1.1) { touch.swiped = true; slide(); }
  });
  const endTouch = (e) => { if (touch && touch.id === e.pointerId) touch = null; };
  canvas.addEventListener('pointerup', endTouch);
  canvas.addEventListener('pointercancel', endTouch);
  window.addEventListener('keydown', (e) => {
    const k = e.key;
    if (['ArrowUp', 'ArrowDown', ' ', 'w', 's'].includes(k)) e.preventDefault();
    AudioFX.init();
    if (e.repeat && k !== 'ArrowDown' && k !== 's') return;
    if (state === 'play') {
      if (k === 'ArrowUp' || k === ' ' || k === 'w') jump();
      else if (k === 'ArrowDown' || k === 's') slide();
      else if (k === 'p' || k === 'P' || k === 'Escape') pauseGame();
    } else if (state === 'paused') {
      if (k === 'p' || k === 'P' || k === 'Escape' || k === ' ') resumeGame();
    } else if ((state === 'menu' || (state === 'over' && stateT > 0.6)) && (k === ' ' || k === 'Enter')) startGame();
  });
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('dblclick', (e) => e.preventDefault());
  document.addEventListener('contextmenu', (e) => e.preventDefault());

  // ---------- flow ----------
  const ui = {
    menu: $('menu'), pause: $('pause'), over: $('over'), pauseBtn: $('btn-pause'),
  };
  function show(el, on) { el.classList.toggle('show', on); el.setAttribute('aria-hidden', on ? 'false' : 'true'); }
  let resumeT = 0;
  function startGame() {
    AudioFX.init(); AudioFX.play('click');
    resetRun();
    state = 'play'; stateT = 0; speed = Math.max(speed, 260);
    show(ui.menu, false); show(ui.over, false); show(ui.pause, false);
    ui.pauseBtn.classList.remove('hidden');
    AudioFX.startMusic();
  }
  function pauseGame() {
    if (state !== 'play') return;
    state = 'paused'; AudioFX.stopMusic(); AudioFX.play('click');
    show(ui.pause, true); ui.pauseBtn.classList.add('hidden'); touch = null;
  }
  function resumeGame() {
    if (state !== 'paused') return;
    AudioFX.init(); AudioFX.play('click');
    state = 'play'; resumeT = 1.5; show(ui.pause, false); ui.pauseBtn.classList.remove('hidden');
    AudioFX.startMusic();
  }
  function toMenu() {
    AudioFX.play('click'); AudioFX.stopMusic();
    state = 'menu'; stateT = 0; obstacles = []; coins = []; powerups = []; popups = [];
    Object.assign(player, { y: 0, vy: 0, onGround: true, dead: false, rot: 0, slideT: 0, flipT: 0, shield: 0 });
    show(ui.pause, false); show(ui.over, false); show(ui.menu, true); ui.pauseBtn.classList.add('hidden');
    $('menu-best').textContent = best;
  }
  function die() {
    state = 'dying'; stateT = 0;
    const p = player; p.dead = true; p.onGround = false; p.vy = -820; p.slideT = 0; p.flipT = 0;
    hitStop = 0.11; shake = 24; flash = 0.7; flashColor = '255,255,255';
    const cy = GY + p.y - 40;
    burst(PX + 10, cy, 28, ['#ffffff', '#ffd36b', '#ff7a5a', '#6ec6ff'], { shape: 's', g: 500, min: 120, max: 520, life: 1 });
    burst(PX + 10, GY, 14, ['#e9dcc6', '#cbb999'], { angle: -Math.PI / 2, spread: 1.2, min: 80, max: 260, r0: 4, r1: 8 });
    popup('¡AY!', PX + 40, cy - 50, '#ff8a7a', 44);
    AudioFX.play('hit'); AudioFX.stopMusic();
    if (navigator.vibrate) try { navigator.vibrate(60); } catch (e) { /* ignore */ }
  }
  function gameOver() {
    state = 'over'; stateT = 0;
    const final = Math.floor(score);
    newRecord = final > best && final > 0;
    if (newRecord) { best = final; store.set('rr_best', best); }
    $('record-badge').classList.toggle('hidden', !newRecord);
    $('over-title').textContent = newRecord ? '¡VAMO ARRIBA!' : pick(['¡TE CAÍSTE!', '¡QUÉ PORRAZO!', '¡UH, CASI!']);
    $('st-m').textContent = Math.floor(dist / 50);
    $('st-mates').textContent = mates;
    $('st-combo').textContent = '×' + bestMult;
    $('over-best').textContent = best;
    const el = $('over-score'), t0 = performance.now(), dur = Math.min(1100, 300 + final * 2);
    el.textContent = '0';
    (function count(now) {
      const k = clamp((now - t0) / dur, 0, 1);
      el.textContent = Math.round(final * easeOutCubic(k));
      if (k < 1 && state === 'over') requestAnimationFrame(count);
    })(t0);
    show(ui.over, true); ui.pauseBtn.classList.add('hidden');
    AudioFX.play(newRecord ? 'record' : 'over');
  }

  // ---------- autopilot (solo para pruebas: ?bot=1) ----------
  let BOT = QS.get('bot') === '1';
  const BOT_SKILL = parseFloat(QS.get('skill') || '1');
  function autopilot() {
    if (Math.random() > BOT_SKILL) return; // bot imperfecto: reacciona con demora aleatoria
    const p = player;
    const ahead = obstacles.filter((o) => !o.dead && o.x + o.w > PX - 12).sort((a, b) => a.x - b.x);
    const o = ahead[0]; if (!o) return;
    const rel = speed + o.vx, dxc = o.x + o.w / 2 - PX;
    if (o.fly) {
      if (p.onGround && o.x - (PX + 26) < rel * 0.2 && p.slideT < 0.25) slide();
      return;
    }
    const nxt = ahead[1];
    const longJump = nxt && !nxt.fly && nxt.x - (o.x + o.w) < 200;
    if (p.onGround && dxc < rel * (longJump ? 0.28 : 0.36) + 8) jump();
    else if (!p.onGround && p.jumps === 1 && longJump && p.vy > -150 && nxt.x - PX < rel * 0.3) jump();
  }

  // ---------- update ----------
  function update(dt) {
    stateT += dt;
    if (state === 'paused' || state === 'over' && stateT > 3) { if (state === 'paused') return; }
    if (resumeT > 0) { resumeT -= dt; return; }
    if (hitStop > 0) { hitStop -= dt; return; }
    const p = player;

    // velocidad y mundo
    if (state === 'dying' || state === 'over') speed *= Math.exp(-dt * 2.8);
    else speed += (targetSpeed() - speed) * Math.min(1, dt * 1.6);
    const ds = speed * dt;
    worldX += ds;
    if (state === 'play') {
      elapsed += dt; dist += ds; tod += ds / 50 / 650; powerT -= dt;
      score = Math.floor(dist / 50) + pickups;
      if (BOT) autopilot();
      spawnDist -= ds;
      if (spawnDist <= 0) spawnPattern();
    }

    // jugador
    if (p.dead) {
      p.vy += G * dt; p.y += p.vy * dt; p.rot -= dt * 9;
      if (stateT > 1.15 && state === 'dying') gameOver();
    } else {
      if (!p.onGround) {
        p.airT += dt;
        p.vy += G * dt; p.y += p.vy * dt;
        if (p.y >= 0) {
          const hard = p.slam;
          p.y = 0; p.vy = 0; p.onGround = true; p.jumps = 0; p.flipT = 0; p.rot = 0;
          p.sx = hard ? 1.45 : 1.28; p.sy = hard ? 0.6 : 0.74;
          burst(PX, GY, hard ? 16 : 9, ['#f3e7d3', '#e2d3bb', '#ffffff'], { angle: -Math.PI / 2, spread: 1.4, min: 60, max: hard ? 300 : 180, g: 500, r0: 3, r1: 6, life: 0.5 });
          AudioFX.play(hard ? 'slam' : 'land');
          if (hard) shake = Math.max(shake, 5);
          p.slam = false;
          if (p.slideQueued) { p.slideQueued = false; p.slideT = SLIDE_T; AudioFX.play('slide'); }
          if (p.buffer > 0) { p.buffer = 0; jump(); }
          p.airT = 0;
        }
      }
      if (p.buffer > 0) p.buffer -= dt;
      if (p.slideT > 0) {
        p.slideT -= dt;
        if (Math.random() < 0.6) burst(PX + 18, GY - 2, 1, ['#fff3c4', '#ffd36b'], { angle: Math.PI + 0.4, spread: 0.4, min: 100, max: 260, g: 600, r0: 1.5, r1: 3, life: 0.35 });
      }
      if (p.flipT > 0) { p.flipT -= dt; p.rot = -Math.PI * 2 * easeOutCubic(1 - Math.max(0, p.flipT) / 0.42); if (p.flipT <= 0) p.rot = 0; }
      if (p.onGround) {
        p.phase += ds * 0.021;
        p.dustT -= dt;
        if (p.dustT <= 0 && p.slideT <= 0) { p.dustT = 0.09; particles.push({ x: PX - 10, y: GY - 2, vx: -speed * 0.25 - 30, vy: rand(-40, -10), life: 0.45, max: 0.45, r: rand(2, 4), c: '#efe3cf', g: -20, shape: 'c', drag: 0.9, spin: 0, a: 0 }); }
      }
      if (p.inv > 0) p.inv -= dt;
    }
    // squash & stretch con resorte
    p.svx += ((1 - p.sx) * 420 - p.svx * 20) * dt; p.sx += p.svx * dt;
    p.svy += ((1 - p.sy) * 420 - p.svy * 20) * dt; p.sy += p.svy * dt;

    // combo
    if (comboT > 0) {
      comboT -= dt;
      if (comboT <= 0) { if (mult > 1) { popup('combo perdido', W / 2, GY - 230, '#c9c2ff', 24); AudioFX.play('lose'); } combo = 0; mult = 1; }
    }
    multPulse = Math.max(0, multPulse - dt * 2.5);

    // hitbox del jugador
    const sliding = p.slideT > 0 && p.onGround;
    const ph = sliding ? SLIDE_H : PH, pw = sliding ? 50 : PW;
    const pl = PX - pw / 2 + 3, pr = PX + pw / 2 - 3, pb = GY + p.y - 2, pt = GY + p.y - ph + 8;

    // obstáculos
    for (const o of obstacles) {
      o.x -= (speed + o.vx) * dt; o.t += dt;
      if (o.dead || p.dead) continue;
      let ol = o.x + 6, or = o.x + o.w - 6, ot, obt;
      if (o.fly) { obt = GY - o.fly + Math.sin(o.t * 3) * 5; ot = obt - o.h + 6; ol += 4; or -= 4; }
      else { obt = GY; ot = GY - o.h + (o.type === 'cone' ? 10 : 6); if (o.type === 'cone') { ol += 4; or -= 4; } }
      const overlapX = pr > ol && pl < or;
      if (overlapX) {
        const gap = o.fly ? Math.max(pt - obt, ot - pb) : ot - pb;
        o.near = Math.min(o.near, gap);
        if (pb > ot && pt < obt && state === 'play') {
          if (p.inv > 0) continue;
          if (p.shield > 0) {
            p.shield = 0; p.inv = 1.1; o.dead = true; shake = 10; flash = 0.4; flashColor = '120,220,255';
            burst(o.x + o.w / 2, (ot + obt) / 2, 22, ['#bfeaff', '#ffffff', '#6ec6ff'], { shape: 's', g: 400, max: 420 });
            popup('¡SALVADO!', PX + 30, GY - 170, '#9fe6ff', 34); AudioFX.play('shield');
          } else { die(); }
        }
      }
      if (!o.passed && or < pl) {
        o.passed = true;
        if (o.near < 30 && o.near > -2 && state === 'play') {
          pickups += 20 * mult; addCombo();
          popup('¡RASPANDO! +' + 20 * mult, PX + 30, GY + p.y - 110, '#7fffd0', 26);
          AudioFX.play('near');
        }
      }
    }
    obstacles = obstacles.filter((o) => o.x + o.w > -120 && !(o.dead && o.x < -50));

    // mates
    const pcx = PX, pcy = GY + p.y - ph / 2;
    for (const c of coins) {
      c.x -= speed * dt; c.bob += dt * 4;
      if (c.got) { c.t = (c.t || 0) + dt; continue; }
      const dx = c.x - pcx, dy = c.y - pcy;
      if (!p.dead && state === 'play' && dx * dx + dy * dy < 40 * 40) {
        c.got = true; c.t = 0; mates++;
        const v = 5 * mult; pickups += v; addCombo();
        chainPopup(v);
        burst(c.x, c.y, 8, ['#ffd36b', '#fff', '#9be27a'], { shape: 's', g: 200, min: 60, max: 220, life: 0.5, r0: 2, r1: 4 });
        AudioFX.play('coin', combo);
      }
    }
    coins = coins.filter((c) => c.x > -60 && !(c.got && c.t > 0.3));

    // termo (escudo)
    for (const u of powerups) {
      u.x -= speed * dt; u.t += dt;
      const dx = u.x - pcx, dy = u.y + Math.sin(u.t * 3) * 8 - pcy;
      if (!u.got && !p.dead && dx * dx + dy * dy < 48 * 48) {
        u.got = true; p.shield = 1; AudioFX.play('power'); flash = 0.3; flashColor = '120,220,255';
        popup('¡ESCUDO!', u.x, u.y - 40, '#9fe6ff', 34);
        burst(u.x, u.y, 20, ['#9fe6ff', '#fff', '#3fb37f'], { shape: 's', g: 150, max: 360 });
      }
    }
    powerups = powerups.filter((u) => u.x > -60 && !u.got);

    // partículas / popups / efectos
    for (const q of particles) {
      q.life -= dt; q.vx *= Math.pow(q.drag, dt * 10); q.vy *= Math.pow(q.drag, dt * 10);
      q.vy += q.g * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.a += q.spin * dt;
    }
    particles = particles.filter((q) => q.life > 0);
    if (particles.length > 400) particles.splice(0, particles.length - 400);
    for (const u of popups) { u.life -= dt; u.y -= (u === chain ? 18 : 46) * dt; }
    popups = popups.filter((u) => u.life > 0);
    shake *= Math.exp(-dt * 9); if (shake < 0.2) shake = 0;
    flash = Math.max(0, flash - dt * 1.8);
    if (hintT > 0) hintT -= dt;
  }

  // ---------- render: background ----------
  function drawSky(P, t) {
    const g = ctx.createLinearGradient(0, 0, 0, HORIZON);
    g.addColorStop(0, rgb(P.top)); g.addColorStop(0.62, rgb(P.mid)); g.addColorStop(1, rgb(P.bot));
    ctx.fillStyle = g; ctx.fillRect(-20, -20, W + 40, HORIZON + 22);
    if (P.night > 0.02) {
      for (const s of stars) {
        const a = P.night * (0.55 + 0.45 * Math.sin(t * 2 + s.p));
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.fillRect(s.x * W, s.y * HORIZON * 0.85, s.r, s.r);
      }
    }
    // sol / luna
    const tt = ((tod % 4) + 4) % 4;
    const u = (tt + 0.7) % 4, sunVis = u < 3.1;
    if (sunVis) {
      const k = Math.sin(Math.PI * u / 3.1), sx = W * 0.72, sy = HORIZON + 30 - k * (HORIZON * 0.62);
      drawOrb(sx, sy, 44, P.sun, 0.55);
    }
    const u2 = (tt - 2.35 + 4) % 4;
    if (u2 < 1.9) { const k = Math.sin(Math.PI * u2 / 1.9); drawOrb(W * 0.3, HORIZON + 30 - k * HORIZON * 0.55, 26, [238, 243, 255], 0.35, true); }
    // nubes
    for (const c of clouds) {
      const x = ((c.x - worldX * 0.04) % (W + 400) + W + 400) % (W + 400) - 200, y = c.y * HORIZON * 0.8;
      ctx.fillStyle = rgb(mixc(P.bot, [255, 255, 255], 0.45 - P.night * 0.3), 0.55 - P.night * 0.25);
      cloud(x, y, c.s);
    }
  }
  function drawOrb(x, y, r, col, glow, moon) {
    const g = ctx.createRadialGradient(x, y, r * 0.4, x, y, r * 4);
    g.addColorStop(0, rgb(col, glow)); g.addColorStop(1, rgb(col, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 4, 0, 7); ctx.fill();
    ctx.fillStyle = rgb(col); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    if (moon) { ctx.fillStyle = 'rgba(160,170,210,.35)'; ctx.beginPath(); ctx.arc(x - 7, y - 5, 5, 0, 7); ctx.arc(x + 8, y + 7, 3.5, 0, 7); ctx.fill(); }
  }
  function cloud(x, y, s) {
    ctx.beginPath();
    ctx.ellipse(x, y, 60 * s, 16 * s, 0, 0, 7); ctx.ellipse(x - 26 * s, y - 8 * s, 26 * s, 18 * s, 0, 0, 7);
    ctx.ellipse(x + 18 * s, y - 14 * s, 32 * s, 22 * s, 0, 0, 7); ctx.fill();
  }
  function drawCity(P, t) {
    // Cerro de Montevideo con la fortaleza
    const hx = ((W * 0.15 - worldX * 0.02) % (W + 700) + W + 700) % (W + 700) - 350;
    ctx.fillStyle = rgb(mixc(P.city2, P.bot, 0.35));
    ctx.beginPath(); ctx.moveTo(hx - 260, HORIZON); ctx.quadraticCurveTo(hx, HORIZON - 120, hx + 260, HORIZON); ctx.fill();
    ctx.fillRect(hx - 14, HORIZON - 72, 28, 14); ctx.fillRect(hx - 4, HORIZON - 84, 8, 14);
    // skyline (parallax)
    const off = (worldX * 0.12) % SKY_LEN;
    const glowWin = P.night * 0.9 + P.dk * 0.4;
    for (let rep = 0; rep < 2; rep++) {
      for (const b of skyline) {
        const x = b.x - off + rep * SKY_LEN;
        if (x > W + 10 || x + b.w < -10) continue;
        const y = HORIZON - b.h;
        ctx.fillStyle = rgb(b.salvo ? P.city : (b.h > 100 ? P.city : P.city2));
        if (b.salvo) {
          // Palacio Salvo
          ctx.fillRect(x, y, b.w, b.h);
          ctx.fillRect(x + 12, y - 30, b.w - 24, 30);
          ctx.fillRect(x + 24, y - 78, b.w - 48, 48);
          ctx.beginPath(); ctx.moveTo(x + 24, y - 78); ctx.lineTo(x + b.w / 2, y - 112); ctx.lineTo(x + b.w - 24, y - 78); ctx.fill();
          ctx.fillRect(x + b.w / 2 - 1.5, y - 132, 3, 22);
        } else {
          ctx.fillRect(x, y, b.w, b.h);
          if (b.roof) ctx.fillRect(x + b.w * 0.3, y - 10, b.w * 0.4, 10);
        }
        if (glowWin > 0.05) {
          ctx.fillStyle = `rgba(255,214,120,${glowWin * 0.85})`;
          for (let i = 0; i < b.win.length; i += 2) ctx.fillRect(x + b.win[i], y + b.win[i + 1], 3, 4);
        }
      }
    }
  }
  function drawSea(P, t) {
    const top = HORIZON, bot = GY - 40;
    const g = ctx.createLinearGradient(0, top, 0, bot);
    g.addColorStop(0, rgb(P.seaT)); g.addColorStop(1, rgb(P.seaB));
    ctx.fillStyle = g; ctx.fillRect(-20, top, W + 40, bot - top + 2);
    // reflejo del sol
    const tt = ((tod % 4) + 4) % 4, u = (tt + 0.7) % 4;
    const refl = u < 3.1 ? 1 : 0.4, sx = u < 3.1 ? W * 0.72 : W * 0.3;
    ctx.fillStyle = rgb(P.sun, 0.5 * refl);
    for (let i = 0; i < 14; i++) {
      const yy = top + 6 + i * ((bot - top - 10) / 14);
      const w = (14 + i * 6) * (0.6 + 0.4 * Math.sin(t * 3 + i * 1.7));
      ctx.fillRect(sx - w / 2 + Math.sin(t * 2 + i) * 6, yy, w, 2);
    }
    // olitas
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    const off = worldX * 0.3;
    for (let row = 0; row < 5; row++) {
      const yy = top + 14 + row * ((bot - top) / 5.2), sp = 90 + row * 30;
      for (let x = -((off * (0.5 + row * 0.15)) % sp); x < W; x += sp) ctx.fillRect(x + row * 23, yy, 18 + row * 5, 1.6);
    }
  }
  function drawRambla(P, t) {
    // murito de la rambla
    const wallTop = GY - 40;
    ctx.fillStyle = '#d9c7a6'; ctx.fillRect(-20, wallTop, W + 40, 40);
    ctx.fillStyle = '#efe2c8'; ctx.fillRect(-20, wallTop - 6, W + 40, 9);
    ctx.fillStyle = 'rgba(120,90,60,.22)';
    const off = worldX % 60;
    for (let x = -off; x < W + 60; x += 60) { ctx.fillRect(x, wallTop + 3, 2, 37); }
    for (let x = -off + 30; x < W + 60; x += 60) ctx.fillRect(x, wallTop + 20, 2, 20);
    ctx.fillRect(-20, wallTop + 19, W + 40, 2);
    // vereda
    const vg = ctx.createLinearGradient(0, GY, 0, GY + 60);
    vg.addColorStop(0, '#cfc2ad'); vg.addColorStop(1, '#b7a993');
    ctx.fillStyle = vg; ctx.fillRect(-20, GY, W + 40, 60);
    ctx.fillStyle = 'rgba(80,60,40,.18)';
    const off2 = worldX % 48;
    for (let x = -off2; x < W + 48; x += 48) { ctx.beginPath(); ctx.moveTo(x, GY); ctx.lineTo(x - 18, GY + 60); ctx.lineTo(x - 16, GY + 60); ctx.lineTo(x + 2, GY); ctx.fill(); }
    ctx.fillRect(-20, GY + 28, W + 40, 1.5);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-20, GY, W + 40, 2);
    // cordón y calle
    ctx.fillStyle = '#8f8576'; ctx.fillRect(-20, GY + 60, W + 40, 12);
    ctx.fillStyle = '#a99f8e'; ctx.fillRect(-20, GY + 60, W + 40, 3);
    const rg = ctx.createLinearGradient(0, GY + 72, 0, H);
    rg.addColorStop(0, '#4a4a58'); rg.addColorStop(1, '#2d2d3a');
    ctx.fillStyle = rg; ctx.fillRect(-20, GY + 72, W + 40, H - GY - 72 + 20);
    ctx.fillStyle = '#f2d36b';
    const off3 = (worldX * 1.3) % 120, ly = GY + 72 + (H - GY - 72) * 0.45;
    for (let x = -off3; x < W + 120; x += 120) ctx.fillRect(x, ly, 56, 6);
    // oscurecer de noche
    if (P.dk > 0.01) { ctx.fillStyle = `rgba(16,14,52,${P.dk * 0.75})`; ctx.fillRect(-20, wallTop - 8, W + 40, H - wallTop + 30); }
    // faroles
    const lampSp = 430, off4 = worldX % lampSp;
    for (let x = -off4 + 200; x < W + 60; x += lampSp) {
      ctx.fillStyle = '#2f3142';
      ctx.fillRect(x - 3, GY - 150, 6, 150); ctx.fillRect(x - 7, GY - 8, 14, 8);
      ctx.beginPath(); ctx.moveTo(x, GY - 150); ctx.quadraticCurveTo(x + 2, GY - 168, x + 22, GY - 166); ctx.lineTo(x + 22, GY - 162); ctx.quadraticCurveTo(x + 6, GY - 162, x + 3, GY - 148); ctx.fill();
      ctx.fillRect(x + 14, GY - 166, 18, 6);
      const lit = clamp(P.dk * 2.2, 0, 1);
      ctx.fillStyle = lit > 0.1 ? `rgba(255,224,140,${0.4 + lit * 0.6})` : '#cfd3dc'; ctx.fillRect(x + 16, GY - 160, 14, 3);
      if (lit > 0.1) {
        const lg = ctx.createRadialGradient(x + 23, GY - 158, 4, x + 23, GY - 100, 130);
        lg.addColorStop(0, `rgba(255,214,120,${0.35 * lit})`); lg.addColorStop(1, 'rgba(255,214,120,0)');
        ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(x + 17, GY - 158); ctx.lineTo(x + 29, GY - 158); ctx.lineTo(x + 100, GY + 30); ctx.lineTo(x - 54, GY + 30); ctx.fill();
      }
    }
  }
  function drawSpeedLines(t) {
    const d = clamp((speed - 430) / 220, 0, 1);
    if (d <= 0 || state !== 'play') return;
    ctx.fillStyle = `rgba(255,255,255,${0.22 * d})`;
    for (let i = 0; i < 9; i++) {
      const y = 120 + ((i * 97.3) % (GY - 180)), len = 60 + (i % 3) * 40;
      const x = W - ((worldX * (1.6 + (i % 4) * 0.3) + i * 211) % (W + len * 2)) + len;
      ctx.fillRect(x, y, len, 2);
    }
  }

  // ---------- render: personajes y objetos ----------
  const INK = '#1b1238';
  function limb(pts, w, col) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    ctx.strokeStyle = INK; ctx.lineWidth = w + 4.5; ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
  }
  function legPts(hx, hy, th, kn) {
    const kx = hx + Math.sin(th) * 19, ky = hy + Math.cos(th) * 19;
    const fx = kx + Math.sin(th - kn) * 19, fy = ky + Math.cos(th - kn) * 19;
    return [hx, hy, kx, ky, fx, fy];
  }
  function armPts(sx, sy, aa, bend) {
    const ex = sx + Math.sin(aa) * 13, ey = sy + Math.cos(aa) * 13;
    return [sx, sy, ex, ey, ex + Math.sin(aa + bend) * 12, ey + Math.cos(aa + bend) * 12];
  }
  function shoe(pts, back) {
    const fx = pts[4], fy = pts[5];
    ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(fx + 4, fy + 1, 9.5, 6, 0, 0, 7); ctx.fill();
    ctx.fillStyle = back ? '#d9dbe6' : '#ffffff'; ctx.beginPath(); ctx.ellipse(fx + 4, fy, 7.5, 4.2, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#ff5e7e'; ctx.fillRect(fx - 3, fy + 2, 14, 2);
  }
  function drawRunner(p, t) {
    const sliding = p.slideT > 0 && p.onGround && !p.dead;
    const air = !p.onGround;
    const ph = p.phase;
    let bob = 0, L1, L2, A1, A2;
    if (sliding) {
      L1 = legPts(0, -38, 0.12, 0); L2 = legPts(0, -38, -0.1, 0.3);
      A1 = armPts(3, -62, 1.9, 0.5); A2 = armPts(3, -62, 2.4, 0.3);
    } else if (air) {
      const up = p.vy < 0;
      L1 = legPts(0, -38, 1.0, 1.7); L2 = legPts(0, -38, -0.25, 1.3);
      A1 = armPts(3, -62, up ? 2.7 : 2.0, up ? 0.4 : 0.9); A2 = armPts(3, -62, up ? -2.6 : -1.6, -0.5);
      if (p.dead) { L1 = legPts(0, -38, 1.4, 0.4); L2 = legPts(0, -38, -1.0, 0.6); A1 = armPts(3, -62, 2.6, 0.2); A2 = armPts(3, -62, -2.4, 0.2); }
    } else {
      const a = Math.sin(ph), b = Math.sin(ph + Math.PI);
      bob = -Math.abs(Math.cos(ph)) * 4;
      L1 = legPts(0, -38 + bob, a * 0.85, Math.max(0, -Math.cos(ph)) * 1.4 + 0.2);
      L2 = legPts(0, -38 + bob, b * 0.85, Math.max(0, Math.cos(ph)) * 1.4 + 0.2);
      A1 = armPts(3, -62 + bob, -a * 0.95, 1.5); A2 = armPts(3, -62 + bob, -b * 0.95, 1.5);
    }
    // brazo y pierna de atrás
    limb(A2, 7, '#e0a982'); limb(L2, 9, '#d8a47f'); shoe(L2, true);
    // short
    ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(0, -38 + bob, 11, 8, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#26305e'; ctx.beginPath(); ctx.ellipse(0, -38 + bob, 9, 6.5, 0, 0, 7); ctx.fill();
    // torso (camiseta celeste)
    limb([0, -40 + bob, 3, -61 + bob], 18, '#6ec6ff');
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-3, -56 + bob); ctx.lineTo(6, -46 + bob); ctx.stroke();
    // cabeza
    const hx = 7, hy = -75 + bob;
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(hx, hy, 12.5, 0, 7); ctx.fill();
    ctx.fillStyle = '#f1c09a'; ctx.beginPath(); ctx.arc(hx, hy, 10.5, 0, 7); ctx.fill();
    ctx.fillStyle = '#3a2418'; ctx.beginPath(); ctx.arc(hx - 1, hy - 3, 10.5, Math.PI * 0.95, Math.PI * 2.05); ctx.fill();
    // colita de pelo que rebota
    const tail = air ? -0.6 : Math.sin(ph * 2) * 0.35;
    ctx.save(); ctx.translate(hx - 9, hy - 4); ctx.rotate(0.5 + tail);
    ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(-7, 0, 9, 5.5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#3a2418'; ctx.beginPath(); ctx.ellipse(-7, 0, 7, 4, 0, 0, 7); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#ff5e7e'; ctx.fillRect(hx - 10, hy - 6, 20, 4);
    ctx.fillStyle = INK;
    if (p.dead) { ctx.font = 'bold 9px sans-serif'; ctx.fillText('x', hx + 3, hy + 3); }
    else { ctx.beginPath(); ctx.arc(hx + 5, hy + 1, 1.8, 0, 7); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,120,120,.5)'; ctx.beginPath(); ctx.arc(hx + 3, hy + 5, 2.4, 0, 7); ctx.fill();
    // pierna y brazo de adelante
    limb(L1, 9, '#f1c09a'); shoe(L1, false); limb(A1, 7, '#f1c09a');
  }
  function drawPlayer(t) {
    const p = player, sliding = p.slideT > 0 && p.onGround && !p.dead;
    const fy = GY + p.y;
    // sombra
    const hgt = clamp(-p.y / 220, 0, 1);
    ctx.fillStyle = `rgba(20,10,40,${0.28 * (1 - hgt * 0.7)})`;
    ctx.beginPath(); ctx.ellipse(PX + (sliding ? 6 : 0), GY + 2, (sliding ? 34 : 22) * (1 - hgt * 0.5), 5, 0, 0, 7); ctx.fill();
    if (p.inv > 0 && Math.floor(t * 18) % 2 === 0) ctx.globalAlpha = 0.45;
    ctx.save();
    ctx.translate(PX, fy);
    ctx.scale(p.sx, p.sy);
    if (sliding) { ctx.translate(30, -4); ctx.rotate(-1.22); }
    else if (p.rot) { ctx.translate(0, -40); ctx.rotate(p.rot); ctx.translate(0, 40); }
    else if (p.onGround && !p.dead) ctx.rotate(0.08 + clamp((speed - 330) / 320, 0, 1) * 0.08); // inclinación de carrera
    drawRunner(p, t);
    ctx.restore();
    ctx.globalAlpha = 1;
    if (p.shield > 0) {
      const cy = fy - (sliding ? 22 : 42), r = sliding ? 44 : 52 + Math.sin(t * 6) * 2;
      const g = ctx.createRadialGradient(PX, cy, r * 0.5, PX, cy, r);
      g.addColorStop(0, 'rgba(120,220,255,0)'); g.addColorStop(0.85, 'rgba(120,220,255,.28)'); g.addColorStop(1, 'rgba(200,245,255,.7)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(PX, cy, r, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(PX, cy, r - 6, t * 3, t * 3 + 1); ctx.stroke();
    }
  }
  function outlined(fn) { ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; fn(); }
  function drawObstacle(o, t) {
    const x = o.x, w = o.w;
    if (o.dead) return;
    ctx.save();
    if (!o.fly) { ctx.fillStyle = 'rgba(20,10,40,.25)'; ctx.beginPath(); ctx.ellipse(x + w / 2, GY + 2, w / 2 + 4, 5, 0, 0, 7); ctx.fill(); }
    switch (o.type) {
      case 'cone': {
        outlined(() => {
          ctx.fillStyle = '#ff7a2f'; ctx.beginPath(); ctx.moveTo(x + w / 2 - 4, GY - o.h); ctx.lineTo(x + w / 2 + 4, GY - o.h);
          ctx.lineTo(x + w - 3, GY - 6); ctx.lineTo(x + 3, GY - 6); ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(x + 10, GY - 22); ctx.lineTo(x + w - 10, GY - 22); ctx.lineTo(x + w - 13, GY - 31); ctx.lineTo(x + 13, GY - 31); ctx.fill();
          ctx.fillStyle = '#e8562a'; ctx.fillRect(x - 2, GY - 7, w + 4, 7); ctx.strokeRect(x - 2, GY - 7, w + 4, 7);
        });
        break;
      }
      case 'bench': {
        outlined(() => {
          ctx.fillStyle = '#3a3550';
          ctx.fillRect(x + 8, GY - 26, 7, 26); ctx.fillRect(x + w - 15, GY - 26, 7, 26);
          ctx.fillRect(x + 10, GY - o.h, 5, 26); ctx.fillRect(x + w - 15, GY - o.h, 5, 26);
          ctx.fillStyle = '#c9814a'; ctx.fillRect(x, GY - 30, w, 9); ctx.strokeRect(x, GY - 30, w, 9);
          ctx.fillStyle = '#b06b38'; ctx.fillRect(x + 2, GY - o.h, w - 4, 8); ctx.strokeRect(x + 2, GY - o.h, w - 4, 8);
          ctx.fillRect(x + 2, GY - o.h + 11, w - 4, 7); ctx.strokeRect(x + 2, GY - o.h + 11, w - 4, 7);
        });
        break;
      }
      case 'cart': {
        outlined(() => {
          const by = GY - 54;
          ctx.fillStyle = '#3a3550'; ctx.fillRect(x + w / 2 - 2, GY - o.h + 10, 4, 34);
          // sombrilla
          ctx.fillStyle = '#ffd34d'; ctx.beginPath(); ctx.moveTo(x - 2, GY - o.h + 14); ctx.quadraticCurveTo(x + w / 2, GY - o.h - 8, x + w + 2, GY - o.h + 14); ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#ff5e5e'; ctx.beginPath(); ctx.moveTo(x + w / 2 - 12, GY - o.h + 14); ctx.quadraticCurveTo(x + w / 2, GY - o.h - 4, x + w / 2 + 12, GY - o.h + 14); ctx.fill();
          ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 4, by, w - 8, 40); ctx.strokeRect(x + 4, by, w - 8, 40);
          ctx.fillStyle = '#e8473f'; ctx.fillRect(x + 4, by, w - 8, 10); ctx.strokeRect(x + 4, by, w - 8, 10);
          ctx.fillStyle = INK; ctx.font = `14px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText('CHORIPÁN', x + w / 2, by + 30); ctx.textAlign = 'left';
          ctx.fillStyle = '#3a3550'; ctx.beginPath(); ctx.arc(x + 22, GY - 8, 8, 0, 7); ctx.arc(x + w - 22, GY - 8, 8, 0, 7); ctx.fill();
          ctx.fillStyle = '#c8c8d8'; ctx.beginPath(); ctx.arc(x + 22, GY - 8, 3, 0, 7); ctx.arc(x + w - 22, GY - 8, 3, 0, 7); ctx.fill();
          if (state === 'play' && Math.random() < 0.15) particles.push({ x: x + w / 2 + rand(-10, 10), y: GY - o.h - 4, vx: rand(-10, 10), vy: -40, life: 1, max: 1, r: rand(4, 7), c: 'rgba(255,255,255,.5)', g: -10, shape: 'c', drag: 0.95, spin: 0, a: 0 });
        });
        break;
      }
      case 'gull': {
        const y = GY - o.fly + Math.sin(o.t * 3) * 5 - o.h / 2, cx = x + w / 2, flap = Math.sin(o.t * 14);
        outlined(() => {
          ctx.fillStyle = '#c9cede';
          ctx.beginPath(); ctx.moveTo(cx - 2, y - 2); ctx.quadraticCurveTo(cx + 10, y - 22 * flap - 6, cx + 30, y - 26 * flap); ctx.lineTo(cx + 8, y + 4); ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(cx, y + 3, 20, 10, 0.08, 0, 7); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.arc(cx - 16, y - 2, 8, 0, 7); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#ffae2a'; ctx.beginPath(); ctx.moveTo(cx - 23, y - 3); ctx.lineTo(cx - 34, y); ctx.lineTo(cx - 23, y + 2); ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#9aa1b8'; ctx.beginPath(); ctx.moveTo(cx + 2, y); ctx.quadraticCurveTo(cx + 16, y - 10 * flap, cx + 26, y - 18 * flap + 4); ctx.lineTo(cx + 12, y + 6); ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(cx - 18, y - 4, 1.8, 0, 7); ctx.fill();
        });
        break;
      }
      case 'bike': {
        const cx = x + w / 2, wy = GY - 15, rot = o.t * 18;
        outlined(() => {
          for (const wx of [x + 15, x + w - 15]) {
            ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(wx, wy, 14, 0, 7); ctx.stroke();
            ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(wx + Math.cos(rot) * 13, wy + Math.sin(rot) * 13); ctx.lineTo(wx - Math.cos(rot) * 13, wy - Math.sin(rot) * 13); ctx.stroke();
          }
          ctx.lineWidth = 4; ctx.strokeStyle = '#ff5e7e';
          ctx.beginPath(); ctx.moveTo(x + 15, wy); ctx.lineTo(cx, wy); ctx.lineTo(cx + 8, wy - 22); ctx.lineTo(x + 20, wy - 22); ctx.closePath(); ctx.moveTo(x + w - 15, wy); ctx.lineTo(x + 20, wy - 26); ctx.stroke();
          ctx.strokeStyle = INK; ctx.lineWidth = 3;
          // ciclista (mira a la izquierda)
          const leg = Math.sin(o.t * 18) * 6;
          limb([cx + 8, wy - 30, cx - 2, wy - 16 + leg, cx, wy - 2 + leg], 6, '#2f3a6e');
          limb([cx + 8, wy - 30, x + 22, wy - 52], 13, '#ffcf3a');
          limb([x + 24, wy - 48, x + 16, wy - 28], 5, '#e3b08c');
          ctx.fillStyle = '#e3b08c'; ctx.beginPath(); ctx.arc(x + 18, wy - 60, 8, 0, 7); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#ff5e7e'; ctx.beginPath(); ctx.arc(x + 19, wy - 62, 9, Math.PI, Math.PI * 2); ctx.fill(); ctx.stroke();
        });
        if (o.x > W - 20) { // aviso
          ctx.fillStyle = '#ffd34d'; ctx.font = `30px ${FONT}`; ctx.textAlign = 'right';
          ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 20); ctx.fillText('!', W - 14, GY - 40); ctx.globalAlpha = 1; ctx.textAlign = 'left';
        }
        break;
      }
    }
    ctx.restore();
  }
  function drawMate(x, y, s, glowA) {
    if (glowA > 0) {
      const g = ctx.createRadialGradient(x, y, 2, x, y, 26 * s);
      g.addColorStop(0, `rgba(255,230,140,${glowA})`); g.addColorStop(1, 'rgba(255,230,140,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 26 * s, 0, 7); ctx.fill();
    }
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.lineWidth = 2.5; ctx.strokeStyle = INK;
    ctx.strokeStyle = '#d7dbe8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(2, -4); ctx.lineTo(9, -19); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
    ctx.fillStyle = '#9b5a2c'; ctx.beginPath(); ctx.ellipse(0, 3, 11, 12, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c98a4b'; ctx.beginPath(); ctx.ellipse(-4, 1, 3, 6, -0.3, 0, 7); ctx.fill();
    ctx.fillStyle = '#e8d6a8'; ctx.fillRect(-8, -9, 16, 4); ctx.strokeRect(-8, -9, 16, 4);
    ctx.fillStyle = '#6fbf4a'; ctx.beginPath(); ctx.ellipse(0, -9, 7, 2.5, 0, 0, 7); ctx.fill();
    ctx.restore();
  }
  function drawCoins(t) {
    for (const c of coins) {
      if (c.x < -30 || c.x > W + 30) continue;
      if (c.got) {
        const k = clamp(c.t / 0.3, 0, 1);
        ctx.globalAlpha = 1 - k; drawMate(c.x, c.y - 30 * easeOutCubic(k), 1 + k * 0.8, 0); ctx.globalAlpha = 1;
        continue;
      }
      const sx = 0.85 + 0.15 * Math.cos(c.bob * 0.8);
      drawMate(c.x, c.y + Math.sin(c.bob) * 4, sx, 0.35 + 0.2 * Math.sin(c.bob * 1.3));
    }
  }
  function drawPowerups(t) {
    for (const u of powerups) {
      const y = u.y + Math.sin(u.t * 3) * 8;
      const g = ctx.createRadialGradient(u.x, y, 4, u.x, y, 46);
      g.addColorStop(0, 'rgba(140,230,255,.6)'); g.addColorStop(1, 'rgba(140,230,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(u.x, y, 46, 0, 7); ctx.fill();
      ctx.save(); ctx.translate(u.x, y); ctx.rotate(Math.sin(u.t * 2) * 0.2);
      outlined(() => {
        ctx.fillStyle = '#2f9e6a'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-10, -18, 20, 38, 6) : ctx.rect(-10, -18, 20, 38); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#e6e9f2'; ctx.fillRect(-8, -26, 16, 9); ctx.strokeRect(-8, -26, 16, 9);
        ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillRect(-6, -13, 4, 26);
      });
      ctx.restore();
      ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.5 + 0.5 * Math.sin(u.t * 8);
      star(u.x + 18, y - 22, 5, u.t * 3); ctx.globalAlpha = 1;
    }
  }
  function star(x, y, r, a) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a || 0);
    ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r * 0.3, -r * 0.3); ctx.lineTo(r, 0); ctx.lineTo(r * 0.3, r * 0.3);
    ctx.lineTo(0, r); ctx.lineTo(-r * 0.3, r * 0.3); ctx.lineTo(-r, 0); ctx.lineTo(-r * 0.3, -r * 0.3); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  function drawParticles() {
    for (const q of particles) {
      ctx.globalAlpha = clamp(q.life / q.max, 0, 1);
      ctx.fillStyle = q.c;
      if (q.shape === 's') star(q.x, q.y, q.r * 1.6, q.a);
      else { ctx.beginPath(); ctx.arc(q.x, q.y, q.r * (0.5 + 0.5 * q.life / q.max), 0, 7); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
  }
  function text(str, x, y, size, color, align, stroke) {
    ctx.font = `${size}px ${FONT}`; ctx.textAlign = align || 'left'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.lineWidth = stroke === undefined ? Math.max(4, size * 0.16) : stroke; ctx.strokeStyle = INK;
    if (ctx.lineWidth > 0) ctx.strokeText(str, x, y);
    ctx.fillStyle = color; ctx.fillText(str, x, y);
  }
  function drawPopups() {
    for (const u of popups) {
      const age = u.max - u.life; let s = easeOutBack(clamp(age / 0.22, 0, 1));
      if (u.bump) { s *= 1 + u.bump * 0.25; u.bump = Math.max(0, u.bump - 0.12); }
      ctx.save(); ctx.globalAlpha = clamp(u.life / 0.3, 0, 1);
      ctx.translate(u.x, u.y); ctx.scale(s, s);
      text(u.text, 0, 0, u.size, u.color, 'center');
      ctx.restore();
    }
  }

  // ---------- HUD ----------
  function drawHUD(t) {
    if (state !== 'play' && state !== 'dying' && state !== 'paused') return;
    const top = safeTop + 18;
    text(String(Math.floor(score)), 22, top + 26, 50, '#ffffff', 'left', 7);
    text('RÉCORD ' + Math.max(best, Math.floor(score)), 24, top + 64, 17, '#ffd36b', 'left', 4);
    drawMate(34, top + 96, 0.8, 0);
    text('× ' + mates, 52, top + 97, 20, '#ffffff', 'left', 4);
    if (player.shield > 0) {
      ctx.fillStyle = 'rgba(120,220,255,.9)'; ctx.beginPath(); ctx.arc(110, top + 97, 11, 0, 7); ctx.fill();
      text('+', 110, top + 98, 18, '#ffffff', 'center', 3);
    }
    // combo
    if (combo > 0) {
      const cx = W / 2, cy = top + 40, s = 1 + easeOutCubic(multPulse) * 0.45;
      const hot = ['#ffffff', '#ffd36b', '#ffa94d', '#ff7a7a', '#ff5ec4'][mult - 1];
      ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
      ctx.fillStyle = 'rgba(27,18,56,.55)'; ctx.beginPath(); ctx.arc(0, 0, 32, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, 29, 0, 7); ctx.stroke();
      ctx.strokeStyle = hot; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(0, 0, 29, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(comboT / COMBO_T, 0, 1)); ctx.stroke();
      text('×' + mult, 0, 2, 30, hot, 'center', 5);
      ctx.restore();
      text('COMBO ' + combo, cx, cy + 50, 16, '#ffffff', 'center', 4);
      if (mult < 5) { // barrita de progreso al próximo multiplicador
        const a0 = MULT_AT[mult - 1], a1 = MULT_AT[mult], k = clamp((combo - a0) / (a1 - a0), 0, 1);
        ctx.fillStyle = 'rgba(27,18,56,.55)'; ctx.fillRect(cx - 30, cy + 64, 60, 7);
        ctx.fillStyle = hot; ctx.fillRect(cx - 29, cy + 65, 58 * k, 5);
      }
    }
    if (hintT > 0 && state === 'play') {
      const a = clamp(hintT / 0.4, 0, 1) * clamp((3.2 - hintT) / 0.3 + 0.3, 0, 1);
      ctx.globalAlpha = a;
      const s = 1 + Math.sin(t * 6) * 0.04;
      ctx.save(); ctx.translate(W / 2, GY - 300); ctx.scale(s, s);
      text(hint, 0, 0, 30, '#ffffff', 'center', 6); ctx.restore();
      ctx.globalAlpha = 1;
    }
    if (resumeT > 0) {
      const n = Math.ceil(resumeT / 0.5), k = (resumeT % 0.5) / 0.5;
      ctx.save(); ctx.translate(W / 2, H * 0.4); const s = 0.8 + easeOutBack(1 - k) * 0.6; ctx.scale(s, s);
      ctx.globalAlpha = clamp(k * 2, 0, 1); text(String(n), 0, 0, 110, '#ffd36b', 'center', 12); ctx.restore(); ctx.globalAlpha = 1;
    }
  }

  // ---------- render ----------
  function render(t) {
    const P = palette();
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    ctx.save();
    if (shake > 0) ctx.translate(rand(-shake, shake), rand(-shake, shake) * 0.7);
    drawSky(P, t); drawCity(P, t); drawSea(P, t); drawRambla(P, t); drawSpeedLines(t);
    drawPowerups(t); drawCoins(t);
    for (const o of obstacles) drawObstacle(o, t);
    drawPlayer(t);
    drawParticles(); drawPopups();
    ctx.restore();
    // viñeta
    const vg = ctx.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.45, W / 2, H * 0.45, Math.max(W, H) * 0.8);
    vg.addColorStop(0, 'rgba(10,5,30,0)'); vg.addColorStop(1, 'rgba(10,5,30,.35)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    drawHUD(t);
    if (flash > 0) { ctx.fillStyle = `rgba(${flashColor},${flash * 0.55})`; ctx.fillRect(0, 0, W, H); }
  }

  // ---------- loop ----------
  let last = performance.now();
  function frame(now) {
    let dt = (now - last) / 1000; last = now;
    if (!(dt > 0)) dt = 0; dt = Math.min(dt, 0.05);
    const steps = Math.max(1, Math.ceil(dt / (1 / 120))), h = dt / steps;
    for (let i = 0; i < steps; i++) update(h);
    render(now / 1000);
    requestAnimationFrame(frame);
  }

  // ---------- UI wiring ----------
  function syncToggles() {
    for (const id of ['menu-sfx', 'pause-sfx']) $(id).setAttribute('aria-pressed', AudioFX.sfx ? 'true' : 'false');
    for (const id of ['menu-music', 'pause-music']) $(id).setAttribute('aria-pressed', AudioFX.music ? 'true' : 'false');
  }
  const on = (id, fn) => $(id).addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); fn(); });
  on('btn-play', startGame);
  on('btn-again', () => { if (stateT > 0.4) startGame(); });
  on('btn-pause', pauseGame);
  on('btn-resume', resumeGame);
  on('btn-restart', startGame);
  on('btn-pause-menu', toMenu);
  on('btn-over-menu', toMenu);
  for (const id of ['menu-sfx', 'pause-sfx']) on(id, () => { AudioFX.init(); AudioFX.setSfx(!AudioFX.sfx); syncToggles(); AudioFX.play('click'); });
  for (const id of ['menu-music', 'pause-music']) on(id, () => { AudioFX.init(); AudioFX.setMusic(!AudioFX.music); syncToggles(); AudioFX.play('click'); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { if (state === 'play') pauseGame(); if (AudioFX.ctx) AudioFX.ctx.suspend(); }
    else if (AudioFX.ctx) AudioFX.ctx.resume();
  });
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 200));
  if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);

  resize(); syncToggles();
  $('menu-best').textContent = best;
  speed = 240;
  window.__rr = {
    get state() { return state; }, get score() { return Math.floor(score); }, get mult() { return mult; }, get combo() { return combo; },
    get speed() { return speed; }, get elapsed() { return elapsed; }, get mates() { return mates; }, start: startGame,
    jump, slide, pause: pauseGame, resume: resumeGame, setBot(v) { BOT = !!v; }, get obs() { return obstacles.map((o) => [o.type, Math.round(o.x)]); },
  };
  const go = () => requestAnimationFrame((n) => { last = n; frame(n); });
  if (document.fonts && document.fonts.load) {
    Promise.race([Promise.all([document.fonts.load(`20px "Lilita"`), document.fonts.load('20px "Nunito"')]), new Promise((r) => setTimeout(r, 1200))]).then(go, go);
  } else go();
})();
