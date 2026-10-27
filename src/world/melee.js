// Combos. Basic attacks with a blade, axe, spear, dagger, bare fists, bow, crossbow, or gauntlet
// (throwing stars) chain into a combo (each step its own move, reach, and weight, ending in a heavy finisher),
// and the warrior's and archer's skills are built the same way.
//
// A step is one move that plays for `dur` seconds, with one or more strikes landing at set moments
// of it (`at`, 0-1, timed to where the blade cuts). You step into each swing (`step` px forward,
// carried until the first strike lands, or through `carry` of the move), and a strike picks its
// targets when it lands, from where you are by then. Strike fields:
//   pct        damage, % of a basic hit       reach, h   the hit box in front (or `around` you)
//   targets    how many it can hit (1)        knock      push (px/s); `launch` pops them up
//   arc        the smear: [start, sweep] in degrees, 0 = forward, -90 = straight up
//   thick      smear width                    pierce     a thrust's straight spike instead
//   big        a heavy blow (bigger flash)    stop       hit-stop seconds; `shake` the screen
//   crack      the floor cracks open          pull       draws monsters in instead (Whirlwind)
// Ranged strikes fire instead of cutting: `shot` (the projectile's look) flies `speed` px/s up to
// `range` px (in a box `h` tall), and hits when it arrives. `fan` fires that many at once, one per
// monster (the rest fly off at an angle); `pierce` goes through up to `targets` in a line. `rain`
// drops that many arrows from the sky on monsters in the `rainW` px starting `rainFrom` ahead,
// over `span` seconds. A step's `step` can be negative (hop back as you shoot), and `guard` makes
// you untouchable for that long (dodges).
// A blow can also leave something on what it hits: `stun` (seconds), `bleed` ({ pct, secs }),
// `provoke` (seconds they stick to you, the tank's taunt), and `fx` (an effect on each monster hit,
// like a pillar of light). `burst` is one effect where the blow lands (a shield of light, a holy
// ring, a burst of rage), `burstAt` how far out along the reach (0 = on you). `rage` is the Rage
// a Berserker's blow builds (see addRage).
// Pressing again while a step plays carries on to the next one; wait too long and it starts over.

import { physicalRange, rollHit, accuracy, hitChance } from '../core/formulas.js';
import { JOBS, jobChain } from '../data/jobs.js';
import { pickTargets, weaponElement } from './combat.js';
import { moveAt } from '../render/moves.js';
import { useStars } from '../core/inventory.js';
import { provoke } from './dungeon.js';

// The longest freeze a blow gets; anything heavier turns the rest into slow motion.
export const MAX_STOP = 0.1;

// How long after a step ends you can still carry the combo on.
const WINDOW = 0.45;
// A step can be cut short into the next one this far through (heavy finishers play out longer).
const CANCEL = 0.76;

// How high the hands are above the feet (where bows are held and stars thrown from).
const HAND_Y = 15;

// Smear colors: steel blue for a cut, gold for a heavy blow; a Paladin's light cuts in pale gold
// and a Berserker's rage in red.
const BLADE = '#8fb8ff';
const HEAVY = '#ffb347';
const TINTS = { holy: ['#ffe9a0', '#ffd24f'], rage: ['#f0303f', '#ff4a1f'] };

export const COMBOS = {
  sword: [
    { move: 'slash', dur: 0.4, step: 7, strikes: [{ at: 0.45, pct: 85, reach: 66, h: 56, knock: 35, arc: [-115, 205] }] },
    { move: 'slash2', dur: 0.4, step: 7, strikes: [{ at: 0.45, pct: 90, reach: 66, h: 60, knock: 35, arc: [100, -215] }] },
    { move: 'thrust', dur: 0.38, step: 16, strikes: [{ at: 0.42, pct: 100, reach: 86, h: 44, knock: 70, pierce: true, targets: 2 }] },
    { move: 'cleave', dur: 0.62, step: 12, finisher: true, strikes: [{ at: 0.5, pct: 190, reach: 92, h: 76, targets: 3, knock: 240, launch: 300, arc: [-170, 330], thick: 13, big: true, stop: 0.09, shake: 3 }] },
  ],
  axe: [
    { move: 'slash', dur: 0.44, step: 6, strikes: [{ at: 0.45, pct: 95, reach: 64, h: 58, knock: 35, arc: [-110, 200], thick: 9 }] },
    { move: 'slash2', dur: 0.44, step: 6, strikes: [{ at: 0.45, pct: 100, reach: 64, h: 62, knock: 35, arc: [100, -210], thick: 9 }] },
    { move: 'overhead', dur: 0.68, step: 12, finisher: true, strikes: [{ at: 0.47, pct: 240, reach: 96, h: 72, targets: 3, knock: 220, arc: [-105, 190], thick: 14, big: true, crack: true, stop: 0.1, shake: 4 }] },
  ],
  spear: [
    { move: 'thrust', dur: 0.36, step: 12, strikes: [{ at: 0.42, pct: 80, reach: 94, h: 40, knock: 35, pierce: true, targets: 2 }] },
    { move: 'thrust', dur: 0.34, step: 12, strikes: [{ at: 0.42, pct: 85, reach: 94, h: 40, knock: 35, pierce: true, targets: 2 }] },
    { move: 'slash2', dur: 0.44, step: 6, strikes: [{ at: 0.45, pct: 100, reach: 86, h: 66, knock: 35, launch: 240, targets: 3, arc: [100, -215], thick: 9 }] },
    { move: 'dash', dur: 0.5, step: 46, finisher: true, strikes: [{ at: 0.4, pct: 190, reach: 112, h: 46, targets: 4, knock: 260, pierce: true, big: true, stop: 0.08, shake: 3 }] },
  ],
  dagger: [
    { move: 'thrust', dur: 0.28, step: 8, strikes: [{ at: 0.42, pct: 80, reach: 56, h: 44, knock: 35, pierce: true }] },
    { move: 'slash', dur: 0.3, step: 6, strikes: [{ at: 0.45, pct: 85, reach: 56, h: 52, knock: 35, arc: [-100, 190], thick: 5 }] },
    { move: 'cross', dur: 0.46, step: 10, finisher: true, strikes: [{ at: 0.22, pct: 80, reach: 60, h: 54, knock: 60, arc: [-110, 200], thick: 6 }, { at: 0.72, pct: 110, reach: 60, h: 56, knock: 160, arc: [100, -210], thick: 7, big: true, stop: 0.06 }] },
  ],
  bow: [
    { move: 'quickshot', dur: 0.46, step: -3, strikes: [{ at: 0.5, shot: 'arrow', pct: 90, range: 290, h: 60, knock: 25 }] },
    { move: 'quickshot', dur: 0.44, step: -3, strikes: [{ at: 0.5, shot: 'arrow', pct: 95, range: 290, h: 60, knock: 25 }] },
    { move: 'draw', dur: 0.62, step: -10, finisher: true, strikes: [{ at: 0.62, shot: 'bigarrow', pct: 170, range: 330, h: 60, targets: 3, pierce: true, speed: 900, knock: 200, big: true, stop: 0.06, shake: 2 }] },
  ],
  crossbow: [
    { move: 'quickshot', dur: 0.5, step: -4, strikes: [{ at: 0.5, shot: 'arrow', pct: 100, range: 300, h: 56, knock: 50, speed: 820 }] },
    { move: 'quickshot', dur: 0.5, step: -4, strikes: [{ at: 0.5, shot: 'arrow', pct: 105, range: 300, h: 56, knock: 50, speed: 820 }] },
    { move: 'aimshot', dur: 0.66, step: -12, finisher: true, strikes: [{ at: 0.68, shot: 'bigarrow', pct: 190, range: 340, h: 56, targets: 3, pierce: true, speed: 1000, knock: 240, big: true, stop: 0.07, shake: 3 }] },
  ],
  gauntlet: [
    { move: 'throw', dur: 0.4, step: -2, strikes: [{ at: 0.5, shot: 'star', pct: 85, range: 270, h: 60, knock: 25 }] },
    { move: 'throw', dur: 0.4, step: -2, strikes: [{ at: 0.5, shot: 'star', pct: 90, range: 270, h: 60, knock: 25 }] },
    { move: 'barrage', dur: 0.56, step: -6, finisher: true, strikes: [0.2, 0.5, 0.8].map((at) => ({ at, shot: 'star', pct: 70, range: 280, h: 70, knock: 60, fan: 1 })) },
  ],
  none: [
    { move: 'thrust', dur: 0.3, step: 6, strikes: [{ at: 0.42, pct: 90, reach: 50, h: 44, knock: 60 }] },
    { move: 'thrust', dur: 0.3, step: 6, strikes: [{ at: 0.42, pct: 95, reach: 50, h: 44, knock: 60 }] },
    { move: 'rising', dur: 0.46, step: 8, finisher: true, strikes: [{ at: 0.4, pct: 150, reach: 56, h: 60, knock: 120, launch: 260, big: true, stop: 0.07, shake: 2 }] },
  ],
};

