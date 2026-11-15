// Furniture (data/furniture.js), placed on your island and in your hut (world/decor.js). Drawn
// like the rest of the scenery: outlined pastel shapes lit from the upper left, in each set's own
// colours and shapes: driftwood, rope and shells (Seaside Cottage), icing, cream and strawberry
// pink (Sweet Bakery), midnight blue, gold stars and silver moons (Starry Night), brass, velvet
// and gold (Trophies). Every piece has a little life of its own: lamps glow at night, the
// hammock sways, string lights twinkle, the telescope turns, the globe spins, the clock keeps the
// island's time; trophies show what you've really done. Phases come from the piece's place in
// the world, never the screen. A piece is drawn with its base centred at (x, y).

import { R, E, T, F, mix } from './pixel.js';
import { ramp, planks } from './propkit.js';
import { art, place } from './scenery.js';
import { FURNITURE_BY_ID } from '../data/furniture.js';
import { drawItemIcon } from './icons.js';
import { drawMount } from './mounts.js';
import { FISH_BY_ID } from '../data/fishing.js';
import { gameHour } from '../world/daytime.js';
import { WEATHER_WIND } from './terrain.js';

const TAU = Math.PI * 2;
const WOOD = '#c89a6a';
const DRIFT = '#d8c0a0';
const SKY = '#5fb8d8';
const NIGHT = '#4a4a8a';
const GOLD = '#ffd36b';

function glow(ctx, x, y, r, color, alpha) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, alpha);
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}
const star = (cx, cy, r, c) => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  return T(pts, c);
};

