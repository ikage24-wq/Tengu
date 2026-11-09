// Every sound effect as data for the synthesizer (synth.js): recorded effects (all CC0) and
// recorded instruments layered with synth sweeps, thumps and sparkles, the same "real plus modern"
// mix as the music. Units: Hz, ms, octaves per second (slide), dB. Each recipe:
// { layers, db (peak level once normalized), vary (± % random pitch per play), max (voices at
// once), gap (ms: repeats closer than this play once; 35 by default), duck: [dB the music dips,
// ms], room (a little of the short room) }.
//
// Layer kinds: { rec: 'punch', rate } a recording; { seq: 'G4:70 C5+E5:300', inst | synth } written
// notes; { drum: 'K' } a drum hit; anything else is a synth layer (synth.js). See
// docs/audio/README.md for the rules (jingles after research-japanese.md, Part 5).

import { RECORDED } from './recorded.js';
import { VOICE_FAMILIES } from './voices.js';

const N = { C5: 523 };
// A whoosh: noise swept through a band, rising then falling (`focus` is where it peaks).
const whoosh = (len, from, to, o = {}) => ({ wave: 'noise', len, env: { bell: true, focus: o.focus ?? 0.55 }, hpf: [from * 0.7, to * 0.7], lpf: [from, to, o.q ?? 1.3], db: o.db ?? 0, at: o.at ?? 0 });
// A thump: a sine body dropping fast (the weight of a blow).
const thump = (f, d, o = {}) => ({ wave: 'sine', f0: f, slide: o.slide ?? -3, env: { s: o.s ?? 10, d, punch: 0.5 }, db: o.db ?? 0, at: o.at ?? 0 });
// A sparkle: quick bell notes.
const sparkle = (notes, o = {}) => ({ seq: notes, synth: 'bell', db: o.db ?? -8, at: o.at ?? 0, tail: 1300 });

