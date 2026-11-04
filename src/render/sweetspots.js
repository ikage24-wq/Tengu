// Each Sweetheart's own spot in town (data/sweethearts.js `spot`), drawn behind them like the rest
// of the scenery: outlined pastel shapes lit from the upper left, every one with a little life.
//   sw_bakery     Poppy's bakery cart: a striped awning, loaves and a cake stand, a chalkboard, a
//                 little oven puffing steam
//   sw_poetnook   Lark's nook on the cove: an upturned rowboat for a bench, a crate desk with a
//                 lantern and a stack of pages under a stone, one page fluttering
//   sw_knightpost Rowan's post: a weapon rack with his giant sword, his old helmet full of daisies,
//                 a patched training dummy
//   sw_foxshrine  Yuzu's shrine: a little red torii, a fox statue with an offering, a bell rope that
//                 sways, foxfire wisps circling
//   sw_stargaze   Celeste's corner: a brass telescope, a blanket and cushions, star charts on an easel
//   sw_drydock    Marlowe's boat up on blocks, its patched sail, a paint pot and coils of rope

import { R, E, T, F, mix } from './pixel.js';
import { ramp, planks } from './propkit.js';
import { art, place } from './scenery.js';
import { groundAt } from '../world/physics.js';

const TAU = Math.PI * 2;
const WOOD = '#c89a6a';
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

