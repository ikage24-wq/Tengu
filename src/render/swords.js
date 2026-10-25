// The sword path, hand-tuned: Wooden → Iron → Steel → Mithril, then five endgame swords:
// Seraph's Grace (holy), Astral Edge (cosmic), Stormcaller (lightning), Inferno Fang (fire), and
// Tidebreaker (water). Drawn pixel by pixel with 3-tone shading; the elemental ones animate.

import { grid, noise, ELEMENT_FRAMES } from './elements.js';

// Width profile: a point that widens over the top `tip` of the blade.
const pointed = (w, tip = 0.22) => (t) => (t < tip ? 1 + (w - 1) * Math.pow(t / tip, 0.8) : w);

// Fills a blade from `top` (the tip) to `base`. Columns are shaded left (lit) to right (shadow);
// `wobble(t, y)` widens the right edge for wavy blades. Returns each row's [x0, x1] span.
function blade(g, cx, top, base, width, pal, { fuller = false, wobble = null } = {}) {
  const rows = {};
  for (let y = top; y <= base; y++) {
    const t = (y - top) / (base - top);
    const w = Math.max(1, Math.round(width(t)));
    const x0 = cx - Math.floor(w / 2);
    const x1 = x0 + w - 1 + (wobble ? Math.round(wobble(t, y)) : 0);
    for (let x = x0; x <= x1; x++) {
      const i = x - x0;
      let c = i === 0 ? pal.hi : x === x1 ? pal.dark : x < cx ? pal.light : pal.mid;
      if (fuller && x === cx && t > 0.2 && t < 0.94) c = pal.fuller;
      g.set(x, y, c);
    }
    rows[y] = [x0, x1];
  }
  return rows;
}

// Grip wraps and a round pommel. Returns the grip point (middle of the handle).
function handle(g, cx, y, len, wrapA, wrapB, pommel, gem) {
  for (let i = 0; i < len; i++) g.rect(cx - 1, y + i, 3, 1, i % 2 ? wrapA : wrapB);
  g.disc(cx + 0.5, y + len + 1.5, 2.3, pommel);
  if (gem) g.set(cx, y + len + 1, gem);
  return [cx, y + Math.floor(len / 2)];
}

function crossguard(g, cx, y, half, light, dark, curl = false) {
  g.rect(cx - half, y, half * 2 + 1, 2, dark);
  g.rect(cx - half, y, half * 2 + 1, 1, light);
  if (curl) {
    g.rect(cx - half - 1, y - 2, 2, 3, dark);
    g.rect(cx + half, y - 2, 2, 3, dark);
    g.set(cx - half - 1, y - 2, light);
    g.set(cx + half + 1, y - 2, light);
  }
}

// ---------- The path ----------

const W = 56;
const CX = 28;

function wooden() {
  const g = grid(W, 52);
  const top = 12;
  const base = top + 24;
  blade(g, CX, top, base, (t) => (t < 0.12 ? 3 + 4 * (t / 0.12) : 7), { hi: '#f6d3a3', light: '#e0aa6c', mid: '#c98e55', dark: '#9c6a3b' });
  g.rect(CX - 3, base - 5, 7, 1, '#9c6a3b');
  crossguard(g, CX, base + 1, 5, '#b07a45', '#7a5238');
  return { g, grip: handle(g, CX, base + 3, 6, '#7a5238', '#5a3a26', '#9c6a3b'), blade: [top, base] };
}

function iron() {
  const g = grid(W, 58);
  const top = 12;
  const base = top + 28;
  blade(g, CX, top, base, pointed(7), { hi: '#ffffff', light: '#dfe4ec', mid: '#bcc3d0', dark: '#8d96a8', fuller: '#a3abbb' }, { fuller: true });
  crossguard(g, CX, base + 1, 6, '#a3abbb', '#6d7487');
  return { g, grip: handle(g, CX, base + 3, 7, '#8a5a3a', '#6b4329', '#8d96a8'), blade: [top, base] };
}

function steel() {
  const g = grid(W, 66);
  const top = 12;
  const base = top + 34;
  blade(g, CX, top, base, pointed(9), { hi: '#ffffff', light: '#eef2f8', mid: '#cdd5e2', dark: '#98a3b8', fuller: '#aeb8cb' }, { fuller: true });
  g.rect(CX - 4, base - 3, 9, 3, '#cdd5e2');
  crossguard(g, CX, base + 1, 8, '#ffe9a0', '#d9a440', true);
  g.disc(CX + 0.5, base + 1.5, 2, '#d9a440');
  g.set(CX, base + 1, '#8fd3ff');
  return { g, grip: handle(g, CX, base + 3, 8, '#4f6fb8', '#3a5296', '#d9a440', '#8fd3ff'), blade: [top, base] };
}

