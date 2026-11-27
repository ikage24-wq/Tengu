// What makes each room of the Star Observatory its own (docs/design/star-observatory.md; the map
// fields are described in data/maps.js), and its three boss fights. world/dungeon.js calls in here;
// the drawing is in render/observatory.js.
//
//   The Starlit Stair     meteor showers fall on the floors now and then; light the three star lamps.
//   The Constellation Hall  the puzzle: five star lamps joined in a constellation; using one flips
//                         it and the lamps joined to it. Light all five.
//   The Weightless Reading Room  low gravity: long, floaty jumps between far-apart shelves.
//   The Archive           Folio (remade 2026-11-27): the Great Catalogue on the tank, toppling stacks
//                         with one Reading Nook, Noted ink marks, Top Shelf / Bottom Shelf, her Raven
//                         Scribes; at a third, Closing Time.
//   The Orrery            the Eclipse Twins (remade 2026-11-27): a sun girl and a moon girl who move as
//                         a pair: Opposition from the two ends of the hall, Conjunction in the middle,
//                         Crossing past each other; one alone fights on for both.
//   The Telescope Crown   Astraea (remade 2026-11-27): Counting (Tally on the tank, Head Count, Catch a
//                         Falling Star, A Thousand Lights); at two thirds, Star Charts (the Little Mochi
//                         drawn across the hall: stand on a star), Carry the One, Recount; at a third,
//                         Let Them Fall (counted waves of falling stars, the Little Boat, The Last Count,
//                         quicker every time round). Elder Goma counts with her from a gantry by the
//                         telescope (render/observatory.js).

import { addZone, adds, callout } from './dungeon.js';
import { runRotation, raidwide, buster, stack, spread, out, donut, cleave, tankOf, healerOf, dpsOf } from './bossfight.js';
import { navOf, surfaceBelow } from './nav.js';
import { GRAVITY } from './physics.js';
import { playScene } from './story.js';
import { radio } from './hollow.js';

export const OBS_MECHS = new Set(['folio', 'eclipse', 'astraea']);
export const OBS_CHANNEL = { starlamp: 0.8, starlamp1: 1 };

const pick = (list) => list[Math.floor(Math.random() * list.length)];
const floorY = (world, body) => {
  const nav = navOf(world.map);
  return nav.surfaces[Math.max(0, surfaceBelow(nav, body.x, body.y))].y;
};

// ---------- The constellation puzzle ----------

// Which lamps a press flips: itself and its neighbours in the constellation.
const flipsOf = (map, i) => [i, ...(map.constellation ?? []).filter(([a, b]) => a === i || b === i).map(([a, b]) => (a === i ? b : a))];
// The fewest presses that light every lamp from here (lamp ids), found by trying every set.
function solveLamps(map, lamps) {
  const n = lamps.length;
  let best = null;
  for (let mask = 0; mask < 1 << n; mask++) {
    const lit = lamps.map((o) => o.lit);
    for (let i = 0; i < n; i++) if (mask & (1 << i)) for (const j of flipsOf(map, i)) lit[j] = !lit[j];
    if (!lit.every(Boolean)) continue;
    const presses = lamps.filter((_, i) => mask & (1 << i)).map((o) => o.id);
    if (!best || presses.length < best.length) best = presses;
  }
  return new Set(best ?? []);
}

// ---------- Rooms ----------

export function obsSetup(world, room) {
  const map = world.map;
  if (map.dungeon !== 'observatory') return;
  room.meteorIn = map.meteors ? map.meteors.every * 0.5 : null;
  const lamps = room.objects.filter((o) => o.kind === 'starlamp');
  if (lamps.length) {
    // Start from every lamp lit and scramble it with two to four presses, so it can always be solved.
    lamps.forEach((o) => (o.lit = true));
    const order = lamps.map((_, i) => i).sort(() => Math.random() - 0.5).slice(0, 2 + Math.floor(Math.random() * 3));
    for (const i of order) for (const j of flipsOf(map, i)) lamps[j].lit = !lamps[j].lit;
    if (lamps.every((o) => o.lit)) for (const j of flipsOf(map, 0)) lamps[j].lit = !lamps[j].lit;
    room.lamps = { press: solveLamps(map, lamps) };
  }
  // (The Orrery's old sunlit and shadowed halves went with the twins' old fight, 2026-11-27.)
  room.eclipse = null;
  room.lowG = map.lowGravity ?? 0;
}

// Using a star lamp: it and its neighbours flip; once all five shine they lock in. Returns whether
// the hall is solved.
export function pressLamp(world, o) {
  const room = world.dungeon.room;
  const lamps = room.objects.filter((x) => x.kind === 'starlamp');
  const i = lamps.indexOf(o);
  for (const j of flipsOf(world.map, i)) lamps[j].lit = !lamps[j].lit;
  o.pressedAt = world.now;
  o.progress = 0;
  const solved = lamps.every((x) => x.lit);
  if (solved) {
    for (const x of lamps) x.done = true;
    callout(world, 'The constellation shines!', 'The stair to the next floor unfolds');
  }
  room.lamps.press = solveLamps(world.map, lamps);
  return solved;
}
// Lamps lit, for the room's task.
export const lampsLit = (room) => room.objects.filter((o) => o.kind === 'starlamp' && o.lit).length;

