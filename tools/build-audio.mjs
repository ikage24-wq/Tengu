// Builds the game's recorded sounds into a few small files (needs node and ffmpeg):
//   assets/audio/inst/<instrument>.mp3  one strip per instrument: a note every three semitones,
//                                       each in a fixed-length slot
//   assets/audio/sfx.mp3                every recorded effect, one after another
//   src/audio/manifest.js               where each note and effect sits in those strips
// Every source is public domain (CC0), so nothing needs crediting (see assets/audio/SOURCES.md):
//   instruments: Versilian Studios' VS Chamber Orchestra 2 Community Edition (VSCO 2 CE) and
//                Versilian Community Sample Library (VCSL), both from GitHub
//   effects:     Kenney's RPG Audio, Impact Sounds, Interface Sounds and Sci-Fi Sounds packs;
//                artisticdude's RPG Sound Pack and Swishes, Ogrebane's Battle Sound Effects and
//                rubberduck's 80 CC0 RPG SFX (OpenGameArt); Still North Media's Medieval Weapon
//                Textures and qubodup's 3 Melee Sounds; and percussion from VSCO 2 CE and VCSL
//                (gongs, bells, glass, cymbals, drums, zaps) for the spells
//
// Needs node, curl and unzip; ffmpeg comes from the ffmpeg-static package (or the PATH), and the
// .7z packs open with 7z or, failing that, the tar that ships with Windows.
//
// Every strip starts with a short click at MARK seconds (then silence until LEAD), so the game can
// line the slots up exactly however the browser's decoder pads the start of the file.
//
// Run: node tools/build-audio.mjs   (downloads into tools/.audio-cache, which git ignores)

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import ffmpegStatic from 'ffmpeg-static';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = path.join(ROOT, 'tools/.audio-cache');
const FFMPEG = ffmpegStatic && fs.existsSync(ffmpegStatic) ? ffmpegStatic : 'ffmpeg';
const SR = 44100;
// The instruments' rate (the game decodes them at this rate too, samples.js INST_SR).
const INST_SR = 32000;
const MARK = 0.05;
const LEAD = 0.2;
fs.mkdirSync(path.join(ROOT, 'assets/audio/inst'), { recursive: true });
fs.mkdirSync(CACHE, { recursive: true });

