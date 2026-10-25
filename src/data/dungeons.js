// Dungeons: instanced runs for a group of four (one tank, one healer, two damage dealers) through
// a chain of rooms. Each room is a map with `dungeon` set; its sealed exit opens once the room is
// cleared (every monster down and the room's task done). See world/dungeon.js for the runtime.
//
// Roles come from your job: warriors tank, clerics (and bishops) heal, and everyone else deals
// damage. Novices can't join a dungeon group.

export const DUNGEONS = {
  hollow: {
    id: 'hollow', name: 'Rootwood Hollow', minLevel: 10,
    blurb: 'Deep under an ancient tree, the roots have woken up grumpy. Clear the burrows, beat Mother Capper and Tuskar, and calm Old Gnarlroot at the Heart of the Hollow.',
    gate: 'hollow_gate', warden: 'bramble',
    rooms: ['hollow1', 'hollow2', 'hollow3', 'hollow4', 'hollow5', 'hollow6'],
    // Group finder levels for the players it brings in, by role.
    recruit: { tank: [11, 13], healer: [30, 33], dps: [10, 13] },
    // The chest at the end: EXP, gold, Cash, a piece of your job's Lv 15 gear in a rolled color,
    // and Hollow Acorns.
    reward: { exp: 6000, gold: 2500, cash: 600, gearLevel: 15, items: [{ id: 'hollow_acorn', qty: 5 }, { id: 'elixir', qty: 3 }] },
  },
};

export const ROLES = {
  tank: { label: 'Tank', color: '#5aa8ff' },
  healer: { label: 'Healer', color: '#7ee081' },
  dps: { label: 'DPS', color: '#ff7a6b' },
};

// A group's roles, in finder order.
export const GROUP = ['tank', 'healer', 'dps', 'dps'];

export function roleOf(jobId, family) {
  if (jobId === 'novice' || family === 'beginner') return null;
  if (family === 'warrior') return 'tank';
  if (jobId === 'cleric' || jobId === 'bishop') return 'healer';
  return 'dps';
}

// Provoke (T, tanks in a dungeon): every monster nearby turns on you.
export const PROVOKE = { mp: 6, range: 240, hold: 3 };
// How much more threat a tank's damage makes.
export const TANK_THREAT = 5;
