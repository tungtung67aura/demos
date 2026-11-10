/* Defensa del Cerro — interfaz, bucle principal, guardado, tutorial y logros. */
import { TOWERS, TOWER_ORDER, TARGET_MODES, ENEMIES, LEVELS, DIFFS, META, ABILITIES, ACHIEVEMENTS, COLS, ROWS } from './data.js';
import { Game, TICK } from './sim.js';
import { Renderer } from './render.js';
import { Sound } from './audio.js';
import { Bot } from './bot.js';
import { iconURL } from './sprites.js';

const VERSION = '1.0.0';
const $ = (id) => document.getElementById(id);
const QS = new URLSearchParams(location.search);
const BOT = QS.get('bot') === '1';
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ================= guardado =================
const SAVE_KEY = 'ddc-save-v1';
const fresh = () => ({ v: 1, levels: {}, endless: {}, meta: {}, ach: {}, seen: [], seenTowers: [], tut: false,
  settings: { sfx: true, music: true, vib: true, shake: true, lowfx: false }, totals: { kills: 0, bosses: 0, early: 0, interest: 0, maxTier: {}, games: 0 } });
function loadSave() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (s && s.v === 1) { const d = fresh(); for (const k in d) if (s[k] !== undefined) d[k] = (d[k] && typeof d[k] === 'object' && !Array.isArray(d[k])) ? Object.assign(d[k], s[k]) : s[k]; return d; }
  } catch (e) { /* guardado roto: arrancamos de cero */ }
  return fresh();
}
let save = loadSave();
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* modo privado */ } }
const levelRec = (i) => save.levels[LEVELS[i].id] || { stars: 0, bravo: false, won: false };
const unlockedLevel = (i) => i === 0 || levelRec(i - 1).won;
function medalsTotal() {
  let n = 0;
  LEVELS.forEach((L, i) => { const r = levelRec(i); n += r.stars || 0; if (r.bravo) n++; });
  const best = Math.max(0, ...Object.values(save.endless));
  return n + Math.min(3, Math.floor(best / 10));
}
function medalsSpent() { let n = 0; for (const m of META) for (let k = 0; k < (save.meta[m.id] || 0); k++) n += m.cost[k]; return n; }
const medalsFree = () => medalsTotal() - medalsSpent();

// ================= íconos =================
const icons = new Map();
function ticon(type, lvl = 0, br = null) { const k = `t${type}${lvl}${br}`; if (!icons.has(k)) icons.set(k, iconURL('tower', type, 112, { lvl, br })); return icons.get(k); }
function eicon(type, px = 112) { const k = 'e' + type + px; if (!icons.has(k)) icons.set(k, iconURL('enemy', type, px)); return icons.get(k); }

// ================= núcleo =================
const canvas = $('game');
const R = new Renderer(canvas);
const S = new Sound();
S.sfxOn = save.settings.sfx; S.musicOn = save.settings.music;
R.lowFx = save.settings.lowfx;
let mode = 'menu', game = null, demo = null, bot = null, demoBot = null;
let speed = 1, paused = false, blocking = false, aiming = null, sel = null, enemySel = null, tut = null;
let insetTop = 0, insetBot = 0, safe = { t: 0, b: 0 };
let cardQueue = [], committed = false;

function readSafe() { const p = getComputedStyle($('safe-probe')); safe.t = parseFloat(p.paddingTop) || 0; safe.b = parseFloat(p.paddingBottom) || 0; }
function layout() {
  readSafe();
  const W = window.innerWidth, H = window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, save.settings.lowfx ? 1.5 : 2);
  if (mode === 'play') { insetTop = safe.t + 54; insetBot = safe.b + 80; } else { insetTop = safe.t + 4; insetBot = safe.b + 4; }
  R.layout(W, H, dpr, insetTop, insetBot);
  closeRadial();
}
window.addEventListener('resize', layout);
window.addEventListener('orientationchange', () => setTimeout(layout, 200));

function vib(ms) { const ua = navigator.userActivation; if (ua && !ua.hasBeenActive) return; if (save.settings.vib && navigator.vibrate) try { navigator.vibrate(ms); } catch (e) { /* nada */ } }

// ================= pantallas =================
function showScreen(id) { for (const s of document.querySelectorAll('.screen')) s.classList.toggle('show', s.id === id); }
function openOv(id) { $(id).classList.add('show'); }
function closeOv(id) { $(id).classList.remove('show'); }
document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => { S.play('click'); closeOv(b.dataset.close); refreshTitle(); }));
document.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', () => { S.play('click'); showScreen(b.dataset.back); refreshTitle(); }));

function refreshTitle() {
  const free = medalsFree();
  $('title-medals').textContent = free; $('title-medals').classList.toggle('hidden', free <= 0);
}

// ---------- demo de fondo en el menú ----------
function startDemo() {
  const opts = LEVELS.map((L, i) => i).filter((i) => unlockedLevel(i));
  const lv = opts[(Math.random() * opts.length) | 0];
  demo = new Game({ level: lv, diff: 'tranqui', seed: (Math.random() * 1e6) | 0, meta: {} });
  demoBot = new Bot(demo, 'good', 5);
  demo.gold += 400;
  R.setGame(demo);
}