export function tickObs(world, dt, group, up) {
  const run = world.dungeon;
  const room = run?.room;
  const map = world.map;
  if (map.dungeon !== 'observatory' || !room) return;
  // Meteor showers on the stair: a few marked spots on whoever's floors.
  if (room.meteorIn != null && up.length) {
    room.meteorIn -= dt;
    if (room.meteorIn <= 0) {
      room.meteorIn = map.meteors.every;
      for (const g of [...up].sort(() => Math.random() - 0.5).slice(0, 2)) addZone(world, { kind: 'circle', x: g.body.x + (Math.random() - 0.5) * 60, y: floorY(world, g.body), w: 60, warn: 1.6, damage: map.meteors.damage, meteor: true });
      callout(world, 'Meteor shower!', 'Watch for the marks');
    }
  }
  // Low gravity: whoever is in the air falls slower (the Weightless Reading Room).
  const lowG = room.lowG ?? 0;
  if (lowG) for (const g of up) if (!g.body.onGround && !g.body.rope) g.body.vy -= GRAVITY * lowG * dt;
  // Folio's bookcases slide back once she's out of the fight (a wipe sets the room back).
  if (room.walls && !world.mobs.some((m) => m.def.mech === 'folio' && m.hp > 0 && m.engaged)) room.walls = null;
}

// ---------- The bosses ----------

// A share of a hit that reaches an observatory boss.
export function obsHitMul(world, m) {
  return 1;
}

export function obsBoss(world, m, up, dt) {
  if (m.def.mech === 'folio') return folio(world, m, up, dt);
  if (m.def.mech === 'eclipse') return eclipse(world, m, up, dt);
  if (m.def.mech === 'astraea') return astraea(world, m, up, dt);
  return false;
}

