// Mochi Sumo, run (data/mochi-sumo.js has its rules, render/sumo.js draws the hall, ui/mochi-sumo.js
// enters it from the sumo hall on the Mochi Market's lane).
//
// The hall: one room the size of the screen - the raised clay ring (the dohyo) in the middle under
// its hanging roof, the referee, the crowd on the tiers behind and down in front. A tournament:
// your Mochi and the first rival come in from either side and hop up onto the ring; each stamps its
// feet in turn (dust puffs off the clay), throws a pinch of salt, steps to its line and crouches,
// fists down, eyes locked. The referee holds out his fan... "Hakkeyoi!" - press then (Space or Up)
// for a good start. They charge, meet in the middle with a thump, and push, swaying back and
// forth, until one gives way: the winner finishes it with its own move (data/mochi-sumo.js
// KIMARITE, by its Power) and the loser goes over the straw bales and off the ring onto the floor,
// sits there dizzy a moment, giggles, and hops back up. They bow; the referee points his fan at the
// winner. The next rival comes in, a little stronger... After the third bout, the results: three
// wins and it's the champion, under the confetti. Down skips to the results; Up at the end takes
// you back out to the market.
//
//   world.sumo = { rank, seed, phase ('intro' | 'bout' | 'results' | 'done'), t, step, st, k, wins,
//     you, rivals, ref, bout, fx, back }

import { MAPS } from '../data/maps.js';
import { SUMO_RANKS, SUMO_ORDER, sumoOpen, sumoRivals, boutOf, pushAt, startOf, sumoPrize, BOUTS } from '../data/mochi-sumo.js';
import { loadMap } from './world.js';
import { groundAt } from './physics.js';
import { learn } from './mochi-brain.js';
import { noteDiary, diaryDay } from '../data/mochi-diary.js';
import { newRecord } from '../data/mochi-raise.js';
import { rollMochi } from '../data/mochi-genes.js';

// The ring: its top (where they stand), its middle, the straw bales' half-width, the clay top's,
// and where its sloped sides meet the hall's floor; each one's line, and its corner.
export const RING = { y: 262, mid: 320, bales: 70, top: 86, foot: 98, floor: 282, mark: 19, bow: 28, corner: 46 };
// The camera's box: the whole hall in one shot (render/sumo.js lays the hall out for it).
export const SUMO_CAM = { zoom: 1.7, x: 320, y: 214 };
export const SUMO_HALL = { x0: 320 - 320 / 1.7, x1: 320 + 320 / 1.7, y0: 214 - 180 / 1.7, y1: 214 + 180 / 1.7 };
const SHOTS = {
  wide: SUMO_CAM,
  ring: { zoom: 2.5, x: RING.mid, y: RING.y - 22 },
  close: { zoom: 3.1, y: RING.y - 16 },
  fall: { zoom: 2.5, y: RING.y - 6 },
};
// The shot to be on now (render/scene.js eases the camera onto it).
export function sumoShot(S) {
  if (!S || S.phase === 'intro' || S.phase === 'results' || S.phase === 'done') return S?.phase === 'intro' || !S ? SHOTS.wide : { ...SHOTS.ring, zoom: 2.4 };
  const r = S.rivals[S.k];
  const mid = (S.you.x + r.x) / 2;
  if (['crouch', 'clash', 'push'].includes(S.step)) return { ...SHOTS.close, x: mid };
  if (['finish', 'trip', 'fall', 'dazed'].includes(S.step)) {
    const L = S.bout?.youWin ? r : S.you;
    return { ...SHOTS.fall, x: (L.x + RING.mid) / 2 };
  }
  if (S.step === 'enter' && S.k === 0) return SHOTS.wide;
  return SHOTS.ring;
}
// How long each part takes (s).
export const STEP = { intro: 3.2, shiko: 2.4, salt: 1.5, call: 1.7, window: 0.42, clash: 0.26, fall: 0.55, dazed: 1.35, hop: 0.42, bow: 1.1, win: 1.5 };
export const FIN = { belly: 1.15, thrust: 1.35, push: 1.05, drive: 1.25, lift: 1.75, throw: 1.45 };
const RESULTS = 5.2;

