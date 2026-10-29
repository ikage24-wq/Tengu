// Gear set designs (data/sets.js): each set has a look of its own, worn over the job's own cut.
// The set's signature pieces are its own drawings (shared by every job, so a set reads at a
// glance: Foxfire's fox ears and tails...), and the rest is the job's gear at the set's tier with
// the set's motif added on top (a collar, a cord, a cuff). Anything a set doesn't draw falls back
// to the job's module.
//
// A set design: { hat(t, p, m, fam), hatBack, hatTucks, hatHidesBangs, top(base, t, p, m, fam),
// hand(base, t, p, hx, hy, ex, ey, fam), cape(t, p, m, fam), capeFront(t, p, m, fam) } — `base`
// is the job module's own drawing of that slot (top and hand are layered over it).

import { R, E, T, F, mix } from '../pixel.js';
import { MID, limb, mirrorX } from '../figure.js';
import { darker, lighter } from './kit.js';

const WHITE = '#ffffff';
const rad = (d) => (d * Math.PI) / 180;
const ring = (n, f) => Array.from({ length: n }, (_, i) => f(i));
const lerp = (a, b, u) => a + (b - a) * u;

// ---------- Shape helpers ----------

// A flame: a teardrop from (x, y) rising `h`, leaning by `lean`, with a white core.
function flame(x, y, w, h, c, lean = 0, core = WHITE) {
  const body = T([...ring(9, (i) => {
    const a = Math.PI * (i / 8);
    return [x + Math.cos(a) * w, y + Math.sin(a) * w * 0.9];
  }), [x - w * 0.8 + lean * 0.3, y - h * 0.4], [x + lean, y - h], [x + w * 0.7 + lean * 0.5, y - h * 0.45]], c);
  return [body, F(T([...ring(7, (i) => {
    const a = Math.PI * (i / 6);
    return [x + Math.cos(a) * w * 0.45, y + 0.2 + Math.sin(a) * w * 0.4];
  }), [x + lean * 0.5, y - h * 0.55]], core))];
}

// A fluffy tail from `root` along a curve to `tip`, bowing by `bow`, `w` at its widest, with a
// white tip; the outline is tufted.
function tail(root, tip, bow, w, c, tipC = WHITE) {
  const n = 12;
  const [x0, y0] = root;
  const [x1, y1] = tip;
  const nx = -(y1 - y0);
  const ny = x1 - x0;
  const len = Math.hypot(nx, ny) || 1;
  const pt = (u) => [lerp(x0, x1, u) + (nx / len) * bow * Math.sin(Math.PI * u), lerp(y0, y1, u) + (ny / len) * bow * Math.sin(Math.PI * u)];
  const half = (u) => w * (0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, u * 1.15))) * (u > 0.85 ? 1 - (u - 0.85) * 3 : 1);
  const normal = (u) => {
    const [ax, ay] = pt(Math.max(0, u - 0.02));
    const [bx, by] = pt(Math.min(1, u + 0.02));
    const l = Math.hypot(bx - ax, by - ay) || 1;
    return [-(by - ay) / l, (bx - ax) / l];
  };
  const edge = (k, from, to) => ring(n + 1, (i) => {
    const u = lerp(from, to, i / n);
    const [px, py] = pt(u);
    const [qx, qy] = normal(u);
    const tuft = i % 2 ? 0.88 : 1;
    return [px + qx * half(u) * k * tuft, py + qy * half(u) * k * tuft];
  });
  const shape = (from, to, col) => T([...edge(1, from, to), ...edge(-1, from, to).reverse()], col);
  return [shape(0, 1, c), shape(0.68, 1, tipC)];
}

// A little round bell on a cord.
const bell = (x, y, r, c) => [E(x, y, r, r, c), F(R(x - r * 0.7, y + r * 0.1, r * 1.4, r * 0.25, darker(c, 0.3, 'metal'))), F(E(x, y + r * 0.55, r * 0.2, r * 0.2, '#5a3f2a')), F(E(x - r * 0.35, y - r * 0.4, r * 0.25, r * 0.2, WHITE))];

