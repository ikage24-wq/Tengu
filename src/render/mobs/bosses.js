// Monster art: Prismaris, the Crystal King (redrawn 2026-11-22 as the Little Crystal King, a scared
// little boy-king on the kid base; his rig is in littlekingrig.js).

import { littleKingRig, littleKingStill } from './littlekingrig.js';

export const ART = {
  crystalking: { walk: 8, idle: 6, attack: 5, stride: 30, atkMs: [80, 150, 450, 240], draw: littleKingStill, rig: littleKingRig },
};

// New display names, and the hitbox each design wants: { key: { name, w, h } }.
export const INFO = {
  crystalking: { name: 'Prismaris, the Crystal King', w: 70, h: 108 },
};
