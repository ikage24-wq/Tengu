// Gear sets: four matching pieces (hat, top, gloves, cape) for every job, dropped by the queens,
// the Crystal King, and clearing Rootwood Hollow (a piece for your own job each time; certain from a trial, sometimes from a
// rematch). Wearing more of a set adds its bonuses: at 2, 3 and 4 pieces. Each set has its own look
// (render/jobgear/sets.js: its own hat and back piece, its motif on each job's top and gloves) and,
// with all four pieces on, an aura of its theme.

export const SET_SLOTS = ['hat', 'top', 'gloves', 'cape'];

const all = (n) => ({ str: n, dex: n, int: n, luk: n });

export const SETS = {
  // Rootwood Hollow's own set, from clearing it (data/dungeons.js).
  rootwood: {
    name: 'Rootwood', level: 15, color: '#b98e78', accent: '#a6dca2',
    bonus: { 2: { hp: 80 }, 3: { watk: 4, matk: 4 }, 4: { str: 4, dex: 4, int: 4, luk: 4, hp: 150 } },
  },
  // Moonlit Manor's own set: a masquerade outfit, from clearing the rooftop.
  moonlit: {
    name: 'Moonlit Masquerade', level: 20, color: '#7a6ad8', accent: '#ffb3cf',
    bonus: { 2: { mp: 120, eva: 10 }, 3: { watk: 5, matk: 5 }, 4: { str: 5, dex: 5, int: 5, luk: 5, hp: 220 } },
  },
  // The Sunken Aquarium Palace's own set: a shell crown, a pearl collar and a fin cape.
  tidecaller: {
    name: 'Tidecaller', level: 25, color: '#5ac8c8', accent: '#ffb3cf',
    bonus: { 2: { mp: 200, acc: 12 }, 3: { watk: 8, matk: 8 }, 4: { str: 8, dex: 8, int: 8, luk: 8, hp: 320 } },
  },
  // The Clockwork Carnival's own set: a jester's cap with bells, a ruff, a diamond cape.
  harlequin: {
    name: 'Harlequin', level: 30, color: '#e04a5a', accent: '#7fd8ff',
    bonus: { 2: { eva: 20, acc: 15 }, 3: { watk: 11, matk: 11 }, 4: { str: 11, dex: 11, int: 11, luk: 11, critRate: 0.04 } },
  },
  // The Star Observatory's own set: a crescent circlet, a star-chart scarf, a cape of night sky.
  stargazer: {
    name: 'Stargazer', level: 35, color: '#3a3a8a', accent: '#fff3a6',
    bonus: { 2: { mp: 300, acc: 18 }, 3: { watk: 13, matk: 13 }, 4: { str: 13, dex: 13, int: 13, luk: 13, critDamage: 0.12 } },
  },
  // The Candy Volcano's own set: a chef's toque with a cherry, a frilly collar, a cape of cake.
  confectioner: {
    name: 'Confectioner', level: 40, color: '#ff9ad8', accent: '#ffd36b',
    bonus: { 2: { hp: 600, mp: 300 }, 3: { watk: 16, matk: 16 }, 4: { str: 16, dex: 16, int: 16, luk: 16, hp: 900 } },
  },
  // The Sky Whale's own set: aviator goggles worn up on the head, a streaming scarf, a whale-tail cape.
  skyfarer: {
    name: 'Skyfarer', level: 50, color: '#3a74c8', accent: '#ffd36b',
    bonus: { 2: { hp: 800, mp: 400 }, 3: { watk: 22, matk: 22 }, 4: { str: 22, dex: 22, int: 22, luk: 22, critRate: 0.05 } },
  },
  // The Dream Theatre's own set: a laurel circlet with a star, a rose-and-ruff collar, a velvet stage cape.
  leading_role: {
    name: 'Leading Role', level: 45, color: '#9a2040', accent: '#ffd36b',
    bonus: { 2: { hp: 700, critRate: 0.03 }, 3: { watk: 19, matk: 19 }, 4: { str: 19, dex: 19, int: 19, luk: 19, critDamage: 0.15 } },
  },
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