// ---------- Foxfire (Tamamo's set): fox ears, a side fox mask, a shrine bell and three tails ----------

const FOX_RED = '#e5485f';
const foxfire = {
  hat(t, p, m) {
    const s = m.hair * 0.5;
    // Big fox ears: orange with cream insides and blue foxfire flicking at the tips.
    const ear = (x, dir) => {
      const tip = [x + dir * 2.6 + s, -5.2];
      return [
        T([[x - 3.2 * dir, 5.6], tip, [x + 3.4 * dir, 4.2]], p.main),
        F(T([[x - 1.6 * dir, 4.8], [tip[0] - dir * 0.4, tip[1] + 2.6], [x + 1.8 * dir, 4]], '#fff1dc')),
        F(T([[tip[0] - dir * 1.2, tip[1] + 2.4], tip, [tip[0] + dir * 0.8, tip[1] + 2]], darker(p.main, 0.35))),
      ];
    };
    const out = [...ear(9.6, -1), ...ear(21.4, 1)];
    // A red cord across the crown with the shrine bell hanging at the side.
    out.push(T([[6.2, 7.4], [25, 7.4], [24.6, 8.6], [6.6, 8.6]], FOX_RED), F(R(6.6, 7.7, 18, 0.4, '#ff8a9a')));
    out.push(limb(24.4, 8.2, 25.2 - m.sway * 0.3, 11.2, 0.3, 0.3, FOX_RED), ...bell(25.2 - m.sway * 0.3, 12.2, 1.2, '#ffd66b'));
    // A little kitsune mask worn at the side of the head.
    out.push(E(6, 9.6, 3, 3.3, WHITE), T([[3.6, 7.6], [4.2, 4.8], [5.8, 7]], WHITE), T([[6.4, 7], [7.8, 4.8], [8.4, 7.6]], WHITE),
      F(T([[4.4, 8.6], [5.6, 8.2], [5.4, 9]], FOX_RED)), F(T([[7.6, 8.6], [6.4, 8.2], [6.6, 9]], FOX_RED)), F(E(6, 11.6, 0.8, 0.5, FOX_RED)),
      F(R(5.2, 6.6, 1.6, 0.4, FOX_RED)));
    // A wisp of foxfire floating by the ear.
    out.push(...flame(27.4 + s * 0.4, 1 + Math.sin(m.hair) * 0.3, 1.2, 4, p.accent, s));
    return out;
  },
  hatBack: () => [],
  hatTucks: () => false,
  hatHidesBangs: () => false,
  top(base, t, p) {
    // A shrine-white crossed collar, a red cord with a bell, and a foxfire crest.
    const lapel = [T([[11.2, 26.2], [13.4, 26], [MID + 2.6, 32.6], [MID + 1.2, 33.6]], WHITE), T([[20, 26.2], [17.8, 26], [MID + 0.6, 30.4], [MID - 0.4, 29.2]], WHITE)];
    return [...base, ...lapel, F(R(9.8, 33.2, 11.8, 1.1, FOX_RED)), ...bell(MID + 2.4, 35, 0.9, '#ffd66b'), ...flame(12.4, 31.6, 0.9, 2.6, p.accent, 0.3)];
  },
  hand(base, t, p, hx, hy, ex, ey) {
    const wx = lerp(hx, ex, 0.3);
    const wy = lerp(hy, ey, 0.3);
    return [...base, F(E(wx, wy, 1.6, 1, FOX_RED)), F(E(wx, wy - 0.2, 1.2, 0.4, '#ff8a9a')), ...flame(wx + 0.6, wy + 1.8, 0.5, 1.6, p.accent)];
  },
  cape(t, p, m) {
    // Three fox tails fanning out behind (on the back side), swishing with the step.
    const s = m.sway;
    return [
      ...tail([11.6, 37.6], [-3 + s, 25 + s * 0.3], 4.6, 5, p.main),
      ...tail([11.2, 38.4], [-7 + s * 1.2, 35.4 + s * 0.2], 3, 5.4, lighter(p.main, 0.04)),
      ...tail([11.6, 39.2], [-3.4 + s * 1.4, 46.4], -3.4, 5, p.main),
    ];
  },
  capeFront: () => [],
};

