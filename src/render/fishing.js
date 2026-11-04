// Fishing and cooking in the world (world/fishing.js): each fishing spot's ripples and little
// sign (an ice hole up on the peak, a pool of stars at Starfall), the rod in your hands with its
// line curving down to the bobber, the bobber bobbing, then dipping with a "!" when a fish bites,
// and the catch leaping out in a sparkle. Plus the "▲ Fish" and "▲ Cook" hints.

import { SPOTS } from '../data/fishing.js';
import { itemIcon } from './icons.js';
import { blit } from './pixel.js';
import { text, box, COLORS } from '../ui/kit.js';
import { spotHere } from '../world/fishing.js';
import { groundAt } from '../world/physics.js';
import { art, place } from './scenery.js';
import { ramp } from './propkit.js';
import { R, E, T, F } from './pixel.js';
import { rodTip } from './life.js';

const TAU = Math.PI * 2;

function hint(ctx, x, y, label) {
  ctx.font = 'bold 8px sans-serif';
  const w = ctx.measureText(label).width + 12;
  box(ctx, x - w / 2, y, w, 12, { fill: '#ffffff', edge: COLORS.accent, r: 6 });
  text(ctx, label, x, y + 9, { size: 8, bold: true, align: 'center', color: COLORS.accent });
}