// ---------- selección de nivel ----------
let pickLevel = 0, pickDiff = 'normal', pickEndless = false;
function thumb(L) {
  const cv = document.createElement('canvas'), w = 66, h = 110, k = 2;
  cv.width = w * k; cv.height = h * k;
  const c = cv.getContext('2d'), ts = cv.width / COLS;
  c.fillStyle = '#2a86c2'; c.fillRect(0, 0, cv.width, cv.height);
  for (let r = 0; r < ROWS; r++) for (let cc = 0; cc < COLS; cc++) {
    const t = L.grid[r][cc]; if (t === '~') continue;
    c.fillStyle = t === 's' ? '#ecd59e' : t === 'F' ? '#cfc4ad' : '#7dbd4b';
    c.fillRect(cc * ts - 0.5, r * ts * (cv.height / (ts * ROWS)) - 0.5, ts + 1, ts * (cv.height / (ts * ROWS)) + 1);
  }
  const sy = cv.height / ROWS;
  c.lineJoin = 'round'; c.lineCap = 'round';
  for (const p of L.paths) {
    if (p.kind === 'air') continue;
    c.beginPath(); p.pts.forEach(([x, y], i) => (i ? c.lineTo((x + 0.5) * ts, (y + 0.5) * sy) : c.moveTo((x + 0.5) * ts, (y + 0.5) * sy)));
    if (p.kind === 'land') { c.strokeStyle = '#a77f4c'; c.lineWidth = ts * 0.8; c.stroke(); c.strokeStyle = '#e3c48f'; c.lineWidth = ts * 0.6; c.stroke(); }
    else { c.setLineDash([4, 5]); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 2.5; c.stroke(); c.setLineDash([]); }
  }
  return cv;
}
function buildLevels() {
  const list = $('level-list'); list.innerHTML = '';
  LEVELS.forEach((L, i) => {
    const rec = levelRec(i), open = unlockedLevel(i);
    const b = document.createElement('button');
    b.className = 'lv' + (open ? '' : ' locked') + (i === pickLevel ? ' sel' : '');
    b.appendChild(thumb(L));
    const info = document.createElement('div');
    const stars = [0, 1, 2].map((k) => `<svg class="${k < rec.stars ? 'on' : ''}"><use href="#i-star"/></svg>`).join('');
    info.innerHTML = `<div class="lv-n">FRENTE ${i + 1}</div><div class="lv-name">${esc(L.name)}</div><div class="lv-sub">${esc(L.sub)}</div>
      <div class="lv-stars">${stars}${rec.bravo ? '<svg class="laurel"><use href="#i-laurel"/></svg>' : ''}</div>`;
    b.appendChild(info);
    if (!open) b.insertAdjacentHTML('beforeend', '<svg class="lock"><use href="#i-lock"/></svg>');
    b.addEventListener('click', () => {
      if (!open) { S.play('error'); toastMsg('Bloqueado', `Ganá «${LEVELS[i - 1].name}» para abrir este frente.`); return; }
      S.play('click'); pickLevel = i; if (!levelRec(i).won && pickDiff === 'bravo') pickDiff = 'normal'; pickEndless = false; buildLevels();
    });
    list.appendChild(b);
  });
  const L = LEVELS[pickLevel], rec = levelRec(pickLevel);
  $('ld-name').textContent = L.name; $('ld-blurb').textContent = L.blurb;
  const seg = $('ld-diff'); seg.innerHTML = '';
  for (const id of ['tranqui', 'normal', 'bravo']) {
    const d = DIFFS[id], locked = id === 'bravo' && !rec.won;
    const b = document.createElement('button');
    b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', String(pickDiff === id)); if (id === 'bravo') b.className = 'bravo';
    b.innerHTML = `${d.name}<small>${locked ? 'Ganá primero' : esc(d.desc)}</small>`;
    if (locked) b.style.opacity = '.45';
    b.addEventListener('click', () => { if (locked) { S.play('error'); return; } S.play('click'); pickDiff = id; buildLevels(); });
    seg.appendChild(b);
  }
  $('ld-endless-wrap').classList.toggle('hidden', !rec.won);
  $('ld-endless').checked = pickEndless;
  const best = save.endless[L.id] || 0;
  $('ld-endless-best').textContent = best ? `· récord: oleada ${best}` : '· oleadas infinitas';
  $('lv-medals').textContent = medalsFree();
  $('btn-start').textContent = pickEndless ? '¡AGUANTAR!' : '¡A DEFENDER!';
}
$('ld-endless').addEventListener('change', (e) => { pickEndless = e.target.checked; S.play('click'); buildLevels(); });
$('btn-play').addEventListener('click', () => {
  S.unlock(); S.play('click');
  pickLevel = 0; for (let i = 0; i < LEVELS.length; i++) if (unlockedLevel(i)) pickLevel = i;
  buildLevels(); showScreen('levels');
});
$('btn-start').addEventListener('click', () => { S.unlock(); S.play('click'); startGame(pickLevel, pickDiff, pickEndless); });

// ================= partida =================
function startGame(level, diff, endless) {
  closeAllOverlays();
  mode = 'play'; speed = 1; paused = false; blocking = false; aiming = null; sel = null; enemySel = null; committed = false; cardQueue = [];
  game = new Game({ level, diff, endless, meta: save.meta, seed: (Date.now() % 100000) | 0 });
  bot = BOT ? new Bot(game, QS.get('skill') || 'good', 11) : null;
  showScreen(null); $('hud').classList.remove('hidden');
  layout(); R.setGame(game);
  S.mode = 'game'; S.intensity = 0;
  $('btn-speed').textContent = '×1'; $('btn-speed').classList.remove('fast');
  hud.last = {}; hud.previewWave = -1;
  hideTip(); $('bossbar').classList.add('hidden'); $('aim-banner').classList.add('hidden');
  // torres nuevas
  const newT = game.unlocked.filter((t) => !save.seenTowers.includes(t));
  if (level > 0 || endless) for (const t of newT) if (!['mosq', 'canon', 'pampero', 'mortero'].includes(t) || save.seenTowers.length) cardQueue.push({ tower: t });
  for (const t of game.unlocked) if (!save.seenTowers.includes(t)) save.seenTowers.push(t);
  persist();
  tut = (level === 0 && !save.tut && !BOT && !endless) ? { step: 0, t: 0 } : null;
  showBanner(LEVELS[level].name, endless ? 'Modo Sin Fin: ¿hasta dónde aguantás?' : `${DIFFS[diff].name} · 20 oleadas`, '');
  if (tut) setTimeout(() => tutStep(0), 900);
  showNextCard();
}
function closeAllOverlays() { for (const o of document.querySelectorAll('.overlay')) o.classList.remove('show'); closeRadial(); hideInfo(); }
function quitToMap() {
  commitTotals(); mode = 'menu'; game = null; bot = null; tut = null;
  $('hud').classList.add('hidden'); closeAllOverlays(); hideTip();
  S.mode = 'menu'; S.intensity = 0;
  layout(); startDemo(); buildLevels(); showScreen('levels');
}

// ---------- bucle ----------
let last = performance.now(), acc = 0;
function loop(now) {
  requestAnimationFrame(loop);
  let dt = (now - last) / 1000; last = now;
  if (dt > 0.1) dt = 0.1;
  const g = mode === 'play' ? game : demo;
  if (!g) return;
  const running = mode !== 'play' || (!paused && !blocking);
  if (running) {
    acc += dt * (mode === 'play' ? speed : 1);
    let n = 0;
    while (acc >= TICK && n < 30) {
      if (mode === 'play') { if (bot) bot.tick(TICK); } else demoBot.tick(TICK);
      g.step(TICK); acc -= TICK; n++;
    }
    if (n >= 30) acc = 0;
  }
  for (let i = 0; i < g.events.length; i++) { const ev = g.events[i]; R.onEvent(ev); if (mode === 'play') onEvent(ev); }
  g.events.length = 0;
  if (mode !== 'play' && g.state !== 'play') { startDemo(); return; }
  R.frame(running ? dt : 0, uiState());
  if (mode === 'play') { updateHud(); if (tut) tutTick(dt); }
}

function uiState() {
  const u = { bottom: insetBot, reduceShake: !save.settings.shake };
  if (mode !== 'play') return u;
  if (sel && sel.kind === 'build') {
    u.tile = [sel.c, sel.r]; u.tileOk = true; u.hints = true;
    if (sel.pick) { const s = TOWERS[sel.pick].lv[0]; u.range = { x: sel.c + 0.5, y: sel.r + 0.5, r: s.range, min: s.min, color: sel.pick === 'faro' ? 'rgba(255,225,120,.12)' : undefined }; u.ghost = { type: sel.pick, c: sel.c, r: sel.r }; }
  } else if (sel && sel.kind === 'tower') {
    const t = sel.t, s = game.stats_(t);
    u.sel = t;
    let r = s.range * (1 + (TOWERS[t.type].support ? 0 : t.buff.range)), min = s.min;
    if (sel.pick && sel.pick !== 'sell') { const ns = sel.pick === 'up' ? TOWERS[t.type].lv[1] : TOWERS[t.type].br[sel.pick]; r = ns.range * (1 + (TOWERS[t.type].support ? 0 : t.buff.range)); min = ns.min; }
    u.range = { x: t.x, y: t.y, r, min, color: t.type === 'faro' ? 'rgba(255,225,120,.12)' : undefined };
    if (t.type === 'faro') u.faroLinks = game.towers.filter((o) => o !== t && !TOWERS[o.type].support && Math.hypot(o.x - t.x, o.y - t.y) <= s.range).map((o) => [t, o]);
  }
  if (aiming === 'troops') u.troopAim = true;
  if (tut && tut.pointer) u.pointer = tut.pointer;
  if (tut && tut.step === 0) u.hints = true;
  return u;
}

