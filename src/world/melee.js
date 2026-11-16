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

import { thrownStars } from '../core/items.js';
import { physicalRange, magicRange, rollHit, accuracy, hitChance } from '../core/formulas.js';
import { grownLevel } from '../core/stats.js';
import { JOBS, jobChain } from '../data/jobs.js';
import { SKILLS, skillAt } from '../data/skills.js';
import { pickTargets, weaponElement, procOf, frenzyOnCrit, transform, applyBuff } from './combat.js';
import { moveAt } from '../render/moves.js';
import { strikePose } from '../render/hero.js';
import { wornGear } from '../core/character.js';
import { launchWisp } from './foxwheel.js';
import { GRAVITY, groundAt, JUMP_SPEED } from './physics.js';
import { yank } from './mobs.js';
import { provoke, healMembers, groupOf, isUp, hpOf, maxHpOf, giveBuff, reviveMember } from './dungeon.js';

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
export const pathSchool = (char) => (hasFaith(char) ? 'holy' : hasRage(char) ? 'rage' : hasVolt(char) ? 'thunder' : hasGale(char) ? 'redstorm' : hasBulwark(char) ? 'indigo' : 'steel');
// (The Thunderguard's skills, played by the Tempest, come in his red.)
export const schoolFor = (char, school) => (school === 'steel' || (school === 'thunder' && (hasGale(char) || hasBulwark(char))) ? pathSchool(char) : school);
// The colour a pop-up word comes in, by its school.
export const SCHOOL_TEXT = { steel: '#bfe0ff', holy: '#ffe9a0', rage: '#ff6a5a', thunder: '#fff3b0', redstorm: '#ffc2c8', indigo: '#ffe9a8' };

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

// The first jobs fight their own way too. The Warrior (who fights with his basic attacks, his
// skills going off on their own from them): a quick cut, the return cut, a stepping cross-cut
// that catches a few, then a heavy two-handed cleave that knocks them flying. The Archer: a snap
// shot, a double shot (two gold arrows a beat apart), then a full draw whose hawk arrow tears
// through the line.
export const PATH_COMBOS = {
  // The Thunderguard (the Warrior remade; docs/design/thunderguard.md): a snapping cut off the
  // shoulder, the return cut, a full spin in a ring of static, and a leaping overhead that calls a
  // bolt down where it lands. Every blow crackles (`tghit`); the line's crescent slash runs in his
  // storm colours.
  warrior: [
    { move: 'tgcut', dur: 0.36, step: 12, strikes: [{ at: 0.45, pct: 90, reach: 70, h: 58, knock: 40, arc: [-115, 205], thick: 9, fx: 'tghit' }] },
    { move: 'tgreturn', dur: 0.36, step: 12, strikes: [{ at: 0.45, pct: 95, reach: 70, h: 62, knock: 40, arc: [100, -215], thick: 9, fx: 'tghit' }] },
    { move: 'tgspin', dur: 0.48, step: 14, strikes: [{ at: 0.56, pct: 100, reach: 78, h: 64, around: true, targets: 4, knock: 90, launch: 100, arc: [100, -215], thick: 10, fx: 'tghit', burst: 'tgring', burstAt: 0, burstDur: 0.45, stop: 0.05 }] },
    { move: 'tgstrike', dur: 0.62, step: 24, finisher: true, strikes: [{ at: 0.56, pct: 210, reach: 96, h: 80, targets: 4, knock: 250, arc: [-105, 190], thick: 15, fx: 'tghit', burst: 'tgbolt', burstAt: 0.62, burstDur: 0.6, big: true, stop: 0.1, shake: 5 }] },
  ],
};


// A path's combo with a choice of swings at each step, so holding attack doesn't play the same
// string over and over: each time the combo starts, one swing is drawn for every step, and never
// the same whole string twice in a row (see planCombo). The first choice at each step is the
// path's own combo above; the others keep its rhythm (an opener, a quick second blow, a medium or
// heavy third, a heavy finisher) and land with power to match their weight: fast ones hit
// lightly but quickly, heavy ones hold a longer stop, shake the screen and throw monsters far.

// Bare hands (a Novice, or anyone without a weapon): a jab, another, and an uppercut; or a
// headbutt to open, a flying kick second, and a haymaker or a cartwheel kick to finish.
PATH_COMBOS.fists = COMBOS.none;
const FISTS = {
  headbutt: { move: 'headbutt', dur: 0.5, step: 6, strikes: [{ at: 0.42, pct: 100, reach: 46, h: 50, knock: 90, stun: 0.4, stop: 0.06, shake: 1 }] },
  flyingkick: { move: 'flyingkick', dur: 0.5, step: 18, carry: 0.45, strikes: [{ at: 0.45, pct: 105, reach: 58, h: 56, knock: 120, stop: 0.05 }] },
  haymaker: { move: 'haymaker', dur: 0.62, step: 8, finisher: true, strikes: [{ at: 0.5, pct: 170, reach: 56, h: 56, knock: 260, launch: 120, big: true, stop: 0.09, shake: 3 }] },
  cartwheel: { move: 'cartwheel', dur: 0.6, step: 16, carry: 0.5, finisher: true, strikes: [{ at: 0.48, pct: 150, reach: 60, h: 70, knock: 160, launch: 220, big: true, stop: 0.07, shake: 2 }] },
};

// The Tide Mage (docs/design/tide-mage.md): every blow is water out of the head of her staff, hit
// with her magic. Her own string: a whip of water cracked out level, a wave sent rolling along the
// ground, and a great curling wave raised and brought crashing down the line. Her pool: three
// bubbles blown off the staff that pop on what they reach, or a staff slammed down that throws a
// splash up; a double whip, or a geyser burst up under them; a whirlpool spun round her that drags
// them in and flings them out, or a wave she rides in on.
const tide = (st) => ({ magic: true, fx: 'tmhit', ...st });
const TIDE_SHOT = { magic: true, burst: 'tmhit' };
PATH_COMBOS.tidemage = [
  { move: 'tmwhip', dur: 0.42, step: 6, strikes: [tide({ at: 0.46, pct: 90, reach: 118, h: 60, targets: 2, knock: 50, burst: 'tmlash', burstAt: 0.24, burstDur: 0.32 })] },
  { move: 'tmroll', dur: 0.48, step: 4, strikes: [{ ...TIDE_SHOT, at: 0.44, shot: 'tmwave', pct: 95, range: 280, h: 70, targets: 3, pierce: true, knock: 90, speed: 520 }] },
  { move: 'tmcrash', dur: 0.66, step: -6, finisher: true, strikes: [{ ...TIDE_SHOT, at: 0.56, shot: 'tmwavebig', pct: 185, range: 320, h: 100, targets: 4, pierce: true, knock: 240, launch: 160, speed: 600, big: true, stop: 0.07, shake: 3 }] },
];
const TIDE_POOL = {
  bubbles: { move: 'tmbubbles', dur: 0.46, step: 4, strikes: [0.3, 0.48, 0.66].map((at, i) => ({ ...TIDE_SHOT, at, shot: 'tmbubble', pct: 34, range: 260, h: 64, knock: 20, speed: 430, oy: (i - 1) * 6 })) },
  splash: { move: 'tmsplash', dur: 0.44, step: 8, strikes: [tide({ at: 0.45, pct: 95, reach: 80, h: 72, targets: 3, knock: 70, launch: 140, burst: 'tmsplash', burstAt: 0.7, burstDur: 0.45 })] },
  twin: { move: 'tmtwin', dur: 0.5, step: 6, strikes: [tide({ at: 0.3, pct: 50, reach: 118, h: 60, targets: 2, knock: 30, burst: 'tmlash', burstAt: 0.24, burstDur: 0.3 }), tide({ at: 0.64, pct: 56, reach: 118, h: 64, targets: 2, knock: 70, burst: 'tmlash', burstAt: 0.24, burstDur: 0.3, flip: true })] },
  geyser: { move: 'tmgeyser', dur: 0.5, step: 4, strikes: [tide({ at: 0.5, pct: 105, reach: 130, h: 130, targets: 2, knock: 20, launch: 360, burst: 'tmgeyser', burstAt: 0.85, burstDur: 0.55, stop: 0.04 })] },
  whirl: { move: 'tmwhirl', dur: 0.64, step: 6, finisher: true, strikes: [
    tide({ at: 0.28, pct: 60, reach: 104, h: 80, around: true, targets: 4, knock: 30, pull: 140, burst: 'tmwhirl', burstAt: 0, burstDur: 0.6 }),
    tide({ at: 0.64, pct: 120, reach: 104, h: 86, around: true, targets: 5, knock: 210, launch: 180, big: true, stop: 0.07, shake: 2 }),
  ] },
  surf: { move: 'tmsurf', dur: 0.62, step: 64, carry: 0.6, finisher: true, strikes: [tide({ at: 0.56, pct: 170, reach: 92, h: 84, targets: 4, knock: 230, launch: 140, burst: 'tmsplashbig', burstAt: 0.45, burstDur: 0.55, big: true, stop: 0.07, shake: 3 })] },
};

// The Moon Moth (docs/design/moon-moth.md): a dagger in each hand and a cloud of moths. Her own
// string: a quick flick across the body, a pirouette with both daggers out cutting all round, and
// both daggers crossed over her chest then thrown wide like wings opening, moths bursting off the
// cut. Her pool: two stabs, one from each hand; a rising cut that flicks them up; a little flutter
// up and a diving cross-cut. Every cut that lands leaves her mark (`mmhit`): wing dust and a moth.
const moth = (st) => ({ school: 'moth', fx: 'mmhit', ...st });
// (A stab from the off hand a beat after the front dagger's cut: no smear, her mark only.)
const off = (st) => moth({ reach: 62, h: 50, knock: 25, ...st });
// (Quick, with a hit from each dagger every step: the player's call, 2026-11-16, "kinda slow to
// be a thief". The same damage as one slower hit, split between the two.)
PATH_COMBOS.moonmoth = [
  { move: 'mmflick', dur: 0.24, step: 8, strikes: [moth({ at: 0.45, pct: 48, reach: 64, h: 52, knock: 20, arc: [-110, 200], thick: 6 }), off({ at: 0.63, pct: 44, knock: 35 })] },
  { move: 'mmspin', dur: 0.32, step: 10, strikes: [moth({ at: 0.34, pct: 50, reach: 64, h: 58, around: true, targets: 3, knock: 20, arc: [-120, 330], thick: 6 }), moth({ at: 0.66, pct: 54, reach: 64, h: 58, around: true, targets: 3, knock: 60, arc: [60, -330], thick: 6 })] },
  { move: 'mmwings', dur: 0.44, step: 12, finisher: true, strikes: [moth({ at: 0.53, pct: 80, reach: 80, h: 70, targets: 3, knock: 60, arc: [-150, 300], thick: 10 }), moth({ at: 0.6, pct: 98, reach: 80, h: 70, targets: 3, knock: 220, launch: 120, burst: 'mmwings', burstAt: 0.3, burstDur: 0.6, big: true, stop: 0.08, shake: 2 })] },
];
const MOTH_POOL = {
  twin: { move: 'mmtwin', dur: 0.26, step: 10, strikes: [moth({ at: 0.3, pct: 44, reach: 62, h: 46, knock: 15, pierce: true }), moth({ at: 0.64, pct: 48, reach: 62, h: 46, knock: 45, pierce: true })] },
  hook: { move: 'mmhook', dur: 0.3, step: 8, strikes: [moth({ at: 0.46, pct: 54, reach: 66, h: 72, targets: 2, knock: 30, launch: 300, arc: [100, -215], thick: 7 }), off({ at: 0.68, pct: 46, h: 72, targets: 2, knock: 20, launch: 160 })] },
  swoop: { move: 'mmswoop', dur: 0.46, step: 30, carry: 0.55, finisher: true, strikes: [moth({ at: 0.6, pct: 78, reach: 76, h: 66, targets: 3, knock: 80, arc: [-160, 320], thick: 10 }), moth({ at: 0.66, pct: 92, reach: 76, h: 66, targets: 3, knock: 200, burst: 'mmcloud', burstAt: 0.35, burstDur: 0.55, big: true, stop: 0.07, shake: 2 })] },
};

// The Eclipse (docs/design/eclipse.md), the Moon Moth's damage path: eclipse violet and corona
// gold. Her own string: a low reverse-grip stab, both daggers raked across, and both driven into one
// point as a gold eye spot opens on it (a mark). Her pool: a feint one way and a cut the other; a
// rising rake that lifts them; a spin throwing a ring of corona round her (marking all it hits).
const ecl = (st) => ({ school: 'eclipse', fx: 'echit', ...st });
const eoff = (st) => ecl({ reach: 62, h: 50, knock: 25, ...st });
PATH_COMBOS.eclipse = [
  { move: 'ecjab', dur: 0.22, step: 10, strikes: [ecl({ at: 0.44, pct: 50, reach: 62, h: 46, knock: 20, pierce: true }), eoff({ at: 0.66, pct: 46, knock: 30 })] },
  { move: 'ecslice', dur: 0.3, step: 8, strikes: [ecl({ at: 0.3, pct: 52, reach: 66, h: 52, targets: 2, knock: 15, arc: [-100, 190], thick: 6 }), ecl({ at: 0.62, pct: 56, reach: 66, h: 52, targets: 2, knock: 50, arc: [100, -200], thick: 6 })] },
  { move: 'ecpierce', dur: 0.42, step: 14, finisher: true, strikes: [ecl({ at: 0.53, pct: 85, reach: 70, h: 56, targets: 2, knock: 40, pierce: true }), ecl({ at: 0.58, pct: 100, reach: 70, h: 56, targets: 2, knock: 200, mark: 1, burst: 'eceyeopen', burstAt: 0.75, burstDur: 0.55, big: true, stop: 0.09, shake: 2 })] },
];
const ECL_POOL = {
  feint: { move: 'ecfeint', dur: 0.28, step: 10, strikes: [ecl({ at: 0.6, pct: 52, reach: 64, h: 50, knock: 25, arc: [-110, 200], thick: 7 }), eoff({ at: 0.78, pct: 48, knock: 40 })] },
  rake: { move: 'ecrake', dur: 0.32, step: 8, strikes: [ecl({ at: 0.44, pct: 50, reach: 66, h: 72, targets: 2, knock: 20, launch: 220, arc: [100, -215], thick: 8 }), ecl({ at: 0.5, pct: 52, reach: 66, h: 72, targets: 2, knock: 30, launch: 300 })] },
  turn: { move: 'ecturn', dur: 0.44, step: 8, finisher: true, strikes: [ecl({ at: 0.4, pct: 70, reach: 76, h: 66, around: true, targets: 4, knock: 40, arc: [-140, 330], thick: 10 }), ecl({ at: 0.6, pct: 82, reach: 76, h: 66, around: true, targets: 4, knock: 180, mark: 1, burst: 'ecring', burstAt: 0, burstDur: 0.5, big: true, stop: 0.07, shake: 2 })] },
};

// The Silkweaver (docs/design/silkweaver.md), the Moon Moth's control path: pearl silk off her
// daggers. Her own string: a quick cut trailing a silver thread, a turn winding silk round her as
// both daggers cut all round, and both daggers crossed and pulled apart so a thread snaps taut
// across them (ties a thread). Her pool: a cut and a thread flicked out from the off hand that snaps
// at them farther off; a rising cut on a thread that lifts them; a thread lashed out to the one
// ahead and yanked in to her daggers (ties a thread).
const silk = (st) => ({ school: 'silk', fx: 'svhit', ...st });
const soff = (st) => silk({ reach: 62, h: 50, knock: 25, ...st });
PATH_COMBOS.silkweaver = [
  { move: 'svcut', dur: 0.24, step: 8, strikes: [silk({ at: 0.45, pct: 46, reach: 66, h: 52, knock: 20, arc: [-110, 200], thick: 6 }), soff({ at: 0.64, pct: 42, knock: 30 })] },
  { move: 'svwrap', dur: 0.32, step: 8, strikes: [silk({ at: 0.34, pct: 48, reach: 66, h: 58, around: true, targets: 3, knock: 15, arc: [-120, 330], thick: 6 }), silk({ at: 0.66, pct: 52, reach: 66, h: 58, around: true, targets: 3, knock: 45, arc: [60, -330], thick: 6 })] },
  { move: 'svbind', dur: 0.44, step: 10, finisher: true, strikes: [silk({ at: 0.5, pct: 78, reach: 78, h: 64, targets: 3, knock: 30, arc: [-150, 300], thick: 9 }), silk({ at: 0.6, pct: 92, reach: 78, h: 64, targets: 3, knock: 150, thread: 1, burst: 'svknot', burstAt: 0.6, burstDur: 0.55, big: true, stop: 0.08, shake: 2 })] },
];
const SILK_POOL = {
  flick: { move: 'svflick', dur: 0.26, step: 6, strikes: [silk({ at: 0.4, pct: 44, reach: 64, h: 52, knock: 20, arc: [-100, 190], thick: 6 }), silk({ at: 0.62, pct: 46, reach: 124, h: 46, targets: 1, knock: 30, pierce: true })] },
  lift: { move: 'svlift', dur: 0.3, step: 8, strikes: [silk({ at: 0.44, pct: 52, reach: 66, h: 72, targets: 2, knock: 20, launch: 300, arc: [100, -215], thick: 7 }), soff({ at: 0.66, pct: 44, h: 72, targets: 2, knock: 20, launch: 160 })] },
  yank: { move: 'svyank', dur: 0.46, step: 0, finisher: true, strikes: [silk({ at: 0.34, pct: 60, reach: 150, h: 60, targets: 1, knock: 0, pull: 130, thread: 1, burst: 'svlash', burstAt: 0, burstDur: 0.4 }), silk({ at: 0.66, pct: 96, reach: 76, h: 64, targets: 2, knock: 170, arc: [-150, 300], thick: 10, burst: 'svknot', burstAt: 0.4, burstDur: 0.5, big: true, stop: 0.07, shake: 2 })] },
};

// The Sunfeather (docs/design/sunfeather.md), the new Archer: a bow, morning light and sunbirds.
// Her own string: a snap shot, a skip forward shooting mid-skip, and a full draw loosing a big
// sun-arrow through three. Her pool: two quick shots; a hop back shooting as she lands; an arrow
// that bursts into sunbirds pecking the monsters round where it lands.
const SUN_SHOT = { school: 'sun', burst: 'sfhit' };
PATH_COMBOS.sunfeather = [
  { move: 'sfshot', dur: 0.36, step: 0, strikes: [{ ...SUN_SHOT, at: 0.5, shot: 'sfarrow', pct: 92, range: 300, h: 60, knock: 25, speed: 820 }] },
  { move: 'sfskip', dur: 0.42, step: 22, carry: 0.4, strikes: [{ ...SUN_SHOT, at: 0.52, shot: 'sfarrow', pct: 98, range: 300, h: 60, knock: 30, speed: 820 }] },
  { move: 'sfdraw', dur: 0.6, step: -8, finisher: true, strikes: [{ ...SUN_SHOT, at: 0.62, shot: 'sfarrowbig', pct: 175, range: 360, h: 64, targets: 3, pierce: true, speed: 980, knock: 200, burst: 'sfhitbig', big: true, stop: 0.05, shake: 2 }] },
];
const SUN_POOL = {
  double: { move: 'sfdouble', dur: 0.42, strikes: [0.36, 0.68].map((at, i) => ({ ...SUN_SHOT, at, shot: 'sfarrow', pct: 50, range: 290, h: 60, knock: 20, speed: 820, oy: i ? 3 : -3 })) },
  hop: { move: 'sfhop', dur: 0.44, step: -28, carry: 0.5, strikes: [{ ...SUN_SHOT, at: 0.58, shot: 'sfarrow', pct: 100, range: 300, h: 60, knock: 40, speed: 840 }] },
  flock: { move: 'sfflock', dur: 0.58, step: -6, finisher: true, strikes: [{ ...SUN_SHOT, at: 0.6, shot: 'sfarrowbig', pct: 150, range: 340, h: 64, knock: 140, speed: 900, blast: 90, blastFx: 'sfbird', burst: 'sfhitbig', big: true, stop: 0.05, shake: 1 }] },
};

