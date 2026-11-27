// Leonie's cast looks (2026-11-27, her new fight, world/carnival.js): each telegraph drawn whole in her
// own big-top style (no plain floor marker under it: they are on render/bossfx.js OWN_WARN), while its
// cast winds up (`warn`, p 0..1 through the warning), and in place of the plain flash as it lands
// (`hit`, u 0..1 over its hold): her scarlet and gold, sawdust, spotlights, confetti. render/dreamfx.js
// hands each zone with one of these looks to them. Every shape rounded, outlined in a deeper shade of
// its own colour, eased.
//   lnPins      Juggling Pins (a marker on each of you: spread): three striped pins juggled in a high
//               arc over you, a scarlet ring on the sawdust; landing, the pins clatter down with stars
//   lnLeap      Flying Leap (the tank's marker): a gold bullseye on the sawdust, a falling star over
//               it closing in; landing, a starburst and a spray of sawdust
//   lnPyramid   Human Pyramid! (a stack): a spotlight beam down onto a gold ring, little gold stars
//               stacking up in it for the guests it needs; landing, a burst of confetti
//   lnCartwheel Cartwheel Run (a lane along the floor): the sawdust lit scarlet, star-shaped paw prints
//               springing up along it the way she will come; landing, sawdust whirling up in rings
//   lnSwing     The Big Swing (a ring round the trapeze, its middle safe): the swinging arcs swept
//               across the floor either side, the safe middle warm gold; landing, two great swishes
//   lnSpot      Spotlights (a patch on each of you): a cream beam from the dark falling on you,
//               brightening; landing, a white flash and sparkles
//   lnCannon    Human Cannonball (patches in a row across the ring): a striped target, a round shadow
//               growing on it as the ball comes down, its number; landing, a soft cloud and stars
//   lnOvation   Standing Ovation (everyone): roses and confetti showering down over the whole ring, a
//               warm glow gathering; landing, a burst of light, roses and confetti

import { glow, pen, sparkle, star, ell, hash, sstep, clamp, TAU } from './fx.js';

const SW = 640;
const RED = ['#ffb0a8', '#e8404e', '#b42a3c', '#7e1a2c'];
const GOLD = ['#fff4c0', '#f6c94e', '#c8902c', '#8e6418'];
const SAW = ['#fff2d8', '#f2d6a6', '#d6b07a'];
const CREAM = ['#fffdf4', '#fff2cc'];
const CONF = ['#ff7a8a', '#ffd25a', '#7ad8c4', '#a890f0', '#ff9ad0'];
const ease = (u) => 1 - (1 - clamp(u, 0, 1)) ** 3;

