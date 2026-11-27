// What makes each room of the Sky Whale's Back its own (docs/design/sky-whale.md; the map fields are
// described in data/maps.js), and its three boss fights. world/dungeon.js calls in here; the drawing
// is in render/skywhale.js.
//
//   The Tail Docks        the tail flips: after a warning, everyone on the floor slides one way
//                         (ropes and ledges are safe); tie the three moorings.
//   The Spine Market      gusts push everyone one way for a few seconds; the blowholes erupt on a
//                         beat and throw whoever stands on them up to the stalls.
//   The Lung Gardens      the puzzle: the room breathes in (a pull to the middle) and out (a push
//                         outward); the air-blooms open only on the breath out. Tend all three.
//   The Blowhole Deck     Captain Gale (remade 2026-11-27, her new fight below): Fair Winds, Squall
//                         (her sails on the deck: shelter in their lee from the Full Gale) and Full
//                         Gale (the wind swinging round from either end); the great blowhole still
//                         erupts in the middle on its beat.
//   The Barnacle Fortress the Barnacle Matriarch (remade 2026-11-27, her new fight below): Low Tide,
//                         Rising Tide (Find the Pearl: watch her clams shuffle, then shelter in the
//                         pearl's clam from the tide) and Spring Tide (faster shells).
//   The Whale's Brow      the Whale's Dream: Lullaby circles, the Deep Dive under someone, and in
//                         her last third the Starlight Song (the wind lanes swap sides, faster and
//                         faster). She wakes at the end.
//                         Since Chapter 10 (2026-11-19) she isn't the boss: she sleeps at the brow,
//                         Elder Ohagi under a parasol on her head, and the boss is The Sulk, the storm
//                         cloud of her sadness (sulk() below, built the FFXIV way: world/bossfight.js).
//                         Clear the storm and she wakes and sings.

import { addZone, adds, callout } from './dungeon.js';
import { navOf, surfaceBelow } from './nav.js';
import { playScene } from './story.js';
import { radio } from './hollow.js';
import { GRAVITY } from './physics.js';
import { runRotation, raidwide, buster, stack, spread, cleave, band, out, donut, tankOf, healerOf, dpsOf } from './bossfight.js';

export const WHALE_MECHS = new Set(['gale', 'matriarch', 'whaledream', 'whalestorm']);
export const WHALE_CHANNEL = { mooring: 1.2, airbloom: 1 };

const pick = (list) => list[Math.floor(Math.random() * list.length)];
const floorY = (world, body) => {
  const nav = navOf(world.map);
  return nav.surfaces[Math.max(0, surfaceBelow(nav, body.x, body.y))].y;
};
// Throw a body up `h` px (a blowhole's eruption).
const launch = (body, h) => Object.assign(body, { vy: -Math.sqrt(2 * GRAVITY * h), onGround: false, rope: null });

// ---------- Rooms ----------

export function whaleSetup(world, room) {
  const map = world.map;
  if (map.dungeon !== 'skywhale') return;
  room.flip = map.tailflip ? { next: world.now + map.tailflip.every, dir: 1, until: 0, warned: false } : null;
  room.gust = map.gusts ? { next: world.now + map.gusts.every, dir: -1, until: 0 } : null;
  room.geysers = (map.geysers ?? []).map((g, i) => ({ ...g, next: world.now + g.every * (0.5 + i * 0.3), at: -9 }));
  room.breath = map.breath ? { t: 0, phase: 'in' } : null;
}

// The lungs breathing: -1 fully in .. +1 fully out (a smooth sine), and whether it's breathing out.
export function breathOf(world) {
  const b = world.dungeon?.room?.breath;
  if (!b) return null;
  const v = Math.sin((b.t / world.map.breath.period) * Math.PI * 2);
  return { v, out: v > 0.15 };
}
// An air-bloom opens only on the breath out.
export function tendBloom(world, o) {
  const br = breathOf(world);
  if (br && !br.out) {
    o.progress = 0;
    callout(world, 'The bloom is closed', 'Wait for the breath out');
    return false;
  }
  return true;
}
// Party members tend a bloom only when the breath out has time left in it.
export const bloomOpen = (world, o) => {
  if (o.kind !== 'airbloom') return true;
  const b = world.dungeon?.room?.breath;
  if (!b) return true;
  const per = world.map.breath.period;
  const u = (((b.t / per) % 1) + 1) % 1;
  return u > 0.05 && u < 0.3;
};

const slide = (world, up, dir, push, dt, air = false) => {
  const map = world.map;
  for (const g of up) {
    const b = g.body;
    if (b.rope || (!air && !b.onGround)) continue;
    b.x = Math.max(24, Math.min(map.width - 24, b.x + dir * push * dt));
  }
};

