// The sound bank: every effect and song loop, rendered once (synth.js, studio.js) and kept as
// ready-to-play audio buffers. The recordings they're made from (samples.js) start loading as
// soon as the page opens; the rendering runs in a background worker (worker.js), or, if the
// browser can't run one, here, a piece at a time between frames.
//
// Effects render at 44.1 kHz; songs at 32 kHz (plenty for music, and a third of the memory). The
// everyday effects (steps, hits, coins, menus) go first, and a song that's wanted now jumps the line.

import { render } from './synth.js';
import { RECIPES, variantsOf } from './recipes.js';
import { renderSong } from './studio.js';
import { SONGS } from './songs.js';
import { loadSamples, transferables } from './samples.js';
import { onUnlock, toBuffer } from './engine.js';

const SFX_SR = 44100;
const SONG_SR = 32000;
const sfxBufs = new Map();
const raw = new Map();
const songBufs = new Map();
const waiting = new Map();
const asked = new Set();
const pending = new Set();
const queue = [];
let worker = null;
let bank = null;
let busy = false;
let unlocked = false;

// The ones heard all the time, rendered first.
const FIRST = ['click', 'cursor', 'open', 'close', 'blipTri', 'blipPulse', 'blipRasp', 'stepGrass', 'stepStone', 'stepWood', 'jump', 'land', 'swing', 'hit', 'hitMedium', 'enemyHurt', 'coin', 'pickup', 'poof', 'hurt'];

if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
  loadSamples()
    .then((b) => {
      try {
        worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
        worker.onmessage = ({ data: m }) => receive(m);
        // A worker that can't start: everything still waiting is made here instead.
        worker.onerror = async () => {
          worker = null;
          bank = await loadSamples(true);
          for (const job of [...asked].map((id) => id.split(':'))) if (!(job[0] === 'sfx' ? raw.has(job[1]) : songBufs.has(job[1]))) queue.push(job[0] === 'sfx' ? { type: 'sfx', name: job[1], prio: 2 } : { type: 'song', key: job[1], prio: 0 });
          pump();
        };
        worker.postMessage({ type: 'bank', bank: b }, transferables(b));
      } catch {
        worker = null;
        bank = b;
      }
      // The title song is made before the first click, so the title screen has music at once;
      // then the everyday effects, the town's song, and every other effect.
      prepareSongs(['title'], 0);
      for (const name of FIRST) want({ type: 'sfx', name }, 1);
      prepareSongs(['town'], 1);
      for (const name of Object.keys(RECIPES)) want({ type: 'sfx', name }, 2);
      // Jobs asked for before the recordings arrived.
      for (const job of queue.splice(0)) post(job);
    })
    .catch((err) => console.warn('sound: could not load the recordings', err));
}
onUnlock(() => {
  unlocked = true;
  for (const [name, variants] of raw) sfxBufs.set(name, variants.map((v) => toBuffer(v, SFX_SR)));
});

// Asks for a job at a priority (lower first: 0 a song wanted now, 1 everyday effects, 2 other
// effects, 3 songs for later).
function want(job, prio = 2) {
  const id = `${job.type}:${job.name ?? job.key}`;
  if (asked.has(id)) return;
  asked.add(id);
  post({ ...job, prio });
}

function post(job) {
  if (worker) worker.postMessage({ ...job, sr: job.type === 'song' ? SONG_SR : SFX_SR });
  else {
    const i = queue.findIndex((j) => j.prio > job.prio);
    i < 0 ? queue.push(job) : queue.splice(i, 0, job);
    pump();
  }
}

// Without a worker: one job per tick, so frames keep coming.
function pump() {
  if (busy || !queue.length || !bank) return;
  busy = true;
  setTimeout(() => {
    const job = queue.shift();
    try {
      if (job.type === 'sfx') {
        const variants = [];
        for (let v = 0; v < variantsOf(job.name); v++) variants.push(render(RECIPES[job.name], SFX_SR, v + 1, bank));
        receive({ type: 'sfx', name: job.name, variants });
      } else receive({ type: 'song', key: job.key, ...renderSong(SONGS[job.key], bank, SONG_SR) });
    } catch (err) {
      console.warn('sound', job, err);
    }
    busy = false;
    pump();
  }, 0);
}

function receive(m) {
  if (m.type === 'sfx') {
    raw.set(m.name, m.variants);
    if (unlocked) sfxBufs.set(m.name, m.variants.map((v) => toBuffer(v, SFX_SR)));
  } else if (m.type === 'song') {
    pending.delete(m.key);
    if (!unlocked) {
      // Before the first click there's no audio yet: keep the samples until there is.
      onUnlock(() => receive(m));
      return;
    }
    const song = { buffer: toBuffer([m.left, m.right], m.sampleRate), loopStart: m.loopStart, loopEnd: m.loopEnd, bpm: SONGS[m.key].bpm, rows: SONGS[m.key].rows ?? 16 };
    songBufs.set(m.key, song);
    // A minute of stereo is about 15 MB, so only the most recent few songs are kept (an area's song
    // and its fight layer count as two).
    while (songBufs.size > 6) songBufs.delete(songBufs.keys().next().value);
    for (const fn of waiting.get(m.key) ?? []) fn(song);
    waiting.delete(m.key);
  } else if (m.type === 'error') console.warn('sound', m.key, m.message);
}

// A ready buffer for an effect (a random one of its variants), or null while it's still being
// made (it's then moved to the front of the line).
export function sfxBuffer(name) {
  const bufs = sfxBufs.get(name);
  if (bufs) return bufs[Math.floor(Math.random() * bufs.length)];
  if (!RECIPES[name]) return null;
  if (!asked.has(`sfx:${name}`)) want({ type: 'sfx', name }, 1);
  return null;
}

// A song loop: { buffer, loopStart, loopEnd, bpm }, or null while it's being made (it's
// requested, and `then` runs when it's ready).
export function songBuffer(key, then) {
  if (songBufs.has(key)) {
    const song = songBufs.get(key);
    songBufs.delete(key);
    songBufs.set(key, song);
    return song;
  }
  if (!SONGS[key]) return null;
  if (then) waiting.set(key, [...(waiting.get(key) ?? []), then]);
  if (!pending.has(key)) {
    pending.add(key);
    asked.delete(`song:${key}`);
    want({ type: 'song', key }, 0);
  }
  return null;
}

// Asks for songs ahead of time (the ones the player will likely hear next), after the effects;
// `prio` 0 makes them as urgent as a song wanted now.
export function prepareSongs(keys, prio = 3) {
  for (const k of keys) {
    if (!SONGS[k] || songBufs.has(k) || (pending.has(k) && prio > 0)) continue;
    pending.add(k);
    asked.delete(`song:${k}`);
    want({ type: 'song', key: k }, prio);
  }
}
