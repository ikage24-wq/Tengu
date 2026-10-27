// The sound engine: every sound in the game is synthesized here with the Web Audio API (no audio
// files), like the art is drawn in code. Sounds go through three buses (effects, music, voices)
// into a master gain, a gentle compressor, and a shared reverb send for space.
//
// Browsers only allow audio after the player has done something, so nothing plays until
// `unlock()` runs on the first key press or click. Without Web Audio (tests, old browsers) every
// call here quietly does nothing.

import { settings } from '../core/settings.js';

let ac = null;
let master = null;
let buses = null;
let verb = null;
let noiseBuf = null;
let output = null;

// Volume levels as the Options window offers them.
export const LEVELS = { off: 0, low: 0.35, mid: 0.65, high: 1 };
const level = (v) => (typeof v === 'number' ? v : LEVELS[v] ?? 0.65);

export const audioReady = () => Boolean(ac) && ac.state === 'running';
export const now = () => (ac ? ac.currentTime : 0);

export function unlock() {
  const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
  if (!AC) return;
  if (ac) {
    if (ac.state === 'suspended') ac.resume();
    return;
  }
  ac = new AC();
  const comp = ac.createDynamicsCompressor();
  comp.threshold.value = -16;
  comp.knee.value = 12;
  comp.ratio.value = 4;
  comp.attack.value = 0.004;
  comp.release.value = 0.2;
  master = ac.createGain();
  master.connect(comp);
  comp.connect(ac.destination);
  output = comp;
  buses = {};
  for (const name of ['sfx', 'music', 'voice']) {
    buses[name] = ac.createGain();
    buses[name].connect(master);
  }
  // A soft room: a short decaying noise impulse, sent to from each sound by its own amount.
  verb = ac.createConvolver();
  verb.buffer = impulse(1.8, 2.6);
  const wet = ac.createGain();
  wet.gain.value = 0.32;
  verb.connect(wet);
  wet.connect(master);
  noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  applyVolumes();
}

// Picks up the volume settings (call after they change).
export function applyVolumes() {
  if (!ac) return;
  const t = ac.currentTime;
  master.gain.setTargetAtTime(level(settings.masterVolume) * 0.9, t, 0.05);
  buses.sfx.gain.setTargetAtTime(level(settings.sfxVolume), t, 0.05);
  buses.voice.gain.setTargetAtTime(level(settings.sfxVolume) * 0.8, t, 0.05);
  buses.music.gain.setTargetAtTime(level(settings.musicVolume) * 0.55, t, 0.05);
}

function impulse(secs, decay) {
  const len = Math.floor(ac.sampleRate * secs);
  const buf = ac.createBuffer(2, len, ac.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return buf;
}

// The end of a voice's chain: optional pan, the bus, and a share sent to the reverb.
function out(node, { bus = 'sfx', pan = 0, verb: send = 0.15 } = {}) {
  let last = node;
  if (pan && ac.createStereoPanner) {
    const p = ac.createStereoPanner();
    p.pan.value = Math.max(-0.8, Math.min(0.8, pan));
    last.connect(p);
    last = p;
  }
  last.connect(buses[bus]);
  if (send > 0) {
    const g = ac.createGain();
    g.gain.value = send;
    last.connect(g);
    g.connect(verb);
  }
}

// An envelope on a gain node: a quick attack to `peak`, then an exponential fall over `dur`.
function env(g, t, peak, attack, dur, curve = 'exp') {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + attack);
  if (curve === 'exp') g.gain.exponentialRampToValueAtTime(0.0001, t + attack + dur);
  else g.gain.linearRampToValueAtTime(0.0001, t + attack + dur);
}

// One oscillator voice. `f` is the start frequency, `to` where it slides to over `slide` seconds.
// Options: type, gain, attack, dur, delay, filter ({ type, f, q, to }), vibrato ({ rate, depth }),
// detune (cents), pan, verb, bus, curve.
export function tone(f, o = {}) {
  if (!ac) return;
  const t = ac.currentTime + (o.delay ?? 0);
  const dur = o.dur ?? 0.2;
  const osc = ac.createOscillator();
  osc.type = o.type ?? 'sine';
  osc.frequency.setValueAtTime(f, t);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t + (o.slide ?? dur));
  if (o.detune) osc.detune.value = o.detune;
  let node = osc;
  if (o.vibrato) {
    const lfo = ac.createOscillator();
    const depth = ac.createGain();
    lfo.frequency.value = o.vibrato.rate;
    depth.gain.value = o.vibrato.depth;
    lfo.connect(depth);
    depth.connect(osc.frequency);
    lfo.start(t);
    lfo.stop(t + (o.attack ?? 0.005) + dur + 0.05);
  }
  if (o.filter) node = filtered(node, o.filter, t, dur);
  if (o.drive) node = driven(node, o.drive);
  const g = ac.createGain();
  env(g, t, o.gain ?? 0.2, o.attack ?? 0.005, dur, o.curve);
  node.connect(g);
  out(g, o);
  osc.start(t);
  osc.stop(t + (o.attack ?? 0.005) + dur + 0.05);
}

// A burst of noise through a filter (`filter`: { type, f, q, to } sweeping f to `to`).
export function noise(o = {}) {
  if (!ac) return;
  const t = ac.currentTime + (o.delay ?? 0);
  const dur = o.dur ?? 0.15;
  const src = ac.createBufferSource();
  src.buffer = noiseBuf;
  src.playbackRate.value = o.rate ?? 1;
  let node = filtered(src, o.filter ?? { type: 'bandpass', f: 1200, q: 1 }, t, dur);
  if (o.drive) node = driven(node, o.drive);
  const g = ac.createGain();
  env(g, t, o.gain ?? 0.2, o.attack ?? 0.003, dur, o.curve);
  node.connect(g);
  out(g, o);
  src.start(t, Math.random() * 1.5);
  src.stop(t + (o.attack ?? 0.003) + dur + 0.05);
}

function filtered(node, fl, t, dur) {
  const f = ac.createBiquadFilter();
  f.type = fl.type ?? 'lowpass';
  f.frequency.setValueAtTime(fl.f, t);
  if (fl.to) f.frequency.exponentialRampToValueAtTime(Math.max(30, fl.to), t + (fl.slide ?? dur));
  f.Q.value = fl.q ?? 0.8;
  node.connect(f);
  return f;
}

const curves = new Map();
function driven(node, amount) {
  const ws = ac.createWaveShaper();
  if (!curves.has(amount)) {
    const n = 1024;
    const c = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * 2 - 1;
      c[i] = Math.tanh(x * amount) / Math.tanh(amount);
    }
    curves.set(amount, c);
  }
  ws.curve = curves.get(amount);
  node.connect(ws);
  return ws;
}

// Music notes are scheduled ahead at exact times, so they take an absolute start `at`.
export function note(f, at, o = {}) {
  if (!ac) return;
  tone(f, { ...o, bus: 'music', delay: Math.max(0, at - ac.currentTime) });
}
export function beat(at, o = {}) {
  if (!ac) return;
  noise({ ...o, bus: 'music', delay: Math.max(0, at - ac.currentTime) });
}

// Semitones from A4 to a frequency.
export const hz = (semis) => 440 * Math.pow(2, semis / 12);

// A live stream of everything the game plays (for recording a clip with sound).
export function captureStream() {
  if (!ac) return null;
  const dest = ac.createMediaStreamDestination();
  output.connect(dest);
  return dest.stream;
}
