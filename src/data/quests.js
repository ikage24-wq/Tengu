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
    text: 'The Fuzzlets in Petal Meadow shed the softest fluff. Could you bring me 8 Fuzz Fluff?',
    objectives: [{ type: 'collect', item: 'fluff', count: 8 }],
    rewards: { exp: 60, gold: 200, items: [{ id: 'hat_0', qty: 1 }] },
  },
  snail_trouble: {
    id: 'snail_trouble', name: 'Snail Trouble', giver: 'pip', minLevel: 3,
    text: "Bloomsnails keep nibbling my crates! Defeat 12 of them and I'll pay you in tonics.",
    objectives: [{ type: 'kill', mob: 'snailbun', count: 12 }],
    rewards: { exp: 150, gold: 300, items: [{ id: 'red_potion', qty: 15 }, { id: 'blue_potion', qty: 5 }] },
  },
  sprout_sweep: {
    id: 'sprout_sweep', name: 'Sprout Sweep', giver: 'mira', minLevel: 5, prereq: 'fluffy',
    text: 'Spriglings are overrunning Clover Hills, past the meadow. Defeat 10 of them!',
    objectives: [{ type: 'kill', mob: 'sproutling', count: 10 }],
    rewards: { exp: 450, gold: 500, items: [{ id: 'shoes_0', qty: 1 }, { id: 'top_0', qty: 1 }] },
  },
  hollow_heart: {
    id: 'hollow_heart', name: 'Heart of the Hollow', giver: 'bramble', minLevel: 10,
    text: "Old Gnarlroot has been grumbling under the canyon for a week, and the whole Hollow woke up with him. Take a group down and calm him. Talk to me again when you're ready to go in.",
    objectives: [{ type: 'kill', mob: 'gnarlroot', count: 1 }],
    rewards: { exp: 5000, gold: 3000, items: [{ id: 'warrior_cape_15', qty: 1, forJob: true, variant: 'roll' }, { id: 'hollow_acorn', qty: 5 }] },
  },
  mush_menace: {
    id: 'mush_menace', name: 'Capper Chaos', giver: 'rook', minLevel: 8,
    text: 'Cappers have been hopping onto the docks. Clear out 20 of them in Clover Hills.',
    objectives: [{ type: 'kill', mob: 'mushkin', count: 20 }],
    rewards: { exp: 1400, gold: 800, items: [{ id: 'scroll_watk_60', qty: 1 }, { id: 'orange_potion', qty: 20 }] },
  },
  leaf_samples: {
    id: 'leaf_samples', name: 'Leaf Samples', giver: 'rook', minLevel: 12, prereq: 'mush_menace',
    text: 'Our herbalist needs 20 Leafox Tufts from the Leafoxes in Mossy Woods.',
    objectives: [{ type: 'collect', item: 'leaf_fragment', count: 20 }],
    rewards: { exp: 3500, gold: 1500, items: [{ id: 'warrior_gloves_15', qty: 1, forJob: true }, { id: 'scroll_glove_60', qty: 1 }] },
  },
  tusk_trader: {
    id: 'tusk_trader', name: 'Tusk Trader', giver: 'marlo', minLevel: 15,
    text: "Tuskbo tusks sell like hotcakes. Bring me 15 and I'll share the profits.",
    objectives: [{ type: 'collect', item: 'tusk', count: 15 }],
    rewards: { exp: 6000, gold: 4000, items: [{ id: 'scroll_def_60', qty: 2 }] },
  },
  restless_ruins: {
    id: 'restless_ruins', name: 'Restless Ruins', giver: 'rook', minLevel: 20, prereq: 'leaf_samples',
    text: 'Skelly Knights patrol the Twilight Ruins at night. Put 25 of them to rest.',
    objectives: [{ type: 'kill', mob: 'boneknight', count: 25 }],
    rewards: { exp: 18000, gold: 6000, items: [{ id: 'scroll_watk_10', qty: 1 }, { id: 'ear_20', qty: 1, variant: 'roll' }] },
  },
  crystal_heart: {
    id: 'crystal_heart', name: 'Heart of Crystal', giver: 'rook', minLevel: 35, prereq: 'restless_ruins',
    text: 'Deep in the Crystal Cave sits the Crystal King. Defeat it and bring peace to the coast.',
    objectives: [{ type: 'kill', mob: 'crystalking', count: 1 }],
    rewards: { exp: 150000, gold: 50000, items: [{ id: 'warrior_cape_40', qty: 1, forJob: true, variant: 'gilded' }, { id: 'elixir', qty: 10 }] },
  },
};
