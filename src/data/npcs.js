// NPCs. Roles: guide (quests), shop, stylist (change your look for gold), instructor (job advancement).
// `look` uses the same appearance fields as the player, so NPCs are drawn by the hero renderer;
// an NPC can also carry `gear` (same shape as the player's equipment) to show it off. In towns,
// `building` is the stall or hall drawn behind them (see render/town.js) and `sign` its name.

import { SWEETHEARTS } from './sweethearts.js';
import { COSTUME_LOOKS } from './outfits-costume.js';
import { ITEMS, GEAR_FAMILIES, JOB_SLOTS, jobGearId } from './items.js';
import { JOBS } from './jobs.js';

const armor = (t) => ['hat', 'top', 'bottom', 'shoes', 'gloves', 'cape', 'earring'].map((s) => `${s}_${t}`);
// Weapons of the given types from level `from` to `to`. Higher ones and the endgame designs only drop.
const arms = (from, to, ...types) => types.flatMap((w) => Array.from({ length: (to - from) / 5 + 1 }, (_, i) => `${w}_${from + i * 5}`));
// An outfit from one job's set at a level, for NPCs to show off.
const outfit = (family, level, variant = null) => Object.fromEntries(JOB_SLOTS.map((s) => [s, { id: jobGearId(family, s, level), variant }]));

