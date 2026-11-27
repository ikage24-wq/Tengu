// Monster art: Prismaris, the Crystal King (rebuilt 2026-11-27 to today's standard as the Little Crystal
// King: a scared little boy-king under a crown far too big for him, on his own copy of the kid base, his
// own hair, face and clothes; render/prismaris/).

import { PRISMARIS_ART, PRISMARIS_SIZE } from '../prismaris/index.js';

export const ART = {
  crystalking: PRISMARIS_ART,
};

// New display names, and the hitbox each design wants: { key: { name, w, h } }.
export const INFO = {
  crystalking: { name: 'Prismaris, the Crystal King', w: PRISMARIS_SIZE.w, h: PRISMARIS_SIZE.h },
};
