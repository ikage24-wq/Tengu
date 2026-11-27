// Madame Reveille's cast looks (2026-11-27, her new fight, world/reveille.js): each telegraph drawn whole in her own
// soft style (no plain floor marker under it: they are on render/bossfx.js OWN_WARN), while its cast winds up (`warn`,
// p 0..1 through the warning), and in place of the plain flash as it lands (`hit`, u 0..1 over its hold, e eased,
// fade). Her colours: brass and bell-gold, her rose lacquer, morning cream, dawn peach and pink, the snooze button's
// red; every shape rounded, outlined in a deeper shade of its own colour, eased; sound as soft arcs, sparkles never
// specks; her raid-wide a gentle dawn tint, never a white flash. render/dreamfx.js hands each zone with one of these
// looks to them (through render/bossfx.js and render/trial.js). (x, y) is the zone's spot on the 640 x 360 screen (a
// column's or a circle's middle; a lane's left end; the floor's from 0).
//   rvBell     Morning Bell (follows you, then stops): a great brass bell's soft shadow on the floor under you and the
//              bell itself hanging high over it, trembling, dropping in the last of the cast; landing, DONG: soft rings
//              of sound and a puff of dust
//   rvRing     Ring-a-Ding (the whole lawn, low, three beats): rings of sound rolling out along the lawn from her, the
//              next one to land the brightest; landing, a low gold wave of sound across the floor
//   rvSnooze   The Snooze Button / Snooze Again?! (the lawn but the lit button): three big red snooze buttons on the
//              lawn, the lit one glowing with a bobbing arrow, the next one dashed ("then here"); the rest of the lawn
//              shivering rose as the alarm builds; landing, rings of alarm bursting up everywhere but the button, the
//              button pressed with a soft "zz"
//   rvRise     Rise and Shine! (everyone): the dawn coming up over the bottom of the screen, a gentle peach-pink tint
//              rising; landing, a soft warm wash and long gentle rays, sparkles
//   rvDoodle   Cock-a-Doodle-Doo! (a wide column ahead of her): arcs of sound gathering along the lawn ahead of her, a
//              teal plume or two drifting; landing, the crow bursting along it
//   rvClock    Five More Minutes? (follows you, then stops): a little rose alarm clock hovering over you, its shadow
//              below, ringing; dropping in the last of it; landing, BRRING: it bounces off in a ring of sound
//   rvLight    First Light (the stack: gather in it): a beam of first light sliding across from her to its spot, a warm
//              pool on the lawn under it; the rest of the lawn still dusky lilac; landing, a warm glow in the pool and
//              the alarm going off everywhere else
import { TAU, clamp, sstep, ell, pen, glow, sparkle, hash } from './fx.js';
import { GOLD, ROSE, CREAM, DAWN, SNOOZE, PLUME, SLEEP } from './palette.js';
import { drawHandbell } from './dress.js';

