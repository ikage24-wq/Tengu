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
// crop bed in the square's vegetable patch grows the kitchen's crops: ripe every CROP_GROW seconds.
// Eggs (docs/design/mochi.md step 6): the egg stall in the Mochi Market has three of its own a day for
// EGG_PRICE gold (read them: the rare ones glint); eggs from monsters, quests and the Race Stadium
// come in your bag and are set down by the gate when you arrive (a Star Egg's is the rarest of a few
// rolls). Up to EGG_SLOTS.length wait by the gate.
// Breeding (step 9; data/mochi-breed.js): two blooming Mochi (a Heart Mochi each) go and find each
// other, nuzzle and dance, and leave an egg by the gate holding the baby they've bred
// (`{ seed, genes }`; it hatches as exactly that one); then they rest a while before blooming again.
//   world.gardenLife.pairing = { a, b, met } (the two on their way to each other)
// Personality in play (step 12): now and then a Mochi seeks out a neighbour for a moment that fits
// who it is (MOMENT_OF): the playful play tag, the shy hide behind a friend and peek out, the bossy
// lead a little parade, the sleepy nap side by side, the grumpy huff and turn away, and the rest
// meet up for a chat (a wave, a clap); a grumpy or loner neighbour may snub them instead. When, who
// and what come from the game's clock (where the clock has them all), so a visitor sees the same.
//   world.gardenLife.moment = { kind, a (who started it), b, t0, mx (where they meet), done: Set }
// A friend visiting (net/visit.js: world.gardenVisit is whose garden it is) sees the same Mochi in
// the same places; they can pet, play with and cheer on your Mochi and feed them sweets of their
// own, and their game sends it to yours (applyGardenGift), where it happens to your real Mochi.
//
//   world.gardenLife = { owner, mochi: [{ rec, m, x, y }], hatching: { egg, m, x } | null, greeted,
//     caring (the entry whose care panel is open) }

import { stallWear } from '../data/mochi-wardrobe.js';
import { noteAlbum, ALBUM_PAGES } from '../data/mochi-album.js';
import { spawnDrops } from './drops.js';
import { rollMochi, STAGES, seededRandom } from '../data/mochi-genes.js';
import { newRecord, CANT_POINTS as CANT, tick as tickRec, care as careRec, feed as feedRec, canEvolve, evolve as evolveRec, canRebirth, rebirth as rebirthRec, SWEET_BY_ID, styleOf, BLOOM } from '../data/mochi-raise.js';
import { sendGardenGift, gardenFriends, sendBreed } from '../net/visit.js';
import { othersHere } from '../net/online.js';
import { companionOf } from './mochi.js';
import { addItem, countItem, removeItem } from '../core/inventory.js';
import { calledOf } from '../data/mochi-names.js';
import { breedGenes } from '../data/mochi-breed.js';
import { voiceAction, mochiVoice } from './mochi-voice.js';
import { nightOf } from './daytime.js';
import { groundAt, footingAt } from './physics.js';
import { choose, drainNeeds, satisfy, needsOf, mainNeed } from './mochi-brain.js';

// Where things are in the garden (world/garden.js).
// (A row of them on the ground just inside the gate, where the square's lantern lights them:
// clear of the shop's counter and of every stall, so rocking an egg never eats a press meant for
// the keeper or a stall.)
// Three along the front and two set back between them. They used to run from 100 to 204 at an even twenty-six apart, which put the first one under the
// gate's arch and the last against the shop, and made the five of them read as a row of bins on
// open lawn. They are pulled in clear of both now, and the two at the back sit far enough up the
// grass to be read as behind rather than as part of the line. No two gaps are the same and no
// two sit at quite the same depth, so the five of them never line up into a rank. (A bed of straw
// under them was tried and taken out again: at this size a low heap the width of the clutch reads
// as a plank lying in the grass, whatever it is painted like.)
export const EGG_SLOTS = [110, 145, 183, 130, 165];
// How far back from the front row an egg sits (render/garden.js lifts and shrinks the back ones,
// and draws them first so the front row laps over them).
export const EGG_BACK = [0, 0.14, 0.05, 1, 0.72];
// What an egg at the egg stall costs (the stall stands in the Mochi Market: `map.eggStall`).
export const EGG_PRICE = 3000;
const LAND = [236, 2080];
const POND = [2230, 2530];
const NURSERY_DOOR = 990;
// The nursery's basket beds (render/garden.js mg_nurseryroom), two Mochi to a bed, curled up side by
// side; one on its own sleeps in the middle.
export const NURSERY_BEDS = [384, 472, 560, 648];
const BED_SIDE = 12;
const HOUR = 60;
// How many Mochi a garden has room for (two to each bed in the nursery).
export const GARDEN_MAX = NURSERY_BEDS.length * 2;
// Where Mochi `i` of `n` sleeps: the beds filled one each first, then a second in each.
export function bedSpot(i, n) {
  const beds = NURSERY_BEDS.length;
  const bed = i % beds;
  const shared = n > beds + bed;
  return NURSERY_BEDS[bed] + (shared ? (i < beds ? -BED_SIDE : BED_SIDE) : 0);
}
// How quickly a Mochi gets going and slows to a stop (px/s each second), by its top speed.
const accelOf = (v) => Math.max(90, v * 3);
// What a visitor can do with your Mochi (besides feeding it).
export const VISITOR_CARE = ['pet', 'play', 'cheer'];
// Its styles' speeds (render/mochi-anim.js GAITS, SWIMS), by points.
const GAIT_SPEED = [34, 60, 80, 104, 136, 168];
const SWIM_SPEED = [26, 44, 64, 88, 112, 140];
// The crop bed (world/garden.js mg_cropbed): ripe again this long after you pick it, and what it gives.
// (In the vegetable patch in the square, by the bean frame, since 2026-11-15.)
export const CROP_X = 440;
// The toy box in the orchard (world/garden.js mg_toybox): now and then a Mochi wanders over to it and
// plays with the ball a while. Its turn comes at the same time for a visitor (by the hour and its seed).
export const TOY_X = 1582;
const TOY = { chance: 0.22, at: [4, 24], stay: 32 };
function toyTime(rec, now) {
  const b = Math.floor(now / HOUR);
  if (hash(rec.seed * 0.53 + b * 2.17) > TOY.chance) return false;
  const start = b * HOUR + TOY.at[0] + hash(rec.seed * 0.29 + b) * (TOY.at[1] - TOY.at[0]);
  return now >= start && now < start + TOY.stay;
}
// The places round the garden a Mochi goes to use, now and then (the player's call, 2026-11-14:
// "Mochi use the place"): a nap in the big tree's shade, hopping up after the fruit on a fruit
// tree, lying on the pond's bank kicking its feet (a swimmer), and after dark a night owl sitting
// under the orchard lantern gazing up at the moon. Like the toy box, its turn comes by the hour and
// its seed, so a visitor sees it at the same place at the same time. [where, how far either side,
// what it does there (render/mochi-anim.js ACTIONS), for how long, who goes, day or night]