// The Phoenix (docs/design/sunfeather.md), the Sunfeather's damage path, on a heavy crossbow: every
// bolt trails flame. Her own string: a heavy bolt, a cranked bolt that sets them alight, and down on
// one knee a huge flaming bolt through the line. Her pool: two bolts; a kick back and a shot; a spread
// of three burning bolts. (`burn`: they burn a few seconds, world.js; `burnLook` her own flames.)
const PH_SHOT = { school: 'fire', burst: 'phhit', burnLook: 'ph' };
const singe = { pct: 0.12, secs: 3 };
PATH_COMBOS.phoenix = [
  { move: 'phbolt', dur: 0.42, step: -4, strikes: [{ ...PH_SHOT, at: 0.52, shot: 'phbolt', pct: 100, range: 310, h: 56, knock: 60, speed: 900 }] },
  { move: 'phcrank', dur: 0.56, step: 0, strikes: [{ ...PH_SHOT, at: 0.66, shot: 'phbolt', pct: 112, range: 310, h: 56, knock: 60, speed: 900, burn: singe }] },
  { move: 'phheavy', dur: 0.72, step: -12, finisher: true, strikes: [{ ...PH_SHOT, at: 0.66, shot: 'phboltbig', pct: 190, range: 360, h: 60, targets: 3, pierce: true, knock: 240, speed: 1050, burn: { pct: 0.15, secs: 4 }, burst: 'phhitbig', big: true, stop: 0.07, shake: 3 }] },
];
const PH_POOL = {
  twin: { move: 'phtwin', dur: 0.5, step: -4, strikes: [0.38, 0.7].map((at, i) => ({ ...PH_SHOT, at, shot: 'phbolt', pct: 54, range: 300, h: 56, knock: 40, speed: 900, oy: i ? 3 : -3 })) },
  kick: { move: 'phkick', dur: 0.48, step: -26, carry: 0.4, strikes: [{ ...PH_SHOT, at: 0.6, shot: 'phbolt', pct: 112, range: 310, h: 56, knock: 90, speed: 920, burn: singe }] },
  spread: { move: 'phspread', dur: 0.62, step: -10, finisher: true, strikes: [{ ...PH_SHOT, at: 0.6, shot: 'phbolt', fan: 3, pct: 80, range: 260, h: 90, knock: 120, speed: 900, burn: singe, big: true, stop: 0.05, shake: 2 }] },
};

// The Songbird (docs/design/sunfeather.md), the Sunfeather's support path: her arrows carry music.
// Her own string: an arrow trailing notes, a fan of three, and a big arrow trailing a ribbon that
// bursts in notes and mends the party a little (`heal` as it's loosed). Her pool: a quick trill of
// two; a twirl and a shot; an arrow arced high that bursts in a shower of notes over them.
const SB_SHOT = { school: 'song', burst: 'sbhit' };
PATH_COMBOS.songbird = [
  { move: 'sbnote', dur: 0.38, step: 0, strikes: [{ ...SB_SHOT, at: 0.5, shot: 'sbarrow', pct: 92, range: 300, h: 60, knock: 25, speed: 800 }] },
  { move: 'sbchord', dur: 0.46, step: 0, strikes: [{ ...SB_SHOT, at: 0.54, shot: 'sbarrow', fan: 3, pct: 44, range: 290, h: 90, knock: 30, speed: 800 }] },
  { move: 'sbcrescendo', dur: 0.62, step: -8, finisher: true, strikes: [{ ...SB_SHOT, at: 0.62, shot: 'sbarrowbig', pct: 165, range: 340, h: 64, targets: 3, pierce: true, knock: 180, speed: 940, heal: 0.03, healR: 240, burst: 'sbhitbig', big: true, stop: 0.05, shake: 2 }] },
];
const SB_POOL = {
  trill: { move: 'sbtrill', dur: 0.42, strikes: [0.36, 0.68].map((at, i) => ({ ...SB_SHOT, at, shot: 'sbarrow', pct: 50, range: 290, h: 60, knock: 20, speed: 800, oy: i ? 3 : -3 })) },
  twirl: { move: 'sbtwirl', dur: 0.48, step: 6, strikes: [{ ...SB_SHOT, at: 0.62, shot: 'sbarrow', pct: 100, range: 300, h: 60, knock: 40, speed: 820 }] },
  encore: { move: 'sbencore', dur: 0.6, step: -6, finisher: true, strikes: [{ ...SB_SHOT, at: 0.6, shot: 'sbarrowbig', pct: 140, range: 330, h: 90, knock: 140, speed: 860, blast: 90, blastFx: 'sbnotes', heal: 0.025, healR: 240, burst: 'sbhitbig', big: true, stop: 0.05, shake: 1 }] },
};

// The Maelstrom (docs/design/maelstrom.md): the deep sea out of her staff. Her own string: a spear
// of pressurised water through two, a vortex bolt spinning in, and a vortex opened ahead that drags
// them in and bursts. Her pool: a jet of pressure or two glowing bubbles that go off; two crossing
// spears or a slashing current; a beam through the line or a column of black water slammed down.
const deep = (st) => ({ magic: true, fx: 'mshit', ...st });
const DEEP_SHOT = { magic: true, burst: 'mshit' };
PATH_COMBOS.maelstrom = [
  { move: 'msspear', dur: 0.42, step: 4, strikes: [{ ...DEEP_SHOT, at: 0.5, shot: 'msspear', pct: 90, range: 320, h: 56, targets: 2, pierce: true, knock: 50, speed: 920 }] },
  { move: 'msbolt', dur: 0.44, step: 4, strikes: [{ ...DEEP_SHOT, at: 0.48, shot: 'msbolt', pct: 96, range: 300, h: 64, knock: 60, speed: 640 }] },
  { move: 'msopen', dur: 0.66, step: 0, finisher: true, strikes: [
    deep({ at: 0.36, pct: 60, reach: 190, h: 110, targets: 4, knock: 0, pull: 160, burst: 'msvortex', burstAt: 0.7, burstDur: 0.75 }),
    deep({ at: 0.72, pct: 140, reach: 190, h: 120, targets: 4, knock: 200, launch: 200, big: true, stop: 0.07, shake: 3 }),
  ] },
];
const DEEP_POOL = {
  jet: { move: 'msjet', dur: 0.42, step: 2, strikes: [deep({ at: 0.45, pct: 92, reach: 150, h: 50, targets: 3, knock: 80, burst: 'msbeam', burstAt: 0.08, burstDur: 0.35 })] },
  glow: { move: 'msglow', dur: 0.48, step: 2, strikes: [0.36, 0.6].map((at, i) => ({ ...DEEP_SHOT, at, shot: 'msglow', pct: 48, range: 260, h: 70, knock: 30, speed: 360, oy: i ? 5 : -5, burst: 'msglowpop' })) },
  cross: { move: 'mscross', dur: 0.5, step: 4, strikes: [{ ...DEEP_SHOT, at: 0.32, shot: 'msspear', pct: 50, range: 320, h: 56, targets: 2, pierce: true, knock: 30, speed: 920, oy: -5 }, { ...DEEP_SHOT, at: 0.58, shot: 'msspear', pct: 54, range: 320, h: 56, targets: 2, pierce: true, knock: 60, speed: 920, oy: 5 }] },
  slash: { move: 'msslash', dur: 0.46, step: 8, strikes: [deep({ at: 0.46, pct: 100, reach: 120, h: 80, targets: 3, knock: 90, burst: 'msslash', burstAt: 0.35, burstDur: 0.4 })] },
  beam: { move: 'msbeamfin', dur: 0.64, step: -6, finisher: true, strikes: [deep({ at: 0.5, pct: 175, reach: 280, h: 52, targets: 5, knock: 220, burst: 'msbeam', burstAt: 0.06, burstDur: 0.45, big: true, stop: 0.07, shake: 3 })] },
  slam: { move: 'msslam', dur: 0.66, step: 6, finisher: true, strikes: [deep({ at: 0.56, pct: 180, reach: 130, h: 130, targets: 4, knock: 240, launch: 180, burst: 'msslam', burstAt: 0.6, burstDur: 0.55, big: true, stop: 0.08, shake: 4 })] },
};

// The Tidecaller (docs/design/tidecaller.md): the moon's tide out of her staff, sung rather than
// hurled. Her own string: a pearl of water flicked off the staff, a ribbon of water swept round like
// a dancer's sash, and a pillar of moonlight called down on them that mends the party round her.
// Her pool: a shell skipped along the floor or a shower of drops; a crescent wave or a chain of
// bubbles; a spring welling up under them or a great crescent wave rolled through the line (both
// mend too).
const moon = (st) => ({ magic: true, fx: 'tchit', ...st });
const MOON_SHOT = { magic: true, burst: 'tchit' };
PATH_COMBOS.tidecaller = [
  { move: 'tcpearl', dur: 0.42, step: 4, strikes: [{ ...MOON_SHOT, at: 0.48, shot: 'tcpearl', pct: 88, range: 300, h: 60, knock: 50, speed: 720 }] },
  { move: 'tcribbon', dur: 0.48, step: 6, strikes: [moon({ at: 0.5, pct: 96, reach: 128, h: 76, targets: 3, knock: 70, burst: 'tcribbon', burstAt: 0.08, burstDur: 0.42 })] },
  { move: 'tcpillar', dur: 0.66, step: 0, finisher: true, strikes: [moon({ at: 0.56, pct: 175, reach: 170, h: 140, targets: 4, knock: 160, launch: 260, burst: 'tcpillar', burstAt: 0.75, burstDur: 0.7, big: true, stop: 0.07, shake: 2, heal: 0.03, healR: 260 })] },
];
const MOON_POOL = {
  shell: { move: 'tcshell', dur: 0.44, step: 4, strikes: [{ ...MOON_SHOT, at: 0.46, shot: 'tcshell', pct: 46, range: 300, h: 50, targets: 2, pierce: true, knock: 40, speed: 560, oy: 18 }, { ...MOON_SHOT, at: 0.62, shot: 'tcshell', pct: 46, range: 300, h: 50, targets: 2, pierce: true, knock: 40, speed: 560, oy: 18 }] },
  drops: { move: 'tcdrops', dur: 0.46, step: 2, strikes: [0.36, 0.5, 0.64].map((at) => moon({ at, pct: 32, reach: 130, h: 96, targets: 3, knock: 20, ...(at === 0.36 ? { burst: 'tcdrops', burstAt: 0.6, burstDur: 0.5 } : {}) })) },
  crescent: { move: 'tccrescent', dur: 0.48, step: 4, strikes: [{ ...MOON_SHOT, at: 0.46, shot: 'tccrescent', pct: 95, range: 300, h: 70, targets: 3, pierce: true, knock: 80, speed: 640 }] },
  chain: { move: 'tcchain', dur: 0.5, step: 2, strikes: [0.3, 0.44, 0.58].map((at, i) => ({ ...MOON_SHOT, at, shot: 'tcbubble', pct: 34, range: 270, h: 70, knock: 20, speed: 400, oy: (1 - i) * 8, burst: 'tcbubblepop' })) },
  spring: { move: 'tcspring', dur: 0.64, step: 0, finisher: true, strikes: [moon({ at: 0.52, pct: 180, reach: 150, h: 150, targets: 4, knock: 30, launch: 380, burst: 'tcspring', burstAt: 0.8, burstDur: 0.6, big: true, stop: 0.07, shake: 2, heal: 0.03, healR: 260 })] },
  wave: { move: 'tcwave', dur: 0.66, step: -4, finisher: true, strikes: [{ ...MOON_SHOT, at: 0.56, shot: 'tccrescentbig', pct: 180, range: 330, h: 100, targets: 4, pierce: true, knock: 230, launch: 140, speed: 600, big: true, stop: 0.07, shake: 3, heal: 0.03, healR: 260 }] },
};

// The Thunderguard's pool (docs/design/thunderguard.md). Openers: a double flick, or a darting
// lunge that leaves a streak of sparks. Second: a shoulder check that bursts with static and
// dazes, or a low sweep crackling along the floor. Third: a charged thrust that fires a bolt
// through the line, or a rising cut that lifts them on a column of lightning. Finisher: a
// two-handed cleave into the floor and a thunderclap, or a spiralling uppercut into a column of
// lightning.
const storm = (st) => ({ fx: 'tghit', ...st });
const STORM_POOL = {
  flick: { move: 'tgflick', dur: 0.4, step: 10, strikes: [storm({ at: 0.3, pct: 46, reach: 68, h: 56, knock: 20, arc: [-100, 190], thick: 7 }), storm({ at: 0.62, pct: 50, reach: 70, h: 58, knock: 50, arc: [100, -205], thick: 8 })] },
  lunge: { move: 'tglunge', dur: 0.38, step: 30, carry: 0.4, strikes: [storm({ at: 0.45, pct: 92, reach: 94, h: 46, targets: 2, pierce: true, knock: 70, burst: 'tgdart', burstAt: 0.05, burstDur: 0.32 })] },
  bash: { move: 'tgbash', dur: 0.38, step: 22, strikes: [storm({ at: 0.42, pct: 80, reach: 56, h: 60, targets: 2, knock: 230, stun: 0.5, burst: 'tgburst', burstAt: 0.9, burstDur: 0.36, stop: 0.06, shake: 1 })] },
  sweep: { move: 'tgsweep', dur: 0.4, step: 14, strikes: [storm({ at: 0.46, pct: 88, reach: 86, h: 44, targets: 3, knock: 80, arc: [-160, 250], thick: 9, burst: 'tgfloor', burstAt: 0.55, burstDur: 0.45, stop: 0.04 })] },
  drive: { move: 'tgdrive', dur: 0.48, step: 24, strikes: [storm({ at: 0.46, pct: 130, reach: 124, h: 46, targets: 3, pierce: true, knock: 220, burst: 'tgbeam', burstAt: 0.08, burstDur: 0.36, big: true, stop: 0.07, shake: 2 })] },
  rise: { move: 'tgrise', dur: 0.46, step: 18, strikes: [storm({ at: 0.42, pct: 120, reach: 78, h: 92, targets: 3, knock: 40, launch: 340, arc: [80, -175], thick: 12, burst: 'tgcolumn', burstAt: 0.6, burstDur: 0.5, big: true, stop: 0.06 })] },
  clap: { move: 'tgclap', dur: 0.72, step: 14, finisher: true, strikes: [storm({ at: 0.56, pct: 220, reach: 100, h: 76, targets: 5, knock: 320, launch: 140, arc: [-150, 300], thick: 15, burst: 'tgclap', burstAt: 0.4, burstDur: 0.6, big: true, stop: 0.1, shake: 5 })] },
  rising: { move: 'tgstorm', dur: 0.68, step: 10, finisher: true, strikes: [
    storm({ at: 0.36, pct: 80, reach: 80, h: 90, targets: 4, knock: 20, launch: 260, arc: [80, -175], thick: 11 }),
    storm({ at: 0.64, pct: 150, reach: 90, h: 170, targets: 4, knock: 120, launch: 420, burst: 'tgcolumn', burstAt: 0.45, burstDur: 0.6, big: true, stop: 0.08, shake: 3 }),
  ] },
};

// The Tempest (the Thunderguard's damage path; docs/design/tempest.md): red lightning, speed itself.
// Short wind-ups, follow-throughs that roll into the next blow, finishers that end with him
// somewhere else. Openers: an instant streaking cut, a backhand-forehand double, or a flash-step
// through one. Second: a heel-turn cut, a rising slash he follows up, or three blurring jabs. Third:
// an X of two streaks, a low sweep throwing red sparks off the floor, or a lunge driving a streak
// through the line. Finisher: a blink behind the farthest one and a cut back through them all, a
// whirlwind of red streaks, or a leap and a diving cut that lands as a red bolt.
const red = (st) => ({ fx: 'tphit', ...st });
PATH_COMBOS.tempest = [
  { move: 'tpstreak', dur: 0.3, step: 14, strikes: [red({ at: 0.42, pct: 88, reach: 72, h: 56, knock: 30, arc: [-115, 205], thick: 8 })] },
  { move: 'tpturn', dur: 0.34, step: 14, strikes: [red({ at: 0.5, pct: 94, reach: 74, h: 60, around: true, targets: 3, knock: 40, arc: [100, -215], thick: 9 })] },
  { move: 'tpcross', dur: 0.38, step: 14, strikes: [red({ at: 0.3, pct: 55, reach: 76, h: 60, targets: 3, knock: 20, arc: [-120, 220], thick: 9 }), red({ at: 0.6, pct: 60, reach: 76, h: 60, targets: 3, knock: 60, arc: [120, -220], thick: 9 })] },
  { move: 'tpblink', dur: 0.5, step: 0, finisher: true, strikes: [red({ at: 0.55, pct: 200, reach: 150, h: 70, targets: 5, pierce: true, knock: 180, blink: 130, big: true, stop: 0.09, shake: 4 })] },
];
const RED_POOL = {
  double: { move: 'tpdouble', dur: 0.32, step: 12, strikes: [red({ at: 0.28, pct: 44, reach: 70, h: 56, knock: 15, arc: [-100, 190], thick: 7 }), red({ at: 0.6, pct: 48, reach: 70, h: 58, knock: 40, arc: [100, -205], thick: 8 })] },
  flash: { move: 'tpflash', dur: 0.34, step: 44, carry: 0.5, strikes: [red({ at: 0.45, pct: 92, reach: 70, h: 56, targets: 2, pierce: true, knock: 60, burst: 'tpline', burstAt: -0.9, burstDur: 0.3 })] },
  lift: { move: 'tplift', dur: 0.36, step: 12, strikes: [red({ at: 0.44, pct: 96, reach: 74, h: 84, targets: 2, knock: 20, launch: 300, hop: 260, arc: [80, -175], thick: 10 })] },
  jabs: { move: 'tpjabs', dur: 0.36, step: 12, strikes: [0.2, 0.42, 0.64].map((at, i) => red({ at, pct: 34, reach: 88, h: 46, targets: 2, pierce: true, knock: i === 2 ? 80 : 10, ...(i === 2 ? { burst: 'tpline', burstAt: 0.1, burstDur: 0.3 } : {}) })) },
  sweep: { move: 'tpsweep', dur: 0.38, step: 14, strikes: [red({ at: 0.46, pct: 112, reach: 86, h: 42, targets: 3, knock: 70, launch: 120, arc: [-160, 250], thick: 9, burst: 'tpfloor', burstAt: 0.5, burstDur: 0.4 })] },
  lunge: { move: 'tplunge', dur: 0.4, step: 30, carry: 0.45, strikes: [red({ at: 0.46, pct: 118, reach: 120, h: 46, targets: 3, pierce: true, knock: 160, burst: 'tpline', burstAt: 0.05, burstDur: 0.32, big: true, stop: 0.05, shake: 1 })] },
  whirl: { move: 'tpwhirl', dur: 0.56, step: 8, finisher: true, strikes: [
    red({ at: 0.3, pct: 70, reach: 86, h: 70, around: true, targets: 5, knock: 30, pull: 80, arc: [0, 330], thick: 10, burst: 'tpwhirlfx', burstAt: 0, burstDur: 0.5 }),
    red({ at: 0.66, pct: 140, reach: 92, h: 76, around: true, targets: 5, knock: 240, launch: 200, big: true, stop: 0.08, shake: 3 }),
  ] },
  dive: { move: 'tpdive', dur: 0.62, step: 30, carry: 0.5, finisher: true, strikes: [red({ at: 0.58, pct: 215, reach: 96, h: 80, targets: 4, knock: 240, launch: 160, arc: [-105, 190], thick: 14, burst: 'tpbolt', burstAt: 0.5, burstDur: 0.5, big: true, stop: 0.1, shake: 4 })] },
};