export const NPCS = {
  mira: {
    id: 'mira', name: 'Mira', title: 'Village Guide', role: 'guide',
    building: 'kiosk', sign: 'Info',
    look: { hairStyle: 'candy', hairColor: '#ff9ec0', skinTone: '#fff0e6', eyeColor: '#5aa8ff', outfitColor: '#bff0dc', eyeStyle: 'sparkle' },
    greeting: 'Welcome to Sprout Village! Press I for your bag, K for skills, C for stats, and M for the world map.',
    quests: ['story_1_1', 'story_1_2', 'story_1_3', 'story_festival', 'story_1_4', 'story_7_1', 'story_7_2', 'story_wind', 'first_steps', 'fluffy', 'sprout_sweep', 'mira_letter', 'daily_meadow'],
  },
  // Kuro, a young tengu who keeps Dawnlight Isle, the tutorial island: he shows new adventurers
  // the ropes and sees them onto the boat to Sprout Village.
  kuro: {
    id: 'kuro', name: 'Kuro', title: 'Island Keeper', role: 'guide',
    look: { hairStyle: 'wolfsleek', hairColor: '#2a2440', skinTone: '#fbd9bf', eyeColor: '#d8343a', eyeStyle: 'round', outfitColor: '#3a3550', face: 'grin' },
    greeting: "Morning! You washed up on Dawnlight Isle. Don't worry, I'll show you the ropes, then the boat will take you to Sprout Village.",
    quests: ['tut_hello', 'tut_lookout', 'tut_practice', 'tut_farewell'],
  },
  pip: {
    id: 'pip', name: 'Pip', title: 'General Store', role: 'shop',
    // Pip delivers: anything left here reaches every hero in your world. (ui/storage.js)
    storage: "Leave it with me. I'll get it to any of your heroes!",
    building: 'goods', sign: "Pip's Goods",
    look: { hairStyle: 'pixie', hairColor: '#f5c95c', skinTone: '#fbd9bf', eyeColor: '#7a4a2b', outfitColor: '#ffd66b', eyeStyle: 'round', face: 'grin' },
    greeting: 'Tonics, starter gear, and homeward scrolls. Take a look!',
    shop: ['fishing_rod', 'red_potion', 'orange_potion', 'blue_potion', 'return_scroll', ...arms(0, 10, 'sword', 'axe', 'spear', 'wand', 'staff', 'bow', 'crossbow', 'dagger', 'gauntlet'), ...armor(0), 'ear_5', 'ear_10'],
    // Job gear for your own job (a Novice sees every job's starter set), by level.
    stockLevels: [5, 10],
    quests: ['snail_trouble', 'pip_parcel', 'pip_souvenirs', 'pip_lunch'],
  },
  lulu: {
    id: 'lulu', name: 'Lulu', title: 'Stylist', role: 'stylist',
    quests: ['lulu_gossip', 'lulu_runway', 'lulu_winter'],
    building: 'salon', sign: "Lulu's Salon",
    look: { hairStyle: 'odango', hairColor: '#c9a6ff', skinTone: '#fff0e6', eyeColor: '#9b6cff', outfitColor: '#ffc2d6', eyeStyle: 'sparkle', face: 'excited' },
    greeting: 'New hair? New clothes? A fresh look is 200 gold, and my boutique has the cutest outfits!',
    styleCost: 200,
    shop: ['denim_jacket', 'cozy_sweater', 'overalls', 'sundress', 'school_blazer', 'puffer_jacket', 'maid_dress', 'pleated_skirt', 'blue_jeans', 'cargo_pants', 'long_skirt', 'hoodie', 'sailor_top'],
  },
  brann: {
    id: 'brann', name: 'Brann', title: 'Warrior Instructor', role: 'instructor', family: 'warrior',
    building: 'warrior', sign: 'Warrior Hall', gear: { weapon: { id: 'sword_50', variant: 'crimson' }, ...outfit('warrior', 50) },
    quests: ['brann_stand', 'brann_ruins', 'brann_howl', 'warrior_trial', 'daily_crag'], showJob: 'paladin',
    look: { hairStyle: 'cloud', hairColor: '#7a5238', skinTone: '#e7b48f', eyeColor: '#3b3650', outfitColor: '#ff9b7a', eyeStyle: 'round', face: 'cool' },
    greeting: 'Welcome to Ember Crag! Strong arms, steady heart. Warriors stand in front so others can shine.',
  },
  elowen: {
    id: 'elowen', name: 'Elowen', title: 'Mage Instructor', role: 'instructor', family: 'mage',
    building: 'mage', sign: 'Mage Tower', gear: { weapon: { id: 'staff_50' }, ...outfit('mage', 50) },
    look: { hairStyle: 'hime', hairColor: '#e9ebfa', skinTone: '#fff0e6', eyeColor: '#9b6cff', outfitColor: '#b8a6ff', eyeStyle: 'sleepy', face: 'smug' },
    quests: ['story_invite', 'story_waltz', 'story_3_1', 'story_3_2', 'story_6_1', 'story_6_2', 'story_6_3', 'elowen_dance', 'elowen_wisps', 'elowen_foxfire', 'elowen_lid', 'mage_trial'], showJob: 'mage',
    greeting: 'Moonleaf Grove welcomes you. Magic here is written in the stars: they fall for you and they mend for you. Shall we begin?',
  },
  kestrel: {
    id: 'kestrel', name: 'Kestrel', title: 'Acrobat Archer Instructor', role: 'instructor', family: 'archer',
    building: 'archer', sign: 'Archer Lodge', gear: { weapon: { id: 'bow_50' }, ...outfit('archer', 50) },
    quests: ['kestrel_targets', 'kestrel_canyon', 'kestrel_glade', 'kestrel_wings', 'archer_trial'], showJob: 'beastmaster',
    look: { hairStyle: 'ponytail', hairColor: '#9be08f', skinTone: '#fbd9bf', eyeColor: '#2f6b3a', outfitColor: '#8ee3a6', eyeStyle: 'round', face: 'cat' },
    greeting: 'Sprout Village is archer country! Keep your distance and your aim true.',
  },
  vex: {
    id: 'vex', name: 'Vex', title: 'Wind Dancer Instructor', role: 'instructor', family: 'thief',
    building: 'thief', sign: 'Wind Dance Hall', gear: { weapon: { id: 'dagger_50', variant: 'dark' }, ...outfit('thief', 50) },
    quests: ['story_4_1', 'story_4_2', 'story_4_3', 'vex_rumor', 'vex_shadows', 'vex_stage', 'vex_miko', 'vex_festival', 'thief_trial'], showJob: 'shinobi',
    look: { hairStyle: 'swoop', hairColor: '#3b3650', skinTone: '#c98e66', eyeColor: '#e8a23c', outfitColor: '#5d5285', eyeStyle: 'sleepy', face: 'smug' },
    greeting: 'Every fight is a dance, and the harbor is my stage. Light feet, big finish. Shall we?',
  },
  tora: {
    id: 'tora', name: 'Tora', title: 'Blacksmith', role: 'shop',
    quests: ['tora_handles', 'tora_bellows', 'brann_forge', 'tora_draught', 'tora_cores'],
    // She polishes gear at her forge (ui/polish.js).
    polish: true,
    building: 'forge', sign: "Tora's Forge", gear: { weapon: { id: 'axe_25' }, gloves: { id: 'warrior_gloves_25' } },
    look: { hairStyle: 'wolf', hairColor: '#ff8a5c', skinTone: '#e7b48f', eyeColor: '#c0462f', outfitColor: '#7a5238', outfit: 'overalls', eyeStyle: 'round', face: 'grin' },
    greeting: 'Fresh off the anvil! Blades, axes, spears, and armor that can take a hit.',
    shop: ['red_potion', 'orange_potion', 'white_potion', 'blue_potion', 'return_scroll', ...arms(10, 30, 'sword', 'axe', 'spear'), 'ear_15', 'ear_20', 'ear_25'],
    stockLevels: [10, 30],
  },
  nim: {
    id: 'nim', name: 'Nim', title: 'Spell Shop', role: 'shop',
    quests: ['story_charts', 'story_astraea', 'story_5_1', 'story_5_2', 'story_5_3', 'nim_chimes', 'nim_candles', 'nim_cape', 'nim_stardust'],
    building: 'magic', sign: "Nim's Spells",
    look: { hairStyle: 'hime', hairColor: '#b9a7ff', skinTone: '#fff0e6', eyeColor: '#5aa8ff', outfitColor: '#c9b8ff', outfit: 'sweater', eyeStyle: 'star', face: 'shy' },
    greeting: 'W-welcome... wands, staves, moonberry tonics, and charmed earrings. Mind the floating candles.',
    shop: ['blue_potion', 'mana_elixir', 'red_potion', 'orange_potion', 'return_scroll', ...arms(25, 50, 'wand', 'staff'), 'ear_30', 'ear_35', 'ear_40', 'ear_45', 'ear_50'],
    stockLevels: [30, 50],
  },
  rook: {
    id: 'rook', name: 'Captain Rook', title: 'Harbor Captain', role: 'guide',
    building: 'office', sign: 'Harbor Office',
    look: { hairStyle: 'wolfsleek', hairColor: '#e9ebfa', skinTone: '#e7b48f', eyeColor: '#5aa8ff', outfitColor: '#7fb8ff', eyeStyle: 'round', face: 'grin' },
    greeting: 'The harbor needs brave folks. Got time for a job?',
    quests: ['story_2_1', 'island_deed', 'canyon_eggs', 'canyon_stingers', 'canyon_lookout', 'mush_menace', 'leaf_samples', 'restless_ruins', 'crystal_heart', 'rook_harpies', 'rook_stars', 'daily_harbor'],
  },
  bramble: {
    id: 'bramble', name: 'Bramble', title: 'Hollow Warden', role: 'dungeon', dungeon: 'hollow',
    look: { hairStyle: 'wolf', hairColor: '#8fbf7a', skinTone: '#e7b48f', eyeColor: '#7a4a2b', outfitColor: '#b08860', eyeStyle: 'round', face: 'grin' },
    greeting: "Rootwood Hollow is no place to wander alone. Bring a warrior to tank, a mage to heal, and two fighters, or I'll find you some.",
    shop: ['red_potion', 'orange_potion', 'white_potion', 'blue_potion', 'return_scroll'],
    quests: ['story_2_2', 'story_root', 'bramble_check', 'hollow_heart', 'bramble_wipe', 'bramble_charge'],
  },
  pumpkins: {
    id: 'pumpkins', name: 'Mr. Pumpkins', title: 'Manor Groundskeeper', role: 'dungeon', dungeon: 'manor',
    look: { hairStyle: 'wolf', hairColor: '#ff9a4a', skinTone: '#f2c8a0', eyeColor: '#6a4a2b', outfitColor: '#6a8a4a', eyeStyle: 'round', face: 'smile' },
    greeting: "Lady Marigold's party's been going a hundred years. Nobody comes home from it. Bring a tank, a healer and two fighters, and mind the trolley.",
    shop: ['red_potion', 'orange_potion', 'white_potion', 'blue_potion', 'mana_elixir', 'return_scroll'],
  },
  marina: {
    id: 'marina', name: 'Marina', title: 'Harbor Diver', role: 'dungeon', quests: ['story_tide', 'story_coralie'], dungeon: 'aquarium',
    look: { hairStyle: 'wolf', hairColor: '#7fd8e8', skinTone: '#e7b48f', eyeColor: '#1f7a8b', outfitColor: '#5ac8c8', eyeStyle: 'sparkle', face: 'grin' },
    greeting: 'The palace down there is glowing again. My bubble charm takes four at a time: a tank, a healer, two fighters. Hold your breath!',
    shop: ['red_potion', 'orange_potion', 'white_potion', 'blue_potion', 'mana_elixir', 'return_scroll'],
  },
  tock: {
    id: 'tock', name: 'Tock', title: 'Runaway Tin Soldier', role: 'dungeon', quests: ['story_fair', 'story_gearheart'], dungeon: 'carnival',
    look: { hairStyle: 'bob', hairColor: '#ff8a5a', skinTone: '#fbd9bf', eyeColor: '#3a4aa8', outfitColor: '#e04a5a', eyeStyle: 'round', face: 'determined' },
    greeting: "Psst! I ran away from the Carnival. Her Majesty is wound too tight and none of us can stop. Bring three friends and help me wind her down!",
    shop: ['red_potion', 'orange_potion', 'white_potion', 'blue_potion', 'mana_elixir', 'return_scroll'],
  },
  lumen: {
    id: 'lumen', name: 'Professor Lumen', title: 'Old Stargazer', role: 'dungeon', dungeon: 'observatory', quests: ['lumen_lens', 'lumen_fallen', 'lumen_chips', 'lumen_home'],
    look: { hairStyle: 'wolf', hairColor: '#e9ebfa', skinTone: '#e7b48f', eyeColor: '#5a6ad8', outfitColor: '#3a3a7a', eyeStyle: 'round', face: 'smile' },
    greeting: "The stars have stopped turning, have you noticed? Astraea's doing. I have the key to her tower. Bring a tank, a healer and two fighters, and look up.",
    shop: ['red_potion', 'orange_potion', 'white_potion', 'blue_potion', 'mana_elixir', 'return_scroll'],
  },
  praline: {
    id: 'praline', name: 'Chef Praline', title: 'Runaway Confectioner', role: 'dungeon', quests: ['story_dessert', 'story_bonbon'], dungeon: 'volcano',
    look: { hairStyle: 'fluffybob', hairColor: '#c88a5a', skinTone: '#fbd9bf', eyeColor: '#a8520a', outfitColor: '#ffffff', eyeStyle: 'sparkle', face: 'grin' },
    greeting: "I was the Queen's pastry chef until she started stirring the volcano! If it blows, we're all dessert. Bring a tank, a healer and two fighters... and a spoon.",
    shop: ['red_potion', 'orange_potion', 'white_potion', 'blue_potion', 'mana_elixir', 'return_scroll'],
  },
  encore: {
    id: 'encore', name: 'Madame Encore', title: 'Retired Leading Lady', role: 'dungeon', quests: ['story_encore', 'story_playwright'], dungeon: 'theatre',
    look: { hairStyle: 'wolf', hairColor: '#f2f0f6', skinTone: '#f6d2b8', eyeColor: '#b03050', outfitColor: '#9a2040', eyeStyle: 'sparkle', face: 'smile' },
    greeting: "Forty years I played that stage, darling, and now it plays the audience. I still have my backstage pass. Bring a tank, a healer and two fighters, and never miss your cue.",
    shop: ['red_potion', 'orange_potion', 'white_potion', 'blue_potion', 'mana_elixir', 'return_scroll'],
  },
  nimbus: {
    id: 'nimbus', name: 'Skipper Nimbus', title: 'Whale Sailor', role: 'dungeon', quests: ['story_whale', 'nimbus_sail', 'nimbus_storm', 'nimbus_lantern', 'nimbus_voyage'], dungeon: 'skywhale',
    look: { hairStyle: 'ponytail', hairColor: '#8ac8ff', skinTone: '#f2c8a8', eyeColor: '#2a74c8', outfitColor: '#3a74c8', eyeStyle: 'round', face: 'grin' },
    greeting: "I've sailed that whale's back since I was knee-high to a kite. She's sinking in her sleep, and the pirates are picking her clean. Bring a tank, a healer and two fighters, and hold onto your hat.",
    shop: ['red_potion', 'orange_potion', 'white_potion', 'blue_potion', 'mana_elixir', 'return_scroll'],
  },
  // Posy keeps the Party Board in every town's plaza (world/partyquest.js): party quests for the
  // region at your level, shared by everyone in your party, and Party Tokens to trade.
  // Clover keeps the Puff Buns, marshmallow bunnies you can ride, in Sprout's Pond Garden. Soft
  // spoken and a little scatterbrained; her buns are always getting out.
  clover: {
    id: 'clover', name: 'Clover', title: 'Puff Bun Keeper', role: 'stable',
    look: { hairStyle: 'fluffybob', hairColor: '#fff0f6', hairTip: '#ffb3cf', skinTone: '#fff0e6', eyeColor: '#d0608a', outfitColor: '#ffe3ef', eyeStyle: 'big', earStyle: 'bunny', face: 'smile' },
    greeting: "Oh! Hello! Have you seen a fluffy white bun go by? ...Never mind, there are always more. Do you like riding things?",
    quests: ['clover_count', 'bun_buddy', 'clover_golden', 'clover_parade'],
  },
  // Shelly, a hermit crab carpenter who came with your island (world/home.js): she builds it up a
  // stage at a time from what you bring her. Cheerful, proud of her work, shy when it's quiet; she
  // has grown into a bigger shell every time she's built a bigger house.
  shelly: {
    id: 'shelly', name: 'Shelly', title: 'Island Carpenter', role: 'builder',
    look: { hairStyle: 'fluffybob', hairColor: '#ff9a8a', hairTip: '#ffd2c8', skinTone: '#fff0e6', eyeColor: '#c8506a', outfitColor: '#fff0e6', eyeStyle: 'sparkle', browStyle: 'stubby', face: 'smile' },
    greeting: "Ooh, a visitor! Oh, it's you, it's YOUR island! Bring me the bits and I'll build you something lovely. I've got a whole shell full of ideas!",
  },
  // Malvina Grimsworth, Sprout Village's self-declared villainess, in her spooky little tower on
  // the edge of the village square (where everyone can see it). Every scheme she hatches turns
  // out helpful: her poisons heal, her curses are blessings, and nobody is afraid of her, which
  // she finds deeply upsetting. (Her daily curse is world/malvina.js; her own moves are
  // render/villain-moves.js.)
  malvina: {
    id: 'malvina', name: 'Malvina Grimsworth', title: 'Villainess (Self-Declared)', role: 'shop',
    building: 'villaintower', sign: 'KEEP OUT!',
    look: { hairStyle: 'villainess', hairColor: '#c8304a', skinTone: '#fff0e6', eyeColor: '#ffc040', eyeStyle: 'villain', browStyle: 'sharp', outfit: 'villainessbare', outfitColor: '#3a2a48', earStyle: 'round', face: 'scheme' },
    greeting: "Ohohoho! Trembling, are we? You SHOULD be. Browse my wares of pure EVIL, peasant. ...They're very reasonably priced.",
    shop: ['vial_of_despair', 'poisoned_apple', 'bottled_scream'],
    quests: ['malv_minion', 'malv_well', 'malv_mob', 'malv_diary'],
    chatter: ['Ohohoho!', 'Fear me! ...Please?', 'Today I shall do something TERRIBLE. After lunch.', 'Why does everyone keep THANKING me?'],
  },
  posy: {
    id: 'posy', name: 'Posy', title: 'Party Board', role: 'board',
    look: { hairStyle: 'hearttails', hairColor: '#ffb0d8', skinTone: '#fff0e6', eyeColor: '#7a4ad8', outfitColor: '#ffd6ea', eyeStyle: 'sparkle', face: 'grin' },
    greeting: "Hi hi! Fresh party quests on the board! Everyone in your party chips in, and everyone gets paid. Friends or not, the more the merrier!",
  },
  // ----- Lantern Lagoon (the fishing town across the sea from Pastel Harbor) -----
  // Captain Bobbin sails the Sea Biscuit, a little paddle steamer, between the harbor's quay and
  // Shell Cove (world/voyage.js). Sleepy, kind, and very proud of a boat that runs without wind.
  bobbin: {
    id: 'bobbin', name: 'Captain Bobbin', title: 'The Sea Biscuit', role: 'ferry',
    look: { hairStyle: 'wolfsleek', hairColor: '#f4f4fa', skinTone: '#e7b48f', eyeColor: '#3f6aa8', outfitColor: '#3f5a9a', eyeStyle: 'round', face: 'sleepy' },
    gear: { top: { id: 'sailor_top' } },
    greeting: "Ahh, a passenger! The Sea Biscuit runs on steam, not wind, so she's the only boat still sailing. Where to?",
    chatter: ['Zzz... all aboard... zzz.', "She's not slow, she's scenic.", 'The Biscuit and I have sailed forty years. She does most of the work.'],
  },
  // Mister Brine runs the tackle shop on the boardwalk: rods, bait, and the best price for fish
  // anywhere (he buys every fish for a third more).
  brine: {
    id: 'brine', name: 'Mister Brine', title: 'Tackle & Fish Market', role: 'shop',
    look: { hairStyle: 'wolf', hairColor: '#5a6a8a', skinTone: '#d9a07a', eyeColor: '#2f7a6b', outfitColor: '#ffd66b', eyeStyle: 'round', face: 'cool' },
    greeting: 'Rods, bait, and the best price for fish on the whole sea. I buy every fish for a third more than the mainland. Ask anyone.',
    shop: ['fishing_rod', 'rod_oak', 'rod_maple', 'lantern_bait', 'red_potion', 'return_scroll'],
    fishBonus: 1.34,
    chatter: ['Fresh bait! Glowing bait!', 'I buy fish! Every fish! Even the ugly ones!', 'A third more than the mainland, I tell you.'],
  },
  // Nori: nine years old, the best angler on the island (just ask her), and the Fishing Derby's
  // host. Every hour on the hour (world/derby.js).
  nori: {
    id: 'nori', name: 'Nori', title: 'Fishing Derby', role: 'derby',
    look: { hairStyle: 'fluffybob', hairColor: '#ff9e7a', skinTone: '#fbd9bf', eyeColor: '#2fa8c8', outfitColor: '#8fe0e8', eyeStyle: 'sparkle', face: 'proud' },
    greeting: "I'm Nori, and I hold the island record. Every hour on the hour it's the Fishing Derby: biggest catch wins! Think you can beat me?",
    chatter: ['I caught a fish THIS big once. Bigger, actually.', 'Derby on the hour! Be there!', "I'm not bragging if it's true."],
  },
  // Coral (and her twin Pearl, at the pots) run the noodle stall: fish noodles to buy, and the
  // stove to cook your own catch.
  coral: {
    id: 'coral', name: 'Coral', title: 'Twin Noodles', role: 'shop',
    look: { hairStyle: 'twintails', hairColor: '#ff8fb0', skinTone: '#fbe2cf', eyeColor: '#e05a7a', outfitColor: '#ffffff', eyeStyle: 'sparkle', face: 'giggle' },
    greeting: "Welcome to Twin Noodles! Pearl cooks, I talk. Bring your catch to our stove and cook it yourself, or buy a bowl of ours!",
    shop: ['dish_twinnoodles', 'dish_lanternskewer', 'red_potion', 'blue_potion'],
    chatter: ['Noodles! Hot noodles!', 'Pearl, the pot is boiling over!', 'Twin Noodles: twice the noodles, twice the fun!'],
  },
  // Granny Kelp keeps the lighthouse on the point, and the island's old stories: why the sea has
  // gone strange, and what lives in the deep water under the light (data/quests.js).
  kelp: {
    id: 'kelp', name: 'Granny Kelp', title: 'Lighthouse Keeper', role: 'guide',
    look: { hairStyle: 'bun', hairColor: '#dfe2ee', skinTone: '#f2c8a8', eyeColor: '#6a5ac8', outfitColor: '#8fa8ff', eyeStyle: 'round', face: 'smug' },
    greeting: "Mind the steps, dearie, they're older than me. Nearly.",
    chatter: ['The light needs oil, and I need tea.', 'Old Lumen used to glow right under my window.', "Sixty years I've kept this light. It's never once gone out."],
    quests: ['kelp_1', 'kelp_2', 'kelp_3', 'kelp_4', 'kelp_5'],
  },
  marlo: {
    id: 'marlo', name: 'Marlo', title: 'Merchant', role: 'shop',
    storage: 'Storage is free. I KNOW. Shocking. Your other heroes can take it out too.',
    building: 'cart', sign: "Marlo's Wares",
    look: { hairStyle: 'fluffybob', hairColor: '#ffb38a', skinTone: '#fbd9bf', eyeColor: '#1f7a6b', outfitColor: '#ffd66b', eyeStyle: 'sparkle', face: 'sassy' },
    greeting: 'Finest goods on the coast. Bows, blades, armor, and tonics!',
    shop: ['fishing_rod', 
      'red_potion', 'orange_potion', 'white_potion', 'blue_potion', 'mana_elixir', 'return_scroll',
      ...arms(15, 40, 'bow', 'crossbow', 'dagger', 'gauntlet'),
      'hoodie', 'kitty_ears', 'sailor_top',
    ],
    stockLevels: [15, 40],
    quests: ['marlo_scales', 'tusk_trader', 'marlo_key', 'marlo_spa'],
  },
};

