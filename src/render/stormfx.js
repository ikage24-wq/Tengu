// The Sulk's casts (Chapter 10, 2026-11-19): the storm cloud of the Sky Whale's sadness. Same
// contract as render/dreamfx.js (which hands these on): warn() over the floor warning (`p` 0..1),
// hit() as it lands (`u` 0..1 over STORM_HOLD[look] s). (x, y) is the zone's spot on screen (a
// band's left end); the screen is 640 x 360.
//   drizzle     a little grey raincloud gathering over each of you, then a splash
//   bolt        a dark cloud over the tank, crackling; a slim lightning bolt down
//   downpour    a sheet of rain rolling out across the band, then the full pour
//   grumble     dark clouds rumbling along the top of the screen, then thunder rings
//   forked      faint forks over each lane, then the bolts strike down them
//   cloudburst  the sky darkening, the rain thickening, the floor flooding
//   umbrella    a big umbrella opening over the healer, rain drumming on it, then pouring off
// Lightning is slim and holds its shape: each bolt's zigzag comes from its zone, never from the
// clock, so it never reshuffles from frame to frame.

import { starFlash, easeOut } from './fxkit.js';

const TAU = Math.PI * 2;
const SW = 640;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
export const STORM_HOLD = { drizzle: 0.7, bolt: 0.6, downpour: 0.8, grumble: 1, forked: 0.6, cloudburst: 1.1, umbrella: 0.9 };

