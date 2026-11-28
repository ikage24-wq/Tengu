// The Ballroom's boss fight: Dame Rondo and Dame Minuet, the Mirror Twins (2026-11-28; the player:
// "remake them as twin ghost ladies", "1 red hidden eye that stops time and lets them swap places", every
// mechanic agreed: memory mirror-twins-fight). Twin ghost ladies who dance as each other's reflection:
// one on the floor, the other hanging upside down from the ceiling. Only the twin on the floor is in reach
// (the one under the ceiling can be struck from the balconies); when time stops they trade places, so the
// fight turns on who is down here. Their art: render/twins/; their effects: render/twins/looks.js.
//
// Each twin's own moves (whoever is where):
//   Rondo    Metronome (silver rings struck on the floor on her beat; each time faster: accelerando),
//            Conductor's Cue (a stave laid along the floor the way she points: step off it)
//   Minuet   Boo! (she pops out behind one of you: be clear of the mist), Rewind (a clock under each of
//            you: three seconds later you're pulled back to it), Eyes on Me (her red eye: look away from
//            her, or be frozen a moment)
//   Both     Frozen Moment (the hidden red eye stops time: the whole group is frozen while the twins trade
//            places through their mirrors and set new attacks in the stopped air; time starts again and
//            they land a second later), Mirror Step (a strip of mirror on the floor by the floor twin and
//            its reflection up high across the room: neither), Twin Bond (the healthier sister mends the
//            other: keep them even), Pas de Deux (at a quarter: both red eyes, a great frozen wave over
//            everyone, then the dance speeds up)
// Phases by the pair's health together: First Dance (to 60%), Change Partners (to 25%: faster, two
// attacks set in each stopped moment), Pas de Deux (the finale). Alone, the last one comes down to the
// floor and dances everything herself.
// For their rigs: m.ceiling (hanging), m.cast / m.castPose (the rotation), m.timeStopped (the red eye's
// clock hands spin faster). For the drawing: world.dungeon.room.twins { stop, swap, bond, marks }.

import { addZone, callout, hurtMember } from './dungeon.js';
import { runRotation, band, tankOf } from './bossfight.js';
import { radio } from './hollow.js';

// Where the ceiling twin hangs from (world y: just under the Mirrored Ballroom's cornice, render/twins/
// room.js BALL_CEIL), and how tall a twin is (game px): render/twins/.
export const TWIN_HANG = 146;
export const TWIN_H = 96;
// The stopped moment: how long time is held (s), when in it the twins trade places, how long the trade
// takes (render/twins/looks.js SWAP_DUR / SWAP_AT), and how long after time starts again the attacks
// set in it land.
export const STOP = { dur: 3, swapAt: 0.45, swapDur: 0.9, swapMid: 0.4, after: 1.1 };

const twinsOf = (world) => ({
  rondo: world.mobs.find((o) => o.def.id === 'waltzrondo' && o.hp > 0) ?? null,
  minuet: world.mobs.find((o) => o.def.id === 'waltzminuet' && o.hp > 0) ?? null,
});
const roomOf = (world) => (world.dungeon.room.twins ??= { stop: null, swap: null, bond: null, marks: [] });
const centreOf = (world) => world.map.chandelier?.x ?? world.map.width / 2;
const mirrorX = (world, x) => 2 * centreOf(world) - x;
const wallsOf = (world, m) => [Math.max(60, m.fx1 ?? 60), Math.min(world.map.width - 60, m.fx2 ?? world.map.width - 60)];
const floorTwin = (world) => {
  const { rondo, minuet } = twinsOf(world);
  return [rondo, minuet].find((o) => o && !o.ceiling) ?? null;
};
const ceilTwin = (world) => {
  const { rondo, minuet } = twinsOf(world);
  return [rondo, minuet].find((o) => o && o.ceiling) ?? null;
};
const pick = (list) => list[Math.floor(Math.random() * list.length)];

// Hanging a twin from the ceiling, or setting her on the floor.
function hang(world, m, up) {
  m.ceiling = up;
  const y = up ? TWIN_HANG + TWIN_H : world.map.groundY;
  m.yAt = () => y;
  m.y = y;
  m.baseY = y;
  m.goto = null;
}
export function stopped(world) {
  const st = world.dungeon?.room?.twins?.stop;
  return Boolean(st && world.now < st.until);
}
// Holding everyone still (the time stop; her gaze): their own bodies keep `frozenUntil` (world/world.js,
// world/party.js read it).
function freeze(world, g, secs) {
  g.body.frozenUntil = Math.max(g.body.frozenUntil ?? 0, world.now + secs);
  g.body.vx = 0;
  g.body.vy = 0;
}

