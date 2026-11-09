// The Mochi's genes: every egg rolls its own look and personality (the Wagashi Sprites, 2026-11-09).
// Nothing here draws: render/wagashi.js turns genes into a look. Rolls are seeded, so the same
// egg always hatches the same Mochi.
//
// Rarity tiers (each gene has its own odds; a Mochi's rarity is its rarest gene):
//   common     everything in the main pools
//   uncommon   two-tone hair (18%), a clover sprout (12%) or a bud (6%), a bold dough (6%)
//   rare       odd-coloured eyes (3%), star pupils (2.5%), a heart sprout (5%), a star or heart
//              cheek mark (2% each), a shiny coat (2%)
//   epic       a blossom sprout (1.5%), a candied coat (1 in 300): glassy gem-coloured hair
//   rare       ...and the Two-Flavour coat (1.5%): the hair split down the middle in two colours
//   epic       ...and the Gold Leaf, Glass Jelly and Sakura Storm coats (1 in 300 each)
//   legendary  the Moonlit, Hanabi and Radiant coats (1 in 2,000 each); Radiant becomes Halo Dawn
//              or Ember Spice with the path the Mochiko takes
//   mythic     the Kohakutou coat (1 in 10,000): crystal candy hair turning through jewel colours
//   mutation   the dark Mutations (1 in 30,000 each): Black Sesame, Brown Sugar, Midnight, Red Plum,
//              Deep Sea

// Hairstyles (render/hair.js MOCHI_HAIR); every one is the Mochi's own.
export const HAIRS = ['mochibun', 'dangotail', 'sakuratails', 'taiyakitail', 'warabiwave', 'kinakopuffs', 'kashiwa', 'loopbraids',
  'sakurawrap', 'dorayaki', 'mitsutails', 'manjucurl', 'chimaki', 'kakigori', 'nejiri', 'yatsuhashi',
  'kagamibun', 'usagibuns', 'sensutail', 'sakuranbo', 'wataame', 'ohagi', 'ringotail', 'karintou', 'koshian', 'pombraids', 'nami', 'kibi', 'anmitsu', 'hishi', 'suama', 'hanabira',
  'kinkan', 'tama', 'wa', 'sasa', 'nebou', 'musubi', 'kuruma', 'tanabata', 'kasa', 'tsurutail', 'koromo', 'hanami', 'momiji', 'kumo', 'hotaru', 'amezaiku',
  'nagare', 'pompon', 'ramen', 'tsubaki', 'mimi', 'futago', 'nejibun', 'sembei', 'shishi', 'mizuame', 'chakin', 'soba', 'onigiri', 'funsui', 'senko', 'tamago'];
// Fringes, rolled apart from the hairstyle (any fringe on any style).
export const FRINGES = ['mochipuff', 'dangoclump', 'warabisweep', 'sakurapetal', 'kagamiblunt', 'monakacrop', 'finfringe', 'loopfringe',
  'mochistraight', 'mochiwisp', 'mochiside', 'mochicurtain', 'mochiheart', 'mochiwave', 'mochidip', 'mochiasym', 'mochibaby', 'mochiflip', 'mochigap', 'mochicurl',
  'mochiswoop', 'mochiknot', 'mochilayer', 'mochichoppy', 'mochiarch', 'mochiup', 'mochifeather', 'mochimess', 'mochiantenna', 'mochisweepnear', 'mochifan', 'mochinotch'];
