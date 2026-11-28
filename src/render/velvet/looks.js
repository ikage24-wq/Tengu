// Madame Velvet's cast looks (2026-11-28, her new fight, world/manor.js): each telegraph drawn whole in
// her own look (no plain floor marker under it: render/bossfx.js OWN_WARN), while its cast winds up
// (`warn`, p 0..1 through the warning), and in place of the plain flash as it lands (`hit`, u 0..1 over
// its hold), in her colours: plum velvet, white linen, silver plate, gold, lilac dust. render/dreamfx.js
// hands each zone with one of these looks to them. Every shape is rounded, outlined in a deeper shade of
// its own colour, eased.
//   vvRunner   No Muddy Boots! (a band from her to the wall): her plum runner unrolling along the floor,
//              its gold fringe and woven lozenges, the roll riding ahead; landing, the carpet snaps up
//              in a wave from end to end with puffs of dust
//   vvTea      Tea Is Served (a marker on each of you): a cup and saucer over you tipping, steam curling,
//              a pool of tea warming on the floor round you; landing, the splash and a burst of steam
//   vvInspect  Spotless Inspection (the floor in front of her): a lilac gaze from her spectacles over the
//              floor, a magnifying glass sliding along it; landing, a bright "spotless!" flash, glints
//   vvPour     Scalding Pour (the tank's marker): her silver teapot over the tank, tipping, the stream
//              starting; landing, a scald of tea and a column of steam
//   vvDust     Dusting, High... (round her): lilac feathers whirling round at shoulder height, dust
//              motes; landing, a ring of dust puffing out
//   vvDustLow  ...and Low! (a ring with a safe middle): dust rolling low along the floor everywhere
//              past her skirts, her reach clean and lit; landing, the dust bursting up
//   vvKeys     The Keys, Please! (a stack): the manor's key ring turning over the marked one, keys
//              jingling, a gold ring on the floor with a keyhole at its heart; landing, the clink: gold
//   vvPolish   Polish! (the whole floor): the floor gleaming wetter and wetter, shine streaks sliding
//              along it, soap bubbles rising; landing, a gleam sweeping the floor end to end
//   vvRules    House Rules (everyone): a scroll unrolling over her head, its lines writing themselves;
//              landing, her seal stamped on it and a ring of plum rolling out over the room

import { glow, pen, sparkle, ell, hash, sstep, clamp, TAU } from '../marigold/fx.js';

const PLUM = ['#d8a0cc', '#a65a92', '#7e3a6c', '#52234a'];
const LINEN = ['#ffffff', '#f6f2fa', '#e4dcee', '#b8a8cc'];
const SILVER = ['#ffffff', '#dcd8ec', '#a8a4c0', '#6e6890'];
const GOLD = ['#fff2b4', '#f2c868', '#c8963c', '#8a6220'];
const TEA = ['#f6c890', '#d88a4a', '#a8582c'];
const DUST = ['#f2ecff', '#d8cdf2', '#b4a6dc'];
const ease = (u) => 1 - (1 - clamp(u, 0, 1)) ** 3;

