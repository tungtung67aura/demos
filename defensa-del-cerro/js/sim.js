/* Defensa del Cerro — simulación pura (sin DOM). Paso fijo de 1/60 s. */
import { COLS, ROWS, TOWERS, ENEMIES, LEVELS, DIFFS, ABILITIES, SELL_RATE, WAVES_PER_LEVEL, buildWave, hpScale, rng } from './data.js';

export const TICK = 1 / 60;
const hyp = Math.hypot;

// ---------- caminos ----------
function roundCorners(pts, rad) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i], [cx, cy] = pts[i + 1];
    const l1 = hyp(ax - bx, ay - by), l2 = hyp(cx - bx, cy - by);
    const r = Math.min(rad, l1 * 0.5, l2 * 0.5);
    const p1 = [bx + (ax - bx) / l1 * r, by + (ay - by) / l1 * r], p2 = [bx + (cx - bx) / l2 * r, by + (cy - by) / l2 * r];
    const n = 8;
    for (let k = 0; k <= n; k++) {
      const t = k / n, u = 1 - t;
      out.push([u * u * p1[0] + 2 * u * t * bx + t * t * p2[0], u * u * p1[1] + 2 * u * t * by + t * t * p2[1]]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
export function buildPath(def) {
  const raw = def.pts.map(([c, r]) => [c + 0.5, r + 0.5]);
  const pts = roundCorners(raw, def.kind === 'air' ? 6 : 0.45);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + hyp(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const path = { kind: def.kind, raw, pts, cum, len: cum[cum.length - 1] };
  path.samples = [];
  for (let d = 0; d <= path.len; d += 0.25) { const p = samplePath(path, d); path.samples.push([p.x, p.y, d]); }
  return path;
}
const _p = { x: 0, y: 0, nx: 0, ny: 0, dx: 0, dy: 0 };
export function samplePath(path, d, out = _p) {
  const { pts, cum } = path;
  if (d <= 0) d = 0;
  if (d >= path.len) d = path.len - 1e-6;
  let lo = 0, hi = cum.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] <= d) lo = m; else hi = m; }
  const a = pts[lo], b = pts[hi], sl = cum[hi] - cum[lo] || 1, t = (d - cum[lo]) / sl;
  const dx = (b[0] - a[0]) / sl, dy = (b[1] - a[1]) / sl;
  out.x = a[0] + (b[0] - a[0]) * t; out.y = a[1] + (b[1] - a[1]) * t;
  out.dx = dx; out.dy = dy; out.nx = -dy; out.ny = dx;
  return out;
}

let UID = 1;

export class Game {
  constructor({ level = 0, diff = 'normal', endless = false, meta = {}, seed = 1, quiet = false } = {}) {
    this.levelIndex = level; this.L = LEVELS[level]; this.diffId = diff; this.diff = DIFFS[diff] || DIFFS.normal;
    this.endless = endless; this.meta = meta; this.quiet = quiet;
    this.R = rng(seed * 9973 + level * 31 + 7);
    this.paths = this.L.paths.map(buildPath);
    this.grid = []; // grid[r][c] = {ch, path}
    for (let r = 0; r < ROWS; r++) {
      const row = [];
      for (let c = 0; c < COLS; c++) row.push({ ch: this.L.grid[r][c], path: false, tower: null });
      this.grid.push(row);
    }
    for (const p of this.paths) {
      if (p.kind !== 'land') continue;
      for (let i = 1; i < p.raw.length; i++) {
        const [ax, ay] = p.raw[i - 1], [bx, by] = p.raw[i];
        const steps = Math.ceil(hyp(bx - ax, by - ay) * 4);
        for (let s = 0; s <= steps; s++) {
          const x = ax + (bx - ax) * s / steps, y = ay + (by - ay) * s / steps;
          const c = Math.floor(x), r = Math.floor(y);
          if (r >= 0 && r < ROWS && c >= 0 && c < COLS && this.grid[r][c].ch !== 'F') this.grid[r][c].path = true;
        }
      }
    }
    this.livesStart = 20 + 3 * (meta.lives || 0);
    this.lives = this.livesStart;
    this.gold = Math.round((this.L.gold + 40 * (meta.gold || 0)) * (this.diff.gold > 1 ? 1.1 : 1));
    this.totalWaves = endless ? Infinity : WAVES_PER_LEVEL;
    this.unlocked = endless ? Object.keys(TOWERS) : this.L.towers;
    this.wave = 0; this.spawns = []; this.spawning = false; this.nextTimer = -1; this.nextTimerMax = 16;
    this.enemies = []; this.towers = []; this.projs = []; this._projFree = []; this.soldiers = []; this.zones = []; this.strikes = [];
    this.events = [];
    this.time = 0; this.state = 'play'; this.flareT = 0; this._scanT = 0; this._buffT = 0;
    this.abil = {};
    for (const k in ABILITIES) this.abil[k] = { cd: 0, max: ABILITIES[k].cd - (k === 'bomb' ? 5 * (meta.naval || 0) : 0) };
    this.stats = { kills: 0, gold: 0, interest: 0, early: 0, bosses: 0, abilities: 0, leaked: 0, maxTowers: 0, built: 0, galeona: 0, maxTier: {} };
    this.seen = new Set(); // tipos de enemigo ya vistos (para fichas nuevas)
  }
  emit(k, o) { if (!this.quiet) { o = o || {}; o.k = k; this.events.push(o); } }

