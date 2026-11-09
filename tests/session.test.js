// The speed rules' long-session checks (CLAUDE.md, "Long sessions"): leaving a map cleans up
// completely, so changing map a hundred times leaves nothing piling up in the world. (The full
// 30-minute session runs in the speed check, `npm run speed session`.)
import test from 'node:test';
import assert from 'node:assert/strict';
import { installFakeScreen } from './support/fake-screen.js';

installFakeScreen();
const { createWorld, updateWorld, loadMap } = await import('../src/world/world.js');
const { createBots, updateBots } = await import('../src/world/bots.js');
const { MAPS } = await import('../src/data/maps.js');
const { balanceChar } = await import('../tools/balance.mjs');

// Every list, set and map the world keeps, and how full each is.
function sizes(w) {
  const out = { 'bots.list': w.bots.list.length };
  for (const [k, v] of Object.entries(w)) {
    if (Array.isArray(v)) out[k] = v.length;
    else if (v instanceof Map || v instanceof Set) out[k] = v.size;
  }
  return out;
}

test('changing map 100 times leaves nothing behind', () => {
  const random = Math.random;
  let seed = 7;
  Math.random = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
  try {
    const w = createWorld(balanceChar('warrior', 40));
    w.log = () => {};
    w.bots = createBots(w, Math.random, { clock: () => new Date(2026, 9, 28, 20, 0) });
    const ids = Object.values(MAPS).filter((m) => !m.dungeon && !m.private).map((m) => m.id);
    const idle = { held: new Set(), pressed: new Set(), locked: false };
    let early = null;
    for (let c = 0; c < 100; c++) {
      loadMap(w, ids[c % ids.length]);
      for (let f = 0; f < 30; f++) {
        updateWorld(w, 1 / 60, idle);
        updateBots(w.bots, w, 1 / 60);
        // (The HUD reads and clears the frame's events, as it does every frame in the game.)
        w.events.length = 0;
      }
      if (c === 19) early = sizes(w);
    }
    const late = sizes(w);
    const grew = Object.keys(late).filter((k) => late[k] > Math.max(30, (early[k] ?? 0) * 1.5)).map((k) => `${k}: ${early[k] ?? 0} -> ${late[k]}`);
    assert.deepEqual(grew, [], 'nothing keeps growing from map to map');
  } finally {
    Math.random = random;
  }
});
