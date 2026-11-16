// Live weapon effects, drawn every frame on top of the weapon sprite in the weapon's own space
// (grip at the origin, the weapon pointing toward -y). Better weapons do more: steel glints,
// mithril twinkles, crystal sheds frost, runes float glyphs, stars twinkle, sunforged and phoenix
// throw embers and flames, abyssal weapons smoke, celestial and genesis ones shine, and each
// endgame theme has its own show — holy light and feathers, hellfire and a blinking eye, soul
// fire and ghosts, humming energy blades, chainsaw smoke and sparks, and neon with glitches and
// holograms.
//
// `liveFor(look, a)` returns live(ctx, time, s) or null. Anchors `a` are in the weapon's local
// pixels: head, tip, blade [top, base], gem, top, runes, and per-theme points (halo, wings,
// flames, eye, eyes, beams, orbs, exhaust, sparks, chain, neon, ring).

import { THEMES } from './weapon-kit.js';

const TAU = Math.PI * 2;

// A repeatable pseudo-random number for (i, j), so effects look random but don't flicker wildly.
function hash(i, j = 0) {
  const v = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return v - Math.floor(v);
}

function glow(ctx, x, y, r, color, alpha) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

function twinkle(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
}

// A flame tongue standing on (x, y), `h` tall, leaning with `lean`.
function flame(ctx, x, y, w, h, lean, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - w, y);
  ctx.quadraticCurveTo(x - w, y - h * 0.5, x + lean, y - h);
  ctx.quadraticCurveTo(x + w, y - h * 0.45, x + w, y);
  ctx.quadraticCurveTo(x, y + w * 0.8, x - w, y);
  ctx.fill();
}

function path(ctx, pts, s) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x * s, y * s) : ctx.moveTo(x * s, y * s)));
}

// A point `u` (0-1) of the way along a polyline.
function along(pts, u) {
  const lens = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    lens.push(l);
    total += l;
  }
  let d = u * total;
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i] || i === lens.length - 1) {
      const k = lens[i] ? Math.min(1, d / lens[i]) : 0;
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k];
    }
    d -= lens[i];
  }
  return pts[0];
}

// Somewhere along the blade, for sparkles and motes.
function onBlade(a, u, spread) {
  const [top, base] = a.blade;
  const x = (a.head?.[0] ?? 0) + spread;
  return [x, base + (top - base) * u];
}

// ---------- Progression ----------

// '#rrggbb' at alpha `a`, for gradients.
function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

// Steel and silver: a bright glint runs up the edge every few seconds.
function glintLive(a) {
  return (ctx, time, s) => {
    const k = (time % 3.2) / 0.5;
    if (k > 1) return;
    const [x, y] = onBlade(a, k, 0);
    ctx.save();
    ctx.globalAlpha = Math.sin(k * Math.PI);
    twinkle(ctx, x * s, y * s, 3 * s, '#ffffff');
    ctx.restore();
  };
}

// Mithril and cobalt: a cool shimmer around the gem and twinkles popping along the blade.
function shimmerLive(a, look) {
  const halo = rgba(look.gem === '#ffd23b' ? '#7fa8ff' : look.gem, 0.8);
  return (ctx, time, s) => {
    ctx.save();
    const [gx, gy] = a.gem ?? a.head;
    glow(ctx, gx * s, gy * s, 7 * s, halo, 0.35 + 0.2 * Math.sin(time * 3));
    for (let i = 0; i < 3; i++) {
      const cyc = time * 0.8 + i / 3;
      const k = cyc % 1;
      const n = Math.floor(cyc);
      const [x, y] = onBlade(a, 0.15 + hash(n, i) * 0.8, (hash(n, i + 7) - 0.5) * 6);
      ctx.globalAlpha = Math.sin(k * Math.PI);
      twinkle(ctx, x * s, y * s, (1 + 1.5 * Math.sin(k * Math.PI)) * s, i % 2 ? look.edge : '#ffffff');
    }
    ctx.restore();
  };
}

// Crystal and moonsilver: frost motes drifting down around the blade, and a cold breath of light.
function frostLive(a, look) {
  return (ctx, time, s) => {
    ctx.save();
    const [hx, hy] = a.head;
    glow(ctx, hx * s, hy * s, 10 * s, rgba(look.edge === '#ffffff' ? '#bff4ff' : look.edge, 0.6), 0.25 + 0.12 * Math.sin(time * 2));
    for (let i = 0; i < 5; i++) {
      const cyc = time * 0.4 + i / 5;
      const u = cyc % 1;
      const [x, y] = onBlade(a, hash(Math.floor(cyc), i), (hash(Math.floor(cyc), i + 3) - 0.5) * 12);
      ctx.globalAlpha = Math.sin(u * Math.PI) * 0.9;
      ctx.fillStyle = i % 2 ? '#ffffff' : '#bff4ff';
      ctx.fillRect((x + Math.sin(time * 2 + i) * 1.5) * s, (y + u * 8) * s, s, s);
    }
    ctx.restore();
  };
}

// Runes: they breathe light and glyphs lift off the weapon and fade.
function runicLive(a, look) {
  return (ctx, time, s) => {
    ctx.save();
    const [x, y0, y1] = a.runes;
    for (let y = y0; y < y1; y += 6) glow(ctx, x * s, y * s, 5 * s, rgba(look.rune, 0.6), 0.15 + 0.15 * Math.sin(time * 4 - y * 0.4));
    ctx.strokeStyle = look.rune;
    ctx.lineWidth = Math.max(1, s * 0.6);
    for (let i = 0; i < 4; i++) {
      const cyc = time * 0.5 + i / 4;
      const k = cyc % 1;
      const n = Math.floor(cyc);
      const [bx, by] = onBlade(a, hash(n, i) * 0.9, 0);
      const gx = (bx + (hash(n, i + 3) - 0.5) * 14) * s;
      const gy = (by - k * 10) * s;
      ctx.globalAlpha = Math.sin(k * Math.PI) * 0.9;
      const r = 1.6 * s;
      ctx.beginPath();
      switch ((n + i) % 3) {
        case 0: ctx.moveTo(gx - r, gy - r); ctx.lineTo(gx, gy + r); ctx.lineTo(gx + r, gy - r); break;
        case 1: ctx.moveTo(gx, gy - r); ctx.lineTo(gx, gy + r); ctx.moveTo(gx - r, gy); ctx.lineTo(gx + r, gy - r); break;
        default: ctx.moveTo(gx - r, gy + r); ctx.lineTo(gx - r, gy - r); ctx.lineTo(gx + r, gy); ctx.lineTo(gx - r, gy + r);
      }
      ctx.stroke();
    }
    ctx.restore();
  };
}

// Starsteel and astral: stars twinkling on and off all around the weapon, and riding the orbit.
function starsLive(a, look) {
  return (ctx, time, s) => {
    ctx.save();
    for (let i = 0; i < 5; i++) {
      const cyc = time * 0.7 + i / 5;
      const k = cyc % 1;
      const n = Math.floor(cyc);
      const [x, y] = onBlade(a, hash(n, i), (hash(n, i + 5) - 0.5) * 16);
      ctx.globalAlpha = Math.sin(k * Math.PI);
      twinkle(ctx, x * s, y * s, (0.8 + 1.6 * Math.sin(k * Math.PI)) * s, i % 2 ? look.gem : '#ffffff');
    }
    if (a.halo) {
      const [hx, hy, rx, ry] = a.halo;
      const ang = time * 2;
      ctx.globalAlpha = 0.9;
      glow(ctx, (hx + Math.cos(ang) * rx) * s, (hy + Math.sin(ang) * ry) * s, 3 * s, '#ffffff', 0.9);
    }
    ctx.restore();
  };
}

// Sunforged and dragonbone: a warm glow and ember sparks rising off the blade.
function embersLive(a, look) {
  return (ctx, time, s) => {
    ctx.save();
    const [hx, hy] = a.gem ?? a.head;
    glow(ctx, hx * s, hy * s, (7 + 2 * Math.sin(time * 5)) * s, rgba(look.gem, 0.7), 0.3);
    for (let i = 0; i < 6; i++) {
      const cyc = time * 0.8 + i / 6;
      const u = cyc % 1;
      const [x, y] = onBlade(a, hash(Math.floor(cyc), i), (hash(Math.floor(cyc), i + 9) - 0.5) * 8);
      ctx.globalAlpha = 1 - u;
      ctx.fillStyle = i % 3 ? '#ffb03b' : '#fff3a6';
      ctx.fillRect((x + Math.sin(time * 4 + i) * 2) * s, (y - u * 14) * s, s, s);
    }
    ctx.restore();
  };
}

