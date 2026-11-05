// Mounts (data/mounts.js, world/mount.js): getting on and off, each one's trick and trade-off,
// hopping off to attack, and how each is earned.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createCharacter } from '../src/core/character.js';
import { createWorld, updateWorld, loadMap } from '../src/world/world.js';
import { MAPS } from '../src/data/maps.js';
import { MOUNTS, MOUNT_IDS } from '../src/data/mounts.js';
import { QUESTS } from '../src/data/quests.js';
import { RECIPES } from '../src/data/crafting.js';
import { TOKEN_SHOP } from '../src/data/coop.js';
import { ITEMS } from '../src/data/items.js';
import { giveMount, ownsMount, mountUp } from '../src/world/mount.js';
import { completeQuest, acceptQuest } from '../src/core/quests.js';
import { addItem } from '../src/core/inventory.js';

const DT = 1 / 60;
const keys = (held = [], pressed = []) => ({ held: new Set(held), pressed: new Set(pressed) });

// A test field: flat ground, a high ledge to step off, a rope, and a pool of water.
MAPS.mount_test = {
  id: 'mount_test', name: 'Test Field', theme: 'meadow', town: 'sprout',
  width: 3000, height: 800, groundY: 700,
  terrain: [[0, 700], [2000, 700], [2040, 760], [2600, 760], [2640, 700], [3000, 700]],
  water: [{ x1: 2040, x2: 2600, y: 712 }],
  platforms: [{ x: 300, y: 400, w: 200 }],
  ropes: [{ x: 1200, top: 300, bottom: 700 }],
  portals: [{ id: 'start', x: 100, y: 700, hidden: true }],
  npcs: [], spawns: [],
};

function rider(id) {
  const char = createCharacter('Rider', { hairStyle: 'bob' });
  char.level = 20;
  const w = createWorld(char);
  w.log = () => {};
  loadMap(w, 'mount_test', 'start');
  w.mobs.length = 0;
  if (id) {
    giveMount(w, id);
    w.char.mount = id;
  }
  return w;
}
function run(w, held, seconds, each) {
  for (let i = 0; i < Math.round(seconds / DT); i++) {
    updateWorld(w, DT, keys(held));
    each?.(w);
  }
}
const settle = (w) => run(w, [], 0.6);
// The highest point of a standing jump.
function jumpHeight(w) {
  settle(w);
  const y0 = w.body.y;
  let top = y0;
  run(w, ['Space'], 0.12);
  run(w, [], 1.2, (x) => (top = Math.min(top, x.body.y)));
  return y0 - top;
}
// How far you run in a second.
function runSpeed(w) {
  settle(w);
  const x0 = w.body.x;
  run(w, ['ArrowRight'], 1);
  return w.body.x - x0;
}

test('every mount has a trick, a trade-off, and a way to earn it', () => {
  for (const id of MOUNT_IDS) {
    const m = MOUNTS[id];
    assert.ok(m.trick && m.trickText && m.hint && m.earn, id);
    assert.ok(m.speed >= 110 && m.speed <= 170, `${id} runs 110-170% of walking`);
  }
  // None is simply the best: the fastest jumps lowest, the highest jumper runs slowest.
  const fastest = MOUNT_IDS.reduce((a, b) => (MOUNTS[a].speed >= MOUNTS[b].speed ? a : b));
  assert.equal(fastest, 'kettle');
  assert.ok(MOUNTS.kettle.jump < 100);
  assert.ok(MOUNTS.bun.speed <= Math.min(...MOUNT_IDS.filter((i) => i !== 'turtle').map((i) => MOUNTS[i].speed)));
});

test('H gets you on and off, with a poof each way', () => {
  const w = rider('bun');
  settle(w);
  updateWorld(w, DT, keys([], ['KeyH']));
  assert.equal(w.riding?.id, 'bun');
  assert.ok(w.fx.some((f) => f.kind === 'mountpoof' && f.on));
  settle(w);
  updateWorld(w, DT, keys([], ['KeyH']));
  assert.equal(w.riding, null);
  // No mount, no ride.
  const none = rider(null);
  updateWorld(none, DT, keys([], ['KeyH']));
  assert.equal(none.riding ?? null, null);
});

