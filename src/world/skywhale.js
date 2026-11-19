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
//   The Blowhole Deck     Captain Gale: "Broadside!" rakes half the deck, "Hard to port!" shoves
//                         everyone, the great blowhole erupts in the middle (ride it over the
//                         broadside), and Gunners board at 70% and 40%.
//   The Barnacle Fortress the Barnacle Matriarch: "Encrust!" (break her shell in time and she's
//                         stunned and open; fail and it bursts in a Tide Crash), barnacle spikes,
//                         Barnacle Knights at 60%.
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
import { runRotation, raidwide, buster, stack, spread, cleave, band, tankOf, healerOf } from './bossfight.js';

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

// How much of a hit lands: the Matriarch in her shell takes far less.
export function whaleHitMul(world, m) {
  if (m.def.mech === 'matriarch' && m.mech?.shell) return 0.35;
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

// (Her rig, render/mobs/galerig.js, acts each: the Broadside's cast (m.castPose 'broadside') the
// cutlass raised until m.fireAt, then chopped down, FIRE!; m.portAt braced against the gale;
// m.boardAt the cutlass thrust up, waving her gunners in.)
function gale(world, m, up, dt) {
  const map = world.map;
  const room = world.dungeon.room;
  const s = (m.mech ??= { broadside: 6, port: 14, side: 0, boards: [0.7, 0.4] });
  const frac = m.hp / m.def.hp;
  if (m.castPose === 'broadside' && (!m.cast || world.now >= m.cast.t0 + m.cast.dur)) {
    m.cast = null;
    m.castPose = null;
  }
  s.broadside -= dt;
  s.port -= dt;
  if (s.broadside <= 0 && up.length) {
    if (pending(world)) s.broadside = 0.5;
    else {
      s.broadside = frac < 0.4 ? 8 : 10;
      s.side = Math.random() < 0.5 ? 0 : 1;
      addZone(world, { kind: 'thorns', x: s.side ? map.width / 2 : 0, w: map.width / 2, warn: 2.2, damage: 280, from: m, broadside: true });
      m.cast = { name: 'Broadside!', t0: world.now, dur: 2.2 };
      m.castPose = 'broadside';
      m.fireAt = world.now + 2.2;
      callout(world, 'Broadside!', `The cannons rake the ${s.side ? 'east' : 'west'} deck: clear it or ride the blowhole!`);
      radio(world, 'broadside');
    }
  }
  if (s.port <= 0 && up.length) {
    s.port = 16;
    room.gust = room.gust ?? { next: Infinity, dir: 1, until: 0 };
    room.gust.dir = m.x < map.width / 2 ? 1 : -1;
    room.gust.until = world.now + 2.2;
    m.portAt = world.now;
    callout(world, 'Hard to port!', 'The deck heels over: brace!');
  }
  if (room.gust && world.now < room.gust.until) slide(world, up, room.gust.dir, 110, dt, true);
  if (s.boards.length && frac <= s.boards[0]) {
    s.boards.shift();
    adds(world, m, 'gunner', [m.x - 240, m.x + 240], null);
    m.boardAt = world.now + 0.4;
    callout(world, 'Boarding party!', 'Her gunners swing in on ropes');
  }
  return false;
}

// (Her rig, render/mobs/matriarchrig.js, acts each: m.shield (Encrust!) backed into her shell as
// barnacles crust over it, m.vulnUntil flopped out dizzy, m.slamming (Tide Crash) bursting out and
// driving her staff down, m.spikeAt a stamp of the staff, m.knightAt the staff raised to call them.)
function matriarch(world, m, up, dt) {
  const map = world.map;
  const s = (m.mech ??= { encrust: 10, spikes: 5, shell: null, knights: [0.6] });
  const frac = m.hp / m.def.hp;
  s.spikes -= dt;
  if (s.spikes <= 0 && up.length) {
    s.spikes = 7;
    for (const g of [...up].sort(() => Math.random() - 0.5).slice(0, 2)) addZone(world, { kind: 'circle', x: g.body.x, y: floorY(world, g.body), w: 60, warn: 1.4, damage: 230, from: m, barnacles: true });
    m.spikeAt = world.now + 0.35;
  }
  if (!s.shell) {
    s.encrust -= dt;
    if (s.encrust <= 0) {
      // (Made crackable 2026-11-19: a group lands only ~600 a second on the shell (it halves the
      // damage), so it needs 0.8% of her health (3.5k) in 7 s; a burst cracks it early.)
      s.shell = { until: world.now + 7, from: m.hp, need: m.def.hp * 0.008 };
      callout(world, 'Encrust!', 'Shell up: break it in time!');
      radio(world, 'encrust');
    }
  } else if (s.shell.from - m.hp >= s.shell.need) {
    s.shell = null;
    s.encrust = 16;
    m.vulnUntil = world.now + 5;
    world.juice.push({ type: 'shake', mag: 4, dur: 0.4 });
    callout(world, 'The shell cracks!', "She's stunned: hit her now!");
  } else if (world.now > s.shell.until) {
    s.shell = null;
    s.encrust = 16;
    addZone(world, { kind: 'floor', x: 0, w: map.width, warn: 1.8, damage: 270, from: m, tide: true });
    m.slamming = world.now + 1.8;
    callout(world, 'Tide Crash!', 'The shell bursts: JUMP!');
  }
  if (s.knights.length && frac <= s.knights[0]) {
    s.knights.shift();
    adds(world, m, 'barnacleknight', [m.x - 220, m.x + 220], null);
    m.knightAt = world.now + 0.35;
    callout(world, 'Barnacle Knights!', 'Her guard grows out of the walls');
  }
  m.shield = Boolean(s.shell);
  return m.slamming > world.now;
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

// The Sulk, the storm of the whale's sadness (render/mobs/stormrig.js takes up a move for each cast,
// m.castPose). Drizzle over everyone, a bad-mood bolt on the tank, a downpour ahead, a grumble of
// thunder for the whole deck. At 66% the Thunderhead: forked lightning down alternate lanes. At 33%
// the Cloudburst: rain floods the whole deck (get up high), and the group shares an umbrella.
const SULK_DRIZZLE = { gap: 2.6, look: 'drizzle', cast: 'Drizzle', dur: 2.8, pose: 'drizzle', sub: 'A little raincloud over each of you: spread out', run: (w, m, up) => spread(w, m, up, 170, 2.8) };
const SULK_BOLT = { gap: 2.4, look: 'bolt', cast: 'Bad Mood Bolt', dur: 2.6, pose: 'bolt', sub: 'Lightning on the tank: everyone else, step away', run: (w, m, up) => buster(w, m, tankOf(up), 420, 2.6, 84) };
const SULK_DOWNPOUR = { gap: 2.4, look: 'downpour', cast: 'Downpour', dur: 2.4, pose: 'downpour', sub: 'A sheet of rain in front of it: get behind it', run: (w, m) => cleave(w, m, 380, 240, 2.4) };
const SULK_GRUMBLE = { gap: 2.6, look: 'grumble', cast: 'Grumble', dur: 2.6, pose: 'grumble', sub: 'Thunder for the whole deck: healer, ready', run: (w, m) => raidwide(w, m, 160, 2.6) };
const forked = (w, m, dur) => {
  const n = 8;
  const width = w.map.width / n;
  const flip = (m.mech.flip = !m.mech.flip) ? 1 : 0;
  for (let i = flip; i < n; i += 2) addZone(w, { kind: 'thorns', x: i * width, w: width, warn: dur, damage: 250, from: m });
};
const SULK_FORKED = { gap: 2.4, look: 'forked', cast: 'Forked Lightning', dur: 2.4, pose: 'forked', sub: 'Lightning down every other lane: stand in the dry', run: (w, m) => forked(w, m, 2.4) };
const SULK_SIDEWAYS = { gap: 2.2, look: 'downpour', cast: 'Sideways Rain', dur: 2.4, pose: 'downpour', sub: 'Rain in front, then behind: dodge one, then the other', run: (w, m) => {
  const d = m.dir < 0 ? -1 : 1;
  band(w, m, m.x - 20 * d, m.x - 20 * d + 380 * d, 240, 2.4);
  band(w, m, m.x + 20 * d, m.x + 20 * d - 380 * d, 240, 3.8);
} };
const SULK_CLOUDBURST = { gap: 2.4, look: 'cloudburst', cast: 'Cloudburst', dur: 3.2, pose: 'cloudburst', sub: 'Rain floods the whole deck: jump, or get up high', run: (w, m) => addZone(w, { kind: 'floor', x: 0, w: w.map.width, warn: 3.2, damage: 280, from: m }) };
const SULK_UMBRELLA = { gap: 2.4, look: 'umbrella', cast: 'Share the Umbrella', dur: 3.2, pose: 'umbrella', sub: 'Gather under the healer\'s umbrella to share the rain', run: (w, m, up) => stack(w, m, healerOf(up), 640, 3.2, 3) };
const SULK_P1 = [SULK_DRIZZLE, SULK_BOLT, SULK_DOWNPOUR, SULK_GRUMBLE];
const SULK_P2 = [SULK_FORKED, SULK_DRIZZLE, SULK_BOLT, SULK_SIDEWAYS, SULK_GRUMBLE];
const SULK_P3 = [SULK_CLOUDBURST, SULK_FORKED, SULK_BOLT, SULK_UMBRELLA, SULK_DRIZZLE, SULK_GRUMBLE];
function sulk(world, m, up, dt) {
  const s = (m.mech ??= { phase: 1 });
  const frac = m.hp / m.def.hp;
  if (s.phase === 1 && frac <= 0.66) {
    s.phase = 2;
    callout(world, 'Thunderhead!', 'It swells up dark: lightning down every other lane');
    radio(world, 'thunderhead');
  }
  if (s.phase === 2 && frac <= 0.33) {
    s.phase = 3;
    callout(world, 'Cloudburst!', 'The rain will flood the deck: get up high, and share the umbrella');
    radio(world, 'cloudburst');
  }
  return runRotation(world, m, s.phase === 1 ? SULK_P1 : s.phase === 2 ? SULK_P2 : SULK_P3, up, dt);
}

export function whaleKilled(world, m) {
  if (m.def.mech === 'whaledream') playScene(world, 'skywhale_woken');
  if (m.def.mech === 'whalestorm') {
    // Elder Ohagi goes home to the palace (render/prologue.js).
    world.char.elders = { ...(world.char.elders ?? {}), ohagi: true };
    playScene(world, 'skywhale_woken');
  }
}
