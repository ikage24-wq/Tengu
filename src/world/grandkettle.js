// The Grand Kettle's fight (2026-11-26, the Tea Terraces' area boss rebuilt as the Tea Ceremony
// Master; world/nest.js wakes him in the giant teapot hut). Run by world/story.js like the queens'
// moves, but as a set rotation of named casts, the way the dungeon bosses fight (world/bossfight.js):
// each cast shown on the cast bar under his health bar while he performs it, its telegraph laid on
// the floor as it starts, landing as it ends; three phases at his health marks, each adding to the
// last. Every telegraph is drawn whole in his own look (render/grandkettle/looks.js).
//
// He is a stickler for the forty-seven steps of a proper tea ceremony, so his fight is one:
//   intro    Morning Tea: he finishes his cup before he deals with you (his entrance; nothing lands)
//   phase 1  (the first steps)
//            Purify the Utensils  a circle round him: his huge whisk whirls a ring of froth (get out)
//            Pour the Water       a stream of hot water poured along the floor at you (jump it)
//            Kettle Lids          three iron lids spun up high, crashing down round you (step out)
//   phase 2  (two thirds down: "Step TWELVE! You skipped step twelve!")
//            Steam Vents          vents open under you and beside you: columns of steam (step off)
//            Tea Wave             a tide of tea across the whole floor (jump, or a ledge)
//   phase 3  (a third left: "FULL BOIL!")
//            A Thousand Cups      teacups raining down in a line round you, with gaps (find one)
//            Grand Infusion       the whole hollow flooded with tea but his own shadow (get close!)
// Damage is a share (`k`) of his own `damage`.

// A lane from him toward the hero, `w` long.
function lane(q, p, w) {
  const dir = Math.sign(p.x - q.x) || 1;
  return { kind: 'lane', x: dir > 0 ? q.x : q.x - w, w, flow: dir };
}
const HOLD = { gkWhisk: 0.9, gkPour: 0.8, gkLids: 0.8, gkSteam: 1, gkWave: 1.1, gkCups: 0.9, gkInfusion: 1.2 };
const z = (look, o) => ({ look, hold: HOLD[look], ...o });

const STEPS = {
  whisk: { id: 'whisk', name: 'Purify the Utensils', sub: 'Get away from him!', dur: 2.4, after: 1.6, make: (q) => [z('gkWhisk', { kind: 'circle', x: q.x, w: 230, high: true, k: 1 })] },
  pour: { id: 'pour', name: 'Pour the Water', sub: 'Jump the hot water!', dur: 2, after: 1.6, make: (q, p) => [z('gkPour', { ...lane(q, p, 460), low: true, k: 0.9 })] },
  lids: { id: 'lids', name: 'Kettle Lids', sub: 'Out from under the lids!', dur: 2.2, after: 1.6, make: (q, p) => [-96, 0, 96].map((d) => z('gkLids', { kind: 'circle', x: p.x + d, w: 64, k: 0.8, spin: d })) },
  steam: { id: 'steam', name: 'Steam Vents', sub: 'Step off the vents!', dur: 2.2, after: 1.6, make: (q, p) => [-150, 0, 150].map((d) => z('gkSteam', { kind: 'pillar', x: p.x + d, w: 56, k: 0.8 })) },
  wave: { id: 'wave', name: 'Tea Wave', sub: 'Jump, or get up on a ledge!', dur: 2.6, after: 1.8, make: () => [z('gkWave', { kind: 'floor', k: 1 })] },
  cups: {
    id: 'cups', name: 'A Thousand Cups', sub: 'Find a gap between the cups!', dur: 2.6, after: 1.6,
    // (a line of cups round you, every 120 px, the line shifted so where you stand isn't always safe)
    make: (q, p) => {
      const off = Math.random() * 120;
      return [-3, -2, -1, 0, 1, 2, 3].map((i) => z('gkCups', { kind: 'circle', x: p.x + i * 120 + off - 60, w: 66, k: 0.8, spin: i }));
    },
  },
  infusion: {
    id: 'infusion', name: 'Grand Infusion', sub: 'Into his shadow! Get close!', dur: 3, after: 2,
    make: (q) => [z('gkInfusion', { kind: 'lane', x: q.x - 640, w: 570, k: 1.2, side: -1 }), z('gkInfusion', { kind: 'lane', x: q.x + 70, w: 570, k: 1.2, side: 1 })],
  },
};

export const GRAND_KETTLE = {
  color: '#7cae4a', light: '#eaf6d0',
  damage: 240,
  moves: [],
  adds: { at: [], mob: null },
  rotation: {
    intro: { id: 'tea', name: 'Morning Tea', sub: 'He finishes his cup first.', dur: 3.4, after: 1.2, pose: 'entrance' },
    phases: [
      { at: 1, list: [STEPS.whisk, STEPS.pour, STEPS.lids, STEPS.pour] },
      { at: 0.66, line: 'Step TWELVE!', lineSub: 'You skipped step twelve! From the top!', list: [STEPS.steam, STEPS.whisk, STEPS.wave, STEPS.lids, STEPS.pour] },
      { at: 0.33, line: 'FULL BOIL!', lineSub: 'Forty-seven steps, ALL AT ONCE!', list: [STEPS.cups, STEPS.infusion, STEPS.steam, STEPS.pour, STEPS.wave, STEPS.whisk] },
    ],
  },
};
