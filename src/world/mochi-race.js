// A Mochi race (docs/design/mochi.md step 5; the stages and ranks in data/mochi-race.js). From the
// Race Stadium's board you send one of your Mochi to a stage; the race plays on that stage's own
// course, your Mochi against five rivals, and you watch from the finish line with the crowd while
// the camera runs alongside your Mochi. Cheering (Up, or the Cheer button) gives it a burst of speed
// that costs it some of its stamina, so cheering all the way tires it out before the end.
//
// A course is a row of legs (world/stadium.js `race.legs`): along the ground, across water, up a
// climbing wall, and off an edge in a glide. Each racer goes on its own stats: Run points set its
// running speed (and its running style, so a baby who can't walk yet crawls), Swim its swimming (one
// who can't yet flails), Power its climbing, Fly how fast and how far it glides (one who can't yet
// drops); its Stamina how fast running tires it (the same tiring as in the Garden: render/mochi-
// anim.js STAMINAS, handed to the drawing as `m.tired`, so what you see is what is slowing it down),
// uphill tiring it more; the least stamina-ed stop to catch their breath. Hills slow it going up and
// speed it coming down; cloud fluff (`race.slow`) slows anyone wading through it. Its personality
// sets its pace through the race (data/mochi-race.js paceOf). The rivals are rolled from the stage,
// the rank and the hour, so everyone racing that stage that hour meets the same field.
//
// Racing with your party (net/mochi-race.js): the host's game runs the race, its friends' Mochi in
// the lanes after its own, and sends where everyone is a few times a second; each friend's game
// draws the race from that (easing the racers smoothly along), sends its cheers to the host, and at
// the end gives its own Mochi its own prize and medal.
//
// While a race is on (world.race), the world holds still around it (world/world.js updateWorld).
//   world.race = { stageId, rank, phase ('ready' | 'run' | 'done'), t (seconds in this phase),
//     clock (seconds since Go), racers: [{ rec, name, owner, you, lane, leg, x, y, climbed, m, ... }],
//     me (which racer is yours), party (the host's: its friends' ids), remote (a friend's: the
//     host's id), back (a friend's: where it was before), first, finished, results, prize, cam }

import { MAPS } from '../data/maps.js';
import { rollMochi, seededRandom, STATS } from '../data/mochi-genes.js';
import { newRecord, evolve, styleOf, STYLE_POINTS, CANT_POINTS as CANT } from '../data/mochi-raise.js';
import { RACE_STAGES, RACE_RANKS, RANK_ORDER, RIVAL_NAMES, paceOf, CHEER, RACE_TAIL, RACE_MAX, prizeOf, MEDALS, medalKey, rankOpen } from '../data/mochi-race.js';
import { groundAt, waterAt } from './physics.js';
import { addItem } from '../core/inventory.js';
import { mochiVoice, voiceAction } from './mochi-voice.js';
import { DRESS, dressFor } from '../data/mochi-dress.js';
import { loadMap } from './world.js';

