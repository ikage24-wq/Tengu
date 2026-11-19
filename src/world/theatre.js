// What makes each room of the Dream Theatre its own (docs/design/dream-theatre.md; the map fields are
// described in data/maps.js), and its three boss fights. world/dungeon.js calls in here; the drawing
// is in render/theatre.js.
//
//   The Grand Lobby        spotlights sweep the floor: a monster caught in one takes more damage;
//                          collect the three lost tickets.
//   Act I: The Pirate Ship the deck rocks: everyone on it slides one way, then the other; cannon fire
//                          on marked spots.
//   Act II: The Fairy Forest  the puzzle: the cue lamps flash a sequence; repeat it. A mistake and
//                          they play it again from the top.
//   Act III: The Masked Ball  Persona: Comedy (quick, confetti bombs, harder to hurt) and Tragedy
//                          (slow, a rain of tears, easier to hurt) by turns; at half health both.
//   Backstage              Madame Directrice: "Action!" spotlights chase players, "Cut!" pulls everyone
//                          back to their marks, "Take two!" sends in the Understudies.
//   The Final Curtain      the Phantom Playwright: pages rain, the curtain sweeps the stage, and the
//                          Plot Twist (the danger swaps sides of the stage, faster and faster).
//
// Chapter 9 (2026-11-19): the theatre is the Queen's dream, and its last acts are her old life in
// the human world. The Playwright stages it and isn't fought; three new bosses, built the FFXIV way
// (world/bossfight.js):
//   Act III: Overtime      the Coffee Mug Boss: memos, a stamp on the tank, coffee slopped ahead;
//                          at half health a Caffeine Rush (files to share, a double shot).
//   The Convenience Store  the Cup-Noodle Dragon: steam round him, a noodle whip, hot broth, a
//                          chopstick snap; at 66% and 33% "Three Minutes!" (the broth boils over the
//                          whole floor: up on the shelves).
//   Her Flat               Monday: emails, the red pen, the alarm clock; meeting invites closing in
//                          from the walls from 75%, the Deadline over the whole floor from 50%. At
//                          12% the Queen rolls over in her sleep, "five more minutes", and Monday
//                          crumples.

import { addZone, adds, callout } from './dungeon.js';
import { navOf, surfaceBelow } from './nav.js';
import { playScene } from './story.js';
import { radio } from './hollow.js';
import { killMob } from './world.js';
import { runRotation, raidwide, buster, stack, spread, out, band, cleave, tankOf, healerOf } from './bossfight.js';

export const THEATRE_MECHS = new Set(['persona', 'directrice', 'playwright', 'mugboss', 'noodledragon', 'monday']);
export const THEATRE_CHANNEL = { ticket: 0.6, cue: 0.4 };

const pick = (list) => list[Math.floor(Math.random() * list.length)];
const floorY = (world, body) => {
  const nav = navOf(world.map);
  return nav.surfaces[Math.max(0, surfaceBelow(nav, body.x, body.y))].y;
};

// ---------- Rooms ----------

export function theatreSetup(world, room) {
  const map = world.map;
  if (map.dungeon !== 'theatre') return;
  room.spots = (map.spotlights ?? []).map((s, i) => ({ x: s.x, home: s.x, span: s.span, period: s.period, i }));
  room.rock = map.rocking ? { t: 0 } : null;
  room.cannonIn = map.cannons ? 4 : null;
  const cues = room.objects.filter((o) => o.kind === 'cue');
  if (cues.length) {
    const seq = [...cues.map((o) => o.id), ...cues.map((o) => o.id)].sort(() => Math.random() - 0.5).slice(0, 5);
    for (let i = 1; i < seq.length; i++) if (seq[i] === seq[i - 1]) seq[i] = cues.find((o) => o.id !== seq[i - 1]).id;
    room.cues = { seq, next: 0, playFrom: world.now + 1 };
  }
}

