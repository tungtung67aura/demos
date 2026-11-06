import { LEVELS } from "./levels.js";

export const TILE = 16;
export const MAX_HEARTS = 5;
export const START_AMMO = 8;
export const MAX_AMMO = 16;
const PICKUP_AMMO = 5;

const PW = 10;
const PH = 20;
const GRAVITY = 1680;
const MAX_FALL = 640;
const MAX_RUN = 124;
const ACCEL = 980;
const AIR_ACCEL = 640;
const FRICTION = 820;
const JUMP_V = -452;
const COYOTE = 0.11;
const JUMP_BUFFER = 0.12;
const WALL_JUMP_X = 168;
const WALL_JUMP_Y = -430;
const WALL_SLIDE = 58;
const WALL_COYOTE = 0.12;
const WALL_LOCK = 0.15;
const ATTACK_TIME = 0.2;
const ATTACK_CD = 0.32;
const STAR_CD = 0.28;
const BOSS_HP = 16;

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function blankInput() {
  return {
    axis: 0,
    jumpHeld: false,
    jumpPressed: false,
    attackPressed: false,
    shurikenPressed: false,
    pausePressed: false,
    confirmPressed: false,
  };
}

export function createGame() {
  const game = {
    mode: "title",
    levelIndex: 0,
    level: null,
    player: null,
    enemies: [],
    projectiles: [],
    coinsList: [],
    pickups: [],
    goal: null,
    boss: null,
    bossFight: false,
    checkpoint: "start",
    coins: 0,
    collected: new Set(),
    ammo: START_AMMO,
    time: 0,
    clock: 0,
    kills: 0,
    camX: 0,
    camY: 0,
    snapCam: true,
    viewW: 320,
    viewH: 180,
    introT: 0,
    deadT: 0,
    bossDeadT: 0,
    shake: 0,
    flash: 0,
    particles: [],
    events: [],
    nextId: 1,
    safeLeft: 0,
    safeRight: 0,
    safeTop: 0,
    safeBottom: 0,
    checkpointRank: 0,
    checkpointSpawn: null,
    hitstop: 0,
    bannerText: "",
    bannerT: 0,
    levelTime: 0,
    levelCoins: 0,
    clearInfo: null,
    winRecord: null,
    records: null,
  };
  loadLevel(game, 0);
  game.mode = "title";
  return game;
}

export function startGame(game) {
  game.coins = 0;
  game.collected = new Set();
  game.ammo = START_AMMO;
  game.time = 0;
  game.levelTime = 0;
  game.levelCoins = 0;
  game.kills = 0;
  game.clearInfo = null;
  game.winRecord = null;
  game.mode = "intro";
  game.introT = 1.2;
  loadLevel(game, 0);
}

export function retryLevel(game) {
  const index = game.levelIndex;
  for (const key of [...game.collected]) {
    if (key.startsWith(`${index}:`)) game.collected.delete(key);
  }
  game.coins = Math.max(0, game.coins - (game.levelCoins || 0));
  loadLevel(game, index);
  game.levelTime = 0;
  game.levelCoins = 0;
  game.clearInfo = null;
  game.mode = "play";
  game.player.hearts = MAX_HEARTS;
  game.player.invuln = 1.05;
  game.introT = 0;
}

export function enterLevel(game, index) {
  loadLevel(game, index);
  game.mode = "play";
  game.introT = 0;
}

export function setView(game, w, h) {
  game.viewW = Math.max(160, w);
  game.viewH = Math.max(120, h);
}

function emit(game, name) {
  game.events.push(name);
}

function tileAt(game, tx, ty) {
  if (ty < 0) return ".";
  if (tx < 0 || tx >= game.level.w) return "#";
  if (ty >= game.level.h) return ".";
  return game.level.tiles[ty][tx];
}

function tilesIn(game, x, y, w, h, pred) {
  const x0 = Math.floor(x / TILE);
  const y0 = Math.floor(y / TILE);
  const x1 = Math.floor((x + w - 0.001) / TILE);
  const y1 = Math.floor((y + h - 0.001) / TILE);
  const hits = [];
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const ch = tileAt(game, tx, ty);
      if (pred(ch)) hits.push({ tx, ty, ch });
    }
  }
  return hits;
}

function overlapsSolid(game, x, y, w, h) {
  return tilesIn(game, x, y, w, h, (ch) => ch === "#");
}

function moveX(game, ent, dx, ledge) {
  if (dx === 0) return false;
  if (
    ledge &&
    overlapsSolid(game, ent.x + dx, ent.y, ent.w, ent.h).length &&
    !overlapsSolid(game, ent.x + dx, ent.y - 6, ent.w, ent.h).length
  ) {
    ent.y -= 6;
  }
  ent.x += dx;
  let hit = false;
  for (let i = 0; i < 6; i++) {
    const solids = overlapsSolid(game, ent.x, ent.y, ent.w, ent.h);
    if (!solids.length) break;
    hit = true;
    if (dx > 0) {
      let minTx = solids[0].tx;
      for (const s of solids) if (s.tx < minTx) minTx = s.tx;
      ent.x = minTx * TILE - ent.w;
    } else {
      let maxTx = solids[0].tx;
      for (const s of solids) if (s.tx > maxTx) maxTx = s.tx;
      ent.x = (maxTx + 1) * TILE;
    }
  }
  if (hit) ent.vx = 0;
  return hit;
}