// Hair colours, named for sweets.
export const HAIR_COLORS = {
  sakura: '#f7a8c0', ume: '#e86f8f', ichigo: '#ff8aa0', momo: '#ffb89a', yuzu: '#ffd75e', mikan: '#ffa64d', kinako: '#d9b27a',
  hojicha: '#a8774e', anko: '#6e3845', goma: '#4a4450', matcha: '#8cc47a', yomogi: '#6fa36a', ramune: '#8fd3f0', soda: '#5fa8e0',
  sumire: '#b49ae8', budo: '#8e6ad0', shiratama: '#f3ece4', milktea: '#d8b8a0', azuki: '#8c4a52', mint: '#9fe0c8',
  kuri: '#b0703a', sakuranbo: '#d8344c', lemon: '#fff08a', kabocha: '#e8913a', yuki: '#f4f4ff', sora: '#a8d8ff', fuji: '#c8a8f0', kuromame: '#2e2a36',
};
// Eye shapes (render/hero.js EYE_LOOK) and colours.
export const EYES = ['mochiround', 'mochidrop', 'mochisleepy', 'mochibean', 'mochisharp', 'mochiwide', 'mochifox', 'mochilash', 'mochiglass', 'mochilazy',
  'mochisnow', 'mochimoon', 'mochicrystal', 'mochirings', 'mochiblank', 'mochigoat', 'mochidiamond', 'mochitiny', 'mochislit', 'mochiupturn', 'mochisad',
  'mochiglam', 'mochiplain', 'mochisquint', 'mochibig', 'mochitall', 'mochidot', 'mochisoft', 'mochiwidecat', 'mochiflat', 'mochiweary', 'mochiclassic'];
export const EYE_COLORS = ['#d04a78', '#a0407a', '#c87a2a', '#d9a030', '#4a9a5a', '#2f8aa0', '#4a7ad0', '#7a4ac0', '#7a4a32', '#4a3a5a', '#3aa08a', '#e0607a', '#ff8a5a', '#5ac0e0', '#9a8a6a', '#c04040'];
// Resting mouths (render/hero.js mouthShapes).
export const MOUTHS = ['mochiw', 'mochidot', 'mochibeam', 'mochifang', 'mochitri', 'mochicrumb', 'mochiblep', 'mochitwofang',
  'mochiu', 'mochismile', 'mochiopen', 'mochio', 'mochipout', 'mochiflat', 'mochiwave', 'mochicat3', 'mochismirk', 'mochiteeth', 'mochigap', 'mochibunny',
  'mochifrown', 'mochitongue', 'mochiv', 'mochicheese', 'mochiside', 'mochisquig', 'mochidrool', 'mochiheartlip', 'mochishark', 'mochiomega', 'mochiyawnish', 'mochimunch'];
export const BROWS = ['mochidash', 'mochiarc', 'mochislope', 'mochibean', 'mochithin', 'mochibold', 'mochifierce', 'mochitwodot', 'mochihigh', 'mochiflat', 'mochicurve', 'mochitaper',
  'mochiwavy', 'mochiblob', 'mochisplit', 'mochilong'];
// Cheek marks over the blush: none (most), kinako freckles, a swirl, dimples; a star or a heart
// under the near eye is rare.
export const CHEEKS = ['freckles', 'swirl', 'dimple'];
// Dough (skin): plain, cream, sakura, kinako, rice; the rare ones lavender and ramune.
// Dough (skin), named for sweets. Common: plain, cream, sakura, kinako, rice, hojicha, yomogi, goma,
// ube, ichigo, caramel. Uncommon (6%), bolder pastels: matcha, ramune, deep ube, deep sakura, yuzu,
// lavender. Rare (1.5%), the prettiest: pearl white, strawberry red, peach, snow (light, never dull).
export const DOUGHS = ['#fff6ee', '#fff0e0', '#ffe8ec', '#f7e4cf', '#f4ede6', '#ecd2b4', '#e4efd4', '#e2dee2', '#ece0f4', '#ffdde2', '#e0b48c'];
export const BOLD_DOUGHS = ['#d8efc0', '#bfe4f8', '#d6c0f0', '#ffc4d4', '#fff0a8', '#ece4fa'];
export const DEEP_DOUGHS = ['#fffefc', '#ffb0b8', '#ffd2bc', '#f2f6ff'];
export const ALL_DOUGHS = [...DOUGHS, ...BOLD_DOUGHS, ...DEEP_DOUGHS];
// Smock colours (the player can dress them in anything later).
export const SMOCKS = ['#ffd6e0', '#ffe2c4', '#fff0b8', '#d8f0c8', '#cfe8f6', '#e2d6f6', '#f6d6ec', '#ffffff'];
// The candied coat's gem colours.
export const CANDY = { ruby: '#e8324f', amber: '#f0a020', jade: '#30b080', sapphire: '#3a6ae0', amethyst: '#9a50e0', rose: '#ff6fa8' };
export const PERSONALITIES = ['playful', 'shy', 'proud', 'sleepy', 'curious', 'bossy', 'gentle', 'showoff', 'clumsy', 'brave', 'grumpy', 'dreamy', 'cheeky', 'timid',
  'bubbly', 'stoic', 'foodie', 'sassy', 'lazy', 'hyper', 'polite', 'mischief', 'clingy', 'loner', 'artsy', 'sporty', 'nosy', 'dramatic', 'cool', 'sweet', 'chatty', 'sneaky'];