// Behind everyone: the spots.
export function drawSpots(ctx, world, cam, time) {
  for (const s of SPOTS[world.map.id] ?? []) {
    const x = s.bx - cam.x;
    const y = s.by - cam.y;
    if (x < -60 || x > 700) continue;
    ctx.save();
    if (s.ice) {
      // A round hole cut in the snow, deep blue water in it, a rim of packed snow and ice chips.
      place(ctx, iceHoleArt(), x, y + 8);
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(time * 1.7 + s.bx * 0.02);
      place(ctx, glintArt('#e8f4ff'), x - 6, y + 2);
    } else if (s.sky) {
      // A little pool of night sky in the cloud, its stars twinkling each on its own beat.
      place(ctx, skyPoolArt(), x, y + 9);
      for (let k = 0; k < 5; k++) {
        ctx.globalAlpha = Math.max(0, Math.sin(time * 2.2 + k * 1.7 + s.bx * 0.01));
        place(ctx, glintArt(k % 2 ? '#ffe680' : '#ffffff'), x - 14 + k * 7, y + 3 + ((k * 3) % 4));
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    // Rings spreading on the water now and then (fish about), and a lily pad bobbing on them,
    // each on the spot's own beat.
    const seed = s.bx * 0.013;
    const mine = world.fishing && (world.fishing.spot === s || world.fishing.spot.base === s);
    if (s.span) {
      // A stretch of water: fish rising all along it, and a sign at each end.
      if (!s.fixed) for (let k = 0; k < 4; k++) {
        const wx = s.span[0] + (s.span[1] - s.span[0]) * ((k + 0.5) / 4) + s.face * Math.abs(s.bx - s.x);
        ripple(ctx, wx - cam.x, y + 1, (((time * 0.35 + k * 0.27 + seed) % 1) + 1) % 1, 0.8);
      } else if (!mine) for (let k = 0; k < 2; k++) ripple(ctx, x + (k ? 9 : -7), y + 1, (((time * 0.4 + k * 0.5 + seed) % 1) + 1) % 1, 0.8);
      for (const end of s.span) if (Math.abs(end - cam.x - 320) < 400) place(ctx, signArt('water'), end - cam.x, s.y - cam.y + 1);
      continue;
    }
    if (!mine) for (let k = 0; k < 2; k++) ripple(ctx, x + (k ? 9 : -7), y + 1, (((time * 0.4 + k * 0.5 + seed) % 1) + 1) % 1, 0.8);
    // (A lily pad only on a lily pond.)
    const wk = (world.map.water ?? []).find((w) => s.bx >= w.x1 && s.bx <= w.x2)?.kind;
    if (wk === 'pond') place(ctx, padArt(), x - s.face * 16, y + 3 + Math.sin(time * 1.3 + seed) * 0.6);
    // A little wooden sign by where you stand, a fish painted on it, reeds at its foot.
    const sx = s.x - s.face * 18 - cam.x;
    const sy = s.y - cam.y;
    place(ctx, signArt(s.ice ? 'ice' : s.sky ? 'sky' : 'water'), sx, sy + 1);
    const lean = Math.sin(time * 1.1 + seed * 3) * 0.06;
    ctx.save();
    ctx.translate(sx + 7, sy);
    ctx.rotate(lean);
    place(ctx, reedArt(), 0, 1);
    ctx.restore();
  }
}

// The fishing sign: a post, a board with a fish painted on it (an icicle trim on the peak, a star
// on the sky pool's).
function signArt(kind) {
  return art(`fish|sign|${kind}`, 24, 32, () => {
    const wood = ramp('#d8a978');
    const fish = ramp(kind === 'sky' ? '#b9a0f0' : '#7fc4ff');
    return [
      R(10.6, 10, 2.8, 22, wood.sh), F(R(10.6, 10, 1, 22, wood.base)),
      R(2, 2, 20, 12, wood.base), F(R(2, 2, 20, 1.2, wood.hi)), F(R(2, 12.6, 20, 1.4, wood.sh)), F(R(19.6, 2, 2.4, 12, wood.sh)),
      E(12, 8, 5, 2.8, fish.base), F(E(12.8, 8.8, 3.6, 1.6, fish.sh)), T([[7.4, 8], [4.4, 5.2], [4.4, 10.8]], fish.base), F(E(14.8, 7.2, 0.6, 0.6, '#3a2d4f')), F(E(11, 7, 1.6, 0.5, fish.hi)),
      ...(kind === 'ice' ? [F(T([[3, 2], [5, 2], [4, 5]], '#e8f4ff')), F(T([[15, 2], [17, 2], [16, 4.4]], '#e8f4ff'))] : []),
      ...(kind === 'sky' ? [F(T([[19, 0], [19.8, 2.4], [22, 2.6], [20.2, 3.8], [21, 6], [19, 4.6], [17, 6], [17.8, 3.8], [16, 2.6], [18.2, 2.4]], '#ffe680'))] : []),
    ];
  });
}
function iceHoleArt() {
  return art('fish|icehole', 50, 14, () => {
    const snow = ramp('#eef4ff', 0.6);
    const water = ramp('#5a86d0');
    return [
      E(25, 7, 23, 6, snow.base), F(E(25, 5.6, 21, 4, snow.hi)),
      E(25, 7.4, 16, 4, water.deep), F(E(25, 8, 14.6, 3.2, water.base)), F(E(21, 7.4, 7, 1, water.hi)),
      F(T([[6, 4], [9, 2.6], [10, 4.6]], '#ffffff')), F(T([[40, 3.6], [43, 2.4], [43.4, 4.4]], '#ffffff')),
    ];
  });
}
function skyPoolArt() {
  return art('fish|skypool', 56, 16, () => {
    const cloud = ramp('#ece6fb', 0.6);
    const night = ramp('#3a2e80');
    return [
      E(28, 8, 27, 7, cloud.base), E(8, 6, 8, 5, cloud.base), E(48, 6, 8, 5, cloud.base), F(E(24, 5, 18, 3, '#ffffff')),
      E(28, 8.4, 20, 5, night.deep), F(E(28, 9, 18.6, 4.2, night.base)), F(E(23, 8.4, 8, 1.2, night.hi)),
    ];
  });
}
function glintArt(c) {
  return art(`fish|glint|${c}`, 7, 7, () => [F(T([[3.5, 0.4], [4.1, 2.9], [6.6, 3.5], [4.1, 4.1], [3.5, 6.6], [2.9, 4.1], [0.4, 3.5], [2.9, 2.9]], c)), F(E(3.5, 3.5, 0.7, 0.7, '#ffffff'))], false);
}
function reedArt() {
  return art('fish|reeds', 12, 20, () => {
    const g = ramp('#86c878');
    return [
      T([[4, 19], [3.4, 6], [4.4, 19]], g.sh), T([[6, 19], [6.6, 3], [7, 19]], g.base), T([[8, 19], [9.6, 8], [8.8, 19]], g.base),
      E(6.6, 4.4, 1, 2.6, '#b4805a'), F(E(6.3, 3.6, 0.4, 1.2, '#d8a978')),
    ];
  });
}
function padArt() {
  return art('fish|pad', 18, 7, () => {
    const g = ramp('#7fd08a');
    return [T([[1, 4], [3, 1.4], [9, 0.6], [15, 1.4], [17, 4], [14, 6], [9.4, 6.4], [9, 3.6], [8.2, 6.4], [4, 6]], g.base), F(T([[9, 3.6], [15, 1.6], [17, 4], [14, 6], [9.4, 6.4]], g.sh)), F(E(5, 2.6, 2.4, 0.8, g.hi)), E(13.6, 2.2, 1.6, 1.2, '#ffc4dc'), F(E(13.4, 1.8, 0.6, 0.5, '#ffffff'))];
  });
}

// The float: a round cork, cherry red over white, with a little antenna; it rides the ripples.
function floatArt() {
  return art('fish|float', 8, 10, () => {
    const red = ramp('#ff6b8a');
    const white = ramp('#fff8fb', 0.6);
    return [
      R(3.6, 0.4, 0.8, 3.4, '#ffd36a'),
      E(4, 6, 3, 3, white.base), F(E(4.6, 6.8, 2, 2, white.sh)),
      T([[1, 6], [1.4, 4.4], [2.6, 3.3], [4, 3], [5.4, 3.3], [6.6, 4.4], [7, 6]], red.base), F(T([[4.6, 3.1], [5.4, 3.3], [6.6, 4.4], [7, 6], [5.2, 6]], red.sh)),
      F(E(2.6, 4.6, 0.8, 0.6, '#ffffff')),
    ];
  }, false);
}

// Cel rings spreading on the water: a lit front edge and a fainter back, `u` 0-1 through its life.
function ripple(ctx, x, y, u, size = 1) {
  const rx = (3 + u * 13) * size;
  const ry = (1 + u * 3) * size;
  ctx.save();
  ctx.globalAlpha = (1 - u) ** 1.3 * 0.85;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.2 * (1 - u * 0.6);
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();
  ctx.globalAlpha *= 0.5;
  ctx.strokeStyle = '#d8f2ff';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 1.1 * Math.PI, 1.9 * Math.PI);
  ctx.stroke();
  ctx.restore();
}

// The line from the rod's tip down to (bx, by): it sags while slack, pulls straight when taut.
function line(ctx, tip, bx, by, slack) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(tip[0], tip[1]);
  ctx.quadraticCurveTo((tip[0] + bx) / 2, Math.max(tip[1], by) + slack, bx, by);
  ctx.stroke();
  ctx.restore();
}