// A soft flat floor ring: a filled ellipse with a rim in a deeper shade of its own colour.
function floorRing(ctx, x, y, rx, fill, rim, al, w = 1.6) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, rx, rx * 0.26);
  ctx.fillStyle = fill;
  ctx.fill();
  pen(ctx, rim, w);
  ctx.stroke();
  ctx.restore();
}
// A puff of dust: three soft overlapping rounds.
function puff(ctx, x, y, r, al, col = DUST[1]) {
  if (al <= 0.01 || r <= 0.2) return;
  ctx.save();
  ctx.globalAlpha *= al;
  for (const [dx, dy, k] of [[-0.5, 0.1, 0.8], [0.45, 0.15, 0.75], [0, -0.3, 1]]) {
    ell(ctx, x + dx * r, y + dy * r, r * k, r * k * 0.85);
    ctx.fillStyle = col;
    ctx.fill();
  }
  ell(ctx, x - r * 0.2, y - r * 0.45, r * 0.4, r * 0.25);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fill();
  ctx.restore();
}
// A teacup on its saucer, tipped by `tilt`.
function teacup(ctx, x, y, s, tilt, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.scale(s, s);
  ell(ctx, 0, 5, 9, 2.2);
  pen(ctx, SILVER[3], 1.4);
  ctx.stroke();
  ctx.fillStyle = LINEN[1];
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-6, -3);
  ctx.lineTo(6, -3);
  ctx.quadraticCurveTo(5.4, 4.4, 0, 4.6);
  ctx.quadraticCurveTo(-5.4, 4.4, -6, -3);
  ctx.closePath();
  pen(ctx, SILVER[3], 1.4);
  ctx.stroke();
  ctx.fillStyle = LINEN[0];
  ctx.fill();
  ctx.fillStyle = PLUM[2];
  ctx.fillRect(-5.8, -1, 11.6, 1.2);
  ell(ctx, 0, -3, 6, 1.3);
  ctx.fillStyle = TEA[1];
  ctx.fill();
  pen(ctx, GOLD[2], 0.8);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(7, 0.4, 2.2, -1.3, 1.3);
  pen(ctx, SILVER[2], 1.2);
  ctx.stroke();
  ell(ctx, -3, 0.6, 1, 2.2, 0.2);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fill();
  ctx.restore();
}
// Steam: soft rising curls.
function steam(ctx, x, y, n, time, al, h = 24) {
  for (let i = 0; i < n; i++) {
    const v = (time * 0.6 + i / n) % 1;
    ctx.save();
    ctx.globalAlpha *= al * Math.sin(Math.PI * v) * 0.6;
    ell(ctx, x + Math.sin(v * 6 + i * 2) * 4, y - v * h, 2.4 + v * 3, 2 + v * 2.4);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
  }
}