const R = {
  // ---------- Loot and progress ----------
  // Coins: real coins, and a bright two-note chime (stepped up for coins in a row, in sfx.js).
  coin: { db: -14, gap: 50, max: 3, layers: [{ rec: 'coins2', len: 350 }, { seq: 'A6:40 E7:120', synth: 'pluck', cut: 6000, ring: 0.12, db: -8, tail: 150 }] },
  pickup: { db: -15, max: 3, layers: [{ rec: 'leather', len: 220 }, { seq: 'E6:40 A6:90', synth: 'pluck', cut: 5000, ring: 0.1, db: -8, tail: 120 }] },
  // ---------- Moving ----------
  jump: { db: -20, vary: 4, max: 1, layers: [{ rec: 'cloth', len: 160, db: -2 }, whoosh(120, 900, 2400, { db: -8 })] },
  land: { db: -19, vary: 6, max: 1, layers: [{ rec: 'soft', rate: 1.1, len: 160 }, thump(130, 60, { db: -8 })] },
  landHard: { db: -14, vary: 5, max: 1, layers: [{ rec: 'softHeavy', len: 300 }, thump(90, 160, { db: -4 }), { rec: 'wood', rate: 0.8, len: 200, db: -8 }] },
  stepGrass: { db: -25, vary: 8, max: 2, layers: [{ rec: 'stepGrass' }] },
  stepStone: { db: -25, vary: 8, max: 2, layers: [{ rec: 'stepStone' }] },
  stepWood: { db: -24, vary: 8, max: 2, layers: [{ rec: 'stepWood' }] },
  stepSand: { db: -25, vary: 10, max: 2, layers: [{ rec: 'stepSnow', rate: 1.15 }] },
  stepCloud: { db: -27, vary: 8, max: 2, layers: [{ rec: 'stepCarpet', rate: 0.9 }] },
  stepCrystal: { db: -24, vary: 6, max: 2, layers: [{ rec: 'stepStone' }, { rec: 'glass', rate: 1.6, len: 120, db: -16 }] },
  climb: { db: -24, vary: 8, max: 1, layers: [{ rec: 'leather', rate: 0.9, len: 140 }] },
  portal: { db: -15, max: 1, room: true, layers: [{ rec: 'teleIn' }, { seq: 'C6:60 E6:60 G6:60 C7:300', inst: 'celesta', db: -8 }] },
  dash: { db: -17, vary: 5, max: 1, layers: [{ rec: 'windWhoosh', len: 600 }] },
  blink: { db: -15, max: 1, room: true, layers: [{ rec: 'teleOut', len: 800 }, sparkle('G6:30 C7:30 E7:150', { at: 40, db: -10 })] },
  // Furniture set down (ui/decorate.js): a soft wooden knock and a little settle.
  furnPlace: { db: -16, vary: 6, max: 2, layers: [{ rec: 'wood', rate: 1.2, len: 160 }, thump(160, 70, { db: -10 }), { rec: 'soft', rate: 1.3, len: 120, db: -8, at: 60 }] },
  // ---------- Mounts (world/mount.js) ----------
  // Getting on: a soft poof and a little rising chime; off: the poof and the chime falling.
  mountOn: { db: -16, max: 1, layers: [{ rec: 'soft', rate: 1.2, len: 220 }, whoosh(260, 500, 2200, { focus: 0.3, db: -10 }), sparkle('C6:45 E6:45 G6:45 C7:260', { db: -11 })] },
  mountOff: { db: -17, max: 1, layers: [{ rec: 'soft', rate: 1.05, len: 220 }, whoosh(240, 1800, 500, { focus: 0.3, db: -12 }), sparkle('G6:45 E6:45 C6:200', { db: -13 })] },
  // Puff Bun: a marshmallow boing.
  bunHop: { db: -21, vary: 7, max: 1, layers: [{ rec: 'slime', rate: 1.5, len: 170 }, { wave: 'sine', f0: 300, slide: 1.4, env: { a: 3, s: 30, d: 90 }, db: -10 }] },
  // Paper Crane: a crisp flap of paper, and a soft rush as it settles into a glide.
  craneFlap: { db: -22, vary: 8, max: 1, layers: [{ rec: 'bookFlip', rate: 1.35, len: 130 }] },
  craneGlide: { db: -21, max: 1, layers: [whoosh(700, 600, 1600, { focus: 0.25, db: -2 }), { rec: 'bookFlip', rate: 1.1, len: 140, db: -6 }] },
  // Nimbus: a soft cloudy puff.
  nimbusPuff: { db: -24, vary: 6, max: 1, layers: [whoosh(260, 300, 1100, { focus: 0.35 })] },
  // Kettle Racer: the lid's rattle, and its whistle on a steam dash.
  kettleRattle: { db: -25, vary: 10, max: 1, layers: [{ rec: 'metalClick', rate: 1.3, len: 90 }] },
  kettleWhistle: { db: -18, max: 1, layers: [{ wave: 'sine', f0: 1500, slide: 0.35, env: { a: 30, s: 260, d: 160 }, overtones: [2, 0.15], db: -6 }, whoosh(420, 900, 3200, { focus: 0.3, db: -8 })] },
  // Shell Skipper: a heavy little plod on land, a splash in the water.
  turtleStep: { db: -24, vary: 8, max: 1, layers: [{ rec: 'soft', rate: 0.8, len: 140 }, thump(110, 70, { db: -10 })] },
  turtleSplash: { db: -21, vary: 8, max: 1, layers: [{ rec: 'splash', rate: 1.2, len: 220 }] },
  // Ivy Gecko: quick little pattering feet.
  geckoPatter: { db: -27, vary: 12, max: 2, layers: [{ rec: 'tick', rate: 0.75, len: 60 }] },
  // ---------- Swings and blows ----------
  // A swing: a swept whoosh with a recorded blade's edge in it; heavier swings are lower and longer.
  // Swings, by weapon (sfx.js picks them); every take peaks about 0.06 s in.
  swing: { db: -15, vary: 4, max: 3, layers: [{ rec: 'swingSword' }, whoosh(150, 2400, 1000, { focus: 0.35, db: -14 })] },
  swingHeavy: { db: -13, vary: 4, max: 2, layers: [{ rec: 'swingSwordHeavy' }, { wave: 'tri', f0: 160, slide: -0.7, len: 300, env: { bell: true, focus: 0.25 }, db: -14 }] },
  axeSwing: { db: -14, vary: 4, max: 3, layers: [{ rec: 'swingAxe' }] },
  axeSwingHeavy: { db: -12, vary: 3, max: 2, layers: [{ rec: 'swingAxe', rate: 0.85 }, { rec: 'swingSwordHeavy', db: -6 }] },
  spearSwing: { db: -15, vary: 4, max: 3, layers: [{ rec: 'swingSpear' }] },
  spearSwingHeavy: { db: -13, vary: 3, max: 2, layers: [{ rec: 'swingSpear', rate: 0.88 }, { rec: 'swingSwordHeavy', db: -8 }] },
  spearThrust: { db: -13, vary: 4, max: 2, layers: [{ rec: 'swingSpear', rate: 1.15, len: 300 }, { rec: 'stab', db: -6 }] },
  daggerSwing: { db: -16, vary: 5, max: 3, layers: [{ rec: 'swingDagger' }] },
  fistSwing: { db: -18, vary: 6, max: 3, layers: [{ rec: 'swingFist' }] },
  thrust: { db: -12, vary: 5, max: 2, layers: [{ rec: 'stab' }] },
  // Blows: a recorded punch for the contact, a synth body for weight (it climbs through a combo in
  // sfx.js), a crisp click on top; heavy blows add a sub thump and a metal plate; crits ring.
  hit: { db: -12, vary: 3, max: 4, layers: [{ rec: 'punch' }, { rec: 'cut', db: -10 }] },
  hitMedium: { db: -11, vary: 3, max: 4, layers: [{ rec: 'punch' }, { rec: 'cut', db: -8 }, { rec: 'clangLight', db: -16 }] },
  hitAxe: { db: -11, vary: 3, max: 4, layers: [{ rec: 'punch' }, { rec: 'chop', db: -4 }, { rec: 'wood', db: -14 }] },
  hitSpear: { db: -12, vary: 3, max: 4, layers: [{ rec: 'punch' }, { rec: 'cut', rate: 0.85, db: -8 }] },
  hitDagger: { db: -13, vary: 4, max: 4, layers: [{ rec: 'punch', rate: 1.1 }, { rec: 'cut', db: -5 }] },
  hitFist: { db: -12, vary: 4, max: 4, layers: [{ rec: 'punch' }, { rec: 'soft', db: -8 }] },
  // The body under a blow: a short round tone, played higher with each step of a combo (sfx.js).
  hitTone: { db: -21, max: 4, layers: [thump(240, 80, { slide: -2 })] },
  hitHeavy: {
    db: -9, vary: 4, max: 2, duck: [-4, 300], layers: [
      { rec: 'punchHeavy' },
      { rec: 'clangHeavy', db: -8 },
      { rec: 'cut', rate: 0.8, db: -8 },
      thump(95, 200, { db: -1, slide: -2.5 }),
      { drum: 'P', db: -7 },
    ],
  },
  crit: { db: -10, gap: 120, vary: 2, max: 2, layers: [{ rec: 'punch' }, { drum: 'P', db: -4 }, { rec: 'clang', db: -3 }, sparkle('A6+E7:200', { at: 15, db: -8 })] },
  // Path and element colours, laid over a blow.
  holyHit: { db: -15, gap: 90, max: 2, room: true, layers: [{ rec: 'holyBlast', len: 700 }, sparkle('E6+B6:400', { db: -6 })] },
  rageHit: { db: -12, gap: 90, vary: 4, max: 2, layers: [{ rec: 'punchHeavy', rate: 0.85, len: 260 }, { rec: 'darkFire', len: 400, db: -5 }] },
  fireHit: { db: -14, gap: 90, vary: 5, max: 2, layers: [{ rec: 'fireImpact', len: 700 }] },
  iceHit: { db: -12, gap: 90, vary: 3, max: 2, layers: [{ rec: 'iceImpact', len: 600 }] },
  zapHit: { db: -15, gap: 90, vary: 4, max: 2, layers: [{ rec: 'zapImpact', len: 500 }] },
  poisonHit: { db: -12, gap: 90, vary: 5, max: 2, layers: [{ rec: 'acidHit', len: 600 }] },
  darkHit: { db: -14, gap: 90, vary: 4, max: 2, layers: [{ rec: 'darkFire', len: 600 }, { rec: 'punch', db: -8 }] },
  windHit: { db: -16, gap: 90, vary: 5, max: 2, layers: [{ rec: 'windShot', len: 400 }, { rec: 'punch', db: -10 }] },
  waterHit: { db: -15, gap: 90, vary: 5, max: 2, layers: [{ rec: 'splash', len: 600 }] },
  steelHit: { db: -16, gap: 90, vary: 4, max: 3, layers: [{ rec: 'clang' }] },
  arcaneHit: { db: -15, gap: 90, vary: 4, max: 2, layers: [{ rec: 'zapImpact', rate: 0.8, len: 400 }, sparkle('E6:30 B6:150', { db: -8 })] },
  arrowHit: { db: -9, gap: 60, vary: 6, max: 4, layers: [{ rec: 'arrowHit' }, { rec: 'punch', db: -9 }] },
  arrowHitHeavy: { db: -11, gap: 80, vary: 4, max: 2, duck: [-3, 250], layers: [{ rec: 'arrowHit' }, { rec: 'punchHeavy', db: -4 }, thump(100, 160, { db: -4 })] },
  starHit: { db: -11, gap: 60, vary: 6, max: 4, layers: [{ rec: 'arrowHit', rate: 1.3 }, { rec: 'clangLight', db: -8 }] },
  enemyHurt: { db: -18, gap: 60, vary: 12, max: 3, layers: [{ rec: 'creatureHurt', rate: 1.35 }] },
  miss: { db: -20, vary: 6, max: 2, layers: [{ rec: 'swish', db: 0 }] },
  hurt: { db: -12, vary: 4, max: 1, layers: [{ rec: 'softHeavy', len: 220 }, { wave: 'tri', f0: 560, slide: -6, vib: [18, 6], env: { s: 20, d: 120, punch: 0.3 }, lpf: [2500], db: -8 }] },
  poof: { db: -14, gap: 50, vary: 6, max: 3, layers: [{ rec: 'slime', db: -2 }, { wave: 'noise', env: { a: 2, s: 30, d: 200 }, lpf: [3000, 400], db: -6 }, sparkle('C7:20 G7:80', { db: -12, at: 20 })] },
  boom: {
    db: -9, vary: 4, max: 2, duck: [-6, 500], layers: [
      { wave: 'pnoise', f0: 60, slide: -0.5, env: { s: 80, d: 450, punch: 0.6 }, lpf: [2500, 500], drive: 0.3 },
      thump(70, 320, { db: -1, slide: -2 }),
      { rec: 'softHeavy', rate: 0.6, db: -6 },
    ],
  },
  stomp: { db: -16, vary: 5, max: 1, layers: [{ rec: 'rockHit', len: 400 }, thump(110, 90, { db: -4 })] },
  crack: {
    db: -9, vary: 4, max: 2, duck: [-4, 400], layers: [
      { rec: 'rockHit', len: 900 },
      { rec: 'mining', len: 500, db: -6 },
      thump(80, 260, { db: -2, slide: -2.5 }),
    ],
  },
  dot: { db: -22, vary: 8, max: 2, layers: [{ rec: 'acidHit', len: 300 }] },
  stun: { db: -18, max: 2, layers: [sparkle('G6:60 A6:60 G6:60 A6:60 G6:60 A6:200', { db: 0 })] },
  freeze: { db: -14, gap: 120, vary: 3, max: 2, layers: [{ rec: 'iceImpact', len: 700 }, sparkle('A6:30 C7:30 D7:30 B6:200', { db: -8 })] },
  roar: {
    db: -11, max: 1, duck: [-3, 500], layers: [
      { rec: 'ogre', rate: 0.75 },
      { wave: 'pnoise', f0: 120, env: { a: 20, s: 250, d: 300 }, lpf: [900], db: -8 },
      { seq: 'C2+G2:500', inst: 'brass_section', db: -6 },
    ],
  },
  hook: { db: -16, max: 1, layers: [whoosh(150, 1500, 3500, { focus: 0.3 }), { rec: 'metal', rate: 1.3, len: 200, at: 100, db: -4 }, { rec: 'metalClick', at: 220, db: -6 }] },
  // ---------- Shots and spells ----------
  arrow: { db: -7, gap: 50, vary: 5, max: 3, layers: [{ rec: 'bowLongbow' }, { rec: 'bowShoot', db: -8 }] },
  arrowHeavy: { db: -7, gap: 80, vary: 4, max: 2, layers: [{ rec: 'bowLongbow', rate: 0.9 }, { rec: 'heavyArrowPass', db: -3 }] },
  crossbow: { db: -7, gap: 50, vary: 4, max: 3, layers: [{ rec: 'crossbowShoot' }, { rec: 'boltPass', db: -8, at: 30 }] },
  crossbowHeavy: { db: -8, gap: 80, vary: 3, max: 2, layers: [{ rec: 'crossbowShoot', rate: 0.9 }, { rec: 'heavyArrowPass', db: -4 }] },
  star: { db: -16, gap: 70, vary: 6, max: 3, layers: [{ rec: 'windShot', rate: 1.4, len: 350 }, { rec: 'stab', rate: 1.3, db: -4 }] },
  zap: { db: -15, vary: 4, max: 3, layers: [{ rec: 'zapLaunch', len: 600 }] },
  cast: {
    db: -14, vary: 2, max: 2, room: true, layers: [
      { rec: 'teleIn', rate: 1.2, len: 700, db: -4 },
      { seq: 'C5:60 E5:60 G5:60 C6:250', inst: 'celesta', db: -4 },
    ],
  },
  castFire: { db: -9, max: 2, layers: [{ rec: 'fireCharge', len: 650 }] },
  castIce: { db: -10, max: 2, layers: [{ rec: 'iceCharge' }] },
  castZap: { db: -11, max: 2, layers: [{ rec: 'zapCharge', len: 900 }] },
  castHoly: { db: -10, max: 2, room: true, layers: [{ rec: 'holyHeal', len: 1000 }, { seq: 'C5+G5:600', inst: 'choir_aahs', attack: 0.1, db: -10 }] },
  castPoison: { db: -15, max: 2, layers: [{ rec: 'poisonCast', len: 1200 }] },
  castDark: { db: -14, max: 2, layers: [{ rec: 'darkRiser', len: 1400 }] },
  castWind: { db: -15, max: 2, layers: [{ rec: 'windWhoosh', len: 900 }] },
  castSteel: { db: -11, max: 2, layers: [{ rec: 'unsheathe' }, { rec: 'swish', rate: 0.8, db: -6, at: 120 }] },
  fire: { db: -10, vary: 5, max: 2, layers: [{ rec: 'fireLaunch', len: 900 }] },
  ice: { db: -11, vary: 3, max: 2, layers: [{ rec: 'iceLaunch', len: 900 }] },
  lightning: {
    db: -11, gap: 120, vary: 4, max: 2, duck: [-4, 400], layers: [
      { rec: 'thunder' },
      { rec: 'zapImpact', len: 500, db: -4 },
    ],
  },
  poison: { db: -15, vary: 6, max: 2, layers: [{ rec: 'poisonCast', len: 1400 }] },
  holyChime: { db: -13, max: 2, room: true, layers: [{ rec: 'holyBlast', len: 1000 }, { seq: 'E6+B6:600', inst: 'glockenspiel', db: -8 }] },
  holyBurst: { db: -11, gap: 150, max: 2, room: true, duck: [-3, 400], layers: [{ rec: 'holyWave', len: 1600 }, { rec: 'holyBlast', len: 900, db: -4 }] },
  fireBurst: { db: -11, gap: 150, vary: 4, max: 2, duck: [-4, 400], layers: [{ rec: 'fireImpact', len: 1200 }, thump(80, 300, { db: -4, slide: -2 })] },
  iceBurst: { db: -11, gap: 150, vary: 3, max: 2, duck: [-3, 400], layers: [{ rec: 'iceBig', len: 2000 }] },
  meteor: { db: -9, max: 1, duck: [-6, 900], layers: [{ rec: 'meteor' }, thump(60, 500, { slide: -1.5, db: -2 })] },
  quake: { db: -10, gap: 150, vary: 4, max: 2, duck: [-5, 600], layers: [{ rec: 'rockHit', len: 1500 }, { rec: 'rockThrow', len: 900, db: -6 }, thump(70, 400, { slide: -2 })] },
  gust: { db: -13, gap: 120, vary: 5, max: 2, layers: [{ rec: 'windWhoosh', len: 1000 }] },
  mist: { db: -14, gap: 150, max: 2, layers: [{ rec: 'splash', len: 1500 }, { rec: 'poisonCast', len: 1200, db: -6 }] },
  bladestorm: { db: -12, gap: 150, max: 2, layers: [{ rec: 'bladeSwing' }, { rec: 'bladeSwing', at: 110, db: -3 }, { rec: 'bladeSwingHeavy', at: 230, db: -2 }, { rec: 'cut', at: 300, db: -4 }] },
  buff: { db: -13, max: 1, layers: [{ rec: 'shield', len: 1200 }, { seq: 'G5:70 A5:70 B5:70 D6:300', synth: 'pluck', cut: 4000, ring: 0.3, db: -8 }] },
  partyBuff: { db: -12, max: 1, room: true, layers: [{ rec: 'shield', len: 1400 }, { seq: 'G4:70 C5:70 E5:70 G5:70 C6:400', inst: 'orchestral_harp', db: -4 }, { seq: 'r:280 C5+E5+G5:600', inst: 'string_ensemble_1', attack: 0.05, db: -10 }] },
  powerup: { db: -13, max: 2, layers: [{ rec: 'bladeDraw' }, { rec: 'shield', len: 900, db: -8 }] },
  gather: { db: -16, max: 1, layers: [{ rec: 'zapCharge', len: 900 }, { wave: 'saw', f0: 220, slide: 2.6, env: { a: 380, d: 40 }, lpf: [3000], db: -12 }] },
  gatherHoly: { db: -16, max: 1, room: true, layers: [{ rec: 'holyHeal', len: 900 }, { seq: 'C5+G5:420', inst: 'choir_aahs', attack: 0.3, db: -6 }] },
  // ---------- The warrior paths ----------
  pillar: { db: -12, max: 2, room: true, layers: [{ rec: 'holyBlast', len: 1100 }, { rec: 'bell', len: 900, db: -6 }, thump(165, 160, { db: -6 })] },
  aegis: { db: -12, max: 1, room: true, layers: [{ rec: 'holyProtect', len: 1600 }, { rec: 'clangHeavy', db: -4 }] },
  consecrate: {
    db: -10, max: 1, room: true, duck: [-4, 700], layers: [
      { rec: 'holyWave', len: 1800 },
      thump(110, 360, { slide: -2, db: -4 }),
      { seq: 'C5:50 E5:50 G5:50 C6:50 E6:500', inst: 'orchestral_harp', db: -8 },
    ],
  },
  verdict: {
    db: -8, max: 1, room: true, duck: [-8, 1400], layers: [
      { rec: 'holyBlast', len: 1400 },
      { rec: 'thunder', db: -6 },
      { rec: 'clangHeavy', db: -4 },
      thump(65, 500, { slide: -1.5 }),
      { seq: 'C4+G4+C5+E5:1100', inst: 'brass_section', db: -8, at: 60 },
    ],
  },
  bloodmoon: { db: -12, max: 1, layers: [{ rec: 'darkRiser' }, { seq: 'F2+C3:1100', inst: 'string_ensemble_1', attack: 0.3, db: -8 }] },
  eclipse: {
    db: -8, max: 1, duck: [-8, 1200], layers: [
      { rec: 'darkImpact', len: 2000 },
      { rec: 'punchHeavy', rate: 0.7, db: -4 },
      { rec: 'clangHeavy', rate: 0.8, db: -8 },
      thump(60, 500, { slide: -1.5 }),
    ],
  },
  rageburst: { db: -10, max: 2, duck: [-4, 300], layers: [{ rec: 'darkFire', len: 1000 }, { rec: 'punchHeavy', rate: 0.8, db: -3 }] },
  berserk: {
    db: -10, max: 1, duck: [-5, 900], layers: [
      { rec: 'darkWave', len: 1800 },
      { seq: 'C2:60 C2:60 C2:60 C2:60 C2:60 C2:600', inst: 'timpani', db: -4 },
      { seq: 'r:300 C3+G3+Db4:600', inst: 'brass_section', db: -6 },
    ],
  },
  sanctified: {
    db: -10, max: 1, room: true, duck: [-6, 1200], layers: [
      { seq: 'C5:70 E5:70 G5:70 C6:70 E6:70 G6:700', inst: 'orchestral_harp' },
      { seq: 'r:300 C5+E5+G5+C6:900', inst: 'choir_aahs', attack: 0.1, db: -4 },
      { seq: 'r:400 C7:800', inst: 'glockenspiel', db: -8 },
    ],
  },
  // The first jobs' gauges topping out: Valor (a steel ring and a brass call, Unbroken) and
  // Momentum (a hawk's rush of wind and a bright harp run, Hawkeye).
  unbroken: {
    db: -10, max: 1, duck: [-5, 900], layers: [
      { rec: 'unsheathe', rate: 0.9, len: 700 },
      { rec: 'clangHeavy', rate: 1.1, db: -8 },
      { seq: 'r:120 C4+G4+C5:800', inst: 'brass_section', db: -6 },
    ],
  },
  // Combo full (the Acrobat Archer's Showtime): a circus drum roll into a bright brass hit.
  showtime: {
    db: -10, max: 1, room: true, duck: [-5, 900], layers: [
      { seq: 'C4:50 C4:50 C4:50 C4:50 C4:50 C4:50', inst: 'timpani', db: -6 },
      { seq: 'r:300 C5+E5+G5+C6:700', inst: 'brass_section', attack: 0.01, db: -4 },
      { seq: 'r:300 C7:80 G7:500', inst: 'glockenspiel', db: -8 },
    ],
  },
  // The Phantom Trickster, a stage magic act: an arrow landing (a soft pop and a twinkle), a puff
  // of her smoke (a poof with a little chime), and Grand Illusion (a mysterious rising run into a
  // big magic flourish as the copies loose).
  pthit: { db: -18, vary: 8, max: 3, gap: 50, layers: [{ rec: 'teleIn', rate: 1.8, len: 200, db: -6 }, sparkle('A7:40', { db: -12 })] },
  ptsmoke: { db: -13, vary: 6, max: 2, gap: 80, layers: [{ rec: 'teleOut', rate: 1.2, len: 500 }, whoosh(300, 300, 1400, { db: -8 }), sparkle('E7:60 B7:120', { db: -12 })] },
  ptillusion: { db: -8, max: 1, room: true, duck: [-6, 2200], layers: [{ rec: 'teleOut', rate: 0.9, len: 700 }, { seq: 'D5:120 F5:120 A5:120 C#6:120 D6:120 F6:120 A6:500', inst: 'celesta', db: -4 }, { seq: 'r:1200 D4+A4+D5+F5:1400', inst: 'brass_section', attack: 0.02, db: -4 }, sparkle('r:1200 D7:0 A7:80 D8:160', { db: -8 })] },
  // The Acrobat Archer: an arrow landing (a bright pluck and a sparkle), Firework Arrow (a pop and a
  // crackle of sparks), her springboard going (a springy boing), and Grand Somersault's ring of gold
  // at the top of her leap (a cymbal swell into a fanfare).
  achit: { db: -18, vary: 8, max: 3, gap: 50, layers: [{ seq: 'E6:90', inst: 'pizzicato_strings', db: -4 }, sparkle('B7:40', { db: -12 })] },
  acfirework: { db: -11, vary: 6, max: 2, gap: 80, layers: [thump(180, 120, { db: -4 }), { rec: 'fireImpact', rate: 1.6, len: 300, db: -8 }, sparkle('C7:30 E7:60 G7:90 C8:120 G7:150', { db: -8 })] },
  // Team moves (world/teamwork.js): a catch clinks two notes together (a high five), a revive
  // rises on warm strings, a Group Finisher lands on the whole band.
  teamcatch: { db: -12, vary: 4, max: 2, gap: 60, layers: [{ seq: 'G5+B5:40 D6+G6:160', synth: 'pluck', cut: 6000, ring: 0.2, tail: 200 }, sparkle('r:30 G7:60 D8:120', { db: -8 })] },
  teamrevive: { db: -10, max: 1, room: true, layers: [{ seq: 'C5:140 E5:140 G5:140 C6:600', inst: 'celesta', db: -2 }, { seq: 'C4+G4+E5:900', inst: 'string_ensemble_1', attack: 0.15, db: -6 }, sparkle('r:420 C7:40 G7:300', { db: -8 })] },
  teamburst: { db: -7, max: 1, duck: [-8, 1400], layers: [{ rec: 'punchHeavy', rate: 0.8, db: -2 }, thump(55, 600, { slide: -1.4, db: -2 }), { seq: 'C4+G4+C5+E5:1200', inst: 'brass_section', attack: 0.02, db: -4 }, sparkle('C7:30 E7:30 G7:30 C8:400', { db: -6 })] },
  trapsnap: { db: -11, vary: 6, max: 2, layers: [{ wave: 'sine', f0: 160, slide: 2.2, env: { a: 5, s: 140, d: 120 }, db: -4 }, { rec: 'wood', rate: 1.4, db: -8 }] },
  acburst: { db: -8, max: 1, room: true, duck: [-6, 1400], layers: [whoosh(600, 200, 3000, { focus: 0.6, db: -6 }), { seq: 'r:200 G4+C5+E5+G5:1000', inst: 'brass_section', attack: 0.02, db: -4 }, sparkle('r:200 C7:0 E7:60 G7:120 C8:180', { db: -8 })] },
  // The finishers' big moments: Titan Breaker's sword forming and the ground splitting under it,
  // and Falcon Dive's call (a rising wind and brass) and the falcon's strike.
  titanrise: { db: -12, max: 1, layers: [{ rec: 'unsheathe', rate: 0.7, len: 900 }, { seq: 'C3+G3:900', inst: 'string_ensemble_1', attack: 0.3, db: -8 }] },
  titanbreak: {
    db: -8, max: 1, duck: [-8, 1300], layers: [
      { rec: 'clangHeavy', db: -2 },
      { rec: 'punchHeavy', rate: 0.7, db: -4 },
      { rec: 'thunder', db: -8 },
      thump(60, 520, { slide: -1.5 }),
      { seq: 'C3+G3+C4+E4:1000', inst: 'brass_section', db: -8, at: 60 },
    ],
  },
  falconcall: { db: -11, max: 1, room: true, layers: [{ rec: 'windWhoosh', len: 1200 }, { seq: 'D4:200 A4:200 D5:800', inst: 'french_horn', db: -6 }] },
  falconloose: {
    db: -9, max: 1, duck: [-7, 1100], layers: [
      { rec: 'windWhoosh', rate: 1.3, len: 900 },
      thump(90, 380, { slide: -2, db: -4 }),
      { seq: 'D5:50 F#5:50 A5:50 D6:50 F#6:600', inst: 'orchestral_harp', db: -6 },
      { seq: 'r:80 D4+A4+D5:900', inst: 'brass_section', db: -8 },
    ],
  },
  // The Thief: Shadow topping out (a hush, a low bell, a breath of strings: Phantom), night
  // falling for her dagger finisher, the full moon rising for her star finisher, and the giant
  // crescent moon's cut.
  phantom: {
    db: -11, max: 1, room: true, duck: [-5, 900], layers: [
      { rec: 'teleOut', len: 900, db: -4 },
      { seq: 'A3+E4:900', inst: 'string_ensemble_1', attack: 0.15, db: -8 },
      { seq: 'r:120 E6:700', inst: 'celesta', db: -6 },
    ],
  },
  nightfall: { db: -11, max: 1, room: true, layers: [{ rec: 'darkRiser', len: 1400 }, { rec: 'teleOut', db: -6 }, { seq: 'A2+E3:1200', inst: 'string_ensemble_1', attack: 0.3, db: -8 }] },
  fullmoon: { db: -11, max: 1, room: true, layers: [{ rec: 'windWhoosh', len: 900 }, { seq: 'A5:60 C6:60 E6:60 A6:700', inst: 'celesta', db: -4 }, { seq: 'A3+E4+A4:1100', inst: 'choir_aahs', attack: 0.2, db: -8 }] },
  crescentcut: {
    db: -8, max: 1, duck: [-8, 1200], layers: [
      { rec: 'bladeSwingHeavy', rate: 0.8 },
      { rec: 'darkImpact', len: 1400, db: -4 },
      thump(70, 460, { slide: -1.5 }),
      { seq: 'A3+E4+A4+C5:900', inst: 'string_ensemble_1', attack: 0.02, db: -8 },
    ],
  },
  aeboom: { db: -12, vary: 6, max: 3, gap: 60, layers: [{ rec: 'rockHit', rate: 1.5, len: 300, db: -4 }, thump(140, 160, { db: -6 }), { rec: 'clang', rate: 1.8, len: 300, db: -10 }] },
  aesteam: { db: -16, vary: 6, max: 2, gap: 120, layers: [whoosh(500, 1800, 5200, { focus: 0.2, db: -4 })] },
  aeballista: { db: -9, max: 1, room: true, duck: [-6, 1600], layers: [{ rec: 'clang', rate: 0.7, len: 500, db: -4 }, { rec: 'clang', rate: 0.9, len: 400, db: -6, at: 300 }, thump(60, 700, { slide: -1.4, at: 1000 }), whoosh(1200, 1400, 4800, { focus: 0.3, db: -6, at: 1050 })] },
  overdrive: { db: -11, max: 1, room: true, duck: [-5, 800], layers: [{ seq: 'E6:80 A6:600', inst: 'pan_flute', db: -4 }, whoosh(800, 1500, 5200, { focus: 0.2, db: -8 }), { rec: 'clang', rate: 1.4, len: 300, db: -10 }] },
  bellbonk: { db: -11, vary: 5, max: 2, layers: [{ rec: 'metal', rate: 1.3, len: 300 }, { rec: 'bell', rate: 1.4, len: 1200 }, sparkle('E7:40 B6:40 E7:300', { db: -10 })] },
  // The Thief's paths. The Blade Dancer: Ricochet topping out (rings whirring up and a bright
  // chime: Carousel). The Sky Dancer's follow hers.
  carouselfull: { db: -10, max: 1, duck: [-5, 800], layers: [whoosh(500, 300, 2400, { focus: 0.6, db: -4 }), sparkle('C7:0 E7:70 G7:140 C8:210', { db: -10 }), { seq: 'r:120 C5+G5:600', inst: 'orchestral_harp', attack: 0.02, db: -8 }] },
  // A ring ricocheting (a bright metal ping and a sparkle), and Golden Carousel (rings whirring
  // round her faster and faster on a harp run, then flung out with a crash of chimes).
  bdbounce: { db: -16, vary: 8, max: 3, layers: [{ rec: 'clang', rate: 1.6, db: -6 }, sparkle('E7:0 B7:40', { db: -12 })] },
  bdcarousel: {
    db: -8, max: 1, duck: [-6, 1400], layers: [
      whoosh(300, 1200, 2800, { focus: 0.7, db: -4 }),
      { seq: 'C5:90 E5:90 G5:90 C6:90 E6:90 G6:90 C7:600', inst: 'orchestral_harp', db: -6 },
      { seq: 'r:1000 C5+G5+C6+E6:900', inst: 'orchestral_harp', attack: 0.02, db: -6 },
      sparkle('r:1000 C8:0 G7:60 E7:120 C7:180', { db: -10 }),
    ],
  },
  // The Sky Dancer: Tailwind topping out (a rush of wind and a rising flute run), Updraft's rising
  // whirl, and Sky Waltz (the tornado spinning up on a harp and flute, and the slam).
  tailwindfull: { db: -11, max: 1, room: true, duck: [-5, 900], layers: [{ rec: 'windWhoosh', len: 1200 }, { seq: 'C6:50 D6:50 E6:50 G6:50 A6:50 C7:700', inst: 'flute', db: -4 }, sparkle('r:300 E7:0 G7:60', { db: -12 })] },
  skyupdraft: { db: -14, vary: 6, max: 2, layers: [whoosh(200, 500, 2600, { focus: 0.5, db: -4 }), { seq: 'G5:60 C6:200', inst: 'flute', db: -10 }] },
  skytornado: {
    db: -8, max: 1, duck: [-6, 1500], layers: [
      { rec: 'windWhoosh', len: 1600 },
      { seq: 'C5:100 E5:100 G5:100 C6:100 E6:100 G6:100', inst: 'orchestral_harp', db: -6 },
      thump(60, 520, { slide: -1.5, at: 1100 }),
      { seq: 'r:1100 C4+G4+C5+E5:900', inst: 'flute', attack: 0.02, db: -6 },
    ],
  },

  // The archer paths' gauges topping out: Gale (a rush of wind, a rising flute and harp) and the
  // Sniper's lock (a sharp metal click, a high glint).
  galeFull: {
    db: -11, max: 1, room: true, duck: [-5, 900], layers: [
      { rec: 'windWhoosh', len: 1400 },
      { seq: 'G5:60 A5:60 C6:60 D6:60 G6:600', inst: 'flute', db: -3 },
      { seq: 'r:120 G4:60 C5:60 D5:60 G5:700', inst: 'orchestral_harp', db: -6 },
    ],
  },
  deadeye: {
    db: -11, max: 1, duck: [-5, 600], layers: [
      { rec: 'metalClick', rate: 0.9 },
      { rec: 'unsheathe', rate: 1.3, len: 500, at: 40, db: -6 },
      { seq: 'r:50 A7:500', synth: 'bell', tail: 1200, db: -6 },
      { seq: 'r:60 A4+E5:500', inst: 'string_ensemble_1', attack: 0.02, db: -10 },
    ],
  },
  // A sight closing on its mark: a soft rising beep and a click as it locks.
  lockOn: { db: -18, gap: 40, max: 3, layers: [{ wave: 'sine', f0: 1400, slide: 1.2, env: { a: 300, s: 600, d: 120 }, db: -6 }, { rec: 'metalClick', at: 900, rate: 1.4 }] },
  // The archer paths' shots and bursts.
  cycloneShot: { db: -9, gap: 120, max: 1, layers: [{ rec: 'windWhoosh', len: 1100 }, { rec: 'bowLongbow', rate: 0.85, db: -2 }] },
  boltKick: { db: -11, gap: 120, max: 1, layers: [{ rec: 'crossbowShoot', rate: 0.8 }, thump(80, 180, { db: -2 }), { rec: 'metalClick', at: 260, rate: 0.8, db: -8 }] },
  heartshock: {
    db: -7, max: 1, duck: [-8, 900], layers: [
      { rec: 'crossbowShoot', rate: 0.7 },
      { rec: 'heavyArrowPass', rate: 0.8, at: 20 },
      { rec: 'thunder', len: 1400, db: -6, at: 30 },
      thump(55, 600, { slide: -1.5, db: -2 }),
    ],
  },
  blast: { db: -9, gap: 120, vary: 4, max: 2, duck: [-4, 400], layers: [{ rec: 'fireImpact', len: 900 }, { rec: 'rockHit', len: 600, db: -4 }, thump(70, 300, { db: -3 })] },
  stormburst: { db: -8, max: 1, duck: [-6, 800], layers: [{ rec: 'windWhoosh', len: 1300, rate: 0.8 }, { rec: 'punchHeavy', rate: 0.75, db: -2 }, thump(60, 500, { slide: -1.5, db: -2 })] },
  link: { db: -13, max: 1, layers: [{ seq: 'E6:40 B6:140', synth: 'pluck', cut: 6000, ring: 0.2, tail: 200 }, sparkle('r:40 E7:120', { db: -8 })] },
  // A ding for each tier of the hit counter: the same bell every time, a little higher per tier (sfx.js).
  tier: { db: -17, max: 1, layers: [{ seq: 'D7+A7:350', synth: 'bell', tail: 1300 }] },
  // ---------- Jingles (docs/audio/research-japanese.md, Part 5), on real instruments ----------
  // Quick notes rushing into a long landing note on the home note (or its fifth), reached by an
  // upward leap; a lead, a second voice a third or sixth under it, a bass tapping the roots, and
  // sparkle on the landing.
  levelup: {
    db: -8, max: 1, duck: [-9, 1600], layers: [
      { seq: 'G4:70 B4:70 D5:70 G5:210 F5:105 A5:105 C6:105 D6:760', inst: 'trumpet' },
      { seq: 'D4:210 B4:210 C5:315 B5:760', inst: 'french_horn', db: -5 },
      { seq: 'G2:70 r:70 G2:70 r:70 G2:70 r:70 F2:105 r:105 F2:105 G2:700', inst: 'pizzicato_strings', db: -2 },
      { seq: 'r:735 G4+B4+D5+G5:800', inst: 'string_ensemble_1', db: -6 },
      { seq: 'r:735 G6:30 B6:30 D7:600', inst: 'glockenspiel', db: -8 },
      { synth: 'riser', seq: 'C4:700', db: -14, tail: 50 },
      { drum: 'X', at: 735, db: -4 },
      { drum: '*', at: 735, db: -12 },
      { seq: 'r:735 G4+B4+D5+G5:650', synth: 'hardlead', db: -13, tail: 200 },
    ],
  },
  questDone: {
    db: -9, max: 1, duck: [-9, 2100], layers: [
      { seq: 'E5:120 G5:120 C6:120 B5:120 A5:120 F5:120 D5:120 G5:120 C6:960', inst: 'flute' },
      { seq: 'C5:240 A4:240 F4:240 D5:240 E5:960', inst: 'orchestral_harp', db: -4 },
      { seq: 'C3:240 A2:240 F2:240 G2:240 C3:480', inst: 'pizzicato_strings', db: -2 },
      { seq: 'r:960 C4+E4+G4+C5:960', inst: 'string_ensemble_1', db: -6 },
      { seq: 'r:960 C7:600', inst: 'glockenspiel', db: -10 },
      { drum: 'P', at: 960, db: -5 },
      { seq: 'r:960 C4+E4+G4+C5:700', synth: 'hardlead', db: -15, tail: 200 },
    ],
  },
  questAccept: { db: -12, max: 1, duck: [-6, 500], layers: [{ seq: 'D6:70 G6:300', inst: 'orchestral_harp' }, { seq: 'r:70 G6:250', inst: 'glockenspiel', db: -8 }, { seq: 'G3:300', inst: 'pizzicato_strings', db: -6 }] },
  // Something rare drops: a bright run, a breath, then a climb to a long high note.
  rareDrop: {
    db: -11, max: 1, duck: [-8, 1300], layers: [
      { seq: 'C5:60 E5:60 G5:60 C6:60 r:60 D6:90 E6:90 G6:600', inst: 'celesta' },
      { seq: 'C5:60 E5:60 G5:60 C6:60 r:60 D6:90 E6:90 G6:600', inst: 'orchestral_harp', db: -4 },
      { seq: 'r:480 C6+E6+G6:500', synth: 'bell', db: -10 },
      { seq: 'C3:240 G2:240 C3:600', inst: 'pizzicato_strings', db: -4 },
      { drum: 'P', at: 480, db: -6 },
      { seq: 'r:480 C5+G5+C6:450', synth: 'hardlead', db: -15, tail: 150 },
    ],
  },
  itemGet: { db: -12, max: 1, duck: [-6, 700], layers: [{ seq: 'A5:50 C#6:50 E6:50 A6:350', inst: 'celesta' }, { seq: 'E5:150 C#6:350', inst: 'orchestral_harp', db: -5 }, { rec: 'sparkle', db: -10, at: 150 }] },
  jobUp: {
    db: -7, max: 1, duck: [-10, 3800], layers: [
      { seq: 'C5:250 F5:250 A5:375 G5:125 Bb5:250 D6:250 C6:500 r:100 F6:1300', inst: 'trumpet' },
      { seq: 'A4:500 C5:500 D5:500 E5:500 r:100 A5:1300', inst: 'french_horn', db: -4 },
      { seq: 'F3+C4:1000 Bb3+D4:500 C4+E4:500 r:100 F3+A3+C4+F4:1300', inst: 'string_ensemble_1', db: -4 },
      { seq: 'F2:1000 Bb2:500 C3:500 r:100 F2:1300', inst: 'pizzicato_strings', db: -2 },
      { seq: 'r:2100 F2:60 F2:60 F2:60 F2:600', inst: 'timpani', db: -2 },
      { seq: 'r:2100 F5:50 A5:50 C6:50 F6:50 A6:50 C7:700', inst: 'orchestral_harp', db: -6 },
      { drum: '*', at: 2100, db: -10 },
      { synth: 'riser', seq: 'r:200 C4:1900', db: -12, tail: 50 },
      { drum: 'X', at: 2100, db: -3 },
      { seq: 'r:2100 F3+C4+F4+A4+C5:1200', synth: 'hardlead', db: -12, tail: 300 },
    ],
  },
  heal: { db: -13, max: 1, room: true, layers: [{ rec: 'holyHeal', len: 1300 }, { seq: 'G4:90 C5:90 E5:90 A5:480', inst: 'orchestral_harp', db: -6 }] },
  bossDefeated: {
    db: -7, max: 1, duck: [-12, 3300], layers: [
      { seq: 'A5:125 D6:125 F#6:250 r:125 Bb5:250 C6:250 D6:1500', inst: 'trumpet' },
      { seq: 'F#5:500 r:125 F5:250 G5:250 A5:1500', inst: 'french_horn', db: -4 },
      { seq: 'D4+F#4+A4:500 r:125 Bb3+D4+F4:250 C4+E4+G4:250 D4+F#4+A4+D5:1500', inst: 'string_ensemble_1', db: -4 },
      { seq: 'D3:500 r:125 Bb2:250 C3:250 D3:750', inst: 'pizzicato_strings', db: -2 },
      { seq: 'r:1125 D2:60 D2:60 D2:600', inst: 'timpani', db: -2 },
      { drum: '*', at: 1125, db: -10 },
      { synth: 'riser', seq: 'C4:1100', db: -12, tail: 50 },
      { drum: 'X', at: 1125, db: -3 },
      { seq: 'r:1125 D4+F#4+A4+D5:1400', synth: 'hardlead', db: -12, tail: 300 },
    ],
  },
  // Fainting: a falling triad and a sad leading note, resting gently on the home note.
  death: { db: -10, max: 1, duck: [-12, 2300], layers: [{ seq: 'A5:220 F5:220 D5:220 C#5:400 D5:800', inst: 'oboe' }, { seq: 'F4+A4:660 E4+A4:400 F4+A4:800', inst: 'string_ensemble_1', db: -6 }] },
  // A boss changes phase: a riser, a zigzag climbing by whole steps, a gap, then a hit.
  phase: {
    db: -9, max: 1, duck: [-8, 1400], layers: [
      { wave: 'noise', env: { a: 880, d: 20 }, lpf: [400, 8000, 1.2], db: -4 },
      { seq: 'r:380 C5:65 D5:65 C5:65 E5:65 D5:65 F#5:65 E5:65 G#5:65', inst: 'string_ensemble_1', db: -2 },
      { seq: 'r:960 C4+C5+G5:220', inst: 'brass_section' },
      { drum: 'K', at: 960 },
      { drum: '*', at: 960, db: -12 },
    ],
  },
  // ---------- The world around you (ambience.js plays these over each area's bed) ----------
  // Birds: quick sine chirps and a trill; at night, crickets and an owl.
  birdChirp: { db: -27, vary: 12, max: 2, gap: 200, layers: [{ wave: 'sine', arp: [3300, 4200, 3700], arpStep: 45, slide: 1.2, vib: [28, 3], env: { a: 3, s: 100, d: 40 } }, { wave: 'sine', f0: 3900, slide: 2, env: { a: 2, s: 30, d: 40 }, at: 220, db: -3 }] },
  birdTrill: { db: -29, vary: 10, max: 2, gap: 300, layers: [{ wave: 'sine', f0: 3600, repeat: 55, repeatSemis: -1, slide: 3, env: { a: 6, s: 320, d: 120 } }] },
  cricket: { db: -31, vary: 6, max: 3, gap: 120, layers: [0, 34, 68, 102].map((at) => ({ wave: 'sine', f0: 4300, env: { a: 1, s: 9, d: 14 }, at })) },
  owl: { db: -26, vary: 4, max: 1, gap: 2000, layers: [{ wave: 'sine', f0: 420, slide: -0.3, env: { a: 40, s: 110, d: 180 } }, { wave: 'sine', f0: 400, slide: -0.4, env: { a: 50, s: 260, d: 260 }, at: 430 }] },
  leafRustle: { db: -31, vary: 8, max: 1, gap: 400, layers: [{ wave: 'noise', env: { a: 90, s: 150, d: 320 }, hpf: [2500], lpf: [7000] }] },
  // The sea: a wave washing in and drawing back; gulls; the creak of the boards.
  waveWash: { db: -25, vary: 6, max: 2, gap: 800, layers: [{ wave: 'noise', env: { a: 700, s: 300, d: 1700 }, lpf: [1100, 380] }, { rec: 'splash', rate: 0.7, db: -14 }] },
  gull: { db: -29, vary: 8, max: 1, gap: 1500, layers: [{ wave: 'saw', f0: 980, slide: -1.3, vib: [9, 4], env: { a: 25, s: 200, d: 180 }, lpf: [2400] }, { wave: 'saw', f0: 1060, slide: -1.6, vib: [9, 4], env: { a: 20, s: 150, d: 160 }, lpf: [2400], at: 380, db: -2 }] },
  woodCreak: { db: -30, vary: 10, max: 1, gap: 1500, layers: [{ wave: 'saw', f0: 140, slide: 0.6, vib: [18, 6], env: { a: 120, s: 200, d: 300 }, lpf: [900] }] },
  // Caves and the Hollow: water dripping into pools, with a ring of the room.
  drip: { db: -24, vary: 14, max: 2, gap: 300, room: true, layers: [{ wave: 'sine', f0: 900, slide: 3.2, env: { a: 1, s: 8, d: 70 } }, { wave: 'sine', f0: 1300, slide: 2.5, env: { a: 1, s: 5, d: 60 }, at: 150, db: -12 }] },
  // Heights and old stones: a hawk overhead, wind chimes.
  hawkCry: { db: -29, vary: 6, max: 1, gap: 4000, layers: [{ wave: 'saw', f0: 2300, slide: -1.1, vib: [12, 3], env: { a: 20, s: 280, d: 420 }, lpf: [3600] }] },
  windChime: { db: -27, vary: 3, max: 1, gap: 2000, room: true, layers: [{ seq: 'E7:120 B6:160 G7:200 D7:300', synth: 'bell', tail: 1600 }] },
  // Towns: far-off chatter (muffled voices), and the town bell now and then.
  chatter: { db: -33, vary: 18, max: 2, gap: 400, layers: [{ wave: 'tri', arp: [520, 610, 560, 650, 580, 540], arpStep: 75, vib: [6, 3], env: { a: 10, s: 400, d: 80 }, lpf: [1700] }] },
  townBell: { db: -26, vary: 2, max: 1, gap: 8000, room: true, layers: [{ rec: 'bell', rate: 0.75 }] },
  // ---------- Weight under blows (sfx.js) ----------
  // What a blow lands on: stone cracks, crystal rings, bone and armour clank, wood knocks,
  // slime squelches, a spirit whooshes through.
  matStone: { db: -16, vary: 6, max: 2, layers: [{ rec: 'rockHit', len: 300 }, thump(110, 90, { db: -6 })] },
  matCrystal: { db: -17, vary: 6, max: 2, layers: [{ rec: 'glass', rate: 1.1 }, sparkle('E7:60', { db: -12 })] },
  matArmor: { db: -17, vary: 5, max: 2, layers: [{ rec: 'plate', len: 260 }] },
  matWood: { db: -16, vary: 6, max: 2, layers: [{ rec: 'wood' }] },
  matSlime: { db: -16, vary: 10, max: 2, layers: [{ rec: 'slime' }] },
  matSpirit: { db: -18, vary: 8, max: 2, layers: [whoosh(220, 3000, 900, { focus: 0.3 })] },
  // A crit's low thump, under its ring.
  // Low HP: a heartbeat, lub-dub.
  heartbeat: { db: -15, max: 1, gap: 500, layers: [thump(62, 120, { slide: -1.5 }), thump(55, 160, { slide: -1.5, at: 170, db: -3 })] },
  // ---------- Interface: real clicks, high, short and dry ----------
  // The emotes (ui/emotes.js): short and cute, one each (recorded, recorded.js; these chimes stand
  // in until the recordings are ready).
  emoteCheer: { db: -14, max: 1, layers: [sparkle('C7:40 E7:40 G7:240')] },
  emoteDance: { db: -15, max: 1, layers: [sparkle('C7:120 E7:120 G7:120 E7:120 C8:300')] },
  emoteFlip: { db: -15, max: 1, layers: [whoosh(400, 600, 2600, { focus: 0.4 })] },
  emoteLove: { db: -15, max: 1, layers: [sparkle('E7:80 G7:80 C8:400')] },
  emoteThanks: { db: -16, max: 1, layers: [sparkle('G6:120 C7:400')] },
  emoteFlex: { db: -14, max: 1, layers: [thump(90, 200)] },
  emoteSleepy: { db: -16, max: 1, layers: [sparkle('G6:300 E6:300 C6:600')] },
  emoteSad: { db: -16, max: 1, layers: [sparkle('E6:300 D#6:300 D6:700')] },
  click: { db: -20, max: 2, layers: [{ rec: 'click', len: 90 }] },
  cursor: { db: -21, max: 2, layers: [{ rec: 'tick' }] },
  cancel: { db: -16, max: 2, layers: [{ rec: 'back', len: 200 }] },
  // Windows pop open like a soap bubble (a little rising blip) and pop shut (falling).
  open: { db: -19, max: 1, layers: [{ rec: 'open', len: 200, db: -6 }, { wave: 'sine', f0: 620, slide: 2.6, env: { a: 2, s: 30, d: 60 }, overtones: [2, 0.2] }] },
  close: { db: -20, max: 1, layers: [{ rec: 'close', db: -6 }, { wave: 'sine', f0: 900, slide: -2.6, env: { a: 2, s: 25, d: 60 }, overtones: [2, 0.2] }] },
  // The quest log and the map rustle like paper; the bag opens with a creak of leather.
  openPaper: { db: -19, max: 1, layers: [{ rec: 'bookFlip', len: 300 }] },
  openBag: { db: -18, max: 1, layers: [{ rec: 'leather', len: 220 }, { rec: 'cloth', len: 200, db: -6 }] },
  // A skill point spent: a rising run; something bought: coins and a jingle.
  skillUp: { db: -16, max: 1, gap: 120, layers: [{ seq: 'C6:45 E6:45 G6:45 C7:220', synth: 'pluck', cut: 6000, ring: 0.15, tail: 300 }, sparkle('G7:120', { at: 140, db: -10 })] },
  buy: { db: -15, max: 1, gap: 150, layers: [{ rec: 'coins', len: 500 }, { seq: 'E6:50 A6:50 E7:200', synth: 'pluck', cut: 6000, ring: 0.12, db: -6, tail: 200 }] },
  denied: { db: -15, max: 1, layers: [{ rec: 'error' }] },
  // NPC voices: a soft round "boop" (rendered at C5 and played back at each speaker's pitch).
  blipTri: { db: -20, gap: 70, max: 1, layers: [{ wave: 'sine', f0: N.C5, overtones: [3, 0.25], env: { a: 3, s: 15, d: 35 }, lpf: [3000] }] },
  blipPulse: { db: -21, gap: 70, max: 1, layers: [{ wave: 'tri', f0: N.C5, slide: 0.6, env: { a: 2, s: 15, d: 30 }, lpf: [3500] }] },
  blipRasp: { db: -21, gap: 70, max: 1, layers: [{ wave: 'saw', f0: N.C5, env: { a: 2, s: 15, d: 30 }, lpf: [1500] }] },
};

