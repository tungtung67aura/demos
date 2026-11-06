function build(width, height, fn) {
  const g = Array.from({ length: height }, () => Array(width).fill("."));
  fn({
    fill(x, y, w, h, ch = "#") {
      for (let j = 0; j < h; j++) {
        const yy = y + j;
        if (yy < 0 || yy >= height) continue;
        for (let i = 0; i < w; i++) {
          const xx = x + i;
          if (xx < 0 || xx >= width) continue;
          g[yy][xx] = ch;
        }
      }
    },
    set(x, y, ch) {
      if (y >= 0 && y < height && x >= 0 && x < width) g[y][x] = ch;
    },
  });
  return g.map((row) => row.join(""));
}

export const LEVELS = [
  {
    id: "roofs",
    name: "TEJADOS DE FAROL",
    theme: "roofs",
    arena: null,
    rows: build(70, 14, (m) => {
      m.fill(0, 0, 1, 14, "#");
      m.fill(68, 5, 2, 9, "#");
      m.fill(0, 12, 70, 2, "#");
      m.fill(0, 11, 70, 1, "#");
      for (const x of [22, 23, 46, 47]) m.set(x, 11, "^");
      m.set(7, 10, "#");
      m.fill(14, 8, 5, 1, "=");
      m.fill(28, 10, 10, 1, "#");
      m.fill(34, 8, 6, 1, "=");
      m.fill(52, 9, 8, 2, "#");
      m.set(3, 10, "P");
      m.set(11, 10, "S");
      m.set(16, 7, "A");
      m.set(32, 9, "S");
      m.set(40, 10, "I");
      m.set(55, 8, "A");
      m.set(64, 10, "G");
      m.set(5, 9, "o");
      m.set(13, 9, "o");
      m.set(15, 6, "o");
      m.set(18, 6, "o");
      m.set(26, 10, "*");
      m.set(30, 8, "o");
      m.set(36, 7, "o");
      m.set(50, 10, "o");
      m.set(54, 7, "o");
      m.set(58, 7, "*");
      m.set(62, 9, "o");
      m.set(9, 9, "l");
      m.set(27, 10, "l");
      m.set(49, 10, "l");
    }),
  },
  {
    id: "bamboo",
    name: "SUBIDA DE BAMBU",
    theme: "bamboo",
    arena: null,
    checkpoints: [{ x: 32 * 16, spawnTileX: 34, spawnTileY: 7 }],
    rows: build(58, 18, (m) => {
      m.fill(0, 0, 1, 18, "#");
      m.fill(57, 0, 1, 18, "#");
      m.fill(0, 16, 58, 2, "#");
      m.fill(2, 6, 2, 10, "#");
      const stair = (x, top, w) => m.fill(x, top, w, 16 - top, "#");
      stair(8, 14, 6);
      stair(16, 12, 6);
      stair(24, 10, 6);
      stair(32, 8, 8);
      m.fill(40, 8, 16, 1, "#");
      m.fill(40, 9, 16, 7, "#");
      m.set(4, 15, "P");
      m.set(10, 13, "o");
      m.set(12, 13, "*");
      m.set(18, 11, "S");
      m.set(20, 11, "o");
      m.set(26, 9, "I");
      m.set(28, 9, "o");
      m.set(34, 7, "o");
      m.set(36, 7, "*");
      m.set(44, 7, "A");
      m.set(48, 7, "o");
      m.set(52, 7, "G");
      m.set(6, 15, "l");
      m.set(22, 11, "l");
    }),
  },
  {
    id: "temple",
    name: "TEMPLO DEL ONI",
    theme: "temple",
    arena: { triggerTile: 56, sealX: 54, spawnTileX: 58, spawnTileY: 12 },
    checkpoints: [{ x: 36 * 16, spawnTileX: 38, spawnTileY: 12 }],
    rows: build(82, 16, (m) => {
      m.fill(0, 0, 1, 16, "#");
      m.fill(80, 0, 2, 16, "#");
      m.fill(0, 14, 82, 2, "#");
      m.fill(0, 13, 82, 1, "#");
      for (const x of [18, 19]) m.set(x, 13, "^");
      m.set(6, 12, "#");
      m.set(12, 12, "#");
      m.set(42, 12, "#");
      m.set(49, 12, "#");
      m.fill(8, 10, 5, 1, "=");
      m.fill(22, 10, 6, 1, "=");
      m.fill(30, 10, 8, 1, "=");
      m.fill(58, 10, 4, 1, "=");
      m.fill(72, 10, 4, 1, "=");
      m.fill(64, 7, 5, 1, "=");
      m.set(3, 12, "P");
      m.set(9, 12, "S");
      m.set(10, 9, "A");
      m.set(25, 12, "I");
      m.set(45, 12, "S");
      m.set(33, 9, "A");
      m.set(66, 12, "B");
      m.set(4, 11, "o");
      m.set(9, 8, "o");
      m.set(24, 8, "o");
      m.set(27, 11, "*");
      m.set(32, 9, "o");
      m.set(40, 12, "o");
      m.set(51, 11, "*");
      m.set(59, 9, "o");
      m.set(74, 9, "o");
      m.set(66, 6, "*");
      m.set(14, 11, "l");
      m.set(47, 11, "l");
      m.set(70, 11, "l");
    }),
  },
];
