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

// The gohei the Shrine Maiden dances with in place of the fan: a slim wand of pale wood with a
// gold cap, and two long zigzag paper streamers (shide) hanging from its tip that stream out and
// flutter as she sweeps it. Drawn along +x from the hand, `k` px per unit; `open` (the fan's own
// 0-1) is how far the streamers fly out, `time` sets their flutter.
export function paintGohei(ctx, k, open, time = 0) {
  const fly = Math.max(0, Math.min(1, open));
  ctx.save();
  ctx.scale(k, k);
  ctx.lineCap = 'round';
  // The wand.
  ctx.strokeStyle = '#7a5a34';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-1.5, 0);
  ctx.lineTo(10, 0);
  ctx.stroke();
  ctx.strokeStyle = '#e8cfa0';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(-1.3, 0);
  ctx.lineTo(9.8, 0);
  ctx.stroke();
  ctx.fillStyle = '#ffd36a';
  ctx.fillRect(9.4, -0.9, 1.6, 1.8);
  // Two streamers from the tip: zigzag strips of paper, each hanging and fluttering, flung out
  // away from the wand as it moves.
  for (const [side, ph] of [[1, 0], [-1, 1.7]]) {
    ctx.save();
    ctx.translate(10, 0);
    ctx.rotate(side * (0.9 + 0.5 * fly) + Math.sin(time * 5 + ph) * (0.12 + 0.15 * fly));
    const w = 2.2;
    const seg = 2.3;
    const pts = [];
    for (let i = 0; i <= 4; i++) {
      const x = i % 2 ? w * 0.5 : 0;
      pts.push([x + Math.sin(time * 7 + i + ph) * 0.3 * fly, i * seg]);
    }
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x + w * 0.5, y) : ctx.moveTo(x + w * 0.5, y)));
    for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i][0] - w * 0.5, pts[i][1]);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 0.35;
    ctx.strokeStyle = '#9a8cc0';
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}