test('mounts are faster than walking; the Puff Bun jumps half again as high', () => {
  const walk = runSpeed(rider(null));
  for (const id of MOUNT_IDS) {
    const w = rider(id);
    mountUp(w);
    const sp = runSpeed(w);
    assert.ok(sp > walk * 1.08, `${id} runs faster than walking (${sp.toFixed(0)} vs ${walk.toFixed(0)})`);
  }
  const base = jumpHeight(rider(null));
  const bun = rider('bun');
  mountUp(bun);
  const high = jumpHeight(bun);
  assert.ok(high > base * 1.35, `bun jump ${high.toFixed(0)} vs ${base.toFixed(0)}`);
  const kettle = rider('kettle');
  mountUp(kettle);
  assert.ok(jumpHeight(kettle) < base, 'the Kettle Racer jumps low');
});

test('attacking hops you off and the attack still goes off', () => {
  const w = rider('kettle');
  settle(w);
  mountUp(w);
  settle(w);
  updateWorld(w, DT, keys(['KeyZ'], ['KeyZ']));
  assert.equal(w.riding, null);
  assert.ok(w.attackTimer > 0 || w.pose, 'the attack started');
});

test('the Paper Crane glides when Jump is held in the air', () => {
  const fall = (glide) => {
    const w = rider('crane');
    w.body.x = 400;
    w.body.y = 400;
    settle(w);
    mountUp(w);
    settle(w);
    // Walk off the ledge, then hold Jump (or not) on the way down.
    let t = 0;
    for (let i = 0; i < 120 && w.body.onGround; i++) run(w, ['ArrowRight'], DT);
    while (!w.body.onGround && t < 5) {
      run(w, glide ? ['Space', 'ArrowRight'] : ['ArrowRight'], DT);
      t += DT;
    }
    return t;
  };
  assert.ok(fall(true) > fall(false) * 1.8, 'gliding takes far longer to come down');
});

test('Nimbus floats level off an edge for a moment, then sinks', () => {
  const w = rider('nimbus');
  w.body.x = 470;
  w.body.y = 400;
  settle(w);
  mountUp(w);
  settle(w);
  run(w, ['ArrowRight'], 0.4);
  assert.ok(!w.body.onGround && w.body.x > 500, 'off the ledge');
  const y0 = w.body.y;
  run(w, ['ArrowRight'], 0.5);
  assert.ok(Math.abs(w.body.y - y0) < 3, 'floating level');
  assert.ok(w.riding.hoverLeft < 1 && w.riding.hoverLeft > 0);
  run(w, ['ArrowRight'], 1.2);
  assert.ok(w.body.y > y0 + 20, 'sinking once the hover runs out');
});

test('the Kettle Racer dashes on a double tap, then builds its steam back', () => {
  const w = rider('kettle');
  settle(w);
  mountUp(w);
  settle(w);
  updateWorld(w, DT, keys(['ArrowRight'], ['ArrowRight']));
  run(w, [], 0.1);
  updateWorld(w, DT, keys(['ArrowRight'], ['ArrowRight']));
  assert.ok(w.riding.dashUntil > w.now, 'dashing');
  assert.equal(w.riding.steam, 0);
  const x0 = w.body.x;
  run(w, ['ArrowRight'], 0.3);
  const dashSpeed = (w.body.x - x0) / 0.3;
  assert.ok(dashSpeed > 125 * 2.2, `dash ${dashSpeed.toFixed(0)} px/s`);
  run(w, ['ArrowRight'], 1.3);
  assert.equal(w.riding.steam, 1);
});