  // ---------- economía / construcción ----------
  costMul() { return 1 - 0.06 * (this.meta.cheap || 0); }
  towerCost(type) { return Math.round(TOWERS[type].cost * this.costMul() / 5) * 5; }
  upgradeCost(t, br) {
    const d = TOWERS[t.type];
    const raw = t.lvl === 0 ? d.lv[1].cost : t.lvl === 1 ? d.br[br || 'a'].cost : 0;
    return Math.round(raw * this.costMul() / 5) * 5;
  }
  sellValue(t) { return Math.floor(t.spent * SELL_RATE); }
  stats_(t) { const d = TOWERS[t.type]; return t.lvl < 2 ? d.lv[t.lvl] : d.br[t.br]; }
  tile(c, r) { return r >= 0 && r < ROWS && c >= 0 && c < COLS ? this.grid[r][c] : null; }
  buildable(c, r) {
    const t = this.tile(c, r);
    return !!t && !t.path && !t.tower && (t.ch === '.' || t.ch === ',' || t.ch === 's');
  }
  build(type, c, r) {
    if (this.state !== 'play' || !this.unlocked.includes(type) || !this.buildable(c, r)) return null;
    const cost = this.towerCost(type);
    if (this.gold < cost) return null;
    this.gold -= cost;
    const t = { id: UID++, type, c, r, x: c + 0.5, y: r + 0.5, lvl: 0, br: null, spent: cost, mode: 'first', cd: 0.2, angle: -Math.PI / 2,
      disabledT: 0, buff: { range: 0, dmg: 0, rate: 0 }, pushCd: 2, kills: 0, dmgDone: 0, recoil: 0, fireT: 0, born: this.time };
    this.grid[r][c].tower = t; this.towers.push(t);
    this.stats.built++; this.stats.maxTowers = Math.max(this.stats.maxTowers, this.towers.length);
    this._buffT = 0; this.emit('build', { t });
    return t;
  }
  upgrade(t, br) {
    if (this.state !== 'play' || t.lvl >= 2) return false;
    if (t.lvl === 1 && br !== 'a' && br !== 'b') return false;
    const cost = this.upgradeCost(t, br);
    if (this.gold < cost) return false;
    this.gold -= cost; t.spent += cost; t.lvl++; if (t.lvl === 2) { t.br = br; this.stats.maxTier[t.type] = true; }
    this._buffT = 0; this.emit('upgrade', { t });
    return true;
  }
  sell(t) {
    const i = this.towers.indexOf(t); if (i < 0) return 0;
    const v = this.sellValue(t);
    this.gold += v; this.towers.splice(i, 1); this.grid[t.r][t.c].tower = null; this._buffT = 0;
    this.emit('sell', { t, v });
    return v;
  }
  setMode(t, m) { t.mode = m; }

  // ---------- oleadas ----------
  waveGroups(w) { return buildWave(this.L, w, this.endless); }
  canCall() { return this.state === 'play' && !this.spawning && this.wave < this.totalWaves; }
  earlyBonus() { return this.wave > 0 && this.nextTimer > 0 ? Math.round(this.nextTimer * (1.1 + this.wave * 0.09)) : 0; }
  callWave(auto) {
    if (!this.canCall()) return false;
    let bonus = 0, interest = 0;
    if (this.wave > 0) {
      if (!auto) { bonus = this.earlyBonus(); if (bonus > 0) this.stats.early++; }
      interest = Math.min(25 + 15 * (this.meta.bank || 0), Math.floor(this.gold * 0.04));
      const pay = 10 + 2 * this.wave; // la paga de la tropa
      this.gold += bonus + interest + pay; this.stats.interest += interest;
    }
    this.wave++;
    const groups = this.waveGroups(this.wave);
    this.spawns = groups.map((g) => ({ ...g, left: g.count, timer: g.at }));
    this.spawning = true; this.nextTimer = -1;
    this.emit('wave', { wave: this.wave, boss: groups.some((g) => g.boss), bonus, interest });
    return true;
  }

