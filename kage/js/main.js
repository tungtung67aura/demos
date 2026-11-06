import { createGame, enterLevel, retryLevel, setView, startGame, updateGame } from "./sim.js";
import { renderGame } from "./render.js";
import { buildSprites } from "./sprites.js";
import { createInput } from "./input.js";
import { createAudio } from "./audio.js";
import { loadRecords, recordLevel, recordRun } from "./records.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d", { alpha: false });
const probe = document.getElementById("safe-probe");
const ammoEl = document.getElementById("ammo");
const pauseBtn = document.getElementById("btn-pause");
const muteBtn = document.getElementById("btn-mute");
const menu = document.getElementById("menu");
const resumeBtn = document.getElementById("btn-resume");
const retryBtn = document.getElementById("btn-retry");
const againBtn = document.getElementById("btn-again");

const game = createGame();
const sprites = buildSprites();
const audio = createAudio();
const input = createInput(canvas);
game.showFps = new URLSearchParams(location.search).has("debug");
game.records = loadRecords();

const STEP = 1 / 60;
let acc = 0;
let last = performance.now();
let fps = 60;
let running = true;
let frame = 0;

pauseBtn.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  e.stopPropagation();
  audio.unlock();
  input.poke("pause");
});
muteBtn.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  e.stopPropagation();
  audio.unlock();
  const muted = audio.toggle();
  muteBtn.classList.toggle("is-muted", muted);
  muteBtn.setAttribute("aria-label", muted ? "Activar sonido" : "Silenciar");
});
resumeBtn.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  e.stopPropagation();
  audio.unlock();
  input.poke("confirm");
});
retryBtn.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  e.stopPropagation();
  audio.unlock();
  retryLevel(game);
});
againBtn.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  e.stopPropagation();
  audio.unlock();
  startGame(game);
});

window.addEventListener("pointerdown", () => audio.unlock(), { passive: true });
window.addEventListener("keydown", () => audio.unlock());

function readSafe() {
  const s = getComputedStyle(probe);
  return {
    top: parseFloat(s.paddingTop) || 0,
    right: parseFloat(s.paddingRight) || 0,
    bottom: parseFloat(s.paddingBottom) || 0,
    left: parseFloat(s.paddingLeft) || 0,
  };
}

function fit() {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const cssW = Math.max(1, window.innerWidth);
  const cssH = Math.max(1, window.innerHeight);
  const pw = Math.max(1, Math.round(cssW * dpr));
  const ph = Math.max(1, Math.round(cssH * dpr));
  const tileCss = cssH < 420 ? 28 : cssW < 700 ? 24 : 34;
  let scale = Math.max(1, Math.round((tileCss * dpr) / 16));
  let virtW = Math.floor(pw / scale);
  let virtH = Math.floor(ph / scale);
  while (scale > 1 && virtW < 288) {
    const nextTile = (16 * (scale - 1)) / dpr;
    if (nextTile < 22) break;
    scale -= 1;
    virtW = Math.floor(pw / scale);
    virtH = Math.floor(ph / scale);
  }
  canvas.width = virtW * scale;
  canvas.height = virtH * scale;
  canvas.style.width = `${canvas.width / dpr}px`;
  canvas.style.height = `${canvas.height / dpr}px`;
  setView(game, virtW, virtH);
  const safe = readSafe();
  const toVirt = (px) => (px * dpr) / scale;
  game.safeLeft = toVirt(safe.left);
  game.safeRight = toVirt(safe.right);
  game.safeTop = toVirt(safe.top);
  game.safeBottom = toVirt(safe.bottom);
  game._scale = scale;
  game._dpr = dpr;
}

function syncUi() {
  document.body.dataset.mode = game.mode;
  if (ammoEl.textContent !== String(game.ammo)) ammoEl.textContent = String(game.ammo);
  const starBtn = document.getElementById("btn-star");
  starBtn.classList.toggle("empty", game.ammo <= 0);
  const showMenu = game.mode === "pause" || game.mode === "win";
  if (menu.hidden === showMenu) menu.hidden = !showMenu;
  if (game.mode === "clear" && game.clearInfo && !game.clearInfo.saved) {
    Object.assign(game.clearInfo, recordLevel(game.clearInfo.index, game.clearInfo.time, game.clearInfo.coins), { saved: true });
    game.records = loadRecords();
  }
  if (game.mode === "win" && !game.winRecord) {
    game.winRecord = {
      levelRec: recordLevel(game.levelIndex, game.levelTime, game.levelCoins),
      runRec: recordRun(game.time),
    };
    game.records = loadRecords();
  }
  if (game.mode === "title") game.records = loadRecords();
}

function frameInput(stuck) {
  const snap = input.snapshot();
  if (stuck) {
    snap.jumpPressed = false;
    snap.attackPressed = false;
    snap.shurikenPressed = false;
    snap.pausePressed = false;
    snap.confirmPressed = false;
  }
  return snap;
}

function loop(now) {
  if (!running) return;
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  fps += (1 / Math.max(dt, 0.001) - fps) * 0.08;
  game.fps = fps;
  acc += dt;
  let steps = 0;
  let first = true;
  while (acc >= STEP && steps < 5) {
    updateGame(game, STEP, frameInput(!first));
    for (const name of game.events) audio.play(name);
    first = false;
    acc -= STEP;
    steps += 1;
  }
  if (acc > STEP) acc = 0;
  ctx.setTransform(game._scale, 0, 0, game._scale, 0, 0);
  ctx.imageSmoothingEnabled = false;
  renderGame(ctx, game, sprites);
  syncUi();
  frame += 1;
  requestAnimationFrame(loop);
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    if (game.mode === "play" || game.mode === "intro") {
      game.resumeMode = game.mode;
      game.mode = "pause";
      syncUi();
    }
    running = false;
  } else {
    last = performance.now();
    acc = 0;
    if (!running) {
      running = true;
      requestAnimationFrame(loop);
    }
  }
});

window.addEventListener("resize", fit);
window.addEventListener("orientationchange", () => setTimeout(fit, 60));
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", fit);
}

let lastTouch = 0;
document.addEventListener(
  "touchend",
  (e) => {
    const now = Date.now();
    if (now - lastTouch < 320) e.preventDefault();
    lastTouch = now;
  },
  { passive: false }
);
document.addEventListener(
  "touchmove",
  (e) => {
    e.preventDefault();
  },
  { passive: false }
);
document.addEventListener("gesturestart", (e) => e.preventDefault());
document.addEventListener("contextmenu", (e) => e.preventDefault());

window.addEventListener("error", (e) => {
  console.error(e.error || e.message);
});

fit();
requestAnimationFrame(loop);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

window.__game = {
  get mode() {
    return game.mode;
  },
  get coins() {
    return game.coins;
  },
  get ammo() {
    return game.ammo;
  },
  get hearts() {
    return game.player.hearts;
  },
  get level() {
    return game.levelIndex;
  },
  get fps() {
    return fps;
  },
  get player() {
    return game.player;
  },
  get enemies() {
    return game.enemies;
  },
  get boss() {
    return game.boss;
  },
  get bossFight() {
    return game.bossFight;
  },
  get view() {
    return { w: game.viewW, h: game.viewH, scale: game._scale, dpr: game._dpr };
  },
  input: () => input.debug(),
  start() {
    startGame(game);
  },
  play() {
    if (game.mode === "title" || game.mode === "win") startGame(game);
    game.mode = "play";
    game.introT = 0;
  },
  enter(index) {
    enterLevel(game, index);
  },
};
