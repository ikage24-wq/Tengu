// What makes each room of the Candy Volcano its own (docs/design/candy-volcano.md; the map fields are
// described in data/maps.js), and its three boss fights. world/dungeon.js calls in here; the drawing
// is in render/volcano.js.
//
//   The Gumdrop Valley        sticky taffy patches slow whoever walks through them; gather the
//                             three sugar crystals.
//   The Licorice Mine         a pit of hot caramel under the tunnels burns whoever stands in it;
//                             minecarts ride the rails across.
//   The Candy Kitchen         the puzzle: the cauldron's recipe (a new one each run); add candies
//                             from the dispensers, exactly; one too many spoils the pot.
//   The Caramel Forge         Toffee, the Caramel Smith (remade 2026-11-27, her new fight below):
//                             Soft Ball, Hard Ball (her anvil off her back) and Hard Crack.
//   The Gingerbread Ramparts  Gretel, the Gingerbread Knight (remade 2026-11-27, her new fight below):
//                             Rolled Out, Cut Out (her cookie cutters) and Into the Oven!
//   The Crater                Queen Bonbon (Chapter 8 rework, 2026-11-19), down her cake a layer
//                             at a time: Sprinkle Rain, then the Frosting Flood (up on the
//                             rock-candy stacks), then Cherry Bomb. Elder Ichigo, her only taster,
//                             eats cake on the far stack the whole time.

import { addZone, adds, callout, hurtMember } from './dungeon.js';
import { runRotation, raidwide, buster, stack, spread, band, out, cleave, tankOf, healerOf, dpsOf } from './bossfight.js';
import { navOf, surfaceBelow } from './nav.js';
import { playScene } from './story.js';
import { radio } from './hollow.js';

export const VOLCANO_MECHS = new Set(['toffee', 'gretel', 'bonbon']);
export const VOLCANO_CHANNEL = { crystal: 0.8, dispenser: 0.5 };
export const CANDY = ['red', 'yellow', 'green', 'blue'];

const floorY = (world, body) => {
  const nav = navOf(world.map);
  return nav.surfaces[Math.max(0, surfaceBelow(nav, body.x, body.y))].y;
};
const onFloor = (world, b) => b.onGround && Math.abs(b.y - world.map.groundY) < 3;

// ---------- Rooms ----------

export function volcanoSetup(world, room) {
  const map = world.map;
  if (map.dungeon !== 'volcano') return;
  // The kitchen: a recipe of four or five candies in three colours, a new one each run.
  if (room.objects.some((o) => o.kind === 'dispenser')) {
    const colours = [...CANDY].sort(() => Math.random() - 0.5).slice(0, 3);
    const need = {};
    const total = 4 + Math.floor(Math.random() * 2);
    for (let i = 0; i < total; i++) {
      const c = colours[i % 3 === 0 ? 0 : 1 + Math.floor(Math.random() * 2)];
      need[c] = (need[c] ?? 0) + 1;
    }
    room.recipe = { need, have: {} };
  }
  room.burnAt = {};
  room.anvil = null;
  room.cutters = null;
  // The crater's caramel only rises once the queen calls it.
  if (map.lateFlood) room.flood = null;
}

export const recipeWords = (room) => `The recipe: ${Object.entries(room.recipe.need).map(([c, n]) => `${n} ${c}`).join(', ')}`;
export const recipeDone = (r) => Object.entries(r.need).every(([c, n]) => (r.have[c] ?? 0) === n) && Object.keys(r.have).every((c) => r.need[c]);
// Candies in the pot, and how many the recipe needs.
export const recipeCount = (room) => ({ have: Object.values(room.recipe.have).reduce((a, b) => a + b, 0), need: Object.values(room.recipe.need).reduce((a, b) => a + b, 0) });
// Whether a dispenser's candy is still wanted (party members only use those).
export const wantCandy = (room, o) => (room.recipe?.need[o.colour] ?? 0) > (room.recipe?.have[o.colour] ?? 0);

