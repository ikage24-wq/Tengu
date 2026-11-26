// The Mirror Twins on screen (2026-11-24, the Gemini Ghosts remade on the spirit base, the player's
// pick "B"): a pale little ghost girl of the Observatory and her night twin, back to back, her mirror
// image. They move on their own copy of the spirit rig (twinrig.js: its bones, hover, glide, moves
// and springs, the day girl's pieces and her twin's from art.js); this adds the starlight:
//   - their sign: a little star floating over each head, the two joined by a faint line of light,
//     twinkling (Gemini, the twins in the sky);
//   - star motes rising off their wisps now and then;
//   - sparkles drifting off both their hands while they dance;
//   - Star Clap: a burst of little stars popping out of her hands as they meet;
//   - Star Dash: a trail of stars streaming behind the pair as they dart forward.
import { twinRig } from './twinrig.js';
import { dayDesign, nightDesign, DAY, NIGHT, MOUTH, LOCK_F, LOCK_N, AHOGE_ROOT, SASH, CROWN } from './art.js';
import { clamp } from '../mobs/rig.js';

const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
// A five-pointed star.
function star(ctx, x, y, r, al, col, spin = 0) {
  if (al <= 0.01 || r <= 0.2) return;
  ctx.globalAlpha = al;
  ctx.fillStyle = col;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + spin + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
}
function glow(ctx, x, y, r, al) {
  if (al <= 0.01) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(255,246,200,${al})`);
  g.addColorStop(1, 'rgba(255,214,120,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
const ease = (u) => 1 - (1 - u) ** 2;

function twinFx(ctx, m, a, S, matOf, K, H) {
  const mv = a.blMove?.mv;
  const t = a.blMove?.t ?? 0;
  const dead = m?.hp <= 0;
  // (a point of the day girl's, and the same point on her twin: flipped behind her, as twinrig.js)
  const twin = ([x, y]) => [-x - H * 0.26 + 2 * (S.x ?? 0), y - H * 0.05];
  const hN = K.through(matOf('handN'), 'handN', 'wrN');
  const hF = K.through(matOf('handF'), 'handF', 'wrF');
  ctx.save();
  // their sign: a star over each head, joined by a faint line, twinkling in turn
  if (!dead) {
    const c1 = K.through(matOf('headJ'), 'crownT', 'neck');
    const c2 = twin(c1);
    const b1 = Math.sin(a.t * 1.9) * 0.8;
    const b2 = Math.sin(a.t * 1.9 - 1.6) * 0.8;
    const p1 = [c1[0], c1[1] + b1];
    const p2 = [c2[0], c2[1] - 2 + b2];
    ctx.strokeStyle = '#fff6c8';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([1.2, 1.4]);
    ctx.globalAlpha = 0.45;
    ctx.beginPath();
    ctx.moveTo(p1[0], p1[1]);
    ctx.lineTo(p2[0], p2[1]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    const tw1 = 0.75 + 0.25 * Math.sin(a.t * 3.1);
    const tw2 = 0.75 + 0.25 * Math.sin(a.t * 3.1 + Math.PI);
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, p1[0], p1[1], 3.6, 0.5 * tw1);
    glow(ctx, p2[0], p2[1], 3.6, 0.5 * tw2);
    ctx.globalCompositeOperation = 'source-over';
    star(ctx, p1[0], p1[1], 1.9 * tw1, 1, '#fff6c8', a.t * 0.4);
    star(ctx, p2[0], p2[1], 1.9 * tw2, 1, '#ffd86a', -a.t * 0.4);
    // star motes rising off their wisps
    for (let i = 0; i < 3; i++) {
      const P = 2.6 + hash(i + 9) * 1.4;
      const u = ((a.t + i * 1.1) / P) % 1;
      const n = Math.floor((a.t + i * 1.1) / P);
      const base = [S.x + (hash(n * 3 + i) - 0.5) * H * 0.2, -H * 0.12];
      const pt = i === 1 ? twin(base) : base;
      star(ctx, pt[0] + Math.sin(u * 5 + i) * 1.4, pt[1] - u * H * 0.3, 1.1, 0.8 * Math.sin(Math.PI * u), i === 1 ? '#ffd86a' : '#fff6c8', u * 3);
    }
  }
  // sparkles drifting off their hands as they dance
  const dn = a.twinDance ?? 0;
  if (dn > 0.05 && !dead) {
    for (const [i, p] of [hN, hF, twin(hN), twin(hF)].entries()) {
      const P = 0.9 + hash(i) * 0.5;
      const u = ((a.t + i * 0.37) / P) % 1;
      star(ctx, p[0] + Math.sin(u * 6 + i) * 2, p[1] - u * 9, 1.6 * (1 - u * 0.5), dn * Math.sin(Math.PI * u), i < 2 ? '#fff6c8' : '#ffd86a', u * 2);
    }
  }
  // the falling star: down from the sky with a trail, caught overhead, then hugged and glowing
  const fs = a.twinStar ?? -1;
  if (fs >= 0 && !dead) {
    const mid = [(hN[0] + hF[0]) / 2, (hN[1] + hF[1]) / 2];
    let p;
    if (fs < 1.6) {
      const u = fs / 1.6;
      const from = [mid[0] + H * 0.7, mid[1] - H * 1.1];
      p = [from[0] + (mid[0] - from[0]) * u, from[1] + (mid[1] - 4 - from[1]) * u * u];
      for (let k = 1; k < 6; k++) {
        const v = Math.max(0, u - k * 0.03);
        star(ctx, from[0] + (mid[0] - from[0]) * v, from[1] + (mid[1] - 4 - from[1]) * v * v, 1.4 - k * 0.2, (1 - k / 6) * 0.7, '#fff6c8', 0);
      }
    } else {
      p = [mid[0], mid[1] - 2];
    }
    const al = Math.min(1, (5 - fs) * 2);
    ctx.globalCompositeOperation = 'lighter';
    glow(ctx, p[0], p[1], 5 + (fs > 2.3 ? 3 * Math.sin(a.t * 4) + 3 : 0), 0.6 * al);
    ctx.globalCompositeOperation = 'source-over';
    star(ctx, p[0], p[1], 2.6, al, '#ffe680', a.t * 1.2);
    if (fs > 2.3) {
      // (its twin's copy glowing in her twin's arms too)
      const q = twin(p);
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, q[0], q[1], 5, 0.4 * al);
      ctx.globalCompositeOperation = 'source-over';
      for (let i = 0; i < 3; i++) {
        const u = ((a.t * 0.8 + i / 3) % 1);
        star(ctx, p[0] + (i - 1) * 5 + Math.sin(u * 5) * 2, p[1] - u * 12, 1.2, al * Math.sin(Math.PI * u), '#fff6c8', u * 2);
      }
    }
  }
  // Star Clap: a burst of stars out of her hands as they meet
  if (mv?.clap) {
    const u = (t - mv.clap[0]) / 0.4;
    if (u >= 0 && u < 1) {
      const [cx, cy] = [(hN[0] + hF[0]) / 2 + 2, (hN[1] + hF[1]) / 2];
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, cx, cy, 6 + u * 10, 0.7 * (1 - u));
      ctx.globalCompositeOperation = 'source-over';
      for (let i = 0; i < 7; i++) {
        const ang = -Math.PI * 0.75 + (i / 6) * Math.PI * 1.5 + (hash(i + 3) - 0.5) * 0.3;
        const d = 3 + ease(u) * (10 + hash(i) * 8);
        star(ctx, cx + Math.cos(ang) * d + u * 4, cy + Math.sin(ang) * d, 2.4 * (1 - u * 0.6), 1 - u, i % 2 ? '#ffd86a' : '#fff6c8', u * 3 + i);
      }
    }
  }
  // Star Dash: stars streaming behind the pair as they dart forward
  if (mv?.dash) {
    const [t0, t1] = mv.dash;
    if (t >= t0 && t < t1 + 0.4) {
      const k = clamp(1 - (t - t1) / 0.4, 0, 1);
      for (let i = 0; i < 8; i++) {
        const u = ((t * 3 + i / 8) % 1);
        const x = S.x - H * 0.1 - u * H * 0.6;
        const y = -H * (0.35 + 0.3 * hash(i)) + Math.sin(u * 5 + i) * 2;
        // (each one fading in as it's shed, not popping in whole at the head of the trail, 2026-11-26)
        star(ctx, x, y, 2 * (1 - u), k * (1 - u) * Math.min(1, u * 6), i % 2 ? '#ffd86a' : '#fff6c8', u * 4);
      }
    }
  }
  ctx.restore();
}

const R = twinRig({ day: dayDesign, night: nightDesign, daySkin: DAY.skin, nightSkin: NIGHT.skin, mouth: MOUTH, lockF: LOCK_F, lockN: LOCK_N, ahoge: AHOGE_ROOT, sash: SASH, crown: CROWN, fx: twinFx });
export const TWIN_ART = { pad: 14, walk: 8, idle: 8, attack: 5, stride: R.stride, atkMs: [100, 180, 300, 220], draw: R.still, rig: R.rig, noHop: true };
export const TWIN_SIZE = { w: 34, h: Math.round(R.H * 0.92) };
