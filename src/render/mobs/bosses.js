// Monster art: Prismaris, the Crystal King (redrawn 2026-11-19 as the Crystal Dragon Kid; his rig is
// in crystalkingrig.js).

import { crystalKingRig, crystalKingStill } from './crystalkingrig.js';

export const ART = {
  crystalking: { walk: 8, idle: 6, attack: 5, stride: 30, atkMs: [80, 150, 450, 240], draw: crystalKingStill, rig: crystalKingRig },
};

// New display names, and the hitbox each design wants: { key: { name, w, h } }.
export const INFO = {
  crystalking: { name: 'Prismaris, the Crystal King', w: 100, h: 130 },
};