// A soft floor ring (flat on the sawdust): a filled ellipse with a rim in a deeper shade.
function floorRing(ctx, x, y, rx, fill, rim, al, w = 1.6) {
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
// A juggling pin: a bottle-round club, striped scarlet and cream, outlined in its own red.
function pin(ctx, x, y, s, ang, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.moveTo(0, -s * 1.3);
  ctx.bezierCurveTo(s * 0.45, -s * 1.3, s * 0.3, -s * 0.5, s * 0.6, s * 0.4);
  ctx.bezierCurveTo(s * 0.8, s * 1.2, -s * 0.8, s * 1.2, -s * 0.6, s * 0.4);
  ctx.bezierCurveTo(-s * 0.3, -s * 0.5, -s * 0.45, -s * 1.3, 0, -s * 1.3);
  ctx.closePath();
  pen(ctx, RED[3], Math.max(0.7, s * 0.2));
  ctx.stroke();
  ctx.fillStyle = CREAM[0];
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = RED[1];
  ctx.fillRect(-s, -s * 0.55, s * 2, s * 0.32);
  ctx.fillRect(-s, s * 0.35, s * 2, s * 0.32);
  ell(ctx, -s * 0.2, -s * 0.9, s * 0.14, s * 0.3, 0.2);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fill();
  ctx.restore();
  ctx.restore();
}
// A rose: a round scarlet bloom of soft petals and two little leaves.
function rose(ctx, x, y, s, ang, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(ang);
  for (const sd of [-1, 1]) {
    ell(ctx, sd * s * 0.9, s * 0.6, s * 0.55, s * 0.28, sd * 0.6);
    ctx.fillStyle = '#6cc48a';
    ctx.fill();
  }
  ell(ctx, 0, 0, s, s * 0.9);
  pen(ctx, RED[3], Math.max(0.6, s * 0.2));
  ctx.stroke();
  ctx.fillStyle = RED[1];
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.55, 0.4, Math.PI * 1.7);
  pen(ctx, RED[2], Math.max(0.5, s * 0.16));
  ctx.stroke();
  ell(ctx, -s * 0.3, -s * 0.35, s * 0.25, s * 0.18, -0.4);
  ctx.fillStyle = 'rgba(255,220,220,0.8)';
  ctx.fill();
  ctx.restore();
}
// A bit of confetti: a soft rounded paper sliver tumbling.
function confetto(ctx, x, y, s, ang, col, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(ang);
  ell(ctx, 0, 0, s, s * 0.45 * Math.abs(Math.cos(ang * 2)) + s * 0.15);
  ctx.fillStyle = col;
  ctx.fill();
  ctx.restore();
}
// A puff of sawdust: three soft rounded lumps.
function sawdust(ctx, x, y, r, al) {
  if (al <= 0.01 || r <= 0.1) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.beginPath();
  for (const [dx, dy, s] of [[0, 0, 1], [-0.9, 0.25, 0.7], [0.9, 0.2, 0.75], [0.2, -0.6, 0.65]]) {
    ctx.moveTo(x + dx * r + s * r, y + dy * r);
    ctx.arc(x + dx * r, y + dy * r, s * r, 0, TAU);
  }
  pen(ctx, SAW[2], Math.max(0.8, r * 0.18));
  ctx.stroke();
  ctx.fillStyle = SAW[0];
  ctx.fill();
  ctx.restore();
}
// A soft beam of light from the top of the ring down onto (x, y), `w` wide at the floor.
function beam(ctx, x, y, w, al) {
  if (al <= 0.01) return;
  const g = ctx.createLinearGradient(0, 0, 0, y);
  g.addColorStop(0, 'rgba(255,250,225,0)');
  g.addColorStop(0.5, `rgba(255,248,215,${(0.16 * al).toFixed(3)})`);
  g.addColorStop(1, `rgba(255,244,200,${(0.38 * al).toFixed(3)})`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x - w * 0.18, 0);
  ctx.lineTo(x + w * 0.18, 0);
  ctx.lineTo(x + w * 0.5, y);
  ctx.lineTo(x - w * 0.5, y);
  ctx.closePath();
  ctx.fill();
}
// A star-shaped paw print: a soft rounded star, a dot in its heart.
function pawStar(ctx, x, y, s, al) {
  if (al <= 0.01) return;
  star(ctx, x, y, s, 0, al);
}

