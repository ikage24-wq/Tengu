// Openly licensed art from assets/kenney/ (CC0, see the LICENSE files there).
// Images load in the background. Drawing code checks ready() and falls back to shapes until they arrive.

const load = (src) => {
  const img = new Image();
  img.src = src;
  return img;
};

export const SHEETS = {
  tiny: load('assets/kenney/tiny-dungeon.png'), // 16px monsters and items, packed with no spacing
};

export const EFFECTS = {
  spark: load('assets/kenney/effects/spark.png'),
  star: load('assets/kenney/effects/star.png'),
  slash: load('assets/kenney/effects/slash.png'),
};

export function ready(img) {
  return img.complete && img.naturalWidth > 0;
}

// Draws one tile from a grid sheet. `col` and `row` are zero-based tile coordinates.
export function drawTile(ctx, img, col, row, x, y, { size = 16, scale = 1, flip = false } = {}) {
  const w = size * scale;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (flip) {
    ctx.translate(Math.round(x) + w, Math.round(y));
    ctx.scale(-1, 1);
    ctx.drawImage(img, col * size, row * size, size, size, 0, 0, w, w);
  } else {
    ctx.drawImage(img, col * size, row * size, size, size, Math.round(x), Math.round(y), w, w);
  }
  ctx.restore();
}