const SW = 640;
const SH = 360;
const rgba = (hex, al) => {
  const n = parseInt(hex.slice(1, 7), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${clamp(al, 0, 1)})`;
};
const A0 = { flash: 0 };
function word(ctx, text, x, y, size, al, col = ROSE.ink) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.font = `900 ${size}px "Trebuchet MS", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#fffaf0';
  ctx.lineWidth = size * 0.36;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = col;
  ctx.fillText(text, x, y);
  ctx.restore();
}
// a soft ring on the floor
function floorRing(ctx, x, y, r, fill, rim, al, w = 1.6) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, r, r * 0.24);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  pen(ctx, rim, w);
  ctx.stroke();
  ctx.restore();
}
// soft arcs of sound (gold with a cream heart), centred on (x, y), facing `ang`
function arcs(ctx, x, y, r, ang, spread, al, col = GOLD.sh, w = 2.2) {
  if (al <= 0.01 || r <= 0.5) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.lineCap = 'round';
  pen(ctx, col, w);
  ctx.beginPath();
  ctx.arc(x, y, r, ang - spread, ang + spread);
  ctx.stroke();
  pen(ctx, '#fff8e4', w * 0.45);
  ctx.stroke();
  ctx.restore();
}
function puff(ctx, x, y, r, al) {
  if (al <= 0.01 || r <= 0.2) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, r, r * 0.8);
  ctx.fillStyle = '#fff8ee';
  ctx.fill();
  pen(ctx, '#e4d2bc', 0.9);
  ctx.stroke();
  ell(ctx, x - r * 0.3, y - r * 0.25, r * 0.4, r * 0.3);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
}
// a little rose alarm clock: two brass bells, a cream face, little feet
function clock(ctx, x, y, s, rot, ringing, time) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot + Math.sin(time * 40) * 0.08 * ringing);
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(sx * s * 0.62, -s * 0.86, s * 0.44, Math.PI, 0);
    ctx.closePath();
    ctx.fillStyle = GOLD.base;
    ctx.fill();
    pen(ctx, GOLD.ink, s * 0.1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx * s * 0.5, s * 0.8);
    ctx.lineTo(sx * s * 0.7, s * 1.15);
    pen(ctx, GOLD.deep, s * 0.18);
    ctx.stroke();
  }
  ell(ctx, 0, 0, s, s);
  ctx.fillStyle = ROSE.base;
  ctx.fill();
  pen(ctx, ROSE.ink, s * 0.12);
  ctx.stroke();
  ell(ctx, 0, 0, s * 0.72, s * 0.72);
  ctx.fillStyle = '#fffdf6';
  ctx.fill();
  pen(ctx, '#6a3a58', s * 0.12);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -s * 0.5);
  ctx.moveTo(0, 0);
  ctx.lineTo(s * 0.36, s * 0.1);
  ctx.stroke();
  ell(ctx, -s * 0.38, -s * 0.38, s * 0.2, s * 0.14);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fill();
  ctx.restore();
}
// a big snooze button on the floor: a red dome cap on a cream base
function button(ctx, x, y, lit, pressed, time, dim = 0) {
  const bob = lit ? Math.sin(time * 6) * 1 : 0;
  ctx.save();
  // (drawn a size up, about its foot)
  ctx.translate(x, y);
  ctx.scale(1.3, 1.3);
  ctx.translate(-x, -y);
  ctx.globalAlpha *= 1 - dim * 0.55;
  ell(ctx, x, y - 1, 22, 5.4);
  ctx.fillStyle = SNOOZE.cap;
  ctx.fill();
  pen(ctx, '#d8c6b2', 1.2);
  ctx.stroke();
  const h = 7 * (1 - pressed * 0.6);
  ctx.beginPath();
  ctx.moveTo(-17 + x, y - 2);
  ctx.bezierCurveTo(-17 + x, y - 2 - h * 1.6, 17 + x, y - 2 - h * 1.6, 17 + x, y - 2);
  ctx.quadraticCurveTo(x, y + 1.6, -17 + x, y - 2);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, y - 2 - h * 1.4, 0, y);
  g.addColorStop(0, lit ? SNOOZE.lt : '#e2b6be');
  g.addColorStop(1, lit ? SNOOZE.base : '#c89aa4');
  ctx.fillStyle = g;
  ctx.fill();
  pen(ctx, lit ? SNOOZE.ink : '#a8808c', 1.3);
  ctx.stroke();
  ell(ctx, x - 6, y - 2 - h * 0.85, 4.2, 1.6, -0.15);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fill();
  ctx.restore();
  if (lit && pressed < 0.5) {
    glow(ctx, x, y - 6, 40, DAWN.gold, 0.35 + 0.15 * Math.sin(time * 6));
    word(ctx, 'SNOOZE', x, y - 26 + bob, 10, 1, SNOOZE.ink);
    // a bobbing arrow pointing down at it
    ctx.save();
    ctx.translate(x, y - 46 + bob * 2);
    ctx.beginPath();
    ctx.moveTo(-6, -6);
    ctx.lineTo(6, -6);
    ctx.lineTo(0, 3);
    ctx.closePath();
    ctx.lineJoin = 'round';
    ctx.fillStyle = DAWN.gold;
    ctx.fill();
    pen(ctx, GOLD.deep, 1.4);
    ctx.stroke();
    ctx.restore();
  }
}
// the alarm building over a stretch of floor: a soft rose shiver rising from it
function alarmBand(ctx, x0, x1, y, p, time) {
  if (x1 - x0 < 2) return;
  ctx.save();
  const h = 26 + 40 * p;
  const g = ctx.createLinearGradient(0, y - h, 0, y + 2);
  g.addColorStop(0, rgba(ROSE.lt, 0));
  g.addColorStop(1, rgba(ROSE.base, 0.12 + 0.2 * p));
  ctx.fillStyle = g;
  ctx.fillRect(x0, y - h, x1 - x0, h + 2);
  // little shivering alarm lines along it
  ctx.lineCap = 'round';
  pen(ctx, rgba(ROSE.deep, 0.35 + 0.4 * p), 1.4);
  for (let x = x0 + 14; x < x1 - 8; x += 38) {
    const sh = Math.sin(time * (18 + 20 * p) + x) * (1 + 2 * p);
    ctx.beginPath();
    ctx.moveTo(x - 4 + sh, y - 8);
    ctx.lineTo(x + sh, y - 13 - 4 * p);
    ctx.lineTo(x + 4 + sh, y - 8);
    ctx.stroke();
  }
  ctx.restore();
}

