// Fishing (data/fishing.js). world.fishing while you fish:
//   cast   the line flies out (the hero's throw)
//   wait   the bobber floats; a bite comes after a while
//   bite   the bobber dips: tap Attack before `react` runs out
//   reel   a big one is on (`big` fish): hold Attack to reel it in, let go when it runs or the
//          line snaps; it gets away if it pulls all the line back out (the boss fish fights
//          harder: world/lumen.js)
//   catch  a fish leaps out, then you're done
//   miss   it got away, then you're done
// Walking, jumping or pressing Up again stops fishing. The world ignores the other controls while
// you fish.
// Fishing is a life skill (core/life.js): a spot needs its level (the spot's `lv`, or its `tier`'s),
// and the level and rod make bites come sooner, rare fish bite more, the window to hook a little
// longer, and sometimes a second fish comes up with the first. Every catch gives life EXP and
// character EXP. Every catch has a length (data/fishing.js rollSize): the Fish page keeps your
// biggest, and the Fishing Derby goes by it (world/derby.js). Lantern bait halves the wait.

import { giveMount } from './mount.js';
import { FISH_BY_ID, SPOTS, SPOT_REACH, BITE_WAIT, rollSize } from '../data/fishing.js';
import { addItem, countItem } from '../core/inventory.js';
import { DISHES } from '../data/cooking.js';
import { lifeLevel, lifePerks, lifeAction, needFor, withExtra, LIFE_NAMES } from '../core/life.js';
import { ITEMS } from '../data/items.js';
import { spotKey, startedWork, keepWorking, togetherBonus, workersAt } from './coop-life.js';
import { recordCatch } from '../core/quests.js';
import { bossFish, lumenCaught, lumenLost } from './lumen.js';
import { weighIn } from './derby.js';

export const ROD = 'fishing_rod';
// The shop's rod, or a bench-made one (data/crafting.js).
export const hasRod = (char) => countItem(char.inventory, ROD) > 0 || (char.inventory.etc ?? []).some((e) => ITEMS[e.id]?.life?.slot === 'fishing');

// The fishing spot you're standing at, or null. On a stretch of water (`span`) it's the spot as
// fished from where you stand: the bobber out from you (or at its `fixed` place), facing the way
// you face on a boardwalk (`anyFace`); `base` is the spot itself. Never right at the town's stove.
export function spotHere(world) {
  const b = world.body;
  if (!b.onGround) return null;
  if (world.map.stove != null && Math.abs(world.map.stove - b.x) < 34) return null;
  for (const s of SPOTS[world.map.id] ?? []) {
    if (Math.abs(s.y - b.y) >= 6) continue;
    if (!s.span) {
      if (Math.abs(s.x - b.x) < SPOT_REACH) return s;
      continue;
    }
    if (b.x < s.span[0] || b.x > s.span[1]) continue;
    const face = s.anyFace ? b.facing || 1 : s.face;
    const out = Math.abs(s.bx - s.x);
    return { ...s, x: b.x, face, bx: s.fixed ? s.bx : b.x + face * out, base: s };
  }
  return null;
}

// Starts fishing at the spot you're on. Returns why not, or null.
export function startFishing(world) {
  const spot = spotHere(world);
  if (!spot) return 'There are no fish here.';
  if (!hasRod(world.char)) return 'You need a Fishing Rod (Pip and Marlo sell them).';
  const need = needFor(spot);
  const have = lifeLevel(world.char, 'fishing');
  if (have < need) return `These waters need Fishing Lv ${need} (yours is Lv ${have}). Fish the spots you can and you'll get there!`;
  world.body.facing = spot.face;
  world.body.vx = 0;
  world.fishing = { spot, phase: 'cast', t: 0, wait: 0, fish: null, perks: lifePerks(world.char, 'fishing') };
  // Lantern bait on the hook: this cast bites sooner.
  if ((world.char.bait ?? 0) > 0) {
    world.char.bait -= 1;
    world.fishing.bait = true;
  }
  world.pose = { kind: 'throw', t: 0.45, dur: 0.45, since: world.now };
  // Party members may come and fish beside you (world/coop-life.js).
  world.fishing.key = fishKey(world, spot);
  startedWork(world, { key: world.fishing.key, kind: 'fish', spot, x: spot.x, y: spot.y, pose: 'fishwait', secs: 2.4 });
  return null;
}

