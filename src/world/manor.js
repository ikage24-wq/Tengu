// What makes each room of Moonlit Manor its own (docs/design/moonlit-manor.md; the map fields are
// described in data/maps.js), and its three boss fights. world/dungeon.js calls in here; the
// drawing is in render/manor.js.
//
//   The Moonlit Garden    fountains spout on a beat and throw whoever stands in the basin up to the
//                         high terraces; light the three garden lanterns.
//   The Portrait Gallery  the puzzle: four portraits on three floors, each turned through its four
//                         pictures; set them to the family crest shown in the hall (moon, rose...).
//   The Ballroom          Dame Rondo the Tailcoat Penguin and Dame Minuet the Upside-down Bat: the
//                         penguin has the floor, the bat the air; whatever the lead dances, her
//                         partner echoes mirrored across the chandelier's chain (below: Lead and
//                         Echo, Change Partners, the Lift); alone, the other dances both parts.
//   The Library           the lost books flutter along the shelves: catch them; page storms blow
//                         through the stacks and push everyone on that floor.
//   The Endless Hallway   the chase: Madame Velvet's tea trolley rumbles after the group; doors bar
//                         the way until their levers are pulled; at the end, Madame Velvet herself
//                         (scalding tea, flung plates to jump, the bell that calls the maids).
//   The Moonlit Rooftop   Lady Marigold, the Eternal Hostess (2026-11-26): Welcome, Guests!
//                         (invitations, a toast, don't leave, her dance card), Second Helpings
//                         (her Basset Butlers bring her tarts: stop them), Midnight (the chimes
//                         strike the roof in turn, the Hundred-Year Waltz).

import { addZone, adds, callout, hurtMember } from './dungeon.js';
import { runRotation, raidwide, buster, stack, spread, out, donut, tankOf, healerOf, dpsOf } from './bossfight.js';
import { navOf, surfaceBelow } from './nav.js';
import { playScene } from './story.js';
import { radio } from './hollow.js';

export const MANOR_MECHS = new Set(['waltz', 'velvet', 'marigold', 'butler']);

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
  room.chandelier = map.chandelier ? { x: map.chandelier.x, state: 'up', at: 0 } : null;
  // The hostess isn't out on the roof yet: she makes her entrance down the moon's beam in her scene
  // (render/marigold/: not drawn while `offstage`; her fight's first tick brings her on for good).
  for (const m of world.mobs) if (m.def.mech === 'marigold') m.offstage = true;
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

// Hand in hand: while the Ballroom's pair dance close together (in reach of each other), a blow on
// one is shared with her partner, so they wear down together and the dance reaches its last phase
// (render/manor.js draws the ribbon linking them). Returns the share the one struck takes; her
// partner's share comes off her at once (never the last of her health: only blows of her own beat
// her).
export const HAND_IN_HAND = { reach: 170, share: 0.4 };
export function manorShare(world, m, damage) {
  if (m.def.mech !== 'waltz' || damage <= 0) return damage;
  const partner = world.mobs.find((o) => o !== m && o.def.mech === 'waltz' && o.hp > 0);
  if (!partner || Math.abs(partner.x - m.x) > HAND_IN_HAND.reach || m.lift) return damage;
  const give = Math.min(Math.round(damage * HAND_IN_HAND.share), Math.max(0, partner.hp - 1));
  if (give <= 0) return damage;
  partner.hp -= give;
  partner.flash = Math.max(partner.flash ?? 0, 0.12);
  m.sharedAt = partner.sharedAt = world.now;
  return damage - give;
}

// Returns true while the boss is busy with a move of its own.
export function manorBoss(world, m, up, dt) {
  if (m.def.mech === 'waltz') return waltz(world, m, up, dt);
  if (m.def.mech === 'velvet') return velvet(world, m, up, dt);
  if (m.def.mech === 'marigold') return marigold(world, m, up, dt);
  if (m.def.mech === 'butler') return butler(world, m, up, dt);
  return false;
}