// ---------- eventos de la simulación → sonido e interfaz ----------
function onEvent(ev) {
  switch (ev.k) {
    case 'shot': S.play(ev.elite ? 'rifle' : 'musket', ev.second ? 0.6 : 1); break;
    case 'cannon': S.play('cannon', ev.big ? 1.2 : 0.9); break;
    case 'cone': S.play('cone'); break;
    case 'mortar': S.play('mortar'); break;
    case 'bolt': S.play('bolt'); break;
    case 'boom': S.play(ev.big ? 'bigboom' : 'boom', ev.big ? 0.8 : 0.7); break;
    case 'hit': S.play('hit'); break;
    case 'death': S.play(ev.naval ? 'splash' : ev.flying ? 'squawk' : 'death'); S.play('coin', 0.6); break;
    case 'leak': S.play('leak'); vib(ev.boss ? [80, 40, 120] : 40); bumpPill('hud-lives-pill', 'hurt'); break;
    case 'build': S.play('build'); if (game.towers.length >= 12) unlockAch('towers12'); break;
    case 'upgrade': S.play('upgrade'); if (Object.keys({ ...save.totals.maxTier, ...game.stats.maxTier }).length >= 6) unlockAch('maxall'); break;
    case 'sell': S.play('sell'); break;
    case 'gust': S.play('gust'); break;
    case 'push': S.play('push'); break;
    case 'freeze': S.play('freeze'); break;
    case 'heal': S.play('heal'); break;
    case 'shieldbreak': S.play('shieldbreak'); break;
    case 'disabled': S.play('disabled'); break;
    case 'slash': S.play('slash'); break;
    case 'troops': S.play('troops'); break;
    case 'flare': S.play('flare'); break;
    case 'bombcall': S.play('bombcall'); break;
    case 'summon': case 'rally': case 'charge': case 'vanish': case 'phase': S.play('boss', 0.35); break;
    case 'wave': {
      const boss = ev.boss;
      S.play(boss ? 'boss' : 'wave'); if (boss) vib([60, 60, 60]);
      const label = game.endless ? `OLEADA ${ev.wave}` : ev.wave === game.totalWaves ? '¡ÚLTIMA OLEADA!' : `OLEADA ${ev.wave}`;
      let small = boss ? '¡Viene un jefe!' : '';
      if (ev.bonus) small = `+${ev.bonus} de oro por apurarte` + (ev.interest ? ` · +${ev.interest} de intereses` : '');
      else if (ev.interest && !boss) small = `+${ev.interest} de oro en intereses`;
      showBanner(label, small, boss ? 'boss' : '');
      S.intensity = clamp(ev.wave / 20, 0, 1);
      if (tut) tutOn('wave', ev.wave);
      break;
    }
    case 'boss': showBanner(ev.e.def.name.toUpperCase(), ENEMIES[ev.e.type].desc, 'boss'); break;
    case 'bossdown': S.play('bigboom'); S.play('victory', 0.5); showBanner('¡JEFE ABAJO!', ev.e.def.name, ''); if (ev.e.type === 'galeona') unlockAch('galeona'); if (save.totals.bosses + game.stats.bosses >= 8) unlockAch('bosses'); break;
    case 'newenemy': if (!save.seen.includes(ev.type)) { save.seen.push(ev.type); persist(); cardQueue.push({ enemy: ev.type }); showNextCard(); } break;
    case 'wavedone': if (tut) tutOn('wavedone'); break;
    case 'won': setTimeout(() => finish(true), 900); break;
    case 'lost': setTimeout(() => finish(false), 900); break;
  }
}

