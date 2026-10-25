// Shared art toolkit for the weapon paths: a pixel grid, the nine materials (wood, iron, steel,
// mithril, then the five elements), element surface effects (gold edges, star fields, crackling
// spikes, molten cracks and flames, flowing foam), element decorations (wings, crescent moons,
// bolts, horns, shells, halos, plumes), and the live auras drawn around endgame weapons.

import { P } from './pixel.js';

export const ELEMENT_FRAMES = 6;
export const TIER_ELEMENT = [null, null, null, null, 'holy', 'cosmic', 'storm', 'fire', 'water'];

export const ELEMENTS = {
  holy: { color: '#ffe36b', glow: '#fff3a6', gem: '#ff9ec0', sparks: ['#ffffff', '#ffe36b', '#fff3a6'] },
  cosmic: { color: '#9b7bff', glow: '#b49cff', gem: '#8fe3ff', sparks: ['#c9b6ff', '#ff7ad9', '#8fe3ff'] },
  storm: { color: '#5ff3ff', glow: '#5ff3ff', gem: '#5ff3ff', sparks: ['#5ff3ff', '#ffffff', '#c9f6ff'] },
  fire: { color: '#ff6b2b', glow: '#ff8a3b', gem: '#ffd23b', sparks: ['#ff6b2b', '#ffa53b', '#ffd23b'] },
  water: { color: '#4fc8ff', glow: '#8fe3ff', gem: '#fff6fb', sparks: ['#8fe3ff', '#ffffff', '#4fc8ff'] },
};

// Surface palettes, lit edge to shadow edge, by path tier.
export const MATERIALS = [
  { hi: '#f6d3a3', light: '#e0aa6c', mid: '#c98e55', dark: '#9c6a3b' },
  { hi: '#ffffff', light: '#dfe4ec', mid: '#bcc3d0', dark: '#8d96a8', fuller: '#a3abbb' },
  { hi: '#ffffff', light: '#eef2f8', mid: '#cdd5e2', dark: '#98a3b8', fuller: '#aeb8cb' },
  { hi: '#ffffff', light: '#e9f6ff', mid: '#c4e0f2', dark: '#88b2d1', fuller: '#a9cbe4' },
  { hi: '#ffffff', light: '#ffffff', mid: '#fff6dc', dark: '#e8c97a', fuller: '#ffd66b' },
  { hi: '#c9b6ff', light: '#3d2d86', mid: '#2a1f60', dark: '#8f7cff' },
  { hi: '#ffffff', light: '#f2feff', mid: '#c9f6ff', dark: '#6fd6f0' },
  { hi: '#8a4a5a', light: '#4a2a3a', mid: '#33202c', dark: '#ff6b2b' },
  { hi: '#ffffff', light: '#c9f6ff', mid: '#6fd6f0', dark: '#2f9bd0' },
];

// Shaft and grip colors (two tones), plus the trim metal, by path tier.
export const SHAFTS = [
  ['#a0703f', '#7a5238', '#c98e55'],
  ['#6d7487', '#565c6e', '#a3abbb'],
  ['#4f6fb8', '#3a5296', '#d9a440'],
  ['#c4e0f2', '#88b2d1', '#a9b9d6'],
  ['#fff6dc', '#ffd66b', '#ffd66b'],
  ['#2a1f60', '#4a2f8f', '#ffd66b'],
  ['#3b3f5c', '#5ff3ff', '#5d6488'],
  ['#22141f', '#8a2a2a', '#5a2030'],
  ['#2f9bd0', '#6fd6f0', '#ffc2d6'],
];

// ---------- Pixel grid ----------

