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
// the human world. The Playwright stages it and isn't fought; three bosses, built the FFXIV way
// (world/bossfight.js), all three remade with brand-new fights on 2026-11-27 (each described above
// its own function below):
//   Act III: Overtime      the Night Manager: Nine to Five, Overtime, One More Thing (Circle Back:
//                          in, then out; Clock Watching: TICK, then TOCK).
//   The Convenience Store  the Cup-Noodle Dragon: Just Add Water, Three Minutes, Extra Spicy
//                          (SLUUURP pulls you in, then a burp; Chopstick Drop: stand where they fell).
//   Her Flat               Monday: Good Morning, Rush Hour, Always Monday (the Calendar: stand on the
//                          weekend). At 12% the Queen sleepwalks in, "five more minutes", and Monday
//                          yawns and falls asleep.

import { addZone, callout } from './dungeon.js';
import { navOf, surfaceBelow } from './nav.js';
import { playScene } from './story.js';
import { radio } from './hollow.js';
import { killMob } from './world.js';
import { runRotation, raidwide, buster, stack, cleave, tankOf, healerOf } from './bossfight.js';

export const THEATRE_MECHS = new Set(['mugboss', 'noodledragon', 'monday']);
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

// How much of a hit lands: a monster caught in a lobby spotlight takes more.
export function theatreHitMul(world, m) {
  const room = world.dungeon.room;
  let k = 1;
  if (room.spots?.some((s) => Math.abs(m.x - s.x) < 40)) k *= 1.3;
  return k;
}

export function theatreBoss(world, m, up, dt) {
  if (m.def.mech === 'mugboss') return mugboss(world, m, up, dt);
  if (m.def.mech === 'noodledragon') return noodledragon(world, m, up, dt);
  if (m.def.mech === 'monday') return monday(world, m, up, dt);
  return false;
}

// ---------- The Queen's dream (Chapter 9) ----------
// (Each boss's rig takes up a move of its own for each cast: m.castPose.)