// The cue lamp lit right now while the sequence plays (or null).
export function cueShowing(room, now) {
  const c = room.cues;
  if (!c || c.playFrom == null) return null;
  const i = Math.floor((now - c.playFrom) / 0.9);
  if (i < 0 || i >= c.seq.length) return null;
  return (now - c.playFrom) % 0.9 < 0.65 ? c.seq[i] : null;
}

// Pressing a cue lamp: the next in the sequence moves it on; a wrong one sets it back and plays it
// again. Returns whether the whole sequence is done.
export function pressCue(world, o) {
  const room = world.dungeon.room;
  const c = room.cues;
  o.progress = 0;
  o.pressedAt = world.now;
  if (c.seq[c.next] === o.id) {
    c.next++;
    if (c.next >= c.seq.length) {
      for (const x of room.objects) if (x.kind === 'cue') x.done = true;
      callout(world, 'Bravo!', 'The forest set rolls away: on to Act III');
      return true;
    }
    return false;
  }
  c.next = 0;
  c.playFrom = world.now + 0.8;
  c.wrongAt = world.now;
  callout(world, 'Wrong cue!', 'Watch the lamps again from the top');
  return false;
}
export const cueCount = (room) => ({ have: room.cues.next, need: room.cues.seq.length });
// Party members press only the lamp that comes next (and only once it has been shown).
export const nextCue = (room, o, now) => o.kind !== 'cue' || (room.cues?.seq[room.cues.next] === o.id && now > (room.cues.playFrom ?? 0) + room.cues.seq.length * 0.9);

export function tickTheatre(world, dt, group, up) {
  const run = world.dungeon;
  const room = run?.room;
  const map = world.map;
  if (map.dungeon !== 'theatre' || !room) return;
  // Nobody has started the cues for a while: the lamps play the sequence again as a reminder.
  const c = room.cues;
  if (c && c.next === 0 && !room.cleared && world.now > c.playFrom + c.seq.length * 0.9 + 12) c.playFrom = world.now + 0.5;
  for (const s of room.spots ?? []) s.x = s.home + Math.sin((world.now / s.period) * Math.PI * 2 + s.i * 2) * s.span;
  // The rocking deck: everyone on the floor slides with the ship's roll.
  if (room.rock) {
    room.rock.t += dt;
    const roll = Math.sin(room.rock.t * ((Math.PI * 2) / map.rocking.period));
    for (const g of up) {
      const b = g.body;
      if (!b.onGround || b.rope) continue;
      b.x = Math.max(24, Math.min(map.width - 24, b.x + roll * map.rocking.push * dt));
    }
    room.rock.roll = roll;
  }
  if (room.cannonIn != null && up.length) {
    room.cannonIn -= dt;
    if (room.cannonIn <= 0) {
      room.cannonIn = map.cannons.every;
      for (const g of [...up].sort(() => Math.random() - 0.5).slice(0, 2)) addZone(world, { kind: 'circle', x: g.body.x, y: floorY(world, g.body), w: 64, warn: 1.6, damage: map.cannons.damage, cannon: true, look: map.cannons.look });
      callout(world, map.cannons.call ?? 'Cannon fire!', map.cannons.tip ?? 'Clear the marks!');
    }
  }
}

// ---------- The bosses ----------

// How much of a hit lands: a monster caught in a lobby spotlight takes more; Persona in Comedy takes
// less and in Tragedy more.
export function theatreHitMul(world, m) {
  const room = world.dungeon.room;
  let k = 1;
  if (room.spots?.some((s) => Math.abs(m.x - s.x) < 40)) k *= 1.3;
  if (m.def.mech === 'persona' && m.mech) k *= m.mech.mask === 'comedy' ? 0.7 : 1.35;
  return k;
}