test('the Shell Skipper skims water; on foot you wade', () => {
  const across = (id) => {
    const w = rider(id);
    w.body.x = 2060;
    w.body.y = 760;
    w.body.onGround = true;
    settle(w);
    if (id) mountUp(w);
    run(w, [], 0.5);
    const x0 = w.body.x;
    run(w, ['ArrowRight'], 1);
    return { dist: w.body.x - x0, y: w.body.y, swimming: w.body.swimming };
  };
  const wade = across(null);
  const swim = across('turtle');
  assert.ok(swim.swimming && Math.abs(swim.y - 712) < 1, 'the turtle rides the surface');
  assert.ok(swim.dist > wade.dist * 2.4, `swim ${swim.dist.toFixed(0)} vs wade ${wade.dist.toFixed(0)}`);
  assert.ok(wade.dist < 125 * 0.7, 'wading is slow');
});

test('the Ivy Gecko climbs ropes fast; other mounts are stowed on a rope and come back', () => {
  const climb = (id) => {
    const w = rider(id);
    w.body.x = 1200;
    settle(w);
    if (id) mountUp(w);
    settle(w);
    run(w, ['ArrowUp'], 0.05);
    const y0 = w.body.y;
    run(w, ['ArrowUp'], 1);
    return { w, dist: y0 - w.body.y };
  };
  const foot = climb(null);
  const gecko = climb('gecko');
  assert.ok(gecko.w.riding && !gecko.w.riding.stowed, 'the gecko stays');
  assert.ok(gecko.dist > foot.dist * 1.8, `gecko ${gecko.dist.toFixed(0)} vs ${foot.dist.toFixed(0)}`);
  const bun = climb('bun');
  assert.ok(bun.w.riding?.stowed, 'the bun waits off the rope');
  run(bun.w, ['ArrowDown'], 3);
  assert.ok(bun.w.body.onGround && !bun.w.riding.stowed, 'back in the saddle at the bottom');
});

test('each mount is earned in play', () => {
  // The Puff Bun: Clover's quest gives it.
  const q = QUESTS.bun_buddy;
  assert.equal(q.rewards.mount, 'bun');
  assert.ok(MAPS.sprout.npcs.some((n) => n.id === q.giver));
  const char = createCharacter('Q', { hairStyle: 'bob' });
  char.level = 15;
  char.quests.clover_count = { state: 'done' };
  acceptQuest(char, 'bun_buddy');
  for (const o of q.objectives) {
    if (o.type === 'kill') char.quests.bun_buddy.kills = { [o.mob]: o.count };
    if (o.type === 'collect') addItem(char.inventory, o.item, o.count);
  }
  const r = completeQuest(char, 'bun_buddy');
  assert.equal(r?.mount, 'bun');
  assert.ok(char.mounts.includes('bun'));
  // The Kettle Racer's key is crafted; the Nimbus whistle is bought with Party Tokens.
  assert.ok(RECIPES.some((rc) => rc.makes === 'mount_kettle'));
  assert.ok(TOKEN_SHOP.some((t) => t.id === 'mount_nimbus'));
  for (const id of ['mount_kettle', 'mount_nimbus']) assert.ok(MOUNTS[ITEMS[id].effect.mount]);
  // The gecko hides in the Mossy Woods: Up beside it and it's yours.
  const w = rider(null);
  loadMap(w, 'woods', 'west');
  const find = w.map.finds.find((f) => f.mount === 'gecko');
  assert.ok(find);
  Object.assign(w.body, { x: find.x, y: find.y, onGround: true });
  updateWorld(w, DT, keys([], ['ArrowUp']));
  assert.ok(ownsMount(w.char, 'gecko'));
});

test('a mount key teaches the mount when used', () => {
  const w = rider(null);
  addItem(w.char.inventory, 'mount_kettle', 1);
  const hot = { item: 'mount_kettle' };
  w.char.hotkeys.Digit4 = hot;
  updateWorld(w, DT, keys([], ['Digit4']));
  assert.ok(ownsMount(w.char, 'kettle'));
});
