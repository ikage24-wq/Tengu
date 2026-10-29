// Draws the companions: the Beastmaster's Snow wolf (render/snowwolf.js), who walks behind the
// Beastmaster ('back', drawn before the hero), and the Spirit Mage's Spirit Doll
// (render/spiritdoll.js), who floats behind or in front of her as she goes round her.

import { drawSnowWolf } from './snowwolf.js';
import { drawSpiritDoll } from './spiritdoll.js';
import { drawKitsune } from './kitsune.js';

export function drawPets(ctx, world, cam, time, layer) {
  if (world.doll) drawSpiritDoll(ctx, world, world.doll, cam, time, layer);
  if (world.guardian && layer === 'back') drawKitsune(ctx, world, world.guardian, cam, time);
  const pets = world.pets;
  if (!pets || layer !== 'back') return;
  drawSnowWolf(ctx, world, pets.snow, cam, time);
}
