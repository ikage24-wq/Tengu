// The Mochi wardrobe (the player's call, 2026-11-13): a broad wardrobe for the racers - everyday
// clothes, play clothes, festival wear - in pieces rather than whole costumes, so a top from here
// goes with a bottom from there. Dresses are one piece and fill both. Everything else sits on top
// of whatever is worn underneath.
//
// Every piece has a tier, and the tiers are plain to ornate: a beginner wears simple cloth, a mid
// tier gets trim and a pattern, an end tier is layered and detailed, and an elite has gold, gems
// and fine work. (The six dress-up costumes in data/mochi-dress.js are untouched: those are the
// race prizes, and they stay whole costumes.)
//
// What a Mochi is wearing is `rec.wear`, a piece in any of nine slots and none of them required
// (the player's call, 2026-11-14 - it was one accessory slot before, and old sets still dress):
//
//   hat     on the head        top      the upper half       shoes   instead of the clothes' own
//   eyes    specs, a visor     bottom   the lower half       over    scarves, capes, packs
//   face    paint, a mask      dress    both halves at once  hands   mittens, gloves, gauntlets
//
// A dress wins over a top and a bottom; shoes win over whatever the clothes came with; nothing
// worn at all is the plain smock it was born in. They are bought at the garden's clothes stall
// (world/garden-life.js) and drawn by render/jobgear/wardrobe.js.

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
// ---------- Hats (and anything else worn on the head) ----------
export const HATS = {
  hairbow: { name: 'Hair Bow', tier: 'beginner' },
  cap: { name: 'Cloth Cap', tier: 'beginner' },
  beret: { name: 'Beret', tier: 'mid' },
  flowerpin: { name: 'Flower Pin', tier: 'mid' },
  hood: { name: 'Travel Hood', tier: 'mid' },
  circlet: { name: 'Silver Circlet', tier: 'end' },
  veil: { name: 'Lace Veil', tier: 'end' },
  horns: { name: 'Imp Horns', tier: 'end' },
  crown: { name: 'Gold Crown', tier: 'elite' },
  halo: { name: 'Halo Ring', tier: 'elite' },
  dragonhorns: { name: 'Dragon Horns', tier: 'elite' },
};
// ---------- Over the eyes ----------
export const EYEWEAR = {
  specs: { name: 'Round Specs', tier: 'beginner' },
  goggles: { name: 'Work Goggles', tier: 'beginner' },
  shades: { name: 'Sun Shades', tier: 'mid' },
  monocle: { name: 'Monocle', tier: 'mid' },
  visor: { name: 'Rune Visor', tier: 'end' },
  eyepatch: { name: 'Star Eyepatch', tier: 'end' },
  starshades: { name: 'Starlight Shades', tier: 'elite' },
  oracle: { name: 'Oracle Eye', tier: 'elite' },
};
// ---------- On the face ----------
export const FACEWEAR = {
  plaster: { name: 'Nose Plaster', tier: 'beginner' },
  whiskers: { name: 'Painted Whiskers', tier: 'beginner' },
  kerchief: { name: 'Mouth Kerchief', tier: 'mid' },
  warpaint: { name: 'Race Day Paint', tier: 'mid' },
  kitsune: { name: 'Kitsune Mask', tier: 'end' },
  lacemask: { name: 'Lace Masquerade', tier: 'end' },
  oni: { name: 'Oni Mask', tier: 'elite' },
  starmark: { name: 'Starlight Markings', tier: 'elite' },
};
// ---------- Shoes (worn instead of whatever the clothes came with) ----------
export const SHOES = {
  sandals: { name: 'Straw Sandals', tier: 'beginner' },
  plimsolls: { name: 'Canvas Plimsolls', tier: 'beginner' },
  clogs: { name: 'Wooden Clogs', tier: 'beginner' },
  geta: { name: 'Festival Geta', tier: 'mid' },
  runners: { name: 'Track Runners', tier: 'mid' },
  buckles: { name: 'Buckle Shoes', tier: 'mid' },
  ridingboots: { name: 'Riding Boots', tier: 'end' },
  maryjanes: { name: 'Lace Mary Janes', tier: 'end' },
  plateboots: { name: 'Plated Boots', tier: 'end' },
  goldsandals: { name: 'Gilded Sandals', tier: 'elite' },
  auroraboots: { name: 'Aurora Boots', tier: 'elite' },
  crystalheels: { name: 'Crystal Heels', tier: 'elite' },
};
// ---------- Over the shoulders (scarves, capes, packs) ----------
export const OVER = {
  scarf: { name: 'Knit Scarf', tier: 'beginner' },
  satchel: { name: 'Satchel', tier: 'beginner' },
  pouch: { name: 'Herb Pouch', tier: 'beginner' },
  capelet: { name: 'Wool Capelet', tier: 'mid' },
  drum: { name: 'Festival Drum', tier: 'mid' },
  feathercape: { name: 'Feather Cape', tier: 'end' },
  tome: { name: 'Spell Tome', tier: 'end' },
  wings: { name: 'Aurora Wings', tier: 'elite' },
  starbanner: { name: 'Star Banner', tier: 'elite' },
};
// ---------- On the paws ----------
export const HANDWEAR = {
  bands: { name: 'Wrist Bands', tier: 'beginner' },
  mittens: { name: 'Mittens', tier: 'mid' },
  gloves: { name: 'Long Gloves', tier: 'end' },
  gauntlets: { name: 'Gilded Gauntlets', tier: 'elite' },
};
// ---------- A worn set ----------
// The nine slots, in the order they are read and drawn. A dress fills the top and the bottom at
// once; shoes are worn instead of whatever the clothes came with; the rest sit over everything.
export const SLOTS = ['hat', 'eyes', 'face', 'top', 'bottom', 'dress', 'shoes', 'over', 'hands'];
export const SLOT_NAMES = { hat: 'Hat', eyes: 'Eyes', face: 'Face', top: 'Top', bottom: 'Bottom', dress: 'Dress', shoes: 'Shoes', over: 'Over', hands: 'Paws' };
// Every slot's pieces, by slot.
export const SETS = { hat: HATS, eyes: EYEWEAR, face: FACEWEAR, top: TOPS, bottom: BOTTOMS, dress: DRESSES, shoes: SHOES, over: OVER, hands: HANDWEAR };
// The letter each slot is written as in a worn key, kept short because every Mochi carries one.
const CODE = { hat: 'h', eyes: 'e', face: 'f', top: 't', bottom: 'b', dress: 'd', shoes: 's', over: 'o', hands: 'g' };
const SLOT_OF_CODE = Object.fromEntries(Object.entries(CODE).map(([slot, c]) => [c, slot]));
// The piece with this id, whichever slot it belongs to, and the slot it goes in.
export const pieceOf = (id) => SLOTS.reduce((hit, slot) => hit ?? SETS[slot][id] ?? null, null);
export const kindOf = (id) => SLOTS.find((slot) => SETS[slot][id]) ?? null;