// The monsters' voices (voices.js): spotting you, hurt, beaten, per family. The recordings play;
// until they load, the old creature cry stands in, pitched for the moment.
const VOICE_MOMENTS = { Spot: { db: -21, gap: 350, max: 2, rate: 1.2 }, Hurt: { db: -23, gap: 110, max: 2, rate: 1.45 }, Die: { db: -19, gap: 60, max: 3, rate: 1.1 } };
for (const fam of VOICE_FAMILIES) {
  for (const [ev, m] of Object.entries(VOICE_MOMENTS)) R[`mv${fam}${ev}`] = { db: m.db, gap: m.gap, vary: 6, max: m.max, layers: [{ rec: 'creatureHurt', rate: m.rate }] };
}

export const RECIPES = R;
// A recorded effect that keeps its recipe's notes (recorded.js `music`) plays them from this
// notes-only version alongside the recording, so each job keeps its musical colour.
for (const [k, rec] of Object.entries(RECORDED)) if (rec.music && R[k]) R[`${k}~music`] = { ...R[k], layers: R[k].layers.filter((l) => l.seq) };
// How many variants of each recipe to keep: noisy or recorded ones vary, tonal ones are the same.
export const variantsOf = (name) => (R[name].layers.some((l) => l.rec || /noise/.test(l.wave ?? '')) ? 3 : 1);