function sumoHall() {
  return {
    id: 'mochi_sumo', name: 'Mochi Sumo', theme: 'town', isTown: true, private: true, indoor: true, mochiSumo: true,
    width: 640, height: 360, groundY: RING.y,
    // (Its own room: render/sumo.js paints the hall, 'course:sumohall'; its own floor, the ring's
    // clay; a beamed ceiling the camera never looks up at.)
    look: { sky: ['#3a2418', '#5a3622', '#7a4a2c'], skyline: 'course:sumohall', light: 'sumohall', painted: null, ceiling: 'beams', floor: 'painted', clouds: false, material: 'parquet', edges: null, islands: 'planks', propKeep: 1, critters: [], drift: null },
    cottages: [], terrain: [[0, RING.y], [640, RING.y]], platforms: [], ropes: [], water: [], nodes: [],
    zonesBy: 'x', zones: [{ name: 'Mochi Sumo', from: 0, color: '#ffb36b' }],
    townPieces: [],
    portals: [{ id: 'start', x: 600, y: RING.y, hidden: true }],
    lamps: [], npcs: [], spawns: [], deco: [],
  };
}
MAPS.mochi_sumo = sumoHall();

const animOf = (rec) => ({ genes: rec, dir: 1, speed: 0, dist: 0, size: rec.stage === 'mochiko' ? 'baby' : 'grown', mode: 'run', tired: 0, rest: false, noIdle: true, anchors: {} });
// The referee: a grand old Mochi in a layered kimono and long hakama, his fan in his paw.
let refRec = null;
function refereeRec() {
  refRec ??= Object.assign(newRecord(rollMochi(515151, { coat: null })), { stage: 'amamochi', personality: 'stoic', wear: { top: 'kimono', bottom: 'longhakama' }, name: 'Gyoji Goro' });
  return refRec;
}

// Sends your Mochi `rec` into the sumo hall at `rank`. False if it can't go.
export function startSumo(world, rec, rank = 'beginner') {
  if (!SUMO_RANKS[rank] || !sumoOpen(world.char, rank) || world.sumo || world.show || world.race || world.dungeon || world.scene || !rec || rec.stage === 'egg') return false;
  const hour = Math.floor(Date.now() / 3.6e6);
  const seed = hour * 5 + SUMO_ORDER.indexOf(rank);
  const you = { rec, name: rec.name ?? 'Your Mochi', you: true, m: animOf(rec), x: RING.mid - 175, y: RING.floor };
  const rivals = sumoRivals(rank, hour).map((r) => ({ ...r, m: animOf(r.rec), x: RING.mid + 175, y: RING.floor, out: false }));
  world.sumo = {
    rank, seed, phase: 'intro', t: 0, step: null, st: 0, k: 0, wins: 0, results: [],
    you, rivals, ref: { rec: refereeRec(), m: { ...animOf(refereeRec()), dir: -1 }, x: RING.mid, y: RING.y },
    bout: null, fx: [], back: { map: world.map.id, x: world.body.x }, prize: 0,
  };
  loadMap(world, 'mochi_sumo', 'start');
  // (You watch from the crowd, off to the side.)
  Object.assign(world.body, { x: 600, y: groundAt(world.map, 600), vx: 0, vy: 0, facing: -1 });
  world.mochi = null;
  world.log(`Mochi Sumo (${SUMO_RANKS[rank].name}): three bouts - win them all!`, '#ffd6a8');
  return true;
}