export function tickWhale(world, dt, group, up) {
  const run = world.dungeon;
  const room = run?.room;
  const map = world.map;
  if (map.dungeon !== 'skywhale' || !room) return;
  // The tail flips: a warning, then everyone on the ground floor slides.
  const fl = room.flip;
  if (fl && up.length) {
    if (!fl.warned && world.now > fl.next - 1.6) {
      fl.warned = true;
      fl.dir = -fl.dir;
      callout(world, 'The tail is rising!', fl.dir > 0 ? 'Hold on: the deck tips east!' : 'Hold on: the deck tips west!');
    }
    if (world.now > fl.next) {
      fl.until = world.now + 1.4;
      fl.next = world.now + map.tailflip.every;
      fl.warned = false;
      world.juice.push({ type: 'shake', mag: 4, dur: 0.6 });
    }
    if (world.now < fl.until) for (const g of up) if (Math.abs(g.body.y - map.groundY) < 2) slide(world, [g], fl.dir, map.tailflip.push, dt);
  }
  // Gusts across the spine.
  const gu = room.gust;
  if (gu && map.gusts && up.length) {
    if (world.now > gu.next) {
      gu.dir = Math.random() < 0.5 ? -1 : 1;
      gu.until = world.now + map.gusts.dur;
      gu.next = world.now + map.gusts.every;
      callout(world, 'A gust!', gu.dir > 0 ? 'The wind shoves east' : 'The wind shoves west');
    }
    if (world.now < gu.until) slide(world, up, gu.dir, map.gusts.push, dt, true);
  }
  // The blowholes, each on its own beat.
  for (const gz of room.geysers ?? []) {
    if (world.now > gz.next) {
      gz.at = world.now;
      gz.next = world.now + gz.every;
      for (const g of up) if (g.body.onGround && Math.abs(g.body.x - gz.x) < gz.w / 2 && Math.abs(g.body.y - map.groundY) < 2) launch(g.body, gz.up);
    }
  }
  // The lungs breathe: a pull to the middle on the breath in, a push outward on the breath out.
  if (room.breath) {
    room.breath.t += dt;
    const { v } = breathOf(world);
    const mid = map.width / 2;
    for (const g of up) {
      const b = g.body;
      if (b.rope || !b.onGround) continue;
      const side = Math.sign(b.x - mid) || 1;
      b.x = Math.max(24, Math.min(map.width - 24, b.x + side * v * map.breath.pull * dt));
    }
  }
}

// ---------- The bosses ----------

// How much of a hit lands (the Matriarch's old shell is gone since her 2026-11-27 remake).
export function whaleHitMul(world, m) {
  if (m.def.mech === 'whaledream' && m.mech?.diving) return 0;
  return 1;
}

export function whaleBoss(world, m, up, dt) {
  if (m.def.mech === 'gale') return gale(world, m, up, dt);
  if (m.def.mech === 'matriarch') return matriarch(world, m, up, dt);
  if (m.def.mech === 'whaledream') return whaledream(world, m, up, dt);
  if (m.def.mech === 'whalestorm') return sulk(world, m, up, dt);
  return false;
}

const pending = (world) => world.dungeon.zones.some((z) => !z.hit && (z.kind === 'floor' || z.kind === 'thorns'));