export function grid(w, h) {
  const px = new Map();
  return {
    w,
    h,
    set(x, y, c) {
      x = Math.round(x);
      y = Math.round(y);
      if (x >= 0 && y >= 0 && x < w && y < h) px.set(y * w + x, c);
    },
    del(x, y) {
      px.delete(Math.round(y) * w + Math.round(x));
    },
    rect(x, y, rw, rh, c) {
      for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) this.set(x + i, y + j, c);
    },
    disc(cx, cy, r, c) {
      for (let y = Math.floor(cy - r - 1); y <= cy + r; y++) {
        for (let x = Math.floor(cx - r - 1); x <= cx + r; x++) if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) this.set(x, y, c);
      }
    },
    ring(cx, cy, rx, ry, c) {
      for (let a = 0; a < 64; a++) this.set(cx + Math.cos((a / 64) * Math.PI * 2) * rx, cy + Math.sin((a / 64) * Math.PI * 2) * ry, c);
    },
    shapes() {
      return [...px].map(([k, c]) => P(k % w, Math.floor(k / w), c));
    },
  };
}

// Deterministic per-pixel noise in [0, 1).
export const noise = (x, y) => {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
};

// ---------- Spans: a shape as one horizontal run per row, [y, x0, x1] ----------

export const pointed = (w, tip = 0.22) => (t) => (t < tip ? 1 + (w - 1) * Math.pow(t / tip, 0.8) : w);

export function taperSpans(cx, top, base, width) {
  const out = [];
  for (let y = top; y <= base; y++) {
    const w = Math.max(1, Math.round(width((y - top) / Math.max(1, base - top))));
    const x0 = cx - Math.floor(w / 2);
    out.push([y, x0, x0 + w - 1]);
  }
  return out;
}

export function ellipseSpans(cx, cy, rx, ry) {
  const out = [];
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    const k = 1 - ((y + 0.5 - cy) / ry) ** 2;
    if (k <= 0) continue;
    const half = rx * Math.sqrt(k);
    const x0 = Math.round(cx - half);
    const x1 = Math.round(cx + half) - 1;
    if (x1 >= x0) out.push([y, x0, x1]);
  }
  return out;
}

// A drop shape: a point on top swelling into a round bottom (fireballs, water drops).
export function dropSpans(cx, cy, r) {
  const out = [];
  const top = Math.round(cy - r * 1.8);
  for (let y = top; y <= cy + r; y++) {
    let half;
    if (y < cy) half = r * Math.pow((y - top) / (cy - top), 0.9);
    else half = r * Math.sqrt(Math.max(0, 1 - ((y + 0.5 - cy) / r) ** 2));
    if (half < 0.5) half = 0.5;
    out.push([y, Math.round(cx - half), Math.round(cx + half) - 1]);
  }
  return out;
}

// Fills spans with 3-tone shading (lit left, shadow right), then the element's surface.
export function paint(g, spans, tier, f, { fuller = false } = {}) {
  const m = MATERIALS[tier];
  for (const [y, x0, x1] of spans) {
    const mid = (x0 + x1) / 2;
    for (let x = x0; x <= x1; x++) {
      let c = x === x0 ? m.hi : x === x1 ? m.dark : x < mid ? m.light : m.mid;
      if (fuller && m.fuller && x === Math.round(mid) && x1 - x0 >= 4) c = m.fuller;
      g.set(x, y, c);
    }
  }
  const el = TIER_ELEMENT[tier];
  if (el) surface(g, spans, el, f);
}

const HEAT = ['#ff6b2b', '#ffa53b', '#ffd23b'];