export function theatreBoss(world, m, up, dt) {
  if (m.def.mech === 'persona') return persona(world, m, up, dt);
  if (m.def.mech === 'directrice') return directrice(world, m, up, dt);
  if (m.def.mech === 'playwright') return playwright(world, m, up, dt);
  if (m.def.mech === 'mugboss') return mugboss(world, m, up, dt);
  if (m.def.mech === 'noodledragon') return noodledragon(world, m, up, dt);
  if (m.def.mech === 'monday') return monday(world, m, up, dt);
  return false;
}

// (Her rig, render/mobs/personarig.js, dances each of these: m.swapAt a pirouette into the other
// mask, m.bothAt a pirouette into both, m.confettiAt the Comedy fan flung up and bursting, and the
// Rain of Tears' cast (m.castPose 'tears') both masks raised until m.tearsAt, when they fall.)
function persona(world, m, up, dt) {
  const s = (m.mech ??= { mask: 'comedy', swap: 12, comedy: 4, tragedy: 6, both: false });
  const frac = m.hp / m.def.hp;
  if (m.castPose === 'tears' && (!m.cast || world.now >= m.cast.t0 + m.cast.dur)) {
    m.cast = null;
    m.castPose = null;
  }
  if (!s.both && frac <= 0.5) {
    s.both = true;
    m.bothAt = world.now;
    callout(world, 'Both masks at once!', 'Confetti AND tears: watch everything');
    radio(world, 'both');
  }
  s.swap -= dt;
  if (s.swap <= 0) {
    s.swap = 12;
    s.mask = s.mask === 'comedy' ? 'tragedy' : 'comedy';
    m.swapAt = world.now;
    callout(world, s.mask === 'comedy' ? 'Comedy!' : 'Tragedy!', s.mask === 'comedy' ? "She's quick and hard to hurt: dodge and wait" : "She's slow and open: hit her hard!");
  }
  if (s.mask === 'comedy' || s.both) {
    s.comedy -= dt;
    if (s.comedy <= 0 && up.length) {
      s.comedy = s.both ? 6 : 4.5;
      m.confettiAt = world.now + 0.35;
      for (const g of [...up].sort(() => Math.random() - 0.5).slice(0, 2)) addZone(world, { kind: 'circle', x: g.body.x, y: floorY(world, g.body), w: 54, warn: 1.2, damage: 170, from: m, confetti: true });
    }
  }
  if (s.mask === 'tragedy' || s.both) {
    s.tragedy -= dt;
    if (s.tragedy <= 0 && up.length) {
      s.tragedy = s.both ? 9 : 7;
      for (const g of up) addZone(world, { kind: 'circle', x: g.body.x, y: floorY(world, g.body), w: 80, warn: 2, damage: 220, from: m, tears: true });
      callout(world, 'A rain of tears!', 'Step out of the blue');
      m.cast = { name: 'Rain of Tears', t0: world.now, dur: 2 };
      m.castPose = 'tears';
      m.tearsAt = world.now + 2;
    }
  }
  m.speedK = s.mask === 'comedy' ? 1.4 : 0.7;
  return false;
}

