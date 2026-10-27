// Builds the game's recorded sounds into a few small files (needs node and ffmpeg):
//   assets/audio/inst/<instrument>.mp3  one strip per instrument: a note every three semitones,
//                                       each in a fixed-length slot
//   assets/audio/sfx.mp3                every recorded effect, one after another
//   src/audio/manifest.js               where each note and effect sits in those strips
// Sources (see assets/audio/CREDITS.md):
//   instruments: the FluidR3 GM soundfont by Frank Wen, CC BY 3.0, as packaged by
//                gleitz/midi-js-soundfonts
//   effects:     Kenney's RPG Audio, Impact Sounds and Interface Sounds packs, CC0
//   combat:      JC Sounds' Fantasy SFX Pack Vol 1 (CC BY 4.0), The Soundrack's Magic Spell SFX
//                pack (CC BY 4.0, from itch.io), artisticdude's RPG Sound Pack and Swishes (CC0),
//                Ogrebane's Battle Sound Effects (CC0) and rubberduck's 80 CC0 RPG SFX (CC0), the
//                last four from OpenGameArt; Still North Media's Medieval Weapon Textures (Ben
//                Jaszczak and Brian Nelson, CC0) and qubodup's 3 Melee Sounds (CC0)
//
// Needs node, ffmpeg, curl, unzip, 7z (for the .7z pack) and unar (for the .rar pack).
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
  // ---------- Combat packs: 'pack:file' (the file's name, or its end), with @skip and ~length in seconds ----------
  bladeSwing: ['jc:Sword_Swing_01', 'jc:Sword_Swing_02', 'jc:Sword_Swing_03'],
  bladeSwingHeavy: ['jc:Heavy Sword_Swing_01', 'jc:Heavy Sword_Swing_02', 'jc:Heavy Sword_Swing_03'],
  stab: ['jc:Dagger_Swing_01', 'jc:Dagger_Swing_02', 'jc:Dagger_Swing_03'],
  swish: ['swish:swish-1', 'swish:swish-4', 'swish:swish-8', 'battle:swish_2', 'battle:swish_4'],
  cut: ['oga80:blade_01', 'oga80:blade_02', 'oga80:blade_03'],
  clang: ['jc:Sword_Hit_Metal_01', 'jc:Sword_Hit_Metal_02', 'jc:Sword_Hit_Metal_03'],
  clangHeavy: ['jc:Heavy Sword_Hit_Metal_01', 'jc:Heavy Sword_Hit_Metal_02', 'jc:Heavy Sword_Hit_Metal_03'],
  clangLight: ['jc:Dagger_Hit_Metal_01', 'jc:Dagger_Hit_Metal_02', 'jc:Dagger_Hit_Metal_03'],
  unsheathe: ['rpgpack:sword-unsheathe', 'rpgpack:sword-unsheathe2', 'rpgpack:sword-unsheathe3'],
  bowShoot: ['jc:Bow_Arrow_Shoot_01', 'jc:Bow_Arrow_Shoot_02', 'battle:Bow'],
  bowDraw: ['jc:Bow_Arrow_Draw_01~0.6', 'jc:Bow_Arrow_Draw_02~0.6'],
  arrowHit: ['jc:Bow_Arrow_Hit_01', 'jc:Bow_Arrow_Hit_02'],
  fireLaunch: ['jc:Fireball Launch_01@0.25~0.9', 'jc:Fireball Launch_02@0.2~0.9', 'oga80:spell_fire_01', 'oga80:spell_fire_02~0.6'],
  fireImpact: ['mg:fire_spell_fireball_burst_warm_01~1.2', 'mg:fire_spell_fireball_burst_warm_02~1.2', 'mg:fire_spell_fireball_burst_warm_04~1', 'jc:Fireball Impact_01@0.08~1'],
  fireCharge: ['jc:Fireball_Buildup@0.3'],
  iceLaunch: ['jc:Ice Shard Projectile_Launch_01~0.9', 'jc:Ice Shard Projectile_Launch_02~0.9'],
  iceImpact: ['jc:Ice Shard  Projectile_Impact_01~0.7', 'jc:Ice Shard  Projectile_Impact_02~0.7', 'mg:Ice_Spell_cast_and_impact_05~0.9', 'mg:Ice_Spell_cast_and_impact_06~0.9'],
  iceBig: ['mg:Ice_Spell_cast_and_impact_03~2', 'mg:Ice_Spell_cast_and_impact_04~2.1'],
  iceCharge: ['jc:Ice Spell_Buildup@0.2'],
  zapLaunch: ['jc:Electric Spell_Launch_01@0.12~0.8', 'jc:Electric Spell_Launch_02@0.12~0.8'],
  zapImpact: ['jc:Electric Spell_Hit_01~0.65', 'mg:lighting_spell_electric_zap_blast_sparkle_bright_01', 'mg:lighting_spell_electric_zap_blast_sparkle_bright_03', 'mg:lighting_spell_electric_zap_blast_sparkle_bright_06'],
  zapCharge: ['jc:Electric Spell_Buildup'],
  thunder: ['mg:lighting_spell_electric_impact_thunder_loud_dark_03@0.6~1.2', 'mg:lighting_spell_electric_impact_thunder_loud_dark_01@0.9~1.5'],
  holyBlast: ['mg:Holy_spell_blast_cast_01~1.5', 'mg:Holy_spell_blast_cast_02~1.1', 'mg:Holy_spell_blast_cast_06~1'],
  holyWave: ['mg:Holy_spell_wave_cast_02~2', 'mg:Holy_spell_wave_cast_05~2'],
  holyProtect: ['mg:Holy_spell_protect_cast_01~2', 'mg:Holy_spell_protect_cast_03~2'],
  holyHeal: ['mg:Holy_spell_heal_cast_bright_02~1.1', 'jc:Healing Chime_01@0.3~2.2'],
  shield: ['jc:Magic Shield_Activation_01@0.2~1.7', 'jc:Magic Shield_Activation_02@0.25~1.6'],
  teleIn: ['jc:Teleport_In'],
  teleOut: ['jc:Teleport_Out'],
  poisonCast: ['mg:acid_spell_cast_bubble_poison_03~1.5', 'mg:acid_spell_cast_poison_gas_02~1.6'],
  acidHit: ['mg:acid_spell_cast_squish_ball_impact_01~0.6', 'mg:acid_spell_cast_squish_ball_impact_02~0.8', 'mg:acid_spell_cast_squish_ball_impact_03~0.9'],
  darkFire: ['mg:dark_spell_cast_dark_fire_02~1.1', 'mg:dark_spell_cast_dark_fire_04~1.2'],
  darkImpact: ['mg:dark_spell_cast_charge_impact_03~2', 'mg:dark_spell_cast_charge_impact_01~2.2'],
  darkWave: ['mg:dark_spell_cast_energy_wave_02@0.15~2', 'mg:dark_spell_cast_energy_wave_05@0.15~2.2'],
  darkRiser: ['mg:dark_spell_cast_energy_riser_02~2.2'],
  windShot: ['mg:wind_spell_cast_air_sharp_shoot_02~0.5', 'mg:wind_spell_cast_air_sharp_shoot_01~0.8', 'mg:wind_spell_cast_air_sharp_shoot_04~0.8'],
  windWhoosh: ['mg:wind_spell_cast_air_transient_whoosh_02~0.8', 'mg:wind_spell_cast_air_transient_whoosh_06@0.05~1', 'mg:wind_spell_cast_air_transient_whoosh_01~1'],
  rockHit: ['mg:earth_spell_cast_impact_ground_rock_debris_01', 'mg:earth_spell_cast_impact_ground_rock_debris_02~1.6'],
  rockThrow: ['mg:earth_spell_cast_throw_rock_fast_whoosh_impact_01~1.1', 'mg:earth_spell_cast_throw_rock_fast_whoosh_impact_03~1.1'],
  meteor: ['mg:earth_spell_cast_meteor_explosion_02@0.8~2.5', 'mg:earth_spell_cast_meteor_explosion_03@1.2~2.5'],
  splash: ['mg:water_spell_cast_splash_whoosh_01~1.8', 'mg:water_spell_cast_splash_whoosh_04~1.8'],
  creatureHurt: ['oga80:creature_hurt_01', 'oga80:creature_hurt_02', 'oga80:creature_misc_03'],
  creatureDie: ['oga80:creature_die_01'],
  slime: ['rpgpack:slime1', 'rpgpack:slime2', 'rpgpack:slime4', 'rpgpack:slime5', 'rpgpack:slime10'],
  ogre: ['rpgpack:ogre1', 'rpgpack:ogre3', 'rpgpack:ogre4'],
  coins2: ['oga80:item_coins_01', 'oga80:item_coins_02', 'oga80:item_coins_03'],
  // ---------- Each weapon's own swing (Medieval Weapon Textures: one file of several takes each) ----------
  // Every take is cut so its loudest moment comes about 0.06 s in, so the game can time it to the blow.
  swingSword: ['jc:Sword_Swing_01@0.12', 'jc:Sword_Swing_02@0.12', 'jc:Sword_Swing_03@0.11', 'med:Katana Swing#7', 'med:Katana Swing#5'],
  swingSwordHeavy: ['jc:Heavy Sword_Swing_01@0.13', 'jc:Heavy Sword_Swing_02@0.12', 'jc:Heavy Sword_Swing_03@0.12', 'med:Sabre Swing#48', 'med:Sabre Swing#50'],
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

