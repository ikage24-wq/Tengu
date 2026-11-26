// The Lambkin (2026-11-25, remade on the shell crawler base, the player's pick "B" of three, Loftle):
// Clover Hills' level 8 Hayloft Ridge monster: a slow, cosy sage-green tortoise whose shell is his
// own little red hayloft barn: planked walls, a gambrel roof of blue-grey shingles, white trim, a big
// cross-braced door, a round-topped loft door with hay spilling over its sill, a stone footing, and a
// gold star on a weathervane at the peak; a stalk of hay always in the corner of his mouth. Sleepy,
// contented honey eyes under heavy lids. Slow is part of him: he plods at the tortoise's own pace. He
// moves on his own copy of the shell crawler base (tortbase.js: its bones, plod, springs and moves).
//   idle    a 32 s act (see its pose below), only while he stands about:
//           - chewing it over: he chews his hay stalk, gazing up thoughtfully, the stalk bobbing;
//             then a big contented sigh (in, up, and a long happy breath out);
//           - startled: eyes wide, into the barn he goes; the loft doors swing open and his face
//             peeps out of the hayloft window, chewing; the doors shut, he pops back out at the
//             front with hay stuck on his head, pleased, and shakes it off;
//           - a dandelion seed drifts down onto the weathervane's star: he squints up at it, puffs,
//             and it floats away;
//           - the big barn door swings open by itself: a grumpy glance back, a shuffle that bumps
//             the barn, and it slams shut in a little puff of dust; smug;
//           - a yawn and a slow stretch of the neck; then a lazy hay toss: he dips for a tuft and
//             flicks it up in an arc into the open loft.
//   moves   (def.moves order) the barn bash (rocks back, rams with the barn, hay shaken off the
//           roof), the hay-bale toss (rears back, the loft doors burst open, a little bale arcs out
//           and bursts where it lands), the weathervane spin (pulled in, the barn hopping forward
//           while the star whirls and a ring of hay spins round it; out he pops, dizzy).
//   faces   content, thoughtful, startled, squinting up, a grumpy side glance, smug, sleepy,
//           yawning, happy, grumpy and focused before and in a move, dizzy, hurt (squeezed shut),
//           asleep (tucked into the barn, the loft doors shut, a little barn-red "z" from the loft),
//           and soft swirl eyes when he's beaten.
// Everything drawn here from scratch (the face too). No animals of any kind ride along.
import { dressedTort } from './tortbase.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mix = (a, b, u) => a + (b - a) * u;
const sstep = (u) => {
  const v = clamp(u, 0, 1);
  return v * v * (3 - 2 * v);
};
const frac = (v) => v - Math.floor(v);
// (a beat's weight: 0 before t0, eased up to 1 by t1, held to t2, eased back to 0 by t3)
const win = (t, t0, t1, t2, t3) => sstep((t - t0) / (t1 - t0)) * (1 - sstep((t - t2) / (t3 - t2)));
// (a quick soft pulse 0..1..0 over [t0, t0 + d])
const pulse = (t, t0, d) => {
  const u = (t - t0) / d;
  return u > 0 && u < 1 ? Math.sin(Math.PI * u) : 0;
};
// (0..1 through [t0, t0 + d], else -1)
const span = (t, t0, d) => (t >= t0 && t < t0 + d ? (t - t0) / d : -1);
const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
const turn = ([x, y], r) => [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)];
const ell = (ctx, x, y, rx, ry, r = 0) => {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), r, 0, TAU);
};
const sparkle = (ctx, x, y, k) => {
  ctx.beginPath();
  ctx.moveTo(x, y - k);
  ctx.quadraticCurveTo(x, y, x + k, y);
  ctx.quadraticCurveTo(x, y, x, y + k);
  ctx.quadraticCurveTo(x, y, x - k, y);
  ctx.quadraticCurveTo(x, y, x, y - k);
  ctx.fill();
};

const INK = '#8a5844';
const LF = {
  wall: '#e7695a', wallLt: '#f79a7e', wallSh: '#c44e46', wallDeep: '#a63e3c', plank: '#cf5550',
  trim: '#fff6e4', trimSh: '#ead8c0', roof: '#6c9fb0', roofLt: '#9ccbd6', roofSh: '#527f92', stone: '#d9c8b2', stoneSh: '#bfa98e',
  loft: '#6e3c3a', loftDeep: '#4e2a2c', hay: '#f7d36c', hayLt: '#fff0a8', haySh: '#dca844', twine: '#b5683c', gold: '#ffcf4a', goldLt: '#fff4b0', rod: '#8a7060',
  skin: '#b4cc7e', skinLt: '#d8e8aa', lid: '#6c5a2e', lidSkin: '#a9c078', blush: '#ff9a8a', mouth: '#7a3a34', tongue: '#ff8f8a', nostril: '#6f8a48',
  iris0: '#fff0b0', iris1: '#f4b24a', iris2: '#a8642a', pupil: '#4a2c1a', zed: '#c44e46', breath: '#fff6dc', seed: '#ffffff', seedStem: '#c8b89a',
};

