// Madame Marionette's cast looks (2026-11-27, her new fight, world/carnival.js): each telegraph drawn whole
// in her own workshop style (no plain floor marker under it: they are on render/bossfx.js OWN_WARN), while
// its cast winds up (`warn`, p 0..1 through the warning), and in place of the plain flash as it lands
// (`hit`, u 0..1 over its hold): gold thread, little wooden crosses, mint ribbon, her gold scissors,
// harlequin diamonds, a velvet curtain. render/dreamfx.js hands each zone with one of these looks to
// them. Every shape rounded, outlined in a deeper shade of its own colour, eased.
//   mmStrings  Strings Attached (a marker on each of you: spread): a little wooden cross lowered over
//              you on gold threads, a lilac diamond on the floor; landing, the threads snap taut and
//              the cross jerks up, sparkles
//   mmRap      Crossbar Rap (the tank's marker): two crosses raised high over the tank, crossed, coming
//              down; a gold diamond on the floor; landing, a clack, stars and a ring of diamonds
//   mmSnip     Snip Snip! (a patch round her: get out): her great gold scissors open along the floor
//              round her, a dotted cutting line round its edge; landing, the blades snap shut and
//              snipped scraps of harlequin cloth fly
//   mmBow      Tie a Bow (a stack): a mint ribbon looping round the marked one, a spool of thread for
//              each guest it needs; landing, the ribbon pulled into a big bow, sparkles
//   mmRope     Jump Rope! / Double Dutch! (the whole floor, in turn): a gold rope strung across the room,
//              swinging lower and lower, a bright line where it'll slap; landing, it slaps the floor in
//              a flash of thread and dust
//   mmTug      Tug of War (one side of the floor, then the other): taut gold threads stretched across
//              that side toward her, the floor tinted lilac; landing, the threads yank in with a swish
//   mmCurtain  Curtain Call (everyone): a plum velvet curtain with gold fringe drawing in from both
//              sides of the room; landing, it swishes shut a moment, then sweeps open with sparkles

import { glow, pen, sparkle, star, ell, hash, sstep, clamp, TAU } from './fx.js';

const SW = 640;
const LILAC = ['#f2e8ff', '#c9b0f0', '#a088d6', '#7a64b0'];
const MINT = ['#e2fbf2', '#9fe4cc', '#6cc4a8', '#4a9a82'];
const GOLD = ['#fff4c0', '#f4c860', '#c49234', '#94681c'];
const PLUM = ['#c8a2e2', '#8a5cb0', '#64408a', '#43285e'];
const WOOD = ['#f2d8b4', '#d8ac7c', '#a87a52', '#7a5434'];
const CREAM = '#fdf6ee';
const THREAD = '#fff2c4';
const ease = (u) => 1 - (1 - clamp(u, 0, 1)) ** 3;

