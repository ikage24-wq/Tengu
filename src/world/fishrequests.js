// Fish requests (2026-11-07): every day the tackle shops (Pip, Marlo, Mister Brine) post three
// requests from townsfolk, picked for the waters your Fishing level can reach:
//   bring  a few of an everyday fish
//   size   one at least so long (the catch counts when you land it; hand one in after)
//   rare   one rarer fish, sometimes one that only bites at its hour or in its weather
// Hand a request in at any tackle shop for gold and Fishing EXP (and some of your own). They're
// the same all day (worked out from the day and your name) and new tomorrow.
// char.fishReq = { day, list: [{ kind, fish, count, size?, giver, why, gold, got?, done? }] }.

import { FISH_BY_ID, SPOTS, sizeRange } from '../data/fishing.js';
import { countItem, removeItem } from '../core/inventory.js';
import { lifeLevel, lifeAction, needFor, TIER_LEVEL } from '../core/life.js';
import { today } from '../core/quests.js';

// Who asks, and why (by request kind).
const GIVERS = [
  ['Chef Praline', 'for tonight\'s special'],
  ['Granny Kelp', 'for her famous fish pie'],
  ['Coral and Pearl', 'for the noodle stall'],
  ['Professor Lumen', 'to study under the lens'],
  ['Mira', 'for the village picnic'],
  ['Captain Rook', 'to feed the crew'],
  ['Madame Encore', 'for a stage prop, alive and well'],
  ['Nim', 'to draw in her sketchbook'],
  ['Tock', 'to see if it ticks'],
  ['Bramble', 'for a dare'],
  ['Shelly', 'for her new pond'],
  ['Skipper Nimbus', 'as a treat for the Sky Whale'],
];

// A small seeded random, so a day's requests stay put.
function seeded(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}
const pick = (list, rng) => list[Math.floor(rng() * list.length)];

// The fish you can reach: every pool of every spot your level opens (never the legends or Lumen).
export function reachableFish(char) {
  const lv = lifeLevel(char, 'fishing');
  const out = new Map();
  for (const spots of Object.values(SPOTS)) for (const s of spots) {
    const need = needFor(s);
    if (need > lv) continue;
    // How far along the water is: the level it needs, or for the open sea its own tier's.
    const depth = Math.max(need, TIER_LEVEL[s.tier ?? 1] ?? 1);
    for (const id of Object.keys(s.pool)) {
      const f = FISH_BY_ID[id];
      if (f && !f.boss && !f.legend) out.set(id, Math.max(out.get(id) ?? 0, depth));
    }
  }
  return [...out].map(([id, depth]) => ({ fish: FISH_BY_ID[id], depth }));
}

// The pay: about three times what the fish sell for, more for a big one, rounded to tens.
const tens = (n) => Math.max(10, Math.round(n / 10) * 10);
function payFor(kind, fish, count) {
  if (kind === 'bring') return tens(120 + fish.price * count * 3);
  if (kind === 'size') return tens(200 + fish.price * 9);
  return tens(250 + fish.price * 6);
}