// Its styles' speeds (render/mochi-anim.js GAITS, SWIMS, CLIMBS, FLIES); between two styles, its
// speed climbs with its points. One who can't yet: crawls, flails, drops.
const GAIT_SPEED = [34, 60, 80, 104, 136, 168];
const SWIM_SPEED = [26, 44, 64, 88, 112, 140];
const CLIMB_SPEED = [8, 16, 26, 40, 56, 74];
const FLY_SPEED = [30, 52, 60, 92, 128, 160];
const SCOOT = 10;
const FLAIL = 14;
const FLOP = 40;
// How steeply it glides down, by its Fly style (one who can't fly yet just drops).
const GLIDE_SLOPE = [1.5, 1.2, 0.95, 0.75, 0.6, 0.5];
const DROP = 3;
// Its Stamina style: how fast running tires it, and how tired it can get (render/mochi-anim.js
// STAMINAS); the most it can get is 1 only for the least stamina-ed, who then stop for a rest.
const STAMINA = [[1 / 5, 1], [1 / 8, 0.85], [1 / 12, 0.65], [1 / 18, 0.45], [1 / 30, 0.25], [0, 0]];
const REST = 2.6;
// How much slower it runs, all tired out; how much a hill slows it going up (and speeds it coming
// down), and how much more going up tires it. Wading through cloud fluff, everyone goes at much the
// same slow pace (a quick runner only a little quicker): the further a glide carries it, the less of
// it there is.
const TIRED_SLOW = 0.4;
const HILL_SPEED = 1.4;
const HILL_TIRE = 3;
const WADE = 22;
// At a climbing wall each lane takes its own spot along the wall's foot; at the top it steps this
// far onto the ledge.
const WALL_GAP = 8;
const WALL_LANE = 6;
const LIP = 8;
// Off the mark: from a standing start to full speed over the first moments after Go.
const GETAWAY = [0.35, 1.3];
// Off the launch: a little hop up before the glide takes it down (px high, over how far along).
const HOP = [10, 70];
// The countdown before Go; and how long the results show before Up can take you back.
export const COUNTDOWN = 3;
const LEAVE_AFTER = 1;
// Before the countdown, the race's opening (a cutscene; Up skips it): the camera sweeps along the
// course from the finish back to the start (`sweep` s), then each racer on the line gets its card
// (`card` s each). `introLen`: how long all of it takes; the countdown follows.
export const INTRO = { sweep: 2.6, card: 0.7 };
export const introLen = (R) => INTRO.sweep + INTRO.card * R.racers.length;
// The finish: as the first one crosses, a moment in slow motion (`secs` real seconds at `rate`).
export const SLOW_MO = { secs: 1.4, rate: 0.3 };
// After the race, the podium (render/race.js): the top three hop up onto it (`hop` s each, a beat
// apart) and cheer, confetti flying, for `secs` seconds (Up skips it once it's begun); then the
// results. It stands in front of the stands, `x` past the finish; each place's block, how far
// across from its middle and how tall.
export const PODIUM = { secs: 5, x: 150, skipAfter: 1.2, hop: 0.6, blocks: [[0, 26], [-36, 18], [36, 12]] };
export const podiumSpot = (course, place) => ({ x: course.finish + PODIUM.x + PODIUM.blocks[place - 1][0], h: PODIUM.blocks[place - 1][1] });
// On the line before Go each lane stands a little apart (so each can be seen), closing up over the
// first moments of the race (only how they're drawn: everyone runs the same course).
const LINEUP = { gap: 13, close: 1.2 };
export function lineupOffset(R, r) {
  const at = (r.lane - (R.racers.length - 1) / 2) * LINEUP.gap;
  return R.phase === 'ready' ? at : R.phase === 'run' ? at * Math.max(0, 1 - R.clock / LINEUP.close) : 0;
}

function speedOf(table, points, cantBelow, cantSpeed) {
  if (points < cantBelow) return cantSpeed;
  const i = styleOf(points);
  if (i >= table.length - 1) return Math.min(table[i] * 1.2, table[i] + (points - STYLE_POINTS[i]) * 0.02);
  const k = (points - STYLE_POINTS[i]) / (STYLE_POINTS[i + 1] - STYLE_POINTS[i]);
  return table[i] + (table[i + 1] - table[i]) * k;
}
export const runSpeed = (points) => speedOf(GAIT_SPEED, points, CANT.run, SCOOT);

const hashStr = (s) => {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
};
export const raceHour = (now = Date.now()) => Math.floor(now / 3.6e6);

// The five rivals for a stage and rank this hour: rolled Mochi with stats in the rank's range
// (mostly toward its low end), some of them grown (more, the higher the rank), each with a name.
export function rivalsFor(stageId, rank, hour) {
  const rng = seededRandom(hashStr(`${stageId}|${rank}|${hour}`));
  const [lo, hi] = RACE_RANKS[rank].rivals;
  const names = [...RIVAL_NAMES];
  const out = [];
  for (let k = 0; k < 5; k++) {
    const rec = newRecord(rollMochi(Math.floor(rng() * 1e9)));
    for (const st of STATS) {
      const p = Math.round(lo + (hi - lo) * rng() ** 1.4);
      Object.assign(rec.stats[st], { points: p, level: Math.max(1, Math.min(99, Math.round(p / 16))) });
    }
    if (rng() < RACE_RANKS[rank].grown) {
      Object.assign(rec, { age: 99999, mood: 80 });
      evolve(rec, rng);
    }
    out.push({ rec, name: names.splice(Math.floor(rng() * names.length), 1)[0] });
  }
  return out;
}

// How far along the course a racer is (along the ground and water, and up the walls).
export const progressOf = (course, r) => r.x - course.start + r.climbed;

