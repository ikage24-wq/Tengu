// What makes each room of Moonlit Manor its own (docs/design/moonlit-manor.md; the map fields are
// described in data/maps.js), and its three boss fights. world/dungeon.js calls in here; the
// drawing is in render/manor.js.
//
//   The Moonlit Garden    fountains spout on a beat and throw whoever stands in the basin up to the
//                         high terraces; light the three garden lanterns.
//   The Portrait Gallery  the puzzle: four portraits on three floors, each turned through its four
//                         pictures; set them to the family crest shown in the hall (moon, rose...).
//   The Ballroom          Dame Rondo and Dame Minuet, the Mirror Twins (2026-11-28): one on the floor,
//                         one hanging from the ceiling; a hidden red eye that stops time while they
//                         trade places (world/twins.js).
//   The Library           the lost books flutter along the shelves: catch them; page storms blow
//                         through the stacks and push everyone on that floor.
//   The Endless Hallway   the chase: Madame Velvet's tea trolley rumbles after the group; doors bar
//                         the way until their levers are pulled; at the end, in her own hall,
//                         Madame Velvet herself (2026-11-28: Inspection Hour, Spring Cleaning,
//                         Polished Floors).
//   The Moonlit Rooftop   Lady Marigold, the Eternal Hostess (fight remade 2026-11-28): Welcome,
//                         Guests! (calling cards, partners, the waltz in three, her toes), Lantern
//                         Light (her Basset Butlers' tarts, lanterns falling, in full bloom),
//                         Midnight (twelve chimes, the last waltz).

import { addZone, adds, callout, hurtMember } from './dungeon.js';
import { runRotation, raidwide, buster, stack, spread, out, donut, band, cleave, tankOf, healerOf, dpsOf } from './bossfight.js';
import { navOf, surfaceBelow } from './nav.js';
import { playScene } from './story.js';
import { radio } from './hollow.js';
import { twins } from './twins.js';

export const MANOR_MECHS = new Set(['twins', 'velvet', 'marigold', 'butler']);

// The crest's pictures, in the order a portrait turns through them.
export const CREST = ['moon', 'rose', 'key', 'cup'];
// How long each manor thing takes to use.
export const MANOR_CHANNEL = { lantern: 1, portrait: 0.45, book: 0.7, lever: 0.6 };
// How high a fountain's spout throws you (about the same as a Hollow bounce cap).
export const SPOUT = 760;

const pick = (list) => list[Math.floor(Math.random() * list.length)];
const floorY = (world, body) => {
  const nav = navOf(world.map);
  return nav.surfaces[Math.max(0, surfaceBelow(nav, body.x, body.y))].y;
};

// ---------- Rooms ----------

export function manorSetup(world, room) {
  const map = world.map;
  if (map.dungeon !== 'manor') return;
  room.fountains = (map.fountains ?? []).map((f, i) => ({ ...f, t: (f.every * i) / Math.max(1, map.fountains.length), state: 'calm', since: 0 }));
  // The gallery: a fresh crest each run, and every portrait starting on a wrong picture.
  if (map.puzzle) {
    room.crest = [0, 1, 2, 3].map(() => Math.floor(Math.random() * CREST.length));
    for (const o of room.objects) {
      if (o.kind !== 'portrait') continue;
      const want = room.crest[o.slot];
      o.face = (want + 1 + Math.floor(Math.random() * 3)) % CREST.length;
    }
  }
  for (const o of room.objects) if (o.kind === 'book') o.home = o.x;
  room.storm = map.storms ? { t: 9, on: null } : null;
  room.chase = map.chase ? { state: 'waiting', x: map.chase.from, speed: map.chase.speed, plateIn: 3, hitAt: {} } : null;
  // The hostess isn't out on the roof yet: she makes her entrance down the moon's beam in her scene
  // (render/marigold/: not drawn while `offstage`; her fight's first tick brings her on for good).
  // (the Mirror Twins too: they step out of the mirrors in their scene, render/twins/)
  for (const m of world.mobs) if (m.def.mech === 'marigold' || m.def.mech === 'twins') m.offstage = true;
}

