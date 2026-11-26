// The Myconid Shaman's effects (2026-11-26, Jaxby the blue jay): drawn through the game's own effect
// hooks (render/dreamfx.js gathers them): its shot, the 'spit' vfx with `shot: 'acorn'`, and its
// own move's zone look, 'feathers' (world/dungeon.js mobMove 'cloud' with `look`).
//   acorn     its Acorn Flick: an acorn spinning end over end, white speed lines streaming behind.
//   feathers  its Feather Flurry: the warning (`p` 0..1 over the zone's warning) blue and white
//             feathers spiralling slowly down onto the spot, a soft blue shadow gathering under
//             them; then the landing (`u` 0..1 over SHAMAN_HOLD.feathers) a slow fall of downy
//             feathers over the spot, each rocking side to side as a real feather falls, a soft drift
//             of them settled on the floor, fading out.
// Feathers and the drift are outlined in a deeper tone of their own colour (never near-black).

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mix = (a, b, u) => a + (b - a) * u;
const sstep = (u) => {
  const v = clamp(u, 0, 1);
  return v * v * (3 - 2 * v);
};
const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const ell = (ctx, x, y, rx, ry, r = 0) => {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), r, 0, TAU);
};

// An acorn: a round nut under a cap with a little stem, a pale light on the nut, outlined in its
// own deeper brown. (Also drawn by the jay's rig: held in its beak, tossed and cached.)
export function acorn(ctx, x, y, s, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ell(ctx, 0, s * 0.35, s * 0.8, s * 0.95);
  ctx.fillStyle = '#d99a5a';
  ctx.fill();
  ctx.lineWidth = Math.max(0.35, s * 0.28);
  ctx.strokeStyle = '#a8693a';
  ctx.stroke();
  ell(ctx, 0, -s * 0.3, s * 0.95, s * 0.5);
  ctx.fillStyle = '#9b6a44';
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.75);
  ctx.lineTo(s * 0.15, -s * 1.15);
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(0.3, s * 0.25);
  ctx.strokeStyle = '#7a5034';
  ctx.stroke();
  ell(ctx, -s * 0.3, s * 0.2, s * 0.22, s * 0.3);
  ctx.fillStyle = '#f2c088';
  ctx.fill();
  ctx.restore();
}

// A downy feather: a soft curved vane, blue or white, a pale shaft, outlined in its own deeper tone.
export function feather(ctx, x, y, s, rot, blue, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.quadraticCurveTo(s * 0.7, -s * 0.2, s * 0.1, s);
  ctx.quadraticCurveTo(-s * 0.55, -s * 0.1, 0, -s);
  ctx.fillStyle = blue ? '#a9c0f6' : '#f6f8ff';
  ctx.fill();
  ctx.lineWidth = Math.max(0.3, s * 0.16);
  ctx.lineJoin = 'round';
  ctx.strokeStyle = blue ? '#6d8ad6' : '#b9c6e6';
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.8);
  ctx.quadraticCurveTo(s * 0.12, 0, s * 0.1, s * 1.25);
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(0.2, s * 0.1);
  ctx.strokeStyle = blue ? '#e4ecff' : '#d4dcf2';
  ctx.stroke();
  ctx.restore();
}

// Its shot, in flight (`p` 0..1 along it, `d` the way it flies). Returns true if it drew.
export function shamanShot(ctx, shot, x, y, p, d) {
  if (shot !== 'acorn') return false;
  ctx.save();
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const yy = y - 2 + i * 2;
    ctx.globalAlpha = 0.75 - i * 0.15;
    ctx.beginPath();
    ctx.moveTo(x - d * (6 + i * 1.5), yy);
    ctx.lineTo(x - d * (14 + i * 3 + (i === 1 ? 3 : 0)), yy);
    ctx.lineWidth = 1.1;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
  }
  ctx.restore();
  acorn(ctx, x, y, 3.2, p * 14 * d);
  return true;
}

// A soft drift on the floor: overlapping flat rounds, outlined only on the outer edge in its own
// deeper blue, lighter on top; laid down see-through as one.
function drift(ctx, x, y, w, k, al) {
  if (al <= 0.01 || k <= 0.01) return;
  const list = [];
  for (let i = 0; i < 7; i++) {
    const s = i / 6 - 0.5;
    const h = 1 - Math.abs(s) * 1.5;
    list.push([x + s * w * 0.86, y - 1.6 - h * 1.6 * k, (5 + h * 4) * k * (w / 70), (2 + h * 1.5) * k]);
  }
  ctx.save();
  ctx.globalAlpha *= al;
  for (const [px, py, rx, ry] of list) {
    ell(ctx, px, py, rx + 0.7, ry + 0.7);
    ctx.fillStyle = '#9fb3e6';
    ctx.fill();
  }
  ctx.beginPath();
  for (const [px, py, rx, ry] of list) {
    ctx.moveTo(px + rx, py);
    ctx.ellipse(px, py, rx, ry, 0, 0, TAU);
  }
  const g = ctx.createLinearGradient(0, y - 8, 0, y);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(1, '#e2eaff');
  ctx.fillStyle = g;
  ctx.fill('nonzero');
  ctx.restore();
}

export const SHAMAN_HOLD = { feathers: 1.4 };
export const SHAMAN_FX = {
  feathers: {
    warn(ctx, z, x, y, p, time) {
      const k = sstep(p / 0.8);
      const r = z.w / 2;
      ell(ctx, x, y - 0.6, r * k, 2.6 * k);
      ctx.fillStyle = `rgba(206,220,255,${0.5 * k})`;
      ctx.fill();
      for (let i = 0; i < 9; i++) {
        const ph = clamp(p * 1.3 - i * 0.05, 0, 1);
        const q = (i / 9) * TAU + time * 1.2;
        const al = sstep(ph * 5) * (1 - sstep((ph - 0.92) / 0.08));
        feather(ctx, x + Math.cos(q) * mix(r * 0.7, r * 0.35, ph), y + mix(-60, -10, ph) + Math.sin(q) * 3, 2.4, Math.sin(time * 3 + i) * 0.8, i % 2 === 0, al);
      }
    },
    hit(ctx, z, x, y, u, e, fade, time) {
      const r = z.w / 2;
      const k = sstep(u / 0.2);
      drift(ctx, x, y, z.w, k, 0.9 * fade);
      for (let i = 0; i < 16; i++) {
        // (each feather falls on its own slow clock, rocking side to side as it goes)
        const v = clamp(u * 1.4 + hash(i + 5) * 0.4 - 0.3, 0, 1);
        const sway = Math.sin(v * TAU * 1.5 + i);
        const fx = x + (hash(i + 1) - 0.5) * r * 1.8 + sway * 5;
        const fy = y - 52 + v * 48 - hash(i + 2) * 8;
        feather(ctx, fx, fy, 2.2 + hash(i + 9) * 0.8, sway * 0.7, i % 3 === 0, k * fade * Math.min(1, (1 - v) * 4 + 0.3));
      }
    },
  },
};