// ---------- Instruments ----------
// [name, sources, lowest MIDI note, highest, slot seconds, sustained (loops when held)].
// A source is 'V:folder' (VSCO 2 CE) or 'C:folder' (VCSL), the files right in that folder, with
// '|regex' to prefer some (a dynamic, a take), and '|+12' to move its names by octaves where the
// ear can't judge them (bells, short plucks). Each note is the nearest recorded pitch, retuned;
// with `mix`, the nearest note of every source is layered (a section). Names stay General MIDI's
// where a song already used one.
const INSTRUMENTS = [
  // Woodwinds
  ['flute', ['V:Woodwinds/Flute/susvib|v1_1'], 60, 96, 2.0, true],
  ['piccolo', ['V:Woodwinds/Piccolo/Sus'], 72, 105, 2.0, true],
  ['oboe', ['V:Woodwinds/Oboe/Vib|_v3_'], 57, 90, 2.0, true],
  ['clarinet', ['V:Woodwinds/Clarinet/susLong|_v2_'], 48, 87, 2.0, true],
  ['bassoon', ['V:Woodwinds/Bassoon/sus|_v2_'], 34, 72, 2.0, true],
  ['recorder', ['C:Aerophones/Edge-blown Aerophones/Baroque Soprano Recorder/Sustain'], 60, 96, 2.0, true],
  ['pan_flute', ['C:Aerophones/Edge-blown Aerophones/Ocarina, Typical/Sustains/SusVib'], 57, 90, 2.0, true],
  ['ocarina', ['C:Aerophones/Edge-blown Aerophones/Ocarina, Typical/Sustains/Sus'], 57, 90, 2.0, true],
  ['accordion', ['C:Aerophones/Free Aerophones/Harmonica-Hohner-Super64/Sustains/Vib'], 48, 84, 2.0, true],
  ['harmonica', ['C:Aerophones/Free Aerophones/Harmonica-Hohner-Super64/Sustains/Normal'], 48, 84, 2.0, true],
  ['saxophone', ['C:Aerophones/Reed Aerophones/Tenor Saxophone/Vibrato'], 42, 78, 2.0, true],
  // Strings
  ['violin', ['V:Strings/Solo Violin/Arco Vib|_f\\.'], 55, 96, 2.0, true],
  ['string_ensemble_1', ['V:Strings/Violin Section/susVib|_v2', 'V:Strings/Viola Section/susvib|_v2_', 'V:Strings/Cello Section/susvib|_v3_'], 36, 96, 2.0, true, 'mix'],
  ['viola', ['V:Strings/Viola Section/susvib|_v2_'], 48, 84, 2.0, true],
  ['cello', ['V:Strings/Cello Section/susvib|_v3_'], 36, 76, 2.0, true],
  ['contrabass', ['V:Strings/Solo Contrabass/SusVib|_v3_'], 28, 60, 2.0, true],
  ['pizzicato_strings', ['V:Strings/Violin Section/Pizz|_v2_rr1|+12', 'V:Strings/Cello Section/pizzT|_v2_RR1', 'V:Strings/Solo Contrabass/Pizz|_v3_rr1'], 27, 84, 1.4, false],
  ['orchestral_harp', ['C:Chordophones/Composite Chordophones/Concert Harp|_mf1'], 36, 96, 2.4, false],
  ['folk_harp', ['C:Chordophones/Composite Chordophones/Folk Harp|_v2_'], 36, 90, 2.4, false],
  ['acoustic_guitar_nylon', ['C:Chordophones/Composite Chordophones/Strumstick/Finger|_vl2_'], 39, 84, 2.4, false],
  // The Dan Tranh, a zither close to the koto (the sitar parts play on it too).
  ['koto', ['C:Chordophones/Zithers/Dan Tranh/Normal|_f_'], 47, 88, 2.4, false],
  ['sitar', ['C:Chordophones/Zithers/Dan Tranh/Vibrato|_mf_'], 47, 84, 2.4, false],
  ['electric_bass_finger', ['V:Strings/Solo Contrabass/Pizz|_v3_rr1'], 27, 63, 1.6, false],
  // Brass
  ['french_horn', ['V:Brass/F Horn/sus|_v2_'], 39, 78, 2.0, true],
  ['trumpet', ['V:Brass/Trumpet/sus|_v3_'], 54, 87, 1.6, true],
  ['trombone', ['V:Brass/Tenor Trombone/sus|_v2_'], 34, 72, 1.6, true],
  ['tuba', ['V:Brass/Tuba/sus|_v2_'], 24, 60, 1.6, true],
  ['brass_section', ['V:Brass/F Horn/sus|_v2_', 'V:Brass/Trumpet/sus|_v3_', 'V:Brass/Tenor Trombone/sus|_v2_'], 39, 84, 1.6, true, 'mix'],
  // Keys
  ['acoustic_grand_piano', ['C:Chordophones/Zithers/Grand Piano, Steinway B/Sus|_vl3_rr1'], 36, 96, 2.4, false],
  ['upright_piano', ['C:Chordophones/Zithers/Upright Piano, Yamaha/Sustains|_vl2_rr1'], 36, 96, 2.4, false],
  ['harpsichord', ['C:Chordophones/Zithers/Harpsichord, Flemish/Sustains/High', 'C:Chordophones/Zithers/Harpsichord, Flemish/Sustains/Low'], 36, 90, 2.0, false],
  ['church_organ', ['C:Aerophones/Edge-blown Aerophones/Pipe Organ/Quiet'], 36, 90, 2.0, true],
  // Mallets and bells
  ['marimba', ['C:Idiophones/Struck Idiophones/Marimba|_med_'], 48, 96, 1.4, false],
  ['xylophone', ['C:Idiophones/Struck Idiophones/Xylophone/Medium Mallets|_ff_'], 60, 100, 1.2, false],
  ['glockenspiel', ['C:Idiophones/Struck Idiophones/Glockenspiel|_loud_|+12'], 72, 105, 2.0, false],
  ['vibraphone', ['C:Idiophones/Struck Idiophones/Vibraphone/Hard Mallets|_v2_'], 53, 89, 2.4, false],
  // The celesta's part on a vibraphone's soft mallets: the same soft bell.
  ['celesta', ['C:Idiophones/Struck Idiophones/Vibraphone/Soft Mallets|_v2_'], 60, 99, 2.0, false],
  ['tubular_bells', ['C:Idiophones/Struck Idiophones/Tubular Bells 2|_v2_|+12'], 60, 84, 2.4, false],
  ['hand_chimes', ['C:Idiophones/Struck Idiophones/Hand Chimes'], 48, 90, 2.4, false],
  ['kalimba', ['C:Idiophones/Plucked Idiophones/Kalimba, Kenya'], 48, 84, 1.6, false],
  ['balafon', ['C:Idiophones/Struck Idiophones/Balafon/Traditional Mallet|_vl2_'], 48, 84, 1.0, false],
  // Drums with a pitch (the timpani's names carry none, so theirs is measured).
  ['timpani', ['V:Percussion/Timpani|_v3_rr1'], 36, 60, 2.0, false],
  ['woodblock', ['C:Idiophones/Struck Idiophones/Woodblock'], 72, 81, 0.5, false],
];
// The two libraries: GitHub repositories, read through their file lists.
const LIBS = { V: 'sgossner/VSCO-2-CE', C: 'sgossner/VCSL' };

