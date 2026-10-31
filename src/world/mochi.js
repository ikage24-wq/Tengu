// The Mochi: a pet that follows you round, picks up your loot, and drinks your potions when you
// run low. You adopt one as an egg (Cash). It never needs feeding, and it cheers when you level up.
//
// The pet you own is saved on the character (`char.pet`); the one walking about in the world is
// `world.mochi` (where it is, what it's doing), made fresh on each map.

import { ITEMS } from '../data/items.js';
import { countItem } from '../core/inventory.js';

// What adopting one costs.
export const EGG_CASH = 3000;
// How it helps: its loot range (px from you, across and up), and how often it can pick something
// up (s).
export const PET_REACH = { range: 120, up: 80, every: 0.25 };

// A newly hatched pet.
export function hatchPet(char, name = 'Mochi') {
  char.pet = { name, out: true, opts: { loot: true, hp: 40, mp: 25 } };
  return char.pet;
}
// Adopting from the pet window: Cash for an egg that hatches at once. Returns a reason it can't.
export function adoptPet(char) {
  if (char.pet) return 'You already have a Mochi.';
  if ((char.cash ?? 0) < EGG_CASH) return `An egg costs ${EGG_CASH.toLocaleString()} Cash.`;
  char.cash -= EGG_CASH;
  hatchPet(char);
  return null;
}

// ---------- In the world ----------

// Called every tick: the pet walks along behind you and helps.
// `api` is the world's: { collect(drop), useItem(id) } (so this file needs nothing
// from world.js).
export function tickMochi(world, dt, api) {
  const char = world.char;
  const pet = char.pet;
  if (!pet || !pet.out) {
    world.mochi = null;
    return;
  }
  const b = world.body;
  if (!world.mochi || world.mochi.map !== world.map.id) {
    world.mochi = { map: world.map.id, x: b.x - b.facing * 26, y: b.y, dir: b.facing, moving: false, target: null, pickAt: 0, potAt: 0, level: char.level, cheerAt: null };
  }
  const m = world.mochi;
  m.form = 'baby';
  const helping = !world.dead;
  const bonus = PET_REACH;
  // A level up: it cheers.
  if (char.level > m.level) m.cheerAt = world.now;
  m.level = char.level;

  // Loot: the nearest drop in its range, fetched.
  if (helping && pet.opts.loot) {
    if (m.target && !world.drops.includes(m.target)) m.target = null;
    if (!m.target) {
      let best = null;
      let bd = Infinity;
      for (const d of world.drops) {
        if (!d.landed || d.dropped) continue;
        const dx = Math.abs(d.x - b.x);
        const dy = b.y - d.y;
        if (dx > bonus.range || dy > bonus.up || dy < -60) continue;
        const dist = Math.abs(d.x - m.x) + Math.abs(d.y - m.y);
        if (dist < bd) [best, bd] = [d, dist];
      }
      m.target = best;
    }
  } else m.target = null;

  // Moving: to its target, or to its spot just behind you; quicker the further it has to go.
  const goal = m.target ? { x: m.target.x, y: m.target.y } : { x: b.x - b.facing * 26, y: b.onGround ? b.y : m.y };
  const dx = goal.x - m.x;
  const speed = Math.min(260, 70 + Math.abs(dx) * 2.4);
  const step = Math.sign(dx) * Math.min(Math.abs(dx), speed * dt);
  m.x += step;
  m.y += (goal.y - m.y) * Math.min(1, dt * 8);
  m.vx = dt > 0 ? step / dt : 0;
  m.moving = Math.abs(m.vx) > 12;
  if (m.moving) m.dir = Math.sign(m.vx);
  else if (!m.target) m.dir = b.facing;
  // Got there: it picks the drop up for you.
  if (m.target && Math.abs(m.target.x - m.x) < 8 && Math.abs(m.target.y - m.y) < 14 && world.now >= m.pickAt) {
    if (api.collect(m.target)) m.pickedAt = world.now;
    m.target = null;
    m.pickAt = world.now + bonus.every;
  }

  if (!helping) return;
  // Potions: below your mark, the best tonic you have, a moment apart.
  const s = world.stats;
  if (s && world.now >= m.potAt) {
    const low = (cur, max, mark) => mark > 0 && cur / max < mark / 100;
    const kind = low(char.hp, s.maxHp, pet.opts.hp) && char.hp > 0 ? 'hp' : low(char.mp, s.maxMp, pet.opts.mp) ? 'mp' : null;
    if (kind) {
      const id = bestTonic(char, kind);
      if (id && api.useItem(id)) {
        m.potAt = world.now + 0.6;
        m.servedAt = world.now;
      } else m.potAt = world.now + 1.5;
    }
  }
}

// The tonic for `kind` ('hp' or 'mp') to drink: the strongest one in the bag.
function bestTonic(char, kind) {
  let best = null;
  for (const e of char.inventory.use) {
    if (!e) continue;
    const eff = ITEMS[e.id]?.effect;
    if (!eff?.[kind] || eff.returnTown || eff.pet) continue;
    if (!best || eff[kind] > ITEMS[best].effect[kind]) best = e.id;
  }
  return best && countItem(char.inventory, best) > 0 ? best : null;
}
