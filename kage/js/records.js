const KEY = "kage-records-v1";

function empty() {
  return {
    levels: [
      { coins: null, time: null },
      { coins: null, time: null },
      { coins: null, time: null },
    ],
    bestRun: null,
  };
}

function normalize(data) {
  const base = empty();
  if (!data || !Array.isArray(data.levels)) return base;
  for (let i = 0; i < 3; i++) {
    const row = data.levels[i] || {};
    base.levels[i] = {
      coins: Number.isFinite(row.coins) ? row.coins : null,
      time: Number.isFinite(row.time) ? row.time : null,
    };
  }
  base.bestRun = Number.isFinite(data.bestRun) ? data.bestRun : null;
  return base;
}

export function loadRecords() {
  try {
    if (typeof localStorage === "undefined") return empty();
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    return normalize(JSON.parse(raw));
  } catch {
    return empty();
  }
}

function save(records) {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(KEY, JSON.stringify(records));
  } catch {
    /* private mode can reject storage */
  }
}

export function recordLevel(index, time, coins) {
  const records = loadRecords();
  const row = records.levels[index] || { coins: null, time: null };
  const newTime = row.time == null || time < row.time;
  const newCoins = row.coins == null || coins > row.coins;
  if (newTime) row.time = time;
  if (newCoins) row.coins = coins;
  records.levels[index] = row;
  save(records);
  return { newTime, newCoins, bestTime: row.time, bestCoins: row.coins, any: newTime || newCoins };
}

export function recordRun(time) {
  const records = loadRecords();
  const isNew = records.bestRun == null || time < records.bestRun;
  if (isNew) records.bestRun = time;
  save(records);
  return { isNew, bestRun: records.bestRun };
}