// ---------- The Archive: Folio, the Archivist (remade 2026-11-27) ----------
// A prim young snowy owl of a librarian (render/folio/) who keeps the star records with her Raven Scribes.
// One rotation per phase (world/bossfight.js), each cast on her cast bar, its telegraph drawn in her own
// look (render/folio/looks.js). Phases go by her health:
//   Quiet, Please (to 66%)  Hardback (the Great Catalogue slammed shut on the tank), Toppling Stacks (a row
//                         of bookcases rises the length of the hall and topples one after another: stand
//                         in the Reading Nook, the one gap in it, or up on a ledge), Riffle (the book
//                         flips through itself: a gust of pages over everyone), Noted (she writes down
//                         where each of you stands: the ink lands there, so move).
//   Top Shelf, Bottom Shelf (to 33%)  books fly along the top shelves (keep your feet on the floor) or
//                         skid along the floor (jump), read from the cast's name; then both, one after the
//                         other.
//   Closing Time (below 33%)  the stacks topple in from both ends toward the nook, Noted then Bottom
//                         Shelf (move off your mark, then jump), Speed Reading (two gusts); everything
//                         quicker.
// At 70% and 40% she calls her Raven Scribes (a cast of its own: two of them, after the healer).
// Her state for her rig: m.cast / m.castPose ('hardback', 'stacks', 'riffle', 'noted', 'top', 'bottom',
// 'scribes'), m.phaseAt (and m.mech.phase).
const FO = { hardback: 400, riffle: 150, shelf: 240, shelfW: 118, nook: 150, noted: 200, notedR: 30, top: 250, bottom: 250 };
// Toppling Stacks: bookcases the length of the hall, a gap (the Reading Nook) near the group; they topple
// one after another from the far wall (`both`: from both walls in toward the nook).
function stacks(world, m, up, dur, both) {
  const W = world.map.width;
  const mid = up.length ? up.reduce((t, g) => t + g.body.x, 0) / up.length : m.x;
  const gx = Math.max(220, Math.min(W - 220, mid + (Math.random() - 0.5) * 220));
  const gl = gx - FO.nook / 2;
  const gr = gx + FO.nook / 2;
  addZone(world, { kind: 'raid', x: gx, y: world.map.groundY, w: FO.nook, warn: dur + 0.9, damage: 0, tele: true, from: m, look: 'foNook' });
  const fromLeft = gx > W / 2;
  const cases = [];
  for (let x = gl; x > 0; x -= FO.shelfW) cases.push({ x: Math.max(0, x - FO.shelfW), w: Math.min(FO.shelfW, x), dir: 1 });
  for (let x = gr; x < W; x += FO.shelfW) cases.push({ x, w: Math.min(FO.shelfW, W - x), dir: -1 });
  cases.forEach((c, i) => {
    // (how soon it goes: from the far wall first, or from both walls in)
    const fromWall = c.dir > 0 ? c.x : W - (c.x + c.w);
    const order = both ? fromWall / FO.shelfW : fromLeft ? c.x / FO.shelfW : (W - c.x - c.w) / FO.shelfW;
    addZone(world, { kind: 'band', x: c.x, w: c.w, dir: c.dir, warn: dur + order * 0.08, damage: FO.shelf, from: m, look: 'foShelf', seed: i * 3 });
  });
}
// Noted: a mark of ink where each of you stands right now.
function noted(world, m, up, dur) {
  for (const g of up) addZone(world, { kind: 'circle', x: g.body.x, y: world.map.groundY, w: FO.notedR * 2, warn: dur, damage: FO.noted, from: m, noSprout: true, look: 'foNoted' });
}
const topShelf = (world, m, dur) => addZone(world, { kind: 'band', x: 0, w: world.map.width, dir: 1, high: true, warn: dur, damage: FO.top, from: m, look: 'foTop' });
const bottomShelf = (world, m, dur) => addZone(world, { kind: 'floor', x: 0, w: world.map.width, warn: dur, damage: FO.bottom, from: m, look: 'foBottom' });
const FO_HARDBACK = { gap: 2.4, look: 'foHardback', cast: 'Hardback', dur: 3, pose: 'hardback', sub: 'The Great Catalogue comes down on the tank: everyone else, step clear', run: (w, m, up) => buster(w, m, tankOf(up), FO.hardback, 3, 84) };
const FO_STACKS = { gap: 2.4, cast: 'Toppling Stacks', dur: 3, pose: 'stacks', sub: 'The bookcases topple down the hall: get into the Reading Nook, or up on a ledge!', run: (w, m, up) => stacks(w, m, up, 3, false) };
const FO_RIFFLE = { gap: 2.4, look: 'foRiffle', cast: 'Riffle', dur: 3, pose: 'riffle', sub: 'A gust of pages over everyone: healer, ready', run: (w, m) => raidwide(w, m, FO.riffle, 3) };
const FO_NOTED = { gap: 2.4, cast: 'Noted', dur: 2.8, pose: 'noted', sub: 'She writes down where you stand: the ink lands there, so move!', run: (w, m, up) => noted(w, m, up, 2.8) };
const FO_TOP = { gap: 2.4, cast: 'Top Shelf', dur: 2.8, pose: 'top', sub: 'Books along the top shelves: keep your feet on the floor!', run: (w, m) => topShelf(w, m, 2.8) };
const FO_BOTTOM = { gap: 2.4, cast: 'Bottom Shelf', dur: 2.8, pose: 'bottom', sub: 'Books skid along the floor: jump!', run: (w, m) => bottomShelf(w, m, 2.8) };
const FO_BOTH = { gap: 2.6, cast: 'Top Shelf, Bottom Shelf', dur: 4.2, pose: 'top', sub: 'Feet on the floor for the top shelf, then jump the bottom one!', run: (w, m) => { topShelf(w, m, 2.6); bottomShelf(w, m, 4.2); } };
const FO_QUIET = [FO_HARDBACK, FO_STACKS, FO_RIFFLE, FO_NOTED];
const FO_SHELVES = [FO_TOP, FO_HARDBACK, FO_NOTED, FO_BOTTOM, FO_STACKS, FO_RIFFLE, FO_BOTH];
const FO_CLOSING = [
  { ...FO_STACKS, cast: 'Closing Stacks', sub: 'The stacks topple in from both ends: into the Reading Nook!', run: (w, m, up) => stacks(w, m, up, 3, true) },
  { gap: 2.4, cast: 'Noted, Then Filed', dur: 4, pose: 'noted', sub: 'Move off your mark, then jump the books on the floor!', run: (w, m, up) => { noted(w, m, up, 2.4); bottomShelf(w, m, 4); } },
  FO_HARDBACK,
  { gap: 2.4, look: 'foRiffle', cast: 'Speed Reading', dur: 4.2, pose: 'riffle', sub: 'Two gusts of pages, one after the other: healer, ready!', run: (w, m) => { raidwide(w, m, FO.riffle, 2.8); raidwide(w, m, FO.riffle, 4.2); } },
  FO_BOTH,
].map((st) => ({ ...st, gap: Math.max(0.8, st.gap * 0.82) }));
function folio(world, m, up, dt) {
  const now = world.now;
  const s = (m.mech ??= { phase: 1, scribes: [0.7, 0.4] });
  const frac = m.hp / m.def.hp;
  // Scribes!: a cast of its own, between her others; two Raven Scribes after the healer.
  if (s.scribesEnd != null) {
    if (now >= s.scribesEnd) {
      s.scribesEnd = null;
      m.cast = null;
      m.castPose = null;
      m.attackAt = now;
    }
    return true;
  }
  if (s.scribes.length && frac <= s.scribes[0] && !m.cast) {
    s.scribes.shift();
    const healer = up.find((g) => g.role === 'healer') ?? pick(up);
    m.cast = { name: 'Scribes!', t0: now, dur: 1.4 };
    m.castPose = 'scribes';
    s.scribesEnd = now + 1.4;
    adds(world, m, 'mothlibrarian', [m.x - 200, m.x + 200], healer?.id);
    callout(world, 'Scribes!', 'Her Raven Scribes swoop in after the healer: catch them');
    radio(world, 'moths');
    return true;
  }
  const phase = frac > 0.66 ? 1 : frac > 0.33 ? 2 : 3;
  if (phase > s.phase && !m.cast) {
    s.phase = phase;
    m.phaseAt = now;
    if (phase === 2) callout(world, 'Top Shelf, Bottom Shelf', 'Read the cast: feet on the floor for the top shelf, jump the bottom one');
    else {
      callout(world, 'Closing Time!', 'The Archive is closing: the stacks fall from both ends, and everything comes quicker');
      radio(world, 'shelves');
    }
  }
  if (m.phaseAt != null && now - m.phaseAt < 1.8) return true;
  return runRotation(world, m, s.phase === 1 ? FO_QUIET : s.phase === 2 ? FO_SHELVES : FO_CLOSING, up, dt);
}

