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
  mage: {
    id: 'mage', name: 'Mage', family: 'mage', tier: 1, parent: 'novice', level: 10,
    hp: 13, mp: 24, advanceHp: 100, advanceMp: 380, weapons: ['wand', 'staff'],
    blurb: 'Spells of flowers and light: petal bolts and storms for damage with INT, plus heals, barriers and revives for the party. Builds Bloom; full, every damage spell also heals allies near where it lands. The healer of any dungeon group.',
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
  ranger: {
    id: 'ranger', name: 'Ranger', family: 'archer', tier: 2, parent: 'archer', level: 30, trial: 'archer_trial',
    hp: 24, mp: 18, advanceHp: 320, advanceMp: 280, weapons: ['bow'],
    blurb: 'Rides the wind with a bow. Every arrow that lands builds Gale; the fuller it is the faster you shoot, and full, every shot looses a twin. Leaps, spins, and storms of arrows.',
  },
  sniper: {
    id: 'sniper', name: 'Sniper', family: 'archer', tier: 2, parent: 'archer', level: 30, trial: 'archer_trial',
    hp: 24, mp: 17, advanceHp: 300, advanceMp: 260, weapons: ['crossbow'],
    blurb: 'One bolt, one kill. Holding still and landing bolts builds Focus for sharper criticals; full, the next bolt is a Deadeye that always crits and tears through the line. Heavy, frost, and blast bolts.',
  },

  // Thief branches. Both ask for Vex's trial first; each keeps to one of the Thief's two weapons.
  assassin: {
    id: 'assassin', name: 'Assassin', family: 'thief', tier: 2, parent: 'thief', level: 30, trial: 'thief_trial',
    hp: 24, mp: 17, advanceHp: 320, advanceMp: 260, weapons: ['dagger'],
    blurb: 'Death from behind with a dagger. Hits from behind and critical hits build Killing Intent; full, every first cut on a monster is sure to crit and the weakened die in one blow. Marks, vanishing, poisoned blades and crows.',
  },
  nightlord: {
    id: 'nightlord', name: 'Night Lord', family: 'thief', tier: 2, parent: 'thief', level: 30, trial: 'thief_trial',
    hp: 23, mp: 18, advanceHp: 300, advanceMp: 280, weapons: ['gauntlet'],
    blurb: 'A storm of stars from a gauntlet. Stars that land build Starlight, faster when they pile onto one target; full, every star splits into three. Giant shuriken, sticky exploding stars and falling constellations.',
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
export const RETIRED_JOBS = {
  // The mage paths are retired for now (to be remade like the warrior's and archer's): those
  // characters return to the first-job Mage.
  pyromancer: 'mage', infernosage: 'mage', seraph: 'mage', ilwizard: 'mage', fpwizard: 'mage', cleric: 'mage', ilarchmage: 'mage', fparchmage: 'mage', bishop: 'mage',
  blademaster: 'warrior', lancer: 'warrior', guardian: 'warrior', swordsaint: 'warrior', dragonknight: 'warrior', ranger: 'archer', marksman: 'archer', hunter: 'archer', windwalker: 'archer', deadeye: 'archer', beastmaster: 'archer', duelist: 'thief', shadow: 'thief', trickster: 'thief', bladedancer: 'thief', nightstalker: 'thief', phantomthief: 'thief',
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