// The crest's names, for the callout as you walk in.
export const crestWords = (room) => room.crest.map((i) => CREST[i][0].toUpperCase() + CREST[i].slice(1)).join(' · ');

// Turning a portrait on to its next picture; it locks in place once it shows the crest's.
// Returns whether it's now right.
export function turnPortrait(world, o) {
  const room = world.dungeon.room;
  o.face = (o.face + 1) % CREST.length;
  o.turnedAt = world.now;
  return o.face === room.crest[o.slot];
}

// A door in the hallway is open once its lever is pulled.
export function doorOpen(room, d) {
  return Boolean(room.objects[d.lever]?.done);
}

export function tickManor(world, dt, group, up) {
  const run = world.dungeon;
  const room = run?.room;
  const map = world.map;
  if (map.dungeon !== 'manor' || !room) return;
  tickFountains(world, room, dt, up);
  // The lost books flutter back and forth over their shelves, and hold still to be caught.
  for (const o of room.objects) {
    if (o.kind !== 'book' || o.done) continue;
    const held = world.channel?.obj === o || group.some((g) => g.bot?.brain?.task === o && Math.abs(g.body.x - o.x) < 22);
    if (!held) o.x = o.home + Math.sin((world.now + o.id * 1.7) * ((Math.PI * 2) / (o.period ?? 7))) * (o.dx ?? 40);
  }
  tickStorm(world, room, dt, up);
  tickChase(world, room, dt, up);
  // Hallway doors: shut until their lever is pulled.
  for (const d of map.doors ?? []) {
    if (doorOpen(room, d)) continue;
    for (const g of up) {
      const b = g.body;
      if (b.x > d.x - 12 && b.x < d.x + 4) b.x = d.x - 12;
    }
  }
}

function tickFountains(world, room, dt, up) {
  for (const f of room.fountains ?? []) {
    f.t -= dt;
    f.since += dt;
    if (f.t > 0) continue;
    if (f.state === 'calm') {
      f.state = 'bubbling';
      f.t = 0.9;
    } else if (f.state === 'bubbling') {
      f.state = 'spout';
      f.t = 1.1;
    } else {
      f.state = 'calm';
      f.t = f.every - 2;
    }
    f.since = 0;
  }
  // The spout throws whoever stands in the basin up to the terraces.
  for (const f of room.fountains ?? []) {
    if (f.state !== 'spout') continue;
    for (const g of up) {
      const b = g.body;
      if (Math.abs(b.x - f.x) > 24 || Math.abs(b.y - f.y) > 30 || b.vy < -200 || b.rope) continue;
      b.vy = -SPOUT;
      b.onGround = false;
      b.y -= 2;
      world.juice.push({ type: 'jump', x: f.x, y: f.y });
    }
  }
}

// Page storms: a gust tears through one floor of the stacks, pushing everyone on it one way.
function tickStorm(world, room, dt, up) {
  const s = room.storm;
  if (!s) return;
  const map = world.map;
  if (s.on) {
    s.on.t += dt;
    if (s.on.t > s.on.warn) for (const g of up) if (Math.abs(g.body.y - s.on.y) < 40 && !g.body.rope) g.body.x = Math.max(24, Math.min(map.width - 24, g.body.x + s.on.dir * 150 * dt));
    if (s.on.t > s.on.warn + 2.6) {
      s.on = null;
      s.t = 8 + Math.random() * 5;
    }
    return;
  }
  s.t -= dt;
  if (s.t > 0 || !up.length) return;
  const g = pick(up);
  s.on = { y: floorY(world, g.body), dir: Math.random() < 0.5 ? -1 : 1, t: 0, warn: 1.2 };
  callout(world, 'Page Storm!', s.on.dir > 0 ? 'The pages blow right: brace or ride it' : 'The pages blow left: brace or ride it');
}

