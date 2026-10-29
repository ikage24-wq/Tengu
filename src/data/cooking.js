// Cooking: every town has a stove (the map's `stove`). Pick a recipe you know, have its
// ingredients (fish from fishing and monster drops), and stir: stop the spoon in the sweet spot
// and the pot serves more (Good one dish, Great two, Perfect three). Eating a dish heals a little and gives its bonus for a while (one
// dish at a time; a new one replaces the last). You know the first recipes from the start and
// learn each fish's own recipe the first time you catch that fish.
//
// DISHES: { id, name, vessel ('bowl' | 'plate'), colors [food, topping], needs { item: qty },
// heal, values (the bonus), secs (how long), learn (a fish id: learned on its first catch; none:
// known from the start), about (the bonus in words) }.

export const DISHES = [
  { id: 'dish_grilled', name: 'Grilled Minnow Skewers', vessel: 'plate', colors: ['#ffb35a', '#ffe36b'], needs: { fish_minnow: 2 }, heal: 120, values: { regenPct: 0.01 }, secs: 300, about: 'HP back every second' },
  { id: 'dish_stew', name: 'Garden Carp Stew', vessel: 'bowl', colors: ['#ffc6a0', '#9be08f'], needs: { fish_carp: 1, sprout_leaf: 2 }, heal: 200, values: { hp: 120 }, secs: 600, about: 'Max HP' },
  { id: 'dish_skewer', name: 'Sea Salt Sardines', vessel: 'plate', colors: ['#d6e4ff', '#ffffff'], needs: { fish_sardine: 2, shell: 1 }, heal: 150, values: { watk: 6, matk: 6 }, secs: 600, about: 'Attack and magic' },
  { id: 'dish_trout', name: 'Mint Trout Bake', vessel: 'plate', colors: ['#9fe0c0', '#fff4ea'], needs: { fish_trout: 1, mushcap: 2 }, heal: 300, values: { acc: 12, eva: 12 }, secs: 600, about: 'Accuracy and avoid', learn: 'fish_trout' },
  { id: 'dish_ricebowl', name: 'Mackerel Rice Bowl', vessel: 'bowl', colors: ['#fffaf0', '#8fb8ff'], needs: { fish_mackerel: 1, sprout_leaf: 2 }, heal: 400, values: { watk: 10, matk: 10 }, secs: 600, about: 'Attack and magic', learn: 'fish_mackerel' },
  { id: 'dish_tempura', name: 'Puff-Puff Tempura', vessel: 'plate', colors: ['#ffe9a6', '#fff1c4'], needs: { fish_puffer: 1, leaf_fragment: 2 }, heal: 400, values: { speed: 10, jump: 5 }, secs: 600, about: 'Speed and jump', learn: 'fish_puffer' },
  { id: 'dish_hotpot', name: 'Steamfin Hotpot', vessel: 'bowl', colors: ['#ff9a8a', '#9be08f'], needs: { fish_hotfish: 1, moss_stone: 1 }, heal: 600, values: { wdef: 30, mdef: 30, regenPct: 0.01 }, secs: 600, about: 'Defense and HP back', learn: 'fish_hotfish' },
  { id: 'dish_eel', name: 'Glow Eel Kabayaki', vessel: 'bowl', colors: ['#c98a5a', '#7fe6d6'], needs: { fish_eel: 1, wisp_flame: 1 }, heal: 700, values: { critRate: 0.05, watk: 8, matk: 8 }, secs: 600, about: 'Crit and attack', learn: 'fish_eel' },
  { id: 'dish_koimochi', name: 'Moon Koi Mochi', vessel: 'plate', colors: ['#ffffff', '#ff8a5c'], needs: { fish_koi: 1, fluff: 2 }, heal: 600, values: { expPct: 0.15 }, secs: 900, about: '+15% EXP', learn: 'fish_koi' },
  { id: 'dish_sashimi', name: 'Frostfin Sashimi', vessel: 'plate', colors: ['#cfe8ff', '#ff9ec0'], needs: { fish_icefish: 1, crystal_gel: 1 }, heal: 900, values: { watk: 16, matk: 16 }, secs: 600, about: 'Attack and magic', learn: 'fish_icefish' },
  { id: 'dish_angel', name: 'Seraph Soufflé', vessel: 'bowl', colors: ['#e6dcff', '#ffe9a6'], needs: { fish_seraph: 1, feather: 2 }, heal: 1200, values: { hp: 600, mp: 300 }, secs: 900, about: 'Max HP and MP', learn: 'fish_seraph' },
  { id: 'dish_wishcake', name: 'Wishing Star Cake', vessel: 'plate', colors: ['#ffe36b', '#ff9ec0'], needs: { fish_starfish: 1, stardust: 2 }, heal: 1500, values: { str: 10, dex: 10, int: 10, luk: 10, critRate: 0.05 }, secs: 900, about: 'All stats and crit', learn: 'fish_starfish' },
  { id: 'dish_feast', name: 'Cloud Whale Feast', vessel: 'bowl', colors: ['#f4f8ff', '#b6c8ff'], needs: { fish_whale: 1, wool: 3 }, heal: 2500, values: { str: 15, dex: 15, int: 15, luk: 15, watk: 15, matk: 15, expPct: 0.2 }, secs: 1200, about: 'Everything, +20% EXP', learn: 'fish_whale' },
];

export const DISH_BY_ID = Object.fromEntries(DISHES.map((d) => [d.id, d]));

// How the stir went, and how many dishes the pot serves.
export const QUALITY = [
  { name: 'Good', servings: 1, color: '#9c86b8' },
  { name: 'Great', servings: 2, color: '#3f9f5f' },
  { name: 'Perfect', servings: 3, color: '#e0a52f' },
];
