// Landmarks: the big centerpiece props of each map (huge old trees, totems, ruined arches,
// glowing crystal spires, a lighthouse...), drawn in the same outlined, flat-pastel chibi style as
// the rest of the scenery. Each one stands with its base centered on (x, y), sunk a few pixels into
// the ground so it looks planted. Sprites are cached per variant and frame; animation only picks
// among a few cached frames or adds soft canvas glows, beams, smoke, and glints on top.

import { R, E, T, F, sprite, blit, shade, mix, snap } from './pixel.js';

const INK = '#3a2d4f';
const BLUSH = '#ff9fb8';
// How far the base sinks into the ground.
const SINK = 3;

// ---------- Sprite helpers (local copies of the scenery ones) ----------

function art(key, w, h, build) {
  return sprite(`lm|${key}`, () => ({ w, h, shapes: build().filter(Boolean), res: 2, soft: 'cel', crisp: true }));
}
function place(ctx, s, x, y, opts) {
  blit(ctx, s, snap(x - s.w / 2), snap(y - s.h), opts);
}

function arc(cx, cy, rx, ry, a0, a1, th, c) {
  const outer = [];
  const inner = [];
  for (let i = 0; i <= 6; i++) {
    const a = ((a0 + ((a1 - a0) * i) / 6) * Math.PI) / 180;
    outer.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
    inner.push([cx + (rx - th) * Math.cos(a), cy + (ry - th) * Math.sin(a)]);
  }
  return F(T([...outer, ...inner.reverse()], c));
}

function face(cx, cy, gap, mood = 'open', mouth = 'smile', k = 1) {
  const out = [];
  const th = 0.4 * Math.max(1, k * 0.8);
  for (const s of [-1, 1]) {
    const ex = cx + s * gap;
    if (mood === 'open') out.push(F(E(ex, cy, 0.6 * k, 0.8 * k, INK)), F(E(ex - 0.2 * k, cy - 0.3 * k, 0.22 * k, 0.22 * k, '#ffffff')));
    else if (mood === 'happy') out.push(arc(ex, cy + 0.4 * k, 0.8 * k, 0.7 * k, 200, 340, th, INK));
    else out.push(arc(ex, cy - 0.3 * k, 0.8 * k, 0.6 * k, 20, 160, th, INK));
    out.push(F(E(ex + s * k, cy + 1.2 * k, 0.7 * k, 0.35 * k, BLUSH)));
  }
  if (mouth === 'smile') out.push(arc(cx, cy + 0.6 * k, 0.7 * k, 0.7 * k, 30, 150, th, INK));
  else if (mouth === 'o') out.push(F(E(cx, cy + 1.3 * k, 0.4 * k, 0.45 * k, INK)));
  return out;
}

const blinking = (time, seed) => ((time * 0.35 + seed * 7.3) % 1) < 0.045;

// The outline of a band following `path`, `widthAt(u)` half as wide at each point.
function bandPts(path, widthAt) {
  const left = [];
  const right = [];
  path.forEach(([x, y], i) => {
    const [ax, ay] = path[Math.max(0, i - 1)];
    const [bx, by] = path[Math.min(path.length - 1, i + 1)];
    const l = Math.hypot(bx - ax, by - ay) || 1;
    const nx = -(by - ay) / l;
    const ny = (bx - ax) / l;
    const w = widthAt(i / (path.length - 1));
    left.push([x + nx * w, y + ny * w]);
    right.push([x - nx * w, y - ny * w]);
  });
  return [...left, ...right.reverse()];
}
const band = (path, widthAt, c) => T(bandPts(path, widthAt), c);

// An inner contour color: a deep shade of the part, so overlapping clumps read as layers.
const line = (c) => mix(shade(c, -34), INK, 0.3);
// An ellipse with a thin inner contour, for leaf clumps, cloud puffs, and stones.
const ringed = (x, y, rx, ry, c, k = 0.9) => [F(E(x, y, rx + k, ry + k, line(c))), E(x, y, rx, ry, c)];

// A five-petal flower.
function bloom(x, y, r, c) {
  const out = [];
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
    out.push(F(E(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.8, r * 0.8, c)));
  }
  out.push(F(E(x, y, r * 0.55, r * 0.55, c === '#ffe36b' ? '#ff9f5a' : '#ffe36b')));
  return out;
}

// A small diamond (crystal specks, sparkly bits).
const diamond = (x, y, rx, ry, c) => T([[x, y - ry], [x + rx, y], [x, y + ry], [x - rx, y]], c);

// Piecewise-linear edge: points [[y, x], ...] sorted by y.
function edge(pts) {
  return (y) => {
    if (y <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) {
      const [y1, x1] = pts[i];
      if (y <= y1) {
        const [y0, x0] = pts[i - 1];
        return x0 + ((x1 - x0) * (y - y0)) / (y1 - y0);
      }
    }
    return pts[pts.length - 1][1];
  };
}
// A horizontal strip of a shape between its edges, from y0 to y1.
function strip(xl, xr, y0, y1, c) {
  return T([[xl(y0), y0], [xr(y0), y0], [xr(y1), y1], [xl(y1), y1]], c);
}

function tuft(x, y, c = '#86d98c') {
  return T([[x - 3, y], [x - 2.6, y - 3.6], [x - 1.2, y - 1.4], [x, y - 5], [x + 1.2, y - 1.4], [x + 2.6, y - 3.6], [x + 3, y]], c);
}

// Seeds can be small integers or 0..1 hashes; both pick a variant.
function variant(seed, n) {
  const v = Number.isInteger(seed) ? seed : Math.floor(Math.abs(seed) * 1000);
  return ((v % n) + n) % n;
}

// ---------- Canvas effects ----------

function glow(ctx, x, y, r, color, alpha, add = false) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  if (add) ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}

function sparkle(ctx, x, y, r, color, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
  ctx.restore();
}

// Glints that twinkle one after another over a set of points.
function twinkles(ctx, x0, y0, pts, time, speed, color = '#ffffff', size = 2.6) {
  pts.forEach(([px, py], i) => {
    const p = (time * speed + i * 0.37) % 1.6;
    if (p > 1) return;
    const a = Math.sin(p * Math.PI);
    sparkle(ctx, x0 + px, y0 + py, size * a + 0.4, color, a);
  });
}

