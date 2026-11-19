// What makes each room of the Star Observatory its own (docs/design/star-observatory.md; the map
// fields are described in data/maps.js), and its three boss fights. world/dungeon.js calls in here;
// the drawing is in render/observatory.js.
//
//   The Starlit Stair     meteor showers fall on the floors now and then; light the three star lamps.
//   The Constellation Hall  the puzzle: five star lamps joined in a constellation; using one flips
//                         it and the lamps joined to it. Light all five.
//   The Weightless Reading Room  low gravity: long, floaty jumps between far-apart shelves.
//   The Archive           Folio: hurled stacks of overdue books, Owl Librarians, and at half health
//                         the bookcases slide in from both ends of the hall.
//   The Orrery            the Eclipse Twins: the hall is half sunlit, half shadowed, swapping at each
//                         eclipse; Sol is only really hurt in the shadow, Luna only in the light.
//   The Telescope Crown   Astraea (reworked 2026-11-18): Meteor Showers all fight; at two thirds and at
//                         a third she rearranges the sky (untouchable, floating) and you join her
//                         constellation by striking its stars in order while the rest slide about;
//                         each one done leaves her starstruck (open to hits). Between them, lines
//                         of stars across the floor; after the second, Supernova (the floor flares;
//                         the stars pull everyone light). Elder Goma counts with her from a gantry
//                         by the telescope (render/observatory.js).

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
  room.eclipse = map.eclipse ? { lightLeft: true, t: 15 } : null;
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
  // Low gravity: whoever is in the air falls slower (the room's own, or Astraea's pull).
  const lowG = Math.max(room.lowG ?? 0, room.pull ?? 0);
  if (lowG) for (const g of up) if (!g.body.onGround && !g.body.rope) g.body.vy -= GRAVITY * lowG * dt;
  // Folio's bookcases slide back once she's out of the fight (a wipe sets the room back).
  if (room.walls && !world.mobs.some((m) => m.def.mech === 'folio' && m.hp > 0 && m.engaged)) room.walls = null;
  // The eclipse: the light swaps sides on a timer.
  const e = room.eclipse;
  if (e && world.mobs.some((m) => m.def.mech === 'eclipse' && m.hp > 0 && m.engaged)) {
    if (e.byRotation) {
      if (e.swapAt != null && e.swapAt <= world.now) {
        e.swapAt = null;
        e.lightLeft = !e.lightLeft;
        callout(world, 'The eclipse turns!', e.lightLeft ? 'The light falls on the left now' : 'The light falls on the right now');
      }
    } else {
      e.t -= dt;
      if (e.t <= 0) {
        e.t = 15;
        e.lightLeft = !e.lightLeft;
        callout(world, 'Eclipse!', e.lightLeft ? 'The light falls on the left now' : 'The light falls on the right now');
      }
    }
  }
}

// ---------- The bosses ----------

// A share of a hit that reaches an observatory boss: Sol is only really hurt in the shadow, Luna in
// the light.
export function obsHitMul(world, m) {
  // Astraea can't be touched while she rearranges the sky.
  if (m.def.mech === 'astraea') return m.mech?.arranging ? 0 : 1;
  if (m.def.mech !== 'eclipse') return 1;
  const e = world.dungeon.room.eclipse;
  if (!e) return 1;
  const inLight = (m.x < world.map.width / 2) === e.lightLeft;
  const sun = m.def.id === 'eclipsesol';
  return sun === inLight ? 0.3 : 1.25;
}

export function obsBoss(world, m, up, dt) {
  if (m.def.mech === 'folio') return folio(world, m, up, dt);
  if (m.def.mech === 'eclipse') return eclipse(world, m, up, dt);
  if (m.def.mech === 'astraea') return astraea(world, m, up, dt);
  return false;
}

