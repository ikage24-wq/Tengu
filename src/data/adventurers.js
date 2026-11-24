// The adventurers (2026-11-24, the player: "remove all bots/fake players ... add adventurers npcs, fully
// autonomous, extremely well made with deep ai and learning ai", then "heavy heavy ai build ... make
// them feel super real and realistic npcs that actually matter"). Sixteen named people of the world
// who live, train, fight, learn and grow alongside you, based at the Adventurers' Guild in Coinbridge
// (Guildmaster Halvard). Their minds are world/adventurers/; the plan is the player's doc "Adventurers:
// Cast and Plan".
//
// Each one:
//   rank     'veteran' (Lv 45-50, mentors; never level, grow in skill and stories), 'peer' (start
//            near you, grow at your pace to a soft ceiling a few levels above you), 'rookie' (start
//            below you, grow faster until they reach you)
//   start    { level } fixed, or { rel } levels from yours when you first meet the guild
//   job      their job now (a rookie's `path` is the job line they take as they grow)
//   role     tank, healer, damage, control, support or novice: how they fight in a group
//   home     the town they come from (they visit it now and then; the guild is where they live)
//   traits   0..1 each, the personality every choice is weighed by:
//              bravery   risk they'll take (charging in, a boss above them)
//              drive     how hard they push their goals (the grind, training)
//              warmth    how much they seek company and care for others
//              greed     how much gold and loot weigh with them
//              curiosity how much new places and things pull them (and how they explore choices)
//              patience  how well they bear failure and plan (and how fast they learn from it)
//              pride     how much they care to be seen winning, and about rivals
//              stamina   how slowly they tire
//   hobby    their life skill when not adventuring (fishing, cooking, crafting, gathering, drawing)
//   friend / rival   other adventurers' ids (the player is 'you')
//   wall     a veteran's boss they have never beaten (the others take the next boss at their level)
//   dream    what they're ultimately working toward (their story chain is about it)
//   voice    how they talk: tone words their lines are picked by
//   look     the player-character look (render/hero.js), with a signature hairstyle each
//            (render/hair.js ADVENTURER_HAIR)