// Captain Gale (remade 2026-11-27, her look: render/gale/). A young sky-pirate captain with no wind magic
// at all, who makes her own gales with the Gale-Maker, a ship's bellows the size of a cannon; her crew are
// kittens. Every cast named on her cast bar, its telegraph in her own windy look (render/gale/looks.js).
// Phases go by her health:
//   Fair Winds (to 66%)  Point Blank Puff (the bellows in the tank's face); Cloudball Volley (her kittens fire
//                        from the rigging: a cloudball on each of you, spread out); All Hands Haul! (a line
//                        drops on one of you: everyone grab hold and share the haul); Downdraft (the bellows
//                        aimed down: get away from her); Blow Me Down! (a gale over everyone: healer, ready).
//   Squall (to 33%)      "Sails up!": four little sails pop up on the deck round the group (room.sails).
//                        Full Gale (her signature: wind blasts out both ways from her along the deck, and the
//                        only calm is in the lee of a sail, its side away from her, or up in the rigging);
//                        the puff, the volley, the haul, the downdraft, the blow.
//   Full Gale (to 0)     faster: Wind Shift from one end of the deck, then straight away from the other (get
//                        round your sail), a volley with the downdraft on top, the blow.
// Her state for her rig: m.cast / m.castPose ('blank', 'volley', 'haul', 'down', 'blow', 'gale', 'shift'),
// m.mech.phase, m.phaseAt; the sails and the coming wind in room.sails / room.wind (drawn by
// render/gale/looks.js drawGaleSails).
const GL = { blank: 520, volley: 210, haul: 760, down: 320, blow: 205, gale: 330 };
const LEE = [14, 84];
// Plants her four sails round the group (inside her fighting ground).
function plantSails(w, m, up) {
  const room = w.dungeon.room;
  const lo = (m.fx1 ?? 60) + 70;
  const hi = (m.fx2 ?? w.map.width - 60) - 70;
  const cx = up.length ? up.reduce((s, g) => s + g.body.x, 0) / up.length : m.x;
  const mid = Math.max(lo + 380, Math.min(hi - 380, cx));
  room.sails = { t0: w.now, until: null, list: [-380, -170, 170, 380].map((d) => ({ x: Math.max(lo, Math.min(hi, mid + d)) })) };
}
// The wind across the deck (`mode` 'out' from her, or +1 / -1 the way it blows): the whole floor but the
// lee of each sail.
function blowDeck(w, m, mode, dur) {
  const room = w.dungeon.room;
  const sails = room.sails?.list ?? [];
  const gaps = sails.map((s) => {
    const d = mode === 'out' ? Math.sign(s.x - m.x) || 1 : mode;
    return d > 0 ? [s.x + LEE[0], s.x + LEE[1]] : [s.x - LEE[1], s.x - LEE[0]];
  }).sort((p, q) => p[0] - q[0]);
  room.wind = { t0: w.now, end: w.now + dur, mode, x: m.x };
  let x0 = 0;
  const lay = (a, b) => {
    if (b - a < 6) return;
    const d = mode === 'out' ? ((a + b) / 2 > m.x ? 1 : -1) : mode;
    addZone(w, { kind: 'band', x: a, w: b - a, dir: d, warn: dur, damage: GL.gale, from: m });
  };
  for (const [a, b] of gaps) {
    // (with the wind out from her, the deck splits where she stands, so each half blows its own way)
    if (mode === 'out' && m.x > x0 && m.x < a) {
      lay(x0, m.x);
      x0 = m.x;
    }
    lay(x0, a);
    x0 = Math.max(x0, b);
  }
  if (mode === 'out' && m.x > x0) {
    lay(x0, m.x);
    x0 = m.x;
  }
  lay(x0, w.map.width);
}
const GL_BLANK = { gap: 2.2, look: 'glBlank', cast: 'Point Blank Puff', dur: 3, pose: 'blank', sub: "The Gale-Maker fills up in the tank's face: everyone else, step clear!", run: (w, m, up) => buster(w, m, tankOf(up), GL.blank, 3, 84) };
const GL_VOLLEY = { gap: 2.4, look: 'glVolley', cast: 'Cloudball Volley', dur: 3, pose: 'volley', sub: 'Her kittens fire from the rigging: a cloudball on each of you, spread out!', run: (w, m, up) => spread(w, m, up, GL.volley, 3, 70) };
const GL_HAUL = { gap: 2.4, look: 'glHaul', cast: 'All Hands Haul!', dur: 3.2, pose: 'haul', sub: 'A line drops on one of you: everyone grab hold and share the haul!', run: (w, m, up) => stack(w, m, healerOf(up) ?? dpsOf(up), GL.haul, 3.2, Math.min(3, up.length), 104) };
const GL_DOWN = { gap: 2.4, look: 'glDown', cast: 'Downdraft', dur: 2.8, pose: 'down', sub: 'The bellows aimed straight down: get away from her!', run: (w, m) => out(w, m, 150, GL.down, 2.8) };
const GL_BLOW = { gap: 2.6, look: 'glBlow', cast: 'Blow Me Down!', dur: 3.2, pose: 'blow', sub: 'A gale over the whole deck: healer, ready!', run: (w, m) => raidwide(w, m, GL.blow, 3.2) };
const GL_GALE = { gap: 2.4, look: 'glGale', cast: 'Full Gale', dur: 3.6, pose: 'gale', sub: 'Wind out both ways from her: shelter on the far side of a sail, or climb the rigging!', run: (w, m) => blowDeck(w, m, 'out', 3.6) };
const shiftStep = (dir, gap, dur) => ({ gap, look: 'glShift', cast: dir > 0 ? 'Wind Shift: Westerly' : 'Wind Shift: Easterly', dur, pose: 'shift', sub: dir > 0 ? 'The wind comes from the west: shelter on the EAST side of a sail!' : 'The wind comes from the east: shelter on the WEST side of a sail!', run: (w, m) => blowDeck(w, m, dir, dur) });
const glFast = (st) => ({ ...st, gap: Math.max(1.6, st.gap - 0.6), dur: st.dur - 0.3 });
const GL_VOLLEY2 = { gap: 1.8, look: 'glVolley', cast: 'Cloudball Volley', dur: 2.8, pose: 'volley', sub: 'Cloudballs on each of you AND a downdraft round her: spread out, away from her!', run: (w, m, up) => {
  spread(w, m, up, GL.volley, 2.8, 70);
  w.dungeon.nextLook = 'glDown';
  out(w, m, 130, GL.down, 2.8);
} };
const FAIR_WINDS = [GL_BLANK, GL_VOLLEY, GL_HAUL, GL_DOWN, GL_BLOW];
const SQUALL = [GL_GALE, GL_VOLLEY, GL_BLANK, GL_DOWN, GL_GALE, GL_HAUL, GL_BLOW];
// (the finale: the wind from one end, then straight from the other; the volley with a downdraft on top)
const FULL_GALE = [shiftStep(1, 1.8, 3.2), shiftStep(-1, 0.6, 2.6), glFast(GL_BLANK), GL_VOLLEY2, shiftStep(-1, 1.8, 3.2), shiftStep(1, 0.6, 2.6), glFast(GL_HAUL), GL_BLOW];
function gale(world, m, up, dt) {
  const now = world.now;
  const room = world.dungeon.room;
  if (!m.mech) {
    room.sails = null;
    room.wind = null;
  }
  const s = (m.mech ??= { phase: 1 });
  const frac = m.hp / m.def.hp;
  const phase = frac > 0.66 ? 1 : frac > 0.33 ? 2 : 3;
  if (phase > s.phase && !m.cast) {
    s.phase = phase;
    m.phaseAt = now;
    if (phase === 2) {
      plantSails(world, m, up);
      callout(world, 'Squall!', 'Sails up on the deck: when the gale blows, shelter behind one!');
      radio(world, 'squall');
    } else {
      callout(world, 'Full Gale!', 'The wind swings round the compass: watch which end it comes from');
      radio(world, 'fullgale');
    }
  }
  // (a phase change: her own moment before the next cast)
  if (m.phaseAt != null && now - m.phaseAt < 1.8) return true;
  return runRotation(world, m, s.phase === 1 ? FAIR_WINDS : s.phase === 2 ? SQUALL : FULL_GALE, up, dt);
}

