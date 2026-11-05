// What everyone wears on the title screen (the show in title-show.js and the close-ups in
// title-peek.js): an outfit for each of them from the game's own wardrobe, picked from who they
// are. Their own gear (Tora's axe and gloves) stays on top.

import { ITEMS } from '../data/items.js';
import { NPCS } from '../data/npcs.js';
import '../data/cash.js';

const WARDROBE = {
  // The diva director: a dramatic black frock with its bonnet and cape.
  encore: ['cash_costume_gothic'],
  // The stagehand: flannel, cargo shorts, high-tops and the crew's headphones.
  tora: ['cash_casual_flannel', 'cash_casual_cargo', 'cash_casual_hightops', 'cash_casual_headphones'],
  // The delivery kid: a stripy top, denim shorts, a sideways cap and a backpack.
  pip: ['cash_casual_stripes', 'cash_casual_jorts', 'cash_casual_hightops', 'cash_casual_cap', 'cash_casual_backpack'],
  // The shy bookworm: a cosy cardigan, a flower skirt, loafers, round glasses and a long scarf.
  nim: ['cash_casual_cardigan', 'cash_casual_flowerskirt', 'cash_casual_loafers', 'cash_casual_glasses', 'cash_casual_scarf'],
  // The salesman: a long trench coat and hat, the kind you sell watches from the inside of.
  marlo: ['cash_costume_detective'],
  // The guide: a track jacket, a tennis skirt, high-tops and a cap, ready to point at things.
  mira: ['cash_casual_track', 'cash_casual_tennis', 'cash_casual_hightops', 'cash_casual_cap'],
  // The stylist: a stage outfit, platform boots, heart sunglasses and a big bow.
  lulu: ['cash_casual_idol', 'cash_casual_platforms', 'cash_casual_sunglasses', 'cash_casual_bow'],
  // The bun keeper: a denim pinafore, rain boots and fluffy mittens (buns bite).
  clover: ['cash_casual_pinafore', 'cash_casual_rainboots', 'cash_casual_mittens'],
  // The lighthouse keeper: a yellow raincoat and rain boots, whatever the weather.
  kelp: ['cash_casual_raincoat', 'cash_casual_trackpants', 'cash_casual_rainboots'],
  // The carpenter: a tee, cargo shorts, high-tops and a bucket hat.
  shelly: ['cash_casual_tee', 'cash_casual_cargo', 'cash_casual_hightops', 'cash_casual_bucket'],
  // The fishing champion: a rash guard, board shorts, flip-flops and snorkel goggles.
  nori: ['cash_casual_rashguard', 'cash_casual_boardshorts', 'cash_casual_flipflops', 'cash_casual_goggles'],
  // The harbour captain: the pirate captain's coat and hat, naturally.
  rook: ['cash_costume_pirate'],
};

const cache = {};
// Someone's gear for the title: their own gear, dressed in their outfit's looks.
export function castGear(id) {
  if (cache[id]) return cache[id];
  const g = { ...(NPCS[id]?.gear ?? {}) };
  for (const piece of WARDROBE[id] ?? []) {
    const def = ITEMS[piece];
    if (!def) continue;
    g[def.slot] = { id: def.skin };
    for (const [slot, look] of Object.entries(def.covers ?? {})) g[slot] = { id: look };
  }
  cache[id] = g;
  return g;
}

export const DRESSED = Object.keys(WARDROBE);
