// Every sound effect as data for the synthesizer (synth.js), after the recipe table in
// docs/audio/research-sfx.md (section F) and the game's own needs. Units: Hz, ms, octaves per
// second (slide), dB. Each recipe: { layers, db (peak level once normalized), vary (± % random
// pitch per play), max (voices at once), duck (dB the music dips, with its hold in ms), room
// (send a little to the short room) }.
//
// The palette is cute and chip: triangle, sine and thin pulse waves, soft above 4-6 kHz, hit
// bodies at 300-700 Hz with a deep sub only on finishers, major and pentatonic sparkles, and a
// semitone drop only for "no".

const N = { G4: 392, A4: 440, B4: 494, C5: 523, D5: 587, E5: 659, F5: 698, G5: 784, A5: 880, B5: 988, C6: 1047, D6: 1175, E6: 1319, F6: 1397, G6: 1568, A6: 1760, B6: 1976, C7: 2093, E7: 2637, G7: 3136 };

// Chip instruments for the written jingles (FamiTracker-style macros at 60 frames a second:
// volume 0-15, duty 0 = 12.5%, 1 = 25%, 2 = 50%; `|` loops, `/` is where a released note goes).
const VIB = { delay: 7, rate: 5.5, cents: 20 };
const J = {
  lead25: { duty: '1', vol: '14 13 12 11 | 11 / 9 7 5 4 3 2 1 0', vib: VIB },
  lead50: { duty: '2', vol: '14 13 12 11 | 11 / 9 7 5 4 3 2 1 0', vib: VIB },
  lead12: { duty: '0', vol: '14 13 12 11 | 11 / 9 7 5 4 3 2 1 0', vib: VIB },
  harm: { duty: '2', vol: '10 9 9 8 | 8 / 6 5 4 3 2 1 0', vib: { delay: 9, rate: 5.5, cents: 12 } },
  soft: { duty: '2', vol: '6 8 9 9 | 9 / 7 5 4 3 2 1 0', vib: VIB, pitch: '0 0 0 0 1 2 3 4 5 6 7 8 9 10' },
  tri: { wave: 'tri', vol: '15 | 15 / 0', vib: { delay: 8, rate: 5.5, cents: 15 } },
  bass: { wave: 'tri', vol: '15 | 15 / 0', gate: 0.85 },
  tick: { wave: 'noise', vol: '8 4 2 0' },
  ui50: { duty: '2', vol: '13 10 7 5 3 2 1 0' },
  ui25: { duty: '1', vol: '13 10 7 5 3 2 1 0' },
  ui12: { duty: '0', vol: '12 8 4 2 0' },
  blip50: { duty: '2', vol: '11 10 8 | 8 / 5 3 1 0' },
  blip25: { duty: '1 0 | 1 0', vol: '12 11 9 | 9 / 6 3 1 0' },
  blipTri: { wave: 'tri', vol: '15 | 15 / 0' },
};