// Adding a candy from a dispenser: too many of one spoils the pot (it empties, boiled over into candy
// floss, and a cross Floss Chinchilla climbs out of it); the exact recipe finishes the room. Returns
// whether the recipe is done.
export function addCandy(world, o) {
  const room = world.dungeon.room;
  const r = room.recipe;
  r.have[o.colour] = (r.have[o.colour] ?? 0) + 1;
  o.progress = 0;
  o.usedAt = world.now;
  if ((r.have[o.colour] ?? 0) > (r.need[o.colour] ?? 0)) {
    r.have = {};
    room.spoiledAt = world.now;
    adds(world, null, 'cottoncandy', [o.x + 50], null);
    callout(world, 'The pot is spoiled!', `Too much ${o.colour}: it all bubbles over. Start again`);
    return false;
  }
  if (recipeDone(r)) {
    for (const d of room.objects) if (d.kind === 'dispenser') d.done = true;
    callout(world, 'Perfect!', 'The cauldron bubbles gold and the oven door swings open');
    return true;
  }
  return false;
}

export function tickVolcano(world, dt, group, up) {
  const run = world.dungeon;
  const room = run?.room;
  const map = world.map;
  if (map.dungeon !== 'volcano' || !room) return;
  for (const g of up) {
    const b = g.body;
    // Sticky taffy: whoever walks through it moves at half pace.
    const stuck = (map.sticky ?? []).some((s) => b.onGround && Math.abs(b.y - s.y) < 3 && b.x > s.x1 && b.x < s.x2);
    if (stuck && b.lastX != null) b.x = b.lastX + (b.x - b.lastX) * 0.45;
    b.lastX = b.x;
    // Hot caramel underfoot (the mine's pit) burns now and then.
    const pit = (map.hotFloor ?? []).some(([x1, x2]) => onFloor(world, b) && b.x > x1 && b.x < x2);
    if (pit && world.now - (room.burnAt[g.id] ?? -9) > 0.8) {
      room.burnAt[g.id] = world.now;
      hurtMember(world, g, 70, b.x, { pierce: true });
    }
  }
}

// ---------- The bosses ----------

// (no volcano boss turns hits aside since Gretel's 2026-11-27 remake: kept for world/dungeon.js)
export function volcanoHitMul(world, m, body) {
  return 1;
}

export function volcanoBoss(world, m, up, dt) {
  if (m.def.mech === 'toffee') return toffee(world, m, up, dt);
  if (m.def.mech === 'gretel') return gretel(world, m, up, dt);
  if (m.def.mech === 'bonbon') return bonbon(world, m, up, dt);
  return false;
}