// (Her rig, render/mobs/directricerig.js, acts each: m.actionAt the megaphone to her beak and a
// bellow, the "Cut!" cast (m.castPose 'cut') the baton raised until m.cutAt, a stamp as it lands,
// m.takeAt arms flung wide for the Understudies.)
function directrice(world, m, up, dt) {
  const map = world.map;
  const s = (m.mech ??= { action: 4, cut: 16, takes: [0.7, 0.4] });
  const frac = m.hp / m.def.hp;
  if (m.castPose === 'cut' && (!m.cast || world.now >= m.cast.t0 + m.cast.dur)) {
    m.cast = null;
    m.castPose = null;
  }
  s.action -= dt;
  s.cut -= dt;
  if (s.action <= 0 && up.length) {
    s.action = 7;
    const g = pick(up.filter((o) => o.role !== 'tank').length ? up.filter((o) => o.role !== 'tank') : up);
    // The spotlight lands where they're heading, a beat ahead.
    addZone(world, { kind: 'circle', x: g.body.x + (g.body.vx ?? 0) * 0.6, y: floorY(world, g.body), w: 70, warn: 1.4, damage: 210, from: m, spotlight: true });
    callout(world, 'Action!', `The spotlight finds ${g.bot ? g.name : 'you'}!`);
    m.actionAt = world.now + 0.35;
  }
  if (s.cut <= 0 && up.length) {
    s.cut = 18;
    // "Cut!": everyone is pulled back to their marks round the director, and must find space again.
    up.forEach((g, i) => Object.assign(g.body, { x: Math.max(40, Math.min(map.width - 40, m.x + (i - (up.length - 1) / 2) * 60)), y: map.groundY, vx: 0, vy: 0, rope: null, onGround: true }));
    world.juice.push({ type: 'shake', mag: 3, dur: 0.3 });
    addZone(world, { kind: 'circle', x: m.x, y: map.groundY, w: 150, warn: 2.2, damage: 230, from: m, cut: true });
    callout(world, 'CUT! Places, everyone!', 'Pulled back to your marks: get out of her circle!');
    m.cast = { name: 'Cut!', t0: world.now, dur: 2.2 };
    m.castPose = 'cut';
    m.cutAt = world.now + 2.2;
    radio(world, 'cut');
  }
  if (s.takes.length && frac <= s.takes[0]) {
    s.takes.shift();
    adds(world, m, 'understudy', [m.x - 220, m.x + 220], null);
    callout(world, 'Take two!', 'The Understudies take the stage');
    m.takeAt = world.now + 0.4;
  }
  return false;
}

// (His rig, render/mobs/playwrightrig.js, acts each: m.pagesAt a flourish written in the air and
// pages flung up, the Curtain's cast (m.castPose 'curtain') arms raised until m.curtainAt and a bow
// as it sweeps, m.twistAt the quill twirled and flung up, m.laughAt a laugh at each new act.)
function playwright(world, m, up, dt) {
  const map = world.map;
  const s = (m.mech ??= { phase: 1, pages: 4, curtain: 4, twist: 3, side: 0 });
  const frac = m.hp / m.def.hp;
  if (m.castPose === 'curtain' && (!m.cast || world.now >= m.cast.t0 + m.cast.dur)) {
    m.cast = null;
    m.castPose = null;
  }
  const pending = world.dungeon.zones.some((z) => !z.hit && (z.kind === 'floor' || z.kind === 'thorns'));
  if (s.phase === 1 && frac <= 0.66) {
    s.phase = 2;
    callout(world, 'The curtain falls!', 'It sweeps the whole stage: jump it');
    radio(world, 'curtain');
    m.laughAt = world.now + 0.3;
  }
  if (s.phase === 2 && frac <= 0.33) {
    s.phase = 3;
    callout(world, 'PLOT TWIST!', 'The danger swaps sides of the stage, faster and faster');
    radio(world, 'twist');
    m.laughAt = world.now + 0.3;
  }
  s.pages -= dt;
  if (s.pages <= 0 && up.length) {
    s.pages = s.phase === 3 ? 9 : 7;
    for (const g of up) addZone(world, { kind: 'circle', x: g.body.x, y: floorY(world, g.body), w: 60, warn: 1.5, damage: 200, from: m, pages: true });
    callout(world, 'The script rains down!', 'Step off the pages');
    m.pagesAt = world.now + 0.5;
  }
  if (s.phase === 2) {
    s.curtain -= dt;
    if (s.curtain <= 0) {
      if (pending) s.curtain = 1;
      else {
        s.curtain = 12;
        addZone(world, { kind: 'floor', x: 0, w: map.width, warn: 2, damage: 260, from: m, curtain: true });
        m.slamming = world.now + 2;
        m.cast = { name: 'The Curtain Falls', t0: world.now, dur: 2 };
        m.castPose = 'curtain';
        m.curtainAt = world.now + 2;
      }
    }
  }
  if (s.phase === 3) {
    s.twist -= dt;
    if (s.twist <= 0) {
      if (pending) s.twist = 0.5;
      else {
        s.twist = Math.max(4, 8 - (s.twists = (s.twists ?? 0) + 1) * 0.5);
        s.side ^= 1;
        addZone(world, { kind: 'thorns', x: s.side ? map.width / 2 : 0, w: map.width / 2, warn: 1.6, damage: 260, from: m, twist: true });
        m.twistAt = world.now + 0.4;
      }
    }
  }
  return m.slamming > world.now;
}

