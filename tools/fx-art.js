/* Tengu's own effect art, in the game's own look (the style the player picked): soft pastel shapes
   drawn smooth, then matched to the characters' sprites (`match`): redrawn at the sprites' pixel
   size (one art pixel is two screen pixels, one game pixel), colours snapped to a 4-tone ramp of
   their own hue, and outlined the way the sprites are, in a darker shade of their own colour,
   lighter along top edges and darkest underneath. Every effect is a short run of key drawings: a
   shape pops in, holds for a beat, then breaks up into beads and the game's curvy sparkle stars
   (research/fx.md; docs/art/README.md).

   tools/draw-fx.cjs loads this in the browser and renders every effect's frames to PNGs, which
   tools/build-fx.py cuts into the game's strips. Each effect: { w, h, n, fps, px, py (the point
   that sits on the effect's position), loop?, swing? ([middle angle (rad), sweep direction
   (1 clockwise on screen), radius]), draw(ctx, i) }, drawn at about 3.2 times its size on screen. */
(function () {
  const TAU = Math.PI * 2;

  // Pastel ramps: [white, light, base, shade, line]. Shades lean violet, never grey (art bible).
  const PAL = {
    steel: ['#ffffff', '#e4f3ff', '#9fd2ff', '#6f9cf0', '#4f5fcc'],
    holy: ['#ffffff', '#fff6d0', '#ffdc78', '#ffad62', '#d9776a'],
    // The Berserker is demonic (the player's call): a white-hot ember core, ember orange, blood
    // crimson, deep blood, and an ink near black with violet in it. Dark tones mostly, so the glow
    // (which only blooms from bright parts) comes off as embers burning out of black and blood.
    rage: ['#fff0e2', '#ff7a4e', '#e01c3c', '#7c0a34', '#1e0618'],
    arcane: ['#ffffff', '#f1e6ff', '#cfa8ff', '#a374f0', '#6f4ac8'],
    ice: ['#ffffff', '#e2fbff', '#9ae9ff', '#5ab8ee', '#3a78c8'],
    fire: ['#ffffff', '#fff1c0', '#ffbe72', '#ff8a5c', '#cc566a'],
    wind: ['#ffffff', '#d2ffe9', '#5ee6a8', '#22b886', '#13706e'],
    sight: ['#ffffff', '#ffd6e2', '#ff8fae', '#f2577f', '#a8306a'],
    poison: ['#ffffff', '#f0ffd2', '#bdf08a', '#86cc5a', '#4f8a5a'],
    lightning: ['#ffffff', '#fffad2', '#ffeb7a', '#ffc25a', '#c9805a'],
    shadow: ['#ffffff', '#ebe0ff', '#b89cff', '#8a6ae8', '#5a3fb8'],
    // The Archer: warm gold (hawk) with sky blue beside it.
    hawk: ['#ffffff', '#fff1bc', '#ffc94a', '#f0942e', '#a8543a'],
    sky: ['#ffffff', '#dcf4ff', '#7fcfff', '#3f9cf0', '#2f5cb8'],
    // The Thief's moonlight: silver with violet in its shadows.
    moon: ['#ffffff', '#f2f0ff', '#d2cff0', '#a6a0d8', '#5a5296'],
    // The Assassin: crimson, and raven black.
    crimson: ['#ffffff', '#ffd2dc', '#ff5c7e', '#d42a52', '#6a1430'],
    raven: ['#ffffff', '#d8d8e0', '#5e5a6c', '#2e2a38', '#100c16'],
    // The Night Lord: deep indigo, and starlight gold.
    night: ['#ffffff', '#dfe2ff', '#8e96ff', '#5452d6', '#24206a'],
    starlight: ['#ffffff', '#fff6cc', '#ffe17a', '#f2b544', '#8a5a2a'],
    // The Mage: rose pink, and mint.
    bloom: ['#ffffff', '#ffe2ef', '#ffa6cc', '#f26aa4', '#a0386e'],
    mint: ['#ffffff', '#dcfff2', '#8ef0c8', '#40c898', '#1f7a6a'],
    // The Stormcaller: electric violet, inked in storm blue.
    storm: ['#ffffff', '#efe4ff', '#b48cff', '#7a5ce8', '#2a3394'],
  };
  const DUST = ['#ffffff', '#fff6ee', '#f2e2d6', '#d9bdc4', '#9a7a9a'];
  const ROCK = ['#ffffff', '#ece4ff', '#c8b8ec', '#9a88cc', '#6a5aa0'];

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
    const width = (u) => th * Math.pow(Math.sin(Math.PI * Math.pow(u, 1.5)), 0.6);
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
  // A bead: a small rounded drop stretched along `a` (what shapes break up into).
  function shard(ctx, pal, x, y, a, len, wid) {
    const [core, light, mid, , ink] = pal;
    const r = Math.max(1.5, wid * 1.3);
    const l = Math.max(r, len * 0.45);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.ellipse(0, 0, l + 1.5, r + 1.5, 0, 0, TAU);
    ctx.fillStyle = ink;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, 0, l, r, 0, 0, TAU);
    ctx.fillStyle = mid;
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-l * 0.2, -r * 0.25, l * 0.55, r * 0.5, 0, 0, TAU);
    ctx.fillStyle = light;
    ctx.fill();
    ctx.restore();
  }
  // The game's sparkle: a four-point star with curved sides.
  function sparkle(ctx, pal, x, y, r, rot = 0) {
    const [core, light, , , ink] = pal;
    const path = (rr) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.moveTo(0, -rr);
      ctx.quadraticCurveTo(0, 0, rr, 0);
      ctx.quadraticCurveTo(0, 0, 0, rr);
      ctx.quadraticCurveTo(0, 0, -rr, 0);
      ctx.quadraticCurveTo(0, 0, 0, -rr);
      ctx.restore();
    };
    path(r + 2);
    ctx.fillStyle = ink;
    ctx.fill();
    path(r);
    ctx.fillStyle = light;
    ctx.fill();
    path(r * 0.55);
    ctx.fillStyle = core;
    ctx.fill();
  }
  // A diamond (light and holy shapes are rounded or square, never spiky).
  function diamond(ctx, pal, x, y, r, tall = 1.4) {
    const [core, light, mid, , ink] = pal;
    inked(ctx, [[x, y - r * tall], [x + r, y], [x, y + r * tall], [x - r, y]], mid, ink, 2.5);
    fill(ctx, [[x, y - r * tall * 0.7], [x + r * 0.6, y], [x, y + r * tall * 0.7], [x - r * 0.6, y]], light);
    fill(ctx, [[x, y - r * tall * 0.4], [x + r * 0.28, y - r * 0.1], [x, y + r * tall * 0.2], [x - r * 0.28, y - r * 0.1]], core);
  }
  // A soft star burst: points joined by curves that dip toward the middle (rounded, cute; long and
  // short points alternate).
  function starburst(ctx, pal, x, y, r, spikes, seed, { inner = 0.38, tones = 4, rot = 0 } = {}) {
    const R = rng(seed);
    const lens = Array.from({ length: spikes }, (_, i) => (i % 2 ? 0.66 : 1) * (0.88 + R() * 0.12));
    const path = (k) => {
      ctx.beginPath();
      for (let i = 0; i <= spikes; i++) {
        const j = i % spikes;
        const a = rot + (j * TAU) / spikes;
        const px = x + Math.cos(a) * r * lens[j] * k;
        const py = y + Math.sin(a) * r * lens[j] * k;
        if (i === 0) ctx.moveTo(px, py);
        else {
          const b = rot + ((i - 0.5) * TAU) / spikes;
          ctx.quadraticCurveTo(x + Math.cos(b) * r * inner * 0.6 * k, y + Math.sin(b) * r * inner * 0.6 * k, px, py);
        }
      }
      ctx.closePath();
    };
    const [core, light, mid, deep, ink] = pal;
    path(1);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = ink;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = tones > 3 ? deep : mid;
    ctx.fill();
    if (tones > 3) {
      path(0.78);
      ctx.fillStyle = mid;
      ctx.fill();
    }
    path(0.55);
    ctx.fillStyle = light;
    ctx.fill();
    path(0.3);
    ctx.fillStyle = core;
    ctx.fill();
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
  // The Paladin's gold (the Warrior's Whirlwind, on a Paladin).
  E.spingold = spin(PAL.holy);
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
          starburst(ctx, ['#ffffff', '#ffe6f2', '#ffb8d8', '#ff8ec2', '#c4508e'], c, c, 110, 12, 50, { inner: 0.3 });
          for (let j = 0; j < 8; j++) {
            const a = (j / 8) * TAU + 0.2;
            speedLine(ctx, PAL.holy, c + Math.cos(a) * 20, c + Math.sin(a) * 20, c + Math.cos(a) * 115, c + Math.sin(a) * 115, 4);
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
  // Pillars and rings come in the colours the game asks for (warrior-fx.js `tint`): each path's
  // school, plus the rings for the Sniper's sight, the Mage's mint, the Ranger's sky and the
  // Night Lord's starlight.
  const PILLARS = ['steel', 'holy', 'rage', 'ice', 'wind', 'shadow', 'hawk', 'night', 'bloom', 'crimson', 'storm'];
  for (const s of PILLARS) E[s === 'steel' ? 'pillar' : `pillar${s}`] = pillar(PAL[s]);

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
  for (const s of [...PILLARS, 'sight', 'mint', 'sky', 'starlight']) E[s === 'steel' ? 'ring' : `ring${s}`] = ringBurst(PAL[s]);

  // ---------- The ground ----------
  // A heavy blow cracks the ground: a glowing fissure, then shards of rock burst up in a fan,
  // pale dust billows out from the foot and breaks apart while the rocks fall back.
  function quakeOf(ROCK) {
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
  }
  E.quake = quakeOf(ROCK);
  // The same rock in a Paladin's gold and a Berserker's blood red (their slams and dives).
  E.quakegold = quakeOf(PAL.holy);
  E.quakered = quakeOf(PAL.rage);

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
        PAL.fire = PAL.rage;
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
      ctx.fillStyle = PAL.rage[0];
      ctx.fill();
      ctx.beginPath();
      ctx.arc(c, c, 57, 0, TAU);
      ctx.fillStyle = '#120612';
      ctx.fill();
      celCrescent(ctx, ['#ff9a7a', '#c0283e', '#7c0a34', '#3a0a22', '#120612'], c, c, 50, -2.6, -0.6, 12);
    },
  };

  // ---------- The Berserker's demon (his Rage aura, see render/aura.js) ----------
  // A band along a run of points, `w0` thick at the start and `w1` at the end (limbs, horns).
  function tube(pts, w0, w1) {
    const left = [];
    const right = [];
    pts.forEach(([x, y], i) => {
      const [ax, ay] = pts[Math.max(0, i - 1)];
      const [bx, by] = pts[Math.min(pts.length - 1, i + 1)];
      const l = Math.hypot(bx - ax, by - ay) || 1;
      const w = lerp(w0, w1, i / (pts.length - 1)) / 2;
      left.push([x - ((by - ay) / l) * w, y + ((bx - ax) / l) * w]);
      right.push([x + ((by - ay) / l) * w, y - ((bx - ax) / l) * w]);
    });
    return left.concat(right.reverse());
  }
  // A curve through three points, sampled (for horns and claws).
  const curve = (a, b, c, n = 10) => Array.from({ length: n + 1 }, (_, i) => {
    const u = i / n;
    return [(1 - u) * (1 - u) * a[0] + 2 * u * (1 - u) * b[0] + u * u * c[0], (1 - u) * (1 - u) * a[1] + 2 * u * (1 - u) * b[1] + u * u * c[1]];
  });

  // A form's glow: a soft haze round the whole hero, hottest at the heart, with sparks drifting up
  // through it (the game swells and flashes it; render/scene.js). Feet anchored. `stops` are the
  // haze's colours from the heart out; `pal` the sparks'.
  function glowOf(stops, pal, seed) {
    return {
      w: 160, h: 210, n: 4, fps: 8, px: 80, py: 196, loop: true,
      draw(ctx, i) {
        const R = rng(seed + i);
        ctx.save();
        ctx.translate(80, 140);
        ctx.scale(1.1, 1.15);
        const g = ctx.createRadialGradient(0, 0, 4, 0, 0, 62);
        [0, 0.35, 0.7, 1].forEach((at, k) => g.addColorStop(at, stops[k]));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, 62, 0, TAU);
        ctx.fill();
        ctx.restore();
        for (let j = 0; j < 5; j++) shard(ctx, pal, 40 + R() * 80, 60 + ((R() * 120 + i * 18) % 120), -Math.PI / 2, 5 + R() * 4, 1.5);
      },
    };
  }
  // Demon Form's: blood red, embers. Judgment's: gold light, motes of light.
  E.demonglow = glowOf(['rgba(255, 122, 78, 0.75)', 'rgba(224, 28, 60, 0.5)', 'rgba(124, 10, 52, 0.22)', 'rgba(124, 10, 52, 0)'], PAL.rage, 400);
  E.holyglow = glowOf(['rgba(255, 255, 240, 0.8)', 'rgba(255, 220, 120, 0.55)', 'rgba(255, 173, 98, 0.22)', 'rgba(255, 173, 98, 0)'], PAL.holy, 420);

  // Black smoke curling up round a raging Berserker's feet, with embers rising through it.
  E.blacksmoke = {
    w: 170, h: 120, n: 6, fps: 10, px: 85, py: 112, loop: true,
    draw(ctx, i) {
      const [core, light, , deep, ink] = PAL.rage;
      const R = rng(41);
      for (let j = 0; j < 8; j++) {
        const life = ((i / 6) + j / 8) % 1;
        const x = 30 + R() * 110 + Math.sin(life * 5 + j) * 8;
        const y = 104 - life * 80;
        const r = (8 + R() * 10) * (0.6 + life * 0.7);
        ctx.globalAlpha = 1 - life * 0.75;
        ctx.beginPath();
        ctx.arc(x, y, r + 2.5, 0, TAU);
        ctx.fillStyle = ink;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, r, 0, TAU);
        ctx.fillStyle = '#2a0c22';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x - r * 0.3, y - r * 0.35, r * 0.45, 0, TAU);
        ctx.fillStyle = deep;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      for (let j = 0; j < 5; j++) {
        const life = ((i / 6) + j / 5 + 0.13) % 1;
        shard(ctx, [core, light, light, deep, ink], 40 + R() * 90, 100 - life * 95, -Math.PI / 2, 6 * (1 - life) + 2, 1.5);
      }
    },
  };

  // Cracks of ember light splitting the ground round a Berserker at full Rage, pulsing.
  E.ragecracks = {
    w: 300, h: 70, n: 4, fps: 8, px: 150, py: 35, loop: true,
    draw(ctx, i) {
      const [core, light, mid, , ink] = PAL.rage;
      const pulse = [0.7, 1, 0.85, 0.6][i];
      const R = rng(77);
      for (let j = 0; j < 9; j++) {
        const a = (j / 9) * TAU + R() * 0.3;
        const pts = [[150, 35]];
        let x = 150;
        let y = 35;
        const len = 70 + R() * 70;
        for (let k = 1; k <= 5; k++) {
          x = 150 + Math.cos(a) * (len * k) / 5 + (R() - 0.5) * 14;
          y = 35 + Math.sin(a) * (len * k) / 5 * 0.28 + (R() - 0.5) * 6;
          pts.push([x, y]);
        }
        inked(ctx, tube(pts, 9 * pulse, 1), mid, ink, 3);
        fill(ctx, tube(pts, 4.5 * pulse, 0.5), light);
        fill(ctx, tube(pts.slice(0, 3), 2 * pulse, 0.5), core);
      }
    },
  };

  // The Berserker's ground: three claw gashes torn into the earth where a heavy blow lands, seen
  // flat along the ground. Slits rip open into jagged pits glowing ember-hot inside, chips of rock
  // and embers spit up out of them, then they seal back into glowing seams that break into beads.
  // (The Paladin's ground is pillars of light and smooth rings; his is torn, never lit.)
  E.gash = (() => {
    const pal = PAL.rage;
    const [core, light, mid, deep, ink] = pal;
    const w = 300;
    const h = 150;
    const g = 110;
    const c = w / 2;
    const R = rng(91);
    // Three tears side by side like a claw's rake, slanting the way a downward blow drags.
    const tears = [-1, 0, 1].map((j) => ({ x: c + j * 30, y: g + j * 17, len: 190 - Math.abs(j) * 36, lean: 0.16, seed: 92 + j }));
    // Torn rock: dark and blood-tinted, so the chips read as broken earth, not bubbles.
    const CHIP = ['#fff0e2', '#b0727a', '#6e3446', '#40182a', '#1e0618'];
    // A jagged lens along a tear, `open` wide at its middle.
    const lens = (t, open, k = 1) => {
      const r = rng(t.seed);
      const n = 12;
      const top = [];
      const bot = [];
      for (let j = 0; j <= n; j++) {
        const u = j / n;
        const x = t.x - (t.len * k) / 2 + t.len * k * u;
        const y = t.y + (u - 0.5) * t.len * k * t.lean;
        const wd = Math.pow(Math.sin(Math.PI * u), 0.8) * open * (0.75 + r() * 0.5);
        top.push([x, y - wd * 0.55]);
        bot.push([x + (r() - 0.5) * 3, y + wd * 0.45]);
      }
      return top.concat(bot.reverse());
    };
    const chips = Array.from({ length: 10 }, (_, j) => ({ t: j % 3, u: 0.2 + R() * 0.6, a: -Math.PI / 2 + (R() - 0.5) * 1.3, sp: 22 + R() * 26, r: 5 + R() * 4 }));
    return {
      w, h, n: 8, fps: 20, px: c, py: g,
      draw(ctx, i) {
        const open = [3, 13, 16, 15, 12, 8, 4, 2][i];
        for (const t of tears) {
          if (i === 0) {
            // The rip: a white-hot slit flashing along the ground.
            fill(ctx, lens(t, 6, 0.8), light);
            fill(ctx, lens(t, 3, 0.8), core);
            continue;
          }
          inked(ctx, lens(t, open + 4), CHIP[2], ink, 3.5);
          fill(ctx, lens(t, open), '#2a0c22');
          if (i < 7) fill(ctx, lens(t, open * 0.55), deep);
          fill(ctx, lens(t, open * 0.32), mid);
          fill(ctx, lens(t, Math.max(1.5, open * 0.14)), i < 5 ? core : light);
        }
        if (i >= 1 && i < 7) {
          for (const ch of chips) {
            const t = tears[ch.t];
            const d = ch.sp * (i - 0.5);
            const x = t.x - t.len / 2 + t.len * ch.u + Math.cos(ch.a) * d;
            const y = t.y + (ch.u - 0.5) * t.len * t.lean + Math.sin(ch.a) * d + (i - 1) * (i - 1) * 5;
            if (ch.t === 1 || i < 4) shard(ctx, CHIP, x, y, ch.a, ch.r * 1.4, ch.r * (0.8 - i * 0.07));
            else shard(ctx, [core, light, mid, deep, ink], x, y - 10, -Math.PI / 2, 9 * (1.2 - i * 0.12), 2);
          }
        }
        if (i >= 6) {
          for (let j = 0; j < 7; j++) sparkle(ctx, pal, c - 100 + j * 33, g - 8 - (i - 5) * 10 - (j % 2) * 8, 6 - (i - 6) * 2, j * 0.4);
        }
      },
    };
  })();

  // Embers rising (the Berserker's power, in place of a pillar of light): sparks of fire torn off
  // and climbing on a hot wind, flicking side to side, burning out to beads as they go. Loops.
  E.embers = (() => {
    const pal = PAL.rage;
    const [core, light, mid, deep, ink] = pal;
    const R = rng(97);
    const sparks = Array.from({ length: 16 }, (_, j) => ({ x: 70 + (R() - 0.5) * 80, phase: j / 16 + R() * 0.05, len: 16 + R() * 14, sway: 6 + R() * 10, rate: 1 + Math.round(R()) }));
    return {
      w: 140, h: 240, n: 8, fps: 14, px: 70, py: 225, loop: true,
      draw(ctx, i) {
        const t = i / 8;
        for (const s of sparks) {
          const life = (t * s.rate + s.phase) % 1;
          const x = s.x + Math.sin(life * 7 + s.phase * 9) * s.sway * (0.3 + life);
          const y = 220 - life * 200;
          const k = 1 - life * 0.75;
          if (life < 0.8) {
            tongue(ctx, [core, light, mid, deep, ink], x, y, 4.5 * k + 1.5, s.len * k * 1.4, Math.cos(life * 7 + s.phase * 9) * 5);
          } else sparkle(ctx, pal, x, y, 6, s.phase * 3);
        }
      },
    };
  })();

  // The Berserker's shockwave (in place of a smooth ring): a ring of jagged teeth pointing out,
  // ripping out from the blow and splintering into shards. Drawn round; the game lays it flat.
  E.shockred = (() => {
    const pal = PAL.rage;
    const [core, light, mid, deep, ink] = pal;
    const c = 130;
    const R = rng(103);
    const teeth = Array.from({ length: 18 }, () => ({ len: 0.6 + R() * 0.7, wob: (R() - 0.5) * 0.12 }));
    return {
      w: 260, h: 260, n: 6, fps: 24, px: c, py: c,
      draw(ctx, i) {
        const r = [36, 66, 90, 104, 114, 120][i];
        const th = [16, 14, 11, 8, 5, 3][i];
        const tooth = [22, 26, 22, 16, 10, 6][i];
        const keep = (j) => i < 3 || (j * 7 + i) % 5 > i - 3;
        const n = teeth.length;
        for (let j = 0; j < n; j++) {
          if (!keep(j)) continue;
          const a0 = (j / n) * TAU + teeth[j].wob;
          const a1 = ((j + 1) / n) * TAU + teeth[(j + 1) % n].wob;
          const am = (a0 + a1) / 2;
          const tip = r + tooth * teeth[j].len;
          const seg = (k) => [
            [c + Math.cos(a0) * (r - th * k), c + Math.sin(a0) * (r - th * k)],
            [c + Math.cos(a0) * r, c + Math.sin(a0) * r],
            [c + Math.cos(am) * (r + (tip - r) * k), c + Math.sin(am) * (r + (tip - r) * k)],
            [c + Math.cos(a1) * r, c + Math.sin(a1) * r],
            [c + Math.cos(a1) * (r - th * k), c + Math.sin(a1) * (r - th * k)],
          ];
          inked(ctx, seg(1), deep, ink, 3.5);
          fill(ctx, seg(0.7), mid);
          fill(ctx, seg(0.4), light);
          if (i < 4) fill(ctx, seg(0.18), core);
        }
        if (i >= 3) {
          for (let j = 0; j < 9; j++) {
            const a = (j / 9) * TAU + 0.3;
            shard(ctx, pal, c + Math.cos(a) * (r + 18), c + Math.sin(a) * (r + 18), a, 10 - (i - 3) * 2, 2.6);
          }
        }
      },
    };
  })();

  // ---------- The Paladin's light ----------
  // A shield of light: one hexagon flashes up, the full honeycomb shield snaps out, a glint sweeps
  // across it, cracks run through it, then it shatters into flying plates.
  function shieldOf(pal) {
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
          if (i === 2) speedLine(ctx, pal, c - 70, c + 40, c + 60, c - 60, 5);
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
  }
  E.shield = shieldOf(PAL.holy);
  E.shieldsteel = shieldOf(PAL.steel);
  E.shieldred = shieldOf(PAL.rage);

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
  function swordOf(pal) {
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
  }
  E.sword = swordOf(PAL.holy);
  E.steelsword = swordOf(PAL.steel);

  // A cross of light (Grand Verdict's blow): a vertical blade of light and a horizontal one burst
  // out from the point together, banded, then thin and break into diamonds.
  function crossOf(pal) {
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
  }
  E.lightcross = crossOf(PAL.holy);
  E.steelcross = crossOf(PAL.steel);
  E.ragecross = crossOf(PAL.rage);

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
  E.shoutgold = shout(PAL.holy);

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
  E.streakgold = streaks(PAL.holy);

  // Iron skin: plates of steel snap into a ring round the body, flash, then shatter outward.
  function platesOf(pal) {
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
  }
  E.plates = platesOf(PAL.steel);
  E.platesgold = platesOf(PAL.holy);
  E.platesred = platesOf(PAL.rage);

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

  // ---------- Emblems (rising in a buff's pillar of light) ----------
  // A little badge: it pops in, holds, then breaks into sparkles. Holy is a shield with a cross,
  // steel two crossed swords, rage a flame.
  function emblem(pal, drawShape) {
    const c = 80;
    return {
      w: 160, h: 160, n: 5, fps: 12, px: c, py: c,
      draw(ctx, i) {
        if (i < 3) {
          ctx.save();
          ctx.translate(c, c);
          ctx.scale(i === 0 ? 0.75 : 1, i === 0 ? 0.75 : 1);
          drawShape(ctx, pal);
          ctx.restore();
          return;
        }
        const k = (i - 2) / 2;
        for (let j = 0; j < 6; j++) {
          const a = (j / 6) * TAU + 0.4;
          sparkle(ctx, pal, c + Math.cos(a) * (20 + k * 30), c + Math.sin(a) * (20 + k * 30) - k * 16, 12 * (1.1 - k * 0.5));
        }
      },
    };
  }
  const badge = (ctx, pal, pts) => {
    inked(ctx, pts, pal[2], pal[4], 6);
    fill(ctx, pts.map(([x, y]) => [x * 0.72, y * 0.72 - 3]), pal[1]);
  };
  E.embholy = emblem(PAL.holy, (ctx, pal) => {
    badge(ctx, pal, [[-46, -52], [46, -52], [46, 8], [0, 58], [-46, 8]]);
    fill(ctx, [[-9, -40], [9, -40], [9, -18], [30, -18], [30, 0], [9, 0], [9, 34], [-9, 34], [-9, 0], [-30, 0], [-30, -18], [-9, -18]], pal[0]);
  });
  E.embsteel = emblem(PAL.steel, (ctx, pal) => {
    for (const s of [-1, 1]) {
      ctx.save();
      ctx.rotate(s * 0.75);
      inked(ctx, [[-9, -62], [0, -74], [9, -62], [9, 30], [-9, 30]], pal[1], pal[4], 6);
      fill(ctx, [[-3, -60], [0, -66], [3, -60], [3, 26], [-3, 26]], pal[0]);
      inked(ctx, [[-26, 30], [26, 30], [26, 42], [-26, 42]], pal[2], pal[4], 5);
      inked(ctx, [[-7, 42], [7, 42], [7, 68], [-7, 68]], pal[3], pal[4], 5);
      ctx.restore();
    }
  });
  E.embrage = emblem(PAL.rage, (ctx, pal) => {
    tongue(ctx, pal, 0, 44, 40, 110, 10);
  });

  // ---------- The Ranger's wind ----------
  const LEAF = ['#ffffff', '#e2ffc8', '#9de86a', '#5cba4a', '#2f7a46'];
  // A leaf: a pointed oval with a centre vein, turned to `a`.
  function leaf(ctx, x, y, r, a) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    const shape = (k) => {
      ctx.beginPath();
      ctx.moveTo(-r * k, 0);
      ctx.quadraticCurveTo(0, -r * 0.75 * k, r * k, 0);
      ctx.quadraticCurveTo(0, r * 0.75 * k, -r * k, 0);
    };
    shape(1.2);
    ctx.fillStyle = LEAF[4];
    ctx.fill();
    shape(1);
    ctx.fillStyle = LEAF[2];
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-r * 0.7, -1);
    ctx.quadraticCurveTo(0, -r * 0.5, r * 0.7, -1);
    ctx.lineTo(-r * 0.7, -1);
    ctx.fillStyle = LEAF[1];
    ctx.fill();
    ctx.strokeStyle = LEAF[3];
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.9, 0);
    ctx.lineTo(r * 0.8, 0);
    ctx.stroke();
    ctx.restore();
  }
  // A curl of wind: a crescent that hooks round into a spiral at its head.
  function curl(ctx, pal, cx, cy, R, a0, sweep, th) {
    celCrescent(ctx, pal, cx, cy, R, a0, a0 + sweep, th);
    celCrescent(ctx, pal, cx + Math.cos(a0 + sweep) * R * 0.55, cy + Math.sin(a0 + sweep) * R * 0.55, R * 0.45, a0 + sweep, a0 + sweep + 3.4, th * 0.6);
  }
  // Wind spinning, looping: two curls chasing round, drawn side on (the game squashes it flat).
  E.windspin = {
    w: 200, h: 200, n: 6, fps: 18, px: 100, py: 100, loop: true,
    draw(ctx, i) {
      const t = (i / 6) * TAU;
      curl(ctx, PAL.wind, 100, 100, 74, t, 1.7, 22);
      curl(ctx, PAL.wind, 100, 100, 60, t + Math.PI, 1.5, 18);
    },
  };
  // A gust: leaves tumbling along on a swoosh of wind, blown out of shape as they go.
  E.leaves = {
    w: 260, h: 160, n: 7, fps: 16, px: 70, py: 80,
    draw(ctx, i) {
      const k = i / 6;
      if (i < 4) celCrescent(ctx, PAL.wind, 110 + k * 40, 210, 150, -2.3 + k * 0.3, -1.3 + k * 0.3, 18 * (1 - k * 0.6));
      const R = rng(71);
      for (let j = 0; j < 7; j++) {
        const x = 40 + j * 22 + k * (60 + R() * 60);
        const y = 80 + Math.sin(j * 1.7 + k * 6) * 26 - k * R() * 30;
        if (i < 6 || j % 2) leaf(ctx, x, y, 12 * (1 - k * 0.35), j + k * 9 * (j % 2 ? 1 : -1));
      }
    },
  };
  // A Ranger's arrow landing: a curl of wind cuts across the target, leaves burst off it, and
  // the curl unwinds into beads.
  E.windhit = {
    w: 220, h: 200, n: 6, fps: 24, px: 110, py: 100,
    draw(ctx, i) {
      const c = 110;
      if (i === 0) return starburst(ctx, PAL.wind, c, 100, 30, 8, 72, { inner: 0.5, tones: 3 });
      if (i <= 2) {
        curl(ctx, PAL.wind, c - 10, 120, 62, -2.6, 2.3, i === 1 ? 26 : 30);
        starburst(ctx, PAL.wind, c, 100, i === 1 ? 50 : 40, 8, 72, { inner: 0.45 });
      }
      const k = (i - 1) / 4;
      const R = rng(73);
      for (let j = 0; j < 6; j++) {
        const a = (j / 6) * TAU + R() * 0.5;
        const d = 30 + k * 60;
        if (i < 5 || j % 2) leaf(ctx, c + Math.cos(a) * d, 100 + Math.sin(a) * d * 0.8, 11 * (1.1 - k * 0.4), a + k * 4);
      }
      if (i >= 3) for (let j = 0; j < 5; j++) shard(ctx, PAL.wind, c - 40 + j * 22, 70 - k * 20 + (j % 2) * 18, 0.3, 8, 3 * (1.2 - k * 0.5));
    },
  };
  // A wind spirit: a little round wind orb with a curly tail, bobbing (looping).
  E.wisp = {
    w: 160, h: 120, n: 4, fps: 12, px: 110, py: 60, loop: true,
    draw(ctx, i) {
      const bob = Math.sin((i / 4) * TAU) * 4;
      curl(ctx, PAL.wind, 70, 70 + bob, 34, Math.PI * 0.6 + i * 0.2, 2.2, 14);
      ctx.beginPath();
      ctx.arc(110, 60 + bob, 26, 0, TAU);
      ctx.fillStyle = PAL.wind[4];
      ctx.fill();
      ctx.beginPath();
      ctx.arc(110, 60 + bob, 22, 0, TAU);
      ctx.fillStyle = PAL.wind[2];
      ctx.fill();
      ctx.beginPath();
      ctx.arc(106, 55 + bob, 15, 0, TAU);
      ctx.fillStyle = PAL.wind[1];
      ctx.fill();
      ctx.beginPath();
      ctx.arc(101, 50 + bob, 6, 0, TAU);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    },
  };
  // A tornado, looping: bands of wind stacked into a funnel (narrow at the foot), each turning on
  // its own phase and swaying, leaves caught up in it.
  E.tornado = {
    w: 260, h: 320, n: 6, fps: 16, px: 130, py: 305, loop: true,
    draw(ctx, i) {
      const t = (i / 6) * TAU;
      for (let b = 0; b < 7; b++) {
        const k = b / 6;
        const y = 290 - k * 250;
        const rx = 22 + k * 95;
        const sway = Math.sin(t + k * 3) * 10 * k;
        ctx.save();
        ctx.translate(130 + sway, y);
        ctx.scale(1, 0.32);
        celCrescent(ctx, PAL.wind, 0, 0, rx, t * (b % 2 ? -1 : 1) + b, t * (b % 2 ? -1 : 1) + b + 4.2, 16 + k * 10);
        ctx.restore();
      }
      const R = rng(74);
      for (let j = 0; j < 5; j++) {
        const k = ((i / 6) + j / 5) % 1;
        leaf(ctx, 130 + Math.cos(t * 2 + j * 1.3) * (20 + k * 80), 280 - k * 230, 11, t * 3 + j);
      }
      void R;
    },
  };

  // ---------- The Sniper's bolts, frost and blasts ----------
  // A bolt tearing through: a long lens of light along the shot, a ring, beads thrown forward
  // (drawn flying to the right).
  const boltBurst = (pal) => ({
    w: 240, h: 160, n: 6, fps: 26, px: 110, py: 80,
    draw(ctx, i) {
      const c = 80;
      if (i === 0) return starburst(ctx, pal, 110, c, 26, 8, 81, { inner: 0.5, tones: 3 });
      const len = [0, 110, 116, 90, 50, 0][i];
      const wid = [0, 16, 12, 8, 5, 0][i];
      if (len) {
        inked(ctx, [[110 - len * 0.6, c], [110, c - wid], [110 + len, c], [110, c + wid]], pal[3], pal[4], 4);
        fill(ctx, [[110 - len * 0.5, c], [110, c - wid * 0.6], [110 + len * 0.9, c], [110, c + wid * 0.6]], pal[1]);
        fill(ctx, [[110 - len * 0.3, c], [110, c - wid * 0.25], [110 + len * 0.75, c], [110, c + wid * 0.25]], pal[0]);
      }
      if (i === 1 || i === 2) {
        ctx.save();
        ctx.translate(110, c);
        ctx.scale(0.45, 1);
        celRing(ctx, pal, 0, 0, i === 1 ? 34 : 46, 9, { seed: 82 });
        ctx.restore();
      }
      if (i >= 2) {
        const k = (i - 2) / 3;
        const R = rng(83);
        for (let j = 0; j < 6; j++) shard(ctx, pal, 130 + k * 80 + R() * 30, c + (R() - 0.5) * 60 * (0.4 + k), 0, 10 * (1.1 - k * 0.5), 3 * (1.1 - k * 0.5));
      }
    },
  });
  E.boltburst = boltBurst(PAL.ice);
  // A bolt leaving the crossbow: a small forward burst and speed lines.
  const boltSpark = (pal) => ({
    w: 140, h: 100, n: 4, fps: 24, px: 30, py: 50,
    draw(ctx, i) {
      const k = i / 3;
      if (i < 2) starburst(ctx, pal, 40, 50, i ? 30 : 20, 7, 84, { inner: 0.45, tones: 3 });
      for (const dy of [-16, 0, 16]) speedLine(ctx, pal, 40 + k * 30, 50 + dy * (1 + k * 0.4), 100 + k * 34, 50 + dy * (1 + k * 0.6), 3 * (1 - k * 0.5));
    },
  });
  E.boltspark = boltSpark(PAL.ice);

  // ---------- The Stormcaller's lightning ----------
  // A jagged lightning line from (x0, y0) to (x1, y1), `w` thick, in cel bands: ink, deep, the
  // colour, light, and a white-hot core. `kink` is how far it zigzags off the straight line.
  function zig(x0, y0, x1, y1, n, kink, seed) {
    const R = rng(seed);
    const pts = [[x0, y0]];
    const nx = -(y1 - y0);
    const ny = x1 - x0;
    const l = Math.hypot(nx, ny) || 1;
    for (let i = 1; i < n; i++) {
      const u = i / n;
      const off = (R() - 0.5) * 2 * kink * (i % 2 ? 1 : -0.6);
      pts.push([lerp(x0, x1, u) + (nx / l) * off, lerp(y0, y1, u) + (ny / l) * off]);
    }
    pts.push([x1, y1]);
    return pts;
  }
  function bolt(ctx, pal, pts, w) {
    const [core, light, mid, deep, ink] = pal;
    const line = (width, colour) => {
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.lineJoin = 'miter';
      ctx.miterLimit = 3;
      ctx.lineCap = 'round';
      ctx.strokeStyle = colour;
      ctx.lineWidth = width;
      ctx.stroke();
    };
    line(w + 5, ink);
    line(w, deep);
    line(w * 0.72, mid);
    line(w * 0.45, light);
    if (w > 3) line(Math.max(1.5, w * 0.2), core);
  }
  // A forked bolt: the trunk, and branches split off it at a few kinks.
  function forked(ctx, pal, x0, y0, x1, y1, w, seed, branches = 3) {
    const trunk = zig(x0, y0, x1, y1, 9, 22, seed);
    const R = rng(seed + 7);
    for (let b = 0; b < branches; b++) {
      const [bx, by] = trunk[2 + Math.floor(R() * (trunk.length - 4))];
      const side = R() < 0.5 ? -1 : 1;
      const len = 40 + R() * 60;
      bolt(ctx, pal, zig(bx, by, bx + side * len * 0.8, by + len * 0.7, 4, 9, seed + b * 3), w * 0.45);
    }
    bolt(ctx, pal, trunk, w);
  }
  // ---------- Crackle (the Stormcaller's lightning, the player's pick of three styles) ----------
  // Real lightning is a thin, fractal, glowing thread that flickers: every drawing is a fresh
  // channel (midpoint displacement: kinks at every scale), drawn as plasma, a wide faint violet
  // halo, a violet body and a thin white-hot core, with no ink line (light has no outline). Two or
  // three strands twist round each other, so it crackles instead of standing still.
  function fractal(x0, y0, x1, y1, R, rough = 0.3, depth = 6) {
    let pts = [[x0, y0], [x1, y1]];
    for (let d = 0; d < depth; d++) {
      const out = [pts[0]];
      for (let k = 1; k < pts.length; k++) {
        const [ax, ay] = pts[k - 1];
        const [bx, by] = pts[k];
        const len = Math.hypot(bx - ax, by - ay) || 1;
        const off = (R() - 0.5) * len * rough;
        out.push([(ax + bx) / 2 - ((by - ay) / len) * off, (ay + by) / 2 + ((bx - ax) / len) * off], [bx, by]);
      }
      pts = out;
    }
    return pts;
  }
  function strokePts(ctx, pts, width, colour, alpha) {
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.beginPath();
    pts.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = colour;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.restore();
  }
  function plasma(ctx, pts, w, a = 1, pal = PAL.storm) {
    const [core, light, mid, deep] = pal;
    strokePts(ctx, pts, w * 7, deep, 0.2 * a);
    strokePts(ctx, pts, w * 3.4, mid, 0.6 * a);
    strokePts(ctx, pts, w * 1.6, light, 0.95 * a);
    strokePts(ctx, pts, Math.max(1, w * 0.7), core, a);
  }
  // A crackle of `strands` twisting from (x0, y0) to (x1, y1); `seed` picks the drawing's channel.
  function crackle(ctx, x0, y0, x1, y1, seed, { w = 2.4, strands = 3, a = 1, rough = 0.28, depth, wander = 20 } = {}) {
    const len = Math.hypot(x1 - x0, y1 - y0);
    const dep = depth ?? Math.max(3, Math.min(7, Math.round(Math.log2(len / 4))));
    for (let k = 0; k < strands; k++) {
      const R = rng(seed * 7 + k);
      const jx = k ? (R() - 0.5) * wander : 0;
      plasma(ctx, fractal(x0 + jx, y0, x1 + (k ? (R() - 0.5) * wander * 0.3 : 0), y1, R, rough, dep), k ? w * 0.5 : w, a * (k ? 0.7 : 1));
    }
  }
  // A soft flash of storm light flat on the ground (or round a hit when `round`).
  function flash(ctx, x, y, r, a, round = false) {
    const [core, light, mid, deep] = PAL.storm;
    for (const [k, c, al] of [[1, deep, 0.2], [0.6, mid, 0.45], [0.3, light, 0.9], [0.12, core, 1]]) {
      ctx.save();
      ctx.globalAlpha *= al * a;
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(x, y, r * k * (round ? 1 : 1.6), r * k * (round ? 1 : 0.45), 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }
  // Arcs crawling out over the ground from (x, y), `n` of them up to `r` out.
  function groundArcs(ctx, x, y, r, n, seed, a) {
    const R = rng(seed);
    for (let j = 0; j < n; j++) {
      const side = j % 2 ? 1 : -1;
      plasma(ctx, fractal(x, y - 2, x + side * (r * 0.4 + R() * r * 0.6), y - 4 + (R() - 0.5) * 16, R, 0.5, 4), 1, a * 0.8);
    }
  }
  // Her ring and her pillar in Crackle too (they replace the smooth inked ones every other school
  // keeps, so a buff, a heavy hit and her gauge all crackle). The ring: lightning racing out over
  // the ground in short crackling arcs round a soft flash, a fresh set each drawing, thinning and
  // breaking up as it spreads. Drawn round; the game lays it flat.
  E.ringstorm = {
    w: 260, h: 260, n: 6, fps: 24, px: 130, py: 130,
    draw(ctx, i) {
      const c = 130;
      const r = [40, 70, 92, 106, 116, 122][i];
      const a = [1, 1, 0.85, 0.6, 0.4, 0.2][i];
      flash(ctx, c, c, [40, 50, 40, 26, 14, 6][i], a, true);
      const R = rng(500 + i);
      const n = 14;
      for (let j = 0; j < n; j++) {
        if ((j * 5 + i) % 7 < i - 1) continue;
        const a0 = (j / n) * TAU + R() * 0.2;
        const a1 = a0 + (TAU / n) * (0.8 + R() * 0.5);
        plasma(ctx, fractal(c + Math.cos(a0) * r, c + Math.sin(a0) * r, c + Math.cos(a1) * r, c + Math.sin(a1) * r, R, 0.5, 4), 2.2 - i * 0.25, a);
        if (j % 3 === 0 && i < 4) plasma(ctx, fractal(c + Math.cos(a0) * r * 0.4, c + Math.sin(a0) * r * 0.4, c + Math.cos(a0) * r, c + Math.sin(a0) * r, R, 0.5, 3), 1.2, a * 0.7);
      }
    },
  };
  // The pillar (her buff going up): strands of lightning crackling up from her feet in a column, a
  // flash on the ground, arcs snapping off its sides, fizzling out from the top down.
  E.pillarstorm = {
    w: 150, h: 330, n: 8, fps: 20, px: 75, py: 318,
    draw(ctx, i) {
      const g = 318;
      const top = [250, 30, 12, 12, 24, 60, 110, 170][i];
      const a = [0.7, 1, 1, 0.9, 0.8, 0.6, 0.4, 0.2][i];
      ctx.save();
      ctx.translate(75, g);
      ctx.scale(1, 0.35);
      flash(ctx, 0, 0, [20, 42, 36, 30, 24, 18, 12, 6][i], a, true);
      ctx.restore();
      for (let k = 0; k < 4; k++) {
        const R = rng(520 + i * 7 + k);
        plasma(ctx, fractal(75 + (k - 1.5) * 12 + (R() - 0.5) * 8, g, 75 + (R() - 0.5) * 30, top + R() * 20, R, 0.22, 6), k === 1 ? 2.4 : 1.3, a * (k === 1 ? 1 : 0.75));
      }
      if (i >= 2) {
        const R = rng(540 + i);
        for (let j = 0; j < 3; j++) {
          const y = top + 40 + R() * (260 - top);
          const side = j % 2 ? 1 : -1;
          plasma(ctx, fractal(75, y, 75 + side * (24 + R() * 30), y - 10 - R() * 30, R, 0.5, 3), 1.1, a * 0.8);
        }
      }
    },
  };
  // A bolt of lightning striking down from the sky: a strand feels its way down, then the bolt
  // strikes in twisting strands, flickering out and striking again with arcs crawling over the
  // ground, then dies away.
  E.zapstrike = {
    w: 220, h: 460, n: 8, fps: 24, px: 110, py: 430,
    draw(ctx, i) {
      const gx = 110;
      const gy = 430;
      const a = [0.5, 1, 0.9, 0.4, 1, 0.7, 0.35, 0.15][i];
      crackle(ctx, gx + 26, 0, gx, gy, 320 + i * 7, { strands: i === 0 ? 1 : 3, a, w: 2.4 });
      if (i >= 1) {
        groundArcs(ctx, gx, gy, 80, 4, 330 + i, a);
        flash(ctx, gx, gy, 28 * a, a);
      }
    },
  };
  // A bolt crackling into a monster: a flash of storm light, and arcs of lightning crackling off
  // it every way, a fresh set each drawing, shrinking away to sparks.
  E.stormhit = {
    w: 200, h: 200, n: 6, fps: 26, px: 100, py: 100,
    draw(ctx, i) {
      const c = 100;
      const a = [1, 1, 0.85, 0.6, 0.4, 0.2][i];
      flash(ctx, c, c, [26, 34, 24, 14, 8, 4][i], a, true);
      const R = rng(400 + i);
      for (let j = 0; j < 6; j++) {
        const ang = (j / 6) * TAU + R() * 0.8;
        const r1 = [44, 62, 66, 56, 44, 30][i] * (0.7 + R() * 0.4);
        const r0 = [0, 4, 14, 24, 30, 26][i];
        if ((j + i) % 4 !== 3) crackle(ctx, c + Math.cos(ang) * r0, c + Math.sin(ang) * r0, c + Math.cos(ang) * r1, c + Math.sin(ang) * r1, 401 + i * 9 + j, { strands: 1, w: 1.8 - i * 0.2, a, rough: 0.45 });
      }
    },
  };
  // A bolt leaving the crossbow, crackling: a flash at the string and short arcs of lightning
  // snapping out ahead of it (drawn flying to the right).
  E.stormspark = {
    w: 140, h: 100, n: 4, fps: 24, px: 30, py: 50,
    draw(ctx, i) {
      const a = [1, 0.9, 0.55, 0.25][i];
      flash(ctx, 40, 50, [16, 20, 12, 6][i], a, true);
      for (let j = 0; j < 3; j++) crackle(ctx, 40, 50, 92 + i * 10 + j * 6, 50 + (j - 1) * (16 + i * 6), 420 + i * 5 + j, { strands: 1, w: 1.4, a, rough: 0.5 });
    },
  };
  // A thunderbolt tearing through: strands of lightning wrapped round the line of the shot, a
  // flash where it passes and arcs flung out ahead (drawn flying to the right).
  E.stormpierce = {
    w: 240, h: 160, n: 6, fps: 26, px: 110, py: 80,
    draw(ctx, i) {
      const c = 80;
      const a = [0.8, 1, 0.9, 0.6, 0.35, 0.15][i];
      const len = [40, 110, 118, 96, 70, 50][i];
      flash(ctx, 110, c, [18, 26, 20, 12, 8, 4][i], a, true);
      crackle(ctx, 110 - len * 0.5, c, 110 + len, c, 430 + i * 6, { strands: 3, w: 2, a, wander: 14 });
      if (i >= 1) {
        const R = rng(440 + i);
        for (let j = 0; j < 3; j++) crackle(ctx, 110 + len * 0.4, c, 110 + len * 0.7 + R() * 30, c + (R() - 0.5) * 60, 441 + i * 4 + j, { strands: 1, w: 1, a: a * 0.8, rough: 0.5 });
      }
    },
  };
  // A storm cloud, looping (the player's pick of four: "Billowing"): a heavy cloud of churning
  // billows with detail at every scale (cauliflower, not round balls), soft and smoky where it
  // thins out, no outline. It is a density field: unions of ellipses for its mass, warped by
  // noise so the outline is organic, its edge torn soft by more noise; lit from above (the top
  // catches the light, the belly is dark, ridged noise gives the billows relief), it churns slowly
  // and loops, and lightning lights it up from inside now and then (Eye of the Storm, Thunderhead's
  // sky).
  const NR = rng(77);
  const PERM = Array.from({ length: 512 }, () => NR());
  const hash = (x, y) => PERM[((x * 73856093) ^ (y * 19349663)) & 511];
  function noise(x, y) {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const u = (x - xi) * (x - xi) * (3 - 2 * (x - xi));
    const v = (y - yi) * (y - yi) * (3 - 2 * (y - yi));
    const a = hash(xi, yi);
    const b = hash(xi + 1, yi);
    const c = hash(xi, yi + 1);
    const d = hash(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y, oct = 5, ridged = false) {
    let sum = 0;
    let amp = 0.5;
    let f = 1;
    for (let o = 0; o < oct; o++) {
      let n = noise(x * f, y * f);
      if (ridged) n = 1 - Math.abs(n * 2 - 1);
      sum += n * amp;
      amp *= 0.5;
      f *= 2.03;
    }
    return sum;
  }
  const sstep = (a, b, x) => {
    const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  const rgb = (h) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16));
  const mixc = (a, b, t) => a.map((v, k) => v + (b[k] - v) * t);
  const CLOUD = { under: rgb('#1c183c'), mid: rgb('#46417c'), top: rgb('#a29ed6'), lit: rgb('#f4ecff') };
  // Paints a cloud over (x0, y0, w, h) from `field(x, y)` (about 1 deep inside, 0 at its edge, below
  // 0 outside), churned by `turn` (radians, round a loop); `flash` is [x, y, r, strength] of
  // lightning lighting it from inside.
  function cloud(ctx, x0, y0, w, h, field, turn, { scale = 26, tear = 0.6, flash = null } = {}) {
    const S = 2;
    const cw = Math.ceil(w / S);
    const ch = Math.ceil(h / S);
    const cv = document.createElement('canvas');
    cv.width = cw;
    cv.height = ch;
    const g = cv.getContext('2d');
    const img = g.createImageData(cw, ch);
    const ox = Math.cos(turn) * 0.35;
    const oy = Math.sin(turn) * 0.35;
    const val = (X, Y) => {
      const wx = (fbm(X / 60 + 3 + ox, Y / 60 + oy, 3) - 0.5) * 40;
      const wy = (fbm(X / 60 + 11 - oy, Y / 60 + 7 + ox, 3) - 0.5) * 30;
      const edge = Math.min(sstep(0, 46, X), sstep(w, w - 46, X), sstep(0, 26, Y), sstep(h, h - 30, Y));
      return (field(X + wx, Y + wy) + (fbm((X + wx) / scale + ox, (Y + wy) / scale + oy, 5) - 0.5) * tear * 2) * edge - (1 - edge) * 0.3;
    };
    for (let y = 0; y < ch; y++) {
      for (let x = 0; x < cw; x++) {
        const X = x * S;
        const Y = y * S;
        const v = val(X, Y);
        if (v <= 0) continue;
        // The more cloud above a point, the deeper in its shade.
        const shade = Math.max(0, Math.min(1, (val(X, Y - 14) + val(X - 6, Y - 28)) * 0.5));
        const relief = (fbm(X / 18 + ox, Y / 18 + oy, 3, true) - 0.5) * 0.35;
        const k = Math.max(0, Math.min(1, 0.9 - shade * 0.8 + relief - Math.max(0, v - 0.6) * 0.3));
        let c = k < 0.5 ? mixc(CLOUD.under, CLOUD.mid, k * 2) : mixc(CLOUD.mid, CLOUD.top, (k - 0.5) * 2);
        if (flash) {
          const fd = Math.hypot(X - flash[0], (Y - flash[1]) * 1.4);
          c = mixc(c, CLOUD.lit, Math.min(0.95, Math.max(0, 1 - fd / flash[2]) ** 1.5 * flash[3] * Math.min(1, v * 2) * 1.3));
        }
        const o = (y * cw + x) * 4;
        img.data[o] = c[0];
        img.data[o + 1] = c[1];
        img.data[o + 2] = c[2];
        img.data[o + 3] = sstep(0, 0.45, v) * 255;
      }
    }
    g.putImageData(img, 0, 0);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(cv, x0, y0, cw * S, ch * S);
    ctx.restore();
  }
  const ell = (x, y, cx, cy, rx, ry) => 1 - Math.hypot((x - cx) / rx, (y - cy) / ry);
  E.stormcloud = {
    w: 320, h: 200, n: 8, fps: 8, px: 160, py: 100, loop: true,
    draw(ctx, i) {
      const lit = i === 2 || i === 5;
      const fx = i === 2 ? 130 : 200;
      cloud(ctx, 0, 0, 320, 200, (x, y) => Math.max(ell(x, y, 160, 104, 140, 44), ell(x, y, 115, 78, 62, 46), ell(x, y, 185, 70, 70, 52), ell(x, y, 240, 96, 50, 34)) * sstep(146, 128, y), (i / 8) * TAU, { flash: lit ? [fx, 100, 100, 1] : null });
      if (lit) {
        const R = rng(640 + i);
        plasma(ctx, fractal(fx, 128, fx + (R() - 0.5) * 60, 200, R, 0.3, 6), 1.8, 1);
        plasma(ctx, fractal(fx - 70, 122, fx + 60, 132, R, 0.4, 5), 1, 0.7);
      }
    },
  };
  // ---------- The archer paths' blast arrows and buff emblems ----------
  // The Beastmaster's blast arrow: a gale bursting out of the arrow, a star of green wind with
  // curls of wind flung out every way and a spray of leaves, which whirl off and break into beads.
  // (The Archer's own is a burst of fire; each path's says whose shot it was.)
  E.galeblast = {
    w: 260, h: 240, n: 7, fps: 20, px: 130, py: 130,
    draw(ctx, i) {
      const c = 130;
      const R = rng(141);
      if (i === 0) return starburst(ctx, PAL.wind, c, c, 34, 8, 142, { inner: 0.5, tones: 3 });
      const k = (i - 1) / 5;
      for (let j = 0; j < 4; j++) {
        const a = (j / 4) * TAU + 0.5 + k * 1.2;
        if (i < 6) curl(ctx, PAL.wind, c + Math.cos(a) * (24 + k * 50), c + Math.sin(a) * (20 + k * 40), 30 + k * 16, a + 1.2, 2.2, 16 * (1.1 - k * 0.7));
      }
      if (i < 4) starburst(ctx, PAL.wind, c, c, 50 - i * 8, 8, 142, { inner: 0.42, rot: i * 0.2 });
      for (let j = 0; j < 10; j++) {
        const a = R() * TAU;
        const d = 30 + (i - 0.5) * (14 + R() * 12);
        leaf(ctx, c + Math.cos(a) * d, c + Math.sin(a) * d * 0.8 + k * k * 30, 15 * (1.1 - k * 0.5), a + i * 0.9);
      }
      if (i >= 5) for (let j = 0; j < 6; j++) sparkle(ctx, PAL.wind, c + Math.cos(j) * 70, c + Math.sin(j * 1.7) * 50, 8 - (i - 5) * 3, j);
    },
  };

  // The Stormcaller's blast bolt: a thunderclap. A violet flash, a swell of thundercloud, strands
  // of lightning crackling out every way from it, then the cloud tears apart into sparks.
  E.thunderblast = {
    w: 300, h: 280, n: 7, fps: 22, px: 150, py: 150,
    draw(ctx, i) {
      const c = 150;
      if (i === 0) return flash(ctx, c, c, 34, 1, true);
      const k = (i - 1) / 5;
      const R = rng(152);
      // A swell of storm cloud (soft, like her storm cloud) bursting out and tearing apart.
      if (i < 6) {
        const r = 34 + k * 46;
        cloud(ctx, c - 120, c - 100, 240, 200, (x, y) => (ell(x, y, 120, 100, r, r * 0.8) - k * 0.35) * 1.3, i * 0.5, { scale: 18, tear: 0.5 + k * 0.4, flash: i < 3 ? [120, 100, 60, 1 - i * 0.3] : null });
      }
      if (i < 5) {
        for (let j = 0; j < 6; j++) {
          const a = (j / 6) * TAU + R() * 0.5;
          const len = 80 + R() * 40;
          if ((j + i) % 3 !== 0) crackle(ctx, c, c, c + Math.cos(a) * len, c + Math.sin(a) * len * 0.85, 153 + j * 5 + i, { strands: 2, w: 2.6 - i * 0.4, wander: 12 });
        }
      }
      if (i < 4) flash(ctx, c, c, 36 - i * 7, 1, true);
      if (i >= 3) for (let j = 0; j < 8; j++) {
        const a = (j / 8) * TAU;
        sparkle(ctx, PAL.storm, c + Math.cos(a) * (50 + k * 50), c + Math.sin(a) * (40 + k * 40), 10 - (i - 3) * 2, j);
      }
    },
  };

  // The Beastmaster's emblem: a wolf's head in moon silver over a crescent moon, on a badge of her
  // green wind.
  E.embwind = emblem(PAL.wind, (ctx, pal) => {
    badge(ctx, pal, [[0, -62], [48, -8], [0, 60], [-48, -8]]);
    const M = PAL.moon;
    celCrescent(ctx, M, 0, 2, 46, 1.9, 4.6, 16);
    ctx.scale(1.25, 1.25);
    const head = [[-30, -34], [-20, -10], [-24, 8], [-10, 30], [0, 40], [10, 30], [24, 8], [20, -10], [30, -34], [10, -16], [-10, -16]];
    inked(ctx, head, M[2], pal[4], 5);
    fill(ctx, [[-22, -24], [-14, -8], [-16, 6], [-6, 24], [0, 30], [6, 24], [16, 6], [14, -8], [22, -24], [8, -10], [-8, -10]], M[1]);
    fill(ctx, [[-6, 14], [6, 14], [0, 24]], M[4]);
    for (const s of [-1, 1]) fill(ctx, [[s * 6, -2], [s * 16, -6], [s * 14, 2]], pal[3]);
  });
  // An emblem's thundercloud colours (a badge keeps outlined puffs; the sky's clouds are soft).
  const THUNDERCLOUD = ['#a8a2dc', '#6c66ae', '#4c478a', '#332f66', '#14122c'];
  // The Stormcaller's emblem: a bolt of lightning striking out of a thundercloud, on a badge of
  // her violet.
  E.embstorm = emblem(PAL.storm, (ctx, pal) => {
    badge(ctx, pal, [[-46, -50], [46, -50], [46, 10], [0, 60], [-46, 10]]);
    bolt(ctx, pal, [[6, -14], [-12, 14], [6, 12], [-8, 50]], 12);
    for (const [x, y, r] of [[-22, -22, 18], [0, -32, 22], [22, -22, 18], [0, -14, 16]]) puff(ctx, THUNDERCLOUD, x, y, r, 160 + x, { lobes: 3 });
  });

  // Thunderhead's last word: one giant bolt slamming down from the sky in five twisting strands,
  // splitting off side bolts as it strikes, arcs crawling far over the ground and a flash where it
  // lands, flickering out.
  E.gigabolt = {
    w: 440, h: 760, n: 8, fps: 16, px: 220, py: 720,
    draw(ctx, i) {
      const gx = 220;
      const gy = 720;
      const a = [0.6, 1, 1, 0.7, 1, 0.7, 0.4, 0.15][i];
      crackle(ctx, gx + 30, 0, gx, gy, 460 + i * 11, { strands: i === 0 ? 1 : 5, w: i === 0 ? 3 : 6.5, a, wander: 60 });
      if (i >= 1 && i < 6) {
        // Side bolts splitting off the trunk as it strikes.
        const R = rng(470 + i);
        for (let j = 0; j < 4; j++) {
          const y = 120 + R() * 380;
          const side = j % 2 ? 1 : -1;
          crackle(ctx, gx + 10, y, gx + side * (90 + R() * 110), y + 80 + R() * 120, 471 + i * 5 + j, { strands: 1, w: 2.4, a: a * 0.8, rough: 0.4 });
        }
      }
      if (i >= 1) {
        groundArcs(ctx, gx, gy, 220, 8, 480 + i, a);
        flash(ctx, gx, gy, 90 * a, a);
      }
    },
  };
  // A snowflake: six arms with side branches.
  function snowflake(ctx, pal, x, y, r, rot) {
    const arm = (w, colour) => {
      ctx.strokeStyle = colour;
      ctx.lineWidth = w;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let j = 0; j < 6; j++) {
        const a = rot + (j * TAU) / 6;
        const cx = Math.cos(a);
        const sn = Math.sin(a);
        ctx.moveTo(x, y);
        ctx.lineTo(x + cx * r, y + sn * r);
        for (const [d, l] of [[0.5, 0.3], [0.75, 0.22]]) {
          const bx = x + cx * r * d;
          const by = y + sn * r * d;
          for (const s of [-1, 1]) {
            ctx.moveTo(bx, by);
            ctx.lineTo(bx + Math.cos(a + s * 0.9) * r * l, by + Math.sin(a + s * 0.9) * r * l);
          }
        }
      }
      ctx.stroke();
    };
    arm(Math.max(4, r * 0.16), pal[4]);
    arm(Math.max(2.5, r * 0.1), pal[1]);
    diamond(ctx, pal, x, y, r * 0.18, 1);
  }
  E.snowflake = {
    w: 120, h: 120, n: 4, fps: 12, px: 60, py: 60, loop: true,
    draw(ctx, i) {
      snowflake(ctx, PAL.ice, 60, 60, 46, (i / 4) * (TAU / 6));
    },
  };
  // A frost bolt shattering: a great snowflake bursts open over an icy ring, then breaks into ice
  // beads and little flakes drifting down.
  E.frostburst = {
    w: 260, h: 260, n: 7, fps: 20, px: 130, py: 130,
    draw(ctx, i) {
      const pal = PAL.ice;
      const c = 130;
      if (i === 0) return starburst(ctx, pal, c, c, 34, 6, 85, { inner: 0.5, tones: 3 });
      if (i <= 3) {
        celRing(ctx, pal, c, c, [0, 70, 96, 110][i], [0, 14, 10, 6][i], { broken: i === 3 ? 0.4 : 0, seed: 86 });
        snowflake(ctx, pal, c, c, [0, 70, 92, 84][i], 0.2 + i * 0.08);
        return;
      }
      const k = (i - 3) / 3;
      const R = rng(87);
      for (let j = 0; j < 10; j++) {
        const a = (j / 10) * TAU + R() * 0.4;
        const d = 60 + k * 50;
        if (j % 3) shard(ctx, pal, c + Math.cos(a) * d, c + Math.sin(a) * d + k * 20, a, 10 * (1.1 - k * 0.5), 3.5);
        else snowflake(ctx, pal, c + Math.cos(a) * d, c + Math.sin(a) * d + k * 30, 14 * (1.1 - k * 0.5), k * 2);
      }
    },
  };
  // A blast bolt bursting: a soft star of fire, puffs of cloud billowing out of it, breaking up.
  E.blast = {
    w: 280, h: 240, n: 8, fps: 20, px: 140, py: 200,
    draw(ctx, i) {
      const c = 140;
      const cy = 130;
      if (i === 0) return starburst(ctx, PAL.fire, c, cy, 50, 10, 88, { inner: 0.5, tones: 3 });
      if (i <= 2) starburst(ctx, PAL.fire, c, cy, i === 1 ? 110 : 96, 10, 88, { inner: 0.42 });
      if (i >= 2) {
        const k = (i - 2) / 5;
        const R = rng(89);
        for (let j = 0; j < 6; j++) {
          const a = -Math.PI / 2 + (j - 2.5) * 0.55;
          const d = 30 + k * 60;
          puff(ctx, j % 2 ? DUST : PAL.fire, c + Math.cos(a) * d, cy + 20 + Math.sin(a) * d * 0.7 - k * 30, (26 + R() * 10) * (1 - k * 0.5), 90 + j, { holes: Math.max(0, (i - 5) / 3), lobes: 3 });
        }
      }
    },
  };
  // A Deadeye: a rose sight snapping shut on the bow, a star of light bursting inside it.
  E.deadeye = {
    w: 220, h: 220, n: 6, fps: 20, px: 110, py: 110,
    draw(ctx, i) {
      const pal = PAL.sight;
      const c = 110;
      const r = [96, 70, 56, 60, 72, 84][i];
      celRing(ctx, pal, c, c, r, 8, { broken: 0.25, seed: 91 });
      for (let j = 0; j < 4; j++) {
        const a = (j / 4) * TAU;
        speedLine(ctx, pal, c + Math.cos(a) * (r + 22), c + Math.sin(a) * (r + 22), c + Math.cos(a) * (r - 14), c + Math.sin(a) * (r - 14), 4);
      }
      if (i >= 2 && i <= 4) starburst(ctx, pal, c, c, [0, 0, 50, 44, 30][i], 8, 92, { inner: 0.35 });
    },
  };

  // ---------- The Warrior's steel (first job) ----------
  // A giant sword of steel forming (Titan Breaker): the shards of the steel sword flying together
  // into the whole blade (the sword shattering, played backward), then held whole.
  const swordForm = (sw) => ({ ...sw, n: 5, fps: 14, draw: (ctx, i) => sw.draw(ctx, [4, 3, 2, 1, 0][i]) });
  E.swordform = swordForm(E.steelsword);
  // The same for a Paladin (gold) and a Berserker (blood red) using Titan Breaker.
  E.ragesword = swordOf(PAL.rage);
  E.swordformgold = swordForm(E.sword);
  E.swordformred = swordForm(E.ragesword);
  // The ground splitting open under Titan Breaker: a white-hot seam runs out both ways, tears wide
  // with steel light bursting up out of it in blades, then closes into beads and sparkles.
  function fissureOf(pal) {
    const w = 520;
    const h = 200;
    const g = 170;
    const c = w / 2;
    const R = rng(131);
    const zig = Array.from({ length: 17 }, (_, j) => [((j - 8) / 8) * 240, (R() - 0.5) * 10]);
    const seam = (ctx, len, gap) => {
      const top = [];
      const bot = [];
      zig.forEach(([x, y]) => {
        const k = Math.abs(x) / 240;
        if (k > len) return;
        const open = gap * (1 - Math.pow(k / Math.max(0.01, len), 2)) + 1;
        top.push([c + x, g + y - open]);
        bot.push([c + x, g + y + open * 0.6]);
      });
      if (top.length < 2) return;
      inked(ctx, top.concat(bot.reverse()), pal[1], pal[4], 4);
      fill(ctx, top.map(([x, y]) => [x, y + gap * 0.35]).concat(top.map(([x, y]) => [x, y + gap * 0.75]).reverse()), pal[0]);
    };
    const blade = (ctx, x, tall, k) => {
      if (tall * k < 6) return;
      inked(ctx, [[x - 9 * k, g], [x, g - tall * k], [x + 9 * k, g]], pal[2], pal[4], 3.5);
      fill(ctx, [[x - 4 * k, g], [x, g - tall * k * 0.8], [x + 4 * k, g]], pal[0]);
    };
    const blades = Array.from({ length: 9 }, (_, j) => ({ x: c + (j - 4) * 50 + (R() - 0.5) * 16, tall: 70 + R() * 70 * (1 - Math.abs(j - 4) * 0.15) }));
    return {
      w, h, n: 9, fps: 20, px: c, py: g,
      draw(ctx, i) {
        const len = [0.25, 0.7, 1, 1, 1, 1, 0.9, 0.6, 0][i];
        const gap = [3, 7, 14, 18, 16, 12, 7, 3, 0][i];
        if (len) seam(ctx, len, gap);
        const k = [0, 0.4, 1, 1.1, 0.9, 0.6, 0.3, 0, 0][i];
        if (k) blades.forEach((b, j) => blade(ctx, b.x, b.tall, Math.abs(b.x - c) / 240 <= len ? k * (j % 2 ? 0.8 : 1) : 0));
        if (i >= 4) {
          const q = (i - 4) / 4;
          blades.forEach((b, j) => {
            if (i < 8 || j % 2) sparkle(ctx, pal, b.x + (j % 2 ? 8 : -8), g - b.tall * (0.5 + q * 0.5), 12 * (1.1 - q * 0.6), j);
            shard(ctx, pal, b.x, g - 20 - q * 40, -Math.PI / 2, 12 * (1.2 - q), 3.5 * (1.2 - q));
          });
        }
      },
    };
  }
  E.fissure = fissureOf(PAL.steel);
  E.fissuregold = fissureOf(PAL.holy);
  E.fissurered = fissureOf(PAL.rage);
  // Valor building, looping: steel chevrons and diamonds rising round the hero, a little cross
  // glinting among them (the Warrior's shape).
  E.valor = {
    w: 160, h: 220, n: 8, fps: 10, px: 80, py: 210, loop: true,
    draw(ctx, i) {
      const pal = PAL.steel;
      const R = rng(141);
      for (let j = 0; j < 6; j++) {
        const life = (i / 8 + j / 6) % 1;
        const x = 80 + (j % 2 ? 1 : -1) * (26 + R() * 30);
        const y = 200 - life * 170;
        const k = Math.sin(Math.PI * life);
        if (k < 0.15) continue;
        if (j % 3 === 0) {
          const s = 10 * k;
          inked(ctx, [[x - s, y + s * 0.6], [x, y - s * 0.4], [x + s, y + s * 0.6], [x + s, y + s * 1.3], [x, y + s * 0.3], [x - s, y + s * 1.3]], pal[2], pal[4], 3);
          fill(ctx, [[x - s * 0.6, y + s * 0.5], [x, y - s * 0.1], [x + s * 0.6, y + s * 0.5], [x, y + s * 0.2]], pal[0]);
        } else if (j % 3 === 1) diamond(ctx, pal, x, y, 7 * k, 1.5);
        else sparkle(ctx, pal, x, y, 10 * k, 0.4);
      }
    },
  };

  // ---------- The Archer's hawk (first job: warm gold and sky blue) ----------
  // A feather: a long pointed vane on a quill, notched along its edge, turned to `a`.
  function feather(ctx, x, y, len, a, pal = PAL.hawk, tip = PAL.sky) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    const w = len * 0.26;
    const vane = [[-len * 0.5, 0], [-len * 0.3, -w * 0.9], [len * 0.15, -w], [len * 0.5, 0], [len * 0.15, w * 0.85], [-len * 0.05, w * 0.55], [-len * 0.15, w * 0.95], [-len * 0.4, w * 0.6]];
    inked(ctx, vane, pal[3], pal[4], 3);
    fill(ctx, vane.map(([px, py]) => [px * 0.85, py * 0.7 - w * 0.12]), pal[2]);
    fill(ctx, [[len * 0.2, -w * 0.7], [len * 0.5, 0], [len * 0.2, w * 0.6], [len * 0.28, 0]], tip[2]);
    fill(ctx, [[-len * 0.35, -w * 0.45], [len * 0.1, -w * 0.6], [len * 0.3, -w * 0.15], [-len * 0.2, -w * 0.15]], pal[1]);
    ctx.strokeStyle = pal[0];
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-len * 0.62, 0);
    ctx.lineTo(len * 0.42, 0);
    ctx.stroke();
    ctx.restore();
  }
  // An Archer's shot landing: a gold star pops, a sky-blue swoosh cuts across it, feathers burst
  // off and tumble, then beads.
  E.hawkhit = {
    w: 220, h: 200, n: 6, fps: 24, px: 110, py: 100,
    draw(ctx, i) {
      const c = 110;
      if (i === 0) return starburst(ctx, PAL.hawk, c, 100, 30, 8, 151, { inner: 0.5, tones: 3 });
      if (i <= 2) {
        celCrescent(ctx, PAL.sky, c - 20, 150, 80, -2.4, -0.7, i === 1 ? 22 : 26);
        starburst(ctx, PAL.hawk, c, 100, i === 1 ? 52 : 42, 8, 151, { inner: 0.42 });
      }
      const k = (i - 1) / 4;
      const R = rng(153);
      for (let j = 0; j < 6; j++) {
        const a = (j / 6) * TAU + R() * 0.5;
        const d = 28 + k * 60;
        if (i < 5 || j % 2) feather(ctx, c + Math.cos(a) * d, 100 + Math.sin(a) * d * 0.8 + k * k * 20, 30 * (1.1 - k * 0.4), a + k * 3);
      }
      if (i >= 3) for (let j = 0; j < 5; j++) shard(ctx, j % 2 ? PAL.sky : PAL.hawk, c - 40 + j * 22, 72 - k * 20 + (j % 2) * 18, 0.3, 8, 3 * (1.2 - k * 0.5));
    },
  };
  // A gust of feathers off the bow: they fan out forward on a sky-blue swoosh, then tumble down.
  E.feathers = {
    w: 260, h: 180, n: 7, fps: 16, px: 60, py: 90,
    draw(ctx, i) {
      const k = i / 6;
      if (i < 4) celCrescent(ctx, PAL.sky, 100 + k * 40, 220, 150, -2.2 + k * 0.3, -1.25 + k * 0.3, 18 * (1 - k * 0.6));
      const R = rng(161);
      for (let j = 0; j < 7; j++) {
        const a = (j / 6 - 0.5) * 1.1;
        const d = 30 + k * (110 + R() * 40);
        const x = 60 + Math.cos(a) * d;
        const y = 90 + Math.sin(a) * d + k * k * 50;
        if (i < 6 || j % 2) feather(ctx, x, y, 32 * (1 - k * 0.3), a + k * (j % 2 ? 4 : -4));
      }
    },
  };
  // The trail behind a gold arrow, looping: sky-blue speed lines and a glint.
  E.hawktrail = {
    w: 200, h: 70, n: 3, fps: 18, px: 190, py: 35, loop: true,
    draw(ctx, i) {
      const R = rng(171 + i);
      for (let j = 0; j < 3; j++) {
        const y = 18 + j * 17 + (R() - 0.5) * 6;
        const len = 90 + R() * 70;
        speedLine(ctx, j === 1 ? PAL.hawk : PAL.sky, 186 - len, y, 186, y, j === 1 ? 5 : 3.5);
      }
      sparkle(ctx, PAL.hawk, 60 + i * 30, 20 + (i % 2) * 30, 9, i);
    },
  };
  // The great falcon of light (Falcon Dive), flying to the right, looping its wingbeat: a gold
  // body with a white breast, a hooked head, wings of long gold feathers tipped sky blue, a fanned
  // tail and a glow of beads streaming off it.
  E.falcon = (() => {
    const pal = PAL.hawk;
    const sky = PAL.sky;
    const w = 340;
    const h = 260;
    const cx = 180;
    const cy = 140;
    // A wing from the shoulder to its tip: a curved leading edge, and a trailing edge that breaks
    // into five long feathers tipped sky blue.
    const wing = (ctx, tip, far) => {
      const S = [cx - 4, cy - 12];
      const B = [cx - 58, cy + 6];
      const lead = [];
      const bulge = [(S[0] + tip[0]) / 2 + 10, (S[1] + tip[1]) / 2 - 34];
      for (let k = 0; k <= 10; k++) {
        const u = k / 10;
        lead.push([(1 - u) ** 2 * S[0] + 2 * u * (1 - u) * bulge[0] + u * u * tip[0], (1 - u) ** 2 * S[1] + 2 * u * (1 - u) * bulge[1] + u * u * tip[1]]);
      }
      const trail = [];
      const tips = [];
      for (let f = 0; f < 5; f++) {
        const u = f / 5;
        const a = [lerp(tip[0], B[0], u), lerp(tip[1], B[1], u)];
        const b = [lerp(tip[0], B[0], u + 0.2), lerp(tip[1], B[1], u + 0.2)];
        const dx = b[0] - a[0];
        const dy = b[1] - a[1];
        const len = Math.hypot(dx, dy) || 1;
        // Each feather tip juts out past the edge, away from the leading edge.
        const out = [dy / len, -dx / len];
        const tipPt = [(a[0] + b[0]) / 2 + out[0] * -26, (a[1] + b[1]) / 2 + out[1] * -26];
        trail.push(a, tipPt);
        tips.push([a, tipPt, b]);
      }
      trail.push(B);
      const shape = lead.concat(trail);
      inked(ctx, shape, far ? pal[3] : pal[2], pal[4], 4);
      tips.forEach(([a, t, b]) => fill(ctx, [[lerp(a[0], t[0], 0.45), lerp(a[1], t[1], 0.45)], t, [lerp(b[0], t[0], 0.45), lerp(b[1], t[1], 0.45)]], sky[far ? 3 : 2]));
      if (!far) {
        const inner = lead.map(([x, y], k) => [lerp(x, cx - 30, 0.25), lerp(y, cy, 0.25) + 4]);
        fill(ctx, inner.slice(0, 9).concat([[cx - 20, cy - 2]]), pal[1]);
        fill(ctx, lead.slice(1, 8).map(([x, y]) => [x, y + 5]).concat(lead.slice(1, 8).reverse()), pal[0]);
      }
    };
    return {
      w, h, n: 4, fps: 12, px: cx, py: cy, loop: true,
      draw(ctx, i) {
        const tipY = [-120, -40, 40, -40][i];
        const tipX = [-60, -150, -110, -150][i];
        wing(ctx, [cx + tipX + 20, cy + tipY - 14], true);
        // The tail, fanned behind.
        for (let f = -2; f <= 2; f++) feather(ctx, cx - 98, cy + 12 + f * 5, 60, Math.PI + f * 0.2, pal, sky);
        // A plump body tapering to the tail, a white breast.
        const body = [[cx - 80, cy + 12], [cx - 40, cy - 22], [cx + 20, cy - 30], [cx + 56, cy - 18], [cx + 60, cy + 10], [cx + 24, cy + 30], [cx - 40, cy + 26]];
        inked(ctx, body, pal[3], pal[4], 4);
        fill(ctx, body.map(([x, y]) => [lerp(cx, x, 0.88), lerp(cy, y, 0.75) - 5]), pal[2]);
        fill(ctx, [[cx - 10, cy + 8], [cx + 40, cy - 2], [cx + 54, cy + 10], [cx + 20, cy + 24], [cx - 20, cy + 20]], pal[0]);
        // The head: round, a white cheek, a sky-blue hooked beak and a fierce eye.
        const hx = cx + 66;
        const hy = cy - 22;
        ctx.beginPath();
        ctx.arc(hx, hy, 27, 0, TAU);
        ctx.fillStyle = pal[4];
        ctx.fill();
        ctx.beginPath();
        ctx.arc(hx, hy, 24, 0, TAU);
        ctx.fillStyle = pal[2];
        ctx.fill();
        ctx.beginPath();
        ctx.arc(hx - 4, hy - 6, 15, 0, TAU);
        ctx.fillStyle = pal[1];
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(hx + 6, hy + 10, 14, 9, 0, 0, TAU);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        inked(ctx, [[hx + 18, hy - 10], [hx + 44, hy - 2], [hx + 38, hy + 14], [hx + 30, hy + 6], [hx + 20, hy + 6]], sky[2], sky[4], 3.5);
        fill(ctx, [[hx + 22, hy - 8], [hx + 40, hy - 2], [hx + 28, hy - 1]], '#ffffff');
        ctx.beginPath();
        ctx.arc(hx + 8, hy - 6, 6, 0, TAU);
        ctx.fillStyle = sky[4];
        ctx.fill();
        ctx.beginPath();
        ctx.arc(hx + 7, hy - 8, 2.4, 0, TAU);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        fill(ctx, [[hx - 6, hy - 16], [hx + 18, hy - 14], [hx + 16, hy - 10]], pal[4]);
        wing(ctx, [cx + tipX, cy + tipY], false);
        // Beads of light streaming off behind.
        const R = rng(181 + i);
        for (let j = 0; j < 5; j++) shard(ctx, j % 2 ? sky : pal, 30 - j * 4 + R() * 10, cy - 30 + j * 20 + R() * 8, 0, 16, 3.5);
        sparkle(ctx, pal, cx + 10, cy - 70 + (i % 2) * 10, 11, i);
      },
    };
  })();
  // Momentum building, looping: gold feathers circling the hero on a ring of sky-blue wind.
  E.momentum = {
    w: 180, h: 200, n: 8, fps: 12, px: 90, py: 190, loop: true,
    draw(ctx, i) {
      const t = (i / 8) * TAU;
      ctx.save();
      ctx.translate(90, 110);
      ctx.scale(1, 0.45);
      celCrescent(ctx, PAL.sky, 0, 0, 70, t, t + 2, 14);
      celCrescent(ctx, PAL.sky, 0, 0, 62, t + Math.PI, t + Math.PI + 1.6, 11);
      ctx.restore();
      for (let j = 0; j < 3; j++) {
        const a = t + (j / 3) * TAU;
        const x = 90 + Math.cos(a) * 64;
        const y = 110 + Math.sin(a) * 28 - j * 26;
        feather(ctx, x, y, 34, a + Math.PI / 2 + 0.4);
      }
    },
  };
  // The Archer's emblem: two gold feathers crossed over a sky-blue diamond.
  E.embhawk = emblem(PAL.hawk, (ctx, pal) => {
    badge(ctx, PAL.sky, [[0, -60], [44, -6], [0, 60], [-44, -6]]);
    feather(ctx, -14, 4, 92, -Math.PI / 2 - 0.5, pal, PAL.sky);
    feather(ctx, 14, 4, 92, -Math.PI / 2 + 0.5, pal, PAL.sky);
    feather(ctx, 0, -2, 104, -Math.PI / 2, pal, PAL.sky);
  });

  // ---------- The Thief's shadow and moonlight (first job: violet, midnight and moon silver) ----------
  // A dagger's cut: a thin violet swipe.
  E.slashshadow = swipe(PAL.shadow, { seed: 17 });
  E.streakshadow = streaks(PAL.shadow);
  // A dagger hit: two thin violet slashes crossing in an X, a silver glint at the cross, then they
  // break into beads and a wisp of smoke.
  E.shadowhit = {
    w: 200, h: 200, n: 6, fps: 26, px: 100, py: 100,
    draw(ctx, i) {
      const c = 100;
      if (i === 0) return sparkle(ctx, PAL.moon, c, c, 18, 0.3);
      if (i <= 2) {
        celCrescent(ctx, PAL.shadow, c - 30, c + 60, 90, -1.75, -0.55, i === 1 ? 16 : 20);
        celCrescent(ctx, PAL.shadow, c + 30, c + 60, 90, -2.6, -1.4, i === 1 ? 16 : 20);
        sparkle(ctx, PAL.moon, c, c - 6, i === 1 ? 22 : 16, 0.2);
        return;
      }
      const k = (i - 2) / 3;
      puff(ctx, PAL.shadow, c - 10, c + 10, 22 * (1 - k * 0.4), 201, { holes: k, lobes: 4 });
      const R = rng(203);
      for (let j = 0; j < 6; j++) {
        const a = (j / 6) * TAU + R();
        const d = 26 + k * 50;
        if (i < 5 || j % 2) shard(ctx, j % 2 ? PAL.moon : PAL.shadow, c + Math.cos(a) * d, c + Math.sin(a) * d, a, 10 * (1.2 - k * 0.6), 3 * (1.2 - k * 0.5));
      }
    },
  };
  // Smoke: a violet cloud bursts up and out (vanishing, a dash), then thins away full of holes.
  E.smoke = {
    w: 240, h: 200, n: 7, fps: 18, px: 120, py: 170,
    draw(ctx, i) {
      const k = i / 6;
      const R = rng(211);
      for (let j = 0; j < 5; j++) {
        const a = -Math.PI / 2 + (j - 2) * 0.6;
        const d = 10 + k * 60;
        puff(ctx, j === 2 ? PAL.moon : PAL.shadow, 120 + Math.cos(a) * d * 1.3, 140 + Math.sin(a) * d * 0.8 - k * 20, (24 + R() * 10) * (0.7 + k * 0.5) * (i > 4 ? 1 - (i - 4) * 0.3 : 1), 212 + j, { holes: Math.max(0, (i - 3) / 3), lobes: 4 });
      }
      if (i >= 2 && i <= 4) for (let j = 0; j < 3; j++) sparkle(ctx, PAL.moon, 70 + j * 50, 60 + (j % 2) * 30, 9, j);
    },
  };
  // A big X slash (Moonlit Assassination on each monster): two long violet blades of light
  // crossing, white at the core, then breaking apart.
  function xslashOf(S, M) {
    return {
    w: 260, h: 260, n: 6, fps: 22, px: 130, py: 130,
    draw(ctx, i) {
      const c = 130;
      const bar = (a, len, wid) => {
        const ux = Math.cos(a);
        const uy = Math.sin(a);
        const p = (s, t) => [c + ux * s - uy * t, c + uy * s + ux * t];
        inked(ctx, [p(-len, 0), p(0, -wid), p(len, 0), p(0, wid)], S[3], S[4], 4);
        fill(ctx, [p(-len * 0.85, 0), p(0, -wid * 0.6), p(len * 0.85, 0), p(0, wid * 0.6)], S[2]);
        fill(ctx, [p(-len * 0.7, 0), p(0, -wid * 0.3), p(len * 0.7, 0), p(0, wid * 0.3)], M[1]);
      };
      const len = [70, 120, 118, 100, 0, 0][i];
      const wid = [6, 14, 11, 6, 0, 0][i];
      if (len) {
        bar(-0.8, len, wid);
        if (i > 0) bar(0.8, len, wid);
        if (i === 1 || i === 2) sparkle(ctx, M, c, c, 20, 0.4);
      }
      if (i >= 3) {
        const k = (i - 3) / 2;
        const R = rng(221);
        for (let j = 0; j < 10; j++) {
          const a = (j / 10) * TAU + R() * 0.3;
          const d = 40 + k * 70;
          shard(ctx, j % 2 ? M : S, c + Math.cos(a) * d, c + Math.sin(a) * d, a, 14 * (1.2 - k * 0.6), 3.5);
        }
      }
    },
    };
  }
  E.xslash = xslashOf(PAL.shadow, PAL.moon);
  // A giant crescent moon cutting (the finishers' last blow): a thin silver line opens into a great
  // crescent, white-edged and violet underneath, holds, then breaks into beads and stars.
  function crescentOf(M, S) {
    return {
    w: 420, h: 260, n: 8, fps: 18, px: 210, py: 150,
    draw(ctx, i) {
      const cx = 210;
      const cy = 150;
      // A crescent lying on its back like a blade: the band between two circles of the same
      // radius, the inner edge `th` under the outer at the top and meeting it at both points.
      const band = (R, th, ox = 0) => {
        const oy = cy + R * 0.62;
        const a0 = Math.PI + 0.5;
        const a1 = TAU - 0.5;
        const pts = [];
        for (let j = 0; j <= 40; j++) {
          const a = lerp(a0, a1, j / 40);
          pts.push([cx + ox + Math.cos(a) * R * 1.25, oy + Math.sin(a) * R]);
        }
        for (let j = 40; j >= 0; j--) {
          const a = lerp(a0, a1, j / 40);
          pts.push([cx + ox + Math.cos(a) * R * 1.25, oy + Math.sin(a) * R + th * Math.pow(Math.sin((Math.PI * j) / 40), 0.8)]);
        }
        return pts;
      };
      const th = [6, 30, 48, 46, 34, 0, 0, 0][i];
      if (th) {
        const R = 150;
        inked(ctx, band(R, th), S[3], S[4], 5);
        fill(ctx, band(R, th * 0.78), M[3]);
        fill(ctx, band(R, th * 0.56), M[2]);
        fill(ctx, band(R, th * 0.34), M[1]);
        fill(ctx, band(R, th * 0.14), '#ffffff');
        if (i === 2 || i === 3) for (const [x, y] of [[cx - 160, cy - 30], [cx + 150, cy - 40], [cx, cy - 130]]) sparkle(ctx, M, x, y, 14, 0.3);
      }
      if (i >= 4) {
        const q = (i - 4) / 3;
        const R = rng(231);
        for (let j = 0; j < 14; j++) {
          const a = Math.PI + (j / 13) * Math.PI;
          const x = cx + Math.cos(a) * 190 * (1 + q * 0.2);
          const y = cy + Math.sin(a) * 110 - q * 20 + R() * 10;
          if (i < 7 || j % 2) {
            if (j % 3 === 0) sparkle(ctx, M, x, y, 12 * (1.1 - q * 0.6), j);
            else shard(ctx, j % 2 ? M : S, x, y, a + Math.PI / 2, 16 * (1.2 - q * 0.7), 4);
          }
        }
      }
    },
    };
  }
  E.crescent = crescentOf(PAL.moon, PAL.shadow);
  // A full moon rising over the monsters (Full Moon Volley): silver with violet shading and soft
  // craters, ringed by stars, held, then it bursts into falling stars.
  function moonOf(M, S) {
    return {
    w: 260, h: 260, n: 6, fps: 12, px: 130, py: 130,
    draw(ctx, i) {
      const c = 130;
      const r = [40, 80, 88, 88, 0, 0][i];
      if (r) {
        ctx.beginPath();
        ctx.arc(c, c, r + 4, 0, TAU);
        ctx.fillStyle = S[4];
        ctx.fill();
        ctx.beginPath();
        ctx.arc(c, c, r, 0, TAU);
        ctx.fillStyle = S[3];
        ctx.fill();
        ctx.beginPath();
        ctx.arc(c - r * 0.12, c - r * 0.12, r * 0.86, 0, TAU);
        ctx.fillStyle = M[3];
        ctx.fill();
        ctx.beginPath();
        ctx.arc(c - r * 0.25, c - r * 0.25, r * 0.6, 0, TAU);
        ctx.fillStyle = M[2];
        ctx.fill();
        for (const [dx, dy, cr] of [[0.3, 0.2, 0.16], [-0.2, 0.4, 0.1], [0.45, -0.25, 0.08]]) {
          ctx.beginPath();
          ctx.arc(c + dx * r, c + dy * r, cr * r, 0, TAU);
          ctx.fillStyle = S[2];
          ctx.fill();
        }
        if (i >= 1) for (let j = 0; j < 8; j++) {
          const a = (j / 8) * TAU + i * 0.3;
          sparkle(ctx, j % 2 ? S : M, c + Math.cos(a) * (r + 22), c + Math.sin(a) * (r + 22), 10, j);
        }
      }
      if (i >= 4) {
        const q = (i - 4);
        for (let j = 0; j < 12; j++) {
          const a = (j / 12) * TAU;
          const d = 60 + q * 50;
          sparkle(ctx, j % 2 ? S : M, c + Math.cos(a) * d, c + Math.sin(a) * d + q * 20, 12 * (1 - q * 0.4), j);
        }
      }
    },
    };
  }
  E.moon = moonOf(PAL.moon, PAL.shadow);
  // The trail behind a thrown star, looping: violet speed lines and a silver glint.
  function trailOf(A, B) {
    return {
    w: 170, h: 60, n: 3, fps: 18, px: 160, py: 30,
    draw(ctx, i) {
      const R = rng(241 + i);
      for (let j = 0; j < 3; j++) {
        const y = 14 + j * 16 + (R() - 0.5) * 6;
        const len = 70 + R() * 60;
        speedLine(ctx, j === 1 ? B : A, 156 - len, y, 156, y, j === 1 ? 4.5 : 3.5);
      }
      sparkle(ctx, B, 50 + i * 26, 16 + (i % 2) * 28, 8, i);
    },
    };
  }
  E.shadowtrail = trailOf(PAL.shadow, PAL.moon);
  // Shadow building, looping: wisps of violet smoke curling up round the thief, little silver
  // crescents drifting among them.
  E.shadowaura = {
    w: 170, h: 220, n: 8, fps: 10, px: 85, py: 210, loop: true,
    draw(ctx, i) {
      const R = rng(251);
      for (let j = 0; j < 6; j++) {
        const life = (i / 8 + j / 6) % 1;
        const side = j % 2 ? 1 : -1;
        const x = 85 + side * (24 + R() * 26) + Math.sin(life * 6 + j) * 8;
        const y = 200 - life * 170;
        const k = Math.sin(Math.PI * life);
        if (k < 0.15) continue;
        if (j % 3 === 2) sparkle(ctx, PAL.moon, x, y, 9 * k + 2, j);
        else celCrescent(ctx, PAL.shadow, x - side * 10, y + 16, 22 * k + 4, side > 0 ? -2.2 : -1.9, side > 0 ? -0.9 : -3.2, 10 * k + 2);
      }
    },
  };
  // The Thief's emblem: a silver crescent moon with a violet dagger across it.
  E.embshadow = emblem(PAL.shadow, (ctx, pal) => {
    celCrescent(ctx, PAL.moon, 10, 0, 50, 1.9, 4.6, 30);
    ctx.save();
    ctx.rotate(-0.7);
    inked(ctx, [[-8, -66], [0, -80], [8, -66], [8, 20], [-8, 20]], pal[2], pal[4], 5);
    fill(ctx, [[-3, -64], [0, -70], [3, -64], [3, 16], [-3, 16]], pal[0]);
    inked(ctx, [[-22, 20], [22, 20], [22, 30], [-22, 30]], PAL.moon[2], pal[4], 4);
    inked(ctx, [[-6, 30], [6, 30], [6, 54], [-6, 54]], pal[3], pal[4], 4);
    ctx.restore();
  });

  // ---------- The Assassin (crimson, black crows, a blood moon) ----------
  E.slashcrimson = swipe(PAL.crimson, { seed: 19 });
  E.redmoon = moonOf(PAL.crimson, PAL.raven);
  E.redcrescent = crescentOf(PAL.crimson, PAL.raven);
  E.crowx = xslashOf(PAL.crimson, PAL.raven);
  // A crow in flight seen from the side, facing right: a round black body, a little head with a
  // gold beak and a crimson eye, and wings (`flap` -1 up to 1 down).
  function crow(ctx, x, y, k, flap) {
    const P = PAL.raven;
    const wing = (side) => {
      const tipY = y - 22 * k * -flap * side - (side < 0 ? 4 * k : 0);
      const pts = [[x - 4 * k, y - 2 * k], [x - 18 * k, tipY - 4 * k], [x - 30 * k, tipY + 2 * k], [x - 22 * k, tipY + 8 * k], [x - 12 * k, y + 4 * k]];
      inked(ctx, pts, side < 0 ? P[4] : P[3], P[4], 2.5);
      if (side > 0) fill(ctx, pts.slice(0, 3).concat([[x - 8 * k, y]]), P[2]);
    };
    wing(-1);
    inked(ctx, [[x - 22 * k, y + 2 * k], [x - 14 * k, y - 8 * k], [x + 6 * k, y - 8 * k], [x + 12 * k, y], [x + 4 * k, y + 8 * k], [x - 14 * k, y + 8 * k]], P[3], P[4], 3);
    fill(ctx, [[x - 10 * k, y - 4 * k], [x + 4 * k, y - 6 * k], [x + 8 * k, y - 1 * k], [x - 6 * k, y]], P[2]);
    // tail
    inked(ctx, [[x - 20 * k, y], [x - 32 * k, y - 4 * k], [x - 32 * k, y + 6 * k]], P[3], P[4], 2.5);
    // head and beak
    ctx.beginPath();
    ctx.arc(x + 12 * k, y - 8 * k, 8 * k, 0, TAU);
    ctx.fillStyle = P[4];
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 12 * k, y - 8 * k, 6.5 * k, 0, TAU);
    ctx.fillStyle = P[3];
    ctx.fill();
    inked(ctx, [[x + 17 * k, y - 10 * k], [x + 27 * k, y - 7 * k], [x + 17 * k, y - 5 * k]], '#ffd27a', '#8a5a2a', 2);
    ctx.beginPath();
    ctx.arc(x + 14 * k, y - 10 * k, 2.2 * k, 0, TAU);
    ctx.fillStyle = PAL.crimson[2];
    ctx.fill();
    wing(1);
  }
  // A blade's hit for the Assassin: a crimson X with black feathers bursting off it.
  E.crowhit = {
    w: 200, h: 200, n: 6, fps: 26, px: 100, py: 100,
    draw(ctx, i) {
      const c = 100;
      if (i === 0) return sparkle(ctx, PAL.crimson, c, c, 18, 0.3);
      if (i <= 2) {
        celCrescent(ctx, PAL.crimson, c - 30, c + 60, 90, -1.75, -0.55, i === 1 ? 16 : 20);
        celCrescent(ctx, PAL.crimson, c + 30, c + 60, 90, -2.6, -1.4, i === 1 ? 16 : 20);
        sparkle(ctx, PAL.moon, c, c - 6, i === 1 ? 20 : 15, 0.2);
      }
      const k = (i - 1) / 4;
      const R = rng(301);
      for (let j = 0; j < 5; j++) {
        const a = (j / 5) * TAU + R();
        const d = 24 + k * 56;
        if (i < 5 || j % 2) feather(ctx, c + Math.cos(a) * d, c + Math.sin(a) * d + k * k * 24, 28 * (1.1 - k * 0.4), a + k * 3, PAL.raven, PAL.crimson);
      }
    },
  };
  // A flock of crows bursting up and away from a blow.
  E.crowburst = {
    w: 300, h: 260, n: 7, fps: 16, px: 150, py: 200,
    draw(ctx, i) {
      const k = i / 6;
      const R = rng(311);
      for (let j = 0; j < 5; j++) {
        const a = -Math.PI / 2 + (j - 2) * 0.5 + (R() - 0.5) * 0.2;
        const d = 10 + k * (120 + R() * 40);
        const flap = Math.sin(i * 2.2 + j * 1.3);
        if (i < 6 || j % 2) crow(ctx, 150 + Math.cos(a) * d * 1.2, 200 + Math.sin(a) * d, 1.4 - k * 0.35, flap);
      }
      if (i <= 2) for (let j = 0; j < 4; j++) feather(ctx, 120 + j * 20, 190 - i * 14, 24, -1 + j * 0.6, PAL.raven, PAL.crimson);
    },
  };
  // Crows streaming across the sky, looping (the blood moon's rising).
  E.crows = {
    w: 400, h: 180, n: 4, fps: 12, px: 200, py: 90, loop: true,
    draw(ctx, i) {
      for (let j = 0; j < 5; j++) crow(ctx, 50 + j * 66 + (j % 2) * 10, 60 + ((j * 37) % 60), 1.3 - (j % 3) * 0.12, Math.sin((i / 4) * TAU + j * 1.7));
    },
  };
  // A mark for death on a monster, looping: a crimson ring of ticks turning round a crow feather.
  E.deathmark = {
    w: 120, h: 120, n: 4, fps: 10, px: 60, py: 60, loop: true,
    draw(ctx, i) {
      const c = 60;
      celRing(ctx, PAL.crimson, c, c, 40 + (i % 2) * 3, 7, { broken: 0.35, seed: 320 + i });
      for (let j = 0; j < 4; j++) {
        const a = (j / 4) * TAU + i * 0.2;
        speedLine(ctx, PAL.crimson, c + Math.cos(a) * 54, c + Math.sin(a) * 54, c + Math.cos(a) * 32, c + Math.sin(a) * 32, 4);
      }
      feather(ctx, c, c, 40, -1, PAL.raven, PAL.crimson);
    },
  };
  // Killing Intent building, looping: black feathers drifting down round the assassin and crimson
  // wisps curling up.
  E.intentaura = {
    w: 170, h: 220, n: 8, fps: 10, px: 85, py: 210, loop: true,
    draw(ctx, i) {
      const R = rng(331);
      for (let j = 0; j < 6; j++) {
        const life = (i / 8 + j / 6) % 1;
        const side = j % 2 ? 1 : -1;
        const x = 85 + side * (24 + R() * 26) + Math.sin(life * 6 + j) * 8;
        const k = Math.sin(Math.PI * life);
        if (k < 0.15) continue;
        if (j % 2) feather(ctx, x, 30 + life * 170, 26 * k + 6, 0.8 + Math.sin(life * 8 + j) * 0.6, PAL.raven, PAL.crimson);
        else celCrescent(ctx, PAL.crimson, x - side * 10, 200 - life * 160, 20 * k + 4, side > 0 ? -2.2 : -1.9, side > 0 ? -0.9 : -3.2, 9 * k + 2);
      }
    },
  };
  // The Assassin's emblem: a crow's head over a crimson dagger.
  E.embcrow = emblem(PAL.crimson, (ctx, pal) => {
    ctx.save();
    ctx.rotate(-0.7);
    inked(ctx, [[-8, -66], [0, -80], [8, -66], [8, 20], [-8, 20]], pal[2], pal[4], 5);
    fill(ctx, [[-3, -64], [0, -70], [3, -64], [3, 16], [-3, 16]], pal[0]);
    inked(ctx, [[-22, 20], [22, 20], [22, 30], [-22, 30]], PAL.raven[2], pal[4], 4);
    ctx.restore();
    crow(ctx, 6, 6, 1.6, -0.6);
  });

  // ---------- The Night Lord (deep indigo and starlight gold; constellations) ----------
  E.nighttrail = trailOf(PAL.night, PAL.starlight);
  // A star landing: a gold star pops in an indigo ring and little gold stars burst out.
  E.starhit = {
    w: 200, h: 200, n: 6, fps: 26, px: 100, py: 100,
    draw(ctx, i) {
      const c = 100;
      if (i === 0) return sparkle(ctx, PAL.starlight, c, c, 20, 0);
      if (i <= 2) {
        celRing(ctx, PAL.night, c, c, i === 1 ? 34 : 48, i === 1 ? 10 : 7, { seed: 341 });
        sparkle(ctx, PAL.starlight, c, c, i === 1 ? 34 : 26, 0.4);
      }
      const k = (i - 1) / 4;
      for (let j = 0; j < 6; j++) {
        const a = (j / 6) * TAU + 0.3;
        const d = 30 + k * 52;
        if (i < 5 || j % 2) sparkle(ctx, j % 2 ? PAL.night : PAL.starlight, c + Math.cos(a) * d, c + Math.sin(a) * d, 12 * (1.2 - k * 0.6), j);
      }
    },
  };
  // A stuck star bursting (Star Mark): a big gold star blooms, an indigo ring races out, sparkles.
  E.starpop = {
    w: 240, h: 240, n: 7, fps: 22, px: 120, py: 120,
    draw(ctx, i) {
      const c = 120;
      if (i <= 3) starburst(ctx, PAL.starlight, c, c, [30, 62, 70, 56][i], 8, 351, { inner: 0.4 });
      if (i >= 1 && i <= 5) celRing(ctx, PAL.night, c, c, 40 + i * 16, 12 - i * 1.6, { broken: i > 3 ? 0.4 : 0, seed: 352 });
      if (i >= 3) for (let j = 0; j < 8; j++) {
        const a = (j / 8) * TAU;
        const d = 60 + (i - 3) * 22;
        sparkle(ctx, j % 2 ? PAL.night : PAL.starlight, c + Math.cos(a) * d, c + Math.sin(a) * d, 12 * (1 - (i - 3) * 0.2), j);
      }
    },
  };
  // ---------- The Archer's tricks (a huntress: rope, steel and gold) ----------
  // Snare Arrow's net over a monster, looping: a rope mesh draped over it, knotted, weighted at the
  // corners, swaying a little as it struggles. Centred on the monster.
  E.net = {
    w: 100, h: 100, n: 4, fps: 6, px: 50, py: 50, loop: true,
    draw(ctx, i) {
      const rope = ['#fff6e0', '#f0d6a0', '#d8a868', '#a8743e', '#5a3a20'];
      const sway = [0, 1.5, 0, -1.5][i];
      const c = 50;
      // The outline the net drapes to: wider at the bottom where it hangs.
      const edge = (u) => [c + Math.cos(u) * (30 + 6 * Math.max(0, Math.sin(u))) + sway * Math.sin(u), c + Math.sin(u) * 30];
      ctx.save();
      path(ctx, Array.from({ length: 24 }, (_, k) => edge((k / 24) * TAU)));
      ctx.clip();
      ctx.lineCap = 'round';
      for (const [w, col] of [[5, rope[4]], [3, rope[2]], [1.2, rope[1]]]) {
        ctx.strokeStyle = col;
        ctx.lineWidth = w;
        for (let k = -6; k <= 6; k++) {
          ctx.beginPath();
          ctx.moveTo(c + k * 11 - 40 + sway, c - 40);
          ctx.lineTo(c + k * 11 + 40 + sway, c + 40);
          ctx.moveTo(c + k * 11 + 40 + sway, c - 40);
          ctx.lineTo(c + k * 11 - 40 + sway, c + 40);
          ctx.stroke();
        }
      }
      ctx.restore();
      // Knots where the cords cross, and the rope rim.
      for (let a = -3; a <= 3; a++) {
        for (let b = -3; b <= 3; b++) {
          const x = c + (a + b) * 5.5 + sway * 0.5;
          const y = c + (b - a) * 5.5;
          if (Math.hypot(x - c, y - c) < 27) inked(ctx, Array.from({ length: 6 }, (_, k) => [x + Math.cos((k / 6) * TAU) * 2.2, y + Math.sin((k / 6) * TAU) * 2.2]), rope[1], rope[4], 1.2);
        }
      }
      ctx.strokeStyle = rope[4];
      ctx.lineWidth = 4;
      path(ctx, Array.from({ length: 24 }, (_, k) => edge((k / 24) * TAU)));
      ctx.stroke();
      ctx.strokeStyle = rope[2];
      ctx.lineWidth = 2;
      ctx.stroke();
      // Lead weights hanging off the bottom corners.
      for (const s of [-1, 1]) {
        const [x, y] = edge(Math.PI / 2 + s * 0.7);
        inked(ctx, Array.from({ length: 8 }, (_, k) => [x + Math.cos((k / 8) * TAU) * 5, y + 4 + Math.sin((k / 8) * TAU) * 5]), '#8a92a8', '#3a3a50', 2);
        fill(ctx, [[x - 2, y + 1], [x + 1, y], [x, y + 3]], '#e4ecff');
      }
    },
  };
  // Spring Trap, armed on the ground, looping: an open steel trap lying flat, its toothed jaws
  // spread, a gold trigger plate in the middle that glints. Its middle sits on the ground.
  E.trap = {
    w: 100, h: 50, n: 4, fps: 4, px: 50, py: 32, loop: true,
    draw(ctx, i) {
      const steel = PAL.steel;
      const c = 50;
      const g = 32;
      // The jaws, opened flat: two toothed half rings either side of the plate.
      for (const s of [-1, 1]) {
        const arc = Array.from({ length: 11 }, (_, k) => {
          const u = (k / 10) * Math.PI;
          return [c + s * (10 + Math.sin(u) * 24), g - 6 + Math.cos(u) * 9];
        });
        inked(ctx, [...arc, ...arc.slice().reverse().map(([x, y]) => [c + (x - c) * 0.72, y])], steel[2], steel[4], 2.5);
        for (let k = 1; k < 10; k += 2) {
          const [x, y] = arc[k];
          inked(ctx, [[x, y], [x - s * 5, y - 1], [x, y + 2]], steel[0], steel[4], 1.2);
        }
      }
      // The trigger plate, gold, and the spring hinges.
      inked(ctx, Array.from({ length: 14 }, (_, k) => [c + Math.cos((k / 14) * TAU) * 10, g - 6 + Math.sin((k / 14) * TAU) * 5]), PAL.hawk[2], PAL.hawk[4], 2);
      fill(ctx, Array.from({ length: 10 }, (_, k) => [c - 2 + Math.cos((k / 10) * TAU) * 5, g - 7 + Math.sin((k / 10) * TAU) * 2]), PAL.hawk[1]);
      for (const s of [-1, 1]) inked(ctx, Array.from({ length: 8 }, (_, k) => [c + s * 34 + Math.cos((k / 8) * TAU) * 4, g - 6 + Math.sin((k / 8) * TAU) * 4]), steel[3], steel[4], 1.5);
      if (i === 1) sparkle(ctx, PAL.hawk, c + 4, g - 9, 6, 0.3);
    },
  };
  // Spring Trap snapping: the jaws spring up and clamp shut, a burst of sparks and dust, then the
  // shut trap. Its middle on the ground.
  E.trapsnap = {
    w: 140, h: 120, n: 6, fps: 18, px: 70, py: 92,
    draw(ctx, i) {
      const steel = PAL.steel;
      const c = 70;
      const g = 92;
      const shut = [0.5, 1, 1, 1, 1, 1][i];
      const R = rng(510);
      if (i >= 1) {
        const k = (i - 1) / 4;
        starburst(ctx, PAL.hawk, c, g - 22, 26 + k * 22, 8, 510, { inner: 0.35 });
        for (let j = 0; j < 6; j++) shard(ctx, PAL.hawk, c + (R() - 0.5) * 70, g - 20 - k * 40 - R() * 20, -Math.PI / 2 + (R() - 0.5), 12 * (1 - k * 0.6), 3);
        for (const s of [-1, 1]) puff(ctx, DUST, c + s * (24 + k * 24), g - 4 - k * 6, 12 + k * 8, 52 + s, { holes: Math.max(0, (i - 3) / 2) });
      }
      // The jaws rising to meet over the plate.
      for (const s of [-1, 1]) {
        const a0 = -Math.PI / 2 + s * (Math.PI / 2) * (1 - shut);
        const arc = Array.from({ length: 9 }, (_, k) => {
          const u = (k / 8) * Math.PI;
          const r = 24 * Math.sin(u);
          return [c + s * 4 + Math.cos(a0) * r * 0.2 * s, g - 4 - r * (0.3 + 0.7 * shut)];
        });
        inked(ctx, tube(arc.map(([x, y], k) => [x + s * (k - 4) * 2.5, y]), 7, 7), steel[2], steel[4], 2.5);
      }
      inked(ctx, Array.from({ length: 12 }, (_, k) => [c + Math.cos((k / 12) * TAU) * 14, g - 2 + Math.sin((k / 12) * TAU) * 4]), steel[3], steel[4], 2);
    },
  };

  // ---------- Snow wolf's moon magic (the Beastmaster's companion, render/snowwolf.js) ----------
  // Her greatsword, the Fang of the Wolf Queen, casts moonlight: silver-blue, cold, with ice in its
  // shadows (her ice-blue eyes and the sword's frost), set apart from the Thief's violet moon.
  const LUNAR = ['#ffffff', '#eef6ff', '#bcd6ff', '#86a8ee', '#3f4f9e'];
  E.lunarcrescent = crescentOf(LUNAR, PAL.ice);
  // Her full moon: pale silver-white with soft grey craters, a cold blue rim.
  E.lunarmoon = moonOf(['#ffffff', '#fbfcff', '#eef2f8', '#d6deea', '#8fa0c0'], ['#ffffff', '#e8f0fa', '#c4d0e2', '#a6b4cc', '#6f7fa8']);
  // A crescent of moonlight flying, looping (Crescent Flick, Moon Ward's answer, her Fed Up
  // swings): a thick bright crescent, horns trailing, motes peeling off behind. Drawn flying right;
  // its middle is its anchor.
  E.moonbolt = {
    w: 120, h: 90, n: 3, fps: 18, px: 72, py: 45, loop: true,
    draw(ctx, i) {
      const R = rng(810 + i);
      const c = [72, 45];
      const arc = (r, th, col) => {
        const pts = [];
        for (let j = 0; j <= 20; j++) { const t = -1.25 + (j / 20) * 2.5; pts.push([c[0] + Math.cos(t) * r, c[1] + Math.sin(t) * r * 1.1]); }
        for (let j = 20; j >= 0; j--) { const t = -1.25 + (j / 20) * 2.5; const w = th * Math.pow(Math.cos((t / 1.25) * (Math.PI / 2)), 0.8); pts.push([c[0] + Math.cos(t) * (r - w), c[1] + Math.sin(t) * (r - w) * 1.1]); }
        return pts;
      };
      inked(ctx, arc(30, 16, LUNAR[3]), LUNAR[3], LUNAR[4], 3);
      fill(ctx, arc(28, 11, LUNAR[2]), LUNAR[2]);
      fill(ctx, arc(26, 6, LUNAR[0]), LUNAR[0]);
      for (let j = 0; j < 5; j++) sparkle(ctx, LUNAR, 20 + R() * 30, 20 + R() * 50, 4 + R() * 4, R());
      for (let j = 0; j < 3; j++) fill(ctx, tube([[34 - j * 6, 30 + j * 15], [6 - j * 4 - (i % 2) * 4, 32 + j * 13]], 2, 0.5), LUNAR[2]);
    },
  };
  // Moonfall: a beam of moonlight crashing down from the sky onto one monster, a crescent moon
  // glowing at its top, then a cold flash and a ring of light where it struck. Its foot is its anchor.
  E.moonbeam = {
    w: 160, h: 440, n: 9, fps: 18, px: 80, py: 420, loop: false,
    draw(ctx, i) {
      const c = 80;
      const g = 420;
      const R = rng(830 + i);
      const w = [3, 8, 34, 40, 36, 26, 16, 8, 0][i];
      const top = [380, 120, 20, 20, 20, 20, 20, 20, 20][i];
      // The crescent moon high above.
      if (i < 8) {
        ctx.globalAlpha = i < 6 ? 1 : 0.5;
        const mc = [c + 6, 40];
        inked(ctx, Array.from({ length: 24 }, (_, j) => { const t = (j / 23) * TAU; return [mc[0] + Math.cos(t) * 22, mc[1] + Math.sin(t) * 22]; }), LUNAR[1], LUNAR[3], 3);
        fill(ctx, Array.from({ length: 24 }, (_, j) => { const t = (j / 23) * TAU; return [mc[0] + 9 + Math.cos(t) * 19, mc[1] - 6 + Math.sin(t) * 19]; }), 'rgba(0,0,0,0)');
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath(); ctx.arc(mc[0] + 10, mc[1] - 7, 18, 0, TAU); ctx.fill();
        ctx.restore();
        ctx.globalAlpha = 1;
      }
      // The beam: wide and soft outside, a white core.
      if (w) {
        for (const [k, col] of [[1, LUNAR[3]], [0.7, LUNAR[2]], [0.42, LUNAR[1]], [0.16, '#ffffff']]) {
          const hw = (w * k) / 2;
          fill(ctx, [[c - hw * 0.6, top], [c + hw * 0.6, top], [c + hw, g], [c - hw, g]], col);
        }
        for (let j = 0; j < 6; j++) sparkle(ctx, LUNAR, c + (R() - 0.5) * w * 1.6, top + R() * (g - top), 5 + R() * 5, R());
      }
      // The strike: a flash and a ring along the ground, shards of light thrown up.
      if (i >= 2) {
        const q = (i - 2) / 6;
        starburst(ctx, LUNAR, c, g - 10, 46 * (1 - q * 0.5), 8, 840 + i, { inner: 0.35 });
        ctx.globalAlpha = 1 - q;
        inked(ctx, Array.from({ length: 24 }, (_, j) => { const t = (j / 23) * TAU; return [c + Math.cos(t) * (20 + q * 60), g - 4 + Math.sin(t) * (5 + q * 12)]; }), 'rgba(0,0,0,0)', LUNAR[2], 4 * (1 - q) + 1);
        ctx.globalAlpha = 1;
        for (let j = 0; j < 5; j++) shard(ctx, LUNAR, c + (R() - 0.5) * 80, g - 20 - R() * 60 * q, -Math.PI / 2 + (R() - 0.5), 14 * (1 - q * 0.6), 4);
      }
    },
  };
  // A moonlight hit: a crescent flash cut across the target, sparkles and shards of light.
  E.moonhit = {
    w: 150, h: 150, n: 6, fps: 24, px: 75, py: 75, loop: false,
    draw(ctx, i) {
      const c = 75;
      const q = i / 5;
      const R = rng(850 + i);
      starburst(ctx, LUNAR, c, c, 40 * (1 - q * 0.6), 7, 851, { inner: 0.4 });
      if (i < 4) {
        const r = 30 + i * 8;
        const pts = [];
        for (let j = 0; j <= 16; j++) { const t = -1 + (j / 16) * 2; pts.push([c + Math.cos(t) * r, c + Math.sin(t) * r]); }
        for (let j = 16; j >= 0; j--) { const t = -1 + (j / 16) * 2; const w = (10 - i * 2) * Math.cos((t * Math.PI) / 2); pts.push([c + Math.cos(t) * (r - w), c + Math.sin(t) * (r - w)]); }
        inked(ctx, pts, LUNAR[1], LUNAR[3], 2);
      }
      for (let j = 0; j < 7; j++) {
        const a = R() * TAU;
        const d = 20 + q * 50;
        if (j % 2) sparkle(ctx, LUNAR, c + Math.cos(a) * d, c + Math.sin(a) * d, 8 * (1 - q * 0.5), j);
        else shard(ctx, LUNAR, c + Math.cos(a) * d, c + Math.sin(a) * d, a, 12 * (1 - q * 0.6), 3);
      }
    },
  };

  // Comet Arrow in flight, looping: a giant gold arrowhead plunging point-first, a great tail of
  // fire streaming up behind it (deep orange outside, gold, a white-hot core), sparks peeling off
  // and flickering. Drawn pointing down; the game turns it along its fall. Its point is its anchor.
  E.comet = {
    w: 130, h: 290, n: 4, fps: 14, px: 65, py: 268, loop: true,
    draw(ctx, i) {
      const pal = PAL.hawk;
      const R = rng(620 + i);
      const c = 65;
      const tip = 268;
      const wob = (k) => Math.sin(k * 0.9 + i * 1.7) * 5;
      // The fire tail: three layers, widest at the head, licking off to the sides.
      for (const [w, col] of [[52, pal[4]], [42, pal[3]], [30, pal[2]], [17, pal[1]], [8, pal[0]]]) {
        const pts = Array.from({ length: 12 }, (_, k) => [c + wob(k) * (k / 11), 30 + k * 19]);
        fill(ctx, tube(pts, 2 + w * 0.15, w), col);
      }
      for (let j = 0; j < 7; j++) shard(ctx, pal, c + (R() - 0.5) * 70, 40 + R() * 170, -Math.PI / 2 + (R() - 0.5) * 0.8, 12 + R() * 10, 3);
      // The arrowhead, broad and steel-gold, ringed with a burst of light.
      starburst(ctx, pal, c, tip - 26, 34 + (i % 2) * 6, 8, 630 + i, { inner: 0.4 });
      inked(ctx, [[c, tip], [c - 20, tip - 40], [c - 6, tip - 34], [c, tip - 48], [c + 6, tip - 34], [c + 20, tip - 40]], pal[1], pal[4], 3.5);
      fill(ctx, [[c, tip - 6], [c - 9, tip - 34], [c, tip - 30]], pal[0]);
    },
  };

  // A star stuck in a monster, looping: a small gold star pulsing brighter and brighter.
  E.stuckstar = {
    w: 90, h: 90, n: 4, fps: 12, px: 45, py: 45, loop: true,
    draw(ctx, i) {
      sparkle(ctx, PAL.starlight, 45, 45, 18 + (i % 2) * 6, i * 0.2);
      if (i % 2) celRing(ctx, PAL.night, 45, 45, 30, 5, { broken: 0.5, seed: 360 + i });
    },
  };
  // A constellation (Galaxy Fall): gold stars pop in one by one over the monsters, lines of
  // indigo light join them into a great star, it holds blazing, then the stars streak down.
  E.constellation = (() => {
    const w = 420;
    const h = 300;
    const pts = [[210, 30], [262, 120], [380, 130], [290, 190], [330, 290], [210, 230], [90, 290], [130, 190], [40, 130], [158, 120]];
    const order = [0, 4, 8, 2, 6, 0];
    return {
      w, h, n: 10, fps: 14, px: 210, py: 160,
      draw(ctx, i) {
        const shown = Math.min(pts.length, i * 3 + 2);
        if (i >= 3 && i <= 6) {
          const k = Math.min(1, (i - 2) / 2);
          for (let j = 0; j < order.length - 1; j++) {
            const [x0, y0] = pts[order[j]];
            const [x1, y1] = pts[order[j + 1]];
            speedLine(ctx, PAL.night, x0, y0, lerp(x0, x1, k), lerp(y0, y1, k), 5);
          }
        }
        if (i <= 6) pts.slice(0, shown).forEach(([x, y], j) => sparkle(ctx, PAL.starlight, x, y, (j % 2 ? 12 : 18) * (i === 5 ? 1.25 : 1), j * 0.3));
        if (i >= 7) {
          const q = (i - 7) / 2;
          pts.forEach(([x, y], j) => {
            shard(ctx, j % 2 ? PAL.night : PAL.starlight, x, y + q * 60, Math.PI / 2, 26 * (1 - q * 0.4), 5);
            if (j % 3 === 0) sparkle(ctx, PAL.starlight, x, y + q * 90, 12 * (1 - q * 0.5), j);
          });
        }
      },
    };
  })();
  // Starlight building, looping: gold stars circling the night lord on a ring of indigo.
  E.starlightaura = {
    w: 180, h: 200, n: 8, fps: 12, px: 90, py: 190, loop: true,
    draw(ctx, i) {
      const t = (i / 8) * TAU;
      ctx.save();
      ctx.translate(90, 110);
      ctx.scale(1, 0.45);
      celCrescent(ctx, PAL.night, 0, 0, 70, t, t + 2, 12);
      ctx.restore();
      for (let j = 0; j < 4; j++) {
        const a = t + (j / 4) * TAU;
        sparkle(ctx, PAL.starlight, 90 + Math.cos(a) * 62, 110 + Math.sin(a) * 26 - j * 20, 12, a);
      }
    },
  };
  // The Night Lord's emblem: a gold throwing star on an indigo diamond.
  E.embstar = emblem(PAL.night, (ctx, pal) => {
    badge(ctx, pal, [[0, -60], [46, 0], [0, 60], [-46, 0]]);
    starburst(ctx, PAL.starlight, 0, 0, 40, 8, 371, { inner: 0.3 });
  });

  // ---------- The Mage (rose pink and mint: flowers, petals and light) ----------
  // A petal: a soft rounded teardrop with a notch at its tip, pink with a lighter middle, turned
  // to `a`.
  function petal(ctx, x, y, len, a, pal = PAL.bloom) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    const w = len * 0.42;
    const shape = (k) => {
      ctx.beginPath();
      ctx.moveTo(-len * 0.5 * k, 0);
      ctx.bezierCurveTo(-len * 0.2 * k, -w * k, len * 0.45 * k, -w * k, len * 0.5 * k, -w * 0.15 * k);
      ctx.lineTo(len * 0.36 * k, 0);
      ctx.lineTo(len * 0.5 * k, w * 0.15 * k);
      ctx.bezierCurveTo(len * 0.45 * k, w * k, -len * 0.2 * k, w * k, -len * 0.5 * k, 0);
      ctx.closePath();
    };
    shape(1);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = pal[4];
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = pal[2];
    ctx.fill();
    shape(0.7);
    ctx.fillStyle = pal[1];
    ctx.fill();
    shape(0.35);
    ctx.fillStyle = pal[0];
    ctx.fill();
    ctx.restore();
  }
  // A flower seen from the front: `n` petals round a mint-and-gold heart, opened `k` (0 a bud).
  function flower(ctx, x, y, r, k, rot = 0, pal = PAL.bloom, n = 5) {
    for (let j = 0; j < n; j++) {
      const a = rot + (j / n) * TAU - Math.PI / 2;
      petal(ctx, x + Math.cos(a) * r * 0.5 * k, y + Math.sin(a) * r * 0.5 * k, r * (0.6 + 0.4 * k), a, pal);
    }
    ctx.beginPath();
    ctx.arc(x, y, r * 0.3, 0, TAU);
    ctx.fillStyle = PAL.mint[4];
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, r * 0.24, 0, TAU);
    ctx.fillStyle = '#ffe17a';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x - r * 0.07, y - r * 0.07, r * 0.11, 0, TAU);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }
  E.streakbloom = streaks(PAL.bloom);
  // A petal bolt in flight, looping: a pink orb with petals turning round it.
  E.petalorb = {
    w: 140, h: 140, n: 4, fps: 14, px: 70, py: 70, loop: true,
    draw(ctx, i) {
      const t = (i / 4) * TAU;
      for (let j = 0; j < 4; j++) {
        const a = t + (j / 4) * TAU;
        petal(ctx, 70 + Math.cos(a) * 34, 70 + Math.sin(a) * 34, 30, a + Math.PI / 2);
      }
      ctx.beginPath();
      ctx.arc(70, 70, 24, 0, TAU);
      ctx.fillStyle = PAL.bloom[4];
      ctx.fill();
      ctx.beginPath();
      ctx.arc(70, 70, 21, 0, TAU);
      ctx.fillStyle = PAL.bloom[2];
      ctx.fill();
      ctx.beginPath();
      ctx.arc(66, 66, 13, 0, TAU);
      ctx.fillStyle = PAL.bloom[1];
      ctx.fill();
      ctx.beginPath();
      ctx.arc(63, 63, 6, 0, TAU);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    },
  };
  // Petals trailing behind a bolt, looping.
  E.petaltrail = {
    w: 180, h: 70, n: 3, fps: 16, px: 170, py: 35, loop: true,
    draw(ctx, i) {
      const R = rng(401 + i);
      speedLine(ctx, PAL.mint, 40, 35, 166, 35, 4);
      for (let j = 0; j < 4; j++) petal(ctx, 30 + j * 34 + R() * 10, 20 + R() * 30, 22 - j * 2, R() * TAU);
    },
  };
  // A spell landing: a flower pops open on the monster, then its petals scatter and mint
  // sparkles twinkle.
  E.bloomhit = {
    w: 200, h: 200, n: 6, fps: 22, px: 100, py: 100,
    draw(ctx, i) {
      const c = 100;
      if (i <= 2) flower(ctx, c, c, [24, 44, 50][i], [0.2, 0.9, 1][i], i * 0.2);
      if (i >= 2) {
        const k = (i - 2) / 3;
        const R = rng(411);
        for (let j = 0; j < 7; j++) {
          const a = (j / 7) * TAU + R() * 0.4;
          const d = 30 + k * 60;
          if (i < 5 || j % 2) petal(ctx, c + Math.cos(a) * d, c + Math.sin(a) * d + k * k * 20, 26 * (1 - k * 0.4), a + k * 3);
        }
        for (let j = 0; j < 3; j++) sparkle(ctx, PAL.mint, c - 40 + j * 40, c - 40 + (j % 2) * 70, 10 * (1.1 - k * 0.5), j);
      }
    },
  };
  // A storm of petals (Petal Storm), looping: swirls of mint wind laced with whirling petals.
  E.petalstorm = {
    w: 300, h: 220, n: 6, fps: 16, px: 150, py: 200, loop: true,
    draw(ctx, i) {
      const t = (i / 6) * TAU;
      for (let b = 0; b < 3; b++) {
        ctx.save();
        ctx.translate(150, 170 - b * 55);
        ctx.scale(1, 0.38);
        celCrescent(ctx, PAL.mint, 0, 0, 120 - b * 20, t + b, t + b + 2.2, 16);
        ctx.restore();
        for (let j = 0; j < 5; j++) {
          const a = t * (1 + b * 0.2) + (j / 5) * TAU + b;
          petal(ctx, 150 + Math.cos(a) * (110 - b * 20), 170 - b * 55 + Math.sin(a) * 30, 26, a * 2);
        }
      }
    },
  };
  // Healing light (Healing Bloom, Full Bloom's petals, a heal on the hero): a mint flower of
  // light opens at the feet, a column of mint light rises with plus-shaped sparkles, then petals.
  E.healbloom = {
    w: 220, h: 240, n: 7, fps: 18, px: 110, py: 220,
    draw(ctx, i) {
      const c = 110;
      const g = 210;
      if (i <= 4) {
        ctx.save();
        ctx.translate(c, g);
        ctx.scale(1, 0.4);
        flower(ctx, 0, 0, [30, 60, 80, 84, 80][i], [0.3, 0.8, 1, 1, 1][i], i * 0.15, PAL.mint, 6);
        ctx.restore();
      }
      if (i >= 1 && i <= 5) {
        const h = [0, 100, 170, 190, 180, 120][i];
        const half = [0, 14, 22, 20, 14, 8][i];
        inked(ctx, [[c - half, g], [c - half, g - h + half], [c, g - h], [c + half, g - h + half], [c + half, g]], PAL.mint[2], PAL.mint[4], 3);
        fill(ctx, [[c - half * 0.5, g], [c - half * 0.5, g - h + half], [c, g - h + 4], [c + half * 0.5, g - h + half], [c + half * 0.5, g]], PAL.mint[0]);
      }
      const k = i / 6;
      for (let j = 0; j < 5; j++) {
        const x = c + (j - 2) * 30;
        const y = g - 30 - k * 140 - (j % 2) * 30;
        if (i >= 2) {
          const r = 9 * (1.1 - k * 0.5);
          inked(ctx, [[x - r * 0.35, y - r], [x + r * 0.35, y - r], [x + r * 0.35, y - r * 0.35], [x + r, y - r * 0.35], [x + r, y + r * 0.35], [x + r * 0.35, y + r * 0.35], [x + r * 0.35, y + r], [x - r * 0.35, y + r], [x - r * 0.35, y + r * 0.35], [x - r, y + r * 0.35], [x - r, y - r * 0.35], [x - r * 0.35, y - r * 0.35]], j % 2 ? PAL.mint[1] : PAL.bloom[1], PAL.mint[4], 2.5);
        }
      }
      if (i >= 5) for (let j = 0; j < 6; j++) petal(ctx, c + (j - 2.5) * 30, g - 160 + (i - 5) * 30 + (j % 2) * 20, 20, j);
    },
  };
  // A bud of petals closing round the mage (Bloom Barrier), looping: petals curled into a soft
  // shell, swaying.
  E.budshield = {
    w: 200, h: 220, n: 4, fps: 8, px: 100, py: 200, loop: true,
    draw(ctx, i) {
      const sway = Math.sin((i / 4) * TAU) * 0.06;
      for (let j = 0; j < 6; j++) {
        const side = j % 2 ? 1 : -1;
        const row = Math.floor(j / 2);
        const x = 100 + side * (60 - row * 14);
        const y = 170 - row * 50;
        petal(ctx, x, y, 90 - row * 14, -Math.PI / 2 + side * (0.35 + row * 0.25) + sway);
      }
    },
  };
  // A giant flower of light blooming under the monsters (Garden of Light): a bud pushes up, the
  // great flower bursts open over a ring of little flowers, holds, and blows apart into petals.
  E.garden = {
    w: 420, h: 300, n: 9, fps: 14, px: 210, py: 260,
    draw(ctx, i) {
      const c = 210;
      const g = 260;
      if (i >= 1) for (let j = 0; j < 7; j++) {
        const x = c + (j - 3) * 56;
        flower(ctx, x, g - 8 - Math.abs(j - 3) * 2, 20, Math.min(1, (i - 1) / 2), j, j % 2 ? PAL.mint : PAL.bloom, 5);
      }
      const open = [0.1, 0.25, 0.6, 1, 1, 1, 0.9, 0, 0][i];
      const r = [30, 50, 80, 110, 120, 118, 110, 0, 0][i];
      if (open) {
        inked(ctx, [[c - 8, g], [c - 6, g - 80], [c + 6, g - 80], [c + 8, g]], PAL.mint[3], PAL.mint[4], 3);
        flower(ctx, c, g - 120, r, open, i * 0.1, PAL.bloom, 8);
        if (i >= 3 && i <= 5) for (let j = 0; j < 6; j++) sparkle(ctx, PAL.mint, c + Math.cos(j) * (r + 30), g - 120 + Math.sin(j) * (r + 20), 14, j);
      }
      if (i >= 6) {
        const k = (i - 6) / 2;
        for (let j = 0; j < 14; j++) {
          const a = (j / 14) * TAU;
          const d = 80 + k * 110;
          petal(ctx, c + Math.cos(a) * d, g - 120 + Math.sin(a) * d * 0.7 + k * 40, 34 * (1 - k * 0.4), a + k * 5, j % 3 ? PAL.bloom : PAL.mint);
        }
      }
    },
  };
  // Bloom building, looping: petals drifting up round the mage, a mint sparkle among them.
  E.bloomaura = {
    w: 170, h: 220, n: 8, fps: 10, px: 85, py: 210, loop: true,
    draw(ctx, i) {
      const R = rng(421);
      for (let j = 0; j < 6; j++) {
        const life = (i / 8 + j / 6) % 1;
        const side = j % 2 ? 1 : -1;
        const x = 85 + side * (24 + R() * 26) + Math.sin(life * 6 + j) * 10;
        const y = 200 - life * 170;
        const k = Math.sin(Math.PI * life);
        if (k < 0.15) continue;
        if (j % 3 === 2) sparkle(ctx, PAL.mint, x, y, 9 * k + 2, j);
        else petal(ctx, x, y, 22 * k + 6, life * 8 + j);
      }
    },
  };
  // The Mage's emblem: a pink flower on a mint leaf diamond.
  E.embbloom = emblem(PAL.bloom, (ctx, pal) => {
    badge(ctx, PAL.mint, [[0, -60], [46, 0], [0, 60], [-46, 0]]);
    flower(ctx, 0, 0, 44, 1, 0, pal, 5);
  });

  // ---------- Big versions ----------
  // Effects that play large (rings across a whole group, the magic circle, a whirlwind over an
  // area, the ground rupturing under a finisher) are listed under their own names. Drawn smooth in
  // HD, a big version is just its effect played at `bigK` (the game scales the one strip), so it
  // costs no extra art: `base` names the effect it plays.
  function big(e, k) {
    return {
      ...e,
      base: e,
      bigK: k,
      w: Math.ceil(e.w * k),
      h: Math.ceil(e.h * k),
      px: e.px * k,
      py: e.py * k,
      swing: e.swing ? [e.swing[0], e.swing[1], e.swing[2] * k] : undefined,
      draw(ctx, i) {
        ctx.save();
        ctx.scale(k, k);
        e.draw(ctx, i);
        ctx.restore();
      },
    };
  }
  for (const s of ['ring', 'ringholy', 'ringrage', 'ringwind', 'ringhawk', 'ringshadow', 'ringcrimson', 'ringnight', 'ringbloom', 'ringmint', 'ringstorm']) E[`${s}big`] = big(E[s], 2.6);
  E.gardenbig = big(E.garden, 1.3);
  E.petalstormbig = big(E.petalstorm, 1.2);
  E.redcrescentbig = big(E.redcrescent, 1.6);
  E.constellationbig = big(E.constellation, 1.3);
  E.crescentbig = big(E.crescent, 1.6);
  E.fissurebig = big(E.fissure, 1.5);
  E.fissuregoldbig = big(E.fissuregold, 1.5);
  E.fissureredbig = big(E.fissurered, 1.5);
  E.circlebig = big(E.circle, 2.4);
  E.spinbig = big(E.spin, 2);
  E.spinredbig = big(E.spinred, 2);
  E.spingoldbig = big(E.spingold, 2);
  E.quakebig = big(E.quake, 1.8);
  E.quakegoldbig = big(E.quakegold, 1.8);
  E.quakeredbig = big(E.quakered, 1.8);
  E.clawbig = big(E.claw, 1.7);
  E.gashbig = big(E.gash, 1.7);
  E.shockredbig = big(E.shockred, 2.6);

  // HD with a soft glow (the look the player picked): every drawing is rendered smooth at `d` strip
  // pixels per game pixel (the drawings are made at RAW drawing pixels per game pixel), and a soft
  // halo of its own bright colours (never its dark outlines) is laid behind it, GLOW game pixels
  // wide. The game draws the strips smoothed, so they stay sharp at any screen size.
  const RAW = 3.2;
  const GLOW = 2.5;
  function canvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }
  function render(e, i, d) {
    const K = d / RAW;
    const pad = Math.ceil(GLOW * d * 2.5);
    const W = Math.ceil(e.w * K) + pad * 2;
    const H = Math.ceil(e.h * K) + pad * 2;
    const art = canvas(W, H);
    const ax = art.getContext('2d');
    ax.translate(pad, pad);
    ax.scale(K, K);
    e.draw(ax, i);
    // Some art takes no glow (`glow: false`): a white-furred animal would turn to a blur in one.
    if (e.glow === false) return { canvas: art, px: e.px * K + pad, py: e.py * K + pad, r: null };
    // The glow comes from the bright parts only: alpha faded out over dark colours.
    const mask = canvas(W, H);
    const mx = mask.getContext('2d');
    mx.drawImage(art, 0, 0);
    const img = mx.getImageData(0, 0, W, H);
    const px = img.data;
    for (let j = 0; j < px.length; j += 4) {
      const lum = Math.max(px[j], px[j + 1], px[j + 2]);
      px[j + 3] *= Math.max(0, Math.min(1, (lum - 120) / 100));
    }
    mx.putImageData(img, 0, 0);
    const out = canvas(W, H);
    const ox = out.getContext('2d');
    ox.filter = `blur(${GLOW * d}px) brightness(1.18)`;
    ox.globalAlpha = 0.85;
    ox.drawImage(mask, 0, 0);
    ox.drawImage(mask, 0, 0);
    ox.filter = 'none';
    ox.globalAlpha = 1;
    ox.drawImage(art, 0, 0);
    return { canvas: out, px: e.px * K + pad, py: e.py * K + pad, r: e.swing ? e.swing[2] * K : null };
  }

  window.FXART = E;
  window.FXHD = { render, RAW };
})();
