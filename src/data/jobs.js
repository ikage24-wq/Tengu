// Jobs: a Novice start, four first jobs at level 10, and second-job branches at level 30.
// HP/MP growth follows the classic split: warriors tanky, mages MP-heavy, archers and thieves between.

export const FAMILY_STATS = {
  beginner: { primary: 'str', secondary: 'dex' },
  warrior: { primary: 'str', secondary: 'dex' },
  mage: { primary: 'int', secondary: 'luk' },
  archer: { primary: 'dex', secondary: 'str' },
  thief: { primary: 'luk', secondary: 'dex' },
  gm: { primary: 'int', secondary: 'luk' },
};

// Every class follows the same template: a first job at 10, then two paths at 30 after a trial.
export const JOBS = {
  novice: {
    id: 'novice', name: 'Novice', family: 'beginner', tier: 0, parent: null,
    hp: 16, mp: 12, advanceHp: 0, advanceMp: 0,
    weapons: ['none', 'sword', 'axe', 'spear', 'wand', 'staff', 'bow', 'crossbow', 'dagger', 'gauntlet'],
    blurb: 'Everyone starts here. Train up to level 10, then pick a path.',
  },

  warrior: {
    id: 'warrior', name: 'Warrior', family: 'warrior', tier: 1, parent: 'novice', level: 10,
    hp: 28, mp: 12, advanceHp: 350, advanceMp: 150, weapons: ['sword', 'axe', 'spear'],
    blurb: 'Close-range fighter with big HP. Raises STR.',
  },
  // The Spirit Mage: a young shrine mage whose spirits strike and heal (remade from scratch; the
  // old Mage is retired). Damage and support at once, with the Spirit Doll at her side.
  spiritmage: {
    id: 'spiritmage', name: 'Spirit Mage', family: 'mage', tier: 1, parent: 'novice', level: 10,
    hp: 14, mp: 24, advanceHp: 120, advanceMp: 380, weapons: ['wand', 'staff'],
    blurb: 'Dances her spells with a wand or staff: bolts of white spirit light for damage with INT, and blessings that heal the party. Spirit builds from both, faster when she weaves them; full, her damage spells heal too. A mischievous Spirit Doll floats at her side and fights with her own little tricks.',
  },
  archer: {
    id: 'archer', name: 'Archer', family: 'archer', tier: 1, parent: 'novice', level: 10,
    hp: 22, mp: 17, advanceHp: 250, advanceMp: 250, weapons: ['bow', 'crossbow'],
    blurb: 'Fires from a distance with DEX. Steady and safe.',
  },
  thief: {
    id: 'thief', name: 'Thief', family: 'thief', tier: 1, parent: 'novice', level: 10,
    hp: 22, mp: 17, advanceHp: 250, advanceMp: 250, weapons: ['dagger', 'gauntlet'],
    blurb: 'Quick hits with LUK. Daggers up close, or a gauntlet that hurls throwing stars at range.',
  },

  // Spirit Mage branches. Both ask for Elowen's trial first (docs/design/spirit-mage-paths.md).
  // Both are built: the Shrine Maiden (her guardian, Grace, her skills and Thousand Torii) and the
  // Onmyoji (her yokai troupe led by the tengu, Binding, her skills and Hyakki Yagyo).
  shrinemaiden: {
    id: 'shrinemaiden', name: 'Shrine Maiden', family: 'mage', tier: 2, parent: 'spiritmage', level: 30, trial: 'spiritmage_trial',
    hp: 18, mp: 26, advanceHp: 260, advanceMp: 480, weapons: ['wand', 'staff'],
    blurb: 'The shrine\'s own priestess, the heart of any party. Heals, wards and blessings carry everyone, and a kitsune shrine guardian with a naginata stands in front of them. The healer of any dungeon group.',
  },
  onmyoji: {
    id: 'onmyoji', name: 'Onmyoji', family: 'mage', tier: 2, parent: 'spiritmage', level: 30, trial: 'spiritmage_trial',
    hp: 16, mp: 28, advanceHp: 220, advanceMp: 520, weapons: ['wand', 'staff'],
    blurb: 'The spirit-binder. A rowdy troupe of yokai (an oni, a yuki-onna and a tengu) fights at her side, kept in line with talismans and star seals. Deals damage in a group.',
  },

  // Warrior branches. Both ask for Brann's trial first (see `trial`).
  paladin: {
    id: 'paladin', name: 'Paladin', family: 'warrior', tier: 2, parent: 'warrior', level: 30, trial: 'warrior_trial',
    hp: 32, mp: 14, advanceHp: 600, advanceMp: 200, weapons: ['sword', 'axe', 'spear'],
    blurb: 'The shield of the party. Holy light stuns and taunts, and blessings guard everyone near. The tank of any dungeon group.',
  },
  berserker: {
    id: 'berserker', name: 'Berserker', family: 'warrior', tier: 2, parent: 'warrior', level: 30, trial: 'warrior_trial',
    hp: 30, mp: 12, advanceHp: 450, advanceMp: 150, weapons: ['sword', 'axe', 'spear'],
    blurb: 'Rage made flesh. Every blow builds Rage and makes them bleed; Rampage spends it all in one savage flurry. Deals damage in a group.',
  },

  // Archer branches. Both ask for Kestrel's trial first.
  beastmaster: {
    id: 'beastmaster', name: 'Beastmaster', family: 'archer', tier: 2, parent: 'archer', level: 30, trial: 'archer_trial',
    hp: 26, mp: 17, advanceHp: 340, advanceMp: 260, weapons: ['bow'],
    blurb: 'Hunts with a bow beside her wolf and hawk. Her shots and her animals\' hits build Bond; full, the animals grow bigger and hunt on their own. Pounces, dives, howls and a stampede of spirit beasts.',
  },
  stormcaller: {
    id: 'stormcaller', name: 'Stormcaller', family: 'archer', tier: 2, parent: 'archer', level: 30, trial: 'archer_trial',
    hp: 24, mp: 18, advanceHp: 300, advanceMp: 280, weapons: ['crossbow'],
    blurb: 'Calls the storm down with a crossbow. Her bolts build Charge; full, every bolt chains on to one more monster. Lightning that jumps between monsters, charged ground, a storm cloud overhead, and Thunderhead: a storm over the whole screen.',
  },

  // Thief branches, a pair from the same mountain shrine. Both ask for Vex's trial first; each
  // keeps to one of the Thief's two weapons.
  shinobi: {
    id: 'shinobi', name: 'Shinobi', family: 'thief', tier: 2, parent: 'thief', level: 30, trial: 'thief_trial',
    hp: 24, mp: 17, advanceHp: 320, advanceMp: 260, weapons: ['dagger'],
    blurb: 'Ink, smoke and seals with a dagger. Hits and dodges build Ki; full, two ink clones repeat every attack. Kunai, exploding seals, smoke bombs, a log to swap places with, and Thousand Cuts: a giant ink fox.',
  },
  kitsune: {
    id: 'kitsune', name: 'Kitsune', family: 'thief', tier: 2, parent: 'thief', level: 30, trial: 'thief_trial',
    hp: 23, mp: 18, advanceHp: 300, advanceMp: 280, weapons: ['gauntlet'],
    blurb: 'Fox-fire stars from a gauntlet. Her stars set monsters burning and grow her Tails, one to nine; every three tails a fox-fire illusion throws stars beside her. Fox-fire fans, illusions, traps, and Nine-Tail Blaze: a giant fox of blue fire.',
  },

  // Hidden: only unlocked with the Game Master passphrase, never offered by an instructor.
  gamemaster: {
    id: 'gamemaster', name: 'Game Master', family: 'gm', tier: 9, parent: null, hidden: true,
    hp: 60, mp: 60, advanceHp: 5000, advanceMp: 5000,
    weapons: ['none', 'sword', 'axe', 'spear', 'wand', 'staff', 'bow', 'crossbow', 'dagger', 'gauntlet'],
    blurb: 'Keeper of Tengu Island. Uses anything, goes anywhere.',
  },
};