export const hasCombo = (weaponType) => Boolean(COMBOS[weaponType]);

// The warrior paths' own basic combos. The Paladin: a measured cut behind the shield arm, a shield
// shove that dazes, a lunging thrust, and a two-handed smite. The Berserker: a huge wound-up
// cleave, the return cleave, and a leaping skull-splitter; slower, and every one heavy.
export const PATH_COMBOS = {
  paladin: [
    { move: 'pslash', dur: 0.42, step: 6, strikes: [{ at: 0.45, pct: 90, reach: 68, h: 58, knock: 45, arc: [-115, 205] }] },
    { move: 'bash', dur: 0.44, step: 12, strikes: [{ at: 0.42, pct: 85, reach: 60, h: 62, knock: 120, stun: 0.4, burst: 'aegis' }] },
    { move: 'pthrust', dur: 0.4, step: 16, strikes: [{ at: 0.42, pct: 105, reach: 90, h: 44, knock: 70, pierce: true, targets: 2 }] },
    { move: 'smite', dur: 0.66, step: 12, finisher: true, strikes: [{ at: 0.43, pct: 200, reach: 92, h: 80, targets: 3, knock: 200, arc: [-95, 185], thick: 13, big: true, crack: true, stop: 0.08, shake: 3 }] },
  ],
  berserker: [
    { move: 'cleave1', dur: 0.52, step: 8, strikes: [{ at: 0.4, pct: 115, reach: 80, h: 60, targets: 2, knock: 70, arc: [-150, 230], thick: 11 }] },
    { move: 'cleave2', dur: 0.52, step: 8, strikes: [{ at: 0.42, pct: 120, reach: 80, h: 66, targets: 2, knock: 60, launch: 160, arc: [110, -240], thick: 11 }] },
    { move: 'reaver', dur: 0.8, step: 16, finisher: true, strikes: [{ at: 0.47, pct: 270, reach: 96, h: 76, targets: 3, knock: 250, arc: [-110, 200], thick: 15, big: true, crack: true, stop: 0.1, shake: 4 }] },
  ],
  // The archer paths. The Ranger: a snap shot, a twirl that looses two arrows, then a hop that
  // fans three gale arrows down on them; light and quick. The Sniper: a kneeling heavy bolt through
  // two in a line, a crank-and-fire, then a blast bolt that bursts on the first monster; slower,
  // and every bolt heavy.
  ranger: [
    { move: 'quickshot', dur: 0.4, step: -2, strikes: [{ at: 0.5, shot: 'windarrow', pct: 85, range: 300, h: 60, knock: 25, speed: 860 }] },
    { move: 'spinshot', dur: 0.48, step: 6, strikes: [{ at: 0.32, shot: 'windarrow', pct: 60, range: 300, h: 60, knock: 20, speed: 860 }, { at: 0.72, shot: 'windarrow', pct: 65, range: 300, h: 60, knock: 30, speed: 860 }] },
    { move: 'leapshot', dur: 0.62, step: -8, finisher: true, strikes: [{ at: 0.56, shot: 'galearrow', fan: 3, pct: 95, range: 310, h: 110, knock: 130, launch: 120, speed: 900, big: true, stop: 0.05, shake: 2 }] },
  ],
  sniper: [
    { move: 'kneelshot', dur: 0.56, step: -2, strikes: [{ at: 0.56, shot: 'heavybolt', pct: 120, range: 330, h: 56, knock: 80, speed: 1050, pierce: true, targets: 2 }] },
    { move: 'crankshot', dur: 0.62, step: -3, charge: true, strikes: [{ at: 0.66, shot: 'heavybolt', pct: 130, range: 330, h: 56, knock: 90, speed: 1050, pierce: true, targets: 2 }] },
    { move: 'ballista', dur: 0.82, step: -12, finisher: true, strikes: [{ at: 0.64, shot: 'blastbolt', pct: 210, range: 350, h: 56, blast: 56, targets: 4, speed: 1000, knock: 220, launch: 140, big: true, stop: 0.08, shake: 3, burst: 'blast' }] },
  ],
};