// The Barnacle Matriarch (remade 2026-11-27, her look: render/matriarch/). A grand old walrus dowager the
// whale's barnacles took for their mother; her squires are young sea turtles. Every cast named on her cast
// bar, its telegraph in her own sea look (render/matriarch/looks.js). Phases go by her health:
//   Low Tide (to 66%)    A Proper Scolding (a flipper slap on the tank); Barnacle Babies (her children shaken
//                        loose onto each of you: spread out); Cluster, Children! (her children gather on one
//                        of you: everyone huddle up to share); Undertow (the sea rushes over everyone:
//                        healer, ready); Coral Bloom (coral grows out round her, but not right beside her:
//                        get in close).
//   Rising Tide (to 33%) her signature, Find the Pearl: three clam shells on the deck, her pearl shown in one;
//                        the clams shuffle round (watch it!), and the tide floods the whole deck, rigging and
//                        all, except inside the clam with the pearl, which opens to take you in. The scolding,
//                        the babies, the cluster, the undertow, the coral.
//   Spring Tide (to 0)   faster: the shells shuffle more and quicker, the babies with a coral bloom on top.
// Her state for her rig: m.cast / m.castPose ('scold', 'babies', 'cluster', 'undertow', 'coral', 'pearl'),
// m.mech.phase, m.phaseAt; the clams in room.shells (drawn by render/matriarch/looks.js
// drawMatriarchShells).
const MA = { scold: 530, babies: 215, cluster: 780, undertow: 210, coral: 330, tide: 360 };
const CLAM = 64;
// Lays out the shell game: three clams round the group, the pearl in one, `n` swaps of `len` seconds each
// after a reveal; the tide everywhere but the pearl's clam where it ends up.
function shellGame(w, m, up, dur, n, len) {
  const room = w.dungeon.room;
  const lo = (m.fx1 ?? 60) + 90;
  const hi = (m.fx2 ?? w.map.width - 60) - 90;
  const cx = up.length ? up.reduce((s, g) => s + g.body.x, 0) / up.length : m.x;
  const mid = Math.max(lo + 220, Math.min(hi - 220, cx));
  const slots = [mid - 220, mid, mid + 220];
  const pearl = Math.floor(Math.random() * 3);
  // (where each clam sits, slot by slot: at[slot] = which clam)
  const at = [0, 1, 2];
  const swaps = [];
  let last = -1;
  for (let i = 0; i < n; i++) {
    let a = Math.floor(Math.random() * 3);
    let b = (a + 1 + Math.floor(Math.random() * 2)) % 3;
    if (a > b) [a, b] = [b, a];
    if (a * 3 + b === last) {
      a = (a + 1) % 3;
      b = (a + 1 + Math.floor(Math.random() * 2)) % 3;
      if (a > b) [a, b] = [b, a];
    }
    last = a * 3 + b;
    swaps.push({ a, b, t: 1.3 + i * len, len: len * 0.9 });
    [at[a], at[b]] = [at[b], at[a]];
  }
  const final = at.indexOf(pearl);
  room.shells = { t0: w.now, dur, slots, pearl, swaps, final, until: w.now + dur + 1.4 };
  const px = slots[final];
  // the tide: the floor everywhere but inside the pearl's clam, and everything up off the floor
  addZone(w, { kind: 'band', x: 0, w: px - CLAM, dir: 1, warn: dur, damage: MA.tide, from: m });
  addZone(w, { kind: 'band', x: px + CLAM, w: w.map.width - px - CLAM, dir: -1, warn: dur, damage: MA.tide, from: m });
  w.dungeon.nextLook = 'maTideHi';
  addZone(w, { kind: 'band', x: 0, w: w.map.width, high: true, dir: 1, warn: dur, damage: MA.tide, from: m });
}
const MA_SCOLD = { gap: 2.2, look: 'maScold', cast: 'A Proper Scolding', dur: 3, pose: 'scold', sub: 'She wags a flipper at the tank: everyone else, step clear!', run: (w, m, up) => buster(w, m, tankOf(up), MA.scold, 3, 84) };
const MA_BABIES = { gap: 2.4, look: 'maBabies', cast: 'Barnacle Babies', dur: 3, pose: 'babies', sub: 'Her children leap onto each of you: spread out!', run: (w, m, up) => spread(w, m, up, MA.babies, 3, 70) };
const MA_CLUSTER = { gap: 2.4, look: 'maCluster', cast: 'Cluster, Children!', dur: 3.2, pose: 'cluster', sub: 'Her children gather on one of you: everyone huddle up to share!', run: (w, m, up) => stack(w, m, healerOf(up) ?? dpsOf(up), MA.cluster, 3.2, Math.min(3, up.length), 104) };
const MA_UNDERTOW = { gap: 2.6, look: 'maUndertow', cast: 'Undertow', dur: 3.2, pose: 'undertow', sub: 'The sea rushes over the whole deck: healer, ready!', run: (w, m) => raidwide(w, m, MA.undertow, 3.2) };
const MA_CORAL = { gap: 2.4, look: 'maCoral', cast: 'Coral Bloom', dur: 3, pose: 'coral', sub: 'Coral grows out all round her, but not right beside her: get in close!', run: (w, m) => donut(w, m, 74, 460, MA.coral, 3) };
const MA_PEARL = { gap: 2.4, look: 'maTide', cast: 'Find the Pearl', dur: 6, pose: 'pearl', sub: 'Watch the clam with her pearl! The tide floods everything but inside it!', run: (w, m, up) => shellGame(w, m, up, 6, 4, 0.75) };
const MA_PEARL2 = { gap: 1.8, look: 'maTide', cast: 'Find the Pearl', dur: 6, pose: 'pearl', sub: 'Faster now! Keep your eye on the pearl!', run: (w, m, up) => shellGame(w, m, up, 6, 6, 0.55) };
const maFast = (st) => ({ ...st, gap: Math.max(1.6, st.gap - 0.6), dur: st.dur - 0.3, run: st.run });
const MA_BABIES2 = { gap: 1.8, look: 'maBabies', cast: 'Barnacle Babies', dur: 2.8, pose: 'babies', sub: 'Her children on each of you AND coral round her: spread out, close to her!', run: (w, m, up) => {
  spread(w, m, up, MA.babies, 2.8, 70);
  w.dungeon.nextLook = 'maCoral';
  donut(w, m, 110, 460, MA.coral, 2.8);
} };
const LOW_TIDE = [MA_SCOLD, MA_BABIES, MA_CLUSTER, MA_CORAL, MA_UNDERTOW];
const RISING_TIDE = [MA_PEARL, MA_SCOLD, MA_BABIES, MA_CORAL, MA_PEARL, MA_CLUSTER, MA_UNDERTOW];
const SPRING_TIDE = [MA_PEARL2, maFast(MA_SCOLD), MA_BABIES2, maFast(MA_CLUSTER), MA_PEARL2, MA_UNDERTOW];
function matriarch(world, m, up, dt) {
  const now = world.now;
  const room = world.dungeon.room;
  if (!m.mech) room.shells = null;
  const s = (m.mech ??= { phase: 1 });
  const frac = m.hp / m.def.hp;
  const phase = frac > 0.66 ? 1 : frac > 0.33 ? 2 : 3;
  if (phase > s.phase && !m.cast) {
    s.phase = phase;
    m.phaseAt = now;
    if (phase === 2) {
      callout(world, 'Rising Tide!', 'Her clams come out on the deck: keep your eye on her pearl');
      radio(world, 'risingtide');
    } else {
      callout(world, 'Spring Tide!', 'The tide comes faster, and so do the shells');
      radio(world, 'springtide');
    }
  }
  if (m.phaseAt != null && now - m.phaseAt < 1.8) return true;
  return runRotation(world, m, s.phase === 1 ? LOW_TIDE : s.phase === 2 ? RISING_TIDE : SPRING_TIDE, up, dt);
}

