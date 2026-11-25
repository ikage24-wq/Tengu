// The Lamplighter Wisp on screen (2026-11-24, the Lantern Wisp remade on the spirit base, the player's
// pick "A"): a little ghost lamplighter of the Moonlit Manor. She moves on her own copy of the spirit
// rig (spiritrig.js: its bones, hover, glide, moves and springs, with her dressed pieces from art.js);
// this adds what's alive in the light:
//   - her lantern's glow, flickering, brighter when she's just trimmed it, dim as she nods off;
//   - Lantern Fling: a ball of flame flung from the lantern, flying out at you (her range) with a
//     trail of sparks, bursting where it lands;
//   - Ember Volley: three embers lobbed out of the lantern in arcs, each a little puff where it lands.
import { wispRig } from './spiritrig.js';
import { wispDesign, SKIN_COLORS, CROOK, FLAME, MOUTH } from './art.js';
import { clamp } from '../mobs/rig.js';

const RANGE = 150;
const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
// A soft round light: a warm core fading out.
function light(ctx, x, y, r, al, core = '255,243,196', edge = '255,179,71') {
  if (al <= 0.01 || r <= 0) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${core},${al})`);
  g.addColorStop(0.45, `rgba(${edge},${al * 0.55})`);
  g.addColorStop(1, `rgba(${edge},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
// A ball of flame with a hot middle.
function fireball(ctx, x, y, r, al) {
  light(ctx, x, y, r * 2.6, al * 0.6);
  // (the ball itself solid, not added light, so it stays orange)
  const was = ctx.globalCompositeOperation;
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = al;
  ctx.fillStyle = '#ff9a3a';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffe37a';
  ctx.beginPath();
  ctx.arc(x + r * 0.15, y - r * 0.15, r * 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = was;
}
const ease = (u) => 1 - (1 - u) ** 2;

function wispFx(ctx, m, a, S, matOf, K) {
  const [fx, fy] = K.through(matOf('lantern'), 'flame', 'crook');
  const mv = a.blMove?.mv;
  const t = a.blMove?.t ?? 0;
  const dead = m?.hp <= 0;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  // the lantern's glow: a flicker, a trimmed flame's flare, a doze's dimming
  const flick = 0.85 + 0.1 * Math.sin(a.t * 13.7 + (m?.uid ?? 0)) + 0.06 * Math.sin(a.t * 23.1);
  const k = dead ? 0.25 : clamp(1 + (a.wispFlare ?? 0) * 0.8, 0.4, 1.9);
  light(ctx, fx, fy, 10 * k * flick, 0.42 * Math.min(1, k) * flick);
  light(ctx, fx, fy, 3.2 * k, 0.7 * Math.min(1, k));
  // a spark drifting up off the flame now and then
  for (let i = 0; i < 2; i++) {
    const P = 1.6 + hash(i) * 0.9;
    const u = ((a.t + i * 0.83) / P) % 1;
    const n = Math.floor((a.t + i * 0.83) / P);
    light(ctx, fx + (hash(n + i * 7) - 0.5) * 4 + Math.sin(u * 7) * 1.2, fy - 3 - u * 12, 1.6, 0.8 * Math.sin(Math.PI * u) * Math.min(1, k));
  }
  // the runaway ember: out of the glass, a loop through the air, caught in her free hand, back in
  const em = a.wispEmber ?? -1;
  if (em >= 0 && !dead) {
    const [hx, hy] = K.through(matOf('handF'), 'handF', 'wrF');
    let x;
    let y;
    if (em < 2.5) {
      const u = em / 2.5;
      // (a lazy loop up and out ahead of her, then drifting down toward where her hand will be)
      const lx = fx + 8 + Math.sin(u * Math.PI * 2) * 7 + u * 4;
      const ly = fy - 6 - Math.sin(u * Math.PI) * 14 + Math.cos(u * Math.PI * 2) * 4;
      const near = Math.max(0, (u - 0.75) / 0.25);
      x = lx + (hx - lx) * near * near;
      y = ly + (hy - ly) * near * near;
    } else if (em < 3.2) {
      [x, y] = [hx, hy];
    } else {
      const u = Math.min(1, (em - 3.2) / 0.6);
      x = hx + (fx - hx) * u;
      y = hy + (fy - hy) * u - Math.sin(Math.PI * u) * 4;
    }
    const pulse = 0.8 + 0.2 * Math.sin(a.t * 18);
    light(ctx, x, y, 4.4 * pulse, 0.55);
    light(ctx, x, y, 1.5, 1);
  }
  // lighting the lamp: a burst of sparkles off the raised flame
  const bu = a.wispBurst ?? -1;
  if (bu >= 0 && !dead) {
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2 + hash(i) * 0.4;
      const d = 3 + ease(bu) * (12 + hash(i + 3) * 8);
      light(ctx, fx + Math.cos(ang) * d, fy - 4 + Math.sin(ang) * d * 0.8 - bu * 4, 1.4 * (1 - bu) + 0.4, 0.9 * (1 - bu));
    }
    light(ctx, fx, fy - 4, 6 + bu * 10, 0.5 * (1 - bu));
  }
  // Lantern Fling: the ball of flame, flung from the lantern out to her range
  if (mv?.fling) {
    const [t0, t1] = mv.fling;
    if (t < t0) a.wispFrom = null;
    else if (!a.wispFrom) a.wispFrom = [fx, fy];
    if (a.wispFrom && t >= t0 && t < t1 + 0.25) {
      const u = clamp((t - t0) / (t1 - t0), 0, 1);
      const [ox, oy] = a.wispFrom;
      const x = ox + (RANGE - (ox - S.x)) * ease(u);
      const y = oy + (-6 * Math.sin(Math.PI * u) + 10 * u * u);
      if (u < 1) {
        for (let i = 1; i <= 5; i++) {
          const v = Math.max(0, u - i * 0.035);
          fireball(ctx, ox + (RANGE - (ox - S.x)) * ease(v), oy + (-6 * Math.sin(Math.PI * v) + 10 * v * v), 2.6 - i * 0.35, 0.45 - i * 0.07);
        }
        fireball(ctx, x, y, 3.4, 1);
      } else {
        const b = clamp((t - t1) / 0.25, 0, 1);
        light(ctx, x, y, 6 + b * 14, 0.9 * (1 - b));
        for (let i = 0; i < 6; i++) {
          const ang = (i / 6) * Math.PI * 2 + 0.3;
          light(ctx, x + Math.cos(ang) * b * 12, y + Math.sin(ang) * b * 9 - b * 3, 1.8, 0.9 * (1 - b));
        }
      }
    }
  }
  // Ember Volley: three embers lobbed out in arcs
  if (mv?.embers) {
    const [t0, t1] = mv.embers;
    if (t < t0) a.wispFrom = null;
    else if (!a.wispFrom) a.wispFrom = [fx, fy];
    if (a.wispFrom) {
      const [ox, oy] = a.wispFrom;
      for (let i = 0; i < 3; i++) {
        const s0 = t0 + i * 0.09;
        const dur = (t1 - t0) * (0.75 + i * 0.1);
        const u = (t - s0) / dur;
        if (u < 0 || u > 1.3) continue;
        const D = RANGE * (0.6 + i * 0.2) - (ox - S.x);
        const v = clamp(u, 0, 1);
        const x = ox + D * v;
        const y = oy - 22 * Math.sin(Math.PI * v) + (-oy) * v * v;
        if (u <= 1) {
          for (let j = 1; j <= 3; j++) {
            const w = Math.max(0, v - j * 0.04);
            fireball(ctx, ox + D * w, oy - 22 * Math.sin(Math.PI * w) + (-oy) * w * w, 1.8 - j * 0.35, 0.4 - j * 0.1);
          }
          fireball(ctx, x, y, 2.2, 1);
        } else light(ctx, x, -2, 4 + (u - 1) * 30, 0.8 * (1 - (u - 1) / 0.3));
      }
    }
  }
  ctx.restore();
}

const R = wispRig({ design: wispDesign, skin: SKIN_COLORS, crook: CROOK, flame: FLAME, mouth: MOUTH, fx: wispFx });
export const WISP_ART = { pad: 12, walk: 8, idle: 8, attack: 5, stride: R.stride, atkMs: [110, 180, 340, 240], draw: R.still, rig: R.rig, noHop: true };
export const WISP_SIZE = { w: 26, h: Math.round(R.H * 0.92) };