// The chase: once anyone is past the start line, the trolley comes, faster and faster, and runs
// over whoever it catches. Plates fly ahead of it.
function tickChase(world, room, dt, up) {
  const c = room.chase;
  if (!c) return;
  const def = world.map.chase;
  if (c.state === 'waiting') {
    if (up.some((g) => g.body.x > def.start)) {
      c.state = 'rolling';
      callout(world, 'The trolley is coming!', 'RUN! Pull the levers to open the doors!');
      radio(world, 'chase');
    }
    return;
  }
  if (c.state !== 'rolling') return;
  c.speed = Math.min(def.top, c.speed + def.speedUp * dt);
  // It slows behind a shut door the group hasn't got through yet.
  c.x = Math.min(def.to, c.x + c.speed * dt);
  for (const g of up) {
    const b = g.body;
    if (b.x < c.x + 18 && b.x > c.x - 40 && world.now - (c.hitAt[g.id] ?? -9) > 1.2) {
      c.hitAt[g.id] = world.now;
      hurtMember(world, g, def.damage, c.x - 60, { knock: true });
      b.x = Math.max(b.x, c.x + 30);
    }
  }
  c.plateIn -= dt;
  if (c.plateIn <= 0 && up.length) {
    c.plateIn = def.plates;
    const lead = up.reduce((a, g) => (g.body.x > a.body.x ? g : a), up[0]);
    addZone(world, { kind: 'circle', x: lead.body.x + 40 + Math.random() * 60, y: floorY(world, lead.body), w: 54, warn: 1.1, damage: 90, plate: true });
  }
  if (c.x >= def.to) {
    c.state = 'parked';
    callout(world, 'The trolley grinds to a stop', 'Someone is waiting at the end of the hall...');
  }
}


// ---------- The bosses ----------

// A share of a hit that reaches a manor boss (all of it: none of the manor's bosses is ever out of reach).
export function manorHitMul() {
  return 1;
}

// Returns true while the boss is busy with a move of its own.
export function manorBoss(world, m, up, dt) {
  if (m.def.mech === 'twins') return twins(world, m, up, dt);
  if (m.def.mech === 'velvet') return velvet(world, m, up, dt);
  if (m.def.mech === 'marigold') return marigold(world, m, up, dt);
  if (m.def.mech === 'butler') return butler(world, m, up, dt);
  return false;
}

// ---------- The Ballroom: Dame Rondo and Dame Minuet, the Mirror Twins ----------
// (2026-11-28, remade from scratch as twin ghost ladies: world/twins.js.)