// (Her rig, render/mobs/whalerig.js, acts each: m.lullabyAt swaying and humming, m.mech.diving
// nosing down into the clouds, m.breachAt bursting up out of them, m.songAt singing the Starlight
// Song, m.stirAt a grumpy roll as she stirs.)
function whaledream(world, m, up, dt) {
  const map = world.map;
  const s = (m.mech ??= { phase: 1, lullaby: 4, dive: 12, song: 3, side: 0, diving: null });
  const frac = m.hp / m.def.hp;
  if (s.phase === 1 && frac <= 0.66) {
    s.phase = 2;
    m.stirAt = world.now;
    callout(world, 'She stirs...', 'The Deep Dive comes faster now');
  }
  if (s.phase === 2 && frac <= 0.33) {
    s.phase = 3;
    m.songAt = world.now;
    callout(world, 'The Starlight Song!', 'The wind lanes swap sides, faster and faster');
    radio(world, 'song');
  }
  // Deep Dive: she sinks into the clouds, then breaches under someone.
  if (s.diving) {
    if (world.now > s.diving.at) {
      m.x = Math.max(m.x1, Math.min(m.x2, s.diving.x));
      s.diving = null;
      m.breachAt = world.now;
      world.juice.push({ type: 'shake', mag: 6, dur: 0.5 });
    }
    return true;
  }
  s.dive -= dt;
  if (s.dive <= 0 && up.length && !pending(world)) {
    s.dive = s.phase >= 2 ? 11 : 15;
    const g = pick(up);
    s.diving = { x: g.body.x, at: world.now + 2.2 };
    addZone(world, { kind: 'circle', x: g.body.x, y: floorY(world, g.body), w: 110, warn: 2.2, damage: 300, from: m, breach: true });
    callout(world, 'Deep Dive!', `She sinks... and rises under ${g.bot ? g.name : 'you'}!`);
    return true;
  }
  s.lullaby -= dt;
  if (s.lullaby <= 0 && up.length) {
    s.lullaby = 7;
    for (const g of up) addZone(world, { kind: 'circle', x: g.body.x, y: floorY(world, g.body), w: 70, warn: 1.8, damage: 210, from: m, lullaby: true });
    m.lullabyAt = world.now;
    callout(world, 'Lullaby...', 'Step out of the song');
  }
  if (s.phase === 3) {
    s.song -= dt;
    if (s.song <= 0) {
      if (pending(world)) s.song = 0.5;
      else {
        s.song = Math.max(4, 8 - (s.songs = (s.songs ?? 0) + 1) * 0.5);
        s.side ^= 1;
        addZone(world, { kind: 'thorns', x: s.side ? map.width / 2 : 0, w: map.width / 2, warn: 1.6, damage: 270, from: m, starlight: true });
        m.songAt = world.now;
      }
    }
  }
  return false;
}

