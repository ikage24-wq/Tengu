// Windy Canyon (its remake, 2026-11-18): the rock it is built from and the wind that blows through
// it. The canyon's walls stand at both ends of the map, two rock spires and a great stone arch
// between them; every ledge is a shelf of the same sandstone jutting out of one of them, so nothing
// floats. Behind: a painted canyon of far mesas, buttes and the opposite wall in the haze. Its life:
// pennant strings snapping over the bridges, wind chimes under the arch, sand wisps on the breeze
// and, at night, the rumbles: Gnarlroot tossing in his
// sleep far below, so pebbles hop and sand trickles from under the shelves.

import { E, T, F, R, sprite, blit, snap, mix, shade } from './pixel.js';
import { band } from './propkit.js';
import { windAt, windTravel } from './terrain.js';
import { rumbleAt } from '../world/rumble.js';

// The canyon's sandstone, warm and pastel: alternating hard layers (rock, band) that stand proud,
// soft layers (sh) tucked in under them, a sandy top.
export const CY = {
  rock: '#e99a6c', lit: '#f8bb8a', sh: '#c97c54', deep: '#a86044', dark: '#8a4a36',
  band: '#f2b07e', bandLit: '#ffcf9c', cap: '#ffe0b0', capLit: '#fff2d6', capRock: '#d98a5e',
  varnish: '#b0654a', hole: '#9a5440', holeDeep: '#723c30', line: '#94523c',
  sage: '#a6c69a', sageLit: '#cfe4b4', sageSh: '#7fa682', grass: '#d8c27a', grassLit: '#f2dc98',
  flower: '#ffd36a', flower2: '#ff9fb8',
};

const h01 = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const hexA = (hex, a) => `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${a})`;

// ---------- The big rock pieces (cached pictures, drawn behind the ledges) ----------

// (Drawn inside a margin on every side but the bottom, so nothing is cut off at the edge.)
const M = 40;
const moveIn = (sh) => (sh.pts ? { ...sh, pts: sh.pts.map(([px, py]) => [px + M, py + M]) } : { ...sh, x: (sh.x ?? 0) + M, y: (sh.y ?? 0) + M });
function art(key, w, h, build) {
  return sprite(`cy|${key}`, () => ({ w: w + M * 2, h: h + M, shapes: build().filter(Boolean).map(moveIn), res: 2, soft: 'cel' }));
}
// Bottom middle at (x, y); `y` is the ground line plus the landmarks' 3px sink.
function place(ctx, s, x, y) {
  blit(ctx, s, snap(x - s.w / 2), snap(y - s.h));
}

// The canyon's layers, bottom up: hard ones (thick, standing proud) and soft ones (thin, tucked in).
function layers(rise, seed) {
  const out = [];
  let u = 0;
  for (let i = 0; u < rise; i++) {
    const hard = i % 2 === 0;
    const hgt = Math.min(rise - u, hard ? 34 + h01(seed + i * 1.7) * 26 : 14 + h01(seed + i * 3.1) * 10);
    out.push({ u0: u, u1: u + hgt, hard, i, tone: (i / 2) % 2 === 0 ? 'rock' : 'band' });
    u += hgt;
  }
  return out;
}

// A layer of a wall: from deep in the rock (x0) out to its face (fx), rounded at the face.
function slab(x0, fx, top, bot, r) {
  r = Math.min(r, (bot - top) / 2);
  const pts = [[x0, top]];
  for (let i = 0; i <= 5; i++) {
    const a = -Math.PI / 2 + (i / 5) * (Math.PI / 2);
    pts.push([fx - r + Math.cos(a) * r, top + r + Math.sin(a) * r]);
  }
  for (let i = 0; i <= 5; i++) {
    const a = (i / 5) * (Math.PI / 2);
    pts.push([fx - r + Math.cos(a) * r, bot - r + Math.sin(a) * r]);
  }
  pts.push([x0, bot]);
  return pts;
}
// A layer of a wall whose face bows out (or in) like weathered stone, its corners rounded.
function bowed(x0, fx, top, bot, bulge, r) {
  const pts = [[x0, top]];
  const n = 10;
  const hgt = bot - top;
  r = Math.min(r, hgt / 2);
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const edge = Math.min(1, (Math.min(t, 1 - t) * hgt) / r);
    const round = Math.sqrt(1 - (1 - edge) ** 2);
    pts.push([fx - r * (1 - round) + bulge * Math.sin(Math.PI * t), top + t * hgt]);
  }
  pts.push([x0, bot]);
  return pts;
}
// A rounded block round centre cx, half as wide as hw (both ends rounded).
function pill(cx, hw, top, bot, r) {
  r = Math.min(r, (bot - top) / 2, hw);
  const pts = [];
  const corner = (ox, oy, a0) => {
    for (let i = 0; i <= 4; i++) {
      const a = a0 + (i / 4) * (Math.PI / 2);
      pts.push([ox + Math.cos(a) * r, oy + Math.sin(a) * r]);
    }
  };
  corner(cx + hw - r, top + r, -Math.PI / 2);
  corner(cx + hw - r, bot - r, 0);
  corner(cx - hw + r, bot - r, Math.PI / 2);
  corner(cx - hw + r, top + r, Math.PI);
  return pts;
}

// A little sage bush, a tuft of dry grass, a desert flower: what grows on the rock.
function sage(out, x, y, s) {
  out.push(E(x + 4 * s, y - 3 * s, 6 * s, 4.4 * s, CY.sageSh), E(x - 3 * s, y - 4 * s, 7 * s, 5.2 * s, CY.sage), E(x + 2 * s, y - 6.5 * s, 5.4 * s, 4.2 * s, CY.sage));
  out.push(F(E(x - 4 * s, y - 6 * s, 3.2 * s, 1.8 * s, CY.sageLit)), F(E(x + 1.5 * s, y - 8.6 * s, 2.4 * s, 1.3 * s, CY.sageLit)));
}
function grass(out, x, y, s, lean = 0) {
  for (let k = -2; k <= 2; k++) {
    const tip = [x + k * 2.2 * s + lean * 3 + k * 1.2, y - (7 + (2 - Math.abs(k)) * 2.4) * s];
    out.push(F(T([[x + k * 1.6 * s - 1, y], [x + k * 1.6 * s + 1, y], tip], k % 2 ? CY.grass : CY.grassLit)));
  }
}
function flower(out, x, y, c) {
  for (const [dx, dy] of [[-1.6, 0], [1.6, 0], [0, -1.6], [0, 1.6]]) out.push(F(E(x + dx, y + dy, 1.5, 1.5, c)));
  out.push(F(E(x, y, 0.9, 0.9, '#fff6d8')));
}
// A wind pocket in soft rock: a rounded hollow, darker inside.
function pocket(out, x, y, rx, ry) {
  out.push(F(E(x, y, rx, ry, CY.hole)), F(E(x + rx * 0.18, y + ry * 0.2, rx * 0.66, ry * 0.6, CY.holeDeep)), F(E(x - rx * 0.4, y - ry * 0.5, rx * 0.4, ry * 0.22, CY.deep)));
}
// Desert varnish: a dark streak running down the rock from the top, wavering, thinning out.
function streak(out, x, y, len, wd, seed) {
  const pts = [];
  for (let q = 0; q <= 8; q++) pts.push([x + Math.sin(q * 0.9 + seed) * 1.6, y + (len * q) / 8]);
  out.push(F(band(pts, (u) => wd * (1 - u * 0.75), CY.varnish)));
}

