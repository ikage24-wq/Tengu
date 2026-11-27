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
import { CHICK } from '../chick/index.js';
import { STRAWHOG } from '../strawhog/index.js';
import { PUMPGOB } from '../pumpgob/index.js';
import { LAMBKIN } from '../lambkin/index.js';
import { HARV_MOUSE } from '../harvest/index.js';
import { MOSSTORT } from '../mosstort/index.js';
import { OWLET } from '../owlet/index.js';
import { BLOSSOM_RED_PANDA } from '../redpanda/index.js';
import { PUDDLE_KID_ART } from '../puddlekid/index.js';
import { BLOSSOM_FAIRY_ART } from '../blossomfairy/index.js';

// (The Chickling replaced the Kitchen Brownie, 2026-11-11; since 2026-11-25 the Cellar Scout, on its
// own copy of the bird base, reshaped into a round chick: render/chick/.)
FARM.brownie = CHICK.art;
// (The Strawhog, new for Clover Hills 2026-11-11; since 2026-11-25 the Scarebun, a bunny dressed as a
// scarecrow on its own copy of the bunny base: render/strawhog/.)
FARM.strawhog = STRAWHOG.art;
// (The Pumpkin Goblin, new for Clover Hills 2026-11-11; since 2026-11-25 Honkers, the farm's guard
// goose, on its own copy of the bird base, grown from the duck into a goose that never flies:
// render/pumpgob/.)
FARM.pumpgob = PUMPGOB.art;
// (The Lambkin, new for Clover Hills 2026-11-11; since 2026-11-25 Loftle, a slow tortoise whose shell
// is his own little red hayloft barn, on his own copy of the shell crawler base: render/lambkin/.)
FARM.lambkin = LAMBKIN.art;
// (The Harvest Mouse, new for Clover Hills 2026-11-11; since 2026-11-25 the Nest Weaver, on its own
// copy of the mouse base: render/harvest/.)
FARM.harvmouse = HARV_MOUSE.art;
// (The Moss Tortoise, new for Mossy Woods 2026-11-12; since 2026-11-26 Tumble the Moss Piglet, a
// tardigrade on its own copy of the veggie base: render/mosstort/.)
FARM.mosstort = MOSSTORT.art;
// (The Moss Owlet, new for Mossy Woods 2026-11-12; since 2026-11-25 the Leaf Cloak Owlet, on its own
// copy of the owl base: render/owlet/.)
FARM.mossowlet = OWLET.art;
// (The Red Panda, new for Mossy Woods 2026-11-12; since 2026-11-26 the Blossom Red Panda, a flower-
// loving red panda with hay fever, on his own copy of the rodent base: render/redpanda/.)
FARM.redpanda = BLOSSOM_RED_PANDA.art;
// (Whispering Glade's tanukis in disguise, 2026-11-13: live rigs. Since 2026-11-26 both are remade
// from scratch, each on her own copy of the kid base: render/puddlekid/, render/blossomfairy/.)
FARM.puddlekid = PUDDLE_KID_ART;
FARM.blossomfairy = BLOSSOM_FAIRY_ART;

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