// ---------- The Queen's dream (Chapter 9) ----------
// (Each boss's rig, render/mobs/dreamrigs.js, takes up a move of its own for each cast: m.castPose.)

// A cleave ahead of the boss and then one behind it, the second landing `late` seconds after.
const frontBack = (w, m, len, damage, dur, late) => {
  const d = m.dir < 0 ? -1 : 1;
  band(w, m, m.x - 20 * d, m.x - 20 * d + len * d, damage, dur);
  band(w, m, m.x + 20 * d, m.x + 20 * d - len * d, damage, dur + late);
};
// Holding a long cast of its own (not from the rotation): winding up in its last half second and
// striking as it ends. Returns true while it lasts.
function holdCast(world, m, until) {
  const left = until - world.now;
  const total = Math.max(0.2, m.def.fight?.windup ?? 0.5);
  m.windup = left > 0 && left < total ? left : 0;
  if (left > 0) return true;
  m.cast = null;
  m.castPose = null;
  m.windup = 0;
  m.attackAt = world.now;
  return false;
}

// The Coffee Mug Boss. Her manager, who always has just one more thing: a memo over everyone, a
// stamp on the tank, a coffee break slopped across the floor ahead of him. At half health, the
// Caffeine Rush: he's quicker, hands out a stack of files to share, and pours a double shot.
const MUG_MEMO = { gap: 2.6, look: 'memo', cast: 'Just One More Thing', dur: 2.8, pose: 'memo', sub: 'A memo over each of you: spread out', run: (w, m, up) => spread(w, m, up, 160, 2.8) };
const MUG_STAMP = { gap: 2.4, look: 'stamp', cast: 'Performance Review', dur: 2.6, pose: 'stamp', sub: 'A big stamp on the tank: everyone else, step away', run: (w, m, up) => buster(w, m, tankOf(up), 380, 2.6, 84) };
const MUG_COFFEE = { gap: 2.4, look: 'coffee', cast: 'Coffee Break', dur: 2.4, pose: 'pour', sub: 'Coffee sloshes out in front of him: get behind him', run: (w, m) => cleave(w, m, 360, 220, 2.4) };
const MUG_P1 = [MUG_MEMO, MUG_STAMP, MUG_COFFEE];
const MUG_P2 = [
  { gap: 1.8, look: 'files', cast: 'Overtime', dur: 3.2, pose: 'files', sub: 'Gather on the healer to share the workload', run: (w, m, up) => stack(w, m, healerOf(up), 600, 3.2, 3) },
  { ...MUG_STAMP, gap: 1.8 },
  { gap: 1.8, look: 'coffee', cast: 'Double Shot', dur: 2.4, pose: 'pour', sub: 'Coffee in front, then behind: dodge one, then the other', run: (w, m) => frontBack(w, m, 360, 220, 2.4, 1.4) },
  { ...MUG_MEMO, gap: 1.8 },
];
function mugboss(world, m, up, dt) {
  const s = (m.mech ??= { rush: false });
  if (!s.rush && m.hp / m.def.hp <= 0.5) {
    s.rush = true;
    callout(world, 'Caffeine Rush!', 'He refilled himself: quicker, and one more thing after another');
    radio(world, 'caffeine');
    m.rushAt = world.now;
  }
  m.speedK = s.rush ? 1.35 : 1;
  return runRotation(world, m, s.rush ? MUG_P2 : MUG_P1, up, dt);
}