// ---------- Their own minds (world/mochi-brain.js) ----------
// What each of the garden's places and play things does for a Mochi: the kind of thing it is (for
// its personality's leanings), the needs it meets and how much, and the stat that makes it keener.
const ACT_NEEDS = {
  nap: ['rest', { energy: 50 }], reach: ['snack', { hunger: 55, fun: 5 }], paddle: ['play', { fun: 30 }, 'swim'],
  meditate: ['rest', { energy: 20, curious: 10 }], roll: ['play', { fun: 35, curious: 5 }],
  water: ['chore', { curious: 20, fun: 15 }], crank: ['chore', { curious: 20, fun: 15 }], sniff: ['explore', { curious: 30 }],
  peek: ['explore', { curious: 35 }], swing: ['ride', { fun: 50 }, 'run'], slide: ['ride', { fun: 50 }, 'run'],
  bounce: ['ride', { fun: 50 }, 'power'], glide: ['ride', { fun: 45, curious: 35 }, 'fly'],
};
// Everything Mochi `e` could do right now.
function brainOptions(world, life, e) {
  const rec = e.rec;
  const walker = pts(rec, 'run') >= CANT.run;
  const out = [];
  if (walker) {
    PLACES.forEach((pl, k) => {
      if (pl.when !== 'day' || !pl.who(rec)) return;
      if (pl.mail && !(life.owner?.garden?.mail ?? []).length) return;
      // (One at a time on each play thing, and only one heading for it.)
      if (pl.ride && life.mochi.some((o) => o !== e && (o.ride?.kind === pl.act || o.brain?.plan?.id === `p${k}`))) return;
      const [kind, gains, stat] = ACT_NEEDS[pl.act] ?? ['explore', { curious: 15 }];
      out.push({ id: `p${k}`, kind, x: pl.x + (hash(rec.seed * 0.9 + k) - 0.5) * 2 * pl.spread, act: pl.act, ride: pl.ride, hold: pl.hold, face: pl.face, gains, stat, stay: 4 });
    });
    out.push({ id: 'toy', kind: 'play', x: TOY_X + (hash(rec.seed) < 0.5 ? -14 : 14), act: 'play', face: TOY_X, gains: { fun: 40 }, stat: 'run', stay: 3 });
  }
  if (pts(rec, 'swim') >= CANT.swim) out.push({ id: 'swim', kind: 'play', x: POND[0] + 40 + hash(rec.seed * 3.3 + (e.brain?.tick ?? 0)) * (POND[1] - POND[0] - 80), gains: { fun: 45, curious: 20 }, stat: 'swim', boost: 1.3, stay: 10 });
  // (A wander somewhere new, a little rest where it is.)
  const span = walker ? LAND[1] - LAND[0] : 420;
  const from = walker ? LAND[0] : Math.max(LAND[0], (e.x ?? LAND[0]) - 210);
  out.push({ id: 'wander', kind: 'explore', x: clearOfProps(from + hash(rec.seed * 1.9 + (e.brain?.tick ?? 0) * 0.77) * span), gains: { curious: 15 }, stay: 4 });
  out.push({ id: 'rest', kind: 'rest', x: e.x, gains: { energy: 25 }, stay: 8 });
  // (A roll about in the grass close by: fun anyone can have, even one too little to walk.)
  out.push({ id: 'tumble', kind: 'play', x: clearOfProps(Math.max(LAND[0], (e.x ?? LAND[0]) + (hash(rec.seed * 2.3 + (e.brain?.tick ?? 0)) - 0.5) * 120)), act: 'roll', gains: { fun: 30 }, boost: walker ? 0.45 : 1, stay: 3 });
  // (Company: the nearest of the others out in the garden, and you, the closer it is to you the keener.)
  const pal = life.mochi.filter((o) => o !== e && !o.hidden && o.x != null && !o.ride && !o.guest).sort((a, b) => Math.abs(a.x - e.x) - Math.abs(b.x - e.x))[0];
  if (pal) out.push({ id: 'friend', kind: 'social', x: pal.x, follow: pal, act: 'cheer', gains: { social: 45, fun: 10 }, stay: 3 });
  if (world.map.garden && !world.map.indoor && !world.gardenVisit) out.push({ id: 'you', kind: 'social', x: world.body.x, follow: 'you', act: 'wave', gains: { social: 40 }, boost: 0.4 + Math.min(1, (rec.bond ?? 0) / 600), stay: 3 });
  return out;
}
// Where Mochi `e`'s own mind has it going by day, choosing something new once it's done the last.
function brainTarget(world, life, e) {
  const rec = e.rec;
  const m = e.m;
  const br = (e.brain ??= { plan: null, memory: [], tick: 0 });
  const t = world.now;
  let p = br.plan;
  // (Going over to someone: wherever they've got to.)
  if (p?.follow && !p.arrived) {
    const f = p.follow === 'you' ? world.body : p.follow;
    if (!f || (f !== world.body && (f.hidden || f.x == null))) p = br.plan = null;
    else p.x = f.x + (e.x < f.x ? -1 : 1) * (p.follow === 'you' ? 24 : 14);
  }
  // Arrived: what it came for, and a while at it.
  if (p && !p.arrived && Math.abs(e.x - p.x) < (p.follow ? 8 : 3)) {
    p.arrived = true;
    if (p.face != null) m.dir = Math.sign(p.face - e.x) || m.dir;
    else if (p.follow) m.dir = Math.sign((p.follow === 'you' ? world.body.x : p.follow.x) - e.x) || m.dir;
    if (p.ride && !startRide(world, e, p.act)) p = br.plan = null;
    else {
      if (p.act && !p.ride) m.action = { name: p.act, t0: null, ...(p.hold ? { hold: p.hold } : {}) };
      satisfy(rec, p.gains);
      p.until = t + p.stay;
    }
  }
  // Done (or it's been too long getting there): what next?
  // (A move only plays out while it's drawn, so it isn't waited on for ever - say while you're
  // indoors: a few seconds after it should have finished, it's let go.)
  const over = p?.arrived && !e.ride && t >= p.until && (!m.action || t >= p.until + 8);
  if (over && m.action) m.action = null;
  if (!p || (!p.arrived && t - p.at > 40) || over) {
    const best = choose(rec, brainOptions(world, life, e), e.x, br.memory, br.tick++);
    br.plan = best ? { ...best, at: t, arrived: false } : null;
    if (best) {
      br.memory.push(best.id);
      if (br.memory.length > 5) br.memory.shift();
      // (A thought bubble says what it's off to do, by what it needs: render/garden.js.)
      if (best.id !== 'rest' || needsOf(rec).energy < 40) e.thought = { need: mainNeed(best.gains), t0: t };
    }
  }
  return br.plan ? br.plan.x : e.x;
}

// ---------- Rides: the swing, the slide, the bouncy mushroom, and a glide off the cliff ----------
// The play things in the meadow (world/garden.js) and what a Mochi does on each. Each ride is a path
// through time (ridePath): where the Mochi is, which way it faces, how it moves (walking, climbing,
// flying), and for the swing the angle of the ropes, for the mushroom how far its cap is pressed
// down. While one rides, the clock's plans for it wait; it ends on the grass, cheering.
export const PLAY = { swing: 1660, slide: 1830, mush: 1965, glide: 2050 };
const SWING_ROPE = 96;
const easeIO = (u) => u * u * (3 - 2 * u);
const hop = (a, b, u, h) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u - Math.sin(Math.PI * u) * h];
// (How long each lasts, and the act it plays through it: render/mochi-anim.js.)
const RIDES = { swing: { act: 'swing', hold: 7 }, bounce: { act: 'bounce', hold: 4.2 }, slide: {}, glide: {} };
export function ridePath(map, kind, t) {
  const g = (x) => groundAt(map, x);
  if (kind === 'swing') {
    // Up onto the seat, three swings (pumped higher, then let die down), and a hop off.
    const px = PLAY.swing + 80;
    const py = g(PLAY.swing) - 126;
    const seat = (th) => [px + SWING_ROPE * Math.sin(th), py + SWING_ROPE * Math.cos(th) + 5];
    if (t < 0.6) {
      const [x, y] = hop([px - 20, g(px - 20)], seat(0), easeIO(t / 0.6), 14);
      return { x, y, dir: 1, swing: 0 };
    }
    const sw = t - 0.6;
    if (sw < 5.4) {
      const amp = 0.42 * Math.min(1, sw / 1.6) * Math.min(1, (5.4 - sw) / 1.4);
      const th = amp * Math.sin((2 * Math.PI * sw) / 1.8);
      const [x, y] = seat(th);
      return { x, y, dir: 1, swing: th };
    }
    const u = Math.min(1, (sw - 5.4) / 0.8);
    const [x, y] = hop(seat(0), [px + 26, g(px + 26)], easeIO(u), 12);
    return { x, y, dir: 1, swing: 0, done: u >= 1 };
  }
  if (kind === 'slide') {
    // Up the ladder, along onto the top and sat down, whoosh down the chute, and a hop off its end.
    const sx = PLAY.slide;
    const gy = g(sx);
    const lx = sx - 37;
    if (t < 1.4) return { x: lx, y: g(lx) + (gy - 50 - g(lx)) * easeIO(t / 1.4), dir: 1, mode: 'climb', moving: true };
    if (t < 2) return { x: lx + 13 * easeIO((t - 1.4) / 0.6), y: gy - 50, dir: 1 };
    if (t < 2.8) {
      const u = ((t - 2) / 0.8) ** 2;
      return { x: sx - 24 + 66 * u, y: gy - 43 + 41 * u, dir: 1 };
    }
    const u = Math.min(1, (t - 2.8) / 0.5);
    const [x, y] = hop([sx + 42, gy - 2], [sx + 56, g(sx + 56)], easeIO(u), 8);
    return { x, y, dir: 1, done: u >= 1 };
  }
  if (kind === 'bounce') {
    // Up onto the cap, four big bounces (it presses the cap down each time it lands), and off.
    const mx = PLAY.mush;
    const top = g(mx) - 36;
    if (t < 0.6) {
      const [x, y] = hop([mx - 30, g(mx - 30)], [mx, top], easeIO(t / 0.6), 16);
      return { x, y, dir: 1, dip: 0 };
    }
    const b = t - 0.6;
    if (b < 3.2) {
      const f = (b % 0.8) / 0.8;
      return { x: mx, y: top - 16 * Math.sin(Math.PI * f), dir: 1, dip: Math.max(0, 1 - Math.min(f, 1 - f) / 0.14) };
    }
    const u = Math.min(1, (b - 3.2) / 0.6);
    const [x, y] = hop([mx, top], [mx + 32, g(mx + 32)], easeIO(u), 14);
    return { x, y, dir: 1, dip: 0, done: u >= 1 };
  }
  // The glide (a flyer): up and away over the pond to the launch board on the cliff top, a flap of
  // its arms up there, then a long glide back down over the water to the meadow.
  const x0 = PLAY.glide;
  const [lx, ly] = [2730, 380];
  const land = 2096;
  if (t < 7) {
    const u = easeIO(t / 7);
    return { x: x0 + (lx - x0) * u, y: g(x0) + (ly - g(x0)) * u - Math.sin(Math.PI * u) * 40, dir: 1, mode: 'fly', moving: true };
  }
  if (t < 8.6) return { x: lx, y: ly, dir: -1 };
  const u = Math.min(1, (t - 8.6) / 6.4);
  return { x: lx + (land - lx) * u, y: ly + (g(land) - ly) * u ** 1.4, dir: -1, mode: u >= 1 ? 'run' : 'fly', moving: u < 1, glide: 0.3, done: u >= 1 };
}
// Starts Mochi `e` on ride `kind` (if nobody else is on that one).
export function startRide(world, e, kind) {
  const life = world.gardenLife;
  if (life?.mochi.some((o) => o !== e && o.ride?.kind === kind)) return false;
  e.ride = { kind, t0: world.now };
  const r = RIDES[kind];
  e.m.action = r?.act ? { name: r.act, t0: world.now, hold: r.hold } : null;
  return true;
}
// One step of a ride: true while it is still going.
function rideStep(world, e, map) {
  const r = e.ride;
  const m = e.m;
  const t = world.now - r.t0;
  const p = ridePath(map, r.kind, t);
  const moved = Math.hypot(p.x - (e.x ?? p.x), p.y - (e.y ?? p.y));
  e.x = p.x;
  e.y = p.y;
  e.baseY = null;
  e.yOff = 0;
  e.vx = 0;
  m.dir = p.dir ?? m.dir;
  m.mode = p.mode ?? 'run';
  m.dist += moved;
  m.speed = p.moving ? (m.mode === 'fly' ? 100 : 30) : 0;
  // (The rider hangs from the ropes: tipped back as the seat swings forward, and forward as it
  // swings back. A glider tips into its glide.)
  m.hillLean = p.swing != null ? -p.swing : 0;
  m.glideLean = p.glide ?? 0;
  if (r.kind === 'swing') map.swingAngle = p.done ? null : -(p.swing ?? 0);
  if (r.kind === 'bounce') map.mushDip = p.dip ?? 0;
  if (r.kind === 'slide' && t >= 1.4 && !r.sat) {
    r.sat = true;
    m.action = { name: 'slide', t0: world.now };
  }
  if (r.kind === 'glide' && t >= 7 && !r.perched) {
    r.perched = true;
    m.action = { name: 'flaps', t0: world.now };
  }
  if (p.done) {
    e.ride = null;
    m.hillLean = 0;
    m.glideLean = 0;
    if (r.kind === 'swing') map.swingAngle = null;
    if (r.kind === 'bounce') map.mushDip = 0;
    m.action = { name: 'cheer', t0: null };
    return false;
  }
  return true;
}
// Where the Mochi stop to idle: never inside one of the square's or the meadow's things, so none
// is ever seen standing in the well or half inside the slide. (Places and rides are their own.)
const PROPS = [[214, 238], [384, 568], [636, 726], [764, 818], [1124, 1216], [1560, 1604], [1784, 1884], [1932, 2000]];
function clearOfProps(x) {
  for (const [a, b] of PROPS) if (x > a && x < b) return x - a < b - x ? a - 6 : b + 6;
  return x;
}
const PLACES = [
  { x: 1660, spread: 16, act: 'nap', hold: 7, who: () => true, when: 'day' },
  { x: 1537, spread: 10, act: 'reach', who: () => true, when: 'day' },
  { x: 2074, spread: 10, act: 'reach', who: () => true, when: 'day' },
  { x: 2090, spread: 6, act: 'paddle', who: (rec) => pts(rec, 'swim') >= CANT.swim, when: 'day' },
  { x: 1608, spread: 12, act: 'meditate', who: () => true, when: 'night' },
  // The flower beds in the square: a roll about in one, a nap among the other.
  { x: 680, spread: 12, act: 'roll', who: () => true, when: 'day' },
  { x: 1170, spread: 12, act: 'nap', hold: 7, who: () => true, when: 'day' },
  // Garden chores in the square, so it is lived in: watering the vegetable patch, winding up the
  // well's bucket, a good sniff of each flower bed (`face`: what it turns to once there).
  { x: CROP_X - 62, spread: 0, act: 'water', face: CROP_X, who: () => true, when: 'day' },
  { x: 828, spread: 0, act: 'crank', hold: 5.2, face: 790, who: () => true, when: 'day' },
  { x: 628, spread: 0, act: 'sniff', face: 680, who: () => true, when: 'day' },
  { x: 1228, spread: 0, act: 'sniff', face: 1170, who: () => true, when: 'day' },
  // (While there's post in the mailbox, a peek inside: `mail`.)
  { x: 244, spread: 0, act: 'peek', face: 226, mail: true, who: () => true, when: 'day' },
  // The play things in the meadow, and for a flyer a glide off the cliff (rides: startRide).
  { x: PLAY.swing + 60, spread: 0, act: 'swing', ride: true, who: () => true, when: 'day' },
  { x: PLAY.slide - 37, spread: 0, act: 'slide', ride: true, who: () => true, when: 'day' },
  { x: PLAY.mush - 30, spread: 0, act: 'bounce', ride: true, who: () => true, when: 'day' },
  { x: PLAY.glide, spread: 0, act: 'glide', ride: true, who: (rec) => pts(rec, 'fly') >= CANT.fly, when: 'day' },
];
// (Long enough to walk over from wherever the hour had it, and to use the place a while.)
// (Nearly half their hours: the garden is busy with them.)
const PLACE = { chance: 0.45, at: [6, 26], stay: 30, reach: 340 };
// The place Mochi `rec` is at (or on its way to) now, or null. (Never the hour it's at the toy box.)
export function placeTime(rec, now, night) {
  const b = Math.floor(now / HOUR);
  // (Not in an hour it has a turn at the toy box: toyTime.)
  if (hash(rec.seed * 0.71 + b * 1.37) > PLACE.chance || hash(rec.seed * 0.53 + b * 2.17) <= TOY.chance) return null;
  const open = PLACES.filter((pl) => pl.when === (night ? 'night' : 'day') && pl.who(rec));
  if (!open.length) return null;
  const pl = open[Math.floor(hash(rec.seed * 0.17 + b * 3.1) * open.length)];
  const start = b * HOUR + PLACE.at[0] + hash(rec.seed * 0.43 + b) * (PLACE.at[1] - PLACE.at[0]);
  return now >= start && now < start + PLACE.stay ? pl : null;
}
export const CROP_GROW = 15 * 60;
const CROP_YIELD = { mochi_rice: 3, azuki: 2, kinako: 2, fire_pepper: 1 };
const tierOf = (rec, stat) => styleOf(rec.stats?.[stat]?.points ?? 0);
const pts = (rec, stat) => rec.stats?.[stat]?.points ?? 0;

