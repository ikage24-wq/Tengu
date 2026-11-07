// The Arbalist Engineer's effects, drawn by hand (world/melee.js, data/skills.js): her steam (real
// billowing clouds, white to warm grey, jetting the way it vents and rising as it thins), a pool of
// workshop hits so no two hits in a row look alike (a bolt thunking home in a spray of sparks, a
// burst of brass cogs, a spring boinging loose, a hiss of steam and flying rivets), and Overclock's
// great brass gear spinning up behind her.

const TAU = Math.PI * 2;
const STEAM = ['#ffffff', '#eef2f4', '#c9d2d8', '#97a4ae'];
const BRASS = ['#ffe6a0', '#e8b450', '#b07a2a', '#5e3c14'];
const TEAL = '#4fe0c8';
const ease = (u) => 1 - (1 - Math.min(1, Math.max(0, u))) ** 3;
const rand = (n) => {
  const v = Math.sin(n * 91.7 + 17.3) * 43758.5453;
  return v - Math.floor(v);
};

// ---------- Steam ----------
function puff(ctx, x, y, r, a) {
  if (r <= 0.5 || a <= 0) return;
  ctx.globalAlpha = a;
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.4, r * 0.1, x, y, r);
  g.addColorStop(0, STEAM[0]);
  g.addColorStop(0.6, STEAM[1]);
  g.addColorStop(1, STEAM[2]);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}
// A cloud of steam `w` across, jetting toward `dir` (0: straight up) and rising as it thins.
export function drawSteam(ctx, x, y, w, p, dir = 0, seed = 0) {
  const k0 = ctx.globalAlpha;
  const n = Math.max(5, Math.round(w / 9));
  const out = ease(p * 1.5);
  ctx.save();
  for (let k = 0; k < n; k++) {
    const u = (k + rand(seed + k) * 0.6) / n;
    const spread = (rand(seed + k * 3) - 0.5) * w * 0.5;
    const px = x + (dir ? dir * u * w * out : spread * out * 1.6);
    const py = y - 6 - (dir ? Math.abs(spread) * 0.3 + p * w * 0.3 * u : u * w * 0.7 * out) - p * 10;
    const r = (w / 8) * (0.5 + u * 0.9) * (0.5 + 0.6 * out);
    const fade = Math.max(0, 1 - Math.max(0, p - 0.3) / 0.7);
    puff(ctx, px, py, r, k0 * fade * 0.9);
  }
  ctx.restore();
}

// ---------- Little things ----------
function cog(ctx, x, y, r, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = BRASS[1];
  ctx.strokeStyle = BRASS[3];
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  const teeth = 8;
  for (let k = 0; k < teeth * 2; k++) {
    const a = (k / (teeth * 2)) * TAU;
    const rr = k % 2 ? r : r * 0.78;
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = BRASS[0];
  ctx.beginPath();
  ctx.arc(-r * 0.15, -r * 0.15, r * 0.35, 0, TAU);
  ctx.fill();
  ctx.fillStyle = BRASS[3];
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.22, 0, TAU);
  ctx.fill();
  ctx.restore();
}
function sparks(ctx, x, y, n, len, p, seed, dir = 0) {
  ctx.lineCap = 'round';
  for (let k = 0; k < n; k++) {
    const a = dir ? Math.PI * (dir > 0 ? 1 : 0) + (rand(seed + k) - 0.5) * 2.2 - Math.PI * 0.15 : rand(seed + k) * TAU;
    const d = len * ease(p * 1.6) * (0.5 + 0.5 * rand(seed + k * 5));
    const sx = x + Math.cos(a) * d;
    const sy = y + Math.sin(a) * d + 10 * p * p;
    ctx.strokeStyle = k % 3 ? '#ffd27a' : '#fff6d8';
    ctx.lineWidth = 1.4 * (1 - p);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx - Math.cos(a) * 4 * (1 - p), sy - Math.sin(a) * 4 * (1 - p));
    ctx.stroke();
  }
}
function flash(ctx, x, y, r) {
  if (r <= 0.5) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.4, 'rgba(160,255,236,0.9)');
  g.addColorStop(1, 'rgba(79,224,200,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}

// ---------- Hits ----------
const TRICKS = ['thunk', 'cogs', 'spring', 'hiss'];
function workshopHit(ctx, f, x, y, p) {
  const big = f.big || f.crit;
  const s = big ? 1.35 : 1;
  const seed = Math.floor((f.seed ?? 0.5) * 1000);
  const trick = TRICKS[seed % TRICKS.length];
  const d = -(f.dir || 1);
  ctx.save();
  if (p < 0.25) {
    ctx.globalAlpha = 1 - p / 0.25;
    flash(ctx, x, y, 12 * s);
  }
  ctx.globalAlpha = Math.max(0, 1 - Math.max(0, p - 0.5) / 0.5);
  if (trick === 'thunk') {
    // The bolt thunks home, quivering, and sparks spray back the way it came.
    const q = Math.sin(p * 50) * 2 * (1 - p);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(q * 0.05);
    ctx.strokeStyle = '#3a2a1a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(d * 14 * s, -2);
    ctx.stroke();
    ctx.fillStyle = TEAL;
    ctx.fillRect(d * 12 * s - 1.5, -4, 3, 4);
    ctx.restore();
    sparks(ctx, x, y, 9, 22 * s, p, seed, -d);
  } else if (trick === 'cogs') {
    // A burst of brass cogs spinning out and falling.
    for (let k = 0; k < 4; k++) {
      const a = -Math.PI / 2 + (k - 1.5) * 0.7;
      const e = ease(p * 1.4);
      cog(ctx, x + Math.cos(a) * 20 * s * e, y + Math.sin(a) * 16 * s * e + 20 * p * p, (2.6 + (k % 2)) * s, p * 12 * (k % 2 ? 1 : -1));
    }
    sparks(ctx, x, y, 5, 14 * s, p, seed);
  } else if (trick === 'spring') {
    // A coil spring boings out of the hit, bouncing up and wobbling.
    const up = Math.sin(Math.PI * Math.min(1, p * 1.4)) * 22 * s;
    const sx = x + (f.dir || 1) * 8 * ease(p * 2);
    ctx.strokeStyle = '#c9d2d8';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let k = 0; k <= 16; k++) {
      const u = k / 16;
      const px = sx + Math.sin(u * TAU * 3.5) * 3 * s;
      const py = y - u * (6 + up * 0.5) - up * 0.5;
      if (k) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    ctx.stroke();
    sparks(ctx, x, y, 6, 16 * s, p, seed);
  } else {
    // A hiss of steam and rivets flying.
    drawSteam(ctx, x, y + 8, 26 * s, p, 0, seed);
    ctx.globalAlpha = Math.max(0, 1 - p);
    ctx.fillStyle = '#5e6670';
    for (let k = 0; k < 5; k++) {
      const a = rand(seed + k * 9) * TAU;
      const e = ease(p * 1.5) * 18 * s;
      ctx.beginPath();
      ctx.arc(x + Math.cos(a) * e, y + Math.sin(a) * e + 12 * p * p, 1.4, 0, TAU);
      ctx.fill();
    }
  }
  // A thin teal ring only on big hits, so a crowd of hits never turns into a stack of rings.
  if (big) {
    ctx.globalAlpha = Math.max(0, 1 - p);
    ctx.strokeStyle = TEAL;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, 8 + 18 * ease(p * 1.3), 0, TAU);
    ctx.stroke();
  }
  ctx.restore();
}