// Effects: name -> files in the Kenney packs.
const K = { rpg: 'rpg-audio', imp: 'impact-sounds', ui: 'interface-sounds', sci: 'sci-fi-sounds' };
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

// ---------- Spells and clashes: real percussion (VSCO 2 CE, VCSL) and Kenney's Sci-Fi Sounds ----------
// 'V:file' / 'C:file' is a file in a library; 'a + b' layers takes from their attacks; '*0.5' sets
// a layer's gain.
const VM = 'V:Miscellania Raw/Misc 1/';
const GL = 'V:Miscellania Raw/Misc 2/glock_glisses/glock_fx_';
const GONG = 'V:VSCO 1 Percussion/varMetal/Gong/gong_';
const SI = 'C:Idiophones/Struck Idiophones/';
const BD = 'C:Membranophones/Struck Membranophones/Bass Drum 2/bassdrum_';
const WG = 'C:Idiophones/Friction Idiophones/Wine Glasses/';
const CRASH = `${SI}Clash Cymbals 1/cymbal_crash1_`;
const SWELL = `${SI}Suspended Cymbal 1/susCymb1_cresc_`;
Object.assign(EFFECTS, {
  clang: [`${SI}Anvil/Anvil_Hit1_v2_rr1_Mid.wav`, `${SI}Anvil/Anvil_Hit2_v2_rr1_Mid.wav`, `${SI}Anvil/Anvil_Hit3_v2_rr1_Mid.wav`, `${VM}metal_hit1.wav`],
  clangHeavy: [`${SI}Anvil/Anvil_Hit1_v3_rr1_Mid.wav + ${SI}Brake Drum/BrakeDrum1_Hammer_v3_rr1_Mid.wav*0.6`, `${SI}Anvil/Anvil_Hit2_v3_rr1_Mid.wav + ${SI}Brake Drum/BrakeDrum2_Hammer3_v3_rr1_Mid.wav*0.6`, `${SI}Anvil/Anvil_Hit3_v3_rr1_Mid.wav + ${VM}metal_hit6.wav*0.6`],
  clangLight: [`${VM}metal_hit2.wav`, `${VM}metal_hit3.wav`, `${VM}metal_hit4.wav`],
  fireImpact: ['sci/explosionCrunch_000.ogg~1.2', 'sci/explosionCrunch_002.ogg~1.2', 'oga80:spell_fire_01 + sci/lowFrequency_explosion_000.ogg~1.2*0.7', `sci/explosionCrunch_004.ogg~1 + ${BD}hit_f.wav~1*0.5`],
  fireCharge: [`sci/thrusterFire_000.ogg~1.2 + ${SWELL}1.5s.wav~1.2*0.5`],
  iceLaunch: [`${VM}glass_break.wav + ${WG}Releases/Fast/glass3_A#4_Fast_1_Decay.wav~0.6*0.5`, `${VM}glass_break3.wav + ${WG}Releases/Fast/glass4_D5_Fast_1_Decay.wav~0.6*0.5`],
  iceImpact: [`${VM}glass_break2.wav`, `${VM}glass_break4.wav`, `${VM}glass_break5.wav + ${GL}down_chromatic_fast_01.wav~0.8*0.4`, `${VM}glass_break7.wav`],
  iceBig: [`${VM}glass_break6.wav + ${GL}down_chromatic_fast_02.wav~2*0.6 + ${WG}Releases/Slow/glass4_D5_Slow_2_Decay.wav~2*0.5`, `${VM}glass_break8.wav + ${GL}down_pentatonic_med_01.wav~2.1*0.6 + ${WG}Releases/Slow/glass1_D#4_Slow_1_Decay.wav~2.1*0.5`],
  iceCharge: [`${WG}Sustains/Fast/glass2_F#4_Fast_1_Main.wav~1`],
  zapLaunch: [`${VM}zap1.wav`, `${VM}zap3.wav`, `${VM}zap5.wav`],
  zapImpact: [`${VM}zap2.wav`, `${VM}zap6.wav`, `${VM}zap9.wav`, `${VM}zap12.wav`],
  zapCharge: [`${VM}zap11.wav + sci/forceField_002.ogg~1.2*0.5`],
  thunder: [`${BD}hit_ff.wav~1.2 + ${CRASH}ff2.wav~1.2*0.45 + sci/lowFrequency_explosion_000.ogg~1.2*0.6`, `${BD}roll_ff.wav~1.5 + ${CRASH}ff3.wav~1.5*0.4 + sci/lowFrequency_explosion_001.ogg~1.5*0.6`],
  holyBlast: [
    `${GONG}hit_ff.wav~1.5*0.7 + ${SI}Tubular Bells 2/TB_hit_A4_v4_1.wav~1.5 + ${SI}Bell Tree/Stroke/BellTree_Stroke_1_Mid.wav*0.6`,
    `${GONG}hit_mf_2.wav~1.1*0.7 + ${SI}Tubular Bells 2/TB_hit_B4_v4_1.wav~1.1 + ${SI}Mark Trees/Legacy/windchimes_desc1.wav~1.1*0.5`,
    `${SI}Hand Chimes/sus_C5_r01_main.wav~1 + ${SI}Bell Tree/Stroke/BellTree_Stroke_3_Mid.wav~1*0.7`,
  ],
  holyWave: [`${SI}Mark Trees/Legacy/windchimes_asc1.wav~2 + ${SWELL}2s.wav~2*0.4`, `${SI}Mark Trees/Legacy/windchimes_slowAsc1.wav~2 + ${SI}Hand Chimes/sus_C4_r01_main.wav~2*0.5`],
  holyProtect: [`${SI}Hand Chimes/sus_C4_r01_main.wav~2 + ${SI}Bell Tree/Stroke/BellTree_Stroke_4_Mid.wav*0.7`, `${SI}Hand Chimes/sus_A4_r01_main.wav~2 + ${SI}Bell Tree/Stroke/BellTree_Stroke_6_Mid.wav*0.7`],
  holyHeal: [`${SI}Bell Tree/Stroke/BellTree_Stroke_10_Mid.wav~1.1`, `${SI}Mark Trees/Legacy/windchimes_desc1.wav~2.2`],
  shield: ['sci/forceField_000.ogg~1.7 + V:VSCO 1 Percussion/varMetal/triangle/1/triangle1_hit_mp.wav~1.7*0.5', 'sci/forceField_001.ogg~1.6 + V:VSCO 1 Percussion/varMetal/triangle/3/triangle3_hit_mf.wav~1.6*0.5'],
  teleIn: [`${GL}up_chromatic_fast_01.wav~1.6 + ${SI}Mark Trees/Legacy/windchimes_fastAsc1.wav~1.6*0.5`],
  teleOut: [`${GL}down_chromatic_fast_03.wav~1.6 + ${SI}Mark Trees/Legacy/windchimes_desc1.wav~1.6*0.5`],
  poisonCast: [`${VM}bubbles.wav + sci/slime_000.ogg*0.6`, `${VM}bubbles2.wav`],
  acidHit: [`${VM}bubbles4.wav`, 'sci/slime_001.ogg', `${VM}bubbles.wav~0.6`],
  darkFire: [`${GONG}scrape_1.wav~1.1 + sci/thrusterFire_002.ogg~1.1*0.6`, `${GONG}scrape_2.wav~1.2 + sci/thrusterFire_003.ogg~1.2*0.6`],
  darkImpact: [`${GONG}smack_low_1.wav~2 + ${BD}hit_ff.wav~2*0.7`, `${GONG}smack_1.wav~2.2 + ${BD}hit_f.wav~2.2*0.7`],
  darkWave: ['V:VSCO 1 Percussion/varMetal/Cymbals/susp/susp_FX_scrape_continuous.wav@0.3~2', `${SI}Gong 1/gong_scrape_mf.wav~2.2`],
  darkRiser: [`${BD}cresc_short.wav~2.2 + ${SWELL}2s.wav~2.2*0.6`],
  meteor: [`sci/lowFrequency_explosion_000.ogg~2.5 + ${BD}hit_ff.wav~2.5*0.8 + ${CRASH}ff3.wav~2.5*0.4`, `sci/lowFrequency_explosion_001.ogg~2.5 + sci/explosionCrunch_001.ogg~2.5*0.7 + ${BD}hit_f.wav~2.5*0.8`],
  splash: ['C:Membranophones/Other Membranophones/Ocean Drum/OceanDrum_Sus_2_Mid.wav~1.8', `${VM}bubbles2.wav + C:Membranophones/Other Membranophones/Ocean Drum/OceanDrum_Sus_3_Mid.wav~1.6*0.7`],
});

