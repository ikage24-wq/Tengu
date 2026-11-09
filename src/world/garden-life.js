// Your Mochi living in the Garden (world/garden.js; docs/design/mochi.md step 4): the eggs waiting
// by the gate (Up beside one rocks it, and it hatches), and the Mochi going about their day.
//
// Where a Mochi is comes from the game's own clock (the same for everyone), not from what happened
// on this screen, so a friend visiting sees each Mochi in the same place doing the same thing.
// Each game hour (a real minute) a Mochi starts from its anchor spot for that hour, strolls between
// spots near it (idling at each), and ends the hour back at the next hour's anchor; swimmers take
// to the pond now and then. At night they all go in to the nursery, where they sleep in its beds.
// What you do here (greeting them, hatching an egg) can move one off its path for a moment; it then
// walks back to where the clock has it.
//
// Raising them: Up beside one opens its care panel (ui/mochi-care.js): petting and playing, and
// feeding it sweets from the kitchen, which is what raises its stats. While you're here the garden's
// time passes for them (data/mochi-raise.js tick); one ready to evolve does, there and then, and one
// at the end of a long, happy life goes back to its egg and hatches again, a generation on. You can
// say goodbye to one (it waves, and is off to a new home); the garden has room for GARDEN_MAX. The
// crop bed in the orchard grows the kitchen's crops: ripe every CROP_GROW seconds.
// A friend visiting (net/visit.js: world.gardenVisit is whose garden it is) sees the same Mochi in
// the same places; they can pet, play with and cheer on your Mochi and feed them sweets of their
// own, and their game sends it to yours (applyGardenGift), where it happens to your real Mochi.
//
//   world.gardenLife = { owner, mochi: [{ rec, m, x, y }], hatching: { egg, m, x } | null, greeted,
//     caring (the entry whose care panel is open) }

import { rollMochi, STAGES } from '../data/mochi-genes.js';
import { newRecord, CANT_POINTS as CANT, tick as tickRec, care as careRec, feed as feedRec, canEvolve, evolve as evolveRec, canRebirth, rebirth as rebirthRec, SWEET_BY_ID, styleOf } from '../data/mochi-raise.js';
import { sendGardenGift } from '../net/visit.js';
import { addItem, countItem, removeItem } from '../core/inventory.js';
import { nightOf } from './daytime.js';
import { groundAt } from './physics.js';

// Where things are in the garden (world/garden.js).
export const EGG_SLOTS = [404, 430, 456];
const LAND = [236, 2200];
const POND = [2290, 2770];
const WATER_Y = 760;
const NURSERY_DOOR = 760;
const BEDS = [560, 630, 700, 476, 406, 336, 266, 196];
const HOUR = 60;
// How many Mochi a garden has room for (a bed each in the nursery).
export const GARDEN_MAX = BEDS.length;
// What a visitor can do with your Mochi (besides feeding it).
export const VISITOR_CARE = ['pet', 'play', 'cheer'];
// Its styles' speeds (render/mochi-anim.js GAITS, SWIMS), by points.
const GAIT_SPEED = [34, 60, 80, 104, 136, 168];
const SWIM_SPEED = [26, 44, 64, 88, 112, 140];
// The pond's water (world/garden.js).
const WATER = [2236, 2826];
// The crop bed (world/garden.js mg_cropbed): ripe again this long after you pick it, and what it gives.
export const CROP_X = 1962;
export const CROP_GROW = 15 * 60;
const CROP_YIELD = { mochi_rice: 3, azuki: 2, kinako: 2, fire_pepper: 1 };
const inWater = (x) => x > WATER[0] + 4 && x < WATER[1] - 4;
const tierOf = (rec, stat) => styleOf(rec.stats?.[stat]?.points ?? 0);
const pts = (rec, stat) => rec.stats?.[stat]?.points ?? 0;

const hash = (n) => {
  const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
};
const runPts = (rec) => rec.stats?.run?.points ?? 0;
const swimPts = (rec) => rec.stats?.swim?.points ?? 0;
// How fast it strolls about the garden (px/s): a gentle fraction of its running style; a Mochiko
// who can't walk yet scoots along slowly.
function strollSpeed(rec) {
  const p = runPts(rec);
  if (p < CANT.run) return 6;
  const tier = [0, 300, 700, 1100, 1600, 2100].reduce((t, need, i) => (p >= need ? i : t), 0);
  return Math.max(18, GAIT_SPEED[tier] * 0.5);
}
// How far from its anchor it wanders in an hour.
const rangeOf = (v) => Math.min(520, 40 + v * 9);

