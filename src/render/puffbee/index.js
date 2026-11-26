// The Puffbee (2026-11-25, remade on the round bug base, the player's pick "B" of three, the Pollen
// Post): Petal Meadow's level 2 bee round the Beehive Banks, a courier for the hive. A sunny yellow
// bee with two soft brown bands, a little blue post cap with a gold wing badge, a leather satchel on a
// strap across its body stuffed with pollen letters (heart seals), and a letter always in its front
// foot; big eager sky-blue eyes with star lights, three short lashes, an open eager smile. It flies on
// its own copy of the round bug base (beebase.js: its bones, wings, feelers, springs and moves),
// dressed here.
//   idle    a 30 s act while it hovers in one place (it pauses the moment it flies on):
//           - the letter up to read the address: a squint, a head tilt... it's upside down; turned
//             the right way up, an "aha";
//           - a tiny map unfolded and turned round, and round, and round, until it's dizzy (stars),
//             a shake of the head, a determined nod;
//           - the letter slips: a gasp, a panicked dive, caught just above the grass, a sweat drop of
//             relief, back up;
//           - the satchel swung round to count the letters in it, a feeler nod at each, a happy wag;
//           - a breath on the cap badge, a polish with one feeler till it gleams, chest out, proud.
//   moves   (def.moves order) the letter dart (the letter drawn back and flicked like a paper plane,
//           landing in a puff of sparkles), the satchel swing (swung back, then round and up into
//           you, letters jumping), the special delivery (a zip forward, sparkles streaming off it).
//   faces   reading, a squint, wide (shocked), worried, dizzy, focused before a move, happy, proud,
//           hurt (squeezed shut), asleep (napping landed, its cap tipped down over its eyes, little
//           blue "z"s), and soft swirls when it's beaten.
// Everything drawn here from scratch (the face too).
import { dressedBee } from './beebase.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, u) => a + (b - a) * u;
const sstep = (u) => {
  const v = clamp(u, 0, 1);
  return v * v * (3 - 2 * v);
};
// (a beat's weight: 0 before t0, eased up to 1 by t1, held to t2, eased back to 0 by t3)
const win = (t, t0, t1, t2, t3) => sstep((t - t0) / (t1 - t0)) * (1 - sstep((t - t2) / (t3 - t2)));
const ell = (ctx, x, y, rx, ry, r = 0) => {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), r, 0, TAU);
};
const fillOr = (ctx, a, K, mode, c) => {
  if (mode === 'line') K.edge(ctx);
  else {
    ctx.fillStyle = K.colour(a, c);
    ctx.fill();
  }
};
const pen = (ctx, a, K, col, w) => {
  ctx.strokeStyle = K.colour(a, col);
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
};
const sparkle = (ctx, x, y, s) => {
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.quadraticCurveTo(x, y, x + s, y);
  ctx.quadraticCurveTo(x, y, x, y + s);
  ctx.quadraticCurveTo(x, y, x - s, y);
  ctx.quadraticCurveTo(x, y, x, y - s);
  ctx.fill();
};
const heart = (ctx, x, y, s) => {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.9);
  ctx.bezierCurveTo(x - s * 1.4, y - s * 0.1, x - s * 0.7, y - s * 1.2, x, y - s * 0.45);
  ctx.bezierCurveTo(x + s * 0.7, y - s * 1.2, x + s * 1.4, y - s * 0.1, x, y + s * 0.9);
};
const blush = (ctx, a, K, x, y, rx, ry, al) => {
  const g = ctx.createRadialGradient(x, y, 0, x, y, rx);
  g.addColorStop(0, K.tint(a, '#ff7a7a', al));
  g.addColorStop(1, K.tint(a, '#ff7a7a', 0));
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, ry / rx);
  ctx.translate(-x, -y);
  ctx.fillStyle = g;
  ctx.fillRect(x - rx, y - rx, rx * 2, rx * 2);
  ctx.restore();
};
const INK = '#8a6a3a';
const EYE_INK = '#1e2a4a';
const CAP = '#5a8ad8';
const LEATHER = '#c98a55';
const STRAP = '#a8683a';

