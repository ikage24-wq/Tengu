// Every sound effect as data for the synthesizer (synth.js): recorded effects (Kenney, CC0) and
// recorded instruments (FluidR3) layered with synth sweeps, thumps and sparkles, the same "real
// plus modern" mix as the music. Units: Hz, ms, octaves per second (slide), dB. Each recipe:
// { layers, db (peak level once normalized), vary (± % random pitch per play), max (voices at
// once), duck: [dB the music dips, ms], room (a little of the short room) }.
//
// Layer kinds: { rec: 'punch', rate } a recording; { seq: 'G4:70 C5+E5:300', inst | synth } written
// notes; { drum: 'K' } a drum hit; anything else is a synth layer (synth.js). See
// docs/audio/README.md for the rules (jingles after research-japanese.md, Part 5).

const N = { C5: 523 };
// A whoosh: noise swept through a band, rising then falling (`focus` is where it peaks).
const whoosh = (len, from, to, o = {}) => ({ wave: 'noise', len, env: { bell: true, focus: o.focus ?? 0.55 }, hpf: [from * 0.7, to * 0.7], lpf: [from, to, o.q ?? 1.3], db: o.db ?? 0, at: o.at ?? 0 });
// A thump: a sine body dropping fast (the weight of a blow).
const thump = (f, d, o = {}) => ({ wave: 'sine', f0: f, slide: o.slide ?? -3, env: { s: o.s ?? 10, d, punch: 0.5 }, db: o.db ?? 0, at: o.at ?? 0 });
// A sparkle: quick bell notes.
const sparkle = (notes, o = {}) => ({ seq: notes, synth: 'bell', db: o.db ?? -8, at: o.at ?? 0, tail: 500 });