// The Night Manager (remade 2026-11-27, render/manager/): her manager, who never goes home and always has just
// one more thing. One rotation per phase (world/bossfight.js), each cast on his cast bar, its telegraph drawn
// in his own look (render/manager/looks.js). Phases go by his health:
//   Nine to Five (to 66%)   Quick Sync (his clipboard over the tank: everyone else, step clear), Delegate (a
//                           sticky note over each of you: spread), Circle Back (a felt-tip circle round him:
//                           get IN, then "...and back around": get OUT), Reply All (a hit on everyone), Team
//                           Huddle (gather on the healer to share it).
//   Overtime (to 33%)       "Intermission? No." He adds Clock Watching (his watch ticks: half the floor goes
//                           on TICK, the other half on TOCK; stand on the TOCK side, then cross over) and
//                           Circle Back reversed (get OUT, then IN).
//   One More Thing (below)  every cast now comes with "...and one more thing!" (a ring round him a beat
//                           after it lands: get away), Just One More Thing (two hits on everyone), and every
//                           time round the rotation he's quicker.
// His state for his rig: m.cast / m.castPose ('sync', 'delegate', 'circle', 'circleback', 'replyall',
// 'huddle', 'clock', 'onemore'), m.phaseAt (and m.mech.phase).
const NM = { sync: 420, delegate: 170, delegateW: 72, ring: 230, inner: 78, back: 230, backR: 120, reply: 160, huddle: 640, huddleW: 100, tick: 240, one: 150, oneR: 104, onemore: 150 };
const delegate = (w, m, up, dur) => up.forEach((g, i) => addZone(w, { kind: 'spread', target: g.id, x: g.body.x, y: g.body.y, w: NM.delegateW, warn: dur, lock: 0.6, damage: NM.delegate, from: m, n: i, look: 'nmDelegate' }));
// Circle Back: the ring (its middle safe) and then the patch round him, or the other way round.
const ringIn = (w, m, dur) => addZone(w, { kind: 'donut', x: m.x, y: w.map.groundY, w: w.map.width * 2, inner: NM.inner, warn: dur, damage: NM.ring, from: m, look: 'nmCircle' });
const patchOut = (w, m, dur, damage = NM.back, r = NM.backR, look = 'nmBack') => addZone(w, { kind: 'circle', x: m.x, y: w.map.groundY, w: r * 2, warn: dur, damage, from: m, noSprout: true, look });
// Clock Watching: half the floor on TICK, the other half on TOCK (the side his watch hand points to first).
function clockWatch(w, m, dur) {
  const W = w.map.width;
  const first = Math.random() < 0.5 ? -1 : 1;
  const left = { kind: 'band', x: 0, w: m.x, dir: 1, damage: NM.tick, from: m, look: 'nmTick' };
  const right = { kind: 'band', x: m.x, w: W - m.x, dir: 1, damage: NM.tick, from: m, look: 'nmTick' };
  const [a, b] = first < 0 ? [left, right] : [right, left];
  addZone(w, { ...a, warn: dur, first: true });
  addZone(w, { ...b, warn: dur + 1.7, first: false });
}
const extra = (w, m, dur) => patchOut(w, m, dur + 1.3, NM.one, NM.oneR, 'nmOne');
const NM_SYNC = { gap: 2.4, look: 'nmSync', cast: 'Quick Sync', dur: 3, pose: 'sync', sub: 'His clipboard over the tank: everyone else, step clear', run: (w, m, up) => buster(w, m, tankOf(up), NM.sync, 3, 84) };
const NM_DELEGATE = { gap: 2.4, cast: 'Delegate', dur: 3, pose: 'delegate', sub: 'A sticky note over each of you: spread out', run: (w, m, up) => delegate(w, m, up, 3) };
const NM_CIRCLE = { gap: 2.4, cast: 'Circle Back', dur: 3.2, pose: 'circle', sub: 'Get IN his circle... then back OUT!', run: (w, m) => { ringIn(w, m, 3.2); patchOut(w, m, 4.9); } };
const NM_AROUND = { gap: 2.2, cast: 'Circle Back Around', dur: 3.2, pose: 'circleback', sub: 'Get OUT... then back IN his circle!', run: (w, m) => { patchOut(w, m, 3.2); ringIn(w, m, 4.9); } };
const NM_REPLY = { gap: 2.4, look: 'nmReply', cast: 'Reply All', dur: 3, pose: 'replyall', sub: 'It goes to everyone: healer, ready', run: (w, m) => raidwide(w, m, NM.reply, 3) };
const NM_HUDDLE = { gap: 2.4, look: 'nmHuddle', cast: 'Team Huddle', dur: 3.4, pose: 'huddle', sub: 'Bring it in! Gather on the healer to share it', run: (w, m, up) => stack(w, m, healerOf(up), NM.huddle, 3.4, 3, NM.huddleW) };
const NM_CLOCK = { gap: 2.4, cast: 'Clock Watching', dur: 3.4, pose: 'clock', sub: 'TICK hits one half, then TOCK the other: start on the TOCK side, then cross over', run: (w, m) => clockWatch(w, m, 3.4) };
const NM_ONEMORE = { gap: 2.2, look: 'nmOneMore', cast: 'Just One More Thing', dur: 3.6, pose: 'onemore', sub: 'Two hits on everyone, one after the other: healer, ready!', run: (w, m) => { raidwide(w, m, NM.onemore, 2.8); raidwide(w, m, NM.onemore, 3.6); } };
// (...and one more thing: the same cast, a ring round him landing a beat after it)
const plusOne = (st) => ({ ...st, cast: `${st.cast}... and One More Thing`, sub: `${st.sub}. Then get away from him!`, run: (w, m, up) => { st.run(w, m, up); extra(w, m, st.dur); } });
const NM_P1 = [NM_SYNC, NM_DELEGATE, NM_CIRCLE, NM_REPLY, NM_HUDDLE];
const NM_P2 = [NM_CLOCK, NM_SYNC, NM_AROUND, NM_DELEGATE, NM_REPLY, NM_HUDDLE, NM_CIRCLE].map((st) => ({ ...st, gap: st.gap * 0.9 }));
const NM_P3 = [NM_ONEMORE, plusOne(NM_SYNC), NM_CLOCK, plusOne(NM_DELEGATE), NM_AROUND, plusOne(NM_HUDDLE), NM_REPLY];
const nmList3 = (loops) => {
  const k = Math.max(0.5, 0.8 * 0.82 ** loops);
  return NM_P3.map((st) => ({ ...st, gap: Math.max(0.7, st.gap * k) }));
};
function mugboss(world, m, up, dt) {
  const now = world.now;
  const s = (m.mech ??= { phase: 1, loops: 0 });
  const frac = m.hp / m.def.hp;
  const phase = frac > 0.66 ? 1 : frac > 0.33 ? 2 : 3;
  if (phase > s.phase && !m.cast) {
    s.phase = phase;
    m.phaseAt = now;
    if (phase === 2) {
      callout(world, 'Overtime', 'Intermission? No. The clock is on: TICK, then TOCK');
      radio(world, 'nmOvertime');
    } else {
      s.loops = 0;
      s.list3 = nmList3(0);
      callout(world, 'One More Thing', 'Every cast comes with one more thing now, and quicker every time');
      radio(world, 'nmOneMore');
    }
  }
  if (m.phaseAt != null && now - m.phaseAt < 2.4) return true;
  m.speedK = s.phase === 3 ? 1.2 : 1;
  if (s.phase < 3) return runRotation(world, m, s.phase === 1 ? NM_P1 : NM_P2, up, dt);
  s.list3 ??= nmList3(0);
  const r = s.rot;
  if (r && r.list === s.list3 && r.i === 0 && s.lastI === s.list3.length - 1) {
    s.loops++;
    s.list3 = nmList3(s.loops);
    callout(world, 'Faster!', 'He has even more things now');
  }
  s.lastI = s.rot?.i;
  return runRotation(world, m, s.list3, up, dt);
}

