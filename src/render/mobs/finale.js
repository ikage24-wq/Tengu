// Monster art: the finale's boss (Chapter 10, docs/design/main-story.md):
//   alarm   The Alarm, as Madame Reveille: the Queen's alarm clock grown into a prim, bossy lady with
//           alarm bells for hair buns and a conductor's baton (2026-11-22, reveillerig.js).

import { reveilleRig, reveilleStill } from './reveillerig.js';

export const ART = {
  alarm: { pad: 10, walk: 8, idle: 8, attack: 5, stride: 30, atkMs: [110, 180, 340, 240], draw: reveilleStill, rig: reveilleRig },
};

export const INFO = {
  alarm: { name: 'Madame Reveille', w: 76, h: 118 },
};
