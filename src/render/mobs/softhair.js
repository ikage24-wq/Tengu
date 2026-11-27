// Soft hair (2026-11-26, after the Glade kids' films: "Fix the hair ... and eye lids over eyes. Hair to
// badly made"): the drawing technique for a monster's head of hair, the way the player wants it
// (memory: character-design-feedback, bangs-rules), drawn live in head units (eyes at y 9, brows near
// y -6, the face's edges at about +-34, the skull's top near -56). Only the technique is shared: every
// character passes its own shapes, colours and cut, so no two heads of hair look alike.
//   - ONE light for the whole head: every piece is filled from one shared top-to-bottom gradient, so
//     the hair reads as one head of hair, never a pile of separately lit locks;
//   - bangs as an EVEN BLUNT CUT of several sections: one cut line following the forehead's curve
//     above the lashes, splits rising from it (each section a little different in width and depth),
//     a deeper inner layer seen up inside the splits, soft round corners, never a point;
//   - soft blurred shading: a shade along each split fading upward, occlusion where hair tucks under
//     hair, one shared shine band near the crown with a few fine streaks of light;
//   - the forehead's soft cast shadow (the skin's own shadow tone) under the cut;
//   - outer outline only: every piece outlined in the line pass, filled in the fill pass.
//
//   const B = bluntBangs({ x0, x1, n, cutMid, rise, seed, top, occl })   // the bangs' geometry, once
//   (draw the bangs first, then the cap over their roots: `occl` the height the cap's edge shades from)
//   drawBangs(ctx, a, mode, B, H)     // H: { C: [light, base, shade, deep], ink, tone, lw, top, bottom }
//   drawPiece(ctx, a, mode, pts, H)   // any other piece (cap, back hair, a side lock), lit the same
//   shineBand(ctx, H, clipPieces, y, half)   // the shared shine, clipped to the pieces given
//   foreheadShade(ctx, B, col)        // the bangs' soft shadow on the forehead (draw on the face)
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rng = (seed) => {
  let s = (seed * 9301 + 49297) % 233280;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};
