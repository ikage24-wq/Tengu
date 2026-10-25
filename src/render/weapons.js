// Weapon art for every class, all on the same path: Wooden → Iron → Steel → Mithril, then five
// endgame elements (Holy, Cosmic, Lightning, Fire, Water). Base tiers grow in size and detail;
// the endgame ones are the biggest, animate over 6 frames, and wear their element's decorations
// (wings and halos, crescent moons and stars, bolts and arcs, horns and flames, shells and waves).
//
// Weapons point straight up with the grip near the bottom; the hero rotates them around the grip.
// Each returns { w, h, grip, blade: [top, base], shapes }: `blade` bounds the main part for auras.

import { swordShapes } from './swords.js';
import {
  grid, TIER_ELEMENT, ELEMENTS, ELEMENT_FRAMES, MATERIALS, SHAFTS, pointed, taperSpans, ellipseSpans, dropSpans,
  paint, collar, crown, gem, shaft,
} from './elements.js';

const clampTier = (t) => Math.max(0, Math.min(8, t ?? 0));
// Base tiers pick from a 4-entry table; every endgame tier uses the last (biggest) value.
const pick = (table, t) => table[Math.min(t, table.length - 1)];

// ---------- Axes ----------

function axe(t, f) {
  const el = TIER_ELEMENT[t];
  const s = pick([6, 7, 8, 9, 12], t);
  const len = pick([26, 30, 34, 38, 46], t);
  const W = 64;
  const cx = 32;
  const top = 18;
  const hy = top + Math.round(s * 1.4);
  const g = grid(W, hy + len + 8);
  shaft(g, cx, top + 2, hy + len, t);
  // A bearded bit: a neck at the haft that flares into a curved edge with pointed horns above
  // and below. Endgame axes are double-bitted.
  const spans = [];
  for (const d of el ? [1, -1] : [1]) {
    for (let y = Math.floor(hy - s * 1.4); y <= hy + s * 1.4; y++) {
      const oy = Math.abs(y + 0.5 - hy) / (s * 1.4);
      if (oy >= 1) continue;
      const outer = s * 0.5 + s * 1.3 * Math.sqrt(1 - oy * oy);
      const inner = oy < 0.2 ? 1 : s * 0.3 + s * 1.2 * Math.pow((oy - 0.2) / 0.8, 0.65);
      const a = Math.max(1, Math.round(inner));
      const b = Math.round(outer);
      if (b >= a) spans.push(d > 0 ? [y, cx + a, cx + b] : [y, cx - b - 1, cx - a - 1]);
    }
  }
  paint(g, spans, t, f);
  // Back spike on steel and up; a spear tip on mithril and up.
  if (t >= 2 && !el) for (let i = 0; i < 4; i++) g.rect(cx - 2 - i, hy - 1 + (i >> 1), 1, 3 - (i >> 1), MATERIALS[t].dark);
  if (t >= 3) paint(g, taperSpans(cx, top - 6, top + 2, pointed(3, 0.6)), t, f);
  g.rect(cx - 2, hy - 3, 4, 7, SHAFTS[t][2]);
  if (el) {
    gem(g, cx - 1, hy, 1.5, ELEMENTS[el].gem);
    crown(g, el, cx, top - 12, f);
  }
  return { w: W, h: g.h, grip: [cx, hy + Math.round(len * 0.72)], blade: [top - 6, hy + s], g };
}

// ---------- Spears ----------

