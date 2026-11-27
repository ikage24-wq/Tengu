// The Sticky-Note Sprout's paper-plane shot (2026-11-27): a folded paper plane with a little trail of
// puffs, bobbing as it flies (kept from the Intern Quokka whose shot it took over; drawn by
// render/dreamfx.js for any shot named 'paperplane').
const TAU = Math.PI * 2;
const PAPER = ['#ffffff', '#fbf7ee', '#e6dece'];
const ell = (ctx, x, y, rx, ry) => {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), 0, 0, TAU);
};
function pen(ctx, col, w) {
  ctx.strokeStyle = col;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}
function planeShape(ctx, s, fold = 1) {
  ctx.save();
  ctx.scale(s, s);
  for (const pass of ['line', 'fill']) {
    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.lineTo(-3, -2.4 * fold);
    ctx.lineTo(-2.2, 0);
    ctx.lineTo(-3, 1.4 * fold);
    ctx.closePath();
    if (pass === 'line') {
      pen(ctx, PAPER[2], 0.7);
      ctx.lineJoin = 'round';
      ctx.stroke();
    } else {
      ctx.fillStyle = PAPER[0];
      ctx.fill();
    }
  }
  ctx.beginPath();
  ctx.moveTo(4, 0);
  ctx.lineTo(-2.2, 0);
  pen(ctx, PAPER[2], 0.4);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(4, 0);
  ctx.lineTo(-3, 1.4 * fold);
  ctx.lineTo(-2.2, 0);
  ctx.closePath();
  ctx.fillStyle = PAPER[2];
  ctx.fill();
  ctx.restore();
}
export function paperPlaneShot(ctx, shot, x, y, p, d) {
  if (shot !== 'paperplane') return false;
  ctx.save();
  ctx.globalAlpha *= 0.6;
  for (let i = 1; i <= 4; i++) {
    ell(ctx, x - d * i * 3, y + Math.sin(p * 12 - i) * 0.8 + i * 0.3, 0.55 - i * 0.08, 0.55 - i * 0.08);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }
  ctx.restore();
  ctx.save();
  ctx.translate(x, y + Math.sin(p * 12) * 0.8);
  ctx.scale(d, 1);
  ctx.rotate(Math.cos(p * 12) * 0.12);
  planeShape(ctx, 1.1);
  ctx.restore();
  return true;
}
