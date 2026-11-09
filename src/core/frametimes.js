// How long each part of a frame takes (the speed rules' frame budgets): the game logic, the other
// players, the sounds and the drawing, the last FRAMES of each kept in a ring. Read live from the
// browser (`globalThis.__frameTimes.summary()`) or by tools/perf-check.mjs.
export const BUDGETS = { logic: 1.5, bots: 0.8, sound: 0.3, draw: 4, total: 6.9 };
const FRAMES = 600;
const rings = {};
const now = () => (globalThis.performance ? performance.now() : Date.now());

export function timed(name, fn) {
  const t = now();
  try {
    return fn();
  } finally {
    record(name, now() - t);
  }
}

// Laps inside one part (the drawing's layers): `lapStart()`, then `lap(name)` after each layer.
let lapAt = 0;
export const lapStart = () => { lapAt = now(); };
export function lap(name) {
  const t = now();
  record(`draw:${name}`, t - lapAt);
  lapAt = t;
}

export function record(name, ms) {
  const r = (rings[name] ??= { at: 0, n: 0, v: new Float32Array(FRAMES) });
  r.v[r.at] = ms;
  r.at = (r.at + 1) % FRAMES;
  r.n = Math.min(FRAMES, r.n + 1);
}

// Each part's average and its slowest 1% (the worst frames are what you feel), in ms.
export function summary() {
  const out = {};
  for (const [name, r] of Object.entries(rings)) {
    const v = Array.from(r.v.subarray(0, r.n)).sort((a, b) => a - b);
    if (!v.length) continue;
    out[name] = { avg: v.reduce((a, b) => a + b, 0) / v.length, p99: v[Math.min(v.length - 1, Math.floor(v.length * 0.99))], budget: BUDGETS[name] ?? null };
  }
  return out;
}

export function reset() {
  for (const k of Object.keys(rings)) delete rings[k];
}

globalThis.__frameTimes = { summary, reset, BUDGETS };
