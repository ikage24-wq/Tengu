// "Funky Fever", Dancing Green's own song: an original disco / Hi-NRG track at 120 bpm, written
// out (not generated), locked to the stage: its bars line up with the stage lights' beat (the
// lights flash on every half second of the real clock, with a drop every four bars), so the
// floor, the lights and the music hit together.
//
// It follows the fight:
// - The cutscene: a muffled groove whose filter opens as he struts in and dances, a riser and a
//   snare roll while the red energy gathers, a boom when he turns into his toad form, then a
//   tense pause with a heartbeat kick until the fight starts.
// - The fight: the drop into the chorus, then verse, chorus, a breakdown, and round again.
//   E dorian; the chorus hook is a written eight-bar tune.
// - Hi-NRG Fever (the enrage): the key jumps up a whole step, the arps run double time, a siren
//   wails every two bars, and the kick drives harder.
// - His defeat: a bright brass fanfare, then the stage goes quiet.

import { note, beat, now, hz } from './engine.js';

const BEAT = 0.5;
const S16 = BEAT / 4;
const BAR = BEAT * 4;
// E4 is -5 semitones from A4; everything below is written in semitones from E4.
const E4 = -5;

// The chords, one per bar (semitones from E4, as a voicing).
const CHORDS = {
  Em: [-12, -5, -2, 2], A: [-7, -3, 0, 4], D: [-10, -6, -3, 1], Bm: [-5, -1, 2, 5], C: [-4, 0, 3, 7], G: [-9, -5, -2, 2],
};
const VERSE = ['Em', 'A', 'Em', 'A', 'D', 'C', 'Bm', 'Bm'];
const CHORUS = ['Em', 'A', 'D', 'Bm', 'Em', 'A', 'C', 'Bm'];
const BREAK = ['C', 'D', 'Em', 'Em'];
const BASS_ROOT = { Em: -24, A: -19, D: -14, Bm: -17, C: -20, G: -15 };

// The hook: eight bars of eighth notes (semitones from E4; null rests).
const HOOK = [
  [12, null, 15, 17, null, 19, null, 17],
  [16, null, 12, null, 9, 12, null, null],
  [14, null, 17, 19, null, 22, 19, 17],
  [19, null, 17, null, 14, null, 12, null],
  [12, null, 15, 17, null, 19, null, 17],
  [16, null, 19, null, 16, 12, 9, null],
  [7, 12, 15, null, 19, null, 22, 24],
  [22, null, null, 19, 17, null, 14, null],
];
// The verse riff: a short call and answer on a plucky synth.
const RIFF = [
  [null, 7, null, 10, 12, null, null, null],
  [null, 9, null, 12, 9, null, 7, null],
];
// The fanfare when he falls.
const FANFARE = [[0, 7, 12], [4, 9, 16], [7, 12, 19], [12, 16, 24]];

let st = null;

// Call every frame while on his stage. `key`: 'funky-intro' | 'funky' | 'funky-fever' | 'funky-win';
// `cut`: seconds into the cutscene (intro only).
export function updateFunky(key, cut = 0) {
  const t = now();
  const perf = performance.now() / 1000;
  const offset = perf - t;
  if (!st) {
    // Start on the next sixteenth of the stage's own clock.
    const next = Math.ceil(perf / S16) * S16;
    st = { at: next - offset, step: Math.round(next / S16), key, since: null, done: {} };
  }
  if (key !== st.key) {
    if (key === 'funky' && st.key === 'funky-intro') st.dropAt = st.step;
    if (key === 'funky-fever') st.feverAt = st.step;
    if (key === 'funky-win') st.winAt = st.step;
    st.key = key;
  }
  while (st.at < t + 0.25) {
    play(st, st.step, st.at, cut);
    st.step++;
    st.at += S16;
  }
}

export function stopFunky() {
  st = null;
}

// The section and bar a step falls in, counted from the drop.
function where(s, i) {
  if (s.key === 'funky-intro' || s.dropAt == null) return { part: 'intro', bar: 0 };
  const bars = Math.floor((i - s.dropAt) / 16);
  if (bars < 0) return { part: 'intro', bar: 0 };
  if (bars < 8) return { part: 'chorus', bar: bars };
  const loop = [['verse', 8], ['chorus', 8], ['break', 4], ['chorus', 8]];
  let k = (bars - 8) % 28;
  for (const [part, len] of loop) {
    if (k < len) return { part, bar: k };
    k -= len;
  }
  return { part: 'chorus', bar: 0 };
}

const n = (semi, shift = 0) => hz(E4 + semi + shift);