// The Cup-Noodle Dragon. Her 2 a.m. dinner, every night: steam bursting round him, a noodle whip
// ahead, hot broth over everyone, chopsticks snapping at the tank. At 66% and 33% he sets his
// timer, "Three Minutes!", and the broth boils over the whole floor: up on the shelves.
const ND_STEAM = { gap: 2.6, look: 'steam', cast: 'Steam Burst', dur: 2.6, pose: 'steam', sub: 'Steam bursts round him: get away', run: (w, m) => out(w, m, 120, 220, 2.6) };
const ND_WHIP = { gap: 2.4, look: 'noodle', cast: 'Noodle Whip', dur: 2.4, pose: 'whip', sub: 'A noodle lashes out in front of him: get behind him', run: (w, m) => cleave(w, m, 380, 230, 2.4) };
const ND_BROTH = { gap: 2.4, look: 'broth', cast: 'Hot Broth', dur: 2.8, pose: 'spit', sub: 'Hot broth over each of you: spread out', run: (w, m, up) => spread(w, m, up, 160, 2.8) };
const ND_SNAP = { gap: 2.4, look: 'chopsticks', cast: 'Chopstick Snap', dur: 2.6, pose: 'snap', sub: 'Chopsticks snap at the tank: everyone else, step away', run: (w, m, up) => buster(w, m, tankOf(up), 380, 2.6) };
const ND_P1 = [ND_STEAM, ND_SNAP, ND_WHIP, ND_BROTH];
const ND_P2 = [
  { gap: 2.2, look: ['steam', 'noodle'], cast: 'Steam and Noodles', dur: 2.8, pose: 'steam', sub: 'Get away from him, then out of the whip in front', run: (w, m) => { out(w, m, 110, 220, 2.8); cleave(w, m, 380, 230, 4.2); } },
  ND_SNAP,
  { gap: 2.2, look: 'noodle', cast: 'Noodle Lash', dur: 2.4, pose: 'whip', sub: 'In front, then behind: dodge one, then the other', run: (w, m) => frontBack(w, m, 380, 230, 2.4, 1.4) },
  ND_BROTH,
];
function noodledragon(world, m, up, dt) {
  const s = (m.mech ??= { boils: [0.66, 0.33], boiling: 0 });
  if (s.boiling) {
    if (holdCast(world, m, s.boiling)) return true;
    s.boiling = 0;
  }
  // (Not in the middle of another cast.)
  if (s.boils.length && m.hp / m.def.hp <= s.boils[0] && m.mech.rot?.end == null && up.length) {
    s.boils.shift();
    const dur = 4.2;
    addZone(world, { kind: 'floor', x: 0, w: world.map.width, warn: dur, damage: 260, from: m, look: 'boil' });
    m.cast = { name: 'Three Minutes!', t0: world.now, dur };
    m.castPose = 'timer';
    s.boiling = world.now + dur;
    m.slamming = s.boiling;
    callout(world, 'Three Minutes!', 'The broth will boil over the whole floor: up on the shelves!');
    radio(world, 'boil');
    return true;
  }
  return runRotation(world, m, s.boils.length === 2 ? ND_P1 : ND_P2, up, dt);
}