// What a shop offers this hero: its fixed stock, then job gear in its level range. Weapons a
// job can't use are left out (a Novice sees them all), and job sets show for the hero's own
// job, or every job's starter set for a Novice.
export function shopStock(npc, char) {
  const job = JOBS[char.job];
  const usable = (id) => ITEMS[id].slot !== 'weapon' || char.job === 'novice' || job.family === 'gm' || job.weapons.includes(ITEMS[id].weaponType);
  const out = (npc.shop ?? []).filter(usable);
  if (!npc.stockLevels) return out;
  const families = GEAR_FAMILIES.includes(job.family) ? [job.family] : GEAR_FAMILIES;
  for (let L = npc.stockLevels[0]; L <= npc.stockLevels[1]; L += 5) {
    for (const family of families) {
      if (char.job === 'novice' && L > 5) continue;
      for (const slot of JOB_SLOTS) out.push(jobGearId(family, slot, L));
    }
  }
  // Consumables first, then weapons, armor, and earrings, each by level.
  const rank = (d) => (d.type !== 'equip' ? 0 : d.slot === 'weapon' ? 1 : d.slot === 'earring' ? 3 : 2);
  const order = new Map(out.map((id, i) => [id, i]));
  return out.sort((a, b) => rank(ITEMS[a]) - rank(ITEMS[b]) || (rank(ITEMS[a]) ? ITEMS[a].reqLevel - ITEMS[b].reqLevel : 0) || order.get(a) - order.get(b));
}