// ---------- Each piece's art (its own box, base at the bottom centre) ----------
const ART = {
  // ----- Mochi Garden (2026-11-15): painted cream and pink, soft stone, flowers everywhere -----
  garden_bench(w, h) {
    const wd = ramp('#e8c8a0', 0.8);
    const out = [
      // (Back posts and legs first, then the slats, the seat and the curled arms over them.)
      R(5, 1, 3, 13, wd.base), R(w - 8, 1, 3, 13, wd.base), R(4, 15, 3, h - 15, wd.sh), R(w - 7, 15, 3, h - 15, wd.sh),
      R(3, 2, w - 6, 3.2, '#fff4ea'), R(3, 6.6, w - 6, 3.2, '#fff4ea'),
      F(R(3, 2, w - 6, 1, '#ffffff')), F(R(3, 6.6, w - 6, 1, '#ffffff')),
      // A little heart cut in the top slat.
      F(E(w / 2 - 1, 3.4, 1.2, 1.1, '#ff8fb4')), F(E(w / 2 + 1, 3.4, 1.2, 1.1, '#ff8fb4')), F(T([[w / 2 - 2.2, 3.7], [w / 2 + 2.2, 3.7], [w / 2, 5.6]], '#ff8fb4')),
      R(1, 11, w - 2, 4, '#ff9ec0'), F(R(1, 11, w - 2, 1.2, '#ffc2d8')), F(R(1, 14, w - 2, 1, '#e0759a')),
      R(0, 8, 6, 2.4, wd.base), R(w - 6, 8, 6, 2.4, wd.base), E(1.4, 9.2, 1.6, 1.6, wd.base), E(w - 1.4, 9.2, 1.6, 1.6, wd.base),
    ];
    return out;
  },
  garden_parasol(w, h) {
    const out = [E(w / 2, h - 2.4, 7, 2.4, '#b8b0c8'), F(E(w / 2, h - 3.2, 5.6, 1.3, '#d8d0e4')), R(w / 2 - 0.9, 7, 1.8, h - 9, '#f2e2c4'), F(R(w / 2 - 0.9, 7, 0.6, h - 9, '#fff8e8'))];
    // The canopy: six panels from the top down to a scalloped rim, pink and cream by turns.
    const rim = [];
    for (let i = 0; i <= 6; i++) {
      const u = i / 6;
      rim.push([1 + u * (w - 2), 15 + Math.sin(Math.PI * u) * -1.2]);
    }
    const apex = [w / 2, 3];
    out.push(T([apex, ...rim, [w - 1, 16], [1, 16]], '#ff9ec0'));
    for (let i = 0; i < 6; i++) if (i % 2) out.push(F(T([apex, rim[i], rim[i + 1]], '#fff4ea')));
    for (let i = 0; i < 6; i++) out.push(F(E((rim[i][0] + rim[i + 1][0]) / 2, 15.6, (w - 2) / 12, 2, i % 2 ? '#fff4ea' : '#ff9ec0')));
    out.push(F(T([apex, [w / 2 - 3, 7], [w / 2 + 3, 7]], 'rgba(255,255,255,0.35)')));
    out.push(E(w / 2, 2.4, 1.6, 1.6, '#ffd36a'));
    return out;
  },
  garden_fountain(w, h) {
    const st = ramp('#d0c8dc', 0.8);
    return [
      // The lower basin: its wall, the water in it, its rim.
      E(w / 2, h - 3, w / 2 - 1, 3, st.sh), R(2, h - 8, w - 4, 5, st.base), F(R(2, h - 8, w - 4, 1.2, st.hi ?? '#e8e0f0')),
      E(w / 2, h - 8, w / 2 - 2, 3, st.base), F(E(w / 2, h - 8.2, w / 2 - 4.4, 2, '#8fd3ff')), F(E(w / 2 - 4, h - 8.8, 6, 0.8, '#c8ecff')),
      // The column and the top bowl, its water and the spout.
      R(w / 2 - 2.4, 10, 4.8, h - 18, st.base), F(R(w / 2 - 2.4, 10, 1.4, h - 18, '#e8e0f0')),
      E(w / 2, 10, 9, 2.8, st.base), F(E(w / 2, 9.6, 7.4, 1.6, '#8fd3ff')),
      R(w / 2 - 0.9, 4, 1.8, 6, st.sh), E(w / 2, 4, 1.8, 1.3, st.base),
    ];
  },
  garden_picnic(w, h) {
    const out = [T([[5, h - 6], [w - 2, h - 6], [w - 5, h], [2, h]], '#ffffff')];
    // The checks: pink squares on the white.
    for (let r = 0; r < 2; r++) for (let c = 0; c < 7; c++) if ((r + c) % 2 === 0) {
      const x0 = 4.4 + c * 6 - r * 1.5;
      out.push(F(T([[x0, h - 6 + r * 3], [x0 + 6, h - 6 + r * 3], [x0 + 6 - 1.5, h - 3 + r * 3], [x0 - 1.5, h - 3 + r * 3]], '#ff9ec0')));
    }
    // A basket of dango on it, and a skewer of three by the basket.
    out.push(R(w - 17, h - 11, 10, 6, '#d8a46a'), F(R(w - 17, h - 11, 10, 1.4, '#ecc890')), F(R(w - 15, h - 9, 1, 3.6, '#b8844a')), F(R(w - 11, h - 9, 1, 3.6, '#b8844a')));
    out.push(F(T([[w - 16, h - 11], [w - 12, h - 16], [w - 8, h - 11], [w - 9, h - 11], [w - 12, h - 14.6], [w - 15, h - 11]], '#b8844a')));
    out.push(F(R(9, h - 7.6, 14, 0.8, '#c8945a')), E(11, h - 7.8, 2, 1.8, '#ffb3c8'), E(15, h - 7.8, 2, 1.8, '#fff8f2'), E(19, h - 7.8, 2, 1.8, '#9fd87a'));
    return out;
  },
  garden_arch(w, h) {
    const out = [R(2, 20, 4, h - 20, '#fff4ea'), R(w - 6, 20, 4, h - 20, '#fff4ea'), F(R(2, 20, 1.2, h - 20, '#ffffff')), F(R(w - 6, 20, 1.2, h - 20, '#ffffff'))];
    // The arch: a white trellis band, round from post to post.
    const band = [];
    for (let i = 0; i <= 14; i++) {
      const a = Math.PI + (i / 14) * Math.PI;
      band.push([w / 2 + Math.cos(a) * (w / 2 - 2), 22 + Math.sin(a) * 19]);
    }
    for (let i = 14; i >= 0; i--) {
      const a = Math.PI + (i / 14) * Math.PI;
      band.push([w / 2 + Math.cos(a) * (w / 2 - 6), 22 + Math.sin(a) * 15.6]);
    }
    out.push(T(band, '#fff4ea'));
    // Roses climbing it: leaves, then pink blooms with a deeper heart.
    const spots = [[4, 44], [5, 34], [4, 26], [7, 16], [12, 8], [w / 2 - 4, 4.4], [w / 2 + 5, 4], [w - 12, 8], [w - 7, 16], [w - 4, 26], [w - 5, 36], [w - 4, 46]];
    for (const [i, [rx, ry]] of spots.entries()) out.push(F(E(rx + (i % 2 ? 2.4 : -2.4), ry + 1.6, 2.4, 1.2, '#7cc87a')));
    for (const [i, [rx, ry]] of spots.entries()) out.push(E(rx, ry, 2.4, 2.2, i % 3 === 1 ? '#ffc2d8' : '#ff8fb4'), F(E(rx - 0.4, ry - 0.4, 1, 0.9, '#e0507a')));
    return out;
  },
  garden_lantern(w, h) {
    const st = ramp('#c8c0d0', 0.8);
    return [
      R(1, h - 4, w - 2, 4, st.sh), F(R(1, h - 4, w - 2, 1, '#e0dae8')), R(w / 2 - 2, 15, 4, h - 19, st.base), F(R(w / 2 - 2, 15, 1.2, h - 19, '#e0dae8')),
      R(2, 13, w - 4, 2.4, st.sh),
      R(3, 7, w - 6, 6.4, st.base), F(R(5, 8.4, w - 10, 3.8, '#4a3a5a')),
      T([[-1, 8], [1, 5.4], [w / 2, 2], [w - 1, 5.4], [w + 1, 8]], st.sh), F(T([[1, 5.6], [w / 2, 2.6], [w / 2, 4.6]], '#e0dae8')),
      E(w / 2, 1.6, 1.5, 1.5, st.base),
    ];
  },
  garden_pinwheels(w, h) {
    const wd = ramp('#d8a46a', 0.8);
    return [
      // The sticks (the pinwheels themselves turn live).
      R(6, 3, 0.9, 12, '#c8945a'), R(13, 1, 0.9, 13, '#c8945a'), R(20, 4, 0.9, 11, '#c8945a'),
      // The planter, its soil, and flowers peeping over.
      R(2, 14, w - 4, h - 14, wd.base), F(R(2, 14, w - 4, 1.4, wd.hi ?? '#ecc890')), F(R(2, 18, w - 4, 0.8, wd.sh)),
      F(R(3, 13.2, w - 6, 1.6, '#8a5a3a')),
      E(4.6, 12.6, 1.8, 1.6, '#ffe680'), E(9.6, 12.2, 1.8, 1.6, '#ffb3c8'), E(17, 12.4, 1.8, 1.6, '#c8a8f0'), E(22, 12.6, 1.8, 1.6, '#ffe680'),
      F(E(4.6, 12.6, 0.6, 0.6, '#ff9e60')), F(E(9.6, 12.2, 0.6, 0.6, '#ffe680')), F(E(17, 12.4, 0.6, 0.6, '#ffe680')), F(E(22, 12.6, 0.6, 0.6, '#ff9e60')),
    ];
  },
  // The Moon Viewing festival's prizes.
  garden_pampas(w, h) {
    const out = [];
    // The plumes (behind the vase's mouth), each on its arching stalk.
    for (const [sx, tx, ty, c] of [[7, 2, 6, '#f4eedf'], [8, 6, 1, '#fbf6ea'], [9, 11, 2, '#f4eedf'], [8, 14, 9, '#ece4d0']]) {
      out.push(F(T([[sx - 0.4, 16], [sx + 0.4, 16], [tx + 0.4, ty + 4], [tx - 0.4, ty + 4]], '#b8b07a')));
      out.push(E(tx, ty + 3.6, 1.8, 4.6, c), F(E(tx - 0.5, ty + 2.4, 0.6, 2.4, '#ffffff')));
    }
    // The vase: indigo, its shoulder lit, a white band.
    out.push(T([[w / 2 - 3, 16], [w / 2 + 3, 16], [w / 2 + 6, 24], [w / 2 + 4.6, h], [w / 2 - 4.6, h], [w / 2 - 6, 24]], '#34508a'));
    out.push(F(R(w / 2 - 3.4, 15, 6.8, 1.6, '#5a7ac0')), F(R(w / 2 - 5.4, 25, 10.8, 1.2, '#e8eef8')), F(R(w / 2 - 4, 19, 1.2, 10, '#5a7ac0')));
    return out;
  },
  garden_moonlantern(w, h) {
    const wd = ramp('#b88a5a', 0.8);
    return [
      // The post and its foot.
      R(w / 2 - 1.4, 16, 2.8, h - 18, wd.base), F(R(w / 2 - 1.4, 16, 0.9, h - 18, wd.hi ?? '#d8a878')), R(2, h - 3, w - 4, 3, wd.sh),
      // The arm and the lantern hung from it.
      R(w / 2 - 1, 1, 2, 3, wd.sh),
      E(w / 2, 9, 6.6, 7, '#fff2d6'), F(E(w / 2 - 2, 7, 2.4, 3.4, '#ffffff')),
      F(R(w / 2 - 4.4, 2.4, 8.8, 1.4, '#e05a3a')), F(R(w / 2 - 4.4, 14.4, 8.8, 1.4, '#e05a3a')),
      F(E(w / 2, 9, 2.6, 2.6, '#f2b84a')), F(E(w / 2 + 0.9, 8.4, 2.1, 2.1, '#fff2d6')),
    ];
  },
  garden_offering(w, h) {
    const wd = ramp('#d8b07a', 0.8);
    const out = [
      // The stand: a tray on a box, a round hole cut in its side.
      R(5, h - 10, w - 10, 10, wd.base), F(E(w / 2, h - 5, 3.4, 2.6, '#8a6440')), R(2, h - 13, w - 4, 3, '#e2c08a'), F(R(2, h - 10.6, w - 4, 0.8, wd.sh)),
      // The paper.
      R(4, h - 14, w - 8, 1.4, '#ffffff'), F(T([[4, h - 13], [2, h - 9.6], [5, h - 12.6]], '#ffffff')), F(T([[w - 4, h - 13], [w - 2, h - 9.6], [w - 5, h - 12.6]], '#ffffff')),
    ];
    // The dango, four, three, two, one.
    for (const [row, n] of [[0, 4], [1, 3], [2, 2], [3, 1]]) {
      for (let i = 0; i < n; i++) {
        const bx = w / 2 + (i - (n - 1) / 2) * 4.6;
        const by = h - 16.4 - row * 4;
        out.push(E(bx + 0.3, by + 0.3, 2.3, 2.3, '#e6dece'), E(bx, by, 2.2, 2.2, '#fffcf4'), F(E(bx - 0.8, by - 0.8, 0.6, 0.5, '#ffffff')));
      }
    }
    // A sprig of pampas tucked behind.
    out.push(F(T([[w - 7, h - 14], [w - 6.4, h - 14], [w - 3, 2], [w - 3.6, 2]], '#b8b07a')), E(w - 3.2, 4, 1.6, 4, '#f4eedf'));
    return out;
  },
  // The Snow Lantern Festival's prizes.
  garden_snowlantern(w, h) {
    return [
      E(w / 2, h - 1.4, w / 2, 1.8, '#d4e0f4'),
      T([[2, h - 1], [2.4, 8], [w / 2 - 4, 5.4], [w / 2 + 4, 5.4], [w - 2.4, 8], [w - 2, h - 1]], '#f4f8ff'), F(T([[w / 2 + 3, 5.6], [w - 2.4, 8], [w - 2, h - 1], [w / 2 + 4, h - 1]], '#dce6f6')),
      E(w / 2, 4.6, w / 2 - 0.6, 2.8, '#ffffff'), F(R(3, 5.4, w - 6, 0.9, '#e6eefa')),
      F(T([[w / 2 - 2.6, h - 4.4], [w / 2 - 2.6, h - 9], [w / 2, h - 11.2], [w / 2 + 2.6, h - 9], [w / 2 + 2.6, h - 4.4]], '#5a6a8a')),
    ];
  },
  garden_camellia(w, h) {
    const out = [
      // Leaves, glossy dark green.
      E(w / 2, 11, 9.6, 7.6, '#2e6a4a'), E(w / 2 - 5, 13, 5, 4, '#3a7a56'), E(w / 2 + 5, 9.6, 5, 4, '#3a7a56'), F(E(w / 2 - 3, 8, 2.4, 1.2, '#5a9a74')),
    ];
    // The flowers: red, gold at their hearts.
    for (const [fx, fy] of [[w / 2 - 4, 8], [w / 2 + 4, 12], [w / 2 - 1, 14.4], [w / 2 + 5, 6]]) out.push(E(fx, fy, 2.6, 2.4, '#d83a4a'), F(E(fx - 0.6, fy - 0.6, 1.2, 1, '#f06070')), F(E(fx, fy, 0.8, 0.8, '#f2c94c')));
    // A cap of snow on top, and the glazed pot.
    out.push(E(w / 2, 4.6, 7.6, 2.4, '#ffffff'), F(E(w / 2 - 2, 4, 3, 1, '#f4f8ff')));
    out.push(T([[w / 2 - 7, 18], [w / 2 + 7, 18], [w / 2 + 5.4, h], [w / 2 - 5.4, h]], '#4a6ab0'), F(R(w / 2 - 7, 18, 14, 1.6, '#6a8ad0')), F(R(w / 2 - 5, 22, 1.2, 6, '#7a9ae0')));
    return out;
  },
  garden_snowmochi(w, h) {
    return [
      // Twig arms, out for a hug.
      F(T([[2, 13], [7, 15.4], [7, 16.4], [1.4, 14.2]], '#7a5232')), F(T([[w - 2, 13], [w - 7, 15.4], [w - 7, 16.4], [w - 1.4, 14.2]], '#7a5232')),
      // Its round body and face.
      E(w / 2, h - 9.4, 9.4, 9, '#ffffff'), F(E(w / 2 + 3, h - 7, 5.6, 5.4, '#e6eefa')),
      F(E(w / 2 - 3, h - 11, 1, 1.2, '#3a3a4a')), F(E(w / 2 + 3, h - 11, 1, 1.2, '#3a3a4a')), F(E(w / 2, h - 8.4, 1.4, 0.7, '#e08a6a')),
      F(E(w / 2 - 5.6, h - 8.4, 1.8, 1, '#ffb0c0')), F(E(w / 2 + 5.6, h - 8.4, 1.8, 1, '#ffb0c0')),
      // The red scarf, its end hanging down.
      R(w / 2 - 8, h - 4.4, 16, 2.4, '#d83a4a'), F(R(w / 2 + 3, h - 3, 2.4, 3, '#d83a4a')), F(R(w / 2 - 8, h - 4.4, 16, 0.8, '#f06070')),
      // The knitted hat and its bobble.
      E(w / 2, h - 17.4, 6.4, 4, '#5a8ad8'), F(R(w / 2 - 6.4, h - 16.4, 12.8, 1.6, '#ffffff')), E(w / 2, h - 22, 2, 2, '#ffffff'),
    ];
  },
  // Blossom Day's prizes.
  garden_bonbori(w, h) {
    return [
      R(w / 2 - 1, 12, 2, h - 14, '#c8303a'), F(R(w / 2 - 1, 12, 0.7, h - 14, '#e05a5a')), R(w / 2 - 4, h - 2.4, 8, 2.4, '#8a2a30'),
      R(1.4, 2, w - 2.8, 10, '#ffe4ee'), F(R(1.4, 2, 2.4, 10, '#ffffff')), F(R(1, 1, w - 2, 1.6, '#ff8fb4')), F(R(1, 11, w - 2, 1.4, '#ff8fb4')),
      F(E(w / 2, 6.8, 1.8, 1.8, '#ffb3c8')),
    ];
  },
  garden_hanamimat(w, h) {
    return [
      T([[0, h], [w, h], [w - 3, h - 5], [3, h - 5]], '#c8303a'), F(R(1, h - 1, w - 2, 0.9, '#f2e8e0')), F(R(3, h - 5, w - 6, 0.8, '#f2e8e0')),
      R(w / 2 + 2, h - 13, 10, 8, '#2a1e2a'), F(R(w / 2 + 2, h - 10.4, 10, 0.8, '#c8303a')), F(R(w / 2 + 5.6, h - 13, 2.8, 8, '#ffb3c8')),
      E(w / 2 - 9, h - 8, 4, 3.4, '#6a8a6a'), F(R(w / 2 - 6, h - 9, 3, 1, '#6a8a6a')), F(R(w / 2 - 19, h - 7, 3, 2.4, '#f4f0e8')),
    ];
  },
  garden_sakura(w, h) {
    const out = [
      T([[w / 2 - 3, h], [w / 2 + 3, h], [w / 2 + 2, h - 22], [w / 2 - 1, h - 22]], '#8a5a3a'), F(T([[w / 2 + 1, h - 18], [w / 2 + 9, h - 26], [w / 2 + 10, h - 24.6], [w / 2 + 2, h - 15]], '#8a5a3a')),
      E(w / 2, h - 34, 20, 15, '#ffc2d6'), E(w / 2 - 11, h - 29, 11, 9, '#ffb3c8'), E(w / 2 + 12, h - 30, 11, 9, '#ffb3c8'), E(w / 2 + 1, h - 44, 13, 9, '#ffd6e4'),
    ];
    for (let i = 0; i < 16; i++) {
      const a = i * 2.39;
      const r = 4 + (i % 5) * 3;
      out.push(F(E(w / 2 + Math.cos(a) * r * 1.3, h - 34 + Math.sin(a) * r * 0.8, 1.5, 1.5, i % 3 ? '#ffe4ee' : '#ff8fb4')));
    }
    return out;
  },
  // Lantern Night's prizes.
  garden_furin(w, h) {
    return [
      R(1, 2, 1.6, h - 2, '#8a5a34'), R(1, 2, w - 4, 1.6, '#8a5a34'), R(0, h - 2, 6, 2, '#6a4628'),
    ];
  },
  garden_chochin(w, h) {
    return [
      R(1, 0, 1.6, h, '#6a4628'), R(w - 2.6, 0, 1.6, h, '#6a4628'), R(1, 1, w - 2, 1.6, '#8a5a34'), R(0, h - 2, w, 2, '#6a4628'),
      E(w / 2, 12, 7.4, 8.6, '#e04a3a'), F(E(w / 2 - 2.6, 10, 2.4, 4, '#ff7a6a')), F(R(w / 2 - 5, 3.4, 10, 1.6, '#2a2a3a')), F(R(w / 2 - 5, 19.6, 10, 1.6, '#2a2a3a')),
      F(R(w / 2 - 6.6, 8, 13.2, 0.6, '#c8303a')), F(R(w / 2 - 7, 12, 14, 0.6, '#c8303a')), F(R(w / 2 - 6.6, 16, 13.2, 0.6, '#c8303a')),
      F(R(w / 2 - 0.6, 21, 1.2, 3, '#f2c94c')),
    ];
  },
  garden_asagao(w, h) {
    const out = [
      R(3, 2, 1.4, h - 6, '#c8b070'), R(w - 4.4, 2, 1.4, h - 6, '#c8b070'), R(w / 2 - 0.7, 0, 1.4, h - 6, '#c8b070'),
      R(2, 10, w - 4, 1, '#c8b070'), R(2, 22, w - 4, 1, '#c8b070'),
      R(2, h - 6, w - 4, 6, '#a8703e'), F(R(2, h - 6, w - 4, 1.2, '#c8915a')),
    ];
    // The vine's leaves, and its flowers: blue and purple trumpets, white at their throats.
    for (let i = 0; i < 12; i++) out.push(E(4 + ((i * 7.3) % (w - 8)), 4 + ((i * 11.7) % (h - 12)), 3, 2.4, '#5aa060'));
    for (const [fx, fy, c] of [[6, 8, '#5a7ae0'], [17, 5, '#a86ad8'], [12, 16, '#5a7ae0'], [21, 20, '#a86ad8'], [7, 26, '#a86ad8'], [18, 30, '#5a7ae0']]) out.push(E(fx, fy, 3, 3, c), F(E(fx, fy, 1.1, 1.1, '#ffffff')));
    return out;
  },
  garden_statue(w, h) {
    const st = ramp('#d8d2e2', 0.8);
    return [
      // The pedestal.
      R(3, 20, w - 6, h - 20, st.base), F(R(3, 20, 1.6, h - 20, '#ece8f2')), R(1, 18, w - 2, 3, st.sh), R(2, h - 2, w - 4, 2, st.sh),
      // The stone Mochi on it: round, smiling, and its sprout in gold.
      E(w / 2, 12.4, 8, 6.4, st.base), F(E(w / 2 - 2.4, 10.4, 3.4, 2.4, '#f2eef6')),
      F(E(w / 2 - 2.6, 12.4, 0.8, 1, '#8a8098')), F(E(w / 2 + 2.6, 12.4, 0.8, 1, '#8a8098')), F(E(w / 2, 14.4, 1.2, 0.5, '#a89eb8')),
      R(w / 2 - 0.5, 2.6, 1, 4.4, '#e0a830'), T([[w / 2, 3.4], [w / 2 - 4.4, 1.2], [w / 2 - 2, 4.4]], '#ffd36a'), T([[w / 2, 3.4], [w / 2 + 4.4, 1.2], [w / 2 + 2, 4.4]], '#ffd36a'),
    ];
  },
  sea_table(w, h) {
    const wd = ramp(DRIFT, 0.8);
    return [...planks(0, 0, w, 5, wd, 4, 1), R(4, 5, 4, h - 5, wd.sh), R(w - 8, 5, 4, h - 5, wd.sh), F(R(4, 5, 1.4, h - 5, wd.base)), F(R(w - 8, 5, 1.4, h - 5, wd.base)), R(6, h - 9, w - 12, 2, wd.sh)];
  },
  sea_chair(w, h) {
    const wd = ramp(DRIFT, 0.8);
    return [R(2, 0, 3, h, wd.sh), R(2, 0, w - 4, 3, wd.base), R(2, 6, 3, 3, wd.base), R(2, 14, w - 2, 3, wd.base), R(w - 4, 14, 3, h - 14, wd.sh), R(3, 14, 3, h - 14, wd.sh),
      R(2, 11, w - 2, 4, '#ffffff'), F(R(4, 11, 3, 4, SKY)), F(R(10, 11, 3, 4, SKY)), F(R(16, 11, 2, 4, SKY))];
  },
  sea_bed(w, h) {
    const wd = ramp(DRIFT, 0.8);
    const q = ramp('#9fd8f0', 0.75);
    const out = [R(0, 6, 5, h - 6, wd.base), R(w - 4, 14, 4, h - 14, wd.base), R(0, h - 8, w, 6, wd.sh), F(R(0, h - 8, w, 1.4, wd.base))];
    out.push(E(12, 14, 9, 5, '#ffffff'), F(E(10, 13, 5, 2.4, '#f4f0ff')));
    out.push(T([[8, h - 8], [8, 16], [w - 2, 18], [w - 2, h - 8]], q.base));
    for (let x = 12; x < w - 4; x += 10) out.push(F(T([[x, 22], [x + 5, 19], [x + 10, 22], [x + 5, 24]], '#ffffff')));
    out.push(F(R(8, h - 11, w - 10, 3, q.sh)));
    return out;
  },
  sea_lamp(w, h) {
    return [R(4, h - 3, 4, 3, DRIFT), R(5.4, 8, 1.2, h - 10, '#a8805a'),
      T([[0, 9], [6, 0], [12, 9]], '#ffd2e0'), ...[2.5, 4.5, 6, 7.5, 9.5].map((x) => F(R(x, 2, 0.6, 7, '#e8a0b8'))), F(E(6, 8, 3, 1.4, '#fff3c4'))];
  },
  sea_hammock(w, h) {
    const wd = ramp(WOOD, 0.8);
    return [R(2, 0, 4, h, wd.sh), R(w - 6, 0, 4, h, wd.sh), F(R(2, 0, 1.4, h, wd.base)), F(R(w - 6, 0, 1.4, h, wd.base)), E(4, 0, 3, 2, wd.base), E(w - 4, 0, 3, 2, wd.base)];
  },
  sea_net(w, h) {
    const net = '#e8dcc8';
    const out = [R(0, 0, w, 2, WOOD)];
    for (let k = 0; k < 6; k++) out.push(F(T([[3 + k * 7, 2], [4 + k * 7, 2], [2 + k * 6.6, h], [1 + k * 6.6, h]], net)));
    for (let k = 0; k < 4; k++) out.push(F(R(1, 6 + k * 7, w - 2, 0.8, net)));
    out.push(E(9, 12, 3, 3, '#ff8a6a'), E(30, 20, 3, 3, GOLD), star(22, 10, 5, '#ffb08a'));
    return out;
  },
  bake_table(w, h) {
    const icing = ramp('#fff4ea', 0.6);
    return [T([[2, 0], [w - 2, 0], [w, 6], [0, 6]], icing.base), ...[4, 12, 20, 28, 36].map((x) => E(x, 6, 4, 3, '#ffc2d4')), R(w / 2 - 3, 6, 6, h - 10, '#ffd2e0'), F(R(w / 2 - 3, 6, 2, h - 10, '#ffe8ef')),
      E(w / 2, h - 2, 12, 3, '#ffc2d4'), F(E(w / 2, h - 3, 10, 1.6, '#ffe0ea')), ...[8, 18, 26, 33].map((x, i) => F(R(x, 2, 2, 1, ['#ff8a8a', '#9fe0a0', '#8fd8ff', GOLD][i])))];
  },
  bake_stool(w, h) {
    return [E(w / 2, 5, 8, 4, '#c8e8b8'), F(E(w / 2, 3.6, 6.5, 2.2, '#e0f4d8')), R(1, 7, w - 2, 3, '#fff4ea'), E(w / 2, 11.5, 8, 3.6, '#c8e8b8'), R(w / 2 - 1.5, 13, 3, h - 13, '#ffd2e0'), E(w / 2, h - 1, 5, 1.6, '#ffc2d4')];
  },
  bake_lamp(w, h) {
    return [T([[1, 9], [11, 9], [9, h], [3, h]], '#ffc2d4'), ...[3, 5.5, 8].map((x) => F(R(x, 10, 1, h - 11, '#ff9ec0'))), E(6, 8, 6, 3.6, '#fff4ea'), E(3.5, 6.5, 2.5, 2, '#fff4ea'), E(8.5, 6.5, 2.5, 2, '#fff4ea'), E(6, 3, 3, 3, '#ff6b8a'), F(E(5, 2, 1, 1, '#ffd2dc'))];
  },
  bake_rug(w, h) {
    return [E(w / 2, h / 2, w / 2, h / 2, '#ff8a9a'), E(w / 2, h / 2 - 0.6, w / 2 - 4, h / 2 - 1, '#ffb3bf'), ...Array.from({ length: 9 }, (_, i) => F(E(10 + i * 6.2, h / 2 + (i % 2 ? -0.8 : 0.8), 1, 0.6, '#ffe36b'))), T([[w / 2 - 10, 0], [w / 2, 2], [w / 2 + 10, 0], [w / 2, -2]], '#7fd08a')];
  },
  bake_shelf(w, h) {
    const wd = ramp('#e8c8a8', 0.75);
    const out = [R(0, 0, w, 4, wd.base), F(R(0, 0, w, 1.2, wd.hi))];
    for (let x = 0; x < w; x += 6) out.push(E(x + 3, 4, 3, 2.4, '#ffffff'));
    out.push(T([[6, 4], [10, 4], [8, h]], wd.sh), T([[w - 10, 4], [w - 6, 4], [w - 8, h]], wd.sh));
    return out;
  },
  bake_cake(w, h) {
    return [E(w / 2, h - 1, 9, 2, '#e8e0f0'), R(3, h - 7, 12, 6, '#fff4ea'), R(5, h - 12, 8, 5, '#ffd2e0'), R(6.5, h - 16, 5, 4, '#fff4ea'), E(9, h - 17, 1.6, 1.6, '#ff6b8a'),
      ...[4, 7, 10, 13].map((x) => F(E(x + 0.5, h - 7, 1.4, 1.2, '#ffc2d4')))];
  },
  star_bed(w, h) {
    const moon = ramp('#fff3b0', 0.7);
    const out = [];
    // The crescent: a big moon curving up behind the head of the bed.
    const cres = [];
    for (let i = 0; i <= 14; i++) {
      const a = Math.PI * 0.55 + (i / 14) * Math.PI * 1.25;
      cres.push([15 + Math.cos(a) * 15, h - 15 + Math.sin(a) * 15]);
    }
    for (let i = 14; i >= 0; i--) {
      const a = Math.PI * 0.62 + (i / 14) * Math.PI * 1.1;
      cres.push([20 + Math.cos(a) * 11, h - 18 + Math.sin(a) * 11]);
    }
    out.push(T(cres, moon.base), F(E(5, h - 16, 2.4, 5, moon.hi)));
    out.push(R(6, h - 10, w - 6, 8, '#3f3f80'), F(R(6, h - 10, w - 6, 2, '#5f5fa8')), E(16, h - 12, 7, 3.5, '#e8e8ff'));
    for (let x = 28; x < w - 4; x += 9) out.push(F(star(x, h - 6, 1.8, GOLD)));
    out.push(R(w - 4, h - 16, 4, 16, moon.sh), R(6, h - 2, w - 6, 2, '#2f2f68'));
    return out;
  },
  star_lights(w, h) {
    return [];
  },
  star_scope(w, h) {
    const br = ramp('#e0b060', 0.8);
    return [T([[w / 2, 16], [2, h], [5, h]], '#8a6a4a'), T([[w / 2, 16], [w - 2, h], [w - 5, h]], '#8a6a4a'), T([[w / 2 - 1, 16], [w / 2 + 1, 16], [w / 2 + 1, h], [w / 2 - 1, h]], '#a8805a'), E(w / 2, 16, 3, 3, br.sh)];
  },
  star_globe(w, h) {
    return [E(w / 2, h - 1, 5, 1.6, '#c8a060'), R(w / 2 - 0.6, h - 8, 1.2, 7, '#a8805a')];
  },
  star_lamp(w, h) {
    return [E(w / 2, h - 1, 7, 2, '#5f5fa8'), R(w / 2 - 1, 14, 2, h - 15, '#8f8fc8'), F(R(w / 2 - 1, 14, 0.6, h - 15, '#c8c8ff')), T([[w / 2, 13], [w / 2 + 8, 6], [w / 2 + 6, 2], [w / 2 + 2, 6]], '#8f8fc8')];
  },
  star_clock(w, h) {
    const out = [E(w / 2, h / 2, w / 2, h / 2, '#4a4a8a'), E(w / 2, h / 2, w / 2 - 2, h / 2 - 2, '#2f2f68')];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU - Math.PI / 2;
      out.push(star(w / 2 + Math.cos(a) * (w / 2 - 4.5), h / 2 + Math.sin(a) * (h / 2 - 4.5), i % 3 ? 1.2 : 2, i % 3 ? '#c8c8ff' : GOLD));
    }
    return out;
  },
  trophy_plaque(w, h) {
    const wd = ramp(WOOD, 0.8);
    return [T([[2, 0], [w - 2, 0], [w, h / 2], [w - 2, h], [2, h], [0, h / 2]], wd.base), F(T([[4, 2], [w - 4, 2], [w - 2, h / 2], [w - 4, h - 2], [4, h - 2], [2, h / 2]], wd.hi)), R(8, h - 6, w - 16, 4, '#ffe08a')];
  },
  trophy_figure(w, h) {
    return [E(w / 2, h - 2, 8, 2.6, '#a8805a'), F(E(w / 2, h - 3, 6.5, 1.4, '#c89a6a'))];
  },
  trophy_cup(w, h) {
    const g = ramp(GOLD, 0.7);
    return [R(3, h - 4, 10, 4, '#7a5a8a'), R(6.5, h - 8, 3, 4, g.sh), T([[1, 2], [15, 2], [12, 12], [4, 12]], g.base), F(T([[3, 3], [7, 3], [6, 11], [5, 11]], g.hi)), T([[1, 3], [-2, 6], [3, 9]], g.sh), T([[15, 3], [18, 6], [13, 9]], g.sh)];
  },
  trophy_crown(w, h) {
    return [E(w / 2, h - 4, 9, 4, '#a04a7a'), F(E(w / 2, h - 5.4, 7, 2, '#d070a0')), ...[[1, h - 1], [w - 1, h - 1]].map(([x, y]) => E(x, y, 1.6, 2, GOLD))];
  },
  trophy_tank(w, h) {
    return tankArt(w, h, false);
  },
  trophy_grandtank(w, h) {
    return tankArt(w, h, true);
  },
  trophy_ribbon(w, h) {
    return [T([[w / 2 - 6, 12], [w / 2 - 2, 12], [w / 2 - 5, h], [w / 2 - 8, h - 3]], '#5fb8d8'), T([[w / 2 + 2, 12], [w / 2 + 6, 12], [w / 2 + 8, h - 3], [w / 2 + 5, h]], '#5fb8d8'),
      ...Array.from({ length: 12 }, (_, i) => E(w / 2 + Math.cos((i / 12) * TAU) * 7, 9 + Math.sin((i / 12) * TAU) * 7, 3, 3, '#ffe36b')), E(w / 2, 9, 6, 6, '#ffb03a'), E(w / 2, 9, 4.6, 4.6, '#fff3c4')];
  },
};

