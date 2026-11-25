// The Chest Hermit on screen (2026-11-24, the Gem Mimic remade on the creature base, the player's pick
// "B"): a fluffy ginger critter of the Crystal Cave carrying a treasure chest on its back like a hermit
// crab. It moves on its own copy of the creature rig (creaturerig.js: its bones, walk, moves and
// springs, with its dressed pieces from art.js); this adds what glints and flies:
//   - the gems on its lid twinkling now and then, and sparkling bright after its happy shimmy, a coin
//     hopping out of the chest and back in;
//   - Chomp: a snap of white in front of its mouth as it bites, and coins jumping out of the chest,
//     spinning, and dropping back behind it;
//   - Lid Slam: stars where the lid comes down, and dust puffing up off the ground.
import { hermitRig } from './creaturerig.js';
import { hermitDesign, SKIN_COLORS, HINGE, GEM, MOUTH, BOX_TOP } from './art.js';
import { clamp } from '../mobs/rig.js';

const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
// A soft round light.
function light(ctx, x, y, r, al, core = '255,250,220', edge = '255,214,120') {
  if (al <= 0.01 || r <= 0) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${core},${al})`);
  g.addColorStop(0.45, `rgba(${edge},${al * 0.5})`);
  g.addColorStop(1, `rgba(${edge},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
// A four-pointed twinkle.
function twinkle(ctx, x, y, r, al, col = '#ffffff') {
  if (al <= 0.01) return;
  ctx.globalAlpha = al;
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r * 0.7, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r * 0.7, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
  ctx.globalAlpha = 1;
}
// A gold coin seen spinning: its face narrowing to its edge and back (a coin turning over, not the
// critter: the coin's width is its turn).
function coin(ctx, x, y, r, turn, al) {
  const w = Math.max(0.6, Math.abs(Math.cos(turn)) * r);
  ctx.globalAlpha = al;
  ctx.fillStyle = '#b8801e';
  ctx.beginPath();
  ctx.ellipse(x, y, w + 0.6, r + 0.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = Math.cos(turn) > 0 ? '#f2c860' : '#e0aa38';
  ctx.beginPath();
  ctx.ellipse(x, y, w, r, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff4c0';
  ctx.beginPath();
  ctx.ellipse(x - w * 0.3, y - r * 0.35, w * 0.3, r * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}
// A puff of dust.
function puff(ctx, x, y, r, al) {
  if (al <= 0.01) return;
  ctx.globalAlpha = al;
  ctx.fillStyle = '#e8dcc8';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function hermitFx(ctx, m, a, S, matOf, K) {
  const mv = a.blMove?.mv;
  const t = a.blMove?.t ?? 0;
  const dead = m?.hp <= 0;
  const [gx, gy] = K.through(matOf('lid'), 'gem', 'hinge');
  ctx.save();
  // the gems twinkling now and then, bright after its shimmy
  if (!dead) {
    const P = 3.4 + hash(m?.uid ?? 1) * 1.6;
    const u = (a.t % P) / P;
    const tw = Math.max(0, Math.sin(Math.PI * clamp((u - 0.82) / 0.18, 0, 1)));
    const shine = a.hermitShine ?? 0;
    // (after its shimmy)
    const k = Math.max(tw * 0.9, shine);
    if (k > 0.01) {
      ctx.globalCompositeOperation = 'lighter';
      light(ctx, gx, gy, 6 + 4 * shine, 0.45 * k);
      ctx.globalCompositeOperation = 'source-over';
      twinkle(ctx, gx + 1.2, gy - 1.4, 3 + 2.4 * k, k);
      if (shine > 0.1) {
        for (const [dx, dy, ph] of [[-9, 2, 0], [9, 2, 1.7], [0, -6, 3.1]]) twinkle(ctx, gx + dx, gy + dy, 2.2, shine * (0.5 + 0.5 * Math.sin(a.t * 7 + ph)));
      }
    }
  }
  // coin flips: the coin spinning up out of its paw and back down (the third onto its head)
  const tz = a.hermitToss ?? -1;
  if (tz >= 0 && !dead) {
    const n = Math.floor(tz);
    const v = tz - n;
    const [hx, hy] = K.through(matOf('handN'), 'handN', 'wrN');
    if (v <= 0.82 || n === 2) {
      const [tx, ty] = n === 2 ? K.through(matOf('head'), 'neck', 'neck') : [hx, hy];
      const top = n === 2 ? ty - 22 : ty;
      const u = Math.min(1, v / (n === 2 ? 1 : 0.82));
      const x = hx + (tx - hx) * u;
      const y = hy + (top - hy) * u - Math.sin(Math.PI * u) * 22;
      coin(ctx, x, y, 2.4, tz * 8, 1);
    }
  }
  // the bonk: little stars round its head
  const bk = a.hermitBonk ?? -1;
  if (bk >= 0 && !dead) {
    const [hx, hy] = K.through(matOf('head'), 'neck', 'neck');
    for (let i = 0; i < 3; i++) {
      const an = a.t * 6 + (i / 3) * Math.PI * 2;
      twinkle(ctx, hx + Math.cos(an) * 9, hy - 22 + Math.sin(an) * 2.4, 2.2, (1 - bk) * (0.6 + 0.4 * Math.sin(an)), i === 1 ? '#ffd0e0' : '#fff3a0');
    }
  }
  // its idle shimmy: one coin hopping out of the chest, turning over, and dropping back in
  const hu = a.hermitHop ?? -1;
  if (hu >= 0 && hu < 1 && !dead) {
    const [bx, by] = K.through(matOf('box'), 'boxTop', 'ribs');
    coin(ctx, bx - 4 + hu * 3, by - 2 - 16 * Math.sin(Math.PI * hu), 2.4, hu * 9, 1);
  }
  // Chomp: a white snap in front of its mouth as the jaws meet
  if (mv?.chomp) {
    const t0 = mv.chomp[0];
    const u = (t - t0) / 0.22;
    if (u >= 0 && u < 1) {
      const [mx, my] = K.through(matOf('head'), 'mouthH', 'neck');
      const x = mx + 7;
      const al = 1 - u;
      ctx.strokeStyle = '#ffffff';
      ctx.lineCap = 'round';
      ctx.lineWidth = 1.6;
      ctx.globalAlpha = al;
      const o = 2 + u * 7;
      ctx.beginPath();
      ctx.arc(x, my - o, 5, 0.25 * Math.PI, 0.75 * Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, my + o, 5, 1.25 * Math.PI, 1.75 * Math.PI);
      ctx.stroke();
      ctx.globalAlpha = 1;
      for (let i = 0; i < 3; i++) {
        const ang = -0.9 + i * 0.9;
        twinkle(ctx, x + 4 + Math.cos(ang) * (4 + u * 8), my + Math.sin(ang) * (4 + u * 8), 2.4 * (1 - u * 0.6), al);
      }
    }
  }
  // Chomp: coins jumping out of the chest, spinning, dropping back down behind it
  if (mv?.coins) {
    const [t0, t1] = mv.coins;
    if (t < t0) a.hermitFrom = null;
    else if (!a.hermitFrom) a.hermitFrom = K.through(matOf('box'), 'boxTop', 'ribs');
    if (a.hermitFrom && t >= t0) {
      const [ox, oy] = a.hermitFrom;
      for (let i = 0; i < 3; i++) {
        const s0 = t0 + i * 0.05;
        const dur = (t1 - t0) * (0.8 + i * 0.1);
        const u = (t - s0) / dur;
        if (u < 0 || u > 1) continue;
        const vx = [-14, -4, -22][i];
        const up = [20, 26, 16][i];
        const x = ox + (i - 1) * 4 + vx * u;
        const y = oy - up * Math.sin(Math.PI * u * 0.8) + (-oy) * Math.max(0, (u - 0.4) / 0.6) ** 2;
        coin(ctx, x, Math.min(y, -2), 2.6, u * 14 + i, u > 0.85 ? (1 - u) / 0.15 : 1);
      }
    }
  }
  // Lid Slam: stars where the lid comes down, dust puffing off the ground
  if (mv?.slam) {
    const t0 = mv.slam[0];
    const u = (t - t0) / 0.4;
    if (u >= 0 && u < 1) {
      const al = 1 - u;
      for (let i = 0; i < 4; i++) {
        const ang = -Math.PI * 0.9 + i * 0.55;
        twinkle(ctx, gx + Math.cos(ang) * (5 + u * 12), gy + Math.sin(ang) * (5 + u * 12), 3 * (1 - u * 0.5), al, i % 2 ? '#fff4c0' : '#ffffff');
      }
      for (let i = 0; i < 4; i++) {
        const dx = (i - 1.5) * 7 + (i < 2 ? -1 : 1) * u * 8;
        puff(ctx, gx + dx, -2 - u * 3 - (i % 2) * 2, 2.6 + u * 3, 0.7 * al);
      }
    }
  }
  ctx.restore();
}

const R = hermitRig({ design: hermitDesign, skin: SKIN_COLORS, hinge: HINGE, gem: GEM, mouth: MOUTH, boxTop: BOX_TOP, fx: hermitFx });
export const HERMIT_ART = { pad: 12, walk: 8, idle: 8, attack: 5, stride: R.stride, atkMs: [110, 180, 300, 220], draw: R.still, rig: R.rig, noHop: true };
export const HERMIT_SIZE = { w: 28, h: Math.round(R.H * 0.92) };
