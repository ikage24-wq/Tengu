// The Candelabra Bride on screen (2026-11-24, the Candle Bride remade on the maiden base, the player's
// pick "B"): a gothic bride of the Moonlit Manor in black lace with a brass candelabra. She moves on her
// own copy of the maiden rig (bridalrig.js, with her dressed pieces from art.js); this draws what's
// alive in the light: her three candle flames, each its own teardrop, swaying and flickering out of
// step; guttering low when a draught catches them (her idle act), flaring tall as she thrusts or
// sweeps the candelabra at you (the flame she throws is the dungeon's own shot); snuffed when she's
// beaten, a thread of smoke rising.
import { brideRig } from './bridalrig.js';
import { brideDesign, SKIN_COLORS, FLAMES } from './art.js';
import { clamp } from '../mobs/rig.js';

const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
function glow(ctx, x, y, r, al) {
  if (al <= 0.01) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(255,236,170,${al})`);
  g.addColorStop(0.5, `rgba(255,170,70,${al * 0.45})`);
  g.addColorStop(1, 'rgba(255,170,70,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
// One flame on its wick: `h` tall, leaning `lean`.
function flame(ctx, x, y, h, lean) {
  const w = h * 0.42;
  const tip = [x + lean * h, y - h];
  ctx.beginPath();
  ctx.moveTo(x, y + w * 0.4);
  ctx.bezierCurveTo(x - w, y + w * 0.2, x - w * 0.7, y - h * 0.45, tip[0], tip[1]);
  ctx.bezierCurveTo(x + w * 0.7, y - h * 0.45, x + w, y + w * 0.2, x, y + w * 0.4);
  ctx.fillStyle = '#ff9a3a';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x, y + w * 0.25);
  ctx.bezierCurveTo(x - w * 0.5, y, x - w * 0.35, y - h * 0.35, x + lean * h * 0.6, y - h * 0.62);
  ctx.bezierCurveTo(x + w * 0.35, y - h * 0.35, x + w * 0.5, y, x, y + w * 0.25);
  ctx.fillStyle = '#ffe9a0';
  ctx.fill();
}

function brideFx(ctx, m, a, S, matOf, K) {
  const M = matOf('candelabra');
  const mv = a.blMove?.mv;
  const t = a.blMove?.t ?? 0;
  const dead = (m?.hp ?? 1) <= 0;
  const flare = Math.max(a.brideFlare ?? 0, mv?.flare && t >= mv.flare[0] && t < mv.flare[1] ? Math.sin(Math.PI * clamp((t - mv.flare[0]) / (mv.flare[1] - mv.flare[0]), 0, 1)) : 0);
  const gut = a.brideGutter ?? 0;
  ctx.save();
  ['flameL', 'flameM', 'flameR'].forEach((n, i) => {
    const [x, y] = K.through(M, n, 'wrN');
    if (dead) {
      // (snuffed: a thread of smoke curling up)
      ctx.strokeStyle = 'rgba(200,190,210,0.55)';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      for (let k = 0; k <= 8; k++) ctx.lineTo(x + Math.sin(k * 0.9 + a.t * 3 + i) * 1.2, y + 2 - k * 1.6);
      ctx.stroke();
      return;
    }
    const fl = 0.85 + 0.12 * Math.sin(a.t * (11 + i * 2.3) + i * 1.7) + 0.06 * Math.sin(a.t * 23 + i);
    const gutter = gut * (0.5 + 0.5 * Math.sin(a.t * 17 + i * 2));
    const h = (3.4 + flare * 4.6) * fl * (1 - gutter * 0.55);
    const lean = Math.sin(a.t * 2.3 + i) * 0.12 - (S.candR ?? 0) * 0.004 + gutter * 0.4 * Math.sin(a.t * 9 + i);
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, x, y - h * 0.4, 7 + flare * 9, (0.4 + flare * 0.4) * (1 - gutter * 0.5));
    ctx.globalCompositeOperation = 'source-over';
    flame(ctx, x, y, h, lean);
    // (flaring: sparks thrown off the flames)
    if (flare > 0.2) {
      ctx.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 3; k++) {
        const u = ((a.t * 2.4 + k * 0.33 + i * 0.17) % 1);
        glow(ctx, x + (hash(k + i * 5) - 0.3) * 10 * u + u * 8, y - h - u * 10, 1.6, flare * (1 - u));
      }
      ctx.globalCompositeOperation = 'source-over';
    }
  });
  ctx.restore();
}

const R = brideRig({ design: brideDesign, skin: SKIN_COLORS, flames: FLAMES, fx: brideFx });
export const BRIDE_ART = { pad: 12, walk: 8, idle: 8, attack: 5, stride: R.stride, atkMs: [110, 180, 340, 240], draw: R.still, rig: R.rig, noHop: true };
export const BRIDE_SIZE = { w: 26, h: Math.round(R.H * 0.92) };
