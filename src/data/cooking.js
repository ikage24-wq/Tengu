// Cooking: every town has a stove (the map's `stove`). Pick a recipe you know, have its
// ingredients (fish from fishing, gathered finds and monster drops), and the pot serves SERVINGS dishes. Eating a
// dish heals a little and gives its bonus for a while (different dishes add up). You know the first recipes from the start and
// learn each fish's own recipe the first time you catch that fish.
//
// DISHES: { id, name, vessel ('bowl' | 'plate'), colors [food, topping], needs { item: qty },
// heal, values (the bonus), secs (how long), learn (a fish id: learned on its first catch; none:
// known from the start), about (the bonus in words), tier (worked out below) }.

import { FIND_TIER } from './gathering.js';
import { FISH_BY_ID } from './fishing.js';

export const DISHES = [
  // Lantern Lagoon's own (Twin Noodles sells them too).
  { id: 'dish_twinnoodles', name: 'Twin Noodles', vessel: 'bowl', colors: ['#fff0c8', '#ff8a8a'], needs: { fish_goby: 2, fish_parrot: 1 }, heal: 600, values: { regenPct: 0.015 }, secs: 600, about: 'HP back every second', learn: 'fish_parrot' },
  { id: 'dish_lanternskewer', name: 'Lantern Skewers', vessel: 'plate', colors: ['#c8e8ff', '#ffd27a'], needs: { fish_flying: 2 }, heal: 300, values: { speed: 12, jump: 6 }, secs: 600, about: 'Speed and jump', learn: 'fish_flying' },
  { id: 'dish_clownroll', name: 'Clownfish Hand Roll', vessel: 'plate', colors: ['#ff9e5a', '#ffffff'], needs: { fish_clown: 1, fish_goby: 1 }, heal: 280, values: { acc: 10, eva: 10 }, secs: 600, about: 'Accuracy and avoid', learn: 'fish_clown' },
  { id: 'dish_ponysoup', name: 'Sea Pony Pearl Soup', vessel: 'bowl', colors: ['#ffd6e6', '#fff8f0'], needs: { fish_seapony: 1, shell: 1 }, heal: 350, values: { mp: 150 }, secs: 600, about: 'Max MP', learn: 'fish_seapony' },
  { id: 'dish_doradotaco', name: 'Dorado Tacos', vessel: 'plate', colors: ['#7fe0a0', '#ffd66b'], needs: { fish_dorado: 1, fish_flying: 1 }, heal: 400, values: { watk: 9, matk: 9 }, secs: 600, about: 'Attack and magic', learn: 'fish_dorado' },
  { id: 'dish_groupercurry', name: 'Coral Grouper Curry', vessel: 'bowl', colors: ['#ffc870', '#ff8a7a'], needs: { fish_grouper: 1, fish_lagoonray: 1 }, heal: 600, values: { hp: 280 }, secs: 600, about: 'Max HP', learn: 'fish_grouper' },
  { id: 'dish_anglerpot', name: 'Lantern Angler Hotpot', vessel: 'bowl', colors: ['#ffe08a', '#5a4a8a'], needs: { fish_angler: 1, fish_parrot: 1 }, heal: 650, values: { wdef: 20, mdef: 20 }, secs: 600, about: 'Defense', learn: 'fish_angler' },
  { id: 'dish_tunasteak', name: 'Seared Sailfin Steak', vessel: 'plate', colors: ['#c87a7a', '#ffe08a'], needs: { fish_tuna: 1, fish_oarfish: 1 }, heal: 800, values: { watk: 12, matk: 12 }, secs: 600, about: 'Attack and magic', learn: 'fish_tuna' },
  { id: 'dish_molastew', name: 'Sunny Mola Stew', vessel: 'bowl', colors: ['#fff0c8', '#ffd66b'], needs: { fish_mola: 1, fish_tuna: 1 }, heal: 850, values: { hp: 400, regenPct: 0.01 }, secs: 600, about: 'Max HP and HP back', learn: 'fish_mola' },
  { id: 'dish_marlinplate', name: 'Golden Marlin Plate', vessel: 'plate', colors: ['#ffd66b', '#4f7ad0'], needs: { fish_marlin: 1 }, heal: 900, values: { critRate: 0.06, watk: 10, matk: 10 }, secs: 600, about: 'Critical rate, attack and magic', learn: 'fish_marlin' },
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
  // From gathering (data/gathering.js), known from the start.
  { id: 'dish_clovertea', name: 'Clover Honey Tea', vessel: 'bowl', colors: ['#b8e6a0', '#ffd65a'], needs: { clover: 2, honeycomb: 1 }, heal: 150, values: { regenPct: 0.015 }, secs: 600, about: 'HP back every second' },
  { id: 'dish_moontea', name: 'Moonpetal Tea', vessel: 'bowl', colors: ['#d8d2ff', '#fff2b8'], needs: { moonpetal: 1, honeycomb: 1 }, heal: 300, values: { expPct: 0.08 }, secs: 900, about: '+8% EXP' },
  { id: 'dish_cherrytart', name: 'Blossom Cherry Tart', vessel: 'plate', colors: ['#ffd9a0', '#ff6b8a'], needs: { cherry: 2, honeycomb: 1 }, heal: 250, values: { speed: 6, jump: 4 }, secs: 600, about: 'Speed and jump' },
  { id: 'dish_feast', name: 'Cloud Whale Feast', vessel: 'bowl', colors: ['#f4f8ff', '#b6c8ff'], needs: { fish_whale: 1, wool: 3 }, heal: 2500, values: { str: 15, dex: 15, int: 15, luk: 15, watk: 15, matk: 15, expPct: 0.2 }, secs: 1200, about: 'Everything, +20% EXP', learn: 'fish_whale' },

  // From each region's own finds (data/gathering.js), stronger the higher the region: the
  // ingredient dishes are known from the start, the fish ones learned on the fish's first catch.
  // Tier 1: the meadows, the canyon and the beach.
  { id: 'dish_shortcake', name: 'Wild Strawberry Shortcake', vessel: 'plate', colors: ['#fff4ea', '#ff5a6e'], needs: { wild_strawberry: 2, honeycomb: 1 }, heal: 220, values: { hp: 100, mp: 60 }, secs: 600, about: 'Max HP and MP' },
  { id: 'dish_sorbet', name: 'Prickle Pear Sorbet', vessel: 'bowl', colors: ['#ffc6dc', '#7fd07a'], needs: { prickle_pear: 2, clover: 1 }, heal: 180, values: { speed: 8 }, secs: 600, about: 'Speed' },
  { id: 'dish_kelpsoup', name: 'Sea Kelp Soup', vessel: 'bowl', colors: ['#c8e8c0', '#5aae7a'], needs: { sea_kelp: 2, fish_sardine: 1 }, heal: 250, values: { wdef: 15, mdef: 15 }, secs: 600, about: 'Defense' },
  { id: 'dish_perch', name: 'Petal Perch Meunière', vessel: 'plate', colors: ['#ffc6dc', '#ffe36b'], needs: { fish_perch: 1, cherry: 1 }, heal: 320, values: { watk: 8, matk: 8 }, secs: 600, about: 'Attack and magic', learn: 'fish_perch' },
  // Tier 2: the woods, the glade and the ruins.
  { id: 'dish_risotto', name: 'Chanterelle Risotto', vessel: 'bowl', colors: ['#fff2d0', '#ffb347'], needs: { chanterelle: 2, temple_mint: 1 }, heal: 450, values: { hp: 250 }, secs: 600, about: 'Max HP' },
  { id: 'dish_scones', name: 'Whisperberry Scones', vessel: 'plate', colors: ['#f0d8b0', '#9f8cff'], needs: { whisperberry: 2, honeycomb: 1 }, heal: 400, values: { mp: 200 }, secs: 600, about: 'Max MP' },
  { id: 'dish_minttea', name: 'Temple Mint Tea', vessel: 'bowl', colors: ['#c8f0dc', '#7fe0b0'], needs: { temple_mint: 2, honeycomb: 1 }, heal: 350, values: { regenPct: 0.02 }, secs: 600, about: 'HP back every second' },
  { id: 'dish_nightsoup', name: 'Duskcap Night Soup', vessel: 'bowl', colors: ['#5a6a9a', '#7fe6d6'], needs: { duskcap: 1, chanterelle: 1 }, heal: 500, values: { expPct: 0.1 }, secs: 900, about: '+10% EXP' },
  { id: 'dish_bass', name: 'Moss Bass Foil Bake', vessel: 'plate', colors: ['#8fc88a', '#fff4ea'], needs: { fish_mossbass: 1, chanterelle: 1 }, heal: 500, values: { watk: 11, matk: 11 }, secs: 600, about: 'Attack and magic', learn: 'fish_mossbass' },
  { id: 'dish_catfish', name: 'Crispy Catfish Bites', vessel: 'plate', colors: ['#e0b880', '#9f8cff'], needs: { fish_catfish: 1, whisperberry: 1 }, heal: 550, values: { acc: 18, eva: 18 }, secs: 600, about: 'Accuracy and avoid', learn: 'fish_catfish' },
  { id: 'dish_sylph', name: 'Sylph Flower Jelly', vessel: 'bowl', colors: ['#d8f0ff', '#b89cff'], needs: { fish_sylphfin: 1, temple_mint: 1 }, heal: 650, values: { speed: 12, jump: 8 }, secs: 600, about: 'Speed and jump', learn: 'fish_sylphfin' },
  // Tier 3: the shrine, the ridge, the cave and the springs.
  { id: 'dish_onigiri', name: 'Shrine Plum Onigiri', vessel: 'plate', colors: ['#ffffff', '#e05a7a'], needs: { shrine_plum: 1, sea_kelp: 1 }, heal: 650, values: { hp: 350, wdef: 20 }, secs: 600, about: 'Max HP and defense' },
  { id: 'dish_herbbread', name: 'Moon Thyme Herb Bread', vessel: 'plate', colors: ['#e8c890', '#b8c8f0'], needs: { moon_thyme: 2, honeycomb: 1 }, heal: 600, values: { critRate: 0.04 }, secs: 600, about: 'Crit' },
  { id: 'dish_gratin', name: 'Crystal Truffle Gratin', vessel: 'plate', colors: ['#fff0c8', '#c8e8ff'], needs: { crystal_truffle: 2, chanterelle: 1 }, heal: 800, values: { watk: 14, matk: 14 }, secs: 600, about: 'Attack and magic' },
  { id: 'dish_gingerbroth', name: 'Steam Ginger Broth', vessel: 'bowl', colors: ['#ffd8a8', '#ff9a8a'], needs: { steam_ginger: 2, shrine_plum: 1 }, heal: 700, values: { regenPct: 0.02, wdef: 25, mdef: 25 }, secs: 600, about: 'HP back and defense' },
  { id: 'dish_foxfiretea', name: 'Foxfire Lily Tea', vessel: 'bowl', colors: ['#ffd0a8', '#ffa86b'], needs: { foxfire_lily: 1, honeycomb: 1 }, heal: 600, values: { expPct: 0.12 }, secs: 900, about: '+12% EXP' },
  { id: 'dish_cavefish', name: 'Lantern Cavefish Fritters', vessel: 'plate', colors: ['#e8d0a0', '#7fe6d6'], needs: { fish_cavefish: 1, crystal_truffle: 1 }, heal: 800, values: { acc: 24, eva: 24 }, secs: 600, about: 'Accuracy and avoid', learn: 'fish_cavefish' },
  { id: 'dish_char', name: 'Sapphire Char Shioyaki', vessel: 'plate', colors: ['#6f9ae8', '#ffffff'], needs: { fish_char: 1, moon_thyme: 1 }, heal: 900, values: { critRate: 0.06, watk: 8, matk: 8 }, secs: 600, about: 'Crit and attack', learn: 'fish_char' },
  { id: 'dish_dragonkoi', name: 'Dragon Koi Feast Bowl', vessel: 'bowl', colors: ['#ffd66b', '#ff6b5a'], needs: { fish_dragonkoi: 1, steam_ginger: 2 }, heal: 1400, values: { str: 8, dex: 8, int: 8, luk: 8, hp: 400 }, secs: 900, about: 'All stats and max HP', learn: 'fish_dragonkoi' },
  // Tier 4: the peak, the sky and Starfall.
  { id: 'dish_compote', name: 'Snow Peach Compote', vessel: 'bowl', colors: ['#ffe8e0', '#ffd8d0'], needs: { snow_peach: 2, honeycomb: 1 }, heal: 1000, values: { hp: 500, mp: 250 }, secs: 600, about: 'Max HP and MP' },
  { id: 'dish_pavlova', name: 'Cloudberry Pavlova', vessel: 'plate', colors: ['#ffffff', '#ffc06b'], needs: { cloudberry: 2, honeycomb: 1 }, heal: 1000, values: { speed: 14, jump: 10 }, secs: 600, about: 'Speed and jump' },
  { id: 'dish_anisestew', name: 'Star Anise Stew', vessel: 'bowl', colors: ['#c87a5a', '#e0a85a'], needs: { star_anise: 2, snow_peach: 1 }, heal: 1100, values: { watk: 18, matk: 18 }, secs: 600, about: 'Attack and magic' },
  { id: 'dish_nectar', name: 'Starbloom Nectar', vessel: 'bowl', colors: ['#fff8d0', '#fff0a0'], needs: { starbloom: 1, cloudberry: 1 }, heal: 900, values: { expPct: 0.15 }, secs: 900, about: '+15% EXP' },
  { id: 'dish_aurora', name: 'Aurora Trout Plank', vessel: 'plate', colors: ['#9fe8d0', '#c9a6ff'], needs: { fish_auroratrout: 1, star_anise: 1 }, heal: 1200, values: { acc: 30, eva: 30, critRate: 0.04 }, secs: 600, about: 'Accuracy, avoid and crit', learn: 'fish_auroratrout' },
  { id: 'dish_cloudcarp', name: 'Cloud Carp Dumplings', vessel: 'plate', colors: ['#f4f6ff', '#a8c8ff'], needs: { fish_cloudcarp: 1, cloudberry: 1 }, heal: 1200, values: { wdef: 50, mdef: 50, regenPct: 0.015 }, secs: 600, about: 'Defense and HP back', learn: 'fish_cloudcarp' },
  { id: 'dish_comet', name: 'Comet Tetra Skewers', vessel: 'plate', colors: ['#ffe9a6', '#7f9cff'], needs: { fish_comet: 2, star_anise: 1 }, heal: 1100, values: { critRate: 0.08 }, secs: 600, about: 'Crit', learn: 'fish_comet' },
  { id: 'dish_nebula', name: 'Nebula Ray Galaxy Soup', vessel: 'bowl', colors: ['#2a2266', '#ff9ec7'], needs: { fish_nebularay: 1, starbloom: 1 }, heal: 1800, values: { str: 12, dex: 12, int: 12, luk: 12, expPct: 0.1 }, secs: 900, about: 'All stats, +10% EXP', learn: 'fish_nebularay' },
  // The second catch (2026-11-07): a dish for every new fish (the legendaries are trophies, not dinner).
  { id: 'dish_goldcrackers', name: 'Goldfish Crackers', vessel: 'plate', colors: ['#ffb05a', '#fff0c8'], needs: { fish_goldfish: 2, fish_shiner: 1 }, heal: 200, values: { expPct: 0.08 }, secs: 900, about: '+8% EXP', learn: 'fish_goldfish' },
  { id: 'dish_pondfry', name: 'Pond Fry', vessel: 'plate', colors: ['#e8c890', '#9ac07a'], needs: { fish_loach: 1, fish_bluegill: 1 }, heal: 260, values: { hp: 140 }, secs: 600, about: 'Max HP', learn: 'fish_bluegill' },
  { id: 'dish_fireflyfritters', name: 'Firefly Fritters', vessel: 'plate', colors: ['#f0ffb0', '#ffd27a'], needs: { fish_firefly: 2 }, heal: 280, values: { acc: 12, eva: 12 }, secs: 600, about: 'Accuracy and avoid', learn: 'fish_firefly' },
  { id: 'dish_pikebake', name: 'Rainbow Pike Bake', vessel: 'plate', colors: ['#ffc8d8', '#9ac07a'], needs: { fish_rainbow: 1, fish_pike: 1 }, heal: 380, values: { watk: 10, matk: 10 }, secs: 600, about: 'Attack and magic', learn: 'fish_pike' },
  { id: 'dish_sunriseflounder', name: 'Sunrise Flounder', vessel: 'plate', colors: ['#f0d8b0', '#ff9a7a'], needs: { fish_flounder: 1, fish_darter: 1 }, heal: 300, values: { speed: 10, jump: 6 }, secs: 600, about: 'Speed and jump', learn: 'fish_flounder' },
  { id: 'dish_jellysalad', name: 'Moon Jelly Salad', vessel: 'bowl', colors: ['#f0e8ff', '#a8e0a0'], needs: { fish_moonjelly: 1, fish_bream: 1 }, heal: 320, values: { mp: 150 }, secs: 600, about: 'Max MP', learn: 'fish_moonjelly' },
  { id: 'dish_reefpoke', name: 'Reef Poke Bowl', vessel: 'bowl', colors: ['#ff9a8a', '#4a8aff'], needs: { fish_tang: 1, fish_coralsnapper: 1 }, heal: 340, values: { regenPct: 0.015 }, secs: 600, about: 'HP back every second', learn: 'fish_coralsnapper' },
  { id: 'dish_jellypudding', name: 'Glow Jelly Pudding', vessel: 'bowl', colors: ['#fff0b0', '#c8e080'], needs: { fish_lanternjelly: 1, fish_seadragon: 1 }, heal: 380, values: { hp: 150, mp: 100 }, secs: 600, about: 'Max HP and MP', learn: 'fish_lanternjelly' },
  { id: 'dish_inkpasta', name: 'Squid Ink Pasta', vessel: 'plate', colors: ['#3a2d4f', '#ffd0e0'], needs: { fish_squid: 1, fish_barracuda: 1 }, heal: 400, values: { watk: 10, matk: 10 }, secs: 600, about: 'Attack and magic', learn: 'fish_squid' },
  { id: 'dish_fernwraps', name: 'Fern Dace Wraps', vessel: 'plate', colors: ['#a8e0a0', '#ffc8e8'], needs: { fish_dace: 1, fish_guppy: 1 }, heal: 480, values: { speed: 12, jump: 8 }, secs: 600, about: 'Speed and jump', learn: 'fish_dace' },
  { id: 'dish_wispdumplings', name: 'Wisp Dumplings', vessel: 'bowl', colors: ['#f4fff8', '#8fe8d8'], needs: { fish_wisptetra: 1, fish_betta: 1 }, heal: 520, values: { mp: 200 }, secs: 600, about: 'Max MP', learn: 'fish_wisptetra' },
  { id: 'dish_carpcongee', name: 'Misty Carp Congee', vessel: 'bowl', colors: ['#fff8ee', '#90b0e0'], needs: { fish_raincarp: 1, fish_mistgar: 1 }, heal: 560, values: { hp: 260 }, secs: 600, about: 'Max HP', learn: 'fish_raincarp' },
  { id: 'dish_caviartoast', name: 'Sturgeon Caviar Toast', vessel: 'plate', colors: ['#e8c890', '#3a3a4a'], needs: { fish_sturgeon: 1 }, heal: 700, values: { critRate: 0.05, watk: 8, matk: 8 }, secs: 600, about: 'Crit and attack', learn: 'fish_sturgeon' },
  { id: 'dish_ceviche', name: 'Lionfish Ceviche', vessel: 'bowl', colors: ['#fff0e8', '#ff9a7a'], needs: { fish_lionfish: 1, fish_butterfly: 1 }, heal: 600, values: { acc: 18, eva: 18 }, secs: 600, about: 'Accuracy and avoid', learn: 'fish_lionfish' },
  { id: 'dish_kabayaki', name: 'Moray Kabayaki', vessel: 'plate', colors: ['#a87a3a', '#fff0c8'], needs: { fish_moray: 1, fish_butterfly: 1 }, heal: 650, values: { wdef: 20, mdef: 20 }, secs: 600, about: 'Defense', learn: 'fish_moray' },
  { id: 'dish_tetrarolls', name: 'Crystal Tetra Rolls', vessel: 'plate', colors: ['#fff8ee', '#c8f0ff'], needs: { fish_crystaltetra: 1, fish_blindfish: 1 }, heal: 700, values: { acc: 24, eva: 24 }, secs: 600, about: 'Accuracy and avoid', learn: 'fish_crystaltetra' },
  { id: 'dish_spiritsoup', name: 'Spirit Lantern Soup', vessel: 'bowl', colors: ['#e0f4ff', '#b098d0'], needs: { fish_spiritfish: 1, fish_geode: 1 }, heal: 850, values: { expPct: 0.12 }, secs: 900, about: '+12% EXP', learn: 'fish_spiritfish' },
  { id: 'dish_onsenhotpot', name: 'Onsen Snapper Hotpot', vessel: 'bowl', colors: ['#ffc8b0', '#e85060'], needs: { fish_snapper: 1, fish_onsengoby: 1 }, heal: 800, values: { hp: 300, regenPct: 0.02 }, secs: 600, about: 'Max HP and HP back', learn: 'fish_snapper' },
  { id: 'dish_emberskewers', name: 'Ember Eel Skewers', vessel: 'plate', colors: ['#ff8a4a', '#ffd04a'], needs: { fish_embereel: 1 }, heal: 850, values: { critRate: 0.05, watk: 10, matk: 10 }, secs: 600, about: 'Crit and attack', learn: 'fish_embereel' },
  { id: 'dish_fishburger', name: 'Big Catch Burger', vessel: 'plate', colors: ['#e8b070', '#a0acbc'], needs: { fish_shark: 1 }, heal: 900, values: { hp: 400 }, secs: 600, about: 'Max HP', learn: 'fish_shark' },
  { id: 'dish_wrassetacos', name: 'Pier Wrasse Tacos', vessel: 'plate', colors: ['#ffe0a0', '#7ae0d0'], needs: { fish_wrasse: 2, fish_trigger: 1 }, heal: 750, values: { speed: 13, jump: 8 }, secs: 600, about: 'Speed and jump', learn: 'fish_wrasse' },
  { id: 'dish_glassjelly', name: 'Glassfish Jelly', vessel: 'bowl', colors: ['#e8f8ff', '#b85aff'], needs: { fish_glassfish: 1, fish_gramma: 1 }, heal: 800, values: { mp: 300 }, secs: 600, about: 'Max MP', learn: 'fish_glassfish' },
  { id: 'dish_seabassplatter', name: 'Grilled Seabass Platter', vessel: 'plate', colors: ['#c8a878', '#90a8c8'], needs: { fish_seabass: 1, fish_goliath: 1 }, heal: 900, values: { watk: 13, matk: 13 }, secs: 600, about: 'Attack and magic', learn: 'fish_seabass' },
  { id: 'dish_cuttlecurry', name: 'Rainbow Cuttlefish Curry', vessel: 'bowl', colors: ['#ffd04a', '#ff9ac8'], needs: { fish_cuttle: 1 }, heal: 900, values: { wdef: 30, mdef: 30 }, secs: 600, about: 'Defense', learn: 'fish_cuttle' },
  { id: 'dish_smelttempura', name: 'Frost Smelt Tempura', vessel: 'plate', colors: ['#fff4d8', '#e8f4ff'], needs: { fish_smelt: 2, fish_glacierpike: 1 }, heal: 1000, values: { watk: 16, matk: 16 }, secs: 600, about: 'Attack and magic', learn: 'fish_smelt' },
  { id: 'dish_aurorastew', name: 'Aurora Cod Stew', vessel: 'bowl', colors: ['#f4f8ff', '#c8b8ff'], needs: { fish_cod: 1, fish_aurorajelly: 1 }, heal: 1100, values: { hp: 550, regenPct: 0.01 }, secs: 600, about: 'Max HP and HP back', learn: 'fish_cod' },
  { id: 'dish_cloudmochi', name: 'Cloudkoi Mochi', vessel: 'plate', colors: ['#ffffff', '#ffc8e8'], needs: { fish_cloudkoi: 1, fish_breeze: 1 }, heal: 1000, values: { speed: 14, jump: 10 }, secs: 600, about: 'Speed and jump', learn: 'fish_breeze' },
  { id: 'dish_parfait', name: 'Twinkle Sunrise Parfait', vessel: 'bowl', colors: ['#ffc890', '#ffe8a0'], needs: { fish_sunangel: 1, fish_twinkle: 1 }, heal: 1000, values: { expPct: 0.15 }, secs: 900, about: '+15% EXP', learn: 'fish_twinkle' },
  { id: 'dish_moonsteak', name: 'Moonfish Steak', vessel: 'plate', colors: ['#f0b0b8', '#f0f0ff'], needs: { fish_moonfish: 1 }, heal: 1200, values: { critRate: 0.07, watk: 10, matk: 10 }, secs: 600, about: 'Crit and attack', learn: 'fish_moonfish' },
  { id: 'dish_skybento', name: 'Sky Manta Bento', vessel: 'plate', colors: ['#fff8ee', '#b8d0ff'], needs: { fish_skymanta: 1, fish_nimbusminnow: 1 }, heal: 1100, values: { hp: 500, mp: 250 }, secs: 600, about: 'Max HP and MP', learn: 'fish_skymanta' },
  { id: 'dish_sunbeamsushi', name: 'Sunbeam Sushi', vessel: 'plate', colors: ['#ffe8a0', '#ffd8f0'], needs: { fish_sunflyer: 1, fish_rainbowfin: 1 }, heal: 1100, values: { acc: 30, eva: 30 }, secs: 600, about: 'Accuracy and avoid', learn: 'fish_sunflyer' },
  { id: 'dish_thunderdon', name: 'Thunder Eel Donburi', vessel: 'bowl', colors: ['#fff8ee', '#6a7ad8'], needs: { fish_thundereel: 1, fish_driftjelly: 1 }, heal: 1300, values: { watk: 18, matk: 18 }, secs: 600, about: 'Attack and magic', learn: 'fish_thundereel' },
];

