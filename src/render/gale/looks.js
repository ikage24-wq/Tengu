// Captain Gale's cast looks (2026-11-27, her new fight, world/skywhale.js): each telegraph drawn whole in her
// own windy style (no plain floor marker under it: they are on render/bossfx.js OWN_WARN), while its cast winds
// up (`warn`, p 0..1 through the warning), and in place of the plain flash as it lands (`hit`, u 0..1 over its
// hold): soft white-blue wind swooshes with round ends, round cloud puffs, rope, sailcloth and gold sparkles
// (soft four-point stars, never specks). render/dreamfx.js hands each zone with one of these looks to them.
// Every shape rounded, outlined in a deeper shade of its own colour, eased; raid-wide moments a soft sky tint,
// never a strong white flash.
//   glBlank   Point Blank Puff (the tank's marker): a ring of wind curling in round the tank, tighter and
//             faster; landing, a big round cloud burst and "FWOOMP!"
//   glVolley  Cloudball Volley (a marker on each of you: spread): a cloudball's shadow growing under each of
//             you, the ball dropping from the rigging above; landing, a soft cloud burst
//   glHaul    All Hands Haul! (a stack): a rope dropping from the rigging to the marker, a knot glowing for
//             each guest it needs; landing, the rope yanks up, sparkles and "HEAVE!"
//   glDown    Downdraft (round her: get out): wind curling down onto the deck all round the ring; landing,
//             a flat ring of cloud rolling outward
//   glBlow    Blow Me Down! (everyone): long wind streaks gathering across the deck, a soft sky tint;
//             landing, the gust sweeping through
//   glGale    Full Gale (the deck both ways from her, but behind the sails): wind chevrons racing outward
//             along the floor; landing, a sweep of streaks
//   glShift   Wind Shift (the deck from one end, but behind the sails): chevrons racing one way; landing, a
//             sweep of streaks
// Also her sails on the deck (drawGaleSails, from render/skywhale.js): little masts with cream sails and a
// cranberry stripe, planted at Squall, billowing the way the wind will blow, the sheltered side of each
// shown as a calm pale patch while a gale is coming.

import { glow, pen, sparkle, ell, sstep, clamp, TAU } from './fx.js';

