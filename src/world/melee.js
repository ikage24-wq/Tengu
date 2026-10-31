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
import { SKILLS, skillAt } from '../data/skills.js';
import { pickTargets, weaponElement, procOf, cryOut, frenzyOnCrit, transform, applyBuff } from './combat.js';
import { moveAt } from '../render/moves.js';
import { useStars, activeStar } from '../core/inventory.js';
import { tickPets, sendSnow, moonfall, howl, duetSnow, duetMoon } from './pets.js';
import { tickDoll, raiseLantern } from './spiritdoll.js';
import { tickShrine, purify, resurrect, thousandTorii } from './shrine.js';
import { tickOnmyoji, ofudaBarrage, seimanSeal, yokaiRally, troupeCombo, TROUPE, rallyPower } from './onmyoji.js';
import { tickGuardian } from './kitsune.js';
import { launchWisp, foxSpirit, FOX_SPIRIT_HEAT } from './foxwheel.js';
import { tickOni } from './oni.js';
import { tickYuki } from './yuki.js';
import { tickTengu } from './tengu.js';
import { tickStorm, chainArc, staticField, thunderclap, overcharged } from './storm.js';
import { provoke, healMembers, groupOf } from './dungeon.js';

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
// And the Thief's violet shadow skills: the Shinobi's ink, the Kitsune's fox fire.
export const thiefSchool = (char) => (hasKi(char) ? 'ink' : hasTails(char) ? 'fox' : 'shadow');
export const schoolFor = (char, school) => (school === 'steel' ? pathSchool(char) : school === 'hawk' ? archerLook(char).school : school === 'shadow' ? thiefSchool(char) : school);
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
    { move: 'quickshot', dur: 0.46, strikes: [{ at: 0.5, shot: 'arrow', pct: 90, range: 290, h: 60, knock: 25 }] },
    { move: 'quickshot', dur: 0.44, strikes: [{ at: 0.5, shot: 'arrow', pct: 95, range: 290, h: 60, knock: 25 }] },
    { move: 'draw', dur: 0.62, step: -10, finisher: true, strikes: [{ at: 0.62, shot: 'bigarrow', pct: 170, range: 330, h: 60, targets: 3, pierce: true, speed: 900, knock: 200, big: true, stop: 0.06, shake: 2 }] },
  ],
  crossbow: [
    { move: 'quickshot', dur: 0.5, strikes: [{ at: 0.5, shot: 'arrow', pct: 100, range: 300, h: 56, knock: 50, speed: 820 }] },
    { move: 'quickshot', dur: 0.5, strikes: [{ at: 0.5, shot: 'arrow', pct: 105, range: 300, h: 56, knock: 50, speed: 820 }] },
    { move: 'aimshot', dur: 0.66, step: -12, finisher: true, strikes: [{ at: 0.68, shot: 'bigarrow', pct: 190, range: 340, h: 56, targets: 3, pierce: true, speed: 1000, knock: 240, big: true, stop: 0.07, shake: 3 }] },
  ],
  gauntlet: [
    { move: 'throw', dur: 0.4, strikes: [{ at: 0.5, shot: 'star', pct: 85, range: 270, h: 60, knock: 25 }] },
    { move: 'throw', dur: 0.4, strikes: [{ at: 0.5, shot: 'star', pct: 90, range: 270, h: 60, knock: 25 }] },
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
    { move: 'quickshot', dur: 0.44, strikes: [{ at: 0.5, shot: 'hawkarrow', pct: 90, range: 300, h: 60, knock: 25, speed: 800 }] },
    { move: 'rapid', dur: 0.46, strikes: [{ at: 0.17, shot: 'hawkarrow', pct: 60, range: 300, h: 60, knock: 20, speed: 800 }, { at: 0.5, shot: 'hawkarrow', pct: 65, range: 300, h: 60, knock: 30, speed: 800 }] },
    { move: 'draw', dur: 0.62, step: -10, finisher: true, strikes: [{ at: 0.62, shot: 'hawkbig', pct: 175, range: 330, h: 60, targets: 3, pierce: true, speed: 900, knock: 210, big: true, stop: 0.06, shake: 2 }] },
  ],
  // The Thief, by weapon. Her back flips come in the middle of a string, never at its end (the
  // player's call): she flips out, and the next blow darts straight back in (`owed`, playStep),
  // so holding attack flows on and on. With a dagger: a stab, a slash that rides up into a
  // backflip, then a planted X-cut. With a gauntlet: a star, a backflip whipping two stars down
  // from the top of it, then a heaving throw of the moon star through the line.
  thiefdagger: [
    { move: 'thrust', dur: 0.28, step: 8, strikes: [{ at: 0.42, pct: 85, reach: 58, h: 46, knock: 30, pierce: true }] },
    { move: 'cutflip', dur: 0.56, step: 6, strikes: [{ at: 0.2, pct: 95, reach: 60, h: 52, knock: 40, arc: [-100, 190], thick: 5, flipback: 44 }] },
    { move: 'crossfin', dur: 0.62, step: 10, carry: 0.12, finisher: true, strikes: [{ at: 0.12, pct: 85, reach: 62, h: 54, knock: 60, arc: [-110, 200], thick: 6 }, { at: 0.4, pct: 120, reach: 62, h: 56, knock: 170, arc: [100, -210], thick: 7, big: true, stop: 0.06 }] },
  ],
  thiefstar: [
    { move: 'throw', dur: 0.38, strikes: [{ at: 0.5, shot: 'star', pct: 85, range: 280, h: 60, knock: 25, speed: 760 }] },
    { move: 'flipthrow', dur: 0.6, step: -30, carry: 0.46, strikes: [{ at: 0.46, shot: 'star', fan: 2, pct: 60, range: 280, h: 110, drop: 20, knock: 30, speed: 800 }] },
    { move: 'heavethrow', dur: 0.62, step: 8, carry: 0.5, finisher: true, strikes: [{ at: 0.52, shot: 'moonstar', pct: 150, range: 310, h: 60, targets: 2, pierce: true, speed: 820, knock: 190, big: true, stop: 0.05, shake: 2 }] },
  ],
  // The Thief's paths. The Shinobi: a kunai stab, a slash up into a backflip that throws two kunai
  // down at them from the top, then a planted X-cut. The Kitsune: a fox-fire star, a backflip
  // whipping two down from the top of it, then a heaving throw of a great fox-fire star.
  shinobi: [
    { move: 'thrust', dur: 0.26, step: 8, strikes: [{ at: 0.42, pct: 95, reach: 60, h: 46, knock: 30, pierce: true }] },
    { move: 'cutflip', dur: 0.56, step: 6, strikes: [{ at: 0.2, pct: 90, reach: 60, h: 52, knock: 40, arc: [-100, 190], thick: 5, flipback: 44 }, { at: 0.66, shot: 'kunai', fan: 2, pct: 45, range: 240, h: 120, drop: 30, knock: 30, speed: 900 }] },
    { move: 'crossfin', dur: 0.62, step: 10, carry: 0.12, finisher: true, strikes: [{ at: 0.12, pct: 95, reach: 62, h: 54, knock: 60, arc: [-110, 200], thick: 6 }, { at: 0.4, pct: 130, reach: 62, h: 56, knock: 170, arc: [100, -210], thick: 7, big: true, stop: 0.06, burst: 'inkhit', burstAt: 0.4 }] },
  ],
  kitsune: [
    { move: 'throw', dur: 0.36, strikes: [{ at: 0.5, shot: 'foxstar', pct: 90, range: 290, h: 60, knock: 25, speed: 780 }] },
    { move: 'flipthrow', dur: 0.6, step: -30, carry: 0.46, strikes: [{ at: 0.46, shot: 'foxstar', fan: 2, pct: 65, range: 290, h: 110, drop: 20, knock: 30, speed: 800 }] },
    { move: 'heavethrow', dur: 0.62, step: 8, carry: 0.5, finisher: true, strikes: [{ at: 0.52, shot: 'foxmoon', pct: 160, range: 320, h: 80, targets: 3, pierce: true, speed: 860, knock: 190, big: true, stop: 0.05, shake: 2 }] },
  ],
  // The Spirit Mage, dancing: the opening sweep sends a spirit bolt, the swaying step a second,
  // and the dance's last figure looses a great bolt of spirit light that bursts through the line.
  spiritmage: [
    { move: 'kagura', dur: 1.01, step: 2, strikes: [{ at: 0.55, shot: 'spiritorb', magic: true, pct: 200, range: 290, h: 60, knock: 25, speed: 600 }] },
    { move: 'kaguraturn', dur: 1.1, step: 2, strikes: [{ at: 0.6, shot: 'spiritorb', magic: true, pct: 210, range: 290, h: 60, knock: 30, speed: 600 }] },
    { move: 'kagurafin', dur: 1.5, step: 4, finisher: true, strikes: [{ at: 0.6, shot: 'spiritbig', magic: true, pct: 375, range: 310, h: 66, targets: 3, pierce: true, speed: 660, knock: 190, big: true, stop: 0.06, shake: 2 }] },
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
  // The archer paths. The Beastmaster: a snap shot, a backflip that fans three wild arrows down
  // on them from the top of it, then a gale shot through the line as she lands and darts back in;
  // light and quick, her animals at her side.
  // The Stormcaller: a bolt snapped off from the hip, a double tap, then a kneeling thunderbolt
  // that tears through the line. Violet lightning crackles off every bolt.
  stormcaller: [
    { move: 'hipfire', dur: 0.4, strikes: [{ at: 0.4, shot: 'stormbolt', pct: 90, range: 320, h: 60, knock: 30, speed: 1000 }] },
    { move: 'quickshot', dur: 0.46, strikes: [{ at: 0.3, shot: 'stormbolt', pct: 55, range: 320, h: 60, knock: 20, speed: 1000 }, { at: 0.6, shot: 'stormbolt', pct: 60, range: 320, h: 60, knock: 40, speed: 1000, oy: 3 }] },
    { move: 'kneelshot', dur: 0.66, step: -8, finisher: true, strikes: [{ at: 0.56, shot: 'thunderbolt', pct: 185, range: 360, h: 64, targets: 3, pierce: true, speed: 1100, knock: 230, big: true, stop: 0.07, shake: 3, muzzle: 'stormspark' }] },
  ],
  beastmaster: [
    { move: 'quickshot', dur: 0.4, strikes: [{ at: 0.5, shot: 'windarrow', pct: 85, range: 300, h: 60, knock: 25, speed: 860 }] },
    { move: 'leapshot', dur: 0.6, step: -30, carry: 0.6, strikes: [{ at: 0.56, shot: 'windarrow', fan: 3, pct: 50, range: 300, h: 110, knock: 40, speed: 880 }] },
    { move: 'galeshot', dur: 0.7, step: 4, finisher: true, strikes: [{ at: 0.62, shot: 'galearrow', pct: 200, range: 340, h: 64, targets: 3, pierce: true, speed: 920, knock: 230, launch: 120, big: true, stop: 0.07, shake: 2, muzzle: 'gust' }] },
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
    burst: { move: 'rapid', dur: 0.5, strikes: [0.17, 0.5, 0.83].map((at, i) => arrowAt(at, 45, { knock: 20, oy: (i - 1) * 4 })) },
    hop: { move: 'hopshot', dur: 0.56, step: -24, carry: 0.5, strikes: [arrowAt(0.5, 70, { fan: 2, range: 290, h: 150, drop: 30, knock: 60 })] },
    overdraw: { move: 'galeshot', dur: 0.72, step: -10, finisher: true, strikes: [{ at: 0.62, shot: L.big, pct: 220, range: 360, h: 64, targets: 4, pierce: true, speed: 950, knock: 260, launch: 140, big: true, stop: 0.08, shake: 3, muzzle: L.muzzle }] },
    triple: { move: 'tripleshot', dur: 0.56, strikes: [arrowAt(0.55, 50, { fan: 3, h: 110, knock: 40 })] },
    lob: { move: 'lobshot', dur: 0.5, strikes: [arrowAt(0.5, 100, { speed: 380, lob: 70, knock: 60, stop: 0.04 })] },
    flipfan: { move: 'leapshot', dur: 0.6, step: -30, carry: 0.6, strikes: [arrowAt(0.56, 50, { fan: 3, h: 110, knock: 40, speed: 880 })] },
    skyrain: { move: 'skyshot', dur: 0.7, finisher: true, strikes: [{ at: 0.55, rain: 6, pct: 70, rainFrom: 50, rainW: 240, span: 0.5, knock: 20, variant: L.rain, school: L.school }] },
  };
}
const ARCHER_SHOTS = shotsOf(ARCHER_LOOK.archer);
const BEAST_SHOTS = shotsOf(ARCHER_LOOK.beastmaster);
// The Stormcaller's own pool, crossbow work: crank and fire (two bolts), a roll up onto one knee
// for a bolt, the point-blank kick, a hop back loosing two down at them, and a braced spray of three.
const boltAt = (at, pct, f = {}) => ({ at, shot: 'stormbolt', pct, range: 320, h: 60, knock: 30, speed: 1000, ...f });
const STORM_SHOTS = {
  crank: { move: 'crankshot', dur: 0.62, strikes: [boltAt(0.5, 55), boltAt(0.8, 65, { knock: 60, oy: -3 })] },
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
  spinback: { move: 'spinback', dur: 0.46, step: 10, strikes: [{ at: 0.58, pct: 95, reach: 72, h: 62, around: true, targets: 4, knock: 90, launch: 120, arc: [100, -215], thick: 10, stop: 0.05 }] },
  pommel: { move: 'pommel', dur: 0.4, step: 10, strikes: [{ at: 0.4, pct: 70, reach: 50, h: 56, knock: 70, stun: 0.6, stop: 0.06, shake: 1 }] },
  shove: { move: 'shove', dur: 0.38, step: 14, strikes: [{ at: 0.42, pct: 75, reach: 54, h: 60, targets: 2, knock: 260, stop: 0.06, shake: 2 }] },
  drivestab: { move: 'drivestab', dur: 0.5, step: 22, strikes: [{ at: 0.42, pct: 130, reach: 112, h: 44, targets: 3, pierce: true, knock: 230, big: true, stop: 0.07, shake: 2 }] },
  risecut: { move: 'risecut', dur: 0.48, step: 14, strikes: [{ at: 0.42, pct: 120, reach: 78, h: 84, targets: 3, knock: 40, launch: 320, arc: [80, -175], thick: 12, big: true, stop: 0.06 }] },
  hammer: { move: 'hammer', dur: 0.8, step: 10, strikes: [{ at: 0.56, pct: 200, reach: 98, h: 72, targets: 4, knock: 360, launch: 150, arc: [-150, 300], thick: 15, big: true, stop: 0.1, shake: 5 }] },
  leapchop: { move: 'leapchop', dur: 0.66, step: 22, finisher: true, strikes: [{ at: 0.55, pct: 210, reach: 94, h: 76, targets: 3, crack: true, knock: 250, arc: [-105, 190], thick: 15, big: true, crack: true, stop: 0.1, shake: 5 }] },
  skysplit: { move: 'skysplit', dur: 0.95, step: 24, finisher: true, strikes: [{ at: 0.6, pct: 280, reach: 106, h: 92, targets: 5, knock: 270, launch: 340, arc: [-110, 200], thick: 17, big: true, crack: true, stop: 0.14, shake: 7 }] },
};
// A swing with something added to every blow of it (a path's own touch).
const dressed = (step, fields) => ({ ...step, strikes: step.strikes.map((st) => ({ ...st, ...fields })) });
// The Berserker's wounds: everything his wild swings catch bleeds a little.
const WOUND = { pct: 0.15, secs: 3 };

