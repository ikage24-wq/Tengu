// Quests. Objectives: kill a monster N times; collect N of an item (handed in on completion);
// talk to an NPC (`say` is what they answer); deliver an item to an NPC (`gives` hands it to you
// on accepting); or visit a map (`above`: climb above that height there). Talks and deliveries
// in one quest go in order. A quest with no objectives completes as soon as you accept it.
// `daily` quests can be done again every new day. Rewards may add `cash`, and cash outfit pieces
// go in `items` like anything else.

// A reward marked `forJob` is job gear: the hero gets their own job's piece instead (the id names
// the slot and level). `variant` gives it a color ('roll' picks one).
import { STORY_QUESTS } from './story.js';
import { QUEST_SCENES } from './scenes.js';

export const QUESTS = {
  // Dawnlight Isle, the tutorial (Kuro; world/tutorial.js).
  tut_hello: {
    id: 'tut_hello', name: 'Washed Ashore', giver: 'kuro', minLevel: 1,
    text: "You're awake! Your boat came in on the tide last night, what's left of it. Here, some tonics and a practice sword. You'll get your job's own weapon when you pick a job at level 5.",
    objectives: [],
    rewards: { exp: 5, gold: 9, items: [{ id: 'sword_0', qty: 1 }, { id: 'red_potion', qty: 5 }] },
  },
  tut_lookout: {
    id: 'tut_lookout', name: 'A Better View', giver: 'kuro', minLevel: 1, prereq: 'tut_hello',
    text: "See the rocks at the end of the beach? There's a lookout on top with my old spyglass. Climb up and look out to sea, and you'll spot the dock where the boat to the mainland ties up. Tell me what you see. I'll be at the Practice Field, just past the rocks.",
    objectives: [{ type: 'visit', map: 'dawnbeach', above: 450, place: 'the lookout on the rocks' }],
    rewards: { exp: 40, gold: 15, items: [{ id: 'red_potion', qty: 3 }] },
  },
  tut_practice: {
    id: 'tut_practice', name: 'Practice Makes Perfect', giver: 'kuro', minLevel: 1, prereq: 'tut_lookout',
    text: 'Those Kitsune Kits are harmless, they just love a game of chase. Defeat 3 with Z and pick up 3 Fox Fluff with X.',
    objectives: [{ type: 'kill', mob: 'puffle', count: 3 }, { type: 'collect', item: 'fluff', count: 3 }],
    rewards: { exp: 130, gold: 24, items: [{ id: 'blue_potion', qty: 5 }] },
  },
  tut_farewell: {
    id: 'tut_farewell', name: 'Set Sail', giver: 'kuro', minLevel: 1, prereq: 'tut_practice',
    text: "You're ready! The boat at the end of the dock goes to Sprout Village. Find Mira there, she'll look after you. Good luck out there!",
    objectives: [],
    rewards: { exp: 20, gold: 30, items: [] },
  },
  first_steps: {
    id: 'first_steps', name: 'First Steps', giver: 'mira', minLevel: 1,
    text: "Kuro found you a weapon, I see! An adventurer needs sturdy clothes too, so take these Cotton Shorts and some tonics, put them on from your bag, then head east to Petal Meadow.",
    objectives: [],
    rewards: { exp: 10, gold: 19, items: [{ id: 'bottom_0', qty: 1 }, { id: 'red_potion', qty: 10 }] },
  },
  fluffy: {
    id: 'fluffy', name: 'Fluffy Business', giver: 'mira', minLevel: 1, prereq: 'first_steps',
    text: 'The Kitsune Kits in Petal Meadow shed the softest fluff. Could you bring me 8 Fox Fluff?',
    objectives: [{ type: 'collect', item: 'fluff', count: 8 }],
    rewards: { exp: 220, gold: 42, items: [{ id: 'hat_0', qty: 1 }] },
  },
  // Your island (data/home.js): Captain Rook hands you the deed to a little cove he can't use.
  island_deed: {
    id: 'island_deed', name: 'A Deed to a Little Island', giver: 'rook', minLevel: 10,
    text: "An old sailor left me the deed to a tiny beach cove out past the harbor. I'm too busy to ever go! Take it, and this Home Shell: hold it to your ear and it takes you home, wherever you are. There's a hermit crab carpenter living there who'll build it up for you. Oh, and your skiff's tied up at the end of the quay.",
    objectives: [],
    rewards: { exp: 300, gold: 55, items: [{ id: 'home_shell', qty: 1 }], island: true },
  },
  // The first mount (data/mounts.js): Clover's runaway Puff Buns.
  // Clover's story: the Puff Bun keeper who can't count her buns and writes a song about
  // everything. The whole island camps for a legendary one-in-ten-thousand Golden Bun, which is
  // just Muffin after falling in the honey; when the crowds go home, she throws him a parade.
  clover_count: {
    id: 'clover_count', name: 'Count the Buns', giver: 'clover', minLevel: 8,
    text: "Can you help me count my buns? I've got either twelve or a hundred. Every time I start, the Jackalopes in Clover Hills hop in and pretend to be buns, and I lose count. Calm 12 of them. They have HORNS. Buns don't have horns. I keep forgetting.",
    objectives: [{ type: 'kill', mob: 'piglet', count: 12 }],
    rewards: { exp: 1350, gold: 100, items: [{ id: 'red_potion', qty: 10 }] },
  },
  bun_buddy: {
    id: 'bun_buddy', name: 'Bun Round-Up', giver: 'clover', minLevel: 15, prereq: 'clover_count',
    text: "The Mandrakes in Clover Hills screamed so loud my Puff Buns bolted! Quiet 15 of them, and pick 8 Lucky Clover in the hills to coax the buns home. The bravest one has taken a shine to you, I can tell. Its name is Fluffy. They're all called Fluffy. It's easier.",
    objectives: [{ type: 'kill', mob: 'sproutling', count: 15 }, { type: 'collect', item: 'clover', count: 8 }],
    rewards: { exp: 900, gold: 120, items: [], mount: 'bun' },
  },  clover_golden: {
    id: 'clover_golden', name: 'The Golden Bun', giver: 'clover', minLevel: 16, prereq: 'bun_buddy',
    text: "The whole island's gone bun-crazy! Someone saw the legendary Golden Bun in Mossy Woods. One in ten thousand! Adventurers have been camping there for days, shouting 'GOLDEN BUN SPAWN?' in every chat. The Wargs keep chasing it. Calm 20 of them so I can get a look. I'm writing a song. It's mostly the word 'golden'.",
    objectives: [{ type: 'kill', mob: 'boarlet', count: 20 }],
    rewards: { exp: 9600, gold: 280, items: [{ id: 'orange_potion', qty: 10 }] },
  },
  clover_parade: {
    id: 'clover_parade', name: 'One-Bun Parade', giver: 'clover', minLevel: 21, prereq: 'clover_golden',
    text: "Muffin's been moping since everyone stopped camping him. So I'm throwing him a parade! Bring me 8 Sylph Feathers from the Whispering Glade for his plume, and ask Kestrel to carry the banner. She'll say no. Ask anyway. Ask twice.",
    objectives: [
      { type: 'collect', item: 'sylph_feather', count: 8 },
      { type: 'talk', npc: 'kestrel', say: "A parade? For a sticky bun? ...Fine. I'll carry the banner. NOT the drum. I have a reputation. And don't tell Clover I said yes the first time." },
    ],
    rewards: { exp: 16000, gold: 430, items: [{ id: 'ear_20', qty: 1, variant: 'roll' }] },
  },

  // Pip's story: the shopkeeper who has never once left her counter, because shopkeepers
  // "can't". She orders a compass for herself, collects the world as souvenirs, and when Mira
  // says nobody ever told her she couldn't, she closes for lunch and goes as far as the gate.
  snail_trouble: {
    id: 'snail_trouble', name: 'Tortoise Trouble', giver: 'pip', minLevel: 3,
    text: "Moss Tortoises keep nibbling my crates! Defeat 12 of them and I'll pay you in tonics. PLUS a loyalty stamp! Ten stamps gets you... something. I haven't decided. It's very exciting.",
    objectives: [{ type: 'kill', mob: 'snailbun', count: 12 }],
    rewards: { exp: 290, gold: 36, items: [{ id: 'red_potion', qty: 15 }, { id: 'blue_potion', qty: 5 }] },
  },

  sprout_sweep: {
    id: 'sprout_sweep', name: 'Sprout Sweep', giver: 'mira', minLevel: 5, prereq: 'fluffy',
    text: 'Mandrakes are screaming all over Clover Hills, past the meadow. Defeat 10 of them!',
    objectives: [{ type: 'kill', mob: 'sproutling', count: 10 }],
    rewards: { exp: 440, gold: 40, items: [{ id: 'shoes_0', qty: 1 }, { id: 'top_0', qty: 1 }] },
  },
  // Bramble's story: the Hollow Warden who checks everyone's gear, roles and "aggro" before he
  // lets them in, because ten years ago he was the young warden who charged Gnarlroot alone
  // yelling his own name and woke the whole canyon. At the end he charges once more, for fun.
  bramble_check: {
    id: 'bramble_check', name: 'Gear Check', giver: 'bramble', minLevel: 10,
    text: "Nobody goes into the Hollow without a gear check. Nobody. Show me you can hold a fight together: calm 15 Basilisk Hatchlings in Windy Canyon, and never pull more than three at once. I'll know. I have a feeling for these things.",
    objectives: [{ type: 'kill', mob: 'pebblet', count: 15 }],
    rewards: { exp: 2200, gold: 140, items: [{ id: 'red_potion', qty: 15 }] },
  },
  hollow_heart: {
    id: 'hollow_heart', name: 'Heart of the Hollow', giver: 'bramble', minLevel: 10, prereq: 'bramble_check',
    text: "Gnarlroot has been grumbling under the canyon for a week, and the whole Hollow woke up with him. Take a group of four down and calm him. One tank, one healer, two fighters. Not three fighters. Not 'two fighters and a bard'. Talk to me again when you're ready.",
    objectives: [{ type: 'kill', mob: 'gnarlroot', count: 1 }],
    rewards: { exp: 9000, gold: 600, items: [{ id: 'warrior_cape_15', qty: 1, forJob: true, variant: 'roll' }, { id: 'hollow_acorn', qty: 5 }] },
  },
  bramble_wipe: {
    id: 'bramble_wipe', name: 'The Great Wipe', giver: 'bramble', minLevel: 12, prereq: 'hollow_heart',
    text: "Why all the rules? Because of the Great Wipe, that's why. Ten years ago some fool ran into the Hollow alone and woke the whole canyon. Don't ask who. Clear 15 Manticore Cubs off the canyon road, and whatever you do, don't ask Brann in Ember Crag. He wasn't even there. Probably.",
    objectives: [
      { type: 'kill', mob: 'scorpip', count: 15 },
      { type: 'talk', npc: 'brann', say: "The Great Wipe? I was the tank that day. A young warden ran right past me into the Hollow, yelling his own name. 'BRAAAAMBLE!' The canyon shook for a month. Tell him I still hear it at night." },
    ],
    rewards: { exp: 6000, gold: 200, items: [{ id: 'warrior_shoes_15', qty: 1, forJob: true, variant: 'roll' }] },
  },
  bramble_charge: {
    id: 'bramble_charge', name: 'One Last Charge', giver: 'bramble', minLevel: 14, prereq: 'bramble_wipe',
    text: "Fine. It was me. I've been thinking. Ten years of rules and I can't remember the last time a fight was fun. Go to Mossy Woods and charge into the Warg packs, 20 of them. Loud. Then come back, and bring a healer. Out of habit.",
    objectives: [{ type: 'kill', mob: 'boarlet', count: 20 }],
    rewards: { exp: 9600, gold: 280, items: [{ id: 'warrior_hat_15', qty: 1, forJob: true, variant: 'roll' }, { id: 'hollow_acorn', qty: 5 }] },
  },

  mush_menace: {
    id: 'mush_menace', name: 'Toadstool Trouble', giver: 'rook', minLevel: 8,
    text: 'Toadstool Goblins have been sneaking onto the docks. Clear out 20 of them in Clover Hills.',
    objectives: [{ type: 'kill', mob: 'mushkin', count: 20 }],
    rewards: { exp: 1600, gold: 140, items: [{ id: 'orange_potion', qty: 20 }] },
  },
  leaf_samples: {
    id: 'leaf_samples', name: 'Leaf Samples', giver: 'rook', minLevel: 12, prereq: 'mush_menace',
    text: 'Our herbalist needs 15 Dryad Leaves from the Dryads in Mossy Woods.',
    objectives: [{ type: 'collect', item: 'leaf_fragment', count: 15 }],
    rewards: { exp: 10000, gold: 330, items: [{ id: 'warrior_gloves_15', qty: 1, forJob: true }] },
  },
  tusk_trader: {
    id: 'tusk_trader', name: 'Fang Trader', giver: 'marlo', minLevel: 15, prereq: 'marlo_scales',
    text: "Warg fangs sell like hotcakes. Hotcakes, meanwhile, sell like Warg fangs. The market is confusing. Bring me 15 and I'll share the profits. The jar's getting heavy, partner. Not that you've seen any jar.",
    objectives: [{ type: 'collect', item: 'tusk', count: 15 }],
    rewards: { exp: 16000, gold: 480, items: [] },
  },
  restless_ruins: {
    id: 'restless_ruins', name: 'Restless Ruins', giver: 'rook', minLevel: 20, prereq: 'leaf_samples',
    text: 'Headless Dullahans ride the Twilight Ruins at night. Put 25 of them to rest.',
    objectives: [{ type: 'kill', mob: 'boneknight', count: 25 }],
    rewards: { exp: 29000, gold: 750, items: [{ id: 'ear_20', qty: 1, variant: 'roll' }] },
  },
  // A job trial: Brann asks it of a warrior before teaching either level 30 path (`family` keeps
  // it to warriors).
  warrior_trial: {
    id: 'warrior_trial', name: "The Warrior's Trial", giver: 'brann', minLevel: 30, family: 'warrior',
    text: "You've grown strong, but the next path asks more than strength. Go to the Crystal Cave and break 20 Crystal Golems. Stand your ground the whole time. If you step back, I'll know. I'll feel it in my shield arm. Then come back and I'll show you the Paladin's way and the Berserker's way.",
    objectives: [{ type: 'kill', mob: 'rockgolem', count: 20 }],
    rewards: { exp: 48000, gold: 1100, items: [{ id: 'elixir', qty: 5 }] },
  },
  // Kestrel's trial for an Acrobat Archer before either level 30 path (the Phantom Trickster, the
  // Arbalist Engineer).
  archer_trial: {
    id: 'archer_trial', name: "The Acrobat Archer's Trial", giver: 'kestrel', minLevel: 30, family: 'archer',
    text: "Anyone can hit a slime. A real archer hits what flies. Go to the Crystal Cave and shoot down 15 Wraiths. They drift, they dodge, they vanish, they're very annoying. Then come back and I'll show you the Phantom Trickster's way and the Arbalist Engineer's way.",
    objectives: [{ type: 'kill', mob: 'shade', count: 15 }],
    rewards: { exp: 41000, gold: 880, items: [{ id: 'elixir', qty: 5 }] },
  },
  // Elowen's trial for a Star Witch before either level 30 path (the Starlight Idol, the Astronomer).
  spiritmage_trial: {
    id: 'spiritmage_trial', name: "The Mage's Trial", giver: 'elowen', minLevel: 30, family: 'mage',
    text: "Deep in the Crystal Cave the Wraiths wander, spirits who've forgotten the way to rest. A Mage doesn't just fight them: she lights their way home, with a speech, while everyone watches. Lay 20 of them to rest, then come back and I'll show you the Sorcerer's way and the Cleric's way.",
    objectives: [{ type: 'kill', mob: 'shade', count: 20 }],
    rewards: { exp: 55000, gold: 1200, items: [{ id: 'elixir', qty: 5 }] },
  },
  // Vex's trial for a Wind Dancer before either level 30 path (the Blade Dancer, the Sky Dancer).
  thief_trial: {
    id: 'thief_trial', name: "The Wind Dancer's Trial", giver: 'vex', minLevel: 30, family: 'thief',
    text: "Pretty steps are nothing if you can't keep them up under pressure. The Dullahans in the Twilight Ruins ride at night, all armour and slow turns. Dance rings round 20 of them and bring them down. If you trip, trip with style. Then come back and I'll show you the Blade Dancer's way and the Sky Dancer's way.",
    objectives: [{ type: 'kill', mob: 'boneknight', count: 20 }],
    rewards: { exp: 29000, gold: 750, items: [{ id: 'elixir', qty: 5 }] },
  },
  crystal_heart: {
    id: 'crystal_heart', name: 'Heart of Crystal', giver: 'rook', minLevel: 35, prereq: 'restless_ruins',
    text: 'Deep in the Crystal Cave sits Prismaris, the Crystal King. Defeat it and bring peace to the coast.',
    objectives: [{ type: 'kill', mob: 'crystalking', count: 1 }],
    rewards: { exp: 120000, gold: 1800, items: [{ id: 'warrior_cape_40', qty: 1, forJob: true, variant: 'gilded' }, { id: 'elixir', qty: 10 }] },
  },

  // ---------- Side quests: every town's people, every field ----------

  // Sprout Village.
  pip_parcel: {
    id: 'pip_parcel', name: 'Special Delivery', giver: 'pip', minLevel: 3, prereq: 'snail_trouble',
    text: "This parcel's for Captain Rook in Pastel Harbor, just past Petal Meadow. I'd take it myself, but I can't leave the shop! Shopkeepers can't. Everyone knows that. Probably. Mind the corners, it's fragile. And mysterious.",
    gives: [{ id: 'parcel' }],
    objectives: [{ type: 'deliver', npc: 'rook', item: 'parcel', say: "A parcel from Pip? The tag says... 'From Pip. To Pip. Do not open until brave.' Ha! I think this one's hers, kid. Take it back to her, and tell her the harbor's lovely this time of year." }],
    rewards: { exp: 180, gold: 70, items: [{ id: 'return_scroll', qty: 3 }, { id: 'red_potion', qty: 10 }] },
  },
  pip_souvenirs: {
    id: 'pip_souvenirs', name: 'Souvenirs of the World', giver: 'pip', minLevel: 5, prereq: 'pip_parcel',
    text: "Will you bring me souvenirs from out there? I want to know what the world feels like. 6 Sprite Petals from the Petal Sprites in Petal Meadow, and 6 Straw Tufts from the Scarecrow Imps in Clover Hills. For display. Not for sale. Probably not for sale.",
    objectives: [{ type: 'collect', item: 'sprite_petal', count: 6 }, { type: 'collect', item: 'straw_tuft', count: 6 }],
    rewards: { exp: 1100, gold: 110, items: [{ id: 'red_potion', qty: 15 }] },
  },
  pip_lunch: {
    id: 'pip_lunch', name: 'Closed for Lunch', giver: 'pip', minLevel: 8, prereq: 'pip_souvenirs',
    text: "I'm going to do it. I'm going to leave the shop. For one whole lunch. First, ask Mira if shopkeepers are even allowed. Then clear 15 Jackalopes out of Clover Hills, in case I go really far. I won't. But in case.",
    objectives: [
      { type: 'talk', npc: 'mira', say: "Allowed? Oh, sweetheart. Nobody ever said Pip couldn't leave. She just never asked. Tell her the gate's been open her whole life." },
      { type: 'kill', mob: 'piglet', count: 15 },
    ],
    rewards: { exp: 1900, gold: 170, items: [{ id: 'return_scroll', qty: 5 }, { id: 'red_potion', qty: 20 }] },
  },

  // Malvina Grimsworth's story: the villainess whose every evil scheme comes out helpful.
  malv_minion: {
    id: 'malv_minion', name: 'A Minion Is Required', giver: 'malvina', minLevel: 4,
    text: "You there! Yes, you, with the face. Congratulations: you are now my MINION. Fetch me 8 Sprite Petals and 6 Bumble Fuzz from the meadow. I shall brew a Wilting Powder so vile that every flower in Sprout Village droops in SHAME. Ohohoho! ...Off you go. Wear a hat, it's sunny.",
    objectives: [{ type: 'collect', item: 'sprite_petal', count: 8 }, { type: 'collect', item: 'bee_fuzz', count: 6 }],
    rewards: { exp: 800, gold: 130, items: [{ id: 'vial_of_despair', qty: 3 }] },
  },
  malv_well: {
    id: 'malv_well', name: 'The Well Shall Run Black', giver: 'malvina', minLevel: 6, prereq: 'malv_minion',
    gives: [{ id: 'hex_brew' }],
    text: "The flowers... BLOOMED. Enormous. People are taking PICTURES. Fine. Phase Two. Pour this Hex Brew into Mira's well and the water will turn black and bitter! Then thin out 10 Toadstool Goblins in the woods, so nobody can bring fresh mushrooms to cheer the village up. I am so evil it frightens even me.",
    objectives: [
      { type: 'deliver', npc: 'mira', item: 'hex_brew', say: "Malvina sent this? Oh, how sweet. *pours* ...Goodness, the water's gone pink and fizzy, and my sore feet stopped aching the moment I paddled in it! Tell her thank you. No, tell her LOUDLY." },
      { type: 'kill', mob: 'mushkin', count: 10 },
    ],
    rewards: { exp: 850, gold: 90, items: [{ id: 'vial_of_despair', qty: 3 }, { id: 'poisoned_apple', qty: 5 }] },
  },
  malv_mob: {
    id: 'malv_mob', name: 'The Torches Are Coming', giver: 'malvina', minLevel: 7, prereq: 'malv_well',
    text: "Minion. MINION. Lights. Gathering at night. Whispering. Posy's been seen buying ROPE. It's a mob, I know a mob when I see one, I've read every book about them. Go and find out what Posy is planning, and bring me 10 Straw Tufts from the Scarecrow Imps: I am building scarecrow guards. Very frightening ones. With little hats.",
    objectives: [
      { type: 'talk', npc: 'posy', say: "Shhh! The rope is for BUNTING! We're throwing Malvina a surprise party, 'Thank You, Malvina Day'! The flowers, the well, she's helped everyone! Don't you dare tell her. Just get her to stay home tonight." },
      { type: 'collect', item: 'straw_tuft', count: 10 },
    ],
    rewards: { exp: 1200, gold: 100, items: [{ id: 'vial_of_despair', qty: 4 }] },
  },
  malv_diary: {
    id: 'malv_diary', name: 'The Villain Diary', giver: 'malvina', minLevel: 9, prereq: 'malv_mob',
    text: "A... party. For me. They CHEERED. Do you know how hard it is to look menacing with a party hat on? I must restore my terrible reputation at once. Bring me 10 Jackalope Antlers from Clover Hills: I shall wear a crown of antlers so dreadful that children weep. ...Not too much. Just a little sniffle.",
    objectives: [{ type: 'collect', item: 'ribbon', count: 10 }],
    rewards: { exp: 2500, gold: 180, title: 'Minion of Malvina', items: [{ id: 'vial_of_despair', qty: 5 }, { id: 'bottled_scream', qty: 5 }] },
  },

  lulu_gossip: {
    id: 'lulu_gossip', name: 'Town Gossip', giver: 'lulu', minLevel: 3,
    text: "Be a dear and ask around: what does everyone think of my new window display? Mira, Pip and Kestrel. Don't tell them I sent you!",
    objectives: [
      { type: 'talk', npc: 'mira', say: "Lulu's window? Those little hats with ears are adorable!" },
      { type: 'talk', npc: 'pip', say: "It's lovely. The pink is very... pink." },
      { type: 'talk', npc: 'kestrel', say: "Tell her the feathered cap is perfect. Don't tell her I said so." },
    ],
    rewards: { exp: 220, gold: 90, cash: 300, items: [{ id: 'cash_casual_bow', qty: 1 }] },
  },
  lulu_runway: {
    id: 'lulu_runway', name: 'Runway Ready', giver: 'lulu', minLevel: 8, prereq: 'lulu_gossip',
    text: "Inspiration struck! A spring line with fluffy trim and antler buttons. I need 9 Fox Fluff from the Kitsune Kits and 7 Jackalope Antlers from Clover Hills. The first piece is yours!",
    objectives: [{ type: 'collect', item: 'fluff', count: 9 }, { type: 'collect', item: 'ribbon', count: 7 }],
    rewards: { exp: 2000, gold: 170, items: [{ id: 'cash_casual_cardigan', qty: 1 }] },
  },
  // Kestrel's story (her archers'): the arrow she shot off Windy Canyon at the Spring Fair when she
  // was a girl. It never came down, everyone laughed, and she's never lived it down. The wind
  // carried it to the Whispering Glade, where the Sylphs have kept it as treasure ever since.
  kestrel_targets: {
    id: 'kestrel_targets', name: 'Moving Targets', giver: 'kestrel', minLevel: 7,
    text: "Standing targets teach you nothing. They just stand there. Smug. The Jackalopes in Clover Hills never stop hopping: catch 15 of them, whatever you fight with, and you'll have quick eyes for life.",
    objectives: [{ type: 'kill', mob: 'piglet', count: 15 }],
    rewards: { exp: 1700, gold: 120, items: [{ id: 'orange_potion', qty: 15 }] },
  },
  mira_letter: {
    id: 'mira_letter', name: 'A Letter for Elowen', giver: 'mira', minLevel: 10, prereq: 'sprout_sweep',
    text: "Elowen and I were apprentices together, long ago. She keeps the spirits' grove now, in Moonleaf Grove past Mossy Woods. Would you take her this letter? It's been far too long.",
    gives: [{ id: 'letter' }],
    objectives: [{ type: 'deliver', npc: 'elowen', item: 'letter', say: "From Mira? Oh, she still dots her i's with hearts. Thank you, traveler." }],
    rewards: { exp: 2000, gold: 180, items: [{ id: 'blue_potion', qty: 20 }] },
  },
  daily_meadow: {
    id: 'daily_meadow', name: 'Daily: Hill Patrol', giver: 'mira', minLevel: 6, daily: true,
    text: "The Toadstool Goblins sneak back into Clover Hills every night. Help me keep them in check: 15 will do for today.",
    objectives: [{ type: 'kill', mob: 'mushkin', count: 15 }],
    rewards: { exp: 1200, gold: 110, items: [{ id: 'orange_potion', qty: 5 }, { id: 'gacha_ticket', qty: 1 }] },
  },

  // Pastel Harbor.
  canyon_eggs: {
    id: 'canyon_eggs', name: 'Scaly Situation', giver: 'rook', minLevel: 9,
    text: "Basilisks are nesting in Windy Canyon, north of Petal Meadow, and the hatchlings are biting my sailors' boots. Defeat 15 of the little biters.",
    objectives: [{ type: 'kill', mob: 'pebblet', count: 15 }],
    rewards: { exp: 2200, gold: 140, items: [{ id: 'red_potion', qty: 20 }] },
  },
  canyon_stingers: {
    id: 'canyon_stingers', name: 'Stinging Remarks', giver: 'rook', minLevel: 11, prereq: 'canyon_eggs',
    text: "The Manticore Cubs up there are worse. Bring me 12 of their stingers so the herbalist can brew an antidote for the crew.",
    objectives: [{ type: 'collect', item: 'stinger', count: 12 }],
    rewards: { exp: 10000, gold: 320, items: [{ id: 'warrior_shoes_10', qty: 1, forJob: true, variant: 'roll' }] },
  },
  canyon_lookout: {
    id: 'canyon_lookout', name: 'The Lookout', giver: 'rook', minLevel: 12, prereq: 'canyon_stingers',
    text: "Something's stirring under that canyon. Climb to the very top ledge of Windy Canyon and take a good look, then tell Bramble at the Hollow Gate what you saw. He'll want to know.",
    objectives: [
      { type: 'visit', map: 'canyon', above: 330, place: 'the top of Windy Canyon' },
      { type: 'talk', npc: 'bramble', say: "Roots moving under the rock? Then Gnarlroot's waking. Thank you: I'll need brave folk soon." },
    ],
    rewards: { exp: 3200, gold: 240, items: [{ id: 'hollow_acorn', qty: 3 }, { id: 'orange_potion', qty: 20 }] },
  },
  // ----- Lantern Lagoon: Granny Kelp and the light on the point -----
  // The lighthouse has been flickering since the wind went quiet, and the fish are acting strange:
  // Old Lumen, the great lantern fish who has lived under the point since Granny was a girl, is
  // restless. Any level can do it: it asks for fishing, not fighting (world/lumen.js).
  kelp_1: {
    id: 'kelp_1', name: 'The Dim Light', giver: 'kelp', minLevel: 1,
    text: "See my light? Flickering like a guttering candle, it is, and it's never done that. The fish know why, dearie. Bring me three Lantern Gobies from the cove's rock pools: their little glow tells me the mood of the tide.",
    objectives: [{ type: 'collect', item: 'fish_goby', count: 3 }],
    rewards: { exp: 150, gold: 90, items: [{ id: 'lantern_bait', qty: 3 }] },
  },
  kelp_2: {
    id: 'kelp_2', name: 'Strange Bites', giver: 'kelp', minLevel: 1, prereq: 'kelp_1',
    text: "The gobies are dim as dishwater. Something's stirring the deep. Go ask the folk who know the water: Nori, Mister Brine, and that sleepy Bobbin, if he's awake. Then come tell me.",
    objectives: [
      { type: 'talk', npc: 'nori', say: "Weird? Yeah! The big fish keep swimming toward the point, all at once, like they're scared. Don't tell anyone I said scared." },
      { type: 'talk', npc: 'brine', say: "My nets came up with scales last week. Glowing ones. Big as dinner plates. I didn't sell them. I didn't sleep either." },
      { type: 'talk', npc: 'bobbin', say: "Saw a light under the Biscuit on the way in. Big as my boat. Thought I was dreaming. I usually am." },
    ],
    rewards: { exp: 250, gold: 120, items: [] },
  },
  kelp_3: {
    id: 'kelp_3', name: 'Oil for the Lamp', giver: 'kelp', minLevel: 1, prereq: 'kelp_2',
    text: "Big glowing scales... it's Old Lumen, then. He's lived under the point since I was a girl, and he's never been restless. First, my light: it burns angler oil. Catch me two Lantern Anglers off the boardwalk, then climb up to the gallery and see how dark the sea's gone.",
    objectives: [
      { type: 'collect', item: 'fish_angler', count: 2 },
      { type: 'visit', map: 'lagoon', above: 300, place: 'the lighthouse gallery' },
    ],
    rewards: { exp: 500, gold: 200, items: [{ id: 'rod_oak', qty: 1 }] },
  },
  kelp_4: {
    id: 'kelp_4', name: 'The Deep Water', giver: 'kelp', minLevel: 1, prereq: 'kelp_3',
    text: "The light's back, and look: the deep water's all churned up off the point. Lumen's down there, and he won't come to just anybody's line. Show him you can handle the deep: catch a Sailfin Tuna from the point.",
    objectives: [{ type: 'catch', fish: 'fish_tuna', count: 1, map: 'lagoon', place: 'Lighthouse Point' }],
    rewards: { exp: 800, gold: 300, items: [{ id: 'lantern_bait', qty: 5 }] },
  },
  kelp_5: {
    id: 'kelp_5', name: 'Old Lumen', giver: 'kelp', minLevel: 1, prereq: 'kelp_4',
    text: "He's frightened, dearie. With no wind the currents have gone still, and the old fellow thinks the sea is dying. Cast off the point and he'll come. Reel him in, gently, let him see the light up close, and let him go. He'll understand. Mind: he's the biggest thing you'll ever hook.",
    objectives: [{ type: 'catch', fish: 'fish_lumen', count: 1, map: 'lagoon', place: 'the deep water off Lighthouse Point' }],
    rewards: { exp: 1500, gold: 680, items: [{ id: 'rod_skywood', qty: 1 }, { id: 'lantern_bait', qty: 10 }] },
  },
  // Marlo's story: every coin goes in a jar marked THE DREAM, and the dream is the bathhouse at
  // Serpent Springs that was Marlo's grandmother's, lost to the Lamia long ago. The spa at the end
  // is that bathhouse, open again.
  marlo_scales: {
    id: 'marlo_scales', name: 'Shiny Scales', giver: 'marlo', minLevel: 9,
    text: "Basilisk scales! Ladies in the capital sew them on their gloves. Next month it'll be something else. Fashion! Bring me 15 before the trend dies and I'll make it worth your while.",
    objectives: [{ type: 'collect', item: 'pebble', count: 15 }],
    rewards: { exp: 4300, gold: 270, items: [] },
  },
  vex_rumor: {
    id: 'vex_rumor', name: 'A Quiet Word', giver: 'vex', minLevel: 14,
    text: "Word is someone's buying up Wisp Flames on the quiet. Ask Marlo who's been selling, then ask Tora in Ember Crag who's been buying. Keep it casual.",
    objectives: [
      { type: 'talk', npc: 'marlo', say: "Wisp Flames? Some kid from the Grove sold me a whole jar. Said they were 'escapees'." },
      { type: 'talk', npc: 'tora', say: "Buying? Not me. Nim from the Grove lost a box of candles, though. Poor thing hasn't slept." },
    ],
    rewards: { exp: 4000, gold: 350, items: [] },
  },
  rook_harpies: {
    id: 'rook_harpies', name: 'Harpy Havoc', giver: 'rook', minLevel: 40, prereq: 'crystal_heart',
    text: "The Sky Harpies have started raiding our gulls' nests, all the way from the Sky Garden! Ground 30 of them.",
    objectives: [{ type: 'kill', mob: 'windbird', count: 30 }],
    rewards: { exp: 120000, gold: 1800, items: [{ id: 'warrior_hat_40', qty: 1, forJob: true, variant: 'roll' }] },
  },
  daily_harbor: {
    id: 'daily_harbor', name: 'Daily: Warg Watch', giver: 'rook', minLevel: 14, daily: true,
    text: "Wargs keep circling the woods road where our carts go. Thin the pack: 20 Wargs today.",
    objectives: [{ type: 'kill', mob: 'boarlet', count: 20 }],
    rewards: { exp: 9600, gold: 280, items: [{ id: 'orange_potion', qty: 10 }, { id: 'gacha_ticket', qty: 1 }] },
  },

  // Ember Crag.
  // Tora's story: the Great Forge's fire has burned low since the wind stopped. She rigs bellows
  // to work by hand, and when the old girl finally roars, every flame leans one way: something
  // out past the Crystal Cave is drinking the island's warmth. Geode Cores hold heat nothing can
  // take, so they light her for good, and the trail leads on to the cold springs (chapter 5).
  tora_handles: {
    id: 'tora_handles', name: 'Heartwood Handles', giver: 'tora', minLevel: 17,
    text: "The best hilts are Heartwood, straight off a Treant in Mossy Woods. Bring me 12. Why 12? Because 10 felt lazy and 15 felt mean. I'll put an edge on your gear, and maybe keep a couple back. Don't ask what for.",
    objectives: [{ type: 'collect', item: 'moss_stone', count: 12 }],
    rewards: { exp: 22000, gold: 570, items: [] },
  },
  tora_bellows: {
    id: 'tora_bellows', name: 'Wings for the Old Girl', giver: 'tora', minLevel: 21, prereq: 'tora_handles',
    text: "Bellows need leather that breathes. Imp wings, from the Twilight Ruins: thin as paper, tough as boots, slightly judgy. Bring me 10. Yes, the Imps are using them. They'll walk. Builds character.",
    objectives: [{ type: 'collect', item: 'bat_wing', count: 10 }],
    rewards: { exp: 21000, gold: 550, items: [{ id: 'warrior_cape_20', qty: 1, forJob: true, variant: 'roll' }] },
  },
  tora_draught: {
    id: 'tora_draught', name: 'Follow the Lean', giver: 'tora', minLevel: 25, prereq: 'tora_bellows',
    text: "Every flame on Forge Row is leaning toward the Crystal Cave like it heard gossip. Go and see where my heat is going. Climb to the high crystal ledges where the air moves, and clear 20 Gem Mimics on the way. They look like treasure. They are not treasure. They bite.",
    objectives: [{ type: 'visit', map: 'cave', above: 450, place: 'the high crystal ledges of the Glowcap Terraces' }, { type: 'kill', mob: 'crystalslime', count: 20 }],
    rewards: { exp: 25000, gold: 660, items: [{ id: 'warrior_hat_25', qty: 1, forJob: true, variant: 'roll' }] },
  },
  tora_cores: {
    id: 'tora_cores', name: 'Hot Iron', giver: 'tora', minLevel: 30, prereq: 'tora_draught',
    text: "Geode Cores burn hotter than any coal and hold their heat like a grudge: nothing can slurp it out of them. 10 from the Crystal Golems. They'll say they need them. Everybody says that. Her first fire makes you a proper pair of gloves, made for your trade.",
    objectives: [{ type: 'collect', item: 'rock_core', count: 10 }],
    rewards: { exp: 44000, gold: 990, items: [{ id: 'warrior_gloves_30', qty: 1, forJob: true, variant: 'roll' }] },
  },
  daily_crag: {
    id: 'daily_crag', name: 'Daily: Restless Bones', giver: 'brann', minLevel: 24, daily: true,
    text: "The Dullahans never stay down for long. Put 20 of them back to rest today, and keep your guard up.",
    objectives: [{ type: 'kill', mob: 'boneknight', count: 20 }],
    rewards: { exp: 23000, gold: 600, items: [{ id: 'white_potion', qty: 10 }, { id: 'gacha_ticket', qty: 1 }] },
  },

  // Moonleaf Grove.
  nim_candles: {
    id: 'nim_candles', name: 'The Runaway Candles', giver: 'nim', minLevel: 20, prereq: 'nim_chimes',
    text: "M-my floating candles ran away in the night. They left a note. It just says BYE. Now they're Will-o'-Wisps haunting the Twilight Ruins. Could you bring back 12 Wisp Flames? Gently, please. They're going through a phase.",
    objectives: [{ type: 'collect', item: 'wisp_flame', count: 12 }],
    rewards: { exp: 24000, gold: 620, items: [{ id: 'mana_elixir', qty: 10 }, { id: 'ear_20', qty: 1, variant: 'roll' }] },
    scenes: { accept: 'candles_open', done: 'candles_done' },
  },
  nim_cape: {
    id: 'nim_cape', name: 'The Caped Candle', giver: 'nim', minLevel: 23, prereq: 'nim_candles',
    text: "One candle is still out there. The big one. Every night it climbs to the Temple Roof of the Twilight Ruins and just stands there, glowing, like the hero on the cover of the storybook I read them. I-I may have read it to them too many times. The Imps up there think it's their boss now. Clear 15 Imps on the roof and bring it home? Please don't tell it I said 'big'.",
    objectives: [{ type: 'visit', map: 'ruins', above: 440, place: 'the Temple Roof of the Twilight Ruins' }, { type: 'kill', mob: 'gloombat', count: 15 }],
    rewards: { exp: 15000, gold: 380, items: [{ id: 'mana_elixir', qty: 10 }] },
  },

  nim_stardust: {
    id: 'nim_stardust', name: 'Stardust Wishes', giver: 'nim', minLevel: 38, prereq: 'nim_cape',
    text: "I want to make a real wish candle, out of Stardust. Go up to the very top of the Sky Garden where the Star Seraphs sing, then bring me 10 Stardust? This time the candles and I make the wish together. As a team. Like in the books.",
    objectives: [{ type: 'visit', map: 'sky', above: 570, place: 'the top of the Sky Garden' }, { type: 'collect', item: 'stardust', count: 10 }],
    rewards: { exp: 110000, gold: 1600, cash: 1000, items: [{ id: 'elixir', qty: 10 }] },
    scenes: { done: 'stardust_done' },
  },


  // The instructors: a short story each, between your first job and the trial at 30.
  // Brann's: the shield he lost holding a doorway in the Twilight Ruins, the scared recruit he
  // held it for (Tora, his blacksmith now), and the night it comes back to him.
  brann_stand: {
    id: 'brann_stand', name: 'Stand Your Ground', giver: 'brann', minLevel: 15, family: 'warrior',
    text: "A warrior holds the line. That's it. That's the whole class. The Wargs in Mossy Woods hunt in packs: face 25 of them and don't take a step back. Sideways is fine. I checked the rules.",
    objectives: [{ type: 'kill', mob: 'boarlet', count: 25 }],
    rewards: { exp: 12000, gold: 350, items: [{ id: 'warrior_cape_15', qty: 1, forJob: true, variant: 'roll' }] },
  },
  kestrel_canyon: {
    id: 'kestrel_canyon', name: 'The Arrow That Never Landed', giver: 'kestrel', minLevel: 12, prereq: 'kestrel_targets', family: 'archer',
    text: "Fine, you heard the story. Everyone has. There's a song. It rhymes 'Kestrel' with 'never fell'. I shot it from the very top of Windy Canyon and it never came down. Climb up there and tell me what the wind does. Mind the Manticore Cubs nesting on the ledges: calm 15 of them.",
    objectives: [{ type: 'visit', map: 'canyon', above: 310, place: 'the very top of Windy Canyon' }, { type: 'kill', mob: 'scorpip', count: 15 }],
    rewards: { exp: 5600, gold: 180, items: [{ id: 'warrior_gloves_10', qty: 1, forJob: true, variant: 'roll' }] },
  },
  kestrel_glade: {
    id: 'kestrel_glade', name: 'Sylph Treasure', giver: 'kestrel', minLevel: 21, prereq: 'kestrel_canyon', family: 'archer',
    text: "The wind up there blows east, all the way to the Whispering Glade. And Sylphs steal anything shiny or clever, which explains my arrow AND my lunchbox. Go to the top of the Glade where they keep their hoard, and calm 15 of them so you can look. Please.",
    objectives: [{ type: 'visit', map: 'glade', above: 330, place: 'the Sylphs\' hoard at the top of the Glade' }, { type: 'kill', mob: 'sylph', count: 15 }],
    rewards: { exp: 13500, gold: 360, items: [{ id: 'mana_elixir', qty: 5 }] },
  },
  kestrel_wings: {
    id: 'kestrel_wings', name: 'Wings in the Dark', giver: 'kestrel', minLevel: 22, prereq: 'kestrel_glade', family: 'archer',
    text: "Its fletching's in tatters, but the shaft is straight as the day I made it. Imp Wings make the best feathers there are. Shoot down 15 Imps in the Twilight Ruins and bring me 7 of their wings. Only about half of them drop one. Where do the other wings go? Nobody knows. Science can't explain it. This time, it lands.",
    objectives: [{ type: 'kill', mob: 'gloombat', count: 15 }, { type: 'collect', item: 'bat_wing', count: 7 }],
    rewards: { exp: 29000, gold: 780, items: [{ id: 'warrior_cape_20', qty: 1, forJob: true, variant: 'roll' }] },
  },
  // Elowen's story (her Star Witches'): the teapot she and Mira broke as apprentices, each keeping
  // half (Mira the pot, Elowen the lid; data/scenes.js letter_open). The real quarrel was never
  // about the teapot, and at the end Mira comes to the Grove to put it back together.
  elowen_dance: {
    id: 'elowen_dance', name: 'Dance of the Dryads', giver: 'elowen', minLevel: 15, family: 'mage',
    text: "The Dryads of Mossy Woods dance with the wind, but they've forgotten the steps. Now they just sway, like uncles at a wedding. Calm 15 of them, and bring me 7 of their leaves to press into charms. Festival charms. Not that I'm going.",
    objectives: [{ type: 'kill', mob: 'leafling', count: 15 }, { type: 'collect', item: 'leaf_fragment', count: 7 }],
    rewards: { exp: 9700, gold: 320, items: [{ id: 'warrior_cape_15', qty: 1, forJob: true, variant: 'roll' }] },
  },
  // Vex's story (her Wind Dancers'): Tora's good hammer, which Vex "borrowed" to build a secret
  // stage on the harbor for its first dance festival, then lost to the Kitsune Miko's light
  // fingers. On opening night it goes home to Tora, who knew all along.
  vex_shadows: {
    id: 'vex_shadows', name: 'Shadow Run', giver: 'vex', minLevel: 15, family: 'thief',
    text: "A dancer's legs carry the whole show. Run to the top of Windy Canyon, cross to Ember Crag and say hi to Tora for me. Quick feet now. Training-montage pace. I'll hum.",
    objectives: [
      { type: 'visit', map: 'canyon', above: 330, place: 'the top of Windy Canyon' },
      { type: 'talk', npc: 'tora', say: "Vex sent you? Ha. Tell that rascal I want my good hammer back. She thinks I didn't notice. I notice EVERYTHING. ...Have you seen my glasses?" },
    ],
    rewards: { exp: 8000, gold: 410, items: [{ id: 'warrior_cape_15', qty: 1, forJob: true, variant: 'roll' }] },
  },

  // ---------- The far regions ----------
  // Nim's story: she wishes on a candle for the wind to come back, and her floating candles,
  // who overheard, run off to find it for her. The biggest one becomes a caped "hero" on the
  // Temple Roof. They come home, and Nim and her candles make the wish together, as a team.
  nim_chimes: {
    id: 'nim_chimes', name: 'Stolen Chimes', giver: 'nim', minLevel: 19,
    text: "Th-the Sylphs in the Whispering Glade keep stealing my wind chimes. They wear them as earrings. They look really good in them, which makes it worse. Shoo 15 of them away and bring back 6 of the feathers they shed? As a, um, trade? Is that how trading works?",
    objectives: [{ type: 'kill', mob: 'sylph', count: 15 }, { type: 'collect', item: 'sylph_feather', count: 6 }],
    rewards: { exp: 26000, gold: 700, items: [{ id: 'mana_elixir', qty: 5 }] },
  },

  elowen_wisps: {
    id: 'elowen_wisps', name: 'Kettle Lights', giver: 'elowen', minLevel: 20, prereq: 'elowen_dance', family: 'mage',
    text: "Our teacher's teapot only sang when the lid and the pot were warmed in wisp-light together. Yes, a magic teapot. Every mage has one, it's in the handbook. If I'm ever to give the lid back, it should be ready. Bring me 8 Wisp Flames from the Will-o'-Wisps in the Twilight Ruins, next door.",
    objectives: [{ type: 'collect', item: 'wisp_flame', count: 8 }],
    rewards: { exp: 16000, gold: 410, items: [{ id: 'warrior_gloves_20', qty: 1, forJob: true, variant: 'roll' }] },
  },
  elowen_foxfire: {
    id: 'elowen_foxfire', name: 'A Fox-Fire Offering', giver: 'elowen', minLevel: 24, prereq: 'elowen_wisps', family: 'mage',
    text: "Past the Twilight Ruins, the Fox Shrine Path climbs to a little shrine on the top terrace. The foxes there grant courage, they say. Bring 10 of the little bells the Nekomata wear to hang at the shrine, and leave a prayer there for me. A long one. Use big words. I'll need it.",
    objectives: [{ type: 'collect', item: 'nekomata_bell', count: 10 }, { type: 'visit', map: 'shrine', above: 530, place: 'the shrine on the top terrace' }],
    rewards: { exp: 24000, gold: 620, items: [{ id: 'white_potion', qty: 20 }, { id: 'warrior_hat_25', qty: 1, forJob: true, variant: 'roll' }] },
  },
  elowen_lid: {
    id: 'elowen_lid', name: 'The Lid, Returned', giver: 'elowen', minLevel: 25, prereq: 'elowen_foxfire', family: 'mage',
    text: "I can't take it to her myself. My knees won't let me. My pride won't either, but mostly the knees. Will you carry the lid to Mira in Sprout Village? It's wrapped, so she can choose not to open it. Then come back and tell me what her face did. In detail.",
    gives: [{ id: 'parcel' }],
    objectives: [{ type: 'deliver', npc: 'mira', item: 'parcel', say: "The lid? She kept it, all these years? Oh, that silly, stubborn, dramatic witch. Go back and tell her to put the kettle on. I'm coming. I'm bringing biscuits, so she can't win." }],
    rewards: { exp: 9000, gold: 300, items: [{ id: 'ear_25', qty: 1, variant: 'roll' }] },
  },
  vex_stage: {
    id: 'vex_stage', name: 'Quick Feet, Quiet Hands', giver: 'vex', minLevel: 18, prereq: 'vex_shadows', family: 'thief',
    text: "The hammer's for a good cause, and that's all I'm saying. A good cause also needs boards. Heartwood, from the Treants in Mossy Woods: bring me 8. Don't tell anyone what it's for. You don't know what it's for. Nobody knows anything. Act natural.",
    objectives: [{ type: 'collect', item: 'moss_stone', count: 8 }],
    rewards: { exp: 14600, gold: 380, items: [{ id: 'warrior_gloves_20', qty: 1, forJob: true, variant: 'roll' }] },
  },
  vex_miko: {
    id: 'vex_miko', name: 'Miko Mischief', giver: 'vex', minLevel: 26, prereq: 'vex_stage', family: 'thief',
    text: "Someone stole a hammer I stole. From ME. The audacity. Kitsune Miko, on the Fox Shrine Path: little fox ears, sticky fingers, no respect for professionals. Teach 25 of them some manners and get it back, before Tora counts her tools.",
    objectives: [{ type: 'kill', mob: 'kitsunemiko', count: 25 }],
    rewards: { exp: 31000, gold: 830, items: [{ id: 'warrior_shoes_25', qty: 1, forJob: true, variant: 'roll' }] },
  },
  vex_festival: {
    id: 'vex_festival', name: 'Opening Night', giver: 'vex', minLevel: 27, prereq: 'vex_miko', family: 'thief',
    text: "Stage built, hammer found, conscience... loud. Take it back to Tora in Ember Crag, wrapped nicely. Say it fell into a pond for a year. Then come straight back: the show starts tonight, and I want you in the front row.",
    gives: [{ id: 'parcel' }],
    objectives: [{ type: 'deliver', npc: 'tora', item: 'parcel', say: "My good hammer! Polished, even. That rascal. Tell her I'll be at her show, front row, and she's buying the snacks." }],
    rewards: { exp: 9000, gold: 300, items: [{ id: 'ear_25', qty: 1, variant: 'roll' }] },
  },
  brann_ruins: {
    id: 'brann_ruins', name: 'Where the Line Broke', giver: 'brann', minLevel: 22, prereq: 'brann_stand', family: 'warrior',
    text: "Twenty years ago I held the old gatehouse at the top of the Twilight Ruins, alone, all night. Picture it in black and white, with rain. By morning my shield was gone. Climb up there for me. The Dullahans still patrol that wall because nobody told them the war ended: put 15 of them to rest on the way.",
    objectives: [{ type: 'visit', map: 'ruins', above: 310, place: 'the old gatehouse at the top of the ruins' }, { type: 'kill', mob: 'boneknight', count: 15 }],
    rewards: { exp: 17000, gold: 450, items: [{ id: 'white_potion', qty: 10 }] },
  },
  brann_forge: {
    id: 'brann_forge', name: "The Smith's Secret", giver: 'tora', minLevel: 24, prereq: 'brann_ruins', family: 'warrior',
    text: "Shh! Don't tell him. That shield? I've got it. I was the scared recruit he held that gatehouse for. I went back for it years later, and it's been in pieces under my bench ever since, next to my feelings. Bring me 10 Bone Shards from the Dullahans for rivets, and I'll make it whole.",
    objectives: [{ type: 'collect', item: 'bone_shard', count: 10 }],
    rewards: { exp: 23000, gold: 600, items: [{ id: 'warrior_shoes_25', qty: 1, forJob: true, variant: 'roll' }] },
  },
  brann_howl: {
    id: 'brann_howl', name: 'Howl at the Moon', giver: 'brann', minLevel: 28, prereq: 'brann_forge', family: 'warrior',
    text: "Tora told me. I can't hold it yet. Not after that night. I'd need a training montage first, and we don't have the budget. You carry it. Climb the howling rock on Moonlit Ridge with it raised, and calm 25 of Lupina's pack under it. If it still holds, maybe I can too.",
    objectives: [{ type: 'visit', map: 'ridge', above: 510, place: 'the top of the howling rock' }, { type: 'kill', mob: 'lupina', count: 25 }],
    rewards: { exp: 34000, gold: 900, items: [{ id: 'warrior_bottom_30', qty: 1, forJob: true, variant: 'roll' }] },
  },
  marlo_key: {
    id: 'marlo_key', name: 'The Brass Key', giver: 'marlo', minLevel: 23, prereq: 'tusk_trader',
    text: "Grandma's bathhouse key went missing on the Fox Shrine Path the night we fled. Nekomata hoard anything that jingles, so it's in one of their bell piles. I'd bet my cart on it. Not the jar. Never the jar. Bring me 8 Nekomata Bells and let's see.",
    objectives: [{ type: 'collect', item: 'nekomata_bell', count: 8 }],
    rewards: { exp: 18000, gold: 480, items: [{ id: 'warrior_bottom_25', qty: 1, forJob: true, variant: 'roll' }] },
  },
  marlo_spa: {
    id: 'marlo_spa', name: 'Spa Day', giver: 'marlo', minLevel: 31, prereq: 'marlo_key',
    text: "Serpent Springs, off the Crystal Cave. Hot pools, steam, Grandma's tiles. The Lamia still lounge in it like they own the place. They don't pay rent. I've asked. Clear them out and bring me 9 of their scales for new tiles. Then we open.",
    objectives: [{ type: 'collect', item: 'lamia_scale', count: 9 }, { type: 'kill', mob: 'lamia', count: 10 }],
    rewards: { exp: 57000, gold: 1200, cash: 500, items: [{ id: 'cash_casual_towel', qty: 1 }] },
  },
  lulu_winter: {
    id: 'lulu_winter', name: 'Winter Collection', giver: 'lulu', minLevel: 35, prereq: 'lulu_runway',
    text: "Snow season! For my winter line I need 8 Snow Gems from the Yuki-onna on Frozen Peak and 6 Cloud Manes from the Pegasus Foals up there. You'll get the first parka, of course!",
    objectives: [{ type: 'collect', item: 'snow_gem', count: 8 }, { type: 'collect', item: 'wool', count: 6 }],
    rewards: { exp: 80000, gold: 1500, items: [{ id: 'cash_casual_parka', qty: 1 }, { id: 'cash_casual_mittens', qty: 1 }] },
  },
  rook_stars: {
    id: 'rook_stars', name: 'Wishing on Stars', giver: 'rook', minLevel: 45,
    text: "My old crew swears that at Starfall Heights, over the Sky Garden, you can catch a falling star. Calm 15 Star Seraphs up there and bring back 6 Stardust. A sailor never stops wishing!",
    objectives: [{ type: 'kill', mob: 'starspirit', count: 15 }, { type: 'collect', item: 'stardust', count: 6 }],
    rewards: { exp: 140000, gold: 2000, items: [{ id: 'warrior_top_45', qty: 1, forJob: true, variant: 'gilded' }, { id: 'elixir', qty: 15 }] },
  },
};

// The main story's quests (data/story.js) live with the rest.
Object.assign(QUESTS, STORY_QUESTS);
// Cutscenes for the side quests that matter most (data/scenes.js).
for (const [id, scenes] of Object.entries(QUEST_SCENES)) QUESTS[id].scenes = scenes;