// ---- The canyon walls: the map's two ends, a cliff of stacked sandstone from the riverbed up to
// the windy top. `side` 0 is the west wall (rock to the left, its face on the right), 1 the east
// (mirrored). The ledges jut out of the face in front of it. ----
const WALL_W = 300;
const WALL_FACE = 268;
function wallArt(side, rise) {
  const W = WALL_W;
  const h = rise + 3;
  return art(`wall|${side}|${rise}`, W, h, () => {
    const out = [];
    const r = (k) => h01(side * 41 + k * 7.3);
    const mir = (sh) => {
      if (!side) return sh;
      if (sh.pts) return { ...sh, pts: sh.pts.map(([px, py]) => [W - px, py]) };
      if (sh.t === 'r') return { ...sh, x: W - sh.x - sh.w };
      return { ...sh, x: W - sh.x };
    };
    const push = (...s) => out.push(...s.map(mir));
    const L = layers(rise, side * 13 + 5);
    const faceOf = (ly) => (ly.hard ? WALL_FACE + 2 + r(ly.i) * 18 : WALL_FACE - 8 - r(ly.i) * 10);
    const bulgeOf = (ly) => (ly.hard ? 3 + r(ly.i + 7) * 6 : -2 - r(ly.i + 7) * 3);
    // The soft layers first, tucked in, shadowed under the hard layer above.
    for (const ly of L.filter((q) => !q.hard)) {
      const top = h - ly.u1;
      const bot = h - ly.u0;
      const fx = faceOf(ly);
      push(T(bowed(-M, fx, top - 1, bot + 1, bulgeOf(ly), 6), shade(CY.sh, -10)));
      push(F(T(slab(-M, fx - 1, top - 1, top + 4, 2), CY.deep)));
      // A wind pocket or two, and a flower in a crack.
      if (bot - top > 16 && r(ly.i + 50) > 0.35) {
        const px = fx - 30 - r(ly.i + 51) * 120;
        const tmp = [];
        pocket(tmp, px, (top + bot) / 2 + 1, 7 + r(ly.i + 52) * 6, (bot - top) * 0.28);
        push(...tmp);
      }
      if (r(ly.i + 60) > 0.6) {
        const tmp = [];
        flower(tmp, fx - 10 - r(ly.i + 61) * 40, bot - 3, r(ly.i + 62) > 0.5 ? CY.flower : CY.flower2);
        push(...tmp);
      }
    }
    // The hard layers, standing proud: lit along the top, shadowed underneath, blocky joints.
    for (const ly of L.filter((q) => q.hard)) {
      const top = h - ly.u1;
      const bot = h - ly.u0;
      const fx = faceOf(ly);
      // (Each hard layer a shade of its own, so the cliff doesn't read as stripes.)
      const c = shade(CY[ly.tone], -12 + Math.round((r(ly.i + 33) - 0.5) * 12));
      const bulge = bulgeOf(ly);
      push(T(bowed(-M, fx, top, bot, bulge, 10), c));
      push(F(T(slab(-M, fx - 4, top + 1, top + 5, 3), shade(ly.tone === 'band' ? CY.bandLit : CY.lit, -8))));
      push(F(T(slab(-M, fx - 3, bot - 6, bot - 1, 3), shade(c, -12))));
      // Its face, catching the sun (east wall) or in shadow (west).
      push(F(T(bowed(fx - 12, fx - 1, top + 4, bot - 4, bulge, 6), side ? shade(ly.tone === 'band' ? CY.bandLit : CY.lit, -6) : shade(c, -10))));
      // A crack or two running part way down it, slanting, and fine bedding lines near the face.
      for (let j = 0; j < 2; j++) {
        if (r(ly.i * 3 + j + 80) < 0.45) continue;
        const jx = 40 + r(ly.i * 3 + j) * (fx - 90);
        const len = (bot - top - 10) * (0.5 + 0.5 * r(ly.i + j + 90));
        const lean = (r(ly.i + j + 95) - 0.5) * 6;
        push(F(T([[jx, top + 5], [jx + 1.6, top + 5], [jx + 1.6 + lean, top + 5 + len], [jx + lean, top + 5 + len]], shade(c, -18))));
      }
      if (r(ly.i + 120) > 0.5 && bot - top > 26) {
        for (let q = 0; q < 3; q++) {
          const bx = fx - 60 + q * 14;
          push(F(T([[bx, top + 9 + q * 2], [bx + 26, top + 13 + q * 3], [bx + 26, top + 14.2 + q * 3], [bx, top + 10.2 + q * 2]], shade(c, -8))));
        }
      }
    }
    // Varnish streaks down the face from the top, and down from the odd ledge.
    for (let k = 0; k < 7; k++) {
      const sx = WALL_FACE - 14 - r(k + 100) * 200;
      const sy = h - rise + 6 + r(k + 101) * rise * 0.5;
      const tmp = [];
      streak(tmp, sx, sy, 40 + r(k + 102) * 120, 2 + r(k + 103) * 2.4, k);
      push(...tmp);
    }
    // The top: a sandy rim with sage and dry grass along it.
    // (The rim reaches only as far as the top layer does, so no strip of sand hangs out over the air.)
    push(F(T(slab(-M, faceOf(L[L.length - 1]) - 3, h - rise, h - rise + 4, 2), CY.cap)));
    for (let k = 0; k < 4; k++) {
      const tmp = [];
      const bx = 20 + k * 60 + r(k + 120) * 30;
      if (k % 2) sage(tmp, bx, h - rise + 2, 0.9 + r(k + 121) * 0.4);
      else grass(tmp, bx, h - rise + 2, 1, 0.5);
      push(...tmp);
    }
    // The foot: tumbled boulders and pebbles, a sage bush, grass.
    const foot = [];
    for (let k = 0; k < 3; k++) {
      const bx = WALL_FACE - 22 + k * 17 + r(k + 140) * 6;
      const rr = 6 + r(k + 141) * 7;
      foot.push(E(bx, h - rr * 0.7, rr, rr * 0.75, k % 2 ? CY.rock : CY.band), F(E(bx - rr * 0.3, h - rr * 1.05, rr * 0.45, rr * 0.25, CY.lit)));
    }
    sage(foot, WALL_FACE - 60, h - 1, 1.1);
    push(...foot);
    return out;
  });
}
function drawWall(ctx, x, y, time, seed) {
  place(ctx, wallArt(seed % 2, 480), x, y);
}