// Effects played with another set's takes.
const ALIASES = {
  bladeSwing: 'swingSword', bladeSwingHeavy: 'swingSwordHeavy', stab: 'swingDagger', bowDraw: 'leather', arrowHit: 'wood',
  windShot: 'swish', windWhoosh: 'swish', rockHit: 'mining', rockThrow: 'stepStone',
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

const run = (args) => execFileSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', ...args]);
const get = (url, file) => {
  if (!fs.existsSync(file)) execFileSync('curl', ['-sSfL', '--max-time', '120', '-o', file, url]);
  return file;
};
// Opens a .7z with 7z, or with the tar that ships with Windows (it reads .7z too; Git Bash's own
// tar, first on its PATH, doesn't).
function un7z(file, dir) {
  try {
    execFileSync('7z', ['x', '-y', `-o${dir}`, file], { stdio: 'ignore' });
  } catch {
    const tar = process.platform === 'win32' ? path.join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'tar.exe') : 'tar';
    execFileSync(tar, ['-xf', file, '-C', dir], { stdio: 'ignore' });
  }
}
function decode(file, seconds = 60) {
  const raw = execFileSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-i', file, '-t', String(seconds), '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], { maxBuffer: 1 << 30 });
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

// `node tools/build-audio.mjs flute koto` rebuilds just those instruments ('inst': all of them,
// 'sfx': the effects), keeping the rest of the manifest as it is.
const only = process.argv.slice(2);
const MANIFEST_FILE = path.join(ROOT, 'src/audio/manifest.js');
const OLD_MANIFEST = JSON.parse(/MANIFEST = (.*);\s*$/s.exec(fs.readFileSync(MANIFEST_FILE, 'utf8'))[1]);
const manifest = only.length ? structuredClone(OLD_MANIFEST) : { mark: MARK, lead: LEAD, inst: {}, sfx: { file: 'assets/audio/sfx.mp3', items: {} } };

