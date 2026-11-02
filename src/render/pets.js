// Draws the companions: the Beastmaster's Snow wolf (render/snowwolf.js), who walks behind the
// Beastmaster ('back', drawn before the hero), and the mage paths' guardian and yokai troupe.

import { drawMochi } from './mochi.js';
import { fxSprite } from './fx-sprites.js';
import { drawSnowWolf } from './snowwolf.js';
import { drawKitsune } from './kitsune.js';
import { drawOniCompanion } from './oni.js';
import { drawYukiCompanion } from './yuki.js';
import { drawTenguCompanion } from './tengu.js';

export function drawPets(ctx, world, cam, time, layer) {
  // Your Mochi, behind you.
  if (world.mochi && layer === 'back') drawMochi(ctx, world.mochi, Math.round(world.mochi.x - cam.x), Math.round(world.mochi.y - cam.y), world.now);
  if (world.guardian && layer === 'back') drawKitsune(ctx, world, world.guardian, cam, time);
  // The Arbalist Engineer's turret: idle, its head swivelling (frames 0-3), or firing (4-5) for a
  // moment after each bolt, turned to face what it shoots at.
  const tr = world.turret;
  if (tr && tr.map === world.map.id && layer === 'back') {
    const since = world.now - tr.firedAt;
    const frame = since < 0.12 ? 4 : since < 0.24 ? 5 : Math.floor(time * 4) % 4;
    const up = Math.min(1, (world.now - tr.since) / 0.25);
    fxSprite(ctx, 'celaeturret', Math.round(tr.x - cam.x), Math.round(tr.y - cam.y) + 2, { frame, scale: 0.5 * up, flip: tr.dir < 0 });
  }
  if (world.oni && layer === 'back') drawOniCompanion(ctx, world, world.oni, cam, time);
  // (The tengu's feathers circle him: behind him, and in front.)
  if (world.tengu) drawTenguCompanion(ctx, world, world.tengu, cam, time, layer);
  // (The yuki-onna's snowflakes drift round her: behind her, and in front.)
  if (world.yuki) drawYukiCompanion(ctx, world, world.yuki, cam, time, layer);
  const pets = world.pets;
  if (!pets || layer !== 'back') return;
  drawSnowWolf(ctx, world, pets.snow, cam, time);
}