// The Cup-Noodle Dragon (remade 2026-11-27, render/noodle/): her 2 a.m. dinner, every single night, a cheeky
// little noodle dragon rising out of his own cup. One rotation per phase (world/bossfight.js), each cast on his
// cast bar, its telegraph drawn in his own look (render/noodle/looks.js). Phases go by his health:
//   Just Add Water (to 66%)  Chopstick Pinch (his chopsticks over the tank: everyone else, step clear),
//                           SLUUURP (he slurps: everyone is pulled in toward him; then a burp of steam all
//                           round him: get out!), Noodle Toss (a noodle over each of you: spread), Soup's On (a
//                           hit on everyone), Flavour Packet (gather on the healer to share it).
//   Three Minutes (to 33%)  he sets his timer and adds Chopstick Drop (his chopsticks fall on two spots: dodge
//                           them, then stand where they fell before he pinches the rest of the floor) and Lid
//                           Flip (the foil lid flipped over ahead of him: get behind him).
//   Extra Spicy (below)     chili on everything: Bottomless Bowl (two hits on everyone), Seconds (SLUUURP, then
//                           two burps, the second wider), and every time round the rotation he's quicker.
// His state for his rig: m.cast / m.castPose ('pinch', 'slurp', 'seconds', 'toss', 'soup', 'packet', 'drop',
// 'flip', 'bowl'), m.phaseAt (and m.mech.phase).
const ND = { pinch: 430, burp: 240, burpR: 120, burp2R: 170, toss: 170, tossW: 72, soup: 165, packet: 660, packetW: 100, stick: 200, stickW: 62, snap: 240, flip: 230, flipLen: 360, bowl: 155, pull: 85 };
const tossNoodles = (w, m, up, dur) => up.forEach((g, i) => addZone(w, { kind: 'spread', target: g.id, x: g.body.x, y: g.body.y, w: ND.tossW, warn: dur, lock: 0.6, damage: ND.toss, from: m, n: i, look: 'ndToss' }));
const burp = (w, m, dur, r = ND.burpR) => addZone(w, { kind: 'circle', x: m.x, y: w.map.groundY, w: r * 2, warn: dur, damage: ND.burp, from: m, noSprout: true, look: 'ndBurp' });
// SLUUURP: the pull (noodledragon() below moves everyone in while it lasts), then the burp.
function slurp(w, m, dur, seconds) {
  m.mech.pull = { from: w.now + 0.2, until: w.now + dur - 0.3 };
  addZone(w, { kind: 'raid', x: m.x, y: w.map.groundY, w: 0, warn: dur, damage: 0, tele: true, from: m, look: 'ndSlurp' });
  burp(w, m, dur + 1.3);
  if (seconds) burp(w, m, dur + 2.6, ND.burp2R);
}
// Chopstick Drop: two sticks fall on two spots near the group; then the pinch hits everywhere but where they fell.
function stickDrop(w, m, up, dur) {
  const W = w.map.width;
  const mid = Math.max(260, Math.min(W - 260, (up.length ? up.reduce((t, g) => t + g.body.x, 0) / up.length : m.x) + (Math.random() - 0.5) * 80));
  const xs = [mid - 120, mid + 120];
  xs.forEach((x, i) => addZone(w, { kind: 'band', x: x - ND.stickW / 2, w: ND.stickW, dir: 1, warn: dur, damage: ND.stick, from: m, look: 'ndStick', n: i }));
  const edges = [0, ...xs.flatMap((x) => [x - ND.stickW / 2, x + ND.stickW / 2]), W];
  for (let i = 0; i < edges.length; i += 2) if (edges[i + 1] - edges[i] > 4) addZone(w, { kind: 'band', x: edges[i], w: edges[i + 1] - edges[i], dir: 1, warn: dur + 1.6, damage: ND.snap, from: m, look: 'ndPinch', xs });
}
const ND_PINCH = { gap: 2.4, look: 'ndChop', cast: 'Chopstick Pinch', dur: 3, pose: 'pinch', sub: 'His chopsticks over the tank: everyone else, step clear', run: (w, m, up) => buster(w, m, tankOf(up), ND.pinch, 3, 84) };
const ND_SLURP = { gap: 2.4, cast: 'SLUUURP', dur: 3, pose: 'slurp', sub: 'He slurps you in... then BURPS: get away from him!', run: (w, m) => slurp(w, m, 3, false) };
const ND_TOSS = { gap: 2.4, cast: 'Noodle Toss', dur: 3, pose: 'toss', sub: 'A noodle over each of you: spread out', run: (w, m, up) => tossNoodles(w, m, up, 3) };
const ND_SOUP = { gap: 2.4, look: 'ndSoup', cast: "Soup's On", dur: 3, pose: 'soup', sub: 'Broth for everyone: healer, ready', run: (w, m) => raidwide(w, m, ND.soup, 3) };
const ND_PACKET = { gap: 2.4, look: 'ndPacket', cast: 'Flavour Packet', dur: 3.4, pose: 'packet', sub: 'A packet torn open over the healer: gather in to share it', run: (w, m, up) => stack(w, m, healerOf(up), ND.packet, 3.4, 3, ND.packetW) };
const ND_DROP = { gap: 2.4, cast: 'Chopstick Drop', dur: 3.4, pose: 'drop', sub: 'Dodge the falling chopsticks... then stand where they fell!', run: (w, m, up) => stickDrop(w, m, up, 3.4) };
const ND_FLIP = { gap: 2.2, look: 'ndFlip', cast: 'Lid Flip', dur: 2.8, pose: 'flip', sub: 'The lid flips over ahead of him: get behind him!', run: (w, m) => cleave(w, m, ND.flipLen, ND.flip, 2.8) };
const ND_BOWL = { gap: 2.2, look: 'ndBowl', cast: 'Bottomless Bowl', dur: 3.6, pose: 'bowl', sub: 'Two hits on everyone, one after the other: healer, ready!', run: (w, m) => { raidwide(w, m, ND.bowl, 2.8); raidwide(w, m, ND.bowl, 3.6); } };
const ND_SECONDS = { gap: 2.2, cast: 'Seconds!', dur: 3, pose: 'seconds', sub: 'Slurped in again... then two burps, the second wider: get well away!', run: (w, m) => slurp(w, m, 3, true) };
const ND_P1 = [ND_PINCH, ND_SLURP, ND_TOSS, ND_SOUP, ND_PACKET];
const ND_P2 = [ND_DROP, ND_PINCH, ND_FLIP, ND_SLURP, ND_TOSS, ND_SOUP, ND_PACKET].map((st) => ({ ...st, gap: st.gap * 0.9 }));
const ND_P3 = [ND_BOWL, ND_PINCH, ND_SECONDS, ND_DROP, ND_FLIP, ND_PACKET, ND_TOSS];
const ndList3 = (loops) => {
  const k = Math.max(0.5, 0.8 * 0.82 ** loops);
  return ND_P3.map((st) => ({ ...st, gap: Math.max(0.7, st.gap * k) }));
};
function noodledragon(world, m, up, dt) {
  const now = world.now;
  const s = (m.mech ??= { phase: 1, loops: 0 });
  // (SLUUURP: everyone on the floor drawn in toward him while it lasts; walking away holds you)
  const P = s.pull;
  if (P && now >= P.from && now < P.until) {
    for (const g of up) {
      if (g.remote || !g.body) continue;
      const dx = m.x - g.body.x;
      if (Math.abs(dx) > 34) g.body.x += Math.sign(dx) * Math.min(Math.abs(dx) - 34, ND.pull * dt);
    }
  } else if (P && now >= P.until) s.pull = null;
  const frac = m.hp / m.def.hp;
  const phase = frac > 0.66 ? 1 : frac > 0.33 ? 2 : 3;
  if (phase > s.phase && !m.cast) {
    s.phase = phase;
    m.phaseAt = now;
    if (phase === 2) {
      callout(world, 'Three Minutes!', 'His chopsticks drop now: dodge them, then stand where they fell');
      radio(world, 'ndTimer');
    } else {
      s.loops = 0;
      s.list3 = ndList3(0);
      callout(world, 'Extra Spicy!', 'Chili on everything: he comes back for seconds, quicker every time');
      radio(world, 'ndSpicy');
    }
  }
  if (m.phaseAt != null && now - m.phaseAt < 2.4) return true;
  if (s.phase < 3) return runRotation(world, m, s.phase === 1 ? ND_P1 : ND_P2, up, dt);
  s.list3 ??= ndList3(0);
  const r = s.rot;
  if (r && r.list === s.list3 && r.i === 0 && s.lastI === s.list3.length - 1) {
    s.loops++;
    s.list3 = ndList3(s.loops);
    callout(world, 'Faster!', 'He slurps faster now');
  }
  s.lastI = s.rot?.i;
  return runRotation(world, m, s.list3, up, dt);
}