const ART = {
  sw_bakery: () => art('sw-bakery', 130, 104, () => {
    const wd = ramp(WOOD, 0.8);
    const out = [];
    // The cart: a counter on wheels.
    out.push(R(14, 58, 100, 34, '#fff4e6'), F(R(14, 58, 100, 4, '#ffffff')), F(R(14, 86, 100, 6, '#f2dcc8')), ...planks(10, 54, 108, 6, wd, 5, 4));
    out.push(E(30, 96, 7, 7, '#a8805a'), E(30, 96, 3, 3, '#ffd36b'), E(98, 96, 7, 7, '#a8805a'), E(98, 96, 3, 3, '#ffd36b'));
    // Its awning: pink and white stripes with a scalloped edge.
    for (let k = 0; k < 8; k++) out.push(T([[6 + k * 15, 14], [21 + k * 15, 14], [21 + k * 15, 24], [6 + k * 15, 24]], k % 2 ? '#ffffff' : '#ff9ec0'));
    for (let k = 0; k < 8; k++) out.push(E(13.5 + k * 15, 24, 7.5, 4, k % 2 ? '#ffffff' : '#ff9ec0'));
    out.push(R(10, 22, 3, 34, wd.sh), R(115, 22, 3, 34, wd.sh));
    // Loaves and a cake on the counter.
    for (const [x, c] of [[26, '#e0a060'], [40, '#d8904a'], [54, '#e8b070']]) out.push(E(x, 50, 6, 4, c), F(E(x - 1, 48.6, 3.4, 1.4, '#ffd8a0')), F(R(x - 3, 48.4, 6, 0.8, '#c87a3a')));
    out.push(E(90, 52, 9, 2, '#e8e0f0'), R(86, 41, 8, 9, '#fff4ea'), R(84, 46, 12, 5, '#ffc2d4'), E(90, 40, 1.8, 1.8, '#ff6b8a'));
    // The chalkboard sign.
    out.push(R(64, 32, 16, 13, '#5a4a6a'), F(R(65, 33, 14, 11, '#3a4a4a')));
    return out;
  }, false),
  sw_poetnook: () => art('sw-poetnook', 120, 60, () => {
    const boat = ramp('#7fb8d8', 0.8);
    const wd = ramp(WOOD, 0.8);
    return [
      // The upturned rowboat, a bench.
      T([[4, 58], [8, 46], [20, 40], [64, 40], [74, 46], [76, 58]], boat.base), F(T([[4, 58], [76, 58], [74, 52], [6, 52]], boat.sh)), ...[20, 36, 52].map((x) => F(R(x, 41, 1, 16, boat.hi))),
      // The crate desk with its lantern and pages.
      R(84, 34, 30, 24, wd.base), F(R(84, 34, 30, 3, wd.hi)), F(R(84, 45, 30, 1, wd.sh)), F(R(98, 34, 1, 24, wd.sh)),
      R(88, 30, 14, 4, '#fffaf0'), F(R(88, 31, 14, 0.6, '#d8d0e0')), E(95, 29, 3, 2, '#a8a0b0'),
      R(106, 18, 6, 2, '#6a5a7a'), R(107, 20, 4, 9, '#ffd27a'), F(R(107.5, 21, 3, 7, '#fff3c4')), R(106, 29, 6, 2, '#6a5a7a'),
    ];
  }, false),
  sw_knightpost: () => art('sw-knightpost', 120, 90, () => {
    const wd = ramp(WOOD, 0.8);
    const st = ramp('#dfe6f2', 0.75);
    return [
      // The weapon rack and his giant sword.
      R(6, 40, 4, 50, wd.sh), R(46, 40, 4, 50, wd.sh), R(4, 50, 48, 4, wd.base), R(4, 74, 48, 4, wd.base),
      T([[24, 2], [32, 2], [33, 70], [23, 70]], st.base), F(T([[24, 2], [28, 2], [28, 70], [23, 70]], st.hi)), T([[16, 70], [40, 70], [40, 74], [16, 74]], '#c8902a'), R(25, 74, 6, 14, '#7a5a3a'), E(28, 89, 4, 2.6, '#c8902a'),
      // His old helmet, full of daisies, on a stump.
      R(62, 74, 20, 16, wd.base), F(R(62, 74, 20, 3, wd.hi)), E(72, 68, 11, 8, st.base), F(E(68, 64, 4, 2, '#ffffff')), R(64, 70, 16, 3, st.sh),
      ...[[66, 58], [72, 55], [78, 58], [70, 62], [76, 62]].flatMap(([x, y]) => [E(x, y, 2.6, 2.6, '#ffffff'), F(E(x, y, 1, 1, '#ffd36b'))]),
      // A patched training dummy.
      R(98, 50, 4, 40, wd.sh), E(100, 46, 10, 12, '#e8c890'), F(R(94, 42, 6, 5, '#ff9ec0')), E(100, 30, 7, 7, '#e8c890'), R(90, 52, 20, 3, wd.base),
    ];
  }, false),
  sw_foxshrine: () => art('sw-foxshrine', 110, 90, () => {
    const red = ramp('#e5485f', 0.8);
    return [
      // The little torii.
      R(12, 22, 5, 68, red.base), R(63, 22, 5, 68, red.base), T([[2, 12], [78, 12], [74, 20], [6, 20]], red.base), F(T([[2, 12], [78, 12], [77, 15], [3, 15]], red.hi)), R(8, 28, 64, 4, red.base), R(38, 20, 4, 8, red.sh), R(2, 10, 76, 3, '#3a2d4f'),
      // The fox statue on a plinth, an offering of a plum.
      R(84, 72, 22, 18, '#c8c0d0'), F(R(84, 72, 22, 3, '#e8e0f0')), E(95, 62, 8, 9, '#f2eef6'), T([[89, 55], [91, 47], [94, 54]], '#f2eef6'), T([[96, 54], [99, 47], [101, 55]], '#f2eef6'), F(E(95, 66, 4, 2, '#e5485f')), E(90, 76, 3, 3, '#b86aa8'),
    ];
  }, false),
  sw_stargaze: () => art('sw-stargaze', 130, 70, () => {
    const br = ramp('#e0b060', 0.8);
    return [
      // The blanket and cushions.
      T([[8, 66], [70, 66], [76, 70], [2, 70]], '#5f5fb8'), ...[14, 30, 46, 62].map((x) => F(E(x, 68, 2, 1, '#ffe36b'))), E(18, 62, 7, 4, '#c9b6ff'), E(32, 63, 6, 3.4, '#ffd2e6'),
      // The telescope on its tripod, pointing up.
      T([[96, 34], [84, 70], [87, 70]], '#8a6a4a'), T([[96, 34], [108, 70], [105, 70]], '#8a6a4a'), T([[95, 34], [97, 34], [97, 70], [95, 70]], '#a8805a'),
      // The star chart easel.
      T([[112, 66], [118, 20], [120, 20], [116, 66]], '#a8805a'), T([[126, 66], [120, 20], [122, 20], [130, 66]], '#a8805a'), R(108, 22, 22, 22, '#2f2f68'), F(R(109, 23, 20, 20, '#3f3f88')),
    ];
  }, false),
  sw_drydock: () => art('sw-drydock', 140, 70, () => {
    const hull = ramp('#ff8a8a', 0.8);
    const wd = ramp(WOOD, 0.8);
    return [
      // Blocks, the hull up on them, a stripe and a patch.
      R(26, 58, 16, 12, wd.sh), R(96, 58, 16, 12, wd.sh),
      T([[12, 40], [128, 40], [116, 58], [24, 58]], hull.base), F(T([[24, 58], [116, 58], [120, 52], [20, 52]], hull.sh)), F(R(14, 42, 112, 3, '#ffffff')), R(60, 46, 10, 7, '#f2d29c'), F(R(61, 47, 8, 0.6, '#a8805a')),
      // The mast and a patched sail, furled.
      R(68, 2, 3, 38, wd.base), T([[71, 4], [71, 36], [100, 36]], '#fff6ea'), F(R(80, 22, 7, 6, '#9fd8ff')),
      // Paint pot and a coil of rope.
      R(4, 60, 10, 10, '#5fb8d8'), F(R(4, 60, 10, 2, '#9fe0ff')), E(130, 66, 8, 3, '#e8c890'), F(E(130, 65, 5, 1.6, '#c8a070')),
    ];
  }, false),
};