function spear(t, f) {
  const el = TIER_ELEMENT[t];
  const hl = pick([10, 12, 14, 16, 22], t);
  const hw = pick([5, 5, 7, 7, 11], t);
  const len = pick([36, 40, 44, 48, 56], t);
  const W = 64;
  const cx = 32;
  const top = 18;
  const base = top + hl;
  const g = grid(W, base + len + 8);
  shaft(g, cx, base - 2, base + len, t);
  const leaf = (u) => (u < 0.6 ? 1 + (hw - 1) * Math.pow(u / 0.6, 0.7) : hw - (hw - 2) * ((u - 0.6) / 0.4));
  // Endgame spears grow side blades below the head.
  if (el) {
    for (const d of [-1, 1]) {
      const side = [];
      for (let i = 0; i < 9; i++) {
        const w = Math.max(1, Math.round(4 * Math.sin((i / 8) * Math.PI)));
        const x = cx + d * (4 + Math.round(i * 0.6));
        side.push([base - 6 + i, d > 0 ? x : x - w + 1, d > 0 ? x + w - 1 : x]);
      }
      paint(g, side, t, f);
    }
  }
  paint(g, taperSpans(cx, top, base, leaf), t, f, { fuller: true });
  if (t >= 2) g.rect(cx - 4, base + 1, 9, 2, SHAFTS[t][2]);
  // A ribbon tassel under the head.
  if (t >= 1) {
    const rc = el ? ELEMENTS[el].color : '#ff9ec0';
    const sw = f % 2;
    g.rect(cx + 1, base + 3, 2, 2, rc);
    g.rect(cx + 2 + sw, base + 5, 2, 4, rc);
    g.rect(cx + 1 + sw * 2, base + 9, 2, 3, rc);
  }
  if (el) {
    collar(g, el, cx, base + 2, f, 0.55);
    crown(g, el, cx, top - 6, f);
  }
  return { w: W, h: g.h, grip: [cx, base + Math.round(len * 0.62)], blade: [top, base], g };
}

// ---------- Daggers ----------

function dagger(t, f) {
  const el = TIER_ELEMENT[t];
  const len = pick([12, 14, 16, 18, 26], t);
  const w = pick([5, 6, 7, 8, 11], t);
  const W = 48;
  const cx = 24;
  const top = 14;
  const base = top + len;
  const g = grid(W, base + 16);
  if (el) collar(g, el, cx, base + 1, f, 0.6);
  paint(g, taperSpans(cx, top, base, pointed(w, 0.32)), t, f, { fuller: true });
  if (!el) {
    const [, , trim] = SHAFTS[t];
    g.rect(cx - 4, base + 1, 9, 2, trim);
  } else {
    crown(g, el, cx, top - 6, f);
    gem(g, cx, base + 1, 1.5, ELEMENTS[el].gem);
  }
  const [a, b, trim] = SHAFTS[t];
  for (let i = 0; i < 7; i++) g.rect(cx - 1, base + 3 + i, 3, 1, i % 2 ? a : b);
  g.disc(cx + 0.5, base + 11.5, 2, trim);
  return { w: W, h: g.h, grip: [cx, base + 6], blade: [top, base], g };
}

// ---------- Wands and staves (a shaft with a head) ----------

function head(g, t, cx, cy, r, f) {
  const el = TIER_ELEMENT[t];
  switch (el ?? t) {
    case 0: paint(g, ellipseSpans(cx + 0.5, cy, r * 0.8, r), t, f); break;
    case 1: {
      const ring = ellipseSpans(cx + 0.5, cy, r, r).flatMap(([y, x0, x1]) => {
        const inner = ellipseSpans(cx + 0.5, cy, r - 2, r - 2).find((s) => s[0] === y);
        return inner ? [[y, x0, inner[1] - 1], [y, inner[2] + 1, x1]] : [[y, x0, x1]];
      });
      paint(g, ring, t, f);
      gem(g, cx, cy, 1.2, '#8fd3ff');
      break;
    }
    case 2: {
      paint(g, taperSpans(cx, cy - r - 2, cy + r + 2, (u) => 1 + 4 * (1 - Math.abs(u - 0.5) * 2) ** 2), t, f);
      for (let x = -r - 2; x <= r + 2; x++) {
        const k = 1 - Math.abs(x) / (r + 3);
        const h = Math.round(k * k * 2);
        for (let y = -h; y <= h; y++) g.set(cx + x, cy + y, x < 0 ? MATERIALS[t].light : MATERIALS[t].mid);
      }
      gem(g, cx, cy, 1.5, '#8fd3ff');
      break;
    }
    case 3:
      paint(g, taperSpans(cx, cy - r - 3, cy + r, (u) => (u < 0.55 ? 1 + 2 * r * Math.pow(u / 0.55, 0.8) : 2 * r + 1 - 2 * r * ((u - 0.55) / 0.45))), t, f);
      g.set(cx - 1, cy - r, '#ffffff');
      g.set(cx + 1, cy - 2, '#e9f6ff');
      break;
    case 'holy':
      collar(g, el, cx, cy + 2, f, r / 12);
      paint(g, ellipseSpans(cx + 0.5, cy, r * 0.75, r * 0.75), t, f);
      gem(g, cx, cy, 1.5, ELEMENTS.holy.gem);
      crown(g, el, cx, cy - r - 5, f);
      break;
    case 'cosmic':
      collar(g, el, cx, cy + r * 0.9, f, r / 9);
      paint(g, ellipseSpans(cx + 0.5, cy, r * 0.8, r * 0.8), t, f);
      crown(g, el, cx, cy - r - 4, f);
      break;
    case 'storm':
      paint(g, ellipseSpans(cx + 0.5, cy, r * 0.75, r * 0.75), t, f);
      for (let a = 0; a < 6; a++) {
        const ang = (a / 6) * Math.PI * 2 + f * 0.3;
        for (let i = 0; i < 4; i++) g.set(cx + Math.cos(ang) * (r + i) + (i % 2), cy + Math.sin(ang) * (r + i), i === 3 ? '#ffffff' : '#5ff3ff');
      }
      break;
    case 'fire':
      collar(g, el, cx, cy + r, f, r / 11);
      paint(g, dropSpans(cx, cy, r * 0.85), t, f);
      crown(g, el, cx, cy - r * 1.8 - 3, f);
      break;
    case 'water':
      collar(g, el, cx, cy + r * 0.6, f, r / 11);
      paint(g, dropSpans(cx, cy, r * 0.85), t, f);
      g.ring(cx + 0.5, cy + 1, r * 0.4, r * 0.4, '#ffffff');
      g.set(cx + 1, cy - 2 - (f % 3), '#ffffff');
      break;
  }
}