// ---------- The Ballroom: Dame Rondo and Dame Minuet ----------
// (2026-11-26, remade from the Waltzing Armours: the player's pick "A, Black Tie & Bat Wings".)
// The penguin can't fly and the bat can't really stand, so they split the room: Rondo, the Tailcoat
// Penguin, has the floor; Minuet, the Upside-down Bat, the air. One rotation for both, each step cast
// by one of them (world/bossfight.js, `by`), its name on her cast bar; whatever the lead dances, her
// partner echoes a beat later on the other side of the room, mirrored across the chandelier's chain
// (the cast bar says "Echo: ..."). Phases go by the pair's health together:
//   Lead and Echo (to 60%)   Rondo leads. Belly Slide (a polished lane: she slides along it; jump
//                            her or get up high), then its echo, Minuet's swoop at balcony height
//                            over the mirrored stretch (get down); Count of Three (everyone stacks
//                            on the gold marker), then its echo, Three Kisses (hearts on three
//                            players: spread); Tailcoat Twirl on the tank.
//   Change Partners (to 25%) Minuet leads and the safe order flips: her swoop first, Rondo's slide
//                            as the echo; her kisses first, Rondo's count as the echo; Echo Rings
//                            (three rings of song in turn: out, in, out); Crossing Slides (from both
//                            walls at once, one gap between them: find it).
//   The Lift (below 25%)     Minuet lifts Rondo and the penguin flies at last: the Grand Lift sweeps
//                            the room low (jump or be up high), then high (be on the floor), its path
//                            drawn ahead; then their count and kisses, the twirl, and the Final Bow
//                            (a gentle hit on everyone).
// When one falls the other dances alone: Minuet dances both parts herself (each pattern lands, then
// its own echo); Rondo slides twice as often and counts faster.
// Each one's state for her rig: m.cast / m.castPose (the rotation), m.charging (Rondo sliding),
// m.goto (skating or flying to a spot first), m.fly { y } (Minuet up in the air), m.lift { y } (both,
// in the Grand Lift), m.hang (Minuet hanging upside-down from her ribbon), m.ringsAt, m.alone.

// How high the bat's echo sweeps over the floor (the band is drawn there; world/dungeon.js inZone
// counts anyone well off the floor as up high for it, z.high).
export const WALTZ_HIGH = 100;
const SLIDE = 340;
const SKATE = 380;
const centreOf = (world) => world.dungeon.room.chandelier?.x ?? world.map.width / 2;
const mirrorX = (world, x) => 2 * centreOf(world) - x;
const wallsOf = (world, m) => [m.fx1 ?? 40, m.fx2 ?? world.map.width - 40];
const pairOf = (world) => ({
  rondo: world.mobs.find((o) => o.def.id === 'waltzrondo' && o.hp > 0) ?? null,
  minuet: world.mobs.find((o) => o.def.id === 'waltzminuet' && o.hp > 0) ?? null,
});
// The shared memory of the pair's dance (what the lead just did, for the echo; the lift), kept on
// whichever of them leads the rotation.
const memOf = (world) => {
  const { rondo, minuet } = pairOf(world);
  const lead = rondo ?? minuet;
  return lead ? (lead.mech ??= {}) : {};
};

// A slide along the floor for Rondo: a lane from `x0` to `x1` (she skates to x0 first if she isn't
// there), laid now to land in `dur`; she slides it as it lands, bowling over whoever is on the floor
// in her way (jump her, or be up high).
function slideLane(world, m, x0, x1, dur, damage = 160) {
  const dir = x1 >= x0 ? 1 : -1;
  m.goto = Math.abs(m.x - x0) > 6 ? x0 : null;
  m.slideTo = x1;
  m.slideDamage = damage;
  addZone(world, { kind: 'lane', x: Math.min(x0, x1), w: Math.abs(x1 - x0), warn: dur, from: m, dir });
  return [Math.min(x0, x1), Math.max(x0, x1)];
}
// A swoop through the air for Minuet over a stretch of the room at balcony height: anyone up high in
// it is struck as it lands (drop to the floor); she rises and flies it.
function swoopHigh(world, m, x0, x1, dur, damage = 150) {
  addZone(world, { kind: 'band', high: true, x: Math.min(x0, x1), w: Math.abs(x1 - x0), dir: x1 >= x0 ? 1 : -1, y: world.map.groundY - WALTZ_HIGH, warn: dur, damage, from: m });
  m.swoop = { x0, x1, land: world.now + dur, y: WALTZ_HIGH };
  return [Math.min(x0, x1), Math.max(x0, x1)];
}
// The stretch from x to the wall it's furthest from.
const farStretch = (world, m, x) => {
  const [l, r] = wallsOf(world, m);
  return x < centreOf(world) ? [x, r] : [x, l];
};
// Markers: three heart kisses (spread) on three of the group; the gold count of three (stack).
function kisses(world, m, up, dur, damage = 130) {
  const list = [...up].sort(() => Math.random() - 0.5).slice(0, 3);
  for (const g of list) addZone(world, { kind: 'spread', target: g.id, x: g.body.x, y: g.body.y, w: 66, warn: dur, lock: 0.6, damage, from: m });
}
const countOf = (world, m, up, dur) => stack(world, m, healerOf(up) ?? dpsOf(up), 480, dur, Math.min(3, up.length));

