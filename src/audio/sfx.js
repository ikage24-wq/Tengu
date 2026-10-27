// Every sound effect: `sfx(name, opts)` plays one. The sounds themselves are chip recipes
// (recipes.js) rendered once into buffers (bank.js); this file picks the right one for what
// happened and plays it with the right pitch, level, pan and bus.
//
// The rules, from docs/audio/research-sfx.md and research-japanese.md:
// - Each sound has its own level (recipes' `db`), a little random pitch so repeats don't sound
//   like a machine (`vary`), and a cap on how many play at once (`max`); the same sound inside
//   35 ms plays once, a little louder, and no more than 24 sounds ring at a time.
// - Blows in a quick chain climb in pitch (the first at the base, then up a fourth, then a fifth)
//   so the player hears the combo build, and a finisher drops back down with a deep thump.
// - Each warrior path and element adds its own colour over a blow: holy bells, rage crunch, fire
//   crackle, glassy ice, a zap.
// - Jingles never stack: a second one waits for the first to finish. The music dips under them.
// - Coins picked up in a row step up a semitone each, back down after six.
// - NPCs speak in little blips, one per couple of letters, from a three-note set around their own
//   pitch (the same letter always the same note), rising at the end of a question.

import { play, now, audioReady, duck } from './engine.js';
import { sfxBuffer } from './bank.js';
import { RECIPES } from './recipes.js';

const UI = new Set(['click', 'cursor', 'cancel', 'open', 'close', 'denied']);
const JINGLES = new Set(['levelup', 'questDone', 'questAccept', 'jobUp', 'rareDrop', 'itemGet', 'bossDefeated', 'death']);
const voices = [];
const last = new Map();
let jingleEnd = 0;
const combo = { at: -9, step: 0 };
const coins = { at: -9, step: 0 };

// The most recent sounds played, oldest first (for tools and play tests).
export const played = [];

const semis = (n) => Math.pow(2, n / 12);

// Plays one recipe. o: { pan, rate, db, at }.
function voice(name, o = {}) {
  const r = RECIPES[name];
  if (!r) return;
  const t = now();
  // Repeats inside 35 ms are one sound, a touch louder.
  if (t - (last.get(name) ?? -9) < 0.035) return;
  last.set(name, t);
  for (let i = voices.length - 1; i >= 0; i--) if (voices[i].end < t) voices.splice(i, 1);
  const mine = voices.filter((v) => v.name === name);
  if (mine.length >= (r.max ?? 4)) {
    // At its limit: the oldest of them gives way.
    mine[0].v?.gain.gain.setTargetAtTime(0, t, 0.01);
    voices.splice(voices.indexOf(mine[0]), 1);
  }
  if (voices.length >= 24 && !JINGLES.has(name)) return;
  const buf = sfxBuffer(name);
  if (!buf) return;
  const vary = r.vary ? 1 + ((Math.random() * 2 - 1) * r.vary) / 100 : 1;
  const rate = (o.rate ?? 1) * vary;
  let at = o.at ?? 0;
  if (JINGLES.has(name)) {
    at = Math.max(t, jingleEnd);
    jingleEnd = at + buf.duration * 0.9;
  }
  const v = play(buf, { bus: UI.has(name) ? 'ui' : o.bus ?? 'sfx', db: (r.db ?? -14) + (o.db ?? 0), rate, pan: UI.has(name) ? 0 : o.pan, room: r.room ? 0.35 : 0, at });
  voices.push({ name, v, end: (at || t) + buf.duration / rate });
  if (r.duck) {
    if (at > t + 0.01) setTimeout(() => duck(r.duck[0], r.duck[1]), (at - t) * 1000);
    else duck(r.duck[0], r.duck[1]);
  }
  played.push(name);
  if (played.length > 300) played.shift();
}

const STEPS = { grass: 'stepGrass', stone: 'stepStone', wood: 'stepWood', sand: 'stepSand', cloud: 'stepCloud', crystal: 'stepCrystal' };
// Each school's pitch for casting, as a playback rate (holy and ice bright, rage and earth low).
const SCHOOL_RATE = { holy: 1.5, ice: 1.68, lightning: 1.12, fire: 0.84, poison: 0.94, arcane: 1, wind: 1.33, steel: 1.26, rage: 0.75, shadow: 0.84, nature: 1.12, sakura: 1.5, gold: 1.33, earth: 0.75, dragon: 0.79 };
const ELEMENT = { holy: 'holyHit', rage: 'rageHit', fire: 'fireHit', demonic: 'fireHit', ice: 'iceHit', lightning: 'zapHit', laser: 'zapHit', cyber: 'zapHit' };

