// Draws the Beastmaster's companion (world/pets.js): Snow wolf (render/snowwolf.js), who walks
// behind the Beastmaster ('back', drawn before the hero).

import { drawSnowWolf } from './snowwolf.js';

export function drawPets(ctx, world, cam, time, layer) {
  const pets = world.pets;
  if (!pets || layer !== 'back') return;
  drawSnowWolf(ctx, world, pets.snow, cam, time);
}
