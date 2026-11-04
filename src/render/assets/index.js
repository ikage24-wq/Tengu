// The asset library (2026-11): high-quality pieces drawn ahead, ready to add to the game later,
// grouped by theme. Each theme is a list of { id, name, kind, w, h, frames, fps, build(f) }; `kind`
// is 'furniture', 'prop', 'landmark', 'monster' or 'cosmetic'. drawAsset draws one, animated, with
// its bottom centre at (x, y), in the game's own prop style. Browse them all in
// tools/asset-gallery.html.

import { art, place } from '../scenery.js';
import { SPRING } from './spring.js';
import { SUMMER } from './summer.js';

export const ASSET_THEMES = [
  { id: 'spring', name: 'Spring Blossom Festival', assets: SPRING },
  { id: 'summer', name: 'Summer Beach', assets: SUMMER },
];

export function assetSprite(a, frame = 0) {
  const f = (a.frames ?? 1) > 1 ? frame % a.frames : 0;
  return art(`asset|${a.id}|${f}`, a.w, a.h, () => a.build(f));
}

export function drawAsset(ctx, a, x, y, time, opts) {
  const frame = Math.floor(time * (a.fps ?? 6));
  place(ctx, assetSprite(a, frame), x, y, opts);
}