// ================= HUD =================
const hud = { last: {}, previewWave: -1 };
function setText(id, v) { if (hud.last[id] !== v) { hud.last[id] = v; $(id).textContent = v; } }
function bumpPill(id, cls) { const el = $(id); el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
function updateHud() {
  const g = game;
  setText('hud-lives', String(Math.max(0, g.lives)));
  const gold = Math.floor(g.gold);
  if (hud.last.goldN !== undefined && gold - hud.last.goldN >= 20) bumpPill('hud-gold-pill', 'bump');
  hud.last.goldN = gold;
  setText('hud-gold', String(gold));
  setText('hud-wave', g.endless ? `${g.wave}` : `${g.wave}/${g.totalWaves}`);
  // poderes
  for (const b of document.querySelectorAll('.abil')) {
    const id = b.dataset.ab, a = g.abil[id], p = a.cd > 0 ? (a.cd / a.max) * 100 : 0;
    const key = 'ab' + id + Math.ceil(a.cd) + (aiming === id);
    if (hud.last[key + 'k'] !== Math.round(p)) { b.style.setProperty('--p', p.toFixed(1) + '%'); hud.last[key + 'k'] = Math.round(p); }
    const txt = a.cd > 0 ? String(Math.ceil(a.cd)) : '';
    if (b._t !== txt) { b._t = txt; b.querySelector('em').textContent = txt; }
    b.classList.toggle('ready', a.cd <= 0 && g.wave > 0 && aiming !== id);
    b.classList.toggle('aiming', aiming === id);
  }
  // botón de oleada
  const wb = $('btn-wave');
  let label, sub = '', idle = false, pulse = false, ro = 0;
  if (g.state !== 'play') { label = '…'; idle = true; }
  else if (g.canCall()) {
    if (g.wave === 0) { label = '¡LLAMAR OLEADA!'; sub = 'Cuando estés pronto'; pulse = true; }
    else { label = 'LLAMAR YA'; const b = g.earlyBonus(); sub = b > 0 ? `+${b} de oro` : ''; ro = 106.8 * (1 - g.nextTimer / g.nextTimerMax); }
  } else if (g.wave >= g.totalWaves) { label = 'ÚLTIMA OLEADA'; idle = true; sub = `Quedan ${g.enemies.length}`; ro = 106.8; }
  else { label = 'EN CAMINO…'; idle = true; ro = 106.8; }
  setText('wave-label', label); setText('wave-sub', sub);
  if (hud.last.wcls !== idle + '' + pulse) { hud.last.wcls = idle + '' + pulse; wb.classList.toggle('idle', idle); wb.classList.toggle('pulse', pulse); }
  if (hud.last.ro !== Math.round(ro)) { hud.last.ro = Math.round(ro); wb.style.setProperty('--ro', ro.toFixed(1)); }
  // vista previa de la próxima oleada
  const pw = g.canCall() ? g.wave + 1 : -1;
  if (hud.previewWave !== pw) {
    hud.previewWave = pw;
    const box = $('next-preview'); box.innerHTML = '';
    if (pw > 0) {
      const counts = new Map();
      for (const gr of g.waveGroups(pw)) counts.set(gr.type, (counts.get(gr.type) || 0) + gr.count);
      for (const [type, n] of counts) {
        const sp = document.createElement('span'); if (ENEMIES[type].boss) sp.className = 'boss';
        sp.innerHTML = `<img alt="" src="${eicon(type)}"><b>${n}</b>`; sp.title = ENEMIES[type].name; box.appendChild(sp);
      }
    }
  }
  // barra de jefe
  let boss = null; for (const e of g.enemies) if (e.def.boss && e.alive) { boss = e; break; }
  const bb = $('bossbar');
  if (boss) {
    if (bb.classList.contains('hidden')) bb.classList.remove('hidden');
    setText('boss-name', boss.def.name);
    $('boss-fill').style.width = (100 * Math.max(0, boss.hp) / boss.maxHp).toFixed(1) + '%';
    $('boss-shield').style.width = (boss.shieldMax ? 100 * boss.shield / boss.shieldMax : 0).toFixed(1) + '%';
  } else if (!bb.classList.contains('hidden')) bb.classList.add('hidden');
  // radial: precios al día
  if (sel && hud.last.radialGold !== gold) { hud.last.radialGold = gold; refreshRadialPrices(); }
  if (sel && sel.kind === 'tower' && !game.towers.includes(sel.t)) closeRadial();
  if (enemySel && (!enemySel.e.alive || performance.now() > enemySel.until)) { enemySel = null; if (!sel) hideInfo(); }
  else if (enemySel && hud.last.eHp !== Math.ceil(enemySel.e.hp)) { hud.last.eHp = Math.ceil(enemySel.e.hp); const hpEl = document.getElementById('ehp'); if (hpEl) hpEl.textContent = `${Math.max(0, Math.ceil(enemySel.e.hp))}/${Math.ceil(enemySel.e.maxHp)}`; }
}

// ---------- banner ----------
function showBanner(big, small, cls) {
  const b = $('banner'); $('banner-big').textContent = big; $('banner-small').textContent = small || '';
  b.className = 'banner'; void b.offsetWidth; b.className = 'banner go ' + (cls || '');
}

// ---------- botones del HUD ----------
$('btn-wave').addEventListener('click', () => {
  if (!game || game.state !== 'play') return;
  S.unlock();
  if (game.callWave(false)) { closeRadial(); if (game.wave > 1) S.play('coin'); }
  else S.play('error');
});
$('btn-speed').addEventListener('click', () => {
  speed = speed === 1 ? 2 : speed === 2 ? 3 : 1; S.play('click');
  $('btn-speed').textContent = '×' + speed; $('btn-speed').classList.toggle('fast', speed > 1);
});
for (const b of document.querySelectorAll('.abil')) b.addEventListener('click', () => {
  if (!game || game.state !== 'play') return;
  const id = b.dataset.ab;
  if (aiming === id) { cancelAim(); return; }
  if (!game.canUse(id)) { S.play('error'); return; }
  closeRadial();
  if (!ABILITIES[id].needsTarget) { game.useAbility(id); if (tut) tutOn('ability'); return; }
  aiming = id; S.play('open');
  $('aim-text').textContent = id === 'bomb' ? 'Tocá dónde caen las bombas' : 'Tocá un camino para los Blandengues';
  $('aim-banner').classList.remove('hidden');
});
function cancelAim() { aiming = null; $('aim-banner').classList.add('hidden'); }
$('aim-cancel').addEventListener('click', () => { S.play('click'); cancelAim(); });
$('btn-pause').addEventListener('click', () => pauseGame());
function pauseGame() {
  if (mode !== 'play' || paused || !game || game.state !== 'play') return;
  paused = true; S.play('click');
  $('pause-sub').textContent = `${LEVELS[game.levelIndex].name} · ${game.endless ? 'Sin Fin' : DIFFS[game.diffId].name} · oleada ${game.wave}`;
  syncToggles(); openOv('pause');
}
$('btn-resume').addEventListener('click', () => { S.play('click'); closeOv('pause'); paused = false; });
$('btn-restart').addEventListener('click', () => { S.play('click'); commitTotals(); startGame(game.levelIndex, game.diffId, game.endless); });
$('btn-quit').addEventListener('click', () => { S.play('click'); quitToMap(); });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { if (mode === 'play' && !blocking) pauseGame(); S.suspend(); } else S.resume();
});

// ================= toques en el mapa =================
let down = null;
canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; S.unlock(); });
canvas.addEventListener('pointerup', (e) => {
  if (!down) return;
  const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y); down = null;
  if (moved > 18) return;
  tapAt(e.clientX, e.clientY);
});
function tapAt(px, py) {
  if (mode !== 'play' || !game || paused || blocking || game.state !== 'play') return;
  const [wx, wy] = R.toWorld(px, py);
  if (aiming) {
    if (game.useAbility(aiming, wx, wy)) { if (tut) tutOn('ability'); cancelAim(); }
    else { S.play('error'); $('aim-text').textContent = 'Tiene que ser sobre un camino de tierra'; vib(20); }
    return;
  }
  const c = Math.floor(wx), r = Math.floor(wy);
  const wasSel = sel;
  closeRadial();
  const tile = game.tile(c, r);
  if (tile && tile.tower) { if (!(wasSel && wasSel.kind === 'tower' && wasSel.t === tile.tower)) openTower(tile.tower); return; }
  // enemigo cerca del toque
  let best = null, bd = 9;
  for (const e of game.enemies) { const d = Math.hypot(e.x - wx, e.y - (wy + (e.flying ? 0.45 : 0))); if (d < Math.max(0.55, e.def.r + 0.2) && d < bd) { best = e; bd = d; } }
  if (best) { showEnemy(best); return; }
  if (game.buildable(c, r)) { if (!(wasSel && wasSel.kind === 'build' && wasSel.c === c && wasSel.r === r)) openBuild(c, r); return; }
  if (tile && !wasSel) { S.play('error'); }
}