// A cape panel hanging from the shoulders to `bottom`, `flare` wider at the hem, the hem swung
// by s: { pts, hem } (the hem points left to right).
function cloak(bottom, flare, s, n = 6, jag = 0) {
  const x0 = 4.4 - flare + s;
  const x1 = 26.6 + flare + s;
  const hem = ring(n * 2 + 1, (i) => [x1 - ((x1 - x0) * i) / (n * 2), bottom + (i % 2 ? jag : 0) - Math.abs(i - n) * 0.12]);
  return [[8.6, 26], [22.4, 26], [25.2 + flare * 0.5 + s / 2, 36], ...hem, [5.8 - flare * 0.5 + s / 2, 36]];
}
// A five-petal flower.
function bloom(cx, cy, r, c, mid = '#ffe36b') {
  return [T(ring(20, (i) => {
    const a = (i / 20) * Math.PI * 2;
    const rr = r * (0.55 + 0.45 * Math.abs(Math.cos(a * 2.5)));
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
  }), c), F(E(cx, cy, r * 0.32, r * 0.32, mid))];
}
// A leaf from (x, y) pointing along angle a (degrees), `len` long.
function leaf(x, y, len, w, a, c, vein = null) {
  const ca = Math.cos(rad(a));
  const sa = Math.sin(rad(a));
  const at = (u, k) => [x + ca * len * u - sa * k, y + sa * len * u + ca * k];
  const out = [T([...ring(7, (i) => at(i / 6, Math.sin((Math.PI * i) / 6) * w)), ...ring(5, (i) => at(1 - (i + 1) / 6, -Math.sin((Math.PI * (i + 1)) / 6) * w))], c)];
  if (vein) out.push(F(limb(...at(0.1, 0), ...at(0.85, 0), 0.2, 0.15, vein)));
  return out;
}
// A rose: a swirl of petals in two tones.
const rose = (cx, cy, r, c, dark) => [E(cx, cy, r, r * 0.9, c), F(E(cx + r * 0.15, cy - r * 0.1, r * 0.62, r * 0.55, dark)), F(E(cx - r * 0.1, cy - r * 0.15, r * 0.38, r * 0.32, c)), F(E(cx + r * 0.05, cy - r * 0.2, r * 0.16, r * 0.14, dark))];
// A faceted crystal: a long diamond with a lit face.
function crystal(cx, cy, w, h, c, lit, tilt = 0) {
  const at = (dx, dy) => [cx + dx * Math.cos(rad(tilt)) - dy * Math.sin(rad(tilt)), cy + dx * Math.sin(rad(tilt)) + dy * Math.cos(rad(tilt))];
  return [T([at(0, -h), at(w, -h * 0.25), at(w * 0.7, h * 0.6), at(0, h), at(-w * 0.7, h * 0.6), at(-w, -h * 0.25)], c), F(T([at(0, -h), at(w, -h * 0.25), at(0, h * 0.2)], lit)), F(E(...at(-w * 0.3, -h * 0.35), w * 0.18, w * 0.18, WHITE))];
}
// A star of `n` points.
function star(cx, cy, r, c, n = 5, k = 0.45) {
  return T(ring(n * 2, (i) => {
    const a = (i * Math.PI) / n - Math.PI / 2;
    const rr = i % 2 ? r * k : r;
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
  }), c);
}
// A crescent moon whose horns open toward angle phi (degrees).
function crescent(cx, cy, r, c, phi = 0) {
  const p = rad(phi);
  const at = (ox, rr, a) => [cx + ox * Math.cos(p) + rr * Math.cos(p + rad(a)), cy + ox * Math.sin(p) + rr * Math.sin(p + rad(a))];
  return T([...ring(9, (i) => at(0, r, 40 + i * 35)), ...ring(7, (i) => at(r * 0.24, r * 0.83, 309.6 - i * 43.2))], c);
}
const wrist = (hx, hy, ex, ey) => [lerp(hx, ex, 0.3), lerp(hy, ey, 0.3)];