// Soft puffs drifting up from (x, y).
function smoke(ctx, x, y, time, seed = 0) {
  ctx.save();
  for (let k = 0; k < 3; k++) {
    const p = (time * 0.3 + k / 3 + seed * 0.13) % 1;
    ctx.globalAlpha = 0.55 * (1 - p) * Math.min(1, p * 6);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x + Math.sin(p * 5 + k) * 2.4 + p * 5, y - p * 26, 2 + p * 4.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ---------- Forest and meadow ----------

const BARK = '#b8896a';
const BARK_LIGHT = '#d6aa86';
const BARK_DEEP = '#8a6450';

function bigtreeArt(v, frame) {
  const sway = [-1, 0, 1, 0][frame];
  const pal = v
    ? { back: '#74c294', mid: '#ffb3d1', front: '#ffd3e5', hi: '#fff0f6', dot: '#ffffff' }
    : { back: '#62b884', mid: '#86d792', front: '#b0e99c', hi: '#dcf8c8', dot: '#ff9ab0' };
  return art(`bigtree|${v}|${frame}`, 112, 172, () => {
    const out = [];
    // Roots spreading over the ground, then the twisting trunk and its two big boughs.
    for (const [path, w] of [[[[44, 150], [32, 163], [14, 172.6]], 6.4], [[[66, 150], [80, 163], [98, 172.6]], 6.4], [[[50, 160], [42, 167], [32, 172.6]], 3.6], [[[62, 160], [70, 167], [80, 172.6]], 3.6]]) {
      out.push(band(path, (u) => w * (1 - u) + 1.2, BARK));
    }
    out.push(band([[56, 174], [53, 154], [58, 132], [53, 110], [56, 90], [56, 70]], (u) => 15 - u * 7, BARK));
    out.push(band([[53, 100], [42, 88], [28, 80]], (u) => 4.6 - u * 2.4, BARK), band([[59, 96], [71, 85], [86, 78]], (u) => 4.6 - u * 2.4, BARK));
    out.push(F(band([[48, 162], [46.4, 142], [50.6, 122], [47.6, 104]], () => 1.1, BARK_LIGHT)), F(band([[64, 158], [65, 136], [61, 116]], () => 0.8, BARK_DEEP)),
      F(band([[57, 146], [58.6, 136]], () => 0.6, BARK_DEEP)));
    // The canopy: dark clumps at the back, mid clumps, then bright ones in front; tops sway most.
    const s = (y) => sway * Math.max(0, (100 - y) / 90);
    const clump = (x, y, rx, ry, c) => ringed(x + s(y), y, rx, ry, c);
    for (const [x, y, rx, ry] of [[28, 72, 22, 15], [84, 72, 22, 15], [56, 52, 42, 30], [16, 48, 15, 14], [96, 48, 15, 14], [56, 20, 26, 18]]) out.push(...clump(x, y, rx, ry, pal.back));
    for (const [x, y, rx, ry] of [[36, 36, 22, 18], [76, 36, 22, 18], [56, 64, 28, 16], [20, 62, 14, 10], [92, 62, 14, 10], [56, 14, 19, 12]]) out.push(...clump(x, y, rx, ry, pal.mid));
    for (const [x, y, rx, ry] of [[44, 22, 13, 10], [69, 25, 12, 9], [31, 52, 11, 8], [82, 51, 11, 8], [56, 44, 14, 10]]) {
      out.push(...clump(x, y, rx, ry, pal.front), F(E(x + s(y) - rx * 0.3, y - ry * 0.4, rx * 0.4, ry * 0.25, pal.hi)));
    }
    for (const [x, y] of [[22, 44], [40, 66], [70, 66], [94, 58], [60, 30], [32, 28], [84, 36], [14, 60], [50, 8], [76, 16]]) {
      out.push(F(E(x + s(y), y, 1.6, 1.6, pal.dot)), F(E(x + s(y) - 0.5, y - 0.5, 0.5, 0.5, '#ffffff')));
    }
    // A sleepy face in the bark, a knot-hole, and a tiny round door between the roots.
    out.push(...face(55, 112, 4.6, 'closed', 'none', 1.6), F(E(55, 117, 1.2, 0.8, INK)));
    out.push(E(63, 132, 3.2, 4, BARK_DEEP), F(E(63.4, 132.8, 2, 2.8, '#5a4048')), F(E(62, 129.4, 2.6, 0.8, BARK_LIGHT)));
    out.push(R(49, 155, 13, 17, '#ffd08f'), E(55.5, 155, 6.5, 6, '#ffd08f'), R(50.4, 156, 10.2, 16, '#e39f6c'), E(55.5, 156, 5.1, 4.8, '#e39f6c'),
      F(R(55, 152, 1, 20, '#c98457')), F(E(59, 164, 0.9, 0.9, '#ffe36b')), F(E(55.5, 155, 2, 2, '#fff3a6')), F(R(55.2, 153, 0.6, 4, '#c98457')), F(R(53.5, 154.7, 4, 0.6, '#c98457')),
      E(55.5, 172, 9, 1.6, '#d9d0e8'));
    // Mushrooms and grass at the foot.
    out.push(R(30.6, 165, 2.4, 6, '#fff1dc'), E(31.8, 165, 4, 2.6, '#ff8fa8'), F(E(30.6, 164.2, 1, 0.6, '#ffffff')), R(36, 168, 1.8, 3.6, '#fff1dc'), E(36.9, 168, 2.6, 1.8, '#ff8fa8'),
      tuft(78, 172), tuft(86, 172, '#7fcf86'), tuft(24, 172));
    return out;
  });
}

function giantshroomArt(v, blink) {
  const cap = ['#ff9ec0', '#ffb38a', '#c9a6ff'][v];
  return art(`giantshroom|${v}|${blink}`, 72, 92, () => {
    const stalk = '#fff1dc';
    const out = [
      // Chimney poking out of the cap.
      R(52, 6, 7, 14, '#c9bedc'), R(51, 4, 9, 3.4, '#b5a8c9'),
      T([[22, 92], [24.6, 64], [23.6, 44], [48.4, 44], [47.4, 64], [50, 92]], stalk), E(36, 91, 18, 3, stalk),
      F(T([[26, 90], [27.6, 64], [27, 48], [29.6, 48], [30, 64], [29, 90]], '#fffaf0')),
    ];
    // Round window with a little curtain glow, and a door with a step.
    out.push(E(29, 58, 4.8, 4.8, '#e0b98a'), F(E(29, 58, 3.6, 3.6, '#fff3a6')), F(R(28.6, 54.4, 0.8, 7.2, '#e0b98a')), F(R(25.4, 57.6, 7.2, 0.8, '#e0b98a')),
      E(43, 62, 2.6, 2.6, '#e0b98a'), F(E(43, 62, 1.7, 1.7, '#fff3a6')),
      R(31, 76, 11, 16, '#d39a6a'), E(36.5, 76, 5.5, 4.6, '#d39a6a'), F(R(36, 73, 0.8, 19, '#b97f55')), F(E(40, 84, 0.9, 0.9, '#ffe36b')), R(29, 90, 15, 2.4, '#e6dccd'));
    // Gills under the cap, then the spotted cap with a happy face.
    out.push(E(36, 44, 29, 5, '#f3d9c0'), F(E(36, 45, 24, 2.4, '#e6c4a6')));
    const dome = [];
    for (let i = 0; i <= 16; i++) {
      const a = Math.PI + (Math.PI * i) / 16;
      dome.push([36 + Math.cos(a) * 35, 42 + Math.sin(a) * 40]);
    }
    out.push(T(dome, cap), E(36, 41, 35, 5.4, cap), F(E(36, 44, 31, 2.4, shade(cap, -8))));
    out.push(F(E(20, 14, 6, 3, shade(cap, 14))));
    for (const [x, y, rx, ry] of [[12, 28, 4.6, 3.6], [24, 10, 5, 3.6], [47, 9, 4, 3], [60, 26, 4.8, 3.6], [36, 5, 2.4, 1.6], [6, 38, 2.4, 1.8], [66, 38, 2.2, 1.8], [52, 20, 2, 1.6]]) {
      out.push(F(E(x, y, rx, ry, '#ffffff')));
    }
    out.push(...face(36, 30, 6.4, blink ? 'closed' : 'happy', 'smile', 1.7));
    out.push(tuft(20, 92), tuft(53, 92, '#7fcf86'), ...bloom(16, 89, 1.3, '#ffe36b'), ...bloom(57, 90, 1.2, '#ffffff'));
    return out;
  });
}

function signpostArt() {
  return art('signpost', 34, 46, () => {
    const wood = '#c99a6b';
    return [
      R(15, 8, 4, 38, '#b88a5c'), F(R(15.6, 8, 1, 38, '#d0a274')), E(17, 8, 2.6, 1.6, '#a77a4f'),
      T([[3, 12], [26, 12], [31, 16.6], [26, 21.2], [3, 21.2]], '#f0c290'), F(R(6, 15, 15, 1, wood)), F(R(6, 17.6, 10, 1, wood)), F(E(5, 16.6, 0.7, 0.7, '#8a5a3c')),
      T([[3, 28.6], [8, 24], [31, 24], [31, 33.2], [8, 33.2]], '#ffd9ae'), F(R(12, 27, 15, 1, wood)), F(R(15, 29.6, 11, 1, wood)), F(E(29, 28.6, 0.7, 0.7, '#8a5a3c')),
      // A little bluebird perched on top.
      E(17, 4.6, 3.6, 2.8, '#9fd8ff'), E(19.6, 2.6, 2.4, 2.2, '#9fd8ff'), T([[21.6, 2.2], [23.6, 2.8], [21.6, 3.4]], '#ffb347'), T([[13.8, 4], [11.6, 2.6], [13.4, 5.6]], '#9fd8ff'),
      F(E(20.2, 2.2, 0.45, 0.55, INK)), F(E(19.8, 3.4, 0.55, 0.3, BLUSH)), F(E(16, 4.8, 1.8, 1.1, '#c4e8ff')),
      tuft(13, 46), tuft(22, 46, '#7fcf86'), ...bloom(9, 43.4, 1.3, '#ff9ec0'), E(26, 44.6, 3, 1.8, '#d6cfe6'),
    ];
  });
}

const FLOWERS = ['#ff9ec0', '#ffe36b', '#ffffff', '#c9a6ff', '#ffb38a'];

function flowerarchArt() {
  return art('flowerarch', 80, 78, () => {
    const wood = '#fff4e6';
    const vine = '#6cc070';
    const leaf = '#8fdc9a';
    const out = [R(5, 26, 9, 50, wood), R(66, 26, 9, 50, wood), R(3, 73, 13, 5, '#f0e2cf'), R(64, 73, 13, 5, '#f0e2cf')];
    // Lattice on the posts.
    for (const x of [5, 66]) {
      for (let y = 30; y < 70; y += 8) out.push(F(T([[x, y], [x + 1, y], [x + 9, y + 8], [x + 8, y + 8]], '#e6d6c4')), F(T([[x + 9, y], [x + 8, y], [x, y + 8], [x + 1, y + 8]], '#e6d6c4')));
    }
    const pts = (r, ry, a0, a1, n, wob = 0) => {
      const p = [];
      for (let i = 0; i <= n; i++) {
        const a = Math.PI + a0 + ((a1 - a0) * i) / n;
        const w = 1 + Math.sin(i * 1.7) * wob;
        p.push([40 + Math.cos(a) * r * w, 30 + Math.sin(a) * ry * w]);
      }
      return p;
    };
    out.push(band(pts(30.5, 26, 0, Math.PI, 18), () => 4.4, wood), F(band(pts(30.5, 26, 0.1, Math.PI - 0.1, 18), () => 0.6, '#e6d6c4')));
    // Vines winding over the arch and down the posts, thick with leaves.
    out.push(band(pts(30.5, 26, -0.1, Math.PI + 0.1, 20, 0.08), () => 1.1, vine));
    out.push(band([[9.5, 30], [13, 38], [6, 46], [13, 54], [6, 62], [12, 70], [9, 76]], () => 0.9, vine), band([[70.5, 30], [67, 38], [74, 46], [67, 54], [74, 62], [68, 70], [71, 76]], () => 0.9, vine));
    const along = pts(30.5, 26, -0.05, Math.PI + 0.05, 22, 0.1);
    along.forEach(([x, y], i) => {
      out.push(...ringed(x + Math.sin(i * 2.3) * 2.4, y + Math.cos(i * 1.9) * 2, 3.4, 2.6, i % 2 ? leaf : '#7fd19a', 0.7));
    });
    for (const [x, y] of [[13, 38], [6, 46], [13, 54], [6, 62], [12, 70], [67, 38], [74, 46], [67, 54], [74, 62], [68, 70]]) out.push(...ringed(x, y, 2.6, 2, leaf, 0.6));
    // Wisteria hanging under the arch.
    for (const [k, len] of [[5, 9], [8, 6], [11, 10], [14, 7], [17, 8]]) {
      const [x, y] = pts(30.5, 26, 0, Math.PI, 22)[k];
      out.push(R(x - 0.4, y + 2, 0.8, len * 0.5, vine), T([[x - 2.2, y + 3], [x + 2.2, y + 3], [x, y + 3 + len]], '#c9a6ff'), F(E(x - 0.6, y + 4.4, 0.8, 1.2, '#e6d6ff')));
    }
    along.forEach(([x, y], i) => {
      if (i % 2 === 0) out.push(...bloom(x + Math.cos(i * 1.3) * 2.6, y - 1 + Math.sin(i * 2.1) * 1.6, 1.5, FLOWERS[i % FLOWERS.length]));
    });
    for (const [x, y, c] of [[10, 40, '#ff9ec0'], [8, 58, '#ffe36b'], [11, 66, '#ffffff'], [70, 42, '#ffb38a'], [72, 56, '#ff9ec0'], [69, 66, '#c9a6ff']]) out.push(...bloom(x, y, 1.4, c));
    // Little bushes at the feet.
    out.push(...ringed(3, 73, 4, 3.4, '#86d792', 0.7), ...ringed(77, 73, 4, 3.4, '#86d792', 0.7), ...bloom(3, 71.4, 1.1, '#ff9ec0'), ...bloom(77, 71.4, 1.1, '#ffe36b'));
    return out;
  });
}

function wellArt() {
  return art('well', 46, 54, () => {
    const stone = '#ddd6ec';
    const out = [
      R(8, 9, 2.8, 26, '#b88a5c'), R(35.2, 9, 2.8, 26, '#b88a5c'),
      R(7, 32, 32, 20, stone), E(23, 52, 16, 2.4, stone),
    ];
    // Brick rows, staggered.
    for (let r = 0; r < 4; r++) {
      const y = 36 + r * 4.4;
      out.push(F(R(7, y, 32, 0.7, '#bdb3d4')));
      for (let x = 7 + (r % 2 ? 4 : 0) + 8; x < 39; x += 8) out.push(F(R(x, y - 3.7, 0.7, 3.7, '#bdb3d4')));
    }
    out.push(E(23, 32, 17.4, 4.8, '#ece7f6'), F(E(23, 32, 13.6, 3.2, '#5a4a7a')), F(E(23, 33, 10.4, 1.9, '#8fd3ff')), F(E(20, 32.6, 3, 0.6, '#d6f2ff')),
      // Crank, rope, and bucket.
      R(8, 18, 30, 1.8, '#8a5a3c'), R(38, 17.4, 4, 1.6, '#8a5a3c'), R(40.6, 17.4, 1.6, 5, '#8a5a3c'), E(23, 19, 2.6, 2.6, '#e6c9a0'),
      R(22.6, 20, 0.8, 5, '#e6c9a0'), T([[19.4, 25], [26.6, 25], [25.6, 31], [20.4, 31]], '#d9a273'), F(R(19.8, 26.6, 6.4, 0.8, '#8f7cc4')), F(R(20.2, 29.4, 5.6, 0.8, '#8f7cc4')),
      // Roof with shingle rows and a heart.
      R(4, 12, 38, 2.6, '#e07fa2'), T([[1, 13], [23, 0.4], [45, 13]], '#ff9ec0'));
    for (const y of [5, 8.6]) out.push(F(T([[23 - (y + 0.5) * 1.7, y + 0.5], [23 + (y + 0.5) * 1.7, y + 0.5], [23 + (y + 1.2) * 1.7, y + 1.2], [23 - (y + 1.2) * 1.7, y + 1.2]], '#ffc6dc')));
    out.push(F(E(22, 7.6, 1, 1, '#ffffff')), F(E(24, 7.6, 1, 1, '#ffffff')), F(T([[20.8, 8], [25.2, 8], [23, 10.4]], '#ffffff')));
    // Moss and flowers around the base.
    out.push(...ringed(8, 50, 3.4, 2.4, '#9fe0b0', 0.6), ...ringed(37, 51, 3, 2, '#9fe0b0', 0.6), tuft(4, 54), tuft(42, 54, '#7fcf86'),
      ...bloom(6, 48.6, 1.2, '#ffe36b'), ...bloom(38.6, 49.6, 1.2, '#ff9ec0'), F(E(15, 40, 2.6, 1.4, '#c4ecc8')), F(E(30, 46, 2, 1.1, '#c4ecc8')));
    return out;
  });
}

// ---------- Crag ----------

function totemArt() {
  return art('totem', 38, 124, () => {
    const wood = '#e2a978';
    const teal = '#7fcfc4';
    const red = '#ff8a7a';
    const yel = '#ffd66b';
    const out = [];
    // Wings spreading from the top section, striped in feathers.
    for (const s of [-1, 1]) {
      const X = (x) => 19 + s * x;
      out.push(T([[X(9), 26], [X(13), 20], [X(19), 16], [X(18.6), 22], [X(17), 28], [X(18), 33], [X(15), 38], [X(15.4), 43], [X(9), 46]], red),
        F(T([[X(10), 30], [X(17.2), 28.6], [X(16.6), 31.6], [X(10), 33]], yel)), F(T([[X(10), 36], [X(15.2), 38], [X(15), 40.4], [X(10), 39.4]], teal)),
        F(T([[X(11), 24.6], [X(17.4), 18.8], [X(17.6), 21.4], [X(11), 27]], '#ffb8a8')));
    }
    // Head crest feathers.
    out.push(T([[13, 16], [10, 4], [16, 12]], teal), T([[16, 13], [19, 1], [22, 13]], red), T([[22, 12], [28, 4], [25, 16]], yel));
    // Top: the eagle.
    out.push(R(9, 22, 20, 32, wood), E(19, 21, 10, 8, wood), F(R(9, 46, 20, 2, red)), F(R(9, 49, 20, 1.2, yel)),
      F(E(14.4, 24, 3.4, 3, '#ffffff')), F(E(23.6, 24, 3.4, 3, '#ffffff')), F(E(15, 24.4, 1.6, 1.8, INK)), F(E(23, 24.4, 1.6, 1.8, INK)), F(E(14.6, 23.6, 0.5, 0.5, '#ffffff')), F(E(22.6, 23.6, 0.5, 0.5, '#ffffff')),
      F(T([[11, 20], [17, 21.6], [11, 22]], teal)), F(T([[27, 20], [21, 21.6], [27, 22]], teal)),
      F(T([[15.6, 28], [22.4, 28], [21.6, 33], [19, 37], [18.6, 33]], yel)), F(T([[19, 33], [21.6, 33], [19, 37]], '#f0a64a')),
      F(E(13, 30.6, 1.4, 0.7, BLUSH)), F(E(25, 30.6, 1.4, 0.7, BLUSH)), F(E(19, 42, 4, 1.6, shade(wood, -10))));
    // Middle: the owl, painted teal.
    out.push(R(7, 52, 24, 3, '#c98a5c'), T([[8, 56], [7, 51], [12, 55]], teal), T([[30, 56], [31, 51], [26, 55]], teal), R(9, 55, 20, 30, teal),
      F(E(14, 64, 4.4, 4.4, yel)), F(E(24, 64, 4.4, 4.4, yel)), F(E(14, 64, 2.8, 2.8, '#ffffff')), F(E(24, 64, 2.8, 2.8, '#ffffff')), F(E(14.4, 64.4, 1.6, 1.6, INK)), F(E(23.6, 64.4, 1.6, 1.6, INK)),
      F(E(14, 63.6, 0.5, 0.5, '#ffffff')), F(E(23.2, 63.6, 0.5, 0.5, '#ffffff')), F(T([[17, 68], [21, 68], [19, 72.6]], '#ff9f5a')));
    for (const [x, y] of [[13, 77], [19, 79], [25, 77], [16, 81.6], [22, 81.6]]) out.push(arc(x, y, 2, 1.6, 20, 160, 0.7, '#5aa8a0'));
    // Bottom: the bear.
    out.push(R(7, 84, 24, 3, '#c98a5c'), E(8, 91, 3.4, 3.4, wood), E(30, 91, 3.4, 3.4, wood), F(E(8, 91, 1.8, 1.8, red)), F(E(30, 91, 1.8, 1.8, red)), R(9, 87, 20, 35, wood),
      F(arc(14, 97, 3, 2, 200, 340, 1, teal)), F(arc(24, 97, 3, 2, 200, 340, 1, teal)), F(E(14, 99.4, 1.6, 1.8, INK)), F(E(24, 99.4, 1.6, 1.8, INK)),
      F(E(13.6, 98.8, 0.5, 0.5, '#ffffff')), F(E(23.6, 98.8, 0.5, 0.5, '#ffffff')),
      F(E(19, 106, 5.6, 4.4, '#f6d3a2')), F(E(19, 103.8, 2.2, 1.4, INK)), arc(19, 106, 2.4, 2, 30, 150, 0.6, INK), F(E(12.6, 104, 1.6, 0.8, BLUSH)), F(E(25.4, 104, 1.6, 0.8, BLUSH)),
      F(R(9, 113, 20, 2, red)), F(R(9, 116.4, 20, 1.2, teal)), F(T([[12, 118], [14, 120.4], [16, 118], [18, 120.4], [20, 118], [22, 120.4], [24, 118], [26, 120.4], [26, 121.6], [12, 121.6]], yel)),
      R(6, 120, 26, 4, '#c98a5c'), tuft(5, 124), tuft(33, 124, '#9fd38a'));
    return out;
  });
}

function mesaArt() {
  return art('mesa', 74, 152, () => {
    const xl = edge([[8, 16], [24, 14], [42, 16], [62, 14], [82, 12], [98, 10], [114, 12], [132, 8], [152, 4]]);
    const xr = edge([[8, 58], [20, 60], [32, 57], [50, 60], [72, 58], [92, 62], [110, 60], [130, 64], [152, 70]]);
    const sand = '#eeb37c';
    const out = [T([[xl(152), 152], [xl(132), 132], [xl(114), 114], [xl(98), 98], [xl(82), 82], [xl(62), 62], [xl(42), 42], [xl(24), 24], [14, 10], [20, 6.4], [28, 7.6], [36, 4.4], [46, 6.4], [54, 5.2], [58, 8], [xr(20), 20], [xr(32), 32], [xr(50), 50], [xr(72), 72], [xr(92), 92], [xr(110), 110], [xr(130), 130], [xr(152), 152]], sand)];
    // Strata bands in warm sandstone tones.
    for (const [y0, y1, c] of [[16, 22, '#f8cf9c'], [34, 37, '#d99a64'], [46, 56, '#f6c48e'], [70, 73, '#d99a64'], [84, 96, '#f8cf9c'], [108, 111, '#d99a64'], [122, 134, '#f6c48e'], [142, 145, '#d99a64']]) {
      out.push(F(strip(xl, xr, y0, y1, c)));
    }
    // Light down the front and soft shade down one side.
    out.push(F(T([[xr(12) - 7, 12], [xr(12) - 3, 12], [xr(150) - 4, 150], [xr(150) - 10, 150]], '#f8cf9c')));
    out.push(F(T([[xl(30) + 1, 30], [xl(30) + 5, 30], [xl(60) + 6, 60], [xl(90) + 4, 90], [xl(90) + 1, 90]], '#dd9d68')));
    // Cracks.
    out.push(F(band([[30, 26], [33, 36], [29, 46], [32, 58]], (u) => 0.9 - u * 0.5, '#b87a4c')), F(band([[48, 100], [45, 110], [49, 120]], (u) => 0.8 - u * 0.4, '#b87a4c')),
      F(band([[22, 120], [25, 128], [22, 138]], (u) => 0.8 - u * 0.4, '#b87a4c')), F(band([[45, 62], [47, 68]], () => 0.5, '#b87a4c')));
    // Scrub on top and a little nest.
    out.push(tuft(20, 7.4, '#9fd38a'), tuft(48, 7.4, '#8fcf86'), E(34, 5, 4.6, 2.2, '#c99a6b'), F(E(32.6, 3.8, 1.2, 0.9, '#bfe6ff')), F(E(35.2, 3.8, 1.2, 0.9, '#ffffff')));
    // A friendly cactus by the foot, and old bones.
    out.push(E(9, 139, 6, 9, '#8fd39a'), E(2.6, 138, 2.2, 3.4, '#8fd39a'), E(15.4, 136, 2.2, 3.4, '#8fd39a'), R(4.6, 145, 8.8, 7, '#ff9a6b'), R(4, 144.4, 10, 1.6, '#ffb38a'),
      E(9, 129.4, 2.2, 2, '#ff8fb4'), F(E(9, 129.4, 0.8, 0.8, '#ffe36b')), ...face(9, 137, 2, 'happy', 'smile'));
    out.push(E(62, 147, 4.6, 3.8, '#fff4e6'), R(59.6, 148, 4.8, 3.4, '#fff4e6'), F(E(60.4, 147, 1.1, 1.3, '#8a5a3c')), F(E(63.6, 147, 1.1, 1.3, '#8a5a3c')),
      R(50, 149.6, 8, 1.6, '#fff4e6'), E(50, 149.4, 1.2, 1.2, '#fff4e6'), E(50, 151.4, 1.2, 1.2, '#fff4e6'), E(58, 149.4, 1.2, 1.2, '#fff4e6'), E(58, 151.4, 1.2, 1.2, '#fff4e6'),
      E(70, 150, 3.4, 2, '#e3a676'), E(26, 151, 3, 1.6, '#e3a676'));
    return out;
  });
}

function tentArt(frame) {
  const w = [0, 1.4, 0.4][frame];
  return art(`tent|${frame}`, 72, 64, () => {
    const red = '#ff8a7a';
    const cream = '#fff4e6';
    const out = [R(35.2, 0.6, 1.6, 14, '#8a5a3c'), E(36, 1.4, 1.6, 1.6, '#ffd66b'),
      T([[37, 2], [50 + w, 2.6 + w * 0.6], [46.4 + w * 0.6, 5.6], [50 + w, 8.6 - w * 0.3], [37, 9]], red), F(T([[37, 4.4], [46 + w, 5.4], [37, 6.4]], '#ffd66b'))];
    // Striped cloth from the peak.
    const n = 8;
    for (let i = 0; i < n; i++) {
      const xa = 2 + (68 * i) / n;
      const xb = 2 + (68 * (i + 1)) / n;
      out.push(T([[36, 12], [xa, 62], [xb, 62]], i % 2 ? cream : red));
    }
    // Scalloped collar.
    out.push(T([[22.4, 30], [49.6, 30], [52.4, 34], [19.6, 34]], '#ffd66b'));
    for (let x = 21.4; x <= 51; x += 3.8) out.push(E(x, 34.4, 1.9, 1.9, '#ffd66b'));
    out.push(F(R(22.4, 31.4, 27.2, 0.7, '#f0b84a')), F(diamond(36, 22, 2.6, 3.4, '#ffd66b')), F(diamond(36, 22, 1.2, 1.6, '#ffffff')));
    // Doorway with the flap tied back.
    out.push(T([[28, 62], [36, 42], [44, 62]], '#5a3a4a'), F(T([[30.6, 62], [36, 48], [41.4, 62]], '#7a4e5a')),
      T([[36, 42], [44, 62], [49, 62], [41, 46]], '#ffb3a8'), F(R(41.4, 51, 4, 1.4, '#8a5a3c')));
    // Stakes, a round shield, and a spear leaning on the side.
    out.push(R(0.6, 58, 1.6, 6, '#8a5a3c'), R(69.8, 58, 1.6, 6, '#8a5a3c'), E(36, 62.6, 10, 1.6, '#e3a676'),
      R(12.6, 32, 1.4, 31, '#a0704a'), T([[11.4, 33], [13.3, 26], [15.2, 33]], '#dfe6f5'), F(R(12.3, 33, 2, 1.2, red)),
      E(62, 56, 5.4, 6, '#9fb8ff'), F(E(62, 56, 3.8, 4.4, '#c4d4ff')), F(diamond(62, 56, 1.8, 2.4, '#ffd66b')));
    return out;
  });
}

// ---------- Ruins ----------

const STONE = '#ece5fb';
const STONE_LINE = '#cfc3ef';
const STONE_LIGHT = '#f8f5ff';
const MOSS = '#9fe0b0';
const VINE = '#7fcf9a';

function ruinarchArt() {
  return art('ruinarch', 112, 122, () => {
    const out = [];
    // Left pillar, whole, with stones and a capital.
    out.push(R(10, 36, 22, 78, STONE), R(7, 31, 28, 6, STONE_LIGHT), R(6, 112, 30, 10, STONE_LIGHT));
    for (let y = 48, r = 0; y < 112; y += 12, r++) {
      out.push(F(R(10, y, 22, 0.8, STONE_LINE)), F(R(r % 2 ? 17 : 24, y - 11.2, 0.8, 11.2, STONE_LINE)));
    }
    // Right pillar, snapped off.
    const xl = 80;
    const xr = 102;
    out.push(T([[xl, 114], [xl, 72], [83, 66], [87, 70], [91, 61], [95, 67], [99, 63], [xr, 68], [xr, 114]], STONE), R(76, 112, 30, 10, STONE_LIGHT));
    for (let y = 80, r = 0; y < 112; y += 12, r++) out.push(F(R(xl, y, 22, 0.8, STONE_LINE)), F(R(r % 2 ? 87 : 94, y + 0.8, 0.8, 11.2, STONE_LINE)));
    out.push(F(band([[90, 72], [92, 80], [89, 90]], (u) => 0.8 - u * 0.4, '#b4a6dc')));
    // The arch, broken off past its top.
    const ap = [];
    for (let i = 0; i <= 14; i++) {
      const a = Math.PI + ((Math.PI * 0.62) * i) / 14;
      ap.push([56 + Math.cos(a) * 35, 40 + Math.sin(a) * 29]);
    }
    out.push(band(ap, () => 7, STONE));
    const tip = ap[ap.length - 1];
    out.push(T([[tip[0] - 2, tip[1] - 7], [tip[0] + 3, tip[1] - 5], [tip[0] + 1, tip[1] - 1], [tip[0] + 4, tip[1] + 2], [tip[0] - 1, tip[1] + 7], [tip[0] - 4, tip[1]]], STONE));
    for (let i = 2; i < 14; i += 2) {
      const a = Math.PI + ((Math.PI * 0.62) * i) / 14;
      const c = Math.cos(a);
      const s = Math.sin(a);
      out.push(F(T([[56 + c * 28.4, 40 + s * 22.4], [56 + c * 41.6, 40 + s * 35.6], [56 + c * 41.6 + 0.8, 40 + s * 35.6 + 0.4], [56 + c * 28.4 + 0.8, 40 + s * 22.4 + 0.4]], STONE_LINE)));
    }
    out.push(F(band(ap.slice(1, 13).map(([x, y]) => [x + (56 - x) * 0.02, y - 4.6]), () => 0.6, STONE_LIGHT)));
    // The rune stone set into the pillar.
    out.push(F(E(21, 74, 6.6, 6.6, '#cbbfee')), F(arc(21, 74, 5.4, 5.4, 0, 360, 1, '#5fd0ec')), F(diamond(21, 74, 2.2, 3.4, '#5fd0ec')), F(diamond(21, 74, 1, 1.6, '#e6fbff')),
      F(R(20.5, 66.4, 1, 3, '#5fd0ec')), F(R(20.5, 78.6, 1, 3, '#5fd0ec')), F(R(13.4, 73.5, 3, 1, '#5fd0ec')), F(R(25.6, 73.5, 3, 1, '#5fd0ec')));
    // Moss on every top, and vines hanging from the arch.
    out.push(...ringed(13, 31, 6, 2.6, MOSS, 0.6), ...ringed(30, 31.4, 4.4, 2, MOSS, 0.6), ...ringed(84, 66, 4, 2, MOSS, 0.6), ...ringed(97, 64, 4, 2, MOSS, 0.6));
    for (const k of [3, 6, 9]) {
      const [x, y] = ap[k];
      out.push(...ringed(x, y - 6, 5, 2.4, MOSS, 0.6));
    }
    for (const [k, len] of [[4, 22], [7, 14], [10, 26], [12, 12]]) {
      const [x, y] = ap[k];
      const path = [];
      for (let j = 0; j <= 6; j++) path.push([x + Math.sin(j * 1.2 + k) * 1.4, y + 5 + (len * j) / 6]);
      out.push(band(path, () => 0.7, VINE));
      for (let j = 1; j <= 6; j += 2) out.push(E(path[j][0] + (j % 4 ? 1.6 : -1.6), path[j][1], 1.8, 1.2, MOSS));
    }
    out.push(...ringed(8, 46, 2.6, 2, MOSS, 0.6), ...ringed(32, 92, 2.4, 1.8, MOSS, 0.6), ...ringed(81, 98, 2.6, 2, MOSS, 0.6));
    // Rubble at the foot of the broken side.
    out.push(T([[60, 122], [62, 114], [70, 113], [72, 122]], STONE), F(R(62, 117, 9, 0.7, STONE_LINE)), E(107, 120, 4, 2.6, STONE), E(52, 121, 3, 1.6, STONE_LIGHT),
      ...ringed(66, 113.6, 3, 1.4, MOSS, 0.5), tuft(42, 122, '#9fd8a8'), tuft(3, 122, '#9fd8a8'), ...bloom(46, 119, 1.2, '#ffffff'));
    return out;
  });
}

function ruinpillarArt() {
  return art('ruinpillar', 40, 112, () => {
    const out = [R(4, 102, 26, 10, STONE_LIGHT), R(6, 98, 22, 5, STONE),
      T([[8, 99], [8, 26], [10, 19], [14, 22.4], [17, 14], [21, 20], [24, 16.4], [26, 22], [26, 99]], STONE)];
    for (const x of [11.6, 16.6, 21.6]) out.push(F(R(x, 26, 1, 70, STONE_LINE)));
    out.push(F(R(8, 60, 18, 0.8, STONE_LINE)),
      F(band([[18, 30], [15.6, 40], [19, 48], [16.6, 56]], (u) => 0.9 - u * 0.5, '#b4a6dc')), F(band([[11, 72], [13.4, 80]], () => 0.5, '#b4a6dc')));
    // Moss on the break and ivy climbing up one side.
    out.push(...ringed(12, 21, 4.4, 2.4, MOSS, 0.6), ...ringed(21.6, 19, 3.6, 2, MOSS, 0.6), ...ringed(9, 58, 2.6, 3.6, MOSS, 0.6));
    const ivy = [[24, 98], [26, 90], [23, 82], [26.4, 74], [23.4, 66], [26, 58], [24, 50]];
    out.push(band(ivy, () => 0.7, VINE));
    ivy.forEach(([x, y], i) => i && out.push(E(x + (i % 2 ? 2 : -1.6), y - 1, 2, 1.4, MOSS)));
    // A fallen drum of the column lying at the foot.
    out.push(T([[28, 112], [29.6, 102], [39, 103.4], [39.6, 112]], STONE), F(R(30, 105.4, 9, 0.8, STONE_LINE)), F(R(29.4, 108.6, 10, 0.8, STONE_LINE)),
      ...ringed(33, 102.6, 3, 1.3, MOSS, 0.5), E(2.4, 110.6, 2.4, 1.6, STONE), tuft(5, 112, '#9fd8a8'), ...bloom(28, 110.6, 1.1, '#ffe36b'));
    return out;
  });
}

function statueArt() {
  return art('statue', 48, 86, () => {
    const st = '#e4ddf3';
    const deep = '#cbc0e6';
    const out = [R(9, 60, 30, 23, '#dcd4ef'), R(5, 56, 38, 5, STONE_LIGHT), R(5, 82, 38, 4, STONE_LIGHT),
      F(R(15, 66, 18, 9, deep)), F(R(17, 69, 14, 0.8, '#b4a6dc')), F(R(17, 71.6, 10, 0.8, '#b4a6dc')),
      F(band([[11, 62], [13, 68], [11.4, 74]], () => 0.5, '#b4a6dc'))];
    // The owl: round body, ear tufts, folded wings, sleepy carved eyes.
    out.push(E(24, 42, 13, 15, st), E(24, 23, 12.4, 10, st), T([[13, 18], [11, 7], [19.6, 14]], st), T([[35, 18], [37, 7], [28.4, 14]], st),
      E(12.6, 44, 4, 10, deep), E(35.4, 44, 4, 10, deep), F(E(24, 46, 7.6, 9, '#f2eefa')),
      F(E(19, 23, 4.6, 4.6, '#f4f0fb')), F(E(29, 23, 4.6, 4.6, '#f4f0fb')), arc(19, 22.6, 2.2, 1.6, 20, 160, 0.8, '#8f80b8'), arc(29, 22.6, 2.2, 1.6, 20, 160, 0.8, '#8f80b8'),
      F(T([[22.4, 26], [25.6, 26], [24, 29.6]], '#d9c6a0')), E(19.6, 56, 2.6, 1.4, deep), E(28.4, 56, 2.6, 1.4, deep));
    for (const [x, y] of [[21, 42], [27, 42], [24, 46.4], [21, 50.4], [27, 50.4]]) out.push(arc(x, y, 1.8, 1.4, 20, 160, 0.6, '#cfc6e8'));
    // Weathering: a crack and moss, and a flower crown left by visitors.
    out.push(F(band([[33, 34], [31, 40], [33.4, 46]], () => 0.5, '#b4a6dc')), ...ringed(12, 54, 3, 2, MOSS, 0.6), ...ringed(39, 58, 3.4, 1.8, MOSS, 0.6),
      ...ringed(7, 80, 2.6, 2.6, MOSS, 0.6));
    for (const [x, y, c] of [[16, 15.4, '#ff9ec0'], [20, 13.6, '#ffe36b'], [24, 13.2, '#ffffff'], [28, 13.6, '#ff9ec0'], [32, 15.4, '#c9a6ff']]) out.push(...bloom(x, y, 1.2, c));
    out.push(tuft(3, 86, '#9fd8a8'), tuft(45, 86, '#9fd8a8'), ...bloom(42, 83, 1.1, '#ffffff'));
    return out;
  });
}

// ---------- Cave ----------

const CRYSTALS = [
  { c: '#9fdcff', glow: '#9fe6ff' },
  { c: '#d4b4ff', glow: '#e0c6ff' },
];

function crystalspireArt(v) {
  const { c } = CRYSTALS[v];
  return art(`crystalspire|${v}`, 72, 132, () => {
    const out = [];
    // Each crystal: a prism split into a lit facet and a shaded one, with a shine sliver.
    const prism = (x, w, top, tip, bot, col, lean = 0) => {
      const L = x - w / 2;
      const Rr = x + w / 2;
      out.push(T([[L, bot], [L + lean * 0.6, top], [x + lean, tip], [Rr + lean * 0.6, top], [Rr, bot]], col));
      out.push(F(T([[x, bot], [x + lean * 0.8, top + (tip - top) * 0.2], [x + lean, tip], [Rr + lean * 0.6, top], [Rr, bot]], shade(col, -9))));
      out.push(F(T([[L + w * 0.18, bot - 4], [L + w * 0.18 + lean * 0.6, top + 2], [L + w * 0.32 + lean * 0.7, top - (top - tip) * 0.4], [L + w * 0.32, bot - 10]], mix(col, '#ffffff', 0.6))));
    };
    prism(10, 10, 100, 86, 128, shade(c, 6), -4);
    prism(62, 10, 98, 86, 128, shade(c, 4), 5);
    prism(19, 14, 70, 50, 126, c, -5);
    prism(53, 14, 66, 46, 126, shade(c, -4), 6);
    prism(36, 20, 36, 4, 126, c, 0);
    prism(28, 9, 104, 92, 128, mix(c, '#ffc6f0', 0.4), -2);
    prism(46, 8, 108, 98, 128, mix(c, '#ffffff', 0.3), 2);
    // Rocky base with smaller crystal chips.
    out.push(...ringed(36, 126, 32, 5.4, '#8f80c6', 0.8), ...ringed(8, 125, 7, 4, '#9a8cd0', 0.6), ...ringed(64, 125.4, 7, 3.6, '#9a8cd0', 0.6), F(E(26, 124, 8, 1.4, '#a99ce0')),
      diamond(4, 120, 2, 4, c), diamond(68, 121, 1.8, 3.4, c), F(E(36, 129.4, 26, 1.2, '#7a6cb4')));
    return out;
  });
}

function stalagmiteArt() {
  return art('stalagmite', 42, 92, () => {
    const rock = '#a898d6';
    const xl = edge([[2, 20], [14, 18], [32, 15], [52, 11], [70, 8], [92, 3]]);
    const xr = edge([[2, 22], [14, 24], [32, 27], [52, 31], [70, 34], [92, 39]]);
    const out = [T([[3, 92], [xl(70), 70], [xl(52), 52], [xl(32), 32], [xl(14), 14], [20, 3], [21, 1], [22, 3], [xr(14), 14], [xr(32), 32], [xr(52), 52], [xr(70), 70], [39, 92]], rock),
      E(10, 78, 6, 7, rock), E(32, 68, 5, 8, rock)];
    for (const [y0, y1, c] of [[24, 26, '#9484c8'], [44, 47, '#9484c8'], [62, 65, '#9484c8'], [80, 83, '#9484c8']]) out.push(F(strip(xl, xr, y0, y1, c)));
    out.push(F(T([[19.4, 6], [20.6, 6], [17, 40], [14, 72], [11.4, 72], [14.6, 40]], '#bfb2e6')), F(E(21, 4, 1, 2, '#d6ccf5')));
    // Crystals growing out of the sides, and specks set in the rock.
    out.push(T([[31, 58], [37, 50], [38.6, 52.6], [33, 60]], '#a8f0ff'), T([[31, 62], [39, 60], [39, 62.6], [32, 64]], '#c9f6ff'), F(T([[32, 58], [36.6, 52], [37, 53]], '#ffffff')),
      T([[8, 86], [2, 76], [4.2, 75], [10, 84]], '#ffc6f0'), T([[10, 85], [8.4, 74], [11, 74.4], [12, 84]], '#ffdaf6'));
    for (const [x, y, col] of [[24, 30, '#a8f0ff'], [15, 46, '#ffc6f0'], [26, 56, '#a8f0ff'], [20, 70, '#c9f6ff'], [30, 80, '#ffc6f0'], [12, 60, '#a8f0ff'], [22, 18, '#ffffff']]) {
      out.push(F(diamond(x, y, 1.4, 2.2, col)), F(E(x - 0.3, y - 0.6, 0.35, 0.5, '#ffffff')));
    }
    out.push(...ringed(4, 90, 4, 2.6, '#8f80c6', 0.6), ...ringed(37, 90, 4.4, 2.4, '#8f80c6', 0.6), F(E(21, 91, 14, 1, '#8a7cc0')));
    return out;
  });
}

// ---------- Sky ----------

const CLOUD = '#ffffff';
const CLOUD_LINE = '#dfe3ff';

function cloudpillarArt() {
  return art('cloudpillar', 82, 108, () => {
    const out = [];
    const puff = (x, y, rx, ry) => out.push(F(E(x, y, rx + 1, ry + 1, CLOUD_LINE)), E(x, y, rx, ry, CLOUD));
    // A column of puffs: wide at the foot, pinched in the middle, swelling to cup the island.
    for (const [x, y, rx, ry] of [
      [26, 14, 14, 9], [56, 14, 14, 9], [41, 10, 15, 9],
      [32, 30, 12, 10], [50, 32, 12, 10], [41, 44, 13, 10], [33, 58, 12, 10], [50, 60, 12, 10],
      [41, 72, 15, 10], [18, 88, 15, 11], [64, 88, 15, 11], [41, 86, 19, 13], [10, 100, 10, 8], [72, 100, 10, 8], [41, 100, 26, 9],
    ]) puff(x, y, rx, ry);
    for (const [x, y, rx] of [[36, 6, 5], [28, 26, 4], [36, 40, 4.6], [28, 54, 4], [34, 68, 5], [34, 82, 6], [14, 84, 4.4]]) out.push(F(E(x, y, rx, rx * 0.4, '#f6f4ff')));
    // A sleepy cloud face low on the column.
    out.push(...face(41, 90, 4.4, 'closed', 'smile', 1.4));
    // Sparkly star bits tucked in.
    out.push(F(diamond(56, 46, 1.4, 2.2, '#ffe36b')), F(diamond(22, 70, 1.2, 1.8, '#ffc6e8')), F(diamond(62, 78, 1, 1.6, '#c9dcff')));
    return out;
  });
}

function skyislandArt() {
  return art('skyisland', 82, 50, () => {
    const earth = '#e3d0ff';
    const out = [T([[6, 25], [76, 25], [66, 34], [52, 46], [42, 50], [30, 44], [16, 34]], earth),
      F(T([[14, 31], [68, 31], [65, 33], [17, 33]], '#cdb8f5')), F(T([[24, 38.6], [58, 38.6], [54, 41], [28, 41]], '#cdb8f5')),
      F(R(33, 34, 0.8, 7, '#a8e0b0')), F(R(48, 34, 0.8, 9, '#a8e0b0')), F(R(58, 30, 0.8, 5, '#a8e0b0')),
      E(41, 25, 36, 6, '#9fe0b0'), F(E(30, 22.4, 12, 2, '#c4f2cf'))];
    // A blossom tree, a bit of fence, and flowers.
    out.push(R(17, 8, 3, 16, '#c9a27a'), ...ringed(18.6, 8, 11, 7.6, '#ffc6de', 0.7), ...ringed(11, 12, 5, 4, '#ffb3d1', 0.6), F(E(14, 5, 3.4, 1.4, '#ffe6f0')),
      F(E(22, 10, 1, 1, '#ffffff')), F(E(13, 9, 1, 1, '#ffffff')), F(E(25, 5, 1, 1, '#ffffff')));
    for (const x of [50, 57, 64, 71]) out.push(R(x - 1, 14, 2, 10, '#fff4e0'), E(x, 14, 1, 1, '#fff4e0'));
    out.push(R(48, 16.6, 25, 1.4, '#fff4e0'), R(48, 20, 25, 1.4, '#fff4e0'));
    for (const [x, c] of [[30, '#ff9ec0'], [36, '#ffe36b'], [42, '#c9a6ff'], [55, '#ff9ec0'], [67, '#8fd3ff']]) {
      out.push(R(x - 0.4, 19, 0.8, 4, '#6cc070'), ...bloom(x, 18.4, 1.3, c));
    }
    return out;
  });
}

function skygazeboArt() {
  return art('skygazebo', 92, 92, () => {
    const white = '#ffffff';
    const roof = '#ffb8d8';
    const out = [R(3, 85, 86, 7, '#eceaff'), R(9, 79, 74, 7, white), F(R(9, 84, 74, 0.8, '#e0dcfa')), F(R(3, 88.6, 86, 0.8, '#d6d2f2'))];
    // Columns with capitals and fluting.
    for (const x of [15, 33, 59, 77]) {
      out.push(R(x - 3, 38, 6, 42, white), R(x - 4.4, 36, 8.8, 3, '#f4f0ff'), R(x - 4, 76, 8, 3.4, '#f4f0ff'), F(R(x - 1.2, 40, 0.7, 35, '#e6e2fa')), F(R(x + 0.8, 40, 0.7, 35, '#e6e2fa')));
    }
    // Low railings on the sides; the middle is open.
    for (const [a, b] of [[15, 33], [59, 77]]) {
      out.push(R(a + 3, 62, b - a - 6, 15, white), F(R(a + 3, 64, b - a - 6, 0.7, '#e6e2fa')));
      for (let x = a + 6; x < b - 3; x += 3.4) out.push(F(R(x - 0.35, 65.4, 0.7, 10, '#e6e2fa')));
    }
    // Lintel with a garland, a bell, and the dome.
    out.push(R(7, 30, 78, 7, '#fbf8ff'), F(R(7, 35.4, 78, 0.8, '#e6e2fa')));
    for (let i = 0; i < 9; i++) out.push(arc(12 + i * 8.5, 37, 4.2, 3.4, 20, 160, 0.8, '#9fe0b0'), F(E(12 + i * 8.5 + 4.25, 37, 1.2, 1.2, i % 2 ? '#ffe36b' : '#ff9ec0')));
    out.push(R(45.4, 37, 1.2, 7, '#e6c9a0'), T([[42.6, 50], [43.6, 44.6], [46, 43], [48.4, 44.6], [49.4, 50]], '#ffe36b'), F(E(46, 50.6, 1, 1, '#ffb347')), F(R(44, 45, 1, 4, '#fff6c9')));
    const dome = [];
    for (let i = 0; i <= 16; i++) {
      const a = Math.PI + (Math.PI * i) / 16;
      dome.push([46 + Math.cos(a) * 41, 31 + Math.sin(a) * 23]);
    }
    out.push(T(dome, roof));
    for (const k of [-2, -1, 0, 1, 2]) {
      const bx = 46 + k * 15.4;
      out.push(F(T([[46 + k * 1.2, 9], [46 + k * 1.2 + 1, 9], [bx + 1.4, 30], [bx - 0.4, 30]], '#ffd6ea')));
    }
    for (let x = 7; x <= 85; x += 6) out.push(E(x, 31.6, 3, 2.6, '#ff9ec8'));
    out.push(F(E(30, 18, 6, 2.4, '#ffe0ef')), R(45, 1.6, 2, 7, '#ffe36b'), E(46, 2.4, 2.6, 2.4, '#ffe36b'), F(E(45.4, 1.8, 0.9, 0.7, '#ffffff')));
    // Potted flowers on the steps and vines on the columns.
    for (const x of [6, 86]) out.push(T([[x - 3.4, 79], [x + 3.4, 79], [x + 2.4, 85], [x - 2.4, 85]], '#ffb38a'), ...ringed(x, 76.4, 4, 3.4, '#8fdc9a', 0.6), ...bloom(x - 1, 75, 1.2, '#ff9ec0'), ...bloom(x + 1.6, 77, 1, '#ffffff'));
    for (const x of [15, 77]) {
      const p = [[x, 76], [x - 2.4, 68], [x + 2.4, 60], [x - 2.4, 52], [x + 2, 44]];
      out.push(band(p, () => 0.6, '#7fcf9a'));
      p.forEach(([px, py], i) => out.push(E(px + (i % 2 ? 1.6 : -1.6), py, 1.6, 1.1, '#9fe0b0')));
      out.push(...bloom(x + 2, 58, 1, '#ffc6e8'));
    }
    return out;
  });
}

// ---------- Grove ----------

const LANTERN_COLORS = ['#ffd27a', '#ff9ec0', '#9fe0ff', '#c9a6ff'];

function lanterntreeArt() {
  return art('lanterntree', 104, 152, () => {
    const bark = '#a5809f';
    const out = [];
    for (const [path, w] of [[[[46, 134], [34, 145], [18, 152.6]], 5], [[[58, 134], [70, 145], [86, 152.6]], 5], [[[50, 144], [42, 152.6]], 3]]) out.push(band(path, (u) => w * (1 - u) + 1, bark));
    out.push(band([[52, 154], [48, 134], [54, 114], [49, 94], [52, 76]], (u) => 12 - u * 6, bark));
    // Long boughs reaching out to hold lanterns.
    out.push(band([[49, 98], [36, 90], [22, 90], [10, 96]], (u) => 3.6 - u * 2.2, bark), band([[55, 90], [70, 82], [84, 82], [95, 89]], (u) => 3.6 - u * 2.2, bark));
    out.push(F(band([[47, 140], [45.4, 126], [49, 110], [46, 96]], () => 1, '#c4a2bc')), F(band([[56, 128], [57, 114]], () => 0.7, '#7f5f80')));
    // Canopy: deep teal at the back to mint in front, flecked with glowing buds.
    for (const [x, y, rx, ry] of [[30, 62, 20, 14], [74, 60, 20, 14], [52, 42, 36, 26], [52, 16, 22, 15]]) out.push(...ringed(x, y, rx, ry, '#4f9c9c'));
    for (const [x, y, rx, ry] of [[36, 34, 20, 16], [68, 34, 20, 16], [52, 58, 24, 13], [52, 12, 16, 10]]) out.push(...ringed(x, y, rx, ry, '#6dc0ac'));
    for (const [x, y, rx, ry] of [[44, 22, 12, 9], [64, 24, 11, 8], [34, 50, 10, 7], [72, 48, 10, 7], [52, 40, 12, 8]]) out.push(...ringed(x, y, rx, ry, '#9fe2c4'), F(E(x - rx * 0.3, y - ry * 0.4, rx * 0.4, ry * 0.25, '#cdf5e0')));
    for (const [x, y] of [[24, 46], [40, 64], [64, 66], [82, 54], [58, 28], [30, 28], [76, 36], [48, 6], [70, 14], [20, 60]]) out.push(F(E(x, y, 1.4, 1.4, '#fff6c9')), F(E(x, y, 0.6, 0.6, '#ffffff')));
    // A round window glowing in the trunk, and glowing mushrooms at the roots.
    out.push(E(51, 116, 4.4, 5, '#7f5f80'), F(E(51, 116, 3.2, 3.8, '#ffe6a0')), F(R(50.6, 112.4, 0.8, 7.4, '#7f5f80')), F(R(47.8, 115.6, 6.4, 0.8, '#7f5f80')));
    out.push(R(29, 146, 2.4, 6, '#e6f4ff'), E(30.2, 146, 4, 2.6, '#7fe6d6'), F(E(29, 145.4, 1, 0.6, '#ffffff')), R(72, 147, 2, 5, '#e6f4ff'), E(73, 147, 3.2, 2, '#ffb0d0'),
      tuft(38, 152, '#9fe0b0'), tuft(64, 152, '#8fd6a6'));
    return out;
  });
}
// Where the lantern tree's lanterns hang from (offsets from its bottom center), string length, color.
const TREE_LANTERNS = [[-42, -56, 8, 0], [-26, -62, 14, 1], [-14, -76, 6, 2], [14, -77, 9, 3], [26, -70, 5, 0], [43, -63, 10, 2]];

function hangLanternArt(c, len) {
  return art(`lmlantern|${c}|${len}`, 10, len + 12, () => [
    R(4.6, 0, 0.8, len + 1, '#e6d6c4'), T([[1.4, len + 3], [5, len + 0.6], [8.6, len + 3]], '#7f5f80'),
    E(5, len + 6.6, 4, 4.2, c), F(E(3.8, len + 5.4, 1.1, 2, '#fff6dc')), F(R(1.4, len + 6.6, 7.2, 0.6, shade(c, -10))), R(3.6, len + 10.4, 2.8, 1.4, '#7f5f80'),
  ]);
}

function moonstoneArt() {
  return art('moonstone', 42, 72, () => {
    const st = '#bdb3dc';
    const out = [T([[6, 72], [5, 42], [7, 24], [12, 11], [20, 4], [28, 6], [34, 16], [37, 34], [37, 72]], st),
      F(T([[10, 66], [9, 40], [11, 24], [15, 14], [17, 13], [13, 26], [12, 42], [13, 66]], '#d4ccec')),
      F(band([[31, 20], [29, 28], [32, 34]], () => 0.5, '#9a8fc4')), F(band([[12, 52], [15, 58]], () => 0.5, '#9a8fc4'))];
    // The carved ring and glowing crescent.
    out.push(F(arc(21.5, 34, 10, 10, 0, 360, 0.9, '#9a8fc4')), F(E(21, 34, 7.4, 7.4, '#6fdcf4')), F(E(21.4, 34, 6, 6, '#c9f6ff')), F(E(24.6, 31.4, 6.2, 6.2, st)));
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 + 0.3;
      out.push(F(diamond(21.5 + Math.cos(a) * 12.6, 34 + Math.sin(a) * 12.6, 0.9, 1.4, '#6fdcf4')));
    }
    out.push(F(diamond(27.6, 33, 1, 1.6, '#ffffff')));
    // Moss, ivy, and small flowers at the base.
    out.push(...ringed(9, 69, 5, 3, '#9fe0b0', 0.6), ...ringed(33, 70, 5, 2.6, '#9fe0b0', 0.6), ...ringed(20, 6, 6, 2.4, '#9fe0b0', 0.6),
      band([[34, 70], [36, 62], [34, 54], [36.4, 48]], () => 0.6, '#7fcf9a'), E(37.6, 60, 1.6, 1.1, '#9fe0b0'), E(33, 52, 1.6, 1.1, '#9fe0b0'),
      ...bloom(4, 68, 1.1, '#c9a6ff'), ...bloom(38, 68, 1.1, '#ffffff'), tuft(14, 72, '#9fe0b0'));
    return out;
  });
}

// ---------- Harbor ----------

function lighthouseArt() {
  return art('lighthouse', 52, 152, () => {
    const xl = edge([[42, 16], [150, 11]]);
    const xr = edge([[42, 36], [150, 41]]);
    const out = [strip(xl, xr, 42, 150, '#ffffff')];
    for (const y of [54, 82, 110, 138]) out.push(strip(xl, xr, y, Math.min(150, y + 14), '#ff8fa8'));
    // Windows and the door.
    for (const y of [72, 100]) out.push(E(26, y, 3, 4, '#9fb8ff'), F(E(26, y, 2, 3, '#fff3a6')), F(R(25.6, y - 3, 0.8, 6, '#9fb8ff')));
    out.push(R(21, 132, 10, 16, '#9fb8ff'), E(26, 132, 5, 4, '#9fb8ff'), F(R(25.6, 130, 0.8, 18, '#7f98e6')), F(E(29, 140, 0.8, 0.8, '#ffe36b')));
    // Gallery, lamp room, and red cap.
    out.push(R(9, 38, 34, 4.4, '#9fb8ff'), R(16, 20, 20, 18, '#fff3a6'), F(E(26, 28, 4.4, 4.4, '#ffffff')), F(R(20.6, 20, 0.9, 18, '#9fb8ff')), F(R(30.6, 20, 0.9, 18, '#9fb8ff')),
      R(10.6, 30, 30.8, 1.6, '#9fb8ff'));
    for (const x of [11.4, 17.6, 23.8, 30, 36.2, 40.6]) out.push(R(x, 30, 1.2, 8, '#9fb8ff'));
    out.push(R(14, 18, 24, 3, '#ff8fa8'), T([[13, 19], [26, 6], [39, 19]], '#ff8fa8'), F(T([[18, 17], [26, 9], [27.6, 10.6], [21, 17]], '#ffc0cc')), R(25.3, 1, 1.4, 6, '#9fb8ff'), E(26, 3, 2.2, 2.2, '#ffd66b'));
    // Rocks at the foot, with a starfish.
    out.push(...ringed(8, 147, 8, 5, '#c9c0dc', 0.7), ...ringed(44, 148, 8, 4.4, '#c9c0dc', 0.7), ...ringed(26, 150, 16, 2.6, '#d6cfe6', 0.6));
    const star = [];
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2 - Math.PI / 2;
      const r = k % 2 ? 1.2 : 2.8;
      star.push([44 + Math.cos(a) * r, 144.6 + Math.sin(a) * r]);
    }
    out.push(T(star, '#ffb38a'), F(E(44, 144.6, 0.6, 0.6, '#ffe36b')), ...ringed(5, 144, 2.4, 1.6, '#9fe0b0', 0.5));
    return out;
  });
}