// How often a catch at sea brings the Shell Skipper (about one in 60 catches).
const TURTLE_CHANCE = 1 / 60;
const workersHere = (world, key) => workersAt(world, key).count;
const fishKey = (world, spot) => spotKey(world, 'fish', (SPOTS[world.map.id] ?? []).indexOf(spot.base ?? spot));

// Rarer fish bite more often with a better rare chance (the skill's level and rod).
function rollFish(spot, rng, rare = 1) {
  const entries = Object.entries(spot.pool).map(([id, w]) => [id, w * (1 + (rare - 1) * ((FISH_BY_ID[id]?.rarity ?? 1) - 1))]);
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
  // Letting go of a big one mid-fight gives it the line.
  if (quit && f.phase === 'reel') {
    world.log(`You let the ${f.fish.name} go.`, '#d4cbe8');
    f.phase = 'miss';
    f.t = 0;
    lumenLost(world, f);
    return true;
  }
  if (quit && (f.phase === 'wait' || f.phase === 'cast')) {
    world.fishing = null;
    world.log('You reel in your line.', '#d4cbe8');
    return false;
  }
  const hook = ['KeyZ', 'ControlLeft', 'ControlRight'].some((k) => pressed.has(k));
  f.t += dt;
  if (f.phase !== 'catch' && f.phase !== 'miss') keepWorking(world);
  if (f.phase === 'cast' && f.t >= 0.5) {
    f.phase = 'wait';
    f.t = 0;
    const perks = f.perks ?? lifePerks(world.char, 'fishing');
    // Fishing side by side with the party: rarer fish bite more (world/coop-life.js).
    const near = f.key ? workersHere(world, f.key) : 1;
    // (Old Lumen, when Granny Kelp's story has you waiting for him: world/lumen.js.)
    f.fish = bossFish(world, f.spot) ?? rollFish(f.spot, rng, perks.rare * (near > 1 ? 1 + 0.5 * Math.min(2, near - 1) : 1));
    f.wait = (BITE_WAIT[0] + rng() * (BITE_WAIT[1] - BITE_WAIT[0]) + (f.fish.rarity - 1) * 1.2) * perks.time * (f.bait ? 0.5 : 1);
    f.react = f.fish.react * perks.react;
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
    if (hook && f.fish.big) startReel(world, f, rng);
    else if (hook) catchFish(world, f, rng);
    else if (f.t >= (f.react ?? f.fish.react)) {
      world.log(`It got away... (it was a ${f.fish.name}!)`, '#ffb3c6');
      f.phase = 'miss';
      f.t = 0;
    }
  } else if (f.phase === 'reel') {
    tickReel(world, f, dt, ['KeyZ', 'ControlLeft', 'ControlRight'].some((k) => held.has(k)), rng);
  } else if ((f.phase === 'catch' && f.t >= 1.4) || (f.phase === 'miss' && f.t >= 0.9)) {
    world.fishing = null;
    return false;
  }
  return true;
}

// ----- The reel: a big fish fights -----
// `got` is how much line you've won back (0-1: it's landed at 1, gone at 0), `tension` how tight
// the line is (it snaps at 1). Hold Attack to reel: you gain line and the line tightens, a lot
// while the fish runs. Let go to ease it: the tension drops, but the fish takes line back. A fish
// runs every second or two, harder the rarer it is; the boss fish harder still (its `pull`).
export const REEL = { gain: 0.3, slip: 0.06, runSlip: 0.16, tight: 0.18, runTight: 1.25, ease: 0.7 };

function startReel(world, f, rng) {
  const pull = f.fish.pull ?? 0.7 + 0.15 * f.fish.rarity;
  f.phase = 'reel';
  f.t = 0;
  f.reel = { got: 0.3, tension: 0.25, pull, run: 0, next: 0.6 + rng() * 0.8, holding: false };
  world.log(`A big one! Hold Z to reel it in, and let go when it runs!`, '#ffe36b');
  world.juice.push({ type: 'bite', x: f.spot.bx, y: f.spot.by });
}

