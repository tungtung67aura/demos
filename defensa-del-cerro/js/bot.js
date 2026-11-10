/* Defensa del Cerro — bot de prueba/autoplay. skill: 'good' (jugador decente) o 'newbie' (jugador nuevo). */
import { COLS, ROWS, TOWERS, ENEMIES } from './data.js';

const BRANCH = { mosq: 'b', canon: 'a', mortero: 'a', pampero: 'a', ballesta: 'b', faro: 'a' };
const ORDER_GOOD = ['mosq', 'canon', 'mosq', 'pampero', 'mortero', 'canon', 'ballesta', 'faro', 'mosq', 'mortero', 'canon', 'ballesta', 'pampero', 'mosq', 'mortero', 'ballesta'];
const ORDER_NEWBIE = ['mosq', 'mosq', 'canon', 'mosq', 'canon', 'mosq', 'canon', 'mosq'];

export class Bot {
  constructor(game, skill = 'good', seed = 3) {
    this.g = game; this.skill = skill; this.t = 0; this.i = 0; this.s = seed;
    this.cover = {};
  }
  rnd() { this.s = (this.s * 1103515245 + 12345) & 0x7fffffff; return this.s / 0x7fffffff; }
  coverage(type, c, r) {
    const key = type + c + ',' + r;
    if (this.cover[key] !== undefined) return this.cover[key];
    const d = TOWERS[type], s = d.lv[1], x = c + 0.5, y = r + 0.5;
    let n = 0;
    for (let pi = 0; pi < this.g.paths.length; pi++) {
      const p = this.g.paths[pi];
      if (p.kind === 'air' && !d.air) continue;
      const w = 0.15 + (this.share[pi] || 0) * this.g.paths.length;
      for (const [sx, sy] of p.samples) {
        const dd = Math.hypot(sx - x, sy - y);
        if (dd <= s.range && dd >= (s.min || 0)) n += w;
      }
    }
    if (type === 'faro') { // un faro vale por las torres y el camino que cubre
      n = n * 0.5;
      for (const t of this.g.towers) if (Math.hypot(t.x - x, t.y - y) <= s.range && t.type !== 'faro') n += 6;
    }
    return (this.cover[key] = n);
  }
  bestTile(type) {
    let best = null, bv = -1;
    const all = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      if (!this.g.buildable(c, r)) continue;
      let v = this.coverage(type, c, r);
      // no amontonar torres del mismo tipo
      for (const t of this.g.towers) if (t.type === type && Math.hypot(t.c - c, t.r - r) < 1.5) v *= 0.85;
      all.push([v, c, r]);
      if (v > bv) { bv = v; best = [c, r]; }
    }
    if (this.skill === 'newbie' && all.length) {
      // el nuevo elige "bastante bien" pero no lo mejor
      all.sort((a, b) => b[0] - a[0]);
      const k = Math.min(all.length - 1, Math.floor(this.rnd() * Math.min(10, all.length)));
      return [all[k][1], all[k][2]];
    }
    if (type === 'faro' && this.g.towers.filter((t) => t.type === 'faro').length) { delete this.cover; this.cover = {}; }
    return best;
  }
  needFaro() {
    const g = this.g;
    if (!g.unlocked.includes('faro') || g.towers.some((t) => t.type === 'faro')) return false;
    return g.L.pool.some(([t, from]) => ENEMIES[t].stealth && from <= g.wave + 2) || g.endless;
  }
  updateShare() {
    // cuánto peligro viene por cada camino en las próximas oleadas (lo que ve un jugador atento)
    const g = this.g; this.share = {}; let tot = 0;
    for (let w = Math.max(1, g.wave); w <= g.wave + 2; w++) for (const gr of g.waveGroups(w)) {
      const e = ENEMIES[gr.type]; const v = gr.count * (e.threat || 8);
      this.share[gr.path] = (this.share[gr.path] || 0) + v; tot += v;
    }
    for (const k in this.share) this.share[k] /= tot || 1;
    this.cover = {}; this.shareWave = g.wave;
  }
  tick(dt) {
    const g = this.g;
    if (g.state !== 'play') return;
    if (this.shareWave !== g.wave) this.updateShare();
    this.t -= dt;
    if (this.t > 0) return;
    this.t = this.skill === 'newbie' ? 1.2 : 0.4;
    const order = (this.skill === 'newbie' ? ORDER_NEWBIE : ORDER_GOOD).filter((t) => g.unlocked.includes(t));
    // gastar
    for (let guard = 0; guard < 4; guard++) {
      let next = this.needFaro() ? 'faro' : order[this.i % order.length];
      const cost = g.towerCost(next);
      const cap = this.skill === 'newbie' ? 3 + g.wave * 0.5 : 4 + g.wave * 0.9;
      const upg = this.cheapestUpgrade();
      const preferUpgrade = upg && (g.towers.length >= cap || (upg.cost <= cost * 1.2 && this.rnd() < 0.5));
      if (this.skill === 'newbie') { if (upg && g.gold >= upg.cost && this.rnd() < 0.25) { g.upgrade(upg.t, upg.br); continue; } if (g.gold >= cost) { const tl = this.bestTile(next); if (tl && g.build(next, tl[0], tl[1])) { this.i++; continue; } } break; }
      if (preferUpgrade && g.gold >= upg.cost) { g.upgrade(upg.t, upg.br); continue; }
      if (!preferUpgrade && g.gold >= cost) {
        const tile = this.bestTile(next);
        if (tile && g.build(next, tile[0], tile[1])) { if (next !== 'faro' || !this.needFaro()) this.i++; continue; }
      }
      break;
    }
    // poderes
    if (this.skill === 'good' && g.wave > 0) {
      const alive = g.enemies.filter((e) => e.alive);
      if (alive.length) {
        if (g.canUse('bomb')) {
          const boss = alive.find((e) => e.def.boss);
          let tgt = boss;
          if (!tgt) {
            let bv = 0;
            for (const e of alive) { let n = 0; for (const o of alive) if (Math.hypot(o.x - e.x, o.y - e.y) < 1.3) n++; if (n > bv) { bv = n; tgt = e; } }
            if (bv < 5) tgt = null;
          }
          if (tgt) g.useAbility('bomb', tgt.x, tgt.y);
        }
        if (g.canUse('troops')) {
          const lead = alive.filter((e) => !e.flying && !e.naval && !e.def.boss).sort((a, b) => g.remaining(a) - g.remaining(b))[0];
          if (lead && g.remaining(lead) < 9) g.useAbility('troops', lead.x, lead.y);
        }
        if (g.canUse('flare') && alive.some((e) => (e.def.stealth && e.revealT <= 0) || e.vanishT > 0)) g.useAbility('flare');
      }
    }
    // oleadas
    if (g.canCall()) {
      if (g.wave === 0) { if (g.towers.length >= 2 || g.gold < 110) g.callWave(); }
      else if (this.skill === 'good' && g.enemies.length < 3 + g.wave * 0.3 && g.lives > g.livesStart * 0.5) g.callWave();
    }
  }
  cheapestUpgrade() {
    let best = null;
    for (const t of this.g.towers) {
      if (t.lvl >= 2) continue;
      const br = t.lvl === 1 ? BRANCH[t.type] : null;
      const cost = this.g.upgradeCost(t, br);
      const v = this.coverage(t.type, t.c, t.r) / cost;
      if (!best || v > best.v) best = { t, br, cost, v };
    }
    return best;
  }
}