// The Stormwall (the Thunderguard's tank path; docs/design/stormwall.md): the storm as a fortress.
// Long braced wind-ups and planted blows that land like a falling wall; he barely steps, the
// monsters come to him. Openers: a braced overhead, a shove behind a plate of static that dazes,
// or a cut that drags them in on field lines. Second: a heavy return, a stamp that rolls thunder
// along the floor, or a rising guard-cut. Third: a wide cleave under a falling curtain of rain, a
// cage of lightning snapped round the nearest few, or a hammering double. Finisher: the
// thunderhead's bolt on the pack, a slam that throws up a wall of rain and lightning, or a sweep
// round him that drags everything in. His finishers hold what they hit on him (`provoke`).
const wall = (st) => ({ fx: 'bwhit', ...st });
PATH_COMBOS.stormwall = [
  { move: 'bwbrace', dur: 0.4, step: 6, strikes: [wall({ at: 0.52, pct: 100, reach: 74, h: 62, knock: 50, arc: [-115, 205], thick: 11, stop: 0.04 })] },
  { move: 'bwreturn', dur: 0.4, step: 6, strikes: [wall({ at: 0.5, pct: 105, reach: 74, h: 64, knock: 60, arc: [100, -215], thick: 11, stop: 0.04 })] },
  { move: 'bwcleave', dur: 0.5, step: 6, strikes: [wall({ at: 0.56, pct: 130, reach: 96, h: 74, targets: 4, knock: 120, arc: [-150, 300], thick: 14, burst: 'bwrain', burstAt: 0.5, burstDur: 0.6, stop: 0.06, shake: 2 })] },
  { move: 'bwbolt', dur: 0.62, step: 4, finisher: true, strikes: [wall({ at: 0.6, pct: 220, reach: 110, h: 90, targets: 5, knock: 200, provoke: 3, arc: [-105, 190], thick: 16, burst: 'bwboltdown', burstAt: 0.6, burstDur: 0.6, big: true, stop: 0.11, shake: 5 })] },
];
const WALL_POOL = {
  shove: { move: 'bwshove', dur: 0.4, step: 12, strikes: [wall({ at: 0.46, pct: 90, reach: 62, h: 66, targets: 2, knock: 240, stun: 0.6, burst: 'bwplate', burstAt: 0.8, burstDur: 0.4, stop: 0.07, shake: 2 })] },
  pull: { move: 'bwpull', dur: 0.44, step: 0, strikes: [wall({ at: 0.5, pct: 95, reach: 140, h: 70, targets: 3, knock: 0, pull: 220, provoke: 1.5, burst: 'bwfield', burstAt: 0, burstDur: 0.5 })] },
  stamp: { move: 'bwstamp', dur: 0.44, step: 4, strikes: [wall({ at: 0.5, pct: 100, reach: 120, h: 50, targets: 4, knock: 60, launch: 140, burst: 'bwroll', burstAt: 0.1, burstDur: 0.55, stop: 0.06, shake: 3 })] },
  guardcut: { move: 'bwguardcut', dur: 0.42, step: 6, strikes: [wall({ at: 0.48, pct: 110, reach: 80, h: 90, targets: 3, knock: 40, launch: 260, arc: [80, -175], thick: 12, guard: 0.2, stop: 0.05 })] },
  cage: { move: 'bwcage', dur: 0.5, step: 4, strikes: [wall({ at: 0.54, pct: 120, reach: 110, h: 90, around: true, targets: 4, knock: 0, pull: 140, stun: 0.8, provoke: 2, burst: 'bwcage', burstAt: 0, burstDur: 0.7, stop: 0.06, shake: 2 })] },
  double: { move: 'bwdouble', dur: 0.54, step: 8, strikes: [wall({ at: 0.36, pct: 70, reach: 84, h: 70, targets: 3, knock: 40, arc: [-130, 250], thick: 13, stop: 0.05, shake: 1 }), wall({ at: 0.7, pct: 80, reach: 84, h: 70, targets: 3, knock: 160, arc: [-130, 250], thick: 14, stop: 0.07, shake: 3 })] },
  slam: { move: 'bwslam', dur: 0.64, step: 6, finisher: true, strikes: [wall({ at: 0.58, pct: 225, reach: 100, h: 90, targets: 5, knock: 260, launch: 180, provoke: 3, burst: 'bwwall', burstAt: 0.5, burstDur: 0.7, big: true, stop: 0.11, shake: 6 })] },
  sweep: { move: 'bwsweep', dur: 0.66, step: 0, finisher: true, strikes: [
    wall({ at: 0.34, pct: 80, reach: 130, h: 80, around: true, targets: 6, knock: 0, pull: 240, provoke: 3, arc: [0, 330], thick: 13, burst: 'bwfield', burstAt: 0, burstDur: 0.5 }),
    wall({ at: 0.72, pct: 150, reach: 110, h: 86, around: true, targets: 6, knock: 230, launch: 160, burst: 'bwroll', burstAt: 0, burstDur: 0.55, big: true, stop: 0.1, shake: 5 }),
  ] },
};

