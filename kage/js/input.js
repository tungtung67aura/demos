const KEYS = {
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
  ArrowUp: "jump",
  KeyW: "jump",
  Space: "jump",
  KeyJ: "attack",
  KeyZ: "attack",
  KeyK: "shuriken",
  KeyX: "shuriken",
  KeyP: "pause",
  Escape: "pause",
  Enter: "confirm",
};

export function createInput(canvas) {
  const keys = {
    left: false,
    right: false,
    jump: false,
    attack: false,
    shuriken: false,
  };
  const buttons = { ...keys };
  const edges = { jump: false, attack: false, shuriken: false, pause: false, confirm: false };
  const stamps = { left: 0, right: 0 };
  const pointers = new Map();

  function stamp(name) {
    if (name === "left" || name === "right") stamps[name] = performance.now();
  }

  function setKey(name, down) {
    if (name === "pause") {
      if (down) edges.pause = true;
      return;
    }
    if (name === "confirm") {
      if (down) edges.confirm = true;
      return;
    }
    if (!(name in keys)) return;
    if (down) {
      if (!keys[name]) {
        keys[name] = true;
        stamp(name);
        if (name === "jump" || name === "attack" || name === "shuriken") edges[name] = true;
      }
    } else {
      keys[name] = false;
    }
  }

  function recomputeButton(name) {
    buttons[name] = [...pointers.values()].includes(name);
  }

  function pressButton(name, id) {
    pointers.set(id, name);
    recomputeButton(name);
    stamp(name);
    if (name === "jump" || name === "attack" || name === "shuriken") edges[name] = true;
    const el = document.querySelector(`[data-hold="${name}"]`);
    if (el) el.classList.add("held");
  }

  function releasePointer(id) {
    const name = pointers.get(id);
    if (!name) return;
    pointers.delete(id);
    recomputeButton(name);
    if (!buttons[name]) {
      const el = document.querySelector(`[data-hold="${name}"]`);
      if (el) el.classList.remove("held");
    }
  }

  window.addEventListener("keydown", (e) => {
    const name = KEYS[e.code];
    if (!name) return;
    e.preventDefault();
    if (e.repeat) return;
    setKey(name, true);
  });
  window.addEventListener("keyup", (e) => {
    const name = KEYS[e.code];
    if (!name) return;
    e.preventDefault();
    setKey(name, false);
  });
  window.addEventListener("blur", () => {
    for (const k of Object.keys(keys)) keys[k] = false;
  });

  for (const el of document.querySelectorAll("[data-hold]")) {
    const name = el.dataset.hold;
    const down = (e) => {
      e.preventDefault();
      el.setPointerCapture?.(e.pointerId);
      pressButton(name, e.pointerId);
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointerup", (e) => releasePointer(e.pointerId));
    el.addEventListener("pointercancel", (e) => releasePointer(e.pointerId));
    el.addEventListener("lostpointercapture", (e) => releasePointer(e.pointerId));
  }

  canvas.addEventListener("pointerdown", () => {
    edges.confirm = true;
  });

  function held(name) {
    return keys[name] || buttons[name];
  }

  return {
    snapshot() {
      const left = held("left");
      const right = held("right");
      let axis = 0;
      if (left && right) axis = stamps.left >= stamps.right ? -1 : 1;
      else if (left) axis = -1;
      else if (right) axis = 1;
      const out = {
        axis,
        jumpHeld: held("jump"),
        jumpPressed: edges.jump,
        attackPressed: edges.attack,
        shurikenPressed: edges.shuriken,
        pausePressed: edges.pause,
        confirmPressed: edges.confirm,
      };
      edges.jump = false;
      edges.attack = false;
      edges.shuriken = false;
      edges.pause = false;
      edges.confirm = false;
      return out;
    },
    poke(name) {
      if (name === "confirm" || name === "pause") edges[name] = true;
    },
    debug() {
      return { keys: { ...keys }, buttons: { ...buttons }, pointers: pointers.size };
    },
  };
}
