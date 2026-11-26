// The Bud Snail (2026-11-25, remade on the shell crawler base, the player's pick "A" of three, the
// Cinnamon Swirl): Petal Meadow's level 2 snail, its shell a fresh cinnamon roll: golden dough rolled
// round a cinnamon swirl, white icing poured over the top and dripping down, a strawberry stood on the
// very top. A vanilla-cream body, two short stalks splayed in a soft V with round knobs, big round
// chocolate eyes with caramel lights (tapered lids, a warm pink lower lid), a little ":3" mouth. It
// moves on its own copy of the shell crawler base (snailbase.js: its bones, glide, springs and
// moves), dressed here; it is very proud of its bun.
//   idle    a 30 s act (see its pose below):
//           - it lifts its head back toward the bun and sniffs... a happy "mmm", a wiggle, a heart;
//           - a big yawn and a stretch; a dollop of icing flicks off the bun onto its nose: it goes
//             cross-eyed at it, licks it off, smacks its lips;
//           - a shimmy (an itch under the shell): the strawberry wobbles loose and tumbles off; a
//             shocked jump, a stare, then it scoops it up on its nose and flicks it back on top, and
//             holds its chin up, proud;
//           - a puff of cinnamon sugar drifts off the bun: "ah... ah..." a sneeze that bounces the
//             whole bun, a dazed wobble, a shake, a giggle;
//           - shy: it pulls into the bun, peeks out, looks about, and pops back out.
//   moves   (def.moves order) the runaway-bun roll (spin: pulled in and rolling at you, golden crumbs
//           and sugar sparkles where it lands), the bun bonk (the bun swung down over its head, a puff
//           of icing sugar), the icing splat (rears back and flicks a dollop of icing that lands in a
//           soft splash of sparkles).
//   faces   hurt (squeezed shut), focused before a move, wide (shocked), cross-eyed, content, proud,
//           happy, a pre-sneeze squint, asleep (napping tucked into the bun, a little cinnamon "z"),
//           and soft swirl eyes when it's beaten.
// Everything drawn here from scratch (the face too).
import { dressedSnail } from './snailbase.js';

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
const INK = '#a06a4c';
const EYE_INK = '#4a2418';
const ICING = '#fffbf6';
// A rounded leaf pointing up from (0, 0).
function leafPath(ctx, len, w, tip = 0.18) {
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-w * 0.85, -len * 0.18, -w * 0.7, -len * 0.86, -w * tip, -len);
  ctx.quadraticCurveTo(0, -len * 1.04, w * tip, -len);
  ctx.bezierCurveTo(w * 0.7, -len * 0.86, w * 0.85, -len * 0.18, 0, 0);
  ctx.closePath();
}
// A four-point sparkle.
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
  g.addColorStop(0, K.tint(a, '#ff8a8a', al));
  g.addColorStop(1, K.tint(a, '#ff8a8a', 0));
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, ry / rx);
  ctx.translate(-x, -y);
  ctx.fillStyle = g;
  ctx.fillRect(x - rx, y - rx, rx * 2, rx * 2);
  ctx.restore();
};

// ---------- Where things are (the skeleton's upright frame) ----------
const shellPt = (K, sk, p) => K.add(sk.sc, K.turn(p, sk.shA));
const headPt = (K, sk, p) => K.add(sk.hc, K.turn(p, sk.ha));
// the strawberry's seat on top of the bun (shell frame), and the nose (head frame)
const BERRY_SEAT = (K) => [K.SR * 0.12, -K.SR * 0.93];
const NOSE = [4.55, 0.45];