// ---------- Moving about ----------
const ease = (k) => k * k * (3 - 2 * k);
const act = (c, name, hold) => (c.m.action = { name, t0: null, ...(hold != null ? { hold } : {}) });
// Walks `c` toward `goal` at its own pace (on the ring, or the floor); true once it's there.
function walk(c, goal, dt, v = 66) {
  const d = goal - c.x;
  if (Math.abs(d) < 0.01) {
    c.x = goal;
    c.m.speed = 0;
    return true;
  }
  c.m.dir = Math.sign(d) || c.m.dir;
  c.m.action = null;
  if (Math.abs(d) <= v * dt) {
    c.x = goal;
    c.m.speed = 0;
    return true;
  }
  c.x += Math.sign(d) * v * dt;
  c.m.dist += v * dt;
  c.m.speed = v;
  return false;
}
// A hop from where it is to (x1, y1): up onto the ring, or down off it. True once it's landed.
function hop(S, c, x1, y1, dt) {
  if (!c.hop) {
    c.hop = { x0: c.x, y0: c.y, x1, y1, t: 0 };
    c.m.speed = 0;
    c.m.dir = Math.sign(x1 - c.x) || c.m.dir;
    act(c, 'sumohop');
  }
  const h = c.hop;
  h.t += dt;
  const k = Math.min(1, h.t / STEP.hop);
  c.x = h.x0 + (h.x1 - h.x0) * ease(k);
  c.y = h.y0 + (h.y1 - h.y0) * k - 11 * Math.sin(Math.PI * k);
  if (k < 1) return false;
  c.hop = null;
  c.m.action = null;
  puff(S, c.x, c.y, 'dust', 3);
  return true;
}
// Off the floor, up onto the ring and to `goal` on it (from the side it's on); true once there.
function comeOn(S, c, goal, dt) {
  const side = Math.sign(c.x - RING.mid) || -1;
  if (c.y > RING.y + 1) {
    if (!c.hop && !walk(c, RING.mid + side * (RING.foot + 6), dt)) return false;
    hop(S, c, RING.mid + side * (RING.top - 8), RING.y, dt);
    return false;
  }
  return walk(c, goal, dt);
}
// Off the ring, down onto the floor and away out of sight; true once gone.
function goOff(S, c, dt) {
  const side = Math.sign(c.x - RING.mid) || 1;
  if (c.y < RING.floor - 1) {
    if (!c.hop && !walk(c, RING.mid + side * (RING.top - 8), dt, 80)) return false;
    hop(S, c, RING.mid + side * (RING.foot + 8), RING.floor, dt);
    return false;
  }
  return walk(c, RING.mid + side * 190, dt, 80);
}
// A puff of something at (x, y): 'dust' off the clay, 'salt' thrown, 'thump' where they meet.
function puff(S, x, y, kind, n = 1, dir = 1) {
  S.fx.push({ kind, x, y, t0: S.ft ?? 0, n, dir });
  if (S.fx.length > 40) S.fx.shift();
}

// ---------- The tournament ----------
const go = (S, step) => Object.assign(S, { step, st: 0 });
const winnerOf = (S) => (S.bout.youWin ? S.you : S.rivals[S.k]);
const loserOf = (S) => (S.bout.youWin ? S.rivals[S.k] : S.you);

export function tickSumo(world, dt, input) {
  const S = world.sumo;
  if (!S) return;
  S.t += dt;
  S.st += dt;
  // (The puffs' own clock, never set back.)
  S.ft = (S.ft ?? 0) + dt;
  const press = Boolean(input?.pressed?.has('Space') || input?.pressed?.has('ArrowUp'));
  const skip = Boolean(input?.pressed?.has('ArrowDown'));
  S.fx = S.fx.filter((f) => S.ft - f.t0 < 1.6);
  if (skip && (S.phase === 'intro' || S.phase === 'bout')) return skipToResults(world, S);
  if (S.phase === 'intro') {
    if (S.t >= STEP.intro) Object.assign(S, { phase: 'bout', step: 'enter', st: 0 });
    return;
  }
  if (S.phase === 'bout') return tickBout(world, S, dt, press);
  if (S.phase === 'results') {
    walk(S.you, RING.mid, dt);
    if (S.you.x === RING.mid && !S.cheered) {
      S.cheered = true;
      S.you.m.dir = 1;
      act(S.you, S.wins === BOUTS ? 'race_joy' : S.wins ? 'cheer' : 'giggle', S.wins === BOUTS ? 4 : 1.6);
      S.ref.m.dir = -1;
      act(S.ref, 'gyojipoint', 3);
    }
    if (S.t >= RESULTS) Object.assign(S, { phase: 'done', t: 0 });
    return;
  }
  if (S.phase === 'done' && (press || S.t > 25)) leaveSumo(world);
}