function moveY(game, ent, dy) {
  if (dy === 0) return false;
  const prevY = ent.y;
  ent.y += dy;
  let grounded = false;
  for (let i = 0; i < 6; i++) {
    const solids = overlapsSolid(game, ent.x, ent.y, ent.w, ent.h);
    let oneways = [];
    if (dy > 0) {
      const prevBottom = prevY + ent.h;
      oneways = tilesIn(game, ent.x, ent.y, ent.w, ent.h, (ch) => ch === "=").filter(
        (s) => prevBottom <= s.ty * TILE + 2
      );
    }
    if (!solids.length && !oneways.length) break;
    if (dy > 0) {
      let top = Infinity;
      for (const s of solids) top = Math.min(top, s.ty * TILE);
      for (const s of oneways) top = Math.min(top, s.ty * TILE);
      ent.y = top - ent.h;
      if (ent.vy > 0) ent.vy = 0;
      grounded = true;
    } else if (solids.length) {
      let maxTy = solids[0].ty;
      for (const s of solids) if (s.ty > maxTy) maxTy = s.ty;
      ent.y = (maxTy + 1) * TILE;
      if (ent.vy < 0) ent.vy = 0;
    } else {
      break;
    }
  }
  return grounded;
}

function unstick(game, ent) {
  for (let n = 0; n < 4; n++) {
    const solids = overlapsSolid(game, ent.x, ent.y, ent.w, ent.h);
    if (!solids.length) return;
    let best = null;
    for (const s of solids) {
      const tileTop = s.ty * TILE;
      const tileBottom = tileTop + TILE;
      const penUp = ent.y + ent.h - tileTop;
      const penDown = tileBottom - ent.y;
      if (penUp > 0 && penUp < 8 && (!best || penUp < best.pen)) best = { pen: penUp, y: tileTop - ent.h };
      if (penDown > 0 && penDown < 8 && (!best || penDown < best.pen)) best = { pen: penDown, y: tileBottom };
    }
    if (!best) return;
    ent.y = best.y;
  }
}

function probeGround(game, ent) {
  const feet = ent.y + ent.h;
  const samples = [ent.x + 1.5, ent.x + ent.w * 0.5, ent.x + ent.w - 1.5];
  for (const sx of samples) {
    const tx = Math.floor(sx / TILE);
    const ty = Math.floor((feet + 0.6) / TILE);
    const ch = tileAt(game, tx, ty);
    if (ch === "#") return true;
    if (ch === "=" && Math.abs(feet - ty * TILE) <= 2.5) return true;
  }
  return false;
}

function probeWall(game, ent, dir) {
  const x = dir > 0 ? ent.x + ent.w + 0.6 : ent.x - 0.6;
  const samples = [ent.y + 4, ent.y + ent.h * 0.5, ent.y + ent.h - 4];
  for (const sy of samples) {
    if (tileAt(game, Math.floor(x / TILE), Math.floor(sy / TILE)) === "#") return true;
  }
  return false;
}

function touchingSpike(game, ent) {
  return tilesIn(game, ent.x + 2, ent.y + 2, ent.w - 4, Math.max(2, ent.h - 3), (ch) => ch === "^")
    .length > 0;
}

function keyOf(levelIndex, kind, tx, ty) {
  return `${levelIndex}:${kind}:${tx}:${ty}`;
}

function makePlayer(tx, ty) {
  return {
    x: tx * TILE + (TILE - PW) / 2,
    y: (ty + 1) * TILE - PH,
    w: PW,
    h: PH,
    vx: 0,
    vy: 0,
    dir: 1,
    grounded: true,
    coyote: COYOTE,
    flash: 0,
    jumpBuffer: 0,
    jumpCut: false,
    wallL: false,
    wallR: false,
    wallCoyoteL: 0,
    wallCoyoteR: 0,
    wallLock: 0,
    wallSlide: false,
    hearts: MAX_HEARTS,
    invuln: 0,
    attackT: 0,
    attackCd: 0,
    attackBuffer: 0,
    starBuffer: 0,
    starCd: 0,
    hitThisSwing: new Set(),
    pose: "idle",
    frame: 0,
    anim: 0,
    dust: 0,
    spawnX: tx * TILE + (TILE - PW) / 2,
    spawnY: (ty + 1) * TILE - PH,
  };
}

function loadLevel(game, index) {
  const def = LEVELS[index];
  const tiles = def.rows.map((row) => row.split(""));
  const h = tiles.length;
  const w = tiles[0].length;
  game.levelIndex = index;
  game.level = {
    name: def.name,
    theme: def.theme,
    id: def.id,
    w,
    h,
    tiles,
    arena: null,
    checkpoints: (def.checkpoints || []).map((cp) => ({
      x: cp.x,
      rank: 1,
      spawnX: cp.spawnTileX * TILE + 2,
      spawnY: (cp.spawnTileY + 1) * TILE - PH,
    })),
  };
  if (def.arena) {
    game.level.arena = {
      triggerX: def.arena.triggerTile * TILE,
      sealX: def.arena.sealX,
      spawnX: def.arena.spawnTileX * TILE + 2,
      spawnY: (def.arena.spawnTileY + 1) * TILE - PH,
    };
  }
  game.enemies = [];
  game.projectiles = [];
  game.coinsList = [];
  game.pickups = [];
  game.goal = null;
  game.boss = null;
  game.bossFight = false;
  game.checkpoint = "start";
  game.checkpointRank = 0;
  game.checkpointSpawn = null;
  game.hitstop = 0;
  game.snapCam = true;
  game.player = null;

  for (let ty = 0; ty < h; ty++) {
    for (let tx = 0; tx < w; tx++) {
      const ch = tiles[ty][tx];
      if (ch === "P") {
        game.player = makePlayer(tx, ty);
        tiles[ty][tx] = ".";
      } else if (ch === "S" || ch === "A" || ch === "I") {
        spawnEnemy(game, ch, tx, ty);
        tiles[ty][tx] = ".";
      } else if (ch === "B") {
        spawnBoss(game, tx, ty);
        tiles[ty][tx] = ".";
      } else if (ch === "G") {
        game.goal = { x: tx * TILE - 2, y: (ty + 1) * TILE - 40, w: 22, h: 40 };
        tiles[ty][tx] = ".";
      } else if (ch === "o") {
        const id = keyOf(index, "coin", tx, ty);
        if (!game.collected.has(id)) {
          game.coinsList.push({
            id,
            x: tx * TILE + 4,
            y: ty * TILE + 4,
            w: 8,
            h: 8,
          });
        }
        tiles[ty][tx] = ".";
      } else if (ch === "*") {
        const id = keyOf(index, "star", tx, ty);
        if (!game.collected.has(id)) {
          game.pickups.push({
            id,
            x: tx * TILE + 3,
            y: ty * TILE + 3,
            w: 10,
            h: 10,
          });
        }
        tiles[ty][tx] = ".";
      }
    }
  }
  if (!game.player) game.player = makePlayer(2, h - 3);
}