// ---------- Overclock ----------
// A great brass gear rising behind her and spinning up faster and faster, a pressure gauge's needle
// swinging into the red, steam jetting from both sides.
function overclock(ctx, x, y, p) {
  const a = Math.max(0, Math.min(1, p * 5, (1 - p) * 3));
  const rise = ease(p * 3);
  const spin = p * p * 30;
  ctx.save();
  ctx.globalAlpha = a * 0.85;
  cog(ctx, x, y - 26 - 6 * rise, 26 * rise, spin);
  ctx.globalAlpha = a;
  // The gauge.
  const gx = x;
  const gy = y - 26 - 6 * rise;
  ctx.fillStyle = '#f6efe0';
  ctx.strokeStyle = BRASS[3];
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(gx, gy, 8 * rise, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#d23a2e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(gx, gy, 6 * rise, -Math.PI * 0.25, 0.1);
  ctx.stroke();
  const n = -Math.PI * 0.9 + Math.PI * 0.95 * ease(p * 1.6) + Math.sin(p * 60) * 0.06;
  ctx.strokeStyle = '#2a2a2a';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(gx, gy);
  ctx.lineTo(gx + Math.cos(n) * 6 * rise, gy + Math.sin(n) * 6 * rise);
  ctx.stroke();
  ctx.restore();
  for (const d of [-1, 1]) {
    ctx.save();
    ctx.globalAlpha = a;
    drawSteam(ctx, x + d * 22, y - 18, 34, (p * 2) % 1, d, d > 0 ? 3 : 7);
    ctx.restore();
  }
}

export function drawArbalistFx(ctx, f, x, y, p) {
  switch (f.kind) {
    case 'aehit':
      workshopHit(ctx, f, x, y - (f.h ?? 40) * 0.55, p);
      return true;
    case 'aesteam': {
      // (Steam Vent's blast, `big`, is as wide as it reaches; a muzzle puff, `small`, still reads.)
      const seed = Math.floor((f.x ?? 0) * 0.31);
      if (f.big) {
        // (Steam Vent blasts out both ways along the floor round her.)
        for (const d of [-1, 1]) drawSteam(ctx, x, y, f.r ?? 130, p, d, seed + d);
        drawSteam(ctx, x, y, 60, p, 0, seed + 5);
      } else drawSteam(ctx, x, y, f.small ? 22 : 50, p, 0, seed);
      return true;
    }
    case 'aeclockfx':
      overclock(ctx, x, y, p);
      return true;
    default:
      return false;
  }
}
