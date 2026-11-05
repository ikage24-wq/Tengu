// Dungeons: instanced runs for a group of four (one tank, one healer, two damage dealers) through
// a chain of rooms. Each room is a map with `dungeon` set; its sealed exit opens once the room is
// cleared (every monster down and the room's task done). See world/dungeon.js for the runtime.
//
// Roles come from your job: warriors tank (a Berserker deals damage instead), mages (and every job after them) heal, and everyone
// else deals damage. Novices can't join a dungeon group.

export const DUNGEONS = {
  hollow: {
    id: 'hollow', name: 'Rootwood Hollow', minLevel: 10,
    blurb: 'Deep under an ancient tree, the roots have woken up grumpy. Clear the burrows, beat the Myconid Queen and Tuskar, and calm Gnarlroot at the Heart of the Hollow.',
    gate: 'hollow_gate', warden: 'bramble',
    rooms: ['hollow1', 'hollow2', 'hollow3', 'hollow4', 'hollow5', 'hollow6'],
    // Group finder levels for the players it brings in, by role.
    recruit: { tank: [11, 13], healer: [11, 13], dps: [10, 13] },
    // The clear's rewards: EXP, gold, Cash, a piece of your job's Lv 15 gear in a rolled color,
    // and Hollow Acorns, all grown by the run's grade (S +50%, A +25%, B +10%) and doubled on Hard.
    // The first clear of each day adds Cash and Acorns.
    reward: { exp: 6000, gold: 300, cash: 600, gearLevel: 15, items: [{ id: 'hollow_acorn', qty: 5 }, { id: 'elixir', qty: 3 }] },
    // Its own gear set (data/sets.js), from clearing it: a piece for your job on Hard or the day's
    // first clear, half the time otherwise.
    set: 'rootwood',
    token: 'hollow_acorn',
  },
  // The second group dungeon (docs/design/moonlit-manor.md): a haunted manor on the hill above
  // Mossy Woods, spooky-cute, six rooms with a puzzle room and a chase.
  manor: {
    id: 'manor', name: 'Moonlit Manor', minLevel: 15,
    blurb: "Lady Marigold's midnight party never ends, and her guests never go home. Light the garden, solve the gallery, outdance the Armours, outrun the trolley, and set the hostess free.",
    gate: 'manor_gate', warden: 'pumpkins',
    rooms: ['manor1', 'manor2', 'manor3', 'manor4', 'manor5', 'manor6'],
    recruit: { tank: [16, 18], healer: [16, 18], dps: [15, 18] },
    // The rewards for the rooftop: your job's Lv 20 gear, Moonlit Ribbons and potions, grown by grade.
    reward: { exp: 14000, gold: 400, cash: 800, gearLevel: 20, items: [{ id: 'moonlit_ribbon', qty: 5 }, { id: 'elixir', qty: 4 }] },
    set: 'moonlit',
    token: 'moonlit_ribbon',
  },
  // The third (docs/design/aquarium-palace.md): a mermaid queen's sunken palace, a dive from the
  // surface down to her throne.
  aquarium: {
    id: 'aquarium', name: 'Sunken Aquarium Palace', minLevel: 20,
    blurb: "Queen Coralie's palace sank in a storm, and its bubble wards are failing. Dive past the coral gate, solve the pearl vault, and bring the drowned queen back to herself.",
    gate: 'tidepool_pier', warden: 'marina',
    rooms: ['aquarium1', 'aquarium2', 'aquarium3', 'aquarium4', 'aquarium5', 'aquarium6'],
    recruit: { tank: [21, 23], healer: [21, 23], dps: [20, 23] },
    reward: { exp: 26000, gold: 500, cash: 1000, gearLevel: 25, items: [{ id: 'tide_pearl', qty: 5 }, { id: 'elixir', qty: 5 }] },
    set: 'tidecaller',
    token: 'tide_pearl',
  },
  // The fourth (docs/design/clockwork-carnival.md): a wind-up fairground that never stops, a loop
  // round the rides.
  carnival: {
    id: 'carnival', name: 'Clockwork Carnival', minLevel: 25,
    blurb: 'A fairground nobody built appears past the Fox Shrine every night. Its toys never stop, because its queen was wound too tight. Ride the rides, beat the acts, and wind her down.',
    gate: 'carnival_gate', warden: 'tock',
    rooms: ['carnival1', 'carnival2', 'carnival3', 'carnival4', 'carnival5', 'carnival6'],
    recruit: { tank: [26, 28], healer: [26, 28], dps: [25, 28] },
    reward: { exp: 42000, gold: 600, cash: 1200, gearLevel: 30, items: [{ id: 'golden_ticket', qty: 5 }, { id: 'elixir', qty: 6 }] },
    set: 'harlequin',
    token: 'golden_ticket',
  },
  // The fifth (docs/design/star-observatory.md): a tower of stars at the top of Moonlit Ridge, a
  // climb floor by floor to the telescope.
  observatory: {
    id: 'observatory', name: 'Star Observatory', minLevel: 30,
    blurb: 'Astraea has stopped the stars turning so that nothing she loves will ever fall. Climb her tower, light the constellation, part the eclipse, and let the sky move again.',
    gate: 'observatory_steps', warden: 'lumen',
    rooms: ['observatory1', 'observatory2', 'observatory3', 'observatory4', 'observatory5', 'observatory6'],
    recruit: { tank: [31, 33], healer: [31, 33], dps: [30, 33] },
    reward: { exp: 64000, gold: 700, cash: 1400, gearLevel: 35, items: [{ id: 'astral_shard', qty: 5 }, { id: 'elixir', qty: 6 }] },
    set: 'stargazer',
    token: 'astral_shard',
  },
  // The sixth (docs/design/candy-volcano.md): a mountain of sugar behind Serpent Springs, down a
  // candy valley and its mines, then up the cone to the crater.
  volcano: {
    id: 'volcano', name: 'Candy Volcano', minLevel: 35,
    blurb: "Queen Bonbon is stirring the Candy Volcano hotter and hotter to make the biggest dessert in the world. Cross the valley, cook her recipe, beat her smith and her knight, and cool her down before the island is buried in caramel.",
    gate: 'sugar_trail', warden: 'praline',
    rooms: ['volcano1', 'volcano2', 'volcano3', 'volcano4', 'volcano5', 'volcano6'],
    recruit: { tank: [36, 38], healer: [36, 38], dps: [35, 38] },
    reward: { exp: 92000, gold: 800, cash: 1600, gearLevel: 40, items: [{ id: 'sugar_gem', qty: 5 }, { id: 'elixir', qty: 7 }] },
    set: 'confectioner',
    token: 'sugar_gem',
  },
  // The seventh (docs/design/dream-theatre.md): a theatre floating on a cloud off the Sky Garden,
  // played act by act, then backstage, then the final curtain.
  theatre: {
    id: 'theatre', name: 'Dream Theatre', minLevel: 40,
    blurb: "The Phantom Playwright is writing the whole island into his play, and every night the audience forgets a little more of who they are. Take your seats, play every act, survive his muse and his director, and give the story a better ending.",
    gate: 'theatre_row', warden: 'encore',
    rooms: ['theatre1', 'theatre2', 'theatre3', 'theatre4', 'theatre5', 'theatre6'],
    recruit: { tank: [41, 43], healer: [41, 43], dps: [40, 43] },
    reward: { exp: 120000, gold: 900, cash: 1800, gearLevel: 45, items: [{ id: 'encore_rose', qty: 5 }, { id: 'elixir', qty: 8 }] },
    set: 'leading_role',
    token: 'encore_rose',
  },
  // The eighth (docs/design/sky-whale.md): a town on a giant whale swimming through the sky over
  // Starfall Heights, crossed from its tail to its brow.
  skywhale: {
    id: 'skywhale', name: "Sky Whale's Back", minLevel: 45,
    blurb: "The great Sky Whale has fallen into a troubled sleep and is sinking toward the island. Sky pirates are looting its back and the barnacles are building a fortress. Cross from tail to brow, see off the captain and the matriarch, and wake the whale gently.",
    gate: 'cloudcatch_pier', warden: 'nimbus',
    rooms: ['skywhale1', 'skywhale2', 'skywhale3', 'skywhale4', 'skywhale5', 'skywhale6'],
    recruit: { tank: [46, 48], healer: [46, 48], dps: [45, 48] },
    reward: { exp: 150000, gold: 1000, cash: 2000, gearLevel: 50, items: [{ id: 'sky_scale', qty: 5 }, { id: 'elixir', qty: 10 }] },
    set: 'skyfarer',
    token: 'sky_scale',
  },
};

