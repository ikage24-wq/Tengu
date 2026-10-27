// Every sound effect, as a small synth recipe. `sfx(name, opts)` plays one; repeats of the same
// sound inside a few milliseconds are dropped (a blow hitting six monsters plays once, a little
// louder), and a frame never stacks more than a dozen sounds, so busy fights stay clear.
//
// The palette follows the game: soft and round for the cozy things (steps, loot, menus), bright
// and bell-like for holy light, crunchy and low for rage, glassy for ice, crackling for lightning.

import { tone, noise, now, audioReady } from './engine.js';

const last = new Map();
let frameCount = 0;
let frameAt = -1;

export function sfx(name, o = {}) {
  if (!audioReady()) return;
  const t = now();
  if (t !== frameAt) {
    frameAt = t;
    frameCount = 0;
  }
  const gap = GAPS[name] ?? 0.03;
  if (t - (last.get(name) ?? -9) < gap || frameCount >= 12) return;
  last.set(name, t);
  frameCount++;
  RECIPES[name]?.(o);
  played.push(name);
  if (played.length > 300) played.shift();
}

// The most recent sounds played, oldest first (for tools and play tests).
export const played = [];

const GAPS = { step: 0.06, blip: 0.035, click: 0.02, dot: 0.12, hit: 0.025, coin: 0.06, pickup: 0.05 };
const rnd = (a, b) => a + Math.random() * (b - a);
const C = { sfx: 'sfx', voice: 'voice' };

// A bell: a few inharmonic sine partials with long tails (holy light, chimes).
function bell(f, o = {}) {
  const g = o.gain ?? 0.12;
  tone(f, { ...o, gain: g, dur: o.dur ?? 0.9, verb: o.verb ?? 0.35 });
  tone(f * 2.76, { ...o, gain: g * 0.35, dur: (o.dur ?? 0.9) * 0.6, verb: o.verb ?? 0.35 });
  tone(f * 5.4, { ...o, gain: g * 0.15, dur: (o.dur ?? 0.9) * 0.35, verb: o.verb ?? 0.35 });
}
// A thump: a sine that drops in pitch fast (the body of a heavy hit or a landing).
function thump(f, o = {}) {
  tone(f, { type: 'sine', to: f * 0.35, slide: o.dur ?? 0.12, dur: o.dur ?? 0.12, gain: o.gain ?? 0.3, attack: 0.002, pan: o.pan, verb: o.verb ?? 0.08, delay: o.delay });
}
// A whoosh: filtered noise sweeping from `from` to `to` Hz.
function whoosh(from, to, o = {}) {
  noise({ filter: { type: 'bandpass', f: from, to, q: o.q ?? 1.2 }, dur: o.dur ?? 0.16, gain: o.gain ?? 0.14, attack: o.attack ?? 0.02, pan: o.pan, verb: o.verb ?? 0.1, delay: o.delay, curve: o.curve });
}
// A rising run of notes (sparkles, fanfares).
function arp(freqs, o = {}) {
  freqs.forEach((f, i) => tone(f, { type: o.type ?? 'triangle', gain: o.gain ?? 0.09, dur: o.dur ?? 0.22, delay: (o.delay ?? 0) + i * (o.step ?? 0.06), verb: o.verb ?? 0.3, pan: o.pan, bus: o.bus }));
}

const SCHOOL_TONE = { holy: 1318, ice: 2093, lightning: 880, fire: 330, poison: 440, arcane: 784, wind: 1175, steel: 1047, rage: 220, shadow: 392, nature: 659, sakura: 1397, gold: 1568, earth: 262, dragon: 294 };

