// The Palace at Dawn (Chapter 10's finale arena, 2026-11-19): the Mochi palace on its hill above
// Sprout Village with the sun just coming up behind it, the sky lilac going pink going gold. Painted
// far back (render/scenery.js `painted: 'dawnpalace'`) in slow parallax: the sun and its rays, soft
// lit clouds, lavender far hills, the palace hill (a cream hall with arched windows lit warm, a big
// pink mochi dome with a gold sprout on top, two towers with mint and lilac domes and pink pennants,
// bunting strung between), and green near hills.

const TAU = Math.PI * 2;
const sx = (cam, width, wx, k) => width / 2 - (cam.x + width / 2 - wx) * k;
function glow(ctx, x, y, r, rgb, a) {
  if (a <= 0 || r <= 0) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
function hill(ctx, x0, x1, base, h, c, wob, phase) {
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.moveTo(x0, base + 200);
  for (let x = x0; x <= x1; x += 16) ctx.lineTo(x, base - h - Math.sin(x * wob + phase) * h * 0.35);
  ctx.lineTo(x1, base + 200);
  ctx.fill();
}
function cloud(ctx, x, y, w, c, rim) {
  ctx.fillStyle = c;
  for (const [dx, dy, r] of [[-0.3, 0.05, 0.22], [0.28, 0.06, 0.2], [-0.05, -0.1, 0.28], [0.12, -0.04, 0.24]]) {
    ctx.beginPath();
    ctx.ellipse(x + dx * w, y + dy * w, r * w, r * w * 0.6, 0, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = rim;
  ctx.beginPath();
  ctx.ellipse(x - 0.05 * w, y - 0.22 * w, 0.2 * w, 0.06 * w, 0, 0, TAU);
  ctx.fill();
}
// A mochi dome: wide and soft, a highlight, a gold sprout finial.
function dome(ctx, x, y, w, h, c, hi) {
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y);
  ctx.bezierCurveTo(x - w / 2, y - h * 1.1, x + w / 2, y - h * 1.1, x + w / 2, y);
  ctx.fill();
  ctx.fillStyle = hi;
  ctx.beginPath();
  ctx.ellipse(x - w * 0.18, y - h * 0.62, w * 0.14, h * 0.16, -0.4, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#e8b030';
  ctx.fillRect(x - 0.8, y - h * 0.86 - 7, 1.6, 7);
  ctx.fillStyle = '#ffd34a';
  ctx.beginPath();
  ctx.ellipse(x - 3, y - h * 0.86 - 8, 3.2, 1.8, -0.5, 0, TAU);
  ctx.ellipse(x + 3, y - h * 0.86 - 8, 3.2, 1.8, 0.5, 0, TAU);
  ctx.fill();
}
function tower(ctx, x, base, w, h, domeC, domeHi, time, k) {
  ctx.fillStyle = '#f4e4dc';
  ctx.fillRect(x - w / 2, base - h, w, h);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x - w / 2, base - h, w * 0.3, h);
  ctx.fillStyle = '#e8c8c0';
  ctx.fillRect(x + w * 0.3, base - h, w * 0.2, h);
  ctx.fillStyle = '#ffd890';
  for (let y = base - h + 14; y < base - 14; y += 22) {
    ctx.beginPath();
    ctx.ellipse(x, y + 4, 3, 5, 0, Math.PI, TAU);
    ctx.rect(x - 3, y + 4, 6, 6);
    ctx.fill();
  }
  dome(ctx, x, base - h, w + 8, 22, domeC, domeHi);
  // A pink pennant on the finial, flapping.
  const fx = x;
  const fy = base - h - 30;
  ctx.strokeStyle = '#a88a6a';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(fx, fy + 6);
  ctx.lineTo(fx, fy - 10);
  ctx.stroke();
  ctx.fillStyle = '#ff8ab0';
  const f = Math.sin(time * 3 + k) * 3;
  ctx.beginPath();
  ctx.moveTo(fx, fy - 10);
  ctx.quadraticCurveTo(fx + 8, fy - 9 + f, fx + 16, fy - 7 + f * 1.4);
  ctx.quadraticCurveTo(fx + 8, fy - 5 + f, fx, fy - 4);
  ctx.fill();
}
function bunting(ctx, x0, y0, x1, y1, n, sag) {
  ctx.strokeStyle = '#c8a8a0';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + sag, x1, y1);
  ctx.stroke();
  const cs = ['#ff8ab0', '#ffd34a', '#9fe0c8', '#c8a8ff'];
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * ((x0 + x1) / 2) + t * t * x1;
    const y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * ((y0 + y1) / 2 + sag) + t * t * y1;
    ctx.fillStyle = cs[i % 4];
    ctx.beginPath();
    ctx.moveTo(x - 3, y);
    ctx.lineTo(x + 3, y);
    ctx.lineTo(x, y + 6);
    ctx.fill();
  }
}