// ---------- Its face (head frame: about the head's middle, the face to the right) ----------
const blinkOf = (a) => ((a.t ?? 0) + (a.mo?.uid ?? 0) * 0.41) % 4.4 < 0.13;
// Big eager eyes: tall, a sky-blue iris (a deep blue rim, a bright middle, ice-blue at the bottom), a
// star light and a little round one; a clean lid with three short upflicked lashes (the near eye); a
// soft blue lower lid. `k`: 1 the near eye, ~0.62 the far one (three-quarter on).
function eye(ctx, a, K, x, y, k, f) {
  const rx = 1.6 * k;
  const ry = 2.15 * (0.92 + 0.08 * k);
  const shut = (kind) => {
    pen(ctx, a, K, EYE_INK, 0.48);
    ctx.beginPath();
    if (kind === 'happy') {
      ctx.moveTo(x - rx, y + ry * 0.3);
      ctx.quadraticCurveTo(x, y - ry * 0.65, x + rx, y + ry * 0.3);
    } else if (kind === 'hurt') {
      ctx.moveTo(x + rx * 0.7, y - ry * 0.45);
      ctx.lineTo(x - rx * 0.5, y + ry * 0.05);
      ctx.lineTo(x + rx * 0.7, y + ry * 0.5);
    } else {
      ctx.moveTo(x - rx, y + ry * 0.2);
      ctx.quadraticCurveTo(x, y + ry * 0.75, x + rx, y + ry * 0.15);
    }
    ctx.stroke();
    if (kind !== 'hurt' && k > 0.9) {
      ctx.lineWidth = 0.3;
      ctx.beginPath();
      ctx.moveTo(x - rx * 0.9, y + ry * 0.3);
      ctx.lineTo(x - rx * 1.3, y + ry * 0.05);
      ctx.stroke();
    }
  };
  if (f === 'hurt') return shut('hurt');
  if (f === 'happy' || f === 'proud') return shut('happy');
  if (f === 'sleep' || f === 'blink') return shut('shut');
  if (f === 'dizzy' || f === 'dead') {
    pen(ctx, a, K, EYE_INK, 0.34);
    ctx.beginPath();
    const turn = (a.t ?? 0) * (f === 'dizzy' ? 6 : 0);
    for (let i = 0; i <= 28; i++) {
      const s = i / 28;
      const th = s * TAU * 1.75 + turn;
      const p = [x + Math.cos(th) * rx * 0.85 * s, y + Math.sin(th) * ry * 0.75 * s];
      if (i) ctx.lineTo(...p);
      else ctx.moveTo(...p);
    }
    ctx.stroke();
    return;
  }
  const wide = f === 'wide' ? 1.1 : 1;
  const ex = rx * wide;
  const ey = ry * wide;
  // (where it looks: down at a letter or a map, or ahead)
  const look = f === 'read' ? [0.12, 0.3] : f === 'up' ? [0.05, -0.25] : [0.12, 0];
  ell(ctx, x, y, ex, ey);
  ctx.fillStyle = K.colour(a, '#ffffff');
  ctx.fill();
  ctx.save();
  ell(ctx, x, y, ex, ey);
  ctx.clip();
  const ir = f === 'wide' ? 0.78 : 1;
  const ix = x + ex * look[0];
  const iy = y + ey * look[1];
  ell(ctx, ix, iy + ey * 0.04, ex * 0.86 * ir, ey * 0.8 * ir);
  ctx.fillStyle = K.colour(a, '#1d4f9a');
  ctx.fill();
  ell(ctx, ix, iy + ey * 0.2 * ir, ex * 0.72 * ir, ey * 0.58 * ir);
  ctx.fillStyle = K.colour(a, '#3a8ae0');
  ctx.fill();
  ell(ctx, ix, iy + ey * 0.45 * ir, ex * 0.54 * ir, ey * 0.26 * ir);
  ctx.fillStyle = K.colour(a, '#9fe0ff');
  ctx.fill();
  const pr = f === 'wide' ? 0.26 : f === 'focus' ? 0.32 : 0.38;
  ell(ctx, ix + ex * 0.04, iy + ey * 0.02, ex * pr, ey * (pr - 0.02));
  ctx.fillStyle = K.colour(a, '#0a1a36');
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  sparkle(ctx, ix - ex * 0.3, iy - ey * 0.28, ex * 0.5);
  ell(ctx, ix + ex * 0.4, iy + ey * 0.4, ex * 0.15, ey * 0.11);
  ctx.fill();
  // narrowed: a squint (both lids in) or focused (the top flattened)
  if (f === 'squint' || f === 'focus') {
    ctx.fillStyle = K.colour(a, K.C.base);
    ctx.beginPath();
    ctx.rect(x - ex * 1.3, y - ey * 1.3, ex * 2.6, ey * (f === 'squint' ? 0.85 : 0.7));
    ctx.fill();
    if (f === 'squint') {
      ctx.beginPath();
      ctx.rect(x - ex * 1.3, y + ey * 0.5, ex * 2.6, ey);
      ctx.fill();
    }
  }
  ctx.restore();
  pen(ctx, a, K, EYE_INK, 0.44);
  if (f === 'squint' || f === 'focus') {
    ctx.beginPath();
    const yT = y - ey * (f === 'squint' ? 0.45 : 0.6);
    ctx.moveTo(x - ex * 1.05, yT + (f === 'focus' ? -ey * 0.12 : 0));
    ctx.lineTo(x + ex * 1.05, yT + (f === 'focus' ? ey * 0.1 : 0));
    ctx.stroke();
    if (f === 'squint') {
      ctx.lineWidth = 0.3;
      ctx.beginPath();
      ctx.moveTo(x - ex * 0.9, y + ey * 0.5);
      ctx.lineTo(x + ex * 0.9, y + ey * 0.5);
      ctx.stroke();
    }
    return;
  }
  ctx.beginPath();
  ctx.ellipse(x, y, ex * 1.02, ey * 1.0, 0, Math.PI * 1.1, Math.PI * 1.9);
  ctx.stroke();
  if (k > 0.9) {
    ctx.lineWidth = 0.32;
    for (const [u, len] of [[1.12, 0.7], [1.24, 0.6], [1.37, 0.45]]) {
      const q = Math.PI * u;
      const p = [x + Math.cos(q) * ex * 1.02, y + Math.sin(q) * ey];
      ctx.beginPath();
      ctx.moveTo(...p);
      ctx.lineTo(p[0] - 0.35 - len * 0.4, p[1] - len);
      ctx.stroke();
    }
  }
  pen(ctx, a, K, '#7ab8e8', 0.28);
  ctx.beginPath();
  ctx.arc(x, y + ey * 0.05, ex * 0.95, Math.PI * 0.2, Math.PI * 0.8);
  ctx.stroke();
}
// Brows (only for some moods): worried (lifted toward the middle), focused (down toward the middle).
function brows(ctx, a, K, f) {
  if (f !== 'worried' && f !== 'focus' && f !== 'proud') return;
  pen(ctx, a, K, EYE_INK, 0.42);
  ctx.beginPath();
  if (f === 'worried') {
    ctx.moveTo(0.3, -2.55);
    ctx.quadraticCurveTo(1.6, -2.9, 2.7, -3.35);
    ctx.moveTo(3.9, -3.2);
    ctx.quadraticCurveTo(4.6, -3.0, 5.1, -2.6);
  } else if (f === 'focus') {
    ctx.moveTo(0.3, -3.35);
    ctx.quadraticCurveTo(1.5, -3.2, 2.7, -2.6);
    ctx.moveTo(3.9, -2.6);
    ctx.quadraticCurveTo(4.5, -3.0, 5.1, -3.2);
  } else {
    ctx.moveTo(0.4, -2.9);
    ctx.quadraticCurveTo(1.5, -3.5, 2.6, -3.1);
  }
  ctx.stroke();
}
// The mouth: an open eager smile (a wide grin when happy or proud), a little round "o" for a gasp or
// a breath on the badge, a wobbly line when worried or dizzy, a tight one when focused.
function mouth(ctx, a, K, sk, f) {
  const mx = 3.8;
  const my = 2.5;
  const o = a.pb?.oh ?? 0;
  pen(ctx, a, K, '#6a2a22', 0.32);
  if (f === 'sleep') {
    ell(ctx, mx, my + 0.1, 0.35, 0.25);
    ctx.fillStyle = K.colour(a, '#9a3a34');
    ctx.fill();
    return;
  }
  if (f === 'wide' || o > 0.3) {
    ell(ctx, mx, my + 0.35, 0.55, 0.7);
    ctx.fillStyle = K.colour(a, '#9a3a34');
    ctx.fill();
    ctx.stroke();
    return;
  }
  if (f === 'worried' || f === 'dizzy' || f === 'dead') {
    ctx.beginPath();
    ctx.moveTo(mx - 0.9, my + 0.3);
    for (let i = 1; i <= 6; i++) ctx.lineTo(mx - 0.9 + i * 0.3, my + 0.3 + (i % 2 ? -0.25 : 0.15));
    ctx.stroke();
    return;
  }
  if (f === 'focus' || f === 'hurt') {
    ctx.beginPath();
    ctx.moveTo(mx - 0.7, my + 0.35);
    ctx.quadraticCurveTo(mx, my + 0.05, mx + 0.7, my + 0.3);
    ctx.stroke();
    return;
  }
  const big = f === 'happy' || f === 'proud' ? 1.25 : 1;
  const open = Math.max(0, sk.jaw ?? 0);
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(mx - 0.85 * big, my - 0.15);
    ctx.quadraticCurveTo(mx, my + 0.1, mx + 0.85 * big, my - 0.25);
    ctx.bezierCurveTo(mx + 0.7 * big, my + (1.1 + open) * big, mx - 0.7 * big, my + (1.2 + open) * big, mx - 0.85 * big, my - 0.15);
    ctx.closePath();
  };
  path();
  ctx.fillStyle = K.colour(a, '#9a3a34');
  ctx.fill();
  ctx.save();
  ctx.clip();
  ell(ctx, mx + 0.05, my + 0.85 * big, 0.6 * big, 0.4 * big);
  ctx.fillStyle = K.colour(a, '#ff8f96');
  ctx.fill();
  ctx.restore();
  path();
  ctx.stroke();
}
function face(ctx, a, sk, K) {
  const f = a.pb?.face ?? (blinkOf(a) ? 'blink' : 'open');
  blush(ctx, a, K, 1.3, 2.6, 1.5, 0.75, f === 'happy' || f === 'proud' ? 0.75 : 0.55);
  eye(ctx, a, K, 4.5, -0.4, 0.62, f);
  eye(ctx, a, K, 1.75, -0.2, 1, f);
  brows(ctx, a, K, f);
  mouth(ctx, a, K, sk, f);
}