// Toffee, the Caramel Smith (remade 2026-11-27, her look: render/toffee/). A caramel salamander smith
// who tests everything she makes on whoever's handy. Every cast named on her cast bar, its telegraph in
// her own forge look (render/toffee/looks.js). Phases go by her health, named for the sugar's stages:
//   Soft Ball (to 66%)    Hot Off the Anvil (her hammer down on the tank); Caramel Drizzle (a ribbon of
//                         caramel over each of you: spread out); Sugar Glass (a pane of sugar glass over
//                         one of you: everyone under it to share the crash); Quench! (steam bursts all
//                         round her: get out).
//   Hard Ball (to 33%)    her anvil comes off her back: Anvil Toss (heaved onto where one of you stands:
//                         clear the spot), Ring the Anvil (a hot caramel ball flung at it: the CLANG rolls
//                         out over the whole floor but right beside the anvil: hug it), Taffy Pull (she
//                         reels it back along the floor on a strand of taffy: out of its path, or up
//                         high); Hard Crack! (every pane of sugar glass in the forge cracks: everyone,
//                         healer ready); the hammer, the drizzle, the glass.
//   Hard Crack (to 0)     faster: the toss with a drizzle on top, the pull with a quench round her.
// Her state for her rig: m.cast / m.castPose ('strike', 'drizzle', 'glass', 'quench', 'toss', 'ring',
// 'reel', 'crack'), m.mech.phase, m.phaseAt, m.mech.anvilOut (her anvil off her back, out in the room:
// room.anvil, drawn by render/toffee/looks.js drawToffeeAnvil).
const TF = { strike: 470, drizzle: 195, glass: 700, quench: 290, toss: 300, ring: 290, reel: 300, crack: 195 };
const tfAnvil = (w) => w.dungeon.room.anvil;
// (the anvil heaved at one of you, not the tank: it lands where they stood, after its flight; if it's
// still out in the room, she reels it in instead)
function tossAnvil(w, m, up, dur) {
  const s = m.mech;
  if (s.anvilOut) return reelAnvil(w, m, dur);
  const others = up.filter((g) => g.role !== 'tank');
  const g = others.length ? others[Math.floor(Math.random() * others.length)] : up[0];
  const x = Math.max((m.fx1 ?? 80) + 20, Math.min((m.fx2 ?? w.map.width - 80) - 20, g.body.x));
  addZone(w, { kind: 'circle', x, y: w.map.groundY, w: 120, warn: dur + 0.5, damage: TF.toss, from: m, noSprout: true });
  s.throwAt = w.now + dur;
  s.throwX = x;
}
function reelAnvil(w, m, dur) {
  const A = tfAnvil(w);
  if (!A || A.reel) return;
  m.cast.name = 'Taffy Pull';
  m.castPose = 'reel';
  w.dungeon.nextLook = 'tfReel';
  band(w, m, A.x, m.x, TF.reel, dur);
  A.reel = { t0: w.now + dur, dur: 0.6, x1: m.x };
}
// (the CLANG round the anvil; with no anvil out, steam round her instead)
function ringAnvil(w, m, dur) {
  const A = tfAnvil(w);
  if (!A || A.reel || !m.mech.anvilOut) {
    m.cast.name = 'Quench!';
    m.castPose = 'quench';
    w.dungeon.nextLook = 'tfQuench';
    return out(w, m, 150, TF.quench, dur);
  }
  addZone(w, { kind: 'donut', x: A.x, y: w.map.groundY, w: 4000, inner: 74, warn: dur, damage: TF.ring, from: m });
  A.ringAt = w.now + dur;
}
const STRIKE = { gap: 2.2, look: 'tfStrike', cast: 'Hot Off the Anvil', dur: 3, pose: 'strike', sub: 'Her hammer rises over the tank: everyone else, step clear!', run: (w, m, up) => buster(w, m, tankOf(up), TF.strike, 3, 84) };
const DRIZZLE = { gap: 2.4, look: 'tfDrizzle', cast: 'Caramel Drizzle', dur: 3, pose: 'drizzle', sub: 'A ribbon of caramel over each of you: spread out!', run: (w, m, up) => spread(w, m, up, TF.drizzle, 3, 70) };
const GLASS = { gap: 2.4, look: 'tfGlass', cast: 'Sugar Glass', dur: 3.2, pose: 'glass', sub: 'A pane of sugar glass over one of you: everyone under it!', run: (w, m, up) => stack(w, m, healerOf(up) ?? dpsOf(up), TF.glass, 3.2, Math.min(3, up.length), 104) };
const QUENCH = { gap: 2.4, look: 'tfQuench', cast: 'Quench!', dur: 2.8, pose: 'quench', sub: 'Steam bursts up all round her: get out!', run: (w, m) => out(w, m, 150, TF.quench, 2.8) };
const TOSS = { gap: 2.4, look: 'tfToss', cast: 'Anvil Toss', dur: 2.8, pose: 'toss', sub: 'Her anvil comes off her back: clear the spot where it lands!', run: (w, m, up) => tossAnvil(w, m, up, 2.8) };
const RING = { gap: 2.2, look: 'tfRing', cast: 'Ring the Anvil', dur: 3.2, pose: 'ring', sub: 'The CLANG rolls everywhere but right beside her anvil: hug the anvil!', run: (w, m) => ringAnvil(w, m, 3.2) };
const REEL = { gap: 2.4, look: 'tfReel', cast: 'Taffy Pull', dur: 2.8, pose: 'reel', sub: 'She reels her anvil back on a strand of taffy: out of its path, or up high!', run: (w, m) => reelAnvil(w, m, 2.8) };
const CRACK = { gap: 2.6, look: 'tfCrack', cast: 'Hard Crack!', dur: 3.2, pose: 'crack', sub: 'Every pane of sugar glass in the forge cracks: healer, ready!', run: (w, m) => raidwide(w, m, TF.crack, 3.2) };
// (the finale's doubles: a drizzle on top of the toss, a quench round her as the anvil comes back)
const TOSS2 = { gap: 1.8, look: ['tfToss', 'tfDrizzle'], cast: 'Anvil Toss', dur: 2.6, pose: 'toss', sub: 'The anvil AND a drizzle: clear its spot, and spread out!', run: (w, m, up) => { tossAnvil(w, m, up, 2.6); if (m.castPose === 'toss') spread(w, m, up, TF.drizzle, 2.6, 70); } };
const RING2 = { ...RING, gap: 1.8, dur: 2.8, run: (w, m) => ringAnvil(w, m, 2.8) };
const REEL2 = { gap: 1.8, look: ['tfReel', 'tfQuench'], cast: 'Taffy Pull', dur: 2.6, pose: 'reel', sub: 'The anvil comes back AND steam all round her: behind the anvil, or up high!', run: (w, m) => { reelAnvil(w, m, 2.6); w.dungeon.nextLook = 'tfQuench'; out(w, m, 130, TF.quench, 2.6); } };
const fast = (st) => ({ ...st, gap: Math.max(1.6, st.gap - 0.6), dur: st.dur - 0.3, run: st.run });
const SOFT_BALL = [STRIKE, DRIZZLE, GLASS, QUENCH];
// (the crack comes round early in Hard Ball, so even a quick group meets it before the finale)
const HARD_BALL = [TOSS, RING, STRIKE, REEL, CRACK, DRIZZLE, GLASS];
const HARD_CRACK = [TOSS2, RING2, fast(STRIKE), REEL2, CRACK, fast(GLASS), fast(DRIZZLE)];

