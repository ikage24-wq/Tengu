// The dancers' hits, shuffled hit to hit so a string of blows never stamps the same mark down the
// line (render/warrior-fx.js hitMark and the wdhit/bdhit/skyhit cases). Each pool keeps her own
// sprite mark as one of four, a size smaller, and adds three drawn by hand in her colours:
//   Wind Dancer (coral)    her ribbon wheel; a coral ribbon looping off; a burst of petals; a gust
//                          of wind lines with a feather
//   Blade Dancer (rosegold) her hoop; gold coins spinning out; two hoops snapping across; a pop of
//                          gold stars
//   Sky Dancer (aerial)    her wind star; a spiral gust; a puff of cloud; feathers scattering
//   Acrobat Archer (acro)  her gold star in mint ribbon; a mint ribbon looping off; a burst of
//                          confetti; a pop of gold stars

import { fxSprite } from './fx-sprites.js';

const TAU = Math.PI * 2;
const ease = (u) => 1 - (1 - Math.min(1, Math.max(0, u))) ** 3;
const rand = (n) => {
  const v = Math.sin(n * 73.1 + 5.3) * 43758.5453;
  return v - Math.floor(v);
};
const SPRITE = { coral: 'celwdhit', rosegold: 'celbdhit', aerial: 'celskyhit', acro: 'celachit' };
const COL = {
  coral: { a: '#ff7a6b', b: '#ffd9c2', c: '#fff6ea' },
  rosegold: { a: '#f2b45a', b: '#ffe2a8', c: '#fff8e6' },
  aerial: { a: '#8ad8ff', b: '#d8f4ff', c: '#ffffff' },
  acro: { a: '#5fe0b4', b: '#ffd35a', c: '#fffbe8' },
};

function star(ctx, x, y, r, color) {
  if (r <= 0.3) return;
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * TAU - Math.PI / 2;
    const rr = k % 2 ? r * 0.42 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
}
function feather(ctx, x, y, s, rot, C) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = C.c;
  ctx.strokeStyle = C.a;
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.ellipse(0, 0, 5 * s, 1.8 * s, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-5 * s, 0);
  ctx.lineTo(5 * s, 0);
  ctx.stroke();
  ctx.restore();
}

// Returns true when it drew the hit.
export function dancerHit(ctx, school, x, y, p, { big = false, seed = 0.5, dir = 1, scale = 0.6 } = {}) {
  const C = COL[school];
  if (!C) return false;
  const n = Math.floor(seed * 1000);
  const pick = n % 4;
  const s = big ? 1.3 : 1;
  if (pick === 0) {
    fxSprite(ctx, SPRITE[school], x, y, { p, scale: scale * 0.85 * (big ? 1.2 : 1), rot: (seed - 0.5) * 0.6, flip: dir < 0 });
    return true;
  }
  const e = ease(p * 1.4);
  ctx.save();
  // A small flash to land every hit.
  if (p < 0.2) {
    ctx.globalAlpha = 1 - p / 0.2;
    star(ctx, x, y, 7 * s, C.c);
  }
  ctx.globalAlpha = Math.max(0, 1 - Math.max(0, p - 0.5) / 0.5);
  ctx.lineCap = 'round';
  const kind = school === 'acro' ? (pick === 3 ? 'stars' : 'coral') : school;
  if (kind === 'coral') {
    if (pick === 1) {
      // A coral ribbon looping off the hit.
      ctx.strokeStyle = C.a;
      ctx.lineWidth = 2.6 * s;
      ctx.beginPath();
      for (let k = 0; k <= 24; k++) {
        const u = k / 24;
        const a = u * TAU * 1.2 + p * 3;
        const r = 6 + 14 * u * e;
        const px = x + dir * u * 18 * e + Math.cos(a) * r * 0.6;
        const py = y - u * 10 * e + Math.sin(a) * r * 0.5;
        if (k) ctx.lineTo(px, py);
        else ctx.moveTo(px, py);
      }
      ctx.stroke();
      ctx.strokeStyle = C.c;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    } else if (pick === 2) {
      // A burst of petals tumbling out.
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * TAU + rand(n + k);
        const d = 22 * s * e * (0.6 + 0.4 * rand(n + k * 3));
        ctx.save();
        ctx.translate(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.8 + 10 * p * p);
        ctx.rotate(p * 6 + k);
        ctx.fillStyle = k % 2 ? C.a : C.b;
        if (school === 'acro') ctx.fillRect(-2 * s, -1 * s, 4 * s, 2 * s);
        else {
          ctx.beginPath();
          ctx.ellipse(0, 0, 3 * s, 1.6 * s, 0, 0, TAU);
          ctx.fill();
        }
        ctx.restore();
      }
    } else {
      // A gust: three curved wind lines sweeping through, a feather carried on it.
      ctx.strokeStyle = C.b;
      for (let k = 0; k < 3; k++) {
        ctx.lineWidth = k === 1 ? 2 : 1.2;
        ctx.beginPath();
        ctx.arc(x - dir * 8, y + (k - 1) * 7, 14 + 10 * e, dir > 0 ? -0.9 : Math.PI - 0.6, dir > 0 ? 0.6 : Math.PI + 0.9);
        ctx.stroke();
      }
      feather(ctx, x + dir * 24 * e, y - 10 * e, s, p * 5, C);
    }
  } else if (kind === 'rosegold' || kind === 'stars') {
    if (pick === 1 && kind !== 'stars') {
      // Gold coins spinning out and falling.
      for (let k = 0; k < 6; k++) {
        const a = -Math.PI / 2 + (k - 2.5) * 0.5;
        const d = 22 * s * e;
        const w = 3.2 * s * Math.abs(Math.cos(p * 14 + k));
        ctx.fillStyle = C.a;
        ctx.strokeStyle = '#8a5a1a';
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.ellipse(x + Math.cos(a) * d, y + Math.sin(a) * d + 22 * p * p, Math.max(0.4, w), 3.2 * s, 0, 0, TAU);
        ctx.fill();
        ctx.stroke();
      }
    } else if (pick === 2 && kind !== 'stars') {
      // Two hoops snapping across each other.
      ctx.strokeStyle = C.a;
      ctx.lineWidth = 2 * s;
      for (const t of [-0.6, 0.6]) {
        ctx.beginPath();
        ctx.ellipse(x, y, (8 + 10 * e) * s, (3 + 4 * e) * s, t, 0, TAU);
        ctx.stroke();
      }
      star(ctx, x, y, 4 * s * (1 - p), C.c);
    } else {
      // A pop of gold stars.
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * TAU + rand(n);
        star(ctx, x + Math.cos(a) * 18 * s * e, y + Math.sin(a) * 14 * s * e, (3 + (k % 2)) * (1 - p * 0.5), k % 2 ? C.a : C.b);
      }
    }
  } else {
    if (pick === 1) {
      // A spiral gust unwinding off the hit.
      ctx.strokeStyle = C.a;
      ctx.lineWidth = 1.8 * s;
      ctx.beginPath();
      for (let k = 0; k <= 30; k++) {
        const u = k / 30;
        const a = u * TAU * 1.6 * dir;
        const r = 2 + 18 * s * u * e;
        if (k) ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.7);
        else ctx.moveTo(x, y);
      }
      ctx.stroke();
    } else if (pick === 2) {
      // A soft puff of cloud.
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * TAU;
        const d = 8 * s * e;
        ctx.globalAlpha = Math.max(0, 1 - p) * 0.9;
        ctx.fillStyle = k % 2 ? C.c : C.b;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.6 - 4 * e, (5 + 3 * e) * s, 0, TAU);
        ctx.fill();
      }
    } else {
      // Feathers scattering.
      for (let k = 0; k < 4; k++) {
        const a = -Math.PI / 2 + (k - 1.5) * 0.8;
        feather(ctx, x + Math.cos(a) * 20 * s * e, y + Math.sin(a) * 16 * s * e + 14 * p * p, s, p * 4 + k, C);
      }
    }
  }
  ctx.restore();
  return true;
}