const R = {
  // ---------- Loot and progress ----------
  // Coins: a quick rising sixth on a thin pulse (sfx.js steps it up a semitone for each coin
  // picked up in a row, back down after six).
  coin: { db: -15, max: 3, layers: [{ seq: 'A6:35 F#7:100', inst: { duty: '0', vol: '13 12 10 8 6 4 3 2 1 0' }, tail: 120 }] },
  pickup: { db: -15, max: 3, layers: [{ seq: 'E6:35 A6:35 C#7:90', inst: { wave: 'tri', vol: '15 | 15 / 0' }, tail: 60 }, { seq: 'r:70 C#7:30', inst: { duty: '0', vol: '6 4 2 0' }, db: -6 }] },
  // ---------- Moving ----------
  jump: { db: -18, vary: 4, max: 1, layers: [{ wave: 'pulse', duty: 0.25, f0: 330, slide: 5, env: { s: 40, d: 90, punch: 0.2 }, lpf: [4000], hpf: [150] }] },
  land: { db: -18, vary: 6, max: 1, layers: [{ wave: 'pnoise', f0: 90, env: { d: 60 }, lpf: [900] }, { wave: 'sine', f0: 150, slide: -8, env: { s: 10, d: 70, punch: 0.4 }, lpf: [900] }] },
  landHard: {
    db: -13, vary: 5, max: 1, layers: [
      { wave: 'pnoise', f0: 90, env: { d: 80 }, lpf: [1200] },
      { wave: 'sine', f0: 150, slide: -8, env: { s: 15, d: 120, punch: 0.6 }, lpf: [1200] },
      { wave: 'sine', f0: 70, slide: -3, env: { s: 20, d: 160 }, db: -2 },
      { wave: 'lfsr', f0: 4000, env: { d: 8 }, db: -6 },
    ],
  },
  stepGrass: { db: -26, vary: 8, max: 2, layers: [{ wave: 'noise', env: { a: 2, d: 30 }, hpf: [500], lpf: [2400] }] },
  stepStone: { db: -25, vary: 8, max: 2, layers: [{ wave: 'noise', env: { a: 1, d: 25 }, hpf: [700], lpf: [3000] }, { wave: 'tri', f0: 900, env: { d: 6 }, db: -6 }] },
  stepWood: { db: -25, vary: 8, max: 2, layers: [{ wave: 'noise', env: { a: 1, d: 30 }, hpf: [300], lpf: [1600] }, { wave: 'tri', f0: 240, slide: -4, env: { d: 30 }, db: -4 }] },
  stepSand: { db: -26, vary: 10, max: 2, layers: [{ wave: 'noise', env: { a: 3, d: 45 }, hpf: [1500], lpf: [5000] }] },
  stepCloud: { db: -28, vary: 8, max: 2, layers: [{ wave: 'noise', env: { a: 4, d: 40 }, hpf: [200], lpf: [900] }] },
  stepCrystal: { db: -25, vary: 6, max: 2, layers: [{ wave: 'noise', env: { a: 1, d: 22 }, hpf: [800], lpf: [3200] }, { wave: 'sine', f0: 2349, env: { d: 60 }, db: -14 }] },
  climb: { db: -24, vary: 8, max: 1, layers: [{ wave: 'noise', env: { a: 2, d: 45 }, hpf: [400], lpf: [1100, 700, 4] }] },
  portal: {
    db: -15, max: 1, room: true, layers: [
      { wave: 'sine', f0: 300, slide: 2, vib: [7, 4], env: { a: 40, s: 400, d: 200 } },
      { wave: 'noise', env: { a: 60, s: 380, d: 200 }, hpf: [800, 2000], lpf: [2000, 4000], db: -10 },
    ],
  },
  dash: { db: -18, vary: 5, max: 1, layers: [{ wave: 'noise', len: 160, env: { bell: true, focus: 0.55 }, hpf: [1500, 3000], lpf: [3200, 6000] }] },
  blink: {
    db: -16, max: 1, room: true, layers: [
      { wave: 'noise', len: 180, env: { bell: true, focus: 0.3 }, hpf: [800, 4000], lpf: [3000, 7000] },
      { wave: 'sine', arp: [N.G6, N.C7, N.E7], arpStep: 30, env: { s: 60, d: 120 }, at: 40, db: -6, lpf: [7000] },
    ],
  },
  // ---------- Swings and blows ----------
  swing: {
    db: -18, vary: 5, max: 3, layers: [
      { wave: 'noise', len: 170, env: { bell: true, focus: 0.65 }, hpf: [2200, 900], lpf: [2400, 1000, 1.4] },
      { wave: 'sine', f0: 800, slide: -0.4, len: 170, env: { bell: true, focus: 0.65 }, db: -12 },
    ],
  },
  swingHeavy: {
    db: -15, vary: 4, max: 2, layers: [
      { wave: 'noise', len: 320, env: { bell: true, focus: 0.5 }, hpf: [1300, 400], lpf: [1500, 500, 1.4] },
      { wave: 'sine', f0: 400, slide: -0.6, len: 320, env: { bell: true, focus: 0.5 }, db: -12 },
      { wave: 'tri', f0: 180, slide: -0.7, len: 320, env: { bell: true, focus: 0.5 }, db: -10 },
    ],
  },
  thrust: { db: -18, vary: 5, max: 2, layers: [{ wave: 'noise', env: { d: 110 }, hpf: [1800, 3000], lpf: [2400, 4000] }, { wave: 'pulse', duty: 0.125, f0: 700, slide: -6, env: { d: 30 }, lpf: [6000], db: -4 }] },
  hit: {
    db: -12, vary: 5, max: 4, layers: [
      { wave: 'noise', env: { d: 5 }, hpf: [2000] },
      { wave: 'pulse', duty: 0.25, f0: 480, slide: -8, env: { s: 10, d: 60, punch: 0.5 }, lpf: [3500] },
    ],
  },
  hitMedium: {
    db: -11, vary: 5, max: 4, layers: [
      { wave: 'noise', env: { d: 5 }, hpf: [2000] },
      { wave: 'lfsr93', f0: 3000, env: { d: 3 }, db: -8 },
      { wave: 'pulse', duty: 0.25, f0: 420, slide: -8, env: { s: 12, d: 90, punch: 0.55 }, lpf: [4000] },
    ],
  },
  hitHeavy: {
    db: -9, vary: 4, max: 2, duck: [-4, 300], layers: [
      { wave: 'noise', env: { d: 6 }, hpf: [2000] },
      { wave: 'lfsr93', f0: 3000, env: { d: 3 }, db: -8 },
      { wave: 'pulse', duty: 0.25, f0: 380, slide: -8, env: { s: 20, d: 140, punch: 0.6 }, lpf: [3000] },
      { wave: 'sine', f0: 90, slide: -4, env: { s: 30, d: 150 }, db: -1 },
      { wave: 'noise', crush: 6, env: { d: 90 }, lpf: [2000], db: -6 },
    ],
  },
  crit: {
    db: -9, vary: 2, max: 2, layers: [
      { wave: 'noise', env: { d: 5 }, hpf: [2000] },
      { wave: 'pulse', duty: 0.25, f0: 420, slide: -8, env: { s: 12, d: 90, punch: 0.55 }, lpf: [4000] },
      { wave: 'tri', f0: N.A6, env: { a: 1, s: 20, d: 180 }, at: 15, db: -6, lpf: [7000] },
      { wave: 'tri', f0: N.E7, env: { a: 1, s: 20, d: 160 }, at: 15, db: -9, lpf: [7000] },
    ],
  },
  // Path and element colours, laid over a hit.
  holyHit: { db: -16, max: 2, room: true, layers: [{ wave: 'sine', f0: N.E6, overtones: [3, 0.25], env: { a: 1, d: 350 }, lpf: [6000] }, { wave: 'sine', f0: N.B6, env: { a: 1, d: 260 }, at: 40, db: -8 }] },
  rageHit: { db: -12, vary: 4, max: 2, layers: [{ wave: 'pulse', duty: 0.25, f0: 300, slide: -8, env: { s: 12, d: 90, punch: 0.5 }, lpf: [2500] }, { wave: 'noise', crush: 6, env: { d: 70 }, lpf: [2400], db: -4, drive: 0.4 }] },
  fireHit: { db: -15, vary: 5, max: 2, layers: [{ wave: 'pnoise', f0: 220, env: { s: 30, d: 140, punch: 0.3 }, lpf: [1800, 700] }] },
  iceHit: { db: -17, vary: 3, max: 2, layers: [{ wave: 'sine', f0: 1760, env: { a: 0, d: 110 }, lpf: [8000] }, { wave: 'sine', f0: 2349, env: { d: 90 }, at: 30, db: -4 }] },
  zapHit: { db: -17, vary: 4, max: 2, layers: [{ wave: 'pulse', duty: 0.125, f0: 1400, slide: -9, env: { d: 80 }, lpf: [5000] }, { wave: 'lfsr', f0: 6000, env: { d: 40 }, db: -6, hpf: [3000] }] },
  enemyHurt: { db: -16, vary: 8, max: 3, layers: [{ wave: 'pulse', duty: 0.5, f0: 700, slide: -10, env: { s: 10, d: 70, punch: 0.3 }, lpf: [3000], hpf: [200] }] },
  miss: { db: -20, vary: 6, max: 2, layers: [{ wave: 'noise', len: 90, env: { bell: true, focus: 0.4 }, hpf: [3000, 2000], lpf: [6000, 3500] }] },
  hurt: { db: -12, vary: 4, max: 1, layers: [{ wave: 'tri', f0: 560, slide: -6, vib: [18, 6], env: { s: 20, d: 120, punch: 0.3 }, lpf: [2500] }, { wave: 'noise', env: { d: 8 }, db: -6, lpf: [3000] }] },
  poof: {
    db: -14, vary: 6, max: 3, layers: [
      { wave: 'sine', f0: 500, slide: 21, env: { s: 10, d: 40 } },
      { wave: 'pnoise', f0: 400, env: { a: 2, s: 30, d: 180 }, lpf: [3000, 400], db: -3 },
    ],
  },
  boom: {
    db: -9, vary: 4, max: 2, duck: [-6, 500], layers: [
      { wave: 'pnoise', f0: 60, slide: -0.5, env: { s: 80, d: 450, punch: 0.6 }, lpf: [2500, 600], drive: 0.3 },
      { wave: 'sine', f0: 70, slide: -2, env: { s: 60, d: 300 }, db: -1 },
    ],
  },
  stomp: { db: -16, vary: 5, max: 1, layers: [{ wave: 'sine', f0: 110, slide: -5, env: { s: 10, d: 90, punch: 0.4 } }, { wave: 'pnoise', f0: 120, env: { d: 70 }, lpf: [900], db: -6 }] },
  crack: {
    db: -10, vary: 4, max: 2, duck: [-4, 300], layers: [
      { wave: 'pnoise', f0: 80, slide: -0.6, env: { s: 40, d: 320, punch: 0.6 }, lpf: [2200, 500], drive: 0.3 },
      { wave: 'sine', f0: 80, slide: -2.5, env: { s: 40, d: 220 }, db: -2 },
      { wave: 'pnoise', f0: 900, env: { d: 25 }, at: 40, lpf: [3000], db: -10 },
      { wave: 'pnoise', f0: 700, env: { d: 25 }, at: 90, lpf: [3000], db: -12 },
    ],
  },
  dot: { db: -22, vary: 8, max: 2, layers: [{ wave: 'pulse', duty: 0.5, f0: 350, slide: -10, env: { d: 50 }, lpf: [2000] }] },
  stun: { db: -18, max: 2, layers: [{ wave: 'sine', arp: [N.G6, N.A6, N.G6, N.A6, N.G6, N.A6, N.G6], arpStep: 60, env: { a: 5, s: 350, d: 50 }, lpf: [5000] }] },
  freeze: {
    db: -15, vary: 3, max: 2, layers: [
      ...[0, 30, 60, 90].map((at, i) => ({ wave: 'sine', f0: [1760, 2093, 2349, 1976][i], env: { d: 110 }, at, lpf: [8000] })),
      { wave: 'lfsr', f0: 5000, env: { d: 60 }, hpf: [4000], db: -14 },
    ],
  },
  roar: {
    db: -12, max: 1, duck: [-3, 400], layers: [
      { wave: 'pulse', duty: 0.125, f0: 80, vib: [25, 6], env: { a: 20, s: 250, d: 300, punch: 0.4 }, lpf: [900], drive: 0.4 },
      { wave: 'pnoise', f0: 120, env: { a: 20, s: 250, d: 300 }, lpf: [900], db: -4 },
      { wave: 'sine', f0: 50, env: { a: 20, s: 250, d: 300 }, db: -4 },
    ],
  },
  hook: {
    db: -16, max: 1, layers: [
      { wave: 'noise', len: 150, env: { bell: true, focus: 0.3 }, hpf: [1500, 2500], lpf: [4000] },
      ...[60, 110, 160, 210, 260].map((at, i) => ({ wave: 'lfsr93', f0: 3200 + i * 150, env: { d: 18 }, at, db: -4, lpf: [6000] })),
    ],
  },
  // ---------- Shots and spells ----------
  arrow: { db: -16, vary: 5, max: 3, layers: [{ wave: 'tri', f0: 720, slide: -2, env: { s: 5, d: 80 }, lpf: [5000] }, { wave: 'noise', env: { d: 90 }, hpf: [3000, 1500], lpf: [4500, 2500], db: -4 }] },
  arrowHeavy: { db: -14, vary: 4, max: 2, layers: [{ wave: 'tri', f0: 520, slide: -2, env: { s: 10, d: 110 }, lpf: [4000] }, { wave: 'noise', len: 200, env: { bell: true, focus: 0.25 }, hpf: [2000, 900], lpf: [3500, 1800] }] },
  star: { db: -17, vary: 5, max: 3, layers: [{ wave: 'noise', len: 110, env: { bell: true, focus: 0.3 }, hpf: [2800, 2000], lpf: [5000, 3500] }, { wave: 'tri', f0: N.E7, env: { d: 60 }, db: -10, lpf: [7000] }] },
  zap: { db: -16, vary: 4, max: 3, layers: [{ wave: 'pulse', duty: 0.25, dutySweep: 1.5, f0: 1200, slide: -5, env: { s: 40, d: 120, punch: 0.2 }, lpf: [5000], hpf: [300] }] },
  cast: {
    db: -14, vary: 2, max: 2, room: true, layers: [
      { wave: 'tri', f0: 330, slide: 2.5, vib: [7, 3], trem: [12, 30], env: { a: 15, s: 150, d: 200 }, lpf: [4500] },
      { wave: 'sine', f0: N.C7, env: { a: 1, d: 160 }, at: 180, db: -8, lpf: [7000] },
    ],
  },
  fire: { db: -14, vary: 5, max: 2, layers: [{ wave: 'pnoise', f0: 180, trem: [18, 50], env: { a: 20, s: 200, d: 250 }, lpf: [1500, 700] }, { wave: 'tri', f0: 110, slide: -0.6, env: { a: 20, s: 200, d: 250 }, db: -5 }] },
  ice: {
    db: -15, vary: 3, max: 2, layers: [
      ...[0, 30, 60, 90, 120].map((at, i) => ({ wave: 'sine', f0: [1568, 1760, 2093, 2349, 2637][(i * 3) % 5], env: { d: 110 }, at, lpf: [8000] })),
      { wave: 'lfsr', f0: 5000, env: { d: 60 }, hpf: [4000], db: -14 },
    ],
  },
  lightning: {
    db: -12, vary: 4, max: 2, duck: [-3, 200], layers: [
      { wave: 'lfsr', f0: 9000, env: { s: 30, d: 160, punch: 0.6 }, lpf: [7000, 2000], hpf: [500] },
      { wave: 'pulse', duty: 0.125, f0: 1600, slide: -12, env: { d: 120 }, lpf: [5000], db: -4 },
      { wave: 'sine', f0: 90, slide: -3, env: { s: 20, d: 200 }, db: -4 },
    ],
  },
  poison: { db: -16, vary: 6, max: 2, layers: [0, 70, 140, 210].map((at, i) => ({ wave: 'sine', f0: [330, 392, 294, 440][i], slide: 3, env: { d: 60 }, at, lpf: [2000] })) },
  holyChime: {
    db: -13, max: 2, room: true, layers: [
      { wave: 'sine', f0: N.E6, overtones: [4, 0.18], env: { a: 1, d: 700 }, lpf: [7000] },
      { wave: 'sine', f0: N.B6, overtones: [2, 0.15], env: { a: 1, d: 600 }, at: 60, db: -3, lpf: [7000] },
    ],
  },
  heal: {
    db: -14, max: 1, room: true, layers: [
      { wave: 'tri', arp: [N.C6, N.D6, N.E6, N.G6], arpStep: 45, env: { a: 10, s: 140, d: 250 }, lpf: [6000] },
      { wave: 'noise', env: { a: 60, s: 100, d: 250 }, hpf: [3000], lpf: [8000], db: -20 },
    ],
  },
  buff: { db: -13, max: 1, layers: [{ wave: 'pulse', duty: 0.25, f0: 392, slide: 4, repeat: 70, repeatSemis: 2, env: { s: 260, d: 200 }, lpf: [5000] }] },
  partyBuff: {
    db: -12, max: 1, room: true, layers: [
      { wave: 'pulse', duty: 0.25, f0: 392, slide: 4, repeat: 70, repeatSemis: 2, env: { s: 260, d: 200 }, lpf: [5000] },
      { wave: 'tri', arp: [N.G5, N.C6, N.E6], arpStep: 70, env: { s: 210, d: 300 }, at: 120, db: -6, lpf: [6000] },
    ],
  },
  gather: { db: -18, max: 1, layers: [{ wave: 'pulse', duty: 0.125, f0: 220, slide: 2.6, vib: [14, 3], env: { a: 380, d: 40 }, lpf: [3000] }, { wave: 'noise', env: { a: 380, d: 40 }, hpf: [800, 3000], lpf: [2000, 6000], db: -8 }] },
  gatherHoly: { db: -18, max: 1, room: true, layers: [{ wave: 'tri', f0: 392, slide: 2.4, vib: [9, 2], env: { a: 380, d: 40 }, lpf: [5000] }, { wave: 'sine', f0: 1568, slide: 1.2, env: { a: 380, d: 60 }, db: -10 }] },
  // ---------- The warrior paths ----------
  pillar: { db: -13, max: 2, room: true, layers: [{ wave: 'sine', f0: N.E7, slide: -3, env: { d: 120 }, lpf: [6000], db: -6 }, { wave: 'sine', f0: N.E6, overtones: [4, 0.2], env: { a: 1, d: 800 }, at: 90, lpf: [7000] }, { wave: 'sine', f0: 165, slide: -2, env: { s: 20, d: 160 }, at: 90, db: -6 }] },
  aegis: { db: -13, max: 1, room: true, layers: [{ wave: 'lfsr93', f0: 2400, env: { s: 10, d: 140, punch: 0.4 }, lpf: [4500], hpf: [1200], db: -4 }, { wave: 'sine', f0: N.C6, overtones: [3, 0.25], env: { a: 1, d: 500 } }, { wave: 'sine', f0: N.G6, env: { a: 1, d: 400 }, db: -6 }] },
  consecrate: {
    db: -11, max: 1, room: true, duck: [-4, 600], layers: [
      { wave: 'sine', f0: 110, slide: -2, env: { s: 40, d: 360, punch: 0.5 } },
      { wave: 'tri', arp: [N.C5, N.E5, N.G5, N.C6, N.E6], arpStep: 55, env: { a: 10, s: 300, d: 600 }, lpf: [6000], db: -6 },
      { wave: 'sine', f0: N.C7, overtones: [3, 0.2], env: { a: 1, d: 900 }, at: 120, db: -9 },
    ],
  },
  verdict: {
    db: -8, max: 1, room: true, duck: [-8, 1400], layers: [
      { wave: 'pnoise', f0: 60, slide: -0.5, env: { s: 100, d: 700, punch: 0.6 }, lpf: [2500, 500], drive: 0.3 },
      { wave: 'sine', f0: 65, slide: -1.5, env: { s: 80, d: 500 } },
      { wave: 'pulse', duty: 0.25, arp: [N.C5, N.G5, N.C6, N.E6, N.G6], arpStep: 70, vib: [6, 1.5], env: { a: 5, s: 400, d: 700 }, lpf: [5000], db: -6, at: 60 },
      { wave: 'sine', f0: N.C7, overtones: [4, 0.2], env: { a: 1, d: 1300 }, at: 380, db: -6 },
    ],
  },
  bloodmoon: { db: -13, max: 1, layers: [{ wave: 'pulse', duty: 0.125, f0: 55, vib: [5, 2], env: { a: 300, s: 500, d: 500 }, lpf: [500] }, { wave: 'pulse', duty: 0.125, f0: 58, env: { a: 300, s: 500, d: 500 }, lpf: [500], db: -4 }] },
  eclipse: {
    db: -8, max: 1, duck: [-8, 1200], layers: [
      { wave: 'pnoise', f0: 55, slide: -0.5, env: { s: 100, d: 700, punch: 0.7 }, lpf: [2200, 400], drive: 0.5 },
      { wave: 'sine', f0: 60, slide: -1.5, env: { s: 80, d: 500 } },
      { wave: 'noise', crush: 8, env: { s: 40, d: 260 }, lpf: [2500], db: -5, drive: 0.5 },
    ],
  },
  rageburst: {
    db: -10, max: 2, duck: [-4, 300], layers: [
      { wave: 'pnoise', f0: 70, slide: -0.6, env: { s: 40, d: 300, punch: 0.6 }, lpf: [2400, 600], drive: 0.4 },
      { wave: 'noise', crush: 6, env: { d: 140 }, lpf: [2600], db: -4, drive: 0.4 },
    ],
  },
  berserk: {
    db: -10, max: 1, duck: [-5, 800], layers: [
      { wave: 'pulse', duty: 0.125, f0: 80, slide: 1, vib: [25, 6], env: { a: 20, s: 450, d: 350, punch: 0.4 }, lpf: [1100], drive: 0.4 },
      { wave: 'pnoise', f0: 130, env: { a: 20, s: 450, d: 350 }, lpf: [1000], db: -5 },
      { wave: 'sine', f0: 50, env: { a: 20, s: 450, d: 350 }, db: -4 },
    ],
  },
  sanctified: {
    db: -10, max: 1, room: true, duck: [-6, 1200], layers: [
      { wave: 'tri', arp: [N.C5, N.E5, N.G5, N.C6, N.E6, N.G6], arpStep: 70, vib: [6, 1], env: { a: 10, s: 500, d: 700 }, lpf: [6000] },
      { wave: 'sine', f0: N.C7, overtones: [3, 0.2], env: { a: 1, d: 1200 }, at: 400, db: -6 },
    ],
  },
  link: { db: -13, max: 1, layers: [{ wave: 'pulse', duty: 0.25, arp: [N.E6, N.B6], arpStep: 55, env: { s: 80, d: 120, punch: 0.3 }, lpf: [6000] }] },
  tier: { db: -14, max: 1, layers: [{ wave: 'pulse', duty: 0.25, arp: [N.G5, N.C6, N.E6, N.G6], arpStep: 45, env: { s: 150, d: 150 }, lpf: [5500] }] },
  // ---------- Jingles (docs/audio/research-japanese.md, Part 5) ----------
  // Built like the Japanese RPG fanfares: a quick run of short notes that speeds into a long
  // landing note on the home note (or its fifth), reached by an upward leap and given vibrato;
  // a lead pulse, a second pulse a third or sixth under it, and a triangle bass tapping the roots.
  levelup: {
    db: -8, max: 1, duck: [-9, 1500], layers: [
      { seq: 'G4:70 B4:70 D5:70 G5:210 F5:105 A5:105 C6:105 D6:760', inst: J.lead25 },
      { seq: 'D4:210 B4:210 C5:315 B5:760', inst: J.harm, detune: 6, db: -4 },
      { seq: 'G2:70 r:70 G2:70 r:70 G2:70 r:70 F2:105 r:105 F2:105 G2:600', inst: J.bass },
      { seq: 'r:735 C7:30', inst: J.tick, db: -12 },
    ],
  },
  questDone: {
    db: -9, max: 1, duck: [-9, 2000], layers: [
      { seq: 'E5:120 G5:120 C6:120 B5:120 A5:120 F5:120 D5:120 G5:120 C6:960', inst: J.lead50 },
      { seq: 'C5:240 A4:240 F4:240 D5:240 E5:960', inst: J.harm, detune: 6, db: -4 },
      { seq: 'C3:240 A2:240 F2:240 G2:240 C3:480', inst: J.bass },
    ],
  },
  questAccept: {
    db: -12, max: 1, duck: [-6, 400], layers: [
      { seq: 'D6:70 G6:260', inst: J.lead25 },
      { seq: 'G3:260', inst: J.bass, db: -2 },
    ],
  },
  // Something rare drops: a bright arpeggio, a breath, then a climb to a long high note, echoed.
  rareDrop: {
    db: -11, max: 1, duck: [-8, 1200], layers: [
      { seq: 'C5:60 E5:60 G5:60 C6:60 r:60 D6:90 E6:90 G6:600', inst: J.lead25 },
      { seq: 'C5:60 E5:60 G5:60 C6:60 r:60 D6:90 E6:90 G6:600', inst: J.lead25, at: 120, db: -10, detune: 8 },
      { seq: 'C3:240 G2:240 C3:600', inst: J.bass },
    ],
  },
  // An item (or loot) to pick up: three quick notes and a leap to a ringing high A.
  itemGet: {
    db: -12, max: 1, duck: [-6, 600], layers: [
      { seq: 'A5:50 C#6:50 E6:50 A6:350', inst: J.lead12 },
      { seq: 'E5:150 C#6:350', inst: J.harm, detune: 6, db: -5 },
      { wave: 'noise', env: { d: 10 }, hpf: [4000], at: 150, db: -10 },
    ],
  },
  jobUp: {
    db: -7, max: 1, duck: [-10, 3600], layers: [
      { seq: 'C5:250 F5:250 A5:375 G5:125 Bb5:250 D6:250 C6:500 r:100 F6:1300', inst: J.lead50 },
      { seq: `A4:500 C5:500 D5:500 E5:500 r:100 ${'A5:33 G5:33 '.repeat(20)}A5:60`, inst: J.harm, detune: 6, db: -4 },
      { seq: 'F2:1000 Bb2:500 C3:500 r:100 F2:1300', inst: J.bass },
      { wave: 'noise', env: { a: 1, d: 400 }, hpf: [3000], lpf: [9000], at: 2100, db: -8 },
      { wave: 'sine', f0: 90, slide: -2, env: { s: 30, d: 200 }, at: 2100, db: -6 },
    ],
  },
  // Healing: soft, an added sixth on top, no bass.
  healJingle: {
    db: -13, max: 1, duck: [-4, 700], layers: [
      { seq: 'G4:90 C5:90 E5:90 A5:480', inst: J.soft },
      { seq: 'E5:270 C6:480', inst: J.tri, db: -3 },
    ],
  },
  bossDefeated: {
    db: -7, max: 1, duck: [-12, 3200], layers: [
      { seq: 'A5:125 D6:125 F#6:250 r:125 Bb5:250 C6:250 D6:1500', inst: J.lead50 },
      { seq: 'F#5:500 r:125 F5:250 G5:250 A5:1500', inst: J.harm, detune: 6, db: -4 },
      { seq: 'D3:500 r:125 Bb2:250 C3:250 D3:750', inst: J.bass },
      { wave: 'noise', env: { a: 1, d: 700 }, hpf: [3000], lpf: [9000], at: 1125, db: -8 },
    ],
  },
  // Fainting: a falling triad and a sad leading note, resting gently on the home note.
  death: {
    db: -10, max: 1, duck: [-12, 2200], layers: [
      { seq: 'A5:220 F5:220 D5:220 C#5:400 D5:800', inst: J.tri },
      { seq: 'F4:660 E4:400 F4:800', inst: J.harm, db: -8 },
    ],
  },
  // A boss changes phase: a riser, a zigzag climbing by whole steps, a gap, then a hit.
  phase: {
    db: -9, max: 1, duck: [-8, 1400], layers: [
      { wave: 'noise', env: { a: 880, d: 20 }, lpf: [400, 8000, 1.2], db: -4 },
      { seq: 'r:380 C5:65 D5:65 C5:65 E5:65 D5:65 F#5:65 E5:65 G#5:65', inst: J.lead25, db: -3 },
      { seq: 'r:960 C6:200', inst: J.lead50 },
      { seq: 'r:960 C5:200', inst: J.harm },
      { wave: 'sine', f0: 110, slide: -3, env: { s: 20, d: 220, punch: 0.5 }, at: 960 },
      { wave: 'noise', env: { a: 1, d: 500 }, hpf: [3000], at: 960, db: -8 },
    ],
  },
  // A chime for each tier of the hit counter: one bell-like ding, the same pitch every time so
  // it becomes a cue (two sines a fifth apart), stepping up a little per tier (in sfx.js).
  tier: { db: -13, max: 1, layers: [{ wave: 'sine', f0: 2349, env: { a: 2, d: 350 } }, { wave: 'sine', f0: 3520, env: { a: 2, d: 300 }, db: -6 }] },
  link: { db: -13, max: 1, layers: [{ seq: 'E6:40 B6:120', inst: J.lead25 }, { seq: 'r:40 E7:30', inst: J.tick, db: -10 }] },
  // Dancing Green's entrance: a rising sweep and a snare roll that speeds up as the red energy
  // gathers, and a cymbal crash.
  riser: {
    db: -12, max: 1, layers: [
      { wave: 'noise', env: { a: 1800, d: 60, curve: 1 }, lpf: [200, 7000, 2], db: -2 },
      { wave: 'pulse', duty: 0.25, f0: 82, slide: 2.4, env: { a: 1700, d: 120 }, lpf: [2000], db: -8 },
    ],
  },
  roll: { db: -16, max: 1, layers: [0, 250, 500, 700, 850, 975, 1100, 1200, 1300, 1375, 1450, 1525, 1600, 1650, 1700, 1750, 1800, 1850].map((at, i) => ({ wave: 'lfsr', f0: 4000, env: { d: 70 }, lpf: [5000], hpf: [500], at, db: -10 + i * 0.6 })) },
  crash: { db: -14, max: 2, layers: [{ wave: 'lfsr', f0: 12000, env: { a: 1, d: 1400, curve: 2 }, hpf: [3500], lpf: [11000] }] },
  // ---------- Interface: high, tiny and dry, peaking at once ----------
  click: { db: -15, max: 2, layers: [{ seq: 'E6:20 B6:55', inst: J.ui50, tail: 60 }] },
  cursor: { db: -18, max: 2, layers: [{ seq: 'A6:22', inst: J.ui12, tail: 40 }] },
  cancel: { db: -18, max: 2, layers: [{ seq: 'A5:30 E5:50', inst: J.ui50, tail: 60 }] },
  open: { db: -16, max: 1, layers: [{ seq: 'D6:25 F#6:25 A6:40', inst: J.ui25, tail: 60 }] },
  close: { db: -17, max: 1, layers: [{ seq: 'A6:20 F#6:20 D6:30', inst: J.ui25, tail: 60 }] },
  denied: { db: -15, max: 1, layers: [{ seq: 'C#4:60 r:40 C#4:60', inst: J.ui50, tail: 40 }, { seq: 'C#4:60 r:40 C#4:60', inst: J.ui50, detune: 30, tail: 40, db: -2 }] },
  // Text blips: rendered at a reference pitch (C5) and played back at each speaker's pitch.
  blipPulse: { db: -21, max: 1, layers: [{ seq: 'C5:40', inst: J.blip50, tail: 30, lpf: [2400] }] },
  blipTri: { db: -19, max: 1, layers: [{ seq: 'C5:42', inst: J.blipTri, tail: 30 }] },
  blipRasp: { db: -21, max: 1, layers: [{ seq: 'C5:40', inst: J.blip25, tail: 30, lpf: [2000] }] },
};

export const RECIPES = R;
// How many variants of each recipe to keep (noisy ones vary; tonal ones are identical anyway).
export const variantsOf = (name) => (R[name].layers.some((l) => /noise|lfsr/.test(l.wave)) ? 3 : 1);
