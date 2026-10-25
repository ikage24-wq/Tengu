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

// CC0 parallax layers from OpenGameArt (see assets/oga/LICENSE-*.txt). `factor` is the scroll speed.
export const BACKGROUNDS = {
  ocean: {
    night: [
      { img: load('assets/oga/backgrounds/ocean-night/Back.png'), factor: 0.1 },
      { img: load('assets/oga/backgrounds/ocean-night/Clouds.png'), factor: 0.16 },
      { img: load('assets/oga/backgrounds/ocean-night/Middle.png'), factor: 0.4 },
    ],
    noon: [
      { img: load('assets/oga/backgrounds/ocean-noon/Back.png'), factor: 0.1 },
      { img: load('assets/oga/backgrounds/ocean-noon/Clouds.png'), factor: 0.16 },
      { img: load('assets/oga/backgrounds/ocean-noon/Middle.png'), factor: 0.4 },
    ],
  },
  forest: [
    { img: load('assets/oga/backgrounds/tall-forest/back.png'), factor: 0.1 },
    { img: load('assets/oga/backgrounds/tall-forest/far.png'), factor: 0.25 },
    { img: load('assets/oga/backgrounds/tall-forest/middle.png'), factor: 0.5 },
  ],
};

// Classic bases plus the 16 CC0 sample characters (16x24 frames, 4 columns by 4 rows).
export const SAMPLE_CHARACTERS = Array.from({ length: 16 }, (_, i) =>
  load(`assets/oga/characters/sample_character_${String(i + 1).padStart(2, '0')}.png`)
);

export function ready(img) {
  return img.complete && img.naturalWidth > 0;
}

// Draws one cell of a non-square grid, such as a 16x24 character frame, at an integer scale.
export function drawCell(ctx, img, col, row, cw, ch, x, y, { scale = 1, flip = false } = {}) {
  const w = cw * scale;
  const h = ch * scale;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (flip) {
    ctx.translate(Math.round(x) + w, Math.round(y));
    ctx.scale(-1, 1);
    ctx.drawImage(img, col * cw, row * ch, cw, ch, 0, 0, w, h);
  } else {
    ctx.drawImage(img, col * cw, row * ch, cw, ch, Math.round(x), Math.round(y), w, h);
  }
  ctx.restore();
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