// ---------- Morning Bell ----------
function bellWarn(ctx, z, x, y, p, time) {
  const locked = z.t >= z.warn - (z.lock ?? 0.6);
  const drop = sstep((p - 0.82) / 0.18);
  const sway = Math.sin(time * 3) * 0.08 * (1 - drop);
  const shake = locked ? Math.sin(time * 40) * 0.05 * (1 - drop) : 0;
  floorRing(ctx, x, y, z.w / 2, rgba(GOLD.base, 0.3 + 0.3 * p), locked ? GOLD.deep : GOLD.sh, 0.8 + 0.2 * p, locked ? 2.6 : 1.8);
  // (a dashed line from the bell down to its mark)
  ctx.save();
  ctx.setLineDash([3, 5]);
  pen(ctx, rgba(GOLD.deep, 0.45 * (1 - drop)), 1.2);
  ctx.beginPath();
  ctx.moveTo(x, y - 170);
  ctx.lineTo(x, y - 6);
  ctx.stroke();
  ctx.restore();
  // (high over everyone's heads, hers too, so it's always seen)
  const by = y - 196 + drop * drop * 174;
  ctx.save();
  ctx.translate(x, by);
  ctx.scale(3.2, 3.2);
  for (const mode of ['line', 'fill']) drawHandbell(ctx, A0, mode, 0, 0, sway + shake, Math.sin(time * 6) * 0.2, 0.6);
  ctx.restore();
  if (locked && drop < 0.2) word(ctx, '!', x, y - 26, 12, 1, ROSE.ink);
}
function bellHit(ctx, z, x, y, u, e, fade) {
  for (let i = 0; i < 3; i++) arcs(ctx, x, y - 12, 14 + e * (30 + i * 16), -Math.PI / 2, 1.2, fade * (1 - i * 0.25), GOLD.sh, 2.4);
  for (let i = 0; i < 5; i++) puff(ctx, x + (i - 2) * 12 * (0.6 + e), y - 3 - e * 6 * (i % 2), 5 + e * 5, fade * 0.8);
  ctx.save();
  ctx.translate(x, y - 22 + e * 2);
  ctx.scale(3.2, 3.2);
  ctx.globalAlpha = 1 - sstep((u - 0.55) / 0.45);
  for (const mode of ['line', 'fill']) drawHandbell(ctx, A0, mode, 0, 0, Math.sin(u * 30) * 0.12 * (1 - u), Math.sin(u * 40) * 0.5, 0.6);
  ctx.restore();
  word(ctx, 'DONG!', x, y - 72 - e * 8, 14, fade);
}

