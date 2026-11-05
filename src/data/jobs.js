// Jobs: a Novice start, four first jobs at level 5 (FIRST_JOB_LEVEL: the player's call, 2026-11-05,
// so the plain Novice stretch is short), and second-job branches at level 30.
// HP/MP growth follows the classic split: warriors tanky, mages MP-heavy, archers and thieves between.
//
// Balance (tools/tune.mjs finds these from the real game, tools/balance.mjs measures it): `power`
// scales everything a job hits for, `spread` its hits on monsters past the one it's on. Damage
// jobs come out level overall, each with its own lean (one target or crowds, up to 8% either
// way); tanks deal 75% of that and healers 65%, on one target and on a crowd alike, so neither
// ever outdoes a damage job: they make up for it in toughness and support. A tank's `guard` is the
// share of every hit it actually takes.

export const FAMILY_STATS = {
  beginner: { primary: 'str', secondary: 'dex' },
  warrior: { primary: 'str', secondary: 'dex' },
  mage: { primary: 'int', secondary: 'luk' },
  archer: { primary: 'dex', secondary: 'str' },
  thief: { primary: 'luk', secondary: 'dex' },
  gm: { primary: 'int', secondary: 'luk' },
};

// Every class follows the same template: a first job at 5, then two paths at 30 after a trial.
// The level a Novice picks their first job at.
export const FIRST_JOB_LEVEL = 5;