// ================= menú radial =================
const radial = $('radial');
function placeRadial(cx, cy, items, R0) {
  radial.innerHTML = ''; radial.classList.remove('hidden');
  const W = window.innerWidth, H = window.innerHeight;
  const x = clamp(cx, R0 + 34, W - R0 - 34), y = clamp(cy, insetTop + R0 + 26, H - insetBot - R0 - 22);
  items.forEach((it, i) => {
    const b = document.createElement('button');
    b.className = 'rb ' + (it.cls || ''); b.style.left = (x + Math.cos(it.a) * R0) + 'px'; b.style.top = (y + Math.sin(it.a) * R0) + 'px';
    b.style.animationDelay = (i * 0.025) + 's';
    b.innerHTML = it.html; b.dataset.id = it.id;
    b.addEventListener('click', (ev) => { ev.stopPropagation(); it.on(b); });
    radial.appendChild(b);
  });
}
const priceHTML = (n) => `<span class="price"><svg><use href="#i-coin"/></svg>${n}</span>`;
function openBuild(c, r) {
  const g = game; S.play('open');
  sel = { kind: 'build', c, r, pick: null };
  const types = TOWER_ORDER.filter((t) => g.unlocked.includes(t));
  const n = types.length, R0 = Math.max(64, R.TS * 1.5);
  const items = types.map((t, i) => ({
    id: t, a: -Math.PI / 2 + i * (Math.PI * 2 / n),
    html: `<img alt="${TOWERS[t].name}" src="${ticon(t)}">${priceHTML(g.towerCost(t))}`,
    on: (b) => {
      if (sel.pick === t) {
        if (g.gold < g.towerCost(t)) { S.play('error'); vib(20); return; }
        const tw = g.build(t, c, r);
        if (tw) { closeRadial(); if (tut) tutOn('built'); }
        return;
      }
      S.play('click'); sel.pick = t;
      for (const el of radial.children) el.classList.toggle('sel', el.dataset.id === t);
      showInfoBuild(t);
      if (tut) tutOn('pick', t);
    },
  }));
  placeRadial(R.X(c + 0.5), R.Y(r + 0.5), items, R0);
  refreshRadialPrices();
  showInfoHint(r, 'Elegí una torre: un toque para ver qué hace, otro para construir.');
  if (tut) tutOn('openbuild');
}
function openTower(t) {
  const g = game; S.play('open');
  sel = { kind: 'tower', t, pick: null };
  const R0 = Math.max(64, R.TS * 1.45), d = TOWERS[t.type];
  const items = [];
  const pickBtn = (id) => (b) => {
    if (sel.pick === id) {
      if (id === 'sell') { g.sell(t); closeRadial(); return; }
      const ok = g.upgrade(t, id === 'up' ? null : id);
      if (ok) { closeRadial(); setTimeout(() => { if (g.towers.includes(t) && mode === 'play') openTower(t); }, 60); } else { S.play('error'); vib(20); }
      return;
    }
    S.play('click'); sel.pick = id;
    for (const el of radial.children) el.classList.toggle('sel', el.dataset.id === id);
    showInfoTower(t, id);
  };
  if (t.lvl === 0) items.push({ id: 'up', a: -Math.PI / 2, cls: 'up', html: `<img alt="Mejorar" src="${ticon(t.type, 1)}">${priceHTML(g.upgradeCost(t))}<span class="tag">Mejorar</span>`, on: pickBtn('up') });
  else if (t.lvl === 1) for (const [br, a] of [['a', -Math.PI / 2 - 0.62], ['b', -Math.PI / 2 + 0.62]]) items.push({ id: br, a, cls: 'up', html: `<img alt="${d.br[br].name}" src="${ticon(t.type, 2, br)}">${priceHTML(g.upgradeCost(t, br))}<span class="tag">${esc(d.br[br].name)}</span>`, on: pickBtn(br) });
  else items.push({ id: 'max', a: -Math.PI / 2, cls: 'maxed', html: `<svg style="fill:#ffd54a"><use href="#i-star"/></svg><span class="tag">Al máximo</span>`, on: () => {} });
  items.push({ id: 'sell', a: Math.PI / 2, cls: 'sell', html: `<svg><use href="#i-sell"/></svg><span class="price">+${g.sellValue(t)}</span>`, on: pickBtn('sell') });
  placeRadial(R.X(t.x), R.Y(t.y), items, R0);
  refreshRadialPrices();
  showInfoTower(t, null);
  if (tut) tutOn('opentower');
}
function refreshRadialPrices() {
  if (!sel || !game) return;
  for (const b of radial.children) {
    const id = b.dataset.id; let cost = 0;
    if (sel.kind === 'build') cost = game.towerCost(id);
    else if (id === 'up') cost = game.upgradeCost(sel.t);
    else if (id === 'a' || id === 'b') cost = game.upgradeCost(sel.t, id);
    b.classList.toggle('poor', cost > 0 && game.gold < cost);
  }
}
function closeRadial() { sel = null; radial.innerHTML = ''; radial.classList.add('hidden'); if (!enemySel) hideInfo(); }

// ================= ficha de info =================
const info = $('info');
function infoPos(row) { info.classList.toggle('top', row >= ROWS / 2); info.classList.toggle('bottom', row < ROWS / 2); }
function hideInfo() { info.classList.add('hidden'); }
function showInfoHint(row, text) {
  infoPos(row); info.classList.remove('hidden');
  info.innerHTML = `<p style="margin:2px 0;text-align:center">${esc(text)}</p>`;
}
function statSpans(type, s, cmp) {
  const d = TOWERS[type], out = [];
  const f = (label, v, cv, fmt = (x) => x) => { const up = cmp && cv !== undefined && cv !== v; out.push(`<span class="${up ? 'up' : ''}">${label} <b>${fmt(up ? cv : v)}</b>${up ? ` <small>(${fmt(v)})</small>` : ''}</span>`); };
  const c = cmp || {};
  if (!d.support) f('Daño', Math.round(s.dmg), c.dmg !== undefined ? Math.round(c.dmg) : undefined);
  if (!d.support && !d.aura) f('Disparos/s', +(1 / s.cd).toFixed(1), c.cd ? +(1 / c.cd).toFixed(1) : undefined);
  f('Alcance', s.range, c.range);
  if (s.splash) f('Área', s.splash, c.splash);
  if (s.slow) f('Frena', Math.round(s.slow * 100) + '%', c.slow ? Math.round(c.slow * 100) + '%' : undefined);
  if (s.pierce) f('Atraviesa', s.pierce, c.pierce);
  if (s.crit) out.push(`<span>Crítico <b>${Math.round(s.crit * 100)}% ×${s.critMul}</b></span>`);
  if (s.double) out.push('<span><b>Doble tiro</b></span>');
  if (s.cone) out.push('<span><b>Abanico</b></span>');
  if (s.stun) out.push(`<span>Aturde <b>${s.stun}s</b></span>`);
  if (s.fire) out.push(`<span>Quema <b>${s.fire}/s</b></span>`);
  if (s.freeze) out.push(`<span>Congela <b>${Math.round(s.freeze * 100)}%</b></span>`);
  if (s.push) out.push('<span><b>Empuja</b></span>');
  if (s.armorPierce || d.pierce) out.push(`<span>Ignora armadura <b>${Math.round((s.armorPierce || d.pierce) * 100)}%</b></span>`);
  if (d.support) { out.push('<span><b>Revela invisibles</b></span>'); if (s.bRange) out.push(`<span>Torres +<b>${Math.round(s.bRange * 100)}%</b> alcance</span>`); if (s.bDmg) out.push(`<span>+<b>${Math.round(s.bDmg * 100)}%</b> daño</span>`); if (s.bRate) out.push(`<span>+<b>${Math.round(s.bRate * 100)}%</b> cadencia</span>`); if (s.mark) out.push(`<span>Marca <b>+${Math.round(s.mark * 100)}%</b></span>`); }
  if (s.min) out.push(`<span>No tira a menos de <b>${s.min}</b></span>`);
  out.push(`<span>Aire <b>${d.air ? 'sí' : 'no'}</b></span>`);
  return out.join('');
}
function showInfoBuild(type) {
  const d = TOWERS[type], cost = game.towerCost(type), poor = game.gold < cost;
  infoPos(sel.r); info.classList.remove('hidden');
  info.innerHTML = `<div class="ih"><img alt="" src="${ticon(type)}"><div><h3>${esc(d.name)}</h3><span class="lvtag">${cost} de oro</span></div></div>
    <p>${esc(d.desc)}</p><div class="stats">${statSpans(type, d.lv[0])}</div>
    <div class="hint2">${poor ? `Te faltan ${cost - Math.floor(game.gold)} de oro.` : 'Tocá de nuevo el ícono para construir.'}</div>`;
}
function showInfoTower(t, pick) {
  const d = TOWERS[t.type], s = game.stats_(t);
  infoPos(t.r); info.classList.remove('hidden');
  const lvName = t.lvl === 2 ? d.br[t.br].name : d.name;
  let next = null, nextName = '', desc = t.lvl === 2 ? d.br[t.br].desc : d.desc, hint = '';
  if (pick === 'up') { next = d.lv[1]; nextName = 'Nivel 2'; hint = `Mejora por ${game.upgradeCost(t)} de oro. Tocá de nuevo para confirmar.`; }
  else if (pick === 'a' || pick === 'b') { next = d.br[pick]; nextName = next.name; desc = next.desc; hint = `Especialidad por ${game.upgradeCost(t, pick)} de oro. Tocá de nuevo para confirmar.`; }
  else if (pick === 'sell') hint = `Vendela por ${game.sellValue(t)} de oro (te devuelven el 70%). Tocá de nuevo para confirmar.`;
  const buffs = [];
  if (!d.support && (t.buff.dmg || t.buff.range || t.buff.rate)) buffs.push('Alumbrada por un Faro');
  const modes = d.support || d.aura ? '' : `<div class="modes">${TARGET_MODES.map((m) => `<button data-m="${m.id}" aria-pressed="${t.mode === m.id}">${m.label}</button>`).join('')}</div>`;
  info.innerHTML = `<div class="ih"><img alt="" src="${ticon(t.type, t.lvl, t.br)}"><div><h3>${esc(next && pick !== 'up' ? nextName : lvName)}</h3>
    <span class="lvtag">Nivel ${t.lvl + 1}${pick && pick !== 'sell' ? ' → ' + (t.lvl + 2) : ''} · ${t.kills} bajas${buffs.length ? ' · ' + buffs[0] : ''}</span></div></div>
    <p>${esc(desc)}</p><div class="stats">${statSpans(t.type, s, next)}</div>${modes}${hint ? `<div class="hint2">${esc(hint)}</div>` : ''}`;
  for (const b of info.querySelectorAll('.modes button')) b.addEventListener('click', () => { game.setMode(t, b.dataset.m); S.play('click'); for (const o of info.querySelectorAll('.modes button')) o.setAttribute('aria-pressed', String(o === b)); });
}
function showEnemy(e) {
  const d = e.def; S.play('click');
  enemySel = { e, until: performance.now() + 5000 };
  infoPos(Math.floor(e.y)); info.classList.remove('hidden');
  const tags = [];
  if (d.armor) tags.push(`<span>Armadura <b>${Math.round(d.armor * 100)}%</b></span>`);
  if (d.shield) tags.push('<span><b>Escudo</b></span>');
  if (d.stealth) tags.push('<span><b>Invisible</b></span>');
  if (d.kind === 'air') tags.push('<span><b>Vuela</b></span>');
  if (d.kind === 'sea') tags.push('<span><b>Por agua</b></span>');
  if (d.boss) tags.push(`<span>Te saca <b>${d.life} vidas</b></span>`);
  info.innerHTML = `<div class="ih"><img alt="" src="${eicon(e.type)}"><div><h3>${esc(d.name)}</h3><span class="lvtag">Vida <b id="ehp">${Math.ceil(e.hp)}/${Math.ceil(e.maxHp)}</b> · ${d.spd >= 1.5 ? 'muy rápido' : d.spd >= 1 ? 'rápido' : d.spd >= 0.7 ? 'normal' : 'lento'}</span></div></div>
    <p>${esc(d.desc)}</p><div class="stats">${tags.join('') || '<span>Pirata común</span>'}</div>`;
}