function spawnEnemy(game, ch, tx, ty) {
  const type = ch === "S" ? "soldier" : ch === "A" ? "archer" : "imp";
  const w = type === "imp" ? 14 : 14;
  const h = type === "imp" ? 14 : 18;
  const enemy = {
    id: game.nextId++,
    type,
    x: tx * TILE + (TILE - w) / 2,
    y: (ty + 1) * TILE - h,
    w,
    h,
    vx: 0,
    vy: 0,
    dir: 1,
    hp: 1,
    alive: true,
    dying: 0,
    hurtT: 0,
    anim: 0,
    grounded: true,
    speed: type === "soldier" ? 38 : 0,
    state: "idle",
    timer: type === "archer" ? 1.8 + (tx % 4) * 0.2 : 0.6,
    frame: 0,
    turnT: 0,
  };
  game.enemies.push(enemy);
}

function spawnBoss(game, tx, ty) {
  const w = 28;
  const h = 32;
  game.boss = {
    kind: "boss",
    x: tx * TILE + (TILE - w) / 2,
    y: (ty + 1) * TILE - h,
    w,
    h,
    vx: 0,
    vy: 0,
    dir: -1,
    hp: BOSS_HP,
    maxHp: BOSS_HP,
    alive: true,
    awake: false,
    hurtT: 0,
    state: "wait",
    pattern: "cleave",
    patternIndex: 0,
    timer: 0.8,
    phase2: false,
    smashPhase: "",
    hang: 0,
    markX: tx * TILE,
    grounded: true,
    anim: 0,
  };
}

function sealArena(game) {
  const arena = game.level.arena;
  if (!arena) return;
  const x = arena.sealX;
  for (let y = 0; y < game.level.h; y++) {
    if (game.level.tiles[y][x] !== "#") game.level.tiles[y][x] = "#";
  }
}

function beginFight(game, quiet) {
  if (!game.boss || !game.level.arena) return;
  game.bossFight = true;
  game.checkpoint = "boss";
  sealArena(game);
  game.boss.awake = true;
  game.boss.state = "idle";
  game.boss.timer = quiet ? 0.45 : 0.85;
  game.boss.hp = game.boss.maxHp;
  game.boss.alive = true;
  game.boss.phase2 = false;
  game.boss.patternIndex = 0;
  game.boss.vx = 0;
  game.boss.vy = 0;
  if (!quiet) {
    game.shake = 5;
    emit(game, "roar");
  }
}

function burst(game, x, y, color, n, speed) {
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n + Math.random() * 0.2;
    const sp = speed * (0.4 + Math.random() * 0.8);
    spawnParticle(game, {
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 20,
      life: 0.35 + Math.random() * 0.25,
      max: 0.6,
      color,
      size: 2,
      g: 400,
    });
  }
}

function spawnParticle(game, p) {
  if (game.particles.length > 110) game.particles.shift();
  game.particles.push(p);
}

function damagePlayer(game, amount, srcX) {
  const p = game.player;
  if (game.mode !== "play" || p.invuln > 0) return;
  p.hearts -= amount;
  p.invuln = 0.85;
  p.flash = 0.12;
  const away = p.x + p.w / 2 < srcX ? -1 : 1;
  p.vx = away * 170;
  p.vy = -190;
  p.grounded = false;
  game.flash = 0.22;
  game.shake = Math.max(game.shake, 6);
  game.hitstop = Math.max(game.hitstop, 0.05);
  emit(game, "hurt");
  if (p.hearts <= 0) die(game);
}

function die(game) {
  if (game.mode !== "play") return;
  game.mode = "dead";
  game.deadT = 1.05;
  game.player.hearts = 0;
  game.player.vx = 0;
  game.player.vy = -180;
  game.player.flash = 0.2;
  game.shake = 8;
  game.hitstop = 0;
  emit(game, "die");
  burst(game, game.player.x + game.player.w / 2, game.player.y + 8, "#ff5a6a", 16, 110);
}

function hurtEnemy(game, enemy, dmg) {
  if (!enemy.alive || enemy.hurtT > 0) return;
  enemy.hp -= dmg;
  enemy.hurtT = 0.16;
  enemy.vx = (enemy.x < game.player.x ? -1 : 1) * 40;
  emit(game, "hit");
  game.shake = Math.max(game.shake, 2);
  burst(game, enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, "#ffe1a8", 6, 70);
  if (enemy.hp <= 0) {
    enemy.alive = false;
    enemy.dying = 0.36;
    game.hitstop = Math.max(game.hitstop, 0.035);
    game.kills += 1;
    burst(game, enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, "#ffd0a0", 8, 80);
  }
}