// Monday. The thing she dreaded most: emails over everyone, the red pen on the tank, the alarm
// clock for the whole room. From 75%, meeting invites slide in from both walls and leave one gap;
// from 50%, the Deadline comes down on the whole floor. And at 12%, the Queen rolls over in her
// sleep and says the magic words (the scene theatre_monday_end), and Monday crumples.
const invites = (w, m, dur) => {
  const map = w.map;
  const gap = 150;
  const c = Math.max(160, Math.min(map.width - 160, m.x + (Math.random() < 0.5 ? -1 : 1) * (160 + Math.random() * 220)));
  const [l, r] = [c - gap / 2, c + gap / 2];
  addZone(w, { kind: 'thorns', x: 0, w: l, warn: dur, damage: 220, from: m, side: -1 });
  addZone(w, { kind: 'thorns', x: r, w: map.width - r, warn: dur, damage: 220, from: m, side: 1 });
};
const MON_EMAIL = { gap: 2.6, look: 'email', cast: 'Email Avalanche', dur: 2.8, pose: 'email', sub: 'An email over each of you: spread out', run: (w, m, up) => spread(w, m, up, 170, 2.8) };
const MON_PEN = { gap: 2.4, look: 'redpen', cast: 'Red Pen', dur: 2.6, pose: 'pen', sub: 'A big red cross on the tank: everyone else, step away', run: (w, m, up) => buster(w, m, tankOf(up), 400, 2.6, 84) };
const MON_ALARM = { gap: 2.6, look: 'alarm', cast: 'Alarm Clock', dur: 2.6, pose: 'alarm', sub: 'It rings for everyone: healer, ready', run: (w, m) => raidwide(w, m, 150, 2.6) };
const MON_INVITE = { gap: 2.4, look: 'invite', cast: 'Meeting Invites', dur: 3, pose: 'invite', sub: 'Invites close in from both walls: find the gap', run: (w, m) => invites(w, m, 3) };
const MON_DEADLINE = { gap: 2.6, look: 'deadline', cast: 'Deadline', dur: 3, pose: 'deadline', sub: 'The Deadline hits the whole floor: jump, or get up high', run: (w, m) => addZone(w, { kind: 'floor', x: 0, w: w.map.width, warn: 3, damage: 260, from: m }) };
const MON_P1 = [MON_EMAIL, MON_PEN, MON_ALARM];
const MON_P2 = [MON_INVITE, MON_EMAIL, MON_PEN, MON_ALARM];
const MON_P3 = [MON_DEADLINE, MON_INVITE, MON_PEN, MON_EMAIL, MON_ALARM];
function monday(world, m, up, dt) {
  const run = world.dungeon;
  const s = (m.mech ??= { phase: 1, ending: false });
  const frac = m.hp / m.def.hp;
  if (s.ending) {
    // After the scene: he crumples, and the dream's week is over.
    if (world.scene) return true;
    m.minHp = 0;
    run.zones = [];
    m.hp = 0;
    killMob(world, m, true);
    return true;
  }
  // (No blow takes him below 12% until the Queen has said it.)
  m.minHp = Math.ceil(m.def.hp * 0.12);
  if (m.hp <= m.minHp) {
    s.ending = true;
    run.zones = [];
    m.cast = null;
    m.castPose = null;
    m.windup = 0;
    if (s.rot) s.rot.end = null;
    m.crumpleAt = world.now;
    playScene(world, 'theatre_monday_end');
    return true;
  }
  if (s.phase === 1 && frac <= 0.75) {
    s.phase = 2;
    callout(world, 'Meeting Invites!', 'When they slide in from the walls, find the gap');
    radio(world, 'invites');
  }
  if (s.phase === 2 && frac <= 0.5) {
    s.phase = 3;
    callout(world, 'DEADLINE!', 'When the clock runs out: jump, or get up on the furniture');
    radio(world, 'deadline');
  }
  return runRotation(world, m, s.phase === 1 ? MON_P1 : s.phase === 2 ? MON_P2 : MON_P3, up, dt);
}

export function theatreKilled(world, m) {
  if (m.def.mech === 'playwright') playScene(world, 'theatre_freed');
  if (m.def.mech === 'monday') {
    // Elder Zunda goes home to the palace (render/prologue.js): the Playwright's only fan.
    world.char.elders = { ...(world.char.elders ?? {}), zunda: true };
    playScene(world, 'theatre_freed');
  }
}