// Bare hands (a Novice, or anyone without a weapon): a jab, another, and an uppercut; or a
// headbutt to open, a flying kick second, and a haymaker or a cartwheel kick to finish.
PATH_COMBOS.fists = COMBOS.none;
const FISTS = {
  headbutt: { move: 'headbutt', dur: 0.5, step: 6, strikes: [{ at: 0.42, pct: 100, reach: 46, h: 50, knock: 90, stun: 0.4, stop: 0.06, shake: 1 }] },
  flyingkick: { move: 'flyingkick', dur: 0.5, step: 18, carry: 0.45, strikes: [{ at: 0.45, pct: 105, reach: 58, h: 56, knock: 120, stop: 0.05 }] },
  haymaker: { move: 'haymaker', dur: 0.62, step: 8, finisher: true, strikes: [{ at: 0.5, pct: 170, reach: 56, h: 56, knock: 260, launch: 120, big: true, stop: 0.09, shake: 3 }] },
  cartwheel: { move: 'cartwheel', dur: 0.6, step: 16, carry: 0.5, finisher: true, strikes: [{ at: 0.48, pct: 150, reach: 60, h: 70, knock: 160, launch: 220, big: true, stop: 0.07, shake: 2 }] },
};

export const PATH_VARIANTS = {
  fists: [
    [COMBOS.none[0], FISTS.headbutt],
    [COMBOS.none[1], FISTS.flyingkick],
    [COMBOS.none[2], FISTS.haymaker, FISTS.cartwheel],
  ],
  // The Warrior. Openers: a cut, a hip-height sweep, three lightning jabs, or a flash cut that
  // blurs through the line. Second: the return cut, a spinning backhand, a shoulder check, or a
  // driving stab through the line. Third: the cross-cut, a rising diagonal that pops them up, or
  // a wound-up home-run swing that sends them flying. Finisher: the cleave, a leaping chop, or a
  // sky-splitter that leaps high and splits the ground in slow motion.
  warrior: [
    [PATH_COMBOS.warrior[0], SWINGS.sweep, SWINGS.jabs, SWINGS.flashcut],
    [PATH_COMBOS.warrior[1], SWINGS.spinback, SWINGS.shove, SWINGS.drivestab, SWINGS.pommel],
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
    // (Her shoulder check is a shield rush: a few running steps behind a flare of light.)
    [PATH_COMBOS.paladin[1], { ...dressed(SWINGS.shove, { stun: 0.4, burst: 'aegis' }), move: 'shieldrush', dur: 0.5, step: 34, carry: 0.42 }, SWINGS.spinback,
      { move: 'guardspin', dur: 0.56, step: 4, strikes: [{ at: 0.5, pct: 85, reach: 78, h: 60, around: true, targets: 4, knock: 100, arc: [0, 330], thick: 10, burst: 'aegis', stop: 0.04 }] }],
    [PATH_COMBOS.paladin[2],
      { move: 'ascend', dur: 0.5, step: 8, strikes: [{ at: 0.45, pct: 120, reach: 80, h: 84, targets: 3, knock: 40, launch: 380, burst: 'aegis', arc: [100, -215], thick: 10, big: true, stop: 0.06 }] },
      SWINGS.drivestab,
      { move: 'kneelstab', dur: 0.62, step: 12, strikes: [{ at: 0.45, pct: 140, reach: 100, h: 48, targets: 3, pierce: true, knock: 210, stun: 0.3, burst: 'aegis', big: true, stop: 0.07, shake: 2 }] }],
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
  // three arrows in a burst, a hop back loosing two down at them, or a backflip fan of three.
  // Finisher: her full draw, an overdraw that tears through the line, or a volley up that rains
  // back down on them.
  // The Thief with a dagger, light and acrobatic. Openers: her stab, a blur of stabs, or a flash cut
  // that darts through. Second: her slash, a spinning roundhouse kick, or a spinning backhand.
  // Second: a slash up into a backflip, a plain slash, a spinning roundhouse kick, or a spinning
  // backhand. Finisher, always planted in reach so the next string flows on: the X-cut, a vaulting
  // front flip that cuts down out of the air, or a whirl that cuts all round her.
  thiefdagger: [
    [PATH_COMBOS.thiefdagger[0],
      { move: 'flurry', dur: 0.32, step: 8, strikes: [{ at: 0.3, pct: 50, reach: 58, h: 46, knock: 15, pierce: true }, { at: 0.7, pct: 55, reach: 58, h: 46, knock: 30, pierce: true }] },
      { move: 'flashcut', dur: 0.34, step: 30, carry: 0.42, strikes: [{ at: 0.4, pct: 90, reach: 62, h: 50, targets: 2, knock: 40, arc: [-80, 200], thick: 5, pierce: true }] }],
    [PATH_COMBOS.thiefdagger[1],
      { move: 'slash', dur: 0.3, step: 6, strikes: [{ at: 0.45, pct: 90, reach: 58, h: 52, knock: 35, arc: [-100, 190], thick: 5 }] },
      { move: 'spinkick', dur: 0.4, step: 8, strikes: [{ at: 0.5, pct: 90, reach: 52, h: 52, knock: 110, stop: 0.04 }] },
      { move: 'spinback', dur: 0.38, step: 8, strikes: [{ at: 0.58, pct: 95, reach: 60, h: 56, targets: 2, knock: 60, launch: 100, arc: [100, -215], thick: 5 }] }],
    [PATH_COMBOS.thiefdagger[2],
      { move: 'vaultcut', dur: 0.66, step: 24, carry: 0.5, finisher: true, strikes: [{ at: 0.56, pct: 150, reach: 64, h: 62, targets: 3, knock: 90, launch: 260, arc: [-150, 190], thick: 7, big: true, stop: 0.06, shake: 2 }] },
      { move: 'whirlfin', dur: 0.72, step: 6, finisher: true, strikes: [{ at: 0.21, pct: 70, reach: 58, h: 56, around: true, targets: 3, knock: 30, arc: [-90, 360], thick: 5 }, { at: 0.42, pct: 110, reach: 60, h: 56, around: true, targets: 3, knock: 170, arc: [-90, 360], thick: 6, big: true, stop: 0.05 }] }],
  ],
  // The Thief with a gauntlet. Openers: her star or a twirling throw. Second: a backflip whipping
  // two stars down, two stars, or a fan of three at once. Finisher: the heaving throw of the moon
  // star, or a twirl that flings it out of the turn.
  thiefstar: [
    [PATH_COMBOS.thiefstar[0],
      { move: 'twirlthrow', dur: 0.44, strikes: [{ at: 0.62, shot: 'star', pct: 90, range: 280, h: 60, knock: 30, speed: 800 }] }],
    [PATH_COMBOS.thiefstar[1],
      { move: 'barrage', dur: 0.4, strikes: [{ at: 0.17, shot: 'star', pct: 55, range: 280, h: 60, knock: 20, speed: 760 }, { at: 0.5, shot: 'star', pct: 60, range: 280, h: 60, knock: 25, speed: 760, oy: 4 }] },
      { move: 'throw', dur: 0.42, strikes: [{ at: 0.5, shot: 'star', fan: 3, pct: 45, range: 280, h: 110, knock: 30, speed: 760, muzzle: 'smokepuff' }] }],
    [PATH_COMBOS.thiefstar[2],
      { move: 'twirlthrow', dur: 0.62, step: 6, finisher: true, strikes: [{ at: 0.62, shot: 'moonstar', pct: 150, range: 320, h: 80, targets: 2, pierce: true, speed: 860, knock: 190, big: true, stop: 0.05, shake: 2 }] }],
  ],
  // The Shinobi. Openers: her kunai stab, a blur of stabs, or a dash cut through the line.
  // Second: her slash, a palm strike that slaps a seal on them (it bursts a beat later), or a
  // spinning throw of three kunai, or a slash up into a backflip throwing two down. Finisher, always
  // planted in reach: the X-cut, a vaulting cut, or a whirl.
  shinobi: [
    [PATH_COMBOS.shinobi[0],
      { move: 'flurry', dur: 0.3, step: 8, strikes: [{ at: 0.3, pct: 55, reach: 58, h: 46, knock: 15, pierce: true }, { at: 0.7, pct: 60, reach: 58, h: 46, knock: 30, pierce: true }] },
      { move: 'flashcut', dur: 0.32, step: 32, carry: 0.42, strikes: [{ at: 0.4, pct: 95, reach: 62, h: 50, targets: 2, knock: 40, arc: [-80, 200], thick: 5, pierce: true }] }],
    [PATH_COMBOS.shinobi[1],
      { move: 'palmseal', dur: 0.4, step: 10, strikes: [{ at: 0.42, pct: 60, reach: 50, h: 52, knock: 20, fx: 'sealtag' }, { at: 0.42, delay: 0.5, pct: 110, reach: 70, h: 70, around: true, targets: 3, knock: 120, burst: 'sealburst', burstAt: 0.5, stop: 0.04, shake: 1, quiet: true }] },
      { move: 'kunaifan', dur: 0.42, strikes: [{ at: 0.55, shot: 'kunai', fan: 3, pct: 55, range: 260, h: 120, knock: 40, speed: 900 }] },
      { move: 'slash', dur: 0.28, step: 6, strikes: [{ at: 0.45, pct: 100, reach: 60, h: 52, knock: 35, arc: [-100, 190], thick: 5 }] }],
    [PATH_COMBOS.shinobi[2],
      { move: 'vaultcut', dur: 0.66, step: 24, carry: 0.5, finisher: true, strikes: [{ at: 0.56, pct: 155, reach: 64, h: 62, targets: 3, knock: 90, launch: 260, arc: [-150, 190], thick: 7, big: true, burst: 'inkhit', burstAt: 0.5, stop: 0.06, shake: 2 }] },
      { move: 'whirlfin', dur: 0.72, step: 6, finisher: true, strikes: [{ at: 0.21, pct: 75, reach: 58, h: 56, around: true, targets: 3, knock: 30, arc: [-90, 360], thick: 5 }, { at: 0.42, pct: 115, reach: 60, h: 56, around: true, targets: 3, knock: 170, arc: [-90, 360], thick: 6, big: true, stop: 0.05 }] }],
  ],
  // The Spirit Mage's dance. Openers: the sweep, the bells shaken three times, or a rise onto one
  // foot. Second: the swaying step, the sleeve fan (three bolts fanning out), or the bells.
  // Finisher: the dance's last figure, or the bow and rise that throws the great bolt up and out.
  spiritmage: [
    [PATH_COMBOS.spiritmage[0],
      { move: 'bellshake', dur: 1.23, step: 0, strikes: [0.3, 0.5, 0.7].map((at, i) => ({ at, shot: 'spiritorb', magic: true, pct: 90, range: 280, h: 70, knock: 15, speed: 620, oy: [-6, 0, 6][i] })) },
      { move: 'twirlstep', dur: 1.14, step: 6, strikes: [{ at: 0.58, shot: 'spiritorb', magic: true, pct: 210, range: 290, h: 60, knock: 35, speed: 620 }] }],
    [PATH_COMBOS.spiritmage[1],
      { move: 'sleevefan', dur: 1.1, step: -6, strikes: [{ at: 0.52, shot: 'spiritorb', magic: true, fan: 3, pct: 100, range: 280, h: 120, knock: 30, speed: 600 }] },
      { move: 'bellshake', dur: 1.23, step: 0, strikes: [0.3, 0.5, 0.7].map((at, i) => ({ at, shot: 'spiritorb', magic: true, pct: 90, range: 280, h: 70, knock: 15, speed: 620, oy: [6, 0, -6][i] })) }],
    [PATH_COMBOS.spiritmage[2],
      { move: 'bowrise', dur: 1.54, step: 2, finisher: true, strikes: [{ at: 0.6, shot: 'spiritbig', magic: true, pct: 365, range: 300, h: 110, lift: 40, targets: 3, pierce: true, speed: 640, knock: 120, launch: 300, big: true, stop: 0.06, shake: 2 }] }],
  ],
  // The Kitsune. Openers: her fox-fire star or a twirling throw. Second: a backflip whipping two
  // stars down, two stars, or a fan of three. Finisher, always planted in reach: the heaving throw,
  // a pounce that throws down at them as she lands, or a twirl that flings the great star.
  kitsune: [
    [PATH_COMBOS.kitsune[0],
      { move: 'twirlthrow', dur: 0.42, strikes: [{ at: 0.62, shot: 'foxstar', pct: 95, range: 290, h: 60, knock: 30, speed: 800 }] }],
    [PATH_COMBOS.kitsune[1],
      { move: 'barrage', dur: 0.4, strikes: [{ at: 0.17, shot: 'foxstar', pct: 60, range: 290, h: 60, knock: 20, speed: 780 }, { at: 0.5, shot: 'foxstar', pct: 65, range: 290, h: 60, knock: 25, speed: 780, oy: 4 }] },
      { move: 'throw', dur: 0.42, strikes: [{ at: 0.5, shot: 'foxstar', fan: 3, pct: 48, range: 290, h: 110, knock: 30, speed: 780 }] }],
    [PATH_COMBOS.kitsune[2],
      { move: 'foxpounce', dur: 0.64, step: 50, carry: 0.55, finisher: true, strikes: [{ at: 0.56, shot: 'foxmoon', fan: 2, pct: 110, range: 260, h: 120, drop: 30, knock: 160, speed: 900, big: true, stop: 0.05, shake: 2 }] },
      { move: 'twirlthrow', dur: 0.62, step: 6, finisher: true, strikes: [{ at: 0.62, shot: 'foxmoon', pct: 160, range: 320, h: 64, targets: 3, pierce: true, speed: 860, knock: 190, big: true, stop: 0.05, shake: 2 }] }],
  ],
  archer: [
    [PATH_COMBOS.archer[0], ARCHER_SHOTS.kick, ARCHER_SHOTS.twirl, ARCHER_SHOTS.lob],
    [PATH_COMBOS.archer[1], ARCHER_SHOTS.burst, ARCHER_SHOTS.hop, ARCHER_SHOTS.triple, ARCHER_SHOTS.flipfan],
    [PATH_COMBOS.archer[2], ARCHER_SHOTS.overdraw, ARCHER_SHOTS.skyrain],
  ],
  // The Beastmaster, quick and wild, her green arrows flying beside her animals. Openers: her snap
  // shot, the point-blank kick, or a slide in loosing two. Second: her backflip fan, her twirl, a
  // burst of three, or a hop back loosing two down. Finisher: her gale shot, an overdraw through
  // the line, or a volley up that rains back down on them.
  beastmaster: [
    [PATH_COMBOS.beastmaster[0], BEAST_SHOTS.kick, BEAST_SHOTS.slide],
    [PATH_COMBOS.beastmaster[1], BEAST_SHOTS.twirl, BEAST_SHOTS.burst, BEAST_SHOTS.hop],
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
  // The Spirit Mage: a bolt swept up at whatever flies, spirit bolts swept down from a float in the
  // air, and a bolt whipped out of a glide.
  spiritmage: {
    up: { move: 'kaguraup', dur: 1.1, step: 0, strikes: [{ at: 0.5, shot: 'spiritbig', magic: true, pct: 240, range: 260, h: 190, lift: 50, targets: 2, pierce: true, knock: 20, launch: 380, speed: 640, big: true, stop: 0.05 }] },
    air: [
      { move: 'floatcast', dur: 0.88, hang: true, strikes: [{ at: 0.48, shot: 'spiritorb', magic: true, fan: 2, pct: 165, range: 260, h: 170, drop: 50, knock: 30, speed: 620 }] },
      { move: 'floatcast2', dur: 1.01, hang: true, finisher: true, strikes: [{ at: 0.55, shot: 'spiritbig', magic: true, fan: 2, pct: 210, range: 260, h: 190, drop: 60, knock: 120, speed: 660, big: true, stop: 0.05, shake: 1 }] },
    ],
    dash: { move: 'glidecast', dur: 1.06, step: 40, carry: 0.5, strikes: [{ at: 0.5, shot: 'spiritorb', magic: true, fan: 2, pct: 185, range: 280, h: 80, knock: 80, speed: 640 }] },
  },
  // The Kitsune: two fox-fire stars flung up at whatever flies, fans of them thrown down from a
  // hang in the air, and a pounce out of a run that throws two as she lands.
  kitsune: {
    up: { move: 'upthrow', dur: 0.44, strikes: [{ at: 0.45, shot: 'foxstar', fan: 2, pct: 105, range: 260, h: 190, lift: 50, knock: 20, launch: 380, speed: 780, big: true, stop: 0.04 }] },
    air: [
      { move: 'airthrow', dur: 0.34, hang: true, strikes: [{ at: 0.45, shot: 'foxstar', fan: 3, pct: 65, range: 260, h: 170, drop: 50, knock: 30, speed: 780 }] },
      { move: 'airthrow', dur: 0.4, hang: true, finisher: true, strikes: [{ at: 0.5, shot: 'foxmoon', fan: 2, pct: 100, range: 260, h: 190, drop: 60, knock: 120, speed: 860, big: true, stop: 0.05, shake: 1 }] },
    ],
    dash: { move: 'foxpounce', dur: 0.56, step: 60, carry: 0.55, strikes: [{ at: 0.56, shot: 'foxstar', fan: 2, pct: 90, range: 260, h: 110, drop: 20, knock: 90, speed: 820 }] },
  },
  // The Thief with a gauntlet: a star flung up at whatever flies, stars thrown down from a hang in
  // the air, and a star thrown out of a run.
  thiefstar: {
    up: { move: 'upthrow', dur: 0.44, strikes: [{ at: 0.45, shot: 'star', fan: 2, pct: 100, range: 260, h: 190, lift: 50, knock: 20, launch: 360, speed: 760, big: true, stop: 0.04 }] },
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
    down: { move: 'downshot', dur: 0.5, strikes: [{ at: 0.5, shot: 'hawkarrow', fan: 2, pct: 95, range: 280, h: 220, drop: 120, knock: 40, speed: 880 }] },
    up: { move: 'skyshot', dur: 0.5, strikes: [{ at: 0.5, shot: 'hawkbig', fan: 2, pct: 105, range: 280, h: 190, lift: 50, knock: 20, launch: 360, speed: 880, big: true, stop: 0.05 }] },
    air: [
      { move: 'airshot', dur: 0.38, hang: true, strikes: [{ at: 0.45, shot: 'hawkarrow', fan: 2, pct: 75, range: 280, h: 170, drop: 50, knock: 30, speed: 880 }] },
      { move: 'airshot2', dur: 0.42, hang: true, finisher: true, strikes: [{ at: 0.5, shot: 'hawkbig', fan: 2, pct: 95, range: 280, h: 190, drop: 60, knock: 120, speed: 920, big: true, stop: 0.05, shake: 1 }] },
    ],
    dash: { move: 'slideshot', dur: 0.5, step: 44, carry: 0.6, strikes: [{ at: 0.42, shot: 'hawkarrow', pct: 95, range: 300, h: 60, knock: 80, speed: 880 }] },
  },
  // The Beastmaster: a wild arrow shot up at fliers, two down from a hang, a slide shot out of a
  // run, and down at whatever is below.
  beastmaster: {
    down: { move: 'downshot', dur: 0.48, strikes: [{ at: 0.5, shot: 'windarrow', fan: 2, pct: 95, range: 280, h: 220, drop: 120, knock: 40, speed: 900 }] },
    up: { move: 'skyshot', dur: 0.5, strikes: [{ at: 0.5, shot: 'galearrow', fan: 2, pct: 110, range: 280, h: 190, lift: 50, knock: 20, launch: 380, speed: 900, big: true, stop: 0.05 }] },
    air: [
      { move: 'airshot', dur: 0.36, hang: true, strikes: [{ at: 0.45, shot: 'windarrow', fan: 2, pct: 75, range: 280, h: 170, drop: 50, knock: 30, speed: 900 }] },
      { move: 'airshot2', dur: 0.42, hang: true, finisher: true, strikes: [{ at: 0.5, shot: 'galearrow', fan: 3, pct: 90, range: 280, h: 190, drop: 60, knock: 120, speed: 950, big: true, stop: 0.05, shake: 1 }] },
    ],
    dash: { move: 'slideshot', dur: 0.5, step: 46, carry: 0.6, strikes: [{ at: 0.35, shot: 'windarrow', pct: 80, range: 300, h: 60, knock: 30, speed: 900 }, { at: 0.62, shot: 'windarrow', pct: 90, range: 300, h: 60, knock: 90, speed: 900 }] },
  },
  // The Stormcaller: a thunderbolt up at fliers, two bolts down from a hang, a slide shot out of a
  // run, and down at whatever is below.
  stormcaller: {
    down: { move: 'downshot', dur: 0.5, strikes: [{ at: 0.5, shot: 'stormbolt', fan: 2, pct: 95, range: 280, h: 220, drop: 120, knock: 40, speed: 1000 }] },
    up: { move: 'skyshot', dur: 0.5, strikes: [{ at: 0.5, shot: 'thunderbolt', fan: 2, pct: 105, range: 280, h: 190, lift: 50, knock: 20, launch: 360, speed: 1000, big: true, stop: 0.05 }] },
    air: [
      { move: 'airshot', dur: 0.38, hang: true, strikes: [{ at: 0.45, shot: 'stormbolt', fan: 2, pct: 75, range: 280, h: 170, drop: 50, knock: 30, speed: 1000 }] },
      { move: 'airshot2', dur: 0.42, hang: true, finisher: true, strikes: [{ at: 0.5, shot: 'thunderbolt', fan: 2, pct: 95, range: 280, h: 190, drop: 60, knock: 120, speed: 1050, big: true, stop: 0.05, shake: 1 }] },
    ],
    dash: { move: 'slideshot', dur: 0.5, step: 44, carry: 0.6, strikes: [{ at: 0.42, shot: 'stormbolt', pct: 95, range: 300, h: 60, knock: 80, speed: 1000 }] },
  },
};
// The archers' air leap (world/agility.js): jump again in mid-air and she springs up and back in a
// backflip, loosing two shots down at them from the top of it.
for (const [path, arrow, big] of [['archer', 'hawkarrow', 'feathers'], ['beastmaster', 'windarrow', 'gust'], ['stormcaller', 'stormbolt', 'stormspark']]) {
  ARCHER_COMMANDS[path].leap = { move: 'leapshot', dur: 0.5, strikes: [{ at: 0.55, shot: arrow, fan: 2, pct: 80, range: 280, h: 180, drop: 50, knock: 50, speed: 900, muzzle: big }] };
}
export function airLeap(world) {
  const leap = ARCHER_COMMANDS[pathOf(world)]?.leap;
  if (!leap) return;
  const b = world.body;
  b.vy = Math.min(b.vy, -380);
  b.vx = -b.facing * 210;
  playStep(world, leap, 100, 'basicleap');
}

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
// Running + attack, the paths' own: the Paladin drives her shield shoulder in behind a flare of
// light that dazes them; the Berserker leaps into a chop that tears the ground.
const PATH_DASH = {
  paladin: { move: 'bash', dur: 0.48, step: 56, carry: 0.45, strikes: [{ at: 0.42, pct: 140, reach: 64, h: 62, targets: 3, knock: 240, stun: 0.6, burst: 'aegis', burstAt: 0.7, big: true, stop: 0.06, shake: 2 }] },
  berserker: { move: 'leapchop', dur: 0.6, step: 64, carry: 0.5, strikes: [{ at: 0.55, pct: 150, reach: 86, h: 72, targets: 3, knock: 220, crack: true, bleed: { pct: 0.15, secs: 3 }, arc: [-105, 190], thick: 14, big: true, stop: 0.08, shake: 3 }] },
};
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
// The Shinobi's dagger commands: a launcher that throws a kunai up after them, fast air cuts then
// a fan of kunai thrown down, and out of a run a dash through the line in a burst of smoke.
const SHINOBI_COMMANDS = {
  up: { ...DAGGER_COMMANDS.up, strikes: [{ ...DAGGER_COMMANDS.up.strikes[0], pct: 115 }, { at: 0.7, shot: 'kunai', pct: 60, range: 220, h: 200, lift: 80, knock: 20, speed: 900 }] },
  air: [
    DAGGER_COMMANDS.air[0],
    DAGGER_COMMANDS.air[1],
    { move: 'airthrow', dur: 0.4, hang: true, finisher: true, strikes: [{ at: 0.5, shot: 'kunai', fan: 4, pct: 70, range: 240, h: 200, drop: 90, knock: 80, speed: 950, big: true, stop: 0.04, shake: 1 }] },
  ],
  dash: { ...DAGGER_COMMANDS.dash, smoke: true },
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
// Ki: the Shinobi's gauge. Every hit builds it, and so does every dodge (a monster's blow that
// misses her, a Smoke Bomb, a Log Swap); it fades once the fighting stops. Full (Shadow Clones),
// two ink clones of her repeat every attack, each at CLONE_POWER.
export const KI_MAX = 100;
const KI_HOLD = 5;
const KI_DRAIN = 12;
export const CLONE_POWER = 0.35;
const CLONE_LAG = 0.08;
export const hasKi = (char) => jobChain(char.job).includes('shinobi');
export function addKi(world, n) {
  if (!hasKi(world.char) || n <= 0) return;
  world.ki = Math.min(KI_MAX, (world.ki ?? 0) + n);
  world.kiAt = world.now;
}
export const shadowClones = (world) => hasKi(world.char) && (world.ki ?? 0) >= KI_MAX;
// Tails: the Kitsune's gauge, one fox-fire tail to nine. Stars that land build it, half again on
// a monster already burning; it fades once the fighting stops. Every three tails, one more
// fox-fire illusion throws a star beside each of hers (ILLUSION_POWER of its strength); full
// (Nine Tails), three of them, and the finisher is ready.
export const TAILS_MAX = 100;
const TAILS_HOLD = 5;
const TAILS_DRAIN = 10;
export const ILLUSION_POWER = 0.3;
export const hasTails = (char) => jobChain(char.job).includes('kitsune');
export function addTails(world, n, mob = null) {
  if (!hasTails(world.char) || n <= 0) return;
  const burning = mob && mob.poison?.kind === 'burn' && mob.poison.until > world.now;
  world.tails = Math.min(TAILS_MAX, (world.tails ?? 0) + n * (burning ? 1.5 : 1));
  world.tailsAt = world.now;
}
// Endless barrages (a passive for three paths, data/skills.js): while attack is held her basic
// attack goes on and on, faster the longer it's held, building through stages of its own; she can
// walk slowly through it (world.js), and in the air she hangs a moment, then keeps going as she
// falls. Let go after a while and a finisher ends it, stronger the longer she held.
//   Kitsune     Endless Fox-Fire: fox-fire stars hand over hand (Fox Sign, Trickster, Wheel,
//               Ascension), ending in a fox-moon star
//   Shinobi     Endless Blade Dance: quick cuts, spinning cuts, blinking from monster to monster
//               through ink, then her ink clones joining the storm; ending in one drawn cut, a
//               giant brush stroke of ink through the line
//   Beastmaster Wild Hunt: quick shots, shooting on the move, then Snow wolf joins the hunt and
//               they fight as one, and at the top a gale of leaves wheels round her; ending in a
//               great gale arrow as Snow wolf brings the moon down on them
export const BARRAGE_WALK = 0.35;
const BARRAGE_HANG = 0.6;
const BARRAGE_FINISH_AFTER = 0.6;
// How far it has built (`heat`): 0 to 1 over the ramp, then on to 1.6 over FRENZY more seconds,
// so it keeps getting better after it's at full speed.
const FRENZY = 3;
export const barrageHeat = (b, held) => Math.min(1, held / b.ramp) + 0.6 * Math.min(1, Math.max(0, held - b.ramp) / FRENZY);
// Each path's barrage: its skill, its school (the stage flares), its figures (render/moves.js) and
// how long each plays, the stages they're drawn from as it builds, the air figures, and what each
// beat looses (`strike`), anything else it does on a beat (`beat`), and the finisher (`finish`).
// A figure plays for its own length (a little quicker as it speeds up) while the beats keep the
// barrage's rate; never the same figure twice running.
const FOX_SIGNS = new Set(['foxdeal2', 'foxfloat2']);
// The Shinobi's cuts, by figure: their reach and the arc of the ink they leave.
const INK_CUTS = {
  inkjab: { reach: 62, h: 46, pierce: true, targets: 2 },
  inkjab2: { reach: 62, h: 44, pierce: true, targets: 2 },
  inkslice: { reach: 64, h: 54, arc: [-100, 190], thick: 6, targets: 2 },
  inkspin: { reach: 66, h: 56, around: true, arc: [-90, 360], thick: 6, targets: 3 },
  inkrise: { reach: 64, h: 70, arc: [80, -175], thick: 6, targets: 2 },
  inkhook: { reach: 60, h: 54, arc: [110, -230], thick: 6, targets: 2 },
  inkblink: { reach: 66, h: 60, arc: [-150, 200], thick: 7, targets: 3 },
  inkblink2: { reach: 66, h: 56, arc: [100, -215], thick: 7, targets: 3 },
  inkstorm: { reach: 72, h: 60, arc: [-115, 205], thick: 8, targets: 3 },
  inkstorm2: { reach: 76, h: 72, arc: [-170, 330], thick: 9, targets: 4 },
  inkaircut: { reach: 62, h: 80, arc: [-60, 150], thick: 6, targets: 2 },
  inkairspin: { reach: 64, h: 80, around: true, arc: [-90, 360], thick: 6, targets: 3 },
};
export const STREAMS = {
  kitsune: {
    skill: 'foxbarrage', school: 'fox', hover: true,
    figures: { foxdeal: 0.28, foxdeal2: 0.28, foxspin: 0.42, foxbehind: 0.4, foxhopback: 0.42, foxlob: 0.36, foxwheel: 0.5, foxwheel2: 0.5, foxfloat: 0.62, foxfloat2: 0.62, foxairthrow: 0.3, foxairspin: 0.36 },
    stages: [
      { at: 0, figures: ['foxdeal', 'foxdeal2'] },
      { at: 0.45, figures: ['foxdeal', 'foxspin', 'foxbehind', 'foxhopback', 'foxlob'] },
      { at: 0.9, figures: ['foxwheel', 'foxwheel2', 'foxspin'] },
      { at: 1.25, figures: ['foxfloat', 'foxfloat2'] },
      { at: 1.55, figures: ['foxfloat', 'foxfloat2'] },
    ],
    air: (heat) => (heat >= 0.9 ? ['foxairthrow', 'foxairspin'] : ['foxairthrow']),
    ready: (world) => Boolean(activeStar(world.char)),
    // (On the ground her throws come from the hip, lower than a bow hand.)
    strike: (b, { air, stage, move }) => ({ at: 0.4, shot: 'foxstar', pct: b.pct, range: 290, h: air ? 170 : 60, drop: air ? 40 : 0, knock: 8, speed: 820, gauge: 1, oy: air ? 0 : 5, wheel: !air && stage >= 2, sign: FOX_SIGNS.has(move) }),
    // No finisher: it's for holding on mobs and bosses, so letting go just stops (the wheel of
    // fox fire still flies apart).
  },
  shinobi: {
    skill: 'inkdance', school: 'ink', closeIn: 40,
    figures: { inkjab: 0.22, inkjab2: 0.22, inkslice: 0.28, inkspin: 0.4, inkrise: 0.34, inkhook: 0.34, inkblink: 0.36, inkblink2: 0.36, inkstorm: 0.34, inkstorm2: 0.44, inkaircut: 0.28, inkairspin: 0.36 },
    stages: [
      { at: 0, figures: ['inkjab', 'inkjab2', 'inkslice'] },
      { at: 0.45, figures: ['inkslice', 'inkspin', 'inkrise', 'inkhook'] },
      { at: 0.9, figures: ['inkblink', 'inkblink2', 'inkspin'] },
      { at: 1.25, figures: ['inkstorm', 'inkstorm2', 'inkblink', 'inkblink2'] },
      { at: 1.55, figures: ['inkstorm', 'inkstorm2', 'inkblink2'] },
    ],
    air: (heat) => (heat >= 0.45 ? ['inkaircut', 'inkairspin'] : ['inkaircut']),
    ready: () => true,
    strike: (b, { move, stage }) => ({ at: 0.45, pct: b.pct, knock: stage >= 3 ? 24 : 10, gauge: 1, ...INK_CUTS[move], burst: stage >= 2 && (move === 'inkstorm2' || move === 'inkblink') ? 'inkhit' : undefined }),
    // Ink Blink: at the start of a blink figure she melts into ink and steps out on the far side
    // of the monster in front, turning to cut it (back and forth through the line).
    start: (world, run, move) => {
      if (!move.startsWith('inkblink') || !world.body.onGround) return;
      const b = world.body;
      const m = pickTargets(world.mobs, b, { w: 170, h: 40 }, 1)[0];
      if (!m) return;
      const side = Math.sign(m.x - b.x) || b.facing;
      const nx = Math.max(b.w / 2, Math.min(world.map.width - b.w / 2, m.x + side * 26));
      world.fx.push({ kind: 'inkbrush', x: (b.x + nx) / 2, y: b.y - 22, len: Math.abs(nx - b.x), dir: side, t: 0, dur: 0.4, seed: Math.random() });
      world.fx.push({ kind: 'smokeburst', x: b.x, y: b.y, dir: side, t: 0, dur: 0.6 });
      b.x = nx;
      b.facing = -side;
      world.fx.push({ kind: 'smokeburst', x: nx, y: b.y, dir: -side, t: 0, dur: 0.6 });
    },
    // The Clone Storm (from stage 3): two ink clones of her join in, each beat (render/scene.js
    // draws them dancing the figures a beat behind her).
    clones: 3,
    finish: (b, pct, k, air) => (air
      ? { move: 'inkaircut', dur: 0.42, hang: true, finisher: true, strikes: [{ at: 0.5, pct, reach: 90, h: 120, targets: 4, arc: [-80, 200], thick: 14, knock: 200, launch: 160, big: true, burst: 'inkhit', stop: 0.05 + 0.03 * k, shake: Math.round(1 + 2 * k) }] }
      : { move: 'inkdraw', dur: 0.72, step: 70, carry: 0.56, trail: true, finisher: true, brush: true, strikes: [{ at: 0.56, pct, reach: 120, h: 70, targets: 5, pierce: true, around: false, knock: 240, launch: 180, arc: [-160, 200], thick: 16, big: true, burst: 'inkhit', fx: 'inkcut', stop: 0.06 + 0.04 * k, shake: Math.round(2 + 3 * k) }] }),
  },
  beastmaster: {
    skill: 'wildhunt', school: 'wind',
    figures: { bmsnap: 0.24, bmsnap2: 0.26, bmskip: 0.36, bmspin: 0.4, bmslide: 0.36, bmhunt: 0.36, bmhunt2: 0.36, bmgale: 0.42, bmgale2: 0.44, bmairshot: 0.28, bmairspin: 0.38 },
    stages: [
      { at: 0, figures: ['bmsnap', 'bmsnap2'] },
      { at: 0.45, figures: ['bmsnap', 'bmskip', 'bmspin', 'bmslide'] },
      { at: 0.9, figures: ['bmhunt', 'bmhunt2', 'bmspin', 'bmskip'] },
      { at: 1.25, figures: ['bmgale', 'bmgale2', 'bmhunt'] },
      { at: 1.55, figures: ['bmgale', 'bmgale2'] },
    ],
    air: (heat) => (heat >= 0.45 ? ['bmairshot', 'bmairspin'] : ['bmairshot']),
    ready: () => true,
    strike: (b, { air, stage }) => ({ at: 0.4, shot: stage >= 3 ? 'galearrow' : 'windarrow', pct: b.pct, ...(stage >= 3 ? { targets: 4, pierce: true } : stage >= 1 ? { targets: 2, pierce: true } : {}), range: 300, h: air ? 170 : 60, drop: air ? 40 : 0, knock: 8, speed: 900, gauge: 1, leaf: stage >= 3 && !air }),
    // From the Duet (stage 2) Snow wolf joins the hunt: whenever she's free, she hauls herself
    // over to whatever the arrows are on and cuts it, every few beats (no wait between).
    beat: (world, b, run) => {
      if (run.stage < 2) return;
      const m = pickTargets(world.mobs, world.body, { w: 320, h: 80 }, 1)[0];
      if (m) duetSnow(world, m, b.wolf);
    },
    finish: (b, pct, k, air) => ({
      move: air ? 'airshot2' : 'galeshot', dur: air ? 0.42 : 0.62, step: air ? 0 : -4, hang: air, finisher: true, moon: { pct: Math.round(pct * b.moon), k },
      strikes: [{ at: air ? 0.5 : 0.62, shot: 'galearrow', pct, range: 360, h: air ? 190 : 70, drop: air ? 60 : 0, targets: 4, pierce: true, speed: 950, knock: 230, launch: 120, big: true, muzzle: 'gust', stop: 0.05 + 0.03 * k, shake: Math.round(1 + 2 * k) }],
    }),
  },
};
export const STREAM_MOVES = new Set(Object.values(STREAMS).flatMap((sp) => Object.keys(sp.figures)));
export const streamOf = (world) => STREAMS[pathOf(world)] ?? null;
export function barrageOf(world) {
  const spec = streamOf(world);
  const lv = spec ? world.char.skills[spec.skill] ?? 0 : 0;
  return lv > 0 ? skillAt(spec.skill, lv).barrage : null;
}
// The Shinobi's ink clones are out (the Clone Storm stage).
export const inkStorm = (world) => Boolean(world.barrage?.kind === 'shinobi' && world.barrage.stage >= STREAMS.shinobi.clones);
// The barrage's own dice (xorshift).
function barrageDice(run) {
  let s = run.dice;
  s ^= s << 13;
  s ^= s >>> 17;
  s ^= s << 5;
  run.dice = s >>> 0 || 1;
  return run.dice / 4294967296;
}
function barrageThrow(world, b, rng = Math.random) {
  const { now, body } = world;
  const kind = pathOf(world);
  const spec = STREAMS[kind];
  // A pause (a skill, a stagger) starts the ramp over.
  let run = world.barrage;
  // (It rolls its dice once as it starts: the figures come from its own stream, so the other rolls
  // along the way, every crit and every monster's whim, never change which figure comes next.)
  if (!run || now - run.last > 0.5 || run.kind !== kind) run = world.barrage = { kind, since: now, last: now, n: 0, airSince: null, stage: 0, figure: null, heat: 0, dice: Math.floor(rng() * 4294967296) >>> 0 || 1 };
  const held = now - run.since;
  const rate = b.from + (b.to - b.from) * Math.min(1, held / b.ramp);
  const heat = barrageHeat(b, held);
  run.heat = heat;
  const air = !body.onGround;
  run.airSince = air ? run.airSince ?? now : null;
  // Each new stage flares up in the path's colour round her, harder the higher it goes.
  const stage = spec.stages.findLastIndex((s) => heat >= s.at);
  if (stage > run.stage) {
    if (kind === 'kitsune') world.fx.push({ kind: 'tailwake', x: body.x - body.facing * 8, y: body.y, dir: body.facing, t: 0, dur: 0.6, big: stage >= 3 });
    else world.fx.push({ kind: 'powerup', school: spec.school, x: body.x, y: body.y, t: 0, dur: 0.45, big: stage >= 3 });
    if (stage >= 3) world.juice.push({ type: 'shake', mag: 1, dur: 0.15 });
  }
  run.stage = stage;
  const key = air ? 'basicairstream' : 'basicstream';
  // (Cuts and arrows land in the path's own colour; her stars carry their own.)
  const look = kind === 'kitsune' ? null : spec.school;
  const fig = run.figure;
  // (A new figure starts before this one would run out ahead of the next beat, so she's never
  // left without one.)
  if (!fig || now + 1 / rate > fig.until || fig.air !== air) {
    const pool = (air ? spec.air(heat) : spec.stages[stage].figures).filter((m, i, all) => m !== fig?.move || all.length === 1);
    const move = pool[Math.floor(barrageDice(run) * pool.length)];
    spec.start?.(world, run, move);
    const len = spec.figures[move] * (0.7 + 0.3 * (b.from / rate));
    // A blade dance closes in on them: each figure steps in to the one in front, if it's just out
    // of reach.
    let stepIn = 0;
    if (spec.closeIn && !air) {
      const m = pickTargets(world.mobs, body, { w: 150, h: 40 }, 1)[0];
      if (m) stepIn = Math.max(0, Math.min(spec.closeIn, Math.abs(m.x - body.x) - 34));
    }
    // playStep runs basic moves at 0.9 of their written length.
    playStep(world, { move, dur: len / 0.9, step: stepIn, carry: 0.4, stream: true, hang: air && now - run.airSince < BARRAGE_HANG, strikes: [spec.strike(b, { air, stage, move, heat })] }, 100, key, look);
    // The drawing moves her body through the figures on the barrage's own clock (render/moves.js streamFlow).
    world.pose.flow = { t0: held, heat, kind, float: Boolean(spec.hover) };
    run.figure = { move, until: now + len, air, dur: world.pose.dur };
  } else {
    // Another beat while the figure plays out.
    world.strikes.push({ ...spec.strike(b, { air, stage, move: fig.move, heat }), n: 0, of: 1, due: now + 0.02, dir: body.facing, scale: 100, key, school: look, finisher: false, move: fig.move, dur: fig.dur, hit: 0.4 });
  }
  // The Shinobi's ink clones cut beside her, a beat behind (lighter).
  if (kind === 'shinobi' && stage >= spec.clones) {
    const cut = spec.strike(b, { air, stage, move: run.figure.move, heat });
    for (const lag of [CLONE_LAG, CLONE_LAG * 2]) world.strikes.push({ ...cut, n: 0, of: 1, due: now + 0.02 + lag, dir: body.facing, scale: 100 * CLONE_POWER, key, school: 'ink', finisher: false, move: run.figure.move, dur: run.figure.dur, phantom: true, quiet: true, gauge: 0, burst: undefined });
    world.phantom = { kind: run.figure.move, since: now + CLONE_LAG, dur: run.figure.dur, until: now + CLONE_LAG * 2 + run.figure.dur, clones: true };
  }
  spec.beat?.(world, b, run);
  // The beats keep the barrage's own rate, whatever the figure.
  world.attackTimer = Math.min(world.attackTimer, 0.86 / rate);
  world.lockTimer = Math.min(world.lockTimer, 0.86 / rate);
  world.basicReadyAt = now + 1 / rate;
  run.last = now;
  run.n += 1;
}
// Letting go of attack: the finisher, if her barrage has one and she held long enough (not over a
// skill).
export function barrageRelease(world) {
  const run = world.barrage;
  world.barrage = null;
  // Kitsune: the wheel of fox fire flies apart; Beastmaster: the gale of leaves scatters
  // (render/scene.js drawFoxWheel, drawLeafWheel).
  world.wheelGone = { kind: run.kind, since: run.since, heat: run.heat, goneAt: world.now };
  const spec = STREAMS[run.kind];
  const b = barrageOf(world);
  if (!b || !spec?.finish || pathOf(world) !== run.kind || world.dead || world.body.rope || !spec.ready(world)) return;
  if (world.recoverKind === 'skill' && world.attackTimer > 0) return;
  const held = run.last - run.since;
  if (held < BARRAGE_FINISH_AFTER) return;
  const k = Math.min(1, held / b.full);
  const air = !world.body.onGround;
  const pct = Math.round(b.finish[0] + (b.finish[1] - b.finish[0]) * k);
  const step = spec.finish(b, pct, k, air);
  playStep(world, step, 100, air ? 'basicair1' : 'basic2');
  // The Shinobi's last cut leaves a giant brush stroke of ink along the line.
  if (step.brush) world.fx.push({ kind: 'inkbrush', x: world.body.x + world.body.facing * 70, y: world.body.y - 24, len: 200, dir: world.body.facing, big: true, t: -0.56 * step.dur * 0.9, dur: 0.6, seed: Math.random() });
  // The Beastmaster's: Snow wolf brings the moon down on them as the gale arrow flies.
  if (step.moon) {
    const m = pickTargets(world.mobs, world.body, { w: 340, h: 120 }, 1)[0];
    if (m) duetMoon(world, m, step.moon.pct);
  }
}
export const tailCount = (world) => (hasTails(world.char) ? Math.min(9, Math.floor(((world.tails ?? 0) / TAILS_MAX) * 9 + 1e-9)) : 0);
export const nineTails = (world) => hasTails(world.char) && (world.tails ?? 0) >= TAILS_MAX;
// Spirit: the Spirit Mage's gauge. Her spells that land build it, and so do her heals; turning
// from one to the other (a heal after harm, harm after a heal) builds it half again, so she plays
// best weaving the two. It fades once the fighting stops. Full (Kami's Favour), her damage spells
// also mend allies near where they land (SPIRIT_HEAL of their max HP), and Heaven's Lantern is ready.
export const SPIRIT_MAX = 100;
const SPIRIT_HOLD = 5;
const SPIRIT_DRAIN = 10;
export const SPIRIT_HEAL = 0.03;
export const hasSpirit = (char) => jobChain(char.job).includes('spiritmage');
export function addSpirit(world, n, kind = 'harm') {
  if (!hasSpirit(world.char) || n <= 0) return;
  // A Shrine Maiden builds Grace instead (her heals and wards count most); an Onmyoji, Binding.
  if (hasGrace(world.char)) return addGrace(world, n * (kind === 'mend' ? 1.6 : 0.45));
  if (hasBinding(world.char)) return addBinding(world, n * 0.7);
  const turn = world.spiritKind && world.spiritKind !== kind && world.now - (world.spiritAt ?? -9) < SPIRIT_HOLD;
  world.spirit = Math.min(SPIRIT_MAX, (world.spirit ?? 0) + n * (turn ? 1.5 : 1));
  world.spiritAt = world.now;
  world.spiritKind = kind;
}
export const kamiFavour = (world) => hasSpirit(world.char) && (world.spirit ?? 0) >= SPIRIT_MAX;
// Grace: the Shrine Maiden's gauge, in place of Spirit. Her heals and wards landing build it most,
// more the more allies they reach (her spells that land, a little); it fades once the fighting
// stops. Full (DIVINE GRACE), every heal she gives also wards whoever it mends (GRACE_WARD of their
// max HP, a fresh Spirit Ward on her and the party, at most every GRACE_WARD_EVERY s), and her
// finisher, Thousand Torii, is ready.
export const GRACE_MAX = 100;
const GRACE_HOLD = 6;
const GRACE_DRAIN = 8;
export const GRACE_WARD = 0.1;
const GRACE_WARD_EVERY = 1.5;
export const hasGrace = (char) => jobChain(char.job).includes('shrinemaiden');
export function addGrace(world, n) {
  if (!hasGrace(world.char) || n <= 0) return;
  world.grace = Math.min(GRACE_MAX, (world.grace ?? 0) + n);
  world.graceAt = world.now;
}
export const divineGrace = (world) => hasGrace(world.char) && (world.grace ?? 0) >= GRACE_MAX;
// Binding: the Onmyoji's gauge, in place of Spirit: how tightly she holds her yokai troupe. Her
// spells that land build it, and so does every blow her troupe lands (world/oni.js, yuki.js,
// tengu.js); it fades once the fighting stops. Full (ALL BOUND), her troupe fights faster
// (BOUND_REST of their rest between moves) and her finisher, Troupe Combo, is ready.
export const BINDING_MAX = 100;
const BINDING_HOLD = 6;
const BINDING_DRAIN = 9;
export const BOUND_REST = 0.5;
export const hasBinding = (char) => jobChain(char.job).includes('onmyoji');
export function addBinding(world, n) {
  if (!hasBinding(world.char) || n <= 0) return;
  world.binding = Math.min(BINDING_MAX, (world.binding ?? 0) + n);
  world.bindingAt = world.now;
}
export const allBound = (world) => hasBinding(world.char) && (world.binding ?? 0) >= BINDING_MAX;
// How long a yokai of the troupe rests between moves: shorter when she holds them All Bound, or
// under Yokai Rally.
export const troupeRest = (world) => (allBound(world) ? BOUND_REST : 1) * (world.rally?.until > world.now ? 0.6 : 1);
// How many allies are within `r` of (x, y) besides her (her party in a dungeon), for Grace.
const alliesNear = (world, x, r) => (world.dungeon ? groupOf(world).filter((g) => g.bot && Math.abs(g.body.x - x) <= r).length : 0);
// Divine Grace: a heal she gives wards them too.
function graceWard(world) {
  if (!divineGrace(world) || world.now < (world.graceWardAt ?? 0)) return;
  const ward = world.char.buffs?.spiritward;
  if (ward && ward.until > world.now && ward.shield >= world.stats.maxHp * GRACE_WARD) return;
  world.graceWardAt = world.now + GRACE_WARD_EVERY;
  applyBuff(world, 'spiritward', { duration: 8, buff: { barrier: GRACE_WARD }, range: { w: 440, h: 160, around: true } });
}
// Heals you and the party members within `r` of (x, y) by `pct` of max HP (a heal, like the
// Paladin's Judgment); a Spirit Mage's healing builds her Spirit (not a finisher's: `gauge` false).
export function healAround(world, x, y, pct, r, gauge = true) {
  const { char, body, stats } = world;
  // A Shrine Maiden's Shrine Mastery makes every heal she gives mend more.
  const lv = char.skills?.shrinemastery ?? 0;
  if (lv > 0) pct *= 1 + (skillAt('shrinemastery', lv).passive.healPower ?? 0);
  if (Math.abs(body.x - x) <= r && Math.abs(body.y - y) < 160 && char.hp < stats.maxHp && !world.dead) {
    const amount = Math.max(1, Math.round(stats.maxHp * pct));
    char.hp = Math.min(stats.maxHp, char.hp + amount);
    world.numbers.push({ x: body.x, y: body.y - body.h - 6, text: `+${amount}`, color: '#7ee0b0', t: 0 });
    world.fx.push({ kind: 'healglow', x: body.x, y: body.y, t: 0, dur: 0.7 });
  }
  if (world.dungeon) healMembers(world, pct, { x: x - r, y: y - 160, w: r * 2, h: 320 });
  if (gauge) addSpirit(world, 40 * pct * (1 + 0.5 * alliesNear(world, x, r)), 'mend');
  graceWard(world);
}
// The thrown stars a gauntlet uses up (one each from the set in your bag).
const STAR_SHOTS = new Set(['star', 'moonstar', 'foxstar', 'foxmoon']);
// A job's own gauge: which one the character has ('grace', 'spirit', 'ki', 'tails', 'valor', 'momentum',
// 'shadow', 'rage', 'faith', 'bond' or 'charge'), and how full it is (0-1). Finishers need it full
// and spend it.
export function gaugeOf(char) {
  return hasGrace(char) ? 'grace' : hasBinding(char) ? 'binding' : hasSpirit(char) ? 'spirit' : hasKi(char) ? 'ki' : hasTails(char) ? 'tails' : hasValor(char) ? 'valor' : hasMomentum(char) ? 'momentum' : hasShadow(char) ? 'shadow' : hasRage(char) ? 'rage' : hasFaith(char) ? 'faith' : hasBond(char) ? 'bond' : hasCharge(char) ? 'charge' : null;
}
export function gaugeFull(world) {
  const g = gaugeOf(world.char);
  return Boolean(g) && (world[g] ?? 0) >= 100;
}

// What a shot that lands builds on an archer path's gauge (see world.js).
export function addAim(world, n, mob = null) {
  addSpirit(world, n);
  addTails(world, n, mob);
  addMomentum(world, n);
  addShadow(world, n);
  addBond(world, n);
  addCharge(world, n);
}
// The path a basic attack fights in: a warrior path with a blade, an archer path with its bow.
export function pathOf(world) {
  const { char } = world;
  const w = world.stats.weaponType;
  if ((w === 'wand' || w === 'staff') && hasSpirit(char)) return 'spiritmage';
  if (w === 'dagger' && hasKi(char)) return 'shinobi';
  if (w === 'gauntlet' && hasTails(char)) return 'kitsune';
  if (hasShadow(char) && (w === 'dagger' || w === 'gauntlet')) return w === 'dagger' ? 'thiefdagger' : 'thiefstar';
  if (MELEE.has(w) && w !== 'none') return hasValor(char) ? 'warrior' : hasRage(char) ? 'berserker' : hasFaith(char) ? 'paladin' : null;
  if ((w === 'bow' || w === 'crossbow') && hasMomentum(char)) return 'archer';
  if (w === 'none') return 'fists';
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
    const own = { thiefdagger: DAGGER_COMMANDS, shinobi: SHINOBI_COMMANDS }[pathOf(world)] ?? null;
    const air = own?.air ?? AIR;
    const blades = barrageOf(world);
    if (!body.onGround && !body.rope) {
      if (blades) return barrageThrow(world, blades);
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
    if ((world.runFor ?? 0) >= DASH_AFTER && !(blades && world.barrage)) {
      playStep(world, own?.dash ?? PATH_DASH[hasFaith(world.char) ? 'paladin' : hasRage(world.char) ? 'berserker' : null] ?? DASH, 100, 'basicdash');
      world.combo = -1;
      return;
    }
  }
  // The paths fight their own way: warriors with any blade, axe or spear, archers with their own
  // bow, and the archer paths have their own command shots.
  const path = pathOf(world);
  const cmd = ARCHER_COMMANDS[path];
  const stream = barrageOf(world);
  if (cmd) {
    if (!body.onGround && !body.rope) {
      if (stream) return barrageThrow(world, stream);
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
    if ((world.runFor ?? 0) >= DASH_AFTER && !(stream && world.barrage)) {
      playStep(world, cmd.dash, 100, 'basicdash');
      world.combo = -1;
      return;
    }
  }
  if (stream) return barrageThrow(world, stream);
  const steps = PATH_COMBOS[path] ?? COMBOS[world.stats.weaponType];
  const flowing = world.now <= (world.comboUntil ?? -9);
  if (!flowing) world.owed = 0;
  world.combo = flowing ? ((world.combo ?? -1) + 1) % steps.length : 0;
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
  // The drawing is told when the first blow lands (`hit`) and whether it's a finisher, so each
  // weapon's own timing bends around that moment without moving it (render/moves.js `feel`).
  const timed = step.strikes.filter((st) => !st.onLand);
  world.pose = { from: outgoing(world), kind: step.move, t: dur, dur, since: world.now, hit: timed[0]?.at, fin: Boolean(step.finisher) };
  world.comboUntil = now + dur + WINDOW;
  // Once the last blow lands, moving, jumping, or a skill can cut the follow-through short.
  world.recoverAt = now + (timed.length ? timed.at(-1).at : 1) * dur + 0.03;
  world.recoverKind = key.startsWith('basic') ? 'basic' : 'skill';
  if (key.startsWith('basic')) {
    // Basic attacks keep their rhythm; a finisher or a command move ends with a beat.
    const own = /^basic(air)?\d$/.test(key);
    // A stream of throws (Endless Fox-Fire) goes on with no beat at all.
    world.basicReadyAt = now + (step.stream ? dur : busy + (step.finisher ? AFTER.basicFinisher : own ? 0 : AFTER.command));
  } else {
    // A skill plays out its whole motion, then its beat; a basic attack can follow once the
    // motion is nearly over.
    world.skillReadyAt = now + dur + after;
    world.basicReadyAt = Math.max(world.basicReadyAt ?? 0, now + dur * 0.9);
  }
  // Step into it (or hop back from it): carried until the first strike lands (or through `carry`).
  // A combo's back flips come mid-string, and the next blow darts straight back in over the
  // ground the flip gave up (`owed`), so the string flows on in reach instead of stopping.
  const ownStep = /^basic\d$/.test(key);
  let dx = step.step ?? 0;
  if (ownStep && world.owed && body.onGround && dx > -15) {
    dx += world.owed;
    world.fx.push({ kind: 'chargetrail', school: school ?? pathSchool(world.char), x: body.x, y: body.y, tx: body.x + body.facing * dx, dir: body.facing, t: 0, dur: 0.4 });
  }
  world.owed = ownStep && dx <= -15 ? -dx : 0;
  const first = (step.carry ?? step.strikes[0].at) * dur;
  if (dx) world.lunge = { v: (body.facing * dx) / Math.max(0.05, first), until: now + first };
  if (step.guard) world.invuln = Math.max(world.invuln, step.guard);
  // A dash leaves speed lines and a shock cone along its path.
  // Shield Rush's wall of light, carried before her as she marches.
  if (step.wall) world.fx.push({ kind: 'shieldwall', follow: true, ahead: 22, x: body.x + body.facing * 22, y: body.y, dir: body.facing, t: 0, dur: dur * 0.82 });
  // A Shinobi's dash goes off in a burst of white smoke.
  if (step.smoke) world.fx.push({ kind: 'smokeburst', x: body.x, y: body.y, dir: body.facing, t: 0, dur: 0.8 });
  // A blink (Backstab) leaves a puff of smoke where she melts away and another where she steps out.
  if (step.blink) for (const [at, dx] of [[0.11, 0], [0.4, step.step]]) world.fx.push({ kind: 'blinksmoke', x: body.x + body.facing * dx, y: body.y, dir: body.facing, t: -at * dur, dur: 0.7 });
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
  // Shadow Clones (full Ki) do the same with two ink clones, a beat apart, each lighter still.
  const copies = phantom(world) ? [[PHANTOM_LAG, PHANTOM_POWER, 'shadow']] : shadowClones(world) ? [[CLONE_LAG, CLONE_POWER, 'ink'], [CLONE_LAG * 2, CLONE_POWER, 'ink']] : [];
  if (copies.length && (!step.finisher || key.startsWith('basic'))) {
    world.phantom = { kind: step.move, since: now + copies[0][0], dur, until: now + copies.at(-1)[0] + dur, clones: copies.length > 1 };
    for (const [lag, power, look] of copies) {
      step.strikes.forEach((s, n) => {
        if (s.onLand || (!s.pct && !s.rain)) return;
        world.strikes.push({ ...s, n, of: step.strikes.length, due: now + s.at * dur + (s.delay ?? 0) + lag, dir: body.facing, scale: scale * power, key, school: look, finisher: false, move: step.move, dur, phantom: true, quiet: true, stop: 0, shake: 0, big: false, gauge: 0, hop: 0, flipback: 0, burst: undefined, muzzle: undefined, fx: undefined });
      });
    }
  }
  step.strikes.forEach((s, n) => {
    if (s.onLand) return;
    // The blade's whoosh starts during the wind-up, so it peaks as the blow lands (audio cue).
    if (!s.shot && !s.rain && !s.quiet) world.juice.push({ type: 'swing', in: s.at * dur, big: s.big || step.finisher, thick: s.thick ?? 7, pierce: Boolean(s.pierce && !s.arc), school, weapon: stats.weaponType });
    world.strikes.push({ ...s, n, of: step.strikes.length, due: now + s.at * dur + (s.delay ?? 0), dir: body.facing, scale, key, school, finisher: step.finisher, move: step.move, dur, hit: timed[0]?.at });
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
  if (world.spirit > 0 && world.now - (world.spiritAt ?? 0) > SPIRIT_HOLD) world.spirit = Math.max(0, world.spirit - SPIRIT_DRAIN * dt);
  if (world.grace > 0 && world.now - (world.graceAt ?? 0) > GRACE_HOLD) world.grace = Math.max(0, world.grace - GRACE_DRAIN * dt);
  if (world.binding > 0 && world.now - (world.bindingAt ?? 0) > BINDING_HOLD) world.binding = Math.max(0, world.binding - BINDING_DRAIN * dt);
  if (world.ki > 0 && world.now - (world.kiAt ?? 0) > KI_HOLD) world.ki = Math.max(0, world.ki - KI_DRAIN * dt);
  if (world.tails > 0 && world.now - (world.tailsAt ?? 0) > TAILS_HOLD) world.tails = Math.max(0, world.tails - TAILS_DRAIN * dt);
  if (world.shadow > 0 && world.now - (world.shadowAt ?? 0) > SHADOW_HOLD) world.shadow = Math.max(0, world.shadow - SHADOW_DRAIN * dt);
  if (world.momentum > 0 && world.now - (world.momentumAt ?? 0) > MOMENTUM_HOLD) world.momentum = Math.max(0, world.momentum - MOMENTUM_DRAIN * dt);
  tickTraps(world);
  tickStorm(world);
  tickPets(world, dt);
  tickDoll(world, dt);
  tickShrine(world);
  tickOnmyoji(world);
  tickGuardian(world, dt);
  tickOni(world, dt);
  tickYuki(world, dt);
  tickTengu(world, dt);
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

// A skill's own damage tuning (`dmg` in data/skills.js), for every hit it makes: its combo's
// strikes, its shots, and the hits it calls down (a proc's key is 'proc' and the skill's id).
const FOCUS = [1, 2, 1.5, 1.2, 1];
export const tuneOf = (key) => (key ? SKILLS[key]?.dmg ?? SKILLS[key.replace(/^proc/, '')]?.dmg ?? 1 : 1);

function land(world, s) {
  const { char, stats, body, now } = world;
  // Kami's Favour mending allies where a spell landed (queued for the moment it lands).
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
  const acc = accuracy(JOBS[char.job].family, stats, char.level);
  const power = hasRage(char) ? 1 + (RAGE_POWER * (world.rage ?? 0)) / RAGE_MAX : 1;
  const weight = weightOf(world);
  // A finisher hits harder the fewer it catches: double on one, half again on two (its whole
  // gauge goes into them), so it pays on a lone boss as well as a crowd.
  const focus = SKILLS[s.key]?.fullGauge ? FOCUS[Math.min(targets.length, FOCUS.length - 1)] : 1;
  const tune = tuneOf(s.key) * focus;
  // ...and it feels it: its big blow, a whole gauge into one or two, lands with a heavier stop and shake.
  if (focus > 1 && (s.stop ?? 0) >= 0.1) s = { ...s, stop: Math.max(s.stop ?? 0, 0.1 + 0.04 * focus), shake: Math.max(s.shake ?? 0, 3 + 2 * focus) };
  const dmgRange = s.magic ? magicRange(stats, (s.pct * s.scale * power * tune) / 100) : physicalRange(stats, stats.weaponType, (s.pct * s.scale * power * tune) / 100);
  const cy = body.y - body.h / 2;
  // The smear, spike, or whirl of the blow.
  if (s.pierce) {
    const x = s.dir > 0 ? body.x - 6 : body.x + 6 - s.reach;
    world.fx.push({ kind: 'pierce', school: s.school ? schoolFor(char, s.school) : pathSchool(char), x: body.x, y: body.y, dir: s.dir, box: { x, y: cy - 10, w: s.reach, h: 20 }, t: 0, dur: s.big ? 0.35 : 0.25, move: s.move, at: s.at, moveDur: s.dur, hit: s.hit, fin: s.finisher });
  }
  if (s.arc) {
    world.fx.push({ kind: 'arc', snd: s.school, path: hasRage(char) ? 'rage' : hasFaith(char) ? 'holy' : hasValor(char) ? 'steel' : hasKi(char) ? 'ink' : hasShadow(char) ? 'shadow' : null, x: body.x + s.dir * (s.around ? 0 : 10), y: cy - 2, bx: body.x, by: body.y, move: s.move, at: s.at, moveDur: s.dur, hit: s.hit, fin: s.finisher, dir: s.dir, r: s.around ? s.reach * 0.8 : s.reach * 0.52, start: s.arc[0], sweep: s.arc[1], thick: s.thick ?? 7, big: s.big, flat: s.around, color: TINTS[s.school]?.[s.big ? 1 : 0] ?? (s.big ? HEAVY : BLADE), element: s.key.startsWith('basic') ? weaponElement(char) : null, t: 0, dur: s.big ? 0.32 : 0.24 });
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
  // The Spirit Mage's support spells land with the dance: a buff on her and the party round her
  // (`grant`), Heaven's Lantern raised (`lantern`, world/spiritdoll.js).
  if (s.grant) grantSpell(world, s.grant);
  if (s.lantern) raiseLantern(world, s.key);
  // The Shrine Maiden's lasting spells (world/shrine.js).
  if (s.purify) purify(world, s);
  if (s.revive) resurrect(world, s);
  if (s.torii) thousandTorii(world, s);
  // The Onmyoji's (world/onmyoji.js).
  if (s.ofuda) ofudaBarrage(world, s);
  if (s.seiman) seimanSeal(world, s);
  if (s.rally) yokaiRally(world, s);
  if (s.troupe) troupeCombo(world, s);
  let crits = 0;
  targets.forEach((m, i) => {
    const miss = Math.random() >= hitChance(acc, char.level, m.def);
    let roll = miss ? null : rollHit(dmgRange, stats, m.def, char.level, Math.random, s.crit ? 1 : 0);
    // A backstab hits harder on a monster that isn't facing you.
    const behind = Math.sign(m.dir || 1) === Math.sign(m.x - body.x);
    if (roll && s.backstab && behind) roll = { ...roll, damage: Math.round(roll.damage * s.backstab), crit: true };
    const knock = s.pull ? -Math.sign(m.x - body.x) * s.pull : s.knock * weight;
    world.pending.push({
      at: now, mob: m, miss, damage: roll?.damage ?? 0, crit: roll?.crit ?? false, fromX: body.x, stack: s.n % 3, knock, launch: s.launch, big: s.big, small: s.around && !s.big,
      stun: miss ? undefined : s.stun, bleed: miss ? undefined : s.bleed, burn: miss ? undefined : s.burn, school: s.school, via: s.via ?? 'blade', weapon: stats.weaponType, gauge: s.gauge,
    });
    if (roll?.crit) crits++;
    if (s.fx) world.fx.push({ kind: s.fx, school: s.school, x: m.x, y: m.y, h: m.def.h, dir: s.dir, t: -i * 0.03, dur: 0.6, seed: Math.random() });
    // Each path's own spark on every blow that lands: shards of rage, or a burst of holy light.
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
  // A healing blow mends you and the party around you.
  if (s.heal) healAround(world, body.x, body.y, s.heal, s.healR ?? 220);
  if (s.magic && targets.length && !s.phantom) addSpirit(world, s.gauge ?? 4);
  if (targets.length && !s.phantom) addShadow(world, (s.gauge ?? (s.key.startsWith('basic') ? 3 : 4)));
  if (targets.length && !s.phantom) addKi(world, (s.gauge ?? (s.key.startsWith('basic') ? 3 : 4)));
  if (targets.length && !s.phantom) addTails(world, s.gauge ?? 4, targets[0]);
  if (targets.length) addValor(world, (s.gauge ?? (s.key.startsWith('basic') ? 3 : 4)) * (1 + 0.5 * (targets.length - 1)));
  if (targets.length) addFaith(world, s.faith ?? (s.key.startsWith('basic') ? 2 : 4));
  // A Thief's finisher springs her back out of the blow in a backflip (`flipback`, px), hit or miss.
  if (s.flipback && body.onGround && !s.phantom) {
    world.lunge = { v: (-s.dir * s.flipback) / 0.3, until: world.now + 0.3 };
    if (/^basic\d$/.test(s.key)) world.owed = (world.owed ?? 0) + s.flipback;
  }
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
  const range = s.magic ? magicRange(stats, (s.pct * s.scale * tuneOf(s.key)) / 100) : physicalRange(stats, stats.weaponType, (s.pct * s.scale * tuneOf(s.key)) / 100);
  const roll = miss ? null : rollHit(range, stats, m.def, char.level, Math.random, extraCrit);
  const spark = hasSpirit(char) ? 'spirithit' : hasTails(char) ? 'foxhit' : hasKi(char) ? 'inkhit' : hasShadow(char) ? 'shadowhit' : hasMomentum(char) ? 'hawkhit' : hasBond(char) ? 'galehit' : hasCharge(char) ? (s.shot === 'thunderbolt' || s.shot === 'megabolt' ? 'stormpierce' : 'stormhit') : undefined;
  world.pending.push({
    at: world.now + delay, mob: m, miss, damage: roll?.damage ?? 0, crit: roll?.crit ?? false, fromX: s.fromX ?? body.x, stack, knock: s.knock, launch: s.launch, big: s.big, stop: s.stop, shake: s.shake, element,
    via: s.shot ?? (s.rain ? 'rain' : undefined), stun: miss ? undefined : s.stun, burn: miss ? undefined : s.burn, freeze: miss ? undefined : s.freeze, snare: miss ? undefined : s.snare, burst: s.burst ?? spark, dir: s.dir,
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
  // Kami's Favour: a damage spell scatters mending light over the allies near where it lands.
  if (kamiFavour(world) && !miss && s.magic && s.pct > 0 && !s.doll) {
    world.strikes.push({ healAt: true, x: m.x, y: m.y, amount: SPIRIT_HEAL, due: world.now + delay });
    world.fx.push({ kind: 'spiritmend', x: m.x, y: m.y, t: -delay, dur: 0.6 });
  }
}

// A buff the Spirit Mage's dance gives as it lands (Blessing's regen, Spirit Ward's barrier): on her,
// and on the party in `range` (applyBuff does both for a `party` skill).
function grantSpell(world, g) {
  if (world.dead) return;
  applyBuff(world, g.id, { duration: g.duration, buff: g.buff, range: g.range });
  // A ward (or a blessing) laid on the party builds a Shrine Maiden's Grace, more for each ally.
  addGrace(world, 7 * (1 + alliesNear(world, world.body.x, (g.range?.w ?? 440) / 2)));
}

// A hit of the Spirit Doll's (world/spiritdoll.js): a spell of the Spirit Mage's own magic attack,
// landing `at` seconds from now, knocking monsters away from `x`; it builds Spirit a little.
export function dollHit(world, m, f, at = 0) {
  // (Her yokai troupe hit harder under Yokai Rally.)
  const pct = TROUPE.has(f.key) ? f.pct * (1 + rallyPower(world)) : f.pct;
  shotHit(world, { pct, scale: 100, magic: true, doll: true, key: f.key ?? 'procdoll', dir: Math.sign(m.x - f.x) || 1, fromX: f.x, knock: f.knock ?? 40, launch: f.launch ?? 0, big: f.big, stop: f.stop, shake: f.shake, burst: f.burst ?? 'spirithit', stun: f.stun, freeze: f.freeze, gauge: f.gauge ?? 2 }, m, at);
}

// A shot (or a fan of them, or one that pierces a line) leaves the bow or hand.
function fire(world, strike) {
  // Overcharge: her next few bolts go out as massive bolts of lightning.
  let s = hasCharge(world.char) ? overcharged(world, strike) : strike;
  const { body } = world;
  // A gauntlet throws real stars: one each, from the set in your bag.
  let star = null;
  if (STAR_SHOTS.has(s.shot) && !s.phantom && !s.free) {
    star = useStars(world.char);
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
  // A Kitsune's stars catch fox fire: everything they hit burns a little while.
  if (hasTails(world.char) && STAR_SHOTS.has(s.shot) && !s.burn) s = { ...s, burn: { pct: 0.08, secs: 2 } };
  // Shots leave from the bow hand (chest high), lifted with the pose (a backflip is mid-air).
  let ox = body.x + s.dir * 10;
  let oy = body.y - HAND_Y - (moveAt(s.move, s.at, s.dur)?.lift ?? 0) + (s.oy ?? 0);
  // Endless Fox-Fire: from the Wheel on, the stars peel off the wisp of fox fire swinging round
  // toward them; a star from her fox sign pops a fox face of fire there.
  if ((s.wheel || s.leaf) && world.barrage) {
    const run = world.barrage;
    const wisp = launchWisp(run.heat, world.now - run.since, s.dir, !s.leaf);
    // (At the very top, every other star leaves from the fox spirit's mouth instead.)
    const spirit = !s.leaf && run.heat >= FOX_SPIRIT_HEAT && run.n % 2 === 1 ? foxSpirit(run.heat, world.now - run.since, s.dir).mouth : null;
    ox = body.x + (spirit ?? wisp).x;
    oy = body.y + (spirit ?? wisp).y;
    if (!s.illusion) world.fx.push({ kind: s.leaf ? 'leaflaunch' : 'wisplaunch', x: ox, y: oy, dir: s.dir, t: 0, dur: 0.25 });
  } else if (s.sign && !s.illusion) world.fx.push({ kind: 'foxsign', x: ox + s.dir * 3, y: oy, dir: s.dir, t: 0, dur: 0.32 });
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
    world.fx.push({ kind: 'projectile', weapon: world.stats.weaponType, shot: s.shot, school: s.school, element, starColor: star?.color, bend: s.lob ? -s.lob * s.dir : s.bend, shadow: hasShadow(world.char), fox: hasTails(world.char), illusion: s.illusion, phantom: s.phantom, x: ox, y: oy, tx, ty, mob, reach, t: -lag, dur: travel });
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
  // A finisher shot that finds a mark opens a Link too (see land).
  if (s.finisher && pickTargets(world.mobs, body, box, 1).length) world.finisherAt = { at: world.now, key: s.key };
  // The Kitsune's illusions: one fox-fire illusion for every three tails (three at Nine Tails),
  // and two more under Fox Illusion, each throwing a free, lighter star beside hers.
  if (hasTails(world.char) && STAR_SHOTS.has(s.shot) && !s.illusion) {
    const n = Math.floor(tailCount(world) / 3) + (world.char.buffs.foxillusion?.until > world.now ? 2 : 0);
    for (let k = 0; k < n; k++) {
      const oyk = (k % 2 ? 1 : -1) * (8 + Math.floor(k / 2) * 7);
      fire(world, { ...s, illusion: true, free: true, phantom: true, fan: 1, pierce: false, pct: s.pct * ILLUSION_POWER, oy: (s.oy ?? 0) + oyk, lag: (s.lag ?? 0) + 0.05 * (k + 1), bend: oyk * 2, big: false, stop: 0, shake: 0, gauge: 1, muzzle: undefined, kickback: 0 });
    }
  }
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
    fly(ox + ux * len, oy + uy * len, first, len);
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