const hash = (n) => {
  const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
};
const runPts = (rec) => rec.stats?.run?.points ?? 0;
const swimPts = (rec) => rec.stats?.swim?.points ?? 0;
// How fast it strolls about the garden (px/s): a gentle fraction of its running style; a Mochiko
// who can't walk yet crawls along slowly.
function strollSpeed(rec) {
  const p = runPts(rec);
  if (p < CANT.run) return 4.5;
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
  if (owner === world.char && g) setEggsDown(world);
  world.gardenLife = {
    owner,
    mochi: (g?.mochi ?? []).map((rec) => ({ rec, m: newAnim(rec), x: null })),
    hatching: null,
    greeted: false,
    caring: null,
    // Eggs on their way from the stall to the nest ({ from, t0 } by egg), and things being paid
    // for and handed over (handOver).
    arrivals: new Map(),
    handoffs: [],
  };
  // Visiting a friend with your Mochi out with you: it comes along, and follows you round theirs.
  const pet = owner !== world.char ? companionOf(world.char) : null;
  if (pet && world.char.pet?.out) world.gardenLife.mochi.push({ rec: pet, m: newAnim(pet), x: null, guest: 'me' });
  // (And friends already here with theirs: net/visit.js gardenGuests.)
  for (const [id, rec] of Object.entries(world.gardenGuests ?? {})) if (owner === world.char) world.gardenLife.mochi.push({ rec, m: newAnim(rec), x: null, guest: id });
}
// A friend's Mochi arriving in your garden with them (their game sent it: net/visit.js), or leaving.
export function guestArrives(world, id, rec) {
  (world.gardenGuests ??= {})[id] = rec;
  const life = world.gardenLife;
  if (life && life.owner === world.char && !life.mochi.some((e) => e.guest === id)) life.mochi.push({ rec, m: newAnim(rec), x: null, guest: id });
}
export function guestLeaves(world, id) {
  if (world.gardenGuests) delete world.gardenGuests[id];
  const life = world.gardenLife;
  if (!life) return;
  const e = life.mochi.find((x) => x.guest === id);
  if (e) life.mochi.splice(life.mochi.indexOf(e), 1);
  if (life.pairing && (life.pairing.a === e || life.pairing.b === e)) life.pairing = null;
}
// Where a visiting Mochi heads: at its person's heels (you, or the friend whose it is), or null if
// they've gone.
function guestTarget(world, e, i) {
  if (e.guest === 'me') return world.body.x - (world.body.facing ?? 1) * (20 + (i % 2) * 6);
  const g = othersHere(world).find((x) => x.id === e.guest);
  return g ? g.body.x - (g.body.facing ?? 1) * 20 : null;
}
const newAnim = (rec) => ({ genes: rec, dir: 1, speed: 0, dist: 0, easy: true, size: rec.stage === 'mochiko' || rec.stage === 'egg' ? 'baby' : 'grown' });