// ---------- No Muddy Boots! ----------
function runnerWarn(ctx, z, x, y, p, time) {
  const w = z.w;
  const dir = z.dir ?? 1;
  const u = ease(p * 1.15);
  const len = w * u;
  const x0 = dir > 0 ? x : x + w - len;
  ctx.save();
  // the carpet: plum, a gold fringe along each edge, woven lozenges down its middle
  ctx.beginPath();
  ctx.roundRect(x0, y - 5, len, 10, 3);
  pen(ctx, PLUM[3], 2);
  ctx.stroke();
  ctx.fillStyle = PLUM[2];
  ctx.fill();
  ctx.save();
  ctx.clip();
  const g = ctx.createLinearGradient(0, y - 5, 0, y + 5);
  g.addColorStop(0, 'rgba(255,220,240,0.35)');
  g.addColorStop(1, 'rgba(60,20,50,0.3)');
  ctx.fillStyle = g;
  ctx.fillRect(x0, y - 5, len, 10);
  ctx.strokeStyle = GOLD[1];
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(x0, y - 3.4);
  ctx.lineTo(x0 + len, y - 3.4);
  ctx.moveTo(x0, y + 3.4);
  ctx.lineTo(x0 + len, y + 3.4);
  ctx.stroke();
  for (let lx = x0 + 6; lx < x0 + len - 4; lx += 16) {
    ctx.beginPath();
    ctx.moveTo(lx, y);
    ctx.lineTo(lx + 4, y - 2.2);
    ctx.lineTo(lx + 8, y);
    ctx.lineTo(lx + 4, y + 2.2);
    ctx.closePath();
    ctx.fillStyle = PLUM[0];
    ctx.fill();
  }
  ctx.restore();
  // (the fringe at each end)
  ctx.strokeStyle = GOLD[2];
  ctx.lineWidth = 0.8;
  for (const ex of dir > 0 ? [x0] : [x0 + len]) {
    for (let k = -4; k <= 4; k += 2) {
      ctx.beginPath();
      ctx.moveTo(ex, y + k);
      ctx.lineTo(ex - dir * 3, y + k + 0.6);
      ctx.stroke();
    }
  }
  // the roll riding ahead of it
  if (u < 0.999) {
    const rx = dir > 0 ? x0 + len : x0;
    ell(ctx, rx, y - 4, 6, 7);
    pen(ctx, PLUM[3], 2);
    ctx.stroke();
    ctx.fillStyle = PLUM[1];
    ctx.fill();
    ctx.beginPath();
    ctx.arc(rx, y - 4, 3.4, time * 6 * dir, time * 6 * dir + 4.6);
    pen(ctx, PLUM[3], 1);
    ctx.stroke();
  }
  // a muddy boot print or two along it, frowned at
  ctx.globalAlpha = 0.5 + 0.5 * p;
  for (let i = 0; i < 3; i++) {
    const fx = x0 + len * (0.2 + i * 0.3);
    if (fx > x0 + len - 6) continue;
    ell(ctx, fx, y - 0.4, 2.6, 1.2, 0.2);
    ctx.fillStyle = 'rgba(90,60,50,0.55)';
    ctx.fill();
  }
  ctx.restore();
}
function runnerHit(ctx, z, x, y, u, e, fade, time) {
  const w = z.w;
  const dir = z.dir ?? 1;
  ctx.save();
  ctx.globalAlpha *= fade;
  // the carpet snapping up in a wave travelling along it
  ctx.beginPath();
  const pts = [];
  for (let i = 0; i <= 40; i++) {
    const v = i / 40;
    const along = dir > 0 ? v : 1 - v;
    const crest = Math.exp(-(((along - e * 1.2) * 6) ** 2));
    pts.push([x + v * w, y - crest * 22]);
  }
  ctx.moveTo(...pts[0]);
  for (const q of pts.slice(1)) ctx.lineTo(...q);
  ctx.lineCap = 'round';
  pen(ctx, PLUM[3], 12);
  ctx.stroke();
  pen(ctx, PLUM[2], 8);
  ctx.stroke();
  pen(ctx, GOLD[1], 1.2);
  ctx.stroke();
  ctx.restore();
  for (let i = 0; i < 8; i++) {
    const v = (i + 0.5) / 8;
    const along = dir > 0 ? v : 1 - v;
    const k = clamp((e * 1.2 - along) * 4, 0, 1);
    puff(ctx, x + v * w, y - 6 - k * 10, 4 + k * 5, fade * Math.sin(Math.PI * k));
  }
}

// ---------- Tea Is Served ----------
function teaWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r * (0.5 + 0.5 * ease(p)), 'rgba(246,200,144,0.32)', 'rgba(168,88,44,0.9)', 0.6 + 0.4 * p, 1.6);
  steam(ctx, x - r * 0.4, y - 2, 2, time, p, 16);
  steam(ctx, x + r * 0.4, y - 2, 2, time + 0.5, p, 16);
  const cy = y - 62 + Math.sin(time * 3 + z.x) * 2;
  teacup(ctx, x, cy, 1.1, -0.15 - p * 0.55, 0.6 + 0.4 * p);
  steam(ctx, x - 2, cy - 6, 3, time, 1, 20);
}
function teaHit(ctx, z, x, y, u, e, fade, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r * (1 + e * 0.2), 'rgba(246,200,144,0.4)', 'rgba(168,88,44,1)', fade, 2);
  for (let i = 0; i < 12; i++) {
    const an = Math.PI * (1.1 + (i / 11) * 0.8);
    const d = 6 + e * r * 0.9;
    ctx.save();
    ctx.globalAlpha *= fade;
    ell(ctx, x + Math.cos(an) * d, y - 4 + Math.sin(an) * d * 0.9 + e * e * 10, 2.2, 3, an + Math.PI / 2);
    pen(ctx, TEA[2], 1);
    ctx.stroke();
    ctx.fillStyle = TEA[0];
    ctx.fill();
    ctx.restore();
  }
  for (let i = 0; i < 4; i++) puff(ctx, x + (i - 1.5) * r * 0.4, y - 10 - e * 26 - i * 3, 5 + e * 6, fade * 0.8, '#ffffff');
}

