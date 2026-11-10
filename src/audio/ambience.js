// The world around you: under each area's music, a soft bed of sound that never stops (wind in the
// grass, the sea, a cave's hush, a town's murmur) and, over it, little sounds now and then (birds,
// gulls, drips, far-off chatter, chimes), on their own bus a touch under the effects. Day and night
// follow the player's own clock: birds by day, crickets and an owl by night, a quieter town.
//
// The beds are built live from nodes (looping noise through filters, its level drifting on a slow
// wave), so they never repeat; the little sounds are ordinary recipes (recipes.js) played at random
// times and places across the stereo field. A place with a `rec` bed plays a real recording instead
// (assets/audio/amb, cut from the Sonniss bundles by tools/build-amb.py), looped seamlessly; since
// 2026-11-08 every kind of place has one, each `recDb` matching its loudness to the others; until
// it has loaded, the built bed stands in and the recording cross-fades in over it.

import { context, busNode, now, audioReady, decodeFile } from './engine.js';
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
    bed: { lp: 700, hp: 140, db: -36, lfo: 0.08, depth: 0.5 }, rec: 'field', recDb: -17,
    day: [['birdChirp', 2, 6], ['birdTrill', 5, 12], ['leafRustle', 6, 14]],
    night: [['cricket', 0.5, 1.6], ['owl', 14, 30], ['leafRustle', 8, 16]],
  },
  forest: {
    bed: { lp: 600, hp: 120, db: -35, lfo: 0.06, depth: 0.5 }, rec: 'forest', recDb: -17,
    day: [['birdChirp', 1.5, 5], ['birdTrill', 4, 10], ['leafRustle', 3, 8]],
    night: [['cricket', 0.4, 1.4], ['owl', 10, 22], ['leafRustle', 5, 12]],
  },
  // A beach: real waves lapping the sand (Dawnlight Beach).
  beach: {
    bed: { lp: 650, hp: 90, db: -31, lfo: 0.13, depth: 0.8 }, rec: 'shore', recDb: -16,
    day: [['gull', 6, 14], ['waveWash', 9, 18]],
    night: [['cricket', 1, 3], ['waveWash', 9, 18]],
  },
  // A dock: boats knocking at their moorings, rope creaking, water slapping the piles.
  dock: {
    bed: { lp: 650, hp: 90, db: -31, lfo: 0.13, depth: 0.8 }, rec: 'marina', recDb: -15,
    day: [['gull', 7, 16]],
    night: [['cricket', 1, 3]],
  },
  harbor: {
    bed: { lp: 650, hp: 90, db: -31, lfo: 0.13, depth: 0.8 }, rec: 'harborwater', recDb: -31,
    day: [['waveWash', 3, 6], ['gull', 6, 14], ['woodCreak', 8, 16]],
    night: [['waveWash', 3, 6], ['woodCreak', 7, 14], ['cricket', 1, 3]],
  },
  // A farm village (Sprout): a warm field's insects and breeze under the town's chatter.
  village: {
    bed: { lp: 420, hp: 80, db: -40, lfo: 0.05, depth: 0.3 }, rec: 'field', recDb: -21,
    day: [['chatter', 2, 5], ['birdChirp', 3, 8], ['birdTrill', 7, 14], ['townBell', 30, 60]],
    night: [['chatter', 6, 14], ['cricket', 0.8, 2.4], ['owl', 20, 40]],
  },
  // A harbour town (Pastel Harbor): boats knocking at the quay under the town's chatter and gulls.
  port: {
    bed: { lp: 420, hp: 80, db: -40, lfo: 0.05, depth: 0.3 }, rec: 'marina', recDb: -19,
    day: [['chatter', 1.5, 4], ['gull', 5, 12], ['townBell', 30, 60]],
    night: [['chatter', 5, 12], ['woodCreak', 6, 14], ['townBell', 40, 80]],
  },
  town: {
    bed: { lp: 420, hp: 80, db: -40, lfo: 0.05, depth: 0.3 }, rec: 'townday', recDb: -9,
    day: [['chatter', 1.5, 4], ['birdChirp', 5, 12], ['townBell', 30, 60]],
    night: [['chatter', 5, 12], ['cricket', 0.8, 2.4], ['townBell', 40, 80]],
  },
  cave: {
    bed: { lp: 190, hp: 30, db: -30, lfo: 0.05, depth: 0.3 }, rec: 'cave', recDb: -14,
    day: [['drip', 1.5, 5]],
    night: [['drip', 1.5, 5]],
  },
  crag: {
    bed: { lp: 950, hp: 220, db: -32, lfo: 0.09, depth: 0.75 }, rec: 'highland', recDb: -14,
    day: [['hawkCry', 10, 22], ['leafRustle', 8, 16]],
    night: [['cricket', 1, 3], ['owl', 18, 34]],
  },
  ruins: {
    bed: { lp: 600, hp: 160, db: -34, lfo: 0.07, depth: 0.6 }, rec: 'nightwood', recDb: -18,
    day: [['windChime', 8, 16], ['drip', 6, 14], ['birdChirp', 8, 18]],
    night: [['windChime', 10, 20], ['owl', 14, 28], ['drip', 6, 14]],
  },
  sky: {
    bed: { lp: 2400, hp: 700, db: -38, lfo: 0.1, depth: 0.6 }, rec: 'softwind', recDb: -12,
    day: [['windChime', 5, 10], ['birdTrill', 6, 14]],
    night: [['windChime', 6, 12]],
  },
  hollow: {
    bed: { lp: 230, hp: 40, db: -30, lfo: 0.05, depth: 0.4 }, rec: 'mystic', recDb: -46,
    day: [['drip', 2, 6], ['woodCreak', 6, 14]],
    night: [['drip', 2, 6], ['woodCreak', 6, 14]],
  },
  // The Sunken Aquarium Palace: deep water, a low hum, drips of bubbles.
  aquarium: {
    bed: { lp: 260, hp: 40, db: -29, lfo: 0.08, depth: 0.6 }, rec: 'underwater', recDb: -16.5,
    day: [['drip', 1.5, 4]],
    night: [['drip', 1.5, 4]],
  },
  // The Clockwork Carnival: a far-off fairground at night, chimes and the creak of the rides.
  carnival: {
    bed: { lp: 420, hp: 60, db: -31, lfo: 0.1, depth: 0.4 }, rec: 'fairground', recDb: -40.5,
    day: [['windChime', 3, 8], ['woodCreak', 6, 12]],
    night: [['windChime', 3, 8], ['woodCreak', 6, 12]],
  },
  // The Star Observatory: a high, still night, wind round the tower, a far chime.
  observatory: {
    bed: { lp: 500, hp: 80, db: -32, lfo: 0.05, depth: 0.5 }, rec: 'shimmer', recDb: -41,
    day: [['windChime', 4, 10]],
    night: [['windChime', 4, 10]],
  },
  // The Candy Volcano: a warm rumble far below, bubbling, a chime of sugar glass.
  volcano: {
    bed: { lp: 220, hp: 30, db: -28, lfo: 0.12, depth: 0.5 }, rec: 'cauldron', recDb: -21.5,
    day: [['drip', 2, 5], ['windChime', 6, 12]],
    night: [['drip', 2, 5], ['windChime', 6, 12]],
  },
  // The Sky Whale's Back: open wind high over the clouds, rigging creaking, chimes on the stalls.
  skywhale: {
    bed: { lp: 900, hp: 120, db: -29, lfo: 0.09, depth: 0.6 }, rec: 'chimney', recDb: -30,
    day: [['windChime', 4, 9], ['woodCreak', 6, 12]],
    night: [['windChime', 4, 9], ['woodCreak', 6, 12]],
  },
  // The Dream Theatre: a big hushed hall, boards creaking in the wings, a far chime from the flies.
  theatre: {
    bed: { lp: 400, hp: 60, db: -31, lfo: 0.06, depth: 0.5 }, rec: 'hall', recDb: -37.5,
    day: [['woodCreak', 5, 11], ['windChime', 7, 14]],
    night: [['woodCreak', 5, 11], ['windChime', 7, 14]],
  },
  // Inside a house (your hut, the Sweethearts' rooms): hushed, the outdoors shut out (no birdsong,
  // gulls or crickets); a floorboard now and then, a far chime.
  room: {
    bed: { lp: 260, hp: 50, db: -42, lfo: 0.03, depth: 0.2 }, rec: 'quietroom', recDb: -15,
    day: [['woodCreak', 9, 20], ['windChime', 20, 40]],
    night: [['woodCreak', 10, 22]],
  },
  // Moonlit Manor: a hushed old house, floorboards creaking, a far-off chime somewhere upstairs.
  manor: {
    bed: { lp: 320, hp: 50, db: -31, lfo: 0.04, depth: 0.5 }, rec: 'rainwindow', recDb: -36,
    day: [['woodCreak', 4, 10], ['windChime', 8, 16]],
    night: [['woodCreak', 4, 10], ['windChime', 8, 16]],
  },
};
// Which kind of place a map is.
export function placeOf(map) {
  if (!map) return null;
  // (A map can name its own kind of place: a beach, a dock.)
  if (map.amb && PLACES[map.amb]) return map.amb;
  if (map.dungeon === 'manor' || map.theme === 'manor') return 'manor';
  if (map.dungeon === 'aquarium' || map.theme === 'aquarium') return 'aquarium';
  if (map.dungeon === 'carnival' || map.theme === 'carnival') return 'carnival';
  if (map.dungeon === 'observatory' || map.theme === 'observatory') return 'observatory';
  if (map.dungeon === 'volcano' || map.theme === 'candy') return 'volcano';
  if (map.dungeon === 'theatre' || map.theme === 'theatre') return 'theatre';
  if (map.dungeon === 'skywhale' || map.theme === 'skywhale') return 'skywhale';
  if (map.dungeon || map.theme === 'hollow') return 'hollow';
  if (map.indoor) return 'room';
  if (map.isTown) return 'town';
  if (map.theme === 'grove' || map.theme === 'shrine' || map.theme === 'springs' || map.theme === 'tea') return 'forest';
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
  if (PLACES[kind].rec) playRecorded(kind);
}