const SOUNDS = {
  swing({ weight = 1, school, pan }) {
    if (weight > 1.2 || school === 'rage') voice('swingHeavy', { pan, rate: school === 'rage' ? 0.85 : 1 });
    else voice('swing', { pan, rate: school === 'holy' ? 1.12 : 1 });
  },
  // A blow landing: the click and body (higher with each step of a quick chain), the finisher's
  // thump, a crit's ping, and the path's or element's colour.
  hit({ big, crit, school, element, many = 1, pan }) {
    const t = now();
    combo.step = t - combo.at < 0.7 ? combo.step + 1 : 0;
    combo.at = t;
    const db = Math.min(3, (many - 1) * 1);
    if (big) {
      voice('hitHeavy', { pan, db });
      voice('hit', { pan, rate: 2, db: db - 6 });
      combo.step = -1;
    } else {
      const climb = [0, 5, 7][Math.min(2, Math.max(0, combo.step) % 3)];
      voice(many > 2 ? 'hitMedium' : 'hit', { pan, db, rate: semis(climb) });
    }
    if (crit) voice('crit', { pan });
    const colour = ELEMENT[school] ?? ELEMENT[element];
    if (colour) voice(colour, { pan });
  },
  thrust: ({ pan }) => voice('thrust', { pan }),
  miss: ({ pan }) => voice('miss', { pan }),
  hurt: ({ pan }) => voice('hurt', { pan }),
  poof({ boss, stage, pan }) {
    voice('poof', { pan });
    voice('enemyHurt', { pan, db: -4 });
    if (boss) {
      voice('boom', { pan });
      if (!stage) voice('bossDefeated');
    }
  },
  boom: ({ size = 1, pan }) => voice('boom', { pan, rate: size > 1.5 ? 0.8 : 1 }),
  stomp: ({ big, pan }) => voice(big ? 'landHard' : 'stomp', { pan }),
  dot: ({ pan }) => voice('dot', { pan }),
  // Projectiles leaving the hand or the bow.
  shot({ kind, pan }) {
    const name = { arrow: 'arrow', bigarrow: 'arrowHeavy', star: 'star', bigstar: 'star', fire: 'fire', venomfire: 'fire', bomb: 'fire', icebeam: 'ice', holy: 'holyChime', feather: 'swing' }[kind] ?? 'zap';
    voice(name, { pan, rate: kind === 'bigstar' ? 0.85 : kind === 'feather' ? 1.3 : 1 });
  },
  cast({ school = 'arcane', big, pan }) {
    voice('cast', { pan, rate: SCHOOL_RATE[school] ?? 1, db: big ? 2 : 0 });
    if (school === 'holy') voice('holyChime', { pan, db: -6 });
    if (school === 'fire') voice('fire', { pan, db: -6 });
  },
  powerup: ({ school, big, pan }) => voice('buff', { pan, rate: (SCHOOL_RATE[school] ?? 1) * (big ? 0.9 : 1) }),
  buff: ({ party, pan }) => voice(party ? 'partyBuff' : 'buff', { pan }),
  heal: ({ pan }) => voice('healJingle', { pan }),
  gather({ dur = 0.42, school, pan }) {
    voice(school === 'holy' ? 'gatherHoly' : 'gather', { pan, rate: Math.max(0.6, Math.min(1.5, 0.42 / dur)) });
  },
  // Spells and skill effects landing, by kind.
  spell({ kind, pan }) {
    if (['thunder', 'chain', 'chainbolt'].includes(kind)) voice('lightning', { pan });
    else if (['icespire', 'tempest', 'freeze'].includes(kind)) {
      voice('ice', { pan });
      voice('stomp', { pan, db: -4 });
    } else if (['meteor', 'fire', 'toxicblaze'].includes(kind)) {
      voice('boom', { pan, rate: kind === 'meteor' ? 0.8 : 1.1 });
      voice('fire', { pan, db: -4 });
    } else if (['mist', 'poisonmist'].includes(kind)) voice('poison', { pan });
    else if (['judgment', 'shiningray', 'holy'].includes(kind)) {
      voice('holyChime', { pan });
      voice('stomp', { pan, db: -3 });
    } else voice('hitMedium', { pan });
  },
  tier: ({ n = 1 }) => voice('tier', { rate: semis(Math.min(4, n - 1) * 2) }),
  step: ({ ground = 'grass', pan }) => voice(STEPS[ground] ?? 'stepGrass', { pan }),
  land: ({ hard, pan }) => voice(hard ? 'landHard' : 'land', { pan }),
  drop: ({ pan }) => voice('rareDrop', { pan }),
  coin() {
    const t = now();
    coins.step = t - coins.at < 0.3 ? (coins.step + 1) % 6 : 0;
    coins.at = t;
    voice('coin', { rate: semis(coins.step) });
  },
  // An NPC's voice. o: { base (MIDI note), kind ('tri' | 'pulse' | 'rasp'), ch (the letter),
  // rise (semitones, for a question's last words), loud (an exclamation) }.
  blip({ base = 72, kind = 'tri', ch = 'a', rise = 0, loud = false }) {
    const code = ch.toLowerCase().charCodeAt(0) || 97;
    const set = [0, 2, 4];
    const n = base - 72 + set[code % 3] + rise + (loud ? 2 : 0) + (Math.random() - 0.5) * 0.3;
    voice({ tri: 'blipTri', pulse: 'blipPulse', rasp: 'blipRasp' }[kind] ?? 'blipTri', { bus: 'voice', rate: semis(n), db: loud ? 3 : 0 });
  },
};

export function sfx(name, o = {}) {
  if (!audioReady()) return;
  if (SOUNDS[name]) SOUNDS[name](o);
  else voice(name, o);
}

export const SOUND_NAMES = Object.keys(RECIPES);