function surface(g, spans, el, f) {
  const n = spans.length;
  spans.forEach(([y, x0, x1], k) => {
    const w = x1 - x0 + 1;
    const cx = Math.round((x0 + x1) / 2);
    switch (el) {
      case 'holy':
        if (w >= 3) {
          g.set(x0, y, '#ffe9a0');
          g.set(x1, y, '#e0b050');
        }
        if (k === (f * 7) % n || k === ((f * 7) % n) + 1) g.set(cx, y, '#ffffff');
        break;
      case 'cosmic':
        for (let x = x0 + 1; x < x1; x++) {
          const v = noise(Math.floor(x / 2), Math.floor((y + f) / 3));
          if (v > 0.86) g.set(x, y, noise(x, y) > 0.5 ? '#ff7ad9' : '#5aa8ff');
          else if (v > 0.78) g.set(x, y, '#4a2f8f');
          const s = noise(x * 3, y * 7);
          if (s > 0.94) g.set(x, y, (Math.floor(s * 100) + f) % 3 === 0 ? '#3d2d86' : '#ffffff');
        }
        break;
      case 'storm':
        if (w >= 5) g.set(cx, y, (y + f * 3) % 7 < 2 ? '#ffffff' : '#3b4f9a');
        if (k % 5 === 2 && k > 2) {
          const sl = 1 + ((k + f) % 3);
          const sr = 1 + ((k + f + 1) % 3);
          for (let i = 1; i <= sl; i++) g.set(x0 - i, y - (i >> 1), i === sl ? '#ffffff' : '#5ff3ff');
          for (let i = 1; i <= sr; i++) g.set(x1 + i, y + 1 - (i >> 1), i === sr ? '#ffffff' : '#5ff3ff');
        }
        break;
      case 'fire':
        if (w >= 4) {
          for (let v = 0; v < 2; v++) {
            if (noise(v, Math.floor(y / 4)) < 0.25) continue;
            g.set(cx + Math.round(Math.sin(y * 0.35 + v * 2.1) * (w / 3.2)), y, HEAT[(Math.floor(y / 3) + f + v) % 3]);
          }
        }
        if (k % 2 === 0 && k > n * 0.3) {
          const len = Math.round((1 + ((y + f * 3) % 4)) * (k / n));
          for (let i = 1; i <= len; i++) {
            g.set(x0 - i, y - i, HEAT[Math.min(2, len - i)]);
            g.set(x1 + i, y - i + 1, HEAT[Math.min(2, len - i)]);
          }
        }
        break;
      case 'water': {
        const wave = Math.sin(y * 0.4 - f * 1.05);
        if (wave > 0.4) g.set(x0, y, '#ffffff');
        if (wave > 0.2) g.set(x1 + 1, y, '#6fd6f0');
        if (wave > 0.75) g.set(x1 + 2, y, '#c9f6ff');
        if (w >= 4 && (k * 7 + f * 3) % 23 === 0) g.set(cx - 1, y, '#ffffff');
        break;
      }
    }
  });
}

// ---------- Decorations ----------