// A fish tank: a wooden stand, the water behind its glass (deep at the bottom), a sand bed with
// pebbles, rocks and weed (a coral garden in the grand one), and a lid. The fish, bubbles and
// light swim over it (drawPiece).
const TANK_STAND = 12;
function tankArt(w, h, grand) {
  const wd = ramp(grand ? '#a8784a' : WOOD, 0.8);
  const top = 3;
  const bot = h - TANK_STAND;
  const out = [
    // The stand, its doors and knobs.
    R(0, bot, w, TANK_STAND, wd.base), F(R(1, bot + 1, w - 2, 2, wd.hi)), R(2, h - 2, w - 4, 2, wd.sh),
    ...[0.25, 0.75].map((u) => R(w * u - w * 0.2, bot + 4, w * 0.4 - 1, TANK_STAND - 7, wd.sh)),
    ...[0.25, 0.75].map((u) => F(E(w * u + (u < 0.5 ? w * 0.16 : -w * 0.16), bot + 7.5, 0.9, 0.9, GOLD))),
    // The water, bands of blue down to the deep.
    R(2, top + 2, w - 4, bot - top - 2, '#8fd8f0'),
    F(R(2, top + 2 + (bot - top) * 0.35, w - 4, (bot - top) * 0.65 - 2, '#7ac8e8')),
    F(R(2, top + 2 + (bot - top) * 0.7, w - 4, (bot - top) * 0.3 - 2, '#68b4dc')),
    // Sand and pebbles.
    T([[2, bot - 5], [w * 0.3, bot - 7], [w * 0.65, bot - 5.5], [w - 2, bot - 7], [w - 2, bot], [2, bot]], '#f4dca8'),
    ...[[0.18, '#c8a8d8'], [0.42, '#ffb8a8'], [0.58, '#a8c8e8'], [0.86, '#f0c890']].map(([u, c]) => F(E(w * u, bot - 2, 1.6, 1.1, c))),
    // A rock with a hole through it.
    T([[w * 0.62, bot - 5], [w * 0.66, bot - 13], [w * 0.74, bot - 15], [w * 0.8, bot - 9], [w * 0.8, bot - 5]], '#9a9ab8'),
    F(E(w * 0.72, bot - 9, 1.6, 1.6, '#5a6a9a')),
  ];
  if (grand) {
    // A coral garden: branching pink coral, a fan, and a sea anemone.
    const cx = w * 0.22;
    out.push(R(cx - 1, bot - 18, 2, 12, '#ff8ab0'), T([[cx, bot - 12], [cx - 6, bot - 20], [cx - 4.6, bot - 21], [cx + 0.8, bot - 14]], '#ff8ab0'), T([[cx, bot - 14], [cx + 5, bot - 23], [cx + 6.4, bot - 22], [cx + 1, bot - 12]], '#ff9ec0'));
    out.push(T([[w * 0.44, bot - 6], [w * 0.38, bot - 20], [w * 0.47, bot - 24], [w * 0.55, bot - 18], [w * 0.5, bot - 6]], '#ffb36b'));
    // (The sea fan's ribs, branching up from its foot.)
    for (const [dx, dy] of [[-4.4, -16], [-1.6, -19], [1.6, -18.4], [4, -13]]) out.push(F(T([[w * 0.47 - 0.4, bot - 6], [w * 0.47 + dx - 0.4, bot + dy], [w * 0.47 + dx + 0.4, bot + dy], [w * 0.47 + 0.4, bot - 6]], '#e08a4a')));
    for (let k = 0; k < 7; k++) out.push(R(w * 0.9 - 4 + k * 1.2, bot - 9 - (k % 2) * 2, 0.9, 4 + (k % 2) * 2, '#c88aff'));
  }
  // The lid and the glass frame.
  out.push(R(0, 0, w, top + 2, '#5a6a8a'), F(R(1, 0.6, w - 2, 1, '#8a9ac0')), R(0, top, 2, bot - top, '#5a6a8a'), R(w - 2, top, 2, bot - top, '#5a6a8a'));
  return out;
}

