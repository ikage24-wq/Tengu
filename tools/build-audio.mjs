// Builds the game's recorded sound effects into one small file (needs node and ffmpeg):
//   assets/audio/sfx.mp3                every recorded effect, one after another
//   src/audio/manifest.js               where each effect sits in that strip
// Every source is public domain (CC0), so nothing needs crediting (see assets/audio/SOURCES.md):
//   Kenney's RPG Audio, Impact Sounds and Interface Sounds packs; artisticdude's RPG Sound Pack
//   and Swishes, Ogrebane's Battle Sound Effects and rubberduck's 80 CC0 RPG SFX (OpenGameArt);
//   Still North Media's Medieval Weapon Textures and qubodup's 3 Melee Sounds.
// The music has no recordings: its instruments are synth voices (src/audio/studio.js VOICES).
//
// Needs node, ffmpeg, curl, unzip and 7z (for the .7z packs).
//
// The strip starts with a short click at MARK seconds (then silence until LEAD), so the game can
// line the slots up exactly however the browser's decoder pads the start of the file.
//
// Run: node tools/build-audio.mjs   (downloads into tools/.audio-cache, which git ignores)

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const CACHE = path.join(ROOT, 'tools/.audio-cache');
const SR = 44100;
const MARK = 0.05;
const LEAD = 0.2;
fs.mkdirSync(CACHE, { recursive: true });