// Madame Velvet, the Head Housekeeper (remade 2026-11-28 with her new look, render/velvet/, and her own
// end of the hallway, render/velvet/room.js). She runs the manor by its house rules and she is
// inspecting her guests: every cast is a bit of housekeeping, named on her cast bar, drawn in her own
// plum, linen and silver look (render/velvet/looks.js). Her furniture is part of the fight: the
// sideboard, the plate shelf and the linen press are high ground, safe from anything on the floor.
// Phases go by her health:
//   Inspection Hour (to 60%)   No Muddy Boots! (she flicks her plum runner out from her feet to one wall:
//                              off the carpet, onto the other side or up on the furniture); Tea Is
//                              Served (a teacup over each of you: spread out); Spotless Inspection (she
//                              peers over her spectacles at the floor in front of her: get behind her);
//                              Scalding Pour (the teapot tips over the tank).
//   Spring Cleaning (to 25%)   she rings for the maids once (Ghost Maids run for the healer: catch
//                              them); Dusting, High and Low (her duster whirls round her at shoulder
//                              height: get out; then low along the skirting: get in close); The Keys,
//                              Please! (a key ring over one of you: everyone in to share it); the runner,
//                              the tea, the pour.
//   Polished Floors (the end)  Polish! (the whole floor is waxed to a shine: be off it, up on the
//                              furniture or in the air, as it gleams); House Rules (she reads them out:
//                              everyone feels it); Rule Two: Spotless! (the inspection and the tea at
//                              once: behind her and apart); the keys; the pour; the runner.
// Her state for her rig: m.cast / m.castPose ('runner', 'tea', 'inspect', 'pour', 'dust', 'dustlow',
// 'keys', 'polish', 'rules', 'bell'), m.mech.phase, m.phaseAt (a phase change: her own moment), m.callAt
// (the bell).
// Her hall, wall to wall (render/velvet/room.js VV_HALL).
const VV_ROOM = { x0: 2935, x1: 3595 };
const VV = { band: 170, spread: 140, cleave: 190, buster: 320, stack: 460, out: 170, donut: 170, floor: 190, raid: 130 };
const RUNNER = {
  gap: 2.4, look: 'vvRunner', cast: 'No Muddy Boots!', dur: 3, pose: 'runner', sub: 'Her runner unrolls from her feet to the wall: get off the carpet, or up on the furniture!',
  run: (w, m) => {
    const dir = m.x - VV_ROOM.x0 > VV_ROOM.x1 - m.x ? -1 : 1;
    band(w, m, m.x, dir > 0 ? VV_ROOM.x1 : VV_ROOM.x0, VV.band, 3);
  },
};
const TEA = { gap: 2.4, look: 'vvTea', cast: 'Tea Is Served', dur: 3, pose: 'tea', sub: 'A cup of scalding tea over each of you: spread out!', run: (w, m, up) => spread(w, m, up, VV.spread, 3, 72) };
const INSPECT = { gap: 2.4, look: 'vvInspect', cast: 'Spotless Inspection', dur: 2.8, pose: 'inspect', sub: 'She peers over her spectacles at the floor in front of her: get behind her!', run: (w, m) => cleave(w, m, 300, VV.cleave, 2.8) };
const POUR = { gap: 2.2, look: 'vvPour', cast: 'Scalding Pour', dur: 2.6, pose: 'pour', sub: 'Her teapot tips over the tank: everyone else, step clear', run: (w, m, up) => buster(w, m, tankOf(up), VV.buster, 2.6, 80) };
const DUST_HIGH = { gap: 2.4, look: 'vvDust', cast: 'Dusting, High...', dur: 2.6, pose: 'dust', sub: 'Her duster whirls round her: get out!', run: (w, m) => out(w, m, 140, VV.out, 2.6) };
const DUST_LOW = { gap: 0.2, look: 'vvDustLow', cast: '...and Low!', dur: 2, pose: 'dustlow', sub: 'Now along the skirting: in close to her!', run: (w, m) => donut(w, m, 84, Math.max(m.x - VV_ROOM.x0, VV_ROOM.x1 - m.x) + 30, VV.donut, 2) };
const KEYS = { gap: 2.4, look: 'vvKeys', cast: 'The Keys, Please!', dur: 3.2, pose: 'keys', sub: 'Her key ring over one of you: everyone in to share it!', run: (w, m, up) => stack(w, m, healerOf(up) ?? dpsOf(up), VV.stack, 3.2, Math.min(3, up.length), 100) };
const POLISH = { gap: 2.6, look: 'vvPolish', cast: 'Polish!', dur: 2.8, pose: 'polish', sub: 'The whole floor is waxed to a shine: get off it, up on the furniture or in the air!', run: (w, m) => addZone(w, { kind: 'floor', x: VV_ROOM.x0, w: VV_ROOM.x1 - VV_ROOM.x0, warn: 2.8, damage: VV.floor, from: m }) };
const RULES = { gap: 2.4, look: 'vvRules', cast: 'House Rules', dur: 3.2, pose: 'rules', sub: 'She reads the house rules aloud, and everyone feels them: healer, ready!', run: (w, m) => raidwide(w, m, VV.raid, 3.2) };
const SPOTLESS = {
  gap: 2.6, look: ['vvInspect', 'vvTea'], cast: 'Rule Two: Spotless!', dur: 3.2, pose: 'inspect', sub: 'An inspection and the tea at once: get behind her, and apart!',
  run: (w, m, up) => {
    cleave(w, m, 300, VV.cleave, 3.2);
    spread(w, m, up, VV.spread, 3.2, 72);
  },
};
const INSPECTION = [RUNNER, TEA, INSPECT, POUR];
const CLEANING = [DUST_HIGH, DUST_LOW, KEYS, RUNNER, TEA, POUR];
const POLISHED = [POLISH, RULES, SPOTLESS, KEYS, POUR, RUNNER];