// ---------- Rootwood (Rootwood Hollow's chest): an acorn cap, vines, and a mossy bark cloak ----------

const MOSS = '#8fcf7a';
const rootwood = {
  hat(t, p, m) {
    const cap = darker(p.main, 0.12);
    const s = m.hair * 0.4;
    // The acorn cap, worn tipped back like a beret, its scales in rows, a stem and a sprout.
    const out = [T(ring(17, (i) => {
      const a = Math.PI + (Math.PI * i) / 16;
      return [15.8 + Math.cos(a) * 11.4, 7.6 + Math.sin(a) * 6.6];
    }), cap), E(15.8, 7.8, 11.8, 1.8, darker(p.main, 0.28))];
    for (const [y, n, w] of [[5.6, 7, 9.6], [3.2, 5, 7.2], [1.4, 3, 4.4]]) {
      for (let i = 0; i < n; i++) out.push(F(E(15.8 - w + (i * 2 * w) / (n - 1), y, 1.2, 0.7, lighter(cap, 0.08))));
    }
    out.push(limb(15.8, 1.4, 16.6 + s, -1.6, 0.8, 0.5, '#7a5a3c'), ...leaf(16.4 + s, -1.4, 4.2, 1.5, -30 + s * 6, MOSS, darker(MOSS, 0.2)), ...leaf(16 + s, -1, 3, 1.1, -150 + s * 6, lighter(MOSS, 0.08)));
    return out;
  },
  hatBack: () => [],
  hatTucks: () => false,
  hatHidesBangs: () => false,
  top(base, t, p) {
    // A vine for a belt, a leaf brooch at the collar, and a patch of moss on the shoulder.
    return [...base, F(R(9.8, 33.4, 11.8, 1, '#5f8f4a')), ...leaf(12, 33.8, 2.6, 1, 150, MOSS), ...leaf(19, 33.8, 2.6, 1, 20, MOSS),
      ...leaf(MID - 0.4, 27.6, 2.8, 1.2, 60, MOSS, darker(MOSS, 0.2)), ...leaf(MID + 0.4, 27.6, 2.6, 1.1, 120, lighter(MOSS, 0.06)), F(E(MID, 27.4, 0.7, 0.7, '#ffd66b')),
      F(E(20.2, 27.6, 1.6, 0.9, MOSS)), F(E(21, 28.4, 1, 0.6, lighter(MOSS, 0.1)))];
  },
  hand(base, t, p, hx, hy, ex, ey) {
    const [wx, wy] = wrist(hx, hy, ex, ey);
    return [...base, F(E(wx, wy, 1.6, 0.9, '#5f8f4a')), ...leaf(wx + 0.6, wy - 0.4, 2, 0.8, -40, MOSS)];
  },
  cape(t, p, m) {
    const s = m.sway;
    const bark = darker(p.main, 0.2);
    const out = [T(cloak(46, 1, s, 5, 2.4), bark)];
    // Bark grooves running down it.
    for (const x of [7.4, 11.6, 19.4, 23.6]) out.push(F(limb(x + 0.4, 30, x + s * 0.8 + (x - MID) * 0.06, 45, 0.45, 0.3, darker(bark, 0.25))));
    // A ragged mossy collar over the shoulders, and a little mushroom by the hem.
    out.push(T([[7, 25.6], [24, 25.6], [25, 29.6], [23, 28.6], [21.4, 30.6], [19.6, 29], [17.8, 31], [15.6, 29.2], [13.4, 31], [11.6, 29], [9.8, 30.6], [8.2, 28.6], [6.2, 29.6]], MOSS));
    out.push(R(5.6 + s, 42.4, 1.2, 2.6, '#fff1dc'), E(6.2 + s, 42.4, 2.4, 1.4, '#e5485f'), F(E(5.4 + s, 42, 0.45, 0.35, WHITE)), F(E(7, 42.2, 0.35, 0.3, WHITE)));
    return out;
  },
  capeFront: () => [],
};