function mithril() {
  const g = grid(W, 74);
  const top = 12;
  const base = top + 40;
  const w = pointed(11);
  blade(g, CX, top, base, (t) => w(t) - (t > 0.55 && t < 0.8 ? 1 : 0), { hi: '#ffffff', light: '#e9f6ff', mid: '#c4e0f2', dark: '#88b2d1', fuller: '#a9cbe4' }, { fuller: true });
  // Faint engraved runes along the fuller hint at the awakening to come.
  for (let y = top + 12; y < base - 6; y += 6) {
    g.set(CX - 1, y, '#d6ecfb');
    g.set(CX + 1, y + 2, '#d6ecfb');
  }
  crossguard(g, CX, base + 1, 10, '#f3f8ff', '#a9b9d6', true);
  g.rect(CX - 12, base - 3, 2, 3, '#a9b9d6');
  g.rect(CX + 11, base - 3, 2, 3, '#a9b9d6');
  // An empty gem socket.
  g.disc(CX + 0.5, base + 1.5, 3, '#a9b9d6');
  g.disc(CX + 0.5, base + 1.5, 1.8, '#4b4675');
  return { g, grip: handle(g, CX, base + 4, 9, '#c4e0f2', '#88b2d1', '#a9b9d6', '#4b4675'), blade: [top, base] };
}

// ---------- Endgame elements ----------

const TOP = 16;
const LEN = 54;

function seraph(f) {
  const g = grid(W, 94);
  const base = TOP + LEN;
  // Feathered wings spread from the guard, flapping gently.
  const flap = f >= 3 ? -1 : 0;
  for (const s of [-1, 1]) {
    for (let k = 0; k < 4; k++) {
      const len = 18 - k * 3;
      for (let i = 0; i < len; i++) {
        const x = CX + s * (3 + i);
        const y = base - 1 - Math.floor(i * 0.55) + k * 2 + flap * (i > 6 ? 1 : 0);
        const c = i >= len - 2 ? '#ffe9a0' : k % 2 ? '#f3f6ff' : '#ffffff';
        g.set(x, y, c);
        g.set(x, y + 1, k % 2 ? '#e6ebff' : '#f3f6ff');
      }
    }
  }
  const rows = blade(g, CX, TOP, base, pointed(15, 0.3), { hi: '#ffffff', light: '#ffffff', mid: '#fff6dc', dark: '#e8c97a', fuller: '#ffd66b' }, { fuller: true });
  for (const [y, [x0, x1]] of Object.entries(rows)) {
    if (y > TOP + 3) {
      g.set(x0, y, '#ffe9a0');
      g.set(x1, y, '#e0b050');
    }
  }
  // A glint climbing the golden fuller.
  const gy = base - 4 - ((f * 8) % (LEN - 8));
  g.set(CX, gy, '#ffffff');
  g.set(CX, gy - 1, '#ffffff');
  // Halo over the tip.
  g.ring(CX + 0.5, TOP - 6 + (f % 3 === 2 ? -1 : 0), 5, 1.8, '#ffe36b');
  g.disc(CX + 0.5, base + 1.5, 3.5, '#ffd66b');
  g.disc(CX + 0.5, base + 1.5, 2, '#ff9ec0');
  g.set(CX - 1, base, '#ffffff');
  return { g, grip: handle(g, CX, base + 5, 10, '#fff6dc', '#ffd66b', '#ffd66b', '#ff9ec0'), blade: [TOP, base] };
}