// Folio's rotation (2026-11-18, built the FFXIV way: world/bossfight.js). A strict librarian's
// lesson, round and round: a SHHH everyone feels, an overdue book slammed on the tank, a book over
// everyone's head, her reading lamp round her, a bookmark slash in front of her. At half health the
// shelves close in and the lesson gets harder: a study group to gather for, the lamp and the slash
// back to back. Her owl students fly at the healer at 70% and 40%.
const FOLIO_SHH = { gap: 3, look: 'shush', cast: 'Shhh!', dur: 2.4, pose: 'shush', sub: 'The whole room takes it: healer, ready', run: (w, m) => raidwide(w, m, 140, 2.4) };
const FOLIO_OVERDUE = { gap: 2.6, look: 'overdue', cast: 'Overdue Notice', dur: 2.6, pose: 'slam', sub: 'A heavy book on the tank: everyone else, step away', run: (w, m, up) => buster(w, m, tankOf(up), 380, 2.6) };
const FOLIO_RETURN = { gap: 2.6, look: 'books', cast: 'Return Your Books', dur: 3, pose: 'toss', sub: 'A book over each of you: spread out', run: (w, m, up) => spread(w, m, up, 160, 3) };
const FOLIO_P1 = [
  FOLIO_SHH,
  FOLIO_OVERDUE,
  FOLIO_RETURN,
  { gap: 2.6, look: 'lamp', cast: 'Reading Lamp', dur: 2.6, pose: 'lamp', sub: 'Light pours round her: get away', run: (w, m) => out(w, m, 120, 220, 2.6) },
  { gap: 2, look: 'bookmark', cast: 'Bookmark', dur: 2.4, pose: 'mark', sub: 'A long slash in front of her: get behind her', run: (w, m) => cleave(w, m, 340, 220, 2.4) },
];
const FOLIO_P2 = [
  FOLIO_SHH,
  FOLIO_OVERDUE,
  { gap: 2.6, look: 'study', cast: 'Group Study', dur: 3.2, pose: 'study', sub: 'Gather on the healer to share the weight', run: (w, m, up) => stack(w, m, healerOf(up), 600, 3.2, 3) },
  FOLIO_RETURN,
  { gap: 2.4, look: ['lamp', 'bookmark'], cast: 'Lamp and Bookmark', dur: 2.8, pose: 'lamp', sub: 'Out of her light, then out of the slash in front', run: (w, m) => { out(w, m, 110, 220, 2.8); cleave(w, m, 360, 220, 4.2); } },
];
function folio(world, m, up, dt) {
  const map = world.map;
  const room = world.dungeon.room;
  const s = (m.mech ??= { owls: [0.7, 0.4], shelved: false });
  const frac = m.hp / m.def.hp;
  if (s.owls.length && frac <= s.owls[0]) {
    s.owls.shift();
    const healer = up.find((g) => g.role === 'healer') ?? pick(up);
    adds(world, m, 'mothlibrarian', [m.x - 200, m.x + 200], healer?.id);
    callout(world, 'Folio calls her owls!', 'They flutter at the healer: catch them');
    radio(world, 'moths');
  }
  if (!s.shelved && frac <= 0.5) {
    s.shelved = true;
    room.walls = { l: 0, r: map.width, toL: m.x - 380, toR: m.x + 380 };
    callout(world, 'The shelves are moving!', 'The bookcases close in from both ends: stay in the middle');
    radio(world, 'shelves');
  }
  return runRotation(world, m, s.shelved ? FOLIO_P2 : FOLIO_P1, up, dt);
}

