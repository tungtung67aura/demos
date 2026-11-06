import { TILE, MAX_HEARTS } from "./sim.js";

const FONT = {
  A: [0b01110, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  B: [0b11110, 0b10001, 0b10001, 0b11110, 0b10001, 0b10001, 0b11110],
  C: [0b01110, 0b10001, 0b10000, 0b10000, 0b10000, 0b10001, 0b01110],
  D: [0b11110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b11110],
  E: [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b11111],
  F: [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b10000],
  G: [0b01110, 0b10001, 0b10000, 0b10111, 0b10001, 0b10001, 0b01111],
  H: [0b10001, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  I: [0b01110, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  J: [0b00111, 0b00010, 0b00010, 0b00010, 0b00010, 0b10010, 0b01100],
  K: [0b10001, 0b10010, 0b10100, 0b11000, 0b10100, 0b10010, 0b10001],
  L: [0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b11111],
  M: [0b10001, 0b11011, 0b10101, 0b10101, 0b10001, 0b10001, 0b10001],
  N: [0b10001, 0b11001, 0b10101, 0b10011, 0b10001, 0b10001, 0b10001],
  O: [0b01110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  P: [0b11110, 0b10001, 0b10001, 0b11110, 0b10000, 0b10000, 0b10000],
  Q: [0b01110, 0b10001, 0b10001, 0b10001, 0b10101, 0b10010, 0b01101],
  R: [0b11110, 0b10001, 0b10001, 0b11110, 0b10100, 0b10010, 0b10001],
  S: [0b01111, 0b10000, 0b10000, 0b01110, 0b00001, 0b00001, 0b11110],
  T: [0b11111, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100],
  U: [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  V: [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01010, 0b00100],
  W: [0b10001, 0b10001, 0b10001, 0b10101, 0b10101, 0b10101, 0b01010],
  X: [0b10001, 0b10001, 0b01010, 0b00100, 0b01010, 0b10001, 0b10001],
  Y: [0b10001, 0b10001, 0b01010, 0b00100, 0b00100, 0b00100, 0b00100],
  Z: [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b10000, 0b11111],
  0: [0b01110, 0b10001, 0b10011, 0b10101, 0b11001, 0b10001, 0b01110],
  1: [0b00100, 0b01100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  2: [0b01110, 0b10001, 0b00001, 0b00010, 0b00100, 0b01000, 0b11111],
  3: [0b11110, 0b00001, 0b00001, 0b01110, 0b00001, 0b00001, 0b11110],
  4: [0b00010, 0b00110, 0b01010, 0b10010, 0b11111, 0b00010, 0b00010],
  5: [0b11111, 0b10000, 0b10000, 0b11110, 0b00001, 0b10001, 0b01110],
  6: [0b01110, 0b10000, 0b10000, 0b11110, 0b10001, 0b10001, 0b01110],
  7: [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b01000, 0b01000],
  8: [0b01110, 0b10001, 0b10001, 0b01110, 0b10001, 0b10001, 0b01110],
  9: [0b01110, 0b10001, 0b10001, 0b01111, 0b00001, 0b00001, 0b01110],
  ".": [0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b01100, 0b01100],
  "!": [0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00000, 0b00100],
  "'": [0b00100, 0b00100, 0b00000, 0b00000, 0b00000, 0b00000, 0b00000],
  "-": [0b00000, 0b00000, 0b00000, 0b01110, 0b00000, 0b00000, 0b00000],
  ":": [0b00000, 0b01100, 0b01100, 0b00000, 0b01100, 0b01100, 0b00000],
  Á: [0b00100, 0b01110, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  É: [0b00100, 0b11111, 0b10000, 0b11110, 0b10000, 0b10000, 0b11111],
  Í: [0b00100, 0b01110, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  Ó: [0b00100, 0b01110, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  Ú: [0b00100, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  Ñ: [0b01110, 0b10001, 0b11001, 0b10101, 0b10011, 0b10001, 0b10001],
};

function textWidth(text, scale) {
  let w = 0;
  const s = String(text).toUpperCase();
  for (let i = 0; i < s.length; i++) w += (s[i] === " " ? 3 : 6) * scale;
  return w;
}

function drawText(ctx, text, x, y, color, scale = 1) {
  const s = String(text).toUpperCase();
  ctx.fillStyle = color;
  let cx = Math.round(x);
  const cy = Math.round(y);
  for (const ch of s) {
    if (ch === " ") {
      cx += 3 * scale;
      continue;
    }
    const glyph = FONT[ch];
    if (!glyph) {
      cx += 6 * scale;
      continue;
    }
    for (let row = 0; row < 7; row++) {
      const bits = glyph[row];
      for (let col = 0; col < 5; col++) {
        if (bits & (1 << (4 - col))) ctx.fillRect(cx + col * scale, cy + row * scale, scale, scale);
      }
    }
    cx += 6 * scale;
  }
  return textWidth(s, scale);
}

function drawTextCenter(ctx, text, cx, y, color, scale) {
  const w = textWidth(String(text).toUpperCase(), scale);
  drawText(ctx, text, cx - w / 2, y, color, scale);
}

function hash(n) {
  return (Math.imul(n, 1664525) + 1013904223) >>> 0;
}

function drawBackground(ctx, game, camX, camY, viewW, viewH) {
  const theme = game.level.theme;
  const sky =
    theme === "bamboo"
      ? ["#07140f", "#123224", "#1d4a34"]
      : theme === "temple"
        ? ["#140910", "#2a1424", "#4a2430"]
        : ["#07091a", "#151a36", "#24345c"];
  const g = ctx.createLinearGradient(0, 0, 0, viewH);
  g.addColorStop(0, sky[0]);
  g.addColorStop(0.55, sky[1]);
  g.addColorStop(1, sky[2]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, viewW, viewH);

  for (let i = 0; i < 48; i++) {
    const h = hash(i * 97 + 3);
    const sx = (h % 1000) / 1000;
    const sy = ((h >>> 10) % 1000) / 1000;
    const tw = 0.35 + 0.65 * Math.abs(Math.sin(game.clock * 1.5 + i));
    ctx.globalAlpha = 0.25 + tw * 0.7;
    ctx.fillStyle = "#f4f0dd";
    const size = (h % 3) === 0 ? 2 : 1;
    ctx.fillRect((sx * viewW + game.clock * 2) % viewW, sy * viewH * 0.72, size, size);
  }
  ctx.globalAlpha = 1;

  const moonX = viewW * 0.78 + (camX * 0.02) % 20;
  const moonY = 36 + viewH * 0.04;
  ctx.fillStyle = "rgba(255, 232, 186, 0.16)";
  ctx.beginPath();
  ctx.arc(moonX, moonY, 36, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffe6b8";
  ctx.beginPath();
  ctx.arc(moonX, moonY, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(210, 170, 110, 0.35)";
  ctx.beginPath();
  ctx.arc(moonX - 6, moonY - 3, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(moonX + 5, moonY + 4, 3, 0, Math.PI * 2);
  ctx.fill();

  if (theme === "bamboo") drawBamboo(ctx, camX, viewW, viewH);
  else if (theme === "temple") drawTemple(ctx, camX, viewW, viewH);
  else drawRoofs(ctx, camX, viewW, viewH);
}

function drawRoofs(ctx, camX, viewW, viewH) {
  const base = viewH * 0.62;
  ctx.fillStyle = "#14182c";
  const span = 92;
  const parallax = 0.22;
  const start = Math.floor((camX * parallax) / span) - 1;
  const count = Math.ceil(viewW / span) + 3;
  for (let i = start; i < start + count; i++) {
    const x = Math.round(i * span - camX * parallax);
    ctx.fillRect(x, base, 58, viewH - base);
    ctx.beginPath();
    ctx.moveTo(x - 8, base);
    ctx.lineTo(x + 29, base - 26);
    ctx.lineTo(x + 66, base);
    ctx.fill();
    if (i % 3 === 0) {
      ctx.fillRect(x + 40, base - 48, 10, 22);
      ctx.beginPath();
      ctx.moveTo(x + 36, base - 48);
      ctx.lineTo(x + 45, base - 64);
      ctx.lineTo(x + 54, base - 48);
      ctx.fill();
    }
  }
  ctx.fillStyle = "#1c2238";
  const span2 = 70;
  const p2 = 0.4;
  const start2 = Math.floor((camX * p2) / span2) - 1;
  for (let i = start2; i < start2 + Math.ceil(viewW / span2) + 3; i++) {
    const x = Math.round(i * span2 - camX * p2);
    const y = viewH * 0.74;
    ctx.fillRect(x, y, 40, viewH - y);
    ctx.beginPath();
    ctx.moveTo(x - 4, y);
    ctx.lineTo(x + 20, y - 14);
    ctx.lineTo(x + 44, y);
    ctx.fill();
  }
}

function drawBamboo(ctx, camX, viewW, viewH) {
  ctx.fillStyle = "#0c2a1c";
  const span = 28;
  const parallax = 0.3;
  const start = Math.floor((camX * parallax) / span) - 1;
  for (let i = start; i < start + Math.ceil(viewW / span) + 3; i++) {
    const x = Math.round(i * span - camX * parallax);
    const h = 80 + (hash(i + 4) % 70);
    ctx.fillRect(x, viewH - h, 7, h);
    ctx.fillStyle = "#134832";
    for (let k = 0; k < 4; k++) ctx.fillRect(x - 5, viewH - h + 16 + k * 18, 16, 2);
    ctx.fillStyle = "#0c2a1c";
  }
  ctx.fillStyle = "rgba(180, 220, 190, 0.05)";
  ctx.fillRect(0, viewH * 0.45, viewW, viewH * 0.3);
}

function drawTemple(ctx, camX, viewW, viewH) {
  ctx.fillStyle = "#2a1218";
  const span = 120;
  const parallax = 0.18;
  const start = Math.floor((camX * parallax) / span) - 1;
  for (let i = start; i < start + Math.ceil(viewW / span) + 3; i++) {
    const x = Math.round(i * span - camX * parallax);
    const y = viewH * 0.58;
    ctx.fillRect(x + 20, y, 70, viewH - y);
    ctx.fillStyle = "#6e2430";
    ctx.fillRect(x + 10, y - 8, 90, 8);
    ctx.fillRect(x + 4, y - 16, 102, 6);
    ctx.fillStyle = "#2a1218";
    ctx.fillRect(x + 48, y - 42, 8, 26);
  }
}

function solidAbove(game, tx, ty) {
  if (ty <= 0) return false;
  return game.level.tiles[ty - 1][tx] === "#";
}

function drawTiles(ctx, game, camX, camY, viewW, viewH) {
  const theme = game.level.theme;
  const x0 = Math.max(0, Math.floor(camX / TILE) - 1);
  const y0 = Math.max(0, Math.floor(camY / TILE) - 1);
  const x1 = Math.min(game.level.w - 1, Math.floor((camX + viewW) / TILE) + 1);
  const y1 = Math.min(game.level.h - 1, Math.floor((camY + viewH) / TILE) + 1);
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const ch = game.level.tiles[ty][tx];
      const x = tx * TILE - camX;
      const y = ty * TILE - camY;
      if (ch === "#") drawSolid(ctx, x, y, theme, !solidAbove(game, tx, ty));
      else if (ch === "=") drawPlank(ctx, x, y);
      else if (ch === "^") drawSpike(ctx, x, y);
      else if (ch === "l") drawLantern(ctx, x, y, game.clock);
    }
  }
}

function drawSolid(ctx, x, y, theme, top) {
  if (theme === "bamboo") {
    ctx.fillStyle = "#1f7a40";
    ctx.fillRect(x + 1, y, 14, 16);
    ctx.fillStyle = "#14562e";
    ctx.fillRect(x + 1, y, 3, 16);
    ctx.fillStyle = "#8ed58a";
    ctx.fillRect(x + 11, y, 2, 16);
    ctx.fillStyle = "#0e3d22";
    ctx.fillRect(x + 1, y + 7, 14, 2);
    if (top) {
      ctx.fillStyle = "#b6e6a4";
      ctx.fillRect(x + 1, y, 14, 2);
    }
    return;
  }
  if (theme === "temple") {
    ctx.fillStyle = "#3a2426";
    ctx.fillRect(x, y, 16, 16);
    ctx.fillStyle = "#241416";
    ctx.fillRect(x, y + 13, 16, 3);
    ctx.fillRect(x + 7, y, 2, 16);
    if (top) {
      ctx.fillStyle = "#a1323c";
      ctx.fillRect(x, y, 16, 3);
      ctx.fillStyle = "#f0c24e";
      ctx.fillRect(x, y + 3, 16, 1);
    }
    return;
  }
  ctx.fillStyle = "#2c3450";
  ctx.fillRect(x, y, 16, 16);
  ctx.fillStyle = "#1a2036";
  ctx.fillRect(x + 7, y + 3, 1, 13);
  ctx.fillRect(x, y + 10, 16, 1);
  if (top) {
    ctx.fillStyle = "#4c5a82";
    ctx.fillRect(x, y, 16, 3);
    ctx.fillStyle = "#d0b070";
    ctx.fillRect(x, y + 3, 16, 1);
  } else {
    ctx.fillStyle = "#3a4464";
    ctx.fillRect(x, y, 16, 2);
  }
}

function drawPlank(ctx, x, y) {
  ctx.fillStyle = "#6b422c";
  ctx.fillRect(x, y + 5, 16, 5);
  ctx.fillStyle = "#c08958";
  ctx.fillRect(x, y + 5, 16, 2);
  ctx.fillStyle = "#3a2418";
  ctx.fillRect(x + 3, y + 8, 2, 2);
  ctx.fillRect(x + 11, y + 8, 2, 2);
}

function drawSpike(ctx, x, y) {
  ctx.fillStyle = "#d5deea";
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(x + i * 5 + 1, y + 15);
    ctx.lineTo(x + i * 5 + 3.5, y + 4);
    ctx.lineTo(x + i * 5 + 6, y + 15);
    ctx.fill();
  }
  ctx.fillStyle = "#8b93a6";
  ctx.fillRect(x + 3, y + 10, 1, 5);
  ctx.fillRect(x + 8, y + 10, 1, 5);
  ctx.fillRect(x + 13, y + 10, 1, 5);
}

function drawLantern(ctx, x, y, clock) {
  const glow = 0.18 + Math.sin(clock * 4 + x) * 0.06;
  ctx.fillStyle = `rgba(255, 168, 64, ${glow})`;
  ctx.beginPath();
  ctx.arc(x + 8, y + 11, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#6a4a32";
  ctx.fillRect(x + 7, y, 2, 5);
  ctx.fillStyle = "#ff9a32";
  ctx.fillRect(x + 4, y + 5, 8, 8);
  ctx.fillStyle = "#ffe1a8";
  ctx.fillRect(x + 6, y + 7, 4, 4);
  ctx.fillStyle = "#6a4a32";
  ctx.fillRect(x + 5, y + 13, 6, 2);
}

function drawGoal(ctx, goal, camX, camY, clock) {
  const x = Math.round(goal.x - camX);
  const y = Math.round(goal.y - camY);
  const pulse = 0.65 + Math.sin(clock * 4) * 0.35;
  ctx.fillStyle = `rgba(255, 210, 120, ${0.12 * pulse})`;
  ctx.beginPath();
  ctx.arc(x + 11, y + 18, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e23a3a";
  ctx.fillRect(x + 2, y + 8, 4, 30);
  ctx.fillRect(x + 16, y + 8, 4, 30);
  ctx.fillRect(x - 2, y + 6, 26, 4);
  ctx.fillStyle = "#ff6a55";
  ctx.fillRect(x - 4, y + 1, 30, 4);
  ctx.fillStyle = "#f0c24e";
  ctx.fillRect(x + 6, y + 12, 10, 2);
}

function drawCoin(ctx, sprites, coin, camX, camY, clock) {
  const bob = Math.sin(clock * 5 + coin.x) * 2;
  const slim = Math.floor(clock * 8 + coin.x) % 4 === 2;
  const img = sprites.coin[slim ? 1 : 0];
  ctx.drawImage(img, Math.round(coin.x - camX), Math.round(coin.y - camY + bob));
}

function drawFacing(ctx, img, ent, camX, camY) {
  const cx = Math.round(ent.x - camX + ent.w / 2);
  const foot = Math.round(ent.y - camY + ent.h);
  ctx.save();
  ctx.translate(cx, foot);
  if (ent.dir < 0) ctx.scale(-1, 1);
  ctx.drawImage(img, Math.round(-img.width / 2), -img.height);
  ctx.restore();
}

function drawPlayer(ctx, sprites, p, camX, camY) {
  const pose = sprites.ninja[p.pose] ? p.pose : "idle";
  const frames = sprites.ninja[pose];
  const img = frames[Math.abs(p.frame) % frames.length];
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(Math.round(p.x - camX) + 1, Math.round(p.y + p.h - camY) - 1, p.w - 2, 2);
  const blink = p.invuln > 0 && Math.floor(p.invuln * 14) % 2 === 0;
  ctx.save();
  if (blink && !(p.flash > 0)) ctx.globalAlpha = 0.35;
  drawFacing(ctx, img, p, camX, camY);
  ctx.restore();
  if (p.flash > 0) {
    ctx.fillStyle = "rgba(255, 246, 234, 0.9)";
    const x = Math.round(p.x - camX + p.w / 2 - img.width / 2);
    const y = Math.round(p.y + p.h - camY - img.height);
    ctx.fillRect(x, y, img.width, img.height);
  }
  if (p.pose === "slash") drawSlash(ctx, p, camX, camY);
}

function drawSlash(ctx, p, camX, camY) {
  const t = 1 - p.attackT / 0.2;
  ctx.fillStyle = t < 0.5 ? "#fff6ea" : "#ff5a6a";
  const originX = p.dir > 0 ? p.x + p.w - camX : p.x - camX;
  const originY = p.y + 8 - camY;
  for (let i = 0; i < 8; i++) {
    const a = -1.05 + (i / 7) * 1.9;
    const r = 10 + t * 8;
    const x = originX + p.dir * Math.cos(a) * r;
    const y = originY + Math.sin(a) * r;
    ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3);
  }
}

function enemySprite(sprites, e) {
  if (e.type === "soldier") return sprites.soldier[e.frame % 2];
  if (e.type === "archer") return sprites.archer[e.frame % 2];
  return sprites.imp[e.state === "crouch" || e.state === "air" ? 1 : 0];
}

function drawEnemies(ctx, sprites, game, camX, camY) {
  for (const e of game.enemies) {
    const img = enemySprite(sprites, e);
    ctx.save();
    if (!e.alive) {
      const k = Math.max(0, e.dying / 0.36);
      ctx.globalAlpha = k;
      const cx = Math.round(e.x - camX + e.w / 2);
      const foot = Math.round(e.y - camY + e.h);
      ctx.translate(cx, foot);
      ctx.scale(1 + (1 - k) * 0.8, 1 + (1 - k) * 0.8);
      if (e.dir < 0) ctx.scale(-1, 1);
      ctx.drawImage(img, Math.round(-img.width / 2), -img.height);
    } else {
      drawFacing(ctx, img, e, camX, camY);
    }
    ctx.restore();
    if (e.hurtT > 0 && e.alive) {
      ctx.fillStyle = "rgba(255,246,234,0.85)";
      ctx.fillRect(Math.round(e.x - camX - 1), Math.round(e.y - camY - 2), e.w + 2, e.h + 2);
    }
    if (e.type === "archer" && e.state === "draw") {
      drawText(ctx, "!", e.x - camX + 4, e.y - camY - 10, "#ffe14a", 1);
    }
    if (e.type === "imp" && e.state === "crouch") {
      drawText(ctx, "!", e.x - camX + 3, e.y - camY - 8, "#ffe14a", 1);
    }
  }
}

function drawBoss(ctx, sprites, game, camX, camY) {
  const b = game.boss;
  if (!b) return;
  const pose =
    b.pattern === "cleave" && (b.state === "tell" || b.state === "act")
      ? "cleave"
      : b.pattern === "smash" && (b.state === "tell" || b.state === "act")
        ? "smash"
        : b.pattern === "volley" && (b.state === "tell" || b.state === "act")
          ? "volley"
          : "idle";
  const img = sprites.boss[pose];
  if (b.pattern === "cleave" && b.state === "act") {
    ctx.save();
    ctx.globalAlpha = 0.35;
    drawFacing(ctx, img, { ...b, x: b.x - b.dir * 12 }, camX, camY);
    ctx.globalAlpha = 0.55;
    drawFacing(ctx, img, { ...b, x: b.x - b.dir * 6 }, camX, camY);
    ctx.restore();
  }
  ctx.save();
  if (!b.alive) ctx.globalAlpha = 0.7;
  drawFacing(ctx, img, b, camX, camY);
  ctx.restore();
  if (b.hurtT > 0) {
    ctx.fillStyle = "#fff6ea";
    ctx.fillRect(Math.round(b.x - camX + 6), Math.round(b.y - camY + 8), 3, 3);
    ctx.fillRect(Math.round(b.x - camX + b.w - 8), Math.round(b.y - camY + 10), 3, 3);
  }

  if (!b.awake || !b.alive) return;
  if (b.state === "tell" || (b.pattern === "smash" && b.state === "act")) {
    const label = b.pattern === "cleave" ? "TAJO" : b.pattern === "volley" ? "FUEGO" : "GOLPE";
    drawTextCenter(ctx, label, b.x - camX + b.w / 2, b.y - camY - 16, "#ffe14a", 1);
  }
  if (b.pattern === "cleave" && (b.state === "tell" || b.state === "act")) {
    const y = b.y + b.h - 10 - camY;
    const reach = b.state === "act" ? 240 : 300;
    const x = b.dir > 0 ? b.x - camX : b.x + b.w - reach - camX;
    ctx.fillStyle = "rgba(255, 236, 140, 0.95)";
    ctx.fillRect(Math.round(x), Math.round(y), reach, 3);
    ctx.fillStyle = b.state === "tell" ? "rgba(255, 70, 50, 0.55)" : "rgba(255, 40, 30, 0.8)";
    ctx.fillRect(Math.round(x), Math.round(y + 3), reach, 6);
  }
  if (b.pattern === "smash" && (b.state === "tell" || b.state === "act")) {
    const sx = (b.state === "tell" || b.smashPhase === "rise" || b.smashPhase === "hang" ? b.markX : b.x + b.w / 2) - camX;
    const sy = b.y + b.h - camY;
    const pulse = 28 + Math.sin(game.clock * 10) * 3;
    ctx.strokeStyle = "rgba(255, 80, 60, 0.95)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sx, sy, pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 50, 40, 0.28)";
    ctx.beginPath();
    ctx.arc(sx, sy, 26, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawProjectiles(ctx, sprites, game, camX, camY) {
  for (const pr of game.projectiles) {
    if (pr.kind === "star") {
      const img = sprites.star[Math.floor(game.clock * 16) % 2];
      ctx.drawImage(img, Math.round(pr.x - camX), Math.round(pr.y - camY));
    } else if (pr.kind === "arrow") {
      ctx.fillStyle = "#e7d3b0";
      ctx.fillRect(Math.round(pr.x - camX), Math.round(pr.y - camY + 1), 10, 2);
      ctx.fillStyle = "#c8d0dc";
      const tip = pr.vx > 0 ? pr.x + 10 - camX : pr.x - camX;
      ctx.fillRect(Math.round(tip), Math.round(pr.y - camY), 2, 4);
    } else {
      ctx.fillStyle = "#ff9a32";
      ctx.fillRect(Math.round(pr.x - camX), Math.round(pr.y - camY), 8, 8);
      ctx.fillStyle = "#ffe1a8";
      ctx.fillRect(Math.round(pr.x - camX + 2), Math.round(pr.y - camY + 2), 4, 4);
    }
  }
}

function drawParticles(ctx, game, camX, camY) {
  for (const p of game.particles) {
    ctx.globalAlpha = Math.max(0, p.life / (p.max || 0.5));
    ctx.fillStyle = p.color;
    const s = p.size || 2;
    ctx.fillRect(Math.round(p.x - camX), Math.round(p.y - camY), s, s);
  }
  ctx.globalAlpha = 1;
}

function drawHud(ctx, sprites, game, viewW) {
  const x = 8 + (game.safeLeft || 0);
  const y = 8 + (game.safeTop || 0);
  for (let i = 0; i < MAX_HEARTS; i++) {
    const img = i < game.player.hearts ? sprites.heart : sprites.heartEmpty;
    ctx.drawImage(img, x + i * 11, y);
  }
  ctx.drawImage(sprites.coin[0], x, y + 12);
  drawText(ctx, String(game.coins).padStart(2, "0"), x + 12, y + 13, "#f0c24e", 1);
  ctx.drawImage(sprites.star[0], x + 40, y + 12);
  const ammoColor = game.ammo === 0 ? "#ff5a6a" : "#d5e7f5";
  drawText(ctx, String(game.ammo).padStart(2, "0"), x + 52, y + 13, ammoColor, 1);
  const clock = formatTime(game.levelTime || 0);
  const clockW = textWidth(clock, 1);
  drawText(ctx, clock, viewW - clockW - 8 - (game.safeRight || 0), y + 13, "#d5e7f5", 1);

  if (!(game.bossFight && game.boss && game.boss.awake)) {
    drawTextCenter(ctx, game.level.name, viewW / 2, y, "#f4efe4", 1);
  } else {
    const b = game.boss;
    const bw = Math.min(180, viewW * 0.46);
    const bx = viewW / 2 - bw / 2;
    drawTextCenter(ctx, "SEÑOR ONI", viewW / 2, y - 1, "#ffe1a8", 1);
    ctx.fillStyle = "#1a0c10";
    ctx.fillRect(bx, y + 10, bw, 7);
    ctx.fillStyle = "#6e2430";
    ctx.fillRect(bx, y + 10, bw, 7);
    ctx.fillStyle = b.phase2 ? "#ff5a3a" : "#e23a3a";
    ctx.fillRect(bx, y + 10, Math.max(0, bw * (b.hp / b.maxHp)), 7);
    ctx.strokeStyle = "#f0c24e";
    ctx.lineWidth = 1;
    ctx.strokeRect(bx + 0.5, y + 10.5, bw - 1, 6);
  }

  if (game.showFps) drawText(ctx, `${game.fps | 0} FPS`, viewW - 52 - (game.safeRight || 0), y, "#9bb0c8", 1);
}

function formatTime(t) {
  const s = Math.max(0, Math.floor(t));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function drawRecords(ctx, game, viewW, y) {
  const records = game.records;
  const levels = records && records.levels ? records.levels : [{}, {}, {}];
  drawTextCenter(ctx, "RECORDS", viewW / 2, y, "#f0c24e", 1);
  for (let i = 0; i < 3; i++) {
    const row = levels[i] || {};
    const time = row.time == null ? "--" : formatTime(row.time);
    const coins = row.coins == null ? "--" : String(row.coins);
    drawTextCenter(ctx, `NOCHE ${i + 1}  ${time}  ${coins} MON`, viewW / 2, y + 12 + i * 10, "#d5e7f5", 1);
  }
  const run = records && records.bestRun != null ? formatTime(records.bestRun) : "--";
  drawTextCenter(ctx, `MEJOR CARRERA ${run}`, viewW / 2, y + 46, "#fff6ea", 1);
}

function drawClear(ctx, game, viewW, viewH) {
  const info = game.clearInfo || { index: game.levelIndex, name: game.level.name, time: game.levelTime, coins: game.levelCoins };
  ctx.fillStyle = "rgba(4, 6, 16, 0.72)";
  ctx.fillRect(0, 0, viewW, viewH);
  const y = viewH * 0.22;
  drawTextCenter(ctx, `NOCHE ${info.index + 1} LISTA`, viewW / 2, y, "#f0c24e", 2);
  drawTextCenter(ctx, info.name || "", viewW / 2, y + 20, "#fff6ea", 1);
  drawTextCenter(ctx, `TIEMPO ${formatTime(info.time || 0)}`, viewW / 2, y + 36, "#d5e7f5", 1);
  drawTextCenter(ctx, `MEJOR ${info.bestTime == null ? "--" : formatTime(info.bestTime)}`, viewW / 2, y + 48, "#9bb0c8", 1);
  drawTextCenter(ctx, `MONEDAS ${info.coins || 0}`, viewW / 2, y + 64, "#f0c24e", 1);
  drawTextCenter(ctx, `MEJOR ${info.bestCoins == null ? "--" : info.bestCoins}`, viewW / 2, y + 76, "#9bb0c8", 1);
  if (info.any) {
    ctx.globalAlpha = 0.55 + Math.sin(game.clock * 6) * 0.45;
    drawTextCenter(ctx, "NUEVO RÉCORD", viewW / 2, y + 92, "#ffe14a", 2);
    ctx.globalAlpha = 1;
  }
  ctx.globalAlpha = 0.75 + Math.sin(game.clock * 3) * 0.25;
  drawTextCenter(ctx, "TOCA PARA SEGUIR", viewW / 2, y + (info.any ? 112 : 96), "#fff6ea", 1);
  ctx.globalAlpha = 1;
}

function drawOverlay(ctx, game, viewW, viewH) {
  if (game.mode === "title") {
    ctx.fillStyle = "rgba(4, 6, 16, 0.78)";
    ctx.fillRect(0, viewH * 0.08, viewW, Math.min(168, viewH * 0.7));
    const scale = viewW < 340 ? 2 : 3;
    drawTextCenter(ctx, "KAGE", viewW / 2, viewH * 0.14, "#f4efe4", scale);
    drawTextCenter(ctx, "LA SOMBRA DEL NINJA", viewW / 2, viewH * 0.14 + scale * 9, "#f0c24e", 1);
    const a = 0.45 + Math.sin(game.clock * 3) * 0.4;
    ctx.globalAlpha = Math.max(0.2, a);
    drawTextCenter(ctx, "TOCA PARA EMPEZAR", viewW / 2, viewH * 0.14 + scale * 9 + 14, "#fff6ea", 1);
    ctx.globalAlpha = 1;
    drawRecords(ctx, game, viewW, viewH * 0.14 + scale * 9 + 30);
  } else if (game.mode === "intro") {
    ctx.fillStyle = "rgba(4, 6, 16, 0.4)";
    ctx.fillRect(0, viewH * 0.34, viewW, 48);
    drawTextCenter(ctx, `NOCHE ${game.levelIndex + 1}`, viewW / 2, viewH * 0.36, "#f0c24e", 1);
    drawTextCenter(ctx, game.level.name, viewW / 2, viewH * 0.36 + 14, "#fff6ea", 2);
  } else if (game.mode === "pause") {
    ctx.fillStyle = "rgba(4, 6, 16, 0.55)";
    ctx.fillRect(0, 0, viewW, viewH);
    drawTextCenter(ctx, "PAUSA", viewW / 2, viewH * 0.28, "#fff6ea", 3);
  } else if (game.mode === "dead") {
    ctx.fillStyle = "rgba(70, 8, 16, 0.35)";
    ctx.fillRect(0, 0, viewW, viewH);
    drawTextCenter(ctx, "CAISTE", viewW / 2, viewH * 0.38, "#fff6ea", 3);
    drawTextCenter(ctx, "A LEVANTARSE", viewW / 2, viewH * 0.38 + 28, "#f0c24e", 1);
  } else if (game.mode === "clear") {
    drawClear(ctx, game, viewW, viewH);
  } else if (game.mode === "win") {
    ctx.fillStyle = "rgba(4, 6, 16, 0.62)";
    ctx.fillRect(0, 0, viewW, viewH);
    drawTextCenter(ctx, "VICTORIA", viewW / 2, viewH * 0.18, "#f0c24e", 3);
    drawTextCenter(ctx, "EL ONI HA CAIDO", viewW / 2, viewH * 0.18 + 28, "#fff6ea", 1);
    drawTextCenter(ctx, `TIEMPO ${formatTime(game.time)}`, viewW / 2, viewH * 0.18 + 44, "#d5e7f5", 1);
    const runBest = game.winRecord && game.winRecord.runRec ? game.winRecord.runRec.bestRun : game.records && game.records.bestRun;
    drawTextCenter(ctx, `MEJOR CARRERA ${runBest == null ? "--" : formatTime(runBest)}`, viewW / 2, viewH * 0.18 + 56, "#f0c24e", 1);
    const levelRec = game.winRecord && game.winRecord.levelRec;
    drawTextCenter(ctx, `NOCHE 3 ${formatTime(game.levelTime || 0)}  ${game.levelCoins || 0} MON`, viewW / 2, viewH * 0.18 + 70, "#fff6ea", 1);
    if ((game.winRecord && game.winRecord.runRec && game.winRecord.runRec.isNew) || (levelRec && levelRec.any)) {
      const a = 0.55 + Math.sin(game.clock * 6) * 0.45;
      ctx.globalAlpha = a;
      drawTextCenter(ctx, "NUEVO RÉCORD", viewW / 2, viewH * 0.18 + 86, "#ffe14a", 2);
      ctx.globalAlpha = 1;
    }
    drawTextCenter(ctx, `MONEDAS ${game.coins}`, viewW / 2, viewH * 0.18 + 108, "#f0c24e", 1);
  }
  if (game.bannerT > 0 && game.bannerText) {
    ctx.globalAlpha = Math.min(1, game.bannerT * 2);
    drawTextCenter(ctx, game.bannerText, viewW / 2, viewH * 0.22, "#f0c24e", 2);
    ctx.globalAlpha = 1;
  }
  if (game.flash > 0) {
    ctx.fillStyle = `rgba(180, 20, 40, ${game.flash * 1.4})`;
    ctx.fillRect(0, 0, viewW, viewH);
  }
}

export function renderGame(ctx, game, sprites) {
  const viewW = game.viewW;
  const viewH = game.viewH;
  const mag = game.shake > 0 ? game.shake : 0;
  const ox = mag ? (Math.random() - 0.5) * mag : 0;
  const oy = mag ? (Math.random() - 0.5) * mag : 0;
  ctx.save();
  ctx.translate(ox, oy);
  const camX = Math.round(game.camX);
  const camY = Math.round(game.camY);
  drawBackground(ctx, game, camX, camY, viewW, viewH);
  drawTiles(ctx, game, camX, camY, viewW, viewH);
  if (game.goal) drawGoal(ctx, game.goal, camX, camY, game.clock);
  for (const c of game.coinsList) drawCoin(ctx, sprites, c, camX, camY, game.clock);
  for (const s of game.pickups) {
    const bob = Math.sin(game.clock * 5 + s.x) * 2;
    ctx.drawImage(sprites.star[Math.floor(game.clock * 6) % 2], Math.round(s.x - camX), Math.round(s.y - camY + bob));
  }
  drawEnemies(ctx, sprites, game, camX, camY);
  drawBoss(ctx, sprites, game, camX, camY);
  drawProjectiles(ctx, sprites, game, camX, camY);
  drawPlayer(ctx, sprites, game.player, camX, camY);
  drawParticles(ctx, game, camX, camY);
  if (!["title", "clear", "win", "pause", "dead"].includes(game.mode)) drawHud(ctx, sprites, game, viewW);
  drawOverlay(ctx, game, viewW, viewH);
  ctx.restore();
}
