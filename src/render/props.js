// Small props held in the hand, drawn live along the hand's own angle (so they never leave it).
//
// The folding fan (sensu) the Spirit Mage dances with, and her doll's little one: white paper
// pleats fanning out from a gold rivet, lit and shaded in turn so the folds read, a scarlet band
// along the edge, outlined in a darker shade of the paper. Drawn along +x from the rivet, `k` px
// per unit, `open` 0 (folded shut) to 1 (spread wide).
export const FAN_R = 10;
export function paintFan(ctx, k, open, r = FAN_R) {
  const half = 0.08 + 0.72 * Math.max(0, Math.min(1, open));
  const n = 7;
  ctx.save();
  ctx.scale(k, k);
  for (let i = 0; i < n; i++) {
    const a0 = -half + (2 * half * i) / n;
    const a1 = -half + (2 * half * (i + 1)) / n;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a0) * r, Math.sin(a0) * r);
    ctx.lineTo(Math.cos(a1) * r, Math.sin(a1) * r);
    ctx.closePath();
    ctx.fillStyle = i % 2 ? '#e6e0f2' : '#ffffff';
    ctx.fill();
  }
  // The scarlet band along the edge, a gold line inside it, and the outline.
  ctx.beginPath();
  ctx.arc(0, 0, r, -half, half);
  ctx.arc(0, 0, r * 0.8, half, -half, true);
  ctx.closePath();
  ctx.fillStyle = '#e0303e';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.76, -half, half);
  ctx.lineWidth = 0.35;
  ctx.strokeStyle = '#ffd36a';
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, r, -half, half);
  ctx.closePath();
  ctx.lineWidth = 0.55;
  ctx.strokeStyle = '#8a7aa8';
  ctx.stroke();
  // The guard sticks and the rivet.
  ctx.lineWidth = 0.7;
  ctx.strokeStyle = '#9a6a3a';
  for (const a of [-half, half]) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(0, 0, 1, 0, Math.PI * 2);
  ctx.fillStyle = '#ffd36a';
  ctx.fill();
  ctx.restore();
}