// ---------- His face ----------
// Open eyes: [lid (0 wide .. 1 shut), gaze x (+ toward the snout), gaze y (+ down), brow (+ cross,
// - worried), cheek (how far a contented smile pushes up under the eye)].
const EYES = {
  open: [0.32, 0.12, 0, 0, 0.6],
  ponder: [0.4, 0.2, -0.5, 0, 0.45],
  startled: [-0.2, 0.05, -0.05, -0.7, 0],
  squint: [0.58, 0.3, -0.65, 0.35, 0.35],
  side: [0.42, -0.65, 0.05, 0.75, 0.1],
  smug: [0.52, 0.15, 0, -0.15, 0.85],
  sleepy: [0.68, 0.05, 0.15, 0, 0.3],
  grumpy: [0.48, 0.25, 0.05, 1, 0],
  sad: [0.45, 0, 0.25, -0.8, 0],
};
// The eye, sleepy-content: wide under a heavy lid in his own skin colour, a honey iris glowing gold
// at the bottom, a soft glint under the lid and a small one low; the cheek pushed up under it when
// he's content. Closed: an arc (happy), a soft curve (asleep, blinking), a squeeze (hurt, yawning),
// a soft swirl (beaten, dizzy).
function eyeHoney(ctx, a, K, x, y, k, face) {
  const rx = 1.5 * k;
  const ry = 1.65;
  const ink = K.colour(a, LF.lid);
  const shut = (kind) => {
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.38;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    if (kind === 'happy') {
      ctx.moveTo(x - rx, y + ry * 0.25);
      ctx.quadraticCurveTo(x, y - ry * 0.75, x + rx, y + ry * 0.25);
    } else if (kind === 'squeeze') {
      ctx.moveTo(x - rx * 0.9, y - ry * 0.45);
      ctx.quadraticCurveTo(x + rx * 0.1, y - ry * 0.1, x + rx * 0.7, y + ry * 0.02);
      ctx.quadraticCurveTo(x + rx * 0.1, y + ry * 0.14, x - rx * 0.9, y + ry * 0.5);
    } else {
      ctx.moveTo(x - rx, y + ry * 0.15);
      ctx.quadraticCurveTo(x, y + ry * 0.7, x + rx, y + ry * 0.1);
    }
    ctx.stroke();
  };
  if (face === 'hurt' || face === 'yawn') return shut('squeeze');
  if (face === 'sleep' || face === 'blink' || face === 'sigh') return shut('soft');
  if (face === 'happy') return shut('happy');
  if (face === 'dead' || face === 'dizzy') {
    // a soft swirl, turning
    ell(ctx, x, y, rx, ry);
    ctx.fillStyle = K.colour(a, '#fffaf0');
    ctx.fill();
    const sp = (a.t ?? 0) * (face === 'dizzy' ? 9 : 3) * (k < 1 ? -1 : 1);
    ctx.strokeStyle = K.colour(a, LF.iris2);
    ctx.lineWidth = 0.3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= 26; i++) {
      const u = i / 26;
      const q = sp + u * TAU * 2;
      const p = [x + Math.cos(q) * rx * 0.85 * u, y + Math.sin(q) * ry * 0.85 * u];
      if (i) ctx.lineTo(...p);
      else ctx.moveTo(...p);
    }
    ctx.stroke();
    return;
  }
  const [lid0, gx, gy, brow, cheek] = EYES[face] ?? EYES.open;
  ell(ctx, x, y, rx, ry);
  ctx.fillStyle = K.colour(a, '#fffaf0');
  ctx.fill();
  ctx.save();
  ell(ctx, x, y, rx, ry);
  ctx.clip();
  const small = face === 'startled' ? 0.72 : 1;
  const ix = x + rx * (0.1 + gx * 0.3);
  const iy = y + ry * (0.1 + gy * 0.3);
  const g = ctx.createRadialGradient(ix, iy + ry * 0.55, 0, ix, iy, ry * 1.05);
  g.addColorStop(0, K.colour(a, LF.iris0));
  g.addColorStop(0.5, K.colour(a, LF.iris1));
  g.addColorStop(1, K.colour(a, LF.iris2));
  ell(ctx, ix, iy, rx * 0.9 * small, ry * 0.95 * small);
  ctx.fillStyle = g;
  ctx.fill();
  ell(ctx, ix + rx * 0.06, iy - ry * 0.02, rx * 0.36 * small, ry * 0.42 * small);
  ctx.fillStyle = K.colour(a, LF.pupil);
  ctx.fill();
  // the lid: its edge arched, slanting down toward the snout when cross, up when worried
  if (lid0 > -0.1) {
    const lid = y - ry * (1 - lid0 * 1.4);
    const sl = brow * ry * 0.35;
    ctx.beginPath();
    ctx.moveTo(x - rx * 1.4, y - ry * 1.6);
    ctx.lineTo(x + rx * 1.4, y - ry * 1.6);
    ctx.lineTo(x + rx * 1.4, lid + ry * 0.2 + sl);
    ctx.quadraticCurveTo(x, lid - ry * 0.45, x - rx * 1.4, lid + ry * 0.3 - sl);
    ctx.closePath();
    ctx.fillStyle = K.colour(a, LF.lidSkin);
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 0.42;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - rx * 1.05, lid + ry * 0.3 - sl * 0.8);
    ctx.quadraticCurveTo(x, lid - ry * 0.42, x + rx * 1.02, lid + ry * 0.16 + sl * 0.8);
    ctx.stroke();
  }
  // the cheek pushed up under the eye
  if (cheek > 0.05) {
    ctx.beginPath();
    ctx.moveTo(x - rx * 1.4, y + ry * 1.6);
    ctx.lineTo(x - rx * 1.4, y + ry * (1.05 - cheek * 0.45));
    ctx.quadraticCurveTo(x, y + ry * (0.75 - cheek * 0.6), x + rx * 1.4, y + ry * (1.05 - cheek * 0.45));
    ctx.lineTo(x + rx * 1.4, y + ry * 1.6);
    ctx.closePath();
    ctx.fillStyle = K.colour(a, LF.lidSkin);
    ctx.fill();
  }
  ctx.restore();
  // glints
  const top = lid0 > -0.1 ? y - ry * (1 - lid0 * 1.4) : y - ry;
  ctx.fillStyle = '#ffffff';
  ell(ctx, ix - rx * 0.3, Math.max(top + ry * 0.5, iy - ry * 0.45), rx * 0.3, ry * 0.2, -0.12);
  ctx.fill();
  ell(ctx, ix + rx * 0.4, iy + ry * 0.48, rx * 0.12, rx * 0.12);
  ctx.fill();
  // the lower lid (a smile line when the cheek pushes up), a worried or startled brow
  ctx.strokeStyle = ink;
  ctx.lineWidth = 0.3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  const cy = y + ry * (1.0 - cheek * 0.45);
  ctx.moveTo(x - rx * 0.9, cy);
  ctx.quadraticCurveTo(x, cy - ry * (0.15 + cheek * 0.3), x + rx * 0.9, cy);
  ctx.stroke();
  if (brow < -0.3 || brow > 0.6) {
    ctx.lineWidth = 0.36;
    ctx.beginPath();
    const by = y - ry * 1.55;
    ctx.moveTo(x - rx * 0.9, by - brow * 0.35);
    ctx.quadraticCurveTo(x, by - 0.3, x + rx * 0.9, by + brow * 0.35);
    ctx.stroke();
  }
}
// The hay stalk: rooted inside the corner of his mouth, out and up, bobbing as he chews.
function straw(ctx, a, K, mode, root, ang, len, bob) {
  const q = ang + bob;
  const tip = [root[0] + Math.cos(q) * len, root[1] + Math.sin(q) * len];
  const mid = [root[0] + Math.cos(q + 0.07) * len * 0.55, root[1] + Math.sin(q + 0.07) * len * 0.55];
  ctx.beginPath();
  ctx.moveTo(...root);
  ctx.quadraticCurveTo(...mid, ...tip);
  ctx.lineCap = 'round';
  ctx.strokeStyle = mode === 'line' ? K.colour(a, INK) : K.colour(a, LF.hay);
  ctx.lineWidth = mode === 'line' ? 2.55 : 0.55;
  ctx.stroke();
  // (a little seed-head on the end)
  ell(ctx, tip[0], tip[1], 0.75, 0.42, q);
  if (mode === 'line') K.edge(ctx);
  else {
    ctx.fillStyle = K.colour(a, LF.haySh);
    ctx.fill();
  }
}
function face(ctx, a, sk, K) {
  const L = a.lf ?? {};
  const f = L.face ?? 'open';
  K.soft(ctx, a, [2.4, 1.9], 1.9, f === 'happy' || f === 'smug' ? 0.8 : 0.55, LF.blush);
  eyeHoney(ctx, a, K, 5.3, -1.05, 0.6, f);
  eyeHoney(ctx, a, K, 1.55, -0.7, 1, f);
  // nostrils, the mouth (when the jaw isn't open: the base draws it open)
  ctx.fillStyle = K.colour(a, LF.nostril);
  ell(ctx, 6.0, -0.2, 0.28, 0.2);
  ctx.fill();
  if ((sk.jaw ?? 0) > 0.12) return;
  ctx.strokeStyle = K.colour(a, LF.mouth);
  ctx.lineWidth = 0.38;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (f === 'startled' || f === 'hurt') {
    ell(ctx, 4.7, 2.2, 0.5, 0.6);
    ctx.fillStyle = K.colour(a, LF.mouth);
    ctx.fill();
  } else if (f === 'squint' && L.puff > 0.3) {
    ell(ctx, 5.6, 1.8, 0.4, 0.4);
    ctx.fillStyle = K.colour(a, LF.mouth);
    ctx.fill();
  } else if (f === 'grumpy' || f === 'side' || f === 'sad') {
    ctx.moveTo(5.6, 2.0);
    ctx.quadraticCurveTo(4.4, f === 'sad' ? 1.6 : 1.9, 3.2, 2.2);
    ctx.stroke();
  } else {
    ctx.moveTo(5.7, 1.6);
    ctx.quadraticCurveTo(4.6, f === 'happy' || f === 'smug' ? 2.9 : 2.6, 3.1, 1.9);
    ctx.stroke();
  }
}

