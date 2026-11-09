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
    id: 'warrior', guard: 0.85, power: 0.87, spread: 0.89, name: 'Warrior', family: 'warrior', tier: 1, parent: 'novice', level: FIRST_JOB_LEVEL,
    hp: 28, mp: 12, advanceHp: 350, advanceMp: 150, weapons: ['sword', 'axe', 'spear'],
    blurb: 'Close-range fighter with big HP. Raises STR.',
  },
  archer: {
    id: 'archer', power: 1.48, spread: 0.98, name: 'Acrobat Archer', family: 'archer', tier: 1, parent: 'novice', level: FIRST_JOB_LEVEL,
    hp: 22, mp: 17, advanceHp: 250, advanceMp: 250, weapons: ['bow', 'crossbow'],
    blurb: 'A show-off who shoots mid-trick with DEX: skips, flips, splits and rolls, a short trick bow loosed from the top of each. Her hits in a row build Combo, and her flips keep it going; full (Showtime), every shot splits into three. Handspring, Springboard, and Grand Somersault: a huge leap raining golden arrows down.',
  },
  // The Tide Mage (docs/design/tide-mage.md): water from the head of her staff, with INT. Whips of
  // water, rolling waves and bubbles that pop; her hits and her heals build Tide, and at High Tide
  // every attack sends a little wave after it and the party round her mends.
  tidemage: {
    id: 'tidemage', power: 2.31, spread: 1.01, name: 'Tide Mage', family: 'mage', tier: 1, parent: 'novice', level: FIRST_JOB_LEVEL,
    hp: 18, mp: 26, advanceHp: 200, advanceMp: 400, weapons: ['staff'],
    blurb: 'A mage of the sea, with INT and a staff: whips of water, rolling waves and bubbles that pop. Her hits and heals build Tide; at High Tide every attack sends a wave after it, and the party near her mends. Bubble Shield, Tide Pool, and Great Wave: a giant wave that sweeps the screen.',
  },
  thief: {
    id: 'thief', power: 0.74, spread: 1.19, name: 'Wind Dancer', family: 'thief', tier: 1, parent: 'novice', level: FIRST_JOB_LEVEL,
    hp: 22, mp: 17, advanceHp: 250, advanceMp: 250, weapons: ['dagger', 'gauntlet'],
    blurb: 'A travelling dancer who fights like it\'s a show, with LUK: twin chakrams up close, or wind from her gloved hands. Her hits build Encore; full, every attack strikes twice.',
  },

  // Warrior branches. Both ask for Brann's trial first (see `trial`).
  paladin: {
    id: 'paladin', guard: 0.8, power: 1.61, spread: 2.7, name: 'Paladin', family: 'warrior', tier: 2, parent: 'warrior', level: 30, trial: 'warrior_trial',
    hp: 32, mp: 14, advanceHp: 600, advanceMp: 200, weapons: ['sword', 'axe', 'spear'],
    blurb: 'The shield of the party. Holy light stuns and taunts, and blessings guard everyone near. The tank of any dungeon group.',
  },
  berserker: {
    id: 'berserker', power: 0.61, spread: 2.6, name: 'Berserker', family: 'warrior', tier: 2, parent: 'warrior', level: 30, trial: 'warrior_trial',
    hp: 30, mp: 12, advanceHp: 450, advanceMp: 150, weapons: ['sword', 'axe', 'spear'],
    blurb: 'Rage made flesh. Every blow builds Rage and makes them bleed; Rampage spends it all in one savage flurry. Deals damage in a group.',
  },

  // Archer branches. Both ask for Kestrel's trial first.
  beastmaster: {
    id: 'beastmaster', power: 2.61, spread: 1.69, name: 'Phantom Trickster', family: 'archer', tier: 2, parent: 'archer', level: 30, trial: 'archer_trial',
    hp: 26, mp: 17, advanceHp: 340, advanceMp: 260, weapons: ['bow'],
    blurb: 'A stage magician with a bow: every shot dressed up as a trick. Her hits build Illusion, and see-through copies of her appear behind her and shoot beside her. Arrows that vanish and strike again, doves, cards, a smoke bomb, and Grand Illusion: a ring of copies all loosing at once.',
  },
  stormcaller: {
    id: 'stormcaller', power: 2.33, spread: 0.82, name: 'Arbalist Engineer', family: 'archer', tier: 2, parent: 'archer', level: 30, trial: 'archer_trial',
    hp: 24, mp: 18, advanceHp: 300, advanceMp: 280, weapons: ['crossbow'],
    blurb: 'An inventor with a crossbow of her own making. Her bolts build steam Pressure; full, every shot fires two. Sticky and cluster bolts, a steam vent, a little turret that fires on its own, and Big Bertha: a giant ballista bolt through everything.',
  },

  // The dancer's paths (the Thief's branches, ids kept). Both ask for Vex's trial first; each keeps
  // to one of her two weapons: the Blade Dancer to chakrams, the Sky Dancer to gloves.
  shinobi: {
    id: 'shinobi', power: 2.47, spread: 2.06, name: 'Blade Dancer', family: 'thief', tier: 2, parent: 'thief', level: 30, trial: 'thief_trial',
    hp: 24, mp: 17, advanceHp: 320, advanceMp: 260, weapons: ['dagger'],
    blurb: 'A ring-throwing showgirl with chakrams. Her rings ricochet from monster to monster and fly home to her hand, building Ricochet; full, two rose-gold rings orbit her and cut whatever comes close. Rebound, Twin Rings, and Golden Carousel: a carousel of rings flung out through everything.',
  },
  kitsune: {
    id: 'kitsune', power: 2.77, spread: 2.24, name: 'Sky Dancer', family: 'thief', tier: 2, parent: 'thief', level: 30, trial: 'thief_trial',
    hp: 23, mp: 18, advanceHp: 300, advanceMp: 280, weapons: ['gauntlet'],
    blurb: 'A dancer who never lands, with gloves of wind. Every blow lifts her higher over the monsters and throws a crescent of wind down at them; her hits in the air build Tailwind, and full, she flies freely and her gusts are twice as big. Updraft, Zephyr, and Sky Waltz: a giant tornado that lifts them all and slams them down.',
  },

  // The Tide Mage's healer path (docs/design/tidecaller.md), the party's healer. Asks for Elowen's
  // trial first, like the Maelstrom.
  tidecaller: {
    id: 'tidecaller', power: 6.54, spread: 2.13, name: 'Tidecaller', family: 'mage', tier: 2, parent: 'tidemage', level: 30, trial: 'mage_trial',
    hp: 24, mp: 34, advanceHp: 300, advanceMp: 520, weapons: ['staff'],
    blurb: 'The Tide Mage the moon answers: the party\'s healer. Pearls, crescents and pillars of moonlight; her hits and heals build Moonsong, and the fuller it runs the stronger she heals. Full (Spring Tide), her heals leave bubbles on everyone and her attacks rain healing on whoever is hurt most. Healing Rain, Spring Surge, Tide\'s Return, and Moon Tide: the tide floods the screen and brings everyone back.',
  },

  // The Tide Mage's damage path (docs/design/maelstrom.md). Asks for Elowen's trial first.
  maelstrom: {
    id: 'maelstrom', power: 4.41, spread: 1.68, name: 'Maelstrom', family: 'mage', tier: 2, parent: 'tidemage', level: 30, trial: 'mage_trial',
    hp: 20, mp: 30, advanceHp: 260, advanceMp: 480, weapons: ['staff'],
    blurb: 'The Tide Mage who called up the deep: crushing pressure, vortices and the glowing things of the abyss. Spears of water, vortex bolts and beams; her hits build Depth, and the deeper it runs the harder she hits. Full (the Abyss), every hit leaves a vortex shredding what it struck. Tidal Lance, Undertow, Hydro Cannon, and Maelstrom: a whirlpool that tears the screen apart.',
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
  // (The whole Mage line, wiped 2026-11-08 to be made again from scratch: its characters play as
  // Novices, keeping their level and items, until the new mage jobs are there to pick.)
  mage: 'novice', sorcerer: 'novice', cleric: 'novice', spiritmage: 'novice', onmyoji: 'novice', shrinemaiden: 'novice',
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