// Each frame: every Mochi heads for where the clock has it (or to you, greeting), stepping along
// the ground or swimming; at night they're inside, asleep.
export function tickGarden(world, dt) {
  const life = world.gardenLife;
  if (!life) return;
  // (A happy little cheer for what you just bought, once it's in your arms: handOver.)
  if (life.cheerAt != null && world.now >= life.cheerAt) {
    life.cheerAt = null;
    const b = world.body;
    if (b.onGround && !world.pose && !(world.attackTimer > 0) && !world.dead) {
      world.pose = { kind: 'emcheer', t: 1.2, dur: 1.2, since: world.now };
      world.emote = { face: 'excited', t: 2 };
    }
  }
  // (In the Mochi Market there is nothing else of the garden's to look after.)
  if (life.market) return;
  if (!world.gardenVisit && world.char.garden) stallClothes(world.char);
  // (Your own Mochi fill in the album, data/mochi-album.js, a few times a second.)
  life.albumIn = (life.albumIn ?? 0) - dt;
  if (!world.gardenVisit && life.albumIn <= 0) {
    life.albumIn = 0.5;
    for (const e of life.mochi) {
      const added = noteAlbum(world.char, e.rec);
      if (added.length) world.log(`Mochi album: ${added.map((p) => ALBUM_PAGES[p].name).join(', ')} filled in by ${e.rec.name ?? 'your Mochi'}!`, '#ffd6e4');
    }
  }
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
  // Night owls: up to two stay out after dark (the night-loving kinds, and anyone just hatched), so
  // the Garden is never empty at night; the rest go to bed in the nursery.
  const owls = night ? new Set(life.mochi.filter((e) => nightOwl(e.rec)).slice(0, 2)) : new Set();
  life.mochi.forEach((e, i) => {
    const { rec } = e;
    // (The garden's time passes for them while you're here; a visiting Mochi's, in its own garden.)
    if (owner && !e.guest) tickRec(rec, dt);
    // (Ready for the moon: told once, so you know it'll be a Tsukimochi when it grows up.)
    if (owner && !e.guest && rec.moonReady && !rec.moonTold) {
      rec.moonTold = true;
      world.log(`${calledOf(rec, 'Your Mochi')} glows softly, like the moon... it'll be a Tsukimochi when it grows up!`, '#fff3c4');
    }
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
        if (owner) world.log(`${rec.name ?? 'It'} hatched again: a little Mochiko, generation ${rec.gen}!`, '#ffc2d4');
      } else return;
    }
    const m = e.m;
    m.genes = rec;
    m.size = rec.stage === 'mochiko' ? 'baby' : 'grown';
    if (owner && !e.guest && !inside && !night && e.x != null && rec.stage === 'mochiko' && canEvolve(rec)) {
      const before = { ...rec, stage: 'mochiko', path: null };
      const out = evolveRec(rec);
      e.dir = m.dir;
      e.m = { genes: before, dir: m.dir, speed: 0, dist: 0, size: 'baby', evolve: { t0: null, path: out.path, moon: out.stage === 'tsukimochi' } };
      e.scene = 'evolve';
      if (life.caring === e) life.caring = null;
      const who = rec.name ?? 'Your Mochiko';
      world.log(out.stage === 'tsukimochi' ? `${who} is glowing... a Tsukimochi! It will live forever.` : `${who} is glowing... evolving into ${STAGES[out.stage] ?? out.stage}!`, '#ffc2d4');
      return;
    }
    // The end of a long, happy life: back to its egg, to start again (stronger for it).
    if (owner && !e.guest && !inside && !night && e.x != null && canRebirth(rec)) {
      const out = rebirthRec(rec);
      const list = life.owner.garden.mochi;
      list[list.indexOf(rec)] = out.egg;
      e.rec = out.egg;
      e.m = { genes: rec, dir: m.dir, speed: 0, dist: 0, size: 'grown', rebirth: { t0: null }, egg: out.egg };
      e.scene = 'rebirth';
      if (life.caring === e) life.caring = null;
      world.log(`${rec.name ?? `Your ${STAGES[rec.stage]}`} has lived a long, happy life... it waves, and goes back to its egg to start again!${out.raised.length ? ' It will be stronger for it.' : ''}`, '#ffc2d4');
      return;
    }
    // (A visiting Mochi is out as long as its person is: never off to bed in someone else's nursery.)
    const owl = owls.has(e) || Boolean(e.guest);
    if (inside) {
      // The nursery: asleep in the beds at night (the night owls are out); by day, nobody's in.
      e.hidden = !night || owl;
      e.x = bedSpot(i, life.mochi.length);
      e.y = groundAt(map, e.x);
      e.vx = 0;
      if (night && !m.action) m.action = { name: 'nap', t0: null, hold: 1e9 };
      // (A night's sleep puts its energy back.)
      if (night && !e.guest) satisfy(rec, { energy: dt * 1.5 });
      return;
    }
    if (night && !owl) {
      // Bedtime: off to the nursery door, and in.
      e.hidden = e.x != null && Math.abs(e.x - NURSERY_DOOR) < 4;
    } else e.hidden = false;
    // (On a ride - the swing, the slide, the mushroom, a glide - the ride has it until it's done.)
    if (e.ride && !e.guest && rideStep(world, e, map)) return;
    const sched = night && !owl ? { x: NURSERY_DOOR, moving: true } : scheduledAt(rec, now + i * 3.7);
    let target = night && !owl ? sched.x : clearOfProps(sched.x);
    if (e.guest) {
      const gx = guestTarget(world, e, i);
      if (gx == null) {
        gone.push(e);
        return;
      }
      if (e.x == null) e.x = gx;
      target = gx;
    }
    // By day, its own mind has it (world/mochi-brain.js): what it needs and what it's like decide
    // what it does next. (At night they go to bed; a visiting Mochi follows its person.)
    const minded = !night && !e.guest && e.x != null && !e.scene;
    if (minded) {
      drainNeeds(rec, dt, Math.abs(e.vx ?? 0) > 2);
      target = brainTarget(world, life, e);
    }
    if (e.greet && now < e.greet.until) target = world.body.x + (e.x != null && e.x < world.body.x ? -26 - i * 14 : 26 + i * 14);
    else e.greet = null;
    // (Blooming and paired: off to find the other.)
    const pair = life.pairing;
    const other = pair && !pair.met ? (pair.a === e ? pair.b : pair.b === e ? pair.a : null) : null;
    if (other && other.x != null && e.x != null) target = other.x + (e.x < other.x ? -11 : 11);
    // (Its turn at the toy box: over to it, and a game with the ball once it's there.)
    const toy = !minded && !other && !night && pts(rec, 'run') >= CANT.run && toyTime(rec, now);
    if (toy) {
      target = TOY_X + (i % 2 ? 14 : -14);
      // (Arrived: a game with the ball, whatever it was last up to; once, for this turn.)
      if (e.x != null && Math.abs(e.x - target) < 3 && e.toyTurn !== Math.floor(now / HOUR)) {
        e.toyTurn = Math.floor(now / HOUR);
        m.action = { name: 'play', t0: null };
      }
    }
    // (Its turn at one of the garden's places: over to it, and once there, what that place is for.)
    // (Only one that can walk, from near enough to get there and have a while at it: decided once
    // when its turn comes, from where the clock had it, so a visitor sees the same.)
    let place = !minded && !toy && !other && (!night || owl) && pts(rec, 'run') >= CANT.run && placeTime(rec, now, night);
    if (place) {
      const hr = Math.floor(now / HOUR);
      if (e.placeOk?.hr !== hr) e.placeOk = { hr, ok: e.x != null && Math.abs(e.x - place.x) < PLACE.reach };
      if (!e.placeOk.ok || (place.mail && !(life.owner?.garden?.mail ?? []).length)) place = null;
    }
    if (place) {
      target = place.x + (hash(rec.seed * 0.9) - 0.5) * 2 * place.spread;
      if (e.x != null && Math.abs(e.x - target) < 3 && e.placeTurn !== Math.floor(now / HOUR) && !m.action) {
        e.placeTurn = Math.floor(now / HOUR);
        if (place.face != null) m.dir = Math.sign(place.face - e.x) || m.dir;
        if (place.ride) startRide(world, e, place.act);
        else m.action = { name: place.act, t0: null, ...(place.hold ? { hold: place.hold } : {}) };
      }
    }
    // (A sweet being picked up is in its paws from the grab on.)
    if (life.drops?.length) life.drops = life.drops.filter((d) => d.until == null || world.now < d.until);
    // (A sweet of yours lying on the grass: over to it, picked up and eaten where it stands. It
    // stops a short step short, on the side it came from, so it bends down over the sweet.)
    const drop = !other && !night && !e.guest && dropFor(life, e, rec);
    if (drop) {
      drop.taken = e;
      target = drop.x + (e.x != null && e.x < drop.x ? -5 : 5);
      // (It starts as soon as it is close: easing to a stop it would otherwise creep the last few
      // pixels for seconds, staring at the sweet.)
      if (e.x != null && Math.abs(e.x - drop.x) < 11) takeDrop(world, e, drop);
    }
    // (You tossed the ball from the toy box: off after it, and a game once there.)
    if (e.ballChase && life.ball && now < life.ball.until) {
      target = life.ball.x + (i % 2 ? 16 : -16) + (i % 3) * 5;
      if (e.x != null && Math.abs(e.x - target) < 3 && !e.ballPlayed) {
        e.ballPlayed = true;
        m.action = { name: 'play', t0: null };
        careRec(rec, 'play');
      }
    } else if (e.ballChase) Object.assign(e, { ballChase: false, ballPlayed: false });
    // (In a moment with a neighbour: where the moment has it.)
    const mo = life.moment;
    const inMoment = mo && !other && (mo.a === e || mo.b === e) && e.x != null;
    if (inMoment) target = momentTarget(mo, e, now);
    // (Being cared for, it stays put, looking up at you.)
    const busy = now < (e.busyUntil ?? 0);
    // (A sweet of yours on the grass beats staying put: you put one down from its care panel, which
    // holds it at your side, and it would stand there looking at you until you walked away.)
    if (busy && !drop && e.x != null) target = e.x;
    // (One who can't swim yet stops at the water's edge.)
    if (pts(rec, 'swim') < CANT.swim && target > LAND[1]) target = LAND[1];
    if (e.x == null) e.x = sched.x;
    const wet = footingAt(map, e.x).swim;
    const v0 = wet ? (pts(rec, 'swim') >= CANT.swim ? SWIM_SPEED[tierOf(rec, 'swim')] * 0.6 : 18) : strollSpeed(rec) * (e.greet ? 2 : Math.abs(target - e.x) > 40 ? 1.5 : 1);
    const v = other ? Math.max(v0, 40) : e.ballChase && !e.ballPlayed ? Math.max(v0, 52) : inMoment ? Math.max(v0, mo.kind === 'chase' ? 46 : 26) : v0;
    // It gets going and slows to a stop smoothly (never off at full speed, never a dead stop), and
    // turns round only once it's stopped.
    const dx = target - e.x;
    const A = accelOf(v);
    const want = Math.abs(dx) < 0.5 ? 0 : Math.sign(dx) * Math.min(v, Math.sqrt(2 * A * Math.abs(dx)));
    e.vx = (e.vx ?? 0) + Math.max(-A * dt, Math.min(A * dt, want - (e.vx ?? 0)));
    let step = e.vx * dt;
    if ((Math.sign(step) === Math.sign(dx) && Math.abs(step) > Math.abs(dx)) || (Math.abs(dx) < 0.5 && Math.abs(e.vx) < 4)) {
      step = dx;
      // (Caught up with a target that's itself still creeping along, a crawler's stroll: it's still
      // on the move at that pace, legs and all, not sliding along standing still.)
      e.vx = dt > 0 && Math.abs(dx) / dt > 2 ? dx / dt : 0;
    }
    e.x += step;
    if (Math.abs(e.vx) > 2) m.dir = Math.sign(e.vx);
    else if (inMoment) m.dir = momentFacing(mo, e);
    else if (e.eatAt && world.now < e.eatAt.until) m.dir = Math.sign(e.eatAt.x - e.x) || m.dir;
    else if (e.greet || busy) m.dir = Math.sign(world.body.x - e.x) || 1;
    m.dist += Math.abs(step);
    m.speed = Math.abs(e.vx) > 2 ? Math.abs(e.vx) : 0;
    // In the pond it swims, at the surface; on land it walks on the ground (or crawls, if it can't
    // yet). Where one gives way to the other it eases up or down, never popping.
    const foot = footingAt(map, e.x);
    // A flyer going a long way across the garden now and then takes off and flutters there,
    // landing as it gets close (by the hour and its seed, so a visitor sees the same).
    const far = Math.abs(target - e.x);
    if (!e.flying && !night && far > 160 && pts(rec, 'fly') >= CANT.fly && hash(rec.seed * 1.37 + Math.floor(now / HOUR) * 0.71) < 0.5) e.flying = true;
    if (e.flying && (far < 30 || night)) e.flying = false;
    m.mode = e.flying ? 'fly' : foot.swim ? 'swim' : 'run';
    m.inWater = foot.swim;
    settle(e, foot.y, dt);
    // A greeting ends in a happy wave.
    if (e.greet && Math.abs(dx) <= 0.5 && !e.waved) {
      e.waved = true;
      m.action = { name: 'cheer', t0: null, hold: 1.5 };
    }
  });
  // (Someone winding the well's crank: its bucket comes up, render/garden.js mg_well.)
  const crank = life.mochi.find((e) => e.m?.action?.name === 'crank' && e.m.action.t0 != null);
  world.map.wellPull = crank && world.now - crank.m.action.t0 > 0.4 && world.now - crank.m.action.t0 < 4 ? 1 : 0;
  // (How many are asleep in the nursery, for the sleepy z's drifting out of its window: render/garden.js.)
  world.map.sleepers = night && !inside ? life.mochi.filter((e) => e.hidden && !e.guest).length : 0;
  if (owner && !inside) tickPairing(world, life, now, night);
  // (Each new thing a Mochi does with feeling, it says: world/mochi-voice.js.)
  for (const e of life.mochi) if (!e.hidden && e.x != null) voiceAction(world, e.rec, e.m, e.x);
  if (!inside) tickMoment(world, life, now, night);
  for (const e of gone) {
    life.mochi.splice(life.mochi.indexOf(e), 1);
    if (e.guest) continue;
    const list = life.owner?.garden?.mochi;
    if (owner && list?.includes(e.rec)) list.splice(list.indexOf(e.rec), 1);
    if (life.caring === e) life.caring = null;
  }
}