// Each dish's tier (1-4, for the Cooking level it needs: TIER_LV in data/gathering.js): the
// highest region among the finds and fish it's made from.
for (const d of DISHES) d.tier = Math.max(1, ...Object.keys(d.needs).map((id) => FIND_TIER[id] ?? FISH_BY_ID[id]?.tier ?? 1));

export const DISH_BY_ID = Object.fromEntries(DISHES.map((d) => [d.id, d]));

// How many dishes a pot serves.
export const SERVINGS = 2;

// Party feasts (world/coop-life.js): one per region tier, a big pot from a bigger batch of that
// tier's own dish ingredients. Whoever eats one shares it with the whole party on the map (bot
// members and online friends too): its bonus is two of the tier's dishes together, for longer.
// FEASTS: { id, name, vessel, colors, needs, heal, values, secs, about, from (the dishes), tier }.
const feast = (id, name, colors, needs, from, about) => {
  const ds = from.map((d) => DISH_BY_ID[d]);
  const values = {};
  for (const d of ds) for (const [k, v] of Object.entries(d.values)) values[k] = (values[k] ?? 0) + v;
  return { id, name, vessel: 'bowl', dish: '#ffe9a6', colors, needs, heal: Math.round(ds.reduce((n, d) => n + d.heal, 0) * 0.75), values, secs: 1200, about, from, feast: true };
};
export const FEASTS = [
  feast('feast_meadow', 'Meadow Picnic Feast', ['#ff5a6e', '#ffc6dc'], { wild_strawberry: 3, prickle_pear: 3, honeycomb: 2 }, ['dish_shortcake', 'dish_sorbet'], 'Max HP, MP and speed'),
  feast('feast_woods', 'Woodland Harvest Feast', ['#ffb347', '#9f8cff'], { chanterelle: 3, temple_mint: 3, whisperberry: 2, honeycomb: 1 }, ['dish_risotto', 'dish_minttea'], 'Max HP and HP back'),
  feast('feast_shrine', 'Shrine Festival Feast', ['#e05a7a', '#c8e8ff'], { shrine_plum: 2, sea_kelp: 2, crystal_truffle: 3, chanterelle: 1 }, ['dish_onigiri', 'dish_gratin'], 'Max HP, defense and attack'),
  feast('feast_sky', 'Starfall Sky Feast', ['#ffd8d0', '#e0a85a'], { snow_peach: 3, star_anise: 3, cloudberry: 2, honeycomb: 1 }, ['dish_compote', 'dish_anisestew'], 'Max HP, MP and attack'),
];
for (const f of FEASTS) f.tier = Math.max(1, ...Object.keys(f.needs).map((id) => FIND_TIER[id] ?? FISH_BY_ID[id]?.tier ?? 1));
export const FEAST_BY_ID = Object.fromEntries(FEASTS.map((f) => [f.id, f]));
