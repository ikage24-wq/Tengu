// Your island's pieces (world/home.js townPieces) and your hut's room inside. Drawn like the rest
// of the scenery: outlined pastel shapes lit from the upper left, shaded by hand with the prop kit,
// and every part has a little life of its own (a bobbing skiff, a flag stirring, smoke from the
// chimney, Shelly's sign swinging, the garden's sprouts nodding). Phases come from the piece's
// place in the world, never the screen.
//
//   skiff     your little sailboat at the dock, bobbing, its sail furled and a pennant flying
//   conch     Shelly's workshop: a giant pink conch shell with a door, a round window and a
//             swinging sign, her tools on a stump outside
//   hut       your beach hut on stilts; it gains a porch, a window box, a flag and a lantern as
//             the island grows (extra: the stage)
//   garden    a garden plot in a little picket fence, sprouts nodding
//   reeds     a clump of pond reeds and cattails, swaying
//   boulders  the rocky rise's mossy boulders
//   ropebridge  planks on ropes over the shallows, sagging, swaying a little
//   islethut  a tiny shack on the islet, a hammock between it and a palm
//   terrace   the Sunset Terrace's railing, bunting and a lantern pole
//   hutroom   the hut's room inside: plank walls, a round window onto the sea, a rug, beams

import { R, E, T, F, mix, shade, snap } from './pixel.js';
import { ramp, planks, hash } from './propkit.js';
import { art, place } from './scenery.js';
import { groundAt } from '../world/physics.js';
import { drawAfloat } from './water.js';

