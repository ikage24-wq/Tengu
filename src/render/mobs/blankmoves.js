// The blank bases' move set (2026-11-22, the player: "heavily animate all of them to be game ready
// ... attacks for common weapons, common attacks and punches and other martial arts, guns etc"):
// every move as key poses on a clock, the same for all ten bases (blankrigs.js plays them), so a
// character built on any base can fight, shoot, cast, jump, dodge, fall over and cheer from the start.
//
// A move: { anticT, keys, ...effects }.
//   keys    [[time, pose, ease], ...]: time in seconds from the release (the blow), keys[0] at 0 is
//           the wind-up, held before the release (for `anticT` s when played on its own, through the
//           monster's wind-up in a fight); `ease` the curve into that key: 'out' snaps in and settles
//           (a blow), 'in' starts slow (a fall), 'io' (default) eases both ends. The last key, {},
//           is back to rest.
//   a pose  partial: a channel left out is the rest pose's (idle, walk or run, holding its weapon).
//           Units: angles in degrees (tilt the whole body's lean, shared by the hips and the
//           waist; pelvis and waist each on top; head, shN/elN/shF/elF the arms, wa the weapon's own
//           angle in the world, wing, wisp, toeN/toeF); x, lift, hop in body heights; drop (sitting
//           down) and the feet fxN/fyN/fxF/fyF (ahead, up) in leg lengths; tailW the serpent's tail
//           (1 curled up high).
//   effects windows and moments, seconds from the release (negative: during the wind-up):
//           trail [[from, to, source]] a swing's trail from the weapon, fist, foot, tail or wisp;
//           spark [t] a hit sparkle; flash [t] a muzzle flash; shot [t] an arrow or bullet leaving;
//           throwAt [t] the ball leaving the hand; drawn [from, to] the bow drawn; ball [from, to] the
//           ball in hand; glow [from, to] magic gathering (staff tip, or hands); burst [t] a spell
//           going off; dust [[t, where]] a puff where something lands; lines [from, to] speed lines;
//           gust [t] a gust of wind.
//
// Angles, facing right: the arms hang at 0; the near arm (shN) comes forward and up as it goes
// negative (-90 straight ahead, -180 straight up), the far arm (shF) the same way; an elbow (elN,
// elF) bends the hand forward and up as it goes negative. `wa` is where the weapon points, measured
// like the arms, from straight down (0), forward -90 (= 270), up 180, back 90; a key's `wa` is taken
// as written, so a swing goes the way its numbers run (75 -> 330 swings up and over the top).

const GUARD = { shN: -40, elN: -105, shF: -25, elF: -100, tilt: -2, fxN: 0.15, fxF: -0.12 };

// The rest pose's arms when holding each weapon (idle; the walk swings a little round it).
export const HOLDS = {
  sword: { shN: -18, elN: -46, wa: -120 },
  dagger: { shN: -10, elN: -62, wa: -100 },
  spear: { shN: -14, elN: -56, wa: -166, shF: -36, elF: -64 },
  staff: { shN: -14, elN: -56, wa: -170, shF: -20, elF: -50 },
  axe: { shN: -8, elN: -112, wa: 158 },
  hammer: { shN: -6, elN: -116, wa: 142, shF: -30, elF: -110 },
  bow: { shN: -14, elN: -26, wa: 180 },
  pistol: { shN: -8, elN: -22, wa: -32 },
  rifle: { shN: -10, elN: -82, wa: -135, shF: -40, elF: -70 },
  ball: { shN: -6, elN: -28 },
};

const jabHit = { ...GUARD, shN: -88, elN: -4, tilt: 6, x: 0.035, head: 3, fxN: 0.22 };
const straightAntic = { waist: -5, shN: 42, elN: -100, shF: -30, elF: -95, tilt: -8, x: -0.03, head: -3, fxN: 0.12, fxF: -0.16 };
const straightHit = { waist: 7, pelvis: -2, shN: -93, elN: -2, shF: 10, elF: -60, tilt: 12, x: 0.07, head: 5, fxN: 0.34, fxF: -0.12, lift: -0.015 };
const kickChamber = { fyN: 0.55, fxN: 0.18, tilt: -8, shN: -30, elN: -95, shF: 25, elF: -70, head: -2 };
const kickHit = { pelvis: -8, waist: 7, fyN: 0.62, fxN: 0.98, toeN: -30, tilt: -15, shN: -10, elN: -80, shF: 40, elF: -50, head: 4, x: 0.02 };

