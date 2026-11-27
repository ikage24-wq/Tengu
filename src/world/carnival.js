// What makes each room of the Clockwork Carnival its own (docs/design/clockwork-carnival.md; the map
// fields are described in data/maps.js), and its three boss fights. world/dungeon.js calls in here;
// the drawing is in render/carnival.js.
//
//   The Midway         carousel horses ride back and forth at different heights (drifting
//                      ledges); wind the three music boxes.
//   The Funhouse       springboards throw you between floors (map springs); pop the five prize
//                      balloons up high.
//   The Coaster Yard   the coaster runs the ground track on a timer, one way then the other: the
//                      rail lights up first; get up on a platform (or jump it).
//   The Big Top        Leonie, the Lioness Acrobat (remade 2026-11-27, her new fight below): her act
//                      in three parts, the Warm-Up, the Trapeze and the Grand Finale.
//   The Toy Workshop   conveyor belts carry everyone along; Madame Marionette (remade 2026-11-27, her
//                      new fight below): the Rehearsal, the Puppet Show and Dance for Me!
//   The Ferris Wheel   Queen Gearheart (remade 2026-11-27, her new fight below): she has to perform
//                      while anyone is watching, and Elder Kuri never stopped. Wind-Up, the Music Box
//                      and the Last Waltz, her Brass Moles winding her up. Wound down at the end, not
//                      destroyed.

import { addZone, adds, callout, hurtMember } from './dungeon.js';
import { runRotation, raidwide, buster, stack, spread, donut, band, out, tankOf, healerOf, dpsOf } from './bossfight.js';
import { killMob } from './world.js';
import { navOf, surfaceBelow } from './nav.js';
import { playScene } from './story.js';
import { radio } from './hollow.js';

export const CARNIVAL_MECHS = new Set(['leonie', 'marionetta', 'gearheart']);
export const CARNIVAL_CHANNEL = { windbox: 1.2, prize: 0.4 };

const floorY = (world, body) => {
  const nav = navOf(world.map);
  return nav.surfaces[Math.max(0, surfaceBelow(nav, body.x, body.y))].y;
};
const onFloor = (world, body) => Math.abs(body.y - world.map.groundY) < 4;

// ---------- Rooms ----------

export function carnivalSetup(world, room) {
  const map = world.map;
  if (map.dungeon !== 'carnival') return;
  room.coaster = map.coaster ? { t: map.coaster.every * 0.6, state: 'waiting', dir: 1, x: 0, hit: new Set() } : null;
  room.coasterCfg = null;
}

// A rolling hazard along the floor (the coaster car): moves, and knocks back whoever is on the floor
// where it passes, once each.
function roll(world, h, dt, up) {
  h.x += h.dir * h.speed * dt;
  for (const g of up) {
    const b = g.body;
    if (h.hit.has(g.id) || !onFloor(world, b) || Math.abs(b.x - h.x) > h.w / 2 + 6) continue;
    h.hit.add(g.id);
    hurtMember(world, g, h.damage, h.x - h.dir * 40, { knock: true });
  }
  return h.dir > 0 ? h.x > world.map.width + 60 : h.x < -60;
}

