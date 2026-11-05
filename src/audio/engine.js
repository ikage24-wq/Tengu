// The sound engine. Songs (studio.js) and effects (synth.js) are made from recorded instruments
// and effects (samples.js) mixed with synths made in code, rendered once into samples (bank.js);
// this file plays those buffers through the Web Audio API.
//
// The mix, after docs/audio/research-sfx.md and research-japanese.md:
// - Four buses into the master: effects, music, voices (NPC text blips) and the interface. The
//   interface is dry, in front, and never dipped. The effects come down together as more of them
//   ring at once (`setDensity`), so a busy fight stays clear.
// - The music dips under jingles and your own big blows (`duck`), the way FFXIV and Pokemon keep
//   their fanfares clear, and comes back up smoothly.
// - A brick-wall limiter on the end, so a busy fight never clips, instead of a squashing
//   compressor; and only a short, small room (0.3 s) that magic and holy sounds send a little to
//   (the songs carry their own reverb).
//
// Browsers only allow audio after the player has done something, so nothing plays until
// `unlock()` runs on the first key press or click. Without Web Audio (tests, old browsers) every
// call here quietly does nothing.

import { settings } from '../core/settings.js';

let ac = null;
let master = null;
let buses = null;
let room = null;
let duckGain = null;
let musicTone = null;
let output = null;
let duckUntil = 0;
let duckDepth = 0;
let density = null;
const ready = [];

// Volume levels as the Options window offers them.
export const LEVELS = { off: 0, low: 0.35, mid: 0.65, high: 1 };
const level = (v) => (typeof v === 'number' ? v : LEVELS[v] ?? 0.65);
const dbGain = (db) => Math.pow(10, db / 20);

export const audioReady = () => Boolean(ac) && ac.state === 'running';
export const now = () => (ac ? ac.currentTime : 0);
export const sampleRate = () => (ac ? ac.sampleRate : 44100);
export const context = () => ac;
// Runs `fn` once audio has started (at once if it already has).
export const onUnlock = (fn) => (ac ? fn(ac) : ready.push(fn));

export function unlock() {
  const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
  if (!AC) return;
  if (ac) {
    if (ac.state === 'suspended') ac.resume();
    return;
  }
  ac = new AC({ latencyHint: 'interactive' });
  // The limiter: catches peaks only (threshold -3 dB, hard knee, fast), so sounds keep their punch.
  const lim = ac.createDynamicsCompressor();
  lim.threshold.value = -3;
  lim.knee.value = 0;
  lim.ratio.value = 20;
  lim.attack.value = 0.001;
  lim.release.value = 0.08;
  master = ac.createGain();
  master.connect(lim);
  lim.connect(ac.destination);
  output = lim;
  buses = {};
  for (const name of ['sfx', 'music', 'voice', 'ui', 'amb']) {
    buses[name] = ac.createGain();
    buses[name].connect(master);
  }
  // The effects bus goes through a gain that comes down as more effects ring at once
  // (`setDensity`), so a crowded fight doesn't pile up into a wall.
  buses.sfx.disconnect();
  density = ac.createGain();
  buses.sfx.connect(density);
  density.connect(master);
  // The music bus goes through its own ducking gain, and a lowpass that muffles it (low HP, a
  // calm night in town; wide open the rest of the time).
  buses.music.disconnect();
  duckGain = ac.createGain();
  musicTone = ac.createBiquadFilter();
  musicTone.type = 'lowpass';
  musicTone.frequency.value = 20000;
  musicTone.Q.value = 0.7;
  buses.music.connect(musicTone);
  musicTone.connect(duckGain);
  duckGain.connect(master);
  // A small room: 0.3 s of softly decaying noise, about -18 dB.
  room = ac.createConvolver();
  room.buffer = impulse(0.3, 3);
  const wet = ac.createGain();
  wet.gain.value = dbGain(-18) * 2;
  room.connect(wet);
  wet.connect(master);
  applyVolumes();
  // Some browsers suspend audio when the tab is hidden; wake it on the way back.
  document.addEventListener?.('visibilitychange', () => {
    if (!document.hidden && ac.state === 'suspended') ac.resume();
  });
  for (const fn of ready.splice(0)) fn(ac);
}

// Picks up the volume settings (call after they change).
// Quiet while the game's window isn't the one you're using (settings.muteAway), back on return.
let away = false;
export function setAway(on) {
  away = on;
  applyVolumes();
}