  // ---------- enemigos ----------
  spawnEnemy(type, pathIdx, d = 0, parentLane) {
    const def = ENEMIES[type], path = this.paths[pathIdx];
    const w = Math.max(1, this.wave);
    let scale = hpScale(w) * this.L.hpMul * this.diff.hp;
    if (def.boss) scale = Math.max(1 + 0.055 * (w - 1), hpScale(w) * 0.32) * this.L.hpMul * this.diff.hp;
    const hp = def.hp * scale;
    const laneW = def.boss ? 0 : path.kind === 'air' ? 0.7 : path.kind === 'sea' ? 0.2 : 0.34;
    const e = {
      id: UID++, type, def, path: pathIdx, d, hp, maxHp: hp, scale, armor: def.armor || 0,
      lane: parentLane !== undefined ? parentLane + (this.R() - 0.5) * 0.25 : (this.R() - 0.5) * laneW,
      x: 0, y: 0, dir: 1, alive: true, flying: def.kind === 'air', naval: def.kind === 'sea',
      shield: (def.shield || 0) * Math.sqrt(scale), shieldMax: (def.shield || 0) * Math.sqrt(scale), lastHit: -9,
      slow: 0, slowT: 0, freezeT: 0, stunT: 0, revealT: 0, markT: 0, markAmt: 0, flash: 0, rallyT: 0,
      chargeT: 0, chargeCd: 5, summonCd: def.summon ? def.summon[2] * 0.6 : 0, healCd: 1, rallyCd: 4, broadCd: 5, vanishCd: 9, vanishT: 0, phased: false,
      blockedBy: null, curSpd: def.spd, born: this.time, wobble: this.R() * 6.28,
    };
    if (e.lane > 0.4) e.lane = 0.4; if (e.lane < -0.4) e.lane = -0.4;
    this.place(e);
    this.enemies.push(e);
    if (!this.seen.has(type)) { this.seen.add(type); this.emit('newenemy', { type }); }
    if (def.boss) this.emit('boss', { e });
    return e;
  }
  place(e) {
    const p = samplePath(this.paths[e.path], e.d);
    const nx = e.x;
    e.x = p.x + p.nx * e.lane; e.y = p.y + p.ny * e.lane;
    if (Math.abs(p.dx) > 0.2) e.dir = p.dx > 0 ? 1 : -1;
    e.hx = p.dx; e.hy = p.dy;
    return nx;
  }
  visible(e) {
    if (this.flareT > 0) return true;
    if (e.vanishT > 0) return false;
    return !e.def.stealth || e.revealT > 0;
  }
  remaining(e) { return this.paths[e.path].len - e.d; }

  damage(e, amount, o = {}) {
    if (!e.alive || amount <= 0) return 0;
    let m = 1 + (e.markT > 0 ? e.markAmt : 0) + (this.flareT > 0 ? 0.15 : 0);
    amount *= m;
    if (e.armor) amount *= 1 - e.armor * (1 - (o.pierce || 0));
    if (e.shield > 0) {
      const k = o.splash ? 1.7 : 1, s = amount * k;
      if (s <= e.shield) { e.shield -= s; amount = 0; }
      else { amount = (s - e.shield) / k; e.shield = 0; this.emit('shieldbreak', { x: e.x, y: e.y }); }
    }
    const dealt = Math.min(e.hp, amount);
    e.hp -= amount; e.flash = 0.1; e.lastHit = this.time;
    if (o.src) o.src.dmgDone += dealt;
    if (e.hp <= 0) this.kill(e, o.src);
    return dealt;
  }
  kill(e, src) {
    e.alive = false;
    const g = Math.round(e.def.gold * (1.2 + 0.03 * this.wave) * (this.diff.gold < 1 ? this.diff.gold : 1));
    this.gold += g; this.stats.gold += g; this.stats.kills++;
    if (src) src.kills++;
    if (e.blockedBy) this.release(e);
    if (e.def.boss) { this.stats.bosses++; if (e.type === 'galeona') this.stats.galeona++; this.emit('bossdown', { e }); }
    if (e.def.split) {
      const [type, n] = e.def.split;
      for (let i = 0; i < n; i++) { const c = this.spawnEnemy(type, e.path, Math.max(0, e.d - 0.15 - i * 0.22), e.lane); c.scale = e.scale; }
    }
    this.emit('death', { x: e.x, y: e.y, type: e.type, gold: g, boss: !!e.def.boss, naval: e.naval, flying: e.flying });
  }
  release(e) { const s = e.blockedBy; if (s) { const i = s.engaged.indexOf(e); if (i >= 0) s.engaged.splice(i, 1); } e.blockedBy = null; }