// Puts Mochi `e` at height `y` (the ground or the water under it): following the ground exactly, but
// easing out any sudden jump (stepping into the pond and starting to swim, climbing out).
function settle(e, y, dt) {
  if (e.baseY != null && Math.abs(y - e.baseY) > 4) e.yOff = (e.yOff ?? 0) + e.baseY - y;
  e.baseY = y;
  e.yOff = (e.yOff ?? 0) * Math.exp(-dt * 12);
  if (Math.abs(e.yOff) < 0.2) e.yOff = 0;
  e.y = y + e.yOff;
}

// A Mochi arriving in your garden from outside it (the Game Master's /mochi, world/gm.js): onto your
// garden's list, and out into the garden at once if you're in it. False if the garden is full.
export function addGardenMochi(world, rec) {
  const g = world.char.garden;
  if (!g || g.mochi.length >= GARDEN_MAX) return false;
  g.mochi.push(rec);
  const life = world.gardenLife;
  if (life && !world.gardenVisit && life.owner?.garden === g) life.mochi.push({ rec, m: newAnim(rec), x: null });
  return true;
}

// ---------- Caring ----------
// Woken from a nap (Up on a sleeping Mochi: its care panel opens): one who loves you (bond 500+)
// stretches and smiles; anyone else is grumpy about it, a huff and a little less mood.
export function wakeUp(world, e) {
  if (e?.m?.action?.name !== 'nap') return null;
  const fond = (e.rec.bond ?? 0) >= 500;
  e.m.action = fond ? { name: 'yawn', t0: null } : { name: 'sulk', t0: null, hold: 1.4 };
  if (!fond) e.rec.mood = Math.max(0, (e.rec.mood ?? 60) - 4);
  mochiVoice(world, e.rec, fond ? 'sleepy' : 'sad', e.x);
  world.log(fond ? `${e.rec.name ?? 'Your Mochi'} wakes with a big stretch and a smile.` : `${e.rec.name ?? 'Your Mochi'} was fast asleep... and is grumpy about it.`, fond ? '#ffd6e4' : '#c8b8d8');
  return fond ? 'happy' : 'grumpy';
}

// Who stays up after dark: the night-loving personalities, and a Mochi just hatched (its first half
// hour), too excited to sleep.
const NIGHT_OWLS = ['hyper', 'sneaky', 'mischief', 'cool', 'nosy', 'curious', 'loner', 'dramatic', 'artsy'];
export const nightOwl = (rec) => rec.stage !== 'egg' && (NIGHT_OWLS.includes(rec.personality) || (rec.age ?? 0) < 1800);

// The orchard's fruit trees (world/garden.js mg_fruittree): Up beside one to give it a shake, and
// a cherry or two (once in a while three) drop for you to pick up. Each tree once every
// TREE_REST seconds of real time; shaken too soon it only rustles.
export const TREE_REST = 10 * 60;
export function shakeTree(world) {
  const map = world.map;
  if (!map.garden || map.indoor) return false;
  const tree = (map.townPieces ?? []).find(([k, x]) => k === 'mg_fruittree' && Math.abs(x - world.body.x) < 26);
  if (!tree) return false;
  const now = Date.now() / 1000;
  // (The tree sways hard for a moment: render/garden.js reads `map.shook`.)
  (map.shook ??= {})[tree[1]] = world.now;
  const shaken = ((world.char.garden ??= { mochi: [], eggs: [], unlocked: {} }).shaken ??= {});
  if (now - (shaken[tree[1]] ?? -1e9) < TREE_REST) {
    world.log('It rustles... nothing ripe yet.', '#c8d8b8');
    return true;
  }
  shaken[tree[1]] = now;
  const n = 1 + (hash(now * 0.37 + tree[1]) < 0.5 ? 1 : 0) + (hash(now * 0.71 + tree[1]) < 0.12 ? 1 : 0);
  const y = groundAt(map, tree[1]);
  world.drops.push(...spawnDrops(Array.from({ length: n }, () => ({ kind: 'item', id: 'cherry', qty: 1 })), tree[1], y - 40));
  world.log(`You shake the tree: ${n} cherr${n === 1 ? 'y drops' : 'ies drop'}!`, '#ffd6e4');
  noteDaily(world, 'shake');
  return true;
}

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
  if (out) noteDaily(world, 'care');
  return out;
}
// ---------- Sweets put down on the grass ----------
// A sweet is not handed over a counter: you put it down and one of them comes and gets it. The
// drop lies on the grass where you left it until a Mochi that can reach it walks over, picks it up
// (ACTIONS.pickup) and eats it where it stands. Drops live on the garden's life, not on the save:
// leave the garden and whatever is still lying there is gone.
const DROP_REACH = 420;
// When its paws close on the sweet, in the pick-up (render/mochi-anim.js ACTIONS.pickup): until then
// the sweet stays lying on the grass in front of it.
const PICKUP_GRAB = 2.2;
const PICKUP_DUR = 4.6;
const EAT_DUR = 5.8;
const YUM_DUR = 2;
export const groundDrops = (world) => world.gardenLife?.drops ?? [];
// Puts sweet `id` from your bag down in front of you. `forSeed` is the Mochi whose page you had
// open, which gets first refusal; anyone nearer takes it if that one can't come.
export function dropSweet(world, id, forSeed = null) {
  const sw = SWEET_BY_ID[id];
  const life = world.gardenLife;
  if (!sw || !life || countItem(world.char.inventory, id) < 1) return null;
  if ((life.drops ?? []).length >= 4) return 'There are enough sweets down already.';
  removeItem(world.char.inventory, id, 1);
  (life.drops ??= []).push({ id, x: world.body.x + (world.body.facing ?? 1) * 18, t0: Date.now() / 1000, want: forSeed, taken: null });
  world.log(`You put ${sw.name} down on the grass.`, '#ffe8b0');
  return null;
}
// The drop this Mochi should be walking toward, if any: the one meant for it, else the nearest
// going spare. One drop, one Mochi.
function dropFor(life, e, rec) {
  let best = null;
  for (const d of life.drops ?? []) {
    if (d.until != null) continue;
    if (d.taken && d.taken !== e) continue;
    if (d.want != null && d.want !== rec.seed && (life.mochi ?? []).some((o) => o.rec.seed === d.want && !o.hidden && !o.leaving)) continue;
    if (e.x != null && Math.abs(d.x - e.x) > DROP_REACH) continue;
    if (!best || (e.x != null && Math.abs(d.x - e.x) < Math.abs(best.x - e.x))) best = d;
  }
  return best;
}
// It has reached the sweet: it picks it up, and whatever it makes of it follows straight on.
function takeDrop(world, e, d) {
  const sw = SWEET_BY_ID[d.id];
  const out = feedRec(e.rec, d.id);
  const life = world.gardenLife;
  // (It stays where it lies until the paws close on it, then it's in them: drawn by the pick-up.)
  d.taken = e;
  d.until = world.now + PICKUP_GRAB;
  // (It faces the sweet while it picks it up, and turns to you once it's in its paws to eat it.)
  e.eatAt = { x: d.x, until: world.now + PICKUP_DUR };
  if (!out) {
    life.drops = (life.drops ?? []).filter((o) => o !== d);
    return;
  }
  if (!out.refused) noteDaily(world, 'feed');
  const seq = [{ name: out.action, sweet: sw.kind }];
  // (A sweet it loved: a hop of joy, and that's where it ends. A trick it learned or a level it went
  // up is told in the log, not shown off on top: after all of that, a backflip was one thing too many.)
  if (out.action === 'eat') seq.push({ name: 'yum' });
  if (out.levels > 0 && !out.learned) world.log(`${calledOf(e.rec, 'Your Mochi')} grew a little stronger!`, '#ffc2d4');
  e.m.action = { name: 'pickup', t0: null, sweet: sw.kind };
  e.m.queue = seq;
  e.busyUntil = Date.now() / 1000 + PICKUP_DUR + EAT_DUR + YUM_DUR + seq.length * 1.5;
  e.greet = null;
  if (out.refused) world.log('It sniffs the sweet, pats its round tummy and leaves it: too full!', '#ffd6a0');
  else if (out.learned) world.log(`It loved ${sw.name}... and learned a new trick!`, '#ffc2d4');
  if (sw.heart && !out.refused) {
    const name = calledOf(e.rec, 'Your');
    world.log(out.bloomed ? `Flowers bloom round ${name}! Another blooming Mochi will come and find it.` : e.rec.stage === 'mochiko' ? `${name}'s too young to bloom, but it loved the treat.` : `${name} had an egg not long ago: it isn't ready to bloom again yet.`, '#ffc2d4');
  }
}