// ---------- His barn ----------
// The barn's outline (his shell), front first, over the roof and back under; the roof's cap.
const RING = [[11.8, 6.4], [12.4, 1.6], [12.3, -2.6], [11.8, -4.0], [9.4, -8.4], [8.4, -9.6], [3.4, -12.6], [0, -13.2], [-3.4, -12.6], [-8.4, -9.6], [-9.4, -8.4], [-11.8, -4.0], [-12.4, -2.6], [-12.6, 1.6], [-12.0, 6.4], [-6.5, 7.7], [0, 8.0], [6.5, 7.7]];
const ROOF = [[14.2, -1.4], [13.4, -2.6], [10.6, -8.8], [9.6, -10.2], [3.6, -14.0], [0, -14.8], [-3.6, -14.0], [-9.6, -10.2], [-10.6, -8.8], [-13.6, -2.6], [-14.4, -1.4], [-12.4, -2.2], [-9.2, -6.6], [-6.8, -8.2], [-2.6, -10.4], [0, -10.8], [2.6, -10.4], [6.8, -8.2], [9.2, -6.6], [12.2, -2.2]];
const LOFT = [-2.2, -9.4, 2.2, -5.4];
const DOOR = [-4.4, -2.4, 3.6, 5.2];
const VANE = [0, -18.6];
// (the barn's frame points in the rig's own space, for effects)
const inRig = (a, p) => {
  const sk = a.bk;
  return sk.X(add(sk.sc, turn(p, sk.ang)));
};
// A gold star (the weathervane's), turned edge-on as it spins.
function star(ctx, a, K, mode, x, y, r, an) {
  const sx = Math.cos(an);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(Math.max(0.22, Math.abs(sx)), 1);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * 0.45 : r;
    const q = -Math.PI / 2 + (i * Math.PI) / 5;
    ctx.lineTo(Math.cos(q) * rr, Math.sin(q) * rr);
  }
  ctx.closePath();
  if (mode === 'line') {
    ctx.lineJoin = 'round';
    K.edge(ctx);
  } else {
    ctx.fillStyle = K.colour(a, sx > 0 ? LF.gold : '#f0b030');
    ctx.fill();
    ell(ctx, -r * 0.2, -r * 0.25, r * 0.3, r * 0.24);
    ctx.fillStyle = K.colour(a, LF.goldLt);
    ctx.fill();
  }
  ctx.restore();
}
function barn(ctx, a, mode, K) {
  const L = a.lf ?? {};
  const roofPath = () => {
    ctx.beginPath();
    K.addShape(ctx, K.loopThrough(ROOF, 4));
  };
  K.shellFrame(ctx, a);
  // the weathervane: a thin rod rooted in the roof's peak, the gold star on top
  const vane = (md) => {
    ctx.beginPath();
    ctx.moveTo(0, -13.8);
    ctx.lineTo(VANE[0], VANE[1]);
    ctx.lineCap = 'round';
    ctx.strokeStyle = md === 'line' ? K.colour(a, INK) : K.colour(a, LF.rod);
    ctx.lineWidth = md === 'line' ? 2.6 : 0.6;
    ctx.stroke();
    // (a little arrow across the rod, turning with the star)
    const c = Math.cos(L.vane ?? 0);
    ctx.beginPath();
    ctx.moveTo(-2.2 * c, -16.4);
    ctx.lineTo(2.2 * c, -16.4);
    ctx.lineWidth = md === 'line' ? 2.5 : 0.5;
    ctx.stroke();
    star(ctx, a, K, md, VANE[0], VANE[1] - 0.3, 1.75, L.vane ?? 0);
  };
  if (mode === 'line') {
    vane('line');
    roofPath();
    K.edge(ctx);
    return;
  }
  vane('fill');
  // the walls: planks, light high on the left, shade low, the roof's shadow under the eaves
  K.shellPath(ctx);
  ctx.fillStyle = K.colour(a, LF.wall);
  ctx.fill();
  ctx.save();
  K.shellPath(ctx);
  ctx.clip();
  ctx.strokeStyle = K.tint(a, LF.wallSh, 0.55);
  ctx.lineWidth = 0.4;
  for (let x = -11.5; x <= 12; x += 2.3) {
    ctx.beginPath();
    ctx.moveTo(x, -14);
    ctx.lineTo(x, 9);
    ctx.stroke();
  }
  K.soft(ctx, a, [-6, -6], 11, 0.55, LF.wallLt);
  K.soft(ctx, a, [2, 9], 10, 0.55, LF.wallDeep);
  ctx.beginPath();
  K.addShape(ctx, K.loopThrough(ROOF.map(([x, y]) => [x * 0.98, y + 1.6]), 4));
  ctx.fillStyle = K.tint(a, LF.wallDeep, 0.45);
  ctx.fill();
  // the stone footing
  ctx.fillStyle = K.colour(a, LF.stone);
  ctx.fillRect(-14, 5.2, 28, 4);
  ctx.fillStyle = K.colour(a, LF.stoneSh);
  for (let i = 0; i < 9; i++) {
    ell(ctx, -11 + i * 2.8 + (i % 2) * 0.5, 6.7 + (i % 2) * 0.5, 1.0, 0.5);
    ctx.fill();
  }
  ctx.fillStyle = K.colour(a, LF.trimSh);
  ctx.fillRect(-14, 5.0, 28, 0.6);
  // the big door: dark inside with hay; the door itself hinged at its back edge, swinging open
  const [d0, dy0, d1, dy1] = DOOR;
  const open = clamp(L.big ?? 0, -0.1, 1);
  if (open > 0.01) {
    // (inside: dark, a heap of hay on the floor)
    ctx.save();
    ctx.beginPath();
    ctx.rect(d0, dy0, d1 - d0, dy1 - dy0);
    ctx.clip();
    ctx.fillStyle = K.colour(a, LF.loftDeep);
    ctx.fillRect(d0, dy0, d1 - d0, dy1 - dy0);
    ctx.fillStyle = K.colour(a, LF.haySh);
    ell(ctx, (d0 + d1) / 2 + 0.6, dy1, 3.2, 1.8);
    ctx.fill();
    ctx.fillStyle = K.colour(a, LF.hay);
    ell(ctx, (d0 + d1) / 2 - 0.4, dy1 + 0.2, 2.4, 1.3);
    ctx.fill();
    ctx.restore();
  }
  const dw = (d1 - d0) * (1 - 0.82 * open);
  ctx.fillStyle = K.colour(a, LF.wallSh);
  ctx.fillRect(d0, dy0, dw, dy1 - dy0);
  ctx.strokeStyle = K.colour(a, LF.trim);
  ctx.lineWidth = 0.85;
  ctx.lineJoin = 'round';
  ctx.strokeRect(d0, dy0, dw, dy1 - dy0);
  ctx.beginPath();
  ctx.moveTo(d0, dy0);
  ctx.lineTo(d0 + dw, dy1);
  ctx.moveTo(d0 + dw, dy0);
  ctx.lineTo(d0, dy1);
  ctx.stroke();
  ctx.strokeStyle = K.colour(a, LF.trimSh);
  ctx.lineWidth = 0.5;
  ctx.strokeRect(d0 - 0.4, dy0 - 0.4, d1 - d0 + 0.8, dy1 - dy0 + 0.4);
  // the corner trim
  ctx.strokeStyle = K.colour(a, LF.trim);
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(11.5, 5);
  ctx.lineTo(11.6, -2.6);
  ctx.moveTo(-11.7, 5);
  ctx.lineTo(-11.8, -2.6);
  ctx.stroke();
  // the hayloft door: open dark inside; his face peeping out in the act
  const rr = [2.2, 2.2, 0.4, 0.4];
  const loftPath = () => {
    ctx.beginPath();
    ctx.roundRect(LOFT[0], LOFT[1], LOFT[2] - LOFT[0], LOFT[3] - LOFT[1], rr);
  };
  loftPath();
  ctx.fillStyle = K.colour(a, LF.loft);
  ctx.fill();
  const peek = L.peek ?? 0;
  if (peek > 0.01) {
    ctx.save();
    loftPath();
    ctx.clip();
    const py = mix(-3.0, -7.4, peek) + Math.sin((a.t ?? 0) * 3) * 0.12;
    ell(ctx, 0.2, py, 2.7, 2.4);
    ctx.fillStyle = K.colour(a, LF.skin);
    ctx.fill();
    K.soft(ctx, a, [-0.4, py - 1.2], 2.2, 0.8, LF.skinLt);
    const pf = ((a.t ?? 0) % 2.6) < 0.12 ? 'blink' : 'smug';
    eyeHoney(ctx, a, K, -0.9, py - 0.3, 0.72, pf);
    eyeHoney(ctx, a, K, 1.25, py - 0.3, 0.72, pf);
    ctx.restore();
    const bob = Math.sin((a.t ?? 0) * 6) * 0.1;
    straw(ctx, a, K, 'line', [1.4, py + 1.3], -0.45, 3.0, bob);
    straw(ctx, a, K, 'fill', [1.4, py + 1.3], -0.45, 3.0, bob);
  }
  // the shutters: two doors, swung out on their hinges as it opens (a rattle in a bash)
  const lo = clamp(L.door ?? 0, 0, 1);
  const rat = L.rattle ?? 0;
  for (const side of [-1, 1]) {
    const hx = side < 0 ? LOFT[0] : LOFT[2];
    const wd = 2.2 * (1 - lo * 0.82) * (1 - rat * 0.15 * (1 + Math.sin((a.t ?? 0) * 40 + side)));
    const xa = side < 0 ? (lo > 0.5 ? hx - wd : hx) : lo > 0.5 ? hx : hx - wd;
    ctx.fillStyle = K.colour(a, lo > 0.5 ? LF.wallSh : LF.plank);
    ctx.beginPath();
    ctx.roundRect(xa, LOFT[1] + 0.1, wd, LOFT[3] - LOFT[1] - 0.1, side < 0 ? [2.2, 0, 0, 0.4] : [0, 2.2, 0.4, 0]);
    ctx.fill();
    ctx.strokeStyle = K.colour(a, LF.trim);
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
  ctx.strokeStyle = K.colour(a, LF.trim);
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.roundRect(LOFT[0] - 0.4, LOFT[1] - 0.4, LOFT[2] - LOFT[0] + 0.8, LOFT[3] - LOFT[1] + 0.8, [2.6, 2.6, 0.5, 0.5]);
  ctx.stroke();
  // hay over the sill: soft tufts and a few loose stalks
  ctx.fillStyle = K.colour(a, LF.hay);
  ctx.beginPath();
  for (const [x, y, rx, ry] of [[-1.6, -5.3, 1.3, 0.8], [0, -5.0, 1.6, 0.95], [1.6, -5.3, 1.3, 0.8]]) {
    ctx.moveTo(x + rx, y);
    ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
  }
  ctx.fill();
  ctx.strokeStyle = K.colour(a, LF.haySh);
  ctx.lineWidth = 0.32;
  ctx.lineCap = 'round';
  const sway = Math.sin((a.t ?? 0) * 1.6) * 0.25;
  for (const [x0, y0, x1, y1] of [[-1.2, -5.0, -2.6, -3.4], [0.4, -4.6, 0.1, -2.9], [1.5, -5.0, 2.8, -3.8]]) {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1 + sway, y1);
    ctx.stroke();
  }
  K.soft(ctx, a, [-0.4, -5.6], 1.6, 0.7, LF.hayLt);
  ctx.restore();
  // the roof: shingle rows, lit high on the left, the shade on the right
  roofPath();
  ctx.fillStyle = K.colour(a, LF.roof);
  ctx.fill();
  ctx.save();
  roofPath();
  ctx.clip();
  ctx.strokeStyle = K.tint(a, LF.roofSh, 0.6);
  ctx.lineWidth = 0.35;
  for (let i = 1; i < 4; i++) {
    ctx.beginPath();
    ROOF.slice(0, 11).forEach(([x, y], j) => (j ? ctx.lineTo : ctx.moveTo).call(ctx, x * (1 - i * 0.03), y + i * 1.15));
    ctx.stroke();
  }
  K.soft(ctx, a, [-5, -12], 7, 0.75, LF.roofLt);
  K.soft(ctx, a, [8, -3], 6, 0.4, LF.roofSh);
  ctx.restore();
}