function cratesArt(frame) {
  const tail = [-1, 0, 1][frame];
  return art(`crates|${frame}`, 72, 52, () => {
    const out = [];
    const crate = (x, y, s, c) => {
      out.push(R(x, y, s, s, c), F(R(x + 1.2, y + 1.2, s - 2.4, 1.4, shade(c, 8))), F(R(x, y + s * 0.5 - 0.6, s, 1.2, shade(c, -14))),
        F(T([[x + 2, y + 2.4], [x + 3.6, y + 2.4], [x + s - 2, y + s - 2.4], [x + s - 3.6, y + s - 2.4]], shade(c, -8))),
        F(R(x, y, 1.2, s, shade(c, -16))), F(R(x + s - 1.2, y, 1.2, s, shade(c, -16))));
    };
    crate(2, 26, 26, '#e6b98a');
    crate(28, 30, 22, '#dcae80');
    crate(9, 8, 19, '#efc49a');
    // Stencils: an anchor and a fish.
    out.push(F(R(14.4, 33, 1.2, 9, '#a6764f')), F(arc(15, 39, 4, 3, 20, 160, 1, '#a6764f')), F(R(12, 34.4, 6, 1, '#a6764f')),
      F(E(38, 39, 3.4, 2, '#b4835a')), F(T([[41, 39], [44, 37], [44, 41]], '#b4835a')));
    // A barrel on its side on top of the crate, a standing barrel, and a coil of rope.
    out.push(R(32, 20, 14, 10, '#d9a273'), E(32, 25, 2.4, 5, '#d9a273'), E(46, 25, 3, 5, '#e6b98a'), F(E(46, 25, 1.8, 3.4, '#c99a6b')), F(R(35, 20, 1.2, 10, '#8f7cc4')), F(R(42, 20, 1.2, 10, '#8f7cc4')));
    out.push(E(60, 41, 10, 11, '#d9a273'), R(50, 34, 20, 14, '#d9a273'), E(60, 30, 10, 3, '#e6b98a'), E(60, 51, 9, 1.4, '#d9a273'),
      F(R(50.4, 35.4, 19.2, 1.4, '#8f7cc4')), F(R(50.4, 45.4, 19.2, 1.4, '#8f7cc4')), F(R(56, 31, 0.8, 20, '#c99a6b')), F(R(63.4, 31.6, 0.8, 19, '#c99a6b')),
      E(60, 28.6, 6.4, 2.6, '#f0dcb4'), F(arc(60, 28.6, 4.2, 1.6, 0, 360, 0.6, '#d6bf94')), F(E(60, 28.6, 1.6, 0.6, '#c9a87a')));
    // A cat asleep on the top crate, tail swishing.
    const cc = '#f6d7a8';
    out.push(E(19, 5.4, 6, 3.2, cc), E(12.6, 5, 3.2, 2.8, cc), T([[10.2, 3.2], [10.4, 0.4], [12.4, 2.6]], cc), T([[13, 2.6], [14.8, 0.4], [15.2, 3.2]], cc),
      band([[24.6, 6], [27, 5 + tail * 0.2], [28.4 + tail * 0.4, 2.6 + tail], [28 + tail * 0.8, 0.8 + tail]], (u) => 1.1 - u * 0.4, cc),
      F(E(20, 3.6, 2.4, 1, '#e8b47a')), F(E(23, 4.4, 1.4, 0.8, '#e8b47a')), ...face(12.6, 5.2, 1.1, 'closed', 'none'));
    // A little bag of fish and a buoy.
    out.push(E(5, 48, 4, 4, '#ff8fa8'), F(R(1.2, 46.8, 7.6, 2.2, '#ffffff')), E(48, 50, 3, 1.6, '#c9c0dc'));
    return out;
  });
}

