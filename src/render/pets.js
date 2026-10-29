// Draws the companions: the Beastmaster's Snow wolf (render/snowwolf.js), who walks behind the
// Beastmaster ('back', drawn before the hero), and the Spirit Mage's Spirit Doll
// (render/spiritdoll.js), who floats behind or in front of her as she goes round her.

import { drawSnowWolf } from './snowwolf.js';
import { drawSpiritDoll } from './spiritdoll.js';
import { drawKitsune } from './kitsune.js';
import { drawOniCompanion } from './oni.js';
import { drawYukiCompanion } from './yuki.js';

export function drawPets(ctx, world, cam, time, layer) {
  if (world.doll) drawSpiritDoll(ctx, world, world.doll, cam, time, layer);
  if (world.guardian && layer === 'back') drawKitsune(ctx, world, world.guardian, cam, time);
  if (world.oni && layer === 'back') drawOniCompanion(ctx, world, world.oni, cam, time);
  // (The yuki-onna's snowflakes drift round her: behind her, and in front.)
  if (world.yuki) drawYukiCompanion(ctx, world, world.yuki, cam, time, layer);
  const pets = world.pets;
  if (!pets || layer !== 'back') return;
  drawSnowWolf(ctx, world, pets.snow, cam, time);
}