// The archer paths' command shots. Up + attack: a shot up at whatever flies, knocking it higher.
// In the air: shots that hold you up (`hang`) and loose down at them; a Sniper's bolt kicks her
// back up (`recoil`). Running: the Ranger slides in under them loosing two arrows, the Sniper rolls
// and comes up on one knee with a bolt.
const ARCHER_COMMANDS = {
  ranger: {
    up: { move: 'skyshot', dur: 0.5, step: -2, strikes: [{ at: 0.5, shot: 'galearrow', fan: 2, pct: 110, range: 280, h: 190, lift: 50, knock: 20, launch: 380, speed: 900, big: true, stop: 0.05 }] },
    air: [
      { move: 'airshot', dur: 0.36, hang: true, strikes: [{ at: 0.45, shot: 'windarrow', fan: 2, pct: 75, range: 280, h: 170, drop: 50, knock: 30, speed: 900 }] },
      { move: 'airshot2', dur: 0.42, hang: true, finisher: true, strikes: [{ at: 0.5, shot: 'galearrow', fan: 3, pct: 90, range: 280, h: 190, drop: 60, knock: 120, speed: 950, big: true, stop: 0.05, shake: 1 }] },
    ],
    dash: { move: 'slideshot', dur: 0.5, step: 46, carry: 0.6, strikes: [{ at: 0.35, shot: 'windarrow', pct: 80, range: 300, h: 60, knock: 30, speed: 900 }, { at: 0.62, shot: 'windarrow', pct: 90, range: 300, h: 60, knock: 90, speed: 900 }] },
  },
  sniper: {
    up: { move: 'skyshot', dur: 0.56, step: -4, strikes: [{ at: 0.52, shot: 'heavybolt', pct: 140, range: 300, h: 190, lift: 50, knock: 30, launch: 420, speed: 1050, big: true, stop: 0.06, shake: 1 }] },
    air: [
      { move: 'airshot', dur: 0.5, hang: true, strikes: [{ at: 0.5, shot: 'heavybolt', pct: 120, range: 300, h: 170, drop: 50, knock: 80, recoil: 260, speed: 1050, pierce: true, targets: 2 }] },
    ],
    dash: { move: 'rollshot', dur: 0.66, step: 40, carry: 0.45, guard: 0.3, strikes: [{ at: 0.66, shot: 'heavybolt', pct: 150, range: 330, h: 56, knock: 160, speed: 1050, pierce: true, targets: 3, big: true, stop: 0.05, shake: 1 }] },
  },
};

// The command variants of a melee basic combo (any blade, axe, spear, dagger or bare hands).
const MELEE = new Set(['sword', 'axe', 'spear', 'dagger', 'none']);
// Up + attack: a rising launcher that throws them up and hops you after them (`hop`, px/s).
const LAUNCHER = { move: 'rising', dur: 0.5, step: 8, strikes: [{ at: 0.4, pct: 120, reach: 72, h: 86, targets: 3, knock: 30, launch: 480, hop: 400, arc: [80, -175], thick: 11, big: true, stop: 0.06 }] };
// In the air: two cuts that keep you hanging (`hang`), then a dive that slams into the ground
// and lands its blow on touchdown (`dive`: the fall speed; the strike marked `onLand`).
const AIR = [
  { move: 'airslash', dur: 0.36, hang: true, strikes: [{ at: 0.45, pct: 90, reach: 68, h: 80, targets: 2, knock: 15, launch: 150, arc: [-115, 205] }] },
  { move: 'airslash2', dur: 0.36, hang: true, strikes: [{ at: 0.45, pct: 95, reach: 68, h: 84, targets: 2, knock: 15, launch: 170, arc: [100, -215] }] },
  { move: 'meteor', dur: 0.5, dive: 760, finisher: true, strikes: [{ onLand: true, pct: 210, reach: 84, h: 70, around: true, targets: 4, knock: 220, crack: true, big: true, stop: 0.09, shake: 4 }] },
];
// Running into an attack: a lunging thrust through the line.
const DASH = { move: 'dashstab', dur: 0.46, step: 44, carry: 0.55, strikes: [{ at: 0.38, pct: 140, reach: 84, h: 52, targets: 3, pierce: true, knock: 200, big: true, stop: 0.05, shake: 1 }] };
// How long you must have been running for an attack to become a dash attack.
const DASH_AFTER = 0.3;
// How slowly you sink while an air cut hangs you up (px/s).
const HANG_FALL = 30;

// The pose a new move starts from: whatever move is still playing (or just ended), so the drawing
// can ease out of it over a few frames instead of snapping (see render/hero.js `blendMove`).
export function outgoing(world) {
  const p = world.pose ?? world.lastPose;
  if (!p || (!world.pose && world.now - p.endedAt > 0.1)) return null;
  return { kind: p.kind, progress: world.pose ? 1 - p.t / p.dur : 1, dur: p.dur };
}

// Rage: a Berserker's blows build it up to RAGE_MAX, and it drains away once the fighting stops.
export const RAGE_MAX = 100;
const RAGE_HOLD = 5; // seconds after the last gain before it starts draining
const RAGE_DRAIN = 12; // per second
export const hasRage = (char) => jobChain(char.job).includes('berserker');