function velvet(world, m, up, dt) {
  const now = world.now;
  const s = (m.mech ??= { phase: 1 });
  // Her doors: once she's in the fight, the double doors of her hall swing shut behind the group and
  // the fight stays in her hall (they open again if she's out of it: a wipe, or her beaten).
  const room = world.dungeon.room;
  if (m.engaged && m.hp > 0) room.vvShut ??= now;
  else room.vvShut = null;
  if (room.vvShut != null) {
    for (const g of up) g.body.x = Math.max(VV_ROOM.x0 + 52, Math.min(VV_ROOM.x1 - 16, g.body.x));
    m.x = Math.max(VV_ROOM.x0 + 90, Math.min(VV_ROOM.x1 - 60, m.x));
  }
  const frac = m.hp / m.def.hp;
  const phase = frac > 0.6 ? 1 : frac > 0.25 ? 2 : 3;
  if (phase > s.phase && !m.cast) {
    s.phase = phase;
    m.phaseAt = now;
    if (phase === 2) {
      callout(world, 'Spring Cleaning!', 'She rings for the maids: they run for the healer. Catch them!');
      const healer = up.find((g) => g.role === 'healer') ?? pick(up);
      adds(world, m, 'ghostmaid', [VV_ROOM.x0 + 60, VV_ROOM.x1 - 60], healer?.id);
      m.callAt = now;
      radio(world, 'bell');
    } else callout(world, 'Polished Floors!', 'She takes out the wax. Find high ground!');
  }
  // (a phase change: her own moment, the bell rung or the wax tin opened, before the next cast)
  if (m.phaseAt != null && now - m.phaseAt < 1.6) return true;
  return runRotation(world, m, s.phase === 1 ? INSPECTION : s.phase === 2 ? CLEANING : POLISHED, up, dt);
}