// Its anchor for game hour `b`: somewhere on land (a swimmer's sometimes by the pond).
function anchor(rec, b) {
  const h = hash(rec.seed * 0.137 + b * 7.31);
  const v = strollSpeed(rec);
  // (A slow one drifts from where it was the hour before, so it never has far to go.)
  if (v < 12) {
    const base = LAND[0] + 80 + hash(rec.seed * 0.71) * 500;
    return Math.max(LAND[0], Math.min(LAND[1], base + (hash(rec.seed + b * 3.3) - 0.5) * 120));
  }
  return LAND[0] + h * (LAND[1] - LAND[0]);
}

// Where the clock has it at real time `t` (seconds): { x, moving, swim, inside }.
export function scheduledAt(rec, t) {
  const b = Math.floor(t / HOUR);
  const tt = t - b * HOUR;
  const v = strollSpeed(rec);
  const R = rangeOf(v);
  const a0 = anchor(rec, b);
  const a1 = anchor(rec, b + 1);
  const canSwim = swimPts(rec) >= CANT.swim;
  // The hour's legs: idle, then stroll to a spot near the anchor, again and again; then home to the
  // next hour's anchor before the hour is out.
  let x = a0;
  let clock = 0;
  for (let i = 0; i < 12; i++) {
    const idle = 2.5 + hash(rec.seed * 0.31 + b * 1.7 + i * 2.9) * 4.5;
    if (tt < clock + idle) return { x, moving: false };
    clock += idle;
    let to = a0 + (hash(rec.seed * 0.53 + b * 2.3 + i * 4.1) - 0.5) * 2 * R;
    // (A swimmer heads for the water now and then.)
    if (canSwim && hash(rec.seed * 0.91 + b * 5.1 + i) < 0.22) to = POND[0] + hash(rec.seed + b + i * 9.7) * (POND[1] - POND[0]);
    else to = Math.max(LAND[0], Math.min(LAND[1], to));
    const walk = Math.abs(to - x) / v;
    const home = Math.abs(a1 - to) / v;
    if (clock + walk + home > HOUR - 1) break;
    if (tt < clock + walk) return { x: x + Math.sign(to - x) * v * (tt - clock), moving: true, dir: Math.sign(to - x) || 1 };
    clock += walk;
    x = to;
  }
  // Home to the next hour's anchor, arriving just as the hour turns.
  const walk = Math.abs(a1 - x) / v;
  const start = HOUR - walk;
  if (tt < start) return { x, moving: false };
  return { x: x + Math.sign(a1 - x) * v * (tt - start), moving: Math.abs(a1 - x) > 0.5, dir: Math.sign(a1 - x) || 1 };
}

// The garden as it is now, made fresh on arriving: its owner's Mochi and eggs.
export function enterGarden(world, owner) {
  const g = owner?.garden;
  world.gardenLife = {
    owner,
    mochi: (g?.mochi ?? []).map((rec) => ({ rec, m: newAnim(rec), x: null })),
    hatching: null,
    greeted: false,
    caring: null,
  };
}
const newAnim = (rec) => ({ genes: rec, dir: 1, speed: 0, dist: 0, size: rec.stage === 'mochiko' || rec.stage === 'egg' ? 'baby' : 'grown' });