function astral(f) {
  const g = grid(W, 94);
  const base = TOP + LEN;
  // Crescent-moon guard cradling the blade.
  g.disc(CX + 0.5, base - 1, 9, '#ffd66b');
  for (let y = base - 15; y <= base + 9; y++) for (let x = CX - 10; x <= CX + 10; x++) if ((x + 0.5 - CX - 0.5) ** 2 + (y + 0.5 - base + 5) ** 2 <= 81) g.del(x, y);
  const rows = blade(g, CX, TOP, base, pointed(15, 0.26), { hi: '#c9b6ff', light: '#3d2d86', mid: '#2a1f60', dark: '#8f7cff' });
  // A window into space: drifting nebulae and twinkling stars.
  for (const [y, [x0, x1]] of Object.entries(rows)) {
    for (let x = x0 + 1; x < x1; x++) {
      const n = noise(Math.floor(x / 2), Math.floor((+y + f) / 3));
      if (n > 0.86) g.set(x, y, noise(x, y) > 0.5 ? '#ff7ad9' : '#5aa8ff');
      else if (n > 0.78) g.set(x, y, '#4a2f8f');
      const s = noise(x * 3, +y * 7);
      if (s > 0.95) g.set(x, y, (Math.floor(s * 100) + f) % 3 === 0 ? '#3d2d86' : '#ffffff');
    }
  }
  // Star sparkle on the tip, pulsing.
  const r = f % 3;
  for (let i = -1 - r; i <= 1 + r; i++) {
    g.set(CX + i, TOP - 3, '#ffffff');
    g.set(CX, TOP - 3 + i, '#ffffff');
  }
  g.disc(CX + 0.5, base + 2.5, 2.4, '#8fe3ff');
  g.set(CX, base + 2, '#ffffff');
  // Pommel: a tiny ringed planet.
  const grip = handle(g, CX, base + 6, 10, '#2a1f60', '#4a2f8f', '#ff9ec0');
  g.rect(CX - 4, base + 18, 9, 1, '#ffd66b');
  return { g, grip, blade: [TOP, base] };
}

function storm(f) {
  const g = grid(W, 94);
  const base = TOP + LEN;
  const rows = blade(g, CX, TOP, base, pointed(13, 0.24), { hi: '#ffffff', light: '#f2feff', mid: '#c9f6ff', dark: '#6fd6f0' });
  // Jagged electric edges that shift every frame.
  let k = 0;
  for (let y = TOP + 8; y < base - 2; y += 5, k++) {
    const [x0, x1] = rows[y];
    const sl = 2 + ((k + f) % 3);
    const sr = 2 + ((k + f + 1) % 3);
    for (let i = 1; i <= sl; i++) g.set(x0 - i, y - Math.floor(i / 2), i === sl ? '#ffffff' : '#5ff3ff');
    for (let i = 1; i <= sr; i++) g.set(x1 + i, y + 2 - Math.floor(i / 2), i === sr ? '#ffffff' : '#5ff3ff');
  }
  // Crackling core.
  for (let y = TOP + 4; y < base - 1; y++) g.set(CX, y, (y + f * 3) % 7 < 2 ? '#ffffff' : '#3b4f9a');
  // Two arcs leaping off the blade.
  for (let a = 0; a < 2; a++) {
    let x = a ? rows[TOP + 20 + ((f * 5) % 20)][1] + 1 : rows[TOP + 14 + ((f * 7) % 24)][0] - 1;
    let y = TOP + (a ? 20 + ((f * 5) % 20) : 14 + ((f * 7) % 24));
    for (let i = 0; i < 6; i++) {
      g.set(x, y, i % 2 ? '#5ff3ff' : '#ffffff');
      x += a ? 1 : -1;
      y += (i + f) % 2 ? 1 : -1;
    }
  }
  // Dark guard with lightning bolts.
  crossguard(g, CX, base + 1, 8, '#5d6488', '#3b3f5c');
  for (const s of [-1, 1]) {
    g.set(CX + s * 9, base - 2, '#ffe36b');
    g.set(CX + s * 10, base - 1, '#ffe36b');
    g.set(CX + s * 9, base, '#ffe36b');
    g.set(CX + s * 10, base + 1, '#ffe36b');
    g.set(CX + s * 11, base + 2, '#ffe36b');
  }
  g.disc(CX + 0.5, base + 1.5, 2.5, f % 2 ? '#5ff3ff' : '#c9f6ff');
  return { g, grip: handle(g, CX, base + 4, 10, '#3b3f5c', '#5ff3ff', '#3b3f5c', '#5ff3ff'), blade: [TOP, base] };
}