export const PATH_VARIANTS = {
  stormwall: [
    [PATH_COMBOS.stormwall[0], WALL_POOL.shove, WALL_POOL.pull],
    [PATH_COMBOS.stormwall[1], WALL_POOL.stamp, WALL_POOL.guardcut],
    [PATH_COMBOS.stormwall[2], WALL_POOL.cage, WALL_POOL.double],
    [PATH_COMBOS.stormwall[3], WALL_POOL.slam, WALL_POOL.sweep],
  ],
  tempest: [
    [PATH_COMBOS.tempest[0], RED_POOL.double, RED_POOL.flash],
    [PATH_COMBOS.tempest[1], RED_POOL.lift, RED_POOL.jabs],
    [PATH_COMBOS.tempest[2], RED_POOL.sweep, RED_POOL.lunge],
    [PATH_COMBOS.tempest[3], RED_POOL.whirl, RED_POOL.dive],
  ],
  tidecaller: [
    [PATH_COMBOS.tidecaller[0], MOON_POOL.shell, MOON_POOL.drops],
    [PATH_COMBOS.tidecaller[1], MOON_POOL.crescent, MOON_POOL.chain],
    [PATH_COMBOS.tidecaller[2], MOON_POOL.spring, MOON_POOL.wave],
  ],
  maelstrom: [
    [PATH_COMBOS.maelstrom[0], DEEP_POOL.jet, DEEP_POOL.glow],
    [PATH_COMBOS.maelstrom[1], DEEP_POOL.cross, DEEP_POOL.slash],
    [PATH_COMBOS.maelstrom[2], DEEP_POOL.beam, DEEP_POOL.slam],
  ],
  songbird: [
    [PATH_COMBOS.songbird[0], SB_POOL.trill],
    [PATH_COMBOS.songbird[1], SB_POOL.twirl],
    [PATH_COMBOS.songbird[2], SB_POOL.encore],
  ],
  phoenix: [
    [PATH_COMBOS.phoenix[0], PH_POOL.twin],
    [PATH_COMBOS.phoenix[1], PH_POOL.kick],
    [PATH_COMBOS.phoenix[2], PH_POOL.spread],
  ],
  sunfeather: [
    [PATH_COMBOS.sunfeather[0], SUN_POOL.double],
    [PATH_COMBOS.sunfeather[1], SUN_POOL.hop],
    [PATH_COMBOS.sunfeather[2], SUN_POOL.flock],
  ],
  silkweaver: [
    [PATH_COMBOS.silkweaver[0], SILK_POOL.flick],
    [PATH_COMBOS.silkweaver[1], SILK_POOL.lift],
    [PATH_COMBOS.silkweaver[2], SILK_POOL.yank],
  ],
  eclipse: [
    [PATH_COMBOS.eclipse[0], ECL_POOL.feint],
    [PATH_COMBOS.eclipse[1], ECL_POOL.rake],
    [PATH_COMBOS.eclipse[2], ECL_POOL.turn],
  ],
  moonmoth: [
    [PATH_COMBOS.moonmoth[0], MOTH_POOL.twin],
    [PATH_COMBOS.moonmoth[1], MOTH_POOL.hook],
    [PATH_COMBOS.moonmoth[2], MOTH_POOL.swoop],
  ],
  tidemage: [
    [PATH_COMBOS.tidemage[0], TIDE_POOL.bubbles, TIDE_POOL.splash],
    [PATH_COMBOS.tidemage[1], TIDE_POOL.twin, TIDE_POOL.geyser],
    [PATH_COMBOS.tidemage[2], TIDE_POOL.whirl, TIDE_POOL.surf],
  ],
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
    [PATH_COMBOS.warrior[0], STORM_POOL.flick, STORM_POOL.lunge],
    [PATH_COMBOS.warrior[1], STORM_POOL.bash, STORM_POOL.sweep],
    [PATH_COMBOS.warrior[2], STORM_POOL.drive, STORM_POOL.rise],
    [PATH_COMBOS.warrior[3], STORM_POOL.clap, STORM_POOL.rising],
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

// The ranged paths' command moves (the Tide Mage's line). Up + attack: something thrown up under
// whatever flies, knocking it higher. In the air: blows that hold you up (`hang`) and come down at
// them. Running: one out of the run.
const ARCHER_COMMANDS = {
  // The Songbird: up + attack, a rising arrow trailing notes; in the air two shots down (the second
  // a big one); out of a run, she glides forward on a ribbon of music and shoots.
  songbird: {
    up: { move: 'sbrise', dur: 0.42, strikes: [{ ...SB_SHOT, at: 0.46, shot: 'sbarrow', pct: 105, range: 260, h: 70, lift: 140, knock: 20, launch: 260, speed: 840 }] },
    air: [
      { move: 'sbair', dur: 0.36, hang: true, strikes: [{ ...SB_SHOT, at: 0.46, shot: 'sbarrow', pct: 80, range: 260, h: 70, drop: 120, knock: 30, speed: 840 }] },
      { move: 'sbair', dur: 0.4, hang: true, finisher: true, strikes: [{ ...SB_SHOT, at: 0.46, shot: 'sbarrowbig', pct: 110, range: 280, h: 80, drop: 140, knock: 90, speed: 880, burst: 'sbhitbig', big: true, stop: 0.04 }] },
    ],
    dash: { move: 'sbglide', dur: 0.52, step: 80, carry: 0.55, guard: 0.35, strikes: [
      { at: 0.04, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, gauge: 0, burst: 'sbribbon', burstAt: 0, burstDur: 0.55 },
      { ...SB_SHOT, at: 0.66, shot: 'sbarrowbig', pct: 128, range: 320, h: 60, targets: 3, pierce: true, knock: 120, speed: 920, burst: 'sbhitbig', big: true, stop: 0.04 },
    ] },
  },
  // The Phoenix: up + attack, a burning bolt shot up; in the air two bolts shot down (the second a
  // big one); out of a run, a knee slide into a heavy bolt through the line.
  phoenix: {
    up: { move: 'phup', dur: 0.46, strikes: [{ ...PH_SHOT, at: 0.5, shot: 'phbolt', pct: 112, range: 260, h: 70, lift: 140, knock: 20, launch: 280, speed: 900, burn: singe }] },
    air: [
      { move: 'phair', dur: 0.4, hang: true, strikes: [{ ...PH_SHOT, at: 0.48, shot: 'phbolt', pct: 84, range: 260, h: 70, drop: 120, knock: 40, speed: 900 }] },
      { move: 'phair', dur: 0.44, hang: true, finisher: true, strikes: [{ ...PH_SHOT, at: 0.48, shot: 'phboltbig', pct: 118, range: 280, h: 80, drop: 140, knock: 120, speed: 960, burn: singe, burst: 'phhitbig', big: true, stop: 0.04 }] },
    ],
    dash: { move: 'phslide', dur: 0.56, step: 80, carry: 0.5, guard: 0.35, strikes: [{ ...PH_SHOT, at: 0.66, shot: 'phboltbig', pct: 136, range: 320, h: 60, targets: 3, pierce: true, knock: 140, speed: 1000, burn: singe, burst: 'phhitbig', big: true, stop: 0.05 }] },
  },
  // The Sunfeather: up + attack shoots up through them; in the air she tips forward and shoots down
  // (the second a big one); out of a run, a forward roll up into a shot through the line.
  sunfeather: {
    up: { move: 'sfrise', dur: 0.42, strikes: [{ ...SUN_SHOT, at: 0.46, shot: 'sfarrow', pct: 105, range: 260, h: 70, lift: 140, knock: 20, launch: 260, speed: 860 }] },
    air: [
      { move: 'sfairshot', dur: 0.36, hang: true, strikes: [{ ...SUN_SHOT, at: 0.46, shot: 'sfarrow', pct: 80, range: 260, h: 70, drop: 120, knock: 30, speed: 860 }] },
      { move: 'sfairshot', dur: 0.4, hang: true, finisher: true, strikes: [{ ...SUN_SHOT, at: 0.46, shot: 'sfarrowbig', pct: 112, range: 280, h: 80, drop: 140, knock: 90, speed: 900, burst: 'sfhitbig', big: true, stop: 0.04 }] },
    ],
    dash: { move: 'sfroll', dur: 0.5, step: 70, carry: 0.55, guard: 0.35, strikes: [{ ...SUN_SHOT, at: 0.66, shot: 'sfarrowbig', pct: 130, range: 320, h: 60, targets: 3, pierce: true, knock: 120, speed: 950, burst: 'sfhitbig', big: true, stop: 0.04 }] },
  },
  // The Tidecaller: a spring of moonlit water called up under whatever flies, a shower of drops
  // rained down from a hang in the air (the second a heavy one), and a glide on a ribbon of foam out
  // of a run.
  tidecaller: {
    up: { move: 'tcrise', dur: 0.48, strikes: [moon({ at: 0.42, pct: 108, reach: 84, h: 210, targets: 4, knock: 20, launch: 420, burst: 'tcspring', burstAt: 0.45, burstDur: 0.55, big: true, stop: 0.04 })] },
    air: [
      { move: 'tcairdrops', dur: 0.44, hang: true, strikes: [moon({ at: 0.42, pct: 78, reach: 100, h: 200, targets: 3, knock: 30, burst: 'tcdrops', burstAt: 0.35, burstDur: 0.5, floor: true })] },
      { move: 'tcairdrops', dur: 0.5, hang: true, finisher: true, strikes: [moon({ at: 0.42, pct: 102, reach: 116, h: 220, targets: 4, knock: 120, burst: 'tcdropsbig', burstAt: 0.35, burstDur: 0.55, floor: true, big: true, stop: 0.05, shake: 1 })] },
    ],
    dash: { move: 'tcglide', dur: 0.5, step: 84, carry: 0.6, guard: 0.3, strikes: [moon({ at: 0.5, pct: 118, reach: 88, h: 72, targets: 3, knock: 160, burst: 'tcsplash', burstAt: 0.5, burstDur: 0.45, big: true, stop: 0.04 })] },
  },
  // The Maelstrom: a spiral of black water driven up under whatever flies, spears hurled down from a
  // hang in the air (the second a big one), and a dive through a wave out of a run.
  maelstrom: {
    up: { move: 'msspiral', dur: 0.48, strikes: [deep({ at: 0.42, pct: 112, reach: 84, h: 210, targets: 4, knock: 20, launch: 420, burst: 'msvortex', burstAt: 0.5, burstDur: 0.55, big: true, stop: 0.04 })] },
    air: [
      { move: 'msairspear', dur: 0.42, hang: true, strikes: [{ ...DEEP_SHOT, at: 0.42, shot: 'msspear', pct: 78, fan: 2, range: 280, h: 200, drop: 70, knock: 40, speed: 920 }] },
      { move: 'msairspear', dur: 0.48, hang: true, finisher: true, strikes: [{ ...DEEP_SHOT, at: 0.42, shot: 'msspearbig', pct: 100, fan: 2, range: 280, h: 220, drop: 90, knock: 140, speed: 960, big: true, stop: 0.05, shake: 1 }] },
    ],
    dash: { move: 'msdash', dur: 0.5, step: 86, carry: 0.6, guard: 0.3, strikes: [deep({ at: 0.52, pct: 122, reach: 88, h: 72, targets: 3, knock: 160, burst: 'msslam', burstAt: 0.5, burstDur: 0.45, big: true, stop: 0.04 })] },
  },
  // The Tide Mage: a spout of water thrown up under whatever flies, a waterfall poured down from a
  // hang in the air (the second a great one), and a wave surfed in on out of a run.
  tidemage: {
    up: { move: 'tmspout', dur: 0.48, strikes: [tide({ at: 0.42, pct: 110, reach: 84, h: 210, targets: 4, knock: 20, launch: 420, burst: 'tmgeyser', burstAt: 0.45, burstDur: 0.55, big: true, stop: 0.04 })] },
    air: [
      { move: 'tmfall', dur: 0.44, hang: true, strikes: [tide({ at: 0.42, pct: 80, reach: 96, h: 200, targets: 3, knock: 30, burst: 'tmfall', burstAt: 0.35, burstDur: 0.45, floor: true })] },
      { move: 'tmfall', dur: 0.5, hang: true, finisher: true, strikes: [tide({ at: 0.42, pct: 105, reach: 110, h: 220, targets: 4, knock: 130, burst: 'tmfallbig', burstAt: 0.35, burstDur: 0.55, floor: true, big: true, stop: 0.05, shake: 1 })] },
    ],
    dash: { move: 'tmsurf', dur: 0.5, step: 84, carry: 0.6, strikes: [tide({ at: 0.5, pct: 120, reach: 86, h: 72, targets: 3, knock: 160, burst: 'tmsplash', burstAt: 0.5, burstDur: 0.45, big: true, stop: 0.04 })] },
  },
};

// The command variants of a melee basic combo (any blade, axe, spear, dagger or bare hands).
const MELEE = new Set(['sword', 'axe', 'spear', 'dagger', 'none']);
// Up + attack: a rising launcher that throws them up and hops you after them (`hop`, px/s).
const LAUNCHER = { move: 'rising', dur: 0.46, step: 13, strikes: [{ at: 0.4, pct: 120, reach: 72, h: 86, targets: 3, knock: 30, launch: 480, hop: 400, arc: [80, -175], thick: 11, big: true, stop: 0.06 }] };
// In the air: two cuts that keep you hanging (`hang`), then a dive that slams into the ground
// and lands its blow on touchdown (`dive`: the fall speed; the strike marked `onLand`).
const AIR = [
  { move: 'airslash', dur: 0.34, hang: true, strikes: [{ at: 0.45, pct: 90, reach: 68, h: 80, targets: 2, knock: 15, launch: 150, arc: [-115, 205] }] },
  { move: 'airslash2', dur: 0.34, hang: true, strikes: [{ at: 0.45, pct: 95, reach: 68, h: 84, targets: 2, knock: 15, launch: 170, arc: [100, -215] }] },
  { move: 'meteor', dur: 0.46, dive: 760, finisher: true, strikes: [{ onLand: true, pct: 210, reach: 84, h: 70, around: true, targets: 4, knock: 220, crack: true, big: true, stop: 0.09, shake: 4 }] },
];
// Running into an attack: a lunging thrust through the line.
const DASH = { move: 'dashstab', dur: 0.46, step: 44, carry: 0.55, strikes: [{ at: 0.38, pct: 140, reach: 84, h: 52, targets: 3, pierce: true, knock: 200, big: true, stop: 0.05, shake: 1 }] };
// Down + attack (the warrior paths): a leaping two-handed slam that cracks the ground all around.
const SLAM = { move: 'plunge', dur: 0.58, step: 29, strikes: [{ at: 0.56, pct: 170, reach: 88, h: 80, around: true, targets: 4, knock: 220, crack: true, big: true, stop: 0.09, shake: 4 }] };
// The Thunderguard's own command moves: up + attack, an uppercut that rides a bolt up after them;
// in the air, two crackling cuts, then a plunge that lands in a lightning strike; out of a run, a
// flash cut that streaks through the line like lightning; down + attack, a slam and a thunderclap.
// The Tempest's own command moves: up + attack, a rising cut that chains into a second, up through
// them; in the air, three fast cuts then a red dive; out of a run, a flash-step clean through the
// line; down + attack, a skidding slam that throws sparks.
// The Stormwall's own command moves: up + attack, an uppercut that throws a spout of rain and
// lightning up under them; in the air, two heavy cuts then a crash that lands like thunder; out of a
// run, Rolling Thunder (a shoulder charge behind locked plates of static); down + attack, a quake.
const WALL_COMMANDS = {
  up: { move: 'bwupper', dur: 0.52, step: 4, strikes: [wall({ at: 0.46, pct: 120, reach: 76, h: 110, targets: 4, knock: 20, launch: 440, hop: 200, arc: [80, -175], thick: 12, burst: 'bwspout', burstAt: 0.45, burstDur: 0.55, big: true, stop: 0.06 })] },
  air: [
    { move: 'bwaircut', dur: 0.4, hang: true, strikes: [wall({ at: 0.5, pct: 95, reach: 72, h: 84, targets: 3, knock: 20, launch: 130, arc: [-115, 205], thick: 11 })] },
    { move: 'bwairslam', dur: 0.5, dive: 820, finisher: true, strikes: [wall({ onLand: true, pct: 230, reach: 96, h: 74, around: true, targets: 5, knock: 240, provoke: 2, burst: 'bwroll', burstAt: 0, burstDur: 0.55, big: true, stop: 0.1, shake: 5 })] },
  ],
  dash: { move: 'bwcharge', dur: 0.56, step: 70, carry: 0.6, guard: 0.5, strikes: [wall({ at: 0.5, pct: 140, reach: 70, h: 70, targets: 4, knock: 280, stun: 0.5, provoke: 2, burst: 'bwplate', burstAt: 0.7, burstDur: 0.45, big: true, stop: 0.07, shake: 3 })] },
  slam: { move: 'bwquake', dur: 0.66, step: 0, strikes: [wall({ at: 0.6, pct: 180, reach: 110, h: 80, around: true, targets: 6, knock: 200, launch: 120, provoke: 2, burst: 'bwroll', burstAt: 0, burstDur: 0.6, big: true, stop: 0.1, shake: 5 })] },
};
const RED_COMMANDS = {
  up: { move: 'tpskyward', dur: 0.46, step: 10, strikes: [red({ at: 0.3, pct: 70, reach: 72, h: 90, targets: 3, knock: 20, launch: 300, hop: 300, arc: [80, -175], thick: 10 }), red({ at: 0.62, pct: 80, reach: 72, h: 120, targets: 3, knock: 30, launch: 420, hop: 260, arc: [60, -150], thick: 10, big: true, stop: 0.05 })] },
  air: [
    { move: 'tpaircut', dur: 0.26, hang: true, strikes: [red({ at: 0.45, pct: 70, reach: 68, h: 80, targets: 2, knock: 10, launch: 140, arc: [-115, 205] })] },
    { move: 'tpaircut2', dur: 0.26, hang: true, strikes: [red({ at: 0.45, pct: 74, reach: 68, h: 84, targets: 2, knock: 10, launch: 150, arc: [100, -215] })] },
    { move: 'tpaircut', dur: 0.26, hang: true, strikes: [red({ at: 0.45, pct: 78, reach: 68, h: 84, targets: 2, knock: 10, launch: 160, arc: [-115, 205] })] },
    { move: 'tpairfall', dur: 0.44, dive: 900, finisher: true, strikes: [red({ onLand: true, pct: 200, reach: 86, h: 70, around: true, targets: 4, knock: 220, burst: 'tpbolt', burstAt: 0, burstDur: 0.5, big: true, stop: 0.08, shake: 3 })] },
  ],
  dash: { move: 'tpdash', dur: 0.4, step: 96, carry: 0.7, guard: 0.35, strikes: [red({ at: 0.4, pct: 140, reach: 90, h: 52, targets: 4, pierce: true, knock: 160, burst: 'tpline', burstAt: -1, burstDur: 0.35, big: true, stop: 0.05, shake: 1 })] },
  slam: { move: 'tpslam', dur: 0.5, step: 26, carry: 0.4, strikes: [red({ at: 0.5, pct: 165, reach: 92, h: 76, around: true, targets: 4, knock: 210, burst: 'tpfloor', burstAt: 0, burstDur: 0.45, big: true, stop: 0.08, shake: 3 })] },
};
const STORM_COMMANDS = {
  up: { move: 'tgskyward', dur: 0.48, step: 12, strikes: [storm({ at: 0.4, pct: 120, reach: 72, h: 92, targets: 3, knock: 30, launch: 480, hop: 400, arc: [80, -175], thick: 11, burst: 'tgcolumn', burstAt: 0.4, burstDur: 0.5, big: true, stop: 0.06 })] },
  air: [
    { move: 'tgaircut', dur: 0.34, hang: true, strikes: [storm({ at: 0.45, pct: 90, reach: 68, h: 80, targets: 2, knock: 15, launch: 150, arc: [-115, 205] })] },
    { move: 'tgaircut2', dur: 0.34, hang: true, strikes: [storm({ at: 0.45, pct: 95, reach: 68, h: 84, targets: 2, knock: 15, launch: 170, arc: [100, -215] })] },
    { move: 'tgplunge', dur: 0.48, dive: 780, finisher: true, strikes: [storm({ onLand: true, pct: 220, reach: 90, h: 72, around: true, targets: 4, knock: 230, burst: 'tgbolt', burstAt: 0, burstDur: 0.55, big: true, stop: 0.09, shake: 4 })] },
  ],
  dash: { move: 'tgflash', dur: 0.44, step: 70, carry: 0.6, guard: 0.3, strikes: [storm({ at: 0.42, pct: 140, reach: 88, h: 52, targets: 3, pierce: true, knock: 200, burst: 'tgflash', burstAt: -0.7, burstDur: 0.4, big: true, stop: 0.05, shake: 1 })] },
  slam: { move: 'tgslam', dur: 0.6, step: 18, strikes: [storm({ at: 0.56, pct: 170, reach: 92, h: 80, around: true, targets: 4, knock: 220, burst: 'tgclap', burstAt: 0, burstDur: 0.55, big: true, stop: 0.09, shake: 4 })] },
};
// The Moon Moth's command moves: up + attack, a rising double cut that follows them up; in the air,
// two fluttering cuts that hold her up (the second a heavier one); out of a run, she breaks into
// moths and re-forms past them, turned round (while still moths) to cut what she passed (a
// backstab on anything facing away), untouchable as moths.
const MOTH_COMMANDS = {
  up: { move: 'mmrise', dur: 0.36, step: 8, strikes: [moth({ at: 0.3, pct: 62, reach: 66, h: 90, targets: 3, knock: 20, launch: 320, hop: 300, arc: [80, -175], thick: 7 }), moth({ at: 0.6, pct: 70, reach: 66, h: 110, targets: 3, knock: 30, launch: 420, hop: 260, arc: [60, -150], thick: 8, stop: 0.04 })] },
  air: [
    { move: 'mmaircut', dur: 0.26, hang: true, strikes: [moth({ at: 0.45, pct: 48, reach: 66, h: 80, targets: 2, knock: 15, launch: 150, arc: [-115, 205], thick: 7 }), off({ at: 0.63, pct: 44, h: 80, targets: 2, knock: 15, launch: 120 })] },
    { move: 'mmaircut', dur: 0.3, hang: true, finisher: true, strikes: [moth({ at: 0.45, pct: 58, reach: 72, h: 86, targets: 3, knock: 60, launch: 100, arc: [-140, 260], thick: 9 }), off({ at: 0.63, pct: 60, reach: 72, h: 86, targets: 3, knock: 140, launch: 120, burst: 'mmcloud', burstAt: 0.45, burstDur: 0.5, big: true, stop: 0.05, shake: 1 })] },
  ],
  dash: { move: 'mmstep', dur: 0.36, step: 96, carry: 0.7, guard: 0.4, moths: [0.12, 0.5], strikes: [
    { at: 0.08, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, gauge: 0, burst: 'mmcloud', burstAt: 0, burstDur: 0.45 },
    { at: 0.46, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, gauge: 0, turn: true },
    moth({ at: 0.62, pct: 135, reach: 120, h: 56, targets: 4, knock: 120, turn: true, backstab: 1.3, burst: 'mmcloud', burstAt: 0, burstDur: 0.45, big: true, stop: 0.05 }),
  ] },
};

// The Eclipse's command moves: up + attack, a rising cut through a ring of gold; in the air, two
// dark cuts that hold her up; out of a run, she sinks into a disc of shadow, slips past the line
// hidden and comes out turned round, stabbing what she passed (a backstab).
const ECL_COMMANDS = {
  up: { move: 'ecrise', dur: 0.36, step: 8, strikes: [ecl({ at: 0.32, pct: 62, reach: 66, h: 90, targets: 3, knock: 20, launch: 320, hop: 300, arc: [80, -175], thick: 7 }), ecl({ at: 0.6, pct: 72, reach: 66, h: 110, targets: 3, knock: 30, launch: 420, hop: 260, arc: [60, -150], thick: 8, burst: 'ecring', burstAt: 0.3, burstDur: 0.4, stop: 0.04 })] },
  air: [
    { move: 'ecaircut', dur: 0.26, hang: true, strikes: [ecl({ at: 0.45, pct: 48, reach: 66, h: 80, targets: 2, knock: 15, launch: 150, arc: [-115, 205], thick: 7 }), ecl({ at: 0.5, pct: 44, reach: 66, h: 80, targets: 2, knock: 15, launch: 120 })] },
    { move: 'ecaircut', dur: 0.3, hang: true, finisher: true, strikes: [ecl({ at: 0.45, pct: 56, reach: 72, h: 86, targets: 3, knock: 60, launch: 100, arc: [-140, 260], thick: 9 }), ecl({ at: 0.5, pct: 60, reach: 72, h: 86, targets: 3, knock: 140, launch: 120, mark: 1, big: true, stop: 0.05, shake: 1 })] },
  ],
  dash: { move: 'ecslip', dur: 0.36, step: 100, carry: 0.7, guard: 0.4, hide: [0.12, 0.46], strikes: [
    { at: 0.08, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, gauge: 0, burst: 'ecportal', burstAt: 0, burstDur: 0.45 },
    { at: 0.44, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, gauge: 0, turn: true },
    ecl({ at: 0.6, pct: 140, reach: 120, h: 56, targets: 4, knock: 120, turn: true, backstab: 1.3, burst: 'ecportal', burstAt: 0, burstDur: 0.45, big: true, stop: 0.05 }),
  ] },
};

// The Silkweaver's command moves: up + attack, she climbs a thread up through them cutting; in the
// air, two cuts hanging off a thread; out of a run, she zips along a thread through the line and
// cuts back at what she passed (a thread on each).
const SILK_COMMANDS = {
  up: { move: 'svrise', dur: 0.36, step: 8, strikes: [silk({ at: 0.32, pct: 62, reach: 66, h: 90, targets: 3, knock: 20, launch: 320, hop: 300, arc: [80, -175], thick: 7 }), silk({ at: 0.6, pct: 70, reach: 66, h: 110, targets: 3, knock: 30, launch: 420, hop: 260, arc: [60, -150], thick: 8, thread: 1, stop: 0.04 })] },
  air: [
    { move: 'svaircut', dur: 0.26, hang: true, strikes: [silk({ at: 0.45, pct: 48, reach: 66, h: 80, targets: 2, knock: 15, launch: 150, arc: [-115, 205], thick: 7 }), soff({ at: 0.63, pct: 44, h: 80, targets: 2, knock: 15, launch: 120 })] },
    { move: 'svaircut', dur: 0.3, hang: true, finisher: true, strikes: [silk({ at: 0.45, pct: 56, reach: 72, h: 86, targets: 3, knock: 60, launch: 100, arc: [-140, 260], thick: 9 }), soff({ at: 0.63, pct: 60, reach: 72, h: 86, targets: 3, knock: 140, launch: 120, thread: 1, big: true, stop: 0.05, shake: 1 })] },
  ],
  dash: { move: 'svzip', dur: 0.36, step: 100, carry: 0.7, guard: 0.4, strikes: [
    { at: 0.06, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, gauge: 0, burst: 'svzipline', burstAt: 0, burstDur: 0.5 },
    { at: 0.44, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, gauge: 0, turn: true },
    silk({ at: 0.6, pct: 136, reach: 120, h: 56, targets: 4, knock: 120, turn: true, thread: 1, big: true, stop: 0.05 }),
  ] },
};

// The warrior paths fight in a blade's reach and put their weight into it.
const warriorPath = (char) => hasVolt(char) || hasGale(char) || hasBulwark(char) || hasRage(char) || hasFaith(char);
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
  if (before < FAITH_MAX && world.faith >= FAITH_MAX) transform(world);
}
// The share Faith takes off a hit; a hit taken also builds it.
export function faithGuard(world, fromX = null) {
  // (The Thunderguard's Charge takes its share off too, builds on the hit, and at Overcharge, or in
  // Static Guard, shocks back.)
  // (The Stormwall's Thunderhead too, and at half its cloud answers the blow with a bolt.)
  if (hasBulwark(world.char)) {
    const cut = (BULWARK_CUT * (world.bulwark ?? 0)) / BULWARK_MAX;
    cloudBolt(world, fromX, world.body.y);
    addBulwark(world, BULWARK_ON_HURT);
    return cut;
  }
  if (hasVolt(world.char)) {
    const cut = (VOLT_GUARD * (world.volt ?? 0)) / VOLT_MAX;
    staticShell(world, fromX);
    addVolt(world, VOLT_ON_HURT);
    return cut;
  }
  if (!hasFaith(world.char)) return 0;
  const cut = (FAITH_CUT * (world.faith ?? 0)) / FAITH_MAX;
  addFaith(world, FAITH_ON_HURT);
  return cut;
}
// Tide: the Tide Mage's gauge. Her water that lands builds it, and so do her heals and shields; it
// ebbs once the fighting stops. The fuller it runs, the bigger her waves; full (High Tide), every
// basic attack sends a little wave rolling after it, and she and the party near her slowly mend.
export const TIDE_MAX = 100;
const TIDE_HOLD = 5;
const TIDE_DRAIN = 10;
export const TIDE_MEND = 0.01; // of max HP a second, at High Tide, for her and the party near her
export const hasTide = (char) => jobChain(char.job).includes('tidemage') && !hasDepth(char) && !hasMoon(char);
export function addTide(world, n) {
  if (!hasTide(world.char) || n <= 0) return;
  world.tide = Math.min(TIDE_MAX, (world.tide ?? 0) + n);
  world.tideAt = world.now;
}
export const highTide = (world) => hasTide(world.char) && (world.tide ?? 0) >= TIDE_MAX;
// How much bigger her waves run with the Tide: up to a third larger when it's full.
export const tideSwell = (world) => (hasTide(world.char) ? 1 + (world.tide ?? 0) / TIDE_MAX / 3 : 1);
// Moondust: the Moon Moth's gauge (docs/design/moon-moth.md). Her cuts that land build it, a third
// again for each extra monster a blow catches; it settles once the fighting stops. The fuller it
// runs, the more she crits (up to MOONDUST_CRIT more). Full (Full Moon): every basic attack that
// lands sends a moth off to nip another monster near it, and Midnight Swarm is ready.
export const MOONDUST_MAX = 100;
const MOONDUST_HOLD = 5;
const MOONDUST_DRAIN = 10;
export const MOONDUST_CRIT = 0.2;
export const MOTH_NIP = 40; // % of a basic hit: the Full Moon moth's nip
export const hasMoth = (char) => jobChain(char.job).includes('moonmoth') && !hasUmbra(char) && !hasSpool(char);
export function addMoondust(world, n) {
  if (!hasMoth(world.char) || n <= 0) return;
  world.moondust = Math.min(MOONDUST_MAX, (world.moondust ?? 0) + n);
  world.moondustAt = world.now;
}
export const fullMoon = (world) => hasMoth(world.char) && (world.moondust ?? 0) >= MOONDUST_MAX;
// Her crits: how much more often she crits for how full the Moondust runs, and the stats a hit is
// rolled with (the Eclipse's Umbra makes them land harder instead).
export const moondustCrit = (world) => (hasMoth(world.char) ? (MOONDUST_CRIT * Math.min(MOONDUST_MAX, world.moondust ?? 0)) / MOONDUST_MAX : 0);
function critStats(world, stats, m = null) {
  const rate = moondustCrit(world) + (dazzled(world, m) ? DAZZLE_CRIT : 0);
  const harder = umbraCritDamage(world);
  return rate || harder ? { ...stats, critRate: (stats.critRate ?? 0) + rate, critDamage: (stats.critDamage ?? 0) + harder } : stats;
}
// Umbra: the Eclipse's gauge (docs/design/eclipse.md). Her hits build it, backstabs and hits on
// marked monsters twice as fast; it fades once the fighting stops. The fuller it runs, the harder
// her crits land (up to UMBRA_CRITDMG more). Full (Totality): every blow she lands is a crit, and
// Total Eclipse is ready.
export const UMBRA_MAX = 100;
const UMBRA_HOLD = 5;
const UMBRA_DRAIN = 9;
export const UMBRA_CRITDMG = 0.4;
export const hasUmbra = (char) => jobChain(char.job).includes('eclipse');
export function addUmbra(world, n) {
  if (!hasUmbra(world.char) || n <= 0) return;
  world.umbra = Math.min(UMBRA_MAX, (world.umbra ?? 0) + n);
  world.umbraAt = world.now;
}
export const totality = (world) => hasUmbra(world.char) && (world.umbra ?? 0) >= UMBRA_MAX;
export const umbraCritDamage = (world) => (hasUmbra(world.char) ? (UMBRA_CRITDMG * Math.min(UMBRA_MAX, world.umbra ?? 0)) / UMBRA_MAX : 0);
function tickUmbra(world, dt) {
  if (world.umbra > 0 && world.now - (world.umbraAt ?? 0) > UMBRA_HOLD) world.umbra = Math.max(0, world.umbra - UMBRA_DRAIN * dt);
}
// Her marks: a gold eye spot on a monster (up to MARK_MAX, for MARK_SECS since the last one), drawn
// riding on it (`ecmark`). Umbral Edge spends them, Total Eclipse sets them all off.
export const MARK_MAX = 3;
const MARK_SECS = 8;
export const marksOf = (world, m) => (m && m.markUntil > world.now ? m.marks ?? 0 : 0);
export function addMark(world, m, n = 1) {
  if (!m || m.hp <= 0 || !n) return;
  m.marks = Math.min(MARK_MAX, marksOf(world, m) + n);
  m.markUntil = world.now + MARK_SECS;
  // (One drawing per monster, kept alive as long as the marks are.)
  if (m.markFx && m.markFx.t < m.markFx.dur && world.fx.includes(m.markFx)) m.markFx.dur = m.markFx.t + MARK_SECS + 0.3;
  else {
    m.markFx = { kind: 'ecmark', mob: m, x: m.x, y: m.y, h: m.def.h, t: 0, dur: MARK_SECS + 0.3 };
    world.fx.push(m.markFx);
  }
}
export function clearMarks(m) {
  if (!m) return;
  m.marks = 0;
  m.markUntil = 0;
}
// Total Eclipse's last blow: every mark on the monsters round her goes off, `pct` of a hit for each.
function detonateMarks(world, s) {
  const { body } = world;
  let i = 0;
  for (const m of world.mobs) {
    const n = marksOf(world, m);
    if (!n || m.hp <= 0 || Math.abs(m.x - body.x) > s.reach || Math.abs(m.y - body.y) > s.h) continue;
    clearMarks(m);
    world.fx.push({ kind: 'ecpop', school: 'eclipse', x: m.x, y: m.y, h: m.def.h, mob: m, n, dir: s.dir, t: -i * 0.04, dur: 0.6, seed: Math.random() });
    shotHit(world, { pct: s.detonateAll * n, scale: s.scale ?? 100, key: s.key, dir: Math.sign(m.x - body.x) || s.dir, knock: 160, launch: 140, big: true, gauge: 0 }, m, 0.05 + i * 0.04, i);
    i++;
  }
}
// Daybreak: the Sunfeather's gauge (docs/design/sunfeather.md). Shots that land build it, more for
// each one landed in a row (within DAYBREAK_ROW s of the last); a hit on her halves it; it fades once
// the fighting stops. The fuller it runs, the faster she shoots (up to DAYBREAK_PACE). Full
// (Sunrise): every basic shot that lands fans into three (two small light arrows off it), and Sunrise
// Volley is ready. (Her paths have their own gauges.)
// (Anyone on the Sunfeather's line: her shots carry their own marks, no shared spark.)
export const sunLine = (char) => jobChain(char.job).includes('sunfeather');
export const DAYBREAK_MAX = 100;
const DAYBREAK_HOLD = 5;
const DAYBREAK_DRAIN = 10;
const DAYBREAK_ROW = 1.5;
export const DAYBREAK_PACE = 0.15;
export const hasDaybreak = (char) => {
  const chain = jobChain(char.job);
  return chain.includes('sunfeather') && !chain.includes('phoenix') && !chain.includes('songbird');
};
export function addDaybreak(world, n) {
  if (!hasDaybreak(world.char) || n <= 0) return;
  world.dayRow = world.now - (world.daybreakAt ?? -9) < DAYBREAK_ROW ? (world.dayRow ?? 0) + 1 : 1;
  world.daybreak = Math.min(DAYBREAK_MAX, (world.daybreak ?? 0) + n * (1 + 0.12 * Math.min(6, world.dayRow - 1)));
  world.daybreakAt = world.now;
}
export const sunrise = (world) => hasDaybreak(world.char) && (world.daybreak ?? 0) >= DAYBREAK_MAX;
// How much quicker her basic shots come for how full it runs.
export const daybreakPace = (world) => (hasDaybreak(world.char) ? 1 - (DAYBREAK_PACE * Math.min(DAYBREAK_MAX, world.daybreak ?? 0)) / DAYBREAK_MAX : 1);
function tickDaybreak(world, dt) {
  if (world.daybreak > 0 && world.now - (world.daybreakAt ?? 0) > DAYBREAK_HOLD) world.daybreak = Math.max(0, world.daybreak - DAYBREAK_DRAIN * dt);
}
// A hit on her halves it and breaks her run of shots.
export function daybreakHurt(world) {
  if (!hasDaybreak(world.char) || !(world.daybreak > 0)) return;
  world.daybreak *= 0.5;
  world.dayRow = 0;
}

