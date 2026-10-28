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

import { physicalRange, magicRange, rollHit, accuracy, hitChance } from '../core/formulas.js';
import { JOBS, jobChain } from '../data/jobs.js';
import { pickTargets, weaponElement } from './combat.js';
import { moveAt } from '../render/moves.js';
import { useStars } from '../core/inventory.js';
import { provoke, healMembers } from './dungeon.js';

// The longest freeze a blow gets; anything heavier turns the rest into slow motion.
export const MAX_STOP = 0.1;

// How long after a step ends you can still carry the combo on.
const WINDOW = 0.45;
// A step can be cut short into the next one this far through (heavy finishers play out longer).
const CANCEL = 0.76;

// The beat of recovery after a move before the next one can start (a real game's action delay),
// by its weight: a skill plays out its whole motion and then this; steps inside one skill's own
// chain flow on almost at once; a basic combo's finisher and the command moves end with a beat
// too. So nothing can be mashed out faster than it can be seen (CLAUDE.md, combat rules).
export const AFTER = { chain: 0.06, skill: 0.2, heavy: 0.3, finisher: 0.45, basicFinisher: 0.22, command: 0.12 };
const heavyStep = (step) => step.dur >= 0.7 || step.strikes.some((st) => st.big || st.launch);

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
// Whether a basic attack plays a job's own combo (a Mage's wand has no plain combo of its own).
export const hasPathCombo = (world) => Boolean(PATH_COMBOS[pathOf(world)]);

// The warrior paths' own basic combos. The Paladin: a measured cut behind the shield arm, a shield
// shove that dazes, a lunging thrust, and a two-handed smite. The Berserker: a huge wound-up
// cleave, the return cleave, and a leaping skull-splitter; slower, and every one heavy.
// The first jobs fight their own way too. The Warrior: a quick cut, the return cut, then a
// heavy two-handed cleave that knocks them flying. The Archer: a snap shot, a double shot (two
// gold arrows a beat apart), then a full draw whose hawk arrow tears through the line.
export const PATH_COMBOS = {
  warrior: [
    { move: 'slash', dur: 0.4, step: 7, strikes: [{ at: 0.45, pct: 90, reach: 68, h: 58, knock: 40, arc: [-115, 205] }] },
    { move: 'slash2', dur: 0.4, step: 7, strikes: [{ at: 0.45, pct: 95, reach: 68, h: 62, knock: 40, arc: [100, -215] }] },
    { move: 'cleave', dur: 0.62, step: 12, finisher: true, strikes: [{ at: 0.5, pct: 200, reach: 94, h: 78, targets: 3, knock: 250, launch: 300, arc: [-170, 330], thick: 13, big: true, stop: 0.09, shake: 3 }] },
  ],
  archer: [
    { move: 'quickshot', dur: 0.44, step: -3, strikes: [{ at: 0.5, shot: 'hawkarrow', pct: 90, range: 300, h: 60, knock: 25, speed: 800 }] },
    { move: 'rapid', dur: 0.46, step: -4, strikes: [{ at: 0.17, shot: 'hawkarrow', pct: 60, range: 300, h: 60, knock: 20, speed: 800 }, { at: 0.5, shot: 'hawkarrow', pct: 65, range: 300, h: 60, knock: 30, speed: 800 }] },
    { move: 'draw', dur: 0.62, step: -10, finisher: true, strikes: [{ at: 0.62, shot: 'hawkbig', pct: 175, range: 330, h: 60, targets: 3, pierce: true, speed: 900, knock: 210, big: true, stop: 0.06, shake: 2 }] },
  ],
  // The Thief, by weapon. With a dagger: a stab, a quick slash, then an X-cut that throws them
  // back. With a gauntlet: a star, two stars, then a big spinning moon star through the line.
  // The Mage: a petal bolt, a second, then a bursting blossom bolt through the line.
  mage: [
    { move: 'castforward', dur: 0.44, step: -2, strikes: [{ at: 0.5, shot: 'petalbolt', magic: true, pct: 90, range: 280, h: 60, knock: 25, speed: 600 }] },
    { move: 'castforward', dur: 0.44, step: -2, strikes: [{ at: 0.5, shot: 'petalbolt', magic: true, pct: 95, range: 280, h: 60, knock: 25, speed: 600 }] },
    { move: 'castspin', dur: 0.6, step: -6, finisher: true, strikes: [{ at: 0.55, shot: 'bloombolt', magic: true, pct: 170, range: 300, h: 64, targets: 3, pierce: true, speed: 680, knock: 190, big: true, stop: 0.06, shake: 2 }] },
  ],
  thiefdagger: [
    { move: 'thrust', dur: 0.28, step: 8, strikes: [{ at: 0.42, pct: 85, reach: 58, h: 46, knock: 30, pierce: true }] },
    { move: 'slash', dur: 0.3, step: 6, strikes: [{ at: 0.45, pct: 90, reach: 58, h: 52, knock: 35, arc: [-100, 190], thick: 5 }] },
    { move: 'cross', dur: 0.46, step: 10, finisher: true, strikes: [{ at: 0.22, pct: 85, reach: 62, h: 54, knock: 60, arc: [-110, 200], thick: 6 }, { at: 0.72, pct: 120, reach: 62, h: 56, knock: 170, arc: [100, -210], thick: 7, big: true, stop: 0.06 }] },
  ],
  thiefstar: [
    { move: 'throw', dur: 0.38, step: -2, strikes: [{ at: 0.5, shot: 'star', pct: 85, range: 280, h: 60, knock: 25, speed: 760 }] },
    { move: 'barrage', dur: 0.4, step: -2, strikes: [{ at: 0.17, shot: 'star', pct: 55, range: 280, h: 60, knock: 20, speed: 760 }, { at: 0.5, shot: 'star', pct: 60, range: 280, h: 60, knock: 25, speed: 760, oy: 4 }] },
    { move: 'throw', dur: 0.5, step: -8, finisher: true, strikes: [{ at: 0.5, shot: 'moonstar', pct: 150, range: 310, h: 60, targets: 2, pierce: true, speed: 820, knock: 190, big: true, stop: 0.05, shake: 2 }] },
  ],
  // The Thief's paths. The Assassin: a stab, a slash, a slip through the line, then a turning
  // backstab. The Night Lord: three stars, three more, then a giant star through the line.
  assassin: [
    { move: 'thrust', dur: 0.28, step: 8, strikes: [{ at: 0.42, pct: 95, reach: 62, h: 46, knock: 30, pierce: true }] },
    { move: 'slash', dur: 0.3, step: 6, strikes: [{ at: 0.45, pct: 100, reach: 62, h: 52, knock: 35, arc: [-100, 190], thick: 6 }] },
    { move: 'backstab', dur: 0.5, step: 70, carry: 0.35, finisher: true, strikes: [{ at: 0.62, pct: 190, reach: 66, h: 54, targets: 2, turn: true, backstab: 1.5, pierce: true, knock: 180, big: true, stop: 0.07, shake: 2 }] },
  ],
  nightlord: [
    { move: 'barrage', dur: 0.4, step: -2, strikes: [0.17, 0.5, 0.83].map((at, i) => ({ at, shot: 'star', pct: 55, range: 290, h: 60, knock: 20, speed: 800, oy: (i - 1) * 4 })) },
    { move: 'barrage', dur: 0.4, step: -2, strikes: [0.17, 0.5, 0.83].map((at, i) => ({ at, shot: 'star', pct: 58, range: 290, h: 60, knock: 25, speed: 800, oy: (1 - i) * 4 })) },
    { move: 'throw', dur: 0.56, step: -8, finisher: true, strikes: [{ at: 0.5, shot: 'giantstar', pct: 170, range: 300, h: 70, targets: 3, pierce: true, speed: 700, knock: 200, big: true, stop: 0.06, shake: 2 }] },
  ],
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
    { move: 'kneelshot', dur: 0.56, step: -2, strikes: [{ at: 0.56, shot: 'heavybolt', pct: 120, range: 330, h: 56, knock: 80, speed: 760, pierce: true, targets: 2 }] },
    { move: 'crankshot', dur: 0.62, step: -3, charge: true, strikes: [{ at: 0.66, shot: 'heavybolt', pct: 130, range: 330, h: 56, knock: 90, speed: 760, pierce: true, targets: 2 }] },
    { move: 'ballista', dur: 0.82, step: -12, finisher: true, strikes: [{ at: 0.64, shot: 'blastbolt', pct: 210, range: 350, h: 56, blast: 56, targets: 4, speed: 720, knock: 220, launch: 140, big: true, stop: 0.08, shake: 3, burst: 'blast' }] },
  ],
};

