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
};
export const TAGS = {
  sproutvine: { name: 'Sprout Vine Tag', fill: '#7fd17a', edge: '#ffffff', text: '#ffffff', deco: 'vine', machine: 'sprout' },
  // (Album only: for filling Sprout's page in the capsule album.)
  springseal: { name: 'Spring Seal Tag', fill: '#ffe9a8', edge: '#c8962a', text: '#7a5212', deco: 'seal', machine: 'sprout', album: true },
};
export const DAMAGE = {
  petalpop: { name: 'Petal Pop Numbers', fill: '#ffb8d4', edge: '#a8306a', crit: '#ffe36b', deco: 'petals', machine: 'sprout' },
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
