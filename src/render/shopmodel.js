// A shop model: how a piece of the Mochi wardrobe (data/mochi-wardrobe.js) is shown when it isn't
// on a Mochi of yours - out on the clothes stall's counter in the Garden, and on its card in the
// stall's window (ui/wear-stall.js).
//
// It is a little Mochi on a wooden plinth, standing stock still. A garment was never a shape you
// could hang on a rail here: a Mochi's hair covers its shoulders, so what a piece really looks
// like is only ever what it looks like on a Mochi. So that is what the stall puts out. Every model
// is the same Mochi underneath - same dough, same hair, same stance - so the only thing that
// changes from one to the next is the clothes, which is the whole point of a shop window.

import { drawMochiPose, STANCE } from './mochi-anim.js';
import { rollMochi } from '../data/mochi-genes.js';

const MODELS = new Map();
const modelGenes = (wear, dress = null) => {
  const key = Object.entries(wear).map(([k, v]) => `${k}:${v}`).join('|') + (dress ? `|costume:${dress}` : '');
  let g = MODELS.get(key);
  if (!g) MODELS.set(key, (g = rollMochi(7, { dough: '#e0c096', wear, dress })));
  return g;
};

// Draws the model with its plinth standing on (x, y), wearing `wear` ({ top }, { bottom },
// { dress }, { acc }). An empty `wear` leaves the plinth bare: that one is sold.
export function drawShopModel(ctx, x, y, wear, scale = 1) {
  const has = Object.keys(wear).length > 0;
  ctx.fillStyle = '#9a7450';
  ctx.beginPath();
  ctx.ellipse(x, y - 0.6 * scale, 9.5 * scale, 2.8 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c9a479';
  ctx.beginPath();
  ctx.ellipse(x, y - 2 * scale, 9 * scale, 2.4 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e2c49a';
  ctx.beginPath();
  ctx.ellipse(x - 1.6 * scale, y - 2.6 * scale, 5 * scale, 1.2 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  if (has) drawMochiPose(ctx, modelGenes(wear), x, y - 3 * scale, STANCE.stoic, { scale, blank: true });
}

// The same model with no plinth, standing on (x, y): a piece in the dressing room's closet
// (ui/mochi-closet.js), worn by itself (`wear`, one slot) or a whole prize costume (`dress`,
// data/mochi-dress.js).
export function drawModel(ctx, x, y, { wear = {}, dress = null } = {}, scale = 1) {
  drawMochiPose(ctx, modelGenes(wear, dress), x, y, STANCE.stoic, { scale, blank: true });
}