export function drawPaintedDawnPalace(ctx, t, cam, width, height, time, layerY, air, map) {
  const mw = map?.width ?? 1400;
  const horizon = layerY(0, 0.2);
  // The sky: lilac high up, pink, then gold along the horizon.
  const g = ctx.createLinearGradient(0, 0, 0, horizon);
  g.addColorStop(0, '#9a8ad8');
  g.addColorStop(0.5, '#ffb0c8');
  g.addColorStop(1, '#ffe0a8');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
  // The sun coming up behind the palace hill, slow rays turning round it.
  const sunX = sx(cam, width, mw * 0.56, 0.12);
  const sunY = layerY(0, 0.12) - 92;
  glow(ctx, sunX, sunY, 170, '255,236,180', 0.55);
  ctx.save();
  ctx.translate(sunX, sunY);
  ctx.rotate(time * 0.02);
  ctx.fillStyle = 'rgba(255,248,214,0.18)';
  for (let k = 0; k < 12; k++) {
    ctx.rotate(TAU / 12);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-10, -230);
    ctx.lineTo(10, -230);
    ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = '#fff4c8';
  ctx.beginPath();
  ctx.arc(sunX, sunY, 46, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(sunX - 8, sunY - 8, 30, 0, TAU);
  ctx.fill();
  // Soft clouds lit pink and gold, drifting.
  for (let k = 0; k < 5; k++) {
    const cx = ((sx(cam, width, k * 340 + 80, 0.08) + time * 3 * (0.6 + k * 0.1)) % (width + 300)) - 120;
    cloud(ctx, cx, 50 + (k % 3) * 34, 90 + (k % 2) * 40, k % 2 ? '#ffd4e0' : '#ffe4c8', '#fff8ec');
  }
  // Lavender far hills.
  const far = layerY(0, 0.18);
  hill(ctx, -20, width + 20, far, 40, '#c8a8d8', 0.012, cam.x * 0.18 * 0.012);
  // The palace hill, and the palace on it.
  const k = 0.3;
  const base = layerY(0, k);
  const px = sx(cam, width, mw * 0.5, k);
  // (High enough that the arena's middle ledge never hides the great dome.)
  const top = base - 150;
  ctx.fillStyle = '#b8d8a0';
  ctx.beginPath();
  ctx.moveTo(px - 360, base + 200);
  ctx.quadraticCurveTo(px - 220, top + 8, px, top);
  ctx.quadraticCurveTo(px + 220, top + 8, px + 360, base + 200);
  ctx.fill();
  ctx.fillStyle = '#d0e8b8';
  ctx.beginPath();
  ctx.ellipse(px - 60, top + 10, 120, 10, 0, 0, TAU);
  ctx.fill();
  // Towers, then the hall, then the great dome.
  tower(ctx, px - 92, top + 4, 30, 96, '#9fe0c8', '#d8f8ec', time, 1);
  tower(ctx, px + 92, top + 4, 30, 96, '#c8a8ff', '#ece0ff', time, 2);
  ctx.fillStyle = '#f8ece6';
  ctx.fillRect(px - 72, top - 56, 144, 60);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(px - 72, top - 56, 144, 6);
  ctx.fillStyle = '#ffb8cc';
  ctx.fillRect(px - 74, top - 60, 148, 6);
  ctx.fillStyle = '#e8d0c8';
  ctx.fillRect(px + 40, top - 50, 32, 54);
  // Arched windows lit warm, and the great door.
  for (const wx of [-52, -30, 30, 52]) {
    ctx.fillStyle = '#ffd890';
    ctx.beginPath();
    ctx.ellipse(px + wx, top - 34, 6, 7, 0, Math.PI, TAU);
    ctx.rect(px + wx - 6, top - 34, 12, 12);
    ctx.fill();
    ctx.fillStyle = '#fff4c8';
    ctx.fillRect(px + wx - 1, top - 40, 2, 16);
  }
  ctx.fillStyle = '#c87a9a';
  ctx.beginPath();
  ctx.ellipse(px, top - 20, 11, 12, 0, Math.PI, TAU);
  ctx.rect(px - 11, top - 20, 22, 24);
  ctx.fill();
  ctx.fillStyle = '#ffd34a';
  ctx.fillRect(px - 1, top - 30, 2, 2);
  dome(ctx, px, top - 60, 112, 58, '#ffc4d8', '#ffe8f0');
  // The sun's rim light down the palace's right side.
  ctx.fillStyle = 'rgba(255,240,190,0.55)';
  ctx.fillRect(px + 70, top - 56, 2, 60);
  bunting(ctx, px - 92, top - 76, px - 40, top - 70, 7, 10);
  bunting(ctx, px + 40, top - 70, px + 92, top - 76, 7, 10);
  // Green near hills at the arena's edge.
  const near = layerY(0, 0.45);
  hill(ctx, -20, width + 20, near, 24, '#9ccc88', 0.01, cam.x * 0.45 * 0.01 + 2);
}
