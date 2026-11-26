// Varro's little effects (the Bramble Bear concept B): real things, never rings. Moss dust puffs,
// pebbles, bits of moss, four-point twinkles, a soft dizzy swirl. All drawn about (x, y), in game px.
const TAU = Math.PI * 2;

// A soft cloud of sage-grey moss dust: a few lumps that thin out at their edges (no rim, so it
// reads as dust in the air, never a bubble).
const LUMPS = [[0, 0, 1], [-0.62, 0.22, 0.72], [0.6, 0.26, 0.68], [0.12, -0.42, 0.62]];
export function puff(ctx, x, y, r, al) {
  if (al <= 0.01 || r <= 0.05) return;
  ctx.save();
  ctx.globalAlpha *= Math.min(1, al) * 0.85;
  for (const [dx, dy, k] of LUMPS) {
    const cx = x + dx * r;
    const cy = y + dy * r;
    const rr = r * k;
    const g = ctx.createRadialGradient(cx - rr * 0.25, cy - rr * 0.3, 0, cx, cy, rr);
    g.addColorStop(0, 'rgba(232,234,220,0.95)');
    g.addColorStop(0.55, 'rgba(206,212,190,0.75)');
    g.addColorStop(1, 'rgba(184,192,168,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, rr, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}
// A rounded pebble, tumbling.
export function pebble(ctx, x, y, r, an, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= Math.min(1, al);
  ctx.translate(x, y);
  ctx.rotate(an);
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.25, r * 0.9, 0, 0, TAU);
  ctx.fillStyle = '#a9b3a0';
  ctx.fill();
  ctx.lineWidth = 0.4;
  ctx.strokeStyle = '#6f7d68';
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(-r * 0.35, -r * 0.3, r * 0.45, r * 0.25, 0, 0, TAU);
  ctx.fillStyle = '#d3dacb';
  ctx.fill();
  ctx.restore();
}
// A little tuft of moss, three soft rounds.
export function moss(ctx, x, y, r, an, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= Math.min(1, al);
  ctx.translate(x, y);
  ctx.rotate(an);
  for (const [dx, dy, k] of [[-0.7, 0.2, 0.7], [0.6, 0.25, 0.65], [0, -0.25, 0.85]]) {
    ctx.beginPath();
    ctx.arc(dx * r, dy * r, k * r, 0, TAU);
    ctx.fillStyle = '#86a95e';
    ctx.fill();
    ctx.lineWidth = 0.35;
    ctx.strokeStyle = '#5f8243';
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(-0.15 * r, -0.45 * r, 0.4 * r, 0, TAU);
  ctx.fillStyle = '#b4d38a';
  ctx.fill();
  ctx.restore();
}
// A four-point twinkle, soft-waisted.
export function twinkle(ctx, x, y, r, an, al) {
  if (al <= 0.01 || r <= 0.05) return;
  ctx.save();
  ctx.globalAlpha *= Math.min(1, al);
  ctx.translate(x, y);
  ctx.rotate(an);
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const q = (i * TAU) / 4;
    const q2 = q + TAU / 8;
    ctx.lineTo(Math.cos(q) * r, Math.sin(q) * r);
    ctx.quadraticCurveTo(Math.cos(q2) * r * 0.18, Math.sin(q2) * r * 0.18, Math.cos(q + TAU / 4) * r, Math.sin(q + TAU / 4) * r);
  }
  ctx.closePath();
  ctx.fillStyle = '#fffbe6';
  ctx.fill();
  ctx.lineWidth = 0.35;
  ctx.strokeStyle = '#e6c766';
  ctx.stroke();
  ctx.restore();
}
// A soft dizzy swirl.
export function spiral(ctx, x, y, r, an) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(an);
  ctx.beginPath();
  for (let i = 0; i <= 18; i++) {
    const q = i / 18;
    const a = q * TAU * 1.6;
    const rr = r * (0.15 + 0.85 * q);
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.lineCap = 'round';
  ctx.lineWidth = 0.6;
  ctx.strokeStyle = '#9fb7d8';
  ctx.stroke();
  ctx.restore();
}