// Sends `rec` (one of your Mochi) to race stage `stageId` at `rank`. Returns false if it can't.
// A party race (net/mochi-race.js) hands over its `field` ([{ rec, name, owner }]) and which of it
// is yours (`me`); the host its friends' ids (`party`), a friend the host's (`remote`) and where to
// go back to after (`back`).
export function startRace(world, rec, stageId, rank = 'beginner', opts = {}) {
  const stage = RACE_STAGES[stageId];
  // (A friend's party race is open to you whatever you've won: it's raced from their board.)
  const open = Boolean(opts.remote) || rankOpen(world.char, stageId, rank);
  if (!stage || !RACE_RANKS[rank] || !open || world.race || world.dungeon || world.trial || world.scene || !rec || rec.stage === 'egg') return false;
  const map = MAPS[stage.map];
  const course = map.race;
  const hour = raceHour();
  const wobble = seededRandom(hashStr(`${stageId}|${rank}|${hour}|pace`));
  const me = opts.me ?? 0;
  const field = (opts.field ?? [{ rec, name: null }, ...rivalsFor(stageId, rank, hour)]).slice(0, 6);
  // (Your own lane is your own Mochi: what the race gives it stays with it.)
  field[me] = { ...field[me], rec, name: null };
  const y0 = groundAt(map, course.start);
  world.race = {
    stageId, rank, phase: 'ready', t: 0, clock: 0, first: null, finished: 0, results: null, prize: 0, cheerAsk: false,
    me, party: opts.party ?? null, remote: opts.remote ?? null, back: opts.back ?? null, heard: Date.now() / 1000, sendIn: 0,
    racers: field.map((f, lane) => ({
      ...f, you: lane === me, lane, leg: 0, x: course.start, y: y0, climbed: 0, glide: null, seed: wobble() * 100, pace: paceOf(f.rec.personality),
      runFor: 0, restUntil: 0, resting: false, cheerUntil: -1, cheerReady: 0, cheers: 0, done: null, place: 0, reacted: false,
      m: { genes: f.rec, dir: 1, speed: 0, dist: course.start, size: f.rec.stage === 'mochiko' ? 'baby' : 'grown', mode: 'run', tired: 0, rest: false },
    })),
    cam: null,
  };
  loadMap(world, stage.map, 'start');
  // You watch from the finish, by the crowd at the near end of the stands, facing the runners (past
  // the podium, which stands on the grass between the finish arch and the stands).
  const at = course.finish + 280;
  Object.assign(world.body, { x: at, y: groundAt(world.map, at), vx: 0, vy: 0, facing: -1 });
  // (Your Mochi out with you is the one racing: it leaves your side till the race is over.)
  world.mochi = null;
  world.race.cam = { x: course.start, y: y0 };
  world.log(`${stage.name} (${RACE_RANKS[rank].name}): on your marks...`, '#ffc2d4');
  return true;
}

// Cheers racer `r` on: a burst of speed, paid for in stamina; a cheer gets one catching its breath
// back on its feet sooner. Returns whether it took.
export function cheer(R, r) {
  if (R.phase !== 'run' || r.done != null || R.clock < r.cheerReady) return false;
  if (R.clock < r.restUntil) r.restUntil = Math.max(R.clock, r.restUntil - 0.8);
  r.cheerUntil = R.clock + CHEER.secs;
  r.cheerReady = R.clock + CHEER.every;
  r.runFor += CHEER.cost;
  r.cheers += 1;
  return true;
}

// Where a run leg ends for this racer: at a climbing wall, each lane at its own spot along its foot.
function runEnd(course, r) {
  const next = course.legs[r.leg + 1];
  return next?.kind === 'climb' ? next.x - WALL_GAP - r.lane * WALL_LANE : course.legs[r.leg].to;
}
const nextLeg = (course, r) => {
  if (r.leg < course.legs.length - 1) r.leg += 1;
  r.glide = null;
};

// Off the edge in a glide: how fast and how steeply by its Fly (one who can't fly yet drops), on
// down until it meets the ground.
function glideStep(course, r, dt, map, boost) {
  const s = r.rec.stats;
  const can = s.fly.points >= CANT.fly;
  r.glide ??= { x0: r.x, y0: r.y, slope: can ? GLIDE_SLOPE[styleOf(s.fly.points)] : DROP };
  const v = speedOf(FLY_SPEED, s.fly.points, CANT.fly, FLOP) * boost;
  r.x += v * dt;
  const d = r.x - r.glide.x0;
  r.y = r.glide.y0 + r.glide.slope * d - (can ? HOP[0] * Math.sin(Math.PI * Math.min(1, d / HOP[1])) : 0);
  Object.assign(r.m, { mode: 'fly', inWater: false, speed: v, tired: 0, noShadow: true });
  // (Still over the lip it left from, it's on it, not in it; it comes down only on the ground below.)
  const ground = groundAt(map, r.x);
  if (ground <= r.glide.y0 + 2) r.y = Math.min(r.y, ground);
  else if (r.y >= ground) {
    r.y = ground;
    r.m.noShadow = false;
    nextLeg(course, r);
  }
}

