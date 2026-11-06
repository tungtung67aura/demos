const HEX = {
  D: "#0b0b12",
  B: "#171722",
  M: "#2e2e44",
  L: "#d5e4f4",
  H: "#c1122e",
  R: "#ff3b52",
  S: "#ffd0b0",
  E: "#fff6ea",
  G: "#f0c24e",
  T: "#f4efe4",
  A: "#e7f6ff",
  K: "#7a4e2c",
  Y: "#ffe14a",
  O: "#e23b32",
  P: "#9d241c",
  N: "#2a0c0c",
  W: "#f7f4ee",
  C: "#3eaf62",
  F: "#146b38",
  I: "#d5dbe6",
  U: "#8d5a3a",
  Q: "#5c3a28",
};

function grid(w, h) {
  return Array.from({ length: h }, () => Array(w).fill("."));
}

function rect(g, x, y, w, h, ch) {
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) pix(g, x + i, y + j, ch);
  }
}

function pix(g, x, y, ch) {
  if (y >= 0 && y < g.length && x >= 0 && x < g[0].length) g[y][x] = ch;
}

function rim(g) {
  const h = g.length;
  const w = g[0].length;
  const marks = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = g[y][x];
      if (ch !== "B" && ch !== "D" && ch !== "M" && ch !== "N") continue;
      const up = y === 0 || g[y - 1][x] === ".";
      const left = x === 0 || g[y][x - 1] === ".";
      if (up || left) marks.push([x, y]);
    }
  }
  for (const [x, y] of marks) g[y][x] = "L";
}

function paintNinja(pose, frame) {
  const g = grid(16, 22);
  const step = frame % 4;
  if (pose === "run") {
    if (step === 0) {
      rect(g, 5, 15, 2, 5, "B");
      rect(g, 9, 15, 2, 4, "B");
      rect(g, 5, 19, 3, 2, "T");
      rect(g, 10, 18, 2, 2, "T");
    } else if (step === 1) {
      rect(g, 6, 15, 2, 5, "B");
      rect(g, 8, 15, 2, 5, "B");
      rect(g, 6, 19, 2, 2, "T");
      rect(g, 8, 19, 2, 2, "T");
    } else if (step === 2) {
      rect(g, 4, 15, 2, 4, "B");
      rect(g, 9, 15, 2, 5, "B");
      rect(g, 3, 18, 2, 2, "T");
      rect(g, 9, 19, 3, 2, "T");
    } else {
      rect(g, 6, 15, 2, 5, "B");
      rect(g, 8, 16, 2, 4, "B");
      rect(g, 6, 19, 2, 2, "T");
      rect(g, 8, 19, 2, 2, "T");
    }
  } else if (pose === "jump") {
    rect(g, 3, 15, 3, 3, "B");
    rect(g, 10, 15, 3, 3, "B");
    rect(g, 3, 17, 3, 2, "T");
    rect(g, 10, 17, 3, 2, "T");
  } else if (pose === "fall" || pose === "wall") {
    rect(g, 4, 15, 2, 5, "B");
    rect(g, 10, 15, 2, 5, "B");
    rect(g, 3, 19, 3, 2, "T");
    rect(g, 10, 19, 3, 2, "T");
  } else {
    rect(g, 5, 15, 2, 5, "B");
    rect(g, 9, 15, 2, 5, "B");
    rect(g, 4, 19, 3, 2, "T");
    rect(g, 9, 19, 3, 2, "T");
  }

  rect(g, 4, 10, 8, 6, "B");
  rect(g, 5, 13, 6, 2, "G");
  pix(g, 7, 13, "H");
  pix(g, 8, 13, "H");
  rect(g, 5, 3, 6, 7, "B");
  rect(g, 5, 5, 6, 2, "H");
  rect(g, 6, 7, 4, 1, "E");
  pix(g, 7, 7, "D");
  pix(g, 8, 7, "D");

  const scarf = frame % 2 === 0;
  rect(g, 2, 9, 3, 2, "R");
  rect(g, 11, 8, 4, 2, "R");
  if (scarf) {
    rect(g, 1, 11, 2, 2, "H");
    rect(g, 14, 10, 2, 2, "R");
  } else {
    rect(g, 2, 11, 2, 3, "R");
    rect(g, 13, 10, 2, 3, "H");
  }

  if (pose === "slash") {
    rect(g, 11, 11, 5, 1, "A");
    rect(g, 12, 10, 3, 1, "A");
    pix(g, 11, 12, "K");
    pix(g, 15, 10, "W");
  } else {
    pix(g, 3, 6, "A");
    pix(g, 3, 8, "A");
    pix(g, 4, 7, "K");
    pix(g, 2, 5, "A");
  }

  rim(g);
  return g;
}