// Each frame: every Mochi heads for where the clock has it (or to you, greeting), stepping along
// the ground or swimming; at night they're inside, asleep.
export function tickGarden(world, dt) {
  const life = world.gardenLife;
  if (!life) return;
  const map = world.map;
  const now = Date.now() / 1000;
  // (The world's own night: the game clock, or what a scene or a test has set.)
  const night = (world.night ?? nightOf(new Date())) > 0.5;
  const inside = Boolean(map.indoor);
  // Greeting: the first moment you're here, the Mochi who love you most come running.
  const owner = !world.gardenVisit;
  if (!life.greeted && !inside && !night && owner) {
    life.greeted = true;
    life.mochi.forEach((e, i) => {
      if ((e.rec.bond ?? 0) >= 250) e.greet = { until: now + 6 + i * 0.4 };
    });
  }
  if (life.caring && !life.mochi.includes(life.caring)) life.caring = null;
  const gone = [];
  life.mochi.forEach((e, i) => {
    const { rec } = e;
    // (The garden's time passes for them while you're here.)
    if (owner) tickRec(rec, dt);
    // Saying goodbye: it waves, then fades away, off to its new home.
    if (e.leaving) {
      e.m.speed = 0;
      e.fade = Math.max(0, 1 - (now - e.leaving.t0 - 2.4) / 1.2);
      if (e.fade <= 0) gone.push(e);
      return;
    }
    // A scene playing where it stands: evolving; going back to its egg; hatching again.
    if (e.scene) {
      const sm = e.m;
      if (e.scene === 'evolve' && sm.evolved) {
        e.m = newAnim(rec);
        e.m.dir = e.dir ?? 1;
        e.scene = null;
        e.m.action = { name: 'evolved', t0: null, hold: 0 };
      } else if (e.scene === 'rebirth' && sm.reborn) {
        e.m = { genes: rec, dir: sm.dir, speed: 0, dist: 0, size: 'baby', hatch: { t0: null } };
        e.scene = 'hatch';
        return;
      } else if (e.scene === 'hatch' && sm.hatched) {
        rec.stage = 'mochiko';
        sm.genes = rec;
        sm.noIdle = false;
        e.scene = null;
        if (owner) world.log(`It hatched again: a little Mochiko, generation ${rec.gen}!`, '#ffc2d4');
      } else return;
    }
    const m = e.m;
    m.genes = rec;
    m.size = rec.stage === 'mochiko' ? 'baby' : 'grown';
    if (owner && !inside && !night && e.x != null && rec.stage === 'mochiko' && canEvolve(rec)) {
      const before = { ...rec, stage: 'mochiko', path: null };
      const out = evolveRec(rec);
      e.dir = m.dir;
      e.m = { genes: before, dir: m.dir, speed: 0, dist: 0, size: 'baby', evolve: { t0: null, path: out.path, moon: out.stage === 'tsukimochi' } };
      e.scene = 'evolve';
      if (life.caring === e) life.caring = null;
      world.log(out.stage === 'tsukimochi' ? 'Your Mochiko is glowing... a Tsukimochi! It will live forever.' : `Your Mochiko is glowing... it's evolving into ${STAGES[out.stage] ?? out.stage}!`, '#ffc2d4');
      return;
    }
    // The end of a long, happy life: back to its egg, to start again (stronger for it).
    if (owner && !inside && !night && e.x != null && canRebirth(rec)) {
      const out = rebirthRec(rec);
      const list = life.owner.garden.mochi;
      list[list.indexOf(rec)] = out.egg;
      e.rec = out.egg;
      e.m = { genes: rec, dir: m.dir, speed: 0, dist: 0, size: 'grown', rebirth: { t0: null }, egg: out.egg };
      e.scene = 'rebirth';
      if (life.caring === e) life.caring = null;
      world.log(`Your ${STAGES[rec.stage]} has lived a long, happy life... it waves, and goes back to its egg to start again!${out.raised.length ? ' It will be stronger for it.' : ''}`, '#ffc2d4');
      return;
    }
    if (inside) {
      // The nursery: asleep in the beds at night; by day, nobody's in.
      e.hidden = !night;
      e.x = BEDS[i % BEDS.length];
      e.y = groundAt(map, e.x);
      if (night && !m.action) m.action = { name: 'nap', t0: null, hold: 1e9 };
      return;
    }
    if (night) {
      // Bedtime: off to the nursery door, and in.
      e.hidden = e.x != null && Math.abs(e.x - NURSERY_DOOR) < 4;
    } else e.hidden = false;
    const sched = night ? { x: NURSERY_DOOR, moving: true } : scheduledAt(rec, now + i * 3.7);
    let target = sched.x;
    if (e.greet && now < e.greet.until) target = world.body.x + (e.x != null && e.x < world.body.x ? -26 - i * 14 : 26 + i * 14);
    else e.greet = null;
    // (Being cared for, it stays put, looking up at you.)
    const busy = now < (e.busyUntil ?? 0);
    if (busy && e.x != null) target = e.x;
    // (One who can't swim yet stops at the water's edge.)
    if (pts(rec, 'swim') < CANT.swim && target > LAND[1]) target = LAND[1];
    if (e.x == null) e.x = sched.x;
    const wet = inWater(e.x);
    const v = wet ? (pts(rec, 'swim') >= CANT.swim ? SWIM_SPEED[tierOf(rec, 'swim')] * 0.6 : 18) : strollSpeed(rec) * (e.greet ? 2 : Math.abs(target - e.x) > 40 ? 1.5 : 1);
    const dx = target - e.x;
    const step = Math.sign(dx) * Math.min(Math.abs(dx), v * dt);
    e.x += step;
    if (Math.abs(dx) > 0.5) m.dir = Math.sign(dx);
    else if (e.greet || busy) m.dir = Math.sign(world.body.x - e.x) || 1;
    m.dist += Math.abs(step);
    m.speed = Math.abs(dx) > 0.5 ? v : 0;
    // In the pond it swims; on land it walks (or scoots, if it can't yet).
    const swimming = inWater(e.x);
    m.mode = swimming ? 'swim' : 'run';
    m.inWater = swimming;
    e.y = swimming ? WATER_Y : groundAt(map, e.x);
    // A greeting ends in a happy wave.
    if (e.greet && Math.abs(dx) <= 0.5 && !e.waved) {
      e.waved = true;
      m.action = { name: 'cheer', t0: null, hold: 1.5 };
    }
  });
  for (const e of gone) {
    life.mochi.splice(life.mochi.indexOf(e), 1);
    const list = life.owner?.garden?.mochi;
    if (owner && list?.includes(e.rec)) list.splice(list.indexOf(e.rec), 1);
    if (life.caring === e) life.caring = null;
  }
}