export function tickCarnival(world, dt, group, up) {
  const run = world.dungeon;
  const room = run?.room;
  const map = world.map;
  if (map.dungeon !== 'carnival' || !room) return;
  // The coaster: waiting, then the rail lights up, then the car roars through (room.coasterCfg, a
  // timing of its own for a room that wants one; none does since Queen Gearheart's 2026-11-27 remake).
  const c = room.coaster;
  const cfg = room.coasterCfg ?? map.coaster;
  if (c && cfg) {
    c.t -= dt;
    if (c.state === 'waiting' && c.t <= 0) {
      c.state = 'warning';
      c.t = 2;
      callout(world, 'The coaster is coming!', c.dir > 0 ? 'From the left: get up on a platform!' : 'From the right: get up on a platform!');
    } else if (c.state === 'warning' && c.t <= 0) {
      c.state = 'running';
      Object.assign(c, { x: c.dir > 0 ? -60 : map.width + 60, speed: cfg.speed, w: 90, damage: cfg.damage, hit: new Set() });
    } else if (c.state === 'running' && roll(world, c, dt, up)) {
      c.state = 'waiting';
      c.t = cfg.every;
      c.dir = -c.dir;
    }
  }
  // Conveyor belts carry whoever stands on them.
  for (const cv of map.conveyors ?? []) {
    for (const g of up) {
      const b = g.body;
      if (!b.onGround || Math.abs(b.y - cv.y) > 3 || b.x < cv.x1 || b.x > cv.x2) continue;
      b.x = Math.max(cv.x1, Math.min(cv.x2, b.x + cv.dir * 55 * dt));
    }
  }
}

// ---------- The bosses ----------

// (no carnival boss is out of reach now; kept for world/dungeon.js)
export function carnivalHitMul(world, m) {
  return 1;
}

export function carnivalBoss(world, m, up, dt) {
  if (m.def.mech === 'leonie') return leonie(world, m, up, dt);
  if (m.def.mech === 'marionetta') return marionetta(world, m, up, dt);
  if (m.def.mech === 'gearheart') return gearheart(world, m, up, dt);
  return false;
}

