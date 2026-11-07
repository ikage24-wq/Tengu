// What sets the warriors' three weapons apart in their cuts and hits (render/effects.js bladeCut and
// the blade-hit spark), drawn by hand over the path's own swipe and mark, in the path's own colour:
//   sword  a glint of light racing along the cut's edge; its hits a crisp cross with a star glint
//   axe    embers flung off the heavy arc's end; its hits a chunky impact, splinters and dust
//   spear  speed lines streaking along the thrust; its hits a puncture ring, a streak out the back
// The Warrior's steel, the Paladin's gold and the Berserker's red each tint them.

const TAU = Math.PI * 2;
const TINT = {
  steel: { hot: '#ffffff', mid: '#cfe6ff', deep: '#6f9fd8' },
  holy: { hot: '#fffbe6', mid: '#ffe38a', deep: '#e0a83a' },
  rage: { hot: '#fff0e0', mid: '#ff8a5c', deep: '#c8262e' },
};
const ease = (u) => 1 - (1 - Math.min(1, Math.max(0, u))) ** 3;
const rand = (n) => {
  const v = Math.sin(n * 57.3 + 9.1) * 43758.5453;
  return v - Math.floor(v);
};
const tintOf = (path) => TINT[path] ?? TINT.steel;
const WEAPONS = new Set(['sword', 'axe', 'spear']);

function star(ctx, x, y, r, color) {
  if (r <= 0.3) return;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r * 0.22, y - r * 0.22);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x + r * 0.22, y + r * 0.22);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r * 0.22, y + r * 0.22);
  ctx.lineTo(x - r, y);
  ctx.lineTo(x - r * 0.22, y - r * 0.22);
  ctx.closePath();
  ctx.fill();
}

// Over a cut: `cx, cy` its middle, `mid` the angle of the middle of its sweep, `r` its radius, `cw`
// which way round it went.
export function weaponTrail(ctx, f, cx, cy, mid, r, cw, p) {
  const w = f.weapon;
  if (!WEAPONS.has(w) || f.flat) return;
  const T = tintOf(f.path);
  const s = cw ? 1 : -1;
  const e = ease(p * 1.3);
  ctx.save();
  if (w === 'sword') {
    // The glint racing along the edge, a thin hot line trailing it.
    const a = mid + s * (-1.1 + 2.2 * e);
    ctx.globalAlpha = Math.max(0, 1 - Math.max(0, p - 0.5) * 2);
    ctx.strokeStyle = T.hot;
    ctx.lineWidth = 1.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.08, Math.min(a, a - s * 0.5), Math.max(a, a - s * 0.5));
    ctx.stroke();
    star(ctx, cx + Math.cos(a) * r * 1.08, cy + Math.sin(a) * r * 1.08, 5 * (1 - p * 0.6), T.hot);
  } else if (w === 'axe') {
    // Embers flung off the end of the arc as the heavy head comes through.
    const end = mid + s * 1.1;
    const ex = cx + Math.cos(end) * r;
    const ey = cy + Math.sin(end) * r;
    const q = Math.max(0, (p - 0.3) / 0.7);
    if (q > 0) {
      ctx.globalAlpha = Math.max(0, 1 - q);
      for (let k = 0; k < 10; k++) {
        const a = end + s * Math.PI * 0.5 + (rand(k + (f.seed ?? 0) * 99) - 0.5) * 1.4;
        const d = 8 + 26 * ease(q) * (0.5 + rand(k * 3));
        ctx.fillStyle = k % 2 ? T.mid : T.hot;
        const sz = k % 3 ? 2.4 : 3.4;
        ctx.fillRect(ex + Math.cos(a) * d - sz / 2, ey + Math.sin(a) * d + 14 * q * q - sz / 2, sz, sz);
      }
    }
  } else {
    // Speed lines streaking out along the thrust.
    const dir = f.dir || 1;
    ctx.globalAlpha = Math.max(0, 1 - p * 1.3);
    ctx.strokeStyle = T.mid;
    ctx.lineCap = 'round';
    for (let k = 0; k < 3; k++) {
      const len = r * (1.2 + 0.3 * k) * e;
      const x0 = cx + dir * r * 0.2;
      ctx.lineWidth = k === 1 ? 1.8 : 1;
      ctx.beginPath();
      ctx.moveTo(x0 + dir * len * 0.3, cy + (k - 1) * 5);
      ctx.lineTo(x0 + dir * len, cy + (k - 1) * 5);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// A blade hit's extra, by weapon, drawn over the path's own mark.
export function weaponHit(ctx, f, x, y, p) {
  const w = f.weapon;
  if (!WEAPONS.has(w)) return;
  const T = tintOf(f.path);
  const seed = Math.floor((f.seed ?? 0.5) * 1000);
  const dir = f.dir || 1;
  const e = ease(p * 1.4);
  ctx.save();
  ctx.globalAlpha = Math.max(0, 1 - p);
  if (w === 'sword') {
    // A star glint off one end of the cut.
    const a = rand(seed) * TAU;
    star(ctx, x + Math.cos(a) * 10, y + Math.sin(a) * 10, 6 * (1 - p * 0.5), T.hot);
  } else if (w === 'axe') {
    // A heavy flash, splinters and chips flying, a puff of dust thrown down.
    if (p < 0.25) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, 16);
      g.addColorStop(0, T.hot);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, 16, 0, TAU);
      ctx.fill();
    }
    for (let k = 0; k < 6; k++) {
      const a = -Math.PI / 2 + dir * (0.3 + rand(seed + k) * 1.6);
      const d = 24 * e * (0.5 + 0.5 * rand(seed + k * 7));
      ctx.save();
      ctx.translate(x + Math.cos(a) * d, y + Math.sin(a) * d + 18 * p * p);
      ctx.rotate(p * 9 + k);
      ctx.fillStyle = k % 2 ? '#8a6a4a' : '#c9a27a';
      ctx.fillRect(-2.2, -1, 4.4, 2);
      ctx.restore();
    }
    ctx.globalAlpha = Math.max(0, 1 - p) * 0.6;
    ctx.fillStyle = '#e8dcc8';
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      ctx.arc(x + (k - 1) * 8 * e, y + 10 + 4 * e, 5 + 4 * e, 0, TAU);
      ctx.fill();
    }
  } else {
    // A puncture: a tight ring snapping open and a streak shooting out the far side.
    ctx.strokeStyle = T.hot;
    ctx.lineWidth = Math.max(0.3, 1.6 * (1 - p));
    ctx.beginPath();
    ctx.ellipse(x, y, 4 + 9 * e, 3 + 6 * e, 0, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = T.mid;
    ctx.lineWidth = Math.max(0.3, 2 * (1 - p));
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + dir * 6, y);
    ctx.lineTo(x + dir * (10 + 30 * e), y);
    ctx.stroke();
  }
  ctx.restore();
}