// Jobs renamed or retired since older saves were made, and what they became.
// Older warrior, archer, and thief advanced jobs are retired; those characters return to their first job.
// The archer's Ranger and Sniper were remade as the Beastmaster and the Stormcaller.
export const RETIRED_JOBS = {
  // The Mage and her old paths were removed (a new magic class is being built from scratch): those
  // characters go back to the Novice, their skill points given back, free to pick a job again.
  mage: 'novice', pyromancer: 'novice', infernosage: 'novice', seraph: 'novice', ilwizard: 'novice', fpwizard: 'novice', cleric: 'novice', ilarchmage: 'novice', fparchmage: 'novice', bishop: 'novice',
  blademaster: 'warrior', lancer: 'warrior', guardian: 'warrior', swordsaint: 'warrior', dragonknight: 'warrior', ranger: 'beastmaster', sniper: 'stormcaller', marksman: 'archer', hunter: 'archer', windwalker: 'archer', deadeye: 'archer', assassin: 'shinobi', nightlord: 'kitsune', duelist: 'thief', shadow: 'thief', trickster: 'thief', bladedancer: 'thief', nightstalker: 'thief', phantomthief: 'thief',
};

// Jobs a character can advance into right now, given their current job and level. Some ask for a
// trial quest first: pass the character's quest records to leave those out until it's done.
export function nextJobs(jobId, level, quests = null) {
  return Object.values(JOBS).filter((j) => j.parent === jobId && level >= j.level && (!quests || !j.trial || quests[j.trial]?.state === 'done'));
}

// The chain of jobs from Novice to `jobId`, oldest first. Skills from every job in the chain stay usable.
export function jobChain(jobId) {
  const chain = [];
  for (let j = JOBS[jobId]; j; j = JOBS[j.parent]) chain.unshift(j.id);
  return chain;
}