// Monday (remade 2026-11-27, render/monday/): the Weekend-Eating Baku, the thing the Queen dreaded most; she ate
// the weekends, so it's ALWAYS Monday. One rotation per phase (world/bossfight.js), each cast on her cast bar,
// its telegraph drawn in her own look (render/monday/looks.js). Her signature is the Calendar: the floor round the
// group laid out as a week of day tiles, every working day crossed out in red pen (hit), the weekend safe.
// Phases go by her health:
//   Good Morning (to 70%)   SEE ME (a red pen circle round the tank: everyone else, step clear), Unread (an
//                           envelope over each of you: spread), This Week (the calendar: the weekend at one end
//                           is safe, and the floor beyond the week is overtime), Wake-Up Call (a hit on
//                           everyone), All-Hands Meeting (gather on the healer to share it).
//   Rush Hour (to 40%)      adds Next Week (the week starts on Sunday now: the two safe days at OPPOSITE ends)
//                           and Strikethrough (her pen swept across ahead of her: get behind her).
//   Always Monday (to 12%)  she eats the last of Saturday: No Weekends (only Sunday is safe, at either end),
//                           Snooze (two hits on everyone); every time round the rotation she's quicker.
// And at 12%, the Queen sleepwalks in and says the magic words (the scene theatre_monday_end), and Monday yawns
// and falls asleep on her feet.
// Her state for her rig: m.cast / m.castPose ('seeme', 'unread', 'week', 'nextweek', 'noweekend', 'alarm',
// 'allhands', 'strike', 'snooze'), m.phaseAt (and m.mech.phase).
const MN = { seeme: 450, unread: 175, unreadW: 72, alarm: 170, all: 700, allW: 100, week: 270, tile: 84, strike: 240, strikeLen: 360, snooze: 160 };
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const unread = (w, m, up, dur) => up.forEach((g, i) => addZone(w, { kind: 'spread', target: g.id, x: g.body.x, y: g.body.y, w: MN.unreadW, warn: dur, lock: 0.6, damage: MN.unread, from: m, n: i, look: 'mnUnread' }));
// The Calendar: seven day tiles round the group; `kind` 'week' (Sat and Sun safe, together at one end), 'next'
// (Sun first, Sat last: the safe days at opposite ends), 'none' (Sunday only, at one end).
function calendar(w, m, up, dur, kind) {
  const W = w.map.width;
  const span = MN.tile * 7;
  const mid = Math.max(span / 2 + 40, Math.min(W - span / 2 - 40, (up.length ? up.reduce((t, g) => t + g.body.x, 0) / up.length : m.x) + (Math.random() - 0.5) * 100));
  const x0 = mid - span / 2;
  const rtl = Math.random() < 0.5;
  let days = kind === 'next' ? ['SUN', ...DAYS.slice(0, 6)] : DAYS.slice();
  if (kind === 'none' && Math.random() < 0.5) days = ['SUN', ...DAYS.slice(0, 5), 'SAT'];
  if (rtl) days.reverse();
  const safe = (d) => (kind === 'none' ? d === 'SUN' : d === 'SAT' || d === 'SUN');
  days.forEach((d, i) => {
    const x = x0 + i * MN.tile;
    if (safe(d)) addZone(w, { kind: 'raid', x: x + MN.tile / 2, y: w.map.groundY, w: MN.tile, warn: dur, damage: 0, tele: true, from: m, look: 'mnWeekend', day: d, bx: x });
    else addZone(w, { kind: 'band', x, w: MN.tile, dir: 1, warn: dur, damage: MN.week, from: m, look: 'mnDay', day: d, n: i, eaten: kind === 'none' && d === 'SAT' });
  });
  // (beyond the week: overtime)
  if (x0 > 4) addZone(w, { kind: 'band', x: 0, w: x0, dir: 1, warn: dur, damage: MN.week, from: m, look: 'mnOff' });
  if (x0 + span < W - 4) addZone(w, { kind: 'band', x: x0 + span, w: W - x0 - span, dir: 1, warn: dur, damage: MN.week, from: m, look: 'mnOff' });
}
const MN_SEEME = { gap: 2.4, look: 'mnSeeMe', cast: 'SEE ME', dur: 3, pose: 'seeme', sub: 'A red pen circle round the tank: everyone else, step clear', run: (w, m, up) => buster(w, m, tankOf(up), MN.seeme, 3, 84) };
const MN_UNREAD = { gap: 2.4, cast: 'Unread', dur: 3, pose: 'unread', sub: 'An email over each of you: spread out', run: (w, m, up) => unread(w, m, up, 3) };
const MN_WEEK = { gap: 2.4, cast: 'This Week', dur: 4, pose: 'week', sub: 'Every weekday is crossed out: stand on the WEEKEND!', run: (w, m, up) => calendar(w, m, up, 4, 'week') };
const MN_NEXT = { gap: 2.4, cast: 'Next Week', dur: 4, pose: 'nextweek', sub: 'The week starts on Sunday now: the weekend is at BOTH ends!', run: (w, m, up) => calendar(w, m, up, 4, 'next') };
const MN_NONE = { gap: 2.4, cast: 'No Weekends', dur: 4, pose: 'noweekend', sub: 'She ate Saturday: only SUNDAY is safe!', run: (w, m, up) => calendar(w, m, up, 4, 'none') };
const MN_ALARM = { gap: 2.4, look: 'mnAlarm', cast: 'Wake-Up Call', dur: 3, pose: 'alarm', sub: 'GOOD MORNING, everyone: healer, ready', run: (w, m) => raidwide(w, m, MN.alarm, 3) };
const MN_ALL = { gap: 2.4, look: 'mnAll', cast: 'All-Hands Meeting', dur: 3.4, pose: 'allhands', sub: 'Everyone in her office: gather on the healer to share it', run: (w, m, up) => stack(w, m, healerOf(up), MN.all, 3.4, 3, MN.allW) };
const MN_STRIKE = { gap: 2.2, look: 'mnStrike', cast: 'Strikethrough', dur: 2.8, pose: 'strike', sub: 'Her pen strikes through the floor ahead: get behind her!', run: (w, m) => cleave(w, m, MN.strikeLen, MN.strike, 2.8) };
const MN_SNOOZE = { gap: 2.2, look: 'mnSnooze', cast: 'Snooze', dur: 3.6, pose: 'snooze', sub: 'The alarm, then the snooze, then the alarm again: healer, ready!', run: (w, m) => { raidwide(w, m, MN.snooze, 2.8); raidwide(w, m, MN.snooze, 3.6); } };
const MON_P1 = [MN_SEEME, MN_UNREAD, MN_WEEK, MN_ALARM, MN_ALL];
const MON_P2 = [MN_NEXT, MN_SEEME, MN_STRIKE, MN_UNREAD, MN_WEEK, MN_ALARM, MN_ALL].map((st) => ({ ...st, gap: st.gap * 0.9 }));
const MON_P3 = [MN_NONE, MN_SEEME, MN_SNOOZE, MN_NEXT, MN_STRIKE, MN_ALL, MN_UNREAD];
const monList3 = (loops) => {
  const k = Math.max(0.5, 0.8 * 0.82 ** loops);
  return MON_P3.map((st) => ({ ...st, gap: Math.max(0.7, st.gap * k) }));
};
function monday(world, m, up, dt) {
  const now = world.now;
  const run = world.dungeon;
  const s = (m.mech ??= { phase: 1, loops: 0, ending: false });
  const frac = m.hp / m.def.hp;
  if (s.ending) {
    // After the scene: she's fast asleep, and the dream's week is over.
    if (world.scene) return true;
    m.minHp = 0;
    run.zones = [];
    m.hp = 0;
    killMob(world, m, true);
    return true;
  }
  // (No blow takes her below 12% until the Queen has said it.)
  m.minHp = Math.ceil(m.def.hp * 0.12);
  if (m.hp <= m.minHp) {
    s.ending = true;
    run.zones = [];
    m.cast = null;
    m.castPose = null;
    m.windup = 0;
    if (s.rot) s.rot.end = null;
    m.crumpleAt = now;
    playScene(world, 'theatre_monday_end');
    return true;
  }
  const phase = frac > 0.7 ? 1 : frac > 0.4 ? 2 : 3;
  if (phase > s.phase && !m.cast) {
    s.phase = phase;
    m.phaseAt = now;
    if (phase === 2) {
      callout(world, 'Rush Hour', 'Next week starts on Sunday: the weekend is at both ends of her calendar now');
      radio(world, 'mnRush');
    } else {
      s.loops = 0;
      s.list3 = monList3(0);
      callout(world, 'Always Monday', 'She ate Saturday: only Sunday is safe, and she is quicker every time');
      radio(world, 'mnAlways');
    }
  }
  if (m.phaseAt != null && now - m.phaseAt < 2.4) return true;
  if (s.phase < 3) return runRotation(world, m, s.phase === 1 ? MON_P1 : MON_P2, up, dt);
  s.list3 ??= monList3(0);
  const r = s.rot;
  if (r && r.list === s.list3 && r.i === 0 && s.lastI === s.list3.length - 1) {
    s.loops++;
    s.list3 = monList3(s.loops);
    callout(world, 'Faster!', 'Monday comes round quicker every week');
  }
  s.lastI = s.rot?.i;
  return runRotation(world, m, s.list3, up, dt);
}

export function theatreKilled(world, m) {
  if (m.def.mech === 'monday') {
    // Elder Zunda goes home to the palace (render/prologue.js): the Playwright's only fan.
    world.char.elders = { ...(world.char.elders ?? {}), zunda: true };
    playScene(world, 'theatre_freed');
  }
}
