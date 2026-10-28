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
import { SKILLS } from '../data/skills.js';
import { pickTargets, weaponElement, procOf, cryOut, frenzyOnCrit, transform } from './combat.js';
import { moveAt } from '../render/moves.js';
import { useStars } from '../core/inventory.js';
import { tickPets, sendSnow, moonfall, howl } from './pets.js';
import { tickStorm, chainArc, staticField, thunderclap, overcharged } from './storm.js';
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
const TINTS = { holy: ['#ffe9a0', '#ffd24f'], rage: ['#c0102e', '#ff4a1f'] };

// The colour a warrior path's own skills come in: the Warrior's steel, the Paladin's holy gold,
// the Berserker's demonic crimson. The Warrior's skills the paths inherit (Blade Rush, Whirlwind,
// War Cry, Iron Guard, Shoulder Charge) take the path's colour, never the Warrior's blue.
export const pathSchool = (char) => (hasFaith(char) ? 'holy' : hasRage(char) ? 'rage' : 'steel');
// The Archer's gold hawk skills the same way: the Beastmaster's green.
export const schoolFor = (char, school) => (school === 'steel' ? pathSchool(char) : school === 'hawk' ? archerLook(char).school : school);
// The colour a pop-up word comes in, by its school.
export const SCHOOL_TEXT = { steel: '#bfe0ff', holy: '#ffe9a0', rage: '#ff6a5a' };

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
// The first jobs fight their own way too. The Warrior (who fights with his basic attacks, his
// skills going off on their own from them): a quick cut, the return cut, a stepping cross-cut
// that catches a few, then a heavy two-handed cleave that knocks them flying. The Archer: a snap
// shot, a double shot (two gold arrows a beat apart), then a full draw whose hawk arrow tears
// through the line.
export const PATH_COMBOS = {
  warrior: [
    { move: 'slash', dur: 0.4, step: 7, strikes: [{ at: 0.45, pct: 90, reach: 68, h: 58, knock: 40, arc: [-115, 205] }] },
    { move: 'slash2', dur: 0.4, step: 7, strikes: [{ at: 0.45, pct: 95, reach: 68, h: 62, knock: 40, arc: [100, -215] }] },
    { move: 'cross', dur: 0.5, step: 10, strikes: [
      { at: 0.22, pct: 65, reach: 74, h: 60, targets: 2, knock: 30, arc: [-115, 205], thick: 9 },
      { at: 0.72, pct: 75, reach: 74, h: 62, targets: 2, knock: 60, arc: [100, -215], thick: 9 },
    ] },
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
  // The archer paths. The Beastmaster: a snap shot, a twirl that looses two arrows, then a hop
  // that fans three wild arrows down on them; light and quick, her animals at her side.
  // The Stormcaller: a bolt snapped off from the hip, a double tap, then a kneeling thunderbolt
  // that tears through the line. Violet lightning crackles off every bolt.
  stormcaller: [
    { move: 'hipfire', dur: 0.4, step: -3, strikes: [{ at: 0.4, shot: 'stormbolt', pct: 90, range: 320, h: 60, knock: 30, speed: 1000 }] },
    { move: 'quickshot', dur: 0.46, step: -3, strikes: [{ at: 0.3, shot: 'stormbolt', pct: 55, range: 320, h: 60, knock: 20, speed: 1000 }, { at: 0.6, shot: 'stormbolt', pct: 60, range: 320, h: 60, knock: 40, speed: 1000, oy: 3 }] },
    { move: 'kneelshot', dur: 0.66, step: -8, finisher: true, strikes: [{ at: 0.56, shot: 'thunderbolt', pct: 185, range: 360, h: 64, targets: 3, pierce: true, speed: 1100, knock: 230, big: true, stop: 0.07, shake: 3, muzzle: 'stormspark' }] },
  ],
  beastmaster: [
    { move: 'quickshot', dur: 0.4, step: -2, strikes: [{ at: 0.5, shot: 'windarrow', pct: 85, range: 300, h: 60, knock: 25, speed: 860 }] },
    { move: 'spinshot', dur: 0.48, step: 6, strikes: [{ at: 0.32, shot: 'windarrow', pct: 60, range: 300, h: 60, knock: 20, speed: 860 }, { at: 0.72, shot: 'windarrow', pct: 65, range: 300, h: 60, knock: 30, speed: 860 }] },
    { move: 'leapshot', dur: 0.62, step: -8, finisher: true, strikes: [{ at: 0.56, shot: 'galearrow', fan: 3, pct: 95, range: 310, h: 110, knock: 130, launch: 120, speed: 900, big: true, stop: 0.05, shake: 2 }] },
  ],
};

// The arrows each archer path looses, its pool of shots and the Archer's skills (Vault) alike:
// the Archer's gold hawk arrows, the Beastmaster's green wild arrows.
const ARCHER_LOOK = {
  archer: { arrow: 'hawkarrow', big: 'hawkbig', rain: 'hawkarrow', muzzle: 'feathers', school: 'hawk' },
  beastmaster: { arrow: 'windarrow', big: 'galearrow', rain: 'windarrow', muzzle: 'gust', school: 'wind' },
  stormcaller: { arrow: 'stormbolt', big: 'thunderbolt', rain: 'stormbolt', muzzle: 'stormspark', school: 'storm' },
};
export const archerLook = (char) => ARCHER_LOOK[hasBond(char) ? 'beastmaster' : hasCharge(char) ? 'stormcaller' : 'archer'];
// One of the Archer's gold shots as the path's own.
const pathShot = (char, shot) => {
  const L = archerLook(char);
  return shot === 'hawkarrow' ? L.arrow : shot === 'hawkbig' ? L.big : shot === 'feathers' ? L.muzzle : shot;
};
// An archer path's shots besides its own combo's (its pool, PATH_VARIANTS), loosed as its arrows.
function shotsOf(L) {
  const arrowAt = (at, pct, f = {}) => ({ at, shot: L.arrow, pct, range: 300, h: 60, knock: 25, speed: 840, ...f });
  return {
    kick: { move: 'pointblank', dur: 0.52, step: 6, strikes: [
      { at: 0.3, pct: 60, reach: 52, h: 56, knock: 160, stop: 0.05, shake: 1 },
      arrowAt(0.62, 110, { knock: 180, speed: 900, big: true, stop: 0.05 }),
    ] },
    twirl: { move: 'spinshot', dur: 0.48, step: 6, strikes: [arrowAt(0.32, 55, { knock: 20 }), arrowAt(0.72, 60, { knock: 30 })] },
    slide: { move: 'slideshot', dur: 0.5, step: 30, carry: 0.6, strikes: [arrowAt(0.35, 55), arrowAt(0.62, 60, { knock: 60 })] },
    burst: { move: 'rapid', dur: 0.5, step: -4, strikes: [0.17, 0.5, 0.83].map((at, i) => arrowAt(at, 45, { knock: 20, oy: (i - 1) * 4 })) },
    hop: { move: 'hopshot', dur: 0.56, step: -24, carry: 0.5, strikes: [arrowAt(0.5, 70, { fan: 2, range: 290, h: 150, drop: 30, knock: 60 })] },
    overdraw: { move: 'galeshot', dur: 0.72, step: -10, finisher: true, strikes: [{ at: 0.62, shot: L.big, pct: 220, range: 360, h: 64, targets: 4, pierce: true, speed: 950, knock: 260, launch: 140, big: true, stop: 0.08, shake: 3, muzzle: L.muzzle }] },
    flipfan: { move: 'leapshot', dur: 0.62, step: -8, finisher: true, strikes: [{ at: 0.56, shot: L.big, fan: 3, pct: 100, range: 310, h: 120, knock: 140, launch: 120, speed: 900, big: true, stop: 0.05, shake: 2 }] },
    skyrain: { move: 'skyshot', dur: 0.7, step: -4, finisher: true, strikes: [{ at: 0.55, rain: 6, pct: 70, rainFrom: 50, rainW: 240, span: 0.5, knock: 20, variant: L.rain, school: L.school }] },
  };
}
const ARCHER_SHOTS = shotsOf(ARCHER_LOOK.archer);
const BEAST_SHOTS = shotsOf(ARCHER_LOOK.beastmaster);
// The Stormcaller's own pool, crossbow work: crank and fire (two bolts), a roll up onto one knee
// for a bolt, the point-blank kick, a hop back loosing two down at them, and a braced spray of three.
const boltAt = (at, pct, f = {}) => ({ at, shot: 'stormbolt', pct, range: 320, h: 60, knock: 30, speed: 1000, ...f });
const STORM_SHOTS = {
  crank: { move: 'crankshot', dur: 0.62, step: -2, strikes: [boltAt(0.5, 55), boltAt(0.8, 65, { knock: 60, oy: -3 })] },
  roll: { move: 'rollshot', dur: 0.56, step: 40, carry: 0.55, strikes: [boltAt(0.66, 105, { knock: 90, stop: 0.04 })] },
  kick: { move: 'pointblank', dur: 0.52, step: 6, strikes: [
    { at: 0.3, pct: 60, reach: 52, h: 56, knock: 160, stop: 0.05, shake: 1 },
    boltAt(0.62, 110, { knock: 180, big: true, stop: 0.05 }),
  ] },
  hop: { move: 'hopshot', dur: 0.56, step: -24, carry: 0.5, strikes: [boltAt(0.5, 70, { fan: 2, range: 300, h: 150, drop: 30, knock: 60 })] },
  spray: { move: 'ballista', dur: 0.72, step: -10, finisher: true, strikes: [{ at: 0.62, shot: 'thunderbolt', fan: 3, pct: 100, range: 330, h: 120, knock: 160, launch: 100, speed: 1050, big: true, stop: 0.05, shake: 2, muzzle: 'stormspark' }] },
};

// A path's combo with a choice of swings at each step, so holding attack doesn't play the same
// string over and over: each time the combo starts, one swing is drawn for every step, and never
// the same whole string twice in a row (see planCombo). The first choice at each step is the
// path's own combo above; the others keep its rhythm (an opener, a quick second blow, a medium or
// heavy third, a heavy finisher) and land with power to match their weight: fast ones hit
// lightly but quickly, heavy ones hold a longer stop, shake the screen and throw monsters far.
// The big swings the warrior paths share (each path dresses them its own way below).
const SWINGS = {
  sweep: { move: 'sweep', dur: 0.42, step: 8, strikes: [{ at: 0.45, pct: 85, reach: 80, h: 48, targets: 3, knock: 90, arc: [-160, 250], thick: 9, stop: 0.04 }] },
  jabs: { move: 'jabs', dur: 0.44, step: 8, strikes: [
    { at: 0.2, pct: 40, reach: 86, h: 44, targets: 2, pierce: true, knock: 15 },
    { at: 0.45, pct: 40, reach: 86, h: 44, targets: 2, pierce: true, knock: 15 },
    { at: 0.7, pct: 55, reach: 90, h: 44, targets: 2, pierce: true, knock: 90, stop: 0.04 },
  ] },
  flashcut: { move: 'flashcut', dur: 0.4, step: 34, carry: 0.42, strikes: [{ at: 0.4, pct: 100, reach: 84, h: 50, targets: 3, knock: 110, arc: [-80, 200], thick: 8, stop: 0.05, shake: 1 }] },
  spinback: { move: 'spinback', dur: 0.46, step: 10, strikes: [{ at: 0.58, pct: 95, reach: 72, h: 62, targets: 2, knock: 90, launch: 120, arc: [100, -215], thick: 10, stop: 0.05 }] },
  shove: { move: 'shove', dur: 0.38, step: 14, strikes: [{ at: 0.42, pct: 75, reach: 54, h: 60, targets: 2, knock: 260, stop: 0.06, shake: 2 }] },
  drivestab: { move: 'drivestab', dur: 0.5, step: 22, strikes: [{ at: 0.42, pct: 130, reach: 112, h: 44, targets: 3, pierce: true, knock: 230, big: true, stop: 0.07, shake: 2 }] },
  risecut: { move: 'risecut', dur: 0.48, step: 14, strikes: [{ at: 0.42, pct: 120, reach: 78, h: 84, targets: 3, knock: 40, launch: 320, arc: [80, -175], thick: 12, big: true, stop: 0.06 }] },
  hammer: { move: 'hammer', dur: 0.8, step: 10, strikes: [{ at: 0.56, pct: 200, reach: 98, h: 72, targets: 4, knock: 360, launch: 150, arc: [-150, 300], thick: 15, big: true, stop: 0.1, shake: 5 }] },
  leapchop: { move: 'leapchop', dur: 0.66, step: 22, finisher: true, strikes: [{ at: 0.55, pct: 210, reach: 94, h: 76, targets: 3, knock: 250, arc: [-105, 190], thick: 15, big: true, crack: true, stop: 0.1, shake: 5 }] },
  skysplit: { move: 'skysplit', dur: 0.95, step: 24, finisher: true, strikes: [{ at: 0.6, pct: 280, reach: 106, h: 92, targets: 5, knock: 270, launch: 340, arc: [-110, 200], thick: 17, big: true, crack: true, stop: 0.14, shake: 7 }] },
};
// A swing with something added to every blow of it (a path's own touch).
const dressed = (step, fields) => ({ ...step, strikes: step.strikes.map((st) => ({ ...st, ...fields })) });
// The Berserker's wounds: everything his wild swings catch bleeds a little.
const WOUND = { pct: 0.15, secs: 3 };

export const PATH_VARIANTS = {
  // The Warrior. Openers: a cut, a hip-height sweep, three lightning jabs, or a flash cut that
  // blurs through the line. Second: the return cut, a spinning backhand, a shoulder check, or a
  // driving stab through the line. Third: the cross-cut, a rising diagonal that pops them up, or
  // a wound-up home-run swing that sends them flying. Finisher: the cleave, a leaping chop, or a
  // sky-splitter that leaps high and splits the ground in slow motion.
  warrior: [
    [PATH_COMBOS.warrior[0], SWINGS.sweep, SWINGS.jabs, SWINGS.flashcut],
    [PATH_COMBOS.warrior[1], SWINGS.spinback, SWINGS.shove, SWINGS.drivestab],
    [PATH_COMBOS.warrior[2], SWINGS.risecut, SWINGS.hammer],
    [PATH_COMBOS.warrior[3], SWINGS.leapchop, SWINGS.skysplit],
  ],
  // The Paladin, steady and holy. Openers: her measured cut, a sweep, or a flash cut. Second: the
  // shield bash, a shoulder check behind a flare of light that dazes, or a spinning backhand.
  // Third: her lunging thrust, a rising cut that lifts them on light (Aegis Smite's old ascent),
  // or a driving stab. Finisher: the two-handed smite, her shield slam that brings a great shield
  // of light crashing down on them, or a leaping chop or sky-splitter that calls pillars of light
  // down on everything they hit.
  paladin: [
    [PATH_COMBOS.paladin[0], SWINGS.sweep, SWINGS.flashcut],
    [PATH_COMBOS.paladin[1], dressed(SWINGS.shove, { stun: 0.4, burst: 'aegis' }), SWINGS.spinback],
    [PATH_COMBOS.paladin[2],
      { move: 'ascend', dur: 0.5, step: 8, strikes: [{ at: 0.45, pct: 120, reach: 80, h: 84, targets: 3, knock: 40, launch: 380, arc: [100, -215], thick: 10, big: true, stop: 0.06 }] },
      SWINGS.drivestab],
    [PATH_COMBOS.paladin[3],
      { move: 'shieldslam', dur: 0.72, step: 14, finisher: true, strikes: [{ at: 0.5, pct: 220, reach: 92, h: 80, targets: 4, knock: 220, stun: 0.8, arc: [-95, 185], thick: 14, burst: 'shieldslam', burstAt: 0.55, big: true, stop: 0.1, shake: 5 }] },
      dressed(SWINGS.leapchop, { fx: 'pillar' }), dressed(SWINGS.skysplit, { fx: 'pillar' })],
  ],
  // The Berserker, wild and heavy, and everything bleeds; none of his swings are the other paths'.
  // Openers: his wound-up cleave, or a blur of savage stabs. Second: the return cleave, a low whirl
  // all around him (Ravage's old gyre), or the axe flung out at arm's length dragging him round
  // twice. Finisher: the skull-splitter, a body slam that crashes down shoulder first, or the
  // axe dragged along the ground in a charge and ripped up in a huge uppercut; all of them tear
  // the ground open.
  berserker: [
    [PATH_COMBOS.berserker[0],
      { move: 'flurry', dur: 0.5, step: 10, strikes: [0.15, 0.35, 0.55, 0.75].map((at, i) => ({ at, pct: 34, reach: 82, h: 52, targets: 2, pierce: true, knock: i === 3 ? 140 : 15, bleed: WOUND, stop: i === 3 ? 0.05 : 0 })) }],
    [PATH_COMBOS.berserker[1],
      { move: 'axehurl', dur: 0.62, step: 8, strikes: [
        { at: 0.42, pct: 65, reach: 98, h: 60, around: true, targets: 4, knock: 40, bleed: WOUND, arc: [0, 330], thick: 12, stop: 0.03 },
        { at: 0.68, pct: 80, reach: 98, h: 60, around: true, targets: 4, knock: 130, bleed: WOUND, arc: [180, 330], thick: 12, big: true, stop: 0.05, shake: 1 },
      ] },
      { move: 'gyre', dur: 0.55, step: 16, strikes: [{ at: 0.5, pct: 120, reach: 80, h: 56, around: true, targets: 4, knock: 90, bleed: WOUND, arc: [0, 330], thick: 11, big: true, stop: 0.05, rage: 8 }] }],
    [PATH_COMBOS.berserker[2],
      { move: 'bodyslam', dur: 0.9, step: 20, finisher: true, strikes: [{ at: 0.55, pct: 250, reach: 96, h: 80, around: true, targets: 5, knock: 260, launch: 240, bleed: WOUND, crack: true, burst: 'rageburst', burstAt: 0.2, big: true, stop: 0.12, shake: 6 }] },
      { move: 'dragrise', dur: 0.95, step: 34, carry: 0.42, trail: true, finisher: true, strikes: [{ at: 0.5, pct: 270, reach: 100, h: 110, targets: 4, knock: 120, launch: 440, bleed: WOUND, arc: [80, -175], thick: 16, crack: true, burst: 'rageburst', burstAt: 0.4, big: true, stop: 0.12, shake: 5 }] }],
  ],
  // The Archer, nimble and showy, her gold hawk arrows in every shot. Openers: her snap shot, a
  // stomping kick then a shot point-blank, or a twirl that looses two. Second: her double shot,
  // three arrows in a burst, or a hop back loosing two down at them. Finisher: her full draw, an
  // overdraw that tears through the line, or a backflip fan of three.
  archer: [
    [PATH_COMBOS.archer[0], ARCHER_SHOTS.kick, ARCHER_SHOTS.twirl],
    [PATH_COMBOS.archer[1], ARCHER_SHOTS.burst, ARCHER_SHOTS.hop],
    [PATH_COMBOS.archer[2], ARCHER_SHOTS.overdraw, ARCHER_SHOTS.flipfan],
  ],
  // The Beastmaster, quick and wild, her green arrows flying beside her animals. Openers: her snap
  // shot, the point-blank kick, or a slide in loosing two. Second: her twirl, a burst of three, or
  // a hop back loosing two down. Finisher: her leaping fan, an overdraw through the line, or a
  // volley up that rains back down on them.
  beastmaster: [
    [PATH_COMBOS.beastmaster[0], BEAST_SHOTS.kick, BEAST_SHOTS.slide],
    [PATH_COMBOS.beastmaster[1], BEAST_SHOTS.burst, BEAST_SHOTS.hop],
    [PATH_COMBOS.beastmaster[2], BEAST_SHOTS.overdraw, BEAST_SHOTS.skyrain],
  ],
  // The Stormcaller. Openers: her hip shot, crank and fire, or a roll up onto one knee. Second: her
  // double tap, the point-blank kick, or a hop back loosing two down. Finisher: the kneeling
  // thunderbolt through the line, or a braced spray of three.
  stormcaller: [
    [PATH_COMBOS.stormcaller[0], STORM_SHOTS.crank, STORM_SHOTS.roll],
    [PATH_COMBOS.stormcaller[1], STORM_SHOTS.kick, STORM_SHOTS.hop],
    [PATH_COMBOS.stormcaller[2], STORM_SHOTS.spray],
  ],
};

// Picks one swing for each step of a combo with choices, never the same string as `last`. The
// very first string is the path's own combo, so it opens the way you know it.
export function planCombo(variants, last = null, rng = Math.random) {
  if (!last) return variants.map(() => 0);
  for (let i = 0; i < 12; i++) {
    const plan = variants.map((v) => Math.floor(rng() * v.length));
    if (!last || plan.some((c, k) => c !== last[k])) return plan;
  }
  // Out of luck with the dice: change the first step that has a choice.
  const plan = [...last];
  const k = variants.findIndex((v) => v.length > 1);
  plan[k] = (plan[k] + 1) % variants[k].length;
  return plan;
}

// The archer paths' command shots. Up + attack: a shot up at whatever flies, knocking it higher.
// In the air: shots that hold you up (`hang`) and loose down at them. Running: the Beastmaster
// slides in under them loosing two arrows.
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
  // The Archer: a shot up that pops fliers higher, two shots loosed down from a hang in the air, a
  // sliding shot out of a run, and Down + attack: leaning out to loose two arrows down at whatever
  // is below.
  archer: {
    down: { move: 'downshot', dur: 0.5, step: -2, strikes: [{ at: 0.5, shot: 'hawkarrow', fan: 2, pct: 95, range: 280, h: 220, drop: 120, knock: 40, speed: 880 }] },
    up: { move: 'skyshot', dur: 0.5, step: -2, strikes: [{ at: 0.5, shot: 'hawkbig', fan: 2, pct: 105, range: 280, h: 190, lift: 50, knock: 20, launch: 360, speed: 880, big: true, stop: 0.05 }] },
    air: [
      { move: 'airshot', dur: 0.38, hang: true, strikes: [{ at: 0.45, shot: 'hawkarrow', fan: 2, pct: 75, range: 280, h: 170, drop: 50, knock: 30, speed: 880 }] },
      { move: 'airshot2', dur: 0.42, hang: true, finisher: true, strikes: [{ at: 0.5, shot: 'hawkbig', fan: 2, pct: 95, range: 280, h: 190, drop: 60, knock: 120, speed: 920, big: true, stop: 0.05, shake: 1 }] },
    ],
    dash: { move: 'slideshot', dur: 0.5, step: 44, carry: 0.6, strikes: [{ at: 0.42, shot: 'hawkarrow', pct: 95, range: 300, h: 60, knock: 80, speed: 880 }] },
  },
  // The Beastmaster: a wild arrow shot up at fliers, two down from a hang, a slide shot out of a
  // run, and down at whatever is below.
  beastmaster: {
    down: { move: 'downshot', dur: 0.48, step: -2, strikes: [{ at: 0.5, shot: 'windarrow', fan: 2, pct: 95, range: 280, h: 220, drop: 120, knock: 40, speed: 900 }] },
    up: { move: 'skyshot', dur: 0.5, step: -2, strikes: [{ at: 0.5, shot: 'galearrow', fan: 2, pct: 110, range: 280, h: 190, lift: 50, knock: 20, launch: 380, speed: 900, big: true, stop: 0.05 }] },
    air: [
      { move: 'airshot', dur: 0.36, hang: true, strikes: [{ at: 0.45, shot: 'windarrow', fan: 2, pct: 75, range: 280, h: 170, drop: 50, knock: 30, speed: 900 }] },
      { move: 'airshot2', dur: 0.42, hang: true, finisher: true, strikes: [{ at: 0.5, shot: 'galearrow', fan: 3, pct: 90, range: 280, h: 190, drop: 60, knock: 120, speed: 950, big: true, stop: 0.05, shake: 1 }] },
    ],
    dash: { move: 'slideshot', dur: 0.5, step: 46, carry: 0.6, strikes: [{ at: 0.35, shot: 'windarrow', pct: 80, range: 300, h: 60, knock: 30, speed: 900 }, { at: 0.62, shot: 'windarrow', pct: 90, range: 300, h: 60, knock: 90, speed: 900 }] },
  },
  // The Stormcaller: a thunderbolt up at fliers, two bolts down from a hang, a slide shot out of a
  // run, and down at whatever is below.
  stormcaller: {
    down: { move: 'downshot', dur: 0.5, step: -2, strikes: [{ at: 0.5, shot: 'stormbolt', fan: 2, pct: 95, range: 280, h: 220, drop: 120, knock: 40, speed: 1000 }] },
    up: { move: 'skyshot', dur: 0.5, step: -2, strikes: [{ at: 0.5, shot: 'thunderbolt', fan: 2, pct: 105, range: 280, h: 190, lift: 50, knock: 20, launch: 360, speed: 1000, big: true, stop: 0.05 }] },
    air: [
      { move: 'airshot', dur: 0.38, hang: true, strikes: [{ at: 0.45, shot: 'stormbolt', fan: 2, pct: 75, range: 280, h: 170, drop: 50, knock: 30, speed: 1000 }] },
      { move: 'airshot2', dur: 0.42, hang: true, finisher: true, strikes: [{ at: 0.5, shot: 'thunderbolt', fan: 2, pct: 95, range: 280, h: 190, drop: 60, knock: 120, speed: 1050, big: true, stop: 0.05, shake: 1 }] },
    ],
    dash: { move: 'slideshot', dur: 0.5, step: 44, carry: 0.6, strikes: [{ at: 0.42, shot: 'stormbolt', pct: 95, range: 300, h: 60, knock: 80, speed: 1000 }] },
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
// Down + attack (the warrior paths): a leaping two-handed slam that cracks the ground all around.
const SLAM = { move: 'plunge', dur: 0.62, step: 18, strikes: [{ at: 0.56, pct: 170, reach: 88, h: 80, around: true, targets: 4, knock: 220, crack: true, big: true, stop: 0.09, shake: 4 }] };
// The warrior paths fight in a blade's reach and put their weight into it.
const warriorPath = (char) => hasValor(char) || hasRage(char) || hasFaith(char);
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
const RAGE_HOLD = 8; // seconds after the last gain before it starts draining
const RAGE_DRAIN = 8; // per second
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
  const before = world.faith ?? 0;
  world.faith = Math.min(FAITH_MAX, before + n);
  world.faithAt = world.now;
  if (before < FAITH_MAX && world.faith >= FAITH_MAX) {
    cryOut(world);
    transform(world);
  }
}
// The share Faith takes off a hit; a hit taken also builds it.
export function faithGuard(world) {
  if (!hasFaith(world.char)) return 0;
  const cut = (FAITH_CUT * (world.faith ?? 0)) / FAITH_MAX;
  addFaith(world, FAITH_ON_HURT);
  return cut;
}
// Bond: the Beastmaster's gauge, shown as her companion Snow wolf's Patience running out. Her
// shots that land build it, and Snow wolf's hits build it faster (world/pets.js); it fades once
// the fighting stops. Full (Fed Up), Snow wolf fights on her own, and the finisher spends it.
export const BOND_MAX = 100;
const BOND_HOLD = 5;
const BOND_DRAIN = 10;
export const hasBond = (char) => jobChain(char.job).includes('beastmaster');
export function addBond(world, n) {
  if (!hasBond(world.char) || n <= 0) return;
  world.bond = Math.min(BOND_MAX, (world.bond ?? 0) + n);
  world.bondAt = world.now;
}
export const wild = (world) => hasBond(world.char) && (world.bond ?? 0) >= BOND_MAX;
// Charge: the Stormcaller's gauge. Her bolts that land build it, and so does every monster her
// lightning jumps to; it fades once the fighting stops. Full (Supercharged), every bolt chains to
// one more monster, and the finisher spends it.
export const CHARGE_MAX = 100;
const CHARGE_HOLD = 5;
const CHARGE_DRAIN = 12;
export const hasCharge = (char) => jobChain(char.job).includes('stormcaller');
export function addCharge(world, n) {
  if (!hasCharge(world.char) || n <= 0) return;
  world.charge = Math.min(CHARGE_MAX, (world.charge ?? 0) + n);
  world.chargeAt = world.now;
}
export const supercharged = (world) => hasCharge(world.char) && (world.charge ?? 0) >= CHARGE_MAX;
// Valor: the Warrior's gauge (first job; the paths have their own). Every blow that lands builds
// it, and faster the more monsters one blow catches at once; it fades once the fighting stops.
// Full (Unbroken), his blows land heavier and knock harder, and nothing knocks him back.
export const VALOR_MAX = 100;
const VALOR_HOLD = 5;
const VALOR_DRAIN = 12;
export const hasValor = (char) => char.job === 'warrior';
export function addValor(world, n) {
  if (!hasValor(world.char) || n <= 0) return;
  const before = world.valor ?? 0;
  world.valor = Math.min(VALOR_MAX, before + n);
  world.valorAt = world.now;
  // War Cry goes off as a warrior path's gauge fills (Valor here, Faith and Rage on the paths).
  if (before < VALOR_MAX && world.valor >= VALOR_MAX) cryOut(world);
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
// 'shadow', 'rage', 'faith', 'bond' or 'charge'), and how full it is (0-1). Finishers need it full
// and spend it.
export function gaugeOf(char) {
  return hasBloom(char) ? 'bloom' : hasIntent(char) ? 'killintent' : hasStarlight(char) ? 'starlight' : hasValor(char) ? 'valor' : hasMomentum(char) ? 'momentum' : hasShadow(char) ? 'shadow' : hasRage(char) ? 'rage' : hasFaith(char) ? 'faith' : hasBond(char) ? 'bond' : hasCharge(char) ? 'charge' : null;
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
  addBond(world, n);
  addCharge(world, n);
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
  if (w === 'bow' && hasBond(char)) return 'beastmaster';
  if (w === 'crossbow' && hasCharge(char)) return 'stormcaller';
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
  const before = world.rage ?? 0;
  world.rage = Math.min(RAGE_MAX, before + n);
  world.rageAt = world.now;
  if (before < RAGE_MAX && world.rage >= RAGE_MAX) {
    cryOut(world);
    transform(world);
  }
}
// A warrior path's form, while it lasts (see combat.js's transform): Demon Form for a Berserker,
// Judgment for a Paladin. The gauge stays full, the cuts reach farther and higher, and each swing
// strikes again (a Berserker's blood-red shadow swings it; a Paladin's is light alone).
const FORM_REACH = 1.35;
const FORM_HEIGHT = 1.2;
export const inForm = (world) => (hasRage(world.char) || hasFaith(world.char)) && (world.formUntil ?? 0) > world.now;
export const formSkill = (char) => (hasRage(char) ? 'demonform' : 'judgment');

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
    if (world.intent?.down && warriorPath(world.char) && world.stats.weaponType !== 'none') {
      playStep(world, SLAM, 100, 'basicslam');
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
    if (world.intent?.down && cmd.down) {
      playStep(world, cmd.down, 100, 'basicdown');
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
  // A path with a choice of swings draws a fresh string each time the combo starts over.
  const variants = PATH_VARIANTS[path];
  if (variants && (world.combo === 0 || !world.comboPlan)) world.comboPlan = planCombo(variants, world.comboPlan);
  playStep(world, variants ? variants[world.combo][world.comboPlan[world.combo]] : steps[world.combo], 100, `basic${world.combo}`);
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
  // Shots need the whole draw and loose, so they hold you a little longer than a cut.
  const ranged = step.strikes.some((s) => s.shot || s.rain);
  const dur = step.dur * (key.startsWith('basic') ? 0.9 : 1) * (1 - Math.min(0.4, stats.attackSpeed ?? 0) * 0.5);
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
  if (step.trail) world.fx.push({ kind: 'chargetrail', school: school ?? pathSchool(world.char), x: body.x, y: body.y, tx: body.x + body.facing * step.step, dir: body.facing, t: 0, dur: 0.5 });
  // Warrior paths put their weight into big moves: a stomp that kicks up dust as the move starts,
  // and power gathering at the weapon until the first blow lands.
  const heavy = hasValor(world.char) || hasShadow(world.char) || hasRage(world.char) || hasFaith(world.char);
  if (heavy && body.onGround && (step.finisher || step.strikes.some((st) => st.big))) {
    world.juice.push({ type: 'stomp', school: school ?? pathSchool(world.char), x: body.x, y: body.y, dir: body.facing, big: !key.startsWith('basic') });
    const lead = (step.strikes.find((st) => !st.onLand)?.at ?? 0.4) * dur;
    if (!key.startsWith('basic') && lead > 0.18) world.fx.push({ kind: 'gather', school: school ?? pathSchool(world.char), x: body.x, y: body.y, dir: body.facing, t: 0, dur: lead, big: lead > 0.5 });
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
  if (world.rage > 0 && world.now - (world.rageAt ?? 0) > RAGE_HOLD && !inForm(world)) world.rage = Math.max(0, world.rage - RAGE_DRAIN * dt);
  if (world.faith > 0 && world.now - (world.faithAt ?? 0) > FAITH_HOLD && !inForm(world)) world.faith = Math.max(0, world.faith - FAITH_DRAIN * dt);
  if (world.bond > 0 && world.now - (world.bondAt ?? 0) > BOND_HOLD) world.bond = Math.max(0, world.bond - BOND_DRAIN * dt);
  if (world.charge > 0 && world.now - (world.chargeAt ?? 0) > CHARGE_HOLD) world.charge = Math.max(0, world.charge - CHARGE_DRAIN * dt);
  if (world.valor > 0 && world.now - (world.valorAt ?? 0) > VALOR_HOLD) world.valor = Math.max(0, world.valor - VALOR_DRAIN * dt);
  if (world.bloom > 0 && world.now - (world.bloomAt ?? 0) > BLOOM_HOLD) world.bloom = Math.max(0, world.bloom - BLOOM_DRAIN * dt);
  if (world.killintent > 0 && world.now - (world.killintentAt ?? 0) > INTENT_HOLD) world.killintent = Math.max(0, world.killintent - INTENT_DRAIN * dt);
  if (world.starlight > 0 && world.now - (world.starlightAt ?? 0) > STARLIGHT_HOLD) world.starlight = Math.max(0, world.starlight - STARLIGHT_DRAIN * dt);
  // Execution lasts while Killing Intent stays full: each monster gets its one sure cut.
  if (!execution(world)) world.executed = null;
  if (world.shadow > 0 && world.now - (world.shadowAt ?? 0) > SHADOW_HOLD) world.shadow = Math.max(0, world.shadow - SHADOW_DRAIN * dt);
  if (world.momentum > 0 && world.now - (world.momentumAt ?? 0) > MOMENTUM_HOLD) world.momentum = Math.max(0, world.momentum - MOMENTUM_DRAIN * dt);
  tickTraps(world);
  tickStorm(world);
  tickPets(world, dt);
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
  playQueued(world);
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
  // A proc's extra cuts land where they were aimed, but never turn you round: you may already be
  // swinging the other way.
  if (!s.keepFacing) body.facing = s.dir;
  // The Archer's gold shots go as the path's own arrows, and her basic shots set off her procs as
  // they leave the bow, hit or miss (Blast and Snare Arrow change the shot itself).
  if (s.shot && !s.key.startsWith('basic')) s = { ...s, shot: pathShot(char, s.shot), muzzle: s.muzzle && pathShot(char, s.muzzle) };
  if ((s.rain || s.shot) && s.key.startsWith('basic') && !s.phantom) s = shotProcs(world, s);
  if (s.rain) return rain(world, s);
  if (s.shot) return fire(world, s);
  // A form reaches farther: every cut grows by FORM_REACH (once, not again for its echo).
  if (inForm(world) && !s.formGrown) s = { ...s, reach: s.reach * FORM_REACH, h: s.h * FORM_HEIGHT, formGrown: true };
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
    world.fx.push({ kind: 'pierce', school: s.school ? schoolFor(char, s.school) : pathSchool(char), x: body.x, y: body.y, dir: s.dir, box: { x, y: cy - 10, w: s.reach, h: 20 }, t: 0, dur: s.big ? 0.35 : 0.25, move: s.move, at: s.at, moveDur: s.dur });
  }
  if (s.arc) {
    world.fx.push({ kind: 'arc', snd: s.school, path: hasRage(char) ? 'rage' : hasFaith(char) ? 'holy' : hasValor(char) ? 'steel' : hasIntent(char) ? 'crow' : hasShadow(char) ? 'shadow' : null, x: body.x + s.dir * (s.around ? 0 : 10), y: cy - 2, bx: body.x, by: body.y, move: s.move, at: s.at, moveDur: s.dur, dir: s.dir, r: s.around ? s.reach * 0.8 : s.reach * 0.52, start: s.arc[0], sweep: s.arc[1], thick: s.thick ?? 7, big: s.big, flat: s.around, color: TINTS[s.school]?.[s.big ? 1 : 0] ?? (s.big ? HEAVY : BLADE), element: s.key.startsWith('basic') ? weaponElement(char) : null, t: 0, dur: s.big ? 0.32 : 0.24 });
  }
  if (s.crack) {
    world.fx.push({ kind: 'crack', school: s.school ? schoolFor(char, s.school) : pathSchool(char), x: body.x + s.dir * s.reach * 0.55, y: body.y, w: s.around ? s.reach * 2 : s.reach * 1.4, t: 0, dur: 0.7, seed: Math.random() });
    world.juice.push({ type: 'slam', school: s.school ? schoolFor(char, s.school) : pathSchool(char), x: body.x + s.dir * s.reach * 0.5, y: body.y, range: s.reach });
  }
  // A storm sky over the whole view (Storm Volley): a green wash, wind tearing across, arrows.
  if (s.sky) {
    world.fx.push({ kind: 'stormsky', x: body.x, y: body.y, t: 0, dur: s.sky });
    world.fx.push({ kind: 'rain', variant: 'windarrow', school: 'wind', box: { x: body.x - 320, y: body.y - 330, w: 640, h: 330 }, x: body.x, y: body.y, t: 0, dur: s.sky });
  }
  if (s.burst) {
    world.fx.push({ kind: s.burst, school: s.school, x: body.x + s.dir * s.reach * (s.burstAt ?? (s.around ? 0.3 : 0.45)), y: body.y, r: s.reach, dir: s.dir, t: 0, dur: s.burstDur ?? 0.7, seed: Math.random() });
  }
  let crits = 0;
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
    if (roll?.crit) crits++;
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
  // Procs go off from the swing itself, hit or miss (Whirlwind's crowd rule needs a hit, though);
  // Blood Frenzy from a critical hit.
  if (s.key.startsWith('basic')) bladeProcs(world, s, targets.length);
  if (s.key.startsWith('basic') && !s.phantom && inForm(world)) {
    formEcho(world, s);
    // Too much power for the blow to hold: it bursts where the swing ends (just for show).
    world.fx.push({ kind: 'formburst', school: pathSchool(char), x: body.x + s.dir * s.reach * 0.7, y: body.y - body.h * 0.5, dir: s.dir, t: 0, dur: 0.4, seed: Math.random() });
    world.juice.push({ type: 'shake', mag: 1.2, dur: 0.12 });
  }
  if (crits && !s.phantom) frenzyOnCrit(world);
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

// ---------- Blade procs ----------
// The warrior paths' skills set themselves off from their basic swings, hit or miss (see
// data/skills.js). Any swing may rush on into extra blows: Blade Rush's cross-cut of steel, Aegis
// Smite's pillar of light (Paladin), Ravage's bleeding cleaves (Berserker). A combo's last swing
// may flow on into a whole move: the path's own (Hallowed Ground for the Paladin, Rampage for the
// Berserker once he has the Rage) or, failing that, the Warrior's Whirlwind. Proc strikes aren't
// basic swings, so they never set off procs.

// The fields every proc strike shares: aimed the way the swing was, never turning you round.
const procStrike = (world, s, key, delay, fields) => ({
  at: s.at, due: world.now + delay, n: 0, of: 1, dir: s.dir, scale: 100, key, move: s.move, dur: s.dur, finisher: false, quiet: true, keepFacing: true, ...fields,
});

// Blade Rush's cross-cut: two cuts of steel a beat after the blow, slashing what's in front.
function rushStrikes(world, s, p) {
  const cut = (delay, arc, knock) => procStrike(world, s, 'procbladerush', delay, { pct: p.pct, reach: 76, h: 62, targets: p.targets, knock, arc, thick: 9, school: pathSchool(world.char) });
  world.strikes.push(cut(0.1, [-115, 205], 30), cut(0.22, [100, -215], 70));
}

// Aegis Smite's pillar: light crashes down just ahead, on everything under it, and stuns.
function smiteStrikes(world, s, p) {
  world.strikes.push(procStrike(world, s, 'procaegissmite', 0.14, {
    pct: p.pct, reach: 92, h: 110, targets: p.targets, knock: 60, stun: p.stun, fx: 'pillar', burst: 'aegis', burstAt: 0.75, school: 'holy', stop: 0.05, shake: 1,
  }));
}

// Ravage's cleaves: two savage chops back and forth that make them bleed.
function ravageStrikes(world, s, p) {
  const chop = (delay, arc, knock) => procStrike(world, s, 'procravage', delay, { pct: p.pct, reach: 82, h: 66, targets: p.targets, knock, arc, thick: 12, bleed: p.bleed, school: 'rage', rage: 4 });
  world.strikes.push(chop(0.1, [-150, 230], 40), chop(0.24, [110, -240], 90));
}

// Whirlwind's spin: carried forward, four pulling hits all around, then a fling.
function whirlStep(p) {
  const hit = (at, i) => ({ at, pct: p.pct, reach: 80, h: 76, around: true, targets: p.targets, pull: 70, arc: [i % 2 ? 180 : 0, 300], thick: 10, stop: 0.02, gauge: 2 });
  return { move: 'spin', dur: 0.9, step: 36, carry: 0.75, finisher: true, strikes: [
    ...[0.15, 0.3, 0.45, 0.6].map(hit),
    { ...hit(0.75, 4), pull: 0, knock: 240, launch: 220, big: true, stop: 0.07, shake: 3, gauge: 4 },
  ] };
}

// Hallowed Ground: the blade driven into the ground, a ring of holy light that turns everything
// it hits on you, then pillars of light lifting them.
function hallowedStep(p) {
  return { move: 'consecrate', dur: 0.9, step: 4, finisher: true, strikes: [
    { at: 0.46, pct: p.pct, reach: 120, h: 90, around: true, targets: p.targets, knock: 60, provoke: p.provoke, burst: 'consecrate', burstAt: 0, big: true, stop: 0.08, shake: 3 },
    { at: 0.8, pct: Math.round(p.pct * 0.8), reach: 130, h: 90, around: true, targets: p.targets, knock: 30, launch: 220, fx: 'pillar', stop: 0.04 },
  ] };
}

// Rampage: three wild cleaves back and forth, then a leaping skull-splitter.
function rampageStep(p) {
  const chop = (at, arc) => ({ at, pct: p.pct, reach: 82, h: 70, targets: p.targets, knock: 40, arc, thick: 12, rage: 0 });
  return { move: 'rampage', dur: 1.45, step: 30, carry: 0.6, finisher: true, strikes: [
    chop(0.064, [-150, 230]), chop(0.227, [110, -240]), chop(0.384, [-150, 230]),
    { at: 0.724, pct: p.smash, reach: 120, h: 92, around: true, targets: p.targets + 2, knock: 300, launch: 250, crack: true, big: true, burst: 'rageburst', stop: 0.14, shake: 7, rage: 0 },
  ] };
}

// Judgment (Paladin, at full Faith): holy swords rain down ahead, and their light mends you and
// the party around you.
function judgmentRain(world, s, p) {
  world.strikes.push(procStrike(world, s, 'procjudgment', 0.1, {
    pct: p.pct, rain: p.swords, variant: 'sword', rainFrom: 10, rainW: 240, span: 0.55, targets: p.swords, knock: 40, stun: 0.3, school: 'holy',
  }));
  healAround(world, world.body.x, world.body.y, p.heal, 260);
}

// Sacred Bulwark (Paladin): the holy shockwave that answers a blocked hit, stunning all around.
export function bulwarkWave(world, p) {
  const s = { at: 0, dir: world.body.facing, move: null, dur: 0 };
  world.strikes.push(procStrike(world, s, 'procsacredbulwark', 0.08, {
    pct: p.pct, reach: 110, h: 90, around: true, targets: p.targets, knock: 160, stun: p.stun, burst: 'consecrate', burstAt: 0, big: true, stop: 0.06, shake: 3, school: 'holy',
  }));
}

// A form's echo: each swing strikes again a beat later, lighter, and knocks nothing back (in Demon
// Form his blood-red shadow plays the swing; render/scene.js).
function formEcho(world, s) {
  const p = procOf(world.char, formSkill(world.char));
  if (!p) return;
  world.strikes.push({ ...s, due: world.now + 0.13, key: 'procform', fx: undefined, provoke: undefined, scale: (s.scale * p.echo) / 100, keepFacing: true, quiet: true, knock: 0, launch: 0, pull: 0, hop: 0, crack: false, burst: undefined, big: false, stop: 0.02, shake: 0, rage: 0, faith: 0, gauge: 0, finisher: false, school: pathSchool(world.char), arc: undefined, pierce: false });
  if (!(world.formSwing && world.now < world.formSwing.until)) world.formSwing = { kind: s.move, since: world.now + 0.13 - s.at * s.dur, dur: s.dur, until: world.now + 0.13 + (1 - s.at) * s.dur };
}

// After a basic swing lands (on `count` monsters, maybe none). `rng` for tests.
function bladeProcs(world, s, count, rng = Math.random) {
  const { char } = world;
  for (const [id, strikes] of [['bladerush', rushStrikes], ['aegissmite', smiteStrikes], ['ravage', ravageStrikes]]) {
    const p = procOf(char, id);
    if (p && rng() < p.chance) strikes(world, s, p);
  }
  // Only the ground combo's own finisher flows on (not a dive, a slam, or a dash).
  if (!s.finisher || !/^basic\d$/.test(s.key)) return;
  const judgment = procOf(char, 'judgment');
  if (judgment && (world.faith ?? 0) >= FAITH_MAX) judgmentRain(world, s, judgment);
  if (world.queuedStep) return;
  const queue = (step, key, school, extra = {}) => (world.queuedStep = { at: world.now + 0.12, step, key, school, ...extra });
  const hallowed = procOf(char, 'hallowedground');
  if (hallowed && (count >= hallowed.crowd || rng() < hallowed.chance)) return queue(hallowedStep(hallowed), 'prochallowedground', 'holy');
  const rampage = procOf(char, 'rampage');
  if (rampage && (world.rage ?? 0) >= SKILLS.rampage.rageCost && rng() < rampage.chance) return queue(rampageStep(rampage), 'procrampage', 'rage', { feedsOnRage: true });
  const whirl = procOf(char, 'whirlwind');
  if (whirl && (count >= whirl.crowd || rng() < whirl.chance)) queue(whirlStep(whirl), 'procwhirlwind', pathSchool(char));
}

// ---------- Archer procs ----------
// The Archer's tricks set themselves off from her basic shots, hit or miss (see data/skills.js):
// any shot may become a Blast Arrow (it bursts on impact) or a Snare Arrow (a net holds its target);
// the combo's last shot may drop a Spring Trap ahead. A Beastmaster's shots may also make Snow
// wolf fight (world/pets.js): dragging herself over to the nearest monster to cut it, or calling
// a beam of moonlight down on the farthest, and the combo's last shot may set her howling.
// Returns the shot to loose. `rng` for tests.
// Blast Arrow's burst (and a sprung trap's) in each archer path's own look: the Archer's fire, the
// Beastmaster's gale of wind and leaves, the Stormcaller's thunderclap.
const BLASTS = { beastmaster: 'galeblast', stormcaller: 'thunderblast' };
function shotProcs(world, s, rng = Math.random) {
  const { char, body } = world;
  const blast = procOf(char, 'blastarrow');
  if (blast && s.shot && rng() < blast.chance) s = { ...s, blast: blast.r, blastFx: BLASTS[pathOf(world)] ?? 'blast', burst: BLASTS[pathOf(world)] ?? 'blast', pct: (s.pct * blast.pct) / 100, big: true, stop: Math.max(s.stop ?? 0, 0.05), shake: Math.max(s.shake ?? 0, 1) };
  const snare = procOf(char, 'snarearrow');
  if (snare && s.shot && rng() < snare.chance) s = { ...s, snare: snare.secs };
  const trap = procOf(char, 'springtrap');
  if (trap && s.finisher && /^basic\d$/.test(s.key) && rng() < trap.chance) setTrap(world, body.x + s.dir * 90, trap);
  const wolf = procOf(char, 'wolfpounce');
  if (wolf && rng() < wolf.chance) sendSnow(world, pickTargets(world.mobs, body, { w: 300, h: 120 }, 1)[0], wolf.pct);
  const moon = procOf(char, 'hawkstrike');
  if (moon && rng() < moon.chance) moonfall(world, pickTargets(world.mobs, body, { w: 340, h: 160 }, 9).at(-1), moon.pct);
  const howlP = procOf(char, 'packhowl');
  if (howlP && s.finisher && /^basic\d$/.test(s.key)) {
    const crowd = pickTargets(world.mobs, body, { w: 320, h: 150 }, 9).length;
    if (crowd >= howlP.crowd || rng() < howlP.chance) howl(world, howlP);
  }
  // The Stormcaller's: a bolt may jump on from what it hits (Arc Bolt) or charge the ground there
  // (Static Field), and the combo's last bolt may call lightning down on the farthest monster in
  // front of her (Thunderclap).
  const arc = procOf(char, 'arcbolt');
  if (arc && s.shot && rng() < arc.chance) s = { ...s, arc: { n: arc.jumps, pct: arc.pct } };
  const field = procOf(char, 'staticfield');
  if (field && s.shot && rng() < field.chance) s = { ...s, field };
  const clap = procOf(char, 'thunderclap');
  if (clap && s.finisher && /^basic\d$/.test(s.key)) {
    const crowd = pickTargets(world.mobs, body, { w: 340, h: 160 }, 9);
    if (crowd.length && (crowd.length >= clap.crowd || rng() < clap.chance)) thunderclap(world, crowd.at(-1), clap);
  }
  return s;
}

// Snow wolf's hit (world/pets.js): it lands like one of her shots, knocks monsters away from where
// she is (`x`), and builds Bond faster (`gauge`, 5 unless she says otherwise: less for the fights she
// picks herself).
export function beastHit(world, m, f) {
  shotHit(world, { pct: f.pct, scale: 100, key: 'procbeast', dir: Math.sign(m.x - f.x) || 1, fromX: f.x, knock: f.knock ?? 120, launch: f.launch ?? 0, big: f.big, stop: f.stop, shake: f.shake, burst: f.burst, stun: f.stun, gauge: f.gauge ?? 5 }, m, 0);
}

// A hit of the Stormcaller's lightning (world/storm.js): it lands like one of her shots, `at`
// seconds from now, from `x` (knocking monsters away from there), and never chains on.
export function stormHit(world, m, f, at = 0, element = null) {
  shotHit(world, { pct: f.pct, scale: 100, key: f.key ?? 'procstorm', dir: Math.sign(m.x - f.x) || 1, fromX: f.x, knock: f.knock ?? 40, launch: f.launch ?? 0, big: f.big, stop: f.stop, shake: f.shake, burst: f.burst ?? 'zap', stun: f.stun, gauge: f.gauge ?? 3, chained: true }, m, at, f.stack ?? 0, element);
}

// Spring Trap: a trap set on the ground ahead, armed until a monster steps on it or it rusts away
// (`life`), at most TRAPS at once (the oldest goes).
const TRAPS = 2;
function setTrap(world, x, p) {
  const traps = (world.traps ??= []);
  const y = world.body.y;
  if (traps.length >= TRAPS) traps.shift().fx.dur = 0;
  const fx = { kind: 'trap', x, y, t: 0, dur: p.life };
  world.fx.push(fx);
  traps.push({ x, y, until: world.now + p.life, pct: p.pct, fx });
}
// Every tick: a monster that steps on an armed trap is snapped and flung up.
function tickTraps(world) {
  if (!world.traps?.length) return;
  world.traps = world.traps.filter((t) => {
    if (world.now >= t.until) return false;
    const m = world.mobs.find((o) => o.hp > 0 && !(o.air > 4) && Math.abs(o.x - t.x) < 18 + o.def.w / 3 && Math.abs(o.y - t.y) < 30);
    if (!m) return true;
    t.fx.dur = t.fx.t;
    world.fx.push({ kind: 'trapsnap', x: t.x, y: t.y, t: 0, dur: 0.5 });
    shotHit(world, { pct: t.pct, scale: 100, key: 'proctrap', dir: Math.sign(m.x - world.body.x) || 1, knock: 30, launch: 460, big: true, stop: 0.07, shake: 2, burst: BLASTS[pathOf(world)] ?? 'blast', gauge: 3 }, m, 0);
    return false;
  });
}

// A proc's own move, a beat after the blow that set it off (on the ground, and still standing).
// Rampage feeds on your Rage without spending it: the more you have, the harder it hits (double
// at full Rage).
function playQueued(world) {
  const q = world.queuedStep;
  if (!q || world.now < q.at) return;
  world.queuedStep = null;
  if (world.dead || !world.body.onGround) return;
  let scale = 100;
  if (q.feedsOnRage) {
    scale += Math.round((100 * (world.rage ?? 0)) / RAGE_MAX);
    world.fx.push({ kind: 'powerup', school: 'rage', x: world.body.x, y: world.body.y, t: 0, dur: 0.5, big: true });
  }
  playStep(world, q.step, scale, q.key, q.school ?? pathSchool(world.char), AFTER.finisher);
}

// How a shot would hit a monster: rolled now, landing when it arrives.
// A strike marked `crit` always crits. Each archer path's own spark lands with every shot (a
// burst of gold, a swirl of leaves), unless the shot
// bursts with its own (`burst`). Shots that land build the path's gauge (`gauge`, or 3 for a basic
// shot and 5 for a skill's).
function shotHit(world, s, m, delay, stack = 0, element = null, rank = 0) {
  const { char, stats, body } = world;
  const acc = accuracy(JOBS[char.job].family, stats, char.level);
  const sure = s.crit;
  const miss = !sure && Math.random() >= hitChance(acc, char.level, m.def);
  const extraCrit = sure ? 1 : 0;
  const range = s.magic ? magicRange(stats, (s.pct * s.scale) / 100) : physicalRange(stats, stats.weaponType, (s.pct * s.scale) / 100);
  const roll = miss ? null : rollHit(range, stats, m.def, char.level, Math.random, extraCrit);
  const spark = hasBloom(char) ? 'bloomhit' : hasStarlight(char) ? 'starhit' : hasShadow(char) ? 'shadowhit' : hasMomentum(char) ? 'hawkhit' : hasBond(char) ? 'galehit' : hasCharge(char) ? (s.shot === 'thunderbolt' || s.shot === 'megabolt' ? 'stormpierce' : 'stormhit') : undefined;
  world.pending.push({
    at: world.now + delay, mob: m, miss, damage: roll?.damage ?? 0, crit: roll?.crit ?? false, fromX: s.fromX ?? body.x, stack, knock: s.knock, launch: s.launch, big: s.big, stop: s.stop, shake: s.shake, element,
    via: s.shot ?? (s.rain ? 'rain' : undefined), stun: miss ? undefined : s.stun, freeze: miss ? undefined : s.freeze, snare: miss ? undefined : s.snare, burst: s.burst ?? spark, dir: s.dir,
    gauge: s.gauge ?? (s.key.startsWith('basic') ? 3 : 5), rank,
    // The archer paths' hits bring their own sprite burst, so the plain spark is left off.
    ownSpark: Boolean(spark),
  });
  // The Stormcaller's lightning: a bolt that lands may jump on to the monsters near it (Arc Bolt,
  // and one more while Supercharged), or leave the ground under it charged (Static Field). Only
  // the first monster a piercing bolt reaches sets these off.
  if (!miss && rank === 0 && s.shot && !s.chained && hasCharge(char)) {
    const jumps = (s.arc?.n ?? 0) + (supercharged(world) ? 1 : 0);
    if (jumps) chainArc(world, s, m, delay, jumps, element);
    if (s.field) staticField(world, m, delay, s.field);
  }
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
  // Overcharge: her next few bolts go out as massive bolts of lightning.
  let s = hasCharge(world.char) ? overcharged(world, strike) : strike;
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
  // Hawkeye (full Momentum): arrows fly faster and reach further, and curve to find monsters above
  // and below (a taller search box, and a bend in their flight as they home in).
  if (hawkeye(world) && !s.hawkeye) {
    world.volley = ((world.volley ?? 0) + 1) % 2;
    s = { ...s, hawkeye: true, speed: (s.speed ?? 680) * 1.4, range: s.range + 70, h: Math.max(140, (s.h ?? 60) * 2), bend: s.bend ?? (world.volley ? 22 : -22) };
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
  // A twin arrow trails its first a beat behind (`lag`).
  const lag = s.lag ?? 0;
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
  if (hasCharge(world.char)) world.fx.push({ kind: 'stormspark', small: true, x: ox, y: oy, dir: s.dir, t: 0, dur: 0.3 });
  else if (!hasBond(world.char)) world.fx.push({ kind: 'spark', x: ox, y: oy, t: 0, dur: 0.16, muzzle: true });
  // Heavy shots kick the view back (research/archery.md 37).
  if (s.big) world.juice.push({ type: 'kick', x: -s.dir * 2, y: 0 });
  // Shots aimed up or down (`lift`, `drop`) look for monsters above or below you.
  if (s.lift || s.drop) box.dy = (s.drop ?? 0) - (s.lift ?? 0);
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