export const MOVES = {
  // ---------- Fists and feet ----------
  jab: {
    anticT: 0.14,
    keys: [[0, { ...GUARD, x: -0.01 }], [0.06, jabHit, 'out'], [0.14, jabHit], [0.3, GUARD], [0.5, {}]],
    trail: [[0, 0.1, 'fist']],
    spark: [0.06],
  },
  straight: {
    anticT: 0.22,
    keys: [[0, straightAntic], [0.07, straightHit, 'out'], [0.18, straightHit], [0.42, GUARD], [0.65, {}]],
    trail: [[0, 0.11, 'fist']],
    spark: [0.07],
  },
  uppercut: {
    anticT: 0.22,
    keys: [
      [0, { waist: 6, shN: 28, elN: -75, shF: -20, elF: -100, tilt: 7, lift: -0.05, x: -0.01, head: -2, fxN: 0.14, fxF: -0.14 }],
      [0.09, { waist: -8, shN: -122, elN: -28, shF: -10, elF: -90, tilt: -12, lift: 0.03, x: 0.04, head: -12, fxN: 0.2, fxF: -0.12, toeF: 20 }, 'out'],
      [0.2, { waist: -8, shN: -124, elN: -30, shF: -10, elF: -90, tilt: -11, lift: 0.03, x: 0.04, head: -11, fxN: 0.2, fxF: -0.12, toeF: 20 }],
      [0.45, GUARD],
      [0.68, {}],
    ],
    trail: [[0, 0.13, 'fist']],
    spark: [0.08],
  },
  palm: {
    anticT: 0.3,
    keys: [
      [0, { shN: 30, elN: -115, shF: 25, elF: -110, tilt: -4, x: -0.03, lift: -0.06, fxN: 0.32, fxF: -0.28 }],
      [0.07, { shN: -90, elN: 0, shF: -72, elF: -8, tilt: 8, x: 0.05, lift: -0.07, head: 3, fxN: 0.34, fxF: -0.28 }, 'out'],
      [0.24, { shN: -90, elN: 0, shF: -72, elF: -8, tilt: 8, x: 0.05, lift: -0.07, head: 3, fxN: 0.34, fxF: -0.28 }],
      [0.5, { lift: -0.03 }],
      [0.75, {}],
    ],
    trail: [[0, 0.1, 'fist']],
    spark: [0.07],
    burst: [0.07, 'fist'],
  },
  frontKick: {
    legs: true,
    anticT: 0.2,
    keys: [[0, kickChamber], [0.07, kickHit, 'out'], [0.17, kickHit], [0.32, kickChamber], [0.55, {}]],
    trail: [[0, 0.11, 'foot']],
    spark: [0.07],
  },
  roundhouse: {
    legs: true,
    anticT: 0.22,
    keys: [
      [0, { fyN: 0.75, fxN: 0.05, tilt: -12, shN: 25, elN: -85, shF: -30, elF: -90, head: -3, toeN: 10 }],
      [0.08, { pelvis: -12, waist: 10, fyN: 1.25, fxN: 1.02, toeN: 25, tilt: -26, head: 9, shN: 45, elN: -40, shF: 60, elF: -30, x: -0.02 }, 'out'],
      [0.2, { pelvis: -12, waist: 10, fyN: 1.25, fxN: 1.02, toeN: 25, tilt: -26, head: 9, shN: 45, elN: -40, shF: 60, elF: -30, x: -0.02 }],
      [0.38, { fyN: 0.6, fxN: 0.1, tilt: -8, shN: 20, elN: -80, shF: -20, elF: -80 }],
      [0.62, {}],
    ],
    trail: [[0, 0.13, 'foot']],
    spark: [0.08],
  },
  sweep: {
    legs: true,
    anticT: 0.2,
    keys: [
      [0, { lift: -0.1, tilt: 10, fxN: -0.3, fxF: 0.1, shN: -40, elN: -60, shF: -20, elF: -60, head: -2 }],
      [0.1, { waist: 10, pelvis: 4, lift: -0.14, tilt: 14, fxN: 1.05, fyN: 0.06, fxF: -0.05, toeN: 20, shN: 30, elN: -30, shF: 40, elF: -20, head: 4 }, 'out'],
      [0.24, { waist: 10, pelvis: 4, lift: -0.14, tilt: 14, fxN: 1.05, fyN: 0.06, fxF: -0.05, toeN: 20, shN: 30, elN: -30, shF: 40, elF: -20, head: 4 }],
      [0.5, { lift: -0.04 }],
      [0.72, {}],
    ],
    trail: [[0, 0.14, 'foot']],
    spark: [0.1],
    dust: [[0.1, 'foot']],
  },
  flyingKick: {
    legs: true,
    anticT: 0.22,
    keys: [
      [0, { lift: -0.08, tilt: 8, shN: 30, elN: -60, shF: 30, elF: -60, head: -3 }],
      [0.15, { hop: 0.3, fyN: 0.6, fxN: 0.25, fyF: 0.4, fxF: -0.1, toeF: 30, tilt: -6, shN: -40, elN: -95, shF: -20, elF: -90, x: 0.04 }, 'out'],
      [0.24, { pelvis: -10, waist: 8, hop: 0.34, fyN: 0.72, fxN: 1.0, toeN: -20, fyF: 0.5, fxF: -0.25, toeF: 30, tilt: -16, head: 5, shN: 30, elN: -60, shF: 50, elF: -40, x: 0.1 }, 'out'],
      [0.34, { pelvis: -10, waist: 8, hop: 0.33, fyN: 0.72, fxN: 1.0, toeN: -20, fyF: 0.5, fxF: -0.25, toeF: 30, tilt: -16, head: 5, shN: 30, elN: -60, shF: 50, elF: -40, x: 0.11 }],
      [0.48, { hop: 0.1, fyN: 0.3, fxN: 0.35, fyF: 0.2, fxF: -0.05, tilt: -4, shN: -20, elN: -60, shF: 20, elF: -40, x: 0.12 }, 'in'],
      [0.56, { lift: -0.08, x: 0.12, fxN: 0.12, fxF: -0.08, tilt: 6, shN: 10, elN: -40, shF: -10, elF: -40 }, 'in'],
      [0.85, {}],
    ],
    trail: [[0.17, 0.32, 'foot']],
    spark: [0.24],
    dust: [[0.56, 'feet']],
  },
  combo: {
    legs: true,
    anticT: 0.12,
    keys: [
      [0, GUARD],
      [0.06, jabHit, 'out'],
      [0.15, GUARD],
      [0.23, straightHit, 'out'],
      [0.33, straightHit],
      [0.43, kickChamber],
      [0.51, kickHit, 'out'],
      [0.62, kickHit],
      [0.78, kickChamber],
      [1.02, {}],
    ],
    trail: [[0, 0.1, 'fist'], [0.16, 0.31, 'fist'], [0.43, 0.59, 'foot']],
    spark: [0.06, 0.23, 0.51],
  },
  magic: {
    anticT: 0.4,
    keys: [
      [0, { shN: 18, elN: -122, shF: -32, elF: -112, tilt: -5, head: -3, fxN: 0.1, fxF: -0.12 }],
      [0.08, { shN: -92, elN: 0, shF: -82, elF: -4, tilt: 8, x: 0.04, head: 3, fxN: 0.18, fxF: -0.12 }, 'out'],
      [0.34, { shN: -92, elN: 0, shF: -82, elF: -4, tilt: 8, x: 0.04, head: 3, fxN: 0.18, fxF: -0.12 }],
      [0.7, {}],
    ],
    glow: [-0.3, 0.08, 'hand'],
    burst: [0.08, 'hand'],
  },

  // ---------- Weapons ----------
  slash: {
    weapon: 'sword',
    anticT: 0.28,
    keys: [
      [0, { waist: -6, shN: -195, elN: -45, wa: 75, shF: 20, elF: -40, tilt: -8, head: -4, x: -0.02, fxN: 0.15, fxF: -0.15 }],
      [0.08, { waist: 9, shN: -64, elN: -8, wa: 305, shF: -20, elF: -30, tilt: 14, head: 6, x: 0.06, fxN: 0.3, fxF: -0.12, lift: -0.02 }, 'out'],
      [0.2, { waist: 9, shN: -64, elN: -8, wa: 310, shF: -20, elF: -30, tilt: 14, head: 6, x: 0.06, fxN: 0.3, fxF: -0.12, lift: -0.02 }],
      [0.5, {}],
    ],
    trail: [[0, 0.13, 'weapon']],
    spark: [0.07],
  },
  rising: {
    weapon: 'sword',
    anticT: 0.25,
    keys: [
      [0, { shN: -34, elN: -10, wa: -50, shF: 20, elF: -40, tilt: 10, lift: -0.06, x: -0.01, head: 3, fxN: 0.22, fxF: -0.15 }],
      [0.09, { shN: -172, elN: -22, wa: -195, shF: 20, elF: -40, tilt: -10, lift: 0.02, head: -7, x: 0.03, fxN: 0.22 }, 'out'],
      [0.2, { shN: -172, elN: -22, wa: -195, shF: 20, elF: -40, tilt: -10, lift: 0.02, head: -7, x: 0.03, fxN: 0.22 }],
      [0.5, {}],
    ],
    trail: [[0, 0.14, 'weapon']],
    spark: [0.08],
  },
  stab: {
    weapon: 'sword',
    anticT: 0.22,
    keys: [
      [0, { shN: 32, elN: -100, wa: -88, shF: -20, elF: -60, tilt: -6, x: -0.03, fxN: 0.1, fxF: -0.2 }],
      [0.07, { shN: -88, elN: -2, wa: -90, shF: 15, elF: -30, tilt: 10, x: 0.09, fxN: 0.42, fxF: -0.15, lift: -0.035 }, 'out'],
      [0.18, { shN: -88, elN: -2, wa: -90, shF: 15, elF: -30, tilt: 10, x: 0.09, fxN: 0.42, fxF: -0.15, lift: -0.035 }],
      [0.45, {}],
    ],
    trail: [[0, 0.1, 'weapon']],
    spark: [0.07],
  },
  daggerStab: {
    weapon: 'dagger',
    anticT: 0.16,
    keys: [
      [0, { shN: 22, elN: -110, wa: -92, shF: -25, elF: -95, tilt: -4, fxN: 0.12, fxF: -0.12 }],
      [0.05, { shN: -80, elN: -10, wa: -84, shF: -25, elF: -95, tilt: 8, x: 0.05, fxN: 0.2, fxF: -0.12 }, 'out'],
      [0.12, { shN: 8, elN: -100, wa: -90, shF: -25, elF: -95, tilt: 2, x: 0.02, fxN: 0.16, fxF: -0.12 }],
      [0.17, { shN: -96, elN: -4, wa: -96, shF: 10, elF: -60, tilt: 10, x: 0.07, fxN: 0.26, fxF: -0.12 }, 'out'],
      [0.28, { shN: -96, elN: -4, wa: -96, shF: 10, elF: -60, tilt: 10, x: 0.07, fxN: 0.26, fxF: -0.12 }],
      [0.5, {}],
    ],
    trail: [[0, 0.08, 'weapon'], [0.12, 0.22, 'weapon']],
    spark: [0.05, 0.17],
  },
  daggerSlash: {
    weapon: 'dagger',
    anticT: 0.18,
    keys: [
      [0, { shN: -150, elN: -70, wa: 120, tilt: -7, x: -0.02, head: -3, fxN: 0.12, fxF: -0.14, shF: 20, elF: -60 }],
      [0.07, { shN: -72, elN: -10, wa: 282, tilt: 10, x: 0.05, fxN: 0.26, head: 4, shF: -10, elF: -40 }, 'out'],
      [0.16, { shN: -72, elN: -10, wa: 285, tilt: 10, x: 0.05, fxN: 0.26, head: 4, shF: -10, elF: -40 }],
      [0.42, {}],
    ],
    trail: [[0, 0.11, 'weapon']],
    spark: [0.06],
  },
  spearThrust: {
    weapon: 'spear',
    anticT: 0.26,
    keys: [
      [0, { shN: 12, elN: -96, wa: -90, shF: -55, elF: -55, tilt: -7, x: -0.05, fxN: 0.15, fxF: -0.26, lift: -0.02 }],
      [0.08, { waist: 5, shN: -86, elN: -3, wa: -90, shF: -85, elF: -10, tilt: 9, x: 0.12, fxN: 0.46, fxF: -0.2, lift: -0.06 }, 'out'],
      [0.22, { waist: 5, shN: -86, elN: -3, wa: -90, shF: -85, elF: -10, tilt: 9, x: 0.12, fxN: 0.46, fxF: -0.2, lift: -0.06 }],
      [0.55, {}],
    ],
    trail: [[0, 0.12, 'weapon']],
    spark: [0.08],
  },
  spearSweep: {
    weapon: 'spear',
    anticT: 0.26,
    keys: [
      [0, { shN: 42, elN: -38, wa: 70, shF: -10, elF: -40, tilt: 6, lift: -0.06, x: -0.03, fxN: 0.2, fxF: -0.2 }],
      [0.1, { shN: -72, elN: -8, wa: -78, shF: -40, elF: -30, tilt: 11, lift: -0.07, x: 0.05, fxN: 0.32, fxF: -0.2 }, 'out'],
      [0.22, { shN: -72, elN: -8, wa: -80, shF: -40, elF: -30, tilt: 11, lift: -0.07, x: 0.05, fxN: 0.32, fxF: -0.2 }],
      [0.55, {}],
    ],
    trail: [[0, 0.14, 'weapon']],
    spark: [0.09],
  },
  axeChop: {
    weapon: 'axe',
    anticT: 0.32,
    keys: [
      [0, { waist: -8, shN: -200, elN: -48, wa: 42, shF: -160, elF: -30, tilt: -12, lift: 0.02, head: -5, x: -0.03, fxN: 0.15, fxF: -0.15 }],
      [0.09, { waist: 12, shN: -60, elN: -10, wa: 302, shF: -60, elF: -20, tilt: 18, lift: -0.05, head: 7, x: 0.06, fxN: 0.28, fxF: -0.12 }, 'out'],
      [0.24, { waist: 12, shN: -60, elN: -10, wa: 304, shF: -60, elF: -20, tilt: 18, lift: -0.05, head: 7, x: 0.06, fxN: 0.28, fxF: -0.12 }],
      [0.62, {}],
    ],
    trail: [[0, 0.14, 'weapon']],
    spark: [0.09],
  },
  hammerSmash: {
    weapon: 'hammer',
    anticT: 0.42,
    keys: [
      [0, { waist: -10, shN: -206, elN: -28, wa: 18, shF: -170, elF: -20, tilt: -14, lift: 0.03, head: -8, x: -0.03, fxN: 0.16, fxF: -0.16 }],
      [0.1, { waist: 18, pelvis: -2, shN: -46, elN: -6, wa: 318, shF: -50, elF: -10, tilt: 24, lift: -0.09, x: 0.07, head: 10, fxN: 0.3, fxF: -0.14 }, 'out'],
      [0.34, { waist: 18, pelvis: -2, shN: -46, elN: -6, wa: 319, shF: -50, elF: -10, tilt: 24, lift: -0.09, x: 0.07, head: 10, fxN: 0.3, fxF: -0.14 }],
      [0.8, {}],
    ],
    trail: [[0, 0.15, 'weapon']],
    spark: [0.1],
    dust: [[0.1, 'tip']],
  },
  staffCast: {
    weapon: 'staff',
    anticT: 0.4,
    keys: [
      [0, { shN: -162, elN: -20, wa: 176, shF: 150, elF: 20, tilt: -6, head: -7 }],
      [0.08, { shN: -95, elN: -4, wa: 265, shF: 40, elF: -20, tilt: 8, x: 0.03, head: 3, fxN: 0.12, fxF: -0.1 }, 'out'],
      [0.36, { shN: -95, elN: -4, wa: 265, shF: 40, elF: -20, tilt: 8, x: 0.03, head: 3, fxN: 0.12, fxF: -0.1 }],
      [0.75, {}],
    ],
    glow: [-0.3, 0.3, 'tip'],
    burst: [0.08, 'tip'],
  },
  staffBonk: {
    weapon: 'staff',
    anticT: 0.26,
    keys: [
      [0, { shN: -198, elN: -40, wa: 60, tilt: -10, head: -4, x: -0.02, shF: -150, elF: -30, fxN: 0.12, fxF: -0.14 }],
      [0.08, { shN: -70, elN: -8, wa: 300, tilt: 14, head: 6, x: 0.05, fxN: 0.25, shF: -60, elF: -20 }, 'out'],
      [0.2, { shN: -70, elN: -8, wa: 302, tilt: 14, head: 6, x: 0.05, fxN: 0.25, shF: -60, elF: -20 }],
      [0.5, {}],
    ],
    trail: [[0, 0.13, 'weapon']],
    spark: [0.08],
  },
  bowShot: {
    weapon: 'bow',
    anticT: 0.45,
    keys: [
      [0, { waist: -3, shN: -90, elN: 0, wa: 180, shF: -78, elF: -100, tilt: -4, head: 2, fxN: 0.2, fxF: -0.22 }],
      [0.05, { shN: -86, elN: -2, wa: 180, shF: 25, elF: -40, tilt: -7, fxN: 0.2, fxF: -0.22, x: -0.015 }, 'out'],
      [0.4, { shN: -86, elN: -2, wa: 180, shF: 25, elF: -40, tilt: -6, fxN: 0.2, fxF: -0.22, x: -0.01 }],
      [0.8, {}],
    ],
    drawn: [-0.3, 0],
    shot: [0],
  },
  pistolShot: {
    weapon: 'pistol',
    anticT: 0.22,
    keys: [
      [0, { shN: -90, elN: -2, wa: -90, tilt: -2, head: 2, fxN: 0.1, fxF: -0.1, shF: 10, elF: -30 }],
      [0.035, { shN: -104, elN: -12, wa: -114, tilt: -5, x: -0.015, fxN: 0.1, fxF: -0.1, shF: 10, elF: -30 }, 'out'],
      [0.14, { shN: -90, elN: -2, wa: -90, tilt: -2, head: 2, fxN: 0.1, fxF: -0.1, shF: 10, elF: -30 }],
      [0.2, { shN: -90, elN: -2, wa: -90, tilt: -2, head: 2, fxN: 0.1, fxF: -0.1, shF: 10, elF: -30 }],
      [0.235, { shN: -104, elN: -12, wa: -114, tilt: -5, x: -0.015, fxN: 0.1, fxF: -0.1, shF: 10, elF: -30 }, 'out'],
      [0.36, { shN: -90, elN: -2, wa: -90, tilt: -2, head: 2, fxN: 0.1, fxF: -0.1, shF: 10, elF: -30 }],
      [0.7, {}],
    ],
    flash: [0, 0.2],
    shot: [0, 0.2],
  },
  rifleShot: {
    weapon: 'rifle',
    anticT: 0.3,
    keys: [
      [0, { shN: -42, elN: -58, wa: -90, shF: -82, elF: -18, tilt: 2, head: 4, fxN: 0.15, fxF: -0.22, lift: -0.02 }],
      [0.04, { shN: -50, elN: -60, wa: -104, shF: -84, elF: -22, tilt: -6, x: -0.03, fxN: 0.15, fxF: -0.22, lift: -0.01 }, 'out'],
      [0.22, { shN: -42, elN: -58, wa: -90, shF: -82, elF: -18, tilt: 2, head: 4, fxN: 0.15, fxF: -0.22, lift: -0.02 }],
      [0.42, { shN: -42, elN: -58, wa: -90, shF: -82, elF: -18, tilt: 2, head: 4, fxN: 0.15, fxF: -0.22, lift: -0.02 }],
      [0.75, {}],
    ],
    flash: [0],
    shot: [0],
  },
  throw: {
    weapon: 'ball',
    anticT: 0.3,
    keys: [
      [0, { shN: -205, elN: -75, shF: -80, elF: -10, tilt: -10, x: -0.03, head: -3, fxN: 0.15, fxF: -0.22 }],
      [0.08, { shN: -58, elN: -12, shF: 30, elF: -30, tilt: 14, x: 0.06, head: 5, fxN: 0.36, fxF: -0.15, lift: -0.02 }, 'out'],
      [0.24, { shN: -58, elN: -12, shF: 30, elF: -30, tilt: 14, x: 0.06, head: 5, fxN: 0.36, fxF: -0.15, lift: -0.02 }],
      [0.6, {}],
    ],
    ball: [-9, 0.05],
    throwAt: [0.05],
    trail: [[0, 0.1, 'fist']],
  },

  // ---------- Bodies of their own ----------
  wingBuffet: {
    anticT: 0.3,
    keys: [
      [0, { wing: 34, tilt: -10, shN: -40, elN: -60, shF: 40, elF: -60, hop: 0.02, head: -4 }],
      [0.1, { wing: -22, tilt: 10, x: 0.03, hop: 0.05, shN: 20, elN: -20, shF: -20, elF: -20, head: 4 }, 'out'],
      [0.3, { wing: -18, tilt: 9, x: 0.03, hop: 0.04, shN: 20, elN: -20, shF: -20, elF: -20, head: 4 }],
      [0.65, {}],
    ],
    gust: [0.08],
  },
  rear: {
    // A centaur's: settling back, then rearing up on its hind legs, the forelegs pawing the air,
    // and stamping down with both, dust bursting under them.
    anticT: 0.25,
    keys: [
      [0, { pitch: -6, tilt: 5, waist: 4, shN: 20, elN: -60, shF: 20, elF: -60, head: 3 }],
      [0.16, { pitch: 26, paw: 1, tilt: -10, waist: -6, shN: -125, elN: -30, shF: 125, elF: 30, head: -8 }, 'out'],
      [0.34, { pitch: 28, paw: 1, tilt: -12, waist: -6, shN: -130, elN: -26, shF: 128, elF: 26, head: -9 }],
      [0.46, { pitch: -4, paw: 0, tilt: 9, waist: 8, shN: -40, elN: -40, shF: 40, elF: -40, head: 5 }, 'in'],
      [0.8, {}],
    ],
    spark: [0.46],
    sparkAt: 'fist',
    dust: [[0.46, 'front']],
  },
  tailWhip: {
    anticT: 0.3,
    keys: [
      [0, { tailW: 0.85, tilt: -8, x: -0.03, shN: -30, elN: -70, shF: 30, elF: -70, head: -3 }],
      [0.1, { tailW: -0.07, tilt: 10, x: 0.04, shN: 10, elN: -30, shF: -10, elF: -30, head: 4 }, 'out'],
      [0.25, { tailW: -0.05, tilt: 9, x: 0.04, shN: 10, elN: -30, shF: -10, elF: -30, head: 4 }],
      [0.6, {}],
    ],
    trail: [[0, 0.14, 'tail']],
    spark: [0.1],
    dust: [[0.1, 'tail']],
  },
  wispLash: {
    anticT: 0.25,
    keys: [
      [0, { wisp: -40, tilt: -10, x: -0.03, shN: -40, elN: -80, shF: 40, elF: -80 }],
      [0.1, { wisp: 55, tilt: 16, x: 0.07, shN: 20, elN: -20, shF: -20, elF: -20, head: 5, lift: 0.02 }, 'out'],
      [0.25, { wisp: 50, tilt: 14, x: 0.07, shN: 20, elN: -20, shF: -20, elF: -20, head: 5, lift: 0.02 }],
      [0.6, {}],
    ],
    trail: [[0, 0.14, 'wisp']],
    spark: [0.1],
  },

  // ---------- Getting about, and reactions ----------
  jump: {
    act: true,
    anticT: 0.16,
    keys: [
      [0, { lift: -0.09, tilt: 6, shN: 25, elN: -10, shF: 25, elF: 10, head: -2 }],
      [0.16, { waist: -5, hop: 0.42, fyN: 0.32, fyF: 0.42, fxN: 0.1, fxF: -0.04, toeN: 30, toeF: 30, tilt: -4, shN: -134, elN: -20, shF: 134, elF: 20, head: -4 }, 'out'],
      [0.3, { waist: -5, hop: 0.46, fyN: 0.4, fyF: 0.5, fxN: 0.1, fxF: -0.04, toeN: 30, toeF: 30, tilt: -4, shN: -134, elN: -20, shF: 134, elF: 20, head: -4 }, 'out'],
      [0.5, { hop: 0.02, fyN: 0.05, fyF: 0.05, shN: -40, shF: 40, tilt: 0 }, 'in'],
      [0.56, { waist: 8, lift: -0.08, tilt: 5, shN: 15, elN: -20, shF: -15, elF: 20, head: 2 }, 'out'],
      [0.85, {}],
    ],
    dust: [[0, 'feet'], [0.54, 'feet']],
  },
  dash: {
    act: true,
    anticT: 0.06,
    keys: [
      [0, { tilt: 6, lift: -0.04, x: -0.01 }],
      [0.08, { waist: 6, tilt: 22, x: 0.14, lift: -0.04, shN: 42, elN: -20, shF: 42, elF: -20, head: -6, fxN: 0.3, fxF: -0.45, toeF: 30 }, 'out'],
      [0.3, { waist: 6, tilt: 20, x: 0.18, lift: -0.04, shN: 42, elN: -20, shF: 42, elF: -20, head: -6, fxN: 0.3, fxF: -0.45, toeF: 30 }],
      [0.6, {}],
    ],
    lines: [0, 0.32],
    dust: [[0.02, 'feet']],
  },
  dodge: {
    act: true,
    anticT: 0.06,
    keys: [
      [0, { lift: -0.05, tilt: -4 }],
      [0.12, { waist: -8, hop: 0.12, x: -0.14, tilt: -14, head: -8, shN: -60, elN: -80, shF: 40, elF: -60, fyN: 0.2, fyF: 0.12, fxN: 0.1 }, 'out'],
      [0.28, { x: -0.17, lift: -0.06, tilt: -6, shN: -30, elN: -80, shF: 20, elF: -60, head: -3 }, 'in'],
      [0.62, {}],
    ],
    dust: [[0.28, 'feet']],
  },
  block: {
    act: true,
    anticT: 0.08,
    keys: [
      [0, { shN: -70, elN: -112, shF: -45, elF: -118, tilt: -6, head: -6, lift: -0.035, fxN: 0.15, fxF: -0.15, wa: 180 }],
      [0.25, { shN: -66, elN: -112, shF: -45, elF: -118, tilt: -9, head: -8, lift: -0.04, x: -0.02, fxN: 0.15, fxF: -0.15, wa: 182 }, 'out'],
      [0.7, { shN: -70, elN: -112, shF: -45, elF: -118, tilt: -6, head: -6, lift: -0.035, fxN: 0.15, fxF: -0.15, wa: 180 }],
      [0.95, {}],
    ],
    spark: [0.22],
    sparkAt: 'fist',
  },
  hurt: {
    act: true,
    anticT: 0,
    keys: [[0, {}], [0.05, { waist: -8, tilt: -16, head: -16, x: -0.03, shN: -45, elN: -70, shF: 45, elF: 60, lift: -0.02 }, 'out'], [0.18, { waist: -7, tilt: -14, head: -14, x: -0.03, shN: -40, elN: -65, shF: 40, elF: 55, lift: -0.02 }], [0.5, {}]],
  },
  knockdown: {
    act: true,
    anticT: 0,
    keys: [
      [0, {}],
      [0.1, { tilt: -18, head: -14, x: -0.05, shN: -60, elN: -40, shF: 60, elF: 40 }, 'out'],
      [0.36, { pelvis: -14, waist: 10, drop: 0.92, fxN: 0.75, fxF: 0.6, fyN: 0.1, fyF: 0.06, toeN: -30, toeF: -30, tilt: -22, x: -0.08, shN: 32, elN: -10, shF: 25, elF: 10, head: 8 }, 'in'],
      [0.44, { pelvis: -14, waist: 10, drop: 0.86, fxN: 0.75, fxF: 0.6, fyN: 0.12, fyF: 0.08, toeN: -30, toeF: -30, tilt: -20, x: -0.08, shN: 30, elN: -10, shF: 24, elF: 10, head: 12 }, 'out'],
      [0.52, { pelvis: -14, waist: 10, drop: 0.92, fxN: 0.75, fxF: 0.6, fyN: 0.1, fyF: 0.06, toeN: -30, toeF: -30, tilt: -22, x: -0.08, shN: 32, elN: -10, shF: 25, elF: 10, head: 6 }, 'in'],
      [1.0, { pelvis: -14, waist: 10, drop: 0.92, fxN: 0.75, fxF: 0.6, fyN: 0.1, fyF: 0.06, toeN: -30, toeF: -30, tilt: -20, x: -0.08, shN: 32, elN: -10, shF: 25, elF: 10, head: -6 }],
      [1.28, { drop: 0.4, fxN: 0.3, fxF: -0.1, tilt: 14, shN: -20, elN: -30, shF: 20, elF: -30, head: 2, x: -0.04 }],
      [1.58, {}],
    ],
    dust: [[0.36, 'hips']],
  },
  cheer: {
    act: true,
    anticT: 0.06,
    keys: [
      [0, { lift: -0.05 }],
      [0.12, { waist: -6, hop: 0.14, shN: -128, elN: -16, shF: 128, elF: 16, head: -6, fyN: 0.12, fyF: 0.12, toeN: 25, toeF: 25 }, 'out'],
      [0.26, { lift: -0.04, shN: -122, elN: -34, shF: 122, elF: 34 }, 'in'],
      [0.4, { waist: -6, hop: 0.14, shN: -128, elN: -16, shF: 128, elF: 16, head: -6, fyN: 0.12, fyF: 0.12, toeN: 25, toeF: 25 }, 'out'],
      [0.54, { lift: -0.04, shN: -122, elN: -34, shF: 122, elF: 34 }, 'in'],
      [0.9, {}],
    ],
    spark: [0.12, 0.4],
    sparkAt: 'fist',
  },
};