function hurtBoss(game, dmg) {
  const b = game.boss;
  if (!b || !b.alive || !b.awake || b.hurtT > 0) return;
  b.hp -= dmg;
  b.hurtT = 0.22;
  game.shake = Math.max(game.shake, 4);
  game.hitstop = Math.max(game.hitstop, 0.04);
  emit(game, "hit");
  burst(game, b.x + b.w / 2, b.y + 12, "#ffb15a", 8, 90);
  if (b.hp <= 0) {
    b.hp = 0;
    b.alive = false;
    b.vx = 0;
    game.mode = "bossdead";
    game.bossDeadT = 1.7;
    game.kills += 1;
    game.shake = 9;
    emit(game, "win");
    burst(game, b.x + b.w / 2, b.y + b.h / 2, "#ffd56a", 22, 140);
    burst(game, b.x + b.w / 2, b.y + 8, "#ff4d4d", 14, 110);
  }
}

function swordBox(p) {
  const reach = 20;
  const hx = p.dir > 0 ? p.x + p.w - 4 : p.x - reach + 4;
  return { x: hx, y: p.y + 2, w: reach, h: 14 };
}

function tryAttack(game) {
  const p = game.player;
  if (p.attackBuffer > 0 && p.attackCd <= 0 && p.attackT <= 0) {
    p.attackT = ATTACK_TIME;
    p.attackCd = ATTACK_CD;
    p.attackBuffer = 0;
    p.hitThisSwing = new Set();
    if (p.grounded) p.vx = clamp(p.vx + p.dir * 28, -MAX_RUN, MAX_RUN);
    emit(game, "slash");
    burst(game, p.x + p.w / 2 + p.dir * 10, p.y + 8, "#f4f7ff", 5, 70);
  }
  const active = p.attackT > 0.05 && p.attackT < 0.16;
  if (!active) return;
  const box = swordBox(p);
  for (const e of game.enemies) {
    if (!e.alive || p.hitThisSwing.has(e.id)) continue;
    if (aabb(box, e)) {
      p.hitThisSwing.add(e.id);
      hurtEnemy(game, e, 1);
    }
  }
  if (game.boss && game.boss.alive && game.boss.awake && !p.hitThisSwing.has("boss") && aabb(box, game.boss)) {
    p.hitThisSwing.add("boss");
    hurtBoss(game, 2);
  }
  for (const pr of game.projectiles) {
    if (pr.dead || pr.kind === "star") continue;
    if (aabb(box, pr)) {
      pr.dead = true;
      burst(game, pr.x, pr.y, "#d5e7f5", 4, 50);
    }
  }
}

function tryThrow(game) {
  const p = game.player;
  if (p.starBuffer <= 0 || p.starCd > 0) return;
  p.starBuffer = 0;
  if (game.ammo <= 0) {
    emit(game, "empty");
    return;
  }
  game.ammo -= 1;
  p.starCd = STAR_CD;
  const sx = p.dir > 0 ? p.x + p.w + 1 : p.x - 9;
  game.projectiles.push({
    kind: "star",
    x: sx,
    y: p.y + 5,
    w: 8,
    h: 8,
    vx: p.dir * 250,
    vy: 0,
    life: 0.75,
    dead: false,
  });
  emit(game, "throw");
}

function doGroundJump(game) {
  const p = game.player;
  p.vy = JUMP_V;
  p.jumpCut = true;
  p.jumpBuffer = 0;
  p.grounded = false;
  p.coyote = 0;
  emit(game, "jump");
}

function doWallJump(game) {
  const p = game.player;
  const right = p.wallR || p.wallCoyoteR > 0;
  const left = p.wallL || p.wallCoyoteL > 0;
  let dir = 1;
  if (right && left) dir = p.wallCoyoteR >= p.wallCoyoteL ? -1 : 1;
  else if (right) dir = -1;
  p.vx = dir * WALL_JUMP_X;
  p.vy = WALL_JUMP_Y;
  p.dir = dir > 0 ? 1 : -1;
  p.wallLock = WALL_LOCK;
  p.jumpCut = true;
  p.jumpBuffer = 0;
  p.grounded = false;
  p.coyote = 0;
  p.wallCoyoteL = 0;
  p.wallCoyoteR = 0;
  emit(game, "jump");
}