// Faith: the Paladin's gauge. Her blows and the hits she takes build it; it drains slowly once the
// fighting stops, and the fuller it is the less damage she takes (up to FAITH_CUT at full).
export const FAITH_MAX = 100;
const FAITH_HOLD = 6;
const FAITH_DRAIN = 8;
export const FAITH_CUT = 0.15;
const FAITH_ON_HURT = 7;
export const hasFaith = (char) => jobChain(char.job).includes('paladin');
export function addFaith(world, n) {
  if (!hasFaith(world.char) || n <= 0) return;
  world.faith = Math.min(FAITH_MAX, (world.faith ?? 0) + n);
  world.faithAt = world.now;
}
// The share Faith takes off a hit; a hit taken also builds it.
export function faithGuard(world) {
  if (!hasFaith(world.char)) return 0;
  const cut = (FAITH_CUT * (world.faith ?? 0)) / FAITH_MAX;
  addFaith(world, FAITH_ON_HURT);
  return cut;
}
// Gale: the Ranger's gauge. Every arrow that lands builds it, and it blows itself out once the
// fighting stops. The fuller it is the quicker she shoots (up to GALE_SPEED quicker at full); full
// (Tailwind), every basic shot looses a twin arrow beside it.
export const GALE_MAX = 100;
const GALE_HOLD = 4;
const GALE_DRAIN = 14;
export const GALE_SPEED = 0.25;
export const hasGale = (char) => jobChain(char.job).includes('ranger');
export function addGale(world, n) {
  if (!hasGale(world.char) || n <= 0) return;
  world.gale = Math.min(GALE_MAX, (world.gale ?? 0) + n);
  world.galeAt = world.now;
}
// Focus: the Sniper's gauge. Bolts that land build it, and so does standing still mid-fight;
// running bleeds it away, and it fades once the fighting stops. The fuller it is the likelier a
// critical (up to FOCUS_CRIT more at full); full, the next bolt is a Deadeye: it always crits and
// tears through the whole line, and spends all of it.
export const FOCUS_MAX = 100;
const FOCUS_HOLD = 5;
const FOCUS_DRAIN = 10;
const FOCUS_STILL = 9; // per second, standing still with a fight on
const FOCUS_RUN = 18; // per second lost while running
export const FOCUS_CRIT = 0.3;
export const hasFocus = (char) => jobChain(char.job).includes('sniper');
export function addFocus(world, n) {
  if (!hasFocus(world.char) || n <= 0) return;
  world.focus = Math.min(FOCUS_MAX, (world.focus ?? 0) + n);
  world.focusAt = world.now;
}
// What a shot that lands builds on an archer path's gauge (see world.js).
export function addAim(world, n) {
  addGale(world, n);
  addFocus(world, n);
}
// The path a basic attack fights in: a warrior path with a blade, an archer path with its bow.
function pathOf(world) {
  const { char } = world;
  const w = world.stats.weaponType;
  if (MELEE.has(w) && w !== 'none') return hasRage(char) ? 'berserker' : hasFaith(char) ? 'paladin' : null;
  if (w === 'bow' && hasGale(char)) return 'ranger';
  if (w === 'crossbow' && hasFocus(char)) return 'sniper';
  return null;
}

// Rage makes a Berserker's blows hit harder: up to RAGE_POWER more at full Rage.
const RAGE_POWER = 0.25;
// How much heavier each path's blows land: longer hit-stop, harder knockback.
const WEIGHT = { berserker: 1.4, paladin: 1.2 };
const weightOf = (char) => (hasRage(char) ? WEIGHT.berserker : hasFaith(char) ? WEIGHT.paladin : 1);
export function addRage(world, n) {
  if (!hasRage(world.char) || n <= 0) return;
  world.rage = Math.min(RAGE_MAX, (world.rage ?? 0) + n);
  world.rageAt = world.now;
}

// Basic attack with a melee weapon: the next step of its combo.
export function basicCombo(world) {
  const { body } = world;
  // Blades, axes, spears, daggers and fists have command variants: in the air, an air combo;
  // Up + attack on the ground, a launcher that follows them up; running, a dash attack.
  if (MELEE.has(world.stats.weaponType)) {
    if (!body.onGround && !body.rope) {
      if ((world.airCombo ?? 0) >= AIR.length) return;
      playStep(world, AIR[world.airCombo], 100, `basicair${world.airCombo}`);
      world.airCombo += 1;
      return;
    }
    if (world.intent?.up) {
      playStep(world, LAUNCHER, 100, 'basiclaunch');
      world.combo = -1;
      return;
    }
    if ((world.runFor ?? 0) >= DASH_AFTER) {
      playStep(world, DASH, 100, 'basicdash');
      world.combo = -1;
      return;
    }
  }
  // The paths fight their own way: warriors with any blade, axe or spear, archers with their own
  // bow, and the archer paths have their own command shots.
  const path = pathOf(world);
  const cmd = ARCHER_COMMANDS[path];
  if (cmd) {
    if (!body.onGround && !body.rope) {
      if ((world.airCombo ?? 0) >= cmd.air.length) return;
      playStep(world, cmd.air[world.airCombo], 100, `basicair${world.airCombo}`);
      world.airCombo += 1;
      return;
    }
    if (world.intent?.up) {
      playStep(world, cmd.up, 100, 'basiclaunch');
      world.combo = -1;
      return;
    }
    if ((world.runFor ?? 0) >= DASH_AFTER) {
      playStep(world, cmd.dash, 100, 'basicdash');
      world.combo = -1;
      return;
    }
  }
  const steps = PATH_COMBOS[path] ?? COMBOS[world.stats.weaponType];
  world.combo = world.now <= (world.comboUntil ?? -9) ? ((world.combo ?? -1) + 1) % steps.length : 0;
  playStep(world, steps[world.combo], 100, `basic${world.combo}`);
}

// A combo skill: each use plays its next step (a one-step skill just plays it).
export function skillCombo(world, skillId, params, scale = 100) {
  const chain = (world.chains ??= {});
  const c = chain[skillId];
  const i = c && world.now <= c.until ? (c.i + 1) % params.combo.length : 0;
  const step = params.combo[i];
  chain[skillId] = { i, until: world.now + step.dur + WINDOW };
  playStep(world, step, scale, skillId, params.school);
}