// The Eclipse Twins' rotation (2026-11-18, the FFXIV way). One rotation for both, each step cast by
// one sister: Sol's sunrise (get away from her) then Luna's moonfall (get in under her), Sol's
// burning bite on the tank, Luna's crescent sweep in front of her, Sol's corona (spread out),
// Luna's tide (gather together), and the Eclipse: a hit on everyone and the light and shadow swap
// sides (Sol is only really hurt in the shadow, Luna in the light). With one sister down, the other
// fights alone: her own casts, faster, and a Total Eclipse.
const TW_ECLIPSE = { gap: 2.4, by: 'sol', look: 'eclipse', cast: 'Eclipse', dur: 3, pose: 'eclipse', sub: 'Light and shadow swap sides', run: (w, m) => { raidwide(w, m, 150, 3); const e = w.dungeon.room.eclipse; if (e) e.swapAt = w.now + 3; } };
const TWINS = [
  { gap: 3, by: 'sol', look: 'sunrise', cast: 'Sunrise', dur: 2.6, pose: 'rise', sub: 'Get away from Sol', run: (w, m) => out(w, m, 120, 220, 2.6) },
  { gap: 2.2, by: 'luna', look: 'moonfall', cast: 'Moonfall', dur: 2.8, pose: 'fall', sub: 'Get in close under Luna', run: (w, m) => donut(w, m, 48, 230, 220, 2.8) },
  { gap: 2.2, by: 'sol', look: 'fang', cast: 'Solar Fang', dur: 2.6, pose: 'fang', sub: 'A burning bite on the tank: everyone else, step away', run: (w, m, up) => buster(w, m, tankOf(up), 380, 2.6) },
  { gap: 2.2, by: 'luna', look: 'crescentsweep', cast: 'Crescent Sweep', dur: 2.4, pose: 'sweep', sub: 'A sweep in front of Luna: get behind her', run: (w, m) => cleave(w, m, 340, 220, 2.4) },
  { gap: 2.2, by: 'sol', look: 'corona', cast: 'Corona', dur: 3, pose: 'flare', sub: 'Sparks over each of you: spread out', run: (w, m, up) => spread(w, m, up, 160, 3) },
  { gap: 2.2, by: 'luna', look: 'tide', cast: 'Tide Pull', dur: 3.2, pose: 'pull', sub: 'Gather together to share the pull', run: (w, m, up) => stack(w, m, dpsOf(up), 600, 3.2, 3) },
  TW_ECLIPSE,
];
const TOTAL = (by) => ({ gap: 1.8, by, look: 'total', cast: 'Total Eclipse', dur: 3, pose: 'total', sub: 'A hit on everyone: healer, ready', run: (w, m) => raidwide(w, m, 200, 3) });
const ALONE = {
  sol: [TWINS[0], TWINS[2], TWINS[4], TOTAL('sol')].map((st) => ({ ...st, gap: 1.8 })),
  luna: [TWINS[1], TWINS[3], TWINS[5], TOTAL('luna')].map((st) => ({ ...st, gap: 1.8 })),
};
function eclipse(world, m, up, dt) {
  m.mech ??= {};
  const s = m.mech;
  const sister = world.mobs.find((o) => o !== m && o.def.mech === 'eclipse' && o.hp > 0);
  if (!sister && !s.alone) {
    s.alone = true;
    s.rot = null;
    m.cast = null;
    m.castPose = null;
    m.windup = 0;
    callout(world, `${m.def.name.split(',')[0]} is alone!`, 'Her eclipse is broken: she fights faster');
    world.dungeon.room.eclipse = null;
  }
  const me = m.def.id === 'eclipsesol' ? 'sol' : 'luna';
  if (s.alone) return runRotation(world, m, ALONE[me], up, dt, { [me]: m });
  // The rotation lives with whichever sister comes first; the other one just casts when it's her turn.
  const lead = world.mobs.find((o) => o.def.mech === 'eclipse' && o.hp > 0);
  if (lead !== m) return Boolean(m.cast);
  const room = world.dungeon.room;
  if (room.eclipse) room.eclipse.byRotation = true;
  const sol = m.def.id === 'eclipsesol' ? m : sister;
  const luna = m.def.id === 'eclipseluna' ? m : sister;
  return runRotation(world, m, TWINS, up, dt, { sol, luna, caster: m });
}