// Phoenix: flames licking up the blade, embers, and a shimmer of heat.
function flamesLive(a) {
  return (ctx, time, s) => {
    ctx.save();
    for (let i = 0; i < 4; i++) {
      const k = (time * 1.5 + i / 4) % 1;
      const [x, y] = onBlade(a, 0.1 + (i / 4) * 0.8, (i % 2 ? 1 : -1) * 2.5);
      const h = (3 + 4 * Math.sin(k * Math.PI)) * s;
      const lean = Math.sin(time * 5 + i) * s;
      ctx.globalAlpha = 0.8 * Math.sin(k * Math.PI);
      flame(ctx, x * s, (y - k * 3) * s, 1.1 * s, h, lean, '#ff6a2a');
      flame(ctx, x * s, (y - k * 3) * s, 0.55 * s, h * 0.6, lean * 0.6, '#ffe36b');
    }
    for (let i = 0; i < 5; i++) {
      const cyc = time * 0.9 + i / 5;
      const u = cyc % 1;
      const [x, y] = onBlade(a, hash(Math.floor(cyc), i), (hash(Math.floor(cyc), i + 2) - 0.5) * 12);
      ctx.globalAlpha = 1 - u;
      ctx.fillStyle = i % 2 ? '#ff8a3c' : '#fff06b';
      ctx.fillRect(x * s, (y - u * 16) * s, s, s);
    }
    ctx.restore();
  };
}

// Obsidian (and dark variants): a violet gleam sliding along the edge.
function edgeLive(a, color) {
  return (ctx, time, s) => {
    const k = (time * 0.6) % 1;
    const [x, y] = onBlade(a, k, 1);
    ctx.save();
    glow(ctx, x * s, y * s, 6 * s, rgba(color, 0.9), 0.55 * Math.sin(k * Math.PI));
    ctx.restore();
  };
}