// One racer's step along its leg; or, once past the line (or once the race is over), easing to a
// stop (one still gliding comes down first) and cheering or sulking as its place deserves.
function stepRacer(R, r, dt, course, map) {
  const m = r.m;
  const s = r.rec.stats;
  const leg = course.legs[r.leg];
  const [px, py] = [r.x, r.y];
  const C = R.clock;
  const over = r.done != null || R.phase === 'done';
  const boost = !over && C < r.cheerUntil ? CHEER.boost : 1;
  const k = progressOf(course, r) / course.total;
  const pace = k < 1 / 3 ? r.pace.early : k > 2 / 3 ? r.pace.late : 1;
  const wob = 1 + r.pace.wobble * (0.6 * Math.sin(C * 0.9 + r.seed) + 0.4 * Math.sin(C * 2.3 + r.seed * 1.7));
  const [tire, most] = STAMINA[styleOf(s.stamina.points)];
  m.rest = false;
  if (leg.kind === 'glide') glideStep(course, r, dt, map, boost);
  else if (over) {
    m.speed = Math.max(0, m.speed - 70 * dt);
    m.tired = Math.max(0, (m.tired ?? 0) - dt * 0.4);
    if (leg.kind === 'run') {
      r.x = Math.min(r.done != null ? Infinity : runEnd(course, r), r.x + m.speed * dt);
      r.y = groundAt(map, r.x);
      if (m.speed === 0 && !r.reacted && r.place) {
        r.reacted = true;
        const last = r.place === R.racers.length;
        if (r.place <= 3 || last) m.action = { name: last ? 'sulk' : 'cheer', t0: null, hold: 2 };
      }
    } else m.speed = 0;
  } else if (C < r.restUntil) {
    Object.assign(m, { speed: 0, rest: true, tired: 1 });
    r.resting = true;
  } else {
    if (r.resting) {
      r.resting = false;
      r.runFor *= 0.35;
    }
    if (leg.kind === 'run') {
      // Running: tiring (more uphill), slower up a hill and quicker down one, slow in the fluff.
      const sl = (groundAt(map, r.x + 6) - groundAt(map, r.x - 6)) / 12;
      r.runFor += dt * (1 + Math.max(0, -sl) * HILL_TIRE);
      // (A long hard course tires it faster, and wears it out sooner: `course.tire`, `course.restAt`,
      // for `course.rest` seconds.)
      const f = Math.min(most, r.runFor * tire * r.pace.tire * (course.tire ?? 1));
      if (f >= (course.restAt ?? 0.98) && most >= (course.restAt ?? 1)) r.restUntil = C + (course.rest ?? REST);
      const hill = Math.max(0.55, Math.min(1.3, 1 + sl * HILL_SPEED));
      const wading = (course.slow ?? []).some(([a, b]) => r.x >= a && r.x < b);
      const run = wading ? WADE + runSpeed(s.run.points) * 0.05 : runSpeed(s.run.points) * hill;
      const v = run * pace * wob * (1 - TIRED_SLOW * f) * boost * Math.min(1, GETAWAY[0] + C * GETAWAY[1]);
      const end = runEnd(course, r);
      r.x = Math.min(end, r.x + v * dt);
      r.y = groundAt(map, r.x);
      Object.assign(m, { mode: 'run', inWater: false, speed: v, tired: f });
      if (r.x >= end && r.leg < course.legs.length - 1) nextLeg(course, r);
    } else {
      // Swimming and climbing don't tire it; it gets its breath back a little.
      r.runFor = Math.max(0, r.runFor - dt * 0.5);
      if (leg.kind === 'swim') {
        const v = speedOf(SWIM_SPEED, s.swim.points, CANT.swim, FLAIL) * pace * wob * boost;
        r.x = Math.min(leg.to, r.x + v * dt);
        r.y = leg.y;
        Object.assign(m, { mode: 'swim', inWater: true, speed: v, tired: 0 });
        if (r.x >= leg.to) nextLeg(course, r);
      } else if (r.y > leg.to) {
        // Up the wall, hand over hand...
        const v = speedOf(CLIMB_SPEED, s.power.points, 0, 0) * pace * wob * boost;
        const ny = Math.max(leg.to, r.y - v * dt);
        r.climbed += r.y - ny;
        r.y = ny;
        Object.assign(m, { mode: 'climb', inWater: false, speed: v, tired: 0 });
      } else {
        // ...and over the top onto the ledge.
        const v = Math.max(20, runSpeed(s.run.points) * 0.6);
        r.x = Math.min(leg.x + LIP, r.x + v * dt);
        r.y = leg.to;
        Object.assign(m, { mode: 'run', inWater: false, speed: v, tired: 0 });
        if (r.x >= leg.x + LIP) nextLeg(course, r);
      }
    }
  }
  m.dist += Math.hypot(r.x - px, r.y - py);
  m.dir = 1;
}