// A body without legs fights with what it has instead of a kick.
export const LEGLESS = { ghost: 'wispLash', serpent: 'tailWhip', horse: 'rear', deer: 'rear' };

// Each weapon's moves, to vary a fighter's attacks (one picked per attack); no weapon: fists and feet.
export const POOLS = {
  fist: ['jab', 'straight', 'uppercut', 'palm', 'frontKick', 'roundhouse', 'combo'],
  sword: ['slash', 'rising', 'stab'],
  dagger: ['daggerStab', 'daggerSlash'],
  spear: ['spearThrust', 'spearSweep'],
  axe: ['axeChop'],
  hammer: ['hammerSmash'],
  staff: ['staffCast', 'staffBonk'],
  bow: ['bowShot'],
  pistol: ['pistolShot'],
  rifle: ['rifleShot'],
  ball: ['throw'],
  magic: ['magic'],
};

// Every move in showing order (the move sheet and the film).
export const SHOW = ['jab', 'straight', 'uppercut', 'palm', 'frontKick', 'roundhouse', 'sweep', 'flyingKick', 'combo', 'magic', 'slash', 'rising', 'stab', 'daggerStab', 'daggerSlash', 'spearThrust', 'spearSweep', 'axeChop', 'hammerSmash', 'staffCast', 'staffBonk', 'bowShot', 'pistolShot', 'rifleShot', 'throw', 'wingBuffet', 'tailWhip', 'wispLash', 'rear', 'jump', 'dash', 'dodge', 'block', 'hurt', 'knockdown', 'cheer'];