export function drawSweetSpot(ctx, map, kind, wx, extra, cam, width, time) {
  const make = ART[kind];
  if (!make) return false;
  const x = wx - cam.x;
  if (x < -160 || x > width + 160) return true;
  const gy = groundAt(map, wx) - cam.y;
  const s = make();
  place(ctx, s, Math.round(x), Math.round(gy + 2));
  const left = x - s.w / 2;
  const top = gy + 2 - s.h;
  const night = map.night ?? 0;
  switch (kind) {
    case 'sw_bakery': {
      // Steam off the warm loaves, and the chalkboard's words.
      for (let i = 0; i < 3; i++) {
        const k = (time * 0.4 + i / 3 + wx * 0.01) % 1;
        ctx.save();
        ctx.globalAlpha = (1 - k) * 0.5;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(left + 40 + Math.sin(k * 6 + i) * 3, top + 46 - k * 26, 2 + k * 3, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 4.5px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('FRESH!', left + 72, top + 39);
      ctx.textAlign = 'left';
      return true;
    }
    case 'sw_poetnook': {
      // The lantern's glow; the top page fluttering under its stone.
      glow(ctx, left + 109, top + 25, 16, '#ffe08a', 0.25 + night * 0.5);
      ctx.save();
      ctx.translate(left + 102, top + 30);
      ctx.rotate(-0.3 - Math.abs(Math.sin(time * 2.6 + wx)) * 0.5);
      ctx.fillStyle = '#fffaf0';
      ctx.fillRect(0, -1, 9, 2);
      ctx.restore();
      return true;
    }
    case 'sw_knightpost': {
      // The daisies nod.
      return true;
    }
    case 'sw_foxshrine': {
      // The bell rope swaying, and foxfire wisps circling the statue.
      const sw = Math.sin(time * 1.6 + wx) * 3;
      ctx.strokeStyle = '#ff8a5a';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(left + 40, top + 32);
      ctx.quadraticCurveTo(left + 40 + sw * 0.5, top + 48, left + 40 + sw, top + 60);
      ctx.stroke();
      ctx.fillStyle = '#ffd36b';
      ctx.beginPath();
      ctx.arc(left + 40 + sw, top + 62, 3, 0, TAU);
      ctx.fill();
      for (let i = 0; i < 3; i++) {
        const a = time * 1.4 + (i * TAU) / 3;
        const fx = left + 95 + Math.cos(a) * 16;
        const fy = top + 56 + Math.sin(a) * 6;
        glow(ctx, fx, fy, 7, '#8fc8ff', 0.4 + night * 0.4);
        ctx.fillStyle = '#c8e8ff';
        ctx.beginPath();
        ctx.arc(fx, fy, 1.6, 0, TAU);
        ctx.fill();
      }
      return true;
    }
    case 'sw_stargaze': {
      // The telescope turning slowly to follow the stars; the chart's stars twinkling.
      const a = -0.9 + Math.sin(time * 0.12 + wx) * 0.25;
      ctx.save();
      ctx.translate(left + 96, top + 34);
      ctx.rotate(a);
      ctx.fillStyle = '#e0b060';
      ctx.fillRect(-14, -3.4, 28, 6.8);
      ctx.fillStyle = '#ffe08a';
      ctx.fillRect(-14, -3.4, 28, 1.8);
      ctx.restore();
      for (let i = 0; i < 5; i++) {
        const tw = 0.5 + 0.5 * Math.sin(time * 3 + i * 1.7);
        ctx.fillStyle = `rgba(255,236,150,${0.5 + tw * 0.5})`;
        ctx.fillRect(left + 111 + ((i * 7) % 16), top + 26 + ((i * 5) % 14), 1.6, 1.6);
      }
      return true;
    }
    case 'sw_drydock': return true;
    default: return true;
  }
}