// Each frame of the race: the countdown, the running, the finish; Up cheers (and once it's over,
// takes you back to the stadium).
// On the line: as the line-up comes to each racer it does its personality's signature move and
// says something; then for the first second of the countdown everyone's nervous (or pumped, by
// personality), and for 2, 1 they crouch at the line.
// (Which kind of nerves: render/mochi-anim.js race_nerves or race_pumped.)
const PUMPED = new Set(['brave', 'bossy', 'proud', 'sporty', 'hyper', 'cool', 'showoff', 'sassy', 'stoic', 'cheeky', 'mischief', 'dramatic']);
const lineNerves = (personality) => (PUMPED.has(personality) ? 'race_pumped' : 'race_nerves');
function lineActs(world, R) {
  const il = introLen(R);
  const put = (r, name) => {
    if (r.m.action?.name !== name) r.m.action = { name, t0: null, hold: 30 };
  };
  if (R.t >= INTRO.sweep && R.t < il) {
    const i = Math.min(R.racers.length - 1, Math.floor((R.t - INTRO.sweep) / INTRO.card));
    if (R.spot !== i) {
      R.spot = i;
      const r = R.racers[i];
      r.m.action = { name: `sig_${r.rec.personality}`, t0: null };
      mochiVoice(world, r.rec, r.you ? 'happy' : 'call', world.body.x);
    }
  } else if (R.t >= il) {
    for (const r of R.racers) put(r, R.t < il + 1 ? lineNerves(r.rec.personality) : 'race_crouch');
  }
}
export function tickRace(world, dt, input) {
  const R = world.race;
  const course = world.map.race;
  const you = R.racers[R.me];
  const up = Boolean(input?.pressed?.has('ArrowUp')) || R.cheerAsk;
  R.cheerAsk = false;
  if (R.remote) {
    tickRemote(world, R, dt, up, you);
    return;
  }
  R.t += dt;
  if (R.phase === 'ready') {
    if (up && R.t < introLen(R)) R.t = introLen(R);
    lineActs(world, R);
    if (R.t >= introLen(R) + COUNTDOWN) {
      Object.assign(R, { phase: 'run', t: 0 });
      for (const r of R.racers) r.m.action = null;
    }
  } else if (R.phase === 'run') {
    // (The first across the line: a moment in slow motion.)
    const sdt = R.slowLeft > 0 ? dt * SLOW_MO.rate : dt;
    R.slowLeft = Math.max(0, (R.slowLeft ?? 0) - dt);
    R.clock += sdt;
    // (Cheered on, it squeaks back.)
    if (up && cheer(R, you)) mochiVoice(world, you.rec, 'happy', world.body.x);
    for (const r of R.racers) stepRacer(R, r, sdt, course, world.map);
    const last = course.legs.length - 1;
    for (const r of R.racers) {
      if (r.done != null || r.leg < last || r.x < course.finish) continue;
      r.done = R.clock;
      r.place = ++R.finished;
      if (R.first == null) R.slowLeft = SLOW_MO.secs;
      R.first ??= R.clock;
    }
    if (R.finished === R.racers.length || (R.first != null && R.clock >= R.first + RACE_TAIL) || R.clock >= RACE_MAX) endOfRace(world, R);
  } else {
    for (const r of R.racers) stepRacer(R, r, dt, course, world.map);
    podiumStep(world, R);
    // (Yours cheers or sulks at the end, and says so: world/mochi-voice.js.)
    voiceAction(world, you.rec, you.m, world.body.x);
    // (Up: past the podium to the results, then back. Not straight away: someone still cheering as
    // it ends shouldn't skip it all.)
    if (up && podiumUp(world, R)) return;
  }
  // (Hosting a party race: where everyone is, to the friends, a few times a second; and a little
  // while after the end, so they see the racers come to a stop.)
  R.sendIn -= dt;
  if (R.party?.length && R.sendIn <= 0 && (R.phase !== 'done' || R.t < 4)) {
    R.sendIn = SEND_EVERY;
    raceNet.state?.(world, R);
  }
  aimCamera(world, R);
}