// ---------- Spotless Inspection ----------
function inspectWarn(ctx, z, x, y, p, time) {
  const w = z.w;
  ctx.save();
  // her gaze over the floor: a lilac wash, brighter at its edge, a lens sliding along it
  const g = ctx.createLinearGradient(0, y - 60, 0, y + 4);
  g.addColorStop(0, 'rgba(200,180,255,0)');
  g.addColorStop(1, `rgba(200,180,255,${0.18 + 0.2 * p})`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(x, y - 60, w, 64, 10);
  ctx.fill();
  ell(ctx, x + w / 2, y, w / 2, 6);
  ctx.fillStyle = `rgba(232,224,255,${0.25 + 0.2 * p})`;
  ctx.fill();
  pen(ctx, PLUM[1], 1.6);
  ctx.stroke();
  const lx = x + w * (0.5 + 0.42 * Math.sin(time * 2.2));
  const ly = y - 16;
  ell(ctx, lx, ly, 10, 10);
  ctx.fillStyle = 'rgba(240,236,255,0.35)';
  ctx.fill();
  pen(ctx, GOLD[2], 2.4);
  ctx.stroke();
  pen(ctx, GOLD[0], 0.8);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(lx + 7, ly + 7);
  ctx.lineTo(lx + 15, ly + 15);
  ctx.lineCap = 'round';
  pen(ctx, PLUM[3], 3.4);
  ctx.stroke();
  ell(ctx, lx - 3, ly - 3, 3, 1.6, -0.7);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fill();
  ctx.restore();
  for (let i = 0; i < 4; i++) {
    const v = (time * 0.4 + hash(i + z.x)) % 1;
    sparkle(ctx, x + hash(i * 3.1 + z.x) * w, y - 8 - v * 40, 1.6 * Math.sin(Math.PI * v) * (0.5 + p), 0.9, '#f4f0ff');
  }
}
function inspectHit(ctx, z, x, y, u, e, fade, time) {
  const w = z.w;
  ctx.save();
  ctx.globalAlpha *= fade;
  const g = ctx.createLinearGradient(0, y - 80, 0, y + 4);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(1, 'rgba(240,232,255,0.7)');
  ctx.fillStyle = g;
  ctx.fillRect(x, y - 80, w, 84);
  ctx.restore();
  for (let i = 0; i < 10; i++) sparkle(ctx, x + (i + 0.5) * (w / 10), y - 10 - e * 40 - (i % 3) * 8, 3 * fade, 1, '#ffffff');
}

// ---------- Scalding Pour ----------
function teapot(ctx, x, y, tilt, al) {
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.beginPath();
  ctx.moveTo(-11, 7);
  ctx.quadraticCurveTo(-15, -4, -8, -10);
  ctx.lineTo(8, -10);
  ctx.quadraticCurveTo(15, -4, 11, 7);
  ctx.closePath();
  ctx.moveTo(10, -2);
  ctx.quadraticCurveTo(19, -4, 23, -14);
  ctx.lineTo(25, -13);
  ctx.quadraticCurveTo(21, -1, 11, 4);
  ctx.closePath();
  pen(ctx, SILVER[3], 2);
  ctx.stroke();
  const g = ctx.createLinearGradient(-12, -10, 12, 8);
  g.addColorStop(0, SILVER[0]);
  g.addColorStop(0.5, SILVER[1]);
  g.addColorStop(1, SILVER[2]);
  ctx.fillStyle = g;
  ctx.fill();
  ell(ctx, 0, -11, 7, 2);
  ctx.fillStyle = SILVER[1];
  ctx.fill();
  pen(ctx, SILVER[3], 1);
  ctx.stroke();
  ell(ctx, 0, -14, 2, 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-14, -2, 5, Math.PI * 0.5, Math.PI * 1.5);
  pen(ctx, SILVER[2], 2);
  ctx.stroke();
  ell(ctx, -5, -3, 1.6, 4.4, 0.2);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fill();
  ctx.fillStyle = PLUM[2];
  ctx.fillRect(-12, 1, 24, 1.6);
  ctx.restore();
}
function pourWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r, 'rgba(246,200,144,0.28)', 'rgba(168,88,44,0.95)', 0.6 + 0.4 * p, 2);
  steam(ctx, x, y - 2, 3, time, p, 22);
  const tilt = -0.2 + sstep((p - 0.4) / 0.6) * 0.9;
  const px = x - 14;
  const py = y - 78 + Math.sin(time * 2) * 1.5;
  teapot(ctx, px, py, tilt, 0.6 + 0.4 * p);
  if (p > 0.75) {
    const k = (p - 0.75) / 0.25;
    const sx = px + Math.cos(tilt) * 24 - Math.sin(tilt) * -14;
    const sy = py + Math.sin(tilt) * 24 + Math.cos(tilt) * -14;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(sx + 4, (sy + y) / 2, x, sy + (y - 4 - sy) * k);
    ctx.lineCap = 'round';
    pen(ctx, TEA[2], 4);
    ctx.stroke();
    pen(ctx, TEA[0], 2);
    ctx.stroke();
    ctx.restore();
  }
}
function pourHit(ctx, z, x, y, u, e, fade, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r * (1 + e * 0.25), 'rgba(246,200,144,0.45)', 'rgba(168,88,44,1)', fade, 2.4);
  for (let i = 0; i < 5; i++) puff(ctx, x + (i - 2) * 9, y - 12 - e * 48 - Math.abs(i - 2) * 4, 6 + e * 8, fade * 0.85, '#ffffff');
  for (let i = 0; i < 10; i++) {
    const an = Math.PI * (1.05 + (i / 9) * 0.9);
    ctx.save();
    ctx.globalAlpha *= fade;
    ell(ctx, x + Math.cos(an) * (8 + e * r), y - 4 + Math.sin(an) * (8 + e * r) * 0.8 + e * e * 8, 2, 2.8, an);
    ctx.fillStyle = TEA[1];
    ctx.fill();
    ctx.restore();
  }
}

