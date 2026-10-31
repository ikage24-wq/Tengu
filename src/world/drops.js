// Loot: what a monster drops, how it falls, and picking it up.

import { ITEMS } from '../data/items.js';
import { makeEquip, rollRarity } from '../core/items.js';
import { surfacesOf } from './physics.js';

const GEAR_CHANCE = 0.045;
const POTION_CHANCE = 0.12;
const LIFETIME = 90;
const PICKUP_RANGE = 26;

function potionFor(level, rng) {
  if (rng() < 0.3) return level < 20 ? 'blue_potion' : 'mana_elixir';
  if (level < 10) return 'red_potion';
  if (level < 25) return 'orange_potion';
  return 'white_potion';
}

// Equipment near the monster's level: anything from 15 below to 5 above. Unique gear is rarer,
// and half the time it's something for the hero's own job (`fits`), so drops stay useful.
function gearFor(level, rng, fits = null) {
  const near = Object.values(ITEMS).filter((d) => d.type === 'equip' && !d.legacy && d.reqLevel <= level + 5 && d.reqLevel >= level - 15);
  // One-of-a-kind outfits and endgame weapons are the rare part of the pool.
  const special = near.filter((d) => d.unique || d.endgame);
  let pool = special.length && rng() < 0.15 ? special : near.filter((d) => !d.unique && !d.endgame);
  if (fits && rng() < 0.5) pool = pool.filter(fits).length ? pool.filter(fits) : pool;
  if (!pool.length) return null;
  return pool[Math.floor(rng() * pool.length)].id;
}

// Rolls a monster's loot. Returns plain descriptions; spawnDrops turns them into world objects.
export function rollLoot(def, rng = Math.random, fits = null) {
  const loot = [];
  const [gmin, gmax] = def.gold;
  loot.push({ kind: 'gold', amount: gmin + Math.floor(rng() * (gmax - gmin + 1)) });
  for (const d of def.drops) {
    if (rng() >= d.chance) continue;
    // Equipment on a monster's own list (like a boss's signature weapon) drops as rolled gear.
    if (ITEMS[d.id].type === 'equip') loot.push({ kind: 'item', inst: makeEquip(d.id, { rng, rarity: Math.max(1, rollRarity(rng)), variant: 'roll' }) });
    else loot.push({ kind: 'item', id: d.id, qty: d.qty ?? 1 });
  }
  if (rng() < POTION_CHANCE) loot.push({ kind: 'item', id: potionFor(def.level, rng), qty: 1 });
  const gearRolls = def.boss ? 3 : rng() < GEAR_CHANCE ? 1 : 0;
  for (let i = 0; i < gearRolls; i++) {
    const id = gearFor(def.level, rng, fits);
    // Bosses never drop plain gear.
    const rarity = def.boss ? Math.max(1, rollRarity(rng)) : rollRarity(rng);
    if (id) loot.push({ kind: 'item', inst: makeEquip(id, { rng, rarity, variant: 'roll' }) });
  }
  return loot;
}

let nextUid = 1;

// Places loot in the world, fanned out around x and popping upward.
export function spawnDrops(loot, x, y) {
  return loot.map((l, i) => ({
    uid: nextUid++,
    ...l,
    x: x + (i - (loot.length - 1) / 2) * 14,
    y: y - 10,
    vy: -260 - Math.random() * 60,
    landed: false,
    age: 0,
  }));
}

// An item the player drops from their bag: it pops out in front of them, a little forward.
export function dropFromHero(item, x, y, facing) {
  return { uid: nextUid++, kind: 'item', ...item, dropped: true, x: x + facing * 14, y: y - 18, vy: -200, landed: false, age: 0 };
}

export function updateDrops(drops, map, dt) {
  const surfaces = surfacesOf(map);
  for (const d of drops) {
    d.age += dt;
    if (d.landed) continue;
    const prev = d.y;
    d.vy = Math.min(600, d.vy + 1300 * dt);
    d.y += d.vy * dt;
    if (d.vy < 0) continue;
    for (const s of surfaces) {
      if (d.x < s.x1 || d.x > s.x2) continue;
      const sy = s.yAt(d.x);
      if ((prev <= sy && d.y >= sy) || (s.ground && d.y >= sy)) {
        d.y = sy;
        d.landed = true;
        break;
      }
    }
  }
  return drops.filter((d) => d.age < LIFETIME);
}

// The nearest landed drop within reach of the player's feet, or null. Things the player dropped
// themselves only come back with a real press of the loot key (`manual`), never by auto-loot.
export function dropInReach(drops, body, manual = true) {
  let best = null;
  let bestDist = Infinity;
  for (const d of drops) {
    if (!d.landed || (d.dropped && !manual)) continue;
    const dist = Math.abs(d.x - body.x) + Math.abs(d.y - body.y) * 0.5;
    if (dist <= PICKUP_RANGE && dist < bestDist) {
      best = d;
      bestDist = dist;
    }
  }
  return best;
}