function pieceSprite(def) {
  const pad = 4;
  return art(`furn|${def.id}`, def.w + pad * 2, def.h + pad, () => ART[def.id](def.w, def.h).map((s) => {
    const o = { ...s };
    if (o.t === 'p') o.pts = o.pts.map(([x, y]) => [x + pad, y + pad]);
    else { o.x += pad; o.y += pad; }
    return o;
  }), false);
}

// What a trophy shows, from its owner's record (`char`, yours or a friend's when visiting).
export function trophyNote(def, char) {
  if (def.show === 'fish') {
    const best = Object.entries(char?.fishBook ?? {}).filter(([id, r]) => r.best && FISH_BY_ID[id]).sort((a, b) => b[1].best - a[1].best)[0];
    return best ? { fish: best[0], text: `${FISH_BY_ID[best[0]].name} ${best[1].best} cm` } : { text: 'Catch something!' };
  }
  if (def.show === 'grade') {
    const order = ['C', 'B', 'A', 'S'];
    const best = Object.values(char?.dungeons ?? {}).map((r) => r.best).filter(Boolean).sort((a, b) => order.indexOf(b) - order.indexOf(a))[0];
    return { text: best ?? '-' };
  }
  if (def.show === 'crown') return { on: Object.values(char?.dungeons ?? {}).some((r) => (r.hardClears ?? 0) > 0) };
  if (def.show === 'mount') return { mount: char?.mount ?? null };
  if (def.show === 'derby') return { text: String(char?.derbyWins ?? 0) };
  // The rarest fish you've caught (the biggest first among equals), at their record sizes. In the
  // craft list (no owner) a goldfish and a clownfish model it.
  if (def.show === 'tank') {
    if (!char) return { fish: [['fish_goldfish', 10], ['fish_clown', 11], ['fish_tang', 22], ['fish_seapony', 12]].slice(0, def.fish) };
    const caught = Object.entries(char.fishBook ?? {}).filter(([id, r]) => r.n > 0 && FISH_BY_ID[id] && !FISH_BY_ID[id].boss);
    caught.sort((a, b) => FISH_BY_ID[b[0]].rarity - FISH_BY_ID[a[0]].rarity || (b[1].best ?? 0) - (a[1].best ?? 0));
    return { fish: caught.slice(0, def.fish).map(([id, r]) => [id, r.best ?? 10]) };
  }
  return null;
}

