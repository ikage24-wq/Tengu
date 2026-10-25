// Jobs: a Novice start, four first jobs at level 10, and two second-job branches each at level 30.
// HP/MP growth follows the classic split: warriors tanky, mages MP-heavy, archers and thieves between.

export const FAMILY_STATS = {
  beginner: { primary: 'str', secondary: 'dex' },
  warrior: { primary: 'str', secondary: 'dex' },
  mage: { primary: 'int', secondary: 'luk' },
  archer: { primary: 'dex', secondary: 'str' },
  thief: { primary: 'luk', secondary: 'dex' },
  gm: { primary: 'int', secondary: 'luk' },
};

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
    hp: 16, mp: 22, advanceHp: 150, advanceMp: 350, weapons: ['wand', 'staff'],
    blurb: 'Casts spells from range with INT. Fragile but strong.',
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

  blademaster: {
    id: 'blademaster', name: 'Blademaster', family: 'warrior', tier: 2, parent: 'warrior', level: 30,
    hp: 30, mp: 12, advanceHp: 400, advanceMp: 150, weapons: ['sword', 'axe'],
    blurb: 'Swords and axes. Rage-fueled sweeps and fast combos.',
  },
  lancer: {
    id: 'lancer', name: 'Lancer', family: 'warrior', tier: 2, parent: 'warrior', level: 30,
    hp: 32, mp: 12, advanceHp: 450, advanceMp: 150, weapons: ['spear'],
    blurb: 'Long spears that hit whole crowds. The tankiest path.',
  },
  pyromancer: {
    id: 'pyromancer', name: 'Pyromancer', family: 'mage', tier: 2, parent: 'mage', level: 30,
    hp: 16, mp: 24, advanceHp: 150, advanceMp: 400, weapons: ['wand', 'staff'],
    blurb: 'Fireballs and blazing fields. Pure damage.',
  },
  cleric: {
    id: 'cleric', name: 'Cleric', family: 'mage', tier: 2, parent: 'mage', level: 30,
    hp: 18, mp: 24, advanceHp: 200, advanceMp: 400, weapons: ['wand', 'staff'],
    blurb: 'Holy light that heals you and smites everything nearby.',
  },
  infernosage: {
    id: 'infernosage', name: 'Inferno Sage', family: 'mage', tier: 3, parent: 'pyromancer', level: 50,
    hp: 18, mp: 28, advanceHp: 300, advanceMp: 800, weapons: ['wand', 'staff'],
    blurb: 'Calls down meteor storms and binds a shadow cross to fight beside you.',
  },
  seraph: {
    id: 'seraph', name: 'Seraph', family: 'mage', tier: 3, parent: 'cleric', level: 50,
    hp: 20, mp: 28, advanceHp: 400, advanceMp: 800, weapons: ['wand', 'staff'],
    blurb: 'Judges whole crowds with pillars of light, guarded by a summoned angel.',
  },
  ranger: {
    id: 'ranger', name: 'Ranger', family: 'archer', tier: 2, parent: 'archer', level: 30,
    hp: 22, mp: 18, advanceHp: 300, advanceMp: 250, weapons: ['bow'],
    blurb: 'Bows. Exploding arrows and rapid volleys.',
  },
  marksman: {
    id: 'marksman', name: 'Marksman', family: 'archer', tier: 2, parent: 'archer', level: 30,
    hp: 22, mp: 18, advanceHp: 300, advanceMp: 250, weapons: ['crossbow'],
    blurb: 'Crossbows. Piercing bolts and heavy single shots.',
  },
  duelist: {
    id: 'duelist', name: 'Duelist', family: 'thief', tier: 2, parent: 'thief', level: 30,
    hp: 24, mp: 17, advanceHp: 300, advanceMp: 250, weapons: ['dagger'],
    blurb: 'Daggers. A blur of stabs and shadowy strikes.',
  },
  shadow: {
    id: 'shadow', name: 'Shadow', family: 'thief', tier: 2, parent: 'thief', level: 30,
    hp: 22, mp: 18, advanceHp: 250, advanceMp: 300, weapons: ['claw'],
    blurb: 'Claws. Throws stars in threes and storms of shuriken.',
  },

  // Hidden: only unlocked with the Game Master passphrase, never offered by an instructor.
  gamemaster: {
    id: 'gamemaster', name: 'Game Master', family: 'gm', tier: 9, parent: null, hidden: true,
    hp: 60, mp: 60, advanceHp: 5000, advanceMp: 5000,
    weapons: ['none', 'sword', 'axe', 'spear', 'wand', 'staff', 'bow', 'crossbow', 'dagger', 'claw'],
    blurb: 'Keeper of Tengu Island. Uses anything, goes anywhere.',
  },
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
