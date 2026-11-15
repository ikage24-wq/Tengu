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
import { choose, drainNeeds, satisfy, needsOf, mainNeed, befriend, bestFriend, isRival, friendsOf, learn, enjoyment, likesOf } from './mochi-brain.js';
import { gardenWeatherTick } from './garden-weather.js';
import { FEELINGS, SAD, feel, feelingOf, feelWant, quirksOf, hasQuirk, memoryOf, welcomeOf, giftDue, giftOf, gameFor, accepts, topicsFor, KIND_HEARTS } from './mochi-heart.js';
import { FURNITURE_BY_ID } from '../data/furniture.js';
import { noteDiary, diaryDay } from '../data/mochi-diary.js';
import { sumoStrength } from '../data/mochi-sumo.js';
import { festivalTick, festivalWeather, stayUp, festivalSpot, OFFERING, MORTAR, SNOW_LANTERNS, MAT, LAUNCH } from './garden-festival.js';
import { LAYOUT, GARDEN_START, footOf, syncGarden, seedGarden } from './garden-layout.js';

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
// The crop bed (the Vegetable Bed piece): ripe again this long after you pick it, and what it gives.
// (Wherever it's set out - world/garden-layout.js - or null while it's put away: applyLayout.)
export let CROP_X = 440;
// The toy box (the Toy Box piece): now and then a Mochi wanders over to it and plays with the ball a
// while. Its turn comes at the same time for a visitor (by the hour and its seed). (Null while it's
// put away: no toys out then.)
export let TOY_X = 1582;
const TOY = { chance: 0.22, at: [4, 24], stay: 32 };
function toyTime(rec, now) {
  const b = Math.floor(now / HOUR);
  if (TOY_X == null || hash(rec.seed * 0.53 + b * 2.17) > TOY.chance) return false;
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
      const like = pl.act === 'paddle' ? 'swim' : kind;
      out.push({ id: `p${k}`, kind, like, x: pl.x + (hash(rec.seed * 0.9 + k) - 0.5) * 2 * pl.spread, act: pl.act, ride: pl.ride, hold: pl.hold, face: pl.face, gains, stat, stay: 4 });
    });
    // (A good run round the meadow, there and back at full tilt: what a runner loves.)
    const far = (e.x ?? LAND[0]) < (LAND[0] + LAND[1]) / 2 ? LAND[1] - 120 * hash(rec.seed * 4.1 + (e.brain?.tick ?? 0)) : LAND[0] + 260 + 120 * hash(rec.seed * 4.1 + (e.brain?.tick ?? 0));
    out.push({ id: 'dash', kind: 'play', like: 'run', x: clearOfProps(far), dash: true, gains: { fun: 30, curious: 10 }, stat: 'run', stay: 2 });
    if (TOY_X != null) {
      out.push({ id: 'toy', kind: 'play', x: TOY_X + (hash(rec.seed) < 0.5 ? -14 : 14), act: 'play', face: TOY_X, gains: { fun: 40 }, stat: 'run', stay: 3 });
      // The toy box's other toys (2026-11-15), played out on the grass of the meadow, each its own way
      // (render/mochi-toys.js): a kite (best of all on a windy day), the bubble wand, a spinning top.
      const style = playStyle(rec);
      const spot = (k) => clearOfProps(TOY_X - 80 + hash(rec.seed * 3.1 + k * 1.7 + (e.brain?.tick ?? 0) * 0.31) * 340);
      const windy = world.gardenWeather?.kind === 'wind' ? world.gardenWeather.k : 0;
      out.push({ id: 'kite', kind: 'play', like: 'play', toy: true, x: spot(1), act: `kite${style}`, hold: 9, gains: { fun: 40, curious: 20 }, stat: 'fly', boost: 0.8 + windy * 2.4, stay: 9 });
      out.push({ id: 'bubbles', kind: 'play', like: 'play', toy: true, x: spot(2), act: `bubbles${style}`, hold: 8, gains: { fun: 45 }, stay: 8 });
      out.push({ id: 'top', kind: 'play', like: 'play', toy: true, x: spot(3), act: `top${style}`, hold: 7, gains: { fun: 35, curious: 15 }, stay: 7 });
    }
    // The see-saw: an end to sit on and wait for a friend - or, when someone's sat waiting, the other
    // end (all the keener the closer a friend it is).
    const on = life.mochi.filter((o) => o.ride?.kind === 'seesaw');
    const coming = life.mochi.some((o) => o !== e && o.brain?.plan?.id === 'seesaw' && !o.brain.plan.arrived);
    const waiting = on.length === 1 && on[0] !== e && on[0].ride.waiting ? on[0] : null;
    if (SEESAW.x != null) {
      if (!on.length && !coming) out.push({ id: 'seesaw', kind: 'play', like: 'social', x: SEESAW.x + ((e.x ?? 0) < SEESAW.x ? -1 : 1) * (SEESAW.half + 12), act: 'seesaw', ride: true, face: SEESAW.x, gains: { fun: 35, social: 25 }, stat: 'power', stay: 3 });
      else if (waiting && !coming && !isRival(rec, waiting.rec)) {
        const fond = Math.max(0, friendsOf(rec)[waiting.rec.seed] ?? 0);
        out.push({ id: 'seesaw', kind: 'social', like: 'social', x: SEESAW.x + (waiting.ride.seat ? -1 : 1) * (SEESAW.half + 12), act: 'seesaw', ride: true, face: SEESAW.x, gains: { fun: 45, social: 45 }, stat: 'power', boost: 2.4 + fond / 40, stay: 3 });
      }
    }
  }
  if (pts(rec, 'swim') >= CANT.swim) out.push({ id: 'swim', kind: 'play', like: 'swim', x: POND[0] + 40 + hash(rec.seed * 3.3 + (e.brain?.tick ?? 0)) * (POND[1] - POND[0] - 80), gains: { fun: 45, curious: 20 }, stat: 'swim', boost: 1.3, stay: 10 });
  // (A wander somewhere new, a little rest where it is.)
  // (A little one too young to walk keeps close, and keeps on the way it's facing - a short crawl
  // on, turning only at the end of the grass - instead of to and fro across the same patch.)
  const roam = hash(rec.seed * 1.9 + (e.brain?.tick ?? 0) * 0.77);
  let wx = LAND[0] + roam * (LAND[1] - LAND[0]);
  if (!walker) {
    const d = e.m.dir || 1;
    wx = (e.x ?? LAND[0]) + d * (40 + roam * 60);
    if (wx < LAND[0] + 20 || wx > LAND[1] - 20) wx = (e.x ?? LAND[0]) - d * (40 + roam * 60);
  }
  // (For a little one, every crawl somewhere new is an adventure: it feeds its curiosity twice over.)
  out.push({ id: 'wander', kind: 'explore', like: 'explore', x: clearOfProps(wx), gains: { curious: walker ? 15 : 30 }, stay: walker ? 4 : 9 });
  // (A nibble of the clover where it is: anyone can, even one too little to reach the fruit trees, so
  // a hungry Mochi never has to wait on you.)
  out.push({ id: 'nibble', kind: 'snack', like: 'snack', x: clearOfProps(e.x), act: 'yum', gains: { hunger: 30 }, boost: walker ? 0.6 : 1, stay: 3 });
  // (In the evening, before bed, under the lanterns strung over the square: render/garden.js.)
  const dusk = world.night ?? nightOf(new Date());
  if (dusk > 0.2 && dusk <= 0.5) out.push({ id: 'lanterns', kind: 'social', like: 'social', x: 360 + Math.round(hash(rec.seed * 5.7) * 460), act: 'hum', gains: { social: 30, curious: 15 }, boost: 2.4, stay: 10 });
  out.push({ id: 'rest', kind: 'rest', like: 'rest', x: clearOfProps(e.x), gains: { energy: 25 }, stay: walker ? 8 : 14 });
  // (A roll about in the grass close by: fun anyone can have, even one too little to walk.)
  out.push({ id: 'tumble', kind: 'play', like: 'play', x: clearOfProps(Math.max(LAND[0], (e.x ?? LAND[0]) + (hash(rec.seed * 2.3 + (e.brain?.tick ?? 0)) - 0.5) * (walker ? 120 : 60))), act: 'roll', gains: { fun: 30 }, boost: walker ? 0.45 : 1, stay: 3 });
  // (Company: the nearest of the others out in the garden, and you, the closer it is to you the keener.)
  // (Part 2: its best friend most of all, the nearest one too; napping beside a best friend that's
  // resting; and any it doesn't get on with, it keeps away from.)
  const others = life.mochi.filter((o) => o !== e && !o.hidden && o.x != null && !o.ride && !o.guest);
  const near = [...others].sort((a, b) => Math.abs(a.x - e.x) - Math.abs(b.x - e.x))[0];
  const bf = bestFriend(rec, others);
  for (const pal of new Set([bf, near].filter(Boolean))) {
    if ((!walker && Math.abs(pal.x - e.x) >= 220) || isRival(rec, pal.rec)) continue;
    const score = Math.max(0, friendsOf(rec)[pal.rec.seed] ?? 0);
    out.push({ id: pal === bf ? 'bestie' : 'friend', kind: 'social', like: 'social', x: pal.x, follow: pal, act: 'cheer', gains: { social: 45, fun: 10 }, boost: 1 + score / 60, stay: 3 });
    if (pal === bf && (pal.brain?.plan?.id === 'rest' || pal.m.action?.name === 'nap')) {
      out.push({ id: 'napwith', kind: 'rest', like: 'rest', x: pal.x + (e.x < pal.x ? -12 : 12), act: 'nap', hold: 6, pal, gains: { energy: 40, social: 20 }, stay: 3 });
    }
  }
  if (walker) decorOptions(world, life, e, out);
  heartOptions(world, life, e, out, walker);
  weatherOptions(world, life, e, out, walker);
  festivalOptions(world, life, e, out, walker);
  // (A spot already taken - another Mochi stood there, or on its way there - it takes the place
  // beside instead, still facing what it came for: two never stand one inside the other sniffing
  // the same flower or reaching for the same fruit.)
  for (const o of out) {
    if (o.follow || o.ride || o.x == null || o.id === 'swim') continue;
    const taken = (x) => life.mochi.some((q) => q !== e && !q.hidden && ((q.x != null && Math.abs(q.x - x) < 9) || (q.brain?.plan && !q.brain.plan.arrived && Math.abs(q.brain.plan.x - x) < 9)));
    if (!taken(o.x)) continue;
    // (Nor inside one of the garden's pieces, unless that's where it was going: a roll in the bed.)
    const own = inProps(o.x);
    for (const dx of [14, -14, 26, -26]) {
      const nx = Math.max(LAND[0] + 6, Math.min(LAND[1] - 6, o.x + dx));
      if (!taken(nx) && (own || !inProps(nx))) {
        if (o.face == null && o.act) o.face = o.x;
        o.x = nx;
        break;
      }
    }
  }
  // (Somewhere to be on its own - a wander, a rest, a roll - isn't right where two others already
  // stand: it picks a spot a little way off, so they never pile up in one place.)
  for (const o of out) {
    if (!['wander', 'rest', 'tumble', 'nibble'].includes(o.id) || o.x == null) continue;
    const crowd = life.mochi.filter((q) => q !== e && q.x != null && Math.abs(q.x - o.x) < 12).length;
    if (crowd >= 1) o.x = clearOfProps(Math.max(LAND[0] + 10, Math.min(LAND[1] - 10, o.x + (hash(rec.seed * 7.7 + (e.brain?.tick ?? 0)) < 0.5 ? -22 : 22))));
  }
  const rivals = others.filter((o) => isRival(rec, o.rec));
  for (const o of out) if (rivals.some((r) => Math.abs(r.x - o.x) < 100)) o.boost = (o.boost ?? 1) * 0.4;
  // (You: the closer it is to you the keener, keener still if you gave it its favourite sweet
  // lately; and one that's really fond of you tags along after you a while.)
  if (world.map.garden && !world.map.indoor && !world.gardenVisit) {
    const fed = Date.now() / 1000 - (rec.lovedAt ?? -1e9) < 1800 ? 0.8 : 0;
    const fond = (rec.bond ?? 0) >= 400;
    out.push({ id: 'you', kind: 'social', like: 'social', x: world.body.x, follow: 'you', tag: fond, act: 'wave', gains: { social: 40 }, boost: 0.4 + Math.min(1, (rec.bond ?? 0) / 600) + fed, stay: fond ? 10 : 3 });
  }
  return out;
}
// ---------- What you've set out in the garden (world/decor.js) ----------
// The pieces they use: sitting side by side on a bench, a nap under the parasol, watching the
// fountain play, a snack on the picnic blanket, a sniff of the pinwheel planter's flowers. (One to
// a spot: two to a bench.)
function decorOptions(world, life, e, out) {
  const rec = e.rec;
  const placed = (life.owner?.garden?.placed ?? []).filter((p) => p.map === 'garden');
  const taken = (id) => life.mochi.some((o) => o !== e && o.brain?.plan?.id === id);
  for (const p of placed) {
    const def = FURNITURE_BY_ID[p.id];
    const id = (k) => `decor${p.uid}${k}`;
    if (def?.use === 'sit') {
      for (const k of [0, 1]) {
        if (taken(id(k))) continue;
        out.push({ id: id(k), kind: 'rest', like: 'social', x: p.x + (k ? 9 : -9), act: 'benchsit', hold: 9, face: p.x, gains: { energy: 20, social: 30 }, boost: 1.2, stay: 9 });
        break;
      }
    } else if (def?.use === 'shade' && !taken(id(0))) out.push({ id: id(0), kind: 'rest', like: 'rest', x: p.x + (hash(rec.seed * 1.7) - 0.5) * 8, act: 'nap', hold: 8, gains: { energy: 55 }, boost: 1.3, stay: 8 });
    else if (def?.use === 'gaze') {
      for (const k of [0, 1]) if (!taken(id(k))) out.push({ id: id(k), kind: 'explore', like: 'explore', x: p.x + (k ? 26 : -26), face: p.x, act: 'wow', hold: 5, gains: { curious: 35, fun: 15 }, boost: 1.2, stay: 5 });
    } else if (def?.use === 'picnic') {
      for (const k of [0, 1]) if (!taken(id(k))) out.push({ id: id(k), kind: 'snack', like: 'snack', x: p.x + (k ? 12 : -12), face: p.x, act: 'yum', gains: { hunger: 35, social: 20 }, boost: 1.3, stay: 4 });
    } else if (def?.use === 'sniff' && !taken(id(0))) out.push({ id: id(0), kind: 'explore', like: 'explore', x: p.x + (e.x < p.x ? -18 : 18), face: p.x, act: 'sniff', gains: { curious: 30 }, stay: 3 });
  }
}
// ---------- The weather (world/garden-weather.js) ----------
// Puddles fill on the open grass where it rains (clear of every prop and place: render/
// garden-weather.js draws them, as full as the ground is wet), and the dry spots to shelter under:
// the big tree's crown, the fruit trees', the nursery's doorway. [x, how far either side]
// (The shelters are the trees' wherever they stand, and the nursery's doorway: applyLayout.)
export const PUDDLES = [[312, 16], [602, 13], [905, 17], [1048, 13], [1272, 15], [1752, 15]];
export const SHELTERS = [[1660, 30], [1537, 9], [2074, 9], [990, 16]];
// Where the snow-mochi gets built when the snow lies (render/garden-weather.js) - by the square, or
// the nearest clear spot to it - and which way the wind blows (as the rain slants and the clouds
// roll: toward the gate).
export let SNOWMAN_X = 1240;
export const WIND_DIR = -1;
const underCover = (x) => SHELTERS.some(([sx, r]) => Math.abs(x - sx) <= r + 4);
// What stands on the garden's grass that the festival's things, the puddles and the snowman keep
// clear of: the pieces you've set out (by the ground they take), and the garden's own pieces you've
// moved - not those still where they always stood, which were laid out round them, nor the fences
// and the lantern string at the back. [{ id, map, x }], x the middle of what it takes.
const STARTED = new Map(GARDEN_START.map(([id, x]) => [id, x]));
export function standing(placed = []) {
  return placed.filter((p) => p.map === 'garden' && FURNITURE_BY_ID[p.id] && FURNITURE_BY_ID[p.id].layer !== 'back' && !(FURNITURE_BY_ID[p.id].builtin && STARTED.get(p.id) === p.x))
    .map((p) => ({ id: p.id, map: 'garden', uid: p.uid, x: (footOf(p)[0] + footOf(p)[1]) / 2 }));
}
// The puddles that can fill: none under a piece you've set out in the garden (world/decor.js).
export function openPuddles(placed = []) {
  const on = standing(placed);
  return PUDDLES.filter(([px, r]) => !on.some((p) => Math.abs(p.x - px) < r + (FURNITURE_BY_ID[p.id]?.w ?? 0) / 2));
}
// Where a garden piece taking `w` of ground, centred at `x`, can be set out (world/decor.js): on the
// garden's grass, clear of the nursery. (Its other pieces it mustn't bump into: world/decor.js
// placeAt.) Why not, or null.
const DECOR_LAND = [210, 2100];
const DECOR_KEEP = [[958, 1022]];
export function gardenSpotWhy(x, w) {
  const a = x - w / 2;
  const b = x + w / 2;
  if (a < DECOR_LAND[0] + 4 || b > DECOR_LAND[1] - 4) return "Keep it on the garden's grass.";
  for (const [k0, k1] of DECOR_KEEP) if (a < k1 && b > k0) return 'Keep the nursery clear.';
  return null;
}
// Who loves a splash, and who'd sooner watch the rain from somewhere dry.
const SPLASHY = new Set(['playful', 'hyper', 'mischief', 'cheeky', 'bubbly', 'sporty', 'brave', 'showoff', 'nosy']);
const SNUG = new Set(['timid', 'shy', 'sleepy', 'lazy', 'gentle', 'polite', 'clingy', 'sweet', 'dreamy', 'grumpy']);
// (In the rain, what's no fun out in it: the rides, the toy box, a roll or a nap in the wet grass,
// watering what the sky's watering already.)
const WASHED_OUT = new Set(['swing', 'slide', 'bounce', 'glide', 'roll', 'nap', 'meditate', 'water', 'play', 'seesaw']);
// What the weather adds to what Mochi `e` could do, and what it takes the shine off.
function weatherOptions(world, life, e, out, walker) {
  const W = world.gardenWeather;
  if (!W) return;
  const rec = e.rec;
  const p = rec.personality;
  if (W.kind === 'rain' && W.k > 0.3) {
    for (const o of out) if (WASHED_OUT.has(o.act) || o.toy || o.id === 'toy' || o.id === 'rest' || o.id === 'tumble') o.boost = (o.boost ?? 1) * 0.3;
    // A splash in a puddle: the nearest two.
    if (walker) {
      const near = openPuddles(life.owner?.garden?.placed).map((pd, k) => [pd, k]).sort((a, b) => Math.abs(a[0][0] - e.x) - Math.abs(b[0][0] - e.x)).slice(0, 2);
      for (const [[px], k] of near) out.push({ id: `puddle${k}`, kind: 'play', like: 'play', x: px + (hash(rec.seed * 1.3 + k) - 0.5) * 6, act: 'splash', hold: 6, gains: { fun: 45, curious: 10 }, boost: (SPLASHY.has(p) ? 2.2 : 0.7) * W.k, stay: 6, wet: true });
    }
    // Somewhere dry to sit and watch it come down: the nearest two (a little one makes for one too).
    const dry = SHELTERS.map((sh, k) => [sh, k]).sort((a, b) => Math.abs(a[0][0] - e.x) - Math.abs(b[0][0] - e.x)).slice(0, 2);
    for (const [[sx, r], k] of dry) out.push({ id: `shelter${k}`, kind: 'rest', like: 'rest', x: sx + (hash(rec.seed * 2.9 + k) - 0.5) * 2 * r, act: 'rainwatch', hold: 9, gains: { energy: 25, curious: 15, social: 5 }, boost: (SNUG.has(p) || !walker ? 2.4 : 1) * W.k, stay: 9 });
  }
  // Snow: catching flakes on its tongue, building the snow-mochi by the square (render/
  // garden-weather.js: it grows as the snow lies), or watching it come down from somewhere snug.
  if (W.kind === 'snow' && W.k > 0.3) {
    for (const o of out) if (o.act === 'nap' || o.act === 'meditate' || o.act === 'water' || o.id === 'rest') o.boost = (o.boost ?? 1) * 0.4;
    if (walker) {
      out.push({ id: 'snowcatch', kind: 'play', like: 'play', x: clearOfProps(Math.max(LAND[0] + 40, Math.min(LAND[1] - 40, e.x + (hash(rec.seed * 4.7 + (e.brain?.tick ?? 0)) - 0.5) * 140))), act: 'snowcatch', hold: 6, gains: { fun: 40, curious: 15 }, boost: (SPLASHY.has(p) ? 1.8 : 1) * W.k, stay: 6 });
      if (W.snow > 0.3) out.push({ id: 'snowman', kind: 'play', like: 'play', x: SNOWMAN_X + (hash(rec.seed * 7.3) < 0.5 ? -27 : 27) + (hash(rec.seed * 2.1) - 0.5) * 4, face: SNOWMAN_X, act: 'snowpat', hold: 6, gains: { fun: 35, curious: 25, social: 10 }, boost: 1.8 * W.snow, stay: 6 });
    }
    const dry = SHELTERS.map((sh, k) => [sh, k]).sort((a, b) => Math.abs(a[0][0] - e.x) - Math.abs(b[0][0] - e.x)).slice(0, 1);
    for (const [[sx, r], k] of dry) out.push({ id: `snug${k}`, kind: 'rest', like: 'rest', x: sx + (hash(rec.seed * 2.9 + k) - 0.5) * 2 * r, act: 'rainwatch', hold: 9, gains: { energy: 25, curious: 15 }, boost: (SNUG.has(p) || !walker ? 2 : 0.6) * W.k, stay: 9 });
  }
  // Wind: off after a leaf blowing by, and a leap to catch it.
  if (W.kind === 'wind' && W.k > 0.3 && walker) {
    const to = clearOfProps(Math.max(LAND[0] + 40, Math.min(LAND[1] - 40, e.x + WIND_DIR * (90 + hash(rec.seed * 5.3 + (e.brain?.tick ?? 0)) * 120))));
    out.push({ id: 'leafchase', kind: 'play', like: 'run', x: to, dash: true, act: 'catch', hold: 1.1, gains: { fun: 45, curious: 10 }, stat: 'run', boost: (SPLASHY.has(p) ? 2 : 0.9) * W.k, stay: 2 });
  }
  // A rainbow: everyone wants a look.
  if (W.rainbow > 0.4 && walker) out.push({ id: 'rainbow', kind: 'explore', like: 'explore', x: clearOfProps(Math.max(LAND[0] + 40, Math.min(LAND[1] - 40, e.x + (hash(rec.seed * 6.1) - 0.5) * 60))), act: 'wow', hold: 4.5, gains: { curious: 45, fun: 15 }, boost: 3 * W.rainbow, stay: 4 });
}
// The festival (world/garden-festival.js): by day a bow at the moon offering, once each; from dusk,
// sitting out with a skewer of dango to watch the moon rise over the cliff - which nearly everyone
// would rather do than anything else.
export function festivalSpots(life) {
  const placed = standing(life.owner?.garden?.placed ?? []);
  const key = placed.map((p) => `${p.uid}@${p.x}`).join();
  if (life.festSpots?.key !== key) {
    const widthOf = (p) => FURNITURE_BY_ID[p.id]?.w;
    // (Each with room round it for the Mochi bowing, pounding, sat on the mat.)
    // (Each with room round it for the Mochi bowing, pounding, sat on the mat - or squeezed in, in a
    // garden packed full.)
    const spot = (pref, room) => festivalSpot({ ...pref, w: room }, placed, gardenSpotWhy, widthOf) ?? festivalSpot(pref, placed, gardenSpotWhy, widthOf) ?? pref.x;
    life.festSpots = { key, offering: spot(OFFERING, 64), mortar: spot(MORTAR, 64), mat: spot(MAT, 96) };
  }
  return life.festSpots;
}
function festivalOptions(world, life, e, out, walker) {
  const F = world.gardenFestival;
  if (!F || F.k < 0.5 || !walker) return;
  if (F.id === 'snow') return snowOptions(world, life, e, out, F);
  if (F.id === 'blossom') return blossomOptions(world, life, e, out, F);
  if (F.id === 'lantern') return lanternOptions(world, life, e, out, F);
  const rec = e.rec;
  const spots = festivalSpots(life);
  if (F.eve > 0.25) {
    // (Each its own seat across the orchard's flat, facing the moon; the first few close by the offering.)
    const i = Math.max(0, life.mochi.filter((o) => !o.guest).indexOf(e));
    const seat = i < 3 ? spots.offering - 24 - i * 17 : 1452 + ((i * 97 + Math.floor(hash(rec.seed) * 40)) % 360);
    const x = clearOfProps(Math.max(LAND[0] + 30, Math.min(LAND[1] - 24, seat)));
    out.push({ id: 'moongaze', kind: 'rest', like: 'social', x, face: x + 60, act: 'moonsit', hold: 16, gains: { energy: 15, social: 25, curious: 30 }, boost: 8 * F.eve * (hasQuirk(rec, 'stargazer') ? 1.4 : 1), stay: 16, moon: true });
    // (Anything else can wait - but a present for you, or sitting by you, or a sad friend.)
    const KEEP = new Set(['moongaze', 'givegift', 'sitby']);
    for (const o of out) if (!KEEP.has(o.id) && o.invite?.kind !== 'comfort') o.boost = (o.boost ?? 1) * (1 - 0.88 * F.eve);
    return;
  }
  // A bow at the offering, once each this festival.
  life.festBowed = life.festBowed?.day === F.day ? life.festBowed : { day: F.day, seen: new Set() };
  if (!life.festBowed.seen.has(rec.seed)) {
    const side = hash(rec.seed * 1.9) < 0.5 ? -1 : 1;
    out.push({ id: 'offering', kind: 'explore', like: 'explore', x: spots.offering + side * 22, face: spots.offering, act: 'offerbow', hold: 2.4, gains: { curious: 30, social: 10 }, boost: 1.8, stay: 2.6, bow: true });
  }
}
// (Anything else can wait on a festival night - but a present for you, sitting by you, a sad friend.)
const FEST_KEEP = new Set(['givegift', 'sitby']);
function festNight(out, F, ...own) {
  for (const o of out) if (!own.includes(o.id) && !FEST_KEEP.has(o.id) && o.invite?.kind !== 'comfort') o.boost = (o.boost ?? 1) * (1 - 0.88 * F.eve);
}
// The Snow Lantern Festival: by day, a pat for the big snow-Mochi (snowball fights are games together:
// heartOptions); from dusk, off to light a snow lantern still dark - one each - and then sat by one,
// paws out to its glow.
export function snowLanterns(life) {
  const placed = standing(life.owner?.garden?.placed ?? []);
  return SNOW_LANTERNS.filter((x) => !placed.some((p) => Math.abs(p.x - x) < (FURNITURE_BY_ID[p.id]?.w ?? 20) / 2 + 8));
}
export function litLanterns(life, F) {
  life.festLit = life.festLit?.day === F.day ? life.festLit : { day: F.day, lit: new Set() };
  return life.festLit.lit;
}
function snowOptions(world, life, e, out, F) {
  const rec = e.rec;
  if (F.eve > 0.25) {
    const all = snowLanterns(life);
    const lit = litLanterns(life, F);
    // A dark one, not already being seen to by another.
    // (By full night they're all lit, as render/garden-festival.js draws them.)
    const dark = F.eve > 0.8 ? [] : all.filter((x) => !lit.has(x) && !life.mochi.some((o) => o !== e && o.brain?.plan?.light === x)).sort((p, q) => Math.abs(p - e.x) - Math.abs(q - e.x));
    if (dark.length) {
      const x = dark[0];
      const side = e.x < x ? -1 : 1;
      out.push({ id: 'lightlantern', kind: 'explore', like: 'explore', x: x + side * 11, face: x, act: 'lightlantern', hold: 2.4, gains: { curious: 25, fun: 15 }, boost: 9 * F.eve, stay: 2.6, light: x });
    }
    // Then sat by one, warm (each its own, round them in turn).
    const i = Math.max(0, life.mochi.filter((o) => !o.guest).indexOf(e));
    const by = all.length ? all[i % all.length] : e.x;
    const side = (Math.floor(i / Math.max(1, all.length)) + i) % 2 ? 1 : -1;
    out.push({ id: 'warmsit', kind: 'rest', like: 'social', x: clearOfProps(by + side * 13), face: by, act: 'warmsit', hold: 16, gains: { energy: 20, social: 25, curious: 15 }, boost: 7 * F.eve, stay: 16, warm: true });
    festNight(out, F, 'lightlantern', 'warmsit');
    for (const o of out) if (o.id === 'warmsit' && dark.length) o.boost *= 0.5;
    return;
  }
  // A pat for the big snow-Mochi by the square.
  out.push({ id: 'snowmochi', kind: 'play', like: 'play', x: SNOWMAN_X + (hash(rec.seed * 7.3) < 0.5 ? -27 : 27) + (hash(rec.seed * 2.1) - 0.5) * 4, face: SNOWMAN_X, act: 'snowpat', hold: 5, gains: { fun: 30, curious: 20 }, boost: 1.3, stay: 5 });
}
// Blossom Day: a picnic on the mat, sat round it with three-colour dango (by day and on into the
// lantern-lit evening), and petals to chase on the breeze.
function blossomOptions(world, life, e, out, F) {
  const rec = e.rec;
  const mat = festivalSpots(life).mat;
  // (Six places round the mat, facing in; a seventh and after sit just off it.)
  const i = Math.max(0, life.mochi.filter((o) => !o.guest).indexOf(e));
  const place = [-22, 22, -11, 11, -30, 30][i % 6] + (i >= 6 ? Math.sign(i % 2 - 0.5) * 40 : 0);
  const x = mat + place;
  out.push({ id: 'hanami', kind: 'social', like: 'social', x, face: place < 0 ? x + 20 : x - 20, act: 'hanamisit', hold: 14, gains: { social: 40, hunger: 25, fun: 15 }, boost: (F.eve > 0.25 ? 7 * F.eve : 1.6), stay: 14, hanami: true });
  if (F.eve > 0.25) return festNight(out, F, 'hanami');
  // A petal blowing by: after it, and a leap to catch it.
  const to = clearOfProps(Math.max(LAND[0] + 40, Math.min(LAND[1] - 40, e.x + (hash(rec.seed * 5.3 + (e.brain?.tick ?? 0)) - 0.5) * 240)));
  out.push({ id: 'petalchase', kind: 'play', like: 'run', x: to, dash: true, act: 'catch', hold: 1.1, gains: { fun: 40, curious: 10 }, stat: 'run', boost: 1.2, stay: 2 });
}
// Lantern Night: by day, sat in the big tree's shade fanning itself; at dusk, off to the pond's bank to
// set a lantern boat afloat (once each); at night, sat out with a sparkler watching the fireworks.
function lanternOptions(world, life, e, out, F) {
  const rec = e.rec;
  const i = Math.max(0, life.mochi.filter((o) => !o.guest).indexOf(e));
  if (F.eve > 0.25) {
    life.festBoats = life.festBoats?.day === F.day ? life.festBoats : { day: F.day, set: new Set(), boats: [] };
    if (!life.festBoats.set.has(rec.seed) && F.eve < 0.9) out.push({ id: 'floatlantern', kind: 'explore', like: 'explore', x: LAUNCH - (i % 3) * 7, face: LAUNCH + 60, act: 'floatlantern', hold: 2.6, gains: { curious: 30, fun: 15 }, boost: 8 * F.eve, stay: 2.8, boat: true });
    const x = clearOfProps(1460 + ((i * 89 + Math.floor(hash(rec.seed) * 30)) % 560));
    out.push({ id: 'hanabi', kind: 'rest', like: 'social', x, face: x + 60, act: 'sparklesit', hold: 16, gains: { fun: 30, social: 20, curious: 25 }, boost: 7 * F.eve, stay: 16, hanabi: true });
    for (const o of out) if (o.id === 'hanabi' && !life.festBoats.set.has(rec.seed) && F.eve < 0.9) o.boost *= 0.4;
    return festNight(out, F, 'floatlantern', 'hanabi');
  }
  const shade = LAYOUT.bigtree != null ? [LAYOUT.bigtree - 60, LAYOUT.bigtree + 40] : LAYOUT.trees.length ? [LAYOUT.trees[0].x - 30, LAYOUT.trees[0].x + 30] : null;
  if (!shade) return;
  const x = shade[0] + ((i * 37 + Math.floor(hash(rec.seed * 1.7) * 20)) % (shade[1] - shade[0]));
  out.push({ id: 'fansit', kind: 'rest', like: 'rest', x: clearOfProps(x), face: x + (i % 2 ? -30 : 30), act: 'fansit', hold: 12, gains: { energy: 35, social: 10 }, boost: 1.8, stay: 12 });
}
// What it holds over its head out in the rain: a big leaf - each picking one up at its own moment as
// the rain gets going and putting it away as it eases off - but not while it's splashing in a
// puddle on purpose, sheltering, swimming, flying, riding, too little to carry one, or busy with
// something in its paws.
const LEAF_OK = new Set(['wave', 'cheer', 'wow', 'hum']);
function leafFor(world, e, swimming) {
  const W = world.gardenWeather;
  const m = e.m;
  if (W?.kind !== 'rain' || world.map.indoor || e.hidden || swimming || e.flying || e.ride || e.scene) return null;
  // (One that loves the rain goes without, face turned up to it.)
  if (hasQuirk(e.rec, 'rainlover')) return null;
  if (pts(e.rec, 'run') < CANT.run || underCover(e.x)) return null;
  if (m.action && !LEAF_OK.has(m.action.name)) return null;
  const keen = 0.22 + hash(e.rec.seed * 3.7) * 0.3;
  return W.k > (m.carry === 'leaf' ? keen - 0.08 : keen) ? 'leaf' : null;
}
// Where Mochi `e`'s own mind has it going by day, choosing something new once it's done the last.
function brainTarget(world, life, e) {
  const rec = e.rec;
  const m = e.m;
  const br = (e.brain ??= { plan: null, memory: [], tick: 0 });
  const t = world.now;
  // (In the middle of a game with a friend, the game has it: world/garden-life.js duos.)
  if (e.duo) {
    br.plan = null;
    return e.x;
  }
  let p = br.plan;
  // (Going over to someone: wherever they've got to.)
  if (p?.follow && (!p.arrived || (p.tag && t < (p.until ?? 0)))) {
    const f = p.follow === 'you' ? world.body : p.follow;
    if (!f || (f !== world.body && (f.hidden || f.x == null))) p = br.plan = null;
    else {
      const off = (e.x < f.x ? -1 : 1) * (p.follow === 'you' ? 24 : 14);
      // (To you, right up to you wherever you stand; to a friend, beside it but not inside the well.)
      p.x = p.follow === 'you' ? f.x + off : besideProps(f.x + off, f.x - off);
    }
  }
  // Arrived: what it came for, and a while at it.
  if (p && !p.arrived && Math.abs(e.x - p.x) < (p.follow ? 8 : 3)) {
    p.arrived = true;
    if (p.face != null) m.dir = Math.sign(p.face - e.x) || m.dir;
    else if (p.follow) m.dir = Math.sign((p.follow === 'you' ? world.body.x : p.follow.x) - e.x) || m.dir;
    if (p.ride && !startRide(world, e, p.act)) p = br.plan = null;
    // (Gone over to ask a friend to play: does it want to? world/mochi-heart.js accepts.)
    else if (p.invite) {
      askToPlay(world, life, e, p);
      p = br.plan = null;
    } else {
      if (p.act && !p.ride) m.action = { name: p.act, t0: null, ...(p.hold ? { hold: p.hold } : {}) };
      arrivedAt(world, life, e, p);
      // (Part 3: the more it needed it, the more it comes to like doing it.)
      learn(rec, p.like ?? p.kind, enjoyment(rec, p.gains));
      // (Part 2: meeting up with a friend brings them closer.)
      const pal = p.pal ?? (p.follow && p.follow !== 'you' ? p.follow : null);
      if (pal?.rec) befriend(rec, pal.rec, p.id === 'napwith' ? 2 : 1);
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
    // (What it feels and its own habits lean every choice: world/mochi-heart.js.)
    const opts = brainOptions(world, life, e);
    for (const o of opts) o.boost = (o.boost ?? 1) * feelWant(e, o, t) * quirkWant(rec, o);
    const best = choose(rec, opts, e.x, br.memory, br.tick++, m.dir);
    br.plan = best ? { ...best, at: t, arrived: false } : null;
    if (best) {
      br.memory.push(best.id);
      if (br.memory.length > 5) br.memory.shift();
      // (A thought bubble says what it's off to do, by what it needs: render/garden.js.)
      const loved = (likesOf(rec)[best.like ?? best.kind] ?? 0) >= 0.5;
      if (best.id !== 'rest' || needsOf(rec).energy < 40) e.thought = { need: loved ? 'love' : mainNeed(best.gains), t0: t };
    }
  }
  return br.plan ? br.plan.x : e.x;
}

// ---------- Rides: the swing, the slide, the bouncy mushroom, and a glide off the cliff ----------
// The play things in the meadow (world/garden.js) and what a Mochi does on each. Each ride is a path
// through time (ridePath): where the Mochi is, which way it faces, how it moves (walking, climbing,
// flying), and for the swing the angle of the ropes, for the mushroom how far its cap is pressed
// down. While one rides, the clock's plans for it wait; it ends on the grass, cheering.
// (`swing` is the big tree's x, the swing hung 80 along its branch; each follows its piece, null while
// it's put away: applyLayout. The glide is the cliff's, and stays.)
export const PLAY = { swing: 1660, slide: 1830, mush: 1965, glide: 2050 };
// The see-saw (2026-11-15), on the flat at the foot of the slope: two Mochi, one on each end, up and
// down; one on its own sits and waits for a friend a while (render/garden.js mg_seesaw draws the
// board at `map.seesawAngle`, + with the right end down).
export const SEESAW = { x: 1468, half: 24, pivot: 8, tilt: 0.3, wait: 10, ride: 7.2, beat: 1.6 };
// How a Mochi plays with its toys (render/mochi-toys.js): gently, playfully, or boldly.
const GENTLE = new Set(['shy', 'timid', 'gentle', 'sweet', 'dreamy', 'sleepy', 'polite', 'lazy', 'clingy', 'loner', 'stoic']);
const BOLD = new Set(['showoff', 'brave', 'proud', 'bossy', 'sassy', 'sporty', 'cool', 'dramatic', 'grumpy', 'artsy']);
export const playStyle = (rec) => (BOLD.has(rec.personality) ? 2 : GENTLE.has(rec.personality) ? 0 : 1);
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
      // (A real bounce: quick off the cap, a hang at the top, quick back down - a parabola, not a
      // sine, which floated at the top and stopped dead on the cap. The last one's the biggest.)
      const h = b >= 2.4 ? 19 : 16;
      return { x: mx, y: top - h * 4 * f * (1 - f), dir: 1, dip: Math.max(0, 1 - Math.min(f, 1 - f) / 0.14) };
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
  if (kind === 'seesaw') return SEESAW.x != null && startSeesaw(world, life, e);
  if ((kind === 'swing' ? PLAY.swing : kind === 'slide' ? PLAY.slide : kind === 'bounce' ? PLAY.mush : PLAY.glide) == null) return false;
  if (life?.mochi.some((o) => o !== e && o.ride?.kind === kind)) return false;
  e.ride = { kind, t0: world.now };
  const r = RIDES[kind];
  e.m.action = r?.act ? { name: r.act, t0: world.now, hold: r.hold } : null;
  return true;
}
// One step of a ride: true while it is still going.
function rideStep(world, e, map) {
  const r = e.ride;
  if (r.kind === 'seesaw') return seesawStep(world, e, map);
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
// ---------- The see-saw ----------
// On it: up onto its end and sat, then waiting for a friend - or, someone's waiting, the other end, and
// off they go. (`seat` 0 the left end, facing right; 1 the right, facing left.)
function startSeesaw(world, life, e) {
  const on = (life?.mochi ?? []).filter((o) => o !== e && o.ride?.kind === 'seesaw');
  if (on.length >= 2 || (on[0] && !on[0].ride.waiting)) return false;
  const other = on[0] ?? null;
  const seat = other ? 1 - other.ride.seat : (e.x ?? SEESAW.x) < SEESAW.x ? 0 : 1;
  e.ride = { kind: 'seesaw', t0: world.now, seat, from: e.x ?? SEESAW.x + (seat ? 1 : -1) * 36 };
  if (other) {
    // (Off they go once it's up and sat: the board starts from the end that was down.)
    const go = world.now + 0.75;
    Object.assign(other.ride, { waiting: false, go, pair: e });
    Object.assign(e.ride, { go, pair: other });
    life.seesaw = { go, down: other.ride.seat };
    diary(world, life, 'seesaw', other, e);
  } else e.ride.waiting = true;
  e.m.action = { name: 'seesawsit', t0: world.now, hold: 60 };
  return true;
}
// The board's tilt now (+: the right end down), and where a rider on `seat` sits on it.
function seesawAngle(world, life) {
  const riders = (life?.mochi ?? []).filter((o) => o.ride?.kind === 'seesaw' && o.ride.sat);
  const S = life?.seesaw;
  if (S && riders.length === 2 && world.now >= S.go) {
    const u = world.now - S.go;
    const k = Math.min(1, u / 0.6) * Math.min(1, Math.max(0, (SEESAW.ride - u) / 0.8));
    const sway = Math.cos((2 * Math.PI * u) / SEESAW.beat);
    // (Easing in from the end that was down, and out to level.)
    return (S.down ? 1 : -1) * SEESAW.tilt * (k * sway + (1 - k) * (u < 1 ? 1 : 0));
  }
  if (riders.length === 1) return (riders[0].ride.seat ? 1 : -1) * SEESAW.tilt;
  return -SEESAW.tilt;
}
const seatAt = (map, seat, a) => {
  const g = groundAt(map, SEESAW.x) - SEESAW.pivot;
  const s = seat ? 1 : -1;
  const r = SEESAW.half - 2;
  return [SEESAW.x + s * r * Math.cos(a), g + s * r * Math.sin(a) - 1.5];
};
function seesawStep(world, e, map) {
  const life = world.gardenLife;
  const r = e.ride;
  const m = e.m;
  const t = world.now - r.t0;
  const target = seesawAngle(world, life);
  // (The board swings over smoothly whatever it's doing: eased on toward where it's going.)
  map.seesawAngle = map.seesawAngle == null ? target : map.seesawAngle + (target - map.seesawAngle) * Math.min(1, 0.18);
  const a = map.seesawAngle;
  const dir = r.seat ? -1 : 1;
  const [sx, sy] = seatAt(map, r.seat, a);
  const off = [SEESAW.x + (r.seat ? 1 : -1) * (SEESAW.half + 12), groundAt(map, SEESAW.x + (r.seat ? 1 : -1) * (SEESAW.half + 12))];
  let x = sx;
  let y = sy;
  // Up onto the end.
  if (t < 0.5) {
    [x, y] = hop([r.from, groundAt(map, r.from)], [sx, sy], easeIO(t / 0.5), 10);
  } else if (!r.sat) r.sat = true;
  const ride = r.go != null ? world.now - r.go : null;
  // Waited long enough on its own: a sigh, and off. Ridden its fill: off, both.
  if (!r.leave && ((r.waiting && t > SEESAW.wait) || (ride != null && ride > SEESAW.ride))) {
    r.leave = world.now;
    r.alone = r.waiting;
    m.action = null;
  }
  if (r.leave != null) {
    const u = Math.min(1, (world.now - r.leave) / 0.55);
    [x, y] = hop([sx, sy], off, easeIO(u), 10);
    if (u >= 1) {
      e.ride = null;
      m.hillLean = 0;
      if (life?.seesaw && !(life.mochi ?? []).some((o) => o.ride?.kind === 'seesaw')) life.seesaw = null;
      m.action = { name: r.alone ? 'sigh' : 'cheer', t0: null };
      e.x = off[0];
      e.y = off[1];
      return false;
    }
  } else if (ride != null && ride >= 0 && m.action?.name === 'seesawsit') m.action = { name: `seesaw${playStyle(e.rec)}`, t0: world.now, hold: SEESAW.ride };
  const moved = Math.abs(x - (e.x ?? x));
  e.x = x;
  e.y = y;
  e.baseY = null;
  e.yOff = 0;
  e.vx = 0;
  m.dir = dir;
  m.mode = 'run';
  m.dist += moved;
  m.speed = 0;
  // (Sat on the board, it tips with it: forward as its end goes down, back as it comes up.)
  m.hillLean = r.sat && r.leave == null ? a * dir * 0.8 : 0;
  return true;
}
// ---------- The garden's own pieces, wherever they stand (world/garden-layout.js) ----------
// Everything here that goes by where a piece is - the rides, the places, the props to stand clear of,
// the shelters, the hiding spots, the crop bed, the toy box, the mailbox, the snowman's spot - from
// the layout. A piece put away: what it was for waits till it's set out again.
const PROP_KINDS = new Set(['mg_mailbox', 'mg_cropbed', 'mg_beanframe', 'mg_flowerbed', 'mg_well', 'mg_seesaw', 'mg_toybox', 'mg_slide', 'mg_mushroom']);
function applyLayout(L) {
  CROP_X = L.crop;
  TOY_X = L.toy;
  MAILBOX_X = L.mailbox;
  PLAY.swing = L.bigtree;
  PLAY.slide = L.slide;
  PLAY.mush = L.mush;
  SEESAW.x = L.seesaw;
  // (Side by side ones run together, so nobody's put down in the gap between.)
  const props = L.pieces.filter((p) => PROP_KINDS.has(FURNITURE_BY_ID[p.id].kind)).map(footOf).sort((a, b) => a[0] - b[0]);
  PROPS.length = 0;
  for (const [a, b] of props) {
    const last = PROPS[PROPS.length - 1];
    if (last && a < last[1] + 14) last[1] = Math.max(last[1], b);
    else PROPS.push([a, b]);
  }
  SHELTERS.length = 0;
  if (L.bigtree != null) SHELTERS.push([L.bigtree, 30]);
  for (const t of L.trees) SHELTERS.push([t.x, 9]);
  SHELTERS.push([NURSERY_DOOR, 16]);
  // (Each beside its own piece - none inside another one set close by: no room there to hide.)
  const of = (kind) => L.pieces.filter((p) => FURNITURE_BY_ID[p.id].kind === kind);
  const spots = [];
  for (const p of of('mg_fruittree')) spots.push([p.x - 18, p]);
  for (const p of of('mg_toybox')) spots.push([p.x + 30, p]);
  for (const p of of('mg_bigtree')) spots.push([p.x - 20, p]);
  for (const p of of('mg_slide')) spots.push([p.x - 44, p]);
  for (const p of of('mg_mushroom')) spots.push([p.x - 37, p]);
  for (const p of of('mg_flowerbed')) spots.push([p.x - (FURNITURE_BY_ID[p.id].extra ? 62 : 40), p]);
  spots.push([NURSERY_DOOR + 46, null]);
  const solid = L.pieces.filter((p) => PROP_KINDS.has(FURNITURE_BY_ID[p.id].kind));
  HIDE_SPOTS.length = 0;
  for (const [x, by] of spots) if (!solid.some((q) => q !== by && x > footOf(q)[0] + 2 && x < footOf(q)[1] - 2)) HIDE_SPOTS.push(x);
  COUNT_TREES.length = 0;
  COUNT_TREES.push(...[...L.trees.map((t) => t.x), ...(L.bigtree != null ? [L.bigtree] : [])].sort((a, b) => a - b));
  PLACES.length = 0;
  PLACES.push(...placesFor(L));
  const on = standing(L.list ?? []);
  // (With room for the Mochi patting it either side; the pieces still where they always stood were
  // laid out round it.)
  SNOWMAN_X = festivalSpot({ x: 1240, w: 72 }, on, gardenSpotWhy, (p) => FURNITURE_BY_ID[p.id]?.w) ?? festivalSpot({ x: 1240, w: 36 }, on, gardenSpotWhy, (p) => FURNITURE_BY_ID[p.id]?.w) ?? 1240;
}
// Something was moved or put away: the rides on it end (Decorate won't pick up one in use: busyPiece),
// a game of hide-and-seek or a snack under a tree wraps up (its tree may have gone), and every Mochi
// thinks again about where it's off to.
function layoutMoved(world, map, life) {
  life.duos = (life.duos ?? []).filter((d) => {
    if (d.kind !== 'hide' && d.kind !== 'snack') return true;
    endDuo(world, life, d, true);
    return false;
  });
  for (const e of life.mochi ?? []) {
    if (e.ride) {
      e.ride = null;
      e.m.hillLean = 0;
      e.m.glideLean = 0;
      e.m.action = null;
    }
    if (e.brain?.plan && !e.duo) e.brain.plan = null;
    e.toyTurn = null;
  }
  life.seesaw = null;
  map.swingAngle = null;
  map.mushDip = 0;
}
// (The ground the Mochi keep out of when they idle, for the tests: [[x1, x2]].)
export const propsNow = () => PROPS.map(([a, b]) => [a, b]);
// The Mochi using garden piece `p` right now (on its ride), or null: Decorate leaves it be till it's done.
const RIDE_OF = { mg_bigtree: 'swing', mg_slide: 'slide', mg_mushroom: 'bounce', mg_seesaw: 'seesaw' };
export function busyPiece(world, p) {
  const ride = RIDE_OF[FURNITURE_BY_ID[p?.id]?.kind];
  if (!ride) return null;
  return (world.gardenLife?.mochi ?? []).find((e) => e.ride?.kind === ride) ?? null;
}
// (With nobody on it, it rests on its left end.)
export function restSeesaw(map, life) {
  if ((life?.mochi ?? []).some((o) => o.ride?.kind === 'seesaw')) return;
  const target = -SEESAW.tilt;
  map.seesawAngle = map.seesawAngle == null ? target : map.seesawAngle + (target - map.seesawAngle) * 0.12;
}

// Where the Mochi stop to idle: never inside one of the square's or the meadow's things, so none
// is ever seen standing in the well or half inside the slide. (Places and rides are their own.)
// (The ground taken by the mailbox, the vegetable patch, the flower beds, the well, the see-saw, the
// toy box, the slide and the mushroom, wherever they stand: applyLayout.)
const PROPS = [[214, 238], [384, 568], [636, 726], [764, 818], [1124, 1216], [1434, 1502], [1560, 1604], [1784, 1884], [1932, 2000]];
// The nearest x to `x` with `half` either side clear of them all (a game of two, played out on open
// grass), or failing that, clear where it stands.
const DUO_SPAN = { tag: 78, squabble: 70, dance: 32, sumo: 48, trick: 26 };
function clearSpan(x, half) {
  for (let d = 0; d <= 480; d += 4) {
    for (const s of d ? [1, -1] : [1]) {
      const c = x + s * d;
      if (c - half < LAND[0] || c + half > LAND[1]) continue;
      if (!PROPS.some(([a, b]) => c + half > a && c - half < b)) return c;
    }
  }
  return clearOfProps(x);
}
// `x`, or if that's inside one of them, `alt` (the other side of whatever it was going to), or the
// nearest clear spot.
const inProps = (v) => PROPS.some(([a, b]) => v > a && v < b);
function besideProps(x, alt) {
  if (!inProps(x)) return x;
  return alt != null && !inProps(alt) ? alt : clearOfProps(x);
}
function clearOfProps(x) {
  for (const [a, b] of PROPS) if (x > a && x < b) return x - a < b - x ? a - 6 : b + 6;
  return x;
}
const always = () => true;
const swimmer = (rec) => pts(rec, 'swim') >= CANT.swim;
const flyer = (rec) => pts(rec, 'fly') >= CANT.fly;
// (Each place is by its piece, wherever that stands: placesFor, from the layout.)
const PLACES = [];
function placesFor(L) {
  const out = [];
  if (L.bigtree != null) out.push({ x: L.bigtree, spread: 16, act: 'nap', hold: 7, who: always, when: 'day' });
  for (const t of L.trees) out.push({ x: t.x, spread: 10, act: 'reach', who: always, when: 'day' });
  out.push({ x: 2090, spread: 6, act: 'paddle', who: swimmer, when: 'day' });
  if (L.bigtree != null) out.push({ x: L.bigtree - 52, spread: 12, act: 'meditate', who: always, when: 'night' });
  // The flower beds: a roll about in the pink one, a nap among the blue.
  for (const b of L.beds) out.push({ x: b.x, spread: 12, act: b.v ? 'nap' : 'roll', ...(b.v ? { hold: 7 } : {}), who: always, when: 'day' });
  // Garden chores, so it is lived in: watering the vegetable patch, winding up the well's bucket, a
  // good sniff of each flower bed (`face`: what it turns to once there).
  if (L.crop != null) out.push({ x: L.crop - 62, spread: 0, act: 'water', face: L.crop, who: always, when: 'day' });
  if (L.well != null) out.push({ x: L.well + 38, spread: 0, act: 'crank', hold: 5.2, face: L.well, who: always, when: 'day' });
  for (const b of L.beds) out.push({ x: b.x + (b.v ? 58 : -52), spread: 0, act: 'sniff', face: b.x, who: always, when: 'day' });
  // (While there's post in the mailbox, a peek inside: `mail`.)
  if (L.mailbox != null) out.push({ x: L.mailbox + 18, spread: 0, act: 'peek', face: L.mailbox, mail: true, who: always, when: 'day' });
  // The play things, and for a flyer a glide off the cliff (rides: startRide).
  if (L.bigtree != null) out.push({ x: L.bigtree + 60, spread: 0, act: 'swing', ride: true, who: always, when: 'day' });
  if (L.slide != null) out.push({ x: L.slide - 37, spread: 0, act: 'slide', ride: true, who: always, when: 'day' });
  if (L.mush != null) out.push({ x: L.mush - 30, spread: 0, act: 'bounce', ride: true, who: always, when: 'day' });
  out.push({ x: PLAY.glide, spread: 0, act: 'glide', ride: true, who: flyer, when: 'day' });
  return out;
}
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
  // The festival, if it's a festival day (world/garden-festival.js): the market's stall opens for it.
  festivalTick(world);
  // (In the Mochi Market there is nothing else of the garden's to look after.)
  if (life.market) return;
  // The weather (world/garden-weather.js): the same for everyone, by the clock.
  gardenWeatherTick(world);
  festivalWeather(world);
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
  // The garden's own pieces, wherever they're set out (world/garden-layout.js): everything that goes by
  // them follows. (Your own garden gets its pieces the first time.)
  if (!world.gardenVisit && map.id === 'garden' && seedGarden(world.char.garden, (x) => groundAt(map, x))) life.layoutVersion = null;
  const L = syncGarden(map, life.owner ?? world.char);
  if (life.layoutVersion !== L.version) {
    if (life.layoutVersion != null) layoutMoved(world, map, life);
    life.layoutVersion = L.version;
    applyLayout(L);
  }
  // (The see-saw settles back onto its end when nobody's on it.)
  if (map.garden && !map.indoor && SEESAW.x != null) restSeesaw(map, life);
  const now = Date.now() / 1000;
  // (The world's own night: the game clock, or what a scene or a test has set.)
  // (A festival night, they're up late watching the moon.)
  const night = (world.night ?? nightOf(new Date())) > 0.5 && !stayUp(world.gardenFestival);
  const inside = Boolean(map.indoor);
  // Greeting: the first moment you're here, the Mochi who love you most come running.
  const owner = !world.gardenVisit;
  if (!life.greeted && !inside && !night && owner) {
    life.greeted = true;
    life.mochi.forEach((e, i) => {
      if (e.guest) return;
      // (What it remembers of you: how long you've been gone, world/mochi-heart.js welcomeOf.)
      const mem = memoryOf(e.rec);
      const away = mem.seen ? now - mem.seen : 0;
      mem.visits += 1;
      const w = welcomeOf(e.rec, away);
      if (w?.kind === 'missed') {
        e.greet = { until: now + 7 + i * 0.4, missed: true };
        feel(e, 'excited', w.k, world.now, 'you');
        diary(world, life, 'missed', e);
      } else if ((e.rec.bond ?? 0) >= 250) e.greet = { until: now + 6 + i * 0.4 };
      else if (w?.kind === 'shy') feel(e, 'shy', w.k, world.now, 'you');
    });
  }
  // (You're here: it remembers it saw you, today.)
  if (owner && !inside && !night) for (const e of life.mochi) if (!e.guest) memoryOf(e.rec).seen = now;
  // (How long you've stood still: one that loves you comes and sits by you.)
  const b0 = world.body;
  life.stillX ??= b0.x;
  life.still = Math.abs(b0.x - life.stillX) < 3 && b0.onGround !== false ? (life.still ?? 0) + dt : 0;
  if (life.still === 0) life.stillX = b0.x;
  // (You jumping: the ones fond of you who are close jump along with you.)
  const hopNow = b0.vy < -60 && life.wasGround;
  life.wasGround = b0.onGround !== false && Math.abs(b0.vy ?? 0) < 1;
  if (hopNow && owner) life.mochi.forEach((e, i) => {
    if (e.guest || e.duo || e.ride || e.hidden || e.x == null || (e.rec.bond ?? 0) < 200 || Math.abs(e.x - b0.x) > 120) return;
    if (e.m.action || Math.abs(e.vx ?? 0) > 2) return;
    e.copyAt = world.now + 0.25 + (i % 3) * 0.18;
  });
  if (life.caring && !life.mochi.includes(life.caring)) life.caring = null;
  const gone = [];
  // Night owls: up to two stay out after dark (the night-loving kinds, and anyone just hatched), so
  // the Garden is never empty at night; the rest go to bed in the nursery.
  const owls = night ? new Set(life.mochi.filter((e) => nightOwl(e.rec)).slice(0, 2)) : new Set();
  life.mochi.forEach((e, i) => {
    const { rec } = e;
    // (Its leaf umbrella only while the rain and what it's doing call for one: leafFor, below.)
    if (e.m) e.m.carry = null;
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
        diary(world, life, 'reborn', e);
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
      diary(world, life, 'evolved', e, null, `${/^[AEIOU]/.test(STAGES[out.stage] ?? '') ? 'an' : 'a'} ${STAGES[out.stage] ?? out.stage}`);
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
      // (A night's sleep puts its energy back, and it wakes with a fresh mind: yesterday's plans are gone.)
      if (night && e.brain?.plan) e.brain.plan = null;
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
    // (Carrying the harvest in: that first.)
    if (e.chore && (night || e.guest)) e.chore = null;
    if (e.chore) target = choreTarget(world, e);
    const minded = !e.chore && !night && !e.guest && e.x != null && !e.scene;
    if (minded) {
      drainNeeds(rec, dt, Math.abs(e.vx ?? 0) > 2, pts(rec, 'run') >= CANT.run ? 1 : 2);
      // (Always a bit peckish: hunger runs down half as fast again.)
      if (hasQuirk(rec, 'snacker')) needsOf(rec).hunger = Math.max(0, needsOf(rec).hunger - 0.04 * dt);
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
    const mo = e.duo;
    const inMoment = mo && !other && e.x != null;
    if (inMoment) {
      target = duoTarget(world, mo, e);
      // (Asked while walking past the well, it doesn't stop inside it to say no: it steps clear first.
      // Hiding in a flower bed is another thing.)
      if (mo.kind !== 'hide' && inProps(target)) target = clearOfProps(target);
    }
    // (Being cared for, it stays put, looking up at you.)
    const busy = now < (e.busyUntil ?? 0);
    // (A sweet of yours on the grass beats staying put: you put one down from its care panel, which
    // holds it at your side, and it would stand there looking at you until you walked away.)
    if (busy && !drop && e.x != null) target = e.x;
    // (One who can't swim yet stops at the water's edge.)
    if (pts(rec, 'swim') < CANT.swim && target > LAND[1]) target = LAND[1];
    if (e.x == null) e.x = sched.x;
    const wet = footingAt(map, e.x).swim;
    const v0 = wet ? (pts(rec, 'swim') >= CANT.swim ? SWIM_SPEED[tierOf(rec, 'swim')] * 0.6 : 18) : strollSpeed(rec) * (e.greet ? 2 : Math.abs(target - e.x) > 40 ? 1.5 : 1) * (e.brain?.plan?.dash && !e.brain.plan.arrived ? 2.6 : 1);
    // (As it feels: skipping along when it's happy, trudging when it's sulking or lonely.)
    const fl = feelingOf(e, world.now);
    const vf = v0 * (fl && fl.k >= 0.3 ? FEELINGS[fl.kind].walk : 1);
    const v = other ? Math.max(vf, 40) : e.ballChase && !e.ballPlayed ? Math.max(vf, 52) : inMoment ? Math.max(vf, mo.kind === 'tag' ? 50 : mo.kind === 'hide' || mo.kind === 'pound' ? 44 : 26) : vf;
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
    else if (inMoment) m.dir = duoFacing(mo, e);
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
    m.carry = leafFor(world, e, foot.swim);
    // (In a wind its hair streams with it, and walking into it, it leans in: each gust a little
    // differently, stepped, so its drawings come round again.)
    const Wn = world.gardenWeather;
    const gust = Wn?.kind === 'wind' && !inside ? Wn.k * (0.65 + 0.35 * Math.sin(world.now * 0.9 + rec.seed)) : 0;
    m.windHair = gust ? Math.round((m.dir === WIND_DIR ? -3 : 2) * gust * 2) / 2 : 0;
    m.hillLean = gust && m.dir === -WIND_DIR && m.speed > 2 ? Math.round(gust * 0.12 * 20) / 20 : 0;
    // A greeting ends in a happy wave.
    if (e.greet && Math.abs(dx) <= 0.5 && !e.waved) {
      e.waved = true;
      // (Missed you: a run-up bounce and a great big hug.)
      m.action = e.greet.missed ? { name: 'missyou', t0: null } : { name: 'cheer', t0: null, hold: 1.5 };
      if (e.greet.missed) feel(e, 'loving', 0.9, world.now, 'you');
    }
    // (You jumped: it jumps too.)
    if (e.copyAt && world.now >= e.copyAt) {
      e.copyAt = null;
      if (!m.action && !e.duo && Math.abs(e.vx ?? 0) < 2) {
        m.dir = Math.sign(world.body.x - e.x) || m.dir;
        m.action = { name: 'hops', t0: null };
        feel(e, 'joy', 0.5, world.now, 'you');
      }
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
  if (!inside) tickDuos(world, life, night);
  if (!inside) tickHearts(world, life, night, dt);
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
  // (When it was last picked goes by the tree, so moving it doesn't ripen it.)
  const id = tree[3] != null ? `t${tree[3]}` : tree[1];
  const now = Date.now() / 1000;
  // (The tree sways hard for a moment: render/garden.js reads `map.shook`.)
  (map.shook ??= {})[tree[1]] = world.now;
  const shaken = ((world.char.garden ??= { mochi: [], eggs: [], unlocked: {} }).shaken ??= {});
  if (now - (shaken[id] ?? -1e9) < TREE_REST) {
    world.log('It rustles... nothing ripe yet.', '#c8d8b8');
    return true;
  }
  shaken[id] = now;
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
  // (Cared for by you: it feels loved.)
  feel(e, 'loving', 0.7, world.now, 'you');
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
  // (Part 2: it remembers you gave it its favourite.)
  if (e.rec.loves === SWEET_BY_ID[d.id]?.kind) e.rec.lovedAt = Date.now() / 1000;
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
  if (e.rec.loves === SWEET_BY_ID[id]?.kind) e.rec.lovedAt = Date.now() / 1000;
  // (It remembers what you gave it, and is all smiles.)
  const mem = memoryOf(e.rec);
  mem.given[id] = (mem.given[id] ?? 0) + 1;
  feel(e, e.rec.loves === SWEET_BY_ID[id]?.kind ? 'loving' : 'joy', 0.8, world.now, 'you');
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

// ---------- Their hearts: feelings, habits, games together, and you (world/mochi-heart.js) ----------
// (The clock no longer starts their moments together: each Mochi's own mind does. One goes over to a
// friend and asks it to play - tag, hide-and-seek, a chat, a dance, showing off a trick, a snack -
// and the friend says yes or no, as it feels. A kind one comes to comfort a friend who's sad; a
// gentle one makes up with one it fell out with; two who don't get on, bumping into each other,
// have a squabble.)
export const momentOf = (personality) => gameFor({ personality, tricks: ['wave'] }, {}, 0);
const DUO_SECS = { tag: 10, hide: 13, chat: 7.6, trick: 6.6, dance: 7, snack: 9, comfort: 7.6, makeup: 7.6, squabble: 5, decline: 2.6, pound: 12, snowball: 9.4, sumo: 9.6 };
const SNUBS = ['grumpy', 'loner'];
// Where to hide in hide-and-seek: tucked in beside the garden's big things.
// (Beside the trees, the toy box, the slide, the mushroom, the beds, wherever they stand, and by the
// nursery: applyLayout.)
const HIDE_SPOTS = [1520, 1612, 1640, 1786, 1928, 1108, 640, 1036, 2052];
// The trees to count against.
const COUNT_TREES = [1537, 1660, 2074];
// Everything a Mochi could do with others, or because of its habits, or for you.
function heartOptions(world, life, e, out, walker) {
  const rec = e.rec;
  const now = world.now;
  const mine = !e.guest && !world.gardenVisit;
  const tick = e.brain?.tick ?? 0;
  // Asking a friend to play (the friendliest and nearest few).
  // (Not one out in the pond, if it can't swim out to it.)
  const reach = (o) => o.x <= LAND[1] || pts(rec, 'swim') >= CANT.swim;
  const others = life.mochi.filter((o) => o !== e && !o.hidden && o.x != null && !o.guest && !o.duo && !o.ride && !o.scene && Math.abs(o.x - e.x) < 600 && reach(o));
  const cands = others.map((o) => [o, friendsOf(rec)[o.rec.seed] ?? 0]).sort((p, q) => q[1] - p[1] || Math.abs(p[0].x - e.x) - Math.abs(q[0].x - e.x)).slice(0, 3);
  for (const [o, f] of cands) {
    if (life.mochi.some((q) => q !== e && q.brain?.plan?.invite?.with === o)) continue;
    let kind;
    if (isRival(rec, o.rec)) {
      if (f > -40 && (KIND_HEARTS.has(rec.personality) || hasQuirk(rec, 'cuddler')) && !SAD.has(feelingOf(e, now)?.kind)) kind = 'makeup';
      else continue;
    } else kind = gameFor(rec, o, now, hash(rec.seed * 0.37 + o.rec.seed * 0.11 + Math.floor(now / 30)));
    // (A festival night, the moon's up: no games - only a sad friend gets fetched away from it.)
    if ((world.gardenFestival?.eve ?? 0) > 0.25 && kind !== 'comfort' && kind !== 'makeup') continue;
    // (A festival day: off to pound mochi together at the mortar, now and then - one pair at a time.)
    const F = world.gardenFestival;
    const festGame = F?.id === 'snow' ? 'snowball' : F?.id === 'moon' ? 'pound' : null;
    if (festGame && F.k > 0.5 && F.eve < 0.25 && kind !== 'makeup' && kind !== 'comfort' && (life.duos ?? []).filter((d) => d.kind === festGame).length < (festGame === 'pound' ? 1 : 2) && hash(rec.seed * 0.53 + o.rec.seed * 0.29 + Math.floor(now / 40)) < 0.4) kind = festGame;
    const running = ['tag', 'hide', 'dance', 'snack'].includes(kind);
    if (running && (pts(rec, 'run') < CANT.run || pts(o.rec, 'run') < CANT.run)) kind = 'chat';
    const fun = ['chat', 'comfort', 'makeup'].includes(kind) ? 15 : 40;
    const boost = (kind === 'comfort' ? 2.8 : kind === 'makeup' ? 1.4 : 1) * (1 + Math.max(0, f) / 70);
    out.push({ id: `invite${o.rec.seed}`, kind: 'social', like: running ? 'play' : 'social', x: o.x, follow: o, invite: { kind, with: o }, gains: { social: 45, fun }, boost, stay: 2 });
  }
  if (!walker) return;
  const q = quirksOf(rec);
  const spot = (k) => clearOfProps(Math.max(LAND[0] + 30, Math.min(LAND[1] - 30, (e.x ?? LAND[0]) + (hash(rec.seed * 2.7 + k + tick * 0.37) - 0.5) * 360)));
  // A collector off after a little treasure in the grass.
  if (q.includes('collector')) out.push({ id: 'collect', kind: 'explore', like: 'explore', x: spot(1), act: 'peek', gains: { curious: 30, fun: 15 }, stay: 3 });
  // A stargazer looking up as the evening comes.
  const dusk = world.night ?? nightOf(new Date());
  if (q.includes('stargazer') && dusk > 0.25 && dusk <= 0.5) out.push({ id: 'stargaze', kind: 'explore', like: 'explore', x: spot(2), act: 'wow', hold: 6, gains: { curious: 35 }, boost: 2.5, stay: 6 });
  // An early bird's morning stretch by the well, once a day.
  const day = Math.floor(Date.now() / 86400000);
  const mem = memoryOf(rec);
  if (q.includes('earlybird') && mem.stretchDay !== day) out.push({ id: 'stretch', kind: 'rest', like: 'rest', x: clearOfProps((LAYOUT.well ?? 790) + 46 + (hash(rec.seed) - 0.5) * 16), face: LAYOUT.well ?? 790, act: 'stretch', gains: { energy: 20, fun: 10 }, boost: 4, stay: 3, stretch: day });
  // A show-off: a trick for whoever's there to see it.
  if (q.includes('showy') && rec.tricks?.length) {
    const fan = life.mochi.find((o) => o !== e && o.x != null && !o.hidden && Math.abs(o.x - e.x) < 90) ?? (mine && Math.abs(world.body.x - e.x) < 90 ? world.body : null);
    if (fan) out.push({ id: 'showoff', kind: 'play', like: 'play', x: e.x, face: fan.x, act: rec.tricks[Math.floor(hash(rec.seed + tick) * rec.tricks.length) % rec.tricks.length], gains: { fun: 25, social: 25 }, boost: 1.6, stay: 3, proud: true });
  }
  if (!mine || !world.map.garden || world.map.indoor) return;
  // A present for you: off to find one, then straight to you with it.
  if (e.giftFound) out.push({ id: 'givegift', kind: 'social', like: 'social', x: world.body.x, follow: 'you', act: 'giftgive', gift: e.giftFound, gains: { social: 40 }, boost: 14, stay: 3.2 });
  else if (giftDue(rec, day, hash(rec.seed * 3.3 + day * 0.77))) out.push({ id: 'findgift', kind: 'explore', like: 'explore', x: spot(3), act: 'peek', gains: { curious: 25 }, boost: 2.2, stay: 2.6, findGift: true });
  // You've stood still a while: one that loves you comes and sits by you (two at most, a side each).
  if ((life.still ?? 0) > 4 && (rec.bond ?? 0) >= 300 && Math.abs(world.body.x - e.x) < 260) {
    const sat = life.mochi.filter((o) => o !== e && (o.brain?.plan?.id === 'sitby' || o.m.action?.name === 'sitby'));
    if (sat.length < 2) {
      const side = sat.length ? (sat[0].x < world.body.x ? 1 : -1) : e.x < world.body.x ? -1 : 1;
      out.push({ id: 'sitby', kind: 'social', like: 'social', x: world.body.x + side * 16, face: world.body.x, act: 'sitby', hold: 60, gains: { social: 45, energy: 15 }, boost: 3 + (rec.bond ?? 0) / 300, stay: 60, sitby: true });
    }
  }
  // Something new in the garden: a piece you've just set out, a Mochi just hatched. Come and see!
  for (const n of life.news ?? []) {
    if (now > n.until || Math.abs(n.x - e.x) > 700 || n.seen.has(rec.seed) || n.who === e) continue;
    const near = e.x < n.x ? -1 : 1;
    const at = n.foot ? besideProps(n.foot[near < 0 ? 0 : 1] + near * 8, n.foot[near < 0 ? 1 : 0] - near * 8) : n.x + near * 16;
    out.push({ id: `news${n.id}`, kind: 'explore', like: 'explore', x: at, face: n.x, act: hash(rec.seed + n.x) < 0.5 ? 'peek' : 'wow', gains: { curious: 55, social: n.who ? 25 : 0 }, boost: 2.4, stay: 3, news: n });
  }
}
// How its habits lean an option.
function quirkWant(rec, o) {
  const q = quirksOf(rec);
  let k = 1;
  if (q.includes('napper') && o.kind === 'rest') k *= 1.6;
  if (q.includes('snacker') && o.kind === 'snack') k *= 1.4;
  if (q.includes('sniffer') && o.act === 'sniff') k *= 2.5;
  if (q.includes('cuddler') && (o.invite?.kind === 'comfort' || o.id === 'napwith' || o.id === 'sitby')) k *= 2;
  if (q.includes('wary') && (o.id === 'swim' || o.act === 'paddle' || (o.act === 'wow' && /^decor/.test(o.id)))) k *= 0.25;
  if (q.includes('rainlover') && o.wet) k *= 2.5;
  return k;
}
// What it feels, and what it remembers, once it's got where it was going.
// The garden's diary (data/mochi-diary.js): what they got up to, written in your own garden.
function diary(world, life, k, a, b = null, x = null) {
  if (world.gardenVisit || !life.owner?.garden) return;
  noteDiary(life.owner.garden, diaryDay(world.dayClock?.() ?? new Date()), k, b ? [a.rec, b.rec] : [a.rec], x);
}
function arrivedAt(world, life, e, p) {
  const now = world.now;
  if (p.kind === 'play' || p.kind === 'ride') feel(e, 'joy', 0.4, now);
  if (p.proud) feel(e, 'proud', 0.7, now);
  if (p.stretch != null) memoryOf(e.rec).stretchDay = p.stretch;
  if (p.findGift) e.giftFound = giftOf(e.rec, hash(e.rec.seed * 5.1 + Math.floor(now)));
  if (p.gift) {
    e.m.gift = p.gift;
    e.giftAt = now + 1.9;
  }
  if (p.news) {
    p.news.seen.add(e.rec.seed);
    feel(e, 'curious', 0.7, now);
    if (p.news.what) diary(world, life, 'news', e, null, p.news.what);
    else if (p.news.who && p.news.who !== e) diary(world, life, 'hello', e, p.news.who);
  }
  if (p.sitby) {
    feel(e, 'loving', 0.8, now, 'you');
    diary(world, life, 'sitby', e);
  }
  if (p.bow) life.festBowed?.seen.add(e.rec.seed);
  if (p.light != null && world.gardenFestival) {
    litLanterns(life, world.gardenFestival).add(p.light);
    diary(world, life, 'litlantern', e);
  }
  if (p.hanami) diary(world, life, 'hanami', e);
  if (p.hanabi) diary(world, life, 'hanabi', e);
  if (p.boat && world.gardenFestival) {
    // (Its boat set on the water at the bank, drifting off across the pond: render/garden-festival.js.)
    const B = (life.festBoats ??= { day: world.gardenFestival.day, set: new Set(), boats: [] });
    B.set.add(e.rec.seed);
    B.boats.push({ t0: now + 1.4, x0: LAUNCH + 22, seed: e.rec.seed });
    diary(world, life, 'boat', e);
  }
  if (p.warm) {
    feel(e, 'loving', 0.55, now, 'lantern');
    diary(world, life, 'warm', e);
  }
  if (p.moon) {
    feel(e, 'loving', 0.6, now, 'moon');
    diary(world, life, 'moon', e);
  }
}
// Asked a friend: does it want to?
function askToPlay(world, life, e, p) {
  const o = p.invite.with;
  const kind = p.invite.kind;
  const now = world.now;
  if (!life.mochi.includes(o) || o.duo || o.ride || o.hidden || o.x == null || Math.abs(o.x - e.x) > 40) return;
  const f = friendsOf(o.rec)[e.rec.seed] ?? 0;
  const yes = accepts(o.rec, f, kind, feelingOf(o, now)?.kind, needsOf(o.rec), hash(o.rec.seed * 1.3 + now * 0.11));
  startDuo(world, life, yes ? kind : 'decline', e, o, kind);
}
export function startDuo(world, life, kind, a, b, asked = kind) {
  const now = world.now;
  const mx = clearSpan(Math.max(LAND[0] + 40, Math.min(LAND[1] - 40, (a.x + b.x) / 2)), DUO_SPAN[kind] ?? 22);
  const duo = { kind, asked, a, b, t0: now, t: 0, mx, side: hash(a.rec.seed * 0.7 + now) < 0.5 ? -1 : 1, done: new Set(), len: DUO_SECS[kind] };
  const near = (list, x, not = null) => [...list].filter((v) => v !== not).sort((p, q) => Math.abs(p - x) - Math.abs(q - x));
  if (kind === 'hide') {
    // (It counts against the nearest tree - or, with none near, right where it is, eyes covered.)
    const tree = near(COUNT_TREES, mx)[0];
    duo.tree = tree != null && Math.abs(tree - b.x) < 150 ? tree : besideProps(b.x + (b.x < mx ? -6 : 6), b.x - (b.x < mx ? -6 : 6));
    const spots = near(HIDE_SPOTS, duo.tree).filter((x) => Math.abs(x - duo.tree) > 40 && Math.abs(x - duo.tree) < 420);
    duo.spot = spots[Math.floor(hash(now * 0.37) * Math.min(3, spots.length))] ?? clearOfProps(duo.tree + 80);
    duo.wrong = spots.find((x) => x !== duo.spot) ?? clearOfProps(duo.tree - 60);
  }
  if (kind === 'snack') {
    const blanket = (life.owner?.garden?.placed ?? []).filter((p) => p.map === 'garden' && FURNITURE_BY_ID[p.id]?.use === 'picnic').map((p) => p.x);
    const trees = LAYOUT.trees.map((t) => t.x);
    duo.food = near([...trees, ...blanket], mx)[0] ?? mx;
    duo.tree = trees.includes(duo.food) ? duo.food : null;
  }
  // (A sumo match: who'll win, by their strength - and a little luck.)
  if (kind === 'sumo') duo.aWins = sumoStrength(a.rec) + (hash(now * 0.17 + a.rec.seed) - 0.5) * 0.3 >= sumoStrength(b.rec) + (hash(now * 0.23 + b.rec.seed) - 0.5) * 0.3;
  if (kind === 'pound') {
    duo.mortar = festivalSpots(life).mortar;
    // (However far it is to the mortar, time to get there and still pound a while.)
    duo.len += Math.max(Math.abs(a.x - duo.mortar), Math.abs(b.x - duo.mortar)) / 44;
  }
  if (kind === 'chat') {
    const w = world.gardenWeather?.kind ?? null;
    const ta = topicsFor(a.rec, b.rec, hash(now * 0.13), w);
    const tb = topicsFor(b.rec, a.rec, hash(now * 0.29 + 1), w);
    duo.say = [ta[0], tb[0], ta[1] ?? tb[1] ?? 'heart', tb[1] ?? 'heart'];
  }
  if (kind === 'trick') duo.trick = a.rec.tricks?.[Math.floor(hash(now) * (a.rec.tricks?.length ?? 1)) % (a.rec.tricks?.length || 1)] ?? 'wave';
  for (const e of [a, b]) {
    e.duo = duo;
    if (!['comfort', 'makeup'].includes(kind) || e === a) e.m.action = null;
    if (e.brain) e.brain.plan = null;
  }
  (life.duos ??= []).push(duo);
  return duo;
}
// Where each of the two is headed now.
function duoTarget(world, d, e) {
  const t = world.now - d.t0;
  const lead = e === d.a;
  const other = lead ? d.b : d.a;
  const { mx, side } = d;
  switch (d.kind) {
    // Pounding mochi: the one who asked swings the mallet at the mortar's left, the other kneels at
    // its right to turn the mochi between strikes.
    case 'pound':
      return lead ? d.mortar - 22 : d.mortar + 13;
    // A snowball fight: face to face a little way apart.
    case 'snowball':
      return mx + (lead ? -24 : 24);
    // A sumo match on the grass: stamping a little way apart, in to their lines, then shoving to and
    // fro - and the winner drives the other back.
    case 'sumo': {
      // (Its clock starts once both are at their spots: `d.go`.)
      const s = lead ? -1 : 1;
      const u = d.go == null ? -1 : t - d.go;
      if (u < 2.3) return mx + s * 20;
      if (u < 3.4) return mx + s * 12;
      const c = u < 4.9 ? Math.sin((u - 3.4) * 4.2) * 4 : (d.aWins ? 1 : -1) * Math.min(14, (u - 4.9) * 16);
      return mx + c + s * 8;
    }
    // Tag: one chases, the other runs; caught, the other way round.
    case 'tag': {
      const round = Math.floor(t / 3.3);
      const it = round % 2 ? d.b : d.a;
      const run = side * (round % 2 ? -1 : 1) * 72;
      return e === it ? other.x : besideProps(mx + run, mx - run);
    }
    // Hide-and-seek: the seeker counts at a tree, looks in the wrong place, then finds it.
    case 'hide':
      if (e === d.b) return t < 3.6 ? (COUNT_TREES.includes(d.tree) ? d.tree + (mx < d.tree ? -10 : 10) : d.tree) : t < 7 ? besideProps(d.wrong + 12, d.wrong - 12) : besideProps(d.spot + (d.wrong < d.spot ? -13 : 13), d.spot - (d.wrong < d.spot ? -13 : 13));
      return t < 0.4 ? e.x : d.spot;
    case 'snack':
      return d.food + (lead ? -10 : 10);
    case 'dance':
      return mx + (lead ? -12 : 12);
    case 'chat':
    case 'trick':
      return mx + (lead ? -13 : 13);
    // Comforting, making up: it goes over; the other stays where it is.
    case 'comfort':
    case 'makeup':
      return lead ? besideProps(other.x + (e.x < other.x ? -13 : 13), other.x - (e.x < other.x ? -13 : 13)) : e.x;
    // A squabble: face to face, then off in a huff, each its own way.
    case 'squabble':
      return t < 2.6 ? mx + (lead ? -12 : 12) : mx + (lead ? -64 : 64);
    default:
      return e.x;
  }
}
// Which way it faces when it's not on the move.
function duoFacing(d, e) {
  const other = e === d.a ? d.b : d.a;
  const toward = Math.sign(other.x - e.x) || 1;
  if (d.kind === 'dance') return d.side;
  if (d.kind === 'hide' && e === d.b && d.t < 3.6) return Math.sign(d.tree - e.x) || 1;
  if (d.kind === 'hide' && e === d.a) return Math.sign(d.tree - e.x) || 1;
  if (d.kind === 'squabble' && d.t > 2.4) return -toward;
  if (d.kind === 'snack' && d.t > 2 && d.tree) return Math.sign(d.food - e.x) || 1;
  return toward;
}
// What each of the two does when (each beat once).
function duoBeats(world, d) {
  const t = d.t;
  const once = (key, when, fn) => {
    if (t >= when && !d.done.has(key)) {
      d.done.add(key);
      fn();
    }
  };
  const act = (e, name, hold = 0) => {
    e.m.action = { name, t0: null, hold };
  };
  const near = Math.abs(d.a.x - d.b.x) < 36;
  const { a, b } = d;
  switch (d.kind) {
    case 'tag':
      once('catch1', 3.2, () => act(a, 'giggle'));
      once('catch2', 6.5, () => act(b, 'giggle'));
      once('end', d.len - 1.4, () => {
        act(a, 'cheer', 1);
        act(b, 'giggle');
      });
      break;
    case 'hide':
      once('count', 0.5, () => act(b, 'count', 3));
      once('crouch', 2.6, () => act(a, 'hidecrouch', 8));
      once('look', 5.4, () => act(b, 'lookaround'));
      if (Math.abs(b.x - d.spot) < 20) once('found', 7.4, () => {
        act(b, 'cheer', 1);
        act(a, 'giggle');
        d.found = world.now;
      });
      once('end', d.len - 1.6, () => {
        act(a, 'giggle');
        act(b, 'giggle');
      });
      break;
    case 'chat':
      if (near) {
        once('s0', 0.4, () => act(a, 'talk', 1.4));
        once('s1', 2.2, () => act(b, 'talk', 1.4));
        once('s2', 4.0, () => act(a, 'talk', 1.2));
        once('s3', 5.6, () => {
          act(a, 'giggle');
          act(b, 'giggle');
        });
      }
      break;
    case 'trick':
      if (near) {
        once('show', 0.8, () => {
          act(a, d.trick);
          act(b, 'wow', 2.6);
        });
        once('clap', 4.0, () => act(b, 'clap'));
        once('bow', 4.2, () => act(a, 'bow'));
      }
      break;
    case 'dance':
      if (near) once('dance', 1.0, () => {
        act(a, 'dance1');
        act(b, 'dance1');
      });
      break;
    case 'snack':
      if (Math.abs(a.x - d.food) < 24 && Math.abs(b.x - d.food) < 24) {
        once('reach', 0.2, () => {
          act(a, d.tree ? 'reach' : 'yum');
          act(b, d.tree ? 'reach' : 'yum');
        });
        once('yum', 3.6, () => {
          act(a, 'yum');
          act(b, 'yum');
        });
      }
      break;
    case 'comfort':
      once('sad', 0.3, () => act(b, 'sigh'));
      if (near) {
        once('pat', 0.1, () => act(a, 'pat', 2));
        once('hug', 2.6, () => {
          act(a, 'hug', 2.4);
          act(b, 'hug', 2.4);
          // (Comforted: the sadness goes, and it feels loved.)
          b.feel = null;
          feel(b, 'loving', 0.85, world.now, 'comfort');
        });
      }
      break;
    case 'makeup':
      if (near) {
        once('sorry', 0.1, () => act(a, 'bow'));
        once('huff', 1.2, () => act(b, 'sulk', 1.2));
        once('hug', 3.4, () => {
          act(a, 'hug', 2.4);
          act(b, 'hug', 2.4);
          for (const e of [a, b]) e.feel = null;
        });
      }
      break;
    case 'squabble':
      once('stomp', 0.5, () => {
        act(a, 'stomp', 1.4);
        act(b, 'stomp', 1.4);
      });
      once('huff', 2.6, () => {
        act(a, 'sulk', 1);
        act(b, 'sulk', 1);
      });
      break;
    // Pounding: once both are in place, the mallet swings (its own way, by its Power: render/
    // mochi-anim.js pound0-5) and the other turns the mochi in time between the strikes; then a taste.
    case 'pound': {
      const ready = Math.abs(a.x - (d.mortar - 22)) < 1.5 && Math.abs(b.x - (d.mortar + 13)) < 1.5 && Math.abs(a.vx ?? 0) < 2 && Math.abs(b.vx ?? 0) < 2;
      // (Started together, so the turning keeps time with the strikes - and if either's move is
      // dropped part way, both start again together, on the same beat.)
      const going = d.poundAt != null && t < d.len - 2.2 && (a.m.action?.name !== `pound${styleOf(pts(a.rec, 'power'))}` || b.m.action?.name !== 'festturn');
      if ((ready && d.poundAt == null) || (going && ready)) {
        d.poundAt ??= t;
        act(a, `pound${styleOf(pts(a.rec, 'power'))}`, Math.max(2, d.len - t - 2.2));
        act(b, 'festturn', Math.max(2, d.len - t - 2.2));
      }
      // (Facing each other across the mortar.)
      if (ready) {
        a.m.dir = 1;
        b.m.dir = -1;
      }
      if (d.poundAt != null) once('taste', d.len - 1.6, () => {
        act(a, 'yum');
        act(b, 'yum');
      });
      break;
    }
    // Sumo: a stamp each, crouched at their lines, the charge, a shove to and fro - and the loser plops
    // down on its bottom, a giggle, while the winner throws its fists up; then a bow.
    case 'sumo': {
      const W = d.aWins ? a : b;
      const L = d.aWins ? b : a;
      // (Both at their spots - or long enough waiting - and off it goes, the match's own clock.)
      if (d.go == null && ((Math.abs(a.x - (d.mx - 20)) < 2 && Math.abs(b.x - (d.mx + 20)) < 2) || t > 3)) {
        d.go = t - 0.3;
        d.len = d.go + 9.6;
      }
      if (d.go == null) break;
      const go = d.go;
      const at = (k, when, fn) => once(k, go + when, fn);
      at('shiko', 0.3, () => {
        act(a, 'sumoshiko');
        act(b, 'sumoshiko');
      });
      at('crouch', 2.8, () => {
        act(a, 'sumocrouch', 1.2);
        act(b, 'sumocrouch', 1.2);
      });
      at('charge', 3.7, () => {
        act(a, 'sumocharge');
        act(b, 'sumocharge');
      });
      at('push', 4.05, () => {
        act(a, 'sumopush', 1.4);
        act(b, 'sumopush', 1.4);
      });
      at('give', 5.1, () => act(L, 'sumobrace', 1.6));
      at('plop', 6.4, () => {
        act(L, 'sumoplop');
        act(W, 'sumowin');
      });
      at('bow', 8.5, () => {
        act(a, 'bow');
        act(b, 'bow');
      });
      break;
    }
    // Snowballs: once they're facing each other, a throw each way, three in all - scooped, wound up,
    // thrown (render/garden-festival.js flies it across), and a splat and a giggle where it lands.
    case 'snowball': {
      const ready = Math.abs(a.x - (d.mx - 24)) < 2 && Math.abs(b.x - (d.mx + 24)) < 2;
      if (ready && d.readyAt == null) {
        d.readyAt = t;
        d.throws = [0, 2.1, 4.2].map((at, k) => ({ at: t + at + 0.55, by: k % 2 ? b : a, to: k % 2 ? a : b }));
      }
      if (d.readyAt != null) {
        d.throws.forEach((th, k) => {
          once(`throw${k}`, th.at - 0.55, () => act(th.by, 'snowthrow'));
          once(`hit${k}`, th.at + 0.4, () => act(th.to, 'snowhit'));
        });
        once('end', d.len - 1.2, () => {
          act(a, 'giggle');
          act(b, 'giggle');
        });
      }
      break;
    }
    case 'decline':
      once('no', 0.15, () => act(b, feelingOf(b, world.now)?.kind === 'sleepy' ? 'yawn' : 'nope'));
      once('aw', 1.2, () => act(a, SNUBS.includes(b.rec.personality) ? 'sulk' : 'sigh', 1));
      break;
    default:
  }
}
// Every game going, and its end: how they feel after, and how much closer it brought them.
function tickDuos(world, life, night) {
  const now = world.now;
  life.duos = (life.duos ?? []).filter((d) => {
    const gone = (e) => !life.mochi.includes(e) || e.scene || e.hidden || e.ride || e.leaving;
    d.t = now - d.t0;
    const lost = gone(d.a) || gone(d.b);
    if (night || lost || d.t > d.len) {
      endDuo(world, life, d, !night && !lost);
      return false;
    }
    duoBeats(world, d);
    return true;
  });
  // Two that don't get on, bumping into each other: a squabble (now and then).
  if (night || now < (life.squabbleAt ?? 0)) return;
  life.squabbleAt = now + 3;
  const free = life.mochi.filter((e) => !e.duo && !e.ride && !e.hidden && !e.guest && e.x != null && !e.scene && Math.abs(e.vx ?? 0) < 30);
  for (const a of free) for (const b of free) {
    if (a === b || a.rec.seed > b.rec.seed || Math.abs(a.x - b.x) > 26 || !isRival(a.rec, b.rec)) continue;
    if (hash(now * 0.71 + a.rec.seed) < 0.45) {
      startDuo(world, life, 'squabble', a, b);
      return;
    }
  }
}
const OUTCOME = {
  tag: [3, { fun: 40, social: 30 }, 'joy', 'play'], hide: [3, { fun: 45, social: 30 }, 'joy', 'play'], chat: [2, { social: 45, curious: 15 }, 'joy', 'social'],
  trick: [2, { social: 30, fun: 25 }, 'joy', 'social'], dance: [3, { fun: 40, social: 35 }, 'joy', 'play'], snack: [2, { hunger: 45, social: 30 }, 'joy', 'snack'],
  comfort: [4, { social: 50 }, 'loving', 'social'], makeup: [0, { social: 30 }, 'loving', 'social'], squabble: [-3, {}, 'sulky', null], decline: [0, {}, null, null],
  pound: [3, { fun: 35, social: 35, hunger: 25 }, 'joy', 'play'],
  snowball: [3, { fun: 50, social: 30 }, 'joy', 'play'],
  sumo: [3, { fun: 45, social: 30 }, 'joy', 'play'],
};
function endDuo(world, life, d, finished) {
  const games = ['count', 'hidecrouch', 'talk', 'hug', 'pat', 'stomp', 'dance1', 'giggle', 'lookaround', 'sigh', 'nope', 'festturn', 'snowthrow', 'snowhit', 'sumoshiko', 'sumocrouch', 'sumocharge', 'sumopush', 'sumobrace', 'sumoplop', 'sumowin', 'pound0', 'pound1', 'pound2', 'pound3', 'pound4', 'pound5'];
  for (const e of [d.a, d.b]) {
    e.duo = null;
    if (e.m.action && games.includes(e.m.action.name)) e.m.action = null;
  }
  if (!finished) return;
  const now = world.now;
  const [by, gains, f, like] = OUTCOME[d.kind];
  if (!d.a.guest && !d.b.guest) {
    if (d.kind === 'makeup') for (const [x, y] of [[d.a, d.b], [d.b, d.a]]) friendsOf(x.rec)[y.rec.seed] = Math.max(friendsOf(x.rec)[y.rec.seed] ?? 0, 12);
    else if (d.kind === 'decline' && SNUBS.includes(d.b.rec.personality)) befriend(d.a.rec, d.b.rec, -2);
    else if (by) befriend(d.a.rec, d.b.rec, by);
  }
  for (const e of [d.a, d.b]) {
    satisfy(e.rec, gains);
    if (like) learn(e.rec, like, 0.9);
    if (f) feel(e, f, 0.75, now, d.kind);
  }
  if (d.kind === 'trick') feel(d.a, 'proud', 0.85, now, 'trick');
  if (d.kind === 'decline') feel(d.a, SNUBS.includes(d.b.rec.personality) ? 'sulky' : 'shy', 0.55, now, 'no');
  diary(world, life, d.kind, d.a, d.b, d.kind === 'chat' ? d.say?.[0] ?? null : d.kind === 'sumo' ? (d.aWins ? d.a : d.b).rec.name ?? null : null);
}

// Each moment: how each feels, as it is and as it's catching from those round it; its habits; its
// presents for you; sitting by you; something new to come and see; looking round at what's going on.
const GIFT_WORDS = { mochi_daisy: 'a daisy', mochi_pebble: 'a shiny pebble', mochi_clover: 'a four-leaf clover' };
function tickHearts(world, life, night, dt) {
  const now = world.now;
  const mine = !world.gardenVisit;
  // New things to come and see: a piece just set out in the garden, a Mochi just here.
  const placed = (life.owner?.garden?.placed ?? []).filter((p) => p.map === 'garden');
  if (!life.known) life.known = { decor: new Set(placed.map((p) => p.uid)), mochi: new Set(life.mochi.map((e) => e.rec.seed)) };
  life.news = (life.news ?? []).filter((n) => now < n.until);
  for (const p of placed) if (!life.known.decor.has(p.uid)) {
    life.known.decor.add(p.uid);
    life.news.push({ id: `d${p.uid}`, x: p.x, foot: footOf(p), what: FURNITURE_BY_ID[p.id]?.name?.toLowerCase() ?? null, until: now + 90, seen: new Set() });
  }
  for (const e of life.mochi) if (!life.known.mochi.has(e.rec.seed) && e.x != null) {
    life.known.mochi.add(e.rec.seed);
    life.news.push({ id: `m${e.rec.seed}`, x: e.x, who: e, until: now + 60, seen: new Set() });
  }
  for (const n of life.news) if (n.who?.x != null) n.x = n.who.x;
  const slow = now >= (life.heartAt ?? 0);
  if (slow) life.heartAt = now + 0.5;
  const W = world.gardenWeather;
  // (What's going on that the idle look round at: games, rides, presents given, a squabble.)
  const going = [...(life.duos ?? []).map((d) => d.mx), ...life.mochi.filter((e) => e.ride || e.m.action?.name === 'giftgive').map((e) => e.x)];
  for (const e of life.mochi) {
    if (e.hidden || e.x == null) continue;
    const rec = e.rec;
    const n = needsOf(rec);
    if (slow && !night) {
      // As it is: worn out, lonely with no friend about, bored with nothing to do.
      if (n.energy < 18) feel(e, 'sleepy', 0.7, now, 'tired');
      const friendNear = life.mochi.some((o) => o !== e && !o.hidden && o.x != null && Math.abs(o.x - e.x) < 140 && (friendsOf(rec)[o.rec.seed] ?? 0) >= 10);
      if (n.social < 22 && !friendNear && !e.duo) feel(e, 'lonely', 0.65, now, 'alone');
      if (n.fun < 18 && n.curious < 40) feel(e, 'bored', 0.6, now, 'bored');
      // (One that loves the rain is happiest in it.)
      if (W?.kind === 'rain' && W.k > 0.3 && hasQuirk(rec, 'rainlover') && !e.guest) {
        feel(e, 'joy', 0.7, now, 'rain');
        diary(world, life, 'rain', e);
      }
      // Catching it from a friend beside it: a happy one cheers it up, a yawn sets it yawning.
      const f = feelingOf(e, now);
      if (f && f.k > 0.5 && FEELINGS[f.kind].spread) {
        for (const o of life.mochi) {
          if (o === e || o.hidden || o.x == null || Math.abs(o.x - e.x) > 50 || (friendsOf(o.rec)[rec.seed] ?? 0) < 0) continue;
          const of = feelingOf(o, now);
          if (!of || (of.kind !== f.kind && of.k < f.k * FEELINGS[f.kind].spread)) feel(o, f.kind, f.k * FEELINGS[f.kind].spread, now, 'caught');
        }
      }
    }
    // (A move begun while it's off out of sight is never drawn, so it never plays out: let go after a
    // few seconds, so it doesn't hang on and turn up late, or stop the next one.)
    if (e.m.action && e.m.action.t0 == null) {
      e.m.action.seenAt ??= now;
      if (now - e.m.action.seenAt > 6) e.m.action = null;
    }
    // How it shows: on its face, and a happy twirler twirls.
    const f = feelingOf(e, now);
    e.m.feelFace = f && f.k >= (FEELINGS[f.kind].shows ?? 0.3) && !night ? FEELINGS[f.kind].face : null;
    e.m.hum = hasQuirk(rec, 'hummer') && !night;
    if (f?.kind === 'joy' && hasQuirk(rec, 'twirler') && f.t0 !== e.twirled && !e.m.action && !e.duo && !e.ride && Math.abs(e.vx ?? 0) < 2) {
      e.twirled = f.t0;
      e.m.action = { name: 'twirl', t0: null };
    }
    // A present handed over.
    if (e.giftAt && now >= e.giftAt) {
      e.giftAt = null;
      const id = e.giftFound;
      e.giftFound = null;
      if (mine && id && addItem(world.char.inventory, id, 1)) {
        const mem = memoryOf(rec);
        mem.gifts += 1;
        mem.giftDay = Math.floor(Date.now() / 86400000);
        rec.bond = Math.min(1000, (rec.bond ?? 0) + 3);
        world.log(`${rec.name ?? 'Your Mochi'} brought you ${GIFT_WORDS[id] ?? 'a present'}!`, '#ffd6e4');
        diary(world, life, 'gift', e, null, GIFT_WORDS[id] ?? 'a present');
        feel(e, 'loving', 0.9, now, 'gift');
      }
    }
    // Sat by you, and you've walked off: up it gets.
    if (e.m.action?.name === 'sitby' && (life.still ?? 0) === 0) {
      e.m.action = null;
      if (e.brain) e.brain.plan = null;
    }
    // Stood about with nothing on: it turns to look at whatever's going on near it.
    if (!e.m.action && !e.duo && !e.ride && Math.abs(e.vx ?? 0) < 2 && going.length) {
      const g = going.filter((x) => Math.abs(x - e.x) > 8 && Math.abs(x - e.x) < 150).sort((p, q) => Math.abs(p - e.x) - Math.abs(q - e.x))[0];
      if (g != null) e.m.dir = Math.sign(g - e.x) || e.m.dir;
    }
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
      diary(world, life, 'egg', a, b);
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

// ---------- Harvest helpers ----------
// When you pick the crop bed, up to three Mochi close by come trotting over, each takes one of the
// crops up onto its head, and carries it to the nursery door (render/garden.js draws it there), then
// a cheer. A little job they're glad of: fun and company for them, nothing for you to do.
const HARVEST_VEG = ['rice', 'bean', 'soy', 'pepper'];
function callHelpers(world) {
  const life = world.gardenLife;
  if (!life || world.gardenVisit || CROP_X == null) return;
  const near = life.mochi
    .filter((e) => !e.hidden && !e.guest && !e.ride && !e.scene && !e.chore && e.x != null && pts(e.rec, 'run') >= CANT.run && Math.abs(e.x - CROP_X) < 500)
    .sort((a, b) => Math.abs(a.x - CROP_X) - Math.abs(b.x - CROP_X))
    .slice(0, 3);
  near.forEach((e, k) => {
    e.chore = { stage: 'fetch', veg: HARVEST_VEG[k % HARVEST_VEG.length], x: CROP_X - 40 + k * 40 };
    e.m.action = null;
  });
}
// Where a helper is off to, and what happens when it gets there.
function choreTarget(world, e) {
  const c = e.chore;
  const m = e.m;
  if (Math.abs(e.x - c.x) < 3) {
    if (c.stage === 'fetch') {
      Object.assign(c, { stage: 'carry', got: world.now, x: NURSERY_DOOR - 34 + Math.round((hash(e.rec.seed) - 0.5) * 28) });
      m.action = { name: 'hops', t0: null };
    } else if (c.stage === 'carry') {
      e.chore = null;
      m.action = { name: 'cheer', t0: null };
      if (e.brain) e.brain.plan = null;
      satisfy(e.rec, { fun: 15, social: 10 });
      return e.x;
    }
  }
  return c.x;
}

// ---------- The mailbox ----------
// By the gate: presents your friends leave you (net/visit.js) wait in it, its flag up, until you
// open it (Up beside it): sweets into your bag, eggs into the nest (one that won't fit stays in the
// box for later). In the daytime, while there's post, a Mochi now and then trots over and peeks in.
export let MAILBOX_X = 226;
export function openMail(world) {
  const g = world.gardenLife?.owner?.garden;
  if (!g || MAILBOX_X == null || !world.map.garden || world.gardenVisit || world.map.indoor || Math.abs(world.body.x - MAILBOX_X) > 14) return false;
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
// (A ball thrown is a big event: any that can walk and are anywhere near this end come for it.)
const BALL = { every: 120, near: 900, secs: 14 };
export function tossBall(world) {
  const life = world.gardenLife;
  if (!life || TOY_X == null || world.gardenVisit || world.map.indoor || Math.abs(world.body.x - TOY_X) > 40) return false;
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
  if (!g || CROP_X == null || world.gardenVisit || world.map.indoor || Math.abs(world.body.x - CROP_X) > 44) return false;
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
      // (The nearest come and carry the crops in; any others close by cheer the harvest in.)
      callHelpers(world);
      for (const e of world.gardenLife?.mochi ?? []) if (e.m && !e.chore && !e.m.action && !e.hidden && Math.abs((e.x ?? 1e9) - CROP_X) < 170) e.m.action = { name: 'cheer', t0: null };
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
  diary(world, life, 'hatched', life.mochi[life.mochi.length - 1]);
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

// (As the garden was, until the first look at its layout: tickGarden.)
applyLayout(LAYOUT);