// Abyssal: dark wisps curling up off the weapon and a slow throb of void light around the eye.
function voidLive(a, look) {
  return (ctx, time, s) => {
    ctx.save();
    const [ex, ey] = a.eye ?? a.head;
    glow(ctx, ex * s, ey * s, 8 * s, rgba(look.edge, 0.8), 0.25 + 0.2 * Math.pow(Math.max(0, Math.sin(time * 2.4)), 4));
    for (let i = 0; i < 4; i++) {
      const u = (time * 0.45 + i / 4) % 1;
      const [x, y] = onBlade(a, (i / 4) * 0.9 + 0.05, Math.sin(u * TAU + i) * 5);
      ctx.globalAlpha = Math.sin(u * Math.PI) * 0.7;
      ctx.fillStyle = i % 2 ? '#2c1844' : '#7a4ab0';
      ctx.beginPath();
      ctx.arc(x * s, (y - u * 12) * s, (2.2 - u * 1.4) * s, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  };
}

// Celestial and genesis: breathing light with turning rays and sparkles riding the halo. Genesis's
// light runs through the rainbow.
function radiantLive(a, colors) {
  return (ctx, time, s) => {
    const [cx, cy] = a.head;
    const c = colors[Math.floor(time * 2) % colors.length];
    ctx.save();
    const pulse = 0.5 + 0.5 * Math.sin(time * 3);
    glow(ctx, cx * s, cy * s, (8 + pulse * 3) * s, rgba(c, 0.8), 0.4);
    ctx.lineCap = 'round';
    ctx.lineWidth = 0.8 * s;
    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * TAU + time * 0.8;
      ctx.globalAlpha = 0.35 + 0.25 * Math.sin(time * 4 + i);
      ctx.strokeStyle = colors[i % colors.length];
      ctx.beginPath();
      ctx.moveTo((cx + Math.cos(ang) * 4) * s, (cy + Math.sin(ang) * 4) * s);
      ctx.lineTo((cx + Math.cos(ang) * (10 + pulse * 3)) * s, (cy + Math.sin(ang) * (10 + pulse * 3)) * s);
      ctx.stroke();
    }
    if (a.halo) {
      const [hx, hy, rx, ry] = a.halo;
      for (let i = 0; i < 2; i++) {
        const ang = time * 2.4 + i * Math.PI;
        ctx.globalAlpha = 0.6 + 0.4 * Math.sin(ang);
        twinkle(ctx, (hx + Math.cos(ang) * rx) * s, (hy + Math.sin(ang) * ry) * s, 1.4 * s, '#ffffff');
      }
    }
    for (let i = 0; i < 4; i++) {
      const u = (time * 0.6 + i / 4) % 1;
      const [x, y] = onBlade(a, (i / 4) * 0.9, Math.sin(i * 2.1 + time) * 6);
      ctx.globalAlpha = Math.sin(u * Math.PI);
      ctx.fillStyle = colors[(i + 1) % colors.length];
      ctx.fillRect(x * s, (y - u * 14) * s, s, s);
    }
    ctx.restore();
  };
}

const PROGRESSION_LIVE = {
  glint: glintLive,
  shimmer: shimmerLive,
  frost: frostLive,
  runes: (a, look) => (a.runes ? runicLive(a, look) : shimmerLive(a, look)),
  stars: starsLive,
  embers: embersLive,
  flames: flamesLive,
  edge: (a, look) => edgeLive(a, look.edge),
  void: voidLive,
  radiant: (a) => radiantLive(a, ['#fff3a6', '#ffffff', '#bfe6ff']),
  prism: (a, look) => radiantLive(a, look.prism),
};

// Both effects, one over the other.
const both = (x, y) => (x && y ? (ctx, time, s) => (x(ctx, time, s), y(ctx, time, s)) : x ?? y);

// ---------- Endgame themes ----------

// Holy: breathing light with turning rays, sparkles riding the halo, feathers shed from the wings,
// and motes of light rising.
function holyLive(a) {
  return (ctx, time, s) => {
    const [cx, cy] = a.head;
    ctx.save();
    const pulse = 0.5 + 0.5 * Math.sin(time * 3);
    glow(ctx, cx * s, cy * s, (12 + pulse * 4) * s, 'rgba(255,251,224,0.75)', 0.9);
    ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * TAU + time * 0.7;
      const len = (i % 2 ? 7 : 11 + pulse * 3) * s;
      ctx.globalAlpha = 0.3 + 0.25 * Math.sin(time * 4 + i);
      ctx.strokeStyle = i % 2 ? '#fff3a6' : '#ffffff';
      ctx.lineWidth = (i % 2 ? 0.6 : 1) * s;
      ctx.beginPath();
      ctx.moveTo((cx + Math.cos(ang) * 4) * s, (cy + Math.sin(ang) * 4) * s);
      ctx.lineTo(cx * s + Math.cos(ang) * len, cy * s + Math.sin(ang) * len);
      ctx.stroke();
    }
    if (a.halo) {
      const [hx, hy, rx, ry] = a.halo;
      for (let i = 0; i < 3; i++) {
        const ang = time * 2.4 + (i / 3) * TAU;
        ctx.globalAlpha = 0.6 + 0.4 * Math.sin(ang);
        twinkle(ctx, (hx + Math.cos(ang) * rx) * s, (hy + Math.sin(ang) * ry) * s, (1 + 0.6 * Math.sin(ang)) * s, '#ffffff');
      }
    }
    (a.wings ?? []).forEach(([wx, wy], j) => {
      for (let i = 0; i < 2; i++) {
        const u = (time * 0.45 + i / 2 + j * 0.27) % 1;
        const side = wx < (a.head[0] ?? 0) ? -1 : 1;
        ctx.save();
        ctx.globalAlpha = Math.sin(u * Math.PI) * 0.9;
        ctx.translate((wx + side * u * 8 + Math.sin(time * 3 + i) * 2) * s, (wy + u * 14) * s);
        ctx.rotate(Math.sin(time * 2 + i + j) * 0.9);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(0, 0, 0.9 * s, 2.3 * s, 0, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
    });
    for (let i = 0; i < 6; i++) {
      const u = (time * 0.6 + i / 6) % 1;
      const [x, y] = onBlade(a, (i / 6) * 0.9, Math.sin(i * 2.1 + time) * 6);
      ctx.globalAlpha = Math.sin(u * Math.PI);
      ctx.fillStyle = i % 2 ? '#fff3a6' : '#ffffff';
      ctx.fillRect(x * s, (y - u * 16) * s, s, s);
    }
    const flash = (time % 2.6) / 2.6;
    if (flash < 0.12) {
      ctx.globalAlpha = 1 - flash / 0.12;
      const [tx, ty] = a.tip;
      twinkle(ctx, tx * s, ty * s, 5 * s, '#ffffff');
    }
    ctx.restore();
  };
}

// Demonic: hellfire licking up the blade, embers, a smoldering glow, and an eye that blinks.
function demonicLive(a) {
  const D = THEMES.demonic;
  return (ctx, time, s) => {
    const [cx, cy] = a.head;
    ctx.save();
    const beat = Math.pow(Math.max(0, Math.sin(time * 4.2)), 6);
    glow(ctx, cx * s, cy * s, (14 + beat * 5) * s, 'rgba(255,40,40,0.7)', 0.35 + beat * 0.35);
    // Dark flames with a hot core.
    (a.flames ?? []).forEach(([x, y], i) => {
      const k = (time * 1.6 + hash(i) ) % 1;
      const h = (2.5 + 3.5 * Math.sin(k * Math.PI)) * s;
      const lean = Math.sin(time * 5 + i) * 1.2 * s;
      const fy = (y - k * 4) * s;
      ctx.globalAlpha = 0.45 * Math.sin(k * Math.PI);
      flame(ctx, x * s, fy, 1.4 * s, h * 1.3, lean, '#3a0614');
      ctx.globalAlpha = 0.8 * Math.sin(k * Math.PI);
      flame(ctx, x * s, fy, 0.9 * s, h, lean, D.hot);
      flame(ctx, x * s, fy, 0.45 * s, h * 0.55, lean * 0.6, D.ember);
    });
    // Embers drifting up.
    for (let i = 0; i < 7; i++) {
      const cyc = time * 0.7 + i / 7;
      const u = cyc % 1;
      const [x, y] = onBlade(a, hash(Math.floor(cyc), i), (hash(Math.floor(cyc), i + 9) - 0.5) * 10);
      ctx.globalAlpha = 1 - u;
      ctx.fillStyle = i % 3 ? D.hot : D.ember;
      ctx.fillRect((x + Math.sin(time * 4 + i) * 2) * s, (y - u * 18) * s, s, s);
    }
    // The eye: a glow when it opens, a lid that drops now and then.
    if (a.eye) {
      const [ex, ey, r] = a.eye;
      glow(ctx, ex * s, ey * s, r * 4 * s, 'rgba(255,200,60,0.8)', 0.25 + beat * 0.4);
      const b = (time % 3.4) / 3.4;
      if (b < 0.06) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#1a0a10';
        const lid = Math.sin((b / 0.06) * Math.PI);
        ctx.beginPath();
        ctx.ellipse(ex * s, ey * s, r * 1.7 * s, r * 1.1 * lid * s + 0.1, 0, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  };
}

// Bone: green soul fire in the skull's eyes and ghosts winding around the weapon.
function boneLive(a) {
  const soul = THEMES.bone.soul;
  return (ctx, time, s) => {
    ctx.save();
    for (const [i, [ex, ey]] of (a.eyes ?? []).entries()) {
      const f = 0.5 + 0.5 * Math.sin(time * 9 + i * 2);
      glow(ctx, ex * s, ey * s, 5 * s, 'rgba(107,255,154,0.8)', 0.5 + f * 0.3);
      ctx.globalAlpha = 0.85;
      flame(ctx, ex * s, ey * s, 0.9 * s, (3 + f * 2.5) * s, Math.sin(time * 6 + i) * s, soul);
      flame(ctx, ex * s, ey * s, 0.45 * s, (1.5 + f) * s, 0, '#e6ffee');
    }
    // Two ghosts spiral up the weapon, each with a fading tail.
    for (let g = 0; g < 2; g++) {
      for (let t = 0; t < 7; t++) {
        const u = ((time * 0.35 + g * 0.5) - t * 0.018) % 1;
        if (u < 0) continue;
        const [x, y] = onBlade(a, u, Math.sin(u * TAU * 2 + g * Math.PI) * 7);
        ctx.globalAlpha = (1 - t / 7) * Math.sin(u * Math.PI) * 0.75;
        ctx.fillStyle = t ? '#bfffe0' : '#ffffff';
        ctx.beginPath();
        ctx.arc(x * s, y * s, (2.2 - t * 0.25) * s, 0, TAU);
        ctx.fill();
        if (!t) {
          ctx.fillStyle = '#2a4a3a';
          ctx.fillRect((x - 1) * s, (y - 0.5) * s, 0.7 * s, 0.7 * s);
          ctx.fillRect((x + 0.4) * s, (y - 0.5) * s, 0.7 * s, 0.7 * s);
        }
      }
    }
    for (let i = 0; i < 5; i++) {
      const u = (time * 0.5 + i / 5) % 1;
      const [x, y] = onBlade(a, (i / 5) * 0.8, Math.sin(i * 1.7 + time) * 8);
      ctx.globalAlpha = Math.sin(u * Math.PI) * 0.8;
      ctx.fillStyle = soul;
      ctx.fillRect(x * s, (y - u * 14) * s, s, s);
    }
    ctx.restore();
  };
}

// Laser: humming energy with a white-hot core, a flicker, light running along it, and sparks
// spitting from the emitter.
function laserLive(a, look) {
  const color = look.beam;
  return (ctx, time, s) => {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const flick = 1 + 0.1 * Math.sin(time * 61) + 0.06 * Math.sin(time * 23);
    for (const b of a.beams ?? []) {
      const w = b.w * flick;
      if (b.fill) {
        path(ctx, b.pts, s);
        ctx.closePath();
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = color;
        ctx.fill();
      }
      path(ctx, b.pts, s);
      if (b.fill) ctx.closePath();
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.25;
      ctx.lineWidth = w * 3.4 * s;
      ctx.stroke();
      ctx.globalAlpha = 0.95;
      ctx.lineWidth = w * 1.7 * s;
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = w * 0.6 * s;
      ctx.stroke();
      // A bright pulse running out along the beam.
      const u = (time * 1.8 + (b.pts[0][0] * 0.1)) % 1;
      const [px, py] = along(b.pts, u);
      glow(ctx, px * s, py * s, w * 3 * s, '#ffffff', 0.6 * Math.sin(u * Math.PI));
    }
    for (const [x, y, r] of a.orbs ?? []) {
      const p = 0.5 + 0.5 * Math.sin(time * 6);
      glow(ctx, x * s, y * s, r * (2.6 + p * 0.6) * s, color, 0.7);
      glow(ctx, x * s, y * s, r * 1.1 * s, '#ffffff', 1);
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 0.6 * s;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.ellipse(x * s, y * s, r * 1.9 * s, r * 0.6 * s, time * 2.5 + (i * Math.PI) / 3, 0, TAU);
        ctx.stroke();
      }
    }
    if (a.emit) {
      const [ex, ey] = a.emit;
      for (let i = 0; i < 4; i++) {
        const cyc = time * 3 + i / 4;
        const u = cyc % 1;
        const ang = hash(Math.floor(cyc), i) * TAU;
        ctx.globalAlpha = 1 - u;
        ctx.fillStyle = i % 2 ? '#ffffff' : color;
        ctx.fillRect((ex + Math.cos(ang) * u * 7) * s, (ey + Math.sin(ang) * u * 7) * s, s, s);
      }
    }
    ctx.restore();
  };
}

// Chainsaw: exhaust smoke puffing, sparks spraying off the teeth, and speed streaks on the chain.
function chainsawLive(a) {
  return (ctx, time, s) => {
    ctx.save();
    if (a.exhaust) {
      const [x, y] = a.exhaust;
      for (let i = 0; i < 5; i++) {
        const u = (time * 1.4 + i / 5) % 1;
        ctx.globalAlpha = (1 - u) * 0.55;
        ctx.fillStyle = i % 2 ? '#8a8a96' : '#b9b9c4';
        ctx.beginPath();
        ctx.arc((x - u * 6 + Math.sin(time * 5 + i) * 1.5) * s, (y - u * 10) * s, (1 + u * 3) * s, 0, TAU);
        ctx.fill();
      }
    }
    for (const [j, [x, y]] of (a.sparks ?? []).entries()) {
      for (let i = 0; i < 5; i++) {
        const cyc = time * 4 + i / 5 + j * 0.3;
        const u = cyc % 1;
        const ang = -Math.PI * 0.5 + (hash(Math.floor(cyc), i + j * 5) - 0.5) * 2.4;
        const d = u * 12;
        ctx.globalAlpha = 1 - u;
        ctx.strokeStyle = i % 2 ? '#ffe36b' : '#ffffff';
        ctx.lineWidth = s * 0.7;
        ctx.beginPath();
        ctx.moveTo((x + Math.cos(ang) * d) * s, (y + Math.sin(ang) * d + u * u * 6) * s);
        ctx.lineTo((x + Math.cos(ang) * (d + 2)) * s, (y + Math.sin(ang) * (d + 2) + u * u * 6) * s);
        ctx.stroke();
      }
    }
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.6 * s;
    for (const [pa, pb] of a.chain ?? []) {
      for (let i = 0; i < 2; i++) {
        const u = (time * 3 + i / 2) % 1;
        const p0 = along([pa, pb], u);
        const p1 = along([pa, pb], Math.min(1, u + 0.25));
        ctx.globalAlpha = 0.5 * Math.sin(u * Math.PI);
        ctx.beginPath();
        ctx.moveTo(p0[0] * s, p0[1] * s);
        ctx.lineTo(p1[0] * s, p1[1] * s);
        ctx.stroke();
      }
    }
    ctx.restore();
  };
}

// Cyberpunk: neon that pulses between cyan and magenta, a hologram ring, rising data bits, and
// glitches that slice the air for a frame.
function cyberLive(a) {
  const [c1, c2] = THEMES.cyber.neon;
  return (ctx, time, s) => {
    ctx.save();
    ctx.lineCap = 'round';
    for (const [i, pts] of (a.neon ?? []).entries()) {
      const c = Math.sin(time * 2 + i) > 0 ? c1 : c2;
      path(ctx, pts, s);
      ctx.strokeStyle = c;
      ctx.globalAlpha = 0.28 + 0.12 * Math.sin(time * 9 + i);
      ctx.lineWidth = 3 * s;
      ctx.stroke();
    }
    if (a.ring) {
      const [x, y, rx, ry] = a.ring;
      ctx.strokeStyle = c1;
      ctx.lineWidth = 0.7 * s;
      ctx.setLineDash([2 * s, 1.5 * s]);
      ctx.lineDashOffset = -time * 14 * s;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.ellipse(x * s, y * s, rx * s, ry * s, 0, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = c2;
      ctx.lineDashOffset = time * 10 * s;
      ctx.beginPath();
      ctx.ellipse(x * s, y * s, rx * 0.7 * s, ry * 1.6 * s, 0, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    // Data bits rising off the weapon.
    for (let i = 0; i < 7; i++) {
      const cyc = time * 0.8 + i / 7;
      const u = cyc % 1;
      const [x, y] = onBlade(a, hash(Math.floor(cyc), i), (hash(Math.floor(cyc), i + 4) - 0.5) * 12);
      ctx.globalAlpha = Math.sin(u * Math.PI);
      ctx.fillStyle = i % 2 ? c1 : c2;
      const one = hash(Math.floor(time * 6), i) > 0.5;
      ctx.fillRect(x * s, (y - u * 14) * s, (one ? 0.7 : 1.6) * s, 1.8 * s);
    }
    // A scanline sweeping up the blade.
    const k = (time * 0.9) % 1;
    const [, sy] = onBlade(a, k, 0);
    ctx.globalAlpha = 0.5 * Math.sin(k * Math.PI);
    ctx.fillStyle = c1;
    ctx.fillRect(-8 * s, sy * s, 16 * s, 0.6 * s);
    // Glitch: for a moment, slices of color jump sideways.
    const gk = time % 1.7;
    if (gk < 0.12) {
      const n = Math.floor(time / 1.7);
      for (let i = 0; i < 3; i++) {
        const [, y] = onBlade(a, hash(n, i), 0);
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = i % 2 ? c2 : c1;
        ctx.fillRect((hash(n, i + 2) - 0.5) * 12 * s, y * s, (4 + hash(n, i + 5) * 8) * s, (0.8 + hash(n, i + 8) * 1.4) * s);
      }
    }
    ctx.restore();
  };
}

// ---------- The Island Journey ladder (docs/design/island-journey-gear.md) ----------
// A tier's own effect, named by its design (`a.fx`), in place of its material's.

// Which way is up on the screen, in the weapon's own frame (it turns and flips with her hand), so
// bubbles rise and drops fall however she holds it.
function screenUp(ctx) {
  const m = ctx.getTransform();
  const det = m.a * m.d - m.b * m.c || 1;
  const x = m.c / det;
  const y = -m.a / det;
  const l = Math.hypot(x, y) || 1;
  return [x / l, y / l];
}

// Tidepearl (Lv 20): a soft water shimmer. Light ripples along it like sun through water, soft
// glows drifting up it from the grip to the tip and fading, again and again; little caustic
// glints wink on and off along it in pearl tints; the pearl catches a bright glint every few
// seconds; and now and then a tiny bubble drifts up off its head and fades.
function tideLive(a) {
  return (ctx, time, s) => {
    ctx.save();
    const [top, base] = a.blade;
    const hx = a.head?.[0] ?? 0;
    for (let i = 0; i < 2; i++) {
      const k = (time * 0.42 + i * 0.5) % 1;
      const y = base + (top - base) * k;
      const x = hx + Math.sin(time * 2.1 + i * 2.4) * 1.1;
      glow(ctx, x * s, y * s, 4.6 * s, 'rgba(196,242,255,0.95)', 0.34 * Math.sin(k * Math.PI));
    }
    for (let i = 0; i < 3; i++) {
      const cyc = time * 0.85 + i / 3;
      const k = cyc % 1;
      const n = Math.floor(cyc);
      const [x, y] = onBlade(a, 0.12 + hash(n, i) * 0.82, (hash(n, i + 5) - 0.5) * 4);
      ctx.globalAlpha = Math.sin(k * Math.PI) * 0.8;
      twinkle(ctx, x * s, y * s, (0.7 + 1.1 * Math.sin(k * Math.PI)) * s, i % 2 ? '#d8f7ff' : '#ffe6f3');
    }
    if (a.gem) {
      const k = (time % 2.8) / 0.5;
      if (k < 1) {
        ctx.globalAlpha = Math.sin(k * Math.PI);
        twinkle(ctx, (a.gem[0] - 0.4) * s, (a.gem[1] - 0.4) * s, 2.3 * s, '#ffffff');
      }
    }
    const [ux, uy] = screenUp(ctx);
    const [bx, by] = a.head ?? [0, top];
    for (let i = 0; i < 2; i++) {
      const cyc = time * 0.45 + i * 0.5;
      const u = cyc % 1;
      const n = Math.floor(cyc);
      const side = (hash(n, i) - 0.5) * 5;
      const wob = Math.sin(u * 7 + i * 2) * 0.7;
      const x = bx + side * -uy + wob * -uy + ux * u * 10;
      const y = by + side * ux + wob * ux + uy * u * 10;
      const r = (0.55 + hash(n, i + 2) * 0.45) * s;
      ctx.globalAlpha = Math.sin(u * Math.PI) * 0.8;
      ctx.strokeStyle = '#e8fbff';
      ctx.lineWidth = Math.max(0.6, 0.3 * s);
      ctx.beginPath();
      ctx.arc(x * s, y * s, r, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x * s - r * 0.35, y * s - r * 0.35, Math.max(0.5, r * 0.28), 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  };
}
// Starglass (Lv 30): twinkling stars. The stars etched or inlaid on it light up one after another,
// a soft glow round each and the line to the next drawing itself in light, then the whole
// constellation fades together before it starts again; little four-pointed stars wink in and out
// round it, turning as they shine; its gem breathes a soft violet; and every few seconds a
// shooting star streaks across the sky just above it (however she holds it).
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const easeInOut = (v) => v * v * (3 - 2 * v);
function starLive(a) {
  const pts = a.stars ?? [];
  const lit = pts.filter(Boolean).length || 1;
  return (ctx, time, s) => {
    ctx.save();
    if (a.gem) glow(ctx, a.gem[0] * s, a.gem[1] * s, 3.6 * s, 'rgba(170,150,255,0.95)', 0.2 + 0.12 * Math.sin(time * 1.9));
    // The constellation, on a 4.4 s cycle: each star in turn over the first 60%, held, then faded.
    const k = (time % 4.4) / 4.4;
    const fade = k < 0.8 ? 1 : 1 - easeInOut((k - 0.8) / 0.2);
    let n = 0;
    ctx.lineCap = 'round';
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      if (!p) continue;
      const t0 = (n / lit) * 0.6;
      n++;
      const on = easeInOut(clamp01((k - t0) / 0.1)) * fade;
      if (on <= 0) continue;
      const next = pts[i + 1];
      if (next) {
        const g = easeInOut(clamp01((k - t0 - 0.04) / (0.6 / lit)));
        if (g > 0) {
          ctx.globalAlpha = 0.75 * fade;
          ctx.strokeStyle = '#e4eaff';
          ctx.lineWidth = 0.34 * s;
          ctx.beginPath();
          ctx.moveTo(p[0] * s, p[1] * s);
          ctx.lineTo((p[0] + (next[0] - p[0]) * g) * s, (p[1] + (next[1] - p[1]) * g) * s);
          ctx.stroke();
        }
      }
      glow(ctx, p[0] * s, p[1] * s, 2.4 * s, 'rgba(200,212,255,0.95)', 0.45 * on);
      const pop = 1 + 0.5 * Math.sin(clamp01((k - t0) / 0.14) * Math.PI);
      ctx.globalAlpha = on;
      twinkle(ctx, p[0] * s, p[1] * s, 1.05 * pop * s, '#ffffff');
    }
    // Little stars winking in and out round it.
    for (let i = 0; i < 4; i++) {
      const cyc = time * 0.6 + i / 4;
      const u = cyc % 1;
      const m = Math.floor(cyc);
      const side = (hash(m, i) > 0.5 ? 1 : -1) * (2.6 + hash(m, i + 3) * 3.2);
      const [x, y] = onBlade(a, 0.08 + hash(m, i + 7) * 0.88, side);
      const r = (0.6 + 1.3 * Math.sin(u * Math.PI)) * s;
      ctx.globalAlpha = Math.sin(u * Math.PI) * 0.9;
      ctx.save();
      ctx.translate(x * s, y * s);
      ctx.rotate((u - 0.5) * 0.9);
      twinkle(ctx, 0, 0, r, ['#fff6cc', '#dfe6ff', '#d4c4ff', '#ffffff'][i]);
      ctx.restore();
    }
    // A glint at the tip now and then.
    if (a.tip) {
      const g = (time % 3.1) / 0.5;
      if (g < 1) {
        ctx.globalAlpha = Math.sin(g * Math.PI);
        twinkle(ctx, a.tip[0] * s, a.tip[1] * s, 2.1 * s, '#ffffff');
      }
    }
    // The shooting star, once every 3.7 s, for 0.9 s: across the sky just above the weapon's
    // highest point on the screen (so it reads against the sky, not the blade), dipping as it goes.
    const sk = (time % 3.7) / 0.9;
    if (sk < 1) {
      const [ux, uy] = screenUp(ctx);
      const [rx, ry] = [-uy, ux];
      const top = [a.tip ?? [0, a.blade[0]], a.head ?? [0, a.blade[0]], [0, 0]].reduce((m, p) => (p[0] * ux + p[1] * uy > m[0] * ux + m[1] * uy ? p : m));
      const mid = [top[0] + ux * 4.5, top[1] + uy * 4.5];
      const d = [rx * 0.86 - ux * 0.5, ry * 0.86 - uy * 0.5];
      const e = easeInOut(sk);
      const head = [mid[0] + d[0] * (e - 0.5) * 24, mid[1] + d[1] * (e - 0.5) * 24];
      const tail = [head[0] - d[0] * 7, head[1] - d[1] * 7];
      const al = Math.sin(sk * Math.PI);
      glow(ctx, head[0] * s, head[1] * s, 2.8 * s, 'rgba(255,246,214,0.95)', 0.55 * al);
      const grd = ctx.createLinearGradient(tail[0] * s, tail[1] * s, head[0] * s, head[1] * s);
      grd.addColorStop(0, 'rgba(200,214,255,0)');
      grd.addColorStop(1, 'rgba(255,251,234,1)');
      ctx.globalAlpha = al;
      ctx.strokeStyle = grd;
      ctx.lineWidth = 0.7 * s;
      ctx.beginPath();
      ctx.moveTo(tail[0] * s, tail[1] * s);
      ctx.lineTo(head[0] * s, head[1] * s);
      ctx.stroke();
      twinkle(ctx, head[0] * s, head[1] * s, 1.6 * s, '#fffbea');
    }
    ctx.restore();
  };
}
// Dreamsilk (Lv 40): drifting ribbons and sparkles. Two silk tails stream from the bow tied on
// it (`a.ribbon`), hanging toward the bottom of the screen however she holds it, swaying apart and
// together, a ripple running down each, and twisting as they go so the satin face and its darker
// back turn in and out of view, their ends cut in a swallowtail; sparkles in pink, gold and lilac
// drift up round the weapon; and its moonstone glows softly.
function dreamLive(a) {
  const tails = [
    { len: 8.6, w: 1.45, ph: 0, lean: 0.38, face: '#ff9ec7', back: '#d9639a', shine: '#ffd3e6' },
    { len: 7.2, w: 1.3, ph: 2.1, lean: -0.3, face: '#ffaed1', back: '#dc6fa3', shine: '#ffe0ee' },
  ];
  return (ctx, time, s) => {
    ctx.save();
    if (a.gem) glow(ctx, a.gem[0] * s, a.gem[1] * s, 3.4 * s, 'rgba(255,244,222,0.95)', 0.22 + 0.1 * Math.sin(time * 1.6));
    // Sparkles drifting up round it.
    const [ux, uy] = screenUp(ctx);
    for (let i = 0; i < 4; i++) {
      const cyc = time * 0.42 + i / 4;
      const u = cyc % 1;
      const m = Math.floor(cyc);
      const [x0, y0] = onBlade(a, 0.1 + hash(m, i) * 0.85, (hash(m, i + 3) - 0.5) * 7);
      const rise = u * 4.5;
      const r = (0.5 + 1.2 * Math.sin(u * Math.PI)) * s;
      ctx.globalAlpha = Math.sin(u * Math.PI) * 0.9;
      ctx.save();
      ctx.translate((x0 + ux * rise) * s, (y0 + uy * rise) * s);
      ctx.rotate((u - 0.5) * 1.2);
      twinkle(ctx, 0, 0, r, ['#fff1a6', '#ffd3e6', '#e6dcff', '#ffffff'][i]);
      ctx.restore();
    }
    // The silk tails.
    if (a.ribbon) {
      const [kx, ky] = a.ribbon;
      const [rx, ry] = [-uy, ux];
      ctx.globalAlpha = 1;
      for (const t of tails) {
        const sway = t.lean + 0.22 * Math.sin(time * 1.15 + t.ph);
        const [dx, dy] = [-ux * Math.cos(sway) + rx * Math.sin(sway), -uy * Math.cos(sway) + ry * Math.sin(sway)];
        const [nx, ny] = [-dy, dx];
        const N = 16;
        const at = (k) => {
          const wave = Math.sin(k * Math.PI * 1.8 - time * 3.1 + t.ph) * 0.85 * k;
          const sag = k * k * 0.9;
          return [kx + dx * k * t.len + nx * (wave + sag * Math.sign(t.lean)), ky + dy * k * t.len + ny * (wave + sag * Math.sign(t.lean))];
        };
        for (let i = 0; i < N; i++) {
          const k0 = i / N;
          const k1 = (i + 1) / N;
          const tw = (k) => Math.cos(k * Math.PI * 1.4 - time * 2.2 + t.ph);
          const half = (k) => ((t.w * (1 - k * 0.35)) / 2) * (0.3 + 0.7 * Math.abs(tw(k)));
          const [x0, y0] = at(k0);
          const [x1, y1] = at(k1);
          const h0 = half(k0);
          const h1 = half(k1);
          const front = tw((k0 + k1) / 2) >= 0;
          ctx.fillStyle = front ? t.face : t.back;
          ctx.beginPath();
          ctx.moveTo((x0 + nx * h0) * s, (y0 + ny * h0) * s);
          ctx.lineTo((x1 + nx * h1) * s, (y1 + ny * h1) * s);
          if (i === N - 1) ctx.lineTo((x1 - dx * 0.7) * s, (y1 - dy * 0.7) * s);
          ctx.lineTo((x1 - nx * h1) * s, (y1 - ny * h1) * s);
          ctx.lineTo((x0 - nx * h0) * s, (y0 - ny * h0) * s);
          ctx.closePath();
          ctx.fill();
          if (front && i < N - 1) {
            ctx.strokeStyle = t.shine;
            ctx.lineWidth = Math.max(0.6, 0.22 * s);
            ctx.beginPath();
            ctx.moveTo((x0 + nx * h0 * 0.55) * s, (y0 + ny * h0 * 0.55) * s);
            ctx.lineTo((x1 + nx * h1 * 0.55) * s, (y1 + ny * h1 * 0.55) * s);
            ctx.stroke();
          }
        }
      }
      // The knot over where the tails leave it.
      ctx.fillStyle = '#ff9ec7';
      ctx.beginPath();
      ctx.ellipse(kx * s, ky * s, 0.62 * s, 0.58 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#ffd3e6';
      ctx.beginPath();
      ctx.ellipse((kx - 0.18) * s, (ky - 0.18) * s, 0.22 * s, 0.18 * s, 0, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  };
}
// ---------- The Nexus aura ----------
// The legendary tier's light, after FFXIV's Nexus relics (the player's reference, a video of
// them, 2026-11-16): the weapon engulfed in light. A big bloom in its colour hugs its shape,
// shimmering and swelling upward like rising vapour; its core is lit; its gold details (found by
// colour) burn white-gold with a hot glow round them, its outline only lightly (so it keeps its
// shape against bright ground); and now and then a surge of light runs up it from the grip. Every layer is made once per
// weapon picture, then only drawn. `drawWeaponAura` is drawn twice round the weapon: 'back'
// before its picture (the bloom), 'front' after it (the core and the burning lines).
// Each class's light on the legendary tier (the player's call, 2026-11-16: one colour and one
// motion for all of them looked the same), by the design's `a.style`: its aura's colours, its
// glow, its sparks.
const REGALIA_LIGHT = {
  storm: { aura: { line: '#f2f8ff', glow: '#bfe0ff', halo: '#5ea6ff', core: '#eef6ff' }, glow: 'rgba(150,200,255,0.95)', spark: '#eef7ff', tint: '#8fc6ff' },
  tide: { aura: { line: '#effffd', glow: '#9ff2ea', halo: '#2fc9c0', core: '#e8fffb' }, glow: 'rgba(120,235,225,0.95)', spark: '#e6fffb', tint: '#6fe3d8' },
  moon: { aura: { line: '#f6f0ff', glow: '#d6c6ff', halo: '#9474ff', core: '#f4efff' }, glow: 'rgba(190,165,255,0.95)', spark: '#f3edff', tint: '#c3adff' },
  sun: { aura: { line: '#fff6d6', glow: '#ffd25a', halo: '#ffbf34', core: '#fff8e6' }, glow: 'rgba(255,222,130,0.95)', spark: '#fff6d6', tint: '#ffd25a' },
  phoenix: { aura: { line: '#fff0dc', glow: '#ffb070', halo: '#ff6326', core: '#fff2e6' }, glow: 'rgba(255,160,90,0.95)', spark: '#fff0dc', tint: '#ff9a4a' },
};
// The aura look for a weapon's anchors, or null.
export const auraFor = (a) => (a?.fx === 'regalia' ? (REGALIA_LIGHT[a.style] ?? REGALIA_LIGHT.sun).aura : null);
// How a moving part moves at `time` (render/hero.js drawWeaponParts): { angle, dx, dy }. Wings beat
// about their roots, each class its own way; a floating crystal bobs and sways.
const WING_BEAT = {
  // Storm: powerful beats with a snap in them.
  storm: (t) => 0.22 * (Math.sin(t * 2.6) + 0.35 * Math.sin(t * 5.2)),
  // Tide: slow, rolling like a swell.
  tide: (t) => 0.15 * (Math.sin(t * 1.3) + 0.3 * Math.sin(t * 2.9 + 1)),
  // Moon: a moth's quick flutter, swelling and easing.
  moon: (t) => 0.1 * Math.sin(t * 9.5) * (0.65 + 0.35 * Math.sin(t * 0.9)) + 0.05 * Math.sin(t * 1.1),
  // Sun: a bird's easy beat.
  sun: (t) => 0.24 * Math.sin(t * 1.9),
  // Phoenix: great beats that hold a moment at the top and bottom.
  phoenix: (t) => 0.26 * (Math.sin(t * 2) + 0.2 * Math.sin(t * 6)),
};
export function partMotion(p, time, a) {
  if (p.kind === 'wing') {
    const f = (WING_BEAT[a?.style] ?? WING_BEAT.sun)(time);
    return { angle: -p.side * (p.flip ? -1 : 1) * f, dx: 0, dy: 0 };
  }
  if (p.kind === 'float') return { angle: Math.sin(time * 0.9) * 0.05, dx: 0, dy: Math.sin(time * 1.4) * 0.9 };
  return { angle: 0, dx: 0, dy: 0 };
}
const AURAS = new WeakMap();
const rgbOf = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
function auraOf(canvas, look, res) {
  let a = AURAS.get(canvas);
  if (a) return a;
  const pad = Math.ceil(10 * res);
  const W = canvas.width + pad * 2;
  const H = canvas.height + pad * 2;
  const blank = () => {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    return c;
  };
  const recolor = (src, color) => {
    const c = blank();
    const g = c.getContext('2d');
    g.drawImage(src, 0, 0);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = color;
    g.fillRect(0, 0, W, H);
    return c;
  };
  const blurred = (src, blur, times) => {
    const c = blank();
    const g = c.getContext('2d');
    g.filter = `blur(${blur}px)`;
    for (let i = 0; i < times; i++) g.drawImage(src, 0, 0);
    return c;
  };
  const sil = blank();
  const sg = sil.getContext('2d', { willReadFrequently: true });
  sg.drawImage(canvas, pad, pad);
  // Its lines: the dark outline and the bright gold, as light.
  const d = sg.getImageData(0, 0, W, H).data;
  const [lr, lg, lb] = rgbOf(look.line);
  const lines = blank();
  const lgx = lines.getContext('2d');
  const out = lgx.createImageData(W, H);
  const o = out.data;
  for (let i = 0; i < d.length; i += 4) {
    const al = d[i + 3];
    if (al < 40) continue;
    const [r, g, b] = [d[i], d[i + 1], d[i + 2]];
    const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const gold = r > 200 && g > 140 && b < 150 && r - b > 80;
    // (The outline only lightly, so the weapon keeps its shape against bright ground.)
    const k = gold ? 0.9 : luma < 0.34 ? 0.32 : 0;
    if (!k) continue;
    o[i] = lr;
    o[i + 1] = lg;
    o[i + 2] = lb;
    o[i + 3] = Math.round(k * al);
  }
  lgx.putImageData(out, 0, 0);
  a = {
    pad, W, H, lines,
    glow: blurred(recolor(lines, look.glow), 1.2 * res, 2),
    core: blurred(recolor(sil, look.core), 0.8 * res, 1),
    halo: blurred(recolor(sil, look.halo), 4.6 * res, 2),
  };
  AURAS.set(canvas, a);
  return a;
}
// The aura of the weapon picture `canvas` drawn at (ox, oy), `w` by `h` (at `scale` screen pixels
// to an art pixel), for its ladder tier's look, at `time`.
export function drawWeaponAura(ctx, canvas, ox, oy, w, h, scale, look, time, layer) {
  if (!look || !canvas.width) return;
  const res = (canvas.width * scale) / w;
  const A = auraOf(canvas, look, res);
  const f = w / canvas.width;
  const [X, Y, W, H] = [ox - A.pad * f, oy - A.pad * f, A.W * f, A.H * f];
  // A shimmer: slow swells with a quicker waver over them, never quite repeating.
  const shim = 0.5 + 0.22 * Math.sin(time * 1.7) + 0.16 * Math.sin(time * 4.3 + 1.1) + 0.12 * Math.sin(time * 7.9 + 2.3);
  const [ux, uy] = screenUp(ctx);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  if (layer === 'back') {
    ctx.globalAlpha = 0.2 + 0.14 * shim;
    ctx.drawImage(A.halo, X, Y, W, H);
    // The bloom swelling upward, like vapour rising off it.
    const rise = ((time * 0.7) % 1) * 3 * scale;
    ctx.globalAlpha = 0.1 * Math.sin(((time * 0.7) % 1) * Math.PI);
    ctx.drawImage(A.halo, X + ux * rise, Y + uy * rise, W, H);
  } else {
    ctx.globalAlpha = 0.06 + 0.06 * shim;
    ctx.drawImage(A.core, X, Y, W, H);
    ctx.globalAlpha = 0.28 + 0.2 * shim;
    ctx.drawImage(A.glow, X, Y, W, H);
    ctx.globalAlpha = 0.45 + 0.25 * shim;
    ctx.drawImage(A.lines, X, Y, W, H);
    // A surge of light running up it from the grip, its edges soft.
    const k = (time * 0.55) % 1.6;
    if (k < 1) {
      const by = oy + h - h * k;
      const peak = Math.sin(k * Math.PI);
      for (const [band, al] of [[0.34, 0.1], [0.2, 0.15], [0.1, 0.22]]) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(X, by - (band * h) / 2, W, band * h);
        ctx.clip();
        ctx.globalAlpha = al * peak;
        ctx.drawImage(A.core, X, Y, W, H);
        ctx.drawImage(A.lines, X, Y, W, H);
        ctx.restore();
      }
    }
  }
  ctx.restore();
}

// Regalia (Lv 50), the Mochi Queen's, the legendary tier: in every class its Nexus aura (above),
// needles of light shooting out of it, pinpoints twinkling, her gold sprout (`a.crest`) beating
// like a slow heart, and white feathers drifting off its wings; and each class's own motion
// (REGALIA_MOTION, by `a.style`), all in its class's light.
const REGALIA_MOTION = {
  // Storm: little lightning arcs crackling along it (their shapes flow, they never jump), and
  // sparks popping.
  storm(ctx, time, s, a, L) {
    for (let i = 0; i < 2; i++) {
      const ph = time * 1.9 + i * 2.6;
      const life = Math.sin(ph);
      if (life < 0.35) continue;
      const al = (life - 0.35) / 0.65;
      const n = Math.floor(ph / TAU);
      const u0 = 0.12 + hash(n, i) * 0.6;
      const u1 = Math.min(0.97, u0 + 0.16 + hash(n, i + 1) * 0.2);
      const sd = hash(n, i + 2) > 0.5 ? 1 : -1;
      const [x0, y0] = onBlade(a, u0, sd * 1.4);
      const [x1, y1] = onBlade(a, u1, sd * 2.2);
      const pts = Array.from({ length: 8 }, (_, k) => {
        const t = k / 7;
        const off = (Math.sin(time * 11 + k * 2.1 + i) * 0.7 + Math.sin(time * 6.3 + k * 3.7) * 0.5) * Math.sin(t * Math.PI);
        return [(x0 + (x1 - x0) * t + off) * s, (y0 + (y1 - y0) * t) * s];
      });
      for (const [wid, col, k] of [[0.95, L.tint, 0.35], [0.3, '#ffffff', 1]]) {
        ctx.globalAlpha = al * k;
        ctx.strokeStyle = col;
        ctx.lineWidth = wid * s;
        ctx.beginPath();
        pts.forEach(([x, y], k2) => (k2 ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.stroke();
      }
    }
    for (let i = 0; i < 3; i++) {
      const cyc = time * 1.6 + i / 3;
      const u = cyc % 1;
      if (u > 0.3) continue;
      const m = Math.floor(cyc);
      const [x, y] = onBlade(a, 0.1 + hash(m, i + 50) * 0.85, (hash(m, i + 51) - 0.5) * 4);
      ctx.globalAlpha = Math.sin((u / 0.3) * Math.PI);
      twinkle(ctx, x * s, y * s, (0.6 + (u / 0.3) * 0.9) * s, '#ffffff');
    }
  },
  // Tide: rings of water rippling up it, little bubbles rising, a ribbon of water spiralling up.
  tide(ctx, time, s, a, L, { ux, uy }) {
    for (let i = 0; i < 2; i++) {
      const u = (time * 0.45 + i * 0.5) % 1;
      const [cx, cy] = onBlade(a, 0.12 + u * 0.82, 0);
      const rw = 2 + Math.sin(u * Math.PI) * 1.6;
      ctx.globalAlpha = Math.sin(u * Math.PI) * 0.7;
      ctx.strokeStyle = L.tint;
      ctx.lineWidth = 0.32 * s;
      ctx.beginPath();
      ctx.ellipse(cx * s, cy * s, rw * s, rw * 0.35 * s, 0, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < 3; i++) {
      const cyc = time * 0.5 + i / 3;
      const u = cyc % 1;
      const m = Math.floor(cyc);
      const [x0, y0] = onBlade(a, 0.15 + hash(m, i + 60) * 0.7, (hash(m, i + 61) - 0.5) * 5);
      const rise = u * 7;
      const r = (0.4 + hash(m, i + 62) * 0.35) * s;
      const x = (x0 + ux * rise + Math.sin(u * 6 + i) * 0.5) * s;
      const y = (y0 + uy * rise) * s;
      ctx.globalAlpha = Math.sin(u * Math.PI) * 0.8;
      ctx.strokeStyle = '#e8fffd';
      ctx.lineWidth = Math.max(0.6, 0.25 * s);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.stroke();
    }
    const head = (time * 0.4) % 1.3;
    for (let j = 0; j < 14; j++) {
      const u = head - j * 0.022;
      if (u < 0 || u > 1) continue;
      const turn = u * TAU * 1.5;
      const [x0, y0] = onBlade(a, u, Math.sin(turn) * 3.6);
      const [x1, y1] = onBlade(a, u + 0.022, Math.sin(turn + TAU * 1.5 * 0.022) * 3.6);
      ctx.globalAlpha = (1 - j / 14) * Math.sin(u * Math.PI) * (Math.cos(turn) >= 0 ? 0.75 : 0.3);
      ctx.strokeStyle = L.tint;
      ctx.lineWidth = (0.7 * (1 - j / 14) + 0.2) * s;
      ctx.beginPath();
      ctx.moveTo(x0 * s, y0 * s);
      ctx.lineTo(x1 * s, y1 * s);
      ctx.stroke();
    }
  },
  // Moon: soft motes of moonlight drifting up and swaying, little crescents glinting in and out,
  // and moth dust sifting down.
  moon(ctx, time, s, a, L, { ux, uy, rx, ry }) {
    for (let i = 0; i < 5; i++) {
      const cyc = time * 0.28 + i / 5;
      const u = cyc % 1;
      const m = Math.floor(cyc);
      const [x0, y0] = onBlade(a, 0.1 + hash(m, i + 70) * 0.85, (hash(m, i + 71) - 0.5) * 7);
      const sway = Math.sin(u * TAU + i) * 1.4;
      glow(ctx, (x0 + ux * u * 4 + rx * sway) * s, (y0 + uy * u * 4 + ry * sway) * s, 1.4 * s, 'rgba(200,180,255,0.95)', 0.55 * Math.sin(u * Math.PI));
    }
    for (let i = 0; i < 2; i++) {
      const cyc = time * 0.5 + i * 0.5;
      const u = cyc % 1;
      const m = Math.floor(cyc);
      const [x, y] = onBlade(a, 0.2 + hash(m, i + 80) * 0.7, (hash(m, i + 81) - 0.5) * 6);
      const r = (0.9 + 0.5 * Math.sin(u * Math.PI)) * s;
      ctx.save();
      ctx.translate(x * s, y * s);
      ctx.rotate(time * 0.6 + i);
      ctx.globalAlpha = Math.sin(u * Math.PI) * 0.9;
      ctx.fillStyle = L.spark;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, TAU);
      ctx.arc(r * 0.45, -r * 0.2, r * 0.85, 0, TAU, true);
      ctx.fill();
      ctx.restore();
    }
    for (let i = 0; i < 4; i++) {
      const cyc = time * 0.35 + i / 4;
      const u = cyc % 1;
      const m = Math.floor(cyc);
      const [x0, y0] = onBlade(a, 0.2 + hash(m, i + 90) * 0.75, (hash(m, i + 91) - 0.5) * 6);
      const fall = u * 4;
      ctx.globalAlpha = Math.sin(u * Math.PI) * 0.8;
      twinkle(ctx, (x0 - ux * fall) * s, (y0 - uy * fall) * s, 0.55 * s, i % 2 ? '#ffffff' : L.tint);
    }
  },
  // Sun: rays of light turning slowly out of her crest, golden wisps rising off it like vapour.
  sun(ctx, time, s, a, L, { ux, uy, rx, ry, upAng }) {
    if (a.crest) {
      const [cx, cy] = a.crest;
      for (let i = 0; i < 6; i++) {
        const ang = time * 0.22 + (i * Math.PI) / 3;
        const len = (4.4 + 1.5 * Math.sin(time * 1.7 + i * 1.3)) * s;
        const [dx, dy] = [Math.cos(ang), Math.sin(ang)];
        const grd = ctx.createLinearGradient(cx * s, cy * s, cx * s + dx * len, cy * s + dy * len);
        grd.addColorStop(0, 'rgba(255,240,190,0.5)');
        grd.addColorStop(1, 'rgba(255,240,190,0)');
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.moveTo(cx * s - dy * 0.42 * s, cy * s + dx * 0.42 * s);
        ctx.lineTo(cx * s + dx * len, cy * s + dy * len);
        ctx.lineTo(cx * s + dy * 0.42 * s, cy * s - dx * 0.42 * s);
        ctx.closePath();
        ctx.fill();
      }
    }
    for (let i = 0; i < 4; i++) {
      const cyc = time * 0.55 + i / 4;
      const u = cyc % 1;
      const m = Math.floor(cyc);
      const [x0, y0] = onBlade(a, 0.05 + hash(m, i) * 0.9, (hash(m, i + 3) - 0.5) * 3);
      const rise = u * 5;
      const x = (x0 + ux * rise + rx * Math.sin(u * 5 + i) * 0.7) * s;
      const y = (y0 + uy * rise + ry * Math.sin(u * 5 + i) * 0.7) * s;
      const len = (2 + 2.2 * Math.sin(u * Math.PI)) * s;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(upAng + Math.sin(time * 2 + i * 1.7) * 0.25);
      const grd = ctx.createLinearGradient(0, len * 0.5, 0, -len);
      grd.addColorStop(0, 'rgba(255,214,110,0)');
      grd.addColorStop(0.4, 'rgba(255,232,160,0.7)');
      grd.addColorStop(1, 'rgba(255,252,236,0)');
      ctx.globalAlpha = Math.sin(u * Math.PI) * 0.35;
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.moveTo(0, len * 0.5);
      ctx.quadraticCurveTo(len * 0.42, 0, 0, -len);
      ctx.quadraticCurveTo(-len * 0.42, 0, 0, len * 0.5);
      ctx.fill();
      ctx.restore();
    }
  },
  // Phoenix: flames licking up off it, embers flying up with short trails, and a ring of fire
  // rippling out round it now and then.
  phoenix(ctx, time, s, a, L, { ux, uy, rx, ry, upAng }) {
    for (let i = 0; i < 6; i++) {
      const cyc = time * 1.1 + i / 6;
      const u = cyc % 1;
      const m = Math.floor(cyc);
      const [x0, y0] = onBlade(a, 0.05 + hash(m, i) * 0.9, (hash(m, i + 3) - 0.5) * 3.4);
      const x = (x0 + ux * u * 3) * s;
      const y = (y0 + uy * u * 3) * s;
      const len = (1.3 + 1.8 * Math.sin(u * Math.PI)) * s;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(upAng + Math.sin(time * 4 + i * 1.7) * 0.3);
      const grd = ctx.createLinearGradient(0, len * 0.4, 0, -len);
      grd.addColorStop(0, 'rgba(255,110,30,0)');
      grd.addColorStop(0.3, 'rgba(255,130,40,0.85)');
      grd.addColorStop(0.65, 'rgba(255,200,110,0.8)');
      grd.addColorStop(1, 'rgba(255,248,220,0)');
      ctx.globalAlpha = Math.sin(u * Math.PI) * 0.5;
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.moveTo(0, len * 0.4);
      ctx.quadraticCurveTo(len * 0.34, -len * 0.05, 0, -len);
      ctx.quadraticCurveTo(-len * 0.34, -len * 0.05, 0, len * 0.4);
      ctx.fill();
      ctx.restore();
    }
    for (let i = 0; i < 6; i++) {
      const cyc = time * 0.6 + i / 6;
      const u = cyc % 1;
      const m = Math.floor(cyc);
      const [x0, y0] = onBlade(a, 0.08 + hash(m, i + 9) * 0.86, (hash(m, i + 11) - 0.5) * 5);
      const drift = Math.sin(u * TAU * 0.8 + i) * 1.4 + (hash(m, i + 2) - 0.5) * 3 * u;
      const x = x0 + ux * u * 9 + rx * drift;
      const y = y0 + uy * u * 9 + ry * drift;
      const al = Math.sin(u * Math.PI) * (0.6 + 0.4 * Math.sin(time * 17 + i * 2.3));
      ctx.globalAlpha = al * 0.7;
      ctx.strokeStyle = '#ff8a32';
      ctx.lineWidth = 0.3 * s;
      ctx.beginPath();
      ctx.moveTo(x * s, y * s);
      ctx.lineTo((x - ux * 1.2) * s, (y - uy * 1.2) * s);
      ctx.stroke();
      ctx.globalAlpha = al;
      ctx.fillStyle = '#fff0cc';
      ctx.beginPath();
      ctx.arc(x * s, y * s, 0.3 * s, 0, TAU);
      ctx.fill();
    }
    const u = (time * 0.5) % 1.4;
    if (u < 1) {
      const [cx, cy] = onBlade(a, 0.55, 0);
      const rw = 2.2 + u * 3;
      ctx.globalAlpha = Math.sin(u * Math.PI) * 0.8;
      ctx.fillStyle = '#ffb060';
      for (let j = 0; j < 16; j++) {
        const t = (j / 16) * TAU + time;
        ctx.beginPath();
        ctx.arc((cx + Math.cos(t) * rw) * s, (cy + Math.sin(t) * rw * 0.4) * s, (0.26 + 0.12 * Math.sin(t * 3 + time * 8)) * s, 0, TAU);
        ctx.fill();
      }
    }
  },
};
function regalLive(a) {
  const L = REGALIA_LIGHT[a.style] ?? REGALIA_LIGHT.sun;
  const motion = REGALIA_MOTION[a.style] ?? REGALIA_MOTION.sun;
  const plume = (ctx, x, y, len, turn) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(turn);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -len / 2);
    ctx.quadraticCurveTo(len * 0.34, -len * 0.1, 0, len / 2);
    ctx.quadraticCurveTo(-len * 0.3, -len * 0.1, 0, -len / 2);
    ctx.fill();
    ctx.fillStyle = '#a8bcf4';
    ctx.beginPath();
    ctx.moveTo(0, -len / 2);
    ctx.quadraticCurveTo(len * 0.2, -len * 0.36, len * 0.04, -len * 0.22);
    ctx.quadraticCurveTo(-len * 0.16, -len * 0.36, 0, -len / 2);
    ctx.fill();
    ctx.strokeStyle = '#f3c443';
    ctx.lineWidth = Math.max(0.5, len * 0.05);
    ctx.beginPath();
    ctx.moveTo(0, -len * 0.46);
    ctx.lineTo(0, len * 0.5);
    ctx.stroke();
    ctx.restore();
  };
  return (ctx, time, s) => {
    ctx.save();
    const [ux, uy] = screenUp(ctx);
    const [rx, ry] = [-uy, ux];
    const upAng = Math.atan2(uy, ux) + Math.PI / 2;
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // The heartbeat of her sprout (riding the scepter's floating crystal).
    let crest = a.crest;
    if (crest && a.parts?.float) {
      const m = partMotion(a.parts.float, time, a);
      crest = [crest[0] + m.dx, crest[1] + m.dy];
    }
    if (crest) {
      const k = (time % 2.4) / 2.4;
      const beat = Math.exp(-((k - 0.08) ** 2) / 0.003) + 0.65 * Math.exp(-((k - 0.25) ** 2) / 0.003);
      glow(ctx, crest[0] * s, crest[1] * s, (3 + beat * 2.2) * s, L.glow, 0.22 + 0.42 * beat);
    }
    motion(ctx, time, s, { ...a, crest }, L, { ux, uy, rx, ry, upAng });
    // Needles of light shooting out of it, lengthening as they go, then fading.
    for (let i = 0; i < 3; i++) {
      const cyc = time * 1.1 + i / 3;
      const u = cyc % 1;
      if (u > 0.55) continue;
      const v = u / 0.55;
      const m = Math.floor(cyc);
      const [x0, y0] = onBlade(a, 0.15 + hash(m, i + 20) * 0.8, 0);
      const ang = hash(m, i + 21) * TAU;
      const [dx, dy] = [Math.cos(ang), Math.sin(ang)];
      const from = 1.5 + v * 6;
      const to = from + 3 + v * 6;
      const grd = ctx.createLinearGradient((x0 + dx * from) * s, (y0 + dy * from) * s, (x0 + dx * to) * s, (y0 + dy * to) * s);
      grd.addColorStop(0, L.spark);
      grd.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.globalAlpha = Math.sin(v * Math.PI) * 0.85;
      ctx.strokeStyle = grd;
      ctx.lineWidth = 0.3 * s;
      ctx.beginPath();
      ctx.moveTo((x0 + dx * from) * s, (y0 + dy * from) * s);
      ctx.lineTo((x0 + dx * to) * s, (y0 + dy * to) * s);
      ctx.stroke();
    }
    // Pinpoints twinkling round it.
    for (let i = 0; i < 4; i++) {
      const cyc = time * 0.9 + i / 4;
      const u = cyc % 1;
      const m = Math.floor(cyc);
      const [x, y] = onBlade(a, 0.05 + hash(m, i + 40) * 0.92, (hash(m, i + 41) - 0.5) * 7);
      ctx.globalAlpha = Math.sin(u * Math.PI);
      twinkle(ctx, x * s, y * s, (0.5 + 1 * Math.sin(u * Math.PI)) * s, i % 2 ? L.spark : L.tint);
    }
    ctx.globalCompositeOperation = 'source-over';
    // White feathers drifting down off its wings, swaying.
    for (let i = 0; i < 2; i++) {
      const cyc = time * 0.24 + i * 0.5;
      const u = cyc % 1;
      const m = Math.floor(cyc);
      const [x0, y0] = onBlade(a, 0.2 + hash(m, i) * 0.7, (hash(m, i + 6) - 0.5) * 6);
      const fall = u * 7;
      const sway = Math.sin(u * TAU * 1.2 + i) * 1.6;
      ctx.globalAlpha = Math.sin(u * Math.PI) * 0.9;
      plume(ctx, (x0 - ux * fall + rx * sway) * s, (y0 - uy * fall + ry * sway) * s, 2.6 * s, upAng + Math.sin(u * TAU * 1.2 + i) * 0.6);
    }
    ctx.restore();
  };
}
const LADDER_LIVE = { tidepearl: tideLive, starglass: starLive, dreamsilk: dreamLive, regalia: regalLive };

const THEME_LIVE = { holy: holyLive, demonic: demonicLive, bone: boneLive, laser: laserLive, chainsaw: chainsawLive, cyber: cyberLive };

export function liveFor(look, a) {
  if (look.theme) return THEME_LIVE[look.theme](a, look);
  if (a.fx && LADDER_LIVE[a.fx]) return LADDER_LIVE[a.fx](a, look);
  const own = look.fx ? PROGRESSION_LIVE[look.fx](a, look) : null;
  return look.glow ? both(own, edgeLive(a, look.glow)) : own;
}