  splash(x, y, r, dmg, o = {}) {
    let n = 0;
    for (const e of this.enemies) {
      if (!e.alive || (e.flying && !o.air)) continue;
      const dist = hyp(e.x - x, e.y - y);
      if (dist > r + e.def.r * 0.5) continue;
      const f = dist < r * 0.5 ? 1 : 1 - 0.4 * Math.min(1, (dist - r * 0.5) / (r * 0.5));
      this.damage(e, dmg * f, { splash: true, pierce: o.pierce, src: o.src });
      if (o.stun && e.alive && !e.def.boss) e.stunT = Math.max(e.stunT, o.stun);
      n++;
    }
    return n;
  }
  predict(e, t) {
    const p = samplePath(this.paths[e.path], e.d + e.curSpd * t, { x: 0, y: 0, nx: 0, ny: 0 });
    return [p.x + p.nx * e.lane, p.y + p.ny * e.lane];
  }

  // ---------- poderes ----------
  nearestLand(x, y) {
    let best = null;
    this.paths.forEach((p, i) => {
      if (p.kind !== 'land') return;
      for (const [sx, sy, d] of p.samples) {
        const dd = hyp(sx - x, sy - y);
        if (!best || dd < best.dist) best = { path: i, d, dist: dd, x: sx, y: sy };
      }
    });
    return best;
  }
  canUse(id) { return this.state === 'play' && this.abil[id].cd <= 0; }
  useAbility(id, x, y) {
    if (!this.canUse(id)) return false;
    const w = Math.max(1, this.wave);
    if (id === 'bomb') {
      const dmg = 150 * (1 + 0.3 * (this.meta.naval || 0)) * (1 + 0.09 * w);
      for (let i = 0; i < 3; i++) {
        const a = this.R() * 6.28, rr = i === 0 ? 0 : 0.45 + this.R() * 0.35;
        this.strikes.push({ x: x + Math.cos(a) * rr, y: y + Math.sin(a) * rr, t: 0.75 + i * 0.28, dmg, r: 1.25 });
      }
      this.emit('bombcall', { x, y });
    } else if (id === 'troops') {
      const p = this.nearestLand(x, y);
      if (!p || p.dist > 1.0) return false;
      const k = 1 + 0.4 * (this.meta.blandeng || 0);
      for (const off of [0.25, -0.2]) {
        const d = Math.max(0.3, Math.min(this.paths[p.path].len - 0.5, p.d + off));
        const s = { id: UID++, path: p.path, d, hp: 0, maxHp: 0, dmg: 22 * k * (1 + 0.07 * w), atkT: 0, life: 16, engaged: [], x: 0, y: 0, side: off > 0 ? 1 : -1, born: this.time };
        s.maxHp = s.hp = 240 * k * (1 + 0.1 * w);
        const q = samplePath(this.paths[p.path], d); s.x = q.x + q.nx * 0.18 * s.side; s.y = q.y + q.ny * 0.18 * s.side;
        this.soldiers.push(s);
      }
      this.emit('troops', { x: p.x, y: p.y });
    } else if (id === 'flare') {
      this.flareT = 10; this.emit('flare', {});
    }
    this.abil[id].cd = this.abil[id].max; this.stats.abilities++;
    return true;
  }

  // ---------- proyectiles (pool) ----------
  proj() { const p = this._projFree.pop() || {}; p.hits = p.hits || []; p.hits.length = 0; this.projs.push(p); return p; }

