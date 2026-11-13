// The Mochi wardrobe (the player's call, 2026-11-13): a broad wardrobe for the racers - everyday
// clothes, play clothes, festival wear - in pieces rather than whole costumes, so a top from here
// goes with a bottom from there. Dresses are one piece and fill both. Accessories sit on top of
// whatever else is worn.
//
// Every piece has a tier, and the tiers are plain to ornate: a beginner wears simple cloth, a mid
// tier gets trim and a pattern, an end tier is layered and detailed, and an elite has gold, gems
// and fine work. (The six dress-up costumes in data/mochi-dress.js are untouched: those are the
// race prizes, and they stay whole costumes.)
//
// What a Mochi is wearing is `rec.wear`: { top, bottom, dress, acc }, any of them missing. A dress
// wins over a top and bottom. Nothing worn at all is the plain smock it was born in.
// (How they are come by is for later: the player will plan that.)

export const TIERS = ['beginner', 'mid', 'end', 'elite'];
export const TIER_NAMES = { beginner: 'Beginner', mid: 'Middling', end: 'Fine', elite: 'Elite' };

// ---------- Tops ----------
export const TOPS = {
  // Beginner: plain cloth, one trim, worn-in.
  tee: { name: 'Plain Tee', tier: 'beginner' },
  vest: { name: 'Button Vest', tier: 'beginner' },
  stripes: { name: 'Striped Shirt', tier: 'beginner' },
  smock: { name: 'Work Smock', tier: 'beginner' },
  tank: { name: 'Summer Tank', tier: 'beginner' },
  cardi: { name: 'Soft Cardigan', tier: 'beginner' },
  hoodie: { name: 'Pocket Hoodie', tier: 'beginner' },
  gym: { name: 'Gym Shirt', tier: 'beginner' },
  apprentice: { name: 'Apprentice Tunic', tier: 'beginner' },
  jerkin: { name: 'Leather Jerkin', tier: 'beginner' },
  // Middling: trim, patterns, a proper collar - school, town and the seasons.
  sailor: { name: 'Sailor Blouse', tier: 'mid' },
  blazer: { name: 'School Blazer', tier: 'mid' },
  blouse: { name: 'Ribbon Blouse', tier: 'mid' },
  knit: { name: 'Cable Knit', tier: 'mid' },
  happi: { name: 'Festival Happi', tier: 'mid' },
  raincoat: { name: 'Toggle Raincoat', tier: 'mid' },
  gingham: { name: 'Gingham Shirt', tier: 'mid' },
  poncho: { name: 'Autumn Poncho', tier: 'mid' },
  ranger: { name: 'Ranger Jerkin', tier: 'mid' },
  bard: { name: 'Bard Doublet', tier: 'mid' },
  // Fine: layers, lacing, tailoring.
  doublet: { name: 'Laced Doublet', tier: 'end' },
  corset: { name: 'Corset Vest', tier: 'end' },
  kimono: { name: 'Layered Kimono', tier: 'end' },
  jack: { name: 'Studded Jack', tier: 'end' },
  frock: { name: 'Frock Coat', tier: 'end' },
  robe: { name: 'Starwork Robe', tier: 'end' },
  tailcoat: { name: 'Tailcoat', tier: 'end' },
  bolero: { name: 'Velvet Bolero', tier: 'end' },
  paladin: { name: 'Paladin Plate', tier: 'end' },
  necro: { name: 'Necromancer Coat', tier: 'end' },
  // Elite: gold, gems and fine work.
  cuirass: { name: 'Gilded Cuirass', tier: 'elite' },
  mantle: { name: 'Royal Mantle', tier: 'elite' },
  starlit: { name: 'Starlit Bodice', tier: 'elite' },
  haori: { name: 'Phoenix Haori', tier: 'elite' },
  moonrobe: { name: 'Moon Robe', tier: 'elite' },
  dragon: { name: 'Dragonscale Plate', tier: 'elite' },
  crystal: { name: 'Crystal Corset', tier: 'elite' },
  seraph: { name: 'Seraph Vestment', tier: 'elite' },
  archmage: { name: 'Archmage Mantle', tier: 'elite' },
  valkyrie: { name: 'Valkyrie Cuirass', tier: 'elite' },
};
// ---------- Bottoms ----------
export const BOTTOMS = {
  shorts: { name: 'Cotton Shorts', tier: 'beginner' },
  skirt: { name: 'Pleated Skirt', tier: 'beginner' },
  trousers: { name: 'Roll-up Trousers', tier: 'beginner' },
  bloomers: { name: 'Frill Bloomers', tier: 'beginner' },
  dungas: { name: 'Patch Dungarees', tier: 'beginner' },
  joggers: { name: 'Track Joggers', tier: 'beginner' },
  capris: { name: 'Cropped Capris', tier: 'beginner' },
  wrap: { name: 'Wrap Cloth', tier: 'beginner' },
  travelskirt: { name: "Traveller's Skirt", tier: 'beginner' },
  legwraps: { name: 'Cloth Leg Wraps', tier: 'beginner' },
  tartan: { name: 'Tartan Pleats', tier: 'mid' },
  culottes: { name: 'Wide Culottes', tier: 'mid' },
  overskirt: { name: 'Skirt and Leggings', tier: 'mid' },
  hakama: { name: 'Short Hakama', tier: 'mid' },
  cords: { name: 'Corduroys', tier: 'mid' },
  puffshorts: { name: 'Puff Shorts', tier: 'mid' },
  tiers: { name: 'Tiered Ruffles', tier: 'mid' },
  snowpants: { name: 'Snow Trousers', tier: 'mid' },
  scoutpants: { name: 'Scout Trousers', tier: 'mid' },
  petalskirt: { name: 'Petal Fairy Skirt', tier: 'mid' },
  layers: { name: 'Layered Skirt', tier: 'end' },
  breeches: { name: 'Buckled Breeches', tier: 'end' },
  longhakama: { name: 'Long Hakama', tier: 'end' },
  bustle: { name: 'Bustle Skirt', tier: 'end' },
  petticoat: { name: 'Lace Petticoat', tier: 'end' },
  tassets: { name: 'Leather Tassets', tier: 'end' },
  pinstripe: { name: 'Pinstripe Trousers', tier: 'end' },
  velvet: { name: 'Velvet Skirt', tier: 'end' },
  greaves: { name: 'Knight Greaves', tier: 'end' },
  shadowskirt: { name: 'Shadow Weave Skirt', tier: 'end' },
  goldskirt: { name: 'Gilded Skirt', tier: 'elite' },
  train: { name: 'Star Train', tier: 'elite' },
  dragontassets: { name: 'Dragon Tassets', tier: 'elite' },
  aurora: { name: 'Aurora Layers', tier: 'elite' },
  jewelhakama: { name: 'Jewelled Hakama', tier: 'elite' },
  plume: { name: 'Plume Skirt', tier: 'elite' },
  comet: { name: 'Comet Trousers', tier: 'elite' },
  glacier: { name: 'Glacier Skirt', tier: 'elite' },
  runegreaves: { name: 'Rune Greaves', tier: 'elite' },
  faeskirt: { name: 'Faewing Skirt', tier: 'elite' },
};
// ---------- Dresses (one piece, top and bottom together) ----------
export const DRESSES = {
  sundress: { name: 'Sundress', tier: 'beginner' },
  pinafore: { name: 'Pinafore', tier: 'beginner' },
  nightie: { name: 'Night Shift', tier: 'beginner' },
  jumper: { name: 'Jumper Dress', tier: 'beginner' },
  smockdress: { name: 'Smock Dress', tier: 'beginner' },
  cottonyukata: { name: 'Cotton Yukata', tier: 'beginner' },
  acolyte: { name: 'Acolyte Robe', tier: 'beginner' },
  schooldress: { name: 'Sailor Dress', tier: 'mid' },
  ginghamdress: { name: 'Gingham Day Dress', tier: 'mid' },
  yukata: { name: 'Festival Yukata', tier: 'mid' },
  cocoa: { name: 'Cocoa Knit Dress', tier: 'mid' },
  cafe: { name: 'Cafe Apron Dress', tier: 'mid' },
  petal: { name: 'Petal Dress', tier: 'mid' },
  druid: { name: 'Druid Dress', tier: 'mid' },
  ballgown: { name: 'Ball Gown', tier: 'end' },
  furisode: { name: 'Furisode', tier: 'end' },
  lacegown: { name: 'Lace Gown', tier: 'end' },
  witch: { name: "Witch's Dress", tier: 'end' },
  princess: { name: 'Princess Dress', tier: 'end' },
  swan: { name: 'Swan Dress', tier: 'end' },
  elfgown: { name: 'Elven Gown', tier: 'end' },
  coronation: { name: 'Coronation Gown', tier: 'elite' },
  galaxy: { name: 'Galaxy Gown', tier: 'elite' },
  phoenixfuri: { name: 'Phoenix Furisode', tier: 'elite' },
  empress: { name: 'Sakura Empress', tier: 'elite' },
  abyss: { name: 'Abyss Gown', tier: 'elite' },
  celestial: { name: 'Celestial Gown', tier: 'elite' },
  demonqueen: { name: 'Demon Queen Gown', tier: 'elite' },
};
// ---------- Accessories (worn over whatever else) ----------
export const ACCESSORIES = {
  scarf: { name: 'Knit Scarf', tier: 'beginner', slot: 'neck' },
  hairbow: { name: 'Hair Bow', tier: 'beginner', slot: 'head' },
  satchel: { name: 'Satchel', tier: 'beginner', slot: 'back' },
  bands: { name: 'Wrist Bands', tier: 'beginner', slot: 'hands' },
  cap: { name: 'Cloth Cap', tier: 'beginner', slot: 'head' },
  pouch: { name: 'Herb Pouch', tier: 'beginner', slot: 'back' },
  beret: { name: 'Beret', tier: 'mid', slot: 'head' },
  capelet: { name: 'Wool Capelet', tier: 'mid', slot: 'neck' },
  flowerpin: { name: 'Flower Pin', tier: 'mid', slot: 'head' },
  mittens: { name: 'Mittens', tier: 'mid', slot: 'hands' },
  drum: { name: 'Festival Drum', tier: 'mid', slot: 'back' },
  hood: { name: 'Travel Hood', tier: 'mid', slot: 'head' },
  circlet: { name: 'Silver Circlet', tier: 'end', slot: 'head' },
  feathercape: { name: 'Feather Cape', tier: 'end', slot: 'back' },
  gloves: { name: 'Long Gloves', tier: 'end', slot: 'hands' },
  tome: { name: 'Spell Tome', tier: 'end', slot: 'back' },
  veil: { name: 'Lace Veil', tier: 'end', slot: 'head' },
  horns: { name: 'Imp Horns', tier: 'end', slot: 'head' },
  crown: { name: 'Gold Crown', tier: 'elite', slot: 'head' },
  halo: { name: 'Halo Ring', tier: 'elite', slot: 'head' },
  wings: { name: 'Aurora Wings', tier: 'elite', slot: 'back' },
  gauntlets: { name: 'Gilded Gauntlets', tier: 'elite', slot: 'hands' },
  starbanner: { name: 'Star Banner', tier: 'elite', slot: 'back' },
  dragonhorns: { name: 'Dragon Horns', tier: 'elite', slot: 'head' },
};
export const WARDROBE = { top: TOPS, bottom: BOTTOMS, dress: DRESSES, acc: ACCESSORIES };
// Everything of a tier, as [kind, id, piece].
export const piecesOfTier = (tier) => Object.entries(WARDROBE).flatMap(([kind, set]) => Object.entries(set).filter(([, p]) => p.tier === tier).map(([id, p]) => [kind, id, p]));
// What a Mochi is wearing, as the one key the drawing asks for. Nothing worn gives null, and the
// plain smock stands.
export function wearKey(wear) {
  if (!wear) return null;
  const parts = [];
  if (wear.dress && DRESSES[wear.dress]) parts.push(`d:${wear.dress}`);
  else {
    if (wear.top && TOPS[wear.top]) parts.push(`t:${wear.top}`);
    if (wear.bottom && BOTTOMS[wear.bottom]) parts.push(`b:${wear.bottom}`);
  }
  if (wear.acc && ACCESSORIES[wear.acc]) parts.push(`a:${wear.acc}`);
  return parts.length ? `wear|${parts.join('|')}` : null;
}
// The pieces a key names, back as { top, bottom, dress, acc }.
export function wearOf(key) {
  if (typeof key !== 'string' || !key.startsWith('wear|')) return null;
  const out = {};
  for (const part of key.slice(5).split('|')) {
    const [k, id] = part.split(':');
    if (k === 't') out.top = id;
    else if (k === 'b') out.bottom = id;
    else if (k === 'd') out.dress = id;
    else if (k === 'a') out.acc = id;
  }
  return out;
}
export const isWearKey = (key) => typeof key === 'string' && key.startsWith('wear|');