// The five stats, and the starting grade (talent) each egg rolls for every one: mostly E to C, an
// A now and then, an S very rarely.
export const STATS = ['run', 'fly', 'power', 'stamina', 'swim'];
export const GRADES = ['E', 'D', 'C', 'B', 'A', 'S'];
const GRADE_ODDS = [30, 30, 22, 12, 5, 1];
// Sweets: each Mochi has one it adores and one it can't stand.
export const SWEETS = ['dango', 'daifuku', 'taiyaki', 'dorayaki', 'warabi mochi', 'sakura mochi', 'kashiwa mochi', 'monaka', 'yokan', 'kakigori', 'manju', 'ohagi',
  'anmitsu', 'imagawayaki', 'kinako mochi', 'mitarashi'];
// Voices: a chirp style and a pitch (the sounds themselves are cut from the sound library).
export const VOICES = ['chirp', 'coo', 'squeak', 'trill', 'peep', 'hum', 'purr', 'boop'];
export const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'mutation'];
// Coats, rarest first, each with its odds (render/wagashi.js draws them). `radiant` shows once a
// Mochiko takes a path: Halo Dawn on the angel path, Ember Spice on the demon one.
// The Mutations, the top tier (1 in 30,000 each): the whole Mochi dark, its eyes glowing:
// Black Sesame (near-black dough, black hair, gold eyes, sesame seeds drifting up), Brown Sugar
// (deep brown dough, caramel hair, amber glass eyes, caramel glints), Midnight (royal-blue dough,
// black hair fading to grape, glowing blue star eyes, little stars twinkling round it), Red Plum
// (rose-red dough, snow-white hair tipped pink, gold heart eyes, plum blossoms drifting) and
// Deep Sea (turquoise dough, navy hair with glowing aqua tips, deep blue eyes, lit bubbles rising).
export const COATS = [
  ['goma', 1 / 30000, 'mutation'], ['kurozato', 1 / 30000, 'mutation'], ['yoru', 1 / 30000, 'mutation'], ['beniume', 1 / 30000, 'mutation'], ['shinkai', 1 / 30000, 'mutation'],
  ['kohakutou', 1 / 10000, 'mythic'],
  ['moonlit', 1 / 2000, 'legendary'], ['hanabi', 1 / 2000, 'legendary'], ['radiant', 1 / 2000, 'legendary'],
  ['candied', 1 / 300, 'epic'], ['goldleaf', 1 / 300, 'epic'], ['glassjelly', 1 / 300, 'epic'], ['sakura', 1 / 300, 'epic'],
  ['twoflavour', 0.015, 'rare'], ['shiny', 0.02, 'rare'],
];

// The life stages: the egg, then the Mochiko (stage 1), then stage 2 on one of two paths: the
// Amamochi (angel; "ama" is both heaven and sweet) or the Karamochi (demon; "kara" is spicy).
// Sweet treats and gentle care lean a Mochiko toward the angel path; spicy treats and rough,
// mischievous play toward the demon one (an even split goes by its personality).
export const STAGES = { egg: 'Egg', mochiko: 'Mochiko', amamochi: 'Amamochi', karamochi: 'Karamochi' };
export const PATHS = { angel: 'amamochi', demon: 'karamochi' };