// The recorded beds, fetched once each and kept.
const recs = new Map();
const base = typeof window !== 'undefined' ? new URL('../../', import.meta.url) : null;
function recording(name) {
  if (!recs.has(name)) {
    recs.set(name, fetch(new URL(`assets/audio/amb/${name}.mp3`, base))
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(`${name}: ${r.status}`))))
      .then(decodeFile)
      .catch(() => null));
  }
  return recs.get(name);
}
// Brings a place's recording in over its built bed, and fades the built bed out under it.
function playRecorded(kind) {
  const mine = bed;
  recording(PLACES[kind].rec).then((buf) => {
    const ac = context();
    const out = busNode('amb');
    if (!buf || !ac || !out || bed !== mine) return;
    const src = ac.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const gain = ac.createGain();
    const t = ac.currentTime;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(Math.pow(10, PLACES[kind].recDb / 20), t + 2.5);
    src.connect(gain);
    gain.connect(out);
    src.start(t, Math.random() * buf.duration);
    mine.gain.gain.cancelScheduledValues(t);
    mine.gain.gain.setValueAtTime(mine.gain.gain.value, t);
    mine.gain.gain.linearRampToValueAtTime(0, t + 2.5);
    mine.rec = { src, gain };
  });
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
  if (bed.rec) {
    bed.rec.gain.gain.cancelScheduledValues(t);
    bed.rec.gain.gain.setValueAtTime(bed.rec.gain.gain.value, t);
    bed.rec.gain.gain.linearRampToValueAtTime(0, t + 1.5);
    bed.rec.src.stop(t + 1.6);
  }
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