// ---------- Its gear ----------
// An envelope (its own frame, its middle at 0, 0): a soft white card, the flap's V, a heart seal.
function envelope(ctx, a, K, mode, w = 3.6, h = 2.6, seal = true) {
  ctx.beginPath();
  const r = 0.5;
  ctx.moveTo(-w / 2 + r, -h / 2);
  ctx.lineTo(w / 2 - r, -h / 2);
  ctx.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  ctx.lineTo(w / 2, h / 2 - r);
  ctx.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  ctx.lineTo(-w / 2 + r, h / 2);
  ctx.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  ctx.lineTo(-w / 2, -h / 2 + r);
  ctx.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  ctx.closePath();
  fillOr(ctx, a, K, mode, '#fffdf6');
  if (mode !== 'fill') return;
  pen(ctx, a, K, '#d8c8b8', 0.3);
  ctx.beginPath();
  ctx.moveTo(-w / 2 + 0.3, -h / 2 + 0.3);
  ctx.lineTo(0, h * 0.08);
  ctx.lineTo(w / 2 - 0.3, -h / 2 + 0.3);
  ctx.stroke();
  if (seal) {
    heart(ctx, 0, h * 0.1, 0.62);
    ctx.fillStyle = K.colour(a, '#ff6f8e');
    ctx.fill();
  }
}
// An envelope with its own soft outline (drawn on its own, over everything).
function letter(ctx, a, K, w, h) {
  envelope(ctx, a, K, 'line', w, h);
  envelope(ctx, a, K, 'fill', w, h);
}
// The paper-plane letter (its own frame, nose to the right).
function plane(ctx, a, K) {
  const pts = [[2.8, 0], [-2.2, -1.5], [-1.2, 0.1], [-2.2, 1.0]];
  const path = () => {
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
    ctx.closePath();
  };
  path();
  K.edge(ctx);
  path();
  ctx.fillStyle = K.colour(a, '#fffdf6');
  ctx.fill();
  pen(ctx, a, K, '#d8c8b8', 0.28);
  ctx.beginPath();
  ctx.moveTo(2.6, 0);
  ctx.lineTo(-1.2, 0.1);
  ctx.stroke();
  heart(ctx, -0.6, -0.55, 0.42);
  ctx.fillStyle = K.colour(a, '#ff6f8e');
  ctx.fill();
}
// The little map (its own frame, its middle at 0, 0): a pale green folded sheet, a dotted path, a
// heart where the letter goes.
function map(ctx, a, K) {
  const w = 5.2;
  const h = 3.8;
  ctx.beginPath();
  ctx.moveTo(-w / 2, -h / 2);
  for (let i = 1; i <= 3; i++) ctx.lineTo(-w / 2 + (w * i) / 3, -h / 2 + (i % 2 ? 0.3 : 0));
  ctx.lineTo(w / 2, h / 2);
  for (let i = 2; i >= 0; i--) ctx.lineTo(-w / 2 + (w * i) / 3, h / 2 + (i % 2 ? 0.3 : 0));
  ctx.closePath();
  K.edge(ctx);
  ctx.fillStyle = K.colour(a, '#e8f6d4');
  ctx.fill();
  ctx.fillStyle = K.tint(a, '#b8d8a0', 0.7);
  ctx.fillRect(-w / 2 + w / 3, -h / 2 + 0.3, w / 3, h - 0.3);
  ctx.setLineDash([0.4, 0.4]);
  pen(ctx, a, K, '#c87a4a', 0.3);
  ctx.beginPath();
  ctx.moveTo(-1.9, 1.1);
  ctx.quadraticCurveTo(-0.6, -1.4, 0.6, 0.4);
  ctx.quadraticCurveTo(1.2, 1.2, 1.7, -0.6);
  ctx.stroke();
  ctx.setLineDash([]);
  heart(ctx, 1.7, -0.7, 0.55);
  ctx.fillStyle = K.colour(a, '#ff6f8e');
  ctx.fill();
}
// The satchel's place: its pivot (where it hangs off the strap) in the body's own frame.
const BAG = [-4.4, 3.4];
// (how far out on its strap it hangs: swung hard, it flies out, the strap paying out behind it)
const reachOf = (sw) => 2.0 + Math.max(0, sw - 0.4) * 13;
// (swung out in front, it's drawn over the head; hanging at its side, with the body)
const OUT_FRONT = 0.5;
function satchel(ctx, a, K, mode) {
  const sw = a.pb?.swing ?? 0;
  const reach = reachOf(sw);
  ctx.save();
  K.bodyFrame(ctx, a);
  ctx.translate(...BAG);
  ctx.rotate(-sw);
  if (reach > 2.3) {
    ctx.beginPath();
    K.addLimb(ctx, [[0, 0], [0, reach - 1.4]], [0.9, 0.9]);
    fillOr(ctx, a, K, mode, STRAP);
  }
  ctx.translate(0, reach);
  ctx.rotate(-0.12);
  // the letters peeking out of it (one rising up as it counts them)
  const up = a.pb?.peek ?? [0, 0];
  for (const [i, [dx, r]] of [[-0.9, -0.3], [0.9, 0.25]].entries()) {
    ctx.save();
    ctx.translate(dx, -2.4 - (up[i] ?? 0) * 2.2);
    ctx.rotate(r);
    envelope(ctx, a, K, mode, 2.8, 2.2);
    ctx.restore();
  }
  ctx.beginPath();
  ctx.moveTo(-2.9, -1.6);
  ctx.lineTo(2.9, -1.6);
  ctx.quadraticCurveTo(3.3, -1.6, 3.2, -1);
  ctx.lineTo(2.9, 1.6);
  ctx.quadraticCurveTo(2.8, 2.3, 2.1, 2.3);
  ctx.lineTo(-2.1, 2.3);
  ctx.quadraticCurveTo(-2.8, 2.3, -2.9, 1.6);
  ctx.lineTo(-3.2, -1);
  ctx.quadraticCurveTo(-3.3, -1.6, -2.9, -1.6);
  ctx.closePath();
  fillOr(ctx, a, K, mode, LEATHER);
  if (mode === 'fill') {
    ctx.beginPath();
    ctx.moveTo(-3.0, -1.5);
    ctx.lineTo(3.0, -1.5);
    ctx.lineTo(2.6, 0.4);
    ctx.quadraticCurveTo(0, 1.3, -2.6, 0.4);
    ctx.closePath();
    ctx.fillStyle = K.colour(a, STRAP);
    ctx.fill();
    heart(ctx, 0, 0.55, 0.55);
    ctx.fillStyle = K.colour(a, '#ffd23e');
    ctx.fill();
    K.bloom(ctx, a, [-1.2, -0.8], 2, '#f0c08a', 0.6);
  }
  ctx.restore();
}
// The post cap (head frame): a round blue crown, a short brim forward, a gold wing badge (gleaming
// when polished); tipped down over its eyes as it naps.
function cap(ctx, a, K, mode) {
  const r = a.bk.r;
  const tip = a.pb?.capTip ?? 0;
  K.headFrame(ctx, a);
  ctx.translate(-r * 0.1 * tip, r * 0.34 * tip);
  ctx.rotate(0.42 * tip);
  ctx.beginPath();
  ctx.moveTo(-r * 0.95, -r * 0.3);
  ctx.bezierCurveTo(-r * 1.05, -r * 1.25, r * 0.6, -r * 1.4, r * 0.82, -r * 0.55);
  ctx.quadraticCurveTo(r * 1.35, -r * 0.5, r * 1.45, -r * 0.32);
  ctx.quadraticCurveTo(r * 1.0, -r * 0.2, r * 0.5, -r * 0.4);
  ctx.quadraticCurveTo(-r * 0.2, -r * 0.55, -r * 0.95, -r * 0.3);
  ctx.closePath();
  fillOr(ctx, a, K, mode, CAP);
  if (mode !== 'fill') return;
  ctx.save();
  ctx.clip();
  K.bloom(ctx, a, [-r * 0.2, -r * 1.05], r * 0.8, '#a8c8ff', 0.8);
  ctx.fillStyle = K.colour(a, '#3a64b0');
  ctx.beginPath();
  ctx.moveTo(r * 0.5, -r * 0.4);
  ctx.quadraticCurveTo(r * 1.0, -r * 0.2, r * 1.45, -r * 0.32);
  ctx.lineTo(r * 1.5, -r * 0.2);
  ctx.lineTo(r * 0.4, -r * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = K.colour(a, '#ffc848');
  ell(ctx, r * 0.25, -r * 0.88, r * 0.15, r * 0.15);
  ctx.fill();
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(r * 0.25 + s * r * 0.24, -r * 0.92, r * 0.17, r * 0.08, s * -0.4, 0, TAU);
    ctx.fill();
  }
  const gleam = a.pb?.gleam ?? 0;
  if (gleam > 0.02) {
    ctx.globalAlpha *= gleam;
    ctx.fillStyle = '#ffffff';
    sparkle(ctx, r * 0.36, -r * 1.0, r * 0.24);
  }
}
// Where the letter in its foot is (rig space) and how it's turned; null: not in its foot.
function letterAt(a, K) {
  const sk = a.bk;
  const pb = a.pb ?? {};
  if ((pb.letter ?? 1) < 0.5) return null;
  const P = sk.legs.l0n.P;
  const rd = pb.read ?? 0;
  const p = [P[0] + lerp(0.6, 1.4, rd) + (pb.drop?.dx ?? 0), P[1] + lerp(1.3, -0.3, rd) + (pb.drop?.dy ?? 0)];
  // (drawn back for the throw: raised up and tipped back)
  const wd = pb.wind ?? 0;
  p[0] -= wd * 1.2;
  p[1] -= wd * 2.2;
  return { p, r: lerp(0.25, 0, rd) + (pb.flip ?? 0) + (pb.drop?.r ?? 0) - wd * 1.0 };
}

