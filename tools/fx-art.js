/* Tengu's own effect art, drawn in an anime cel style: hard-edged shapes in flat tones (a white-hot
   edge, a light band, the colour, a deep band) with a dark ink outline, no gradients. Every effect
   is a short run of key drawings, not tweens: a shape snaps in, holds for a beat, then splits
   into pieces and shards that fly apart and shrink away (research/fx.md: Saint11, Hashimoto,
   Kanada; docs/art/README.md).

   tools/draw-fx.cjs loads this in the browser and renders every effect's frames to PNGs, which
   tools/build-fx.py cuts into the game's strips (one strip pixel is one screen pixel at scale 1).
   Each effect: { w, h, n, fps, px, py (the point that sits on the effect's position), loop?,
   swing? ([middle angle (rad), sweep direction (1 clockwise on screen), radius]), draw(ctx, i) }. */
(function () {
  const TAU = Math.PI * 2;

  // Cel palettes: [white-hot, light, colour, deep, ink].
  const PAL = {
    steel: ['#ffffff', '#c9f3ff', '#52b8ff', '#2261d8', '#132662'],
    holy: ['#ffffff', '#fff3a8', '#ffc22a', '#e47400', '#5e2400'],
    rage: ['#fff4f4', '#ffb2b2', '#ff2a3d', '#9c001b', '#22000a'],
    arcane: ['#ffffff', '#f1dcff', '#b86cff', '#6a2bd6', '#26104f'],
    ice: ['#ffffff', '#dafbff', '#66e4ff', '#1d8fd8', '#0c3561'],
    fire: ['#ffffff', '#fff1a0', '#ff9a1f', '#df3f08', '#521200'],
    wind: ['#ffffff', '#d9ffea', '#3fe090', '#0f9a5b', '#093a26'],
    poison: ['#ffffff', '#ecffc2', '#93e23c', '#4c9b10', '#1d3a06'],
    lightning: ['#ffffff', '#fffbc2', '#ffe23a', '#d29d00', '#563800'],
    shadow: ['#ffffff', '#e2d2ff', '#8c5cff', '#4a1fb0', '#190a3e'],
  };
  const DUST = ['#fffaf2', '#f4ead8', '#e2cfb4', '#b59878', '#4f3b30'];
  const ROCK = ['#ffffff', '#c9bddb', '#9a8ab4', '#675a86', '#2a2240'];

  function rng(seed) {
    let s = seed >>> 0 || 1;
    return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
  }
  const lerp = (a, b, k) => a + (b - a) * k;

  function path(ctx, pts) {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
  }
  // A filled shape with its ink outline (the outline drawn first, so half of it shows outside).
  function inked(ctx, pts, fill, ink, w = 3) {
    path(ctx, pts);
    if (ink) {
      ctx.lineJoin = 'round';
      ctx.strokeStyle = ink;
      ctx.lineWidth = w;
      ctx.stroke();
    }
    ctx.fillStyle = fill;
    ctx.fill();
  }
  function fill(ctx, pts, colour) {
    path(ctx, pts);
    ctx.fillStyle = colour;
    ctx.fill();
  }

  // ---------- Crescents (every blade swipe) ----------
  // A crescent over a circle of radius R around (cx, cy), from angle a0 (its thin tail) to a1 (its
  // head), `th` thick at most. Its outer edge runs on the circle; it fattens toward the head and
  // comes to a point there, like a flag (the slash shape: wide leading head, tapering tail).
  // Only the stretch u0..u1 of it is drawn (0 tail, 1 head), pushed `out` further from the centre.
  function crescent(cx, cy, R, a0, a1, th, { u0 = 0, u1 = 1, out = 0, n = 40, rough = 0, seed = 1 } = {}) {
    const width = (u) => th * Math.pow(Math.sin(Math.PI * Math.pow(u, 2.2)), 0.8);
    const r = rng(seed);
    const jag = Array.from({ length: n + 1 }, () => (r() - 0.5) * rough);
    const outer = [];
    const inner = [];
    for (let i = 0; i <= n; i++) {
      const u = lerp(u0, u1, i / n);
      // Cut ends taper to a point too, so broken pieces stay sharp.
      const cut = Math.min(1, ((u - u0) / Math.max(1e-6, u1 - u0)) * 6, ((u1 - u) / Math.max(1e-6, u1 - u0)) * 6);
      const w = width(u) * (u0 > 0 || u1 < 1 ? Math.max(0, cut) : 1);
      const a = lerp(a0, a1, u);
      const R1 = R + out;
      outer.push([cx + Math.cos(a) * R1, cy + Math.sin(a) * R1]);
      const ri = R1 - w * (1 + jag[i] * (w > 2 ? 1 : 0));
      inner.push([cx + Math.cos(a) * ri, cy + Math.sin(a) * ri]);
    }
    return outer.concat(inner.reverse());
  }
  // A crescent in cel tones: deep body inked, then the colour, the light band and the white-hot
  // leading edge stacked toward its outer rim.
  function celCrescent(ctx, pal, cx, cy, R, a0, a1, th, o = {}) {
    const [core, light, mid, deep, ink] = pal;
    inked(ctx, crescent(cx, cy, R, a0, a1, th, o), deep, ink, o.inkW ?? 4);
    fill(ctx, crescent(cx, cy, R, a0, a1, th * 0.74, { ...o, rough: (o.rough ?? 0) * 0.5 }), mid);
    fill(ctx, crescent(cx, cy, R, a0, a1, th * 0.46, { ...o, rough: 0 }), light);
    fill(ctx, crescent(cx, cy, R - 1, a0, a1, th * 0.22, { ...o, rough: 0 }), core);
  }

  // ---------- Small pieces ----------
  // A shard: a long thin sliver pointing along `a`.
  function shard(ctx, pal, x, y, a, len, wid) {
    const [core, , mid, , ink] = pal;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const pts = [[x + c * len, y + s * len], [x - s * wid, y + c * wid], [x - c * len * 0.5, y - s * len * 0.5], [x + s * wid, y - c * wid]];
    inked(ctx, pts, mid, ink, 2.5);
    fill(ctx, [[x + c * len * 0.8, y + s * len * 0.8], [x - s * wid * 0.35, y + c * wid * 0.35], [x - c * len * 0.2, y - s * len * 0.2], [x + s * wid * 0.35, y - c * wid * 0.35]], core);
  }
  // A four-point sparkle, sides curving in.
  function sparkle(ctx, pal, x, y, r, rot = 0) {
    const [core, light, , , ink] = pal;
    const pts = [];
    for (let i = 0; i < 8; i++) {
      const a = rot + (i * TAU) / 8;
      const rr = i % 2 ? r * 0.24 : r;
      pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
    }
    inked(ctx, pts, light, ink, 2.5);
    const inner = pts.map(([px, py]) => [x + (px - x) * 0.5, y + (py - y) * 0.5]);
    fill(ctx, inner, core);
  }
  // A diamond (light and holy shapes are rounded or square, never spiky).
  function diamond(ctx, pal, x, y, r, tall = 1.4) {
    const [core, light, mid, , ink] = pal;
    inked(ctx, [[x, y - r * tall], [x + r, y], [x, y + r * tall], [x - r, y]], mid, ink, 2.5);
    fill(ctx, [[x, y - r * tall * 0.7], [x + r * 0.6, y], [x, y + r * tall * 0.7], [x - r * 0.6, y]], light);
    fill(ctx, [[x, y - r * tall * 0.4], [x + r * 0.28, y - r * 0.1], [x, y + r * tall * 0.2], [x - r * 0.28, y - r * 0.1]], core);
  }
  // A spiky star burst with uneven spikes.
  function starburst(ctx, pal, x, y, r, spikes, seed, { inner = 0.38, tones = 4, rot = 0 } = {}) {
    const R = rng(seed);
    const lens = Array.from({ length: spikes }, () => 0.6 + R() * 0.4);
    const offs = Array.from({ length: spikes }, () => (R() - 0.5) * 0.5);
    const pts = (k) => {
      const out = [];
      for (let i = 0; i < spikes; i++) {
        const a = rot + ((i + offs[i] * 0.3) * TAU) / spikes;
        out.push([x + Math.cos(a) * r * lens[i] * k, y + Math.sin(a) * r * lens[i] * k]);
        const b = rot + ((i + 0.5) * TAU) / spikes;
        out.push([x + Math.cos(b) * r * inner * k, y + Math.sin(b) * r * inner * k]);
      }
      return out;
    };
    const [core, light, mid, deep, ink] = pal;
    inked(ctx, pts(1), tones > 3 ? deep : mid, ink, 4);
    if (tones > 3) fill(ctx, pts(0.78), mid);
    fill(ctx, pts(0.55), light);
    fill(ctx, pts(0.3), core);
  }
  // A ring of the given thickness, banded: deep inside, the colour, a light band, a white rim.
  function celRing(ctx, pal, x, y, r, th, { broken = 0, seed = 3 } = {}) {
    const [core, light, mid, deep, ink] = pal;
    const R = rng(seed);
    const gaps = [];
    for (let i = 0; i < Math.round(broken * 9); i++) gaps.push([R() * TAU, 0.15 + R() * 0.35 * broken]);
    const arcs = [[0, TAU]];
    let segs = arcs;
    if (gaps.length) {
      gaps.sort((a, b) => a[0] - b[0]);
      segs = [];
      let start = gaps[gaps.length - 1][0] + gaps[gaps.length - 1][1] - TAU;
      for (const [g, w] of gaps) {
        if (g > start) segs.push([start, g]);
        start = g + w;
      }
    }
    for (const [a0, a1] of segs) {
      const band = (r0, r1, colour, ink2) => {
        const pts = [];
        const n = Math.max(6, Math.round(((a1 - a0) * r1) / 6));
        for (let i = 0; i <= n; i++) pts.push([x + Math.cos(lerp(a0, a1, i / n)) * r1, y + Math.sin(lerp(a0, a1, i / n)) * r1]);
        for (let i = n; i >= 0; i--) pts.push([x + Math.cos(lerp(a0, a1, i / n)) * r0, y + Math.sin(lerp(a0, a1, i / n)) * r0]);
        if (ink2) inked(ctx, pts, colour, ink2, 4);
        else fill(ctx, pts, colour);
      };
      band(r - th, r, deep, ink);
      band(r - th * 0.75, r, mid);
      band(r - th * 0.45, r, light);
      band(r - th * 0.18, r, core);
    }
  }
  // Speed lines: thin tapered strokes.
  function speedLine(ctx, pal, x0, y0, x1, y1, w) {
    const [core, , mid, , ink] = pal;
    const a = Math.atan2(y1 - y0, x1 - x0);
    const nx = -Math.sin(a) * w;
    const ny = Math.cos(a) * w;
    const mx = lerp(x0, x1, 0.65);
    const my = lerp(y0, y1, 0.65);
    inked(ctx, [[x0, y0], [mx + nx, my + ny], [x1, y1], [mx - nx, my - ny]], mid, ink, 2);
    fill(ctx, [[lerp(x0, x1, 0.2), lerp(y0, y1, 0.2)], [mx + nx * 0.4, my + ny * 0.4], [lerp(x0, x1, 0.95), lerp(y0, y1, 0.95)], [mx - nx * 0.4, my - ny * 0.4]], core);
  }
  // A cel puff: a cluster of round lobes with a shadow side, holes punched in as it breaks up.
  function puff(ctx, pal, x, y, r, seed, { holes = 0, lobes = 5 } = {}) {
    const [core, light, mid, deep, ink] = pal;
    const R = rng(seed);
    const bits = [[x, y, r]];
    for (let i = 0; i < lobes; i++) {
      const a = R() * TAU;
      const d = r * (0.45 + R() * 0.35);
      bits.push([x + Math.cos(a) * d, y + Math.sin(a) * d * 0.75, r * (0.45 + R() * 0.3)]);
    }
    const disc = (k, dx, dy) => {
      ctx.beginPath();
      for (const [bx, by, br] of bits) {
        ctx.moveTo(bx + dx + br * k, by + dy);
        ctx.arc(bx + dx, by + dy, br * k, 0, TAU);
      }
    };
    disc(1, 0, 0);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = deep;
    ctx.fill();
    disc(0.92, -r * 0.08, -r * 0.1);
    ctx.fillStyle = mid;
    ctx.fill();
    disc(0.78, -r * 0.16, -r * 0.18);
    ctx.fillStyle = light;
    ctx.fill();
    disc(0.4, -r * 0.3, -r * 0.3);
    ctx.fillStyle = core;
    ctx.fill();
    if (holes > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 4; i++) {
        const a = R() * TAU;
        const d = r * R() * 0.7;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, r * 0.55 * holes * (0.6 + R() * 0.6), 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
  }
  // A flame tongue: a teardrop from a round base to a swaying point.
  function tongue(ctx, pal, x, y, w, h, sway) {
    const [core, light, mid, deep, ink] = pal;
    const shape = (k, dy = 0) => {
      const ww = w * k;
      const hh = h * k;
      ctx.beginPath();
      ctx.moveTo(x - ww, y + dy);
      ctx.bezierCurveTo(x - ww * 1.1, y - hh * 0.45 + dy, x + sway * 0.3 - ww * 0.4, y - hh * 0.75 + dy, x + sway, y - hh + dy);
      ctx.bezierCurveTo(x + sway * 0.3 + ww * 0.5, y - hh * 0.7 + dy, x + ww * 1.1, y - hh * 0.4 + dy, x + ww, y + dy);
      ctx.arc(x, y + dy, ww, 0, Math.PI);
      ctx.closePath();
    };
    shape(1);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = ink;
    ctx.lineWidth = 3.5;
    ctx.stroke();
    ctx.fillStyle = deep;
    ctx.fill();
    shape(0.8, w * 0.12);
    ctx.fillStyle = mid;
    ctx.fill();
    shape(0.56, w * 0.25);
    ctx.fillStyle = light;
    ctx.fill();
    shape(0.3, w * 0.4);
    ctx.fillStyle = core;
    ctx.fill();
  }
  // A drop of liquid flying along `a` (a teardrop trailing behind it).
  function drop(ctx, pal, x, y, a, r) {
    const [, light, mid, , ink] = pal;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const pts = [];
    for (let i = 0; i <= 12; i++) {
      const t = (i / 12) * TAU;
      const back = Math.cos(t) < 0 ? 1 + 1.6 * -Math.cos(t) : 1;
      const px = Math.cos(t) * r * back;
      const py = Math.sin(t) * r * (Math.cos(t) < 0 ? 1 - 0.55 * -Math.cos(t) : 1);
      pts.push([x + px * c - py * s, y + px * s + py * c]);
    }
    inked(ctx, pts, mid, ink, 2.5);
    ctx.beginPath();
    ctx.arc(x + c * r * 0.3 - s * r * 0.2, y + s * r * 0.3 + c * r * 0.2, r * 0.35, 0, TAU);
    ctx.fillStyle = light;
    ctx.fill();
  }

  const E = {};
  const SCHOOLS = Object.keys(PAL);

  // ---------- Blade swipes ----------
  // A swipe over the top of its circle, sweeping clockwise from the left to the right. The game
  // turns and mirrors it to follow each blade's own swing (`swing`). Drawings: a thin lead smear,
  // the full crescent (the key, held two frames with speed lines and a glint at its head), then it
  // thins, splits into pieces that drift out, and the pieces become shards.
  function swipe(pal, { rough = 0, seed = 7 } = {}) {
    const cx = 130;
    const cy = 150;
    const R = 100;
    const a0 = (-168 * Math.PI) / 180;
    const a1 = (-12 * Math.PI) / 180;
    return {
      w: 260, h: 200, n: 8, fps: 30, px: cx, py: cy, swing: [-Math.PI / 2, 1, R],
      draw(ctx, i) {
        const o = { rough, seed };
        if (i === 0) {
          celCrescent(ctx, pal, cx, cy, R, lerp(a0, a1, 0.35), a1, 20, o);
          return;
        }
        if (i === 1 || i === 2) {
          celCrescent(ctx, pal, cx, cy, R, a0, a1, 40, o);
          if (i === 2) {
            for (const [k, d] of [[0.35, 14], [0.6, 20], [0.82, 12]]) {
              const a = lerp(a0, a1, k);
              const b = a - 0.38;
              speedLine(ctx, pal, cx + Math.cos(b) * (R + d), cy + Math.sin(b) * (R + d), cx + Math.cos(a) * (R + d), cy + Math.sin(a) * (R + d), 3);
            }
            sparkle(ctx, pal, cx + Math.cos(a1) * (R - 6), cy + Math.sin(a1) * (R - 6), 16, 0.3);
          } else sparkle(ctx, pal, cx + Math.cos(a1) * (R - 4), cy + Math.sin(a1) * (R - 4), 11, 0);
          return;
        }
        if (i === 3) {
          celCrescent(ctx, pal, cx, cy, R, lerp(a0, a1, 0.2), a1, 28, o);
          return;
        }
        // Breaking up: pieces of the crescent drift outward and shrink, then shards.
        const k = (i - 3) / 4;
        const cuts = [[0.25, 0.48], [0.5, 0.72], [0.74, 0.97]];
        if (i <= 5) {
          cuts.forEach(([u0, u1], j) => celCrescent(ctx, pal, cx, cy, R, a0, a1, 34 * (1 - k * 0.7), { ...o, u0, u1, out: 6 + k * 18 + j * 3 }));
        }
        const R2 = rng(seed + i);
        for (let j = 0; j < 7; j++) {
          const u = 0.3 + j * 0.1;
          const a = lerp(a0, a1, u);
          const d = R + 8 + k * 36 + R2() * 10;
          if (i >= 5 || j % 2) shard(ctx, pal, cx + Math.cos(a) * d, cy + Math.sin(a) * d, a + Math.PI / 2 + 0.4, 12 * (1.2 - k), 3.2 * (1.2 - k));
        }
      },
    };
  }
  E.slash = swipe(PAL.steel);
  E.slashgold = swipe(PAL.holy, { seed: 11 });
  E.slashred = swipe(PAL.rage, { rough: 0.35, seed: 13 });

  // A whirl, drawn from above (the game squashes it flat round the body): the swipe sweeps right
  // round the circle, the full ring holds, then breaks into pieces flung outward.
  function spin(pal, rough = 0) {
    const c = 130;
    const R = 112;
    return {
      w: 260, h: 260, n: 7, fps: 28, px: c, py: c,
      draw(ctx, i) {
        const sweeps = [1.6, 3.4, 6.2, 6.2];
        if (i < 4) {
          const s = sweeps[i];
          celCrescent(ctx, pal, c, c, R, -Math.PI / 2, -Math.PI / 2 + s, i < 2 ? 34 : 40, { rough, seed: 5 });
          if (i === 3) celCrescent(ctx, pal, c, c, R - 34, Math.PI / 2, Math.PI / 2 + 4.5, 18, { rough, seed: 6 });
          return;
        }
        const k = (i - 3) / 3;
        for (let j = 0; j < 5; j++) {
          const u0 = j / 5 + 0.03;
          celCrescent(ctx, pal, c, c, R, -Math.PI / 2, -Math.PI / 2 + 6.2, 34 * (1 - k * 0.75), { u0, u1: u0 + 0.15, out: k * 16, rough, seed: 5 });
        }
        for (let j = 0; j < 8; j++) {
          const a = (j / 8) * TAU + 0.3;
          const d = R + 6 + k * 22;
          shard(ctx, pal, c + Math.cos(a) * d, c + Math.sin(a) * d, a + Math.PI / 2, 12 * (1.2 - k * 0.6), 3);
        }
      },
    };
  }
  E.spin = spin(PAL.steel);
  E.spinred = spin(PAL.rage, 0.3);

  // ---------- Hits ----------
  // A blow landing: a white pop, the burst at its biggest (uneven spikes, cel tones), its spikes
  // retracting as shards fly out, a thin ring, then specks.
  function hit(pal, seed) {
    const c = 100;
    return {
      w: 200, h: 200, n: 6, fps: 30, px: c, py: c,
      draw(ctx, i) {
        const R = rng(seed);
        if (i === 0) {
          ctx.beginPath();
          ctx.arc(c, c, 24, 0, TAU);
          ctx.fillStyle = pal[4];
          ctx.fill();
          ctx.beginPath();
          ctx.arc(c, c, 19, 0, TAU);
          ctx.fillStyle = pal[0];
          ctx.fill();
          return;
        }
        if (i === 1) {
          starburst(ctx, pal, c, c, 78, 7, seed, { inner: 0.32 });
          return;
        }
        if (i === 2) {
          starburst(ctx, pal, c, c, 60, 7, seed, { inner: 0.2, tones: 3 });
          celRing(ctx, pal, c, c, 52, 8, { seed });
        }
        const k = (i - 1) / 4;
        for (let j = 0; j < 7; j++) {
          const a = (j / 7) * TAU + R() * 0.5;
          const d = 30 + k * 60;
          if (i < 5) shard(ctx, pal, c + Math.cos(a) * d, c + Math.sin(a) * d, a, 14 * (1.1 - k * 0.6), 3.5 * (1.1 - k * 0.5));
          else sparkle(ctx, pal, c + Math.cos(a) * d, c + Math.sin(a) * d, 5, a);
        }
        if (i === 3) celRing(ctx, pal, c, c, 70, 5, { broken: 0.5, seed });
      },
    };
  }
  E.hit = hit(PAL.steel, 21);
  E.hitgold = hit(PAL.holy, 22);
  E.hitred = hit(PAL.rage, 23);

  // The Warrior's mark: two blades of light struck across the monster one after the other (an X),
  // held with a glint where they cross, then each blade is cut in two at the cross and the halves
  // fly apart along it, thinning to slivers.
  E.cross = (() => {
    const pal = PAL.steel;
    const c = 100;
    // A blade along angle a, from `from` to `to` (distances from the centre along it), `wid` wide.
    const blade = (ctx, a, from, to, wid) => {
      const cs = Math.cos(a);
      const sn = Math.sin(a);
      const at = (d, w) => [c + cs * d - sn * w, c + sn * d + cs * w];
      const mid = (from + to) / 2;
      const len = (to - from) / 2;
      const band = (k, colour, ink) => {
        const pts = [at(mid - len, 0), at(mid, -wid * k), at(mid + len, 0), at(mid, wid * k)];
        if (ink) inked(ctx, pts, colour, ink, 3.5);
        else fill(ctx, pts, colour);
      };
      band(1, pal[3], pal[4]);
      band(0.7, pal[2]);
      band(0.42, pal[1]);
      band(0.16, pal[0]);
    };
    const A = -0.78;
    const B = 0.78;
    return {
      w: 200, h: 200, n: 6, fps: 26, px: c, py: c,
      draw(ctx, i) {
        if (i === 0) return blade(ctx, A, -86, 86, 13);
        if (i <= 2) {
          blade(ctx, A, -88, 88, 14);
          blade(ctx, B, -88, 88, 14);
          sparkle(ctx, pal, c, c, i === 1 ? 28 : 18, 0.4);
          return;
        }
        const k = (i - 2) / 3;
        const gap = 8 + k * 34;
        const wid = 11 * (1 - k * 0.7);
        for (const a of [A, B]) {
          blade(ctx, a, -88 - k * 10, -gap, wid);
          blade(ctx, a, gap, 88 + k * 10, wid);
        }
        if (i === 5) for (let j = 0; j < 4; j++) sparkle(ctx, pal, c + Math.cos(j * 1.57) * 36, c + Math.sin(j * 1.57) * 36, 6, 0);
      },
    };
  })();

  // The Berserker's mark: three ragged claw slashes torn across in turn, blood bursting from them,
  // the drops flying and falling.
  E.claw = (() => {
    const pal = PAL.rage;
    const c = 100;
    const slashes = [-30, 0, 30];
    const claw = (ctx, dx, len, wid, seed) => {
      const R = rng(seed);
      const pts = [];
      const n = 10;
      for (let j = 0; j <= n; j++) {
        const t = j / n;
        const x = c + dx - len / 2 + len * t + Math.sin(t * Math.PI) * 10;
        const y = c - len / 2 + len * t;
        const w = Math.sin(t * Math.PI) * wid * (1 + (R() - 0.5) * 0.6);
        pts.push([x - w * 0.7, y + w * 0.7]);
      }
      for (let j = n; j >= 0; j--) {
        const t = j / n;
        const x = c + dx - len / 2 + len * t + Math.sin(t * Math.PI) * 10;
        const y = c - len / 2 + len * t;
        const w = Math.sin(t * Math.PI) * wid * (1 + (R() - 0.5) * 0.6);
        pts.push([x + w * 0.7, y - w * 0.7]);
      }
      inked(ctx, pts, pal[3], pal[4], 4);
      fill(ctx, pts.map(([x, y], j) => [lerp(c + dx, x, 0.7), lerp(c, y, 0.95)]), pal[2]);
      fill(ctx, pts.map(([x, y]) => [lerp(c + dx, x, 0.35), lerp(c, y, 0.85)]), pal[1]);
    };
    return {
      w: 200, h: 200, n: 7, fps: 26, px: c, py: c,
      draw(ctx, i) {
        const shown = Math.min(3, i + 1);
        const k = i < 3 ? 0 : (i - 2) / 4;
        for (let j = 0; j < shown; j++) claw(ctx, slashes[j], 150 * (1 - k * 0.3), 13 * (1 - k * 0.7), 30 + j);
        if (i >= 2) {
          const R = rng(40);
          for (let j = 0; j < 9; j++) {
            const a = -0.3 + R() * 2.4;
            const d = 20 + (i - 1) * 16 * (0.6 + R() * 0.8);
            const g = (i - 2) * (i - 2) * 3;
            if (i < 6 || j % 2) drop(ctx, pal, c + Math.cos(a) * d, c + Math.sin(a) * d * 0.6 + g, a, 6 * (1.15 - k * 0.6));
          }
        }
      },
    };
  })();

  // The Paladin's mark: a sliver of light drops onto the monster, opens into a great four-point
  // star of light with a ring (holy shapes are rounded or square, never jagged), then diamonds of
  // light float up and shrink away.
  E.holyhit = (() => {
    const pal = PAL.holy;
    const c = 110;
    const star = (ctx, r, th) => {
      const pts = [];
      for (let j = 0; j < 8; j++) {
        const a = -Math.PI / 2 + (j * TAU) / 8;
        const rr = j % 2 ? r * th : j % 4 === 0 ? r : r * 0.7;
        pts.push([c + Math.cos(a) * rr, c + Math.sin(a) * rr]);
      }
      inked(ctx, pts, pal[3], pal[4], 4);
      fill(ctx, pts.map(([x, y]) => [lerp(c, x, 0.78), lerp(c, y, 0.78)]), pal[2]);
      fill(ctx, pts.map(([x, y]) => [lerp(c, x, 0.55), lerp(c, y, 0.55)]), pal[1]);
      fill(ctx, pts.map(([x, y]) => [lerp(c, x, 0.32), lerp(c, y, 0.32)]), pal[0]);
    };
    return {
      w: 220, h: 220, n: 7, fps: 24, px: c, py: c,
      draw(ctx, i) {
        if (i === 0) {
          inked(ctx, [[c, c - 100], [c + 7, c], [c, c + 30], [c - 7, c]], pal[2], pal[4], 3);
          fill(ctx, [[c, c - 90], [c + 3, c], [c, c + 22], [c - 3, c]], pal[0]);
          return;
        }
        if (i <= 2) {
          celRing(ctx, pal, c, c, i === 1 ? 50 : 66, 9, { seed: 8 });
          star(ctx, i === 1 ? 92 : 84, 0.17);
          return;
        }
        const k = (i - 2) / 4;
        if (i === 3) {
          celRing(ctx, pal, c, c, 78, 6, { broken: 0.5, seed: 8 });
          star(ctx, 60, 0.14);
        }
        const R = rng(9);
        for (let j = 0; j < 6; j++) {
          const x = c + (R() - 0.5) * 120;
          const y = c + 30 - k * 90 - R() * 40;
          diamond(ctx, pal, x, y, 7 * (1.1 - k * 0.6));
        }
      },
    };
  })();

  // A critical hit, Kanada style: a contrast frame (an ink burst with white streaks), the white-hot
  // star at full size, the coloured burst with shards, then shards and specks.
  E.crit = (() => {
    const pal = PAL.holy;
    const c = 130;
    return {
      w: 260, h: 260, n: 6, fps: 26, px: c, py: c,
      draw(ctx, i) {
        if (i === 0) {
          starburst(ctx, ['#ffffff', '#3a2a4a', '#24182e', '#14101c', '#000000'], c, c, 110, 11, 50, { inner: 0.3 });
          for (let j = 0; j < 8; j++) {
            const a = (j / 8) * TAU + 0.2;
            speedLine(ctx, ['#ffffff', '#ffffff', '#ffffff', '#ffffff', '#000000'], c + Math.cos(a) * 20, c + Math.sin(a) * 20, c + Math.cos(a) * 115, c + Math.sin(a) * 115, 4);
          }
          return;
        }
        if (i === 1) {
          starburst(ctx, ['#ffffff', '#ffffff', '#fffbe6', '#ffe9a0', pal[4]], c, c, 120, 11, 51, { inner: 0.3 });
          return;
        }
        if (i === 2) {
          starburst(ctx, pal, c, c, 104, 11, 51, { inner: 0.26 });
          celRing(ctx, pal, c, c, 86, 10, { seed: 52 });
        }
        const k = (i - 1) / 4;
        const R = rng(53);
        for (let j = 0; j < 10; j++) {
          const a = (j / 10) * TAU + R() * 0.4;
          const d = 50 + k * 70;
          if (i < 5) shard(ctx, pal, c + Math.cos(a) * d, c + Math.sin(a) * d, a, 18 * (1.2 - k * 0.6), 4.5 * (1.1 - k * 0.5));
          else sparkle(ctx, pal, c + Math.cos(a) * d, c + Math.sin(a) * d, 7, a);
        }
      },
    };
  })();

  // ---------- Light rising from the ground ----------
  // A pillar of light, drawn standing on its base point: a needle of light shoots up, the column
  // opens with hard banded edges and spikes of light at its foot, rings ride up it, then it pinches
  // in from the bottom and breaks into rising diamonds.
  function pillar(pal) {
    const w = 150;
    const h = 330;
    const base = 318;
    const cx = w / 2;
    const col = (ctx, half, top, bottom) => {
      const band = (k, colour, ink) => {
        const pts = [[cx - half * k, bottom], [cx - half * k, top + half * k * 0.6], [cx, top], [cx + half * k, top + half * k * 0.6], [cx + half * k, bottom]];
        if (ink) inked(ctx, pts, colour, ink, 4);
        else fill(ctx, pts, colour);
      };
      band(1, pal[3], pal[4]);
      band(0.78, pal[2]);
      band(0.5, pal[1]);
      band(0.24, pal[0]);
    };
    const foot = (ctx, r) => {
      const R = rng(4);
      for (let j = 0; j < 7; j++) {
        const x = cx + (j - 3) * r * 0.28;
        const tall = r * (0.5 + R() * 0.6) * (1 - Math.abs(j - 3) * 0.18);
        inked(ctx, [[x - 6, base], [x + (j - 3) * 3, base - tall], [x + 6, base]], pal[2], pal[4], 3);
        fill(ctx, [[x - 2.5, base], [x + (j - 3) * 3 * 0.9, base - tall * 0.75], [x + 2.5, base]], pal[0]);
      }
    };
    const ringAt = (ctx, y, r) => {
      ctx.save();
      ctx.translate(cx, y);
      ctx.scale(1, 0.3);
      celRing(ctx, pal, 0, 0, r, 10, { seed: 2 });
      ctx.restore();
    };
    return {
      w, h, n: 8, fps: 20, px: cx, py: base,
      draw(ctx, i) {
        if (i === 0) {
          col(ctx, 5, base - 140, base);
          return;
        }
        if (i === 1) {
          col(ctx, 20, 10, base);
          foot(ctx, 60);
          return;
        }
        if (i <= 4) {
          const half = [0, 0, 34, 30, 24][i];
          col(ctx, half, 6, base);
          foot(ctx, [0, 0, 80, 70, 50][i]);
          ringAt(ctx, base - 30 - (i - 2) * 80, 46 - (i - 2) * 6);
          ringAt(ctx, base - 140 - (i - 2) * 70, 36);
          return;
        }
        const k = (i - 4) / 3;
        if (i === 5) col(ctx, 12, 6, base - 120);
        const R = rng(6);
        for (let j = 0; j < 9; j++) {
          const x = cx + (R() - 0.5) * 70;
          const y = base - 60 - R() * 220 - k * 60;
          diamond(ctx, pal, x, y, 7 * (1.2 - k * 0.7));
        }
      },
    };
  }
  for (const s of SCHOOLS) E[s === 'steel' ? 'pillar' : `pillar${s}`] = pillar(PAL[s]);

  // A ring of force bursting out (the game squashes it flat on the ground): it snaps out thick,
  // thins as it widens, then breaks into dashes.
  function ringBurst(pal) {
    const c = 130;
    return {
      w: 260, h: 260, n: 6, fps: 24, px: c, py: c,
      draw(ctx, i) {
        const r = [40, 70, 92, 106, 116, 122][i];
        const th = [26, 22, 16, 11, 7, 4][i];
        celRing(ctx, pal, c, c, r, th, { broken: i < 3 ? 0 : (i - 2) * 0.3, seed: 12 });
      },
    };
  }
  for (const s of SCHOOLS) E[s === 'steel' ? 'ring' : `ring${s}`] = ringBurst(PAL[s]);

  // ---------- The ground ----------
  // A heavy blow cracks the ground: a glowing fissure, then shards of rock burst up in a fan,
  // pale dust billows out from the foot and breaks apart while the rocks fall back.
  E.quake = (() => {
    const w = 280;
    const h = 220;
    const g = 200;
    const c = w / 2;
    const R = rng(77);
    const rocks = Array.from({ length: 7 }, (_, j) => ({ x: c + (j - 3) * 26 + (R() - 0.5) * 10, lean: (j - 3) * 0.16 + (R() - 0.5) * 0.15, tall: 60 + R() * 50 * (1 - Math.abs(j - 3) * 0.2), wide: 12 + R() * 8 }));
    const rock = (ctx, r, lift, k) => {
      const t = r.tall * k;
      const bx = r.x + Math.sin(r.lean) * lift;
      const by = g - lift;
      const pts = [[bx - r.wide, by], [bx - r.wide * 0.6 + Math.sin(r.lean) * t * 0.5, by - t * 0.6], [bx + Math.sin(r.lean) * t, by - t], [bx + r.wide * 0.8 + Math.sin(r.lean) * t * 0.4, by - t * 0.45], [bx + r.wide, by]];
      inked(ctx, pts, ROCK[3], ROCK[4], 3.5);
      fill(ctx, [pts[0], pts[1], pts[2], [lerp(pts[0][0], pts[4][0], 0.45), by]], ROCK[2]);
      fill(ctx, [[lerp(pts[0][0], pts[1][0], 0.3), lerp(pts[0][1], pts[1][1], 0.3)], pts[1], pts[2], [lerp(pts[1][0], pts[2][0], 0.2) + 4, lerp(pts[1][1], pts[2][1], 0.5)]], ROCK[1]);
    };
    return {
      w, h, n: 9, fps: 22, px: c, py: g,
      draw(ctx, i) {
        if (i === 0) {
          inked(ctx, [[c - 110, g], [c - 40, g - 4], [c, g - 2], [c + 50, g - 5], [c + 110, g], [c + 50, g + 3], [c, g + 4], [c - 40, g + 3]], PAL.holy[1], PAL.holy[4], 3);
          return;
        }
        const k = [0, 0.7, 1, 1, 0.9, 0.7, 0.5, 0.3, 0][i];
        const lift = [0, 0, 6, 16, 22, 18, 8, 0, 0][i];
        if (i < 8) rocks.forEach((r) => rock(ctx, r, lift, k));
        if (i >= 2) {
          const d = (i - 1) / 7;
          for (const side of [-1, 1]) puff(ctx, DUST, c + side * (40 + d * 70), g - 18 - d * 10, 26 + d * 18 - (i > 6 ? (i - 6) * 10 : 0), 90 + side, { holes: Math.max(0, (i - 5) / 3) });
          if (i < 6) puff(ctx, DUST, c, g - 26 - d * 20, 30 + d * 10, 95, { holes: Math.max(0, (i - 4) / 3) });
        }
      },
    };
  })();

  // Dust kicked up (a dash, a landing): a puff that billows, drifts and breaks apart.
  E.dust = {
    w: 180, h: 140, n: 7, fps: 20, px: 90, py: 120,
    draw(ctx, i) {
      const k = i / 6;
      puff(ctx, DUST, 90 - k * 18, 100 - k * 14, 26 + k * 18 - (i > 4 ? (i - 4) * 12 : 0), 61, { holes: Math.max(0, (i - 3) / 3) });
      if (i > 0) puff(ctx, DUST, 120 + k * 10, 108 - k * 8, 16 + k * 12 - (i > 4 ? (i - 4) * 9 : 0), 62, { holes: Math.max(0, (i - 3) / 3), lobes: 3 });
    },
  };

  // ---------- Fire and blood (the Berserker) ----------
  // A fire, looping: tongues born at the base every few frames, rising, swaying and tapering to a
  // point, embers flicking up.
  E.fire = (() => {
    const w = 140;
    const h = 170;
    const base = 150;
    const R = rng(88);
    const tongues = Array.from({ length: 7 }, (_, j) => ({ x: 70 + (j - 3) * 13 + (R() - 0.5) * 8, phase: j / 7, h: 70 + R() * 50, w: 13 + R() * 6, sway: (R() - 0.5) * 20 }));
    return {
      w, h, n: 8, fps: 16, px: 70, py: base, loop: true,
      draw(ctx, i) {
        const t = i / 8;
        const order = tongues.map((tg) => ({ tg, life: (t + tg.phase) % 1 })).sort((a, b) => b.tg.h * Math.sin(b.life * Math.PI) - a.tg.h * Math.sin(a.life * Math.PI));
        for (const { tg, life } of order) {
          const grow = Math.sin(life * Math.PI);
          tongue(ctx, PAL.fire, tg.x, base - life * 18, tg.w * (0.6 + grow * 0.5), tg.h * (0.35 + grow * 0.75), tg.sway * Math.sin(life * TAU + tg.phase * 4));
        }
        for (let j = 0; j < 4; j++) {
          const life = (t * 2 + j / 4) % 1;
          shard(ctx, PAL.fire, 50 + j * 13 + Math.sin(life * 9 + j) * 6, base - 60 - life * 90, -Math.PI / 2, 7 * (1 - life), 2);
        }
      },
    };
  })();
  // The same fire in blood red and black, for the Berserker's rage.
  E.ragefire = (() => {
    const f = E.fire;
    return {
      ...f,
      draw(ctx, i) {
        const save = PAL.fire;
        PAL.fire = ['#ffe9e9', '#ff8a6a', '#ff2a3d', '#8f0018', '#1c0006'];
        f.draw(ctx, i);
        PAL.fire = save;
      },
    };
  })();

  // Blood bursting from a heavy blow: a splash of drops flung out, arcing down.
  E.blood = {
    w: 200, h: 200, n: 6, fps: 22, px: 100, py: 90,
    draw(ctx, i) {
      const pal = PAL.rage;
      const R = rng(66);
      if (i === 0) {
        starburst(ctx, pal, 100, 90, 46, 9, 67, { inner: 0.5, tones: 3 });
        return;
      }
      for (let j = 0; j < 12; j++) {
        const a = -Math.PI * 0.95 + R() * Math.PI * 1.3;
        const sp = 30 + R() * 40;
        const x = 100 + Math.cos(a) * sp * i * 0.5;
        const y = 90 + Math.sin(a) * sp * i * 0.4 + i * i * 4;
        const fall = Math.atan2(Math.sin(a) * sp * 0.4 + i * 8, Math.cos(a) * sp * 0.5);
        if (i < 5 || j % 2) drop(ctx, pal, x, y, fall, (5 + R() * 4) * (1.1 - i * 0.12));
      }
    },
  };

  // The Berserker's black sun (his Crimson Eclipse): a disc of black with a thin white rim and a
  // corona of jagged crimson flame licking round it, looping.
  E.eclipse = {
    w: 260, h: 260, n: 6, fps: 12, px: 130, py: 130, loop: true,
    draw(ctx, i) {
      const c = 130;
      const R = rng(100 + i);
      const spikes = 22;
      const corona = (k, colour, ink) => {
        const pts = [];
        for (let j = 0; j < spikes; j++) {
          const a = (j / spikes) * TAU + i * 0.05;
          const len = (78 + R() * 34) * k;
          pts.push([c + Math.cos(a) * len, c + Math.sin(a) * len]);
          const b = ((j + 0.5) / spikes) * TAU + i * 0.05;
          pts.push([c + Math.cos(b) * 64 * k, c + Math.sin(b) * 64 * k]);
        }
        if (ink) inked(ctx, pts, colour, ink, 4);
        else fill(ctx, pts, colour);
      };
      corona(1.06, PAL.rage[3], PAL.rage[4]);
      corona(0.96, PAL.rage[2]);
      corona(0.86, PAL.rage[1]);
      ctx.beginPath();
      ctx.arc(c, c, 62, 0, TAU);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(c, c, 57, 0, TAU);
      ctx.fillStyle = '#12000a';
      ctx.fill();
      celCrescent(ctx, ['#ff7a8a', '#5a0016', '#3a000e', '#25000a', '#000000'], c, c, 50, -2.6, -0.6, 12);
    },
  };

  // ---------- The Paladin's light ----------
  // A shield of light: one hexagon flashes up, the full honeycomb shield snaps out, a glint sweeps
  // across it, cracks run through it, then it shatters into flying plates.
  E.shield = (() => {
    const pal = PAL.holy;
    const c = 110;
    const cells = [[0, 0]];
    for (let j = 0; j < 6; j++) cells.push([Math.cos((j * TAU) / 6 + Math.PI / 6) * 38, Math.sin((j * TAU) / 6 + Math.PI / 6) * 38]);
    const hex = (ctx, x, y, r, k = 1) => {
      const pts = [];
      for (let j = 0; j < 6; j++) pts.push([x + Math.cos((j * TAU) / 6) * r, y + Math.sin((j * TAU) / 6) * r * 1.0]);
      inked(ctx, pts, pal[2], pal[4], 3.5);
      fill(ctx, pts.map(([px, py]) => [lerp(x, px, 0.8), lerp(y, py, 0.8)]), pal[1]);
      fill(ctx, pts.map(([px, py]) => [lerp(x, px, 0.45) - r * 0.15, lerp(y, py, 0.45) - r * 0.15]), k > 0.5 ? pal[0] : pal[1]);
    };
    return {
      w: 220, h: 220, n: 7, fps: 20, px: c, py: c,
      draw(ctx, i) {
        if (i === 0) return hex(ctx, c, c, 30);
        if (i <= 3) {
          cells.forEach(([x, y]) => hex(ctx, c + x, c + y, 21));
          if (i === 2) speedLine(ctx, PAL.holy, c - 70, c + 40, c + 60, c - 60, 5);
          if (i === 3) {
            ctx.strokeStyle = pal[4];
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(c - 10, c - 60);
            ctx.lineTo(c + 5, c - 10);
            ctx.lineTo(c - 15, c + 20);
            ctx.lineTo(c + 10, c + 62);
            ctx.moveTo(c + 5, c - 10);
            ctx.lineTo(c + 50, c + 5);
            ctx.stroke();
          }
          return;
        }
        const k = (i - 3) / 3;
        cells.forEach(([x, y], j) => {
          const a = Math.atan2(y, x || 1) + (j ? 0 : 1.2);
          const d = 18 + k * 60;
          hex(ctx, c + x + Math.cos(a) * d * (j ? 1 : 0.4), c + y + Math.sin(a) * d * (j ? 1 : 0.4) + k * k * 30, 21 * (1 - k * 0.6), 0);
        });
      },
    };
  })();

  // A golden magic circle (drawn from above; the game lays it flat on the floor and turns it):
  // double rings, a square and a diamond woven into a star, rune marks round the band.
  E.circle = {
    w: 280, h: 280, n: 1, fps: 1, px: 140, py: 140,
    draw(ctx) {
      const pal = PAL.holy;
      const c = 140;
      const line = (draw, w) => {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        draw();
        ctx.strokeStyle = pal[4];
        ctx.lineWidth = w + 4;
        ctx.stroke();
        ctx.strokeStyle = pal[2];
        ctx.lineWidth = w;
        ctx.stroke();
        ctx.strokeStyle = pal[0];
        ctx.lineWidth = Math.max(1, w * 0.35);
        ctx.stroke();
      };
      const ring = (r, w) => line(() => {
        ctx.beginPath();
        ctx.arc(c, c, r, 0, TAU);
      }, w);
      ring(128, 6);
      ring(110, 3);
      ring(62, 4);
      for (const rot of [0, Math.PI / 4]) {
        line(() => {
          ctx.beginPath();
          for (let j = 0; j <= 4; j++) {
            const a = rot + (j * TAU) / 4;
            if (j) ctx.lineTo(c + Math.cos(a) * 108, c + Math.sin(a) * 108);
            else ctx.moveTo(c + Math.cos(a) * 108, c + Math.sin(a) * 108);
          }
        }, 3.5);
      }
      // Rune marks: little crosses and bars round the band between the outer rings.
      for (let j = 0; j < 24; j++) {
        const a = (j / 24) * TAU;
        const x = c + Math.cos(a) * 119;
        const y = c + Math.sin(a) * 119;
        line(() => {
          ctx.beginPath();
          const t = a + Math.PI / 2;
          const s = j % 3 === 0 ? 5 : 3;
          ctx.moveTo(x - Math.cos(t) * s, y - Math.sin(t) * s);
          ctx.lineTo(x + Math.cos(t) * s, y + Math.sin(t) * s);
          if (j % 3 === 0) {
            ctx.moveTo(x - Math.cos(a) * 4, y - Math.sin(a) * 4);
            ctx.lineTo(x + Math.cos(a) * 4, y + Math.sin(a) * 4);
          }
        }, 2);
      }
      diamond(ctx, pal, c, c, 16, 1.6);
    },
  };

  // A sword of light (Grand Verdict): a great blade with a white-hot edge line, a crossguard and a
  // hilt, held whole, then cracking apart into shards along its length.
  E.sword = (() => {
    const pal = PAL.holy;
    const w = 140;
    const h = 380;
    const cx = 70;
    const tip = 372;
    const blade = (ctx, y0, y1, k) => {
      const half = 22 * k;
      inked(ctx, [[cx - half, y0], [cx + half, y0], [cx + half, y1 - 40 * k], [cx, y1], [cx - half, y1 - 40 * k]], pal[3], pal[4], 4);
      fill(ctx, [[cx - half * 0.8, y0 + 2], [cx, y0 + 2], [cx, y1 - 6], [cx - half * 0.8, y1 - 38 * k]], pal[2]);
      fill(ctx, [[cx, y0 + 2], [cx + half * 0.75, y0 + 2], [cx + half * 0.75, y1 - 38 * k], [cx, y1 - 6]], pal[1]);
      fill(ctx, [[cx - 3, y0 + 4], [cx + 3, y0 + 4], [cx + 3, y1 - 26], [cx, y1 - 10], [cx - 3, y1 - 26]], pal[0]);
    };
    return {
      w, h, n: 5, fps: 18, px: cx, py: tip,
      draw(ctx, i) {
        if (i <= 1) {
          blade(ctx, 96, tip, 1);
          inked(ctx, [[cx - 58, 78], [cx + 58, 78], [cx + 66, 96], [cx - 66, 96]], pal[2], pal[4], 4);
          fill(ctx, [[cx - 50, 82], [cx + 50, 82], [cx + 54, 88], [cx - 54, 88]], pal[0]);
          inked(ctx, [[cx - 9, 20], [cx + 9, 20], [cx + 9, 78], [cx - 9, 78]], pal[3], pal[4], 4);
          diamond(ctx, pal, cx, 14, 13, 1.1);
          if (i === 1) for (const [x, y] of [[cx - 36, 160], [cx + 34, 250], [cx - 30, 330]]) sparkle(ctx, pal, x, y, 12, 0.2);
          return;
        }
        const k = (i - 1) / 3;
        const R = rng(31);
        for (let j = 0; j < 7; j++) {
          const y = 40 + j * 46;
          const x = cx + (R() - 0.5) * 30 + (j % 2 ? 1 : -1) * k * 40;
          shard(ctx, pal, x, y - k * 30, -Math.PI / 2 + (R() - 0.5) * 1.2, 26 * (1.1 - k * 0.6), 7 * (1.1 - k * 0.6));
        }
        if (i < 4) for (let j = 0; j < 5; j++) diamond(ctx, pal, cx + (R() - 0.5) * 90, 80 + R() * 260 - k * 40, 6);
      },
    };
  })();

  // A cross of light (Grand Verdict's blow): a vertical blade of light and a horizontal one burst
  // out from the point together, banded, then thin and break into diamonds.
  E.lightcross = (() => {
    const pal = PAL.holy;
    const c = 160;
    const bar = (ctx, len, wid, vertical) => {
      const p = (x, y) => (vertical ? [c + y, c + x] : [c + x, c + y]);
      inked(ctx, [p(-len, 0), p(0, -wid), p(len, 0), p(0, wid)], pal[3], pal[4], 4);
      fill(ctx, [p(-len * 0.85, 0), p(0, -wid * 0.7), p(len * 0.85, 0), p(0, wid * 0.7)], pal[2]);
      fill(ctx, [p(-len * 0.7, 0), p(0, -wid * 0.42), p(len * 0.7, 0), p(0, wid * 0.42)], pal[1]);
      fill(ctx, [p(-len * 0.55, 0), p(0, -wid * 0.18), p(len * 0.55, 0), p(0, wid * 0.18)], pal[0]);
    };
    return {
      w: 320, h: 320, n: 6, fps: 18, px: c, py: c,
      draw(ctx, i) {
        const len = [90, 150, 155, 140, 0, 0][i];
        const wid = [10, 26, 22, 12, 0, 0][i];
        if (len) {
          bar(ctx, len, wid, false);
          bar(ctx, len, wid, true);
          if (i >= 1 && i <= 2) celRing(ctx, pal, c, c, i === 1 ? 46 : 70, 10, { seed: 14 });
        }
        if (i >= 3) {
          const R = rng(15);
          const k = (i - 3) / 2;
          for (let j = 0; j < 12; j++) {
            const a = (j / 12) * TAU;
            const d = 60 + k * 80 + R() * 20;
            diamond(ctx, pal, c + Math.cos(a) * d, c + Math.sin(a) * d - k * 30, 8 * (1.1 - k * 0.6));
          }
        }
      },
    };
  })();

  // Diamonds of light rising, looping (a Paladin's Faith building).
  E.motes = {
    w: 140, h: 180, n: 8, fps: 10, px: 70, py: 170, loop: true,
    draw(ctx, i) {
      const R = rng(17);
      for (let j = 0; j < 6; j++) {
        const life = (i / 8 + j / 6) % 1;
        const x = 70 + (R() - 0.5) * 90 + Math.sin(life * 6 + j) * 6;
        const y = 165 - life * 150;
        diamond(ctx, PAL.holy, x, y, 7 * Math.sin(life * Math.PI) + 1);
      }
    },
  };

  // ---------- The Warrior's steel ----------
  // A battle cry: zig-zag rings of sound bursting out with radial strokes, the rings breaking up.
  function shout(pal) {
    const c = 140;
    const zig = (ctx, r, th, broken, seed) => {
      const pts = [];
      const n = 28;
      for (let j = 0; j < n; j++) {
        const a = (j / n) * TAU;
        const rr = r + (j % 2 ? th : -th);
        pts.push([c + Math.cos(a) * rr, c + Math.sin(a) * rr]);
      }
      const R = rng(seed);
      ctx.lineJoin = 'miter';
      for (let j = 0; j < n; j++) {
        if (broken && R() < broken) continue;
        const [x0, y0] = pts[j];
        const [x1, y1] = pts[(j + 1) % n];
        for (const [w, colour] of [[9, pal[4]], [6, pal[2]], [2.5, pal[0]]]) {
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.strokeStyle = colour;
          ctx.lineWidth = w;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
      }
    };
    return {
      w: 280, h: 280, n: 6, fps: 20, px: c, py: c,
      draw(ctx, i) {
        const k = i / 5;
        zig(ctx, 40 + k * 90, 8 * (1 - k * 0.5), i > 2 ? (i - 2) * 0.22 : 0, 3);
        if (i > 0) zig(ctx, 22 + k * 70, 6 * (1 - k * 0.5), i > 3 ? (i - 3) * 0.3 : 0, 4);
        if (i < 4) {
          for (let j = 0; j < 10; j++) {
            const a = (j / 10) * TAU + 0.15;
            const r0 = 50 + k * 60;
            speedLine(ctx, pal, c + Math.cos(a) * r0, c + Math.sin(a) * r0, c + Math.cos(a) * (r0 + 40), c + Math.sin(a) * (r0 + 40), 3);
          }
        }
      },
    };
  }
  E.shout = shout(PAL.steel);
  E.shoutred = shout(PAL.rage);

  // A dash's streaks: a bundle of speed lines stretched out behind, thinning away.
  function streaks(pal) {
    return {
      w: 320, h: 90, n: 4, fps: 20, px: 160, py: 45,
      draw(ctx, i) {
        const R = rng(19);
        for (let j = 0; j < 7; j++) {
          const y = 10 + j * 11 + (R() - 0.5) * 4;
          const len = (140 + R() * 150) * (1 - i * 0.2);
          const x1 = 300 - R() * 30 - i * 30;
          speedLine(ctx, pal, x1 - len, y, x1, y, 4 * (1 - i * 0.2));
        }
      },
    };
  }
  E.streak = streaks(PAL.steel);
  E.streakred = streaks(PAL.rage);

  // Iron skin: plates of steel snap into a ring round the body, flash, then shatter outward.
  E.plates = (() => {
    const pal = PAL.steel;
    const c = 110;
    const plate = (ctx, x, y, a, s) => {
      const pts = [];
      for (let j = 0; j < 6; j++) {
        const t = a + (j * TAU) / 6;
        pts.push([x + Math.cos(t) * s, y + Math.sin(t) * s * 1.2]);
      }
      inked(ctx, pts, pal[3], pal[4], 3.5);
      fill(ctx, pts.map(([px, py]) => [lerp(x, px, 0.78), lerp(y, py, 0.78)]), pal[2]);
      fill(ctx, [[x - s * 0.5, y - s * 0.5], [x + s * 0.1, y - s * 0.7], [x - s * 0.2, y + s * 0.1]], pal[0]);
    };
    return {
      w: 220, h: 220, n: 7, fps: 18, px: c, py: c,
      draw(ctx, i) {
        const d = [96, 74, 56, 52, 60, 80, 98][i];
        const s = [10, 14, 16, 16, 14, 11, 7][i];
        for (let j = 0; j < 8; j++) {
          const a = (j / 8) * TAU + i * 0.12;
          plate(ctx, c + Math.cos(a) * d, c + Math.sin(a) * d, a, s);
        }
        if (i === 3) sparkle(ctx, pal, c, c, 34, 0.4);
      },
    };
  })();

  // Power gathering: lines of the path's light rushing in to a point that swells into a diamond.
  function charge(pal) {
    const c = 90;
    return {
      w: 180, h: 180, n: 6, fps: 18, px: c, py: c, loop: true,
      draw(ctx, i) {
        const R = rng(21 + i);
        for (let j = 0; j < 9; j++) {
          const a = (j / 9) * TAU + R() * 0.4;
          const r0 = 30 + R() * 20;
          const r1 = r0 + 30 + R() * 30;
          speedLine(ctx, pal, c + Math.cos(a) * r1, c + Math.sin(a) * r1, c + Math.cos(a) * r0, c + Math.sin(a) * r0, 3);
        }
        diamond(ctx, pal, c, c, 9 + (i % 3) * 3, 1.2);
      },
    };
  }
  E.charge = charge(PAL.steel);
  E.chargegold = charge(PAL.holy);
  E.chargered = charge(PAL.rage);

  window.FXART = E;
})();