function rod(kind, t, f) {
  const el = TIER_ELEMENT[t];
  const staff = kind === 'staff';
  const r = staff ? pick([5, 6, 7, 8, 11], t) : pick([4, 5, 6, 7, 9], t);
  const len = staff ? pick([30, 34, 38, 42, 52], t) : pick([14, 15, 16, 17, 22], t);
  const W = 64;
  const cx = 32;
  const cy = 18 + Math.round(r * 1.9);
  const neck = cy + r;
  const g = grid(W, neck + len + 8);
  shaft(g, cx, neck - 1, neck + len, t);
  // Staves cradle their head in two prongs.
  if (staff && t >= 2) {
    const c = SHAFTS[t][2];
    for (let i = 0; i < r + 2; i++) {
      const dx = Math.round(Math.sin((i / (r + 2)) * Math.PI * 0.9) * (r + 1));
      g.set(cx - dx - 1, neck - i, c);
      g.set(cx + dx, neck - i, c);
    }
  }
  head(g, t, cx, cy, r, f);
  g.rect(cx - 2, neck + 1, 4, 2, SHAFTS[t][2]);
  const gy = neck + Math.round(len * (staff ? 0.68 : 0.62));
  g.rect(cx - 1, gy - 2, 2, 5, el ? ELEMENTS[el].color : '#c25b78');
  return { w: W, h: g.h, grip: [cx, gy], blade: [cy - r * 2, neck], g };
}

// ---------- Bows ----------

function bow(t, f) {
  const el = TIER_ELEMENT[t];
  const h = pick([30, 34, 38, 42, 54], t);
  const thick = el ? 4 : 3;
  const bend = 6 + Math.min(t, 4) * 1.2;
  const W = 56;
  const top = 16;
  const bx = 32;
  const g = grid(W, top + h + 14);
  const spans = [];
  for (let i = 0; i <= h; i++) {
    const u = i / h;
    const x = Math.round(bx - bend * Math.sin(Math.PI * u));
    const th = u > 0.42 && u < 0.58 ? thick + 1 : u < 0.08 || u > 0.92 ? thick - 1 : thick;
    spans.push([top + i, x, x + th - 1]);
  }
  paint(g, spans, t, f);
  // Recurved, capped tips.
  const trim = SHAFTS[t][2];
  if (t >= 1) {
    g.rect(bx + 1, top - 2, 2, 3, trim);
    g.rect(bx + 1, top + h, 2, 3, trim);
  }
  const mid = top + Math.round(h / 2);
  const gx = Math.round(bx - bend);
  g.rect(gx, mid - 3, thick + 1, 7, SHAFTS[t][1]);
  const string = el ? ELEMENTS[el].glow : '#fff6fb';
  g.rect(bx + 2, top + 1, 1, h - 1, string);
  if (el) {
    gem(g, gx + 2, mid, 2, ELEMENTS[el].gem);
    collar(g, el, gx + 2, mid - 2, f, 0.45);
    crown(g, el, bx + 2, top - 7, f);
    crown(g, el, bx + 2, top + h + 6, (f + 3) % ELEMENT_FRAMES);
  }
  return { w: W, h: g.h, grip: [gx + 2, mid], blade: [top, top + h], g };
}