// Inside a tank: weed swaying, light rippling down, bubbles rising from the rock, and the fish
// gliding end to end, each on its own beat (from its place in the list and the tank's place in
// the world). A fish slows into each turn, so its turn (a mirror flip) lands when it's nearly
// still. Bigger catches swim bigger: a minnow is a speck, a marlin fills its lane.
function drawTankLife(ctx, def, fish, x, y, time, wx, night) {
  const x0 = x - def.w / 2 + 2;
  const top = y - def.h + 6;
  const bot = y - TANK_STAND - 4;
  const w = def.w - 4;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, top, w, bot - top + 4);
  ctx.clip();
  // Weed at both ends, swaying.
  ctx.strokeStyle = '#5fc08a';
  ctx.lineWidth = 1.3;
  ctx.lineCap = 'round';
  for (const [u, hgt, k] of [[0.06, 0.7, 0], [0.1, 0.5, 1], [0.95, 0.6, 2]]) {
    const bx = x0 + w * u;
    ctx.beginPath();
    ctx.moveTo(bx, bot + 2);
    const sway = Math.sin(time * 1.4 + k * 1.7 + wx * 0.01) * 2.2;
    ctx.quadraticCurveTo(bx + sway, bot - (bot - top) * hgt * 0.5, bx + sway * 1.6, bot - (bot - top) * hgt);
    ctx.stroke();
  }
  // Light rippling down from the top.
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = '#ffffff';
  for (let k = 0; k < 3; k++) {
    const lx = x0 + ((time * 6 + k * w * 0.37 + wx) % (w + 20)) - 10;
    ctx.beginPath();
    ctx.moveTo(lx, top);
    ctx.lineTo(lx + 5, top);
    ctx.lineTo(lx - 3, bot);
    ctx.lineTo(lx - 7, bot);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // The fish, small to big so the big ones swim in front.
  const order = fish.map((f, i) => ({ id: f[0], cm: f[1], i })).sort((a, b) => a.cm - b.cm);
  const lanes = Math.max(1, fish.length);
  for (const f of order) {
    // (A small tank keeps its fish a little smaller, so four have room.)
    const k = Math.max(0.4, Math.min(1.15, 0.42 + 0.32 * Math.log10(Math.max(1, f.cm) / 4))) * (def.h < 60 ? 0.82 : 1);
    const size = 16 * k;
    const speed = 0.35 + ((f.i * 0.37) % 0.3);
    const ph = time * speed + f.i * 1.9 + wx * 0.003;
    const span = Math.max(4, (w - size - 6) / 2);
    const cx = x0 + w / 2 + Math.sin(ph) * span;
    const dir = Math.cos(ph) >= 0 ? 1 : -1;
    const lane = top + 4 + ((bot - top - size - 4) * ((f.i % lanes) + 0.5)) / lanes;
    const fy = lane + Math.sin(time * 1.3 + f.i * 2.3) * 1.6;
    ctx.save();
    ctx.translate(cx, fy + size / 2);
    ctx.scale(dir, 1);
    drawItemIcon(ctx, f.id, -size / 2, -size / 2, k);
    ctx.restore();
  }
  // Bubbles from the rock, rising and wobbling.
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  for (let k = 0; k < 4; k++) {
    const u = (time * 0.4 + k * 0.27 + wx * 0.001) % 1;
    const bx = x0 + w * 0.72 + Math.sin(u * 12 + k) * 1.4;
    const by = bot - 10 - u * (bot - top - 12);
    ctx.beginPath();
    ctx.arc(bx, by, 0.7 + k * 0.2, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
  // A soft glow at night, like a tank light left on.
  glow(ctx, x, top + (bot - top) / 2, def.w * 0.6, '#8fd8f0', night * 0.25);
  // The glass's shine.
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.fillRect(x0 + 3, top, 1.5, bot - top);
  ctx.fillRect(x0 + 6, top, 0.8, bot - top);
}

const riders = new Map();
// (The Mochi Garden's own pieces - the see-saw, the trees, the well... - are drawn by render/garden.js,
// which hands its drawers over here: a ghost of one while you carry it in Decorate, and its picture
// for the bar. The garden draws them where they stand itself: world/garden-layout.js.)
let builtin = null;
export const setBuiltinDrawer = (d) => {
  builtin = d;
};
// Draws one placed piece (p: { id, x, y, flip }) at screen (x, y); `ghost` draws it see-through and
// tinted (green fits, red doesn't), for Decorate mode. (`map`: the map it's on, for a garden piece.)
export function drawPiece(ctx, p, x, y, time, { night = 0, char = null, ghost = null, alpha = 1, map = null } = {}) {
  const def = FURNITURE_BY_ID[p.id];
  if (!def) return;
  if (def.builtin) {
    builtin?.draw(ctx, def, p, x, y, time, { ghost, alpha, map });
    return;
  }
  const s = pieceSprite(def);
  const wx = p.x;
  // Just set down: a little hop and settle (never a squash).
  if (p.at != null) {
    const k = (performance.now() / 1000 - p.at) / 0.4;
    if (k >= 0 && k < 1) y -= Math.abs(Math.sin(k * Math.PI * 2)) * 3 * (1 - k);
  }
  ctx.save();
  ctx.globalAlpha *= alpha;
  if (ghost) ctx.globalAlpha *= 0.62;
  // The hammock's sling and sway, behind its posts' fronts.
  if (def.id === 'sea_hammock') {
    const sw = Math.sin(time * 1.2 + wx * 0.01) * 2.4;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - def.w / 2 + 4, y - def.h + 4);
    ctx.quadraticCurveTo(x + sw, y - def.h + 30, x + def.w / 2 - 4, y - def.h + 4);
    ctx.stroke();
    ctx.strokeStyle = SKY;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x - def.w / 2 + 12, y - def.h + 12);
    ctx.quadraticCurveTo(x + sw, y - def.h + 30, x + def.w / 2 - 12, y - def.h + 12);
    ctx.stroke();
  }
  // String lights: a sagging string of little stars, twinkling.
  if (def.id === 'star_lights') {
    const top = y - def.h;
    ctx.strokeStyle = '#6a6aa8';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    for (let i = 0; i <= 16; i++) {
      const u = i / 16;
      const px = x - def.w / 2 + u * def.w;
      const py = top + 2 + Math.sin(Math.PI * u) * 9;
      if (i) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    ctx.stroke();
    for (let i = 1; i < 9; i++) {
      const u = i / 9;
      const px = x - def.w / 2 + u * def.w;
      const py = top + 4 + Math.sin(Math.PI * u) * 9;
      const tw = 0.6 + 0.4 * Math.sin(time * 3 + i * 1.7 + wx);
      glow(ctx, px, py, 7, '#fff3a6', (0.25 + night * 0.6) * tw);
      ctx.fillStyle = i % 2 ? GOLD : '#ffc2e6';
      ctx.beginPath();
      for (let k = 0; k < 10; k++) {
        const a = -Math.PI / 2 + (k * Math.PI) / 5;
        const r = k % 2 ? 1.1 : 2.6;
        ctx.lineTo(px + Math.cos(a) * r, py + Math.sin(a) * r);
      }
      ctx.fill();
    }
  }
  ctx.save();
  if (p.flip) {
    ctx.translate(x, 0);
    ctx.scale(-1, 1);
    ctx.translate(-x, 0);
  }
  place(ctx, s, x, y);
  ctx.restore();
  const top = y - def.h;
  // ----- Each piece's moving parts -----
  // ----- The Mochi Garden's pieces -----
  // The parasol's soft shade on the grass under it.
  if (def.id === 'garden_parasol') {
    ctx.fillStyle = 'rgba(70,40,90,0.12)';
    ctx.beginPath();
    ctx.ellipse(x, y - 0.5, 15, 2.2, 0, 0, TAU);
    ctx.fill();
  }
  // The fountain's water: a jet up from the spout, arching over into the top bowl, falling in a
  // sheet from its lip into the basin, rings spreading on the water, sparkles.
  if (def.id === 'garden_fountain') {
    const bx = x;
    ctx.save();
    ctx.strokeStyle = 'rgba(200,236,255,0.85)';
    ctx.lineWidth = 0.9;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(bx, top + 4);
      ctx.quadraticCurveTo(bx + s * 3, top - 3 + Math.sin(time * 6 + s) * 0.4, bx + s * 6, top + 9);
      ctx.stroke();
    }
    // (Falling from the top bowl's lip into the basin.)
    ctx.strokeStyle = 'rgba(160,215,250,0.7)';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(bx + s * 8.6, top + 10.6);
      ctx.quadraticCurveTo(bx + s * 10, top + 15, bx + s * 10.4, y - 8.4);
      ctx.stroke();
    }
    // (Drops, and rings on the water.)
    for (let i = 0; i < 6; i++) {
      const u = (time * 1.4 + i / 6 + wx * 0.01) % 1;
      const s = i % 2 ? 1 : -1;
      ctx.fillStyle = `rgba(220,245,255,${1 - u})`;
      ctx.fillRect(bx + s * (2 + u * 5), top + 2 + u * 7 - Math.sin(u * Math.PI) * 4, 0.8, 0.8);
    }
    for (let i = 0; i < 2; i++) {
      const u = (time * 0.8 + i * 0.5) % 1;
      ctx.strokeStyle = `rgba(255,255,255,${0.5 * (1 - u)})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.ellipse(bx + (i ? 10 : -10), y - 8.2, 1 + u * 4, 0.4 + u * 1.2, 0, 0, TAU);
      ctx.stroke();
    }
    const tw = (Math.sin(time * 3 + wx) + 1) / 2;
    ctx.fillStyle = `rgba(255,255,255,${0.4 + 0.6 * tw})`;
    ctx.fillRect(bx - 1, top + 7, 0.9, 0.9);
    ctx.fillRect(bx + 5, y - 9, 0.9, 0.9);
    ctx.restore();
  }
  // The bonbori and the festival lantern: lit at dusk.
  if (def.id === 'garden_bonbori' || def.id === 'garden_chochin') {
    const k = Math.min(1, night * 1.4);
    if (k > 0.02) {
      const cy = top + (def.id === 'garden_bonbori' ? 7 : 12);
      glow(ctx, x, cy, 22, def.id === 'garden_bonbori' ? '#ffc8dc' : '#ff9a6a', 0.55 * k);
      ctx.fillStyle = def.id === 'garden_bonbori' ? `rgba(255,236,244,${0.7 * k})` : `rgba(255,170,120,${0.6 * k})`;
      ctx.beginPath();
      ctx.ellipse(x, cy, def.id === 'garden_bonbori' ? 4 : 6, def.id === 'garden_bonbori' ? 4.4 : 7.4, 0, 0, TAU);
      ctx.fill();
    }
  }
  // The wind chime: its glass bell and paper strip swinging, harder in a wind.
  if (def.id === 'garden_furin') {
    const sw = Math.sin(time * 2.4 + wx) * (0.18 + WEATHER_WIND.boost * 0.4) + Math.sin(time * 5.3 + wx) * 0.06;
    const px = x - def.w / 2 + (p.flip ? 3.4 : def.w - 3.4);
    ctx.save();
    ctx.translate(px, top + 3.4);
    ctx.rotate(sw * 0.5);
    ctx.fillStyle = 'rgba(220,240,255,0.9)';
    ctx.beginPath();
    ctx.arc(0, 4, 3.4, Math.PI, TAU);
    ctx.lineTo(3.4, 5.4);
    ctx.lineTo(-3.4, 5.4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e05a3a';
    ctx.beginPath();
    ctx.arc(0, 3, 1, 0, TAU);
    ctx.fill();
    ctx.rotate(sw);
    ctx.strokeStyle = '#6a4a2a';
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    ctx.moveTo(0, 5.4);
    ctx.lineTo(0, 9);
    ctx.stroke();
    ctx.fillStyle = '#fff6d6';
    ctx.fillRect(-1.2, 9, 2.4, 8);
    ctx.fillStyle = '#5a8ad8';
    ctx.fillRect(-1.2, 11, 2.4, 0.8);
    ctx.restore();
  }
  // The snow lantern: its candle lit at dusk, glowing warm on the snow.
  if (def.id === 'garden_snowlantern') {
    const k = Math.min(1, night * 1.4);
    if (k > 0.02) {
      glow(ctx, x, top + def.h - 7, 20, '#ffc878', 0.5 * k);
      ctx.fillStyle = `rgba(255,204,106,${0.9 * k})`;
      ctx.fillRect(x - 2.2, top + def.h - 10.4, 4.4, 5.6);
    }
  }
  // The moon lantern: lit warm from inside at dusk.
  if (def.id === 'garden_moonlantern') {
    const k = Math.min(1, night * 1.4);
    if (k > 0.02) {
      glow(ctx, x, top + 9, 24, '#ffd27a', 0.55 * k);
      ctx.fillStyle = `rgba(255,226,160,${0.6 * k})`;
      ctx.beginPath();
      ctx.ellipse(x, top + 9, 6, 6.4, 0, 0, TAU);
      ctx.fill();
    }
  }
  // The stone lantern: its window lit warm at dusk, a glow round it.
  if (def.id === 'garden_lantern') {
    const k = Math.min(1, night * 1.4);
    if (k > 0.02) {
      glow(ctx, x, top + 10, 22, '#ffd27a', 0.5 * k);
      ctx.fillStyle = `rgba(255,214,140,${0.95 * k})`;
      ctx.fillRect(x - def.w / 2 + 5, top + 8.4, def.w - 10, 3.8);
    }
  }
  // The pinwheels, turning - faster in a wind.
  if (def.id === 'garden_pinwheels') {
    const spin = time * (2.4 + WEATHER_WIND.boost * 6);
    const sticks = [[6.4, 3], [13.4, 1], [20.4, 4]];
    for (const [i, [sx, sy]] of sticks.entries()) {
      const px = x - def.w / 2 + (p.flip ? def.w - sx : sx);
      const py = top + sy;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(spin * (i % 2 ? -1 : 1) + i);
      for (let b = 0; b < 4; b++) {
        ctx.rotate(Math.PI / 2);
        ctx.fillStyle = ['#ff9ec0', '#8fd3ff', '#ffe680', '#9fe0a0'][(b + i) % 4];
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(3.4, -0.4);
        ctx.lineTo(2.6, -3);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 0.6, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }
  // The statue's gold sprout catching the light now and then.
  if (def.id === 'garden_statue') {
    const g = Math.max(0, Math.sin(time * 0.9 + wx * 0.03)) ** 8;
    if (g > 0.05) {
      ctx.save();
      ctx.globalAlpha *= g;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - 0.4, top + 0.2, 0.8, 3.2);
      ctx.fillRect(x - 1.6, top + 1.4, 3.2, 0.8);
      ctx.restore();
    }
  }
  if (def.id === 'sea_lamp' || def.id === 'bake_lamp') glow(ctx, x, top + 6, 18, '#ffe08a', 0.2 + night * 0.6);
  if (def.id === 'bake_cake') {
    // Its glass dome, see-through, with a shine.
    ctx.save();
    ctx.globalAlpha *= 0.3;
    ctx.fillStyle = '#e6f6ff';
    ctx.beginPath();
    ctx.ellipse(x, y - 10, 8.6, 10, 0, Math.PI, 0);
    ctx.lineTo(x + 8.6, y - 1);
    ctx.lineTo(x - 8.6, y - 1);
    ctx.fill();
    ctx.globalAlpha /= 0.3;
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(x - 3, y - 13, 4, Math.PI * 1.1, Math.PI * 1.5);
    ctx.stroke();
    ctx.restore();
  }
  if (def.id === 'star_lamp') {
    const fx = x + (p.flip ? -1 : 1) * 5;
    glow(ctx, fx, top + 6, 22, '#e8e8ff', 0.2 + night * 0.65);
  }
  if (def.id === 'star_scope') {
    // The tube, turning slowly to follow the stars.
    const a = -0.6 + Math.sin(time * 0.15 + wx) * 0.35;
    ctx.save();
    ctx.translate(x, top + 16);
    ctx.rotate(p.flip ? -a + Math.PI : a);
    ctx.fillStyle = '#e0b060';
    ctx.fillRect(-12, -3, 24, 6);
    ctx.fillStyle = '#ffe08a';
    ctx.fillRect(-12, -3, 24, 1.6);
    ctx.fillStyle = '#a8805a';
    ctx.fillRect(10, -4, 4, 8);
    ctx.restore();
  }
  if (def.id === 'star_globe') {
    // The planet, spinning: bands drift across it under its tilted ring.
    const cx = x;
    const cy = top + 7;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, TAU);
    ctx.fillStyle = '#b48cff';
    ctx.fill();
    ctx.clip();
    for (let k = -1; k < 3; k++) {
      ctx.fillStyle = k % 2 ? '#d8c4ff' : '#8f6fe0';
      ctx.fillRect(cx - 6 + (((time * 4 + k * 5) % 12) + 12) % 12 - 6, cy - 6, 2.2, 12);
    }
    ctx.restore();
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 9, 2.6, -0.3, 0, TAU);
    ctx.stroke();
  }
  if (def.id === 'star_clock') {
    // Its hands keep the island's own time (world/daytime.js).
    const hr = gameHour(new Date());
    const cx = x;
    const cy = top + def.h / 2 + 4;
    for (const [a, len, wdt] of [[(hr / 12) * TAU, 5, 1.6], [((hr % 1) * TAU), 8, 1]]) {
      ctx.strokeStyle = '#fff3c4';
      ctx.lineWidth = wdt;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.sin(a) * len, cy - Math.cos(a) * len);
      ctx.stroke();
    }
  }
  // ----- Trophies: what you've really done -----
  if (def.show && !ghost) {
    const n = trophyNote(def, char);
    if (def.show === 'fish') {
      if (n.fish) drawItemIcon(ctx, n.fish, x - 8, top + 1, 1);
      ctx.fillStyle = '#5a3a2a';
      ctx.font = '800 3.6px Nunito, "Trebuchet MS", "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(n.text, x, y - 2.4, def.w - 8);
    } else if (def.show === 'grade') {
      ctx.fillStyle = '#8a5a1a';
      ctx.font = '800 6px Nunito, "Trebuchet MS", "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(n.text, x, top + 12);
    } else if (def.show === 'derby') {
      ctx.fillStyle = '#8a5a1a';
      ctx.font = '800 5px Nunito, "Trebuchet MS", "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(n.text, x, top + 15);
    } else if (def.show === 'crown' && n.on) {
      const bob = Math.sin(time * 1.6 + wx) * 0.6;
      ctx.fillStyle = GOLD;
      ctx.beginPath();
      ctx.moveTo(x - 7, top + 10 + bob);
      for (const [dx, dy] of [[-7, 2], [-4, 6], [0, 0], [4, 6], [7, 2], [7, 10], [-7, 10]]) ctx.lineTo(x + dx, top + dy + 4 + bob);
      ctx.fill();
      ctx.fillStyle = '#ff6b8a';
      ctx.fillRect(x - 1, top + 9 + bob, 2, 2);
      glow(ctx, x, top + 9, 10, '#fff3a6', 0.3 + 0.15 * Math.sin(time * 2 + wx));
    } else if (def.show === 'tank') {
      drawTankLife(ctx, def, n.fish, x, y, time, wx, night);
    } else if (def.show === 'mount' && n.mount) {
      let st = riders.get(p);
      if (!st) riders.set(p, (st = {}));
      ctx.save();
      ctx.translate(x, y - 3);
      ctx.scale(0.32 * (p.flip ? -1 : 1), 0.32);
      drawMount(ctx, st, n.mount, 0, 0, time, { facing: 1 });
      ctx.restore();
    }
    ctx.textAlign = 'left';
  }
  if (ghost) {
    ctx.globalCompositeOperation = 'source-atop';
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = ghost === 'ok' ? '#7fe0a0' : '#ff8aa0';
    ctx.fillRect(x - def.w / 2 - 6, y - def.h - 8, def.w + 12, def.h + 10);
  }
  ctx.restore();
}

// A piece's icon for the Decorate bar and the craft list: the piece fitted into a box.
export function drawPieceIcon(ctx, id, x, y, size, time) {
  const def = FURNITURE_BY_ID[id];
  if (!def) return;
  if (def.builtin) {
    builtin?.icon(ctx, def, x, y, size);
    return;
  }
  const k = Math.min(1.4, (size - 4) / Math.max(def.w, def.h + 4));
  ctx.save();
  ctx.translate(x + size / 2, y + size - 3);
  ctx.scale(k, k);
  drawPiece(ctx, { id, x: 0, y: 0 }, 0, 0, time, { night: 0 });
  ctx.restore();
}

// Every piece placed on this map, back to front: rugs, wall hangings, hanging things, things on
// the floor, then things on top of them. `char` is whose home it is (for the trophies).
export function drawFurniture(ctx, map, placed, cam, width, time, char) {
  if (!placed?.length) return;
  const order = { rug: 0, wall: 1, hang: 2, floor: 3, surface: 4 };
  // (Not the garden's own pieces: the garden draws those, world/garden-layout.js.)
  const list = placed.filter((p) => p.map === map.id && FURNITURE_BY_ID[p.id] && !FURNITURE_BY_ID[p.id].builtin).sort((a, b) => order[FURNITURE_BY_ID[a.id].layer] - order[FURNITURE_BY_ID[b.id].layer]);
  for (const p of list) {
    const x = p.x - cam.x;
    if (x < -80 || x > width + 80) continue;
    drawPiece(ctx, p, x, p.y - cam.y, time, { night: map.night ?? 0, char });
  }
}

// (Kept for the hammock posts and the like: mixing a colour toward white.)
export const lighten = (c, k) => mix(c, '#ffffff', k);