// Collar decorations where a blade or head meets the handle. `k` scales them.
export function collar(g, el, cx, y, f, k = 1) {
  switch (el) {
    case 'holy': {
      const flap = f >= 3 ? -1 : 0;
      for (const s of [-1, 1]) {
        for (let r = 0; r < 4; r++) {
          const len = Math.round((16 - r * 3) * k);
          for (let i = 0; i < len; i++) {
            const x = cx + s * (3 + i);
            const yy = y - 1 - Math.floor(i * 0.55) + r * 2 + flap * (i > 6 ? 1 : 0);
            g.set(x, yy, i >= len - 2 ? '#ffe9a0' : r % 2 ? '#f3f6ff' : '#ffffff');
            g.set(x, yy + 1, r % 2 ? '#e6ebff' : '#f3f6ff');
          }
        }
      }
      break;
    }
    case 'cosmic': {
      const r = 9 * k;
      g.disc(cx + 0.5, y - 1, r, '#ffd66b');
      for (let yy = Math.floor(y - 5 - r - 1); yy <= y - 5 + r + 1; yy++) {
        for (let x = Math.floor(cx - r - 1); x <= cx + r + 1; x++) if ((x - cx) ** 2 + (yy + 0.5 - (y - 5)) ** 2 <= r * r) g.del(x, yy);
      }
      break;
    }
    case 'storm':
      g.rect(cx - Math.round(8 * k), y, Math.round(16 * k) + 1, 2, '#3b3f5c');
      g.rect(cx - Math.round(8 * k), y, Math.round(16 * k) + 1, 1, '#5d6488');
      for (const s of [-1, 1]) {
        const x = cx + s * Math.round(9 * k);
        [[0, -2], [1, -1], [0, 0], [1, 1], [2, 2]].forEach(([dx, dy]) => g.set(x + s * dx, y + dy, '#ffe36b'));
      }
      break;
    case 'fire':
      for (const s of [-1, 1]) {
        const n = Math.round(9 * k);
        for (let i = 0; i < n; i++) g.rect(cx + s * (3 + i) - (s < 0 ? 1 : 0), y - Math.floor((i * i) / (10 * k)), 2, 2, i > n - 3 ? '#ff6b2b' : '#5a2030');
      }
      break;
    case 'water': {
      const r = 7 * k;
      for (let yy = Math.floor(y + 2 - r); yy <= y + 2; yy++) {
        for (let x = Math.floor(cx - r); x <= cx + r; x++) if ((x + 0.5 - cx - 0.5) ** 2 + (yy + 0.5 - y - 2) ** 2 <= r * r) g.set(x, yy, '#ffc2d6');
      }
      for (let a = -3; a <= 3; a++) for (let rr = 2; rr < r; rr++) g.set(cx + Math.round((a / 3) * rr), y + 2 - Math.round(Math.sqrt(Math.max(0, 1 - (a / 3) ** 2)) * rr), '#ff9ec0');
      break;
    }
  }
}

// Crown decorations floating over the top of a weapon.
export function crown(g, el, cx, y, f) {
  switch (el) {
    case 'holy':
      g.ring(cx + 0.5, y + (f % 3 === 2 ? -1 : 0), 5, 1.8, '#ffe36b');
      break;
    case 'cosmic': {
      const r = f % 3;
      for (let i = -1 - r; i <= 1 + r; i++) {
        g.set(cx + i, y, '#ffffff');
        g.set(cx, y + i, '#ffffff');
      }
      break;
    }
    case 'storm':
      for (let i = 0; i < 5; i++) g.set(cx - 2 + i + ((f + i) % 2), y + 2 - i, i % 2 ? '#5ff3ff' : '#ffffff');
      break;
    case 'fire':
      for (let i = 0; i < 6; i++) g.set(cx + ((i + f) % 3) - 1, y + 3 - i, HEAT[Math.min(2, i >> 1)]);
      break;
    case 'water':
      for (let i = 0; i < 5; i++) g.set(cx + i - 1, y + 2 - Math.round(Math.sin((i / 4) * Math.PI) * 3), i === 4 ? '#ffffff' : '#c9f6ff');
      g.set(cx + 4, y + 1 + (f % 2), '#ffffff');
      break;
  }
}

// A set gem with a shine.
export function gem(g, cx, cy, r, c) {
  g.disc(cx + 0.5, cy + 0.5, r + 1, '#ffd66b');
  g.disc(cx + 0.5, cy + 0.5, r, c);
  g.set(cx - Math.floor(r / 2), cy - Math.floor(r / 2), '#ffffff');
}

// A two-tone shaft with trim rings every few pixels on endgame tiers.
export function shaft(g, cx, y1, y2, tier) {
  const [a, b, trim] = SHAFTS[tier];
  for (let y = y1; y < y2; y++) {
    g.set(cx - 1, y, a);
    g.set(cx, y, b);
    if (tier >= 4 && (y - y1) % 9 === 4) g.rect(cx - 2, y, 4, 1, trim);
  }
  g.disc(cx, y2 + 0.5, 1.8, trim);
}

// ---------- Live auras around endgame weapons ----------
// Drawn in the weapon's rotated frame: grip at the origin, the weapon toward -y. `top`/`base`
// bound the weapon's main part in that frame (negative numbers); `s` is the pixel scale.

