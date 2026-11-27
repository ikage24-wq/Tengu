// The Constellation Starfish's shot (render/dreamfx.js dreamShot, the 'spit' vfx: `p` 0..1 along its
// flight, `d` the way it flies): a little gold star, turning as it flies, a soft trail of light behind it.
const TAU = Math.PI * 2;
export function starGlintShot(ctx, shot, x, y, p, d) {
  if (shot !== 'starglint') return false;
  ctx.save();
  for (let i = 1; i <= 4; i++) {
    ctx.globalAlpha = 0.5 * (1 - i / 5);
    ctx.beginPath();
    ctx.ellipse(x - d * i * 3, y + Math.sin(p * 20 + i) * 0.4, 2.2 - i * 0.35, 1.2 - i * 0.18, 0, 0, TAU);
    ctx.fillStyle = '#ffe8a8';
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  const g = ctx.createRadialGradient(x, y, 0, x, y, 7);
  g.addColorStop(0, 'rgba(255,224,140,0.55)');
  g.addColorStop(1, 'rgba(255,224,140,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, 7, 0, TAU);
  ctx.fill();
  for (const [r, col] of [[3.2, '#ffd774'], [1.6, '#fff6d8']]) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const an = -Math.PI / 2 + p * 9 * d + (i * Math.PI) / 5;
      const rr = i % 2 ? r * 0.5 : r;
      const q = [x + Math.cos(an) * rr, y + Math.sin(an) * rr];
      if (i) ctx.lineTo(...q);
      else ctx.moveTo(...q);
    }
    ctx.closePath();
    ctx.lineJoin = 'round';
    ctx.fillStyle = col;
    ctx.fill();
  }
  ctx.restore();
  return true;
}