function makeList(char, day) {
  const rng = seeded(`${day}|${char.name ?? ''}`);
  const all = reachableFish(char);
  const common = all.filter((e) => e.fish.rarity <= 2 && !e.fish.when);
  const sizable = all.filter((e) => e.fish.rarity >= 2 && !e.fish.when);
  const rare = all.filter((e) => e.fish.rarity >= 2 && (e.fish.rarity >= 3 || e.fish.when));
  const givers = [...GIVERS];
  const giver = () => givers.splice(Math.floor(rng() * givers.length), 1)[0];
  const list = [];
  // Lean toward the newest waters you can reach.
  const top = (pool) => {
    const best = Math.max(...pool.map((e) => e.depth));
    const near = pool.filter((e) => e.depth >= best - 12);
    return pick(near.length ? near : pool, rng);
  };
  if (common.length) {
    const { fish } = top(common);
    const count = fish.rarity === 1 ? 3 + Math.floor(rng() * 3) : 2 + Math.floor(rng() * 2);
    const [who, why] = giver();
    list.push({ kind: 'bring', fish: fish.id, count, giver: who, why, gold: payFor('bring', fish, count) });
  }
  if (sizable.length) {
    const { fish } = top(sizable);
    const [lo, hi] = sizeRange(fish);
    const size = Math.round(lo + (hi - lo) * (0.45 + rng() * 0.2));
    const [who, why] = giver();
    list.push({ kind: 'size', fish: fish.id, count: 1, size, giver: who, why, gold: payFor('size', fish, 1) });
  }
  const rarePool = rare.filter((e) => !list.some((r) => r.fish === e.fish.id));
  if (rarePool.length) {
    const { fish } = top(rarePool);
    const [who, why] = giver();
    list.push({ kind: 'rare', fish: fish.id, count: 1, giver: who, why, gold: payFor('rare', fish, 1) });
  }
  return list;
}

// Today's requests (made fresh on a new day).
export function fishRequests(world) {
  const char = world.char;
  const day = today(world.dayClock?.() ?? new Date());
  if (char.fishReq?.day !== day) char.fishReq = { day, list: makeList(char, day) };
  return char.fishReq.list;
}

const plural = (name, n) => (n < 2 || /fish$/i.test(name) ? name : /y$/.test(name) ? `${name.slice(0, -1)}ies` : `${name}s`);

// What a request asks, in words.
export function requestText(r) {
  const f = FISH_BY_ID[r.fish];
  // (Coral and Pearl are two; a fish is its own plural, and a jelly is jellies.)
  const two = r.giver.includes(' and ');
  if (r.kind === 'size') return `${r.giver} ${two ? 'want' : 'wants'} a ${f.name} of ${r.size} cm or more, ${r.why}.`;
  if (r.kind === 'bring') return `${r.giver} ${two ? 'need' : 'needs'} ${r.count} ${plural(f.name, r.count)} ${r.why}.`;
  return `${r.giver} would love a ${f.name}, ${r.why}.`;
}

// Whether you can hand it in now, and how far along it is ([have, need]).
export function requestProgress(char, r) {
  const have = countItem(char.inventory, r.fish);
  if (r.kind === 'size') return { ready: Boolean(r.got) && have > 0, have: r.got ? 1 : 0, need: 1 };
  return { ready: have >= r.count, have: Math.min(have, r.count), need: r.count };
}

// Called on every catch (world/fishing.js): a big enough one counts for a size request.
export function noteRequestCatch(world, fish, size) {
  const list = world.char.fishReq?.list;
  if (!list) return;
  for (const r of list) {
    if (r.done || r.got || r.kind !== 'size' || r.fish !== fish.id || size < r.size) continue;
    r.got = true;
    world.log(`That one's big enough for ${r.giver}'s request! Take a ${fish.name} to a tackle shop.`, '#9fe8ff');
  }
}

// Hands request `i` in. Returns why not, or null.
export function handInRequest(world, i) {
  const char = world.char;
  const r = fishRequests(world)[i];
  if (!r || r.done) return 'That request is done.';
  if (!requestProgress(char, r).ready) return r.kind === 'size' && !r.got ? `Land a ${FISH_BY_ID[r.fish].name} of ${r.size} cm or more first.` : `You need ${r.count} ${FISH_BY_ID[r.fish].name} for that.`;
  removeItem(char.inventory, r.fish, r.count);
  r.done = true;
  char.gold += r.gold;
  char.fishReqDone = (char.fishReqDone ?? 0) + 1;
  const f = FISH_BY_ID[r.fish];
  // Fishing EXP (and your own), worth a few good catches.
  lifeAction(world, 'fishing', { tier: f.tier ?? 1, kind: 'fish', scale: r.kind === 'bring' ? 3 : 4 });
  world.log(`${r.giver} is delighted! You got ${r.gold.toLocaleString()} gold.`, '#ffe36b');
  return null;
}
