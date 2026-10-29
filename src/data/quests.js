// Quests. Objectives: kill a monster N times, or collect N of an item (handed in on completion).
// A quest with no objectives completes as soon as you accept it.

// A reward marked `forJob` is job gear: the hero gets their own job's piece instead (the id names
// the slot and level). `variant` gives it a color ('roll' picks one).
export const QUESTS = {
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
};
