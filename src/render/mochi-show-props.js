// The Mochi Show's props (2026-11-15; the acts are render/mochi-show-acts.js): drawn live in a
// Mochi's paws, small and cute, each with a dark outline, its own light from the upper left, and a
// little shine. Everything is in body pixels (`k`: the Mochi's size, 1 for a grown one), at the paw
// (`x`, `y`), turned to `a` (radians from straight up, forward) and mirrored by `d` (-1 facing left).
//   mic     a pink star microphone                      (singing)
//   bachi   a taiko drumstick, a stick in each paw       (the taiko drum; drawTaiko: the drum)
//   wand    a magician's wand, its star tip twinkling    (magic; drawTopHat: the hat in the other paw)
//   mask    a theatre mask on a stick, happy or sad      (acting; `script`, `rose` too)
//   ribbon  a dancer's ribbon wand, its ribbon flowing   (dancing, the dazzling way)
//   mime    nothing at all - but where a paw presses an invisible wall, the wall glints
// They also note where their business ends are (`out`: the hat's mouth, the wand's star, the drum's
// head...) for render/show.js to set its sparkles and notes off from.

const TAU = Math.PI * 2;
const INK = '#3a2d4f';

// A shape outlined: stroked twice as wide as the line, then filled over its inner half.
function inked(ctx, path, fill, line = 0.7) {
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = INK;
  ctx.lineWidth = line * 2;
  path();
  ctx.stroke();
  ctx.fillStyle = fill;
  path();
  ctx.fill();
}
const rr = (ctx, x, y, w, h, r) => () => {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
};
const circle = (ctx, x, y, r) => () => {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
};
const ell = (ctx, x, y, rx, ry, rot = 0) => () => {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, TAU);
};
export function star(ctx, x, y, r, color, inner = 0.45) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i / 10) * TAU;
    const q = i % 2 ? r * inner : r;
    ctx.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q);
  }
  ctx.closePath();
  ctx.fill();
}
// A four-pointed twinkle.
export function twinkle(ctx, x, y, r, color = '#fff8d8', alpha = 1) {
  if (alpha <= 0.01 || r <= 0.05) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x + r * 0.16, y - r * 0.16, x + r, y);
  ctx.quadraticCurveTo(x + r * 0.16, y + r * 0.16, x, y + r);
  ctx.quadraticCurveTo(x - r * 0.16, y + r * 0.16, x - r, y);
  ctx.quadraticCurveTo(x - r * 0.16, y - r * 0.16, x, y - r);
  ctx.fill();
  ctx.restore();
}
// (Where a point in a prop's own frame lands in the world.)
const toWorld = (x, y, k, d, a, px, py) => {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [x + d * k * (px * c - py * s), y + k * (px * s + py * c)];
};
const frame = (ctx, x, y, k, d, a) => {
  ctx.translate(x, y);
  ctx.scale(d * k, k);
  ctx.rotate(a);
};

// ---------- Singing ----------
// The star microphone: a pink handle with a gold collar, a silver mesh ball, a star sticker.
export function drawMic(ctx, x, y, k, d, a, out) {
  ctx.save();
  frame(ctx, x, y, k, d, a);
  inked(ctx, rr(ctx, -1.1, -4.8, 2.2, 7.6, 1), '#ff8fb4');
  ctx.fillStyle = '#ffc2d8';
  ctx.fillRect(-0.7, -4.4, 0.55, 6.6);
  ctx.fillStyle = '#e0659f';
  ctx.fillRect(0.45, -4.4, 0.35, 6.6);
  star(ctx, 0, -0.8, 1.15, '#fff3b0');
  inked(ctx, rr(ctx, -1.7, -6.2, 3.4, 1.7, 0.6), '#f2c94c', 0.6);
  ctx.fillStyle = '#ffe680';
  ctx.fillRect(-1.3, -6, 2.6, 0.5);
  inked(ctx, circle(ctx, 0, -8.7, 2.75), '#e8ebf4');
  ctx.fillStyle = '#a8b0c8';
  for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) {
    const px = i * 1.05 + (j % 2 ? 0.5 : 0);
    const py = -8.7 + j * 1.0;
    if (Math.hypot(px, py + 8.7) < 2.1) ctx.fillRect(px - 0.22, py - 0.22, 0.44, 0.44);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.beginPath();
  ctx.ellipse(-1.05, -9.8, 0.85, 0.55, -0.6, 0, TAU);
  ctx.fill();
  ctx.restore();
  if (out) out.mic = toWorld(x, y, k, d, a, 0, -8.7);
}