  // ---------- paso ----------
  step(dt = TICK) {
    if (this.state !== 'play') return;
    this.time += dt;
    // aparición
    if (this.spawning) {
      let left = 0;
      for (const s of this.spawns) {
        if (s.left <= 0) continue;
        s.timer -= dt;
        while (s.timer <= 0 && s.left > 0) { this.spawnEnemy(s.type, s.path); s.left--; s.timer += s.gap; }
        left += s.left;
      }
      if (left === 0) {
        this.spawning = false;
        if (this.wave < this.totalWaves) { this.nextTimer = this.nextTimerMax; this.emit('wavedone', { wave: this.wave }); }
      }
    } else if (this.nextTimer > 0) {
      this.nextTimer -= dt;
      if (this.nextTimer <= 0) { this.nextTimer = 0; this.callWave(true); }
    }
    if (this.flareT > 0) this.flareT -= dt;
    for (const k in this.abil) if (this.abil[k].cd > 0) this.abil[k].cd = Math.max(0, this.abil[k].cd - dt);

    // faros: revelar/marcar y buffs
    this._scanT -= dt;
    if (this._scanT <= 0) { this._scanT = 0.15; this.scanFaros(); }

    for (let i = 0; i < this.enemies.length; i++) this.updEnemy(this.enemies[i], dt);
    for (const t of this.towers) this.updTower(t, dt);
    this.updProjs(dt);
    // charcos de brea
    for (let i = this.zones.length - 1; i >= 0; i--) {
      const z = this.zones[i]; z.t -= dt;
      if (z.t <= 0) { this.zones.splice(i, 1); continue; }
      for (const e of this.enemies) if (e.alive && !e.flying && hyp(e.x - z.x, e.y - z.y) < z.r) this.damage(e, z.dps * dt, { src: z.src });
    }
    // bombardeo
    for (let i = this.strikes.length - 1; i >= 0; i--) {
      const s = this.strikes[i]; s.t -= dt;
      if (s.t <= 0) { this.strikes.splice(i, 1); this.splash(s.x, s.y, s.r, s.dmg, { air: true, pierce: 0.5, stun: 0.4 }); this.emit('boom', { x: s.x, y: s.y, r: s.r, big: true }); }
    }
    this.updSoldiers(dt);
    // limpiar
    let j = 0;
    for (const e of this.enemies) if (e.alive) this.enemies[j++] = e;
    this.enemies.length = j;
    if (this.lives <= 0 && this.state === 'play') { this.lives = 0; this.state = 'lost'; this.emit('lost', {}); }
    else if (!this.spawning && this.wave >= this.totalWaves && this.enemies.length === 0 && this.state === 'play') {
      this.state = 'won'; this.emit('won', {});
    }
  }

  scanFaros() {
    const faros = this.towers.filter((t) => t.type === 'faro' && t.disabledT <= 0);
    // de muy cerquita cualquier torre ve a los invisibles
    for (const e of this.enemies) {
      if (!e.alive || !e.def.stealth) continue;
      for (const t of this.towers) if (Math.abs(t.x - e.x) < 1.25 && Math.abs(t.y - e.y) < 1.25 && hyp(t.x - e.x, t.y - e.y) < 1.25) { e.revealT = 0.3; break; }
    }
    for (const f of faros) {
      const s = this.stats_(f);
      for (const e of this.enemies) {
        if (!e.alive) continue;
        if (hyp(e.x - f.x, e.y - f.y) <= s.range) { e.revealT = 0.3; if (s.mark) { e.markT = 0.3; e.markAmt = s.mark; } }
      }
    }
    this._buffT -= 0.15;
    if (this._buffT <= 0) {
      this._buffT = 0.5;
      for (const t of this.towers) {
        t.buff.range = 0; t.buff.dmg = 0; t.buff.rate = 0;
        if (TOWERS[t.type].support) continue;
        for (const f of faros) {
          const s = this.stats_(f);
          if (hyp(t.x - f.x, t.y - f.y) <= s.range) {
            t.buff.range = Math.max(t.buff.range, s.bRange); t.buff.dmg = Math.max(t.buff.dmg, s.bDmg); t.buff.rate = Math.max(t.buff.rate, s.bRate);
          }
        }
      }
    }
  }

