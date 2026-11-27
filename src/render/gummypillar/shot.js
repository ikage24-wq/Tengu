// The Gummy Caterpillar's shot (render/dreamfx.js dreamShot, the 'spit' vfx: `p` 0..1 along its flight,
// `d` the way it flies): a jelly bean flicked at you, tumbling, a few soft candy sparkles behind it.
const TAU = Math.PI * 2;
const BEANS = ['#ff8aa8', '#ffd86a', '#9ee06a', '#c09aff', '#ffae6a', '#8acaff'];
function sparkle(ctx, x, y, r, al, col) {
  if (al <= 0.01 || r <= 0.02) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fillStyle = col;
  ctx.fill();
  ctx.restore();
}
export function jellyBeanShot(ctx, shot, x, y, p, d) {
  if (shot !== 'jellybean') return false;
  ctx.save();
  for (let i = 1; i <= 3; i++) sparkle(ctx, x - d * i * 3, y + Math.sin(p * 12 + i) * 1, 1.1 - i * 0.22, 0.9 - i * 0.2, BEANS[i]);
  ctx.translate(x, y);
  ctx.rotate(p * 14 * d);
  ctx.beginPath();
  ctx.ellipse(0, 0, 2.6, 1.6, 0, 0, TAU);
  ctx.strokeStyle = '#9a5a82';
  ctx.lineWidth = 0.9;
  ctx.stroke();
  ctx.fillStyle = BEANS[0];
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-0.6, -0.6, 1, 0.45, 0.2, 0, TAU);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fill();
  ctx.restore();
  return true;
}