// Leonie, the Lioness Acrobat (remade 2026-11-27, her look: render/leonie/). Her act in the ring, fought
// the way a circus star performs it: every cast a number in the show, named on her cast bar, its
// telegraph drawn in her own big-top look (render/leonie/looks.js). Phases go by her health:
//   The Warm-Up (to 66%)      Juggling Pins (pins juggled over each of you: spread out); Flying Leap
//                             (a pounce on the tank: everyone else clear); Human Pyramid! (a spotlight
//                             on one of you: everyone in to share it); Cartwheel Run (she cartwheels
//                             right across the ring to the far side: get behind her, or up high).
//   The Trapeze (to 33%)      she whistles and a trapeze comes down: The Big Swing (swung out wide
//                             either side of her: get in close under her); Spotlights (a beam finds
//                             each of you: step out of your light); the leap; the pyramid.
//   The Grand Finale (to 0)   a great roar: Human Cannonball (fired across the ring, landing on three
//                             marks one after another); Standing Ovation (the crowd's roar hurts
//                             everyone: healer, ready); the cartwheel, the spotlights, the leap.
// Her state for her rig: m.cast / m.castPose ('juggle', 'leap', 'pyramid', 'cartwheel', 'swing',
// 'spot', 'cannon', 'ovation'), m.mech.phase, m.phaseAt (her moment at a phase change), m.dash (her
// trip across the ring: { kind: 'cart' | 'cannon', x0, x1, t0, dur }).
const LN = { pins: 190, leap: 460, pyramid: 640, cart: 260, swing: 260, spot: 230, cannon: 250, ovation: 200 };
// (the side of the ring with the most of the party on it, from her)
const busySide = (m, up) => (up.filter((g) => g.body.x > m.x).length >= up.filter((g) => g.body.x < m.x).length ? 1 : -1);
const dashTo = (w, m, kind, x1, at, dur) => {
  m.dash = { kind, x0: m.x, x1: Math.max(m.fx1 ?? 60, Math.min(m.fx2 ?? w.map.width - 60, x1)), t0: at, dur };
};
const PINS = { gap: 2.4, look: 'lnPins', cast: 'Juggling Pins', dur: 3, pose: 'juggle', sub: 'Pins over each of you: spread out!', run: (w, m, up) => spread(w, m, up, LN.pins, 3, 72) };
const LEAP = { gap: 2.2, look: 'lnLeap', cast: 'Flying Leap', dur: 2.8, pose: 'leap', sub: 'She is sizing up the tank: everyone else, step clear!', run: (w, m, up) => buster(w, m, tankOf(up), LN.leap, 2.8, 84) };
const PYRAMID = { gap: 2.4, look: 'lnPyramid', cast: 'Human Pyramid!', dur: 3.2, pose: 'pyramid', sub: 'Everyone into the spotlight together!', run: (w, m, up) => stack(w, m, healerOf(up) ?? dpsOf(up), LN.pyramid, 3.2, Math.min(3, up.length), 104) };
const CARTWHEEL = {
  gap: 2.4, look: 'lnCartwheel', cast: 'Cartwheel Run', dur: 2.8, pose: 'cartwheel', sub: 'She cartwheels across the ring: get behind her, or up high!',
  run: (w, m, up) => {
    const dir = busySide(m, up);
    const x1 = dir > 0 ? w.map.width - 70 : 70;
    band(w, m, m.x, x1, LN.cart, 2.8);
    m.dir = dir;
    dashTo(w, m, 'cart', x1 - dir * 30, w.now + 2.8, 0.9);
  },
};
const SWING = { gap: 2.6, look: 'lnSwing', cast: 'The Big Swing', dur: 3.4, pose: 'swing', sub: 'She swings out wide either side: get in close, right under her!', run: (w, m) => donut(w, m, 74, 360, LN.swing, 3.4) };
const SPOTS = {
  gap: 2.4, look: 'lnSpot', cast: 'Spotlights', dur: 2.6, pose: 'spot', sub: 'A spotlight finds each of you: step out of your light!',
  run: (w, m, up) => {
    for (const g of up) addZone(w, { kind: 'circle', x: g.body.x, y: w.map.groundY, w: 74, warn: 2.6, damage: LN.spot, from: m, noSprout: true });
  },
};
const CANNON = {
  gap: 2.6, look: 'lnCannon', cast: 'Human Cannonball', dur: 3, pose: 'cannon', sub: 'She is fired across the ring: off the three marks, one after another!',
  run: (w, m, up) => {
    const dir = busySide(m, up);
    const far = dir > 0 ? w.map.width - 120 : 120;
    for (let k = 0; k < 3; k++) {
      const x = m.x + ((far - m.x) * (k + 1)) / 3;
      addZone(w, { kind: 'circle', x, y: w.map.groundY, w: 110, warn: 3 + k * 0.45, damage: LN.cannon, from: m, noSprout: true, seq: k + 1 });
    }
    m.dir = dir;
    dashTo(w, m, 'cannon', far, w.now + 3, 0.9);
  },
};
const OVATION = { gap: 2.6, look: 'lnOvation', cast: 'Standing Ovation', dur: 3.4, pose: 'ovation', sub: "The crowd's roar hits everyone: healer, ready!", run: (w, m) => raidwide(w, m, LN.ovation, 3.4) };
const WARMUP = [PINS, LEAP, PYRAMID, CARTWHEEL];
const TRAPEZE = [SWING, SPOTS, LEAP, PYRAMID];
const FINALE = [CANNON, OVATION, CARTWHEEL, SPOTS, LEAP];

function leonie(world, m, up, dt) {
  const now = world.now;
  const s = (m.mech ??= { phase: 1 });
  const frac = m.hp / m.def.hp;
  // Her trip across the ring (a cartwheel run, a cannonball): she goes as it lands.
  const D = m.dash;
  if (D && now >= D.t0) {
    const u = Math.min(1, (now - D.t0) / D.dur);
    const e = u * u * (3 - 2 * u);
    m.x = D.x0 + (D.x1 - D.x0) * e;
    m.state = 'idle';
    if (u >= 1) {
      m.dash = null;
      if (D.kind === 'cannon') world.juice.push({ type: 'shake', mag: 4, dur: 0.3 });
    }
    return true;
  }
  const phase = frac > 0.66 ? 1 : frac > 0.33 ? 2 : 3;
  if (phase > s.phase && !m.cast && !m.dash) {
    s.phase = phase;
    m.phaseAt = now;
    if (phase === 2) callout(world, 'The Trapeze!', 'She whistles, and a trapeze comes down from the dark');
    else {
      callout(world, 'The Grand Finale!', 'Leonie roars to the crowd: here comes the big finish!');
      radio(world, 'roar');
    }
  }
  // (a phase change: her own moment before the next cast)
  if (m.phaseAt != null && now - m.phaseAt < 1.6) return true;
  return runRotation(world, m, s.phase === 1 ? WARMUP : s.phase === 2 ? TRAPEZE : FINALE, up, dt);
}