// The steps (each `run` lays its telegraphs to land as the cast ends; an echo reads memOf()).
const BELLY_SLIDE = {
  gap: 2.4, by: 'rondo', look: 'polish', cast: 'Belly Slide', dur: 2.8, pose: 'slide', sub: 'One, two, THREE: jump her, or get up high!',
  run: (w, m) => {
    const [a, b] = farStretch(w, m, m.x);
    memOf(w).last = slideLane(w, m, a, b, 2.8);
    memOf(w).lastFrom = a;
  },
};
const ECHO_SWOOP = {
  gap: 0.3, by: 'minuet', look: 'echoswoop', cast: 'Echo: Belly Slide', dur: 2.2, pose: 'swoop', sub: 'She echoes it up high on the other side: get down!',
  run: (w, m) => {
    const mem = memOf(w);
    const [a, b] = mem.last ?? farStretch(w, m, m.x);
    const from = mem.lastFrom ?? a;
    const to = from === a ? b : a;
    swoopHigh(w, m, mirrorX(w, from), mirrorX(w, to), 2.2);
  },
};
const COUNT = { gap: 2.4, by: 'rondo', look: 'count', cast: 'Count of Three', dur: 3.2, pose: 'count', sub: 'Everyone in the gold marker on THREE!', run: (w, m, up) => countOf(w, m, up, 3.2) };
const ECHO_KISSES = { gap: 0.3, by: 'minuet', look: 'kiss', cast: 'Echo: Three Kisses', dur: 2.4, pose: 'kiss', sub: 'Hearts on three of you: now spread out!', run: (w, m, up) => kisses(w, m, up, 2.4) };
const TWIRL = { gap: 2.4, by: 'rondo', look: 'twirl', cast: 'Tailcoat Twirl', dur: 2.6, pose: 'twirl', sub: 'A spin at the tank: everyone else, step clear', run: (w, m, up) => buster(w, m, tankOf(up), 320, 2.6) };
const LEAD_ECHO = [BELLY_SLIDE, ECHO_SWOOP, COUNT, ECHO_KISSES, TWIRL];

// Change Partners: Minuet leads from the air, Rondo echoes on the floor.
const SWOOP = {
  gap: 2.4, by: 'minuet', look: 'echoswoop', cast: 'Ceiling Swoop', dur: 2.8, pose: 'swoop', sub: 'She sweeps the balconies: get down!',
  run: (w, m) => {
    const [a, b] = farStretch(w, m, m.x);
    memOf(w).last = swoopHigh(w, m, a, b, 2.8);
    memOf(w).lastFrom = a;
  },
};
const ECHO_SLIDE = {
  gap: 0.3, by: 'rondo', look: 'polish', cast: 'Echo: Belly Slide', dur: 2.4, pose: 'echoslide', sub: 'Now Rondo slides it on the floor: jump her, or get up high!',
  run: (w, m) => {
    const mem = memOf(w);
    const [a, b] = mem.last ?? farStretch(w, m, m.x);
    const from = mem.lastFrom ?? a;
    const to = from === a ? b : a;
    slideLane(w, m, mirrorX(w, from), mirrorX(w, to), 2.4);
  },
};
const KISSES = { gap: 2.4, by: 'minuet', look: 'kiss', cast: 'Three Kisses', dur: 2.6, pose: 'kiss', sub: 'Hearts on three of you: spread out!', run: (w, m, up) => kisses(w, m, up, 2.6) };
const ECHO_COUNT = { gap: 0.3, by: 'rondo', look: 'count', cast: 'Echo: Count of Three', dur: 2.6, pose: 'echocount', sub: 'Now all together in the gold marker!', run: (w, m, up) => countOf(w, m, up, 2.6) };
const RINGS = {
  gap: 2.4, by: 'minuet', look: 'rings', cast: 'Echo Rings', dur: 3, pose: 'rings', sub: 'Three rings of song: out, then in, then out!',
  run: (w, m) => {
    m.ringsAt = w.now + 3;
    out(w, m, 74, 140, 3);
    donut(w, m, 74, 190, 140, 4.3);
    out(w, m, 74, 140, 5.6);
  },
};
const CROSSING = {
  gap: 3.4, by: 'rondo', look: 'polish', cast: 'Crossing Slides', dur: 3.4, pose: 'crossing', sub: 'From both walls at once: find the gap!',
  run: (w, m) => {
    const { minuet } = pairOf(w);
    const [l, r] = wallsOf(w, m);
    const c = centreOf(w);
    const gx = Math.max(l + 160, Math.min(r - 160, c + (Math.random() - 0.5) * 520));
    const half = 62;
    slideLane(w, m, l, gx - half, 3.4, 170);
    // (Minuet skims in low from the other wall at the same time: the floor's other half.)
    addZone(w, { kind: 'band', x: gx + half, w: r - (gx + half), dir: -1, warn: 3.4, damage: 170, from: minuet ?? m });
    if (minuet) {
      minuet.goto = r;
      minuet.skim = { x0: r, x1: gx + half, land: w.now + 3.4 };
      minuet.cast = { name: 'Crossing Slides', t0: w.now, dur: 3.4 };
      minuet.castPose = 'swoop';
      minuet.castEnd = w.now + 3.4;
    }
  },
};
const CHANGE = [SWOOP, ECHO_SLIDE, KISSES, ECHO_COUNT, { ...RINGS, gap: 2.4 }, { ...CROSSING, gap: 5 }, { ...TWIRL, gap: 3.6 }];