function toffee(world, m, up, dt) {
  const now = world.now;
  const room = world.dungeon.room;
  if (!m.mech) room.anvil = null;
  const s = (m.mech ??= { phase: 1, anvilOut: false });
  const frac = m.hp / m.def.hp;
  // the anvil leaves her hands as her toss's cast ends: out into the room, flying
  if (s.throwAt != null && now >= s.throwAt) {
    s.throwAt = null;
    s.anvilOut = true;
    room.anvil = { x: s.throwX, y: world.map.groundY, fly: { x0: m.x, h0: 70, t0: now, dur: 0.5 } };
  }
  // reeled all the way back: up onto her back again
  const A = room.anvil;
  if (A?.reel && now >= A.reel.t0 + A.reel.dur) {
    room.anvil = null;
    s.anvilOut = false;
  }
  const phase = frac > 0.66 ? 1 : frac > 0.33 ? 2 : 3;
  if (phase > s.phase && !m.cast) {
    s.phase = phase;
    m.phaseAt = now;
    if (phase === 2) {
      callout(world, 'Hard Ball!', 'She knocks on the anvil on her back: it is coming off!');
      radio(world, 'anvil');
    } else {
      callout(world, 'Hard Crack!', 'The forge roars, and Toffee goes all out');
      radio(world, 'crack');
    }
  }
  // (a phase change: her own moment before the next cast)
  if (m.phaseAt != null && now - m.phaseAt < 1.8) return true;
  return runRotation(world, m, s.phase === 1 ? SOFT_BALL : s.phase === 2 ? HARD_BALL : HARD_CRACK, up, dt);
}