// Madame Marionette (remade 2026-11-27, her look: render/marionetta/). The puppeteer's show in her own
// workshop, every cast named on her cast bar, its telegraph drawn in her own look (gold thread, ribbon,
// her scissors: render/marionetta/looks.js). Phases go by her health:
//   The Rehearsal (to 66%)    Strings Attached (a little cross lowered over each of you: spread out);
//                             Crossbar Rap (both crosses brought down on the tank); Snip Snip! (her
//                             gold scissors open all round her: get out); Tie a Bow (a ribbon loop
//                             round one of you: everyone in to share it).
//   The Puppet Show (to 33%)  she cuts her harlequins loose onto the belts (Cut Loose!, again whenever
//                             they're down): bring them all down and their strings snap back on her,
//                             open to a hit for a while; Jump Rope! (her strings swung low across the
//                             whole floor, twice: jump them, or stand up high); the strings, the rap, the bow.
//   Dance for Me! (to 0)      Tug of War (the floor on one side of her, then the other: move across as
//                             the first lands); Curtain Call (the curtain comes down on everyone: healer,
//                             ready); the rope three times over, the strings, the rap, the scissors.
// Her state for her rig: m.cast / m.castPose ('strings', 'rap', 'snip', 'bow', 'cut', 'rope', 'tug',
// 'curtain'), m.mech.phase, m.phaseAt (her moment at a phase change).
const MM = { strings: 200, rap: 480, snip: 300, bow: 660, rope: 240, tug: 280, curtain: 210 };
const MM_PUPPETS = 2;
const cutLoose = (w, m, at) => {
  m.mech.cutAt = at;
};
const STRINGS = { gap: 2.4, look: 'mmStrings', cast: 'Strings Attached', dur: 3, pose: 'strings', sub: 'A little cross comes down over each of you: spread out!', run: (w, m, up) => spread(w, m, up, MM.strings, 3, 72) };
const RAP = { gap: 2.2, look: 'mmRap', cast: 'Crossbar Rap', dur: 2.8, pose: 'rap', sub: 'Both crosses up over the tank: everyone else, step clear!', run: (w, m, up) => buster(w, m, tankOf(up), MM.rap, 2.8, 84) };
const SNIP = { gap: 2.4, look: 'mmSnip', cast: 'Snip Snip!', dur: 2.6, pose: 'snip', sub: 'Her scissors open all round her: get out!', run: (w, m) => out(w, m, 150, MM.snip, 2.6) };
const BOW = { gap: 2.4, look: 'mmBow', cast: 'Tie a Bow', dur: 3.2, pose: 'bow', sub: 'A ribbon loops round one of you: everyone in to share it!', run: (w, m, up) => stack(w, m, healerOf(up) ?? dpsOf(up), MM.bow, 3.2, Math.min(3, up.length), 104) };
const CUT = { gap: 2.2, cast: 'Cut Loose!', dur: 2.2, pose: 'cut', sub: 'Her harlequins drop onto the belts: bring them all down!', run: (w, m) => cutLoose(w, m, w.now + 2.2) };
const rope = (n) => ({
  gap: 2.4, look: 'mmRope', cast: n > 2 ? 'Double Dutch!' : 'Jump Rope!', dur: 3, pose: 'rope', sub: n > 2 ? 'Three swings of her strings across the floor: jump each one!' : 'Her strings swing low across the floor, twice: jump them!',
  run: (w, m) => {
    for (let k = 0; k < n; k++) addZone(w, { kind: 'floor', x: 0, w: w.map.width, warn: 3 + k * 0.95, damage: MM.rope, from: m, seq: k + 1 });
  },
});
const TUG = {
  gap: 2.4, look: 'mmTug', cast: 'Tug of War', dur: 3.2, pose: 'tug', sub: 'She pulls one side of the floor, then heaves the other: cross over as the first lands!',
  run: (w, m, up) => {
    const dir = busySide(m, up);
    const wall = (d) => (d > 0 ? w.map.width : 0);
    addZone(w, { kind: 'band', x: Math.min(m.x, wall(dir)), w: Math.abs(wall(dir) - m.x), dir, warn: 3.2, damage: MM.tug, from: m, seq: 1 });
    addZone(w, { kind: 'band', x: Math.min(m.x, wall(-dir)), w: Math.abs(wall(-dir) - m.x), dir: -dir, warn: 4.5, damage: MM.tug, from: m, seq: 2 });
  },
};
const CURTAIN = { gap: 2.6, look: 'mmCurtain', cast: 'Curtain Call', dur: 3.4, pose: 'curtain', sub: 'The curtain comes down on everyone: healer, ready!', run: (w, m) => raidwide(w, m, MM.curtain, 3.4) };
const REHEARSAL = [STRINGS, RAP, SNIP, BOW];
const PUPPET_SHOW = [rope(2), STRINGS, RAP, CUT, BOW, SNIP];
const DANCE = [TUG, CURTAIN, rope(3), STRINGS, RAP, TUG, SNIP];