// The Lift: the Grand Lift's two passes, low then high, its path laid out ahead; then the Final Bow.
const LIFT_LOW = 0.2;
const LIFT_HIGH = 2.6;
const GRAND_LIFT = {
  gap: 1.6, by: 'minuet', look: 'lift', cast: 'Grand Lift', dur: 3.6, pose: 'lift', sub: 'They fly! Low across the floor first (jump or get up), then high (get down)!',
  run: (w, m) => {
    const { rondo } = pairOf(w);
    const [l, r] = wallsOf(w, m);
    const dir = m.x < centreOf(w) ? 1 : -1;
    const from = dir > 0 ? l : r;
    const to = dir > 0 ? r : l;
    // pass 1: the whole floor (low); pass 2: everything up high (the band at balcony height)
    addZone(w, { kind: 'floor', x: 0, w: w.map.width, warn: 3.6 + LIFT_LOW, damage: 170, from: m, pass: 1 });
    addZone(w, { kind: 'band', high: true, x: l - 30, w: r - l + 60, dir: -dir, y: w.map.groundY - WALTZ_HIGH, warn: 3.6 + LIFT_HIGH, damage: 170, from: m, pass: 2 });
    const t0 = w.now;
    memOf(w).lift = { t0, from, to, dir, x0: m.x, x0r: rondo?.x ?? m.x, rondo, minuet: m, end: t0 + 3.6 + LIFT_HIGH + 1.2 };
    if (rondo) {
      rondo.cast = { name: 'Grand Lift', t0, dur: 3.6 };
      rondo.castPose = 'lift';
      rondo.castEnd = t0 + 3.6;
    }
  },
};
const FINAL_BOW = {
  gap: 2.4, by: 'rondo', look: 'bow', cast: 'Final Bow', dur: 3, pose: 'bow', sub: 'A bow for everyone: healer, ready!',
  run: (w, m) => {
    raidwide(w, m, 120, 3);
    const { minuet } = pairOf(w);
    if (minuet) {
      minuet.cast = { name: 'Final Bow', t0: w.now, dur: 3 };
      minuet.castPose = 'bow';
      minuet.castEnd = w.now + 3;
    }
  },
};
const LIFT = [GRAND_LIFT, { ...COUNT, gap: 2.4 }, ECHO_KISSES, TWIRL, FINAL_BOW];

// Alone.
const ALONE = {
  rondo: [BELLY_SLIDE, { ...COUNT, dur: 2.4, run: (w, m, up) => countOf(w, m, up, 2.4) }, BELLY_SLIDE, TWIRL].map((st) => ({ ...st, gap: 1.6 })),
  minuet: [
    { ...SWOOP, sub: 'She sweeps the balconies alone: get down!' },
    { ...ECHO_SWOOP, cast: 'Echo: Ceiling Swoop', sub: 'And echoes it herself on the other side: stay down!' },
    KISSES,
    { ...ECHO_KISSES, by: 'minuet' },
    RINGS,
  ].map((st) => ({ ...st, gap: st.gap === 0.3 ? 0.4 : 1.8 })),
};