function play(s, i, t, cut) {
  const in16 = i % 16;
  const eighth = in16 % 2 === 0 ? in16 / 2 : -1;
  if (s.key === 'funky-win') return win(s, i, t);
  const fever = s.key === 'funky-fever';
  const shift = fever ? 2 : 0;
  const { part, bar } = where(s, i);
  if (part === 'intro') return intro(s, i, t, cut, in16, eighth);
  const prog = part === 'verse' ? VERSE : part === 'break' ? BREAK : CHORUS;
  const chord = prog[bar % prog.length];
  const first = in16 === 0;
  // A crash at the top of each section.
  if (first && bar === 0) beat(t, { filter: { type: 'highpass', f: 5000 }, dur: 1.4, gain: 0.07, verb: 0.4 });

  // Drums: four on the floor, claps on two and four, open hats on the offbeats, ticking 16ths.
  const drums = part !== 'break' || bar >= 2;
  if (drums) {
    if (in16 % 4 === 0) kick(t, fever ? 0.2 : 0.17);
    if (fever && in16 % 4 === 3) kick(t, 0.07);
    if (in16 === 4 || in16 === 12) clap(t);
    if (in16 % 4 === 2) hat(t, 0.04, true);
    else hat(t, in16 % 2 ? 0.012 : 0.018);
  } else if (in16 === 4 || in16 === 12) clap(t, 0.04);
  // A snare roll into each section's last bar.
  const len = part === 'break' ? 4 : 8;
  if (bar === len - 1 && in16 >= 8) beat(t, { filter: { type: 'bandpass', f: 2000, q: 0.8 }, dur: 0.06, gain: 0.02 + 0.006 * (in16 - 8), verb: 0.1 });

  // Bass: the octave-jumping disco bass on eighths, with a 16th pickup.
  const root = BASS_ROOT[chord] + shift;
  if (part !== 'break' && (eighth >= 0 || in16 === 15)) {
    const up = eighth % 2 === 1;
    const f = in16 === 15 ? n(root + 10) : n(root + (up ? 12 : 0));
    note(f, t, { type: 'sawtooth', dur: S16 * 1.6, gain: 0.07, filter: { type: 'lowpass', f: up ? 1100 : 700, to: 300, slide: 0.12 }, verb: 0.02 });
    note(f / 2, t, { type: 'sine', dur: S16 * 1.6, gain: 0.05, verb: 0 });
  }
  // Chord stabs: short bright chops on the offbeats of one and three ("chk... chk").
  if (in16 === 2 || in16 === 10 || (part === 'chorus' && in16 === 7)) {
    for (const c of CHORDS[chord]) note(n(c + 12, shift), t, { type: 'sawtooth', dur: 0.1, gain: 0.014, filter: { type: 'lowpass', f: 2800, to: 900, slide: 0.1 }, verb: 0.15 });
  }
  // Strings: a held chord under the chorus and the breakdown, swelling in.
  if (first && part !== 'verse') {
    for (const c of CHORDS[chord]) {
      note(n(c + 12, shift), t, { type: 'sawtooth', dur: BAR * 0.95, attack: 0.35, gain: 0.009, filter: { type: 'lowpass', f: 2200 }, vibrato: { rate: 5, depth: 2 }, verb: 0.5, curve: 'lin' });
      note(n(c + 12, shift), t, { type: 'sawtooth', detune: 9, dur: BAR * 0.95, attack: 0.35, gain: 0.009, filter: { type: 'lowpass', f: 2200 }, verb: 0.5, curve: 'lin' });
    }
  }
  // Arpeggio: chord tones up and down in 16ths (in the chorus, and all through the fever).
  if (part === 'chorus' || fever) {
    const tones = CHORDS[chord];
    const order = [0, 1, 2, 3, 2, 1];
    note(n(tones[order[in16 % 6]] + 24, shift), t, { type: 'square', dur: S16 * 0.8, gain: fever ? 0.014 : 0.01, filter: { type: 'lowpass', f: 3500 }, verb: 0.2 });
  }
  // The lead: the hook in the chorus, the riff in the verse.
  if (eighth >= 0) {
    const line = part === 'chorus' ? HOOK[bar % 8] : part === 'verse' ? RIFF[bar % 2] : null;
    const d = line?.[eighth];
    if (d != null) lead(n(d, shift), t, part === 'chorus', fever);
  }
  // Hi-NRG Fever's siren, every two bars.
  if (fever && first && bar % 2 === 0) note(n(19, shift), t, { type: 'sawtooth', to: n(31, shift), slide: BAR, dur: BAR, attack: 0.1, gain: 0.02, vibrato: { rate: 7, depth: 30 }, filter: { type: 'lowpass', f: 3000 }, verb: 0.4 });
  // The breakdown's riser into the next chorus.
  if (part === 'break' && bar === 2 && first) beat(t, { filter: { type: 'bandpass', f: 300, to: 6000, q: 2, slide: BAR * 2 }, dur: BAR * 2, attack: BAR * 1.8, gain: 0.06, curve: 'lin', verb: 0.3 });
}

function lead(f, t, hook, fever) {
  if (hook) {
    // A bright brassy lead, doubled an octave up and a little detuned.
    note(f, t, { type: 'sawtooth', dur: BEAT * 0.45, gain: fever ? 0.03 : 0.024, filter: { type: 'lowpass', f: fever ? 4200 : 3200 }, vibrato: { rate: 6, depth: 3 }, verb: 0.3 });
    note(f * 2, t, { type: 'square', detune: 6, dur: BEAT * 0.4, gain: 0.008, filter: { type: 'lowpass', f: 5000 }, verb: 0.3 });
  } else {
    note(f, t, { type: 'triangle', dur: BEAT * 0.4, gain: 0.04, filter: { type: 'lowpass', f: 2600, to: 800, slide: 0.2 }, verb: 0.3 });
  }
}