// A worn set written as one short key, which is what a Mochi carries and what the drawing is
// built from (render/jobgear/wardrobe.js). Pieces that are not real are left out, and a dress
// takes the place of a top and a bottom.
export function wearKey(wear) {
  if (!wear) return null;
  const parts = [];
  for (const slot of SLOTS) {
    if (slot === 'top' || slot === 'bottom') {
      if (wear.dress && DRESSES[wear.dress]) continue;
    }
    const id = wear[slot];
    if (id && SETS[slot][id]) parts.push(`${CODE[slot]}:${id}`);
  }
  return parts.length ? `wear|${parts.join('|')}` : null;
}
// The pieces a key names, back as a worn set.
// (`a:` is how the one old accessory slot was written, before the head, eyes, face, paws and the
// shoulders each got their own: an old key still dresses a Mochi, in whichever slot that piece
// belongs to now.)
export function wearOf(key) {
  if (typeof key !== 'string' || !key.startsWith('wear|')) return null;
  const out = {};
  for (const part of key.slice(5).split('|')) {
    const [c, id] = part.split(':');
    const slot = c === 'a' ? kindOf(id) : SLOT_OF_CODE[c];
    if (slot && SETS[slot][id]) out[slot] = id;
  }
  return out;
}
export const isWearKey = (key) => typeof key === 'string' && key.startsWith('wear|');