// After the race, Up skips the podium to the results (once it's begun), and from the results takes
// you back. Returns true if it took you back.
function podiumUp(world, R) {
  if (R.t < PODIUM.secs) {
    if (R.t > PODIUM.skipAfter) R.t = PODIUM.secs;
    return false;
  }
  if (R.t < PODIUM.secs + LEAVE_AFTER) return false;
  leaveRace(world);
  return true;
}
// The podium: the top three, from wherever they came to a stop, hop up onto their blocks (3rd, then
// 2nd, then the winner) and cheer. (Worked out from the places alone, so a friend's game puts them
// there the same.)
function podiumStep(world, R) {
  const map = world.map;
  const course = map.race;
  for (const r of R.racers) {
    if (!(r.place >= 1 && r.place <= 3)) continue;
    const s = podiumSpot(course, r.place);
    // (From wherever it coasted to past the line, just short of the podium, it hops up.)
    r.pod ??= { x: r.x, y: r.y };
    // (The podium stands level on the ground at its middle, so every block's top is measured from there.)
    const top = groundAt(map, course.finish + PODIUM.x) - s.h;
    const k = Math.max(0, Math.min(1, (R.t - 0.8 - (3 - r.place) * 0.35) / PODIUM.hop));
    const e = k * k * (3 - 2 * k);
    r.x = r.pod.x + (s.x - r.pod.x) * e;
    r.y = r.pod.y + (top - r.pod.y) * e - Math.sin(Math.PI * k) * 26;
    // (A plain jump up, standing tall: not its flying style, which for a great flyer is a whole loop.)
    const air = k > 0 && k < 1;
    Object.assign(r.m, { mode: 'run', speed: 0, noShadow: air, inWater: false, dir: 1, tired: 0, rest: false });
    if (k >= 1 && !r.podCheer) {
      r.podCheer = true;
      r.m.action = { name: 'podium_cheer', t0: null, hold: 30 };
    }
  }
}

// ---------- The camera ----------
// Where the race camera looks (`R.cam`: render/scene.js eases to it, or cuts straight there when
// `cut` changes), by what's happening: the opening sweep from the finish back to the start; along
// the line-up as each card shows; the start for the countdown; then running with your Mochi, a
// little ahead of it the faster it goes; between it and a rival when they're neck and neck; at the
// line as the first comes in (and as yours does); and at the podium.
const CUT_SHOTS = new Set(['sweep', 'finish', 'podium']);
function shotOf(world, R) {
  const map = world.map;
  const course = map.race;
  const you = R.racers[R.me];
  const g = (x) => groundAt(map, x);
  if (R.phase === 'ready') {
    if (R.t < INTRO.sweep) {
      const k = R.t / INTRO.sweep;
      const e = k * k * (3 - 2 * k);
      const x = course.finish + 160 + (course.start + 80 - course.finish - 160) * e;
      return { shot: 'sweep', x, y: g(x) };
    }
    const i = Math.floor((R.t - INTRO.sweep) / INTRO.card);
    const r = R.racers[Math.min(R.racers.length - 1, i)];
    if (i < R.racers.length) return { shot: 'line', x: course.start + lineupOffset(R, r) + 40, y: r.y };
    return { shot: 'line', x: course.start + 70, y: g(course.start) };
  }
  if (R.phase === 'done') {
    const x = course.finish + PODIUM.x;
    return { shot: 'podium', x, y: g(x) - 8 };
  }
  const last = course.legs.length - 1;
  const coming = (r) => r.done == null && r.leg === last && course.finish - r.x < 200;
  if (R.slowLeft > 0 || (coming(you) && R.clock > 2)) return { shot: 'finish', x: course.finish + 30, y: g(course.finish) };
  const ahead = Math.min(80, (you.m.speed ?? 0) * 0.45);
  if (you.done == null) {
    const p = progressOf(course, you);
    const rival = R.racers.find((r) => r !== you && r.done == null && Math.abs(progressOf(course, r) - p) < 22);
    if (rival) return { shot: 'duel', x: (you.x + rival.x) / 2 + ahead * 0.5, y: (you.y + rival.y) / 2 };
  }
  return { shot: 'follow', x: you.x + ahead, y: you.y };
}
function aimCamera(world, R) {
  const s = shotOf(world, R);
  if (s.shot !== R.shot && (CUT_SHOTS.has(s.shot) || CUT_SHOTS.has(R.shot))) R.cut = (R.cut ?? 0) + 1;
  R.shot = s.shot;
  R.cam = { x: s.x, y: s.y, cut: R.cut ?? 0 };
}