// Kindling: the Phoenix's gauge. Bolts that land build it, hits on burning monsters half again
// faster; it fades once the fighting stops. The fuller it runs, the harder her burns bite (up to
// KINDLE_BITE more). Full (Blaze): every bolt bursts where it lands, catching those beside it, and
// Rebirth is ready.
export const KINDLE_MAX = 100;
const KINDLE_HOLD = 5;
const KINDLE_DRAIN = 10;
export const KINDLE_BITE = 0.6;
export const hasKindling = (char) => jobChain(char.job).includes('phoenix');
export const burning = (world, m) => Boolean(m && m.poison?.kind === 'burn' && m.poison.until > world.now);
export function addKindling(world, n, m = null) {
  if (!hasKindling(world.char) || n <= 0) return;
  world.kindling = Math.min(KINDLE_MAX, (world.kindling ?? 0) + n * (burning(world, m) ? 1.5 : 1));
  world.kindlingAt = world.now;
}
export const blaze = (world) => hasKindling(world.char) && (world.kindling ?? 0) >= KINDLE_MAX;
export const kindleBite = (world) => (hasKindling(world.char) ? 1 + (KINDLE_BITE * Math.min(KINDLE_MAX, world.kindling ?? 0)) / KINDLE_MAX : 1);
function tickKindling(world, dt) {
  if (world.kindling > 0 && world.now - (world.kindlingAt ?? 0) > KINDLE_HOLD) world.kindling = Math.max(0, world.kindling - KINDLE_DRAIN * dt);
}
// Smoulder: a bolt stuck in a monster (`smoulder` on a shot: { pct, secs }) bursts `secs` later, hard,
// and its fire spreads to those beside it (SMOULDER_SPREAD px).
export const SMOULDER_SPREAD = 100;
export function stickSmoulder(world, m, h) {
  if (!m || m.hp <= 0) return;
  m.smoulder = { at: world.now + h.smoulder.secs, pct: h.smoulder.pct, scale: h.smoulder.scale ?? 100, key: h.smoulder.key };
  world.fx.push({ kind: 'phstuck', mob: m, x: m.x, y: m.y, h: m.def.h, dir: Math.sign(m.x - world.body.x) || 1, t: 0, dur: h.smoulder.secs, seed: Math.random() });
}
function tickSmoulder(world) {
  for (const m of world.mobs) {
    const sm = m.smoulder;
    if (!sm || world.now < sm.at) continue;
    m.smoulder = null;
    if (m.hp <= 0) continue;
    world.fx.push({ kind: 'phblast', x: m.x, y: m.y, h: m.def.h, mob: m, t: 0, dur: 0.7, seed: Math.random() });
    world.juice.push({ type: 'shake', mag: 3, dur: 0.25 });
    const near = world.mobs.filter((o) => o.hp > 0 && Math.abs(o.x - m.x) <= SMOULDER_SPREAD && Math.abs(o.y - m.y) < 80);
    near.forEach((o, i) => shotHit(world, { pct: o === m ? sm.pct : sm.pct * 0.5, scale: sm.scale, key: sm.key, dir: Math.sign(o.x - m.x) || 1, fromX: m.x, knock: 180, launch: 160, burst: 'phhitbig', burnLook: 'ph', burn: { pct: 0.15, secs: 4 }, big: true, stop: 0.06, gauge: 2 }, o, 0.02 + i * 0.03, i % 3));
  }
}

// Melody: the Songbird's gauge. Her shots and her heals build it; it fades once the fighting stops.
// The fuller it runs, the more her heals mend (up to MELODY_HEAL more). Full (Chorus): every basic
// shot that lands also mends her and the party round her a little (CHORUS_MEND of max HP, at most
// every third of a second), and Grand Chorus is ready.
export const MELODY_MAX = 100;
const MELODY_HOLD = 5;
const MELODY_DRAIN = 10;
export const MELODY_HEAL = 0.33;
export const CHORUS_MEND = 0.015;
export const hasMelody = (char) => jobChain(char.job).includes('songbird');
export function addMelody(world, n) {
  if (!hasMelody(world.char) || n <= 0) return;
  world.melody = Math.min(MELODY_MAX, (world.melody ?? 0) + n);
  world.melodyAt = world.now;
}
export const chorus = (world) => hasMelody(world.char) && (world.melody ?? 0) >= MELODY_MAX;
export const melodyHeal = (world) => (hasMelody(world.char) ? 1 + (MELODY_HEAL * Math.min(MELODY_MAX, world.melody ?? 0)) / MELODY_MAX : 1);
function tickMelody(world, dt) {
  if (world.melody > 0 && world.now - (world.melodyAt ?? 0) > MELODY_HOLD) world.melody = Math.max(0, world.melody - MELODY_DRAIN * dt);
}
// Chorus: a basic shot of hers that lands mends her and the party round her a little.
export function chorusMend(world) {
  if (!chorus(world) || world.now - (world.chorusAt ?? -9) < 0.33) return;
  world.chorusAt = world.now;
  healAround(world, world.body.x, world.body.y, CHORUS_MEND, 220, false);
  world.fx.push({ kind: 'sbmend', x: world.body.x, y: world.body.y, follow: true, t: 0, dur: 0.6, seed: Math.random() });
}

// Spool: the Silkweaver's gauge (docs/design/silkweaver.md). Her hits build it, hits on threaded or
// cocooned monsters half again faster; it fades once the fighting stops. The fuller it runs, the
// longer her cocoons hold (up to half again). Full (Full Spool): every blow she lands ties a thread,
// and Moonspun Cocoon is ready.
export const SPOOL_MAX = 100;
const SPOOL_HOLD = 5;
const SPOOL_DRAIN = 10;
export const hasSpool = (char) => jobChain(char.job).includes('silkweaver');
export function addSpool(world, n) {
  if (!hasSpool(world.char) || n <= 0) return;
  world.spool = Math.min(SPOOL_MAX, (world.spool ?? 0) + n);
  world.spoolAt = world.now;
}
export const fullSpool = (world) => hasSpool(world.char) && (world.spool ?? 0) >= SPOOL_MAX;
function tickSpool(world, dt) {
  if (world.spool > 0 && world.now - (world.spoolAt ?? 0) > SPOOL_HOLD) world.spool = Math.max(0, world.spool - SPOOL_DRAIN * dt);
}
// Her threads: up to THREAD_MAX on a monster, for THREAD_SECS since the last (longer with Weaver's
// Mastery), each slowing it by THREAD_SLOW (a boss half as much). The third wraps it in a cocoon:
// it hangs helpless COCOON_SECS (longer the fuller her Spool) and takes COCOON_HURT more from her
// blows; then it breaks free and can't be cocooned again for COCOON_GUARD s. Bosses are never
// cocooned. Drawn as loops of silk round it (`svthreads`) and the cocoon (render/monsters.js).
export const THREAD_MAX = 3;
const THREAD_SECS = 6;
export const THREAD_SLOW = 0.2;
export const COCOON_SECS = 2;
const COCOON_GUARD = 5;
export const COCOON_HURT = 0.25;
export const threadsOf = (world, m) => (m && m.threadUntil > world.now ? m.threads ?? 0 : 0);
export const cocooned = (world, m) => Boolean(m && m.cocoonUntil > world.now && m.frozenUntil > world.now && m.hold === 'silk');
// (Weaver's Mastery: threads and cocoons last up to 40% longer as it grows.)
function weaveLonger(char) {
  const wm = SKILLS.weavermastery;
  return wm ? 1 + (0.4 * grownLevel(char, wm)) / wm.maxLevel : 1;
}
export function addThread(world, m, n = 1) {
  if (!m || m.hp <= 0 || !n || cocooned(world, m)) return;
  const longer = weaveLonger(world.char);
  m.threads = Math.min(THREAD_MAX, threadsOf(world, m) + n);
  m.threadUntil = world.now + THREAD_SECS * longer;
  m.threadSlow = 1 - THREAD_SLOW * m.threads * (m.def.boss ? 0.5 : 1);
  if (m.threads >= THREAD_MAX && !m.def.boss && !(m.cocoonGuard > world.now)) return cocoon(world, m, longer);
  // (One drawing per monster, kept alive as long as the threads are.)
  if (m.threadFx && m.threadFx.t < m.threadFx.dur && world.fx.includes(m.threadFx)) m.threadFx.dur = m.threadFx.t + THREAD_SECS * longer + 0.3;
  else {
    m.threadFx = { kind: 'svthreads', mob: m, x: m.x, y: m.y, h: m.def.h, w: m.def.w, t: 0, dur: THREAD_SECS * longer + 0.3 };
    world.fx.push(m.threadFx);
  }
}
function cocoon(world, m, longer = 1) {
  const secs = COCOON_SECS * longer * (1 + (0.5 * (world.spool ?? 0)) / SPOOL_MAX);
  m.hold = 'silk';
  m.frozenUntil = Math.max(m.frozenUntil ?? 0, world.now + secs);
  m.cocoonUntil = world.now + secs;
  m.cocoonAt = world.now;
  m.cocoonGuard = world.now + secs + COCOON_GUARD;
  m.threads = 0;
  m.threadUntil = 0;
  m.threadSlow = 1;
  if (m.threadFx) m.threadFx.dur = Math.min(m.threadFx.dur, m.threadFx.t + 0.15);
  world.fx.push({ kind: 'svwrapup', x: m.x, y: m.y, h: m.def.h, w: m.def.w, mob: m, t: 0, dur: 0.45, seed: Math.random() });
}
// Her blows that end a cocoon (Moonspun Cocoon's last, `unwrap`): it bursts into pearl moths.
function unwrapCocoon(world, m, i = 0) {
  if (!cocooned(world, m)) return;
  m.frozenUntil = world.now;
  m.cocoonUntil = world.now;
  world.fx.push({ kind: 'svpop', x: m.x, y: m.y, h: m.def.h, mob: m, t: -i * 0.04, dur: 0.6, seed: Math.random() });
}
// Reel In: every monster she has a thread on (or wrapped in a cocoon) within reach, nearest first.
function reelTargets(world, s) {
  const { body } = world;
  const caught = world.mobs.filter((m) => m.hp > 0 && (threadsOf(world, m) || cocooned(world, m)) && Math.abs(m.x - body.x) <= s.reach && Math.abs(m.y - body.y) < s.h).sort((a, b) => Math.abs(a.x - body.x) - Math.abs(b.x - body.x)).slice(0, s.targets ?? 8);
  if (caught.length) world.fx.push({ kind: 'svreel', x: body.x, y: body.y, mobs: caught, dir: s.dir, t: 0, dur: 0.42 });
  return caught;
}

// Shadow Step: out of a disc of shadow behind the nearest monster ahead (within `behind` px),
// turned to face its back. The blow then lands on it from behind.
function shadowBehind(world, s) {
  const { body } = world;
  const m = world.mobs.filter((k) => k.hp > 0 && (k.x - body.x) * s.dir > 0 && Math.abs(k.x - body.x) <= s.behind && Math.abs(k.y - body.y) < 80).sort((a, b) => Math.abs(a.x - body.x) - Math.abs(b.x - body.x))[0];
  if (!m) return s;
  world.fx.push({ kind: 'ecportal', school: 'eclipse', x: body.x, y: body.y, dir: s.dir, t: 0, dur: 0.45 });
  const half = (m.def.w ?? 30) / 2;
  body.x = Math.max(body.w / 2, Math.min(world.map.width - body.w / 2, m.x + s.dir * (half + 12)));
  body.facing = -s.dir;
  // (Its blow lands on that one monster, the one she stepped behind.)
  return { ...s, dir: -s.dir, only: m };
}
function tickMoondust(world, dt) {
  if (world.moondust > 0 && world.now - (world.moondustAt ?? 0) > MOONDUST_HOLD) world.moondust = Math.max(0, world.moondust - MOONDUST_DRAIN * dt);
}
// The thieves' flutter jump (the player's call, 2026-11-16: quick feet): Jump pressed again in the
// air springs her on the way she holds (or faces) with a little hop up, in a burst of her moths. Once
// each time she leaves the floor; a landing or a rope gives it back. (Mostly forward: a tall second
// jump reached the ledges the maps' ropes and climbs are there for.)
export const FLUTTER = { up: 0.2, on: 340 };
export function flutterJump(world, intent) {
  const { body, char } = world;
  if (JOBS[char.job]?.family !== 'thief' || world.flutterUsed || body.onGround || body.rope || world.dead) return false;
  world.flutterUsed = true;
  const dir = intent.left ? -1 : intent.right ? 1 : body.facing;
  body.facing = dir;
  body.vy = -JUMP_SPEED * FLUTTER.up;
  body.vx = dir * FLUTTER.on;
  world.fx.push({ kind: `${thiefLook(char)}flutter`, x: body.x, y: body.y, dir, t: 0, dur: 0.45, seed: Math.random() });
  world.juice.push({ type: 'flutter', x: body.x, y: body.y });
  return true;
}
// ---------- The Moon Moth's second four (docs/design/moon-moth.md, 2026-11-16) ----------
// Which thief's look an effect takes: the Moon Moth's lilac ('mm'), the Eclipse's violet and gold
// ('ec'), the Silkweaver's pearl ('sv').
export const thiefLook = (char) => (hasUmbra(char) ? 'ec' : hasSpool(char) ? 'sv' : 'mm');
// Moth Veil (the `mothveil` buff): its `veil` is the share of blows the moths take outright, and
// every blow that misses her while it lasts sends a moth back to nip whoever swung (VEIL_NIP % of a
// hit, at most one every quarter second).
export const VEIL_NIP = 80;
export function veilOf(world) {
  const b = world.char.buffs?.mothveil;
  return b && b.until > world.now ? b.values?.veil ?? 0 : 0;
}
// A blow at her (from monster `m`, or from `fromX`): do the moths take it? Then it's a MISS.
export function veilDodge(world, m = null, fromX = null) {
  const v = veilOf(world);
  if (!v || world.dead || Math.random() >= v) return false;
  const { body } = world;
  world.numbers.push({ x: body.x, y: body.y - body.h - 6, text: 'MISS', color: '#d4cbe8', t: 0 });
  world.invuln = Math.max(world.invuln, 0.5);
  veilMissed(world, m, fromX);
  return true;
}
// A blow that missed her while she's veiled: her moths scatter off her and one darts back at it.
export function veilMissed(world, m = null, fromX = null) {
  if (!veilOf(world)) return;
  const { body, char } = world;
  const look = thiefLook(char);
  world.fx.push({ kind: `${look}dodge`, x: body.x, y: body.y, dir: body.facing, t: 0, dur: 0.5, seed: Math.random() });
  const x = m?.x ?? fromX ?? body.x;
  const foe = m && m.hp > 0 ? m : world.mobs.filter((k) => k.hp > 0 && Math.abs(k.x - x) < 120 && Math.abs(k.y - body.y) < 90).sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x))[0];
  if (!foe || world.now - (world.veilNipAt ?? -9) < 0.25) return;
  world.veilNipAt = world.now;
  const dir = Math.sign(foe.x - body.x) || body.facing;
  world.fx.push({ kind: 'mmnip', look, x: body.x, y: body.y - body.h * 0.6, tx: foe.x, ty: foe.y - foe.def.h * 0.55, mob: foe, dir, t: 0, dur: 0.36, seed: Math.random() });
  shotHit(world, { pct: VEIL_NIP, scale: 100, key: 'procveil', dir, knock: 40, burst: `${look}hit`, gauge: 2 }, foe, 0.3, 0);
}
// Dazzle Dust: a dazzled monster (`dazzle` s on a blow) stumbles about instead of chasing, can't land
// a hit on her, and her blows on it crit DAZZLE_CRIT more often. A boss only gives up the crits, for
// half as long. Drawn with sparkles circling its head (render/monsters.js).
export const DAZZLE_CRIT = 0.25;
export const dazzled = (world, m) => Boolean(m && m.dazzleUntil > world.now);
export const blinded = (now, m) => Boolean(m && !m.def.boss && m.dazzleUntil > now);
function dazzle(world, m, secs, look) {
  m.dazzleUntil = Math.max(m.dazzleUntil ?? 0, world.now + (m.def.boss ? secs / 2 : secs));
  m.dazzleLook = look;
  if (!m.def.boss) m.aggroUntil = 0;
}
// Moonlure: a moon lantern glowing on the floor (`lure` on a blow: { secs, r, pct }). Every monster
// within `r` of it on its floor wanders over and gathers under its light, gazing up, harmless; then it
// pops in a burst of moths that hits everything gathered round it (`pct`). Never bosses.
export const LURE_POP = 110; // px round the lantern its burst reaches
function setLure(world, s) {
  const { body } = world;
  const x = Math.max(40, Math.min(world.map.width - 40, body.x + s.dir * (s.lure.at ?? 110)));
  const look = s.look ?? thiefLook(world.char);
  const secs = s.lure.secs;
  world.lure = { x, y: body.y, until: world.now + secs, r: s.lure.r, pct: s.lure.pct, scale: s.scale ?? 100, key: s.key, dir: s.dir, look, thread: s.thread };
  world.fx.push({ kind: `${look}lure`, x, y: body.y, dir: s.dir, t: 0, dur: secs + 0.15, seed: Math.random() });
}
function tickLure(world) {
  const L = world.lure;
  if (!L) return;
  if (world.now < L.until) {
    // (Each one its own place round the lantern, so they gather in a ring instead of one heap.)
    let n = 0;
    for (const m of world.mobs) {
      if (m.hp <= 0 || m.def.boss || Math.abs(m.y - L.y) > 90 || Math.abs(m.x - L.x) > L.r) continue;
      if (!(m.lureUntil > world.now)) m.lureSlot = n % 2 ? -(14 + 10 * (n >> 1)) : 14 + 10 * (n >> 1);
      m.lureX = L.x + (m.lureSlot ?? 0);
      m.lureUntil = L.until;
      n++;
    }
    return;
  }
  world.lure = null;
  world.fx.push({ kind: `${L.look}lurepop`, x: L.x, y: L.y, dir: L.dir, t: 0, dur: 0.6, seed: Math.random() });
  world.juice.push({ type: 'shake', mag: 2, dur: 0.2 });
  let i = 0;
  for (const m of world.mobs) {
    if (m.hp <= 0 || Math.abs(m.y - L.y) > 90 || Math.abs(m.x - L.x) > LURE_POP) continue;
    m.lureUntil = 0;
    shotHit(world, { pct: L.pct, scale: L.scale, key: L.key, dir: Math.sign(m.x - L.x) || L.dir, fromX: L.x, knock: 160, launch: 120, burst: `${L.look}hit`, big: true, thread: L.thread }, m, 0.04 + i * 0.03, i % 3);
    i++;
  }
}
// Is a monster gathered under the lantern (harmless, gazing up)?
export const lured = (now, m) => Boolean(m && !m.def.boss && m.lureUntil > now);
// Wing Feint: every monster a feint catches (`feint` s) turns to watch the moths flying off past it,
// frozen that long with its back to her (half as long for a boss), and her blows on it for
// FEINT_OPEN s are backstabs (FEINT_STAB harder, and crits).
export const FEINT_OPEN = 3;
export const FEINT_STAB = 1.5;
function feint(world, s, targets) {
  const { body } = world;
  const look = s.look ?? thiefLook(world.char);
  targets.forEach((m, i) => {
    m.dir = Math.sign(m.x - body.x) || m.dir;
    m.heading = m.dir;
    const secs = m.def.boss ? s.feint / 2 : s.feint;
    if (!(m.frozenUntil > world.now)) m.hold = 'feint';
    m.frozenUntil = Math.max(m.frozenUntil ?? 0, world.now + secs);
    m.feintUntil = world.now + Math.max(secs, FEINT_OPEN);
    m.feintLook = look;
    world.fx.push({ kind: `${look}hit`, x: m.x, y: m.y, h: m.def.h, mob: m, dir: s.dir, t: -i * 0.03, dur: 0.5, seed: Math.random() });
  });
  // The moths she flicked off, flying away past them.
  world.fx.push({ kind: `${look}feint`, x: body.x + s.dir * s.reach * 0.55, y: body.y, r: s.reach, dir: s.dir, t: 0, dur: 0.75, seed: Math.random() });
  // (The Silkweaver's Silk Feint ties a thread on each one it turns.)
  if (s.thread) targets.forEach((m) => addThread(world, m, s.thread));
}