export function applyVolumes() {
  if (!ac) return;
  const t = ac.currentTime;
  const sfxV = level(settings.sfxVolume);
  master.gain.setTargetAtTime(away && settings.muteAway ? 0 : level(settings.masterVolume), t, 0.05);
  buses.sfx.gain.setTargetAtTime(sfxV, t, 0.05);
  buses.ui.gain.setTargetAtTime(sfxV, t, 0.05);
  buses.voice.gain.setTargetAtTime(sfxV, t, 0.05);
  // The world's ambience sits under the effects, a little quieter.
  buses.amb.gain.setTargetAtTime(sfxV * 0.85, t, 0.05);
  buses.music.gain.setTargetAtTime(level(settings.musicVolume), t, 0.05);
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

// Dips the music by `db` (negative) for `ms`, then lets it back up over about half a second.
// Overlapping dips keep the deepest and the latest end.
export function duck(db, ms) {
  if (!ac) return;
  const t = ac.currentTime;
  const depth = Math.min(db, t < duckUntil ? duckDepth : 0);
  duckDepth = depth;
  duckUntil = Math.max(duckUntil, t + ms / 1000);
  const g = duckGain.gain;
  g.cancelScheduledValues(t);
  g.setTargetAtTime(dbGain(depth), t, 0.03);
  g.setTargetAtTime(1, duckUntil, 0.18);
}

// Up to four effects ring at full level; past that they all come down together (eight at once
// about 3 dB, sixteen about 6 dB), easing over about 50 ms.
export function setDensity(n) {
  if (!ac) return;
  density.gain.setTargetAtTime(Math.sqrt(4 / Math.max(4, n)), ac.currentTime, 0.05);
}

// Muffles the music to a lowpass at `hz` (20000 = open), easing there over about `secs`.
export function muffleMusic(hz, secs = 0.4) {
  if (!ac) return;
  musicTone.frequency.setTargetAtTime(Math.max(200, Math.min(20000, hz)), ac.currentTime, secs / 3);
}

// Decodes a recorded file's bytes (a music track) into a buffer; null before audio is unlocked.
export const decodeFile = (bytes) => (ac ? new Promise((ok, no) => ac.decodeAudioData(bytes, ok, no)) : Promise.resolve(null));

// A bus's input node (for sounds built live from nodes, like the ambience beds).
export const busNode = (name) => (buses ? buses[name] : null);

// Turns a Float32Array (mono) or [left, right] into an AudioBuffer.
export function toBuffer(data, sr) {
  const chans = Array.isArray(data) ? data : [data];
  const buf = ac.createBuffer(chans.length, chans[0].length, sr ?? ac.sampleRate);
  chans.forEach((c, i) => buf.copyToChannel ? buf.copyToChannel(c, i) : buf.getChannelData(i).set(c));
  return buf;
}

// Plays a buffer once. o: { bus, db, rate (playback speed, 2 = an octave up), pan, room (send
// 0-1), at (audio time), detune (cents) }. Returns { src, gain } so it can be stopped.
export function play(buffer, o = {}) {
  if (!ac || !buffer) return null;
  const src = ac.createBufferSource();
  src.buffer = buffer;
  if (o.rate) src.playbackRate.value = o.rate;
  if (o.detune && src.detune) src.detune.value = o.detune;
  const gain = ac.createGain();
  gain.gain.value = dbGain(o.db ?? 0);
  src.connect(gain);
  let last = gain;
  if (o.pan && ac.createStereoPanner) {
    const p = ac.createStereoPanner();
    p.pan.value = Math.max(-0.8, Math.min(0.8, o.pan));
    last.connect(p);
    last = p;
  }
  last.connect(buses[o.bus ?? 'sfx']);
  if (o.room) {
    const g = ac.createGain();
    g.gain.value = o.room;
    last.connect(g);
    g.connect(room);
  }
  src.start(o.at ?? 0);
  return { src, gain };
}

// A looping music source on the music bus, starting at audio time `at`, `offset` seconds into
// the buffer, fading in over `fade` seconds. o.filter: a lowpass to open up over time (cutscenes).
export function loop(buffer, { at = 0, offset = 0, loopStart = 0, loopEnd = buffer.duration, fade = 0, db = 0, filter = null, silent = false } = {}) {
  if (!ac) return null;
  const src = ac.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  src.loopStart = loopStart;
  src.loopEnd = loopEnd;
  const gain = ac.createGain();
  const t = Math.max(at, ac.currentTime);
  const peak = dbGain(db);
  if (silent) gain.gain.value = 0;
  else if (fade > 0) {
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(peak, t + fade);
  } else gain.gain.value = peak;
  let lp = null;
  src.connect(gain);
  if (filter) {
    lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = filter;
    lp.Q.value = 0.9;
    gain.connect(lp);
    lp.connect(buses.music);
  } else gain.connect(buses.music);
  src.start(t, offset % Math.max(0.001, loopEnd));
  return { src, gain, lp, startedAt: t, offset, loopStart, loopEnd };
}

// Fades a playing source out over `fade` seconds (from audio time `at`, or now) and stops it.
export function stop(voice, fade = 0.05, at = 0) {
  if (!ac || !voice) return;
  const t = Math.max(ac.currentTime, at);
  const g = voice.gain.gain;
  g.cancelScheduledValues(t);
  g.setValueAtTime(g.value, t);
  g.linearRampToValueAtTime(0, t + Math.max(0.01, fade));
  try {
    voice.src.stop(t + Math.max(0.01, fade) + 0.02);
  } catch {
    // Already stopped.
  }
}

// A live stream of everything the game plays (for recording a clip with sound).
export function captureStream() {
  if (!ac) return null;
  const dest = ac.createMediaStreamDestination();
  output.connect(dest);
  return dest.stream;
}