function tickBout(world, S, dt, press) {
  const you = S.you;
  const r = S.rivals[S.k];
  const ref = S.ref;
  const st = S.st;
  // (The referee stands off to one side as they go to their lines, his fan held out toward the middle,
  // keeps out of their way through the bout, and comes back between them to see them bow.)
  // (Once they're off, to the side away from where the loser goes out.)
  const side = S.k % 2 ? -1 : 1;
  const aside = ['mark', 'crouch', 'clash', 'push', 'finish', 'trip', 'fall', 'dazed'].includes(S.step);
  const refSide = S.bout?.refSide ?? S.guessSide ?? side;
  walk(ref, RING.mid + (aside ? refSide * 48 : 0), dt, 50);
  if (S.step === 'enter') {
    // (You come on for the first bout; you're already up there for the rest, waiting in your corner.)
    const a = comeOn(S, you, RING.mid - RING.corner, dt);
    const b = comeOn(S, r, RING.mid + RING.corner, dt);
    ref.m.dir = S.k % 2 ? -1 : 1;
    if (a && b) {
      you.m.dir = 1;
      r.m.dir = -1;
      act(you, 'sumoshiko');
      act(r, 'sumoshiko');
      // (Where the referee will stand: away from where it looks like the loser will go out - he only
      // has to cross if a good start turns a close one round.)
      const guess = boutOf(you.rec, r.rec, S.seed * 31 + S.k * 7 + 1, null);
      S.guessSide = (guess.youWin ? -1 : 1) * (guess.move.id === 'duck' ? -1 : 1);
      go(S, 'shiko');
    }
  } else if (S.step === 'shiko') {
    // (A stamp each side, dust off the clay at each.)
    for (const [at, c] of [[0.72, you], [1.5, you], [0.72, r], [1.5, r]]) if (st >= at && st - dt < at) puff(S, c.x + c.m.dir * (at < 1 ? 4 : -4), RING.y, 'dust', 4);
    if (st >= STEP.shiko) {
      act(you, 'sumosalt');
      act(r, 'sumosalt');
      go(S, 'salt');
    }
  } else if (S.step === 'salt') {
    if (st >= 0.5 && st - dt < 0.5) for (const c of [you, r]) puff(S, c.x + c.m.dir * 6, RING.y - 16, 'salt', 10, c.m.dir);
    if (st >= STEP.salt) go(S, 'mark');
  } else if (S.step === 'mark') {
    const a = walk(you, RING.mid - RING.mark, dt, 40);
    const b = walk(r, RING.mid + RING.mark, dt, 40);
    if (a && b && Math.abs(ref.x - (RING.mid + refSide * 48)) < 1) {
      you.m.dir = 1;
      r.m.dir = -1;
      act(you, 'sumocrouch', STEP.call + STEP.window + 0.6);
      act(r, 'sumocrouch', STEP.call + STEP.window + 0.6);
      // (The referee, off to the side, holds his fan out level toward the middle.)
      ref.m.dir = -refSide;
      act(ref, 'gyojiready', STEP.call);
      S.pressAt = null;
      go(S, 'crouch');
    }
  } else if (S.step === 'crouch') {
    if (press && S.pressAt == null) S.pressAt = st;
    if (st >= STEP.call && !S.called) {
      S.called = true;
      act(ref, 'gyojicall');
    }
    if (st >= STEP.call + STEP.window) {
      S.called = false;
      const start = startOf(S.pressAt == null ? null : S.pressAt - STEP.call);
      S.start = start;
      S.bout = boutOf(you.rec, r.rec, S.seed * 31 + S.k * 7 + 1, start);
      S.bout.from = [you.x, r.x];
      // (A loser pushed out goes over its own side; one that trips over a ducker, over the other's.)
      S.bout.refSide = (S.bout.youWin ? -1 : 1) * (S.bout.move.id === 'duck' ? -1 : 1);
      go(S, S.bout.move.id === 'duck' ? 'trip' : 'clash');
      if (S.step === 'trip') {
        act(winnerOf(S), 'sumoduck');
        act(loserOf(S), 'sumotrip');
      } else {
        act(you, 'sumocharge');
        act(r, 'sumocharge');
      }
    }
  } else if (S.step === 'clash') {
    const k = ease(Math.min(1, st / STEP.clash));
    you.x = S.bout.from[0] + (RING.mid - 8 - S.bout.from[0]) * k;
    r.x = S.bout.from[1] + (RING.mid + 8 - S.bout.from[1]) * k;
    if (st >= STEP.clash) {
      puff(S, RING.mid, RING.y - 12, 'thump', 1);
      act(you, 'sumopush', S.bout.len + 0.4);
      act(r, 'sumopush', S.bout.len + 0.4);
      go(S, 'push');
    }
  } else if (S.step === 'push') {
    const c = pushAt(S.bout, st);
    you.x = RING.mid + c - 8;
    r.x = RING.mid + c + 8;
    // (Giving way, the loser leans back, feet skidding.)
    const L = loserOf(S);
    if (st >= S.bout.len * 0.62 && L.m.action?.name !== 'sumobrace') act(L, 'sumobrace', S.bout.len * 0.38 + 2);
    if (Math.floor(st * 6) !== Math.floor((st - dt) * 6) && Math.abs(c) > 4) puff(S, L.x - L.m.dir * 6, RING.y, 'dust', 1);
    if (st >= S.bout.len) startFinish(S);
  } else if (S.step === 'finish') {
    if (tickFinish(S, dt)) {
      const L = loserOf(S);
      L.fall = { x0: L.x, y0: L.y, x1: RING.mid + Math.sign(L.x - RING.mid) * (RING.foot + 14) };
      act(L, 'sumotumble');
      go(S, 'fall');
    }
  } else if (S.step === 'trip') {
    // Ducked: the charger trips right over it and sails on out over the bales.
    const [W, L] = [winnerOf(S), loserOf(S)];
    if (!S.trip) {
      const e = Math.sign(W.x - L.x) || 1;
      S.trip = { e, x0: L.x, x1: RING.mid + e * (RING.bales + 8) };
    }
    const e = S.trip.e;
    const k = Math.min(1, st / 0.72);
    L.x = S.trip.x0 + (S.trip.x1 - S.trip.x0) * k;
    L.y = RING.y - 13 * Math.sin(Math.PI * Math.min(1, Math.max(0, (k - 0.25) / 0.6)));
    if (k >= 1) {
      S.trip = null;
      L.fall = { x0: L.x, y0: RING.y, x1: RING.mid + e * (RING.foot + 14) };
      W.m.dir = e;
      go(S, 'fall');
    }
  } else if (S.step === 'fall') {
    const L = loserOf(S);
    const k = Math.min(1, st / STEP.fall);
    L.x = L.fall.x0 + (L.fall.x1 - L.fall.x0) * k;
    L.y = L.fall.y0 + (RING.floor - L.fall.y0) * k * k - 9 * Math.sin(Math.PI * k);
    if (k >= 1) {
      puff(S, L.x, RING.floor, 'dust', 5);
      act(L, L.m.action?.name === 'sumotrip' ? 'sumodazed2' : 'sumodazed');
      const W = winnerOf(S);
      ref.m.dir = Math.sign(W.x - ref.x) || 1;
      act(ref, 'gyojipoint', STEP.dazed + 1);
      if (S.bout.youWin) S.wins += 1;
      S.results.push({ win: S.bout.youWin, move: S.bout.move.name, start: S.start, rival: S.rivals[S.k].name });
      go(S, 'dazed');
    }
  } else if (S.step === 'dazed') {
    const W = winnerOf(S);
    walk(W, RING.mid + (W === you ? -RING.bow : RING.bow), dt, 40);
    if (st >= (loserOf(S).m.action?.name === 'sumodazed2' ? STEP.dazed + 0.25 : STEP.dazed)) go(S, 'back');
  } else if (S.step === 'back') {
    const L = loserOf(S);
    const W = winnerOf(S);
    const a = comeOn(S, L, RING.mid + (L === you ? -RING.bow : RING.bow), dt);
    const b = walk(W, RING.mid + (W === you ? -RING.bow : RING.bow), dt, 40);
    if (a && b && ref.x === RING.mid) {
      ref.m.dir = S.k % 2 ? 1 : -1;
      you.m.dir = 1;
      r.m.dir = -1;
      act(you, 'bow');
      act(r, 'bow');
      go(S, 'bow');
    }
  } else if (S.step === 'bow') {
    if (st >= STEP.bow && !S.cheer) {
      S.cheer = true;
      const W = winnerOf(S);
      act(W, 'sumowin');
      act(loserOf(S), 'clap', STEP.win);
      ref.m.dir = Math.sign(W.x - ref.x) || 1;
      act(ref, 'gyojipoint', STEP.win);
    }
    if (st >= STEP.bow + STEP.win) {
      S.cheer = false;
      go(S, 'off');
    }
  } else if (S.step === 'off') {
    // The rival goes off; you, back to your corner for the next (or, the last done, the results).
    const gone = goOff(S, r, dt);
    walk(you, RING.mid - RING.corner, dt, 50);
    if (gone) {
      r.out = true;
      if (S.k + 1 >= BOUTS) return toResults(world, S);
      S.k += 1;
      S.bout = null;
      go(S, 'enter');
    }
  }
}