function paintSoldier(frame) {
  const g = grid(16, 20);
  rect(g, 4, 1, 8, 2, "U");
  rect(g, 2, 3, 12, 2, "Q");
  rect(g, 6, 5, 4, 3, "S");
  pix(g, 7, 6, "D");
  pix(g, 9, 6, "D");
  rect(g, 4, 8, 8, 6, "H");
  rect(g, 5, 9, 6, 3, "R");
  rect(g, 4, 13, 8, 1, "G");
  if (frame % 2 === 0) {
    rect(g, 5, 14, 2, 4, "D");
    rect(g, 9, 14, 2, 4, "M");
    rect(g, 4, 17, 3, 2, "T");
    rect(g, 9, 17, 2, 2, "K");
  } else {
    rect(g, 5, 14, 2, 4, "M");
    rect(g, 9, 14, 2, 4, "D");
    rect(g, 5, 17, 2, 2, "K");
    rect(g, 8, 17, 3, 2, "T");
  }
  rect(g, 13, 3, 1, 14, "K");
  rect(g, 12, 1, 3, 3, "I");
  pix(g, 13, 1, "W");
  return g;
}

function paintArcher(drawing) {
  const g = grid(16, 20);
  rect(g, 5, 2, 6, 3, "M");
  rect(g, 6, 4, 4, 3, "S");
  pix(g, 7, 5, "D");
  pix(g, 9, 5, "D");
  rect(g, 4, 7, 8, 7, "F");
  rect(g, 5, 8, 6, 4, "C");
  rect(g, 5, 13, 2, 5, "Q");
  rect(g, 9, 13, 2, 5, "Q");
  rect(g, 4, 17, 3, 2, "K");
  rect(g, 9, 17, 3, 2, "K");
  if (drawing) {
    rect(g, 12, 6, 1, 9, "K");
    pix(g, 13, 6, "I");
    pix(g, 13, 14, "I");
    pix(g, 14, 9, "G");
    pix(g, 15, 9, "A");
  } else {
    rect(g, 12, 5, 1, 10, "K");
    pix(g, 13, 5, "I");
    pix(g, 13, 14, "I");
  }
  return g;
}

function paintImp(crouch) {
  const g = grid(16, 16);
  const y = crouch ? 3 : 1;
  rect(g, 5, y, 2, 3, "G");
  rect(g, 9, y, 2, 3, "G");
  rect(g, 3, y + 3, 10, 7, "C");
  rect(g, 4, y + 4, 8, 5, "F");
  pix(g, 5, y + 5, "Y");
  pix(g, 6, y + 5, "D");
  pix(g, 9, y + 5, "Y");
  pix(g, 10, y + 5, "D");
  pix(g, 7, y + 7, "R");
  pix(g, 8, y + 7, "R");
  rect(g, 4, 13, 3, 2, "F");
  rect(g, 9, 13, 3, 2, "F");
  return g;
}

function paintBoss(pose) {
  const g = grid(36, 44);
  rect(g, 7, 4, 4, 8, "T");
  rect(g, 25, 4, 4, 8, "T");
  pix(g, 8, 4, "W");
  pix(g, 27, 4, "W");
  rect(g, 8, 8, 20, 5, "D");
  rect(g, 9, 12, 18, 10, "O");
  rect(g, 11, 15, 4, 3, "Y");
  rect(g, 21, 15, 4, 3, "Y");
  pix(g, 12, 16, "D");
  pix(g, 13, 16, "D");
  pix(g, 22, 16, "D");
  pix(g, 23, 16, "D");
  rect(g, 14, 19, 8, 2, "N");
  pix(g, 15, 19, "W");
  pix(g, 20, 19, "W");
  rect(g, 7, 22, 22, 12, "O");
  rect(g, 10, 24, 16, 7, "P");
  rect(g, 7, 31, 22, 3, "G");
  rect(g, 10, 34, 6, 7, "N");
  rect(g, 20, 34, 6, 7, "N");
  rect(g, 9, 40, 7, 3, "D");
  rect(g, 20, 40, 7, 3, "D");

  if (pose === "cleave") {
    rect(g, 26, 20, 8, 4, "O");
    rect(g, 31, 12, 3, 14, "Q");
    rect(g, 30, 10, 5, 3, "I");
  } else if (pose === "smash") {
    rect(g, 2, 16, 8, 4, "O");
    rect(g, 26, 16, 8, 4, "O");
    rect(g, 0, 8, 4, 10, "Q");
    rect(g, 32, 8, 4, 10, "Q");
  } else if (pose === "volley") {
    rect(g, 2, 22, 6, 4, "O");
    rect(g, 28, 18, 6, 4, "O");
    rect(g, 31, 14, 3, 3, "Y");
    rect(g, 33, 16, 3, 3, "R");
  } else {
    rect(g, 2, 24, 6, 4, "O");
    rect(g, 0, 20, 4, 12, "Q");
    rect(g, 0, 18, 5, 3, "I");
    rect(g, 28, 24, 5, 4, "O");
  }
  return g;
}