// ---------- Dusting, High and Low ----------
function feather(ctx, x, y, s, ang, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(ang);
  ell(ctx, 0, 0, s * 0.5, s * 1.3);
  pen(ctx, DUST[2], 1);
  ctx.stroke();
  const g = ctx.createLinearGradient(0, -s, 0, s);
  g.addColorStop(0, '#fbf6ff');
  g.addColorStop(1, '#c8a8e0');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, s * 1.4);
  ctx.lineTo(0, -s * 1.1);
  pen(ctx, 'rgba(140,100,170,0.6)', 0.5);
  ctx.stroke();
  ctx.restore();
}
function dustWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r, 'rgba(216,205,242,0.24)', 'rgba(126,58,108,0.9)', 0.6 + 0.4 * p, 2);
  for (let i = 0; i < 10; i++) {
    const an = time * (2 + p * 4) + (i / 10) * TAU;
    const fx = x + Math.cos(an) * r * 0.9;
    const fy = y - 48 + Math.sin(an) * r * 0.22;
    feather(ctx, fx, fy, 3.4, an * 2, (0.5 + 0.5 * p) * (Math.sin(an) > -0.2 ? 1 : 0.55));
  }
  for (let i = 0; i < 8; i++) {
    const v = (time * 0.5 + hash(i + z.x)) % 1;
    sparkle(ctx, x + (hash(i * 2.3) - 0.5) * r * 1.8, y - 10 - v * 50, 1.4 * Math.sin(Math.PI * v), 0.7, DUST[0]);
  }
}
function dustHit(ctx, z, x, y, u, e, fade, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r * (1 + e * 0.15), 'rgba(216,205,242,0.3)', 'rgba(126,58,108,1)', fade, 2);
  for (let i = 0; i < 14; i++) {
    const an = (i / 14) * TAU;
    puff(ctx, x + Math.cos(an) * r * (0.6 + e * 0.5), y - 30 + Math.sin(an) * r * 0.2 - e * 14, 5 + e * 5, fade * 0.85);
  }
}
function dustLowWarn(ctx, z, x, y, p, time) {
  const inner = z.inner;
  const r = z.w / 2;
  // her reach clean and lit
  floorRing(ctx, x, y, inner, 'rgba(255,250,240,0.3)', 'rgba(242,200,104,0.95)', 0.7 + 0.3 * p, 2);
  glow(ctx, x, y - 10, inner, '#fff6dc', 0.25 + 0.2 * p);
  // dust rolling low along the floor everywhere past it
  for (const s of [-1, 1]) {
    for (let i = 0; i < 8; i++) {
      const v = (i + 0.5) / 8;
      const d = inner + 10 + v * (r - inner - 10);
      const wob = Math.sin(time * 3 + i * 1.3) * 3;
      puff(ctx, x + s * (d + wob), y - 6 - Math.abs(Math.sin(time * 2 + i)) * 4, 5 + p * 3, 0.35 + 0.45 * p);
    }
  }
}
function dustLowHit(ctx, z, x, y, u, e, fade, time) {
  const inner = z.inner;
  const r = z.w / 2;
  for (const s of [-1, 1]) {
    for (let i = 0; i < 8; i++) {
      const d = inner + 10 + ((i + 0.5) / 8) * (r - inner - 10);
      puff(ctx, x + s * d, y - 10 - e * 30 - (i % 2) * 6, 6 + e * 6, fade * 0.85);
    }
  }
}

