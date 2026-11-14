// The Mochi Garden's own valley (the garden redraw, 2026-11-14): Moonmortar Garden drawn as a
// terraced mochi farm in early summer, instead of the stock pale hills and pastel town that every
// town map shares.
//
// The garden is one long map, not four, so the far side of the valley is painted as ONE panorama
// that changes along its length rather than four backdrops that would snap at the zone edges:
// terraced slopes opposite the square, cedar woods over the orchard, the hillside dropping to the
// water at the pond, and ridge beyond ridge past the cliff.
//
// Plugged into the scenery painter the way the courses are (render/courseart.js): the garden's
// `look.skyline` is 'course:moonmortar' and its `look.painted` is null, or the town theme paints
// its own far plane over this one.
//
// WHERE THE PLANES ACTUALLY SIT, measured rather than guessed (a probe backdrop + tools/map-shot):
// with the ground line on screen at y 216, the far plane's baseline comes in at about 147 at the
// square and 159 up on the cliff, and the middle plane's at 194 at the square but 218 on the cliff
// - below the ground there. Two bands of haze are laid over the far plane afterwards (one at its
// foot, one along the ground line), so the far plane can only carry a horizon: ridges, a hint of
// terracing on the crest, cedars. Everything that has to READ - the terrace steps, the water in
// them, the drying racks, the pond's far bank - belongs in the middle plane, built upward from its
// baseline and never more than about 55 tall. On the cliff that baseline is under the ground, so
// up there the middle distance is valley mist drawn upward instead, which is what high up looks
// like.

import { BACKDROPS } from './scenery.js';
import { GROUND_ART } from './terrain.js';
import { WATER_BED, WATER_LIFE, swell } from './water.js';
import { groundAt } from '../world/physics.js';
import { hash } from './propkit.js';

const FAR_F = 0.2;
const MID_F = 0.45;
const FAR_AT = (wx) => wx * FAR_F;
const MID_AT = (wx) => wx * MID_F;

// Early summer in a worked valley: hazy blue-green distance, young rice over wet mud, cedar
// windbreaks nearly black-green, straw and cut wood warm against all of it.
const C = {
  ridgeBack: '#a8c4cc',
  ridge: '#8fb0a4',
  crest: '#7da284',
  crestLit: '#9ec29a',
  cedarFar: '#5f8a70',
  paddy: '#75a44c',
  paddyLit: '#9cc46a',
  paddyWet: '#6fa8ae',
  paddyWetLit: '#a2d2d6',
  bank: '#56844c',
  bankLit: '#76a464',
  stone: '#a29783',
  stoneLit: '#c4b9a2',
  stoneDark: '#847a68',
  wood: '#7a6448',
  straw: '#d9bc78',
  strawLit: '#f0d79a',
  cedar: '#3f6a54',
  cedarLit: '#5c8a68',
  leaf: '#5f8f5e',
  leafLit: '#7fae72',
  mist: '#dceaf0',
  mistLit: '#f0f8fa',
  wall: '#ece3cc',
  roof: '#6b6456',
};

const fillPath = (ctx, color, pts) => {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fill();
};

// A cedar: a narrow dark cone with its light side a shade up.
function cedar(ctx, x, base, h, w, c = C.cedar, lit = C.cedarLit) {
  fillPath(ctx, c, [[x - w, base], [x, base - h], [x + w, base]]);
  fillPath(ctx, lit, [[x - w, base], [x, base - h], [x - w * 0.22, base]]);
}