export function drawElementAura(ctx, element, top, base, time, s) {
  const len = base - top;
  ctx.save();
  // Sparkles twinkling around the whole weapon, in every element.
  const spark = ELEMENTS[element].sparks;
  for (let i = 0; i < 4; i++) {
    const k = (time * 0.9 + i / 4) % 1;
    const tw = Math.sin(k * Math.PI);
    ctx.globalAlpha = tw;
    ctx.fillStyle = spark[i % spark.length];
    const x = Math.round(Math.sin(i * 2.4 + Math.floor(time * 0.9 + i / 4) * 1.7) * 10 * s);
    const y = Math.round(top + ((i * 0.31 + Math.floor(time * 0.9 + i / 4) * 0.23) % 1) * len);
    const r = tw > 0.7 ? 2 : 1;
    ctx.fillRect(x - r * s, y, (r * 2 + 1) * s, s);
    ctx.fillRect(x, y - r * s, s, (r * 2 + 1) * s);
  }
  ctx.globalAlpha = 1;
  switch (element) {
    case 'holy':
      for (let i = 0; i < 3; i++) {
        const k = (time * 0.25 + i / 3) % 1;
        ctx.globalAlpha = Math.sin(k * Math.PI);
        ctx.fillStyle = '#ffffff';
        const x = Math.sin(time * 1.5 + i * 2) * 10 * s;
        ctx.fillRect(Math.round(x), Math.round(top + k * len), 3 * s, s);
        ctx.fillRect(Math.round(x + s), Math.round(top + k * len + s), s, s);
      }
      break;
    case 'cosmic': {
      const a = time * 2.2;
      const x = Math.cos(a) * 12 * s;
      const y = top + len * 0.45 + Math.sin(a) * 3 * s;
      ctx.globalAlpha = Math.sin(a) > 0 ? 1 : 0.45;
      ctx.fillStyle = '#ff9ec0';
      ctx.fillRect(Math.round(x - s), Math.round(y - s), 3 * s, 3 * s);
      ctx.fillStyle = '#ffd66b';
      ctx.fillRect(Math.round(x - 2 * s), Math.round(y), 5 * s, s);
      break;
    }
    case 'storm': {
      const step = Math.floor(time * 10);
      ctx.lineWidth = s;
      for (let a = 0; a < 2; a++) {
        const r = (n) => {
          const v = Math.sin((step + a * 13) * 91.7 + n * 37.3) * 43758.5;
          return v - Math.floor(v);
        };
        if (r(0) < 0.3) continue;
        ctx.strokeStyle = a ? '#ffffff' : '#5ff3ff';
        ctx.beginPath();
        let x = (a ? 5 : -5) * s;
        let y = top + r(1) * len;
        ctx.moveTo(x, y);
        for (let i = 0; i < 4; i++) {
          x += (a ? 3 : -3) * s;
          y += (r(i + 2) - 0.5) * 8 * s;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      break;
    }
    case 'fire':
      for (let i = 0; i < 7; i++) {
        const k = (time * 0.8 + i / 7) % 1;
        ctx.globalAlpha = 1 - k;
        ctx.fillStyle = HEAT[i % 3];
        ctx.fillRect(Math.round(Math.sin(time * 3 + i * 1.7) * 7 * s), Math.round(base - ((i / 7) * len + k * 20 * s)), s, s);
      }
      break;
    case 'water':
      ctx.lineWidth = Math.max(1, s * 0.75);
      ctx.strokeStyle = '#c9f6ff';
      for (let i = 0; i < 4; i++) {
        const k = (time * 0.45 + i / 4) % 1;
        ctx.globalAlpha = Math.sin(k * Math.PI);
        ctx.beginPath();
        ctx.arc(Math.sin(time * 2 + i * 1.9) * 10 * s, base - k * len, (1 + (i % 2)) * s, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
  }
  ctx.restore();
}