// ---------- The Keys, Please! ----------
function keyRing(ctx, x, y, s, turn, al) {
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.arc(0, 0, 7, 0, TAU);
  pen(ctx, GOLD[3], 3);
  ctx.stroke();
  pen(ctx, GOLD[1], 1.8);
  ctx.stroke();
  for (let i = 0; i < 5; i++) {
    const an = turn + (i / 5) * TAU;
    const sw = Math.sin(turn * 3 + i) * 0.15;
    const p0 = [Math.cos(an) * 7, Math.sin(an) * 7];
    const dir = an + sw;
    const p1 = [p0[0] + Math.cos(dir) * 12, p0[1] + Math.sin(dir) * 12];
    ctx.beginPath();
    ctx.moveTo(...p0);
    ctx.lineTo(...p1);
    ctx.lineCap = 'round';
    pen(ctx, GOLD[3], 3);
    ctx.stroke();
    pen(ctx, GOLD[1], 1.6);
    ctx.stroke();
    ell(ctx, p0[0] + Math.cos(dir) * 2.6, p0[1] + Math.sin(dir) * 2.6, 2.6, 2.6);
    ctx.fillStyle = GOLD[0];
    ctx.fill();
    pen(ctx, GOLD[2], 0.8);
    ctx.stroke();
    ctx.save();
    ctx.translate(...p1);
    ctx.rotate(dir);
    ctx.fillStyle = GOLD[1];
    ctx.fillRect(-2, 0, 2.4, 3);
    ctx.fillRect(-4.2, 0, 1.6, 2);
    ctx.restore();
  }
  ctx.restore();
}
function keysWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r, 'rgba(255,230,140,0.28)', 'rgba(196,143,44,1)', 0.7 + 0.3 * p, 2);
  // the keyhole at its heart
  ctx.save();
  ctx.globalAlpha *= 0.7 + 0.3 * p;
  ell(ctx, x, y - 1.6, 3, 2);
  ctx.fillStyle = PLUM[3];
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 1.6, y - 1);
  ctx.lineTo(x + 1.6, y - 1);
  ctx.lineTo(x + 2.4, y + 2.4);
  ctx.lineTo(x - 2.4, y + 2.4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  keyRing(ctx, x, y - 64 + Math.sin(time * 3) * 2, 1.2, time * 1.5, 0.6 + 0.4 * p);
  for (let i = 0; i < 6; i++) {
    const an = (i / 6) * TAU + time * 0.7;
    const tw = Math.max(0, Math.sin(time * 6 + i * 1.7));
    sparkle(ctx, x + Math.cos(an) * r, y + Math.sin(an) * r * 0.26 - 1, 1.2 + tw * 2, 0.8, GOLD[0]);
  }
}
function keysHit(ctx, z, x, y, u, e, fade, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r * (1 + e * 0.3), 'rgba(255,230,140,0.4)', 'rgba(196,143,44,1)', fade, 2.4);
  keyRing(ctx, x, y - 64 + e * 40, 1.2 + e * 0.3, time * 8, fade);
  for (let i = 0; i < 12; i++) {
    const an = (i / 12) * TAU;
    sparkle(ctx, x + Math.cos(an) * (10 + e * r), y - 30 + Math.sin(an) * (10 + e * r) * 0.5, 3 * fade, 1, GOLD[0]);
  }
}