function playStep(world, step, scale, key, school = null) {
  const { body, now, stats } = world;
  // Basic swings run a touch quicker than their written timing.
  // Shots need the whole draw and loose, so they hold you a little longer than a cut; a Ranger's
  // Gale quickens them.
  const ranged = step.strikes.some((s) => s.shot || s.rain);
  const gale = ranged && hasGale(world.char) && !step.finisher ? 1 - (GALE_SPEED * (world.gale ?? 0)) / GALE_MAX : 1;
  const dur = step.dur * gale * (key.startsWith('basic') ? 0.9 : 1) * (1 - Math.min(0.4, stats.attackSpeed ?? 0) * 0.5);
  const busy = dur * (step.finisher ? 0.92 : ranged ? 0.86 : CANCEL);
  world.attackTimer = busy;
  world.lockTimer = Math.max(world.lockTimer ?? 0, busy);
  world.pose = { from: outgoing(world), kind: step.move, t: dur, dur, since: world.now };
  world.comboUntil = now + dur + WINDOW;
  // Once the last blow lands, moving, jumping, or a skill can cut the follow-through short.
  const timed = step.strikes.filter((st) => !st.onLand);
  world.recoverAt = now + (timed.length ? timed.at(-1).at : 1) * dur + 0.03;
  world.recoverKind = key.startsWith('basic') ? 'basic' : 'skill';
  if (key.startsWith('basic')) world.basicReadyAt = now + busy;
  else world.skillReadyAt = now + busy;
  // Step into it (or hop back from it): carried until the first strike lands (or through `carry`).
  const first = (step.carry ?? step.strikes[0].at) * dur;
  if (step.step) world.lunge = { v: (body.facing * step.step) / Math.max(0.05, first), until: now + first };
  if (step.guard) world.invuln = Math.max(world.invuln, step.guard);
  // A dash leaves speed lines and a shock cone along its path.
  if (step.trail) world.fx.push({ kind: 'chargetrail', school, x: body.x, y: body.y, tx: body.x + body.facing * step.step, dir: body.facing, t: 0, dur: 0.5 });
  // Warrior paths put their weight into big moves: a stomp that kicks up dust as the move starts,
  // and power gathering at the weapon until the first blow lands.
  // A Sniper plants her feet the same way, and gathers her aim at the bow.
  const heavy = hasRage(world.char) || hasFaith(world.char) || hasFocus(world.char);
  if (heavy && body.onGround && (step.finisher || step.strikes.some((st) => st.big))) {
    world.juice.push({ type: 'stomp', x: body.x, y: body.y, dir: body.facing, big: !key.startsWith('basic') });
    const lead = (step.strikes.find((st) => !st.onLand)?.at ?? 0.4) * dur;
    if (!key.startsWith('basic') && lead > 0.18) world.fx.push({ kind: 'gather', school: school ?? (hasRage(world.char) ? 'rage' : hasFocus(world.char) ? 'focus' : 'holy'), x: body.x, y: body.y, dir: body.facing, t: 0, dur: lead, big: lead > 0.5 });
  }
  // A marked shot locks on first: the world dims, and a sight pops onto each monster in its line,
  // nearest first, one after another (Rez, Red Dead's Dead Eye; research/archery.md 26-27), each
  // closing in until the shot fires.
  if (step.mark) {
    const s0 = step.strikes.find((st) => st.shot);
    const lead = s0.at * dur;
    world.fx.push({ kind: 'aimdim', x: body.x, y: body.y, t: 0, dur: lead + 0.3 });
    pickTargets(world.mobs, body, { w: s0.range, h: s0.h ?? 60 }, s0.targets ?? 1).forEach((m, i) => {
      world.fx.push({ kind: 'reticle', school, mob: m, n: i, x: m.x, y: m.y, h: m.def.h, t: -i * 0.075, dur: lead + 0.1 });
    });
  }
  // A charging shot glows at the weapon as it winds up, stepping brighter (Monster Hunter's
  // charge levels; research/archery.md 25).
  if (step.charge) {
    const lead = (step.strikes.find((st) => st.shot)?.at ?? 0.5) * dur;
    world.fx.push({ kind: 'chargeglow', school: school ?? 'focus', x: body.x + body.facing * 16, y: body.y - HAND_Y - 2, dir: body.facing, t: 0, dur: lead });
  }
  world.hangUntil = step.hang ? now + dur + 0.15 : 0;
  if (step.dive) {
    body.vy = step.dive;
    world.dive = { strike: { ...step.strikes.find((st) => st.onLand), n: 0, of: 1, dir: body.facing, scale, key, school, finisher: step.finisher, move: step.move, dur, at: 1 }, until: now + 1.2 };
  }
  step.strikes.forEach((s, n) => {
    if (s.onLand) return;
    // The blade's whoosh starts during the wind-up, so it peaks as the blow lands (audio cue).
    if (!s.shot && !s.rain && !s.quiet) world.juice.push({ type: 'swing', in: s.at * dur, big: s.big || step.finisher, thick: s.thick ?? 7, pierce: Boolean(s.pierce && !s.arc), school, weapon: stats.weaponType });
    world.strikes.push({ ...s, n, of: step.strikes.length, due: now + s.at * dur, dir: body.facing, scale, key, school, finisher: step.finisher, move: step.move, dur });
  });
}

// Every tick: the step-in, and strikes landing.
export function tickMelee(world, dt) {
  const b = world.body;
  if (world.rage > 0 && world.now - (world.rageAt ?? 0) > RAGE_HOLD) world.rage = Math.max(0, world.rage - RAGE_DRAIN * dt);
  if (world.faith > 0 && world.now - (world.faithAt ?? 0) > FAITH_HOLD) world.faith = Math.max(0, world.faith - FAITH_DRAIN * dt);
  if (world.gale > 0 && world.now - (world.galeAt ?? 0) > GALE_HOLD) world.gale = Math.max(0, world.gale - GALE_DRAIN * dt);
  // Tailwind at a Ranger's heels: streaks of wind peel off behind her as she runs.
  if (world.char.buffs.tailwind && (world.runFor ?? 0) > 0 && b.onGround && world.now - (world.windStepAt ?? -9) > 0.12) {
    world.windStepAt = world.now;
    world.fx.push({ kind: 'windstep', x: b.x, y: b.y, dir: b.facing, t: 0, dur: 0.4 });
  }
  if (hasFocus(world.char)) {
    // Standing still with a fight on (a bolt landed lately) steadies the aim; running loses it.
    const fighting = world.now - (world.focusAt ?? -9) < FOCUS_HOLD;
    if (fighting && world.stillTime > 0.25 && world.focus < FOCUS_MAX) world.focus = Math.min(FOCUS_MAX, world.focus + FOCUS_STILL * dt);
    else if ((world.runFor ?? 0) > 0.1 && world.focus > 0) world.focus = Math.max(0, world.focus - FOCUS_RUN * dt);
    else if (!fighting && world.focus > 0) world.focus = Math.max(0, world.focus - FOCUS_DRAIN * dt);
  }
  if (world.dead) {
    world.strikes.length = 0;
    world.lunge = null;
    return;
  }
  if (world.lunge) {
    if (world.now >= world.lunge.until || !b.onGround) world.lunge = null;
    else b.x = Math.max(b.w / 2, Math.min(world.map.width - b.w / 2, b.x + world.lunge.v * dt));
  }
  // Air cuts hold you up; landing ends the air combo, and a dive lands its blow on touchdown.
  if (!b.onGround && world.now < (world.hangUntil ?? 0)) b.vy = Math.min(b.vy, HANG_FALL);
  if (b.onGround || b.rope) world.airCombo = 0;
  if (world.dive) {
    if (b.onGround) {
      const strike = world.dive.strike;
      world.dive = null;
      world.pose = { from: outgoing(world), kind: 'landslam', t: 0.34, dur: 0.34, since: world.now };
      world.attackTimer = Math.max(world.attackTimer, 0.22);
      world.recoverAt = world.now + 0.08;
      land(world, strike);
    } else if (world.now > world.dive.until || b.rope) world.dive = null;
    else b.vy = Math.max(b.vy, 600);
  }
  if (!world.strikes.length) return;
  const due = world.strikes.filter((s) => s.due <= world.now);
  if (!due.length) return;
  world.strikes = world.strikes.filter((s) => s.due > world.now);
  for (const s of due) land(world, s);
}