// The finish: the winner's own move, the loser to the edge of the ring.
function startFinish(S) {
  const [W, L] = [winnerOf(S), loserOf(S)];
  const d = Math.sign(L.x - W.x) || 1;
  S.fin = { id: S.bout.move.id, d, wx: W.x, lx: L.x, edge: RING.mid + d * (RING.bales + 6) };
  const winAct = { belly: 'sumobelly', thrust: 'sumothrust', push: 'sumopush', drive: 'sumodrive', lift: 'sumolift', throw: 'sumothrow' }[S.fin.id];
  act(W, winAct, FIN[S.fin.id]);
  // (Already giving way: it carries on, unless it's lifted or thrown.)
  if (S.fin.id === 'lift' || S.fin.id === 'throw') act(L, S.fin.id === 'lift' ? 'sumolifted' : 'sumoflung');
  else if (L.m.action?.name !== 'sumobrace') act(L, 'sumobrace', FIN[S.fin.id] + 0.5);
  go(S, 'finish');
}
function tickFinish(S, dt) {
  const F = S.fin;
  const [W, L] = [winnerOf(S), loserOf(S)];
  const t = S.st;
  const len = FIN[F.id];
  const to = (from, goal, a, b) => from + (goal - from) * ease(Math.max(0, Math.min(1, (t - a) / (b - a))));
  switch (F.id) {
    // A big tummy bump: wound up, then boing - off it bounces, back to the bales.
    case 'belly':
      W.x = to(F.wx, F.wx + F.d * 6, 0.35, 0.6);
      L.x = to(F.lx, F.edge, 0.45, 1.0);
      if (t >= 0.45 && t - dt < 0.45) puff(S, (W.x + L.x) / 2, RING.y - 12, 'thump', 1);
      break;
    // Slap-slap-slap, step by step, back it goes.
    case 'thrust': {
      const steps = 5;
      const k = Math.min(1, t / (len - 0.1));
      const s = Math.min(steps, Math.floor(k * steps) + ease((k * steps) % 1));
      L.x = F.lx + (F.edge - F.lx) * (s / steps);
      W.x = L.x - F.d * 16;
      if (Math.floor(k * steps) !== Math.floor(Math.max(0, (t - dt) / (len - 0.1)) * steps)) puff(S, L.x - F.d * 7, RING.y - 12, 'thump', 0.6);
      break;
    }
    // A steady shove, or gripped and walked out step by step.
    case 'push':
    case 'drive':
      L.x = to(F.lx, F.edge, 0.1, len - 0.05);
      W.x = L.x - F.d * (F.id === 'drive' ? 14 : 16);
      break;
    // Lifted clean off its feet, carried out kicking, and set down outside.
    case 'lift': {
      L.y = RING.y - 12 * (t < 1.4 ? ease(Math.min(1, t / 0.45)) : 1 - ease(Math.min(1, (t - 1.4) / 0.3)));
      L.x = to(F.lx, F.edge + F.d * 4, 0.45, 1.35);
      W.x = L.x - F.d * 12;
      break;
    }
    // Over it goes in an arc, and rolls out.
    case 'throw': {
      const k = Math.max(0, Math.min(1, (t - 0.3) / 0.5));
      const land = F.wx + F.d * 30;
      if (t < 0.8) {
        L.x = F.lx + (land - F.lx) * ease(k);
        L.y = RING.y - 15 * Math.sin(Math.PI * k);
      } else {
        L.y = RING.y;
        L.x = to(land, F.edge, 0.8, len);
      }
      break;
    }
    default:
      break;
  }
  return t >= len;
}