// The six Sweethearts (data/sweethearts.js): townsfolk you can befriend or date, each in their own
// outfit (data/outfits-costume.js, never sold).
for (const h of Object.values(SWEETHEARTS)) {
  const covers = ['top', ...(COSTUME_LOOKS.find((c) => c.key === h.outfit)?.covers ?? [])];
  NPCS[h.id] = {
    id: h.id, name: h.name, title: h.title, role: 'sweetheart', look: h.look,
    gear: Object.fromEntries(covers.map((slot) => [slot, { id: `look_costume_${h.outfit}_${slot}`, variant: null }])),
    greeting: h.talk[0][0],
    ...(h.quests ? { quests: h.quests } : {}),
  };
}

// ---------- Everyone their own look (2026-11-07, the player's ask) ----------
// Every named NPC has a hairstyle no other named NPC wears, their own eyes, face and brows, and an
// outfit that says who they are (the sweethearts and the instructors already dress as themselves).
// Pieces are the drawn looks of everyday clothes and accessories (look_casual_*, look_acc_*: what
// the Cash shop's items wear as); `costume` puts them in a whole costume (data/outfits-costume.js).
const piece = (id) => ({ id, variant: null });
const costume = (key) => {
  const covers = ['top', ...(COSTUME_LOOKS.find((c) => c.key === key)?.covers ?? [])];
  return Object.fromEntries(covers.map((slot) => [slot, piece(`look_costume_${key}_${slot}`)]));
};
// ---------- Coinbridge, the canal trading town (2026-11-07) ----------
// Each with a hairstyle nobody else wears, their own face, and clothes that say who they are.
const cbPiece = (id) => ({ id, variant: null });
const cbCostume = (key) => {
  const covers = ['top', ...(COSTUME_LOOKS.find((c) => c.key === key)?.covers ?? [])];
  return Object.fromEntries(covers.map((slot) => [slot, cbPiece(`look_costume_${key}_${slot}`)]));
};
Object.assign(NPCS, {
  ledger: {
    id: 'ledger', name: 'Madame Ledger', title: 'Auctioneer', role: 'auction',
    look: { hairStyle: 'drills', hairColor: '#8a4a8a', skinTone: '#fbd9bf', eyeColor: '#c84a8a', outfitColor: '#5a3a6a', eyeStyle: 'cat', face: 'smug', browStyle: 'arched' },
    gear: { ...cbCostume('gothic'), face: cbPiece('look_acc_cateye_face'), cape: cbPiece('look_acc_royalcape_cape') },
    greeting: "Going once, going twice... oh! A new face. Buy, bid, or sell, darling: every trader in the world comes through my doors. Do bring something shiny.",
    chatter: ['Going once! Going twice!', 'Everything has a price, darling.', 'Sold! To the lady in pink!'],
  },
  halvard: {
    id: 'halvard', name: 'Guildmaster Halvard', title: "Adventurers' Guild", role: 'guild',
    look: { hairStyle: 'wolfsleek', hairColor: '#c8ccd8', skinTone: '#e8b890', eyeColor: '#4a6aa8', outfitColor: '#7a5a44', eyeStyle: 'droopy', face: 'heh', browStyle: 'thick' },
    gear: { ...cbCostume('detective'), face: cbPiece('look_acc_eyepatch_face') },
    greeting: "Forty years of adventuring, one good leg, and a head full of stories. The board's full of elites that need putting down. Let's see what you're made of.",
    chatter: ['Did I ever tell you about the Hollow King? No? Sit down.', 'Copper, Silver, Gold, Mithril. Everyone starts at Copper.', "This leg? A mimic. Don't ask."],
  },
  penny: {
    id: 'penny', name: 'Penny', title: 'Trade Hall Clerk', role: 'trade',
    look: { hairStyle: 'bowhair', hairColor: '#ffb86a', skinTone: '#fbe0c8', eyeColor: '#3f8a6a', outfitColor: '#ff9ec0', eyeStyle: 'round', face: 'mmhm', browStyle: 'round' },
    gear: { top: cbPiece('look_casual_cardigan_top'), bottom: cbPiece('look_casual_plaid_bottom'), shoes: cbPiece('look_casual_loafers_shoes'), face: cbPiece('look_acc_biground_face') },
    greeting: 'Welcome to the Trade Hall! Every sale, every bounty, every good turn: it all goes in my book. Do enough and Coinbridge will give you a stall of your own!',
    chatter: ['Stamp, stamp, stamp.', 'Every coin counted twice.', 'Form 27-B, in triplicate.'],
  },
  juniper: {
    id: 'juniper', name: 'Juniper', title: 'Innkeeper', role: 'inn',
    look: { hairStyle: 'catbun', hairColor: '#c8603a', skinTone: '#f6cfae', eyeColor: '#7a4a2b', outfitColor: '#ffd98a', eyeStyle: 'big', face: 'smile', browStyle: 'soft' },
    gear: { top: cbPiece('look_casual_pinafore_top'), bottom: cbPiece('look_casual_flowerskirt_bottom'), shoes: cbPiece('look_casual_loafers_shoes'), cape: cbPiece('look_casual_scarf_cape') },
    greeting: "Come in, come in, out of the wind! There's soup on and a fire going. And if you're tired, love, I've a room with your name on it.",
    chatter: ['Soup, anyone?', "Mind the stair, it creaks.", "Wendell, that's your third cocoa."],
  },
  wendell: {
    id: 'wendell', name: 'Old Wendell', title: 'Regular', role: 'rumor',
    look: { hairStyle: 'buzzcut', hairColor: '#eeeef4', skinTone: '#e0a882', eyeColor: '#5a6a8a', outfitColor: '#8a9a6a', eyeStyle: 'droopy', face: 'toldyou', browStyle: 'thick' },
    gear: { top: cbPiece('look_casual_sweatervest_top'), bottom: cbPiece('look_casual_cargo_bottom'), shoes: cbPiece('look_casual_rainboots_shoes'), hat: cbPiece('look_casual_cap_hat'), face: cbPiece('look_casual_glasses_face') },
    greeting: "Psst. Sit down, sit down. You look like someone who likes a good rumour. I hear everything in here. Everything.",
    chatter: ['I heard a thing...', "Don't tell anyone I told you.", 'Back in my day...'],
  },
  tilly: {
    id: 'tilly', name: 'Tilly', title: 'Card Shark', role: 'cards',
    look: { hairStyle: 'starbuns', hairColor: '#8fd0ff', skinTone: '#ffe0cc', eyeColor: '#ff6b9a', outfitColor: '#ffe36b', eyeStyle: 'sparkle', face: 'playful', browStyle: 'dots' },
    gear: { top: cbPiece('look_casual_stripes_top'), bottom: cbPiece('look_casual_jorts_bottom'), shoes: cbPiece('look_casual_hightops_shoes'), hat: cbPiece('look_casual_catears_hat'), face: cbPiece('look_acc_heartstickers_face') },
    greeting: "Wanna play cards? I'm REALLY good. I'm not cheating. That card was always in my sleeve.",
    chatter: ['Pick a card! Not that one.', "I'm not cheating!", 'Royal flush! ...Is that a thing?'],
  },
  moth: {
    id: 'moth', name: 'The Masked Moth', title: 'Night Trader', role: 'night', night: true,
    look: { hairStyle: 'hexlong', hairColor: '#4a3a6a', skinTone: '#f0d8e0', eyeColor: '#b88aff', outfitColor: '#3a2a4a', eyeStyle: 'star', face: 'cool', browStyle: 'none' },
    gear: { ...cbCostume('ballet'), face: cbPiece('look_acc_masquerade_face'), cape: cbPiece('look_acc_butterfly_cape') },
    greeting: 'Ah, a little flame, drawn to my lamps. Look, but quickly: when the sun comes up, all of this is gone.',
    chatter: ['Something rare tonight.', 'Only once. Only now.', 'Hush. The lamps are listening.'],
  },
});