// Her moves on her own clock: skating to a spot, sliding, swooping, skimming, the rings.
function waltzMoves(world, m, dt) {
  const now = world.now;
  // (a cast laid on her by her partner's step: it ends on its own clock, like a rotation's)
  if (m.castEnd != null && now >= m.castEnd) {
    if (m.cast) {
      m.lastPose = m.castPose;
      m.attackAt = m.cast.t0 + m.cast.dur;
    }
    m.cast = null;
    m.castPose = null;
    m.castEnd = null;
  }
  // (her wind-up over its last half second, as the rotation's own casts have)
  if (m.castEnd != null && m.cast) {
    const left = m.castEnd - now;
    m.windup = left > 0 && left < 0.5 ? left : 0;
  }
  let busy = false;
  // Sliding (Rondo): along the lane to its end, bowling over whoever is on the floor in her way.
  const c = m.charging;
  if (c) {
    m.goto = null;
    m.state = 'walk';
    m.dir = c.dir;
    const end = m.slideTo ?? (c.dir > 0 ? m.fx2 : m.fx1);
    m.x += c.dir * SLIDE * dt;
    for (const g of c.up ?? []) {
      if (c.hit.has(g.id) || g.remote || Math.abs(g.body.x - m.x) > m.def.w / 2 + 8 || Math.abs(g.body.y - m.y) > 40) continue;
      c.hit.add(g.id);
      hurtMember(world, g, m.slideDamage ?? 160, m.x - c.dir * 40, { knock: true });
    }
    if ((c.dir > 0 && m.x >= end) || (c.dir < 0 && m.x <= end) || m.x <= m.fx1 || m.x >= m.fx2) {
      m.x = Math.max(m.fx1, Math.min(m.fx2, end));
      m.charging = null;
      m.slideTo = null;
      m.landAt = now;
      m.back = true;
    }
    m.x = Math.max(m.fx1, Math.min(m.fx2, m.x));
    busy = true;
  } else if (m.goto != null) {
    // Skating (or flying) over to the start of her next move.
    const d = m.goto - m.x;
    m.dir = Math.sign(d) || m.dir;
    m.state = 'walk';
    const step = Math.min(Math.abs(d), SKATE * dt);
    const x0 = m.x;
    m.x = Math.max(m.fx1, Math.min(m.fx2, m.x + Math.sign(d) * step));
    if (Math.abs(m.goto - m.x) < 1 || Math.abs(m.x - x0) < 0.01) m.goto = null;
    busy = true;
  }
  // Swooping (Minuet): up into the air and over to the start, then along the stretch as it lands.
  const sw = m.swoop;
  if (sw) {
    const left = sw.land - now;
    m.fly = { y: sw.y * Math.min(1, Math.max(0, (2.2 - left) / 1.2)) };
    if (left > 0.25) {
      const d = sw.x0 - m.x;
      m.dir = Math.sign(d) || Math.sign(sw.x1 - sw.x0) || m.dir;
      m.x += Math.sign(d) * Math.min(Math.abs(d), 620 * dt);
      if (Math.abs(d) < 2) m.dir = Math.sign(sw.x1 - sw.x0) || m.dir;
    } else {
      const u = Math.min(1, (0.25 - left) / 0.85);
      m.x = sw.x0 + (sw.x1 - sw.x0) * u;
      m.dir = Math.sign(sw.x1 - sw.x0) || m.dir;
      if (u >= 1) {
        m.swoop = null;
        m.landAt = now;
        m.back = true;
      }
    }
    m.state = 'walk';
    m.x = Math.max(m.fx1, Math.min(m.fx2, m.x));
    busy = true;
  } else if (m.skim) {
    // (skimming in low from the wall in Crossing Slides)
    const sk = m.skim;
    const left = sk.land - now;
    m.fly = { y: 14 };
    if (left <= 0.3) {
      m.goto = null;
      const u = Math.min(1, (0.3 - left) / 0.5);
      m.x = sk.x0 + (sk.x1 - sk.x0) * u;
      m.dir = Math.sign(sk.x1 - sk.x0) || m.dir;
      if (u >= 1) {
        m.skim = null;
        m.landAt = now;
        m.back = true;
      }
    }
    m.state = 'walk';
    busy = true;
  } else if (m.fly && !m.lift) {
    // back down to her own height
    const y = m.fly.y - 160 * dt;
    m.fly = y > 0.5 ? { y } : null;
  }
  // The rings of song: she hangs where she is until they're all out.
  if (m.ringsAt != null) {
    if (now < m.ringsAt + 2.8) busy = true;
    else m.ringsAt = null;
  }
  if (m.def.id === 'waltzminuet') m.hang = m.castPose === 'kiss' || m.castPose === 'rings' || m.ringsAt != null;
  return busy;
}

