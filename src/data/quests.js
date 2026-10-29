// Quests. Objectives: kill a monster N times; collect N of an item (handed in on completion);
// talk to an NPC (`say` is what they answer); deliver an item to an NPC (`gives` hands it to you
// on accepting); or visit a map (`above`: climb above that height there). Talks and deliveries
// in one quest go in order. A quest with no objectives completes as soon as you accept it.
// `daily` quests can be done again every new day. Rewards may add `cash`, and cash outfit pieces
// go in `items` like anything else.

// A reward marked `forJob` is job gear: the hero gets their own job's piece instead (the id names
// the slot and level). `variant` gives it a color ('roll' picks one).
export const QUESTS = {
  // Dawnlight Isle, the tutorial (Kuro; world/tutorial.js).
  tut_hello: {
    id: 'tut_hello', name: 'Washed Ashore', giver: 'kuro', minLevel: 1,
    text: "Here, some tonics, and pick a practice weapon: a sword (STR, the Warrior's way), a wand (INT, the Spirit Mage's), a bow (DEX, the Archer's) or a dagger (LUK, the Thief's). Not sure yet? No harm: your first job gives your stat points back.",
    objectives: [],
    // `pick`: the player chooses one of these, as well as the items.
    rewards: { exp: 5, gold: 20, items: [{ id: 'red_potion', qty: 5 }], pick: ['sword_0', 'wand_0', 'bow_0', 'dagger_0'] },
  },
  tut_practice: {
    id: 'tut_practice', name: 'Practice Makes Perfect', giver: 'kuro', minLevel: 1, prereq: 'tut_hello',
    text: 'Those Kitsune Kits are harmless, they just love a game of chase. Defeat 3 with Z and pick up 3 Fox Fluff with X.',
    objectives: [{ type: 'kill', mob: 'puffle', count: 3 }, { type: 'collect', item: 'fluff', count: 3 }],
    rewards: { exp: 40, gold: 60, items: [{ id: 'blue_potion', qty: 5 }] },
  },
  tut_farewell: {
    id: 'tut_farewell', name: 'Set Sail', giver: 'kuro', minLevel: 1, prereq: 'tut_practice',
    text: "You're ready! The boat at the end of the dock goes to Sprout Village. Find Mira there, she'll look after you. Good luck out there!",
    objectives: [],
    rewards: { exp: 20, gold: 100, items: [] },
  },
  first_steps: {
    id: 'first_steps', name: 'First Steps', giver: 'mira', minLevel: 1,
    text: "Every adventurer needs a weapon! Take this sword and some tonics. Equip it from your bag (I), then head east to Petal Meadow.",
    objectives: [],
    rewards: { exp: 10, gold: 50, items: [{ id: 'bottom_0', qty: 1 }, { id: 'red_potion', qty: 10 }] },
  },
  fluffy: {
    id: 'fluffy', name: 'Fluffy Business', giver: 'mira', minLevel: 1, prereq: 'first_steps',
    text: 'The Kitsune Kits in Petal Meadow shed the softest fluff. Could you bring me 8 Fox Fluff?',
    objectives: [{ type: 'collect', item: 'fluff', count: 8 }],
    rewards: { exp: 60, gold: 200, items: [{ id: 'hat_0', qty: 1 }] },
  },
  snail_trouble: {
    id: 'snail_trouble', name: 'Tortoise Trouble', giver: 'pip', minLevel: 3,
    text: "Moss Tortoises keep nibbling my crates! Defeat 12 of them and I'll pay you in tonics.",
    objectives: [{ type: 'kill', mob: 'snailbun', count: 12 }],
    rewards: { exp: 150, gold: 300, items: [{ id: 'red_potion', qty: 15 }, { id: 'blue_potion', qty: 5 }] },
  },
  sprout_sweep: {
    id: 'sprout_sweep', name: 'Sprout Sweep', giver: 'mira', minLevel: 5, prereq: 'fluffy',
    text: 'Mandrakes are screaming all over Clover Hills, past the meadow. Defeat 10 of them!',
    objectives: [{ type: 'kill', mob: 'sproutling', count: 10 }],
    rewards: { exp: 450, gold: 500, items: [{ id: 'shoes_0', qty: 1 }, { id: 'top_0', qty: 1 }] },
  },
  hollow_heart: {
    id: 'hollow_heart', name: 'Heart of the Hollow', giver: 'bramble', minLevel: 10,
    text: "Gnarlroot has been grumbling under the canyon for a week, and the whole Hollow woke up with him. Take a group down and calm him. Talk to me again when you're ready to go in.",
    objectives: [{ type: 'kill', mob: 'gnarlroot', count: 1 }],
    rewards: { exp: 5000, gold: 3000, items: [{ id: 'warrior_cape_15', qty: 1, forJob: true, variant: 'roll' }, { id: 'hollow_acorn', qty: 5 }] },
  },
  mush_menace: {
    id: 'mush_menace', name: 'Toadstool Trouble', giver: 'rook', minLevel: 8,
    text: 'Toadstool Goblins have been sneaking onto the docks. Clear out 20 of them in Clover Hills.',
    objectives: [{ type: 'kill', mob: 'mushkin', count: 20 }],
    rewards: { exp: 1400, gold: 800, items: [{ id: 'scroll_watk_60', qty: 1 }, { id: 'orange_potion', qty: 20 }] },
  },
  leaf_samples: {
    id: 'leaf_samples', name: 'Leaf Samples', giver: 'rook', minLevel: 12, prereq: 'mush_menace',
    text: 'Our herbalist needs 20 Dryad Leaves from the Dryads in Mossy Woods.',
    objectives: [{ type: 'collect', item: 'leaf_fragment', count: 20 }],
    rewards: { exp: 3500, gold: 1500, items: [{ id: 'warrior_gloves_15', qty: 1, forJob: true }, { id: 'scroll_glove_60', qty: 1 }] },
  },
  tusk_trader: {
    id: 'tusk_trader', name: 'Fang Trader', giver: 'marlo', minLevel: 15,
    text: "Warg fangs sell like hotcakes. Bring me 15 and I'll share the profits.",
    objectives: [{ type: 'collect', item: 'tusk', count: 15 }],
    rewards: { exp: 6000, gold: 4000, items: [{ id: 'scroll_def_60', qty: 2 }] },
  },
  restless_ruins: {
    id: 'restless_ruins', name: 'Restless Ruins', giver: 'rook', minLevel: 20, prereq: 'leaf_samples',
    text: 'Headless Dullahans ride the Twilight Ruins at night. Put 25 of them to rest.',
    objectives: [{ type: 'kill', mob: 'boneknight', count: 25 }],
    rewards: { exp: 18000, gold: 6000, items: [{ id: 'scroll_watk_10', qty: 1 }, { id: 'ear_20', qty: 1, variant: 'roll' }] },
  },
  // A job trial: Brann asks it of a warrior before teaching either level 30 path (`family` keeps
  // it to warriors).
  warrior_trial: {
    id: 'warrior_trial', name: "The Warrior's Trial", giver: 'brann', minLevel: 30, family: 'warrior',
    text: "You've grown strong, but the next path asks more than strength. Go to the Crystal Cave and break 20 Crystal Golems. Stand your ground the whole time. Come back and I'll show you the Paladin's way and the Berserker's way.",
    objectives: [{ type: 'kill', mob: 'rockgolem', count: 20 }],
    rewards: { exp: 40000, gold: 8000, items: [{ id: 'elixir', qty: 5 }] },
  },
  // Kestrel's trial for an archer before either level 30 path.
  archer_trial: {
    id: 'archer_trial', name: "The Archer's Trial", giver: 'kestrel', minLevel: 30, family: 'archer',
    text: "Anyone can hit a slime. A real archer hits what flies. Go to the Crystal Cave and shoot down 15 Wraiths, then come back and I'll show you the Ranger's way and the Sniper's way.",
    objectives: [{ type: 'kill', mob: 'shade', count: 15 }],
    rewards: { exp: 40000, gold: 8000, items: [{ id: 'elixir', qty: 5 }] },
  },
  // Elowen's trial for a Spirit Mage before either level 30 path (the Shrine Maiden, the Onmyoji).
  spiritmage_trial: {
    id: 'spiritmage_trial', name: "The Spirit Mage's Trial", giver: 'elowen', minLevel: 30, family: 'mage',
    text: "Deep in the Crystal Cave the Wraiths wander, spirits who've forgotten the way to rest. A Spirit Mage doesn't fight them: she dances them home. Lay 20 of them to rest, then come back and I'll show you the Shrine Maiden's way and the Onmyoji's way.",
    objectives: [{ type: 'kill', mob: 'shade', count: 20 }],
    rewards: { exp: 40000, gold: 8000, items: [{ id: 'elixir', qty: 5 }] },
  },
  // Vex's trial for a thief before either level 30 path (the Shinobi, the Kitsune).
  thief_trial: {
    id: 'thief_trial', name: "The Thief's Trial", giver: 'vex', minLevel: 30, family: 'thief',
    text: "Fast hands are nothing if the dark doesn't trust you. The Dullahans in the Twilight Ruins ride at night. Put 20 of them down before they see you coming, then come back and I'll show you the Shinobi's way and the Kitsune's way.",
    objectives: [{ type: 'kill', mob: 'boneknight', count: 20 }],
    rewards: { exp: 40000, gold: 8000, items: [{ id: 'elixir', qty: 5 }] },
  },
  crystal_heart: {
    id: 'crystal_heart', name: 'Heart of Crystal', giver: 'rook', minLevel: 35, prereq: 'restless_ruins',
    text: 'Deep in the Crystal Cave sits Prismaris, the Crystal King. Defeat it and bring peace to the coast.',
    objectives: [{ type: 'kill', mob: 'crystalking', count: 1 }],
    rewards: { exp: 150000, gold: 50000, items: [{ id: 'warrior_cape_40', qty: 1, forJob: true, variant: 'gilded' }, { id: 'elixir', qty: 10 }] },
  },

  // ---------- Side quests: every town's people, every field ----------

  // Sprout Village.
  pip_parcel: {
    id: 'pip_parcel', name: 'Special Delivery', giver: 'pip', minLevel: 3,
    text: "This parcel came in for Captain Rook, but I can't leave the shop! Pastel Harbor is just past Petal Meadow, the other way from the hills. Would you take it to him?",
    gives: [{ id: 'parcel' }],
    objectives: [{ type: 'deliver', npc: 'rook', item: 'parcel', say: "A parcel from Pip? Ha! My new compass, finally. Tell her thanks!" }],
    rewards: { exp: 180, gold: 300, items: [{ id: 'return_scroll', qty: 3 }, { id: 'red_potion', qty: 10 }] },
  },
  lulu_gossip: {
    id: 'lulu_gossip', name: 'Town Gossip', giver: 'lulu', minLevel: 3,
    text: "Be a dear and ask around: what does everyone think of my new window display? Mira, Pip and Kestrel. Don't tell them I sent you!",
    objectives: [
      { type: 'talk', npc: 'mira', say: "Lulu's window? Those little hats with ears are adorable!" },
      { type: 'talk', npc: 'pip', say: "It's lovely. The pink is very... pink." },
      { type: 'talk', npc: 'kestrel', say: "Tell her the feathered cap is perfect. Don't tell her I said so." },
    ],
    rewards: { exp: 220, gold: 400, cash: 300, items: [{ id: 'cash_casual_bow', qty: 1 }] },
  },
  lulu_runway: {
    id: 'lulu_runway', name: 'Runway Ready', giver: 'lulu', minLevel: 8, prereq: 'lulu_gossip',
    text: "Inspiration struck! A spring line with fluffy trim and antler buttons. I need 10 Fox Fluff from the Kitsune Kits and 8 Jackalope Antlers from Clover Hills. The first piece is yours!",
    objectives: [{ type: 'collect', item: 'fluff', count: 10 }, { type: 'collect', item: 'ribbon', count: 8 }],
    rewards: { exp: 1300, gold: 800, items: [{ id: 'cash_casual_cardigan', qty: 1 }] },
  },
  kestrel_targets: {
    id: 'kestrel_targets', name: 'Moving Targets', giver: 'kestrel', minLevel: 7,
    text: "Standing targets teach you nothing. The Jackalopes in Clover Hills never stop hopping: catch 15 of them, whatever you fight with, and you'll have quick eyes for life.",
    objectives: [{ type: 'kill', mob: 'piglet', count: 15 }],
    rewards: { exp: 1000, gold: 600, items: [{ id: 'orange_potion', qty: 15 }, { id: 'scroll_glove_60', qty: 1 }] },
  },
  mira_letter: {
    id: 'mira_letter', name: 'A Letter for Elowen', giver: 'mira', minLevel: 10, prereq: 'sprout_sweep',
    text: "Elowen and I were apprentices together, long ago. She keeps the spirits' grove now, in Moonleaf Grove past Mossy Woods. Would you take her this letter? It's been far too long.",
    gives: [{ id: 'letter' }],
    objectives: [{ type: 'deliver', npc: 'elowen', item: 'letter', say: "From Mira? Oh, she still dots her i's with hearts. Thank you, traveler." }],
    rewards: { exp: 2000, gold: 1000, items: [{ id: 'blue_potion', qty: 20 }] },
  },
  daily_meadow: {
    id: 'daily_meadow', name: 'Daily: Hill Patrol', giver: 'mira', minLevel: 6, daily: true,
    text: "The Toadstool Goblins sneak back into Clover Hills every night. Help me keep them in check: 15 will do for today.",
    objectives: [{ type: 'kill', mob: 'mushkin', count: 15 }],
    rewards: { exp: 700, gold: 500, items: [{ id: 'orange_potion', qty: 5 }] },
  },

  // Pastel Harbor.
  canyon_eggs: {
    id: 'canyon_eggs', name: 'Scaly Situation', giver: 'rook', minLevel: 9,
    text: "Basilisks are nesting in Windy Canyon, north of Petal Meadow, and the hatchlings are biting my sailors' boots. Defeat 15 of the little biters.",
    objectives: [{ type: 'kill', mob: 'pebblet', count: 15 }],
    rewards: { exp: 1500, gold: 900, items: [{ id: 'red_potion', qty: 20 }] },
  },
  canyon_stingers: {
    id: 'canyon_stingers', name: 'Stinging Remarks', giver: 'rook', minLevel: 11, prereq: 'canyon_eggs',
    text: "The Manticore Cubs up there are worse. Bring me 12 of their stingers so the herbalist can brew an antidote for the crew.",
    objectives: [{ type: 'collect', item: 'stinger', count: 12 }],
    rewards: { exp: 2600, gold: 1200, items: [{ id: 'warrior_shoes_10', qty: 1, forJob: true, variant: 'roll' }] },
  },
  canyon_lookout: {
    id: 'canyon_lookout', name: 'The Lookout', giver: 'rook', minLevel: 12, prereq: 'canyon_stingers',
    text: "Something's stirring under that canyon. Climb to the very top ledge of Windy Canyon and take a good look, then tell Bramble at the Hollow Gate what you saw. He'll want to know.",
    objectives: [
      { type: 'visit', map: 'canyon', above: 330, place: 'the top of Windy Canyon' },
      { type: 'talk', npc: 'bramble', say: "Roots moving under the rock? Then Gnarlroot's waking. Thank you: I'll need brave folk soon." },
    ],
    rewards: { exp: 3200, gold: 1500, items: [{ id: 'hollow_acorn', qty: 3 }, { id: 'orange_potion', qty: 20 }] },
  },
  marlo_scales: {
    id: 'marlo_scales', name: 'Shiny Scales', giver: 'marlo', minLevel: 9,
    text: "Basilisk scales! Ladies in the capital sew them on their gloves. Bring me 15 and I'll make it worth your while.",
    objectives: [{ type: 'collect', item: 'pebble', count: 15 }],
    rewards: { exp: 1400, gold: 2000, items: [] },
  },
  vex_rumor: {
    id: 'vex_rumor', name: 'A Quiet Word', giver: 'vex', minLevel: 14,
    text: "Word is someone's buying up Wisp Flames on the quiet. Ask Marlo who's been selling, then ask Tora in Ember Crag who's been buying. Keep it casual.",
    objectives: [
      { type: 'talk', npc: 'marlo', say: "Wisp Flames? Some kid from the Grove sold me a whole jar. Said they were 'escapees'." },
      { type: 'talk', npc: 'tora', say: "Buying? Not me. Nim from the Grove lost a box of candles, though. Poor thing hasn't slept." },
    ],
    rewards: { exp: 4000, gold: 2500, items: [{ id: 'scroll_luck_60', qty: 1 }] },
  },
  rook_harpies: {
    id: 'rook_harpies', name: 'Harpy Havoc', giver: 'rook', minLevel: 40, prereq: 'crystal_heart',
    text: "The Sky Harpies have started raiding our gulls' nests, all the way from the Sky Garden! Ground 30 of them.",
    objectives: [{ type: 'kill', mob: 'windbird', count: 30 }],
    rewards: { exp: 120000, gold: 30000, items: [{ id: 'warrior_hat_40', qty: 1, forJob: true, variant: 'roll' }] },
  },
  daily_harbor: {
    id: 'daily_harbor', name: 'Daily: Warg Watch', giver: 'rook', minLevel: 14, daily: true,
    text: "Wargs keep circling the woods road where our carts go. Thin the pack: 20 Wargs today.",
    objectives: [{ type: 'kill', mob: 'boarlet', count: 20 }],
    rewards: { exp: 4500, gold: 1500, items: [{ id: 'orange_potion', qty: 10 }] },
  },

  // Ember Crag.
  tora_handles: {
    id: 'tora_handles', name: 'Heartwood Handles', giver: 'tora', minLevel: 17,
    text: "The best hilts are Heartwood, straight from a Treant in Mossy Woods. Bring me 12 and I'll put an edge on your gear.",
    objectives: [{ type: 'collect', item: 'moss_stone', count: 12 }],
    rewards: { exp: 7000, gold: 2500, items: [{ id: 'scroll_watk_60', qty: 1 }, { id: 'scroll_matk_60', qty: 1 }] },
  },
  tora_cores: {
    id: 'tora_cores', name: 'Hot Iron', giver: 'tora', minLevel: 30, prereq: 'tora_handles',
    text: "Geode Cores burn hotter than any coal. 10 from the Crystal Golems and I'll forge you a proper pair of gloves, made for your trade.",
    objectives: [{ type: 'collect', item: 'rock_core', count: 10 }],
    rewards: { exp: 45000, gold: 9000, items: [{ id: 'warrior_gloves_30', qty: 1, forJob: true, variant: 'roll' }] },
  },
  daily_crag: {
    id: 'daily_crag', name: 'Daily: Restless Bones', giver: 'brann', minLevel: 24, daily: true,
    text: "The Dullahans never stay down for long. Put 20 of them back to rest today, and keep your guard up.",
    objectives: [{ type: 'kill', mob: 'boneknight', count: 20 }],
    rewards: { exp: 14000, gold: 3500, items: [{ id: 'white_potion', qty: 10 }] },
  },

  // Moonleaf Grove.
  nim_candles: {
    id: 'nim_candles', name: 'The Runaway Candles', giver: 'nim', minLevel: 20, prereq: 'vex_rumor',
    text: "Y-you heard? My floating candles got loose and turned into Will-o'-Wisps... they're haunting the Twilight Ruins now. Could you bring back 12 Wisp Flames? Gently, please.",
    objectives: [{ type: 'collect', item: 'wisp_flame', count: 12 }],
    rewards: { exp: 15000, gold: 4000, items: [{ id: 'mana_elixir', qty: 10 }, { id: 'ear_20', qty: 1, variant: 'roll' }] },
  },
  nim_stardust: {
    id: 'nim_stardust', name: 'Stardust Wishes', giver: 'nim', minLevel: 38,
    text: "There's a ledge at the very top of the Sky Garden where the Star Seraphs sing. Go up and see it, then bring me 10 Stardust? I want to make a wish candle.",
    objectives: [
      { type: 'visit', map: 'sky', above: 570, place: 'the top of the Sky Garden' },
      { type: 'collect', item: 'stardust', count: 10 },
    ],
    rewards: { exp: 140000, gold: 25000, cash: 1000, items: [{ id: 'elixir', qty: 10 }] },
  },

  // The instructors: one task each, between your first job and the trial at 30.
  brann_stand: {
    id: 'brann_stand', name: 'Stand Your Ground', giver: 'brann', minLevel: 15, family: 'warrior',
    text: "A warrior holds the line. The Wargs in Mossy Woods hunt in packs: face 25 of them and don't take a step back.",
    objectives: [{ type: 'kill', mob: 'boarlet', count: 25 }],
    rewards: { exp: 8000, gold: 2500, items: [{ id: 'warrior_cape_15', qty: 1, forJob: true, variant: 'roll' }] },
  },
  kestrel_wings: {
    id: 'kestrel_wings', name: 'Wings in the Dark', giver: 'kestrel', minLevel: 20, family: 'archer',
    text: "Imps flit about the Twilight Ruins faster than any Jackalope. Shoot down 20, and bring me 10 Imp Wings for my fletching.",
    objectives: [{ type: 'kill', mob: 'gloombat', count: 20 }, { type: 'collect', item: 'bat_wing', count: 10 }],
    rewards: { exp: 16000, gold: 4000, items: [{ id: 'warrior_cape_20', qty: 1, forJob: true, variant: 'roll' }] },
  },
  elowen_dance: {
    id: 'elowen_dance', name: 'Dance of the Dryads', giver: 'elowen', minLevel: 15, family: 'mage',
    text: "The Dryads of Mossy Woods dance with the wind, but they've forgotten the steps. Calm 25 of them, and bring me 10 of their leaves to press into charms.",
    objectives: [{ type: 'kill', mob: 'leafling', count: 25 }, { type: 'collect', item: 'leaf_fragment', count: 10 }],
    rewards: { exp: 8000, gold: 2500, items: [{ id: 'warrior_cape_15', qty: 1, forJob: true, variant: 'roll' }] },
  },
  vex_shadows: {
    id: 'vex_shadows', name: 'Shadow Run', giver: 'vex', minLevel: 15, family: 'thief',
    text: "A thief learns the roads by night. Run to the top of Windy Canyon, cross to Ember Crag and say hi to Tora for me. Quick feet now.",
    objectives: [
      { type: 'visit', map: 'canyon', above: 330, place: 'the top of Windy Canyon' },
      { type: 'talk', npc: 'tora', say: "Vex sent you? Ha. Tell that rascal I want my good hammer back." },
    ],
    rewards: { exp: 8000, gold: 3000, items: [{ id: 'warrior_cape_15', qty: 1, forJob: true, variant: 'roll' }] },
  },

  // ---------- The far regions ----------
  nim_chimes: {
    id: 'nim_chimes', name: 'Stolen Chimes', giver: 'nim', minLevel: 19,
    text: "The Sylphs in the Whispering Glade, past Mossy Woods, keep stealing my wind chimes to play with! Shoo 20 of them away and bring back 8 of the feathers they shed.",
    objectives: [{ type: 'kill', mob: 'sylph', count: 20 }, { type: 'collect', item: 'feather', count: 8 }],
    rewards: { exp: 12000, gold: 3500, items: [{ id: 'mana_elixir', qty: 5 }, { id: 'scroll_matk_60', qty: 1 }] },
  },
  elowen_foxfire: {
    id: 'elowen_foxfire', name: 'A Fox-Fire Offering', giver: 'elowen', minLevel: 24,
    text: "Past the Twilight Ruins, the Fox Shrine Path climbs to a little shrine on the top terrace. The foxes there are restless. Bring 10 Fox Fluff from the Nekomata, and leave a prayer at the shrine for me.",
    objectives: [{ type: 'collect', item: 'fluff', count: 10 }, { type: 'visit', map: 'shrine', above: 530, place: 'the shrine on the top terrace' }],
    rewards: { exp: 22000, gold: 5000, items: [{ id: 'white_potion', qty: 20 }, { id: 'warrior_hat_25', qty: 1, forJob: true, variant: 'roll' }] },
  },
  vex_miko: {
    id: 'vex_miko', name: 'Miko Mischief', giver: 'vex', minLevel: 26,
    text: "The Kitsune Miko on the Fox Shrine Path are 'borrowing' from every traveler. Teach 25 of them some manners. Quietly, if you can.",
    objectives: [{ type: 'kill', mob: 'kitsunemiko', count: 25 }],
    rewards: { exp: 30000, gold: 7000, items: [{ id: 'scroll_luck_60', qty: 1 }, { id: 'warrior_shoes_25', qty: 1, forJob: true, variant: 'roll' }] },
  },
  brann_howl: {
    id: 'brann_howl', name: 'Howl at the Moon', giver: 'brann', minLevel: 28,
    text: "Up past my camp, Moonlit Ridge. Lupina's pack howls all night and nobody sleeps! Climb the howling rock at the top so they know who's boss, and calm 25 of them.",
    objectives: [{ type: 'visit', map: 'ridge', above: 510, place: 'the top of the howling rock' }, { type: 'kill', mob: 'lupina', count: 25 }],
    rewards: { exp: 42000, gold: 8000, items: [{ id: 'scroll_watk_60', qty: 1 }, { id: 'warrior_bottom_30', qty: 1, forJob: true, variant: 'roll' }] },
  },
  marlo_spa: {
    id: 'marlo_spa', name: 'Spa Day', giver: 'marlo', minLevel: 31,
    text: "Serpent Springs, off the Crystal Cave! Hot pools, steam, the works. I'm opening a spa... once someone clears the Lamia out. Bring me 15 of their scales as proof, they'll make lovely tiles.",
    objectives: [{ type: 'collect', item: 'pebble', count: 15 }, { type: 'kill', mob: 'lamia', count: 20 }],
    rewards: { exp: 60000, gold: 15000, cash: 500, items: [{ id: 'cash_casual_towel', qty: 1 }] },
  },
  lulu_winter: {
    id: 'lulu_winter', name: 'Winter Collection', giver: 'lulu', minLevel: 35, prereq: 'lulu_runway',
    text: "Snow season! For my winter line I need 12 icy gems from the Yuki-onna on Frozen Peak and 10 Cloud Manes from the Pegasus Foals up there. You'll get the first parka, of course!",
    objectives: [{ type: 'collect', item: 'crystal_gel', count: 12 }, { type: 'collect', item: 'wool', count: 10 }],
    rewards: { exp: 80000, gold: 12000, items: [{ id: 'cash_casual_parka', qty: 1 }, { id: 'cash_casual_mittens', qty: 1 }] },
  },
  rook_stars: {
    id: 'rook_stars', name: 'Wishing on Stars', giver: 'rook', minLevel: 45,
    text: "My old crew swears that at Starfall Heights, over the Sky Garden, you can catch a falling star. Calm 30 Star Seraphs up there and bring back 10 Stardust. A sailor never stops wishing!",
    objectives: [{ type: 'kill', mob: 'starspirit', count: 30 }, { type: 'collect', item: 'stardust', count: 10 }],
    rewards: { exp: 200000, gold: 40000, items: [{ id: 'warrior_top_45', qty: 1, forJob: true, variant: 'gilded' }, { id: 'elixir', qty: 15 }] },
  },
};
