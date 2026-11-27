// The Paperclip Fiddler's red-tape shot (2026-11-27): a roll of red tape flung spinning across the room,
// its tape unspooling wavily behind it (kept from the Red-Tape Raccoon whose shot it took over; drawn by
// render/dreamfx.js for any shot named 'redtape').
const TAU = Math.PI * 2;
const RED = ['#ffd0d4', '#ff8a96', '#e8606e', '#c24656'];
const ell = (ctx, x, y, rx, ry) => {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
};
function pen(ctx, col, w) {
  ctx.strokeStyle = col;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}
function roll(ctx, x, y, r, spin, trail = 0) {
  ctx.save();
  ctx.translate(x, y);
  if (trail > 0) {
    ctx.beginPath();
    ctx.moveTo(0, r * 0.9);
    ctx.bezierCurveTo(-trail * 0.3, r * 2.2, -trail * 0.7, -r, -trail, r * 0.6);
    pen(ctx, RED[3], 1.6);
    ctx.stroke();
    pen(ctx, RED[1], 0.9);
    ctx.stroke();
  }
  ctx.rotate(spin);
  ell(ctx, 0, 0, r, r);
  ctx.fillStyle = RED[2];
  ctx.fill();
  pen(ctx, RED[3], r * 0.18);
  ctx.stroke();
  ell(ctx, 0, 0, r * 0.45, r * 0.45);
  ctx.fillStyle = '#fff4ec';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.75, -2.4, -1.2);
  pen(ctx, RED[0], r * 0.16);
  ctx.stroke();
  ctx.restore();
}
export function redTapeShot(ctx, shot, x, y, p, d) {
  if (shot !== 'redtape') return false;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.beginPath();
  const n = 10;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const px = x - d * u * 22 * Math.min(1, p * 3 + 0.2);
    const py = y + Math.sin(u * 9 - p * 20) * 2.4 * u;
    if (i) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  pen(ctx, RED[3], 1.8);
  ctx.stroke();
  pen(ctx, RED[1], 1);
  ctx.stroke();
  ctx.restore();
  roll(ctx, x, y, 2.6, p * 14 * d, 0);
  return true;
}