// Full Moon: a moth flutters off a basic attack that lands and nips the nearest monster the blow
// didn't catch (else the one it hit), at most one every quarter second.
function moonNip(world, hit, s) {
  if (!fullMoon(world) || !hit.length || world.now - (world.nipAt ?? -9) < 0.25) return;
  const from = hit[0];
  const near = world.mobs.filter((m) => m.hp > 0 && !hit.includes(m) && Math.abs(m.x - from.x) < 220 && Math.abs(m.y - from.y) < 120).sort((a, b) => Math.abs(a.x - from.x) - Math.abs(b.x - from.x))[0] ?? from;
  world.nipAt = world.now;
  const dir = Math.sign(near.x - from.x) || s.dir || 1;
  world.fx.push({ kind: 'mmnip', x: from.x, y: from.y - from.def.h * 0.6, tx: near.x, ty: near.y - near.def.h * 0.55, mob: near, dir, t: 0, dur: 0.42, seed: Math.random() });
  shotHit(world, { pct: MOTH_NIP, scale: 100, key: 'procmoth', dir, fromX: from.x, knock: 20, burst: 'mmhit', gauge: 0 }, near, 0.36, 0);
}
// Moonsong: the Tidecaller's gauge (the Tide Mage's healer path, docs/design/tidecaller.md). Her
// hits and her heals build it; it fades once the fighting stops. The fuller it runs, the stronger
// her heals (up to a third more). Full (Spring Tide), her heals leave a bubble on everyone they
// reach, and every basic attack that lands drops a healing droplet on whoever in the party is hurt
// most. The finisher spends it.
export const MOON_MAX = 100;
const MOON_HOLD = 5;
const MOON_DRAIN = 10;
const MOON_HEAL = 0.3;
export const SPRING_BUBBLE = 0.08; // of max HP: the bubble her heals leave at Spring Tide (6 s)
export const SPRING_DROP = 0.025; // of max HP: each droplet at Spring Tide
export const hasMoon = (char) => jobChain(char.job).includes('tidecaller');
export function addMoon(world, n) {
  if (!hasMoon(world.char) || n <= 0) return;
  world.moon = Math.min(MOON_MAX, (world.moon ?? 0) + n);
  world.moonAt = world.now;
}
export const springTide = (world) => hasMoon(world.char) && (world.moon ?? 0) >= MOON_MAX;
// How much harder her heals mend: Moonsong (up to a third) and Tidesong's passive.
const moonHeal = (world) => (hasMoon(world.char) ? 1 + (MOON_HEAL * (world.moon ?? 0)) / MOON_MAX + (world.stats.healBoost ?? 0) : 1);
function tickMoon(world, dt) {
  if (world.moon > 0 && world.now - (world.moonAt ?? 0) > MOON_HOLD) world.moon = Math.max(0, world.moon - MOON_DRAIN * dt);
}
// Spring Tide: a droplet of healing water falls on whoever in the party is hurt most (you too),
// one at most every 0.4 s.
export function springDrop(world) {
  if (!springTide(world) || world.dead || world.now - (world.moonDropAt ?? -9) < 0.4) return;
  const group = world.dungeon ? groupOf(world).filter((g) => isUp(world, g)) : [{ id: 'you', body: world.body }];
  const hurt = group.map((g) => ({ g, f: g.id === 'you' ? world.char.hp / world.stats.maxHp : hpOf(world, g) / maxHpOf(world, g) })).filter((h) => h.f < 1).sort((a, b) => a.f - b.f)[0];
  if (!hurt) return;
  world.moonDropAt = world.now;
  const { g } = hurt;
  world.fx.push({ kind: 'tcdrop', x: g.body.x, y: g.body.y, h: g.body.h ?? 40, t: 0, dur: 0.7 });
  if (g.id === 'you') {
    const amount = Math.max(1, Math.round(world.stats.maxHp * SPRING_DROP * moonHeal(world)));
    world.char.hp = Math.min(world.stats.maxHp, world.char.hp + amount);
    world.numbers.push({ x: world.body.x, y: world.body.y - world.body.h - 6, text: `+${amount}`, color: '#7ee0b0', t: 0 });
  } else healMembers(world, SPRING_DROP * moonHeal(world), { x: g.body.x - 1, y: g.body.y - 160, w: 2, h: 320 });
}
// Tide's Return and Moon Tide: the fallen in `r` of her get back on their feet with `pct` of their HP.
function reviveAround(world, pct, r) {
  if (!world.dungeon) return;
  for (const g of groupOf(world)) {
    if (g.id === 'you' || isUp(world, g) || Math.abs(g.body.x - world.body.x) > r) continue;
    reviveMember(world, g, pct);
    world.fx.push({ kind: 'tcrevive', x: g.body.x, y: g.body.y, t: 0, dur: 1.2 });
  }
}
// Depth: the Maelstrom's gauge (the Tide Mage's damage path). Her hits build it; it drains once the
// fighting stops. The deeper it runs, the harder she hits (up to a quarter more); full (the Abyss),
// every hit leaves a small vortex on what it struck that shreds it three times more, and the
// finisher spends it.
export const DEPTH_MAX = 100;
const DEPTH_HOLD = 5;
const DEPTH_DRAIN = 10;
const DEPTH_POWER = 0.25;
export const ABYSS_PCT = 18;
export const hasDepth = (char) => jobChain(char.job).includes('maelstrom');
export function addDepth(world, n) {
  if (!hasDepth(world.char) || n <= 0) return;
  world.depth = Math.min(DEPTH_MAX, (world.depth ?? 0) + n);
  world.depthAt = world.now;
}
export const abyss = (world) => hasDepth(world.char) && (world.depth ?? 0) >= DEPTH_MAX;
const depthPower = (world) => (hasDepth(world.char) ? 1 + (DEPTH_POWER * (world.depth ?? 0)) / DEPTH_MAX : 1);
// The Abyss: a vortex opens on a monster she hit and shreds it, three more little hits (one vortex
// on it at a time).
function abyssVortex(world, m) {
  if (!abyss(world) || !m || m.hp <= 0 || (m.vortexUntil ?? 0) > world.now) return;
  m.vortexUntil = world.now + 1.1;
  world.fx.push({ kind: 'msvortexsmall', mob: m, x: m.x, y: m.y, h: m.def.h, t: 0, dur: 1.05 });
  [0.3, 0.6, 0.9].forEach((d, i) => shotHit(world, { pct: ABYSS_PCT, scale: 100, key: 'procabyss', dir: Math.sign(m.x - world.body.x) || 1, knock: 0, burst: 'mshit', gauge: 0, magic: true, quiet: true }, m, d, i));
}
function tickDepth(world, dt) {
  if (world.depth > 0 && world.now - (world.depthAt ?? 0) > DEPTH_HOLD) world.depth = Math.max(0, world.depth - DEPTH_DRAIN * dt);
}
function tickTide(world, dt) {
  if (world.tide > 0 && world.now - (world.tideAt ?? 0) > TIDE_HOLD) world.tide = Math.max(0, world.tide - TIDE_DRAIN * dt);
  if (!highTide(world) || world.dead) return;
  // (Mended once a second, so the numbers read: TIDE_MEND each time, her own and the party's.)
  world.tideMendIn = (world.tideMendIn ?? 1) - dt;
  if (world.tideMendIn > 0) return;
  world.tideMendIn = 1;
  healAround(world, world.body.x, world.body.y, TIDE_MEND, 200, false);
}
// Thunderhead: the Stormwall's gauge (internally Bulwark). Built by the hits he takes, by holding
// monsters on him and by his blows; slow to fade. The fuller it runs, the less he takes (up to
// BULWARK_CUT). At half, the thundercloud over him answers whatever hits him or his party with a
// bolt from above. Full (Eye of the Storm): every monster near him is held to him, and Fortress is
// ready (and spends it).
export const BULWARK_MAX = 100;
const BULWARK_HOLD = 7;
const BULWARK_DRAIN = 6;
export const BULWARK_CUT = 0.2;
const BULWARK_ON_HURT = 8;
export const BOLT_PCT = 90; // the cloud's answering bolt (% of a basic blow)
export const hasBulwark = (char) => jobChain(char.job).includes('stormwall');
export function addBulwark(world, n) {
  if (!hasBulwark(world.char) || n <= 0) return;
  world.bulwark = Math.min(BULWARK_MAX, (world.bulwark ?? 0) + n);
  world.bulwarkAt = world.now;
}
export const eyeOfStorm = (world) => hasBulwark(world.char) && (world.bulwark ?? 0) >= BULWARK_MAX;
// The thunderhead's answer: a bolt from above on the monster that just hit him or a friend (the
// nearest to where the blow came from), at most once every 0.6 s.
export function cloudBolt(world, fromX, y) {
  if (!hasBulwark(world.char) || (world.bulwark ?? 0) < BULWARK_MAX / 2 || fromX == null) return;
  if (world.now - (world.cloudBoltAt ?? -9) < 0.6) return;
  const m = world.mobs.filter((o) => o.hp > 0 && Math.abs(o.x - fromX) < 90 && Math.abs(o.y - y) < 140).sort((a, b) => Math.abs(a.x - fromX) - Math.abs(b.x - fromX))[0];
  if (!m) return;
  world.cloudBoltAt = world.now;
  world.fx.push({ kind: 'bwboltdown', x: m.x, y: m.y, r: 70, t: 0, dur: 0.6, seed: Math.random() });
  shotHit(world, { pct: BOLT_PCT, scale: 100, key: 'proccloud', dir: Math.sign(m.x - world.body.x) || 1, knock: 40, stun: 0.3, burst: 'bwhit', gauge: 0, quiet: true }, m, 0.08, 0);
}
// Eye of the Storm: every monster near him is held to him (once a second).
function tickEye(world, dt) {
  if (!eyeOfStorm(world) || world.dead) return;
  world.eyeIn = (world.eyeIn ?? 0) - dt;
  if (world.eyeIn > 0) return;
  world.eyeIn = 1;
  if (world.dungeon) provoke(world, 'you', world.body, 220, 1.5);
  else for (const m of world.mobs) if (m.hp > 0 && Math.abs(m.x - world.body.x) < 220 && Math.abs(m.y - world.body.y) < 120) m.aggroUntil = world.now + 1.5;
}
// Velocity: the Tempest's gauge (internally Gale). His hits build it quickly and it falls fast once
// he stops hitting. The fuller it runs, the faster he swings (up to GALE_SPEED quicker); at half or
// more every basic blow leaves a red afterimage of him that strikes again a beat later, lighter.
// Full (Lightspeed): the afterimage hits as hard as he does, each finisher flash-steps him to the
// far side of the pack, and Red Thunder is ready (and spends it).
export const GALE_MAX = 100;
const GALE_HOLD = 2;
const GALE_DRAIN = 28;
export const GALE_SPEED = 0.25;
export const ECHO_PCT = 0.4; // of the blow, an afterimage's (all of it at Lightspeed)
export const hasGale = (char) => jobChain(char.job).includes('tempest');
export function addGale(world, n) {
  if (!hasGale(world.char) || n <= 0) return;
  world.gale = Math.min(GALE_MAX, (world.gale ?? 0) + n);
  world.galeAt = world.now;
}
export const lightspeed = (world) => hasGale(world.char) && (world.gale ?? 0) >= GALE_MAX;
const galeSpeed = (world) => (hasGale(world.char) ? 1 / (1 + (GALE_SPEED * (world.gale ?? 0)) / GALE_MAX) : 1);
// The afterimage: his red copy plays the swing again a beat behind him (render/scene.js draws it
// from `echoSwing`), and its blow lands then.
function galeEcho(world, s) {
  const boost = world.char.buffs.afterimage?.until > world.now ? world.char.buffs.afterimage.values.echo : 0;
  if ((world.gale ?? 0) < GALE_MAX / 2 && !boost) return;
  const k = lightspeed(world) ? 1 : Math.max(ECHO_PCT, boost);
  world.strikes.push({ ...s, due: world.now + 0.1, key: 'procecho', fx: 'tphit', provoke: undefined, scale: s.scale * k, keepFacing: true, quiet: true, knock: (s.knock ?? 0) * 0.4, launch: 0, pull: 0, hop: 0, blink: 0, burst: undefined, big: false, stop: 0.02, shake: 0, gauge: 0, finisher: false, arc: s.arc, pierce: s.pierce });
  if (!(world.echoSwing && world.now < world.echoSwing.until)) world.echoSwing = { kind: s.move, since: world.now + 0.1 - s.at * s.dur, dur: s.dur, until: world.now + 0.1 + (1 - s.at) * s.dur, x: world.body.x, facing: world.body.facing };
}
// A blink (the finishers' flash-steps, and every finisher at Lightspeed): he's gone in a red bolt and
// stands past the farthest monster ahead within `range`, turned back toward them.
function blinkThrough(world, s, range) {
  const { body } = world;
  const dir = s.dir || body.facing;
  const ahead = world.mobs.filter((m) => m.hp > 0 && (m.x - body.x) * dir > 0 && Math.abs(m.x - body.x) <= range && Math.abs(m.y - body.y) < 90);
  if (!ahead.length) return;
  const far = ahead.reduce((a, m) => (Math.abs(m.x - body.x) > Math.abs(a.x - body.x) ? m : a));
  const to = far.x + dir * (far.def.w / 2 + 26);
  const ground = groundAt(world.map, to, body.y);
  if (ground == null || Math.abs(ground - body.y) > 24) return;
  world.fx.push({ kind: 'tpflashstep', x: body.x, y: body.y - body.h * 0.5, tx: to, ty: body.y - body.h * 0.5, t: 0, dur: 0.35, seed: Math.random() });
  body.x = to;
  body.facing = -dir;
  world.invuln = Math.max(world.invuln ?? 0, 0.25);
}
// Charge: the Thunderguard's gauge (the Warrior remade; internally Volt; the paths have their own).
// His blows build it, faster the more monsters one blow catches, and so do the hits he takes; it
// fades once the fighting stops. The fuller it runs, the harder he hits (up to VOLT_POWER more) and
// the less he takes (up to VOLT_GUARD). Full (Overcharge): every blow he lands sends lightning
// jumping to up to two more monsters near what it hit, a static shell shocks whatever hits him,
// nothing knocks him back, and Thunderfall is ready (and spends it).
export const VOLT_MAX = 100;
const VOLT_HOLD = 5;
const VOLT_DRAIN = 11;
const VOLT_POWER = 0.2;
export const VOLT_GUARD = 0.1;
const VOLT_ON_HURT = 6;
export const CHAIN_PCT = 0.3; // of the blow, each bolt that jumps on at Overcharge
export const SHELL_PCT = 60; // the static shell's shock on whatever hits him (% of a basic blow)
export const hasVolt = (char) => char.job === 'warrior';
export function addVolt(world, n) {
  if (!hasVolt(world.char) || n <= 0) return;
  world.volt = Math.min(VOLT_MAX, (world.volt ?? 0) + n);
  world.voltAt = world.now;
}
export const overcharged = (world) => hasVolt(world.char) && (world.volt ?? 0) >= VOLT_MAX;
const voltPower = (world) => (hasVolt(world.char) ? 1 + (VOLT_POWER * (world.volt ?? 0)) / VOLT_MAX : 1);
// Overcharge: lightning jumps from a monster he hit to up to two more near it (each a bolt drawn
// between them and a crackle on the one it reaches), at most once a quarter second from each.
function chainBolt(world, m, s) {
  if (!overcharged(world) || !m || s.phantom || s.key === 'procchain' || (m.chainAt ?? -9) > world.now - 0.25) return;
  m.chainAt = world.now;
  const near = world.mobs.filter((o) => o !== m && o.hp > 0 && Math.abs(o.x - m.x) < 150 && Math.abs(o.y - m.y) < 90).sort((a, b) => Math.abs(a.x - m.x) - Math.abs(b.x - m.x)).slice(0, 2);
  near.forEach((o, i) => {
    world.fx.push({ kind: 'tgchain', x: m.x, y: m.y - m.def.h * 0.55, tx: o.x, ty: o.y - o.def.h * 0.55, t: -0.04 * i, dur: 0.3, seed: Math.random() });
    shotHit(world, { pct: Math.max(20, (s.pct ?? 90) * CHAIN_PCT), scale: 100, key: 'procchain', dir: Math.sign(o.x - m.x) || 1, knock: 30, burst: 'tgspark', gauge: 0, quiet: true }, o, 0.04 + 0.04 * i, i);
  });
}
// The static shell (Overcharge): the monster that just hit him (the nearest to where the blow came
// from) is shocked, dazed a moment.
function staticShell(world, fromX) {
  if (!overcharged(world) && !(world.char.buffs.staticguard?.until > world.now)) return;
  if (fromX == null || world.now - (world.shellAt ?? -9) < 0.3) return;
  const m = world.mobs.filter((o) => o.hp > 0 && Math.abs(o.x - fromX) < 70 && Math.abs(o.y - world.body.y) < 120).sort((a, b) => Math.abs(a.x - fromX) - Math.abs(b.x - fromX))[0];
  if (!m) return;
  world.shellAt = world.now;
  world.fx.push({ kind: 'tgchain', x: world.body.x, y: world.body.y - world.body.h * 0.55, tx: m.x, ty: m.y - m.def.h * 0.55, t: 0, dur: 0.3, seed: Math.random() });
  shotHit(world, { pct: SHELL_PCT, scale: 100, key: 'procshell', dir: Math.sign(m.x - world.body.x) || 1, knock: 60, stun: 0.3, burst: 'tgspark', gauge: 0, quiet: true }, m, 0.03, 0);
}
// The endless barrage (the Beastmaster's passive, data/skills.js): while attack is held her basic
// attack goes on and on, faster the longer it's held, building through stages of its own; she can
// walk slowly through it (world.js), and in the air she hangs a moment, then keeps going as she
// falls. Let go after a while and a finisher ends it, stronger the longer she held.
// (No path fights this way now: the Beastmaster's Wild Hunt went with Snow wolf. The engine stays for
// a path that wants it.)
export const BARRAGE_WALK = 0.35;
// How much faster a thief runs (the player's call, 2026-11-16: quick feet).
export const THIEF_FEET = 1.1;
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
export const STREAMS = {};
export const STREAM_MOVES = new Set(Object.values(STREAMS).flatMap((sp) => Object.keys(sp.figures)));
export const streamOf = (world) => STREAMS[pathOf(world)] ?? null;
export function barrageOf(world) {
  const spec = streamOf(world);
  const lv = spec ? world.char.skills[spec.skill] ?? 0 : 0;
  return lv > 0 ? skillAt(spec.skill, lv).barrage : null;
}
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
    world.fx.push({ kind: 'powerup', school: spec.school, x: body.x, y: body.y, t: 0, dur: 0.45, big: stage >= 3 });
    if (stage >= 3) world.juice.push({ type: 'shake', mag: 1, dur: 0.15 });
  }
  run.stage = stage;
  const key = air ? 'basicairstream' : 'basicstream';
  // (Cuts and arrows land in the path's own colour; her stars carry their own.)
  const look = spec.school;
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
  // The Beastmaster's gale of leaves scatters (render/scene.js drawLeafWheel).
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
}
// Heals you and the party members within `r` of (x, y) by `pct` of max HP (a heal, like the
// Paladin's Judgment).
export function healAround(world, x, y, pct, r, gauge = true, el = null) {
  const { char, body, stats } = world;
  // (The Tidecaller's heals mend harder with her Moonsong, and at Spring Tide leave a bubble on
  // everyone they reach.)
  pct *= moonHeal(world) * melodyHeal(world);
  if (gauge) addMelody(world, 6);
  const near = Math.abs(body.x - x) <= r && Math.abs(body.y - y) < 160 && !world.dead;
  if (springTide(world)) {
    if (near) {
      char.buffs.springbubble = { until: world.now + 6, since: world.now, values: { barrier: SPRING_BUBBLE }, name: 'Spring Bubble', shield: Math.round(stats.maxHp * SPRING_BUBBLE) };
    }
    if (world.dungeon) for (const g of groupOf(world)) if (g.id !== 'you' && isUp(world, g) && Math.abs(g.body.x - x) <= r) giveBuff(world, g, 'springbubble', 'Spring Bubble', { barrier: SPRING_BUBBLE }, 6);
  }
  if (near && char.hp < stats.maxHp) {
    const amount = Math.max(1, Math.round(stats.maxHp * pct));
    char.hp = Math.min(stats.maxHp, char.hp + amount);
    world.numbers.push({ x: body.x, y: body.y - body.h - 6, text: `+${amount}`, color: '#7ee0b0', t: 0 });
    // (A Tide Mage's heals build her Tide.)
    if (gauge) addTide(world, 3);
    if (gauge) addMoon(world, 3);
    // (The Cleric's heals land as her own mark: soap bubbles and sparkles rising round them.)
    // (At most one every half second: her heal bombs mend on nearly every hit, and a stack of
    // them reads as a column of crosses.)
    if (char.job !== 'cleric') world.fx.push({ kind: 'healglow', x: body.x, y: body.y, t: 0, dur: 0.7 });
    else if (world.now - (world.healedFxAt ?? -9) >= 0.5) {
      world.healedFxAt = world.now;
      world.fx.push({ kind: 'bbhealed', x: body.x, y: body.y, t: 0, dur: 0.8 });
    }
  }
  if (world.dungeon) healMembers(world, pct, { x: x - r, y: y - 160, w: r * 2, h: 320 });
}
// The thrown stars a gauntlet uses up (one each from the set in your bag).
const STAR_SHOTS = new Set(['star', 'moonstar']);
// A job's own gauge: which one the character has ('volt', 'gale', 'bulwark', 'rage', 'faith',
// 'depth', 'moon' or 'tide'), and how full it is (0-1). Finishers need it full and spend it.
export function gaugeOf(char) {
  return hasVolt(char) ? 'volt' : hasGale(char) ? 'gale' : hasBulwark(char) ? 'bulwark' : hasRage(char) ? 'rage' : hasFaith(char) ? 'faith' : hasDepth(char) ? 'depth' : hasMoon(char) ? 'moon' : hasTide(char) ? 'tide' : hasUmbra(char) ? 'umbra' : hasSpool(char) ? 'spool' : hasMoth(char) ? 'moondust' : hasKindling(char) ? 'kindling' : hasMelody(char) ? 'melody' : hasDaybreak(char) ? 'daybreak' : null;
}
export function gaugeFull(world) {
  const g = gaugeOf(world.char);
  return Boolean(g) && (world[g] ?? 0) >= 100;
}