const R = {
  // ---------- Loot and progress ----------
  // Coins: real coins, and a bright two-note chime (stepped up for coins in a row, in sfx.js).
  coin: { db: -14, max: 3, layers: [{ rec: 'coins', len: 260, db: -2 }, { seq: 'A6:40 E7:120', synth: 'pluck', cut: 6000, ring: 0.12, db: -6, tail: 150 }] },
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
  portal: {
    db: -15, max: 1, room: true, layers: [
      { wave: 'sine', f0: 300, slide: 2, vib: [7, 4], env: { a: 40, s: 400, d: 200 }, db: -4 },
      { wave: 'noise', env: { a: 60, s: 380, d: 200 }, hpf: [800, 2000], lpf: [2000, 6000], db: -10 },
      { seq: 'C6:60 E6:60 G6:60 C7:300', inst: 'celesta', db: -4 },
    ],
  },
  dash: { db: -18, vary: 5, max: 1, layers: [whoosh(200, 1500, 4000, { focus: 0.6 }), { rec: 'cloth', rate: 1.3, len: 160, db: -8 }] },
  blink: { db: -16, max: 1, room: true, layers: [whoosh(180, 2000, 7000, { focus: 0.3 }), sparkle('G6:30 C7:30 E7:150', { at: 40, db: -6 })] },
  // ---------- Swings and blows ----------
  // A swing: a swept whoosh with a recorded blade's edge in it; heavier swings are lower and longer.
  swing: { db: -17, vary: 5, max: 3, layers: [whoosh(170, 2400, 1000, { focus: 0.65 }), { rec: 'slice', len: 180, db: -8 }] },
  swingHeavy: { db: -14, vary: 4, max: 2, layers: [whoosh(320, 1500, 450, { focus: 0.5 }), { wave: 'tri', f0: 180, slide: -0.7, len: 320, env: { bell: true, focus: 0.5 }, db: -10 }, { rec: 'cloth', rate: 0.7, len: 300, db: -6 }] },
  thrust: { db: -17, vary: 5, max: 2, layers: [whoosh(110, 2400, 4000, { focus: 0.3 }), { rec: 'slice', rate: 1.2, len: 140, db: -4 }] },
  // Blows: a recorded punch for the contact, a synth body for weight (it climbs through a combo in
  // sfx.js), a crisp click on top; heavy blows add a sub thump and a metal plate; crits ring.
  hit: { db: -12, vary: 5, max: 4, layers: [{ rec: 'punch' }, thump(220, 70, { db: -6 }), { wave: 'noise', env: { d: 5 }, hpf: [3000], db: -12 }] },
  hitMedium: { db: -11, vary: 5, max: 4, layers: [{ rec: 'punch' }, { rec: 'plateLight', len: 200, db: -10 }, thump(190, 90, { db: -5 }), { wave: 'noise', env: { d: 6 }, hpf: [3000], db: -12 }] },
  hitHeavy: {
    db: -9, vary: 4, max: 2, duck: [-4, 300], layers: [
      { rec: 'punchHeavy' },
      { rec: 'plate', len: 400, db: -8 },
      thump(95, 200, { db: -1, slide: -2.5 }),
      { wave: 'noise', env: { a: 1, d: 260 }, hpf: [3500], db: -16 },
    ],
  },
  crit: { db: -10, vary: 2, max: 2, layers: [{ rec: 'punch' }, { rec: 'metal', len: 300, db: -6 }, sparkle('A6+E7:200', { at: 15, db: -6 })] },
  // Path and element colours, laid over a blow.
  holyHit: { db: -15, max: 2, room: true, layers: [{ rec: 'bell', rate: 1.4, len: 600, db: -4 }, sparkle('E6+B6:400', { db: -2 })] },
  rageHit: { db: -12, vary: 4, max: 2, layers: [{ rec: 'punchHeavy', rate: 0.85, len: 260 }, { wave: 'noise', crush: 6, env: { d: 90 }, lpf: [2400], db: -8, drive: 0.4 }] },
  fireHit: { db: -15, vary: 5, max: 2, layers: [{ wave: 'pnoise', f0: 220, env: { s: 30, d: 160, punch: 0.3 }, lpf: [2400, 700] }, { wave: 'noise', env: { a: 10, d: 200 }, hpf: [1500], lpf: [5000], trem: [25, 60], db: -10 }] },
  iceHit: { db: -16, vary: 3, max: 2, layers: [{ rec: 'glass', len: 300 }, sparkle('A6:30 D7:150', { db: -6 })] },
  zapHit: { db: -17, vary: 4, max: 2, layers: [{ wave: 'saw', f0: 1400, slide: -9, env: { d: 90 }, lpf: [5000] }, { wave: 'noise', env: { d: 40 }, hpf: [3000], db: -6 }] },
  enemyHurt: { db: -18, vary: 10, max: 3, layers: [{ wave: 'tri', f0: 700, slide: -8, vib: [20, 5], env: { s: 10, d: 80, punch: 0.3 }, lpf: [3000] }] },
  miss: { db: -20, vary: 6, max: 2, layers: [whoosh(110, 3500, 2000, { focus: 0.4 })] },
  hurt: { db: -12, vary: 4, max: 1, layers: [{ rec: 'softHeavy', len: 220 }, { wave: 'tri', f0: 560, slide: -6, vib: [18, 6], env: { s: 20, d: 120, punch: 0.3 }, lpf: [2500], db: -8 }] },
  poof: { db: -14, vary: 6, max: 3, layers: [{ wave: 'sine', f0: 500, slide: 21, env: { s: 10, d: 40 }, db: -4 }, { wave: 'noise', env: { a: 2, s: 30, d: 200 }, lpf: [3000, 400] }, sparkle('C7:20 G7:80', { db: -12, at: 20 })] },
  boom: {
    db: -9, vary: 4, max: 2, duck: [-6, 500], layers: [
      { wave: 'pnoise', f0: 60, slide: -0.5, env: { s: 80, d: 450, punch: 0.6 }, lpf: [2500, 500], drive: 0.3 },
      thump(70, 320, { db: -1, slide: -2 }),
      { rec: 'softHeavy', rate: 0.6, db: -6 },
    ],
  },
  stomp: { db: -16, vary: 5, max: 1, layers: [{ rec: 'wood', rate: 0.8, len: 220 }, thump(110, 90, { db: -4 })] },
  crack: {
    db: -10, vary: 4, max: 2, duck: [-4, 300], layers: [
      { rec: 'mining', len: 500 },
      { wave: 'pnoise', f0: 80, slide: -0.6, env: { s: 40, d: 320, punch: 0.6 }, lpf: [2200, 500], drive: 0.3, db: -4 },
      thump(80, 220, { db: -2, slide: -2.5 }),
    ],
  },
  dot: { db: -22, vary: 8, max: 2, layers: [{ wave: 'sine', f0: 350, slide: -6, env: { d: 60 }, lpf: [2000] }] },
  stun: { db: -18, max: 2, layers: [sparkle('G6:60 A6:60 G6:60 A6:60 G6:60 A6:200', { db: 0 })] },
  freeze: { db: -15, vary: 3, max: 2, layers: [{ rec: 'glassHeavy', len: 500 }, sparkle('A6:30 C7:30 D7:30 B6:200', { db: -6 })] },
  roar: {
    db: -12, max: 1, duck: [-3, 400], layers: [
      { wave: 'saw', f0: 80, vib: [25, 6], env: { a: 20, s: 250, d: 300, punch: 0.4 }, lpf: [900], drive: 0.4 },
      { wave: 'pnoise', f0: 120, env: { a: 20, s: 250, d: 300 }, lpf: [900], db: -4 },
      { seq: 'C2+G2:500', inst: 'brass_section', db: -4 },
    ],
  },
  hook: { db: -16, max: 1, layers: [whoosh(150, 1500, 3500, { focus: 0.3 }), { rec: 'metal', rate: 1.3, len: 200, at: 100, db: -4 }, { rec: 'metalClick', at: 220, db: -6 }] },
  // ---------- Shots and spells ----------
  arrow: { db: -16, vary: 5, max: 3, layers: [{ seq: 'E3:80', inst: 'pizzicato_strings', db: -2, tail: 100 }, whoosh(140, 3000, 1500, { focus: 0.2, db: -2 })] },
  arrowHeavy: { db: -14, vary: 4, max: 2, layers: [{ seq: 'A2:100', inst: 'pizzicato_strings', tail: 120 }, whoosh(220, 2000, 900, { focus: 0.25 })] },
  star: { db: -17, vary: 5, max: 3, layers: [whoosh(110, 5000, 3000, { focus: 0.3 }), { rec: 'metal', rate: 1.8, len: 80, db: -10 }] },
  zap: { db: -16, vary: 4, max: 3, layers: [{ wave: 'saw', f0: 1200, slide: -5, env: { s: 40, d: 120, punch: 0.2 }, lpf: [5000], hpf: [300] }, sparkle('E7:60', { db: -12 })] },
  cast: {
    db: -14, vary: 2, max: 2, room: true, layers: [
      { wave: 'noise', env: { a: 250, s: 50, d: 100 }, hpf: [600, 3000], lpf: [1500, 7000], db: -6 },
      { seq: 'C5:60 E5:60 G5:60 C6:250', inst: 'celesta', db: -2 },
      { wave: 'sine', f0: 330, slide: 2.5, vib: [7, 3], env: { a: 15, s: 150, d: 200 }, db: -10 },
    ],
  },
  fire: { db: -14, vary: 5, max: 2, layers: [{ wave: 'pnoise', f0: 180, trem: [18, 50], env: { a: 20, s: 200, d: 250 }, lpf: [1500, 700] }, { wave: 'noise', env: { a: 60, s: 150, d: 250 }, hpf: [2000], lpf: [6000], trem: [30, 70], db: -10 }, thump(110, 200, { db: -6, slide: -0.6 })] },
  ice: { db: -15, vary: 3, max: 2, layers: [{ rec: 'glass', len: 400 }, sparkle('G6:30 A6:30 C7:30 D7:30 E7:200', { db: -4 })] },
  lightning: {
    db: -12, vary: 4, max: 2, duck: [-3, 200], layers: [
      { wave: 'noise', env: { s: 30, d: 180, punch: 0.6 }, lpf: [9000, 2000], hpf: [500], crush: 2 },
      { wave: 'saw', f0: 1600, slide: -12, env: { d: 120 }, lpf: [5000], db: -6 },
      thump(90, 220, { db: -4 }),
    ],
  },
  poison: { db: -16, vary: 6, max: 2, layers: [0, 70, 140, 210].map((at, i) => ({ wave: 'sine', f0: [330, 392, 294, 440][i], slide: 3, env: { d: 70 }, at, lpf: [2000] })) },
  holyChime: { db: -13, max: 2, room: true, layers: [{ seq: 'E6+B6:600', inst: 'glockenspiel' }, { seq: 'E5+G#5+B5:600', inst: 'choir_aahs', attack: 0.05, db: -8 }] },
  buff: { db: -13, max: 1, layers: [{ seq: 'G5:70 A5:70 B5:70 D6:300', synth: 'pluck', cut: 4000, ring: 0.3 }, whoosh(400, 400, 3000, { focus: 0.8, db: -10 })] },
  partyBuff: { db: -12, max: 1, room: true, layers: [{ seq: 'G4:70 C5:70 E5:70 G5:70 C6:400', inst: 'orchestral_harp' }, { seq: 'r:280 C5+E5+G5:600', inst: 'string_ensemble_1', attack: 0.05, db: -8 }, whoosh(450, 400, 3000, { focus: 0.8, db: -12 })] },
  gather: { db: -18, max: 1, layers: [{ wave: 'saw', f0: 220, slide: 2.6, vib: [14, 3], env: { a: 380, d: 40 }, lpf: [3000] }, { wave: 'noise', env: { a: 380, d: 40 }, hpf: [800, 3000], lpf: [2000, 6000], db: -8 }] },
  gatherHoly: { db: -18, max: 1, room: true, layers: [{ seq: 'C5+G5:420', inst: 'choir_aahs', attack: 0.3 }, { wave: 'sine', f0: 1568, slide: 1.2, env: { a: 380, d: 60 }, db: -10 }] },
  // ---------- The warrior paths ----------
  pillar: { db: -13, max: 2, room: true, layers: [{ rec: 'bell', len: 900, db: -2 }, { seq: 'E6+B6:700', inst: 'glockenspiel', db: -4 }, thump(165, 160, { db: -6 })] },
  aegis: { db: -13, max: 1, room: true, layers: [{ rec: 'metalHeavy', len: 500, db: -2 }, { seq: 'C5+G5+C6:500', inst: 'french_horn', db: -6 }] },
  consecrate: {
    db: -11, max: 1, room: true, duck: [-4, 600], layers: [
      thump(110, 360, { slide: -2 }),
      { seq: 'C5:50 E5:50 G5:50 C6:50 E6:500', inst: 'orchestral_harp', db: -4 },
      { seq: 'C5+E5+G5:800', inst: 'choir_aahs', attack: 0.05, db: -6 },
    ],
  },
  verdict: {
    db: -8, max: 1, room: true, duck: [-8, 1400], layers: [
      { wave: 'pnoise', f0: 60, slide: -0.5, env: { s: 100, d: 700, punch: 0.6 }, lpf: [2500, 500], drive: 0.3 },
      thump(65, 500, { slide: -1.5 }),
      { rec: 'plate', db: -6 },
      { seq: 'C4+G4+C5+E5:1100', inst: 'brass_section', db: -4, at: 60 },
      { seq: 'C7:1100', inst: 'glockenspiel', db: -8, at: 380 },
    ],
  },
  bloodmoon: { db: -13, max: 1, layers: [{ seq: 'F2+C3:1100', inst: 'string_ensemble_1', attack: 0.3 }, { wave: 'saw', f0: 55, vib: [5, 2], env: { a: 300, s: 500, d: 500 }, lpf: [500], db: -4 }] },
  eclipse: {
    db: -8, max: 1, duck: [-8, 1200], layers: [
      { wave: 'pnoise', f0: 55, slide: -0.5, env: { s: 100, d: 700, punch: 0.7 }, lpf: [2200, 400], drive: 0.5 },
      thump(60, 500, { slide: -1.5 }),
      { rec: 'punchHeavy', rate: 0.7, db: -4 },
      { seq: 'C2+Db2:900', inst: 'brass_section', db: -6 },
    ],
  },
  rageburst: { db: -10, max: 2, duck: [-4, 300], layers: [{ rec: 'punchHeavy', rate: 0.8 }, { wave: 'pnoise', f0: 70, slide: -0.6, env: { s: 40, d: 300, punch: 0.6 }, lpf: [2400, 600], drive: 0.4, db: -4 }] },
  berserk: {
    db: -10, max: 1, duck: [-5, 800], layers: [
      { seq: 'C2:60 C2:60 C2:60 C2:60 C2:60 C2:600', inst: 'timpani' },
      { seq: 'r:300 C3+G3+Db4:600', inst: 'brass_section', db: -3 },
      { wave: 'saw', f0: 80, slide: 1, vib: [25, 6], env: { a: 20, s: 450, d: 350, punch: 0.4 }, lpf: [1100], drive: 0.4, db: -8 },
    ],
  },
  sanctified: {
    db: -10, max: 1, room: true, duck: [-6, 1200], layers: [
      { seq: 'C5:70 E5:70 G5:70 C6:70 E6:70 G6:700', inst: 'orchestral_harp' },
      { seq: 'r:300 C5+E5+G5+C6:900', inst: 'choir_aahs', attack: 0.1, db: -4 },
      { seq: 'r:400 C7:800', inst: 'glockenspiel', db: -8 },
    ],
  },
  link: { db: -13, max: 1, layers: [{ seq: 'E6:40 B6:140', synth: 'pluck', cut: 6000, ring: 0.2, tail: 200 }, sparkle('r:40 E7:120', { db: -8 })] },
  // A ding for each tier of the hit counter: the same bell every time, a little higher per tier (sfx.js).
  tier: { db: -13, max: 1, layers: [{ seq: 'D7+A7:350', synth: 'bell' }] },
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
      { drum: 'K', at: 735, db: -6 },
    ],
  },
  questDone: {
    db: -9, max: 1, duck: [-9, 2100], layers: [
      { seq: 'E5:120 G5:120 C6:120 B5:120 A5:120 F5:120 D5:120 G5:120 C6:960', inst: 'flute' },
      { seq: 'C5:240 A4:240 F4:240 D5:240 E5:960', inst: 'orchestral_harp', db: -4 },
      { seq: 'C3:240 A2:240 F2:240 G2:240 C3:480', inst: 'pizzicato_strings', db: -2 },
      { seq: 'r:960 C4+E4+G4+C5:960', inst: 'string_ensemble_1', db: -6 },
      { seq: 'r:960 C7:600', inst: 'glockenspiel', db: -10 },
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
      { drum: '*', at: 2100, db: -14 },
    ],
  },
  // Healing: soft, an added sixth on top, no bass.
  healJingle: { db: -13, max: 1, duck: [-4, 800], layers: [{ seq: 'G4:90 C5:90 E5:90 A5:480', inst: 'orchestral_harp' }, { seq: 'E5:270 C6:480', inst: 'celesta', db: -4 }, { seq: 'r:270 C5+E5+A5:500', inst: 'string_ensemble_1', db: -10 }] },
  bossDefeated: {
    db: -7, max: 1, duck: [-12, 3300], layers: [
      { seq: 'A5:125 D6:125 F#6:250 r:125 Bb5:250 C6:250 D6:1500', inst: 'trumpet' },
      { seq: 'F#5:500 r:125 F5:250 G5:250 A5:1500', inst: 'french_horn', db: -4 },
      { seq: 'D4+F#4+A4:500 r:125 Bb3+D4+F4:250 C4+E4+G4:250 D4+F#4+A4+D5:1500', inst: 'string_ensemble_1', db: -4 },
      { seq: 'D3:500 r:125 Bb2:250 C3:250 D3:750', inst: 'pizzicato_strings', db: -2 },
      { seq: 'r:1125 D2:60 D2:60 D2:600', inst: 'timpani', db: -2 },
      { drum: '*', at: 1125, db: -14 },
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
  // Dancing Green's entrance: a rising sweep and a snare roll that speeds up, and a cymbal crash.
  riser: { db: -12, max: 1, layers: [{ wave: 'noise', env: { a: 1800, d: 60, curve: 1 }, lpf: [200, 7000, 2], db: -2 }, { wave: 'saw', f0: 82, slide: 2.4, env: { a: 1700, d: 120 }, lpf: [2000], db: -8 }] },
  roll: { db: -14, max: 1, layers: [0, 250, 500, 700, 850, 975, 1100, 1200, 1300, 1375, 1450, 1525, 1600, 1650, 1700, 1750, 1800, 1850].map((at, i) => ({ drum: 'S', at, db: -12 + i * 0.6 })) },
  crash: { db: -14, max: 2, layers: [{ drum: '*' }] },
  // ---------- Interface: real clicks, high, short and dry ----------
  click: { db: -14, max: 2, layers: [{ rec: 'click' }] },
  cursor: { db: -18, max: 2, layers: [{ rec: 'tick' }] },
  cancel: { db: -16, max: 2, layers: [{ rec: 'back' }] },
  open: { db: -16, max: 1, layers: [{ rec: 'open' }] },
  close: { db: -17, max: 1, layers: [{ rec: 'close' }] },
  denied: { db: -15, max: 1, layers: [{ rec: 'error' }] },
  // NPC voices: a soft round "boop" (rendered at C5 and played back at each speaker's pitch).
  blipTri: { db: -20, max: 1, layers: [{ wave: 'sine', f0: N.C5, overtones: [3, 0.25], env: { a: 3, s: 15, d: 35 }, lpf: [3000] }] },
  blipPulse: { db: -21, max: 1, layers: [{ wave: 'tri', f0: N.C5, slide: 0.6, env: { a: 2, s: 15, d: 30 }, lpf: [3500] }] },
  blipRasp: { db: -21, max: 1, layers: [{ wave: 'saw', f0: N.C5, env: { a: 2, s: 15, d: 30 }, lpf: [1500] }] },
};

export const RECIPES = R;
// How many variants of each recipe to keep: noisy or recorded ones vary, tonal ones are the same.
export const variantsOf = (name) => (R[name].layers.some((l) => l.rec || /noise/.test(l.wave ?? '')) ? 3 : 1);