function land(world, s) {
  const { char, stats, body, now } = world;
  // Strikes follow the way you were facing when the step began.
  body.facing = s.dir;
  if (s.rain) return rain(world, s);
  if (s.shot) return fire(world, s);
  const range = s.around ? { w: s.reach * 2, h: s.h, around: true } : { w: s.reach, h: s.h };
  const targets = pickTargets(world.mobs, body, range, s.targets ?? 1);
  const acc = accuracy(JOBS[char.job].family, stats, char.level);
  const power = hasRage(char) ? 1 + (RAGE_POWER * (world.rage ?? 0)) / RAGE_MAX : 1;
  const weight = weightOf(char);
  const dmgRange = physicalRange(stats, stats.weaponType, (s.pct * s.scale * power) / 100);
  const cy = body.y - body.h / 2;
  // The smear, spike, or whirl of the blow.
  if (s.pierce) {
    const x = s.dir > 0 ? body.x - 6 : body.x + 6 - s.reach;
    world.fx.push({ kind: 'pierce', x: body.x, y: body.y, dir: s.dir, box: { x, y: cy - 10, w: s.reach, h: 20 }, t: 0, dur: s.big ? 0.35 : 0.25, move: s.move, at: s.at, moveDur: s.dur });
  }
  if (s.arc) {
    world.fx.push({ kind: 'arc', snd: s.school, x: body.x + s.dir * (s.around ? 0 : 10), y: cy - 2, bx: body.x, by: body.y, move: s.move, at: s.at, moveDur: s.dur, dir: s.dir, r: s.around ? s.reach * 0.8 : s.reach * 0.52, start: s.arc[0], sweep: s.arc[1], thick: s.thick ?? 7, big: s.big, flat: s.around, color: TINTS[s.school]?.[s.big ? 1 : 0] ?? (s.big ? HEAVY : BLADE), element: s.key.startsWith('basic') ? weaponElement(char) : null, t: 0, dur: s.big ? 0.32 : 0.24 });
  }
  if (s.crack) {
    world.fx.push({ kind: 'crack', x: body.x + s.dir * s.reach * 0.55, y: body.y, w: s.around ? s.reach * 2 : s.reach * 1.4, t: 0, dur: 0.7, seed: Math.random() });
    world.juice.push({ type: 'slam', x: body.x + s.dir * s.reach * 0.5, y: body.y, range: s.reach });
  }
  // A storm sky over the whole view (Storm Volley): a green wash, wind tearing across, arrows.
  if (s.sky) {
    world.fx.push({ kind: 'stormsky', x: body.x, y: body.y, t: 0, dur: s.sky });
    world.fx.push({ kind: 'rain', variant: 'windarrow', school: 'wind', box: { x: body.x - 320, y: body.y - 330, w: 640, h: 330 }, x: body.x, y: body.y, t: 0, dur: s.sky });
  }
  if (s.burst) {
    world.fx.push({ kind: s.burst, school: s.school, x: body.x + s.dir * s.reach * (s.burstAt ?? (s.around ? 0.3 : 0.45)), y: body.y, r: s.reach, dir: s.dir, t: 0, dur: 0.7, seed: Math.random() });
  }
  targets.forEach((m, i) => {
    const miss = Math.random() >= hitChance(acc, char.level, m.def);
    const roll = miss ? null : rollHit(dmgRange, stats, m.def, char.level, Math.random);
    const knock = s.pull ? -Math.sign(m.x - body.x) * s.pull : s.knock * weight;
    world.pending.push({
      at: now, mob: m, miss, damage: roll?.damage ?? 0, crit: roll?.crit ?? false, fromX: body.x, stack: s.n % 3, knock, launch: s.launch, big: s.big, small: s.around && !s.big,
      stun: miss ? undefined : s.stun, bleed: miss ? undefined : s.bleed, school: s.school, via: s.via ?? 'blade', weapon: stats.weaponType, gauge: s.gauge,
    });
    if (s.fx) world.fx.push({ kind: s.fx, school: s.school, x: m.x, y: m.y, h: m.def.h, t: -i * 0.03, dur: 0.6, seed: Math.random() });
    // Each path's own spark on every blow that lands: shards of rage, or a bloom of light.
    if (!miss && weight > 1) world.fx.push({ kind: hasRage(char) ? 'ragehit' : 'holyhit', school: hasRage(char) ? 'rage' : 'holy', x: m.x, y: m.y - (m.air ?? 0), h: m.def.h, big: s.big, dir: s.dir, t: 0, dur: s.big ? 0.42 : 0.32, seed: Math.random() });
  });
  // A tank's taunting blow: everything it hits turns on you (in a dungeon, sticking for a while).
  if (s.provoke && targets.length) {
    if (world.dungeon) provoke(world, 'you', body, s.reach, s.provoke);
    else for (const m of targets) {
      m.aggroUntil = now + 6;
      m.dir = Math.sign(body.x - m.x) || m.dir;
    }
  }
  if (targets.length) addRage(world, s.rage ?? (s.key.startsWith('basic') ? 3 : 5));
  if (targets.length) addFaith(world, s.faith ?? (s.key.startsWith('basic') ? 2 : 4));
  // A launcher hops you up after them, ready for an air combo.
  if (s.hop && body.onGround) {
    body.vy = -s.hop;
    body.onGround = false;
    world.airCombo = 0;
  }
  // A finisher that connects opens a moment to Link a skill onto it (see combat.js).
  if (s.finisher && targets.length) world.finisherAt = { at: now, key: s.key };
  if (targets.length) {
    // Weight climbs a ladder: a light blow just stops; a heavy one stops, shakes, and kicks the
    // view along the blow; the heaviest add a moment of slow motion after the stop instead of a
    // longer freeze (past about 0.1 s a freeze starts to feel choppy). The middle blows of a
    // flurry don't stop at all, so it flows into the hits that do. A strike hitting many
    // monsters still stops once (the longest, never the sum).
    const mid = s.of > 2 && s.n > 0 && s.n < s.of - 1 && !s.big;
    const stop = (s.stop ?? (s.finisher ? 0.07 : 0.035)) * weight;
    if (!mid) world.hitstop = Math.max(world.hitstop, Math.min(MAX_STOP, stop));
    if (stop > MAX_STOP) {
      world.slowmo = Math.max(world.slowmo ?? 0, 0.1 + (stop - MAX_STOP) * 2);
      world.fx.push({ kind: 'tint', x: 0, y: 0, t: 0, dur: 0.05 });
    }
    const shakeMag = s.shake ? s.shake + (weight > 1 && s.big ? 1 : 0) : weight > 1.3 && s.big ? 1.5 : 0;
    if (shakeMag) {
      world.juice.push({ type: 'shake', mag: shakeMag, dur: 0.18 + shakeMag * 0.05 });
      world.juice.push({ type: 'kick', x: s.dir * Math.min(4, 1 + shakeMag * 0.6), y: s.crack ? 2 : 0 });
    }
  } else if (s.shake && s.crack) world.juice.push({ type: 'shake', mag: s.shake * 0.6, dur: 0.2 });
}