// ---------- His moves ----------
// The barn bash: rocks back on his heels, then rams forward with the whole barn (a little hop), the
// shutters rattling and hay shaken off the roof; a wobble to settle.
const BASH = {
  name: 'bash',
  anticT: 0.34,
  keys: [
    [0, { x: -0.08, crouch: 0.8, pitch: -10, neck: -0.45, nAng: 6, head: -4, tail: -1 }],
    [0.1, { x: 0.28, hop: 0.12, crouch: 0, pitch: 12, neck: -0.6, hide: 0.35, free: 0.5 }, 'out'],
    [0.2, { x: 0.3, hop: 0, pitch: 4, hide: 0.35, free: 0, crouch: 0.4 }, 'in'],
    [0.34, { x: 0.24, pitch: -3, crouch: 0.15, hide: 0.1 }, 'io'],
    [0.5, { x: 0.14, pitch: 2 }, 'io'],
    [0.82, {}],
  ],
  spark: [0.12],
  sparkAt: 'front',
  dust: [[0.2, 'feet']],
};
// The hay-bale toss: rears back, the loft doors burst open, and with a heave a little twine-tied
// bale arcs out of the loft and bursts where it lands, a short way ahead.
const TOSS = {
  name: 'toss',
  anticT: 0.36,
  keys: [
    [0, { pitch: -10, crouch: 0.55, x: -0.03, nAng: 12, head: -10, neck: -0.2 }],
    [0.1, { pitch: 9, hop: 0.05, crouch: 0, x: 0.03, nAng: -4, head: 6 }, 'out'],
    [0.24, { pitch: 3, x: 0.03 }, 'io'],
    [0.5, { pitch: -1 }, 'io'],
    [0.74, {}],
  ],
};
// The weathervane spin: in he goes; the barn hops forward twice while the star whirls and a ring of
// hay spins round it; out he pops, dizzy for a moment.
const WHIRL = {
  name: 'whirl',
  anticT: 0.3,
  keys: [
    [0, { crouch: 0.6, nAng: 8, neck: -0.3 }],
    [0.1, { hide: 1, crouch: 0 }, 'out'],
    [0.22, { hide: 1, hop: 0.1, x: 0.09, pitch: -3 }, 'out'],
    [0.34, { hide: 1, hop: 0, x: 0.17, pitch: 3 }, 'in'],
    [0.46, { hide: 1, hop: 0.1, x: 0.27, pitch: -3 }, 'out'],
    [0.58, { hide: 1, hop: 0, x: 0.33, pitch: 4 }, 'in'],
    [0.8, { hide: 0.3, x: 0.24, pitch: -2, nAng: 4 }, 'io'],
    [1.04, {}],
  ],
  spark: [0.58],
  sparkAt: 'shellfront',
  dust: [[0.34, 'feet'], [0.58, 'feet']],
};