// ---------- Caring ----------
// The Mochi beside you, if there's one (and not one in the middle of a scene).
export function mochiNear(world, reach = 26) {
  const life = world.gardenLife;
  if (!life || world.map.indoor) return null;
  const b = world.body;
  let best = null;
  for (const e of life.mochi) {
    if (e.hidden || e.x == null || e.scene || e.leaving) continue;
    const d = Math.abs(e.x - b.x);
    if (d < reach && Math.abs((e.y ?? b.y) - b.y) < 30 && (!best || d < Math.abs(best.x - b.x))) best = e;
  }
  return best;
}
// Plays what came of caring for it or feeding it: its reaction, then a trick it just learned, a
// level-up hop, a new way to move.
function react(e, out, action, extra = {}) {
  const m = e.m;
  m.action = { name: action, t0: null, hold: 0, ...extra };
  const seq = [];
  if (out?.learned) seq.push({ name: out.learned });
  if (out?.levels > 0) seq.push({ name: 'levelup' });
  for (let k = 0; k < (out?.styleUps?.length ?? 0); k++) seq.push({ name: 'newstyle' });
  m.queue = [...(m.queue ?? []), ...seq];
  e.busyUntil = Date.now() / 1000 + 3 + seq.length * 1.5;
  e.greet = null;
}
export function careFor(world, e, what) {
  if (e.scene || e.leaving || (world.gardenVisit && !VISITOR_CARE.includes(what))) return null;
  const out = careRec(e.rec, what);
  if (out) react(e, out, out.action, { hold: 1.4 });
  // (A visitor's game tells the owner's, where it happens to the real Mochi.)
  if (out && world.gardenVisit) sendGardenGift(world, e.rec.seed, what);
  return out;
}
// Feeds it sweet `id` from your bag (it won't when it's too full).
export function feedMochi(world, e, id) {
  const sw = SWEET_BY_ID[id];
  if (!sw || e.scene || e.leaving || countItem(world.char.inventory, id) < 1) return null;
  const out = feedRec(e.rec, id);
  if (!out) return null;
  if (!out.refused) removeItem(world.char.inventory, id, 1);
  if (!out.refused && world.gardenVisit) sendGardenGift(world, e.rec.seed, 'feed', id);
  react(e, out, out.action, { sweet: sw.kind });
  if (out.refused) world.log('It pats its round tummy: too full for now!', '#ffd6a0');
  else if (out.learned) world.log(`It loved trying ${sw.name}... and learned a new trick!`, '#ffc2d4');
  return out;
}
// Says goodbye to it (your own garden only): it waves, and is off to a new home.
export function sayGoodbye(world, e) {
  if (world.gardenVisit || e.scene || e.leaving) return false;
  e.leaving = { t0: Date.now() / 1000 };
  e.greet = null;
  e.m.queue = [];
  e.m.action = { name: 'farewell', t0: null, hold: 0 };
  world.log(`Your ${STAGES[e.rec.stage] ?? 'Mochi'} waves goodbye... off to a new home, where it'll be loved too.`, '#ffc2d4');
  return true;
}
// A friend visiting your garden petted or fed one of your Mochi (net/visit.js): it happens to your
// real Mochi, and if you're there you see it react. (Its bond is with you: a visitor's care cheers it
// up, but doesn't change that.)
export function applyGardenGift(world, msg, who) {
  const rec = world.char.garden?.mochi.find((r) => r.seed === msg.seed);
  if (!rec || rec.stage === 'egg') return;
  const here = !world.gardenVisit ? world.gardenLife?.mochi.find((e) => e.rec === rec && !e.scene && !e.leaving) : null;
  const name = STAGES[rec.stage] ?? 'Mochi';
  const bond = rec.bond;
  if (msg.what === 'feed') {
    const sw = SWEET_BY_ID[msg.sweet];
    if (!sw) return;
    const out = feedRec(rec, sw.id);
    rec.bond = bond;
    if (here && out) react(here, out, out.action, { sweet: sw.kind });
    world.log(out?.refused ? `${who} offered your ${name} a ${sw.name}, but it was too full.` : `${who} fed your ${name} a ${sw.name}!`, '#ffc2d4');
    return;
  }
  if (!VISITOR_CARE.includes(msg.what)) return;
  const out = careRec(rec, msg.what);
  rec.bond = bond;
  if (here && out) react(here, out, out.action, { hold: 1.4 });
  world.log(`${who} ${msg.what === 'pet' ? 'petted' : msg.what === 'play' ? 'played with' : 'cheered on'} your ${name}!`, '#ffc2d4');
}