// Feeds it sweet `id` from your bag (it won't when it's too full). (Used by a friend's gift from
// another garden; here you put the sweet down instead and it comes for it: dropSweet.)
export function feedMochi(world, e, id) {
  const sw = SWEET_BY_ID[id];
  if (!sw || e.scene || e.leaving || countItem(world.char.inventory, id) < 1) return null;
  const out = feedRec(e.rec, id);
  if (!out) return null;
  if (!out.refused) removeItem(world.char.inventory, id, 1);
  if (!out.refused && world.gardenVisit) sendGardenGift(world, e.rec.seed, 'feed', id);
  if (!out.refused) noteDaily(world, 'feed');
  react(e, out, out.action, { sweet: sw.kind });
  if (out.refused) world.log('It pats its round tummy: too full for now!', '#ffd6a0');
  else if (out.learned) world.log(`It loved trying ${sw.name}... and learned a new trick!`, '#ffc2d4');
  if (sw.heart && !out.refused) {
    const name = calledOf(e.rec, 'Your');
    world.log(out.bloomed ? `Flowers bloom round ${name}! Another blooming Mochi will come and find it.` : e.rec.stage === 'mochiko' ? `${name}'s too young to bloom, but it loved the treat.` : `${name} had an egg not long ago: it isn't ready to bloom again yet.`, '#ffc2d4');
  }
  return out;
}
// Says goodbye to it (your own garden only): it waves, and is off to a new home.
export function sayGoodbye(world, e) {
  if (world.gardenVisit || e.scene || e.leaving) return false;
  e.leaving = { t0: Date.now() / 1000 };
  e.greet = null;
  e.m.queue = [];
  e.m.action = { name: 'farewell', t0: null, hold: 0 };
  world.log(`${e.rec.name ?? `Your ${STAGES[e.rec.stage] ?? 'Mochi'}`} waves goodbye... off to a new home, where it'll be loved too.`, '#ffc2d4');
  return true;
}
// A friend visiting your garden petted or fed one of your Mochi (net/visit.js): it happens to your
// real Mochi, and if you're there you see it react. (Its bond is with you: a visitor's care cheers it
// up, but doesn't change that.)
export function applyGardenGift(world, msg, who) {
  const rec = world.char.garden?.mochi.find((r) => r.seed === msg.seed);
  if (!rec || rec.stage === 'egg') return;
  const here = !world.gardenVisit ? world.gardenLife?.mochi.find((e) => e.rec === rec && !e.scene && !e.leaving) : null;
  const name = calledOf(rec);
  const bond = rec.bond;
  if (msg.what === 'feed') {
    const sw = SWEET_BY_ID[msg.sweet];
    if (!sw) return;
    const out = feedRec(rec, sw.id);
    rec.bond = bond;
    if (here && out) react(here, out, out.action, { sweet: sw.kind });
    world.log(out?.refused ? `${who} offered ${name} a ${sw.name}, but it was too full.` : `${who} fed ${name} a ${sw.name}!`, '#ffc2d4');
    return;
  }
  if (!VISITOR_CARE.includes(msg.what)) return;
  const out = careRec(rec, msg.what);
  rec.bond = bond;
  if (here && out) react(here, out, out.action, { hold: 1.4 });
  world.log(`${who} ${msg.what === 'pet' ? 'petted' : msg.what === 'play' ? 'played with' : 'cheered on'} ${name}!`, '#ffc2d4');
}

// ---------- Personality in play ----------
// The moment each personality starts; how long each lasts.
const MOMENT_OF = {
  playful: 'chase', hyper: 'chase', cheeky: 'chase', sporty: 'chase', mischief: 'chase', sneaky: 'chase', brave: 'chase',
  shy: 'hide', timid: 'hide', clingy: 'hide',
  bossy: 'parade', proud: 'parade', showoff: 'parade', dramatic: 'parade', cool: 'parade',
  sleepy: 'nap', lazy: 'nap', dreamy: 'nap',
  grumpy: 'huff', loner: 'huff', sassy: 'huff',
};
export const momentOf = (personality) => MOMENT_OF[personality] ?? 'chat';
const SNUBS = ['grumpy', 'loner'];
const MOMENT_SECS = { chase: 6, hide: 5, parade: 7, nap: 9, huff: 4, chat: 5, snub: 4 };
// A moment can start once each window of the clock (when the clock says so), with two Mochi the
// clock has near each other.
const MOMENT_EVERY = 22;
const MOMENT_NEAR = 220;
function tickMoment(world, life, now, night) {
  const mo = life.moment;
  if (mo) {
    const gone = (e) => !life.mochi.includes(e) || e.scene || e.leaving || e.hidden;
    if (night || gone(mo.a) || gone(mo.b) || now - mo.t0 > MOMENT_SECS[mo.kind]) {
      life.moment = null;
      return;
    }
    momentBeats(mo, now);
    return;
  }
  if (night) return;
  const k = Math.floor(now / MOMENT_EVERY);
  const t0 = k * MOMENT_EVERY + 2;
  if (life.momentWindow === k || now < t0 || now > t0 + 1) return;
  life.momentWindow = k;
  if (hash(k * 0.917) > 0.6) return;
  // Who: a Mochi the clock picks; with whom: its nearest neighbour where the clock has them.
  const free = life.mochi.filter((e) => e.x != null && !e.hidden && !e.scene && !e.leaving && !e.greet && life.pairing?.a !== e && life.pairing?.b !== e && now >= (e.busyUntil ?? 0));
  if (free.length < 2) return;
  const at = (e) => scheduledAt(e.rec, t0 + life.mochi.indexOf(e) * 3.7).x;
  const a = free[Math.floor(hash(k * 1.37) * free.length) % free.length];
  const b = free.filter((e) => e !== a).sort((p, q) => Math.abs(at(p) - at(a)) - Math.abs(at(q) - at(a)))[0];
  if (!b || Math.abs(at(b) - at(a)) > MOMENT_NEAR) return;
  let kind = momentOf(a.rec.personality);
  // (A grumpy or loner neighbour isn't in the mood: it snubs them.)
  if (kind !== 'huff' && kind !== 'nap' && SNUBS.includes(b.rec.personality) && hash(k * 2.11) < 0.6) kind = 'snub';
  life.moment = { kind, a, b, t0: now, mx: Math.max(LAND[0], Math.min(LAND[1], (at(a) + at(b)) / 2)), side: hash(k * 3.3) < 0.5 ? -1 : 1, done: new Set() };
}
// Where each of the two is headed, moment by moment.
function momentTarget(mo, e, now) {
  const t = now - mo.t0;
  const lead = e === mo.a;
  const { mx, side } = mo;
  const other = lead ? mo.b : mo.a;
  switch (mo.kind) {
    // Tag: one chases, the other runs off; then the other way round.
    case 'chase': {
      const it = t < 3 ? mo.a : mo.b;
      return e === it ? other.x : mx + side * (t < 3 ? 60 : -60);
    }
    // Hiding: it tucks in behind its friend.
    case 'hide':
      return lead ? other.x - side * 12 : mx;
    // A parade: the leader marches up and back, the other in step behind.
    case 'parade': {
      if (!lead) return other.x - (other.m.dir || 1) * 15;
      return mx + (Math.floor(t / 2.2) % 2 ? -50 : 50);
    }
    // A nap side by side; a chat face to face.
    case 'nap':
    case 'chat':
      return mx + (lead ? -1 : 1) * (mo.kind === 'nap' ? 9 : 13);
    // A huff: the other comes over; it turns its back.
    case 'huff':
      return lead ? e.x : mx;
    // A snub: it comes over; the other walks off.
    case 'snub':
      return lead ? mx : mx + side * 70;
    default:
      return e.x;
  }
}
// Which way each faces once there: at each other, mostly; a huffy one away.
function momentFacing(mo, e) {
  const other = e === mo.a ? mo.b : mo.a;
  const toward = Math.sign(other.x - e.x) || 1;
  if ((mo.kind === 'huff' && e === mo.a) || (mo.kind === 'snub' && e === mo.b)) return -toward;
  return toward;
}
// What each does when: played once each (`done`).
function momentBeats(mo, now) {
  const t = now - mo.t0;
  const near = Math.abs(mo.a.x - mo.b.x) < 34;
  const once = (key, when, fn) => {
    if (t >= when && !mo.done.has(key)) {
      mo.done.add(key);
      fn();
    }
  };
  const act = (e, name, hold = 0) => {
    e.m.action = { name, t0: null, hold };
  };
  switch (mo.kind) {
    case 'chase':
      once('end', MOMENT_SECS.chase - 1.2, () => {
        act(mo.a, 'cheer', 1);
        act(mo.b, 'cheer', 1);
      });
      break;
    case 'hide':
      if (near) once('peek', 1.6, () => act(mo.a, 'peek'));
      once('end', MOMENT_SECS.hide - 1.2, () => act(mo.a, 'hops'));
      break;
    case 'parade':
      once('end', MOMENT_SECS.parade - 1.4, () => {
        act(mo.a, 'cheer', 1);
        act(mo.b, 'clap');
      });
      break;
    case 'nap':
      if (near) once('nap', 1.2, () => {
        act(mo.a, 'nap', MOMENT_SECS.nap - 3);
        act(mo.b, 'nap', MOMENT_SECS.nap - 3);
      });
      break;
    case 'huff':
      if (near) once('huff', 0.8, () => {
        act(mo.a, 'sulk', 2);
        act(mo.b, 'lookaround');
      });
      break;
    case 'chat':
      if (near) {
        once('wave', 0.6, () => {
          act(mo.a, 'wave');
          act(mo.b, 'wave');
        });
        once('clap', 2.6, () => act(mo.b, 'clap'));
        once('hops', 2.8, () => act(mo.a, 'hops'));
      }
      break;
    case 'snub':
      once('wave', 0.8, () => act(mo.a, 'wave'));
      once('sulk', 2.4, () => act(mo.a, 'sigh'));
      break;
    default:
  }
}