// A spear's thrust (a cut that barely sweeps): a lance of light from her hands out past the tip,
// tapering to a point, with a bright core.
export function thrustStreak(ctx, f, hx, hy, tx, ty, p) {
  const T = tintOf(f.path);
  const a = Math.atan2(ty - hy, tx - hx);
  const len = Math.hypot(tx - hx, ty - hy) * 1.5 * ease(p * 2.2);
  const fade = Math.max(0, 1 - Math.max(0, p - 0.3) / 0.7);
  ctx.save();
  ctx.translate(hx, hy);
  ctx.rotate(a);
  ctx.globalAlpha = fade * 0.85;
  ctx.fillStyle = T.mid;
  ctx.beginPath();
  ctx.moveTo(len * 0.15, -4);
  ctx.lineTo(len, 0);
  ctx.lineTo(len * 0.15, 4);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = fade;
  ctx.fillStyle = T.hot;
  ctx.beginPath();
  ctx.moveTo(len * 0.3, -1.5);
  ctx.lineTo(len * 1.02, 0);
  ctx.lineTo(len * 0.3, 1.5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Rock torn up along a heavy blow's crack: chunks of stone thrown high and falling, dust rolling
// out, `w` wide.
export function rockBurst(ctx, x, y, w, p, seed = 0) {
  ctx.save();
  for (let k = 0; k < 12; k++) {
    const ox = (rand(seed + k) - 0.5) * w;
    const up = (40 + 60 * rand(seed + k * 3)) * Math.sin(Math.PI * Math.min(1, p * 1.3));
    const r = 2.5 + 3 * rand(seed + k * 5);
    ctx.globalAlpha = Math.max(0, 1 - Math.max(0, p - 0.6) / 0.4);
    ctx.save();
    ctx.translate(x + ox * (1 + p * 0.4), y - up);
    ctx.rotate(p * 8 * (k % 2 ? 1 : -1));
    ctx.fillStyle = k % 3 ? '#8a7a6a' : '#b4a48e';
    ctx.strokeStyle = '#4a3e34';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-r, -r * 0.4);
    ctx.lineTo(-r * 0.2, -r);
    ctx.lineTo(r, -r * 0.3);
    ctx.lineTo(r * 0.6, r);
    ctx.lineTo(-r * 0.7, r * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.globalAlpha = Math.max(0, 1 - p) * 0.55;
  ctx.fillStyle = '#e4d8c4';
  for (let k = 0; k < 8; k++) {
    const d = (k / 7 - 0.5) * w * (0.6 + 0.6 * ease(p));
    ctx.beginPath();
    ctx.arc(x + d, y - 4 - 6 * ease(p), 8 + 8 * ease(p), 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

