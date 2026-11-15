// The Mochi Show, run (data/mochi-show.js has its rules, render/show.js draws it, ui/mochi-show.js
// enters it from the show tent on the Mochi Market's terrace).
//
// The hall: one room the size of the screen - the stage across it, the curtain's wings either side,
// the judges' table down at the front and the audience in the dark below. You watch from the wings.
// A show: the curtain goes up and the judges are introduced; then each of the four Mochi in turn
// walks out from the left wing the way it walks (a shy one in quick little steps, a bouncy one
// skipping), stops in the spotlight, strikes its pose (its personality's own move), shows its best
// trick, bows, and the judges hold up their cards one by one; then it walks off into the right wing.
// After the last, they all come back out and line up, the ribbons go to third, second and first,
// and the winner jumps for joy under the confetti. Up takes you back out to the tent.
//
//   world.show = { rank, seed, phase ('intro' | 'turn' | 'results' | 'done'), t, turn, step, st,
//     cast: [{ rec, name, you, cards, total, place, x, on, m }], order, back }

import { MAPS } from '../data/maps.js';
import { SHOW_RANKS, SHOW_ORDER, showOpen, showRivals, cardsFor, showPrize, actOf, actTier, talentScore, ACT_LEN } from '../data/mochi-show.js';
import { loadMap } from './world.js';
import { groundAt } from './physics.js';
import { learn } from './mochi-brain.js';
import { seededRandom } from '../data/mochi-genes.js';

export const FLOOR = 262;
// The stage: where they come on, the spotlight, where they go off, and the results' line-up.
export const STAGE = { left: 160, mid: 320, right: 480, wing: 600, line: [254, 298, 342, 386] };
// The camera never looks outside the hall's box (render/show.js draws the hall for it): its widest
// shot shows exactly the box - the stage, the curtains framing it either side, the judges and the
// audience down in front.
export const SHOW_CAM = { zoom: 1.7, x: 320, y: 210 };
export const HALL = { x0: 320 - 320 / 1.7, x1: 320 + 320 / 1.7, y0: 210 - 180 / 1.7, y1: 210 + 180 / 1.7 };
// The shots, like a show on TV: `wide` the whole hall; `judges` their table, and the stage behind
// it; `follow` alongside whoever's walking on; `close` on them in the spotlight; `cards` the judges'
// cards going up and the Mochi waiting on them; `line` the line-up at the end.
const SHOTS = {
  wide: SHOW_CAM,
  judges: { zoom: 2.6, x: 255, y: 247 },
  follow: { zoom: 2.4, y: FLOOR - 19 },
  close: { zoom: 3.8, y: FLOOR - 20 },
  cards: { zoom: 2.4, x: 266, y: 250 },
  line: { zoom: 2.6, x: 320, y: FLOOR - 18 },
};
// The shot to be on now (render/scene.js eases the camera onto it): where it looks and how close.
export function showShot(S) {
  if (!S || S.phase === 'intro') return S && S.t >= 1.3 ? SHOTS.judges : SHOTS.wide;
  if (S.phase === 'turn') {
    const c = S.cast[S.order[S.turn]];
    if (S.step === 'in') return { ...SHOTS.follow, x: c.x + 24 };
    if (S.step === 'cards') return SHOTS.cards;
    if (S.step === 'out') return { ...SHOTS.follow, x: c.x };
    return { ...SHOTS.close, x: c.x };
  }
  return SHOTS.line;
}
// How long each part of a turn takes (s), and when each judge's card goes up in the cards' part.
export const TURN = { pose: 2.1, talent: 2.5, bow: 1.0, cards: 2.3 };
export const CARD_AT = [0.2, 0.6, 1.0];
export const INTRO = 4.4;
export const RESULTS = { lineup: 2.4, ribbon: 1.3, cheer: 3.6 };
const resultsLen = () => RESULTS.lineup + RESULTS.ribbon * 3 + RESULTS.cheer;

