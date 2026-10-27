// Background music, composed as it plays: each area has a key, a mode, a tempo, a chord
// progression, and a band (a soft pad, a bass, a plucked or bell melody, and light percussion).
// The melody is a short motif made up for each four-bar phrase, played twice and then varied,
// so it sounds written rather than random. Notes are scheduled a moment ahead on the audio clock.
//
// Moods: cozy and bright in town and the meadows, airy in the sky, mysterious in the ruins and
// the cave, tense in the Hollow, driving for bosses, and four-on-the-floor disco on the Funky
// Fever Stage (120 bpm, matching the boss's beat).

import { note, beat, now, audioReady, hz } from './engine.js';

const MODES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
};

// root: semitones from A4 (so -9 is C4). prog: chord roots as scale degrees (0-6), one per bar.
// lead: 'pluck' | 'bell' | 'flute' | 'square'. drums: 'shaker' | 'soft' | 'march' | 'boss' | 'disco' | null.
export const SONGS = {
  title: { bpm: 78, root: -9, mode: 'major', prog: [0, 5, 3, 4], lead: 'bell', drums: null, density: 0.45 },
  town: { bpm: 96, root: -9, mode: 'major', prog: [0, 5, 3, 4], lead: 'pluck', drums: 'shaker', density: 0.6 },
  meadow: { bpm: 104, root: -4, mode: 'major', prog: [0, 3, 4, 0, 5, 3, 1, 4], lead: 'flute', drums: 'soft', density: 0.62 },
  harbor: { bpm: 90, root: -11, mode: 'major', prog: [0, 3, 1, 4], lead: 'pluck', drums: 'shaker', density: 0.55, swing: 0.18 },
  crag: { bpm: 100, root: -7, mode: 'mixolydian', prog: [0, 6, 3, 0], lead: 'square', drums: 'march', density: 0.55 },
  forest: { bpm: 86, root: -7, mode: 'dorian', prog: [0, 3, 0, 4], lead: 'flute', drums: 'soft', density: 0.5 },
  grove: { bpm: 72, root: -6, mode: 'lydian', prog: [0, 1, 0, 4], lead: 'bell', drums: null, density: 0.4 },
  ruins: { bpm: 76, root: 0, mode: 'minor', prog: [0, 5, 3, 4], lead: 'bell', drums: 'soft', density: 0.4 },
  cave: { bpm: 70, root: -5, mode: 'minor', prog: [0, 3, 5, 4], lead: 'pluck', drums: null, density: 0.35, echo: true },
  sky: { bpm: 88, root: -2, mode: 'lydian', prog: [0, 1, 4, 0], lead: 'flute', drums: null, density: 0.45 },
  hollow: { bpm: 84, root: -9, mode: 'minor', prog: [0, 0, 5, 4], lead: 'pluck', drums: 'march', density: 0.45 },
  boss: { bpm: 136, root: -9, mode: 'minor', prog: [0, 5, 6, 4], lead: 'square', drums: 'boss', density: 0.7 },
  disco: { bpm: 120, root: -7, mode: 'dorian', prog: [0, 3, 0, 4], lead: 'square', drums: 'disco', density: 0.65 },
};

let song = null;
let songKey = null;
let next = 0;
let step = 0;
let phrase = null;

// Call every frame with the music that should be playing (or null for silence).
export function updateMusic(key) {
  if (!audioReady()) return;
  if (key !== songKey) {
    songKey = key;
    song = key ? SONGS[key] : null;
    step = 0;
    phrase = null;
    next = now() + 0.6; // a breath between songs
  }
  if (!song) return;
  const eighth = 60 / song.bpm / 2;
  while (next < now() + 0.25) {
    play(song, step, next, eighth);
    next += eighth * (song.swing ? (step % 2 ? 1 - song.swing : 1 + song.swing) : 1);
    step++;
  }
}

const deg = (s, d, oct = 0) => {
  const scale = MODES[s.mode];
  const i = ((d % 7) + 7) % 7;
  return s.root + scale[i] + 12 * (oct + Math.floor(d / 7));
};

// A motif for four bars: eighth-note slots, each a scale degree or null for a rest. Strong beats
// lean on chord tones; the line moves mostly by step with the odd leap, and ends a phrase home.
function makePhrase(s) {
  const out = [];
  let d = 4;
  for (let i = 0; i < 32; i++) {
    const bar = Math.floor(i / 8);
    const chord = s.prog[bar % s.prog.length];
    const strong = i % 4 === 0;
    const play = strong ? Math.random() < 0.85 : Math.random() < s.density * (i % 2 ? 0.7 : 1);
    if (!play) {
      out.push(null);
      continue;
    }
    if (strong) {
      const tones = [chord, chord + 2, chord + 4];
      d = tones.reduce((a, b) => (Math.abs(b - d) < Math.abs(a - d) ? b : a));
    } else d += [-2, -1, -1, 1, 1, 2][Math.floor(Math.random() * 6)];
    d = Math.max(0, Math.min(11, d));
    out.push(d);
  }
  out[31] = null;
  out[28] = s.prog[3 % s.prog.length] === 4 ? 4 : 0;
  return out;
}