// How a shot would hit a monster: rolled now, landing when it arrives.
// A Sniper's Focus sharpens her crits; a Deadeye (or a strike marked `crit`) always crits. Each
// archer path's own spark lands with every shot (a swirl of wind, a sight's glint), unless the shot
// bursts with its own (`burst`). Shots that land build the path's gauge (`gauge`, or 3 for a basic
// shot and 5 for a skill's).
function shotHit(world, s, m, delay, stack = 0, element = null, rank = 0) {
  const { char, stats, body } = world;
  const acc = accuracy(JOBS[char.job].family, stats, char.level);
  const sure = s.crit || s.deadeye;
  const miss = !sure && Math.random() >= hitChance(acc, char.level, m.def);
  const extraCrit = sure ? 1 : hasFocus(char) ? (FOCUS_CRIT * (world.focus ?? 0)) / FOCUS_MAX : 0;
  const roll = miss ? null : rollHit(physicalRange(stats, stats.weaponType, (s.pct * s.scale) / 100), stats, m.def, char.level, Math.random, extraCrit);
  const spark = hasGale(char) ? 'galehit' : hasFocus(char) ? 'focushit' : undefined;
  world.pending.push({
    at: world.now + delay, mob: m, miss, damage: roll?.damage ?? 0, crit: roll?.crit ?? false, fromX: body.x, stack, knock: s.knock, launch: s.launch, big: s.big, stop: s.stop, shake: s.shake, element,
    via: s.shot ?? (s.rain ? 'rain' : undefined), stun: miss ? undefined : s.stun, freeze: miss ? undefined : s.freeze, burst: s.burst ?? spark, dir: s.dir,
    gauge: s.gauge ?? (s.key.startsWith('basic') ? 3 : 5), rank,
    // The archer paths' hits bring their own sprite burst, so the plain spark is left off.
    ownSpark: Boolean(spark),
  });
}