// Effects: name -> files in the Kenney packs.
const K = { rpg: 'rpg-audio', imp: 'impact-sounds', ui: 'interface-sounds' };
const n3 = (base, count = 3) => Array.from({ length: count }, (_, i) => `${base}_${String(i).padStart(3, '0')}.ogg`);
const EFFECTS = {
  slice: ['rpg/knifeSlice.ogg', 'rpg/knifeSlice2.ogg'],
  draw: ['rpg/drawKnife1.ogg', 'rpg/drawKnife2.ogg', 'rpg/drawKnife3.ogg'],
  chop: ['rpg/chop.ogg'],
  punch: n3('imp/impactPunch_medium', 5),
  punchHeavy: n3('imp/impactPunch_heavy', 3),
  plate: n3('imp/impactPlate_heavy', 3),
  plateLight: n3('imp/impactPlate_light', 3),
  metal: n3('imp/impactMetal_light', 3),
  metalHeavy: n3('imp/impactMetal_heavy', 2),
  glass: n3('imp/impactGlass_light', 3),
  glassHeavy: n3('imp/impactGlass_heavy', 2),
  bell: n3('imp/impactBell_heavy', 2),
  wood: n3('imp/impactWood_medium', 3),
  woodHeavy: n3('imp/impactWood_heavy', 2),
  soft: n3('imp/impactSoft_medium', 3),
  softHeavy: n3('imp/impactSoft_heavy', 2),
  mining: n3('imp/impactMining', 3),
  plank: n3('imp/impactPlank_medium', 2),
  stepGrass: n3('imp/footstep_grass', 5),
  stepStone: n3('imp/footstep_concrete', 5),
  stepWood: n3('imp/footstep_wood', 5),
  stepSnow: n3('imp/footstep_snow', 5),
  stepCarpet: n3('imp/footstep_carpet', 5),
  coins: ['rpg/handleCoins.ogg', 'rpg/handleCoins2.ogg'],
  leather: ['rpg/handleSmallLeather.ogg', 'rpg/handleSmallLeather2.ogg'],
  cloth: ['rpg/cloth1.ogg', 'rpg/cloth2.ogg', 'rpg/cloth3.ogg', 'rpg/cloth4.ogg'],
  bookOpen: ['rpg/bookOpen.ogg'],
  bookClose: ['rpg/bookClose.ogg'],
  bookFlip: ['rpg/bookFlip1.ogg', 'rpg/bookFlip2.ogg', 'rpg/bookFlip3.ogg'],
  metalClick: ['rpg/metalClick.ogg'],
  click: ['ui/click_001.ogg', 'ui/click_002.ogg', 'ui/click_003.ogg'],
  select: ['ui/select_001.ogg', 'ui/select_002.ogg'],
  confirm: ['ui/confirmation_001.ogg', 'ui/confirmation_002.ogg'],
  back: ['ui/back_001.ogg', 'ui/back_002.ogg'],
  error: ['ui/error_004.ogg'],
  open: ['ui/maximize_002.ogg'],
  close: ['ui/minimize_002.ogg'],
  drop: ['ui/drop_002.ogg'],
  tick: ['ui/tick_002.ogg'],
  pluck: ['ui/pluck_001.ogg', 'ui/pluck_002.ogg'],
  sparkle: ['ui/glass_001.ogg', 'ui/glass_002.ogg', 'ui/glass_003.ogg'],
  question: ['ui/question_001.ogg'],
  // ---------- Combat packs: 'pack:file' (the file's name, or its end), with @skip and ~length in seconds ----------
  swish: ['swish:swish-1', 'swish:swish-4', 'swish:swish-8', 'battle:swish_2', 'battle:swish_4'],
  cut: ['oga80:blade_01', 'oga80:blade_02', 'oga80:blade_03'],
  unsheathe: ['rpgpack:sword-unsheathe', 'rpgpack:sword-unsheathe2', 'rpgpack:sword-unsheathe3'],
  bowShoot: ['battle:Bow'],
  fireLaunch: ['oga80:spell_fire_01', 'oga80:spell_fire_02~0.6'],
  creatureHurt: ['oga80:creature_hurt_01', 'oga80:creature_hurt_02', 'oga80:creature_misc_03'],
  creatureDie: ['oga80:creature_die_01'],
  slime: ['rpgpack:slime1', 'rpgpack:slime2', 'rpgpack:slime4', 'rpgpack:slime5', 'rpgpack:slime10'],
  ogre: ['rpgpack:ogre1', 'rpgpack:ogre3', 'rpgpack:ogre4'],
  coins2: ['oga80:item_coins_01', 'oga80:item_coins_02', 'oga80:item_coins_03'],
  // ---------- Each weapon's own swing (Medieval Weapon Textures: one file of several takes each) ----------
  // Every take is cut so its loudest moment comes about 0.06 s in, so the game can time it to the blow.
  swingSword: ['med:Katana Swing#7', 'med:Katana Swing#5'],
  swingSwordHeavy: ['med:Sabre Swing#48', 'med:Sabre Swing#50'],
  swingAxe: ['med:Axe Swing#2', 'med:Axe Swing#6', 'med:Axe Swing#7', 'med:Axe Swing#3'],
  swingSpear: ['med:Spear Swing#0@0.21~0.4', 'med:Spear Swing#1@0.19~0.4'],
  swingDagger: ['med:Dagger Swing#2', 'med:Dagger Swing#5', 'med:Seax Swing#3', 'med:Seax Swing#9'],
  swingFist: ['melee3:melee sound@0.04', 'swish:swish-4', 'swish:swish-8'],
  bowLongbow: ['med:English Longbow Shoot#3', 'med:English Longbow Shoot#0', 'med:Scythian Recurve Shoot#6', 'med:Scythian Recurve Shoot#0'],
  crossbowShoot: ['med:Crossbow Shoot#0', 'med:Crossbow Shoot#2', 'med:Crossbow Shoot#3'],
  boltPass: ['med:Crossbow Bolt Pass#0~0.4'],
  heavyArrowPass: ['med:Scythian Recurve Heavy Arrow Pass#3@0.12', 'med:Scythian Recurve Heavy Arrow Pass#4@0.15'],
  bladeDraw: ['med:Katana Draw Fast#0', 'med:Katana Draw Fast#2'],
};

// Effects that once had takes from packs needing credit, now played with a CC0 effect that's close.
const ALIASES = {
  bladeSwing: 'swingSword', bladeSwingHeavy: 'swingSwordHeavy', stab: 'swingDagger', clang: 'metal', clangHeavy: 'metalHeavy', clangLight: 'plateLight',
  bowDraw: 'leather', arrowHit: 'wood', fireImpact: 'fireLaunch', fireCharge: 'fireLaunch', iceLaunch: 'glass', iceImpact: 'glassHeavy', iceBig: 'glassHeavy',
  iceCharge: 'sparkle', zapLaunch: 'sparkle', zapImpact: 'glass', zapCharge: 'sparkle', thunder: 'softHeavy', holyBlast: 'bell', holyWave: 'bell',
  holyProtect: 'bell', holyHeal: 'sparkle', shield: 'plate', teleIn: 'sparkle', teleOut: 'sparkle', poisonCast: 'slime', acidHit: 'slime', darkFire: 'fireLaunch',
  darkImpact: 'softHeavy', darkWave: 'swish', darkRiser: 'swish', windShot: 'swish', windWhoosh: 'swish', rockHit: 'mining', rockThrow: 'stepStone', meteor: 'mining', splash: 'slime',
};