// ---------- A friend's party race ----------
// The ways a racer moves, as the host sends them.
const MODES = ['run', 'swim', 'climb', 'fly'];
const SEND_EVERY = 0.12;
// The host gone quiet this long: the race ends where it stands.
const HOST_QUIET = 6;
// The network side (net/mochi-race.js) plugs in here: { state, end, cheer }.
let raceNet = {};
export const setRaceNet = (fns) => {
  raceNet = fns;
};
// Where everyone is now, as the host sends it: [x, y, mode, speed, tiredness, resting, cheer left,
// done, place, leg] each.
export const raceState = (R) => R.racers.map((r) => [Math.round(r.x * 10) / 10, Math.round(r.y * 10) / 10, MODES.indexOf(r.m.mode), Math.round(r.m.speed ?? 0), Math.round((r.m.tired ?? 0) * 100), r.m.rest ? 1 : 0, Math.max(0, Math.round((r.cheerUntil - R.clock) * 10)), r.done, r.place, r.leg]);
// A friend's game: the host's latest word on where everyone is.
export function applyRaceState(world, msg) {
  const R = world.race;
  if (!R?.remote || R.remote !== msg.id) return;
  R.heard = Date.now() / 1000;
  if (R.phase !== 'done' && msg.phase !== 'done' && msg.phase !== R.phase) Object.assign(R, { phase: msg.phase, t: msg.pt ?? 0 });
  if (R.phase !== 'done') R.clock = msg.clock;
  msg.rs.forEach(([x, y, mode, speed, tired, rest, cheerLeft, done, place, leg], i) => {
    const r = R.racers[i];
    if (!r) return;
    const mv = MODES[mode] ?? 'run';
    Object.assign(r, { tx: x, ty: y, leg, cheerUntil: R.clock + cheerLeft / 10 });
    if (R.phase !== 'done') Object.assign(r, { done, place });
    Object.assign(r.m, { mode: mv, speed, tired: tired / 100, rest: Boolean(rest), inWater: mv === 'swim', noShadow: mv === 'fly' });
  });
}
// A friend's game, each frame: the racers eased along to where the host last had them; Up cheers
// (sent to the host); once it's over, Up takes you back.
function tickRemote(world, R, dt, up, you) {
  R.t += dt;
  if (R.phase === 'run') R.clock += dt;
  if (up && R.phase === 'run' && you.done == null && R.clock >= (you.cheerReady ?? 0)) {
    you.cheerReady = R.clock + CHEER.every;
    raceNet.cheer?.(world, R);
  }
  const k = 1 - Math.exp(-dt * 12);
  const map = world.map;
  for (const r of R.racers) {
    if (r.tx == null) continue;
    const [px, py] = [r.x, r.y];
    r.x += (r.tx - r.x) * k;
    // (On the ground, or in the water, exactly where it is now, never a step behind it in the air;
    // up a wall or in a glide, eased along with it.)
    const mode = r.m.mode;
    if (mode === 'run' && map.race?.legs[r.leg]?.kind === 'run') r.y = groundAt(map, r.x);
    else if (mode === 'swim') r.y = waterAt(map, r.x) ?? r.ty;
    else r.y = Math.min(groundAt(map, r.x), r.y + (r.ty - r.y) * k);
    r.m.dist += Math.hypot(r.x - px, r.y - py);
    r.m.dir = 1;
  }
  if (R.phase !== 'done' && Date.now() / 1000 - R.heard > HOST_QUIET) {
    // (Lost touch with the host: it ends here, nobody's prize.)
    Object.assign(R, { phase: 'done', t: 0, lost: true });
    for (const r of standings(R, world.map.race)) if (!r.place) r.place = ++R.finished;
    R.results = standings(R, world.map.race);
    world.log('Lost touch with the race...', '#ffb3c6');
  }
  if (R.phase === 'done') podiumStep(world, R);
  if (R.phase === 'done' && up && podiumUp(world, R)) return;
  aimCamera(world, R);
}
// A friend's game: the host's race is over; where everyone came, and your own Mochi's prize.
export function applyRaceEnd(world, msg) {
  const R = world.race;
  if (!R?.remote || R.remote !== msg.id || R.phase === 'done') return;
  msg.places.forEach(([place, done], i) => {
    if (R.racers[i]) Object.assign(R.racers[i], { place, done });
  });
  Object.assign(R, { phase: 'done', t: 0, finished: R.racers.length });
  R.results = standings(R, world.map.race);
  award(world, R);
}
// The host's game: a friend cheered their Mochi on.
export function applyCheer(world, ownerId) {
  const R = world.race;
  const r = R && !R.remote ? R.racers.find((x) => x.owner === ownerId) : null;
  return r ? cheer(R, r) : false;
}