// ---------- Crossbows (horizontal, pointing right) ----------

function crossbow(t, f) {
  const el = TIER_ELEMENT[t];
  const len = pick([20, 22, 24, 26, 34], t);
  const lh = pick([16, 18, 20, 22, 32], t);
  const W = len + 24;
  const H = lh + 24;
  const cy = Math.round(H / 2);
  const fx = len + 4;
  const g = grid(W, H);
  const [a, b, trim] = SHAFTS[Math.min(t, 3)];
  g.rect(2, cy - 1, len + 2, 3, t >= 4 ? SHAFTS[t][0] : a);
  g.rect(2, cy + 1, len + 2, 1, t >= 4 ? SHAFTS[t][1] : b);
  g.rect(2, cy + 2, 5, 4, b);
  // Limbs: a vertical arc at the front.
  const spans = [];
  for (let i = 0; i <= lh; i++) {
    const x = fx - Math.round(3 * Math.sin((Math.PI * i) / lh));
    spans.push([cy - Math.round(lh / 2) + i, x, x + (el ? 3 : 2)]);
  }
  paint(g, spans, t, f);
  g.rect(fx - 5, cy - Math.round(lh / 2) + 1, 1, lh - 1, el ? ELEMENTS[el].glow : '#fff6fb');
  // A loaded bolt.
  g.rect(8, cy - 2, fx - 4, 1, '#efe8d8');
  g.rect(fx + 3, cy - 3, 2, 3, el ? ELEMENTS[el].color : trim);
  g.rect(fx - 2, cy - 2, 4, 4, trim);
  if (el) {
    gem(g, fx, cy, 1.5, ELEMENTS[el].gem);
    crown(g, el, fx, cy - Math.round(lh / 2) - 6, f);
  }
  return { w: W, h: H, grip: [5, cy + 3], blade: [cy - Math.round(lh / 2), cy + Math.round(lh / 2)], g };
}

// ---------- Claws ----------

function claw(t, f) {
  const el = TIER_ELEMENT[t];
  const bl = pick([13, 15, 17, 19, 28], t);
  const W = 52;
  const gx = 26;
  const H = bl + 24;
  const g = grid(W, H);
  [gx - 9, gx, gx + 9].forEach((x0, i) => {
    const len = bl - (i === 1 ? 0 : 3);
    const tw = el ? 6 : 5;
    const spans = [];
    for (let k = 0; k < len; k++) {
      const u = k / len;
      const w = Math.max(1, Math.round(tw * (1 - u)));
      const x = Math.round(x0 + u * u * 8) - Math.floor(w / 2);
      spans.push([H - 15 - k, x, x + w - 1]);
    }
    paint(g, spans.reverse(), t, f);
  });
  const [a, b, trim] = SHAFTS[t];
  g.rect(gx - 14, H - 15, 29, 9, t >= 4 ? a : MATERIALS[t].mid);
  g.rect(gx - 14, H - 15, 29, 2, t >= 4 ? trim : MATERIALS[t].hi);
  g.rect(gx - 11, H - 6, 23, 4, b);
  if (el) {
    gem(g, gx, H - 11, 2, ELEMENTS[el].gem);
    crown(g, el, gx, H - 18 - bl - 4, f);
  } else if (t >= 2) gem(g, gx, H - 11, 1.5, t >= 3 ? '#4b4675' : '#8fd3ff');
  return { w: W, h: H, grip: [gx, H - 4], blade: [H - 15 - bl, H - 15], g };
}

// ---------- Public ----------

const BUILDERS = {
  axe, spear, dagger, bow, crossbow, claw,
  wand: (t, f) => rod('wand', t, f),
  staff: (t, f) => rod('staff', t, f),
};