// ---------- Breeding ----------
// Two blooming Mochi pair up (if there's room by the gate for an egg), find each other, and once
// they meet nuzzle and dance; then the egg is there by the gate, and they rest a while.
const DANCE = 3.6;
function tickPairing(world, life, now, night) {
  const g = world.char.garden;
  let pair = life.pairing;
  const ok = (e) => life.mochi.includes(e) && !e.scene && !e.leaving && !e.hidden && e.x != null && e.rec.bloom > 0;
  if (pair && (night || !ok(pair.a) || !ok(pair.b))) pair = life.pairing = null;
  if (!pair && !night) {
    // (Two of a friend's own don't pair here: one of yours and one of theirs can.)
    const blooming = life.mochi.filter(ok).filter((e, k, all) => !e.guest || !all.slice(0, k).some((o) => o.guest));
    if (blooming.length >= 2 && (g.eggs ?? []).length < EGG_SLOTS.length) pair = life.pairing = { a: blooming[0], b: blooming[1], met: null };
  }
  if (!pair) return;
  const { a, b } = pair;
  if (!pair.met && Math.abs(a.x - b.x) < 26) {
    pair.met = now;
    for (const [e, o] of [[a, b], [b, a]]) {
      e.m.dir = Math.sign(o.x - e.x) || 1;
      e.m.action = { name: 'pet', t0: null, hold: 1.2 };
      e.m.queue = [{ name: 'twirl' }];
      e.busyUntil = now + DANCE + 0.6;
      e.greet = null;
    }
  } else if (pair.met) {
    a.m.dir = Math.sign(b.x - a.x) || 1;
    b.m.dir = Math.sign(a.x - b.x) || 1;
    if (now - pair.met >= DANCE) {
      const seed = Math.floor(Math.random() * 1e9);
      (g.eggs ??= []).push({ seed, genes: breedGenes(a.rec, b.rec, seed) });
      for (const e of [a, b]) Object.assign(e.rec, { bloom: 0, bredRest: BLOOM.rest });
      life.pairing = null;
      // (One of them a friend's Mochi, visiting: an egg for them too, in their own garden.)
      const guest = [a, b].find((e) => e.guest && e.guest !== 'me');
      if (guest) {
        const mine = guest === a ? b : a;
        const seed2 = Math.floor(Math.random() * 1e9);
        sendBreed(world, guest.guest, { seed: seed2, genes: breedGenes(guest.rec, mine.rec, seed2) }, calledOf(mine.rec, 'their'));
        world.log(`${calledOf(mine.rec, 'Your')} and your friend's ${calledOf(guest.rec, 'Mochi')} nuzzle and dance... an egg for each of you!`, '#ffc2d4');
      } else world.log(`${calledOf(a.rec, 'Your')} and ${calledOf(b.rec, 'your')} nuzzle and dance... and there's an egg by the stall!`, '#ffc2d4');
    }
  }
}

// ---------- Eggs ----------
const RARITY = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'mutation'];
// An egg's seed: the rarest of `tries` rolls (a Star Egg's few; a plain one's one).
function eggSeed(tries, rng = Math.random) {
  let best = null;
  for (let k = 0; k < tries; k++) {
    const seed = Math.floor(rng() * 1e9);
    const r = RARITY.indexOf(rollMochi(seed).rarity);
    if (!best || r > best[1]) best = [seed, r];
  }
  return best[0];
}
// The eggs in your bag, set down by the gate (as many as there's room for).
const BAG_EGGS = [['mochi_egg_star', 6], ['mochi_egg', 1]];
function setEggsDown(world) {
  const g = world.char.garden;
  const inv = world.char.inventory;
  g.eggs ??= [];
  let n = 0;
  for (const [id, tries] of BAG_EGGS) {
    while (g.eggs.length < EGG_SLOTS.length && countItem(inv, id) > 0) {
      removeItem(inv, id, 1);
      const egg = { seed: eggSeed(tries) };
      // (Your old pet's Star Egg: it hatches as itself, its name and all: world/mochi.js.)
      if (id === 'mochi_egg_star' && world.char.oldPetName) {
        egg.name = world.char.oldPetName;
        delete world.char.oldPetName;
      }
      g.eggs.push(egg);
      n++;
    }
  }
  if (n) world.log(`You set ${n === 1 ? 'an egg' : `${n} eggs`} down by the gate. Rock ${n === 1 ? 'it' : 'one'} to hatch it!`, '#ffc2d4');
}
// The stall's eggs today: three of its own each real day (the same all day), for each hero.
const dayOf = (now = Date.now()) => Math.floor(now / 864e5);

// ---------- Today's care goals ----------
// Three small things to do in your Garden each day, picked by the day: feed your Mochi, care for
// them, pick the crop bed, shake the fruit trees, cook at the Sweet Kitchen, race one of them. Each
// done pays a little gold and makes every Mochi a bit happier and closer to you; all three, a bonus.
// (A reason to drop by every day; none of it raises stats, so raising stays the grind it is.)
export const DAILY_KINDS = {
  feed: { need: 3, words: (n) => `Feed your Mochi ${n} sweets` },
  care: { need: 4, words: (n) => `Pet or play with your Mochi ${n} times` },
  harvest: { need: 1, words: () => 'Pick the crop bed' },
  shake: { need: 2, words: (n) => `Shake fruit from the trees ${n} times` },
  cook: { need: 2, words: (n) => `Cook ${n} batches of sweets` },
  race: { need: 1, words: () => 'Race one of your Mochi' },
};
export const DAILY_PAY = { each: 300, all: 600, bond: 10, mood: 8 };
// Today's three goals (made fresh each day).
export function dailyGoals(char, day = dayOf()) {
  const g = char.garden;
  if (!g) return null;
  if (g.daily?.day !== day) {
    const kinds = Object.keys(DAILY_KINDS);
    const rng = seededRandom(day * 7919 + 13);
    const pick = [];
    while (pick.length < 3) {
      const k = kinds[Math.floor(rng() * kinds.length)];
      if (!pick.includes(k)) pick.push(k);
    }
    g.daily = { day, goals: pick.map((kind) => ({ kind, need: DAILY_KINDS[kind].need, have: 0 })), all: false };
  }
  return g.daily;
}
// Counts something done toward today's goals (your own garden only); pays out as each is met.
export function noteDaily(world, kind, n = 1) {
  if (world.gardenVisit || !world.char.garden) return;
  const d = dailyGoals(world.char);
  const goal = d.goals.find((x) => x.kind === kind && x.have < x.need);
  if (!goal) return;
  goal.have = Math.min(goal.need, goal.have + n);
  if (goal.have < goal.need) return;
  const char = world.char;
  char.gold += DAILY_PAY.each;
  for (const r of char.garden.mochi) Object.assign(r, { bond: Math.min(1000, (r.bond ?? 0) + DAILY_PAY.bond), mood: Math.min(100, (r.mood ?? 60) + DAILY_PAY.mood) });
  world.log(`Today's goal done: ${DAILY_KINDS[kind].words(goal.need)}! +${DAILY_PAY.each} gold, and your Mochi are happier.`, '#ffe36b');
  if (!d.all && d.goals.every((x) => x.have >= x.need)) {
    d.all = true;
    char.gold += DAILY_PAY.all;
    world.log(`All of today's goals done! A bonus ${DAILY_PAY.all} gold from Kinako. See you tomorrow!`, '#ffe36b');
  }
}
// Today's goals in a line: "Feed 1/3 · Care 0/4 · Harvest 1/1".
export function dailyLine(char) {
  const d = dailyGoals(char);
  if (!d) return '';
  const short = { feed: 'Feed', care: 'Care', harvest: 'Crops', shake: 'Trees', cook: 'Cook', race: 'Race' };
  return d.goals.map((x) => `${short[x.kind]} ${x.have}/${x.need}`).join(' · ');
}
const hashStr = (s) => {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
};
export function stallEggs(char, day = dayOf()) {
  const rng = seededRandom(hashStr(`${char.name}|eggs|${day}`));
  return [0, 1, 2].map(() => Math.floor(rng() * 1e9));
}
export const stallSold = (char, day = dayOf()) => (char.eggStall?.day === day ? char.eggStall.sold : []);
// Buys stall egg `i`: it goes straight to the gate. Returns why not, or null.
export function buyStallEgg(world, i) {
  const char = world.char;
  const g = char.garden;
  const day = dayOf();
  const at = world.map.eggStall;
  if (world.gardenVisit || !g || at == null) return 'Only at the egg stall.';
  const sold = stallSold(char, day);
  if (sold.includes(i)) return 'Already sold.';
  if ((g.eggs ?? []).length >= EGG_SLOTS.length) return 'No room by the gate: hatch one first.';
  if (char.gold < EGG_PRICE) return `It costs ${EGG_PRICE} gold.`;
  char.gold -= EGG_PRICE;
  char.eggStall = { day, sold: [...sold, i] };
  const egg = { seed: stallEggs(char, day)[i] };
  (g.eggs ??= []).push(egg);
  // Paid over the counter, and it is sent on to the nest inside your garden gate.
  handOver(world, at, null);
  world.log('You buy the egg. It will be waiting in the nest inside your garden gate: rock it to hatch it!', '#ffc2d4');
  return null;
}
// Paying at a garden stall at `x`: a few coins hop from you onto its counter, then what you bought
// (`parcel`: its colour, or null for nothing to carry) hops back into your arms, and you give a
// happy little cheer. (Drawn by render/garden.js from `life.handoffs`.)
export function handOver(world, x, parcel) {
  const life = world.gardenLife;
  if (!life) return;
  const now = world.now;
  life.handoffs = (life.handoffs ?? []).filter((h) => now - h.t0 < 3);
  life.handoffs.push({ from: world.body.x, y: world.body.y, to: x, t0: now, parcel });
  world.body.facing = x >= world.body.x ? 1 : -1;
  // (The cheer comes as it lands in her arms: tickGarden.)
  life.cheerAt = now + (parcel ? 1.05 : 0.5);
}
// Egg hops from the stall to the nest: how long one takes over `dist`, in little hops of HOP.
export const EGG_HOP = 26;
export const eggHopSecs = (dist) => Math.max(3, Math.round(Math.abs(dist) / EGG_HOP)) * 0.3;
// The way into the Mochi Garden with friends online who have one of their own: which garden, yours
// or one of theirs (ui/garden-pick.js)? Returns true if it asks.
export function gardenGateUp(world, portal) {
  if (portal?.to !== 'garden' || world.map.garden || !gardenFriends().length) return false;
  world.gardenGate = { x: portal.x, toPortal: portal.toPortal };
  world.events.push({ type: 'gardenpick' });
  return true;
}
// Up at the egg stall (the Mochi Market's: `map.eggStall`): its window (ui/egg-stall.js).
export function eggStallUp(world) {
  const at = world.map.eggStall;
  if (at == null || world.gardenVisit || !world.char.garden || Math.abs(world.body.x - at) > 40) return false;
  world.events.push({ type: 'eggstall' });
  return true;
}

