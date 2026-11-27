// Monster art: the finale's boss (Chapter 10, docs/design/main-story.md):
//   alarm   The Alarm, as Madame Reveille: the Queen's alarm clock grown into a brisk, prim morning governess
//           with a rooster's pride, the clock's two brass bells on her bonnet and a handbell in her hand
//           (remade 2026-11-27 from scratch on her own copy of the blank bases' rig, render/reveille/).

import { REVEILLE_ART, REVEILLE_SIZE } from '../reveille/index.js';

export const ART = {
  alarm: REVEILLE_ART,
};

export const INFO = {
  alarm: { name: 'Madame Reveille', w: REVEILLE_SIZE.w, h: REVEILLE_SIZE.h },
};