// ---------- Dryad Bloom (Sylvana's set): a flower crown, petal collar, and a cape of petals ----------

const dryad = {
  hat(t, p, m) {
    const s = m.hair * 0.3;
    const out = [];
    // A ring of leaves and flowers around the head, a big bloom at the side.
    for (let i = 0; i < 9; i++) {
      const a = 200 + i * 17.5;
      const x = 15.6 + Math.cos(rad(a)) * 11.2;
      const y = 9.4 + Math.sin(rad(a)) * 5.4;
      out.push(...leaf(x, y, 3, 1.1, a + 90 + (i % 2 ? 40 : -40), i % 2 ? p.main : darker(p.main, 0.1)));
    }
    for (let i = 0; i < 5; i++) {
      const a = 210 + i * 30;
      out.push(...bloom(15.6 + Math.cos(rad(a)) * 11.2, 9.4 + Math.sin(rad(a)) * 5.4, 1.5, i % 2 ? WHITE : p.accent));
    }
    out.push(...bloom(25.2 + s * 0.3, 7.4, 2.8, p.accent), ...leaf(26.6, 9.4, 3.4, 1.2, 40 + s * 10, p.main));
    return out;
  },
  hatBack: () => [],
  hatTucks: () => false,
  hatHidesBangs: () => false,
  top(base, t, p) {
    // A collar of pink petals and a leafy sash.
    const petals = ring(6, (i) => {
      const x = 11.2 + i * 1.84;
      return T([[x - 1.4, 26], [x + 1.4, 26], [x + 0.6, 28.4], [x, 29.2], [x - 0.6, 28.4]], i % 2 ? p.accent : lighter(p.accent, 0.1));
    });
    return [...base, ...petals, F(limb(10.2, 29.6, 21.2, 34.4, 0.9, 0.9, p.main)), ...leaf(20.6, 34.2, 2.6, 1, 40, darker(p.main, 0.12)), ...bloom(MID, 28.6, 1.3, WHITE)];
  },
  hand(base, t, p, hx, hy, ex, ey) {
    const [wx, wy] = wrist(hx, hy, ex, ey);
    return [...base, ...ring(4, (i) => F(E(wx - 1.2 + i * 0.8, wy, 0.75, 0.75, i % 2 ? p.accent : WHITE)))];
  },
  cape(t, p, m) {
    const s = m.sway;
    const out = [];
    // Long leaves fanning out from the shoulders, pink petals layered over them.
    for (let i = 0; i < 7; i++) {
      const u = i / 6;
      const a = 120 - u * 60 + s * 2;
      out.push(...leaf(lerp(9.6, 21.6, u), 27, 18 + Math.sin(u * Math.PI) * 3, 3.2, a, i % 2 ? p.main : darker(p.main, 0.1), darker(p.main, 0.25)));
    }
    for (let i = 0; i < 5; i++) {
      const u = i / 4;
      out.push(...leaf(lerp(10.4, 20.8, u), 27.4, 13, 2.6, 115 - u * 50 + s * 3, i % 2 ? p.accent : lighter(p.accent, 0.12)));
    }
    return out;
  },
  capeFront: (t, p) => [...bloom(MID, 26.6, 1.6, p.accent)],
};

// ---------- Night Rose (Lilith's set): a rose veil, lace, and a cape of thorny vines ----------