// ---------- The moves ----------
// Frozen Moment: the clock over the caster winds down; as it strikes, time stops.
function frozenMoment(w, m, up, ctx, dur, sets = 1) {
  addZone(w, {
    kind: 'raid', x: m.x, y: m.ceiling ? m.y - TWIN_H : m.y, ceil: m.ceiling, w: 0, warn: dur, damage: 0, from: m, look: 'twFrozen',
    onLand: (world) => startStop(world, up, sets),
  });
}
function startStop(world, up, sets) {
  const tw = roomOf(world);
  const now = world.now;
  tw.stop = { t0: now, until: now + STOP.dur, k: 0 };
  for (const g of up) freeze(world, g, STOP.dur);
  for (const o of Object.values(twinsOf(world))) if (o) o.timeStopped = true;
  callout(world, 'Frozen Moment!', 'Time has stopped: watch where they set their next steps');
  // the trade, a beat in, through a mirror at each twin's middle (render/twins/looks.js drawSwap)
  const fl = floorTwin(world);
  const ce = ceilTwin(world);
  tw.swap = { t0: now + STOP.swapAt, done: false, a: fl ? [fl.x, world.map.groundY - TWIN_H / 2] : null, b: ce ? [ce.x, TWIN_HANG + TWIN_H / 2] : null };
  // the attacks set in the stopped air, landing a moment after time starts again
  const land = STOP.dur + STOP.after;
  const all = [...up];
  for (let k = 0; k < sets; k++) {
    const g = pick(all);
    if (!g) break;
    const kind = k % 2 ? 'boo' : 'cue';
    if (kind === 'cue') {
      const dir = Math.random() < 0.5 ? 1 : -1;
      const x0 = g.body.x - dir * 30;
      addZone(world, { kind: 'band', x: dir > 0 ? x0 : x0 - 260, w: 260, dir, warn: land, damage: 220, look: 'twCue', from: floorTwin(world) ?? undefined });
    } else {
      addZone(world, { kind: 'circle', x: g.body.x, y: world.map.groundY, w: 96, warn: land, damage: 220, look: 'twBoo', noSprout: true, from: ceilTwin(world) ?? undefined });
    }
  }
}
function tickStop(world, dt) {
  const tw = roomOf(world);
  const st = tw.stop;
  const { rondo, minuet } = twinsOf(world);
  if (st && world.now >= st.until) {
    tw.stop = null;
    tw.resume = { t0: world.now };
    for (const o of [rondo, minuet]) if (o) o.timeStopped = false;
  }
  if (tw.resume && world.now - tw.resume.t0 > 1) tw.resume = null;
  // the trade through the mirrors: halfway through it, they are on each other's side
  const sw = tw.swap;
  if (sw && !sw.done && world.now >= sw.t0 + STOP.swapDur * STOP.swapMid) {
    sw.done = true;
    if (rondo && minuet) {
      const [a, b] = [rondo, minuet];
      const ax = a.x;
      const aUp = a.ceiling;
      a.x = b.x;
      b.x = ax;
      hang(world, a, !aUp);
      hang(world, b, aUp);
      callout(world, 'Change Partners!', `${(a.ceiling ? b : a).def.name.split(',')[0]} has the floor now`);
    }
  }
  if (sw && world.now >= sw.t0 + STOP.swapDur) tw.swap = null;
  // gaze marks fade
  tw.marks = tw.marks.filter((mk) => world.now < mk.until);
}