// What a shot that lands builds on a ranged path's gauge (see world.js).
export function addAim(world, n, mob = null, el = null) {
  addTide(world, n);
  addMoondust(world, n);
  addUmbra(world, n);
  addSpool(world, n);
  addDaybreak(world, n);
  addKindling(world, n, mob);
  addMelody(world, n);
  addDepth(world, n);
  addMoon(world, n);
  if (mob && n > 0) abyssVortex(world, mob);
}
// The path a basic attack fights in: a warrior path with a blade, an archer path with its bow.
export function pathOf(world) {
  const { char } = world;
  const w = world.stats.weaponType;
  if (w === 'dagger' && hasUmbra(char)) return 'eclipse';
  if (w === 'dagger' && hasSpool(char)) return 'silkweaver';
  if (w === 'bow' && hasDaybreak(char)) return 'sunfeather';
  if (w === 'crossbow' && hasKindling(char)) return 'phoenix';
  if (w === 'bow' && hasMelody(char)) return 'songbird';
  if (w === 'dagger' && hasMoth(char)) return 'moonmoth';
  if (MELEE.has(w) && w !== 'none') return hasVolt(char) ? 'warrior' : hasGale(char) ? 'tempest' : hasBulwark(char) ? 'stormwall' : null;
  if (w === 'none') return 'fists';
  if (w === 'staff' && hasDepth(char)) return 'maelstrom';
  if (w === 'staff' && hasMoon(char)) return 'tidecaller';
  if (w === 'staff' && hasTide(char)) return 'tidemage';
  return null;
}