// ---------- The Orrery: Sol and Luna, the Eclipse Twins (remade 2026-11-27) ----------
// A fox-eared sun girl and a rabbit-eared moon girl (render/eclipse/), Astraea's two little helpers, who have
// never once been apart. One rotation for the pair (world/bossfight.js), each step cast by one sister (or
// both), each on her own cast bar, its telegraph in their own look (render/eclipse/looks.js). They move
// themselves for their duo moves: dashing to the two ends of the hall, together into the middle, past each
// other. Phases:
//   Sunrise, Moonrise (both above 60%)  Solar Flare (Sol's little sun flung at the tank), Moon Mallet (Luna
//                         pounds three rings of mochi out round her, one after another: run out of them, or
//                         step in behind each as it lands), Sunspots (a little sun over each of you: spread),
//                         Share the Mochi (a big mochi on the healer: gather in to share it), Opposition (they
//                         dash to opposite ends: Sol's sunbeam burns along the floor of her half, Luna's
//                         moonbeam sweeps head-high through hers: stand on the floor on Luna's side), Diamond
//                         Ring (a hit on everyone).
//   Eclipse Season (either at 60%)  adds Conjunction (they meet in the middle hand in hand: the corona burns
//                         all round them, only the shadow right under them is safe: get in close) and
//                         Crossing (they dash past each other, trading places: anything between them is hit).
//   Alone (one sister down)  the other fights on with her sister's keepsake: both sisters' moves cast by
//                         her, Opposition from the middle of the hall on her own, Totality (a harder hit on
//                         everyone), everything quicker.
// Their state for their rigs: m.cast / m.castPose ('flare', 'sunbeam', 'sunspots', 'ripple', 'moonbeam',
// 'mochi', 'conjunction', 'crossing', 'diamond'), m.phaseAt (and m.mech.phase, m.mech.alone).
const TW = { flare: 380, ring: 210, sunspots: 160, mochi: 600, beam: 270, corona: 270, umbra: 58, crossing: 280, diamond: 160, total: 210, dash: 380 };
// A sister dashing to x (she skips her own turn till she's there).
const dashTo = (world, m, x) => {
  if (!m || m.hp <= 0) return;
  m.mech ??= {};
  m.mech.goX = Math.max(80, Math.min(world.map.width - 80, x));
};
// Moon Mallet: three rings of mochi round Luna, one after another.
function ripple(world, m, dur) {
  const y = world.map.groundY;
  const t1 = dur - 1.8;
  addZone(world, { kind: 'circle', x: m.x, y, w: 160, warn: t1, damage: TW.ring, from: m, noSprout: true, look: 'ecRipple', n: 1 });
  addZone(world, { kind: 'donut', x: m.x, y, w: 320, inner: 80, warn: t1 + 0.9, damage: TW.ring, from: m, look: 'ecRipple', n: 2 });
  addZone(world, { kind: 'donut', x: m.x, y, w: 480, inner: 160, warn: dur, damage: TW.ring, from: m, look: 'ecRipple', n: 3 });
}
// Opposition: they dash to opposite ends; the sun burns the floor of her half, the moon sweeps head-high
// through hers. (Alone: she stands in the middle and casts both.)
function opposition(world, m, sol, luna, dur) {
  const W = world.map.width;
  const solLeft = Math.random() < 0.5;
  if (sol && luna && sol.hp > 0 && luna.hp > 0) {
    dashTo(world, sol, solLeft ? 150 : W - 150);
    dashTo(world, luna, solLeft ? W - 150 : 150);
  } else dashTo(world, m, W / 2);
  const half = W / 2;
  const sunX = solLeft ? 0 : half;
  addZone(world, { kind: 'band', x: sunX, w: half, dir: solLeft ? 1 : -1, warn: dur, damage: TW.beam, from: sol?.hp > 0 ? sol : m, look: 'ecSunbeam' });
  addZone(world, { kind: 'band', x: solLeft ? half : 0, w: half, dir: solLeft ? -1 : 1, high: true, warn: dur, damage: TW.beam, from: luna?.hp > 0 ? luna : m, look: 'ecMoonbeam' });
}
// Conjunction: they meet in the middle of the group hand in hand; the corona round them, the shadow under
// them safe.
function conjunction(world, sol, luna, up, dur) {
  const mid = up.length ? up.reduce((t, g) => t + g.body.x, 0) / up.length : (sol.x + luna.x) / 2;
  const x = Math.max(320, Math.min(world.map.width - 320, mid));
  dashTo(world, sol, x - 12);
  dashTo(world, luna, x + 12);
  addZone(world, { kind: 'donut', x, y: world.map.groundY, w: 640, inner: TW.umbra, warn: dur, damage: TW.corona, from: sol, look: 'ecCorona' });
}
// Crossing: the floor between them is hit as they dash past each other, trading places.
function crossing(world, sol, luna, dur) {
  let x0 = Math.min(sol.x, luna.x);
  let x1 = Math.max(sol.x, luna.x);
  if (x1 - x0 < 220) {
    const c = (x0 + x1) / 2;
    x0 = c - 110;
    x1 = c + 110;
  }
  addZone(world, { kind: 'band', x: x0, w: x1 - x0, dir: sol.x < luna.x ? 1 : -1, warn: dur, damage: TW.crossing, from: sol, look: 'ecCrossing' });
  const s = sol.mech;
  s.swapAt = world.now + dur - 0.35;
  s.swapTo = [luna.x, sol.x];
}
const TW_FLARE = { gap: 2.4, by: 'sol', look: 'ecFlare', cast: 'Solar Flare', dur: 2.8, pose: 'flare', sub: "Sol's little sun is flung at the tank: everyone else, step clear", run: (w, m, up) => buster(w, m, tankOf(up), TW.flare, 2.8, 84) };
const TW_RIPPLE = { gap: 2.4, by: 'luna', cast: 'Moon Mallet', dur: 3.8, pose: 'ripple', sub: 'Three rings of mochi pound out round Luna: run clear of them!', run: (w, m) => ripple(w, m, 3.8) };
const TW_SUNSPOTS = { gap: 2.4, by: 'sol', look: 'ecSunspot', cast: 'Sunspots', dur: 2.8, pose: 'sunspots', sub: 'A little sun over each of you: spread out', run: (w, m, up) => spread(w, m, up, TW.sunspots, 2.8, 72) };
const TW_MOCHI = { gap: 2.4, by: 'luna', look: 'ecMochi', cast: 'Share the Mochi', dur: 3.2, pose: 'mochi', sub: 'A big mochi on the healer: gather in to share it!', run: (w, m, up) => stack(w, m, healerOf(up), TW.mochi, 3.2, 3) };
const TW_OPPOSITION = { gap: 2.4, cast: 'Opposition', dur: 3.6, pose: 'sunbeam', both: 'moonbeam', sub: "Sol's sun burns the floor of her half, Luna's moon sweeps head-high through hers: stand on Luna's side!", run: (w, m, up, c) => opposition(w, m, c.sol, c.luna, 3.6) };
const TW_DIAMOND = { gap: 2.4, by: 'sol', look: 'ecDiamond', cast: 'Diamond Ring', dur: 3, pose: 'diamond', both: 'diamond', sub: 'A flash of light on everyone: healer, ready', run: (w, m) => raidwide(w, m, TW.diamond, 3) };
const TW_CONJUNCTION = { gap: 2.4, cast: 'Conjunction', dur: 3.4, pose: 'conjunction', both: 'conjunction', sub: 'They meet hand in hand: the corona burns all round them, get right in under them!', run: (w, m, up, c) => conjunction(w, c.sol, c.luna, up, 3.4) };
const TW_CROSSING = { gap: 2.2, cast: 'Crossing', dur: 2.6, pose: 'crossing', both: 'crossing', sub: 'They dash past each other: get out from between them!', run: (w, m, up, c) => crossing(w, c.sol, c.luna, 2.6) };
const TW_DAY = [TW_FLARE, TW_RIPPLE, TW_SUNSPOTS, TW_MOCHI, TW_OPPOSITION, TW_DIAMOND];
const TW_SEASON = [TW_CONJUNCTION, TW_FLARE, TW_CROSSING, TW_RIPPLE, TW_OPPOSITION, TW_MOCHI, TW_SUNSPOTS, TW_DIAMOND].map((st) => ({ ...st, gap: st.gap * 0.9 }));
const TW_ALONE = [
  { ...TW_FLARE, by: null },
  { ...TW_RIPPLE, by: null },
  { ...TW_OPPOSITION, sub: 'Alone in the middle: her sun burns the floor on one side, her moon sweeps head-high on the other!' },
  { ...TW_MOCHI, by: null },
  { gap: 2.4, look: 'ecDiamond', cast: 'Totality', dur: 3, pose: 'diamond', sub: 'A harder flash on everyone: healer, ready!', run: (w, m) => raidwide(w, m, TW.total, 3) },
  { ...TW_SUNSPOTS, by: null },
].map((st) => ({ ...st, gap: Math.max(0.9, st.gap * 0.78) }));
function eclipse(world, m, up, dt) {
  const s = (m.mech ??= {});
  const now = world.now;
  // A dash of her own first: she runs there, facing the way she goes.
  if (s.goX != null) {
    const d = s.goX - m.x;
    const step = TW.dash * dt;
    if (Math.abs(d) <= step) {
      m.x = s.goX;
      s.goX = null;
    } else {
      m.x += Math.sign(d) * step;
      m.dir = Math.sign(d);
      m.heading = m.dir;
    }
    m.state = 'walk';
  }
  const me = m.def.id === 'eclipsesol' ? 'sol' : 'luna';
  const sister = world.mobs.find((o) => o !== m && o.def.mech === 'eclipse' && o.hp > 0);
  if (!sister && !s.alone) {
    s.alone = true;
    s.phase = 3;
    s.rot = null;
    s.goX = null;
    m.cast = null;
    m.castPose = null;
    m.windup = 0;
    m.phaseAt = now;
    callout(world, `${m.def.name.split(',')[0]} is alone!`, `She fights on for her sister: every move of both of them, and quicker`);
    radio(world, 'alone');
  }
  if (s.alone) {
    if (m.phaseAt != null && now - m.phaseAt < 2) return true;
    return runRotation(world, m, TW_ALONE, up, dt, { [me]: m, caster: m }) || s.goX != null;
  }
  const sol = me === 'sol' ? m : sister;
  const luna = me === 'luna' ? m : sister;
  // The rotation lives with Sol; Luna casts when it's her turn (and takes her half of the duo moves).
  if (me === 'luna') return Boolean(m.cast) || s.goX != null;
  // (the Crossing: they trade places as it lands)
  if (s.swapAt != null && now >= s.swapAt) {
    dashTo(world, sol, s.swapTo[0]);
    dashTo(world, luna, s.swapTo[1]);
    s.swapAt = null;
  }
  const frac = Math.min(sol.hp / sol.def.hp, luna.hp / luna.def.hp);
  const phase = frac > 0.6 ? 1 : 2;
  if (phase > (s.phase ?? 1) && !m.cast && !luna.cast) {
    s.phase = phase;
    sol.phaseAt = luna.phaseAt = now;
    callout(world, 'Eclipse Season!', 'They work together now: get under them when they meet, out from between them when they cross');
    radio(world, 'season');
  }
  s.phase ??= 1;
  if (sol.phaseAt != null && now - sol.phaseAt < 2) return true;
  const list = s.phase === 1 ? TW_DAY : TW_SEASON;
  const busy = runRotation(world, m, list, up, dt, { sol, luna, caster: sol });
  // (a duo move: her sister casts it alongside, in her own pose)
  const rot = s.rot;
  const step = rot?.end != null ? list[rot.i] : null;
  if (step && !step.by && luna.hp > 0 && !luna.cast && rot.who === sol) {
    luna.cast = { name: step.cast, t0: now, dur: step.dur };
    luna.castPose = step.both ?? step.pose;
    luna.mech ??= {};
    luna.mech.castEnd = rot.end;
  }
  if (luna.cast && luna.mech?.castEnd != null && now >= luna.mech.castEnd) {
    luna.cast = null;
    luna.castPose = null;
    luna.mech.castEnd = null;
    luna.attackAt = now;
  }
  return busy || s.goX != null;
}

