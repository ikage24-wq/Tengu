// The Sunken Aquarium Palace and Tidepool Pier (their remake, 2026-11-18, Chapter 5: Whispers in
// the Glade). Queen Coralie keeps everything she loves in glass tanks so nothing can leave, so her
// palace is one great aquarium: display tanks on sea-glass stands to climb in the halls, coral
// shelves growing up the palace's outer wall, kelp-crowned rocks in the domed garden, glowing
// basalt down the abyss. Nothing floats: every shelf stands on a coral trunk, a rock pillar or a
// stand down to whatever is below it. Behind each room a backdrop of its own: the palace wall with
// its lit portholes and shell domes under the light from the surface; the kelp forest under the
// garden's glass dome; the halls' arched windows on the deep, wall tanks between them, and the
// coral throne before the biggest tank of all; the abyss, where a great sleepy whale drifts past in
// the dark. Up top, the pier at sunset, the palace's domes glowing under the waves and a diving
// bell on a crane to take you down.

import { E, T, F, R, sprite, blit, snap, mix } from './pixel.js';
import { band } from './propkit.js';

export const AQ = {
  coral: '#ff8fa8', coralLit: '#ffc0cc', coralSh: '#d8607e', coralDeep: '#b04a6a', peach: '#ffb38a', lilac: '#c8a0f0',
  rock: '#5e8a8a', rockLit: '#86b4ae', rockSh: '#3e6a6e', rockDeep: '#2a4c54',
  basalt: '#2e3458', basaltLit: '#4a5280', basaltSh: '#1e2240', glowA: '#7ff6ff', glowB: '#ff9ae8',
  kelp: '#5fb87a', kelpLit: '#8fdc9a', kelpSh: '#3f8a5a', sand: '#ffe8c8', sandSh: '#e8c8a0',
  glass: '#bff0ff', glassLit: '#e8fcff', water: '#6ad0ec', waterLit: '#9fe6f6', waterDeep: '#3aa8d0',
  brass: '#ffd36b', brassSh: '#d8a840', brassDeep: '#a87a2a', marble: '#bfe8f2', marbleLit: '#e2f8fc', marbleSh: '#8ac4d8', marbleDeep: '#5a94b8',
};
const FISH = ['#ffb03a', '#ff7a9a', '#ffe36b', '#9fe8ff', '#c8a0f0', '#7fe0b0'];
const fishC = (i) => FISH[((Math.round(i) % FISH.length) + FISH.length) % FISH.length];
const D2R = Math.PI / 180;
const TAU = Math.PI * 2;
const bd = (path, wf, c) => [band(path, (u) => wf(u) / 2, c)];
const h01 = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const hexA = (hex, a) => `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${Math.max(0, Math.min(1, a))})`;
const wrap = (x, span) => ((x % span) + span) % span;