// In front of the hero: the line while fishing (the rod is in her hands, render/hero.js), the float
// riding the water, dipping at a nibble and pulled under at a bite, the catch fought at the surface
// and then swinging on the line under the raised rod; and the hints.
export function drawFishing(ctx, world, cam, time, hx, hy) {
  const f = world.fishing;
  const b = world.body;
  if (!f) {
    if (spotHere(world) && !world.dead) hint(ctx, hx, hy - 70, '▲ Fish');
    const st = world.map.stove;
    if (st != null && Math.abs(st - b.x) < 30 && Math.abs(groundAt(world.map, st) - b.y) < 6) hint(ctx, st - cam.x, groundAt(world.map, st) - cam.y - 78, '▲ Cook');
    return;
  }
  const dir = f.spot.face;
  // Where the hero drew the rod's tip this frame (or near her hand if she wasn't drawn).
  const at = rodTip();
  let tip = [hx + dir * 30, hy - 40];
  if (at) {
    const p = ctx.getTransform().inverse().transformPoint(at);
    tip = [p.x, p.y];
  }
  const bx0 = f.spot.bx - cam.x;
  const by0 = f.spot.by - cam.y;
  const seed = f.spot.bx * 0.013;
  let bx = bx0;
  let by = by0 - 1 + Math.sin(time * 2.4 + seed) * 0.8;
  let show = true;
  if (f.phase === 'cast') {
    // The float flies out on an arc from the tip once the rod whips forward, and lands.
    const u = Math.max(0, Math.min(1, (f.t - 0.22) / 0.28));
    show = f.t > 0.2;
    bx = tip[0] + (bx0 - tip[0]) * u;
    by = tip[1] + (by0 - tip[1]) * u - Math.sin(u * Math.PI) * 26;
  } else if (f.phase === 'wait') {
    const nib = f.nibbles?.find((n) => Math.abs(f.t - n) < 0.2);
    if (nib != null) by += 2.2 * Math.sin(((f.t - nib + 0.2) / 0.4) * Math.PI);
  } else if (f.phase === 'bite') by += 4 + Math.sin(time * 30) * 1.4;
  if (f.phase !== 'cast') {
    for (let k = 0; k < 2; k++) ripple(ctx, bx0, by0 + 1, (((time * 0.5 + k * 0.5 + seed) % 1) + 1) % 1, f.phase === 'bite' ? 1.4 : 1);
  }
  if (f.phase === 'catch' && world.fishCaught) {
    // A tug of war at the surface, the heave, then the fish swinging on the line under the tip.
    const t = f.t / 1.4;
    const icon = itemIcon(world.fishCaught.fish.id);
    let fx;
    let fy;
    let rot;
    if (t < 0.42) {
      fx = bx0 + Math.sin(time * 22) * 3;
      fy = by0 - 1 - Math.abs(Math.sin(time * 9)) * 3;
      rot = Math.sin(time * 18) * 0.6;
      ripple(ctx, bx0, by0 + 1, (time * 2.5) % 1, 1.2);
      line(ctx, tip, fx, fy, 0);
    } else {
      const u = Math.max(0, Math.min(1, (t - 0.42) / 0.16));
      const hang = [tip[0], tip[1] + 14];
      const sw = u >= 1 ? Math.sin((t - 0.58) * 14) * Math.exp(-(t - 0.58) * 3) * 0.6 : 0;
      fx = bx0 + (hang[0] - bx0) * u + Math.sin(sw) * 14;
      fy = by0 + (hang[1] - by0) * u - Math.sin(u * Math.PI) * 26 + (1 - Math.cos(sw)) * 14;
      rot = u < 1 ? -dir * 2.4 * u : (Math.PI / 2) * -dir + Math.sin(time * 16) * 0.25;
      line(ctx, tip, fx, fy - 4, 0);
      if (u < 1) {
        for (let k = 0; k < 4; k++) {
          ctx.globalAlpha = 1 - u;
          ctx.fillStyle = k % 2 ? '#ffffff' : '#bfe8ff';
          ctx.fillRect(fx + Math.cos(k * 1.6) * 6 * u, fy + 4 + k * 2 * u, 1.6, 1.6);
          ctx.globalAlpha = 1;
        }
      }
    }
    ctx.save();
    ctx.translate(fx, fy);
    ctx.rotate(rot);
    blit(ctx, icon, -9, -9, { scale: 1.1 });
    ctx.restore();
    return;
  }
  if (f.phase === 'reel') {
    drawReel(ctx, f, tip, bx0, by0, hx, hy, time);
    return;
  }
  if (show) {
    line(ctx, tip, bx, by - 3, f.phase === 'bite' ? 0 : f.phase === 'miss' ? 22 : 12);
    place(ctx, floatArt(), bx, by + 3);
  }
  if (f.phase === 'bite') {
    // Splash lines kicking up round the float as it's dragged under.
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    for (let k = 0; k < 3; k++) {
      const a = -Math.PI / 2 + (k - 1) * 0.6;
      const r0 = 7 + ((time * 20) % 3);
      ctx.beginPath();
      ctx.moveTo(bx0 + Math.cos(a) * r0, by0 - 2 + Math.sin(a) * r0 * 0.7);
      ctx.lineTo(bx0 + Math.cos(a) * (r0 + 4), by0 - 2 + Math.sin(a) * (r0 + 4) * 0.7);
      ctx.stroke();
    }
    ctx.restore();
  }
  if (f.phase === 'wait') text(ctx, 'Wait for the bite... (Z to hook)', hx, hy - 66, { size: 7, bold: true, align: 'center', color: '#ffffff', outline: 'rgba(58,45,79,0.7)' });
}