export const JOBS = {
  novice: {
    id: 'novice', name: 'Novice', family: 'beginner', tier: 0, parent: null,
    hp: 16, mp: 12, advanceHp: 0, advanceMp: 0,
    weapons: ['none', 'sword', 'axe', 'spear', 'wand', 'staff', 'bow', 'crossbow', 'dagger', 'gauntlet'],
    blurb: 'Everyone starts here. Train up to level 5, then pick a path.',
  },

  warrior: {
    id: 'warrior', guard: 0.85, power: 0.68, spread: 0.53, name: 'Warrior', family: 'warrior', tier: 1, parent: 'novice', level: FIRST_JOB_LEVEL,
    hp: 28, mp: 12, advanceHp: 350, advanceMp: 150, weapons: ['sword', 'axe', 'spear'],
    blurb: 'Close-range fighter with big HP. Raises STR.',
  },
  // The Spirit Mage: a young shrine mage whose spirits strike and heal (remade from scratch; the
  // old Mage is retired). Damage and support at once, with the Spirit Doll at her side.
  spiritmage: {
    id: 'spiritmage', power: 0.52, spread: 0.83, name: 'Star Witch', family: 'mage', tier: 1, parent: 'novice', level: FIRST_JOB_LEVEL,
    hp: 14, mp: 24, advanceHp: 120, advanceMp: 380, weapons: ['wand', 'staff'],
    blurb: 'A bright young witch who casts like she\'s showing off, with INT: quick star bolts from a wand, or heavy comets and meteors from a staff, every spell out in a flash. Her spells and heals light the stars of her Constellation; all seven lit, her bolts split into three. Two star heals let her keep a party going.',
  },
  archer: {
    id: 'archer', power: 1.45, spread: 0.72, name: 'Acrobat Archer', family: 'archer', tier: 1, parent: 'novice', level: FIRST_JOB_LEVEL,
    hp: 22, mp: 17, advanceHp: 250, advanceMp: 250, weapons: ['bow', 'crossbow'],
    blurb: 'A show-off who shoots mid-trick with DEX: skips, flips, splits and rolls, a short trick bow loosed from the top of each. Her hits in a row build Combo, and her flips keep it going; full (Showtime), every shot splits into three. Handspring, Springboard, and Grand Somersault: a huge leap raining golden arrows down.',
  },
  thief: {
    id: 'thief', power: 0.75, spread: 1.45, name: 'Wind Dancer', family: 'thief', tier: 1, parent: 'novice', level: FIRST_JOB_LEVEL,
    hp: 22, mp: 17, advanceHp: 250, advanceMp: 250, weapons: ['dagger', 'gauntlet'],
    blurb: 'A travelling dancer who fights like it\'s a show, with LUK: twin chakrams up close, or wind from her gloved hands. Her hits build Encore; full, every attack strikes twice.',
  },

  // The Star Witch's paths (ids kept). Both ask for Elowen's trial first.
  // The Starlight Idol (her songs, Applause and Grand Concert; docs/design/starlight-idol.md) and the
  // Astronomer (her moons, Orbit and Planetary Alignment; docs/design/astronomer.md).
  shrinemaiden: {
    id: 'shrinemaiden', power: 1.85, spread: 0.86, name: 'Starlight Idol', family: 'mage', tier: 2, parent: 'spiritmage', level: 30, trial: 'spiritmage_trial',
    hp: 18, mp: 26, advanceHp: 260, advanceMp: 480, weapons: ['wand'],
    blurb: 'A pop idol whose wand is her microphone: the heart of any party. Her songs hang in the air where she sings them, mending everyone, cheering them on or lulling the monsters; her heals and hits build Applause, and full, her songs reach half again as far. Curtain Call raises the fallen, and Grand Concert heals everyone in full. The healer of any dungeon group.',
  },
  onmyoji: {
    id: 'onmyoji', power: 1.07, spread: 1.51, name: 'Astronomer', family: 'mage', tier: 2, parent: 'spiritmage', level: 30, trial: 'spiritmage_trial',
    hp: 16, mp: 28, advanceHp: 220, advanceMp: 520, weapons: ['staff'],
    blurb: 'A calm, dreamy stargazer who conducts the planets with an orrery staff. Moons gather round her as she fights, building her Orbit, and fly off at the monsters on their own; with all five, they fly twice as often. Ringed Planet, Gravity Well, Lunar Tide, and Planetary Alignment: five planets in a row firing one beam through everything. Deals damage in a group.',
  },

  // Warrior branches. Both ask for Brann's trial first (see `trial`).
  paladin: {
    id: 'paladin', guard: 0.8, power: 1.35, spread: 0.79, name: 'Paladin', family: 'warrior', tier: 2, parent: 'warrior', level: 30, trial: 'warrior_trial',
    hp: 32, mp: 14, advanceHp: 600, advanceMp: 200, weapons: ['sword', 'axe', 'spear'],
    blurb: 'The shield of the party. Holy light stuns and taunts, and blessings guard everyone near. The tank of any dungeon group.',
  },
  berserker: {
    id: 'berserker', power: 0.46, spread: 0.72, name: 'Berserker', family: 'warrior', tier: 2, parent: 'warrior', level: 30, trial: 'warrior_trial',
    hp: 30, mp: 12, advanceHp: 450, advanceMp: 150, weapons: ['sword', 'axe', 'spear'],
    blurb: 'Rage made flesh. Every blow builds Rage and makes them bleed; Rampage spends it all in one savage flurry. Deals damage in a group.',
  },

  // Archer branches. Both ask for Kestrel's trial first.
  beastmaster: {
    id: 'beastmaster', power: 2.57, spread: 0.92, name: 'Phantom Trickster', family: 'archer', tier: 2, parent: 'archer', level: 30, trial: 'archer_trial',
    hp: 26, mp: 17, advanceHp: 340, advanceMp: 260, weapons: ['bow'],
    blurb: 'A stage magician with a bow: every shot dressed up as a trick. Her hits build Illusion, and see-through copies of her appear behind her and shoot beside her. Arrows that vanish and strike again, doves, cards, a smoke bomb, and Grand Illusion: a ring of copies all loosing at once.',
  },
  stormcaller: {
    id: 'stormcaller', power: 1.57, spread: 0.56, name: 'Arbalist Engineer', family: 'archer', tier: 2, parent: 'archer', level: 30, trial: 'archer_trial',
    hp: 24, mp: 18, advanceHp: 300, advanceMp: 280, weapons: ['crossbow'],
    blurb: 'An inventor with a crossbow of her own making. Her bolts build steam Pressure; full, every shot fires two. Sticky and cluster bolts, a steam vent, a little turret that fires on its own, and Big Bertha: a giant ballista bolt through everything.',
  },

  // The dancer's paths (the Thief's branches, ids kept). Both ask for Vex's trial first; each keeps
  // to one of her two weapons: the Blade Dancer to chakrams, the Sky Dancer to gloves.
  shinobi: {
    id: 'shinobi', power: 1.6, spread: 1.07, name: 'Blade Dancer', family: 'thief', tier: 2, parent: 'thief', level: 30, trial: 'thief_trial',
    hp: 24, mp: 17, advanceHp: 320, advanceMp: 260, weapons: ['dagger'],
    blurb: 'A ring-throwing showgirl with chakrams. Her rings ricochet from monster to monster and fly home to her hand, building Ricochet; full, two rose-gold rings orbit her and cut whatever comes close. Rebound, Twin Rings, and Golden Carousel: a carousel of rings flung out through everything.',
  },
  kitsune: {
    id: 'kitsune', power: 1.41, spread: 1.37, name: 'Sky Dancer', family: 'thief', tier: 2, parent: 'thief', level: 30, trial: 'thief_trial',
    hp: 23, mp: 18, advanceHp: 300, advanceMp: 280, weapons: ['gauntlet'],
    blurb: 'A dancer who never lands, with gloves of wind. Every blow lifts her higher over the monsters and throws a crescent of wind down at them; her hits in the air build Tailwind, and full, she flies freely and her gusts are twice as big. Updraft, Zephyr, and Sky Waltz: a giant tornado that lifts them all and slams them down.',
  },

  // Hidden: only unlocked with the Game Master passphrase, never offered by an instructor.
  gamemaster: {
    id: 'gamemaster', name: 'Game Master', family: 'gm', tier: 9, parent: null, hidden: true,
    hp: 60, mp: 60, advanceHp: 5000, advanceMp: 5000,
    weapons: ['none', 'sword', 'axe', 'spear', 'wand', 'staff', 'bow', 'crossbow', 'dagger', 'gauntlet'],
    blurb: 'Keeper of Tengu Island. Uses anything, goes anywhere.',
  },
};

// Jobs renamed or retired since older saves were made, and what they became (a job not listed here
// that no longer exists starts over as a Novice: core/save.js).
// Older warrior, archer, and thief advanced jobs are retired; those characters return to their first job.
// The archer's Ranger and Sniper were remade as the Beastmaster and the Stormcaller (now the Phantom
// Trickster and the Arbalist Engineer, ids kept). The test
// warrior (Swordsman, test) was tried and taken out.
export const RETIRED_JOBS = {
  testwarrior: 'warrior', blademaster: 'warrior', lancer: 'warrior', guardian: 'warrior', swordsaint: 'warrior', dragonknight: 'warrior', ranger: 'beastmaster', sniper: 'stormcaller', marksman: 'archer', hunter: 'archer', windwalker: 'archer', deadeye: 'archer', assassin: 'shinobi', nightlord: 'kitsune', duelist: 'thief', shadow: 'thief', trickster: 'thief', bladedancer: 'thief', nightstalker: 'thief', phantomthief: 'thief',
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
