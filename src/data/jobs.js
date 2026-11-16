// Jobs: a Novice start, two first jobs at level 5 (FIRST_JOB_LEVEL: the player's call, 2026-11-05,
// so the plain Novice stretch is short), and second-job branches at level 30.
// HP/MP growth follows the classic split: warriors tanky, mages MP-heavy, thieves quick and light.
// (The Archer and Thief lines were wiped 2026-11-16, to be made again: their weapons stay, for
// Novices. The new Thief, the Moon Moth, came the same day.)
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

  // The Thunderguard (the Warrior remade, 2026-11-09; docs/design/thunderguard.md): the job's id
  // stays `warrior` (old saves, the trial, the tank's seat).
  warrior: {
    id: 'warrior', guard: 0.85, power: 1.38, spread: 0.64, name: 'Thunderguard', family: 'warrior', tier: 1, parent: 'novice', level: FIRST_JOB_LEVEL,
    hp: 28, mp: 12, advanceHp: 350, advanceMp: 150, weapons: ['sword', 'axe', 'spear'],
    blurb: 'A warrior who fights inside a storm of his own: sudden explosive strikes with sword, axe or spear, and the tank of the party. His blows and the hits he takes build Charge; full (Overcharge), lightning jumps from every blow and a static shell shocks whatever hits him. Thunder Rush, Storm Cleave, Thunderclap, Static Guard, and Thunderfall: he falls riding a giant bolt. Raises STR.',
  },
  // The Tide Mage (docs/design/tide-mage.md): water from the head of her staff, with INT. Whips of
  // water, rolling waves and bubbles that pop; her hits and her heals build Tide, and at High Tide
  // every attack sends a little wave after it and the party round her mends.
  tidemage: {
    id: 'tidemage', power: 2.31, spread: 1.01, name: 'Tide Mage', family: 'mage', tier: 1, parent: 'novice', level: FIRST_JOB_LEVEL,
    hp: 18, mp: 26, advanceHp: 200, advanceMp: 400, weapons: ['staff'],
    blurb: 'A mage of the sea, with INT and a staff: whips of water, rolling waves and bubbles that pop. Her hits and heals build Tide; at High Tide every attack sends a wave after it, and the party near her mends. Bubble Shield, Tide Pool, and Great Wave: a giant wave that sweeps the screen.',
  },
  // The Moon Moth (docs/design/moon-moth.md): the new Thief, a dagger in each hand and a cloud of
  // moths, with LUK. Quick flicks and spins; her cuts build Moondust, the fuller the more she crits,
  // and at Full Moon every attack sends a moth off to nip another monster.
  moonmoth: {
    id: 'moonmoth', power: 1.86, spread: 1.62, name: 'Moon Moth', family: 'thief', tier: 1, parent: 'novice', level: FIRST_JOB_LEVEL,
    hp: 22, mp: 16, advanceHp: 280, advanceMp: 220, weapons: ['dagger'],
    blurb: 'A night thief with a dagger in each hand and a cloud of moths, with LUK. Her cuts build Moondust, and the fuller it runs the more she crits; at Full Moon every attack sends a moth to nip another monster. Moth Step, Wing Flurry, and Midnight Swarm: moths pour down under a full moon.',
  },
  // Warrior branches. Both ask for Brann's trial first (see `trial`).
  // The Thunderguard's tank path (docs/design/stormwall.md): the storm as a fortress.
  stormwall: {
    id: 'stormwall', guard: 0.8, power: 4.29, spread: 2.22, name: 'Stormwall', family: 'warrior', tier: 2, parent: 'warrior', level: 30, trial: 'warrior_trial',
    hp: 34, mp: 14, advanceHp: 520, advanceMp: 200, weapons: ['sword', 'axe', 'spear'],
    blurb: 'The Thunderguard who became the storm\'s fortress: the tank. Huge, slow and unmovable, he pulls monsters in and holds them while a thunderhead gathers over him. The hits he takes build Thunderhead; the fuller it runs the less he takes, and from half its cloud answers anything that hits him or his party with a bolt. Lightning Cage, Storm Wall, Magnetize, Overcast, and Fortress: a thunderhead over the whole fight.',
  },
  // The Thunderguard's damage path (docs/design/tempest.md): red lightning, speed itself.
  tempest: {
    id: 'tempest', power: 2.45, spread: 2.01, name: 'Tempest', family: 'warrior', tier: 2, parent: 'warrior', level: 30, trial: 'warrior_trial',
    hp: 26, mp: 14, advanceHp: 400, advanceMp: 200, weapons: ['sword', 'axe', 'spear'],
    blurb: 'The Thunderguard who let the storm loose: speed itself, red lightning. Short wind-ups and flash-steps; his hits build Velocity, and the fuller it runs the faster he swings, red afterimages of him striking again behind every blow. Full (Lightspeed), every finisher blinks him through the pack. Flash Step, Thousand Cuts, Crimson Arc, and Red Thunder: he blinks from monster to monster across the screen. Deals damage in a group.',
  },

  // The Moon Moth's damage path (docs/design/eclipse.md): the boss-killer. Asks for Vex's trial first.
  eclipse: {
    id: 'eclipse', power: 3.21, spread: 1.94, name: 'Eclipse', family: 'thief', tier: 2, parent: 'moonmoth', level: 30, trial: 'thief_trial',
    hp: 26, mp: 20, advanceHp: 380, advanceMp: 300, weapons: ['dagger'],
    blurb: 'The Moon Moth who learned to put out the light: the boss-killer, in eclipse violet and corona gold. She marks a monster with a gold eye spot, gets behind it and ends it. Her hits build Umbra, and the fuller it runs the harder her crits land; at Totality every blow crits. Shadow Step, Umbral Edge, Corona, and Total Eclipse: the sky goes dark and every mark goes off.',
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
    blurb: 'Keeper of Windbag Island. Uses anything, goes anywhere.',
  },
};

// Jobs renamed or retired since older saves were made, and what they became (a job not listed here
// that no longer exists starts over as a Novice: core/save.js).
// Older warrior advanced jobs are retired; those characters return to their first job. The test
// warrior (Swordsman, test) was tried and taken out.
export const RETIRED_JOBS = {
  // (The whole Archer and Thief lines, wiped 2026-11-16 to be made again from scratch: their
  // characters play as Novices, keeping their level and items, until the new jobs are there.)
  archer: 'novice', beastmaster: 'novice', stormcaller: 'novice', thief: 'novice', shinobi: 'novice', kitsune: 'novice',
  // (The whole Mage line, wiped 2026-11-08 to be made again from scratch: its characters play as
  // Novices, keeping their level and items, until the new mage jobs are there to pick.)
  mage: 'novice', sorcerer: 'novice', cleric: 'novice', spiritmage: 'novice', onmyoji: 'novice', shrinemaiden: 'novice',
  // (The old Warrior's paths, retired 2026-11-09 when the Thunderguard's own were made: the tank
  // plays on as the Stormwall, the damage path as the Tempest; their skill points come back.)
  paladin: 'stormwall', berserker: 'tempest',
  testwarrior: 'warrior', blademaster: 'warrior', lancer: 'warrior', guardian: 'warrior', swordsaint: 'warrior', dragonknight: 'warrior', ranger: 'novice', sniper: 'novice', marksman: 'novice', hunter: 'novice', windwalker: 'novice', deadeye: 'novice', assassin: 'novice', nightlord: 'novice', duelist: 'novice', shadow: 'novice', trickster: 'novice', bladedancer: 'novice', nightstalker: 'novice', phantomthief: 'novice',
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
