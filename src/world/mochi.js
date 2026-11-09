// Your Mochi out with you (docs/design/mochi.md step 11): any Mochi from your Garden can come along
// (the Mochi window, P: ui/pet.js). It follows you round, fetches your loot (a faster runner reaches
// further and fetches quicker), drinks your best tonic when you run low, and a grown one lends you a
// little of its form while it's out (FORM_HELP: a Swift one a little speed, a Strong one attack...,
// more the better that stat). In your Garden (or a friend's) it's home with the others.
//
// Which one's out: char.pet = { seed (which of your Mochi), out, opts: { loot, hp, mp } }. In the
// world: world.mochi (where it is, what it's doing; `m`, its drawing: render/mochi-anim.js).
// The old Cash egg pet (a char.pet with no seed) wanted a garden of its own: it's a Star Egg now, and
// hatches keeping its name (world/garden-life.js).

import { ITEMS } from '../data/items.js';
import { STATS } from '../data/mochi-genes.js';
import { styleOf } from '../data/mochi-raise.js';
import { addItem, countItem } from '../core/inventory.js';

// How it fetches loot: how far from you (across, the faster a runner the further; and up), and how
// often it can pick something up (s).
export const PET_REACH = { range: 110, perStyle: 14, up: 80, every: 0.25 };
// What a grown one's form lends you while it's out, `k` (1-6) by how good it is at that form's stat.
export const FORM_HELP = {
  run: { name: 'a little speed', values: (k) => ({ speed: 2 * k }) },
  power: { name: 'a little attack and magic', values: (k) => ({ watk: 2 * k, matk: 2 * k }) },
  fly: { name: 'a little jump', values: (k) => ({ jump: 1.5 * k }) },
  stamina: { name: 'HP back over time', values: (k) => ({ regenPct: 0.0015 * k }) },
  swim: { name: 'a little more MP', values: (k) => ({ mp: 25 * k }) },
  plain: { name: 'a little more EXP', values: (k) => ({ expPct: 0.01 * k }) },
  moon: { name: 'a little of everything', values: (k) => ({ speed: k, watk: k, matk: k, jump: 0.75 * k, expPct: 0.005 * k }) },
};
const BUFF = 'mochi:pet';
const DEFAULT_OPTS = { loot: true, hp: 40, mp: 25 };

// The one of your Mochi chosen to come along (or null).
export const companionOf = (char) => (char.pet?.seed != null ? (char.garden?.mochi ?? []).find((r) => r.seed === char.pet.seed && r.stage !== 'egg') ?? null : null);
// How it fetches: its reach and how quickly.
export function petReach(rec) {
  const tier = styleOf(rec?.stats?.run?.points ?? 0);
  return { range: PET_REACH.range + tier * PET_REACH.perStyle, up: PET_REACH.up, every: PET_REACH.every * (1 - tier * 0.08) };
}
// What its form lends you (null for a Mochiko).
export function formHelp(rec) {
  const help = rec?.form ? FORM_HELP[rec.form] : null;
  if (!help) return null;
  const st = STATS.includes(rec.form) ? rec.form : null;
  const tier = st ? styleOf(rec.stats[st].points) : Math.max(...STATS.map((s) => styleOf(rec.stats[s].points)));
  return { name: help.name, values: help.values(1 + tier) };
}
// Taking one along, and sending it home.
export function takeAlong(char, rec) {
  char.pet = { seed: rec.seed, out: true, opts: char.pet?.opts ?? { ...DEFAULT_OPTS } };
}
export function sendHome(char) {
  if (char.pet) char.pet.out = false;
}

// The old Cash egg pet: a Star Egg in your bag, its name kept for when it hatches.
function oldPetToEgg(world) {
  const char = world.char;
  const name = char.pet.name ?? 'Mochi';
  addItem(char.inventory, 'mochi_egg_star', 1);
  char.oldPetName = name;
  char.pet = null;
  world.log(`${name} wants a garden of its own! It's a Star Egg now: hatch it in your Mochi Garden.`, '#ffc2d4');
}