// ---------- The libraries ----------
// Each library's file list (cached), and one file of it, fetched once.
const trees = {};
function libTree(lib) {
  if (!trees[lib]) {
    const file = path.join(CACHE, `tree-${lib}.json`);
    if (!fs.existsSync(file)) {
      const branch = JSON.parse(execFileSync('curl', ['-sSfL', `https://api.github.com/repos/${LIBS[lib]}`]).toString()).default_branch;
      get(`https://api.github.com/repos/${LIBS[lib]}/git/trees/${branch}?recursive=1`, file);
      fs.writeFileSync(`${file}.branch`, branch);
    }
    trees[lib] = { branch: fs.readFileSync(`${file}.branch`, 'utf8'), files: JSON.parse(fs.readFileSync(file, 'utf8')).tree.filter((x) => x.type === 'blob').map((x) => x.path) };
  }
  return trees[lib];
}
function libFile(lib, file) {
  const out = path.join(CACHE, 'lib', lib, file);
  if (!fs.existsSync(out)) {
    fs.mkdirSync(path.dirname(out), { recursive: true });
    const url = `https://raw.githubusercontent.com/${LIBS[lib]}/${libTree(lib).branch}/${file.split('/').map(encodeURIComponent).join('/')}`;
    execFileSync('curl', ['-sSfL', '--retry', '3', '--max-time', '300', '-o', out, url]);
  }
  return out;
}

// ---------- Pitch ----------
const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
// The pitch in a file's name ('..._A#3_...' -> 58), or null.
function namedPitch(file) {
  const m = /(?:^|[_ ])([A-G])(#|b)?(-?\d)(?=[_. ])/.exec(path.basename(file));
  return m ? (Number(m[3]) + 1) * 12 + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) : null;
}
// The pitch heard in a note, as a MIDI number (fractional), or null: YIN over a stretch just after
// the attack.
function heardPitch(x, s, sr) {
  const a = s + Math.round(0.08 * sr);
  const n = Math.round(0.1 * sr);
  const maxLag = Math.round(sr / 30);
  if (a + n + maxLag > x.length) return null;
  const d = new Float32Array(maxLag + 1);
  for (let lag = 1; lag <= maxLag; lag++) {
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const v = x[a + i] - x[a + i + lag];
      sum += v * v;
    }
    d[lag] = sum;
  }
  let run = 0;
  for (let lag = 1; lag <= maxLag; lag++) {
    run += d[lag];
    const c = (d[lag] * lag) / (run || 1);
    if (lag > sr / 2500 && c < 0.15) {
      let best = lag;
      while (best + 1 <= maxLag && d[best + 1] < d[best]) best++;
      return 69 + 12 * Math.log2(sr / best / 440);
    }
  }
  return null;
}
// Where a recording's note starts: just before it first reaches 1% of its peak.
function attackOf(x) {
  let peak = 0;
  for (const v of x) peak = Math.max(peak, Math.abs(v));
  let s = 0;
  while (s < x.length && Math.abs(x[s]) < peak * 0.01) s++;
  return Math.max(0, s - Math.round(0.004 * SR));
}