function paintCoin(slim) {
  const g = grid(8, 8);
  if (slim) {
    rect(g, 3, 1, 2, 6, "G");
    pix(g, 3, 2, "Y");
  } else {
    rect(g, 2, 1, 4, 6, "G");
    rect(g, 3, 2, 2, 4, "Y");
    pix(g, 2, 3, "U");
    pix(g, 5, 4, "W");
  }
  return g;
}

function paintStarFrame(frame) {
  const g = grid(8, 8);
  const maps = [
    ["..G..G..", ".GGGGGG.", "..G..G..", "G..GG..G", "G..GG..G", "..G..G..", ".GGGGGG.", "..G..G.."],
    [".G....G.", "..G..G..", "GG.GG.GG", "..GGGG..", "..GGGG..", "GG.GG.GG", "..G..G..", ".G....G."],
  ];
  const rows = maps[frame % 2];
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) if (rows[y][x] !== ".") g[y][x] = rows[y][x] === "G" ? "I" : "Y";
  }
  pix(g, 3, 3, "G");
  pix(g, 4, 4, "W");
  return g;
}

function paintHeart(full) {
  const g = grid(9, 8);
  const rows = full
    ? ["..HH.HH..", ".HHHHHHH.", ".HHHHHHH.", "..HHHHH..", "...HHH...", "....H....", ".........", "........."]
    : ["..DD.DD..", ".D.....D.", ".D.....D.", "..D...D..", "...D.D...", "....D....", ".........", "........."];
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 9; x++) {
      const ch = rows[y][x];
      if (ch === "H") g[y][x] = "R";
      else if (ch === "D") g[y][x] = "M";
    }
  }
  if (full) {
    pix(g, 2, 2, "W");
    pix(g, 3, 1, "H");
  }
  return g;
}

function canvasFrom(g) {
  const h = g.length;
  const w = g[0].length;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const hex = HEX[g[y][x]];
      if (!hex) continue;
      const i = (y * w + x) * 4;
      img.data[i] = parseInt(hex.slice(1, 3), 16);
      img.data[i + 1] = parseInt(hex.slice(3, 5), 16);
      img.data[i + 2] = parseInt(hex.slice(5, 7), 16);
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

export function buildSprites() {
  const ninja = {};
  for (const pose of ["idle", "jump", "fall", "wall", "slash"]) {
    ninja[pose] = [0, 1].map((frame) => canvasFrom(paintNinja(pose, frame)));
  }
  ninja.run = [0, 1, 2, 3].map((frame) => canvasFrom(paintNinja("run", frame)));
  return {
    ninja,
    soldier: [0, 1].map((frame) => canvasFrom(paintSoldier(frame))),
    archer: [canvasFrom(paintArcher(false)), canvasFrom(paintArcher(true))],
    imp: [canvasFrom(paintImp(false)), canvasFrom(paintImp(true))],
    boss: {
      idle: canvasFrom(paintBoss("idle")),
      cleave: canvasFrom(paintBoss("cleave")),
      smash: canvasFrom(paintBoss("smash")),
      volley: canvasFrom(paintBoss("volley")),
    },
    coin: [canvasFrom(paintCoin(false)), canvasFrom(paintCoin(true))],
    star: [canvasFrom(paintStarFrame(0)), canvasFrom(paintStarFrame(1))],
    heart: canvasFrom(paintHeart(true)),
    heartEmpty: canvasFrom(paintHeart(false)),
  };
}
