// Fishing (data/fishing.js). world.fishing while you fish:
//   cast   the line flies out (the hero's throw)
//   wait   the bobber floats; a bite comes after a while
//   bite   the bobber dips: tap Attack before `react` runs out
//   catch  a fish leaps out, then you're done
//   miss   it got away, then you're done
// Walking, jumping or pressing Up again stops fishing. The world ignores the other controls while
// you fish.

import { FISH_BY_ID, SPOTS, SPOT_REACH, BITE_WAIT } from '../data/fishing.js';
import { addItem, countItem } from '../core/inventory.js';
import { DISHES } from '../data/cooking.js';

export const ROD = 'fishing_rod';

// The fishing spot you're standing at, or null.
export function spotHere(world) {
  const b = world.body;
  if (!b.onGround) return null;
  return (SPOTS[world.map.id] ?? []).find((s) => Math.abs(s.x - b.x) < SPOT_REACH && Math.abs(s.y - b.y) < 6) ?? null;
}

// Starts fishing at the spot you're on. Returns why not, or null.
export function startFishing(world) {
  const spot = spotHere(world);
  if (!spot) return 'There are no fish here.';
  if (countItem(world.char.inventory, ROD) < 1) return 'You need a Fishing Rod (Pip and Marlo sell them).';
  world.body.facing = spot.face;
  world.body.vx = 0;
  world.fishing = { spot, phase: 'cast', t: 0, wait: 0, fish: null };
  world.pose = { kind: 'throw', t: 0.45, dur: 0.45, since: world.now };
  return null;
}

function rollFish(spot, rng) {
  const entries = Object.entries(spot.pool);
  let r = rng() * entries.reduce((n, [, w]) => n + w, 0);
  for (const [id, w] of entries) if ((r -= w) < 0) return FISH_BY_ID[id];
  return FISH_BY_ID[entries[0][0]];
}

// One tick. `held`/`pressed` are the controls. Returns true while fishing (the world then ignores
// the other controls).
export function tickFishing(world, dt, held, pressed, rng = Math.random) {
  const f = world.fishing;
  if (!f) return false;
  const quit = ['ArrowLeft', 'ArrowRight', 'Space', 'AltLeft', 'AltRight'].some((k) => held.has(k)) || pressed.has('ArrowUp') || world.dead;
  if (quit && (f.phase === 'wait' || f.phase === 'cast')) {
    world.fishing = null;
    world.log('You reel in your line.', '#d4cbe8');
    return false;
  }
  const hook = ['KeyZ', 'ControlLeft', 'ControlRight'].some((k) => pressed.has(k));
  f.t += dt;
  if (f.phase === 'cast' && f.t >= 0.5) {
    f.phase = 'wait';
    f.t = 0;
    f.fish = rollFish(f.spot, rng);
    f.wait = BITE_WAIT[0] + rng() * (BITE_WAIT[1] - BITE_WAIT[0]) + (f.fish.rarity - 1) * 1.2;
    f.nibbles = [0.3, 0.6].map((u) => f.wait * u + rng() * 0.4);
  } else if (f.phase === 'wait') {
    if (hook) {
      // Too soon: the fish was only nibbling.
      world.log('Too early! The fish swims off.', '#ffb3c6');
      f.phase = 'miss';
      f.t = 0;
    } else if (f.t >= f.wait) {
      f.phase = 'bite';
      f.t = 0;
      world.juice.push({ type: 'bite', x: f.spot.bx, y: f.spot.by });
    }
  } else if (f.phase === 'bite') {
    if (hook) catchFish(world, f, rng);
    else if (f.t >= f.fish.react) {
      world.log(`It got away... (it was a ${f.fish.name}!)`, '#ffb3c6');
      f.phase = 'miss';
      f.t = 0;
    }
  } else if ((f.phase === 'catch' && f.t >= 1.4) || (f.phase === 'miss' && f.t >= 0.9)) {
    world.fishing = null;
    return false;
  }
  return true;
}

function catchFish(world, f, rng) {
  const fish = f.fish;
  const char = world.char;
  if (!addItem(char.inventory, fish.id, 1)) {
    world.log('Your Etc bag is full!', '#ffb3c6');
    f.phase = 'miss';
    f.t = 0;
    return;
  }
  f.phase = 'catch';
  f.t = 0;
  // The Fish page: how many.
  char.fishBook ??= {};
  const rec = (char.fishBook[fish.id] ??= { n: 0 });
  const first = rec.n === 0;
  rec.n += 1;
  world.pose = { kind: 'cheer', t: 0.9, dur: 0.9, since: world.now };
  // (The players around you notice a good one: world/bots.js.)
  world.lastCatch = { fish, at: world.now };
  world.log(`You caught a ${fish.name}!${first ? ' (new!)' : ''}`, fish.rarity >= 3 ? '#ffe36b' : '#bff0dc');
  world.numbers.push({ x: world.body.x, y: world.body.y - 60, text: fish.name, color: '#9fe8ff', t: 0, small: true });
  world.juice.push({ type: 'loot', x: f.spot.bx, y: f.spot.by - 10, color: fish.color });
  world.fishCaught = { fish, at: world.now };
  // Friends in your online room hear about it.
  world.net?.caught?.(world, fish);
  // A fish's own recipe comes with your first one.
  if (first) {
    const dish = DISHES.find((d) => d.learn === fish.id);
    if (dish && !(char.recipes ?? []).includes(dish.id)) {
      (char.recipes ??= []).push(dish.id);
      world.log(`New recipe: ${dish.name}! Cook it at any town stove.`, '#ffd6a0');
    }
  }
}

