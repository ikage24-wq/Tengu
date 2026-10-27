// The sound bank: every effect and song loop, rendered once by the chip and kept as ready-to-play
// audio buffers. The rendering runs in a background worker (worker.js); if the browser can't run
// one, it's done here a piece at a time between frames instead.
//
// On the first unlock, every effect is queued, the everyday ones (steps, hits, coins, menus)
// first, and the song for wherever the player is goes to the front of the line.

import { render } from './synth.js';
import { RECIPES, variantsOf } from './recipes.js';
import { renderSong } from './tracker.js';
import { SONGS } from './songs.js';
import { onUnlock, toBuffer } from './engine.js';

const sfxBufs = new Map();
const songBufs = new Map();
const waiting = new Map();
const asked = new Set();
const pending = new Set();
let worker = null;
let sr = 44100;
const queue = [];
let busy = false;

// The ones heard all the time, rendered first.
const FIRST = ['click', 'cursor', 'open', 'close', 'blipTri', 'blipPulse', 'blipRasp', 'stepGrass', 'stepStone', 'stepWood', 'jump', 'land', 'swing', 'hit', 'hitMedium', 'enemyHurt', 'coin', 'pickup', 'poof', 'hurt'];

onUnlock((ac) => {
  sr = ac.sampleRate;
  try {
    worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = ({ data: m }) => receive(m);
    // A worker that can't start: everything still waiting is made here instead.
    worker.onerror = () => {
      worker = null;
      asked.clear();
      for (const name of Object.keys(RECIPES)) if (!sfxBufs.has(name)) want({ type: 'sfx', name });
      for (const key of pending) want({ type: 'song', key }, true);
    };
  } catch {
    worker = null;
  }
  for (const name of [...FIRST, ...Object.keys(RECIPES)]) want({ type: 'sfx', name });
});

function want(job, front = false) {
  const id = `${job.type}:${job.name ?? job.key}`;
  if (asked.has(id)) return;
  asked.add(id);
  if (worker) worker.postMessage({ ...job, sr, front });
  else {
    front ? queue.unshift(job) : queue.push(job);
    pump();
  }
}

// Without a worker: one job per tick, so frames keep coming.
function pump() {
  if (busy || !queue.length) return;
  busy = true;
  setTimeout(() => {
    const job = queue.shift();
    try {
      if (job.type === 'sfx') {
        const variants = [];
        for (let v = 0; v < variantsOf(job.name); v++) variants.push(render(RECIPES[job.name], sr, v + 1));
        receive({ type: 'sfx', name: job.name, variants });
      } else receive({ type: 'song', key: job.key, ...renderSong(SONGS[job.key], sr) });
    } catch (err) {
      console.warn('sound', job, err);
    }
    busy = false;
    pump();
  }, 0);
}

function receive(m) {
  if (m.type === 'sfx') sfxBufs.set(m.name, m.variants.map((v) => toBuffer(v, sr)));
  else if (m.type === 'song') {
    const song = { buffer: toBuffer([m.left, m.right], m.sampleRate), loopStart: m.loopStart, loopEnd: m.loopEnd, bpm: SONGS[m.key].bpm, rows: SONGS[m.key].rows ?? 16 };
    pending.delete(m.key);
    songBufs.set(m.key, song);
    // A minute of stereo is about 20 MB, so only the most recent few songs are kept.
    while (songBufs.size > 5) songBufs.delete(songBufs.keys().next().value);
    for (const fn of waiting.get(m.key) ?? []) fn(song);
    waiting.delete(m.key);
  } else if (m.type === 'error') console.warn('sound', m.key, m.message);
}

// A ready buffer for an effect (a random one of its variants), or null while it's still being
// made. A short sound asked for before it's ready is made on the spot.
export function sfxBuffer(name) {
  const bufs = sfxBufs.get(name);
  if (bufs) return bufs[Math.floor(Math.random() * bufs.length)];
  if (!RECIPES[name]) return null;
  if (!asked.has(`sfx:${name}`) || worker) {
    const len = RECIPES[name].layers.reduce((n, L) => Math.max(n, (L.at ?? 0) + (L.len ?? 300)), 0);
    if (len < 400 && !RECIPES[name].layers.some((L) => L.seq)) {
      const b = toBuffer(render(RECIPES[name], sr, 1), sr);
      sfxBufs.set(name, [b]);
      return b;
    }
  }
  want({ type: 'sfx', name }, true);
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
  asked.delete(`song:${key}`);
  if (!pending.has(key)) {
    pending.add(key);
    want({ type: 'song', key }, true);
  }
  return null;
}

// Asks for songs ahead of time (the ones the player will likely hear next).
export function prepareSongs(keys) {
  for (const k of keys) {
    if (!SONGS[k] || songBufs.has(k) || pending.has(k)) continue;
    pending.add(k);
    asked.delete(`song:${k}`);
    want({ type: 'song', key: k });
  }
}