// ---- A rock spire (hoodoo): wobbly stacked rounds of sandstone, pinched at every soft layer,
// flaring onto a talus of boulders at its foot, with a hard cap rock on top that the spire's top
// ledge sits on. Its shelves jut out of it in front, both sides. ----
const SP_W = 220;
function spireArt(seed, rise) {
  const W = SP_W;
  const h = rise + 3;
  const cx = W / 2;
  return art(`spire|${seed}|${rise}`, W, h, () => {
    const out = [];
    const r = (k) => h01(seed * 29 + k * 5.7);
    // Talus: boulders heaped at the foot.
    for (let k = 0; k < 9; k++) {
      const bx = cx + (k - 4) * 17 + (r(k) - 0.5) * 8;
      const rr = 9 + r(k + 10) * 10 - Math.abs(k - 4) * 1.1;
      out.push(E(bx, h - rr * 0.6, rr, rr * 0.7, k % 3 ? CY.rock : CY.band));
      out.push(F(E(bx - rr * 0.3, h - rr * 1.0, rr * 0.45, rr * 0.22, CY.lit)));
    }
    // The shaft: rounds stacked from the talus up to the cap.
    const L = layers(rise - 38, seed * 7 + 2);
    let lean = 0;
    for (const ly of L) {
      lean += (r(ly.i + 30) - 0.5) * 5;
      lean = Math.max(-6, Math.min(6, lean));
      const top = h - ly.u1 - 22;
      const bot = h - ly.u0 - 22 + (ly.u0 === 0 ? 22 : 0);
      const hw = ly.hard ? 44 + r(ly.i + 40) * 14 + (ly.u0 === 0 ? 14 : 0) : 34 + r(ly.i + 41) * 6;
      const c = ly.hard ? CY[ly.tone] : CY.sh;
      out.push(T(pill(cx + lean, hw, top - 1, bot + 1, ly.hard ? 12 : 5), c));
      if (ly.hard) {
        // Lit down its left side, shadowed down its right, a highlight along its shoulder.
        out.push(F(T(pill(cx + lean - hw * 0.62, hw * 0.3, top + 4, bot - 4, 6), ly.tone === 'band' ? CY.bandLit : CY.lit)));
        out.push(F(T(pill(cx + lean + hw * 0.66, hw * 0.26, top + 4, bot - 4, 6), shade(c, -12))));
        out.push(F(T(pill(cx + lean - 4, hw - 12, top + 1, top + 5, 2), ly.tone === 'band' ? CY.bandLit : CY.lit)));
        if (r(ly.i + 70) > 0.55) {
          const tmp = [];
          pocket(tmp, cx + lean + (r(ly.i + 71) - 0.5) * hw * 0.9, (top + bot) / 2, 4 + r(ly.i + 72) * 4, 3 + r(ly.i + 73) * 3);
          out.push(...tmp);
        }
      } else {
        out.push(F(T(pill(cx + lean, hw - 1, top, top + 4, 2), CY.deep)));
      }
    }
    // Varnish streaks, and something growing on a shoulder or two.
    for (let k = 0; k < 3; k++) streak(out, cx - 20 + r(k + 90) * 40, h - rise + 40 + r(k + 91) * 120, 50 + r(k + 92) * 100, 2.2, k + seed);
    for (let k = 0; k < 3; k++) {
      const ly = L[(2 + k * 4) % L.length];
      if (!ly?.hard) continue;
      const side = k % 2 ? 1 : -1;
      if (k === 1) grass(out, cx + side * 40, h - ly.u1 - 21, 0.9, side * 0.4);
      else flower(out, cx + side * 36, h - ly.u1 - 20, k ? CY.flower2 : CY.flower);
    }
    // The cap rock: a broad hard slab, its top flat at `rise` (the spire's top ledge sits on it).
    const capTop = h - rise;
    out.push(T(pill(cx + lean * 0.6, 70, capTop, capTop + 40, 14), CY.capRock));
    out.push(F(T(pill(cx + lean * 0.6 - 4, 62, capTop + 30, capTop + 38, 4), CY.deep)));
    out.push(F(T(pill(cx + lean * 0.6 - 30, 24, capTop + 10, capTop + 28, 8), shade(CY.capRock, 12))));
    return out;
  });
}
function drawSpire(ctx, x, y, time, seed) {
  place(ctx, spireArt(seed, 480), x, y);
}
// (A lower stretch of wall: where the canyon ends at the Hollow Gate.)
function drawWallLow(ctx, x, y, time, seed) {
  place(ctx, wallArt(seed % 2, 220), x, y);
}
// (A stub of the same rock on a wall's top: the windmill's lookout stands on one.)
function drawStub(ctx, x, y, time, seed) {
  place(ctx, spireArt(seed, 120), x, y);
}

// ---- The Great Arch: the canyon's landmark, a span of sandstone between two legs, high over the
// dry riverbed with the sky showing through it. Its top is the middle of the windy top's walk (a
// ledge sits on it); the wind howls up through it from below. ----
const ARCH_W = 480;
function archArt(rise) {
  const W = ARCH_W;
  const h = rise + 3;
  const cx = W / 2;
  const a = 160;
  const b = rise - 70;
  return art(`arch|${rise}`, W, h, () => {
    const out = [];
    const r = (k) => h01(k * 9.1 + 4);
    // Edges at height u above the ground: the outer sides flare at the foot; the opening is a tall
    // ellipse from the riverbed up to just under the span.
    const outerL = (u) => 22 - 16 * Math.pow(u / rise, 0.5) + Math.sin(u * 0.05) * 2;
    const outerR = (u) => W - outerL(u) + Math.sin(u * 0.043 + 1) * 2;
    // (A full, rounded crown: the sides stay wide high up and turn in over a broad curve, rather
    // than closing to a point like a tall ellipse.)
    const half = (u) => (u < b ? a * Math.sqrt(Math.max(0, 1 - (u / b) ** 4)) : 0);
    const Y = (u) => h - u;
    // (Sampled finely near the top of the opening, where its edge turns fast, so the arch's crown
    // stays round instead of coming to a point.)
    const stepAt = (u, u0, u1) => (Math.abs(u - b) < 14 ? 0.35 : Math.max(2, (u1 - u0) / 10));
    const piece = (u0, u1, xa, xb) => {
      const pts = [];
      for (let u = u0; u <= u1 + 0.01; u += stepAt(u, u0, u1)) pts.push([xa(u), Y(u)]);
      pts.push([xa(u1), Y(u1)]);
      for (let u = u1; u >= u0 - 0.01; u -= stepAt(u, u0, u1)) pts.push([xb(u), Y(u)]);
      pts.push([xb(u0), Y(u0)]);
      return pts;
    };
    const L = layers(rise, 77);
    // (Every layer split where the opening ends, so each piece is either two legs or one span.)
    const cuts = [];
    for (const ly of L) {
      if (ly.u0 < b && ly.u1 > b) {
        cuts.push({ ...ly, u1: b }, { ...ly, u0: b });
      } else cuts.push(ly);
    }
    for (const ly of cuts) {
      const inset = ly.hard ? 0 : 4;
      const c = ly.hard ? CY[ly.tone] : CY.sh;
      const lo = Math.max(0, ly.u0 - 0.5);
      const hi = Math.min(rise, ly.u1 + 0.5);
      if (ly.u1 <= b) {
        out.push(T(piece(lo, hi, (u) => outerL(u) + inset, (u) => cx - half(u) - inset * 0.5), c));
        out.push(T(piece(lo, hi, (u) => cx + half(u) + inset * 0.5, (u) => outerR(u) - inset), c));
      } else out.push(T(piece(lo, hi, (u) => outerL(u) + inset, (u) => outerR(u) - inset), c));
      if (ly.hard) {
        // Lit along its top edge.
        const t0 = Math.max(lo, hi - 4);
        if (ly.u1 <= b) {
          out.push(F(T(piece(t0, hi - 0.5, (u) => outerL(u) + 2, (u) => cx - half(u) - 2), ly.tone === 'band' ? CY.bandLit : CY.lit)));
          out.push(F(T(piece(t0, hi - 0.5, (u) => cx + half(u) + 2, (u) => outerR(u) - 2), ly.tone === 'band' ? CY.bandLit : CY.lit)));
        } else out.push(F(T(piece(t0, hi - 0.5, (u) => outerL(u) + 2, (u) => outerR(u) - 2), ly.tone === 'band' ? CY.bandLit : CY.lit)));
      }
    }
    // Light and shade: the west leg's outside lit, the inside of the opening in shadow on the west
    // and catching the light on the east, a deep shadow under the span.
    out.push(F(T(piece(10, rise - 30, (u) => outerL(u) + 1, (u) => outerL(u) + 9), CY.lit)));
    out.push(F(T(piece(0, b - 6, (u) => cx - half(u) - 9, (u) => cx - half(u) - 1), CY.deep)));
    out.push(F(T(piece(0, b - 6, (u) => cx + half(u) + 1, (u) => cx + half(u) + 7), CY.bandLit)));
    // A deep shadow just inside the crown of the opening, following its edge.
    {
      const pts = [];
      for (let u = b * 0.6; u <= b; u += 2) pts.push([cx - half(u) + 0.5, Y(u) + 0.5]);
      for (let u = b; u >= b * 0.6; u -= 2) pts.push([cx + half(u) - 0.5, Y(u) + 0.5]);
      // (Then back along a line a little up into the rock, so it's a band hugging the edge.)
      for (let u = b * 0.6; u <= b; u += 2) pts.push([cx + half(u) + 4, Y(u) - 6]);
      for (let u = b; u >= b * 0.6; u -= 2) pts.push([cx - half(u) - 4, Y(u) - 6]);
      out.push(F(T(pts, CY.deep)));
    }
    // Wind pockets and fine bedding lines on the legs.
    for (let k = 0; k < 8; k++) {
      const left = k % 2 === 0;
      const u = 40 + r(k + 60) * (b - 80);
      const x0 = left ? outerL(u) + 12 + r(k + 61) * 30 : outerR(u) - 12 - r(k + 61) * 30;
      if (k < 4) pocket(out, x0, Y(u), 4 + r(k + 62) * 4, 3 + r(k + 63) * 2.4);
      else for (let q = 0; q < 3; q++) out.push(F(T([[x0 - 12, Y(u) + q * 3], [x0 + 12, Y(u) + 3 + q * 3.4], [x0 + 12, Y(u) + 4.2 + q * 3.4], [x0 - 12, Y(u) + 1.2 + q * 3]], CY.sh)));
    }
    // Varnish down both legs and the span's face.
    for (let k = 0; k < 6; k++) {
      const left = k % 2 === 0;
      const sx = left ? 30 + r(k) * 50 : W - 30 - r(k) * 50;
      streak(out, sx, h - rise + 30 + r(k + 10) * 60, 60 + r(k + 20) * 160, 2 + r(k + 30) * 2, k);
    }
    // Dry roots dangling from under the span.
    for (const [dx, len] of [[-84, 18], [-30, 24], [44, 14], [96, 22]]) {
      const x0 = cx + dx;
      // (Rooted in the opening's edge right above it: where its half-width is |dx|.)
      const y0 = Y(b * Math.max(0, 1 - (dx / a) ** 2) ** 0.25) - 3;
      const pts = [];
      for (let q = 0; q <= 6; q++) pts.push([x0 + Math.sin(q * 1.1 + dx) * 2, y0 + (len * q) / 6]);
      out.push(F(band(pts, (u) => 1.6 * (1 - u * 0.6), '#a8784a')));
    }
    // Boulders, sage and grass at both feet.
    for (const [fx, d] of [[outerL(0), 1], [outerR(0), -1]]) {
      for (let k = 0; k < 2; k++) {
        const bx = fx + d * (6 + k * 14) + (r(k + 40) - 0.5) * 4;
        const rr = 6 + r(k + 41 + d) * 6;
        out.push(E(bx, h - rr * 0.6, rr, rr * 0.72, k % 2 ? CY.rock : CY.band), F(E(bx - rr * 0.3, h - rr, rr * 0.42, rr * 0.22, CY.lit)));
      }
      if (d > 0) sage(out, fx - d * 14, h - 1, 1.1);
    }
    return out;
  });
}
function drawArch(ctx, x, y, time) {
  place(ctx, archArt(480), x, y);
}