// Eyes on Me: her red eye; anyone facing her as it lands is frozen a moment.
function eyesOnMe(w, m, up, dur) {
  addZone(w, {
    kind: 'raid', x: m.x, y: m.ceiling ? m.y - TWIN_H : m.y, ceil: m.ceiling, dir: m.dir, floorDY: m.ceiling ? w.map.groundY - (m.y - TWIN_H) : 0, w: 0, warn: dur, damage: 0, from: m, look: 'twGaze',
    onLand: (world, z, members) => {
      for (const g of members) {
        const facing = Math.sign(m.x - g.body.x) === Math.sign(g.body.facing ?? 1);
        if (!facing) continue;
        freeze(world, g, 2.4);
        hurtMember(world, g, 90, m.x, { knock: false });
        roomOf(world).marks.push({ id: g.id, body: g.body, until: world.now + 2.4 });
      }
    },
  });
}
// Metronome: rings struck on the floor on her beat, marching away from her; faster each time.
function metronome(w, m, up, dur, mem) {
  mem.tempo = Math.min(3, (mem.tempo ?? 0) + 1);
  const dir = Math.sign((tankOf(up)?.body.x ?? m.x + 1) - m.x) || 1;
  const beat = 0.62 - mem.tempo * 0.06;
  for (let i = 0; i < 4; i++) {
    const x = m.x + dir * (70 + i * 110);
    if (x < 40 || x > w.map.width - 40) break;
    addZone(w, { kind: 'circle', x, y: w.map.groundY, w: 96 + i * 12, warn: dur + i * beat, damage: 180, from: m, look: 'twTick', noSprout: true });
  }
}
// Conductor's Cue: a stave along the floor the way she points.
function cue(w, m, up, dur) {
  const t = tankOf(up) ?? pick(up);
  const dir = Math.sign((t?.body.x ?? m.x + 1) - m.x) || m.dir || 1;
  const x0 = m.x + dir * 20;
  const len = 360;
  band(w, m, x0, x0 + dir * len, 230, dur);
}
// Boo!: she pops out behind one of you.
function boo(w, m, up, dur) {
  const g = pick(up.filter((o) => o !== tankOf(up))) ?? pick(up);
  if (!g) return;
  const x = g.body.x - (g.body.facing ?? 1) * 26;
  addZone(w, { kind: 'circle', x, y: w.map.groundY, w: 100, warn: dur, damage: 240, from: m, look: 'twBoo', noSprout: true });
  // (on the floor, she really does pop out there)
  if (!m.ceiling) m.booTo = { x, at: w.now + dur };
}
// Rewind: a clock under each of you; when it strikes, you're pulled back to it.
function rewind(w, m, up, dur) {
  for (const g of up) {
    const x = g.body.x;
    const y = g.body.y;
    addZone(w, {
      kind: 'raid', x, y, w: 0, warn: dur, damage: 0, from: m, look: 'twRewind',
      onLand: (world) => {
        if (g.body.frozenUntil > world.now) return;
        g.body.x = x;
        g.body.y = y;
        g.body.vx = 0;
        g.body.vy = 0;
      },
    });
  }
}
// Mirror Step: a strip of mirror by the floor twin, and its reflection up high across the room.
function mirrorStep(w, m, up, dur) {
  const [l, r] = wallsOf(w, m);
  const x = Math.max(l, Math.min(r - 300, m.x - 150));
  addZone(w, { kind: 'band', x, w: 300, dir: 1, warn: dur, damage: 200, from: m, look: 'twMirror' });
  const mx = mirrorX(w, x + 300);
  addZone(w, { kind: 'band', high: true, x: Math.max(l, mx), w: 300, dir: -1, y: w.map.groundY - 100, warn: dur, damage: 200, from: m, look: 'twMirror' });
}
// Twin Bond: the healthier one mends the other (keep them even).
function twinBond(w, m, up, dur) {
  const { rondo, minuet } = twinsOf(w);
  if (!rondo || !minuet) return;
  const fa = rondo.hp / rondo.def.hp;
  const fb = minuet.hp / minuet.def.hp;
  const low = fa < fb ? rondo : minuet;
  const gap = Math.abs(fa - fb);
  const tw = roomOf(w);
  tw.bond = { t0: w.now, until: w.now + dur + 0.6, to: low === minuet ? 1 : 0 };
  addZone(w, {
    kind: 'raid', x: low.x, y: low.y, w: 0, warn: dur, damage: 0, from: m, look: 'twNone',
    onLand: () => {
      // (only what keeps them apart: never past her sister)
      const heal = Math.round(Math.min(gap * 0.6, 0.08) * low.def.hp);
      if (heal > 0) {
        low.hp = Math.min(low.def.hp, low.hp + heal);
        w.dungeon.vfx.push({ kind: 'groupheal', x: low.x, y: low.y, t: 0, dur: 0.8 });
      }
    },
  });
}
// Pas de Deux: both red eyes; a great wave over everyone, then time stops once more.
function pasDeDeux(w, m, up, dur) {
  addZone(w, { kind: 'raid', x: centreOf(w), y: w.map.groundY, w: 0, warn: dur, damage: 260, from: m, look: 'twPas' });
  const { rondo, minuet } = twinsOf(w);
  const other = m === rondo ? minuet : rondo;
  if (other) {
    other.cast = { name: 'Pas de Deux', t0: w.now, dur };
    other.castPose = 'pasdedeux';
    other.castEnd = w.now + dur;
  }
}