// ================= fichas de novedades =================
function showNextCard() {
  if (blocking || !cardQueue.length || mode !== 'play') return;
  const it = cardQueue.shift();
  blocking = true;
  if (it.enemy) {
    const d = ENEMIES[it.enemy];
    $('ic-kicker').textContent = d.boss ? '¡JEFE A LA VISTA!' : '¡NUEVO ENEMIGO!';
    $('ic-img').src = eicon(it.enemy, 240); $('ic-name').textContent = d.name; $('ic-desc').textContent = d.desc;
    $('ic-tip').textContent = TIPS[it.enemy] || '';
  } else {
    const d = TOWERS[it.tower];
    $('ic-kicker').textContent = '¡NUEVA TORRE!';
    $('ic-img').src = ticon(it.tower, 1); $('ic-name').textContent = d.name; $('ic-desc').textContent = d.desc;
    $('ic-tip').textContent = it.tower === 'faro' ? 'Ponelo cerca de tus torres y del camino: las potencia y descubre a los invisibles.' : 'Sus virotes siguen de largo: ponela donde el camino sea recto.';
  }
  S.play('open'); openOv('cardov');
  if (BOT) setTimeout(() => $('ic-ok').click(), 300);
}
$('ic-ok').addEventListener('click', () => { S.play('click'); closeOv('cardov'); blocking = false; setTimeout(showNextCard, 250); });
const TIPS = {
  grumete: 'Con un par de Mosqueteros alcanza para empezar.',
  corsario: 'El Pampero lo frena en seco.',
  acorazado: 'El Mortero y la Arponera le atraviesan la coraza.',
  escudero: 'Cañón y Mortero rompen el escudo el doble de rápido.',
  carreton: 'Tené daño en área después de romperlo.',
  cirujano: 'Poné tus torres en «Más fuerte» o bajalo primero.',
  contrab: 'Un Faro cerca del camino lo deja a la vista.',
  loro: 'Mosqueteros y Ballestas le pegan en el aire.',
  bote: 'Construí sobre la costa y en las islitas.',
  lancha: 'Cañones cerca del agua y algún Mortero.',
  tuerto: 'Cuando agarra envión, el Pampero lo frena.',
  malacara: 'Tirale el Bombardeo naval cuando llame a su tropa.',
  galeona: 'Sus cañonazos apagan torres un rato: repartilas.',
  almirante: 'Guardá la Bengala para cuando se esconda.',
};