const hexRgb = (hex) => {
  const n = parseInt(hex.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgba = (c, al) => {
  const [r, g, b] = hexRgb(c);
  return `rgba(${r},${g},${b},${clamp(al, 0, 1)})`;
};

// A closed smooth path through `pts` (every corner rounded).
export function smoothPath(ctx, pts) {
  const n = pts.length;
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  ctx.beginPath();
  const m0 = mid(pts[n - 1], pts[0]);
  ctx.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const m = mid(p, pts[(i + 1) % n]);
    ctx.quadraticCurveTo(p[0], p[1], m[0], m[1]);
  }
  ctx.closePath();
}

// The one light: a gradient from the crown (lit) to the ends (in shade), shared by every piece.
function lightOf(ctx, a, H) {
  const g = ctx.createLinearGradient(0, H.top ?? -62, 0, H.bottom ?? 40);
  g.addColorStop(0, H.tone(a, H.C[0]));
  g.addColorStop(0.28, H.tone(a, H.C[1]));
  g.addColorStop(0.75, H.tone(a, H.C[2]));
  g.addColorStop(1, H.tone(a, H.C[3]));
  return g;
}

// The bangs' geometry: n sections across [x0, x1], their tops hidden up under the cap at `top`, their
// ends along the cut: y = cutMid - (x / span)^2 * rise (a gentle U, longest in the middle), each end a
// touch deeper or shallower than its neighbour; the splits between them rising from the cut.
export function bluntBangs({ x0 = -31, x1 = 31, n = 5, cutMid = -7, rise = 6, seed = 1, top = -44, split = 5.5, occl = null }) {
  const R = rng(seed);
  const span = Math.max(Math.abs(x0), Math.abs(x1));
  const cut = (x) => cutMid - (x / span) ** 2 * rise;
  // widths: fuller in the middle, narrower toward the sides, each a little different
  const ws = [];
  for (let i = 0; i < n; i++) {
    const c = (i + 0.5) / n - 0.5;
    ws.push((1.15 - Math.abs(c) * 0.7) * (0.9 + R() * 0.2));
  }
  const tot = ws.reduce((s, w) => s + w, 0);
  const edges = [x0];
  for (let i = 0; i < n; i++) edges.push(edges[i] + ((x1 - x0) * ws[i]) / tot);
  const sections = [];
  for (let i = 0; i < n; i++) {
    const a = edges[i];
    const b = edges[i + 1];
    const jit = (R() - 0.5) * 1.4;
    const ya = cut(a) + jit;
    const yb = cut(b) + jit;
    const ym = cut((a + b) / 2) + jit + 0.4;
    // (each section overlaps its neighbours up top and draws in toward its foot, so the splits open
    // only near the cut; its foot trimmed flat with soft round corners)
    const inA = i === 0 ? 0 : 1.1;
    const inB = i === n - 1 ? 0 : 1.1;
    const ov = 1.2;
    sections.push([
      [a - (i === 0 ? 0 : ov), top],
      [b + (i === n - 1 ? 0 : ov), top],
      [b + (i === n - 1 ? 0 : ov * 0.6), yb - split],
      [b - inB, yb - split * 0.35],
      [b - inB * 1.4, yb],
      [(a + b) / 2, ym + 0.6],
      [a + inA * 1.4, ya],
      [a + inA, ya - split * 0.35],
      [a - (i === 0 ? 0 : ov * 0.6), ya - split],
    ]);
  }
  // the deeper inner layer seen up inside the splits (a little shorter than the sections)
  const inner = [[x0 + 1, top], [x1 - 1, top]];
  for (let k = 12; k >= 0; k--) {
    const x = x0 + 1 + ((x1 - x0 - 2) * k) / 12;
    inner.push([x, cut(x) - 1.6]);
  }
  const splits = edges.slice(1, -1).map((x) => [x, cut(x)]);
  return { sections, inner, splits, cut, x0, x1, top, edges, occl };
}

// A piece of hair: outlined in the line pass; in the fill pass, lit by the one light, then its own
// soft extras (`extra(ctx)` clipped to it).
export function drawPiece(ctx, a, mode, pts, H, extra = null, fill = null) {
  smoothPath(ctx, pts);
  if (mode === 'line') {
    ctx.strokeStyle = H.ink;
    ctx.lineWidth = H.lw;
    ctx.lineJoin = 'round';
    ctx.stroke();
    return;
  }
  ctx.fillStyle = fill ?? lightOf(ctx, a, H);
  ctx.fill();
  if (extra) {
    ctx.save();
    smoothPath(ctx, pts);
    ctx.clip();
    extra(ctx);
    ctx.restore();
  }
}
// A soft vertical shade strip (x, from y0 fading up to y1), `w` wide: a split's shadow.
function strip(ctx, x, y0, y1, w, col, al) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, rgba(col, al));
  g.addColorStop(1, rgba(col, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, (y0 + y1) / 2, w / 2, Math.abs(y0 - y1) / 2, 0, 0, TAU);
  ctx.fill();
}
// The bangs: the inner layer, then each section (shade along its sides at the splits fading upward,
// occlusion under the cap at its top, the cut's ends a clean deeper shade).
export function drawBangs(ctx, a, mode, B, H) {
  drawPiece(ctx, a, mode, B.inner, H, null, mode === 'fill' ? H.tone(a, H.C[3]) : null);
  B.sections.forEach((pts, i) => {
    drawPiece(ctx, a, mode, pts, H, (c) => {
      const x0 = pts[0][0];
      const x1 = pts[1][0];
      const yEnd = Math.max(pts[4][1], pts[6][1]);
      // a shade at each side where it meets a split, fading up toward the crown
      if (i > 0) strip(c, x0 + 1.8, yEnd, yEnd - 16, 3.6, H.C[3], 0.42);
      if (i < B.sections.length - 1) strip(c, x1 - 1.8, yEnd, yEnd - 16, 3.6, H.C[3], 0.42);
      // its foot a little deeper, softly
      const g = c.createLinearGradient(0, yEnd - 4, 0, yEnd + 1);
      g.addColorStop(0, rgba(H.C[2], 0));
      g.addColorStop(1, rgba(H.C[3], 0.45));
      c.fillStyle = g;
      c.fillRect(x0 - 2, yEnd - 4, x1 - x0 + 4, 6);
      // occlusion up top, where it tucks under the cap
      const oc = B.occl ?? B.top + 8;
      const o = c.createLinearGradient(0, oc, 0, oc + 9);
      o.addColorStop(0, rgba(H.C[3], 0.4));
      o.addColorStop(1, rgba(H.C[3], 0));
      c.fillStyle = o;
      c.fillRect(x0 - 2, oc, x1 - x0 + 4, 9);
    });
  });
}
// The one shine: a soft band across the pieces at height y (+-half), brightest in the lit middle,
// fading at its ends, and a few fine streaks of light of different lengths along it.
export function shineBand(ctx, a, H, pieces, y, half, x0 = -30, x1 = 30) {
  ctx.save();
  ctx.beginPath();
  for (const pts of pieces) {
    const n = pts.length;
    const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    const m0 = mid(pts[n - 1], pts[0]);
    ctx.moveTo(m0[0], m0[1]);
    for (let i = 0; i < n; i++) {
      const m = mid(pts[i], pts[(i + 1) % n]);
      ctx.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]);
    }
    ctx.closePath();
  }
  ctx.clip();
  const gv = ctx.createLinearGradient(0, y - half, 0, y + half);
  gv.addColorStop(0, rgba('#ffffff', 0));
  gv.addColorStop(0.5, rgba('#ffffff', 0.5));
  gv.addColorStop(1, rgba('#ffffff', 0));
  ctx.fillStyle = gv;
  // (the band follows the head's curve, lower at the sides)
  for (let i = 0; i < 24; i++) {
    const u = i / 23;
    const x = x0 + (x1 - x0) * u;
    const fade = Math.sin(Math.PI * u) ** 0.8;
    ctx.globalAlpha = fade * (u < 0.55 ? 1 : 0.75);
    const yy = y + ((x / 34) ** 2) * 7;
    ctx.fillRect(x - (x1 - x0) / 46, yy - half, (x1 - x0) / 23 + 0.4, half * 2);
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = rgba('#ffffff', 0.75);
  ctx.lineCap = 'round';
  for (const [u, len, w] of [[0.22, 4.4, 0.9], [0.36, 6.4, 1.1], [0.5, 3.2, 0.8], [0.66, 5.2, 1]]) {
    const x = x0 + (x1 - x0) * u;
    const yy = y + ((x / 34) ** 2) * 7;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(x - len / 2, yy + len * 0.08 * Math.sign(x));
    ctx.quadraticCurveTo(x, yy - 0.5, x + len / 2, yy - len * 0.08 * Math.sign(x));
    ctx.stroke();
  }
  ctx.restore();
}
// The bangs' soft shadow on the forehead: a copy of the cut, a little lower, in the skin's shadow.
export function foreheadShade(ctx, B, col, al = 0.55) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(B.x0, B.top);
  ctx.lineTo(B.x1, B.top);
  for (let k = 12; k >= 0; k--) {
    const x = B.x0 + ((B.x1 - B.x0) * k) / 12;
    ctx.lineTo(x, B.cut(x) + 2.6);
  }
  ctx.closePath();
  ctx.fillStyle = rgba(col, al);
  ctx.fill();
  ctx.restore();
}