// ---------- Polish! ----------
function polishWarn(ctx, z, x, y, p, time) {
  const w = z.w;
  ctx.save();
  const g = ctx.createLinearGradient(0, y - 14, 0, y + 4);
  g.addColorStop(0, 'rgba(240,236,255,0)');
  g.addColorStop(1, `rgba(240,236,255,${0.25 + 0.45 * p})`);
  ctx.fillStyle = g;
  ctx.fillRect(x, y - 14, w, 18);
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 6; i++) {
    const v = (time * (0.3 + p * 0.6) + i / 6) % 1;
    const sx = x + v * w;
    const sg = ctx.createLinearGradient(sx - 20, 0, sx + 20, 0);
    sg.addColorStop(0, 'rgba(255,255,255,0)');
    sg.addColorStop(0.5, `rgba(255,255,255,${0.25 + 0.35 * p})`);
    sg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sg;
    ctx.fillRect(sx - 20, y - 3, 40, 5);
  }
  ctx.restore();
  // soap bubbles drifting up off it
  for (let i = 0; i < 10; i++) {
    const v = (time * 0.35 + hash(i + 3.3)) % 1;
    const bx = x + hash(i * 1.7) * w + Math.sin(time + i) * 4;
    const by = y - 4 - v * 46;
    ctx.save();
    ctx.globalAlpha *= Math.sin(Math.PI * v) * (0.4 + 0.6 * p);
    ell(ctx, bx, by, 2.4 + (i % 3), 2.4 + (i % 3));
    ctx.strokeStyle = 'rgba(200,190,255,0.9)';
    ctx.lineWidth = 0.7;
    ctx.stroke();
    ell(ctx, bx - 0.8, by - 0.8, 0.8, 0.5);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
  }
}
function polishHit(ctx, z, x, y, u, e, fade, time) {
  const w = z.w;
  ctx.save();
  ctx.globalAlpha *= fade;
  ctx.globalCompositeOperation = 'lighter';
  const sx = x + e * w;
  const sg = ctx.createLinearGradient(sx - 80, 0, sx + 20, 0);
  sg.addColorStop(0, 'rgba(255,255,255,0)');
  sg.addColorStop(0.8, 'rgba(255,255,255,0.8)');
  sg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(sx - 80, y - 10, 100, 14);
  ctx.restore();
  for (let i = 0; i < 6; i++) sparkle(ctx, sx - i * 12, y - 6 - (i % 2) * 6, 3.4 * fade, 1, '#ffffff');
}