// ---------- Instruments ----------
// Every recorded note of one source: [{ file, midi }], the pitch from the name or, without one,
// heard (and the whole source moved by octaves where most of its names disagree with the ear).
function sourceNotes(spec) {
  const [, lib, dir, prefer, moved] = /^([VC]):([^|]+)(?:\|([^|]*))?(?:\|([+-]\d+))?$/.exec(spec);
  const files = libTree(lib).files.filter((f) => f.startsWith(`${dir}/`) && !f.slice(dir.length + 1).includes('/') && /\.(wav|mp3)$/i.test(f));
  if (!files.length) throw new Error(`${spec}: no files`);
  const byPitch = new Map();
  const unnamed = [];
  for (const f of files) {
    const m = namedPitch(f);
    if (m == null) unnamed.push(f);
    else byPitch.set(m, [...(byPitch.get(m) ?? []), f]);
  }
  // One take per pitch: a preferred one if there is, else the middle of them (a middling dynamic).
  const pickOne = (list) => {
    const liked = prefer ? list.filter((f) => new RegExp(prefer).test(path.basename(f))) : [];
    const pool = (liked.length ? liked : list).sort();
    return pool[Math.floor((pool.length - 1) / 2)];
  };
  let notes = [...byPitch].map(([midi, list]) => ({ file: pickOne(list), midi }));
  if (!notes.length) {
    // No names: hear each take (one per drum, the preferred ones).
    const liked = prefer ? unnamed.filter((f) => new RegExp(prefer).test(path.basename(f))) : unnamed;
    for (const f of liked) {
      const x = decode(libFile(lib, f), 3);
      const p = heardPitch(x, attackOf(x), SR);
      if (p != null) notes.push({ file: f, midi: p });
    }
    if (!notes.length) notes = [{ file: liked[0], midi: null }];
    return notes.map((n) => ({ ...n, lib }));
  }
  if (moved) return notes.map((n) => ({ ...n, midi: n.midi + Number(moved), lib }));
  // Check the names' octaves by ear on a few notes.
  const votes = {};
  for (const n of notes.filter((_, i) => i % Math.max(1, Math.floor(notes.length / 5)) === 0)) {
    const x = decode(libFile(lib, n.file), 3);
    const p = heardPitch(x, attackOf(x), SR);
    if (p == null) continue;
    const off = Math.round((p - n.midi) / 12) * 12;
    if (Math.abs(p - n.midi - off) < 1) votes[off] = (votes[off] ?? 0) + 1;
  }
  const [shift, count] = Object.entries(votes).sort((a, b) => b[1] - a[1])[0] ?? ['0', 0];
  const total = Object.values(votes).reduce((a, b) => a + b, 0);
  if (Number(shift) !== 0 && count > total / 2) {
    console.log(`  ${spec}: names are ${shift} semitones off what's heard; corrected`);
    notes = notes.map((n) => ({ ...n, midi: n.midi + Number(shift) }));
  }
  return notes.map((n) => ({ ...n, lib }));
}

// One note at `midi` from the nearest recording in `notes`: retuned by resampling, from its attack,
// `len` seconds long with a fade at the end, at INST_SR.
function noteAt(notes, midi, len, fallback) {
  let best = notes[0];
  for (const n of notes) if (Math.abs((n.midi ?? fallback) - midi) < Math.abs((best.midi ?? fallback) - midi)) best = n;
  const x = decode(libFile(best.lib, best.file), len * 3 + 1);
  const s = attackOf(x);
  const step = Math.pow(2, (midi - (best.midi ?? fallback)) / 12) * (SR / INST_SR);
  const n = Math.round(len * INST_SR);
  const out = new Float32Array(n);
  const fade = Math.round(0.12 * INST_SR);
  for (let i = 0; i < n; i++) {
    const p = s + i * step;
    const k = Math.floor(p);
    if (k + 1 >= x.length) break;
    out[i] = (x[k] + (x[k + 1] - x[k]) * (p - k)) * (i > n - fade ? (n - i) / fade : 1);
  }
  return { out, dist: Math.abs((best.midi ?? fallback) - midi) };
}
// Loudness over a note's first half second.
const rms = (x, sr) => {
  let e = 0;
  const n = Math.min(x.length, Math.round(0.5 * sr));
  for (let i = 0; i < n; i++) e += x[i] * x[i];
  return Math.sqrt(e / Math.max(1, n));
};

