// The music: one written song per area, for the chip tracker (tracker.js). Every melody here is
// written out note by note (none of it is generated), after the arrangements and area recipes in
// docs/audio/research-music.md and the jingle and boss rules in research-japanese.md:
// - Two voices carry the tune (a lead pulse and an echo or harmony a third below), the triangle
//   plays the bass, and the noise channel the drums, so effects never mask the melody.
// - Each area has its own key, mode and tempo: a cozy swung C major in town, a running D dorian in
//   the meadows, a lilting 6/8 at the harbor, an E Phrygian desert in the crags, a waltz in the
//   mage grove, a glassy A minor in the cave, an airy D Lydian in the sky, a grumbling C minor in
//   the Hollow, and a galloping harmonic minor for bosses.
// - Songs are built from 8-bar sections (A A B A and the like) whose last bar leads back to the
//   first, so the loop never shows its seam.
// - Dancing Green's stage has his own disco song, "Funky Fever", at 120 bpm to match the stage's
//   lights, with a muffled groove and a heartbeat for his entrance, and the same song a whole step
//   up with doubled hats and a drive for his Hi-NRG Fever.

// ---------- Helpers for writing patterns ----------
const bars = (...b) => b.join(' | ');
const times = (s, n) => Array(n).fill(s).join(' | ');
// Root-fifth bounce on the beats (the cozy bass).
const bounce = (r, f) => `${r}:3 r:1 ${f}:3 r:1 ${r}:3 r:1 ${f}:3 r:1`;
// Octave pump in eighths (the running and disco bass).
const pump = (lo, hi, n = 4) => Array(n).fill(`${lo}:2 ${hi}:2`).join(' ');
// Two half notes.
const halves = (a, b) => `${a}:8 ${b}:8`;
// A 16-row bar of the same chord stab on the offbeat eighths.
const stabs = (n, inst) => `@${inst} r:2 ${n}:2 r:2 ${n}:2 r:2 ${n}:2 r:2 ${n}:2`;

const NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];
const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
// Moves every note in a pattern by `n` semitones.
function shift(src, n) {
  return src.replace(/\b([A-G])([#b]?)(-?\d):/g, (_, l, acc, oct) => {
    const m = 12 * (Number(oct) + 1) + NOTE[l] + (acc === '#' ? 1 : acc === 'b' ? -1 : 0) + n;
    return `${NAMES[m % 12]}${Math.floor(m / 12) - 1}:`;
  });
}

// ---------- Instruments (volume 0-15 per 60th of a second; duty 0 = 12.5%, 1 = 25%, 2 = 50%) ----------
const VIB = (delay, rate, cents) => ({ delay, rate, cents });
const I = {
  lead: { duty: '2', vol: '11 10 9 9 8 | 8 / 6 4 2 0', vib: VIB(18, 5, 15) },
  lead25: { duty: '1', vol: '12 11 10 10 9 | 9 / 7 5 3 1 0', vib: VIB(16, 5.5, 18) },
  lead12: { duty: '0', vol: '10 9 8 8 7 | 7 / 5 4 3 2 1 0', vib: VIB(20, 4.5, 22) },
  run: { duty: '2 1 | 1', vol: '13 12 11 10 | 10 / 7 4 2 0', vib: VIB(14, 5.6, 20), slideIn: { semis: -2, frames: 2 } },
  boss: { duty: '2 1 | 1', vol: '14 13 12 | 12 / 9 6 3 0', vib: VIB(10, 6, 35), slideIn: { semis: -1, frames: 2 } },
  bossLong: { duty: '1', vol: '13 12 12 | 11 / 8 5 3 0', vib: VIB(8, 5.5, 40) },
  brass: { duty: '1 2 | 1', vol: '13 12 11 | 10 / 7 4 0', vib: VIB(16, 5.5, 20) },
  pluck: { duty: '0', vol: '12 10 8 6 5 4 3 2 1 0' },
  soft: { duty: '2', vol: '6 8 9 9 8 | 8 / 6 4 2 0', vib: VIB(20, 4.5, 15) },
  echo: { duty: '0', vol: '11 10 9 9 8 | 8 / 6 4 2 0' },
  harm: { duty: '2', vol: '7 6 6 | 5 / 3 1 0' },
  pad: { duty: '1', vol: '3 5 6 7 7 | 7 / 6 5 4 3 2 1 0', vib: VIB(24, 4, 10) },
  arpMaj: { duty: '2', vol: '9 8 7 | 6 / 3 0', arp: '| 0 4 7' },
  arpMin: { duty: '2', vol: '9 8 7 | 6 / 3 0', arp: '| 0 3 7' },
  bedMaj: { duty: '0', vol: '6 6 5 | 5 / 3 1 0', arp: '| 0 4 7 12', arpSpeed: 2 },
  bedMin: { duty: '0', vol: '6 6 5 | 5 / 3 1 0', arp: '| 0 3 7 12', arpSpeed: 2 },
  sparkMaj: { duty: '0', vol: '8 7 6 | 6 / 0', arp: '| 0 4 7 12' },
  sparkMin: { duty: '0', vol: '8 7 6 | 6 / 0', arp: '| 0 3 7 12' },
  wave: { wave: 'wave', vol: '15 | 15 / 8 4 0', vib: VIB(20, 4.5, 22) },
  waveBass: { wave: 'wave', vol: '15 | 15 / 0', gate: 0.85 },
  bass: { wave: 'tri', vol: '15 | 15 / 0', gate: 0.75 },
  bassShort: { wave: 'tri', vol: '15 | 15 / 0', gate: 0.5 },
  bassFull: { wave: 'tri', vol: '15 | 15 / 0', gate: 0.95 },
  bassDisco: { wave: 'tri', vol: '15 | 15 / 0', gate: 0.45 },
};

// ---------- Town: "Morning Bread" (C major, swung, cozy) ----------
const town = {
  name: 'town', bpm: 100, swing: 0.58, inst: I, drums: 0.7,
  voices: { p1: 'lead', p2: 'harm', tri: 'bass' },
  patterns: {
    A: {
      p1: bars('E5:4 G5:2 E5:2 D5:4 C5:4', 'A4:4 C5:4 E5:8', 'F5:4 A5:2 F5:2 E5:4 D5:4', 'G4:4 B4:4 D5:8', 'E5:4 G5:2 E5:2 D5:4 C5:4', 'A5:4 G5:2 E5:2 C5:4 E5:4', 'F5:4 E5:2 D5:2 B4:4 D5:4', 'C5:12 r:4'),
      p2: { echo: { rows: 3, gain: 0.4, cents: 7, inst: 'echo' } },
      tri: bars(bounce('C3', 'G2'), bounce('A2', 'E2'), bounce('F2', 'C3'), bounce('G2', 'D3'), bounce('C3', 'G2'), bounce('A2', 'E2'), 'D3:3 r:1 A2:3 r:1 G2:3 r:1 D3:3 r:1', 'C3:3 r:1 G2:3 r:1 C3:8'),
      noise: bars(times('K...h.h.S...h.hh', 7), 'K...h.h.S.S.SSSS'),
    },
    B: {
      p1: bars('A5:6 G5:2 F5:4 E5:4', 'D5:6 E5:2 F5:4 G5:4', 'B5:6 A5:2 G5:4 E5:4', 'C6:8 A5:8', 'F5:4 A5:4 D6:4 C6:4', 'B5:4 G5:4 F5:4 D5:4', 'E5:8 G5:4 C6:4', 'C6:12 r:4'),
      p2: bars(halves('F5', 'C5'), halves('B4', 'D5'), halves('G5', 'E5'), halves('E5', 'C5'), halves('D5', 'F5'), halves('F5', 'D5'), halves('C5', 'E5'), 'E5:12 r:4'),
      tri: bars(bounce('F2', 'C3'), bounce('G2', 'D3'), bounce('E2', 'B2'), bounce('A2', 'E2'), bounce('D3', 'A2'), bounce('G2', 'D3'), bounce('C3', 'G2'), 'C3:3 r:1 G2:3 r:1 C3:3 r:1 G2:4'),
      noise: bars(times('K...h.h.S...h.hh', 7), 'K...h.h.S.S.SSSS'),
    },
  },
  order: ['A', 'A', 'B', 'A'],
};

// ---------- Meadows: "Meadow Run" (D dorian, running) ----------
const meadow = {
  name: 'meadow', bpm: 138, inst: I, drums: 0.8,
  voices: { p1: 'run', p2: 'harm', tri: 'bassShort' },
  patterns: {
    A: {
      p1: bars('D5:3 F5:3 A5:2 G5:4 F5:2 E5:2', 'D5:3 B4:3 D5:2 G5:8', 'D5:3 F5:3 A5:2 C6:4 A5:2 F5:2', 'G5:6 B5:2 A5:4 G5:4', 'F5:3 D5:3 F5:2 Bb5:4 A5:2 G5:2', 'E5:3 C5:3 E5:2 G5:4 F5:2 E5:2', 'F5:3 E5:3 D5:2 A4:4 D5:2 F5:2', 'E5:8 C#5:4 A4:4'),
      p2: bars(stabs('D5', 'arpMin'), stabs('G4', 'arpMaj'), stabs('D5', 'arpMin'), stabs('G4', 'arpMaj'), '@harm D5:3 Bb4:3 D5:2 G5:4 F5:2 E5:2', 'C5:3 A4:3 C5:2 E5:4 D5:2 C5:2', 'D5:3 C5:3 A4:2 F4:4 A4:2 D5:2', 'C#5:8 A4:4 E4:4'),
      tri: bars(pump('D2', 'D3'), pump('G2', 'G3'), pump('D2', 'D3'), pump('G2', 'G3'), pump('Bb1', 'Bb2'), pump('C2', 'C3'), pump('D2', 'D3'), pump('A1', 'A2')),
      noise: bars(times('K.h.S.h.K.hKS.h.', 7), 'K.h.S.h.S.SSt.t.'),
    },
    B: {
      p1: bars('@lead D5:4 F5:4 Bb4:6 C5:2', 'E5:4 G5:4 C5:8', 'r:16', 'r:16', 'F5:4 D5:2 F5:2 Bb5:4 A5:4', 'G5:4 E5:2 G5:2 C6:8', 'B5:4 G#5:4 E5:4 B4:4', 'C#5:4 E5:4 A5:8'),
      p2: bars(stabs('Bb4', 'arpMaj'), stabs('C5', 'arpMaj'), '@lead C5:4 E5:4 A4:6 B4:2', 'C5:4 D5:4 A4:8', stabs('Bb4', 'arpMaj'), stabs('C5', 'arpMaj'), stabs('E4', 'arpMaj'), stabs('A4', 'arpMaj')),
      tri: bars(pump('Bb1', 'Bb2'), pump('C2', 'C3'), pump('A1', 'A2'), pump('D2', 'D3'), pump('Bb1', 'Bb2'), pump('C2', 'C3'), pump('E2', 'E3'), pump('A1', 'A2')),
      noise: bars(times('K.h.S.h.K.hKS.h.', 7), 'K.h.S.h.S.SSt.t.'),
    },
  },
  order: ['A', 'A', 'B', 'A'],
};

// ---------- The crystal cave: "Glass Hollow" (A minor, slow, echoing) ----------
const caveLine = bars('r:4 E5:4 B5:6 A5:2', 'C6:8 B5:4 E5:4', 'A5:6 G5:2 E5:8', 'D5:12 r:4', 'r:4 C5:4 F5:4 A5:4', 'B5:8 G5:4 E5:4', 'F5:6 E5:2 D5:4 F5:4', 'G#5:8 B5:4 E5:4');
const caveBass = bars(halves('A2', 'E2'), halves('F2', 'C3'), halves('A2', 'E2'), halves('G2', 'D2'), halves('F2', 'C3'), halves('E2', 'B2'), halves('D2', 'A2'), 'E2:16');
const cave = {
  name: 'cave', bpm: 76, inst: I, drums: 0.8,
  voices: { p1: 'lead25', p2: 'echo', tri: 'bassFull' },
  patterns: {
    A: { p1: caveLine, p2: { echo: { rows: 3, gain: 0.45, cents: 10, inst: 'echo' } }, tri: caveBass, noise: '........x.......|............x...' },
    A2: { p1: `@lead12 ${shift(caveLine, 12)}`, p2: { echo: { rows: 3, gain: 0.45, cents: 10, inst: 'echo' } }, tri: caveBass, noise: '........x.......|....x.......x...' },
  },
  order: ['A', 'A2'],
};

// ---------- Bosses: "Crystal King" (C harmonic minor, galloping) ----------
const gallop = (r) => `${r}2:2 ${r}2:1 ${r}2:1 ${r}3:2 ${r}2:2 ${r}2:2 ${r}2:1 ${r}2:1 ${r}3:2 ${r}2:2`;
const boss = {
  name: 'boss', bpm: 168, inst: I,
  voices: { p1: 'boss', p2: 'arpMin', tri: 'bassShort' },
  patterns: {
    sting: { p1: 'C6:2 G5:2 Eb5:2 C5:2 B4:4 G4:4', tri: 'C2:4 C2:4 G1:8', noise: 'B...B...S.S.SSSS' },
    A: {
      p1: bars('C5:2 C5:2 G5:4 F5:2 Eb5:2 D5:2 Eb5:2', 'C5:2 C5:2 G5:4 Ab5:4 G5:4', 'Ab5:4 G5:2 F5:2 Eb5:4 C5:4', 'D5:4 F5:4 Bb5:8', 'C6:2 C6:2 G5:4 F5:2 Eb5:2 D5:2 Eb5:2', 'C6:2 Bb5:2 G5:4 Eb6:4 D6:4', 'C6:4 Ab5:4 D6:4 Bb5:4', 'B5:8 D6:4 G5:4'),
      p2: bars(stabs('C5', 'arpMin'), stabs('C5', 'arpMin'), stabs('Ab4', 'arpMaj'), stabs('Bb4', 'arpMaj'), stabs('C5', 'arpMin'), stabs('C5', 'arpMin'), '@arpMaj r:2 Ab4:2 r:2 Ab4:2 r:2 Bb4:2 r:2 Bb4:2', stabs('G4', 'arpMaj')),
      tri: bars(gallop('C'), gallop('C'), gallop('Ab'), gallop('Bb'), gallop('C'), gallop('C'), 'Ab2:2 Ab2:1 Ab2:1 Ab3:2 Ab2:2 Bb2:2 Bb2:1 Bb2:1 Bb3:2 Bb2:2', 'G1:2 G1:1 G1:1 G2:2 G1:2 G1:2 G1:1 G1:1 G2:2 G1:2'),
      noise: bars(times('K.hhS.hKK.hhS.hh', 7), 'S.S.SSSSt.t.ttSS'),
    },
    B: {
      p1: bars('@bossLong F5:8 Ab5:8', 'C6:16', 'Db6:8 C6:4 Bb5:4', 'Bb5:12 G5:4', 'Ab5:8 C6:8', 'D6:8 F6:8', 'Eb6:4 D6:4 B5:8', 'G5:12 @boss G5:2 B5:2'),
      p2: bars('@harm Ab4:8 C5:8', 'Eb5:16', 'F5:8 Eb5:4 Db5:4', 'Db5:12 Bb4:4', 'C5:8 Eb5:8', 'F5:8 Ab5:8', 'G5:4 F5:4 D5:8', 'B4:16'),
      tri: bars(gallop('F'), gallop('F'), 'Db2:2 Db2:1 Db2:1 Db3:2 Db2:2 Db2:2 Db2:1 Db2:1 Db3:2 Db2:2', gallop('Eb'), 'Ab1:2 Ab1:1 Ab1:1 Ab2:2 Ab1:2 Ab1:2 Ab1:1 Ab1:1 Ab2:2 Ab1:2', 'Bb1:2 Bb1:1 Bb1:1 Bb2:2 Bb1:2 Bb1:2 Bb1:1 Bb1:1 Bb2:2 Bb1:2', 'G1:2 G1:1 G1:1 G2:2 G1:2 G1:2 G1:1 G1:1 G2:2 G1:2', 'G1:2 G1:1 G1:1 G2:2 G1:2 G1:2 G1:1 G1:1 G2:2 G1:2'),
      noise: bars(times('K.hhS.hKK.hhS.hh', 7), 'S.S.SSSSt.t.ttSS'),
    },
  },
  intro: ['sting'],
  order: ['A', 'A', 'B', 'A'],
};

// ---------- Title (C major, gentle, with a fanfare pickup) ----------
const titleA = ['G5:6 E5:2 C6:4 G5:4', 'A5:6 G5:2 E5:8', 'F5:4 A5:4 C6:4 A5:4', 'B5:6 A5:2 G5:8', 'A5:6 C6:2 E6:4 C6:4', 'D6:6 B5:2 G5:4 F5:4'];
const titleBass = [halves('C3', 'G2'), halves('A2', 'E2'), halves('F2', 'C3'), halves('G2', 'D3'), halves('F2', 'C3'), halves('G2', 'D3'), halves('E2', 'A2'), halves('D3', 'G2')];
const title = {
  name: 'title', bpm: 108, inst: I,
  voices: { p1: 'lead25', p2: 'echo', tri: 'bassFull' },
  patterns: {
    pickup: { p1: 'r:10 G4:2 C5:2 E5:2', tri: 'r:16' },
    A: { p1: bars(...titleA, 'E5:4 G5:4 A5:4 C6:4', 'D6:8 B5:4 G5:4'), p2: { echo: { rows: 3, gain: 0.38, cents: 7, inst: 'echo' } }, tri: bars(...titleBass), noise: '................|................|................|................|................|................|................|........h...h.h.' },
    A2: { p1: bars(...titleA, 'C6:4 B5:4 A5:4 E5:4', 'F5:4 A5:4 B5:4 D6:4'), p2: { echo: { rows: 3, gain: 0.38, cents: 7, inst: 'echo' } }, tri: bars(...titleBass), noise: 'K.......h.......|K.......h.......' },
  },
  intro: ['pickup'],
  order: ['A', 'A2'],
};

// ---------- The harbor (F major, a lilting 6/8) ----------
const harbor = {
  name: 'harbor', bpm: 104, rows: 12, inst: I, drums: 0.7,
  voices: { p1: 'lead', p2: 'echo', tri: 'bass' },
  patterns: {
    A: {
      p1: bars('C5:4 F5:2 A5:4 G5:2', 'F5:4 D5:2 Bb4:6', 'C5:4 E5:2 G5:4 Bb5:2', 'A5:6 F5:4 r:2', 'A5:4 F5:2 D5:4 F5:2', 'G5:4 Bb5:2 D6:4 C6:2', 'Bb5:4 A5:2 G5:4 E5:2', 'G5:4 Bb5:2 C6:6'),
      p2: { echo: { rows: 3, gain: 0.4, cents: 7, inst: 'echo' } },
      tri: bars('F2:5 r:1 C3:5 r:1', 'Bb2:5 r:1 F2:5 r:1', 'C3:5 r:1 G2:5 r:1', 'F2:5 r:1 C3:5 r:1', 'D3:5 r:1 A2:5 r:1', 'G2:5 r:1 D3:5 r:1', 'C3:5 r:1 G2:5 r:1', 'C3:5 r:1 E2:5 r:1'),
      noise: 'K...h.S...h.',
    },
    B: {
      p1: bars('D6:6 C6:4 Bb5:2', 'A5:6 F5:6', 'Bb5:4 A5:2 G5:4 F5:2', 'E5:6 C5:6', 'D5:4 F5:2 Bb5:4 D6:2', 'C6:4 A5:2 F5:4 A5:2', 'G5:4 Bb5:2 E5:4 G5:2', 'F5:12'),
      p2: bars('@harm Bb5:6 A5:6', 'F5:6 C5:6', 'G5:6 D5:6', 'C5:6 G4:6', 'Bb4:6 F5:6', 'A5:6 F5:6', 'E5:6 C5:6', 'A4:12'),
      tri: bars('Bb2:5 r:1 F2:5 r:1', 'F2:5 r:1 C3:5 r:1', 'G2:5 r:1 D3:5 r:1', 'C3:5 r:1 G2:5 r:1', 'Bb2:5 r:1 F2:5 r:1', 'F2:5 r:1 A2:5 r:1', 'G2:5 r:1 C3:5 r:1', 'F2:5 r:1 C3:5 r:1'),
      noise: bars(times('K...h.S...h.', 7), 'K...h.S.S.SS'),
    },
  },
  order: ['A', 'A', 'B', 'A'],
};

// ---------- The crags (E Phrygian dominant, a desert march with toms) ----------
const crag = {
  name: 'crag', bpm: 112, inst: I, drums: 0.8,
  voices: { p1: 'lead25', p2: 'echo', tri: 'bass' },
  patterns: {
    A: {
      p1: bars('E5:2 F5:2 G#5:4 F5:2 E5:2 B4:4', 'A5:4 G#5:2 F5:2 E5:8', 'G#5:2 A5:2 B5:4 C6:2 B5:2 A5:4', 'G#5:4 F5:4 E5:8', 'E6:4 D6:2 C6:2 B5:4 A5:4', 'C6:4 B5:2 A5:2 G#5:4 F5:4', 'A5:2 G#5:2 F5:4 D5:4 F5:4', 'E5:12 r:4'),
      p2: { echo: { rows: 2, gain: 0.35, cents: 9, inst: 'echo' } },
      tri: bars('E2:4 E2:2 E2:2 B2:4 E2:4', 'F2:4 F2:2 F2:2 C3:4 F2:4', 'E2:4 E2:2 E2:2 B2:4 E2:4', 'D2:4 D2:4 E2:4 E2:4', 'E2:4 E2:2 E2:2 B2:4 E2:4', 'F2:4 F2:2 F2:2 C3:4 F2:4', 'D2:4 D2:2 D2:2 A2:4 D2:4', 'E2:4 E2:2 E2:2 B1:4 E2:4'),
      noise: bars(times('K.x.x.t.K.xt.xt.', 7), 'K.x.t.t.t.t.tttt'),
    },
    B: {
      p1: bars('@pluck B4:2 E5:2 G#5:2 B5:2 C6:4 B5:4', 'A5:2 F5:2 D5:2 F5:2 A5:8', 'G#5:2 E5:2 B4:2 E5:2 G#5:4 A5:4', 'B5:16', '@lead25 C6:6 B5:2 A5:4 G#5:4', 'A5:6 G#5:2 F5:4 E5:4', 'F5:4 E5:4 D5:4 C5:4', 'B4:8 E5:8'),
      p2: bars('@pad E4:16', 'F4:16', 'E4:16', 'G#4:16', 'A4:16', 'F4:16', 'D4:16', 'E4:16'),
      tri: bars('E2:4 E2:2 E2:2 B2:4 E2:4', 'D2:4 D2:2 D2:2 A2:4 D2:4', 'E2:4 E2:2 E2:2 B2:4 E2:4', 'E2:4 E2:2 E2:2 B2:4 E2:4', 'A2:4 A2:2 A2:2 E2:4 A2:4', 'F2:4 F2:2 F2:2 C3:4 F2:4', 'D2:4 D2:2 D2:2 A2:4 D2:4', 'E2:4 E2:2 E2:2 B1:4 E2:4'),
      noise: bars(times('K.x.x.t.K.xt.xt.', 7), 'K.x.t.t.t.t.tttt'),
    },
  },
  order: ['A', 'A', 'B', 'A'],
};

// ---------- The forest (D dorian, gentle; hats only, a Game Boy wave bass) ----------
const forest = {
  name: 'forest', bpm: 92, inst: I, drums: 0.6,
  voices: { p1: 'soft', p2: 'echo', wave: 'waveBass' },
  patterns: {
    A: {
      p1: bars('D5:4 F5:4 A5:6 G5:2', 'B5:4 A5:2 G5:2 D5:8', 'F5:4 E5:2 D5:2 A5:4 C6:4', 'G5:8 E5:4 C5:4', 'D5:4 F5:2 G5:2 A5:4 Bb5:4', 'C6:4 B5:2 G5:2 E5:8', 'A5:4 G5:2 E5:2 C5:4 E5:4', 'D5:12 r:4'),
      p2: { echo: { rows: 3, gain: 0.35, cents: 8, inst: 'echo' } },
      wave: bars('D3:6 r:2 A2:6 r:2', 'G2:6 r:2 D3:6 r:2', 'D3:6 r:2 A2:6 r:2', 'C3:6 r:2 G2:6 r:2', 'Bb2:6 r:2 F2:6 r:2', 'C3:6 r:2 G2:6 r:2', 'A2:6 r:2 E2:6 r:2', 'D3:6 r:2 A2:4 C3:4'),
      noise: 'K...h.h.h...h.h.',
    },
    B: {
      p1: bars('A5:6 C6:2 A5:4 F5:4', 'G5:6 E5:2 C5:8', 'F5:4 A5:4 D6:4 C6:4', 'A5:4 E5:4 C5:8', 'Bb5:6 A5:2 F5:4 D5:4', 'C6:6 A5:2 F5:8', 'B5:4 G5:4 D5:4 B4:4', 'C#5:4 E5:4 A5:8'),
      p2: bars('@harm F5:8 C5:8', 'E5:8 G4:8', 'D5:8 A5:8', 'C5:8 A4:8', 'D5:8 Bb4:8', 'A4:8 C5:8', 'G4:8 B4:8', 'A4:8 C#5:8'),
      wave: bars('F2:6 r:2 C3:6 r:2', 'C3:6 r:2 G2:6 r:2', 'D3:6 r:2 A2:6 r:2', 'A2:6 r:2 E2:6 r:2', 'Bb2:6 r:2 F2:6 r:2', 'F2:6 r:2 C3:6 r:2', 'G2:6 r:2 D3:6 r:2', 'A2:6 r:2 E2:4 C#3:4'),
      noise: 'K...h.h.h...h.h.',
    },
  },
  order: ['A', 'A', 'B', 'A'],
};

// ---------- The mage grove (E dorian waltz in 3/4, a Game Boy wave lead, no kick) ----------
const grove = {
  name: 'grove', bpm: 88, rows: 12, inst: I, drums: 0.6,
  voices: { wave: 'wave', p1: 'arpMin', tri: 'bass' },
  patterns: {
    A: {
      wave: bars('E5:4 G5:4 B5:4', 'C#6:6 B5:2 A5:4', 'G5:4 F#5:4 E5:4', 'F#5:8 D5:4', 'E5:4 G5:4 C6:4', 'D6:6 C6:2 A5:4', 'B5:4 G5:4 E5:4', 'F#5:8 B4:4'),
      p1: bars('@arpMin r:4 E5:3 r:1 E5:3 r:1', '@arpMaj r:4 A4:3 r:1 A4:3 r:1', '@arpMin r:4 E5:3 r:1 E5:3 r:1', '@arpMin r:4 B4:3 r:1 B4:3 r:1', '@arpMaj r:4 C5:3 r:1 C5:3 r:1', '@arpMaj r:4 D5:3 r:1 D5:3 r:1', '@arpMin r:4 E5:3 r:1 E5:3 r:1', '@arpMaj r:4 B4:3 r:1 B4:3 r:1'),
      tri: bars('E2:4 B2:4 E3:4', 'A2:4 E3:4 A3:4', 'E2:4 B2:4 E3:4', 'B2:4 F#2:4 B2:4', 'C3:4 G2:4 C3:4', 'D3:4 A2:4 D3:4', 'E2:4 B2:4 E3:4', 'B1:4 F#2:4 B2:4'),
      noise: 'x.....h.....',
    },
    A2: {
      wave: bars('E6:6 D6:2 B5:4', 'C#6:4 A5:4 E5:4', 'G5:6 A5:2 B5:4', 'D6:8 B5:4', 'C6:4 B5:4 G5:4', 'A5:4 F#5:4 D5:4', 'E5:4 F#5:4 G5:4', 'E5:12'),
      p1: bars('@arpMin r:4 E5:3 r:1 E5:3 r:1', '@arpMaj r:4 A4:3 r:1 A4:3 r:1', '@arpMin r:4 E5:3 r:1 E5:3 r:1', '@arpMin r:4 B4:3 r:1 B4:3 r:1', '@arpMaj r:4 C5:3 r:1 C5:3 r:1', '@arpMaj r:4 D5:3 r:1 D5:3 r:1', '@arpMin r:4 E5:3 r:1 E5:3 r:1', '@arpMin r:4 E5:3 r:1 E5:3 r:1'),
      tri: bars('E2:4 B2:4 E3:4', 'A2:4 E3:4 A3:4', 'E2:4 B2:4 E3:4', 'B2:4 F#2:4 B2:4', 'C3:4 G2:4 C3:4', 'D3:4 A2:4 D3:4', 'E2:4 B2:4 E3:4', 'E2:4 B2:4 E3:4'),
      noise: 'x.....h.....|x.....h...x.',
    },
  },
  order: ['A', 'A2'],
};

// ---------- The ruins (A minor; a shimmering arpeggio bed, the tune joining in bar 5) ----------
const ruinsBed = bars('@bedMin A4:16', '@bedMaj F4:16', '@bedMaj C5:16', '@bedMaj G4:16', '@bedMin A4:16', '@bedMaj F4:16', '@bedMaj G4:16', '@bedMaj E4:16');
const ruins = {
  name: 'ruins', bpm: 84, inst: I, drums: 0.7,
  voices: { p1: 'lead25', p2: 'bedMin', tri: 'bassFull' },
  patterns: {
    A: {
      p1: bars('r:16', 'r:16', 'r:16', 'r:16', 'E5:6 D5:2 C5:4 E5:4', 'A5:8 G5:4 F5:4', 'G5:6 F5:2 D5:4 B4:4', 'G#5:8 E5:8'),
      p2: ruinsBed,
      tri: bars(halves('A2', 'E2'), halves('F2', 'C3'), halves('C3', 'G2'), halves('G2', 'D2'), halves('A2', 'E2'), halves('F2', 'C3'), halves('G2', 'D2'), halves('E2', 'B1')),
      noise: 'K.......x.......|K.......x...h.h.',
    },
    B: {
      p1: bars('A5:6 B5:2 C6:4 A5:4', 'F5:8 C6:8', 'E5:4 G5:4 C6:4 E6:4', 'D6:12 B5:4', 'C6:6 B5:2 A5:4 E5:4', 'F5:6 E5:2 D5:4 C5:4', 'B4:4 D5:4 G5:4 B5:4', 'G#5:12 r:4'),
      p2: ruinsBed,
      tri: bars(halves('A2', 'E2'), halves('F2', 'C3'), halves('C3', 'G2'), halves('G2', 'D2'), halves('A2', 'E2'), halves('F2', 'C3'), halves('G2', 'D2'), halves('E2', 'B1')),
      noise: 'K...h...S...h...|K...h...S...h.h.',
    },
  },
  order: ['A', 'B'],
};

// ---------- The sky (D Lydian, high and airy) ----------
const skyLine = bars('A5:4 F#5:2 A5:2 D6:8', 'G#5:4 B5:2 G#5:2 E6:8', 'F#6:4 E6:2 D6:2 A5:4 F#5:4', 'G#5:4 B5:4 E6:4 G#6:4', 'F#6:6 E6:2 D6:4 B5:4', 'G#5:6 B5:2 E6:8', 'D6:4 B5:2 G5:2 D6:4 G6:4', 'E6:8 C#6:4 A5:4');
const skyBass = bars(halves('D3', 'A2'), halves('D3', 'A2'), halves('D3', 'A2'), halves('D3', 'A2'), halves('B2', 'F#2'), halves('E2', 'B2'), halves('G2', 'D3'), halves('A2', 'E3'));
const sky = {
  name: 'sky', bpm: 120, inst: I, drums: 0.6,
  voices: { p1: 'lead12', p2: 'echo', tri: 'bassFull' },
  patterns: {
    A: { p1: skyLine, p2: { echo: { rows: 3, gain: 0.4, cents: 9, inst: 'echo' } }, tri: skyBass, noise: 'K...x...h...x...' },
    A2: {
      p1: `@lead25 ${shift(skyLine, -12)}`,
      p2: bars('@sparkMaj D6:16', 'E6:16', 'D6:16', 'E6:16', '@sparkMin B5:16', '@sparkMaj E6:16', 'G5:16', 'A5:16'),
      tri: skyBass,
      noise: 'K...x...h...x...|K...x...h.h.x.x.',
    },
  },
  order: ['A', 'A2'],
};

// ---------- The Hollow (C minor, a grumbling dungeon march) ----------
const grumble = (r, b, f) => `${r}:2 ${r}:2 ${r}:2 ${b}:2 ${r}:2 ${r}:2 ${f}:2 ${r}:2`;
const hollow = {
  name: 'hollow', bpm: 116, inst: I, drums: 0.8,
  voices: { p1: 'lead', p2: 'echo', tri: 'bassShort' },
  patterns: {
    A: {
      p1: bars('C5:4 Eb5:2 C5:2 G4:4 r:4', 'Ab4:4 F4:2 Ab4:2 Db5:8', 'C5:2 Eb5:2 G5:4 F5:2 Eb5:2 D5:4', 'B4:8 r:4 G4:4', 'C5:4 Eb5:2 C5:2 G5:4 r:4', 'F5:4 Eb5:2 Db5:2 C5:8', 'Eb5:4 C5:2 Ab4:2 Eb5:4 F5:4', 'D5:4 B4:4 G4:8'),
      p2: { echo: { rows: 2, gain: 0.3, cents: 12, inst: 'echo' } },
      tri: bars(grumble('C2', 'Db2', 'G1'), grumble('Db2', 'D2', 'Ab1'), grumble('C2', 'Db2', 'G1'), grumble('G1', 'Ab1', 'D2'), grumble('C2', 'Db2', 'G1'), grumble('Db2', 'D2', 'Ab1'), grumble('Ab1', 'A1', 'Eb2'), grumble('G1', 'Ab1', 'D2')),
      noise: bars(times('K.h.S.hKK.h.S.h.', 7), 'K.h.S.S.S.SSt.t.'),
    },
    B: {
      p1: bars('@lead25 G5:8 Ab5:4 G5:4', 'F5:8 Eb5:8', 'Eb5:4 F5:4 G5:4 C6:4', 'B5:12 r:4', 'C6:8 Bb5:4 Ab5:4', 'G5:8 F5:4 Eb5:4', 'F5:4 Eb5:4 D5:4 F5:4', 'G5:12 r:4'),
      p2: bars('@pad Eb4:16', 'Db4:16', 'C4:16', 'D4:16', 'Eb4:16', 'C4:16', 'Ab3:16', 'B3:16'),
      tri: bars(grumble('C2', 'Db2', 'G1'), grumble('Db2', 'D2', 'Ab1'), grumble('Ab1', 'A1', 'Eb2'), grumble('G1', 'Ab1', 'D2'), grumble('Ab1', 'A1', 'Eb2'), grumble('C2', 'Db2', 'G1'), grumble('F1', 'Gb1', 'C2'), grumble('G1', 'Ab1', 'D2')),
      noise: bars(times('K...S..KK...S...', 7), 'K.h.S.S.S.SSt.t.'),
    },
  },
  order: ['A', 'A', 'B', 'A'],
};

// ---------- Dancing Green: "Funky Fever" (E dorian disco, 120 bpm, locked to the stage) ----------
// The chorus hook, the verse riff and the progressions are his song from before, now on the chip.
const HOOK1 = ['E5:3 r:1 G5:2 A5:3 r:1 B5:3 r:1 A5:2', 'G#5:3 r:1 E5:3 r:1 C#5:2 E5:6', 'F#5:3 r:1 A5:2 B5:3 r:1 D6:2 B5:2 A5:2', 'B5:3 r:1 A5:3 r:1 F#5:3 r:1 E5:4'];
const HOOK2 = [HOOK1[0], 'G#5:3 r:1 B5:3 r:1 G#5:2 E5:2 C#5:4', 'B4:2 E5:2 G5:3 r:1 B5:3 r:1 D6:2 E6:2', 'D6:5 r:1 B5:2 A5:3 r:1 F#5:4'];
const RIFF = ['r:2 B4:2 r:2 D5:2 E5:4 r:4', 'r:2 C#5:2 r:2 E5:2 C#5:3 r:1 B4:3 r:1'];
// Chord tones for each chord (for the sparkling arpeggio) and the bass roots.
const CH = { Em: ['E', 'G', 'B', 'D'], A: ['A', 'C#', 'E', 'G#'], D: ['D', 'F#', 'A', 'C#'], Bm: ['B', 'D', 'F#', 'A'], C: ['C', 'E', 'G', 'B'] };
const ROOT = { Em: ['E2', 'E3'], A: ['A1', 'A2'], D: ['D2', 'D3'], Bm: ['B1', 'B2'], C: ['C2', 'C3'] };
const discoBass = (c, last = 'D3') => `${ROOT[c][0]}:2 ${ROOT[c][1]}:2 ${ROOT[c][0]}:2 ${ROOT[c][1]}:2 ${ROOT[c][0]}:2 ${ROOT[c][1]}:2 ${ROOT[c][0]}:2 ${ROOT[c][1]}:1 ${last}:1`;
// Chord tones climbing and falling in 16ths, two octaves up.
function arp16(c) {
  // The chord stacked upward from its root in the fifth octave.
  const up = [];
  for (const n of CH[c]) {
    let m = 72 + NOTE[n[0]] + (n[1] === '#' ? 1 : 0);
    while (up.length && m <= up[up.length - 1]) m += 12;
    up.push(m);
  }
  const name = (m) => `${NAMES[m % 12]}${Math.floor(m / 12) - 1}`;
  return [0, 1, 2, 3, 2, 1, 0, 1, 2, 3, 2, 1, 0, 1, 2, 3].map((i) => `${name(up[i])}:1`).join(' ');
}
const stab = (c) => `@${c === 'Em' || c === 'Bm' ? 'arpMin' : 'arpMaj'} r:2 ${ROOT[c][1].replace(/\d/, '4')}:2 r:6 ${ROOT[c][1].replace(/\d/, '4')}:2 r:4`;
const VERSE = ['Em', 'A', 'Em', 'A', 'D', 'C', 'Bm', 'Bm'];
const CHORUS = ['Em', 'A', 'D', 'Bm', 'Em', 'A', 'C', 'Bm'];
const DISCO = 'KhohChohKhohChoh';
const funkyPatterns = (fever) => ({
  chorus: {
    p1: bars(...HOOK1, ...HOOK2),
    p2: bars(...CHORUS.map((c) => `@sparkle ${arp16(c)}`)),
    wave: bars(...CHORUS.map(stab)),
    tri: bars(...CHORUS.map((c) => discoBass(c))),
    noise: fever ? bars('OhohChohKhohChKh', times('KhohChohKhohChKh', 6), 'KhohChohB.B.BBBB') : bars('OhohChoh' + 'KhohChoh', times(DISCO, 6), 'KhohChohB.S.SSSS'),
  },
  verse: {
    p1: bars(...VERSE.map((_, i) => `@pluck ${RIFF[i % 2]}`)),
    p2: fever ? bars(...VERSE.map((c) => `@sparkle ${arp16(c)}`)) : bars(...VERSE.map((c) => `@pad ${CH[c][2]}4:16`)),
    wave: bars(...VERSE.map(stab)),
    tri: bars(...VERSE.map((c) => discoBass(c))),
    noise: fever ? bars(times('KhohChohKhohChKh', 7), 'KhohChohB.B.BBBB') : bars(times(DISCO, 7), 'KhohChohB.S.SSSS'),
  },
  // The breakdown: the drums drop out, held chords swell, then a snare build into the chorus.
  break: {
    p1: bars('@pad G5:16', 'A5:16', 'B5:16', 'B5:8 E6:8'),
    p2: bars('@pad E5:16', 'F#5:16', 'G5:16', 'G5:16'),
    tri: bars('@bassFull C2:16', 'D2:16', `@bassDisco ${discoBass('Em')}`, discoBass('Em')),
    noise: bars('c.......c.......', 'c.......c.......', 'K...C...K...C...', 'S.S.S.S.SSSSSSSS'),
  },
});
const funkyInst = { ...I, sparkle: { duty: '0', vol: '7 5 3 1 0' }, pad: { duty: '1', vol: '3 5 6 7 7 | 7 / 6 5 4 3 2 1 0', vib: VIB(24, 5, 12) } };
const funky = {
  name: 'funky', bpm: 120, inst: funkyInst, drums: 1.1,
  voices: { p1: 'brass', p2: 'sparkle', tri: 'bassDisco', wave: 'arpMaj' },
  patterns: funkyPatterns(false),
  intro: ['chorus'],
  order: ['verse', 'chorus', 'break', 'chorus'],
};
// Hi-NRG Fever: the same song a whole step up, every hat a sixteenth, and the arpeggio all through.
const funkyFever = { ...funky, name: 'funky-fever', transpose: 2, drums: 1.2, patterns: funkyPatterns(true) };
// His entrance: the groove from behind a door (the player opens it up with a filter), then a
// heartbeat and a low drone while he transforms.
const funkyGroove = {
  name: 'funky-groove', bpm: 120, inst: funkyInst, drums: 1,
  voices: { p1: 'brass', wave: 'arpMin', tri: 'bassDisco' },
  patterns: { G: { tri: bars(discoBass('Em'), discoBass('Em', 'B2')), wave: bars(stab('Em'), stab('Em')), noise: bars(DISCO, 'KhohChohKhohChKh') } },
  order: ['G'],
};
const funkyHeart = {
  name: 'funky-heart', bpm: 120, inst: funkyInst, drums: 0.9,
  voices: { p1: 'pad', tri: 'bassFull' },
  patterns: { H: { p1: bars('@pad E3:16', 'E3:16'), tri: bars('E2:16', 'E2:16'), noise: bars('K..K............', 'K..K............') } },
  order: ['H'],
};

export const SONGS = { title, town, meadow, harbor, crag, forest, grove, ruins, cave, sky, hollow, boss, funky, 'funky-fever': funkyFever, 'funky-groove': funkyGroove, 'funky-heart': funkyHeart };