// ---------- The rotations ----------
const mem = (w) => {
  const { rondo, minuet } = twinsOf(w);
  return ((rondo ?? minuet)?.mech ?? {}).tw ?? ((rondo ?? minuet).mech.tw = {});
};
const S = {
  metronome: { by: 'rondo', cast: 'Metronome', dur: 2.4, pose: 'metronome', sub: 'Rings on her beat, marching out from her: keep out of each as it strikes', run: (w, m, up) => metronome(w, m, up, 2.4, mem(w)) },
  cue: { by: 'rondo', cast: "Conductor's Cue", dur: 2.4, pose: 'cue', sub: 'A stave along the floor where she points: step off it!', look: 'twCue', run: (w, m, up) => cue(w, m, up, 2.4) },
  boo: { by: 'minuet', cast: 'Boo!', dur: 2.2, pose: 'boo', sub: "She'll pop out behind one of you: get clear of the mist!", run: (w, m, up) => boo(w, m, up, 2.2) },
  rewind: { by: 'minuet', cast: 'Rewind', dur: 3, pose: 'rewind', sub: "A clock under each of you: in three seconds you're pulled back to it", run: (w, m, up) => rewind(w, m, up, 3) },
  gaze: { by: 'minuet', cast: 'Eyes on Me', dur: 2.6, pose: 'gaze', sub: 'Her red eye opens: look AWAY from her!', run: (w, m, up) => eyesOnMe(w, m, up, 2.6) },
  frozen: { by: 'floor', cast: 'Frozen Moment', dur: 2.6, pose: 'frozen', sub: 'Her hidden eye stops time: watch where they set their steps', run: (w, m, up) => frozenMoment(w, m, up, null, 2.6, 1) },
  frozen2: { by: 'ceil', cast: 'Frozen Moment', dur: 2.4, pose: 'frozen', sub: 'Time stops again: two steps set this time', run: (w, m, up) => frozenMoment(w, m, up, null, 2.4, 2) },
  mirror: { by: 'floor', cast: 'Mirror Step', dur: 2.4, pose: 'mirror', sub: 'Mirror on the floor here, and its reflection up high there: be in neither!', run: (w, m, up) => mirrorStep(w, m, up, 2.4) },
  bond: { by: 'ceil', cast: 'Twin Bond', dur: 2.6, pose: 'bond', sub: 'She mends her sister: keep them even!', run: (w, m, up) => twinBond(w, m, up, 2.6) },
  pas: { by: 'floor', cast: 'Pas de Deux', dur: 3.4, pose: 'pasdedeux', sub: 'Both red eyes open: healer, ready!', look: 'twPas', run: (w, m, up) => pasDeDeux(w, m, up, 3.4) },
};
const at = (st, gap) => ({ ...st, gap });
const FIRST = [at(S.metronome, 2.4), at(S.boo, 2), at(S.cue, 2), at(S.rewind, 2), at(S.frozen, 2.4), at(S.gaze, 2), at(S.mirror, 2), at(S.bond, 2)];
const CHANGE = [at(S.cue, 1.8), at(S.boo, 1.6), at(S.metronome, 1.6), at(S.frozen2, 2), at(S.rewind, 1.6), at(S.gaze, 1.6), at(S.mirror, 1.6), at(S.frozen2, 2), at(S.bond, 1.6)];
const FINALE = [at(S.pas, 1.2), at(S.frozen2, 1.6), at(S.metronome, 1.4), at(S.boo, 1.2), at(S.gaze, 1.4), at(S.cue, 1.2), at(S.mirror, 1.2), at(S.rewind, 1.2), at(S.bond, 1.4)];
const ALONE = {
  rondo: [at(S.metronome, 1.6), at(S.cue, 1.6), { ...S.frozen, by: 'rondo', gap: 1.8 }, at(S.mirror, 1.6)],
  minuet: [at(S.boo, 1.6), at(S.rewind, 1.6), at(S.gaze, 1.6), { ...S.frozen, by: 'minuet', gap: 1.8 }],
};