function inferno(f) {
  const g = grid(W, 94);
  const base = TOP + LEN;
  const heat = ['#ff6b2b', '#ffa53b', '#ffd23b'];
  // Horned guard.
  for (const s of [-1, 1]) {
    for (let i = 0; i < 9; i++) g.rect(CX + s * (3 + i) - (s < 0 ? 1 : 0), base - Math.floor((i * i) / 10), 2, 2, i > 6 ? '#ff6b2b' : '#5a2030');
  }
  const rows = blade(g, CX, TOP, base, pointed(15, 0.25), { hi: '#8a4a5a', light: '#4a2a3a', mid: '#33202c', dark: '#ff6b2b' });
  // Molten cracks that pulse.
  for (let v = 0; v < 3; v++) {
    for (let y = TOP + 8; y < base - 1; y++) {
      if (noise(v, Math.floor(y / 4)) < 0.25) continue;
      const x = CX + Math.round(Math.sin(y * 0.35 + v * 2.1) * 3.5);
      g.set(x, y, heat[(Math.floor(y / 3) + f + v) % 3]);
    }
  }
  // Flames licking up both edges from the guard, flickering.
  for (let y = TOP + 18; y < base; y += 2) {
    const [x0, x1] = rows[y];
    const t = (y - TOP) / LEN;
    const len = Math.round((1 + ((y + f * 3) % 4)) * t);
    for (let i = 1; i <= len; i++) {
      const c = heat[Math.min(2, len - i)];
      g.set(x0 - i, y - i, c);
      g.set(x1 + i, y - i + 1, c);
    }
  }
  // A flame plume off the tip.
  for (let i = 0; i < 6; i++) g.set(CX + ((i + f) % 3) - 1, TOP - 1 - i, heat[Math.min(2, i >> 1)]);
  g.disc(CX + 0.5, base + 1.5, 2.6, heat[f % 3]);
  return { g, grip: handle(g, CX, base + 4, 10, '#22141f', '#8a2a2a', '#3a2433', '#ff6b2b'), blade: [TOP, base] };
}

function tide(f) {
  const g = grid(W, 94);
  const base = TOP + LEN;
  // Seashell guard.
  g.disc(CX + 0.5, base + 2, 7, '#ffc2d6');
  for (let y = base + 2; y < base + 10; y++) for (let x = CX - 7; x <= CX + 8; x++) g.del(x, y);
  for (let a = -3; a <= 3; a++) for (let r = 2; r < 7; r++) g.set(CX + Math.round((a / 3) * r), base + 2 - Math.round(Math.sqrt(Math.max(0, 1 - (a / 3) ** 2)) * r), '#ff9ec0');
  const flow = (t, y) => 1.6 * Math.sin(y * 0.4 - f * 1.05) + 0.5;
  const rows = blade(g, CX, TOP, base, pointed(13, 0.26), { hi: '#ffffff', light: '#c9f6ff', mid: '#6fd6f0', dark: '#2f9bd0' }, { wobble: flow });
  for (const [y, [x0]] of Object.entries(rows)) if (Math.sin(+y * 0.4 - f * 1.05) > 0.4) g.set(x0, y, '#ffffff');
  // A current running down the middle and bubbles rising through it.
  for (let y = TOP + 6; y < base - 2; y++) if ((y + f * 2) % 6 < 3) g.set(CX + Math.round(Math.sin(y * 0.3 + f) * 1.5), y, '#e6fbff');
  for (let b = 0; b < 4; b++) {
    const y = base - 4 - ((b * 11 + f * 3) % (LEN - 10));
    g.set(CX - 2 + ((b * 3) % 5), y, '#ffffff');
  }
  // The tip curls over like a breaking wave.
  for (let i = 0; i < 5; i++) g.set(CX + 1 + i, TOP + 2 - Math.round(Math.sin((i / 4) * Math.PI) * 3), i === 4 ? '#ffffff' : '#c9f6ff');
  g.set(CX + 6, TOP + 1 + (f % 2), '#ffffff');
  g.disc(CX + 0.5, base + 0.5, 2.2, '#fff6fb');
  g.set(CX - 1, base - 1, '#ffffff');
  return { g, grip: handle(g, CX, base + 4, 10, '#2f9bd0', '#6fd6f0', '#fff6fb', '#ffc2d6'), blade: [TOP, base] };
}

const PATH = [wooden, iron, steel, mithril, seraph, astral, storm, inferno, tide];

export function swordShapes(tier, frame = 0) {
  const { g, grip, blade: span } = PATH[Math.max(0, Math.min(8, tier))](frame % ELEMENT_FRAMES);
  return { w: g.w, h: g.h, grip, blade: span, shapes: g.shapes() };
}