// ---------- Its face (head frame) ----------
const blinkOf = (a) => ((a.t ?? 0) + (a.mo?.uid ?? 0) * 0.41) % 4.6 < 0.13;
// A tapered upper lid: a crescent hugging the eye's top, heavy at its outer corner (`heavy` -1: the
// back, +1: the front), thin toward the other, so the two eyes never read as a pair of glasses.
function taperLid(ctx, a, K, x, y, rx, ry, heavy) {
  const n = 18;
  const t0 = Math.PI * 1.04;
  const t1 = Math.PI * 1.96;
  const outer = [];
  const inner = [];
  for (let i = 0; i <= n; i++) {
    const s = i / n;
    const th = t0 + (t1 - t0) * s;
    const h = heavy < 0 ? 1 - s : s;
    const w = 0.1 + 0.45 * h ** 1.4;
    outer.push([x + Math.cos(th) * (rx * 1.02 + w * 0.5), y + Math.sin(th) * (ry * 0.98 + w * 0.5)]);
    inner.push([x + Math.cos(th) * (rx * 1.02 - w * 0.5), y + Math.sin(th) * (ry * 0.98 - w * 0.5)]);
  }
  ctx.beginPath();
  [...outer, ...inner.reverse()].forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
  ctx.closePath();
  ctx.fillStyle = K.colour(a, EYE_INK);
  ctx.fill();
}
function line(ctx, a, K, w = 0.42, col = EYE_INK) {
  ctx.strokeStyle = K.colour(a, col);
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}
// Big round chocolate eyes: a deep cocoa iris lit to caramel at the bottom, a big pupil, two round
// lights and a warm speck; a tapered lid with one flicked lash (the near eye), a pink lower lid.
// `k`: 1 the near eye, ~0.66 the far one (seen narrower, three-quarter on).
function eye(ctx, a, K, x, y, k, f) {
  const rx = 1.32 * k;
  const ry = 1.62 * (0.92 + 0.08 * k);
  const heavy = k > 0.9 ? -1 : 1;
  if (f === 'hurt') {
    // squeezed shut: a soft sideways chevron
    line(ctx, a, K, 0.42);
    ctx.beginPath();
    ctx.moveTo(x - rx * 0.8 * -heavy, y - ry * 0.5);
    ctx.lineTo(x + rx * 0.5 * -heavy, y);
    ctx.lineTo(x - rx * 0.8 * -heavy, y + ry * 0.5);
    ctx.stroke();
    return;
  }
  if (f === 'dead') {
    // soft swirls
    line(ctx, a, K, 0.32);
    ctx.beginPath();
    for (let i = 0; i <= 26; i++) {
      const s = i / 26;
      const th = s * TAU * 1.7;
      const r = rx * 0.9 * s;
      const p = [x + Math.cos(th) * r, y + Math.sin(th) * r * (ry / rx)];
      if (i) ctx.lineTo(...p);
      else ctx.moveTo(...p);
    }
    ctx.stroke();
    return;
  }
  if (f === 'sleep' || f === 'blink') {
    line(ctx, a, K, 0.42);
    ctx.beginPath();
    ctx.moveTo(x - rx, y + ry * 0.25);
    ctx.quadraticCurveTo(x, y + ry * 0.85, x + rx, y + ry * 0.2);
    ctx.stroke();
    if (k > 0.9) {
      ctx.lineWidth = 0.3;
      ctx.beginPath();
      ctx.moveTo(x - rx * 0.95, y + ry * 0.3);
      ctx.quadraticCurveTo(x - rx * 1.3, y + ry * 0.3, x - rx * 1.45, y + ry * 0.05);
      ctx.stroke();
    }
    return;
  }
  if (f === 'happy') {
    line(ctx, a, K, 0.46);
    ctx.beginPath();
    ctx.moveTo(x - rx, y + ry * 0.25);
    ctx.quadraticCurveTo(x, y - ry * 0.8, x + rx, y + ry * 0.25);
    ctx.stroke();
    return;
  }
  if (f === 'squint') {
    // the build-up to a sneeze: screwed up tight, a wobbly line
    line(ctx, a, K, 0.42);
    ctx.beginPath();
    ctx.moveTo(x - rx, y - ry * 0.05);
    ctx.quadraticCurveTo(x - rx * 0.4, y - ry * 0.35, x, y);
    ctx.quadraticCurveTo(x + rx * 0.4, y + ry * 0.3, x + rx, y - ry * 0.1);
    ctx.stroke();
    return;
  }
  const wide = f === 'wide' ? 1.1 : 1;
  const ex = rx * wide;
  const ey = ry * wide;
  // (where it looks: cross-eyed at its nose, or ahead)
  const lx = f === 'cross' ? (k > 0.9 ? 0.34 : -0.22) * ex : 0;
  const ly = f === 'cross' ? 0.26 * ey : 0;
  ell(ctx, x, y, ex, ey);
  ctx.fillStyle = K.colour(a, '#fffaf2');
  ctx.fill();
  ctx.save();
  ell(ctx, x, y, ex, ey);
  ctx.clip();
  const ix = x + ex * 0.06 + lx;
  const iy = y + ey * 0.06 + ly;
  const ir = f === 'wide' ? 0.78 : 1;
  ell(ctx, ix, iy, ex * 0.88 * ir, ey * 0.9 * ir);
  ctx.fillStyle = K.colour(a, '#4e2414');
  ctx.fill();
  ell(ctx, ix, iy + ey * 0.24 * ir, ex * 0.74 * ir, ey * 0.6 * ir);
  ctx.fillStyle = K.colour(a, '#9a5228');
  ctx.fill();
  ell(ctx, ix, iy + ey * 0.5 * ir, ex * 0.54 * ir, ey * 0.26 * ir);
  ctx.fillStyle = K.colour(a, '#f2b45c');
  ctx.fill();
  const pr = f === 'wide' ? 0.26 : f === 'focus' ? 0.36 : 0.44;
  ell(ctx, ix + ex * 0.04, iy - ey * 0.04, ex * pr, ey * (pr - 0.02));
  ctx.fillStyle = K.colour(a, '#24100a');
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ell(ctx, ix - ex * 0.36, iy - ey * 0.4, ex * 0.36, ey * 0.3);
  ctx.fill();
  ell(ctx, ix + ex * 0.36, iy + ey * 0.34, ex * 0.16, ey * 0.13);
  ctx.fill();
  ctx.fillStyle = K.colour(a, '#ffe0a8');
  ell(ctx, ix + ex * 0.3, iy - ey * 0.36, ex * 0.11, ey * 0.09);
  ctx.fill();
  // the lid down over it: focused (flat, slanting down to the front), content or proud (half shut)
  // (lidAt: [the lid's middle, its ends], in eye heights; a relaxed lid sags a little in the middle)
  const lidAt = f === 'content' || f === 'proud' ? [0.62, -0.28] : null;
  if (lidAt) {
    ctx.beginPath();
    ctx.moveTo(x - ex * 1.3, y - ey * 1.4);
    ctx.lineTo(x + ex * 1.3, y - ey * 1.4);
    ctx.lineTo(x + ex * 1.3, y + ey * lidAt[1] * (f === 'focus' ? -heavy : 1));
    ctx.quadraticCurveTo(x, y + ey * (lidAt[0] - 0.25), x - ex * 1.3, y + ey * lidAt[1] * (f === 'focus' ? heavy : 1));
    ctx.closePath();
    ctx.fillStyle = K.colour(a, K.C.base);
    ctx.fill();
  }
  ctx.restore();
  if (lidAt) {
    line(ctx, a, K, f === 'focus' ? 0.5 : 0.4);
    ctx.beginPath();
    ctx.moveTo(x - ex * 1.05, y + ey * lidAt[1] * (f === 'focus' ? heavy : 1));
    ctx.quadraticCurveTo(x, y + ey * (lidAt[0] - 0.25), x + ex * 1.05, y + ey * lidAt[1] * (f === 'focus' ? -heavy : 1));
    ctx.stroke();
  } else taperLid(ctx, a, K, x, y + ey * 0.04, ex, ey, heavy);
  if (k > 0.9) {
    // one flicked lash at the back corner
    const ly2 = lidAt ? ey * 0.55 : 0;
    line(ctx, a, K, 0.34);
    ctx.beginPath();
    ctx.moveTo(x - ex * 0.94, y - ey * 0.4 + ly2);
    ctx.quadraticCurveTo(x - ex * 1.32, y - ey * 0.56 + ly2, x - ex * 1.46, y - ey * 0.86 + ly2);
    ctx.stroke();
  }
  // a warm pink lower lid
  line(ctx, a, K, 0.28, '#e8988a');
  ctx.beginPath();
  ctx.arc(x, y + ey * 0.02, ex * 0.98, Math.PI * 0.2, Math.PI * 0.8);
  ctx.stroke();
}
// The mouth: a little ":3"; open (a bite, a yawn, a gasp) with a pink tongue; a tongue tip out for a
// happy "mlem"; the tongue reaching right up to its nose to lick the icing off; a soft pout asleep.
function mouth(ctx, a, K, sk, f) {
  const cn = a.cn ?? {};
  const mx = 3.0;
  const my = 1.7;
  line(ctx, a, K, 0.34, '#7a3a2a');
  const open = Math.max(sk.jaw, f === 'wide' ? 0.55 : 0, cn.gasp ?? 0);
  if (cn.lick > 0.05) {
    // the tongue curling up from the mouth to the nose
    const u = cn.lick;
    ctx.beginPath();
    ctx.moveTo(mx - 0.7, my);
    ctx.quadraticCurveTo(mx, my + 0.5, mx + 0.7, my - 0.05);
    ctx.stroke();
    const tip = [lerp(mx + 0.3, NOSE[0] + 0.1, u), lerp(my + 0.3, NOSE[1] + 0.35, u)];
    ctx.beginPath();
    ctx.moveTo(mx - 0.1, my + 0.15);
    ctx.quadraticCurveTo(tip[0] + 0.5, lerp(my + 0.6, my + 0.4, u), tip[0], tip[1]);
    ctx.lineWidth = 0.75;
    ctx.strokeStyle = K.colour(a, '#ff8f96');
    ctx.stroke();
    ell(ctx, tip[0], tip[1], 0.42, 0.36);
    ctx.fillStyle = K.colour(a, '#ff8f96');
    ctx.fill();
    return;
  }
  if (f === 'dead') {
    ctx.beginPath();
    ctx.moveTo(mx - 0.7, my + 0.1);
    ctx.quadraticCurveTo(mx, my - 0.15, mx + 0.7, my + 0.1);
    ctx.stroke();
    ell(ctx, mx + 0.35, my + 0.4, 0.3, 0.34);
    ctx.fillStyle = K.colour(a, '#ff8f96');
    ctx.fill();
    return;
  }
  if (f === 'sleep') {
    ell(ctx, mx + 0.1, my + 0.05, 0.32, 0.24);
    ctx.fillStyle = K.colour(a, '#a04a3e');
    ctx.fill();
    return;
  }
  if (open > 0.15) {
    const o = open;
    ctx.beginPath();
    ctx.moveTo(mx - 0.75, my - 0.05);
    ctx.quadraticCurveTo(mx, my + 0.25, mx + 0.75, my - 0.05);
    ctx.quadraticCurveTo(mx + 0.55, my + 0.4 + o * 1.1, mx, my + 0.45 + o * 1.1);
    ctx.quadraticCurveTo(mx - 0.55, my + 0.4 + o * 1.1, mx - 0.75, my - 0.05);
    ctx.fillStyle = K.colour(a, '#8a3a34');
    ctx.fill();
    ctx.stroke();
    ell(ctx, mx + 0.05, my + 0.3 + o * 0.85, 0.42, 0.24);
    ctx.fillStyle = K.colour(a, '#ff8f96');
    ctx.fill();
    return;
  }
  // ":3" (a touch wider when proud or happy)
  const w = f === 'proud' || f === 'happy' ? 0.9 : 0.8;
  ctx.beginPath();
  ctx.moveTo(mx - w, my - 0.1);
  ctx.quadraticCurveTo(mx - w * 0.52, my + 0.45, mx, my);
  ctx.quadraticCurveTo(mx + w * 0.52, my + 0.45, mx + w, my - 0.1);
  ctx.stroke();
  if ((cn.mlem ?? 0) > 0.3) {
    ell(ctx, mx + 0.38, my + 0.36, 0.3, 0.32 * cn.mlem);
    ctx.fillStyle = K.colour(a, '#ff8f96');
    ctx.fill();
  }
}
function face(ctx, a, sk, K) {
  const f = a.cn?.face ?? (blinkOf(a) ? 'blink' : 'open');
  const glow = f === 'happy' || f === 'proud' || f === 'content' ? 0.72 : 0.55;
  blush(ctx, a, K, 0.5, 2.0, 1.4, 0.7, glow);
  blush(ctx, a, K, 4.0, 1.9, 0.8, 0.5, glow * 0.8);
  eye(ctx, a, K, 3.55, -0.45, 0.66, f);
  eye(ctx, a, K, 1.05, -0.3, 1, f);
  if (f === 'focus') {
    // determined little brows, slanting down toward the middle
    line(ctx, a, K, 0.5);
    ctx.beginPath();
    ctx.moveTo(0.05, -2.45);
    ctx.quadraticCurveTo(0.9, -2.45, 1.95, -1.95);
    ctx.moveTo(3.05, -2.0);
    ctx.quadraticCurveTo(3.55, -2.4, 4.1, -2.45);
    ctx.stroke();
  }
  mouth(ctx, a, K, sk, f);
  // the dollop of icing on its nose (a soft cream blob, a light on it), shrinking as it's licked
  const nd = a.cn?.nose ?? 0;
  if (nd > 0.05) {
    const r = 0.95 * nd;
    ctx.beginPath();
    ctx.moveTo(NOSE[0] - r * 1.1, NOSE[1] + r * 0.3);
    ctx.quadraticCurveTo(NOSE[0] - r * 1.0, NOSE[1] - r * 1.0, NOSE[0] + r * 0.1, NOSE[1] - r * 1.1);
    ctx.quadraticCurveTo(NOSE[0] + r * 1.2, NOSE[1] - r * 0.8, NOSE[0] + r * 1.05, NOSE[1] + r * 0.35);
    ctx.quadraticCurveTo(NOSE[0], NOSE[1] + r * 0.9, NOSE[0] - r * 1.1, NOSE[1] + r * 0.3);
    ctx.fillStyle = K.colour(a, ICING);
    ctx.fill();
    line(ctx, a, K, 0.22, '#dcc6b8');
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ell(ctx, NOSE[0] - r * 0.35, NOSE[1] - r * 0.45, r * 0.32, r * 0.2, -0.4);
    ctx.fill();
  }
}