// The Grand Lift's flight: rising during the cast, the low pass across the room, up, the high pass
// back, and down.
function tickLift(world, lf) {
  const now = world.now;
  const u = now - lf.t0;
  const pair = [lf.rondo, lf.minuet].filter((o) => o && o.hp > 0);
  if (pair.length < 2 || now >= lf.end) {
    for (const o of [lf.rondo, lf.minuet]) if (o) o.lift = null;
    return false;
  }
  const D = 3.6;
  const ease = (v) => v * v * (3 - 2 * v);
  const top = WALTZ_HIGH - 10;
  // where they are along the room (0 at `from`), and how high
  let k;
  let y;
  let back = false;
  // (first the bat flies over and picks the penguin up, then they rise and glide to the wall they
  // start from)
  const PICK = 1.1;
  if (u < PICK) {
    const v = ease(Math.min(1, u / PICK));
    lf.minuet.x = lf.x0 + (lf.x0r - lf.x0) * v;
    lf.minuet.dir = Math.sign(lf.x0r - lf.x0) || lf.minuet.dir;
    lf.minuet.state = 'walk';
    lf.minuet.lift = { y: 40 + 20 * Math.sin(Math.PI * v) };
    lf.rondo.lift = { y: 0 };
    lf.rondo.x = lf.x0r;
    return true;
  }
  let x0 = null;
  if (u < D - 0.45) {
    k = 0;
    y = 30 * ease(Math.min(1, (u - PICK) / 1.1));
    x0 = ease(Math.min(1, (u - PICK) / (D - 0.6 - PICK)));
  } else if (u < D + LIFT_LOW + 0.45) {
    k = ease(Math.min(1, (u - (D - 0.45)) / (LIFT_LOW + 0.9)));
    y = 30 - 18 * Math.sin(Math.PI * k);
  } else if (u < D + LIFT_HIGH - 0.45) {
    k = 1;
    y = 30 + (top - 30) * ease(Math.min(1, (u - (D + LIFT_LOW + 0.45)) / 1.3));
  } else if (u < D + LIFT_HIGH + 0.45) {
    k = 1 - ease(Math.min(1, (u - (D + LIFT_HIGH - 0.45)) / 0.9));
    y = top;
    back = true;
  } else {
    k = 0;
    y = top * (1 - ease(Math.min(1, (u - (D + LIFT_HIGH + 0.45)) / 0.75)));
  }
  for (const o of pair) {
    const start = lf.x0r;
    const x = x0 != null ? start + (lf.from - start) * x0 : lf.from + (lf.to - lf.from) * k;
    o.x = Math.max(o.fx1, Math.min(o.fx2, x));
    o.dir = x0 != null ? Math.sign(lf.from - start) || lf.dir : back ? -lf.dir : lf.dir;
    o.state = k > 0 && k < 1 ? 'walk' : 'idle';
  }
  lf.rondo.lift = { y };
  lf.minuet.lift = { y: y + 40 };
  return true;
}

const partnerBusy = (o) => Boolean(o && (o.charging || o.goto != null || o.swoop || o.skim || o.ringsAt != null || o.lift));

function waltz(world, m, up, dt) {
  const s = (m.mech ??= {});
  const { rondo, minuet } = pairOf(world);
  const partner = m === rondo ? minuet : rondo;
  const me = m.def.id === 'waltzrondo' ? 'rondo' : 'minuet';
  if (!partner && !s.alone) {
    s.alone = true;
    s.rot = null;
    s.lift = null;
    Object.assign(m, { alone: true, cast: null, castPose: null, castEnd: null, windup: 0, lift: null, swoop: null, skim: null, ringsAt: null, hang: false });
    callout(world, `${m.def.name.split(',')[0]} dances alone!`, me === 'rondo' ? 'She slides twice as often now, and counts faster' : 'She dances both parts herself now: each move, then its echo');
    radio(world, 'alone');
  }
  // (the slide bowls over whoever's on the floor in her way)
  if (m.charging) m.charging.up = up;
  // After a slide or a swoop she glides straight back to her partner's side (hand in hand again).
  if (m.back && !m.charging && !m.swoop && !m.skim && m.goto == null) {
    m.back = false;
    if (partner && Math.abs(partner.x - m.x) > 110) m.goto = partner.x + (m.x < partner.x ? -60 : 60);
  }
  // The lead keeps the dance (and the lift); her partner follows it.
  const lead = rondo ?? minuet;
  if (lead === m && s.lift && !tickLift(world, s.lift)) s.lift = null;
  const lifting = Boolean(m.lift);
  const busy = waltzMoves(world, m, dt);
  if (s.alone) return runRotation(world, m, ALONE[me], up, dt, { [me]: m, caster: m }) || busy;
  if (lead !== m) return Boolean(m.cast) || busy || lifting;
  // Phases by the pair's health together.
  const frac = (rondo.hp + minuet.hp) / (rondo.def.hp + minuet.def.hp);
  const phase = frac > 0.6 ? 1 : frac > 0.25 ? 2 : 3;
  if ((s.phase ?? 1) !== phase) {
    s.phase = phase;
    if (phase === 2) {
      callout(world, 'Change Partners!', 'Minuet leads from the air now: the order flips');
      radio(world, 'partners');
    } else {
      callout(world, 'The Lift!', 'Minuet lifts Rondo off her feet: the penguin flies!');
      radio(world, 'lift');
    }
  }
  const list = phase === 1 ? LEAD_ECHO : phase === 2 ? CHANGE : LIFT;
  // (No new step while the one whose step it is is still busy with her last move, nor during the
  // lift; an echo starts as soon as its dancer is free, while the lead is still sliding.)
  const rot = s.rot;
  const waiting = !rot || rot.end == null;
  const next = rot && rot.list === list ? list[rot.i] : list[0];
  const who = next?.by === 'minuet' ? minuet : rondo;
  if (waiting && (s.lift || partnerBusy(who) || (who === m && busy))) {
    if (rot && rot.list === list) rot.wait = Math.max(rot.wait, 0.4);
    return true;
  }
  return runRotation(world, m, list, up, dt, { rondo, minuet, caster: m }) || busy || lifting;
}