// ---------- His act ----------
const CYCLE = 32;
const LOOK = {
  kind: 'tortoise',
  ink: INK,
  quietIdle: true,
  P: {
    speed: 9,
    shell: { ring: RING, rim: [[12.2, 5.0], [6.4, 5.1], [0, 5.1], [-6.6, 5.1], [-12.5, 5.0]], standY: -12.6 },
    legs: { foreN: { hip: [7.4, 4.4], fx: 0.6 }, foreF: { hip: [5.2, 3.6], fx: 0.6 }, hindN: { hip: [-8.2, 4.4], fx: -0.5 }, hindF: { hip: [-10.2, 3.6], fx: -0.5 } },
    leg: { l1: 3.6, l2: 3.6, wF: 5.0, wH: 5.4, foot: [6.4, 2.4] },
    neck: { root: [5, 1.6], open: [11.2, 2.6], ang: -24, ext: 8.0, inExt: -8.4, peekExt: -1.6, w: 5.4 },
    head: { skull: [0, 0, 5.4, 4.7], snout: [3.0, 0.8, 3.3, 3.1], tilt: 2, nostril: [6.0, -0.2] },
    tail: { root: [-12.2, 5.4], len: 3, w: 2.4, ang: 152 },
    moves: ['bash', 'toss', 'whirl'],
  },
  C: { lt: LF.skinLt, base: LF.skin, sh: '#96b066', deep: '#7a944e', guide: '#96b066', nose: LF.nostril, mouth: LF.mouth },
  moves: { bash: BASH, toss: TOSS, whirl: WHIRL },
  face,
  over: {
    shell: (ctx, a, mode, K) => barn(ctx, a, mode, K),
    head: (ctx, a, mode, K) => {
      const L = a.lf ?? {};
      K.headFrame(ctx, a);
      // the hay stalk from the corner of his mouth (not while he peeps from the loft)
      if ((L.peek ?? 0) < 0.5) straw(ctx, a, K, mode, [3.4, 2.2], -0.32 + (L.strawUp ?? 0), 5.4, L.bob ?? 0);
      // a tuft held in his mouth for the lazy toss
      if ((L.tuft ?? 0) > 0.05) {
        ctx.globalAlpha *= Math.min(1, L.tuft * 2);
        for (const [an, l] of [[0.5, 3.2], [0.9, 2.8], [0.2, 2.6]]) {
          straw(ctx, a, K, mode, [5.8, 2.6], an, l, 0);
        }
        ctx.globalAlpha /= Math.min(1, L.tuft * 2);
      }
      // hay stuck on his head after the loft (a little tuft rooted in the crown)
      const k = L.hay ?? 0;
      if (k > 0.02) {
        ctx.globalAlpha *= Math.min(1, k * 2);
        const sh = L.shake ?? 0;
        for (const [x, y, an, l] of [[-1.4, -3.4, -2.1, 3.0], [0.2, -3.9, -1.55, 3.4], [1.6, -3.5, -1.0, 2.6]]) {
          straw(ctx, a, K, mode, [x, y + 0.6], an + sh, l, 0);
        }
      }
    },
  },
  pose: (m, a, out, K, mv, mt) => {
    const st = a.mo.rig;
    const L = { face: 'open', bob: 0, strawUp: 0, peek: 0, door: 0, big: 0, vane: Math.sin((a.t ?? 0) * 0.9) * 0.5, hay: 0, shake: 0, tuft: 0, puff: 0, rattle: 0, sigh: -1, seed: null, slam: -1, flick: -1, bale: -1, burst: -1, whirl: 0, z: 0, lu: -1, mv: mv?.name ?? null, mt };
    a.lf = L;
    const t = a.t ?? 0;
    const napping = m.habit?.kind === 'nap' && (a.now ?? 0) < (m.habit.until ?? 0);
    const mood = m.cine?.mood ?? a.mood;
    // (his act, only while he stands about: eased in and out on a spring, so starting to walk or
    // fight never snaps a pose; never while he walks, fights (or has just fought), naps or is posed
    // in a scene)
    const fighting = (m.aggroUntil ?? 0) > (a.now ?? 0) || (a.now ?? 0) - (m.attackAt ?? -99) < 4 || (a.hurtAgo ?? 9) < 3;
    const goal = clamp((1 - clamp(a.walkW ?? 0, 0, 1)) * (a.moving ? 0 : 1) * (m.pose || m.cine || mv || napping || fighting || m.hp <= 0 ? 0 : 1), 0, 1);
    const dt = clamp(a.dt ?? 0, 0, 0.1);
    st.lfCalm = Number.isFinite(st.lfCalm) ? st.lfCalm + (goal - st.lfCalm) * Math.min(1, dt * 8) : goal;
    const calm = mv ? 0 : st.lfCalm;
    // the hay stalk bobs a little as he breathes
    L.bob = Math.sin(t * 1.7) * 0.04;
    // faces and poses outside the act
    if (m.hp <= 0) L.face = 'dead';
    else if ((a.hurtAgo ?? 9) < 0.45 || mv === K.moves.hurt || mv === K.moves.knockdown) L.face = 'hurt';
    else if (napping || mood === 'sleep') {
      // tucked into the barn, the loft doors shut, a little "z" from the loft
      L.face = 'sleep';
      L.z = 1;
      out.hide = 1;
      out.down = 1;
      out.peek = 0;
      out.lift = Math.sin(t * 0.9) * 0.18;
    } else if (mv && L.mv) {
      // his own moves: grumpy and focused winding up; then each its own
      L.face = 'grumpy';
      if (L.mv === 'bash') {
        L.rattle = mt >= 0.1 && mt < 0.5 ? 1 - (mt - 0.1) / 0.4 : 0;
        L.burst = span(mt, 0.12, 0.5);
        if (mt > 0.45) L.face = 'smug';
      } else if (L.mv === 'toss') {
        L.door = mt < 0 ? sstep(1 + mt / 0.36) : 1 - sstep((mt - 0.5) / 0.2);
        L.bale = span(mt, 0.08, 0.42);
        L.burst = span(mt, 0.5, 0.4);
        if (mt > 0.5) L.face = 'smug';
      } else if (L.mv === 'whirl') {
        L.whirl = mt < 0.1 ? 0 : 1 - sstep((mt - 0.62) / 0.15);
        L.vane += sstep((mt - 0.05) / 0.75) * TAU * 7;
        if (mt > 0.78) L.face = 'dizzy';
      }
    } else if (mv === K.moves.stretch) L.face = 'happy';
    else if (mv) L.face = 'grumpy';
    else if (a.face === 'angry' || mood === 'angry') L.face = 'grumpy';
    else if (mood === 'happy') L.face = 'happy';
    else if (mood === 'sad') L.face = 'sad';
    else if (a.face === 'blink' || (t + (m.uid ?? 0) * 0.37) % 4.6 < 0.13) L.face = 'blink';
    if (mood === 'talk' && m.hp > 0) out.jaw = Math.max(out.jaw ?? 0, Math.max(0, Math.sin(t * 11)) * 0.35);
    if (calm < 0.02) return;
    const lu = (((t + ((m.uid ?? 0) % 7) * 4.3) % CYCLE) + CYCLE) % CYCLE;
    L.lu = lu;
    const go = (pose, w) => {
      if (w > 0.001) for (const [k, v] of Object.entries(pose)) out[k] = (out[k] ?? 0) + (v - (out[k] ?? 0)) * w;
    };
    const say = (f, w) => {
      if (w > 0.4) L.face = f;
    };
    // 1. chewing it over: gazing up, chewing his stalk (it bobs and wags); then a big contented
    //    sigh: a breath in (up he rises), a long one out (he sinks, eyes shut, a soft puff)
    const chew = win(lu, 0.4, 0.8, 3.4, 3.8) * calm;
    const ch = Math.max(0, Math.sin(lu * 7.5));
    go({ nAng: 10, head: -6 }, chew);
    out.jaw = Math.max(out.jaw ?? 0, chew * ch * 0.16);
    L.bob += chew * Math.sin(lu * 7.5) * 0.18;
    say('ponder', chew);
    const inhale = win(lu, 3.8, 4.4, 4.6, 4.9) * calm;
    const exhale = win(lu, 4.7, 5.1, 6.0, 6.6) * calm;
    go({ lift: 1.2, nAng: 16, head: -10, neck: 0.25 }, inhale);
    go({ crouch: 0.45, nAng: -4, head: 8, neck: -0.1 }, exhale);
    if (inhale > 0.4) L.face = 'open';
    say('sigh', exhale);
    L.sigh = span(lu, 4.8, 1.6);
    // 2. startled: eyes wide, into the barn; the loft doors swing open, his face peeps out chewing;
    //    the doors shut, out he pops at the front with hay on his head; a shake and it's off
    const jump = win(lu, 7.4, 7.55, 7.9, 8.1) * calm;
    const hide = win(lu, 7.85, 8.25, 11.4, 11.9) * calm;
    out.lift += jump * 1.2;
    go({ nAng: -6, head: -4 }, jump);
    say('startled', jump);
    out.hide = Math.max(out.hide ?? 0, hide);
    L.door = Math.max(L.door, win(lu, 8.6, 9.0, 10.9, 11.2) * calm);
    L.peek = win(lu, 9.0, 9.5, 10.6, 10.95) * calm;
    const popped = win(lu, 11.7, 12.0, 13.4, 13.8) * calm;
    go({ neck: 0.35, nAng: 12, head: -8 }, popped);
    say('happy', popped);
    L.hay = win(lu, 11.6, 11.8, 13.4, 13.9) * calm;
    const shake = win(lu, 13.2, 13.35, 13.75, 13.9) * calm;
    out.head += shake * Math.sin(lu * 38) * 9;
    L.shake = shake * Math.sin(lu * 38) * 0.6;
    say('blink', shake);
    // 3. a dandelion seed drifts down onto the weathervane's star: he squints up at it, puffs, and
    //    off it floats
    L.seed = span(lu, 14.4, 6.2);
    const up = win(lu, 15.6, 16.2, 18.6, 19.2) * calm;
    go({ nAng: 26, head: -24, neck: 0.3 }, up);
    say('squint', up);
    L.puff = pulse(lu, 18.0, 0.5) * calm;
    say('happy', win(lu, 19.3, 19.5, 20.2, 20.5) * calm);
    // 4. the big barn door swings open by itself: a grumpy glance back; a shuffle bumps the barn
    //    and it slams shut in a puff of dust; smug
    const dOpen = sstep((lu - 21.0) / 0.9) * (1 - sstep((lu - 23.6) / 0.12));
    L.big = dOpen * calm + (lu > 23.72 && lu < 24.2 ? -0.08 * Math.sin(((lu - 23.72) / 0.48) * Math.PI * 2) * calm : 0);
    say('side', win(lu, 21.6, 21.8, 22.8, 23.0) * calm);
    const shuffle = win(lu, 22.9, 23.1, 23.5, 23.75) * calm;
    go({ x: -0.06, pitch: 6, crouch: 0.3 }, shuffle);
    const bump = pulse(lu, 23.5, 0.25) * calm;
    out.pitch -= bump * 7;
    out.lift += bump * 0.8;
    say('grumpy', shuffle);
    L.slam = span(lu, 23.62, 0.6);
    say('smug', win(lu, 23.8, 24.0, 24.9, 25.2) * calm);
    // 5. a yawn and a slow stretch of the neck; then a lazy hay toss: he dips for a tuft and flicks
    //    it up in an arc into the open loft
    const yawn = win(lu, 25.4, 26.3, 27.0, 27.6) * calm;
    go({ neck: 1.1, nAng: 24, head: -16, lift: 0.8, jaw: 0.7 }, yawn);
    say('yawn', yawn);
    say('sleepy', win(lu, 27.5, 27.6, 28.0, 28.1) * calm);
    const dip = win(lu, 28.0, 28.5, 28.8, 29.05) * calm;
    go({ nAng: -22, head: 18, neck: 0.4, jaw: 0.25 }, dip);
    L.tuft = win(lu, 28.6, 28.7, 29.25, 29.3) * calm;
    const fling = win(lu, 29.0, 29.25, 29.4, 29.9) * calm;
    go({ nAng: 30, head: -26, neck: 0.3 }, fling);
    L.flick = span(lu, 29.28, 0.6);
    L.door = Math.max(L.door, win(lu, 28.2, 28.6, 30.2, 30.6) * calm);
    say('smug', win(lu, 29.9, 30.1, 30.9, 31.2) * calm);
  },
  // Effects, in the barn's frame and in the rig's own space: the sigh's puff, the seed on the
  // star, the slammed door's dust, the tossed tuft, the bale, the bash's hay, the whirl of hay, the
  // nap's "z".
  fx: (ctx, m, a, S, K) => {
    const L = a.lf;
    if (!L) return;
    const sk = a.bk;
    const t = a.t ?? 0;
    ctx.save();
    // the sigh: a soft little breath curling out of his mouth and fading
    if (L.sigh >= 0) {
      const u = L.sigh;
      const mo = sk.X(sk.mouth);
      ctx.globalAlpha = Math.sin(Math.PI * u) * 0.85;
      ctx.strokeStyle = LF.breath;
      ctx.lineWidth = 0.9;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let i = 0; i <= 12; i++) {
        const v = i / 12;
        const p = [mo[0] + 1 + v * (3 + u * 5), mo[1] - v * 2 - u * 2 + Math.sin(v * 7 + u * 4) * 0.8];
        if (i) ctx.lineTo(...p);
        else ctx.moveTo(...p);
      }
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      sparkle(ctx, mo[0] + 4 + u * 6, mo[1] - 3 - u * 3, 0.9);
    }
    // the seed: drifting down onto the star, sitting, then puffed off up and away
    if (L.seed >= 0) {
      const u = L.seed * 6.2;
      const vane = inRig(a, [VANE[0], VANE[1] - 2.2]);
      let p;
      let al = 1;
      if (u < 1.6) {
        const v = sstep(u / 1.6);
        p = [mix(vane[0] + 9, vane[0], v) + Math.sin(u * 5) * (1 - v) * 1.2, mix(vane[1] - 5, vane[1], v)];
        al = Math.min(1, u * 3);
      } else if (u < 3.65) p = [vane[0], vane[1] + Math.sin(u * 4) * 0.15];
      else {
        const v = (u - 3.65) / 2.55;
        p = [vane[0] - v * 10 + Math.sin(v * 9) * 1.2, vane[1] - v * 7];
        al = 1 - sstep((v - 0.6) / 0.4);
      }
      ctx.globalAlpha = al;
      ctx.fillStyle = 'rgba(200,184,154,0.45)';
      ell(ctx, p[0], p[1] - 0.3, 2.0, 1.5);
      ctx.fill();
      ctx.strokeStyle = LF.seedStem;
      ctx.lineWidth = 0.4;
      ctx.beginPath();
      ctx.moveTo(p[0], p[1]);
      ctx.lineTo(p[0], p[1] + 1.6);
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.32;
      for (let i = 0; i < 7; i++) {
        const q = -Math.PI + (i / 6) * Math.PI;
        ctx.beginPath();
        ctx.moveTo(p[0], p[1]);
        ctx.lineTo(p[0] + Math.cos(q) * 1.5, p[1] + Math.sin(q) * 1.5);
        ctx.stroke();
      }
      ell(ctx, p[0], p[1] + 1.7, 0.35, 0.45);
      ctx.fillStyle = LF.seedStem;
      ctx.fill();
      // (his puff: three short soft lines from the mouth, up toward the star)
      if (L.puff > 0.05) {
        const mo = sk.X(sk.mouth);
        ctx.globalAlpha = L.puff;
        ctx.strokeStyle = LF.breath;
        ctx.lineWidth = 0.7;
        for (const q of [-1.2, -0.95, -0.7]) {
          const r0 = 2 + (1 - L.puff) * 3;
          ctx.beginPath();
          ctx.moveTo(mo[0] + Math.cos(q) * r0, mo[1] + Math.sin(q) * r0);
          ctx.lineTo(mo[0] + Math.cos(q) * (r0 + 2), mo[1] + Math.sin(q) * (r0 + 2));
          ctx.stroke();
        }
      }
    }
    // the slammed door: two soft puffs of dust at its foot, a little sparkle
    if (L.slam >= 0) {
      const u = L.slam;
      const c = inRig(a, [DOOR[0] + 2, DOOR[3]]);
      for (const dx of [-1, 1]) {
        ctx.globalAlpha = (1 - u) * 0.8;
        ctx.fillStyle = '#f6efe2';
        ell(ctx, c[0] + dx * (2 + u * 4), c[1] - 0.5 - u * 1.5, 1.2 + u * 1.2, 0.9 + u * 0.8);
        ctx.fill();
      }
      ctx.globalAlpha = Math.sin(Math.PI * u);
      ctx.fillStyle = LF.goldLt;
      sparkle(ctx, c[0] + 5, c[1] - 6 - u * 2, 1.1);
    }
    // the lazy toss: the tuft arcs from his mouth up into the loft
    if (L.flick >= 0) {
      const u = sstep(L.flick);
      const from = sk.X(sk.mouth);
      const to = inRig(a, [0, -7.2]);
      const p = [mix(from[0], to[0], u), mix(from[1], to[1], u) - Math.sin(Math.PI * u) * 7];
      ctx.globalAlpha = 1 - sstep((L.flick - 0.8) / 0.2);
      ctx.save();
      ctx.translate(...p);
      ctx.rotate(-u * 5);
      ctx.strokeStyle = INK;
      ctx.lineCap = 'round';
      for (const [w, col] of [[2.4, INK], [0.6, LF.hay]]) {
        ctx.strokeStyle = col;
        ctx.lineWidth = w;
        for (const q of [-0.5, 0, 0.5]) {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(q) * 2.4, Math.sin(q) * 2.4);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
    // the bale: a little twine-tied bale arcing out of the loft, landing a short way ahead
    if (L.bale >= 0) {
      const u = L.bale;
      const from = inRig(a, [0, -7.2]);
      const land = [sk.X(sk.sc)[0] + 35, -2];
      const p = [mix(from[0], land[0], u), mix(from[1], land[1], u) - Math.sin(Math.PI * u) * 17];
      ctx.globalAlpha = 1;
      ctx.save();
      ctx.translate(...p);
      ctx.rotate(u * 4);
      ctx.beginPath();
      ctx.roundRect(-2.8, -2, 5.6, 4, 1.1);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.fillStyle = LF.hay;
      ctx.fill();
      ctx.fillStyle = LF.hayLt;
      ctx.fillRect(-2.4, -1.6, 4.4, 1.1);
      ctx.strokeStyle = LF.twine;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(-1.1, -2);
      ctx.lineTo(-1.1, 2);
      ctx.moveTo(1.1, -2);
      ctx.lineTo(1.1, 2);
      ctx.stroke();
      ctx.restore();
    }
    // the burst where a bale lands, or the hay shaken off the roof in a bash: stalks and sparkles
    if (L.burst >= 0) {
      const u = L.burst;
      const c = L.mv === 'toss' ? [sk.X(sk.sc)[0] + 35, -2] : inRig(a, [10, -9]);
      for (let i = 0; i < 7; i++) {
        const q = -Math.PI * (0.1 + (i / 6) * 0.8);
        const r = 2 + sstep(u) * (L.mv === 'toss' ? 7 : 5);
        const p = [c[0] + Math.cos(q) * r, c[1] + Math.sin(q) * r + u * u * 4];
        ctx.globalAlpha = 1 - sstep((u - 0.5) / 0.5);
        ctx.strokeStyle = i % 2 ? LF.hay : LF.haySh;
        ctx.lineWidth = 0.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p[0], p[1]);
        ctx.lineTo(p[0] + Math.cos(q + 1.2 + u * 3) * 1.8, p[1] + Math.sin(q + 1.2 + u * 3) * 1.8);
        ctx.stroke();
        if (i % 2 === 0) {
          ctx.fillStyle = i % 4 ? '#ffffff' : LF.goldLt;
          sparkle(ctx, p[0], p[1] - 1, 0.9 * (1 - u * 0.5));
        }
      }
    }
    // the whirl: a ring of hay and sparkles spinning round the barn
    if (L.whirl > 0.02) {
      const c = inRig(a, [0, -2]);
      const sp = t * 12;
      ctx.globalAlpha = L.whirl;
      for (let i = 0; i < 14; i++) {
        const q = sp + (i / 14) * TAU;
        const back = Math.sin(q) < 0;
        const p = [c[0] + Math.cos(q) * 17, c[1] + Math.sin(q) * 4 - 4];
        ctx.globalAlpha = L.whirl * (back ? 0.45 : 1);
        if (i % 3 === 0) {
          ctx.fillStyle = '#ffffff';
          sparkle(ctx, p[0], p[1], 1.1);
        } else {
          ctx.strokeStyle = i % 2 ? LF.hay : LF.haySh;
          ctx.lineWidth = 0.9;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(p[0] - Math.sin(q) * 1.6, p[1] + Math.cos(q) * 0.5);
          ctx.lineTo(p[0] + Math.sin(q) * 1.6, p[1] - Math.cos(q) * 0.5);
          ctx.stroke();
        }
      }
    }
    // napping: a little barn-red "z" drifting up out of the loft
    if (L.z > 0) {
      const lo = inRig(a, [1.6, -8]);
      for (let i = 0; i < 2; i++) {
        const u = frac(t * 0.32 + i * 0.5);
        const k = 0.75 + u * 0.45;
        const x = lo[0] + 2 + u * 4 + Math.sin(u * 5) * 0.6;
        const y = lo[1] - 1 - u * 7;
        ctx.globalAlpha = Math.sin(Math.PI * u);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        for (const [w, col] of [[k * 0.8, '#ffffff'], [k * 0.4, LF.zed]]) {
          ctx.strokeStyle = col;
          ctx.lineWidth = w;
          ctx.beginPath();
          ctx.moveTo(x - k, y - k);
          ctx.lineTo(x + k, y - k);
          ctx.lineTo(x - k, y + k);
          ctx.lineTo(x + k, y + k);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  },
};

export const LAMBKIN = dressedTort(LOOK);
LAMBKIN.art.noHop = true;
