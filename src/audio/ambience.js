// The world around you: under each area's music, a soft bed of sound that never stops (wind in the
// grass, the sea, a cave's hush, a town's murmur) and, over it, little sounds now and then (birds,
// gulls, drips, far-off chatter, chimes), on their own bus a touch under the effects. Day and night
// follow the player's own clock: birds by day, crickets and an owl by night, a quieter town.
//
// The beds are built live from nodes (looping noise through filters, its level drifting on a slow
// wave), so they never repeat; the little sounds are ordinary recipes (recipes.js) played at random
// times and places across the stereo field.

import { context, busNode, now, audioReady } from './engine.js';
import { sfx } from './sfx.js';

// The time of day from the player's clock: 'dawn', 'day', 'dusk' or 'night'.
export function dayPart(date = new Date()) {
  const h = date.getHours();
  return h >= 5 && h < 8 ? 'dawn' : h >= 8 && h < 17 ? 'day' : h >= 17 && h < 20 ? 'dusk' : 'night';
}

// Each kind of place: its bed (a lowpass and highpass on the noise, a level in dB, and how its
// level drifts: rate in Hz and depth 0-1), and its little sounds by day and by night, each
// [recipe, shortest gap s, longest gap s].
const PLACES = {
  meadow: {
    bed: { lp: 700, hp: 140, db: -36, lfo: 0.08, depth: 0.5 },
    day: [['birdChirp', 2, 6], ['birdTrill', 5, 12], ['leafRustle', 6, 14]],
    night: [['cricket', 0.5, 1.6], ['owl', 14, 30], ['leafRustle', 8, 16]],
  },
  forest: {
    bed: { lp: 600, hp: 120, db: -35, lfo: 0.06, depth: 0.5 },
    day: [['birdChirp', 1.5, 5], ['birdTrill', 4, 10], ['leafRustle', 3, 8]],
    night: [['cricket', 0.4, 1.4], ['owl', 10, 22], ['leafRustle', 5, 12]],
  },
  harbor: {
    bed: { lp: 650, hp: 90, db: -31, lfo: 0.13, depth: 0.8 },
    day: [['waveWash', 3, 6], ['gull', 6, 14], ['woodCreak', 8, 16]],
    night: [['waveWash', 3, 6], ['woodCreak', 7, 14], ['cricket', 1, 3]],
  },
  town: {
    bed: { lp: 420, hp: 80, db: -40, lfo: 0.05, depth: 0.3 },
    day: [['chatter', 1.5, 4], ['birdChirp', 5, 12], ['townBell', 30, 60]],
    night: [['chatter', 5, 12], ['cricket', 0.8, 2.4], ['townBell', 40, 80]],
  },
  cave: {
    bed: { lp: 190, hp: 30, db: -30, lfo: 0.05, depth: 0.3 },
    day: [['drip', 1.5, 5]],
    night: [['drip', 1.5, 5]],
  },
  crag: {
    bed: { lp: 950, hp: 220, db: -32, lfo: 0.09, depth: 0.75 },
    day: [['hawkCry', 10, 22], ['leafRustle', 8, 16]],
    night: [['cricket', 1, 3], ['owl', 18, 34]],
  },
  ruins: {
    bed: { lp: 600, hp: 160, db: -34, lfo: 0.07, depth: 0.6 },
    day: [['windChime', 8, 16], ['drip', 6, 14], ['birdChirp', 8, 18]],
    night: [['windChime', 10, 20], ['owl', 14, 28], ['drip', 6, 14]],
  },
  sky: {
    bed: { lp: 2400, hp: 700, db: -38, lfo: 0.1, depth: 0.6 },
    day: [['windChime', 5, 10], ['birdTrill', 6, 14]],
    night: [['windChime', 6, 12]],
  },
  hollow: {
    bed: { lp: 230, hp: 40, db: -30, lfo: 0.05, depth: 0.4 },
    day: [['drip', 2, 6], ['woodCreak', 6, 14]],
    night: [['drip', 2, 6], ['woodCreak', 6, 14]],
  },
};
// Which kind of place a map is.
export function placeOf(map) {
  if (!map) return null;
  if (map.dungeon || map.theme === 'hollow') return 'hollow';
  if (map.isTown) return 'town';
  if (map.theme === 'grove' || map.theme === 'shrine' || map.theme === 'springs') return 'forest';
  return PLACES[map.theme] ? map.theme : 'meadow';
}