// A soft cloud: lumps, grey-blue or dark.
function cloud(ctx, x, y, w, a, dark = false) {
  if (a <= 0.01) return;
  ctx.globalAlpha = a;
  ctx.fillStyle = dark ? '#5a6490' : '#9aa6d0';
  for (const [dx, dy, r] of [[-0.32, 0.1, 0.24], [0.3, 0.1, 0.24], [-0.1, -0.12, 0.3], [0.14, -0.08, 0.28], [0, 0.12, 0.34]]) {
    ctx.beginPath();
    ctx.ellipse(x + dx * w, y + dy * w, r * w, r * w * 0.8, 0, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = dark ? '#7a86b8' : '#d8e0f8';
  ctx.beginPath();
  ctx.ellipse(x - 0.08 * w, y - 0.2 * w, 0.18 * w, 0.08 * w, 0, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;
}
// Rain streaks falling from y0 to y1 across [x0, x1], `n` of them, moving with time.
function rain(ctx, x0, x1, y0, y1, n, time, a, w = 1.2) {
  if (a <= 0.01 || x1 <= x0) return;
  ctx.globalAlpha = a;
  ctx.strokeStyle = '#9fd0ff';
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let k = 0; k < n; k++) {
    const fx = (k * 0.618) % 1;
    const u = (time * 1.8 + k * 0.37) % 1;
    const x = x0 + fx * (x1 - x0) - u * 4;
    const y = y0 + u * (y1 - y0);
    ctx.moveTo(x, y);
    ctx.lineTo(x - 1.4, y + 7);
  }
  ctx.stroke();
  ctx.lineCap = 'butt';
  ctx.globalAlpha = 1;
}
// Little splashes along the floor.
function splashes(ctx, x0, x1, y, n, u, a) {
  if (a <= 0.01) return;
  ctx.globalAlpha = a;
  ctx.strokeStyle = '#bfe4ff';
  ctx.lineWidth = 1.2;
  for (let k = 0; k < n; k++) {
    const x = x0 + ((k + 0.5) / n) * (x1 - x0);
    const r = 2 + ((u + k * 0.3) % 1) * 6;
    ctx.beginPath();
    ctx.ellipse(x, y - 1, r, r * 0.35, 0, Math.PI, TAU);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
// A slim lightning bolt from (x0, y0) down to (x1, y1), its zigzag fixed by `seed`.
function bolt(ctx, x0, y0, x1, y1, seed, a, w = 2.2) {
  if (a <= 0.01) return;
  const pts = [[x0, y0]];
  const n = 6;
  for (let k = 1; k < n; k++) {
    const s = k / n;
    const off = (((Math.sin(seed * 12.9898 + k * 78.233) * 43758.5453) % 1) - 0.5) * 18;
    pts.push([x0 + (x1 - x0) * s + off, y0 + (y1 - y0) * s]);
  }
  pts.push([x1, y1]);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const [c, lw, al] of [['#fff3a6', w * 3.2, 0.35], ['#ffe066', w * 1.6, 0.9], ['#ffffff', w * 0.6, 1]]) {
    ctx.globalAlpha = a * al;
    ctx.strokeStyle = c;
    ctx.lineWidth = lw;
    ctx.beginPath();
    pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.stroke();
  }
  ctx.lineCap = 'butt';
  ctx.globalAlpha = 1;
}
function umbrella(ctx, x, y, r, open) {
  const rr = r * (0.3 + 0.7 * open);
  ctx.fillStyle = '#ff8ab0';
  ctx.beginPath();
  ctx.moveTo(x - rr, y);
  ctx.quadraticCurveTo(x - rr * 0.9, y - r * 0.75, x, y - r * 0.8);
  ctx.quadraticCurveTo(x + rr * 0.9, y - r * 0.75, x + rr, y);
  for (let k = 3; k >= 0; k--) {
    const xa = x - rr + ((k + 0.5) / 4) * 2 * rr;
    ctx.quadraticCurveTo(xa + rr / 4, y - 4, xa - rr / 4, y);
  }
  ctx.fill();
  ctx.fillStyle = '#ffc4d8';
  ctx.beginPath();
  ctx.ellipse(x - rr * 0.3, y - r * 0.5, rr * 0.25, r * 0.12, -0.4, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#7a4a5a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y - r * 0.8);
  ctx.lineTo(x, y + r * 0.7);
  ctx.arc(x - 3, y + r * 0.7, 3, 0, Math.PI);
  ctx.stroke();
}

export const STORM_FX = {
  // A little raincloud gathers over each of you, drizzling harder; then it lets go.
  drizzle: {
    warn(ctx, z, x, y, p, time) {
      cloud(ctx, x, y - 70, 30, 0.4 + 0.5 * p);
      rain(ctx, x - 14, x + 14, y - 62, y - 4, 4 + Math.round(p * 6), time, 0.3 + 0.5 * p);
    },
    hit(ctx, z, x, y, u, e, fade, time) {
      cloud(ctx, x, y - 70 - e * 10, 30, fade * 0.8);
      rain(ctx, x - 16, x + 16, y - 62, y - 4, 12, time * 1.5, fade, 1.6);
      splashes(ctx, x - 20, x + 20, y, 4, u * 2, fade);
    },
  },
  // A dark cloud over the tank, crackling with little sparks; then the bolt.
  bolt: {
    warn(ctx, z, x, y, p, time) {
      cloud(ctx, x, y - 110, 40, 0.5 + 0.5 * p, true);
      if (p > 0.4 && Math.sin(time * 30) > 0.2) bolt(ctx, x - 6, y - 104, x + 4, y - 92, z.x, 0.6 * p, 1);
      ctx.globalAlpha = 0.25 * p;
      ctx.fillStyle = '#fff3a6';
      ctx.beginPath();
      ctx.ellipse(x, y - 1, z.w / 2 * p, 4, 0, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
    },
    hit(ctx, z, x, y, u, e, fade, time) {
      if (u < 0.25) starFlash(ctx, x, y - 6, 16 + u * 70, 10, time, '#ffe066', '#ffffff');
      bolt(ctx, x, y - 104, x, y - 4, z.x, fade, 2.6);
      cloud(ctx, x, y - 110, 40, fade * 0.8, true);
    },
  },
  // A sheet of rain rolls out from the cloud across the band; then the full pour, splashing.
  downpour: {
    warn(ctx, z, x, y, p, time) {
      const d = z.dir ?? 1;
      const x0 = d > 0 ? x : x + z.w;
      const x1 = x0 + d * z.w * easeOut(p);
      rain(ctx, Math.min(x0, x1), Math.max(x0, x1), y - 110, y - 2, Math.round(6 + p * 14), time, 0.25 + 0.35 * p);
    },
    hit(ctx, z, x, y, u, e, fade, time) {
      rain(ctx, x, x + z.w, y - 120, y - 2, 34, time * 1.6, fade * 0.9, 1.8);
      splashes(ctx, x, x + z.w, y, 10, u * 2, fade);
      ctx.globalAlpha = 0.18 * fade;
      ctx.fillStyle = '#7fb8ff';
      ctx.fillRect(x, y - 6, z.w, 6);
      ctx.globalAlpha = 1;
    },
  },
  // Dark clouds rumble along the top of the screen, flickering; then thunder rolls across it.
  grumble: {
    warn(ctx, z, x, y, p, time) {
      for (let k = 0; k < 5; k++) cloud(ctx, 40 + k * 140 + Math.sin(time + k) * 6, 40 + (k % 2) * 10, 70, 0.25 + 0.5 * p, true);
      if (p > 0.5 && Math.sin(time * 23) > 0.6) {
        ctx.globalAlpha = 0.12 * p;
        ctx.fillStyle = '#e8f0ff';
        ctx.fillRect(0, 0, SW, 360);
        ctx.globalAlpha = 1;
      }
    },
    hit(ctx, z, x, y, u, e, fade, time) {
      ctx.globalAlpha = Math.max(0, 1 - u / 0.25) * 0.3;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, SW, 360);
      ctx.globalAlpha = 1;
      for (let k = 0; k < 5; k++) cloud(ctx, 40 + k * 140, 40 + (k % 2) * 10, 70, fade * 0.7, true);
      ctx.strokeStyle = '#d8e0f8';
      for (let k = 0; k < 3; k++) {
        const v = clamp01(e * 1.2 - k * 0.15);
        ctx.globalAlpha = (1 - u) * 0.7;
        ctx.lineWidth = 3 - k * 0.6;
        ctx.beginPath();
        ctx.ellipse(SW / 2, 50, 40 + v * 360, 14 + v * 60, 0, 0, Math.PI);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    },
  },
  // Faint forks flicker over each lane; then the bolts come down them.
  forked: {
    warn(ctx, z, x, y, p, time) {
      const mid = x + z.w / 2;
      if (p > 0.3 && Math.sin(time * 26 + z.x) > 0.5) bolt(ctx, mid, y - 260, mid, y - 4, z.x, 0.25 * p, 1);
      ctx.globalAlpha = 0.12 + 0.2 * p;
      ctx.fillStyle = '#fff3a6';
      ctx.fillRect(x + 4, y - 4, z.w - 8, 4);
      ctx.globalAlpha = 1;
    },
    hit(ctx, z, x, y, u, e, fade, time) {
      const mid = x + z.w / 2;
      bolt(ctx, mid - z.w * 0.18, y - 280, mid - z.w * 0.1, y - 4, z.x, fade, 2.4);
      bolt(ctx, mid + z.w * 0.2, y - 280, mid + z.w * 0.14, y - 4, z.x + 7, fade * 0.8, 1.8);
      if (u < 0.25) starFlash(ctx, mid, y - 6, 12 + u * 50, 8, time, '#ffe066', '#ffffff');
    },
  },
  // The sky darkens, the rain thickens over the whole floor, and the water rises; then it floods.
  cloudburst: {
    warn(ctx, z, x, y, p, time) {
      ctx.globalAlpha = 0.18 * p;
      ctx.fillStyle = '#2a3260';
      ctx.fillRect(0, 0, SW, 360);
      ctx.globalAlpha = 1;
      rain(ctx, 0, SW, 0, y, Math.round(20 + p * 40), time, 0.35 + 0.4 * p);
      ctx.globalAlpha = 0.2 + 0.3 * p;
      ctx.fillStyle = '#7fb8ff';
      ctx.fillRect(0, y - 2 - p * 8, SW, 12 + p * 8);
      ctx.globalAlpha = 1;
    },
    hit(ctx, z, x, y, u, e, fade, time) {
      const h = 24 * Math.sin(Math.min(1, u * 1.6) * Math.PI * 0.5) * (1 - Math.max(0, u - 0.5) * 2) + 4;
      rain(ctx, 0, SW, 0, y, 60, time * 1.6, fade, 1.8);
      ctx.globalAlpha = 0.6 * fade;
      ctx.fillStyle = '#5a9ae8';
      ctx.beginPath();
      ctx.moveTo(0, y + 10);
      for (let k = 0; k <= 32; k++) ctx.lineTo((k / 32) * SW, y - h - Math.sin(k * 0.9 + time * 7) * 3);
      ctx.lineTo(SW, y + 10);
      ctx.fill();
      ctx.fillStyle = '#bfe4ff';
      ctx.globalAlpha = 0.8 * fade;
      for (let k = 0; k <= 16; k++) {
        ctx.beginPath();
        ctx.ellipse((k / 16) * SW, y - h - Math.sin(k * 1.8 + time * 7) * 3, 6, 1.6, 0, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      splashes(ctx, 0, SW, y - h, 16, u * 2, fade);
    },
  },
  // A big umbrella opens over the healer, rain drumming on it; then the rain pours off its rim.
  umbrella: {
    warn(ctx, z, x, y, p, time) {
      rain(ctx, x - z.w / 2, x + z.w / 2, y - 150, y - 62, 10 + Math.round(p * 10), time, 0.3 + 0.5 * p);
      umbrella(ctx, x, y - 54, z.w / 2, clamp01(p * 2));
    },
    hit(ctx, z, x, y, u, e, fade, time) {
      umbrella(ctx, x, y - 54 + e * 4, z.w / 2, 1);
      rain(ctx, x - z.w / 2 - 6, x - z.w / 2 + 6, y - 54, y - 2, 6, time * 1.6, fade, 2);
      rain(ctx, x + z.w / 2 - 6, x + z.w / 2 + 6, y - 54, y - 2, 6, time * 1.6, fade, 2);
      splashes(ctx, x - z.w / 2 - 10, x + z.w / 2 + 10, y, 6, u * 2, fade);
    },
  },
};