const nightrose = {
  hat(t, p, m) {
    const s = m.hair * 0.3;
    const lace = p.accent;
    const out = [
      // A lace headband over the crown, three roses at the side, and a short net veil.
      T([...ring(9, (i) => {
        const g = rad(205 + i * 16.25);
        return [15.6 + Math.cos(g) * 11, 12.4 + Math.sin(g) * 10.4];
      }), ...ring(9, (i) => {
        const g = rad(335 - i * 16.25);
        return [15.6 + Math.cos(g) * 9.6, 12.4 + Math.sin(g) * 9];
      })], lace),
      ...ring(5, (i) => {
        const g = rad(220 + i * 25);
        return F(E(15.6 + Math.cos(g) * 10.3, 12.4 + Math.sin(g) * 9.7, 0.6, 0.6, lighter(lace, 0.2)));
      }),
      T([[22, 4.4], [26.6, 6.4], [27.6 + s, 13.2], [25 + s, 14], [22.6, 10.6]], mix(lace, '#ffffff', 0.15)),
    ];
    for (const [x, y] of [[24.4 + s, 13.8], [21.6 + s * 0.6, 12.6], [27 + s, 11.2]]) out.push(F(E(x, y, 0.35, 0.35, lighter(lace, 0.3))));
    out.push(...leaf(23.6, 5.4, 3, 1, -60, '#3f7a4a'), ...rose(24.6, 6.4, 2.4, p.main, darker(p.main, 0.3)), ...rose(21.8, 5.4, 1.8, p.main, darker(p.main, 0.3)), ...rose(26.6, 8.6, 1.6, lighter(p.main, 0.08), darker(p.main, 0.3)));
    return out;
  },
  hatBack: () => [],
  hatTucks: () => false,
  hatHidesBangs: () => false,
  top(base, t, p) {
    const lace = p.accent;
    // A scalloped lace collar and a rose corsage with ribbon tails.
    const scallops = ring(6, (i) => E(11 + i * 1.84, 26.6, 1.1, 0.9, lace));
    return [...base, ...scallops, F(R(10.4, 25.8, 10.4, 0.9, lace)), F(limb(19, 29.6, 18.2, 33, 0.5, 0.3, lace)), F(limb(19.6, 29.6, 20.6, 32.6, 0.5, 0.3, lace)),
      ...leaf(18.4, 29.2, 2.2, 0.8, 200, '#3f7a4a'), ...rose(19.4, 28.8, 1.7, p.main, darker(p.main, 0.3))];
  },
  hand(base, t, p, hx, hy, ex, ey) {
    const [wx, wy] = wrist(hx, hy, ex, ey);
    return [...base, F(E(wx, wy, 1.7, 1, p.accent)), ...ring(3, (i) => F(E(wx - 1 + i, wy + 1, 0.5, 0.5, p.accent))), ...rose(wx, wy - 0.2, 0.8, p.main, darker(p.main, 0.3))];
  },
  cape(t, p, m) {
    const s = m.sway;
    const out = [T(cloak(46.4, 2, s, 7, -1.6), darker(p.main, 0.35)), T(cloak(45.4, 1.2, s * 0.9, 7, -1.4), p.accent)];
    // Thorny vines climbing it, roses blooming at the hem.
    for (const [x0, dir] of [[6.6, 1], [24.4, -1]]) {
      out.push(F(limb(x0 + s, 45, x0 + dir * 3 + s * 0.6, 37, 0.45, 0.35, '#3f7a4a')), F(limb(x0 + dir * 3 + s * 0.6, 37, x0 + dir * 1 + s * 0.3, 30, 0.35, 0.25, '#3f7a4a')));
      for (const y of [41, 34]) out.push(F(T([[x0 + dir * 2 + s * 0.7, y], [x0 + dir * 3.4 + s * 0.7, y - 0.6], [x0 + dir * 2.2 + s * 0.7, y + 0.6]], '#3f7a4a')));
    }
    out.push(...rose(7.6 + s, 44.6, 1.9, p.main, darker(p.main, 0.3)), ...rose(23.4 + s, 44.8, 1.9, p.main, darker(p.main, 0.3)), ...rose(MID + s, 45.4, 1.5, lighter(p.main, 0.08), darker(p.main, 0.3)));
    return out;
  },
  capeFront: () => [],
};

