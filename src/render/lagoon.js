// Lantern Lagoon and the voyage there (data/maps.js lagoon, voyage_out, voyage_home).
//
// The town: the boardwalk is the map's ground, and the lagoon shows beneath its planks (the water,
// the stilts it stands on, the lanterns' reflections), drawn over the land under the deck line
// (`map.lagoon.deck`); the surf laps the cove's sand (`surf`); the point is sea rock, not sand
// (`cliff`), with open sea at its foot (`sea`). Its buildings: stilt houses with roof terraces you
// can climb onto, Mister Brine's tackle shop, the lantern pole and Nori's derby board on Lantern
// Square, the twins' noodle stall, the lighthouse, and the Sea Biscuit moored in the surf.
//
// The voyage: the steamer's deck is the map's ground; below it her hull, her paddle wheel turning,
// the sea running past (waves, far islands, dolphins, flying fish, a whale), and the port coming
// into view at the end.

import { R, E, T, F, mix, shade, snap } from './pixel.js';
import { ramp, planks } from './propkit.js';
import { art, place } from './scenery.js';
import { groundAt } from '../world/physics.js';

const TAU = Math.PI * 2;
const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const pick = (list, seed) => list[Math.floor(hash(seed) * list.length) % list.length];
const WATER = { top: '#7fe0d8', mid: '#4fc0c8', deep: '#3a8ab0', foam: '#f2fffc', glint: '#c8fff6' };
const WOOD = '#b98a62';