// ---------- Ring-a-Ding ----------
function ringWarn(ctx, z, x, y, p, time) {
  const camX = z.x - x;
  const fx = (z.fromX ?? z.x + z.w / 2) - camX;
  // (the next to land is the brightest: they land a beat apart)
  const al = sstep((p - 0.35) / 0.4) * (0.4 + 0.6 * p);
  ctx.save();
  const g = ctx.createLinearGradient(0, y - 18, 0, y + 2);
  g.addColorStop(0, rgba(GOLD.lt, 0));
  g.addColorStop(1, rgba(GOLD.base, 0.25 * al));
  ctx.fillStyle = g;
  ctx.fillRect(Math.max(0, x), y - 18, Math.min(SW, x + z.w) - Math.max(0, x), 20);
  ctx.restore();
  // rings rolling out along the lawn from her, both ways
  for (let k = 0; k < 4; k++) {
    const v = (time * 0.9 + k / 4 + (z.beat ?? 0) * 0.13) % 1;
    for (const d of [-1, 1]) arcs(ctx, fx + d * (20 + v * 300), y - 2, 8 + v * 6, d > 0 ? 0 : Math.PI, 1.0, al * (1 - v), GOLD.sh, 2);
  }
  if (p > 0.6) word(ctx, ['ring...', 'ring...', 'RING!'][z.beat ?? 0], fx, y - 150 - (z.beat ?? 0) * 4, (z.beat ?? 0) === 2 ? 14 : 10, sstep((p - 0.6) / 0.2) * (1 - sstep((p - 0.97) / 0.03)));
}
function ringHit(ctx, z, x, y, u, e, fade) {
  ctx.save();
  ctx.globalAlpha = fade;
  // a low wave of sound along the floor
  ctx.beginPath();
  ctx.moveTo(Math.max(-10, x), y);
  for (let sx = Math.max(-10, x); sx <= Math.min(SW + 10, x + z.w); sx += 8) ctx.lineTo(sx, y - 6 - Math.sin(sx * 0.08 + u * 12) * 3 * (1 - u));
  ctx.lineTo(Math.min(SW + 10, x + z.w), y + 2);
  ctx.lineTo(Math.max(-10, x), y + 2);
  ctx.closePath();
  ctx.fillStyle = rgba(GOLD.base, 0.45);
  ctx.fill();
  pen(ctx, GOLD.sh, 1.4);
  ctx.stroke();
  ctx.restore();
  for (let sx = Math.max(20, x + 20); sx < Math.min(SW, x + z.w); sx += 70) arcs(ctx, sx, y - 4, 6 + e * 16, -Math.PI / 2, 0.9, fade * 0.8, GOLD.sh, 1.8);
}