// ---------- Prism (the Crystal King's set): a crown of floating crystals and a faceted mantle ----------

const RAINBOW = ['#ff9ec0', '#ffd66b', '#9be08f', '#8fd3ff', '#c9a6ff'];
const prism = {
  hat(t, p, m) {
    const bob = Math.sin(m.hair * 1.5) * 0.4;
    const lit = lighter(p.accent, 0.12);
    // A thin band with a gem, and five crystals floating over the head in an arc.
    const out = [T([[6, 8], [25.2, 8], [25, 9.2], [6.2, 9.2]], p.trim), ...crystal(MID, 7.4, 1.4, 2, p.accent, lit)];
    ring(5, (i) => {
      const u = i / 4;
      const x = lerp(7.6, 23.6, u);
      const y = 2 - Math.sin(u * Math.PI) * 3 + (i % 2 ? bob : -bob);
      out.push(...crystal(x, y, i === 2 ? 1.8 : 1.3, i === 2 ? 3.4 : 2.4, i % 2 ? p.main : p.accent, lit, (u - 0.5) * 30));
    });
    return out;
  },
  hatBack: () => [],
  hatTucks: () => false,
  hatHidesBangs: () => false,
  top(base, t, p) {
    // A faceted crystal at the chest and a thin rainbow line across it.
    return [...base, ...RAINBOW.map((c, i) => F(R(10, 32.2 + i * 0.36, 11.4, 0.36, c))), ...crystal(MID, 29.4, 1.6, 2.4, p.accent, lighter(p.accent, 0.12))];
  },
  hand(base, t, p, hx, hy, ex, ey) {
    const [wx, wy] = wrist(hx, hy, ex, ey);
    return [...base, F(E(wx, wy, 1.5, 0.8, p.trim)), ...crystal(wx, wy - 1, 0.8, 1.4, p.accent, WHITE)];
  },
  cape(t, p, m) {
    const s = m.sway;
    const out = [];
    // A mantle of crystal facets, light and dark in turn, to a jagged hem; shards hang below.
    const top = [[8.6, 26], [22.4, 26]];
    const hem = ring(9, (i) => [lerp(26.8 + s, 4.2 + s, i / 8), 44 + (i % 2 ? 3.4 : 0)]);
    out.push(T([...top, [25.6 + s / 2, 36], ...hem, [5.4 + s / 2, 36]], p.main));
    for (let i = 0; i < 8; i++) {
      const [x0, y0] = hem[i];
      const [x1, y1] = hem[i + 1];
      out.push(F(T([[lerp(22.4, 8.6, i / 8), 27], [lerp(22.4, 8.6, (i + 1) / 8), 27], [x1, y1], [x0, y0]], i % 2 ? darker(p.main, 0.12) : lighter(p.main, 0.08))));
    }
    out.push(...crystal(7 + s * 1.2, 49.6, 0.9, 1.6, p.accent, WHITE), ...crystal(24 + s * 1.2, 49.8, 0.9, 1.6, p.accent, WHITE));
    return out;
  },
  capeFront: () => [],
};

// ---------- Moonlight (Selene's set): a crescent tiara and a starry night cape ----------