// ---------- The Telescope Crown: Astraea, the Star Keeper (remade 2026-11-27) ----------
// A small, gentle star keeper (render/astraea/) who has counted the stars for a thousand years and stopped
// them all after the brightest fell. One rotation per phase (world/bossfight.js), each cast on her cast bar,
// its telegraph drawn in her own look (render/astraea/looks.js). Phases go by her health:
//   Counting (to 66%)    Tally (a star bead over the tank, ticked off one, two, three: on three it drops),
//                        Head Count (a numbered star bead over each of you: spread), Catch a Falling Star (a
//                        big soft star drifting down on the healer: gather in and catch it together), A
//                        Thousand Lights (she counts every star in the sky alight: a hit on everyone).
//   Star Charts (to 33%) adds Star Chart (she draws the Little Mochi across the hall: its stars glow on the
//                        floor, and the dark between them is hit: stand on a star), Carry the One (her
//                        abacus swung over her shoulder: beads thrown across the floor ahead of her, get
//                        behind her) and Recount (the numbered beads again, popping one after another in
//                        count order).
//   Let Them Fall (below 33%)  she gives in and lets the stars go: Let Them Fall (stopped stars fall in
//                        three counted waves, the first and third on the same spots, the second between
//                        them: step in where the last ones fell), the Little Boat for her Star Chart, and
//                        The Last Count (two hits on everyone, one after the other); every time round the
//                        rotation she counts faster.
// Her state for her rig: m.cast / m.castPose ('tally', 'head', 'recount', 'catch', 'lights', 'chart',
// 'carry', 'fall', 'last'), m.phaseAt (and m.mech.phase).
const AS = { tally: 430, head: 170, recount: 190, headW: 74, catch: 660, catchW: 100, lights: 170, chart: 270, carry: 250, carryLen: 300, fall: 240, fallW: 108, last: 160 };
// Her constellations for the Star Chart: each star [where across the chart 0..1, how high its picture
// hangs over the floor], each joined to the next and the last back to `close`; the chart spans `span` px
// round the group, so every one of you is a short dash from a star.
export const CHARTS = {
  mochi: { name: 'The Little Mochi', pts: [[0, 12], [0.25, 40], [0.5, 50], [0.75, 40], [1, 12]], close: 0, span: 880, w: 76 },
  boat: { name: 'The Little Boat', pts: [[0, 30], [0.27, 8], [0.54, 8], [0.8, 30], [1, 66]], close: 0, span: 900, w: 66 },
};
const groupMid = (up, m) => (up.length ? up.reduce((t, g) => t + g.body.x, 0) / up.length : m.x);
function starChart(world, m, up, key, dur) {
  const C = CHARTS[key];
  const W = world.map.width;
  const y = world.map.groundY;
  const mid = Math.max(C.span / 2 + 60, Math.min(W - C.span / 2 - 60, groupMid(up, m) + (Math.random() - 0.5) * 120));
  const xs = C.pts.map(([u]) => mid - C.span / 2 + u * C.span);
  const hy = C.pts.map(([, h]) => h);
  const r = C.w / 2;
  // (its stars: no hit, stand on one)
  xs.forEach((x, i) => addZone(world, { kind: 'raid', x, y, w: C.w, warn: dur, damage: 0, tele: true, from: m, look: 'asChartStar', pts: xs, hy, i, close: C.close, name: C.name }));
  // (the dark between them, and out to both walls: hit)
  const edges = [0, ...xs.flatMap((x) => [x - r, x + r]), W];
  for (let i = 0; i < edges.length; i += 2) if (edges[i + 1] - edges[i] > 4) addZone(world, { kind: 'band', x: edges[i], w: edges[i + 1] - edges[i], dir: 1, warn: dur, damage: AS.chart, from: m, look: 'asChart', seed: i });
}
// Head Count (each of you a numbered bead) and Recount (the same, popping one after another).
function headCount(world, m, up, dur, staggered) {
  up.forEach((g, i) => {
    const warn = staggered ? dur - 1.35 + i * 0.45 : dur;
    addZone(world, { kind: 'spread', target: g.id, x: g.body.x, y: g.body.y, w: AS.headW, warn, lock: 0.6, damage: staggered ? AS.recount : AS.head, from: m, n: i + 1, look: staggered ? 'asRecount' : 'asHead' });
  });
}
// Let Them Fall: three counted waves of stopped stars round the group, the first and third on the same
// spots, the second between them.
function letThemFall(world, m, up, dur) {
  const W = world.map.width;
  const y = world.map.groundY;
  const mid = Math.max(420, Math.min(W - 420, groupMid(up, m)));
  const A = [-330, -110, 110, 330];
  const B = [-220, 0, 220];
  const waves = [[A, dur - 1.6], [B, dur - 0.8], [A, dur]];
  waves.forEach(([xs, warn], n) => xs.forEach((dx, i) => addZone(world, { kind: 'circle', x: mid + dx, y, w: AS.fallW, warn, damage: AS.fall, from: m, noSprout: true, look: 'asFall', n: n + 1, seed: n * 5 + i })));
}
const AS_TALLY = { gap: 2.4, look: 'asTally', cast: 'Tally', dur: 3, pose: 'tally', sub: 'One, two, THREE: a star bead drops on the tank. Everyone else, step clear', run: (w, m, up) => buster(w, m, tankOf(up), AS.tally, 3, 84) };
const AS_HEAD = { gap: 2.4, cast: 'Head Count', dur: 3, pose: 'head', sub: 'A numbered star over each of you: spread out', run: (w, m, up) => headCount(w, m, up, 3, false) };
const AS_CATCH = { gap: 2.4, look: 'asCatch', cast: 'Catch a Falling Star', dur: 3.4, pose: 'catch', sub: 'A falling star on the healer: gather in and catch it together!', run: (w, m, up) => stack(w, m, healerOf(up), AS.catch, 3.4, 3, AS.catchW) };
const AS_LIGHTS = { gap: 2.4, look: 'asLights', cast: 'A Thousand Lights', dur: 3, pose: 'lights', sub: 'She counts every star alight at once: healer, ready', run: (w, m) => raidwide(w, m, AS.lights, 3) };
const AS_MOCHI = { gap: 2.4, cast: 'Star Chart: The Little Mochi', dur: 4, pose: 'chart', sub: 'The dark between the stars falls: stand on a star!', run: (w, m, up) => starChart(w, m, up, 'mochi', 4) };
const AS_BOAT = { gap: 2.4, cast: 'Star Chart: The Little Boat', dur: 3.6, pose: 'chart', sub: 'Another chart: stand on a star!', run: (w, m, up) => starChart(w, m, up, 'boat', 3.6) };
const AS_CARRY = { gap: 2.2, look: 'asCarry', cast: 'Carry the One', dur: 2.6, pose: 'carry', sub: 'Beads thrown across the floor ahead of her: get behind her!', run: (w, m) => cleave(w, m, AS.carryLen, AS.carry, 2.6) };
const AS_RECOUNT = { gap: 2.4, cast: 'Recount', dur: 3.6, pose: 'recount', sub: 'She counts you again, one after another: keep apart!', run: (w, m, up) => headCount(w, m, up, 3.6, true) };
const AS_FALL = { gap: 2, cast: 'Let Them Fall', dur: 4.2, pose: 'fall', sub: 'Three waves of falling stars, counted: step in where the last ones fell!', run: (w, m, up) => letThemFall(w, m, up, 4.2) };
const AS_LAST = { gap: 2.2, look: 'asLast', cast: 'The Last Count', dur: 3.6, pose: 'last', sub: 'Three, two, one: two hits on everyone. Healer, ready!', run: (w, m) => { raidwide(w, m, AS.last, 2.8); raidwide(w, m, AS.last, 3.6); } };
const AS_COUNTING = [AS_TALLY, AS_HEAD, AS_CATCH, AS_LIGHTS];
const AS_CHARTS = [AS_MOCHI, AS_CARRY, AS_RECOUNT, AS_TALLY, AS_CATCH, AS_LIGHTS].map((st) => ({ ...st, gap: st.gap * 0.9 }));
const AS_FALLING = [AS_FALL, AS_TALLY, AS_BOAT, AS_LAST, AS_CATCH, AS_RECOUNT, AS_CARRY];
// (Let Them Fall: quicker from the start, and quicker every time round: the gaps shorten, never past half)
const fallingList = (loops) => {
  const k = Math.max(0.5, 0.82 * 0.8 ** loops);
  return AS_FALLING.map((st) => ({ ...st, gap: Math.max(0.7, st.gap * k) }));
};
function astraea(world, m, up, dt) {
  const now = world.now;
  const s = (m.mech ??= { phase: 1, loops: 0 });
  const frac = m.hp / m.def.hp;
  const phase = frac > 0.66 ? 1 : frac > 0.33 ? 2 : 3;
  if (phase > s.phase && !m.cast) {
    s.phase = phase;
    m.phaseAt = now;
    if (phase === 2) {
      callout(world, 'Star Charts', 'She draws her constellations across the hall: stand on a star when the dark falls');
      radio(world, 'charts');
    } else {
      s.loops = 0;
      s.list3 = fallingList(0);
      callout(world, 'Let Them Fall', 'She lets the stars go: the falling stars come in counted waves, and quicker every time');
      radio(world, 'letgo');
    }
  }
  if (m.phaseAt != null && now - m.phaseAt < 2.2) return true;
  if (s.phase < 3) return runRotation(world, m, s.phase === 1 ? AS_COUNTING : AS_CHARTS, up, dt);
  // (a whole time round: she counts faster)
  s.list3 ??= fallingList(0);
  const r = s.rot;
  if (r && r.list === s.list3 && r.i === 0 && s.lastI === s.list3.length - 1) {
    s.loops++;
    s.list3 = fallingList(s.loops);
    callout(world, 'Faster!', 'She counts faster now');
    radio(world, 'faster');
  }
  s.lastI = s.rot?.i;
  return runRotation(world, m, s.list3, up, dt);
}

export function obsKilled(world, m) {
  const room = world.dungeon.room;
  if (m.def.mech === 'folio') room.walls = null;
  if (m.def.mech === 'astraea') {
    // The sky turns again; Elder Goma goes home to the palace (render/prologue.js).
    world.char.elders = { ...(world.char.elders ?? {}), goma: true };
    world.map.elders = world.char.elders;
    playScene(world, 'observatory_freed');
  }
}
