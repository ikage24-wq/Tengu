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

import { addZone, adds, callout } from './dungeon.js';
import { navOf, surfaceBelow } from './nav.js';
import { playScene } from './story.js';
import { radio } from './hollow.js';

export const THEATRE_MECHS = new Set(['persona', 'directrice', 'playwright']);
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
      for (const g of [...up].sort(() => Math.random() - 0.5).slice(0, 2)) addZone(world, { kind: 'circle', x: g.body.x, y: floorY(world, g.body), w: 64, warn: 1.6, damage: map.cannons.damage, cannon: true });
      callout(world, 'Cannon fire!', 'Clear the marks!');
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
  return false;
}

function persona(world, m, up, dt) {
  const s = (m.mech ??= { mask: 'comedy', swap: 12, comedy: 4, tragedy: 6, both: false });
  const frac = m.hp / m.def.hp;
  if (!s.both && frac <= 0.5) {
    s.both = true;
    callout(world, 'Both masks at once!', 'Confetti AND tears: watch everything');
    radio(world, 'both');
  }
  s.swap -= dt;
  if (s.swap <= 0) {
    s.swap = 12;
    s.mask = s.mask === 'comedy' ? 'tragedy' : 'comedy';
    callout(world, s.mask === 'comedy' ? 'Comedy!' : 'Tragedy!', s.mask === 'comedy' ? "She's quick and hard to hurt: dodge and wait" : "She's slow and open: hit her hard!");
  }
  if (s.mask === 'comedy' || s.both) {
    s.comedy -= dt;
    if (s.comedy <= 0 && up.length) {
      s.comedy = s.both ? 6 : 4.5;
      for (const g of [...up].sort(() => Math.random() - 0.5).slice(0, 2)) addZone(world, { kind: 'circle', x: g.body.x, y: floorY(world, g.body), w: 54, warn: 1.2, damage: 170, from: m, confetti: true });
    }
  }
  if (s.mask === 'tragedy' || s.both) {
    s.tragedy -= dt;
    if (s.tragedy <= 0 && up.length) {
      s.tragedy = s.both ? 9 : 7;
      for (const g of up) addZone(world, { kind: 'circle', x: g.body.x, y: floorY(world, g.body), w: 80, warn: 2, damage: 220, from: m, tears: true });
      callout(world, 'A rain of tears!', 'Step out of the blue');
    }
  }
  m.speedK = s.mask === 'comedy' ? 1.4 : 0.7;
  return false;
}

function directrice(world, m, up, dt) {
  const map = world.map;
  const s = (m.mech ??= { action: 4, cut: 16, takes: [0.7, 0.4] });
  const frac = m.hp / m.def.hp;
  s.action -= dt;
  s.cut -= dt;
  if (s.action <= 0 && up.length) {
    s.action = 7;
    const g = pick(up.filter((o) => o.role !== 'tank').length ? up.filter((o) => o.role !== 'tank') : up);
    // The spotlight lands where they're heading, a beat ahead.
    addZone(world, { kind: 'circle', x: g.body.x + (g.body.vx ?? 0) * 0.6, y: floorY(world, g.body), w: 70, warn: 1.4, damage: 210, from: m, spotlight: true });
    callout(world, 'Action!', `The spotlight finds ${g.bot ? g.name : 'you'}!`);
  }
  if (s.cut <= 0 && up.length) {
    s.cut = 18;
    // "Cut!": everyone is pulled back to their marks round the director, and must find space again.
    up.forEach((g, i) => Object.assign(g.body, { x: Math.max(40, Math.min(map.width - 40, m.x + (i - (up.length - 1) / 2) * 60)), y: map.groundY, vx: 0, vy: 0, rope: null, onGround: true }));
    world.juice.push({ type: 'shake', mag: 3, dur: 0.3 });
    addZone(world, { kind: 'circle', x: m.x, y: map.groundY, w: 150, warn: 2.2, damage: 230, from: m, cut: true });
    callout(world, 'CUT! Places, everyone!', 'Pulled back to your marks: get out of her circle!');
    radio(world, 'cut');
  }
  if (s.takes.length && frac <= s.takes[0]) {
    s.takes.shift();
    adds(world, m, 'understudy', [m.x - 220, m.x + 220], null);
    callout(world, 'Take two!', 'The Understudies take the stage');
  }
  return false;
}

function playwright(world, m, up, dt) {
  const map = world.map;
  const s = (m.mech ??= { phase: 1, pages: 4, curtain: 4, twist: 3, side: 0 });
  const frac = m.hp / m.def.hp;
  const pending = world.dungeon.zones.some((z) => !z.hit && (z.kind === 'floor' || z.kind === 'thorns'));
  if (s.phase === 1 && frac <= 0.66) {
    s.phase = 2;
    callout(world, 'The curtain falls!', 'It sweeps the whole stage: jump it');
    radio(world, 'curtain');
  }
  if (s.phase === 2 && frac <= 0.33) {
    s.phase = 3;
    callout(world, 'PLOT TWIST!', 'The danger swaps sides of the stage, faster and faster');
    radio(world, 'twist');
  }
  s.pages -= dt;
  if (s.pages <= 0 && up.length) {
    s.pages = s.phase === 3 ? 9 : 7;
    for (const g of up) addZone(world, { kind: 'circle', x: g.body.x, y: floorY(world, g.body), w: 60, warn: 1.5, damage: 200, from: m, pages: true });
    callout(world, 'The script rains down!', 'Step off the pages');
  }
  if (s.phase === 2) {
    s.curtain -= dt;
    if (s.curtain <= 0) {
      if (pending) s.curtain = 1;
      else {
        s.curtain = 12;
        addZone(world, { kind: 'floor', x: 0, w: map.width, warn: 2, damage: 260, from: m, curtain: true });
        m.slamming = world.now + 2;
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
      }
    }
  }
  return m.slamming > world.now;
}

export function theatreKilled(world, m) {
  if (m.def.mech === 'playwright') playScene(world, 'theatre_freed');
}