// The archer paths' command shots. Up + attack: a shot up at whatever flies, knocking it higher.
// In the air: shots that hold you up (`hang`) and loose down at them; a Sniper's bolt kicks her
// back up (`recoil`). Running: the Ranger slides in under them loosing two arrows, the Sniper rolls
// and comes up on one knee with a bolt.
const ARCHER_COMMANDS = {
  // The Mage: a bolt cast up at whatever flies, petal bolts cast down from a float in the air,
  // and a bolt cast out of a glide.
  mage: {
    up: { move: 'castup', dur: 0.5, step: -2, strikes: [{ at: 0.5, shot: 'bloombolt', magic: true, pct: 110, range: 260, h: 190, lift: 50, targets: 2, pierce: true, knock: 20, launch: 380, speed: 650, big: true, stop: 0.05 }] },
    air: [
      { move: 'castforward', dur: 0.4, hang: true, strikes: [{ at: 0.5, shot: 'petalbolt', magic: true, fan: 2, pct: 75, range: 260, h: 170, drop: 50, knock: 30, speed: 620 }] },
      { move: 'castspin', dur: 0.46, hang: true, finisher: true, strikes: [{ at: 0.55, shot: 'bloombolt', magic: true, fan: 2, pct: 95, range: 260, h: 190, drop: 60, knock: 120, speed: 660, big: true, stop: 0.05, shake: 1 }] },
    ],
    dash: { move: 'castforward', dur: 0.46, step: 40, carry: 0.5, strikes: [{ at: 0.5, shot: 'petalbolt', magic: true, fan: 2, pct: 85, range: 280, h: 80, knock: 80, speed: 640 }] },
  },
  // The Night Lord: a giant star flung up at whatever flies, a fan of three from a hang in the air,
  // and stars thrown out of a dash.
  nightlord: {
    up: { move: 'upthrow', dur: 0.46, step: -2, strikes: [{ at: 0.45, shot: 'giantstar', pct: 130, range: 260, h: 190, lift: 50, targets: 3, pierce: true, knock: 20, launch: 400, speed: 700, big: true, stop: 0.05 }] },
    air: [
      { move: 'airthrow', dur: 0.34, hang: true, strikes: [{ at: 0.45, shot: 'nightstar', fan: 3, pct: 75, range: 260, h: 170, drop: 50, knock: 30, speed: 800 }] },
      { move: 'airthrow', dur: 0.4, hang: true, finisher: true, strikes: [{ at: 0.5, shot: 'giantstar', pct: 120, range: 260, h: 190, drop: 60, targets: 3, pierce: true, knock: 140, speed: 720, big: true, stop: 0.05, shake: 1 }] },
    ],
    dash: { move: 'dashstab', dur: 0.44, step: 40, carry: 0.5, strikes: [{ at: 0.4, shot: 'nightstar', fan: 3, pct: 85, range: 290, h: 90, knock: 90, speed: 820 }] },
  },
  // The Thief with a gauntlet: a star flung up at whatever flies, stars thrown down from a hang in
  // the air, and a star thrown out of a run.
  thiefstar: {
    up: { move: 'upthrow', dur: 0.44, step: -2, strikes: [{ at: 0.45, shot: 'star', fan: 2, pct: 100, range: 260, h: 190, lift: 50, knock: 20, launch: 360, speed: 760, big: true, stop: 0.04 }] },
    air: [
      { move: 'airthrow', dur: 0.34, hang: true, strikes: [{ at: 0.45, shot: 'star', fan: 2, pct: 75, range: 260, h: 170, drop: 50, knock: 30, speed: 760 }] },
      { move: 'airthrow', dur: 0.4, hang: true, finisher: true, strikes: [{ at: 0.5, shot: 'moonstar', fan: 2, pct: 95, range: 260, h: 190, drop: 60, knock: 120, speed: 820, big: true, stop: 0.05, shake: 1 }] },
    ],
    dash: { move: 'dashstab', dur: 0.44, step: 40, carry: 0.5, strikes: [{ at: 0.45, shot: 'star', fan: 2, pct: 85, range: 280, h: 80, knock: 80, speed: 800 }] },
  },
  // The Archer: a shot up that pops fliers higher, two shots loosed down from a hang in the air, and
  // a sliding shot out of a run.
  archer: {
    up: { move: 'skyshot', dur: 0.5, step: -2, strikes: [{ at: 0.5, shot: 'hawkbig', fan: 2, pct: 105, range: 280, h: 190, lift: 50, knock: 20, launch: 360, speed: 880, big: true, stop: 0.05 }] },
    air: [
      { move: 'airshot', dur: 0.38, hang: true, strikes: [{ at: 0.45, shot: 'hawkarrow', fan: 2, pct: 75, range: 280, h: 170, drop: 50, knock: 30, speed: 880 }] },
      { move: 'airshot2', dur: 0.42, hang: true, finisher: true, strikes: [{ at: 0.5, shot: 'hawkbig', fan: 2, pct: 95, range: 280, h: 190, drop: 60, knock: 120, speed: 920, big: true, stop: 0.05, shake: 1 }] },
    ],
    dash: { move: 'slideshot', dur: 0.5, step: 44, carry: 0.6, strikes: [{ at: 0.42, shot: 'hawkarrow', pct: 95, range: 300, h: 60, knock: 80, speed: 880 }] },
  },
  ranger: {
    up: { move: 'skyshot', dur: 0.5, step: -2, strikes: [{ at: 0.5, shot: 'galearrow', fan: 2, pct: 110, range: 280, h: 190, lift: 50, knock: 20, launch: 380, speed: 900, big: true, stop: 0.05 }] },
    air: [
      { move: 'airshot', dur: 0.36, hang: true, strikes: [{ at: 0.45, shot: 'windarrow', fan: 2, pct: 75, range: 280, h: 170, drop: 50, knock: 30, speed: 900 }] },
      { move: 'airshot2', dur: 0.42, hang: true, finisher: true, strikes: [{ at: 0.5, shot: 'galearrow', fan: 3, pct: 90, range: 280, h: 190, drop: 60, knock: 120, speed: 950, big: true, stop: 0.05, shake: 1 }] },
    ],
    dash: { move: 'slideshot', dur: 0.5, step: 46, carry: 0.6, strikes: [{ at: 0.35, shot: 'windarrow', pct: 80, range: 300, h: 60, knock: 30, speed: 900 }, { at: 0.62, shot: 'windarrow', pct: 90, range: 300, h: 60, knock: 90, speed: 900 }] },
  },
  sniper: {
    up: { move: 'skyshot', dur: 0.56, step: -4, strikes: [{ at: 0.52, shot: 'heavybolt', pct: 140, range: 300, h: 190, lift: 50, knock: 30, launch: 420, speed: 760, big: true, stop: 0.06, shake: 1 }] },
    air: [
      { move: 'airshot', dur: 0.5, hang: true, strikes: [{ at: 0.5, shot: 'heavybolt', pct: 120, range: 300, h: 170, drop: 50, knock: 80, recoil: 260, speed: 760, pierce: true, targets: 2 }] },
    ],
    dash: { move: 'rollshot', dur: 0.66, step: 40, carry: 0.45, guard: 0.3, strikes: [{ at: 0.66, shot: 'heavybolt', pct: 150, range: 330, h: 56, knock: 160, speed: 760, pierce: true, targets: 3, big: true, stop: 0.05, shake: 1 }] },
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
// The Thief's own dagger commands: a quick flipping launcher, three fast air stabs then a diving
// stab, and a dash that slips through the line stabbing as it goes.
const DAGGER_COMMANDS = {
  up: { move: 'rising', dur: 0.42, step: 6, strikes: [{ at: 0.38, pct: 105, reach: 64, h: 84, targets: 3, knock: 20, launch: 460, hop: 420, arc: [80, -175], thick: 6, big: true, stop: 0.05 }] },
  air: [
    { move: 'airslash', dur: 0.28, hang: true, strikes: [{ at: 0.45, pct: 80, reach: 60, h: 80, targets: 2, knock: 10, launch: 140, arc: [-115, 205], thick: 5 }] },
    { move: 'airslash2', dur: 0.28, hang: true, strikes: [{ at: 0.45, pct: 80, reach: 60, h: 80, targets: 2, knock: 10, launch: 150, arc: [100, -215], thick: 5 }] },
    { move: 'meteor', dur: 0.44, dive: 820, finisher: true, strikes: [{ onLand: true, pct: 170, reach: 70, h: 64, around: true, targets: 4, knock: 180, big: true, stop: 0.07, shake: 3 }] },
  ],
  dash: { move: 'dashstab', dur: 0.4, step: 60, carry: 0.6, strikes: [{ at: 0.32, pct: 90, reach: 80, h: 50, targets: 3, pierce: true, knock: 60 }, { at: 0.55, pct: 110, reach: 80, h: 50, targets: 3, pierce: true, knock: 180, big: true, stop: 0.04 }] },
};
// The Assassin's dagger commands: a launcher that scatters crows, fast air cuts then a plunging
// stab, and out of a run a slip through the monster that turns and stabs it in the back.
const ASSASSIN_COMMANDS = {
  up: { ...DAGGER_COMMANDS.up, strikes: [{ ...DAGGER_COMMANDS.up.strikes[0], pct: 125, burst: 'crowburst', burstAt: 0.5 }] },
  air: DAGGER_COMMANDS.air.map((st, i) => ({ ...st, strikes: st.strikes.map((x) => ({ ...x, pct: x.pct * 1.15, ...(i === 2 ? { burst: 'crowburst', burstAt: 0 } : {}) })) })),
  dash: { move: 'backstab', dur: 0.48, step: 80, carry: 0.35, strikes: [{ at: 0.62, pct: 170, reach: 66, h: 54, targets: 2, turn: true, backstab: 1.5, pierce: true, knock: 170, big: true, stop: 0.06 }] },
};
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
// critical (up to FOCUS_CRIT more at full); while full, every bolt is a Deadeye: it always crits
// and tears through the whole line. Her finisher spends it.
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
// Valor: the Warrior's gauge (first job; the paths have their own). Every blow that lands builds
// it, and faster the more monsters one blow catches at once; it fades once the fighting stops.
// Full (Unbroken), his blows land heavier and knock harder, and nothing knocks him back.
export const VALOR_MAX = 100;
const VALOR_HOLD = 5;
const VALOR_DRAIN = 12;
export const hasValor = (char) => char.job === 'warrior';
export function addValor(world, n) {
  if (!hasValor(world.char) || n <= 0) return;
  world.valor = Math.min(VALOR_MAX, (world.valor ?? 0) + n);
  world.valorAt = world.now;
}
export const unbroken = (world) => hasValor(world.char) && (world.valor ?? 0) >= VALOR_MAX;
// Momentum: the Archer's gauge (first job). Shots that land build it, more for each one landed in
// a row (`streak`, kept while they land within MOMENTUM_ROW seconds of each other); taking a hit
// knocks half of it away, and it fades once the fighting stops. Full (Hawkeye), arrows fly faster
// and curve to find monsters above and below.
export const MOMENTUM_MAX = 100;
const MOMENTUM_HOLD = 4;
const MOMENTUM_DRAIN = 14;
const MOMENTUM_ROW = 1.6;
export const MOMENTUM_LOSS = 0.5;
export const hasMomentum = (char) => char.job === 'archer';
export function addMomentum(world, n) {
  if (!hasMomentum(world.char) || n <= 0) return;
  world.streak = world.now - (world.momentumAt ?? -9) <= MOMENTUM_ROW ? (world.streak ?? 0) + 1 : 0;
  world.momentum = Math.min(MOMENTUM_MAX, (world.momentum ?? 0) + n * (1 + 0.1 * Math.min(10, world.streak)));
  world.momentumAt = world.now;
}
export const hawkeye = (world) => hasMomentum(world.char) && (world.momentum ?? 0) >= MOMENTUM_MAX;
// Getting hit breaks an Archer's rhythm: half her Momentum and the streak are gone.
export function loseMomentum(world) {
  if (!hasMomentum(world.char) || !world.momentum) return;
  world.momentum *= 1 - MOMENTUM_LOSS;
  world.streak = 0;
}
// Shadow: the Thief's gauge (first job, both weapons). Hits that land in quick chains build it,
// each one more while the chain lasts (`chain`, kept while hits land within SHADOW_CHAIN seconds of
// each other); it fades fast once the fighting stops. Full (Phantom), a shadow copy of the thief
// repeats every attack a beat later, at PHANTOM_POWER of its strength.
export const SHADOW_MAX = 100;
const SHADOW_HOLD = 3;
const SHADOW_DRAIN = 16;
const SHADOW_CHAIN = 0.9;
export const PHANTOM_POWER = 0.5;
const PHANTOM_LAG = 0.1;
export const hasShadow = (char) => char.job === 'thief';
export function addShadow(world, n) {
  if (!hasShadow(world.char) || n <= 0) return;
  world.chain = world.now - (world.shadowAt ?? -9) <= SHADOW_CHAIN ? (world.chain ?? 0) + 1 : 0;
  world.shadow = Math.min(SHADOW_MAX, (world.shadow ?? 0) + n * (1 + 0.12 * Math.min(10, world.chain)));
  world.shadowAt = world.now;
}
export const phantom = (world) => hasShadow(world.char) && (world.shadow ?? 0) >= SHADOW_MAX;
// Killing Intent: the Assassin's gauge. Every cut builds it, far more from behind, on a crit or on
// a monster marked for death; it fades once the fighting stops. Full (Execution), the first cut on
// each monster is sure to crit, and a monster under EXECUTE of its HP dies in that cut (not
// bosses).
export const INTENT_MAX = 100;
const INTENT_HOLD = 5;
const INTENT_DRAIN = 12;
export const EXECUTE = 0.25;
export const hasIntent = (char) => jobChain(char.job).includes('assassin');
export function addIntent(world, n) {
  if (!hasIntent(world.char) || n <= 0) return;
  world.killintent = Math.min(INTENT_MAX, (world.killintent ?? 0) + n);
  world.killintentAt = world.now;
}
export const execution = (world) => hasIntent(world.char) && (world.killintent ?? 0) >= INTENT_MAX;
// Starlight: the Night Lord's gauge. Stars that land build it, more when they pile onto a monster
// hit lately (up to five times as much); it fades once the fighting stops. Full (Constellation),
// every star thrown splits into three.
export const STARLIGHT_MAX = 100;
const STARLIGHT_HOLD = 4;
const STARLIGHT_DRAIN = 14;
const FOCUS_FIRE = 2; // seconds a monster stays "hit lately"
export const hasStarlight = (char) => jobChain(char.job).includes('nightlord');
export function addStarlight(world, n, mob = null) {
  if (!hasStarlight(world.char) || n <= 0) return;
  let k = 1;
  if (mob) {
    mob.starHits = world.now - (mob.starAt ?? -9) <= FOCUS_FIRE ? (mob.starHits ?? 0) + 1 : 0;
    mob.starAt = world.now;
    k += 0.25 * Math.min(16, mob.starHits);
  }
  world.starlight = Math.min(STARLIGHT_MAX, (world.starlight ?? 0) + n * Math.min(5, k));
  world.starlightAt = world.now;
}
export const constellation = (world) => hasStarlight(world.char) && (world.starlight ?? 0) >= STARLIGHT_MAX;
// Bloom: the Mage's gauge (first job). Spells that land and heals build it; it fades once the
// fighting stops. Full (Full Bloom), every damage spell also heals allies near where it lands
// (BLOOM_HEAL of their max HP).
export const BLOOM_MAX = 100;
const BLOOM_HOLD = 5;
const BLOOM_DRAIN = 10;
export const BLOOM_HEAL = 0.03;
export const hasBloom = (char) => char.job === 'mage';
export function addBloom(world, n) {
  if (!hasBloom(world.char) || n <= 0) return;
  world.bloom = Math.min(BLOOM_MAX, (world.bloom ?? 0) + n);
  world.bloomAt = world.now;
}
export const fullBloom = (world) => hasBloom(world.char) && (world.bloom ?? 0) >= BLOOM_MAX;
// Heals you and the party members within `r` of (x, y) by `pct` of max HP (a heal spell, or Full
// Bloom's petals where a spell lands); healing builds Bloom.
export function healAround(world, x, y, pct, r) {
  const { char, body, stats } = world;
  if (Math.abs(body.x - x) <= r && Math.abs(body.y - y) < 160 && char.hp < stats.maxHp && !world.dead) {
    const amount = Math.max(1, Math.round(stats.maxHp * pct));
    char.hp = Math.min(stats.maxHp, char.hp + amount);
    world.numbers.push({ x: body.x, y: body.y - body.h - 6, text: `+${amount}`, color: '#7ee0b0', t: 0 });
    world.fx.push({ kind: 'healglow', x: body.x, y: body.y, t: 0, dur: 0.7 });
  }
  if (world.dungeon) healMembers(world, pct, { x: x - r, y: y - 160, w: r * 2, h: 320 });
  addBloom(world, 40 * pct);
}
// The thrown stars a gauntlet uses up (one each from the set in your bag).
const STAR_SHOTS = new Set(['star', 'moonstar', 'nightstar', 'giantstar']);
// A job's own gauge: which one the character has ('bloom', 'killintent', 'starlight', 'valor', 'momentum',
// 'shadow', 'rage', 'faith', 'gale' or 'focus'), and how full it is (0-1). Finishers need it full
// and spend it.
export function gaugeOf(char) {
  return hasBloom(char) ? 'bloom' : hasIntent(char) ? 'killintent' : hasStarlight(char) ? 'starlight' : hasValor(char) ? 'valor' : hasMomentum(char) ? 'momentum' : hasShadow(char) ? 'shadow' : hasRage(char) ? 'rage' : hasFaith(char) ? 'faith' : hasGale(char) ? 'gale' : hasFocus(char) ? 'focus' : null;
}
export function gaugeFull(world) {
  const g = gaugeOf(world.char);
  return Boolean(g) && (world[g] ?? 0) >= 100;
}

// What a shot that lands builds on an archer path's gauge (see world.js).
export function addAim(world, n, mob = null) {
  addBloom(world, n);
  addStarlight(world, n, mob);
  addMomentum(world, n);
  addShadow(world, n);
  addGale(world, n);
  addFocus(world, n);
}
// The path a basic attack fights in: a warrior path with a blade, an archer path with its bow.
function pathOf(world) {
  const { char } = world;
  const w = world.stats.weaponType;
  if ((w === 'wand' || w === 'staff') && hasBloom(char)) return 'mage';
  if (w === 'dagger' && hasIntent(char)) return 'assassin';
  if (w === 'gauntlet' && hasStarlight(char)) return 'nightlord';
  if (hasShadow(char) && (w === 'dagger' || w === 'gauntlet')) return w === 'dagger' ? 'thiefdagger' : 'thiefstar';
  if (MELEE.has(w) && w !== 'none') return hasValor(char) ? 'warrior' : hasRage(char) ? 'berserker' : hasFaith(char) ? 'paladin' : null;
  if ((w === 'bow' || w === 'crossbow') && hasMomentum(char)) return 'archer';
  if (w === 'bow' && hasGale(char)) return 'ranger';
  if (w === 'crossbow' && hasFocus(char)) return 'sniper';
  return null;
}

// Rage makes a Berserker's blows hit harder: up to RAGE_POWER more at full Rage.
const RAGE_POWER = 0.25;
// How much heavier each path's blows land: longer hit-stop, harder knockback.
const WEIGHT = { berserker: 1.4, paladin: 1.2, unbroken: 1.35 };
// Unbroken (full Valor) lands a Warrior's blows heavier too.
const weightOf = (world) => (hasRage(world.char) ? WEIGHT.berserker : hasFaith(world.char) ? WEIGHT.paladin : unbroken(world) ? WEIGHT.unbroken : 1);
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
    const own = { thiefdagger: DAGGER_COMMANDS, assassin: ASSASSIN_COMMANDS }[pathOf(world)] ?? null;
    const air = own?.air ?? AIR;
    if (!body.onGround && !body.rope) {
      if ((world.airCombo ?? 0) >= air.length) return;
      playStep(world, air[world.airCombo], 100, `basicair${world.airCombo}`);
      world.airCombo += 1;
      return;
    }
    if (world.intent?.up) {
      playStep(world, own?.up ?? LAUNCHER, 100, 'basiclaunch');
      world.combo = -1;
      return;
    }
    if ((world.runFor ?? 0) >= DASH_AFTER) {
      playStep(world, own?.dash ?? DASH, 100, 'basicdash');
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
  const last = i === params.combo.length - 1;
  const after = !last ? AFTER.chain : params.fullGauge || step.finisher ? AFTER.finisher : heavyStep(step) ? AFTER.heavy : AFTER.skill;
  playStep(world, step, scale, skillId, params.school, after);
}

function playStep(world, step, scale, key, school = null, after = 0) {
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
  if (key.startsWith('basic')) {
    // Basic attacks keep their rhythm; a finisher or a command move ends with a beat.
    const own = /^basic(air)?\d$/.test(key);
    world.basicReadyAt = now + busy + (step.finisher ? AFTER.basicFinisher : own ? 0 : AFTER.command);
  } else {
    // A skill plays out its whole motion, then its beat; a basic attack can follow once the
    // motion is nearly over.
    world.skillReadyAt = now + dur + after;
    world.basicReadyAt = Math.max(world.basicReadyAt ?? 0, now + dur * 0.9);
  }
  // Step into it (or hop back from it): carried until the first strike lands (or through `carry`).
  const first = (step.carry ?? step.strikes[0].at) * dur;
  if (step.step) world.lunge = { v: (body.facing * step.step) / Math.max(0.05, first), until: now + first };
  if (step.guard) world.invuln = Math.max(world.invuln, step.guard);
  // A dash leaves speed lines and a shock cone along its path.
  if (step.trail) world.fx.push({ kind: 'chargetrail', school, x: body.x, y: body.y, tx: body.x + body.facing * step.step, dir: body.facing, t: 0, dur: 0.5 });
  // Warrior paths put their weight into big moves: a stomp that kicks up dust as the move starts,
  // and power gathering at the weapon until the first blow lands.
  // A Sniper plants her feet the same way, and gathers her aim at the bow.
  const heavy = hasValor(world.char) || hasShadow(world.char) || hasRage(world.char) || hasFaith(world.char) || hasFocus(world.char);
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
  // Phantom (full Shadow): a shadow copy of the thief repeats every blow and throw a beat later,
  // lighter (finishers are hers alone).
  if (phantom(world) && (!step.finisher || key.startsWith('basic'))) {
    world.phantom = { kind: step.move, since: now + PHANTOM_LAG, dur, until: now + PHANTOM_LAG + dur };
    step.strikes.forEach((s, n) => {
      if (s.onLand || (!s.pct && !s.rain)) return;
      world.strikes.push({ ...s, n, of: step.strikes.length, due: now + s.at * dur + PHANTOM_LAG, dir: body.facing, scale: scale * PHANTOM_POWER, key, school: 'shadow', finisher: false, move: step.move, dur, phantom: true, quiet: true, stop: 0, shake: 0, big: false, gauge: 0, hop: 0, burst: undefined, muzzle: undefined });
    });
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
  if (world.valor > 0 && world.now - (world.valorAt ?? 0) > VALOR_HOLD) world.valor = Math.max(0, world.valor - VALOR_DRAIN * dt);
  if (world.bloom > 0 && world.now - (world.bloomAt ?? 0) > BLOOM_HOLD) world.bloom = Math.max(0, world.bloom - BLOOM_DRAIN * dt);
  if (world.killintent > 0 && world.now - (world.killintentAt ?? 0) > INTENT_HOLD) world.killintent = Math.max(0, world.killintent - INTENT_DRAIN * dt);
  if (world.starlight > 0 && world.now - (world.starlightAt ?? 0) > STARLIGHT_HOLD) world.starlight = Math.max(0, world.starlight - STARLIGHT_DRAIN * dt);
  // Execution lasts while Killing Intent stays full: each monster gets its one sure cut.
  if (!execution(world)) world.executed = null;
  if (world.shadow > 0 && world.now - (world.shadowAt ?? 0) > SHADOW_HOLD) world.shadow = Math.max(0, world.shadow - SHADOW_DRAIN * dt);
  if (world.momentum > 0 && world.now - (world.momentumAt ?? 0) > MOMENTUM_HOLD) world.momentum = Math.max(0, world.momentum - MOMENTUM_DRAIN * dt);
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
  // Full Bloom's petals healing where a spell landed (queued for the moment it lands).
  if (s.healAt) return healAround(world, s.x, s.y, s.amount, 150);
  // Strikes follow the way you were facing when the step began; a `turn` strike (Backstab) turns
  // round to hit what you just passed.
  if (s.turn) s = { ...s, dir: -s.dir, turn: false };
  body.facing = s.dir;
  if (s.rain) return rain(world, s);
  if (s.shot) return fire(world, s);
  const range = s.around ? { w: s.reach * 2, h: s.h, around: true } : { w: s.reach, h: s.h };
  const targets = pickTargets(world.mobs, body, range, s.targets ?? 1);
  // The Assassin's own edges: Execution (full Killing Intent), a Vanish to strike out of (spent by
  // this strike), and Poisoned Blade's bleeding.
  const exec = execution(world) && !s.phantom ? (world.executed ??= new Set()) : null;
  const vanishBuff = char.buffs.vanish && char.buffs.vanish.until > now ? char.buffs.vanish : null;
  const vanished = Boolean(vanishBuff) && targets.length > 0 && !s.phantom;
  if (vanished) delete char.buffs.vanish;
  const venom = char.buffs.poisonblade?.until > now ? char.buffs.poisonblade.values.venom : 0;
  let intent = 0;
  const acc = accuracy(JOBS[char.job].family, stats, char.level);
  const power = hasRage(char) ? 1 + (RAGE_POWER * (world.rage ?? 0)) / RAGE_MAX : 1;
  const weight = weightOf(world);
  const dmgRange = s.magic ? magicRange(stats, (s.pct * s.scale * power) / 100) : physicalRange(stats, stats.weaponType, (s.pct * s.scale * power) / 100);
  const cy = body.y - body.h / 2;
  // The smear, spike, or whirl of the blow.
  if (s.pierce) {
    const x = s.dir > 0 ? body.x - 6 : body.x + 6 - s.reach;
    world.fx.push({ kind: 'pierce', x: body.x, y: body.y, dir: s.dir, box: { x, y: cy - 10, w: s.reach, h: 20 }, t: 0, dur: s.big ? 0.35 : 0.25, move: s.move, at: s.at, moveDur: s.dur });
  }
  if (s.arc) {
    world.fx.push({ kind: 'arc', snd: s.school, path: hasRage(char) ? 'rage' : hasFaith(char) ? 'holy' : hasValor(char) ? 'steel' : hasIntent(char) ? 'crow' : hasShadow(char) ? 'shadow' : null, x: body.x + s.dir * (s.around ? 0 : 10), y: cy - 2, bx: body.x, by: body.y, move: s.move, at: s.at, moveDur: s.dur, dir: s.dir, r: s.around ? s.reach * 0.8 : s.reach * 0.52, start: s.arc[0], sweep: s.arc[1], thick: s.thick ?? 7, big: s.big, flat: s.around, color: TINTS[s.school]?.[s.big ? 1 : 0] ?? (s.big ? HEAVY : BLADE), element: s.key.startsWith('basic') ? weaponElement(char) : null, t: 0, dur: s.big ? 0.32 : 0.24 });
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
    // Execution: the first cut on each monster is sure to crit (`crit` strikes always are).
    const firstCut = exec && !exec.has(m);
    let roll = miss ? null : rollHit(dmgRange, stats, m.def, char.level, Math.random, s.crit || firstCut ? 1 : 0);
    // A backstab hits harder on a monster that isn't facing you (and out of Vanish, always).
    const behind = Math.sign(m.dir || 1) === Math.sign(m.x - body.x);
    if (roll && (s.backstab || vanished) && (behind || vanished)) roll = { ...roll, damage: Math.round(roll.damage * (s.backstab ?? 1.6)), crit: true };
    // A monster marked for death takes more from every hit.
    if (roll && (m.markedUntil ?? 0) > now) roll = { ...roll, damage: Math.round(roll.damage * (1 + (m.markPower ?? 0.2))) };
    // And under Execution a weakened monster dies in its one sure cut.
    if (roll && firstCut) {
      exec.add(m);
      if (!m.def.boss && m.hp / m.def.hp < EXECUTE) {
        roll = { ...roll, damage: Math.max(roll.damage, m.hp), crit: true };
        world.fx.push({ kind: 'execute', x: m.x, y: m.y - (m.air ?? 0), h: m.def.h, dir: s.dir, t: 0, dur: 0.6 });
      }
    }
    if (roll && hasIntent(char)) intent += (s.key.startsWith('basic') ? 2 : 3) * (behind || vanished ? 2.5 : 1) * ((m.markedUntil ?? 0) > now ? 2 : 1) + (roll.crit ? 3 : 0);
    const knock = s.pull ? -Math.sign(m.x - body.x) * s.pull : s.knock * weight;
    world.pending.push({
      at: now, mob: m, miss, damage: roll?.damage ?? 0, crit: roll?.crit ?? false, fromX: body.x, stack: s.n % 3, knock, launch: s.launch, big: s.big, small: s.around && !s.big,
      stun: miss ? undefined : s.stun, bleed: miss ? undefined : s.bleed ?? (venom ? { pct: venom, secs: 3 } : undefined), school: s.school, via: s.via ?? 'blade', weapon: stats.weaponType, gauge: s.gauge,
    });
    if (s.fx) world.fx.push({ kind: s.fx, school: s.school, x: m.x, y: m.y, h: m.def.h, mob: s.mark ? m : undefined, dir: s.dir, t: -i * 0.03, dur: s.mark ? s.mark : 0.6, seed: Math.random() });
    // Mark for Death: marked monsters take more from every hit and build Killing Intent faster.
    if (s.mark && !miss) {
      m.markedUntil = now + s.mark;
      m.markPower = s.markPower;
    }
    // Each path's own spark on every blow that lands: shards of rage, or a bloom of light.
    if (!miss && (hasRage(char) || hasFaith(char))) world.fx.push({ kind: hasRage(char) ? 'ragehit' : 'holyhit', school: hasRage(char) ? 'rage' : 'holy', x: m.x, y: m.y - (m.air ?? 0), h: m.def.h, big: s.big, dir: s.dir, t: 0, dur: s.big ? 0.42 : 0.32, seed: Math.random() });
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
  // Valor builds faster the more monsters a blow catches at once (half again for each extra one).
  // A healing spell mends you and the party around you as it blooms.
  if (s.heal) healAround(world, body.x, body.y, s.heal, s.healR ?? 220);
  if (s.magic && targets.length && !s.phantom) addBloom(world, s.gauge ?? 4);
  if (intent) addIntent(world, intent * (1 + 0.3 * (targets.length - 1)) / targets.length);
  if (targets.length && !s.phantom) addShadow(world, (s.gauge ?? (s.key.startsWith('basic') ? 3 : 4)));
  if (targets.length) addValor(world, (s.gauge ?? (s.key.startsWith('basic') ? 3 : 4)) * (1 + 0.5 * (targets.length - 1)));
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
  const range = s.magic ? magicRange(stats, (s.pct * s.scale) / 100) : physicalRange(stats, stats.weaponType, (s.pct * s.scale) / 100);
  const roll = miss ? null : rollHit(range, stats, m.def, char.level, Math.random, extraCrit);
  const spark = hasBloom(char) ? 'bloomhit' : hasStarlight(char) ? 'starhit' : hasShadow(char) ? 'shadowhit' : hasMomentum(char) ? 'hawkhit' : hasGale(char) ? 'galehit' : hasFocus(char) ? 'focushit' : undefined;
  world.pending.push({
    at: world.now + delay, mob: m, miss, damage: roll?.damage ?? 0, crit: roll?.crit ?? false, fromX: body.x, stack, knock: s.knock, launch: s.launch, big: s.big, stop: s.stop, shake: s.shake, element,
    via: s.shot ?? (s.rain ? 'rain' : undefined), stun: miss ? undefined : s.stun, freeze: miss ? undefined : s.freeze, burst: s.burst ?? spark, dir: s.dir,
    gauge: s.gauge ?? (s.key.startsWith('basic') ? 3 : 5), rank,
    // The archer paths' hits bring their own sprite burst, so the plain spark is left off.
    ownSpark: Boolean(spark),
  });
  // Full Bloom: a damage spell scatters healing petals over the allies near where it lands.
  if (fullBloom(world) && !miss && s.magic && s.pct > 0) {
    world.strikes.push({ healAt: true, x: m.x, y: m.y, amount: BLOOM_HEAL, due: world.now + delay });
    world.fx.push({ kind: 'healpetals', x: m.x, y: m.y, t: -delay, dur: 0.6 });
  }
  // A star that sticks (Star Mark) glows in the monster, then bursts a moment later, catching
  // everything close by.
  if (s.stick && !miss) {
    world.fx.push({ kind: 'stuckstar', mob: m, x: m.x, y: m.y, h: m.def.h, t: -delay, dur: s.stick.delay });
    const near = [m, ...world.mobs.filter((o) => o !== m && o.hp > 0 && Math.abs(o.x - m.x) <= s.stick.r && Math.abs(o.y - m.y) < 70)];
    near.forEach((o, k) => shotHit(world, { ...s, stick: null, pct: s.stick.pct, knock: 120, burst: k ? 'starhit' : 'starpop', big: !k, stop: k ? 0 : 0.04, gauge: 2 }, o, delay + s.stick.delay, (stack + k + 1) % 3, element, rank));
  }
}

// A shot (or a fan of them, or one that pierces a line) leaves the bow or hand.
function fire(world, strike) {
  let s = strike;
  const { body } = world;
  // A gauntlet throws real stars: one each, from the set in your bag.
  let star = null;
  if (STAR_SHOTS.has(s.shot) && !s.phantom && !s.free) {
    star = useStars(world.char, s.pierce ? 1 : s.fan ?? 1);
    if (!star) {
      if (world.warnTimer <= 0) world.log('Out of throwing stars!', '#ffb3c6');
      world.warnTimer = 1.5;
      return;
    }
  }
  // While Focus is full, every shot is a Deadeye: it always crits and tears through the whole line.
  if (hasFocus(world.char) && (world.focus ?? 0) >= FOCUS_MAX && !s.deadeye) {
    s = { ...s, deadeye: true, pierce: true, targets: Math.max(s.targets ?? 1, 3) + 3, range: s.range + 60, big: true, stop: Math.max(s.stop ?? 0, 0.07), shake: Math.max(s.shake ?? 0, 2), knock: Math.max(s.knock, 200) };
    world.fx.push({ kind: 'deadeye', school: 'focus', x: body.x + s.dir * 14, y: body.y - HAND_Y, dir: s.dir, t: 0, dur: 0.5 });
    world.numbers.push({ x: body.x, y: body.y - body.h - 18, text: 'DEADEYE!', color: '#ff5a7a', t: 0, link: true });
    world.juice.push({ type: 'deadeye' });
  }
  // Hawkeye (full Momentum): arrows fly faster and reach further, and curve to find monsters above
  // and below (a taller search box, and a bend in their flight as they home in).
  if (hawkeye(world) && !s.hawkeye) {
    world.volley = ((world.volley ?? 0) + 1) % 2;
    s = { ...s, hawkeye: true, speed: (s.speed ?? 680) * 1.4, range: s.range + 70, h: Math.max(140, (s.h ?? 60) * 2), bend: s.bend ?? (world.volley ? 22 : -22) };
  }
  // Every Sniper bolt pierces: it flies on through the whole line, hitting each monster it passes
  // (at least three), out to its full range.
  if (hasFocus(world.char) && s.shot !== 'star') s = { ...s, pierce: true, targets: Math.max(s.targets ?? 1, 3) };
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
  // A twin arrow trails its first a beat behind (`lag`).
  const lag = s.lag ?? 0;
  const sniper = hasFocus(world.char);
  // A shot aimed at a monster follows it in flight (`mob`; see world.js): it homes in on where the
  // monster is now, and a piercing one keeps its line through it out to `reach`.
  const fly = (tx, ty, mob = null, reach = 0) => {
    const travel = Math.max(0.06, Math.hypot(tx - ox, ty - oy) / speed);
    world.fx.push({ kind: 'projectile', weapon: world.stats.weaponType, shot: s.shot, school: s.school, element, starColor: star?.color, bend: s.bend, shadow: hasShadow(world.char) || hasStarlight(world.char), night: hasStarlight(world.char), phantom: s.phantom, x: ox, y: oy, tx, ty, mob, reach, t: -lag, dur: travel });
    // A gale shot leaves a band of wind hanging along the path it tore through.
    if (s.shot === 'galearrow' || s.shot === 'cyclone') world.fx.push({ kind: 'windtrail', x: ox, y: oy, tx, ty, big: s.shot === 'cyclone', t: -lag, dur: 0.75 });
    return travel + lag;
  };
  // A little snap of the string (or flick of the wrist) as it goes; a heavy shot kicks back.
  // (The archer paths use effect sprites: a gust of leaves or sparks off the bolt.)
  if (hasFocus(world.char)) world.fx.push({ kind: 'boltshock', x: ox, y: oy, dir: s.dir, t: 0, dur: 0.35, small: true });
  else if (!hasGale(world.char)) world.fx.push({ kind: 'spark', x: ox, y: oy, t: 0, dur: 0.16, muzzle: true });
  // Heavy shots kick the view back; every Sniper bolt does a little (research/archery.md 37).
  if (s.big) world.juice.push({ type: 'kick', x: -s.dir * 2, y: 0 });
  else if (sniper) world.juice.push({ type: 'kick', x: -s.dir * 1, y: 0 });
  // Shots aimed up or down (`lift`, `drop`) look for monsters above or below you.
  if (s.lift || s.drop) box.dy = (s.drop ?? 0) - (s.lift ?? 0);
  // A full Gale looses a twin arrow beside every basic shot, a little lighter.
  // ...and two wind spirits that swoop out on curves and home in (Wind Archer's Trifling Wind).
  if (hasGale(world.char) && (world.gale ?? 0) >= GALE_MAX && s.key.startsWith('basic') && !s.twin) {
    fire(world, { ...s, twin: true, fan: 1, pierce: false, pct: s.pct * 0.6, oy: -5, lag: 0.04, big: false, stop: 0, shake: 0, gauge: 1 });
    for (const bend of [-38, 38]) fire(world, { ...s, shot: 'wisp', twin: true, fan: 1, pierce: false, pct: s.pct * 0.4, speed: 480, bend, lag: 0.08, burst: 'galehit', big: false, stop: 0, shake: 0, gauge: 1 });
  }
  // Constellation (full Starlight): every star splits into three as it flies, the two extra ones
  // lighter and free. Shadow Shuriken: a free shadow star flies beside every star thrown.
  if (STAR_SHOTS.has(s.shot) && !s.split && !s.boomerang && hasStarlight(world.char)) {
    if (constellation(world)) for (const oy of [-9, 9]) fire(world, { ...s, split: true, free: true, fan: 1, pierce: false, pct: s.pct * 0.5, oy: (s.oy ?? 0) + oy, lag: (s.lag ?? 0) + 0.03, bend: oy * 2.5, big: false, stop: 0, shake: 0, gauge: 1, muzzle: undefined, stick: null });
    const sb = world.char.buffs.shadowshuriken;
    if (sb && sb.until > world.now) fire(world, { ...s, split: true, free: true, phantom: true, fan: 1, pierce: false, pct: s.pct * sb.values.shadowStar, oy: (s.oy ?? 0) - 5, lag: (s.lag ?? 0) + 0.07, big: false, stop: 0, shake: 0, gauge: 1, muzzle: undefined, stick: null });
  }
  // A finisher shot that finds a mark opens a Link too (see land).
  if (s.finisher && pickTargets(world.mobs, body, box, 1).length) world.finisherAt = { at: world.now, key: s.key };
  if (s.pierce) {
    const line = pickTargets(world.mobs, body, box, s.targets ?? 1);
    // It flies at the first monster in its line (up or down to it, from the air or onto a slope)
    // and on through, out to its full range; each one it passes is hit as the bolt gets there.
    const first = line[0];
    const aim = first ? Math.atan2(first.y - (first.air ?? 0) - first.def.h / 2 - oy, first.x - ox) : s.dir > 0 ? 0 : Math.PI;
    const ux = Math.cos(aim);
    const uy = Math.sin(aim);
    // A whirling shot keeps cutting what it passes (`ticks` more times, `tickGap` apart).
    line.forEach((m, i) => {
      const at = Math.max(0, (m.x - ox) * ux + (m.y - (m.air ?? 0) - m.def.h / 2 - oy) * uy) / speed + lag;
      // Each monster it passes through lands a little bigger than the last (Piercing Arrow).
      shotHit(world, s, m, at, i % 3, element, i);
      for (let k = 1; k <= (s.ticks ?? 0); k++) shotHit(world, { ...s, knock: 10, stop: 0, shake: 0, big: false, gauge: 1 }, m, at + k * s.tickGap, (i + k) % 3, element);
    });
    // A blast bolt bursts round each monster it tears through, catching those close beside the
    // line too, spreading outward from each hit.
    if (s.blast) {
      const hit = new Set(line);
      line.forEach((m) => {
        const at = Math.max(0, (m.x - ox) * ux + (m.y - (m.air ?? 0) - m.def.h / 2 - oy) * uy) / speed + lag;
        world.mobs.filter((o) => !hit.has(o) && o.hp > 0 && Math.abs(o.x - m.x) <= s.blast && Math.abs(o.y - m.y) < 70).forEach((o, k) => {
          hit.add(o);
          shotHit(world, { ...s, burst: s.blastFx ?? 'spark', pct: s.pct * 0.7 }, o, at + 0.05 + Math.abs(o.x - m.x) / 400, (k + 1) % 3, element);
        });
      });
    }
    const len = Math.max(s.range, first ? Math.hypot(first.x - ox, first.y - oy) + 60 : 0);
    const out = fly(ox + ux * len, oy + uy * len, first, len);
    // A giant star whirls back to the hand the way it came, cutting the line a second time.
    if (s.boomerang) {
      const back = len / speed;
      world.fx.push({ kind: 'projectile', weapon: world.stats.weaponType, shot: s.shot, school: s.school, shadow: true, night: hasStarlight(world.char), x: ox + ux * len, y: oy + uy * len, tx: ox, ty: oy, t: -out, dur: back });
      line.forEach((m, i) => {
        const along = Math.max(0, (m.x - ox) * ux + (m.y - (m.air ?? 0) - m.def.h / 2 - oy) * uy);
        shotHit(world, { ...s, knock: -Math.abs(s.knock) * 0.5 }, m, out + (len - along) / speed, (i + 1) % 3, element, i);
      });
    }
    return;
  }
  const n = s.fan ?? 1;
  const targets = pickTargets(world.mobs, body, box, n);
  for (let i = 0; i < n; i++) {
    const m = targets[i];
    if (m) {
      const travel = fly(m.x, m.y - (m.air ?? 0) - m.def.h / 2, m);
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