function tickReel(world, f, dt, holding, rng) {
  const r = f.reel;
  r.holding = holding;
  // The fish runs now and then: a burst of pulling, then a rest.
  if (r.run > 0) r.run = Math.max(0, r.run - dt);
  else if ((r.next -= dt) <= 0) {
    r.run = 0.5 + rng() * 0.7 * r.pull;
    r.next = 1 + rng() * 1.4;
    world.juice.push({ type: 'bite', x: f.spot.bx, y: f.spot.by });
  }
  const running = r.run > 0;
  const k = f.fish.boss ? 0.45 : 1;
  if (holding) {
    r.got += REEL.gain * k * (running ? 0.25 : 1) * dt;
    r.tension += (running ? REEL.runTight * r.pull : REEL.tight) * dt;
  } else {
    r.tension -= REEL.ease * dt;
    r.got -= (running ? REEL.runSlip : REEL.slip) * r.pull * dt;
  }
  r.tension = Math.max(0, Math.min(1, r.tension));
  if (r.tension >= 1) {
    world.log(`Snap! The line broke, and the ${f.fish.name} is gone.`, '#ffb3c6');
    f.phase = 'miss';
    f.t = 0;
    lumenLost(world, f);
  } else if (r.got <= 0) {
    world.log(`The ${f.fish.name} pulled all the line out and got away.`, '#ffb3c6');
    f.phase = 'miss';
    f.t = 0;
    lumenLost(world, f);
  } else if (r.got >= 1) catchFish(world, f, rng);
}

function catchFish(world, f, rng) {
  const fish = f.fish;
  const char = world.char;
  f.size = rollSize(fish, rng);
  // The boss fish is let go, not kept (world/lumen.js).
  if (fish.boss) {
    f.phase = 'catch';
    f.t = 0;
    world.fishCaught = { fish, size: f.size, at: world.now };
    lumenCaught(world, f);
    return;
  }
  // Sometimes a second one comes up with it.
  if (!addItem(char.inventory, fish.id, 1)) {
    world.log('Your Etc bag is full!', '#ffb3c6');
    f.phase = 'miss';
    f.t = 0;
    return;
  }
  // Together with the party, one more comes up for each helper (world/coop-life.js).
  const team = f.key ? togetherBonus(world, f.key, f.spot.bx ?? f.spot.x, f.spot.by ?? f.spot.y) : null;
  const extra = (withExtra(1, f.perks ?? lifePerks(char, 'fishing'), rng) > 1 ? 1 : 0) + (team?.extra ?? 0);
  let n = 1;
  for (let k = 0; k < extra && addItem(char.inventory, fish.id, 1); k++) n += 1;
  f.phase = 'catch';
  f.t = 0;
  // The Fish page: how many.
  char.fishBook ??= {};
  const rec = (char.fishBook[fish.id] ??= { n: 0 });
  const first = rec.n === 0;
  rec.n += 1;
  const best = !first && f.size > (rec.best ?? 0);
  rec.best = Math.max(rec.best ?? 0, f.size);
  world.pose = { kind: 'cheer', t: 0.9, dur: 0.9, since: world.now };
  // (The players around you notice a good one: world/bots.js.)
  world.lastCatch = { fish, at: world.now };
  const tag = first ? ' (new!)' : best ? ' (a new best!)' : '';
  world.log(n > 1 ? `You caught ${n > 2 ? n : 'two'} ${fish.name}s at once! The biggest is ${f.size} cm.${tag}` : `You caught a ${fish.name}, ${f.size} cm!${tag}`, fish.rarity >= 3 ? '#ffe36b' : '#bff0dc');
  world.numbers.push({ x: world.body.x, y: world.body.y - 60, text: `${fish.name} ${f.size} cm`, color: '#9fe8ff', t: 0, small: true });
  world.juice.push({ type: 'loot', x: f.spot.bx, y: f.spot.by - 10, color: fish.color });
  world.fishCaught = { fish, size: f.size, at: world.now };
  // Quests that want it caught count it; the Fishing Derby weighs it in (world/derby.js).
  recordCatch(char, fish.id);
  weighIn(world, fish, f.size);
  // A rarer fish is worth more to the skill.
  lifeAction(world, 'fishing', { tier: f.spot.tier ?? 1, kind: 'fish', scale: (1 + (fish.rarity - 1) * 0.25) * (team?.life ?? 1) });
  // Friends in your online room hear about it.
  world.net?.caught?.(world, fish);
  // A sea turtle that's been watching the line swims up after a catch at sea, now and then, and
  // decides to stay (data/mounts.js: Shell Skipper).
  if (f.spot.sea && !char.mounts?.includes('turtle') && rng() < TURTLE_CHANCE) giveMount(world, 'turtle', 'A sea turtle swam up to your line and wants to come along.');
  // A fish's own recipe comes with your first one.
  if (first) {
    const dish = DISHES.find((d) => d.learn === fish.id);
    if (dish && !(char.recipes ?? []).includes(dish.id)) {
      (char.recipes ??= []).push(dish.id);
      world.log(`New recipe: ${dish.name}! Cook it at any town stove.`, '#ffd6a0');
    }
  }
}