function velvet(world, m, up, dt) {
  const s = (m.mech ??= { tea: 5, plates: 11, bells: [0.7, 0.4] });
  const frac = m.hp / m.def.hp;
  const nonTanks = up.filter((g) => g.role !== 'tank');
  const pending = world.dungeon.zones.some((z) => !z.hit);
  s.tea -= dt;
  s.plates -= dt;
  if (s.tea <= 0 && up.length) {
    s.tea = 9;
    for (const g of [...(nonTanks.length ? nonTanks : up)].sort(() => Math.random() - 0.5).slice(0, 3)) {
      addZone(world, { kind: 'circle', x: g.body.x, y: floorY(world, g.body), w: 64, warn: 1.6, damage: 140, from: m, tea: true });
    }
    callout(world, 'Tea is served!', 'Scalding: step out of the steam');
    m.teaAt = world.now;
  }
  if (s.plates <= 0) {
    if (pending) s.plates = 1;
    else {
      s.plates = 13;
      addZone(world, { kind: 'floor', x: 0, w: world.map.width, warn: 1.6, damage: 180, from: m, plates: true });
      callout(world, 'Plates!', 'A stack of plates skims the floor: jump!');
      m.slamming = world.now + 1.6;
    }
  }
  if (s.bells.length && frac <= s.bells[0]) {
    s.bells.shift();
    const healer = up.find((g) => g.role === 'healer') ?? pick(up);
    adds(world, m, 'ghostmaid', [m.x - 160, m.x + 160], healer?.id);
    m.callAt = world.now;
    callout(world, 'Madame Velvet rings the bell!', 'The maids come running for the healer: catch them!');
    radio(world, 'bell');
  }
  return m.slamming > world.now;
}