const TAU = Math.PI * 2;
const WOOD = '#c89a6a';
const DRIFT = '#e8d2b0';

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
function smoke(ctx, x, y, time, seed) {
  ctx.save();
  for (let i = 0; i < 4; i++) {
    const k = (time * 0.32 + i / 4 + seed) % 1;
    ctx.globalAlpha = (1 - k) * 0.55;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x + Math.sin(k * 5 + seed) * 4 + k * 8, y - k * 34, 2.5 + k * 4, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}
// A pennant on a pole top, its tail stirring.
function pennant(ctx, x, y, time, len, c, seed) {
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.moveTo(x, y);
  const n = 5;
  for (let i = 1; i <= n; i++) {
    const u = i / n;
    ctx.lineTo(x + u * len, y + 2 * u + Math.sin(time * 4 + u * 3 + seed) * 1.6 * u);
  }
  for (let i = n; i >= 0; i--) {
    const u = i / n;
    ctx.lineTo(x + u * len, y + 2 * u + 5 * (1 - u) + Math.sin(time * 4 + u * 3 + seed) * 1.6 * u);
  }
  ctx.closePath();
  ctx.fill();
}

// ---------- The pieces' art ----------

function skiffArt() {
  return art('isle-skiff', 92, 60, () => {
    const hull = ramp('#ffffff', 0.7);
    const band = ramp('#5fb8d8', 0.8);
    const wood = ramp(WOOD, 0.8);
    return [
      // the hull: a white skiff with a sky-blue band and a little cabin of a bow
      T([[4, 40], [88, 40], [80, 54], [14, 54]], hull.base), F(T([[14, 54], [80, 54], [84, 47], [10, 47]], hull.sh)),
      F(R(6, 41, 80, 3, band.base)), F(R(6, 41, 80, 1, band.hi)),
      // the mast, the boom and the furled sail
      R(44, 4, 2.4, 37, wood.base), F(R(44, 4, 0.8, 37, wood.hi)),
      R(20, 34, 44, 2, wood.sh),
      T([[22, 32], [62, 32], [60, 35], [24, 35]], '#fff6ea'), F(T([[22, 34], [62, 34], [60, 35], [24, 35]], '#e8dccc')),
      // rope coils and a fender
      E(70, 38, 4, 1.6, '#e8c890'), E(14, 46, 2.6, 3.2, '#ff8a8a'), F(E(13.4, 45, 1, 1.4, '#ffc8c8')),
      // its name painted on the bow in a little heart
      F(E(76, 48, 2.2, 2, '#ff9ec0')),
    ];
  }, false);
}

function conchArt() {
  return art('isle-conch', 150, 132, () => {
    const pink = ramp('#ffc2d4', 0.75);
    const lip = ramp('#fff0e6', 0.6);
    const out = [];
    // The shell's whorls, a spiral of bulges rising to a point.
    const whorls = [[74, 92, 58, 38], [70, 58, 44, 30], [68, 32, 30, 20], [66, 14, 16, 11]];
    for (const [cx, cy, rx, ry] of whorls) out.push(E(cx, cy, rx, ry, pink.base));
    for (const [cx, cy, rx, ry] of whorls) out.push(F(E(cx + rx * 0.18, cy + ry * 0.35, rx * 0.8, ry * 0.45, pink.sh)), F(E(cx - rx * 0.35, cy - ry * 0.42, rx * 0.42, ry * 0.22, pink.hi)));
    // Spines along the whorls.
    for (const [cx, cy, rx, ry] of whorls.slice(0, 3)) for (const a of [-2.3, -1.6, -0.9]) {
      const x = cx + Math.cos(a) * rx * 0.95;
      const y = cy + Math.sin(a) * ry * 0.95;
      out.push(T([[x - 3, y + 1], [x + 3, y + 1], [x, y - 7]], pink.hi));
    }
    // The flared lip at the base, creamy and glossy.
    out.push(T([[18, 126], [130, 126], [140, 108], [118, 96], [40, 98], [10, 110]], lip.base), F(T([[18, 126], [130, 126], [128, 118], [24, 118]], lip.sh)));
    // The round door and window.
    out.push(E(60, 108, 15, 18, '#a8605a'), F(E(60, 112, 12, 15, '#7a4a52')), F(E(66, 112, 1.6, 1.6, '#ffd36b')));
    out.push(E(98, 70, 9, 9, '#fff8ea'), E(98, 70, 7, 7, '#5a4a6a'), F(E(98, 71, 6, 5, '#ffe08a')), F(E(96, 68, 2, 2, '#fff8d6')));
    return out;
  }, false);
}

const HUT_W = 136;
function hutArt(stage) {
  return art(`isle-hut|${stage}`, HUT_W, 170, () => {
    const wall = ramp('#ffe6c8', 0.7);
    const trim = ramp('#ffffff', 0.6);
    const thatch = ramp('#e8c07a', 0.85);
    const wood = ramp(WOOD, 0.8);
    const out = [];
    const H = 170;
    const floor = H - 22;
    // Stilts and the steps up.
    for (const x of [16, 52, 84, 120]) out.push(R(x, floor, 5, 22, wood.sh), F(R(x, floor, 1.6, 22, wood.base)));
    out.push(...planks(8, floor - 4, HUT_W - 16, 6, wood, 6, 3));
    // Walls of driftwood boards.
    out.push(R(16, floor - 70, HUT_W - 32, 70, wall.base));
    for (let x = 20; x < HUT_W - 18; x += 10) out.push(F(R(x, floor - 70, 1, 70, wall.sh)));
    out.push(F(R(HUT_W - 30, floor - 70, 14, 70, mix(wall.base, wall.sh, 0.6))));
    // A thatched roof with a fringe, and its chimney.
    out.push(R(96, floor - 132, 12, 30, '#d9a088'), F(R(96, floor - 132, 3, 30, '#f2c0a8')));
    out.push(T([[0, floor - 64], [HUT_W / 2, floor - 120], [HUT_W, floor - 64]], thatch.base), F(T([[HUT_W / 2, floor - 120], [HUT_W, floor - 64], [HUT_W / 2, floor - 64]], thatch.sh)), F(T([[18, floor - 72], [HUT_W / 2, floor - 112], [44, floor - 76]], thatch.hi)));
    for (let x = 2; x < HUT_W - 2; x += 6) out.push(F(R(x, floor - 66, 3.4, 5 + hash(x * 7.3) * 4, thatch.sh)));
    // The door (arched, mint) and a porthole window.
    out.push(T([[52, floor], [52, floor - 40], [58, floor - 48], [78, floor - 48], [84, floor - 40], [84, floor]], trim.base));
    out.push(T([[55, floor], [55, floor - 39], [60, floor - 45], [76, floor - 45], [81, floor - 39], [81, floor]], '#8fd8c0'), F(R(67.4, floor - 45, 1.2, 45, '#6fb8a0')), E(77, floor - 20, 1.6, 1.6, '#ffd36b'));
    out.push(E(32, floor - 40, 11, 11, trim.base), E(32, floor - 40, 8.4, 8.4, '#5a4a6a'), F(E(32, floor - 39, 7, 6, '#ffe08a')), F(E(29.5, floor - 42.5, 2.4, 2.4, '#fff8d6')));
    // As the island grows: a window box of flowers (2), a porch rail and a hanging shell chime (3),
    // a second porthole and a welcome mat (4), a star on the roof's peak (5).
    if (stage >= 2) {
      out.push(R(20, floor - 28, 24, 5, wood.base), F(R(20, floor - 28, 24, 1.4, wood.hi)));
      for (let k = 0; k < 5; k++) out.push(E(23 + k * 4.6, floor - 30, 2.2, 2.2, ['#ff9ec0', '#ffe36b', '#c9a6ff', '#ffffff', '#ff8a8a'][k]), F(E(22 + k * 4.6, floor - 29, 1.4, 1, '#6fc890')));
    }
    if (stage >= 3) {
      for (const x of [92, 104, 116]) out.push(R(x, floor - 18, 2.4, 14, '#ffffff'));
      out.push(R(88, floor - 20, 34, 2.4, '#ffffff'));
    }
    if (stage >= 4) out.push(E(100, floor - 44, 7, 7, trim.base), E(100, floor - 44, 5.2, 5.2, '#5a4a6a'), F(E(100, floor - 43.5, 4.2, 3.6, '#ffe08a')), R(56, floor - 1, 24, 2.4, '#ff9ec0'), F(R(58, floor - 1, 20, 0.8, '#ffd2e6')));
    if (stage >= 5) out.push(T([[HUT_W / 2, floor - 134], [HUT_W / 2 + 4, floor - 124], [HUT_W / 2 + 13, floor - 123], [HUT_W / 2 + 6, floor - 117], [HUT_W / 2 + 9, floor - 108], [HUT_W / 2, floor - 113], [HUT_W / 2 - 9, floor - 108], [HUT_W / 2 - 6, floor - 117], [HUT_W / 2 - 13, floor - 123], [HUT_W / 2 - 4, floor - 124]], '#ffe36b'));
    return out;
  }, false);
}

function gardenArt() {
  return art('isle-garden', 96, 34, () => {
    const soil = ramp('#b8865a', 0.8);
    const out = [R(6, 26, 84, 8, soil.base), F(R(6, 26, 84, 2, soil.hi))];
    for (let x = 10; x < 88; x += 12) out.push(F(E(x + 4, 29, 4, 1.2, soil.sh)));
    // The picket fence round it.
    for (let x = 2; x <= 92; x += 9) out.push(T([[x, 34], [x, 16], [x + 2, 13], [x + 4, 16], [x + 4, 34]], '#ffffff'));
    out.push(R(0, 20, 96, 2.4, '#ffffff'), R(0, 28, 96, 2.4, '#fff4ea'));
    return out;
  }, false);
}

function islethutArt() {
  return art('isle-islethut', 92, 96, () => {
    const wall = ramp('#c8e8ff', 0.7);
    const roof = ramp('#ff9a8a', 0.8);
    const wood = ramp(WOOD, 0.8);
    return [
      R(10, 40, 72, 56, wall.base), ...[16, 28, 40, 52, 64, 76].map((x) => F(R(x, 40, 1, 56, wall.sh))),
      T([[0, 44], [46, 8], [92, 44]], roof.base), F(T([[46, 8], [92, 44], [46, 44]], roof.sh)),
      ...[6, 18, 30, 42, 54, 66, 78].map((x) => F(R(x, 42, 4, 5, roof.sh))),
      R(34, 62, 22, 34, wood.base), F(R(34, 62, 22, 3, wood.hi)), E(52, 80, 1.4, 1.4, '#ffd36b'),
      E(70, 60, 7, 7, '#ffffff'), E(70, 60, 5, 5, '#5a4a6a'), F(E(70, 60.5, 4, 3.4, '#ffe08a')),
    ];
  }, false);
}

function terraceArt() {
  return art('isle-terrace', 240, 70, () => {
    const wood = ramp(WOOD, 0.8);
    // A boardwalk along the cliff's lip with a white railing at the front.
    const out = [...planks(2, 58, 236, 8, wood, 12, 9)];
    for (let x = 6; x < 236; x += 14) out.push(R(x, 40, 2.6, 18, '#ffffff'), F(R(x + 1.6, 40, 1, 18, '#e8dcec')));
    out.push(R(2, 38, 236, 3.4, '#ffffff'), F(R(2, 40.4, 236, 1, '#e8dcec')));
    return out;
  }, false);
}

function roomArt() {
  return art('isle-hutroom', 640, 480, () => {
    const wall = ramp('#ffe8d0', 0.6);
    const floor = ramp('#d8a878', 0.8);
    const beam = ramp('#b8865a', 0.8);
    const out = [R(0, 0, 640, 480, wall.base)];
    for (let x = 0; x < 640; x += 22) out.push(F(R(x, 0, 1.2, 300, wall.sh)), F(R(x + 6, 40 + hash(x) * 120, 6, 1, wall.hi)));
    // Wainscot and skirting.
    out.push(R(0, 250, 640, 50, mix(wall.base, '#ffc8b0', 0.35)), F(R(0, 250, 640, 3, wall.hi)), F(R(0, 296, 640, 4, beam.sh)));
    // The floor boards.
    out.push(...planks(0, 300, 640, 180, floor, 16, 21));
    // Ceiling beams.
    out.push(R(0, 0, 640, 16, beam.base), F(R(0, 14, 640, 2, beam.sh)));
    for (const x of [40, 230, 410, 600]) out.push(R(x - 6, 0, 12, 300, beam.base), F(R(x - 6, 0, 3, 300, beam.hi)), F(R(x + 3, 0, 3, 300, beam.sh)));
    // A big round window onto the sea.
    out.push(E(320, 130, 62, 62, '#ffffff'), E(320, 130, 54, 54, '#9fd8ff'), F(E(320, 150, 54, 22, '#5fb8d8')), F(E(320, 156, 54, 12, '#4fa0c8')), F(E(300, 108, 18, 8, '#e2f4ff')), F(R(318, 76, 4, 108, '#ffffff')), F(R(266, 128, 108, 4, '#ffffff')));
    // The door out, mint like the outside, with its little window and knob.
    out.push(T([[294, 300], [294, 236], [300, 226], [340, 226], [346, 236], [346, 300]], '#ffffff'));
    out.push(T([[298, 300], [298, 238], [303, 230], [337, 230], [342, 238], [342, 300]], '#8fd8c0'), F(R(319.4, 230, 1.2, 70, '#6fb8a0')), E(334, 268, 1.8, 1.8, '#ffd36b'), E(320, 246, 6, 6, '#ffffff'), F(E(320, 246, 4.4, 4.4, '#bfe8ff')));
    // The two wall shelves (the room's `shelf` ledges, y 262): boards on curly brackets.
    for (const sx of [70, 420]) {
      out.push(...planks(sx, 262, 150, 5, beam, 6, sx), F(R(sx, 262, 150, 1.2, beam.hi)));
      for (const bx of [sx + 14, sx + 136]) out.push(T([[bx - 2, 267], [bx + 2, 267], [bx + 2, 280], [bx - 8, 267]], beam.sh));
    }
    // A round rug.
    out.push(E(320, 354, 124, 16, '#ffb3cf'), F(E(320, 354, 104, 12, '#ffd2e6')), F(E(320, 354, 62, 7, '#ffb3cf')));
    return out;
  }, false);
}

// ---------- Drawing ----------

export function drawIslandPiece(ctx, map, kind, wx, extra, cam, width, time) {
  if (!map.home) return false;
  const x = wx - cam.x;
  if (x < -260 || x > width + 260) return true;
  const gy = groundAt(map, wx) - cam.y;
  switch (kind) {
    case 'skiff': {
      // Afloat at the dock at her waterline, bobbing and rocking on the swell, her reflection
      // under her (render/water.js).
      drawAfloat(ctx, x, 552 - cam.y, 50, 6, time, wx, (c) => {
        place(c, skiffArt(), 0, 6);
        pennant(c, 1.2, -48, time, 12, '#ff8a8a', wx);
      }, { bob: 1.6, roll: 0.03 });
      return true;
    }
    case 'conch': {
      place(ctx, conchArt(), snap(x), gy + 2);
      // Her sign on a post, swinging.
      const sx = x + 74;
      const sy = gy - 46;
      ctx.fillStyle = '#a8805a';
      ctx.fillRect(snap(sx - 1), snap(sy), 2, 48);
      ctx.save();
      ctx.translate(sx, sy + 2);
      ctx.rotate(Math.sin(time * 1.4 + wx) * 0.08);
      ctx.fillStyle = '#fff4e0';
      ctx.fillRect(-14, 2, 28, 13);
      ctx.strokeStyle = '#a8805a';
      ctx.strokeRect(-14, 2, 28, 13);
      ctx.fillStyle = '#d0608a';
      ctx.font = 'bold 6px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('BUILDS', 0, 11);
      ctx.restore();
      // Lamp glow in her window at night.
      if ((map.night ?? 0) > 0.2) glow(ctx, x + 23, gy - 60, 18, '#ffe08a', 0.5 * map.night);
      return true;
    }
    case 'hut': {
      const s = extra ?? 1;
      place(ctx, hutArt(s), snap(x), gy + 2);
      smoke(ctx, x + 34, gy - 140, time, wx * 0.01);
      if (s >= 3) {
        // A shell wind chime by the porch, swaying.
        for (let k = 0; k < 3; k++) {
          const sw = Math.sin(time * 2.2 + k * 0.9) * 2;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(snap(x + 26 + k * 4 + sw * 0.3), snap(gy - 44), 0.8, 8 + k * 2);
          ctx.fillStyle = ['#ffc2d4', '#fff0b0', '#c8e8ff'][k];
          ctx.beginPath();
          ctx.ellipse(x + 26 + k * 4 + sw, gy - 34 + k * 2, 1.8, 2.2, 0, 0, TAU);
          ctx.fill();
        }
      }
      if ((map.night ?? 0) > 0.2) glow(ctx, x - 36, gy - 60, 22, '#ffe08a', 0.55 * map.night);
      return true;
    }
    case 'garden': {
      place(ctx, gardenArt(), snap(x), gy + 2);
      // Sprouts nodding in the breeze.
      for (let k = 0; k < 7; k++) {
        const px = x - 40 + k * 13;
        const nod = Math.sin(time * 1.8 + k * 0.7 + wx * 0.01) * 0.25;
        ctx.save();
        ctx.translate(px, gy - 6);
        ctx.rotate(nod);
        ctx.fillStyle = '#5fbf7a';
        ctx.fillRect(-0.6, -6, 1.2, 6);
        ctx.fillStyle = k % 2 ? '#7fd88a' : '#9fe8a0';
        ctx.beginPath();
        ctx.ellipse(-2.2, -6.5, 2.4, 1.3, -0.5, 0, TAU);
        ctx.ellipse(2.2, -6.5, 2.4, 1.3, 0.5, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
      return true;
    }
    case 'reeds': {
      for (let k = 0; k < 6; k++) {
        const px = x - 8 + k * 3.4;
        const h = 18 + (k * 7) % 11;
        const sw = Math.sin(time * 1.5 + k + wx * 0.02) * 2.4;
        ctx.strokeStyle = k % 2 ? '#5faa6a' : '#7fc88a';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(px, gy + 2);
        ctx.quadraticCurveTo(px + sw * 0.3, gy - h * 0.5, px + sw, gy - h);
        ctx.stroke();
        if (k % 2 === 0) {
          ctx.fillStyle = '#a8705a';
          ctx.beginPath();
          ctx.ellipse(px + sw, gy - h - 3, 1.6, 3.6, sw * 0.05, 0, TAU);
          ctx.fill();
        }
      }
      return true;
    }
    case 'boulders': {
      const st = ramp('#c8b8a8', 0.75);
      for (const [dx, dy, r] of [[-26, -6, 14], [6, -12, 20], [34, -4, 11]]) {
        ctx.fillStyle = mix(st.sh, '#6a5a7a', 0.25);
        ctx.beginPath();
        ctx.ellipse(x + dx, gy + dy + 1, r + 1, r * 0.8 + 1, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = st.base;
        ctx.beginPath();
        ctx.ellipse(x + dx, gy + dy, r, r * 0.8, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = st.hi;
        ctx.beginPath();
        ctx.ellipse(x + dx - r * 0.3, gy + dy - r * 0.35, r * 0.4, r * 0.22, -0.3, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#8fd39a';
        ctx.beginPath();
        ctx.ellipse(x + dx + r * 0.1, gy + dy - r * 0.62, r * 0.55, r * 0.2, 0, 0, TAU);
        ctx.fill();
      }
      return true;
    }
    case 'ropebridge': {
      // Planks hung between two posts on ropes that sag in the middle, swaying a little.
      const x0 = 1630 - cam.x;
      const x1 = 1890 - cam.x;
      const y = 524 - cam.y;
      const sag = 9 + Math.sin(time * 0.9) * 1.2;
      const yAt = (u) => y + Math.sin(Math.PI * u) * sag * 0.25;
      for (const px of [x0, x1]) {
        ctx.fillStyle = '#a8805a';
        ctx.fillRect(snap(px - 2), snap(y - 26), 4, 30);
      }
      ctx.strokeStyle = '#d8b890';
      ctx.lineWidth = 1.4;
      for (const dy of [-24, -14]) {
        ctx.beginPath();
        for (let i = 0; i <= 20; i++) {
          const u = i / 20;
          const px = x0 + (x1 - x0) * u;
          const py = y + dy + Math.sin(Math.PI * u) * sag;
          if (i) ctx.lineTo(px, py);
          else ctx.moveTo(px, py);
        }
        ctx.stroke();
      }
      for (let i = 0; i < 26; i++) {
        const u = (i + 0.5) / 26;
        const px = x0 + (x1 - x0) * u;
        ctx.fillStyle = i % 2 ? '#d8a878' : '#c89a6a';
        ctx.fillRect(snap(px - 4), snap(yAt(u)), 8, 3);
        ctx.fillStyle = '#d8b890';
        ctx.fillRect(snap(px), snap(y - 14 + Math.sin(Math.PI * u) * sag), 0.8, snap(yAt(u) - (y - 14 + Math.sin(Math.PI * u) * sag)));
      }
      return true;
    }
    case 'islethut': {
      place(ctx, islethutArt(), snap(x), gy + 2);
      // A hammock slung to the palm beside it, swinging gently.
      const sw = Math.sin(time * 1.2 + wx) * 2;
      ctx.strokeStyle = '#ff9ec0';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + 44, gy - 40);
      ctx.quadraticCurveTo(x + 82 + sw, gy - 22, x + 116, gy - 40);
      ctx.stroke();
      return true;
    }
    case 'terrace': {
      place(ctx, terraceArt(), snap(x), 400 - cam.y + 10);
      // Bunting across the terrace, stirring.
      for (let k = 0; k < 12; k++) {
        const u = k / 11;
        const px = x - 110 + u * 220;
        const py = 400 - cam.y - 60 + Math.sin(Math.PI * u) * 10;
        ctx.fillStyle = ['#ff9ec0', '#ffe36b', '#8fd8ff', '#9fe0a0'][k % 4];
        ctx.beginPath();
        ctx.moveTo(px - 4, py);
        ctx.lineTo(px + 4, py);
        ctx.lineTo(px + Math.sin(time * 3 + k) * 0.8, py + 7);
        ctx.fill();
      }
      return true;
    }
    case 'hutroom':
      // (The floor runs past the bottom of the view: you walk on the hut's own boards.)
      place(ctx, roomArt(), snap(x), 480 - cam.y);
      return true;
    default:
      return false;
  }
}
