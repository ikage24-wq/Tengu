// Gear sets: four matching pieces (hat, top, gloves, cape) for every job, dropped by the queens and
// the Crystal King (a piece for your own job each time; certain from a trial, sometimes from a
// rematch). Wearing more of a set adds its bonuses: at 2, 3 and 4 pieces. The pieces wear the job
// gear's designs in the set's colours.

export const SET_SLOTS = ['hat', 'top', 'gloves', 'cape'];

const all = (n) => ({ str: n, dex: n, int: n, luk: n });

export const SETS = {
  sylvana: {
    name: 'Dryad Bloom', level: 20, color: '#8fdca8', accent: '#ffb3cf',
    bonus: { 2: { hp: 150 }, 3: { watk: 6, matk: 6 }, 4: { ...all(6), hp: 300 } },
  },
  tamamo: {
    name: 'Foxfire', level: 30, color: '#ffa65a', accent: '#7fb8ff',
    bonus: { 2: { acc: 15, eva: 15 }, 3: { watk: 10, matk: 10 }, 4: { ...all(10), critRate: 0.05 } },
  },
  lilith: {
    name: 'Night Rose', level: 35, color: '#e0507e', accent: '#3a2450',
    bonus: { 2: { hp: 400, mp: 200 }, 3: { watk: 14, matk: 14 }, 4: { ...all(14), critDamage: 0.15 } },
  },
  crystalking: {
    name: 'Prism', level: 45, color: '#b48cff', accent: '#a8e8ff',
    bonus: { 2: { wdef: 60, mdef: 60 }, 3: { watk: 18, matk: 18 }, 4: { ...all(18), hp: 800 } },
  },
  selene: {
    name: 'Moonlight', level: 50, color: '#a8c4ff', accent: '#fff3c4',
    bonus: { 2: { speed: 10, jump: 5 }, 3: { watk: 22, matk: 22 }, 4: { ...all(22), critRate: 0.08, critDamage: 0.2 } },
  },
};

export const setPieceId = (set, family, slot) => `set_${set}_${family}_${slot}`;
