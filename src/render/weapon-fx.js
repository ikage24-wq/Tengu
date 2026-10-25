// Live weapon effects, drawn every frame on top of the weapon sprite in the weapon's own space
// (grip at the origin, the weapon pointing toward -y). Better weapons do more: steel glints,
// mithril twinkles, runes float glyphs, and each endgame theme has its own show — holy light and
// feathers, hellfire and a blinking eye, soul fire and ghosts, humming energy blades, chainsaw
// smoke and sparks, and neon with glitches and holograms.
//
// `liveFor(look, a)` returns live(ctx, time, s) or null. Anchors `a` are in the weapon's local
// pixels: head, tip, blade [top, base], and per-theme points (halo, wings, flames, eye, eyes,
// beams, orbs, exhaust, sparks, chain, neon, ring, runes).

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

// Steel: a bright glint runs up the edge every few seconds.
function steelLive(a) {
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

// Mithril: a cool shimmer around the gem and twinkles popping along the blade.
function mithrilLive(a) {
  return (ctx, time, s) => {
    ctx.save();
    const [gx, gy] = a.gem ?? a.head;
    glow(ctx, gx * s, gy * s, 7 * s, 'rgba(127,224,255,0.8)', 0.35 + 0.2 * Math.sin(time * 3));
    for (let i = 0; i < 3; i++) {
      const cyc = time * 0.8 + i / 3;
      const k = cyc % 1;
      const n = Math.floor(cyc);
      const [x, y] = onBlade(a, 0.15 + hash(n, i) * 0.8, (hash(n, i + 7) - 0.5) * 6);
      ctx.globalAlpha = Math.sin(k * Math.PI);
      twinkle(ctx, x * s, y * s, (1 + 1.5 * Math.sin(k * Math.PI)) * s, i % 2 ? '#bff4ff' : '#ffffff');
    }
    ctx.restore();
  };
}

// Runic: the runes breathe light and glyphs lift off the weapon and fade.
function runicLive(a, look) {
  return (ctx, time, s) => {
    ctx.save();
    const [x, y0, y1] = a.runes;
    for (let y = y0; y < y1; y += 6) glow(ctx, x * s, y * s, 5 * s, 'rgba(127,252,255,0.6)', 0.15 + 0.15 * Math.sin(time * 4 - y * 0.4));
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

const THEME_LIVE = { holy: holyLive, demonic: demonicLive, bone: boneLive, laser: laserLive, chainsaw: chainsawLive, cyber: cyberLive };

export function liveFor(look, a) {
  if (look.theme) return THEME_LIVE[look.theme](a, look);
  if (look.tier === 2) return steelLive(a);
  if (look.tier === 3) return mithrilLive(a);
  if (look.tier === 4) return a.runes ? runicLive(a, look) : mithrilLive(a);
  return null;
}