// ---------- Its own moves ----------
// The letter dart: reared back with the letter drawn up behind its head, a flick, follow-through.
const LETTER = {
  anticT: 0.3,
  keys: [
    [0, { x: -0.08, hop: 0.06, pitch: -18, head: 8, ant: 0.7, buzz: 1.2 }],
    [0.06, { x: 0.06, hop: 0, pitch: 16, head: -6, ant: -0.4, buzz: 1.5 }, 'out'],
    [0.2, { x: 0.05, pitch: 10, head: -4, ant: -0.2, buzz: 1.3 }, 'io'],
    [0.5, { x: 0.01, pitch: 2 }, 'io'],
    [0.75, {}],
  ],
};
// The satchel swing: turned away with the bag swung back, then round and up into you.
const SATCHEL = {
  anticT: 0.32,
  keys: [
    [0, { x: -0.06, hop: 0.04, pitch: -16, head: -8, ant: 0.6, buzz: 1.2 }],
    [0.08, { x: 0.2, hop: -0.03, pitch: 24, head: 10, ant: -0.6, buzz: 1.5 }, 'out'],
    [0.18, { x: 0.2, pitch: 16, head: 6, ant: -0.3, buzz: 1.3 }, 'io'],
    [0.5, { x: 0.05, pitch: 4 }, 'io'],
    [0.82, {}],
  ],
};