export const ADVENTURERS = [
  {
    id: 'bram', name: 'Bram', rank: 'veteran', start: { level: 48 }, job: 'stormwall', role: 'tank', home: 'crag',
    traits: { bravery: 0.9, drive: 0.6, warmth: 0.75, greed: 0.2, curiosity: 0.3, patience: 0.85, pride: 0.35, stamina: 0.9 },
    hobby: 'cooking', friend: 'maribel', rival: null, wall: 'whalestorm',
    dream: 'See every rookie he trains come home safe, and finally stand his ground against the Sulk.',
    voice: ['gruff', 'kind', 'brief'],
    quirk: 'Grumbles about everything, then quietly fixes it. Cooks enormous stews for whoever is around.',
    look: { hairStyle: 'bramcrop', hairColor: '#5a3a2a', skinTone: '#a8704a', eyeColor: '#c8862a', eyeStyle: 'slant', face: 'cool' },
  },
  {
    id: 'maribel', name: 'Maribel', rank: 'veteran', start: { level: 47 }, job: 'tidecaller', role: 'healer', home: 'grove',
    traits: { bravery: 0.45, drive: 0.5, warmth: 0.95, greed: 0.15, curiosity: 0.5, patience: 0.9, pride: 0.2, stamina: 0.6 },
    hobby: 'cooking', friend: 'bram', rival: null, wall: 'whaledream',
    dream: 'Open a little tea house at the guild where no adventurer ever goes hungry or alone.',
    voice: ['warm', 'worried', 'motherly'],
    quirk: 'Always has tea brewing and a spare potion. Fusses over anyone who comes back hurt.',
    look: { hairStyle: 'teabraid', hairColor: '#cbbbe8', skinTone: '#f0c4a0', eyeColor: '#3aa8a0', eyeStyle: 'droopy', face: 'smile' },
  },
  {
    id: 'vesper', name: 'Vesper', rank: 'veteran', start: { level: 50 }, job: 'eclipse', role: 'damage', home: 'coinbridge',
    traits: { bravery: 0.8, drive: 0.95, warmth: 0.3, greed: 0.35, curiosity: 0.45, patience: 0.7, pride: 0.9, stamina: 0.75 },
    hobby: 'crafting', friend: 'maribel', rival: 'rory', wall: 'selene',
    dream: 'Beat Selene, the Moon Valkyrie, the one fight she has never won.',
    voice: ['cool', 'precise', 'dry'],
    quirk: 'Keeps a notebook of every boss she has fought, with notes on every attack.',
    look: { hairStyle: 'vesperbob', hairColor: '#2a2440', skinTone: '#fff4ee', eyeColor: '#8a4ad8', eyeStyle: 'sly', face: 'cool' },
  },
  {
    id: 'rory', name: 'Rory', rank: 'veteran', start: { level: 45 }, job: 'phoenix', role: 'damage', home: 'harbor',
    traits: { bravery: 0.85, drive: 0.55, warmth: 0.7, greed: 0.45, curiosity: 0.6, patience: 0.35, pride: 0.95, stamina: 0.7 },
    hobby: 'fishing', friend: 'bram', rival: 'vesper', wall: 'gale',
    dream: 'Have the biggest legend in the guild, and beat Captain Gale before Vesper beats Selene.',
    voice: ['loud', 'boastful', 'cheerful'],
    quirk: 'Tells tall tales that grow every time. Secretly practises his finishers when nobody is looking.',
    look: { hairStyle: 'rorycurls', hairColor: '#e8603a', skinTone: '#c98e66', eyeColor: '#ff8a1f', eyeStyle: 'cheeky', face: 'proud' },
  },
  {
    id: 'jett', name: 'Jett', rank: 'peer', start: { rel: 0 }, job: 'tempest', role: 'damage', home: 'crag',
    traits: { bravery: 0.98, drive: 0.7, warmth: 0.6, greed: 0.3, curiosity: 0.7, patience: 0.15, pride: 0.6, stamina: 0.85 },
    hobby: 'gathering', friend: 'lyra', rival: 'arlo', wall: null,
    dream: 'Be the fastest adventurer alive: first into every fight, first to every boss.',
    voice: ['excited', 'reckless', 'friendly'],
    quirk: 'Charges in before the plan is finished. Lyra heals him more than anyone else.',
    look: { hairStyle: 'jettwolf', hairColor: '#eef0f8', skinTone: '#8a5a3c', eyeColor: '#d83a4a', eyeStyle: 'slant', face: 'excited' },
  },
  {
    id: 'lyra', name: 'Lyra', rank: 'peer', start: { rel: 0 }, job: 'songbird', role: 'healer', home: 'sprout',
    traits: { bravery: 0.5, drive: 0.55, warmth: 0.9, greed: 0.2, curiosity: 0.6, patience: 0.75, pride: 0.3, stamina: 0.65 },
    hobby: 'gathering', friend: 'jett', rival: null, wall: null,
    dream: 'Write a song for every adventurer in the guild, and sing them all at the festival.',
    voice: ['cheerful', 'musical', 'kind'],
    quirk: 'Hums while she works and sings when she heals. Worries about Jett out loud.',
    look: { hairStyle: 'lyrawave', hairColor: '#ffd27a', skinTone: '#fbd9bf', eyeColor: '#4ab06a', eyeStyle: 'sparkle', face: 'giggle' },
  },
  {
    id: 'ottilie', name: 'Ottilie', rank: 'peer', start: { rel: 0 }, job: 'silkweaver', role: 'control', home: 'grove',
    traits: { bravery: 0.3, drive: 0.75, warmth: 0.55, greed: 0.25, curiosity: 0.9, patience: 0.95, pride: 0.25, stamina: 0.5 },
    hobby: 'crafting', friend: 'gideon', rival: null, wall: null,
    dream: 'Write the guild\'s field guide to every monster, with a way to beat each one.',
    voice: ['shy', 'thoughtful', 'quiet'],
    quirk: 'Plans every fight and reads everything. Hates crowds; at her best one on one.',
    look: { hairStyle: 'ottiebun', hairColor: '#6a5aa8', skinTone: '#fff0e6', eyeColor: '#6a88b8', eyeStyle: 'halflid', face: 'shy' },
  },
  {
    id: 'gideon', name: 'Gideon', rank: 'peer', start: { rel: 0 }, job: 'maelstrom', role: 'damage', home: 'coinbridge',
    traits: { bravery: 0.6, drive: 0.65, warmth: 0.45, greed: 0.95, curiosity: 0.55, patience: 0.5, pride: 0.6, stamina: 0.6 },
    hobby: 'fishing', friend: 'ottilie', rival: 'scarlett', wall: null,
    dream: 'Own the finest shop on the Coinbridge bridge, stocked with treasure he found himself.',
    voice: ['smooth', 'scheming', 'funny'],
    quirk: 'Counts loot mid-fight and haggles over everything, even with friends.',
    look: { hairStyle: 'gideonslick', hairColor: '#2e5a4e', skinTone: '#5c3a28', eyeColor: '#e0b030', eyeStyle: 'sly', face: 'sassy' },
  },
  {
    id: 'arlo', name: 'Arlo', rank: 'peer', start: { rel: -2 }, job: 'stormwall', role: 'tank', home: 'crag',
    traits: { bravery: 0.85, drive: 0.9, warmth: 0.7, greed: 0.2, curiosity: 0.4, patience: 0.6, pride: 0.5, stamina: 0.95 },
    hobby: 'cooking', friend: 'bram', rival: 'jett', wall: null,
    dream: 'Become a tank Bram would trust to hold the line in his place.',
    voice: ['earnest', 'polite', 'determined'],
    quirk: 'Trains until he drops. Copies everything Bram does, including the grumbling.',
    look: { hairStyle: 'arlocrop', hairColor: '#c87a3a', skinTone: '#e7b48f', eyeColor: '#7a4a2b', eyeStyle: 'bean', face: 'determined' },
  },
  {
    id: 'dulcie', name: 'Dulcie', rank: 'peer', start: { rel: -1 }, job: 'moonmoth', role: 'damage', home: 'lagoon',
    traits: { bravery: 0.55, drive: 0.2, warmth: 0.6, greed: 0.3, curiosity: 0.5, patience: 0.7, pride: 0.15, stamina: 0.25 },
    hobby: 'fishing', friend: 'delphine', rival: null, wall: null,
    dream: 'Find the comfiest napping spot in the whole world, and maybe a legendary fish while she\'s there.',
    voice: ['sleepy', 'dreamy', 'gentle'],
    quirk: 'Naps anywhere, wakes up and wins the fight, then naps again.',
    look: { hairStyle: 'dulciefluff', hairColor: '#f2c8d8', skinTone: '#fff0e6', eyeColor: '#9a7ad8', eyeStyle: 'halflid', face: 'sleepy' },
  },
  {
    id: 'scarlett', name: 'Scarlett', rank: 'peer', start: { rel: 1 }, job: 'sunfeather', role: 'damage', home: 'harbor',
    traits: { bravery: 0.75, drive: 0.95, warmth: 0.4, greed: 0.4, curiosity: 0.45, patience: 0.35, pride: 0.95, stamina: 0.8 },
    hobby: 'gathering', friend: null, rival: 'you', wall: null,
    dream: 'Be the first in the guild to reach every level, and beat you to every boss.',
    voice: ['competitive', 'teasing', 'confident'],
    quirk: 'Races you to everything. Respects you more each time you win, though she won\'t say it.',
    look: { hairStyle: 'scarlettail', hairColor: '#e04a5a', skinTone: '#e7b48f', eyeColor: '#e8c030', eyeStyle: 'cat', face: 'determined' },
  },
  {
    id: 'delphine', name: 'Delphine', rank: 'peer', start: { rel: 0 }, job: 'tidemage', role: 'support', home: 'lagoon',
    traits: { bravery: 0.4, drive: 0.45, warmth: 0.9, greed: 0.2, curiosity: 0.75, patience: 0.85, pride: 0.2, stamina: 0.6 },
    hobby: 'fishing', friend: 'dulcie', rival: null, wall: null,
    dream: 'Catch every fish in the world and fill the Lantern Lagoon aquarium.',
    voice: ['kind', 'chatty', 'fishy puns'],
    quirk: 'Brings snacks to every run and talks about fish to anyone who stands still.',
    look: { hairStyle: 'delphwave', hairColor: '#5aa8c8', skinTone: '#8a5a3c', eyeColor: '#3ac8c0', eyeStyle: 'jewel', face: 'smile' },
  },
  {
    id: 'milo', name: 'Milo', rank: 'rookie', start: { rel: -5 }, job: 'novice', path: 'tidemage', role: 'novice', home: 'sprout',
    traits: { bravery: 0.15, drive: 0.6, warmth: 0.8, greed: 0.2, curiosity: 0.6, patience: 0.6, pride: 0.1, stamina: 0.5 },
    hobby: 'gathering', friend: 'hattie', rival: null, wall: null,
    dream: 'Stop being scared, and help someone the way the guild helped him.',
    voice: ['nervous', 'apologetic', 'sweet'],
    quirk: 'Apologises to monsters. Braver than he thinks when a friend is in trouble.',
    look: { hairStyle: 'milofluff', hairColor: '#a8c8e8', skinTone: '#fff4ee', eyeColor: '#6a7a8a', eyeStyle: 'droopy', face: 'nervous' },
  },
  {
    id: 'hattie', name: 'Hattie', rank: 'rookie', start: { rel: -4 }, job: 'novice', path: 'warrior', role: 'novice', home: 'sprout',
    traits: { bravery: 0.95, drive: 0.7, warmth: 0.75, greed: 0.3, curiosity: 0.65, patience: 0.2, pride: 0.55, stamina: 0.85 },
    hobby: 'cooking', friend: 'milo', rival: null, wall: null,
    dream: 'Become a hero songs are written about (she has asked Lyra).',
    voice: ['loud', 'brave', 'clumsy'],
    quirk: 'Trips into fights and wins them anyway. Protects Milo fiercely.',
    look: { hairStyle: 'hattiepuffs', hairColor: '#f08a3a', skinTone: '#c98e66', eyeColor: '#4ab06a', eyeStyle: 'star', face: 'excited' },
  },
  {
    id: 'thea', name: 'Thea', rank: 'rookie', start: { rel: -5 }, job: 'novice', path: 'sunfeather', role: 'novice', home: 'grove',
    traits: { bravery: 0.35, drive: 0.4, warmth: 0.6, greed: 0.15, curiosity: 0.95, patience: 0.7, pride: 0.3, stamina: 0.55 },
    hobby: 'drawing', friend: null, rival: 'fennick', wall: null,
    dream: 'Fill a sketchbook with every monster and every place in the world.',
    voice: ['dreamy', 'artistic', 'wondering'],
    quirk: 'Stops mid-fight to sketch a monster. Her drawings hang in the guild hall.',
    look: { hairStyle: 'theabun', hairColor: '#a8e0b0', skinTone: '#f0c4a0', eyeColor: '#f07aa8', eyeStyle: 'doll', face: 'playful' },
  },
  {
    id: 'fennick', name: 'Fennick', rank: 'rookie', start: { rel: -4 }, job: 'novice', path: 'moonmoth', role: 'novice', home: 'coinbridge',
    traits: { bravery: 0.6, drive: 0.5, warmth: 0.45, greed: 0.8, curiosity: 0.8, patience: 0.3, pride: 0.6, stamina: 0.7 },
    hobby: 'gathering', friend: null, rival: 'thea', wall: null,
    dream: 'Pull off the greatest heist in Coinbridge history (a legal one, Halvard insists).',
    voice: ['sly', 'cheeky', 'playful'],
    quirk: 'Pockets anything shiny and teases Thea about her drawings. Gives most of it back.',
    look: { hairStyle: 'fennshag', hairColor: '#4a3a5a', skinTone: '#a8704a', eyeColor: '#e0a020', eyeStyle: 'cheeky', face: 'playful' },
  },
];

export const ADVENTURER_BY_ID = Object.fromEntries(ADVENTURERS.map((a) => [a.id, a]));
// Their job families (the armour and weapons they wear).
export const FAMILY_OF = { stormwall: 'warrior', tempest: 'warrior', warrior: 'warrior', tidecaller: 'mage', maelstrom: 'mage', tidemage: 'mage', eclipse: 'thief', silkweaver: 'thief', moonmoth: 'thief', phoenix: 'archer', songbird: 'archer', sunfeather: 'archer', novice: 'warrior' };
export const WEAPON_OF = { stormwall: 'sword', tempest: 'sword', warrior: 'sword', tidecaller: 'staff', maelstrom: 'staff', tidemage: 'staff', eclipse: 'dagger', silkweaver: 'dagger', moonmoth: 'dagger', phoenix: 'crossbow', songbird: 'bow', sunfeather: 'bow', novice: 'sword' };
// A rookie's job line as they grow: the first job at 5, its branch at 30 (picked by their traits).
export const BRANCHES = { warrior: ['stormwall', 'tempest'], tidemage: ['tidecaller', 'maelstrom'], moonmoth: ['eclipse', 'silkweaver'], sunfeather: ['songbird', 'phoenix'] };
