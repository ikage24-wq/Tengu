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
    // The chest at the end: EXP, gold, Cash, a piece of your job's Lv 15 gear in a rolled color,
    // and Hollow Acorns, all grown by the run's grade (S +50%, A +25%, B +10%) and doubled on Hard.
    // The first clear of each day adds Cash and Acorns.
    reward: { exp: 6000, gold: 2500, cash: 600, gearLevel: 15, items: [{ id: 'hollow_acorn', qty: 5 }, { id: 'elixir', qty: 3 }] },
    // Its own gear set (data/sets.js), from the chest: a piece for your job on Hard or the day's
    // first clear, half the time otherwise.
    set: 'rootwood',
  },
};

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