// A soft diamond flat on the floor: a filled rounded diamond with a rim in a deeper shade.
function floorDiamond(ctx, x, y, rx, fill, rim, al, w = 1.4) {
  if (al <= 0.01) return;
  const ry = rx * 0.28;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.beginPath();
  ctx.moveTo(x, y - ry);
  ctx.quadraticCurveTo(x + rx * 0.12, y - ry * 0.12, x + rx, y);
  ctx.quadraticCurveTo(x + rx * 0.12, y + ry * 0.12, x, y + ry);
  ctx.quadraticCurveTo(x - rx * 0.12, y + ry * 0.12, x - rx, y);
  ctx.quadraticCurveTo(x - rx * 0.12, y - ry * 0.12, x, y - ry);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  pen(ctx, rim, w);
  ctx.stroke();
  ctx.restore();
}
function floorRing(ctx, x, y, rx, fill, rim, al, w = 1.4) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, rx, rx * 0.26);
  ctx.fillStyle = fill;
  ctx.fill();
  pen(ctx, rim, w);
  ctx.stroke();
  ctx.restore();
}
// A little wooden puppet cross: a long bar and a short one, gold caps.
function cross(ctx, x, y, s, ang, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.lineCap = 'round';
  for (const [x0, y0, x1, y1, w] of [[-s, 0, s, 0, s * 0.22], [0, -s * 0.45, 0, s * 0.45, s * 0.2], [-s * 0.5, s * 0.3, s * 0.5, s * 0.3, s * 0.16]]) {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    pen(ctx, WOOD[3], w + 1);
    ctx.stroke();
    pen(ctx, WOOD[1], w);
    ctx.stroke();
  }
  for (const [cx, cy] of [[-s, 0], [s, 0], [0, s * 0.45]]) {
    ell(ctx, cx, cy, s * 0.13, s * 0.13);
    ctx.fillStyle = GOLD[1];
    ctx.fill();
  }
  ctx.restore();
}
function thread(ctx, x0, y0, x1, y1, sag, al = 1, w = 0.8) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + sag, x1, y1);
  pen(ctx, '#c8a878', w + 0.6);
  ctx.stroke();
  pen(ctx, THREAD, w);
  ctx.stroke();
  ctx.restore();
}
// A scrap of harlequin cloth: a small rounded diamond tumbling.
function scrap(ctx, x, y, s, ang, col, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.quadraticCurveTo(s * 0.15, -s * 0.15, s * 0.7, 0);
  ctx.quadraticCurveTo(s * 0.15, s * 0.15, 0, s);
  ctx.quadraticCurveTo(-s * 0.15, s * 0.15, -s * 0.7, 0);
  ctx.quadraticCurveTo(-s * 0.15, -s * 0.15, 0, -s);
  ctx.fillStyle = col;
  ctx.fill();
  ctx.restore();
}
const SCRAPS = [MINT[1], LILAC[1], CREAM, GOLD[1]];
// A spool of thread: two gold rims and a wound middle.
function spool(ctx, x, y, s, col, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.beginPath();
  ctx.roundRect(x - s * 0.55, y - s * 0.7, s * 1.1, s * 1.4, s * 0.3);
  ctx.fillStyle = col;
  ctx.fill();
  for (const dy of [-0.8, 0.8]) {
    ell(ctx, x, y + dy * s, s * 0.85, s * 0.26);
    ctx.fillStyle = GOLD[1];
    ctx.fill();
    pen(ctx, GOLD[3], 0.6);
    ctx.stroke();
  }
  ctx.restore();
}

