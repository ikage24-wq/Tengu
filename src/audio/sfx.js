// Every sound effect: `sfx(name, opts)` plays one. The sounds themselves are recipes
// (recipes.js) rendered once into buffers (bank.js); this file picks the right one for what
// happened and plays it with the right pitch, level, pan and bus.
//
// The rules, from docs/audio/research-sfx.md and research-japanese.md:
// - Each sound has its own level (recipes' `db`), a little random pitch so repeats don't sound
//   like a machine (`vary`), and a cap on how many play at once (`max`); the same sound inside
//   35 ms plays once, a little louder, and no more than 24 sounds ring at a time.
// - Blows in a quick chain climb in pitch (the first at the base, then up a fourth, then a fifth)
//   so the player hears the combo build, and a finisher drops back down with a deep thump.
// - Swords, daggers, bows, arrows and spells are recorded (combat packs, see assets/audio/CREDITS.md):
//   each school casts and lands with its own sound (fire, ice, lightning, holy, poison, dark, wind,
//   earth), and each path and weapon element adds its colour over a blow.
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
  // Repeats inside a recipe's gap (35 ms unless it says) are one sound: a volley of spell hits,
  // a fan of arrows, or quick dialog letters don't machine-gun.
  if (t - (last.get(name) ?? -9) < (r.gap ?? 35) / 1000) return;
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
  log.push({ name, at: at || t, len: buf.duration / rate });
  if (log.length > 600) log.shift();
}

// Every sound played, with when it starts and how long it rings (for tools and play tests).
export const log = [];

const STEPS = { grass: 'stepGrass', stone: 'stepStone', wood: 'stepWood', sand: 'stepSand', cloud: 'stepCloud', crystal: 'stepCrystal' };
// What each element or school adds to a blow (weapon themes, star elements, spell schools).
const COLOUR = {
  holy: 'holyHit', rage: 'rageHit', fire: 'fireHit', demonic: 'fireHit', ice: 'iceHit', lightning: 'zapHit', storm: 'zapHit', laser: 'zapHit', cyber: 'zapHit',
  poison: 'poisonHit', spirit: 'spiritHit', shadow: 'darkHit', bone: 'darkHit', chainsaw: 'rageHit', wind: 'windHit', water: 'waterHit', cosmic: 'arcaneHit', arcane: 'arcaneHit', steel: 'steelHit',
};
// A spell's cast, by school: each element's own recorded charge-up.
const CAST = { spirit: 'castSpirit', fire: 'castFire', ice: 'castIce', lightning: 'castZap', holy: 'castHoly', poison: 'castPoison', shadow: 'castDark', rage: 'castDark', wind: 'castWind', steel: 'castSteel' };
// Projectiles leaving the hand or the bow, by kind.
const SHOTS = { spiritorb: 'suzu', spiritbig: 'suzuBig', moonstar: 'star', foxstar: 'star', foxmoon: 'star', kunai: 'arrow', hawkarrow: 'arrow', hawkbig: 'arrowHeavy', falcon: 'arrowHeavy', featherwake: 'gust', wisp: 'gust', windarrow: 'arrow', galearrow: 'arrowHeavy', cyclone: 'cycloneShot', heavybolt: 'crossbow', blastbolt: 'crossbowHeavy', frostbolt: 'crossbowHeavy', ballista: 'boltKick', heartbolt: 'heartshock', arrow: 'arrow', rapid: 'arrow', draw: 'arrowHeavy', bigarrow: 'arrowHeavy', star: 'star', bigstar: 'star', fire: 'fire', bomb: 'fire', holy: 'holyChime', feather: 'gust', pebble: 'star', bolt: 'zap', stormbolt: 'crossbow', thunderbolt: 'crossbowHeavy', megabolt: 'crossbowHeavy' };
// Spells and skill effects landing, by kind.
const SPELLS = {
  burst: 'zapHit', beam: 'zapHit',
  freeze: 'iceBurst',
  meteor: 'meteor', fire: 'fireBurst', dragon: 'fireBurst',
  smoke: 'gust',
  judgment: 'holyBurst', holy: 'holyBurst',
  quake: 'quake', hammer: 'quake', stampede: 'quake',
  vortex: 'gust', rain: 'arrowHeavy', xslash: 'bladestorm', bladestorm: 'bladestorm',
  feathers: 'gust', titanwave: 'quake', moonslash: 'bladestorm', smokepuff: 'gust', healbloom: 'holyBurst',
  zapstrike: 'lightning', chainarc: 'zap', staticfield: 'zap', supercharged: 'castZap',
  skybolt: 'zap', stormsky: 'castZap', gigabolt: 'meteor',
  galeblast: 'stormburst', thunderblast: 'lightning',
};
const ARROWS = new Set(['hawkarrow', 'hawkbig', 'arrow', 'rapid', 'draw', 'bigarrow', 'rain', 'windarrow', 'galearrow', 'cyclone', 'heavybolt', 'blastbolt', 'frostbolt', 'stormbolt', 'thunderbolt', 'megabolt']);
// Crossbow shots that kick harder than a plain bolt (the archer paths' own have their own sound).
const HEAVY_BOLTS = new Set(['bigarrow', 'blastbolt', 'frostbolt', 'thunderbolt', 'megabolt']);
// Heavy bolts that land with a thud of their own.
const HEAVY_HITS = new Set(['ballista', 'heartbolt', 'galearrow', 'blastbolt']);
// Each melee weapon's swing [light, heavy], and the cut its blows land with.
const SWINGS = { sword: ['swing', 'swingHeavy'], axe: ['axeSwing', 'axeSwingHeavy'], spear: ['spearSwing', 'spearSwingHeavy'], dagger: ['daggerSwing', 'swing'], none: ['fistSwing', 'fistSwing'] };
const BLADE_HITS = { axe: 'hitAxe', spear: 'hitSpear', dagger: 'hitDagger', none: 'hitFist' };