// The combat packs: where to get each, and how it's packed.
const OGA = 'https://opengameart.org/sites/default/files/';
const PACKS = {
  jc: { url: `${OGA}fantasy_sfx_pack_vol_1.7z`, file: 'jc.7z' },
  oga80: { url: `${OGA}80-CC0-RPG-SFX_0.zip`, file: 'oga80.zip' },
  rpgpack: { url: `${OGA}rpg_sound_pack.zip`, file: 'rpgpack.zip' },
  swish: { url: `${OGA}swishes.zip`, file: 'swish.zip' },
  battle: { url: `${OGA}battle_sound_effects_0.zip`, file: 'battle.zip' },
  med: { urls: [`${OGA}medieval_sfx_textures_1_of_2.7z`, `${OGA}medieval_sfx_textures_2_of_2.7z`], file: 'med' },
  melee3: { url: `${OGA}melee%20sounds.zip`, file: 'melee3.zip' },
  // itch.io: two parts of one .rar, free downloads (fetched through the page's own download flow).
  mg: { itch: 'https://thesoundrack.itch.io/freemagicspellsfx', uploads: [19749727, 19749730] },
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

// ---------- Combat packs ----------
const packDir = (name) => path.join(CACHE, 'packs', name === 'mg' ? 'magic' : name);
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
  // itch.io: open the purchase page (free), ask for the download page, then each file's link.
  const jar = path.join(CACHE, 'itch-cookies.txt');
  const curl = (...args) => execFileSync('curl', ['-sS', '-c', jar, '-b', jar, ...args]).toString();
  curl(`${p.itch}/purchase`);
  const page = JSON.parse(curl('-X', 'POST', `${p.itch}/download_url`)).url;
  const html = curl(page);
  const csrf = /csrf_token" value="([^"]+)/.exec(html)[1];
  const key = /download\/([^"?]+)/.exec(page)[1];
  const parts = p.uploads.map((id, i) => {
    const link = JSON.parse(curl('-X', 'POST', '--data-urlencode', `csrf_token=${csrf}`, `${p.itch}/file/${id}?source=game_download&key=${key}`)).url;
    const out = path.join(CACHE, `${name}.part${i + 1}.rar`);
    if (!fs.existsSync(out)) execFileSync('curl', ['-sSfL', '-o', out, link]);
    return out;
  });
  execFileSync('unar', ['-q', '-f', '-o', dir, parts[0]], { stdio: 'ignore' });
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
console.log('effects', Object.keys(EFFECTS).length, 'sets,', t.toFixed(1), 's');

fs.writeFileSync(
  path.join(ROOT, 'src/audio/manifest.js'),
  `// Made by tools/build-audio.mjs: where each recorded note and effect sits in the audio strips.\n// Instruments: FluidR3 GM by Frank Wen (CC BY 3.0); effects: Kenney (CC0). See assets/audio/CREDITS.md.\nexport const MANIFEST = ${JSON.stringify(manifest)};\n`,
);
