// Every monster design, by art name, and how one of its sprites is built (shared by monsters.js
// and the background sprite worker).

import { ART as MEADOW } from './meadow.js';
import { ART as WILDS } from './wilds.js';
import { ART as RUINS } from './ruins.js';
import { ART as SKY } from './sky.js';
import { ART as HOLLOW } from './hollow.js';
import { ART as BOSSES } from './bosses.js';
import { ART as MAIDENS } from './maidens.js';
import { ART as QUEENS } from './queens.js';
import { ART as BEES } from './bees.js';
import { ART as FARM } from './farm.js';

export const ARTS = { ...MEADOW, ...WILDS, ...RUINS, ...SKY, ...HOLLOW, ...BOSSES, ...MAIDENS, ...QUEENS, ...BEES, ...FARM };

export const mobBuild = (art, pose, frame, mood) => {
  const a = ARTS[art];
  return { res: 2, soft: 'cel', crisp: true, selout: true, pad: a.pad ?? 4, ...a.draw(pose, frame, mood) };
};
