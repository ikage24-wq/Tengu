// Cosmetic skins from the capsule machines (data/outfits-gacha.js GACHA_PRIZES): how your chat
// bubbles, your name tag and your damage numbers look. Looks only, never a stat. Each machine adds
// its own; you choose which you use in the Collection's Style page (ui/collection.js).
// char.cosmetics = { owned: [keys], using: { bubble, tag, dmg } }.
//
// BUBBLES: { fill, edge, text, deco } (render/cosmetics.js draws the deco round the bubble).
// TAGS: { fill, edge, text, deco } for the name tag under you.
// DAMAGE: { fill, edge, crit, deco } for the numbers your hits pop.

export const BUBBLES = {
  blossom: { name: 'Blossom Bubble', fill: '#fff0f6', edge: '#ff8fb8', text: '#8a3a5a', deco: 'petals', machine: 'sprout' },
  molten: { name: 'Molten Bubble', fill: '#221a26', edge: '#ffcf4a', text: '#ffe6b0', deco: 'molten', machine: 'crag' },
  pricetag: { name: 'Price Tag Bubble', fill: '#fff6e0', edge: '#c8902e', text: '#5a2a3a', deco: 'pricetag', machine: 'coinbridge' },
  moonlit: { name: 'Moonlit Bubble', fill: '#1f2050', edge: '#7ae8ff', text: '#e8f4ff', deco: 'moonlit', machine: 'grove' },
  logbook: { name: "Keeper's Logbook Bubble", fill: '#fbf2dc', edge: '#8a5a32', text: '#4a3420', deco: 'rope', machine: 'harbor' },
};
export const TAGS = {
  sproutvine: { name: 'Sprout Vine Tag', fill: '#7fd17a', edge: '#ffffff', text: '#ffffff', deco: 'vine', machine: 'sprout' },
  // (Album only: for filling Sprout's page in the capsule album.)
  forgerune: { name: 'Forge Rune Tag', fill: '#2a2232', edge: '#ffcf4a', text: '#ffe6b0', deco: 'runes', machine: 'crag' },
  godseal: { name: 'Forge God Seal', fill: '#2a2232', edge: '#ff7a2a', text: '#fff0c0', deco: 'godcrown', machine: 'crag', album: true },
  shopsign: { name: 'Shop Sign Tag', fill: '#8a5a3a', edge: '#ffcf4a', text: '#fff6e0', deco: 'shopsign', machine: 'coinbridge' },
  ledgerseal: { name: 'Golden Ledger Seal', fill: '#5a2a6a', edge: '#ffcf4a', text: '#fff0c0', deco: 'ledger', machine: 'coinbridge', album: true },
  mothwing: { name: 'Moth Wing Tag', fill: '#2a2c6a', edge: '#a8b4f0', text: '#e8f4ff', deco: 'mothwing', machine: 'grove' },
  fullmoonseal: { name: 'Full Moon Seal', fill: '#2a2a5a', edge: '#e8e4ff', text: '#f4f0ff', deco: 'fullmoon', machine: 'grove', album: true },
  anchor: { name: 'Anchor Tag', fill: '#2e4a7a', edge: '#f4ecd8', text: '#ffffff', deco: 'anchor', machine: 'harbor' },
  beaconseal: { name: 'Beacon Seal Tag', fill: '#1f2f52', edge: '#ffd23f', text: '#fff3c4', deco: 'beacon', machine: 'harbor', album: true },
  springseal: { name: 'Spring Seal Tag', fill: '#ffe9a8', edge: '#c8962a', text: '#7a5212', deco: 'seal', machine: 'sprout', album: true },
};
export const DAMAGE = {
  petalpop: { name: 'Petal Pop Numbers', fill: '#ffb8d4', edge: '#a8306a', crit: '#ffe36b', deco: 'petals', machine: 'sprout' },
  hammerfall: { name: 'Hammerfall Numbers', fill: '#ffcf4a', edge: '#3a1408', crit: '#fff6d0', deco: 'hammerfall', machine: 'crag' },
  coinburst: { name: 'Coin Burst Numbers', fill: '#ffcf4a', edge: '#5a2a14', crit: '#ffffff', deco: 'coins', machine: 'coinbridge' },
  moondust: { name: 'Moon Dust Numbers', fill: '#e8f4ff', edge: '#1f2050', crit: '#7ae8ff', deco: 'moondust', machine: 'grove' },
  beam: { name: 'Beacon Numbers', fill: '#fff3c4', edge: '#2e4a7a', crit: '#ffd23f', deco: 'beam', machine: 'harbor' },
};
export const SKIN_KINDS = { bubble: BUBBLES, tag: TAGS, dmg: DAMAGE };
export const SKIN_LABEL = { bubble: 'Chat bubble', tag: 'Name tag', dmg: 'Damage numbers' };

const cos = (char) => (char.cosmetics ??= { owned: [], using: {} });
export const ownsSkin = (char, kind, key) => cos(char).owned.includes(`${kind}:${key}`);
export function giveSkin(char, kind, key) {
  const c = cos(char);
  if (!c.owned.includes(`${kind}:${key}`)) c.owned.push(`${kind}:${key}`);
  // (A new one is put on straight away, so you see it.)
  c.using[kind] = key;
}
export const usingSkin = (char, kind) => {
  const key = char?.cosmetics?.using?.[kind];
  return key ? SKIN_KINDS[kind][key] ?? null : null;
};
export function useSkin(char, kind, key) {
  if (key && !ownsSkin(char, kind, key)) return;
  cos(char).using[kind] = key;
}