// ---------- The crop bed ----------
// How grown the bed is (0 just picked, 1 ripe).
export const cropGrowth = (g, now = Date.now() / 1000) => Math.max(0, Math.min(1, (now - (g?.cropAt ?? 0)) / CROP_GROW));
// Up at the bed: when it's ripe, you pick its crops.
export function harvestCrops(world) {
  const g = world.gardenLife?.owner?.garden;
  if (!g || world.gardenVisit || world.map.indoor || Math.abs(world.body.x - CROP_X) > 44) return false;
  const now = Date.now() / 1000;
  if (cropGrowth(g, now) < 1) {
    const mins = Math.ceil((CROP_GROW - (now - g.cropAt)) / 60);
    world.log(`The crops are still growing. Ripe in about ${mins} minute${mins === 1 ? '' : 's'}.`, '#cfe8ff');
    return true;
  }
  for (const [id, n] of Object.entries(CROP_YIELD)) addItem(world.char.inventory, id, n);
  g.cropAt = now;
  world.log('You pick the crop bed: 3 Mochi Rice, 2 Red Beans, 2 Kinako and a Fire Pepper!', '#d6f5b0');
  return true;
}

// Up beside an egg rocks it, and it hatches (the egg's genes are rolled from its seed). Returns
// true if there was an egg to rock.
export function rockEgg(world) {
  const life = world.gardenLife;
  const g = life?.owner?.garden;
  if (!g || world.gardenVisit || life.hatching || world.map.indoor) return false;
  // (The egg nearest you, if you're beside one.)
  let i = -1;
  (g.eggs ?? []).forEach((egg, k) => {
    const d = Math.abs((EGG_SLOTS[k] ?? 1e9) - world.body.x);
    if (d < 28 && (i < 0 || d < Math.abs(EGG_SLOTS[i] - world.body.x))) i = k;
  });
  if (i < 0) return false;
  if ((g.mochi?.length ?? 0) >= GARDEN_MAX) {
    world.log(`Your garden is full (${GARDEN_MAX} Mochi). Say goodbye to one before this egg can hatch.`, '#ffb3c6');
    return true;
  }
  const egg = g.eggs[i];
  const genes = { ...rollMochi(egg.seed), stage: 'egg' };
  life.hatching = { egg, x: EGG_SLOTS[i], m: { genes, dir: world.body.x < EGG_SLOTS[i] ? 1 : -1, speed: 0, dist: 0, size: 'baby', eggScale: 1, hatch: { t0: null } } };
  world.log('You rock the egg gently... it wobbles back!', '#ffc2d4');
  return true;
}
// When the hatching's done, the Mochiko is yours and joins the garden.
export function finishHatch(world) {
  const life = world.gardenLife;
  const h = life?.hatching;
  if (!h || !h.m.hatched) return;
  const g = life.owner.garden;
  g.eggs = g.eggs.filter((e) => e !== h.egg);
  const rec = newRecord(rollMochi(h.egg.seed));
  g.mochi.push(rec);
  // (It carries on from where it landed, with the same animation.)
  h.m.genes = rec;
  h.m.noIdle = false;
  life.mochi.push({ rec, m: h.m, x: h.x + h.m.dir * 14 });
  life.hatching = null;
  world.log(`It hatched! A ${rec.personality} little Mochiko. It loves ${rec.loves}.`, '#ffc2d4');
}