// A friend fishing (online): their rod, line and bobber, and a "!" when they've got a bite.
export function drawFriendFishing(ctx, f, hx, hy, cam, time, at = null) {
  // (The rod is in their hands, drawn with them in the same fishing poses as yours; `at` is
  // where its tip was drawn, render/life.js friendFishPose.)
  const dir = f.face;
  let tip = [hx + dir * 30, hy - 40];
  if (at) {
    const p = ctx.getTransform().inverse().transformPoint(at);
    tip = [p.x, p.y];
  }
  const bx = f.bx - cam.x;
  const by = f.by - cam.y - 1 + (f.phase === 'bite' ? 4 + Math.sin(time * 30) * 1.4 : Math.sin(time * 2.4 + f.bx * 0.013) * 0.8);
  if (f.phase === 'cast' || f.phase === 'catch') return;
  for (let k = 0; k < 2; k++) ripple(ctx, f.bx - cam.x, f.by - cam.y + 1, (((time * 0.5 + k * 0.5 + f.bx * 0.013) % 1) + 1) % 1, f.phase === 'bite' ? 1.4 : 1);
  line(ctx, tip, bx, by - 3, f.phase === 'bite' ? 0 : 12);
  place(ctx, floatArt(), bx, by + 3);
}

// A big one on the line (world/fishing.js reel): the line taut to a splash where it thrashes, the
// fish's back breaking the water now and then; over the hero, the tug of war: how much line you've
// won back (the fish swims toward the boat end as you win) and how tight the line is (red near
// the snap), with what to do now.
function drawReel(ctx, f, tip, bx0, by0, hx, hy, time) {
  const r = f.reel;
  const run = r.run > 0;
  const fx = bx0 + Math.sin(time * (run ? 14 : 5)) * (run ? 10 : 4) - (r.got - 0.5) * 10 * f.spot.face;
  const fy = by0 + 2;
  for (let k = 0; k < 3; k++) ripple(ctx, fx, fy, (time * (run ? 3 : 1.5) + k / 3) % 1, run ? 1.6 : 1.2);
  if (Math.sin(time * 3) > 0.6) {
    ctx.fillStyle = f.fish.color;
    ctx.beginPath();
    ctx.ellipse(fx, fy - 2, 10, 3.5, 0, Math.PI, 0);
    ctx.fill();
  }
  ctx.fillStyle = '#ffffff';
  for (let k = 0; k < (run ? 6 : 3); k++) ctx.fillRect(fx + Math.cos(time * 9 + k * 2) * 9, fy - 4 - Math.abs(Math.sin(time * 7 + k)) * 8, 1.6, 1.6);
  line(ctx, tip, fx, fy - 2, 0);
  // The meter.
  const W = 70;
  const x = hx - W / 2;
  const y = hy - 92;
  ctx.fillStyle = 'rgba(58,45,79,0.75)';
  ctx.fillRect(x - 3, y - 3, W + 6, 22);
  // Line won back: a track with the fish on it, swimming toward the rod as you win.
  ctx.fillStyle = '#4fc0c8';
  ctx.fillRect(x, y, W, 6);
  ctx.fillStyle = '#9fe8b0';
  ctx.fillRect(x, y, W * Math.max(0, Math.min(1, r.got)), 6);
  ctx.fillStyle = f.fish.color;
  ctx.beginPath();
  ctx.ellipse(x + W * Math.max(0, Math.min(1, r.got)), y + 3, 4, 2.4, 0, 0, Math.PI * 2);
  ctx.fill();
  // Tension: green, then gold, then red; it shakes when it's near the snap.
  const t = r.tension;
  const shake = t > 0.8 ? Math.sin(time * 60) * 1.2 : 0;
  ctx.fillStyle = '#5a4a6a';
  ctx.fillRect(x + shake, y + 9, W, 5);
  ctx.fillStyle = t > 0.8 ? '#ff5a6a' : t > 0.55 ? '#ffd36b' : '#8fe0a0';
  ctx.fillRect(x + shake, y + 9, W * t, 5);
  const say = run && r.holding ? "It's running! Let go!" : run ? 'Wait it out...' : r.holding ? 'Reeling...' : 'Hold Z to reel!';
  text(ctx, say, hx, y - 6, { size: 7, bold: true, align: 'center', color: run ? '#ffd36b' : '#ffffff', outline: 'rgba(58,45,79,0.8)' });
}