// ---------- Cached pictures ----------
const M = 30;
const moveIn = (sh) => (sh.pts ? { ...sh, pts: sh.pts.map(([px, py]) => [px + M, py + M]) } : { ...sh, x: (sh.x ?? 0) + M, y: (sh.y ?? 0) + M });
function art(key, w, h, build) {
  return sprite(`aq|${key}`, () => ({ w: w + M * 2, h: Math.ceil(h) + M, shapes: build().filter(Boolean).map(moveIn), res: 2, soft: 'cel' }));
}
function place(ctx, s, x, y) {
  blit(ctx, s, snap(x - s.w / 2), snap(y - s.h));
}
function glow(ctx, x, y, r, c, a) {
  if (a <= 0.005 || r <= 0) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, hexA(c, a));
  g.addColorStop(1, hexA(c, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
// What a trunk or stand under world (wx, wy) stands on: the nearest ledge below, or the floor.
function standOn(map, wx, wy) {
  let best = map.groundY;
  for (const p of map.platforms ?? []) if (p.y > wy + 4 && p.y < best && wx >= p.x && wx <= p.x + p.w) best = p.y;
  return best;
}
// A little fish, live: a body, a tail, an eye; facing `dir`.
function fish(ctx, x, y, s, dir, c, a = 1) {
  ctx.globalAlpha = a;
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.ellipse(x, y, 3.4 * s, 2 * s, 0, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - dir * 2.6 * s, y);
  ctx.lineTo(x - dir * 5.6 * s, y - 2 * s);
  ctx.lineTo(x - dir * 5.6 * s, y + 2 * s);
  ctx.fill();
  ctx.fillStyle = '#2a1a2e';
  ctx.fillRect(x + dir * 1.6 * s - 0.5, y - 0.8 * s, 1, 1);
}
// Bubbles rising from (x, y): `n` of them over `h` px.
function bubbles(ctx, x, y, h, n, time, seed, a = 0.6) {
  ctx.lineWidth = 0.8;
  for (let k = 0; k < n; k++) {
    const u = (time * (0.3 + (k % 3) * 0.08) + k / n + seed * 0.37) % 1;
    ctx.globalAlpha = a * Math.sin(u * Math.PI);
    ctx.strokeStyle = '#e8fcff';
    ctx.beginPath();
    ctx.arc(x + Math.sin(u * 7 + k + seed) * 3, y - u * h, 1 + u * 1.6, 0, TAU);
    ctx.stroke();
  }
}

// ---------- Sea shelves (`islands: 'coral' | 'kelprock' | 'abyss'`) ----------
// A shelf's slab, and the trunk (or pillar) it stands on down to whatever is below.
const SHELF = {
  coral: { top: AQ.coralLit, body: AQ.coral, sh: AQ.coralSh, deep: AQ.coralDeep },
  kelprock: { top: AQ.kelpLit, body: AQ.rock, sh: AQ.rockSh, deep: AQ.rockDeep },
  abyss: { top: AQ.basaltLit, body: AQ.basalt, sh: AQ.basaltSh, deep: '#141830' },
};
function slabPic(kind, w) {
  const C = SHELF[kind];
  return art(`slab|${kind}|${w}`, w, 30, () => {
    const out = [];
    const bottom = [];
    for (let x = w + 3; x >= -3; x -= 8) bottom.push([x, 21 + h01(x * 0.37 + w) * 7]);
    out.push(T([[-3, 3], [w + 3, 3], [w + 4, 10], ...bottom, [-4, 10]], C.body));
    out.push(F(T([[-3, 12], [w + 3, 12], ...bottom.slice(0, -1)], C.sh)));
    out.push(R(-3, 1, w + 6, 6, C.top), F(R(-3, 1, w + 6, 1.6, mix(C.top, '#ffffff', 0.4))));
    if (kind === 'coral') {
      // Polyps along the lip, little branching tufts at the ends.
      for (let x = 4; x < w - 2; x += 7) out.push(F(E(x + h01(x) * 3, 4.4, 1.1, 0.9, h01(x * 3) > 0.5 ? AQ.peach : '#ffffff')));
      for (const [x, c] of [[6, AQ.peach], [w - 8, AQ.lilac]]) out.push(...bd([[x, 2], [x - 2, -6], [x - 5, -10]], () => 2.4, c), ...bd([[x - 2, -5], [x + 3, -10]], () => 2, c), E(x - 5, -10, 1.8, 1.8, c), E(x + 3, -10, 1.6, 1.6, c));
      for (let x = 14; x < w - 10; x += 22) out.push(F(E(x, 13 + h01(x) * 4, 1.6, 1.4, AQ.coralLit)));
    } else if (kind === 'kelprock') {
      // Seagrass along the top, shells and a starfish in it.
      for (let x = 2; x < w - 1; x += 4) out.push(F(T([[x, 2], [x + 1.4, -2 - h01(x) * 3], [x + 2.4, 2]], h01(x * 7) > 0.5 ? AQ.kelpLit : AQ.kelp)));
      out.push(F(T([[w * 0.3, 8], [w * 0.3 + 2, 6], [w * 0.3 + 4, 8], [w * 0.3 + 2, 10]], '#ffb3c8')));
      for (let x = 10; x < w - 6; x += 18) out.push(F(E(x, 14 + h01(x) * 3, 2, 1.4, AQ.rockLit)));
    } else {
      // Glowing anemones and tube worms on the dark rock.
      for (let x = 6; x < w - 4; x += 11) out.push(F(E(x, 3, 1.4, 1.1, h01(x) > 0.5 ? AQ.glowA : AQ.glowB)));
      for (let x = 12; x < w - 8; x += 26) out.push(...bd([[x, 2], [x, -5]], () => 2, '#e8e0ff'), E(x, -5.4, 1.4, 1.4, AQ.glowB));
    }
    return out;
  });
}
function stalkPic(kind, h, seed) {
  const C = SHELF[kind];
  return art(`stalk|${kind}|${h}|${seed % 3}`, 64, h, () => {
    const out = [];
    if (kind === 'coral') {
      // A coral tree: a stout trunk rooted in a sand mound, forking under the shelf into three boughs.
      const sway = (seed % 3) - 1;
      const fork = Math.min(h * 0.45, 46);
      out.push(...bd([[32, h], [32 + sway * 3, h * 0.55], [32, fork]], (u) => 36 - u * 12, C.body));
      // Side sprigs up the trunk, so a tall one reads as coral, not a pole.
      for (let y = fork + 40, j = 0; y < h - 30; y += 46, j++) {
        const d = j % 2 ? 1 : -1;
        out.push(...bd([[32, y + 10], [32 + d * 16, y - 2], [32 + d * 20, y - 12]], (u) => 8 - u * 4, j % 2 ? C.sh : C.body), E(32 + d * 20, y - 12, 3.4, 3.4, j % 3 ? C.top : AQ.peach));
      }
      out.push(...bd([[32, fork + 6], [12, fork * 0.45], [4, 2]], (u) => 16 - u * 8, C.body));
      out.push(...bd([[32, fork + 6], [52, fork * 0.45], [60, 2]], (u) => 16 - u * 8, C.body));
      out.push(...bd([[32, fork + 4], [33, 2]], (u) => 18 - u * 6, C.sh));
      out.push(F(...bd([[24, h - 4], [24 + sway * 2, h * 0.55], [26, fork + 4]], () => 4, C.top)));
      for (let y = fork + 14; y < h - 10; y += 31) out.push(F(E(28 + h01(y + seed) * 10, y, 1.8, 1.5, h01(y * 3) > 0.5 ? AQ.peach : C.top)));
      out.push(E(32, h - 1, 30, 6, AQ.sandSh), E(32, h - 3, 20, 4, AQ.sand), F(E(14, h - 3, 3, 2, '#ffd8e2')), F(E(50, h - 2, 2.6, 1.6, AQ.peach)));
    } else if (kind === 'kelprock') {
      // Boulders stacked to the floor, a kelp frond wound round them.
      let y = 0;
      let i = 0;
      while (y < h) {
        const r = 14 + h01(i + seed) * 5;
        out.push(E(32 + (i % 2 ? 4 : -4), Math.min(h - r * 0.7, y + r * 0.7), r, r * 0.8, i % 2 ? C.body : C.sh));
        y += r * 1.3;
        i++;
      }
      out.push(F(...bd([[24, h], [38, h * 0.66], [24, h * 0.33], [36, 2]], () => 2.4, AQ.kelp)));
    } else {
      // A cluster of basalt columns, glowing specks in their cracks.
      for (const [cx, cw, top] of [[20, 14, 6], [44, 14, 0], [32, 16, 0]]) {
        out.push(R(cx - cw / 2, top, cw, h - top, cx === 32 ? C.body : C.sh), F(R(cx - cw / 2, top, 2.4, h - top, C.top)));
        for (let y = top + 8; y < h - 6; y += 16) out.push(F(R(cx - cw / 2, y, cw, 1, C.deep)));
      }
      for (let y = 10; y < h - 6; y += 13) out.push(F(E(22 + h01(y + seed) * 22, y, 1.3, 1.3, h01(y) > 0.5 ? AQ.glowA : AQ.glowB)));
      out.push(E(32, h - 1, 30, 5, C.sh));
    }
    return out;
  });
}
export function drawSeaShelf(kind, ctx, x, y, w, time, seed, map, cam) {
  x = snap(x);
  y = snap(y);
  const wx = x + cam.x;
  const wy = y + cam.y;
  // The trunks first, behind the slab.
  const at = w > 220 ? [0.22, 0.78] : [0.5];
  at.forEach((f, i) => {
    const sx = Math.round(w * f);
    const bottom = standOn(map, wx + sx, wy);
    const h = Math.round(bottom - (wy + 18));
    if (h > 6) blit(ctx, stalkPic(kind, h, seed + i), snap(x + sx - 32 - M), snap(y + 18 - M));
  });
  blit(ctx, slabPic(kind, w), x - M, y - 1 - M);
  ctx.save();
  if (kind === 'coral') bubbles(ctx, x + w * 0.3, y - 2, 40, 3, time, seed);
  else if (kind === 'kelprock') {
    // Kelp fronds rooted along the back edge, swaying in the swell.
    ctx.lineCap = 'round';
    for (let k = 0; k < Math.max(2, Math.floor(w / 70)); k++) {
      const bx = x + 10 + ((k * 67 + seed * 13) % Math.max(10, w - 20));
      const hgt = 34 + h01(k + seed) * 26;
      const sw = Math.sin(time * 1.1 + bx * 0.03) * 7;
      ctx.globalAlpha = 1;
      ctx.strokeStyle = k % 2 ? AQ.kelpSh : AQ.kelp;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(bx, y + 3);
      ctx.quadraticCurveTo(bx + sw * 0.4, y - hgt * 0.5, bx + sw, y - hgt);
      ctx.stroke();
      ctx.fillStyle = AQ.kelpLit;
      for (let j = 1; j < 4; j++) {
        const u = j / 4;
        const px = bx + sw * u * u;
        const py = y + 3 - hgt * u;
        ctx.beginPath();
        ctx.ellipse(px + (j % 2 ? 3 : -3), py, 3.4, 1.4, (j % 2 ? -0.5 : 0.5) + sw * 0.03, 0, TAU);
        ctx.fill();
      }
    }
  } else {
    // The anemones' glow, breathing.
    for (let k = 0; k < Math.floor(w / 40); k++) glow(ctx, x + 8 + k * 40 + (seed % 7), y + 2, 10, k % 2 ? AQ.glowA : AQ.glowB, 0.18 + 0.12 * Math.sin(time * 2 + k));
  }
  ctx.restore();
}
export const drawCoralShelf = (...a) => drawSeaShelf('coral', ...a);
export const drawKelpRock = (...a) => drawSeaShelf('kelprock', ...a);
export const drawAbyssLedge = (...a) => drawSeaShelf('abyss', ...a);

// ---------- Display tanks (`islands: 'tank'`) ----------
// A glass tank you stand on the lid of: brass rim and corners, water, gravel, a little coral and a
// sunken castle, fish swimming inside; on a sea-glass stand down to whatever is below.
const TANK_H = 44;
function tankPic(w, seed) {
  return art(`tank|${w}|${seed % 3}`, w, TANK_H + 6, () => {
    const out = [];
    out.push(R(0, 4, w, TANK_H - 4, AQ.water), F(R(0, 4, w, 8, AQ.waterLit)), F(R(0, TANK_H - 14, w, 10, AQ.waterDeep)));
    // Gravel, a coral, a weed, the castle.
    for (let x = 2; x < w - 2; x += 5) out.push(F(E(x, TANK_H - 3 - h01(x + seed) * 2, 2.6, 1.6, h01(x * 3 + seed) > 0.5 ? '#ffe0b8' : '#f4c8a8')));
    const cx = w * (0.25 + (seed % 3) * 0.2);
    out.push(F(R(cx, TANK_H - 16, 10, 12, '#c8b0e8')), F(R(cx - 2, TANK_H - 18, 4, 4, '#c8b0e8')), F(R(cx + 8, TANK_H - 18, 4, 4, '#c8b0e8')), F(R(cx + 3, TANK_H - 10, 4, 6, '#6a4a8a')));
    out.push(F(...bd([[w * 0.7, TANK_H - 4], [w * 0.7 - 3, TANK_H - 16], [w * 0.7 + 2, TANK_H - 24]], () => 2, AQ.kelp)));
    out.push(F(E(w * 0.85, TANK_H - 6, 4, 3, AQ.coral)), F(E(w * 0.85 - 3, TANK_H - 9, 2, 2, AQ.coralLit)));
    // Glass glints.
    out.push(F(T([[6, 8], [10, 8], [4, TANK_H - 8], [2, TANK_H - 8]], AQ.glassLit)), F(T([[w - 18, 8], [w - 16, 8], [w - 22, TANK_H - 10], [w - 24, TANK_H - 10]], AQ.glassLit)));
    // The brass frame: lid rim, base rim, corners and posts.
    out.push(R(-3, 0, w + 6, 5, AQ.brass), F(R(-3, 0, w + 6, 1.6, '#fff0b0')), R(-3, TANK_H - 2, w + 6, 6, AQ.brassSh), F(R(-3, TANK_H + 2, w + 6, 1.6, AQ.brassDeep)));
    for (let x = 0; x <= w; x += Math.max(60, w / Math.max(1, Math.round(w / 120)))) out.push(R(Math.min(w - 3, x) - 1.5, 4, 3, TANK_H - 6, AQ.brassSh));
    out.push(R(-3, 4, 4, TANK_H - 6, AQ.brass), R(w - 1, 4, 4, TANK_H - 6, AQ.brass));
    return out;
  });
}
function standPic(h) {
  return art(`stand|${h}`, 18, h, () => [
    R(0, 0, 18, 5, AQ.brass), F(R(0, 0, 18, 1.6, '#fff0b0')),
    R(3, 5, 12, h - 11, AQ.marble), F(R(3, 5, 2, h - 11, AQ.marbleLit)), F(R(10, 5, 1.4, h - 11, AQ.marbleSh)), F(R(13, 5, 2, h - 11, AQ.marbleSh)),
    R(0, h - 6, 18, 6, AQ.brassSh), F(R(0, h - 1.6, 18, 1.6, AQ.brassDeep)),
    F(E(9, h * 0.4, 2, 2, AQ.coral)),
  ]);
}
export function drawTank(ctx, x, y, w, time, seed, map, cam) {
  x = snap(x);
  y = snap(y);
  const wx = x + cam.x;
  const wy = y + cam.y;
  const legs = w > 180 ? [12, w / 2, w - 12] : [12, w - 12];
  for (const lx of legs) {
    const bottom = standOn(map, wx + lx, wy);
    const h = Math.round(bottom - (wy + TANK_H + 2));
    if (h > 6) blit(ctx, standPic(h), snap(x + lx - 9 - M), snap(y + TANK_H + 2 - M));
  }
  blit(ctx, tankPic(w, seed), x - M, y - M);
  // Fish swimming inside, bubbles, a shimmer on the water.
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 1, y + 5, w - 2, TANK_H - 9);
  ctx.clip();
  const n = Math.max(2, Math.min(6, Math.floor(w / 50)));
  for (let k = 0; k < n; k++) {
    const sp = 0.05 + h01(k + seed) * 0.05;
    const u = (time * sp + h01(k * 3 + seed)) % 2;
    const dir = u < 1 ? 1 : -1;
    const f = u < 1 ? u : 2 - u;
    const fx = x + 8 + f * (w - 16);
    const fy = y + 14 + h01(k * 7 + seed) * (TANK_H - 30) + Math.sin(time * 2 + k) * 2;
    fish(ctx, fx, fy, 0.9 + h01(k + 9) * 0.4, dir, fishC(k + seed));
  }
  bubbles(ctx, x + w * 0.7, y + TANK_H - 6, TANK_H - 10, 3, time, seed, 0.7);
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#ffffff';
  const sh = (time * 30 + seed * 40) % (w + 40) - 20;
  ctx.fillRect(x + sh, y + 6, 14, 1.4);
  ctx.restore();
}

// ---------- Sea-floor things (deco) ----------
function coralClumpArt(seed) {
  const s = seed % 3;
  const c = [AQ.coral, AQ.peach, AQ.lilac][s];
  return art(`clump|${s}`, 50, 40, () => [
    ...bd([[25, 40], [22, 22], [16, 10], [14, 4]], (u) => 6 - u * 3, c), E(14, 4, 3, 3, mix(c, '#ffffff', 0.3)),
    ...bd([[25, 40], [30, 20], [38, 12]], (u) => 6 - u * 3, c), E(38, 12, 2.6, 2.6, mix(c, '#ffffff', 0.3)),
    ...bd([[25, 40], [26, 26], [24, 14]], (u) => 5 - u * 2, mix(c, '#000000', 0.12)),
    E(10, 37, 8, 4, AQ.coralSh), E(40, 37, 8, 4, AQ.coralSh), F(E(10, 36, 1.4, 1.4, '#ffffff')), F(E(40, 35, 1.4, 1.4, '#ffffff')),
  ]);
}
function shellPileArt() {
  return art('shells', 40, 16, () => [
    E(14, 12, 9, 5, '#ffd8e2'), F(...bd([[14, 15], [10, 8]], () => 0.8, '#e8a8b8')), F(...bd([[14, 15], [14, 7]], () => 0.8, '#e8a8b8')), F(...bd([[14, 15], [18, 8]], () => 0.8, '#e8a8b8')),
    E(28, 13, 6, 4, '#fff0d6'), F(E(28, 12, 2, 1.4, '#ffffff')),
    T([[34, 15], [36, 9], [38, 15], [40, 11], [36, 13]], '#ffb38a'),
  ]);
}
function drawKelpClump(ctx, x, y, time, seed) {
  ctx.save();
  ctx.lineCap = 'round';
  for (let k = 0; k < 4; k++) {
    const bx = x - 12 + k * 8;
    const hgt = 50 + h01(k + seed) * 40;
    const sw = Math.sin(time * 0.9 + bx * 0.02 + k) * 9;
    ctx.strokeStyle = k % 2 ? AQ.kelpSh : AQ.kelp;
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.moveTo(bx, y);
    ctx.quadraticCurveTo(bx + sw * 0.3, y - hgt * 0.5, bx + sw, y - hgt);
    ctx.stroke();
    ctx.fillStyle = AQ.kelpLit;
    for (let j = 1; j < 5; j++) {
      const u = j / 5;
      ctx.beginPath();
      ctx.ellipse(bx + sw * u * u + (j % 2 ? 4 : -4), y - hgt * u, 4, 1.6, (j % 2 ? -0.5 : 0.5), 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = '#ffd36b';
    ctx.beginPath();
    ctx.arc(bx + sw, y - hgt, 2, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}
// The pier's diving bell: a timber crane at the end of the pier, a brass bell with a lit porthole
// hanging from it over the water, its rope creaking as it sways.
function craneArt() {
  return art('crane', 120, 150, () => [
    R(10, 30, 10, 120, '#8a5a3a'), F(R(10, 30, 3, 120, '#b07a52')), R(4, 140, 22, 10, '#6a4a32'),
    T([[14, 30], [110, 22], [110, 30], [20, 38]], '#8a5a3a'), F(T([[14, 30], [110, 22], [110, 24], [14, 32]], '#b07a52')),
    ...bd([[18, 70], [60, 30]], () => 3, '#6a4a32'),
    E(104, 30, 5, 5, '#6a4a32'), F(E(104, 30, 2, 2, '#ffd36b')),
  ]);
}
function bellArt() {
  return art('bell', 44, 50, () => [
    E(22, 8, 6, 4, AQ.brassSh), T([[10, 12], [34, 12], [40, 42], [4, 42]], AQ.brass), F(T([[12, 13], [17, 13], [10, 41], [6, 41]], '#fff0b0')),
    R(2, 41, 40, 6, AQ.brassSh), F(R(2, 45, 40, 1.6, AQ.brassDeep)),
    E(22, 28, 7, 7, AQ.brassDeep), E(22, 28, 5.4, 5.4, '#9fe6f6'), F(E(20, 26, 1.8, 1.4, '#ffffff')),
    ...[0, 1, 2, 3, 4, 5].map((i) => F(E(22 + Math.cos((i / 6) * TAU) * 6.2, 28 + Math.sin((i / 6) * TAU) * 6.2, 0.7, 0.7, '#fff0b0'))),
  ]);
}
function drawDivingBell(ctx, x, y, time) {
  // (The crane's post stands left of x, its arm reaching out to the pulley over x.)
  place(ctx, craneArt(), x - 50, y);
  const sw = Math.sin(time * 1.1) * 0.05;
  ctx.save();
  ctx.translate(x - 6, y - 120);
  ctx.rotate(sw);
  ctx.strokeStyle = '#6a4a32';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 62);
  ctx.stroke();
  const s = bellArt();
  blit(ctx, s, snap(-s.w / 2), snap(62 - M));
  glow(ctx, 0, 62 + 28, 16, '#9fe6f6', 0.35 + 0.1 * Math.sin(time * 2));
  ctx.restore();
}
export const AQUA_KINDS = {
  coralclump: { w: 50 + M * 2, h: 40 + M, draw: (ctx, x, y, time, seed) => place(ctx, coralClumpArt(seed), x, y) },
  shellpile: { w: 40 + M * 2, h: 16 + M, draw: (ctx, x, y) => place(ctx, shellPileArt(), x, y) },
  kelpclump: { w: 60, h: 100, draw: (ctx, x, y, time, seed) => drawKelpClump(ctx, x, y, time, seed) },
  divingbell: { w: 180, h: 190, draw: (ctx, x, y, time) => drawDivingBell(ctx, x, y, time) },
};

// ---------- Painted backdrops ----------
// Light from the surface: soft slanting beams, fading with depth.
function shafts(ctx, cam, width, height, time, a, tint = '#e8fcff') {
  for (let i = 0; i < 6; i++) {
    const x = wrap(i * 190 + 60 - cam.x * 0.12, width + 300) - 150;
    const sway = Math.sin(time * 0.3 + i) * 14;
    const w = 26 + h01(i) * 30;
    const g = ctx.createLinearGradient(0, 0, 0, height);
    g.addColorStop(0, hexA(tint, a * (0.6 + 0.4 * Math.sin(time * 0.5 + i * 2))));
    g.addColorStop(1, hexA(tint, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x + sway, 0);
    ctx.lineTo(x + w + sway, 0);
    ctx.lineTo(x + w * 2.2 + 120, height);
    ctx.lineTo(x + 120, height);
    ctx.fill();
  }
}
// Shoals drifting by, far back and smaller.
function shoals(ctx, cam, width, height, time, c, a, k = 0.08) {
  for (let s = 0; s < 3; s++) {
    const dir = s % 2 ? -1 : 1;
    const cx = wrap(s * 400 + dir * time * 14 - cam.x * k, width + 300) - 150;
    const cy = height * (0.25 + s * 0.2) + Math.sin(time * 0.4 + s) * 12;
    for (let i = 0; i < 9; i++) fish(ctx, cx + (i % 3) * 9 - dir * Math.floor(i / 3) * 7, cy + Math.floor(i / 3) * 6 + (i % 3) * 2, 0.7, dir, c, a);
  }
  ctx.globalAlpha = 1;
}
function snow(ctx, cam, width, height, time, a) {
  ctx.fillStyle = '#e8f4ff';
  for (let i = 0; i < 40; i++) {
    const x = wrap(h01(i) * width * 1.4 - cam.x * 0.3 + Math.sin(time * 0.3 + i) * 10, width);
    const y = wrap(h01(i + 50) * height + time * (6 + (i % 4) * 2) - cam.y * 0.3, height);
    ctx.globalAlpha = a * (0.4 + h01(i + 9) * 0.6);
    ctx.fillRect(x, y, 1.4, 1.4);
  }
  ctx.globalAlpha = 1;
}

// The Coral Gate: the palace's outer wall in the blue, shell domes and towers above, round
// portholes lit warm, the light from the surface slanting down.
export function drawPaintedAquaGate(ctx, t, cam, width, height, time, layerY, air, map) {
  shafts(ctx, cam, width, height, time, 0.18);
  // Far reef ridges along the floor.
  const ridge = mix(t.far, air, 0.3);
  const rY = layerY(30, 0.08);
  ctx.fillStyle = ridge;
  ctx.beginPath();
  ctx.moveTo(0, height);
  for (let x = 0; x <= width + 8; x += 8) {
    const k = x + cam.x * 0.08;
    ctx.lineTo(x, rY - Math.sin(k * 0.012) * 26 - Math.sin(k * 0.04 + 1) * 8);
  }
  ctx.lineTo(width, height);
  ctx.fill();
  // The palace, far back: a long hall of deep blue stone along the sea floor with tall arched
  // windows lit warm, and towers rising from it to shell domes up near the surface.
  const k = 0.25;
  const base = layerY(0, k);
  const off = cam.x * k;
  const body = mix('#28407a', t.far, 0.35);
  const bodyLit = mix('#3a5a9a', t.far, 0.35);
  const hallTop = layerY(260, k);
  ctx.fillStyle = body;
  ctx.fillRect(0, hallTop, width, base - hallTop + 60);
  ctx.fillStyle = bodyLit;
  ctx.fillRect(0, hallTop, width, 6);
  for (let i = -1; i < Math.ceil(width / 80) + 2; i++) {
    const wx = Math.round(i * 80 - wrap(off, 80) + 40);
    const wi = i + Math.floor(off / 80);
    const lit = h01(wi) > 0.35;
    const top = hallTop + 70;
    if (lit) glow(ctx, wx, top + 34, 26, '#ffd88a', 0.12 + 0.04 * Math.sin(time + wi));
    ctx.fillStyle = lit ? mix('#ffe2a0', t.far, 0.35) : mix('#14204a', t.far, 0.2);
    ctx.beginPath();
    ctx.moveTo(wx - 8, top + 70);
    ctx.lineTo(wx - 8, top + 8);
    ctx.arc(wx, top + 8, 8, Math.PI, 0);
    ctx.lineTo(wx + 8, top + 70);
    ctx.fill();
    ctx.fillStyle = body;
    ctx.fillRect(wx - 0.5, top, 1, 70);
  }
  for (let i = -1; i < Math.ceil(width / 330) + 2; i++) {
    const tx = Math.round(i * 330 - wrap(off, 330) + 165);
    const ti = i + Math.floor(off / 330);
    const tw = 74 + h01(ti) * 26;
    const top = layerY(560 + h01(ti + 5) * 300, k);
    ctx.fillStyle = body;
    ctx.fillRect(tx - tw / 2, top, tw, hallTop - top + 2);
    ctx.fillStyle = bodyLit;
    ctx.fillRect(tx - tw / 2, top, 6, hallTop - top + 2);
    // Its windows, one above another.
    for (let y = top + 40; y < hallTop - 20; y += 70) {
      const on = h01(ti * 9 + y) > 0.35;
      if (on) glow(ctx, tx, y, 20, '#ffd88a', 0.16);
      ctx.fillStyle = on ? mix('#ffe2a0', t.far, 0.25) : mix('#14204a', t.far, 0.2);
      ctx.beginPath();
      ctx.arc(tx, y, 9, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = mix(AQ.brass, t.far, 0.3);
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    // The shell dome and its spire.
    ctx.fillStyle = h01(ti + 2) > 0.5 ? mix(AQ.coral, t.far, 0.25) : mix('#c8a0f0', t.far, 0.25);
    ctx.beginPath();
    for (let j = 0; j <= 10; j++) {
      const a = Math.PI + (j / 10) * Math.PI;
      ctx.lineTo(tx + Math.cos(a) * (tw / 2 + 8), top + 4 + Math.sin(a) * (tw * 0.6) + (j % 2 ? 5 : 0));
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = hexA('#ffffff', 0.25);
    ctx.lineWidth = 1.4;
    for (let j = 1; j < 10; j += 2) {
      const a = Math.PI + (j / 10) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(tx, top + 4);
      ctx.lineTo(tx + Math.cos(a) * (tw / 2 + 4), top + 4 + Math.sin(a) * (tw * 0.55));
      ctx.stroke();
    }
    ctx.fillStyle = mix(AQ.brass, t.far, 0.2);
    ctx.fillRect(tx - 1.5, top - tw * 0.6 - 22, 3, 24);
    ctx.beginPath();
    ctx.arc(tx, top - tw * 0.6 - 24, 4, 0, TAU);
    ctx.fill();
    glow(ctx, tx, top - tw * 0.6 - 24, 14, '#ffe8b0', 0.3);
  }
  shoals(ctx, cam, width, height, time, mix(t.far, '#ffffff', 0.45), 0.55);
  snow(ctx, cam, width, height, time, 0.35);
}

// The Kelp Gardens, under a glass dome: the dome's ribs arching overhead, a forest of kelp behind
// in two layers swaying, sandy dunes, a shoal or two.
export function drawPaintedAquaKelp(ctx, t, cam, width, height, time, layerY, air, map) {
  // The dome's ribs.
  ctx.save();
  ctx.strokeStyle = hexA('#e8fcff', 0.22);
  ctx.lineWidth = 5;
  for (let i = -1; i < 5; i++) {
    const x = wrap(i * 360 - cam.x * 0.1, width + 360) - 180;
    ctx.beginPath();
    ctx.moveTo(x, height + 20);
    ctx.quadraticCurveTo(x + 40, -height * 0.5, x + 420, -20);
    ctx.stroke();
  }
  ctx.strokeStyle = hexA('#ffd36b', 0.18);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(width / 2, height * 1.4, width * 1.1, height * 1.3, 0, Math.PI * 1.05, Math.PI * 1.95);
  ctx.stroke();
  ctx.restore();
  shafts(ctx, cam, width, height, time, 0.2, '#e8fff0');
  // Two layers of kelp forest.
  for (const [k, lift, c, n] of [[0.12, 30, mix(t.far, air, 0.35), 18], [0.3, 10, mix(t.mid, air, 0.25), 12]]) {
    const base = layerY(lift, k);
    ctx.strokeStyle = c;
    ctx.fillStyle = c;
    ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const span = width + 200;
      const bx = wrap(i * (span / n) + h01(i + k * 10) * 40 - cam.x * k, span) - 100;
      const hgt = base * (0.55 + h01(i + 3) * 0.4);
      const sw = Math.sin(time * 0.7 + i + k * 5) * 16;
      ctx.lineWidth = 4 + k * 6;
      ctx.beginPath();
      ctx.moveTo(bx, base + 20);
      ctx.quadraticCurveTo(bx + sw * 0.4, base - hgt * 0.5, bx + sw, base - hgt);
      ctx.stroke();
      for (let j = 1; j < 7; j++) {
        const u = j / 7;
        ctx.beginPath();
        ctx.ellipse(bx + sw * u * u + (j % 2 ? 6 : -6), base - hgt * u, 6 + k * 6, 2.4, j % 2 ? -0.5 : 0.5, 0, TAU);
        ctx.fill();
      }
    }
  }
  // Dunes.
  const dY = layerY(0, 0.4);
  ctx.fillStyle = mix(AQ.sandSh, air, 0.4);
  ctx.beginPath();
  ctx.moveTo(0, height);
  for (let x = 0; x <= width + 8; x += 8) {
    const kk = x + cam.x * 0.4;
    ctx.lineTo(x, dY - 10 - Math.sin(kk * 0.01) * 10);
  }
  ctx.lineTo(width, height);
  ctx.fill();
  shoals(ctx, cam, width, height, time, '#ffe36b', 0.55, 0.15);
  snow(ctx, cam, width, height, time, 0.25);
}

// The palace's halls (the Pearl Vault and the Throne of Tides): sea-glass marble walls, tall arched
// windows on the deep with fish swimming past outside, tanks set in the wall between them. The
// vault's walls are shelves of little tanks and pearls; the throne room has the coral throne before
// the biggest tank of all.
export function drawPaintedAquaHall(ctx, t, cam, width, height, time, layerY, air, map) {
  const throne = t.hall === 'throne';
  const k = 0.55;
  const floor = layerY(0, k);
  const wall = mix(AQ.marble, t.sky[1], 0.25);
  const wallSh = mix(AQ.marbleSh, t.sky[1], 0.25);
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, width, floor + 30);
  const span = 260;
  const off = cam.x * k;
  for (let i = -1; i < Math.ceil(width / span) + 2; i++) {
    const cx = Math.round(i * span - wrap(off, span) + span / 2);
    const idx = i + Math.floor(off / span);
    // A tall arched window on the deep sea.
    const ww = 92;
    const top = floor - 250;
    ctx.fillStyle = mix('#1a4a7a', t.sky[0], 0.3);
    ctx.beginPath();
    ctx.moveTo(cx - ww / 2, floor - 30);
    ctx.lineTo(cx - ww / 2, top + ww / 2);
    ctx.arc(cx, top + ww / 2, ww / 2, Math.PI, 0);
    ctx.lineTo(cx + ww / 2, floor - 30);
    ctx.fill();
    ctx.save();
    ctx.clip();
    for (let f = 0; f < 3; f++) {
      const u = (time * (0.05 + f * 0.02) + h01(idx * 3 + f)) % 1;
      const dir = (idx + f) % 2 ? 1 : -1;
      fish(ctx, cx - dir * (ww / 2 + 10) + dir * u * (ww + 20), top + 40 + f * 50 + Math.sin(time + f) * 4, 1.4 + f * 0.3, dir, mix(fishC(idx + f), '#1a4a7a', 0.35), 0.8);
    }
    const g = ctx.createLinearGradient(0, top, 0, floor);
    g.addColorStop(0, 'rgba(232,252,255,0.25)');
    g.addColorStop(1, 'rgba(232,252,255,0)');
    ctx.fillStyle = g;
    ctx.globalAlpha = 1;
    ctx.fillRect(cx - ww / 2, top, ww, floor - top);
    ctx.restore();
    ctx.strokeStyle = mix(AQ.brass, t.sky[1], 0.2);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx - ww / 2, floor - 30);
    ctx.lineTo(cx - ww / 2, top + ww / 2);
    ctx.arc(cx, top + ww / 2, ww / 2, Math.PI, 0);
    ctx.lineTo(cx + ww / 2, floor - 30);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, top);
    ctx.lineTo(cx, floor - 30);
    ctx.moveTo(cx - ww / 2, top + ww / 2 + 40);
    ctx.lineTo(cx + ww / 2, top + ww / 2 + 40);
    ctx.stroke();
    // Between the windows: a pillar, and tanks set into the wall (shelves of little ones in the vault).
    const px = cx + span / 2;
    ctx.fillStyle = wallSh;
    ctx.fillRect(px - 14, 0, 28, floor + 30);
    ctx.fillStyle = mix(AQ.marbleLit, t.sky[1], 0.25);
    ctx.fillRect(px - 14, 0, 6, floor + 30);
    ctx.fillStyle = mix(AQ.coral, t.sky[1], 0.25);
    ctx.fillRect(px - 18, floor - 260, 36, 10);
    const rows = throne ? 1 : 3;
    for (let r = 0; r < rows; r++) {
      const th = throne ? 120 : 34;
      const tw = throne ? 70 : 44;
      const ty = floor - 40 - (r + 1) * (th + 22);
      const tx = px + span * 0.28;
      ctx.fillStyle = mix(AQ.water, t.sky[1], 0.2);
      ctx.fillRect(tx - tw / 2, ty, tw, th);
      glow(ctx, tx, ty + th / 2, tw * 0.6, '#9fe6f6', 0.18);
      ctx.save();
      ctx.beginPath();
      ctx.rect(tx - tw / 2, ty, tw, th);
      ctx.clip();
      const u = (time * 0.08 + h01(idx + r)) % 2;
      const dir = u < 1 ? 1 : -1;
      fish(ctx, tx - tw / 2 + 6 + (u < 1 ? u : 2 - u) * (tw - 12), ty + th * 0.5, throne ? 1.6 : 0.9, dir, fishC(idx + r * 2), 0.9);
      if (!throne) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#fff6fa';
        ctx.beginPath();
        ctx.arc(tx + 8, ty + th - 7, 3.4, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
      ctx.strokeStyle = mix(AQ.brass, t.sky[1], 0.2);
      ctx.lineWidth = 2.4;
      ctx.strokeRect(tx - tw / 2, ty, tw, th);
    }
  }
  // The throne room's heart: the biggest tank, and the coral throne before it (world-placed).
  if (throne) {
    const cx = 800 - cam.x;
    const fl = map.groundY - cam.y;
    const tw = 240;
    const th = 200;
    const ty = fl - 40 - th;
    ctx.fillStyle = '#2a7aa8';
    ctx.fillRect(cx - tw / 2, ty, tw, th);
    glow(ctx, cx, ty + th / 2, 160, '#9fe6f6', 0.28 + 0.06 * Math.sin(time));
    ctx.save();
    ctx.beginPath();
    ctx.rect(cx - tw / 2, ty, tw, th);
    ctx.clip();
    for (let f = 0; f < 5; f++) {
      const u = (time * (0.04 + f * 0.01) + h01(f + 40)) % 2;
      const dir = u < 1 ? 1 : -1;
      fish(ctx, cx - tw / 2 + 12 + (u < 1 ? u : 2 - u) * (tw - 24), ty + 30 + f * 32, 1.6, dir, fishC(f), 0.9);
    }
    bubbles(ctx, cx - 60, ty + th - 6, th - 10, 5, time, 3, 0.7);
    bubbles(ctx, cx + 70, ty + th - 6, th - 10, 5, time, 7, 0.7);
    ctx.restore();
    ctx.strokeStyle = AQ.brass;
    ctx.lineWidth = 6;
    ctx.strokeRect(cx - tw / 2, ty, tw, th);
    ctx.fillStyle = AQ.brass;
    ctx.fillRect(cx - tw / 2 - 10, ty - 10, tw + 20, 10);
    ctx.fillRect(cx - tw / 2 - 10, ty + th, tw + 20, 12);
    // The throne: a great scallop shell back on a coral seat.
    ctx.fillStyle = AQ.coral;
    ctx.beginPath();
    for (let j = 0; j <= 10; j++) {
      const a = Math.PI + (j / 10) * Math.PI;
      ctx.lineTo(cx + Math.cos(a) * 62, fl - 34 + Math.sin(a) * 86 + (j % 2 ? 6 : 0));
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = AQ.coralSh;
    ctx.lineWidth = 2;
    for (let j = 1; j < 10; j++) {
      const a = Math.PI + (j / 10) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(cx, fl - 34);
      ctx.lineTo(cx + Math.cos(a) * 56, fl - 34 + Math.sin(a) * 78);
      ctx.stroke();
    }
    ctx.fillStyle = AQ.coralSh;
    ctx.fillRect(cx - 40, fl - 40, 80, 40);
    ctx.fillStyle = AQ.coralLit;
    ctx.fillRect(cx - 40, fl - 40, 80, 8);
  }
  ctx.globalAlpha = 1;
}

// The Ink Abyss: the dark, a great sleepy whale drifting far back, glowing jellies rising, the
// shaft's walls close at the sides, marine snow.
export function drawPaintedAquaAbyss(ctx, t, cam, width, height, time, layerY, air, map) {
  // The whale, far off, very slow, eyes closed.
  const wx = wrap(200 - cam.x * 0.04 + time * 4, width + 700) - 350;
  const wy = height * 0.35 + Math.sin(time * 0.2) * 10;
  ctx.fillStyle = hexA('#3a4a8a', 0.55);
  ctx.beginPath();
  ctx.ellipse(wx, wy, 180, 60, 0, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(wx - 170, wy);
  ctx.lineTo(wx - 260, wy - 40 + Math.sin(time * 0.6) * 10);
  ctx.lineTo(wx - 250, wy + 30 + Math.sin(time * 0.6) * 10);
  ctx.fill();
  ctx.fillStyle = hexA('#5a6aaa', 0.5);
  ctx.beginPath();
  ctx.ellipse(wx + 10, wy + 26, 140, 22, 0, 0, Math.PI);
  ctx.fill();
  ctx.strokeStyle = hexA('#9fb0e8', 0.6);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(wx + 120, wy - 6, 6, 0.2, Math.PI - 0.2);
  ctx.stroke();
  // Glowing motes and jellies.
  for (let i = 0; i < 30; i++) {
    const x = wrap(h01(i) * (width + 100) - cam.x * 0.2, width + 100) - 50;
    const y = wrap(h01(i + 30) * height - time * (4 + (i % 5)) - cam.y * 0.2, height + 40) - 20;
    glow(ctx, x, y, 5, i % 3 ? AQ.glowA : AQ.glowB, 0.35 + 0.25 * Math.sin(time * 2 + i));
  }
  for (let i = 0; i < 5; i++) {
    const x = wrap(i * 260 + 90 - cam.x * 0.25 + Math.sin(time * 0.5 + i) * 20, width + 200) - 100;
    const y = wrap(height - time * (10 + i * 2) + i * 140 - cam.y * 0.25, height + 120) - 60;
    const c = i % 2 ? AQ.glowB : AQ.glowA;
    glow(ctx, x, y, 22, c, 0.3);
    ctx.fillStyle = hexA(c, 0.55);
    ctx.beginPath();
    ctx.arc(x, y, 8, Math.PI, 0);
    ctx.lineTo(x + 8, y + 2);
    ctx.lineTo(x - 8, y + 2);
    ctx.fill();
    ctx.strokeStyle = hexA(c, 0.4);
    ctx.lineWidth = 1;
    for (let j = -1; j <= 1; j++) {
      ctx.beginPath();
      ctx.moveTo(x + j * 4, y + 2);
      ctx.quadraticCurveTo(x + j * 4 + Math.sin(time * 3 + j) * 3, y + 10, x + j * 4, y + 18);
      ctx.stroke();
    }
  }
  // The shaft's walls.
  for (const side of [0, 1]) {
    ctx.fillStyle = hexA('#141830', 0.85);
    ctx.beginPath();
    const x0 = side ? width : 0;
    ctx.moveTo(x0, 0);
    for (let y = 0; y <= height + 10; y += 10) {
      const kk = y + cam.y * 0.5;
      const d = 40 + Math.sin(kk * 0.02 + side * 3) * 14 + Math.sin(kk * 0.07) * 6;
      ctx.lineTo(side ? width - d : d, y);
    }
    ctx.lineTo(x0, height);
    ctx.fill();
  }
  snow(ctx, cam, width, height, time, 0.45);
}

// Tidepool Pier: the sea at sunset, a lighthouse on its rock, and under the waves the palace's
// domes glowing up through the water.
export function drawPaintedTidePier(ctx, t, cam, width, height, time, layerY, air, map) {
  const sea = layerY(110, 0.12);
  // The lighthouse.
  const lx = wrap(160 - cam.x * 0.08, width + 300) - 100;
  ctx.fillStyle = mix('#6a7aa8', air, 0.3);
  ctx.beginPath();
  ctx.ellipse(lx, sea + 4, 40, 14, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = mix('#ffffff', air, 0.15);
  ctx.beginPath();
  ctx.moveTo(lx - 10, sea - 4);
  ctx.lineTo(lx - 6, sea - 70);
  ctx.lineTo(lx + 6, sea - 70);
  ctx.lineTo(lx + 10, sea - 4);
  ctx.fill();
  ctx.fillStyle = mix('#ff8fa8', air, 0.15);
  ctx.fillRect(lx - 9, sea - 30, 18, 8);
  ctx.fillRect(lx - 7, sea - 56, 14, 7);
  ctx.fillStyle = '#ffe8b0';
  ctx.fillRect(lx - 5, sea - 80, 10, 10);
  glow(ctx, lx, sea - 75, 30, '#ffe8b0', 0.4 + 0.2 * Math.sin(time * 1.4));
  // The sea, and sun glints on it.
  const g = ctx.createLinearGradient(0, sea, 0, height);
  g.addColorStop(0, mix('#5a9ad8', t.sky[2], 0.35));
  g.addColorStop(1, '#2a5a9a');
  ctx.fillStyle = g;
  ctx.fillRect(0, sea, width, height - sea);
  for (let i = 0; i < 24; i++) {
    const x = wrap(h01(i) * width * 1.3 - cam.x * 0.15 + Math.sin(time * 0.6 + i) * 6, width);
    const y = sea + 4 + h01(i + 7) * (height - sea) * 0.6;
    ctx.globalAlpha = 0.4 + 0.3 * Math.sin(time * 2 + i);
    ctx.fillStyle = '#fff0d8';
    ctx.fillRect(x, y, 6 + h01(i + 3) * 8, 1.4);
  }
  ctx.globalAlpha = 1;
  // The palace under the waves: domes and spires glowing up through the water.
  const off = cam.x * 0.2;
  for (let i = 0; i < 5; i++) {
    const x = wrap(i * 180 + 540 - off, width + 400) - 200;
    const y = sea + 40 + (i % 2) * 14;
    const r = 26 + (i % 3) * 10;
    glow(ctx, x, y, r * 2, '#9fe6f6', 0.22 + 0.06 * Math.sin(time + i));
    ctx.fillStyle = hexA(i % 2 ? '#ff9ab8' : '#c8a0f0', 0.45);
    ctx.beginPath();
    ctx.arc(x, y + r * 0.4, r, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = hexA('#ffe8b0', 0.6);
    for (let j = -1; j <= 1; j++) {
      ctx.beginPath();
      ctx.arc(x + j * r * 0.5, y + r * 0.2, 2.4, 0, TAU);
      ctx.fill();
    }
  }
}