// A dungeon someone of `level` would run now: one of the two newest their level opens (so the
// server's groups and news name every dungeon, each at the levels that run it). Null under the first.
export function dungeonForLevel(level, rng = Math.random) {
  const open = Object.values(DUNGEONS).filter((d) => d.minLevel <= level).sort((a, b) => b.minLevel - a.minLevel).slice(0, 2);
  return open.length ? open[Math.floor(rng() * open.length)] : null;
}

export const ROLES = {
  tank: { label: 'Tank', color: '#5aa8ff' },
  healer: { label: 'Healer', color: '#7ee081' },
  dps: { label: 'DPS', color: '#ff7a6b' },
};

// A group's roles, in finder order. The Spirit Mage (the magic class) takes the healer's seat.
export const GROUP = ['tank', 'healer', 'dps', 'dps'];

export function roleOf(jobId, family) {
  if (jobId === 'novice' || family === 'beginner') return null;
  // (The Berserker and the Onmyoji take the damage seat their families don't.)
  if (jobId === 'berserker' || jobId === 'onmyoji') return 'dps';
  if (family === 'warrior') return 'tank';
  if (family === 'mage') return 'healer';
  return 'dps';
}

// A party tank's Provoke: how far it reaches and how long monsters stick to them.
export const PROVOKE = { range: 280, hold: 5 };
// How much more threat a tank's damage makes.
export const TANK_THREAT = 8;