// The combat packs: where to get each, and how it's packed.
const OGA = 'https://opengameart.org/sites/default/files/';
const PACKS = {
  oga80: { url: `${OGA}80-CC0-RPG-SFX_0.zip`, file: 'oga80.zip' },
  rpgpack: { url: `${OGA}rpg_sound_pack.zip`, file: 'rpgpack.zip' },
  swish: { url: `${OGA}swishes.zip`, file: 'swish.zip' },
  battle: { url: `${OGA}battle_sound_effects_0.zip`, file: 'battle.zip' },
  med: { urls: [`${OGA}medieval_sfx_textures_1_of_2.7z`, `${OGA}medieval_sfx_textures_2_of_2.7z`], file: 'med' },
  melee3: { url: `${OGA}melee%20sounds.zip`, file: 'melee3.zip' },
};

const run = (args) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args]);
const get = (url, file) => {
  if (!fs.existsSync(file)) execFileSync('curl', ['-sSfL', '--max-time', '120', '-o', file, url]);
  return file;
};
function decode(file, seconds = 60) {
  const raw = execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', file, '-t', String(seconds), '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], { maxBuffer: 1 << 30 });
  return new Float32Array(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.length));
}
function encode(samples, file) {
  const tmp = path.join(CACHE, 'tmp.f32');
  fs.writeFileSync(tmp, Buffer.from(samples.buffer));
  run(['-f', 'f32le', '-ar', String(SR), '-ac', '1', '-i', tmp, '-c:a', 'libmp3lame', '-b:a', '80k', file]);
}
// A strip starts with the alignment click, then silence until LEAD.
function strip(seconds) {
  const out = new Float32Array(Math.ceil(seconds * SR));
  for (let i = 0; i < 0.004 * SR; i++) out[Math.round(MARK * SR) + i] = i % 20 < 10 ? 0.9 : -0.9;
  return out;
}

const manifest = { mark: MARK, lead: LEAD, inst: {}, sfx: { file: 'assets/audio/sfx.mp3', items: {} } };