// Lady Marigold, the Eternal Hostess (remade 2026-11-26, with a brand-new fight; her look:
// render/marigold/). The party that never ends, fought the way a hostess throws one: every cast is a
// party moment, named on her cast bar, its telegraph drawn in her own marigold-and-moonlight look
// (render/marigold/looks.js). Phases go by her health:
//   Welcome, Guests! (to 65%)  Invitations (an envelope over each of you: spread out); Don't Leave!
//                              (petals drift over the whole roof but her arms' reach: come in close);
//                              A Toast! (a gold ring round one of you: everyone in to clink glasses);
//                              May I Have This Dance? (her dance card writes the tank's name: a heavy
//                              twirl on them, everyone else clear).
//   Second Helpings (to 30%)   she claps for her butlers: two Basset Butlers come in from the ends of
//                              the roof, each with a pumpkin tart under his cloche, walking to her;
//                              any who reaches her serves it, and she eats it and feels much better
//                              (3% of her health). Stop them on the way. (Three rounds at most: then
//                              the kitchen is out of tarts, and A Toast! takes their place.) Between the claps: Give Me
//                              Room! (her ghostly train swirls round her: get out), then at once Don't
//                              Leave! (back in close); Invitations; the dance.
//   Midnight (below 30%)       the stopped clocks start again: Midnight Chimes (the roof in four
//                              stretches, struck one after another: wait where it already rang, or up
//                              on a chimney); Not Yet! (her train swirls round her and an invitation
//                              finds each of you: out, and apart); A Toast!; the Hundred-Year Waltz
//                              (she waltzes alone and it hurts everyone: a check on the healer); the
//                              dance.
// Her state for her rig: m.cast / m.castPose (the rotation; poses 'invite', 'stay', 'room', 'toast',
// 'dance', 'clap', 'chime', 'waltz'), m.mech.phase, m.phaseAt (a phase change: her own little moment
// before the next cast), m.feastAt (a tart eaten).
const MG = { spread: 150, stay: 190, stack: 520, buster: 360, room: 190, chime: 200, raid: 150, heal: 0.03, rounds: 3 };
// (Don't Leave!: a ring from just outside her arms' reach to past both ends of the roof)
const stayRing = (w, m, dur) => donut(w, m, 92, Math.max(m.x, w.map.width - m.x) + 40, MG.stay, dur);
const INVITES = { gap: 2.6, look: 'mgInvite', cast: 'Invitations', dur: 3, pose: 'invite', sub: 'An invitation for each of you: spread out!', run: (w, m, up) => spread(w, m, up, MG.spread, 3, 76) };
const STAY = { gap: 2.4, look: 'mgStay', cast: "Don't Leave!", dur: 3.2, pose: 'stay', sub: 'Petals everywhere but her arms: come in close!', run: (w, m) => stayRing(w, m, 3.2) };
const TOAST = { gap: 2.4, look: 'mgToast', cast: 'A Toast!', dur: 3.2, pose: 'toast', sub: 'Raise your glasses together: everyone in the gold ring!', run: (w, m, up) => stack(w, m, healerOf(up) ?? dpsOf(up), MG.stack, 3.2, Math.min(3, up.length), 104) };
const DANCE = { gap: 2.4, look: 'mgDance', cast: 'May I Have This Dance?', dur: 2.8, pose: 'dance', sub: "She writes the tank's name on her dance card: everyone else, step clear", run: (w, m, up) => buster(w, m, tankOf(up), MG.buster, 2.8, 84) };
const ROOM = { gap: 2.4, look: 'mgRoom', cast: 'Give Me Room!', dur: 2.6, pose: 'room', sub: 'Her train swirls round her: get out!', run: (w, m) => out(w, m, 150, MG.room, 2.6) };
const STAY_NOW = { ...STAY, gap: 0.2, dur: 2.2, cast: "...Don't Leave!", sub: 'No, come back! In close, now!', run: (w, m) => stayRing(w, m, 2.2) };
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
const CHIMES = {
  gap: 2.2, look: 'mgChime', cast: 'Midnight Chimes', dur: 2.6, pose: 'chime', sub: 'The clocks strike one stretch after another: wait where it already rang, or get up high!',
  run: (w, m) => {
    const x0 = 30;
    const W = (w.map.width - 60) / 4;
    const dir = Math.random() < 0.5 ? 1 : -1;
    for (let k = 0; k < 4; k++) {
      const i = dir > 0 ? k : 3 - k;
      addZone(w, { kind: 'band', x: x0 + i * W, w: W, dir, warn: 2.6 + k * 0.9, damage: MG.chime, from: m, chime: k + 1 });
    }
  },
};
const NOT_YET = {
  gap: 3.4, look: ['mgRoom', 'mgInvite'], cast: 'Not Yet!', dur: 3, pose: 'room', sub: 'Her train swirls round her and an invitation finds each of you: out, and apart!',
  run: (w, m, up) => {
    out(w, m, 150, MG.room, 3);
    spread(w, m, up, MG.spread, 3, 76);
  },
};
const WALTZ_ALONE = { gap: 2.4, look: 'mgWaltz', cast: 'Hundred-Year Waltz', dur: 3.4, pose: 'waltz', sub: 'She waltzes alone, and it hurts everyone: healer, ready!', run: (w, m) => raidwide(w, m, MG.raid, 3.4) };
const WELCOME = [INVITES, STAY, TOAST, DANCE];
const HELPS = [HELPINGS, ROOM, STAY_NOW, INVITES, DANCE];
// (three rounds of tarts and the kitchen is out: the rest of the phase without them)
const HELPS_DONE = [ROOM, STAY_NOW, INVITES, TOAST, DANCE];
const MIDNIGHT = [CHIMES, NOT_YET, TOAST, WALTZ_ALONE, DANCE];

function marigold(world, m, up, dt) {
  const now = world.now;
  const s = (m.mech ??= { phase: 1, feasts: [] });
  m.offstage = false;
  const frac = m.hp / m.def.hp;
  const phase = frac > 0.65 ? 1 : frac > 0.3 ? 2 : 3;
  if (phase > s.phase && !m.cast) {
    s.phase = phase;
    m.phaseAt = now;
    if (phase === 2) callout(world, 'Second Helpings!', 'She claps for her butlers: stop them before they reach her with their tarts!');
    else {
      callout(world, 'Midnight!', 'The stopped clocks start again. She is running out of party!');
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
  return runRotation(world, m, s.phase === 1 ? WELCOME : s.phase === 2 ? (s.tartsGone ? HELPS_DONE : HELPS) : MIDNIGHT, up, dt);
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