function glow(ctx, x, y, r, color, alpha) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}
function puffs(ctx, x, y, time, seed, n = 3, rise = 26) {
  ctx.save();
  for (let i = 0; i < n; i++) {
    const u = (time * 0.35 + i / n + seed) % 1;
    ctx.globalAlpha = 0.55 * (1 - u);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x + Math.sin(time + i) * 3 - u * 10, y - u * rise, 2.5 + u * 5, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

// A band of water from `top` (screen y, the surface) down to `bottom`, x0..x1 on screen: a
// gradient, a bright rim that ripples, and glints drifting along.
function water(ctx, x0, x1, top, bottom, time, wx0, { rim = true } = {}) {
  if (x1 <= x0 || bottom <= top) return;
  const g = ctx.createLinearGradient(0, top, 0, bottom);
  g.addColorStop(0, WATER.top);
  g.addColorStop(0.35, WATER.mid);
  g.addColorStop(1, WATER.deep);
  ctx.fillStyle = g;
  ctx.fillRect(snap(x0), snap(top), Math.ceil(x1 - x0), Math.ceil(bottom - top));
  if (rim) {
    ctx.fillStyle = WATER.foam;
    for (let x = Math.floor(x0 / 4) * 4; x < x1; x += 4) {
      const y = top + Math.sin((x + wx0) * 0.06 + time * 2) * 1.2;
      ctx.fillRect(snap(x), snap(y), 4, 1.5);
    }
  }
  ctx.fillStyle = WATER.glint;
  for (let k = 0; k < (x1 - x0) / 26; k++) {
    const seed = Math.floor((wx0 + x0) / 26) + k;
    const gx = x0 + k * 26 + ((time * 8 + hash(seed) * 26) % 26);
    const gy = top + 6 + hash(seed * 3.1) * Math.max(4, bottom - top - 12);
    ctx.globalAlpha = 0.35 + 0.35 * Math.sin(time * 2 + seed);
    ctx.fillRect(snap(gx), snap(gy), 6 + hash(seed) * 6, 1);
  }
  ctx.globalAlpha = 1;
}

// ---------- The town ----------

// Under the deck, the cove's surf, the point's rock and the sea (drawn after the land, before the
// buildings).
export function drawLagoonGround(ctx, map, cam, width, height, time) {
  const L = map.lagoon;
  if (!L) return;
  const bottom = map.height - cam.y + 10;
  const sx = (wx) => wx - cam.x;
  // The surf at the cove's edge: water over the sand, a foam line pushing in and out.
  if (L.surf) {
    const [a, b] = L.surf;
    const gy = groundAt(map, a) - cam.y;
    const reach = b + Math.sin(time * 0.8) * 10;
    water(ctx, sx(a), sx(reach), gy + 5, bottom, time, a);
    ctx.fillStyle = WATER.foam;
    for (let y = gy + 5; y < gy + 30; y += 5) ctx.fillRect(snap(sx(reach) - 2 + Math.sin(y + time * 2) * 2), snap(y), 3, 3);
  }
  // The stairs from the cove up onto the boardwalk.
  const stairs = [500, 620];
  if (sx(stairs[1]) > -20 && sx(stairs[0]) < width + 20) {
    const r = ramp(WOOD, 0.8);
    for (let wx = stairs[0]; wx < stairs[1]; wx += 12) {
      const y = groundAt(map, wx + 6) - cam.y;
      ctx.fillStyle = r.base;
      ctx.fillRect(snap(sx(wx)), snap(y - 1), 12, 5);
      ctx.fillStyle = r.hi;
      ctx.fillRect(snap(sx(wx)), snap(y - 1), 12, 1.2);
      ctx.fillStyle = r.deep;
      ctx.fillRect(snap(sx(wx)), snap(y + 3), 12, 1);
    }
    for (const wx of [stairs[0] + 8, stairs[1] - 6]) {
      const y = groundAt(map, wx) - cam.y;
      ctx.fillStyle = r.sh;
      ctx.fillRect(snap(sx(wx)), snap(y - 16), 3, 16);
      ctx.fillStyle = '#ffe9a6';
      ctx.fillRect(snap(sx(wx) - 1), snap(y - 19), 5, 4);
    }
  }
  // The boardwalk: the lagoon beneath it, then the stilts, then the deck's own planks on top.
  if (L.deck) {
    const [a, b] = L.deck;
    const x0 = Math.max(-10, sx(a));
    const x1 = Math.min(width + 10, sx(b));
    if (x1 > x0) {
      const gy = groundAt(map, (a + b) / 2) - cam.y;
      water(ctx, x0, x1, gy + 18, bottom, time, cam.x, { rim: true });
      // The lanterns' light in the water.
      for (const l of map.lamps ?? []) {
        if (l.x < a || l.x > b) continue;
        const lx = sx(l.x);
        if (lx < -20 || lx > width + 20) continue;
        ctx.fillStyle = 'rgba(255,233,166,0.55)';
        for (let k = 0; k < 4; k++) ctx.fillRect(snap(lx - 6 + Math.sin(time * 2 + k) * 2), snap(gy + 26 + k * 6), 12 - k * 2, 1.5);
      }
      const r = ramp('#8a6a52', 0.8);
      for (let wx = Math.floor(a / 56) * 56 + 28; wx < b; wx += 56) {
        const x = sx(wx);
        if (x < -10 || x > width + 10) continue;
        ctx.fillStyle = r.sh;
        ctx.fillRect(snap(x), snap(gy + 8), 6, bottom - gy);
        ctx.fillStyle = r.base;
        ctx.fillRect(snap(x), snap(gy + 8), 4, bottom - gy);
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillRect(snap(x - 2), snap(gy + 18 + Math.sin(time * 2 + wx) * 1), 10, 1);
        // A cross brace to the next stilt.
        ctx.strokeStyle = r.sh;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(snap(x + 3), snap(gy + 10));
        ctx.lineTo(snap(x + 59), snap(gy + 16));
        ctx.stroke();
      }
      const d = ramp(WOOD, 0.8);
      ctx.fillStyle = d.base;
      ctx.fillRect(snap(x0), snap(gy - 1), Math.ceil(x1 - x0), 10);
      ctx.fillStyle = d.hi;
      ctx.fillRect(snap(x0), snap(gy - 1), Math.ceil(x1 - x0), 1.5);
      ctx.fillStyle = d.deep;
      ctx.fillRect(snap(x0), snap(gy + 8), Math.ceil(x1 - x0), 2);
      ctx.fillStyle = d.sh;
      for (let wx = Math.floor(a / 22) * 22; wx < b; wx += 22) {
        const x = sx(wx);
        if (x > x0 - 2 && x < x1) ctx.fillRect(snap(x), snap(gy), 1, 8);
      }
    }
  }
  // The point: blue-grey sea rock in strata with pink thrift along the top, open sea at its foot.
  if (L.cliff) {
    const [a, b] = L.cliff;
    const x0 = Math.max(-10, sx(a));
    const x1 = Math.min(width + 10, sx(b));
    if (x1 > x0) {
      const top = groundAt(map, a + 40) - cam.y;
      const base = groundAt(map, a - 10) - cam.y;
      const rock = ramp('#8a92c4', 0.8);
      const g = ctx.createLinearGradient(0, top, 0, bottom);
      g.addColorStop(0, rock.base);
      g.addColorStop(1, rock.deep);
      ctx.fillStyle = g;
      ctx.fillRect(snap(x0), snap(top + 4), Math.ceil(x1 - x0), bottom - top);
      // Boulders bedded in the rock, lit from the top left, and cracks between them.
      for (let wx = Math.floor(a / 46) * 46; wx < b + 46; wx += 46) {
        for (let row = 0; row < 7; row++) {
          const k = hash(wx * 0.31 + row * 7.7);
          const bx = wx - cam.x + (row % 2) * 23 + k * 10;
          const by = top + 22 + row * 30 + hash(wx + row) * 8;
          if (bx < x0 - 30 || bx > x1 + 30 || by > bottom) continue;
          const rw = 14 + k * 10;
          const rh = 9 + k * 5;
          ctx.fillStyle = mix(rock.base, rock.deep, 0.15 + row * 0.08);
          ctx.beginPath();
          ctx.ellipse(snap(bx), snap(by), rw, rh, 0, 0, TAU);
          ctx.fill();
          ctx.fillStyle = mix(rock.hi, rock.base, 0.35 + row * 0.07);
          ctx.beginPath();
          ctx.ellipse(snap(bx - rw * 0.25), snap(by - rh * 0.35), rw * 0.55, rh * 0.4, 0, 0, TAU);
          ctx.fill();
          if (k > 0.6) {
            ctx.fillStyle = '#7fc890';
            ctx.fillRect(snap(bx - 6), snap(by - rh - 1), 10, 3);
          }
        }
      }
      // The cliff face down to the boardwalk.
      const fx = sx(a);
      if (fx > -20 && fx < width + 20) {
        ctx.fillStyle = rock.sh;
        ctx.fillRect(snap(fx - 4), snap(top), 8, base - top + 6);
        ctx.fillStyle = rock.deep;
        ctx.fillRect(snap(fx - 4), snap(top), 2, base - top + 6);
      }
      ctx.fillStyle = '#8ee0a0';
      ctx.fillRect(snap(x0), snap(top - 1), Math.ceil(x1 - x0), 5);
      for (let wx = Math.floor(a / 18) * 18; wx < b; wx += 18) {
        const x = sx(wx);
        if (x < x0 || x > x1) continue;
        ctx.fillStyle = hash(wx) > 0.5 ? '#ff9ec7' : '#ffd6e6';
        ctx.fillRect(snap(x + hash(wx * 3) * 8), snap(top - 3), 3, 3);
      }
    }
  }
  if (L.sea) {
    const [a, b] = L.sea;
    const top = (L.seaTop ?? 600) - cam.y;
    const x0 = Math.max(-10, sx(a));
    const x1 = Math.min(width + 10, sx(b) + 10);
    if (x1 > x0) {
      water(ctx, x0, x1, top, bottom, time, a);
      ctx.fillStyle = WATER.foam;
      for (let y = top; y < bottom; y += 7) ctx.fillRect(snap(x0 - 2 + Math.sin(y * 0.3 + time * 3) * 2), snap(y), 4, 3);
    }
  }
}

// The lantern strings across the boardwalk, swaying, glowing at dusk (drawn with the buildings).
function lanternStrings(ctx, map, cam, width, time) {
  const gy = groundAt(map, 1200) - cam.y;
  const spans = [[640, 760], [760, 1040], [1040, 1200], [1200, 1360], [1360, 1530], [1530, 1720], [1720, 1880]];
  for (const [a, b] of spans) {
    const x0 = a - cam.x;
    const x1 = b - cam.x;
    if (x1 < -10 || x0 > width + 10) continue;
    const y0 = gy - 112;
    const sag = 18 + Math.sin(time * 0.9 + a) * 2;
    ctx.strokeStyle = '#6a5a7a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = 0; k <= 12; k++) {
      const u = k / 12;
      const x = x0 + (x1 - x0) * u;
      const y = y0 + Math.sin(u * Math.PI) * sag;
      k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
    const n = Math.max(2, Math.round((b - a) / 34));
    for (let k = 1; k < n; k++) {
      const u = k / n;
      const x = x0 + (x1 - x0) * u;
      const y = y0 + Math.sin(u * Math.PI) * sag + 2;
      const c = ['#ffb0c8', '#ffe08a', '#9fe8e0', '#ffc8a0'][(k + Math.floor(a / 40)) % 4];
      glow(ctx, x, y + 4, 12, '#ffe9a6', 0.35 + 0.1 * Math.sin(time * 2 + k));
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(snap(x), snap(y + 4), 3.4, 4.2, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#6a5a7a';
      ctx.fillRect(snap(x - 2), snap(y - 0.5), 4, 1.2);
    }
  }
}

// A stilt house on the boardwalk, `h` tall from the deck to its roof: a flat roof terrace (a ledge
// on the map) with a parasol and potted palms, or (`peak`) a thatched roof; round porthole
// windows, a stable door, a drying net and a lantern.
export function stiltHouseArt(seed, h, peak = false) {
  const wallC = pick(['#8fe0d8', '#ffc8a8', '#ffb8cc', '#fff0b0', '#c8d8ff'], seed);
  const trimC = pick(['#ffffff', '#fff4e0'], seed * 3);
  const cloth = pick(['#ff8a8a', '#5fb8d8', '#ffd66b', '#9fe0a0'], seed * 5);
  const W = 104;
  const H = h + (peak ? 34 : 26);
  return art(`lagoon-stilthouse|${wallC}|${h}|${peak}|${cloth}`, W, H, () => {
    const wall = ramp(wallC, 0.7);
    const wood = ramp(WOOD, 0.8);
    const out = [];
    const top = H - h;
    // Walls of boards.
    out.push(R(8, top + 6, W - 16, h - 6, wall.base));
    for (let x = 12; x < W - 10; x += 9) out.push(F(R(x, top + 6, 1, h - 6, wall.sh)));
    out.push(F(R(8, top + 6, W - 16, 2, wall.hi)), F(R(W - 14, top + 6, 6, h - 6, mix(wall.base, wall.sh, 0.5))));
    if (peak) {
      // A thatched roof with a fringe.
      const th = ramp('#e8b878', 0.8);
      out.push(T([[0, top + 10], [W / 2, top - 26], [W, top + 10]], th.base), F(T([[W / 2, top - 26], [W, top + 10], [W / 2, top + 10]], th.sh)));
      for (let x = 2; x < W; x += 6) out.push(F(R(x, top + 8, 3, 5 + hash(x + seed) * 3, th.sh)));
    } else {
      // The roof terrace: a railing, a parasol and potted palms.
      out.push(R(4, top, W - 8, 7, wood.base), F(R(4, top, W - 8, 1.5, wood.hi)));
      for (let x = 8; x < W - 6; x += 8) out.push(R(x, top - 12, 2, 12, wood.sh));
      out.push(R(4, top - 13, W - 8, 2, wood.base));
      out.push(R(W - 30, top - 34, 2, 34, '#7a5238'), T([[W - 50, top - 28], [W - 29, top - 42], [W - 8, top - 28]], cloth));
      for (let k = 0; k < 4; k++) out.push(T([[W - 49 + k * 10.5, top - 28], [W - 44 + k * 10.5, top - 28], [W - 46.5 + k * 10.5, top - 25]], k % 2 ? '#ffffff' : cloth));
      out.push(R(14, top - 9, 9, 9, '#d98a6a'), E(18.5, top - 16, 7, 4, '#5fbf7a'), F(E(14, top - 15, 4, 2, '#7fd88a')), F(E(23, top - 15, 4, 2, '#4faa6a')));
    }
    // Porthole windows, warm inside.
    const port = (cx, cy) => [E(cx, cy, 9, 9, trimC), E(cx, cy, 7, 7, '#5a4a6a'), F(E(cx, cy + 1, 6, 5, '#ffe08a')), F(E(cx - 2, cy - 2, 2, 2, '#fff8d6'))];
    out.push(...port(30, top + 30), ...(h > 120 ? port(74, top + 30) : []));
    // The stable door, its top half open.
    out.push(R(W - 44, H - 52, 26, 52, trimC), R(W - 42, H - 50, 22, 50, wood.base), F(R(W - 42, H - 50, 22, 22, '#5a4a6a')), F(R(W - 42, H - 27, 22, 2, wood.hi)), E(W - 24, H - 18, 1.5, 1.5, '#ffd36b'));
    // A drying net hung on the wall, with a cork float or two.
    const nx = 14;
    const ny = H - 58;
    out.push(T([[nx, ny], [nx + 30, ny], [nx + 26, ny + 34], [nx + 4, ny + 34]], mix(wallC, '#ffffff', 0.45)));
    for (let k = 0; k < 5; k++) out.push(F(R(nx + 3 + k * 6, ny, 0.8, 34, '#e8e0d0')), F(R(nx + 2, ny + 4 + k * 7, 26, 0.8, '#e8e0d0')));
    out.push(E(nx + 8, ny + 20, 2.5, 2.5, '#ff8a6a'), E(nx + 20, ny + 12, 2.5, 2.5, '#ffd66b'));
    // Its lantern by the door.
    out.push(R(W - 52, H - 62, 1.5, 8, '#5a4a6a'), E(W - 51, H - 52, 3.4, 4.4, cloth), F(E(W - 51, H - 52, 2, 2.6, '#fff3c4')));
    return out;
  }, false);
}

// Mister Brine's tackle shop: an open stall under a striped awning, rods racked along the side,
// bait barrels, a fish scale and a sign.
export function tackleShopArt() {
  return art('lagoon-tackleshop', 130, 112, () => {
    const wood = ramp(WOOD, 0.8);
    const out = [];
    out.push(R(10, 30, 110, 82, wood.sh), R(14, 34, 102, 50, '#5a4a6a'), F(R(14, 34, 102, 50, '#6a5a7e')));
    // Shelves of tins and floats inside.
    for (const [y, cs] of [[46, ['#ff8a8a', '#ffd66b', '#9fe8e0', '#ffb0c8', '#9fe0a0']], [64, ['#8fb8ff', '#ff9e7a', '#fff0b0', '#c8a8ff']]]) {
      out.push(R(16, y + 8, 98, 2, wood.hi));
      cs.forEach((c, k) => out.push(R(20 + k * 19, y, 10, 8, c), F(R(20 + k * 19, y, 10, 2, shade(c, 18)))));
    }
    // The counter.
    out.push(...planks(8, 84, 114, 28, wood, 5, 7));
    out.push(F(R(8, 84, 114, 2, wood.hi)));
    // The awning, scalloped.
    for (let k = 0; k < 8; k++) out.push(R(4 + k * 15.25, 16, 15.25, 16, k % 2 ? '#ffffff' : '#4fb0d8'));
    for (let k = 0; k < 8; k++) out.push(E(11.6 + k * 15.25, 32, 7.6, 4, k % 2 ? '#ffffff' : '#4fb0d8'));
    out.push(R(2, 12, 126, 5, '#3a8ab0'));
    // The sign on top: a fish and a hook.
    out.push(R(36, 0, 58, 13, '#fff4e0'), F(R(36, 0, 58, 2, '#ffffff')), E(56, 6.5, 7, 3.5, '#ff9e7a'), T([[62, 6.5], [67, 3], [67, 10]], '#ff9e7a'), F(E(53, 5.6, 1, 1, '#3a2d4f')));
    out.push(R(74, 3, 1.4, 7, '#8a8aa8'), F(R(74, 9, 4, 1.4, '#8a8aa8')));
    // Rods racked along the right side, bait barrels on the left.
    for (let k = 0; k < 4; k++) out.push(R(118 + k * 2.6, 20 - k * 4, 1.4, 92 + k * 4, ['#c99a6b', '#d98a5a', '#b0705a', '#8fa8d8'][k]));
    out.push(R(0, 92, 18, 20, '#9a6a4a'), F(R(0, 96, 18, 2, '#7a5238')), F(R(0, 104, 18, 2, '#7a5238')), E(9, 92, 9, 3, '#e8b878'));
    return out;
  }, false);
}

// The noodle stall: a red lantern-hung counter, two steaming pots, bowls stacked, a noren curtain.
export function noodleStallArt() {
  return art('lagoon-noodlestall', 120, 108, () => {
    const wood = ramp('#c87a5a', 0.8);
    const out = [];
    out.push(R(8, 18, 104, 90, wood.sh), R(12, 22, 96, 48, '#fff4e0'));
    // The noren curtain, split in three, with a bowl crest.
    for (let k = 0; k < 3; k++) out.push(R(14 + k * 31.5, 22, 30, 24, '#ff8a8a'), F(R(14 + k * 31.5, 22, 30, 3, '#ffb0b0')));
    out.push(E(60, 33, 8, 4, '#ffffff'), F(R(52, 31, 16, 2, '#ffffff')), R(56, 26, 1, 6, '#ffffff'), R(62, 25, 1, 7, '#ffffff'));
    // The roof.
    out.push(T([[0, 22], [60, 4], [120, 22]], '#5a4a6a'), F(T([[60, 4], [120, 22], [60, 22]], '#4a3a5a')), R(0, 20, 120, 4, '#7a5a8a'));
    // Bowls stacked, a pot on the counter.
    out.push(...planks(6, 74, 108, 34, wood, 4, 3));
    out.push(F(R(6, 74, 108, 2, shade('#c87a5a', 20))));
    for (let k = 0; k < 3; k++) out.push(E(24, 70 - k * 4, 9, 3, k % 2 ? '#ffffff' : '#ffd6e6'));
    out.push(R(80, 58, 22, 16, '#8a8aa8'), F(R(80, 58, 22, 3, '#c4c8e0')), R(78, 56, 26, 3, '#6a6a88'));
    // Two paper lanterns.
    for (const x of [6, 114]) out.push(R(x - 0.7, 22, 1.4, 6, '#5a4a6a'), E(x, 34, 6, 7, '#ff6b6b'), F(R(x - 6, 30, 12, 1, '#ffd36b')), F(R(x - 6, 38, 12, 1, '#ffd36b')));
    return out;
  }, false);
}

// Nori's derby board: a notice board on posts with the derby's banner, a big fish painted on it.
export function derbyBoardArt() {
  return art('lagoon-derbyboard', 74, 96, () => {
    const wood = ramp(WOOD, 0.8);
    return [
      R(8, 30, 5, 66, wood.sh), R(61, 30, 5, 66, wood.sh),
      ...planks(2, 24, 70, 50, wood, 5, 11, true),
      R(6, 30, 62, 38, '#fff8e8'), F(R(6, 30, 62, 2, '#ffffff')),
      // The banner across the top.
      R(0, 12, 74, 14, '#ff8a6a'), F(R(0, 12, 74, 2, '#ffb09a')), T([[0, 12], [-6, 19], [0, 26]], '#e8705a'), T([[74, 12], [80, 19], [74, 26]], '#e8705a'),
      // A trophy fish on top.
      E(37, 6, 12, 5, '#ffd66b'), T([[47, 6], [54, 1], [54, 11]], '#ffd66b'), F(E(32, 5, 1.2, 1.2, '#3a2d4f')), F(E(37, 4, 8, 1.4, '#fff0b0')),
    ];
  }, false);
}

// The lighthouse on the point: a tapering white tower with coral bands, a door and windows, the
// gallery (a ledge on the map) and the lamp room with its light.
export const LIGHTHOUSE = { w: 110, h: 300, lamp: [55, 52], gallery: 178 };
export function lighthouseArt() {
  const { w: W, h: H } = LIGHTHOUSE;
  return art('lagoon-lighthouse', W, H, () => {
    const out = [];
    const body = ramp('#fff8f0', 0.6);
    const band = '#ff8a7a';
    // The tower, wider at the base.
    const tw = (y) => 26 + ((y - 120) / (H - 120)) * 16;
    out.push(T([[W / 2 - tw(120), 120], [W / 2 + tw(120), 120], [W / 2 + tw(H), H], [W / 2 - tw(H), H]], body.base));
    out.push(F(T([[W / 2 + 8, 120], [W / 2 + tw(120), 120], [W / 2 + tw(H), H], [W / 2 + 12, H]], body.sh)));
    for (const y of [150, 210, 262]) out.push(F(T([[W / 2 - tw(y), y], [W / 2 + tw(y), y], [W / 2 + tw(y + 20), y + 20], [W / 2 - tw(y + 20), y + 20]], band)));
    // The door and windows.
    out.push(R(W / 2 - 9, H - 30, 18, 30, '#5a4a6a'), E(W / 2, H - 30, 9, 6, '#5a4a6a'), F(R(W / 2 - 7, H - 28, 14, 28, '#7a5a8a')));
    for (const y of [176, 236]) out.push(R(W / 2 - 4, y, 8, 11, '#5a4a6a'), F(R(W / 2 - 3, y + 1, 6, 9, '#ffe08a')));
    // The gallery and its railing (its floor is a ledge on the map).
    out.push(R(4, 112, W - 8, 8, '#6a5a7a'), F(R(4, 112, W - 8, 2, '#8a7a9a')));
    for (let x = 6; x < W - 4; x += 7) out.push(R(x, 96, 1.6, 16, '#6a5a7a'));
    out.push(R(4, 95, W - 8, 2, '#6a5a7a'));
    // The lamp room: glass all round, a red cap and a weathervane fish.
    out.push(R(W / 2 - 20, 34, 40, 62, '#5a4a6a'), F(R(W / 2 - 17, 38, 34, 54, '#fff3c4')), F(R(W / 2 - 17, 38, 12, 54, '#fff8dc')));
    for (const x of [-8, 3]) out.push(F(R(W / 2 + x, 38, 2, 54, '#6a5a7a')));
    out.push(T([[W / 2 - 26, 36], [W / 2, 12], [W / 2 + 26, 36]], band), F(T([[W / 2, 12], [W / 2 + 26, 36], [W / 2, 36]], shade(band, -16))));
    out.push(R(W / 2 - 0.8, 0, 1.6, 14, '#6a5a7a'), E(W / 2 + 4, 4, 5, 2.4, '#ffd66b'), T([[W / 2 + 9, 4], [W / 2 + 13, 1], [W / 2 + 13, 7]], '#ffd66b'));
    return out;
  }, false);
}

// The Sea Biscuit: a little paddle steamer, white hull and coral trim, a funnel, a wheelhouse and
// the paddle box (the wheel inside turns, drawn live). 150 wide.
export function steamerArt() {
  return art('lagoon-steamer', 150, 92, () => {
    const out = [];
    const hull = ramp('#ffffff', 0.6);
    out.push(T([[0, 62], [150, 62], [138, 86], [14, 86]], hull.base), F(T([[75, 62], [150, 62], [138, 86], [75, 86]], hull.sh)));
    out.push(R(0, 60, 150, 5, '#ff8a7a'), F(R(10, 78, 128, 3, '#4fb0d8')));
    for (const x of [30, 52, 98, 120]) out.push(E(x, 71, 3, 3, '#5a4a6a'), F(E(x, 71, 2, 2, '#9fe8ff')));
    // The wheelhouse and its roof.
    out.push(R(46, 32, 46, 28, '#fff4e0'), F(R(46, 32, 46, 2, '#ffffff')), R(42, 28, 54, 5, '#ff8a7a'));
    for (const x of [52, 66, 80]) out.push(R(x, 38, 9, 9, '#5a4a6a'), F(R(x + 1, 39, 7, 7, '#bfe8ff')));
    // The funnel, cream with a coral band.
    out.push(R(104, 14, 14, 46, '#fff4e0'), F(R(112, 14, 6, 46, '#e8dcc8')), R(102, 14, 18, 7, '#ff8a7a'), R(102, 10, 18, 4, '#5a4a6a'));
    // The name on the bow.
    out.push(F(R(122, 66, 20, 2, '#3a8ab0')));
    // A pennant on the stern staff.
    out.push(R(6, 30, 1.4, 32, '#6a5a7a'), T([[7.4, 30], [22, 34], [7.4, 38]], '#ffd66b'));
    return out;
  }, false);
}

// The quay at Pastel Harbor where the Sea Biscuit ties up: a short jetty over a strip of water,
// a sign to the lagoon, and the steamer alongside (drawn live).
function drawFerryJetty(ctx, map, wx, cam, time) {
  const gy = groundAt(map, wx) - cam.y;
  const x = wx - cam.x;
  // The water along the quay wall, the steamer moored in it (small: she's further out), and the
  // signpost by the captain.
  water(ctx, x - 40, x + 56, gy + 6, gy + 44, time, wx);
  const k = 0.55;
  const bob = Math.sin(time * 1.4) * 1.2;
  ctx.save();
  ctx.translate(snap(x + 10), snap(gy + 30 + bob));
  ctx.scale(k, k);
  place(ctx, steamerArt(), 0, 0);
  ctx.restore();
  paddle(ctx, x + 10 + k * (60 - 75), gy + 30 + bob - k * 30, k, time * 0.6);
  puffs(ctx, x + 10 + k * (111 - 75), gy + 30 + bob - k * 92, time, 0.4, 3, 18);
  const r = ramp(WOOD, 0.8);
  const sx = x - 66;
  ctx.fillStyle = r.sh;
  ctx.fillRect(snap(sx), snap(gy - 40), 3, 40);
  ctx.fillStyle = '#fff4e0';
  ctx.fillRect(snap(sx - 18), snap(gy - 46), 40, 12);
  ctx.fillStyle = '#4fb0d8';
  ctx.beginPath();
  ctx.moveTo(snap(sx + 22), snap(gy - 46));
  ctx.lineTo(snap(sx + 29), snap(gy - 40));
  ctx.lineTo(snap(sx + 22), snap(gy - 34));
  ctx.fill();
  ctx.fillStyle = '#3a8ab0';
  ctx.font = 'bold 6px sans-serif';
  ctx.fillText('LAGOON', snap(sx - 15), snap(gy - 37.5));
}

// A paddle wheel turning, centred at (x, y) screen, radius 14 * k.
function paddle(ctx, x, y, k, a) {
  const r = 14 * k;
  ctx.save();
  ctx.translate(snap(x), snap(y));
  ctx.fillStyle = '#ff8a7a';
  ctx.beginPath();
  ctx.arc(0, 0, r + 3 * k, Math.PI, 0);
  ctx.fill();
  ctx.rotate(a);
  ctx.strokeStyle = '#7a5a4a';
  ctx.lineWidth = 2 * k;
  for (let i = 0; i < 6; i++) {
    const t = (i / 6) * TAU;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(t) * r, Math.sin(t) * r);
    ctx.stroke();
  }
  ctx.restore();
}

// The town's buildings (a town piece each, drawn with the street).
export function drawLagoonPiece(ctx, map, kind, wx, extra, cam, width, time) {
  const x = wx - cam.x;
  if (x < -180 || x > width + 180) return false;
  const gy = groundAt(map, wx) - cam.y;
  if (kind === 'stilthouse') {
    const h = extra ?? HOUSE_H[wx] ?? 140;
    place(ctx, stiltHouseArt(wx * 0.37, h, !HOUSE_DECK.has(wx)), snap(x), gy + 2);
    return true;
  }
  if (kind === 'tackleshop') {
    place(ctx, tackleShopArt(), snap(x), gy + 2);
    return true;
  }
  if (kind === 'noodlestall') {
    place(ctx, noodleStallArt(), snap(x), gy + 2);
    puffs(ctx, x + 31, gy - 54, time, 0.2, 3, 22);
    for (const lx of [x - 54, x + 54]) glow(ctx, lx, gy - 74, 16, '#ff9a7a', 0.4 + 0.1 * Math.sin(time * 2 + lx));
    return true;
  }
  if (kind === 'derbyboard') {
    place(ctx, derbyBoardArt(), snap(x), gy + 2);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 7px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FISHING DERBY', snap(x), snap(gy - 75.5));
    ctx.fillStyle = '#6a5a7a';
    ctx.font = '6px sans-serif';
    for (const [k, line] of (map.derbyLines ?? ['Every hour,', 'on the hour!', 'Biggest catch', 'wins!']).slice(0, 4).entries()) ctx.fillText(line, snap(x), snap(gy - 58 + k * 8));
    ctx.textAlign = 'left';
    return true;
  }
  if (kind === 'lanternpole') {
    const r = ramp('#6a5a7a', 0.8);
    ctx.fillStyle = r.base;
    ctx.fillRect(snap(x - 2), snap(gy - 120), 4, 120);
    ctx.fillStyle = r.hi;
    ctx.fillRect(snap(x - 2), snap(gy - 120), 1, 120);
    glow(ctx, x, gy - 126, 30, '#ffd27a', 0.45 + 0.12 * Math.sin(time * 1.6));
    ctx.fillStyle = '#ffd27a';
    ctx.beginPath();
    ctx.ellipse(snap(x), snap(gy - 126), 7, 9, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ff8a6a';
    ctx.fillRect(snap(x - 7), snap(gy - 134), 14, 2);
    ctx.fillRect(snap(x - 7), snap(gy - 119), 14, 2);
    return true;
  }
  if (kind === 'lighthouse') {
    place(ctx, lighthouseArt(), snap(x), gy + 2);
    const top = gy + 2 - LIGHTHOUSE.h;
    const lx = x - LIGHTHOUSE.w / 2 + LIGHTHOUSE.lamp[0];
    const ly = top + LIGHTHOUSE.lamp[1];
    glow(ctx, lx, ly, 34, '#fff3a6', 0.5 + 0.15 * Math.sin(time * 1.3));
    // The beam, sweeping slowly out to sea and back.
    const a = Math.sin(time * 0.5) * 0.9;
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(a);
    const g = ctx.createLinearGradient(0, 0, 260, 0);
    g.addColorStop(0, 'rgba(255,243,166,0.32)');
    g.addColorStop(1, 'rgba(255,243,166,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, -3);
    ctx.lineTo(260, -26);
    ctx.lineTo(260, 26);
    ctx.lineTo(0, 3);
    ctx.fill();
    ctx.restore();
    return true;
  }
  if (kind === 'steamer') {
    const bob = Math.sin(time * 1.3) * 1.4;
    place(ctx, steamerArt(), snap(x), gy + 22 + bob);
    paddle(ctx, x - 75 + 60, gy + 22 + bob - 30, 1, time * 0.4);
    puffs(ctx, x - 75 + 111, gy + 22 + bob - 92, time, 0.6, 3, 22);
    // The gangplank to the sand.
    ctx.strokeStyle = '#8a6a52';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(snap(x + 60), snap(gy - 8 + bob));
    ctx.lineTo(snap(x + 110), snap(gy));
    ctx.stroke();
    return true;
  }
  if (kind === 'rockpools') {
    for (const [dx, rx] of [[-40, 22], [24, 30]]) {
      ctx.fillStyle = '#c8a888';
      ctx.beginPath();
      ctx.ellipse(snap(x + dx), snap(gy + 2), rx + 4, 7, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = WATER.top;
      ctx.beginPath();
      ctx.ellipse(snap(x + dx), snap(gy + 2), rx, 5, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = WATER.glint;
      ctx.fillRect(snap(x + dx - rx / 2 + Math.sin(time + dx) * 3), snap(gy + 1), 8, 1);
    }
    // A starfish and a crab on the rocks.
    ctx.fillStyle = '#ff9e7a';
    for (let k = 0; k < 5; k++) {
      const t = (k / 5) * TAU - Math.PI / 2;
      ctx.fillRect(snap(x + 60 + Math.cos(t) * 3), snap(gy - 3 + Math.sin(t) * 3), 2, 2);
    }
    const cx = x - 80 + Math.sin(time * 0.6) * 14;
    ctx.fillStyle = '#ff6b5a';
    ctx.beginPath();
    ctx.ellipse(snap(cx), snap(gy - 2), 4, 2.6, 0, 0, TAU);
    ctx.fill();
    ctx.fillRect(snap(cx - 6), snap(gy - 4), 2, 2);
    ctx.fillRect(snap(cx + 4), snap(gy - 4), 2, 2);
    return true;
  }
  if (kind === 'ferryjetty') {
    drawFerryJetty(ctx, map, wx, cam, time);
    return true;
  }
  return false;
}

// Which stilt houses have a roof terrace you can climb onto (and its height off the deck); the
// rest have thatched roofs.
const HOUSE_H = { 760: 132, 1040: 134, 1360: 120, 1720: 150 };
const HOUSE_DECK = new Set([1040, 1360, 1720]);

// After the buildings: the lantern strings overhead.
export function drawLagoonOverhead(ctx, map, cam, width, time) {
  if (map.id === 'lagoon') lanternStrings(ctx, map, cam, width, time);
}

// ---------- The voyage ----------

// The sea going by, under the steamer's deck: far islands sliding past, the waves, the sea life,
// the port coming into view; then her hull, her paddle wheel and her funnel's smoke.
export function drawVoyage(ctx, map, cam, width, height, time, progress) {
  const v = map.voyage;
  if (!v) return;
  const deck = map.groundY - cam.y;
  const sea = deck + 34;
  const p = progress ?? 0;
  // The horizon and the far islands, sliding by.
  const horizon = deck - 40;
  ctx.fillStyle = '#9fd8e8';
  ctx.fillRect(0, snap(horizon), width, deck - horizon);
  for (let k = 0; k < 6; k++) {
    const wx = ((k * 420 - p * 900 - time * 4) % 2520 + 2520) % 2520 - 300;
    const w = 90 + hash(k) * 120;
    ctx.fillStyle = mix('#7fc0b0', '#9fd8e8', 0.4);
    ctx.beginPath();
    ctx.ellipse(snap(wx), snap(horizon + 2), w / 2, 12 + hash(k * 3) * 10, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = mix('#5fa890', '#9fd8e8', 0.4);
    ctx.fillRect(snap(wx - 2), snap(horizon - 22), 2, 12);
    ctx.beginPath();
    ctx.ellipse(snap(wx), snap(horizon - 22), 8, 3, 0, 0, TAU);
    ctx.fill();
  }
  // The port ahead, coming into view over the last stretch: the lagoon's lighthouse, or the
  // harbor's galleon masts.
  if (p > 0.75) {
    const k = (p - 0.75) / 0.25;
    const px = width + 140 - k * 260;
    ctx.fillStyle = mix('#7fb8a8', '#9fd8e8', 0.25);
    ctx.beginPath();
    ctx.ellipse(snap(px), snap(horizon + 4), 150, 26, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#fff8f0';
    if (v.to === 'lagoon') {
      ctx.fillRect(snap(px + 40), snap(horizon - 52), 9, 32);
      ctx.fillStyle = '#ff8a7a';
      ctx.fillRect(snap(px + 39), snap(horizon - 58), 11, 6);
      glow(ctx, px + 44, horizon - 54, 16, '#fff3a6', 0.6);
    } else {
      for (const dx of [-20, 10, 34]) ctx.fillRect(snap(px + dx), snap(horizon - 60), 2, 44);
      ctx.fillStyle = '#ffd6e6';
      for (const dx of [-20, 10, 34]) ctx.fillRect(snap(px + dx - 8), snap(horizon - 52), 18, 10);
    }
  }
  // The whale, far out, at about two thirds of the way: a back, a spout and a tail.
  const wk = (p - 0.58) / 0.14;
  if (wk > 0 && wk < 1) {
    const wx = width * 0.9 - wk * width * 0.7;
    const up = Math.sin(wk * Math.PI);
    ctx.fillStyle = '#6a8ac0';
    ctx.beginPath();
    ctx.ellipse(snap(wx), snap(horizon + 6), 30, 7 * up, 0, Math.PI, 0);
    ctx.fill();
    if (wk > 0.3 && wk < 0.7) {
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      for (let i = 0; i < 6; i++) ctx.fillRect(snap(wx - 8 + Math.sin(i * 1.3) * 6), snap(horizon - 2 - i * 4 * up), 2, 2);
    }
    if (wk > 0.75) {
      ctx.fillStyle = '#6a8ac0';
      ctx.beginPath();
      ctx.moveTo(snap(wx + 26), snap(horizon + 6));
      ctx.lineTo(snap(wx + 40), snap(horizon - 10));
      ctx.lineTo(snap(wx + 22), snap(horizon - 6));
      ctx.fill();
    }
  }
  // The sea itself, running past.
  water(ctx, 0, width, sea, map.height - cam.y + 10, time * 2.5, cam.x + time * 60);
  for (let k = 0; k < 18; k++) {
    const x = ((k * 53 - time * 70) % (width + 60) + width + 60) % (width + 60) - 30;
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(snap(x), snap(sea + 10 + (k % 4) * 9), 10 + (k % 3) * 4, 1.5);
  }
  // The hull under the deck, from stern to bow, raked at both ends; then the paddle box.
  const x0 = -cam.x;
  const x1 = map.width - cam.x;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(x0, deck + 4);
  ctx.lineTo(x1, deck + 4);
  ctx.lineTo(x1 - 38, sea + 18);
  ctx.lineTo(x0 + 34, sea + 18);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e8eef8';
  ctx.fillRect(snap(x0 + 20), snap(deck + 20), map.width - 50, 30);
  ctx.fillStyle = '#ff8a7a';
  ctx.fillRect(snap(x0), snap(deck + 4), map.width, 6);
  ctx.fillStyle = '#4fb0d8';
  ctx.fillRect(snap(x0 + 30), snap(sea + 6), map.width - 66, 4);
  for (let wx = 90; wx < map.width - 60; wx += 64) {
    const x = wx - cam.x;
    ctx.fillStyle = '#5a4a6a';
    ctx.beginPath();
    ctx.arc(snap(x), snap(deck + 24), 4.5, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#bfe8ff';
    ctx.beginPath();
    ctx.arc(snap(x), snap(deck + 24), 3, 0, TAU);
    ctx.fill();
  }
  // The water along her waterline, and the wake at the stern.
  water(ctx, x0 + 20, x1 - 20, sea + 14, map.height - cam.y + 10, time * 2.5, time * 60, { rim: true });
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  for (let i = 0; i < 8; i++) ctx.fillRect(snap(x0 + 10 - i * 9 + Math.sin(time * 6 + i) * 2), snap(sea + 4 + (i % 3) * 4), 8, 2);
  // Dolphins racing alongside at about a third of the way, leaping in turn.
  const dk = (p - 0.3) / 0.14;
  if (dk > 0 && dk < 1) {
    for (let i = 0; i < 3; i++) {
      const u = (time * 0.7 + i * 0.33) % 1;
      const dx = width * (0.25 + 0.2 * i) + dk * 60;
      const dy = sea + 40 - Math.sin(u * Math.PI) * 26;
      if (u > 0.9) continue;
      ctx.save();
      ctx.translate(snap(dx + u * 40), snap(dy));
      ctx.rotate(-0.8 + u * 1.6);
      ctx.fillStyle = '#8aa8d8';
      ctx.beginPath();
      ctx.ellipse(0, 0, 11, 4.4, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#d8e8ff';
      ctx.beginPath();
      ctx.ellipse(1, 1.6, 8, 2, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#8aa8d8';
      ctx.fillRect(-2, -7, 3, 4);
      ctx.restore();
    }
  }
  // Flying fish now and then, skipping over the waves.
  for (let i = 0; i < 3; i++) {
    const u = (time * 0.35 + i * 0.37) % 1;
    if (u > 0.4) continue;
    const s = u / 0.4;
    const fx = width * (0.15 + 0.3 * i) + s * 120;
    const fy = sea + 36 - Math.sin(s * Math.PI) * 24;
    ctx.fillStyle = '#c8e8ff';
    ctx.fillRect(snap(fx), snap(fy), 7, 2.4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(snap(fx + 2), snap(fy - 2), 4, 1.4);
  }
  paddle(ctx, 300 - cam.x, deck + 26, 2, -time * 3);
}

// On deck (with the buildings): the railing along the bow and stern, the wheelhouse (its roof a
// ledge), the funnel with its smoke, the mast and its flag, and the ship's wheel by the captain.
export function drawVoyageDeck(ctx, map, cam, width, time) {
  if (!map.voyage) return;
  const deck = map.groundY - cam.y;
  const r = ramp(WOOD, 0.8);
  // The rail at each end.
  for (const [a, b] of [[0, 110], [map.width - 110, map.width]]) {
    for (let wx = a + 6; wx < b; wx += 12) {
      ctx.fillStyle = r.sh;
      ctx.fillRect(snap(wx - cam.x), snap(deck - 16), 2, 16);
    }
    ctx.fillStyle = r.base;
    ctx.fillRect(snap(a - cam.x), snap(deck - 18), b - a, 3);
  }
  // The wheelhouse: cream walls, round windows, a coral roof (its top is the ledge at y 330).
  const hx = 470 - cam.x;
  const top = 330 - cam.y;
  ctx.fillStyle = '#fff4e0';
  ctx.fillRect(snap(hx), snap(top), 120, deck - top);
  ctx.fillStyle = '#e8dcc8';
  ctx.fillRect(snap(hx + 96), snap(top), 24, deck - top);
  ctx.fillStyle = '#ff8a7a';
  ctx.fillRect(snap(hx - 4), snap(top - 2), 128, 6);
  for (const dx of [24, 60]) {
    ctx.fillStyle = '#5a4a6a';
    ctx.beginPath();
    ctx.arc(snap(hx + dx), snap(top + 32), 9, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#bfe8ff';
    ctx.beginPath();
    ctx.arc(snap(hx + dx), snap(top + 32), 6.5, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = '#7a5a8a';
  ctx.fillRect(snap(hx + 92), snap(deck - 46), 20, 46);
  // The funnel and its smoke (steam, not sail: the wind is still quiet).
  const fx = 400 - cam.x;
  ctx.fillStyle = '#fff4e0';
  ctx.fillRect(snap(fx), snap(deck - 120), 20, 120);
  ctx.fillStyle = '#ff8a7a';
  ctx.fillRect(snap(fx - 2), snap(deck - 120), 24, 9);
  ctx.fillStyle = '#5a4a6a';
  ctx.fillRect(snap(fx - 2), snap(deck - 124), 24, 4);
  puffs(ctx, fx + 10, deck - 128, time, 0.1, 5, 40);
  // The mast at the bow and its flag, hanging limp but for a flutter now and then.
  const mx = 180 - cam.x;
  ctx.fillStyle = r.sh;
  ctx.fillRect(snap(mx), snap(deck - 150), 3, 150);
  const flutter = Math.max(0, Math.sin(time * 0.7)) ** 6;
  ctx.fillStyle = '#ffd66b';
  ctx.beginPath();
  ctx.moveTo(snap(mx + 3), snap(deck - 148));
  ctx.lineTo(snap(mx + 3 + 8 + 14 * flutter), snap(deck - 140 + 6 * (1 - flutter)));
  ctx.lineTo(snap(mx + 3), snap(deck - 132));
  ctx.fill();
  // The ship's wheel by the captain.
  const wx = 660 - cam.x;
  ctx.strokeStyle = '#8a5a3a';
  ctx.lineWidth = 2;
  ctx.save();
  ctx.translate(snap(wx), snap(deck - 26));
  ctx.rotate(Math.sin(time * 0.5) * 0.4);
  ctx.beginPath();
  ctx.arc(0, 0, 9, 0, TAU);
  ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const t = (i / 8) * TAU;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(t) * 12, Math.sin(t) * 12);
    ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = '#8a5a3a';
  ctx.fillRect(snap(wx - 2), snap(deck - 20), 4, 20);
  // Life rings on the wheelhouse.
  for (const dx of [8, 112]) {
    ctx.strokeStyle = '#ff8a7a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(snap(hx + dx), snap(deck - 20), 5, 0, TAU);
    ctx.stroke();
  }
}
