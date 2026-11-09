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
    // The Berserker's rage: a white-hot ember core, ember orange, hot red, deep red, inked in deep
    // raspberry. Bright and fiery (the player asked for no black, no gore), so it sits with the
    // other jobs' light.
    rage: ['#fff0e2', '#ff7a4e', '#e8344e', '#b8183c', '#8e1f48'],
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

  // ---------- Shared palettes: midnight blue and gold, the mage reds ----------
  // docs/design/star-witch.md. Her shapes: five-point gold stars with white cores, midnight-blue
  // comet tails, and constellations (stars joined by thin gold lines).
  const NIGHT = ['#ffffff', '#9aa6f0', '#3a48b8', '#222a7e', '#0e123a'];

  const STARGOLD = ['#ffffff', '#fff4c8', '#ffd36a', '#e09a36', '#8e5228'];

  const MRUNE = ['#ffffff', '#ffd0d6', '#ff5a6a', '#c8324a', '#5a1a3a'];

  // ---------- The Mage (fire, ice and lightning, with her crimson runes) ----------
  // docs/design/mage-line.md. Her shapes: round fireballs trailing flame tongues (orange-gold, never
  // her crimson robes' red), faceted ice shards and spikes (pale blue), jagged lightning (yellow),
  // and her own signature on every hit: a crimson rune ring that flashes and breaks.
  const MFIRE = ['#ffffff', '#fff2a0', '#ffb43c', '#ff6a2a', '#9a2a3a'];

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
  // school, plus the rings for the Sniper's sight, the Mage's mint and the Ranger's sky.
  const PILLARS = ['steel', 'holy', 'rage', 'ice', 'wind', 'shadow', 'hawk', 'storm'];
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
  for (const s of [...PILLARS, 'sight', 'mint', 'sky']) E[s === 'steel' ? 'ring' : `ring${s}`] = ringBurst(PAL[s]);

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

  // A mount appearing or put away (render/mounts.js): a ring of pastel cloud puffs bursts out
  // round the rider, sparkles pop at its rim, then the puffs drift up and break into beads.
  const POOF = ['#ffffff', '#fff2fa', '#f6d8ee', '#d8bce8', '#8f6fae'];
  E.mountpoof = {
    w: 200, h: 170, n: 9, fps: 20, px: 100, py: 140,
    draw(ctx, i) {
      const k = i / 8;
      const u = Math.min(1, i / 3);
      const out = u * u * (3 - 2 * u);
      const fade = i > 4 ? (i - 4) / 4 : 0;
      for (let j = 0; j < 7; j++) {
        const a = Math.PI + (j / 6) * Math.PI;
        const d = 22 + out * 44;
        const r = (18 - j % 2 * 5) * (0.6 + out * 0.5) * (1 - fade * 0.75);
        if (r > 2) puff(ctx, POOF, 100 + Math.cos(a) * d, 128 + Math.sin(a) * d * 0.7 - k * 16, r, 300 + j, { holes: Math.max(0, fade * 1.2), lobes: 4 });
      }
      if (i < 6) puff(ctx, POOF, 100, 112 - k * 10, 28 * (1 - k * 0.8), 311, { holes: Math.max(0, (i - 2) / 3) });
      for (let j = 0; j < 5; j++) {
        const life = i - 1 - (j % 3);
        if (life < 0 || life > 4) continue;
        const a = -Math.PI / 2 + (j - 2) * 0.62;
        const d = 40 + life * 12;
        sparkle(ctx, POOF, 100 + Math.cos(a) * d, 120 + Math.sin(a) * d * 0.8, [6, 10, 8, 5, 3][life], 0.2 * j);
      }
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
  E.demonglow = glowOf(['rgba(255, 196, 120, 0.75)', 'rgba(255, 108, 72, 0.5)', 'rgba(232, 52, 78, 0.22)', 'rgba(232, 52, 78, 0)'], PAL.rage, 400);
  E.holyglow = glowOf(['rgba(255, 255, 240, 0.8)', 'rgba(255, 220, 120, 0.55)', 'rgba(255, 173, 98, 0.22)', 'rgba(255, 173, 98, 0)'], PAL.holy, 420);



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
    badge(ctx, pal, [[-46, -52], [46, -52], [46, 8], [0, 58], [-46, 8]]);
    tongue(ctx, PAL.fire, -14, 26, 13, 48, -6);
    tongue(ctx, PAL.fire, 14, 26, 13, 48, 6);
    tongue(ctx, PAL.fire, 0, 30, 18, 70, 2);
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
  // A soft violet storm cloud (no near-black underside).
  const CLOUD = { under: rgb('#4a4486'), mid: rgb('#7670b8'), top: rgb('#c2bcee'), lit: rgb('#faf4ff') };
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
  const THUNDERCLOUD = ['#c4bfee', '#8e88cc', '#6c66ae', '#56509a', '#3c3680'];
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
  // The same for a Paladin (gold) and a Berserker (blood red) using Titan Breaker.
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

  // ---------- The heal glow (every heal) ----------
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

  // ---------- Big versions ----------
  // Effects that play large (rings across a whole group, the magic circle, a whirlwind over an
  // area, the ground rupturing under a finisher) are listed under their own names. Drawn smooth in
  // HD, a big version is just its effect played at `bigK` (the game scales the one strip), so it
  // costs no extra art: `base` names the effect it plays.
  // ---------- Real light and fire (the Paladin and the Berserker) ----------
  // The player asked for the warrior paths to match the Stormcaller's realistic lightning and soft
  // cloud: light and fire have no outline; they glow, flicker and are shaped by noise. The Paladin
  // keeps her shapes (pillars, rings, stars, a shield, a sword of light) and the Berserker his
  // (fire, claws, torn ground, a black sun), drawn as real light and real fire.
  // `asLight` turns any drawing of `pal` into light: its ink line drops away and its tones grade
  // from a solid white-hot core out to a faint halo (the HD glow blooms it).
  function asLight(e, pal, { deep = 0.32, mid = 0.7, light = 0.95 } = {}) {
    const A = new Map([[pal[4], 0], [pal[3], deep], [pal[2], mid], [pal[1], light]]);
    const tint = (c) => {
      if (typeof c !== 'string' || !A.has(c)) return c;
      const [r, g, b] = rgb(c);
      return `rgba(${r}, ${g}, ${b}, ${A.get(c)})`;
    };
    return {
      ...e,
      draw(ctx, i) {
        const p = new Proxy(ctx, {
          get: (t, k) => (typeof t[k] === 'function' ? t[k].bind(t) : t[k]),
          set: (t, k, v) => {
            t[k] = k === 'fillStyle' || k === 'strokeStyle' ? tint(v) : v;
            return true;
          },
        });
        e.draw(p, i);
      },
    };
  }
  // A colour ramp from stops [value, '#hex'].
  const ramp = (stops) => {
    const S = stops.map(([v, h]) => [v, rgb(h)]);
    return (v) => {
      if (v <= S[0][0]) return S[0][1];
      for (let k = 1; k < S.length; k++) if (v <= S[k][0]) return mixc(S[k - 1][1], S[k][1], (v - S[k - 1][0]) / (S[k][0] - S[k - 1][0]));
      return S[S.length - 1][1];
    };
  };
  // Paints a field over (x0, y0, w, h): `f(x, y)` gives [value, alpha], `col(value)` its colour.
  function painted(ctx, x0, y0, w, h, f, col, S = 2) {
    const cw = Math.ceil(w / S);
    const ch = Math.ceil(h / S);
    const cv = document.createElement('canvas');
    cv.width = cw;
    cv.height = ch;
    const g = cv.getContext('2d');
    const img = g.createImageData(cw, ch);
    for (let y = 0; y < ch; y++) {
      for (let x = 0; x < cw; x++) {
        const [v, a] = f(x0 + x * S, y0 + y * S);
        if (a <= 0.01) continue;
        const c = col(v);
        const o = (y * cw + x) * 4;
        img.data[o] = c[0];
        img.data[o + 1] = c[1];
        img.data[o + 2] = c[2];
        img.data[o + 3] = Math.min(1, a) * 255;
      }
    }
    g.putImageData(img, 0, 0);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(cv, x0, y0, cw * S, ch * S);
    ctx.restore();
  }
  // A glowing stroke (halo, body, white-hot core) in a 4-tone light ramp [core, light, mid, deep].
  function glow(ctx, pts, w, L, a = 1) {
    strokePts(ctx, pts, w * 6, L[3], 0.18 * a);
    strokePts(ctx, pts, w * 3, L[2], 0.55 * a);
    strokePts(ctx, pts, w * 1.6, L[1], 0.95 * a);
    strokePts(ctx, pts, Math.max(1, w * 0.7), L[0], a);
  }
  // A soft glowing disc (an ellipse of light).
  function bloomDisc(ctx, x, y, rx, ry, L, a) {
    for (const [k, c, al] of [[1, L[3], 0.16], [0.6, L[2], 0.4], [0.32, L[1], 0.85], [0.14, L[0], 1]]) {
      ctx.save();
      ctx.globalAlpha *= al * a;
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(x, y, rx * k, ry * k, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }
  const SUN = ['#ffffff', '#fff3c4', '#ffd36a', '#f0a040'];
  const FLAME = ['#fff6e0', '#ffd27a', '#ff7a3a', '#c8102e'];
  const sunRamp = ramp([[0, '#f0a040'], [0.4, '#ffd36a'], [0.75, '#fff3c4'], [1, '#ffffff']]);
  const fireRamp = ramp([[0, '#b8183c'], [0.3, '#ea3438'], [0.55, '#ff6c34'], [0.8, '#ffc25a'], [1, '#fff6e2']]);
  // Cooling: white-hot, then yellow, orange, red, dull red.
  const COOL = [FLAME, FLAME, ['#ffd27a', '#ff7a3a', '#ea3438', '#c8204a'], ['#ff7a3a', '#ea3438', '#c8204a', '#a01c48'], ['#ea3438', '#c8204a', '#a01c48', '#8e1f48']];
  const cooled = (k) => COOL[Math.max(0, Math.min(COOL.length - 1, Math.floor(k * COOL.length)))];

  // The Paladin's swipes, whirls, dashes, gathering, war cry, plates, shield, sword of light, cross
  // and magic circle as light; the Berserker's as burning light.
  E.slashgold = asLight(E.slashgold, PAL.holy);
  E.spingold = asLight(E.spingold, PAL.holy);
  E.streakgold = asLight(E.streakgold, PAL.holy);
  E.chargegold = asLight(E.chargegold, PAL.holy);
  E.shoutgold = asLight(E.shoutgold, PAL.holy);
  E.platesgold = asLight(E.platesgold, PAL.holy);
  E.shield = asLight(E.shield, PAL.holy, { deep: 0.4, mid: 0.62 });
  E.sword = asLight(E.sword, PAL.holy);
  E.lightcross = asLight(E.lightcross, PAL.holy);
  E.circle = asLight(E.circle, PAL.holy, { deep: 0.5, mid: 0.8 });
  E.motes = asLight(E.motes, PAL.holy);
  // Shield Rush's wall: a tall honeycomb of golden light held up before the Paladin as she
  // marches, shimmering, a band of light sweeping down it again and again. Loops (the game holds
  // it up, then lets it fade as she plants the blade).
  E.lightwall = asLight({
    w: 120, h: 240, n: 6, fps: 14, px: 60, py: 228, loop: true,
    draw(ctx, i) {
      const pal = PAL.holy;
      const r = 15;
      const band = 228 - ((i / 6) * 260) % 260;
      for (let row = 0; row < 8; row++) {
        for (let col = -1; col <= 1; col++) {
          const x = 60 + col * r * 1.5;
          const y = 214 - row * r * 1.72 - (Math.abs(col) === 1 ? r * 0.86 : 0);
          if (y < 14) continue;
          const lit = Math.abs(y - band) < 26;
          const pts = [];
          for (let j = 0; j < 6; j++) pts.push([x + Math.cos((j * TAU) / 6) * r, y + Math.sin((j * TAU) / 6) * r]);
          inked(ctx, pts, pal[2], pal[3], 3);
          fill(ctx, pts.map(([px, py]) => [lerp(x, px, 0.78), lerp(y, py, 0.78)]), lit ? pal[1] : pal[2]);
          fill(ctx, pts.map(([px, py]) => [lerp(x, px, 0.4) - r * 0.12, lerp(y, py, 0.4) - r * 0.12]), lit ? pal[0] : pal[1]);
        }
      }
    },
  }, PAL.holy, { deep: 0.55, mid: 0.75 });
  E.slashred = asLight(E.slashred, PAL.rage, { deep: 0.28 });
  E.spinred = asLight(E.spinred, PAL.rage, { deep: 0.28 });
  E.streakred = asLight(E.streakred, PAL.rage, { deep: 0.45 });
  E.chargered = asLight(E.chargered, PAL.rage, { deep: 0.45 });
  E.shoutred = asLight(E.shoutred, PAL.rage, { deep: 0.45 });
  E.platesred = asLight(E.platesred, PAL.rage, { deep: 0.45 });
  E.shieldred = asLight(E.shieldred, PAL.rage, { deep: 0.5 });
  // His blow landing: a white-hot flash, short hot rays bursting out of it and sparks flying,
  // cooling as they go.
  E.hitred = {
    w: 200, h: 200, n: 6, fps: 30, px: 100, py: 100,
    draw(ctx, i) {
      const a = [1, 1, 0.85, 0.6, 0.35, 0.15][i];
      bloomDisc(ctx, 100, 100, [30, 48, 40, 28, 16, 8][i], [30, 48, 40, 28, 16, 8][i], FLAME, a);
      const R = rng(23);
      for (let j = 0; j < 9; j++) {
        const ang = (j / 9) * TAU + R() * 0.5;
        const r0 = [6, 14, 30, 46, 58, 66][i];
        const r1 = r0 + [30, 46, 34, 22, 14, 8][i] * (0.7 + R() * 0.6);
        glow(ctx, [[100 + Math.cos(ang) * r0, 100 + Math.sin(ang) * r0], [100 + Math.cos(ang) * r1, 100 + Math.sin(ang) * r1 + i * i]], 2 - i * 0.25, cooled(i / 6), a);
      }
    },
  };

  // Pillar of light (her buffs, Judgment, the pillars on her hits): a shaft of sunlight falling
  // from above, brightest at its heart, rays shimmering down it, motes drifting in it, a pool of
  // light on the ground.
  E.pillarholy = {
    w: 150, h: 330, n: 8, fps: 20, px: 75, py: 318,
    draw(ctx, i) {
      const a = [0.4, 1, 1, 0.95, 0.85, 0.6, 0.35, 0.15][i];
      const wid = [14, 56, 52, 48, 42, 30, 18, 9][i];
      const t = i / 8;
      painted(ctx, 0, 0, 150, 330, (x, y) => {
        const core = Math.max(0, 1 - Math.abs(x - 75) / (wid * (0.75 + 0.35 * (1 - y / 330))));
        const rays = 0.75 + 0.5 * (fbm(x / 7, y / 120 - t * 2, 3) - 0.5);
        const v = Math.pow(core, 1.3) * rays * sstep(0, 70, y) * sstep(330, 300, y) * a;
        return [v * 1.4, v * 1.3];
      }, sunRamp);
      bloomDisc(ctx, 75, 318, wid * 1.6, wid * 0.4, SUN, a);
      const R = rng(700);
      for (let j = 0; j < 12; j++) {
        const life = (t + j / 12) % 1;
        bloomDisc(ctx, 75 + (R() - 0.5) * wid * 2, 300 - life * 260, 3.2, 3.2, SUN, a * Math.sin(life * Math.PI));
      }
    },
  };
  // Her ring: a wave of light washing out over the ground, its rim brightest, fading as it spreads.
  E.ringholy = {
    w: 260, h: 260, n: 6, fps: 24, px: 130, py: 130,
    draw(ctx, i) {
      const r = [40, 70, 92, 106, 116, 122][i];
      const a = [1, 1, 0.8, 0.55, 0.3, 0.12][i];
      painted(ctx, 0, 0, 260, 260, (x, y) => {
        const d = Math.hypot(x - 130, y - 130);
        const rim = Math.exp(-(((d - r) / (6 + i * 2)) ** 2));
        const v = (rim + (d < r ? 0.25 * (d / r) ** 2 : 0)) * a * (0.85 + 0.3 * (fbm(Math.atan2(y - 130, x - 130) * 3, i, 2) - 0.5));
        return [v, v * 1.2];
      }, sunRamp);
    },
  };
  // Her hit: a flare of light on the monster, a blazing core with long thin rays (sun catching a
  // lens, not a cartoon star), a soft halo, dimming away.
  E.holyhit = {
    w: 220, h: 220, n: 7, fps: 24, px: 110, py: 110,
    draw(ctx, i) {
      const c = 110;
      const a = [0.7, 1, 1, 0.8, 0.55, 0.3, 0.12][i];
      const len = [40, 70, 100, 110, 96, 74, 50][i];
      bloomDisc(ctx, c, c, 56 * a + 16, 56 * a + 16, SUN, a);
      for (const [ang, k] of [[0, 1], [Math.PI / 2, 1], [Math.PI / 4, 0.45], [-Math.PI / 4, 0.45]]) {
        const dx = Math.cos(ang) * len * k;
        const dy = Math.sin(ang) * len * k;
        glow(ctx, [[c - dx, c - dy], [c, c], [c + dx, c + dy]], 2.6 * k + 0.6, SUN, a);
      }
      bloomDisc(ctx, c, c, 18 * a + 6, 18 * a + 6, SUN, 1);
    },
  };
  // A heavy blow of hers bursting light up out of the ground (where a Warrior's throws up rock):
  // a flash, rays fanning up, dust billowing soft out either side.
  E.quakegold = {
    w: 280, h: 220, n: 9, fps: 22, px: 140, py: 200,
    draw(ctx, i) {
      const g = 200;
      const a = [0.8, 1, 1, 0.85, 0.7, 0.5, 0.35, 0.2, 0.08][i];
      const k = i / 8;
      painted(ctx, 0, 60, 280, 160, (x, y) => {
        const d = Math.hypot((x - 140) / (60 + k * 90), (y - g) / (24 + k * 30));
        const v = Math.max(0, 1 - d) * (0.6 + 0.8 * (fbm(x / 20 + i * 0.3, y / 20, 4) - 0.5)) * Math.min(1, a * 1.5);
        return [0.5, sstep(0, 0.3, v) * 0.8];
      }, () => rgb('#efe2d2'));
      for (let j = -2; j <= 2; j++) glow(ctx, [[140, g], [140 + j * 30 * (0.6 + k), g - 100 * (0.5 + k)]], 2.2 - Math.abs(j) * 0.5, SUN, a * (1 - Math.abs(j) * 0.25));
      bloomDisc(ctx, 140, g - 6, 70 * a, 24 * a, SUN, a);
    },
  };

  // The Berserker's fire: real flame shaped by rising noise, white-hot at the base, yellow, orange,
  // then deep red tongues tearing off at the top, embers rising. Loops.
  E.ragefire = {
    w: 140, h: 170, n: 8, fps: 16, px: 70, py: 150, loop: true,
    draw(ctx, i) {
      const T = i / 8;
      painted(ctx, 0, 0, 140, 170, (x, y) => {
        const up = (150 - y) / 130;
        if (up < -0.1) return [0, 0];
        const n = (k) => fbm(x / 22, y / 22 + (T + k) * 4, 5);
        const flick = n(0) * (1 - T) + n(-1) * T;
        const body = 1 - Math.abs(x - 70 + (flick - 0.5) * 44 * up) / Math.max(4, 60 * (1 - up * 0.6));
        const v = (body * 1.05 + (flick - 0.5) * 1.8 - up * 0.85) * sstep(-0.1, 0.08, up) * sstep(170, 140, y + 20) * sstep(0, 40, y);
        return [v * 1.3, sstep(0.03, 0.45, v)];
      }, fireRamp);
      const R = rng(720);
      for (let j = 0; j < 7; j++) {
        const life = (T * 2 + j / 7) % 1;
        const x = 50 + R() * 40 + Math.sin(life * 9 + j) * 8;
        const y = 70 - life * 70;
        glow(ctx, [[x, y], [x + 1, y - 5]], 1.1 * (1 - life) + 0.3, FLAME, 1 - life);
      }
    },
  };
  // Torn ground: the earth cracks open where the blow lands, jagged cracks running out both ways
  // glowing with fire inside, a flare at the heart and sparks rising, cooling to dull seams.
  E.gash = {
    w: 300, h: 150, n: 8, fps: 20, px: 150, py: 110,
    draw(ctx, i) {
      const heat = [1, 1, 0.95, 0.85, 0.7, 0.5, 0.3, 0.15][i];
      const run = Math.min(1, 0.35 + i * 0.3);
      const L = cooled(1 - heat);
      for (const [dx, dy, seed] of [[-1, 0.08, 11], [1, -0.05, 12], [-0.7, -0.22, 13], [0.75, 0.2, 14]]) {
        const x1 = 150 + dx * 130 * run;
        const y1 = 110 + dy * 130 * run * 0.35;
        glow(ctx, zig(150, 110, x1, y1, 7, 7, seed), 2.6 * heat + 0.6, L, heat);
      }
      if (i <= 3) bloomDisc(ctx, 150, 110, [24, 40, 34, 22][i], [9, 14, 12, 8][i], FLAME, 0.9);
      const R = rng(731);
      for (let j = 0; j < 9; j++) {
        const life = Math.min(1, (i + R() * 2) / 8);
        const x = 60 + R() * 180;
        const y = 110 - life * 70;
        glow(ctx, [[x, y], [x, y - 6]], 1.2 * (1 - life) + 0.3, FLAME, (1 - life) * heat * 1.1);
      }
    },
  };

  // His hit: a fiery cut crossing a second, white-hot where they meet, a flare of flame there and
  // sparks flying off, cooling from gold to red as they fade.
  E.claw = {
    w: 200, h: 200, n: 7, fps: 26, px: 100, py: 100,
    draw(ctx, i) {
      const a = [0.8, 1, 1, 0.85, 0.6, 0.35, 0.15][i];
      const L = cooled(i / 7);
      const cut = (x0, y0, x1, y1, grow) => {
        const pts = [];
        for (let k = 0; k <= 10; k++) {
          const t = (k / 10) * grow;
          pts.push([x0 + (x1 - x0) * t + Math.sin(t * Math.PI) * 6, y0 + (y1 - y0) * t]);
        }
        glow(ctx, pts, i < 3 ? 5 : 4, L, a);
      };
      cut(48, 52, 152, 148, Math.min(1, 0.5 + i * 0.5));
      if (i >= 1) cut(150, 58, 52, 142, Math.min(1, i * 0.6));
      if (i >= 1 && i <= 4) bloomDisc(ctx, 100, 100, [0, 30, 36, 26, 14][i], [0, 30, 36, 26, 14][i], FLAME, 0.9);
      if (i >= 2) {
        const R = rng(741);
        for (let j = 0; j < 8; j++) {
          const ang = R() * TAU;
          const d = 24 + (i - 1) * 14 * (0.6 + R() * 0.8);
          const x = 100 + Math.cos(ang) * d;
          const y = 100 + Math.sin(ang) * d * 0.7 + (i - 2) ** 2 * 3;
          glow(ctx, [[x, y], [x - Math.cos(ang) * 6, y - Math.sin(ang) * 6]], 1.3, FLAME, a);
        }
      }
    },
  };

  // Embers climbing on a hot wind (his power, in place of a pillar): sparks of fire flicking side
  // to side, cooling from white-hot to red as they rise. Loops.
  E.embers = {
    w: 140, h: 240, n: 8, fps: 14, px: 70, py: 225, loop: true,
    draw(ctx, i) {
      const R = rng(97);
      const sparks = Array.from({ length: 18 }, (_, j) => ({ x: 70 + (R() - 0.5) * 80, phase: j / 18 + R() * 0.05, len: 6 + R() * 8, sway: 6 + R() * 10, rate: 1 + Math.round(R()) }));
      for (const sp of sparks) {
        const life = ((i / 8) * sp.rate + sp.phase) % 1;
        const x = sp.x + Math.sin(life * 7 + sp.phase * 9) * sp.sway * (0.3 + life);
        const y = 220 - life * 200;
        const dx = Math.cos(life * 7 + sp.phase * 9) * 3;
        glow(ctx, [[x, y], [x - dx, y + sp.len * 1.5 * (1 - life * 0.5)]], 2.6 * (1 - life * 0.55), cooled(life), 1 - life * 0.6);
      }
    },
  };

  // Molten cracks splitting the ground round him at full Rage, glowing and pulsing (fire's light,
  // no outline). Loops.
  E.ragecracks = {
    w: 300, h: 70, n: 4, fps: 8, px: 150, py: 35, loop: true,
    draw(ctx, i) {
      const pulse = [0.7, 1, 0.85, 0.6][i];
      const R = rng(77);
      for (let j = 0; j < 9; j++) {
        const ang = (j / 9) * TAU + R() * 0.3;
        const pts = [[150, 35]];
        const len = 70 + R() * 70;
        for (let k = 1; k <= 5; k++) pts.push([150 + (Math.cos(ang) * (len * k)) / 5 + (R() - 0.5) * 14, 35 + ((Math.sin(ang) * (len * k)) / 5) * 0.28 + (R() - 0.5) * 6]);
        glow(ctx, pts, 2.2 * pulse, FLAME, pulse);
      }
    },
  };
  // His jagged shockwave as fire: a ring of flame and torn dust ripping out from the blow, ragged
  // at its leading edge, burning out as it spreads. Drawn round; laid flat in the game.
  E.shockred = {
    w: 260, h: 260, n: 6, fps: 24, px: 130, py: 130,
    draw(ctx, i) {
      const r = [36, 66, 90, 104, 114, 120][i];
      const heat = [1, 1, 0.85, 0.6, 0.35, 0.15][i];
      painted(ctx, 0, 0, 260, 260, (x, y) => {
        const d = Math.hypot(x - 130, y - 130);
        const ang = Math.atan2(y - 130, x - 130);
        const rag = (fbm(ang * 4 + 7, i * 0.7, 4) - 0.5) * 26;
        const band = 1 - Math.abs(d - r - rag * 0.5) / (9 + i * 1.5);
        if (band <= 0) return [0, 0];
        return [0.3 + band * heat * (0.8 + 0.5 * fbm(ang * 9, d / 10, 3)), sstep(0, 0.5, band) * heat * (0.6 + 0.8 * fbm(ang * 5 + 3, i, 3))];
      }, fireRamp);
    },
  };
  // A heavy blow (and a monster's bleeding): a flash, then hot sparks spraying out and arcing
  // down, cooling as they go (no blood: the player asked for none).
  E.blood = {
    w: 200, h: 200, n: 6, fps: 22, px: 100, py: 90,
    draw(ctx, i) {
      const a = [1, 1, 0.85, 0.6, 0.35, 0.15][i];
      if (i <= 2) bloomDisc(ctx, 100, 90, [26, 40, 30][i], [26, 40, 30][i], FLAME, 1);
      const R = rng(29);
      for (let j = 0; j < 12; j++) {
        const ang = -Math.PI * (0.05 + R() * 0.9);
        const sp = 40 + R() * 40;
        const t = (i + 1) / 6;
        const x = 100 + Math.cos(ang) * sp * t * 1.6;
        const y = 90 + Math.sin(ang) * sp * t * 1.6 + t * t * 40;
        glow(ctx, [[x, y], [x - Math.cos(ang) * 9, y - Math.sin(ang) * 9]], 1.5, cooled(t * 0.8), a);
      }
    },
  };
  // The blood moon of his Crimson Eclipse: a blazing red moon, white-hot at its heart, in a corona
  // of real fire licking off it, churning. Loops.
  E.eclipse = {
    w: 260, h: 260, n: 6, fps: 12, px: 130, py: 130, loop: true,
    draw(ctx, i) {
      const T = i / 6;
      painted(ctx, 0, 0, 260, 260, (x, y) => {
        const d = Math.hypot(x - 130, y - 130);
        if (d < 60) return [0.62 + 0.38 * (1 - d / 60) ** 2, 1];
        const ang = Math.atan2(y - 130, x - 130);
        const n = (k) => fbm(Math.cos(ang) * 3 + 5, Math.sin(ang) * 3 + (d / 30) - (T + k) * 3, 5);
        const flick = n(0) * (1 - T) + n(-1) * T;
        const v = 1 - (d - 60) / (14 + flick * 70);
        if (v <= 0) return [0, 0];
        return [0.2 + v * 0.9 + (flick - 0.5) * 0.3, sstep(0, 0.3, v)];
      }, fireRamp);
    },
  };

  // ---------- Real steel (the Warrior) ----------
  // The Warrior followed the paths (the player asked for it): his steel blue and white as real
  // light and real motion, no outline. His cut is a motion blur behind the blade, a razor-bright
  // edge smearing back into a fading cold wake; his hit two bright cuts crossing with sparks of
  // struck metal flying off; his ring a ring of rushing air; his pillar cold light with sheen
  // sliding up it like light along a blade. The rest of his drawings go through `asLight`.
  const STEELL = ['#ffffff', '#e6f4ff', '#9fd2ff', '#5a86e0'];
  const SPARK = ['#ffffff', '#fff2cc', '#ffc070', '#ff8a3a'];
  const steelRamp = ramp([[0, '#5a86e0'], [0.4, '#9fd2ff'], [0.75, '#e6f4ff'], [1, '#ffffff']]);
  // A four-point glint (light catching an edge).
  const glint = (ctx, x, y, r, a) => {
    glow(ctx, [[x - r, y], [x + r, y]], 1.2, STEELL, a);
    glow(ctx, [[x, y - r], [x, y + r]], 1.2, STEELL, a);
  };
  // The motion-blur cut along the swipe's own arc (same geometry and swing as `swipe`).
  E.slash = {
    w: 260, h: 200, n: 8, fps: 30, px: 130, py: 150, swing: [-Math.PI / 2, 1, 100],
    draw(ctx, i) {
      const cx = 130;
      const cy = 150;
      const R = 100;
      const a0 = (-168 * Math.PI) / 180;
      const a1 = (-12 * Math.PI) / 180;
      const head = [0.45, 1, 1, 1, 1, 1, 1, 1][i];
      const tail = [0.1, 0, 0.05, 0.25, 0.45, 0.65, 0.8, 0.92][i];
      const a = [0.8, 1, 1, 0.85, 0.65, 0.45, 0.25, 0.1][i];
      const N = 40;
      for (let k = 0; k < N; k++) {
        const u = k / N;
        if (u < tail || u > head) continue;
        const v = (u - tail) / Math.max(0.01, head - tail);
        const th = 4 + 26 * Math.pow(v, 1.5);
        for (const [rr, w, c, al] of [[R - th * 0.5, th * 1.2, STEELL[3], 0.35], [R - th * 0.35, th * 0.7, STEELL[2], 0.7], [R - 3, 7, STEELL[1], 0.95], [R - 1.5, 3, STEELL[0], 1]]) {
          ctx.save();
          ctx.globalAlpha *= al * a * (0.45 + 0.55 * v);
          ctx.strokeStyle = c;
          ctx.lineWidth = w;
          ctx.beginPath();
          ctx.arc(cx, cy, rr, a0 + (a1 - a0) * u, a0 + (a1 - a0) * (u + 1 / N));
          ctx.stroke();
          ctx.restore();
        }
      }
      if (i >= 1 && i <= 3) glint(ctx, cx + Math.cos(a1) * R, cy + Math.sin(a1) * R, 18, 1 - (i - 1) * 0.3);
    },
  };
  // His hit: two bright cuts crossing, a glint where they meet, hot sparks of struck metal flying
  // off and falling.
  E.cross = {
    w: 200, h: 200, n: 6, fps: 30, px: 100, py: 100,
    draw(ctx, i) {
      const a = [1, 1, 0.8, 0.55, 0.3, 0.12][i];
      const len = [50, 70, 74, 70, 60, 50][i];
      bloomDisc(ctx, 100, 100, 30 * a + 8, 30 * a + 8, STEELL, a * 0.9);
      for (const sd of [-1, 1]) glow(ctx, [[100 - len * 0.7, 100 - sd * len * 0.7], [100 + len * 0.7, 100 + sd * len * 0.7]], 2.2 * a + 0.6, STEELL, a);
      const R = rng(800);
      if (i >= 1) {
        for (let j = 0; j < 10; j++) {
          const ang = R() * TAU;
          const d = (i - 0.5) * (18 + R() * 16);
          const x = 100 + Math.cos(ang) * d;
          const y = 100 + Math.sin(ang) * d + (i - 1) ** 2 * 3;
          glow(ctx, [[x, y], [x - Math.cos(ang) * 7, y - Math.sin(ang) * 7]], 1.1, SPARK, Math.min(1, a * 1.2));
        }
      }
      if (i <= 2) glint(ctx, 100, 100, 22, 1);
    },
  };
  // His ring: a ring of displaced air racing out, a pale bright rim and a faint wash behind it.
  E.ring = {
    w: 260, h: 260, n: 6, fps: 24, px: 130, py: 130,
    draw(ctx, i) {
      const r = [40, 70, 92, 106, 116, 122][i];
      const a = [1, 1, 0.8, 0.55, 0.3, 0.12][i];
      painted(ctx, 0, 0, 260, 260, (x, y) => {
        const d = Math.hypot(x - 130, y - 130);
        const v = (Math.exp(-(((d - r) / (4 + i * 2)) ** 2)) + (d < r ? 0.18 * (d / r) ** 3 : 0)) * a * (0.8 + 0.4 * (fbm(Math.atan2(y - 130, x - 130) * 4, i, 2) - 0.5));
        return [v, v * 1.1];
      }, steelRamp);
    },
  };
  // His pillar: cold steel-blue light rising from his feet, sheen sliding up it like light along a
  // blade, glints flashing up it, a pool of cold light on the ground.
  E.pillar = {
    w: 150, h: 330, n: 8, fps: 20, px: 75, py: 318,
    draw(ctx, i) {
      const a = [0.4, 1, 1, 0.95, 0.85, 0.6, 0.35, 0.15][i];
      const wid = [10, 40, 38, 36, 32, 24, 14, 7][i];
      const t = i / 8;
      painted(ctx, 0, 0, 150, 330, (x, y) => {
        const core = Math.max(0, 1 - Math.abs(x - 75) / wid);
        const sheen = 0.7 + 0.6 * Math.pow(Math.max(0, Math.sin((y / 330 - t * 2) * Math.PI * 3)), 6);
        const v = Math.pow(core, 0.9) * sheen * sstep(0, 80, y) * sstep(330, 300, y) * a;
        return [v * 1.2, v * 1.2];
      }, steelRamp);
      bloomDisc(ctx, 75, 318, wid * 1.8, wid * 0.45, STEELL, a);
      const R = rng(810);
      for (let j = 0; j < 5; j++) {
        const life = (t * 1.5 + j / 5) % 1;
        glint(ctx, 75 + (R() - 0.5) * wid * 1.4, 300 - life * 260, 8 * Math.sin(life * Math.PI) * a, a);
      }
    },
  };
  // A heavy blow cracking the ground: dust billowing out soft, chips of rock flung up (no outline),
  // sparks off the struck stone.
  E.quake = {
    w: 280, h: 220, n: 9, fps: 22, px: 140, py: 200,
    draw(ctx, i) {
      const g = 200;
      const a = [0.8, 1, 1, 0.85, 0.7, 0.5, 0.35, 0.2, 0.08][i];
      const k = i / 8;
      painted(ctx, 0, 60, 280, 160, (x, y) => {
        const d = Math.hypot((x - 140) / (60 + k * 90), (y - g + 10) / (24 + k * 34));
        const v = Math.max(0, 1 - d) * (0.6 + 0.8 * (fbm(x / 20 + i * 0.3, y / 20, 4) - 0.5)) * Math.min(1, a * 1.5);
        return [0.5, sstep(0, 0.3, v) * 0.85];
      }, () => rgb('#e2dcd6'));
      const R = rng(820);
      for (let j = 0; j < 9; j++) {
        const ang = -Math.PI * (0.15 + R() * 0.7);
        const d = 20 + (i + 0.5) * (12 + R() * 10);
        const x = 140 + Math.cos(ang) * d;
        const y = g + Math.sin(ang) * d + (i * 0.9) ** 2 * 2.4;
        const r = (4 + R() * 4) * (1 - k * 0.4);
        fill(ctx, [[x - r, y], [x - r * 0.3, y - r], [x + r, y - r * 0.4], [x + r * 0.5, y + r * 0.7]], '#6e625e');
        fill(ctx, [[x - r * 0.6, y - r * 0.2], [x - r * 0.2, y - r * 0.8], [x + r * 0.5, y - r * 0.4]], '#a39890');
      }
      if (i < 4) for (let j = 0; j < 6; j++) {
        const ang = -Math.PI * (0.2 + R() * 0.6);
        const d = (i + 1) * 14;
        glow(ctx, [[140 + Math.cos(ang) * d, g + Math.sin(ang) * d], [140 + Math.cos(ang) * (d - 8), g + Math.sin(ang) * (d - 8)]], 1, SPARK, a);
      }
    },
  };
  E.spin = asLight(E.spin, PAL.steel);
  E.streak = asLight(E.streak, PAL.steel);
  E.charge = asLight(E.charge, PAL.steel);
  E.shout = asLight(E.shout, PAL.steel);
  E.plates = asLight(E.plates, PAL.steel);
  E.shieldsteel = asLight(E.shieldsteel, PAL.steel, { deep: 0.4, mid: 0.62 });
  E.valor = asLight(E.valor, PAL.steel);

  // ---------- Real moonlight and smoke (the Thief) ----------
  // The Thief brought up to the realistic style the other jobs now have (the player asked): her
  // violet and midnight with moonlight silver, as light, motion and smoke with no outline. Her cuts
  // are thin, fast motion blurs (finer and quicker than the Warrior's), her hit a sharp silver glint
  // where two cuts cross with violet sparks, her smoke soft and curling (a noise field like the
  // Stormcaller's cloud), her moons real moonlight (a pale silver disc with soft grey seas and a
  // halo), the finishers' crescent a great blade of moonlight, a star's wake a fading streak.
  const VIOL = ['#ffffff', '#efe6ff', '#b39cff', '#5a3fb8'];
  const SILV = ['#ffffff', '#f4f2ff', '#d6d2f2', '#8c86c0'];
  const violSmoke = ramp([[0, '#4a3a7a'], [0.4, '#7a68b0'], [0.75, '#b4a6e0'], [1, '#ece6ff']]);
  const crescentRamp = ramp([[0, '#4a3498'], [0.35, '#8a6ee0'], [0.7, '#d6ccff'], [1, '#ffffff']]);
  const moonRamp = ramp([[0, '#9a96bc'], [0.5, '#d8d6ee'], [0.85, '#f4f2ff'], [1, '#ffffff']]);
  // A motion-blur cut along the swipe's arc (the shape and swing every blade swipe has).
  function blurCut(L, edge, thick) {
    return {
      w: 260, h: 200, n: 8, fps: 30, px: 130, py: 150, swing: [-Math.PI / 2, 1, 100],
      draw(ctx, i) {
        const cx = 130;
        const cy = 150;
        const R = 100;
        const a0 = (-168 * Math.PI) / 180;
        const a1 = (-12 * Math.PI) / 180;
        const head = [0.5, 1, 1, 1, 1, 1, 1, 1][i];
        const tail = [0.15, 0.05, 0.15, 0.35, 0.55, 0.72, 0.85, 0.94][i];
        const a = [0.85, 1, 1, 0.8, 0.6, 0.4, 0.22, 0.1][i];
        const N = 40;
        for (let k = 0; k < N; k++) {
          const u = k / N;
          if (u < tail || u > head) continue;
          const v = (u - tail) / Math.max(0.01, head - tail);
          const th = 3 + thick * Math.pow(v, 1.6);
          for (const [rr, w, c, al] of [[R - th * 0.5, th * 1.3, L[3], 0.5], [R - th * 0.4, th * 0.9, L[2], 0.85], [R - th * 0.2, th * 0.45, L[1], 0.9], [R - 2.5, 6, edge[1], 1], [R - 1.2, 3, edge[0], 1]]) {
            ctx.save();
            ctx.globalAlpha *= al * a * (0.45 + 0.55 * v);
            ctx.strokeStyle = c;
            ctx.lineWidth = w;
            ctx.beginPath();
            ctx.arc(cx, cy, rr, a0 + (a1 - a0) * u, a0 + (a1 - a0) * (u + 1 / N));
            ctx.stroke();
            ctx.restore();
          }
        }
        if (i >= 1 && i <= 3) {
          const gx = cx + Math.cos(a1) * R;
          const gy = cy + Math.sin(a1) * R;
          const g = 14 - (i - 1) * 4;
          glow(ctx, [[gx - g, gy], [gx + g, gy]], 1, SILV, 1);
          glow(ctx, [[gx, gy - g], [gx, gy + g]], 1, SILV, 1);
        }
      },
    };
  }
  E.slashshadow = blurCut(VIOL, SILV, 30);
  // Her hit: two thin bright cuts crossing on the monster, a silver glint where they meet, violet
  // sparks flicked off, dimming fast.
  E.shadowhit = {
    w: 200, h: 200, n: 6, fps: 28, px: 100, py: 100,
    draw(ctx, i) {
      const a = [1, 1, 0.8, 0.5, 0.28, 0.1][i];
      const len = [56, 84, 90, 86, 74, 60][i];
      bloomDisc(ctx, 100, 100, 30 * a + 8, 30 * a + 8, VIOL, a);
      for (const sd of [-1, 1]) glow(ctx, [[100 - len * 0.75, 100 - sd * len * 0.55], [100 + len * 0.75, 100 + sd * len * 0.55]], 2.6 * a + 0.5, VIOL, a);
      if (i <= 2) {
        glow(ctx, [[82, 100], [118, 100]], 1.2, SILV, 1);
        glow(ctx, [[100, 82], [100, 118]], 1.2, SILV, 1);
      }
      const R = rng(910);
      if (i >= 1) {
        for (let j = 0; j < 8; j++) {
          const ang = R() * TAU;
          const d = (i - 0.4) * (14 + R() * 14);
          const x = 100 + Math.cos(ang) * d;
          const y = 100 + Math.sin(ang) * d + (i - 1) ** 2 * 2;
          glow(ctx, [[x, y], [x - Math.cos(ang) * 6, y - Math.sin(ang) * 6]], 0.9, j % 3 ? VIOL : SILV, a);
        }
      }
    },
  };
  // The X-cut (each blink of Moonlit Assassination): two long cuts of moonlight crossing, a flash
  // where they meet, sparks scattering.
  E.xslash = {
    w: 260, h: 260, n: 6, fps: 22, px: 130, py: 130,
    draw(ctx, i) {
      const a = [0.9, 1, 1, 0.75, 0.45, 0.18][i];
      const len = [60, 110, 118, 112, 100, 90][i];
      bloomDisc(ctx, 130, 130, 36 * a + 8, 36 * a + 8, VIOL, a);
      glow(ctx, [[130 - len * 0.7, 130 - len * 0.7], [130 + len * 0.7, 130 + len * 0.7]], 3.8 * a + 0.6, VIOL, a);
      if (i > 0) glow(ctx, [[130 - len * 0.7, 130 + len * 0.7], [130 + len * 0.7, 130 - len * 0.7]], 3.8 * a + 0.6, VIOL, a);
      if (i <= 2) bloomDisc(ctx, 130, 130, 14, 14, SILV, 1);
      const R = rng(920);
      if (i >= 2) for (let j = 0; j < 10; j++) {
        const ang = R() * TAU;
        const d = 30 + (i - 1) * 22 * (0.6 + R() * 0.6);
        glow(ctx, [[130 + Math.cos(ang) * d, 130 + Math.sin(ang) * d], [130 + Math.cos(ang) * (d - 8), 130 + Math.sin(ang) * (d - 8)]], 1, j % 2 ? SILV : VIOL, a);
      }
    },
  };
  // Smoke: a soft violet cloud billowing out low from where she was, curling, thinning and
  // drifting apart (no outline, no balls).
  E.smoke = {
    w: 240, h: 200, n: 7, fps: 18, px: 120, py: 170,
    draw(ctx, i) {
      const k = i / 6;
      const T = i * 0.45;
      painted(ctx, 0, 0, 240, 200, (x, y) => {
        const d = Math.hypot((x - 120) / (58 + k * 56), (y - 140 + k * 26) / (38 + k * 34));
        const n = fbm(x / 26 + T, y / 26 - T * 0.6, 5);
        const edge = Math.min(sstep(0, 30, x), sstep(240, 210, x), sstep(0, 24, y));
        const v = ((1 - d) * 1.1 + (n - 0.5) * 1.4 - k * 0.55) * edge;
        return [Math.min(1, 0.25 + Math.max(0, n - 0.3) * 1.8 - (y - 100) / 300), sstep(0, 0.4, v) * (0.92 - k * 0.4)];
      }, violSmoke);
    },
  };
  // Shadow building, looping: wisps of violet smoke curling up round her, thin and soft.
  E.shadowaura = {
    w: 170, h: 220, n: 8, fps: 10, px: 85, py: 210, loop: true,
    draw(ctx, i) {
      const T = i / 8;
      painted(ctx, 0, 0, 170, 220, (x, y) => {
        const up = (210 - y) / 200;
        const n = (q) => fbm(x / 20 + 3, y / 22 + (T + q) * 3, 5);
        const flow = n(0) * (1 - T) + n(-1) * T;
        const ring = 1 - Math.abs(Math.abs(x - 85 + (flow - 0.5) * 40) - 40 * (1 - up * 0.5)) / 22;
        const edge = Math.min(sstep(0, 20, x), sstep(170, 150, x), sstep(0, 40, y));
        const v = (ring * 0.8 + (flow - 0.5) * 1.3 - up * 1.1) * edge * sstep(-0.05, 0.1, up);
        return [Math.min(1, 0.3 + Math.max(0, flow - 0.3) * 1.6 + up * 0.4), sstep(0, 0.5, v) * 0.55];
      }, violSmoke);
    },
  };
  // A moon (the finishers' night): real moonlight, a pale silver disc with soft grey seas, lit
  // from one side, in a glowing halo. Frames: rising faint, growing, full and bright, then it
  // flares and breaks into falling light (the gauntlet finisher bursts it).
  E.moon = {
    w: 320, h: 320, n: 6, fps: 12, px: 160, py: 160,
    draw(ctx, i) {
      const c = 160;
      const r = [40, 70, 84, 88, 90, 70][i];
      const a = [0.5, 0.8, 1, 1, 1, 0.5][i];
      const hal = a * (i === 4 ? 0.95 : 0.6);
      painted(ctx, 0, 0, 320, 320, (x, y) => {
        const d = Math.hypot(x - c, y - c) / r;
        if (d < 0.9) return [0, 0];
        return [0.75 - (d - 1) * 0.3, Math.exp(-((d - 1) ** 2) * 5) * hal];
      }, moonRamp, 3);
      painted(ctx, c - r - 2, c - r - 2, r * 2 + 4, r * 2 + 4, (x, y) => {
        const d = Math.hypot(x - c, y - c) / r;
        if (d > 1) return [0, 0];
        const seas = fbm(x / 24 + 4, y / 24 + 9, 4);
        const lit = 0.55 + 0.45 * ((c - x) / r * 0.5 + (c - y) / r * 0.3);
        return [Math.min(1, lit - (seas > 0.55 ? (seas - 0.55) * 1.4 : 0) - d * d * 0.15), sstep(1, 0.94, d) * a];
      }, moonRamp, 1);
      if (i === 5) {
        const R = rng(930);
        for (let j = 0; j < 14; j++) {
          const ang = R() * TAU;
          const d = r + 10 + R() * 40;
          glow(ctx, [[c + Math.cos(ang) * d, c + Math.sin(ang) * d], [c + Math.cos(ang) * (d + 8), c + Math.sin(ang) * (d + 8) + 6]], 1.2, j % 2 ? SILV : VIOL, 1);
        }
      }
    },
  };
  // The finishers' last blow: a great crescent of moonlight sweeping through the line, a thin
  // silver line first, opening into a blazing crescent with a violet halo, then thinning away.
  E.crescent = {
    w: 420, h: 260, n: 8, fps: 18, px: 210, py: 150,
    draw(ctx, i) {
      const a = [0.7, 1, 1, 1, 0.8, 0.55, 0.3, 0.12][i];
      const fat = [0.1, 0.6, 1, 1, 0.85, 0.6, 0.35, 0.15][i];
      const cx = 210;
      const cy = 300;
      const R = 230;
      const a0 = -Math.PI * 0.78;
      const a1 = -Math.PI * 0.22;
      const span = a1 - a0;
      painted(ctx, 0, 0, 420, 260, (x, y) => {
        const u = (Math.atan2(y - cy, x - cx) - a0) / span;
        if (u <= 0 || u >= 1) return [0, 0];
        const th = 4 + 46 * fat * Math.pow(Math.sin(Math.PI * u), 1.3);
        const d = (R - Math.hypot(x - cx, y - cy)) / th;
        if (d < -0.25 || d > 1.6) return [0, 0];
        const core = d < 0 ? 1 + d * 4 : Math.max(0, 1 - d);
        const haze = d < 0 ? sstep(-0.25, 0, d) : sstep(1.6, 0.3, d);
        const n = fbm(x / 30 + i, y / 30, 3);
        return [Math.min(1, core * 0.85 + (n - 0.5) * 0.2 + 0.1), Math.min(1, core * 0.9 + haze * 0.45) * a];
      }, crescentRamp);
      const edge = Array.from({ length: 41 }, (_, k) => {
        const ang = a0 + (span * k) / 40;
        return [cx + Math.cos(ang) * (R - 2), cy + Math.sin(ang) * (R - 2)];
      });
      glow(ctx, edge, 1.2 + fat, SILV, a);
      if (i >= 4) {
        const R2 = rng(940 + i);
        for (let j = 0; j < 10; j++) {
          const u = R2();
          const ang = a0 + (a1 - a0) * u;
          const d = R - 10 + (i - 3) * 8;
          glow(ctx, [[cx + Math.cos(ang) * d, cy + Math.sin(ang) * d], [cx + Math.cos(ang) * d + 6, cy + Math.sin(ang) * d + 4]], 1, j % 2 ? SILV : VIOL, a);
        }
      }
    },
  };
  // A thrown star's wake, looping: a soft violet streak fading behind it, a silver glint flicking.
  E.shadowtrail = {
    w: 170, h: 60, n: 3, fps: 18, px: 160, py: 30,
    draw(ctx, i) {
      for (const [dy, w, L, a] of [[0, 3.4, VIOL, 1], [-7, 1.4, SILV, 0.7], [7, 1.4, VIOL, 0.7]]) {
        const len = 110 + (i * 17) % 30;
        const pts = Array.from({ length: 12 }, (_, k) => [156 - (len * k) / 11, 30 + dy * (k / 11)]);
        for (let k = 0; k < 11; k++) glow(ctx, [pts[k], pts[k + 1]], w * (1 - k / 12), L, a * (1 - k / 11));
      }
    },
  };
  E.streakshadow = asLight(E.streakshadow, PAL.shadow);
  E.ringshadow = asLight(E.ringshadow, PAL.shadow);
  E.pillarshadow = asLight(E.pillarshadow, PAL.shadow);

  // ---------- The Thief's second paths: the Shinobi (ink) and the Kitsune (fox fire) ----------
  // Both in the realistic look (no outlines). The Shinobi is ink on paper come to life: her cuts
  // are wet brush strokes that dry out into bristle streaks at the tail, a hit is a splash of ink,
  // her smoke bombs are white smoke, her seals red paper tags that burst in a red circle, and her
  // finisher a giant fox painted in ink in one sweep of the brush (Okami's sumi-e brush; see
  // research/fx.md). The Kitsune is fox fire: blue flame with a white core and gold sparks, a
  // flame tail for each tail of her gauge, and a giant fox of blue fire with nine tails.
  // Ink: black sumi ink (the player's pick).
  const INKR = ramp([[0, '#07050b'], [0.45, '#241c2c'], [0.8, '#4a3e52'], [1, '#7a6a80']]);
  const SEAL = ['#ffffff', '#ffd6c8', '#ff6a4e', '#c81e28'];
  const FIRE = ['#ffffff', '#d8f6ff', '#5cb4ff', '#1e4ad6'];
  const FOXR = ramp([[0, '#0a1670'], [0.25, '#1838c8'], [0.5, '#2f7cff'], [0.72, '#66c4ff'], [0.9, '#d4f4ff'], [1, '#ffffff']]);
  const GOLD = ['#ffffff', '#fff3c4', '#ffd36a', '#e09a2a'];
  const SMOKEW = ramp([[0, '#6a6474'], [0.5, '#b4aebe'], [0.85, '#e8e4ee'], [1, '#ffffff']]);
  const PAPER = ramp([[0, '#d8cbb0'], [0.6, '#f2e8d2'], [1, '#fffaf0']]);
  // A cone capsule's distance (a segment whose radius runs from r0 to r1): the shapes the foxes
  // are built from.
  function cone(x, y, ax, ay, bx, by, r0, r1) {
    const dx = bx - ax;
    const dy = by - ay;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(x - ax - dx * t, y - ay - dy * t) - (r0 + (r1 - r0) * t);
  }
  const oval = (x, y, cx, cy, rx, ry) => (Math.hypot((x - cx) / rx, (y - cy) / ry) - 1) * Math.min(rx, ry);
  // A fox leaping to the right, about 360 by 200 (its rump at the left, nose at the right): the
  // signed distance to its edge (below 0 inside). `tails` is how many tails fan out behind it.
  function foxShape(x, y, tails = 1) {
    let d = Math.min(
      oval(x, y, 175, 128, 90, 38), oval(x, y, 245, 115, 42, 36), oval(x, y, 300, 88, 28, 24),
      cone(x, y, 250, 105, 295, 88, 26, 24), cone(x, y, 310, 92, 352, 104, 15, 5),
      cone(x, y, 292, 72, 296, 30, 11, 2), cone(x, y, 310, 70, 324, 34, 10, 2),
      cone(x, y, 262, 135, 318, 176, 12, 6), cone(x, y, 250, 140, 300, 188, 10, 5),
      cone(x, y, 130, 140, 70, 178, 18, 6), cone(x, y, 150, 145, 95, 190, 14, 5),
    );
    for (let k = 0; k < tails; k++) {
      const a = tails === 1 ? -2.5 : -1.5 - (k / (tails - 1)) * 2.1;
      const ex = 95 + Math.cos(a) * 110;
      const ey = 120 + Math.sin(a) * 90;
      const mx = 95 + Math.cos(a + 0.35) * 60;
      const my = 120 + Math.sin(a + 0.35) * 50;
      const w = tails === 1 ? 1 : 0.62;
      d = Math.min(d, cone(x, y, 100, 122, mx, my, 16 * w, 26 * w), cone(x, y, mx, my, ex, ey, 26 * w, 4));
    }
    return d;
  }

  // Her cut: a wet brush stroke of ink along the swing, thick in the middle and tapering, its
  // tail drying into bristle streaks; a thin red sheen runs along the outer edge, and a few drops
  // fly off the end.
  function inkCut(thick) {
    return {
      w: 260, h: 200, n: 8, fps: 30, px: 130, py: 150, swing: [-Math.PI / 2, 1, 100],
      draw(ctx, i) {
        const cx = 130;
        const cy = 150;
        const R = 100;
        const a0 = (-168 * Math.PI) / 180;
        const a1 = (-12 * Math.PI) / 180;
        const head = [0.45, 1, 1, 1, 1, 1, 1, 1][i];
        const tail = [0.1, 0.04, 0.12, 0.3, 0.5, 0.66, 0.8, 0.92][i];
        const a = [0.9, 1, 1, 0.92, 0.8, 0.6, 0.38, 0.18][i];
        painted(ctx, 0, 0, 260, 200, (x, y) => {
          const u = (Math.atan2(y - cy, x - cx) - a0) / (a1 - a0);
          if (u < tail || u > head) return [0, 0];
          const k = (u - tail) / Math.max(0.01, head - tail);
          const th = 3 + thick * Math.pow(Math.sin(Math.PI * Math.min(1, k * 1.1)), 0.7);
          const v = (R - Math.hypot(x - cx, y - cy)) / th;
          if (v < -0.6 || v > 0.6) return [0, 0];
          const edge = sstep(0.5, 0.36, Math.abs(v) + (noise(u * 30, v * 4) - 0.5) * 0.15);
          // Dry brush: bristle streaks along the stroke, more of them toward its tail.
          const streak = noise(u * 5 + i * 0.1, (v + 0.5) * 22);
          const dry = sstep(0.55, 0, k) * 0.9;
          const ink = edge * sstep(dry * 0.85, dry * 0.85 + 0.12, streak);
          return [0.25 + Math.abs(v) * 0.9 + streak * 0.2, ink * a];
        }, INKR, 1.5);
        if (i >= 1 && i <= 5) {
          const pts = [];
          for (let k = 0; k <= 24; k++) {
            const u = tail + (head - tail) * (k / 24);
            const ang = a0 + (a1 - a0) * u;
            pts.push([cx + Math.cos(ang) * (R + 2), cy + Math.sin(ang) * (R + 2)]);
          }
          glow(ctx, pts, 0.8, SEAL, a * 0.75);
        }
        if (i >= 2) {
          const R2 = rng(1500 + i);
          for (let j = 0; j < 6; j++) {
            const ang = a1 + 0.1 + R2() * 0.3;
            const d = R + (R2() - 0.5) * 20 + (i - 1) * 6;
            const rr = 2 + R2() * 3.5 * (1 - i / 9);
            painted(ctx, cx + Math.cos(ang) * d - rr - 2, cy + Math.sin(ang) * d - rr - 2 + (i - 2) * 4, rr * 2 + 4, rr * 2 + 4, (x, y) => [0.3, sstep(1, 0.7, Math.hypot(x - cx - Math.cos(ang) * d, y - cy - Math.sin(ang) * d - (i - 2) * 4) / rr) * a], INKR, 1);
          }
        }
      },
    };
  }
  E.slashink = inkCut(26);
  // Her hit: a splash of ink thrown across the monster, ragged spikes and flying drops, a thin red
  // cut flashing through it; it soaks away.
  E.inkhit = {
    w: 200, h: 200, n: 6, fps: 26, px: 100, py: 100,
    draw(ctx, i) {
      const r = [26, 44, 52, 56, 58, 60][i];
      const a = [1, 1, 0.9, 0.7, 0.45, 0.2][i];
      painted(ctx, 0, 0, 200, 200, (x, y) => {
        const dx = x - 100;
        const dy = y - 100;
        const ang = Math.atan2(dy, dx);
        const spikes = Math.pow(noise(ang * 2.2 + 9, 3), 3) * 1.6;
        const d = Math.hypot(dx, dy) / (r * (0.55 + spikes) + (fbm(x / 9, y / 9, 3) - 0.5) * 14);
        if (d > 1.2) return [0, 0];
        const soak = sstep(1 - a, 1 - a + 0.2, fbm(x / 14 + 5, y / 14, 3));
        return [0.2 + d * 0.6, sstep(1, 0.85, d) * soak * Math.min(1, a * 1.6)];
      }, INKR, 1.5);
      if (i <= 2) {
        const L = 40 + i * 14;
        glow(ctx, [[100 - L, 100 + L * 0.5], [100 + L, 100 - L * 0.5]], 1.4, SEAL, 1 - i * 0.25);
      }
    },
  };
  // A smoke bomb: a pop of light, then thick white smoke billowing out low and wide, curling and
  // thinning away.
  E.smokebomb = {
    w: 300, h: 220, n: 8, fps: 18, px: 150, py: 190,
    draw(ctx, i) {
      const k = i / 7;
      const T = i * 0.4;
      painted(ctx, 0, 0, 300, 220, (x, y) => {
        const d = Math.hypot((x - 150) / (50 + k * 100), (y - 160 + k * 36) / (36 + k * 50));
        const n = fbm(x / 28 + T, y / 28 - T * 0.5, 5);
        const edge = Math.min(sstep(0, 30, x), sstep(300, 270, x), sstep(0, 26, y));
        const v = ((1 - d) * 1.1 + (n - 0.5) * 1.5 - k * 0.5) * edge;
        return [Math.min(1, 0.35 + Math.max(0, n - 0.35) * 1.8 - (y - 120) / 260), sstep(0, 0.4, v) * (0.95 - k * 0.45)];
      }, SMOKEW);
      if (i <= 1) bloomDisc(ctx, 150, 168, 40 - i * 10, 30 - i * 8, ['#ffffff', '#ffffff', '#fff4e8', '#ffd6c8'], 1 - i * 0.4);
    },
  };
  // A seal tag (ofuda): a strip of paper with a red brush glyph, glowing as its charge builds,
  // then it bursts into a red circle of light and scraps of paper.
  E.seal = {
    w: 200, h: 200, n: 7, fps: 14, px: 100, py: 100,
    draw(ctx, i) {
      if (i <= 3) {
        const glowA = [0.2, 0.4, 0.7, 1][i];
        bloomDisc(ctx, 100, 100, 44, 56, SEAL, glowA * 0.5);
        painted(ctx, 80, 58, 40, 84, (x, y) => {
          const fib = noise(x / 3, y / 9);
          return [0.5 + fib * 0.5, sstep(1, 0.92, Math.max(Math.abs(x - 100) / 18, Math.abs(y - 100) / 40)) * 0.97];
        }, PAPER, 1);
        // The glyph: brush strokes of red ink.
        const st = [[[92, 70], [108, 70]], [[100, 66], [100, 110]], [[90, 84], [110, 92]], [[92, 100], [100, 108], [109, 98]], [[94, 120], [106, 120]], [[100, 114], [100, 132]]];
        for (const pts of st) strokePts(ctx, pts, 3.2, i === 3 ? '#ff4a3a' : '#c81e28', 1);
        if (i >= 2) for (const pts of st) glow(ctx, pts, 0.7, SEAL, glowA * 0.8);
        return;
      }
      const t = (i - 3) / 3;
      const r = 30 + t * 64;
      const a = 1 - t * 0.75;
      const ring = [];
      for (let k = 0; k <= 48; k++) ring.push([100 + Math.cos((k / 48) * TAU) * r, 100 + Math.sin((k / 48) * TAU) * r]);
      glow(ctx, ring, 2.2 * a + 0.4, SEAL, a);
      const inner = ring.map(([x, y]) => [100 + (x - 100) * 0.78, 100 + (y - 100) * 0.78]);
      glow(ctx, inner, 0.9, SEAL, a * 0.8);
      for (let k = 0; k < 8; k++) {
        const ang = (k / 8) * TAU + t;
        glow(ctx, [[100 + Math.cos(ang) * r * 0.8, 100 + Math.sin(ang) * r * 0.8], [100 + Math.cos(ang) * r, 100 + Math.sin(ang) * r]], 1.2, SEAL, a);
      }
      if (i === 4) bloomDisc(ctx, 100, 100, 46, 46, SEAL, 0.9);
      const R = rng(1530 + i);
      for (let k = 0; k < 6; k++) {
        const ang = R() * TAU;
        const d = r * (0.6 + R() * 0.6);
        const px = 100 + Math.cos(ang) * d;
        const py = 100 + Math.sin(ang) * d + t * 20;
        painted(ctx, px - 5, py - 5, 10, 10, (x, y) => [0.8, sstep(1, 0.8, Math.max(Math.abs(x - px) / 4, Math.abs(y - py) / 2.5)) * a], PAPER, 1);
      }
    },
  };
  // Thousand Cuts: a giant fox painted in ink in one sweep of the brush, from the tail to the
  // nose, with one red eye; it pounces through the line, then breaks up into splashes of ink.
  E.inkfox = {
    w: 420, h: 260, n: 8, fps: 14, px: 210, py: 220,
    draw(ctx, i) {
      const reveal = [0.35, 0.7, 1, 1, 1, 1, 1, 1][i];
      const ox = 20 + i * 10;
      const oy = 20 - Math.sin((i / 7) * Math.PI) * 18;
      const gone = [0, 0, 0, 0, 0.15, 0.4, 0.65, 0.88][i];
      painted(ctx, 0, 0, 420, 260, (X, Y) => {
        const x = X - ox;
        const y = Y - oy;
        if (x / 360 > reveal + (noise(y / 20, 3) - 0.5) * 0.1) return [0, 0];
        const d = foxShape(x, y) + (fbm(x / 16, y / 16, 4) - 0.5) * 12;
        if (d > 3) return [0, 0];
        const streak = noise(x / 46, y / 2.6);
        const breakup = gone ? sstep(gone - 0.05, gone + 0.05, fbm(x / 22 + 3, y / 22, 4)) : 1;
        return [0.15 + sstep(-14, 2, d) * 0.6 + streak * 0.2, sstep(3, -2, d) * (0.75 + 0.25 * streak) * breakup];
      }, INKR, 2);
      if (i >= 2 && i <= 5) bloomDisc(ctx, ox + 304, oy + 84, 6, 4, SEAL, 1 - gone);
      if (i >= 2 && i <= 4) {
        const sweep = [];
        for (let k = 0; k <= 30; k++) sweep.push([ox + 20 + k * 11, oy + 150 - Math.sin((k / 30) * Math.PI) * 60]);
        glow(ctx, sweep, 0.9, SEAL, 0.7 - (i - 2) * 0.2);
      }
    },
  };

  // Fire from a shape: `d` its signed distance (below 0 inside); turbulence scrolls up through it
  // over time (`T`, 0-1 round a loop), so the edge breaks into tongues that lick up and tear off,
  // brightest (white) deep inside. Returns 0-1.
  function burn(x, y, d, T, k = 1) {
    const n = fbm(x / (13 * k), (y + T * 90 * k) / (11 * k), 4);
    const m = fbm(x / (28 * k) + 3, (y + T * 50 * k) / (26 * k), 3);
    return sstep(0, 1, -d / (18 * k) + (n - 0.5) * 1.6 + (m - 0.5) * 0.9 + 0.2);
  }
  // Its colour value: deep blue through most of the flame, white only at its hottest core.
  const heat = (v, d, k = 1) => v * (0.35 + 0.65 * sstep(-4 * k, -34 * k, d));
  // A fox-fire flame, looping: a wisp of blue flame, tongues licking up off it and tearing away.
  E.foxfire = {
    w: 120, h: 170, n: 8, fps: 16, px: 60, py: 140, loop: true,
    draw(ctx, i) {
      const T = i / 8;
      painted(ctx, 0, 0, 120, 170, (x, y) => {
        const sway = (fbm(x / 30, y / 30 + T * 2, 2) - 0.5) * 20 * Math.max(0, (130 - y) / 100);
        const d = cone(x + sway, y, 60, 126, 60, 30, 24, 2);
        if (d > 26) return [0, 0];
        const v = burn(x, y, d, T, 0.8);
        return [heat(v, d, 0.6), sstep(0, 0.25, v)];
      }, FOXR, 1);
    },
  };
  // A star's wake of fox fire, looping: a streak of blue flame trailing behind, tongues tearing off.
  E.foxtrail = {
    w: 190, h: 80, n: 4, fps: 18, px: 176, py: 46, loop: true,
    draw(ctx, i) {
      painted(ctx, 0, 0, 190, 80, (x, y) => {
        const d = cone(x, y, 172, 46, 20, 40, 13, 2);
        if (d > 20) return [0, 0];
        const v = burn(x + i * 13, y, d, i / 4, 0.6) * sstep(10, 40, x);
        return [heat(v, d, 0.3), sstep(0, 0.25, v)];
      }, FOXR, 1);
    },
  };
  // Her hit: fox fire bursting up off the monster, tongues of blue flame and gold sparks, burning
  // down to embers.
  E.foxhit = {
    w: 200, h: 220, n: 7, fps: 22, px: 100, py: 140,
    draw(ctx, i) {
      const k = i / 6;
      const a = [1, 1, 1, 0.85, 0.6, 0.35, 0.15][i];
      painted(ctx, 0, 0, 200, 220, (x, y) => {
        // Tongues of flame spraying up and out from where it struck, longer as it flares.
        let d = oval(x, y, 100, 145, 26, 20) + k * 18;
        for (let j = 0; j < 5; j++) {
          const ang = -Math.PI / 2 + (j - 2) * 0.45;
          const L = (60 + (j % 2 ? 0 : 30)) * (0.45 + k * 0.9);
          d = Math.min(d, cone(x, y, 100, 145, 100 + Math.cos(ang) * L, 145 + Math.sin(ang) * L, 18, 3) + k * k * 14);
        }
        if (d > 30) return [0, 0];
        const v = burn(x, y, d, k * 1.2, 0.6);
        return [heat(v, d, 0.4), sstep(0, 0.25, v) * a];
      }, FOXR, 1.5);
      if (i >= 1) {
        const R = rng(1560 + i);
        for (let j = 0; j < 10; j++) {
          const ang = -Math.PI / 2 + (R() - 0.5) * 2.4;
          const d = 20 + i * 12 * (0.5 + R());
          const x = 100 + Math.cos(ang) * d;
          const y2 = 140 + Math.sin(ang) * d + i * i * 1.5;
          glow(ctx, [[x, y2], [x - Math.cos(ang) * 5, y2 - Math.sin(ang) * 5]], 0.8, GOLD, a);
        }
      }
    },
  };
  // One fox-fire tail, looping (her gauge, Tails, puts one more behind her for each tail): a long,
  // full plume of blue flame curling up and back from its root, tongues licking off it.
  E.foxtail = {
    w: 160, h: 210, n: 8, fps: 12, px: 130, py: 190, loop: true,
    draw(ctx, i) {
      const T = i / 8;
      const sw = Math.sin(T * TAU) * 6;
      const sp = [[130, 190], [118, 150], [96, 112], [70, 82], [52, 56 + sw * 0.5], [56 + sw, 30]];
      const rr = [7, 18, 26, 28, 22, 6];
      painted(ctx, 0, 0, 160, 210, (x, y) => {
        let d = 99;
        for (let k = 0; k < sp.length - 1; k++) d = Math.min(d, cone(x, y, sp[k][0], sp[k][1], sp[k + 1][0], sp[k + 1][1], rr[k], rr[k + 1]));
        if (d > 24) return [0, 0];
        const v = burn(x, y, d, T, 0.75);
        return [heat(v, d, 0.5), sstep(0, 0.25, v) * 0.95];
      }, FOXR, 1.5);
    },
  };
  // Nine-Tail Blaze: a giant fox of blue fire with nine tails fanned out, pouncing through the
  // line, then burning out into embers and gold sparks.
  E.flamefox = {
    w: 420, h: 280, n: 8, fps: 14, px: 210, py: 240,
    draw(ctx, i) {
      const grow = [0.4, 0.75, 1, 1, 1, 1, 1, 1][i];
      const ox = 30 + i * 10;
      const oy = 50 - Math.sin((i / 7) * Math.PI) * 18;
      const out = [0, 0, 0, 0, 0.2, 0.45, 0.7, 0.9][i];
      const T = i / 8;
      painted(ctx, 0, 0, 420, 280, (X, Y) => {
        const x = X - ox;
        const y = Y - oy;
        const d = foxShape(x, y, 9) + 22 * (1 - grow);
        if (d > 24) return [0, 0];
        const ember = out ? sstep(out - 0.06, out + 0.06, fbm(x / 20 + 7, y / 20, 4)) : 1;
        const v = burn(x, y, d, T, 1.1) * ember;
        return [heat(v, d, 0.8), sstep(0, 0.25, v)];
      }, FOXR, 2);
      if (i >= 2 && i <= 5) bloomDisc(ctx, ox + 304, oy + 84, 7, 5, GOLD, 1 - out);
      if (i >= 4) {
        const R = rng(1600 + i);
        for (let j = 0; j < 16; j++) {
          const x = ox + 40 + R() * 300;
          const y = oy + 40 + R() * 140 - (i - 4) * 10;
          glow(ctx, [[x, y], [x + 2, y - 6]], 0.8, j % 3 ? FIRE : GOLD, 1 - out * 0.6);
        }
      }
    },
  };

  // ---------- The two paths' pillars, rings, emblems and auras ----------
  // The Shinobi's: a column of ink rising from her feet with red seal light at its root, a ring
  // of brushed ink spreading over the ground, her emblem a red seal stamp, and Ki as ink rising
  // round her in wisps.
  E.pillarink = {
    w: 150, h: 330, n: 8, fps: 20, px: 75, py: 318,
    draw(ctx, i) {
      const top = [250, 60, 24, 20, 30, 70, 130, 200][i];
      const a = [0.8, 1, 1, 0.95, 0.85, 0.6, 0.35, 0.15][i];
      const wid = [10, 22, 26, 26, 24, 20, 16, 12][i];
      painted(ctx, 0, 0, 150, 330, (x, y) => {
        if (y < top - 10) return [0, 0];
        const u = (318 - y) / (318 - top);
        const sway = (fbm(y / 40, i * 0.3, 3) - 0.5) * 18 * u;
        const half = wid * (1 - u * 0.5) + (fbm(x / 8, y / 14 - i, 3) - 0.5) * 8;
        const d = Math.abs(x - 75 - sway) / half;
        const streak = noise(x / 3, y / 40);
        const v = sstep(1, 0.7, d) * sstep(1.05, 0.9, u) * (0.7 + 0.3 * streak);
        return [0.2 + d * 0.5, v * a];
      }, INKR, 2);
      ctx.save();
      ctx.translate(75, 318);
      ctx.scale(1, 0.35);
      bloomDisc(ctx, 0, 0, 40, 40, SEAL, a * 0.8);
      ctx.restore();
    },
  };
  E.ringink = {
    w: 260, h: 260, n: 6, fps: 24, px: 130, py: 130,
    draw(ctx, i) {
      const r = [40, 70, 92, 106, 116, 122][i];
      const th = [22, 18, 14, 10, 7, 4][i];
      const a = [1, 1, 0.85, 0.6, 0.4, 0.2][i];
      painted(ctx, 0, 0, 260, 260, (x, y) => {
        const d = Math.abs(Math.hypot(x - 130, y - 130) - r) / th;
        if (d > 1.3) return [0, 0];
        const ang = Math.atan2(y - 130, x - 130);
        const dry = sstep(0.35, 0.7, noise(ang * 3 + 2, d * 6 + i));
        return [0.3 + d * 0.5, sstep(1, 0.7, d) * dry * a];
      }, INKR, 1.5);
      const ring = [];
      for (let k = 0; k <= 40; k++) ring.push([130 + Math.cos((k / 40) * TAU) * (r + th * 0.6), 130 + Math.sin((k / 40) * TAU) * (r + th * 0.6)]);
      glow(ctx, ring, 0.6, SEAL, a * 0.6);
    },
  };
  // A seal stamp (hanko): a square of red ink with a white brush glyph, pressed into the air,
  // then it breaks up into drops of ink and red light.
  E.embink = {
    w: 160, h: 160, n: 5, fps: 12, px: 80, py: 80,
    draw(ctx, i) {
      const k = i === 0 ? 0.75 : 1;
      const brk = i < 3 ? 0 : (i - 2) / 2;
      bloomDisc(ctx, 80, 80, 54 * k, 54 * k, SEAL, (1 - brk) * 0.5);
      painted(ctx, 30, 30, 100, 100, (x, y) => {
        const d = Math.max(Math.abs(x - 80), Math.abs(y - 80)) / (42 * k);
        if (d > 1.05) return [0, 0];
        const n = fbm(x / 6, y / 6, 3);
        const glyph = Math.min(Math.abs(x - 80 + (y - 80) * 0.15) / 3.5, Math.abs(y - 66) / 3, Math.abs(y - 94) / 3, Math.hypot(x - 64, y - 80) > 13 ? 9 : Math.abs(Math.hypot(x - 64, y - 80) - 10) / 2.5);
        const inner = d < 0.78 && glyph < 1 ? 1 : 0;
        const keep = brk ? sstep(brk - 0.05, brk + 0.05, n) : 1;
        return [inner ? 1 : 0.15 + n * 0.25, sstep(1.05, 0.95, d) * keep];
      }, ramp([[0, '#8a1018'], [0.3, '#c81e28'], [0.6, '#ff5a40'], [1, '#fff2e8']]), 1);
    },
  };
  E.inkaura = {
    w: 170, h: 220, n: 8, fps: 10, px: 85, py: 210, loop: true,
    draw(ctx, i) {
      const T = i / 8;
      painted(ctx, 0, 0, 170, 220, (x, y) => {
        const up = (210 - y) / 200;
        const n = (q) => fbm(x / 18 + 3, y / 20 + (T + q) * 3, 5);
        const flow = n(0) * (1 - T) + n(-1) * T;
        const ring = 1 - Math.abs(Math.abs(x - 85 + (flow - 0.5) * 40) - 38 * (1 - up * 0.5)) / 18;
        const edge = Math.min(sstep(0, 20, x), sstep(170, 150, x), sstep(0, 40, y));
        const v = (ring * 0.8 + (flow - 0.5) * 1.3 - up * 1.1) * edge * sstep(-0.05, 0.1, up);
        return [0.2 + Math.max(0, flow - 0.4) * 1.2, sstep(0, 0.5, v) * 0.7];
      }, INKR);
    },
  };
  // A log (Log Swap): a short round of wood with its bark and a pale cut face, tumbling as it
  // drops where she stood.
  E.log = {
    w: 120, h: 120, n: 6, fps: 14, px: 60, py: 100,
    draw(ctx, i) {
      const rot = [0, 0.25, 0.5, 0.7, 0.8, 0.85][i];
      const dy = [-20, -10, 0, 4, 2, 0][i];
      const bark = ramp([[0, '#3a2414'], [0.5, '#6a4426'], [1, '#9a6a3e']]);
      painted(ctx, 0, 0, 120, 120, (X, Y) => {
        const c = Math.cos(rot);
        const sn = Math.sin(rot);
        const x = (X - 60) * c + (Y - 80 - dy) * sn;
        const y = -(X - 60) * sn + (Y - 80 - dy) * c;
        const body = Math.max(Math.abs(x) / 34, Math.abs(y) / 14);
        if (body > 1.05) return [0, 0];
        const face = Math.hypot((x - 30) / 5, y / 14);
        const grain = noise(x / 12, y * 0.8);
        if (face < 1) return [0.9 + Math.sin(face * 14) * 0.08, 1];
        return [0.25 + grain * 0.5 + (y < -6 ? 0.25 : 0), sstep(1.05, 0.95, body)];
      }, (v) => (v > 0.8 ? mixc(rgb('#d8b88a'), rgb('#f0dcb4'), (v - 0.8) * 5) : bark(v)), 1);
    },
  };
  // The Kitsune's: a column of fox fire, a ring of it racing over the ground, her emblem a fox's
  // face in blue flame, and a ring of fox fire burning on the ground for her trap.
  E.pillarfox = {
    w: 150, h: 330, n: 8, fps: 20, px: 75, py: 318,
    draw(ctx, i) {
      const top = [250, 60, 24, 20, 30, 70, 130, 200][i];
      const a = [0.8, 1, 1, 0.95, 0.85, 0.6, 0.35, 0.15][i];
      painted(ctx, 0, 0, 150, 330, (x, y) => {
        const d = cone(x, y, 75, 316, 75, top, 26, 6);
        if (d > 24) return [0, 0];
        const v = burn(x, y, d, i / 8, 1);
        return [heat(v, d, 0.6), sstep(0, 0.25, v) * a];
      }, FOXR, 2);
    },
  };
  E.ringfox = {
    w: 260, h: 260, n: 6, fps: 24, px: 130, py: 130,
    draw(ctx, i) {
      const r = [40, 70, 92, 106, 116, 122][i];
      const a = [1, 1, 0.85, 0.6, 0.4, 0.2][i];
      painted(ctx, 0, 0, 260, 260, (x, y) => {
        const d = Math.abs(Math.hypot(x - 130, y - 130) - r) - [16, 13, 10, 8, 6, 4][i];
        if (d > 18) return [0, 0];
        const v = burn(x, y, d, i / 6, 0.6);
        return [heat(v, d, 0.4), sstep(0, 0.25, v) * a];
      }, FOXR, 1.5);
    },
  };
  E.embfox = {
    w: 160, h: 160, n: 5, fps: 12, px: 80, py: 80,
    draw(ctx, i) {
      const k = i === 0 ? 0.75 : 1;
      const brk = i < 3 ? 0 : (i - 2) / 2;
      painted(ctx, 0, 0, 160, 160, (X, Y) => {
        const x = 80 + (X - 80) / k;
        const y = 80 + (Y - 80) / k;
        // A fox's face from the front: a broad head, two tall ears, a pointed muzzle.
        const d = Math.min(oval(x, y, 80, 84, 34, 28), cone(x, y, 58, 70, 44, 26, 16, 2), cone(x, y, 102, 70, 116, 26, 16, 2), cone(x, y, 80, 92, 80, 126, 20, 4));
        if (d > 20) return [0, 0];
        const v = burn(x, y, d, i / 5, 0.6) * (brk ? sstep(brk - 0.06, brk + 0.06, fbm(x / 14, y / 14, 3)) : 1);
        return [heat(v, d, 0.5), sstep(0, 0.25, v)];
      }, FOXR, 1);
      if (i < 3) for (const ex of [68, 92]) bloomDisc(ctx, 80 + (ex - 80) * k, 80 + 2 * k, 4, 2.5, GOLD, 1);
    },
  };
  E.foxtrapring = {
    w: 320, h: 110, n: 6, fps: 12, px: 160, py: 70, loop: true,
    draw(ctx, i) {
      painted(ctx, 0, 0, 320, 110, (x, y) => {
        const d = Math.abs(Math.hypot((x - 160) / 130, (y - 70) / 26) - 1) * 26 - 7;
        const lifted = d - Math.max(0, 70 - y) * 0;
        if (d > 22) return [0, 0];
        const v = burn(x, y, lifted, i / 6, 0.55);
        return [heat(v, lifted, 0.4), sstep(0, 0.25, v)];
      }, FOXR, 1.5);
    },
  };
  E.ringinkbig = big(E.ringink, 2.6);
  E.ringfoxbig = big(E.ringfox, 2.6);
  E.inkfoxbig = big(E.inkfox, 1.4);
  E.flamefoxbig = big(E.flamefox, 1.4);

  // ---------- Endless barrages (the Shinobi's blade dance, the Beastmaster's wild hunt) ----------
  // A brush stroke of ink laid straight along her path: when she blinks through the line, and as
  // the drawn cut that ends the dance. The brush lands heavy, drags out to the right with its
  // bristles splitting into dry streaks toward the tail, a thin red seal-light along its top
  // edge, then the ink breaks into drops that fall away. Drawn heading right; (px, py) its middle.
  E.inkbrush = {
    w: 340, h: 120, n: 8, fps: 22, px: 170, py: 60,
    draw(ctx, i) {
      const x0 = 20;
      const x1 = 320;
      const head = [0.35, 0.8, 1, 1, 1, 1, 1, 1][i];
      const tail = [0, 0, 0.05, 0.2, 0.38, 0.56, 0.72, 0.88][i];
      const a = [0.95, 1, 1, 0.95, 0.85, 0.65, 0.42, 0.2][i];
      painted(ctx, 0, 0, 340, 120, (x, y) => {
        const u = (x - x0) / (x1 - x0);
        if (u < tail || u > head) return [0, 0];
        const k = (u - tail) / Math.max(0.01, head - tail);
        // Heavy where the brush lands, tapering to a point at the head.
        const th = 10 + 46 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.15 + k * 0.9)), 0.6) * (1 - 0.45 * u);
        const mid = 60 + Math.sin(u * 3.2) * 6;
        const v = (y - mid) / th;
        if (v < -0.6 || v > 0.6) return [0, 0];
        const edge = sstep(0.5, 0.34, Math.abs(v) + (noise(u * 34, v * 4) - 0.5) * 0.16);
        const streak = noise(u * 4 + i * 0.1, (v + 0.5) * 24);
        const dry = sstep(0.6, 0, k) * 0.85;
        const ink = edge * sstep(dry * 0.85, dry * 0.85 + 0.12, streak);
        return [0.22 + Math.abs(v) * 0.9 + streak * 0.2, ink * a];
      }, INKR, 1.5);
      if (i >= 1 && i <= 5) {
        const pts = [];
        for (let k = 0; k <= 24; k++) {
          const u = tail + (head - tail) * (k / 24);
          const kk = (u - tail) / Math.max(0.01, head - tail);
          pts.push([x0 + (x1 - x0) * u, 60 + Math.sin(u * 3.2) * 6 - 0.3 * (10 + 46 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.15 + kk * 0.9)), 0.6) * (1 - 0.45 * u))]);
        }
        glow(ctx, pts, 0.8, SEAL, a * 0.7);
      }
      if (i >= 3) {
        const R2 = rng(1700 + i);
        for (let j = 0; j < 9; j++) {
          const dx = x0 + (x1 - x0) * (0.1 + R2() * 0.85);
          const dy = 60 + (R2() - 0.4) * 30 + (i - 3) * (5 + R2() * 6);
          const rr = 1.8 + R2() * 3.5 * (1 - i / 10);
          painted(ctx, dx - rr - 2, dy - rr - 2, rr * 2 + 4, rr * 2 + 4, (x, y) => [0.3, sstep(1, 0.7, Math.hypot(x - dx, y - dy) / rr) * a], INKR, 1);
        }
      }
    },
  };
  // A leaf caught in the gale, looping: it tumbles end over end on a little curl of wind (the
  // Beastmaster's wheel of leaves is a ring of these).
  E.leafwisp = {
    w: 90, h: 90, n: 8, fps: 14, px: 45, py: 45, loop: true,
    draw(ctx, i) {
      const t = (i / 8) * TAU;
      curl(ctx, PAL.wind, 45, 45, 30, t + 1.2, 1.3, 5);
      leaf(ctx, 45 + Math.cos(t) * 4, 45 + Math.sin(t) * 3, 16, t + 0.6);
      sparkle(ctx, PAL.wind, 45 - Math.cos(t) * 22, 45 - Math.sin(t) * 16, 4, t);
    },
  };

  // ---------- Movement bursts (the Thief's flash jump and dash, the archers' air leap) ----------
  // A burst of speed in the path's own colours: a pop of light where she kicks off the air, a ring
  // of it standing up across her path like a sound barrier, a crescent swoosh and speed lines
  // trailing behind her, then the whole thing breaking up into beads and sparkles that drift
  // and fade. Drawn heading right (the game flips it); (px, py) is where she kicks off.
  function leapOf(A, B, seed) {
    return {
      w: 300, h: 190, n: 7, fps: 20, px: 200, py: 100,
      draw(ctx, i) {
        const R = rng(seed);
        const x = 200;
        const y = 100;
        const fade = [1, 1, 1, 0.9, 0.7, 0.45, 0.22][i];
        ctx.save();
        ctx.globalAlpha *= fade;
        // The pop where she kicks off.
        if (i <= 2) starburst(ctx, B, x, y, [40, 30, 16][i], 8, seed + 1, { rot: i * 0.3 });
        // The ring standing across her path (squeezed to an upright oval), breaking as it spreads.
        if (i <= 5) {
          const r = [16, 34, 46, 54, 60, 64][i];
          ctx.save();
          ctx.translate(x - 6 - i * 8, y);
          ctx.scale(0.42, 1);
          celRing(ctx, A, 0, 0, r, [10, 12, 10, 8, 6, 4][i], { broken: [0, 0, 0.1, 0.3, 0.55, 0.8][i], seed: seed + 2 });
          ctx.restore();
        }
        // A puff of cloud kicked off the air under her feet, breaking up.
        if (i >= 1 && i <= 5) puff(ctx, A, x - 18 - i * 6, y + 26 + i * 2, [16, 22, 24, 22, 18][i - 1], seed + 3, { holes: [0, 0.2, 0.45, 0.7, 0.9][i - 1], lobes: 6 });
        // Speed lines streaking back.
        if (i >= 1 && i <= 5) {
          for (let j = 0; j < 5; j++) {
            const ly = y - 34 + j * 17 + (R() - 0.5) * 6;
            const len = (70 + R() * 90) * [0.6, 1, 1, 0.8, 0.55][i - 1];
            const x1 = x - 16 - (i - 1) * 22 - R() * 12;
            speedLine(ctx, j % 2 ? B : A, x1 - len, ly, x1, ly, (j === 2 ? 5 : 3.6) * [1, 1, 0.85, 0.7, 0.5][i - 1]);
          }
        }
        // Beads and sparkles left in her wake, drifting down and away.
        if (i >= 2) {
          const k = (i - 2) / 4;
          for (let j = 0; j < 7; j++) {
            const bx = x - 30 - j * 26 - k * 30 + (R() - 0.5) * 10;
            const by = y + (R() - 0.5) * 70 + k * 18;
            if (j % 2) sparkle(ctx, j % 4 === 1 ? B : A, bx, by, (9 - j * 0.6) * (1 - k * 0.6), R());
            else shard(ctx, A, bx, by, Math.PI + (R() - 0.5) * 0.6, 12 * (1 - k * 0.5), 3 * (1 - k * 0.5));
          }
        }
        ctx.restore();
      },
    };
  }
  {
    const INK5 = ['#ffffff', '#e8e4ee', '#7a6a80', '#2a2230', '#0e0a12'];
    const SEAL5 = ['#ffffff', '#ffd6c8', '#ff6a4e', '#c81e28', '#7a0a1a'];
    const FOX5 = ['#ffffff', '#d8f6ff', '#5cb4ff', '#1e4ad6', '#1a2a8a'];
    const GOLD5 = ['#ffffff', '#fff3c4', '#ffd36a', '#e09a2a', '#9a5a1a'];
    E.leapshadow = leapOf(PAL.shadow, PAL.moon, 611);
    E.leapink = leapOf(INK5, SEAL5, 623);
    E.leapfox = leapOf(FOX5, GOLD5, 637);
    E.leaphawk = leapOf(PAL.hawk, PAL.sky, 641);
    E.leapwind = leapOf(PAL.wind, LEAF, 653);
    E.leapstorm = leapOf(PAL.storm, PAL.lightning, 661);
  }

  // An effect redrawn k times larger from the same art: rendered at its own new size in HD (unlike
  // big(), which the game plays as its base strip scaled up).
  function grown(e, k) {
    return {
      ...e,
      w: Math.ceil(e.w * k),
      h: Math.ceil(e.h * k),
      px: e.px * k,
      py: e.py * k,
      draw(ctx, i) {
        ctx.save();
        ctx.scale(k, k);
        e.draw(ctx, i);
        ctx.restore();
      },
    };
  }
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
  for (const s of ['ring', 'ringholy', 'ringrage', 'ringwind', 'ringhawk', 'ringshadow', 'ringmint', 'ringstorm']) E[`${s}big`] = big(E[s], 2.6);
  E.crescentbig = big(E.crescent, 1.6);
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


  // ---------- The Wind Dancer (coral and cream: swirling ribbons, crescent gusts, spinning rings) ----------
  // docs/design/wind-dancer.md. Her shapes are her own: ribbons that curl, gusts shaped like
  // crescents with a ribbon tail, and rings that spin and break into beads.
  const CORAL = ['#ffffff', '#ffe9df', '#ff9d88', '#f2655c', '#a8385a'];
  const CREAM = ['#ffffff', '#fff8ea', '#ffe6bc', '#f2c27e', '#a87048'];

  // A ribbon along the curve p(u) (u 0..1), `w(u)` wide, inked, with a light band down it and a
  // twist (its far side, darker) where its width passes through zero.
  function ribbon(ctx, pal, p, w, { n = 40, twist = 0 } = {}) {
    const top = [];
    const bot = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const [x, y] = p(u);
      const [x2, y2] = p(Math.min(1, u + 0.01));
      const a = Math.atan2(y2 - y, x2 - x) + Math.PI / 2;
      const ww = w(u) * (twist ? Math.cos(u * Math.PI * twist) : 1);
      top.push([x + Math.cos(a) * ww, y + Math.sin(a) * ww]);
      bot.push([x - Math.cos(a) * ww, y - Math.sin(a) * ww]);
    }
    inked(ctx, top.concat(bot.reverse()), pal[2], pal[4], 4);
    const mid = [];
    const mid2 = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const [x, y] = p(u);
      const [x2, y2] = p(Math.min(1, u + 0.01));
      const a = Math.atan2(y2 - y, x2 - x) + Math.PI / 2;
      const ww = w(u) * 0.4 * (twist ? Math.cos(u * Math.PI * twist) : 1);
      mid.push([x + Math.cos(a) * ww - 1, y + Math.sin(a) * ww - 1]);
      mid2.push([x - Math.cos(a) * ww * 0.2 - 1, y - Math.sin(a) * ww * 0.2 - 1]);
    }
    fill(ctx, mid.concat(mid2.reverse()), pal[1]);
  }

  // Her swirl: two ribbons curl round her as she spins (coral and cream), meet in a ring, then
  // unwind and scatter into beads. Drawn 1.6x (74 game px across its reach at scale 1) and again
  // 4x for the wide blows (Spotlight's, 184 at scale 1), so the game scales it to each blow's
  // reach without stretching (the 2026-11-04 pass: it was a third of the reach it marked).
  const WDSWIRL = (() => {
    const c = 130;
    return {
      w: 260, h: 260, n: 8, fps: 26, px: c, py: c,
      draw(ctx, i) {
        const spin = [0.6, 1.4, 2.4, 3.2, 3.6, 3.6, 3.6, 3.6][i];
        const open = i >= 4 ? (i - 3) / 4 : 0;
        if (i < 6) {
          for (const [k, pal] of [[0, CORAL], [Math.PI, CREAM]]) {
            ribbon(ctx, pal, (u) => {
              const a = k + u * spin;
              const r = 40 + u * 70 + open * 40;
              return [c + Math.cos(a) * r, c + Math.sin(a) * r * 0.9];
            }, (u) => 14 * Math.sin(Math.PI * u) * (1 - open * 0.6), { twist: 1.5 });
          }
        }
        if (i >= 3) {
          const R = rng(71 + i);
          for (let j = 0; j < 9; j++) {
            const a = (j / 9) * TAU + R() * 0.4;
            const d = 90 + open * 50;
            if (i >= 6) sparkle(ctx, j % 2 ? CORAL : CREAM, c + Math.cos(a) * d, c + Math.sin(a) * d, 9, a);
            else shard(ctx, j % 2 ? CORAL : CREAM, c + Math.cos(a) * d, c + Math.sin(a) * d, a, 14, 4);
          }
        }
      },
    };
  })();
  E.wdswirl = grown(WDSWIRL, 1.6);
  E.wdswirlbig = grown(WDSWIRL, 4);

  // Her cut (her basic blows with the chakram): a coral ribbon whips along the blade's arc with a
  // cream ribbon riding inside it, twisting as it goes, then unravels into beads and sparkles. The
  // same geometry and swing as every blade swipe, so the game lays it along her own swing.
  E.slashcoral = {
    w: 260, h: 200, n: 8, fps: 30, px: 130, py: 150, swing: [-Math.PI / 2, 1, 100],
    draw(ctx, i) {
      const cx = 130;
      const cy = 150;
      const R = 100;
      const a0 = (-168 * Math.PI) / 180;
      const a1 = (-12 * Math.PI) / 180;
      const head = [0.45, 0.8, 1, 1, 1, 1, 1, 1][i];
      const tail = [0, 0, 0.08, 0.3, 0.5, 0.7, 1, 1][i];
      const at = (rr, u) => [cx + Math.cos(a0 + (a1 - a0) * u) * rr, cy + Math.sin(a0 + (a1 - a0) * u) * rr];
      if (head - tail > 0.05) {
        const span = (u) => tail + (head - tail) * u;
        ribbon(ctx, CORAL, (u) => at(R - 8, span(u)), (u) => (3 + 13 * Math.pow(u, 1.3)) * Math.sin(Math.PI * Math.min(1, u * 1.15)) + 1.5, { twist: 1.2 });
        ribbon(ctx, CREAM, (u) => at(R - 30, span(u)), (u) => (2 + 6 * u) * Math.sin(Math.PI * Math.min(1, u * 1.1)) + 1, { twist: 0.8 });
        if (i >= 1 && i <= 3) sparkle(ctx, CORAL, ...at(R - 4, head), 16 - (i - 1) * 3, 0.3);
      }
      if (i >= 4) {
        const k = (i - 4) / 3;
        const Rn = rng(95);
        for (let j = 0; j < 7; j++) {
          const u = j / 6;
          const [x, y] = at(R - 12 + (Rn() - 0.5) * 16 + k * 16, u);
          if (i < 6) shard(ctx, j % 2 ? CORAL : CREAM, x, y, a0 + (a1 - a0) * u + Math.PI / 2, 12 * (1 - k * 0.5), 4);
          else sparkle(ctx, j % 2 ? CORAL : CREAM, x, y - k * 10, 8, j);
        }
      }
    },
  };

  // Her mark on a monster: a ring snaps round it and spins, a crescent gust cuts across, then the
  // ring breaks into beads and a ribbon of sparkles.
  E.wdhit = (() => {
    const c = 110;
    return {
      w: 220, h: 220, n: 7, fps: 30, px: c, py: c,
      draw(ctx, i) {
        if (i === 0) {
          celRing(ctx, CORAL, c, c, 34, 10, { seed: 81 });
          return;
        }
        if (i <= 2) {
          celRing(ctx, CORAL, c, c, i === 1 ? 62 : 70, 12, { seed: 81 });
          celCrescent(ctx, CREAM, c + 10, c + 40, 70, -2.6, -0.5, 24, { seed: 82, inkW: 4 });
          sparkle(ctx, CORAL, c + 52, c - 42, i === 1 ? 18 : 14, 0.3);
          return;
        }
        const k = (i - 2) / 4;
        if (i === 3) celRing(ctx, CORAL, c, c, 80, 8, { broken: 0.5, seed: 81 });
        const R = rng(83);
        for (let j = 0; j < 8; j++) {
          const a = (j / 8) * TAU + R() * 0.4;
          const d = 60 + k * 50;
          if (i < 6) shard(ctx, j % 2 ? CORAL : CREAM, c + Math.cos(a) * d, c + Math.sin(a) * d, a + Math.PI / 2, 14 * (1.1 - k * 0.6), 4 * (1.1 - k * 0.5));
          else sparkle(ctx, j % 2 ? CORAL : CREAM, c + Math.cos(a) * d, c + Math.sin(a) * d, 8, a);
        }
      },
    };
  })();

  // A gust: a crescent of wind flung forward with a ribbon streaming off its tail.
  E.wdgust = (() => {
    const cx = 60;
    const cy = 120;
    return {
      w: 320, h: 240, n: 8, fps: 30, px: cx, py: cy,
      draw(ctx, i) {
        const x = cx + i * 22;
        if (i < 6) {
          const th = [24, 40, 46, 44, 36, 26][i];
          celCrescent(ctx, CORAL, x, cy, 90, -1.1, 1.1, th, { seed: 91, inkW: 4 });
          ribbon(ctx, CREAM, (u) => [x - 30 - u * 110, cy - 76 + Math.sin(u * 6 + i) * 12 + u * 20], (u) => 8 * (1 - u), { twist: 1 });
          for (const dy of [-40, 0, 40]) speedLine(ctx, CORAL, x - 70, cy + dy, x - 10, cy + dy * 0.9, 3);
        } else {
          for (let j = 0; j < 6; j++) sparkle(ctx, j % 2 ? CORAL : CREAM, x + 60 + Math.cos(j) * 30, cy + (j - 2.5) * 26, 9, j);
        }
      },
    };
  })();

  // The gust of a big blow (the fouetté's, the lunge's, Gust Line's, a glove push's puff): the
  // crescent races out down the line with its ribbon streaming behind, so the game can scale it to
  // the length of ground the blow cuts (its leading edge ends 150 game px ahead at scale 1).
  E.wdgustfar = (() => {
    const cx = 40;
    const cy = 120;
    return {
      w: 600, h: 240, n: 8, fps: 30, px: cx, py: cy,
      draw(ctx, i) {
        const k = ease3(Math.min(1, (i + 0.5) / 5.5));
        const x = cx - 40 + k * 400;
        if (i < 6) {
          const th = [26, 40, 46, 44, 38, 28][i];
          celCrescent(ctx, CORAL, x, cy, 90, -1.1, 1.1, th, { seed: 91, inkW: 4 });
          celCrescent(ctx, CREAM, x - 26, cy, 70, -0.9, 0.9, th * 0.4, { seed: 92, inkW: 3 });
          ribbon(ctx, CREAM, (u) => [x - 20 - u * (60 + k * 200), cy - 70 + Math.sin(u * 6 + i) * 14 + u * 24], (u) => 9 * (1 - u), { twist: 1 });
          for (const dy of [-44, 0, 44]) speedLine(ctx, CORAL, x - 60 - k * 150, cy + dy, x - 4, cy + dy * 0.9, 3);
        } else {
          for (let j = 0; j < 7; j++) sparkle(ctx, j % 2 ? CORAL : CREAM, x + 50 + Math.cos(j * 1.7) * 36, cy + (j - 3) * 24, 10, j);
        }
      },
    };
  })();

  // Her badge, rising in her buff's pillar: a chakram with a ribbon bow.

  E.embdancer = emblem(CORAL, (ctx, pal) => {
    const band = (r0, r1, colour) => {
      ctx.beginPath();
      ctx.arc(0, 0, r1, 0, TAU);
      ctx.arc(0, 0, r0, 0, TAU, true);
      ctx.fillStyle = colour;
      ctx.fill('evenodd');
    };
    band(30, 48, pal[4]);
    band(33, 45, pal[2]);
    band(36, 41, pal[1]);
    for (let k = 0; k < 8; k++) {
      ctx.save();
      ctx.rotate((k / 8) * TAU);
      inked(ctx, [[-6, -46], [0, -60], [6, -46]], pal[2], pal[4], 4);
      ctx.restore();
    }
    for (const sd of [-1, 1]) inked(ctx, [[0, 44], [sd * 26, 30], [sd * 30, 52], [sd * 8, 50]], CREAM[2], CREAM[4], 4);
    inked(ctx, [[-7, 40], [7, 40], [7, 52], [-7, 52]], CREAM[1], CREAM[4], 4);
  });


  // Grand Finale (her finisher): a spotlight beam drops on her, coral and cream ribbons spiral up
  // round it into a great rose of ribbons, then it bursts open in a ring of rings and a shower of
  // sparkles, like the curtain coming down on a show.
  // Drawn as wide as the ground it cuts (the 2026-11-04 pass): her rose of ribbons whirls out round
  // her to 180 game px either side (its cuts' reach), and the burst races out along the ground to
  // 200 (the last blow's), at scale 1.
  E.wdfinale = (() => {
    const c = 600;
    const gy = 400;
    const oy = gy - 96;
    return {
      w: 1200, h: 430, n: 12, fps: 20, px: c, py: gy,
      draw(ctx, i) {
        // The spotlight.
        if (i <= 8) {
          const w = [56, 96, 112, 112, 112, 106, 90, 64, 34][i];
          ctx.save();
          // (A soft beam now, the all-class pass: the bright white cone hid her inside it.)
          ctx.globalAlpha = 0.3;
          fill(ctx, [[c - w * 0.35, 0], [c + w * 0.35, 0], [c + w, gy], [c - w, gy]], CREAM[1]);
          ctx.restore();
        }
        // The rose: ribbons whirling out round her on a wide flat orbit, crescent cuts riding its
        // rim (behind her first, then in front).
        if (i >= 1 && i <= 8) {
          const rx = Math.min(540, 150 + (i - 1) * 85);
          const ry = rx * 0.24;
          for (const [phase, pal] of [[0, CORAL], [Math.PI, CREAM], [Math.PI / 2, CORAL], [Math.PI * 1.5, CREAM]]) {
            ribbon(ctx, pal, (u) => {
              const a = phase + i * 1.1 + u * 1.9;
              return [c + Math.cos(a) * rx, oy + Math.sin(a) * ry - Math.cos(a * 2) * 14];
            }, (u) => 14 * Math.sin(Math.PI * u) * (i >= 7 ? 0.7 : 1), { twist: 2 });
            if (i >= 3) {
              const a = phase + i * 1.1 + 1.9;
              const x = c + Math.cos(a) * rx;
              const y = oy + Math.sin(a) * ry;
              celCrescent(ctx, pal === CORAL ? CORAL : CREAM, x, y, 44, a + 0.6, a + 2.2, 14, { seed: 105, inkW: 3 });
            }
          }
          // And up the light, the rose climbing round her.
          const up = Math.min(1, i / 5);
          for (const [phase, pal] of [[0, CORAL], [Math.PI, CREAM]]) {
            ribbon(ctx, pal, (u) => {
              const a = phase + u * 7 + i * 0.5;
              const r = 80 + u * 50;
              return [c + Math.cos(a) * r, gy - 20 - u * 300 * up + Math.sin(a) * 18];
            }, (u) => 11 * Math.sin(Math.PI * u), { twist: 2 });
          }
        }
        // The burst: a ring racing out along the ground to the edge of the last blow, rings popping
        // round her, and sparkles showering down over the whole stage.
        if (i >= 6) {
          const b = (i - 6) / 5;
          if (i <= 10) {
            ctx.save();
            ctx.translate(c, gy - 8);
            ctx.scale(1, 0.26);
            celRing(ctx, CORAL, 0, 0, 160 + b * 440, 26 * (1 - b * 0.6), { broken: i >= 9 ? 0.5 : 0, seed: 106 });
            ctx.restore();
          }
          // (No rings popping round her chest any more, the all-class pass: they crossed her body.)
          const R = rng(103);
          for (let j = 0; j < 22; j++) {
            const x = c + (R() - 0.5) * 1120;
            const y = gy - 330 + R() * 160 + b * 150;
            sparkle(ctx, j % 2 ? CORAL : CREAM, x, y, 15 * (1.2 - b * 0.5), j);
          }
        }
        if (i === 6 || i === 7) for (const sd of [-1, 1]) starburst(ctx, CORAL, c + sd * 200, gy - 150, 60 - (i - 6) * 16, 8, 104, { inner: 0.3 });
      },
    };
  })();

  // ---------- The Blade Dancer (rose gold: bouncing rings, sparks where they ricochet, a carousel) ----------
  // docs/design/blade-dancer.md. Her shapes: a spinning chakram with its own smear, bright V-shaped
  // ricochet sparks, and rings riding an orbit round her like a carousel.
  const ROSEGOLD = ['#ffffff', '#ffe8dc', '#f6ad94', '#d26d6a', '#7e3450'];
  const GOLDRING = ['#ffffff', '#fff4c8', '#ffd36a', '#e09a36', '#8e5228'];

  // A chakram seen a little edge-on (`sy` squashes it), turned by `rot`: a banded ring with six
  // blade points, a gold rim and a white glint.
  function chakram(ctx, x, y, r, rot, sy = 1, pal = ROSEGOLD) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, sy);
    ctx.rotate(rot);
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * TAU;
      const p = (t, d) => [Math.cos(a + t) * d, Math.sin(a + t) * d];
      inked(ctx, [p(-0.22, r * 0.9), p(0.18, r * 1.42), p(0.3, r * 0.92)], pal[2], pal[4], 4);
      fill(ctx, [p(-0.05, r * 0.95), p(0.16, r * 1.3), p(0.22, r * 0.95)], pal[1]);
    }
    celRing(ctx, pal, 0, 0, r, r * 0.42, { seed: 111 });
    celRing(ctx, GOLDRING, 0, 0, r * 0.62, r * 0.12, { seed: 112 });
    ctx.restore();
    sparkle(ctx, GOLDRING, x - r * 0.45, y - r * 0.5 * sy, r * 0.32, 0.4);
  }

  // Her ring in flight (loops): it spins, a rose smear curling behind it and two gold sparks
  // shed off its rim. Flies toward +x.
  E.bdring = (() => {
    const cx = 92;
    const cy = 56;
    return {
      w: 140, h: 112, n: 6, fps: 30, px: cx, py: cy, loop: true,
      draw(ctx, i) {
        const rot = (i / 6) * (TAU / 6);
        celCrescent(ctx, ROSEGOLD, cx, cy, 38, Math.PI * 0.55 + i * 0.05, Math.PI * 1.45 + i * 0.05, 14, { seed: 113, inkW: 3 });
        speedLine(ctx, GOLDRING, cx - 86, cy - 12 + (i % 2) * 4, cx - 40, cy - 12, 2.5);
        speedLine(ctx, GOLDRING, cx - 76, cy + 16 - (i % 2) * 4, cx - 38, cy + 14, 2.5);
        chakram(ctx, cx, cy, 24, rot, 0.86);
      },
    };
  })();

  // Where a ring ricochets: a gold flash, a rose ring popping out, and sparks kicked off in a V
  // (the way it bounced), breaking into beads.
  E.bdbounce = (() => {
    const c = 90;
    return {
      w: 180, h: 180, n: 6, fps: 30, px: c, py: c,
      draw(ctx, i) {
        if (i <= 2) starburst(ctx, GOLDRING, c, c, [36, 52, 40][i], 8, 121, { inner: 0.3, rot: i * 0.2 });
        if (i >= 1 && i <= 3) celRing(ctx, ROSEGOLD, c, c, 30 + i * 16, 10 - i * 2, { broken: i === 3 ? 0.5 : 0, seed: 122 });
        const k = i / 5;
        for (const [a, pal] of [[-2.3, GOLDRING], [-0.85, GOLDRING], [-1.9, ROSEGOLD], [-1.2, ROSEGOLD], [-2.7, ROSEGOLD], [-0.45, ROSEGOLD]]) {
          const d = 26 + k * 66;
          const x = c + Math.cos(a) * d;
          const y = c + Math.sin(a) * d + k * k * 30;
          if (i < 4) speedLine(ctx, pal, x - Math.cos(a) * 22, y - Math.sin(a) * 22, x + Math.cos(a) * 10, y + Math.sin(a) * 10, 3.5);
          else shard(ctx, pal, x, y, a, 9, 3);
        }
        if (i >= 3) sparkle(ctx, GOLDRING, c + 4, c - 30 - i * 4, 12 - i, 0.3);
      },
    };
  })();

  // Her mark on a monster: a ring-cut loops right round it (a full rose-gold circle drawn as one
  // crescent), a gold glint crosses it, then it breaks into beads.
  E.bdhit = (() => {
    const c = 110;
    return {
      w: 220, h: 220, n: 7, fps: 30, px: c, py: c,
      draw(ctx, i) {
        const sweep = [1.6, 3.6, 5.6, 6.1, 6.1, 0, 0][i];
        if (i <= 4) celCrescent(ctx, ROSEGOLD, c, c, 58 + i * 4, -1.2, -1.2 + sweep, [14, 18, 20, 18, 12][i], { seed: 131, inkW: 4 });
        if (i >= 1 && i <= 3) {
          speedLine(ctx, GOLDRING, c - 56, c + 40, c + 56, c - 40, 6);
          sparkle(ctx, GOLDRING, c, c, [26, 22, 16][i - 1], 0.2);
        }
        if (i >= 4) {
          const k = (i - 4) / 2;
          const R = rng(133);
          for (let j = 0; j < 8; j++) {
            const a = (j / 8) * TAU + R() * 0.4;
            const d = 64 + k * 34;
            if (i < 6) shard(ctx, j % 2 ? GOLDRING : ROSEGOLD, c + Math.cos(a) * d, c + Math.sin(a) * d, a + Math.PI / 2, 12, 3.5);
            else sparkle(ctx, j % 2 ? GOLDRING : ROSEGOLD, c + Math.cos(a) * d, c + Math.sin(a) * d, 8, a);
          }
        }
      },
    };
  })();

  // Her badge: two rings linked, rose gold and gold, with blade points.
  E.embblade = emblem(ROSEGOLD, (ctx) => {
    chakram(ctx, -16, 4, 26, 0.3, 1, GOLDRING);
    chakram(ctx, 16, -4, 26, 0.1, 1, ROSEGOLD);
  });

  // Golden Carousel (her finisher): rings gather on an orbit round her, riding it faster and
  // faster under a gold track like a carousel's; then they fly out in every direction, the track
  // bursts into a ring of sparks, and gold sparkles rain down.
  // (Drawn as wide as its cuts reach, the 2026-11-04 pass: the gathered track is 120 game px out
  // either side at scale 1, where it was 50.)
  E.bdcarousel = (() => {
    const c = 560;
    const gy = 320;
    const oy = gy - 90;
    return {
      w: 1120, h: 340, n: 12, fps: 20, px: c, py: gy,
      draw(ctx, i) {
        const gather = Math.min(1, (i + 1) / 4);
        const fly = i >= 8 ? (i - 7) / 4 : 0;
        const rx = 360 * (1.15 - gather * 0.15);
        const ry = 84 * (1.15 - gather * 0.15);
        const turn = [0, 0.3, 0.7, 1.2, 1.9, 2.7, 3.6, 4.6, 5.2][Math.min(8, i)];
        // The track: a gold band on the orbit (its back half first, behind the rings).
        if (i <= 8) {
          ctx.save();
          ctx.translate(c, oy);
          ctx.scale(1, ry / rx);
          celRing(ctx, GOLDRING, 0, 0, rx + 8, 12, { broken: i === 8 ? 0.4 : 0, seed: 141 });
          ctx.restore();
        }
        const rings = [];
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * TAU + turn;
          const d = 1 + fly * 0.4;
          rings.push([c + Math.cos(a) * rx * d, oy + Math.sin(a) * ry * d - fly * 60 * Math.abs(Math.cos(a)), Math.sin(a), a]);
        }
        rings.sort((a, b) => a[2] - b[2]);
        for (const [x, y, depth, a] of rings) {
          if (i < 11) {
            // Its smear: a rose crescent riding the orbit behind it, longer as it speeds up; flying
            // out, a streak back toward her.
            if (i >= 2 && !fly) {
              ctx.save();
              ctx.translate(c, oy);
              ctx.scale(1, ry / rx);
              celCrescent(ctx, ROSEGOLD, 0, 0, rx + 14, a - 0.25 - Math.min(1.1, i * 0.16), a - 0.08, 22, { seed: 144, inkW: 4 });
              ctx.restore();
            }
            if (fly && i < 10) speedLine(ctx, ROSEGOLD, x - Math.cos(a) * 90, y + Math.abs(Math.cos(a)) * 30 - Math.sin(a) * 30, x, y, 5);
            chakram(ctx, x, y, (32 + depth * 7) * (i === 0 ? 0.5 : 1), turn * 2 + a, 0.8, depth > 0 ? ROSEGOLD : GOLDRING);
          } else sparkle(ctx, GOLDRING, x, y, 12, a);
        }
        if (i === 8 || i === 9) starburst(ctx, GOLDRING, c, oy, 100 - (i - 8) * 20, 12, 142, { inner: 0.3 });
        if (i >= 8) {
          const R = rng(143);
          for (let j = 0; j < 20; j++) sparkle(ctx, j % 2 ? GOLDRING : ROSEGOLD, c + (R() - 0.5) * 1040, oy - 120 + R() * 60 + fly * 110, 13 * (1.2 - fly * 0.5), j);
        }

      },
    };
  })();

  // ---------- The Sky Dancer (sky blue and white, pale sunlight: wind crescents, feathers, clouds) ----------
  // docs/design/sky-dancer.md. Her shapes: crescents of wind with a feather riding them, soft
  // clouds where they land, whirlwinds of stacked rings, and a tornado for her finisher.
  const SKYB = ['#ffffff', '#e6f6ff', '#9ad6ff', '#4e9fe6', '#2a4f9e'];
  const SUNLIT = ['#ffffff', '#fff8dc', '#ffe6a0', '#f0c060', '#a8783a'];
  const CLOUDS = ['#ffffff', '#ffffff', '#eef4ff', '#c4d6f2', '#6f86c0'];

  // A feather at (x, y), `len` long, turned by `a` (radians, 0 = pointing right), its vane a soft
  // leaf with a light spine and a notch or two along its edge.
  function feather(ctx, pal, x, y, len, a, w = len * 0.28) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    const vane = [];
    for (let i = 0; i <= 12; i++) {
      const u = i / 12;
      vane.push([-len / 2 + u * len, -w * Math.sin(Math.PI * Math.min(1, u * 1.1)) * (u > 0.55 && u < 0.62 ? 0.7 : 1)]);
    }
    for (let i = 12; i >= 0; i--) {
      const u = i / 12;
      vane.push([-len / 2 + u * len, w * 0.8 * Math.sin(Math.PI * Math.min(1, u * 1.1)) * (u > 0.3 && u < 0.37 ? 0.7 : 1)]);
    }
    inked(ctx, vane, pal[2], pal[4], 3);
    fill(ctx, vane.map(([px, py]) => [px * 0.9, py * 0.55 - 1]), pal[1]);
    fill(ctx, [[-len / 2 - 3, -1], [len / 2, -0.6], [len / 2, 0.6], [-len / 2 - 3, 1]], pal[0]);
    ctx.restore();
  }

  // Her gust in flight (loops, flying toward +x and a little down): a crescent of wind with a
  // feather riding its head and streaks of air behind.
  E.skygust = (() => {
    const cx = 100;
    const cy = 70;
    return {
      w: 170, h: 140, n: 6, fps: 30, px: cx, py: cy, loop: true,
      draw(ctx, i) {
        const k = Math.sin((i / 6) * TAU);
        celCrescent(ctx, SKYB, cx - 20, cy, 56, -1.2 + k * 0.05, 1.2 + k * 0.05, 26, { seed: 151, inkW: 4 });
        celCrescent(ctx, CLOUDS, cx - 34, cy, 44, -0.9, 0.9, 12, { seed: 152, inkW: 3 });
        for (const [dy, l] of [[-34, 60], [0, 80], [34, 56]]) speedLine(ctx, SKYB, cx - 40 - l, cy + dy + (i % 2) * 3, cx - 36, cy + dy * 0.9, 3);
        feather(ctx, SUNLIT, cx + 26, cy - 22 + k * 3, 30, -0.4 + k * 0.15);
        sparkle(ctx, SUNLIT, cx + 30, cy + 26 - k * 4, 7, i * 0.5);
      },
    };
  })();

  // Her mark on a monster: a soft cloud bursts round it with a swirl of wind through it, then it
  // drifts apart into puffs, feathers and sparkles.
  E.skyhit = (() => {
    const c = 110;
    return {
      w: 220, h: 220, n: 7, fps: 30, px: c, py: c,
      draw(ctx, i) {
        const k = i / 6;
        if (i <= 3) puff(ctx, CLOUDS, c, c, [28, 46, 52, 50][i], 161, { holes: i === 3 ? 0.4 : 0, lobes: 6 });
        if (i >= 1 && i <= 4) celCrescent(ctx, SKYB, c, c, 50 + i * 6, -2.4 + i * 0.6, 0.4 + i * 0.6, [16, 18, 14, 10][i - 1], { seed: 162, inkW: 4 });
        if (i >= 1 && i <= 2) sparkle(ctx, SUNLIT, c + 30, c - 30, 16 - i * 3, 0.3);
        if (i >= 3) {
          const R = rng(163);
          for (let j = 0; j < 6; j++) {
            const a = (j / 6) * TAU + R() * 0.5;
            const d = 50 + k * 60;
            const x = c + Math.cos(a) * d;
            const y = c + Math.sin(a) * d - k * 20;
            if (j % 3 === 0) feather(ctx, j % 2 ? SKYB : SUNLIT, x, y, 22 * (1.1 - k * 0.4), a + k * 2);
            else if (i < 6) puff(ctx, CLOUDS, x, y, 12 * (1.1 - k * 0.5), 164 + j, { lobes: 4 });
            else sparkle(ctx, j % 2 ? SKYB : SUNLIT, x, y, 8, a);
          }
        }
      },
    };
  })();

  // A whirlwind under her feet (loops): rings of wind stacked and turning, wider at the top, with
  // feathers caught in it. Drawn flat at her feet in game (the Tailwind aura and her flight).
  E.skywhirl = (() => {
    const c = 120;
    const base = 150;
    return {
      w: 240, h: 180, n: 6, fps: 18, px: c, py: base,
      draw(ctx, i) {
        for (let k = 0; k < 4; k++) {
          const y = base - k * 28;
          const r = 34 + k * 20;
          const a0 = (i / 6) * TAU + k * 0.9;
          ctx.save();
          ctx.translate(c, y);
          ctx.scale(1, 0.32);
          celCrescent(ctx, k % 2 ? CLOUDS : SKYB, 0, 0, r, a0, a0 + 3.6, 16 - k * 2, { seed: 171 + k, inkW: 4 });
          ctx.restore();
        }
        for (let j = 0; j < 2; j++) {
          const a = (i / 6) * TAU + j * Math.PI;
          feather(ctx, j ? SUNLIT : SKYB, c + Math.cos(a) * 70, base - 70 + Math.sin(a) * 12, 22, a + 1.2);
        }
      },
    };
  })();

  // Updraft's rising whirl (and her up command's, and the cloudburst's): drawn at its own size
  // (about 80 game px across at scale 1) with slim wind ribbons, not the small whirl blown up (the
  // player found the blown-up one fat and blurry): five thin ribbons turning, tighter at the foot,
  // a white edge on each, feathers riding round, a few sparkles. Light and airy.
  E.skywhirlbig = (() => {
    const c = 300;
    const base = 420;
    return {
      w: 600, h: 460, n: 8, fps: 18, px: c, py: base,
      draw(ctx, i) {
        for (let k = 0; k < 5; k++) {
          const u = k / 4;
          const y = base - 20 - u * 330;
          const r = 60 + u * 170;
          const a0 = (i / 8) * TAU + k * 1.1;
          // A slim ribbon: an arc of the ellipse stroked in three widths (ink, colour, white edge).
          const cx2 = c + Math.sin(u * 2.4 + (i / 8) * TAU) * 12 * u;
          const pal = k % 2 ? CLOUDS : SKYB;
          const arc = (w, col) => {
            ctx.beginPath();
            ctx.ellipse(cx2, y, r, r * 0.26, 0, a0, a0 + 3.2 - u * 0.6);
            ctx.lineCap = 'round';
            ctx.lineWidth = w;
            ctx.strokeStyle = col;
            ctx.stroke();
          };
          arc(9, pal[4]);
          arc(6, pal[2]);
          arc(2.5, pal[0]);
        }
        for (let j = 0; j < 4; j++) {
          const a = (i / 8) * TAU + (j / 4) * TAU;
          const u = 0.25 + (j % 2) * 0.45;
          feather(ctx, j % 2 ? SUNLIT : SKYB, c + Math.cos(a) * (70 + u * 150), base - 40 - u * 300 + Math.sin(a) * 14, 26, a + 1.2);
        }
        const R = rng(2010 + i);
        for (let j = 0; j < 4; j++) sparkle(ctx, j % 2 ? SUNLIT : SKYB, c + (R() - 0.5) * 420, base - 60 - R() * 320, 9, j);
      },
    };
  })();

  // Her badge: a white wing over a little cloud, with a sun sparkle.

  E.embsky = emblem(SKYB, (ctx) => {
    puff(ctx, CLOUDS, 0, 22, 26, 181, { lobes: 5 });
    for (let k = 0; k < 5; k++) feather(ctx, k % 2 ? SKYB : CLOUDS, -6 + k * 7, -2 - k * 6, 44 - k * 4, -0.5 - k * 0.32);
    sparkle(ctx, SUNLIT, 30, -34, 12, 0.3);
  });

  // Sky Waltz (her finisher): a tornado gathers round her, spinning up from the ground into a great
  // column with feathers and clouds caught in it; then it slams down, bursting out along the
  // ground in a ring of wind and clouds, sunlight sparkling down.
  // (Drawn twice its old size and wider at the base, the 2026-11-04 pass: the column's foot spans
  // the monsters it lifts and the slam's ring races out to 200 game px at scale 1, where the whole
  // tornado had been a third of the ground it works on.)
  E.skytornado = grown((() => {
    const c = 330;
    const gy = 330;
    return {
      w: 660, h: 350, n: 12, fps: 18, px: c, py: gy,
      draw(ctx, i) {
        if (i <= 7) {
          const grow = Math.min(1, (i + 1) / 5);
          const rings = 7;
          for (let k = 0; k < rings; k++) {
            const u = k / (rings - 1);
            const y = gy - 20 - u * 270 * grow;
            const r = (70 + u * 110) * (0.6 + 0.4 * grow);
            const a0 = i * 1.3 + k * 0.8;
            ctx.save();
            ctx.translate(c + Math.sin(u * 3 + i * 0.7) * 10 * u, y);
            ctx.scale(1, 0.3);
            celCrescent(ctx, k % 2 ? CLOUDS : SKYB, 0, 0, r, a0, a0 + 4, 26 - u * 6, { seed: 191 + k, inkW: 4 });
            ctx.restore();
          }
          const R = rng(192 + i);
          for (let j = 0; j < 6; j++) {
            const u = R();
            const a = R() * TAU + i;
            feather(ctx, j % 2 ? SUNLIT : SKYB, c + Math.cos(a) * (50 + u * 110), gy - 40 - u * 240 * grow, 24, a);
          }
        }
        // The slam: rings bursting out along the ground, clouds rolling, sunlight raining.
        if (i >= 8) {
          const b = (i - 8) / 3;
          ctx.save();
          ctx.translate(c, gy - 10);
          ctx.scale(1, 0.32);
          celRing(ctx, SKYB, 0, 0, 100 + b * 200, 24 * (1 - b * 0.6), { broken: i >= 10 ? 0.5 : 0, seed: 193 });
          ctx.restore();
          for (const s of [-1, 1]) for (let j = 0; j < 3; j++) puff(ctx, CLOUDS, c + s * (80 + b * 180 + j * 30), gy - 20 - j * 8, 26 * (1 - b * 0.5) - j * 4, 194 + j, { holes: b > 0.5 ? 0.4 : 0, lobes: 5 });
          if (i <= 9) starburst(ctx, SUNLIT, c, gy - 40, 80 - (i - 8) * 20, 10, 195, { inner: 0.3 });
          const R = rng(196);
          for (let j = 0; j < 10; j++) sparkle(ctx, j % 2 ? SUNLIT : SKYB, c + (R() - 0.5) * 560, gy - 250 + R() * 90 + b * 130, 12 * (1.2 - b * 0.5), j);
        }
      },
    };
  })(), 2);

  // ---------- The Arbalist Engineer (brass and teal: gears, rivets, steam, teal energy) ----------
  // docs/design/arbalist.md. Her shapes: brass bolts wrapped in teal energy, cogs flying off her
  // hits, puffs of white steam, and her machines (the turret, Big Bertha's ballista).
  const BRASS = ['#ffffff', '#fff0c8', '#e8b85a', '#b8782a', '#5a3818'];
  const TEALE = ['#ffffff', '#c8fff4', '#4fe0d0', '#1fa098', '#0e4a52'];
  const STEAM = ['#ffffff', '#ffffff', '#eef2f4', '#c8d0d8', '#6a7888'];

  // A brass cog at (x, y), `r` to its teeth, `n` teeth, turned by `rot`, with a hole and a rim.
  function cogArt(ctx, x, y, r, n, rot = 0, pal = BRASS) {
    const pts = (k) => {
      const out = [];
      for (let i = 0; i < n * 4; i++) {
        const a = rot + (i / (n * 4)) * TAU;
        const tooth = Math.floor(i / 2) % 2 === 0;
        out.push([x + Math.cos(a) * r * k * (tooth ? 1 : 0.8), y + Math.sin(a) * r * k * (tooth ? 1 : 0.8)]);
      }
      return out;
    };
    inked(ctx, pts(1), pal[3], pal[4], 4);
    fill(ctx, pts(0.78).map(([px, py]) => [px - r * 0.06, py - r * 0.06]), pal[2]);
    ctx.beginPath();
    ctx.arc(x, y, r * 0.34, 0, TAU);
    ctx.fillStyle = pal[4];
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x - r * 0.08, y - r * 0.08, r * 0.2, 0, TAU);
    ctx.fillStyle = pal[1];
    ctx.fill();
  }
  // A brass bolt along +x ending at (x, y), `len` long: a teal-glowing head, a brass shaft, little
  // vane fins at the back.
  function boltArt(ctx, x, y, len, w) {
    inked(ctx, [[x - len, y - w * 0.3], [x - w, y - w * 0.3], [x - w, y + w * 0.3], [x - len, y + w * 0.3]], BRASS[2], BRASS[4], 3);
    inked(ctx, [[x, y], [x - w * 1.6, y - w * 0.9], [x - w * 1.3, y], [x - w * 1.6, y + w * 0.9]], TEALE[2], TEALE[4], 3);
    fill(ctx, [[x - w * 0.3, y], [x - w * 1.3, y - w * 0.4], [x - w * 1.1, y]], TEALE[0]);
    for (const sd of [-1, 1]) inked(ctx, [[x - len + w * 0.4, y], [x - len - w * 0.6, y + sd * w * 1.1], [x - len + w * 1.6, y + sd * w * 0.3]], BRASS[3], BRASS[4], 3);
  }

  // Her bolt in flight (loops, toward +x): teal energy streaking behind a brass bolt.
  E.aebolt = grown((() => {
    const cx = 120;
    const cy = 40;
    return {
      w: 150, h: 80, n: 4, fps: 30, px: cx, py: cy, loop: true,
      draw(ctx, i) {
        ribbon(ctx, TEALE, (u) => [cx - 30 - u * 80, cy + Math.sin(u * 8 + i * 1.6) * 3 * u], (u) => 9 * (1 - u), {});
        boltArt(ctx, cx, cy, 52, 9);
        sparkle(ctx, TEALE, cx - 60 - (i % 2) * 10, cy - 10 + (i % 2) * 18, 5, i);
      },
    };
  })(), 1.6);

  // A heavy bolt (her finishes, Overclock, Big Bertha): a big bolt wrapped in teal rings.
  E.aebig = grown((() => {
    const cx = 200;
    const cy = 60;
    return {
      w: 240, h: 120, n: 4, fps: 30, px: cx, py: cy, loop: true,
      draw(ctx, i) {
        ribbon(ctx, TEALE, (u) => [cx - 50 - u * 150, cy + Math.sin(u * 6 + i * 1.6) * 6 * u], (u) => 20 * (1 - u), {});
        boltArt(ctx, cx, cy, 110, 18);
        for (let k = 0; k < 3; k++) {
          const x = cx - 40 - k * 34 - (i * 8);
          ctx.save();
          ctx.translate(x, cy);
          ctx.scale(0.35, 1);
          celRing(ctx, TEALE, 0, 0, 30 - k * 4, 6, { seed: 301 + k });
          ctx.restore();
        }
      },
    };
  })(), 1.6);

  // Her mark on a monster: a teal burst, cogs flying off spinning, a puff of steam.
  E.aehit = grown((() => {
    const c = 110;
    return {
      w: 220, h: 220, n: 7, fps: 30, px: c, py: c,
      draw(ctx, i) {
        if (i <= 2) starburst(ctx, TEALE, c, c, [30, 46, 36][i], 8, 311, { inner: 0.32, rot: i * 0.25 });
        // (A slim teal ring popping out where the white smoke ball was, the all-class pass.)
        if (i >= 2 && i <= 5) celRing(ctx, TEALE, c, c, 20 + i * 9, 7 - i, { broken: i >= 4 ? 0.5 : 0, seed: 312 });
        if (i >= 1) {
          const k = (i - 1) / 5;
          for (const [a, r, n] of [[-2.2, 14, 7], [-0.6, 11, 6], [0.9, 9, 5]]) cogArt(ctx, c + Math.cos(a) * (30 + k * 60), c + Math.sin(a) * (30 + k * 60) + k * k * 30, r * (1 - k * 0.4), n, i * 0.8);
        }
      },
    };
  })(), 1.8);

  // A sticky or cluster bolt bursting: a brass and teal blast, cogs and rivets, a ring of steam.
  E.aeboom = grown((() => {
    const c = 130;
    return {
      w: 260, h: 240, n: 8, fps: 26, px: c, py: c + 40,
      draw(ctx, i) {
        if (i <= 3) starburst(ctx, BRASS, c, c, [40, 70, 80, 60][i], 10, 321, { inner: 0.3 });
        if (i >= 1 && i <= 4) starburst(ctx, TEALE, c, c, [30, 46, 40, 24][i - 1], 8, 322, { inner: 0.34, rot: 0.3 });
        if (i >= 2) {
          const k = (i - 2) / 5;
          ctx.save();
          ctx.translate(c, c + 40);
          ctx.scale(1, 0.32);
          celRing(ctx, STEAM, 0, 0, 50 + k * 70, 9 * (1 - k * 0.5), { broken: k > 0.5 ? 0.5 : 0, seed: 323 });
          ctx.restore();
          for (let j = 0; j < 5; j++) {
            const a = -Math.PI / 2 + (j - 2) * 0.6;
            cogArt(ctx, c + Math.cos(a) * (40 + k * 70), c + Math.sin(a) * (40 + k * 70) + k * k * 60, 10 * (1 - k * 0.5), 6, i + j);
          }
          // (No fat white smoke ball any more, the all-class pass: just brass glints drifting up.)
          if (i >= 4) for (let j = 0; j < 4; j++) sparkle(ctx, j % 2 ? BRASS : TEALE, c + (j - 1.5) * 34, c - 20 - k * 50 - (j % 2) * 14, 9 * (1 - k * 0.5), j);
        }
      },
    };
  })(), 2);

  // A puff of steam venting (Overdrive, Steam Vent, the recoil): it bursts out and drifts up.
  E.aesteam = grown((() => {
    const c = 90;
    return {
      w: 180, h: 180, n: 7, fps: 20, px: c, py: c + 40,
      draw(ctx, i) {
        const k = i / 6;
        puff(ctx, STEAM, c, c + 20 - k * 50, 20 + k * 26, 331, { holes: k > 0.5 ? (k - 0.5) * 1.6 : 0, lobes: 5 });
        if (i <= 3) for (const sd of [-1, 1]) puff(ctx, STEAM, c + sd * (20 + k * 40), c + 30 - k * 20, 12 + k * 10, 332 + sd, { lobes: 4 });
      },
    };
  })(), 2.5);

  // Her turret, a machine she sets down: a brass tripod, a crank drum and a little crossbow head with
  // a teal eye. Frames 0-3 idle (the head swivels a little, the drum turns), 4-5 firing (the head
  // kicks back, steam puffs off the drum).
  E.aeturret = {
    w: 180, h: 200, n: 6, fps: 8, px: 90, py: 190, loop: true,
    draw(ctx, i) {
      const fire = i >= 4;
      const kick = i === 4 ? 8 : 0;
      const tilt = fire ? -0.06 : [0, 0.05, 0, -0.05][i];
      // The tripod.
      for (const [x0, x1] of [[90, 40], [90, 140], [90, 100]]) inked(ctx, [[x0 - 4, 120], [x0 + 4, 120], [x1 + 4, 188], [x1 - 4, 188]], BRASS[3], BRASS[4], 4);
      // The drum.
      ctx.save();
      ctx.translate(90, 112);
      inked(ctx, [[-26, -16], [26, -16], [26, 16], [-26, 16]], BRASS[2], BRASS[4], 4);
      fill(ctx, [[-22, -12], [22, -12], [22, -6], [-22, -6]], BRASS[1]);
      ctx.restore();
      cogArt(ctx, 62, 112, 14, 7, i * 0.6);
      // The head.
      ctx.save();
      ctx.translate(98 - kick, 82);
      ctx.rotate(tilt);
      inked(ctx, [[-30, -10], [44, -10], [44, 10], [-30, 10]], BRASS[3], BRASS[4], 4);
      fill(ctx, [[-26, -6], [40, -6], [40, -1], [-26, -1]], BRASS[1]);
      inked(ctx, [[40, -30], [48, -30], [48, 30], [40, 30]], BRASS[2], BRASS[4], 4);
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, TAU);
      ctx.fillStyle = TEALE[3];
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-1, -1, 4.5, 0, TAU);
      ctx.fillStyle = TEALE[1];
      ctx.fill();
      ctx.restore();
      if (fire) {
        puff(ctx, STEAM, 50, 104 - (i - 4) * 14, 14 + (i - 4) * 8, 341, { lobes: 4 });
        if (i === 4) starburst(ctx, TEALE, 156, 82, 22, 8, 342, { inner: 0.3 });
      }
    },
  };

  // Big Bertha: the crossbow unfolds into a giant brass ballista over her (its arms swing out, a
  // great drum cranks), the huge bolt goes, and the machine vents in a cloud of steam and folds away.
  E.aeballista = (() => {
    const gx = 200;
    const gy = 300;
    return {
      w: 420, h: 320, n: 10, fps: 10, px: 160, py: gy,
      draw(ctx, i) {
        const open = Math.min(1, (i + 1) / 4);
        const fired = i >= 7;
        const fold = i >= 9;
        // The frame and the wheels.
        inked(ctx, [[gx - 120, gy - 70], [gx + 80, gy - 90], [gx + 84, gy - 70], [gx - 118, gy - 50]], BRASS[3], BRASS[4], 5);
        for (const x of [gx - 90, gx + 40]) cogArt(ctx, x, gy - 30, 30, 10, i * (i < 7 ? 0.4 : 0.1));
        // The arms swinging open.
        for (const sd of [-1, 1]) {
          const a = sd * (0.2 + 1.1 * open) * (fold ? 0.4 : 1);
          ctx.save();
          ctx.translate(gx + 80, gy - 80);
          ctx.rotate(-Math.PI / 2 + a * 0.5);
          inked(ctx, [[0, -8], [120 * open, -14], [130 * open, 0], [0, 8]], BRASS[2], BRASS[4], 5);
          ctx.restore();
        }
        // The string and the bolt on the rail (gone once fired).
        if (!fired) boltArt(ctx, gx + 150, gy - 80, 230, 22);
        // The great drum and its crank.
        cogArt(ctx, gx - 60, gy - 100, 40, 12, i * 0.5);
        if (i >= 4 && i <= 6) for (const k of [0, 1]) sparkle(ctx, TEALE, gx - 60 + (k ? 50 : -50), gy - 150, 10, i + k);
        if (i === 7) starburst(ctx, TEALE, gx + 160, gy - 80, 60, 10, 351, { inner: 0.3 });
        if (fired) for (let k = 0; k < 3; k++) puff(ctx, STEAM, gx - 80 + k * 70, gy - 120 - (i - 7) * 20, 36 + (i - 7) * 10, 352 + k, { holes: i >= 9 ? 0.5 : 0, lobes: 5 });
      },
    };
  })();

  // Her badge: a brass cog with a little crossbow across it.
  E.embgear = emblem(BRASS, (ctx) => {
    cogArt(ctx, 0, 0, 44, 10, 0.2);
    boltArt(ctx, 40, 0, 80, 10);
    inked(ctx, [[18, -30], [24, -30], [24, 30], [18, 30]], TEALE[2], TEALE[4], 3);
  });

  // ---------- The Acrobat Archer (mint and gold: gold arrows, mint ribbons, stars, confetti) ----------
  // docs/design/acrobat-archer.md. Her shapes: gold arrows trailing curling mint ribbons, five-point
  // gold stars, confetti, and the bright round bursts of a circus show.
  const MINT = ['#ffffff', '#dcfff0', '#5ed6a8', '#2a9a78', '#145a4a'];
  const SHOWG = ['#ffffff', '#fff4c8', '#ffd36a', '#e09a36', '#8e5228'];

  // A gold arrow along +x with its head at (x, y), `len` long, turned by `rot`.
  function goldArrow(ctx, x, y, len, rot = 0, w = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    inked(ctx, [[-len, -2.5 * w], [-14 * w, -2.5 * w], [-14 * w, 2.5 * w], [-len, 2.5 * w]], SHOWG[3], SHOWG[4], 3);
    fill(ctx, [[-len, -1 * w], [-14 * w, -1 * w], [-14 * w, 0.6 * w], [-len, 0.6 * w]], SHOWG[1]);
    inked(ctx, [[0, 0], [-18 * w, -9 * w], [-14 * w, 0], [-18 * w, 9 * w]], SHOWG[2], SHOWG[4], 3);
    fill(ctx, [[-3 * w, 0], [-14 * w, -5 * w], [-12 * w, 0]], SHOWG[0]);
    // Mint fletching.
    for (const sd of [-1, 1]) inked(ctx, [[-len + 2, 0], [-len + 14 * w, sd * 2], [-len + 6 * w, sd * 10 * w], [-len - 4 * w, sd * 9 * w]], MINT[2], MINT[4], 3);
    ctx.restore();
  }
  // A curling mint ribbon trailing back from (x, y) along -x, `len` long, waving with `ph`.
  function trailRibbon(ctx, x, y, len, w, ph, pal = MINT) {
    ribbon(ctx, pal, (u) => [x - u * len, y + Math.sin(u * 7 + ph) * w * 0.9 * u], (u) => w * (1 - u) * (0.5 + 0.5 * Math.sin(Math.PI * Math.min(1, u * 2 + 0.15))), { twist: 0.6 });
  }
  // A few squares of confetti scattered round (x, y) in `r`.
  function confetti(ctx, x, y, r, n, seed, s = 5) {
    const R = rng(seed);
    for (let j = 0; j < n; j++) {
      const a = R() * TAU;
      const d = r * (0.3 + R() * 0.7);
      const px = x + Math.cos(a) * d;
      const py = y + Math.sin(a) * d;
      const k = s * (0.6 + R() * 0.6);
      const t = R() * TAU;
      const pts = [[-k, -k * 0.6], [k, -k * 0.6], [k, k * 0.6], [-k, k * 0.6]].map(([qx, qy]) => [px + qx * Math.cos(t) - qy * Math.sin(t), py + qx * Math.sin(t) + qy * Math.cos(t)]);
      inked(ctx, pts, j % 3 === 0 ? MINT[2] : j % 3 === 1 ? SHOWG[2] : '#ff9ec8', j % 3 === 0 ? MINT[4] : SHOWG[4], 2);
    }
  }
  // A gold five-point star (cel tones, white heart).
  function goldStar(ctx, x, y, r, rot = 0, pal = SHOWG) {
    const pts = (k) => Array.from({ length: 10 }, (_, i) => {
      const a = rot - Math.PI / 2 + (i * Math.PI) / 5;
      const rr = (i % 2 ? r * 0.46 : r) * k;
      return [x + Math.cos(a) * rr, y + Math.sin(a) * rr];
    });
    inked(ctx, pts(1), pal[3], pal[4], 4);
    fill(ctx, pts(0.8), pal[2]);
    fill(ctx, pts(0.55).map(([px, py]) => [px - r * 0.06, py - r * 0.06]), pal[1]);
    fill(ctx, pts(0.25), pal[0]);
  }

  // Her arrow in flight (loops, toward +x): a gold arrow with a mint ribbon curling behind it and a
  // couple of sparkles.
  E.acarrow = grown((() => {
    const cx = 150;
    const cy = 40;
    return {
      w: 170, h: 80, n: 6, fps: 24, px: cx, py: cy, loop: true,
      draw(ctx, i) {
        const ph = (i / 6) * TAU;
        // A soft speed streak behind it, then a thin mint streamer curling off the nock: the
        // arrow itself stays clean and slim, a real arrow with a gold shaft, a sharp head and
        // mint fletching.
        ctx.globalAlpha = 0.55;
        ctx.strokeStyle = SHOWG[1];
        ctx.lineCap = 'round';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx - 84, cy);
        ctx.lineTo(cx - 150, cy);
        ctx.stroke();
        ctx.globalAlpha = 1;
        trailRibbon(ctx, cx - 82, cy, 64, 5, ph);
        goldArrow(ctx, cx, cy, 82, 0, 0.9);
        sparkle(ctx, SHOWG, cx - 104 - (i % 3) * 10, cy + 8 * Math.sin(ph), 4.5, i);
      },
    };
  })(), 1.8);

  // Her big arrow (finishers, Showtime): a longer, heavier gold arrow, two thin ribbons spiralling
  // round the streak behind it, and a small star flashing at its head.
  E.acbig = grown((() => {
    const cx = 220;
    const cy = 60;
    return {
      w: 250, h: 120, n: 6, fps: 24, px: cx, py: cy, loop: true,
      draw(ctx, i) {
        const ph = (i / 6) * TAU;
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = SHOWG[1];
        ctx.lineCap = 'round';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(cx - 120, cy);
        ctx.lineTo(cx - 220, cy);
        ctx.stroke();
        ctx.globalAlpha = 1;
        trailRibbon(ctx, cx - 116, cy, 110, 9, ph);
        trailRibbon(ctx, cx - 116, cy, 100, 7, ph + Math.PI, SHOWG);
        goldArrow(ctx, cx, cy, 120, 0, 1.25);
        starburst(ctx, SHOWG, cx + 2, cy, 10 + (i % 2) * 3, 8, 601, { inner: 0.4, rot: i * 0.3 });
      },
    };
  })(), 1.6);

  // Her mark on a monster: a gold star pops with a mint ribbon looping round it, then confetti flies.
  E.achit = grown((() => {
    const c = 100;
    return {
      w: 200, h: 200, n: 7, fps: 30, px: c, py: c,
      draw(ctx, i) {
        if (i <= 3) {
          ctx.save();
          ctx.translate(c, c);
          ctx.rotate(i * 0.5);
          ribbon(ctx, MINT, (u) => [Math.cos(u * TAU * 0.8) * (28 + i * 8), Math.sin(u * TAU * 0.8) * (20 + i * 6)], (u) => 9 * Math.sin(Math.PI * u) * (1 - i * 0.18), { twist: 0.5 });
          ctx.restore();
        }
        if (i <= 3) goldStar(ctx, c, c, [16, 26, 22, 14][i], i * 0.4);
        if (i >= 2) confetti(ctx, c, c - (i - 2) * 6, 30 + (i - 2) * 14, 8, 602, 6 - (i - 2) * 0.8);
        if (i >= 5) for (let j = 0; j < 3; j++) sparkle(ctx, SHOWG, c + (j - 1) * 30, c - 30 - (i - 5) * 8, 7, j);
      },
    };
  })(), 1.8);

  // Firework Arrow (her Blast Arrow proc): a firework bursting where the arrow lands, rays of gold
  // and mint shooting out and drooping, crackling into sparkles.
  E.acfirework = grown((() => {
    const c = 120;
    return {
      w: 240, h: 240, n: 8, fps: 24, px: c, py: c,
      draw(ctx, i) {
        const k = Math.min(1, (i + 1) / 4);
        if (i <= 1) starburst(ctx, SHOWG, c, c, 26 + i * 12, 10, 611, { inner: 0.3 });
        if (i >= 1 && i <= 5) {
          for (let j = 0; j < 10; j++) {
            const a = (j / 10) * TAU;
            const d = 20 + k * 70;
            const x = c + Math.cos(a) * d;
            const y = c + Math.sin(a) * d + (i - 1) * (i - 1) * 2;
            const tail = 26 * (1 - (i - 1) * 0.15);
            speedLine(ctx, j % 2 ? MINT : SHOWG, x - Math.cos(a) * tail, y - Math.sin(a) * tail - (i - 1) * 2, x, y, 6 - (i - 1) * 0.8);
            if (i >= 3) sparkle(ctx, j % 2 ? MINT : SHOWG, x, y, 6, j);
          }
        }
        if (i >= 5) {
          const R = rng(612);
          for (let j = 0; j < 12; j++) sparkle(ctx, j % 2 ? MINT : SHOWG, c + (R() - 0.5) * 200, c + (R() - 0.5) * 160 + (i - 5) * 12, 8 - (i - 5) * 2, j);
        }
      },
    };
  })(), 2.4);

  // Ribbon Snare (her Snare Arrow proc): a mint ribbon looped round a monster, fluttering, its bow
  // knotted at the front (loops while it is held).
  E.acribbon = (() => {
    const c = 80;
    return {
      w: 160, h: 160, n: 6, fps: 12, px: c, py: c, loop: true,
      draw(ctx, i) {
        const ph = (i / 6) * TAU;
        for (const [y, w] of [[-26, 26], [0, 34], [26, 28]]) {
          ctx.save();
          ctx.translate(c, c + y);
          ctx.scale(1, 0.32);
          celRing(ctx, MINT, 0, 0, w + Math.sin(ph + y) * 2, 8, { seed: 621 });
          ctx.restore();
        }
        // The bow at the front, its tails fluttering.
        for (const sd of [-1, 1]) inked(ctx, [[c, c], [c + sd * 18, c - 10 + Math.sin(ph) * 2], [c + sd * 20, c + 8], [c + sd * 4, c + 3]], MINT[2], MINT[4], 3);
        for (const sd of [-1, 1]) ribbon(ctx, MINT, (u) => [c + sd * (4 + u * 12), c + 4 + u * 26 + Math.sin(ph + u * 5) * 4 * u], (u) => 6 * (1 - u * 0.6), {});
        inked(ctx, Array.from({ length: 10 }, (_, j) => [c + Math.cos((j / 10) * TAU) * 5, c + 1 + Math.sin((j / 10) * TAU) * 4]), SHOWG[2], SHOWG[4], 3);
      },
    };
  })();

  // Her springboard (Spring Trap): a little striped circus springboard on the ground, its board
  // bobbing on the spring (frames 0-3, loops); frames 4-7 it fires (the board snaps up, a gold star
  // and a "boing" of rings).
  E.acspring = grown((() => {
    const c = 80;
    const gy = 100;
    return {
      w: 160, h: 120, n: 8, fps: 10, px: c, py: gy,
      draw(ctx, i) {
        const fire = i >= 4 ? i - 4 : -1;
        const bob = fire < 0 ? Math.sin((i / 4) * TAU) * 2 : 0;
        const up = fire < 0 ? 0 : [26, 18, 8, 2][fire];
        inked(ctx, [[c - 36, gy], [c + 36, gy], [c + 32, gy - 8], [c - 32, gy - 8]], SHOWG[3], SHOWG[4], 3);
        // The spring.
        for (let k = 0; k < 4; k++) {
          const y = gy - 10 - k * (4 + up / 4) - bob;
          inked(ctx, [[c - 10, y], [c + 10, y - 2], [c + 10, y], [c - 10, y + 2]], '#dfe6f2', '#5a6a8a', 2);
        }
        // The board, striped mint and white, tilted up as it fires.
        const by = gy - 28 - up - bob;
        ctx.save();
        ctx.translate(c, by);
        ctx.rotate(fire >= 0 ? -0.3 * (1 - fire / 4) : 0);
        inked(ctx, [[-38, -4], [38, -4], [38, 4], [-38, 4]], MINT[2], MINT[4], 3);
        for (let s2 = -30; s2 < 34; s2 += 16) fill(ctx, [[s2, -3], [s2 + 8, -3], [s2 + 8, 3], [s2, 3]], '#ffffff');
        ctx.restore();
        if (fire >= 0) {
          ctx.save();
          ctx.translate(c, by - 10);
          ctx.scale(1, 0.4);
          celRing(ctx, SHOWG, 0, 0, 20 + fire * 14, 8 - fire * 1.5, { broken: fire >= 2 ? 0.4 : 0, seed: 631 });
          ctx.restore();
          goldStar(ctx, c, by - 24 - fire * 10, 12 - fire * 2, fire * 0.5);
        }
      },
    };
  })(), 2);

  // Grand Somersault: at the top of her leap a great gold ring of light bursts round her, arrows
  // fanning out of it all the way round and down, confetti everywhere (one-shot, played over her).
  E.acburst = grown((() => {
    const c = 160;
    return {
      w: 320, h: 320, n: 9, fps: 14, px: c, py: c,
      draw(ctx, i) {
        const k = Math.min(1, (i + 1) / 4);
        // (The rings open out clear of her and slimmer, and no gold star bursts over her any more,
        // the all-class pass: they sat right across her face.)
        if (i <= 6) celRing(ctx, SHOWG, c, c, 70 + k * 70, 8 * (1 - i / 9), { broken: i >= 4 ? 0.45 : 0.1, seed: 641 });
        if (i <= 5) celRing(ctx, MINT, c, c, 58 + k * 40, 4.5 * (1 - i / 9), { broken: 0.3, seed: 642 });
        if (i >= 1 && i <= 6) for (let j = 0; j < 10; j++) {
          const a = Math.PI * 0.05 + (j / 9) * Math.PI * 0.9;
          goldArrow(ctx, c + Math.cos(a) * (40 + k * 100), c + Math.sin(a) * (40 + k * 100), 34, a, 0.7);
        }
        if (i <= 2) for (const sd of [-1, 1]) goldStar(ctx, c + sd * (80 + i * 14), c - 30, 14 + i * 4, i * 0.4);
        if (i >= 3) confetti(ctx, c, c + 40 + (i - 3) * 12, 110 + (i - 3) * 16, 18, 643, 7);
      },
    };
  })(), 2.4);

  // Showtime (her gauge full; internally Momentum): gold stars and mint ribbons twirling round her.
  E.acaura = (() => {
    const c = 80;
    return {
      w: 160, h: 160, n: 8, fps: 10, px: c, py: c, loop: true,
      draw(ctx, i) {
        const ph = (i / 8) * TAU;
        ctx.save();
        ctx.translate(c, c);
        ctx.scale(1, 0.4);
        ribbon(ctx, MINT, (u) => [Math.cos(u * TAU * 0.7 + ph) * 60, Math.sin(u * TAU * 0.7 + ph) * 60], (u) => 8 * Math.sin(Math.PI * u), { twist: 0.6 });
        ctx.restore();
        for (let j = 0; j < 3; j++) {
          const a = ph + (j / 3) * TAU;
          goldStar(ctx, c + Math.cos(a) * 58, c + Math.sin(a) * 22, 8 + 2 * Math.sin(a), a);
        }
      },
    };
  })();

  // Her badge: a gold star with a mint ribbon and a gold arrow through it.
  E.embacro = emblem(MINT, (ctx) => {
    goldArrow(ctx, 50, 10, 100, -0.35, 1.1);
    goldStar(ctx, 0, 0, 40, 0);
    for (const sd of [-1, 1]) ribbon(ctx, MINT, (u) => [sd * (8 + u * 36), 30 + u * 14 + Math.sin(u * 5) * 4], (u) => 10 * (1 - u * 0.5), {});
  });

  // ---------- The Phantom Trickster (plum and silver: smoke, cards, doves, top hats) ----------
  // docs/design/phantom-trickster.md. Her shapes: plum arrows trailing wisps of smoke, silver
  // sparkles, playing cards with their suits, silver doves, and puffs of plum stage smoke.
  const PLUM = ['#ffffff', '#f2dcf6', '#b86ac0', '#7a3a8a', '#3a1446'];
  const PSILV = ['#ffffff', '#f8f6ff', '#dcdcee', '#9a9cc0', '#4a4a6a'];
  const SMOKE = ['#ffffff', '#ecd8f4', '#c8a0dc', '#8e5cac', '#3a1446'];

  // A plum arrow along +x, head at (x, y), `len` long.
  function plumArrow(ctx, x, y, len, w = 1) {
    inked(ctx, [[x - len, y - 2.4 * w], [x - 13 * w, y - 2.4 * w], [x - 13 * w, y + 2.4 * w], [x - len, y + 2.4 * w]], PLUM[3], PLUM[4], 3);
    fill(ctx, [[x - len, y - 0.9 * w], [x - 13 * w, y - 0.9 * w], [x - 13 * w, y + 0.5 * w], [x - len, y + 0.5 * w]], PLUM[1]);
    inked(ctx, [[x, y], [x - 17 * w, y - 8 * w], [x - 13 * w, y], [x - 17 * w, y + 8 * w]], PSILV[2], PSILV[4], 3);
    fill(ctx, [[x - 3 * w, y], [x - 13 * w, y - 4.5 * w], [x - 11 * w, y]], PSILV[0]);
    for (const sd of [-1, 1]) inked(ctx, [[x - len + 2, y], [x - len + 13 * w, y + sd * 2], [x - len + 6 * w, y + sd * 9 * w], [x - len - 4 * w, y + sd * 8 * w]], PLUM[2], PLUM[4], 3);
  }
  // A card suit at (x, y), `r` big: 0 spade, 1 heart, 2 diamond, 3 club.
  function suit(ctx, x, y, r, k, c, ink) {
    const heart = (sy) => Array.from({ length: 24 }, (_, j) => {
      const t = (j / 24) * TAU;
      return [x + (Math.sin(t) ** 3) * r, y + sy * ((13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16) * r];
    });
    if (k === 0) {
      inked(ctx, heart(1), c, ink, 2.5);
      inked(ctx, [[x, y], [x + r * 0.5, y + r * 1.3], [x - r * 0.5, y + r * 1.3]], c, ink, 2.5);
    } else if (k === 1) inked(ctx, heart(-1), c, ink, 2.5);
    else if (k === 2) inked(ctx, [[x, y - r * 1.2], [x + r * 0.8, y], [x, y + r * 1.2], [x - r * 0.8, y]], c, ink, 2.5);
    else {
      for (const [dx, dy] of [[0, -0.55], [-0.55, 0.2], [0.55, 0.2]]) inked(ctx, Array.from({ length: 14 }, (_, j) => [x + dx * r + Math.cos((j / 14) * TAU) * r * 0.5, y + dy * r + Math.sin((j / 14) * TAU) * r * 0.5]), c, ink, 2.5);
      inked(ctx, [[x, y], [x + r * 0.4, y + r * 1.2], [x - r * 0.4, y + r * 1.2]], c, ink, 2.5);
    }
  }
  // A playing card at (x, y), `h` tall, turned by `rot`, seen edge-on by `squash` (spinning).
  function cardArt(ctx, x, y, h, rot, squash, k) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(Math.max(0.12, Math.abs(squash)), 1);
    const w = h * 0.68;
    inked(ctx, [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], PSILV[0], PSILV[4], 3);
    if (squash > 0.3) suit(ctx, 0, 0, h * 0.22, k, k % 2 ? '#e0405a' : PLUM[3], PLUM[4]);
    else fill(ctx, [[-w / 2 + 3, -h / 2 + 3], [w / 2 - 3, -h / 2 + 3], [w / 2 - 3, h / 2 - 3], [-w / 2 + 3, h / 2 - 3]], PLUM[2]);
    ctx.restore();
  }
  // A silver dove at (x, y), `s` big, facing +x, wings at `flap` (-1 up to 1 down).
  function doveArt(ctx, x, y, s, flap) {
    const wing = (dy) => [[x - s * 0.3, y], [x - s * 0.9, y + dy * s], [x + s * 0.2, y + dy * s * 0.7], [x + s * 0.3, y]];
    inked(ctx, wing(-1.1 * flap - 0.2), PSILV[2], PSILV[4], 3);
    inked(ctx, [[x - s, y + s * 0.1], [x - s * 0.3, y - s * 0.35], [x + s * 0.5, y - s * 0.4], [x + s * 0.9, y - s * 0.2], [x + s * 0.5, y + s * 0.3], [x - s * 0.5, y + s * 0.3], [x - s * 1.3, y + s * 0.5]], PSILV[0], PSILV[4], 3);
    inked(ctx, [[x + s * 0.9, y - s * 0.25], [x + s * 1.25, y - s * 0.12], [x + s * 0.9, y - s * 0.05]], '#ffb86a', '#8e5228', 2);
    fill(ctx, wing(-0.7 * flap), PSILV[1]);
  }

  // Her arrow in flight (loops, toward +x): a plum arrow with a wisp of smoke curling behind and
  // silver sparkles.
  E.ptarrow = grown((() => {
    const cx = 120;
    const cy = 40;
    return {
      w: 140, h: 80, n: 6, fps: 24, px: cx, py: cy, loop: true,
      draw(ctx, i) {
        const ph = (i / 6) * TAU;
        for (let j = 0; j < 3; j++) puff(ctx, SMOKE, cx - 66 - j * 18, cy + Math.sin(ph + j) * 5, 9 - j * 2, 701 + j + i, { lobes: 4, holes: j > 1 ? 0.4 : 0 });
        plumArrow(ctx, cx, cy, 64);
        for (let j = 0; j < 2; j++) sparkle(ctx, PSILV, cx - 40 - j * 26, cy + (j ? 12 : -12) * Math.cos(ph), 6 - j, i + j);
      },
    };
  })(), 1.8);

  // Her big arrow: a bigger plum arrow trailing smoke, the four suits tumbling in its wake.
  E.ptbig = grown((() => {
    const cx = 190;
    const cy = 60;
    return {
      w: 230, h: 120, n: 6, fps: 20, px: cx, py: cy, loop: true,
      draw(ctx, i) {
        const ph = (i / 6) * TAU;
        for (let j = 0; j < 4; j++) puff(ctx, SMOKE, cx - 110 - j * 22, cy + Math.sin(ph + j) * 8, 16 - j * 3, 711 + j + i, { lobes: 5, holes: j > 2 ? 0.4 : 0 });
        for (let k = 0; k < 4; k++) suit(ctx, cx - 50 - k * 30, cy + Math.sin(ph + k * 1.6) * 22, 7, k, k % 2 ? '#e0405a' : PSILV[2], PLUM[4]);
        plumArrow(ctx, cx, cy, 110, 1.5);
        starburst(ctx, PSILV, cx + 2, cy, 16 + (i % 2) * 4, 8, 712, { inner: 0.4 });
      },
    };
  })(), 1.6);

  // Her mark on a monster: a silver flash, a puff of plum smoke, and three cards fanning out of it.
  E.pthit = grown((() => {
    const c = 100;
    return {
      w: 200, h: 200, n: 7, fps: 30, px: c, py: c,
      draw(ctx, i) {
        if (i <= 2) starburst(ctx, PSILV, c, c, [22, 34, 26][i], 8, 721, { inner: 0.4 });
        if (i >= 1 && i <= 4) celRing(ctx, SMOKE, c, c, 16 + i * 10, 7 - i, { broken: i >= 3 ? 0.5 : 0, seed: 722 });
        if (i >= 1 && i <= 5) for (let j = 0; j < 3; j++) {
          const a = -Math.PI / 2 + (j - 1) * 0.7;
          const d = 18 + i * 12;
          cardArt(ctx, c + Math.cos(a) * d, c + Math.sin(a) * d, 26 - i * 2, a + Math.PI / 2, Math.cos(i * 0.9 + j), j);
        }
        if (i >= 5) for (let j = 0; j < 4; j++) sparkle(ctx, PSILV, c + (j - 1.5) * 26, c - 50 - (i - 5) * 8, 7, j);
      },
    };
  })(), 1.8);

  // A puff of stage smoke (vanishing and appearing, her copies coming and going): plum smoke
  // billowing out round a silver flash, then thinning into sparkles.
  E.ptsmoke = grown((() => {
    const c = 90;
    const gy = 150;
    return {
      w: 180, h: 170, n: 7, fps: 20, px: c, py: gy,
      draw(ctx, i) {
        const k = Math.min(1, (i + 1) / 3);
        if (i <= 1) starburst(ctx, PSILV, c, gy - 50, 24 + i * 12, 8, 731, { inner: 0.4 });
        if (i <= 5) for (let j = 0; j < 6; j++) {
          const a = (j / 6) * TAU;
          puff(ctx, SMOKE, c + Math.cos(a) * 34 * k, gy - 50 + Math.sin(a) * 34 * k - (i > 2 ? (i - 2) * 6 : 0), 22 * (1 - (i > 3 ? (i - 3) * 0.25 : 0)), 732 + j, { lobes: 5, holes: i >= 4 ? 0.5 : 0 });
        }
        if (i >= 4) for (let j = 0; j < 6; j++) sparkle(ctx, PSILV, c + Math.cos(j) * 50, gy - 60 - (i - 4) * 14 + Math.sin(j * 2) * 30, 8 - (i - 4) * 2, j);
      },
    };
  })(), 3);

  // A silver dove in flight (loops, toward +x): Dove Arrow's doves.
  E.ptdove = grown({
    w: 90, h: 70, n: 4, fps: 12, px: 50, py: 35, loop: true,
    draw(ctx, i) {
      doveArt(ctx, 50, 38, 22, [1, 0, -1, 0][i]);
    },
  }, 2);
  // A spinning card in flight (loops): Card Trick's cards.
  E.ptcard = grown({
    w: 60, h: 60, n: 6, fps: 24, px: 30, py: 30, loop: true,
    draw(ctx, i) {
      cardArt(ctx, 30, 30, 34, 0.5, Math.cos((i / 6) * TAU), i % 4);
    },
  }, 2);

  // Grand Illusion: a great ring of stage smoke bursts open round her, silver stars scattering and
  // cards fluttering down through it.
  E.ptillusion = grown((() => {
    const c = 180;
    const gy = 220;
    return {
      w: 360, h: 240, n: 10, fps: 12, px: c, py: gy,
      draw(ctx, i) {
        const k = Math.min(1, (i + 1) / 4);
        // (A slim ring of plum smoke opening on the stage, the all-class pass; it was ten fat cloud
        // balls that filled the screen.)
        if (i <= 7) {
          ctx.save();
          ctx.translate(c, gy - 20);
          ctx.scale(1, 0.3);
          celRing(ctx, SMOKE, 0, 0, 150 * k, 9 * (1 - (i > 5 ? (i - 5) * 0.3 : 0)), { broken: i >= 5 ? 0.45 : 0.15, seed: 741 });
          celRing(ctx, PLUM, 0, 0, 120 * k, 4, { broken: 0.5, seed: 744 });
          ctx.restore();
          if (i <= 5) for (let j = 0; j < 6; j++) {
            const a = (j / 6) * TAU + 0.4;
            puff(ctx, SMOKE, c + Math.cos(a) * 150 * k, gy - 20 + Math.sin(a) * 45 * k, 10 - i, 741 + j, { lobes: 4, holes: i >= 4 ? 0.4 : 0 });
          }
        }
        if (i <= 2) starburst(ctx, PSILV, c, gy - 70, 40 + i * 20, 10, 742, { inner: 0.3 });
        if (i >= 2) for (let j = 0; j < 8; j++) cardArt(ctx, c + (j - 3.5) * 40, gy - 190 + (i - 2) * 22 + (j % 2) * 20, 22, j * 0.5 + i * 0.3, Math.cos(i * 0.8 + j), j % 4);
        if (i >= 6) {
          const R = rng(743);
          for (let j = 0; j < 12; j++) sparkle(ctx, j % 2 ? PSILV : PLUM, c + (R() - 0.5) * 320, gy - 40 - R() * 150, 9 - (i - 6) * 2, j);
        }
      },
    };
  })(), 1.6);

  // Illusion (her gauge; full: her copies shoot with every arrow): silver sparkles and two little
  // cards turning round her.
  E.ptaura = (() => {
    const c = 80;
    return {
      w: 160, h: 160, n: 8, fps: 10, px: c, py: c, loop: true,
      draw(ctx, i) {
        const ph = (i / 8) * TAU;
        for (let j = 0; j < 2; j++) {
          const a = ph + j * Math.PI;
          cardArt(ctx, c + Math.cos(a) * 54, c + Math.sin(a) * 18, 22, 0.2, Math.cos(a * 2), j * 2 + 1);
        }
        for (let j = 0; j < 3; j++) sparkle(ctx, PSILV, c + Math.cos(ph * 1.5 + j * 2) * 40, c - 20 + Math.sin(ph + j) * 16, 6, i + j);
      },
    };
  })();

  // Her badge: a plum top hat with a silver band, a card tucked in it and a star over it.
  E.embphantom = emblem(PLUM, (ctx, pal) => {
    inked(ctx, [[-48, 30], [48, 30], [44, 20], [-44, 20]], pal[3], pal[4], 5);
    inked(ctx, [[-28, 22], [28, 22], [24, -36], [-24, -36]], pal[3], pal[4], 5);
    fill(ctx, [[-22, 16], [-14, 16], [-12, -30], [-20, -30]], pal[2]);
    fill(ctx, [[-27, 10], [27, 10], [26, 18], [-26, 18]], PSILV[2]);
    cardArt(ctx, 18, -10, 30, 0.3, 1, 1);
    sparkle(ctx, PSILV, 34, -48, 12, 0.2);
  });


  // Grand Verdict's halo: a great sun of light opening behind the kneeling Paladin: a ring with
  // long and short rays round it, turning slowly while it holds, then the rays draw in and it
  // breaks up into diamonds and sparkles.
  E.halo = asLight({
    w: 380, h: 380, n: 9, fps: 10, px: 190, py: 190,
    draw(ctx, i) {
      const c = 190;
      const pal = PAL.holy;
      const open = [0.45, 0.8, 1, 1, 1, 1, 0.9, 0, 0][i];
      const rot = i * 0.06;
      if (open > 0) {
        for (let j = 0; j < 16; j++) {
          const a = rot + (j / 16) * TAU;
          const r0 = 86 * open;
          const r1 = (j % 2 ? 128 : 172) * open * (i === 6 ? 0.8 : 1);
          const w = j % 2 ? 7 : 11;
          const n = [Math.cos(a + Math.PI / 2) * w, Math.sin(a + Math.PI / 2) * w];
          inked(ctx, [[c + Math.cos(a) * r0 + n[0], c + Math.sin(a) * r0 + n[1]], [c + Math.cos(a) * r1, c + Math.sin(a) * r1], [c + Math.cos(a) * r0 - n[0], c + Math.sin(a) * r0 - n[1]]], pal[2], pal[4], 3);
          fill(ctx, [[c + Math.cos(a) * r0 + n[0] * 0.4, c + Math.sin(a) * r0 + n[1] * 0.4], [c + Math.cos(a) * (r1 - 8), c + Math.sin(a) * (r1 - 8)], [c + Math.cos(a) * r0 - n[0] * 0.4, c + Math.sin(a) * r0 - n[1] * 0.4]], pal[0]);
        }
        celRing(ctx, pal, c, c, 84 * open, 16, { broken: i === 6 ? 0.5 : 0, seed: 820 });
        celRing(ctx, pal, c, c, 52 * open, 6, { broken: i >= 5 ? 0.3 : 0, seed: 821 });
        for (let j = 0; j < 4; j++) {
          const a = -rot * 2 + (j / 4) * TAU;
          diamond(ctx, pal, c + Math.cos(a) * 68 * open, c + Math.sin(a) * 68 * open, 7);
        }
        if (i >= 2 && i <= 5) for (let j = 0; j < 3; j++) sparkle(ctx, pal, c + Math.cos(rot * 3 + j * 2.1) * 150, c + Math.sin(rot * 3 + j * 2.1) * 150, 10 + ((i + j) % 2) * 4, j);
      } else {
        const k = (i - 6) / 2;
        const r = rng(830);
        for (let j = 0; j < 14; j++) {
          const a = (j / 14) * TAU + r() * 0.3;
          const d = 90 + k * 70 + r() * 30;
          if (j % 2) diamond(ctx, pal, c + Math.cos(a) * d, c + Math.sin(a) * d, 7 * (1.2 - k * 0.6));
          else sparkle(ctx, pal, c + Math.cos(a) * d, c + Math.sin(a) * d, 11 * (1.2 - k * 0.6), a);
        }
      }
    },
  }, PAL.holy);

  // An axe as the effects draw it: a haft from the grip (0, 0) up to `top`, a broad crescent
  // blade out to +x near the top and a spike back to -x.
  function axeArt(ctx, pal, x, y, rot, L, k = L / 150, hw = k) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    inked(ctx, [[-6 * hw, 20 * hw], [6 * hw, 20 * hw], [6 * hw, -L], [-6 * hw, -L]], pal[3], pal[4], 4);
    fill(ctx, [[-2 * hw, 16 * hw], [2 * hw, 16 * hw], [2 * hw, -L + 4], [-2 * hw, -L + 4]], pal[1]);
    const hy = -L + 26 * k;
    const blade = [[4 * k, hy - 24 * k], [36 * k, hy - 52 * k], [62 * k, hy - 30 * k], [70 * k, hy + 4 * k], [60 * k, hy + 36 * k], [34 * k, hy + 52 * k], [4 * k, hy + 26 * k]];
    inked(ctx, blade, pal[2], pal[4], 4);
    fill(ctx, [[30 * k, hy - 40 * k], [58 * k, hy - 24 * k], [64 * k, hy + 4 * k], [56 * k, hy + 30 * k], [32 * k, hy + 42 * k], [46 * k, hy + 4 * k]], pal[1]);
    fill(ctx, [[54 * k, hy - 22 * k], [62 * k, hy + 4 * k], [54 * k, hy + 28 * k], [58 * k, hy + 4 * k]], pal[0]);
    inked(ctx, [[-4 * k, hy - 14 * k], [-34 * k, hy], [-4 * k, hy + 14 * k]], pal[2], pal[4], 3.5);
    diamond(ctx, pal, 0, hy, 8 * k, 1.2);
    ctx.restore();
  }
  // Crimson Eclipse's throw: the Berserker's axe hurled spinning round him, a wheel of burning
  // crescents behind it. Loops (one turn in eight drawings).
  E.axewheel = asLight({
    w: 240, h: 240, n: 8, fps: 24, px: 120, py: 120, loop: true,
    draw(ctx, i) {
      const c = 120;
      const a = (i / 8) * TAU;
      celCrescent(ctx, PAL.rage, c, c, 100, a - Math.PI / 2 - 1.6, a - Math.PI / 2, 30, { seed: 840, rough: 0.3 });
      celCrescent(ctx, PAL.rage, c, c, 100, a + Math.PI / 2 - 1.6, a + Math.PI / 2, 22, { seed: 841, rough: 0.3 });
      axeArt(ctx, PAL.rage, c, c + 30 * Math.cos(a) * 0, a, 84, 0.95, 0.75);
      sparkle(ctx, PAL.rage, c + Math.cos(a - Math.PI / 2) * 96, c + Math.sin(a - Math.PI / 2) * 96, 9, a);
    },
  }, PAL.rage);

  // The giant axe of fire (Crimson Eclipse's smash): driven head-first into the ground, held whole,
  // then cracking apart into burning shards; and the same forming out of its shards.
  function giantAxe(pal) {
    const w = 330;
    const h = 430;
    const cx = 110;
    const gy = 418;
    return {
      w, h, n: 5, fps: 18, px: cx, py: gy,
      draw(ctx, i) {
        if (i <= 1) {
          // Upside down: the head at the bottom, biting into the ground, the haft rising out of it.
          ctx.save();
          ctx.translate(cx, 40);
          ctx.scale(1, -1);
          axeArt(ctx, pal, 0, 0, 0, 312, 2.7, 1.5);
          ctx.restore();
          if (i === 1) for (const [x, y] of [[cx + 60, 330], [cx - 20, 200], [cx + 10, 90]]) sparkle(ctx, pal, x, y, 12, 0.2);
          return;
        }
        const k = (i - 1) / 3;
        const R = rng(851);
        for (let j = 0; j < 8; j++) {
          const y = 40 + j * 42;
          const x = cx + (j > 5 ? 60 : 0) + (R() - 0.5) * 30 + (j % 2 ? 1 : -1) * k * 44;
          shard(ctx, pal, x, y - k * 30, -Math.PI / 2 + (R() - 0.5) * 1.2, 26 * (1.1 - k * 0.6), 7 * (1.1 - k * 0.6));
        }
        if (i < 4) for (let j = 0; j < 5; j++) sparkle(ctx, pal, cx + (R() - 0.3) * 120, 100 + R() * 260 - k * 40, 8, j);
      },
    };
  }
  E.rageaxe = asLight(giantAxe(PAL.rage), PAL.rage);
  E.rageaxeform = { ...E.rageaxe, n: 5, fps: 14, draw: (ctx, i) => E.rageaxe.draw(ctx, [4, 3, 2, 1, 0][i]) };

  // ---------- Team moves (world/teamwork.js) ----------
  // The party's own colour, whoever's job it is: a warm sunrise peach with sky blue beside it, and
  // the shape of two stars meeting (a high five): two friends' blows clinking together.
  const TEAM = ['#ffffff', '#fff1dc', '#ffc58a', '#ff9670', '#c4567a'];
  const TEAMSKY = PAL.sky;

  // A Team Catch on a monster: two little stars, peach and sky, fly in from either side and clink
  // together in a burst, a ring flicks out, and they break into beads and sparkles.
  E.teamcatch = (() => {
    const c = 110;
    return {
      w: 220, h: 220, n: 8, fps: 30, px: c, py: c,
      draw(ctx, i) {
        if (i <= 1) {
          const d = [46, 18][i];
          goldStar(ctx, c - d, c + d * 0.3, 15 + i * 3, -0.4 + i * 0.4, TEAM);
          goldStar(ctx, c + d, c - d * 0.3, 15 + i * 3, 0.4 - i * 0.4, TEAMSKY);
          for (const sd of [-1, 1]) speedLine(ctx, sd < 0 ? TEAM : TEAMSKY, c + sd * (d + 46), c - sd * (d * 0.3 + 14), c + sd * (d + 16), c - sd * (d * 0.3 + 4), 5);
          return;
        }
        if (i <= 4) {
          const k = (i - 2) / 2;
          starburst(ctx, TEAM, c, c, [30, 38, 32][i - 2], 10, 901, { inner: 0.36, rot: i * 0.2 });
          celRing(ctx, TEAMSKY, c, c, 34 + k * 40, 12 - k * 7, { broken: k * 0.5, seed: 902 });
          goldStar(ctx, c - 12 - k * 22, c - 4, 12 - k * 4, -0.5 - k, TEAM);
          goldStar(ctx, c + 12 + k * 22, c + 4, 12 - k * 4, 0.5 + k, TEAMSKY);
          return;
        }
        const k = (i - 5) / 2;
        const R = rng(903);
        for (let j = 0; j < 10; j++) {
          const a = (j / 10) * TAU + R() * 0.4;
          const d = 46 + k * 40 + R() * 14;
          const r = (j % 3 ? 6 : 9) * (1 - k * 0.6);
          sparkle(ctx, j % 2 ? TEAM : TEAMSKY, c + Math.cos(a) * d, c + Math.sin(a) * d - k * 10, r, j);
        }
      },
    };
  })();

  // A bead of the link between party members fighting side by side (loops): a small peach
  // sparkle with a sky heart, breathing.
  E.teamlink = {
    w: 60, h: 60, n: 6, fps: 12, px: 30, py: 30, loop: true,
    draw(ctx, i) {
      const k = 0.5 + 0.5 * Math.sin((i / 6) * TAU);
      sparkle(ctx, TEAM, 30, 30, 10 + k * 4, (i / 6) * 0.8);
      sparkle(ctx, TEAMSKY, 30, 30, 4 + k * 1.5, 0.78 + (i / 6) * 0.8);
    },
  };

  // Getting a fallen friend up: a ring of peach light at their feet, a column of sky-and-peach
  // light rising through them, and stars drifting up as it fades.
  E.teamrevive = (() => {
    const w = 180;
    const base = 250;
    const cx = w / 2;
    const col = (ctx, half, top) => {
      const band = (k, colour, ink) => {
        const pts = [[cx - half * k, base], [cx - half * k, top + half * k * 0.8], [cx, top], [cx + half * k, top + half * k * 0.8], [cx + half * k, base]];
        if (ink) inked(ctx, pts, colour, ink, 4);
        else fill(ctx, pts, colour);
      };
      band(1, TEAMSKY[2], TEAMSKY[4]);
      band(0.72, TEAM[2]);
      band(0.45, TEAM[1]);
      band(0.2, TEAM[0]);
    };
    const ringAt = (ctx, y, r, th) => {
      ctx.save();
      ctx.translate(cx, y);
      ctx.scale(1, 0.3);
      celRing(ctx, TEAM, 0, 0, r, th, { seed: 911 });
      ctx.restore();
    };
    return {
      w, h: 270, n: 9, fps: 18, px: cx, py: base,
      draw(ctx, i) {
        if (i <= 4) {
          const half = [6, 22, 30, 26, 18][i];
          col(ctx, half, [170, 40, 16, 14, 30][i]);
          ringAt(ctx, base - 4, 30 + i * 12, 14 - i);
          if (i >= 2) ringAt(ctx, base - 60 - (i - 2) * 50, 34 - (i - 2) * 4, 9);
        }
        if (i >= 3) {
          const k = (i - 3) / 5;
          const R = rng(912);
          for (let j = 0; j < 7; j++) {
            const x = cx + (R() - 0.5) * 90;
            const y = base - 40 - R() * 160 - k * 50;
            if (j % 2) goldStar(ctx, x, y, 9 * (1.1 - k * 0.8), j, TEAM);
            else sparkle(ctx, TEAMSKY, x, y, 8 * (1.1 - k * 0.8), j);
          }
        }
      },
    };
  })();

  // A Group Finisher's shared last burst: a star for each friend in a ring, linked, that snaps
  // inward to one big peach star; it bursts with rings of sky and peach, then rains beads and stars.
  E.teamburst = (() => {
    const c = 190;
    return {
      w: 380, h: 380, n: 11, fps: 20, px: c, py: c,
      draw(ctx, i) {
        if (i <= 2) {
          const r = [120, 80, 40][i];
          for (let j = 0; j < 5; j++) {
            const a = -Math.PI / 2 + (j / 5) * TAU + i * 0.5;
            const a2 = -Math.PI / 2 + ((j + 1) / 5) * TAU + i * 0.5;
            speedLine(ctx, TEAMSKY, c + Math.cos(a) * r, c + Math.sin(a) * r, c + Math.cos(a2) * r, c + Math.sin(a2) * r, 3);
            goldStar(ctx, c + Math.cos(a) * r, c + Math.sin(a) * r, 16 - i * 2, a, j % 2 ? TEAMSKY : TEAM);
          }
          if (i === 2) goldStar(ctx, c, c, 30, 0, TEAM);
          return;
        }
        if (i <= 7) {
          const k = (i - 3) / 4;
          celRing(ctx, TEAMSKY, c, c, 60 + k * 120, 26 - k * 18, { broken: Math.max(0, k - 0.3), seed: 921 });
          celRing(ctx, TEAM, c, c, 40 + k * 80, 18 - k * 12, { broken: Math.max(0, k - 0.5), seed: 922 });
          if (i <= 5) starburst(ctx, TEAM, c, c, [70, 86, 64][i - 3], 12, 923, { inner: 0.34, rot: i * 0.15 });
          if (i <= 6) goldStar(ctx, c, c, [44, 52, 40, 24][i - 3], i * 0.2, TEAM);
          for (let j = 0; j < 8; j++) {
            const a = (j / 8) * TAU + 0.2;
            const d = 70 + k * 100;
            speedLine(ctx, j % 2 ? TEAMSKY : TEAM, c + Math.cos(a) * (d - 34), c + Math.sin(a) * (d - 34), c + Math.cos(a) * d, c + Math.sin(a) * d, 6 - k * 3);
          }
        }
        if (i >= 6) {
          const k = (i - 6) / 4;
          const R = rng(924);
          for (let j = 0; j < 16; j++) {
            const a = R() * TAU;
            const d = 90 + R() * 80 + k * 30;
            const r = (j % 3 ? 7 : 11) * (1.1 - k * 0.7);
            const x = c + Math.cos(a) * d;
            const y = c + Math.sin(a) * d * 0.8 + k * 30;
            if (j % 4 === 0) goldStar(ctx, x, y, r, j, TEAM);
            else sparkle(ctx, j % 2 ? TEAM : TEAMSKY, x, y, r, j);
          }
        }
      },
    };
  })();

  // ---------- Two-person boss mechanics (world/coopboss.js, drawn by render/coop.js) ----------
  // Each boss's telegraphs in its own colour and shapes. A shared blow is a gold ring on the floor
  // with the boss's motif round its rim (the Queen Bee's honeycomb and bees, the Myconid Queen's
  // little mushroom caps and spores, Tuskar's stomp: rocks and cracks); a two-sided guard is built
  // of pieces the game lays round the boss (Old MacGoblin's red barn-door planks, Tuskar's flame
  // bulwark, Gnarlroot's bark plates), each with an idle drawing, a cracked one for a struck half
  // and a break; the Root Seal is a rune circle of roots with its stone, and its ribbon of light
  // (and the twins' spore tether) is a short piece the game chains along the curve. Art units:
  // G per game pixel.
  const G = RAW;
  const HONEY = ['#ffffff', '#fff3c4', '#ffd36a', '#e8a23a', '#9a5a1e'];
  const SPOREP = ['#ffffff', '#ffe2ef', '#ffa6cc', '#e0659f', '#8a2a5e'];
  const CREAMS = ['#ffffff', '#fffaf0', '#fff0d8', '#e8c8a8', '#9a6a5a'];
  const BARN = ['#ffffff', '#ffd2c8', '#f2857a', '#c8505a', '#7a2a3a'];
  const BARNW = ['#ffffff', '#ffffff', '#fff4ea', '#e8d2c8', '#8a5a5a'];
  const BARK = ['#ffffff', '#f2e2cc', '#c89a72', '#8e6248', '#4a2e2a'];
  const MOSS = ['#ffffff', '#e2ffc8', '#9de86a', '#5cba4a', '#2f7a46'];
  const SEALG = ['#ffffff', '#dcffe8', '#7fd1a0', '#4fae7e', '#2a7f5c'];
  const FRAY = ['#ffffff', '#ffd2cc', '#ff7a80', '#e0405a', '#8e1f48'];
  const LAVP = ['#ffffff', '#f4eeff', '#ddd2f0', '#aa9ccc', '#6a5a9a'];
  const loopK = (i, n) => i / n;

  // A flat ring on the floor (an ellipse band, thinner across its near and far sides), in tones:
  // deep, the colour, a light band, a white rim. `gaps` breaks it into arcs ([from, to] angles).
  function floorRing(ctx, pal, cx, cy, rx, ry, th, { arcs = [[0, TAU]], a = 1 } = {}) {
    const [core, light, mid, deep, ink] = pal;
    const k = ry / rx;
    ctx.save();
    ctx.globalAlpha *= a;
    const band = (o0, o1, colour, line) => {
      for (const [a0, a1] of arcs) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx - o0, Math.max(1, ry - o0 * k * 1.4), 0, a0, a1);
        ctx.ellipse(cx, cy, rx - o1, Math.max(1, ry - o1 * k * 1.4), 0, a1, a0, true);
        ctx.closePath();
        if (line) {
          ctx.lineJoin = 'round';
          ctx.strokeStyle = line;
          ctx.lineWidth = 4;
          ctx.stroke();
        }
        ctx.fillStyle = colour;
        ctx.fill();
      }
    };
    band(0, th, deep, ink);
    band(0, th * 0.74, mid);
    band(0, th * 0.44, light);
    band(0, th * 0.16, core);
    ctx.restore();
  }
  function floorDisc(ctx, colour, cx, cy, rx, ry, a) {
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU);
    ctx.fillStyle = colour;
    ctx.fill();
    ctx.restore();
  }
  // A honeycomb cell, flattened onto the floor by `sy`.
  function hexCell(ctx, pal, x, y, r, sy = 0.6, lit = 0) {
    const pts = (k) => Array.from({ length: 6 }, (_, j) => [x + Math.cos((j * TAU) / 6) * r * k, y + Math.sin((j * TAU) / 6) * r * k * sy]);
    inked(ctx, pts(1), pal[3], pal[4], 3);
    fill(ctx, pts(0.78), lit > 0.5 ? pal[1] : pal[2]);
    fill(ctx, pts(0.42).map(([px, py]) => [px - r * 0.12, py - r * 0.1 * sy]), lit > 0.5 ? pal[0] : pal[1]);
  }
  // A tiny bee: striped round body, white wings up or down.
  function bee(ctx, x, y, s, flap, dir = 1) {
    for (const up of [0, 1]) {
      ctx.beginPath();
      ctx.ellipse(x - dir * s * 0.1 + up * s * 0.5 * dir, y - s * (flap ? 0.95 : 0.55), s * 0.42, s * (flap ? 0.62 : 0.4), dir * (flap ? -0.5 : -1.1), 0, TAU);
      ctx.fillStyle = '#6a7ab8';
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x - dir * s * 0.1 + up * s * 0.5 * dir, y - s * (flap ? 0.95 : 0.55), s * 0.32, s * (flap ? 0.5 : 0.3), dir * (flap ? -0.5 : -1.1), 0, TAU);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
    ctx.beginPath();
    ctx.ellipse(x, y, s * 0.78, s * 0.58, 0, 0, TAU);
    ctx.fillStyle = HONEY[4];
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x, y, s * 0.64, s * 0.46, 0, 0, TAU);
    ctx.fillStyle = HONEY[2];
    ctx.fill();
    for (const o of [-0.18, 0.18]) {
      ctx.fillStyle = '#5a3a3a';
      ctx.fillRect(x + o * s * dir - s * 0.07, y - s * 0.42, s * 0.14, s * 0.84);
    }
    ctx.beginPath();
    ctx.arc(x + dir * s * 0.5, y - s * 0.1, s * 0.12, 0, TAU);
    ctx.fillStyle = '#3a2d4f';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x - dir * s * 0.15, y - s * 0.25, s * 0.22, s * 0.12, 0, 0, TAU);
    ctx.fillStyle = '#fff6d0';
    ctx.fill();
  }
  // A little mushroom cap with white spots on a cream stem.
  function cap(ctx, x, y, r, pal = SPOREP, tilt = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);
    inked(ctx, [[-r * 0.32, 0], [-r * 0.26, -r * 0.62], [r * 0.26, -r * 0.62], [r * 0.32, 0]], CREAMS[2], CREAMS[4], 3);
    ctx.beginPath();
    ctx.moveTo(-r, -r * 0.5);
    ctx.quadraticCurveTo(-r * 0.9, -r * 1.55, 0, -r * 1.6);
    ctx.quadraticCurveTo(r * 0.9, -r * 1.55, r, -r * 0.5);
    ctx.quadraticCurveTo(0, -r * 0.3, -r, -r * 0.5);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = pal[4];
    ctx.lineWidth = 3.5;
    ctx.stroke();
    ctx.fillStyle = pal[3];
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-r * 0.86, -r * 0.6);
    ctx.quadraticCurveTo(-r * 0.7, -r * 1.42, 0, -r * 1.44);
    ctx.quadraticCurveTo(r * 0.6, -r * 1.4, r * 0.7, -r * 0.7);
    ctx.quadraticCurveTo(0, -r * 0.55, -r * 0.86, -r * 0.6);
    ctx.fillStyle = pal[2];
    ctx.fill();
    for (const [dx, dy, dr] of [[-0.42, -1.05, 0.2], [0.2, -1.22, 0.16], [0.5, -0.82, 0.13]]) {
      ctx.beginPath();
      ctx.arc(dx * r, dy * r, dr * r, 0, TAU);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
    ctx.restore();
  }
  // A rock chunk (a rounded lump with a lit top face).
  function chunk(ctx, x, y, r, seed, rot = 0) {
    const R = rng(seed);
    const n = 6;
    const pts = Array.from({ length: n }, (_, j) => {
      const a = rot + (j / n) * TAU;
      const rr = r * (0.75 + R() * 0.35);
      return [x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.8];
    });
    inked(ctx, pts, ROCK[3], ROCK[4], 3.5);
    fill(ctx, pts.map(([px, py]) => [lerp(px, x, 0.25) - r * 0.08, lerp(py, y, 0.25) - r * 0.12]), ROCK[2]);
    fill(ctx, pts.slice(3, 6).concat([[x, y - r * 0.1]]).map(([px, py]) => [lerp(px, x, 0.4), lerp(py, y, 0.4) - r * 0.2]), ROCK[1]);
  }

  // The share ring, looping (8 drawings: the motif turns one slot round the rim in a loop). Drawn
  // for a 130 px wide ring; the game scales it a touch for wider ones.
  const RX = 65 * G;
  const RY = 9 * G;
  function shareRing(motif) {
    const cx = 250;
    const cy = 120;
    const n = 8;
    return {
      w: 500, h: 180, n, fps: 10, px: cx, py: cy, loop: true,
      draw(ctx, i) {
        const u = loopK(i, n);
        // The floor inside: a soft gold wash with the motif faint in it.
        floorDisc(ctx, HONEY[2], cx, cy, RX - 6, RY - 2, 0.26);
        floorDisc(ctx, HONEY[1], cx, cy, RX * 0.7, RY * 0.66, 0.2);
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(cx, cy, RX - 10, RY - 4, 0, 0, TAU);
        ctx.clip();
        ctx.globalAlpha = 0.32;
        if (motif === 'honey') {
          for (let gx = -6; gx <= 6; gx++) for (let gy = -1; gy <= 1; gy++) {
            const hx = cx + gx * 30 + (gy % 2 ? 15 : 0);
            const hy = cy + gy * 12;
            ctx.beginPath();
            for (let j = 0; j <= 6; j++) ctx[j ? 'lineTo' : 'moveTo'](hx + Math.cos((j * TAU) / 6) * 14, hy + Math.sin((j * TAU) / 6) * 7);
            ctx.strokeStyle = HONEY[0];
            ctx.lineWidth = 2.5;
            ctx.stroke();
          }
        } else if (motif === 'spore') {
          const R = rng(711);
          for (let j = 0; j < 22; j++) {
            ctx.beginPath();
            ctx.ellipse(cx + (R() - 0.5) * RX * 1.8, cy + (R() - 0.5) * RY * 1.6, 5 + R() * 4, 3 + R() * 2, 0, 0, TAU);
            ctx.fillStyle = j % 2 ? SPOREP[1] : '#ffffff';
            ctx.fill();
          }
        } else {
          const R = rng(712);
          ctx.strokeStyle = ROCK[4];
          ctx.lineWidth = 3;
          for (let j = 0; j < 7; j++) {
            const a = (j / 7) * TAU + R() * 0.4;
            ctx.beginPath();
            let x = cx + Math.cos(a) * 20;
            let y = cy + Math.sin(a) * 5;
            ctx.moveTo(x, y);
            for (let s = 1; s <= 4; s++) {
              x = cx + Math.cos(a + (R() - 0.5) * 0.3) * (20 + s * RX * 0.2);
              y = cy + Math.sin(a + (R() - 0.5) * 0.3) * (5 + s * RY * 0.2);
              ctx.lineTo(x, y);
            }
            ctx.stroke();
          }
        }
        ctx.restore();
        // The rim.
        floorRing(ctx, HONEY, cx, cy, RX, RY, 13);
        // The motif round the rim, turning one slot over the loop: the far side first.
        const N = motif === 'honey' ? 16 : motif === 'spore' ? 10 : 12;
        const spots = Array.from({ length: N }, (_, j) => {
          const a = ((j + u) / N) * TAU;
          return { j, a, x: cx + Math.cos(a) * (RX - 5), y: cy + Math.sin(a) * (RY - 2) };
        }).sort((p, q) => p.y - q.y);
        for (const s of spots) {
          const depth = 0.8 + 0.2 * Math.sin(s.a);
          if (motif === 'honey') hexCell(ctx, HONEY, s.x, s.y - 4, 13 * depth, 0.62, (s.j + i) % 8 === 0 ? 1 : 0);
          else if (motif === 'spore') cap(ctx, s.x, s.y + 2, 12 * depth + Math.sin(u * TAU * 2 + s.j) * 1.2, SPOREP, Math.sin(u * TAU + s.j) * 0.12);
          else chunk(ctx, s.x, s.y - 4 - Math.abs(Math.sin(u * TAU + s.j * 1.7)) * 9, 9 * depth, 720 + s.j);
        }
        // Idle life above it.
        if (motif === 'honey') {
          for (let k = 0; k < 2; k++) {
            const a = u * TAU + k * Math.PI;
            bee(ctx, cx + Math.cos(a) * RX * 0.85, cy - 34 + Math.sin(a) * RY * 1.4 + Math.sin(u * TAU * 4 + k) * 4, 11, i % 2, Math.sin(a) > 0 ? -1 : 1);
          }
        }
        for (let k = 0; k < 5; k++) {
          const v = (u + k / 5) % 1;
          const x = cx + (k - 2) * RX * 0.38 + Math.sin(v * TAU + k) * 6;
          const y = cy - 8 - v * 70;
          ctx.save();
          ctx.globalAlpha = Math.sin(v * Math.PI);
          if (motif === 'spore') puff(ctx, SPOREP, x, y, 6 + v * 3, 730 + k);
          else if (motif === 'stomp') puff(ctx, DUST, x, y + 20, 7 + v * 5, 740 + k);
          else sparkle(ctx, HONEY, x, y, 6 - v * 2, v);
          ctx.restore();
        }
      },
    };
  }
  E.cohoney = shareRing('honey');
  E.cospore = shareRing('spore');
  E.costomp = shareRing('stomp');

  // A revive under way (picked by progress): a peach ring on the floor round the fallen friend, its
  // dim track filling clockwise from the top in full light, a star riding the leading edge, the
  // floor inside warming as it closes.
  E.teamrevivering = {
    w: 260, h: 110, n: 12, fps: 12, px: 130, py: 55,
    draw(ctx, i) {
      const k = (i + 1) / 12;
      const RXr = 32 * G;
      const RYr = 10 * G;
      floorDisc(ctx, TEAM[2], 130, 55, RXr - 6, RYr - 2, 0.12 + 0.22 * k);
      floorRing(ctx, TEAM, 130, 55, RXr, RYr, 18, { a: 0.45 });
      const a0 = -Math.PI / 2;
      const a1 = a0 + TAU * k;
      floorRing(ctx, k >= 1 ? ['#ffffff', '#ffffff', '#fff1dc', '#ffc58a', '#c4567a'] : TEAM, 130, 55, RXr, RYr, 24, { arcs: [[a0, a1]] });
      sparkle(ctx, TEAM, 130 + Math.cos(a1) * (RXr - 6), 55 + Math.sin(a1) * (RYr - 2), 22 + 6 * k, i * 0.3);
    },
  };

  // The blow gathering (picked by progress, not looped): a bright inner ring closing out toward
  // the rim, the floor inside warming to white as it lands.
  E.cosharefill = {
    w: 500, h: 120, n: 10, fps: 10, px: 250, py: 60,
    draw(ctx, i) {
      const k = (i + 1) / 10;
      floorDisc(ctx, i > 7 ? HONEY[1] : HONEY[2], 250, 60, (RX - 8) * k, (RY - 3) * k, 0.18 + 0.32 * k);
      floorRing(ctx, i > 7 ? ['#ffffff', '#ffffff', '#fff6d0', '#ffd36a', '#e8a23a'] : HONEY, 250, 60, Math.max(14, (RX - 8) * k), Math.max(4, (RY - 3) * k), 6 + k * 4, { a: 0.75 + 0.25 * k });
    },
  };

  // The blow coming down: a gold star bursting in the middle, the rim thrown out and breaking up,
  // the motif flying (honey cells, mushroom caps and spores, rocks), then beads and sparkles.
  function shareHit(motif) {
    const cx = 300;
    const cy = 190;
    return {
      w: 600, h: 260, n: 9, fps: 20, px: cx, py: cy,
      draw(ctx, i) {
        const k = i / 8;
        const R = rng(750);
        if (i <= 3) starburst(ctx, HONEY, cx, cy - 50 - i * 6, [50, 80, 70, 44][i], 10, 751, { inner: 0.35, rot: i * 0.2 });
        if (i <= 5) {
          const arcs = [];
          const parts = 6 + i * 2;
          for (let j = 0; j < parts; j++) arcs.push([(j / parts) * TAU, ((j + 1 - Math.min(0.85, i * 0.16)) / parts) * TAU]);
          floorRing(ctx, HONEY, cx, cy, RX * (1 + k * 0.7), RY * (1 + k * 0.8), 14 * (1 - k * 0.7), { arcs });
        }
        for (let j = 0; j < 12; j++) {
          const a = -Math.PI + (j / 11) * Math.PI + (R() - 0.5) * 0.3;
          const d = (50 + R() * 50) * (0.5 + k * 3);
          const x = cx + Math.cos(a) * d * 1.6;
          const y = cy + Math.sin(a) * d * 0.9 + k * k * 120 - 20;
          if (i >= 6) {
            sparkle(ctx, j % 2 ? HONEY : motif === 'spore' ? SPOREP : HONEY, x, y, 7 * (1.3 - k), j);
            continue;
          }
          if (i <= 3) {
            if (motif === 'honey') hexCell(ctx, HONEY, x, y, 12, 1, j % 3 === 0 ? 1 : 0);
            else if (motif === 'spore') (j % 2 ? cap(ctx, x, y, 11, SPOREP, a + k * 4) : puff(ctx, SPOREP, x, y, 10, 760 + j));
            else chunk(ctx, x, y, 11, 770 + j, k * 3 + j);
          } else shard(ctx, motif === 'spore' && j % 2 ? SPOREP : motif === 'stomp' && j % 2 ? ROCK : HONEY, x, y, a + Math.PI, 14 * (1.2 - k), 4.5 * (1.2 - k));
        }
        if (motif !== 'honey' && i >= 1 && i <= 4) for (let j = 0; j < 4; j++) {
          ctx.save();
          ctx.globalAlpha = 1 - k;
          puff(ctx, motif === 'spore' ? SPOREP : DUST, cx + (j - 1.5) * (70 + k * 120), cy - 6 - k * 30, 12 + k * 10, 780 + j, { holes: k * 2 });
          ctx.restore();
        }
      },
    };
  }
  E.cohoneyhit = shareHit('honey');
  E.cosporehit = shareHit('spore');
  E.costomphit = shareHit('stomp');

  // A pip over the ring for each player standing in it (a gold star turning on its heart), and the
  // empty place still waiting for one (lilac, smaller).
  function pipOf(pal, r) {
    return {
      w: 70, h: 70, n: 6, fps: 10, px: 35, py: 35, loop: true,
      draw(ctx, i) {
        const u = i / 6;
        goldStar(ctx, 35, 35 + Math.sin(u * TAU) * 2, r, Math.sin(u * TAU) * 0.25, pal);
        sparkle(ctx, pal, 35 + Math.cos(u * TAU) * r * 1.1, 35 - r * 0.6 + Math.sin(u * TAU) * r * 0.4, r * 0.3, u);
      },
    };
  }
  E.copip = pipOf(HONEY, 14);
  E.copipoff = pipOf(LAVP, 10);

  // ---------- The guard pieces ----------
  // Drawn upright (long side along y, the outside to +x); the game lays them round the boss along
  // the guard's arc, turned to it (flames stand upright), mirrored on the left.
  const PW = 13 * G;
  const PH = 24 * G;
  function guardPiece(style, mode) {
    const cx = 70;
    const cy = 60 + PH / 2;
    const n = mode === 'break' ? 7 : 6;
    return {
      w: 140, h: PH + 120, n, fps: mode === 'break' ? 18 : 10, px: cx, py: cy, loop: mode !== 'break',
      draw(ctx, i) {
        const u = i / n;
        const crack = mode === 'crack';
        const brk = mode === 'break' ? i / (n - 1) : 0;
        if (style === 'flame') {
          // A bulwark of fire: a glowing ember bar with tongues of flame rising off it.
          const pal = crack ? ['#ffffff', '#ffffff', '#fff1c0', '#ffbe72', '#cc566a'] : PAL.fire;
          if (mode === 'break') {
            const R = rng(801);
            for (let j = 0; j < 9; j++) {
              const a = -Math.PI / 2 + (R() - 0.5) * 2.2;
              const d = 20 + brk * 90 * (0.6 + R() * 0.6);
              const x = cx + Math.cos(a) * d * 0.8;
              const y = cy - 20 + Math.sin(a) * d + brk * brk * 40;
              if (i < 3) tongue(ctx, PAL.fire, x, y, 9 * (1 - brk), 30 * (1 - brk), (R() - 0.5) * 10);
              else if (i < 5) drop(ctx, PAL.fire, x, y, a, 6 * (1.2 - brk));
              else sparkle(ctx, PAL.fire, x, y, 7 * (1.3 - brk), j);
            }
            return;
          }
          const lean = Math.sin(u * TAU) * 6;
          inked(ctx, [[cx - PW * 0.55, cy + 10], [cx + PW * 0.55, cy + 10], [cx + PW * 0.45, cy + 24], [cx - PW * 0.45, cy + 24]], pal[3], pal[4], 3.5);
          fill(ctx, [[cx - PW * 0.4, cy + 13], [cx + PW * 0.4, cy + 13], [cx + PW * 0.35, cy + 18], [cx - PW * 0.35, cy + 18]], pal[1]);
          const tall = crack ? 0.7 : 1;
          tongue(ctx, pal, cx - 13, cy + 12, 12, (40 + 10 * Math.sin(u * TAU + 1)) * tall, -6 + lean);
          tongue(ctx, pal, cx + 13, cy + 12, 12, (44 + 10 * Math.sin(u * TAU + 3)) * tall, 6 + lean);
          tongue(ctx, pal, cx, cy + 14, 17, (68 + 12 * Math.sin(u * TAU)) * tall, lean * 1.4);
          if (crack) {
            // Guttering: sparks spitting off it.
            const R = rng(805 + i);
            for (let j = 0; j < 4; j++) sparkle(ctx, PAL.fire, cx + (R() - 0.5) * 70, cy - 30 - R() * 50, 6 + R() * 3, j);
          } else sparkle(ctx, PAL.fire, cx + Math.sin(u * TAU * 2) * 16, cy - 50 - u * 30, 5, u);
          return;
        }
        // A plank (barn) or a bark plate, upright.
        const body = style === 'barn' ? BARN : BARK;
        const rock = crack ? Math.sin(u * TAU * 2) * 0.05 : Math.sin(u * TAU) * 0.025;
        const half = (side, off, spin) => {
          ctx.save();
          ctx.translate(cx + off[0], cy + off[1]);
          ctx.rotate(rock + spin);
          ctx.translate(-cx, -cy);
          ctx.beginPath();
          if (side < 0) ctx.rect(cx - PW, cy - PH, PW * 2, PH);
          else if (side > 0) ctx.rect(cx - PW, cy, PW * 2, PH);
          if (side) ctx.clip();
          if (style === 'barn') {
            const x0 = cx - PW / 2;
            const y0 = cy - PH / 2;
            ctx.beginPath();
            ctx.roundRect(x0 - 2, y0 - 2, PW + 4, PH + 4, 8);
            ctx.fillStyle = body[4];
            ctx.fill();
            ctx.beginPath();
            ctx.roundRect(x0, y0, PW, PH, 7);
            ctx.fillStyle = body[3];
            ctx.fill();
            ctx.beginPath();
            ctx.roundRect(x0, y0, PW - 6, PH - 5, 7);
            ctx.fillStyle = body[2];
            ctx.fill();
            // Grain, a lit edge, the white trim and brace of a barn door, two nails.
            ctx.strokeStyle = body[3];
            ctx.lineWidth = 2;
            for (const gx of [0.3, 0.62]) {
              ctx.beginPath();
              ctx.moveTo(x0 + PW * gx, y0 + 10);
              ctx.bezierCurveTo(x0 + PW * gx + 4, y0 + PH * 0.4, x0 + PW * gx - 4, y0 + PH * 0.6, x0 + PW * gx + 2, y0 + PH - 12);
              ctx.stroke();
            }
            fill(ctx, [[x0 + 5, y0 + 6], [x0 + 10, y0 + 6], [x0 + 10, y0 + PH - 8], [x0 + 5, y0 + PH - 8]], body[1]);
            for (const ty of [y0 + 3, y0 + PH - 15]) {
              inked(ctx, [[x0 + 1, ty], [x0 + PW - 1, ty], [x0 + PW - 1, ty + 12], [x0 + 1, ty + 12]], BARNW[2], BARNW[4], 2.5);
              fill(ctx, [[x0 + 3, ty + 2], [x0 + PW - 3, ty + 2], [x0 + PW - 3, ty + 5], [x0 + 3, ty + 5]], '#ffffff');
            }
            inked(ctx, [[x0 + 2, y0 + PH - 22], [x0 + 12, y0 + PH - 22], [x0 + PW - 2, y0 + 22], [x0 + PW - 12, y0 + 22]], BARNW[2], BARNW[4], 2.5);
            for (const ny of [y0 + 9, y0 + PH - 9]) {
              ctx.beginPath();
              ctx.arc(cx, ny, 2.6, 0, TAU);
              ctx.fillStyle = '#6a5a7a';
              ctx.fill();
            }
          } else {
            // A bark plate: a rounded shield of ridged bark, moss on its top and a leaf sprouting.
            const sh = (k, dx = 0, dy = 0) => {
              ctx.beginPath();
              ctx.ellipse(cx + dx, cy + dy, (PW / 2 + 4) * k, (PH / 2) * k, 0, 0, TAU);
            };
            sh(1.04);
            ctx.fillStyle = body[4];
            ctx.fill();
            sh(1);
            ctx.fillStyle = body[3];
            ctx.fill();
            sh(0.88, -3, -3);
            ctx.fillStyle = body[2];
            ctx.fill();
            ctx.strokeStyle = body[3];
            ctx.lineWidth = 3;
            for (const gx of [-0.42, 0, 0.42]) {
              ctx.beginPath();
              ctx.moveTo(cx + gx * PW * 0.5, cy - PH * 0.4);
              ctx.bezierCurveTo(cx + gx * PW * 0.6 + 5, cy - PH * 0.1, cx + gx * PW * 0.6 - 5, cy + PH * 0.15, cx + gx * PW * 0.5, cy + PH * 0.4);
              ctx.stroke();
            }
            ctx.strokeStyle = body[1];
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx - PW * 0.32, cy - PH * 0.3);
            ctx.quadraticCurveTo(cx - PW * 0.4, cy, cx - PW * 0.3, cy + PH * 0.25);
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(cx + 2, cy - PH * 0.38, PW * 0.34, 8, 0, 0, TAU);
            ctx.fillStyle = MOSS[3];
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(cx, cy - PH * 0.4, PW * 0.24, 5, 0, 0, TAU);
            ctx.fillStyle = MOSS[2];
            ctx.fill();
          }
          ctx.restore();
        };
        if (mode === 'break') {
          // It snaps across the middle, the halves tumbling out, then splinters, beads, sparkles.
          if (i < 4) {
            ctx.save();
            ctx.globalAlpha = 1 - brk * 0.6;
            half(-1, [brk * 50, -brk * 60], brk * 1.8);
            half(1, [brk * 40, brk * 30], -brk * 1.4);
            ctx.restore();
          }
          const R = rng(810);
          for (let j = 0; j < 10; j++) {
            const a = (R() - 0.5) * 2.6;
            const d = 16 + brk * 100 * (0.5 + R() * 0.7);
            const x = cx + Math.cos(a) * d;
            const y = cy + Math.sin(a) * d * 0.9 + brk * brk * 40;
            const pal = j % 3 === 0 ? (style === 'barn' ? BARNW : MOSS) : body;
            if (i < 5) shard(ctx, pal, x, y, a + i, 16 * (1.1 - brk), 4.5 * (1.1 - brk));
            if (i >= 3) sparkle(ctx, style === 'barn' ? BARN : MOSS, x, y - 10, 7 * (1.2 - brk), j);
          }
          return;
        }
        half(0, [0, 0], 0);
        if (style === 'bark') {
          // The leaf sprouting off its top, swaying.
          leaf(ctx, cx + 6, cy - PH * 0.5 - 6, 11, -0.9 + Math.sin(u * TAU) * 0.25);
          leaf(ctx, cx - 6, cy - PH * 0.5 - 2, 8, -2.3 + Math.sin(u * TAU + 1) * 0.2);
        }
        if (crack) {
          // A split of light down it, glowing, splinters lifting.
          const glowPal = style === 'barn' ? ['#ffffff', '#ffffff', '#fff3c4', '#ffd36a', '#e8a23a'] : ['#ffffff', '#ffffff', '#e2ffe8', '#9de8b8', '#4fae7e'];
          const pts = [[cx + 2, cy - PH * 0.46], [cx - 6, cy - PH * 0.22], [cx + 5, cy - PH * 0.02], [cx - 4, cy + PH * 0.2], [cx + 3, cy + PH * 0.45]];
          for (const [w, c] of [[10, glowPal[3]], [6, glowPal[2]], [2.6, '#ffffff']]) {
            ctx.beginPath();
            pts.forEach(([x, y], j) => ctx[j ? 'lineTo' : 'moveTo'](x, y));
            ctx.strokeStyle = c;
            ctx.lineWidth = w;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.stroke();
          }
          const R = rng(820 + i);
          for (let j = 0; j < 3; j++) shard(ctx, body, cx + 14 + R() * 16, cy - PH * 0.3 + R() * PH * 0.6 - u * 10, -0.5 + R(), 10, 3);
          sparkle(ctx, glowPal, cx + 2, cy - PH * 0.46 - 4 + Math.sin(u * TAU) * 3, 8 + 2 * Math.sin(u * TAU * 2), u);
        } else {
          // A glint sliding up it.
          const gy = cy + PH * 0.42 - u * PH * 0.84;
          ctx.save();
          ctx.globalAlpha = Math.sin(u * Math.PI) * 0.8;
          sparkle(ctx, style === 'barn' ? BARNW : MOSS, cx - PW * 0.25, gy, 5, u);
          ctx.restore();
        }
      },
    };
  }
  for (const style of ['barn', 'flame', 'bark']) {
    E[`co${style}`] = guardPiece(style, 'idle');
    E[`co${style}crack`] = guardPiece(style, 'crack');
    E[`co${style}break`] = guardPiece(style, 'break');
  }

  // ---------- Gnarlroot's Root Seal ----------
  // A rune circle of roots on the floor: two roots twisting round each other, curling off in
  // tendrils, with leaf runes set in it that glow when someone stands on the seal (`held`: they
  // burn white-mint, the floor inside lights and leaves sprout).
  const SRX = 30 * G;
  const SRY = 8 * G;
  function sealCircle(held) {
    const cx = 130;
    const cy = 70;
    const n = 8;
    return {
      w: 260, h: 120, n, fps: 8, px: cx, py: cy, loop: true,
      draw(ctx, i) {
        const u = i / n;
        if (held) {
          floorDisc(ctx, SEALG[2], cx, cy, SRX - 4, SRY - 1, 0.32);
          floorDisc(ctx, SEALG[1], cx, cy, SRX * 0.6, SRY * 0.6, 0.4);
        } else floorDisc(ctx, SEALG[3], cx, cy, SRX - 4, SRY - 1, 0.14);
        // The two roots, twisting round the circle.
        for (const ph of [0, Math.PI]) {
          const pts = Array.from({ length: 61 }, (_, j) => {
            const a = (j / 60) * TAU;
            const wob = Math.sin(a * 5 + ph) * 5;
            return [cx + Math.cos(a) * (SRX + wob), cy + Math.sin(a) * (SRY + wob * 0.3)];
          });
          for (const [w, c] of [[10, BARK[4]], [7, BARK[3]], [3.5, BARK[2]], [1.4, BARK[1]]]) {
            ctx.beginPath();
            pts.forEach(([x, y], j) => ctx[j ? 'lineTo' : 'moveTo'](x, y + (w < 5 ? -1 : 0)));
            ctx.strokeStyle = c;
            ctx.lineWidth = w;
            ctx.lineJoin = 'round';
            ctx.stroke();
          }
        }
        // Tendrils curling off at four points.
        for (let j = 0; j < 4; j++) {
          const a = (j / 4) * TAU + 0.4;
          const x = cx + Math.cos(a) * SRX;
          const y = cy + Math.sin(a) * SRY;
          const out = Math.cos(a) > 0 ? 1 : -1;
          const sway = Math.sin(u * TAU + j) * 3;
          for (const [w, c] of [[6, BARK[4]], [3.4, BARK[2]]]) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.bezierCurveTo(x + out * 14, y - 6, x + out * 22 + sway, y - 16, x + out * 14 + sway, y - 22);
            ctx.strokeStyle = c;
            ctx.lineWidth = w;
            ctx.lineCap = 'round';
            ctx.stroke();
          }
          if (held) leaf(ctx, x + out * 14 + sway, y - 24, 7, out > 0 ? -0.8 : -2.3);
        }
        // The runes: little leaf-shaped marks set round it, turning slowly, glowing in turn.
        for (let j = 0; j < 6; j++) {
          const a = ((j + u) / 6) * TAU;
          const x = cx + Math.cos(a) * SRX;
          const y = cy + Math.sin(a) * SRY - 2;
          const lit = held ? 1 : 0.5 + 0.5 * Math.sin(u * TAU - j);
          const pal = held ? ['#ffffff', '#ffffff', '#e8fff2', '#9de8b8', '#2a7f5c'] : SEALG;
          diamond(ctx, pal, x, y, 4.5 + lit * 1.5, 1.6);
        }
        if (held) for (let k = 0; k < 4; k++) {
          const v = (u + k / 4) % 1;
          ctx.save();
          ctx.globalAlpha = Math.sin(v * Math.PI);
          sparkle(ctx, SEALG, cx + (k - 1.5) * 34, cy - 6 - v * 40, 5, v);
          ctx.restore();
        }
      },
    };
  }
  E.coseal = sealCircle(false);
  E.cosealheld = sealCircle(true);

  // The seal stone: a rounded tablet of mossy stone with a leaf rune carved in it, the rune's
  // light breathing.
  E.cosealstone = {
    w: 100, h: 110, n: 6, fps: 8, px: 50, py: 96, loop: true,
    draw(ctx, i) {
      const u = i / 6;
      const x0 = 50 - 9 * G;
      const y0 = 96 - 23 * G;
      const W = 18 * G;
      const H = 22 * G;
      ctx.beginPath();
      ctx.roundRect(x0 - 2, y0 - 2, W + 4, H + 4, 20);
      ctx.fillStyle = SEALG[4];
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(x0, y0, W, H, 18);
      ctx.fillStyle = SEALG[3];
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(x0, y0, W - 7, H - 6, 18);
      ctx.fillStyle = SEALG[2];
      ctx.fill();
      // Moss and a little root over its shoulder.
      ctx.beginPath();
      ctx.ellipse(50 - 6, y0 + 6, 18, 7, -0.1, 0, TAU);
      ctx.fillStyle = MOSS[3];
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(50 - 8, y0 + 4, 12, 4, -0.1, 0, TAU);
      ctx.fillStyle = MOSS[2];
      ctx.fill();
      for (const [w, c] of [[6, BARK[4]], [3.2, BARK[2]]]) {
        ctx.beginPath();
        ctx.moveTo(x0 + W - 4, y0 + 10);
        ctx.bezierCurveTo(x0 + W + 6, y0 + 22, x0 + W + 2, y0 + 44, x0 + W + 8, y0 + 60);
        ctx.strokeStyle = c;
        ctx.lineWidth = w;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
      // The rune: a leaf with its vein, breathing light.
      const b = 0.5 + 0.5 * Math.sin(u * TAU);
      const rx = 50 - 4;
      const ry = y0 + H * 0.5;
      ctx.save();
      ctx.translate(rx, ry);
      ctx.rotate(0.5);
      for (const [k, c] of [[1.25, SEALG[4]], [1, b > 0.5 ? '#ffffff' : SEALG[1]], [0.6, '#ffffff']]) {
        ctx.beginPath();
        ctx.ellipse(0, 0, 10 * k, 17 * k, 0, 0, TAU);
        ctx.fillStyle = c;
        ctx.fill();
      }
      ctx.strokeStyle = SEALG[3];
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(0, 14);
      ctx.lineTo(0, -12);
      ctx.moveTo(0, 2);
      ctx.lineTo(6, -5);
      ctx.moveTo(0, 6);
      ctx.lineTo(-6, -1);
      ctx.stroke();
      ctx.restore();
      fill(ctx, [[x0 + 8, y0 + 12], [x0 + 12, y0 + 12], [x0 + 12, y0 + 26], [x0 + 8, y0 + 26]], '#ffffff');
      sparkle(ctx, SEALG, x0 + W - 6, y0 + 6 - b * 4, 3 + b * 3, u);
    },
  };
  // Nobody on it: a mint leaf bobbing over it, pointing down, asking.
  E.cosealask = {
    w: 60, h: 80, n: 6, fps: 8, px: 30, py: 60, loop: true,
    draw(ctx, i) {
      const b = Math.sin((i / 6) * TAU) * 6;
      ctx.save();
      ctx.translate(30, 36 + b);
      ctx.rotate(Math.PI / 2);
      for (const [k, c] of [[1.2, SEALG[4]], [1, SEALG[2]], [0.62, SEALG[1]]]) {
        ctx.beginPath();
        ctx.moveTo(-14 * k, 0);
        ctx.quadraticCurveTo(0, -12 * k, 16 * k, 0);
        ctx.quadraticCurveTo(0, 12 * k, -14 * k, 0);
        ctx.fillStyle = c;
        ctx.fill();
      }
      ctx.restore();
      sparkle(ctx, SEALG, 40, 26 + b, 4, i);
    },
  };
  // A piece of the ribbon of light from the seal to Gnarlroot (the game chains them along the
  // curve, turned to it): two strands of mint light braiding, a leaf riding it.
  function chainPiece(pal, { leafy = false, frayed = false, seed = 1 } = {}) {
    const L = 22 * G;
    return {
      w: L + 40, h: 70, n: 6, fps: 12, px: 20 + L / 2, py: 35, loop: true,
      draw(ctx, i) {
        const u = i / 6;
        const x0 = 20;
        for (const ph of [0, Math.PI]) {
          const pts = Array.from({ length: 25 }, (_, j) => {
            const v = j / 24;
            return [x0 + v * L, 35 + Math.sin(v * TAU + u * TAU + ph) * 6];
          });
          const width = (v) => Math.sin(Math.PI * v) ** 0.6;
          for (const [w, c] of [[9, pal[4]], [6.4, pal[3]], [4, pal[2]], [1.8, pal[0]]]) {
            for (let j = 0; j < 24; j++) {
              if (frayed && (j + i * 2 + (ph ? 7 : 0)) % 9 < 3) continue;
              ctx.beginPath();
              ctx.moveTo(...pts[j]);
              ctx.lineTo(...pts[j + 1]);
              ctx.strokeStyle = c;
              ctx.lineWidth = Math.max(0.6, w * width((j + 0.5) / 24));
              ctx.lineCap = 'round';
              ctx.stroke();
            }
          }
        }
        const v = u;
        if (leafy) leaf(ctx, x0 + v * L, 35 + Math.sin(v * TAU * 2) * 4 - 6, 6, v * TAU);
        else if (!frayed) {
          ctx.beginPath();
          ctx.arc(x0 + L / 2, 35 + Math.sin(u * TAU) * 3, 4.5, 0, TAU);
          ctx.fillStyle = pal[4];
          ctx.fill();
          ctx.beginPath();
          ctx.arc(x0 + L / 2, 35 + Math.sin(u * TAU) * 3, 3.2, 0, TAU);
          ctx.fillStyle = pal[1];
          ctx.fill();
        }
        if (frayed) {
          const R = rng(seed + i);
          for (let j = 0; j < 2; j++) sparkle(ctx, pal, x0 + R() * L, 35 + (R() - 0.5) * 30, 5, j);
        } else sparkle(ctx, pal, x0 + ((u + 0.5) % 1) * L, 35 + Math.cos(u * TAU) * 5, 4, u);
      },
    };
  }
  E.cosealbeam = chainPiece(SEALG, { leafy: true });
  // The twin puffballs' tether: a pink spore-thread with a little spore bead on it; frayed and red
  // once one of them is down and the other is about to call it back.
  E.cotether = chainPiece(SPOREP);
  E.cotetherfray = chainPiece(FRAY, { frayed: true, seed: 870 });

  // Stepping onto the seal: the root circle flares, leaves burst up, sparkles.
  E.cosealpop = {
    w: 300, h: 200, n: 7, fps: 18, px: 150, py: 150,
    draw(ctx, i) {
      const k = i / 6;
      if (i <= 4) floorRing(ctx, SEALG, 150, 150, SRX * (1 + k * 0.9), SRY * (1 + k * 0.9), 10 * (1 - k * 0.8), { a: 1 - k * 0.5 });
      const R = rng(880);
      for (let j = 0; j < 8; j++) {
        const a = -Math.PI / 2 + (R() - 0.5) * 2.4;
        const d = 10 + k * 90 * (0.6 + R() * 0.5);
        const x = 150 + Math.cos(a) * d;
        const y = 150 - 10 + Math.sin(a) * d * 0.9;
        if (i < 4) leaf(ctx, x, y, 9 * (1.1 - k * 0.5), a + k * 3);
        else sparkle(ctx, SEALG, x, y, 7 * (1.3 - k), j);
      }
      if (i <= 2) sparkle(ctx, SEALG, 150, 100 - i * 8, 16 - i * 3, 0);
    },
  };
  // The twins down together (or one called back): a burst of pink spore puffs and caps.
  E.cotwinpop = {
    w: 260, h: 240, n: 8, fps: 18, px: 130, py: 130,
    draw(ctx, i) {
      const k = i / 7;
      if (i <= 2) starburst(ctx, SPOREP, 130, 130, 30 + i * 14, 8, 890, { inner: 0.4 });
      const R = rng(891);
      for (let j = 0; j < 9; j++) {
        const a = (j / 9) * TAU + R() * 0.3;
        const d = 16 + k * 80;
        const x = 130 + Math.cos(a) * d;
        const y = 130 + Math.sin(a) * d * 0.8 + k * k * 30;
        if (i < 3) puff(ctx, SPOREP, x, y, 12 * (1 - k * 0.5), 892 + j, { holes: k });
        else if (i < 6) j % 2 ? cap(ctx, x, y, 8 * (1.2 - k), SPOREP, a) : shard(ctx, SPOREP, x, y, a, 12 * (1.1 - k), 4 * (1.1 - k));
        else sparkle(ctx, SPOREP, x, y, 7 * (1.3 - k), j);
      }
    },
  };


  // A finisher's shockwave racing out flat along the ground to the edge of its reach, in the path's
  // own colour with its own shapes riding the ring (the Wind Dancer's crescent gusts, the Blade
  // Dancer's little rings, the Sky Dancer's clouds), breaking up into
  // sparkles. Drawn already flat (the ground is seen edge-on), its last radius 297 strip px
  // (99 game px at scale 1); render/warrior-fx.js `shockOf` scales it to the reach.
  function shockRing(pal, accent, rider, seed) {
    const c = 320;
    const cy = 90;
    const SY = 0.3;
    return {
      w: 640, h: 180, n: 7, fps: 24, px: c, py: cy,
      draw(ctx, i) {
        const k = ease3(Math.min(1, (i + 0.6) / 5.2));
        const r = 40 + 257 * k;
        if (i <= 5) {
          ctx.save();
          ctx.translate(c, cy);
          ctx.scale(1, SY);
          celRing(ctx, pal, 0, 0, r, 22 * (1 - i / 7) + 6, { broken: i >= 4 ? 0.25 + (i - 4) * 0.25 : 0, seed });
          ctx.restore();
        }
        const R = rng(seed + 7);
        for (let j = 0; j < 12; j++) {
          const a = (j / 12) * TAU + R() * 0.3;
          const x = c + Math.cos(a) * r;
          const y = cy + Math.sin(a) * r * SY - (i >= 5 ? (i - 4) * 8 : 0);
          const z = (16 - i * 1.6) * (0.85 + R() * 0.3);
          if (i <= 4) rider(ctx, j % 3 === 2 ? accent : pal, x, y, z, a, j);
          else sparkle(ctx, j % 2 ? accent : pal, x, y, z * 0.8, j);
        }
      },
    };
  }
  E.shockcoral = shockRing(CORAL, CREAM, (ctx, pal, x, y, z, a) => celCrescent(ctx, pal, x, y, z, -1.2 + a, 1.2 + a, z * 0.45, { inkW: 3 }), 901);
  E.shockrose = shockRing(ROSEGOLD, GOLDRING, (ctx, pal, x, y, z) => celRing(ctx, pal, x, y, z * 0.8, z * 0.32), 911);
  E.shocksky = shockRing(SKYB, SUNLIT, (ctx, pal, x, y, z, a, j) => (j % 3 === 2 ? sparkle(ctx, pal, x, y, z, j) : puff(ctx, CLOUDS, x, y, z * 0.75, 921 + j)), 921);
  E.shockstar = shockRing(NIGHT, STARGOLD, (ctx, pal, x, y, z, a, j) => star5(ctx, j % 2 ? STARGOLD : pal, x, y, z, a), 931);
  // The Phantom Trickster's (Smoke Bomb): a plum ring of stage smoke rolling out, playing cards
  // tumbling along it.
  E.shockplum = shockRing(PLUM, PSILV, (ctx, pal, x, y, z, a, j) => (j % 3 === 2 ? sparkle(ctx, PSILV, x, y, z, j) : j % 3 === 1 ? puff(ctx, SMOKE, x, y, z * 0.8, 941 + j, { lobes: 4 }) : cardArt(ctx, x, y, z * 1.4, a + Math.PI / 2, Math.cos(a * 3), j % 4)), 941);
  // The Acrobat Archer's (Grand Somersault's landing): a gold ring racing out with mint ribbon
  // loops and gold stars riding it.
  // The Mage's: her crimson ring with flames and ice shards riding it.
  E.shockcrimson = shockRing(MRUNE, MFIRE, (ctx, pal, x, y, z, a, j) => (j % 3 === 0 ? iceShard(ctx, x, y, a, z * 2.2, z * 0.5) : j % 3 === 1 ? blob(ctx, MFIRE, x, y, z * 0.7, 0.1, j) : sparkle(ctx, MRUNE, x, y, z, j)), 961);
  E.shockmint = shockRing(SHOWG, MINT, (ctx, pal, x, y, z, a, j) => (j % 2 ? goldStar(ctx, x, y, z * 0.8, a) : sparkle(ctx, MINT, x, y, z, j)), 951);


  // ---------- The second jobs' own versions of their first job's skills (data/path-skills.js) ----------



  // Levitation (the Phantom Trickster's Grand Somersault): a giant top hat over the stage. It pops
  // out of a puff of smoke (0-2), tips over (3-4) and pours plum arrows, cards and doves out of its
  // brim down onto everything below (5-9), then vanishes in smoke (10-11).
  E.pthat = (() => {
    const c = 190;
    const cy = 140;
    const hat = (ctx, x, y, s, rot) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.scale(s, s);
      // Crown and brim (the crown up from the brim at y 0), a silver band, a red card tucked in it.
      inked(ctx, [[-56, 0], [-50, -120], [-46, -132], [46, -132], [50, -120], [56, 0]], PLUM[3], PLUM[4], 6);
      fill(ctx, [[-44, -6], [-40, -116], [-14, -120], [-18, -6]], PLUM[2]);
      inked(ctx, [[-56, -34], [56, -34], [56, -14], [-56, -14]], PSILV[2], PSILV[4], 4);
      inked(ctx, [[-96, -4], [96, -4], [104, 8], [96, 18], [-96, 18], [-104, 8]], PLUM[3], PLUM[4], 6);
      fill(ctx, [[-90, 0], [90, 0], [94, 6], [-94, 6]], PLUM[2]);
      cardArt(ctx, 30, -40, 34, 0.25, 1, 1);
      ctx.restore();
    };
    return {
      w: 380, h: 420, n: 12, fps: 12, px: c, py: cy,
      draw(ctx, i) {
        if (i <= 1 || i >= 10) for (let j = 0; j < 7; j++) {
          const a = (j / 7) * TAU;
          const k = i >= 10 ? 1 + (i - 10) * 0.4 : 0.6 + i * 0.4;
          puff(ctx, SMOKE, c + Math.cos(a) * 70 * k, cy - 30 + Math.sin(a) * 40 * k, 30 * (i >= 11 ? 0.7 : 1), 1221 + j, { lobes: 5, holes: i >= 11 ? 0.5 : 0 });
        }
        if (i >= 11) return;
        const pop = i === 0 ? 0.5 : i === 1 ? 1.1 : 1;
        // (It appears brim-up like a magician's hat, then flips over so its open crown faces the stage.)
        const rot = i <= 2 ? Math.PI : i === 3 ? 2.1 : i === 4 ? 0.8 : 0.08 * Math.sin(i * 1.3);
        hat(ctx, c, cy, pop, rot);
        if (i >= 5 && i <= 9) {
          // Pouring out of it: a stream of plum arrows point-down, cards and doves.
          const R = rng(1222 + i);
          for (let j = 0; j < 6; j++) {
            const y = cy + 30 + ((j * 46 + i * 23) % 240);
            const x = c + (R() - 0.5) * 120 * (0.5 + (y - cy) / 240);
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(Math.PI / 2 + (R() - 0.5) * 0.3);
            plumArrow(ctx, 0, 0, 46, 0.8);
            ctx.restore();
          }
          for (let j = 0; j < 4; j++) cardArt(ctx, c + (R() - 0.5) * 200, cy + 60 + R() * 200, 26, R() * 3, Math.cos(i + j), j);
          if (i % 2) doveArt(ctx, c + (i - 7) * 40, cy + 120 + (i % 3) * 30, 22, i % 4 < 2 ? 1 : -1);
          for (let j = 0; j < 4; j++) sparkle(ctx, PSILV, c + (R() - 0.5) * 240, cy + R() * 260, 8, j);
        }
      },
    };
  })();

  // Top Hat (the Phantom Trickster's Springboard): her top hat set down on the floor, brim-up and
  // rocking a little with a silver twinkle (frames 0-3, loops); frames 4-7 it springs: the hat
  // hops, a burst of doves and cards flies up out of it and smoke puffs round the brim.
  E.pttrap = grown((() => {
    const c = 80;
    const gy = 110;
    return {
      w: 160, h: 130, n: 8, fps: 10, px: c, py: gy,
      draw(ctx, i) {
        const fire = i >= 4 ? i - 4 : -1;
        const rock = fire < 0 ? Math.sin((i / 4) * TAU) * 0.06 : 0;
        const hop = fire < 0 ? 0 : [14, 8, 3, 0][fire];
        ctx.save();
        ctx.translate(c, gy - hop);
        ctx.rotate(rock);
        // Upside down on the floor: the crown down, the brim and its open top up.
        inked(ctx, [[-22, 0], [-20, -34], [20, -34], [22, 0]], PLUM[3], PLUM[4], 3);
        inked(ctx, [[-22, -12], [22, -12], [22, -6], [-22, -6]], PSILV[2], PSILV[4], 2);
        inked(ctx, [[-36, -38], [36, -38], [38, -33], [36, -29], [-36, -29], [-38, -33]], PLUM[3], PLUM[4], 3);
        fill(ctx, [[-24, -36], [24, -36], [24, -34], [-24, -34]], PLUM[4]);
        ctx.restore();
        if (fire < 0 && i % 2 === 0) sparkle(ctx, PSILV, c + 18, gy - 44, 6, i);
        if (fire >= 0) {
          if (fire <= 2) for (let j = 0; j < 3; j++) puff(ctx, SMOKE, c + (j - 1) * 26, gy - 36 - hop - fire * 4, 9 - fire * 2, 1231 + j, { lobes: 4, holes: fire >= 1 ? 0.5 : 0 });
          for (let j = 0; j < 2; j++) doveArt(ctx, c + (j ? 26 : -26) + (j ? 1 : -1) * fire * 10, gy - 60 - fire * 16, 14, fire % 2 ? 1 : -1);
          for (let j = 0; j < 3; j++) cardArt(ctx, c + (j - 1) * (18 + fire * 10), gy - 50 - fire * 12 - j * 6, 18, j + fire, Math.cos(fire + j), j);
        }
      },
    };
  })(), 2);

  // Bolt Mortar (the Arbalist Engineer's Grand Somersault): her shell bursting high over the stage:
  // a brass flash and a teal ring blasting out, cogs and rivets flying, a ring of steam spreading
  // and thinning (one-shot).
  E.aeshell = grown((() => {
    const c = 140;
    return {
      w: 280, h: 260, n: 9, fps: 16, px: c, py: c,
      draw(ctx, i) {
        const k = Math.min(1, i / 5);
        if (i <= 2) starburst(ctx, BRASS, c, c, [36, 70, 86][i], 12, 1241, { inner: 0.3 });
        if (i >= 1 && i <= 5) celRing(ctx, TEALE, c, c, 30 + 90 * k, 12 * (1 - k * 0.6), { broken: i >= 4 ? 0.4 : 0, seed: 1242 });
        if (i >= 2) {
          if (i <= 6) puff(ctx, STEAM, c, c, 26 + 14 * k, 1243, { holes: i >= 4 ? 0.3 + (i - 4) * 0.2 : 0, lobes: 7 });
          for (let j = 0; j < 7; j++) {
            const a = (j / 7) * TAU + 0.3;
            cogArt(ctx, c + Math.cos(a) * (40 + 80 * k), c + Math.sin(a) * (40 + 80 * k) + k * k * 30, 12 * (1 - k * 0.4), 6, i * 0.7 + j);
          }
        }
        if (i >= 5) for (let j = 0; j < 6; j++) sparkle(ctx, TEALE, c + Math.cos(j * 1.3) * 110, c + Math.sin(j * 1.9) * 80 + (i - 5) * 8, 8 - (i - 5), j);
      },
    };
  })(), 1.4);

  // Spring Mine (the Arbalist Engineer's Springboard): a brass plate on the floor with a coiled
  // spring under a riveted lid and a wind-up key turning on top, a teal light blinking (frames 0-3,
  // loops); frames 4-7 it goes off: the lid springs up on the coil, cogs fly and steam bursts out.
  E.aemine = grown((() => {
    const c = 80;
    const gy = 112;
    return {
      w: 160, h: 140, n: 8, fps: 10, px: c, py: gy,
      draw(ctx, i) {
        const fire = i >= 4 ? i - 4 : -1;
        const up = fire < 0 ? 0 : [34, 24, 12, 4][fire];
        inked(ctx, [[c - 34, gy], [c + 34, gy], [c + 30, gy - 8], [c - 30, gy - 8]], BRASS[3], BRASS[4], 3);
        for (let k = 0; k < 4; k++) {
          const y = gy - 10 - k * (3 + up / 4);
          inked(ctx, [[c - 12, y], [c + 12, y - 2], [c + 12, y], [c - 12, y + 2]], BRASS[2], BRASS[4], 2);
        }
        const ly = gy - 22 - up;
        inked(ctx, [[c - 26, ly], [c + 26, ly], [c + 26, ly + 6], [c - 26, ly + 6]], BRASS[2], BRASS[4], 3);
        for (const sd of [-1, 1]) fill(ctx, [[c + sd * 20 - 2, ly + 2], [c + sd * 20 + 2, ly + 2], [c + sd * 20 + 2, ly + 4], [c + sd * 20 - 2, ly + 4]], BRASS[4]);
        // The teal light, blinking.
        if (fire >= 0 || i % 2 === 0) {
          ctx.beginPath();
          ctx.arc(c + 12, ly - 2, 4, 0, TAU);
          ctx.fillStyle = TEALE[2];
          ctx.fill();
        }
        // The key, turning (seen edge-on as it turns).
        const turn = Math.cos((i / 4) * TAU);
        ctx.save();
        ctx.translate(c - 6, ly - 8);
        ctx.scale(Math.max(0.2, Math.abs(turn)), 1);
        inked(ctx, [[-2, 6], [2, 6], [2, -2], [-2, -2]], BRASS[2], BRASS[4], 2);
        inked(ctx, Array.from({ length: 12 }, (_, j) => [Math.cos((j / 12) * TAU) * 8 - 9, Math.sin((j / 12) * TAU) * 6 - 6]), BRASS[2], BRASS[4], 2);
        inked(ctx, Array.from({ length: 12 }, (_, j) => [Math.cos((j / 12) * TAU) * 8 + 9, Math.sin((j / 12) * TAU) * 6 - 6]), BRASS[2], BRASS[4], 2);
        ctx.restore();
        if (fire >= 0) {
          if (fire <= 2) puff(ctx, STEAM, c, gy - 10, 10 + fire * 2, 1251, { lobes: 5, holes: fire >= 1 ? 0.5 : 0 });
          for (let j = 0; j < 3; j++) cogArt(ctx, c + (j - 1) * (20 + fire * 12), ly - 14 - fire * 10 + Math.abs(j - 1) * 6, 8, 6, fire + j);
          if (fire <= 1) starburst(ctx, TEALE, c, ly - 6, 20 + fire * 8, 8, 1252, { inner: 0.36 });
        }
      },
    };
  })(), 2);

  // ---------- Round the Cleric, tidied (the player found them odd) ----------
  // Spark Rush, smaller and low: a heart-monitor blip racing along the floor under them, little
  // speed streaks off their heels, a heart pulsing at each shoulder.
  E.rxspark = (() => {
    const c = 160;
    const gy = 290;
    return {
      w: 320, h: 260, n: 8, fps: 20, px: c, py: gy,
      draw(ctx, i) {
        const fade = i >= 6 ? 1 - (i - 5) * 0.3 : 1;
        ctx.save();
        ctx.globalAlpha = fade;
        ecgLine(ctx, c - 110, gy - 6, 200, 18, 0.2 + (i / 8) * 0.6, 4);
        for (let j = 0; j < 3; j++) speedLine(ctx, ECG, c - 50 - j * 8, gy - 20 - j * 18, c - 110 - j * 14, gy - 20 - j * 18, 3);
        const beat = 1 + 0.25 * Math.max(0, Math.sin((i / 8) * TAU * 2));
        for (const s of [-1, 1]) heartMark(ctx, MDRED, c + s * 80, gy - 150 - (i % 2) * 2, 9 * beat);
        ctx.restore();
      },
    };
  })();
  // Frost Shield while it holds (loops): a cold pack hovering at each side of them, bobbing, a faint
  // blue ring at their feet. Nothing round their body.
  E.mdfrosthold = (() => {
    const c = 160;
    const gy = 250;
    return {
      w: 320, h: 260, n: 6, fps: 8, px: c, py: gy, loop: true,
      draw(ctx, i) {
        const ph = (i / 6) * TAU;
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.translate(c, gy - 4);
        ctx.scale(1, 0.3);
        celRing(ctx, GEL, 0, 0, 70, 6, { seed: 1950 });
        ctx.restore();
        for (const s of [-1, 1]) icePack(ctx, c + s * 84, gy - 90 + Math.sin(ph + (s > 0 ? 1.5 : 0)) * 5, 24, 18, s * 0.25 + Math.sin(ph) * 0.08);
        if (i % 3 === 0) sparkle(ctx, GEL, c + (i ? -94 : 94), gy - 110, 5, i);
      },
    };
  })();

  // Espresso Round, redrawn (the player found the floating cups horrible): a rich swirl at their
  // feet, a coffee-brown ring opening, roasted beans spiralling up round their sides (never across
  // the face), gold jitter sparks crackling off them, then the beans pop into sparkles. Quick, low.
  E.mdcoffee = (() => {
    const c = 160;
    const gy = 270;
    const BREW = ['#fff4e0', '#e8c49a', '#a86a3e', '#6a3a24', '#2e1a14'];
    const GOLDP = ['#ffffff', '#fff3b0', '#ffd36a', '#c8902e', '#6a3a2a'];
    const bean = (ctx, x, y, r, rot) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 0.7, 0, 0, TAU);
      ctx.fillStyle = BREW[3];
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = BREW[4];
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-r * 0.7, -r * 0.1);
      ctx.quadraticCurveTo(0, r * 0.35, r * 0.7, -r * 0.1);
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = BREW[4];
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(-r * 0.35, -r * 0.3, r * 0.3, r * 0.16, -0.4, 0, TAU);
      ctx.fillStyle = BREW[2];
      ctx.fill();
      ctx.restore();
    };
    return {
      w: 320, h: 280, n: 9, fps: 16, px: c, py: gy,
      draw(ctx, i) {
        const open = Math.min(1, (i + 1) / 3);
        ctx.save();
        ctx.translate(c, gy - 4);
        ctx.scale(1, 0.3);
        celRing(ctx, BREW, 0, 0, 40 + 50 * open, 10, { broken: i >= 6 ? (i - 5) * 0.25 : 0, seed: 1980 });
        ctx.restore();
        // Beans spiralling up round their sides, spread all round the turn, out past the shoulders.
        for (let k = 0; k < 10; k++) {
          const u = i / 8 - (k % 3) * 0.05;
          if (u <= 0 || u >= 1) continue;
          const a = u * TAU * 0.9 + (k / 10) * TAU;
          // (Always out at her sides, never across her middle where her face is.)
          const side = k % 2 ? 1 : -1;
          const x = c + side * (64 + 18 * Math.abs(Math.cos(a)) + 6 * (k % 3));
          const y = gy - 24 - u * 150 - (k % 4) * 8 + Math.sin(a) * 10;
          if (i >= 7 && k % 2) sparkle(ctx, GOLDP, x, y, 8, k);
          else bean(ctx, x, y, 7.5 * (1 - u * 0.3), a);
        }
        // Gold sparkles crackling off her sides (the jitter).
        if (i >= 2 && i <= 6) for (const s of [-1, 1]) sparkle(ctx, GOLDP, c + s * (88 + (i % 2) * 8), gy - 70 - (i % 3) * 22, 9 - Math.abs(i - 4), i);
      },
    };
  })();

  // ---------- The Sky Dancer's new skills (the all-class pass, 2026-11-07) ----------
  // Downburst (on the floor where she dives): a ring of wind slaps down and bursts out both ways in
  // crescents, clouds rolling out along the floor, feathers and sunlight scattering. Slim, crisp.
  E.sddownburst = (() => {
    const c = 330;
    const gy = 240;
    return {
      w: 660, h: 280, n: 9, fps: 18, px: c, py: gy,
      draw(ctx, i) {
        const b = Math.min(1, i / 5);
        const fade = i >= 6 ? 1 - (i - 5) * 0.28 : 1;
        ctx.save();
        ctx.globalAlpha = fade;
        // The ring slapping down onto the floor.
        ctx.save();
        ctx.translate(c, gy - 6);
        ctx.scale(1, 0.28);
        celRing(ctx, SKYB, 0, 0, 40 + b * 170, 12 * (1 - b * 0.5), { broken: i >= 6 ? 0.5 : 0, seed: 2020 });
        ctx.restore();
        // Crescents of wind racing out both ways.
        for (const s of [-1, 1]) for (let k = 0; k < 2; k++) {
          const x = c + s * (50 + b * (140 + k * 40));
          ctx.save();
          ctx.translate(x, gy - 30 - k * 22);
          ctx.scale(s, 1);
          celCrescent(ctx, k ? CLOUDS : SKYB, 0, 0, 34 - k * 6, -1.2, 1.2, 9, { seed: 2021 + k, inkW: 2.5 });
          ctx.restore();
          if (i <= 5) puff(ctx, CLOUDS, x - s * 26, gy - 10, 14 - k * 3, 2025 + k, { lobes: 4, holes: i >= 4 ? 0.3 : 0 });
        }
        if (i <= 1) starburst(ctx, SUNLIT, c, gy - 30, 40 + i * 20, 10, 2028, { inner: 0.35 });
        const R = rng(2030 + i);
        for (let j = 0; j < 6; j++) {
          const a = R() * Math.PI + Math.PI;
          const d = 60 + b * 160;
          if (j % 2) feather(ctx, SKYB, c + Math.cos(a) * d, gy - 20 + Math.sin(a) * d * 0.4, 20, a);
          else sparkle(ctx, SUNLIT, c + Math.cos(a) * d, gy - 30 + Math.sin(a) * d * 0.4, 8, j);
        }
        ctx.restore();
      },
    };
  })();
  // Gale Step: a slim streak of wind left behind her where she rode the gust, feathers peeling off.
  E.sdgalefx = (() => {
    const c = 40;
    const cy = 60;
    return {
      w: 420, h: 120, n: 8, fps: 20, px: c, py: cy,
      draw(ctx, i) {
        const fade = i >= 4 ? 1 - (i - 3) * 0.2 : 1;
        ctx.save();
        ctx.globalAlpha = fade;
        for (let k = 0; k < 3; k++) speedLine(ctx, k === 1 ? CLOUDS : SKYB, c + 360 - i * 10, cy - 18 + k * 18, c + 20 + i * 30, cy - 18 + k * 18, 5 - k);
        const R = rng(2040);
        for (let j = 0; j < 6; j++) {
          const u = R();
          feather(ctx, j % 2 ? SUNLIT : SKYB, c + 40 + u * 300, cy + (R() - 0.5) * 60 + i * 4 * (j % 2 ? 1 : -1), 18, u * 6 + i * 0.4);
        }
        ctx.restore();
      },
    };
  })();
  // Cloud Nine (round her, low): little clouds swirling up round her sides into a ring, a pair of
  // wings of light opening behind her shoulders, sparkles; then they drift apart.
  E.sdcloudnine = (() => {
    const c = 160;
    const gy = 280;
    return {
      w: 320, h: 300, n: 10, fps: 14, px: c, py: gy,
      draw(ctx, i) {
        const u = Math.min(1, i / 5);
        const fade = i >= 8 ? 1 - (i - 7) * 0.35 : 1;
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.save();
        ctx.translate(c, gy - 6);
        ctx.scale(1, 0.3);
        celRing(ctx, SKYB, 0, 0, 60 + 30 * u, 7, { seed: 2050, broken: i >= 8 ? 0.4 : 0 });
        ctx.restore();
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * TAU + i * 0.5;
          const side = Math.cos(a) >= 0 ? 1 : -1;
          puff(ctx, CLOUDS, c + side * (64 + 10 * Math.abs(Math.sin(a))), gy - 20 - u * 120 * ((k % 3) / 3 + 0.3), 12, 2051 + k, { lobes: 4 });
        }
        if (i >= 2) for (const s of [-1, 1]) for (let k = 0; k < 4; k++) feather(ctx, k % 2 ? CLOUDS : SKYB, c + s * (40 + k * 10), gy - 150 - k * 10, 34 - k * 4, s > 0 ? -0.6 - k * 0.3 : Math.PI + 0.6 + k * 0.3);
        const R = rng(2060 + i);
        for (let j = 0; j < 5; j++) sparkle(ctx, SUNLIT, c + (R() < 0.5 ? -1 : 1) * (70 + R() * 40), gy - 40 - R() * 160, 7, j);
        ctx.restore();
      },
    };
  })();

  // ---------- The Blade Dancer's new skills (the all-class pass, 2026-11-07) ----------
  // Hoopla (on the monster, anchored at its feet): her big ring drops out of the air over it like a
  // fairground ring toss, spinning flat, tightens round its waist, a gold DING flash, then the ring
  // snaps into beads.
  E.bdhoopla = (() => {
    const c = 130;
    const gy = 280;
    return {
      w: 260, h: 320, n: 10, fps: 20, px: c, py: gy,
      draw(ctx, i) {
        const drop = Math.min(1, i / 4);
        const y = gy - 280 + drop * 180;
        const r = 80 - drop * 22 - (i >= 5 ? (i - 4) * 6 : 0);
        if (i <= 7) chakram(ctx, c, y, r, i * 0.7, 0.3, i >= 5 ? GOLDRING : ROSEGOLD);
        if (i <= 3) for (const s of [-1, 1]) speedLine(ctx, GOLDRING, c + s * r * 0.9, y - 40, c + s * r * 0.9, y - 4, 3);
        if (i >= 4 && i <= 6) starburst(ctx, GOLDRING, c, gy - 100, [40, 60, 44][i - 4], 8, 2101, { inner: 0.32, rot: i * 0.2 });
        if (i >= 5) {
          const k = (i - 5) / 4;
          const R = rng(2102);
          for (let j = 0; j < 10; j++) {
            const a = (j / 10) * TAU + R() * 0.3;
            const d = 50 + k * 60;
            if (i < 8) shard(ctx, j % 2 ? GOLDRING : ROSEGOLD, c + Math.cos(a) * d, gy - 100 + Math.sin(a) * d * 0.35, a + Math.PI / 2, 10, 3);
            else sparkle(ctx, j % 2 ? GOLDRING : ROSEGOLD, c + Math.cos(a) * d, gy - 100 + Math.sin(a) * d * 0.35, 7, a);
          }
        }
      },
    };
  })();
  // Juggling Act (over her head, anchored at her feet): three rings wheeling round in a cascade
  // high above her head, gold glints where her hands toss them.
  E.bdjuggle = (() => {
    const c = 150;
    const gy = 440;
    const top = gy - 290;
    return {
      w: 300, h: 460, n: 12, fps: 24, px: c, py: gy,
      draw(ctx, i) {
        for (let k = 0; k < 3; k++) {
          const a = ((i / 12) + k / 3) * TAU;
          // A figure-eight cascade: wide and low at the sides, crossing at the top.
          const x = c + Math.sin(a) * 80;
          const y = top + 30 - Math.abs(Math.cos(a * 0.5)) * 60;
          chakram(ctx, x, y, 30, a * 2, 0.8, k === 1 ? GOLDRING : ROSEGOLD);
          if ((i + k * 4) % 12 < 2) sparkle(ctx, GOLDRING, x, y + 26, 9, a);
        }
      },
    };
  })();
  // Showstopper (round her, anchored at her feet): a gold ring opening on the floor, two fountains
  // of rose-gold confetti bursting up at her sides and raining out, stars popping at her shoulders.
  E.bdshow = (() => {
    const c = 180;
    const gy = 300;
    return {
      w: 360, h: 320, n: 10, fps: 16, px: c, py: gy,
      draw(ctx, i) {
        const open = Math.min(1, (i + 1) / 4);
        const fade = i >= 8 ? 1 - (i - 7) * 0.35 : 1;
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.save();
        ctx.translate(c, gy - 4);
        ctx.scale(1, 0.3);
        celRing(ctx, GOLDRING, 0, 0, 50 + 50 * open, 9, { broken: i >= 7 ? 0.4 : 0, seed: 2110 });
        ctx.restore();
        const R = rng(2111);
        for (let j = 0; j < 18; j++) {
          const s = j % 2 ? 1 : -1;
          const vx = 30 + R() * 70;
          const vy = 220 + R() * 90;
          const u = Math.max(0, i / 9 - R() * 0.15);
          const x = c + s * (70 + vx * u);
          const y = gy - 20 - vy * u * 1.5 + 190 * u * u;
          const pal = j % 3 === 0 ? GOLDRING : ROSEGOLD;
          if (j % 4 === 0) sparkle(ctx, pal, x, y, 11, j);
          else shard(ctx, pal, x, y, j + i * 0.6, 15, 6);
        }
        if (i >= 2 && i <= 6) for (const s of [-1, 1]) starburst(ctx, GOLDRING, c + s * 96, gy - 170 + (i % 2) * 6, [22, 34, 28, 22, 16][i - 2], 5, 2112, { inner: 0.42, rot: s * 0.3 });
        ctx.restore();
      },
    };
  })();

  // ---------- The Arbalist's steam, redrawn (the all-class pass, 2026-11-07) ----------
  // The old steam was fat white blobs that buried her. Now: slim curling wisps of steam, inked
  // strokes that rise and curl over at the tips, a couple of small puffs at their roots, a brass
  // glint; they thin and break apart as they go. Same frame size as before, so every use keeps
  // its scale.
  E.aesteam = (() => {
    const c = 225;
    const gy = 330;
    const wisp = (ctx, x0, y0, len, lean, curl, w, k) => {
      const pts = [];
      for (let j = 0; j <= 14; j++) {
        const u = j / 14;
        pts.push([x0 + lean * u * len + Math.sin(u * 5 + k * 3) * 10 * u, y0 - u * len]);
      }
      // The curl at the tip.
      const [ex, ey] = pts.at(-1);
      for (let j = 1; j <= 8; j++) {
        const a = -Math.PI / 2 + curl * (j / 8) * Math.PI * 1.4;
        const r = 18 * (1 - j / 12);
        pts.push([ex + curl * 18 + Math.cos(a) * r * curl, ey + 18 + Math.sin(a) * r]);
      }
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (const [col, lw] of [[STEAM[4], w + 4], [STEAM[3], w + 1.5], [STEAM[1], w * 0.55]]) {
        ctx.beginPath();
        pts.forEach(([x, y], j) => (j ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.strokeStyle = col;
        ctx.lineWidth = lw;
        ctx.globalAlpha = col === STEAM[4] ? 0.35 : 1;
        ctx.stroke();
      }
      ctx.restore();
    };
    return {
      w: 450, h: 450, n: 7, fps: 20, px: c, py: gy,
      draw(ctx, i) {
        const k = i / 6;
        const fade = i >= 4 ? 1 - (i - 3) * 0.25 : 1;
        ctx.save();
        ctx.globalAlpha = fade;
        const len = 60 + k * 120;
        for (const [dx, lean, curl, w] of [[-34, -0.5, -1, 7], [0, 0.05, 1, 9], [34, 0.5, 1, 7], [-64, -0.9, -1, 5], [64, 0.9, 1, 5]]) {
          if (i >= 5 && Math.abs(dx) > 40) continue;
          wisp(ctx, c + dx * (1 + k * 0.6), gy - 10 - k * 30, len * (Math.abs(dx) > 40 ? 0.6 : 1), lean, curl, w * (1 - k * 0.4), dx);
        }
        if (i <= 3) for (const sd of [-1, 1]) puff(ctx, STEAM, c + sd * (22 + k * 30), gy - 6, 12 - k * 4, 340 + sd, { lobes: 4 });
        if (i <= 2) sparkle(ctx, BRASS, c, gy - 30 - k * 40, 10, 0.2);
        ctx.restore();
      },
    };
  })();

  // Wind-Up Bomb, waddling along (looped): a round brass bomb on two little feet, a teal lens for an
  // eye, a riveted band, and a wind-up key turning on top; it rocks side to side as it toddles.
  E.aewindup = {
    w: 120, h: 130, n: 4, fps: 10, px: 60, py: 76, loop: true,
    draw(ctx, i) {
      const rock = [0.12, 0, -0.12, 0][i];
      ctx.save();
      ctx.translate(60, 76);
      ctx.rotate(rock);
      // Feet, one up as the other plants.
      for (const [sd, up] of [[-1, i === 0 ? 6 : 0], [1, i === 2 ? 6 : 0]]) inked(ctx, [[sd * 16 - 9, 26 - up], [sd * 16 + 9, 26 - up], [sd * 16 + 11, 34 - up], [sd * 16 - 11, 34 - up]], BRASS[3], BRASS[4], 3);
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, TAU);
      ctx.fillStyle = BRASS[2];
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = BRASS[4];
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-9, -10, 11, 0, TAU);
      ctx.fillStyle = BRASS[1];
      ctx.fill();
      fill(ctx, [[-30, 4], [30, 4], [29, 11], [-29, 11]], BRASS[3]);
      for (const x of [-20, -7, 7, 20]) {
        ctx.beginPath();
        ctx.arc(x, 7.5, 2.4, 0, TAU);
        ctx.fillStyle = BRASS[1];
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(14, -6, 8, 0, TAU);
      ctx.fillStyle = TEALE[2];
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = TEALE[4];
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(16, -8, 3, 0, TAU);
      ctx.fillStyle = TEALE[0];
      ctx.fill();
      // The key, turning (its bow seen edge-on, then flat).
      inked(ctx, [[-3, -30], [3, -30], [3, -42], [-3, -42]], BRASS[3], BRASS[4], 3);
      const wv = [1, 0.5, 0.15, 0.5][i];
      for (const sd of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(sd * 11 * wv, -46, 10 * wv + 2, 7, 0, 0, TAU);
        ctx.fillStyle = BRASS[2];
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = BRASS[4];
        ctx.stroke();
      }
      ctx.restore();
    },
  };

  // ---------- The Phantom's stage smoke, redrawn (the all-class pass, 2026-11-07) ----------
  // The old smoke was a wall of fat plum cloud balls that swallowed her (and filled the screen in
  // Grand Illusion). Now: a silver flash and a ring of slim inked plum curls that whip out and curl
  // over like a magician's smoke, a couple of small puffs low at the base, a card turning in it,
  // sparkles as it thins. Same frame size as before, so every use keeps its scale.
  E.ptsmoke = (() => {
    const c = 270;
    const gy = 450;
    const cy = gy - 150;
    const curl = (ctx, a, d, len, w, sd) => {
      const pts = [];
      for (let j = 0; j <= 12; j++) {
        const u = j / 12;
        const r = d + u * len;
        const aa = a + sd * u * 0.9;
        pts.push([c + Math.cos(aa) * r, cy + Math.sin(aa) * r * 0.85]);
      }
      const [ex, ey] = pts.at(-1);
      const aEnd = a + sd * 0.9;
      for (let j = 1; j <= 8; j++) {
        const t = aEnd + sd * (Math.PI / 2 + (j / 8) * Math.PI * 1.3);
        const rr = 22 * (1 - j / 11);
        pts.push([ex + Math.cos(aEnd + sd * Math.PI / 2) * 22 + Math.cos(t) * rr, ey + Math.sin(aEnd + sd * Math.PI / 2) * 22 + Math.sin(t) * rr]);
      }
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (const [col, lw, al] of [[SMOKE[4], w + 5, 0.4], [SMOKE[3], w + 2, 1], [SMOKE[1], w * 0.5, 1]]) {
        ctx.beginPath();
        pts.forEach(([x, y], j) => (j ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.strokeStyle = col;
        ctx.lineWidth = lw;
        ctx.globalAlpha *= al;
        ctx.stroke();
        ctx.globalAlpha /= al;
      }
      ctx.restore();
    };
    return {
      w: 540, h: 510, n: 7, fps: 20, px: c, py: gy,
      draw(ctx, i) {
        const k = Math.min(1, (i + 1) / 4);
        const fade = i >= 4 ? 1 - (i - 3) * 0.28 : 1;
        ctx.save();
        ctx.globalAlpha = fade;
        if (i <= 1) starburst(ctx, PSILV, c, cy, 40 + i * 24, 8, 731, { inner: 0.4 });
        for (let j = 0; j < 8; j++) {
          const a = (j / 8) * TAU + 0.3;
          // (Out round her in a ring, never across her: the middle stays clear.)
          curl(ctx, a, 110 + k * 40, 24 + k * 30, 13 * (1 - (i >= 4 ? (i - 3) * 0.2 : 0)), j % 2 ? 1 : -1);
        }
        if (i <= 4) for (const sd of [-1, 1]) puff(ctx, SMOKE, c + sd * (40 + k * 40), gy - 20, 22 - i * 3, 733 + sd, { lobes: 4, holes: i >= 3 ? 0.4 : 0 });
        if (i >= 1 && i <= 5) cardArt(ctx, c + 60 + i * 10, cy - 60 - i * 14, 40, 0.4 + i * 0.3, Math.cos(i * 1.1), 1);
        if (i >= 3) for (let j = 0; j < 6; j++) sparkle(ctx, PSILV, c + Math.cos(j * 1.05) * (90 + i * 14), cy + Math.sin(j * 1.05) * (70 + i * 10), 12 - (i - 3) * 2, j);
        ctx.restore();
      },
    };
  })();

  // ---------- The Tide Mage (docs/design/tide-mage.md) ----------
  // Her shapes, hers alone: curling wave crests capped with foam, round bubbles with a white glint,
  // spray droplets, and ripple rings; deep sea teal inked in navy, white foam, a coral accent.
  // Every one is drawn as smooth motion over many drawings (12-16): each drawing is the same
  // picture at its own moment (`k`, 0-1), so droplets fly in real arcs, foam churns and crests roll
  // instead of jumping between key poses. (Art px are strip px: three to a game pixel.)
  let TIDEP = ['#ffffff', '#c8f4ff', '#46c4e4', '#1787bb', '#0c4a80'];
  let FOAM = ['#ffffff', '#f3fdff', '#cfeef8', '#93cde4', '#3f80ac'];
  let TMCORAL = ['#ffffff', '#ffe2d6', '#ff9c88', '#ee6670', '#9e3b5c'];
  const smooth = (t) => t * t * (3 - 2 * t);
  const clamp01 = (t) => Math.max(0, Math.min(1, t));
  const win = (k, a, b) => clamp01((k - a) / (b - a));
  // In then out over k: 0 outside a..b, 1 at its middle, smooth either side.
  const swell = (k, a, b) => Math.sin(Math.PI * win(k, a, b));

  // A body of water: the shape inked in navy, then its deep tone, its sea teal a little inside,
  // a light band along `lit` (a list of points it runs through) and white specular streaks.
  // A closed outline resampled to `n` points evenly round its edge.
  function resample(pts, n) {
    const seg = pts.map((p, i) => Math.hypot(pts[(i + 1) % pts.length][0] - p[0], pts[(i + 1) % pts.length][1] - p[1]));
    const total = seg.reduce((a, b) => a + b, 0) || 1;
    const out = [];
    let i = 0;
    let acc = 0;
    for (let k = 0; k < n; k++) {
      const want = (k / n) * total;
      while (i < pts.length - 1 && acc + seg[i] < want) acc += seg[i++];
      const f = seg[i] ? (want - acc) / seg[i] : 0;
      const p = pts[i];
      const q = pts[(i + 1) % pts.length];
      out.push([lerp(p[0], q[0], f), lerp(p[1], q[1], f)]);
    }
    return { out, total };
  }
  // A body of water's edge rippling: small waves running round its outline (`ph`, 0-1, carries them
  // on; whole turns, so a loop stays seamless), the points pushed in and out along the edge.
  function rippled(pts, ph, amp) {
    const { out, total } = resample(pts, Math.max(24, Math.round(pts.length * 6)));
    const cx = out.reduce((n, p) => n + p[0], 0) / out.length;
    const cy = out.reduce((n, p) => n + p[1], 0) / out.length;
    const waves = Math.max(3, Math.round(total / 110));
    return out.map(([x, y], i) => {
      const [px, py] = out[(i - 1 + out.length) % out.length];
      const [nx2, ny2] = out[(i + 1) % out.length];
      let nx = ny2 - py;
      let ny = -(nx2 - px);
      const l = Math.hypot(nx, ny) || 1;
      nx /= l;
      ny /= l;
      if (nx * (x - cx) + ny * (y - cy) < 0) [nx, ny] = [-nx, -ny];
      const u = i / out.length;
      const d = amp * (Math.sin(u * waves * TAU - ph * TAU * 2) * 0.85 + Math.sin(u * waves * 2 * TAU + ph * TAU * 2) * 0.15);
      return [x + nx * d, y + ny * d];
    });
  }
  function water(ctx, pts, { inset = 0.12, lit = null, glints = null, ph = 0, ripple = 1 } = {}) {
    // Every body of water ripples: its edge undulating, ripple marks drifting over it.
    // (As deep as the water is thick: a thin whip ripples finely, a wave in broad swells.)
    const thick = Math.min(Math.max(...pts.map((p) => p[0])) - Math.min(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1])) - Math.min(...pts.map((p) => p[1])));
    if (ripple) pts = rippled(pts, ph, Math.min(5, Math.max(1, thick * 0.045)) * ripple);
    inked(ctx, pts, TIDEP[3], TIDEP[4], 3);
    const cx = pts.reduce((n, p) => n + p[0], 0) / pts.length;
    const cy = pts.reduce((n, p) => n + p[1], 0) / pts.length;
    fill(ctx, pts.map(([x, y]) => [lerp(x, cx, inset), lerp(y, cy, inset)]), TIDEP[2]);
    // Depth: the water darkens toward its foot and catches a pale rim of sky along its top, in two
    // flat cel bands, kept inside the shape.
    const ys = pts.map((p) => p[1]);
    const top = Math.min(...ys);
    const bot = Math.max(...ys);
    const xs = pts.map((p) => p[0]);
    ctx.save();
    path(ctx, pts);
    ctx.clip();
    ctx.fillStyle = TIDEP[3];
    ctx.globalAlpha = 0.55;
    ctx.fillRect(Math.min(...xs) - 4, lerp(top, bot, 0.78), Math.max(...xs) - Math.min(...xs) + 8, bot - top);
    ctx.globalAlpha = 1;
    ctx.lineWidth = Math.max(3, (bot - top) * 0.035);
    ctx.strokeStyle = TIDEP[1];
    path(ctx, pts.map(([x, y]) => [x, y + ctx.lineWidth * 0.9]));
    ctx.stroke();
    // Ripple marks: little doubled crescents of light drifting across the water, each swelling up
    // and fading as it goes.
    if (ripple) {
      const x0 = Math.min(...xs);
      const wdt = Math.max(...xs) - x0;
      const m = Math.max(2, Math.min(7, Math.round((wdt * (bot - top)) / 5000)));
      const size = Math.max(8, Math.min(26, Math.min(wdt, bot - top) * 0.22));
      ctx.lineCap = 'round';
      for (let j = 0; j < m; j++) {
        const u = (ph * 2 + j / m) % 1;
        const fx = x0 + wdt * ((j * 0.618 + u * 0.35) % 1);
        const fy = lerp(top, bot, 0.18 + 0.62 * ((j * 0.413) % 1)) - u * size * 0.6;
        const a = Math.sin(Math.PI * u);
        for (const [dy, col, lw] of [[0, TIDEP[1], size * 0.2], [size * 0.32, '#ffffff', size * 0.11]]) {
          ctx.beginPath();
          ctx.ellipse(fx, fy + dy, size * (0.6 + 0.4 * u), size * 0.28, 0, Math.PI * 1.15, Math.PI * 1.85);
          ctx.strokeStyle = col;
          ctx.globalAlpha = a * 0.9;
          ctx.lineWidth = lw;
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    if (lit) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = TIDEP[1];
      ctx.lineWidth = lit.w ?? 8;
      ctx.beginPath();
      lit.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = (lit.w ?? 8) * 0.35;
      ctx.stroke();
      ctx.restore();
    }
    if (glints) for (const [x, y, l, a] of glints) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.ellipse(0, 0, l, l * 0.22, 0, 0, TAU);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.restore();
    }
  }
  // Current lines: thin white strokes running through a body of water along `line(u, j)` (u 0-1
  // along it, j which line), each broken into dashes that scroll on with `ph`, so the water reads
  // as moving inside, not just its outline.
  function current(ctx, line, n, ph, w = 3, dash = 0.55) {
    // (Each line carries two long strokes half a loop apart; a stroke flows in at one end and out
    // at the other, thinning toward its tail, so the loop never jumps.)
    ctx.save();
    ctx.lineCap = 'round';
    for (let j = 0; j < n; j++) {
      for (let d = 0; d < 2; d++) {
        const headU = ((ph + j * 0.37 + d * 0.5) % 1) * (1 + dash);
        const tailU = headU - dash;
        const a = Math.max(0, tailU);
        const b = Math.min(1, headU);
        if (b - a < 0.02) continue;
        const steps = 16;
        for (let s = 0; s < steps; s++) {
          const u = a + ((b - a) * s) / steps;
          const u2 = a + ((b - a) * (s + 1)) / steps;
          const taper = clamp01((u - tailU) / dash);
          const [x1, y1] = line(u, j);
          const [x2, y2] = line(u2, j);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = TIDEP[1];
          ctx.globalAlpha = 0.75 * (0.3 + 0.7 * taper);
          ctx.lineWidth = w * (0.8 + 1.2 * taper);
          ctx.stroke();
          ctx.strokeStyle = '#ffffff';
          ctx.globalAlpha = 0.4 + 0.6 * taper;
          ctx.lineWidth = w * (0.3 + 0.6 * taper);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }
  // Claws of foam: small curled tongues of white water reaching out from (x, y) along angle `a`,
  // each curling at its tip, swaying with `ph` (the crest of a great wave, a geyser's head).
  function claws(ctx, x, y, r, a, n, ph, seed) {
    const R = rng(seed);
    for (let j = 0; j < n; j++) {
      const aa = a + (j - (n - 1) / 2) * 0.42 + Math.sin(ph * TAU + j) * 0.08;
      const rr = r * (0.7 + R() * 0.5) * (1 + 0.12 * Math.sin(ph * TAU * 2 + j * 1.7));
      const cx = x + Math.cos(aa) * rr * 0.55;
      const cy = y + Math.sin(aa) * rr * 0.55;
      celCrescent(ctx, FOAM, cx, cy, rr * 0.5, aa - 1.9, aa + 1.2, rr * 0.28, { seed: seed + j, inkW: 2.5 });
    }
  }

  // A curl of wave at its moment `ph` (0-1, loops): water rising from a base `w` wide to a crest `h`
  // high that tips over forward (+x) and pours down its hollow face; foam riding the lip and
  // churning at its foot turn with `ph`, and spray streams off the crest in arcs.
  function waveCurl(ctx, x, y, w, h, ph = 0, seed = 1) {
    const t = ph * TAU;
    const lip = Math.sin(t) * 0.04;
    const rise = 1 + Math.sin(t + 0.6) * 0.03;
    const H = h * rise;
    const back = [];
    for (let i = 0; i <= 18; i++) {
      const u = i / 18;
      const ripple = Math.sin(u * 9 - t * 2) * H * 0.012 * u;
      back.push([x - w * 0.56 + u * w * 0.7, y - H * Math.pow(Math.sin((u * Math.PI) / 2), 1.5) + ripple]);
    }
    const curlPts = [];
    for (let i = 1; i <= 8; i++) {
      // Over the top and round into the curl: an arc from the crest down into the hollow.
      const a = -Math.PI / 2 + (i / 8) * Math.PI * 1.05;
      const r = H * 0.2;
      curlPts.push([x + w * (0.14 + lip) + Math.cos(a) * r * 1.25, y - H * 0.8 + Math.sin(a) * r]);
    }
    const front = [[x + w * 0.24, y - H * 0.5], [x + w * 0.22, y - H * 0.3], [x + w * 0.32, y - H * 0.1], [x + w * 0.46, y]];
    const pts = back.concat(curlPts, front);
    water(ctx, pts, {
      ph,
      inset: 0.1,
      lit: { w: H * 0.06, pts: back.slice(4, 16).map(([px, py]) => [px + 6, py + H * 0.07]) },
      glints: [[x - w * 0.08 + Math.sin(t) * 6, y - H * 0.42, H * 0.07, -0.9], [x + w * 0.27, y - H * 0.42, H * 0.05, 1.45]],
    });
    // Current running up the back and over: three lines following the slope, scrolling with it
    // (kept inside the water).
    ctx.save();
    path(ctx, pts.map(([px, py]) => [lerp(px, x, 0.06), lerp(py, y - H * 0.4, 0.06)]));
    ctx.clip();
    current(ctx, (u, j) => {
      const v = 0.12 + u * 0.72;
      const inset = 0.16 + j * 0.13;
      return [x - w * 0.56 + v * w * 0.7 + inset * w * 0.12, y - H * Math.pow(Math.sin((v * Math.PI) / 2), 1.5) + H * inset];
    }, 3, ph * 2, H * 0.018);
    ctx.restore();
    // Inside the curl: the glassy hollow, lighter, and a thin sheet of water falling through it.
    fill(ctx, [[x + w * 0.2, y - H * 0.56], [x + w * 0.27, y - H * 0.68], [x + w * 0.29, y - H * 0.36], [x + w * 0.23, y - H * 0.34]], TIDEP[1]);
    for (let j = 0; j < 3; j++) {
      const u = (ph * 2 + j / 3) % 1;
      const sx = x + w * (0.245 + j * 0.014);
      fill(ctx, [[sx - 1.5, y - H * (0.66 - u * 0.2)], [sx + 1.5, y - H * (0.66 - u * 0.2)], [sx + 2, y - H * (0.5 - u * 0.2)], [sx - 2, y - H * (0.5 - u * 0.2)]], '#ffffff');
    }
    for (let j = 0; j < 4; j++) {
      const u = (ph + j / 4) % 1;
      bubble(ctx, x + w * (0.3 - u * 0.5), y - H * (0.08 + u * 0.14), (3.5 + (j % 2) * 2) * (1 - u * 0.5), Math.sin(u * 9 + j));
    }
    // Foam riding the lip, rolling over: two crescents turning with the wave.
    celCrescent(ctx, FOAM, x + w * (0.16 + lip), y - H * 0.8, H * 0.24, -2.9 + Math.sin(t) * 0.12, 0.9 + Math.sin(t) * 0.12, H * 0.12, { seed: seed + 3, inkW: 3 });
    celCrescent(ctx, FOAM, x + w * (0.06 + lip), y - H * 0.88, H * 0.16, -3.2, -0.6, H * 0.08, { seed: seed + 4, inkW: 3 });
    // Claws of foam reaching out along the crest as it tips over.
    claws(ctx, x + w * (0.22 + lip), y - H * 0.86, H * 0.2, -0.3, 4, ph, seed + 20);
    // White water churning at its foot and trailing off its back.
    for (let j = 0; j < 3; j++) {
      const a = t + j * 2.1;
      puff(ctx, FOAM, x + w * (0.36 + 0.04 * Math.cos(a)), y - H * (0.06 + 0.03 * Math.sin(a)), H * (0.1 + 0.03 * Math.sin(a + 1)), seed + 5 + j, { lobes: 4 });
    }
    puff(ctx, FOAM, x - w * 0.44, y - H * 0.03, H * 0.08, seed + 9, { lobes: 3 });
    // Spray streaming off the crest: each droplet on its own arc, round and round with the loop.
    const R = rng(seed + 11);
    for (let j = 0; j < 7; j++) {
      const off = R();
      const u = (ph + off) % 1;
      const vx = 0.3 + R() * 0.3;
      const vy = -0.4 - R() * 0.4;
      const dx = w * vx * u;
      const dy = H * (vy * u + 0.9 * u * u);
      const r = (4 + R() * 4) * (1 - u * 0.6);
      drop(ctx, j % 3 ? FOAM : TIDEP, x + w * 0.24 + dx, y - H * 0.9 + dy, Math.atan2(vy + 1.8 * u, vx), r);
    }
  }
  // A bubble: a ring of water round a clear middle, a white glint that slides round as it wobbles.
  function bubble(ctx, x, y, r, wob = 0) {
    // (Too small to have a ring inside its ink: just a bead of water.)
    if (r < 4) {
      ctx.beginPath();
      ctx.arc(x, y, Math.max(1, r), 0, TAU);
      ctx.fillStyle = TIDEP[4];
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, Math.max(0.6, r * 0.65), 0, TAU);
      ctx.fillStyle = TIDEP[1];
      ctx.fill();
      return;
    }
    const rx = r * (1 + wob * 0.06);
    const ry = r * (1 - wob * 0.06);
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
    ctx.fillStyle = TIDEP[1];
    ctx.globalAlpha = 0.45;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.lineWidth = Math.max(3, r * 0.15);
    ctx.strokeStyle = TIDEP[4];
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x, y, rx - ctx.lineWidth * 0.6, ry - ctx.lineWidth * 0.6, 0, 0, TAU);
    ctx.lineWidth = Math.max(2, r * 0.1);
    ctx.strokeStyle = TIDEP[2];
    ctx.stroke();
    // A thin rainbow-teal sheen on its far side, and the glints.
    ctx.beginPath();
    ctx.ellipse(x, y, rx * 0.78, ry * 0.78, 0, 0.2 + wob * 0.2, 1.4 + wob * 0.2);
    ctx.lineWidth = Math.max(1.5, r * 0.07);
    ctx.strokeStyle = TMCORAL[1];
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x - r * (0.38 - wob * 0.05), y - r * 0.4, r * 0.24, r * 0.14, -0.7, 0, TAU);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + r * 0.42, y + r * 0.36, r * 0.08, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  // A ripple ring flat on the floor (`sy` squashes it into perspective).
  function ripple(ctx, x, y, r, th, sy = 0.32, broken = 0, seed = 1, a = 1) {
    if (r <= th || a <= 0) return;
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.translate(x, y);
    ctx.scale(1, sy);
    celRing(ctx, TIDEP, 0, 0, r, th, { broken, seed });
    ctx.restore();
  }
  // Droplets thrown from (x, y) at moment `u` (0-1 of their flight): each its own speed and angle
  // round `a` (spread `sp`), falling under gravity `g`, shrinking as they go.
  function spray(ctx, x, y, a, sp, n, d, u, seed, { g = 0.9, pal = FOAM } = {}) {
    if (u <= 0 || u >= 1) return;
    const R = rng(seed);
    for (let j = 0; j < n; j++) {
      const aa = a + (R() - 0.5) * sp;
      const sp0 = d * (0.5 + R() * 0.5);
      const late = R() * 0.15;
      const v = clamp01((u - late) / (1 - late));
      if (v <= 0) continue;
      const px = x + Math.cos(aa) * sp0 * v;
      const py = y + Math.sin(aa) * sp0 * v + g * d * v * v * 0.6;
      const vy = Math.sin(aa) * sp0 + g * d * v * 1.2;
      const vx = Math.cos(aa) * sp0;
      const dir = Math.atan2(vy, vx);
      const r = (5 + R() * 4) * (1 - v * 0.55);
      // (Early in their flight, while they're quick, a streak of water behind them.)
      if (v < 0.35) speedLine(ctx, pal, px - Math.cos(dir) * r * 4, py - Math.sin(dir) * r * 4, px, py, r * 0.45);
      if (j % 4 === 3) {
        ctx.beginPath();
        ctx.arc(px, py, r * 0.75, 0, TAU);
        ctx.fillStyle = TIDEP[4];
        ctx.fill();
        ctx.beginPath();
        ctx.arc(px, py, r * 0.55, 0, TAU);
        ctx.fillStyle = TIDEP[1];
        ctx.fill();
        ctx.beginPath();
        ctx.arc(px - r * 0.2, py - r * 0.2, r * 0.2, 0, TAU);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      } else drop(ctx, j % 3 ? pal : TIDEP, px, py, dir, r);
    }
  }

  // Her whip of water (cracked out ahead of the staff, out to its reach: 118 px, 354 art px): the
  // stream flies out with a travelling wave running down it, snaps straight and cracks at its tip
  // in a burst of white water, then breaks up, the droplets falling.
  E.tmlash = (() => {
    const x0 = 20;
    const cy = 100;
    const L = 360;
    const n = 26;
    return {
      w: L + 90, h: 210, n, fps: 30, px: x0, py: cy,
      draw(ctx, i) {
        const k = i / (n - 1);
        const out = smooth(win(k, 0, 0.32));
        const snap = smooth(win(k, 0.18, 0.4));
        const fade = win(k, 0.42, 0.62);
        if (fade < 1) {
          const top = [];
          const bot = [];
          const m = 32;
          for (let j = 0; j <= m; j++) {
            const u = (j / m) * out;
            // A wave travelling down the stream as it flies out, damping as it snaps straight.
            const amp = 38 * (1 - snap * 0.85) * Math.sin(u * Math.PI * 2.4 - k * 14) * (0.35 + u);
            const yy = cy + amp;
            const wid = lerp(42, 14, Math.pow(u, 0.8)) * (1 - fade * 0.7) * (1 + 0.12 * Math.sin(u * 21 - k * 20));
            top.push([x0 + u * L, yy - wid / 2]);
            bot.push([x0 + u * L, yy + wid / 2]);
          }
          ctx.save();
          ctx.globalAlpha = 1 - fade;
          water(ctx, top.concat(bot.slice().reverse()), { ph: k * 2, inset: 0.25, lit: { w: 7, pts: top.map(([px, py]) => [px, py + 6]) } });
          // A twist of light round it, sliding down its length as it flies.
          for (let j = 0; j <= m; j++) {
            const tw = Math.sin((j / m) * 30 - k * 40);
            if (tw < 0.55 || j % 2) continue;
            const side = Math.sin((j / m) * 15 - k * 20) > 0 ? 0.3 : 0.7;
            const px = top[j][0];
            const py = lerp(top[j][1], bot[j][1], side);
            fill(ctx, [[px - 7, py - 2], [px + 7, py - 3.5], [px + 7, py], [px - 7, py + 1.5]], '#ffffff');
          }
          // Bubbles carried along inside it.
          for (let j = 1; j < 5; j++) {
            const at = Math.round(((j / 5 + k * 0.4) % 1) * m * 0.9);
            bubble(ctx, top[at][0], (top[at][1] + bot[at][1]) / 2, 4 + (j % 2) * 2, Math.sin(k * 9 + j));
          }
          ctx.restore();
        }
        // The crack at the tip: white water bursting, then spray flung on ahead and falling.
        const tx = x0 + L * out;
        const crack = swell(k, 0.26, 0.6);
        if (crack > 0) {
          puff(ctx, FOAM, tx, cy, 14 + 30 * crack, 601 + Math.floor(k * 4), { lobes: 6, holes: k > 0.45 ? 0.5 : 0 });
          sparkle(ctx, FOAM, tx + 24, cy - 30, 6 + 14 * crack, k * 3);
        }
        spray(ctx, tx - 20, cy, -0.25, 1.6, 9, 120, win(k, 0.3, 1), 605);
        // Droplets peeling off along its length as it whips through the air.
        for (let j = 0; j < 4; j++) spray(ctx, x0 + L * out * (0.25 + j * 0.18), cy, -Math.PI / 2 + (j % 2 ? 0.4 : -0.4), 1, 2, 60, win(k, 0.12 + j * 0.05, 0.6 + j * 0.05), 615 + j);
        spray(ctx, x0 + L * 0.5, cy, -Math.PI / 2, 2.6, 10, 90, win(k, 0.42, 1), 611);
        if (k > 0.6) sparkle(ctx, TIDEP, x0 + L * 0.7, cy - 40 + k * 30, 9 * (1 - win(k, 0.6, 1)), k * 4);
      },
    };
  })();

  // Her rolling wave in flight (loops; it rolls along the floor toward +x): a curl of water tipping
  // forward, foam churning on its lip and foot, spray streaming off the crest, a wake behind it.
  E.tmwave = (() => {
    const x = 160;
    const y = 200;
    const n = 24;
    return {
      w: 300, h: 230, n, fps: 48, px: x, py: y, loop: true,
      draw(ctx, i) {
        const ph = i / n;
        // The wake: streaks of white water peeling back, scrolling with the loop.
        for (let j = 0; j < 4; j++) {
          const u = (ph + j / 4) % 1;
          const lx = x - 80 - u * 90;
          speedLine(ctx, FOAM, lx - 40, y - 12 - j * 18, lx + 20, y - 16 - j * 22, 3 * (1 - u * 0.6));
        }
        for (let j = 0; j < 2; j++) {
          const u = (ph + j / 2) % 1;
          puff(ctx, FOAM, x - 80 - u * 70, y - 6, 14 * (1 - u * 0.6), 621 + j, { lobes: 3, holes: u > 0.6 ? 0.4 : 0 });
        }
        waveCurl(ctx, x, y, 175, 155, ph, 623);
        bubble(ctx, x - 44 + Math.sin(ph * TAU) * 6, y - 64 - Math.sin(ph * TAU * 2) * 4, 9, Math.sin(ph * TAU));
        bubble(ctx, x - 12, y - 110 + Math.cos(ph * TAU) * 5, 6, Math.cos(ph * TAU));
      },
    };
  })();
  // The great curling wave (her finisher's): drawn big for the line it crashes down.
  E.tmwavebig = grown(E.tmwave, 1.5);

  // A bubble in flight (loops): wobbling as it floats, its glint sliding, two little ones trailing.
  E.tmbubble = (() => {
    const c = 70;
    const n = 24;
    return {
      w: 140, h: 120, n, fps: 32, px: c + 20, py: c - 10, loop: true,
      draw(ctx, i) {
        const t = (i / n) * TAU;
        bubble(ctx, c + 20, c - 10 + Math.sin(t) * 3, 30, Math.sin(t * 2));
        bubble(ctx, c - 26 + Math.cos(t) * 2, c + 10 - Math.sin(t + 1) * 3, 11, Math.sin(t * 2 + 1));
        bubble(ctx, c - 46, c - 6 + Math.sin(t + 2) * 3, 7, Math.sin(t * 2 + 2));
      },
    };
  })();

  // Her mark on a monster: water bursts round it, a ring of water spreading out as droplets fly off
  // in arcs and bubbles float up and pop, then a sparkle.
  E.tmhit = (() => {
    const c = 120;
    const n = 24;
    return {
      w: 240, h: 240, n, fps: 48, px: c, py: c,
      draw(ctx, i) {
        const k = i / (n - 1);
        const burst = swell(k, 0, 0.42);
        if (burst > 0) puff(ctx, FOAM, c, c, 18 + 30 * burst, 631 + Math.floor(k * 3), { lobes: 6, holes: k > 0.3 ? 0.5 : 0 });
        const ring = smooth(win(k, 0.05, 0.7));
        if (ring > 0 && ring < 1) celRing(ctx, TIDEP, c, c, 30 + 60 * ring, 16 * (1 - ring) + 3, { broken: ring > 0.5 ? (ring - 0.5) * 1.6 : 0, seed: 632 });
        if (k < 0.4) sparkle(ctx, FOAM, c + 34, c - 32, 16 * swell(k, 0, 0.4), 0.4);
        spray(ctx, c, c, -Math.PI / 2, 4.6, 12, 100, win(k, 0.08, 1), 633);
        const R = rng(634);
        for (let j = 0; j < 4; j++) {
          const born = 0.15 + R() * 0.2;
          const u = win(k, born, born + 0.55);
          if (u > 0 && u < 1) bubble(ctx, c + (R() - 0.5) * 110, c - 10 - u * 70, (7 + R() * 6) * (1 - u * 0.4), Math.sin(u * 8 + j));
          else if (u >= 1 && k < born + 0.7) sparkle(ctx, FOAM, c + (R() - 0.5) * 110, c - 80, 8, j);
        }
        if (k > 0.55 && k < 0.9) sparkle(ctx, TMCORAL, c - 36, c - 40, 10 * swell(k, 0.55, 0.9), k * 2);
      },
    };
  })();

  // A splash thrown up off the floor: a sheet of water and a crown of fingers rising round where it
  // struck, tipped with drops that fly free on their own arcs, a ring spreading out on the floor,
  // then it all falls back. Its foot sits on the floor at `py`; about 70 px tall in game.
  E.tmsplash = (() => {
    const c = 150;
    const gy = 260;
    const n = 26;
    return {
      w: 300, h: 280, n, fps: 26, px: c, py: gy,
      draw(ctx, i) {
        const k = i / (n - 1);
        // How far up the crown is: shoots up fast, hangs, sinks back.
        const up = k < 0.25 ? smooth(k / 0.25) : 1 - smooth(win(k, 0.35, 0.85));
        const ring = smooth(win(k, 0, 0.9));
        ripple(ctx, c, gy, 40 + 110 * ring, 14 * (1 - ring) + 4, 0.3, ring > 0.6 ? 0.5 : 0, 641, 1 - win(k, 0.7, 1));
        if (up > 0.02) {
          // One body of water: a crown rising out of the floor, its rim drawn up into fingers that
          // curve outward, all one shape with one outline (never a stack of separate blades).
          const R = rng(644);
          const F = 7;
          const rimY = gy - 44 * up;
          const tips = [];
          for (let j = 0; j < F; j++) {
            const off = (j - (F - 1) / 2) / ((F - 1) / 2);
            const len = 100 * up * (1 - Math.abs(off) * 0.4) * (0.85 + R() * 0.3);
            const bx = c + off * 62;
            const lean = off * 58 * up;
            const sway = Math.sin(k * 9 + j * 1.3) * 4 * up;
            tips.push({ bx, off, len, lean, sway, half: 13 + 4 * (1 - Math.abs(off)) });
          }
          const edge = [[c - 86, gy]];
          // The crown's outer wall flares from the floor up to the first finger.
          edge.push([c - 80 - 8 * up, gy - 18 * up], [tips[0].bx - tips[0].half - 4, rimY]);
          tips.forEach((f, j) => {
            const fx = (u) => f.bx + f.lean * u * u + f.sway * u;
            const fy = (u) => rimY - f.len * u;
            // Up the left side of the finger, round its rounded tip, down its right side.
            for (let q = 0; q <= 6; q++) {
              const u = q / 6;
              edge.push([fx(u) - f.half * (1 - u * 0.82), fy(u)]);
            }
            edge.push([fx(1), fy(1) - 5]);
            for (let q = 6; q >= 0; q--) {
              const u = q / 6;
              edge.push([fx(u) + f.half * (1 - u * 0.82), fy(u)]);
            }
            // The dip of the rim between this finger and the next.
            if (j < F - 1) {
              const nx = (f.bx + tips[j + 1].bx) / 2;
              edge.push([nx, rimY + 10 * up + Math.sin(k * 7 + j) * 3]);
            }
          });
          edge.push([tips[F - 1].bx + tips[F - 1].half + 4, rimY], [c + 80 + 8 * up, gy - 18 * up], [c + 86, gy]);
          water(ctx, edge, { ph: k * 2, inset: 0.14, ripple: 0.6 });
          // Light running up each finger, and the drop breaking free off its tip.
          ctx.save();
          ctx.lineCap = 'round';
          tips.forEach((f, j) => {
            if (Math.abs(f.off) > 0.7) return;
            ctx.beginPath();
            for (let q = 1; q <= 5; q++) {
              const u = q / 6;
              const px = f.bx + f.lean * u * u + f.sway * u - f.half * 0.3;
              const py = rimY - f.len * u;
              q === 1 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
            }
            ctx.strokeStyle = TIDEP[1];
            ctx.lineWidth = 5;
            ctx.stroke();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
          });
          ctx.restore();
          tips.forEach((f, j) => {
            const tx = f.bx + f.lean + f.sway;
            const ty = rimY - f.len;
            // (Flown clear of the tip, never sat on it.)
            const fly = win(k, 0.08, 0.34);
            if (fly > 0 && fly < 1) drop(ctx, FOAM, tx + f.off * 10 * fly, ty - 16 - 36 * fly, -Math.PI / 2 + f.off * 0.5, 4 + 2 * up);
          });
          // White water churning in the middle of the crown.
          for (const dx of [-34, 0, 34]) puff(ctx, FOAM, c + dx, gy - 6, (5 + 9 * up) * (dx ? 0.8 : 1), 642 + dx + Math.floor(k * 3), { lobes: 4, holes: k > 0.5 ? 0.4 : 0 });
        }
        // The drops off the fingertips fly free on their own arcs and fall.
        spray(ctx, c, gy - 140, -Math.PI / 2, 2.6, 12, 150, win(k, 0.2, 1), 643, { g: 1.6 });
        if (k > 0.5 && k < 0.85) sparkle(ctx, FOAM, c + 54, gy - 100, 12 * swell(k, 0.5, 0.85), k * 3);
      },
    };
  })();
  E.tmsplashbig = grown(E.tmsplash, 1.6);

  // A geyser bursting up out of the floor under them (about 130 px tall in game): the floor
  // trembles and bubbles, a jet shoots up and plumes white at its head, holds roaring, then sinks
  // back as the water rains down round it.
  E.tmgeyser = (() => {
    const c = 140;
    const gy = 450;
    const n = 28;
    return {
      w: 280, h: 480, n, fps: 22, px: c, py: gy,
      draw(ctx, i) {
        const k = i / (n - 1);
        const up = k < 0.1 ? 0 : k < 0.28 ? smooth((k - 0.1) / 0.18) : 1 - smooth(win(k, 0.55, 0.92));
        const ring = smooth(win(k, 0, 1));
        ripple(ctx, c, gy, 50 + 50 * ring, 14, 0.3, k > 0.7 ? 0.5 : 0, 651, 1 - win(k, 0.8, 1));
        if (k < 0.12) for (let j = 0; j < 3; j++) bubble(ctx, c - 30 + j * 30, gy - 8 - k * 120, 6, j + k * 9);
        if (up > 0.02) {
          const h = 400 * up;
          const top = gy - h;
          const wob = Math.sin(k * 30) * 7;
          const jet = [[c - 36, gy], [c - 28 + wob * 0.5, gy - h * 0.5], [c - 22 + wob, top + 44], [c + 22 + wob, top + 44], [c + 28 + wob * 0.5, gy - h * 0.5], [c + 36, gy]];
          water(ctx, jet, { ph: k * 3, inset: 0.3, lit: { w: 9, pts: [[c - 12, gy - 10], [c - 10 + wob * 0.6, gy - h * 0.5], [c - 8 + wob, top + 50]] } });
          // Bands of light swirling up the column, round and round.
          current(ctx, (u, j) => {
            const yy = gy - h * u;
            return [c + wob * u + Math.sin(u * 9 + j * 2.1 - k * 30) * 20, yy];
          }, 2, k * 3, 2.6, 0.35);
          // Water racing up inside it: streaks and bubbles rising.
          for (let j = 0; j < 4; j++) {
            const u = (k * 3 + j / 4) % 1;
            bubble(ctx, c + wob * u + (j % 2 ? 12 : -12), gy - h * u, 6 + (j % 2) * 2, j + k * 6);
          }
          for (let j = 0; j < 3; j++) puff(ctx, FOAM, c + wob + (j - 1) * 22 * up, top + 30 - Math.sin(k * 20 + j) * 6, 26 + 18 * up, 652 + j, { lobes: 5, holes: k > 0.6 ? 0.4 : 0 });
          for (const sd of [-1, 1]) claws(ctx, c + wob + sd * 34 * up, top + 22, 34 * up, sd < 0 ? Math.PI + 0.5 : -0.5, 3, k * 3, 657 + sd);
          puff(ctx, FOAM, c, gy - 12, 34, 655 + Math.floor(k * 4), { lobes: 4 });
        }
        spray(ctx, c, gy - 380, -Math.PI / 2, 3.8, 18, 170, win(k, 0.3, 1), 656, { g: 1.5 });
        if (k > 0.3 && k < 0.6) sparkle(ctx, FOAM, c + 54, gy - 330, 14 * swell(k, 0.3, 0.6), k * 4);
      },
    };
  })();

  // A whirlpool round her (drawn flat at her feet, out to the reach it pulls from: 104 px each side):
  // rings of water turning inward, spiral arms sweeping round, spray and bubbles flung off the rim.
  E.tmwhirlbig = (() => {
    const c = 330;
    const gy = 160;
    const n = 30;
    return {
      w: 660, h: 300, n, fps: 22, px: c, py: gy,
      draw(ctx, i) {
        const k = i / (n - 1);
        const fade = 1 - win(k, 0.75, 1);
        const grow = smooth(win(k, 0, 0.3));
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.translate(c, gy);
        ctx.scale(1, 0.34);
        for (let j = 0; j < 3; j++) {
          const r = (300 - j * 80) * grow;
          const a0 = -k * TAU * (1.2 + j * 0.4) + j * 1.4;
          if (r > 50) {
            celCrescent(ctx, j === 1 ? FOAM : TIDEP, 0, 0, r, a0, a0 + 2.6, 46 - j * 8, { seed: 661 + j, inkW: 4 });
            celCrescent(ctx, j === 1 ? TIDEP : FOAM, 0, 0, r * 0.92, a0 + Math.PI, a0 + Math.PI + 2.2, 34 - j * 6, { seed: 664 + j, inkW: 4 });
          }
        }
        ctx.restore();
        ctx.save();
        ctx.globalAlpha = fade;
        for (let j = 0; j < 8; j++) {
          const a = (j / 8) * TAU - k * TAU * 1.4;
          bubble(ctx, c + Math.cos(a) * 265 * grow, gy + Math.sin(a) * 85 - 20, 9 - (j % 2) * 3, Math.sin(k * 10 + j));
        }
        for (const sd of [-1, 1]) spray(ctx, c + sd * 270, gy - 10, -Math.PI / 2 + sd * 0.6, 1.4, 7, 110, win(k, 0.2, 0.95), 667 + sd);
        ctx.restore();
      },
    };
  })();

  // A waterfall poured down from the staff in the air onto whatever is below: a column of water
  // falling, streaks racing down it, white water churning where it meets the floor, then it thins
  // and stops. Its foot sits on the floor at `py`; drawn about 110 px tall in game.
  E.tmfall = (() => {
    const c = 130;
    const gy = 390;
    const n = 26;
    return {
      w: 260, h: 410, n, fps: 26, px: c, py: gy,
      draw(ctx, i) {
        const k = i / (n - 1);
        const reach = smooth(win(k, 0, 0.25));
        const thin = 1 - smooth(win(k, 0.6, 0.95));
        const top = gy - 340 + 340 * smooth(win(k, 0.65, 1)) * 0.6;
        const bottom = gy - 340 + 340 * reach;
        if (thin > 0.03 && bottom > top) {
          const w0 = 30 * thin;
          const w1 = 46 * thin;
          const col = [[c - w0, top], [c + w0, top], [c + w1 + Math.sin(k * 20) * 3, bottom], [c - w1, bottom]];
          water(ctx, col, { ph: k * 3, inset: 0.35 });
          for (let j = 0; j < 4; j++) {
            const sx = c - w0 * 0.6 + j * w0 * 0.4;
            const off = ((k * 3 + j / 4) % 1) * (bottom - top);
            fill(ctx, [[sx - 3, top + off], [sx + 3, top + off], [sx + 4, Math.min(bottom, top + off + 90)], [sx - 4, Math.min(bottom, top + off + 90)]], TIDEP[1]);
          }
        }
        const hitK = win(k, 0.2, 1);
        if (hitK > 0) {
          ripple(ctx, c, gy, 50 + 90 * smooth(hitK), 12, 0.3, hitK > 0.6 ? 0.5 : 0, 671, 1 - win(k, 0.8, 1));
          puff(ctx, FOAM, c, gy - 14, (30 + 16 * swell(hitK, 0, 0.8)) * (thin * 0.7 + 0.3), 672 + Math.floor(k * 3), { lobes: 6, holes: k > 0.7 ? 0.4 : 0 });
          spray(ctx, c, gy - 20, -Math.PI / 2, 3.4, 12, 130, hitK, 673, { g: 1.4 });
        }
      },
    };
  })();
  E.tmfallbig = grown(E.tmfall, 1.4);

  // Tide Pool (loops, flat on the floor round where she planted the staff, about 120 px across): a
  // pool of clear water, ripples spreading through it one after another, bubbles welling up and
  // popping, and the odd sparkle on its surface.
  E.tmpool = (() => {
    const c = 190;
    const gy = 70;
    const n = 40;
    return {
      w: 380, h: 140, n, fps: 30, px: c, py: gy, loop: true,
      draw(ctx, i) {
        const ph = i / n;
        ctx.save();
        ctx.translate(c, gy);
        ctx.scale(1, 0.3);
        // Its rim laps in and out, small waves running round it.
        const rim = (r) => rippled(Array.from({ length: 48 }, (_, q) => [Math.cos((q / 48) * TAU) * r, Math.sin((q / 48) * TAU) * r]), ph, 4);
        path(ctx, rim(175));
        ctx.fillStyle = TIDEP[1];
        ctx.globalAlpha = 0.6;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.lineWidth = 9;
        ctx.strokeStyle = TIDEP[4];
        ctx.stroke();
        ctx.lineWidth = 6;
        ctx.strokeStyle = TIDEP[2];
        path(ctx, rim(166));
        ctx.stroke();
        // Caustics: a net of light wavering over the bottom of the pool, drifting with the loop.
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(0, 0, 160, 160, 0, 0, TAU);
        ctx.clip();
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#ffffff';
        ctx.globalAlpha = 0.75;
        for (let j = -4; j <= 4; j++) {
          ctx.beginPath();
          for (let s = 0; s <= 30; s++) {
            const xx = -170 + s * (340 / 30);
            const yy = j * 38 + Math.sin(xx * 0.05 + ph * TAU + j) * 14 + Math.sin(xx * 0.11 - ph * TAU * 2) * 6;
            s ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy);
          }
          ctx.stroke();
        }
        ctx.restore();
        for (let j = 0; j < 3; j++) {
          const u = (ph + j / 3) % 1;
          ctx.globalAlpha = 1 - u;
          celRing(ctx, FOAM, 0, 0, 30 + u * 135, 10, { seed: 681 + j });
        }
        ctx.restore();
        const R = rng(684);
        for (let j = 0; j < 6; j++) {
          const u = (ph + j / 6) % 1;
          const bx = c + (R() - 0.5) * 260;
          if (u < 0.85) bubble(ctx, bx, gy - u * 60, (5 + R() * 5) * (1 - u * 0.4), Math.sin(u * 8 + j));
          else sparkle(ctx, FOAM, bx, gy - 54, 8 * swell(u, 0.85, 1), j);
        }
      },
    };
  })();

  // Bubble Shield closing round her (and each party member it reaches): little bubbles drift in
  // from all round, merge as the big bubble swells up round her, it wobbles and settles, a glint
  // sliding over it.
  E.tmshieldfx = (() => {
    const c = 140;
    const cy = 130;
    const n = 28;
    return {
      w: 280, h: 280, n, fps: 22, px: c, py: 240,
      draw(ctx, i) {
        const k = i / (n - 1);
        const gather = smooth(win(k, 0, 0.35));
        if (k < 0.4) for (let j = 0; j < 6; j++) {
          const a = (j / 6) * TAU + k * 3;
          const d = 125 * (1 - gather) + 20;
          bubble(ctx, c + Math.cos(a) * d, cy + Math.sin(a) * d * 0.9, 9 + 4 * gather, Math.sin(k * 12 + j));
        }
        const grow = smooth(win(k, 0.28, 0.5));
        if (grow > 0) {
          const wob = Math.sin(win(k, 0.45, 1) * Math.PI * 4) * (1 - win(k, 0.45, 1));
          bubble(ctx, c, cy, 104 * grow, wob);
          // A sheen of light turning slowly over its face, and little bubbles circling it.
          if (grow > 0.6) {
            ctx.save();
            ctx.lineCap = 'round';
            const a0 = k * 5;
            for (const [rr, col, lw] of [[0.86, TMCORAL[1], 6], [0.8, '#ffffff', 3]]) {
              ctx.beginPath();
              ctx.ellipse(c, cy, 104 * grow * rr, 104 * grow * rr * 0.96, 0, a0, a0 + 1.1);
              ctx.strokeStyle = col;
              ctx.lineWidth = lw;
              ctx.stroke();
            }
            ctx.restore();
            for (let j = 0; j < 4; j++) {
              const a = k * 6 + (j / 4) * TAU;
              bubble(ctx, c + Math.cos(a) * 118 * grow, cy + Math.sin(a) * 40 * grow + 40, 6 + (j % 2) * 2, Math.sin(k * 9 + j));
            }
          }
          if (k > 0.45) sparkle(ctx, FOAM, c - 50 + 100 * win(k, 0.45, 1), cy - 70 + Math.sin(win(k, 0.45, 1) * Math.PI) * -12, 12 * swell(k, 0.45, 1), k * 3);
        }
        spray(ctx, c, cy, 0, TAU, 10, 130, win(k, 0.42, 0.9), 691, { g: 0.6 });
      },
    };
  })();

  // The Great Wave (her finisher): the great curl drawn far bigger, for the wave that sweeps the
  // screen.
  E.tmgreatbig = grown(E.tmwave, 2.4);

  // ---------- The Maelstrom (docs/design/maelstrom.md) ----------
  // The deep sea: midnight water lit from inside, glowing aqua plankton, a magenta accent. Her
  // shapes, hers alone: spears of pressurised water, spinning vortices and funnels, beams, spirals,
  // and glowing motes. Her water is drawn with the same living-water kit as the Tide Mage's
  // (rippling edges, currents), in the deep palette (`deepPal` swaps it in while she draws).
  const DEEPW = ['#ffffff', '#5fe8e0', '#1f4fa0', '#14306e', '#070d33'];
  const DEEPGLOW = ['#ffffff', '#e6fffb', '#8ff3e8', '#36b8c8', '#0e3e6a'];
  const DEEPPINK = ['#ffffff', '#ffd6f4', '#ff7ad8', '#d23aa8', '#5a1050'];
  function deepPal(fn) {
    const [w, f] = [TIDEP, FOAM];
    TIDEP = DEEPW;
    FOAM = DEEPGLOW;
    try {
      fn();
    } finally {
      TIDEP = w;
      FOAM = f;
    }
  }
  const deep = (e) => ({ ...e, draw: (ctx, i) => deepPal(() => e.draw(ctx, i)) });
  // A glowing mote of the deep: a soft round light with a white heart.
  function mote(ctx, x, y, r, pal = DEEPGLOW) {
    if (r <= 0.5) return;
    ctx.beginPath();
    ctx.arc(x, y, r * 1.6, 0, TAU);
    ctx.fillStyle = pal[2];
    ctx.globalAlpha *= 0.35;
    ctx.fill();
    ctx.globalAlpha /= 0.35;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fillStyle = pal[1];
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, r * 0.45, 0, TAU);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }
  // Motes drifting: n of them round (x, y) in a box w x h, each on its own slow loop with `ph`.
  function motes(ctx, x, y, w, h, n, ph, seed, r = 4) {
    const R = rng(seed);
    for (let j = 0; j < n; j++) {
      const ox = (R() - 0.5) * w;
      const oy = (R() - 0.5) * h;
      const sp = 0.5 + R();
      const a = (ph * sp + R()) * TAU;
      mote(ctx, x + ox + Math.cos(a) * 6, y + oy + Math.sin(a) * 6, r * (0.6 + R() * 0.6) * (0.75 + 0.25 * Math.sin(a * 2)), j % 5 === 0 ? DEEPPINK : DEEPGLOW);
    }
  }
  // A spiral arm of water round (cx, cy) from radius r0 to r1, turned by `rot`, `th` thick.
  function spiralArm(ctx, cx, cy, r0, r1, rot, turns, th, ph) {
    const out = [];
    const inn = [];
    const n = 28;
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const a = rot + u * turns * TAU;
      const r = lerp(r0, r1, u);
      const w = th * Math.sin(Math.PI * Math.min(1, u * 1.2)) + 1;
      out.push([cx + Math.cos(a) * (r + w / 2), cy + Math.sin(a) * (r + w / 2)]);
      inn.push([cx + Math.cos(a) * (r - w / 2), cy + Math.sin(a) * (r - w / 2)]);
    }
    water(ctx, out.concat(inn.reverse()), { ph, inset: 0.25, ripple: 0.4 });
  }

  // Her spear in flight (loops; flies toward +x): a long tapered spear of pressurised water, a
  // current spiralling round it, rings of pressure peeling off its head, glowing motes and
  // droplets trailing behind.
  E.msspear = deep((() => {
    const n = 24;
    const x0 = 30;
    const L = 250;
    const cy = 60;
    return {
      w: L + 70, h: 120, n, fps: 48, px: x0 + L * 0.75, py: cy, loop: true,
      draw(ctx, i) {
        const ph = i / n;
        const top = [];
        const bot = [];
        for (let j = 0; j <= 20; j++) {
          const u = j / 20;
          const wdt = 32 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 0.9 + 0.08)), 0.6) * (u > 0.85 ? (1 - u) / 0.15 + 0.1 : 1);
          top.push([x0 + u * L, cy - wdt]);
          bot.push([x0 + u * L, cy + wdt * 0.85]);
        }
        // Its wake: streaks of glowing water.
        for (let j = 0; j < 3; j++) {
          const u = (ph * 2 + j / 3) % 1;
          speedLine(ctx, DEEPGLOW, x0 - 20 - u * 60, cy - 12 + j * 12, x0 + 40 - u * 40, cy - 10 + j * 10, 3 * (1 - u));
        }
        water(ctx, top.concat(bot.reverse()), { ph: ph * 2, inset: 0.3, lit: { w: 6, pts: top.slice(3, 18).map(([px, py]) => [px, py + 6]) } });
        current(ctx, (u, j) => [x0 + u * L * 0.95, cy + Math.sin(u * 14 + j * Math.PI) * 14 * Math.sin(Math.PI * u)], 2, ph * 2, 3, 0.5);
        // Its white-hot core: the pressure, brightest toward the head.
        fill(ctx, [[x0 + L * 0.2, cy - 2], [x0 + L * 0.95, cy - 4], [x0 + L * 0.95, cy + 4], [x0 + L * 0.2, cy + 2]], DEEPGLOW[1]);
        fill(ctx, [[x0 + L * 0.45, cy - 1], [x0 + L * 0.95, cy - 2], [x0 + L * 0.95, cy + 2], [x0 + L * 0.45, cy + 1]], '#ffffff');
        // Rings of pressure peeling off the head and widening behind it.
        for (let j = 0; j < 3; j++) {
          const u = (ph + j / 3) % 1;
          ctx.save();
          ctx.globalAlpha = 1 - u;
          ctx.translate(x0 + L * (0.92 - u * 0.5), cy);
          ctx.scale(0.35, 1);
          celRing(ctx, DEEPGLOW, 0, 0, 14 + u * 22, 6, { seed: 701 + j });
          ctx.restore();
        }
        mote(ctx, x0 + L * 0.97, cy - 2, 14 + Math.sin(ph * TAU * 2) * 2);
        motes(ctx, x0 + 40, cy, 80, 36, 6, ph * 2, 703, 3.5);
      },
    };
  })());
  E.msspearbig = grown(E.msspear, 1.5);

  // Her vortex bolt in flight (loops): a knot of black water spinning on itself, spiral arms
  // winding into a glowing heart, motes caught in it.
  E.msbolt = deep((() => {
    const n = 24;
    const c = 80;
    return {
      w: 160, h: 160, n, fps: 40, px: c, py: c, loop: true,
      draw(ctx, i) {
        const ph = i / n;
        const rot = -ph * TAU;
        for (let j = 0; j < 3; j++) spiralArm(ctx, c, c, 8, 54, rot + (j / 3) * TAU, 0.7, 16, ph + j / 3);
        mote(ctx, c, c, 14 + Math.sin(ph * TAU * 2) * 2);
        for (let j = 0; j < 6; j++) {
          const a = rot * 1.4 + (j / 6) * TAU;
          mote(ctx, c + Math.cos(a) * 60, c + Math.sin(a) * 60, 3.5, j % 3 ? DEEPGLOW : DEEPPINK);
        }
      },
    };
  })());

  // Her mark on a monster: a burst of dark water and a ring of glowing light, a little spiral
  // closing in on itself, and motes flying off on their arcs.
  E.mshit = deep((() => {
    const n = 24;
    const c = 120;
    return {
      w: 240, h: 240, n, fps: 48, px: c, py: c,
      draw(ctx, i) {
        const k = i / (n - 1);
        const burst = swell(k, 0, 0.4);
        if (burst > 0) for (let j = 0; j < 3; j++) spiralArm(ctx, c, c, 10, 30 + 40 * burst, -k * 8 + (j / 3) * TAU, 0.45, 14 * burst + 2, k);
        const ring = smooth(win(k, 0.05, 0.7));
        if (ring > 0 && ring < 1) celRing(ctx, DEEPGLOW, c, c, 26 + 70 * ring, 14 * (1 - ring) + 3, { broken: ring > 0.5 ? (ring - 0.5) * 1.6 : 0, seed: 711 });
        if (k < 0.45) mote(ctx, c, c, 18 * swell(k, 0, 0.45));
        const R = rng(712);
        for (let j = 0; j < 10; j++) {
          const a = R() * TAU;
          const v = win(k, 0.05 + R() * 0.1, 1);
          if (v <= 0 || v >= 1) continue;
          const d = 40 + 80 * v;
          mote(ctx, c + Math.cos(a) * d, c + Math.sin(a) * d + 40 * v * v, 5 * (1 - v), j % 4 ? DEEPGLOW : DEEPPINK);
        }
      },
    };
  })());

  // A vortex funnel (her finisher's, Undertow's, the spiral; drawn standing on the floor at `py`,
  // about 120 px tall): it rises out of the floor, spinning, bands of black water winding up round a
  // glowing eye, motes and droplets flung off its rim, and collapses back into a splash.
  E.msvortex = deep((() => {
    const n = 30;
    const c = 150;
    const gy = 380;
    return {
      w: 300, h: 400, n, fps: 30, px: c, py: gy,
      draw(ctx, i) {
        const k = i / (n - 1);
        const grow = smooth(win(k, 0, 0.25)) * (1 - smooth(win(k, 0.8, 1)));
        const spin = k * 5;
        ripple(ctx, c, gy, 60 + 70 * smooth(k), 14, 0.3, k > 0.7 ? 0.5 : 0, 721, 1 - win(k, 0.85, 1));
        if (grow > 0.02) {
          const H = 340 * grow;
          // The funnel: rings of water stacked up it, wider toward the top, each turning.
          for (let j = 0; j < 7; j++) {
            const u = j / 6;
            const y = gy - u * H;
            const r = (24 + u * 90) * grow;
            ctx.save();
            ctx.translate(c + Math.sin(spin * 0.6 + u * 3) * 8 * u, y);
            ctx.scale(1, 0.28);
            const a0 = -spin * TAU * (1 + u * 0.3) + j;
            celCrescent(ctx, j % 2 ? DEEPGLOW : DEEPW, 0, 0, r, a0, a0 + 3.6, 26 + u * 8, { seed: 722 + j, inkW: 3 });
            celCrescent(ctx, j % 2 ? DEEPW : DEEPGLOW, 0, 0, r * 0.9, a0 + Math.PI, a0 + Math.PI + 2.6, 18 + u * 6, { seed: 729 + j, inkW: 3 });
            ctx.restore();
          }
          mote(ctx, c, gy - H * 0.5, 12 * grow + Math.sin(spin * TAU) * 2);
          motes(ctx, c, gy - H * 0.5, 220 * grow, H, 10, k * 3, 731, 4);
        }
        spray(ctx, c, gy - 300 * grow, -Math.PI / 2, 4, 12, 140, win(k, 0.3, 1), 733, { g: 1.4 });
        if (k > 0.78) puff(ctx, DEEPGLOW, c, gy - 10, 36 * swell(k, 0.78, 1), 735, { lobes: 5, holes: 0.3 });
      },
    };
  })());
  E.msvortexsmall = grown(E.msvortex, 0.42);

  // A high-pressure beam (her jet, her beam finisher, Hydro Cannon): a long rippling bar of water
  // tearing out level from the staff, a white-hot core, rings of pressure racing along it, motes
  // stripped off its edges, and a burst at its far end; it swells out, holds, and thins away.
  E.msbeam = deep((() => {
    const n = 22;
    const x0 = 20;
    const L = 760;
    const cy = 70;
    return {
      w: L + 80, h: 140, n, fps: 40, px: x0, py: cy,
      draw(ctx, i) {
        const k = i / (n - 1);
        const out = smooth(win(k, 0, 0.18));
        const thick = smooth(win(k, 0, 0.25)) * (1 - smooth(win(k, 0.65, 1)));
        if (thick <= 0.02) return;
        const end = x0 + L * out;
        const T = 30 * thick;
        const top = [];
        const bot = [];
        for (let j = 0; j <= 30; j++) {
          const u = j / 30;
          const x = lerp(x0, end, u);
          const w = T * (0.7 + 0.3 * Math.sin(u * 20 - k * 30)) * (u < 0.05 ? u / 0.05 : 1);
          top.push([x, cy - w]);
          bot.push([x, cy + w]);
        }
        water(ctx, top.concat(bot.reverse()), { ph: k * 3, inset: 0.35 });
        fill(ctx, [[x0 + 10, cy - T * 0.18], [end, cy - T * 0.12], [end, cy + T * 0.12], [x0 + 10, cy + T * 0.18]], '#ffffff');
        for (let j = 0; j < 5; j++) {
          const u = (k * 3 + j / 5) % 1;
          ctx.save();
          ctx.translate(lerp(x0, end, u), cy);
          ctx.scale(0.3, 1);
          celRing(ctx, DEEPGLOW, 0, 0, T * 1.5 + 6, 6, { seed: 741 + j });
          ctx.restore();
        }
        motes(ctx, (x0 + end) / 2, cy, end - x0, T * 3, 12, k * 3, 743, 3.5);
        puff(ctx, DEEPGLOW, end, cy, 14 + 22 * thick, 745 + Math.floor(k * 4), { lobes: 5, holes: k > 0.6 ? 0.4 : 0 });
        mote(ctx, x0 + 10, cy, 10 * thick);
      },
    };
  })());

  // Black water slammed down (her slam finisher and her dive): a column of dark water falls from
  // above and hits the floor in a crown of black water edged with glowing foam, a ring racing out,
  // motes flung up. Its foot sits on the floor at `py`; about 130 px tall in game.
  E.msslam = deep((() => {
    const n = 26;
    const c = 160;
    const gy = 400;
    return {
      w: 320, h: 420, n, fps: 30, px: c, py: gy,
      draw(ctx, i) {
        const k = i / (n - 1);
        const fall = smooth(win(k, 0, 0.3));
        const thin = 1 - smooth(win(k, 0.45, 0.8));
        if (thin > 0.03) {
          const top = gy - 380;
          const bottom = top + 380 * fall;
          const w0 = 26 * thin;
          const w1 = 44 * thin;
          water(ctx, [[c - w0, top], [c + w0, top], [c + w1, bottom], [c - w1, bottom]], { ph: k * 3, inset: 0.35 });
          current(ctx, (u, j) => [c + (j - 0.5) * w0 * 0.8, lerp(top, bottom, u)], 2, k * 4, 2.6, 0.5);
        }
        const hitK = win(k, 0.25, 1);
        if (hitK > 0) {
          const up = swell(hitK, 0, 0.7);
          ripple(ctx, c, gy, 60 + 110 * smooth(hitK), 14, 0.3, hitK > 0.6 ? 0.5 : 0, 751, 1 - win(k, 0.85, 1));
          if (up > 0.02) {
            const edge = [[c - 96, gy]];
            for (let j = 0; j <= 10; j++) {
              const u = j / 10;
              edge.push([c - 90 + u * 180, gy - 70 * up * (0.5 + 0.5 * Math.sin(u * Math.PI)) - (j % 2) * 26 * up]);
            }
            edge.push([c + 96, gy]);
            water(ctx, edge, { ph: k * 2, inset: 0.2, ripple: 0.6 });
            puff(ctx, DEEPGLOW, c, gy - 10, 12 + 20 * up, 752 + Math.floor(k * 3), { lobes: 5, holes: k > 0.6 ? 0.4 : 0 });
          }
          spray(ctx, c, gy - 40, -Math.PI / 2, 3.2, 14, 150, hitK, 753, { g: 1.4 });
          motes(ctx, c, gy - 80 - 60 * hitK, 200, 80, 8, k * 2, 755, 4 * (1 - hitK * 0.6));
        }
      },
    };
  })());

  // A glowing bubble in flight (loops): a bubble of the deep with a light floating inside it.
  E.msglow = deep((() => {
    const n = 24;
    const c = 70;
    return {
      w: 140, h: 140, n, fps: 32, px: c, py: c, loop: true,
      draw(ctx, i) {
        const t = (i / n) * TAU;
        bubble(ctx, c, c + Math.sin(t) * 3, 30, Math.sin(t * 2));
        mote(ctx, c + Math.cos(t) * 6, c + Math.sin(t * 2) * 5, 9 + Math.sin(t * 2) * 1.5);
        motes(ctx, c, c, 50, 50, 3, i / n, 761, 2.5);
      },
    };
  })());
  // ...and going off: a flash of light, a ring, motes scattering.
  E.msglowpop = deep((() => {
    const n = 20;
    const c = 110;
    return {
      w: 220, h: 220, n, fps: 40, px: c, py: c,
      draw(ctx, i) {
        const k = i / (n - 1);
        if (k < 0.35) mote(ctx, c, c, 30 * swell(k, 0, 0.35));
        const ring = smooth(win(k, 0.05, 0.8));
        if (ring > 0 && ring < 1) celRing(ctx, DEEPGLOW, c, c, 20 + 70 * ring, 12 * (1 - ring) + 3, { broken: ring > 0.5 ? (ring - 0.5) * 1.6 : 0, seed: 771 });
        const R = rng(772);
        for (let j = 0; j < 12; j++) {
          const a = R() * TAU;
          const d = (30 + R() * 60) * smooth(win(k, 0.05, 1));
          mote(ctx, c + Math.cos(a) * d, c + Math.sin(a) * d, 5 * (1 - win(k, 0.4, 1)), j % 4 ? DEEPGLOW : DEEPPINK);
        }
      },
    };
  })());

  // A slashing current (her slash): a crescent of black water tearing round in front of her,
  // rippling, glowing along its leading edge, breaking into motes and droplets.
  E.msslash = deep((() => {
    const n = 20;
    const c = 170;
    const cy = 170;
    return {
      w: 340, h: 300, n, fps: 40, px: c - 110, py: cy + 40,
      draw(ctx, i) {
        const k = i / (n - 1);
        const sweep = smooth(win(k, 0, 0.35));
        const fade = win(k, 0.4, 0.8);
        if (fade < 1) {
          const a0 = -2.4;
          const a1 = lerp(-2.2, 0.9, sweep);
          ctx.save();
          ctx.globalAlpha = 1 - fade;
          water(ctx, crescent(c, cy, 120, a0, a1, 42 * (1 - fade * 0.6), { n: 40 }), { ph: k * 3, inset: 0.2, ripple: 0.6 });
          // Its leading edge glowing as it tears round.
          ctx.lineCap = 'round';
          for (const [lw, col] of [[10, DEEPGLOW[2]], [4, '#ffffff']]) {
            ctx.beginPath();
            ctx.arc(c, cy, 118, a0 + 0.3, a1);
            ctx.strokeStyle = col;
            ctx.lineWidth = lw * (1 - fade);
            ctx.stroke();
          }
          ctx.restore();
          for (let j = 0; j < 5; j++) {
            const a = lerp(a0, a1, 0.3 + j * 0.15);
            mote(ctx, c + Math.cos(a) * 124, cy + Math.sin(a) * 124, 4 + (j % 2) * 2, j === 2 ? DEEPPINK : DEEPGLOW);
          }
        }
        spray(ctx, c + 110, cy + 40, -0.6, 2, 10, 110, win(k, 0.25, 1), 781, { g: 1.2 });
      },
    };
  })());

  // The Maelstrom's skills. Her versions of the Tide Mage's (the same water, drawn from the deep:
  // dark and lit from inside, glowing motes of plankton drifting through it), and her own big ones.
  const withMotes = (e, { x, y, w, h, n, r = 4, seed }) => deep({
    ...e,
    draw(ctx, i) {
      e.draw(ctx, i);
      motes(ctx, x, y, w, h, n, i / e.n, seed, r);
    },
  });
  // Abyss Shell (Bubble Shield): a dark shell closing round them, plankton glowing in its skin.
  E.msshellfx = withMotes(E.tmshieldfx, { x: 140, y: 130, w: 200, h: 200, n: 10, seed: 801 });
  // Glowing Pool (Tide Pool): dark water that glows, plankton drifting in it.
  E.mspool = withMotes(E.tmpool, { x: 190, y: 66, w: 300, h: 40, n: 12, r: 3.5, seed: 803 });
  // Black Wave (Tidal Wave) in flight: a wave of black water, lit from inside.
  E.msblackwave = withMotes(E.tmwavebig, { x: 210, y: 210, w: 300, h: 200, n: 10, r: 5, seed: 805 });
  // Black Tide (Great Wave): the giant wave of the deep.
  E.msblacktidebig = withMotes(E.tmgreatbig, { x: 320, y: 300, w: 560, h: 420, n: 16, r: 8, seed: 807 });
  // Maelstrom (her finisher): the vortex grown into a whirlpool that tears the screen apart.
  E.msmaelstrombig = grown(E.msvortex, 2.6);
  // Hydro Cannon: the beam drawn heavier and longer.
  E.msbeambig = grown(E.msbeam, 1.35);

  // ---------- The Tidecaller (docs/design/tidecaller.md) ----------
  // The moon's tide: seafoam and mint water inked in deep teal, pearl white, pale moon gold. Her
  // shapes, hers alone: pearls, moon crescents, scallop shells, rising bubbles, raindrops and soft
  // rings of light. Her water is the Tide Mage's living water (rippling edges, currents) in her own
  // palette (`moonPal` swaps it in while she draws); her light is soft and warm, never a flash.
  const MOONW = ['#ffffff', '#e4fff4', '#8fe8c8', '#3fb0a0', '#1d5a66'];
  const PEARL = ['#ffffff', '#fffcf2', '#f6eedc', '#d9c7aa', '#7d6a54'];
  const MGOLD = ['#ffffff', '#fff6cc', '#ffe08a', '#e3b04c', '#8a6420'];
  // (Her foam: white touched with mint, never cream.)
  const MFOAM = ['#ffffff', '#f6fffb', '#d8f6ec', '#a8dcd0', '#3f8a86'];
  function moonPal(fn) {
    const [w, f, c] = [TIDEP, FOAM, TMCORAL];
    TIDEP = MOONW;
    FOAM = MFOAM;
    TMCORAL = MGOLD;
    try {
      fn();
    } finally {
      TIDEP = w;
      FOAM = f;
      TMCORAL = c;
    }
  }
  const moonlit = (e) => ({ ...e, draw: (ctx, i) => moonPal(() => e.draw(ctx, i)) });
  // A pearl: inked round, its pearly body, a seafoam sheen on its shadow side and a gold one on its
  // rim, and a white glint. `ph` turns the sheen round it.
  function pearl(ctx, x, y, r, ph = 0) {
    if (r <= 1) return;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r + 2.5, 0, TAU);
    ctx.fillStyle = PEARL[4];
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fillStyle = PEARL[3];
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x - r * 0.12, y - r * 0.12, r * 0.86, 0, TAU);
    ctx.fillStyle = PEARL[2];
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x - r * 0.22, y - r * 0.24, r * 0.6, 0, TAU);
    ctx.fillStyle = PEARL[1];
    ctx.fill();
    const a = ph * TAU;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(x, y, r * 0.78, 0.3 + a * 0.2, 1.5 + a * 0.2);
    ctx.lineWidth = Math.max(1.5, r * 0.16);
    ctx.strokeStyle = MOONW[2];
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, r * 0.8, 1.9 + a * 0.2, 2.5 + a * 0.2);
    ctx.lineWidth = Math.max(1.2, r * 0.1);
    ctx.strokeStyle = MGOLD[2];
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x - r * 0.36, y - r * 0.4, r * 0.26, r * 0.15, -0.7, 0, TAU);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
  }
  // A soft light: a pale glow round a bright heart (her motes, her heals).
  function glim(ctx, x, y, r, pal = MGOLD) {
    if (r <= 0.5) return;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r * 1.8, 0, TAU);
    ctx.fillStyle = pal[2];
    ctx.globalAlpha *= 0.28;
    ctx.fill();
    ctx.restore();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fillStyle = pal[1];
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, r * 0.45, 0, TAU);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }
  // Pearls of light drifting round (x, y) in a w x h box, each on its own slow loop with `ph`.
  function glims(ctx, x, y, w, h, n, ph, seed, r = 4) {
    const R = rng(seed);
    for (let j = 0; j < n; j++) {
      const ox = (R() - 0.5) * w;
      const oy = (R() - 0.5) * h;
      const sp = 0.5 + R();
      const a = (ph * sp + R()) * TAU;
      glim(ctx, x + ox + Math.cos(a) * 6, y + oy + Math.sin(a) * 6, r * (0.6 + R() * 0.6) * (0.75 + 0.25 * Math.sin(a * 2)), j % 3 === 0 ? MOONW : MGOLD);
    }
  }
  // A moon crescent standing upright, its belly toward +x: R tall (half), `th` thick at its middle.
  function moonShape(cx, cy, R, th, n = 28) {
    const A = 1.25;
    const outer = [];
    const inner = [];
    for (let i = 0; i <= n; i++) {
      const t = lerp(-A, A, i / n);
      const w = th * Math.cos((t / A) * (Math.PI / 2));
      outer.push([cx + Math.cos(t) * R, cy + Math.sin(t) * R]);
      inner.push([cx + Math.cos(t) * R - w, cy + Math.sin(t) * R]);
    }
    return outer.concat(inner.reverse());
  }
  // A ring of soft light flat on the floor, in gold (`sy` squashes it into perspective).
  function lightRing(ctx, x, y, r, th, a = 1, sy = 0.3, pal = MGOLD, broken = 0, seed = 1) {
    if (r <= th || a <= 0) return;
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.translate(x, y);
    ctx.scale(1, sy);
    celRing(ctx, pal, 0, 0, r, th, { broken, seed });
    ctx.restore();
  }
  // A column of soft light from y0 down to y1 round x, `w` wide at its widest.
  function lightColumn(ctx, x, y0, y1, w, a = 1) {
    if (a <= 0 || y1 <= y0) return;
    ctx.save();
    for (const [f, col, al] of [[1, MGOLD[2], 0.22], [0.66, MGOLD[1], 0.38], [0.34, '#fffdf0', 0.7], [0.12, '#ffffff', 0.95]]) {
      ctx.globalAlpha = a * al;
      const hw = (w * f) / 2;
      fill(ctx, [[x - hw * 0.6, y0], [x + hw * 0.6, y0], [x + hw, y1], [x - hw, y1]], col);
    }
    ctx.restore();
  }

  // Her pearl in flight (loops; flies toward +x): a pearl of water spinning, a ring of water turning
  // round it, droplets and a glint trailing.
  E.tcpearl = moonlit((() => {
    const n = 24;
    const c = [104, 56];
    return {
      w: 160, h: 112, n, fps: 40, px: c[0], py: c[1], loop: true,
      draw(ctx, i) {
        const ph = i / n;
        for (let j = 0; j < 3; j++) {
          const u = (ph * 2 + j / 3) % 1;
          speedLine(ctx, MOONW, c[0] - 30 - u * 60, c[1] - 8 + j * 8, c[0] - 4 - u * 30, c[1] - 6 + j * 6, 3.4 * (1 - u));
        }
        for (let j = 0; j < 4; j++) {
          const u = (ph + j / 4) % 1;
          drop(ctx, j % 2 ? PEARL : MOONW, c[0] - 26 - u * 64, c[1] + Math.sin((u + j) * 5) * 8, Math.PI, 5 * (1 - u) + 1);
        }
        // The ring of water round it: its far half behind the pearl, its near half in front.
        const tilt = 0.32;
        const ring = (a0, a1) => {
          ctx.save();
          ctx.translate(c[0], c[1]);
          ctx.rotate(-0.5);
          ctx.scale(1, tilt);
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.arc(0, 0, 32, a0, a1);
          ctx.lineWidth = 9;
          ctx.strokeStyle = MOONW[4];
          ctx.stroke();
          ctx.lineWidth = 6;
          ctx.strokeStyle = MOONW[2];
          ctx.stroke();
          ctx.lineWidth = 2.4;
          ctx.strokeStyle = MOONW[1];
          ctx.stroke();
          ctx.restore();
        };
        const rot = ph * TAU * 2;
        ring(Math.PI + rot, TAU + rot);
        pearl(ctx, c[0], c[1], 19, ph);
        ring(rot, Math.PI + rot);
        sparkle(ctx, MGOLD, c[0] + 14, c[1] - 18, 6 + 3 * Math.sin(ph * TAU * 2), ph * TAU);
      },
    };
  })());

  // Her mark on a monster: a pearly splash, a ring of seafoam opening, droplets on their arcs and a
  // little gold crescent turning and fading in the middle.
  E.tchit = moonlit((() => {
    const n = 24;
    const c = 120;
    return {
      w: 240, h: 240, n, fps: 48, px: c, py: c,
      draw(ctx, i) {
        const k = i / (n - 1);
        const ring = smooth(win(k, 0.02, 0.7));
        if (ring > 0 && ring < 1) celRing(ctx, MOONW, c, c, 24 + 70 * ring, 14 * (1 - ring) + 3, { broken: ring > 0.5 ? (ring - 0.5) * 1.6 : 0, seed: 901 });
        spray(ctx, c, c, -Math.PI / 2, 3.6, 12, 90, win(k, 0, 0.9), 902, { pal: PEARL });
        const g = swell(k, 0, 0.5);
        if (g > 0) {
          glim(ctx, c, c, 18 * g, MOONW);
          ctx.save();
          ctx.translate(c, c);
          ctx.rotate(k * 2);
          ctx.globalAlpha = g;
          inked(ctx, moonShape(0, 0, 20, 9), MGOLD[2], MGOLD[4], 3);
          fill(ctx, moonShape(0, 0, 20, 4), MGOLD[1]);
          ctx.restore();
        }
        if (k > 0.2 && k < 0.8) sparkle(ctx, MGOLD, c + 34, c - 30, 10 * swell(k, 0.2, 0.8), k * 4);
      },
    };
  })());

  // Her ribbon (swept out ahead of the staff to its reach: 128 px, 384 art px): a ribbon of water
  // drawn through the air in a long S behind the staff's head, its tail following it out and
  // thinning away, droplets shed off it and glints along it.
  E.tcribbon = moonlit((() => {
    const n = 30;
    const x0 = 20;
    const L = 380;
    const cy = 130;
    const at = (u) => [x0 + u * L, cy + 48 * Math.sin(u * TAU * 0.95 + 0.6) * (0.5 + 0.5 * u) - 30 * u];
    return {
      w: L + 60, h: 260, n, fps: 48, px: x0, py: cy,
      draw(ctx, i) {
        const k = i / (n - 1);
        const head = smooth(win(k, 0, 0.5));
        const tail = smooth(win(k, 0.22, 0.9));
        if (head - tail > 0.02) {
          const top = [];
          const bot = [];
          const m = 40;
          for (let j = 0; j <= m; j++) {
            const u = lerp(tail, head, j / m);
            const [x, y] = at(u);
            const [x2, y2] = at(Math.min(1, u + 0.01));
            const a = Math.atan2(y2 - y, x2 - x);
            const w = 20 * Math.pow(Math.sin(Math.PI * (j / m)), 0.7) * (1 - 0.4 * tail) + 1;
            top.push([x - Math.sin(a) * w, y + Math.cos(a) * w]);
            bot.push([x + Math.sin(a) * w * 0.7, y - Math.cos(a) * w * 0.7]);
          }
          water(ctx, top.concat(bot.reverse()), { ph: k * 2, inset: 0.3, ripple: 0.5 });
          current(ctx, (u) => at(lerp(tail, head, u)), 1, k * 2, 2.4, 0.5);
          const [hx, hy] = at(head);
          glim(ctx, hx, hy, 9 * (1 - tail), PEARL);
          for (let j = 0; j < 3; j++) {
            const u = lerp(tail, head, 0.3 + j * 0.25);
            const [sx, sy] = at(u);
            sparkle(ctx, MGOLD, sx, sy - 18, 7 * swell(k, 0.15 + j * 0.1, 0.7 + j * 0.1), k * 5 + j);
          }
        }
        spray(ctx, at(0.95)[0], at(0.95)[1], -0.4, 1.8, 9, 110, win(k, 0.35, 1), 911, { pal: PEARL });
      },
    };
  })());

  // A pillar of moonlight (on the floor out where it lands, about 140 px tall): a crescent moon
  // fades in high over them, a column of soft light falls from it to the floor, a spring of seafoam
  // water rises inside the light, rings of light open across the floor, and it all breaks up into
  // falling drops and rising pearls of light.
  E.tcpillar = moonlit((() => {
    const n = 36;
    const c = 150;
    const gy = 500;
    const top = 70;
    return {
      w: 300, h: 540, n, fps: 40, px: c, py: gy,
      draw(ctx, i) {
        const k = i / (n - 1);
        const moonIn = smooth(win(k, 0, 0.18)) * (1 - smooth(win(k, 0.7, 0.95)));
        const fall = smooth(win(k, 0.08, 0.26));
        const fade = 1 - smooth(win(k, 0.6, 1));
        for (let j = 0; j < 3; j++) {
          const u = win(k, 0.2 + j * 0.12, 0.75 + j * 0.1);
          if (u > 0 && u < 1) lightRing(ctx, c, gy, 30 + 130 * smooth(u), 12 * (1 - u) + 3, 1 - u, 0.28, j === 1 ? MOONW : MGOLD, u > 0.5 ? u - 0.5 : 0, 921 + j);
        }
        // Two ribbons of water winding up round the light, each passing behind it (drawn before the
        // light) and in front (after).
        const rise = smooth(win(k, 0.16, 0.46));
        const gone = smooth(win(k, 0.6, 0.86));
        const ribbons = (side) => {
          if (rise <= 0.03 || gone >= 0.97) return;
          const H = 380 * rise;
          for (let j = 0; j < 2; j++) {
            const at = (u) => {
              const a = u * Math.PI * 3.2 + j * Math.PI - k * 9;
              return [c + Math.sin(a) * (54 - 20 * u), gy - 10 - u * H, Math.cos(a)];
            };
            const m = 36;
            {
              const top = [];
              const bot = [];
              let on = false;
              const flush = () => {
                if (top.length > 2) water(ctx, top.concat(bot.reverse()), { ph: k * 2, inset: 0.3, ripple: 0.3 });
                top.length = 0;
                bot.length = 0;
              };
              for (let q = 0; q <= m; q++) {
                const u = gone + (1 - gone) * (q / m);
                const [x, y, z] = at(u);
                const front = z > 0;
                if (front !== (side === 1)) {
                  if (on) flush();
                  on = false;
                  continue;
                }
                on = true;
                const th = 9 * Math.sin(Math.PI * (q / m)) + 2;
                top.push([x, y - th]);
                bot.push([x, y + th]);
              }
              flush();
            }
          }
          if (side) glim(ctx, c, gy - 10 - 380 * rise, 10 * (1 - gone), MOONW);
        };
        ribbons(0);
        lightColumn(ctx, c, top, lerp(top, gy, fall), 150, fade * (0.6 + 0.4 * Math.sin(Math.PI * win(k, 0.08, 0.6))));
        ribbons(1);
        spray(ctx, c, gy - 300, -Math.PI / 2, 2.6, 14, 150, win(k, 0.55, 1), 924, { pal: PEARL, g: 1.2 });
        glims(ctx, c, gy - 180 - 140 * k, 160, 200, 10, k, 925, 5 * fade);
        if (moonIn > 0) {
          ctx.save();
          ctx.globalAlpha = moonIn;
          glim(ctx, c, top, 30, MGOLD);
          inked(ctx, moonShape(c + 10, top, 34, 15), MGOLD[2], MGOLD[4], 4);
          fill(ctx, moonShape(c + 10, top, 34, 9), MGOLD[1]);
          fill(ctx, moonShape(c + 10, top, 33, 3), '#ffffff');
          ctx.restore();
        }
      },
    };
  })());

  // Her skipping shell in flight (loops; skims toward +x along the floor): a little scallop shell
  // spinning flat, bouncing in low hops, a splash and a ripple where it touches.
  E.tcshell = moonlit((() => {
    const n = 24;
    const cx = 80;
    const fy = 96;
    function shell(x, y, r, sx) {
      ctx0.save();
      ctx0.translate(x, y);
      ctx0.scale(sx, 1);
      const pts = [];
      for (let j = 0; j <= 20; j++) {
        const t = lerp(Math.PI * 1.08, Math.PI * 1.92, j / 20);
        const rr = r * (1 + 0.06 * Math.cos(j * Math.PI));
        pts.push([Math.cos(t) * rr, Math.sin(t) * rr * 0.92 + r * 0.45]);
      }
      pts.push([r * 0.18, r * 0.62], [-r * 0.18, r * 0.62]);
      inked(ctx0, pts, PEARL[2], PEARL[4], 3);
      for (let j = 1; j < 5; j++) {
        const t = lerp(Math.PI * 1.08, Math.PI * 1.92, j / 5);
        ctx0.beginPath();
        ctx0.moveTo(0, r * 0.58);
        ctx0.lineTo(Math.cos(t) * r * 0.92, Math.sin(t) * r * 0.86 + r * 0.45);
        ctx0.lineWidth = 2;
        ctx0.strokeStyle = PEARL[3];
        ctx0.stroke();
      }
      ctx0.beginPath();
      ctx0.ellipse(-r * 0.3, -r * 0.1, r * 0.22, r * 0.12, -0.5, 0, TAU);
      ctx0.fillStyle = '#ffffff';
      ctx0.fill();
      fill(ctx0, [[-r * 0.3, r * 0.6], [r * 0.3, r * 0.6], [r * 0.2, r * 0.74], [-r * 0.2, r * 0.74]], MGOLD[2]);
      ctx0.restore();
    }
    let ctx0 = null;
    return {
      w: 180, h: 130, n, fps: 40, px: cx, py: fy - 20, loop: true,
      draw(ctx, i) {
        ctx0 = ctx;
        const ph = i / n;
        const hop = Math.abs(Math.sin(ph * TAU));
        // Where it touched the water last, behind it now: a ripple opening and a splash.
        const since = (ph % 0.5) / 0.5;
        ripple(ctx, cx - 50 * since, fy, 10 + 34 * since, 5, 0.3, 0, 931, 1 - since);
        spray(ctx, cx - 30 * since, fy - 2, -Math.PI / 2 - 0.5, 1.4, 5, 40, Math.min(0.99, since * 1.2), 932, { pal: MOONW });
        for (let j = 0; j < 2; j++) {
          const u = (ph * 2 + j / 2) % 1;
          speedLine(ctx, PEARL, cx - 24 - u * 50, fy - 20 - hop * 30 + j * 6, cx - 8 - u * 20, fy - 20 - hop * 30 + j * 4, 2.6 * (1 - u));
        }
        shell(cx, fy - 24 - hop * 30, 27, Math.max(0.28, Math.abs(Math.cos(ph * TAU * 2))));
      },
    };
  })());

  // A shower of drops (out over them, on the floor at `py`): a breath of pearly mist gathers, the
  // drops fall through the air in streaks, and each lands with a ring and a little splash.
  E.tcdrops = moonlit((() => {
    const n = 30;
    const c = 170;
    const gy = 320;
    const R = rng(941);
    const D = Array.from({ length: 18 }, (_, j) => ({ x: c + (R() - 0.5) * 260, at: 0.12 + R() * 0.45, sp: 0.18 + R() * 0.1, r: 6 + R() * 4, j }));
    return {
      w: 340, h: 340, n, fps: 40, px: c, py: gy,
      draw(ctx, i) {
        const k = i / (n - 1);
        const mist = swell(k, 0, 0.6);
        if (mist > 0) {
          ctx.save();
          ctx.globalAlpha = 0.7 * mist;
          for (let j = 0; j < 5; j++) {
            ctx.beginPath();
            ctx.ellipse(c - 110 + j * 55, 44 + Math.sin(j * 2 + k * 3) * 6, (30 + 8 * (j % 2)) * (0.6 + 0.4 * mist), 14 * (0.6 + 0.4 * mist), 0, 0, TAU);
            ctx.fillStyle = j % 2 ? MFOAM[2] : MOONW[1];
            ctx.globalAlpha = 0.45 * mist;
            ctx.fill();
          }
          glims(ctx, c, 44, 240, 20, 6, k, 944, 4 * mist);
          ctx.restore();
        }
        for (const d of D) {
          const u = (k - d.at) / d.sp;
          if (u > 0 && u < 1) {
            const y = lerp(50, gy - 6, u * u);
            speedLine(ctx, MOONW, d.x, y - 40 * u - 8, d.x, y, d.r * 0.4);
            drop(ctx, d.j % 3 ? MOONW : PEARL, d.x, y, Math.PI / 2, d.r);
          } else if (u >= 1) {
            const v = (k - d.at - d.sp) / 0.3;
            if (v < 1) {
              ripple(ctx, d.x, gy, 6 + 24 * v, 4, 0.3, 0, 943 + d.j, 1 - v);
              spray(ctx, d.x, gy - 2, -Math.PI / 2, 1.8, 3, 26, Math.min(0.99, v * 1.4), 960 + d.j, { pal: PEARL });
            }
          }
        }
      },
    };
  })());
  E.tcdropsbig = grown(E.tcdrops, 1.4);

  // Her crescent wave in flight (loops; rolls toward +x at chest height): a crescent of seafoam
  // water standing on its tips, its belly forward, rippling, a gold edge of light along its belly,
  // foam peeling off its tips and pearls trailing.
  E.tccrescent = moonlit((() => {
    const n = 24;
    const cx = 110;
    const cy = 110;
    return {
      w: 220, h: 220, n, fps: 40, px: cx + 40, py: cy, loop: true,
      draw(ctx, i) {
        const ph = i / n;
        for (let j = 0; j < 3; j++) {
          const u = (ph * 2 + j / 3) % 1;
          speedLine(ctx, MOONW, cx - 30 - u * 70, cy - 50 + j * 50, cx + 10 - u * 40, cy - 46 + j * 46, 3.4 * (1 - u));
        }
        const R0 = 86;
        water(ctx, moonShape(cx, cy, R0, 38), { ph: ph * 2, inset: 0.28, lit: { w: 6, pts: moonShape(cx - 6, cy, R0 - 6, 1, 12).slice(2, 11) } });
        current(ctx, (u, j) => {
          const t = lerp(-1.1, 1.1, u);
          return [cx + Math.cos(t) * (R0 - 14 - j * 10), cy + Math.sin(t) * (R0 - 14 - j * 10)];
        }, 2, ph * 2, 2.4, 0.45);
        // Its edge of light.
        ctx.save();
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(cx, cy, R0 + 1, -1.05, 1.05);
        ctx.lineWidth = 4;
        ctx.strokeStyle = MGOLD[1];
        ctx.stroke();
        ctx.restore();
        for (const s of [-1, 1]) claws(ctx, cx + Math.cos(1.2 * s) * R0, cy + Math.sin(1.2 * s) * R0, 16, Math.PI + s * 0.9, 3, ph, 951 + s);
        for (let j = 0; j < 4; j++) {
          const u = (ph + j / 4) % 1;
          pearl(ctx, cx - 40 - u * 60, cy + (j - 1.5) * 34, 7 * (1 - u) + 1, u);
        }
        sparkle(ctx, MGOLD, cx + R0 * 0.92, cy - 20, 7 + 3 * Math.sin(ph * TAU * 2), ph * TAU);
      },
    };
  })());
  E.tccrescentbig = grown(E.tccrescent, 1.5);

  // A droplet of healing (Spring Tide; on whoever it mends, from their feet at `py`): a glowing drop
  // falls onto them, bursts in a ring of soft light that washes down to their feet, and little
  // lights rise off them.
  E.tcdrop = moonlit((() => {
    const n = 30;
    const c = 80;
    const gy = 290;
    const head = 150;
    return {
      w: 160, h: 300, n, fps: 40, px: c, py: gy,
      draw(ctx, i) {
        const k = i / (n - 1);
        const fall = win(k, 0, 0.3);
        if (fall < 1) {
          const y = lerp(0, head, fall * fall);
          speedLine(ctx, MOONW, c, y - 50 * fall - 10, c, y, 4);
          glim(ctx, c, y, 12, MOONW);
          drop(ctx, MOONW, c, y, Math.PI / 2, 9);
        }
        const wash = win(k, 0.3, 0.85);
        if (wash > 0 && wash < 1) {
          lightRing(ctx, c, lerp(head, gy - 4, smooth(wash)), 30 + 16 * wash, 8 * (1 - wash) + 2, 1 - wash * 0.6, 0.3, MGOLD);
          if (wash < 0.4) glim(ctx, c, head, 20 * swell(wash, 0, 0.4), MGOLD);
        }
        spray(ctx, c, head, -Math.PI / 2, 2.8, 8, 50, win(k, 0.28, 0.8), 971, { pal: PEARL });
        const R = rng(972);
        for (let j = 0; j < 5; j++) {
          const u = win(k, 0.4 + R() * 0.2, 1);
          if (u > 0 && u < 1) glim(ctx, c + (R() - 0.5) * 80, gy - 40 - 140 * u, 4.5 * (1 - u), j % 2 ? MGOLD : MOONW);
          else R();
        }
      },
    };
  })());

  // A pearl of light (her aura's, rising round her as her Moonsong builds; loops).
  E.tcmote = (() => {
    const n = 24;
    return {
      w: 60, h: 60, n, fps: 24, px: 30, py: 30, loop: true,
      draw(ctx, i) {
        const ph = i / n;
        glim(ctx, 30, 30, 9 + 2 * Math.sin(ph * TAU), ph < 0.5 ? MGOLD : MOONW);
        sparkle(ctx, MGOLD, 30, 30, 6 + 6 * Math.max(0, Math.sin(ph * TAU)), ph * TAU);
      },
    };
  })();

  // Spring Tide's ring (loops; flat at her feet): a ring of moonlight turning, three little
  // crescents riding round it and glints rising off it.
  E.tcring = (() => {
    const n = 24;
    const c = [150, 70];
    return {
      w: 300, h: 140, n, fps: 24, px: c[0], py: c[1], loop: true,
      draw(ctx, i) {
        const ph = i / n;
        lightRing(ctx, c[0], c[1], 120, 10, 0.85, 0.3, MGOLD, 0.25, 981 + (i % 2));
        lightRing(ctx, c[0], c[1], 98, 6, 0.6, 0.3, MOONW);
        for (let j = 0; j < 3; j++) {
          const a = ph * TAU + (j / 3) * TAU;
          const x = c[0] + Math.cos(a) * 110;
          const y = c[1] + Math.sin(a) * 110 * 0.3;
          ctx.save();
          ctx.globalAlpha = Math.sin(a) > 0 ? 1 : 0.55;
          inked(ctx, moonShape(x, y - 10, 12, 5), MGOLD[2], MGOLD[4], 2.5);
          ctx.restore();
        }
        for (let j = 0; j < 4; j++) {
          const u = (ph + j / 4) % 1;
          glim(ctx, c[0] + Math.cos(j * 1.7) * 90, c[1] - 6 - 50 * u, 4 * (1 - u), j % 2 ? MOONW : MGOLD);
        }
      },
    };
  })();

  // Tide's Return (on the fallen, from their feet at `py`): the water at their feet glows, a column
  // of soft light rises up out of it, drops lift off the floor and float up with it, a crescent
  // shines over them, and it fades as they stand.
  E.tcrevive = moonlit((() => {
    const n = 40;
    const c = 120;
    const gy = 460;
    return {
      w: 240, h: 480, n, fps: 34, px: c, py: gy,
      draw(ctx, i) {
        const k = i / (n - 1);
        const fade = 1 - smooth(win(k, 0.7, 1));
        const pool = smooth(win(k, 0, 0.2));
        lightRing(ctx, c, gy, 30 + 60 * pool, 10, fade, 0.3, MOONW);
        lightRing(ctx, c, gy, 20 + 40 * pool, 6, fade, 0.3, MGOLD);
        const up = smooth(win(k, 0.12, 0.5));
        lightColumn(ctx, c, lerp(gy, 80, up), gy, 110, fade * 0.9);
        const R = rng(991);
        for (let j = 0; j < 12; j++) {
          const x = c + (R() - 0.5) * 120;
          const s = R();
          const u = win(k, 0.1 + s * 0.3, 0.7 + s * 0.3);
          if (u <= 0 || u >= 1) continue;
          const y = gy - 10 - 360 * smooth(u);
          if (j % 3) drop(ctx, j % 2 ? MOONW : PEARL, x, y, -Math.PI / 2, 6 * (1 - u * 0.5));
          else glim(ctx, x, y, 5 * (1 - u), MGOLD);
        }
        const moonIn = smooth(win(k, 0.3, 0.5)) * fade;
        if (moonIn > 0) {
          ctx.save();
          ctx.globalAlpha = moonIn;
          glim(ctx, c, 80, 24, MGOLD);
          inked(ctx, moonShape(c + 8, 80, 28, 12), MGOLD[2], MGOLD[4], 3);
          fill(ctx, moonShape(c + 8, 80, 27, 6), MGOLD[1]);
          ctx.restore();
        }
        if (k > 0.4 && k < 0.9) for (let j = 0; j < 3; j++) sparkle(ctx, MGOLD, c + (j - 1) * 50, 200 - j * 30, 10 * swell(k, 0.4 + j * 0.05, 0.9), k * 4 + j);
      },
    };
  })());

  // Her versions of the Tide Mage's water, in her palette with pearls of light drifting in it.
  const withGlims = (e, { x, y, w, h, n, r = 4, seed }) => moonlit({
    ...e,
    draw(ctx, i) {
      e.draw(ctx, i);
      glims(ctx, x, y, w, h, n, i / e.n, seed, r);
    },
  });
  E.tcbubble = moonlit(E.tmbubble);
  E.tcbubblepop = moonlit(E.tmhit);
  E.tcspring = withGlims(E.tmgeyser, { x: 130, y: 250, w: 160, h: 300, n: 8, r: 4.5, seed: 1001 });
  E.tcsplash = moonlit(E.tmsplash);

  // ---------- The Tidecaller's skills ----------
  // Healing Rain (loops while it lasts; over the party, on the floor at `py`): a soft cloud of
  // seafoam mist hangs overhead, lit gold from inside, and a gentle rain falls from it, every drop
  // landing in a ring, little lights rising where they land.
  E.tcrain = moonlit((() => {
    const n = 30;
    const c = 300;
    const gy = 330;
    const R = rng(1101);
    const D = Array.from({ length: 26 }, (_, j) => ({ x: c + (R() - 0.5) * 520, o: R(), r: 5 + R() * 3, j }));
    return {
      w: 600, h: 350, n, fps: 20, px: c, py: gy, loop: true,
      draw(ctx, i) {
        const ph = i / n;
        // The rain, under the cloud.
        for (const d of D) {
          const u = (ph + d.o) % 1;
          if (u < 0.7) {
            const v = u / 0.7;
            const y = lerp(80, gy - 4, v);
            speedLine(ctx, MOONW, d.x - 4, y - 46, d.x, y, d.r * 0.36);
            drop(ctx, d.j % 4 ? MOONW : PEARL, d.x, y, Math.PI / 2 - 0.08, d.r);
          } else {
            const v = (u - 0.7) / 0.3;
            ripple(ctx, d.x, gy, 6 + 22 * v, 4, 0.3, 0, 1102 + d.j, 1 - v);
            if (d.j % 3 === 0) glim(ctx, d.x, gy - 8 - 40 * v, 4 * (1 - v), MGOLD);
          }
        }
        // The cloud: soft lobes of mist drifting, lit from inside, a glint or two turning in it.
        // (Soft and see-through, lobes of every size overlapping in two rows, none of them white.)
        const CR = rng(1104);
        for (let row = 0; row < 2; row++) {
          for (let j = 0; j < 8; j++) {
            const x = c - 250 + j * 70 + row * 34 + (CR() - 0.5) * 30 + Math.sin(ph * TAU + j * 1.3 + row) * 10;
            const y = 52 + row * 26 + (CR() - 0.5) * 16 + Math.cos(ph * TAU + j + row * 2) * 4;
            const sz = 0.7 + CR() * 0.6;
            for (const [rx, ry, col, a] of [[62, 32, MOONW[3], 0.16], [50, 26, MOONW[2], 0.24], [34, 17, MOONW[1], 0.3]]) {
              ctx.beginPath();
              ctx.ellipse(x, y, rx * sz, ry * sz, 0, 0, TAU);
              ctx.fillStyle = col;
              ctx.globalAlpha = a;
              ctx.fill();
            }
            ctx.globalAlpha = 1;
          }
        }
        glims(ctx, c, 60, 480, 40, 8, ph, 1103, 5);
        for (let j = 0; j < 3; j++) sparkle(ctx, MGOLD, c - 160 + j * 160, 50 + (j % 2) * 20, 8 * Math.max(0, Math.sin(ph * TAU + j * 2)), ph * TAU + j);
      },
    };
  })());

  // Spring Surge (round her, on the floor at `py`): the floor glows under her, rings of gold and
  // seafoam race out across it, a curtain of water leaps up all round her and falls back, and
  // lights rise off everyone it reaches.
  E.tcsurge = moonlit((() => {
    const n = 32;
    const c = 260;
    const gy = 360;
    return {
      w: 520, h: 380, n, fps: 36, px: c, py: gy,
      draw(ctx, i) {
        const k = i / (n - 1);
        const glow = swell(k, 0, 0.6);
        if (glow > 0) {
          ctx.save();
          ctx.globalAlpha = 0.5 * glow;
          ctx.beginPath();
          ctx.ellipse(c, gy, 140, 40, 0, 0, TAU);
          ctx.fillStyle = MGOLD[1];
          ctx.fill();
          ctx.restore();
        }
        for (let j = 0; j < 3; j++) {
          const u = win(k, j * 0.1, 0.6 + j * 0.12);
          if (u > 0 && u < 1) lightRing(ctx, c, gy, 30 + 210 * smooth(u), 14 * (1 - u) + 3, 1 - u, 0.3, j === 1 ? MOONW : MGOLD, u > 0.5 ? u - 0.5 : 0, 1111 + j);
        }
        // The curtain: arcs of water leaping up on both sides and falling back.
        const R = rng(1114);
        for (let j = 0; j < 14; j++) {
          const side = j % 2 ? 1 : -1;
          const x = c + side * (30 + R() * 150);
          const H = 120 + R() * 140;
          const st = R() * 0.15;
          const u = win(k, 0.05 + st, 0.75 + st);
          if (u <= 0 || u >= 1) continue;
          const y = gy - 4 * H * u * (1 - u);
          const dirA = u < 0.5 ? -Math.PI / 2 : Math.PI / 2;
          speedLine(ctx, MOONW, x, y + (u < 0.5 ? 40 : -40), x, y, 5 * (1 - Math.abs(u - 0.5)));
          drop(ctx, j % 3 ? MOONW : MFOAM, x, y, dirA, 9 * (1 - u * 0.4));
        }
        glims(ctx, c, gy - 80 - 160 * k, 380, 120, 12, k, 1115, 6 * (1 - win(k, 0.6, 1)));
        if (k < 0.4) {
          glim(ctx, c, gy - 70, 34 * swell(k, 0, 0.4), MGOLD);
          sparkle(ctx, MGOLD, c, gy - 70, 26 * swell(k, 0, 0.4), k * 3);
        }
      },
    };
  })());

  // Moon Blessing (round her): a crescent fades in over her with a ring of gold, and flakes of
  // moonlight drift down round the party, each one turning and glinting as it falls.
  E.tcbless = moonlit((() => {
    const n = 34;
    const c = 220;
    const gy = 420;
    const R = rng(1121);
    const F = Array.from({ length: 16 }, () => ({ x: c + (R() - 0.5) * 400, at: R() * 0.4, sp: 0.4 + R() * 0.2, s: R() }));
    return {
      w: 440, h: 440, n, fps: 34, px: c, py: gy,
      draw(ctx, i) {
        const k = i / (n - 1);
        const moonIn = smooth(win(k, 0, 0.25)) * (1 - smooth(win(k, 0.7, 1)));
        lightRing(ctx, c, gy, 60 + 120 * smooth(win(k, 0, 0.6)), 10, 1 - win(k, 0.4, 1), 0.3, MGOLD, 0.3, 1122);
        for (const f of F) {
          const u = (k - f.at) / f.sp;
          if (u <= 0 || u >= 1) continue;
          const x = f.x + Math.sin(u * 6 + f.s * 6) * 14;
          const y = lerp(90, gy - 10, u);
          const a = 1 - win(u, 0.7, 1);
          ctx.save();
          ctx.globalAlpha = a;
          ctx.translate(x, y);
          ctx.rotate(u * 4 + f.s * 6);
          if (f.s < 0.5) sparkle(ctx, MGOLD, 0, 0, 7 + 3 * Math.sin(u * 12), 0);
          else inked(ctx, moonShape(0, 0, 8, 3.5), MGOLD[2], MGOLD[4], 2);
          ctx.restore();
        }
        if (moonIn > 0) {
          ctx.save();
          ctx.globalAlpha = moonIn;
          glim(ctx, c, 70, 30, MGOLD);
          inked(ctx, moonShape(c + 10, 70, 32, 14), MGOLD[2], MGOLD[4], 4);
          fill(ctx, moonShape(c + 10, 70, 31, 8), MGOLD[1]);
          fill(ctx, moonShape(c + 10, 70, 30, 3), '#ffffff');
          ctx.restore();
        }
      },
    };
  })());

  // Moonfall (on the floor out where it lands): a great crescent of water and light drawn in the
  // sky over them, falling, turning as it comes, slamming into the floor in a crown of water, rings
  // racing out and spray flying, the light washing over the party.
  E.tcmoonfall = moonlit((() => {
    const n = 36;
    const c = 230;
    const gy = 520;
    return {
      w: 460, h: 540, n, fps: 40, px: c, py: gy,
      draw(ctx, i) {
        const k = i / (n - 1);
        const fall = win(k, 0.12, 0.42);
        const hit = win(k, 0.42, 1);
        if (k < 0.44) {
          const y = lerp(90, gy - 70, fall * fall);
          const a = smooth(win(k, 0, 0.14));
          ctx.save();
          ctx.globalAlpha = a;
          ctx.translate(c, y);
          ctx.rotate(-0.9 + 0.9 * fall);
          if (fall > 0.2) for (let j = 0; j < 4; j++) speedLine(ctx, MGOLD, -30 + j * 20, -90 - 60 * fall, -30 + j * 20, -40, 4);
          glim(ctx, 0, 0, 50, MGOLD);
          water(ctx, moonShape(-30, 0, 80, 40), { ph: k * 2, inset: 0.26 });
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.arc(-30, 0, 81, -1.05, 1.05);
          ctx.lineWidth = 5;
          ctx.strokeStyle = MGOLD[1];
          ctx.stroke();
          ctx.restore();
        }
        if (hit > 0 && hit < 1) {
          const crown = swell(hit, 0, 0.6);
          if (crown > 0) {
            const pts = [];
            const m = 9;
            for (let j = 0; j <= m * 2; j++) {
              const u = j / (m * 2);
              const x = c - 140 + u * 280;
              const tip = j % 2 === 0;
              pts.push([x, gy - (tip ? 150 : 60) * crown * Math.sin(Math.PI * u) - 8]);
            }
            pts.push([c + 140, gy], [c - 140, gy]);
            water(ctx, pts, { ph: hit * 2, inset: 0.25, ripple: 0.6 });
          }
          for (let j = 0; j < 3; j++) {
            const u = win(hit, j * 0.12, 0.7 + j * 0.1);
            if (u > 0 && u < 1) lightRing(ctx, c, gy, 40 + 190 * smooth(u), 14 * (1 - u) + 3, 1 - u, 0.3, j === 1 ? MGOLD : MOONW, u > 0.5 ? u - 0.5 : 0, 1131 + j);
          }
          spray(ctx, c, gy - 40, -Math.PI / 2, 2.6, 20, 200, win(hit, 0, 0.9), 1134, { pal: MFOAM, g: 1.1 });
          glims(ctx, c, gy - 120 - 160 * hit, 340, 160, 12, hit, 1135, 6 * (1 - hit));
          if (hit < 0.3) {
            glim(ctx, c, gy - 40, 70 * swell(hit, 0, 0.3), MGOLD);
            sparkle(ctx, MGOLD, c, gy - 60, 40 * swell(hit, 0, 0.3), hit * 3);
          }
        }
      },
    };
  })());

  // Moon Tide (her finisher; round her, on the floor at `py`, the width of the screen): the moon
  // rises huge behind her, the tide rises across the whole floor in a long rippling swell lit gold
  // by it, pearls of light lifting out of the water, then it surges, breaks into spray all along
  // its length and drains away.
  E.tcmoontidebig = moonlit((() => {
    const n = 44;
    const c = 640;
    const gy = 640;
    const W = 1180;
    return {
      w: 1280, h: 680, n, fps: 26, px: c, py: gy,
      draw(ctx, i) {
        const k = i / (n - 1);
        const moonIn = smooth(win(k, 0, 0.3)) * (1 - smooth(win(k, 0.8, 1)));
        if (moonIn > 0) {
          ctx.save();
          ctx.globalAlpha = moonIn;
          const my = lerp(380, 150, smooth(win(k, 0, 0.5)));
          glim(ctx, c, my, 110, MGOLD);
          inked(ctx, moonShape(c + 30, my, 110, 50), MGOLD[2], MGOLD[4], 5);
          fill(ctx, moonShape(c + 30, my, 108, 30), MGOLD[1]);
          fill(ctx, moonShape(c + 30, my, 106, 10), '#ffffff');
          ctx.restore();
        }
        // The swell: its top a long wave running along, rising, surging and draining.
        // (No higher than a monster's middle: she stays in plain sight, the tide behind her.)
        const level = 130 * smooth(win(k, 0.12, 0.5)) * (1 - smooth(win(k, 0.72, 0.98))) + 40 * swell(k, 0.5, 0.72);
        if (level > 4) {
          const pts = [];
          const m = 48;
          for (let j = 0; j <= m; j++) {
            const u = j / m;
            // (Flat across the floor, only its two ends running down to it: a flood, not a mound.)
            const edge = smooth(Math.min(1, Math.sin(Math.PI * u) * 3.5));
            pts.push([c - W / 2 + u * W, gy - level * edge - 14 * Math.sin(u * 14 - k * 18) * edge]);
          }
          pts.push([c + W / 2, gy], [c - W / 2, gy]);
          water(ctx, pts, { ph: k * 3, inset: 0.18, lit: { w: 8, pts: pts.slice(4, m - 3).map(([x, y]) => [x, y + 10]) } });
          current(ctx, (u, j) => [c - W / 2 + 60 + u * (W - 120), gy - level * 0.5 + (j - 1) * 30 + Math.sin(u * 10 + j) * 8], 3, k * 3, 3, 0.4);
          for (let j = 0; j < 8; j++) claws(ctx, c - W / 2 + 80 + j * ((W - 160) / 7), pts[Math.round(((80 + j * ((W - 160) / 7)) / W) * m)][1], 22, -Math.PI / 2 + (j % 2 ? 0.4 : -0.4), 3, k, 1141 + j);
          glims(ctx, c, gy - level * 0.6, W - 100, level * 0.8, 20, k * 2, 1142, 7);
        }
        // It breaks: spray all along its top.
        for (let j = 0; j < 6; j++) spray(ctx, c - W / 2 + 120 + j * ((W - 240) / 5), gy - 150, -Math.PI / 2, 2.4, 10, 160, win(k, 0.66, 1), 1150 + j, { pal: MFOAM, g: 1.1 });
      },
    };
  })());

  // Lunar Flow: a glint running up the staff and a burst of little gold lights.
  E.tcglint = moonlit((() => {
    const n = 24;
    const c = 110;
    return {
      w: 220, h: 220, n, fps: 40, px: c, py: c,
      draw(ctx, i) {
        const k = i / (n - 1);
        const ring = smooth(win(k, 0.05, 0.7));
        if (ring > 0 && ring < 1) celRing(ctx, MGOLD, c, c, 20 + 70 * ring, 10 * (1 - ring) + 2, { broken: ring > 0.5 ? (ring - 0.5) * 1.6 : 0, seed: 1161 });
        const R = rng(1162);
        for (let j = 0; j < 10; j++) {
          const a = R() * TAU;
          const v = win(k, R() * 0.15, 1);
          if (v <= 0 || v >= 1) continue;
          sparkle(ctx, j % 3 ? MGOLD : MOONW, c + Math.cos(a) * (20 + 70 * v), c + Math.sin(a) * (20 + 70 * v), 8 * (1 - v), v * 4 + j);
        }
        if (k < 0.5) glim(ctx, c, c, 22 * swell(k, 0, 0.5), MGOLD);
      },
    };
  })());

  // Her versions of the Tide Mage's skills.
  E.tcshellfx = withGlims(E.tmshieldfx, { x: 150, y: 140, w: 220, h: 200, n: 10, r: 4, seed: 1171 });
  E.tcpool = withGlims(E.tmpool, { x: 190, y: 66, w: 300, h: 40, n: 12, r: 3.5, seed: 1172 });
  E.tcwhirl = moonlit(E.tmwhirlbig);
  E.tcsilverwave = withGlims(E.tmwavebig, { x: 210, y: 210, w: 300, h: 200, n: 10, r: 5, seed: 1173 });
  E.tcsilvertidebig = withGlims(E.tmgreatbig, { x: 320, y: 300, w: 560, h: 420, n: 16, r: 8, seed: 1174 });
  E.tcsplashbig = moonlit(E.tmsplashbig);

  // ---------- The Thunderguard (the Warrior remade; docs/design/thunderguard.md) ----------
  // A storm of his own: thick forked anime bolts, inked in storm navy, banded storm blue to gold, a
  // white-hot core, with a soft blue glow round them; static sparks and crackles, thunderclap rings,
  // storm clouds. Every drawing is one moment of a smooth motion over many frames (rings grow and
  // fade, bolts strike and die away); the bolts' channels are re-drawn every couple of frames, as
  // lightning flickers.
  let TGB = ['#ffffff', '#fff6c4', '#ffd84a', '#4a78ff', '#18226a'];
  let TGS = ['#ffffff', '#dceaff', '#8fb8ff', '#4a6ee0', '#1c2a78'];
  const TGG = ['#ffffff', '#fff6c4', '#ffe27a', '#e8b23c', '#7a4a18'];
  const TGN = ['#b8c4ea', '#7a88c0', '#4a5894', '#2c356a', '#141a40'];
  // Shapes that flow: a seed may be fractional, and its random draws are blended between the two
  // whole seeds either side (`mrng`), so a bolt's kinks drift smoothly from one shape into the next
  // instead of jumping each frame (the player: smooth and fluid, 2026-11-09). `loopSeed` cycles
  // through `m` shapes over a loop so the last drawing flows back into the first.
  const sd = (v) => (typeof v === 'number' ? { s0: Math.floor(v), s1: Math.floor(v) + 1, f: smooth(v - Math.floor(v)) } : v);
  const sadd = (v, k) => {
    const q = sd(v);
    return { s0: q.s0 + k, s1: q.s1 + k, f: q.f };
  };
  function mrng(v) {
    const q = sd(v);
    const A = rng(q.s0);
    const B = rng(q.s1);
    return () => lerp(A(), B(), q.f);
  }
  const loopSeed = (base, i, n, m = 6) => {
    const t = (i / n) * m;
    const lo = Math.floor(t);
    return { s0: base + (lo % m), s1: base + ((lo + 1) % m), f: smooth(t - lo) };
  };
  // A jagged channel from (x0, y0) to (x1, y1) (zig's, with a flowing seed).
  function tgZig(x0, y0, x1, y1, n, kink, seed) {
    const R = mrng(seed);
    const pts = [[x0, y0]];
    const nx = -(y1 - y0);
    const ny = x1 - x0;
    const l = Math.hypot(nx, ny) || 1;
    for (let k = 1; k < n; k++) {
      const u = k / n;
      const off = (R() - 0.5) * 2 * kink * (k % 2 ? 1 : -0.6);
      pts.push([lerp(x0, x1, u) + (nx / l) * off, lerp(y0, y1, u) + (ny / l) * off]);
    }
    pts.push([x1, y1]);
    return pts;
  }
  // A bolt along `pts`: a soft blue glow round it, then the inked cel bands with the hot core.
  // (The ink line stays thin against the bolt, so even a fine one reads as bright light, not a
  // dark scratch: navy, storm blue, gold, pale gold, a white-hot core.)
  function tgThunder(ctx, pts, w, a = 1) {
    if (a <= 0.01 || w <= 0.3) return;
    ctx.save();
    ctx.globalAlpha *= a;
    strokePts(ctx, pts, w * 4.2, TGS[3], 0.12);
    strokePts(ctx, pts, w * 2.4, TGS[2], 0.24);
    strokePts(ctx, pts, w * 1.6, TGB[2], 0.28);
    const line = (width, colour, al = 1) => {
      ctx.save();
      ctx.globalAlpha *= al;
      ctx.beginPath();
      pts.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.lineJoin = 'miter';
      ctx.miterLimit = 3;
      ctx.lineCap = 'round';
      ctx.strokeStyle = colour;
      ctx.lineWidth = width;
      ctx.stroke();
      ctx.restore();
    };
    line(w * 1.35 + 1.6, TGB[4], 0.85);
    line(w * 1.2 + 0.6, TGB[3]);
    line(w * 0.95, TGB[2]);
    line(w * 0.65, TGB[1]);
    line(Math.max(0.8, w * 0.32), '#ffffff');
    ctx.restore();
  }
  // A bolt's channel from (x0, y0) to (x1, y1): kinks every ~34 px, `kink` how far they swing.
  const tgPath = (x0, y0, x1, y1, seed, kink = 0.28) => {
    const len = Math.hypot(x1 - x0, y1 - y0);
    return tgZig(x0, y0, x1, y1, Math.max(3, Math.round(len / 34)), len * kink * 0.18 + 4, seed);
  };
  // A forked bolt: the trunk, and `n` branches splitting off it toward `side` (+1/-1, or 0 either).
  function tgFork(ctx, x0, y0, x1, y1, w, seed, n = 3, a = 1, kink = 0.28) {
    const trunk = tgPath(x0, y0, x1, y1, seed, kink);
    const R = mrng(sadd(seed, 11));
    for (let b = 0; b < n; b++) {
      // (Where it splits off slides along the trunk, and the way it leans swings through, smoothly.)
      const fi = 1 + R() * Math.max(0.001, trunk.length - 2.001);
      const k0 = Math.floor(fi);
      const p0 = trunk[k0];
      const p1 = trunk[Math.min(trunk.length - 1, k0 + 1)];
      const bx = lerp(p0[0], p1[0], fi - k0);
      const by = lerp(p0[1], p1[1], fi - k0);
      const ang = Math.atan2(y1 - y0, x1 - x0) + (R() - 0.5) * 2 * (0.5 + R() * 0.5);
      const len = Math.hypot(x1 - x0, y1 - y0) * (0.16 + R() * 0.18);
      tgThunder(ctx, tgPath(bx, by, bx + Math.cos(ang) * len, by + Math.sin(ang) * len, sadd(seed, b * 5 + 1), 0.4), w * 0.42, a);
    }
    tgThunder(ctx, trunk, w, a);
  }
  // Static: `n` little jagged sparks crackling round (x, y) within r.
  function tgCrackle(ctx, x, y, r, n, seed, a = 1, w = 2.4) {
    const R = mrng(seed);
    for (let j = 0; j < n; j++) {
      const a0 = R() * TAU;
      const d0 = r * (0.2 + R() * 0.5);
      const len = r * (0.3 + R() * 0.4);
      const a1 = a0 + (R() - 0.5) * 1.2;
      const x0 = x + Math.cos(a0) * d0;
      const y0 = y + Math.sin(a0) * d0;
      tgThunder(ctx, tgZig(x0, y0, x0 + Math.cos(a1) * len, y0 + Math.sin(a1) * len, 3, len * 0.25, sadd(seed, j * 3)), w, a);
    }
  }
  // Sparks thrown from (x, y) at moment u of their flight, falling under gravity: short gold streaks.
  function tgSparks(ctx, x, y, a, sp, n, d, u, seed, g = 1) {
    if (u <= 0 || u >= 1) return;
    const R = rng(seed);
    for (let j = 0; j < n; j++) {
      const aa = a + (R() - 0.5) * sp;
      const s0 = d * (0.45 + R() * 0.55);
      const late = R() * 0.15;
      const v = clamp01((u - late) / (1 - late));
      if (v <= 0 || v >= 1) continue;
      const px = x + Math.cos(aa) * s0 * v;
      const py = y + Math.sin(aa) * s0 * v + g * d * 0.55 * v * v;
      const vx = Math.cos(aa) * s0;
      const vy = Math.sin(aa) * s0 + g * d * 1.1 * v;
      const l = Math.hypot(vx, vy) || 1;
      const tail = 14 * (1 - v) + 4;
      ctx.save();
      ctx.globalAlpha *= 1 - v * 0.7;
      strokePts(ctx, [[px - (vx / l) * tail, py - (vy / l) * tail], [px, py]], 7, TGS[2], 0.4);
      strokePts(ctx, [[px - (vx / l) * tail, py - (vy / l) * tail], [px, py]], 3.4, TGB[2], 1);
      strokePts(ctx, [[px - (vx / l) * tail * 0.5, py - (vy / l) * tail * 0.5], [px, py]], 1.8, '#ffffff', 1);
      ctx.restore();
    }
  }
  // A flash of light: a soft blue halo round a white-gold heart.
  function tgFlash(ctx, x, y, r, a = 1) {
    if (r <= 0.5 || a <= 0) return;
    ctx.save();
    for (const [f, col, al] of [[1.9, TGS[3], 0.16], [1.3, TGS[2], 0.3], [0.8, TGB[1], 0.85], [0.42, '#ffffff', 1]]) {
      ctx.globalAlpha = a * al;
      ctx.beginPath();
      ctx.arc(x, y, r * f, 0, TAU);
      ctx.fillStyle = col;
      ctx.fill();
    }
    ctx.restore();
  }
  // A thunderclap ring flat on the floor (`sy` squashes it into perspective), crackling along it.
  function tgRing(ctx, x, y, r, th, a, seed, { sy = 0.3, crackle = 6, pal = TGS } = {}) {
    if (r <= th || a <= 0) return;
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.translate(x, y);
    ctx.scale(1, sy);
    celRing(ctx, pal, 0, 0, r, th, { broken: 0.15, seed: 7 });
    ctx.restore();
    const R = mrng(sadd(seed, 3));
    for (let j = 0; j < crackle; j++) {
      const t0 = R() * TAU;
      const t1 = t0 + 0.25 + R() * 0.3;
      const pts = [];
      for (let k = 0; k <= 5; k++) {
        const t = lerp(t0, t1, k / 5);
        const off = k % 2 ? (R() - 0.5) * th * 1.4 : 0;
        pts.push([x + Math.cos(t) * (r + off), y + Math.sin(t) * (r + off) * sy - (k % 2 ? 6 : 0)]);
      }
      tgThunder(ctx, pts, 2.2, a);
    }
  }

  // Static on an unseen shell round him: arcs of lightning running along a dome (centre cx, cy,
  // radii rx, ry), jittered off it, re-forming every couple of frames; no bubble is drawn.
  function tgDome(ctx, cx, cy, rx, ry, n, seed, w, a = 1) {
    const R = mrng(seed);
    for (let j = 0; j < n; j++) {
      const t0 = Math.PI + R() * Math.PI * 1.1 - 0.05;
      const t1 = t0 + 0.45 + R() * 0.5;
      const pts = [];
      for (let q = 0; q <= 7; q++) {
        const t = lerp(t0, t1, q / 7);
        const off = q % 2 ? (R() - 0.5) * 16 : (R() - 0.5) * 4;
        pts.push([cx + Math.cos(t) * (rx + off), cy + Math.sin(t) * (ry + off)]);
      }
      tgThunder(ctx, pts, w * (0.7 + 0.3 * R()), a);
    }
  }
  // The line's crescent slash, in his storm colours: the same cut (`E.slash`'s geometry and swing),
  // a storm-blue blur graded to a white-gold edge, little bolts crackling off its head.
  let STORML = ['#ffffff', '#fff3b0', '#8fb8ff', '#3f6cf0'];
  E.slashstorm = {
    w: 260, h: 200, n: 8, fps: 30, px: 130, py: 150, swing: [-Math.PI / 2, 1, 100],
    draw(ctx, i) {
      const cx = 130;
      const cy = 150;
      const R = 100;
      const a0 = (-168 * Math.PI) / 180;
      const a1 = (-12 * Math.PI) / 180;
      const head = [0.45, 1, 1, 1, 1, 1, 1, 1][i];
      const tail = [0.1, 0, 0.05, 0.25, 0.45, 0.65, 0.8, 0.92][i];
      const a = [0.8, 1, 1, 0.85, 0.65, 0.45, 0.25, 0.1][i];
      const N = 40;
      for (let k = 0; k < N; k++) {
        const u = k / N;
        if (u < tail || u > head) continue;
        const v = (u - tail) / Math.max(0.01, head - tail);
        const th = 4 + 26 * Math.pow(v, 1.5);
        for (const [rr, w, c, al] of [[R - th * 0.5, th * 1.2, STORML[3], 0.38], [R - th * 0.35, th * 0.7, STORML[2], 0.72], [R - 3, 7, STORML[1], 0.95], [R - 1.5, 3, STORML[0], 1]]) {
          ctx.save();
          ctx.globalAlpha *= al * a * (0.45 + 0.55 * v);
          ctx.strokeStyle = c;
          ctx.lineWidth = w;
          ctx.beginPath();
          ctx.arc(cx, cy, rr, a0 + (a1 - a0) * u, a0 + (a1 - a0) * (u + 1 / N));
          ctx.stroke();
          ctx.restore();
        }
      }
      // Crackles off the edge near its head, and a spark flash at the tip.
      const hu = head;
      for (let j = 0; j < 3; j++) {
        const u = Math.max(tail, hu - 0.12 - j * 0.16);
        if (u <= tail + 0.02) continue;
        const ang = a0 + (a1 - a0) * u;
        const x0 = cx + Math.cos(ang) * R;
        const y0 = cy + Math.sin(ang) * R;
        const out = 14 + 10 * ((i + j) % 2);
        tgThunder(ctx, tgZig(x0, y0, x0 + Math.cos(ang) * out + Math.cos(ang + 1.6) * 6, y0 + Math.sin(ang) * out + Math.sin(ang + 1.6) * 6, 3, 5, 3001 + j * 10 + i * 0.3), 2, a);
      }
      if (i >= 1 && i <= 3) tgFlash(ctx, cx + Math.cos(a1) * R, cy + Math.sin(a1) * R, 12 * (1 - (i - 1) * 0.28), 1);
    },
  };
  // The spin (a whirl all round him), in his storm light.
  E.spinstorm = asLight(spin(TGS), TGS);

  // His mark on a monster: a white-gold flash, short forked bolts lashing out and dying back, a ring
  // of static opening, and sparks flying off and falling.
  E.tghit = (() => {
    const n = 22;
    const c = 120;
    return {
      w: 240, h: 240, n, fps: 48, px: c, py: c,
      draw(ctx, i) {
        const k = i / (n - 1);
        const ring = smooth(win(k, 0.04, 0.7));
        if (ring > 0 && ring < 1) celRing(ctx, TGS, c, c, 22 + 70 * ring, 12 * (1 - ring) + 3, { broken: 0.2 + ring * 0.7, seed: 3011 });
        const lash = swell(k, 0, 0.45);
        if (lash > 0.02) {
          const R = mrng(3012 + i * 0.16);
          for (let j = 0; j < 5; j++) {
            const ang = (j / 5) * TAU + R() * 0.6;
            const len = (40 + R() * 40) * lash;
            tgThunder(ctx, tgPath(c, c, c + Math.cos(ang) * len, c + Math.sin(ang) * len, 3013 + j * 10 + i * 0.16, 0.5), 2.6 * lash + 0.6, 1);
          }
        }
        tgSparks(ctx, c, c, -Math.PI / 2, 4, 10, 100, win(k, 0, 0.95), 3014);
        if (k < 0.5) tgFlash(ctx, c, c, 22 * swell(k, 0, 0.5), 1);
      },
    };
  })();
  // The crackle a jumping bolt leaves on the monster it reaches.
  E.tgspark = (() => {
    const n = 16;
    const c = 70;
    return {
      w: 140, h: 140, n, fps: 40, px: c, py: c,
      draw(ctx, i) {
        const k = i / (n - 1);
        tgCrackle(ctx, c, c, 46 * (0.6 + 0.4 * k), 4, 3021 + i * 0.16, 1 - win(k, 0.5, 1), 2.2);
        if (k < 0.5) tgFlash(ctx, c, c, 14 * swell(k, 0, 0.5), 1);
        tgSparks(ctx, c, c, -Math.PI / 2, 4, 5, 50, win(k, 0, 0.95), 3022);
      },
    };
  })();
  // A bolt jumping between two monsters (100 px long, laid along the line between them and stretched
  // to fit): it strikes across in a few frames, flickers and dies away.
  E.tgchain = (() => {
    const n = 12;
    const L = 300;
    const cy = 60;
    return {
      w: L + 20, h: 120, n, fps: 40, px: 0, py: cy,
      draw(ctx, i) {
        const k = i / (n - 1);
        const reach = smooth(win(k, 0, 0.2));
        const fade = 1 - smooth(win(k, 0.45, 1));
        tgFork(ctx, 6, cy, 6 + (L - 6) * reach, cy, 4 * fade + 1, 3031 + i * 0.16, 2, fade, 0.22);
        if (reach >= 1) tgFlash(ctx, L, cy, 16 * fade, fade);
        tgFlash(ctx, 6, cy, 10 * fade, fade);
      },
    };
  })();
  // A spark streak behind a lunge (from his hands out to the end of its reach, 100 px): a thin bolt
  // racing out ahead and crackling, leaving sparks to fall.
  E.tgdart = (() => {
    const n = 16;
    const L = 300;
    const cy = 60;
    return {
      w: L + 30, h: 140, n, fps: 48, px: 0, py: cy,
      draw(ctx, i) {
        const k = i / (n - 1);
        const head = smooth(win(k, 0, 0.35));
        const tail = smooth(win(k, 0.2, 0.85));
        if (head - tail > 0.03) {
          const pts = tgPath(L * tail, cy, L * head, cy, 3041 + i * 0.16, 0.12);
          tgThunder(ctx, pts, 4 * (1 - tail) + 1, 1);
          for (let j = 0; j < 3; j++) speedLine(ctx, TGS, L * tail + j * 20, cy - 14 + j * 14, L * head - 30, cy - 12 + j * 12, 2.4 * (1 - tail));
        }
        tgSparks(ctx, L * 0.9, cy, 0, 1.6, 8, 70, win(k, 0.2, 1), 3042);
        if (head < 1) tgFlash(ctx, L * head, cy, 12, 1);
      },
    };
  })();
  // A static burst (his shoulder check): a crackling ball bursting out from the point of contact.
  E.tgburst = (() => {
    const n = 18;
    const c = 110;
    return {
      w: 220, h: 220, n, fps: 40, px: c, py: c,
      draw(ctx, i) {
        const k = i / (n - 1);
        const burst = smooth(win(k, 0, 0.5));
        tgCrackle(ctx, c, c, 30 + 70 * burst, 7, 3051 + i * 0.16, 1 - win(k, 0.5, 1), 2.8);
        const ring = smooth(win(k, 0.05, 0.8));
        if (ring > 0 && ring < 1) celRing(ctx, TGS, c, c, 20 + 76 * ring, 10 * (1 - ring) + 2, { broken: ring * 0.8, seed: 3052 });
        if (k < 0.45) tgFlash(ctx, c, c, 28 * swell(k, 0, 0.45), 1);
        tgSparks(ctx, c, c, -Math.PI / 2, 3.6, 8, 80, win(k, 0, 0.95), 3053);
      },
    };
  })();
  // Lightning crawling along the floor (his low sweep; on the floor at `py`, about 100 px wide):
  // bolts snaking along the ground, sparks hopping off it, a glow on the floor under them.
  E.tgfloor = (() => {
    const n = 22;
    const c = 160;
    const gy = 120;
    return {
      w: 320, h: 140, n, fps: 40, px: c, py: gy,
      draw(ctx, i) {
        const k = i / (n - 1);
        const spread = smooth(win(k, 0, 0.4));
        const fade = 1 - smooth(win(k, 0.55, 1));
        ctx.save();
        ctx.globalAlpha = 0.35 * fade;
        ctx.beginPath();
        ctx.ellipse(c, gy, 150 * spread + 10, 14, 0, 0, TAU);
        ctx.fillStyle = TGS[2];
        ctx.fill();
        ctx.restore();
        for (const s of [-1, 1]) {
          const x1 = c + s * 150 * spread;
          const pts = tgPath(c, gy - 4, x1, gy - 6, 3061 + (s > 0 ? 0 : 40) + i * 0.16, 0.3);
          tgThunder(ctx, pts.map(([x, y]) => [x, Math.min(gy - 2, y)]), 4.2 * fade + 0.8, fade);
        }
        const R = rng(3062);
        for (let j = 0; j < 6; j++) {
          const x = c + (R() - 0.5) * 280 * spread;
          const st = R() * 0.4;
          tgSparks(ctx, x, gy - 4, -Math.PI / 2, 1.2, 2, 40, win(k, st, st + 0.5), 3063 + j);
        }
      },
    };
  })();
  // A ring of static racing out round his feet (a spin; on the floor at `py`, out to 80 px):
  // crackling along it, sparks hopping up off it.
  E.tgring = (() => {
    const n = 20;
    const c = 260;
    const gy = 100;
    return {
      w: 520, h: 200, n, fps: 40, px: c, py: gy,
      draw(ctx, i) {
        const k = i / (n - 1);
        const u = smooth(win(k, 0, 0.75));
        tgRing(ctx, c, gy, 40 + 200 * u, 14 * (1 - u) + 3, 1 - win(k, 0.4, 1), 3071 + i * 0.16, { crackle: 5 });
        tgSparks(ctx, c, gy - 4, -Math.PI / 2, 2.6, 10, 90, win(k, 0, 0.9), 3072);
      },
    };
  })();
  // A bolt beam (his charged thrust; level out from his hands to its reach, 120 px): a thick bolt
  // that strikes out straight in a few frames, a ring of static at its root, crackles round it.
  E.tgbeam = (() => {
    const n = 18;
    const L = 360;
    const cy = 60;
    return {
      w: L + 30, h: 120, n, fps: 40, px: 0, py: cy,
      draw(ctx, i) {
        const k = i / (n - 1);
        const reach = smooth(win(k, 0, 0.22));
        const fade = 1 - smooth(win(k, 0.4, 1));
        tgFork(ctx, 8, cy, 8 + (L - 8) * reach, cy, 5.5 * fade + 1.2, 3081 + i * 0.16, 3, fade, 0.14);
        const ring = smooth(win(k, 0, 0.6));
        if (ring < 1) {
          ctx.save();
          ctx.globalAlpha = 1 - ring;
          ctx.translate(16, cy);
          ctx.scale(0.35, 1);
          celRing(ctx, TGS, 0, 0, 14 + 30 * ring, 8, { seed: 3082 });
          ctx.restore();
        }
        if (reach >= 1) tgFlash(ctx, L, cy, 18 * fade, fade);
        tgSparks(ctx, L, cy, 0, 2.4, 7, 60, win(k, 0.2, 1), 3083);
      },
    };
  })();
  // A column of lightning rising off the floor (his rising cut and skyward uppercut; on the floor
  // at `py`, about 110 px tall): two bolts twisting up round each other, the ground flashing under
  // them, sparks flung off.
  E.tgcolumn = (() => {
    const n = 22;
    const c = 110;
    const gy = 360;
    const H = 330;
    return {
      w: 220, h: 380, n, fps: 40, px: c, py: gy,
      draw(ctx, i) {
        const k = i / (n - 1);
        const up = smooth(win(k, 0, 0.3));
        const fade = 1 - smooth(win(k, 0.45, 1));
        tgRing(ctx, c, gy, 30 + 70 * smooth(win(k, 0, 0.7)), 8, 1 - win(k, 0.3, 1), 3091, { crackle: 3 });
        for (let j = 0; j < 2; j++) {
          const pts = [];
          for (let q = 0; q <= 12; q++) {
            const u = q / 12;
            const ph = u * Math.PI * 2.4 + j * Math.PI + k * 6;
            pts.push([c + Math.sin(ph) * 22 * (1 - u * 0.5) + 6 * Math.sin(i * 0.45 + q * 2.1 + j * 1.7), gy - 6 - u * H * up]);
          }
          tgThunder(ctx, pts, (4.6 - j * 1.6) * fade + 1, fade);
        }
        if (up < 1) tgFlash(ctx, c, gy - H * up, 16, 1);
        tgSparks(ctx, c, gy - H * 0.6, -Math.PI / 2, 2.8, 10, 120, win(k, 0.25, 1), 3092);
        if (k < 0.3) tgFlash(ctx, c, gy - 6, 26 * swell(k, 0, 0.3), 1);
      },
    };
  })();
  // A bolt called down out of the sky (a finisher's; on the floor where it strikes, about 200 px
  // tall): a dim leader flickers down, the main bolt cracks into the floor, forks and flickers, the
  // ground flashes white, a ring of static races out, sparks fly, and it dies away into an
  // afterglow.
  E.tgbolt = (() => {
    const n = 30;
    const c = 180;
    const gy = 620;
    return {
      w: 360, h: 640, n, fps: 40, px: c, py: gy,
      draw(ctx, i) {
        const k = i / (n - 1);
        const lead = win(k, 0, 0.12);
        const strike = win(k, 0.1, 0.18);
        const fade = 1 - smooth(win(k, 0.3, 0.85));
        if (k < 0.12) {
          const pts = tgPath(c + 20, 0, c + 20 - 20 * lead, gy * lead, 3101, 0.3);
          tgThunder(ctx, pts, 2, 0.5);
        }
        if (strike > 0 && fade > 0.02) {
          const flick = (0.92 + 0.08 * Math.sin(i * 1.1)) * fade;
          tgFork(ctx, c + 20, 0, c, gy - 4, 6.5 * fade + 1.5, 3102 + i * 0.12, 4, flick, 0.3);
        }
        const land = win(k, 0.12, 1);
        if (land > 0) {
          if (land < 0.3) tgFlash(ctx, c, gy - 10, 40 * swell(land, 0, 0.3), 1);
          tgRing(ctx, c, gy, 30 + 110 * smooth(win(land, 0, 0.7)), 12 * (1 - land) + 3, 1 - win(land, 0.35, 1), 3103, { crackle: 6 });
          tgSparks(ctx, c, gy - 10, -Math.PI / 2, 2.8, 12, 130, win(land, 0, 0.9), 3104);
          tgCrackle(ctx, c, gy - 10, 60, 4, 3105 + i * 0.12, 1 - win(land, 0.2, 0.8), 2.4);
          ctx.save();
          ctx.globalAlpha = 0.4 * (1 - win(land, 0.3, 1));
          ctx.beginPath();
          ctx.ellipse(c, gy, 90, 16, 0, 0, TAU);
          ctx.fillStyle = TGB[1];
          ctx.fill();
          ctx.restore();
        }
      },
    };
  })();
  // The thunderclap (a finisher's cleave into the floor, his slam; on the floor where it lands):
  // a dome of white light bursts up off the floor, two rings race out across it crackling,
  // lightning cracks run out along the ground, and sparks rain.
  E.tgclap = (() => {
    const n = 30;
    const c = 320;
    const gy = 270;
    return {
      w: 640, h: 300, n, fps: 40, px: c, py: gy,
      draw(ctx, i) {
        const k = i / (n - 1);
        const dome = swell(k, 0, 0.35);
        if (dome > 0) {
          ctx.save();
          for (const [f, col, al] of [[1, TGS[2], 0.25], [0.7, TGB[1], 0.5], [0.4, '#ffffff', 0.85]]) {
            ctx.globalAlpha = al * dome;
            ctx.beginPath();
            ctx.ellipse(c, gy, 150 * f * (0.6 + 0.4 * dome), 110 * f * (0.6 + 0.4 * dome), 0, Math.PI, TAU);
            ctx.fillStyle = col;
            ctx.fill();
          }
          ctx.restore();
        }
        for (let j = 0; j < 2; j++) {
          const u = smooth(win(k, j * 0.1, 0.75 + j * 0.1));
          if (u > 0 && u < 1) tgRing(ctx, c, gy, 40 + 260 * u, 16 * (1 - u) + 3, 1 - win(u, 0.4, 1), 3111 + j, { crackle: 5, pal: j ? TGB : TGS });
        }
        const crack = smooth(win(k, 0.02, 0.35));
        const fade = 1 - smooth(win(k, 0.4, 0.9));
        for (const s of [-1, 1]) {
          const pts = tgPath(c, gy - 4, c + s * 280 * crack, gy - 8, 3113 + (s > 0 ? 0 : 30) + i * 0.16, 0.12);
          tgThunder(ctx, pts.map(([x, y]) => [x, Math.min(gy - 2, y)]), 4.5 * fade + 0.6, fade);
        }
        tgSparks(ctx, c, gy - 20, -Math.PI / 2, 2.6, 18, 200, win(k, 0, 0.95), 3114);
      },
    };
  })();
  // The flash cut's streak (out of a run; along the way he came, ending where he is): a long bolt
  // drawn the length of his dash, an afterimage band of light fading behind it.
  E.tgflash = (() => {
    const n = 18;
    const L = 300;
    const cy = 70;
    return {
      w: L + 40, h: 140, n, fps: 40, px: 10, py: cy,
      draw(ctx, i) {
        const k = i / (n - 1);
        const fade = 1 - smooth(win(k, 0.1, 1));
        const tail = smooth(win(k, 0, 0.8));
        ctx.save();
        ctx.globalAlpha = 0.45 * fade;
        fill(ctx, [[10 + L * tail, cy - 10], [10 + L, cy - 20], [10 + L, cy + 20], [10 + L * tail, cy + 10]], TGS[2]);
        ctx.globalAlpha = 0.7 * fade;
        fill(ctx, [[10 + L * tail, cy - 3], [10 + L, cy - 7], [10 + L, cy + 7], [10 + L * tail, cy + 3]], TGB[1]);
        ctx.restore();
        tgFork(ctx, 10 + L * tail, cy, 10 + L, cy, 3.6 * fade + 1, 3121 + i * 0.16, 3, fade, 0.16);
        tgSparks(ctx, 10 + L * 0.5, cy, Math.PI, 2, 10, 80, win(k, 0, 0.9), 3122);
      },
    };
  })();
  // A spark of static (his aura's, crackling up round him as Charge builds; loops).
  E.tgmote = (() => {
    const n = 24;
    return {
      w: 70, h: 70, n, fps: 24, px: 35, py: 35, loop: true,
      draw(ctx, i) {
        const ph = i / n;
        const on = 0.5 + 0.5 * Math.sin(ph * TAU * 2);
        tgCrackle(ctx, 35, 35, 22, 2, loopSeed(3131, i, n), 0.6 + 0.4 * on, 1.8);
        tgFlash(ctx, 35, 35, 6 + 3 * on, 1);
      },
    };
  })();
  // Overcharge's static shell (loops; round him, from his feet at `py`): no bubble round him (that's
  // the Tide Mage's), just the storm on his skin: arcs of static crackling up both sides of him and
  // over his head, jumping and re-forming, a crackling ring on the floor, sparks winking on.
  E.tgshell = (() => {
    const n = 24;
    const c = 140;
    const gy = 320;
    return {
      w: 280, h: 340, n, fps: 24, px: c, py: gy, loop: true,
      draw(ctx, i) {
        const ph = i / n;
        tgRing(ctx, c, gy, 96, 6, 0.75, loopSeed(3141, i, n), { crackle: 3 });
        tgDome(ctx, c, gy - 10, 82, 230, 4, loopSeed(3142, i, n), 2.6, 0.95);
        for (let j = 0; j < 3; j++) {
          const a = ph * TAU * 2 + j * 2.1;
          tgFlash(ctx, c + Math.cos(a) * 60, gy - 130 + Math.sin(a * 1.3) * 100, 5 + 3 * Math.sin(a * 3), 1);
        }
      },
    };
  })();

  // ---------- The Thunderguard's skills ----------
  // Thunder Rush (along his dash, 140 px from where it's put): a long forked bolt torn along his path,
  // a band of light fading behind him, flashes where he passed through them, sparks falling.
  E.tgrush = (() => {
    const n = 22;
    const L = 420;
    const cy = 80;
    return {
      w: L + 40, h: 160, n, fps: 40, px: 10, py: cy,
      draw(ctx, i) {
        const k = i / (n - 1);
        const head = smooth(win(k, 0, 0.3));
        const tail = smooth(win(k, 0.15, 0.95));
        const fade = 1 - smooth(win(k, 0.5, 1));
        if (head - tail > 0.02) {
          ctx.save();
          ctx.globalAlpha = 0.4 * fade;
          fill(ctx, [[10 + L * tail, cy - 8], [10 + L * head, cy - 26], [10 + L * head, cy + 26], [10 + L * tail, cy + 8]], TGS[2]);
          ctx.globalAlpha = 0.75 * fade;
          fill(ctx, [[10 + L * tail, cy - 2], [10 + L * head, cy - 8], [10 + L * head, cy + 8], [10 + L * tail, cy + 2]], TGB[1]);
          ctx.restore();
          tgFork(ctx, 10 + L * tail, cy, 10 + L * head, cy - 4, 5 * fade + 1.2, 3201 + i * 0.16, 4, fade, 0.2);
          for (let j = 0; j < 4; j++) speedLine(ctx, TGS, 10 + L * tail + j * 30, cy - 30 + j * 20, 10 + L * head - 40, cy - 28 + j * 18, 3 * fade);
        }
        for (let j = 0; j < 3; j++) {
          const x = 10 + L * (0.3 + j * 0.22);
          const at = 0.06 + j * 0.07;
          if (k > at && k < at + 0.4) tgFlash(ctx, x, cy, 22 * swell(k, at, at + 0.4), 1);
          tgSparks(ctx, x, cy, -Math.PI / 2, 3, 6, 70, win(k, at, at + 0.6), 3202 + j);
        }
      },
    };
  })();
  // Storm Cleave's crescent in flight (loops; toward +x at chest height): a great crescent of
  // lightning standing on its tips, belly forward, its edge white-gold, bolts crackling round it,
  // sparks streaming off behind.
  E.tgwave = (() => {
    const n = 20;
    const cx = 120;
    const cy = 140;
    const R0 = 120;
    return {
      w: 300, h: 280, n, fps: 40, px: cx + 60, py: cy, loop: true,
      draw(ctx, i) {
        const ph = i / n;
        for (let j = 0; j < 4; j++) {
          const u = (ph * 2 + j / 4) % 1;
          speedLine(ctx, TGS, cx - 20 - u * 90, cy - 80 + j * 52, cx + 30 - u * 60, cy - 76 + j * 50, 4 * (1 - u));
        }
        // The crescent: blur bands graded out to a hot edge, as his slash is.
        for (let k = 0; k <= 28; k++) {
          const t = lerp(-1.15, 1.15, k / 28);
          const t2 = lerp(-1.15, 1.15, (k + 1) / 28);
          const th = 44 * Math.cos((t / 1.15) * (Math.PI / 2)) + 4;
          for (const [rr, w, c, al] of [[R0 - th * 0.5, th, STORML[3], 0.42], [R0 - th * 0.3, th * 0.6, STORML[2], 0.75], [R0 - 3, 8, STORML[1], 0.95], [R0 - 1.5, 3.5, STORML[0], 1]]) {
            ctx.save();
            ctx.globalAlpha = al;
            ctx.strokeStyle = c;
            ctx.lineWidth = w;
            ctx.beginPath();
            ctx.arc(cx, cy, rr, t, t2 + 0.01);
            ctx.stroke();
            ctx.restore();
          }
        }
        const R = mrng(loopSeed(3211, i, n));
        for (let j = 0; j < 4; j++) {
          const t = lerp(-1, 1, R());
          const x0 = cx + Math.cos(t) * R0;
          const y0 = cy + Math.sin(t) * R0;
          const len = 24 + R() * 26;
          tgThunder(ctx, tgZig(x0, y0, x0 + Math.cos(t) * len, y0 + Math.sin(t) * len + (R() - 0.5) * 20, 3, 8, sadd(loopSeed(3212, i, n), j * 10)), 2.2, 1);
        }
        tgThunder(ctx, tgPath(cx + Math.cos(-1.05) * (R0 - 20), cy + Math.sin(-1.05) * (R0 - 20), cx + Math.cos(1.05) * (R0 - 20), cy + Math.sin(1.05) * (R0 - 20), loopSeed(3213, i, n), 0.3), 2.6, 0.85);
        tgSparks(ctx, cx - 30, cy, Math.PI, 1.6, 8, 90, (ph * 2) % 1, 3214);
        tgFlash(ctx, cx + R0, cy, 14 + 4 * Math.sin(ph * TAU * 2), 1);
      },
    };
  })();
  // Cyclone Edge (round him, on the floor at `py`, played over the whole spin): a storm wheeling
  // round him, bands of storm light whirling flat round his waist, bolts lashing out from it and up
  // into the air, a crackling ring on the floor, sparks flung off it.
  E.tgcyclone = (() => {
    const n = 40;
    const c = 300;
    const gy = 330;
    return {
      w: 600, h: 360, n, fps: 40, px: c, py: gy,
      draw(ctx, i) {
        const k = i / (n - 1);
        const grow = smooth(win(k, 0, 0.15)) * (1 - smooth(win(k, 0.85, 1)));
        const spin = k * 7;
        tgRing(ctx, c, gy, 120 + 60 * grow, 10, grow, 3221 + i * 0.16, { crackle: 5 });
        for (let j = 0; j < 3; j++) {
          const yy = gy - 50 - j * 34;
          const rx = (170 - j * 26) * grow;
          ctx.save();
          ctx.translate(c, yy);
          ctx.scale(1, 0.28);
          for (let b = 0; b < 2; b++) {
            const a0 = spin * TAU + j * 1.3 + b * Math.PI;
            for (const [w, col, al] of [[26, TGS[3], 0.3], [14, TGS[2], 0.6], [6, TGB[1], 0.95], [2.5, '#ffffff', 1]]) {
              ctx.globalAlpha = al * grow;
              ctx.strokeStyle = col;
              ctx.lineWidth = w;
              ctx.lineCap = 'round';
              ctx.beginPath();
              ctx.arc(0, 0, rx, a0, a0 + 1.9);
              ctx.stroke();
            }
          }
          ctx.restore();
        }
        const R = mrng(3222 + i * 0.16);
        for (let j = 0; j < 4; j++) {
          const a = R() * TAU;
          const x0 = c + Math.cos(a) * 150 * grow;
          const y0 = gy - 60 + Math.sin(a) * 40;
          tgThunder(ctx, tgPath(x0, y0, x0 + Math.cos(a) * 60, y0 - 70 - R() * 80, 3223 + j * 10 + i * 0.16, 0.4), 2.8 * grow, grow);
        }
        tgSparks(ctx, c, gy - 80, -Math.PI / 2, 4, 14, 180, (k * 3) % 1, 3224 + Math.floor(k * 3));
      },
    };
  })();
  // Lightning Rod's call (at the planted blade, on the floor ahead of him): the floor glows round
  // the point, static climbs the blade, a column of light shoots up off it into the sky.
  E.tgrodfx = (() => {
    const n = 28;
    const c = 120;
    const gy = 500;
    return {
      w: 240, h: 520, n, fps: 40, px: c, py: gy,
      draw(ctx, i) {
        const k = i / (n - 1);
        const up = smooth(win(k, 0.1, 0.35));
        const fade = 1 - smooth(win(k, 0.55, 1));
        tgRing(ctx, c, gy, 40 + 60 * smooth(win(k, 0, 0.6)), 8, fade, 3231, { crackle: 3 });
        ctx.save();
        for (const [w, col, al] of [[60, TGS[2], 0.18], [30, TGB[1], 0.35], [10, '#ffffff', 0.8]]) {
          ctx.globalAlpha = al * fade;
          fill(ctx, [[c - w / 2, gy], [c + w / 2, gy], [c + w / 4, gy - 480 * up], [c - w / 4, gy - 480 * up]], col);
        }
        ctx.restore();
        tgCrackle(ctx, c, gy - 40, 50, 4, 3232 + i * 0.16, fade, 2.4);
        if (up < 1 && up > 0) tgFlash(ctx, c, gy - 480 * up, 18, 1);
      },
    };
  })();
  // Thunderclap's (and Thunderfall's) bigger clap, and Thunderfall's giant bolt.
  E.tgclapbig = grown(E.tgclap, 1.45);
  E.tgboltbig = grown(E.tgbolt, 1.3);
  // Static Guard's shell (loops while it lasts; round him from his feet): the shell of static at
  // its fiercest, arcs crackling up both sides and over him, more and brighter than Overcharge's.
  E.tgguardshell = (() => {
    const n = 24;
    const c = 150;
    const gy = 340;
    return {
      w: 300, h: 360, n, fps: 24, px: c, py: gy, loop: true,
      draw(ctx, i) {
        const ph = i / n;
        tgRing(ctx, c, gy, 106, 9, 0.9, loopSeed(3241, i, n), { crackle: 4, pal: TGB });
        tgDome(ctx, c, gy - 10, 92, 250, 7, loopSeed(3242, i, n), 3.4, 1);
        tgDome(ctx, c, gy - 10, 80, 236, 3, loopSeed(3290, i, n), 2.2, 0.8);
        for (let j = 0; j < 4; j++) {
          const a = ph * TAU * 2 + j * 1.6;
          tgFlash(ctx, c + Math.cos(a) * 66, gy - 140 + Math.sin(a * 1.3) * 110, 6 + 3 * Math.sin(a * 3), 1);
        }
      },
    };
  })();
  // Thunderfall's storm (over him, played as he rises and hangs; from his feet at `py`): dark storm
  // clouds boiling together high over him, lit from inside by flickers of lightning, bolts jumping
  // between them.
  E.tgstormcloud = (() => {
    const n = 36;
    const c = 360;
    const gy = 700;
    const top = 120;
    return {
      w: 720, h: 720, n, fps: 30, px: c, py: gy,
      draw(ctx, i) {
        const k = i / (n - 1);
        const gather = smooth(win(k, 0, 0.4)) * (1 - smooth(win(k, 0.82, 1)));
        if (gather <= 0.01) return;
        const R = rng(3261);
        for (let j = 0; j < 14; j++) {
          const ang = R() * TAU;
          const d0 = 260 + R() * 80;
          const d = d0 * (1 - 0.75 * gather);
          const x = c + Math.cos(ang) * d;
          const y = top + Math.sin(ang) * d * 0.25;
          const r = (50 + R() * 40) * (0.5 + 0.5 * gather);
          ctx.save();
          ctx.globalAlpha = 0.9 * gather;
          puff(ctx, TGN, x, y, r, 3262 + j, { lobes: 5 });
          ctx.restore();
        }
        const flick = 0.7 + 0.3 * Math.sin(i * 0.9);
        ctx.save();
        ctx.globalAlpha = 0.35 * gather * flick;
        ctx.beginPath();
        ctx.ellipse(c, top, 160 * gather, 60 * gather, 0, 0, TAU);
        ctx.fillStyle = TGS[1];
        ctx.fill();
        ctx.restore();
        if (gather > 0.4) {
          const Q = mrng(3263 + i * 0.16);
          for (let j = 0; j < 2; j++) {
            const x0 = c - 120 + Q() * 240;
            tgThunder(ctx, tgPath(x0, top - 10, x0 + (Q() - 0.5) * 160, top + 20 + Q() * 30, 3264 + j * 10 + i * 0.16, 0.4), 2.4 * gather, gather * flick);
          }
        }
      },
    };
  })();

  // ---------- The Tempest (the Thunderguard's damage path; docs/design/tempest.md) ----------
  // Red lightning, speed itself. His bolts are the Thunderguard's kit in his palette (`redPal` swaps
  // it in while he draws): a white-hot core, pale rose, crimson, deep wine, inked in plum. His own
  // shapes: long whipping streaks, flash-steps, slanting speed lines, rings of red streaks.
  const TPB = ['#ffffff', '#ffe0e4', '#ff5a6e', '#d61f45', '#3a0a24'];
  const TPS = ['#ffffff', '#ffd2da', '#ff7a8a', '#c8224a', '#3a0a24'];
  const TPL = ['#ffffff', '#ffe0e4', '#ff7a8a', '#d61f45'];
  function redPal(fn) {
    const keep = [TGB, TGS, STORML];
    TGB = TPB;
    TGS = TPS;
    STORML = TPL;
    try {
      fn();
    } finally {
      [TGB, TGS, STORML] = keep;
    }
  }
  const redlit = (e) => ({ ...e, draw: (ctx, i) => redPal(() => e.draw(ctx, i)) });
  // A streak: a ribbon of red light along `pts` from u0 to u1 (0-1 along it), fattest at its head,
  // thinning to nothing at its tail, with a lightning thread running down its middle.
  function tpStreak(ctx, pts, u0, u1, w, a, seed) {
    if (u1 - u0 < 0.01 || a <= 0) return;
    const at = (u) => {
      const f = u * (pts.length - 1);
      const k = Math.min(pts.length - 2, Math.floor(f));
      return [lerp(pts[k][0], pts[k + 1][0], f - k), lerp(pts[k][1], pts[k + 1][1], f - k)];
    };
    const m = 24;
    const top = [];
    const bot = [];
    for (let j = 0; j <= m; j++) {
      const u = lerp(u0, u1, j / m);
      const [x, y] = at(u);
      const [x2, y2] = at(Math.min(1, u + 0.01));
      const ang = Math.atan2(y2 - y, x2 - x);
      const th = w * Math.pow(j / m, 1.4) + 0.5;
      top.push([x - Math.sin(ang) * th, y + Math.cos(ang) * th]);
      bot.push([x + Math.sin(ang) * th, y - Math.cos(ang) * th]);
    }
    ctx.save();
    ctx.globalAlpha *= a;
    for (const [k, col, al] of [[1.8, TPS[3], 0.25], [1, TPS[2], 0.7], [0.55, TPB[1], 0.95], [0.22, '#ffffff', 1]]) {
      ctx.globalAlpha = a * al;
      const shrink = (p, q) => [lerp(q[0], p[0], k), lerp(q[1], p[1], k)];
      const mid = top.map((p, j) => [(p[0] + bot[j][0]) / 2, (p[1] + bot[j][1]) / 2]);
      fill(ctx, top.map((p, j) => shrink(p, mid[j])).concat(bot.map((p, j) => shrink(p, mid[j])).reverse()), col);
    }
    ctx.restore();
    const thread = [];
    for (let j = 0; j <= 8; j++) thread.push(at(lerp(u0, u1, j / 8)));
    tgThunder(ctx, tgZig(thread[0][0], thread[0][1], thread[8][0], thread[8][1], 6, w * 0.6, seed), Math.max(1, w * 0.18), a);
  }

  // The line's crescent slash and spin in his red.
  E.slashcrimson = redlit({ ...E.slashstorm });
  E.spincrimson = asLight(spin(TPS), TPS);

  // His mark on a monster: two red streaks cross through it in a flash, a small ring of red opening,
  // sparks thrown off the cut and falling.
  E.tphit = redlit((() => {
    const n = 20;
    const c = 120;
    return {
      w: 240, h: 240, n, fps: 48, px: c, py: c,
      draw(ctx, i) {
        const k = i / (n - 1);
        const ring = smooth(win(k, 0.05, 0.7));
        if (ring > 0 && ring < 1) celRing(ctx, TPS, c, c, 18 + 56 * ring, 9 * (1 - ring) + 2, { broken: 0.3 + ring * 0.6, seed: 4011 });
        const cut = (a0, s0, u0, u1, al) => tpStreak(ctx, [[c - Math.cos(a0) * 90, c - Math.sin(a0) * 90], [c + Math.cos(a0) * 90, c + Math.sin(a0) * 90]], u0, u1, 10, al, s0 + i * 0.16);
        cut(-0.6, 4012, smooth(win(k, 0.1, 0.6)), smooth(win(k, 0, 0.3)), 1 - win(k, 0.5, 1));
        cut(0.7, 4013, smooth(win(k, 0.2, 0.7)), smooth(win(k, 0.08, 0.4)), 1 - win(k, 0.55, 1));
        tgSparks(ctx, c, c, -Math.PI / 2, 4, 10, 90, win(k, 0.05, 0.95), 4014);
        if (k < 0.4) tgFlash(ctx, c, c, 16 * swell(k, 0, 0.4), 1);
      },
    };
  })());

  // A streak driven through the line (a lunge, a jab, a flash cut; from his hands out to the reach,
  // 100 px): a long red ribbon racing out ahead, crackling down its middle, slanting speed lines
  // round it, and it thins away from the tail.
  E.tpline = redlit((() => {
    const n = 18;
    const L = 300;
    const cy = 60;
    return {
      w: L + 30, h: 120, n, fps: 48, px: 0, py: cy,
      draw(ctx, i) {
        const k = i / (n - 1);
        const head = smooth(win(k, 0, 0.3));
        const tail = smooth(win(k, 0.2, 0.9));
        tpStreak(ctx, [[0, cy], [L, cy - 4]], tail, head, 12 * (1 - tail * 0.5), 1, 4021 + i * 0.16);
        for (let j = 0; j < 4; j++) {
          const u = win(k, j * 0.06, 0.6 + j * 0.06);
          if (u > 0 && u < 1) speedLine(ctx, TPS, L * (0.1 + u * 0.6), cy - 22 + j * 14, L * (0.3 + u * 0.7), cy - 24 + j * 14, 2.6 * (1 - u));
        }
        tgSparks(ctx, L * head, cy, 0, 1.6, 6, 50, win(k, 0.25, 1), 4022);
        if (head < 1) tgFlash(ctx, L * head, cy, 10, 1);
      },
    };
  })());

  // A flash-step (from where he was to where he is, 100 px long, stretched to fit): a bolt drawn
  // between the two the instant he goes, a ribbon of red light along it fading from the start, and
  // a flash at each end.
  E.tpflashstep = redlit((() => {
    const n = 16;
    const L = 300;
    const cy = 70;
    return {
      w: L + 20, h: 140, n, fps: 40, px: 0, py: cy,
      draw(ctx, i) {
        const k = i / (n - 1);
        const fade = 1 - smooth(win(k, 0.15, 1));
        tpStreak(ctx, [[6, cy], [L, cy]], smooth(win(k, 0, 0.8)), 1, 16 * fade + 2, fade, 4031 + i * 0.16);
        tgFork(ctx, 6, cy, L, cy, 4 * fade + 1, 4032 + i * 0.16, 3, fade, 0.2);
        tgFlash(ctx, 6, cy, 16 * (1 - win(k, 0, 0.5)), 1);
        tgFlash(ctx, L, cy, 20 * fade, 1);
      },
    };
  })());

  // A whirlwind of red streaks (round him, on the floor at `py`): rings of streaks whipping round
  // his waist, flung sparks, a red ring on the floor.
  E.tpwhirlfx = redlit((() => {
    const n = 26;
    const c = 260;
    const gy = 280;
    return {
      w: 520, h: 300, n, fps: 48, px: c, py: gy,
      draw(ctx, i) {
        const k = i / (n - 1);
        const grow = smooth(win(k, 0, 0.2)) * (1 - smooth(win(k, 0.75, 1)));
        tgRing(ctx, c, gy, 100 + 60 * smooth(k), 8, grow, 4041 + i * 0.16, { crackle: 3 });
        for (let j = 0; j < 3; j++) {
          const yy = gy - 46 - j * 26;
          const rx = (150 - j * 20) * (0.7 + 0.3 * grow);
          const a0 = k * TAU * 2.2 + j * 2.1;
          const pts = [];
          for (let q = 0; q <= 20; q++) {
            const t = a0 + (q / 20) * 2.4;
            pts.push([c + Math.cos(t) * rx, yy + Math.sin(t) * rx * 0.28]);
          }
          tpStreak(ctx, pts, 0, 1, 9, grow, 4042 + j * 10 + i * 0.16);
        }
        tgSparks(ctx, c, gy - 70, -Math.PI / 2, 4, 12, 150, (k * 2) % 1, 4043 + Math.floor(k * 2));
      },
    };
  })());

  // His floor sparks, the red bolt his dive lands as, his aura's sparks and Lightspeed's crackle:
  // the Thunderguard's shapes in his red.
  E.tpfloor = redlit(E.tgfloor);
  E.tpbolt = redlit(E.tgbolt);
  E.tpmote = redlit(E.tgmote);
  E.tpshell = redlit(E.tgshell);

  // ---------- The Tempest's skills ----------
  // Crimson Arc's and Crimson Cleave's crescent in flight (loops): a thin, fast crescent of red
  // lightning, sharper than the Thunderguard's, streaks peeling off its back.
  E.tpwave = redlit((() => {
    const n = 18;
    const cx = 110;
    const cy = 130;
    const R0 = 110;
    return {
      w: 280, h: 260, n, fps: 48, px: cx + 60, py: cy, loop: true,
      draw(ctx, i) {
        const ph = i / n;
        for (let j = 0; j < 5; j++) {
          const u = (ph * 2 + j / 5) % 1;
          speedLine(ctx, TPS, cx - 10 - u * 100, cy - 80 + j * 40, cx + 40 - u * 70, cy - 78 + j * 39, 3.4 * (1 - u));
        }
        for (let k = 0; k <= 28; k++) {
          const t = lerp(-1.2, 1.2, k / 28);
          const t2 = lerp(-1.2, 1.2, (k + 1) / 28);
          const th = 26 * Math.pow(Math.cos((t / 1.2) * (Math.PI / 2)), 1.4) + 3;
          for (const [rr, w, c, al] of [[R0 - th * 0.5, th, TPL[3], 0.4], [R0 - th * 0.3, th * 0.6, TPL[2], 0.75], [R0 - 2, 6, TPL[1], 0.95], [R0 - 1, 2.6, TPL[0], 1]]) {
            ctx.save();
            ctx.globalAlpha = al;
            ctx.strokeStyle = c;
            ctx.lineWidth = w;
            ctx.beginPath();
            ctx.arc(cx, cy, rr, t, t2 + 0.01);
            ctx.stroke();
            ctx.restore();
          }
        }
        const R = mrng(loopSeed(4111, i, n));
        for (let j = 0; j < 3; j++) {
          const t = lerp(-1, 1, R());
          const x0 = cx + Math.cos(t) * (R0 - 6);
          const y0 = cy + Math.sin(t) * (R0 - 6);
          tgThunder(ctx, tgZig(x0, y0, x0 - 30 - R() * 30, y0 + (R() - 0.5) * 24, 3, 6, sadd(loopSeed(4112, i, n), j * 10)), 1.6, 0.9);
        }
        tgFlash(ctx, cx + R0, cy, 10 + 3 * Math.sin(ph * TAU * 2), 1);
      },
    };
  })());
  // Thousand Cuts (out in front of him, at chest height): a blur of red streaks crossing every way
  // through the space ahead, appearing and thinning away one after another, sparks spraying.
  E.tpcuts = redlit((() => {
    const n = 36;
    const c = 160;
    const cy = 120;
    const Q = rng(4121);
    const CUTS = Array.from({ length: 14 }, (_, j) => ({ at: 0.04 + j * 0.055, a: Q() * Math.PI, len: 120 + Q() * 70, ox: (Q() - 0.5) * 80, oy: (Q() - 0.5) * 70 }));
    return {
      w: 320, h: 240, n, fps: 40, px: c, py: cy,
      draw(ctx, i) {
        const k = i / (n - 1);
        for (const [j, cut] of CUTS.entries()) {
          const u = (k - cut.at) / 0.22;
          if (u <= 0 || u >= 1) continue;
          const x0 = c + cut.ox - Math.cos(cut.a) * cut.len * 0.5;
          const y0 = cy + cut.oy - Math.sin(cut.a) * cut.len * 0.5;
          const x1 = c + cut.ox + Math.cos(cut.a) * cut.len * 0.5;
          const y1 = cy + cut.oy + Math.sin(cut.a) * cut.len * 0.5;
          tpStreak(ctx, [[x0, y0], [x1, y1]], smooth(win(u, 0.3, 1)), smooth(win(u, 0, 0.35)), 9, 1 - win(u, 0.6, 1), 4122 + j * 10 + i * 0.16);
        }
        tgSparks(ctx, c + 40, cy, -0.4, 3, 14, 110, (k * 3) % 1, 4123 + Math.floor(k * 3));
      },
    };
  })());
  // Red Rush's and Flash Step's streak (along the way he came, 140 px): a long red ribbon torn along
  // his path, his afterimage streaks strung out along it, flashes where he passed through them.
  E.tprush = redlit((() => {
    const n = 22;
    const L = 420;
    const cy = 80;
    return {
      w: L + 40, h: 160, n, fps: 40, px: 10, py: cy,
      draw(ctx, i) {
        const k = i / (n - 1);
        const head = smooth(win(k, 0, 0.25));
        const tail = smooth(win(k, 0.12, 0.95));
        tpStreak(ctx, [[10, cy], [10 + L, cy - 6]], tail, head, 22 * (1 - tail * 0.5), 1 - win(k, 0.6, 1), 4131 + i * 0.16);
        for (let j = 0; j < 3; j++) tpStreak(ctx, [[10, cy - 26 + j * 26], [10 + L * 0.9, cy - 28 + j * 26]], Math.min(1, tail + 0.1 * j), Math.min(1, head * (0.9 - j * 0.05)), 6, 0.6 * (1 - win(k, 0.5, 1)), 4132 + j * 10 + i * 0.16);
        for (let j = 0; j < 3; j++) {
          const x = 10 + L * (0.3 + j * 0.22);
          const at = 0.05 + j * 0.07;
          if (k > at && k < at + 0.35) tgFlash(ctx, x, cy, 18 * swell(k, at, at + 0.35), 1);
          tgSparks(ctx, x, cy, -Math.PI / 2, 3, 5, 60, win(k, at, at + 0.6), 4133 + j);
        }
      },
    };
  })());
  // A flash of red (the moment he blurs or comes out of a rush): a red burst of light, a ring
  // opening, short streaks flung out all round.
  E.tpflashburst = redlit((() => {
    const n = 18;
    const c = 110;
    return {
      w: 220, h: 220, n, fps: 40, px: c, py: c,
      draw(ctx, i) {
        const k = i / (n - 1);
        const ring = smooth(win(k, 0, 0.7));
        if (ring < 1) celRing(ctx, TPS, c, c, 20 + 70 * ring, 8 * (1 - ring) + 2, { broken: ring * 0.8, seed: 4141 });
        for (let j = 0; j < 8; j++) {
          const a = (j / 8) * TAU + 0.3;
          const u = smooth(win(k, 0, 0.6));
          tpStreak(ctx, [[c + Math.cos(a) * 14, c + Math.sin(a) * 14], [c + Math.cos(a) * 90, c + Math.sin(a) * 90]], u * 0.6, u, 6, 1 - win(k, 0.4, 1), 4142 + j * 10);
        }
        if (k < 0.4) tgFlash(ctx, c, c, 26 * swell(k, 0, 0.4), 1);
      },
    };
  })());
  // Warcry's clap, Afterburn's blur, Skyfall's red storm and bolt: the Thunderguard's shapes in red.
  E.tpclapbig = redlit(E.tgclapbig);
  E.tpguardshell = redlit(E.tgguardshell);
  E.tpstormcloud = redlit(E.tgstormcloud);
  E.tpboltbig = redlit(E.tgboltbig);

  // ---------- The Stormwall (the Thunderguard's tank path; docs/design/stormwall.md) ----------
  // The storm as a fortress: deep storm indigo, rain silver, heavy white-gold lightning, cloud
  // grey-violet. His bolts are the Thunderguard's kit in his palette (`wallPal`); his own shapes are
  // thunderheads, curtains of rain, rings of lightning pillars, plates of static locking into a
  // shield, and field lines that drag.
  const BWB = ['#ffffff', '#fff1c4', '#ffcf5a', '#4b4fae', '#141433'];
  const BWS = ['#ffffff', '#d8dcff', '#9aa2f0', '#4a4fb0', '#141433'];
  const BWL = ['#ffffff', '#ffe9a8', '#9aa2f0', '#3a3f9e'];
  const BWC = ['#8e8ec8', '#5c5a9c', '#3e3c78', '#262452', '#100f2c'];
  const RAIN = ['#ffffff', '#e6ecff', '#b8c4f0', '#7a86c8', '#2c3270'];
  function wallPal(fn) {
    const keep = [TGB, TGS, STORML];
    TGB = BWB;
    TGS = BWS;
    STORML = BWL;
    try {
      fn();
    } finally {
      [TGB, TGS, STORML] = keep;
    }
  }
  const walllit = (e) => ({ ...e, draw: (ctx, i) => wallPal(() => e.draw(ctx, i)) });
  // Rain: a slanting streak of rain from (x, y) of length l.
  function rainStreak(ctx, x, y, l, a = 1) {
    ctx.save();
    ctx.globalAlpha *= a;
    strokePts(ctx, [[x, y], [x - l * 0.22, y + l]], 3.4, RAIN[3], 0.5);
    strokePts(ctx, [[x, y], [x - l * 0.22, y + l]], 1.6, RAIN[1], 0.95);
    ctx.restore();
  }
  // A storm cloud round (x, y), `w` wide: a bank of the line's cel-shaded puffs (inked, lit from the
  // top left, as Thunderfall's storm is), biggest in the middle, a back row darker behind; drifting
  // with `ph` (0-1, loops), and lit from inside by `lit` (0-1): its middle puffs flare pale gold.
  const BWLIT = ['#fff6d8', '#dcd4ff', '#a49ce8', '#6a66c0', '#16153a'];
  // One mass of cloud from a heap of round lobes (x, y, r): the ink round the whole outline only
  // (every lobe stroked, then every lobe filled over the strokes, so no line shows inside), then the
  // cel bands, each shrunk toward the top left (lit from there), so it reads as one soft body.
  function cloudMass(ctx, bits, pal) {
    const [core, light, mid, deep, ink] = pal;
    const disc = (k, ox, oy, keep = () => true) => {
      ctx.beginPath();
      for (const [x, y, r] of bits) {
        if (!keep(x, y, r)) continue;
        ctx.moveTo(x + ox * r + r * k, y + oy * r);
        ctx.arc(x + ox * r, y + oy * r, r * k, 0, TAU);
      }
    };
    disc(1, 0, 0);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.fillStyle = deep;
    ctx.fill();
    disc(0.9, -0.06, -0.1);
    ctx.fillStyle = mid;
    ctx.fill();
    disc(0.72, -0.14, -0.2);
    ctx.fillStyle = light;
    ctx.fill();
    const topY = Math.min(...bits.map(([, y, r]) => y - r));
    const botY = Math.max(...bits.map(([, y, r]) => y + r));
    disc(0.34, -0.3, -0.34, (x, y) => y < lerp(topY, botY, 0.5));
    ctx.fillStyle = core;
    ctx.fill();
  }
  // A storm cloud round (x, y), `w` wide: big lobes heaped into one mass, widest along its flat dark
  // underside, towering in the middle; drifting with `ph` (0-1, loops), and lit from inside by
  // `lit` (0-1): the whole body flares pale from within, strongest in the middle.
  function thunderhead(ctx, x, y, w, seed, lit = 0, a = 1, ph = 0) {
    const R = rng(seed);
    const n = Math.max(4, Math.round(w / 80));
    const bits = [];
    for (let j = 0; j < n; j++) {
      const u = (j + 0.5) / n - 0.5;
      const bell = 1 - Math.pow(Math.abs(u) * 2, 1.6) * 0.62;
      const r = w * 0.15 * bell * (0.9 + R() * 0.2);
      const d = R() * TAU;
      const bx = x + u * w * 0.78 + Math.sin(ph * TAU + d) * w * 0.01;
      const by = y + w * 0.03 - r * 0.35 + Math.cos(ph * TAU * 2 + d) * w * 0.005;
      bits.push([bx, by, r]);
      for (let q = 0; q < 3; q++) {
        const t = Math.PI + 0.3 + R() * (Math.PI - 0.6) + Math.sin(ph * TAU + d + q) * 0.08;
        bits.push([bx + Math.cos(t) * r * 0.62, by + Math.sin(t) * r * 0.62, r * (0.48 + R() * 0.2)]);
      }
    }
    // (The flat underside: a row of small lobes along the bottom.)
    for (let j = 0; j <= n * 2; j++) bits.push([x + (j / (n * 2) - 0.5) * w * 0.6, y + w * 0.04, w * 0.05]);
    ctx.save();
    ctx.globalAlpha = a;
    cloudMass(ctx, bits, BWC);
    if (lit > 0.02) {
      ctx.globalAlpha = a * 0.55 * lit;
      cloudMass(ctx, bits.filter(([bx]) => Math.abs(bx - x) < w * 0.3), BWLIT);
    }
    ctx.restore();
  }
  // Points along a curve (a quadratic from (x0, y0) through the pull of (cx, cy) to (x1, y1)),
  // jagged into a lightning channel, from u = 0 to u = `to` (0-1) of the way along.
  function bendBolt(x0, y0, cx, cy, x1, y1, n, kink, seed, to = 1) {
    const R = mrng(seed);
    const pts = [];
    for (let k = 0; k <= n; k++) {
      const u = (k / n) * to;
      const bx = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * cx + u * u * x1;
      const by = (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * cy + u * u * y1;
      const tx = 2 * (1 - u) * (cx - x0) + 2 * u * (x1 - cx);
      const ty = 2 * (1 - u) * (cy - y0) + 2 * u * (y1 - cy);
      const l = Math.hypot(tx, ty) || 1;
      const off = k === 0 || k === n ? 0 : (R() - 0.5) * 2 * kink * (k % 2 ? 1 : -0.6);
      pts.push([bx + (-ty / l) * off, by + (tx / l) * off]);
    }
    return pts;
  }

  // The line's crescent slash and spin in his indigo and gold.
  E.slashindigo = walllit({ ...E.slashstorm });
  E.spinindigo = asLight(spin(BWS), BWS);

  // His mark on a monster: a heavy one. A white-gold flash, thick forked bolts lashing out low and
  // wide and dying back, a thin broken ring of shock, gold sparks thrown up and falling.
  E.bwhit = walllit((() => {
    const n = 22;
    const c = 120;
    return {
      w: 240, h: 240, n, fps: 44, px: c, py: c,
      draw(ctx, i) {
        const k = i / (n - 1);
        const ring = smooth(win(k, 0.06, 0.6));
        if (ring > 0 && ring < 1) {
          ctx.save();
          ctx.translate(c, c);
          ctx.scale(1, 0.62);
          celRing(ctx, BWS, 0, 0, 26 + 66 * ring, 7 * (1 - ring) + 2, { broken: 0.35 + ring * 0.6, seed: 5011 });
          ctx.restore();
        }
        const lash = swell(k, 0, 0.5);
        if (lash > 0.02) {
          const R = mrng(5014 + i * 0.16);
          for (let j = 0; j < 6; j++) {
            const ang = (j / 6) * TAU + 0.5 + R() * 0.5;
            const len = (46 + R() * 44) * lash;
            tgFork(ctx, c, c, c + Math.cos(ang) * len, c + Math.sin(ang) * len * 0.6, 3 * lash + 0.8, sadd(5015 + i * 0.16, j * 10), 1, 1, 0.45);
          }
        }
        tgSparks(ctx, c, c, -Math.PI / 2, 3.2, 9, 90, win(k, 0.04, 0.95), 5012);
        if (k < 0.55) tgFlash(ctx, c, c, 28 * swell(k, 0, 0.55), 1);
      },
    };
  })());

  // A curtain of rain (over them, on the floor at `py`, about 100 px wide): a dark cloud's edge at the
  // top, heavy rain driving down through the space, splashing up off the floor, a flicker of light.
  E.bwrain = walllit((() => {
    const n = 26;
    const c = 160;
    const gy = 330;
    const R = rng(5021);
    const D = Array.from({ length: 34 }, () => ({ x: c + (R() - 0.5) * 260, o: R(), l: 28 + R() * 22 }));
    return {
      w: 320, h: 350, n, fps: 40, px: c, py: gy,
      draw(ctx, i) {
        const k = i / (n - 1);
        const a = smooth(win(k, 0, 0.2)) * (1 - smooth(win(k, 0.7, 1)));
        for (const d of D) {
          const u = (k * 2.2 + d.o) % 1;
          const y = lerp(70, gy, u);
          rainStreak(ctx, d.x + 20 * u, y - d.l, d.l, a * (0.5 + 0.5 * Math.min(1, (y - 70) / 60)));
          if (u > 0.9) ripple(ctx, d.x + 20, gy, 4 + 16 * (u - 0.9) / 0.1, 2.4, 0.3, 0, 5023, a * 0.8);
        }
        thunderhead(ctx, c, 50, 300, 5022, Math.max(0, Math.sin(k * 9)) ** 3, a, k * 0.5);
      },
    };
  })());

  // His aegis (his shove, his charge; at his shoulder): a tall curved shield of static light forms in
  // front of him, three bands of it sliding together, its rim a bolt of lightning; it locks with a
  // flash, then is driven forward and breaks into sparks.
  E.bwplate = walllit((() => {
    const n = 22;
    const c = 110;
    const cy = 130;
    const edge = (t, bulge, dx) => [c + dx + bulge * (1 - t * t), cy + t * 96];
    return {
      w: 260, h: 260, n, fps: 40, px: c, py: cy,
      draw(ctx, i) {
        const k = i / (n - 1);
        const lock = smooth(win(k, 0, 0.32));
        const push = smooth(win(k, 0.45, 1));
        const dx = 80 * push;
        const a = 1 - push;
        for (const [t0, t1, from] of [[-1, -0.34, -1], [-0.34, 0.34, 0], [0.34, 1, 1]]) {
          const oy = from * 46 * (1 - lock);
          const al = a * (0.3 + 0.7 * lock);
          const outer = [];
          const inner = [];
          for (let q = 0; q <= 8; q++) {
            const t = lerp(t0, t1, q / 8);
            const [ox, oyy] = edge(t, 44, dx);
            const [ix, iyy] = edge(t, 10, dx - 10);
            outer.push([ox, oyy + oy]);
            inner.push([ix, iyy + oy]);
          }
          ctx.save();
          ctx.globalAlpha *= al;
          const g = ctx.createLinearGradient(c + dx - 8, 0, c + dx + 36, 0);
          g.addColorStop(0, 'rgba(74,79,176,0.05)');
          g.addColorStop(0.55, 'rgba(154,162,240,0.6)');
          g.addColorStop(1, 'rgba(255,241,196,0.9)');
          ctx.beginPath();
          [...outer, ...inner.reverse()].forEach(([x, y], q) => (q ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
          ctx.closePath();
          ctx.fillStyle = g;
          ctx.fill();
          ctx.restore();
          const J = mrng(5031 + from * 7 + i * 0.16);
          tgThunder(ctx, outer.map(([x, y], q) => (q % 2 ? [x + (J() - 0.5) * 9, y] : [x, y])), 2.4 + lock, al);
        }
        if (lock > 0.5) tgCrackle(ctx, c + dx + 22, cy, 70, 3, 5034 + i * 0.16, a * lock, 1.8);
        const snap = swell(k, 0.26, 0.48);
        if (snap > 0.02) tgFlash(ctx, c + 30, cy, 34 * snap, 1);
        if (push > 0) tgSparks(ctx, c + dx + 30, cy, 0, 1.8, 10, 110, win(k, 0.45, 1), 5035, 0.7);
      },
    };
  })());

  // The undertow (his pull, his drag; out ahead of him, on the floor at `py`): three tendrils of
  // lightning lash out along the reach, hook what's out there with a flash, and haul back to him,
  // bending as they drag; motes of gold stream in to him with them.
  E.bwfield = walllit((() => {
    const n = 24;
    const c = 30;
    const gy = 150;
    const L = 300;
    const y0 = gy - 46;
    return {
      w: L + 60, h: 200, n, fps: 40, px: c, py: gy,
      draw(ctx, i) {
        const k = i / (n - 1);
        const out = smooth(win(k, 0, 0.28));
        const back = smooth(win(k, 0.36, 0.9));
        const fade = 1 - smooth(win(k, 0.78, 1));
        for (let j = 0; j < 3; j++) {
          const h = (j - 1) * 30;
          const reach = L * (0.75 + 0.25 * (j === 1)) * out * (1 - 0.85 * back);
          if (reach < 8) continue;
          const tx = c + reach;
          const ty = y0 + h * out;
          // (Dragging, the middle sags back behind the tip.)
          const mx = c + reach * (0.5 - 0.2 * back);
          const my = y0 + h * 0.4 + (j - 1) * 24 * back - 10;
          const pts = bendBolt(c + 6, y0, mx, my, tx, ty, Math.max(3, Math.round(reach / 30)), 7 + 6 * back, 5041 + j * 10 + i * 0.16);
          tgThunder(ctx, pts, 3.6 - (j % 2) * 0.8, fade);
          if (out > 0.9 && back < 0.9) {
            tgFlash(ctx, tx, ty, (12 + 6 * swell(k, 0.26, 0.4)) * fade, 1);
            tgCrackle(ctx, tx, ty, 26, 2, 5045 + j * 10 + i * 0.16, fade, 1.8);
          }
        }
        const R = rng(5046);
        for (let j = 0; j < 12; j++) {
          const lane = (R() - 0.5) * 70;
          const u = 1 - ((k * 1.6 + R()) % 1);
          const x = c + 20 + u * L * out;
          const y = y0 + lane * u;
          const al = fade * out * Math.min(1, u * 3);
          ctx.save();
          ctx.globalAlpha *= al;
          strokePts(ctx, [[x, y], [x + 18 + 20 * back, y + lane * 0.05]], 5, BWS[3], 0.35);
          strokePts(ctx, [[x, y], [x + 10 + 12 * back, y]], 2, BWB[1], 0.95);
          ctx.restore();
        }
      },
    };
  })());

  // Lightning cage (round him, on the floor at `py`): bars of lightning snap up out of a ring round
  // him and curve in over him like a birdcage, meeting in a crown of light; the back bars dim behind
  // him, the inside glows faintly, then the bars burn out from the top down.
  E.bwcage = walllit((() => {
    const n = 30;
    const c = 260;
    const gy = 320;
    const rx = 200;
    const top = gy - 112;
    return {
      w: 520, h: 340, n, fps: 40, px: c, py: gy,
      draw(ctx, i) {
        const k = i / (n - 1);
        const up = smooth(win(k, 0, 0.22));
        const fade = 1 - smooth(win(k, 0.62, 1));
        const glow = up * fade;
        ctx.save();
        ctx.globalAlpha *= 0.1 * glow;
        ctx.beginPath();
        ctx.ellipse(c, gy, rx * 0.95, rx * 0.26, 0, 0, TAU);
        ctx.fillStyle = BWS[2];
        ctx.fill();
        ctx.restore();
        tgRing(ctx, c, gy, rx, 7, fade, 5051 + i * 0.16, { crackle: 3 });
        const bars = Array.from({ length: 8 }, (_, j) => (j / 8) * TAU + 0.2).sort((p, q) => Math.sin(p) - Math.sin(q));
        for (const ang of bars) {
          const bx = c + Math.cos(ang) * rx;
          const by = gy + Math.sin(ang) * rx * 0.3;
          const front = Math.sin(ang) > 0;
          const cx = c + Math.cos(ang) * rx * 1.05;
          const cyy = gy - 104;
          // (The tops burn out first: the visible length shrinks back down to the floor.)
          const to = up * (1 - 0.7 * (1 - fade));
          const pts = bendBolt(bx, by, cx, cyy, c + Math.cos(ang) * 18, top + 6, 9, 6, 5052 + Math.round(ang * 10) + i * 0.16, to);
          tgThunder(ctx, pts, (front ? 2.6 : 1.4) * (0.5 + 0.5 * fade), fade * (front ? 1 : 0.5));
          if (up < 1) tgFlash(ctx, pts[pts.length - 1][0], pts[pts.length - 1][1], 10 * fade, 1);
          if (k < 0.3) tgFlash(ctx, bx, by, 14 * (1 - k / 0.3), front ? 1 : 0.5);
        }
        if (up >= 1) {
          tgFlash(ctx, c, top + 6, 22 * fade * (0.85 + 0.15 * Math.sin(i * 1.3)), 1);
          tgCrackle(ctx, c, top + 6, 40, 3, 5059 + i * 0.16, fade, 2);
        }
      },
    };
  })());

  // A wall of storm (his slam; out ahead of him, on the floor at `py`): a sheet of driving rain rises
  // out of the floor under its own small thundercloud, lightning pillars down both edges and a bolt
  // climbing through the middle, spray and splash at its foot; then it drains away.
  E.bwwall = walllit((() => {
    const n = 30;
    const c = 150;
    const gy = 420;
    const R = rng(5061);
    const D = Array.from({ length: 64 }, () => ({ x: (R() - 0.5) * 150, o: R(), l: 24 + R() * 18 }));
    return {
      w: 300, h: 480, n, fps: 40, px: c, py: gy,
      draw(ctx, i) {
        const k = i / (n - 1);
        const up = smooth(win(k, 0, 0.22));
        const fade = 1 - smooth(win(k, 0.6, 1));
        const H = 330 * up;
        const topY = gy - H;
        // A faint haze of rain through the sheet, clear at its edges.
        const g = ctx.createLinearGradient(c - 84, 0, c + 84, 0);
        g.addColorStop(0, 'rgba(122,134,200,0)');
        g.addColorStop(0.5, 'rgba(184,196,240,0.13)');
        g.addColorStop(1, 'rgba(122,134,200,0)');
        ctx.save();
        ctx.globalAlpha *= fade;
        ctx.fillStyle = g;
        ctx.fillRect(c - 84, topY + 10, 168, H - 10);
        ctx.restore();
        for (const d of D) {
          const u = (k * 2.6 + d.o) % 1;
          const y = topY + 20 + u * (H - 20);
          rainStreak(ctx, c + d.x + 12 * u, y - d.l, d.l, fade * (1 - Math.abs(d.x) / 110));
          if (u > 0.9) ripple(ctx, c + d.x + 12, gy, 4 + 14 * (u - 0.9) / 0.1, 2.2, 0.3, 0, 5065, fade * 0.7);
        }
        for (let j = 0; j < 2; j++) tgThunder(ctx, tgPath(c + (j ? 72 : -72), gy, c + (j ? 64 : -64), topY + 30, 5062 + j * 10 + i * 0.16, 0.25), 2.6 * fade + 0.6, fade);
        const climb = (k * 2.2) % 1;
        tgThunder(ctx, tgPath(c, gy, c + 4, gy - (H - 20) * smooth(climb), 5066 + Math.floor(k * 2.2) * 10 + i * 0.16, 0.4), 2 * fade, fade * (1 - climb * 0.6));
        if (H > 40) thunderhead(ctx, c, topY + 4, 230, 5067, Math.max(0, Math.sin(k * 11)) ** 3, fade, k * 0.4);
        tgRing(ctx, c, gy, 70 + 30 * up, 6, fade, 5063, { crackle: 2 });
      },
    };
  })());

  // The thunderhead (his aura from half Thunderhead; loops; over his head): a dark cloud boiling
  // slowly, lit from inside now and then, a thread of lightning flickering under it, rain falling.
  E.bwcloud = (() => {
    const n = 48;
    const c = 180;
    return {
      w: 360, h: 220, n, fps: 20, px: c, py: 80, loop: true,
      draw(ctx, i) {
        const ph = i / n;
        const lit = Math.max(0, Math.sin(ph * TAU * 2)) ** 4;
        const R = rng(5073);
        for (let j = 0; j < 12; j++) {
          const x = c + (R() - 0.5) * 200;
          const u = (ph * 2 + R()) % 1;
          rainStreak(ctx, x + 10 * u, 96 + u * 90, 18, (1 - u) * 0.9);
        }
        wallPal(() => {
          if (lit > 0.2) tgThunder(ctx, tgZig(c - 40, 92, c + 26, 140, 5, 10, loopSeed(5072, i, n)), 2.2, lit);
        });
        thunderhead(ctx, c, 66, 260, 5071, lit, 0.97, ph);
      },
    };
  })();
  // Eye of the Storm's ring at his feet (loops).
  E.bwring = walllit((() => {
    const n = 24;
    return {
      w: 300, h: 140, n, fps: 24, px: 150, py: 70, loop: true,
      draw(ctx, i) {
        tgRing(ctx, 150, 70, 120, 8, 0.85, loopSeed(5081, i, n), { crackle: 4, pal: TGB });
      },
    };
  })());
  // His bolt from the thunderhead (heavier than the Thunderguard's), the thunder rolling out along
  // the floor, and the spout he throws up: the Thunderguard's shapes in indigo and gold.
  E.bwboltdown = walllit(grown(E.tgbolt, 1.1));
  E.bwroll = walllit(E.tgclap);
  E.bwspout = walllit(E.tgcolumn);

  // ---------- The Stormwall's skills ----------
  // Overcast (over him and the party, played over the cast; from his feet at `py`): the thundercloud
  // spreads out wide over everyone, a soft rain falls from it, and flakes of gold light drift down and
  // settle as the shield on each of them.
  E.bwovercastfx = walllit((() => {
    const n = 36;
    const c = 300;
    const gy = 380;
    const R = rng(5091);
    const F = Array.from({ length: 18 }, () => ({ x: c + (R() - 0.5) * 520, at: R() * 0.4, sp: 0.35 + R() * 0.2 }));
    return {
      w: 600, h: 400, n, fps: 26, px: c, py: gy,
      draw(ctx, i) {
        const k = i / (n - 1);
        const spread = smooth(win(k, 0, 0.4));
        const fade = 1 - smooth(win(k, 0.75, 1));
        thunderhead(ctx, c, 140, 200 + 360 * spread, 5092, Math.max(0, Math.sin(k * 13)) ** 4, fade * 0.95, k * 0.6);
        const D = rng(5093);
        for (let j = 0; j < 22; j++) {
          const x = c + (D() - 0.5) * 520 * spread;
          const u = (k * 2 + D()) % 1;
          rainStreak(ctx, x + 14 * u, 170 + u * (gy - 190), 22, fade * spread * 0.8);
        }
        for (const f of F) {
          const u = (k - f.at) / f.sp;
          if (u <= 0 || u >= 1) continue;
          const y = lerp(170, gy - 60, smooth(u));
          sparkle(ctx, TGB, f.x, y, 7 * (1 - win(u, 0.7, 1)), u * 4);
        }
      },
    };
  })());
  E.bwcagebig = grown(E.bwcage, 1.1);
  E.bwwallbig = grown(E.bwwall, 1.3);
  E.bwfieldbig = grown(E.bwfield, 1.6);
  // Squall, Downpour's storm and bolt, the big clap, Iron Cloud's shell and Rain Cleave's crescent:
  // the Thunderguard's shapes in his indigo and gold.
  E.bwsquallfx = walllit(grown(E.tgcyclone, 1.1));
  E.bwstormcloud = walllit(E.tgstormcloud);
  E.bwclapbig = walllit(E.tgclapbig);
  E.bwboltbig = walllit(E.tgboltbig);
  E.bwguardshell = walllit(E.tgguardshell);
  E.bwwave = walllit(E.tgwave);

  window.FXART = E;
  window.FXHD = { render, RAW };
})();