function marionetta(world, m, up, dt) {
  const now = world.now;
  const s = (m.mech ??= { phase: 1, puppets: [], cutAt: null, snapped: true });
  const frac = m.hp / m.def.hp;
  // Her harlequins let down onto the belts (a Cut Loose!, or her phase change): up to two at a time.
  if (s.cutAt != null && now >= s.cutAt) {
    s.cutAt = null;
    s.puppets = s.puppets.filter((o) => o.hp > 0);
    const need = MM_PUPPETS - s.puppets.length;
    if (need > 0) {
      const before = new Set(world.mobs);
      const xs = [m.x - 220, m.x + 220].slice(0, need);
      adds(world, m, 'marionette', xs, null);
      for (const o of world.mobs) if (!before.has(o)) s.puppets.push(o);
      s.snapped = false;
      radio(world, 'puppets');
    }
  }
  // All her puppets down: their strings snap back on her, and she reels.
  if (!s.snapped && s.puppets.length && s.puppets.every((o) => o.hp <= 0)) {
    s.snapped = true;
    s.puppets = [];
    m.vulnUntil = now + 5;
    m.snapAt = now;
    callout(world, 'Her strings snapped back!', "Madame's reeling: hit her now!");
    world.juice.push({ type: 'shake', mag: 3, dur: 0.3 });
  }
  const phase = frac > 0.66 ? 1 : frac > 0.33 ? 2 : 3;
  if (phase > s.phase && !m.cast) {
    s.phase = phase;
    m.phaseAt = now;
    if (phase === 2) {
      callout(world, 'The Puppet Show!', 'She cuts her harlequins loose onto the belts!');
      cutLoose(world, m, now + 1.6);
    } else {
      callout(world, 'Dance for Me!', 'Madame takes up every string in the room!');
      radio(world, 'dance');
    }
  }
  // (a phase change: her own moment before the next cast)
  if (m.phaseAt != null && now - m.phaseAt < 1.8) return true;
  return runRotation(world, m, s.phase === 1 ? REHEARSAL : s.phase === 2 ? PUPPET_SHOW : DANCE, up, dt);
}

