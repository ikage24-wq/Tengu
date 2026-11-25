// The Blanket Sulk on screen (2026-11-25, The Sulk remade on the spirit base, the player's pick "C"):
// the storm cloud of the Sky Whale's sadness, a sulky little spirit who won't come out from under his
// storm-cloud duvet. He moves on his own copy of the spirit rig (sulkrig.js: its bones, hover, glide,
// moves and springs, his pieces from art.js), drawn big for a boss; this adds his weather:
//   - rain always falling from the duvet's hem (none once the storm has cleared);
//   - a tear rolling off his cheek now and then;
//   - the lightning curl on his hood crackling;
//   - his casts' own weather round him: drizzle and downpour thicken the rain, bolt and forked
//     crackle round his raised arm, grumble rumbles in little dark puffs, cloudburst swirls rain up
//     round him, umbrella shivers drops off the duvet;
//   - the duvet slap: a splash of rain off the duvet as it lands;
//   - cleared: little sparkles round him, white and fluffy.
import { sulkRig } from './sulkrig.js';
import { sulkDesign, SKIN_COLORS, MOUTH, BOLT, HEM, PLUSH_C } from './art.js';
import { clamp } from '../mobs/rig.js';

const TAU = Math.PI * 2;
const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
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
function drop(ctx, x, y, r, al) {
  if (al <= 0.01) return;
  ctx.globalAlpha = al;
  ctx.fillStyle = '#bfe4ff';
  ctx.beginPath();
  ctx.moveTo(x, y - r * 1.6);
  ctx.quadraticCurveTo(x + r, y - r * 0.2, x, y + r);
  ctx.quadraticCurveTo(x - r, y - r * 0.2, x, y - r * 1.6);
  ctx.fill();
  ctx.globalAlpha = 1;
}
// A little forked spark of lightning between two points.
function zap(ctx, x0, y0, x1, y1, seed, al) {
  if (al <= 0.01) return;
  ctx.globalAlpha = al;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const pts = [[x0, y0]];
  for (let i = 1; i < 4; i++) {
    const u = i / 4;
    pts.push([x0 + (x1 - x0) * u + (hash(seed + i) - 0.5) * 3, y0 + (y1 - y0) * u + (hash(seed + i + 9) - 0.5) * 3]);
  }
  pts.push([x1, y1]);
  for (const [c, w] of [['#fff6c8', 1.8], ['#ffe066', 0.8]]) {
    ctx.strokeStyle = c;
    ctx.lineWidth = w;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// Under him: the rain falling from the duvet's hem down to the ground (thicker in the rainy casts).
function under(ctx, m, a, S, matOf, K, H) {
  if (a.sulkClear || m?.hp <= 0) return;
  const hm = K.through(matOf('torso'), 'hemJ', 'hip');
  const kind = a.mo?.rig?.sulkKind;
  const heavy = kind === 'downpour' || kind === 'drizzle' || kind === 'cloudburst' ? 2 : 1;
  ctx.save();
  ctx.strokeStyle = '#b4dcff';
  ctx.lineWidth = 0.55;
  ctx.lineCap = 'round';
  const n = 10 * heavy;
  for (let k = 0; k < n; k++) {
    const u = (a.t * (1.4 + heavy * 0.3) + k * (0.61 / heavy) + hash(k) * 0.3) % 1;
    const x = hm[0] - H * 0.28 + (k / (n - 1)) * H * 0.56 - u * 2.4;
    const y = hm[1] + u * (-hm[1]);
    ctx.globalAlpha = (a.alpha ?? 1) * 0.75 * Math.min(1, (1 - u) * 4, u * 8);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 0.6, y + 2.6);
    ctx.stroke();
  }
  ctx.restore();
}

function sulkFx(ctx, m, a, S, matOf, K, H) {
  if (m?.hp <= 0) return;
  const mv = a.blMove?.mv;
  const t = a.blMove?.t ?? 0;
  ctx.save();
  if (a.sulkClear) {
    // cleared: sparkles round him
    const c = K.through(matOf('chest'), 'ribs', 'ribs');
    for (let i = 0; i < 4; i++) {
      const u = ((a.t * 0.6 + i / 4) % 1);
      const an = hash(i + Math.floor(a.t * 0.6)) * TAU;
      twinkle(ctx, c[0] + Math.cos(an) * H * 0.4, c[1] - H * 0.2 + Math.sin(an) * H * 0.3 - u * 4, 2 * Math.sin(Math.PI * u), Math.sin(Math.PI * u), i % 2 ? '#fff6c8' : '#ffffff');
    }
    ctx.restore();
    return;
  }
  // a tear rolling off his cheek now and then
  const mo = K.through(matOf('headJ'), 'mouthS', 'neck');
  const u = (a.t * 0.35 + (m.uid % 5) * 0.2) % 1;
  if (u < 0.6) drop(ctx, mo[0] - H * 0.06, mo[1] - H * 0.04 + u * H * 0.3, 1, Math.min(1, (0.6 - u) * 4));
  // the lightning curl crackles
  const b = K.through(matOf('headJ'), 'boltJ', 'neck');
  if (Math.sin(a.t * 7 + 1) > 0.85) twinkle(ctx, b[0] + 2, b[1] - 6, 2.2, 1, '#fff6a8');
  // sniffles: extra tears dripping off his chin
  if ((a.sulkSniff ?? 0) > 0.3) {
    for (let i = 0; i < 2; i++) {
      const v = ((a.t * 1.2 + i * 0.5) % 1);
      drop(ctx, mo[0] + (i ? 5 : -5), mo[1] + 2 + v * H * 0.25, 0.9, a.sulkSniff * (1 - v));
    }
  }
  // "hmph": little puffs of steam off the top of his hood
  if ((a.sulkHmph ?? 0) > 0.3) {
    const top = K.through(matOf('headJ'), 'boltJ', 'neck');
    for (let i = 0; i < 3; i++) {
      const v = ((a.t * 1.5 + i / 3) % 1);
      ctx.globalAlpha = a.sulkHmph * Math.sin(Math.PI * v) * 0.85;
      ctx.fillStyle = '#f2f4ff';
      ctx.beginPath();
      ctx.ellipse(top[0] - 10 + (i - 1) * 6 + v * 3, top[1] - 4 - v * 12, 2.4 + v * 2, 2 + v * 1.6, 0, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  // jolted awake: his lightning crackles all round his hood
  if ((a.sulkJolt ?? -1) >= 0) {
    const v = a.sulkJolt;
    const seed = Math.floor(a.t * 20);
    for (let i = 0; i < 3; i++) {
      const an = -Math.PI * 0.85 + i * 0.6;
      zap(ctx, b[0] - 4, b[1] + 4, b[0] - 4 + Math.cos(an) * (10 + v * 6), b[1] + 4 + Math.sin(an) * (10 + v * 6), seed + i * 5, 1 - v);
    }
  }
  const kind = a.mo?.rig?.sulkKind;
  const ct = m.cast ? a.now - m.cast.t0 : 0;
  if (kind === 'bolt' || kind === 'forked') {
    const h = K.through(matOf('handN'), 'handN', 'wrN');
    const seed = Math.floor(a.t * 14);
    zap(ctx, h[0], h[1], h[0] + (hash(seed) - 0.3) * 12, h[1] - 6 - hash(seed + 3) * 8, seed, 0.9);
    if (kind === 'forked') zap(ctx, b[0], b[1] - 4, b[0] + (hash(seed + 5) - 0.5) * 14, b[1] - 14, seed + 7, 0.9);
  }
  if (kind === 'grumble') {
    // little dark rumble puffs round him, trembling
    const c = K.through(matOf('chest'), 'ribs', 'ribs');
    for (let i = 0; i < 4; i++) {
      const an = (i / 4) * TAU + a.t * 0.8;
      const r = H * (0.3 + 0.03 * Math.sin(a.t * 30 + i));
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = '#6a76a8';
      ctx.beginPath();
      ctx.ellipse(c[0] + Math.cos(an) * r, c[1] + Math.sin(an) * r * 0.6, 3.4, 2.6, 0, 0, TAU);
      ctx.fill();
    }
  }
  if (kind === 'cloudburst') {
    // rain swirling up round him as it builds
    const c = K.through(matOf('chest'), 'ribs', 'ribs');
    for (let i = 0; i < 10; i++) {
      const an = (i / 10) * TAU + a.t * 3;
      const r = H * (0.25 + Math.min(1, ct / 2) * 0.2);
      drop(ctx, c[0] + Math.cos(an) * r, c[1] + Math.sin(an) * r * 0.5, 0.9, 0.8);
    }
  }
  if (kind === 'umbrella') {
    // drops shivered off the duvet
    const c = K.through(matOf('chest'), 'ribs', 'ribs');
    for (let i = 0; i < 3; i++) {
      const v = ((a.t * 2 + i / 3) % 1);
      drop(ctx, c[0] + (i - 1) * H * 0.22 + (i - 1) * v * 4, c[1] + v * H * 0.3, 0.9, 1 - v);
    }
  }
  // the duvet slap: a splash of rain off the duvet as it lands
  if (mv?.slap) {
    const v = (t - mv.slap[0]) / 0.4;
    if (v >= 0 && v < 1) {
      const h = K.through(matOf('handN'), 'handN', 'wrN');
      for (let i = 0; i < 6; i++) {
        const an = -Math.PI * 0.9 + (i / 5) * Math.PI * 0.8;
        const d = 3 + v * (8 + hash(i) * 6);
        drop(ctx, h[0] + Math.cos(an) * d + 4, h[1] + Math.sin(an) * d + v * v * 8, 1.1, 1 - v);
      }
    }
  }
  ctx.restore();
}

// (drawn big, for a boss: the whole rig scaled, as The Sulk always was)
const BIG = 1.9;
const R = sulkRig({ design: sulkDesign, skin: SKIN_COLORS, mouth: MOUTH, bolt: BOLT, hem: HEM, plush: PLUSH_C, fx: sulkFx, under });
const rig = R.rig;
const draw0 = rig.draw;
rig.draw = (ctx, m, a) => {
  ctx.save();
  ctx.scale(BIG, BIG);
  draw0(ctx, m, a);
  ctx.restore();
};
rig.w = Math.round(rig.w * BIG);
rig.h = Math.round(rig.h * BIG);
export const SULK_ART = { pad: 14, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [110, 180, 340, 240], draw: R.still, rig, noHop: true };
export const SULK_SIZE = { w: Math.round(36 * BIG), h: Math.round(R.H * 0.92 * BIG) };