const OWN_LOOKS = {
  // Sprout Village.
  mira: { look: { eyeStyle: 'jewel', face: 'excited', browStyle: 'round' }, gear: { top: piece('look_casual_stripes_top'), bottom: piece('look_casual_flowerskirt_bottom'), shoes: piece('look_casual_sandals_shoes'), hat: piece('look_casual_sunhat_hat') } },
  pip: { look: { eyeStyle: 'round', face: 'grin', browStyle: 'stubby' }, gear: { top: piece('look_casual_pinafore_top'), bottom: piece('look_casual_pinafore_bottom'), shoes: piece('look_casual_loafers_shoes'), hat: piece('look_casual_bow_hat'), cape: piece('look_casual_tote_cape') } },
  lulu: { look: { eyeStyle: 'sparkle', face: 'sassy', browStyle: 'arched' }, gear: { bottom: piece('look_casual_idol_bottom'), top: piece('look_casual_idol_top'), shoes: piece('look_casual_platforms_shoes'), face: piece('look_casual_sunglasses_face'), cape: piece('look_acc_bigbow_cape') } },
  clover: { look: { eyeStyle: 'big', face: 'giggle', browStyle: 'dots' }, gear: { bottom: piece('look_casual_onepiece_bottom'), top: piece('look_casual_onepiece_top'), shoes: piece('look_casual_rainboots_shoes'), hat: piece('look_acc_flowercrown_hat') } },
  shelly: { look: { hairStyle: 'braids', eyeStyle: 'droopy', face: 'dimple', browStyle: 'soft' }, gear: { top: piece('look_casual_tee_top'), bottom: piece('look_casual_jorts_bottom'), shoes: piece('look_casual_hightops_shoes'), hat: piece('look_casual_cap_hat') } },
  posy: { look: { eyeStyle: 'star', face: 'excited', browStyle: 'thin' }, gear: { top: piece('look_casual_cardigan_top'), bottom: piece('look_casual_tennis_bottom'), shoes: piece('look_casual_sandals_shoes'), cape: piece('look_acc_heartwings_cape') } },
  // The beach and the docks.
  kuro: { look: { hairStyle: 'longtied', eyeStyle: 'droopy', face: 'heh', browStyle: 'thick' }, gear: costume('yukata') },
  // Harbor Town.
  rook: { look: { hairStyle: 'pompadour', eyeStyle: 'jewel', face: 'proud', browStyle: 'sharp' }, gear: costume('pirate') },
  marina: { look: { hairStyle: 'wavylong', eyeStyle: 'jewel', face: 'giggle', browStyle: 'soft' }, gear: { top: piece('look_casual_rashguard_top'), bottom: piece('look_casual_boardshorts_bottom'), shoes: piece('look_casual_flipflops_shoes'), face: piece('look_casual_goggles_face'), cape: piece('look_casual_swimring_cape') } },
  bobbin: { look: { hairStyle: 'crewcut', eyeStyle: 'droopy', face: 'sleepy', browStyle: 'thick' }, gear: { top: piece('look_casual_sailor_top'), bottom: piece('look_casual_sailor_bottom'), shoes: piece('look_casual_rainboots_shoes'), cape: piece('look_casual_scarf_cape') } },
  marlo: { look: { hairStyle: 'shoulderbraid', eyeStyle: 'jewel', face: 'sassy', browStyle: 'arched' }, gear: { ...costume('tuxedo'), face: piece('look_acc_monocle_face') } },
  // Ember Crag.
  tora: { look: { hairStyle: 'tomboy', eyeStyle: 'cat', face: 'determined', browStyle: 'thick' }, gear: { top: piece('look_casual_flannel_top'), bottom: piece('look_casual_cargo_bottom'), shoes: piece('look_casual_hightops_shoes'), face: piece('look_casual_goggles_face') } },
  // Moonleaf Grove.
  nim: { look: { hairStyle: 'kokeshi', eyeStyle: 'star', face: 'shy', browStyle: 'round' }, gear: { top: piece('look_casual_cardigan_top'), bottom: piece('look_casual_flowerskirt_bottom'), shoes: piece('look_casual_loafers_shoes'), face: piece('look_casual_glasses_face'), hat: piece('look_acc_starclips_hat') } },
  // The dungeon gates.
  bramble: { look: { hairStyle: 'curlycrop', eyeStyle: 'big', face: 'excited', browStyle: 'stubby' }, gear: { top: piece('look_casual_track_top'), bottom: piece('look_casual_cargo_bottom'), shoes: piece('look_casual_rainboots_shoes'), hat: piece('look_acc_leafcrown_hat'), cape: piece('look_casual_backpack_cape') } },
  pumpkins: { look: { hairStyle: 'stubtail', eyeStyle: 'droopy', face: 'nervous', browStyle: 'thin' }, gear: { top: piece('look_casual_sweatervest_top'), bottom: piece('look_casual_plaid_bottom'), shoes: piece('look_casual_loafers_shoes'), hat: piece('look_casual_bucket_hat') } },
  tock: { look: { hairStyle: 'bowlcut', eyeStyle: 'round', face: 'determined', browStyle: 'dots' }, gear: { top: piece('look_casual_varsity_top'), bottom: piece('look_casual_trackpants_bottom'), shoes: piece('look_casual_hightops_shoes') } },
  lumen: { look: { hairStyle: 'slickback', eyeStyle: 'round', face: 'mmhm', browStyle: 'thick' }, gear: { top: piece('look_casual_cardigan_top'), bottom: piece('look_casual_plaid_bottom'), shoes: piece('look_casual_loafers_shoes'), face: piece('look_acc_monocle_face'), cape: piece('look_acc_starcape_cape') } },
  praline: { look: { hairStyle: 'halfup', eyeStyle: 'sparkle', face: 'excited', browStyle: 'round' }, gear: { top: piece('look_casual_chef_top'), bottom: piece('look_casual_tennis_bottom'), shoes: piece('look_casual_loafers_shoes'), hat: piece('look_casual_chefhat_hat') } },
  encore: { look: { hairStyle: 'princess', eyeStyle: 'jewel', face: 'ohoho', browStyle: 'arched' }, gear: costume('ballgown') },
  nimbus: { look: { hairStyle: 'sidecrop', eyeStyle: 'round', face: 'grin', browStyle: 'sharp' }, gear: costume('aviator') },
  // Lantern Lagoon.
  brine: { look: { hairStyle: 'shavedside', eyeStyle: 'cat', face: 'hmph', browStyle: 'sharp' }, gear: { top: piece('look_casual_parka_top'), bottom: piece('look_casual_cargo_bottom'), shoes: piece('look_casual_rainboots_shoes'), hat: piece('look_casual_visor_hat') } },
  nori: { look: { hairStyle: 'sidetail', eyeStyle: 'sparkle', face: 'proud', browStyle: 'arched' }, gear: costume('cheer') },
  coral: { look: { hairStyle: 'lowtails', eyeStyle: 'big', face: 'giggle', browStyle: 'round' }, gear: { top: piece('look_casual_stripes_top'), bottom: piece('look_casual_jorts_bottom'), shoes: piece('look_casual_sandals_shoes'), hat: piece('look_casual_headphones_hat') } },
  kelp: { look: { hairStyle: 'crownbraid', eyeStyle: 'droopy', face: 'smug', browStyle: 'thin' }, gear: { top: piece('look_casual_raincoat_top'), bottom: piece('look_casual_plaid_bottom'), shoes: piece('look_casual_rainboots_shoes'), face: piece('look_casual_glasses_face'), hat: piece('look_casual_pompom_hat') } },
  // The instructors keep their job's gear; two take new hair so nobody shares.
  vex: { look: { hairStyle: 'sharpbob', eyeStyle: 'cat' } },
};
for (const [id, own] of Object.entries(OWN_LOOKS)) {
  const npc = NPCS[id];
  if (!npc) continue;
  npc.look = { ...npc.look, ...own.look };
  if (own.gear) npc.gear = { ...(npc.gear ?? {}), ...own.gear };
}