// A small seeded random (mulberry32).
export function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Rolls a Mochi from an egg's seed. `force` sets any gene outright (a showcase, or later breeding).
export function rollMochi(seed, force = {}) {
  const rnd = seededRandom(seed);
  const pick = (list) => list[Math.floor(rnd() * list.length)];
  const chance = (p) => rnd() < p;
  const colors = Object.keys(HAIR_COLORS);
  const g = {
    seed,
    hair: pick(HAIRS),
    fringe: pick(FRINGES),
    hairColor: pick(colors),
    hairTip: null,
    eyes: pick(EYES),
    eyeColor: pick(EYE_COLORS),
    eyeColor2: null,
    pupil: null,
    mouth: pick(MOUTHS),
    brows: pick(BROWS),
    cheek: null,
    dough: pick(DOUGHS),
    smock: pick(SMOCKS),
    personality: pick(PERSONALITIES),
    talents: {},
    loves: null,
    hates: null,
    voice: null,
    sprout: 'round',
    coat: null,
    candy: null,
    path: null,
  };
  // Every roll below happens whatever came before, so one gene never shifts another's odds.
  const twoTone = chance(0.18);
  const tip = pick(colors);
  const oddEyes = chance(0.03);
  const eye2 = pick(EYE_COLORS);
  const starPupils = chance(0.025);
  const heartPupils = chance(0.015);
  const doughRoll = rnd();
  const bold = pick(BOLD_DOUGHS);
  const deep = pick(DEEP_DOUGHS);
  const leaf = rnd();
  const cheek = rnd();
  const cheekKind = pick(CHEEKS);
  const coat = rnd();
  const gem = pick(Object.keys(CANDY));
  if (twoTone && tip !== g.hairColor) g.hairTip = tip;
  if (oddEyes && eye2 !== g.eyeColor) g.eyeColor2 = eye2;
  if (starPupils) g.pupil = 'star';
  else if (heartPupils) g.pupil = 'heart';
  // Talents, sweets and voice.
  const grade = () => { let v = rnd() * 100; for (let i = 0; i < GRADES.length; i++) { v -= GRADE_ODDS[i]; if (v < 0) return GRADES[i]; } return 'E'; };
  for (const s of STATS) g.talents[s] = grade();
  g.loves = pick(SWEETS);
  g.hates = pick(SWEETS.filter((s) => s !== g.loves));
  g.voice = { style: pick(VOICES), pitch: Math.round((0.8 + rnd() * 0.5) * 20) / 20 };
  if (doughRoll < 0.015) g.dough = deep;
  else if (doughRoll < 0.075) g.dough = bold;
  g.sprout = leaf < 0.015 ? 'blossom' : leaf < 0.065 ? 'heart' : leaf < 0.125 ? 'bud' : leaf < 0.245 ? 'clover' : leaf < 0.45 ? 'ginkgo' : leaf < 0.72 ? 'point' : 'round';
  g.cheek = cheek < 0.02 ? 'star' : cheek < 0.04 ? 'heart' : cheek < 0.4 ? cheekKind : null;
  let acc = 0;
  for (const [name, odds] of COATS) {
    acc += odds;
    if (coat < acc) { g.coat = name; break; }
  }
  if (g.coat === 'candied') g.candy = gem;
  // (A Two-Flavour coat's second colour.)
  if (g.coat === 'twoflavour') g.hairTip = tip !== g.hairColor ? tip : colors[(colors.indexOf(tip) + 7) % colors.length];
  Object.assign(g, force);
  if (g.coat === 'candied' && !g.candy) g.candy = gem;
  // (A Mutation is born perfect: an S in every stat.)
  if (COATS.find(([name]) => name === g.coat)?.[2] === 'mutation') for (const s of STATS) g.talents[s] = 'S';
  g.rarity = rarityOf(g);
  return g;
}

// A Mochi's rarity: its rarest gene.
export function rarityOf(g) {
  const coat = COATS.find(([name]) => name === g.coat);
  if (coat && coat[2] !== 'rare') return coat[2];
  if (g.sprout === 'blossom') return 'epic';
  if (coat || g.eyeColor2 || g.pupil === 'star' || g.pupil === 'heart' || g.sprout === 'heart' || g.cheek === 'star' || g.cheek === 'heart') return 'rare';
  if (DEEP_DOUGHS.includes(g.dough)) return 'rare';
  if (g.hairTip || g.sprout === 'clover' || g.sprout === 'bud' || BOLD_DOUGHS.includes(g.dough)) return 'uncommon';
  return 'common';
}
