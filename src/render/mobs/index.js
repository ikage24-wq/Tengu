// Every monster design, by art name, and how one of its sprites is built (shared by monsters.js
// and the background sprite worker).

import { ART as MEADOW } from './meadow.js';
import { ART as WILDS } from './wilds.js';
import { ART as RUINS } from './ruins.js';
import { ART as SKY } from './sky.js';
import { ART as HOLLOW } from './hollowfolk.js';
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
import { ART as FINALE } from './finale.js';
import { ART as TEA } from './tea.js';
import { turnipRig } from './turniprig.js';
import { chickRig, chickStill } from './chickrig.js';
import { strawhogRig, strawhogStill } from './strawhogrig.js';
import { pumpgobRig, pumpgobStill } from './pumpgobrig.js';
import { lambkinRig, lambkinStill } from './lambkinrig.js';
import { harvmouseRig, harvmouseStill } from './harvmouserig.js';
import { mosstortRig, mosstortStill } from './mosstortrig.js';
import { mossowletRig, mossowletStill } from './mossowletrig.js';
import { redpandaRig, redpandaStill } from './redpandarig.js';
import { puddleKidRig, puddleKidStill, blossomFairyRig, blossomFairyStill } from './gladekidsrig.js';

// (The Turnip Tot is a live rig, rebuilt 2026-11-11: its still frames stay for portraits.)
MEADOW.sproutling.rig = turnipRig;
// (The Chickling replaced the Kitchen Brownie, 2026-11-11: a live rig, its stills from the same parts.)
Object.assign(FARM.brownie, { draw: chickStill, rig: chickRig, pad: 4 });
// (The Strawhog, new for Clover Hills 2026-11-11: its own live rig, its stills from the same parts.)
FARM.strawhog = { walk: 8, idle: 6, attack: 4, stride: 30, atkMs: [80, 300, 220], draw: strawhogStill, rig: strawhogRig, pad: 4 };
// (The Pumpkin Goblin, new for Clover Hills 2026-11-11: its own live rig, its stills from the same shapes.)
FARM.pumpgob = { walk: 8, idle: 6, attack: 4, stride: 16, atkMs: [80, 300, 220], draw: pumpgobStill, rig: pumpgobRig, pad: 4 };
// (The Lambkin, new for Clover Hills 2026-11-11: its own live rig, its stills from the same shapes.)
FARM.lambkin = { walk: 8, idle: 6, attack: 4, stride: 14, atkMs: [80, 300, 220], draw: lambkinStill, rig: lambkinRig, pad: 4 };
// (The Harvest Mouse, new for Clover Hills 2026-11-11: its own live rig, its stills from the same shapes.)
FARM.harvmouse = { walk: 8, idle: 6, attack: 4, stride: 12, atkMs: [80, 300, 220], draw: harvmouseStill, rig: harvmouseRig, pad: 4 };
// (The Moss Tortoise, new for Mossy Woods 2026-11-12: its own live rig, its stills from the same shapes.)
FARM.mosstort = { walk: 8, idle: 6, attack: 4, stride: 22, atkMs: [80, 300, 220], draw: mosstortStill, rig: mosstortRig, pad: 4 };
// (The Moss Owlet, new for Mossy Woods 2026-11-12: its own live rig, its stills from the same shapes.)
FARM.mossowlet = { walk: 8, idle: 6, attack: 4, stride: 46, atkMs: [80, 300, 220], draw: mossowletStill, rig: mossowletRig, pad: 4 };
// (The Red Panda, new for Mossy Woods 2026-11-12: its own live rig, its stills from the same shapes.)
FARM.redpanda = { walk: 8, idle: 6, attack: 4, stride: 22, atkMs: [80, 300, 220], draw: redpandaStill, rig: redpandaRig, pad: 4 };
// (Whispering Glade's tanukis in disguise, 2026-11-13: live rigs, their stills from the same drawings.)
FARM.puddlekid = { walk: 8, idle: 6, attack: 4, stride: 18, atkMs: [80, 300, 220], draw: puddleKidStill, rig: puddleKidRig, pad: 4 };
FARM.blossomfairy = { walk: 8, idle: 6, attack: 4, stride: 40, atkMs: [80, 300, 220], draw: blossomFairyStill, rig: blossomFairyRig, pad: 4 };

export const ARTS = { ...MEADOW, ...WILDS, ...RUINS, ...SKY, ...HOLLOW, ...BOSSES, ...MAIDENS, ...QUEENS, ...BEES, ...FARM, ...MANOR, ...MANORBOSS, ...SEA, ...SEABOSS, ...TOY, ...TOYBOSS, ...ASTRAL, ...ASTRALBOSS, ...CANDY, ...CANDYBOSS, ...STAGE, ...STAGEBOSS, ...SKYFOLK, ...SKYBOSS, ...FINALE, ...TEA };

export const mobBuild = (art, pose, frame, mood) => {
  const a = ARTS[art];
  return roomFor({ res: 2, soft: 'cel', crisp: true, selout: true, pad: a.pad ?? 4, ...a.draw(pose, frame, mood) }, mood === 'dead');
};

// Room for everything a frame draws (2026-11-18, the crop sweep): a pose that reaches past its box
// (a swing, a thrown seed, a body tumbling over in its fall) was cut off at the sprite's edge. The
// margin round the box grows to hold it, and the sprite is placed as before. Below the box is the
// floor: a foot pressed a pixel or two into it stays trimmed flat, as it stands; anything deeper
// (and the whole fallen body, which is knocked up and tumbles) gets room too.
const SEE_THROUGH = /^#[0-9a-f]{6}00$|^#[0-9a-f]{3}0$|,\s*0\)$/i;
function roomFor(spec, fallen) {
  const { w, h, shapes, pad = 1 } = spec;
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const s of shapes) {
    if (!s || s.c === 'none' || SEE_THROUGH.test(s.c)) continue;
    if (s.t === 'r') {
      if (s.w <= 0 || s.h <= 0) continue;
      x0 = Math.min(x0, s.x);
      y0 = Math.min(y0, s.y);
      x1 = Math.max(x1, s.x + s.w);
      y1 = Math.max(y1, s.y + s.h);
    } else if (s.t === 'e') {
      x0 = Math.min(x0, s.x - s.rx);
      y0 = Math.min(y0, s.y - s.ry);
      x1 = Math.max(x1, s.x + s.rx);
      y1 = Math.max(y1, s.y + s.ry);
    } else if (s.t === 'p') {
      for (const [px, py] of s.pts) {
        x0 = Math.min(x0, s.x + px);
        y0 = Math.min(y0, s.y + py);
        x1 = Math.max(x1, s.x + px);
        y1 = Math.max(y1, s.y + py);
      }
    }
  }
  if (x0 === Infinity) return spec;
  const side = Math.max(-pad - x0, x1 - (w + pad), -pad - y0);
  const below = y1 - (h + 1);
  const out = side > 0.5 ? { ...spec, pad: pad + Math.ceil(side) + 1 } : spec;
  return below > (fallen ? 0.5 : 2.5) ? { ...out, padB: Math.ceil(below) + 2 } : out;
}