// Gretel, the Gingerbread Knight (remade 2026-11-27, her look: render/gretel/). A living gingerbread
// cookie who knighted herself and holds the wall for her queen with an icing spatula and a heart cookie
// cutter. Every cast named on her cast bar, its telegraph in her own bakery look (render/gretel/looks.js).
// Phases go by her health:
//   Rolled Out (to 66%)   Spatula Smack (the flat of it down on the tank); Gumdrop Buttons (her buttons
//                         pop off and bounce onto each of you: spread out); Royal Icing (a great swirl of
//                         icing over one of you: everyone under it to share); Heartcutter Bash (her
//                         cutter shoved along the floor in front of her: get behind her).
//   Cut Out (to 33%)      her cookie cutters come down on the wall-walk: Roll Out! (the dough rolls out
//                         flat over the whole floor but inside the cutters: get in one), then Press! (the
//                         cutters stamp down: get out of them); Preheat! (the oven's heat on everyone:
//                         healer, ready); the smack, the buttons, the icing, the bash.
//   Into the Oven! (to 0) faster: in, out, and in again; the buttons with a bash on top.
// Her state for her rig: m.cast / m.castPose ('smack', 'buttons', 'icing', 'hbash', 'roll', 'press',
// 'heat'), m.mech.phase, m.phaseAt; the cutters in room.cutters (drawn by render/gretel/looks.js
// drawGretelCutters).
const GR = { smack: 480, buttons: 200, icing: 720, bash: 300, roll: 300, press: 300, heat: 200 };
const CUT_W = 112;
const CUT_KINDS = ['heart', 'star', 'man'];
// The cutters come down near the group: three, spaced along the wall-walk, inside her fighting ground.
function rollOut(w, m, up, dur) {
  const room = w.dungeon.room;
  const lo = (m.fx1 ?? 60) + 40;
  const hi = (m.fx2 ?? w.map.width - 60) - 40;
  const cx = up.reduce((a, g) => a + g.body.x, 0) / Math.max(1, up.length);
  const gap = 250;
  const mid = Math.max(lo + gap, Math.min(hi - gap, cx + (Math.random() - 0.5) * 80));
  const xs = [mid - gap, mid, mid + gap];
  const start = Math.floor(Math.random() * 3);
  room.cutters = { t0: w.now, list: xs.map((x, i) => ({ x, w: CUT_W, kind: CUT_KINDS[(start + i) % 3] })), pressAt: null, until: null };
  // the dough: the floor everywhere but inside them
  let x0 = 0;
  for (const x of xs) {
    if (x - CUT_W / 2 > x0 + 4) addZone(w, { kind: 'band', x: x0, w: x - CUT_W / 2 - x0, dir: 1, warn: dur, damage: GR.roll, from: m });
    x0 = x + CUT_W / 2;
  }
  addZone(w, { kind: 'band', x: x0, w: w.map.width - x0, dir: 1, warn: dur, damage: GR.roll, from: m });
}
// ...then they stamp down: inside them hurts. (No cutters out: the buttons instead.)
function pressDown(w, m, up, dur, again = false) {
  const C = w.dungeon.room.cutters;
  if (!C || C.pressAt) {
    m.cast.name = 'Gumdrop Buttons';
    m.castPose = 'buttons';
    w.dungeon.nextLook = 'grButtons';
    return spread(w, m, up, GR.buttons, dur, 70);
  }
  C.pressAt = { t0: w.now, dur };
  C.until = again ? null : w.now + dur + 0.6;
  for (const c of C.list) addZone(w, { kind: 'circle', x: c.x, y: w.map.groundY, w: c.w - 6, warn: dur, damage: GR.press, from: m, noSprout: true });
}
const SMACK = { gap: 2.2, look: 'grSmack', cast: 'Spatula Smack', dur: 3, pose: 'smack', sub: 'Her spatula rises over the tank: everyone else, step clear!', run: (w, m, up) => buster(w, m, tankOf(up), GR.smack, 3, 84) };
const BUTTONS = { gap: 2.4, look: 'grButtons', cast: 'Gumdrop Buttons', dur: 3, pose: 'buttons', sub: 'Her buttons pop off and bounce at each of you: spread out!', run: (w, m, up) => spread(w, m, up, GR.buttons, 3, 70) };
const ICING = { gap: 2.4, look: 'grIcing', cast: 'Royal Icing', dur: 3.2, pose: 'icing', sub: 'A great swirl of icing over one of you: everyone under it!', run: (w, m, up) => stack(w, m, healerOf(up) ?? dpsOf(up), GR.icing, 3.2, Math.min(3, up.length), 104) };
const BASH = { gap: 2.4, look: 'grBash', cast: 'Heartcutter Bash', dur: 2.8, pose: 'hbash', sub: 'Her cutter shoves along the floor in front of her: get behind her!', run: (w, m, up) => { const g = tankOf(up); if (g) m.dir = Math.sign(g.body.x - m.x) || m.dir || 1; cleave(w, m, 320, GR.bash, 2.8); } };
const ROLL = { gap: 2.4, look: 'grRoll', cast: 'Roll Out!', dur: 3.2, pose: 'roll', sub: 'The dough rolls out over the whole floor: get inside a cookie cutter!', run: (w, m, up) => rollOut(w, m, up, 3.2) };
const PRESS = { gap: 0.5, look: 'grPress', cast: 'Press!', dur: 2.4, pose: 'press', sub: 'The cutters stamp down: get OUT of them!', run: (w, m, up) => pressDown(w, m, up, 2.4) };
const HEAT = { gap: 2.6, look: 'grHeat', cast: 'Preheat!', dur: 3.2, pose: 'heat', sub: "The oven's heat on everyone: healer, ready!", run: (w, m) => raidwide(w, m, GR.heat, 3.2) };
// (the finale: in, out and in again, faster; the buttons with a bash on top)
const ROLL2 = { ...ROLL, gap: 1.8, dur: 2.7, run: (w, m, up) => rollOut(w, m, up, 2.7) };
const PRESS2 = { ...PRESS, gap: 0.4, dur: 2.1, run: (w, m, up) => pressDown(w, m, up, 2.1, true) };
const ROLL3 = { ...ROLL, cast: 'Roll Out Again!', gap: 0.4, dur: 2.1, sub: 'The dough again: back inside a cutter!', run: (w, m, up) => {
  const C = w.dungeon.room.cutters;
  if (!C) return rollOut(w, m, up, 2.1);
  C.pressAt = null;
  C.until = w.now + 2.1 + 0.6;
  let x0 = 0;
  for (const c of C.list) {
    if (c.x - c.w / 2 > x0 + 4) addZone(w, { kind: 'band', x: x0, w: c.x - c.w / 2 - x0, dir: 1, warn: 2.1, damage: GR.roll, from: m });
    x0 = c.x + c.w / 2;
  }
  addZone(w, { kind: 'band', x: x0, w: w.map.width - x0, dir: 1, warn: 2.1, damage: GR.roll, from: m });
} };
const BUTTON_BASH = { gap: 1.8, look: ['grBash', 'grButtons'], cast: 'Gumdrop Buttons', dur: 2.8, pose: 'buttons', sub: 'Buttons at each of you AND her cutter in front: spread out, behind her!', run: (w, m, up) => { const g = tankOf(up); if (g) m.dir = Math.sign(g.body.x - m.x) || m.dir || 1; cleave(w, m, 300, GR.bash, 2.8); spread(w, m, up, GR.buttons, 2.8, 70); } };
const ROLLED_OUT = [SMACK, BUTTONS, BASH, ICING];
const CUT_OUT = [ROLL, PRESS, SMACK, BUTTONS, ICING, HEAT, BASH];
const OVEN = [ROLL2, PRESS2, ROLL3, fast(SMACK), BUTTON_BASH, HEAT, fast(ICING)];