// One bed playing: { kind, src, filters, gain, lfo }.
let bed = null;
let noise = null;
const next = new Map();

function noiseBuffer(ac) {
  if (noise) return noise;
  // Four seconds of soft (pinkish) stereo noise, looped.
  const len = ac.sampleRate * 4;
  noise = ac.createBuffer(2, len, ac.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = noise.getChannelData(c);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.997 * b0 + w * 0.029;
      b1 = 0.985 * b1 + w * 0.032;
      b2 = 0.95 * b2 + w * 0.048;
      d[i] = (b0 + b1 + b2 + w * 0.02) * 2.2;
    }
    // Cross-fade the ends so the loop has no seam.
    const f = Math.floor(ac.sampleRate * 0.05);
    for (let i = 0; i < f; i++) {
      const k = i / f;
      d[i] = d[i] * k + d[len - f + i] * (1 - k);
    }
  }
  return noise;
}

function startBed(kind) {
  const ac = context();
  const out = busNode('amb');
  if (!ac || !out) return;
  const B = PLACES[kind].bed;
  const src = ac.createBufferSource();
  src.buffer = noiseBuffer(ac);
  src.loop = true;
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = B.lp;
  const hp = ac.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = B.hp;
  const gain = ac.createGain();
  const level = Math.pow(10, B.db / 20);
  const t = ac.currentTime;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(level, t + 2);
  // The drift: a slow wave added to the level (gusts, waves rolling in).
  const lfo = ac.createOscillator();
  lfo.frequency.value = B.lfo;
  const lfoGain = ac.createGain();
  lfoGain.gain.value = level * B.depth;
  lfo.connect(lfoGain);
  lfoGain.connect(gain.gain);
  src.connect(lp);
  lp.connect(hp);
  hp.connect(gain);
  gain.connect(out);
  src.start();
  lfo.start();
  bed = { kind, src, gain, lfo };
}

function stopBed() {
  if (!bed) return;
  const ac = context();
  const t = ac.currentTime;
  const { src, gain, lfo } = bed;
  gain.gain.cancelScheduledValues(t);
  gain.gain.setValueAtTime(gain.gain.value, t);
  gain.gain.linearRampToValueAtTime(0, t + 1.5);
  src.stop(t + 1.6);
  lfo.stop(t + 1.6);
  bed = null;
}

// Call every frame: keeps the right bed playing for the map (cross-fading between places) and
// plays the place's little sounds. `quiet` (0-1) turns the little sounds down in a fight.
export function updateAmbience(map, quiet = 0) {
  if (!audioReady()) return;
  const kind = placeOf(map);
  if (bed?.kind !== kind) {
    stopBed();
    next.clear();
    if (kind) startBed(kind);
  }
  if (!kind) return;
  const t = now();
  const part = dayPart();
  const list = PLACES[kind][part === 'night' ? 'night' : 'day'];
  for (const [name, lo, hi] of list) {
    const at = next.get(name);
    if (at == null) {
      next.set(name, t + lo + Math.random() * (hi - lo));
      continue;
    }
    if (t < at) continue;
    next.set(name, t + lo + Math.random() * (hi - lo));
    // Dusk and dawn thin the birds out; a fight drowns the small sounds.
    if ((part === 'dusk' || part === 'dawn') && name.startsWith('bird') && Math.random() < 0.4) continue;
    if (Math.random() < quiet * 0.8) continue;
    sfx(name, { bus: 'amb', pan: (Math.random() * 2 - 1) * 0.7, db: -quiet * 6 });
  }
}

// Silence (the title, the menus): the bed fades away.
export function stopAmbience() {
  stopBed();
  next.clear();
}