// ---------- Its dress ----------
const POST = {
  ink: INK,
  C: { lt: '#fff8c8', base: '#ffd23e', sh: '#f0a828', deep: '#d8ac6a', wing: '#f8fcff', wingRim: '#d4e2f0', wingFar: '#e6eef8' },
  quietIdle: true,
  moves: { letter: LETTER, satchel: SATCHEL },
  face,
  over: {
    body: (ctx, a, mode, K) => {
      const sk = a.bk;
      if (mode === 'fill') {
        ctx.save();
        K.bodyPath(ctx, a);
        ctx.clip();
        ctx.save();
        K.bodyFrame(ctx, a);
        // two soft brown bands, bowed round the body
        for (const [x0, x1] of [[-6.2, -3.8], [-1.6, 0.9]]) {
          ctx.beginPath();
          ctx.moveTo(x0, -9);
          ctx.quadraticCurveTo(x0 + 1.5, 0, x0, 9);
          ctx.lineTo(x1, 9);
          ctx.quadraticCurveTo(x1 + 1.5, 0, x1, -9);
          ctx.closePath();
          ctx.fillStyle = K.colour(a, '#8a5a3c');
          ctx.fill();
        }
        // the strap, from the shoulder down across the body to the bag
        const sw = a.pb?.swing ?? 0;
        const bagTop = [BAG[0] + Math.sin(sw) * 0.6, BAG[1] - (1 - Math.cos(sw)) * 0.3];
        ctx.beginPath();
        ctx.moveTo(4.6, -5.6);
        ctx.lineTo(5.9, -4.4);
        ctx.lineTo(bagTop[0] + 0.7, bagTop[1] + 0.6);
        ctx.lineTo(bagTop[0] - 0.7, bagTop[1] - 0.2);
        ctx.closePath();
        ctx.fillStyle = K.colour(a, STRAP);
        ctx.fill();
        ctx.setLineDash([0.4, 0.4]);
        ctx.strokeStyle = K.colour(a, '#e8b07a');
        ctx.lineWidth = 0.2;
        ctx.beginPath();
        ctx.moveTo(5.0, -5.0);
        ctx.lineTo(bagTop[0], bagTop[1] + 0.2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
        K.bloom(ctx, a, sk.at([-0.8, -3.6]), K.sc(6.4), '#fffbe0', 0.55);
        K.bloom(ctx, a, sk.at([-0.4, 7]), K.sc(6.8), '#c8822a', 0.5);
        ctx.restore();
      }
      if ((a.pb?.swing ?? 0) <= OUT_FRONT) satchel(ctx, a, K, mode);
    },
    head: (ctx, a, mode, K) => {
      if ((a.pb?.swing ?? 0) > OUT_FRONT) {
        ctx.save();
        satchel(ctx, a, K, mode);
        ctx.restore();
      }
      cap(ctx, a, K, mode);
    },
  },
  // Its act and its face (a.pb), and its held feet (a.bgHold), on the base's channels (x, hop, lift,
  // pitch, crouch, tuck, land, sleep, groom, head, ant, wings, buzz, sway).
  pose: (m, a, out, K, mv, mt) => {
    const st = (a.mo.rig ??= {});
    const F = (st.pbF ??= {});
    const dt = clamp(a.dt ?? 0, 0, 0.05);
    const r = a.bk?.r ?? K.sc(5.6);
    const pb = { face: null, letter: 1, read: 0, flip: 0, drop: null, swing: 0, wind: 0, peek: [0, 0], capTip: 0, gleam: 0, oh: 0, map: 0, mapR: 0, dizzy: 0, sweat: -1, plane: -1, burst: -1, zip: 0 };
    a.pb = pb;
    a.bgHold = null;
    a.bgHoldF = null;
    const napping = m.hp > 0 && m.habit?.kind === 'nap' && (m.habit.until == null || (a.now ?? 0) < m.habit.until);
    const mood = m.cine?.mood ?? a.mood;
    const v = st.bgV ?? 0;
    // (the satchel hangs and swings: trailing as it flies, swinging as it starts and stops)
    let swingGoal = -clamp(v / 30, 0, 1) * 0.35 + Math.sin((a.t ?? 0) * 2.2) * 0.05;
    // Faces first: beaten, hurt, asleep, in a move, a scene's mood.
    if (m.hp <= 0) {
      pb.face = 'dead';
      pb.capTip = 0.6;
    } else if ((a.hurtAgo ?? 9) < 0.5 || mv === K.moves.hurt) pb.face = 'hurt';
    else if (napping || m.pose === 'sleep' || mood === 'sleep') {
      pb.face = 'sleep';
      pb.capTip = 1;
    } else if (mv === K.moves.waggle) pb.face = 'happy';
    else if (mv || a.face === 'angry' || mood === 'angry') pb.face = 'focus';
    else if (mood === 'happy') pb.face = 'happy';
    else if (mood === 'sad') pb.face = 'worried';
    // Its moves' extras: the letter drawn back and flung, the bag swung, the zip.
    if (mv === K.moves.letter) {
      // (the letter drawn back over the wind-up, not snapped up behind its head the moment it starts)
      const back = mt < 0 ? sstep((mt + LETTER.anticT) / (LETTER.anticT * 0.75)) : 1 - sstep(mt / 0.06);
      const fling = mt < 0 ? 0 : win(mt, 0, 0.05, 0.12, 0.4);
      a.bgHold = { k: Math.max(back, fling), at: back > fling ? [-r * 0.3, -r * 1.15] : [r * 1.6, r * 0.1] };
      pb.letter = mt > 0.03 && mt < 0.6 ? 0 : 1;
      pb.plane = mt >= 0.03 && mt < 0.75 ? mt - 0.03 : -1;
      pb.wind = back;
    } else if (mv === K.moves.satchel) {
      swingGoal = mt < 0 ? -1.0 : mt < 0.2 ? 1.45 : 0.2;
      pb.burst = mt >= 0.07 && mt < 0.6 ? (mt - 0.07) / 0.53 : -1;
      pb.peek = pb.burst >= 0 ? [Math.sin(Math.PI * pb.burst) * 1.2, Math.sin(Math.PI * clamp(pb.burst * 1.3, 0, 1)) * 0.9] : [0, 0];
    } else if (mv === K.moves.buzz) pb.zip = mt >= 0 && mt < 0.5 ? 1 - mt / 0.5 : 0;
    // Its act: only hovering in one place (a flyer is always "moving" to the game, so it goes by its
    // own speed), never in a fight, a pose, a nap, a scene or just after a hit.
    const still = 1 - sstep(v / 10);
    const w = m.hp > 0 && !mv && !napping && !m.pose && !m.cine && (a.hurtAgo ?? 9) > 1 ? still : 0;
    if (w > 0.01) {
      const lu = ((a.t ?? 0) + ((m.uid ?? 0) % 7) * 1.1) % 30;
      const go = (pose, k) => {
        if (k > 0.001) for (const [c, val] of Object.entries(pose)) out[c] = (out[c] ?? 0) + (val - (out[c] ?? 0)) * k;
      };
      const say = (f, k) => {
        if (k > 0.4) pb.face = f;
      };
      // 1. the letter up to read: a squint, a tilt... upside down! turned round, "aha"
      const read = win(lu, 0.4, 1.0, 5.6, 6.2) * w;
      a.bgHold = { k: read, at: [r * 1.25, r * 0.5] };
      pb.read = read;
      const squint = win(lu, 1.3, 1.5, 3.2, 3.35) * w;
      go({ head: 14, ant: -0.3 }, win(lu, 1.0, 1.4, 3.3, 3.6) * w);
      out.head += squint * Math.sin((lu - 1.5) * 2.4) * 10;
      pb.flip = lu < 3.6 ? Math.PI * read : Math.PI * (1 - sstep((lu - 3.6) / 0.35)) * read;
      say('read', read);
      say('squint', squint);
      const aha = win(lu, 3.3, 3.4, 3.55, 3.7) * w;
      say('wide', aha);
      go({ ant: 1, hop: 0.03 }, aha);
      const glad = win(lu, 4.0, 4.2, 5.4, 5.8) * w;
      say('happy', glad);
      out.lift += glad * Math.abs(Math.sin(lu * 9)) * 0.8;
      // 2. a tiny map, turned round and round until it's dizzy; a shake, a determined nod
      const mapK = win(lu, 7.2, 7.7, 12.4, 12.9) * w;
      pb.map = mapK;
      pb.letter = 1 - win(lu, 6.9, 7.2, 12.9, 13.2) * w;
      a.bgHold = read > mapK ? a.bgHold : { k: mapK, at: [r * 1.25, r * 0.55] };
      a.bgHoldF = { k: mapK, at: [r * 1.05, r * 0.75] };
      const turning = win(lu, 8.0, 8.3, 10.5, 10.7) * w;
      pb.mapR = (lu < 8 ? 0 : Math.min(lu - 8, 2.6) * 2.6) * mapK;
      out.head += turning * Math.sin((lu - 8) * 2.6) * 12;
      go({ head: 12 }, mapK * 0.6);
      say('read', mapK);
      say('worried', win(lu, 8.6, 8.8, 10.5, 10.6) * w);
      const dizzy = win(lu, 10.6, 10.8, 12.0, 12.2) * w;
      pb.dizzy = dizzy;
      say('dizzy', dizzy);
      out.pitch += dizzy * Math.sin(lu * 5) * 10;
      out.head += dizzy * Math.sin(lu * 5 + 1) * 8;
      go({ ant: -0.6, wings: 0.9 }, dizzy);
      const shake = win(lu, 12.1, 12.2, 12.5, 12.6) * w;
      out.head += shake * Math.sin(lu * 40) * 10;
      const nod = win(lu, 12.6, 12.75, 13.1, 13.3) * w;
      go({ head: 10, ant: 0.8 }, nod);
      say('focus', shake + nod);
      // 3. the letter slips: a gasp, a panicked dive, caught just above the grass, relief, back up
      const drop = lu >= 14.4 && lu < 15.3 ? (lu - 14.4) / 0.9 : -1;
      if (drop >= 0) {
        // (falling away below its foot, fluttering, until the dive brings the foot down to it; eased
        // back into its foot with the act's own weight, so a walk or a fight cutting in never snaps
        // it back up: 2026-11-26)
        const away = Math.sin(Math.PI * drop) * w;
        pb.drop = { dx: Math.sin(drop * 9) * 1.2 * away, dy: away * 7, r: Math.sin(drop * 7) * 0.8 * away };
      }
      const gasp = win(lu, 14.4, 14.5, 14.75, 14.85) * w;
      say('wide', gasp);
      go({ ant: 1, head: 16 }, gasp);
      const dive = win(lu, 14.75, 14.95, 15.35, 15.8) * w;
      go({ hop: -0.42, pitch: 34, head: 14, buzz: 1.6, ant: -0.8, x: 0.03 }, dive);
      say('worried', dive);
      const phew = win(lu, 15.6, 15.8, 16.9, 17.3) * w;
      say('happy', phew);
      pb.sweat = lu >= 15.5 && lu < 16.8 ? (lu - 15.5) / 1.3 : -1;
      // 4. the satchel swung round to count the letters: a feeler nod at each, a happy wag
      const count = win(lu, 20.2, 20.6, 23.4, 23.9) * w;
      if (count > 0.01) swingGoal = lerp(swingGoal, 0.85, count);
      go({ head: 26, pitch: 6 }, count);
      say('read', count);
      const beat = (t0) => win(lu, t0, t0 + 0.15, t0 + 0.4, t0 + 0.6);
      pb.peek = [beat(21.0) * w, beat(21.8) * w];
      out.ant += (beat(21.0) + beat(21.8) + beat(22.6)) * 0.7 * w;
      const wag = win(lu, 23.4, 23.6, 24.3, 24.6) * w;
      go({ sway: 1, head: -6, ant: 0.7 }, wag);
      say('happy', wag);
      // 5. a breath on the cap badge, a polish with a feeler till it gleams, chest out, proud
      const polish = win(lu, 25.3, 25.7, 27.1, 27.4) * w;
      go({ head: -10, ant: -1.15 + Math.sin(lu * 16) * 0.3 }, polish);
      pb.oh = win(lu, 25.5, 25.6, 25.9, 26.0) * w;
      say('happy', win(lu, 25.95, 26.05, 27.0, 27.2) * w);
      pb.gleam = win(lu, 27.0, 27.2, 27.7, 28.1) * w;
      const proud = win(lu, 27.5, 27.8, 29.2, 29.7) * w;
      go({ head: -12, pitch: -8, ant: 1.1, lift: 0.6, buzz: 1.2 }, proud);
      say('proud', proud);
    }
    pb.swing = K.chase(F, 'swing', swingGoal, mv === K.moves.satchel ? 420 : 60, mv === K.moves.satchel ? 22 : 6, dt);
    // (the cap tipped down over its eyes as it nods off, and pushed back up as it wakes: eased, never
    // snapped, 2026-11-26)
    pb.capTip = K.chase(F, 'capTip', pb.capTip, 120, 20, dt);
    // (the little map faded away where it was held, turned as it was, when a fight or a walk cuts
    // its act short, not gone in one frame)
    F.mapK = (F.mapK ?? 0) + (pb.map - (F.mapK ?? 0)) * (1 - Math.exp(-dt / 0.07));
    if (pb.map > 0.01) F.mapR = pb.mapR;
    pb.map = F.mapK;
    pb.mapR = F.mapR ?? 0;
  },
  // Its extras: the letter in its foot, the map, dizzy stars, a sweat drop, its nap's z's; in a fight,
  // the paper-plane letter, the satchel's swish and burst, the zip's sparkles.
  fx: (ctx, m, a, S, K) => {
    const sk = a.bk;
    const pb = a.pb;
    if (!sk || !pb) return;
    const r = sk.r;
    const hp = (p) => K.plus(sk.hc, K.turn(p, sk.ha));
    ctx.save();
    // the letter in its foot
    const L = m.hp > 0 ? letterAt(a, K) : null;
    if (L) {
      ctx.save();
      ctx.translate(...L.p);
      ctx.rotate(L.r);
      letter(ctx, a, K, 3.6, 2.6);
      ctx.restore();
    }
    // the map, held in both feet in front of its face, turning round and round
    if (pb.map > 0.05) {
      const c = hp([r * 1.35, r * 0.75]);
      ctx.save();
      ctx.globalAlpha *= clamp(pb.map * 1.5, 0, 1);
      ctx.translate(...c);
      ctx.rotate(pb.mapR);
      ctx.scale(lerp(0.4, 1, pb.map), 1);
      map(ctx, a, K);
      ctx.restore();
    }
    // dizzy: little stars circling over its head
    if (pb.dizzy > 0.05) {
      const c = hp([-r * 0.1, -r * 1.45]);
      for (let i = 0; i < 3; i++) {
        const q = (a.t ?? 0) * 4 + (i * TAU) / 3;
        ctx.globalAlpha = pb.dizzy;
        ctx.fillStyle = i === 1 ? '#ffffff' : '#ffd23e';
        sparkle(ctx, c[0] + Math.cos(q) * r * 0.8, c[1] + Math.sin(q) * r * 0.25, 1.0 + 0.25 * Math.sin(q));
      }
    }
    // a sweat drop of relief, sliding down the side of its head
    if (pb.sweat >= 0) {
      const u = pb.sweat;
      const p = hp([-r * 0.55, -r * 0.6 + u * r * 0.5]);
      ctx.globalAlpha = Math.sin(Math.PI * u);
      ctx.beginPath();
      ctx.moveTo(p[0], p[1] - 1.4);
      ctx.quadraticCurveTo(p[0] + 0.9, p[1] - 0.1, p[0], p[1] + 0.5);
      ctx.quadraticCurveTo(p[0] - 0.9, p[1] - 0.1, p[0], p[1] - 1.4);
      ctx.fillStyle = '#a8dcff';
      ctx.fill();
      ctx.strokeStyle = '#6aa8d8';
      ctx.lineWidth = 0.25;
      ctx.stroke();
    }
    // napping: little blue "z"s off the top of its cap
    if (pb.face === 'sleep' && m.hp > 0) {
      const top = hp([r * 0.2, -r * 1.2]);
      for (let i = 0; i < 2; i++) {
        const u = ((a.t ?? 0) * 0.35 + i * 0.5) % 1;
        const s = 1.3 + u * 1.1;
        ctx.globalAlpha = Math.sin(Math.PI * u) * 0.95;
        ctx.save();
        ctx.translate(top[0] + 2 + u * 3.5, top[1] - u * 5.5);
        if (a.flip) ctx.scale(-1, 1);
        ctx.beginPath();
        ctx.moveTo(-s * 0.5, -s * 0.5);
        ctx.lineTo(s * 0.5, -s * 0.5);
        ctx.lineTo(-s * 0.5, s * 0.5);
        ctx.lineTo(s * 0.5, s * 0.5);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.1;
        ctx.stroke();
        ctx.strokeStyle = CAP;
        ctx.lineWidth = 0.5;
        ctx.stroke();
        ctx.restore();
      }
    }
    // the letter dart: a paper plane from its foot, gliding out in a little arc and landing in a
    // puff of sparkles a step ahead of it
    if (pb.plane >= 0) {
      const t = pb.plane;
      const from = sk.legs.l0n.P;
      const to = [sk.hc[0] + r * 1.1 + K.H * 0.45, sk.hc[1] + r * 0.9];
      if (t < 0.3) {
        const u = t / 0.3;
        const x = lerp(from[0], to[0], u);
        const y = lerp(from[1], to[1], u) - Math.sin(Math.PI * u) * 3;
        ctx.globalAlpha = 1;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-0.25 + u * 0.5);
        plane(ctx, a, K);
        ctx.restore();
      } else {
        const k = (t - 0.3) / 0.42;
        const e = 1 - (1 - k) ** 2;
        ctx.globalAlpha = 1 - k;
        ctx.save();
        ctx.translate(to[0], to[1]);
        ctx.rotate(0.25);
        plane(ctx, a, K);
        ctx.restore();
        for (let i = 0; i < 5; i++) {
          const q = -Math.PI / 2 + (i - 2) * 0.7;
          ctx.fillStyle = ['#ffd23e', '#ffffff', '#ff9cb8', '#ffffff', '#ffd23e'][i];
          sparkle(ctx, to[0] + Math.cos(q) * (1.5 + e * 4.5), to[1] + Math.sin(q) * (1.5 + e * 4), 1.3 * (1 - k * 0.6));
        }
      }
    }
    // the satchel swing: a soft swish behind the bag, sparkles and a letter jumping out on impact
    if (pb.burst >= 0) {
      const k = pb.burst;
      const reach = reachOf(pb.swing) + 0.4;
      const bag = sk.at([BAG[0] + Math.sin(pb.swing) * reach, BAG[1] + Math.cos(pb.swing) * reach]);
      ctx.globalAlpha = (1 - k) * 0.6;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      const c = sk.at(BAG);
      ctx.arc(c[0], c[1], K.sc(3.4), Math.PI * 0.2 - k, Math.PI * 0.2 + 1.2 - k);
      ctx.stroke();
      const e = 1 - (1 - k) ** 2;
      for (let i = 0; i < 4; i++) {
        const q = -Math.PI * 0.2 + i * 0.5;
        ctx.globalAlpha = 1 - k;
        ctx.fillStyle = i % 2 ? '#ffffff' : '#ffd23e';
        sparkle(ctx, bag[0] + Math.cos(q) * (1.5 + e * 5), bag[1] + Math.sin(q) * (1.5 + e * 3) - e * 2, 1.2 * (1 - k * 0.5));
      }
    }
    // the special delivery: little sparkles streaming off behind it
    if (pb.zip > 0.02) {
      const c = sk.pivot;
      for (let i = 0; i < 4; i++) {
        const u = ((a.t ?? 0) * 3 + i / 4) % 1;
        ctx.globalAlpha = pb.zip * (1 - u);
        ctx.fillStyle = i % 2 ? '#ffffff' : '#ffd23e';
        sparkle(ctx, c[0] - K.sc(9) - u * 7, c[1] - 3 + i * 2, 1.0);
      }
    }
    ctx.restore();
  },
};

export const PUFFBEE = dressedBee(POST);
PUFFBEE.art.noHop = true;