function updatePlayer(game, dt, input) {
  const p = game.player;
  p.invuln = Math.max(0, p.invuln - dt);
  p.flash = Math.max(0, p.flash - dt);
  p.attackCd = Math.max(0, p.attackCd - dt);
  p.starCd = Math.max(0, p.starCd - dt);
  p.wallLock = Math.max(0, p.wallLock - dt);
  if (input.jumpPressed) p.jumpBuffer = JUMP_BUFFER;
  else p.jumpBuffer = Math.max(0, p.jumpBuffer - dt);
  if (input.attackPressed) p.attackBuffer = 0.12;
  else p.attackBuffer = Math.max(0, p.attackBuffer - dt);
  if (input.shurikenPressed) p.starBuffer = 0.12;
  else p.starBuffer = Math.max(0, p.starBuffer - dt);
  if (p.attackT > 0) p.attackT = Math.max(0, p.attackT - dt);

  const axis = p.wallLock > 0 ? 0 : input.axis || 0;
  if (axis !== 0) p.dir = axis > 0 ? 1 : -1;

  if (!p.grounded) p.vy = Math.min(MAX_FALL, p.vy + GRAVITY * dt);

  p.wallR = probeWall(game, p, 1);
  p.wallL = probeWall(game, p, -1);

  if (p.wallLock <= 0) {
    const acc = p.grounded ? ACCEL : AIR_ACCEL;
    if (axis !== 0) {
      p.vx += axis * acc * dt;
      const cap = MAX_RUN;
      if (axis > 0 && p.vx > cap) p.vx = cap;
      if (axis < 0 && p.vx < -cap) p.vx = -cap;
    } else {
      const fr = (p.grounded ? FRICTION : FRICTION * 0.32) * dt;
      if (Math.abs(p.vx) <= fr) p.vx = 0;
      else p.vx -= Math.sign(p.vx) * fr;
    }
  }

  p.wallSlide = false;
  if (!p.grounded && p.vy > WALL_SLIDE) {
    const holdR = axis > 0 && p.wallR;
    const holdL = axis < 0 && p.wallL;
    if (holdR || holdL) {
      p.vy = WALL_SLIDE;
      p.wallSlide = true;
    }
  }

  const prevVy = p.vy;
  const wasGrounded = p.grounded;
  moveX(game, p, p.vx * dt, true);
  const landed = moveY(game, p, p.vy * dt);
  unstick(game, p);
  p.grounded = landed || probeGround(game, p);
  if (p.grounded && p.vy > 0) p.vy = 0;
  if (p.grounded) p.coyote = COYOTE;
  else if (wasGrounded) p.coyote = COYOTE;
  else p.coyote -= dt;

  p.wallR = probeWall(game, p, 1);
  p.wallL = probeWall(game, p, -1);
  if (p.wallR) p.wallCoyoteR = WALL_COYOTE;
  else p.wallCoyoteR -= dt;
  if (p.wallL) p.wallCoyoteL = WALL_COYOTE;
  else p.wallCoyoteL -= dt;

  const canGround = p.grounded || p.coyote > 0;
  const canWall = !p.grounded && (p.wallL || p.wallR || p.wallCoyoteL > 0 || p.wallCoyoteR > 0);
  if (p.jumpBuffer > 0) {
    if (canGround) doGroundJump(game);
    else if (canWall) doWallJump(game);
  }
  if (p.jumpCut && !input.jumpHeld && p.vy < 0) {
    p.vy *= 0.48;
    p.jumpCut = false;
  }

  if (!wasGrounded && p.grounded && prevVy > 260) emit(game, "land");

  tryAttack(game);
  tryThrow(game);

  if (touchingSpike(game, p)) die(game);
  if (p.y > game.level.h * TILE + 12) die(game);

  if (p.attackT > 0) p.pose = "slash";
  else if (p.wallSlide) p.pose = "wall";
  else if (!p.grounded && p.vy < -30) p.pose = "jump";
  else if (!p.grounded) p.pose = "fall";
  else if (Math.abs(p.vx) > 18) p.pose = "run";
  else p.pose = "idle";

  p.anim += dt;
  p.frame = p.pose === "run" ? Math.floor(p.anim * 12) % 4 : Math.floor(p.anim * 4) % 2;
  p.dust -= dt;
  if (p.pose === "run" && p.dust <= 0) {
    p.dust = 0.06;
    spawnParticle(game, {
      x: p.x + p.w / 2,
      y: p.y + p.h,
      vx: -p.dir * 16,
      vy: -8,
      life: 0.25,
      max: 0.25,
      color: "rgba(210,210,220,0.7)",
      size: 2,
      g: 0,
    });
  }
}

function updateSoldier(game, e, dt) {
  e.anim += dt;
  e.turnT = Math.max(0, (e.turnT || 0) - dt);
  e.frame = Math.floor(e.anim * 6) % 2;
  const dir = e.dir;
  const aheadX = dir > 0 ? e.x + e.w + 1 : e.x - 1;
  const chestY = e.y + e.h * 0.45;
  const footX = dir > 0 ? e.x + e.w + 2 : e.x - 2;
  const footY = e.y + e.h + 1;
  const wall = tileAt(game, Math.floor(aheadX / TILE), Math.floor(chestY / TILE)) === "#";
  const under = tileAt(game, Math.floor(footX / TILE), Math.floor(footY / TILE));
  const floor = under === "#" || under === "=";
  if ((wall || !floor) && e.turnT <= 0) {
    e.dir *= -1;
    e.turnT = 0.28;
    return;
  }
  if (e.turnT <= 0) e.x += e.dir * e.speed * dt;
}

function updateArcher(game, e, dt) {
  e.anim += dt;
  const p = game.player;
  const dx = p.x + p.w / 2 - (e.x + e.w / 2);
  const dy = p.y + p.h / 2 - (e.y + e.h / 2);
  const inRange = Math.abs(dx) < 220 && Math.abs(dy) < 100;
  if (inRange) e.dir = dx >= 0 ? 1 : -1;
  e.timer -= dt;
  if (e.state === "idle") {
    e.frame = 0;
    if (e.timer <= 0 && inRange && game.mode === "play") {
      e.state = "draw";
      e.timer = 0.42;
      e.frame = 1;
    }
  } else {
    e.frame = 1;
    if (e.timer <= 0) {
      const sy = e.y + 7;
      const sx = e.dir > 0 ? e.x + e.w : e.x - 10;
      game.projectiles.push({
        kind: "arrow",
        x: sx,
        y: sy,
        w: 10,
        h: 4,
        vx: e.dir * 175,
        vy: 0,
        life: 1.6,
        dead: false,
      });
      e.state = "idle";
      e.timer = 1.55;
    }
  }
}

function updateImp(game, e, dt) {
  e.anim += dt;
  e.timer -= dt;
  const p = game.player;
  if (e.state === "idle" && e.grounded && e.timer <= 0) {
    e.state = "crouch";
    e.timer = 0.28;
    const dx = p.x - e.x;
    if (Math.abs(dx) < 180) e.dir = dx >= 0 ? 1 : -1;
  } else if (e.state === "crouch") {
    e.frame = 1;
    if (e.timer <= 0) {
      e.vy = -300;
      e.vx = e.dir * 96;
      e.state = "air";
      e.grounded = false;
    }
  }
  if (e.state !== "crouch") {
    e.vy = Math.min(MAX_FALL, e.vy + GRAVITY * dt);
    moveX(game, e, e.vx * dt, false);
    const landed = moveY(game, e, e.vy * dt);
    unstick(game, e);
    e.grounded = landed || probeGround(game, e);
    if (overlapsSolid(game, e.x, e.y, e.w, e.h).length) e.vx = 0;
    if (e.grounded) {
      e.vx = 0;
      if (e.state === "air") {
        e.state = "idle";
        e.timer = 0.85;
        e.frame = 0;
      }
    } else {
      e.frame = 1;
    }
  }
  if (touchingSpike(game, e) || e.y > game.level.h * TILE) {
    e.alive = false;
    e.dying = 0.05;
  }
}