  updEnemy(e, dt) {
    if (!e.alive) return;
    const def = e.def;
    if (e.flash > 0) e.flash -= dt;
    if (e.slowT > 0) { e.slowT -= dt; if (e.slowT <= 0) e.slow = 0; }
    if (e.freezeT > 0) e.freezeT -= dt;
    if (e.stunT > 0) e.stunT -= dt;
    if (e.revealT > 0) e.revealT -= dt;
    if (e.markT > 0) e.markT -= dt;
    if (e.rallyT > 0) e.rallyT -= dt;
    if (e.vanishT > 0) e.vanishT -= dt;
    // escudo se recarga
    if (e.shieldMax > 0 && !e.phased && e.shield < e.shieldMax && this.time - e.lastHit > 3) e.shield = Math.min(e.shieldMax, e.shield + e.shieldMax * 0.3 * dt);
    // habilidades
    if (def.heal) {
      e.healCd -= dt;
      if (e.healCd <= 0) {
        e.healCd = 1; let any = false;
        for (const o of this.enemies) if (o.alive && o !== e && !o.def.boss && o.hp < o.maxHp && hyp(o.x - e.x, o.y - e.y) < def.healR) { o.hp = Math.min(o.maxHp, o.hp + def.heal * Math.sqrt(o.scale) * 1.4); any = true; }
        if (any) this.emit('heal', { x: e.x, y: e.y, r: def.healR });
      }
    }
    if (def.charge) {
      if (e.chargeT > 0) e.chargeT -= dt;
      else { e.chargeCd -= dt; if (e.chargeCd <= 0) { e.chargeCd = 7; e.chargeT = 1.6; this.emit('charge', { x: e.x, y: e.y }); } }
    }
    if (def.summon) {
      e.summonCd -= dt;
      if (e.summonCd <= 0) {
        e.summonCd = def.summon[2];
        for (let i = 0; i < def.summon[1]; i++) this.spawnEnemy(def.summon[0], e.path, Math.max(0, e.d - 0.5 - i * 0.3));
        this.emit('summon', { x: e.x, y: e.y });
      }
    }
    if (def.rally) {
      e.rallyCd -= dt;
      if (e.rallyCd <= 0) {
        e.rallyCd = 6;
        for (const o of this.enemies) if (o.alive && o !== e && hyp(o.x - e.x, o.y - e.y) < 2.3) o.rallyT = 3;
        this.emit('rally', { x: e.x, y: e.y });
      }
    }
    if (def.broadside) {
      e.broadCd -= dt;
      if (e.broadCd <= 0) {
        e.broadCd = 6.5;
        let best = null, bd = 3.4;
        for (const t of this.towers) { const dd = hyp(t.x - e.x, t.y - e.y); if (dd < bd && t.disabledT <= 0) { bd = dd; best = t; } }
        if (best) {
          const p = this.proj();
          Object.assign(p, { kind: 'eball', sx: e.x, sy: e.y, x: e.x, y: e.y, tx: best.x, ty: best.y, t: 0, T: 0.7, target: best });
          this.emit('broadside', { x: e.x, y: e.y });
        }
      }
    }
    if (def.vanish) {
      e.vanishCd -= dt;
      if (e.vanishCd <= 0) { e.vanishCd = 13; e.vanishT = 3; this.emit('vanish', { x: e.x, y: e.y }); }
    }
    if (def.phase && !e.phased && e.hp < e.maxHp * 0.5) {
      e.phased = true; e.shield = e.shieldMax = def.phase * e.scale * 0.5; this.emit('phase', { x: e.x, y: e.y });
    }
    // movimiento
    let spd = def.spd * (1 - e.slow) * (e.rallyT > 0 ? 1.4 : 1) * (e.chargeT > 0 ? 2.6 : 1);
    if (e.freezeT > 0 || e.stunT > 0) spd = 0;
    if (!e.flying && !e.naval && !def.boss && !e.blockedBy) {
      for (const s of this.soldiers) {
        if (s.path === e.path && s.engaged.length < 2 && s.hp > 0) {
          const gap = s.d - e.d;
          if (gap > -0.05 && gap < 0.32) { e.blockedBy = s; s.engaged.push(e); break; }
        }
      }
    }
    if (e.blockedBy) {
      spd = 0;
      e.blockedBy.hp -= (def.melee || 8) * (1 + 0.06 * this.wave) * dt;
    } else if (def.boss && def.kind === 'land') {
      for (const s of this.soldiers) if (s.path === e.path && Math.abs(s.d - e.d) < 0.35) s.hp -= def.melee * dt;
    }
    e.curSpd = spd;
    e.d += spd * dt;
    const path = this.paths[e.path];
    if (e.d >= path.len) {
      e.alive = false; this.lives -= def.life || 1; this.stats.leaked += def.life || 1; this.stats.leakBy = this.stats.leakBy || {}; this.stats.leakBy[e.type] = (this.stats.leakBy[e.type] || 0) + (def.life || 1);
      this.emit('leak', { x: e.x, y: e.y, n: def.life || 1, boss: !!def.boss });
      return;
    }
    this.place(e);
  }

  pickTarget(t, s, range) {
    const air = TOWERS[t.type].air, min = s.min || 0;
    let best = null, bv = Infinity;
    for (const e of this.enemies) {
      if (!e.alive || (e.flying && !air) || !this.visible(e)) continue;
      const dd = hyp(e.x - t.x, e.y - t.y);
      if (dd > range + e.def.r * 0.4 || dd < min) continue;
      let v;
      switch (t.mode) {
        case 'last': v = -this.remaining(e); break;
        case 'strong': v = -(e.hp + e.shield); break;
        case 'close': v = dd; break;
        default: v = this.remaining(e);
      }
      if (v < bv) { bv = v; best = e; }
    }
    return best;
  }