// ---------- Dressing a Mochi for its level ----------
// What a racer of this standing wears: a beginner is in plain cloth, and the better it gets the
// finer it is dressed, so you can see what you are up against from the start line. `points` is a
// Mochi's stat points (data/mochi-genes.js), which is what its level is counted from.
export const tierForPoints = (points) => (points < 350 ? 'beginner' : points < 800 ? 'mid' : points < 1500 ? 'end' : 'elite');
// How often a Mochi of each tier wears shoes of its own, and how often something over its clothes.
const SHOE_CHANCE = { beginner: 0.25, mid: 0.45, end: 0.7, elite: 0.9 };
const ACC_CHANCE = { beginner: 0.2, mid: 0.35, end: 0.55, elite: 0.75 };
// The slots a Mochi might be dressed up in beyond its clothes, in the order they are rolled for.
const EXTRA_SLOTS = ['hat', 'over', 'eyes', 'hands', 'face'];
// A set from `tier`, picked by a seed so the same Mochi is always dressed the same way: a dress
// now and then, a top and a bottom the rest of the time, shoes of its own more often the better
// it is, and one thing over that - a hat, a cape, specs - the same way.
export function wearFor(seed, tier) {
  // (A small deterministic shuffle of the seed, so the picks do not move together.)
  const at = (i) => {
    const x = Math.sin((seed + 1) * 127.1 + i * 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  const of = (slot, i) => {
    const ids = Object.keys(SETS[slot]).filter((id) => SETS[slot][id].tier === tier);
    return ids.length ? ids[Math.floor(at(i) * ids.length)] : null;
  };
  const wear = at(0) < 0.3 ? { dress: of('dress', 1) } : { top: of('top', 1), bottom: of('bottom', 2) };
  if (at(5) < (SHOE_CHANCE[tier] ?? 0.4)) wear.shoes = of('shoes', 6);
  if (at(3) < (ACC_CHANCE[tier] ?? 0.3)) {
    const slot = EXTRA_SLOTS[Math.floor(at(7) * EXTRA_SLOTS.length)];
    wear[slot] = of(slot, 4);
  }
  return wear;
}

// ---------- The clothes stall ----------
// What a piece costs, by its tier (the money scale: 100 gold is low, 1,000 decent, 100,000 a lot).
// A beginner's piece is pocket money out of one race; an elite one is a season of them.
export const PIECE_PRICE = { beginner: 150, mid: 800, end: 3500, elite: 14000 };
// How likely each tier is to be out on the counter. An elite piece turns up about one day in
// twelve per place, so seeing one is an occasion and the money is worth saving for.
const TIER_ODDS = [['beginner', 0.42], ['mid', 0.3], ['end', 0.2], ['elite', 0.08]];
// How often a model is dressed in one piece rather than a top and a bottom.
const DRESS_CHANCE = 0.38;
// The order a model's pieces are read in, head down to paws.
const WORN_ORDER = ['hat', 'eyes', 'face', 'dress', 'top', 'bottom', 'over', 'hands', 'shoes'];
const hashStr = (s) => {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
};
const rngOf = (seed) => {
  let x = seed >>> 0;
  return () => {
    x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
    return x / 4294967296;
  };
};
// One of a list, by weight.
const weighted = (r, list, weight) => {
  const total = list.reduce((sum, k) => sum + weight(k), 0);
  let roll = r() * total;
  for (const k of list) {
    roll -= weight(k);
    if (roll < 0) return k;
  }
  return list[list.length - 1];
};
// What the stall has out today: four models standing on the counter, one at each tier, each
// dressed from its hat down to its shoes. Every piece on a model is for sale on its own, so you
// can buy the whole look or just the boots. The same four all day, a new four tomorrow, and your
// stall is not the stall anyone else is looking at.
export function stallWear(name, day) {
  const r = rngOf(hashStr(`${name}|wear|${day}`));
  return TIERS.map((tier) => {
    const dressed = r() < DRESS_CHANCE;
    const wear = {};
    const pieces = [];
    for (const slot of WORN_ORDER) {
      if (slot === 'dress' ? !dressed : (slot === 'top' || slot === 'bottom') && dressed) continue;
      const ids = Object.keys(SETS[slot]).filter((id) => SETS[slot][id].tier === tier);
      if (!ids.length) continue;
      const id = ids[Math.floor(r() * ids.length)];
      wear[slot] = id;
      pieces.push({ kind: slot, id, tier, name: SETS[slot][id].name, price: PIECE_PRICE[tier] });
    }
    return { tier, wear, pieces };
  });
}