// ---------- House Rules ----------
function scroll(ctx, x, y, open, lines, al) {
  ctx.save();
  ctx.globalAlpha *= al;
  const w = 20 + open * 56;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - 22, w, 44, 3);
  pen(ctx, LINEN[3], 2);
  ctx.stroke();
  const g = ctx.createLinearGradient(0, y - 22, 0, y + 22);
  g.addColorStop(0, '#fffaf0');
  g.addColorStop(1, '#efe2cc');
  ctx.fillStyle = g;
  ctx.fill();
  for (const s of [-1, 1]) {
    ell(ctx, x + s * w / 2, y, 4, 24);
    pen(ctx, PLUM[3], 1.6);
    ctx.stroke();
    ctx.fillStyle = PLUM[2];
    ctx.fill();
  }
  if (open > 0.6) {
    ctx.fillStyle = PLUM[3];
    ctx.textAlign = 'center';
    ctx.font = '700 7px Georgia, serif';
    ctx.fillText('HOUSE RULES', x, y - 11);
    ctx.strokeStyle = 'rgba(90,60,100,0.6)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const k = clamp(lines * 4 - i, 0, 1);
      if (k <= 0) continue;
      ctx.beginPath();
      ctx.moveTo(x - 22, y - 3 + i * 6);
      ctx.lineTo(x - 22 + 44 * k - (i % 2) * 8 * k, y - 3 + i * 6);
      ctx.stroke();
    }
  }
  ctx.restore();
}
function rulesWarn(ctx, z, x, y, p, time) {
  scroll(ctx, x, y - 140 + Math.sin(time * 2) * 2, ease(p * 2), clamp((p - 0.3) / 0.6, 0, 1), 0.7 + 0.3 * p);
  glow(ctx, x, y - 140, 60, '#d8a0cc', 0.15 + 0.2 * p);
}
function rulesHit(ctx, z, x, y, u, e, fade, time) {
  scroll(ctx, x, y - 140, 1, 1, fade);
  // her seal pressed on it
  ctx.save();
  ctx.globalAlpha *= fade;
  const s = 1 + (1 - e) * 0.6;
  ell(ctx, x + 20, y - 128, 7 * s, 7 * s);
  ctx.fillStyle = PLUM[2];
  ctx.fill();
  pen(ctx, PLUM[3], 1.4);
  ctx.stroke();
  ell(ctx, x + 20, y - 128, 3.4 * s, 3.4 * s);
  pen(ctx, PLUM[0], 1);
  ctx.stroke();
  ctx.restore();
  // a ring of plum rolling out over the room
  for (const k of [1, 0.7]) {
    ctx.save();
    ctx.globalAlpha *= fade * k;
    ell(ctx, x, y - 70, 30 + e * 420 * k, (30 + e * 420 * k) * 0.45);
    pen(ctx, PLUM[1], 4 * fade + 1);
    ctx.stroke();
    ctx.restore();
  }
}

export const VELVET_FX = {
  vvRunner: { warn: runnerWarn, hit: runnerHit },
  vvTea: { warn: teaWarn, hit: teaHit },
  vvInspect: { warn: inspectWarn, hit: inspectHit },
  vvPour: { warn: pourWarn, hit: pourHit },
  vvDust: { warn: dustWarn, hit: dustHit },
  vvDustLow: { warn: dustLowWarn, hit: dustLowHit },
  vvKeys: { warn: keysWarn, hit: keysHit },
  vvPolish: { warn: polishWarn, hit: polishHit },
  vvRules: { warn: rulesWarn, hit: rulesHit },
};
// How long each landing plays (s).
export const VELVET_HOLD = { vvRunner: 0.8, vvTea: 0.8, vvInspect: 0.8, vvPour: 0.8, vvDust: 0.8, vvDustLow: 0.8, vvKeys: 0.8, vvPolish: 1, vvRules: 1.1 };
// (they draw their own floor markers: render/bossfx.js leaves out the plain one under them)
export const VELVET_OWN_WARN = Object.keys(VELVET_FX);