// ---------- Dressing a Mochi for its level ----------
// What a racer of this standing wears: a beginner is in plain cloth, and the better it gets the
// finer it is dressed, so you can see what you are up against from the start line. `points` is a
// Mochi's stat points (data/mochi-genes.js), which is what its level is counted from.
export const tierForPoints = (points) => (points < 350 ? 'beginner' : points < 800 ? 'mid' : points < 1500 ? 'end' : 'elite');
// How often a Mochi of each tier wears something over its clothes.
const ACC_CHANCE = { beginner: 0.2, mid: 0.35, end: 0.55, elite: 0.75 };
// A set from `tier`, picked by a seed so the same Mochi is always dressed the same way: a dress
// now and then, a top and a bottom the rest of the time, and sometimes an accessory over it.
export function wearFor(seed, tier) {
  // (A small deterministic shuffle of the seed, so the three picks do not move together.)
  const at = (i) => {
    const x = Math.sin((seed + 1) * 127.1 + i * 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  const of = (set, i) => {
    const ids = Object.keys(set).filter((id) => set[id].tier === tier);
    return ids.length ? ids[Math.floor(at(i) * ids.length)] : null;
  };
  const wear = at(0) < 0.3 ? { dress: of(DRESSES, 1) } : { top: of(TOPS, 1), bottom: of(BOTTOMS, 2) };
  if (at(3) < (ACC_CHANCE[tier] ?? 0.3)) wear.acc = of(ACCESSORIES, 4);
  return wear;
}