// A round tree, for orchard rows and the pond's far bank.
function roundTree(ctx, x, base, r, c, lit) {
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.ellipse(x, base - r * 0.85, r, r * 0.92, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = lit;
  ctx.beginPath();
  ctx.ellipse(x - r * 0.32, base - r * 1.12, r * 0.52, r * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
}

// ---------- The far side of the valley ----------
// Horizon only: three ridges, the nearest one terraced along its crest, cedars standing on it.
function far(ctx, t, cam, width, y0, time) {
  const off = cam.x * FAR_F;
  const X = (planeX) => planeX - off;
  const bottom = y0 + 60;

  const wave = (x, a, f, p) => Math.sin(x * f + p) * a + Math.sin(x * f * 2.4 + p * 1.7) * a * 0.3;
  const band = (color, dy, a, f, p) => {
    const pts = [];
    for (let px = -80; px <= 1320; px += 12) pts.push([X(px), y0 + dy + wave(px, a, f, p)]);
    pts.push([X(1320), bottom], [X(-80), bottom]);
    fillPath(ctx, color, pts);
    return (px) => y0 + dy + wave(px, a, f, p);
  };
  band(C.ridgeBack, -30, 12, 0.0105, 1.9);
  band(C.ridge, -14, 9, 0.0082, 0.5);
  // The valley's own far side: high opposite the square, dipping over the water, rising past it.
  const crest = (px) => y0 + 2 - 22 * Math.exp(-((px - 130) ** 2) / 30000) + 16 * Math.exp(-((px - 500) ** 2) / 16000)
    - 14 * Math.exp(-((px - 860) ** 2) / 60000) + Math.sin(px * 0.019) * 2;
  const pts = [];
  for (let px = -80; px <= 1320; px += 10) pts.push([X(px), crest(px)]);
  pts.push([X(1320), bottom], [X(-80), bottom]);
  fillPath(ctx, C.crest, pts);
  const lit = [];
  for (let px = -80; px <= 1320; px += 10) lit.push([X(px), crest(px)]);
  for (let px = 1320; px >= -80; px -= 10) lit.push([X(px), crest(px) + 4.5]);
  fillPath(ctx, C.crestLit, lit);
  // A hint of terracing on it: four pale steps opposite the square and the orchard, no deeper than
  // the haze will let anything show.
  for (let i = 0; i < 4; i++) {
    const x0 = FAR_AT(-200) + i * 10;
    const x1 = FAR_AT(1700) - i * 30;
    const y = i * 4.6 + 5;
    const step = [];
    for (let px = x0; px <= x1; px += 14) step.push([X(px), crest(px) + y]);
    for (let px = x1; px >= x0; px -= 14) step.push([X(px), crest(px) + y + 3.2]);
    fillPath(ctx, i % 2 ? C.paddyWetLit : C.paddyLit, step);
  }
  // Cedars along the crest, thinning where the hillside goes down to the water.
  for (let i = 0; i < 52; i++) {
    const px = -70 + i * 27 + hash(i * 3.1) * 14;
    if (Math.abs(px - 505) < 64 && hash(i * 7.7) < 0.7) continue;
    const h = 8 + hash(i * 5.3) * 8;
    cedar(ctx, X(px), crest(px) + 1.5, h, h * 0.26, C.cedarFar, C.crestLit);
  }
  return true;
}

// ---------- The middle distance ----------
// Anchored to the valley, so each stretch has its own: the near lip of the terraces behind the
// square, a windbreak and fruit rows behind the orchard, the pond's far bank behind the water,
// and valley mist over the cliff.
// Runs `draw` with the screen clipped to the stretch of valley between wx0 and wx1, handing it
// that window's left and right edge on screen. Nothing it draws can stray into the next zone.
function band(ctx, cam, width, wx0, wx1, draw) {
  const a = wx0 - cam.x;
  const b = wx1 - cam.x;
  if (b < -2 || a > width + 2) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(a, -400, b - a, 2000);
  ctx.clip();
  draw(a, b);
  ctx.restore();
}

function mid(ctx, t, cam, width, y0, time) {
  const off = cam.x * MID_F;
  const X = (planeX) => planeX - off;
  const seen = (wx0, wx1) => X(MID_AT(wx1)) > -90 && X(MID_AT(wx0)) < width + 90;
  void seen;

  // Behind the square: two flooded terrace steps and the dry stone wall holding them up, with
  // straw drying racks standing along the top one.
  band(ctx, cam, width, -600, 1430, (bx0, bx1) => {
    const x0 = bx0 - 40;
    const x1 = bx1 + 40;
    const tilt = (x) => ((x - x0) / Math.max(1, x1 - x0)) * -7;
    for (let s = 0; s < 2; s++) {
      const y = y0 - 24 + s * 13;
      fillPath(ctx, s ? C.paddy : C.paddyLit, [[x0, y + tilt(x0)], [x1, y + tilt(x1)], [x1, y + 9 + tilt(x1)], [x0, y + 9 + tilt(x0)]]);
      fillPath(ctx, s ? C.paddyWet : C.paddyWetLit, [[x0, y + 6 + tilt(x0)], [x1, y + 6 + tilt(x1)], [x1, y + 9 + tilt(x1)], [x0, y + 9 + tilt(x0)]]);
      fillPath(ctx, C.bank, [[x0, y + 9 + tilt(x0)], [x1, y + 9 + tilt(x1)], [x1, y + 13 + tilt(x1)], [x0, y + 13 + tilt(x0)]]);
      fillPath(ctx, C.bankLit, [[x0, y + 9 + tilt(x0)], [x1, y + 9 + tilt(x1)], [x1, y + 10.6 + tilt(x1)], [x0, y + 10.6 + tilt(x0)]]);
      // Rice standing in the water: short ticks along the step.
      ctx.fillStyle = s ? '#79a654' : '#9cc46e';
      for (let i = 0; i < 90; i++) {
        const px = MID_AT(-500) + i * 11;
        const sx = X(px);
        if (sx < -10 || sx > width + 10) continue;
        ctx.fillRect(sx, y + 2.5 + tilt(sx) + (i % 2), 1.1, 4.5);
      }
    }
    // The wall under it all, down to the ground line.
    const wy = y0 + 2;
    fillPath(ctx, C.stone, [[x0, wy + tilt(x0)], [x1, wy + tilt(x1)], [x1, y0 + 120], [x0, y0 + 120]]);
    for (let i = 0; i < 70; i++) {
      const px = MID_AT(-500) + i * 15 + hash(i * 2.3) * 5;
      const sx = X(px);
      if (sx < -16 || sx > width + 16) continue;
      ctx.fillStyle = i % 3 ? C.stoneLit : C.stoneDark;
      ctx.beginPath();
      ctx.ellipse(sx, wy + 4 + tilt(sx) + (i % 3) * 4.6, 6.2, 2.8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Straw drying racks: two posts, three laden rails, leaning with the terrace.
    for (let r = 0; r < 7; r++) {
      const px = MID_AT(-240) + r * MID_AT(300);
      const sx = X(px);
      if (sx < -40 || sx > width + 40) continue;
      const by = y0 - 26 + tilt(sx);
      ctx.fillStyle = C.wood;
      ctx.fillRect(sx - 14, by - 16, 2, 16);
      ctx.fillRect(sx + 12, by - 16, 2, 16);
      for (let k = 0; k < 3; k++) {
        ctx.fillStyle = k === 1 ? C.straw : C.strawLit;
        ctx.fillRect(sx - 15, by - 14.5 + k * 4.6, 30, 3.6);
      }
    }
  });

  // Behind the orchard: a cedar windbreak with fruit rows in front of it.
  band(ctx, cam, width, 1330, 2130, (bx0, bx1) => {
    for (let i = 0; i < 30; i++) {
      const sx = bx0 - 30 + i * 30;
      if (sx > bx1 + 30) break;
      cedar(ctx, sx, y0 + 6 - (i % 2) * 2, 26 + hash(i * 4.1) * 9, 7);
    }
    for (let i = 0; i < 26; i++) {
      const sx = bx0 - 10 + i * 36;
      if (sx > bx1 + 30) break;
      roundTree(ctx, sx, y0 + 10 + (i % 2) * 3, 8.5, C.leaf, C.leafLit);
    }
  });

  // Behind the pond: the far bank, low and wooded, reeds along its waterline.
  band(ctx, cam, width, 2080, 2640, (bx0, bx1) => {
    const x0 = bx0 - 20;
    const x1 = bx1 + 20;
    fillPath(ctx, '#5f8f64', [[x0, y0 - 2], [x1, y0 + 6], [x1, y0 + 120], [x0, y0 + 120]]);
    fillPath(ctx, '#7faa76', [[x0, y0 - 2], [x1, y0 + 6], [x1, y0 + 11], [x0, y0 + 3]]);
    for (let i = 0; i < 50; i++) {
      const sx = x0 + i * 14;
      if (sx > x1) break;
      roundTree(ctx, sx, y0 - 2 + (i % 3) * 3, 6.5 + hash(i * 6.1) * 3, '#4a7a58', '#689a66');
    }
    ctx.fillStyle = '#9ab878';
    for (let i = 0; i < 110; i++) {
      const sx = x0 + i * 6;
      if (sx > x1) break;
      ctx.fillRect(sx, y0 + 6 + (i % 3), 1.1, 6 + (i % 4) * 2);
    }
  });

  // Over the cliff: you are above the valley, so the middle distance is mist with ridge tops
  // standing out of it - drawn upward from the baseline, never below it.
  band(ctx, cam, width, 2600, 3300, (bx0, bx1) => {
    for (let i = 0; i < 24; i++) {
      const sx = bx0 - 40 + i * 42;
      if (sx > bx1 + 40) break;
      fillPath(ctx, i % 2 ? '#93b1ac' : '#7fa29e', [[sx - 40, y0 - 4], [sx - 11, y0 - 24 - hash(i * 3.7) * 12], [sx + 15, y0 - 6]]);
    }
    const cloud = (color, step, lift, rx, ry, speed, phase) => {
      ctx.fillStyle = color;
      for (let i = 0; i < 40; i++) {
        const sx = bx0 - 60 + i * step + Math.sin(time * speed + i * phase) * 6;
        if (sx > bx1 + 60) break;
        ctx.beginPath();
        ctx.ellipse(sx, y0 + lift + (i % 3) * 4, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    cloud(C.mist, 36, -7, 32, 7, 0.06, 1);
    cloud(C.mistLit, 50, 1, 38, 6, 0.045, 1.7);
  });
  void X;
  return true;
}

BACKDROPS.push({
  far: (ctx, t, cam, width, y0, time) => (t.skyline === 'course:moonmortar' ? far(ctx, t, cam, width, y0, time) : false),
  mid: (ctx, t, cam, width, y0, time) => (t.skyline === 'course:moonmortar' ? mid(ctx, t, cam, width, y0, time) : false),
});

// ---------- The valley's own ground ----------
// Painted rather than tinted: the stock loam is covered over and the whole cross-section is this
// valley's, because half the screen is ground and a flat brown wall with a few scratches across it
// was the worst thing about the garden.
//
// Five beds, each one a different stuff and each reading differently at a glance: dark humus under
// the turf with the grass's own roots hanging into it, worked loam with the spade's marks still in
// it and straw turned under, the wet grey clay a paddy valley sits on, a bed of river gravel, and
// the bedrock the whole valley rests on, cracked and holding its boulders. Every seam between them
// is a dark line with a lit one under it, so it reads as two beds meeting rather than a scratch.
//
// Cut into the top of it, and running the whole way from the square down to the pond, the
// irrigation channel - the one thread of water that ties the valley together. It follows the land,
// so it steps down the slope into the orchard and ends where the pond begins.
// (The camera shows about 140 of ground below the grass, so all five beds have to live in that.)
const BEDS = [
  { to: 19, c: '#49362a', lit: '#5e4634', f: 0.021, amp: 1.8 },
  { to: 50, c: '#7a5a3e', lit: '#97724c', f: 0.013, amp: 2.8 },
  { to: 86, c: '#6c6350', lit: '#867c64', f: 0.0095, amp: 3.4 },
  { to: 124, c: '#7d7568', lit: '#968e7f', f: 0.0072, amp: 4 },
  { to: 999, c: '#59585e', lit: '#6e6d75', f: 0.0055, amp: 4.6 },
];
const TURF = 5;
// Where the channel runs, in world x, and how deep under the grass it is cut.
const DITCH = [-200, 2176];
const DITCH_TOP = 6;
const DITCH_BOT = 32;

const topOf = (runs) => (sx) => {
  for (const pts of runs) {
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1];
      const [bx, by] = pts[i];
      if (sx >= ax && sx <= bx) return ay + ((by - ay) * (sx - ax)) / (bx - ax || 1);
    }
  }
  return null;
};

// One buried farm thing, lying however it fell.
function buried(ctx, kind, x, y, seed) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((hash(seed * 3.3) - 0.5) * 0.8);
  const ink = '#3f2f22';
  ctx.lineWidth = 0.9;
  ctx.strokeStyle = ink;
  const blob = (bx, by, rx, ry, c) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.ellipse(bx, by, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  };
  if (kind === 0) {
    ctx.fillStyle = '#b07a58';
    ctx.beginPath();
    ctx.moveTo(-5, -3.6);
    ctx.lineTo(5, -3.6);
    ctx.lineTo(3.4, 4);
    ctx.lineTo(-3.4, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#c99a72';
    ctx.fillRect(-5.6, -4.6, 11.2, 1.6);
    ctx.strokeRect(-5.6, -4.6, 11.2, 1.6);
  } else if (kind === 1) {
    ctx.fillStyle = '#9aa2aa';
    ctx.beginPath();
    ctx.moveTo(-4.5, -2.4);
    ctx.quadraticCurveTo(0, -4.4, 4, -1);
    ctx.quadraticCurveTo(0, 3.6, -4.5, 1.4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#8a6448';
    ctx.fillRect(-9.5, -1.6, 5.4, 2.6);
    ctx.strokeRect(-9.5, -1.6, 5.4, 2.6);
  } else if (kind === 2) {
    ctx.fillStyle = '#d2b579';
    for (let i = 0; i < 6; i++) {
      ctx.save();
      ctx.rotate((i - 2.5) * 0.16);
      ctx.fillRect(-7, -0.6 - i * 0.2, 14, 1.1);
      ctx.restore();
    }
    ctx.strokeStyle = '#8a6a44';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-1, -3);
    ctx.lineTo(-1, 3);
    ctx.stroke();
  } else if (kind === 3) {
    ctx.strokeStyle = '#7fa860';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.lineTo(0, -2.6);
    ctx.stroke();
    blob(-2.4, -3.4, 2.6, 1.6, '#8fc47a');
    blob(2.4, -4.2, 2.6, 1.6, '#a8d88e');
  } else if (kind === 4) {
    ctx.fillStyle = '#b08a60';
    ctx.beginPath();
    ctx.moveTo(-4.4, -3.4);
    ctx.lineTo(4.4, -3.4);
    ctx.lineTo(3.2, 3.6);
    ctx.lineTo(-3.2, 3.6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#8a98a4';
    ctx.beginPath();
    ctx.moveTo(-4.1, -1.4);
    ctx.lineTo(4.1, -1.4);
    ctx.moveTo(-3.7, 1.4);
    ctx.lineTo(3.7, 1.4);
    ctx.stroke();
  } else {
    blob(0, 0, 5.2, 3.4, '#9a958c');
    ctx.fillStyle = '#b8b3a8';
    ctx.beginPath();
    ctx.ellipse(-1.6, -1.2, 2.4, 1.2, -0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// Past the pond the cliff's own earth wall (mg_earthwall) is the cross-section, drawn before this
// is, so the beds stop short of it rather than burying it.
const BEDS_END = 2640;

function gardenGround(ctx, m, runs, cam, width, height, time, map) {
  if (map.look?.groundArt !== 'moonmortar') return;
  const topAt = topOf(runs);
  const edge = BEDS_END - cam.x;
  if (edge < -10) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(-20, -600, edge + 20, 4000);
  ctx.clip();
  for (const pts of runs) {
    const x0 = Math.max(-8, pts[0][0]);
    const x1 = Math.min(width + 8, pts[pts.length - 1][0]);
    if (x1 <= x0) continue;
    const xs = [];
    for (let x = x0; x < x1; x += 5) xs.push(x);
    xs.push(x1);
    const seam = (bed, x) => topAt(x) + bed.to + Math.sin((x + cam.x) * bed.f) * bed.amp + Math.sin((x + cam.x) * bed.f * 2.7 + 1.3) * bed.amp * 0.35;
    // The beds themselves, each filled from the seam above it down past the bottom of the screen.
    let upper = xs.map((x) => [x, topAt(x) + TURF]);
    for (const bed of BEDS) {
      const lower = bed.to > 900 ? xs.map((x) => [x, height + 20]) : xs.map((x) => [x, seam(bed, x)]);
      ctx.fillStyle = bed.c;
      ctx.beginPath();
      upper.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      for (let i = lower.length - 1; i >= 0; i--) ctx.lineTo(lower[i][0], lower[i][1]);
      ctx.closePath();
      ctx.fill();
      // The lit skin along the top of the bed, so the seam reads as two beds meeting.
      ctx.fillStyle = bed.lit;
      ctx.beginPath();
      upper.forEach(([x, y], i) => (i ? ctx.lineTo(x, y + 1.2) : ctx.moveTo(x, y + 1.2)));
      for (let i = upper.length - 1; i >= 0; i--) ctx.lineTo(upper[i][0], upper[i][1] + 4.4);
      ctx.closePath();
      ctx.fill();
      upper = lower;
    }
    // ---- What is in each bed ----
    const inRun = (sx) => sx >= x0 && sx <= x1;
    // Humus: the grass's own roots hanging down into it, and crumbs of leaf mould.
    ctx.fillStyle = '#3a2a1e';
    for (let c = Math.floor((cam.x + x0) / 7); c * 7 < cam.x + x1; c++) {
      const sx = c * 7 + hash(c * 2.1) * 6 - cam.x;
      if (!inRun(sx)) continue;
      const top = topAt(sx);
      if (top == null) continue;
      const len = 3 + hash(c * 5.7) * 9;
      ctx.fillRect(sx, top + TURF + 1, 0.9, len);
      if (hash(c * 9.1) > 0.7) ctx.fillRect(sx + 1.4, top + TURF + 1, 0.7, len * 0.6);
    }
    // Worked loam: the spade's diagonal marks, straw turned under, a seed here and there.
    for (let c = Math.floor((cam.x + x0) / 13); c * 13 < cam.x + x1; c++) {
      const sx = c * 13 + hash(c * 3.3) * 11 - cam.x;
      if (!inRun(sx)) continue;
      const top = topAt(sx);
      if (top == null) continue;
      const h = hash(c * 1.9);
      const y = top + 23 + hash(c * 7.3) * 24;
      if (h > 0.55) {
        ctx.save();
        ctx.translate(sx, y);
        ctx.rotate(0.5 + hash(c * 4.1) * 0.5);
        ctx.fillStyle = '#6a4c33';
        ctx.fillRect(-5, -0.7, 10, 1.4);
        ctx.fillStyle = '#9a7652';
        ctx.fillRect(-5, -1.6, 10, 0.9);
        ctx.restore();
      } else if (h > 0.26) {
        ctx.save();
        ctx.translate(sx, y);
        ctx.rotate(hash(c * 8.7) * Math.PI);
        ctx.fillStyle = h > 0.42 ? '#e0c489' : '#c9a86e';
        ctx.fillRect(-3.2, -0.5, 6.4, 1);
        ctx.restore();
      } else {
        ctx.fillStyle = '#4f3a28';
        ctx.beginPath();
        ctx.ellipse(sx, y, 1.5, 1.1, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Wet clay: smooth, mottled, with a few rounded stones pressed into it.
    for (let c = Math.floor((cam.x + x0) / 26); c * 26 < cam.x + x1; c++) {
      const sx = c * 26 + hash(c * 6.1) * 22 - cam.x;
      if (!inRun(sx)) continue;
      const top = topAt(sx);
      if (top == null) continue;
      const y = top + 55 + hash(c * 2.7) * 27;
      if (hash(c * 4.9) > 0.45) {
        ctx.fillStyle = '#7d7462';
        ctx.beginPath();
        ctx.ellipse(sx, y, 7 + hash(c * 3.1) * 5, 3 + hash(c * 5.5) * 2, hash(c) - 0.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#93908a';
        ctx.beginPath();
        ctx.ellipse(sx, y, 3.4 + hash(c * 7.7) * 2, 2.4 + hash(c * 2.3), 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#aba79e';
        ctx.beginPath();
        ctx.ellipse(sx - 0.9, y - 0.8, 1.6, 0.9, -0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // River gravel: packed small stones, lying in rough courses.
    for (let c = Math.floor((cam.x + x0) / 9); c * 9 < cam.x + x1; c++) {
      const sx = c * 9 + hash(c * 1.7) * 8 - cam.x;
      if (!inRun(sx)) continue;
      const top = topAt(sx);
      if (top == null) continue;
      for (let r = 0; r < 3; r++) {
        if (hash(c * 3.7 + r * 11) < 0.35) continue;
        const y = top + 91 + r * 11 + hash(c * 5.1 + r) * 5;
        ctx.fillStyle = hash(c * 2.9 + r) > 0.5 ? '#8d8679' : '#a09888';
        ctx.beginPath();
        ctx.ellipse(sx, y, 2.6 + hash(c * 6.3 + r) * 1.8, 1.7 + hash(c * 4.3 + r) * 1.1, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Bedrock: angular cracks running through it, and a boulder now and then.
    ctx.strokeStyle = '#4a4950';
    ctx.lineWidth = 1.3;
    for (let c = Math.floor((cam.x + x0) / 60); c * 60 < cam.x + x1; c++) {
      const sx = c * 60 + hash(c * 8.1) * 50 - cam.x;
      if (!inRun(sx)) continue;
      const top = topAt(sx);
      if (top == null) continue;
      let cy = top + 130 + hash(c * 2.2) * 10;
      let cx2 = sx;
      ctx.beginPath();
      ctx.moveTo(cx2, cy);
      for (let k = 0; k < 4; k++) {
        cx2 += (hash(c * 3.1 + k) - 0.5) * 34;
        cy += 10 + hash(c * 5.9 + k) * 12;
        ctx.lineTo(cx2, cy);
      }
      ctx.stroke();
      if (hash(c * 7.1) > 0.5) {
        ctx.fillStyle = '#656470';
        ctx.beginPath();
        ctx.ellipse(sx + 18, top + 148 + hash(c * 4.4) * 26, 12 + hash(c * 1.3) * 7, 7 + hash(c * 6.6) * 4, hash(c) * 0.4 - 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#7b7a86';
        ctx.beginPath();
        ctx.ellipse(sx + 14, top + 144 + hash(c * 4.4) * 26, 6, 3, -0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  // Things lost in the soil over the years, down in the worked beds.
  const B = 300;
  for (let c = Math.floor((cam.x - 60) / B); c * B < cam.x + width + 60; c++) {
    const wx = c * B + 50 + hash(c * 8.3) * (B - 100);
    if (hash(c * 5.9 + 2) < 0.22) continue;
    const sx = wx - cam.x;
    const top = topAt(sx);
    if (top == null) continue;
    buried(ctx, Math.floor(hash(c * 2.7 + 9) * 6), sx, top + 30 + hash(c * 1.1) * 44, c);
  }
  // ---------- The channel ----------
  for (const pts of runs) {
    const x0 = Math.max(-8, pts[0][0]);
    const x1 = Math.min(width + 8, pts[pts.length - 1][0]);
    for (let sx = x0; sx <= x1; sx += 3) {
      const wx = sx + cam.x;
      if (wx < DITCH[0] || wx > DITCH[1]) continue;
      const top = topAt(sx);
      if (top == null) continue;
      ctx.fillStyle = '#33261b';
      ctx.fillRect(sx, top + DITCH_TOP, 3.2, DITCH_BOT - DITCH_TOP);
      ctx.fillStyle = '#ada391';
      ctx.fillRect(sx, top + DITCH_TOP + 2, 3.2, 4.5);
      if (Math.floor(wx / 13) % 2) {
        ctx.fillStyle = '#9e9484';
        ctx.fillRect(sx, top + DITCH_TOP + 4.6, 3.2, 1.9);
      }
      ctx.fillStyle = '#6f6757';
      ctx.fillRect(sx, top + DITCH_BOT - 4, 3.2, 4);
      ctx.fillStyle = '#5f97ae';
      ctx.fillRect(sx, top + DITCH_TOP + 6, 3.2, DITCH_BOT - DITCH_TOP - 9.5);
      ctx.fillStyle = '#7fb8cc';
      ctx.fillRect(sx, top + DITCH_TOP + 7.5, 3.2, DITCH_BOT - DITCH_TOP - 12);
      ctx.fillStyle = '#7fc06a';
      ctx.fillRect(sx, top + DITCH_TOP - 1, 3.2, 2.6);
      ctx.fillStyle = '#9fd87a';
      ctx.fillRect(sx, top + DITCH_TOP - 1, 3.2, 1);
    }
  }
  // The light on the water: short ripples travelling along it, not stripes painted down the middle.
  for (const pts of runs) {
    const x0 = Math.max(-8, pts[0][0]);
    const x1 = Math.min(width + 8, pts[pts.length - 1][0]);
    for (let c = Math.floor((cam.x + x0) / 19) - 1; c * 19 < cam.x + x1 + 19; c++) {
      const drift = (time * 13 + hash(c * 3.7) * 19) % 19;
      const wx = c * 19 + drift;
      if (wx < DITCH[0] || wx > DITCH[1]) continue;
      const sx = wx - cam.x;
      if (sx < x0 - 8 || sx > x1 + 8) continue;
      const top = topAt(sx);
      if (top == null) continue;
      const len = 4 + hash(c * 5.1) * 4;
      ctx.fillStyle = '#bfe4f0';
      ctx.fillRect(sx, top + DITCH_TOP + 8.5 + hash(c * 2.3) * 5, len, 1.3);
      if (hash(c * 8.9) > 0.6) {
        ctx.fillStyle = '#eafaff';
        ctx.fillRect(sx + 1, top + DITCH_TOP + 7.5, len * 0.6, 1.1);
      }
    }
  }
  // Tufts and a plank or two across it, so it reads as something dug and used.
  for (let c = Math.floor((cam.x - 40) / 70); c * 70 < cam.x + width + 40; c++) {
    const wx = c * 70 + hash(c * 4.7) * 50;
    if (wx < DITCH[0] || wx > DITCH[1]) continue;
    const sx = wx - cam.x;
    const top = topAt(sx);
    if (top == null) continue;
    if (hash(c * 2.1) > 0.55) {
      ctx.fillStyle = '#9a7a52';
      ctx.fillRect(sx - 9, top + DITCH_TOP + 1, 18, 3.4);
      ctx.fillStyle = '#b89468';
      ctx.fillRect(sx - 9, top + DITCH_TOP + 1, 18, 1.2);
    } else if (hash(c * 6.3) > 0.45) {
      ctx.fillStyle = '#7fa65e';
      for (let i = 0; i < 4; i++) ctx.fillRect(sx + i * 2.4 - 3, top + DITCH_TOP + 8 - i, 1.1, 8 + i * 1.6);
    }
  }
  // Where it reaches the pond it pours in.
  const mouth = DITCH[1] - cam.x;
  if (mouth > -20 && mouth < width + 20) {
    const top = topAt(mouth);
    if (top != null) {
      ctx.fillStyle = '#9fd0de';
      ctx.fillRect(mouth - 3, top + DITCH_TOP, 6, 22);
      ctx.fillStyle = '#eafaff';
      for (let i = 0; i < 4; i++) {
        const k = ((time * 36 + i * 7) % 22);
        ctx.fillRect(mouth - 1.6 + Math.sin(i * 2 + time) * 1.2, top + DITCH_TOP + k, 2.2, 3);
      }
    }
  }
  ctx.restore();
}
GROUND_ART.push(gardenGround);

// ---------- Lily Pond ----------
// The pond was a flat teal bowl you could see the bank straight through. It has a floor now: silt
// shelving down from the banks, stones and waterweed standing on it, things that have gone in over
// the years, light coming down through the surface in slow shafts, and the deep end going dark.
// On top of the skin, the light travels along it in short glints.
//
// (Hooked into the water painter the way the race courses' lakes are: WATER_BED under the surface,
// WATER_LIFE over it.)
const isPond = (map, w) => map?.garden && w.kind === 'pond';

function pondBed(ctx, map, w, cam, time, x0, x1) {
  if (!isPond(map, w)) return;
  const sy = (wx) => w.y - cam.y + swell(wx, time, 1);
  const bed = (wx) => groundAt(map, wx) - cam.y;
  const lo = Math.max(x0, cam.x - 20);
  const hi = Math.min(x1, cam.x + 700);
  // The deep end going dark: a wash that thickens with the distance from the surface.
  const deepest = bed((x0 + x1) / 2);
  const g = ctx.createLinearGradient(0, sy((x0 + x1) / 2), 0, deepest);
  g.addColorStop(0, 'rgba(20,70,80,0)');
  g.addColorStop(1, 'rgba(14,52,66,0.5)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(lo - cam.x, sy(lo));
  for (let wx = lo; wx <= hi; wx += 6) ctx.lineTo(wx - cam.x, sy(wx));
  for (let wx = hi; wx >= lo; wx -= 6) ctx.lineTo(wx - cam.x, bed(wx) + 2);
  ctx.closePath();
  ctx.fill();
  // Shafts of light coming down through the surface, leaning and drifting.
  ctx.fillStyle = 'rgba(190,245,235,0.13)';
  for (let i = 0; i < 7; i++) {
    const wx = x0 + 40 + ((i * 97 + time * 7) % Math.max(1, x1 - x0 - 80));
    if (wx < lo - 40 || wx > hi + 40) continue;
    const sx = wx - cam.x;
    const top = sy(wx);
    const depth = bed(wx) - top;
    ctx.beginPath();
    ctx.moveTo(sx - 7, top);
    ctx.lineTo(sx + 7, top);
    ctx.lineTo(sx + 20, top + depth);
    ctx.lineTo(sx + 6, top + depth);
    ctx.closePath();
    ctx.fill();
  }
  // The silt shelving along the bed, pale where the light still reaches it.
  ctx.fillStyle = '#b9a884';
  ctx.beginPath();
  ctx.moveTo(lo - cam.x, bed(lo) + 3);
  for (let wx = lo; wx <= hi; wx += 6) ctx.lineTo(wx - cam.x, bed(wx) - 3 - Math.sin(wx * 0.02) * 1.6);
  for (let wx = hi; wx >= lo; wx -= 6) ctx.lineTo(wx - cam.x, bed(wx) + 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#cdbd9a';
  ctx.beginPath();
  ctx.moveTo(lo - cam.x, bed(lo) + 1);
  for (let wx = lo; wx <= hi; wx += 6) ctx.lineTo(wx - cam.x, bed(wx) - 3 - Math.sin(wx * 0.02) * 1.6);
  for (let wx = hi; wx >= lo; wx -= 6) ctx.lineTo(wx - cam.x, bed(wx) - 0.6 - Math.sin(wx * 0.02) * 1.6);
  ctx.closePath();
  ctx.fill();
  // Stones lying on it, and waterweed standing up out of it and swaying.
  for (let c = Math.floor(x0 / 28); c * 28 < x1; c++) {
    const wx = c * 28 + hash(c * 3.7) * 24;
    if (wx < lo - 30 || wx > hi + 30) continue;
    const sx = wx - cam.x;
    const by = bed(wx);
    const h = hash(c * 5.1);
    if (h > 0.62) {
      ctx.fillStyle = '#8a8676';
      ctx.beginPath();
      ctx.ellipse(sx, by - 2, 4 + hash(c * 2.3) * 4, 2.4 + hash(c * 6.1) * 1.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#a5a190';
      ctx.beginPath();
      ctx.ellipse(sx - 1.4, by - 3, 2.2, 1.1, -0.3, 0, Math.PI * 2);
      ctx.fill();
    } else if (h > 0.2) {
      const n = 3 + Math.floor(hash(c * 7.3) * 3);
      for (let k = 0; k < n; k++) {
        const len = 10 + hash(c * 9.1 + k) * 18;
        const lean = Math.sin(time * 0.9 + wx * 0.05 + k) * 4;
        ctx.strokeStyle = k % 2 ? '#3f7a62' : '#4f9070';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(sx + k * 2.6 - 3, by - 1);
        ctx.quadraticCurveTo(sx + k * 2.6 - 3 + lean * 0.4, by - len * 0.6, sx + k * 2.6 - 3 + lean, by - len);
        ctx.stroke();
      }
    }
  }
  // Things that have gone in over the years, settled in the silt.
  for (let c = Math.floor(x0 / 150); c * 150 < x1; c++) {
    const wx = c * 150 + 40 + hash(c * 4.9) * 70;
    if (wx < lo - 30 || wx > hi + 30 || hash(c * 8.8) < 0.4) continue;
    buried(ctx, [0, 4, 5][Math.floor(hash(c * 2.1) * 3)], wx - cam.x, bed(wx) - 4, c);
  }
}

function pondLife(ctx, map, w, cam, time, x0, x1, at) {
  if (!isPond(map, w)) return;
  const lo = Math.max(x0, cam.x - 20);
  const hi = Math.min(x1, cam.x + 700);
  // A bright line along the waterline where the sky catches it.
  ctx.fillStyle = 'rgba(236,255,252,0.5)';
  for (let wx = lo; wx <= hi; wx += 4) ctx.fillRect(wx - cam.x, at(wx) - 0.8, 4.2, 1.2);
  // The light travelling along the surface in short glints.
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  for (let c = Math.floor(lo / 23) - 1; c * 23 < hi + 23; c++) {
    const drift = (time * 9 + hash(c * 5.3) * 23) % 23;
    const wx = c * 23 + drift;
    if (wx < lo || wx > hi) continue;
    const len = 5 + hash(c * 2.7) * 7;
    ctx.fillRect(wx - cam.x, at(wx) + 1.6 + hash(c * 6.9) * 3, len, 1.1);
  }
  ctx.fillStyle = 'rgba(214,246,242,0.55)';
  for (let c = Math.floor(lo / 37) - 1; c * 37 < hi + 37; c++) {
    const drift = (time * 5 + hash(c * 1.9) * 37) % 37;
    const wx = c * 37 + drift;
    if (wx < lo || wx > hi) continue;
    ctx.fillRect(wx - cam.x, at(wx) + 6 + hash(c * 3.1) * 5, 9 + hash(c * 8.1) * 9, 1);
  }
  // After dark the moon lies on the water: under the sky's moon (it hangs at four fifths of the way
  // across the screen, render/scenery.js, so its picture in the pond stays under it as you walk),
  // a pale disc broken into strips that sway apart and back on the ripples, a long glitter trail
  // under it, and here and there a star caught in the water, twinkling.
  const night = map.night ?? 0;
  if (night <= 0.05) return;
  const k = Math.min(1, (night - 0.05) / 0.5);
  const mx = cam.x + (map.viewW ?? 640) * 0.8;
  ctx.save();
  if (mx > lo + 10 && mx < hi - 10) {
    const top = at(mx) + 3;
    // (A soft halo round it first, then the disc itself: bright enough to stay bright under the
    // night's shade.)
    const halo = ctx.createRadialGradient(mx - cam.x, top + 6, 0, mx - cam.x, top + 6, 22);
    halo.addColorStop(0, `rgba(255,246,214,${0.32 * k})`);
    halo.addColorStop(1, 'rgba(255,246,214,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(mx - cam.x - 22, top - 4, 44, 30);
    for (let r = 0; r < 8; r++) {
      const half = 9.5 * Math.sqrt(Math.max(0, 1 - ((r - 3.5) / 4.1) ** 2));
      const sway = Math.sin(time * 1.3 + r * 1.1) * (1 + r * 0.25);
      ctx.globalAlpha = k * (1 - r * 0.07);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(mx - cam.x - half + sway, top + r * 1.7, half * 2, 1.2);
    }
    for (let r = 0; r < 10; r++) {
      const u = (time * 0.35 + r * 0.137) % 1;
      const wide = 2 + hash(r * 4.3) * 6;
      ctx.globalAlpha = k * 0.7 * Math.sin(Math.PI * u);
      ctx.fillStyle = '#fff6dc';
      ctx.fillRect(mx - cam.x - wide / 2 + Math.sin(time * 0.9 + r * 2.3) * (4 + r), top + 15 + r * 1.9, wide, 1);
    }
  }
  for (let c = Math.floor(lo / 41); c * 41 < hi; c++) {
    const wx = c * 41 + hash(c * 7.7) * 30;
    if (wx < lo || wx > hi || Math.abs(wx - mx) < 16) continue;
    const tw = Math.max(0, Math.sin(time * (1 + hash(c * 2.2)) + c * 1.7));
    ctx.globalAlpha = k * 0.8 * tw;
    ctx.fillStyle = '#f4f2ff';
    const y = at(wx) + 4 + hash(c * 3.9) * 14;
    ctx.fillRect(wx - cam.x, y, 1, 1);
    if (tw > 0.75) ctx.fillRect(wx - cam.x - 1, y + 0.5, 3, 0.4);
  }
  ctx.restore();
}

WATER_BED.push(pondBed);
WATER_LIFE.push(pondLife);