// Lady Marigold, the Eternal Hostess (her fight remade 2026-11-28 with her new look, render/hostess/,
// and her rooftop party, render/hostess/room.js). The party that never ends, fought as a dance: every
// cast is a moment of her midnight party, named on her cast bar, drawn in her own marigold, cream, gold
// and moonlight look (render/hostess/looks.js). Phases go by her health:
//   Welcome, Guests! (to 65%)  Calling Cards (a card for each of you: spread out); Find a Partner! (two
//                              hearts, each wanting two: pair up); Waltz in Three (three spots along her
//                              path struck in turn, one, two, three: step out of each as its count
//                              comes); Mind My Toes! (her heel stamps on the tank).
//   Lantern Light (to 30%)     she claps for her Basset Butlers (they bring her tarts: stop them before
//                              they reach her; three rounds and the kitchen is out); Lanterns Falling
//                              (a paper lantern drops on the spot where each of you stands: move off it);
//                              In Full Bloom (a great marigold opens round her: get out); the waltz, the
//                              partners, her toes.
//   Midnight (the end)         Twelve Chimes (the stopped clock on the chimney strikes twelve at last:
//                              everyone feels it); The Last Waltz (the waltz and the lanterns at once);
//                              the partners, the bloom, her toes, the cards.
// Her state for her rig: m.cast / m.castPose ('cards', 'partners', 'steps', 'toes', 'lanterns', 'bloom',
// 'twelve', 'clap'), m.mech.phase, m.phaseAt (a phase change: her own little moment before the next
// cast), m.feastAt (a tart eaten).
const MG = { spread: 150, pair: 380, step: 200, buster: 360, lantern: 170, bloom: 190, raid: 160, heal: 0.03, rounds: 3 };
// (the roof, wall to wall)
const MG_ROOF = { x0: 40, x1: 1560 };
const CARDS = { gap: 2.6, look: 'mgCards', cast: 'Calling Cards', dur: 3, pose: 'cards', sub: 'A calling card for each of you: spread out!', run: (w, m, up) => spread(w, m, up, MG.spread, 3, 76) };
const PARTNERS = {
  gap: 2.4, look: 'mgPartners', cast: 'Find a Partner!', dur: 3.2, pose: 'partners', sub: 'Two hearts, each wanting a pair: get into twos!',
  run: (w, m, up) => {
    const pool = [...up].sort((g, h) => (g.role === 'tank') - (h.role === 'tank'));
    const firsts = pool.length >= 4 ? [pool[0], pool[2]] : pool.slice(0, 1);
    for (const g of firsts) stack(w, m, g, MG.pair, 3.2, 2, 88);
  },
};
// (three spots along the roof the way she faces, each landing on its count)
const waltzSteps = (w, m, dur) => {
  const dir = m.dir >= 0 ? 1 : -1;
  for (let k = 0; k < 3; k++) {
    const x = Math.max(MG_ROOF.x0 + 70, Math.min(MG_ROOF.x1 - 70, m.x + dir * (90 + k * 130)));
    addZone(w, { kind: 'circle', x, y: w.map.groundY, w: 140, warn: dur + k * 0.7, damage: MG.step, from: m, noSprout: true, step: k + 1 });
  }
};
const STEPS = { gap: 2.4, look: 'mgSteps', cast: 'Waltz in Three', dur: 2.6, pose: 'steps', sub: 'One, two, three: each spot strikes on its count. Step out as it comes!', run: (w, m) => waltzSteps(w, m, 2.6) };
const TOES = { gap: 2.4, look: 'mgToes', cast: 'Mind My Toes!', dur: 2.6, pose: 'toes', sub: 'Her heel comes down on the tank: everyone else, step clear', run: (w, m, up) => buster(w, m, tankOf(up), MG.buster, 2.6, 84) };
// (a lantern on the spot where each of you stands, and two more among you)
const lanternsFall = (w, m, up, dur) => {
  const spots = up.map((g) => g.body.x);
  for (let k = 0; k < 2 && up.length; k++) spots.push(up[k % up.length].body.x + (k ? 150 : -150));
  for (const x of spots) addZone(w, { kind: 'circle', x: Math.max(MG_ROOF.x0 + 40, Math.min(MG_ROOF.x1 - 40, x)), y: w.map.groundY, w: 92, warn: dur, damage: MG.lantern, from: m, noSprout: true });
};
const LANTERNS = { gap: 2.4, look: 'mgLanterns', cast: 'Lanterns Falling', dur: 2.8, pose: 'lanterns', sub: 'A lantern drops where each of you stands: move off the spot!', run: (w, m, up) => lanternsFall(w, m, up, 2.8) };
const BLOOM = { gap: 2.4, look: 'mgBloom', cast: 'In Full Bloom', dur: 2.6, pose: 'bloom', sub: 'A great marigold opens round her: get out!', run: (w, m) => out(w, m, 150, MG.bloom, 2.6) };
const TWELVE = { gap: 2.6, look: 'mgTwelve', cast: 'Twelve Chimes', dur: 3.4, pose: 'twelve', sub: 'The stopped clock strikes twelve at last, and everyone feels it: healer, ready!', run: (w, m) => raidwide(w, m, MG.raid, 3.4) };
const LAST_WALTZ = {
  gap: 2.6, look: ['mgSteps', 'mgSteps', 'mgSteps', 'mgLanterns'], cast: 'The Last Waltz', dur: 3, pose: 'steps', sub: 'The waltz and the lanterns at once: mind the counts and move off your spot!',
  run: (w, m, up) => {
    waltzSteps(w, m, 3);
    lanternsFall(w, m, up, 3);
  },
};
const HELPINGS = {
  gap: 1.4, cast: 'Second Helpings!', dur: 1.6, pose: 'clap', sub: 'Her butlers bring tarts: stop them before they reach her!',
  run: (w, m) => {
    const xs = [m.x - 560, m.x + 560].map((x) => Math.max(90, Math.min(w.map.width - 90, x)));
    adds(w, m, 'pumpkinbutler', xs, null);
    for (const b of w.dungeon.room.adds.slice(-2)) b.serving = true;
    m.mech.rounds = (m.mech.rounds ?? 0) + 1;
    radio(w, 'butlers');
  },
};
const WELCOME = [CARDS, PARTNERS, STEPS, TOES];
const LANTERN_LIGHT = [HELPINGS, LANTERNS, STEPS, BLOOM, PARTNERS, TOES];
// (three rounds of tarts and the kitchen is out: the rest of the phase without them)
const LANTERN_DONE = [LANTERNS, STEPS, BLOOM, PARTNERS, TOES];
const MIDNIGHT = [TWELVE, LAST_WALTZ, PARTNERS, BLOOM, TOES, CARDS];

