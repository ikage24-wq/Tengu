// Draws the companions: the Beastmaster's Snow wolf (render/snowwolf.js), who walks behind the
// Beastmaster ('back', drawn before the hero), and the mage paths' guardian and yokai troupe.

import { drawMochi } from './mochi.js';
import { drawSnowWolf } from './snowwolf.js';
import { drawKitsune } from './kitsune.js';
import { drawOniCompanion } from './oni.js';
import { drawYukiCompanion } from './yuki.js';
import { drawTenguCompanion } from './tengu.js';

export function drawPets(ctx, world, cam, time, layer) {
  // Your Mochi, behind you.
  if (world.mochi && layer === 'back') drawMochi(ctx, world.mochi, Math.round(world.mochi.x - cam.x), Math.round(world.mochi.y - cam.y), world.now);
  if (world.guardian && layer === 'back') drawKitsune(ctx, world, world.guardian, cam, time);
  if (world.oni && layer === 'back') drawOniCompanion(ctx, world, world.oni, cam, time);
  // (The tengu's feathers circle him: behind him, and in front.)
  if (world.tengu) drawTenguCompanion(ctx, world, world.tengu, cam, time, layer);
  // (The yuki-onna's snowflakes drift round her: behind her, and in front.)
  if (world.yuki) drawYukiCompanion(ctx, world, world.yuki, cam, time, layer);
  const pets = world.pets;
  if (!pets || layer !== 'back') return;
  drawSnowWolf(ctx, world, pets.snow, cam, time);
}
