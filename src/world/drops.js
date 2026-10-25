// Loot: what a monster drops, how it falls, and picking it up.

import { ITEMS } from '../data/items.js';
import { makeEquip, rollRarity } from '../core/items.js';
import { surfacesOf } from './physics.js';

const GEAR_CHANCE = 0.045;
const SCROLL_CHANCE = 0.018;
const POTION_CHANCE = 0.12;
const LIFETIME = 90;
const PICKUP_RANGE = 26;

const RARE_SCROLLS = Object.values(ITEMS).filter((d) => d.scroll && d.scroll.chance < 1).map((d) => d.id);

function potionFor(level, rng) {
  if (rng() < 0.3) return level < 20 ? 'blue_potion' : 'mana_elixir';
  if (level < 10) return 'red_potion';
  if (level < 25) return 'orange_potion';
  return 'white_potion';
}

// Equipment near the monster's level: anything from 15 below to 5 above. Unique gear is rarer.
function gearFor(level, rng) {
  const near = Object.values(ITEMS).filter((d) => d.type === 'equip' && d.reqLevel <= level + 5 && d.reqLevel >= level - 15);
  const uniques = near.filter((d) => d.unique);
  const pool = uniques.length && rng() < 0.15 ? uniques : near.filter((d) => !d.unique);
  if (!pool.length) return null;
  return pool[Math.floor(rng() * pool.length)].id;
}

// Rolls a monster's loot. Returns plain descriptions; spawnDrops turns them into world objects.
export function rollLoot(def, rng = Math.random) {
  const loot = [];
  const [gmin, gmax] = def.gold;
  loot.push({ kind: 'gold', amount: gmin + Math.floor(rng() * (gmax - gmin + 1)) });
  for (const d of def.drops) if (rng() < d.chance) loot.push({ kind: 'item', id: d.id, qty: d.qty ?? 1 });
  if (rng() < POTION_CHANCE) loot.push({ kind: 'item', id: potionFor(def.level, rng), qty: 1 });
  if (rng() < SCROLL_CHANCE) loot.push({ kind: 'item', id: RARE_SCROLLS[Math.floor(rng() * RARE_SCROLLS.length)], qty: 1 });
  const gearRolls = def.boss ? 3 : rng() < GEAR_CHANCE ? 1 : 0;
  for (let i = 0; i < gearRolls; i++) {
    const id = gearFor(def.level, rng);
    // Bosses never drop plain gear.
    const rarity = def.boss ? Math.max(1, rollRarity(rng)) : rollRarity(rng);
    if (id) loot.push({ kind: 'item', inst: makeEquip(id, { variance: 0.12, rng, rarity }) });
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
      if (prev <= s.y && d.y >= s.y) {
        d.y = s.y;
        d.landed = true;
        break;
      }
    }
  }
  return drops.filter((d) => d.age < LIFETIME);
}

// The nearest landed drop within reach of the player's feet, or null.
export function dropInReach(drops, body) {
  let best = null;
  let bestDist = Infinity;
  for (const d of drops) {
    if (!d.landed) continue;
    const dist = Math.abs(d.x - body.x) + Math.abs(d.y - body.y) * 0.5;
    if (dist <= PICKUP_RANGE && dist < bestDist) {
      best = d;
      bestDist = dist;
    }
  }
  return best;
}