function gretel(world, m, up, dt) {
  const now = world.now;
  const room = world.dungeon.room;
  if (!m.mech) room.cutters = null;
  const s = (m.mech ??= { phase: 1 });
  const frac = m.hp / m.def.hp;
  if (room.cutters?.until != null && now > room.cutters.until + 0.5) room.cutters = null;
  const phase = frac > 0.66 ? 1 : frac > 0.33 ? 2 : 3;
  if (phase > s.phase && !m.cast) {
    s.phase = phase;
    m.phaseAt = now;
    if (phase === 2) {
      callout(world, 'Cut Out!', 'Gretel calls down her cookie cutters!');
      radio(world, 'cutters');
    } else {
      callout(world, 'Into the Oven!', 'The wall heats up, and the knight gets crispy');
      radio(world, 'oven');
    }
  }
  // (a phase change: her own moment before the next cast)
  if (m.phaseAt != null && now - m.phaseAt < 1.8) return true;
  return runRotation(world, m, s.phase === 1 ? ROLLED_OUT : s.phase === 2 ? CUT_OUT : OVEN, up, dt);
}

// Queen Bonbon bakes a bigger cake every day in case someone comes to share it. The fight goes down
// her cake a layer at a time:
//   the topping   (to 66%)  Sprinkle Rain: a cast, then sprinkles pour onto everyone's spot and two
//                           more besides (step off the marks).
//   the frosting  (to 33%)  the Frosting Flood: pink frosting floods the crater floor every so often
//                           (up on the rock-candy stacks), the sprinkles still falling.
//   the cherry    (to 0)    Cherry Bomb: she crouches, leaps, and the cherry off her crown comes down
//                           on one of you in a big splash (get clear), between the floods.
function bonbon(world, m, up, dt) {
  const room = world.dungeon.room;
  const map = world.map;
  const s = (m.mech ??= { phase: 1, rain: 5, cherry: 6 });
  const frac = m.hp / m.def.hp;
  if (s.phase === 1 && frac <= 0.66) {
    s.phase = 2;
    room.flood = { t: 2, state: 'calm', since: 0 };
    callout(world, 'The Frosting Flood!', 'Up on the rock-candy stacks when it comes!');
    // (A scoop of frosting off the floor, flung high: render/bonbon.)
    m.bombAt = world.now + 0.6;
    radio(world, 'frosting');
  }
  if (s.phase === 2 && frac <= 0.33) {
    s.phase = 3;
    s.cherry = 3;
    callout(world, 'The cherry on top!', 'When her cherry comes down, get out from under it!');
    radio(world, 'cherry');
  }
  // (A cast with no pose of its own ends when its bar runs out.)
  if (m.cast && !m.castPose && world.now >= m.cast.t0 + m.cast.dur) m.cast = null;
  s.rain -= dt;
  if (s.rain <= 0 && up.length && !m.cast) {
    s.rain = s.phase === 1 ? 8 : 12;
    const spots = up.map((g) => ({ x: g.body.x, y: floorY(world, g.body) }));
    for (let k = 0; k < 2; k++) spots.push({ x: Math.max(60, Math.min(map.width - 60, m.x + (Math.random() - 0.5) * 700)), y: map.groundY });
    for (const p of spots) addZone(world, { kind: 'circle', x: p.x, y: p.y, w: 64, warn: 1.8, damage: 180, from: m, look: 'sprinkles' });
    m.cast = { name: 'Sprinkle Rain', t0: world.now, dur: 1.8 };
    // (Her arms flung up, scattering sprinkles to the sky: render/bonbon.)
    m.floodAt = world.now + 0.8;
    callout(world, 'Sprinkle Rain!', 'Step off the marks');
  }
  if (s.phase === 3) {
    s.cherry -= dt;
    if (s.cherry <= 0 && up.length && !m.cast) {
      s.cherry = 13;
      // (A breath after the splash before the sprinkles come again.)
      s.rain = Math.max(s.rain, 4.5);
      const g = up[Math.floor(Math.random() * up.length)];
      addZone(world, { kind: 'circle', x: g.body.x, y: floorY(world, g.body), w: 170, warn: 2.2, damage: 300, from: m, look: 'cherry', fromX: m.x, fromY: m.y - m.def.h });
      m.slamming = world.now + 2.2;
      // (A cast bar, a crouch, a leap, and the cherry comes down: render/bonbon.)
      m.cast = { name: 'Cherry Bomb', t0: world.now, dur: 2.2 };
      m.castPose = 'erupt';
      callout(world, 'Cherry Bomb!', 'Get out from under the cherry!');
    }
  }
  // The Eruption's wind-up and blow (for the rig's pose), landing as the floor does.
  const left = (m.slamming ?? 0) - world.now;
  if (m.cast && m.castPose === 'erupt') {
    const total = Math.max(0.2, m.def.fight?.windup ?? 0.5);
    m.windup = left > 0 && left < total ? left : 0;
    if (left <= 0) {
      m.cast = null;
      m.castPose = null;
      m.windup = 0;
      m.attackAt = world.now;
    }
  }
  return left > 0;
}

export function volcanoKilled(world, m) {
  const room = world.dungeon.room;
  if (m.def.mech === 'toffee') room.anvil = null;
  if (m.def.mech === 'gretel') room.cutters = null;
  if (m.def.mech === 'bonbon') {
    room.flood = null;
    // Elder Ichigo goes home to the palace (render/prologue.js), after a slice.
    world.char.elders = { ...(world.char.elders ?? {}), ichigo: true };
    playScene(world, 'volcano_freed');
  }
}