// The Sulk (his fight rebuilt 2026-11-27, his look: render/sulk/). The storm cloud of the whale's sadness, a
// sulky little spirit under his storm-cloud duvet who won't let her wake up. Every cast named on his cast
// bar, its telegraph in his own soft storm-duvet look (render/sulk/looks.js). Phases go by his health:
//   Grumpy (to 66%)        Duvet Wallop (the corner of his duvet flopped on the tank); Sulky Clouds (a sulky
//                          little raincloud over each of you: spread out); Pillow Pile! (a big pillow drops on
//                          one of you: everyone pile on to share it); Thunder Tantrum (a grumble of thunder
//                          over the whole deck: healer, ready); and his signature, Mood Swing: his mood
//                          swings back and forth, then settles, and you read it off his face and the little
//                          cloud over his head: SAD (a raincloud: the rain falls all round him but not under
//                          his duvet, so get in close) or CROSS (a thundercloud: the thunder comes down right
//                          on him, so get away).
//   Five More Minutes      he pulls his plush up over his face and refuses to get up, then starts throwing
//   (to 33%)               pillows: Pillow Fight! (pillows bounce out from him both ways along the deck, one
//                          spot after another: watch the order and step in behind them); the rest as before.
//   Sunshower (to 0)       he starts cheering up, despite himself: faster, his moods swing twice in a row
//                          (whatever comes first, the other follows), the pillows fly with a sulky cloud on
//                          each of you, and the raid-wide becomes the Sunshower (rain and a rainbow at once).
// His state for his rig: m.cast / m.castPose ('wallop', 'clouds', 'pile', 'tantrum', 'swing', 'pillow', 'sun'),
// m.sulkSwing ({ show: the mood on his face now, next: the one after, flipAt, settledAt }), m.mech.phase,
// m.phaseAt.
const SB = { wallop: 560, clouds: 225, pile: 820, tantrum: 220, mood: 340, pillow: 290, sun: 240 };
// The mood's floor: sad, a curtain of rain round him (inside 84 px is dry); cross, thunder on him (170 px).
const SOB_IN = 84;
const SOB_OUT = 520;
const HUFF_R = 170;
const moodZone = (w, m, mood, warn) => {
  w.dungeon.nextLook = mood === 'sob' ? 'sbSob' : 'sbHuff';
  if (mood === 'sob') donut(w, m, SOB_IN, SOB_OUT, SB.mood, warn);
  else out(w, m, HUFF_R, SB.mood, warn);
  w.dungeon.nextLook = null;
};
// Mood Swing: his mood flips for `swing` seconds (each flip a beat apart, slowing as it settles), then settles
// on the first of `moods`; each mood's floor lands in turn, `gap` seconds apart, the last as the cast ends.
function moodSwing(w, m, dur, swing, n) {
  const first = Math.random() < 0.5 ? 'sob' : 'huff';
  const moods = n > 1 ? [first, first === 'sob' ? 'huff' : 'sob'] : [first];
  const now = w.now;
  // (the flips: quick at first, slower as it settles, landing on the first mood)
  const flips = [];
  let tf = swing;
  let mood = first;
  for (let i = 0; tf > 0.18; i++) {
    flips.unshift({ at: now + tf, mood });
    mood = mood === 'sob' ? 'huff' : 'sob';
    tf -= Math.max(0.22, 0.46 - 0.06 * flips.length);
  }
  const land = [];
  const gap = n > 1 ? (dur - swing) * 0.45 : 0;
  for (let i = 0; i < moods.length; i++) land.push(now + dur - (moods.length - 1 - i) * gap);
  m.sulkSwing = { show: mood, next: null, flips, flipAt: now, settledAt: null, moods, land, laid: 0, settleAt: now + swing };
}
function tickSwing(w, m) {
  const sw = m.sulkSwing;
  if (!sw) return;
  const now = w.now;
  if (!m.cast || m.castPose !== 'swing' || m.hp <= 0) {
    m.sulkSwing = null;
    return;
  }
  while (sw.flips.length && now >= sw.flips[0].at) {
    sw.show = sw.flips.shift().mood;
    sw.flipAt = now;
  }
  // settled: the first mood shown big, its floor laid; the next waiting beside it; each in turn
  if (now >= sw.settleAt && sw.laid < sw.moods.length) {
    const i = sw.laid;
    const lay = i === 0 || now >= sw.land[i - 1];
    if (lay) {
      sw.show = sw.moods[i];
      sw.next = sw.moods[i + 1] ?? null;
      sw.settledAt = now;
      sw.flipAt = i === 0 ? sw.flipAt : now;
      moodZone(w, m, sw.moods[i], Math.max(0.6, sw.land[i] - now));
      sw.laid++;
    }
  }
}
// Pillow Fight!: pillows bounce out from him both ways, `n` spots each side, each landing `step` s after the
// last, the first `dur` s from now.
function pillowFight(w, m, dur, n = 6, step = 0.55) {
  w.dungeon.nextLook = 'sbPillow';
  for (const d of [-1, 1]) {
    for (let i = 0; i < n; i++) {
      const x = m.x + d * (20 + i * 84);
      if (x < 30 || x > w.map.width - 30) continue;
      addZone(w, { kind: 'circle', x, y: w.map.groundY, w: 76, warn: dur + i * step, damage: SB.pillow, from: m, noSprout: true, dir: d, bounce: i });
    }
  }
  w.dungeon.nextLook = null;
}
const SB_WALLOP = { gap: 2.2, look: 'sbWallop', cast: 'Duvet Wallop', dur: 3, pose: 'wallop', sub: "He hauls up the corner of his duvet over the tank: everyone else, step clear!", run: (w, m, up) => buster(w, m, tankOf(up), SB.wallop, 3, 84) };
const SB_CLOUDS = { gap: 2.4, look: 'sbClouds', cast: 'Sulky Clouds', dur: 3, pose: 'clouds', sub: 'A sulky little raincloud over each of you: spread out!', run: (w, m, up) => spread(w, m, up, SB.clouds, 3, 70) };
const SB_PILE = { gap: 2.4, look: 'sbPile', cast: 'Pillow Pile!', dur: 3.2, pose: 'pile', sub: 'A big pillow drops on one of you: everyone pile on to share it!', run: (w, m, up) => stack(w, m, healerOf(up) ?? dpsOf(up), SB.pile, 3.2, Math.min(3, up.length), 104) };
const SB_TANTRUM = { gap: 2.6, look: 'sbTantrum', cast: 'Thunder Tantrum', dur: 3.2, pose: 'tantrum', sub: 'A grumble of thunder over the whole deck: healer, ready!', run: (w, m) => raidwide(w, m, SB.tantrum, 3.2) };
const SB_SWING = { gap: 2.4, cast: 'Mood Swing', dur: 4.2, pose: 'swing', sub: 'Watch his face! Sad: rain all round him, get in close. Cross: thunder on him, get away!', run: (w, m) => moodSwing(w, m, 4.2, 1.8, 1) };
const SB_SWINGS = { gap: 1.8, cast: 'Mood Swings', dur: 5.2, pose: 'swing', sub: 'Two moods in a row now: read the first, then do the other!', run: (w, m) => moodSwing(w, m, 5.2, 1.3, 2) };
const SB_PILLOW = { gap: 2.4, cast: 'Pillow Fight!', dur: 3, pose: 'pillow', sub: 'Pillows bounce out from him both ways: watch where they land, and step in behind them!', run: (w, m) => pillowFight(w, m, 3) };
const SB_PILLOW2 = { gap: 1.8, cast: 'Pillow Fight!', dur: 2.8, pose: 'pillow', sub: 'Pillows AND a sulky cloud on each of you: spread out behind the pillows!', run: (w, m, up) => {
  pillowFight(w, m, 2.8, 6, 0.5);
  w.dungeon.nextLook = 'sbClouds';
  spread(w, m, up, SB.clouds, 2.8, 70);
} };
const SB_SUN = { gap: 2.4, look: 'sbSun', cast: 'Sunshower', dur: 3.2, pose: 'sun', sub: 'Rain and sunshine at once over the whole deck: healer, ready!', run: (w, m) => raidwide(w, m, SB.sun, 3.2) };
const sbFast = (st) => ({ ...st, gap: Math.max(1.6, st.gap - 0.6), dur: st.dur - 0.3, run: (w, m, up) => st.run(w, m, up) });
const GRUMPY = [SB_WALLOP, SB_CLOUDS, SB_SWING, SB_PILE, SB_TANTRUM];
const FIVE_MORE = [SB_PILLOW, SB_WALLOP, SB_SWING, SB_CLOUDS, SB_PILLOW, SB_PILE, SB_TANTRUM];
const SUNSHOWER = [SB_SWINGS, sbFast(SB_WALLOP), SB_PILLOW2, SB_SWINGS, sbFast(SB_PILE), SB_SUN];
function sulk(world, m, up, dt) {
  const now = world.now;
  const s = (m.mech ??= { phase: 1 });
  if (s.phase === 1 && !s.rot) m.sulkSwing = null;
  const frac = m.hp / m.def.hp;
  const phase = frac > 0.66 ? 1 : frac > 0.33 ? 2 : 3;
  if (phase > s.phase && !m.cast) {
    s.phase = phase;
    m.phaseAt = now;
    if (phase === 2) {
      callout(world, 'Five More Minutes!', 'He refuses to get up... and starts throwing pillows. Watch where they bounce!');
      radio(world, 'fiveminutes');
    } else {
      callout(world, 'Sunshower!', 'He is cheering up, despite himself: his moods swing twice in a row now');
      radio(world, 'sunshower');
    }
  }
  tickSwing(world, m);
  // (a phase change: his own moment before the next cast)
  if (m.phaseAt != null && now - m.phaseAt < 1.8) return true;
  const list = s.phase === 1 ? GRUMPY : s.phase === 2 ? FIVE_MORE : SUNSHOWER;
  return runRotation(world, m, list, up, dt);
}

export function whaleKilled(world, m) {
  if (m.def.mech === 'whaledream') playScene(world, 'skywhale_woken');
  if (m.def.mech === 'whalestorm') {
    // Elder Ohagi goes home to the palace (render/prologue.js).
    world.char.elders = { ...(world.char.elders ?? {}), ohagi: true };
    playScene(world, 'skywhale_woken');
  }
}