// How long a move runs after its release.
export const lengthOf = (mv) => mv.keys[mv.keys.length - 1][0];

const smooth = (u) => u * u * (3 - 2 * u);
const EASE = { out: (u) => 1 - (1 - u) ** 3, in: (u) => u * u * u, io: smooth, lin: (u) => u };
const near = (v, ref) => v + 360 * Math.round((ref - v) / 360);

// The pose `t` s from the release (t < 0: the wind-up, `antic` 0..1 of the way into it), over the
// rest pose `base` (every channel it has).
export function poseAt(mv, t, antic, base) {
  const K = mv.keys;
  const out = { ...base };
  const chans = new Set();
  for (const [, p] of K) for (const k of Object.keys(p)) chans.add(k);
  const get = (p, k, other) => {
    if (k in p) return p[k];
    const b = base[k] ?? 0;
    return k === 'wa' && other != null ? near(b, other) : b;
  };
  if (t < 0) {
    const p = K[0][1];
    for (const k of chans) {
      const b = base[k] ?? 0;
      const v = k in p ? p[k] : b;
      const from = k === 'wa' ? near(b, v) : b;
      out[k] = from + (v - from) * antic;
    }
    return out;
  }
  let i = 0;
  while (i < K.length - 1 && t >= K[i + 1][0]) i++;
  if (i >= K.length - 1) return out;
  const [t0, p0] = K[i];
  const [t1, p1, e = 'io'] = K[i + 1];
  const u = (EASE[e] ?? smooth)(Math.min(1, Math.max(0, (t - t0) / Math.max(1e-3, t1 - t0))));
  for (const k of chans) {
    const a = get(p0, k, p1[k]);
    const b = get(p1, k, a);
    out[k] = a + (b - a) * u;
  }
  return out;
}

// Whether a window [from, to] (or a moment, lasting `len`) is on at `t`, and how far through.
export const inWindow = (w, t) => w && t >= w[0] && t <= w[1];
export const since = (moments, t, len) => {
  if (!moments) return -1;
  let best = -1;
  for (const m of moments) if (typeof m === 'number' && t >= m && t <= m + len) best = (t - m) / len;
  return best;
};