// ---------- The bun ----------
// The cinnamon swirl and the icing, painted on the shell (shell frame, clipped to it).
function bunPaint(ctx, a, K) {
  const R = K.SR;
  const sk = a.bk;
  const W = (v) => K.turn(v, -(sk.shA + sk.rollA));
  // the swirl: a broad warm band, a darker crease in it, a pale line of dough beside it
  const turns = 2.2;
  const th0 = 0.62 - turns * TAU;
  const spiral = (dr) => {
    ctx.beginPath();
    for (let i = 0; i <= 80; i++) {
      const s = i / 80;
      const th = th0 + turns * TAU * s;
      const r = R * (0.06 + 0.76 * s ** 1.1) + dr;
      if (i) ctx.lineTo(Math.cos(th) * r, Math.sin(th) * r);
      else ctx.moveTo(Math.cos(th) * r, Math.sin(th) * r);
    }
  };
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  spiral(0);
  ctx.strokeStyle = K.tint(a, '#b8642e', 0.85);
  ctx.lineWidth = 1.55;
  ctx.stroke();
  spiral(-0.25);
  ctx.strokeStyle = K.tint(a, '#8c4422', 0.7);
  ctx.lineWidth = 0.5;
  ctx.stroke();
  spiral(1.05);
  ctx.strokeStyle = K.tint(a, '#ffe7b4', 0.75);
  ctx.lineWidth = 0.45;
  ctx.stroke();
  // the icing: one poured shape, its edge dipping into four rounded drips (softly filleted)
  const drips = [[6.4, 3.4, 2.2], [2.3, 2.0, 1.9], [-2.5, 4.4, 2.3], [-6.6, 2.3, 1.9]];
  const icing = (dy) => {
    ctx.beginPath();
    ctx.moveTo(-R - 2, -R - 2);
    ctx.lineTo(R + 2, -R - 2);
    const edge = (x) => {
      let y = -R * 0.3 + Math.sin(x * 0.7 + 0.4) * 0.5 + (x / R) * 1.4 + dy;
      for (const [xi, len, w] of drips) {
        const u = Math.abs(x - xi) / (w / 2);
        if (u < 1) y += len * (1 - u ** 2.6) ** (1 / 2.6);
        if (u >= 0.9 && u < 1.5) y += 0.35 * Math.sin((Math.PI * (u - 0.9)) / 0.6) ** 2;
      }
      return y;
    };
    for (let x = R + 2; x >= -R - 2; x -= 0.08) ctx.lineTo(x, edge(x));
    ctx.closePath();
  };
  icing(0.45);
  ctx.fillStyle = K.colour(a, '#ecdcd2');
  ctx.fill();
  icing(0);
  ctx.fillStyle = K.colour(a, ICING);
  ctx.fill();
  // a glossy light on the icing, high on the left whichever way it's turned
  ctx.save();
  icing(0);
  ctx.clip();
  K.soft(ctx, a, W([-R * 0.4, -R * 0.62]), R * 0.5, 0.9, '#ffffff');
  K.soft(ctx, a, W([R * 0.3, -R * 0.1]), R * 0.55, 0.3, '#e2cfc4');
  ctx.restore();
}
// The strawberry: stood up, its green cap pressed under it (its own frame: the cap at 0, 0, the tip
// up at 0, -3.3).
function strawberry(ctx, a, K, mode) {
  for (const [an, len] of [[-1.25, 1.7], [1.25, 1.7], [-0.55, 1.2], [0.55, 1.2]]) {
    ctx.save();
    ctx.translate(0, 0.15);
    ctx.rotate(an);
    leafPath(ctx, len, 0.95, 0.12);
    fillOr(ctx, a, K, mode, '#74c25c');
    ctx.restore();
  }
  ctx.beginPath();
  ctx.moveTo(0, -3.3);
  ctx.bezierCurveTo(1.1, -3.1, 2.2, -1.6, 2, -0.3);
  ctx.quadraticCurveTo(1.6, 0.5, 0, 0.45);
  ctx.quadraticCurveTo(-1.6, 0.5, -2, -0.3);
  ctx.bezierCurveTo(-2.2, -1.6, -1.1, -3.1, 0, -3.3);
  ctx.closePath();
  fillOr(ctx, a, K, mode, '#ff5c72');
  if (mode !== 'fill') return;
  ctx.save();
  ctx.clip();
  K.soft(ctx, a, [-0.8, -1.9], 1.6, 0.75, '#ffb0b8');
  K.soft(ctx, a, [1.2, -0.2], 1.6, 0.5, '#d83a58');
  ctx.fillStyle = K.tint(a, '#fff0b8', 0.9);
  for (const [sx, sy] of [[-0.9, -1.1], [0.5, -1.9], [1.0, -0.6], [-0.2, -0.3]]) {
    ell(ctx, sx, sy, 0.17, 0.26, 0.3);
    ctx.fill();
  }
  ctx.fillStyle = '#ffffff';
  ell(ctx, -0.95, -2.2, 0.32, 0.5, 0.5);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = K.colour(a, '#5aa246');
  ctx.lineWidth = 0.34;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0.3);
  ctx.quadraticCurveTo(0.2, 0.9, 0.7, 1.05);
  ctx.stroke();
}
// Where the strawberry is (upright frame) and how it's turned, through the act's tumble: on its seat
// (wobbling loose first), tumbling off onto the ground in front of it, scooped up on its nose and
// flicked back on top. Null: on its seat, drawn with the bun.
function berryAt(a, K, sk) {
  const b = a.cn?.berry ?? -1;
  if (b < 0) return null;
  const seat = shellPt(K, sk, BERRY_SEAT(K));
  const seatR = sk.shA + 0.12;
  const ground = [sk.front[0] + 3.6, -0.25];
  const nose = headPt(K, sk, [4.2, 1.6]);
  const arc = (p, q, u, h) => [lerp(p[0], q[0], u), lerp(p[1], q[1], u) - Math.sin(Math.PI * u) * h];
  // (b: seconds into the tumble) 0-0.55 off and down, 0.55-0.85 a little bounce, then lying there
  if (b < 0.55) {
    const u = sstep(b / 0.55);
    return { p: arc(seat, ground, u, 5), r: lerp(seatR, 1.45 + TAU * 0.75, u) };
  }
  if (b < 0.85) {
    const u = (b - 0.55) / 0.3;
    return { p: [ground[0] + u * 0.6, ground[1] - Math.sin(Math.PI * u) * 1.3], r: 1.45 + TAU * 0.75 + u * 0.4 };
  }
  const lie = [ground[0] + 0.6, ground[1]];
  const lieR = 1.85 + TAU * 0.75;
  if (b < 2.3) return { p: lie, r: lieR };
  // scooped onto its nose (2.3-2.75), carried up (2.75-2.85), flicked back on top (2.85-3.35)
  if (b < 2.75) {
    const u = sstep((b - 2.3) / 0.45);
    return { p: [lerp(lie[0], nose[0], u), lerp(lie[1], nose[1], u)], r: lerp(lieR, TAU + 0.2, u) };
  }
  if (b < 2.85) return { p: nose, r: TAU + 0.2 };
  if (b < 3.35) {
    const u = sstep((b - 2.85) / 0.5);
    return { p: arc(nose, seat, u, 7), r: lerp(TAU + 0.2, seatR, u) };
  }
  return null;
}
// The strawberry as drawn, kept from frame to frame (2026-11-26: it snapped back onto the bun the
// moment its act was cut off by a fight or a walk, and leapt to the middle of its tumble when the act
// came back mid-way): a tumble only starts from the seat, and if the act stops with it off, it hops
// back up onto the seat from wherever it is.
function berryNow(a, K, sk) {
  const B = (a.mo.rig.snBerry ??= { p: null, r: 0, back: -1, wait: false, now: null, out: null });
  if (B.now === a.now) return B.out;
  const dt = B.now === null ? 0 : clamp((a.now ?? 0) - B.now, 0, 0.1);
  B.now = a.now;
  const b = a.cn?.berry ?? -1;
  // (a tumble already under way when the act comes back: it stays put till the next one)
  if (b < 0) B.wait = false;
  else if (!B.p && b > 0.08) B.wait = true;
  const want = b >= 0 && !B.wait ? berryAt(a, K, sk) : null;
  if (want) {
    Object.assign(B, { p: want.p, r: want.r, back: -1 });
    return (B.out = want);
  }
  if (!B.p) return (B.out = null);
  const seat = shellPt(K, sk, BERRY_SEAT(K));
  const seatR = sk.shA + 0.12;
  // (turned the short way round to its seat)
  const goR = seatR + TAU * Math.round((B.r - seatR) / TAU);
  // (its tumble played out to the end: it's sat on its seat already)
  if (B.back < 0 && Math.hypot(B.p[0] - seat[0], B.p[1] - seat[1]) < 0.4 && Math.abs(B.r - goR) < 0.1) {
    B.p = null;
    return (B.out = null);
  }
  // back up onto its seat in a little arc, turning upright as it goes
  if (B.back < 0) Object.assign(B, { back: 0, from: B.p, fromR: B.r, goR, h: Math.min(4, Math.hypot(B.p[0] - seat[0], B.p[1] - seat[1]) * 0.5) });
  B.back += dt;
  const u = sstep(Math.min(1, B.back / 0.5));
  if (u >= 1) {
    B.p = null;
    return (B.out = null);
  }
  B.p = [lerp(B.from[0], seat[0], u), lerp(B.from[1], seat[1], u) - Math.sin(Math.PI * u) * B.h];
  B.r = lerp(B.fromR, B.goR, u);
  return (B.out = { p: B.p, r: B.r });
}