  updTower(t, dt) {
    if (t.recoil > 0) t.recoil = Math.max(0, t.recoil - dt * 4);
    if (t.disabledT > 0) { t.disabledT -= dt; return; }
    const d = TOWERS[t.type], s = this.stats_(t);
    if (d.support) { t.angle += dt * 1.6; return; }
    const range = s.range * (1 + t.buff.range);
    const dmgMul = (1 + t.buff.dmg) * (1 + 0.07 * (this.meta.dmg || 0));
    t.cd -= dt * (1 + t.buff.rate);
    if (d.aura) {
      if (s.push) t.pushCd -= dt;
      if (t.cd > 0) return;
      t.cd = s.cd;
      let any = false, pushed = false;
      for (const e of this.enemies) {
        if (!e.alive || hyp(e.x - t.x, e.y - t.y) > range + e.def.r * 0.4) continue;
        any = true;
        const sl = e.def.boss ? s.slow * 0.6 : s.slow;
        if (sl >= e.slow) { e.slow = sl; }
        e.slowT = 0.7;
        this.damage(e, s.dmg * dmgMul, { src: t });
        if (s.freeze && e.alive && !e.def.boss && this.R() < s.freeze) { e.freezeT = s.freezeT; this.emit('freeze', { x: e.x, y: e.y }); }
        if (s.push && t.pushCd <= 0 && e.alive && !e.blockedBy) { e.d = Math.max(0, e.d - (e.def.boss ? s.push * 0.25 : s.push)); this.place(e); pushed = true; }
      }
      if (pushed) { t.pushCd = s.pushCd; this.emit('push', { t }); }
      if (any) { t.fireT = this.time; this.emit('gust', { t }); }
      return;
    }
    if (t.cd > 0) {
      // girar hacia el objetivo aunque no dispare
      if (((this.time * 10) | 0) % 3 === t.id % 3) { const e = this.pickTarget(t, s, range); if (e) t.aim = e; }
      if (t.aim && t.aim.alive) t.angle = turn(t.angle, Math.atan2(t.aim.y - t.y, t.aim.x - t.x), dt * 8);
      return;
    }
    const e = this.pickTarget(t, s, range);
    if (!e) { t.cd = 0.05; return; }
    t.aim = e; t.cd = s.cd; t.fireT = this.time; t.recoil = 1;
    const dmg = s.dmg * dmgMul;
    if (t.type === 'mosq') {
      t.angle = Math.atan2(e.y - t.y, e.x - t.x);
      let crit = s.crit && this.R() < s.crit;
      this.damage(e, crit ? dmg * s.critMul : dmg, { src: t });
      this.emit('shot', { t, x: e.x, y: e.y, crit, elite: !!s.crit });
      if (s.double) {
        // segundo tirador: otro objetivo si hay
        const save = e.alive; let e2 = null;
        for (const o of this.enemies) if (o.alive && o !== e && this.visible(o) && hyp(o.x - t.x, o.y - t.y) <= range) { e2 = o; break; }
        const tgt = e2 || (save ? e : null);
        if (tgt) { this.damage(tgt, dmg, { src: t }); this.emit('shot', { t, x: tgt.x, y: tgt.y, second: true }); }
      }
    } else if (t.type === 'canon') {
      if (s.cone) {
        const a0 = Math.atan2(e.y - t.y, e.x - t.x); t.angle = a0;
        for (const o of this.enemies) {
          if (!o.alive || o.flying) continue;
          const dd = hyp(o.x - t.x, o.y - t.y);
          if (dd > range + 0.3) continue;
          let da = Math.abs(angDiff(Math.atan2(o.y - t.y, o.x - t.x), a0));
          if (da < s.cone / 2 + 0.15) this.damage(o, dmg, { src: t, splash: true });
        }
        this.emit('cone', { t, a: a0, range });
      } else {
        const dist = hyp(e.x - t.x, e.y - t.y), T = dist / 8.5;
        const [px, py] = this.predict(e, T);
        t.angle = Math.atan2(py - t.y, px - t.x);
        const p = this.proj();
        Object.assign(p, { kind: 'ball', sx: t.x + Math.cos(t.angle) * 0.35, sy: t.y + Math.sin(t.angle) * 0.35, x: t.x, y: t.y, tx: px, ty: py, t: 0, T, dmg, r: s.splash, stun: s.stun || 0, src: t, big: !!s.stun });
        this.emit('cannon', { t, big: !!s.stun });
      }
    } else if (t.type === 'mortero') {
      const T = 1.15;
      const [px, py] = this.predict(e, T);
      t.angle = Math.atan2(py - t.y, px - t.x);
      const p = this.proj();
      Object.assign(p, { kind: 'shell', sx: t.x, sy: t.y - 0.2, x: t.x, y: t.y, tx: px, ty: py, t: 0, T, dmg, r: s.splash, fire: s.fire || 0, fireT: s.fireT || 0, src: t, big: t.lvl === 2 && t.br === 'a' });
      this.emit('mortar', { t });
    } else if (t.type === 'ballesta') {
      const dist = hyp(e.x - t.x, e.y - t.y);
      const [px, py] = this.predict(e, dist / 13);
      const a = Math.atan2(py - t.y, px - t.x); t.angle = a;
      const p = this.proj();
      Object.assign(p, { kind: 'bolt', sx: t.x, sy: t.y, x: t.x, y: t.y, vx: Math.cos(a) * 13, vy: Math.sin(a) * 13, dist: 0, max: range * 1.25, dmg, pierce: s.pierce, ap: s.armorPierce || 0, src: t, big: !!s.armorPierce });
      this.emit('bolt', { t });
    }
  }

