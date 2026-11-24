// Fawnelle's measures, in her base's units (a third of a game pixel), shared by her drawing
// (render/fawnelle/art.js, in her painter) and the game's side (render/fawnelle/index.js), which never
// loads her drawing itself.
import { BODIES } from '../mobs/blankbases.js';

const B = BODIES.deertaur;
const HX = B.cx + B.dx;
const HY = B.head[0];

// Where she stands: her feet's middle, on the ground.
export const ANCHOR = [150, B.g];
// The box her drawing stays in whatever she does (antler tips, swinging tails, hearts rising, a hop),
// measured over every emotion, a walk and a trot, with room to spare.
export const BOX = { x0: 76, y0: -42, x1: 238, y1: B.g + 6 };
// Her face: the middle of her brow, for a portrait window.
export const FACE = { x: HX + 1, y: HY + 1 };
// (in game pixels: how tall she stands to her antler tips, and how far her body reaches each way)
export const TALL = Math.round((B.g - 2) / 3);
export const WIDE = 20;