// A shot (or a fan of them, or one that pierces a line) leaves the bow or hand.
function fire(world, strike) {
  let s = strike;
  const { body } = world;
  // A gauntlet throws real stars: one each, from the set in your bag.
  let star = null;
  if (s.shot === 'star') {
    star = useStars(world.char, s.pierce ? 1 : s.fan ?? 1);
    if (!star) {
      if (world.warnTimer <= 0) world.log('Out of throwing stars!', '#ffb3c6');
      world.warnTimer = 1.5;
      return;
    }
  }
  // A full Focus turns the shot into a Deadeye: it always crits, tears through the whole line, and
  // spends the Focus.
  if (hasFocus(world.char) && (world.focus ?? 0) >= FOCUS_MAX && !s.deadeye) {
    world.focus = 0;
    s = { ...s, deadeye: true, pierce: true, targets: Math.max(s.targets ?? 1, 3) + 3, range: s.range + 60, big: true, stop: Math.max(s.stop ?? 0, 0.07), shake: Math.max(s.shake ?? 0, 2), knock: Math.max(s.knock, 200) };
    world.fx.push({ kind: 'deadeye', school: 'focus', x: body.x + s.dir * 14, y: body.y - HAND_Y, dir: s.dir, t: 0, dur: 0.5 });
    world.numbers.push({ x: body.x, y: body.y - body.h - 18, text: 'DEADEYE!', color: '#ff5a7a', t: 0, link: true });
    world.juice.push({ type: 'deadeye' });
  }
  // Shots leave from the bow hand (chest high), lifted with the pose (a backflip is mid-air).
  const ox = body.x + s.dir * 10;
  const oy = body.y - HAND_Y - (moveAt(s.move, s.at, s.dur)?.lift ?? 0) + (s.oy ?? 0);
  // A recoiling shot kicks you back (`recoil` in the air hops you up; `kickback` shoves you on
  // the ground), and some burst at the bow as they go (`muzzle`).
  if (s.recoil) body.vy = Math.min(body.vy, -s.recoil);
  if (s.kickback && body.onGround) world.lunge = { v: (-s.dir * s.kickback) / 0.14, until: world.now + 0.14 };
  if (s.muzzle) world.fx.push({ kind: s.muzzle, school: s.school, x: ox, y: oy, dir: s.dir, t: 0, dur: 0.6, seed: Math.random() });
  const speed = s.speed ?? 680;
  const box = { w: s.range, h: s.h ?? 60 };
  const element = star?.star.element ?? (s.key.startsWith('basic') ? weaponElement(world.char) : null);
  // A twin arrow trails its first a beat behind (`lag`). A Sniper's bolts leave a thin tracer to
  // where they're headed that shrinks toward the hit (research/archery.md 30).
  const lag = s.lag ?? 0;
  const tracer = hasFocus(world.char);
  const fly = (tx, ty) => {
    const travel = Math.max(0.06, Math.hypot(tx - ox, ty - oy) / speed);
    world.fx.push({ kind: 'projectile', weapon: world.stats.weaponType, shot: s.shot, school: s.school, element, starColor: star?.color, bend: s.bend, x: ox, y: oy, tx, ty, t: -lag, dur: travel });
    // A gale shot leaves a band of wind hanging along the path it tore through.
    if (s.shot === 'galearrow' || s.shot === 'cyclone') world.fx.push({ kind: 'windtrail', x: ox, y: oy, tx, ty, big: s.shot === 'cyclone', t: -lag, dur: 0.75 });
    if (tracer) world.fx.push({ kind: 'tracer', x: ox, y: oy, tx, ty, big: s.big || s.deadeye, t: 0, dur: Math.max(0.14, travel + 0.08) });
    return travel + lag;
  };
  // A little snap of the string (or flick of the wrist) as it goes; a heavy shot kicks back.
  // (The archer paths use effect sprites: a gust of leaves or sparks off the bolt.)
  if (hasFocus(world.char)) world.fx.push({ kind: 'boltshock', x: ox, y: oy, dir: s.dir, t: 0, dur: 0.35, small: true });
  else if (!hasGale(world.char)) world.fx.push({ kind: 'spark', x: ox, y: oy, t: 0, dur: 0.16, muzzle: true });
  // Heavy shots kick the view back; every Sniper bolt does a little (research/archery.md 37).
  if (s.big) world.juice.push({ type: 'kick', x: -s.dir * 2, y: 0 });
  else if (tracer) world.juice.push({ type: 'kick', x: -s.dir * 1, y: 0 });
  // Shots aimed up or down (`lift`, `drop`) look for monsters above or below you.
  if (s.lift || s.drop) box.dy = (s.drop ?? 0) - (s.lift ?? 0);
  // A full Gale looses a twin arrow beside every basic shot, a little lighter.
  // ...and two wind spirits that swoop out on curves and home in (Wind Archer's Trifling Wind).
  if (hasGale(world.char) && (world.gale ?? 0) >= GALE_MAX && s.key.startsWith('basic') && !s.twin) {
    fire(world, { ...s, twin: true, fan: 1, pierce: false, pct: s.pct * 0.6, oy: -5, lag: 0.04, big: false, stop: 0, shake: 0, gauge: 1 });
    for (const bend of [-38, 38]) fire(world, { ...s, shot: 'wisp', twin: true, fan: 1, pierce: false, pct: s.pct * 0.4, speed: 480, bend, lag: 0.08, burst: 'galehit', big: false, stop: 0, shake: 0, gauge: 1 });
  }
  // A finisher shot that finds a mark opens a Link too (see land).
  if (s.finisher && pickTargets(world.mobs, body, box, 1).length) world.finisherAt = { at: world.now, key: s.key };
  if (s.pierce) {
    const line = pickTargets(world.mobs, body, box, s.targets ?? 1);
    // A whirling shot keeps cutting what it passes (`ticks` more times, `tickGap` apart).
    line.forEach((m, i) => {
      const at = Math.abs(m.x - ox) / speed + lag;
      // Each monster it passes through lands a little bigger than the last (Piercing Arrow).
      shotHit(world, s, m, at, i % 3, element, i);
      for (let k = 1; k <= (s.ticks ?? 0); k++) shotHit(world, { ...s, knock: 10, stop: 0, shake: 0, big: false, gauge: 1 }, m, at + k * s.tickGap, (i + k) % 3, element);
    });
    fly(ox + s.dir * s.range, oy);
    return;
  }
  const n = s.fan ?? 1;
  const targets = pickTargets(world.mobs, body, box, n);
  for (let i = 0; i < n; i++) {
    const m = targets[i];
    if (m) {
      const travel = fly(m.x, m.y - (m.air ?? 0) - m.def.h / 2);
      shotHit(world, s, m, travel, 0, element);
      // A blast bolt bursts where it lands, catching everything close around it too.
      if (s.blast) {
        const near = world.mobs.filter((o) => o !== m && o.hp > 0 && Math.abs(o.x - m.x) <= s.blast && Math.abs(o.y - m.y) < 70).slice(0, (s.targets ?? 4) - 1);
        // It spreads outward from the hit rather than catching them all at once (archery.md 23).
        near.forEach((o, k) => shotHit(world, { ...s, burst: s.blastFx ?? 'spark', pct: s.pct * 0.7 }, o, travel + 0.05 + Math.abs(o.x - m.x) / 400, (k + 1) % 3, element));
      }
    } else {
      // Nothing to aim at: it flies off at its place in the fan (angled down from the air).
      const a = (n > 1 ? (i / (n - 1) - 0.5) * 0.7 : 0) + (s.drop ? 0.45 : s.lift ? -0.6 : 0);
      fly(ox + s.dir * Math.cos(a) * s.range, oy + Math.sin(a) * s.range);
    }
  }
}

// Arrows rain down on the monsters in an area ahead, one after another.
function rain(world, s) {
  const { body } = world;
  // `around` rains on both sides of you at once.
  const x0 = s.around ? body.x - s.rainW / 2 : s.dir > 0 ? body.x + s.rainFrom : body.x - s.rainFrom - s.rainW;
  const area = world.mobs.filter((m) => m.hp > 0 && m.x >= x0 && m.x <= x0 + s.rainW && Math.abs(m.y - body.y) < 120);
  for (let k = 0; k < s.rain; k++) {
    const delay = 0.12 + (k * s.span) / s.rain;
    const m = area.length ? area[k % area.length] : null;
    const x = m ? m.x + ((k * 13) % 17) - 8 : x0 + ((k * 37) % s.rainW);
    world.fx.push({ kind: 'rain', variant: s.variant ?? 'arrow', school: s.school ?? 'wind', x, y: m ? m.y : body.y, h: m ? m.def.h : 20, t: -delay, dur: 0.45, seed: k });
    if (m) shotHit(world, s, m, delay + 0.18, k % 3);
  }
}
