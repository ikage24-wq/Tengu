// Builds the game's recorded sounds into a few small files (needs node and ffmpeg):
//   assets/audio/inst/<instrument>.mp3  one strip per instrument: a note every three semitones,
//                                       each in a fixed-length slot
//   assets/audio/sfx.mp3                every recorded effect, one after another
//   src/audio/manifest.js               where each note and effect sits in those strips
// Sources (see assets/audio/CREDITS.md):
//   instruments: the FluidR3 GM soundfont by Frank Wen, CC BY 3.0, as packaged by
//                gleitz/midi-js-soundfonts
//   effects:     Kenney's RPG Audio, Impact Sounds and Interface Sounds packs, CC0
//
// Every strip starts with a short click at MARK seconds (then silence until LEAD), so the game can
// line the slots up exactly however the browser's decoder pads the start of the file.
//
// Run: node tools/build-audio.mjs   (downloads into tools/.audio-cache, which git ignores)

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const CACHE = path.join(ROOT, 'tools/.audio-cache');
const OUT = path.join(ROOT, 'assets/audio');
const SR = 44100;
const MARK = 0.05;
const LEAD = 0.2;
fs.mkdirSync(path.join(CACHE, 'sf'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'inst'), { recursive: true });

// Instruments: [name, lowest MIDI note, highest, slot seconds, sustained (loops when held)].
const INSTRUMENTS = [
  ['flute', 60, 96, 2.0, true],
  ['pan_flute', 60, 93, 2.0, true],
  ['oboe', 57, 90, 2.0, true],
  ['violin', 55, 96, 2.0, true],
  ['string_ensemble_1', 36, 96, 2.0, true],
  ['choir_aahs', 48, 81, 2.0, true],
  ['accordion', 48, 84, 2.0, true],
  ['french_horn', 39, 78, 2.0, true],
  ['trumpet', 54, 87, 1.6, true],
  ['brass_section', 39, 84, 1.6, true],
  ['acoustic_guitar_nylon', 39, 84, 2.4, false],
  ['pizzicato_strings', 27, 72, 1.4, false],
  ['orchestral_harp', 36, 96, 2.4, false],
  ['acoustic_grand_piano', 36, 96, 2.4, false],
  ['marimba', 48, 96, 1.4, false],
  ['glockenspiel', 72, 105, 2.0, false],
  ['celesta', 60, 99, 2.0, false],
  ['sitar', 48, 81, 2.0, false],
  ['timpani', 36, 60, 2.0, false],
  ['electric_bass_finger', 27, 63, 1.6, false],
  ['woodblock', 72, 81, 0.5, false],
];
const FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const noteName = (m) => `${FLAT[m % 12]}${Math.floor(m / 12) - 1}`;

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
};

const run = (args) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args]);
const get = (url, file) => {
  if (!fs.existsSync(file)) execFileSync('curl', ['-sSfL', '--max-time', '120', '-o', file, url]);
  return file;
};
function decode(file) {
  const raw = execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', file, '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-']);
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

// ---------- Instruments ----------
const manifest = { mark: MARK, lead: LEAD, inst: {}, sfx: { file: 'assets/audio/sfx.mp3', items: {} } };
for (const [name, lo, hi, slot, sustain] of INSTRUMENTS) {
  const js = get(`https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/${name}-mp3.js`, path.join(CACHE, 'sf', `${name}.js`));
  const src = fs.readFileSync(js, 'utf8');
  const notes = [];
  for (let m = lo; m <= hi; m += 3) notes.push(m);
  let energy = 0;
  let count = 0;
  const out = strip(LEAD + notes.length * slot);
  notes.forEach((m, k) => {
    const hit = new RegExp(`"${noteName(m)}":\\s*"data:audio/mp3;base64,([^"]+)"`).exec(src);
    if (!hit) throw new Error(`${name} has no ${noteName(m)}`);
    const mp3 = path.join(CACHE, 'note.mp3');
    fs.writeFileSync(mp3, Buffer.from(hit[1], 'base64'));
    const x = decode(mp3);
    // Skip the decoder's padding (start at the attack), then fit the slot with a fade at its end.
    let s = 0;
    while (s < x.length && Math.abs(x[s]) < 0.002) s++;
    const n = Math.round(slot * SR) - 1;
    const fade = Math.round(0.12 * SR);
    const at = Math.round((LEAD + k * slot) * SR);
    for (let i = 0; i < n && s + i < x.length; i++) out[at + i] = x[s + i] * (i > n - fade ? (n - i) / fade : 1);
    // Loudness over the first half second, so every instrument can be evened out.
    for (let i = 0; i < 0.5 * SR && s + i < x.length; i++, count++) energy += x[s + i] * x[s + i];
  });
  // The gain that brings this instrument to the same loudness as the others.
  const norm = +(0.15 / Math.sqrt(energy / count)).toFixed(3);
  const file = `assets/audio/inst/${name}.mp3`;
  encode(out, path.join(ROOT, file));
  manifest.inst[name] = { file, slot, notes, sustain, norm };
  console.log(name, notes.length, 'notes, gain', norm);
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
    const [pack, file] = f.split('/');
    const x = decode(path.join(CACHE, K[pack], 'Audio', file));
    let s = 0;
    while (s < x.length && Math.abs(x[s]) < 0.002) s++;
    let e = x.length;
    while (e > s && Math.abs(x[e - 1]) < 0.001) e--;
    const clip = x.slice(s, Math.min(e, s + Math.round(2.5 * SR)));
    pieces.push([t, clip]);
    manifest.sfx.items[name].push([+t.toFixed(4), +(clip.length / SR).toFixed(4)]);
    t += clip.length / SR + 0.08;
  }
}
const sfx = strip(t + 0.2);
for (const [at, clip] of pieces) sfx.set(clip, Math.round(at * SR));
encode(sfx, path.join(ROOT, manifest.sfx.file));
console.log('effects', Object.keys(EFFECTS).length, 'sets,', t.toFixed(1), 's');

fs.writeFileSync(
  path.join(ROOT, 'src/audio/manifest.js'),
  `// Made by tools/build-audio.mjs: where each recorded note and effect sits in the audio strips.\n// Instruments: FluidR3 GM by Frank Wen (CC BY 3.0); effects: Kenney (CC0). See assets/audio/CREDITS.md.\nexport const MANIFEST = ${JSON.stringify(manifest)};\n`,
);