// ---------- The looks ----------
function stringsWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorDiamond(ctx, x, y, r, 'rgba(201,176,240,0.22)', LILAC[3], 0.5 + 0.5 * p);
  // a little cross lowered on gold threads over the marked one, swaying
  const cy = y - 120 + 50 * ease(p);
  const sw = Math.sin(time * 3 + z.x) * 0.12;
  thread(ctx, x, -10, x + sw * 20, cy - 6, 0, 0.6, 0.6);
  cross(ctx, x + sw * 20, cy, 9, sw, 0.85);
  for (const dx of [-9, 0, 9]) thread(ctx, x + sw * 20 + dx, cy + (dx ? 0 : 4), x + dx * 0.6, y - 14 - (1 - p) * 20, 3, 0.4 + 0.5 * p, 0.6);
  if (p > 0.6) sparkle(ctx, x, y - 6, 2.4 * sstep((p - 0.6) / 0.4), 0.8, '#f6efff');
}
function stringsHit(ctx, z, x, y, u, e, fade, time) {
  const r = z.w / 2;
  floorDiamond(ctx, x, y, r * (1 + e * 0.4), 'rgba(242,232,255,0.5)', LILAC[2], fade);
  cross(ctx, x, y - 70 - e * 40, 9, Math.sin(u * 20) * 0.2 * (1 - u), fade);
  for (const dx of [-9, 0, 9]) thread(ctx, x + dx, y - 70 - e * 40, x + dx * 0.6, y - 10, 0, fade, 0.7);
  for (let i = 0; i < 5; i++) {
    const an = -Math.PI / 2 + (i - 2) * 0.5;
    sparkle(ctx, x + Math.cos(an) * (6 + e * 16), y - 10 + Math.sin(an) * (6 + e * 12), 2.2 * (1 - u * 0.6), fade, i % 2 ? '#e2fbf2' : '#f2e8ff');
  }
}
function rapWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  for (let k = 0; k < 3; k++) floorDiamond(ctx, x, y, r * (1 - k * 0.3), k % 2 ? 'rgba(255,244,192,0.32)' : 'rgba(160,136,214,0.22)', k % 2 ? GOLD[2] : LILAC[3], 0.5 + 0.5 * p, 1.2);
  // two crosses raised high over the tank, crossed, coming down
  const yy = y - 120 + 70 * ease(p);
  const op = 0.5 * (1 - p);
  glow(ctx, x, yy, 16, '#f6efff', 0.4 * p);
  cross(ctx, x - 6, yy, 12, -0.6 - op, 0.75 + 0.25 * p);
  cross(ctx, x + 6, yy, 12, 0.6 + op, 0.75 + 0.25 * p);
}
function rapHit(ctx, z, x, y, u, e, fade, time) {
  const r = z.w / 2;
  floorDiamond(ctx, x, y, r * (0.6 + e * 0.9), 'rgba(255,244,192,0.4)', GOLD[2], fade, 2);
  cross(ctx, x - 6 - e * 10, y - 22, 12, -0.3 - e, fade);
  cross(ctx, x + 6 + e * 10, y - 22, 12, 0.3 + e, fade);
  for (let i = 0; i < 6; i++) {
    const an = -Math.PI / 2 + (i - 2.5) * 0.5;
    star(ctx, x + Math.cos(an) * (8 + e * 22), y - 18 + Math.sin(an) * (6 + e * 14), 3 * (1 - u * 0.6), an, fade);
  }
}
function snipWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r, `rgba(201,176,240,${(0.14 + 0.18 * p).toFixed(3)})`, LILAC[3], 0.8, 1.2);
  // the dotted cutting line round its edge
  ctx.save();
  ctx.setLineDash([5, 4]);
  ctx.lineDashOffset = -time * 20;
  ell(ctx, x, y, r * 0.96, r * 0.25);
  pen(ctx, GOLD[2], 1.1);
  ctx.stroke();
  ctx.restore();
  // her great gold scissors open along the floor, one blade either side of her
  const open = 0.5 + 0.35 * Math.sin(time * 5) * (1 - p) + 0.25 * p;
  for (const sd of [-1, 1]) {
    ctx.save();
    ctx.translate(x, y - 4);
    ctx.scale(sd, 1);
    ctx.rotate(-open * 0.3);
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.quadraticCurveTo(r * 0.55, -6, r * 0.98, -1);
    ctx.quadraticCurveTo(r * 0.55, 2, 8, 2.4);
    ctx.closePath();
    ctx.globalAlpha = 0.55 + 0.35 * p;
    ctx.fillStyle = '#f4f0f8';
    ctx.fill();
    pen(ctx, '#9a8aa8', 1.1);
    ctx.stroke();
    ctx.restore();
  }
  ell(ctx, x, y - 4, 4, 3);
  ctx.fillStyle = GOLD[1];
  ctx.fill();
  pen(ctx, GOLD[3], 0.8);
  ctx.stroke();
}
function snipHit(ctx, z, x, y, u, e, fade, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r, 'rgba(242,232,255,0.4)', LILAC[2], fade * (1 - u), 2);
  for (let i = 0; i < 16; i++) {
    const an = (i / 16) * TAU + hash(i) * 0.3;
    const d = r * (0.3 + 0.7 * e) * (0.6 + hash(i * 3) * 0.5);
    scrap(ctx, x + Math.cos(an) * d, y - 8 - Math.abs(Math.sin(an)) * 30 * Math.sin(Math.PI * clamp(u * 1.3, 0, 1)) + e * 10, 3.2 * (1 - u * 0.4), an + u * 8, SCRAPS[i % 4], fade);
  }
}
function bowWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r, 'rgba(159,228,204,0.25)', MINT[3], 0.6 + 0.4 * p, 1.6);
  // a mint ribbon looping round the marked one, round and round
  for (let i = 0; i < 2; i++) {
    ctx.save();
    ctx.globalAlpha = 0.5 + 0.4 * p;
    ctx.beginPath();
    ctx.ellipse(x, y - 24 - i * 6, r * (0.7 - i * 0.1), 10 + i * 3, Math.sin(time * 2 + i) * 0.15, 0, TAU);
    pen(ctx, i ? MINT[2] : MINT[1], 2.2 - i * 0.6);
    ctx.stroke();
    ctx.restore();
  }
  // a spool for each guest it needs
  const n = z.need ?? 2;
  for (let i = 0; i < n; i++) spool(ctx, x - (n - 1) * 7 + i * 14, y - 58 - Math.sin(time * 4 + i) * 2, 4, i % 2 ? LILAC[1] : MINT[1], 0.7 + 0.3 * p);
}
function bowHit(ctx, z, x, y, u, e, fade, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r * (1 + e * 0.3), 'rgba(226,251,242,0.5)', MINT[2], fade, 2);
  // the ribbon pulled into a big bow over them
  const by = y - 46;
  for (const sd of [-1, 1]) {
    ctx.save();
    ctx.globalAlpha = fade;
    ell(ctx, x + sd * 9, by, 9 * (0.6 + 0.4 * e), 5.6, sd * 0.3);
    ctx.fillStyle = MINT[1];
    ctx.fill();
    pen(ctx, MINT[3], 1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + sd * 2, by + 2);
    ctx.quadraticCurveTo(x + sd * 6, by + 12, x + sd * 9, by + 18 * e);
    pen(ctx, MINT[2], 2.4);
    ctx.stroke();
    ctx.restore();
  }
  ell(ctx, x, by, 3.4, 3.2);
  ctx.globalAlpha = fade;
  ctx.fillStyle = MINT[2];
  ctx.fill();
  ctx.globalAlpha = 1;
  for (let i = 0; i < 6; i++) sparkle(ctx, x + Math.cos(i) * (10 + e * 20), by + Math.sin(i * 1.7) * (8 + e * 10), 2.4 * (1 - u), fade, '#e2fbf2');
}
function ropeWarn(ctx, z, x, y, p, time) {
  // a gold rope strung across the room, swinging lower and lower toward the floor
  const n = z.seq ?? 1;
  const sag = 20 + 120 * (1 - ease(p));
  const sway = Math.sin(time * 6 + n) * 6 * (1 - p);
  const y0 = y - 150;
  ctx.save();
  ctx.globalAlpha = 0.35 + 0.55 * p;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-10, y0);
  ctx.quadraticCurveTo(SW / 2 + sway, y0 + sag * 2 + (y - y0 - 6) * ease(p), SW + 10, y0);
  pen(ctx, '#c8a878', 3);
  ctx.stroke();
  pen(ctx, THREAD, 1.8);
  ctx.stroke();
  ctx.restore();
  // a bright line along the floor where it'll slap, filling in
  ctx.save();
  ctx.globalAlpha = 0.3 + 0.6 * p;
  const g = ctx.createLinearGradient(0, y - 12, 0, y + 4);
  g.addColorStop(0, 'rgba(255,242,196,0)');
  g.addColorStop(1, 'rgba(255,242,196,0.7)');
  ctx.fillStyle = g;
  ctx.fillRect(0, y - 12, SW, 16);
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(SW * p, y);
  pen(ctx, GOLD[2], 1.6);
  ctx.stroke();
  ctx.restore();
  // its count, a little thread knot per swing still to come
  for (let i = 0; i < n; i++) {
    const kx = SW / 2 - (n - 1) * 8 + i * 16;
    ell(ctx, kx, y - 30, 3, 3);
    ctx.fillStyle = i === n - 1 ? GOLD[1] : 'rgba(255,244,192,0.5)';
    ctx.fill();
    pen(ctx, GOLD[3], 0.8);
    ctx.stroke();
  }
}
function ropeHit(ctx, z, x, y, u, e, fade, time) {
  ctx.save();
  ctx.globalAlpha = fade;
  ctx.beginPath();
  ctx.moveTo(-10, y - 2 - e * 4);
  ctx.quadraticCurveTo(SW / 2, y + 2 - e * 30, SW + 10, y - 2 - e * 4);
  pen(ctx, THREAD, 2.4 * (1 - u * 0.5));
  ctx.stroke();
  ctx.restore();
  for (let i = 0; i < 10; i++) {
    const px = (i + 0.5) * (SW / 10);
    ell(ctx, px, y - 3 - e * 6, 6 * (0.6 + e), 3 * (0.6 + e));
    ctx.fillStyle = `rgba(242,232,255,${(0.6 * fade).toFixed(3)})`;
    ctx.fill();
  }
}
function tugWarn(ctx, z, x, y, p, time) {
  const w = z.w;
  const first = (z.seq ?? 1) === 1;
  ctx.save();
  ctx.globalAlpha = (first ? 0.5 : 0.3) + 0.4 * p;
  const g = ctx.createLinearGradient(0, y - 46, 0, y + 4);
  g.addColorStop(0, 'rgba(160,136,214,0)');
  g.addColorStop(1, `rgba(160,136,214,${first ? 0.4 : 0.25})`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(x + 2, y - 46, w - 4, 50, 8);
  ctx.fill();
  ell(ctx, x + w / 2, y, w / 2 - 2, 6);
  ctx.fillStyle = 'rgba(242,232,255,0.4)';
  ctx.fill();
  pen(ctx, LILAC[3], 1.4);
  ctx.stroke();
  ctx.restore();
  // taut gold threads stretched across it toward her (she stands at its inner end)
  const inner = z.dir > 0 ? x : x + w;
  for (let k = 0; k < 4; k++) {
    const yy = y - 8 - k * 9;
    const tight = ease(p);
    thread(ctx, inner, yy - 6, z.dir > 0 ? x + w : x, yy + Math.sin(time * 4 + k) * 2 * (1 - tight), 6 * (1 - tight), 0.4 + 0.5 * p, 0.7);
  }
  // pull chevrons running along the threads toward her
  for (let i = 0; i < 4; i++) {
    const v = (time * 0.8 + i / 4) % 1;
    const cx = z.dir > 0 ? x + w * (1 - v) : x + w * v;
    ctx.save();
    ctx.globalAlpha = Math.sin(Math.PI * v) * (0.3 + 0.5 * p);
    ctx.beginPath();
    ctx.moveTo(cx + z.dir * 5, y - 26);
    ctx.quadraticCurveTo(cx, y - 22, cx + z.dir * 5, y - 18);
    ctx.lineCap = 'round';
    pen(ctx, GOLD[1], 2);
    ctx.stroke();
    ctx.restore();
  }
}
function tugHit(ctx, z, x, y, u, e, fade, time) {
  const w = z.w;
  const inner = z.dir > 0 ? x : x + w;
  for (let k = 0; k < 4; k++) {
    const far = z.dir > 0 ? x + w * (1 - e) : x + w * e;
    thread(ctx, inner, y - 14 - k * 9, far, y - 10 - k * 9, 0, fade, 0.9);
  }
  for (let i = 0; i < 8; i++) {
    const px = x + w * ((i + 0.5) / 8);
    scrap(ctx, px - z.dir * e * 30, y - 10 - hash(i) * 30, 3, i + u * 6, SCRAPS[i % 4], fade);
  }
}
// The plum velvet curtain, drawn in `reach` from both sides of the room, folds and a gold fringe at its edge.
function curtains(ctx, reach, al, time) {
  for (const sd of [-1, 1]) {
    const edge = sd < 0 ? reach : SW - reach;
    ctx.save();
    ctx.globalAlpha = al;
    ctx.beginPath();
    ctx.moveTo(sd < 0 ? -10 : SW + 10, -10);
    ctx.lineTo(edge, -10);
    for (let i = 0; i <= 8; i++) {
      const yy = (i / 8) * 360;
      ctx.lineTo(edge + Math.sin(yy * 0.05 + time * 2) * 4 - sd * (i % 2) * 3, yy);
    }
    ctx.lineTo(sd < 0 ? -10 : SW + 10, 370);
    ctx.closePath();
    const g = ctx.createLinearGradient(sd < 0 ? 0 : SW, 0, edge, 0);
    g.addColorStop(0, PLUM[3]);
    g.addColorStop(1, PLUM[1]);
    ctx.fillStyle = g;
    ctx.fill();
    pen(ctx, PLUM[3], 1.4);
    ctx.stroke();
    // its folds and the gold fringe down its edge
    for (let f = 1; f < 4; f++) {
      const fx = sd < 0 ? (edge * f) / 4 : SW - ((SW - edge) * f) / 4;
      ctx.beginPath();
      ctx.moveTo(fx, -10);
      ctx.lineTo(fx + Math.sin(time + f) * 3, 360);
      pen(ctx, 'rgba(200,162,226,0.35)', 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(edge, -10);
    ctx.lineTo(edge, 360);
    ctx.setLineDash([2, 3]);
    pen(ctx, GOLD[1], 2.2);
    ctx.stroke();
    ctx.restore();
  }
}
function curtainWarn(ctx, z, x, y, p, time) {
  // the curtain drawing in from both sides of the room as the cast goes on
  curtains(ctx, SW * 0.12 + SW * 0.3 * ease(p), 0.55 + 0.3 * p, time);
}
function curtainHit(ctx, z, x, y, u, e, fade, time) {
  // swished shut for a moment, then swept open again with sparkles
  const shut = Math.sin(Math.PI * clamp(u * 1.4, 0, 1));
  curtains(ctx, SW * 0.42 + SW * 0.08 * shut - SW * 0.3 * clamp((u - 0.5) * 2, 0, 1), 0.85 * fade, time);
  for (let i = 0; i < 14; i++) sparkle(ctx, hash(i * 2.1) * SW, 60 + hash(i * 3.7) * 240, 2.6 * Math.sin(Math.PI * u), fade, i % 2 ? '#fff4c0' : '#f2e8ff');
}

export const MADAME_FX = {
  mmStrings: { warn: stringsWarn, hit: stringsHit },
  mmRap: { warn: rapWarn, hit: rapHit },
  mmSnip: { warn: snipWarn, hit: snipHit },
  mmBow: { warn: bowWarn, hit: bowHit },
  mmRope: { warn: ropeWarn, hit: ropeHit },
  mmTug: { warn: tugWarn, hit: tugHit },
  mmCurtain: { warn: curtainWarn, hit: curtainHit },
};
// How long each landing plays (s).
export const MADAME_HOLD = { mmStrings: 0.7, mmRap: 0.7, mmSnip: 0.7, mmBow: 0.9, mmRope: 0.6, mmTug: 0.8, mmCurtain: 1.1 };
// (they draw their own floor markers: render/bossfx.js leaves out the plain one under them)
export const MADAME_OWN_WARN = Object.keys(MADAME_FX);
