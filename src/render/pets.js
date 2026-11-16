// Draws the companions ('back', before the hero): your Mochi.

import { drawMochiAnim } from './mochi-anim.js';
import { drawShow } from './show.js';
import { drawSumo } from './sumo.js';
import { fxSprite } from './fx-sprites.js';
import { drawGardenLife } from './garden.js';
import { drawRace } from './race.js';

export function drawPets(ctx, world, cam, time, layer) {
  // Your Mochi, behind you.
  // Your Mochi out with you (world/mochi.js), as itself.
  // (Not in a race: it's the one racing, and the race holds the rest of the world still.)
  if (world.mochi?.m && !world.race && layer === 'back') drawMochiAnim(ctx, world.mochi.m, world.mochi.x - cam.x, world.mochi.y - cam.y, world.now);
  // Your garden's Mochi and eggs (world/garden-life.js).
  // (An egg you're hatching sits in front of you, so you see it pop.)
  if (world.gardenLife) drawGardenLife(ctx, world, cam, world.now, layer);
  // The racers in a Mochi race (world/mochi-race.js). (On the frame's own clock, the one the
  // course's scenery draws on: the course reacts to the race's moments, render/courseart.js.)
  if (world.race && layer === 'back') drawRace(ctx, world, cam, time);
  // (The Mochi Show: render/show.js.)
  if (world.show) drawShow(ctx, world, cam, world.now, layer);
  if (world.sumo) drawSumo(ctx, world, cam, world.now, layer);
}
