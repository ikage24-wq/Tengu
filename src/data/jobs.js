// Jobs: a Novice start, four first jobs at level 10, second-job branches at level 30, and third jobs at 50.
// HP/MP growth follows the classic split: warriors tanky, mages MP-heavy, archers and thieves between.

export const FAMILY_STATS = {
  beginner: { primary: 'str', secondary: 'dex' },
  warrior: { primary: 'str', secondary: 'dex' },
  mage: { primary: 'int', secondary: 'luk' },
  archer: { primary: 'dex', secondary: 'str' },
  thief: { primary: 'luk', secondary: 'dex' },
  gm: { primary: 'int', secondary: 'luk' },
};

// Every class follows the same template: a first job at 10, three second-job branches at 30,
// and one third job per branch at 50 with a summon or signature buff and a screen-wide ultimate.
export const JOBS = {
  novice: {
    id: 'novice', name: 'Novice', family: 'beginner', tier: 0, parent: null,
    hp: 16, mp: 12, advanceHp: 0, advanceMp: 0,
    weapons: ['none', 'sword', 'axe', 'spear', 'wand', 'staff', 'bow', 'crossbow', 'dagger', 'claw'],
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
    blurb: 'Spells and support: big magic damage with INT, plus heals and barriers for the party. The healer of any dungeon group.',
  },
  archer: {
    id: 'archer', name: 'Archer', family: 'archer', tier: 1, parent: 'novice', level: 10,
    hp: 22, mp: 17, advanceHp: 250, advanceMp: 250, weapons: ['bow', 'crossbow'],
    blurb: 'Fires from a distance with DEX. Steady and safe.',
  },
  thief: {
    id: 'thief', name: 'Thief', family: 'thief', tier: 1, parent: 'novice', level: 10,
    hp: 22, mp: 17, advanceHp: 250, advanceMp: 250, weapons: ['dagger', 'claw'],
    blurb: 'Quick hits with LUK. Daggers up close or claws at range.',
  },

  ilwizard: {
    id: 'ilwizard', name: 'Stormfrost Wizard', short: 'Wizard', family: 'mage', tier: 2, parent: 'mage', level: 30,
    hp: 14, mp: 24, advanceHp: 120, advanceMp: 420, weapons: ['wand', 'staff'],
    blurb: 'Ice and lightning. Freezes monsters solid, then shatters them with thunder.',
  },
  fpwizard: {
    id: 'fpwizard', name: 'Venomflame Wizard', short: 'Wizard', family: 'mage', tier: 2, parent: 'mage', level: 30,
    hp: 14, mp: 24, advanceHp: 120, advanceMp: 420, weapons: ['wand', 'staff'],
    blurb: 'Fire and poison. Burns everything, and the venom keeps eating them after.',
  },
  cleric: {
    id: 'cleric', name: 'Cleric', family: 'mage', tier: 2, parent: 'mage', level: 30,
    hp: 18, mp: 24, advanceHp: 220, advanceMp: 400, weapons: ['wand', 'staff'],
    blurb: 'Holy light that heals you and smites everything nearby. The sturdiest mage.',
  },
  ilarchmage: {
    id: 'ilarchmage', name: 'Stormfrost Archmage', short: 'Archmage', family: 'mage', tier: 3, parent: 'ilwizard', level: 50,
    hp: 16, mp: 30, advanceHp: 250, advanceMp: 900, weapons: ['wand', 'staff'],
    blurb: 'Master of the storm. Chains lightning through crowds and buries them in a glacial tempest.',
  },
  fparchmage: {
    id: 'fparchmage', name: 'Venomflame Archmage', short: 'Archmage', family: 'mage', tier: 3, parent: 'fpwizard', level: 50,
    hp: 16, mp: 30, advanceHp: 250, advanceMp: 900, weapons: ['wand', 'staff'],
    blurb: 'Master of plague and flame. Raises toxic infernos and calls down meteor storms.',
  },
  bishop: {
    id: 'bishop', name: 'Bishop', family: 'mage', tier: 3, parent: 'cleric', level: 50,
    hp: 20, mp: 28, advanceHp: 400, advanceMp: 800, weapons: ['wand', 'staff'],
    blurb: 'Judges whole crowds with pillars of light, guarded by a summoned angel.',
  },

  // Hidden: only unlocked with the Game Master passphrase, never offered by an instructor.
  gamemaster: {
    id: 'gamemaster', name: 'Game Master', family: 'gm', tier: 9, parent: null, hidden: true,
    hp: 60, mp: 60, advanceHp: 5000, advanceMp: 5000,
    weapons: ['none', 'sword', 'axe', 'spear', 'wand', 'staff', 'bow', 'crossbow', 'dagger', 'claw'],
    blurb: 'Keeper of Tengu Island. Uses anything, goes anywhere.',
  },
};

// Jobs renamed or retired since older saves were made, and what they became.
// Warrior, archer, and thief advanced jobs are retired for now; those characters return to their first job.
export const RETIRED_JOBS = {
  pyromancer: 'fpwizard', infernosage: 'fparchmage', seraph: 'bishop',
  blademaster: 'warrior', lancer: 'warrior', guardian: 'warrior', swordsaint: 'warrior', dragonknight: 'warrior', paladin: 'warrior', ranger: 'archer', marksman: 'archer', hunter: 'archer', windwalker: 'archer', deadeye: 'archer', beastmaster: 'archer', duelist: 'thief', shadow: 'thief', trickster: 'thief', bladedancer: 'thief', nightstalker: 'thief', phantomthief: 'thief',
};

// Jobs a character can advance into right now, given their current job and level.
export function nextJobs(jobId, level) {
  return Object.values(JOBS).filter((j) => j.parent === jobId && level >= j.level);
}

// The chain of jobs from Novice to `jobId`, oldest first. Skills from every job in the chain stay usable.
export function jobChain(jobId) {
  const chain = [];
  for (let j = JOBS[jobId]; j; j = JOBS[j.parent]) chain.unshift(j.id);
  return chain;
}
