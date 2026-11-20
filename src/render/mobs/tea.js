// Monster art: the Tanuki Tea Terraces (the player's pick, 2026-11-10). Every one is a live rig of its
// own now (the last two since 2026-11-20, the player's picks from concept sheets); this file lists them.
//   tanukipicker  Tanuki Picker: a round tanuki in a straw cone hat with its shapeshifting leaf in
//                 the band, a basket of tea on its back and tea shears; snip-snip, leaves flying.
//   kettletanuki  Kettle Tanuki: a shape-shifter who stands about as a copper kettle and pops out its
//                 head, feet and tail when it moves or fights.
//   lantertanuki  Lantern Tanuki: a tanuki pretending to be a paper lantern in the Mist Hollow at
//                 night, its face peeking through a hole; the candle flares and it puffs flame.
//   grandkettle   The Grand Kettle, the terraces' area boss, redrawn 2026-11-19 as the Teapot
//                 Spirit (the oldest tanuki, who sat so long by the hearth he became the teapot).

import { teapotRig, teapotStill } from './teapotrig.js';
import { kettleDisguiseRig, kettleDisguiseStill } from './kettledisguiserig.js';
import { teaPickerRig, teaPickerStill } from './teapickerrig.js';
import { paperLanternRig, paperLanternStill } from './paperlanternrig.js';

// A rig drawn `k` times its size about its feet.
const grown = (rig, k) => ({
  ...rig,
  w: Math.round(rig.w * k),
  h: Math.round(rig.h * k),
  draw(ctx, m, a) {
    ctx.save();
    ctx.scale(k, k);
    rig.draw(ctx, m, a);
    ctx.restore();
  },
});

export const ART = {
  tanukipicker: { walk: 8, idle: 6, attack: 4, stride: 20, atkMs: [80, 300, 160], draw: teaPickerStill, rig: teaPickerRig },
  kettletanuki: { pad: 8, walk: 8, idle: 6, attack: 5, stride: 18, atkMs: [120, 340, 200, 220], draw: kettleDisguiseStill, rig: kettleDisguiseRig },
  lantertanuki: { walk: 8, idle: 6, attack: 4, stride: 18, atkMs: [140, 360, 200], draw: paperLanternStill, rig: paperLanternRig },
  // (Drawn a quarter bigger, 2026-11-19: he was small for a boss.)
  grandkettle: { walk: 4, idle: 3, attack: 4, stride: 40, atkMs: [200, 620, 260], draw: teapotStill, rig: grown(teapotRig, 1.25) },
};

export const INFO = {
  tanukipicker: { name: 'Tanuki Picker', w: 26, h: 34 },
  kettletanuki: { name: 'Kettle Tanuki', w: 34, h: 36 },
  lantertanuki: { name: 'Lantern Tanuki', w: 26, h: 36 },
  grandkettle: { name: 'The Grand Kettle', w: 84, h: 90 },
};