function showHall() {
  return {
    id: 'mochi_show', name: 'The Mochi Show', theme: 'town', isTown: true, private: true, indoor: true, mochiShow: true,
    width: 640, height: 360, groundY: FLOOR,
    // (Its own room: render/show.js paints the hall behind the stage, 'course:showhall'.)
    // (Its own floor too - the stage's boards - and a ceiling the camera never looks up at.)
    look: { sky: ['#2c1c3a', '#4a2a4c', '#6a3a58'], skyline: 'course:showhall', light: 'showhall', painted: null, ceiling: 'curtain', floor: 'painted', clouds: false, material: 'parquet', edges: null, islands: 'planks', propKeep: 1, critters: [], drift: null },
    cottages: [], terrain: [[0, FLOOR], [640, FLOOR]], platforms: [], ropes: [], water: [], nodes: [],
    zonesBy: 'x', zones: [{ name: 'The Mochi Show', from: 0, color: '#ff9ec0' }],
    townPieces: [],
    portals: [{ id: 'start', x: STAGE.wing, y: FLOOR, hidden: true }],
    lamps: [], npcs: [], spawns: [], deco: [],
  };
}
MAPS.mochi_show = showHall();

// How each walks on (render/mochi-anim.js gaits): the timid in quick little steps, the bouncy
// skipping, everyone else a steady stroll.
const WADDLE = new Set(['timid', 'shy', 'sleepy', 'lazy', 'clumsy', 'loner']);
const SKIP = new Set(['playful', 'bubbly', 'cheeky', 'sweet', 'hyper', 'mischief', 'clingy', 'showoff', 'dramatic', 'chatty']);
const walkOf = (rec) => (WADDLE.has(rec.personality) ? [0, 58] : SKIP.has(rec.personality) ? [1, 84] : [2, 76]);
// Its best trick to show: the showiest it knows.
const SHOWY = ['backflip', 'twirl', 'chestbeat', 'boxing', 'flaps', 'shuffle', 'hops', 'roll', 'clap', 'fire', 'sumo', 'hum', 'wave', 'situps', 'meditate', 'brr', 'plop', 'sneeze', 'peek', 'sprout', 'paddle'];
const trickOf = (rec) => SHOWY.find((t) => rec.tricks?.includes(t)) ?? null;

// Sends your Mochi `rec` into the show at `rank`. False if it can't go.
export function startShow(world, rec, rank = 'beginner') {
  if (!SHOW_RANKS[rank] || !showOpen(world.char, rank) || world.show || world.race || world.dungeon || world.scene || !rec || rec.stage === 'egg') return false;
  const hour = Math.floor(Date.now() / 3.6e6);
  const seed = hour * 3 + SHOW_ORDER.indexOf(rank);
  const field = [{ rec, name: rec.name ?? 'Your Mochi', you: true }, ...showRivals(rank, hour)];
  const cast = field.map((f) => {
    const cards = cardsFor(f.rec, seed);
    // (Its act - picked in the window for yours, its own best for a rival - and how well it does it.)
    const act = actOf(f.rec);
    const tier = act === 'trick' ? null : actTier(talentScore(f.rec, act));
    return { ...f, you: Boolean(f.you), cards, total: cards.reduce((a, b) => a + b, 0), place: 0, x: STAGE.left - 40, on: false, act, tier,
      // (`anchors`: where its mouth and its props' business ends are, for the stage's sparkle; no
      // idle moments of its own between its beats - it's on.)
      m: { genes: f.rec, dir: 1, speed: 0, dist: 0, size: f.rec.stage === 'mochiko' ? 'baby' : 'grown', mode: 'run', tired: 0, rest: false, noIdle: true, anchors: {} } };
  });
  // (Places by the cards: the total, then Style, then Charm; a dead heat goes to whoever went on first.)
  // (Yours goes on second or third, after a rival has shown how it's done.)
  const rng = seededRandom(seed * 13 + 7);
  const rivals = [1, 2, 3].sort(() => rng() - 0.5);
  const at = rng() < 0.5 ? 1 : 2;
  const order = [...rivals];
  order.splice(at, 0, 0);
  const ranked = [...cast].sort((a, b) => b.total - a.total || b.cards[0] - a.cards[0] || b.cards[1] - a.cards[1] || order.indexOf(cast.indexOf(a)) - order.indexOf(cast.indexOf(b)));
  ranked.forEach((c, i) => (c.place = i + 1));
  world.show = { rank, seed, phase: 'intro', t: 0, turn: -1, step: null, st: 0, cast, order, back: { map: world.map.id, x: world.body.x }, prize: 0 };
  loadMap(world, 'mochi_show', 'start');
  // (You watch from the right wing, by the curtain.)
  Object.assign(world.body, { x: STAGE.wing, y: groundAt(world.map, STAGE.wing), vx: 0, vy: 0, facing: -1 });
  world.mochi = null;
  world.log(`The Mochi Show (${SHOW_RANKS[rank].name}): the curtain goes up!`, '#ffc2d4');
  return true;
}