const RECIPES = {
  // ---------- Combat ----------
  // A swing through the air: heavier swings are lower and longer; holy ones shimmer, rage growls.
  swing({ weight = 1, school, pan }) {
    const w = Math.min(2, weight);
    whoosh(2600 - w * 500, 600 - w * 150, { dur: 0.12 + w * 0.07, gain: 0.1 + w * 0.05, pan });
    if (w > 1.2) noise({ filter: { type: 'lowpass', f: 700, to: 180 }, dur: 0.22, gain: 0.12, attack: 0.03, pan });
    if (school === 'holy') tone(2093, { to: 2637, dur: 0.18, gain: 0.03, pan, verb: 0.4 });
    if (school === 'rage') tone(90, { type: 'sawtooth', dur: 0.18, gain: 0.05, filter: { type: 'lowpass', f: 400 }, drive: 3, pan });
  },
  thrust({ pan }) {
    whoosh(3400, 1400, { dur: 0.09, gain: 0.12, q: 2, pan });
  },
  miss({ pan }) {
    whoosh(4200, 2600, { dur: 0.07, gain: 0.05, q: 3, pan });
  },
  // A blow landing: a crisp click and a body thump; heavy blows go deep, crits ping, and each
  // path and element adds its colour (holy bells, rage crunch, fire crackle, glassy ice, a zap).
  hit({ big, crit, school, element, pan, many = 1 }) {
    const g = Math.min(1.4, 1 + (many - 1) * 0.1);
    noise({ filter: { type: 'highpass', f: 2400 }, dur: 0.035, gain: 0.2 * g, pan, verb: 0.05 });
    thump(big ? 130 : 210, { dur: big ? 0.2 : 0.1, gain: (big ? 0.42 : 0.26) * g, pan });
    if (big) noise({ filter: { type: 'lowpass', f: 900, to: 200 }, dur: 0.2, gain: 0.16, pan });
    if (crit) tone(1760, { to: 2200, dur: 0.12, gain: 0.07, pan, verb: 0.25 });
    if (school === 'holy') bell(1568, { gain: 0.05, dur: 0.5, pan });
    if (school === 'rage') noise({ filter: { type: 'bandpass', f: 900, q: 1.5 }, dur: 0.08, gain: 0.16, drive: 6, pan });
    if (element === 'fire' || element === 'demonic') noise({ filter: { type: 'bandpass', f: 1800, q: 0.8 }, dur: 0.18, gain: 0.07, pan });
    if (element === 'ice') tone(rnd(2600, 3200), { dur: 0.15, gain: 0.04, pan, verb: 0.3 });
    if (element === 'lightning' || element === 'laser' || element === 'cyber') tone(1200, { type: 'sawtooth', to: 200, dur: 0.08, gain: 0.04, pan });
  },
  hurt({ pan }) {
    tone(520, { type: 'square', to: 230, dur: 0.12, gain: 0.07, filter: { type: 'lowpass', f: 1800 }, pan });
    noise({ filter: { type: 'bandpass', f: 600, q: 1 }, dur: 0.06, gain: 0.12, pan });
  },
  poof({ pan, boss }) {
    tone(480, { to: 900, dur: 0.08, gain: 0.08, pan });
    noise({ filter: { type: 'lowpass', f: 1600, to: 300 }, dur: 0.28, gain: 0.12, attack: 0.01, pan, verb: 0.2 });
    if (boss) RECIPES.boom({ size: 2, pan });
  },
  boom({ size = 1, pan }) {
    thump(90, { dur: 0.35 + size * 0.15, gain: 0.45, pan, verb: 0.3 });
    noise({ filter: { type: 'lowpass', f: 500, to: 80 }, dur: 0.4 + size * 0.2, gain: 0.22 + size * 0.06, drive: 2, pan, verb: 0.3 });
  },
  crack({ pan }) {
    RECIPES.boom({ size: 1, pan });
    noise({ filter: { type: 'bandpass', f: 380, q: 2 }, dur: 0.3, gain: 0.14, delay: 0.03, pan });
    for (let i = 0; i < 3; i++) tone(rnd(140, 260), { type: 'triangle', dur: 0.06, gain: 0.05, delay: 0.05 + i * 0.05, pan });
  },
  stomp({ big, pan }) {
    thump(110, { dur: big ? 0.16 : 0.1, gain: big ? 0.26 : 0.16, pan });
    noise({ filter: { type: 'lowpass', f: 700 }, dur: 0.12, gain: 0.08, pan });
  },
  dot({ bleed, pan }) {
    if (bleed) noise({ filter: { type: 'bandpass', f: 700, q: 3 }, dur: 0.05, gain: 0.04, pan });
    else tone(rnd(300, 500), { to: rnd(600, 800), dur: 0.06, gain: 0.03, pan });
  },
  stun({ pan }) {
    arp([1568, 1976, 1568], { step: 0.05, gain: 0.04, dur: 0.12, pan });
  },
  freeze({ pan }) {
    noise({ filter: { type: 'highpass', f: 4000 }, dur: 0.25, gain: 0.07, pan });
    for (let i = 0; i < 4; i++) tone(rnd(2400, 3600), { dur: 0.12, gain: 0.03, delay: i * 0.03, pan, verb: 0.3 });
  },
  dash({ pan }) {
    whoosh(500, 3000, { dur: 0.3, gain: 0.16, attack: 0.04, pan });
  },
  blink({ pan }) {
    whoosh(300, 5000, { dur: 0.22, gain: 0.1, pan });
    arp([1568, 2093, 2637], { step: 0.03, gain: 0.04, dur: 0.15, pan });
  },
  roar({ pan }) {
    tone(85, { type: 'sawtooth', to: 70, dur: 0.6, gain: 0.12, attack: 0.05, filter: { type: 'lowpass', f: 700 }, drive: 4, vibrato: { rate: 18, depth: 6 }, pan, verb: 0.3 });
    noise({ filter: { type: 'bandpass', f: 500, q: 0.8 }, dur: 0.5, gain: 0.1, attack: 0.05, pan, verb: 0.3 });
  },
  hook({ pan }) {
    whoosh(1500, 3000, { dur: 0.2, gain: 0.08, pan });
    for (let i = 0; i < 6; i++) tone(rnd(2200, 3400), { type: 'square', dur: 0.02, gain: 0.025, delay: 0.05 + i * 0.04, filter: { type: 'bandpass', f: 3000, q: 4 }, pan });
  },
  // Power gathering before a big blow: a rising whine under a swelling hiss.
  gather({ dur = 0.4, school, pan }) {
    tone(school === 'holy' ? 523 : 140, { type: school === 'holy' ? 'triangle' : 'sawtooth', to: school === 'holy' ? 1568 : 420, slide: dur, dur, attack: dur * 0.8, gain: 0.06, curve: 'lin', filter: { type: 'lowpass', f: 2400 }, pan, verb: 0.3 });
    noise({ filter: { type: 'bandpass', f: 600, to: 3000, q: 1 }, dur, attack: dur * 0.9, gain: 0.07, curve: 'lin', pan });
  },
  // ---------- Shots and spells ----------
  shot({ kind, pan }) {
    if (kind === 'arrow' || kind === 'bigarrow') {
      const low = kind === 'bigarrow';
      tone(low ? 150 : 220, { type: 'triangle', to: low ? 120 : 180, dur: 0.12, gain: 0.12, filter: { type: 'lowpass', f: 2000 }, pan });
      whoosh(3000, 1500, { dur: low ? 0.2 : 0.12, gain: low ? 0.12 : 0.08, pan });
    } else if (kind === 'star' || kind === 'bigstar') {
      whoosh(4000, 2400, { dur: 0.1, gain: 0.08, pan });
      tone(3520, { dur: 0.06, gain: 0.03, pan });
    } else if (kind === 'fire' || kind === 'venomfire' || kind === 'bomb') {
      noise({ filter: { type: 'lowpass', f: 400, to: 2000 }, dur: 0.25, gain: 0.14, attack: 0.03, pan });
    } else if (kind === 'icebeam') {
      tone(1568, { to: 2637, dur: 0.2, gain: 0.05, pan, verb: 0.3 });
      noise({ filter: { type: 'highpass', f: 5000 }, dur: 0.2, gain: 0.05, pan });
    } else if (kind === 'holy') {
      bell(1047, { gain: 0.06, dur: 0.6, pan });
    } else if (kind === 'feather') {
      whoosh(2000, 900, { dur: 0.15, gain: 0.07, pan });
    } else {
      tone(660, { type: 'sine', to: 1320, dur: 0.14, gain: 0.07, vibrato: { rate: 30, depth: 20 }, pan, verb: 0.2 });
    }
  },
  cast({ school = 'arcane', big, pan }) {
    const f = SCHOOL_TONE[school] ?? 784;
    if (school === 'fire') noise({ filter: { type: 'lowpass', f: 300, to: 2400 }, dur: 0.5, gain: 0.12, attack: 0.15, pan, verb: 0.2 });
    else if (school === 'lightning') {
      for (let i = 0; i < 5; i++) noise({ filter: { type: 'highpass', f: 3000 }, dur: 0.03, gain: 0.06, delay: i * 0.07 + rnd(0, 0.03), pan });
    } else if (school === 'poison') {
      for (let i = 0; i < 5; i++) tone(rnd(300, 600), { to: rnd(700, 900), dur: 0.06, gain: 0.04, delay: i * 0.07, pan });
    } else if (school === 'holy') {
      [523, 659, 784].forEach((n, i) => tone(n * 2, { type: 'triangle', dur: 0.7, attack: 0.25, gain: 0.04, vibrato: { rate: 5, depth: 4 }, delay: i * 0.02, pan, verb: 0.5 }));
    }
    tone(f / 2, { type: 'triangle', to: f, slide: 0.35, dur: big ? 0.8 : 0.45, attack: 0.1, gain: 0.05, vibrato: { rate: 7, depth: f * 0.01 }, pan, verb: 0.4 });
  },
  powerup({ school, big, pan }) {
    whoosh(300, 2600, { dur: big ? 0.5 : 0.3, gain: big ? 0.14 : 0.1, attack: 0.08, pan });
    tone((SCHOOL_TONE[school] ?? 784) / 2, { type: 'triangle', to: SCHOOL_TONE[school] ?? 784, dur: 0.3, gain: 0.04, pan, verb: 0.3 });
  },
  buff({ pan, party }) {
    arp(party ? [523, 659, 784, 1047, 1319] : [659, 784, 1047, 1319], { step: 0.05, gain: 0.06, dur: 0.3, pan });
  },
  heal({ pan }) {
    arp([784, 988, 1175, 1568], { type: 'sine', step: 0.06, gain: 0.06, dur: 0.5, pan });
    noise({ filter: { type: 'highpass', f: 6000 }, dur: 0.4, gain: 0.03, attack: 0.1, pan });
  },
  // Spell and skill effects landing, by kind.
  spell({ kind, pan }) {
    switch (kind) {
      case 'thunder': case 'chain': case 'chainbolt':
        noise({ filter: { type: 'highpass', f: 1500 }, dur: 0.15, gain: 0.18, drive: 3, pan });
        tone(1500, { type: 'sawtooth', to: 120, dur: 0.18, gain: 0.06, pan });
        thump(80, { dur: 0.3, gain: 0.2, pan, verb: 0.3 });
        break;
      case 'icespire': case 'tempest': case 'freeze':
        RECIPES.freeze({ pan });
        thump(150, { dur: 0.15, gain: 0.15, pan });
        break;
      case 'meteor': case 'fire': case 'toxicblaze':
        RECIPES.boom({ size: kind === 'meteor' ? 1.5 : 0.6, pan });
        noise({ filter: { type: 'bandpass', f: 1600, q: 0.7 }, dur: 0.35, gain: 0.08, pan });
        break;
      case 'mist': case 'poisonmist':
        noise({ filter: { type: 'lowpass', f: 1400, to: 500 }, dur: 0.7, gain: 0.08, attack: 0.15, pan });
        break;
      case 'judgment': case 'shiningray': case 'holy':
        bell(1047, { gain: 0.08, dur: 1, pan });
        thump(120, { dur: 0.3, gain: 0.2, pan, verb: 0.4 });
        break;
      default:
        tone(880, { to: 440, dur: 0.15, gain: 0.05, pan });
        noise({ filter: { type: 'bandpass', f: 1500, q: 1 }, dur: 0.12, gain: 0.08, pan });
    }
  },
  // ---------- The warrior paths ----------
  pillar({ pan }) {
    tone(2093, { to: 1047, dur: 0.18, gain: 0.05, pan, verb: 0.4 });
    bell(784, { gain: 0.07, dur: 1.1, delay: 0.08, pan });
  },
  aegis({ pan }) {
    noise({ filter: { type: 'bandpass', f: 2400, q: 6 }, dur: 0.18, gain: 0.14, pan });
    tone(1047, { dur: 0.5, gain: 0.06, pan, verb: 0.4 });
    tone(1568, { dur: 0.4, gain: 0.04, pan, verb: 0.4 });
  },
  consecrate({ pan }) {
    thump(100, { dur: 0.4, gain: 0.3, pan, verb: 0.4 });
    [262, 330, 392, 523].forEach((f, i) => tone(f, { type: 'triangle', dur: 1.2, attack: 0.2, gain: 0.04, delay: i * 0.04, pan, verb: 0.6 }));
    bell(1047, { gain: 0.06, dur: 1.2, delay: 0.1, pan });
  },
  verdict({ pan }) {
    RECIPES.boom({ size: 2.5, pan });
    [262, 330, 392, 523, 659].forEach((f, i) => tone(f, { type: 'sawtooth', dur: 1.8, attack: 0.3, gain: 0.03, filter: { type: 'lowpass', f: 1800 }, vibrato: { rate: 5, depth: 3 }, delay: i * 0.03, pan, verb: 0.7 }));
    bell(1568, { gain: 0.1, dur: 1.6, pan });
  },
  bloodmoon({ pan }) {
    tone(55, { type: 'sawtooth', dur: 1.2, attack: 0.3, gain: 0.1, filter: { type: 'lowpass', f: 300 }, drive: 3, pan, verb: 0.5 });
    tone(58, { type: 'sawtooth', dur: 1.2, attack: 0.3, gain: 0.06, filter: { type: 'lowpass', f: 300 }, pan, verb: 0.5 });
  },
  eclipse({ pan }) {
    RECIPES.boom({ size: 2.5, pan });
    noise({ filter: { type: 'bandpass', f: 800, q: 1 }, dur: 0.4, gain: 0.2, drive: 8, pan });
  },
  rageburst({ pan }) {
    RECIPES.boom({ size: 1, pan });
    noise({ filter: { type: 'bandpass', f: 1000, q: 1.2 }, dur: 0.18, gain: 0.18, drive: 8, pan });
  },
  berserk() {
    RECIPES.roar({});
    tone(110, { type: 'sawtooth', to: 220, dur: 0.6, gain: 0.08, filter: { type: 'lowpass', f: 900 }, drive: 4 });
  },
  sanctified() {
    [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, { type: 'triangle', dur: 1.6, attack: 0.4, gain: 0.04, delay: i * 0.08, vibrato: { rate: 5, depth: 3 }, verb: 0.7 }));
  },
  link() {
    arp([1319, 1976], { type: 'square', step: 0.06, gain: 0.05, dur: 0.15 });
  },
  tier({ n = 1 }) {
    arp([784, 988, 1175, 1568].slice(0, 1 + n), { type: 'square', step: 0.05, gain: 0.04, dur: 0.12 });
  },
  // ---------- Moving ----------
  step({ ground = 'grass', pan }) {
    const sets = {
      grass: { f: 1800, q: 1.5, g: 0.05 }, stone: { f: 2800, q: 3, g: 0.06, thud: 160 }, wood: { f: 900, q: 4, g: 0.06, thud: 220 },
      cloud: { f: 700, q: 0.7, g: 0.035 }, crystal: { f: 3600, q: 6, g: 0.04, ring: true }, sand: { f: 2200, q: 0.8, g: 0.05 },
    };
    const s = sets[ground] ?? sets.grass;
    noise({ filter: { type: 'bandpass', f: s.f * rnd(0.85, 1.15), q: s.q }, dur: 0.04, gain: s.g, pan, verb: 0.05 });
    if (s.thud) thump(s.thud, { dur: 0.05, gain: 0.05, pan });
    if (s.ring) tone(rnd(3000, 4000), { dur: 0.06, gain: 0.012, pan });
  },
  jump({ pan }) {
    tone(330, { type: 'triangle', to: 620, dur: 0.12, gain: 0.07, pan });
    whoosh(1200, 2400, { dur: 0.1, gain: 0.04, pan });
  },
  land({ hard, pan }) {
    thump(hard ? 120 : 160, { dur: hard ? 0.14 : 0.07, gain: hard ? 0.25 : 0.12, pan });
    noise({ filter: { type: 'lowpass', f: 900 }, dur: 0.08, gain: hard ? 0.1 : 0.05, pan });
  },
  climb({ pan }) {
    noise({ filter: { type: 'bandpass', f: 650, q: 7 }, dur: 0.07, gain: 0.04, pan });
  },
  portal() {
    whoosh(200, 3000, { dur: 0.5, gain: 0.12, attack: 0.15 });
    arp([523, 784, 1047, 1568], { type: 'sine', step: 0.07, gain: 0.05, dur: 0.5 });
  },
  // ---------- Loot, progress ----------
  drop({ pan, rare }) {
    tone(1319, { dur: 0.08, gain: 0.04, pan });
    if (rare) arp([1568, 2093, 2637, 3136], { type: 'sine', step: 0.06, gain: 0.05, dur: 0.6, pan });
  },
  coin() {
    tone(1319, { type: 'square', dur: 0.06, gain: 0.04, filter: { type: 'lowpass', f: 4000 } });
    tone(1760, { type: 'square', dur: 0.22, gain: 0.04, delay: 0.06, filter: { type: 'lowpass', f: 4000 }, verb: 0.2 });
  },
  pickup() {
    tone(880, { type: 'triangle', to: 1320, dur: 0.08, gain: 0.07 });
  },
  levelup() {
    arp([523, 659, 784, 1047], { type: 'square', step: 0.09, gain: 0.05, dur: 0.18 });
    [523, 659, 784, 1047].forEach((f) => tone(f, { type: 'triangle', dur: 1.2, attack: 0.02, gain: 0.05, delay: 0.38, verb: 0.5 }));
    arp([2093, 2637, 3136], { type: 'sine', step: 0.05, gain: 0.03, dur: 0.4, delay: 0.4 });
  },
  questAccept() {
    arp([784, 1175], { type: 'triangle', step: 0.08, gain: 0.07, dur: 0.3 });
  },
  questDone() {
    arp([784, 988, 1175, 1568], { type: 'triangle', step: 0.08, gain: 0.07, dur: 0.35 });
    tone(2093, { dur: 0.6, gain: 0.04, delay: 0.32, verb: 0.5 });
  },
  jobUp() {
    RECIPES.levelup();
    [262, 330, 392].forEach((f) => tone(f, { type: 'sawtooth', dur: 1.6, attack: 0.3, gain: 0.03, filter: { type: 'lowpass', f: 1500 }, delay: 0.3, verb: 0.6 }));
  },
  death() {
    arp([659, 587, 523, 392], { type: 'triangle', step: 0.18, gain: 0.07, dur: 0.4 });
  },
  // ---------- Interface ----------
  click() {
    tone(1250, { dur: 0.025, gain: 0.05, verb: 0 });
  },
  open() {
    tone(520, { type: 'triangle', to: 920, dur: 0.08, gain: 0.06, verb: 0.05 });
  },
  close() {
    tone(760, { type: 'triangle', to: 420, dur: 0.08, gain: 0.05, verb: 0.05 });
  },
  denied() {
    tone(220, { type: 'square', dur: 0.06, gain: 0.04, filter: { type: 'lowpass', f: 1200 } });
    tone(196, { type: 'square', dur: 0.08, gain: 0.04, delay: 0.08, filter: { type: 'lowpass', f: 1200 } });
  },
  // An NPC's voice while their words type out: a short blip at their own pitch, varied a little.
  blip({ pitch = 600, kind = 'triangle' }) {
    tone(pitch * rnd(0.9, 1.15), { type: kind, dur: 0.035, gain: 0.04, bus: C.voice, verb: 0.05, filter: { type: 'lowpass', f: 3000 } });
  },
};

export const SOUND_NAMES = Object.keys(RECIPES);
