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

// A hay bale bounce: a round golden bale tied with twine. Stepped on, it dips and springs back,
// straw flying off it.
// A big old kettle lid lying on a mossy stone: stepped on, it clanks down, then pops you up and
// rattles, a puff of steam escaping under it (the Tea Terraces' Upper Rows).
function kettleLid(ctx, x, y, time, since) {
  const k = since < 0.9 ? since : 9;
  const pop = k < 0.08 ? -k / 0.08 : k < 9 ? Math.exp(-(k - 0.08) * 5) * Math.sin((k - 0.08) * 24) : 0;
  ctx.save();
  ctx.fillStyle = '#8fa080';
  ctx.beginPath();
  ctx.ellipse(x, y - 2, 13, 3.4, 0, 0, Math.PI * 2);
  ctx.fill();
  const ly = y - 6 - pop * 5;
  ctx.fillStyle = '#4a5262';
  ctx.strokeStyle = '#2a2f3a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(x, ly, 11, 3.6, pop * 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#6a7486';
  ctx.beginPath();
  ctx.ellipse(x - 3, ly - 1, 5, 1.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2a2f3a';
  ctx.beginPath();
  ctx.ellipse(x, ly - 3.4, 2.4, 1.8, 0, 0, Math.PI * 2);
  ctx.fill();
  // Steam escaping under it after a bounce.
  if (k < 0.9) {
    ctx.strokeStyle = '#ffffff';
    for (let i = 0; i < 2; i++) {
      ctx.globalAlpha = (1 - k / 0.9) * 0.8;
      ctx.beginPath();
      ctx.arc(x + (i ? 8 : -8), ly - 4 - k * 14, 2 + k * 4, 0.2, Math.PI * 1.5);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function hay(ctx, x, y, since) {
  const k = since < 0.9 ? since : 9;
  const dip = k < 0.08 ? k / 0.08 : k < 9 ? -Math.exp(-(k - 0.08) * 6) * Math.cos((k - 0.08) * 22) : 0;
  const h = 14 - dip * 3;
  ctx.save();
  ctx.fillStyle = '#e8c070';
  ctx.strokeStyle = shade('#e8c070', -45);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(x, y - h / 2, 13, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#f6dc98';
  ctx.beginPath();
  ctx.ellipse(x + 2, y - h * 0.65, 8, h * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#a3714c';
  for (const dx of [-6, 6]) {
    ctx.beginPath();
    ctx.moveTo(x + dx, y - h);
    ctx.lineTo(x + dx, y);
    ctx.stroke();
  }
  if (since < 0.9) {
    ctx.fillStyle = '#f6dc98';
    for (let i = 0; i < 8; i++) {
      const a = -Math.PI / 2 + (((i * 0.37) % 1) - 0.5) * 2;
      ctx.globalAlpha = 1 - since / 0.9;
      ctx.fillRect(x + Math.cos(a) * 60 * since, y - h + Math.sin(a) * 60 * since + 50 * since * since, 3, 1);
    }
  }
  ctx.restore();
}

// An air vent on the mesa: a crack in the rock breathing little swirls of wind; stepped on, it
// bursts in a puff of air.
function vent(ctx, x, y, time, since) {
  ctx.save();
  ctx.fillStyle = '#a8724a';
  ctx.beginPath();
  ctx.ellipse(x, y - 1, 9, 2.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5a3a2a';
  ctx.beginPath();
  ctx.ellipse(x, y - 1.2, 6, 1.2, 0, 0, Math.PI * 2);
  ctx.fill();
  const k = since < 0.6 ? 1 - since / 0.6 : 0;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const u = (time * 0.9 + i / 3) % 1;
    ctx.globalAlpha = 0.6 * Math.sin(u * Math.PI) * (1 - k) + k;
    const h = 6 + u * 16 + k * 20;
    ctx.beginPath();
    ctx.arc(x + Math.sin(u * 6 + i) * 3, y - h, 2 + u * 2 + k * 3, 0.2, Math.PI * 1.5);
    ctx.stroke();
  }
  ctx.restore();
}

// A bouncy mushroom: a fat red cap with cream spots on a stubby stem, swaying a little; stepped
// on, the cap squashes down, springs up past its rest and wobbles back, spores puffing off it.
// A giant clam on your island's beach: it breathes slowly, its lid ajar; stepped on, it snaps
// down, flings itself open and settles back, a pearl winking inside and droplets flying.
function clam(ctx, x, y, time, since, wx) {
  const k = since < 1 ? since : 9;
  const fling = k < 0.07 ? -k / 0.07 : k < 9 ? Math.exp(-(k - 0.07) * 5) * Math.cos((k - 0.07) * 18) : 0;
  const breathe = Math.sin(time * 1.1 + wx) * 0.04;
  const open = Math.max(-0.05, 0.22 + breathe + fling * 0.5);
  const shell = (a, top) => {
    ctx.save();
    ctx.translate(x - 13, y - 5);
    ctx.rotate(-a);
    ctx.fillStyle = top ? '#ffd2e0' : '#ffc2d4';
    ctx.strokeStyle = '#c8708e';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(13, 0, 15, top ? 8 : 6, 0, top ? Math.PI : 0, top ? Math.PI * 2 : Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#e8a0b8';
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(13, 0);
      ctx.lineTo(13 + i * 5.5, top ? -7 : 5);
      ctx.stroke();
    }
    ctx.restore();
  };
  shell(0, false);
  // The pearl inside, catching the light.
  const tw = 0.6 + 0.4 * Math.sin(time * 2.3 + wx);
  ctx.fillStyle = '#fffaf2';
  ctx.beginPath();
  ctx.arc(x, y - 6, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `rgba(255,255,255,${tw})`;
  ctx.fillRect(x - 1.6, y - 8, 1.4, 1.4);
  shell(open, true);
  if (since < 0.8) {
    ctx.fillStyle = '#c8f4ff';
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i - 2.5) * 0.4;
      const d = 6 + since * 60;
      ctx.globalAlpha = 1 - since / 0.8;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * d, y - 8 + Math.sin(a) * d + since * since * 60, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

function shroom(ctx, x, y, time, since, wx) {
  const k = since < 0.9 ? since : 9;
  const s = k < 0.08 ? -k / 0.08 : k < 9 ? Math.exp(-(k - 0.08) * 6) * Math.cos((k - 0.08) * 22) : 0;
  const sway = Math.sin(time * 1.5 + wx) * 0.8;
  ctx.save();
  ctx.fillStyle = '#fff2e0';
  ctx.strokeStyle = shade('#fff2e0', -40);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x - 4, y - 9, 8, 9, 3);
  ctx.fill();
  ctx.stroke();
  const cy = y - 9 - s * 3;
  const rx = 14 - s * 2;
  const ry = 7 + s * 2;
  ctx.fillStyle = '#ff6a6a';
  ctx.strokeStyle = shade('#ff6a6a', -45);
  ctx.beginPath();
  ctx.ellipse(x + sway, cy, rx, ry, 0, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fff2e0';
  for (const [dx, dy, r] of [[-7, -2.4, 2], [0, -5, 2.4], [7, -2.6, 1.8], [-2, -1.4, 1.2]]) {
    ctx.beginPath();
    ctx.ellipse(x + sway + dx, cy + dy * (ry / 7), r, r * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (since < 0.9) {
    ctx.fillStyle = '#c8ffd0';
    for (let i = 0; i < 6; i++) {
      ctx.globalAlpha = 1 - since / 0.9;
      ctx.beginPath();
      ctx.arc(x + (i - 2.5) * 5 + Math.sin(i * 3) * 4 * since, cy - 8 - since * 30 - i % 2 * 4, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// An updraft: motes rising in a slow spiral, with a faint column of light. Pollen is warm gold
// dust off the hive; petals are cherry blossom caught in a whirl round the tree.
const DRAFTS = {
  foxfire: { glow: '#9fd0ff', bits: ['#8fbcff', '#eef6ff', '#ff9ec7'], count: 20, speed: 75, size: 2.2, petal: true },
  wisplight: { glow: '#c8d8ff', bits: ['#ffffff', '#bfe6ff', '#d8c8ff'], count: 20, speed: 70, size: 1.8, petal: false },
  mist: { glow: '#d8f4ff', bits: ['#ffffff', '#cfeeff', '#a8dcff'], count: 24, speed: 80, size: 2, petal: false },
  spores: { glow: '#c8ffd0', bits: ['#9fffb0', '#e6ffd0', '#bfe6ff'], count: 22, speed: 60, size: 1.6, petal: false },
  gust: { glow: '#e8f4ff', bits: ['#ffffff', '#d8ecff', '#f0e0c8'], count: 22, speed: 120, size: 1.8, petal: true },
  chaff: { glow: '#ffe6b0', bits: ['#e8c070', '#f6dc98', '#fff2c8'], count: 20, speed: 75, size: 2.2, petal: true },
  pollen: { glow: '#ffd970', bits: ['#ffc83a', '#ffdc6e', '#fff2b8'], count: 24, speed: 70, size: 2, petal: false },
  bubbles: { glow: '#bfeeff', bits: ['#ffffff', '#dff6ff', '#9fe0ff'], count: 22, speed: 90, size: 2.2, petal: false },
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

// A funhouse springboard: a striped pad on a coil that squashes flat and boings up when it fires.
function springboard(ctx, x, y, since) {
  const pop = since < 0.12 ? -1 : since < 0.5 ? Math.sin(((since - 0.12) / 0.38) * Math.PI * 3) * (1 - (since - 0.12) / 0.38) : 0;
  const h = 8 + pop * 6;
  ctx.strokeStyle = '#a8b4d8';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let k = 0; k <= 6; k++) ctx.lineTo(x + (k % 2 ? 6 : -6), y - (k / 6) * h);
  ctx.stroke();
  ctx.fillStyle = '#ff7aa8';
  ctx.beginPath();
  ctx.roundRect(x - 12, y - h - 4, 24, 5, 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  for (let k = 0; k < 3; k++) ctx.fillRect(x - 9 + k * 8, y - h - 4, 3, 5);
}

export function drawMovers(ctx, map, cam, width, height, time) {
  for (const u of map.updrafts ?? []) {
    if (u.x + u.w < cam.x - 20 || u.x - u.w > cam.x + width + 20 || u.bottom < cam.y - 20 || u.top - 40 > cam.y + height) continue;
    updraft(ctx, u, cam, time);
  }
  for (const s of map.springs ?? []) {
    const x = s.x - cam.x;
    if (x < -30 || x > width + 30) continue;
    // (A bounce "in the future", when the map's clock started again after it fired, counts as long
    // past: worked out backwards it turned the pads inside out, a mushroom's cap to a negative size.)
    const ago = s.firedAt == null ? 9 : (map.clock ?? 0) - s.firedAt;
    const since = ago < 0 ? 9 : ago;
    if (s.kind === 'hay') hay(ctx, snap(x), snap(s.y - cam.y), since);
    else if (s.kind === 'gust') vent(ctx, snap(x), snap(s.y - cam.y), time, since);
    else if (s.kind === 'spring') springboard(ctx, snap(x), snap(s.y - cam.y), since);
    else if (s.kind === 'shroom') shroom(ctx, snap(x), snap(s.y - cam.y), time, since, s.x);
    else if (s.kind === 'clam') clam(ctx, snap(x), snap(s.y - cam.y), time, since, s.x);
    else if (s.kind === 'kettle') kettleLid(ctx, snap(x), snap(s.y - cam.y), time, since);
    else blossom(ctx, snap(x), snap(s.y - cam.y), time, since, s.x);
  }
}