function nextTurn(S) {
  S.turn += 1;
  if (S.turn >= S.order.length) {
    Object.assign(S, { phase: 'results', t: 0, step: null });
    // (Back out onto the stage, all together, into the line-up: in the order they went on.)
    S.order.forEach((ci, k) => {
      const c = S.cast[ci];
      Object.assign(c, { on: true, x: k < 2 ? STAGE.left - 30 - k * 24 : STAGE.right + 30 + (3 - k) * 24, goal: STAGE.line[k] });
    });
    return;
  }
  Object.assign(S, { phase: 'turn', step: 'in', st: 0 });
  const c = S.cast[S.order[S.turn]];
  Object.assign(c, { on: true, x: STAGE.left - 30 });
}

// Walks `c` toward `goal` at its own pace; true once it's there.
function walk(c, goal, dt, pace = 1) {
  const [tier, v0] = walkOf(c.rec);
  const v = v0 * pace;
  const d = goal - c.x;
  c.m.tier = tier;
  c.m.dir = Math.sign(d) || c.m.dir;
  if (Math.abs(d) <= v * dt) {
    c.x = goal;
    c.m.speed = 0;
    c.m.tier = null;
    return true;
  }
  c.x += Math.sign(d) * v * dt;
  c.m.dist += v * dt;
  c.m.speed = v;
  return false;
}

export function tickShow(world, dt, input) {
  const S = world.show;
  if (!S) return;
  S.t += dt;
  S.st += dt;
  const up = Boolean(input?.pressed?.has('ArrowUp') || input?.pressed?.has('Space'));
  // (Up while it's on: straight on to the results - for a show you've seen before.)
  if (up && (S.phase === 'intro' || S.phase === 'turn')) {
    for (const c of S.cast) Object.assign(c, { on: false, m: { ...c.m, action: null, speed: 0 } });
    S.turn = S.order.length - 1;
    nextTurn(S);
    return;
  }
  if (S.phase === 'intro' && S.t >= INTRO) nextTurn(S);
  else if (S.phase === 'turn') {
    const c = S.cast[S.order[S.turn]];
    const go = (step) => Object.assign(S, { step, st: 0 });
    if (S.step === 'in' && walk(c, STAGE.mid, dt)) {
      c.m.dir = 1;
      c.m.action = { name: `sig_${c.rec.personality}`, t0: null };
      go('pose');
    } else if (S.step === 'pose' && S.st >= TURN.pose) {
      // Its act: its best trick (or, knowing none, a big shy wave), or its own turn, done as well as
      // it can (render/mochi-show-acts.js `${act}${tier}`).
      if (c.act === 'trick') {
        const trick = trickOf(c.rec);
        c.m.action = { name: trick ?? 'showwave', t0: null, hold: TURN.talent };
        c.trick = trick;
        c.talentLen = TURN.talent;
      } else {
        c.m.action = { name: `${c.act}${c.tier}`, t0: null };
        c.talentLen = ACT_LEN[c.tier] + 0.1;
      }
      go('talent');
    } else if (S.step === 'talent' && S.st >= (c.talentLen ?? TURN.talent)) {
      c.m.action = { name: 'bow', t0: null };
      go('bow');
    } else if (S.step === 'bow' && S.st >= TURN.bow) {
      c.m.action = { name: 'showwait', t0: null, hold: TURN.cards };
      go('cards');
    } else if (S.step === 'cards' && S.st >= TURN.cards) {
      // (A good score, and it's pleased with itself on the way off.)
      c.m.action = { name: c.total >= 20 ? 'cheer' : 'wave', t0: null, hold: 0.8 };
      go('out');
    } else if (S.step === 'out' && S.st > 0.6) {
      c.m.action = null;
      if (walk(c, STAGE.right + 40, dt, 1.4)) {
        c.on = false;
        nextTurn(S);
      }
    }
  } else if (S.phase === 'results') {
    let lined = true;
    for (const c of S.cast) {
      if (c.goal == null) continue;
      if (!walk(c, c.goal, dt)) lined = false;
      else c.m.dir = 1;
    }
    // (Facing out at the audience once they're all in line: the hall faces us.)
    if (lined && S.t >= RESULTS.lineup) {
      for (const c of S.cast) {
        const k = 3 - c.place;
        const at = RESULTS.lineup + RESULTS.ribbon * Math.max(0, k);
        if (c.place <= 3 && S.t >= at && !c.ribboned) {
          c.ribboned = true;
          c.m.action = { name: c.place === 1 ? 'race_joy' : 'cheer', t0: null, hold: c.place === 1 ? 4 : 1.6 };
        }
        if (c.place === 4 && S.t >= RESULTS.lineup + RESULTS.ribbon * 3 && !c.ribboned) {
          c.ribboned = true;
          c.m.action = { name: 'clap', t0: null, hold: 2 };
        }
      }
    }
    if (S.t >= resultsLen()) {
      Object.assign(S, { phase: 'done', t: 0 });
      award(world, S);
    }
  } else if (S.phase === 'done' && (up || S.t > 25)) leaveShow(world);
}