// Where everyone is now: the ones home in the order they finished, then the rest by how far along.
export function standings(R, course) {
  const p = (r) => progressOf(course, r);
  return [...R.racers].sort((a, b) => (a.place && b.place ? a.place - b.place : a.place ? -1 : b.place ? 1 : p(b) - p(a)));
}

// The race is over: the ones still out are placed by how far they got; the prize; a medal for your
// Mochi if it came in the top three (kept if it's its best there); a win opens the next rank (and the
// first Master win on each stage brings a Star Egg); your Mochi is happier for the race (a win most
// of all) and a little closer to you.
function endOfRace(world, R) {
  Object.assign(R, { phase: 'done', t: 0 });
  for (const r of standings(R, world.map.race)) if (!r.place) r.place = ++R.finished;
  R.results = standings(R, world.map.race);
  award(world, R);
  if (R.party?.length) raceNet.end?.(world, R);
}
function award(world, R) {
  const you = R.racers[R.me];
  R.prize = you.done != null ? prizeOf(R.stageId, R.rank, you.place) : 0;
  world.char.gold += R.prize;
  const key = medalKey(R.stageId, R.rank);
  const medal = you.done != null ? MEDALS[you.place - 1] ?? null : null;
  if (medal) {
    you.rec.medals ??= {};
    const had = you.rec.medals[key];
    if (!had || MEDALS.indexOf(medal) < MEDALS.indexOf(had)) you.rec.medals[key] = medal;
    R.medal = { medal, best: !had || MEDALS.indexOf(medal) < MEDALS.indexOf(had) };
  }
  // (What a win opens: the next rank here, and the Grand course once enough Beginner races are won.)
  if (you.place === 1 && you.done != null) {
    const char = world.char;
    const before = Object.keys(RACE_STAGES).flatMap((id) => RANK_ORDER.filter((rk) => rankOpen(char, id, rk)).map((rk) => medalKey(id, rk)));
    char.raceWins ??= {};
    // (A first Beginner win on a stage: its costume, data/mochi-dress.js.)
    const dress = dressFor(R.stageId);
    if (R.rank === 'beginner' && dress && !char.raceWins[key]) {
      R.dressWon = DRESS[dress].name;
      world.log(`A costume for your Mochi: the ${R.dressWon}! (Dress them up from their page.)`, '#ffc2d4');
    }
    if (R.rank === 'master' && !char.raceWins[key]) {
      addItem(char.inventory, 'mochi_egg_star', 1);
      R.starEgg = true;
      world.log('A Star Egg for your first Master win here! Take it to your Garden.', '#ffe08a');
    }
    char.raceWins[key] = true;
    R.opened = Object.keys(RACE_STAGES).flatMap((id) => RANK_ORDER.filter((rk) => rankOpen(char, id, rk) && !before.includes(medalKey(id, rk))).map((rk) => `${RACE_STAGES[id].name} (${RACE_RANKS[rk].name})`));
  }
  you.rec.mood = Math.min(100, (you.rec.mood ?? 60) + (you.place === 1 ? 15 : 8));
  you.rec.bond = Math.min(1000, (you.rec.bond ?? 0) + 4);
  const nth = ['1st', '2nd', '3rd', '4th', '5th', '6th'][you.place - 1];
  world.log(you.place === 1 ? `Your Mochi won! +${R.prize} gold.` : you.done != null ? `Your Mochi came ${nth}. +${R.prize} gold.` : 'Your Mochi didn\'t make it home in time... it had fun anyway!', '#ffc2d4');
}

// Back to the stadium, by the board (a friend who came to your race: back where they were).
export function leaveRace(world) {
  if (!world.race || world.race.phase !== 'done') return false;
  const back = world.race.back;
  world.race = null;
  if (back && MAPS[back.map] && !MAPS[back.map].race) {
    loadMap(world, back.map, 'start');
    Object.assign(world.body, { x: Math.max(20, Math.min(world.map.width - 20, back.x)), y: groundAt(world.map, back.x) });
  } else loadMap(world, 'mochi_stadium', 'board');
  return true;
}