  updProjs(dt) {
    const P = this.projs;
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i]; let done = false;
      if (p.kind === 'bolt') {
        const nx = p.x + p.vx * dt, ny = p.y + p.vy * dt;
        for (const e of this.enemies) {
          if (!e.alive || p.hits.includes(e.id)) continue;
          if (distSeg(e.x, e.y, p.x, p.y, nx, ny) < e.def.r + 0.1) {
            p.hits.push(e.id); this.damage(e, p.dmg, { pierce: p.ap, src: p.src }); this.emit('hit', { x: e.x, y: e.y });
            if (p.hits.length >= p.pierce) { done = true; break; }
          }
        }
        p.x = nx; p.y = ny; p.dist += 13 * dt;
        if (p.dist > p.max) done = true;
      } else {
        p.t += dt; const k = Math.min(1, p.t / p.T);
        p.x = p.sx + (p.tx - p.sx) * k; p.y = p.sy + (p.ty - p.sy) * k;
        if (k >= 1) {
          done = true;
          if (p.kind === 'ball') { this.splash(p.tx, p.ty, p.r, p.dmg, { stun: p.stun, src: p.src }); this.emit('boom', { x: p.tx, y: p.ty, r: p.r, big: p.big }); }
          else if (p.kind === 'shell') {
            this.splash(p.tx, p.ty, p.r, p.dmg, { pierce: 0.5, src: p.src }); this.emit('boom', { x: p.tx, y: p.ty, r: p.r, big: true });
            if (p.fire) this.zones.push({ x: p.tx, y: p.ty, r: p.r * 0.85, dps: p.fire * (1 + 0.07 * (this.meta.dmg || 0)), t: p.fireT, T: p.fireT, src: p.src });
          } else if (p.kind === 'eball') {
            if (this.towers.includes(p.target)) { p.target.disabledT = 3.5; this.emit('disabled', { t: p.target }); }
            this.emit('boom', { x: p.tx, y: p.ty, r: 0.6 });
          }
        }
      }
      if (done) { p.target = null; p.src = null; P.splice(i, 1); this._projFree.push(p); }
    }
  }

  updSoldiers(dt) {
    for (let i = this.soldiers.length - 1; i >= 0; i--) {
      const s = this.soldiers[i];
      s.life -= dt; s.atkT -= dt;
      for (let k = s.engaged.length - 1; k >= 0; k--) if (!s.engaged[k].alive) s.engaged.splice(k, 1);
      if (s.engaged.length && s.atkT <= 0) {
        s.atkT = 0.7; const e = s.engaged[0];
        this.damage(e, s.dmg, {}); this.emit('slash', { x: e.x, y: e.y, s });
      }
      if (s.hp <= 0 || s.life <= 0) {
        for (const e of s.engaged) e.blockedBy = null;
        s.engaged.length = 0; this.soldiers.splice(i, 1);
        this.emit('soldierdown', { x: s.x, y: s.y, died: s.hp <= 0 });
      }
    }
  }

  starsEarned() {
    if (this.state !== 'won') return 0;
    const f = this.lives / this.livesStart;
    return f >= 0.9 ? 3 : f >= 0.5 ? 2 : 1;
  }
}

export function angDiff(a, b) { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; }
function turn(a, target, k) { return a - angDiff(a, target) * Math.min(1, k); }
function distSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy || 1;
  let t = ((px - ax) * dx + (py - ay) * dy) / l; t = t < 0 ? 0 : t > 1 ? 1 : t;
  return hyp(px - ax - dx * t, py - ay - dy * t);
}
