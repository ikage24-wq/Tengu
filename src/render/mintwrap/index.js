// The Mint Wrapper on screen (2026-11-25, the Peppermint Spinner remade on the kid base, the player's
// pick "B"): a cheeky kid of the bakery still in their sweet wrapper. They move on their own copy of
// the kid rig (kidrig.js: its bones, walk, moves and springs, their pieces from art.js); this adds:
//   - a twinkle on the cellophane now and then;
//   - dizzy: little stars circling their head after a spin;
//   - a shine on the peppermint once it's polished;
//   - spinning: red and white swirls whirling round them, sugar sparkles flung off;
//   - Mint Flick: a little peppermint in their hand as they wind up, then spinning along the ground
//     at you like a top, a puff of sugar where it skids.
import { mintRig } from './kidrig.js';
import { mintDesign, SKIN_COLORS, MOUTH, CAPE, CAPE_TWIST, MINT_C, TWIST_F, TWIST_N } from './art.js';
import { clamp } from '../mobs/rig.js';

const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const ease = (u) => 1 - (1 - u) ** 2;
function twinkle(ctx, x, y, r, al, col = '#ffffff') {
  if (al <= 0.01 || r <= 0.2) return;
  ctx.globalAlpha = al;
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
  ctx.globalAlpha = 1;
}
function star(ctx, x, y, r, al, col, spin = 0) {
  if (al <= 0.01 || r <= 0.2) return;
  ctx.globalAlpha = al;
  ctx.fillStyle = col;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + spin + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.48 : r;
    ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
}
// A little peppermint, turned by `rot`, squashed to `sy` (lying on the ground, seen a little from
// above), with a soft rim.
function peppermint(ctx, x, y, r, rot, sy = 1, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = al;
  ctx.translate(x, y);
  ctx.scale(1, sy);
  ctx.fillStyle = '#8a1428';
  ctx.beginPath();
  ctx.arc(0, 0, r + 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8304a';
  for (let i = 0; i < 6; i++) {
    const a = rot + (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(Math.cos(a + 0.35) * r * 0.7, Math.sin(a + 0.35) * r * 0.7, Math.cos(a + 0.55) * r, Math.sin(a + 0.55) * r);
    ctx.lineTo(Math.cos(a + 0.95) * r, Math.sin(a + 0.95) * r);
    ctx.quadraticCurveTo(Math.cos(a + 0.6) * r * 0.6, Math.sin(a + 0.6) * r * 0.6, 0, 0);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath();
  ctx.ellipse(-r * 0.35, -r * 0.4, r * 0.3, r * 0.15, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.globalAlpha = 1;
}

function mintFx(ctx, m, a, S, matOf, K, H) {
  const mv = a.blMove?.mv;
  const t = a.blMove?.t ?? 0;
  const dead = m?.hp <= 0;
  ctx.save();
  const head = K.through(matOf('headJ'), 'neck', 'neck');
  if (!dead) {
    // a twinkle on the cellophane hood now and then
    const gu = ((a.t + (m.uid % 7) * 0.7) % 3.1) / 0.45;
    if (gu < 1) {
      const p = K.through(matOf('headJ'), 'twistNJ', 'neck');
      twinkle(ctx, p[0] - 4, p[1] - 6, 2.6 * Math.sin(Math.PI * gu), 0.95);
    }
    // dizzy: stars circling their head
    const dz = Math.max(a.mintDizzy ?? 0, mv?.spin && t > mv.spin[1] && t < mv.spin[1] + 0.5 ? 1 - (t - mv.spin[1]) / 0.5 : 0);
    if (dz > 0.05) {
      for (let i = 0; i < 3; i++) {
        const ang = a.t * 5 + (i / 3) * Math.PI * 2;
        star(ctx, head[0] + Math.cos(ang) * H * 0.16, head[1] - H * 0.36 + Math.sin(ang) * H * 0.04, 1.6, dz * (0.6 + 0.4 * Math.sin(ang)), i === 1 ? '#ff8aa8' : '#ffe27a', ang);
      }
    }
    // a shine on the peppermint once it's polished
    const sh = a.mintShine ?? 0;
    if (sh > 0.05) {
      const c = K.through(matOf('chest'), 'mintC', 'ribs');
      twinkle(ctx, c[0] - 2, c[1] - 3, 3.6 * sh, sh);
      twinkle(ctx, c[0] + 3.4, c[1] + 1.4, 1.8 * sh, sh * 0.8);
    }
    // a tiny mint flicked up out of their hand, arcing high and dropping into their mouth
    const tu = a.mintToss ?? -1;
    if (tu >= 0) {
      const hand = K.through(matOf('handN'), 'handN', 'wrN');
      const mo = K.through(matOf('headJ'), 'mouthM', 'neck');
      const x = hand[0] + (mo[0] - hand[0]) * tu;
      const y = hand[1] + (mo[1] - hand[1]) * tu - Math.sin(Math.PI * tu) * H * 0.75;
      peppermint(ctx, x, y, 1.8, a.t * 14, 1, 1);
      if (tu < 0.2) twinkle(ctx, hand[0], hand[1] - 2, 2 * (1 - tu * 5), 1 - tu * 5);
    }
    // crunch: candy crumbs and a sparkle off their cheek
    const cr = a.mintCrunch ?? 0;
    if (cr > 0.05) {
      const mo = K.through(matOf('headJ'), 'mouthM', 'neck');
      for (let i = 0; i < 4; i++) {
        const u = ((a.t * 2.2 + i / 4) % 1);
        const ang = -Math.PI * 0.9 + (i / 3) * Math.PI * 0.8;
        ctx.globalAlpha = cr * (1 - u);
        ctx.fillStyle = i % 2 ? '#e8304a' : '#ffffff';
        ctx.beginPath();
        ctx.arc(mo[0] + Math.cos(ang) * (3 + u * 6), mo[1] + Math.sin(ang) * (3 + u * 6) + u * u * 5, 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      twinkle(ctx, mo[0] + H * 0.12, mo[1] - H * 0.06, 2.4 * cr, cr, '#ffd0d8');
    }
    // tugging at the hood: the cellophane crinkling at both twists; snapping back with a glint
    const tg = Math.max(a.mintTug ?? 0, (a.mintSnap ?? 0) * 1.4);
    if (tg > 0.05) {
      for (const j of ['twistNJ', 'twistFJ']) {
        const p = K.through(matOf('headJ'), j, 'neck');
        for (let i = 0; i < 2; i++) {
          const u = ((a.t * 3 + i / 2 + (j === 'twistFJ' ? 0.25 : 0)) % 1);
          twinkle(ctx, p[0] + (hash(i + Math.floor(a.t * 3)) - 0.5) * 8, p[1] - 2 - u * 6, 1.8 * Math.sin(Math.PI * u) * Math.min(1, tg), Math.min(1, tg));
        }
      }
    }
  }
  // spinning: swirls whirling round them, sugar flung off
  if (a.mintSpinning && !dead) {
    const c = K.through(matOf('chest'), 'mintC', 'ribs');
    const R = H * 0.3;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const a0 = a.t * 16 + (i / 3) * Math.PI * 2;
      ctx.strokeStyle = i % 2 ? 'rgba(232,48,74,0.55)' : 'rgba(255,255,255,0.75)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(c[0], c[1] + 2, R, R * 0.32, 0, a0, a0 + 1.6);
      ctx.stroke();
    }
    for (let i = 0; i < 4; i++) {
      const u = ((a.t * 2.4 + i / 4) % 1);
      const ang = hash(i + Math.floor(a.t * 2.4)) * Math.PI * 2;
      twinkle(ctx, c[0] + Math.cos(ang) * R * (0.8 + u), c[1] + Math.sin(ang) * R * 0.5 * (0.8 + u), 1.4 * (1 - u), 1 - u, i % 2 ? '#ffd0d8' : '#ffffff');
    }
  }
  // Mint Flick: the mint in their hand, then spinning along the ground at you
  if (mv?.flick) {
    const [t0, t1] = mv.flick;
    const hand = K.through(matOf('handN'), 'handN', 'wrN');
    if (t < t0) peppermint(ctx, hand[0] + 1, hand[1] - 1, 2.2, a.t * 3, 1);
    else {
      if (!a.mo.mintFrom) a.mo.mintFrom = [hand[0], hand[1]];
      const u = clamp((t - t0) / (t1 - t0), 0, 1);
      const [ox, oy] = a.mo.mintFrom;
      const D = H * 0.75;
      const x = ox + ease(u) * D;
      // (a low arc down to the ground, then skittering along it on its edge, spinning)
      const land = 0.25;
      const y = u < land ? oy + (0 - oy) * (u / land) ** 2 - Math.sin((u / land) * Math.PI) * 4 : -2.2 - Math.abs(Math.sin(u * 22)) * 1.2 * (1 - u);
      const fade = u > 0.85 ? 1 - (u - 0.85) / 0.15 : 1;
      peppermint(ctx, x, y, 2.4, t * 30, u < land ? 1 : 0.55, fade);
      if (u > land) for (let i = 1; i <= 3; i++) twinkle(ctx, x - i * 3, -1 - hash(i) * 2, 1.2 * (1 - i / 4), fade * (1 - i / 4) * 0.9, '#fff0f4');
    }
  } else if (a.mo) a.mo.mintFrom = null;
  ctx.restore();
}

const R = mintRig({ design: mintDesign, skin: SKIN_COLORS, mouth: MOUTH, cape: CAPE, capeTwist: CAPE_TWIST, mintC: MINT_C, twistF: TWIST_F, twistN: TWIST_N, fx: mintFx });
export const MINT_ART = { pad: 12, walk: 8, idle: 8, attack: 5, stride: R.stride, atkMs: [100, 180, 300, 220], draw: R.still, rig: R.rig, noHop: true };
export const MINT_SIZE = { w: 28, h: Math.round(R.H * 0.92) };