function award(world, S) {
  const you = S.cast.find((c) => c.you);
  S.prize = showPrize(S.rank, you.place);
  world.char.gold += S.prize;
  const rec = you.rec;
  if (you.place <= 3) {
    const ribbon = ['gold', 'silver', 'bronze'][you.place - 1];
    rec.ribbons ??= {};
    const had = rec.ribbons[S.rank];
    const order = ['gold', 'silver', 'bronze'];
    if (!had || order.indexOf(ribbon) < order.indexOf(had)) rec.ribbons[S.rank] = ribbon;
  }
  if (you.place === 1) {
    const char = world.char;
    const first = !char.showWins?.[S.rank];
    char.showWins ??= {};
    char.showWins[S.rank] = true;
    const next = SHOW_ORDER[SHOW_ORDER.indexOf(S.rank) + 1];
    if (first && next) S.opened = SHOW_RANKS[next].name;
  }
  // (A turn on the stage brings it out of its shell: a little closer to you, happier, and keener on company.)
  rec.mood = Math.min(100, (rec.mood ?? 60) + (you.place === 1 ? 15 : 8));
  rec.bond = Math.min(1000, (rec.bond ?? 0) + 5);
  learn(rec, 'social', you.place === 1 ? 2 : 1.5, 0.12);
  const nth = ['1st', '2nd', '3rd', '4th'][you.place - 1];
  world.log(you.place === 1 ? `${you.name} won the show! +${S.prize} gold.` : `${you.name} came ${nth}. +${S.prize} gold.`, '#ffc2d4');
  if (S.opened) world.log(`The ${S.opened} show is open to you now.`, '#ffe08a');
}

// Back out to the show tent.
export function leaveShow(world) {
  const S = world.show;
  if (!S || S.phase !== 'done') return false;
  world.show = null;
  const back = MAPS[S.back.map] && !MAPS[S.back.map].mochiShow ? S.back : { map: 'mochi_market', x: 1525 };
  loadMap(world, back.map, 'start');
  Object.assign(world.body, { x: back.x, y: groundAt(world.map, back.x), vx: 0, vy: 0 });
  return true;
}

// Up by the show tent (the Mochi Market's terrace: `map.showTent`): its window (ui/mochi-show.js).
export function showTentUp(world) {
  const at = world.map.showTent;
  if (at == null || world.gardenVisit || !world.char.garden || Math.abs(world.body.x - at) > 46) return false;
  world.events.push({ type: 'show' });
  return true;
}