function updateEnemies(game, dt) {
  for (const e of game.enemies) {
    e.hurtT = Math.max(0, e.hurtT - dt);
    if (!e.alive) {
      e.dying -= dt;
      continue;
    }
    if (e.type === "soldier") updateSoldier(game, e, dt);
    else if (e.type === "archer") updateArcher(game, e, dt);
    else updateImp(game, e, dt);
    if (e.alive && aabb(inset(game.player, 1), inset(e, 1))) {
      damagePlayer(game, 1, e.x + e.w / 2);
    }
  }
  game.enemies = game.enemies.filter((e) => e.alive || e.dying > 0);
}

function inset(ent, n) {
  return { x: ent.x + n, y: ent.y + n, w: Math.max(1, ent.w - n * 2), h: Math.max(1, ent.h - n * 2) };
}

function patternList(boss) {
  return boss.phase2 ? ["cleave", "smash", "volley", "cleave"] : ["cleave", "volley", "smash"];
}

function recoverBoss(b) {
  b.state = "recover";
  b.timer = b.phase2 ? 0.42 : 0.55;
  b.vx = 0;
  b.smashPhase = "";
}

function fireVolley(game, b) {
  const p = game.player;
  const ox = b.x + b.w / 2;
  const oy = b.y + 12;
  const base = Math.atan2(p.y + p.h / 2 - oy, p.x + p.w / 2 - ox);
  for (const spread of [-0.32, 0, 0.32]) {
    const a = base + spread;
    const sp = b.phase2 ? 165 : 145;
    game.projectiles.push({
      kind: "fire",
      x: ox - 4,
      y: oy - 4,
      w: 8,
      h: 8,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: 2.2,
      dead: false,
    });
  }
}

function updateBoss(game, dt) {
  const b = game.boss;
  if (!b || !b.alive) return;
  b.anim += dt;
  b.hurtT = Math.max(0, b.hurtT - dt);
  if (b.hp <= b.maxHp / 2) b.phase2 = true;
  if (!b.awake) {
    b.grounded = probeGround(game, b);
    return;
  }

  const p = game.player;
  const dirTo = p.x + p.w / 2 >= b.x + b.w / 2 ? 1 : -1;
  b.timer -= dt;

  if (b.state === "idle") {
    b.dir = dirTo;
    b.vx = dirTo * (b.phase2 ? 26 : 16);
    if (b.timer <= 0) {
      const list = patternList(b);
      b.pattern = list[b.patternIndex % list.length];
      b.patternIndex += 1;
      b.state = "tell";
      b.timer = b.pattern === "smash" ? 0.9 : b.pattern === "volley" ? 0.72 : 0.85;
      if (b.phase2) b.timer *= 0.9;
      b.dir = dirTo;
      b.vx = 0;
      if (b.pattern === "smash") b.markX = clamp(p.x + p.w / 2, TILE * 2, game.level.w * TILE - TILE * 2);
    }
  } else if (b.state === "tell") {
    b.vx = 0;
    b.dir = b.pattern === "cleave" ? b.dir : dirTo;
    if (b.timer <= 0) {
      b.state = "act";
      if (b.pattern === "cleave") {
        b.timer = b.phase2 ? 0.48 : 0.55;
        b.vx = b.dir * (b.phase2 ? 210 : 180);
      } else if (b.pattern === "volley") {
        b.timer = 0.4;
        fireVolley(game, b);
      } else {
        b.timer = 1.05;
        b.vy = -380;
        b.smashPhase = "rise";
        b.hang = 0;
        b.grounded = false;
      }
    }
  } else if (b.state === "act") {
    if (b.pattern === "cleave") {
      if (b.timer <= 0) recoverBoss(b);
    } else if (b.pattern === "volley") {
      b.vx = 0;
      if (b.timer <= 0) recoverBoss(b);
    } else if (b.pattern === "smash") {
      if (b.smashPhase === "rise" || b.smashPhase === "hang") {
        b.vx = clamp((b.markX - (b.x + b.w / 2)) * 5, -200, 200);
      } else {
        b.vx = 0;
      }
      if (b.smashPhase === "rise" && b.vy >= -20) {
        b.smashPhase = "hang";
        b.hang = 0.16;
        b.vy = 0;
      }
      if (b.smashPhase === "hang") {
        b.hang -= dt;
        b.vy = 0;
        if (b.hang <= 0) {
          b.smashPhase = "fall";
          b.vy = 540;
          b.vx = 0;
        }
      }
    }
  } else if (b.state === "recover") {
    b.vx *= 0.8;
    if (b.timer <= 0) {
      b.state = "idle";
      b.timer = b.phase2 ? 0.48 : 0.62;
    }
  }

  const hanging = b.pattern === "smash" && b.state === "act" && b.smashPhase === "hang";
  if (!hanging && (!b.grounded || b.vy < 0)) b.vy = Math.min(MAX_FALL, b.vy + GRAVITY * dt);
  const wasGrounded = b.grounded;
  const blocked = moveX(game, b, b.vx * dt, false);
  if (b.pattern === "cleave" && b.state === "act" && blocked) recoverBoss(b);
  moveY(game, b, b.vy * dt);
  b.grounded = probeGround(game, b) || (b.vy === 0 && wasGrounded && probeGround(game, b));
  if (b.grounded && b.vy >= 0) b.vy = 0;
  if (
    b.pattern === "smash" &&
    b.state === "act" &&
    b.smashPhase === "fall" &&
    b.grounded
  ) {
    game.shake = 8;
    emit(game, "stomp");
    const px = p.x + p.w / 2;
    const feetNear = Math.abs(p.y + p.h - (b.y + b.h)) < 12;
    if (Math.abs(px - (b.x + b.w / 2)) < 36 && feetNear) damagePlayer(game, 1, b.x + b.w / 2);
    recoverBoss(b);
  }

  if (b.alive && aabb(inset(p, 1), b)) damagePlayer(game, 1, b.x + b.w / 2);
}

