// A tinted copy of something drawn (render/scene.js, render/pets.js).

// Copies of the hero (Phantom, Shadow Partner, Mirage, Demon Form's shadow) and the Beastmaster's
// spirit bear are drawn tinted: onto a scratch canvas, washed with a colour over their own pixels
// (`k` of it), then stamped in. A CSS filter would be one line, but costs the browser a whole extra
// pass every frame (Demon Form fell from 60 frames a second to 25 with one).
let scratch = null;
export function drawTinted(ctx, x, y, tint, k, draw) {
  if (typeof document === 'undefined') return;
  scratch ??= document.createElement('canvas');
  const { width, height } = ctx.canvas;
  if (scratch.width !== width || scratch.height !== height) {
    scratch.width = width;
    scratch.height = height;
  }
  // Only the patch round the hero is touched.
  const m = ctx.getTransform();
  const a = m.transformPoint({ x: x - 80, y: y - 110 });
  const b = m.transformPoint({ x: x + 80, y: y + 24 });
  const rx = Math.max(0, Math.floor(Math.min(a.x, b.x)));
  const ry = Math.max(0, Math.floor(Math.min(a.y, b.y)));
  const rw = Math.min(width, Math.ceil(Math.max(a.x, b.x))) - rx;
  const rh = Math.min(height, Math.ceil(Math.max(a.y, b.y))) - ry;
  if (rw <= 0 || rh <= 0) return;
  const sx = scratch.getContext('2d');
  sx.setTransform(1, 0, 0, 1, 0, 0);
  sx.clearRect(rx, ry, rw, rh);
  sx.setTransform(m);
  draw(sx);
  sx.setTransform(1, 0, 0, 1, 0, 0);
  sx.globalCompositeOperation = 'source-atop';
  sx.globalAlpha = k;
  sx.fillStyle = tint;
  sx.fillRect(rx, ry, rw, rh);
  sx.globalCompositeOperation = 'source-over';
  sx.globalAlpha = 1;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(scratch, rx, ry, rw, rh, rx, ry, rw, rh);
  ctx.restore();
}