function buildInstrument([name, sources, lo, hi, slot, sustain, mix]) {
  const all = sources.map(sourceNotes);
  const notes = [];
  for (let m = lo; m <= hi; m += 3) notes.push(m);
  const out = new Float32Array(Math.ceil((LEAD + notes.length * slot) * INST_SR));
  for (let i = 0; i < 0.004 * INST_SR; i++) out[Math.round(MARK * INST_SR) + i] = i % 14 < 7 ? 0.9 : -0.9;
  const fallback = Math.round((lo + hi) / 2);
  const levels = [];
  const offKey = [];
  notes.forEach((m, k) => {
    let x;
    if (mix) {
      // A section: the sources that reach this note (within a fourth of a recording), layered.
      const parts = all.map((src) => noteAt(src, m, slot, fallback));
      const near = parts.filter((p) => p.dist <= 5);
      const use = near.length ? near : [parts.sort((a, b) => a.dist - b.dist)[0]];
      x = new Float32Array(Math.round(slot * INST_SR));
      for (const p of use) {
        const g = 1 / (rms(p.out, INST_SR) || 1);
        for (let i = 0; i < x.length; i++) x[i] += p.out[i] * g;
      }
    } else {
      // The nearest of all the sources' notes.
      x = noteAt(all.flat(), m, slot, fallback).out;
    }
    // Every note at an even level (libraries record each pitch at its own gain).
    const r = rms(x, INST_SR) || 1;
    for (let i = 0; i < x.length; i++) x[i] *= 0.15 / r;
    levels.push(r);
    out.set(x, Math.round((LEAD + k * slot) * INST_SR));
    // Listen back: is the finished note the pitch it should be?
    const heard = heardPitch(x, 0, INST_SR);
    if (heard != null && Math.abs(heard - m) > 0.6) offKey.push(`${m}:${heard.toFixed(1)}`);
  });
  if (offKey.length) console.log(`  ${name}: ${offKey.length}/${notes.length} notes heard elsewhere (target:heard) ${offKey.join(' ')}`);
  // Every note is already at the level the songs were balanced for (0.15 over its first half
  // second), so the gain is 1, unless the strip had to come down to fit its peaks.
  let peak = 0;
  for (let i = Math.round(LEAD * INST_SR); i < out.length; i++) peak = Math.max(peak, Math.abs(out[i]));
  if (peak > 0.98) for (let i = Math.round(LEAD * INST_SR); i < out.length; i++) out[i] *= 0.98 / peak;
  const gain = +Math.max(1, peak / 0.98).toFixed(3);
  const file = `assets/audio/inst/${name}.mp3`;
  const tmp = path.join(CACHE, 'tmp.f32');
  fs.writeFileSync(tmp, Buffer.from(out.buffer));
  run(['-f', 'f32le', '-ar', String(INST_SR), '-ac', '1', '-i', tmp, '-c:a', 'libmp3lame', '-b:a', '64k', path.join(ROOT, file)]);
  manifest.inst[name] = { file, slot, notes, sustain, norm: gain };
  console.log(name, notes.length, 'notes, gain', gain);
}
for (const inst of INSTRUMENTS) if (!only.length || only.includes(inst[0]) || only.includes('inst')) buildInstrument(inst);