// ---------- The looks ----------
function pinsWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r, 'rgba(232,64,78,0.16)', RED[2], 0.5 + 0.5 * p);
  // three pins juggled in a cascade over the marked one, coming lower as it lands
  const h = 70 - 30 * ease(p);
  for (let k = 0; k < 3; k++) {
    const ph = (time * 1.6 + k / 3) % 1;
    const px = x + Math.cos(ph * TAU) * 14;
    const py = y - 40 - h * Math.sin(Math.PI * ph);
    pin(ctx, px, py, 3.4, ph * TAU * 2 + k, 0.6 + 0.4 * p);
  }
  if (p > 0.6) sparkle(ctx, x, y - 6, 2.4 * sstep((p - 0.6) / 0.4), 0.8, '#fff6c8');
}
function pinsHit(ctx, z, x, y, u, e, fade, time) {
  for (let k = 0; k < 3; k++) {
    const sd = k - 1;
    const v = clamp(u * 1.4, 0, 1);
    pin(ctx, x + sd * (6 + e * 14), y - 8 - Math.sin(Math.PI * v) * 16, 3.4, sd * 2 + u * 9, fade);
  }
  for (let i = 0; i < 5; i++) {
    const an = -Math.PI / 2 + (i - 2) * 0.55;
    star(ctx, x + Math.cos(an) * (6 + e * 16), y - 10 + Math.sin(an) * (6 + e * 12), 2.6 * (1 - u * 0.6), an, fade);
  }
}
function leapWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  for (let k = 0; k < 3; k++) floorRing(ctx, x, y, r * (1 - k * 0.3), k % 2 ? 'rgba(255,244,192,0.3)' : 'rgba(232,64,78,0.22)', k % 2 ? GOLD[2] : RED[2], 0.5 + 0.5 * p, 1.4);
  // a falling star over the target, closing in
  const yy = y - 110 + 80 * ease(p);
  glow(ctx, x, yy, 16, '#fff2b0', 0.5 * p);
  star(ctx, x, yy, 5 + 2 * Math.sin(time * 10), time * 3, 0.7 + 0.3 * p);
  ctx.save();
  ctx.globalAlpha = 0.5 * p;
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.moveTo(x, yy + 6);
  ctx.lineTo(x, y - 4);
  pen(ctx, GOLD[2], 1);
  ctx.stroke();
  ctx.restore();
}
function leapHit(ctx, z, x, y, u, e, fade, time) {
  glow(ctx, x, y - 14, 30 + e * 20, '#fff2b0', 0.6 * fade);
  for (let i = 0; i < 7; i++) {
    const an = -Math.PI + (i / 6) * Math.PI;
    star(ctx, x + Math.cos(an) * (8 + e * 26), y - 10 + Math.sin(an) * (6 + e * 20), 3 * (1 - u * 0.5), an, fade);
  }
  sawdust(ctx, x - 14 - e * 10, y - 2, 4 + e * 4, fade);
  sawdust(ctx, x + 14 + e * 10, y - 2, 4 + e * 4, fade);
}
function pyramidWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  beam(ctx, x, y, r * 2.2, 0.6 + 0.4 * p);
  floorRing(ctx, x, y, r, 'rgba(255,244,192,0.38)', GOLD[2], 0.7 + 0.3 * p, 2);
  // a little gold star for each guest it needs, stacking up a pyramid in the light
  const need = z.need ?? 2;
  let k = 0;
  for (let row = 0; k < need; row++) {
    for (let c = 0; c <= row && k < need; c++, k++) {
      const sx = x + (c - row / 2) * 9;
      const sy = y - 66 + (2 - row) * 9;
      star(ctx, sx, sy, 3.6 * sstep(p * 2 - k * 0.2), time + k, 0.95);
    }
  }
}
function pyramidHit(ctx, z, x, y, u, e, fade, time) {
  glow(ctx, x, y - 30, 40, '#fff4cc', 0.5 * fade);
  for (let i = 0; i < 18; i++) {
    const an = -Math.PI / 2 + (hash(i) - 0.5) * 2.6;
    const d = e * (24 + hash(i * 3.3) * 30);
    confetto(ctx, x + Math.cos(an) * d, y - 30 + Math.sin(an) * d + u * u * 20, 2.2, i + u * 8, CONF[i % 5], fade);
  }
}
function cartWarn(ctx, z, x, y, p, time) {
  const w = z.w;
  ctx.save();
  ctx.globalAlpha = 0.45 + 0.4 * p;
  const g = ctx.createLinearGradient(0, y - 40, 0, y + 4);
  g.addColorStop(0, 'rgba(232,64,78,0)');
  g.addColorStop(1, 'rgba(232,64,78,0.34)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(x + 2, y - 40, w - 4, 44, 8);
  ctx.fill();
  ell(ctx, x + w / 2, y, w / 2 - 2, 6);
  ctx.fillStyle = 'rgba(242,214,166,0.5)';
  ctx.fill();
  pen(ctx, RED[2], 1.6);
  ctx.stroke();
  ctx.restore();
  // star prints springing up along it the way she'll come (z.dir), in turn
  const n = Math.max(3, Math.floor(w / 46));
  for (let i = 0; i < n; i++) {
    const k = z.dir < 0 ? n - 1 - i : i;
    const sx = x + 20 + (k / (n - 1)) * (w - 40);
    const on = sstep(p * 1.6 - i / n);
    pawStar(ctx, sx, y - 4 - (i % 2) * 6, 4.4 * on, 0.85 * on);
  }
}
function cartHit(ctx, z, x, y, u, e, fade, time) {
  const w = z.w;
  const n = Math.max(3, Math.floor(w / 60));
  for (let i = 0; i < n; i++) {
    const sx = x + 20 + (i / Math.max(1, n - 1)) * (w - 40);
    sawdust(ctx, sx, y - 4 - e * 10, 3.6 + e * 4, fade);
    ctx.save();
    ctx.globalAlpha *= fade;
    ctx.beginPath();
    ctx.ellipse(sx, y - 10 - e * 8, 8 + e * 10, 3 + e * 2, 0, 0, TAU);
    pen(ctx, SAW[2], 1.4);
    ctx.stroke();
    ctx.restore();
  }
}
function swingWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  const inner = z.inner ?? 60;
  floorRing(ctx, x, y, r, 'rgba(232,64,78,0.12)', RED[2], 0.5 + 0.4 * p);
  floorRing(ctx, x, y, inner, 'rgba(255,236,170,0.55)', GOLD[2], 0.8 + 0.2 * p, 2);
  // the swing's arcs sweeping either side, the path she'll cut through the air
  for (const sd of [-1, 1]) {
    for (let k = 0; k < 3; k++) {
      const ph = (time * 0.9 + k / 3) % 1;
      const cx = x + sd * (inner + (r - inner) * (0.25 + 0.6 * ph));
      ctx.save();
      ctx.globalAlpha = (0.3 + 0.5 * p) * Math.sin(Math.PI * ph);
      ctx.beginPath();
      ctx.ellipse(cx, y - 30, 26, 22, 0, sd > 0 ? -0.2 : Math.PI - 1.2, sd > 0 ? 1.2 : Math.PI + 0.2);
      pen(ctx, RED[1], 3);
      ctx.stroke();
      pen(ctx, CREAM[0], 1.2);
      ctx.stroke();
      ctx.restore();
    }
  }
  star(ctx, x, y - 20, 3 + 1.2 * Math.sin(time * 6), 0, 0.6 + 0.4 * p);
}
function swingHit(ctx, z, x, y, u, e, fade, time) {
  const r = z.w / 2;
  for (const sd of [-1, 1]) {
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.beginPath();
    ctx.ellipse(x + sd * r * (0.4 + e * 0.3), y - 30, r * 0.5, 34, 0, sd > 0 ? -1.2 : Math.PI - 0.6, sd > 0 ? 0.6 : Math.PI + 1.2);
    pen(ctx, RED[2], 7 * (1 - u * 0.5));
    ctx.stroke();
    pen(ctx, CREAM[0], 3 * (1 - u * 0.5));
    ctx.stroke();
    ctx.restore();
    for (let i = 0; i < 4; i++) sparkle(ctx, x + sd * (60 + i * 40 + e * 20), y - 20 - i * 6, 2.4 * (1 - u), fade, '#fff6c8');
  }
}
function spotWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  beam(ctx, x, y, r * 2, 0.5 + 0.5 * p);
  floorRing(ctx, x, y, r, `rgba(255,246,210,${(0.3 + 0.35 * p).toFixed(3)})`, GOLD[1], 0.8, 1.4);
  for (let i = 0; i < 4; i++) {
    const v = (time * 0.5 + i / 4) % 1;
    sparkle(ctx, x + (hash(i + z.x) - 0.5) * r * 1.4, y - 70 + v * 64, 1.4 * Math.sin(Math.PI * v), 0.8, '#fffbe6');
  }
}
function spotHit(ctx, z, x, y, u, e, fade, time) {
  const r = z.w / 2;
  glow(ctx, x, y - 20, r * 1.6, '#ffffff', 0.8 * fade);
  beam(ctx, x, y, r * 2.4, fade * 1.4);
  for (let i = 0; i < 6; i++) {
    const an = (i / 6) * TAU + e;
    sparkle(ctx, x + Math.cos(an) * (r * 0.5 + e * 20), y - 20 + Math.sin(an) * (10 + e * 10), 2.6 * (1 - u), fade, '#fff6c8');
  }
}
function cannonWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  // a striped target, a round shadow growing on it as the ball comes down, its number
  for (let k = 0; k < 4; k++) floorRing(ctx, x, y, r * (1 - k * 0.22), k % 2 ? 'rgba(255,253,244,0.6)' : 'rgba(232,64,78,0.4)', k % 2 ? GOLD[2] : RED[2], 0.7, 1.2);
  const s = 0.2 + 0.8 * ease(p);
  ell(ctx, x, y, r * 0.5 * s, r * 0.13 * s);
  ctx.fillStyle = `rgba(80,30,40,${(0.35 * s).toFixed(3)})`;
  ctx.fill();
  const n = z.seq ?? 1;
  ctx.save();
  ctx.font = '900 13px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  ctx.lineWidth = 4;
  ctx.strokeStyle = CREAM[0];
  ctx.strokeText(String(n), x, y - 24);
  ctx.fillStyle = RED[2];
  ctx.fillText(String(n), x, y - 24);
  ctx.restore();
}
function cannonHit(ctx, z, x, y, u, e, fade, time) {
  for (let i = 0; i < 5; i++) {
    const an = -Math.PI + (i / 4) * Math.PI;
    sawdust(ctx, x + Math.cos(an) * (6 + e * 22), y - 6 + Math.sin(an) * (4 + e * 16), 5 + e * 4, fade);
  }
  for (let i = 0; i < 5; i++) star(ctx, x + (i - 2) * 9 * (0.6 + e), y - 18 - Math.sin(Math.PI * clamp(e + i * 0.05, 0, 1)) * 20, 2.6 * (1 - u * 0.5), i, fade);
}
function ovationWarn(ctx, z, x, y, p, time) {
  glow(ctx, SW / 2, 180, 200 + 100 * p, '#ffe2c0', 0.15 + 0.25 * p);
  for (let i = 0; i < 30; i++) {
    const v = (time * (0.2 + hash(i) * 0.12) + hash(i * 4.7)) % 1;
    const px = hash(i * 2.3) * SW + Math.sin(v * 6 + i) * 12;
    const py = -10 + v * 330;
    const al = Math.sin(Math.PI * v) * (0.4 + 0.6 * p);
    if (i % 5 === 0) rose(ctx, px, py, 3.4, v * 6 + i, al);
    else confetto(ctx, px, py, 2.4, v * 10 + i, CONF[i % 5], al);
  }
}
function ovationHit(ctx, z, x, y, u, e, fade, time) {
  ctx.save();
  ctx.globalAlpha = 0.26 * fade * Math.max(0, 1 - u * 1.5);
  ctx.fillStyle = '#fff4e0';
  ctx.fillRect(0, 0, SW, 360);
  ctx.restore();
  for (let i = 0; i < 24; i++) {
    const px = hash(i * 1.9) * SW;
    const py = 120 + hash(i * 3.1) * 200 - e * 40;
    if (i % 4 === 0) rose(ctx, px, py, 3.8, i + u * 4, fade);
    else confetto(ctx, px, py, 2.6, i + u * 12, CONF[i % 5], fade);
  }
}

export const LEONIE_FX = {
  lnPins: { warn: pinsWarn, hit: pinsHit },
  lnLeap: { warn: leapWarn, hit: leapHit },
  lnPyramid: { warn: pyramidWarn, hit: pyramidHit },
  lnCartwheel: { warn: cartWarn, hit: cartHit },
  lnSwing: { warn: swingWarn, hit: swingHit },
  lnSpot: { warn: spotWarn, hit: spotHit },
  lnCannon: { warn: cannonWarn, hit: cannonHit },
  lnOvation: { warn: ovationWarn, hit: ovationHit },
};
// How long each landing plays (s).
export const LEONIE_HOLD = { lnPins: 0.7, lnLeap: 0.7, lnPyramid: 0.9, lnCartwheel: 0.8, lnSwing: 0.8, lnSpot: 0.6, lnCannon: 0.8, lnOvation: 1.1 };
// (they draw their own floor markers: render/bossfx.js leaves out the plain one under them)
export const LEONIE_OWN_WARN = Object.keys(LEONIE_FX);
