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
import { drawAfloat } from './water.js';

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
  // The cove's beach: soft sand (not the land's stone) down to the bottom, ripples and shells in
  // it, and a darker wet band along the surf's edge.
  if (L.cove) {
    const [a, b] = L.cove;
    const x0 = Math.max(-10, sx(a));
    const x1 = Math.min(width + 10, sx(b));
    if (x1 > x0) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x0, bottom);
      for (let wx = Math.max(a, Math.floor((cam.x - 10) / 8) * 8); wx <= b; wx += 8) {
        const x = sx(wx);
        if (x > x1 + 8) break;
        ctx.lineTo(x, groundAt(map, wx) - cam.y + 3);
      }
      ctx.lineTo(x1, bottom);
      ctx.closePath();
      const g = ctx.createLinearGradient(0, groundAt(map, a) - cam.y, 0, bottom);
      g.addColorStop(0, '#fff0cc');
      g.addColorStop(0.25, '#f6dcaa');
      g.addColorStop(1, '#e8c48a');
      ctx.fillStyle = g;
      ctx.fill();
      ctx.clip();
      for (let wx = Math.floor(a / 30) * 30; wx < b; wx += 30) {
        for (let row = 0; row < 3; row++) {
          const x = sx(wx) + hash(wx + row) * 20;
          const y = groundAt(map, wx) - cam.y + 12 + row * 14 + hash(wx * 2 + row) * 6;
          ctx.fillStyle = 'rgba(214,170,110,0.45)';
          ctx.fillRect(snap(x), snap(y), 12, 1.5);
          const k = hash(wx * 0.7 + row * 3.3);
          if (k > 0.82) {
            ctx.fillStyle = k > 0.92 ? '#ffb0c8' : '#fff8f0';
            ctx.beginPath();
            ctx.ellipse(snap(x + 4), snap(y - 3), 2.6, 1.8, 0, Math.PI, 0);
            ctx.fill();
          }
        }
      }
      ctx.restore();
    }
  }
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
      // Fish schools and sea turtles gliding under the boardwalk, shafts of light in the water.
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      for (let k = 0; k < 6; k++) {
        const lx = ((k * 140 - cam.x * 0.2 + time * 4) % (width + 140) + width + 140) % (width + 140) - 70;
        ctx.beginPath();
        ctx.moveTo(lx, gy + 20);
        ctx.lineTo(lx + 18, gy + 20);
        ctx.lineTo(lx + 40, bottom);
        ctx.lineTo(lx + 10, bottom);
        ctx.fill();
      }
      for (let t = 0; t < 2; t++) {
        const span = b - a + 300;
        const wx = a - 150 + (((time * (14 + t * 6) + t * 700) % span) + span) % span;
        const x = t ? b - (wx - a) : wx;
        if (x - cam.x < -30 || x - cam.x > width + 30) continue;
        const ty = gy + 44 + t * 26 + Math.sin(time * 0.7 + t) * 4;
        const dir = t ? -1 : 1;
        const fl = Math.sin(time * 3 + t);
        ctx.save();
        ctx.translate(snap(x - cam.x), snap(ty));
        ctx.scale(dir, 1);
        ctx.fillStyle = '#5fa878';
        ctx.beginPath();
        ctx.ellipse(-4, 4 + fl * 2, 5, 2, 0.6, 0, TAU);
        ctx.ellipse(-4, -4 - fl * 2, 5, 2, -0.6, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#8a6a3a';
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, 6, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#b8945a';
        ctx.beginPath();
        ctx.ellipse(0, -1, 7, 4, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#7fc890';
        ctx.beginPath();
        ctx.ellipse(11, 0, 3.4, 2.6, 0, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
      for (let s = 0; s < 3; s++) {
        const span = b - a;
        const cx = a + (((time * 22 + s * 400) % span) + span) % span;
        if (cx - cam.x < -30 || cx - cam.x > width + 30) continue;
        for (let f = 0; f < 6; f++) {
          ctx.fillStyle = ['#ffd27a', '#9fe8ff', '#ffb0c8'][s];
          ctx.fillRect(snap(cx - cam.x + (f % 3) * 6 + Math.sin(time * 4 + f) * 2), snap(gy + 34 + s * 22 + Math.floor(f / 3) * 4), 4, 2);
        }
      }
      // Rowboats tied up under the boardwalk, and buoys hung on the stilts.
      for (const [wx, c] of [[820, '#ff9ec0'], [1460, '#8fd3ff']]) {
        const x = wx - cam.x;
        if (x < -40 || x > width + 40) continue;
        const by2 = gy + 26 + Math.sin(time * 1.4 + wx) * 1.4;
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.moveTo(x - 22, by2);
        ctx.lineTo(x + 22, by2);
        ctx.lineTo(x + 16, by2 + 8);
        ctx.lineTo(x - 16, by2 + 8);
        ctx.fill();
        ctx.fillStyle = '#fff4ea';
        ctx.fillRect(snap(x - 21), snap(by2 - 1), 42, 2);
        ctx.strokeStyle = '#e8dcc0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 20, by2);
        ctx.lineTo(x + 32, gy + 10);
        ctx.stroke();
      }
      for (let wx = Math.floor(a / 112) * 112 + 84; wx < b; wx += 112) {
        const x = wx - cam.x;
        if (x < -10 || x > width + 10) continue;
        const c = ['#ff8a7a', '#ffd36b', '#ffffff'][Math.floor(wx / 112) % 3];
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.ellipse(snap(x + 3), snap(gy + 20), 3.5, 5, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(snap(x), snap(gy + 19), 7, 1.5);
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
      for (let wx = Math.floor(a / 14) * 14; wx < b; wx += 14) {
        const x = sx(wx) + hash(wx * 1.3) * 8;
        if (x < x0 || x > x1) continue;
        const k = hash(wx * 2.1);
        if (k < 0.45) continue;
        const sway = Math.sin(time * 1.5 + wx) * 1;
        ctx.fillStyle = '#5fbf7a';
        ctx.fillRect(snap(x + sway * 0.5), snap(top - 7), 1, 7);
        ctx.fillStyle = k > 0.8 ? '#ffd36b' : k > 0.65 ? '#ffffff' : '#c8a8ff';
        ctx.beginPath();
        ctx.arc(snap(x + sway), snap(top - 8), 2, 0, TAU);
        ctx.fill();
      }
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
  // (The sea along the quay and the steamer riding in it are the harbor's quay: render/quay.js.)
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
  ctx.font = '800 6px Nunito, "Trebuchet MS", "Segoe UI", system-ui, sans-serif';
  ctx.fillText('LAGOON', snap(sx - 15), snap(gy - 37.5));
}

// The Sea Biscuit's paddle wheel and funnel smoke, for drawing her afloat at the harbor's quay
// (render/quay.js), in her own art's units.
export const steamerPaddle = (ctx, x, y, k, a) => paddle(ctx, x, y, k, a);
export const steamerPuffs = (ctx, x, y, time) => puffs(ctx, x, y, time, 0.4, 3, 18);

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
    ctx.font = '800 7px Nunito, "Trebuchet MS", "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FISHING DERBY', snap(x), snap(gy - 75.5));
    ctx.fillStyle = '#6a5a7a';
    ctx.font = '500 6px Nunito, "Trebuchet MS", "Segoe UI", system-ui, sans-serif';
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
    // Afloat in the cove's water at her waterline, bobbing, her reflection under her
    // (render/water.js), the gangplank down onto the sand.
    const sea = (map.water ?? []).find((w) => wx >= w.x1 && wx <= w.x2);
    const wy = (sea ? sea.y : groundAt(map, wx)) - cam.y;
    drawAfloat(ctx, x, wy, 80, 10, time, wx, (c) => {
      place(c, steamerArt(), 0, 6);
      paddle(c, -15, -24, 1, time * 0.4);
      puffs(c, 36, -86, time, 0.6, 3, 22);
    }, { bob: 1.3, roll: 0.01 });
    const lift = Math.sin(time * 0.9 + wx * 0.013) * 1.3;
    const shore = groundAt(map, wx + 120) - cam.y;
    ctx.strokeStyle = '#8a6a52';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(snap(x + 58), snap(wy - 14 + lift));
    ctx.lineTo(snap(x + 120), snap(shore - 1));
    ctx.stroke();
    ctx.strokeStyle = '#c8a07a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(snap(x + 58), snap(wy - 15.5 + lift));
    ctx.lineTo(snap(x + 120), snap(shore - 2.5));
    ctx.stroke();
    return true;
  }
  if (kind === 'rockpools') {
    // The tide pool is sunk in the sand (the map's water, render/water.js): barnacled rocks
    // hold it at each end, weed stirring off them.
    for (const [dx, r, flip] of [[-66, 13, 1], [-52, 8, 1], [64, 15, -1], [80, 9, -1]]) {
      const rxp = x + dx;
      const ry = groundAt(map, wx + dx) - cam.y + 2;
      ctx.fillStyle = '#a89cb0';
      ctx.beginPath();
      ctx.ellipse(snap(rxp), snap(ry - r * 0.45), r, r * 0.7, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#c4b8cc';
      ctx.beginPath();
      ctx.ellipse(snap(rxp - flip * r * 0.25), snap(ry - r * 0.6), r * 0.55, r * 0.35, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#f2ece4';
      for (let k = 0; k < 3; k++) ctx.fillRect(snap(rxp - r * 0.5 + k * r * 0.4), snap(ry - r * 0.5 - (k % 2) * 2), 1.6, 1.6);
      ctx.strokeStyle = '#5aae7a';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(rxp + flip * r * 0.8, ry - 2);
      ctx.quadraticCurveTo(rxp + flip * (r + 3), ry + 2, rxp + flip * (r + 4) + Math.sin(time * 1.4 + dx) * 2, ry + 6);
      ctx.stroke();
    }
    // A starfish and a crab on the rocks.
    ctx.fillStyle = '#ff9e7a';
    for (let k = 0; k < 5; k++) {
      const t = (k / 5) * TAU - Math.PI / 2;
      ctx.fillRect(snap(x + 64 + Math.cos(t) * 3), snap(gy - 12 + Math.sin(t) * 3), 2, 2);
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
  if (kind === 'palm') {
    // A palm leaning out over the cove, its fronds stirring.
    const lean = extra ?? 1;
    ctx.strokeStyle = '#a8805a';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(x, gy + 2);
    ctx.quadraticCurveTo(x + lean * 10, gy - 60, x + lean * 26, gy - 118);
    ctx.stroke();
    ctx.strokeStyle = '#c8a07a';
    ctx.lineWidth = 2;
    for (let k = 0; k < 9; k++) {
      const u = k / 9;
      const px2 = x + lean * (u * u * 26 + u * 6);
      const py2 = gy - u * 118;
      ctx.beginPath();
      ctx.moveTo(px2 - 3, py2);
      ctx.lineTo(px2 + 3, py2 - 2);
      ctx.stroke();
    }
    const tx = x + lean * 26;
    const ty = gy - 118;
    for (let f = 0; f < 7; f++) {
      const a = -Math.PI + (f / 6) * Math.PI + Math.sin(time * 1.1 + f) * 0.06;
      const len = 30 + (f % 2) * 8;
      ctx.strokeStyle = f % 2 ? '#4fa878' : '#6fc890';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.quadraticCurveTo(tx + Math.cos(a) * len * 0.6, ty + Math.sin(a) * len * 0.6 - 8, tx + Math.cos(a) * len, ty + Math.sin(a) * len * 0.5 + 10);
      ctx.stroke();
    }
    ctx.fillStyle = '#8a6a3a';
    for (const [dx, dy] of [[-4, 4], [3, 6], [0, 9]]) {
      ctx.beginPath();
      ctx.arc(tx + dx, ty + dy, 3, 0, TAU);
      ctx.fill();
    }
    return true;
  }
  if (kind === 'beachspot') {
    // A striped beach umbrella, a towel and a bucket and spade.
    ctx.fillStyle = '#8a7a6a';
    ctx.fillRect(snap(x - 1), snap(gy - 54), 2, 56);
    for (let k = 0; k < 6; k++) {
      ctx.fillStyle = k % 2 ? '#ffffff' : '#ff8a8a';
      ctx.beginPath();
      ctx.moveTo(x, gy - 58);
      ctx.lineTo(x - 30 + k * 10, gy - 42);
      ctx.lineTo(x - 20 + k * 10, gy - 42);
      ctx.fill();
    }
    ctx.fillStyle = '#8fd3ff';
    ctx.fillRect(snap(x + 6), snap(gy - 2), 34, 4);
    ctx.fillStyle = '#ffffff';
    for (let k = 0; k < 4; k++) ctx.fillRect(snap(x + 8 + k * 9), snap(gy - 2), 3, 4);
    ctx.fillStyle = '#ffd36b';
    ctx.fillRect(snap(x - 26), snap(gy - 8), 8, 8);
    ctx.fillStyle = '#ff8a6a';
    ctx.fillRect(snap(x - 16), snap(gy - 12), 2, 12);
    return true;
  }
  if (kind === 'sandcastle') {
    ctx.fillStyle = '#f2d29c';
    ctx.fillRect(snap(x - 14), snap(gy - 10), 28, 10);
    for (const dx of [-12, 6]) {
      ctx.fillRect(snap(x + dx), snap(gy - 18), 7, 8);
      ctx.fillRect(snap(x + dx), snap(gy - 20), 2, 2);
      ctx.fillRect(snap(x + dx + 5), snap(gy - 20), 2, 2);
    }
    ctx.fillStyle = '#d9ad72';
    ctx.fillRect(snap(x - 3), snap(gy - 6), 6, 6);
    ctx.fillStyle = '#ff6b8a';
    ctx.fillRect(snap(x + 9), snap(gy - 28), 1, 8);
    ctx.beginPath();
    ctx.moveTo(x + 10, gy - 28);
    ctx.lineTo(x + 16, gy - 26);
    ctx.lineTo(x + 10, gy - 24);
    ctx.fill();
    return true;
  }
  if (kind === 'lookout') {
    // A bench and a brass telescope at the cliff's edge, looking out to sea.
    const r = ramp(WOOD, 0.8);
    ctx.fillStyle = r.base;
    ctx.fillRect(snap(x - 22), snap(gy - 12), 30, 4);
    ctx.fillRect(snap(x - 22), snap(gy - 20), 30, 3);
    ctx.fillStyle = r.sh;
    ctx.fillRect(snap(x - 20), snap(gy - 8), 2, 8);
    ctx.fillRect(snap(x + 4), snap(gy - 8), 2, 8);
    ctx.fillStyle = '#6a6a88';
    ctx.fillRect(snap(x + 22), snap(gy - 20), 2, 20);
    ctx.fillRect(snap(x + 18), snap(gy - 2), 10, 2);
    ctx.save();
    ctx.translate(snap(x + 23), snap(gy - 22));
    ctx.rotate(-0.3 + Math.sin(time * 0.3) * 0.15);
    ctx.fillStyle = '#e0b060';
    ctx.fillRect(-4, -2.5, 18, 5);
    ctx.fillStyle = '#c8904a';
    ctx.fillRect(10, -3, 4, 6);
    ctx.restore();
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
// The Sea Biscuit (map voyage_out / voyage_home: 760 wide, her deck at y 420): a little paddle
// steamer, cream and coral, gold trim, navy below the waterline. Stern at the left, bow at the
// right, sailing right. Her deck: the rail along her far side, the mast and its rigging and
// bunting, the funnel, the wheelhouse (its roof a ledge, up the ladder), crates and the fishing
// gear at the stern, the lifeboat on its davits, and the wheel by the captain with his parrot.

const HULL = { cream: '#fff8ec', creamSh: '#efe2cc', coral: '#ff8a7a', gold: '#ffd36b', navy: '#3f5a9a', navySh: '#2f4680', brass: '#e0b060' };

// A gull flapping, at (x, y), wings by `flap` (0-1).
function gull(ctx, x, y, flap) {
  const w = 5 + flap * 2;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x - w, y - 2 + flap * 3);
  ctx.quadraticCurveTo(x - w / 2, y - 4 + flap * 4, x, y);
  ctx.quadraticCurveTo(x + w / 2, y - 4 + flap * 4, x + w, y - 2 + flap * 3);
  ctx.stroke();
}

// A low island far out: sand, a mound, a palm or two.
function farIsland(ctx, x, y, w, seed, time, tint) {
  ctx.fillStyle = mix('#7fc8a0', tint, 0.35);
  ctx.beginPath();
  ctx.ellipse(snap(x), snap(y), w, 10 + hash(seed) * 8, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = mix('#fff0c8', tint, 0.3);
  ctx.fillRect(snap(x - w), snap(y - 2), w * 2, 3);
  for (let k = 0; k < 1 + Math.floor(hash(seed + 4) * 3); k++) {
    const px = x - w * 0.4 + k * w * 0.4;
    const lean = 3 + k * 2 + Math.sin(time * 0.8 + seed + k);
    ctx.strokeStyle = mix('#8a6a52', tint, 0.35);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px, y - 8);
    ctx.quadraticCurveTo(px + lean * 0.5, y - 22, px + lean, y - 34);
    ctx.stroke();
    ctx.fillStyle = mix('#4fa878', tint, 0.35);
    for (let f = 0; f < 5; f++) {
      const a = -Math.PI / 2 + (f - 2) * 0.7;
      ctx.beginPath();
      ctx.ellipse(px + lean + Math.cos(a) * 7, y - 31 + Math.sin(a) * 3, 8, 2.2, a, 0, TAU);
      ctx.fill();
    }
  }
}

// The paddle wheel, turning: its hub, spokes and blades, with spray thrown off the blades that
// come up out of the water.
function paddleWheel(ctx, x, y, r, a, time, sea) {
  ctx.save();
  ctx.translate(snap(x), snap(y));
  ctx.rotate(a);
  for (let i = 0; i < 10; i++) {
    const t = (i / 10) * TAU;
    ctx.strokeStyle = '#8a5a3a';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(t) * r, Math.sin(t) * r);
    ctx.stroke();
    ctx.save();
    ctx.translate(Math.cos(t) * r, Math.sin(t) * r);
    ctx.rotate(t);
    ctx.fillStyle = '#b07a52';
    ctx.fillRect(-3, -6, 6, 12);
    ctx.restore();
  }
  ctx.strokeStyle = '#6a4a3a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.62, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = HULL.gold;
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, TAU);
  ctx.fill();
  ctx.restore();
  // Spray where the blades leave the water, behind the wheel.
  ctx.fillStyle = '#ffffff';
  for (let k = 0; k < 7; k++) {
    const u = (time * 2.2 + k / 7) % 1;
    ctx.globalAlpha = 1 - u;
    ctx.fillRect(snap(x - r * 0.7 - u * 26 + Math.sin(k * 3) * 4), snap(sea - u * 18 + u * u * 26), 2, 2);
  }
  ctx.globalAlpha = 1;
}

// The sea going by, her hull and paddle box (behind everyone on deck).
export function drawVoyage(ctx, map, cam, width, height, time, progress) {
  const v = map.voyage;
  if (!v) return;
  const deck = map.groundY - cam.y;
  const sea = deck + 34;
  const horizon = deck - 46;
  const p = progress ?? 0;
  const x0 = -cam.x;
  const x1 = map.width - cam.x;
  // The far sea, up to her deck: a gradient, the sun's glitter path, white caps drifting by.
  const g = ctx.createLinearGradient(0, horizon, 0, deck);
  g.addColorStop(0, '#9fdcea');
  g.addColorStop(1, '#6abcd4');
  ctx.fillStyle = g;
  ctx.fillRect(0, snap(horizon), width, deck - horizon + 1);
  ctx.fillStyle = '#ffffff';
  for (let k = 0; k < 14; k++) {
    ctx.globalAlpha = 0.25 + 0.35 * Math.sin(time * 3 + k * 1.7);
    ctx.fillRect(snap(width * 0.72 + Math.sin(k * 2.3) * 18), snap(horizon + 4 + k * 3), 10 - (k % 3) * 2, 1);
  }
  ctx.globalAlpha = 0.6;
  for (let k = 0; k < 12; k++) {
    const wx = ((k * 61 - time * 30 - p * 400) % (width + 80) + width + 80) % (width + 80) - 40;
    ctx.fillRect(snap(wx), snap(horizon + 8 + (k % 4) * 8), 8 + (k % 3) * 3, 1);
  }
  ctx.globalAlpha = 1;
  // Far islands sliding past, and a little sailboat far off, crossing.
  for (let k = 0; k < 6; k++) {
    const wx = ((k * 430 - p * 900 - time * 5) % 2580 + 2580) % 2580 - 300;
    farIsland(ctx, wx, horizon + 2, 50 + hash(k) * 70, k * 3.7, time, '#9fdcea');
  }
  const bx = ((time * 8 + 200) % (width + 200)) - 100;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(snap(bx), snap(horizon - 2));
  ctx.lineTo(snap(bx + 6), snap(horizon - 18));
  ctx.lineTo(snap(bx + 6), snap(horizon - 2));
  ctx.fill();
  ctx.fillStyle = '#ff9ec0';
  ctx.fillRect(snap(bx - 6), snap(horizon - 2), 16, 3);
  // The port ahead, over the last stretch: the lagoon's island with its lighthouse and stilt
  // houses, or the harbor's houses and the galleon's masts.
  if (p > 0.72) {
    const k = (p - 0.72) / 0.28;
    const px = width + 160 - k * 300;
    ctx.fillStyle = mix('#7fc8a0', '#9fdcea', 0.2);
    ctx.beginPath();
    ctx.ellipse(snap(px), snap(horizon + 4), 170, 30, 0, Math.PI, 0);
    ctx.fill();
    if (v.to === 'lagoon') {
      for (const [dx, c] of [[-70, '#ffb8cc'], [-48, '#8fe0d8'], [-26, '#fff0b0']]) {
        ctx.fillStyle = c;
        ctx.fillRect(snap(px + dx), snap(horizon - 12), 14, 12);
        ctx.fillStyle = '#c8a070';
        ctx.fillRect(snap(px + dx - 1), snap(horizon - 14), 16, 3);
      }
      ctx.fillStyle = '#fff8f0';
      ctx.fillRect(snap(px + 50), snap(horizon - 62), 10, 40);
      ctx.fillStyle = HULL.coral;
      ctx.fillRect(snap(px + 50), snap(horizon - 48), 10, 5);
      ctx.fillRect(snap(px + 48), snap(horizon - 68), 14, 6);
      glow(ctx, px + 55, horizon - 64, 22, '#fff3a6', 0.6 + 0.2 * Math.sin(time * 2));
    } else {
      for (const [dx, c] of [[-80, '#ffc8a8'], [-60, '#c8d8ff'], [-40, '#ffd6e6']]) {
        ctx.fillStyle = c;
        ctx.fillRect(snap(px + dx), snap(horizon - 16), 16, 16);
      }
      ctx.fillStyle = '#ffffff';
      for (const dx of [10, 34, 58]) ctx.fillRect(snap(px + dx), snap(horizon - 70), 2, 50);
      ctx.fillStyle = '#ffb3d1';
      ctx.fillRect(snap(px + 4), snap(horizon - 34), 64, 12);
    }
  }
  // The whale, far out, at about two thirds of the way: her back, a spout, then her tail.
  const wk = (p - 0.58) / 0.14;
  if (wk > 0 && wk < 1) {
    const wx = width * 0.9 - wk * width * 0.7;
    const up = Math.sin(wk * Math.PI);
    ctx.fillStyle = '#6a8ac0';
    ctx.beginPath();
    ctx.ellipse(snap(wx), snap(horizon + 8), 30, 7 * up, 0, Math.PI, 0);
    ctx.fill();
    if (wk > 0.3 && wk < 0.7) {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      for (let i = 0; i < 7; i++) ctx.fillRect(snap(wx - 8 + Math.sin(i * 1.3) * 6), snap(horizon - i * 4 * up), 2, 2);
    }
    if (wk > 0.75) {
      ctx.fillStyle = '#6a8ac0';
      ctx.beginPath();
      ctx.moveTo(snap(wx + 26), snap(horizon + 8));
      ctx.lineTo(snap(wx + 40), snap(horizon - 8));
      ctx.lineTo(snap(wx + 22), snap(horizon - 4));
      ctx.fill();
    }
  }
  // Gulls following the boat.
  for (let i = 0; i < 3; i++) {
    const gx = width * (0.25 + i * 0.22) + Math.sin(time * 0.4 + i * 2) * 40;
    const gy = horizon - 70 - i * 14 + Math.sin(time * 0.9 + i) * 8;
    gull(ctx, gx, gy, 0.5 + 0.5 * Math.sin(time * 6 + i * 2));
  }
  // The sea under her stern and bow (the open water at her raked ends).
  water(ctx, 0, width, sea, map.height - cam.y + 10, time * 2.5, cam.x + time * 60);

  // ----- The hull -----
  // The raised bow (its bulwark sweeps up at the far side), then the topsides, the coral stripe and
  // gold rubbing strake, the navy bottom.
  ctx.fillStyle = HULL.cream;
  ctx.beginPath();
  ctx.moveTo(x1 - 120, deck);
  ctx.quadraticCurveTo(x1 - 40, deck - 2, x1 + 6, deck - 30);
  ctx.lineTo(x1 + 10, deck - 24);
  ctx.quadraticCurveTo(x1 - 30, deck + 4, x1 - 60, deck + 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = HULL.coral;
  ctx.beginPath();
  ctx.moveTo(x1 - 100, deck - 2);
  ctx.quadraticCurveTo(x1 - 30, deck - 6, x1 + 6, deck - 30);
  ctx.lineTo(x1 + 8, deck - 26);
  ctx.quadraticCurveTo(x1 - 30, deck - 1, x1 - 100, deck + 1);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = HULL.cream;
  ctx.beginPath();
  ctx.moveTo(x0 - 4, deck - 6);
  ctx.lineTo(x1, deck - 2);
  ctx.lineTo(x1 - 26, sea + 4);
  ctx.lineTo(x0 + 26, sea + 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = HULL.creamSh;
  for (let y = deck + 8; y < sea; y += 6) ctx.fillRect(snap(x0 + 10), snap(y), map.width - 30, 1);
  ctx.fillStyle = HULL.coral;
  ctx.fillRect(snap(x0 - 4), snap(deck + 1), map.width + 4, 5);
  ctx.fillStyle = HULL.gold;
  ctx.fillRect(snap(x0 - 4), snap(deck + 6), map.width + 4, 1.5);
  ctx.fillStyle = HULL.navy;
  ctx.beginPath();
  ctx.moveTo(x0 + 22, sea);
  ctx.lineTo(x1 - 24, sea);
  ctx.quadraticCurveTo(x1 - 40, sea + 18, x1 - 70, sea + 22);
  ctx.lineTo(x0 + 50, sea + 22);
  ctx.quadraticCurveTo(x0 + 30, sea + 16, x0 + 22, sea);
  ctx.fill();
  ctx.fillStyle = HULL.navySh;
  ctx.fillRect(snap(x0 + 40), snap(sea + 14), map.width - 120, 8);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(snap(x0 + 22), snap(sea - 1), map.width - 46, 2);
  // Portholes with brass rims, lit warm inside.
  for (let wx = 64; wx < map.width - 60; wx += 52) {
    if (Math.abs(wx - 300) < 50) continue;
    const x = wx - cam.x;
    ctx.fillStyle = HULL.brass;
    ctx.beginPath();
    ctx.arc(snap(x), snap(deck + 19), 5, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ffe9b0';
    ctx.beginPath();
    ctx.arc(snap(x), snap(deck + 19), 3.4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(snap(x - 2), snap(deck + 17), 1.4, 1.4);
  }
  // Her name on the bow, and the anchor hanging at the hawse.
  ctx.fillStyle = HULL.navy;
  ctx.font = '800 7px Nunito, "Trebuchet MS", "Segoe UI", system-ui, sans-serif';
  ctx.fillText('SEA BISCUIT', snap(x1 - 104), snap(deck + 22));
  ctx.strokeStyle = '#6a6a88';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(snap(x1 - 30), snap(deck + 10));
  ctx.lineTo(snap(x1 - 30), snap(deck + 24));
  ctx.moveTo(snap(x1 - 36), snap(deck + 14));
  ctx.lineTo(snap(x1 - 24), snap(deck + 14));
  ctx.moveTo(snap(x1 - 36), snap(deck + 20));
  ctx.quadraticCurveTo(snap(x1 - 30), snap(deck + 28), snap(x1 - 24), snap(deck + 20));
  ctx.stroke();
  // A life ring on the transom.
  ctx.strokeStyle = HULL.coral;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(snap(x0 + 18), snap(deck + 18), 5.5, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  for (let k = 0; k < 4; k++) {
    ctx.beginPath();
    ctx.arc(snap(x0 + 18), snap(deck + 18), 5.5, (k / 4) * TAU, (k / 4) * TAU + 0.5);
    ctx.stroke();
  }
  // The paddle box: on her side, a half-round housing over the top of the wheel, a sunburst of
  // coral and cream with a gold rim, sitting on the hull just under the deck's edge. The wheel
  // turns beneath it, one centre with the box, its lower blades dipping into the sea in front.
  const px = 300 - cam.x;
  const pc = sea + 6;
  const pr = 36;
  paddleWheel(ctx, px, pc, 28, -time * 2.4, time, sea);
  ctx.save();
  ctx.beginPath();
  ctx.arc(px, pc, pr, Math.PI, 0);
  ctx.closePath();
  ctx.clip();
  for (let k = 0; k < 9; k++) {
    const a0 = Math.PI + (k / 9) * Math.PI;
    const a1 = Math.PI + ((k + 1) / 9) * Math.PI;
    ctx.fillStyle = k % 2 ? HULL.cream : HULL.coral;
    ctx.beginPath();
    ctx.moveTo(px, pc);
    ctx.arc(px, pc, pr, a0, a1);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = HULL.gold;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(px, pc, pr, Math.PI, 0);
  ctx.stroke();
  // Its lower edge: a gold sill the wheel turns under.
  ctx.fillStyle = HULL.gold;
  ctx.fillRect(snap(px - pr - 1.5), snap(pc - 1), pr * 2 + 3, 3);
  ctx.beginPath();
  ctx.arc(px, pc, 9, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = HULL.coral;
  ctx.beginPath();
  ctx.arc(px, pc, 5, Math.PI, 0);
  ctx.fill();

  // ----- The sea in front of her -----
  water(ctx, x0 + 20, x1 - 20, sea + 14, map.height - cam.y + 10, time * 2.5, time * 60, { rim: true });
  // The bow wave curling off her stem, and the wake trailing from her stern.
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 10; i++) {
    const u = (time * 1.6 + i / 10) % 1;
    ctx.globalAlpha = 1 - u;
    ctx.fillRect(snap(x1 - 30 + u * 30), snap(sea + 10 - Math.sin(u * Math.PI) * 10), 3, 2);
  }
  for (let i = 0; i < 14; i++) {
    const u = (time * 0.8 + i / 14) % 1;
    ctx.globalAlpha = 0.85 * (1 - u);
    ctx.fillRect(snap(x0 + 20 - u * 160 + Math.sin(time * 4 + i) * 3), snap(sea + 14 + Math.sin(i * 2.1) * 6), 8 - u * 5, 2);
  }
  ctx.globalAlpha = 1;
  // Dolphins racing alongside at about a third of the way, leaping in turn.
  const dk = (p - 0.3) / 0.14;
  if (dk > 0 && dk < 1) {
    for (let i = 0; i < 3; i++) {
      const u = (time * 0.7 + i * 0.33) % 1;
      if (u > 0.9) continue;
      const dx = width * (0.25 + 0.2 * i) + dk * 60;
      const dy = sea + 40 - Math.sin(u * Math.PI) * 28;
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
      ctx.beginPath();
      ctx.moveTo(-1, -3);
      ctx.lineTo(2, -8);
      ctx.lineTo(4, -3);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(-15, -4);
      ctx.lineTo(-15, 4);
      ctx.fill();
      ctx.fillStyle = '#2a2d4f';
      ctx.fillRect(7, -1.4, 1.4, 1.4);
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
    ctx.fillRect(snap(fx + 2), snap(fy - 2 - Math.abs(Math.sin(time * 30)) * 1.5), 4, 1.4);
  }
}

// On deck (behind the people on it): the rail along her far side with its lanterns and life
// rings, the mast, rigging and bunting, the funnel and its steam, the lifeboat on its davits, the
// cargo and the stern's fishing gear, the wheelhouse, and the wheel with Bobbin's parrot.
export function drawVoyageDeck(ctx, map, cam, width, time) {
  if (!map.voyage) return;
  const deck = map.groundY - cam.y;
  const X = (wx) => wx - cam.x;
  const wood = ramp(WOOD, 0.8);
  // The far rail, end to end: posts, a top rail, a rope run between, lanterns and life rings.
  for (let wx = 8; wx < map.width - 4; wx += 16) {
    ctx.fillStyle = wood.sh;
    ctx.fillRect(snap(X(wx)), snap(deck - 22), 3, 22);
    ctx.fillStyle = wood.hi;
    ctx.fillRect(snap(X(wx)), snap(deck - 22), 1, 22);
  }
  ctx.fillStyle = wood.base;
  ctx.fillRect(snap(X(0)), snap(deck - 25), map.width, 4);
  ctx.fillStyle = wood.hi;
  ctx.fillRect(snap(X(0)), snap(deck - 25), map.width, 1);
  ctx.strokeStyle = '#e8dcc0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let wx = 8; wx < map.width - 20; wx += 16) {
    ctx.moveTo(X(wx) + 2, deck - 12);
    ctx.quadraticCurveTo(X(wx + 8), deck - 9, X(wx + 16) + 2, deck - 12);
  }
  ctx.stroke();
  for (const wx of [120, 360, 620]) {
    glow(ctx, X(wx), deck - 32, 12, '#ffe9a6', 0.4 + 0.1 * Math.sin(time * 2 + wx));
    ctx.fillStyle = '#5a4a6a';
    ctx.fillRect(snap(X(wx) - 0.7), snap(deck - 38), 1.4, 4);
    ctx.fillStyle = '#ffd27a';
    ctx.fillRect(snap(X(wx) - 3), snap(deck - 34), 6, 7);
    ctx.fillStyle = '#5a4a6a';
    ctx.fillRect(snap(X(wx) - 3.5), snap(deck - 35), 7, 1.5);
  }
  for (const wx of [200, 560]) {
    ctx.strokeStyle = HULL.coral;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(snap(X(wx)), snap(deck - 14), 6, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = '#ffffff';
    for (let k = 0; k < 4; k++) {
      ctx.beginPath();
      ctx.arc(snap(X(wx)), snap(deck - 14), 6, (k / 4) * TAU, (k / 4) * TAU + 0.5);
      ctx.stroke();
    }
  }
  // The mast near the bow: rigging down to stern and bow, the yard, a pennant at the top that
  // hangs limp but for a flutter now and then (the wind is still quiet), and bunting from the
  // masthead to the funnel.
  const mx = X(180);
  const top = deck - 170;
  ctx.strokeStyle = '#8a7a6a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(mx + 1, top + 4);
  ctx.lineTo(X(8), deck - 24);
  ctx.moveTo(mx + 1, top + 4);
  ctx.lineTo(X(map.width - 6), deck - 26);
  ctx.stroke();
  ctx.fillStyle = wood.sh;
  ctx.fillRect(snap(mx - 1), snap(top), 4, deck - top);
  ctx.fillStyle = wood.hi;
  ctx.fillRect(snap(mx - 1), snap(top), 1.2, deck - top);
  ctx.fillStyle = wood.base;
  ctx.fillRect(snap(mx - 22), snap(top + 30), 48, 3);
  ctx.fillStyle = HULL.gold;
  ctx.beginPath();
  ctx.arc(snap(mx + 1), snap(top - 1), 3, 0, TAU);
  ctx.fill();
  const flutter = Math.max(0, Math.sin(time * 0.7)) ** 6;
  ctx.fillStyle = HULL.coral;
  ctx.beginPath();
  ctx.moveTo(snap(mx + 3), snap(top + 2));
  ctx.lineTo(snap(mx + 3 + 10 + 16 * flutter), snap(top + 8 + 8 * (1 - flutter)));
  ctx.lineTo(snap(mx + 3), snap(top + 16));
  ctx.fill();
  const fx = X(400);
  const ftop = deck - 132;
  const bunt = [[mx + 1, top + 6], [fx + 10, ftop + 4], [X(590), deck - 96]];
  for (let s = 0; s < 2; s++) {
    const [ax, ay] = bunt[s];
    const [bx2, by2] = bunt[s + 1];
    ctx.strokeStyle = '#6a5a7a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let k = 0; k <= 10; k++) {
      const u = k / 10;
      const x = ax + (bx2 - ax) * u;
      const y = ay + (by2 - ay) * u + Math.sin(u * Math.PI) * 14;
      k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
    for (let k = 1; k < 10; k++) {
      const u = k / 10;
      const x = ax + (bx2 - ax) * u;
      const y = ay + (by2 - ay) * u + Math.sin(u * Math.PI) * 14;
      ctx.fillStyle = ['#ff8a7a', '#ffd36b', '#8fe0d8', '#ffffff', '#c8a8ff'][(k + s) % 5];
      ctx.beginPath();
      ctx.moveTo(x - 3, y);
      ctx.lineTo(x + 3, y);
      ctx.lineTo(x, y + 6 + Math.sin(time * 3 + k) * 0.6);
      ctx.fill();
    }
  }
  // The funnel: cream with a coral band and a gold rim, steam rising, and a toot now and then
  // (two puffed rings).
  ctx.fillStyle = HULL.cream;
  ctx.fillRect(snap(fx), snap(ftop), 22, deck - ftop);
  ctx.fillStyle = HULL.creamSh;
  ctx.fillRect(snap(fx + 15), snap(ftop), 7, deck - ftop);
  ctx.fillStyle = HULL.coral;
  ctx.fillRect(snap(fx - 1), snap(ftop + 6), 24, 12);
  ctx.fillStyle = HULL.gold;
  ctx.fillRect(snap(fx - 3), snap(ftop - 3), 28, 4);
  ctx.fillStyle = '#4a3a5a';
  ctx.fillRect(snap(fx - 1), snap(ftop - 5), 24, 3);
  puffs(ctx, fx + 11, ftop - 8, time, 0.1, 5, 46);
  const toot = (time % 9) / 9;
  if (toot < 0.12) {
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 2;
    for (let k = 0; k < 2; k++) {
      const u = toot / 0.12 - k * 0.3;
      if (u <= 0) continue;
      ctx.beginPath();
      ctx.ellipse(fx + 11, ftop - 10 - u * 22, 6 + u * 8, 3 + u * 3, 0, 0, TAU);
      ctx.stroke();
    }
  }
  // The lifeboat on its davits over the stern rail.
  ctx.strokeStyle = '#6a6a88';
  ctx.lineWidth = 2;
  for (const dx of [36, 96]) {
    ctx.beginPath();
    ctx.moveTo(X(dx), deck - 2);
    ctx.lineTo(X(dx), deck - 64);
    ctx.quadraticCurveTo(X(dx) + 2, deck - 74, X(dx) + 10, deck - 70);
    ctx.stroke();
  }
  ctx.fillStyle = HULL.coral;
  ctx.beginPath();
  ctx.moveTo(X(38), deck - 60);
  ctx.lineTo(X(112), deck - 60);
  ctx.quadraticCurveTo(X(104), deck - 46, X(90), deck - 46);
  ctx.lineTo(X(52), deck - 46);
  ctx.quadraticCurveTo(X(40), deck - 48, X(38), deck - 60);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(snap(X(40)), snap(deck - 61), 72, 3);
  // Cargo: crates and a barrel behind the mast, a coil of rope, and the stern's fishing gear (a
  // rod rack, a bucket with a fish tail poking out, a tackle box).
  const crate = (wx, y, s) => {
    ctx.fillStyle = '#c8965a';
    ctx.fillRect(snap(X(wx)), snap(y - s), s, s);
    ctx.fillStyle = '#a87a4a';
    ctx.fillRect(snap(X(wx)), snap(y - s), s, 2);
    ctx.fillRect(snap(X(wx)), snap(y - 2), s, 2);
    ctx.fillRect(snap(X(wx)), snap(y - s), 2, s);
    ctx.fillRect(snap(X(wx) + s - 2), snap(y - s), 2, s);
    ctx.strokeStyle = '#a87a4a';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(X(wx) + 2, y - 2);
    ctx.lineTo(X(wx) + s - 2, y - s + 2);
    ctx.stroke();
  };
  crate(214, deck, 18);
  crate(234, deck, 16);
  crate(222, deck - 18, 14);
  ctx.fillStyle = '#9a6a4a';
  ctx.fillRect(snap(X(254)), snap(deck - 18), 13, 18);
  ctx.fillStyle = '#7a5238';
  ctx.fillRect(snap(X(254)), snap(deck - 14), 13, 2);
  ctx.fillRect(snap(X(254)), snap(deck - 6), 13, 2);
  ctx.strokeStyle = '#e0c890';
  ctx.lineWidth = 2;
  for (let k = 0; k < 3; k++) {
    ctx.beginPath();
    ctx.ellipse(X(352), deck - 3 - k * 2.4, 10 - k * 2, 3, 0, 0, TAU);
    ctx.stroke();
  }
  for (let k = 0; k < 3; k++) {
    ctx.strokeStyle = ['#c99a6b', '#8fa8d8', '#d98a5a'][k];
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(X(130 + k * 4), deck - 2);
    ctx.lineTo(X(124 + k * 4), deck - 58 + k * 4);
    ctx.stroke();
  }
  ctx.fillStyle = '#8a9ac8';
  ctx.fillRect(snap(X(146)), snap(deck - 12), 12, 12);
  ctx.fillStyle = '#ff9e7a';
  ctx.beginPath();
  ctx.moveTo(X(150), deck - 12);
  ctx.lineTo(X(147), deck - 19);
  ctx.lineTo(X(154), deck - 19);
  ctx.fill();
  // The wheelhouse: board siding, a flower box under each window (curtains inside), a door with a
  // porthole, a brass bell, its nameboard, the roof rail and a searchlight up top.
  const hx = X(470);
  const roof = 330 - cam.y;
  ctx.fillStyle = HULL.cream;
  ctx.fillRect(snap(hx), snap(roof), 120, deck - roof);
  ctx.fillStyle = HULL.creamSh;
  for (let y = roof + 8; y < deck; y += 7) ctx.fillRect(snap(hx), snap(y), 120, 1);
  ctx.fillRect(snap(hx + 100), snap(roof), 20, deck - roof);
  ctx.fillStyle = HULL.coral;
  ctx.fillRect(snap(hx - 5), snap(roof - 3), 130, 7);
  ctx.fillStyle = HULL.gold;
  ctx.fillRect(snap(hx - 5), snap(roof + 4), 130, 1.5);
  for (let wx = 0; wx <= 120; wx += 12) {
    ctx.fillStyle = '#6a5a7a';
    ctx.fillRect(snap(hx + wx - 1), snap(roof - 14), 2, 11);
  }
  ctx.fillRect(snap(hx - 2), snap(roof - 15), 124, 2);
  for (const dx of [16, 52]) {
    ctx.fillStyle = '#5a4a6a';
    ctx.fillRect(snap(hx + dx), snap(roof + 16), 24, 20);
    ctx.fillStyle = '#bfe8ff';
    ctx.fillRect(snap(hx + dx + 2), snap(roof + 18), 20, 16);
    ctx.fillStyle = '#ffb8cc';
    ctx.fillRect(snap(hx + dx + 2), snap(roof + 18), 6, 16);
    ctx.fillRect(snap(hx + dx + 16), snap(roof + 18), 6, 16);
    ctx.fillStyle = '#8a5a3a';
    ctx.fillRect(snap(hx + dx - 2), snap(roof + 37), 28, 5);
    for (let k = 0; k < 5; k++) {
      ctx.fillStyle = ['#ff8a8a', '#ffd36b', '#ff9ec7', '#ffffff', '#ffd36b'][k];
      ctx.beginPath();
      ctx.arc(snap(hx + dx + 2 + k * 5), snap(roof + 35), 2.2, 0, TAU);
      ctx.fill();
    }
  }
  ctx.fillStyle = '#7a5a8a';
  ctx.fillRect(snap(hx + 94), snap(deck - 48), 22, 48);
  ctx.fillStyle = HULL.brass;
  ctx.beginPath();
  ctx.arc(snap(hx + 105), snap(deck - 34), 5, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#bfe8ff';
  ctx.beginPath();
  ctx.arc(snap(hx + 105), snap(deck - 34), 3.4, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#fff4e0';
  ctx.fillRect(snap(hx + 18), snap(roof + 4), 58, 9);
  ctx.fillStyle = HULL.navy;
  ctx.font = '800 6px Nunito, "Trebuchet MS", "Segoe UI", system-ui, sans-serif';
  ctx.fillText('SEA BISCUIT', snap(hx + 21), snap(roof + 11));
  const sw = Math.sin(time * 1.2) * 0.2;
  ctx.save();
  ctx.translate(snap(hx + 86), snap(roof + 12));
  ctx.rotate(sw);
  ctx.fillStyle = HULL.brass;
  ctx.beginPath();
  ctx.moveTo(-4, 8);
  ctx.quadraticCurveTo(-4, 0, 0, 0);
  ctx.quadraticCurveTo(4, 0, 4, 8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#6a6a88';
  ctx.fillRect(snap(hx + 30), snap(roof - 26), 4, 12);
  ctx.fillStyle = '#c8d0e8';
  ctx.beginPath();
  ctx.ellipse(snap(hx + 32), snap(roof - 28), 7, 5, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.ellipse(snap(hx + 37), snap(roof - 28), 2, 4, 0, 0, TAU);
  ctx.fill();
  // The ship's wheel by the captain, turning a little either way, and his parrot on its post,
  // bobbing its head.
  const wx = X(660);
  ctx.fillStyle = '#8a5a3a';
  ctx.fillRect(snap(wx - 2), snap(deck - 22), 4, 22);
  ctx.save();
  ctx.translate(snap(wx), snap(deck - 30));
  ctx.rotate(Math.sin(time * 0.5) * 0.5);
  ctx.strokeStyle = '#8a5a3a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, TAU);
  ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const t = (i / 8) * TAU;
    ctx.beginPath();
    ctx.moveTo(Math.cos(t) * 3, Math.sin(t) * 3);
    ctx.lineTo(Math.cos(t) * 13, Math.sin(t) * 13);
    ctx.stroke();
  }
  ctx.fillStyle = HULL.gold;
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, TAU);
  ctx.fill();
  ctx.restore();
  const qx = X(726);
  ctx.fillStyle = '#8a5a3a';
  ctx.fillRect(snap(qx - 1), snap(deck - 40), 3, 40);
  ctx.fillRect(snap(qx - 6), snap(deck - 41), 13, 2);
  const bob = Math.max(0, Math.sin(time * 2.6)) ** 4 * 2;
  ctx.fillStyle = '#4fbf6a';
  ctx.beginPath();
  ctx.ellipse(snap(qx), snap(deck - 48), 5, 7, 0.15, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ff6b5a';
  ctx.beginPath();
  ctx.ellipse(snap(qx + 1), snap(deck - 57 + bob), 4.5, 4.5, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffd36b';
  ctx.beginPath();
  ctx.moveTo(snap(qx + 5), snap(deck - 58 + bob));
  ctx.lineTo(snap(qx + 9), snap(deck - 56 + bob));
  ctx.lineTo(snap(qx + 5), snap(deck - 54 + bob));
  ctx.fill();
  ctx.fillStyle = '#2a2d4f';
  ctx.fillRect(snap(qx + 2), snap(deck - 59 + bob), 1.6, 1.6);
  ctx.fillStyle = '#3f8ad8';
  ctx.beginPath();
  ctx.moveTo(snap(qx - 4), snap(deck - 44));
  ctx.lineTo(snap(qx - 9), snap(deck - 32));
  ctx.lineTo(snap(qx - 1), snap(deck - 42));
  ctx.fill();
}