// ---------- Combat packs ----------
const packDir = (name) => path.join(CACHE, 'packs', name);
function fetchPack(name) {
  const dir = packDir(name);
  if (fs.existsSync(dir)) return;
  const p = PACKS[name];
  fs.mkdirSync(dir, { recursive: true });
  if (p.urls) {
    p.urls.forEach((u, i) => un7z(get(u, path.join(CACHE, `${p.file}${i + 1}.7z`)), dir));
    return;
  }
  if (p.url) {
    const file = get(p.url, path.join(CACHE, p.file));
    if (file.endsWith('.7z')) un7z(file, dir);
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
// One layer of an effect -> { file, take, skip, max, gain } (or { old } for a take kept from the
// last build). Forms: 'pack/file.ogg' (Kenney), 'pack:name#take' (a combat pack; `#take` picks one
// take from a file that holds several, recorded one after another with silence between), and
// 'V:file' / 'C:file' (a library); each may end '@skip~length*gain' (seconds, seconds, times).
function source(spec, oldTake) {
  const [, body, skip, max, gain] = /^(.+?)(?:@([\d.]+))?(?:~([\d.]+))?(?:\*([\d.]+))?$/.exec(spec.trim());
  const o = { skip: Number(skip ?? 0), max: Number(max ?? 2.5), gain: Number(gain ?? 1), take: null };
  const lib = /^([VC]):(.+)$/.exec(body);
  if (lib) return { ...o, file: libFile(lib[1], lib[2]) };
  if (!body.includes(':')) {
    const [pack, file] = body.split('/');
    const dir = path.join(CACHE, K[pack]);
    // Kenney's RPG Audio and Impact Sounds aren't posted anywhere a script may fetch: their takes
    // come from the last build's strip.
    if (!fs.existsSync(dir)) return { ...o, old: oldTake };
    return { ...o, file: path.join(dir, 'Audio', file) };
  }
  const m = /^(\w+):([^#]+)(?:#(\d+))?$/.exec(body);
  return { ...o, file: findIn(m[1], m[2]), take: m[3] == null ? null : Number(m[3]) };
}

// The last build's effects strip and where its takes sit (for takes whose pack isn't here).
let oldStrip = null;
function previousTake([name, k]) {
  const item = OLD_MANIFEST.sfx.items[name]?.[k];
  if (!item) throw new Error(`no earlier take of ${name} #${k} (fetch its Kenney pack into ${CACHE})`);
  if (!oldStrip) {
    const x = decode(path.join(ROOT, OLD_MANIFEST.sfx.file), 1e5);
    let i = 0;
    while (i < x.length && Math.abs(x[i]) < 0.45) i++;
    oldStrip = { x, offset: i / SR - OLD_MANIFEST.mark };
  }
  const a = Math.round((oldStrip.offset + item[0]) * SR);
  return oldStrip.x.slice(a, a + Math.round(item[1] * SR));
}
// One layer as a trimmed clip: from its attack (after `skip`), at most `max` seconds, faded.
function clipOf(src) {
  if (src.old) return previousTake(src.old);
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
  return clip;
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
// Kenney's packs that he posted on OpenGameArt (kenney.nl turns scripts away).
const KENNEY_OGA = { 'interface-sounds': 'kenney_interfaceSounds.zip', 'sci-fi-sounds': 'sci-fi_sounds.zip' };
if (!only.length || only.includes('sfx')) {
  for (const pack of Object.values(K)) {
    const zipDir = path.join(CACHE, pack);
    if (!fs.existsSync(zipDir) && KENNEY_OGA[pack]) execFileSync('unzip', ['-q', '-o', get(OGA + KENNEY_OGA[pack], path.join(CACHE, `${pack}.zip`)), '-d', zipDir]);
  }
  const pieces = [];
  let t = LEAD;
  manifest.sfx.items = {};
  for (const [name, files] of Object.entries(EFFECTS)) {
    manifest.sfx.items[name] = [];
    files.forEach((f, k) => {
      // The layers, each from its own attack, summed.
      const layers = f.split(' + ').map((spec) => {
        const src = source(spec, [name, k]);
        const x = clipOf(src);
        if (src.gain !== 1) for (let i = 0; i < x.length; i++) x[i] *= src.gain;
        return x;
      });
      const clip = new Float32Array(Math.max(...layers.map((x) => x.length)));
      for (const x of layers) for (let i = 0; i < x.length; i++) clip[i] += x[i];
      // Every clip at the same peak, so recipes set the balance.
      let peak = 0;
      for (const v of clip) peak = Math.max(peak, Math.abs(v));
      if (peak > 0) for (let i = 0; i < clip.length; i++) clip[i] *= 0.8 / peak;
      pieces.push([t, clip]);
      manifest.sfx.items[name].push([+t.toFixed(4), +(clip.length / SR).toFixed(4)]);
      t += clip.length / SR + 0.08;
    });
  }
  const sfx = strip(t + 0.2);
  for (const [at, clip] of pieces) sfx.set(clip, Math.round(at * SR));
  encode(sfx, path.join(ROOT, manifest.sfx.file));
  for (const [name, to] of Object.entries(ALIASES)) manifest.sfx.items[name] = manifest.sfx.items[to];
  console.log('effects', Object.keys(EFFECTS).length, 'sets,', t.toFixed(1), 's');
}

fs.writeFileSync(
  MANIFEST_FILE,
  `// Made by tools/build-audio.mjs: where each recorded note and effect sits in the audio strips. Every\n// recording is public domain (CC0): Versilian Studios (VSCO 2 CE, VCSL), Kenney, OpenGameArt and Still North Media. See assets/audio/SOURCES.md.\nexport const MANIFEST = ${JSON.stringify(manifest)};\n`,
);