// ---------- The Snooze Button ----------
function snoozeWarn(ctx, z, x, y, p, time) {
  const camX = z.x - x;
  const left = x - z.w / 2;
  const right = x + z.w / 2;
  // (the second wave shows only once the first has landed)
  const show = z.seq === 1 ? sstep((p - 0.57) / 0.05) : 1;
  if (show <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= show;
  alarmBand(ctx, Math.max(-4, left), Math.min(SW + 4, right), y, p, time);
  if (z.art) {
    const pop = sstep(p / 0.15);
    for (const bx of z.xs ?? []) {
      const sx = bx - camX;
      const isLit = bx === z.lit;
      const isNext = bx === z.next;
      ctx.save();
      ctx.translate(sx, y);
      ctx.scale(1, pop);
      ctx.translate(-sx, -y);
      button(ctx, sx, y, isLit, 0, time, isLit ? 0 : 1);
      ctx.restore();
      if (isNext) {
        ctx.save();
        ctx.setLineDash([4, 4]);
        floorRing(ctx, sx, y - 1, 26, null, GOLD.deep, 0.7, 1.4);
        ctx.restore();
        word(ctx, 'then here', sx, y - 26, 8, 0.85, GOLD.deep);
      }
    }
  }
  ctx.restore();
}
function snoozeHit(ctx, z, x, y, u, e, fade, time) {
  const camX = z.x - x;
  const left = Math.max(-4, x - z.w / 2);
  const right = Math.min(SW + 4, x + z.w / 2);
  for (let sx = left + 24; sx < right - 10; sx += 56) {
    for (let i = 0; i < 2; i++) arcs(ctx, sx, y - 8, 8 + e * (22 + i * 12), -Math.PI / 2, 1.0, fade * (1 - i * 0.35), ROSE.deep, 2.2);
  }
  ctx.save();
  ctx.globalAlpha = fade * 0.25;
  ctx.fillStyle = ROSE.lt;
  ctx.fillRect(left, y - 60, right - left, 62);
  ctx.restore();
  if (z.art) {
    const lx = z.lit - camX;
    button(ctx, lx, y, true, 1, time);
    word(ctx, 'zz', lx + 10, y - 20 - e * 14, 10, fade, SLEEP.deep);
    sparkle(ctx, lx - 8, y - 14 - e * 8, 4 * fade, fade, '#fff6c8');
    word(ctx, 'RIIIING!', SW / 2, 120, 16, fade);
  }
}

// ---------- Rise and Shine! ----------
function riseWarn(ctx, z, x, y, p, time) {
  const k = sstep(p);
  ctx.save();
  const g = ctx.createLinearGradient(0, SH, 0, SH * (0.9 - 0.6 * k));
  g.addColorStop(0, rgba(DAWN.peach, 0.12 + 0.12 * k));
  g.addColorStop(0.5, rgba(DAWN.pink, 0.06 + 0.06 * k));
  g.addColorStop(1, rgba(DAWN.lilac, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SW, SH);
  // the sun's rim peeking up at the bottom of the screen
  const sy = SH + 40 - 40 * k;
  glow(ctx, SW / 2, sy, 90 + 30 * k, DAWN.gold, 0.25 + 0.2 * k);
  ell(ctx, SW / 2, sy, 46, 46);
  ctx.fillStyle = rgba(DAWN.cream, 0.5 * k);
  ctx.fill();
  ctx.restore();
  for (let i = 0; i < 4; i++) sparkle(ctx, SW * (0.15 + 0.23 * i) + Math.sin(time + i) * 8, SH - 40 - ((time * 20 + i * 40) % 140), 3, 0.5 * k, DAWN.gold);
  if (p > 0.3) word(ctx, 'Rise and shine!', SW / 2, 118, 13, sstep((p - 0.3) / 0.2));
}
function riseHit(ctx, z, x, y, u, e, fade, time) {
  ctx.save();
  // a soft warm wash (a gentle tint, never a white flash)
  ctx.fillStyle = rgba(DAWN.peach, 0.1 * fade);
  ctx.fillRect(0, 0, SW, SH);
  ctx.globalAlpha = fade * 0.35;
  ctx.translate(SW / 2, SH + 20);
  for (let i = 0; i < 9; i++) {
    const an = -Math.PI + (i + 0.5) * (Math.PI / 9);
    ctx.beginPath();
    ctx.moveTo(Math.cos(an - 0.05) * 40, Math.sin(an - 0.05) * 40);
    ctx.lineTo(Math.cos(an) * (200 + e * 160), Math.sin(an) * (200 + e * 160));
    ctx.lineTo(Math.cos(an + 0.05) * 40, Math.sin(an + 0.05) * 40);
    ctx.closePath();
    ctx.fillStyle = rgba(DAWN.cream, 0.35);
    ctx.fill();
  }
  ctx.restore();
  for (let i = 0; i < 8; i++) sparkle(ctx, SW * hash(i + 3), SH * (0.3 + 0.5 * hash(i + 11)) - e * 20, 4 * fade, fade, DAWN.gold);
}

// ---------- Cock-a-Doodle-Doo! ----------
function doodleWarn(ctx, z, x, y, p, time) {
  const d = z.flow ?? 1;
  const left = x - z.w / 2;
  const right = x + z.w / 2;
  const x0 = d > 0 ? left : right;
  ctx.save();
  const g = ctx.createLinearGradient(x0, 0, x0 + d * z.w, 0);
  g.addColorStop(0, rgba(GOLD.base, 0.25 * p));
  g.addColorStop(1, rgba(GOLD.lt, 0.05));
  ctx.fillStyle = g;
  ctx.fillRect(Math.max(-4, left), y - 70, Math.min(SW + 4, right) - Math.max(-4, left), 72);
  ctx.restore();
  // arcs gathering along it, pointing away from her
  for (let k = 0; k < 6; k++) {
    const v = (time * 0.7 + k / 6) % 1;
    arcs(ctx, x0 + d * (30 + v * (z.w - 40)), y - 34, 16 + v * 10, d > 0 ? 0 : Math.PI, 0.9, sstep(p / 0.3) * (1 - v) * (0.5 + 0.5 * p), GOLD.sh, 2.2);
  }
  // a teal plume or two drifting along
  for (let i = 0; i < 2; i++) {
    const v = (time * 0.25 + i * 0.5) % 1;
    const fx = x0 + d * v * z.w * 0.8;
    const fy = y - 50 - Math.sin(v * Math.PI) * 20 + i * 14;
    ctx.save();
    ctx.globalAlpha = 0.7 * p * Math.sin(v * Math.PI);
    ctx.translate(fx, fy);
    ctx.rotate(Math.sin(time * 2 + i) * 0.5);
    ell(ctx, 0, 0, 7, 2.4);
    ctx.fillStyle = PLUME.base;
    ctx.fill();
    pen(ctx, PLUME.ink, 1);
    ctx.stroke();
    ctx.restore();
  }
}
function doodleHit(ctx, z, x, y, u, e, fade) {
  const d = z.flow ?? 1;
  const x0 = d > 0 ? x - z.w / 2 : x + z.w / 2;
  for (let i = 0; i < 5; i++) arcs(ctx, x0 + d * (20 + e * z.w * (0.25 + i * 0.17)), y - 34, 20 + i * 4 + e * 10, d > 0 ? 0 : Math.PI, 1.05, fade * (1 - i * 0.12), GOLD.sh, 3);
  word(ctx, 'COCK-A-DOODLE-DOO!', x0 + d * z.w * 0.4, y - 96, 15, fade);
}

// ---------- Five More Minutes? ----------
function clockWarn(ctx, z, x, y, p, time) {
  const locked = z.t >= z.warn - (z.lock ?? 0.6);
  const drop = sstep((p - 0.84) / 0.16);
  floorRing(ctx, x, y, z.w / 2, rgba(ROSE.base, 0.12 + 0.2 * p), locked ? ROSE.deep : ROSE.sh, 0.4 + 0.6 * p, locked ? 2 : 1.2);
  const cy = y - 150 + drop * drop * 138 + Math.sin(time * 3 + (z.n ?? 0)) * 3 * (1 - drop);
  clock(ctx, x, cy, 9, Math.sin(time * 2 + (z.n ?? 0)) * 0.15, locked ? 1 : 0.4, time);
  if (locked) arcs(ctx, x, cy, 14, -Math.PI / 2, 1.2, 0.7 * (1 - drop), ROSE.deep, 1.6);
}
function clockHit(ctx, z, x, y, u, e, fade, time) {
  for (let i = 0; i < 2; i++) arcs(ctx, x, y - 10, 10 + e * (20 + i * 12), -Math.PI / 2, 1.1, fade * (1 - i * 0.3), ROSE.deep, 2.2);
  const hop = Math.sin(Math.min(1, u * 1.3) * Math.PI) * 26;
  clock(ctx, x + e * 30 * ((z.n ?? 0) % 2 ? 1 : -1), y - 10 - hop, 9, u * 5, 1, time);
  word(ctx, 'BRRING!', x, y - 54 - e * 6, 10, fade);
}

// ---------- First Light ----------
function lightWarn(ctx, z, x, y, p, time) {
  if (z.art) {
    // (the pool itself: the beam slides across from her and settles on it)
    const camX = z.x - x;
    const from = (z.fromX ?? z.x) - camX;
    const s = sstep(p / 0.45);
    const bx = from + (x - from) * s;
    ctx.save();
    const g = ctx.createLinearGradient(bx - 40, 0, bx + 40, 0);
    g.addColorStop(0, rgba(DAWN.gold, 0));
    g.addColorStop(0.5, rgba(DAWN.cream, 0.35 + 0.15 * p));
    g.addColorStop(1, rgba(DAWN.gold, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(bx - 22, 0);
    ctx.lineTo(bx + 22, 0);
    ctx.lineTo(bx + z.w / 2, y);
    ctx.lineTo(bx - z.w / 2, y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    floorRing(ctx, bx, y, z.w / 2, rgba(DAWN.gold, 0.3 + 0.2 * s), GOLD.sh, 0.5 + 0.5 * s, 1.8);
    for (let i = 0; i < 4; i++) sparkle(ctx, bx + Math.sin(time * 1.6 + i * 1.7) * z.w * 0.35, y - 10 - ((time * 18 + i * 25) % 90), 3, 0.8 * s, DAWN.gold);
    if (s > 0.9) word(ctx, 'Gather here!', bx, y - 104, 10, sstep((p - 0.45) / 0.1), GOLD.deep);
    return;
  }
  // (the rest of the lawn: still dusky lilac, the alarm building)
  const left = Math.max(-4, x - z.w / 2);
  const right = Math.min(SW + 4, x + z.w / 2);
  if (right - left < 2) return;
  ctx.save();
  const g = ctx.createLinearGradient(0, y - 80, 0, y + 2);
  g.addColorStop(0, rgba(DAWN.lilac, 0));
  g.addColorStop(1, rgba(DAWN.lilac, 0.18 + 0.2 * p));
  ctx.fillStyle = g;
  ctx.fillRect(left, y - 80, right - left, 82);
  ctx.restore();
  alarmBand(ctx, left, right, y, p * 0.8, time);
}
function lightHit(ctx, z, x, y, u, e, fade, time) {
  if (z.art) {
    glow(ctx, x, y - 20, z.w * 0.8, DAWN.gold, 0.5 * fade);
    floorRing(ctx, x, y, z.w / 2 + e * 10, rgba(DAWN.cream, 0.4), GOLD.sh, fade, 2);
    for (let i = 0; i < 6; i++) sparkle(ctx, x + Math.cos(i * 1.05) * z.w * 0.4 * e, y - 16 - Math.sin(i * 1.05) * 30 * e, 4 * fade, fade, DAWN.gold);
    return;
  }
  snoozeHit(ctx, { ...z, art: false }, x, y, u, e, fade, time);
}

export const REVEILLE_FX = {
  rvBell: { warn: bellWarn, hit: bellHit },
  rvRing: { warn: ringWarn, hit: ringHit },
  rvSnooze: { warn: snoozeWarn, hit: snoozeHit },
  rvRise: { warn: riseWarn, hit: riseHit },
  rvDoodle: { warn: doodleWarn, hit: doodleHit },
  rvClock: { warn: clockWarn, hit: clockHit },
  rvLight: { warn: lightWarn, hit: lightHit },
};
// (how long each landing plays, s: world/reveille.js HOLD carries the same)
export const REVEILLE_HOLD = { rvBell: 0.9, rvRing: 0.7, rvSnooze: 1.0, rvRise: 1.1, rvDoodle: 0.9, rvClock: 0.8, rvLight: 1.1 };
export const REVEILLE_OWN_WARN = Object.keys(REVEILLE_FX);
export { CREAM };
