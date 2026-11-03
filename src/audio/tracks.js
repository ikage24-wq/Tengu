// The soundtrack: real, recorded music for each area (2026-11-03), in place of the songs written
// in code (songs.js), which sounded mechanical. Every track is public domain (CC0), so nothing
// needs crediting; the composers are listed anyway (assets/audio/SOURCES.md). The files are in
// assets/audio/music, cut down to 96 kbps MP3s; each one loops whole.
//
// A key here wins over a written song of the same name. Night versions ("town-night") play the
// day's track; the fight layers have no recorded part, so a fight keeps the area's track as it is.

const T = (file, title, by) => ({ file: `assets/audio/music/${file}.mp3`, title, by });
const JJ = 'Juhani Junkala';

const HOME = T('home', 'A Place I Call Home', JJ);
const WITCHES = T('witches', 'Encounter With The Witches', JJ);
const EPIC = T('epic-boss', 'Epic Boss Battle', JJ);
const BATTLE = T('battle-theme-a', 'Battle Theme A', 'cynicmusic');
const LAIR = T('witchs-lair', "Witch's Lair", JJ);
const PRAIRIE = T('prairie-nights', 'Prairie Nights', JJ);

export const TRACKS = {
  title: T('childhood-friends', 'Childhood Friends', JJ),
  // Towns and calm places.
  town: HOME,
  harbor: T('sand-castles', 'Sand Castles', JJ),
  crag: T('old-tower-inn', 'The Old Tower Inn', 'RandomMind'),
  grove: T('innocence', 'Innocence', JJ),
  springs: T('peaceful-days', 'Peaceful Days', JJ),
  shrine: T('summer-memories', 'Summer Memories', JJ),
  // Lantern Lagoon, and the Sea Biscuit's voyage there.
  lagoon: T('sunshine-coast', 'Sunshine Coast', JJ),
  voyage: T('island-ukulele', 'Happy Ukulele Island Surfing Theme', 'Tarush Singhal'),
  // Fields.
  meadow: T('grasslands', 'Grasslands', JJ),
  sky: T('tropical-island', 'Tropical Island', JJ),
  forest: PRAIRIE,
  ridge: PRAIRIE,
  ruins: T('thael-mines', "Tha'el Mines", JJ),
  cave: T('crystal-cave', 'Crystal Cave', 'cynicmusic'),
  peak: T('snowfall', 'Snowfall', 'Kistol'),
  starfall: T('whispers', 'Whispers From Beyond', JJ),
  // Dungeons.
  hollow: T('catacombs', 'Catacombs', JJ),
  manor: T('sneaking-around', 'Sneaking Around', JJ),
  aquarium: T('underwater', 'Underwater', 'Cleyton RX'),
  carnival: WITCHES,
  observatory: T('military-base', 'Military Base', JJ),
  volcano: T('army-approaching', 'Army Approaching', JJ),
  theatre: T('dark-forest', 'Dark Forest', 'cynicmusic'),
  skywhale: T('preparing-for-battle', 'Preparing For Battle', JJ),
  // Bosses.
  boss: EPIC,
  queen: T('ancient-evil', 'Ancient Evil Awakens', JJ),
  manorboss: LAIR,
  aquaboss: BATTLE,
  carnivalboss: BATTLE,
  observatoryboss: EPIC,
  volcanoboss: EPIC,
  theatreboss: LAIR,
  skywhaleboss: T('apocalypse', 'Apocalypse', JJ),
};

// The track for a music key ("harbor-night" plays the harbor's), or null for a written song.
export const trackFor = (key) => TRACKS[key] ?? TRACKS[key?.replace(/-night$/, '')] ?? null;