// Cloud Nine: a ring of little puffy clouds gathering round her and circling, rising as they go,
// then drifting apart.
export function cloudRing(ctx, x, y, p) {
  const gather = ease(p * 2.5);
  const out = Math.max(0, (p - 0.7) / 0.3);
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * TAU + p * 4;
    const rx = 46 * gather + 30 * out;
    const cx = x + Math.cos(a) * rx;
    const cy = y - 18 - 22 * p + Math.sin(a) * rx * 0.25;
    const front = Math.sin(a) > 0;
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - out) * (front ? 0.95 : 0.6);
    for (let b = 0; b < 3; b++) {
      const g = ctx.createRadialGradient(cx + (b - 1) * 5 - 2, cy - 3, 1, cx + (b - 1) * 5, cy, 7);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(1, '#cfeaff');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx + (b - 1) * 5, cy - (b === 1 ? 3 : 0), b === 1 ? 7 : 5.5, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
}

// Handspring: a mint ribbon tracing her flip from where she leaves the ground to where she lands
// (about `d` ahead), with dust kicked up at both ends and gold sparkles shed along it.
export function springTrail(ctx, x, y, dir, d, p) {
  const C = COL.acro;
  const head = ease(p * 1.6);
  const tail = ease(Math.max(0, p - 0.35) / 0.65);
  const at = (u) => [x + dir * d * u, y - 20 - 46 * Math.sin(Math.PI * u)];
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = C.a;
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  for (let k = 0; k <= 20; k++) {
    const u = tail + ((head - tail) * k) / 20;
    const [px, py] = at(u);
    if (k) ctx.lineTo(px, py + Math.sin(u * 20) * 2);
    else ctx.moveTo(px, py);
  }
  ctx.stroke();
  ctx.strokeStyle = C.c;
  ctx.lineWidth = 1;
  ctx.stroke();
  for (let k = 0; k < 5; k++) {
    const u = tail + ((head - tail) * (k + 0.5)) / 5;
    const [px, py] = at(u);
    ctx.globalAlpha = Math.max(0, 1 - p);
    star(ctx, px, py + 8, 2.6, C.b);
  }
  // Dust where she pushes off, and where she lands.
  for (const [u, when] of [[0, 0], [1, 0.55]]) {
    const q = (p - when) / 0.45;
    if (q <= 0 || q >= 1) continue;
    ctx.globalAlpha = (1 - q) * 0.7;
    ctx.fillStyle = '#efe4d2';
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      ctx.arc(x + dir * d * u + (k - 1) * 9 * ease(q), y - 3 - 4 * q, 4 + 5 * ease(q), 0, TAU);
      ctx.fill();
    }
  }
  ctx.restore();
}