// ---------- Combat packs ----------
const packDir = (name) => path.join(CACHE, 'packs', name);
function fetchPack(name) {
  const dir = packDir(name);
  if (fs.existsSync(dir)) return;
  const p = PACKS[name];
  fs.mkdirSync(dir, { recursive: true });
  if (p.urls) {
    p.urls.forEach((u, i) => execFileSync('7z', ['x', '-y', `-o${dir}`, get(u, path.join(CACHE, `${p.file}${i + 1}.7z`))], { stdio: 'ignore' }));
    return;
  }
  if (p.url) {
    const file = get(p.url, path.join(CACHE, p.file));
    if (file.endsWith('.7z')) execFileSync('7z', ['x', '-y', `-o${dir}`, file], { stdio: 'ignore' });
    else execFileSync('unzip', ['-q', '-o', file, '-d', dir]);
    return;
  }
  throw new Error(`no way to fetch ${name}`);
}
// Every sound file in a pack, by name (the 48 kHz copies where a pack has several).
const index = {};
function findIn(pack, key) {
  if (!index[pack]) {
    fetchPack(pack);
    const files = [];
    const walk = (d) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const f = path.join(d, e.name);
        if (e.isDirectory()) {
          if (!/__MACOSX|peaks|96000/.test(e.name)) walk(f);
        } else if (/\.(wav|ogg|mp3)$/i.test(e.name)) files.push(f);
      }
    };
    walk(packDir(pack));
    index[pack] = files.sort((a, b) => /48000/.test(b) - /48000/.test(a) || /\.ogg$/.test(b) - /\.ogg$/.test(a));
  }
  const name = (f) => path.basename(f).replace(/\.[^.]+$/, '');
  const hit = index[pack].find((f) => name(f) === key) ?? index[pack].find((f) => name(f).endsWith(`_${key}`) || name(f).endsWith(key));
  if (!hit) throw new Error(`${pack} has no ${key}`);
  return hit;
}
// 'pack:name#take@skip~length' -> { file, take, skip, max }. `#take` picks one take from a file
// that holds several (recorded one after another with silence between).
function source(spec) {
  if (!spec.includes(':')) {
    const [pack, file] = spec.split('/');
    return { file: path.join(CACHE, K[pack], 'Audio', file), skip: 0, max: 2.5 };
  }
  const m = /^(\w+):([^@~#]+)(?:#(\d+))?(?:@([\d.]+))?(?:~([\d.]+))?$/.exec(spec);
  return { file: findIn(m[1], m[2]), take: m[3] == null ? null : Number(m[3]), skip: Number(m[4] ?? 0), max: Number(m[5] ?? 2.5) };
}

// The takes in a recording: stretches louder than 4% of its peak (10 ms steps), split where it
// stays quiet for 0.12 s. Returns [start, end] sample pairs.
function takes(x) {
  const w = Math.round(0.01 * SR);
  const env = [];
  for (let i = 0; i + w <= x.length; i += w) {
    let e = 0;
    for (let k = 0; k < w; k++) e += x[i + k] * x[i + k];
    env.push(Math.sqrt(e / w));
  }
  const thr = Math.max(...env) * 0.04;
  const out = [];
  for (let i = 0; i < env.length; ) {
    if (env[i] <= thr) {
      i++;
      continue;
    }
    let j = i;
    while (j < env.length && env.slice(j, j + 12).some((v) => v > thr)) j++;
    out.push([Math.max(0, i - 1) * w, Math.min(x.length, (j + 5) * w)]);
    i = j;
  }
  return out;
}

// ---------- Effects ----------
for (const pack of Object.values(K)) {
  const zipDir = path.join(CACHE, pack);
  if (!fs.existsSync(zipDir)) {
    const page = execFileSync('curl', ['-sSfL', `https://kenney.nl/assets/${pack}`]).toString();
    const url = /https:\/\/[^"\s]+\.zip/.exec(page)[0];
    const zip = get(url, path.join(CACHE, `${pack}.zip`));
    execFileSync('unzip', ['-q', '-o', zip, '-d', zipDir]);
  }
}
const pieces = [];
let t = LEAD;
for (const [name, files] of Object.entries(EFFECTS)) {
  manifest.sfx.items[name] = [];
  for (const f of files) {
    const src = source(f);
    let x = decode(src.file, src.take == null ? src.skip + src.max + 3 : 120);
    if (src.take != null) {
      const [a, b] = takes(x)[src.take];
      x = x.slice(a, b);
    }
    let s = Math.round(src.skip * SR);
    while (s < x.length && Math.abs(x[s]) < 0.002) s++;
    let e = x.length;
    while (e > s && Math.abs(x[e - 1]) < 0.001) e--;
    // Longer than its limit: cut there, with a gentle fade.
    const end = Math.min(e, s + Math.round(src.max * SR));
    const clip = x.slice(s, end);
    // A short fade in, so a take cut partway in starts cleanly.
    for (let i = 0; i < Math.min(clip.length, 0.004 * SR); i++) clip[i] *= i / (0.004 * SR);
    if (end < e) {
      const fade = Math.min(clip.length, Math.round(0.15 * SR));
      for (let i = 0; i < fade; i++) clip[clip.length - 1 - i] *= i / fade;
    }
    // Every clip at the same peak, so recipes set the balance.
    let peak = 0;
    for (const v of clip) peak = Math.max(peak, Math.abs(v));
    if (peak > 0) for (let i = 0; i < clip.length; i++) clip[i] *= 0.8 / peak;
    pieces.push([t, clip]);
    manifest.sfx.items[name].push([+t.toFixed(4), +(clip.length / SR).toFixed(4)]);
    t += clip.length / SR + 0.08;
  }
}
const sfx = strip(t + 0.2);
for (const [at, clip] of pieces) sfx.set(clip, Math.round(at * SR));
encode(sfx, path.join(ROOT, manifest.sfx.file));
for (const [name, to] of Object.entries(ALIASES)) manifest.sfx.items[name] = manifest.sfx.items[to];
console.log('effects', Object.keys(EFFECTS).length, 'sets,', t.toFixed(1), 's');

fs.writeFileSync(
  path.join(ROOT, 'src/audio/manifest.js'),
  `// Made by tools/build-audio.mjs: where each recorded effect sits in the audio strip. Every\n// recording is public domain (CC0): Kenney, OpenGameArt and Still North Media. See assets/audio/SOURCES.md.\nexport const MANIFEST = ${JSON.stringify(manifest)};\n`,
);