// ================= final de partida =================
function commitTotals() {
  if (!game || committed) return; committed = true;
  const s = game.stats, T = save.totals;
  T.kills += s.kills; T.bosses += s.bosses; T.early += s.early; T.interest += s.interest; T.games++;
  Object.assign(T.maxTier, s.maxTier);
  persist();
  if (T.kills >= 1000) unlockAch('kills');
  if (T.early >= 25) unlockAch('early');
  if (T.interest >= 300) unlockAch('banker');
  if (T.bosses >= 8) unlockAch('bosses');
  if (Object.keys(T.maxTier).length >= 6) unlockAch('maxall');
}
function finish(won) {
  if (mode !== 'play' || !game) return;
  const g = game, L = g.L, before = medalsTotal();
  commitTotals();
  hideTip(); closeRadial(); cancelAim(); speed = 1;
  const card = document.querySelector('.result-card');
  const stars = won ? g.starsEarned() : 0;
  let rec = levelRec(g.levelIndex);
  if (g.endless) {
    const best = save.endless[L.id] || 0;
    if (g.wave > best) save.endless[L.id] = g.wave;
    if (g.wave >= 25) unlockAch('endless25');
  } else if (won) {
    rec = { ...rec, won: true, stars: Math.max(rec.stars || 0, stars), bravo: rec.bravo || g.diffId === 'bravo' };
    save.levels[L.id] = rec;
    if (g.levelIndex === 0) unlockAch('win1');
    if (g.levelIndex === 2) unlockAch('win3');
    if (stars === 3) unlockAch('stars3');
    if (g.lives === g.livesStart) unlockAch('perfect');
    if (g.diffId === 'bravo') { unlockAch('bravo'); if (g.levelIndex === 2) unlockAch('legend'); }
    if (LEVELS.every((_, i) => levelRec(i).stars === 3)) unlockAch('allstars');
  }
  persist();
  const gained = medalsTotal() - before;
  card.classList.toggle('lose', !won && !g.endless);
  $('res-title').textContent = g.endless ? '¡QUÉ AGUANTE!' : won ? '¡VICTORIA!' : 'CAYÓ LA FORTALEZA';
  $('res-stars').classList.toggle('hidden', !won);
  const svgs = $('res-stars').querySelectorAll('svg'); svgs.forEach((s) => s.classList.remove('on'));
  if (won) svgs.forEach((s, i) => { if (i < stars) setTimeout(() => { s.classList.add('on'); S.play('star', 1 + i * 0.12); vib(25); }, 450 + i * 380); });
  $('res-sub').textContent = g.endless ? `Llegaste a la oleada ${g.wave} en ${L.name}.` + ((save.endless[L.id] || 0) === g.wave ? ' ¡Récord nuevo!' : '')
    : won ? (stars === 3 ? 'Impecable. El Cerro está orgulloso.' : stars === 2 ? 'Bien defendida. Se puede mejorar.' : 'Raspando, pero la fortaleza sigue en pie.')
    : `Te tumbaron en la oleada ${g.wave}. ${DEFEAT_TIPS[(Math.random() * DEFEAT_TIPS.length) | 0]}`;
  const secs = Math.round(g.time);
  $('res-stats').innerHTML = [
    ['Vidas', `${Math.max(0, g.lives)}/${g.livesStart}`], ['Bajas', g.stats.kills], ['Jefes', g.stats.bosses], ['Tiempo', `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`],
  ].map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
  $('res-reward').classList.toggle('hidden', gained <= 0);
  $('res-reward').textContent = gained > 0 ? `+${gained} medalla${gained > 1 ? 's' : ''} para el Cuartel` : '';
  const hasNext = won && !g.endless && g.levelIndex < LEVELS.length - 1;
  $('btn-next').classList.toggle('hidden', !hasNext);
  $('btn-next').textContent = 'SIGUIENTE FRENTE';
  $('btn-retry').textContent = won ? 'JUGAR DE NUEVO' : 'REINTENTAR';
  S.play(won || g.endless ? 'victory' : 'defeat'); S.intensity = 0;
  vib(won ? [40, 60, 40] : [200]);
  openOv('result');
}
const DEFEAT_TIPS = [
  'Probá mejorar menos torres y que lleguen al nivel 3.',
  'El Pampero en una curva hace milagros.',
  'Mirá los íconos de la próxima oleada antes de llamarla.',
  'En el Cuartel hay mejoras que se notan.',
  'Usá los poderes seguido: se recargan solos.',
  'Cambiá a «Más fuerte» las torres que vigilan a los jefes.',
];
$('btn-next').addEventListener('click', () => { S.play('click'); const n = game.levelIndex + 1; quitToMap(); pickLevel = n; pickDiff = 'normal'; buildLevels(); });
$('btn-retry').addEventListener('click', () => { S.play('click'); startGame(game.levelIndex, game.diffId, game.endless); });
$('btn-map').addEventListener('click', () => { S.play('click'); quitToMap(); });

// ================= tutorial =================
function showTip(text, low) { $('tip-text').textContent = text; const t = $('tip'); t.classList.toggle('low', !!low); t.classList.remove('hidden'); t.style.animation = 'none'; void t.offsetWidth; t.style.animation = ''; }
function hideTip() { $('tip').classList.add('hidden'); }
$('tip-ok').addEventListener('click', () => { S.play('click'); hideTip(); if (tut && tut.onOk) { const f = tut.onOk; tut.onOk = null; f(); } });
function bestTileFor(type) { const b = new Bot(game, 'good'); b.updateShare(); return b.bestTile(type); }
function tutStep(n) {
  if (!tut || !game) return;
  tut.step = n; tut.t = 0; tut.pointer = null; tut.onOk = null;
  switch (n) {
    case 0: { const bt = bestTileFor('mosq'); if (bt) tut.pointer = { x: bt[0] + 0.5, y: bt[1] + 0.5 }; showTip('¡Llegan los piratas! Tocá el pasto marcado para construir tu primera torre.'); break; }
    case 1: showTip('Elegí los Mosqueteros: un toque te muestra qué hacen y otro toque los construye.'); break;
    case 2: showTip('¡Bien ahí! Cuando estés pronto, tocá LLAMAR OLEADA abajo a la derecha.', true); break;
    case 3: showTip('Cada pirata que bajás te da oro. Si llegan a la fortaleza, perdés vidas.'); tut.auto = 6; break;
    case 4: { const t = game.towers[0]; if (t) tut.pointer = { x: t.x, y: t.y }; showTip('Tocá tu torre para mejorarla o elegir a quién le apunta.'); break; }
    case 5: showTip('Las mejoras salen oro. En el nivel 3 cada torre elige entre dos especialidades.'); tut.auto = 6; break;
    case 6: showTip('Si llamás la oleada antes de que termine la cuenta, te ganás oro extra.'); tut.auto = 7; break;
    case 7: showTip('Abajo a la izquierda tenés poderes. Probá el Bombardeo naval sobre un grupo de piratas.'); tut.auto = 10; break;
    case 8: hideTip(); save.tut = true; persist(); tut = null; break;
  }
}
function tutOn(what, arg) {
  if (!tut) return;
  const s = tut.step;
  if (s === 0 && what === 'openbuild') tutStep(1);
  else if (s <= 1 && what === 'built') tutStep(2);
  else if (s <= 2 && what === 'wave') tutStep(3);
  else if (s === 4 && what === 'opentower') tutStep(5);
  else if (s === 7 && what === 'ability') tutStep(8);
}
function tutTick(dt) {
  if (!tut || paused || blocking) return;
  tut.t += dt;
  if (tut.auto && tut.t > tut.auto) { tut.auto = 0; hideTip(); tut.next = tut.step + 1; tut.t = 0; }
  const s = tut.step, g = game;
  if (tut.next) {
    if (tut.next === 4 && g.gold >= g.upgradeCost(g.towers[0] || { type: 'mosq', lvl: 0 }) && g.towers.length) { tut.next = 0; tutStep(4); }
    else if (tut.next === 6 && g.wave >= 2 && g.nextTimer > 0) { tut.next = 0; tutStep(6); }
    else if (tut.next === 7 && g.wave >= 3 && g.spawning && g.enemies.length > 4) { tut.next = 0; tutStep(7); }
    else if (tut.next === 8) { tut.next = 0; tutStep(8); }
  }
  if (s === 4 && g.towers[0]) tut.pointer = { x: g.towers[0].x, y: g.towers[0].y };
}

