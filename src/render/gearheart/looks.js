// Queen Gearheart's cast looks (2026-11-27, her new fight, world/carnival.js): each telegraph drawn whole in
// her own clockwork style (no plain floor marker under it: they are on render/bossfx.js OWN_WARN), while
// its cast winds up (`warn`, p 0..1 through the warning), and in place of the plain flash as it lands
// (`hit`, u 0..1 over its hold): brass cogs, a clock face, a music box's comb and its notes, springs,
// her rose and teal. render/dreamfx.js hands each zone with one of these looks to them. Every shape
// rounded, outlined in a deeper shade of its own colour, eased.
//   ghCogs    Cog Toss (a marker on each of you: spread): a brass cog spinning down onto you, a gold
//             cog-toothed ring on the floor; landing, it clanks down and bounces, little cogs scatter
//   ghTap     Royal Tap (the tank's marker): her sceptre's pinwheel star spinning high over the tank,
//             coming down, a rose and teal ring under it; landing, a starburst and pinwheel petals
//   ghNoon    Twelve O'Clock (a patch round her: get out): a great clock face on the floor round her,
//             its twelve marks, two hands sweeping round to noon; landing, a chime of light and notes
//   ghMelody  Music Box Melody (strips of floor, one after another): a music box's comb laid on each
//             strip, its tines lighting as the tune comes; landing, the tines ring, notes jump up
//   ghDuet    Duet (a stack): a rose heart on the floor round the marked one, two little dancing notes
//             circling it, a music-box key for each guest it needs; landing, the heart bursts in notes
//   ghSpring  Springs Loose! (everyone): springs and cogs trembling up out of the floor all round the
//             plaza, a warm glow gathering; landing, they all boing loose
import { glow, pen, sparkle, star, ell, hash, sstep, clamp, TAU } from './fx.js';

const SW = 640;
const ROSE = ['#ffd6e0', '#f49ab4', '#d8708e', '#a84a68'];
const TEAL = ['#c8f2ee', '#5cc4c0', '#3a9a9c', '#22686e'];
const BRASS = ['#ffe9a8', '#e8b84a', '#b8862c', '#7e5a1c'];
const GOLD = ['#fff4c0', '#f6c94e', '#c8902c', '#8e6418'];
const CREAM = '#fffaf0';
const ease = (u) => 1 - (1 - clamp(u, 0, 1)) ** 3;

function cogPath(ctx, x, y, r, n, ang = 0, tooth = 0.22, flat = 1) {
  ctx.beginPath();
  const N = n * 8;
  for (let i = 0; i <= N; i++) {
    const u = (i / N) * TAU + ang;
    const w = Math.cos(u * n);
    const rr = r * (1 + tooth * sstep((w + 0.2) / 0.6));
    const p = [x + Math.cos(u) * rr, y + Math.sin(u) * rr * flat];
    if (i) ctx.lineTo(...p);
    else ctx.moveTo(...p);
  }
  ctx.closePath();
}
function cog(ctx, x, y, r, ang, al = 1, n = 8) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  cogPath(ctx, x, y, r, n, ang, 0.24);
  ctx.fillStyle = BRASS[1];
  ctx.fill();
  pen(ctx, BRASS[3], Math.max(0.6, r * 0.14));
  ctx.stroke();
  ell(ctx, x - r * 0.2, y - r * 0.25, r * 0.4, r * 0.3);
  ctx.fillStyle = 'rgba(255,240,200,0.6)';
  ctx.fill();
  ell(ctx, x, y, r * 0.32, r * 0.32);
  ctx.fillStyle = BRASS[3];
  ctx.fill();
  ctx.restore();
}
// A cog-toothed ring flat on the floor.
function floorCog(ctx, x, y, r, fill, rim, al, ang = 0, w = 1.4) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  cogPath(ctx, x, y, r, 14, ang, 0.08, 0.26);
  ctx.fillStyle = fill;
  ctx.fill();
  pen(ctx, rim, w);
  ctx.stroke();
  ctx.restore();
}
function noteMark(ctx, x, y, s, ang, al, col) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(ang);
  pen(ctx, '#7e5a1c', s * 0.4);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(s * 0.62, 0);
  ctx.lineTo(s * 0.62, -s * 2.1);
  ctx.quadraticCurveTo(s * 1.3, -s * 1.8, s * 1.4, -s * 1.1);
  ctx.stroke();
  ell(ctx, 0, 0, s * 0.78, s * 0.58, -0.4);
  ctx.stroke();
  ctx.fillStyle = col;
  ctx.fill();
  ctx.restore();
}
function pinwheel(ctx, x, y, s, ang, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(ang);
  for (let i = 0; i < 4; i++) {
    ctx.save();
    ctx.rotate((i * TAU) / 4);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(s * 0.8, -s * 0.15, s, -s * 0.8);
    ctx.quadraticCurveTo(s * 0.45, -s * 0.9, 0, 0);
    ctx.closePath();
    ctx.fillStyle = i % 2 ? ROSE[1] : TEAL[1];
    ctx.fill();
    pen(ctx, i % 2 ? ROSE[3] : TEAL[3], Math.max(0.6, s * 0.08));
    ctx.stroke();
    ctx.restore();
  }
  ell(ctx, 0, 0, s * 0.18, s * 0.18);
  ctx.fillStyle = GOLD[1];
  ctx.fill();
  ctx.restore();
}

function cogsWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorCog(ctx, x, y, r, 'rgba(232,184,74,0.18)', BRASS[2], 0.5 + 0.5 * p, time * 0.5);
  // a brass cog spinning down onto the marked one, its shadow growing
  const yy = y - 120 + 100 * ease(p);
  const s = 0.3 + 0.7 * ease(p);
  ell(ctx, x, y, r * 0.5 * s, r * 0.13 * s);
  ctx.fillStyle = `rgba(80,50,30,${(0.3 * s).toFixed(3)})`;
  ctx.fill();
  cog(ctx, x, yy, 8, time * 5, 0.8 + 0.2 * p);
}
function cogsHit(ctx, z, x, y, u, e, fade, time) {
  const r = z.w / 2;
  floorCog(ctx, x, y, r * (1 + e * 0.3), 'rgba(255,233,168,0.4)', BRASS[2], fade, u * 2, 2);
  cog(ctx, x, y - 8 - Math.sin(Math.PI * clamp(u * 1.6, 0, 1)) * 14, 8, u * 6, fade);
  for (let i = 0; i < 5; i++) {
    const an = -Math.PI / 2 + (i - 2) * 0.55;
    cog(ctx, x + Math.cos(an) * (6 + e * 20), y - 8 + Math.sin(an) * (6 + e * 14), 2.6 * (1 - u * 0.4), u * 10 + i, fade, 6);
  }
}
function tapWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  for (let k = 0; k < 3; k++) floorCog(ctx, x, y, r * (1 - k * 0.3), k % 2 ? 'rgba(92,196,192,0.25)' : 'rgba(244,154,180,0.25)', k % 2 ? TEAL[3] : ROSE[3], 0.5 + 0.5 * p, -time * (k + 1) * 0.4, 1.2);
  const yy = y - 120 + 80 * ease(p);
  glow(ctx, x, yy, 18, '#fff4f0', 0.4 * p);
  pinwheel(ctx, x, yy, 10, time * (6 + p * 10), 0.8 + 0.2 * p);
}
function tapHit(ctx, z, x, y, u, e, fade, time) {
  const r = z.w / 2;
  floorCog(ctx, x, y, r * (0.6 + e * 0.9), 'rgba(255,214,224,0.4)', ROSE[2], fade, u * 3, 2);
  for (let i = 0; i < 6; i++) {
    const an = -Math.PI / 2 + (i - 2.5) * 0.5;
    star(ctx, x + Math.cos(an) * (8 + e * 22), y - 18 + Math.sin(an) * (6 + e * 14), 3 * (1 - u * 0.6), an, fade);
  }
  pinwheel(ctx, x, y - 16 - e * 10, 9 * (1 - u * 0.4), u * 14, fade);
}
function noonWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  // a great clock face on the floor round her: its dial, twelve marks, two hands sweeping to noon
  ctx.save();
  ctx.globalAlpha = 0.5 + 0.4 * p;
  ell(ctx, x, y, r, r * 0.26);
  ctx.fillStyle = 'rgba(255,250,240,0.35)';
  ctx.fill();
  pen(ctx, GOLD[2], 2);
  ctx.stroke();
  for (let i = 0; i < 12; i++) {
    const an = (i / 12) * TAU - Math.PI / 2;
    const mx = x + Math.cos(an) * r * 0.86;
    const my = y + Math.sin(an) * r * 0.86 * 0.26;
    ell(ctx, mx, my, i % 3 ? 1.6 : 3, i % 3 ? 0.8 : 1.4);
    ctx.fillStyle = i === 0 ? ROSE[2] : GOLD[2];
    ctx.fill();
  }
  ctx.lineCap = 'round';
  for (const [len, w, from] of [[0.55, 3, 2.2], [0.8, 2, 4.4]]) {
    const an = -Math.PI / 2 + (1 - ease(p)) * from;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(an) * r * len, y + Math.sin(an) * r * len * 0.26);
    pen(ctx, '#5a3a2a', w);
    ctx.stroke();
  }
  ctx.restore();
}
function noonHit(ctx, z, x, y, u, e, fade, time) {
  const r = z.w / 2;
  glow(ctx, x, y - 10, r * (0.6 + e * 0.6), '#fff4c0', 0.6 * fade);
  for (let i = 0; i < 12; i++) {
    const an = (i / 12) * TAU;
    sparkle(ctx, x + Math.cos(an) * r * (0.5 + e * 0.5), y - 6 + Math.sin(an) * r * 0.26 * (0.5 + e * 0.5) - e * 10, (i % 3 ? 2 : 3.2) * (1 - u), fade, i % 3 ? '#fff4c0' : '#ffd6e0');
  }
  for (let i = 0; i < 4; i++) noteMark(ctx, x - 30 + i * 20, y - 20 - e * 40 - (i % 2) * 8, 3, Math.sin(i) * 0.3, fade, i % 2 ? ROSE[1] : TEAL[1]);
}
function melodyWarn(ctx, z, x, y, p, time) {
  const w = z.w;
  // a music box's comb laid on the strip: its tines across it, lighting as the tune comes
  ctx.save();
  ctx.globalAlpha = 0.4 + 0.5 * p;
  const g = ctx.createLinearGradient(0, y - 30, 0, y + 4);
  g.addColorStop(0, 'rgba(92,196,192,0)');
  g.addColorStop(1, 'rgba(92,196,192,0.5)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(x + 3, y - 30, w - 6, 34, 8);
  ctx.fill();
  ctx.restore();
  const n = Math.max(5, Math.floor(w / 26));
  for (let i = 0; i < n; i++) {
    const tx = x + 10 + (i / (n - 1)) * (w - 20);
    const lit = sstep(p * 1.4 - (z.dir > 0 ? i / n : 1 - i / n) * 0.4);
    const hgt = 14 + (i % 3) * 4;
    ctx.save();
    ctx.globalAlpha = 0.5 + 0.5 * p;
    ctx.beginPath();
    ctx.roundRect(tx - 2.4, y - hgt, 4.8, hgt, 2.2);
    ctx.fillStyle = lit > 0.5 ? GOLD[1] : '#e8dcc8';
    ctx.fill();
    pen(ctx, BRASS[3], 1);
    ctx.stroke();
    ctx.restore();
  }
  // its number in the tune, a note for each
  const k = z.seq ?? 1;
  noteMark(ctx, x + w / 2, y - 40 - Math.sin(time * 3 + k) * 3, 3.2, 0, 0.5 + 0.5 * p, k % 2 ? ROSE[1] : TEAL[1]);
}
function melodyHit(ctx, z, x, y, u, e, fade, time) {
  const w = z.w;
  ctx.save();
  ctx.globalAlpha = 0.5 * fade;
  ctx.fillStyle = 'rgba(255,244,192,0.6)';
  ctx.beginPath();
  ctx.roundRect(x + 3, y - 20 - e * 10, w - 6, 24 + e * 10, 8);
  ctx.fill();
  ctx.restore();
  for (let i = 0; i < 4; i++) noteMark(ctx, x + w * ((i + 0.5) / 4), y - 14 - e * 34 - (i % 2) * 6, 3, Math.sin(i + u * 4) * 0.4, fade, i % 2 ? ROSE[1] : TEAL[1]);
}
function heartPath(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.26);
  ctx.bezierCurveTo(x - s * 1.2, y - s * 0.04, x - s * 0.9, y - s * 0.34, x, y - s * 0.12);
  ctx.bezierCurveTo(x + s * 0.9, y - s * 0.34, x + s * 1.2, y - s * 0.04, x, y + s * 0.26);
  ctx.closePath();
}
function duetWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  ctx.save();
  ctx.globalAlpha = 0.55 + 0.4 * p;
  heartPath(ctx, x, y, r * 1.1);
  ctx.fillStyle = 'rgba(244,154,180,0.22)';
  ctx.fill();
  pen(ctx, ROSE[2], 1.8);
  ctx.stroke();
  ctx.restore();
  // two little notes dancing round it
  for (let i = 0; i < 2; i++) {
    const an = time * 2.4 + i * Math.PI;
    noteMark(ctx, x + Math.cos(an) * r * 0.8, y - 20 + Math.sin(an) * 8, 3.2, Math.sin(an) * 0.3, 0.6 + 0.4 * p, i ? ROSE[1] : TEAL[1]);
  }
  // a little music-box key for each guest it needs
  const n = z.need ?? 2;
  for (let i = 0; i < n; i++) {
    const kx = x - (n - 1) * 8 + i * 16;
    const ky = y - 54 - Math.sin(time * 4 + i) * 2;
    ctx.save();
    ctx.globalAlpha = 0.7 + 0.3 * p;
    ctx.beginPath();
    ctx.moveTo(kx, ky + 3);
    ctx.lineTo(kx, ky - 2);
    ctx.lineCap = 'round';
    pen(ctx, BRASS[2], 1.6);
    ctx.stroke();
    for (const sd of [-1, 1]) {
      ell(ctx, kx + sd * 2.4, ky - 3.4, 2.2, 1.6);
      ctx.fillStyle = BRASS[1];
      ctx.fill();
      pen(ctx, BRASS[3], 0.6);
      ctx.stroke();
    }
    ctx.restore();
  }
}
function duetHit(ctx, z, x, y, u, e, fade, time) {
  const r = z.w / 2;
  ctx.save();
  ctx.globalAlpha = fade;
  heartPath(ctx, x, y, r * (1.1 + e * 0.3));
  ctx.fillStyle = 'rgba(255,214,224,0.45)';
  ctx.fill();
  pen(ctx, ROSE[2], 2);
  ctx.stroke();
  ctx.restore();
  for (let i = 0; i < 6; i++) {
    const an = -Math.PI / 2 + (i - 2.5) * 0.45;
    noteMark(ctx, x + Math.cos(an) * (8 + e * 26), y - 20 + Math.sin(an) * (8 + e * 18), 3 * (1 - u * 0.3), an * 0.3, fade, i % 2 ? ROSE[1] : TEAL[1]);
  }
}
function coilAt(ctx, x, y, h, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.beginPath();
  for (let i = 0; i <= 30; i++) {
    const u = i / 30;
    const p = [x + Math.sin(u * TAU * 3.5) * 3.4, y - u * h];
    if (i) ctx.lineTo(...p);
    else ctx.moveTo(...p);
  }
  ctx.lineCap = 'round';
  pen(ctx, BRASS[3], 2.6);
  ctx.stroke();
  pen(ctx, BRASS[1], 1.4);
  ctx.stroke();
  ctx.restore();
}
function springWarn(ctx, z, x, y, p, time) {
  glow(ctx, SW / 2, 200, 220 + 100 * p, '#ffe9c8', 0.12 + 0.2 * p);
  // springs and cogs trembling up out of the floor all round the plaza
  for (let i = 0; i < 10; i++) {
    const px = (i + 0.5) * (SW / 10) + (hash(i) - 0.5) * 30;
    const h = 6 + 14 * ease(p) + Math.sin(time * 18 + i) * 1.5 * p;
    coilAt(ctx, px, y, h, 0.5 + 0.5 * p);
    if (i % 3 === 0) cog(ctx, px + 10, y - 4 - 6 * p, 4, time * 3 + i, 0.4 + 0.5 * p, 6);
  }
}
function springHit(ctx, z, x, y, u, e, fade, time) {
  for (let i = 0; i < 10; i++) {
    const px = (i + 0.5) * (SW / 10) + (hash(i) - 0.5) * 30;
    const jump = Math.sin(Math.PI * clamp(u * 1.4, 0, 1)) * (40 + hash(i * 3) * 40);
    coilAt(ctx, px, y - jump, 22 * (1 - u * 0.4), fade);
    cog(ctx, px + 8, y - jump - 30, 3.6, u * 12 + i, fade, 6);
  }
  for (let i = 0; i < 12; i++) sparkle(ctx, hash(i * 2.1) * SW, 80 + hash(i * 3.7) * 200, 2.4 * Math.sin(Math.PI * u), fade, i % 2 ? '#fff4c0' : '#ffd6e0');
}

export const GEARHEART_FX = {
  ghCogs: { warn: cogsWarn, hit: cogsHit },
  ghTap: { warn: tapWarn, hit: tapHit },
  ghNoon: { warn: noonWarn, hit: noonHit },
  ghMelody: { warn: melodyWarn, hit: melodyHit },
  ghDuet: { warn: duetWarn, hit: duetHit },
  ghSpring: { warn: springWarn, hit: springHit },
};
// How long each landing plays (s).
export const GEARHEART_HOLD = { ghCogs: 0.7, ghTap: 0.7, ghNoon: 0.8, ghMelody: 0.6, ghDuet: 0.9, ghSpring: 1.1 };
// (they draw their own floor markers: render/bossfx.js leaves out the plain one under them)
export const GEARHEART_OWN_WARN = Object.keys(GEARHEART_FX);