function marigold(world, m, up, dt) {
  const now = world.now;
  const s = (m.mech ??= { phase: 1, feasts: [] });
  m.offstage = false;
  const frac = m.hp / m.def.hp;
  const phase = frac > 0.65 ? 1 : frac > 0.3 ? 2 : 3;
  if (phase > s.phase && !m.cast) {
    s.phase = phase;
    m.phaseAt = now;
    if (phase === 2) callout(world, 'Lantern Light!', 'The lanterns come down and the butlers bring tarts: stop them before they reach her!');
    else {
      callout(world, 'Midnight!', 'The stopped clock starts again. She is running out of party!');
      radio(world, 'midnight');
    }
  }
  // A tart reaching her: she eats it, and feels much better (as it lands in her hands).
  for (const at of s.feasts) {
    if (now < at) continue;
    m.hp = Math.min(m.def.hp, m.hp + Math.round(m.def.hp * MG.heal));
    m.feastAt = now;
  }
  s.feasts = s.feasts.filter((at) => now < at);
  // (a phase change: a held breath, her own little moment, before the next cast)
  if (m.phaseAt != null && now - m.phaseAt < 1.6) return true;
  if (s.phase === 2 && (s.rounds ?? 0) >= MG.rounds && !m.cast) s.tartsGone = true;
  return runRotation(world, m, s.phase === 1 ? WELCOME : s.phase === 2 ? (s.tartsGone ? LANTERN_DONE : LANTERN_LIGHT) : MIDNIGHT, up, dt);
}

// Her butler on his way with a tart: he walks to her side, minding no one (stop him!), and serves it;
// she eats it as it reaches her. Served (or with no hostess left to serve), he fights as usual.
export const SERVE_REACH = 46;
function butler(world, m, up, dt) {
  if (!m.serving) return false;
  const host = world.mobs.find((o) => o.def.mech === 'marigold' && o.hp > 0);
  if (!host) {
    m.serving = false;
    return false;
  }
  const dx = host.x - m.x;
  if (Math.abs(dx) > SERVE_REACH) {
    m.dir = Math.sign(dx) || m.dir;
    m.state = 'walk';
    m.x += m.dir * m.def.speed * dt;
    return true;
  }
  m.serving = false;
  m.served = true;
  m.state = 'idle';
  m.dir = Math.sign(dx) || m.dir;
  m.servedAt = world.now;
  m.serveDx = Math.abs(dx);
  m.atkT = 2.8;
  host.mech?.feasts?.push(world.now + 2.2);
  callout(world, 'A tart for her ladyship!', 'A butler reached her: she eats it and feels much better');
  return true;
}

// A manor boss down.
export function manorKilled(world, m) {
  if (m.def.mech === 'velvet' && world.dungeon?.room) world.dungeon.room.vvShut = null;
  if (m.def.mech !== 'marigold') return;
  // (her butlers bow out of the fight: the party's over)
  const room = world.dungeon?.room;
  const staff = world.mobs.filter((o) => o.def.mech === 'butler');
  world.mobs = world.mobs.filter((o) => o.def.mech !== 'butler');
  if (room) room.adds = room.adds.filter((o) => !staff.includes(o));
  // Elder Sakura, her one guest since festival night, goes home to the palace (render/prologue.js).
  world.char.elders = { ...(world.char.elders ?? {}), sakura: true };
  playScene(world, 'manor_freed');
}