const moonlight = {
  hat(t, p, m) {
    const s = m.hair * 0.3;
    // A slim silver tiara rising to a crescent moon, stars hung either side, a sheer veil behind.
    return [
      T([[6.4, 8.6], [12, 6.4], [MID, 4.4], [19.2, 6.4], [24.8, 8.6], [24.6, 9.6], [19.2, 7.6], [MID, 5.8], [12, 7.6], [6.6, 9.6]], '#eef2ff'),
      crescent(MID, 2.4, 3.4, p.accent, 90), F(E(MID, 5, 0.8, 0.8, p.main)),
      F(star(10.2, 5.6 + s * 0.2, 1.2, p.accent)), F(star(21, 5.6 - s * 0.2, 1.2, p.accent)),
      F(limb(8, 8.6, 7.6 + s, 11, 0.2, 0.2, '#eef2ff')), F(star(7.6 + s, 11.6, 0.8, p.accent, 4, 0.35)),
      F(limb(23.2, 8.6, 23.6 + s, 11, 0.2, 0.2, '#eef2ff')), F(star(23.6 + s, 11.6, 0.8, p.accent, 4, 0.35)),
    ];
  },
  hatBack(t, p, m) {
    const s = m.sway * 0.6;
    return [T([[5.6, 7.6], [25.4, 7.6], [28 + s, 24], [3 + s, 24]], mix(p.main, '#ffffff', 0.55))];
  },
  hatTucks: () => false,
  hatHidesBangs: () => false,
  top(base, t, p) {
    // A star brooch and a silver sash.
    return [...base, F(limb(10.4, 27.6, 20.8, 34, 0.7, 0.7, '#eef2ff')), F(star(MID, 27.8, 1.6, p.accent)), F(E(MID, 27.8, 0.5, 0.5, WHITE))];
  },
  hand(base, t, p, hx, hy, ex, ey) {
    const [wx, wy] = wrist(hx, hy, ex, ey);
    return [...base, F(E(wx, wy, 1.6, 0.8, '#eef2ff')), F(star(wx, wy + 0.2, 0.8, p.accent, 4, 0.4))];
  },
  cape(t, p, m) {
    const s = m.sway;
    const night = '#3f4f9a';
    const out = [T(cloak(48, 2.4, s, 6), p.main), T(cloak(47, 1.8, s * 0.95, 6), night)];
    // Stars scattered over it, and a crescent at the hem.
    for (const [x, y, r] of [[7.6, 33, 0.9], [11.6, 39, 0.7], [20, 36, 0.8], [24, 42, 0.9], [9.4, 44, 0.7], [17.6, 43, 0.6], [22.4, 30.6, 0.6]]) out.push(F(star(x + s * (y - 26) / 20, y, r, p.accent, 4, 0.35)));
    out.push(crescent(MID + s, 44, 2, p.accent, 120));
    return out;
  },
  capeFront: () => [],
};

export const SET_DESIGNS = { rootwood, sylvana: dryad, tamamo: foxfire, lilith: nightrose, crystalking: prism, selene: moonlight };

// The module a set piece draws with: the set's own pieces over the job's.
const cache = new Map();
export function setModule(set, family, base) {
  const key = `${set}:${family}`;
  if (cache.has(key)) return cache.get(key);
  const d = SET_DESIGNS[set];
  const mod = !d ? base : {
    ...base,
    hat: d.hat ? (t, p, m) => d.hat(t, p, m, family) : base.hat,
    hatBack: d.hatBack ? (t, p, m) => d.hatBack(t, p, m, family) : base.hatBack,
    hatTucks: d.hatTucks ?? base.hatTucks,
    hatHidesBangs: d.hatHidesBangs ?? base.hatHidesBangs,
    top: d.top ? (t, p, m) => d.top(base.top(t, p, m), t, p, m, family) : base.top,
    hand: d.hand ? (t, p, hx, hy, ex, ey) => d.hand(base.hand(t, p, hx, hy, ex, ey), t, p, hx, hy, ex, ey, family) : base.hand,
    cape: d.cape ? (t, p, m) => d.cape(t, p, m, family) : base.cape,
    capeFront: d.capeFront ? (t, p, m) => d.capeFront(t, p, m, family) : base.capeFront,
  };
  cache.set(key, mod);
  return mod;
}

export { mix, rad, mirrorX };
