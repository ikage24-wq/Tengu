// Monster art: Twilight Ruins and Crystal Cave. Every one is a live rig of its own now (all six remade
// 2026-11-20, the player's picks from concept sheets); this file lists them.
//   acolyte       Ruin Acolyte: a floating hooded temple girl with a censer and a wisp living in it
//                 (2026-11-22, replaced the Will-o'-Wisp; since 2026-11-26 rebuilt to the new standard on
//                 her own copy of the kid base: render/acolyte/).
//   gargoyle      Gargoyle Kid: an impish little gargoyle with stone wings, horns and tail, who turns to
//                 stone for fun (2026-11-22, replaced the Imp; since 2026-11-26 rebuilt to the new
//                 standard on her own copy of the kid base: render/gargoyle/).
//   boneknight    Pangolin Sentry: the old Moon Guard's mascot pangolins in their dented helmets, still
//                 on patrol in the Sunken Crypt (2026-11-26, replaced the Dullahan; on its own copy of the
//                 creature base: render/pangolin/).
//   crystalslime  Gem Mimic: the Chest Hermit, a fluffy ginger critter carrying a treasure chest on its
//                 back like a hermit crab; it bites, and slams the lid (2026-11-24, on the creature
//                 base; render/hermit/).
//   rockgolem     Geode Turtle: an old cave-lake sea turtle whose stone shell cracked open on top like a
//                 geode, soft amethyst crystals growing out of it that glow when it hums (2026-11-27,
//                 replaced the Geode Bear; on its own copy of the shell crawler base: render/geodeturtle/).
//   shade         Steam Capybara: a round, unbothered capybara floating in its own bath-cloud of steam,
//                 an onsen towel and a yuzu on its head, at home on Serpent Springs (since 2026-11-27
//                 no longer in the cave) (2026-11-26, replaced the Wraith; on its own copy of the creature base:
//                 render/steamcapybara/).

import { PANGOLIN_ART, PANGOLIN_SIZE } from '../pangolin/index.js';
import { ACOLYTE_ART } from '../acolyte/index.js';
import { GARGOYLE_ART } from '../gargoyle/index.js';
import { HERMIT_ART, HERMIT_SIZE } from '../hermit/index.js';
import { GEODE_TURTLE_ART, GEODE_TURTLE_SIZE } from '../geodeturtle/index.js';
import { STEAM_CAPYBARA_ART, STEAM_CAPYBARA_SIZE } from '../steamcapybara/index.js';

// Every design flies or walks with its own cadence: `stride` is how far it travels per cycle.
export const ART = {
  acolyte: ACOLYTE_ART,
  gargoyle: GARGOYLE_ART,
  boneknight: PANGOLIN_ART,
  crystalslime: HERMIT_ART,
  rockgolem: GEODE_TURTLE_ART,
  shade: STEAM_CAPYBARA_ART,
};

// New display names, and the hitbox each design wants: { key: { name, w, h } }.
export const INFO = {
  acolyte: { name: 'Ruin Acolyte', w: 26, h: 40 },
  gargoyle: { name: 'Gargoyle Kid', w: 28, h: 38 },
  boneknight: { name: 'Pangolin Sentry', w: PANGOLIN_SIZE.w, h: PANGOLIN_SIZE.h },
  crystalslime: { name: 'Gem Mimic', ...HERMIT_SIZE },
  rockgolem: { name: 'Geode Turtle', w: GEODE_TURTLE_SIZE.w, h: GEODE_TURTLE_SIZE.h },
  shade: { name: 'Steam Capybara', w: STEAM_CAPYBARA_SIZE.w, h: STEAM_CAPYBARA_SIZE.h },
};