// A cast laid on the other sister (Pas de Deux): it ends on its own clock.
function ownCast(world, m) {
  if (m.castEnd != null && world.now >= m.castEnd) {
    if (m.cast) m.attackAt = m.cast.t0 + m.cast.dur;
    m.cast = null;
    m.castPose = null;
    m.castEnd = null;
  }
}

// Returns true while the twin is busy (no plain swings, no chasing).
export function twins(world, m, up, dt) {
  const s = (m.mech ??= {});
  const { rondo, minuet } = twinsOf(world);
  const tw = roomOf(world);
  // (their entrance plays first, data/scenes.js manor_twins: nothing starts until it's over)
  if (world.scene || world.cine) return true;
  // (the first time: Minuet up on the ceiling, Rondo on the floor)
  if (!s.placed) {
    s.placed = true;
    m.offstage = false;
    hang(world, m, m.def.id === 'waltzminuet');
    // (their entrance ends with time stopped: it starts again as the fight begins, render/twins/fight.js)
    if (m.def.id === 'waltzrondo') roomOf(world).resume = { t0: world.now };
  }
  const partner = m === rondo ? minuet : rondo;
  const me = m.def.id === 'waltzrondo' ? 'rondo' : 'minuet';
  const lead = rondo ?? minuet;
  if (lead === m) tickStop(world, dt);
  ownCast(world, m);
  // Boo!: on the floor she really pops out behind you.
  if (m.booTo && world.now >= m.booTo.at) {
    m.x = Math.max(m.fx1 ?? 40, Math.min(m.fx2 ?? world.map.width - 40, m.booTo.x));
    m.booTo = null;
  }
  // Alone: she comes down to the floor and dances everything herself.
  if (!partner && !s.alone) {
    s.alone = true;
    s.rot = null;
    hang(world, m, false);
    Object.assign(m, { cast: null, castPose: null, castEnd: null, windup: 0 });
    callout(world, `${m.def.name.split(',')[0]} dances alone!`, 'She comes down to the floor for the last dance');
    radio(world, 'alone');
  }
  // The one under the ceiling drifts above her sister's reflection, out of reach, never swinging.
  if (m.ceiling) {
    const want = partner ? mirrorX(world, partner.x) : m.x;
    const [l, r] = wallsOf(world, m);
    const tx = Math.max(l, Math.min(r, want));
    m.x += Math.sign(tx - m.x) * Math.min(Math.abs(tx - m.x), 90 * dt);
    m.dir = partner ? Math.sign(partner.x - m.x) || m.dir : m.dir;
    m.state = 'idle';
  }
  // Time stopped: they are the only ones moving; no new steps start until it runs again.
  if (stopped(world)) {
    if (m.cast && m.castPose !== 'frozen') return true;
    m.castPose = tw.swap ? 'swap' : m.castPose;
    return true;
  }
  if (s.alone) return runRotation(world, m, ALONE[me], up, dt, { [me]: m, floor: m, ceil: m, caster: m }) || false;
  if (lead !== m) return Boolean(m.cast) || m.ceiling;
  // Phases by the pair's health together.
  const frac = (rondo.hp + minuet.hp) / (rondo.def.hp + minuet.def.hp);
  const phase = frac > 0.6 ? 1 : frac > 0.25 ? 2 : 3;
  if ((s.phase ?? 1) !== phase) {
    s.phase = phase;
    if (phase === 2) {
      callout(world, 'Change Partners!', 'Faster now, and two steps set in every stopped moment');
      radio(world, 'partners');
    } else {
      callout(world, 'Pas de Deux!', 'Both red eyes open: the last dance');
      radio(world, 'pasdedeux');
    }
  }
  const list = phase === 1 ? FIRST : phase === 2 ? CHANGE : FINALE;
  const floor = floorTwin(world) ?? m;
  const ceil = ceilTwin(world) ?? m;
  return runRotation(world, m, list, up, dt, { rondo, minuet, floor, ceil, caster: m }) || m.ceiling;
}

export { twinsOf, roomOf };
