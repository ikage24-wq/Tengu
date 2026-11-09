// A Mochi race (docs/design/mochi.md step 5; the stages and ranks in data/mochi-race.js). From the
// Race Stadium's board you send one of your Mochi to a stage; the race plays on that stage's own
// course, your Mochi against five rivals, and you watch from the finish line with the crowd while
// the camera runs alongside your Mochi. Cheering (Up, or the Cheer button) gives it a burst of speed
// that costs it some of its stamina, so cheering all the way tires it out before the end.
//
// A course is a row of legs (world/stadium.js `race.legs`): along the ground, across water, up a
// climbing wall, and off an edge in a glide. Each racer goes on its own stats: Run points set its
// running speed (and its running style, so a baby who can't walk yet scoots), Swim its swimming (one
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
import { groundAt } from './physics.js';
import { addItem } from '../core/inventory.js';
import { loadMap } from './world.js';

// Its styles' speeds (render/mochi-anim.js GAITS, SWIMS, CLIMBS, FLIES); between two styles, its
// speed climbs with its points. One who can't yet: scoots, flails, drops.
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
// The lanes: each one back sits this much higher up the screen (only a touch: the ground is an edge,
// not a field, so more and the back ones would float).
export const LANE_RISE = 1;
// The countdown before Go; and how long the results show before Up can take you back.
export const COUNTDOWN = 3;
const LEAVE_AFTER = 3;

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
  // You watch from the finish, by the crowd, facing the runners.
  const at = course.finish + 300;
  Object.assign(world.body, { x: at, y: groundAt(world.map, at), vx: 0, vy: 0, facing: -1 });
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
  r.y = r.glide.y0 + r.glide.slope * (r.x - r.glide.x0);
  Object.assign(r.m, { mode: 'fly', inWater: false, speed: v, tired: 0, noShadow: true });
  const ground = groundAt(map, r.x);
  if (r.y >= ground) {
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
      const v = run * pace * wob * (1 - TIRED_SLOW * f) * boost;
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
    if (R.t >= COUNTDOWN) Object.assign(R, { phase: 'run', t: 0 });
  } else if (R.phase === 'run') {
    R.clock += dt;
    if (up) cheer(R, you);
    for (const r of R.racers) stepRacer(R, r, dt, course, world.map);
    const last = course.legs.length - 1;
    for (const r of R.racers) {
      if (r.done != null || r.leg < last || r.x < course.finish) continue;
      r.done = R.clock;
      r.place = ++R.finished;
      R.first ??= R.clock;
    }
    if (R.finished === R.racers.length || (R.first != null && R.clock >= R.first + RACE_TAIL) || R.clock >= RACE_MAX) endOfRace(world, R);
  } else {
    for (const r of R.racers) stepRacer(R, r, dt, course, world.map);
    // (Not straight away: someone still cheering as it ends shouldn't skip the results.)
    if (up && R.t > LEAVE_AFTER) {
      leaveRace(world);
      return;
    }
  }
  // (Hosting a party race: where everyone is, to the friends, a few times a second; and a little
  // while after the end, so they see the racers come to a stop.)
  R.sendIn -= dt;
  if (R.party?.length && R.sendIn <= 0 && (R.phase !== 'done' || R.t < 4)) {
    R.sendIn = SEND_EVERY;
    raceNet.state?.(world, R);
  }
  R.cam = { x: you.x, y: you.y };
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
  for (const r of R.racers) {
    if (r.tx == null) continue;
    const [px, py] = [r.x, r.y];
    r.x += (r.tx - r.x) * k;
    r.y += (r.ty - r.y) * k;
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
  if (R.phase === 'done' && up && R.t > LEAVE_AFTER) {
    leaveRace(world);
    return;
  }
  R.cam = { x: you.x, y: you.y };
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