// ---------- Astraea's sky ----------
// Her constellations: their stars in the order you join them ([x, y] in a 0..1 box, for the picture
// in the sky); each star joins the one before it, and `close` joins the last back to that star.
export const SKIES = {
  mochi: { name: 'The Little Mochi', pts: [[0.5, 0.04], [0.92, 0.56], [0.8, 0.97], [0.2, 0.97], [0.08, 0.56]], close: 0, every: 8 },
  boat: { name: 'The Little Boat', pts: [[0.46, 0], [0.82, 0.56], [1, 0.64], [0.76, 1], [0.24, 1], [0, 0.64]], close: 2, every: 6 },
};
// How high the stars hang over the floor (in reach of a blow from the floor), and how long they take to glide.
const STAR_UP = [12, 24, 36];
export const STAR_GLIDE = 1.2;
const ease = (u) => u * u * (3 - 2 * u);
export function starAt(st, now) {
  const k = ease(Math.min(1, Math.max(0, (now - st.t0) / STAR_GLIDE)));
  return [st.fx + (st.x - st.fx) * k, st.fy + (st.y - st.fy) * k];
}
// `n` places across the hall, spread out, away from the joined stars (`keep`).
function skyXs(map, n, keep = []) {
  const slots = [];
  for (let x = 150; x <= map.width - 150; x += 175) if (!keep.some((k) => Math.abs(k - x) < 90)) slots.push(x);
  slots.sort(() => Math.random() - 0.5);
  return Array.from({ length: n }, (_, i) => (slots[i % slots.length] ?? map.width / 2) + (Math.random() - 0.5) * 50);
}
function startSky(world, m, key) {
  const def = SKIES[key];
  const map = world.map;
  const n = def.pts.length;
  const xs = skyXs(map, n);
  // (They drop into place from high overhead, one after another.)
  const stars = xs.map((x, i) => ({ x, y: map.groundY - STAR_UP[i % 3], fx: x, fy: map.groundY - 300, t0: world.now + i * 0.15 }));
  m.mech.sky = { key, name: def.name, pts: def.pts, close: def.close, n, next: 0, stars, shuffle: def.every, turns: 0, joinedAt: [], startAt: world.now, doneAt: null, star: null };
  m.mech.arranging = true;
  m.windup = 0;
  m.cast = null;
  m.mech.rot = null;
  callout(world, 'She rearranges the sky!', `Strike the stars in order, 1 to ${n}: join the constellation`);
  radio(world, 'sky');
}
// The next star to strike: a little monster of its own, hung where its star is.
function spawnStar(world, m) {
  const sky = m.mech.sky;
  const before = new Set(world.mobs);
  adds(world, m, 'starpoint', [sky.stars[sky.next].x], null);
  const o = world.mobs.find((x) => !before.has(x));
  if (!o) return;
  Object.assign(o, { starNo: sky.next, atkT: 99 });
  sky.star = o;
  hangStar(world, o, sky.stars[sky.next]);
  o.prevX = o.x;
  o.prevY = o.y;
}
function hangStar(world, o, st) {
  const [x, y] = starAt(st, world.now);
  o.x = o.home = x;
  o.y = o.baseY = o.homeY = y;
  o.x1 = o.fx1 = x - 1;
  o.x2 = o.fx2 = x + 1;
  o.atkT = 99;
}
function tickSky(world, m, dt) {
  const s = m.mech;
  const sky = s.sky;
  const map = world.map;
  if (!sky || sky.doneAt != null) return;
  // Every few seconds she sweeps her pointer and the stars not yet joined slide somewhere else.
  sky.shuffle -= dt;
  if (sky.shuffle <= 0) {
    sky.shuffle = SKIES[sky.key].every;
    sky.turns++;
    const keep = sky.stars.slice(0, sky.next).map((st) => st.x);
    const left = sky.stars.slice(sky.next);
    const xs = skyXs(map, left.length, keep);
    left.forEach((st, i) => {
      const [x, y] = starAt(st, world.now);
      Object.assign(st, { fx: x, fy: y, x: xs[i], y: map.groundY - STAR_UP[(i + sky.turns) % 3], t0: world.now });
    });
    m.sweepAt = world.now;
  }
  if (!sky.star || !world.mobs.includes(sky.star)) spawnStar(world, m);
  else if (sky.star.hp > 0) hangStar(world, sky.star, sky.stars[sky.next]);
}
// A star struck down: it stays lit where it is, and the line to it draws itself.
function joinStar(world, o) {
  const m = world.mobs.find((b) => b.def.mech === 'astraea' && b.hp > 0);
  const s = m?.mech;
  const sky = s?.sky;
  if (!sky || sky.star !== o) return;
  const st = sky.stars[sky.next];
  Object.assign(st, { x: o.x, y: o.y, fx: o.x, fy: o.y, t0: -9 });
  sky.joinedAt[sky.next] = world.now;
  sky.next++;
  sky.star = null;
  if (sky.next < sky.n) return;
  // The whole constellation: she has never seen it, and stops to look.
  sky.doneAt = world.now;
  s.arranging = false;
  s.struck = true;
  m.vulnUntil = world.now + 8;
  m.windup = 0;
  callout(world, `${sky.name}!`, "She's never seen that one: hit her while she looks");
  radio(world, 'struck');
}

