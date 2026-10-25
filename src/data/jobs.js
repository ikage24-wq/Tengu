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
    blurb: 'A glass cannon: huge spell damage with INT, but very little HP.',
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
    id: 'blademaster', name: 'Blademaster', short: 'Blades', family: 'warrior', tier: 2, parent: 'warrior', level: 30,
    hp: 30, mp: 12, advanceHp: 400, advanceMp: 150, weapons: ['sword', 'axe'],
    blurb: 'Swords and axes. Rage-fueled sweeps and fast combos.',
  },
  lancer: {
    id: 'lancer', name: 'Lancer', family: 'warrior', tier: 2, parent: 'warrior', level: 30,
    hp: 32, mp: 12, advanceHp: 450, advanceMp: 150, weapons: ['spear'],
    blurb: 'Long spears that hit whole crowds, and the power of dragons.',
  },
  guardian: {
    id: 'guardian', name: 'Guardian', family: 'warrior', tier: 2, parent: 'warrior', level: 30,
    hp: 34, mp: 14, advanceHp: 500, advanceMp: 180, weapons: ['sword', 'axe', 'spear'],
    blurb: 'An unbreakable wall. Stuns monsters with shield bashes and shakes the earth.',
  },
  swordsaint: {
    id: 'swordsaint', name: 'Sword Saint', short: 'Saint', family: 'warrior', tier: 3, parent: 'blademaster', level: 50,
    hp: 32, mp: 14, advanceHp: 700, advanceMp: 250, weapons: ['sword', 'axe'],
    blurb: 'A blur of steel. Cuts monsters apart with sword waves and a storm of a thousand blades.',
  },
  dragonknight: {
    id: 'dragonknight', name: 'Dragon Knight', short: 'Dragon', family: 'warrior', tier: 3, parent: 'lancer', level: 50,
    hp: 34, mp: 14, advanceHp: 800, advanceMp: 250, weapons: ['spear'],
    blurb: 'Breathes dragon fire, plunges from the sky, and calls a great dragon to roar.',
  },
  paladin: {
    id: 'paladin', name: 'Paladin', family: 'warrior', tier: 3, parent: 'guardian', level: 50,
    hp: 36, mp: 16, advanceHp: 900, advanceMp: 300, weapons: ['sword', 'axe', 'spear'],
    blurb: 'A holy knight who charges through crowds and brings down the hammer of heaven.',
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
  hunter: {
    id: 'hunter', name: 'Hunter', family: 'archer', tier: 2, parent: 'archer', level: 30,
    hp: 24, mp: 18, advanceHp: 350, advanceMp: 250, weapons: ['bow', 'crossbow'],
    blurb: 'A wild tracker. Snares monsters in place and leaves them bleeding in thorn traps.',
  },
  windwalker: {
    id: 'windwalker', name: 'Windwalker', short: 'Wind', family: 'archer', tier: 3, parent: 'ranger', level: 50,
    hp: 24, mp: 20, advanceHp: 500, advanceMp: 400, weapons: ['bow'],
    blurb: 'Rides the wind. Looses hurricanes of arrows and darkens the sky with an arrow storm.',
  },
  deadeye: {
    id: 'deadeye', name: 'Deadeye', family: 'archer', tier: 3, parent: 'marksman', level: 50,
    hp: 24, mp: 20, advanceHp: 500, advanceMp: 400, weapons: ['crossbow'],
    blurb: 'Never misses. Fires rays that pierce whole lines and a final shot that splits the screen.',
  },
  beastmaster: {
    id: 'beastmaster', name: 'Beastmaster', short: 'Beasts', family: 'archer', tier: 3, parent: 'hunter', level: 50,
    hp: 26, mp: 20, advanceHp: 600, advanceMp: 400, weapons: ['bow', 'crossbow'],
    blurb: 'Fights with a thunder hawk at their side and calls a spirit pack on a wild hunt.',
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
  trickster: {
    id: 'trickster', name: 'Trickster', family: 'thief', tier: 2, parent: 'thief', level: 30,
    hp: 23, mp: 18, advanceHp: 280, advanceMp: 280, weapons: ['dagger', 'claw'],
    blurb: 'Dirty tricks and lucky coins. Smoke bombs leave monsters dizzy.',
  },
  bladedancer: {
    id: 'bladedancer', name: 'Blade Dancer', short: 'Dancer', family: 'thief', tier: 3, parent: 'duelist', level: 50,
    hp: 26, mp: 18, advanceHp: 500, advanceMp: 350, weapons: ['dagger'],
    blurb: 'Dances through crowds in a whirl of petals and a fury of blades.',
  },
  nightstalker: {
    id: 'nightstalker', name: 'Nightstalker', short: 'Night', family: 'thief', tier: 3, parent: 'shadow', level: 50,
    hp: 24, mp: 20, advanceHp: 450, advanceMp: 400, weapons: ['claw'],
    blurb: 'Hunts from the dark with shadow webs and a tempest of shuriken.',
  },
  phantomthief: {
    id: 'phantomthief', name: 'Phantom Thief', short: 'Phantom', family: 'thief', tier: 3, parent: 'trickster', level: 50,
    hp: 25, mp: 20, advanceHp: 480, advanceMp: 380, weapons: ['dagger', 'claw'],
    blurb: 'Steals the show. Bomb tosses, lightning-fast hands, and a jackpot of gold.',
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
export const RETIRED_JOBS = { pyromancer: 'fpwizard', infernosage: 'fparchmage', seraph: 'bishop' };

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