function updateProjectiles(game, dt) {
  const p = game.player;
  for (const pr of game.projectiles) {
    if (pr.dead) continue;
    pr.life -= dt;
    pr.x += pr.vx * dt;
    pr.y += pr.vy * dt;
    const hitSolid =
      overlapsSolid(game, pr.x, pr.y, pr.w, pr.h).length > 0 ||
      tilesIn(game, pr.x, pr.y, pr.w, pr.h, (ch) => ch === "=").length > 0;
    if (hitSolid || pr.life <= 0 || pr.x < -20 || pr.x > game.level.w * TILE + 20) {
      pr.dead = true;
      continue;
    }
    if (pr.kind === "star") {
      for (const e of game.enemies) {
        if (!e.alive) continue;
        if (aabb(pr, e)) {
          pr.dead = true;
          hurtEnemy(game, e, 1);
          break;
        }
      }
      if (!pr.dead && game.boss && game.boss.alive && game.boss.awake && aabb(pr, game.boss)) {
        pr.dead = true;
        hurtBoss(game, 1);
      }
    } else if (aabb(pr, p)) {
      pr.dead = true;
      damagePlayer(game, 1, pr.x);
    }
  }
  game.projectiles = game.projectiles.filter((pr) => !pr.dead);
}

function updatePickups(game) {
  const p = game.player;
  for (let i = game.coinsList.length - 1; i >= 0; i--) {
    const c = game.coinsList[i];
    if (aabb(p, c)) {
      game.collected.add(c.id);
      game.coins += 1;
      game.levelCoins += 1;
      game.coinsList.splice(i, 1);
      emit(game, "coin");
      burst(game, c.x + 4, c.y + 4, "#f2c14e", 5, 40);
    }
  }
  for (let i = game.pickups.length - 1; i >= 0; i--) {
    const s = game.pickups[i];
    if (aabb(p, s)) {
      game.collected.add(s.id);
      game.ammo = Math.min(MAX_AMMO, game.ammo + PICKUP_AMMO);
      game.pickups.splice(i, 1);
      emit(game, "pickup");
      burst(game, s.x + 5, s.y + 5, "#d5e7f5", 6, 50);
    }
  }
  if (game.goal && game.mode === "play" && !game.bossFight && aabb(p, game.goal)) {
    emit(game, "goal");
    if (game.levelIndex < LEVELS.length - 1) {
      game.clearInfo = {
        index: game.levelIndex,
        name: game.level.name,
        time: game.levelTime,
        coins: game.levelCoins,
        saved: false,
      };
      game.mode = "clear";
    }
  }
}

function advanceLevel(game) {
  const next = game.levelIndex + 1;
  if (next >= LEVELS.length) return;
  loadLevel(game, next);
  game.levelTime = 0;
  game.levelCoins = 0;
  game.clearInfo = null;
  game.player.hearts = MAX_HEARTS;
  game.mode = "intro";
  game.introT = 1.15;
}

function updateCamera(game, dt) {
  const p = game.player;
  let targetX = p.x + p.w / 2 - game.viewW / 2 + p.dir * 26;
  let targetY = p.y + p.h / 2 - game.viewH * 0.58;
  const maxX = Math.max(0, game.level.w * TILE - game.viewW);
  const maxY = Math.max(0, game.level.h * TILE - game.viewH);
  if (game.bossFight && game.level.arena) {
    const left = game.level.arena.sealX * TILE;
    const right = game.level.w * TILE;
    const arenaW = right - left;
    if (game.viewW >= arenaW) targetX = left - (game.viewW - arenaW) / 2;
    else targetX = clamp(p.x + p.w / 2 - game.viewW / 2, left, right - game.viewW);
    targetY = clamp(targetY, 0, maxY);
  }
  targetX = clamp(targetX, Math.min(0, maxX), maxX);
  targetY = clamp(targetY, Math.min(0, maxY), maxY);
  if (game.snapCam) {
    game.camX = targetX;
    game.camY = targetY;
    game.snapCam = false;
  } else {
    const t = 1 - Math.pow(0.0012, dt);
    game.camX += (targetX - game.camX) * t;
    game.camY += (targetY - game.camY) * t;
  }
}

function updateAmbient(game, dt) {
  if (game.bannerT > 0) game.bannerT = Math.max(0, game.bannerT - dt);
  game.shake = Math.max(0, game.shake - dt * 16);
  game.flash = Math.max(0, game.flash - dt);
  if (game.particles.length < 28 && Math.random() < dt * 8) {
    spawnParticle(game, {
      x: game.camX + Math.random() * game.viewW,
      y: game.camY - 4,
      vx: -8 - Math.random() * 10,
      vy: 12 + Math.random() * 16,
      life: 4 + Math.random() * 3,
      max: 7,
      color: game.level.theme === "bamboo" ? "#f0a0b0" : "#f2c9d2",
      size: 2,
      g: 0,
      petal: true,
    });
  }
  for (let i = game.particles.length - 1; i >= 0; i--) {
    const p = game.particles[i];
    p.life -= dt;
    p.vy += (p.g || 0) * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.petal) p.x += Math.sin(game.clock * 2 + p.y * 0.05) * 8 * dt;
    if (p.life <= 0) game.particles.splice(i, 1);
  }
}