// Astraea's rotation (2026-11-18, the FFXIV way), each cast on one of her four moves (the rig's
// poses: flick, sweep, charge, stamp). Phase one: Starfall (a star over everyone: spread), Hoof of
// Heaven (she rears over the tank), Comet Pointer (a shot straight ahead of her), Night Sky (a hit
// on everyone). At two thirds she rearranges the sky (her constellation, world above). Phase two
// adds Constellation Lines, Twin Stars (gather on the healer) and Orbit (stars wheel round her: get
// in close). At a third, the second sky; then phase three swaps the lines for Supernova (the floor
// flares: jump, the stars pulling everyone light).
const AS_STARFALL = { gap: 3, look: 'starfall', cast: 'Starfall', dur: 2.8, pose: 'sweep', sub: 'A falling star over each of you: spread out', run: (w, m, up) => spread(w, m, up, 160, 2.8, 72) };
const AS_HOOF = { gap: 2.6, look: 'hoof', cast: 'Hoof of Heaven', dur: 2.6, pose: 'stamp', sub: 'She rears over the tank: everyone else, step away', run: (w, m, up) => buster(w, m, tankOf(up), 400, 2.6) };
const AS_COMET = { gap: 2.6, look: 'comet', cast: 'Comet Pointer', dur: 2.4, pose: 'flick', sub: 'A comet shot straight ahead of her: get behind her', run: (w, m) => cleave(w, m, 420, 230, 2.4) };
const AS_NIGHT = { gap: 2.6, look: 'night', cast: 'Night Sky', dur: 2.6, pose: 'charge', sub: 'The whole sky comes down: healer, ready', run: (w, m) => raidwide(w, m, 150, 2.6) };
const AS_TWIN = { gap: 2.4, look: 'twinstars', cast: 'Twin Stars', dur: 3.2, pose: 'flick', sub: 'Gather on the healer to share it', run: (w, m, up) => stack(w, m, healerOf(up), 620, 3.2, 3) };
const AS_ORBIT = { gap: 2.4, look: 'orbit', cast: 'Orbit', dur: 2.8, pose: 'charge', sub: 'Stars wheel round her: get in close', run: (w, m) => donut(w, m, 50, 240, 230, 2.8) };
const AS_LINES = { gap: 3, look: 'lines', cast: 'Constellation Lines', dur: 2.2, pose: 'sweep', sub: 'Lines of stars light up: stand in the dark', run: (w, m) => {
  const n = 8;
  const width = w.map.width / n;
  const flip = (m.mech.flip = !m.mech.flip) ? 1 : 0;
  for (let i = flip; i < n; i += 2) addZone(w, { kind: 'thorns', x: i * width, w: width, warn: 2.2, damage: 200, from: m, stars: true });
} };
const AS_NOVA = { gap: 3, look: 'nova', cast: 'Supernova', dur: 2.6, pose: 'stamp', sub: 'The floor flares: jump!', run: (w, m) => addZone(w, { kind: 'floor', x: 0, w: w.map.width, warn: 2.6, damage: 250, from: m, nova: true }) };
const AS_P1 = [AS_STARFALL, AS_HOOF, AS_COMET, AS_NIGHT];
const AS_P2 = [AS_LINES, AS_HOOF, AS_TWIN, AS_ORBIT, AS_STARFALL, AS_COMET];
const AS_P3 = [AS_NOVA, AS_HOOF, AS_TWIN, AS_ORBIT, AS_NIGHT, AS_STARFALL];

function astraea(world, m, up, dt) {
  const map = world.map;
  const room = world.dungeon.room;
  const s = (m.mech ??= { skies: 0, fall: 4, arranging: false, struck: false, sky: null });
  const frac = m.hp / m.def.hp;
  if (s.struck && !(m.vulnUntil > world.now)) {
    s.struck = false;
    if (s.skies === 2) {
      room.pull = 0.45;
      callout(world, 'Supernova!', 'The stars pull you light: jump the flare');
      radio(world, 'nova');
    }
  }
  if (!s.arranging && !s.struck && !m.cast) {
    if (s.skies === 0 && frac <= 0.66) {
      s.skies = 1;
      startSky(world, m, 'mochi');
    } else if (s.skies === 1 && frac <= 0.33) {
      s.skies = 2;
      startSky(world, m, 'boat');
    }
  }
  if (s.arranging) {
    // Up in the middle of the crown, out of reach while the sky moves; stars still fall now and
    // then on two of you.
    s.fall -= dt;
    if (s.fall <= 0 && up.length) {
      s.fall = 7;
      world.dungeon.nextLook = 'starfall';
      spread(world, m, [...up].sort(() => Math.random() - 0.5).slice(0, 2), 160, 2);
      world.dungeon.nextLook = null;
      callout(world, 'Starfall!', 'A falling star over two of you: keep apart');
    }
    const cx = map.width / 2;
    m.x += Math.max(-60 * dt, Math.min(60 * dt, cx - m.x));
    tickSky(world, m, dt);
    return true;
  }
  if (s.struck) return true;
  return runRotation(world, m, s.skies === 0 ? AS_P1 : s.skies === 1 ? AS_P2 : AS_P3, up, dt);
}

export function obsKilled(world, m) {
  const room = world.dungeon.room;
  if (m.def.mech === 'folio') room.walls = null;
  if (m.def.id === 'starpoint') joinStar(world, m);
  if (m.def.mech === 'astraea') {
    // The sky turns again; Elder Goma goes home to the palace (render/prologue.js).
    room.pull = 0;
    world.char.elders = { ...(world.char.elders ?? {}), goma: true };
    world.map.elders = world.char.elders;
    playScene(world, 'observatory_freed');
  }
}