function toResults(world, S) {
  Object.assign(S, { phase: 'results', t: 0, step: null, st: 0, bout: null });
  S.ref.x = RING.mid + 30;
  award(world, S);
}
// (Down while it's on: the rest of the bouts decided at once, straight on to the results.)
function skipToResults(world, S) {
  for (let k = S.results.length; k < BOUTS; k++) {
    // (The one under way goes as it was going.)
    const b = k === S.k && S.bout ? S.bout : boutOf(S.you.rec, S.rivals[k].rec, S.seed * 31 + k * 7 + 1, null);
    if (b.youWin) S.wins += 1;
    S.results.push({ win: b.youWin, move: b.move.name, start: null, rival: S.rivals[k].name });
  }
  for (const r of S.rivals) Object.assign(r, { out: true, hop: null });
  Object.assign(S.you, { x: RING.mid - RING.corner, y: RING.y, hop: null, fall: null });
  S.you.m.action = null;
  S.k = BOUTS - 1;
  toResults(world, S);
}

function award(world, S) {
  const you = S.you;
  const rec = you.rec;
  S.prize = sumoPrize(S.rank, S.wins);
  world.char.gold += S.prize;
  if (S.wins === BOUTS) {
    const char = world.char;
    const first = !char.sumoWins?.[S.rank];
    char.sumoWins ??= {};
    char.sumoWins[S.rank] = true;
    const next = SUMO_ORDER[SUMO_ORDER.indexOf(S.rank) + 1];
    if (first && next) S.opened = SUMO_RANKS[next].name;
    if (world.char.garden && !world.gardenVisit) noteDiary(world.char.garden, diaryDay(world.dayClock?.() ?? new Date()), 'sumoring', [rec], SUMO_RANKS[S.rank].name);
  }
  // (A good tussle: happier, a little closer to you, and keener on a romp.)
  rec.mood = Math.min(100, (rec.mood ?? 60) + 6 + S.wins * 3);
  rec.bond = Math.min(1000, (rec.bond ?? 0) + 3 + S.wins);
  learn(rec, 'play', 1.5 + S.wins * 0.3, 0.12);
  world.log(S.wins === BOUTS ? `${you.name} won all three bouts: champion! +${S.prize} gold.` : `${you.name} won ${S.wins} of ${BOUTS} bouts. +${S.prize} gold.`, '#ffd6a8');
  if (S.opened) world.log(`The ${S.opened} ring is open to you now.`, '#ffe08a');
}

// Back out to the sumo hall's door.
export function leaveSumo(world) {
  const S = world.sumo;
  if (!S || S.phase !== 'done') return false;
  world.sumo = null;
  const back = MAPS[S.back.map] && !MAPS[S.back.map].mochiSumo ? S.back : { map: 'mochi_market', x: 950 };
  loadMap(world, back.map, 'start');
  Object.assign(world.body, { x: back.x, y: groundAt(world.map, back.x), vx: 0, vy: 0 });
  return true;
}

// Up by the sumo hall (the Mochi Market's lane: `map.sumoHall`): its window (ui/mochi-sumo.js).
export function sumoHallUp(world) {
  const at = world.map.sumoHall;
  if (at == null || world.gardenVisit || !world.char.garden || Math.abs(world.body.x - at) > 40) return false;
  world.events.push({ type: 'sumo' });
  return true;
}