// ---- The way into Rootwood Hollow: a dark mouth worn into the foot of the east wall, its rim the
// wall's own rock curling in, old roots from the Hollow's tree creeping out over the sill and up its
// sides, a few little glowing mushrooms in the threshold. ----
function caveArt() {
  const W = 140;
  const h = 112;
  return art('cave2', W, h, () => {
    const out = [];
    const cx = W / 2;
    const mouth = (s, c, dx = 0) => {
      const pts = [];
      for (let k = 0; k <= 18; k++) {
        const t = Math.PI * (k / 18);
        pts.push([cx + dx - Math.cos(t) * 40 * s, h - Math.sin(t) ** 0.85 * 86 * s]);
      }
      return T(pts, c);
    };
    // The rim: the wall's rock bevelled in toward the dark, lit along its top-left.
    out.push(mouth(1.24, shade(CY.rock, -14)), F(mouth(1.16, shade(CY.sh, -10))), F(mouth(1.08, CY.deep)));
    out.push(F(T([[cx - 47, h - 70], [cx - 34, h - 96], [cx - 10, h - 106], [cx - 8, h - 102], [cx - 30, h - 92], [cx - 42, h - 68]], shade(CY.lit, -10))));
    // The dark inside, deepening inwards.
    out.push(mouth(1, '#5a3c62'), F(mouth(0.84, '#45304e')), F(mouth(0.64, '#36263f')), F(mouth(0.44, '#2a1e33')));
    // Roots creeping out over the sill and hugging the sides of the mouth.
    const root = (pts, wd) => {
      out.push(band(pts, (u) => wd * (1 - u * 0.6), '#8a5a6a'));
      out.push(F(band(pts.map(([px, py]) => [px - 0.4, py - wd * 0.28]), (u) => wd * 0.3 * (1 - u), '#b88494')));
    };
    root([[cx - 6, h - 4], [cx - 24, h - 2], [cx - 40, h - 6], [cx - 46, h - 22], [cx - 44, h - 46]], 5.4);
    root([[cx + 4, h - 3], [cx + 22, h - 1], [cx + 38, h - 5], [cx + 45, h - 18], [cx + 46, h - 36], [cx + 40, h - 58]], 4.6);
    root([[cx - 36, h - 74], [cx - 22, h - 88], [cx - 4, h - 93], [cx + 14, h - 90], [cx + 28, h - 80]], 3.4);
    return out;
  });
}
function drawCave(ctx, x, y, time) {
  place(ctx, caveArt(), x, y);
  // Something glimmers far down in the dark, breathing.
  const p = 0.5 + 0.5 * Math.sin(time * 1.1);
  const g = ctx.createRadialGradient(x, y - 30, 2, x, y - 30, 30);
  g.addColorStop(0, hexA('#9fe8d8', 0.25 + 0.15 * p));
  g.addColorStop(1, hexA('#9fe8d8', 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - 30, y - 60, 60, 60);
}

// ---- The dry riverbed: smooth river stones half sunk in the sand, bleached driftwood, dry reeds,
// along the canyon floor (`len` px either side of where it's placed). ----
function riverbedArt(len) {
  const W = len * 2;
  const h = 22;
  return art(`riverbed|${len}`, W, h, () => {
    const out = [];
    for (let k = 0; k < len / 50; k++) {
      const bx = 8 + h01(k * 1.3) * (W - 16);
      const rr = 3.4 + h01(k * 2.9 + 1) * 3.6;
      const c = ['#e8d2b8', '#d8c0a8', '#c9b4a6', '#f0dcc4'][k % 4];
      out.push(E(bx, h - rr * 0.45, rr * 1.3, rr * 0.7, c), F(E(bx - rr * 0.4, h - rr * 0.75, rr * 0.5, rr * 0.2, '#fff4e4')));
    }
    for (let k = 0; k < 1; k++) {
      const dx = W * 0.62;
      out.push(T([[dx - 16, h - 2], [dx - 14, h - 5], [dx + 14, h - 7], [dx + 17, h - 4], [dx + 12, h - 2]], '#efe0c8'), F(T([[dx - 12, h - 4.6], [dx + 12, h - 6.2], [dx + 12, h - 5.2], [dx - 12, h - 3.8]], '#fff6e8')));
    }
    for (const u of [0.2, 0.78]) grass(out, u * W, h - 1, 1, 0.4);
    return out;
  });
}
function drawRiverbed(ctx, x, y, time, seed) {
  const len = 300 + (seed % 4) * 100;
  place(ctx, riverbedArt(len), x, y + 1);
}

// The landmark kinds for render/landmarks.js.
export const CANYON_KINDS = {
  canyonwall: { w: WALL_W + M * 2, h: 520, draw: drawWall },
  canyonspire: { w: SP_W + M * 2, h: 520, draw: drawSpire },
  canyonwalllow: { w: WALL_W + M * 2, h: 260, draw: drawWallLow },
  canyonstub: { w: SP_W + M * 2, h: 160, draw: drawStub },
  canyonarch: { w: ARCH_W + M * 2, h: 520, draw: drawArch },
  canyoncave: { w: 220, h: 160, draw: drawCave },
  riverbed: { w: 1000, h: 30, draw: drawRiverbed },
};

// ---------- The ledges: shelves of sandstone ----------

// A shelf jutting out of the rock: a flat sandy top, a thick slab under it lit along its face,
// thickest where it grows out of the rock (`root`: 'left' or 'right'; 'cap' for a spire's cap or
// the arch's top, free at both ends), its underside lumpy and shadowed. Its root end fades into
// the rock it grows from (drawn behind it), so the two read as one stone. Pebbles, dry grass and
// the odd sage bush on top; at night, in a rumble, its pebbles hop and sand trickles from under it.
const shelfDepth = (w, root, seed) => {
  const cap = root === 'cap' || root === 'mid';
  const th = cap ? 14 : 11;
  const sag = cap ? 10 : 15;
  return (u) => {
    let d;
    if (root === 'left') d = sag * 1.35 * Math.pow(1 - u, 0.85) + sag * 0.22;
    else if (root === 'right') d = sag * 1.35 * Math.pow(u, 0.85) + sag * 0.22;
    else d = sag * Math.pow(Math.sin(Math.PI * u), 0.6);
    return th + 3 + d + 2 * Math.sin(u * w * 0.12 + seed * 1.3) + 1.2 * Math.sin(u * w * 0.31 + seed * 2.1);
  };
};
// Its body, drawn once into a picture of its own (origin at the top of its root end... its top
// left), the root end faded out.
function paintShelf(g, w, root, seed) {
  const cap = root === 'cap' || root === 'mid';
  const th = cap ? 14 : 11;
  const rL = root === 'left';
  const rR = root === 'right';
  const n = Math.max(6, Math.round(w / 9));
  const depth = shelfDepth(w, root, seed);
  const pts = [];
  if (rL) pts.push([0, -1]);
  else pts.push([1, th * 0.75], [-1.5, th * 0.4], [0, 2], [3, -1]);
  if (rR) pts.push([w, -1]);
  else pts.push([w - 3, -1], [w, 2], [w + 1.5, th * 0.4], [w - 1, th * 0.75]);
  for (let i = n; i >= 0; i--) {
    const u = i / n;
    let d = depth(u);
    // (Tapering up into a rounded nose at a free end.)
    if (!rR && u > 0.92) d = Math.min(d, th * 0.75 + ((1 - u) / 0.08) * (d - th * 0.75));
    if (!rL && u < 0.08) d = Math.min(d, th * 0.75 + (u / 0.08) * (d - th * 0.75));
    pts.push([u * w, d]);
  }
  const trace = () => {
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.closePath();
  };
  g.save();
  trace();
  g.fillStyle = CY.rock;
  g.fill();
  g.clip();
  // The underside in shadow, deeper towards its edge.
  g.fillStyle = CY.sh;
  g.fillRect(-4, th, w + 8, 60);
  g.strokeStyle = CY.deep;
  g.lineWidth = 7;
  g.beginPath();
  for (let i = 0; i <= n; i++) g.lineTo((i / n) * w, depth(i / n) + 1);
  g.stroke();
  // The face: a lit band under the sand, a seam where the shadow starts.
  g.fillStyle = CY.lit;
  g.fillRect(-4, 3, w + 8, 2.4);
  g.fillStyle = shade(CY.sh, -6);
  g.fillRect(-4, th - 0.5, w + 8, 1.2);
  g.fillStyle = CY.band;
  g.fillRect(-4, th + 0.7, w + 8, 1);
  // Cracks down the face, and a wind pocket or two in the underside.
  for (let j = 0; j < Math.round(w / 70); j++) {
    const jx = 20 + h01(seed * 7 + j) * (w - 40);
    g.fillStyle = shade(CY.rock, -16);
    g.fillRect(jx, 5, 1.2, th - 5);
    if (h01(seed * 11 + j) > 0.5) {
      g.fillStyle = CY.hole;
      g.beginPath();
      g.ellipse(jx + 9, th + 6, 4, 2.6, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = CY.holeDeep;
      g.beginPath();
      g.ellipse(jx + 9.6, th + 6.6, 2.4, 1.5, 0, 0, Math.PI * 2);
      g.fill();
    }
  }
  g.restore();
  trace();
  g.strokeStyle = CY.line;
  g.lineWidth = 1;
  g.stroke();
  // The sandy top, rounded at its free ends.
  g.fillStyle = CY.cap;
  g.strokeStyle = shade(CY.cap, -26);
  g.lineWidth = 0.9;
  g.beginPath();
  g.roundRect(rL ? -2 : 0.5, -2, w + (rL ? 2 : 0) + (rR ? 2 : 0) - 1, 6, 3);
  g.fill();
  g.stroke();
  g.fillStyle = CY.capLit;
  g.fillRect(rL ? 0 : 3, -1.2, w - (rL ? 0 : 3) - (rR ? 0 : 3), 1.4);
  // The root end fading into the rock behind.
  if (rL || rR) {
    g.globalCompositeOperation = 'destination-out';
    const x0 = rL ? -2 : w + 2;
    const x1 = rL ? SHELF_FADE : w - SHELF_FADE;
    const gr = g.createLinearGradient(x0, 0, x1, 0);
    gr.addColorStop(0, 'rgba(0,0,0,1)');
    gr.addColorStop(0.25, 'rgba(0,0,0,0.85)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr;
    g.fillRect(Math.min(x0, x1) - 1, -10, Math.abs(x1 - x0) + 2, 80);
    g.globalCompositeOperation = 'source-over';
  }
}
const SHELF_FADE = 30;
const SHELF_RES = 3;
const SHELF_PAD = [8, 6, 48];
const shelfKept = new Map();
function shelfPicture(w, root, seed) {
  const key = `${w}|${root}|${seed}`;
  let c = shelfKept.get(key);
  if (!c) {
    const [px, pt, pb] = SHELF_PAD;
    c = document.createElement('canvas');
    c.width = Math.ceil((w + px * 2) * SHELF_RES);
    c.height = Math.ceil((pt + pb) * SHELF_RES);
    const g = c.getContext('2d');
    g.scale(SHELF_RES, SHELF_RES);
    g.translate(px, pt);
    paintShelf(g, w, root, seed);
    shelfKept.set(key, c);
  }
  return c;
}
export function drawRockShelf(ctx, x, y, w, time, seed, root, wx, night = 0) {
  x = snap(x);
  y = snap(y);
  const depth = shelfDepth(w, root, seed);
  // At night, in a rumble: sand trickling down from under it.
  const k = rumbleAt(time, night);
  if (k > 0.02) {
    for (let s = 0; s < Math.max(2, Math.round(w / 80)); s++) {
      const u = 0.15 + 0.7 * h01(seed * 3 + s);
      const sx = x + u * w;
      const sy = y + depth(u) - 1;
      // (A thin veil of sand pouring, and grains tumbling down it.)
      const g0 = ctx.createLinearGradient(0, sy, 0, sy + 54);
      g0.addColorStop(0, hexA(CY.capLit, 0.45 * k));
      g0.addColorStop(1, hexA(CY.capLit, 0));
      ctx.fillStyle = g0;
      ctx.fillRect(sx - 1, sy, 2, 54);
      ctx.fillStyle = hexA(CY.capLit, 0.9 * k);
      for (let g = 0; g < 10; g++) {
        const fall = (time * 80 + g * 7 + s * 13) % 70;
        ctx.fillRect(snap(sx - 0.8 + Math.sin(g * 2.1 + s + fall * 0.08) * 1.6), snap(sy + fall), 1.4, 1.8);
      }
    }
  }
  if (typeof document === 'undefined') return;
  const [px, pt, pb] = SHELF_PAD;
  ctx.drawImage(shelfPicture(w, root, seed), x - px, y - pt, w + px * 2, pt + pb);
  // On top: pebbles (hopping in a rumble), dry grass leaning with the wind, the odd sage bush.
  const rL = root === 'left';
  const rR = root === 'right';
  const from = rL ? SHELF_FADE : 8;
  const to = rR ? w - SHELF_FADE : w - 8;
  for (let j = 0; j < Math.round(w / 34); j++) {
    const ppx = x + from + h01(seed * 5.3 + j) * (to - from);
    const lift = k > 0.02 ? Math.abs(Math.sin(time * 15 + j * 2.3)) * 3.2 * k : 0;
    ctx.fillStyle = j % 2 ? CY.band : CY.rock;
    ctx.strokeStyle = CY.line;
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.ellipse(ppx, y - 1.6 - lift, 2.2, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  const wv = windAt(time, x + (wx ?? 0));
  for (let j = 0; j < Math.max(1, Math.round(w / 90)); j++) {
    const gx = x + from + 6 + h01(seed * 9.7 + j * 3) * (to - from - 12);
    if (h01(seed * 2.2 + j) < 0.3) continue;
    for (let b = -2; b <= 2; b++) {
      const len = 6 + (2 - Math.abs(b)) * 2 + h01(seed + j + b) * 2;
      const lean = wv * 3.2 + Math.sin(time * 2.4 + gx * 0.05 + b) * 0.8 + b * 1.4;
      ctx.strokeStyle = b % 2 ? CY.grass : CY.grassLit;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(gx + b * 1.4, y - 1);
      ctx.quadraticCurveTo(gx + b * 1.4 + lean * 0.3, y - len * 0.6, gx + b * 1.4 + lean, y - len);
      ctx.stroke();
    }
  }
  if (w > 150 && h01(seed * 4.4) > 0.45) {
    const bx = x + (rL ? w * 0.7 : rR ? w * 0.3 : w * (0.25 + 0.5 * h01(seed)));
    const sway = wv * 0.6;
    for (const [dx, dy, rx, ry, c] of [[4, -3, 6, 4.4, CY.sageSh], [-3, -4, 7, 5.2, CY.sage], [2 + sway, -6.5, 5.4, 4.2, CY.sage], [-4 + sway * 0.5, -6, 3.2, 1.8, CY.sageLit], [1.5 + sway, -8.6, 2.4, 1.3, CY.sageLit]]) {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(bx + dx, y + dy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ---------- The painted canyon behind ----------

function repeat(camX, factor, spacing, width, draw) {
  const off = camX * factor;
  const first = Math.floor(off / spacing) - 2;
  const count = Math.ceil(width / spacing) + 5;
  for (let k = 0; k < count; k++) draw(first + k, (first + k) * spacing - off);
}
// A far mesa: a flat top on sheer sides, a talus apron at its foot, a few strata lines, lit down
// its west side.
function mesa(ctx, x, base, w, h, body, lit, line) {
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(x - w * 0.7, base + 400);
  ctx.lineTo(x - w * 0.7, base);
  ctx.quadraticCurveTo(x - w * 0.56, base - h * 0.1, x - w * 0.5, base - h * 0.3);
  ctx.lineTo(x - w * 0.46, base - h + 5);
  ctx.quadraticCurveTo(x - w * 0.46, base - h, x - w * 0.41, base - h);
  ctx.lineTo(x + w * 0.41, base - h);
  ctx.quadraticCurveTo(x + w * 0.46, base - h, x + w * 0.46, base - h + 5);
  ctx.lineTo(x + w * 0.5, base - h * 0.3);
  ctx.quadraticCurveTo(x + w * 0.56, base - h * 0.1, x + w * 0.7, base);
  ctx.lineTo(x + w * 0.7, base + 400);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = lit;
  ctx.beginPath();
  ctx.moveTo(x - w * 0.46, base - h + 5);
  ctx.lineTo(x - w * 0.36, base - h + 3);
  ctx.lineTo(x - w * 0.4, base - h * 0.3);
  ctx.lineTo(x - w * 0.5, base - h * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = line;
  for (let k = 1; k <= 3; k++) {
    const yy = base - h + (h * 0.7 * k) / 4;
    ctx.fillRect(x - w * 0.46 + 2, yy, w * 0.92 - 4, 1.4);
  }
}
// A huddle of hoodoos in the middle distance: wobbly stacks of rounded rock, each with a flat cap
// stone, on a heap of talus (the same shapes as the spires up close, softened by the air).
function spires(ctx, x, base, h, body, lit, seed) {
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(x, base + 4, 46, 16, 0, Math.PI, 0);
  ctx.fill();
  for (let k = 0; k < 3; k++) {
    const sx = x + (k - 1) * (20 + h01(seed + k) * 10);
    const sh = h * (0.5 + 0.5 * h01(seed * 3 + k)) * (k === 1 ? 1 : 0.8);
    const sw = 7 + h01(seed * 5 + k) * 5;
    const n = 3 + Math.floor(h01(seed * 7 + k) * 2);
    ctx.fillStyle = body;
    for (let j = 0; j < n; j++) {
      const yy = base - (sh * (j + 0.5)) / n;
      const ww = sw * (1.3 - j * 0.1) * (j % 2 ? 0.8 : 1);
      ctx.beginPath();
      ctx.ellipse(sx + Math.sin(j * 1.7 + seed) * 1.5, yy, ww, (sh / n) * 0.64, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.ellipse(sx, base - sh, sw * 1.45, 4.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = lit;
    ctx.beginPath();
    ctx.ellipse(sx - sw * 0.5, base - sh * 0.5, sw * 0.32, sh * 0.34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(sx - sw * 1.3, base - sh - 3.4, sw * 1.7, 1.6);
  }
}
function haze(ctx, width, y, h, c, k) {
  const g = ctx.createLinearGradient(0, y - h, 0, y + h * 0.4);
  g.addColorStop(0, hexA(c, 0));
  g.addColorStop(0.75, hexA(c, k));
  g.addColorStop(1, hexA(c, k));
  ctx.fillStyle = g;
  ctx.fillRect(0, y - h, width, h * 1.4 + 400);
}
export function drawPaintedCanyon(ctx, t, cam, width, height, time, layerY, air) {
  const sun = t.sun ?? '#fff1c9';
  // 1. A warm glow over the canyon.
  {
    const gx = width * 0.22 - ((cam.x * 0.02) % width) * 0.2;
    const gy = layerY(160, 0.03) - 150;
    const g = ctx.createRadialGradient(gx, gy, 10, gx, gy, Math.max(width, height) * 0.8);
    g.addColorStop(0, hexA(sun, 0.4));
    g.addColorStop(0.35, hexA(sun, 0.1));
    g.addColorStop(1, hexA(sun, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
  }
  // 2. Far mesas in the haze, flat-topped, one behind another.
  const far = mix(t.far, air, 0.62);
  const farY = layerY(215, 0.3);
  repeat(cam.x, 0.03, 230, width, (i, x) => {
    if (h01(i + 3) < 0.2) return;
    const w = 120 + h01(i + 4) * 120;
    const h = 46 + h01(i + 5) * 60;
    mesa(ctx, x + h01(i + 6) * 80, farY, w, h, far, mix(far, sun, 0.35), mix(far, air, 0.3));
  });
  haze(ctx, width, farY, 50, air, 0.5);
  // 3. Buttes and spire clusters nearer, warmer.
  const mid = mix(t.mid, air, 0.55);
  const midY = layerY(200, 0.36);
  repeat(cam.x, 0.06, 170, width, (i, x) => {
    const kind = h01(i * 1.7 + 11);
    const xx = x + h01(i + 12) * 70;
    if (kind < 0.45) mesa(ctx, xx, midY, 70 + h01(i + 13) * 70, 60 + h01(i + 14) * 50, mid, mix(mid, sun, 0.3), mix(mid, air, 0.2));
    else if (kind < 0.85) spires(ctx, xx, midY, 70 + h01(i + 15) * 50, mid, mix(mid, sun, 0.3), i);
  });
  haze(ctx, width, midY, 44, air, 0.42);
  // 4. The far wall of the canyon itself: tall banded cliffs with notches and step-backs.
  const wall = mix(mix(t.mid, t.far, 0.5), air, 0.44);
  const wallLit = mix(wall, sun, 0.22);
  const wallLine = mix(wall, '#ffffff', 0.12);
  const wallY = layerY(0, 0.45);
  const topAt = (sx) => {
    const k = sx + cam.x * 0.12;
    const step = Math.floor(k / 140);
    return wallY - 205 - h01(step * 1.9) * 50 - (Math.abs(((k % 140) + 140) % 140 - 70) < 8 ? -14 : 0);
  };
  ctx.fillStyle = wall;
  ctx.beginPath();
  ctx.moveTo(-4, wallY + 400);
  for (let sx = -4; sx <= width + 8; sx += 4) ctx.lineTo(sx, topAt(sx));
  ctx.lineTo(width + 8, wallY + 400);
  ctx.closePath();
  ctx.fill();
  // Its strata, its lit rims, its varnish.
  ctx.save();
  ctx.clip();
  ctx.fillStyle = wallLine;
  for (let k = 0; k < 11; k++) ctx.fillRect(0, wallY - 230 + k * 22 + Math.sin(k) * 3, width, 1.6);
  repeat(cam.x, 0.12, 140, width, (i, x) => {
    ctx.fillStyle = mix(wall, '#9a5a42', 0.1);
    for (let s = 0; s < 3; s++) ctx.fillRect(x + 22 + s * 34 + h01(i + s) * 12, topAt(x + 30 + s * 34) + 4, 2.2, 40 + h01(i * 3 + s) * 70);
  });
  ctx.restore();
  ctx.fillStyle = wallLit;
  for (let sx = -4; sx <= width + 8; sx += 4) {
    const ty = topAt(sx);
    ctx.fillRect(sx, ty, 4, 2);
  }
  haze(ctx, width, wallY + 10, 60, air, 0.26);
  // 5. Soft beams of sun slanting down into the canyon.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  repeat(cam.x, 0.18, 420, width, (i, x) => {
    if (h01(i + 61) < 0.45) return;
    const w = 40 + h01(i + 62) * 30;
    const a = (0.02 + 0.01 * Math.sin(time * 0.3 + i * 1.9)) * (0.7 + 0.5 * h01(i + 63));
    const x0 = x + h01(i + 64) * 160;
    const g = ctx.createLinearGradient(0, 0, 0, height);
    g.addColorStop(0, hexA(sun, a * 1.3));
    g.addColorStop(0.8, hexA(sun, a * 0.3));
    g.addColorStop(1, hexA(sun, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x0, -10);
    ctx.lineTo(x0 + w, -10);
    ctx.lineTo(x0 + w * 1.4 - 160, height);
    ctx.lineTo(x0 - 160, height);
    ctx.closePath();
    ctx.fill();
  });
  ctx.restore();
}

// ---------- Its life: pennants, chimes, the rumbles ----------

const PENNANTS = ['#ff9fb4', '#ffd36a', '#8fd0ff', '#a8e6a0', '#c8a8ff', '#fff6e8'];
// A string of pennants, sagging between two points, every flag snapping in the wind in turn.
function pennants(ctx, map, f, cam, time) {
  const [x0, y0, x1, y1, seed = 0] = f;
  const len = x1 - x0;
  const sagAmt = Math.abs(len) * 0.08;
  const k = rumbleAt(time, map.night ?? 0);
  const at = (u) => {
    const wob = Math.sin(time * 1.4 + u * 5 + seed) * 1.3 * Math.sin(Math.PI * u) * (1 + k * 2);
    return [x0 + len * u - cam.x, y0 + (y1 - y0) * u + Math.sin(Math.PI * u) * sagAmt + wob - cam.y];
  };
  ctx.strokeStyle = '#8a6a5a';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  for (let i = 0; i <= 16; i++) {
    const [px, py] = at(i / 16);
    if (i) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  ctx.stroke();
  const n = Math.max(2, Math.floor(Math.abs(len) / 17));
  for (let i = 1; i < n; i++) {
    const u = i / n;
    const [px, py] = at(u);
    const wv = windAt(time, x0 + len * u);
    // (The tip swings downwind, harder in a gust, with a quick flutter of its own.)
    const ang = 0.35 + 0.45 * Math.min(1.4, wv) + 0.16 * Math.sin(time * 7.3 + i * 1.9 + seed) + 0.08 * Math.sin(time * 13 + i);
    const tipX = px + Math.sin(ang) * 10;
    const tipY = py + Math.cos(ang) * 10;
    const c = PENNANTS[(i + seed) % PENNANTS.length];
    ctx.fillStyle = c;
    ctx.strokeStyle = shade(c, -34);
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(px - 3.6, py);
    ctx.quadraticCurveTo((px + tipX) / 2 - 1, (py + tipY) / 2 + 1, tipX, tipY);
    ctx.quadraticCurveTo((px + tipX) / 2 + 2, (py + tipY) / 2 - 1, px + 3.6, py);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}
// Wind chimes: a little wooden ring on a cord, five tubes of different lengths swinging under it.
function chimes(ctx, map, c, cam, time) {
  const [wx, wy, seed = 0] = c;
  const k = rumbleAt(time, map.night ?? 0);
  const wv = windAt(time, wx);
  const sway = 0.12 * wv + 0.06 * Math.sin(time * 1.7 + seed) + 0.12 * k * Math.sin(time * 16);
  const x = wx - cam.x;
  const y = wy - cam.y;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(sway);
  ctx.strokeStyle = '#8a6a5a';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 12);
  ctx.stroke();
  ctx.fillStyle = '#c99a6a';
  ctx.strokeStyle = '#8a6040';
  ctx.beginPath();
  ctx.ellipse(0, 13, 7, 2.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  for (let j = 0; j < 5; j++) {
    const tx = -5 + j * 2.5;
    const len = 9 + ((j * 7 + seed) % 5) * 1.6;
    const a = 0.1 * Math.sin(time * 3.1 + j * 1.3 + seed) * (0.5 + wv) + sway * 0.6;
    ctx.save();
    ctx.translate(tx, 14.5);
    ctx.rotate(a);
    ctx.strokeStyle = '#8a6a5a';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 3);
    ctx.stroke();
    ctx.fillStyle = j % 2 ? '#bfe6ff' : '#e6f4ff';
    ctx.strokeStyle = '#7aa0c0';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.roundRect(-0.9, 3, 1.8, len, 0.8);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  // The clapper and its feather tail, swinging most.
  ctx.rotate(0.1 * Math.sin(time * 2.3 + seed) * (0.6 + wv));
  ctx.strokeStyle = '#8a6a5a';
  ctx.beginPath();
  ctx.moveTo(0, 14);
  ctx.lineTo(0, 30);
  ctx.stroke();
  ctx.fillStyle = '#ffd36a';
  ctx.beginPath();
  ctx.arc(0, 22, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff9fb4';
  ctx.beginPath();
  ctx.ellipse(0, 33, 2.2, 4, 0.2 * Math.sin(time * 4 + seed), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
export function drawCanyonLife(ctx, map, cam, width, height, time, groundAt) {
  for (const f of map.pennants ?? []) {
    if (Math.max(f[0], f[2]) < cam.x - 20 || Math.min(f[0], f[2]) > cam.x + width + 20) continue;
    pennants(ctx, map, f, cam, time);
  }
  for (const c of map.chimes ?? []) {
    if (c[0] < cam.x - 30 || c[0] > cam.x + width + 30) continue;
    chimes(ctx, map, c, cam, time);
  }
  // At night, in a rumble, puffs of dust along the floor.
  const k = rumbleAt(time, map.night ?? 0);
  if (k > 0.02) {
    for (let i = 0; i < 8; i++) {
      const wx = cam.x + ((i * 97 + Math.floor(time / 13) * 53) % (width + 40)) - 20;
      const gy = groundAt(map, wx) - cam.y;
      ctx.fillStyle = hexA(CY.cap, 0.3 * k);
      ctx.beginPath();
      ctx.ellipse(wx - cam.x, gy - 3 - k * 3, 8 + k * 6, 3 + k * 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// In front of everything: thin wisps of sand blown across the canyon on the breeze.
export function drawCanyonFront(ctx, map, cam, width, height, time) {
  const night = map.night ?? 0;
  ctx.save();
  ctx.lineCap = 'round';
  for (let i = 0; i < 9; i++) {
    const travel = windTravel(time + i * 3.1) * (90 + i * 9);
    const lane = 160 + h01(i * 3.3) * (map.height - 200);
    const loop = width + 300;
    const sx = ((((travel + i * 211 - cam.x * 1.05) % loop) + loop) % loop) - 150;
    const sy = lane - cam.y + Math.sin(time * 0.7 + i) * 8;
    if (sy < -20 || sy > height + 20) continue;
    const len = 40 + h01(i + 7) * 60;
    const a = (0.16 + 0.1 * Math.sin(time * 0.9 + i * 2)) * (1 - night * 0.6);
    ctx.strokeStyle = hexA('#fff4e0', Math.max(0, a));
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    for (let q = 1; q <= 8; q++) ctx.lineTo(sx + (len * q) / 8, sy + Math.sin(q * 0.8 + time * 2 + i) * 2.4 - q * 0.6);
    ctx.stroke();
    // Grains riding along with it.
    ctx.fillStyle = hexA('#ffe2b4', Math.max(0, a * 2));
    for (let g = 0; g < 4; g++) ctx.fillRect(snap(sx + len * (0.3 + g * 0.2)), snap(sy + Math.sin(g * 2 + time * 3 + i) * 4 - 2), 1.2, 1.2);
  }
  ctx.restore();
}

// The canyon's updraft: the wind howling up through the arch, ribbons of air spiralling up with
// sand and a leaf or two caught in them, a swirl of dust where it starts.
export function drawWhirl(ctx, u, cam, time) {
  const x = u.x - cam.x;
  const top = u.top - 30 - cam.y;
  const bottom = u.bottom - cam.y;
  const h = bottom - top;
  const g = ctx.createLinearGradient(0, top, 0, bottom);
  g.addColorStop(0, hexA('#fff8ee', 0));
  g.addColorStop(0.6, hexA('#fff8ee', 0.12));
  g.addColorStop(1, hexA('#fff8ee', 0.22));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, (top + bottom) / 2, u.w / 2 + 6, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.lineCap = 'round';
  // Ribbons: each a stretch of a spiral rising up the column, front half bright, back half faint.
  for (let j = 0; j < 6; j++) {
    const p = (time * 0.42 + j / 6) % 1;
    const v0 = p - 0.2;
    let prev = null;
    for (let s = 0; s <= 14; s++) {
      const v = v0 + (0.2 * s) / 14;
      if (v < 0 || v > 1) {
        prev = null;
        continue;
      }
      const ph = v * 11 - time * 2.6 + j * 2.1;
      const rr = (u.w / 2) * (0.5 + 0.4 * Math.sin(v * 4 + j)) * (0.75 + 0.25 * v);
      const px = x + Math.sin(ph) * rr;
      const py = bottom - v * h;
      if (prev) {
        const front = Math.cos(ph) > 0;
        const fade = Math.min(1, v * 6, (1 - v) * 5) * Math.sin((Math.PI * s) / 14);
        ctx.strokeStyle = hexA('#ffffff', (front ? 0.6 : 0.2) * fade);
        ctx.lineWidth = front ? 1.6 : 1;
        ctx.beginPath();
        ctx.moveTo(prev[0], prev[1]);
        ctx.lineTo(px, py);
        ctx.stroke();
      }
      prev = [px, py];
    }
  }
  // Sand and leaves riding up.
  for (let i = 0; i < 16; i++) {
    const p = (time * 120 / h + h01(i)) % 1;
    const a = time * 2.6 + i * 2.1;
    const rr = (u.w / 2) * (0.3 + 0.7 * h01(i + 20)) * (0.6 + 0.4 * Math.sin(p * Math.PI));
    const px = x + Math.cos(a) * rr;
    const py = bottom - p * h;
    ctx.globalAlpha = Math.min(1, p * 5, (1 - p) * 4) * (Math.sin(a) > -0.3 ? 1 : 0.5);
    if (i % 5 === 0) {
      ctx.fillStyle = i % 2 ? '#b8d890' : '#e8c070';
      ctx.beginPath();
      ctx.ellipse(px, py, 2.6, 1.3, a, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = i % 2 ? '#ffe2b4' : '#ffffff';
      ctx.fillRect(snap(px), snap(py), 1.4, 1.4);
    }
  }
  ctx.globalAlpha = 1;
  // The dust swirling round its foot.
  for (let k = 0; k < 2; k++) {
    const a0 = time * (2.2 + k) + k * 2;
    ctx.strokeStyle = hexA('#ffe2b4', 0.55 - k * 0.15);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(x, bottom - 2 - k * 4, u.w / 2 + 4 - k * 6, 3 - k * 0.6, 0, a0, a0 + Math.PI * 1.2);
    ctx.stroke();
  }
  ctx.restore();
}
