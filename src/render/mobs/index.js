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
import { ART as MANOR } from './manorfolk.js';
import { ART as MANORBOSS } from './manorfolkboss.js';
import { ART as SEA } from './sea.js';
import { ART as SEABOSS } from './seaboss.js';
import { ART as TOY } from './toy.js';
import { ART as TOYBOSS } from './toyboss.js';
import { ART as ASTRAL } from './astral.js';
import { ART as ASTRALBOSS } from './astralboss.js';
import { ART as CANDY } from './candy.js';
import { ART as CANDYBOSS } from './candyboss.js';
import { ART as STAGE } from './stage.js';
import { ART as STAGEBOSS } from './stageboss.js';
import { ART as SKYFOLK } from './skyfolk.js';
import { ART as SKYBOSS } from './skyboss.js';

export const ARTS = { ...MEADOW, ...WILDS, ...RUINS, ...SKY, ...HOLLOW, ...BOSSES, ...MAIDENS, ...QUEENS, ...BEES, ...FARM, ...MANOR, ...MANORBOSS, ...SEA, ...SEABOSS, ...TOY, ...TOYBOSS, ...ASTRAL, ...ASTRALBOSS, ...CANDY, ...CANDYBOSS, ...STAGE, ...STAGEBOSS, ...SKYFOLK, ...SKYBOSS };

export const mobBuild = (art, pose, frame, mood) => {
  const a = ARTS[art];
  return { res: 2, soft: 'cel', crisp: true, selout: true, pad: a.pad ?? 4, ...a.draw(pose, frame, mood) };
};