// Queen Gearheart (remade 2026-11-27, her look: render/gearheart/, her Brass Moles: render/gearmole/).
// The carnival's last show, and the wind-up thread: she has to keep performing, and her moles keep
// winding her. Every cast named on her cast bar, its telegraph in her own look (brass cogs, a clock
// face, a music box: render/gearheart/looks.js). Phases go by her health:
//   Wind-Up (to 66%)          Cog Toss (a cog spinning down onto each of you: spread out); Royal Tap
//                             (her sceptre on the tank); Wind Me Up! (three Brass Moles pop up out of
//                             the plaza's holes to wind her: bop them all before they duck and she runs
//                             down, open to a hit; miss one and she's overwound, everything harder for a
//                             while); Twelve O'Clock (a great clock face round her: out before noon).
//   The Music Box (to 33%)    Music Box Melody (the floor played like a music box's comb, a strip at a
//                             time from one side: step in behind the tune); Duet (a heart round one of
//                             you: everyone in to share it); the cogs, the tap, the moles, the clock.
//   The Last Waltz (to 0)     she fights winding down: Springs Loose! (every spring in her lets go: the
//                             whole room, healer ready); the melody faster and longer; the rest.
// Wound down at the end, not destroyed (carnivalKilled: the carnival_freed scene).
// Her state for her rig: m.cast / m.castPose ('toss', 'tap', 'wind', 'chime', 'melody', 'duet',
// 'spring'), m.mech.phase, m.phaseAt, m.overwoundUntil, m.runDownAt (with m.vulnUntil).
const GH = { cogs: 210, tap: 520, chime: 320, duet: 700, melody: 260, spring: 230, boink: 120 };
const MOLE_LIFE = 5;
const ghDmg = (w, m, d) => Math.round(d * ((m.overwoundUntil ?? 0) > w.now ? 1.3 : 1));
const COGS = { gap: 2.4, look: 'ghCogs', cast: 'Cog Toss', dur: 3, pose: 'toss', sub: 'A cog spins down onto each of you: spread out!', run: (w, m, up) => spread(w, m, up, ghDmg(w, m, GH.cogs), 3, 72) };
const TAP = { gap: 2.2, look: 'ghTap', cast: 'Royal Tap', dur: 2.8, pose: 'tap', sub: 'Her sceptre rises over the tank: everyone else, step clear!', run: (w, m, up) => buster(w, m, tankOf(up), ghDmg(w, m, GH.tap), 2.8, 84) };
const NOON = { gap: 2.4, look: 'ghNoon', cast: "Twelve O'Clock", dur: 3, pose: 'chime', sub: 'A great clock face round her: get out before noon!', run: (w, m) => out(w, m, 160, ghDmg(w, m, GH.chime), 3) };
const DUET = { gap: 2.4, look: 'ghDuet', cast: 'Duet', dur: 3.2, pose: 'duet', sub: 'A heart round one of you: everyone in to share the dance!', run: (w, m, up) => stack(w, m, healerOf(up) ?? dpsOf(up), ghDmg(w, m, GH.duet), 3.2, Math.min(3, up.length), 104) };
const SPRINGS = { gap: 2.6, look: 'ghSpring', cast: 'Springs Loose!', dur: 3.2, pose: 'spring', sub: 'Every spring in her lets go: healer, ready!', run: (w, m) => raidwide(w, m, ghDmg(w, m, GH.spring), 3.2) };
const WIND = {
  gap: 2.2, cast: 'Wind Me Up!', dur: 2.4, pose: 'wind', sub: 'Brass Moles pop up to wind her: bop them all before they duck!',
  run: (w, m, up) => {
    const s = m.mech;
    if (s.wave) return;
    // (three holes side by side, nearest the group, so they can get round them all in time)
    const all = w.map.holes ?? [];
    const cx = up.reduce((a, g) => a + g.body.x, 0) / Math.max(1, up.length);
    let best = 0;
    for (let i = 0; i + 2 < all.length; i++) if (Math.abs(all[i + 1] - cx) < Math.abs(all[best + 1] - cx)) best = i;
    const before = new Set(w.mobs);
    adds(w, m, 'gearmole', all.slice(best, best + 3), null);
    const moles = w.mobs.filter((o) => !before.has(o));
    for (const o of moles) Object.assign(o, { popAt: w.now, popLife: MOLE_LIFE, atkT: 99, frozenUntil: w.now + MOLE_LIFE + 1 });
    s.wave = { moles, at: w.now };
    radio(w, 'moles');
  },
};
const melody = (n, gap) => ({
  gap: 2.4, look: 'ghMelody', cast: n > 5 ? 'Music Box Finale' : 'Music Box Melody', dur: 3, pose: 'melody', sub: 'The floor plays like a music box, a strip at a time: step in behind the tune!',
  run: (w, m, up) => {
    const dir = busySide(m, up) > 0 ? -1 : 1;
    const W = w.map.width / n;
    for (let k = 0; k < n; k++) {
      const i = dir > 0 ? k : n - 1 - k;
      addZone(w, { kind: 'band', x: i * W, w: W, dir, warn: 3 + k * gap, damage: ghDmg(w, m, GH.melody), from: m, seq: k + 1 });
    }
  },
});
const WIND_UP = [COGS, TAP, WIND, NOON];
const MUSIC_BOX = [melody(5, 0.5), COGS, DUET, WIND, TAP, NOON];
const LAST_WALTZ = [melody(7, 0.4), SPRINGS, COGS, WIND, TAP, DUET, NOON];