// Rage makes a Berserker's blows hit harder: up to RAGE_POWER more at full Rage.
const RAGE_POWER = 0.25;
const ragePower = (world) => (hasRage(world.char) ? 1 + (RAGE_POWER * (world.rage ?? 0)) / RAGE_MAX : 1);
// How much heavier each path's blows land: longer hit-stop, harder knockback.
const WEIGHT = { berserker: 1.4, paladin: 1.2, overcharge: 1.3 };
// Overcharge (a full Charge) lands the Thunderguard's blows heavier too.
const weightOf = (world) => (hasRage(world.char) ? WEIGHT.berserker : hasFaith(world.char) ? WEIGHT.paladin : overcharged(world) ? WEIGHT.overcharge : 1);
export function addRage(world, n) {
  if (!hasRage(world.char) || n <= 0) return;
  const before = world.rage ?? 0;
  world.rage = Math.min(RAGE_MAX, before + n);
  world.rageAt = world.now;
  if (before < RAGE_MAX && world.rage >= RAGE_MAX) transform(world);
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
    const own = { warrior: STORM_COMMANDS, tempest: RED_COMMANDS, stormwall: WALL_COMMANDS, moonmoth: MOTH_COMMANDS, eclipse: ECL_COMMANDS, silkweaver: SILK_COMMANDS }[pathOf(world)] ?? null;
    const air = own?.air ?? AIR;
    const blades = barrageOf(world);
    if (!body.onGround && !body.rope) {
      if (blades) return barrageThrow(world, blades);
      // (The count starts at nothing until you first land: an attack in the air before that read
      // an empty step and crashed.)
      const i = world.airCombo ?? 0;
      if (i >= air.length) return;
      playStep(world, air[i], 100, `basicair${i}`);
      world.airCombo = i + 1;
      return;
    }
    if (world.intent?.up) {
      playStep(world, own?.up ?? LAUNCHER, 100, 'basiclaunch');
      world.combo = -1;
      return;
    }
    if (world.intent?.down && warriorPath(world.char) && world.stats.weaponType !== 'none') {
      playStep(world, own?.slam ?? SLAM, 100, 'basicslam');
      world.combo = -1;
      return;
    }
    if ((world.runFor ?? 0) >= DASH_AFTER && !(blades && world.barrage)) {
      playStep(world, own?.dash ?? DASH, 100, 'basicdash');
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
    if (!body.onGround && !body.rope && cmd.air.length) {
      if (stream) return barrageThrow(world, stream);
      const i = world.airCombo ?? 0;
      if (i >= cmd.air.length) return;
      playStep(world, cmd.air[i], 100, `basicair${i}`);
      world.airCombo = i + 1;
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
  // (Depth: the Maelstrom hits harder the deeper it runs.)
  scale *= depthPower(world);
  // (Charge: the Thunderguard hits harder the fuller it runs.)
  scale *= voltPower(world);
  const { body, now, stats } = world;
  // Basic swings run a touch quicker than their written timing.
  // Shots need the whole draw and loose, so they hold you a little longer than a cut.
  const ranged = step.strikes.some((s) => s.shot || s.rain);
  const dur = step.dur * (key.startsWith('basic') ? 0.9 : 1) * (1 - Math.min(0.4, stats.attackSpeed ?? 0) * 0.5) * (key.startsWith('basic') ? galeSpeed(world) * daybreakPace(world) : 1);
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
    // A stream of shots (Wild Hunt) goes on with no beat at all.
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
  // (`swing`: Silk Swing carries her on through the air, off the floor.)
  if (dx) world.lunge = { v: (body.facing * dx) / Math.max(0.05, first), until: now + first, air: Boolean(step.swing) };
  if (step.guard) world.invuln = Math.max(world.invuln, step.guard);
  // A dash leaves speed lines and a shock cone along its path.
  // Shield Rush's wall of light, carried before her as she marches.
  if (step.wall) world.fx.push({ kind: 'shieldwall', follow: true, ahead: 22, x: body.x + body.facing * 22, y: body.y, dir: body.facing, t: 0, dur: dur * 0.82 });
  // A blink (Backstab) leaves a puff of smoke where she melts away and another where she steps out.
  if (step.blink) for (const [at, dx] of [[0.11, 0], [0.4, step.step]]) world.fx.push({ kind: 'blinksmoke', x: body.x + body.facing * dx, y: body.y, dir: body.facing, t: -at * dur, dur: 0.7 });
  if (step.trail) world.fx.push({ kind: 'chargetrail', school: school ?? pathSchool(world.char), x: body.x, y: body.y, tx: body.x + body.facing * step.step, dir: body.facing, t: 0, dur: 0.5 });
  // Warrior paths put their weight into big moves: a stomp that kicks up dust as the move starts,
  // and power gathering at the weapon until the first blow lands.
  const heavy = hasVolt(world.char) || hasGale(world.char) || hasBulwark(world.char) || hasRage(world.char) || hasFaith(world.char);
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
    // (`diveAt`: she rises first and only turns over into the dive that far through the move.)
    if (!step.diveAt) body.vy = step.dive;
    world.dive = { strike: { ...step.strikes.find((st) => st.onLand), n: 0, of: 1, dir: body.facing, scale, key, school, finisher: step.finisher, move: step.move, dur, at: 1 }, from: step.diveAt ? now + step.diveAt * dur : 0, speed: step.dive, until: now + (step.diveAt ?? 0) * dur + 1.2 };
  }
  // High Tide (full Tide): every basic attack sends a little wave rolling after it. And her waves
  // run bigger the fuller the Tide (`swell`, drawn and hit alike).
  if (hasTide(world.char) && step.strikes.some((s) => s.magic)) {
    const swell = tideSwell(world);
    step = { ...step, strikes: step.strikes.map((s) => (s.shot === 'tmwave' || s.shot === 'tmwavebig' ? { ...s, swell, h: Math.round((s.h ?? 60) * swell) } : s)) };
    if (highTide(world) && key.startsWith('basic') && !step.hang) {
      const last = Math.max(...step.strikes.map((s) => s.at));
      step = { ...step, strikes: [...step.strikes, { ...TIDE_SHOT, at: Math.min(0.95, last + 0.1), shot: 'tmwave', pct: 35, range: 260, h: 60, targets: 3, pierce: true, knock: 40, speed: 560, gauge: 0, swell: 0.7, quiet: true }] };
    }
  }
  // Moth Step: between `moths` (0-1 of the move) she is a cloud of moths flying on ahead (drawn
  // hidden, render/scene.js), re-forming where the step carries her.
  if (step.hide) world.vanish = { since: now + step.hide[0] * dur, until: now + step.hide[1] * dur };
  if (step.moths) {
    const [m0, m1] = step.moths;
    world.vanish = { since: now + m0 * dur, until: now + m1 * dur };
    const run = Math.min(1, m1 / (step.carry ?? timed[0]?.at ?? 1));
    world.fx.push({ kind: step.flight ?? 'mmflight', x: body.x, y: body.y, tx: body.x + body.facing * (step.step ?? 0) * run, dir: body.facing, t: -m0 * dur, dur: (m1 - m0) * dur + 0.08, seed: Math.random() });
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
  if (b.onGround || b.rope) world.flutterUsed = false;
  if (world.rage > 0 && world.now - (world.rageAt ?? 0) > RAGE_HOLD && !inForm(world)) world.rage = Math.max(0, world.rage - RAGE_DRAIN * dt);
  if (world.faith > 0 && world.now - (world.faithAt ?? 0) > FAITH_HOLD && !inForm(world)) world.faith = Math.max(0, world.faith - FAITH_DRAIN * dt);
  tickTide(world, dt);
  tickMoondust(world, dt);
  tickUmbra(world, dt);
  tickSpool(world, dt);
  tickDaybreak(world, dt);
  tickKindling(world, dt);
  tickMelody(world, dt);
  tickSmoulder(world);
  tickLure(world);
  tickDepth(world, dt);
  tickMoon(world, dt);
  if (world.volt > 0 && world.now - (world.voltAt ?? 0) > VOLT_HOLD) world.volt = Math.max(0, world.volt - VOLT_DRAIN * dt);
  if (world.gale > 0 && world.now - (world.galeAt ?? 0) > GALE_HOLD) world.gale = Math.max(0, world.gale - GALE_DRAIN * dt);
  if (world.bulwark > 0 && world.now - (world.bulwarkAt ?? 0) > BULWARK_HOLD) world.bulwark = Math.max(0, world.bulwark - BULWARK_DRAIN * dt);
  tickEye(world, dt);
  if (world.dead) {
    world.strikes.length = 0;
    world.lunge = null;
    return;
  }
  if (world.lunge) {
    if (world.now >= world.lunge.until || (!b.onGround && !world.lunge.air)) world.lunge = null;
    else b.x = Math.max(b.w / 2, Math.min(world.map.width - b.w / 2, b.x + world.lunge.v * dt));
  }
  // Air cuts hold you up; landing ends the air combo, and a dive lands its blow on touchdown.
  if (!b.onGround && world.now < (world.hangUntil ?? 0)) b.vy = Math.min(b.vy, HANG_FALL);
  if (b.onGround || b.rope) world.airCombo = 0;
  if (world.dive && world.now < world.dive.from) {
    // (Still rising into it.)
  } else if (world.dive) {
    if (world.dive.from && !world.dive.fired) {
      world.dive.fired = true;
      b.vy = world.dive.speed;
      world.hangUntil = 0;
    }
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
  if (s.rain) return rain(world, s);
  if (s.shot) return fire(world, s);
  if (s.behind) s = shadowBehind(world, s);
  if (s.lure) return setLure(world, s);
  // A form reaches farther: every cut grows by FORM_REACH (once, not again for its echo).
  if (inForm(world) && !s.formGrown) s = { ...s, reach: s.reach * FORM_REACH, h: s.h * FORM_HEIGHT, formGrown: true };
  const range = s.around ? { w: s.reach * 2, h: s.h, around: true } : { w: s.reach, h: s.h };
  const targets = s.only ? (s.only.hp > 0 ? [s.only] : []) : s.reel ? reelTargets(world, s) : pickTargets(world.mobs, body, range, s.targets ?? 1);
  if (s.feint) return feint(world, s, targets);
  // (Moonspun Cocoon: her threads shooting out to every monster it catches.)
  if (s.lines && targets.length) world.fx.push({ kind: 'svreel', out: true, x: body.x, y: body.y, mobs: targets, dir: s.dir, t: 0, dur: 0.5 });
  const acc = accuracy(JOBS[char.job].family, stats, char.level);
  const weight = weightOf(world);
  // A finisher hits harder the fewer it catches: double on one, half again on two (its whole
  // gauge goes into them), so it pays on a lone boss as well as a crowd.
  const focus = SKILLS[s.key]?.fullGauge ? FOCUS[Math.min(targets.length, FOCUS.length - 1)] : 1;
  const tune = tuneOf(s.key) * focus;
  // ...and it feels it: its big blow, a whole gauge into one or two, lands with a heavier stop and shake.
  if (focus > 1 && (s.stop ?? 0) >= 0.1) s = { ...s, stop: Math.max(s.stop ?? 0, 0.1 + 0.04 * focus), shake: Math.max(s.shake ?? 0, 3 + 2 * focus) };
  const power = ragePower(world);
  const dmgRange = s.magic ? magicRange(stats, (s.pct * s.scale * tune) / 100) : physicalRange(stats, stats.weaponType, (s.pct * s.scale * power * tune) / 100);
  const cy = body.y - body.h / 2;
  // The smear, spike, or whirl of the blow. (The Thunderguard's and the Tempest's thrusts draw their
  // own streaks of lightning, so the old steel spike and its star burst stay off them.)
  if (s.pierce && !hasVolt(char) && !hasGale(char) && !hasBulwark(char)) {
    const x = s.dir > 0 ? body.x - 6 : body.x + 6 - s.reach;
    world.fx.push({ kind: 'pierce', school: s.school ? schoolFor(char, s.school) : pathSchool(char), x: body.x, y: body.y, dir: s.dir, box: { x, y: cy - 10, w: s.reach, h: 20 }, t: 0, dur: s.big ? 0.35 : 0.25, move: s.move, at: s.at, moveDur: s.dur, hit: s.hit, fin: s.finisher });
  }
  if (s.arc) {
    world.fx.push({ kind: 'arc', weapon: world.stats.weaponType, snd: s.school ? schoolFor(char, s.school) : undefined, path: hasRage(char) ? 'rage' : hasFaith(char) ? 'holy' : hasVolt(char) ? 'thunder' : hasGale(char) ? 'redstorm' : hasBulwark(char) ? 'indigo' : null, x: body.x + s.dir * (s.around ? 0 : 10), y: cy - 2, bx: body.x, by: body.y, move: s.move, at: s.at, moveDur: s.dur, hit: s.hit, fin: s.finisher, dir: s.dir, r: s.around ? s.reach * 0.8 : s.reach * 0.52, start: s.arc[0], sweep: s.arc[1], thick: s.thick ?? 7, big: s.big, flat: s.around, color: TINTS[s.school]?.[s.big ? 1 : 0] ?? (s.big ? HEAVY : BLADE), element: s.key.startsWith('basic') ? weaponElement(char) : null, t: 0, dur: s.big ? 0.32 : 0.24 });
  }

  if (s.crack) {
    world.fx.push({ kind: 'crack', school: s.school ? schoolFor(char, s.school) : pathSchool(char), x: body.x + s.dir * s.reach * 0.55, y: body.y, w: s.around ? s.reach * 2 : s.reach * 1.4, t: 0, dur: 0.7, seed: Math.random() });
    world.juice.push({ type: 'slam', school: s.school ? schoolFor(char, s.school) : pathSchool(char), x: body.x + s.dir * s.reach * 0.5, y: body.y, range: s.reach });
  }
  if (s.burst) {
    // (`floor`: on the ground she took off from, for the Sky Dancer's tornado while she's up in the air.)
    world.fx.push({ kind: s.burst, school: s.school, x: body.x + s.dir * s.reach * (s.burstAt ?? (s.around ? 0.3 : 0.45)), y: s.floor && !body.onGround ? world.skyFloor ?? body.y : body.y, r: s.reach, dir: s.dir, t: 0, dur: s.burstDur ?? 0.7, seed: Math.random(), follow: s.follow || undefined });
  }
  // A support skill lands with the cast: a buff on her and the party round her (`grant`).
  if (s.grant) grantSpell(world, s.grant);
  // Tide's Return and Moon Tide bring the fallen round her back up.
  if (s.revive) reviveAround(world, s.revive, s.reviveR ?? 320);
  let crits = 0;
  let sly = 0;
  let tied = 0;
  targets.forEach((m, i) => {
    const miss = Math.random() >= hitChance(acc, char.level, m.def);
    // (At Totality every blow is a crit.)
    let roll = miss ? null : rollHit(dmgRange, critStats(world, stats, m), m.def, char.level, Math.random, s.crit || totality(world) ? 1 : 0);
    // A backstab hits harder on a monster that isn't facing you.
    const behind = Math.sign(m.dir || 1) === Math.sign(m.x - body.x);
    // (A monster her Wing Feint turned round takes every blow from behind as a backstab.)
    const stab = s.backstab ?? (m.feintUntil > now ? FEINT_STAB : 0);
    if (roll && stab && behind) roll = { ...roll, damage: Math.round(roll.damage * stab), crit: true };
    // (The Eclipse: a backstab or a marked monster builds Umbra twice as fast; Umbral Edge spends
    // the marks for a much harder blow.)
    const marked = marksOf(world, m);
    if (!miss && ((stab && behind) || marked)) sly++;
    if (roll && s.consume && marked) {
      roll = { ...roll, damage: Math.round(roll.damage * (1 + s.consume * marked)), crit: true };
      clearMarks(m);
      world.fx.push({ kind: 'ecpop', school: 'eclipse', x: m.x, y: m.y, h: m.def.h, mob: m, n: marked, dir: s.dir, t: 0, dur: 0.6, seed: Math.random() });
    }
    if (!miss && s.mark) addMark(world, m, s.mark);
    if (!miss && s.dazzle) dazzle(world, m, s.dazzle, s.look ?? thiefLook(char));
    // (The Silkweaver: a cocoon takes her blows harder; Reel In hauls harder for every thread; a
    // threaded or cocooned monster builds Spool half again faster.)
    const wrapped = cocooned(world, m);
    const held = threadsOf(world, m);
    if (roll && wrapped) roll = { ...roll, damage: Math.round(roll.damage * (1 + COCOON_HURT)) };
    if (roll && s.reel) roll = { ...roll, damage: Math.round(roll.damage * (1 + s.reel * (wrapped ? THREAD_MAX : held))) };
    if (!miss && (wrapped || held)) tied++;
    // (Reel In hauls each one in on its thread to just in front of her, nearest first.)
    if (!miss && s.reel && !m.def.boss) yank(m, body.x + s.dir * (22 + (m.def.w ?? 30) / 2 + i * 14), 0.04 + i * 0.03);
    if (!miss && s.unwrap && wrapped) unwrapCocoon(world, m, i);
    else if (!miss && (s.thread || (fullSpool(world) && !s.phantom))) addThread(world, m, s.thread ?? 1);
    const knock = s.pull ? -Math.sign(m.x - body.x) * s.pull : s.knock * weight;
    world.pending.push({
      at: now, mob: m, miss, damage: roll?.damage ?? 0, crit: roll?.crit ?? false, fromX: body.x, stack: s.n % 3, knock, launch: s.launch, big: s.big, small: s.around && !s.big,
      stun: miss ? undefined : s.stun, freeze: miss ? undefined : s.freeze, bleed: miss ? undefined : s.bleed, burn: miss ? undefined : s.burn, burnLook: s.burnLook, school: s.school, via: s.via ?? 'blade', weapon: stats.weaponType, gauge: s.gauge, el: s.el, rxAll: miss ? undefined : s.rxAll,
    });
    if (roll?.crit) crits++;
    // (`mob`: a mark that rides on the monster it hit, knocked back or thrown up, never left behind.)
    if (s.fx) world.fx.push({ kind: s.fx, school: s.school, x: m.x, y: m.y, h: m.def.h, mob: m, dir: s.dir, t: -i * 0.03, dur: 0.6, seed: Math.random() });
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
  if (s.key.startsWith('basic') && !s.phantom && hasGale(char)) galeEcho(world, s);
  // A flash-step finisher (and every finisher at Lightspeed): he blinks through to the far side.
  if (!s.phantom && hasGale(char) && (s.blink || (lightspeed(world) && s.finisher && s.key.startsWith('basic')))) blinkThrough(world, s, s.blink || 160);
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
  // (A finisher's heal, built to build nothing (`gauge: 0`), doesn't refill the gauge it spent.)
  if (s.heal) healAround(world, body.x, body.y, s.heal, s.healR ?? 220, s.gauge !== 0, s.el);
  // (Charge builds faster the more monsters a blow catches: half again for each extra one.)
  if (targets.length && !s.phantom) addVolt(world, (s.gauge ?? (s.key.startsWith('basic') ? 3 : 4)) * (1 + 0.5 * (targets.length - 1)));
  if (targets.length && hasVolt(char)) targets.forEach((m) => chainBolt(world, m, s));
  // (Velocity builds fast: a third again for each extra monster a blow catches.)
  // (Thunderhead: a little from his blows, more from holding them on him.)
  if (targets.length && !s.phantom) addBulwark(world, (s.gauge ?? 2) + (s.provoke ? 6 : 0));
  if (targets.length && !s.phantom && s.key !== 'procecho') addGale(world, (s.gauge ?? (s.key.startsWith('basic') ? 5 : 4)) * (1 + 0.3 * (targets.length - 1)));
  if (targets.length) addFaith(world, s.faith ?? (s.key.startsWith('basic') ? 2 : 4));
  if (targets.length && !s.phantom) addTide(world, (s.gauge ?? (s.key.startsWith('basic') ? 3 : 4)) * (1 + 0.3 * (targets.length - 1)));
  if (targets.length && !s.phantom) addMoondust(world, (s.gauge ?? (s.key.startsWith('basic') ? 3 : 4)) * (1 + 0.3 * (targets.length - 1)));
  if (targets.length && !s.phantom) addUmbra(world, (s.gauge ?? (s.key.startsWith('basic') ? 3 : 4)) * (1 + 0.3 * (targets.length - 1) + sly / targets.length));
  if (targets.length && !s.phantom) addKindling(world, (s.gauge ?? 4) * (1 + 0.3 * (targets.length - 1)), targets[0]);
  if (targets.length && !s.phantom) addSpool(world, (s.gauge ?? (s.key.startsWith('basic') ? 3 : 4)) * (1 + 0.3 * (targets.length - 1) + (0.5 * tied) / targets.length));
  if (s.detonateAll) detonateMarks(world, s);
  if (s.key.startsWith('basic') && !s.phantom) moonNip(world, targets, s);
  if (targets.length && !s.phantom) addDepth(world, (s.gauge ?? (s.key.startsWith('basic') ? 3 : 4)) * (1 + 0.3 * (targets.length - 1)));
  if (targets.length && hasDepth(char)) targets.forEach((m) => abyssVortex(world, m));
  if (targets.length && !s.phantom) addMoon(world, (s.gauge ?? (s.key.startsWith('basic') ? 3 : 4)) * (1 + 0.3 * (targets.length - 1)));
  if (targets.length && s.key.startsWith('basic')) springDrop(world);
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
// data/skills.js). Any swing may rush on into extra blows: Aegis Smite's pillar of light (Paladin),
// Ravage's bleeding cleaves (Berserker). (The Thunderguard's skills are all his to press.) Proc
// strikes aren't basic swings, so they never set off procs.

// The fields every proc strike shares: aimed the way the swing was, never turning you round.
const procStrike = (world, s, key, delay, fields) => ({
  at: s.at, due: world.now + delay, n: 0, of: 1, dir: s.dir, scale: 100, key, move: s.move, dur: s.dur, finisher: false, quiet: true, keepFacing: true, ...fields,
});

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
  for (const [id, strikes] of [['aegissmite', smiteStrikes], ['ravage', ravageStrikes]]) {
    const p = procOf(char, id);
    if (p && rng() < p.chance) strikes(world, s, p);
  }
  // Only the ground combo's own finisher flows on (not a dive, a slam, or a dash).
  if (!s.finisher || !/^basic\d$/.test(s.key)) return;
  const judgment = procOf(char, 'judgment');
  if (judgment && (world.faith ?? 0) >= FAITH_MAX) judgmentRain(world, s, judgment);
}

// A proc's own move, a beat after the blow that set it off (on the ground, and still standing).
function playQueued(world) {
  const q = world.queuedStep;
  if (!q || world.now < q.at) return;
  world.queuedStep = null;
  if (world.dead || !world.body.onGround) return;
  playStep(world, q.step, 100, q.key, q.school ?? pathSchool(world.char), AFTER.finisher);
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
  const extraCrit = sure || totality(world) ? 1 : 0;
  const range = s.magic ? magicRange(stats, (s.pct * s.scale * tuneOf(s.key)) / 100) : physicalRange(stats, stats.weaponType, (s.pct * s.scale * tuneOf(s.key)) / 100);
  const rolled = miss ? null : rollHit(range, critStats(world, stats, m), m.def, char.level, Math.random, extraCrit);
  const roll = rolled && cocooned(world, m) ? { ...rolled, damage: Math.round(rolled.damage * (1 + COCOON_HURT)) } : rolled;
  world.pending.push({
    at: world.now + delay, mob: m, miss, damage: roll?.damage ?? 0, crit: roll?.crit ?? false, fromX: s.fromX ?? body.x, stack, knock: s.knock, launch: s.launch, big: s.big, stop: s.stop, shake: s.shake, element,
    via: s.shot ?? (s.rain ? 'rain' : undefined), stun: miss ? undefined : s.stun, burn: miss ? undefined : s.burn, freeze: miss ? undefined : s.freeze, burst: s.burst, dir: s.dir,
    gauge: s.gauge ?? (s.key.startsWith('basic') ? 3 : 5), rank, el: s.el, mend: miss ? undefined : s.mend, basic: s.key.startsWith('basic') || undefined, mark: miss ? undefined : s.mark,
    thread: miss ? undefined : s.thread ?? (fullSpool(world) && !s.phantom ? 1 : undefined), pin: miss ? undefined : s.pin, sleep: miss ? undefined : s.sleep, burnLook: s.burnLook, pinLook: s.pinLook,
    smoulder: miss || !s.smoulder ? undefined : { ...s.smoulder, scale: s.scale ?? 100, key: s.key },
  });
}

// A support skill's buff as it lands: on her, and on the party in `range` (applyBuff does both for
// a `party` skill).
function grantSpell(world, g) {
  if (world.dead) return;
  applyBuff(world, g.id, { duration: g.duration, buff: g.buff, range: g.range });
}


// Where the wand's tip is (from her feet, facing right) at the moment a shot leaves it; null where
// the figure can't be worked out (no drawing, as in the tests' bare worlds).
function wandTip(world, s) {
  try {
    return strikePose(world.char.appearance, wornGear(world.char), s.move, s.at, s.dur, 1, 1, { hit: s.hit, fin: s.finisher })?.tip ?? null;
  } catch {
    return null;
  }
}

// A shot (or a fan of them, or one that pierces a line) leaves the bow or hand.
function fire(world, strike) {
  // (Blaze, a full Kindling: every bolt bursts where it lands, catching those beside it.)
  if (!strike.phantom && !strike.blast && blaze(world)) strike = { ...strike, blast: 70, blastFx: 'phburst' };
  // (Sunrise, a full Daybreak: every basic shot fans two small light arrows off it.)
  if (strike.key?.startsWith('basic') && !strike.phantom && sunrise(world)) fire(world, { ...strike, shot: 'sfmini', pct: strike.pct * 0.4, fan: 2, pierce: false, targets: 2, phantom: true, big: false, stop: 0, shake: 0, blast: 0, burst: 'sfhit', gauge: 0, oy: (strike.oy ?? 0) - 4, lag: 0.05 });
  // (A shot that mends as it goes, the Great Wave: you and the party round you, as it breaks.)
  if (strike.heal && !strike.split) healAround(world, world.body.x, world.body.y, strike.heal, strike.healR ?? 220, true);
  let s = strike;
  const { body } = world;
  // A gauntlet throws its own stars (their look and element).
  const star = STAR_SHOTS.has(s.shot) && !s.phantom && !s.free ? thrownStars(world.char) : null;
  // Shots leave from the bow hand (chest high), lifted with the pose (a backflip is mid-air).
  // (A copy's arrow leaves from where the copy stands.)
  let ox = (s.from?.x ?? body.x) + s.dir * 10;
  let oy = (s.from?.y ?? body.y) - HAND_Y - (moveAt(s.move, s.at, s.dur)?.lift ?? 0) + (s.oy ?? 0);
  // A wand's spell leaves its tip, where the pose points it at the moment it's cast (not her chest).
  // (Worked out exactly as the figure is drawn, render/hero.js `strikePose`.)
  // (The Maelstrom's spears and bolts leave from her hands, chest high: off a raised staff's head
  // they'd fly down at a slant.)
  const tip = !s.from && s.move && (world.stats.weaponType === 'wand' || (world.stats.weaponType === 'staff' && !hasDepth(world.char) && !hasMoon(world.char))) && world.char.appearance ? wandTip(world, s) : null;
  if (tip) {
    ox = body.x + s.dir * tip[0];
    oy = body.y + tip[1] + (s.oy ?? 0);
  }
  // Wild Hunt's arrows peel off the leaf swinging round toward them.
  if (s.leaf && world.barrage) {
    const run = world.barrage;
    const wisp = launchWisp(run.heat, world.now - run.since, s.dir, false);
    ox = body.x + wisp.x;
    oy = body.y + wisp.y;
    world.fx.push({ kind: 'leaflaunch', x: ox, y: oy, dir: s.dir, t: 0, dur: 0.25 });
  }
  // A recoiling shot kicks you back (`recoil` in the air hops you up; `kickback` shoves you on
  // the ground), and some burst at the bow as they go (`muzzle`).
  if (s.recoil) body.vy = Math.min(body.vy, -s.recoil);
  if (s.kickback && body.onGround) world.lunge = { v: (-s.dir * s.kickback) / 0.14, until: world.now + 0.14 };
  if (s.muzzle) world.fx.push({ kind: s.muzzle, school: s.school, x: ox, y: oy, dir: s.dir, t: 0, dur: 0.6, seed: Math.random() });
  const speed = s.speed ?? 680;
  const box = { w: s.range, h: s.h ?? 60 };
  const element = star?.element ?? (s.key.startsWith('basic') ? weaponElement(world.char) : null);
  // A twin arrow trails its first a beat behind (`lag`).
  const lag = s.lag ?? 0;
  // A shot aimed at a monster follows it in flight (`mob`; see world.js): it homes in on where the
  // monster is now, and a piercing one keeps its line through it out to `reach`.
  const fly = (tx, ty, mob = null, reach = 0) => {
    const travel = Math.max(0.06, Math.hypot(tx - ox, ty - oy) / speed);
    world.fx.push({ kind: 'projectile', weapon: world.stats.weaponType, shot: s.shot, swell: s.swell, floorY: s.shot?.startsWith('tmwave') || s.shot === 'tmgreat' || s.shot === 'msblackwave' || s.shot === 'msblacktide' || s.shot === 'tcsilverwave' || s.shot === 'tcsilvertide' ? body.y : undefined, school: s.school, element, starColor: star?.color, bend: s.lob ? -s.lob * s.dir : s.bend, illusion: s.illusion, phantom: s.phantom, x: ox, y: oy, tx, ty, mob, reach, t: -lag, dur: travel });
    return travel + lag;
  };
  // A little snap of the string (or flick of the wrist) as it goes; a heavy shot kicks back.
  // (The Tide Mage's water carries its own splash: no flash off her staff.)
  if (!hasTide(world.char) && !hasDepth(world.char) && !hasMoon(world.char) && !hasMoth(world.char) && !hasUmbra(world.char) && !hasSpool(world.char) && !sunLine(world.char)) world.fx.push({ kind: 'spark', x: ox, y: oy, t: 0, dur: 0.16, muzzle: true });
  // Heavy shots kick the view back (research/archery.md 37).
  if (s.big) world.juice.push({ type: 'kick', x: -s.dir * 2, y: 0 });
  // Shots aimed up or down (`lift`, `drop`) look for monsters above or below you.
  if (s.lift || s.drop) box.dy = (s.drop ?? 0) - (s.lift ?? 0);
  // A finisher shot that finds a mark opens a Link too (see land).
  if (s.finisher && pickTargets(world.mobs, body, box, 1).length) world.finisherAt = { at: world.now, key: s.key };
  if (s.pierce) {
    const line = pickTargets(world.mobs, body, box, s.targets ?? 1);
    // It flies at the first monster in its line (up or down to it, from the air or onto a slope)
    // and on through, out to its full range; each one it passes is hit as the bolt gets there.
    const first = line[0];
    let aim = first ? Math.atan2(first.y - (first.air ?? 0) - first.def.h / 2 - oy, first.x - ox) : s.dir > 0 ? 0 : Math.PI;
    // A level shot keeps close to level (it may tip to meet a monster a little above or below, never
    // dive steeply because she loosed it from the top of a jump); a shot aimed up or down keeps its
    // aim.
    if (!s.drop && !s.lift) {
      const level = s.dir > 0 ? 0 : Math.PI;
      const off = Math.atan2(Math.sin(aim - level), Math.cos(aim - level));
      aim = level + Math.max(-PIERCE_TIP, Math.min(PIERCE_TIP, off));
    }
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
    let len = Math.max(s.range, first ? Math.hypot(first.x - ox, first.y - oy) + 60 : 0);
    // (Tipped downward it ends at the floor under the line, never flying on into the ground.)
    if (uy > 0.02) len = Math.min(len, Math.max(40, (groundAt(world.map, ox + ux * len) - 4 - oy) / uy));
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


// How far a level piercing shot may tip toward a monster above or below its line (radians).
const PIERCE_TIP = 0.28;

// Arrows rain down on the monsters in an area ahead, one after another.
function rain(world, s) {
  const { body } = world;
  // `around` rains on both sides of you at once.
  const x0 = s.around ? body.x - s.rainW / 2 : s.dir > 0 ? body.x + s.rainFrom : body.x - s.rainFrom - s.rainW;
  const area = world.mobs.filter((m) => m.hp > 0 && m.x >= x0 && m.x <= x0 + s.rainW && Math.abs(m.y - body.y) < 120);
  // (`rainCap`: no monster takes more than that many; the rest fall on open ground.)
  for (let k = 0; k < s.rain; k++) {
    const delay = 0.12 + (k * s.span) / s.rain;
    const m = area.length && !(s.rainCap && k >= s.rainCap * area.length) ? area[k % area.length] : null;
    const x = m ? m.x + ((k * 13) % 17) - 8 : x0 + ((k * 37) % s.rainW);
    world.fx.push({ kind: s.rainFx ?? 'rain', variant: s.variant ?? 'arrow', school: s.school ?? 'wind', x, y: m ? m.y : body.y, h: m ? m.def.h : 20, dir: s.dir, t: -delay, dur: 0.45, seed: k });
    if (m) shotHit(world, s, m, delay + 0.18, k % 3);
  }
}

// The command moves a character of this job would play (up + attack, in the air, on the run), for
// the bots that fight with them (world/botfight.js): the same moves you get, never someone else's.
export function commandsOf(char, weaponType) {
  const path = pathOf({ char, stats: { weaponType } });
  if (ARCHER_COMMANDS[path]) return ARCHER_COMMANDS[path];
  if (!MELEE.has(weaponType)) return null;
  const own = { warrior: STORM_COMMANDS, tempest: RED_COMMANDS, stormwall: WALL_COMMANDS }[path] ?? null;
  const dash = own?.dash ?? DASH;
  return { up: own?.up ?? LAUNCHER, air: own?.air ?? AIR, dash };
}

// The procs a bot's basic swing or shot sets off, the same ones yours do (Blade Rush, Aegis Smite,
// Ravage, Ribbon Lash, Gust Line, Whirlwind; Blast and Snare Arrow and the rest): `s` is the
// swing's (or shot's) strike, `count` how many it caught. Returns { strikes } (extra blows, `due`
// seconds after the swing's strike), { step } (a move that flows on, like the Whirlwind), or
// { shot } (the shot as it flies, maybe a Blast Arrow).
export function botProcs(char, weaponType, s, finisher, count, rng = Math.random) {
  const world = { now: 0, strikes: [], char, stats: { weaponType }, faith: 0, body: { x: 0, facing: 1 } };
  const key = finisher ? 'basic2' : 'basic0';
  if (s.shot) return { shot: { ...s, key, finisher } };
  bladeProcs(world, { ...s, dir: 1, scale: 100, key, finisher }, count, rng);
  return { strikes: world.strikes, step: world.queuedStep?.step ?? null };
}