// ---------- Drawing ----------

const KINDS = {
  bigtree: {
    w: 112, h: 172,
    draw(ctx, x, y, time, seed) {
      const f = Math.floor(time * 1.6 + seed * 0.7) % 4;
      place(ctx, bigtreeArt(variant(seed, 2), f), x, y);
    },
  },
  giantshroom: {
    w: 72, h: 92,
    draw(ctx, x, y, time, seed) {
      place(ctx, giantshroomArt(variant(seed, 3), blinking(time, seed) ? 1 : 0), x, y);
      smoke(ctx, x + 19.5, y - 92 + 1, time, seed);
    },
  },
  signpost: { w: 34, h: 46, draw: (ctx, x, y) => place(ctx, signpostArt(), x, y) },
  flowerarch: { w: 80, h: 78, draw: (ctx, x, y) => place(ctx, flowerarchArt(), x, y) },
  well: { w: 46, h: 54, draw: (ctx, x, y) => place(ctx, wellArt(), x, y) },
  totem: { w: 38, h: 124, draw: (ctx, x, y) => place(ctx, totemArt(), x, y) },
  mesa: { w: 74, h: 152, draw: (ctx, x, y) => place(ctx, mesaArt(), x, y) },
  tent: {
    w: 72, h: 64,
    draw(ctx, x, y, time, seed) {
      place(ctx, tentArt(Math.floor(time * 5 + seed) % 3), x, y);
    },
  },
  ruinarch: {
    w: 112, h: 122,
    draw(ctx, x, y, time) {
      place(ctx, ruinarchArt(), x, y);
      const rx = x - 56 + 21;
      const ry = y - 122 + 74;
      const p = 0.5 + 0.5 * Math.sin(time * 1.8);
      glow(ctx, rx, ry, 16, '#7fe6ff', 0.12 + 0.18 * p, true);
      twinkles(ctx, rx, ry, [[-7, -8], [7, -5], [0, 9]], time, 0.6, '#e6fbff', 1.8);
    },
  },
  ruinpillar: { w: 40, h: 112, draw: (ctx, x, y) => place(ctx, ruinpillarArt(), x, y) },
  statue: { w: 48, h: 86, draw: (ctx, x, y) => place(ctx, statueArt(), x, y) },
  crystalspire: {
    w: 72, h: 132,
    draw(ctx, x, y, time, seed) {
      const v = variant(seed, 2);
      const p = 0.5 + 0.5 * Math.sin(time * 1.5 + seed);
      glow(ctx, x, y - 64, 74 + p * 8, CRYSTALS[v].glow, 0.3 + 0.18 * p);
      place(ctx, crystalspireArt(v), x, y);
      glow(ctx, x, y - 70, 26, '#ffffff', 0.1 + 0.12 * p, true);
      twinkles(ctx, x - 36, y - 132, [[36, 8], [16, 52], [57, 50], [6, 88], [66, 88], [38, 60], [27, 94]], time, 0.45);
    },
  },
  stalagmite: {
    w: 42, h: 92,
    draw(ctx, x, y, time, seed) {
      place(ctx, stalagmiteArt(), x, y);
      twinkles(ctx, x - 21, y - 92, [[24, 30], [15, 46], [26, 56], [20, 70], [36, 52], [12, 60]], time + seed, 0.5, '#e6fbff', 2);
    },
  },
  cloudpillar: {
    w: 82, h: 150,
    draw(ctx, x, y, time, seed) {
      place(ctx, cloudpillarArt(), x, y);
      const bob = Math.sin(time * 1.3 + seed) * 1.6;
      place(ctx, skyislandArt(), x, y - 100 + bob);
      twinkles(ctx, x - 41, y - 150 + bob, [[12, 30], [70, 26], [40, 56]], time, 0.35, '#fff6c9', 2);
    },
  },
  skygazebo: {
    w: 92, h: 92,
    draw(ctx, x, y, time) {
      place(ctx, skygazeboArt(), x, y);
      twinkles(ctx, x - 46, y - 92, [[46, 1], [12, 24], [80, 22]], time, 0.4, '#fff6c9', 2.2);
    },
  },
  lanterntree: {
    w: 104, h: 152,
    draw(ctx, x, y, time, seed) {
      place(ctx, lanterntreeArt(), x, y);
      glow(ctx, x - 1, y - 36, 12, '#ffe6a0', 0.35 + 0.1 * Math.sin(time * 2 + seed));
      TREE_LANTERNS.forEach(([dx, dy, len, ci], i) => {
        const c = LANTERN_COLORS[ci];
        const swing = Math.sin(time * 1.4 + i * 1.3 + seed) * 0.8;
        const s = hangLanternArt(c, len);
        blit(ctx, s, snap(x + dx - 5 + swing), snap(y + dy));
        glow(ctx, x + dx + swing, y + dy + len + 6.6, 16, c, 0.4 + 0.2 * Math.sin(time * 2.2 + i * 1.7));
      });
    },
  },
  moonstone: {
    w: 42, h: 72,
    draw(ctx, x, y, time, seed) {
      place(ctx, moonstoneArt(), x, y);
      const p = 0.5 + 0.5 * Math.sin(time * 1.6 + seed);
      glow(ctx, x - 1.5, y - 72 + 34, 16 + p * 4, '#7fe6ff', 0.14 + 0.2 * p, true);
      twinkles(ctx, x - 21, y - 72, [[8, 18], [34, 24], [20, -2]], time, 0.5, '#e6fbff', 1.8);
    },
  },
  lighthouse: {
    w: 52, h: 152,
    draw(ctx, x, y, time, seed) {
      place(ctx, lighthouseArt(), x, y);
      const lx = x;
      const ly = y - 152 + 28;
      // The beam sweeps around: long when it points to the side, short as it turns toward us.
      const a = time * 0.9 + seed;
      const c = Math.cos(a);
      const dir = Math.sign(c) || 1;
      const len = 150 * Math.abs(c) + 10;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(lx, ly, lx + dir * len, ly);
      g.addColorStop(0, 'rgba(255,246,201,0.55)');
      g.addColorStop(1, 'rgba(255,246,201,0)');
      ctx.fillStyle = g;
      ctx.globalAlpha = 0.35 + 0.65 * Math.abs(c);
      ctx.beginPath();
      ctx.moveTo(lx, ly - 3);
      ctx.lineTo(lx + dir * len, ly - 16 - 8 * Math.abs(c));
      ctx.lineTo(lx + dir * len, ly + 14 + 8 * Math.abs(c));
      ctx.lineTo(lx, ly + 3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      glow(ctx, lx, ly, 20 + 6 * (1 - Math.abs(c)), '#fff6c9', 0.3 + 0.3 * (1 - Math.abs(c)), true);
    },
  },
  crates: {
    w: 72, h: 52,
    draw(ctx, x, y, time, seed) {
      const f = [0, 1, 2, 1][Math.floor(time * 2.4 + seed) % 4];
      place(ctx, cratesArt(f), x, y);
    },
  },
};

// The drawn size of each landmark, so maps can space them.
export const LANDMARKS = Object.fromEntries(Object.entries(KINDS).map(([k, { w, h }]) => [k, { w, h }]));

// Draws landmark `kind` with its base centered at screen (x, y), y being the ground line.
export function drawLandmark(ctx, kind, x, y, time, seed = 0) {
  const k = KINDS[kind];
  if (!k) return;
  k.draw(ctx, x, y + SINK, time, seed);
}