function gearheart(world, m, up, dt) {
  const now = world.now;
  const map = world.map;
  const s = (m.mech ??= { phase: 1, wave: null });
  const frac = m.hp / m.def.hp;
  // Her Brass Moles: all bopped in time and she runs down; any left and she's overwound.
  const wv = s.wave;
  if (wv) {
    for (const o of wv.moles) o.atkT = 99;
    if (wv.moles.every((o) => o.hp <= 0)) {
      s.wave = null;
      m.vulnUntil = now + 6;
      m.runDownAt = now;
      callout(world, 'She ran down!', 'Her key barely turns: hit her now!');
    } else if (now - wv.at >= MOLE_LIFE) {
      // the ones still up give a last BOINK as they duck, and she's overwound
      for (const o of wv.moles) {
        if (o.hp <= 0) continue;
        addZone(world, { kind: 'circle', x: o.x, y: map.groundY, w: 56, warn: 0.01, damage: GH.boink, from: m, boink: true });
        killMob(world, o);
      }
      s.wave = null;
      m.overwoundUntil = now + 12;
      callout(world, 'Overwound!', 'Her key is whirring: everything she does hits harder for a while');
    }
  }
  const phase = frac > 0.66 ? 1 : frac > 0.33 ? 2 : 3;
  if (phase > s.phase && !m.cast) {
    s.phase = phase;
    m.phaseAt = now;
    if (phase === 2) {
      callout(world, 'The Music Box!', 'She turns the plaza into a music box');
      radio(world, 'musicbox');
    } else {
      callout(world, 'The Last Waltz!', 'She is winding down... and fighting it with everything she has');
      radio(world, 'finale');
    }
  }
  if (m.phaseAt != null && now - m.phaseAt < 1.8) return true;
  // (run down: she can't cast while her key barely turns)
  if ((m.vulnUntil ?? 0) > now && (m.runDownAt ?? -9) > now - 6 && !m.cast) return true;
  return runRotation(world, m, s.phase === 1 ? WIND_UP : s.phase === 2 ? MUSIC_BOX : LAST_WALTZ, up, dt);
}

export function carnivalKilled(world, m) {
  if (m.def.mech !== 'gearheart') return;
  // The games stop; Elder Kuri goes home to the palace (render/prologue.js).
  const room = world.dungeon.room;
  room.coaster = null;
  room.coasterCfg = null;
  for (const o of world.mobs) if (o.def.id === 'gearmole' && o.hp > 0) killMob(world, o);
  world.char.elders = { ...(world.char.elders ?? {}), kuri: true };
  world.map.elders = world.char.elders;
  playScene(world, 'carnival_freed');
}