function play(s, i, t, eighth) {
  const barLen = eighth * 8;
  const inBar = i % 8;
  const bar = Math.floor(i / 8);
  const chord = s.prog[bar % s.prog.length];
  // A new motif every eight bars (played over two four-bar halves, the second a little varied).
  if (i % 64 === 0 || !phrase) phrase = makePhrase(s);
  // Pad: the chord, held for the bar, soft and filtered.
  if (inBar === 0) {
    for (const k of [0, 2, 4]) note(hz(deg(s, chord + k, -1)), t, { type: 'triangle', dur: barLen * 0.95, attack: 0.25, gain: 0.016, filter: { type: 'lowpass', f: 1100 }, verb: 0.5, curve: 'lin' });
  }
  // Bass: the root on beats one and three (and pumping eighths for the boss and disco).
  const pump = s.drums === 'boss' || s.drums === 'disco';
  if (inBar === 0 || inBar === 4 || (pump && inBar % 2 === 0)) {
    note(hz(deg(s, chord, -2) + (pump && inBar % 4 === 2 ? 12 : 0)), t, { type: pump ? 'sawtooth' : 'triangle', dur: eighth * (pump ? 0.9 : 1.8), gain: pump ? 0.05 : 0.07, filter: { type: 'lowpass', f: pump ? 700 : 500 }, verb: 0.05 });
  }
  // Melody.
  const slot = i % 32;
  let d = phrase[slot];
  if (d != null && i % 64 >= 32 && slot % 8 === 6 && Math.random() < 0.5) d += Math.random() < 0.5 ? 1 : -1;
  if (d != null) {
    const f = hz(deg(s, d, 0));

    lead(s.lead, f, t, eighth, s.echo);
  }
  drums(s.drums, inBar, t, eighth);
}

function lead(kind, f, t, eighth, echo) {
  const o = { verb: echo ? 0.6 : 0.3 };
  if (kind === 'bell') {
    note(f * 2, t, { ...o, type: 'sine', dur: eighth * 3, gain: 0.04 });
    note(f * 2 * 2.76, t, { ...o, type: 'sine', dur: eighth * 1.2, gain: 0.012 });
  } else if (kind === 'flute') {
    note(f * 2, t, { ...o, type: 'sine', dur: eighth * 1.6, attack: 0.04, gain: 0.04, vibrato: { rate: 5, depth: 4 } });
    note(f * 4, t, { ...o, type: 'sine', dur: eighth, attack: 0.04, gain: 0.006 });
  } else if (kind === 'square') {
    note(f * 2, t, { ...o, type: 'square', dur: eighth * 0.9, gain: 0.018, filter: { type: 'lowpass', f: 2600 } });
  } else {
    note(f * 2, t, { ...o, type: 'triangle', dur: eighth * 1.4, gain: 0.045, filter: { type: 'lowpass', f: 3200, to: 900 } });
  }
  if (echo) note(f * 2, t + eighth * 3, { type: 'triangle', dur: eighth, gain: 0.012, verb: 0.7 });
}

function kick(t, g = 0.16) {
  note(130, t, { type: 'sine', to: 45, slide: 0.12, dur: 0.16, gain: g, verb: 0.02 });
}
function hat(t, g = 0.025, open = false) {
  beat(t, { filter: { type: 'highpass', f: 7000 }, dur: open ? 0.12 : 0.03, gain: g, verb: 0.05 });
}
function snare(t, g = 0.07) {
  beat(t, { filter: { type: 'bandpass', f: 1800, q: 0.8 }, dur: 0.12, gain: g, verb: 0.15 });
  note(220, t, { type: 'triangle', to: 160, dur: 0.06, gain: g * 0.5 });
}

function drums(kind, i, t, eighth) {
  if (!kind) return;
  if (kind === 'shaker') {
    hat(t, i % 2 ? 0.012 : 0.02);
  } else if (kind === 'soft') {
    if (i === 0) kick(t, 0.08);
    if (i % 2 === 1) hat(t, 0.012);
  } else if (kind === 'march') {
    if (i === 0 || i === 4) kick(t, 0.1);
    if (i === 6) snare(t, 0.04);
    if (i % 2 === 1) hat(t, 0.012);
  } else if (kind === 'boss') {
    if (i === 0 || i === 3 || i === 4) kick(t, 0.17);
    if (i === 2 || i === 6) snare(t, 0.08);
    hat(t, 0.02);
  } else if (kind === 'disco') {
    if (i % 2 === 0) kick(t, 0.16);
    if (i === 2 || i === 6) snare(t, 0.06);
    if (i % 2 === 1) hat(t, 0.035, true);
  }
}