const SOUNDS = {
  // A swing: a recorded sword (a heavier blade for big or rage swings), a little brighter for holy.
  // `lead`: seconds until the blow lands; the whoosh is started early so its peak lands with it.
  // Each weapon swings with its own recordings (every take peaks about 0.06 s in).
  swing({ weight = 1, school, weapon = 'sword', lead = 0, pan }) {
    const heavy = weight > 1.2 || school === 'rage';
    const set = SWINGS[weapon] ?? SWINGS.sword;
    voice(heavy ? set[1] : set[0], { pan, at: now() + Math.max(0, lead - 0.06), rate: school === 'rage' ? 0.94 : school === 'holy' ? 1.04 : 1 });
  },
  // A blow landing. Blades: a punch and a cut whose body climbs with each step of a quick chain,
  // a finisher's thump and clang, a crit's ring. Arrows and stars thud in; spells land with their
  // school's own impact. Then the path's (Rage, Faith) or the weapon's element colour.
  hit({ big, crit, path, school, via = 'blade', weapon, element, many = 1, pan }) {
    const db = Math.min(3, (many - 1) * 1);
    if (ARROWS.has(via) || HEAVY_HITS.has(via)) voice(big || HEAVY_HITS.has(via) ? 'arrowHitHeavy' : 'arrowHit', { pan, db });
    else if (via === 'star' || via === 'moonstar' || via === 'nightstar' || via === 'giantstar' || via === 'pebble') voice('starHit', { pan, db });
    else if (via !== 'blade' && via !== 'chain' && school && COLOUR[school]) voice(COLOUR[school], { pan, db: db + 2 });
    else {
      const t = now();
      combo.step = t - combo.at < 0.7 ? combo.step + 1 : 0;
      combo.at = t;
      // The recordings keep their own pitch; a soft tone under them climbs through the chain.
      if (big) {
        voice('hitHeavy', { pan, db });
        voice('hitTone', { pan, rate: 2, db: db - 4 });
        combo.step = -1;
      } else {
        const climb = [0, 5, 7][Math.min(2, Math.max(0, combo.step) % 3)];
        voice(BLADE_HITS[weapon] ?? (many > 2 ? 'hitMedium' : 'hit'), { pan, db });
        voice('hitTone', { pan, db, rate: semis(climb) });
      }
      if (school === 'steel') voice('steelHit', { pan, db: -4 });
    }
    if (crit) voice('crit', { pan });
    const colour = COLOUR[path] ?? COLOUR[element];
    if (colour) voice(colour, { pan, db: -2 });
  },
  thrust: ({ weapon, lead = 0, pan }) => voice(weapon === 'spear' ? 'spearThrust' : 'thrust', { pan, at: now() + Math.max(0, lead - 0.06) }),
  miss: ({ pan }) => voice('miss', { pan }),
  hurt: ({ pan }) => voice('hurt', { pan }),
  // A monster pops: a soft squish and a little cry; a boss booms.
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
  shot({ kind, weapon, pan }) {
    if (weapon === 'crossbow' && ARROWS.has(kind) && kind !== 'heavybolt') return voice(HEAVY_BOLTS.has(kind) ? 'crossbowHeavy' : 'crossbow', { pan });
    voice(SHOTS[kind] ?? 'zap', { pan, rate: kind === 'bigstar' ? 0.85 : 1 });
  },
  cast({ school = 'arcane', big, pan }) {
    voice(CAST[school] ?? 'cast', { pan, db: big ? 2 : 0 });
  },
  powerup: ({ big, pan }) => voice('powerup', { pan, rate: big ? 0.9 : 1 }),
  buff: ({ party, pan }) => voice(party ? 'partyBuff' : 'buff', { pan }),
  heal: ({ pan }) => voice('heal', { pan }),
  gather({ dur = 0.42, school, pan }) {
    voice(school === 'holy' ? 'gatherHoly' : 'gather', { pan, rate: Math.max(0.7, Math.min(1.4, 0.6 / dur)) });
  },
  spell: ({ kind, pan }) => voice(SPELLS[kind] ?? 'hitMedium', { pan }),
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