// ---------- The mailbox ----------
// By the gate: presents your friends leave you (net/visit.js) wait in it, its flag up, until you
// open it (Up beside it): sweets into your bag, eggs into the nest (one that won't fit stays in the
// box for later). In the daytime, while there's post, a Mochi now and then trots over and peeks in.
export const MAILBOX_X = 226;
export function openMail(world) {
  const g = world.gardenLife?.owner?.garden;
  if (!g || !world.map.garden || world.gardenVisit || world.map.indoor || Math.abs(world.body.x - MAILBOX_X) > 14) return false;
  const mail = g.mail ?? [];
  world.body.facing = MAILBOX_X >= world.body.x ? 1 : -1;
  if (!mail.length) {
    world.log('The mailbox is empty. Presents your friends leave you turn up here.', '#cfe8ff');
    return true;
  }
  const kept = [];
  const got = [];
  for (const p of mail) {
    if (p.egg) {
      if ((g.eggs ??= []).length < EGG_SLOTS.length) {
        g.eggs.push(p.egg);
        got.push(`an egg from ${p.from}`);
      } else kept.push(p);
    } else if (p.sweet && p.n > 0) {
      addItem(world.char.inventory, p.sweet, p.n);
      got.push(`${p.n} sweet${p.n === 1 ? '' : 's'} from ${p.from}`);
    }
  }
  g.mail = kept;
  world.map.mailOpen = world.now;
  if (got.length) {
    world.log(`You open the mailbox: ${got.join(', ')}!`, '#ffc2d4');
    if (world.gardenLife) world.gardenLife.cheerAt = world.now + 0.5;
  }
  if (kept.length) world.log('An egg is still waiting in the mailbox: hatch one from the nest to make room for it.', '#cfe8ff');
  return true;
}

// ---------- The toy box ----------
// Up at the toy box: you toss the ball, and your Mochi nearby who can walk run after it and play (a
// little care each). Once every two minutes, so it's a treat, not a button to press for care.
const BALL = { every: 120, near: 280, secs: 14 };
export function tossBall(world) {
  const life = world.gardenLife;
  if (!life || world.gardenVisit || world.map.indoor || Math.abs(world.body.x - TOY_X) > 40) return false;
  const now = Date.now() / 1000;
  if (life.ballAt && now - life.ballAt < BALL.every) {
    world.log('The ball is still rolling about. Give them a little while!', '#cfe8ff');
    return true;
  }
  const near = life.mochi.filter((e) => !e.guest && !e.hidden && e.x != null && Math.abs(e.x - TOY_X) < BALL.near && pts(e.rec, 'run') >= CANT.run && e.rec.stage !== 'egg');
  if (!near.length) {
    world.log('You toss the ball... but no Mochi is near enough to chase it.', '#cfe8ff');
    return true;
  }
  life.ballAt = now;
  life.ball = { x: TOY_X, until: now + BALL.secs };
  for (const e of near) Object.assign(e, { ballChase: true, ballPlayed: false });
  world.log(`You toss the ball! ${near.length === 1 ? calledOf(near[0].rec, 'Your Mochi') + ' chases' : 'Your Mochi chase'} after it.`, '#ffc2d4');
  return true;
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
  if (world.gathering) return true;
  // Picked by hand, the way any spot is gathered (world/gathering.js): she kneels at the bed and
  // tugs (render/life-moves.js `gather`), the crops wiggle and come free part-way through, the four
  // of them hop out of the bed, and what she holds up is the rice. Walking off stops it, the crops
  // still in the ground. (render/garden.js draws the bed's side of it from `map.harvest`.)
  const b = world.body;
  b.facing = CROP_X >= b.x ? 1 : -1;
  b.vx = 0;
  const work = {
    node: { x: CROP_X, y: b.y, kind: 'herb', pool: { mochi_rice: 1 } },
    i: -1,
    kind: { verb: 'Pick', move: 'gather', secs: HARVEST_SECS, rest: 0, count: [1, 1] },
    skill: 'gathering',
    secs: HARVEST_SECS,
    t: 0,
    // (The crops come free at FREE of the way through: they hop out then.)
    free: () => {
      world.lastGathered = { x: CROP_X, y: b.y, items: Object.keys(CROP_YIELD), at: world.now };
    },
    done: () => {
      for (const [id, n] of Object.entries(CROP_YIELD)) addItem(world.char.inventory, id, n);
      g.cropAt = Date.now() / 1000;
      world.log('You pick the crop bed: 3 Mochi Rice, 2 Red Beans, 2 Kinako and a Fire Pepper!', '#d6f5b0');
      noteDaily(world, 'harvest');
      // (Any Mochi close by cheers the harvest in.)
      for (const e of world.gardenLife?.mochi ?? []) if (e.m && !e.m.action && !e.hidden && Math.abs((e.x ?? 1e9) - CROP_X) < 170) e.m.action = { name: 'cheer', t0: null };
    },
  };
  world.gathering = work;
  world.pose = { kind: 'gather', t: HARVEST_SECS, dur: HARVEST_SECS, since: world.now };
  world.map.harvest = work;
  return true;
}
// How long the picking takes, and how far into it the crops come up out of the bed (the tug in
// render/life-moves.js `gather` is at about 0.55 of the way).
const HARVEST_SECS = 1.7;
export const HARVEST_FREE = 0.56;

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
  const genes = { ...(egg.genes ?? rollMochi(egg.seed)), stage: 'egg' };
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
  const rec = newRecord(h.egg.genes ?? rollMochi(h.egg.seed));
  g.mochi.push(rec);
  // (It carries on from where it landed, with the same animation.)
  h.m.genes = rec;
  h.m.noIdle = false;
  life.mochi.push({ rec, m: h.m, x: h.x + h.m.dir * 14 });
  life.hatching = null;
  if (h.egg.name) {
    rec.name = h.egg.name;
    world.log(`It's ${rec.name}! Your old friend, hatched in a garden of its own.`, '#ffc2d4');
    return;
  }
  world.log(`It hatched! A ${rec.personality} little Mochiko. It loves ${rec.loves}. What will you call it?`, '#ffc2d4');
  // (Its name: ui/mochi-name.js.)
  world.naming = rec;
  world.events.push({ type: 'mochiname' });
}

// ---------- The clothes stall ----------
// Four models on the counter each day (data/mochi-wardrobe.js stallWear), one at each tier and
// every one of them dressed from its hat down to its shoes, so you can see a whole look standing
// there. Every piece on a model is for sale on its own: buy the look or buy just the boots. What
// you buy is yours for good, and any Mochi of yours can wear it.
// Today's four. Kept on the garden, which is where everything of your Mochi's lives, and handed
// to whoever is drawing the stall - render/garden.js has no character of its own to ask.
// (Nothing is ever taken off a model: a model is a display, not the stock. What you already own
// is marked on its card instead.)
let onShow = null;
export const stallOnShow = () => onShow;
export function stallClothes(char, day = dayOf()) {
  const g = char.garden;
  if (!g) return stallWear(char.name ?? 'you', day);
  if (g.wearStall?.day !== day) g.wearStall = { day, stock: stallWear(char.name ?? 'you', day) };
  onShow = g.wearStall;
  return g.wearStall.stock;
}
// (Kept on the garden with the Mochi themselves: every hero in the save file shares them.)
export const ownsWear = (char, id) => (char.garden?.wardrobe ?? []).includes(id);
// Buys the piece worn in `slot` by model `m`. Returns why not, or null.
export function buyStallWear(world, m, slot) {
  const char = world.char;
  if (world.gardenVisit || !char.garden) return 'Only at your own garden.';
  const piece = stallClothes(char)[m]?.pieces.find((p) => p.kind === slot);
  if (!piece) return 'Not for sale.';
  if (ownsWear(char, piece.id)) return 'You have that one already.';
  if (char.gold < piece.price) return `It costs ${piece.price.toLocaleString()} gold.`;
  char.gold -= piece.price;
  (char.garden.wardrobe ??= []).push(piece.id);
  // (Wrapped up in its tier's colour and handed over the counter.)
  handOver(world, world.map.wearStall ?? world.body.x, { beginner: '#a8d8b0', mid: '#8fcfe8', end: '#c8a8f0', elite: '#ffcf5c' }[piece.tier] ?? '#ff9ec0');
  world.log(`${piece.name} is yours. Dress a Mochi in it from its page!`, '#ffc2d4');
  return null;
}
// Up at the clothes stall (whichever map has one: `wearStall` is where it stands): its window
// (ui/wear-stall.js).
export function wearStallUp(world) {
  const at = world.map.wearStall;
  if (at == null || world.gardenVisit || !world.char.garden || Math.abs(world.body.x - at) > 40) return false;
  world.events.push({ type: 'wearstall' });
  return true;
}