// ---------- In the world ----------
// Called every tick: your Mochi walks along behind you and helps. `api` is the world's: { collect(drop),
// useItem(id) } (so this file needs nothing from world.js).
export function tickMochi(world, dt, api) {
  const char = world.char;
  if (char.pet && char.pet.seed == null) oldPetToEgg(world);
  const rec = char.pet?.out ? companionOf(char) : null;
  // (In a garden it's home with the others; in a race it's watching.)
  if (!rec || world.map.garden || world.race) {
    world.mochi = null;
    delete char.buffs[BUFF];
    return;
  }
  const pet = char.pet;
  const b = world.body;
  if (!world.mochi || world.mochi.map !== world.map.id || world.mochi.rec !== rec) {
    world.mochi = { map: world.map.id, rec, x: b.x - b.facing * 26, y: b.y, dir: b.facing, target: null, pickAt: 0, potAt: 0, level: char.level, m: null };
  }
  const p = world.mochi;
  p.m ??= { genes: rec, dir: p.dir, speed: 0, dist: 0, mode: 'run' };
  p.m.genes = rec;
  p.m.size = rec.stage === 'mochiko' ? 'baby' : 'grown';
  const helping = !world.dead;
  const reach = petReach(rec);
  // A level up: it cheers.
  if (char.level > p.level) p.m.action = { name: 'cheer', t0: null, hold: 1.2 };
  p.level = char.level;
  // Its form's help, while it's out (a buff that lasts as long as it does: ui/hud.js).
  const help = formHelp(rec);
  if (help && helping) char.buffs[BUFF] = { name: `${rec.name ?? 'Your Mochi'} is with you`, about: help.name, since: world.now, until: world.now + 2, values: help.values, icon: 'mochi_bell', keep: true };
  else delete char.buffs[BUFF];
  // Loot: the nearest drop in its reach, fetched.
  if (helping && pet.opts.loot) {
    if (p.target && !world.drops.includes(p.target)) p.target = null;
    if (!p.target) {
      let best = null;
      let bd = Infinity;
      for (const d of world.drops) {
        if (!d.landed || d.dropped) continue;
        const dx = Math.abs(d.x - b.x);
        const dy = b.y - d.y;
        if (dx > reach.range || dy > reach.up || dy < -60) continue;
        const dist = Math.abs(d.x - p.x) + Math.abs(d.y - p.y);
        if (dist < bd) [best, bd] = [d, dist];
      }
      p.target = best;
    }
  } else p.target = null;
  // Moving: to its target, or to its spot just behind you; quicker the further it has to go.
  const goal = p.target ? { x: p.target.x, y: p.target.y } : { x: b.x - b.facing * 26, y: b.onGround ? b.y : p.y };
  const dx = goal.x - p.x;
  const speed = Math.min(260, 70 + Math.abs(dx) * 2.4);
  const step = Math.sign(dx) * Math.min(Math.abs(dx), speed * dt);
  p.x += step;
  p.y += (goal.y - p.y) * Math.min(1, dt * 8);
  const vx = dt > 0 ? step / dt : 0;
  if (Math.abs(vx) > 12) p.dir = Math.sign(vx);
  else if (!p.target) p.dir = b.facing;
  Object.assign(p.m, { dir: p.dir, speed: Math.abs(vx) > 12 ? Math.abs(vx) : 0 });
  p.m.dist += Math.abs(step);
  // Got there: it picks the drop up for you.
  if (p.target && Math.abs(p.target.x - p.x) < 8 && Math.abs(p.target.y - p.y) < 14 && world.now >= p.pickAt) {
    if (api.collect(p.target)) p.pickedAt = world.now;
    p.target = null;
    p.pickAt = world.now + reach.every;
  }
  if (!helping) return;
  // Tonics: below your mark, the best one you have, a moment apart.
  const s = world.stats;
  if (s && world.now >= p.potAt) {
    const low = (cur, max, mark) => mark > 0 && cur / max < mark / 100;
    const kind = low(char.hp, s.maxHp, pet.opts.hp) && char.hp > 0 ? 'hp' : low(char.mp, s.maxMp, pet.opts.mp) ? 'mp' : null;
    if (kind) {
      const id = bestTonic(char, kind);
      if (id && api.useItem(id)) {
        p.potAt = world.now + 0.6;
        p.servedAt = world.now;
      } else p.potAt = world.now + 1.5;
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