// ================= logros =================
function unlockAch(id) {
  if (save.ach[id] || BOT && QS.get('noach')) return;
  save.ach[id] = Date.now(); persist();
  const a = ACHIEVEMENTS.find((x) => x.id === id); if (!a) return;
  S.play('achievement'); toastMsg('¡Logro! ' + a.name, a.desc, true);
}
const toastQ = []; let toastBusy = false;
function toastMsg(title, text, star) { toastQ.push([title, text, star]); if (!toastBusy) nextToast(); }
function nextToast() {
  const it = toastQ.shift(); if (!it) { toastBusy = false; return; }
  toastBusy = true; const [title, text, star] = it;
  const t = document.createElement('div'); t.className = 'toast';
  t.innerHTML = `<svg><use href="#${star ? 'i-star' : 'i-lock'}"/></svg><div><b>${esc(title)}</b><span>${esc(text)}</span></div>`;
  $('toasts').appendChild(t); setTimeout(() => { t.remove(); nextToast(); }, 3600);
}
function buildAch() {
  const n = ACHIEVEMENTS.filter((a) => save.ach[a.id]).length;
  $('ach-count').textContent = `${n} de ${ACHIEVEMENTS.length} conseguidos`;
  $('ach-list').innerHTML = ACHIEVEMENTS.map((a) => `<div class="arow ${save.ach[a.id] ? 'got' : ''}"><svg><use href="#i-star"/></svg><div><b>${esc(a.name)}</b><span>${esc(a.desc)}</span></div></div>`).join('');
}
$('btn-ach').addEventListener('click', () => { S.unlock(); S.play('click'); buildAch(); openOv('ach'); });

// ================= cuartel =================
function buildMeta() {
  $('meta-free').textContent = medalsFree();
  const list = $('meta-list'); list.innerHTML = '';
  for (const m of META) {
    const lv = save.meta[m.id] || 0, max = lv >= m.max, cost = max ? 0 : m.cost[lv];
    const row = document.createElement('div'); row.className = 'mrow';
    row.innerHTML = `<div class="mt"><b>${esc(m.name)}</b><span>${esc(m.desc)}</span><div class="pips">${Array.from({ length: m.max }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('')}</div></div>
      <button class="mbuy ${max ? 'max' : ''}" ${!max && medalsFree() < cost ? 'disabled' : ''}>${max ? 'Listo' : `<svg><use href="#i-medal"/></svg>${cost}`}</button>`;
    row.querySelector('button').addEventListener('click', () => {
      if (max || medalsFree() < cost) { S.play('error'); return; }
      save.meta[m.id] = lv + 1; persist(); S.play('upgrade'); buildMeta(); refreshTitle();
    });
    list.appendChild(row);
  }
}
$('btn-meta').addEventListener('click', () => { S.unlock(); S.play('click'); buildMeta(); openOv('meta'); });
$('meta-reset').addEventListener('click', () => { S.play('sell'); save.meta = {}; persist(); buildMeta(); refreshTitle(); });

// ================= ajustes =================
function syncToggles() {
  for (const b of document.querySelectorAll('[data-set]')) b.setAttribute('aria-pressed', String(!!save.settings[b.dataset.set]));
}
for (const b of document.querySelectorAll('[data-set]')) b.addEventListener('click', () => {
  const k = b.dataset.set; save.settings[k] = !save.settings[k]; persist(); S.unlock();
  if (k === 'sfx') S.setSfx(save.settings.sfx);
  if (k === 'music') S.setMusic(save.settings.music);
  if (k === 'lowfx') { R.lowFx = save.settings.lowfx; layout(); if (R.g) R.buildBg(); }
  S.play('click'); syncToggles();
});
$('btn-settings').addEventListener('click', () => { S.unlock(); S.play('click'); syncToggles(); $('ver').textContent = VERSION; openOv('settings'); });
$('set-tut').addEventListener('click', () => { save.tut = false; persist(); S.play('click'); toastMsg('Listo', 'El tutorial vuelve en La Subida.', true); });
let wipeArm = 0;
$('set-wipe').addEventListener('click', () => {
  if (Date.now() - wipeArm > 3000) { wipeArm = Date.now(); $('set-wipe').textContent = '¿Seguro? Tocá otra vez para borrar todo'; S.play('error'); return; }
  const st = save.settings; save = fresh(); save.settings = st; persist(); $('set-wipe').textContent = 'Borrar todo el progreso';
  S.play('sell'); refreshTitle(); toastMsg('Progreso borrado', 'Arrancás de cero.', false);
});

// ================= teclado (compu) =================
window.addEventListener('keydown', (e) => {
  if (mode !== 'play' || !game) return;
  if (e.code === 'Space') { e.preventDefault(); $('btn-wave').click(); }
  else if (e.code === 'KeyP' || e.code === 'Escape') { if (aiming) cancelAim(); else if (sel) closeRadial(); else if (paused) $('btn-resume').click(); else pauseGame(); }
  else if (e.code === 'KeyF') $('btn-speed').click();
  else if (e.code === 'Digit1' || e.code === 'KeyQ') document.querySelector('[data-ab=bomb]').click();
  else if (e.code === 'Digit2' || e.code === 'KeyW') document.querySelector('[data-ab=troops]').click();
  else if (e.code === 'Digit3' || e.code === 'KeyE') document.querySelector('[data-ab=flare]').click();
});

// ================= instalación (PWA) =================
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; $('btn-install').classList.remove('hidden'); });
$('btn-install').addEventListener('click', async () => {
  if (!deferredPrompt) return; S.play('click');
  deferredPrompt.prompt(); try { await deferredPrompt.userChoice; } catch (e) { /* nada */ }
  deferredPrompt = null; $('btn-install').classList.add('hidden');
});
window.addEventListener('appinstalled', () => $('btn-install').classList.add('hidden'));
const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent), standalone = navigator.standalone || matchMedia('(display-mode: standalone)').matches;
if (isIOS && !standalone) $('ios-hint').classList.remove('hidden');
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

// ================= arranque =================
layout(); startDemo(); refreshTitle(); syncToggles();
requestAnimationFrame((t) => { last = t; loop(t); });
document.fonts && document.fonts.ready.then(() => { if (R.g) R.buildBg(); });

// modo prueba / autoplay: ?bot=1&level=1&diff=normal&speed=3&autostart=1&endless=1
if (BOT && QS.get('autostart')) {
  setTimeout(() => {
    const lv = clamp((+QS.get('level') || 1) - 1, 0, LEVELS.length - 1);
    startGame(lv, QS.get('diff') || 'normal', QS.get('endless') === '1');
    const sp = +QS.get('speed') || 1; speed = clamp(sp, 1, 10); $('btn-speed').textContent = '×' + speed;
  }, 300);
}
window.__dc = {
  get game() { return game; }, get mode() { return mode; }, get paused() { return paused; }, get blocking() { return blocking; },
  get sel() { return sel; }, get save() { return save; }, renderer: R, sound: S,
  start: startGame, quit: quitToMap, tapWorld: (x, y) => tapAt(R.X(x), R.Y(y)), setSpeed: (s) => { speed = s; },
  setBot: (on) => { bot = on && game ? new Bot(game, 'good', 11) : null; }, persist,
  get fps() { return fpsMeter.fps; },
};
const fpsMeter = { fps: 0, n: 0, t: performance.now() };
(function fpsLoop(now) { fpsMeter.n++; if (now - fpsMeter.t > 1000) { fpsMeter.fps = fpsMeter.n * 1000 / (now - fpsMeter.t); fpsMeter.n = 0; fpsMeter.t = now; } requestAnimationFrame(fpsLoop); })(performance.now());
