// Draws the companions ('back', before the hero): your Mochi, and the Arbalist Engineer's turret.

import { drawMochiAnim } from './mochi-anim.js';
import { fxSprite } from './fx-sprites.js';
import { drawGardenLife } from './garden.js';
import { drawRace } from './race.js';

export function drawPets(ctx, world, cam, time, layer) {
  // Your Mochi, behind you.
  // Your Mochi out with you (world/mochi.js), as itself.
  if (world.mochi?.m && layer === 'back') drawMochiAnim(ctx, world.mochi.m, world.mochi.x - cam.x, world.mochi.y - cam.y, world.now);
  // Your garden's Mochi and eggs (world/garden-life.js).
  // (An egg you're hatching sits in front of you, so you see it pop.)
  if (world.gardenLife) drawGardenLife(ctx, world, cam, world.now, layer);
  // The racers in a Mochi race (world/mochi-race.js).
  if (world.race && layer === 'back') drawRace(ctx, world, cam, world.now);
  // The Arbalist Engineer's turret: idle, its head swivelling (frames 0-3), or firing (4-5) for a
  // moment after each bolt, turned to face what it shoots at.
  const tr = world.turret;
  if (tr && tr.map === world.map.id && layer === 'back') {
    const since = world.now - tr.firedAt;
    // The swivel eases between its four drawings (a fractional frame blends into the next).
    const sw = (world.now * 4) % 4;
    const frame = since < 0.12 ? 4 : since < 0.24 ? 5 : sw;
    const next = since < 0.24 ? undefined : (Math.floor(sw) + 1) % 4;
    const up = Math.min(1, (world.now - tr.since) / 0.25);
    fxSprite(ctx, 'celaeturret', tr.x - cam.x, tr.y - cam.y + 2, { frame, next, scale: 0.8 * up, flip: tr.dir < 0 });
  }
}