// ---------- The taiko drum ----------
// A drumstick (bachi): pale wood, rounded at the tip, a pink grip wound round its end.
export function drawBachi(ctx, x, y, k, d, a, out, name = 'tip') {
  ctx.save();
  frame(ctx, x, y, k, d, a);
  inked(ctx, rr(ctx, -0.75, -10.2, 1.5, 12.6, 0.75), '#f2dcb0', 0.6);
  ctx.fillStyle = '#fff3d8';
  ctx.fillRect(-0.45, -9.6, 0.45, 9);
  inked(ctx, circle(ctx, 0, -10, 1.05), '#f8e8c8', 0.55);
  inked(ctx, rr(ctx, -1, 0.2, 2, 2.6, 0.6), '#e0507a', 0.5);
  ctx.fillStyle = '#ff9ec0';
  ctx.fillRect(-0.7, 0.9, 1.4, 0.5);
  ctx.fillRect(-0.7, 1.9, 1.4, 0.4);
  ctx.restore();
  if (out) out[name] = toWorld(x, y, k, d, a, 0, -10);
}
// The drum, on the stage beside its drummer (render/show.js), `x` its head (the end it's struck on,
// toward the drummer), standing on `y`, the barrel away along `d`: a red-brown barrel ringed with
// gold studs, a pink swirl on its side, its cream head, on a little wooden stand. `hit` (0-1) a
// stroke just landed: the head flashes and the drum gives a little jump.
export const TAIKO_SIZE = 0.72;
export function drawTaiko(ctx, x, y, d, hit = 0, time = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(d * TAIKO_SIZE, TAIKO_SIZE);
  const jump = hit * 0.9;
  // The stand: two splayed legs each end and a crossbar.
  ctx.lineCap = 'round';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.4;
  for (const [x0, x1] of [[2.5, 0.5], [12.5, 14.5]]) {
    ctx.beginPath();
    ctx.moveTo(x0, -7);
    ctx.lineTo(x1, 0);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(1.6, -3.4);
  ctx.lineTo(13.4, -3.4);
  ctx.stroke();
  ctx.strokeStyle = '#8a5a3a';
  ctx.lineWidth = 1.1;
  for (const [x0, x1] of [[2.5, 0.5], [12.5, 14.5]]) {
    ctx.beginPath();
    ctx.moveTo(x0, -7);
    ctx.lineTo(x1, 0);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(1.6, -3.4);
  ctx.lineTo(13.4, -3.4);
  ctx.stroke();
  // The barrel, sitting on the stand.
  ctx.translate(0, -13.5 - jump);
  const barrel = () => {
    ctx.beginPath();
    ctx.moveTo(0.4, -6.2);
    ctx.quadraticCurveTo(7.5, -8.6, 14.6, -6.2);
    ctx.lineTo(14.6, 6.2);
    ctx.quadraticCurveTo(7.5, 8.6, 0.4, 6.2);
    ctx.closePath();
  };
  inked(ctx, barrel, '#c8583a');
  ctx.save();
  barrel();
  ctx.clip();
  ctx.fillStyle = '#e07a50';
  ctx.fillRect(0, -9, 16, 4.6);
  ctx.fillStyle = '#f0a070';
  ctx.fillRect(0, -9, 16, 2.2);
  ctx.fillStyle = '#a8442c';
  ctx.fillRect(0, 3.6, 16, 6);
  // (Wood grain: soft bands along it.)
  ctx.fillStyle = 'rgba(120,40,20,0.18)';
  ctx.fillRect(0, -1.6, 16, 0.6);
  ctx.fillRect(0, 1.4, 16, 0.5);
  ctx.restore();
  // The pink swirl (a tomoe) on its side.
  ctx.save();
  ctx.translate(7.6, 0.2);
  ctx.rotate(time * 0.2);
  for (let i = 0; i < 3; i++) {
    ctx.rotate(TAU / 3);
    ctx.fillStyle = '#ffd0e0';
    ctx.beginPath();
    ctx.arc(0, -1.3, 1.25, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-1.2, -1.2);
    ctx.quadraticCurveTo(-1.6, 0.8, 0.6, 1.4);
    ctx.quadraticCurveTo(-0.2, 0.2, 1.2, -1.2);
    ctx.fill();
  }
  ctx.fillStyle = '#ff8fb4';
  ctx.beginPath();
  ctx.arc(0, 0, 0.7, 0, TAU);
  ctx.fill();
  ctx.restore();
  // The gold studs round each end.
  for (const sx of [1.5, 13.5]) for (let i = -2; i <= 2; i++) {
    const sy = i * 2.4;
    ctx.fillStyle = '#8a6a2a';
    ctx.beginPath();
    ctx.arc(sx, sy + 0.2, 0.62, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ffe680';
    ctx.beginPath();
    ctx.arc(sx - 0.1, sy, 0.48, 0, TAU);
    ctx.fill();
  }
  // Its head: a cream skin, lit when struck.
  inked(ctx, ell(ctx, 0.4, 0, 2.1, 6.6), '#fff1d8', 0.65);
  ctx.fillStyle = '#efd6ae';
  ctx.beginPath();
  ctx.ellipse(0.9, 0.4, 1.2, 5.6, 0, 0, TAU);
  ctx.fill();
  if (hit > 0.02) {
    ctx.fillStyle = `rgba(255,255,240,${0.85 * hit})`;
    ctx.beginPath();
    ctx.ellipse(0.4, 0, 2.1, 6.6, 0, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

// ---------- Magic ----------
// The wand: black with white ends and a gold star on its tip, twinkling (`glow` 0-1 brighter).
export function drawWand(ctx, x, y, k, d, a, glow, time, out) {
  ctx.save();
  frame(ctx, x, y, k, d, a);
  inked(ctx, rr(ctx, -0.65, -8.6, 1.3, 11, 0.6), '#2a2238', 0.55);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-0.55, -8.5, 1.1, 2.1);
  ctx.fillRect(-0.55, 1.2, 1.1, 1.6);
  ctx.fillStyle = '#5a4a78';
  ctx.fillRect(-0.4, -6.2, 0.35, 7.2);
  const g = 0.55 + 0.45 * glow;
  ctx.fillStyle = `rgba(255,236,150,${0.3 * g})`;
  ctx.beginPath();
  ctx.arc(0, -10.3, 2.6 + glow * 1.4, 0, TAU);
  ctx.fill();
  ctx.translate(0, -10.3);
  ctx.rotate(Math.sin(time * 3) * 0.25);
  inked(ctx, () => {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const t = -Math.PI / 2 + (i / 10) * TAU;
      const q = i % 2 ? 0.75 : 1.75;
      ctx.lineTo(Math.cos(t) * q, Math.sin(t) * q);
    }
    ctx.closePath();
  }, '#ffe680', 0.45);
  ctx.restore();
  if (out) out.tip = toWorld(x, y, k, d, a, 0, -10.3);
}
// The top hat, held mouth up in the other paw, tipped `tilt`; what's come up out of it so far
// (`reveal`) by how well the trick went (`way`): 0 a single small flower, wilting; 1 a bouquet; 2 a
// string of flags pulled out and out, then a bouquet as well.
export function drawTopHat(ctx, x, y, k, d, tilt, way, reveal, time, out) {
  ctx.save();
  frame(ctx, x, y, k, d, tilt);
  // The crown, its band, the brim and the dark mouth of it.
  inked(ctx, () => {
    ctx.beginPath();
    ctx.moveTo(-3.6, -8.4);
    ctx.lineTo(3.6, -8.4);
    ctx.lineTo(3.2, 0.6);
    ctx.quadraticCurveTo(0, 1.6, -3.2, 0.6);
    ctx.closePath();
  }, '#4a3a6a');
  ctx.fillStyle = '#6a5a8c';
  ctx.fillRect(-2.6, -7.8, 1, 7.6);
  ctx.fillStyle = '#ff8fb4';
  ctx.fillRect(-3.5, -7.1, 7, 1.5);
  ctx.fillStyle = '#ffc2d8';
  ctx.fillRect(-3.5, -7.1, 7, 0.45);
  inked(ctx, ell(ctx, 0, -8.6, 6, 1.8), '#4a3a6a');
  ctx.fillStyle = '#6a5a8c';
  ctx.beginPath();
  ctx.ellipse(0, -8.9, 5.4, 1.2, 0, Math.PI, TAU);
  ctx.fill();
  ctx.fillStyle = '#16101e';
  ctx.beginPath();
  ctx.ellipse(0, -8.7, 3.5, 0.95, 0, 0, TAU);
  ctx.fill();
  // What comes up out of it.
  ctx.save();
  ctx.beginPath();
  ctx.rect(-12, -40, 24, 31.4);
  ctx.clip();
  if (way === 0) wiltedFlower(ctx, Math.min(1, reveal), time);
  else if (way === 1) bouquet(ctx, Math.min(1, reveal), time);
  else {
    flagString(ctx, Math.min(1, reveal), time);
    if (reveal > 1) bouquet(ctx, Math.min(1, reveal - 1), time);
  }
  ctx.restore();
  // (The front of the brim over the stems.)
  ctx.strokeStyle = INK;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.ellipse(0, -8.6, 6, 1.8, 0, 0.15, Math.PI - 0.15);
  ctx.stroke();
  ctx.fillStyle = '#4a3a6a';
  ctx.beginPath();
  ctx.ellipse(0, -8.6, 5.6, 1.45, 0, 0.2, Math.PI - 0.2);
  ctx.ellipse(0, -8.75, 3.5, 0.8, 0, Math.PI - 0.2, 0.2, true);
  ctx.fill();
  ctx.restore();
  if (out) out.hat = toWorld(x, y, k, d, tilt, 0, -9.5);
}
const ease = (u) => 1 - (1 - u) ** 3;
function blossom(ctx, x, y, r, petal, heart, turn = 0) {
  ctx.fillStyle = petal;
  for (let i = 0; i < 5; i++) {
    const a = turn + (i / 5) * TAU;
    ctx.beginPath();
    ctx.ellipse(x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, r * 0.55, r * 0.42, a, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = heart;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.38, 0, TAU);
  ctx.fill();
}
function stem(ctx, x0, y0, x1, y1, bend) {
  ctx.strokeStyle = '#4a9a5a';
  ctx.lineWidth = 0.8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo((x0 + x1) / 2 + bend, (y0 + y1) / 2, x1, y1);
  ctx.stroke();
}
// (A single little flower, poking up - then drooping, sorry for itself.)
function wiltedFlower(ctx, r, time) {
  const u = ease(r);
  const top = -8.6 - 6 * u;
  const droop = 0.5 + 0.9 * u + Math.sin(time * 1.6) * 0.06;
  const hx = Math.sin(droop) * 2.4;
  const hy = top + (1 - Math.cos(droop)) * 2.4;
  stem(ctx, 0, -8, hx * 0.6, hy, 0.6);
  ctx.fillStyle = '#7ab86a';
  ctx.beginPath();
  ctx.ellipse(-1.2, top + 3.4, 1.2, 0.5, 0.5, 0, TAU);
  ctx.fill();
  ctx.save();
  ctx.translate(hx * 0.6 + 0.6, hy + 0.6);
  ctx.rotate(droop);
  blossom(ctx, 0, 0, 1.5, '#e8b8c8', '#d8b860', 0.3);
  ctx.restore();
}
// (A bouquet: five flowers fanning up on their stems, with leaves, a sway in them.)
function bouquet(ctx, r, time) {
  const u = ease(r);
  const flowers = [[-0.5, 9, '#ff9ec0', '#ffe680'], [0.42, 8.4, '#ffe680', '#ff9e60'], [0, 11, '#ffffff', '#ffd040'], [-0.2, 7.6, '#c8a8f0', '#fff3b0'], [0.22, 10.2, '#ff7aa0', '#fff3b0']];
  for (const [i, [ang, len, petal, heart]] of flowers.entries()) {
    const sway = Math.sin(time * 2.2 + i * 1.3) * 0.05;
    const L = len * u;
    const tx = Math.sin(ang + sway) * L;
    const ty = -8.4 - Math.cos(ang + sway) * L;
    stem(ctx, 0, -8, tx, ty, ang * 2);
    if (i === 1 || i === 3) {
      ctx.fillStyle = '#7cc87a';
      ctx.beginPath();
      ctx.ellipse(tx * 0.5 - 0.6, (ty - 8) * 0.5 - 4, 1.4, 0.6, ang - 0.8, 0, TAU);
      ctx.fill();
    }
    blossom(ctx, tx, ty, 1.7 * Math.min(1, u * 1.4), petal, heart, i);
  }
}
// (The flags: a garland pulled up out of the hat, arcing over and down, each flag a pastel colour.)
function flagString(ctx, r, time) {
  const u = ease(r);
  const pts = [];
  const N = Math.max(2, Math.round(26 * u));
  for (let i = 0; i <= N; i++) {
    const v = (i / 26);
    const sway = Math.sin(time * 2.4 - v * 6) * 0.8 * v;
    pts.push([v * 15 + sway * 0.3, -9 - Math.sin(Math.min(1, v * 1.15) * Math.PI) * 13 + v * 6 + sway]);
  }
  ctx.strokeStyle = '#5a3a5a';
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  for (const [px, py] of pts) ctx.lineTo(px, py);
  ctx.stroke();
  const colors = ['#ff9ec0', '#ffe680', '#8fd3ff', '#9fe0a0', '#c8a8f0'];
  for (let i = 1; i < pts.length; i += 2) {
    const [px, py] = pts[i];
    const [qx, qy] = pts[i - 1];
    const a = Math.atan2(py - qy, px - qx);
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(a);
    ctx.fillStyle = colors[(i >> 1) % colors.length];
    ctx.beginPath();
    ctx.moveTo(-1.1, 0);
    ctx.lineTo(1.1, 0);
    ctx.lineTo(0, 2.4 + Math.sin(time * 6 + i) * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

// ---------- Acting ----------
// A theatre mask on a stick, held up over its face: the happy one (gold-rimmed, a big smile, rosy
// cheeks) or the sad one (blue-rimmed, a frown and a tear).
export function drawMask(ctx, x, y, k, d, a, kind, out) {
  ctx.save();
  frame(ctx, x, y, k, d, a);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 2);
  ctx.lineTo(0, -4.5);
  ctx.stroke();
  ctx.strokeStyle = '#d8a46a';
  ctx.lineWidth = 0.6;
  ctx.stroke();
  const happy = kind !== 'sad';
  const shape = () => {
    ctx.beginPath();
    ctx.moveTo(-4.4, -9.6);
    ctx.quadraticCurveTo(0, -11.6, 4.4, -9.6);
    ctx.quadraticCurveTo(5, -5.8, 2.4, -3.6);
    ctx.quadraticCurveTo(0, -2.4, -2.4, -3.6);
    ctx.quadraticCurveTo(-5, -5.8, -4.4, -9.6);
    ctx.closePath();
  };
  inked(ctx, shape, happy ? '#fff8ee' : '#f2f6ff');
  ctx.strokeStyle = happy ? '#f2c94c' : '#8fb8f0';
  ctx.lineWidth = 0.5;
  ctx.save();
  ctx.scale(0.88, 0.88);
  ctx.translate(0, -0.85);
  shape();
  ctx.restore();
  ctx.stroke();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 0.7;
  if (happy) {
    for (const ex of [-1.9, 1.9]) {
      ctx.beginPath();
      ctx.arc(ex, -7.4, 1.05, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    }
    ctx.fillStyle = '#e0507a';
    ctx.beginPath();
    ctx.moveTo(-2.2, -5.6);
    ctx.quadraticCurveTo(0, -2.6, 2.2, -5.6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,140,170,0.6)';
    for (const ex of [-3, 3]) {
      ctx.beginPath();
      ctx.ellipse(ex, -5.6, 0.9, 0.55, 0, 0, TAU);
      ctx.fill();
    }
  } else {
    for (const ex of [-1.9, 1.9]) {
      ctx.beginPath();
      ctx.arc(ex, -8.2, 1.05, Math.PI * 0.1, Math.PI * 0.9);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ex - Math.sign(ex) * 0.2, -9.8);
      ctx.lineTo(ex + Math.sign(ex) * 1.2, -9.3);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(-1.8, -4);
    ctx.quadraticCurveTo(0, -5.8, 1.8, -4);
    ctx.stroke();
    ctx.fillStyle = '#8fd3ff';
    ctx.beginPath();
    ctx.moveTo(2.3, -6.8);
    ctx.quadraticCurveTo(3.1, -5.4, 2.3, -4.9);
    ctx.quadraticCurveTo(1.5, -5.4, 2.3, -6.8);
    ctx.fill();
  }
  // (A ribbon tied at its side.)
  ctx.fillStyle = happy ? '#ff8fb4' : '#8fb8f0';
  ctx.beginPath();
  ctx.ellipse(-4.6, -7.8, 1.2, 0.6, -0.5, 0, TAU);
  ctx.ellipse(-4.6, -6.6, 1.2, 0.6, 0.5, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath();
  ctx.ellipse(-2.4, -9.6, 1.1, 0.5, -0.3, 0, TAU);
  ctx.fill();
  ctx.restore();
  if (out) out.mask = toWorld(x, y, k, d, a, 0, -7);
}
// The script: a scroll held open, lines of words and a red seal.
export function drawScript(ctx, x, y, k, d, a) {
  ctx.save();
  frame(ctx, x, y, k, d, a);
  inked(ctx, rr(ctx, -3.2, -8.6, 6.4, 7.2, 0.4), '#fff8e8', 0.6);
  ctx.fillStyle = '#c8b8a8';
  for (let i = 0; i < 4; i++) ctx.fillRect(-2.4, -7 + i * 1.4, i === 3 ? 2.8 : 4.8, 0.45);
  ctx.fillStyle = '#e0405a';
  ctx.beginPath();
  ctx.arc(1.8, -2.6, 0.75, 0, TAU);
  ctx.fill();
  for (const yy of [-8.8, -1.6]) inked(ctx, rr(ctx, -3.8, yy - 0.7, 7.6, 1.5, 0.75), '#f2e2c4', 0.5);
  ctx.restore();
}
// A rose: a curved stem with a leaf, a deep pink bloom swirled in two tones.
export function drawRose(ctx, x, y, k, d, a, out) {
  ctx.save();
  frame(ctx, x, y, k, d, a);
  stem(ctx, 0, 2, 0.4, -6.4, 0.8);
  ctx.fillStyle = '#6ab86a';
  ctx.beginPath();
  ctx.ellipse(1.1, -2.4, 1.3, 0.55, -0.6, 0, TAU);
  ctx.fill();
  inked(ctx, circle(ctx, 0.4, -7.6, 1.8), '#e83a6a', 0.5);
  ctx.fillStyle = '#ff6f9a';
  ctx.beginPath();
  ctx.arc(0.1, -7.9, 1.2, Math.PI * 0.8, Math.PI * 2.1);
  ctx.fill();
  ctx.strokeStyle = '#b82a52';
  ctx.lineWidth = 0.35;
  ctx.beginPath();
  ctx.arc(0.5, -7.6, 0.7, 0, Math.PI * 1.4);
  ctx.stroke();
  ctx.fillStyle = '#4a9a5a';
  ctx.beginPath();
  ctx.moveTo(-0.9, -6.4);
  ctx.lineTo(0.4, -5.6);
  ctx.lineTo(1.7, -6.4);
  ctx.lineTo(0.4, -6.0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  if (out) out.rose = toWorld(x, y, k, d, a, 0.4, -7.6);
}

// ---------- Dancing ----------
// The ribbon wand and its ribbon, flowing from its tip: `twirl` 0 hanging with a ripple in it, 1
// looping in waves as it's swung, 2 spun in a spiral overhead. A long satin band, wide at the wand
// and narrowing, its two faces in two pinks so the turns read, a sparkle at its tail.
export function drawRibbon(ctx, x, y, k, d, a, twirl, time, out) {
  ctx.save();
  frame(ctx, x, y, k, d, a);
  inked(ctx, rr(ctx, -0.5, -8, 1, 10, 0.5), '#fff3d8', 0.5);
  inked(ctx, circle(ctx, 0, -8.3, 0.9), '#f2c94c', 0.45);
  ctx.restore();
  const [tx, ty] = toWorld(x, y, k, d, a, 0, -8.3);
  const N = 40;
  const step = 1.05 * k;
  const pts = [[tx, ty]];
  const t1 = Math.min(1, twirl);
  const t2 = Math.max(0, twirl - 1);
  let th = a;
  for (let i = 1; i <= N; i++) {
    const v = i / N;
    // (Hanging: drawn round toward straight down, a ripple running along it.)
    const hang = a + (Math.PI - a) * Math.min(1, v * 1.6) + Math.sin(time * 5 - v * 9) * 0.35 * v;
    // (Swung: snaking loops.)
    const wave = a + v * 1.1 + Math.sin(time * 4.2 - v * 6) * 0.75;
    // (Spun: a spiral round and round.)
    const spin = a + time * 7 + v * 11;
    const want = t2 > 0 ? wave + (spin - wave) * t2 : hang + (wave - hang) * t1;
    th += (want - th) * (i === 1 ? 1 : 0.55);
    const [px, py] = pts[i - 1];
    pts.push([px + d * Math.sin(th) * step, py - Math.cos(th) * step]);
  }
  for (let i = 0; i < N; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[i + 1];
    const w = (1.9 - (i / N) * 1.1) * k;
    const nx = -(by - ay);
    const ny = bx - ax;
    const l = Math.hypot(nx, ny) || 1;
    const face = Math.sin(i * 0.35 + time * 3) > 0;
    ctx.fillStyle = face ? '#ff7aa8' : '#ffb3cf';
    ctx.beginPath();
    ctx.moveTo(ax + (nx / l) * w * 0.5, ay + (ny / l) * w * 0.5);
    ctx.lineTo(bx + (nx / l) * w * 0.5, by + (ny / l) * w * 0.5);
    ctx.lineTo(bx - (nx / l) * w * 0.5, by - (ny / l) * w * 0.5);
    ctx.lineTo(ax - (nx / l) * w * 0.5, ay - (ny / l) * w * 0.5);
    ctx.closePath();
    ctx.fill();
  }
  const [ex, ey] = pts[N];
  twinkle(ctx, ex, ey, 1.8 * k, '#fff3b0', 0.6 + 0.4 * Math.sin(time * 9));
  if (out) out.ribbon = [ex, ey];
}

// ---------- Mime ----------
// Nothing in its paws - but the invisible thing it's pressing on glints where it touches: a pane of
// glass in front (`wall`), a ceiling over it (`roof`), a rope it hauls on (`rope`), a ladder's rung
// (`rung`). `k2` how much it's there (0-1, easing in and out).
export function drawMime(ctx, x, y, k, d, kind, k2, time) {
  if (!kind || k2 <= 0.02) return;
  ctx.save();
  ctx.lineCap = 'round';
  const glass = (x0, y0, x1, y1) => {
    ctx.strokeStyle = `rgba(220,240,255,${0.16 * k2})`;
    ctx.lineWidth = 3 * k;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.strokeStyle = `rgba(255,255,255,${0.62 * k2})`;
    ctx.lineWidth = 0.6 * k;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  };
  if (kind === 'wall') {
    const wx = x + d * 1.8 * k;
    glass(wx, y - 9 * k, wx, y + 7 * k);
    ripple(ctx, wx, y, k, k2, time, true);
  } else if (kind === 'roof') {
    const wy = y - 1.8 * k;
    glass(x - 9 * k, wy, x + 9 * k, wy);
    ripple(ctx, x, wy, k, k2, time, false);
  } else if (kind === 'rung') {
    glass(x - 4.5 * k, y, x + 4.5 * k, y);
  } else if (kind === 'rope') {
    ctx.strokeStyle = `rgba(255,255,255,${0.55 * k2})`;
    ctx.lineWidth = 0.7 * k;
    ctx.setLineDash([1.4 * k, 1.2 * k]);
    ctx.lineDashOffset = -time * 6;
    ctx.beginPath();
    ctx.moveTo(x - d * 1 * k, y + 4 * k);
    ctx.quadraticCurveTo(x + Math.sin(time * 3) * 0.6 * k, y, x + d * 4 * k, y - 16 * k);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  twinkle(ctx, x + (kind === 'wall' ? d * 1.8 * k : 0), y + (kind === 'roof' ? -1.8 * k : 0), (1.3 + 0.4 * Math.sin(time * 7)) * k, '#ffffff', k2);
  ctx.restore();
}
function ripple(ctx, x, y, k, k2, time, upright) {
  for (let i = 0; i < 2; i++) {
    const u = (time * 1.6 + i * 0.5) % 1;
    ctx.strokeStyle = `rgba(255,255,255,${0.4 * k2 * (1 - u)})`;
    ctx.lineWidth = 0.4 * k;
    ctx.beginPath();
    if (upright) ctx.ellipse(x, y, 0.8 * k * (0.4 + u), 3 * k * (0.4 + u), 0, 0, TAU);
    else ctx.ellipse(x, y, 3 * k * (0.4 + u), 0.8 * k * (0.4 + u), 0, 0, TAU);
    ctx.stroke();
  }
}