function updateCheckpoints(game) {
  if (game.bossFight || game.checkpoint === "boss") return;
  for (const cp of game.level.checkpoints || []) {
    if ((game.checkpointRank || 0) >= cp.rank) continue;
    if (game.player.x + game.player.w / 2 < cp.x) continue;
    game.checkpointRank = cp.rank;
    game.checkpoint = "mid";
    game.checkpointSpawn = { x: cp.spawnX, y: cp.spawnY };
    game.bannerText = "PUNTO DE CONTROL";
    game.bannerT = 1.2;
    emit(game, "checkpoint");
  }
}

function respawn(game) {
  const checkpoint = game.checkpoint;
  const spawn = game.checkpointSpawn;
  const rank = game.checkpointRank || 0;
  const bossHp = game.boss ? game.boss.hp : null;
  loadLevel(game, game.levelIndex);
  game.checkpoint = checkpoint;
  game.checkpointSpawn = spawn;
  game.checkpointRank = rank;
  game.player.hearts = MAX_HEARTS;
  game.player.invuln = 1.15;
  if (checkpoint === "boss" && game.level.arena) {
    game.player.x = game.level.arena.spawnX;
    game.player.y = game.level.arena.spawnY;
    game.player.vx = 0;
    game.player.vy = 0;
    beginFight(game, true);
    if (bossHp != null && game.boss) game.boss.hp = Math.max(1, bossHp);
  } else if (spawn) {
    game.player.x = spawn.x;
    game.player.y = spawn.y;
    game.player.vx = 0;
    game.player.vy = 0;
  }
  game.mode = "play";
  game.snapCam = true;
}

function maybeStartFight(game) {
  if (game.bossFight || !game.boss || !game.level.arena) return;
  if (game.player.x + game.player.w / 2 > game.level.arena.triggerX) beginFight(game, false);
}

export function updateGame(game, dt, input) {
  const step = dt > 0 ? dt : 1 / 60;
  input = input || blankInput();
  game.events.length = 0;

  if (game.mode === "title") {
    game.clock += step;
    game.player.anim += step;
    game.player.pose = "idle";
    game.player.frame = Math.floor(game.player.anim * 3) % 2;
    updateAmbient(game, step);
    updateCamera(game, step);
    if (input.confirmPressed || input.jumpPressed || input.attackPressed || input.shurikenPressed || input.axis) {
      startGame(game);
    }
    return;
  }

  if (game.mode === "win") {
    game.clock += step;
    updateAmbient(game, step);
    if (input.confirmPressed || input.jumpPressed || input.attackPressed) startGame(game);
    return;
  }

  if (game.mode === "clear") {
    game.clock += step;
    updateAmbient(game, step);
    if (input.confirmPressed || input.jumpPressed || input.attackPressed) advanceLevel(game);
    return;
  }

  if (game.mode === "pause") {
    if (input.confirmPressed || input.pausePressed || input.jumpPressed || input.attackPressed) {
      game.mode = game.resumeMode || "play";
      game.resumeMode = null;
    }
    return;
  }

  if (input.pausePressed && (game.mode === "play" || game.mode === "intro")) {
    game.resumeMode = game.mode;
    game.mode = "pause";
    return;
  }

  if (game.mode === "intro") {
    game.clock += step;
    game.introT -= step;
    game.player.anim += step;
    game.player.pose = "idle";
    game.player.frame = Math.floor(game.player.anim * 3) % 2;
    updateAmbient(game, step);
    updateCamera(game, step);
    if (game.introT <= 0 || input.confirmPressed || input.jumpPressed) game.mode = "play";
    return;
  }

  if (game.mode === "dead") {
    game.clock += step;
    game.deadT -= step;
    game.player.y += game.player.vy * step;
    game.player.vy += GRAVITY * step * 0.4;
    updateAmbient(game, step);
    updateCamera(game, step);
    if (game.deadT <= 0) respawn(game);
    return;
  }

  if (game.mode === "bossdead") {
    game.clock += step;
    game.bossDeadT -= step;
    if (game.boss) {
      game.boss.y += 18 * step;
      game.boss.anim += step;
    }
    updateAmbient(game, step);
    updateCamera(game, step);
    if (game.bossDeadT <= 0) {
      game.winRecord = null;
      game.mode = "win";
    }
    return;
  }

  if (game.hitstop > 0) {
    game.hitstop = Math.max(0, game.hitstop - step);
    game.clock += step;
    if (game.player.flash > 0) game.player.flash = Math.max(0, game.player.flash - step);
    updateAmbient(game, step);
    updateCamera(game, step);
    return;
  }

  game.clock += step;
  game.time += step;
  game.levelTime += step;
  updatePlayer(game, step, input);
  if (game.mode !== "play") {
    updateAmbient(game, step);
    updateCamera(game, step);
    return;
  }
  updateEnemies(game, step);
  tryAttack(game);
  if (game.mode !== "play") {
    updateAmbient(game, step);
    updateCamera(game, step);
    return;
  }
  updateBoss(game, step);
  tryAttack(game);
  if (game.mode !== "play") {
    updateAmbient(game, step);
    updateCamera(game, step);
    return;
  }
  updateProjectiles(game, step);
  if (game.mode !== "play") {
    updateAmbient(game, step);
    updateCamera(game, step);
    return;
  }
  updatePickups(game);
  updateCheckpoints(game);
  maybeStartFight(game);
  updateAmbient(game, step);
  updateCamera(game, step);
}

export function swordHitbox(game) {
  const p = game.player;
  if (!(p.attackT > 0.05 && p.attackT < 0.16)) return null;
  return swordBox(p);
}

export { LEVELS };
