// The Kitchen Witch (shelved, 2026-11-06; docs/design/kitchen-witch.md). The player liked her but
// wants a real mage and healer first, so she is stored here out of play until she comes back (as
// her own job or a path). Her moves (render/moves.js `kw*`, `kp*`), her ladle and pan (the 'chef'
// weapon finish, render/weapon-designs.js) and her effects (tools/fx-art.js `kw*`, `kp*`, drawn by
// render/effects.js and render/warrior-fx.js) stay in the game files; these are her basic strings,
// fresh-string pools and command moves, ready to hook back into world/melee.js (PATH_COMBOS,
// PATH_VARIANTS, the command table, and `KW_SHOTS` for her splash) under a job of her own.

export const KITCHEN = {
  ladle: [
    { move: 'kwstir', dur: 0.34, step: 10, strikes: [{ at: 0.32, shot: 'kwglob', magic: true, pct: 82, range: 300, h: 60, knock: 25, speed: 820 }] },
    { move: 'kwsplash', dur: 0.42, step: 14, strikes: [{ at: 0.4, shot: 'kwglob', magic: true, pct: 40, range: 280, h: 110, knock: 30, speed: 820, fan: 3 }] },
    { move: 'kwpour', dur: 0.56, step: 20, finisher: true, strikes: [{ at: 0.5, shot: 'kwwave', magic: true, pct: 170, range: 320, h: 80, targets: 3, pierce: true, knock: 200, speed: 760, big: true, stop: 0.06, shake: 2 }] },
  ],
  pan: [
    { move: 'kpbonk', dur: 0.42, step: 12, strikes: [{ at: 0.38, shot: 'kpegg', magic: true, pct: 96, range: 300, h: 70, knock: 120, speed: 760 }] },
    { move: 'kpflip', dur: 0.46, step: 8, strikes: [{ at: 0.34, shot: 'kpegg', magic: true, pct: 104, range: 300, h: 110, knock: 60, launch: 140, speed: 700, lob: 40 }] },
    { move: 'kpflambe', dur: 0.6, step: 16, finisher: true, strikes: [{ at: 0.52, shot: 'kpflame', magic: true, pct: 180, range: 320, h: 80, targets: 4, pierce: true, knock: 220, speed: 760, big: true, stop: 0.07, shake: 3 }] },
  ],
};

export const KITCHEN_VARIANTS = {
  ladle: [
    [KITCHEN.ladle[0], { move: 'kwtaste', dur: 0.32, step: 12, strikes: [{ at: 0.3, shot: 'kwglob', magic: true, pct: 80, range: 300, h: 60, knock: 30, speed: 860 }] }],
    [KITCHEN.ladle[1], { move: 'kwsalt', dur: 0.46, step: 6, strikes: [{ at: 0.42, shot: 'kwspice', magic: true, pct: 38, range: 280, h: 130, knock: 20, speed: 760, fan: 3, drop: 30 }] }],
    [KITCHEN.ladle[2], { move: 'kwscoop', dur: 0.52, step: 14, finisher: true, strikes: [{ at: 0.46, shot: 'kwwave', magic: true, pct: 165, range: 320, h: 90, targets: 3, pierce: true, knock: 180, launch: 160, speed: 740, big: true, stop: 0.06, shake: 2 }] }],
  ],
  pan: [
    [KITCHEN.pan[0], { move: 'kpwok', dur: 0.44, step: 10, strikes: [{ at: 0.3, shot: 'kpegg', magic: true, pct: 94, range: 300, h: 110, knock: 60, speed: 700, lob: 36 }] }],
    [KITCHEN.pan[1], { move: 'kpspin', dur: 0.5, step: 12, strikes: [{ at: 0.46, shot: 'kpegg', magic: true, pct: 106, range: 310, h: 70, targets: 2, pierce: true, knock: 120, speed: 780 }] }],
    [KITCHEN.pan[2], { move: 'kpsmash', dur: 0.58, step: 16, finisher: true, strikes: [{ at: 0.48, shot: 'kpflame', magic: true, pct: 178, range: 320, h: 80, targets: 4, pierce: true, knock: 240, launch: 120, speed: 820, big: true, stop: 0.07, shake: 3 }] }],
  ],
};

export const KITCHEN_COMMANDS = {
  ladle: {
    up: { move: 'kwup', dur: 0.4, step: 6, strikes: [{ at: 0.3, shot: 'kwglob', magic: true, pct: 110, range: 260, h: 190, lift: 60, knock: 20, launch: 360, speed: 820, big: true, stop: 0.04 }] },
    air: [
      { move: 'kwair', dur: 0.36, hang: true, strikes: [{ at: 0.3, shot: 'kwglob', magic: true, pct: 80, range: 260, h: 170, drop: 60, knock: 30, speed: 820 }] },
      { move: 'kwair', dur: 0.42, hang: true, finisher: true, strikes: [{ at: 0.3, shot: 'kwglob', magic: true, fan: 2, pct: 80, range: 260, h: 190, drop: 70, knock: 120, speed: 820, big: true, stop: 0.04, shake: 1 }] },
    ],
    dash: { move: 'kwdash', dur: 0.5, step: 56, carry: 0.5, strikes: [{ at: 0.38, shot: 'kwglob', magic: true, pct: 115, range: 300, h: 70, targets: 2, pierce: true, knock: 100, speed: 880 }] },
  },
  pan: {
    up: { move: 'kpup', dur: 0.42, step: 6, strikes: [{ at: 0.3, shot: 'kpegg', magic: true, pct: 112, range: 260, h: 190, lift: 60, knock: 20, launch: 380, speed: 800, big: true, stop: 0.04 }] },
    air: [
      { move: 'kpair', dur: 0.38, hang: true, strikes: [{ at: 0.3, shot: 'kpegg', magic: true, pct: 84, range: 260, h: 170, drop: 60, knock: 40, speed: 800 }] },
      { move: 'kpair', dur: 0.44, hang: true, finisher: true, strikes: [{ at: 0.3, shot: 'kpegg', magic: true, pct: 110, range: 260, h: 190, drop: 70, targets: 2, pierce: true, knock: 140, speed: 800, big: true, stop: 0.05, shake: 2 }] },
    ],
    dash: { move: 'kpsled', dur: 0.52, step: 60, carry: 0.5, strikes: [{ at: 0.4, shot: 'kpegg', magic: true, pct: 118, range: 300, h: 90, targets: 2, pierce: true, knock: 110, launch: 120, speed: 780, lob: 20 }] },
  },
};
