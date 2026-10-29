// The Mochi: a pet that follows you round, picks up your loot, drinks your potions when you run
// low, and recasts your buffs when they wear off. You adopt one as an egg (Cash), it hatches a
// baby, and what you feed it decides what it grows into: feathers make a Sky Mochi (it flies, and
// reaches loot up on ledges), clover a Swift one (it gathers loot from further off), buns a Strong
// one (it carries faster), spirit gems a Spirit one (it reacts sooner and rebuffs early). Fed and
// happy it's Sunny; left hungry it turns Moon (sulky), and an empty tummy stops it helping until
// it's fed. It cheers when you level up.
//
// The pet you own is saved on the character (`char.pet`); the one walking about in the world is
// `world.mochi` (where it is, what it's doing), made fresh on each map.

import { ITEMS } from '../data/items.js';
import { SKILLS, skillAt } from '../data/skills.js';
import { countItem, removeItem } from '../core/inventory.js';

// What adopting one costs, and how fast a full tummy empties (out with you, in seconds).
export const EGG_CASH = 3000;
const EMPTY_AFTER = 40 * 60;
// A baby grows into a form once one of its four stats reaches this.
export const GROW_AT = 40;
export const PET_STATS = ['sky', 'swift', 'strong', 'spirit'];
// What each form adds to the helping: loot range (px from you, across and up), how often it
// can pick something up (s), and how much sooner it drinks and rebuffs.
const FORM = {
  baby: { range: 80, up: 40, every: 0.4, early: 0 },
  sky: { range: 90, up: 110, every: 0.35, early: 0 },
  swift: { range: 140, up: 50, every: 0.3, early: 0 },
  strong: { range: 90, up: 50, every: 0.16, early: 0 },
  spirit: { range: 90, up: 50, every: 0.35, early: 10 },
};
export const formBonus = (form) => FORM[form] ?? FORM.baby;

// A newly hatched pet.
export function hatchPet(char, name = 'Mochi') {
  char.pet = { name, form: 'baby', stats: { sky: 0, swift: 0, strong: 0, spirit: 0 }, full: 80, joy: 70, out: true, opts: { loot: true, buffs: true, hp: 40, mp: 25 } };
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

export const moodOf = (pet) => (pet.joy < 30 ? 'moon' : 'sunny');
export const hungry = (pet) => pet.full <= 0;

// Feeds the pet one of `id` from the bag. Returns what happened, for the log.
export function feedPet(char, id) {
  const pet = char.pet;
  const food = ITEMS[id]?.effect?.pet;
  if (!pet || !food) return null;
  if (pet.full >= 100 && !food.stat) return `${pet.name} is full.`;
  if (removeItem(char.inventory, id, 1) < 1) return null;
  pet.full = Math.min(100, pet.full + food.full);
  pet.joy = Math.min(100, pet.joy + food.joy);
  if (food.stat) pet.stats[food.stat] = Math.min(99, pet.stats[food.stat] + food.amount);
  // A baby whose stat reaches the mark grows into that form, for good.
  if (pet.form === 'baby') {
    const best = PET_STATS.reduce((a, b) => (pet.stats[b] > pet.stats[a] ? b : a));
    if (pet.stats[best] >= GROW_AT) {
      pet.form = best;
      pet.grewAt = Date.now();
      return `${pet.name} grew into a ${best[0].toUpperCase()}${best.slice(1)} Mochi!`;
    }
  }
  return `${pet.name} ate the ${ITEMS[id].name}.`;
}

// ---------- In the world ----------

// Called every tick: the pet walks along behind you, sees to its hunger and mood, and helps.
// `api` is the world's: { collect(drop), useItem(id), cast(id) } (so this file needs nothing
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
    world.mochi = { map: world.map.id, x: b.x - b.facing * 26, y: b.y, dir: b.facing, moving: false, target: null, pickAt: 0, potAt: 0, buffAt: 0, level: char.level, cheerAt: null };
  }
  const m = world.mochi;
  m.form = pet.form;
  m.mood = moodOf(pet);
  // Hunger and mood: the tummy empties while it's out with you; a full tummy cheers it up, an
  // empty one sours it.
  pet.full = Math.max(0, pet.full - (dt * 100) / EMPTY_AFTER);
  pet.joy = Math.max(0, Math.min(100, pet.joy + dt * (pet.full > 50 ? 0.02 : pet.full <= 0 ? -0.08 : 0)));
  const helping = !hungry(pet) && !world.dead;
  const bonus = formBonus(pet.form);
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
    const low = (cur, max, mark) => mark > 0 && cur / max < (mark + bonus.early) / 100;
    const kind = low(char.hp, s.maxHp, pet.opts.hp) && char.hp > 0 ? 'hp' : low(char.mp, s.maxMp, pet.opts.mp) ? 'mp' : null;
    if (kind) {
      const id = bestTonic(char, kind);
      if (id && api.useItem(id)) {
        m.potAt = world.now + 0.6;
        m.servedAt = world.now;
      } else m.potAt = world.now + 1.5;
    }
  }
  // Buffs: any of your buffs that has run out (a Spirit Mochi rebuffs a few seconds early), when
  // you're free to cast and have the MP.
  if (pet.opts.buffs && world.now >= m.buffAt && !world.pose && !world.dungeon?.cutscene) {
    m.buffAt = world.now + 1.2;
    for (const [id, lv] of Object.entries(char.skills)) {
      const sk = SKILLS[id];
      if (!sk || sk.type !== 'buff' || !lv || sk.fullGauge) continue;
      const on = char.buffs?.[id];
      if (on && on.until - world.now > (pet.form === 'spirit' ? 5 : 0)) continue;
      if (char.mp < (skillAt(id, lv).mp ?? 0)) continue;
      if (api.cast(id)) {
        m.servedAt = world.now;
        break;
      }
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