const WIND = ['#ffffff', '#e2f0ff', '#a8c8f0', '#7ea2d8'];
const NAVY = '#363a70';
const COAT = ['#f2808c', '#d24a5e', '#a8344c'];
const SAIL = ['#fffdf4', '#f2ead6', '#d8ccb0', '#a8987a'];
const ROPE = ['#e8c89a', '#a07a52'];
const ease = (u) => 1 - (1 - clamp(u, 0, 1)) ** 3;

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
function cloud(ctx, x, y, r, al) {
  if (al <= 0.01 || r <= 0.2) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.beginPath();
  for (const [dx, dy, rr] of [[-0.55, 0.15, 0.55], [0, -0.2, 0.7], [0.55, 0.1, 0.55], [0.2, 0.3, 0.5], [-0.25, 0.3, 0.5]]) {
    ctx.moveTo(x + dx * r + rr * r, y + dy * r);
    ctx.arc(x + dx * r, y + dy * r, rr * r, 0, TAU);
  }
  pen(ctx, WIND[3], Math.max(0.8, r * 0.12));
  ctx.stroke();
  ctx.fillStyle = WIND[1];
  ctx.fill();
  ell(ctx, x - r * 0.15, y - r * 0.25, r * 0.55, r * 0.35);
  ctx.fillStyle = WIND[0];
  ctx.fill();
  ctx.restore();
}
function swoosh(ctx, x, y, len, curl, w, al, dir = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + dir * len * 0.6, y - curl, x + dir * len, y + curl * 0.3);
  pen(ctx, WIND[2], w + 1.4);
  ctx.stroke();
  pen(ctx, WIND[0], w);
  ctx.stroke();
  ctx.restore();
}
function word(ctx, text, x, y, size, col, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.font = `900 ${size}px "Trebuchet MS", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = size * 0.36;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = col;
  ctx.fillText(text, x, y);
  ctx.restore();
}
// A soft rounded chevron of wind on the floor, pointing `d`.
function chevron(ctx, x, y, d, s, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.beginPath();
  ctx.moveTo(x - d * s, y - s);
  ctx.quadraticCurveTo(x + d * s * 0.6, y, x - d * s, y + s);
  ctx.lineCap = 'round';
  pen(ctx, WIND[3], 3.6);
  ctx.stroke();
  pen(ctx, WIND[0], 2);
  ctx.stroke();
  ctx.restore();
}
const spark = (ctx, x, y, s, al) => sparkle(ctx, x, y, s, al, '#fff6d0');

function blankWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r, 'rgba(226,240,255,0.35)', WIND[3], 0.5 + 0.4 * p, 2);
  for (let i = 0; i < 6; i++) {
    const an = (i / 6) * TAU + time * (2 + 3 * p);
    const rr = r * (1.25 - 0.6 * p);
    const px = x + Math.cos(an) * rr;
    const py = y - 10 + Math.sin(an) * rr * 0.32;
    swoosh(ctx, px, py, 10, 3, 1.4, 0.5 + 0.4 * p, Math.sin(an) > 0 ? 1 : -1);
  }
  glow(ctx, x, y - 12, r * 0.7, '#e2f0ff', 0.15 + 0.25 * p);
}
function blankHit(ctx, z, x, y, u, e, fade) {
  for (let i = 0; i < 6; i++) {
    const an = -Math.PI + (i / 5) * Math.PI;
    cloud(ctx, x + Math.cos(an) * (6 + e * 34), y - 12 + Math.sin(an) * (6 + e * 22), 7 + e * 6, fade);
  }
  for (let i = 0; i < 4; i++) spark(ctx, x + (i - 1.5) * 14 * (0.5 + e), y - 30 - e * 14, 3 * (1 - u), fade);
  if (u < 0.7) word(ctx, 'FWOOMP!', x, y - 54 - e * 6, 13, NAVY, fade);
}
function volleyWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r, 'rgba(226,240,255,0.25)', WIND[3], 0.4 + 0.5 * p);
  // the ball's shadow growing, the ball dropping from the rigging
  ctx.save();
  ctx.globalAlpha = 0.15 + 0.35 * p;
  ell(ctx, x, y, r * (0.3 + 0.5 * p), r * 0.08 * (0.6 + p));
  ctx.fillStyle = '#7e8ab8';
  ctx.fill();
  ctx.restore();
  const by = y - 170 + 150 * ease(clamp((p - 0.35) / 0.65, 0, 1));
  if (p > 0.3) cloud(ctx, x, Math.min(y - 12, by), 8, clamp((p - 0.3) * 4, 0, 1));
}
function volleyHit(ctx, z, x, y, u, e, fade) {
  for (let i = 0; i < 5; i++) {
    const an = -Math.PI + 0.3 + (i / 4) * (Math.PI - 0.6);
    cloud(ctx, x + Math.cos(an) * (4 + e * 22), y - 6 + Math.sin(an) * (4 + e * 14), 5 + e * 3, fade);
  }
}
function haulWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r, 'rgba(255,236,200,0.3)', ROPE[1], 0.5 + 0.4 * p, 2.2);
  // the line from the rigging, swaying, its end coiled on the deck
  const sway = Math.sin(time * 2.4) * 6 * (1 - p);
  ctx.beginPath();
  ctx.moveTo(x + sway, -10);
  ctx.quadraticCurveTo(x - sway, (y - 10) / 2, x, y - 14);
  ctx.lineCap = 'round';
  pen(ctx, ROPE[1], 3.6);
  ctx.stroke();
  pen(ctx, ROPE[0], 2);
  ctx.stroke();
  ell(ctx, x, y - 6, 10, 3.4);
  pen(ctx, ROPE[1], 3);
  ctx.stroke();
  pen(ctx, ROPE[0], 1.6);
  ctx.stroke();
  // a knot lighting for each guest it needs
  const need = z.need ?? 2;
  for (let i = 0; i < need; i++) spark(ctx, x + (i - (need - 1) / 2) * 13, y - 34, 3, clamp(p * need - i, 0.25, 1));
}
function haulHit(ctx, z, x, y, u, e, fade) {
  ctx.save();
  ctx.globalAlpha *= fade;
  ctx.beginPath();
  ctx.moveTo(x, -10);
  ctx.lineTo(x, y - 14 - e * 60);
  pen(ctx, ROPE[1], 3.6);
  ctx.stroke();
  pen(ctx, ROPE[0], 2);
  ctx.stroke();
  ctx.restore();
  for (let i = 0; i < 6; i++) spark(ctx, x + Math.cos(i) * (8 + e * 26), y - 20 + Math.sin(i * 2) * (6 + e * 14), 3 * (1 - u), fade);
  if (u < 0.7) word(ctx, 'HEAVE!', x, y - 58 - e * 6, 13, ROPE[1], fade);
}
function downWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r, 'rgba(226,240,255,0.25)', WIND[3], 0.4 + 0.5 * p, 1.8);
  for (let i = 0; i < 10; i++) {
    const an = (i / 10) * TAU;
    const ph = (time * (0.9 + p) + i * 0.13) % 1;
    const px = x + Math.cos(an) * r * 0.9;
    const py = y - 50 + ph * 44 + Math.sin(an) * r * 0.2;
    ctx.save();
    ctx.globalAlpha = (0.35 + 0.45 * p) * Math.sin(Math.PI * ph);
    ctx.beginPath();
    ctx.moveTo(px, py - 10);
    ctx.quadraticCurveTo(px + 3, py - 4, px, py);
    ctx.lineCap = 'round';
    pen(ctx, WIND[2], 3.2);
    ctx.stroke();
    pen(ctx, WIND[0], 1.8);
    ctx.stroke();
    ctx.restore();
  }
}
function downHit(ctx, z, x, y, u, e, fade) {
  const r = z.w / 2;
  for (let i = 0; i < 14; i++) {
    const an = (i / 14) * TAU;
    cloud(ctx, x + Math.cos(an) * r * (0.3 + 0.8 * e), y - 6 + Math.sin(an) * r * 0.22 * (0.3 + 0.8 * e), 6 + e * 4, 0.85 * fade);
  }
  if (u < 0.6) word(ctx, 'WHUMPH!', x, y - 54 - e * 6, 12, NAVY, fade);
}
function blowWarn(ctx, z, x, y, p, time) {
  // (everyone: a soft sky tint gathering over the deck, streaks racing across, faster as it comes)
  ctx.save();
  ctx.globalAlpha = 0.04 + 0.06 * p;
  ctx.fillStyle = '#cfe2ff';
  ctx.fillRect(-20, -20, 700, 420);
  ctx.restore();
  for (let i = 0; i < 12; i++) {
    const ph = (time * (0.6 + p) + i * 0.083) % 1;
    swoosh(ctx, -40 + ph * 720, 40 + ((i * 53) % 260), 40, (i % 2 ? 3 : -3), 1.6, (0.25 + 0.45 * p) * Math.sin(Math.PI * ph));
  }
}
function blowHit(ctx, z, x, y, u, e, fade) {
  ctx.save();
  ctx.globalAlpha = 0.08 * fade;
  ctx.fillStyle = '#d8e8ff';
  ctx.fillRect(-20, -20, 700, 420);
  ctx.restore();
  for (let i = 0; i < 9; i++) swoosh(ctx, -80 + e * 760 - (i % 3) * 50, 40 + ((i * 67) % 280), 60, (i % 2 ? 4 : -4), 2, 0.6 * fade);
  if (u < 0.7) word(ctx, 'BLOW ME DOWN!', 320, 80 - e * 6, 15, NAVY, fade);
}
// A band of the deck the wind will sweep: chevrons racing the way it blows (z.dir), a soft tint.
function windWarn(ctx, z, x, y, p, time) {
  const w = z.w;
  const d = z.dir ?? 1;
  ctx.save();
  ctx.globalAlpha = 0.16 + 0.22 * p;
  ctx.fillStyle = '#d6e8ff';
  ctx.beginPath();
  ctx.roundRect(x, y - 30, w, 32, 8);
  ctx.fill();
  ctx.restore();
  const n = Math.max(1, Math.floor(w / 44));
  for (let i = 0; i < n; i++) {
    const ph = (((i + 0.5) / n + time * 0.8 * d) % 1 + 1) % 1;
    chevron(ctx, x + ph * w, y - 12, d, 6 + 3 * p, (0.35 + 0.55 * p) * Math.sin(Math.PI * ph));
  }
}
function windHit(ctx, z, x, y, u, e, fade) {
  const w = z.w;
  const d = z.dir ?? 1;
  const n = Math.max(1, Math.floor(w / 40));
  for (let i = 0; i < n; i++) {
    const px = x + ((i + 0.5) / n) * w + d * e * 50;
    swoosh(ctx, px - d * 20, y - 10 - (i % 3) * 9, 36, (i % 2 ? 3 : -3), 2, 0.85 * fade, d);
  }
}

export const GALE_FX = {
  glBlank: { warn: blankWarn, hit: blankHit },
  glVolley: { warn: volleyWarn, hit: volleyHit },
  glHaul: { warn: haulWarn, hit: haulHit },
  glDown: { warn: downWarn, hit: downHit },
  glBlow: { warn: blowWarn, hit: blowHit },
  glGale: { warn: windWarn, hit: windHit },
  glShift: { warn: windWarn, hit: windHit },
};
// How long each landing plays (s), for world/bossfight.js LOOK_HOLD.
export const GALE_HOLD = { glBlank: 0.8, glVolley: 0.6, glHaul: 0.8, glDown: 0.8, glBlow: 1, glGale: 0.7, glShift: 0.7 };
export const GALE_OWN_WARN = Object.keys(GALE_FX);

// Her sails on the deck (world/skywhale.js room.sails, room.wind): a mast and a square sail each, planted
// with a pop; while a gale is coming the sail bellies the way the wind will blow and the calm patch on its
// sheltered side shows pale and still.
export function drawGaleSails(ctx, world, cam, time) {
  const room = world.dungeon?.room;
  const S = room?.sails;
  if (!S?.list?.length) return;
  const gy = world.map.groundY - cam.y;
  const now = world.now;
  const W = room.wind && now < room.wind.end + 0.6 ? room.wind : null;
  for (const [i, s] of S.list.entries()) {
    const x = s.x - cam.x;
    if (x < -120 || x > 760) continue;
    const up = sstep((now - S.t0 - i * 0.12) / 0.45);
    const fade = S.until ? 1 - sstep((now - S.until) / 0.5) : 1;
    if (up <= 0.01 || fade <= 0.01) continue;
    // which way the wind will push it (out from her, or from one end)
    const d = W ? (W.mode === 'out' ? Math.sign(s.x - W.x) || 1 : W.mode) : 0;
    const k = W ? (now < W.end ? sstep((now - W.t0) / (W.end - W.t0)) : 1 - sstep((now - W.end) / 0.6)) : 0;
    const belly = d * (4 + 10 * k) + Math.sin(time * 1.4 + i) * 1.5;
    ctx.save();
    ctx.globalAlpha *= fade;
    // the calm patch in its lee
    if (W && k > 0.01 && now < W.end) {
      ctx.save();
      ctx.globalAlpha *= 0.35 + 0.4 * k;
      ell(ctx, x + d * 46, gy - 1, 34, 6);
      ctx.fillStyle = 'rgba(255,255,236,0.85)';
      ctx.fill();
      pen(ctx, '#e8d08a', 1.4);
      ctx.stroke();
      ctx.restore();
      for (let j = 0; j < 2; j++) sparkle(ctx, x + d * (30 + j * 26), gy - 14 - j * 6 + Math.sin(time * 3 + j) * 2, 2.2, 0.6 * k, '#fff6c8');
    }
    const h = 62 * ease(up);
    // the mast: a rounded wooden pole on a little block
    ctx.beginPath();
    ctx.roundRect(x - 7, gy - 5, 14, 6, 2.5);
    ctx.fillStyle = '#9a6a42';
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(x - 1.8, gy - h, 3.6, h, 1.8);
    ctx.fillStyle = '#c4905c';
    ctx.fill();
    pen(ctx, '#7a4e30', 1);
    ctx.stroke();
    // the yard and the sail hanging from it, bellied by the wind
    const top = gy - h + 6;
    const bot = gy - 16;
    const half = 20 * ease(up);
    ctx.beginPath();
    ctx.moveTo(x - half, top);
    ctx.quadraticCurveTo(x + belly * 0.4, top - 2, x + half, top);
    ctx.lineTo(x + half * 0.92, bot);
    ctx.quadraticCurveTo(x + belly, bot + 4, x - half * 0.92, bot);
    ctx.closePath();
    const g = ctx.createLinearGradient(x - half, 0, x + half, 0);
    g.addColorStop(0, SAIL[d < 0 ? 0 : 1]);
    g.addColorStop(1, SAIL[d < 0 ? 1 : 0]);
    ctx.fillStyle = g;
    ctx.fill();
    pen(ctx, SAIL[3], 1.3);
    ctx.stroke();
    // its cranberry stripe and a soft fold
    ctx.beginPath();
    ctx.moveTo(x - half * 0.96, (top + bot) / 2);
    ctx.quadraticCurveTo(x + belly * 0.7, (top + bot) / 2 + 2, x + half * 0.96, (top + bot) / 2);
    pen(ctx, COAT[1], 3);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + belly * 0.3, top + 3);
    ctx.quadraticCurveTo(x + belly * 0.8, (top + bot) / 2, x + belly * 0.5, bot - 2);
    pen(ctx, SAIL[2], 1);
    ctx.stroke();
    ctx.beginPath();
    ctx.roundRect(x - half - 2, top - 2.4, half * 2 + 4, 3.2, 1.6);
    ctx.fillStyle = '#a87648';
    ctx.fill();
    // a pennant on top, fluttering
    const fl = Math.sin(time * 6 + i) * 2;
    ctx.beginPath();
    ctx.moveTo(x, gy - h);
    ctx.quadraticCurveTo(x - 6 + fl * 0.3, gy - h - 3 + fl * 0.5, x - 11, gy - h - 1 + fl);
    ctx.quadraticCurveTo(x - 6, gy - h + 2, x, gy - h + 4);
    ctx.fillStyle = COAT[1];
    ctx.fill();
    ctx.restore();
  }
}