export function weaponShapes(type, color, tier = 0, special = null, frame = 0) {
  const t = clampTier(tier);
  const f = frame % ELEMENT_FRAMES;
  if (type === 'sword') return swordShapes(t, f);
  const build = BUILDERS[type];
  if (!build) return null;
  const { w, h, grip, blade, g } = build(t, f);
  return { w, h, grip, blade, shapes: g.shapes() };
}

// How many animation frames a weapon's design has (1 = still). Endgame weapons animate.
export function weaponFrames(type, tier = 0) {
  return TIER_ELEMENT[clampTier(tier)] ? ELEMENT_FRAMES : 1;
}

// ---------- 16x16 bag icons ----------

export function weaponIcon(type, tier) {
  const t = clampTier(tier);
  const el = TIER_ELEMENT[t];
  const m = MATERIALS[t];
  const [sa, sb, trim] = SHAFTS[t];
  const g = grid(16, 16);
  const accent = el ? ELEMENTS[el].color : null;
  const diag = (x0, y0, n, c1, c2) => {
    for (let k = 0; k < n; k++) {
      g.set(x0 - k, y0 + k, c1);
      if (c2) g.set(x0 - k + 1, y0 + k, c2);
    }
  };
  switch (type) {
    case 'sword':
    case 'dagger': {
      const n = type === 'sword' ? 9 : 6;
      const o = 9 - n;
      for (let k = 0; k < n; k++) {
        g.set(14 - k - o, 1 + k + o, m.hi);
        g.set(15 - k - o, 1 + k + o, m.dark);
        g.set(14 - k - o, 2 + k + o, m.mid);
      }
      for (let i = -2; i <= 2; i++) g.set(5 + i, 11 + i, el ? ELEMENTS[el].glow : trim);
      g.set(4, 12, sb);
      g.set(3, 13, sa);
      g.set(2, 14, trim);
      break;
    }
    case 'axe':
    case 'spear':
      diag(12, 3, 12, sa, sb);
      if (type === 'axe') {
        g.disc(12, 4.5, 3.6, m.mid);
        g.disc(11.5, 4, 2, m.light);
        g.set(13, 2, m.hi);
      } else {
        g.set(14, 1, m.hi);
        g.rect(12, 2, 2, 2, m.light);
        g.set(14, 2, m.dark);
        g.set(12, 4, m.mid);
      }
      break;
    case 'wand':
    case 'staff':
      diag(type === 'staff' ? 11 : 10, type === 'staff' ? 5 : 6, type === 'staff' ? 11 : 8, sa, sb);
      g.disc(12, 4, type === 'staff' ? 3.4 : 3, el ? ELEMENTS[el].glow : m.mid);
      g.disc(11.5, 3.5, 1.4, el ? '#ffffff' : m.light);
      break;
    case 'bow':
      for (let y = 1; y <= 14; y++) {
        const x = Math.round(10 - 6 * Math.sin((Math.PI * (y - 1)) / 13));
        g.set(x, y, m.mid);
        g.set(x + 1, y, m.dark);
      }
      g.rect(11, 2, 1, 12, el ? ELEMENTS[el].glow : '#fff6fb');
      g.rect(4, 7, 2, 3, sb);
      break;
    case 'crossbow':
      g.rect(1, 8, 12, 2, sa);
      g.rect(1, 10, 3, 3, sb);
      for (let y = 2; y <= 14; y++) g.set(12 - Math.round(2 * Math.sin((Math.PI * (y - 2)) / 12)), y, m.mid);
      g.rect(9, 3, 1, 11, '#fff6fb');
      break;
    case 'claw':
      for (let i = 0; i < 3; i++) for (let k = 0; k < 6; k++) g.set(4 + i * 4 + Math.round((k / 6) ** 2 * 2), 9 - k, k > 3 ? m.hi : m.mid);
      g.rect(2, 10, 12, 3, t >= 4 ? sa : m.mid);
      g.rect(3, 13, 10, 2, sb);
      break;
  }
  if (accent) {
    g.set(13, 1, '#ffffff');
    g.set(14, 3, accent);
    g.set(1, 2, accent);
  }
  return g.shapes();
}