// ---------- Its own move: the icing splat ----------
const SPLAT = {
  anticT: 0.36,
  keys: [
    [0, { lean: -30, nAng: 22, head: -16, stretch: -0.5, crouch: 0.55, x: -0.05, stalkA: 18, jaw: 0.1 }],
    [0.09, { lean: 14, nAng: -4, head: 6, stretch: 0.35, crouch: 0, x: 0.03, hop: 0.04, stalkA: 32, jaw: 0.55 }, 'out'],
    [0.2, { lean: 9, nAng: 0, head: 4, stretch: 0.25, x: 0.03, hop: 0, jaw: 0.35 }, 'io'],
    [0.55, { lean: 2, x: 0.01, jaw: 0 }, 'io'],
    [0.85, {}],
  ],
  dust: [[0.1, 'front']],
};

// ---------- Its dress ----------
const SWIRL = {
  ink: INK,
  C: { lt: '#fffaf0', base: '#fbe6c8', sh: '#efcaa0', deep: '#d6a87a', mouth: '#a04a3e' },
  CS: { lt: '#ffe8b0', base: '#eab26a', sh: '#c98548', deep: '#9a5a2e' },
  spiral: false,
  quietIdle: true,
  // two short stalks splayed in a soft V, thicker at the root, round knobs at the tips (each on its
  // own spring, wandering on its own)
  P: {
    stalks: [
      { id: 'upF', far: true, up: true, root: [-0.5, -3.7], ang: -108, len: 4.4, w: 1.4, root0: 1.35, knob: 1.6 },
      { id: 'upN', far: false, up: true, root: [1.7, -3.8], ang: -56, len: 4.7, w: 1.45, root0: 1.35, knob: 1.6 },
    ],
  },
  moves: { splat: SPLAT },
  face,
  over: {
    shell: (ctx, a, mode, K) => {
      const sk = a.bk;
      ctx.save();
      K.shellFrame(ctx, a);
      if (mode === 'fill') {
        ctx.save();
        ctx.beginPath();
        K.shellPath(ctx);
        ctx.clip();
        bunPaint(ctx, a, K);
        ctx.restore();
      }
      const loose = berryNow(a, K, sk);
      if (!loose) {
        // on its seat (a wobble as it works loose, or as it lands back)
        const [x, y] = BERRY_SEAT(K);
        ctx.translate(x, y);
        ctx.rotate(0.12 + (a.cn?.wobble ?? 0));
        strawberry(ctx, a, K, mode);
      }
      ctx.restore();
      if (loose) {
        K.upright(ctx, a);
        ctx.translate(...loose.p);
        ctx.rotate(loose.r);
        strawberry(ctx, a, K, mode);
      }
    },
  },
  // Its act on the base's channels (x, hop, lift, pitch, crouch, hide, peek, neck, nAng, head, jaw,
  // stalk, stalkA, droop, stretch, lean; the base's moves by poseAt), and its face and props (a.cn).
  pose: (m, a, out, K, mv, mt) => {
    const cn = { face: null, mlem: 0, lick: 0, nose: 0, gasp: 0, berry: -1, wobble: 0, sniff: 0, heart: -1, flick: -1, dust: -1, achoo: -1, z: 0 };
    a.cn = cn;
    const napping = m.habit?.kind === 'nap' && (a.now ?? 0) < (m.habit.until ?? 0);
    const mood = m.cine?.mood ?? a.mood;
    if (m.hp <= 0) cn.face = 'dead';
    else if ((a.hurtAgo ?? 9) < 0.45 || mv === K.moves.hurt) cn.face = 'hurt';
    else if (napping || mood === 'sleep') {
      cn.face = 'sleep';
      cn.z = 1;
    } else if (mv === K.moves.stretch) cn.face = 'happy';
    else if (mv || a.face === 'angry' || mood === 'angry') cn.face = 'focus';
    else if (mood === 'happy') cn.face = 'happy';
    else if (mood === 'sad') cn.face = 'content';
    if (m.hp <= 0 || napping || mv) return;
    // (its act only while it stands about: never while it walks, fights or is posed)
    const calm = clamp((a.calm ?? 1) * (1 - clamp(a.walkW ?? 0, 0, 1)) * (a.moving ? 0 : 1) * (m.pose || m.cine ? 0 : 1), 0, 1);
    if (calm < 0.02) return;
    const lu = ((a.shT ?? a.t ?? 0) % 30 + 30) % 30;
    const go = (pose, w) => {
      if (w > 0.001) for (const [k, v] of Object.entries(pose)) out[k] = (out[k] ?? 0) + (v - (out[k] ?? 0)) * w;
    };
    const say = (f, w) => {
      if (w > 0.4) cn.face = f;
    };
    // 1. a sniff of the bun: head lifted back toward it, quick sniffs, then a happy "mmm" wiggle
    const reach = win(lu, 0.6, 1.4, 4.0, 4.8) * calm;
    const sniff = win(lu, 1.4, 1.5, 2.7, 2.8) * calm;
    const mmm = win(lu, 2.8, 3.0, 4.4, 4.9) * calm;
    go({ neck: 0.35, nAng: 24, head: -24, stalkA: -12, stretch: 0.1 }, reach);
    out.head += sniff * Math.sin(lu * 34) * 2.2 + mmm * 6;
    out.lean += mmm * Math.sin(lu * 9) * 4;
    out.lift += mmm * Math.abs(Math.sin(lu * 9)) * 0.35;
    say('blink', sniff);
    say('happy', mmm);
    cn.mlem = Math.max(cn.mlem, mmm);
    cn.sniff = sniff;
    cn.heart = lu >= 3 && lu < 4.7 ? (lu - 3) / 1.7 : -1;
    // 2. a big yawn and stretch; a dollop of icing flicks off the bun onto its nose: cross-eyed at
    //    it, a lick, lips smacked
    const yawn = win(lu, 6.4, 6.6, 7.8, 8.0) * calm;
    if (yawn > 0.001) go(K.poseAt(K.moves.stretch, clamp(lu - 6.4, 0, 1.52), 1, out), yawn);
    say('blink', yawn * (lu > 6.8 && lu < 7.8 ? 1 : 0));
    const jolt = win(lu, 7.95, 8.05, 8.1, 8.35) * calm;
    go({ lean: 10, hop: 0.02 }, jolt);
    cn.flick = lu >= 8.0 && lu < 8.35 ? (lu - 8.0) / 0.35 : -1;
    const cross = win(lu, 8.3, 8.45, 9.6, 9.8) * calm;
    go({ head: 9, nAng: -4, stalkA: 10, neck: -0.1 }, cross);
    say('cross', cross);
    const lick = win(lu, 9.6, 9.75, 10.5, 10.7) * calm;
    go({ head: -6, nAng: 6, jaw: 0.15 }, lick);
    cn.lick = lick;
    say('happy', lick);
    cn.nose = lu >= 8.3 && lu < 10.6 ? clamp((lu - 8.3) / 0.06, 0, 1) * (1 - sstep((lu - 9.9) / 0.6)) : 0;
    const smack = win(lu, 10.6, 10.8, 11.6, 12.0) * calm;
    out.jaw += smack * Math.max(0, Math.sin(lu * 16)) * 0.25;
    out.lift += smack * Math.abs(Math.sin(lu * 8)) * 0.3;
    say('happy', smack);
    cn.mlem = Math.max(cn.mlem, smack);
    // 3. a shimmy (an itch under the shell): the strawberry works loose and tumbles off; a shocked
    //    jump and a stare; scooped up on its nose and flicked back on top; chin up, proud
    const shimmy = win(lu, 13.2, 13.4, 14.2, 14.45) * calm;
    out.lean += shimmy * Math.sin(lu * 18) * 6;
    out.lift += shimmy * Math.abs(Math.sin(lu * 18)) * 0.4;
    say('happy', shimmy);
    cn.wobble = shimmy * Math.sin(lu * 22) * 0.5 * sstep((lu - 13.4) / 0.9);
    cn.berry = lu >= 14.4 && lu < 17.8 ? lu - 14.4 : -1;
    const shock = win(lu, 14.65, 14.75, 15.6, 15.9) * calm;
    go({ nAng: 12, head: -8, stalkA: -22, stalk: 1, x: -0.035, hop: 0.05 * win(lu, 14.65, 14.75, 14.8, 14.95) }, shock);
    say('wide', shock);
    cn.gasp = shock * 0.6;
    const stare = win(lu, 15.7, 16.0, 16.5, 16.75) * calm;
    go({ nAng: -10, head: 14, stalkA: 4 }, stare);
    say('open', stare);
    const scoop = win(lu, 16.6, 16.9, 17.15, 17.3) * calm;
    go({ neck: 0.45, nAng: -30, head: 22, stretch: 0.2, stalkA: 10 }, scoop);
    say('focus', scoop);
    const toss = win(lu, 17.2, 17.3, 17.45, 17.8) * calm;
    go({ neck: 0.2, nAng: 26, head: -24, stalkA: -20, jaw: 0.3 }, toss);
    say('wide', toss);
    if (lu >= 17.75 && lu < 18.8) cn.wobble = Math.sin((lu - 17.75) * 26) * 0.35 * (1 - (lu - 17.75) / 1.05);
    const proud = win(lu, 17.8, 18.1, 19.6, 20.1) * calm;
    go({ nAng: 16, head: -12, neck: 0.15, stalkA: -10 }, proud);
    out.lean += proud * Math.sin(lu * 6) * 2;
    say('proud', proud);
    // 4. a puff of cinnamon sugar drifts off the bun: "ah... ah..." a sneeze bouncing the whole bun,
    //    a dazed wobble, a shake, a giggle
    cn.dust = lu >= 21.4 && lu < 23.4 ? (lu - 21.4) / 2 : -1;
    const ah = win(lu, 22.3, 22.6, 23.25, 23.3) * calm;
    const ah2 = win(lu, 22.85, 23.0, 23.25, 23.3) * calm;
    go({ nAng: 10, head: -10, jaw: 0.25, stalkA: -6 }, ah);
    go({ nAng: 18, head: -18, jaw: 0.4 }, ah2);
    say('squint', ah);
    const choo = win(lu, 23.3, 23.36, 23.5, 23.8) * calm;
    go({ nAng: -14, head: 18, hop: 0.06, lean: -8, stalkA: 40, jaw: 0.6, x: -0.02 }, choo);
    say('hurt', choo);
    cn.achoo = lu >= 23.32 && lu < 24.1 ? (lu - 23.32) / 0.78 : -1;
    const dazed = win(lu, 23.8, 24.0, 24.6, 24.8) * calm;
    go({ droop: 0.5, head: 6, stalk: 0.85 }, dazed);
    out.nAng += dazed * Math.sin(lu * 5) * 5;
    say('blink', dazed);
    const shake = win(lu, 24.6, 24.7, 25.1, 25.25) * calm;
    out.head += shake * Math.sin(lu * 30) * 7;
    out.stalkA += shake * Math.sin(lu * 30 + 1) * 14;
    const giggle = win(lu, 25.15, 25.3, 25.8, 26.0) * calm;
    out.lift += giggle * Math.abs(Math.sin(lu * 12)) * 0.45;
    say('happy', shake + giggle);
    // 5. shy: in, a peek out, a look round, back in, and out again
    const shy = win(lu, 26.05, 26.15, 29.85, 30) * calm;
    if (shy > 0.001) go(K.poseAt(K.moves.hide, clamp(lu - 26.15, 0, 3.7), 1, out), shy);
    if (shy > 0.4 && lu > 27.7 && lu < 28.4) cn.face = 'wide';
    if (shy > 0.4 && lu >= 29.3) cn.face = 'happy';
  },
  // Its extras: scent wisps and a heart, the flicked dollop, the cinnamon sugar and the sneeze, a
  // nap's little "z"; in a fight, golden crumbs and sugar sparkles, and the icing splat.
  fx: (ctx, m, a, S, K) => {
    const sk = a.bk;
    const cn = a.cn;
    if (!sk || !cn) return;
    const X = sk.X;
    const H = K.H;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const top = X(shellPt(K, sk, [0, -K.SR]));
    // scent wisps rising off the bun as it sniffs
    if (cn.sniff > 0.05) {
      for (let i = 0; i < 2; i++) {
        const u = (a.t * 0.8 + i * 0.5) % 1;
        ctx.globalAlpha = Math.sin(Math.PI * u) * 0.85 * cn.sniff;
        ctx.strokeStyle = '#e8a868';
        ctx.lineWidth = 0.75;
        const x0 = top[0] + 1 + i * 3.5;
        const y0 = top[1] - 2 - u * 4;
        ctx.beginPath();
        ctx.moveTo(x0, y0 + 2);
        ctx.bezierCurveTo(x0 + 1.2, y0 + 1, x0 - 1.2, y0, x0, y0 - 1.4);
        ctx.stroke();
      }
    }
    // the "mmm" heart, rising a little off its head
    if (cn.heart >= 0) {
      const u = cn.heart;
      const p = X(headPt(K, sk, [0.5, -6.2]));
      ctx.globalAlpha = Math.sin(Math.PI * u);
      ctx.fillStyle = '#ff7fa0';
      heart(ctx, p[0] + u * 1.5, p[1] - u * 3, 1.25);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ell(ctx, p[0] + u * 1.5 - 0.5, p[1] - u * 3 - 0.35, 0.3, 0.2);
      ctx.fill();
    }
    // the dollop flicked off the bun's front, onto its nose
    if (cn.flick >= 0) {
      const from = X(shellPt(K, sk, [K.SR * 0.78, -K.SR * 0.35]));
      const to = X(headPt(K, sk, NOSE));
      const u = sstep(cn.flick);
      const x = lerp(from[0], to[0], u);
      const y = lerp(from[1], to[1], u) - Math.sin(Math.PI * u) * 5;
      ctx.globalAlpha = 1;
      ell(ctx, x, y, 0.85, 0.75);
      ctx.fillStyle = ICING;
      ctx.fill();
      ctx.strokeStyle = '#dcc6b8';
      ctx.lineWidth = 0.22;
      ctx.stroke();
    }
    // a puff of cinnamon sugar drifting off the bun toward its nose: soft sparkles
    if (cn.dust >= 0) {
      const nose = X(headPt(K, sk, NOSE));
      for (let i = 0; i < 5; i++) {
        const u = clamp(cn.dust * 1.3 - i * 0.07, 0, 1);
        const x = lerp(top[0] + (i - 2) * 1.2, nose[0] - 0.5, u) + Math.sin(u * 9 + i) * 1.2;
        const y = lerp(top[1] + 1, nose[1] - 1.2, u) - Math.sin(Math.PI * u) * 2.5;
        ctx.globalAlpha = Math.sin(Math.PI * u) * 0.95;
        ctx.fillStyle = i % 2 ? '#d89a5a' : '#ffe2a8';
        sparkle(ctx, x, y, 0.75);
      }
    }
    // the sneeze: a soft white puff burst off its nose, two sparkles
    if (cn.achoo >= 0) {
      const u = cn.achoo;
      const nose = X(headPt(K, sk, NOSE));
      const e = 1 - (1 - u) ** 2;
      for (let i = 0; i < 4; i++) {
        const an = -0.6 + (i / 3) * 1.1;
        const d = 1.5 + e * 5.5;
        ctx.globalAlpha = (1 - u) * 0.85;
        ctx.fillStyle = '#ffffff';
        ell(ctx, nose[0] + Math.cos(an) * d, nose[1] + Math.sin(an) * d, 0.8 + e * 1.1, 0.7 + e * 0.9);
        ctx.fill();
      }
      ctx.fillStyle = '#ffe2a8';
      sparkle(ctx, nose[0] + 3 + e * 4, nose[1] - 2 - e * 2, 1.1 * (1 - u));
      sparkle(ctx, nose[0] + 2 + e * 3, nose[1] + 2 + e, 0.8 * (1 - u));
    }
    // napping: a little cinnamon "z" drifting up off the bun
    if (cn.z > 0 && m.hp > 0) {
      for (let i = 0; i < 2; i++) {
        const u = (a.t * 0.35 + i * 0.5) % 1;
        const s = 1.4 + u * 1.2;
        const x = top[0] + 3 + u * 4 + i * 0.5;
        const y = top[1] - 1 - u * 6;
        ctx.globalAlpha = Math.sin(Math.PI * u) * 0.95;
        ctx.save();
        ctx.translate(x, y);
        if (a.flip) ctx.scale(-1, 1);
        ctx.beginPath();
        ctx.moveTo(-s * 0.5, -s * 0.5);
        ctx.lineTo(s * 0.5, -s * 0.5);
        ctx.lineTo(-s * 0.5, s * 0.5);
        ctx.lineTo(s * 0.5, s * 0.5);
        ctx.strokeStyle = '#fffaf0';
        ctx.lineWidth = 1.1;
        ctx.stroke();
        ctx.strokeStyle = '#c07a48';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        ctx.restore();
      }
    }
    // ---- in a fight ----
    const mv = a.shMove?.mv;
    const t = a.shMove?.t ?? 0;
    const crumbs = (cx, cy, k, n = 5) => {
      if (k < 0 || k > 1) return;
      const e = 1 - (1 - k) ** 2;
      for (let i = 0; i < n; i++) {
        const an = -Math.PI / 2 + (i - (n - 1) / 2) * 0.55;
        const d = 2 + e * 7;
        const x = cx + Math.cos(an) * d;
        const y = cy + Math.sin(an) * d + e * e * 5;
        ctx.globalAlpha = 1 - k;
        ctx.fillStyle = '#e8b06a';
        ctx.strokeStyle = '#b87a48';
        ctx.lineWidth = 0.25;
        ell(ctx, x, y, 0.75, 0.6, i);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        sparkle(ctx, cx + Math.cos(an + 0.3) * d * 0.8, cy + Math.sin(an + 0.3) * d * 0.8, 0.9 * (1 - k));
      }
    };
    if (mv === K.moves.spin) {
      // sugar sparkles trailing the rolling bun, crumbs where it lands
      const c = X(sk.sc);
      if (t > 0.08 && t < 0.62) {
        for (let i = 0; i < 4; i++) {
          const u = ((t * 3 + i / 4) % 1);
          ctx.globalAlpha = (1 - u) * 0.9;
          ctx.fillStyle = i % 2 ? '#ffffff' : '#ffe2a8';
          sparkle(ctx, c[0] - K.SR - 1 - u * 6, c[1] - 3 + i * 2 - u * 2, 0.9 * (1 - u * 0.5));
        }
      }
      // (at the bun's front as it lands, whichever way it has rolled)
      crumbs(c[0] + K.SR, c[1] + 2, (t - 0.58) / 0.45);
    } else if (mv === K.moves.bonk) {
      // a puff of icing sugar and crumbs off the bun's front as it lands
      const f = X(shellPt(K, sk, [K.SR * 0.9, -K.SR * 0.2]));
      const k = (t - 0.11) / 0.45;
      if (k >= 0 && k <= 1) {
        const e = 1 - (1 - k) ** 2;
        for (let i = 0; i < 3; i++) {
          ctx.globalAlpha = (1 - k) * 0.8;
          ctx.fillStyle = '#ffffff';
          ell(ctx, f[0] + 1 + e * (2 + i * 2), f[1] - 1 - e * (1 + i) + i * 1.5, 1 + e * 1.2, 0.9 + e);
          ctx.fill();
        }
      }
      crumbs(f[0], f[1], k, 4);
    } else if (mv === SPLAT) {
      // a dollop of icing flung off the bun in an arc, landing in a soft splash of sparkles
      const from = X(shellPt(K, sk, [K.SR * 0.7, -K.SR * 0.7]));
      const land = [from[0] + H * 1.15, 0];
      if (t >= 0.08 && t < 0.42) {
        const u = (t - 0.08) / 0.34;
        const x = lerp(from[0], land[0], u);
        const y = lerp(from[1], land[1] - 0.8, u * u) - Math.sin(Math.PI * u) * H * 0.35;
        ctx.globalAlpha = 1;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.sin(u * 9) * 0.35 + u * 1.2);
        // a dollop: a round cream blob with a soft curl of a peak
        ctx.beginPath();
        ctx.moveTo(-1.9, 0.6);
        ctx.bezierCurveTo(-2.2, -1.0, -0.9, -1.6, -0.2, -1.5);
        ctx.quadraticCurveTo(0.3, -2.6, 1.2, -2.3);
        ctx.quadraticCurveTo(0.6, -1.9, 0.8, -1.3);
        ctx.bezierCurveTo(1.9, -1.0, 2.2, 0.2, 1.8, 0.8);
        ctx.quadraticCurveTo(0, 1.7, -1.9, 0.6);
        ctx.closePath();
        ctx.fillStyle = ICING;
        ctx.fill();
        ctx.strokeStyle = '#d8c0b0';
        ctx.lineWidth = 0.35;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ell(ctx, -0.8, -0.6, 0.6, 0.35, -0.4);
        ctx.fill();
        ctx.restore();
        // sugar sparkles trailing it
        ctx.fillStyle = '#ffe2a8';
        sparkle(ctx, x - 2.5 - u, y + 0.5, 0.8 * (1 - u * 0.5));
      }
      const k = (t - 0.42) / 0.5;
      if (k >= 0 && k <= 1) {
        const e = 1 - (1 - k) ** 3;
        ctx.globalAlpha = 1 - k * k;
        // the splash: a soft cream puddle-star of round lobes, flat on the ground
        ctx.beginPath();
        const n = 28;
        for (let i = 0; i <= n; i++) {
          const q = (i / n) * Math.PI;
          const r = (2 + e * 3.4) * (1 + 0.2 * Math.cos(q * 6));
          const p = [land[0] + Math.cos(q + Math.PI) * r, -0.3 - Math.sin(q) * r * 0.55];
          if (i) ctx.lineTo(...p);
          else ctx.moveTo(...p);
        }
        ctx.closePath();
        ctx.fillStyle = ICING;
        ctx.fill();
        ctx.strokeStyle = '#dcc6b8';
        ctx.lineWidth = 0.3;
        ctx.stroke();
        for (let i = 0; i < 5; i++) {
          const an = -Math.PI / 2 + (i - 2) * 0.55;
          ctx.fillStyle = ['#ffc860', '#ffa0c0', '#ffe8a8', '#ffa0c0', '#ffc860'][i];
          sparkle(ctx, land[0] + Math.cos(an) * (2.5 + e * 6), -1 - Math.abs(Math.sin(an)) * (2.5 + e * 5), (i % 2 ? 1.1 : 1.6) * (1 - k * 0.8));
        }
      }
    }
    ctx.restore();
  },
};

export const BUDSNAIL = dressedSnail(SWIRL);
BUDSNAIL.art.noHop = true;
