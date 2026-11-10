// Mochi dress-up (docs/design/mochi.md step 14): the six sweet costumes drawn with the Wagashi
// Sprites (render/jobgear/mochi.js), a hood and clothes each, worn by any of your Mochi (its
// `dress`; render/wagashi.js lookOf). Mochi wear no hats otherwise. The plain Daifuku hood is yours
// from the start; each of the others is won by your first Beginner win on its race stage
// (world/mochi-race.js).

export const DRESS = {
  daifuku: { name: 'Daifuku Hood', outfit: 'mochibaby', free: true },
  dango: { name: 'Dango Runner', outfit: 'mochidango', stage: 'sprint' },
  warabi: { name: 'Warabi Swimmer', outfit: 'mochiwarabi', stage: 'swim' },
  sakura: { name: 'Sakura Glider', outfit: 'mochisakura', stage: 'glide' },
  kagami: { name: 'Kagami Wrestler', outfit: 'mochikagami', stage: 'climb' },
  monaka: { name: 'Monaka Knight', outfit: 'mochimonaka', stage: 'hills' },
  // Bought from Kinako, the Garden Keeper: outfits, no hoods (the last only at her secret stall, at night).
  study: { name: 'Study Buddy', outfit: 'mochistudy', price: 20000 },
  sailor: { name: 'Sailor Sweet', outfit: 'mochisailor', price: 20000 },
  cozy: { name: 'Cozy Knit', outfit: 'mochicozy', price: 30000 },
  berry: { name: 'Berry Overalls', outfit: 'mochiberry', price: 30000 },
  starry: { name: 'Starry Night', outfit: 'mochistarry', price: 120000, secret: true },
};
// Whether `char` has won costume `id`.
export const dressOpen = (char, id) => Boolean(DRESS[id] && (DRESS[id].free || char.raceWins?.[`${DRESS[id].stage}|beginner`] || char.dressBought?.includes(id)));
// The costume a first Beginner win on stage `stageId` brings.
export const dressFor = (stageId) => Object.keys(DRESS).find((id) => DRESS[id].stage === stageId) ?? null;
