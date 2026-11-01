// A map's moving parts (world/physics.js): bounce blossoms, updrafts of pollen or petals. Drifting
// ledges are drawn with the other ledges (scenery.js), offset by the same clock the physics uses.

import { mix, shade, snap, OUTLINE } from './pixel.js';

const hash = (n) => {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
};

// A bounce blossom: a wide flower pad on a short stem. It sways a little at rest; stepped on, it
// dips, flings itself up past its rest and settles back, petals and pollen bursting off it.
function blossom(ctx, x, y, time, since, wx = x) {
  const k = since < 0.9 ? since : 9;
  // Dip, fling, settle (a damped spring).
  const fling = k < 0.08 ? -k / 0.08 : k < 9 ? Math.exp(-(k - 0.08) * 6) * Math.cos((k - 0.08) * 22) : 0;
  const lift = 3 + fling * 5;
  const sway = Math.sin(time * 1.8 + wx) * 0.06;
  const petal = '#ff9ec7';
  const light = '#ffd2e6';
  const line = shade(petal, -38);
  ctx.save();
  ctx.translate(x, y);
  // Drawn big enough to spot from across the floor.
  ctx.scale(1.6, 1.6);
  // Stem and two leaves.
  ctx.strokeStyle = '#5fae5f';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(sway * 20, -lift / 2, sway * 10, -lift);
  ctx.stroke();
  for (const s of [-1, 1]) {
    ctx.fillStyle = s < 0 ? '#7fd07a' : '#6cc46c';
    ctx.beginPath();
    ctx.ellipse(s * 6, -1, 6, 2.4, s * -0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.translate(sway * 10, -lift);
  ctx.rotate(sway);
  // The pad: a ring of wide petals seen from the side, back row darker.
  const petals = (row, ry, col) => {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI + row * 0.26;
      const px = Math.cos(a) * 11;
      ctx.fillStyle = col;
      ctx.strokeStyle = line;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(px, ry, 5.5, 3.2, Math.cos(a) * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  };
  petals(0, -3, mix(petal, '#b06cc4', 0.25));
  petals(1, -1, petal);
  // The heart: a soft yellow cushion with a shine.
  ctx.fillStyle = '#ffe17a';
  ctx.strokeStyle = shade('#ffe17a', -50);
  ctx.beginPath();
  ctx.ellipse(0, -3, 6, 2.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = light;
  ctx.fillRect(-3, -4.5, 3, 1);
  ctx.restore();
  // A burst of petals flying up off it.
  if (since < 0.9) {
    for (let i = 0; i < 8; i++) {
      const a = -Math.PI / 2 + (hash(i + 3) - 0.5) * 1.8;
      const v = 40 + hash(i + 9) * 50;
      const px = x + Math.cos(a) * v * since;
      const py = y - lift + Math.sin(a) * v * since + 60 * since * since;
      ctx.globalAlpha = 1 - since / 0.9;
      ctx.fillStyle = i % 3 ? petal : '#ffe17a';
      ctx.beginPath();
      ctx.ellipse(px, py, 2.2, 1.3, time * 6 + i, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

// An updraft: motes rising in a slow spiral, with a faint column of light. Pollen is warm gold
// dust off the hive; petals are cherry blossom caught in a whirl round the tree.
const DRAFTS = {
  pollen: { glow: '#ffd970', bits: ['#ffc83a', '#ffdc6e', '#fff2b8'], count: 24, speed: 70, size: 2, petal: false },
  petals: { glow: '#ffd2e6', bits: ['#ff9ec7', '#ffc2dc', '#ffffff'], count: 18, speed: 85, size: 2.4, petal: true },
};
function updraft(ctx, u, cam, time) {
  const d = DRAFTS[u.kind] ?? DRAFTS.pollen;
  const x = u.x - cam.x;
  const top = u.top - 30 - cam.y;
  const bottom = u.bottom - cam.y;
  const h = bottom - top;
  const g = ctx.createLinearGradient(0, top, 0, bottom);
  g.addColorStop(0, `${d.glow}00`);
  g.addColorStop(0.5, `${d.glow}40`);
  g.addColorStop(1, `${d.glow}66`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, (top + bottom) / 2, u.w / 2 + 4, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < d.count; i++) {
    const p = (time * d.speed / h + hash(i)) % 1;
    const a = time * 2.4 + i * 2.1;
    const r = (u.w / 2) * (0.35 + 0.65 * hash(i + 20)) * (0.6 + 0.4 * Math.sin(p * Math.PI));
    const px = snap(x + Math.cos(a) * r);
    const py = snap(bottom - p * h);
    ctx.globalAlpha = Math.min(1, p * 5, (1 - p) * 4) * (Math.sin(a) > -0.3 ? 1 : 0.5);
    ctx.fillStyle = d.bits[i % d.bits.length];
    ctx.beginPath();
    if (d.petal) ctx.ellipse(px, py, d.size, d.size * 0.55, a, 0, Math.PI * 2);
    else ctx.arc(px, py, d.size * (0.7 + 0.5 * hash(i + 5)), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // A soft ring where the air starts, so you can find it.
  ctx.strokeStyle = `${d.glow}aa`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(x, bottom - 1, u.w / 2, 3, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = OUTLINE + '00';
}

export function drawMovers(ctx, map, cam, width, height, time) {
  for (const u of map.updrafts ?? []) {
    if (u.x + u.w < cam.x - 20 || u.x - u.w > cam.x + width + 20 || u.bottom < cam.y - 20 || u.top - 40 > cam.y + height) continue;
    updraft(ctx, u, cam, time);
  }
  for (const s of map.springs ?? []) {
    const x = s.x - cam.x;
    if (x < -30 || x > width + 30) continue;
    blossom(ctx, snap(x), snap(s.y - cam.y), time, s.firedAt == null ? 9 : (map.clock ?? 0) - s.firedAt, s.x);
  }
}