// The cutscene, timed to what happens on screen (`cut` seconds in): a muffled groove opening up
// as he struts and dances, a riser while the red energy gathers, a boom as he transforms, then a
// heartbeat until the drop.
function intro(s, i, t, cut, in16, eighth) {
  if (cut >= 6.8 && !s.done.riser) {
    s.done.riser = true;
    beat(t, { filter: { type: 'bandpass', f: 200, to: 7000, q: 2, slide: 1.9 }, dur: 1.9, attack: 1.8, gain: 0.08, curve: 'lin', verb: 0.3 });
    note(n(-24), t, { type: 'sawtooth', to: n(12), slide: 1.9, dur: 1.9, attack: 1.7, gain: 0.03, filter: { type: 'lowpass', f: 2000 }, curve: 'lin', verb: 0.3 });
  }
  if (cut >= 8.7 && !s.done.boom) {
    s.done.boom = true;
    note(70, t, { type: 'sine', to: 30, slide: 0.8, dur: 1.2, gain: 0.3, verb: 0.5 });
    beat(t, { filter: { type: 'lowpass', f: 600, to: 60 }, dur: 1.6, gain: 0.18, verb: 0.6 });
    beat(t, { filter: { type: 'highpass', f: 4000 }, dur: 2, gain: 0.07, verb: 0.6 });
  }
  if (cut >= 8.7) {
    // The pause: a slow heartbeat kick and a low drone.
    if (in16 === 0 || in16 === 3) kick(t, in16 === 0 ? 0.12 : 0.07);
    if (in16 === 0 && i % 32 === 0) note(n(-24), t, { type: 'sawtooth', dur: BAR * 2, attack: 0.5, gain: 0.02, filter: { type: 'lowpass', f: 300 }, verb: 0.5, curve: 'lin' });
    return;
  }
  if (cut >= 6.8) {
    // The snare roll speeds up under the riser.
    const rate = cut < 7.6 ? 4 : cut < 8.2 ? 2 : 1;
    if (in16 % rate === 0) beat(t, { filter: { type: 'bandpass', f: 1800, q: 0.8 }, dur: 0.06, gain: 0.03 + (cut - 6.8) * 0.02, verb: 0.15 });
    if (in16 % 4 === 0) kick(t, 0.12);
    return;
  }
  // The groove, heard as if from behind a door, opening up as he dances.
  const open = Math.min(1, Math.max(0, (cut - 1.2) / 5));
  const lp = 300 + open * open * 2600;
  if (in16 % 4 === 0) kick(t, 0.13);
  if (cut > 3 && (in16 === 4 || in16 === 12)) clap(t, 0.03 + 0.03 * open);
  if (cut > 1.5 && in16 % 4 === 2) hat(t, 0.025 * open, true);
  if (eighth >= 0) {
    const up = eighth % 2 === 1;
    note(n(-24 + (up ? 12 : 0)), t, { type: 'sawtooth', dur: S16 * 1.6, gain: 0.07, filter: { type: 'lowpass', f: Math.min(lp, up ? 1100 : 700) }, verb: 0.02 });
  }
  if (cut > 3.6 && (in16 === 2 || in16 === 10)) for (const c of CHORDS.Em) note(n(c + 12), t, { type: 'sawtooth', dur: 0.1, gain: 0.012, filter: { type: 'lowpass', f: lp }, verb: 0.15 });
}

// His defeat: the fanfare once, a last crash, and then the stage falls quiet.
function win(s, i, t) {
  s.winAt ??= i;
  const k = i - s.winAt;
  if (k === 0) beat(t, { filter: { type: 'highpass', f: 5000 }, dur: 2, gain: 0.08, verb: 0.5 });
  if (k % 2 === 0 && k / 2 < FANFARE.length) {
    const ch = FANFARE[k / 2];
    const last = k / 2 === FANFARE.length - 1;
    for (const c of ch) note(n(c), t, { type: 'sawtooth', dur: last ? 1.6 : BEAT * 0.45, gain: 0.02, filter: { type: 'lowpass', f: 3500 }, vibrato: last ? { rate: 6, depth: 4 } : undefined, verb: 0.4 });
    kick(t, 0.14);
  }
}

function kick(t, g = 0.16) {
  note(140, t, { type: 'sine', to: 42, slide: 0.13, dur: 0.18, gain: g, verb: 0.02 });
  beat(t, { filter: { type: 'highpass', f: 3000 }, dur: 0.01, gain: g * 0.15, verb: 0 });
}
function hat(t, g = 0.02, open = false) {
  beat(t, { filter: { type: 'highpass', f: 7500 }, dur: open ? 0.13 : 0.03, gain: g, verb: 0.05 });
}
function clap(t, g = 0.07) {
  for (const d of [0, 0.012, 0.024]) beat(t + d, { filter: { type: 'bandpass', f: 1500, q: 1.2 }, dur: 0.09, gain: g * 0.7, verb: 0.25 });
}
