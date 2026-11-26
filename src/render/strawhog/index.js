// The Strawhog (2026-11-25, remade on the bunny base, the player's pick "C" of three, the Scarebun):
// Clover Hills' level 5 farm-field critter, a cream bunny dressed up as a scarecrow, who takes the
// job very seriously and is very bad at it. A floppy straw hat with a red band and a stitched blue
// patch (its ears poke up through it), patched blue dungarees with a checked patch on the haunch,
// a strap and a gold button, straw sticking out at the bib; freckles; cheeky clover-green almond
// eyes under a heavy top lid. It moves on its own copy of the bunny base (bunnybase.js: its bones,
// hop, springs and moves), dressed here.
//   idle    a 30 s act (see its pose below):
//           - playing scarecrow: up on its haunches, arms flung out wide, frozen stiff with a blank
//             button stare; a little slate-blue crow's feather drifts down onto its hat brim; its
//             eyes roll up to look at it, not a whisker moving... then BOO! a leap, ears flung out,
//             mouth wide, straw and sparkles bursting, the feather flung away; it giggles itself
//             silly, paws over its mouth;
//           - the straw itches: a wriggle, a squint, then sat up scratching behind its ear with a
//             hind foot, frantic, a blissful face, bits of straw falling; a shake-out and a sigh;
//           - a long straw springs out of its bib: startled, it stuffs it back in, tongue out, the
//             straw going in a bit at a time; a proud pat;
//           - a straw tickles its nose: "ah... ah..." and a big CHOO that pops the hat up off its
//             head; it lands back askew over one eye; a dazed blink and a sniffle;
//           - it reaches up and sets the hat straight with little tugs, then strikes a proud pose,
//             chest out, chin up, a twinkle off the brim.
//   moves   (def.moves order) the Boo (a sneaky crouch, ears back, then a leap up, arms out wide,
//           mouth wide: a burst of straw and star sparkles close in front of it), the hat
//           boomerang (it grabs the brim, winds back and flings the hat spinning out ahead in a
//           short loop, a sparkle trail, catches it and plunks it back on), the thump (the base's
//           double stamp, straw bursting from its heels).
//   faces   hurt (squeezed shut), focused before a move (cheeky low lids), startled (wide, small
//           pupils), the blank scarecrow stare (and its eyes rolled up at the feather), a giggle,
//           an itchy squint, a blissful scratch, a smug pose, sad, happy, asleep (napping in a loaf,
//           the hat tipped down over its eyes, a little straw-gold "z"), and soft swirl eyes when
//           it's beaten (its hat knocked askew).
// Everything drawn here from scratch (the face too).
import { dressedBunny } from './bunnybase.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mix = (a, b, u) => a + (b - a) * u;
const sstep = (u) => {
  const v = clamp(u, 0, 1);
  return v * v * (3 - 2 * v);
};
// (a beat's weight: 0 before t0, eased up to 1 by t1, held to t2, eased back to 0 by t3)
const win = (t, t0, t1, t2, t3) => sstep((t - t0) / (t1 - t0)) * (1 - sstep((t - t2) / (t3 - t2)));
// (a quick soft pulse 0..1..0 over [t0, t0 + d])
const pulse = (t, t0, d) => {
  const u = (t - t0) / d;
  return u > 0 && u < 1 ? Math.sin(Math.PI * u) : 0;
};
// (0..1 through [t0, t0 + d], else -1)
const span = (t, t0, d) => (t >= t0 && t < t0 + d ? (t - t0) / d : -1);
const rot = ([x, y], r) => [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)];
const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
const ell = (ctx, x, y, rx, ry, r = 0) => {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), r, 0, TAU);
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
const fillOr = (ctx, a, K, mode, c) => {
  if (mode === 'line') K.edge(ctx);
  else {
    ctx.fillStyle = K.colour(a, c);
    ctx.fill();
  }
};

const INK = '#9a7a5a';
const EYE_INK = '#4a3a2a';
const SB = {
  hat: '#f4d27a', hatLt: '#fff2b8', hatSh: '#d8a948', band: '#e05a5a',
  denim: '#7da6d6', denimSh: '#5e86bc', denimLt: '#a8c8ec', patch: '#f0a050', straw: '#f2cc68', stitch: '#fff4dc',
  feather: '#8a8fc4', featherLt: '#c4c8ee', featherInk: '#5e6190', zed: '#e8b84a',
};
const FUR = { lt: '#fffaf0', base: '#f3e8d4', sh: '#dcc8aa', deep: '#c0a684' };

// ---------- Its eyes (the head's frame, game px) ----------
// Each face: [lid (how low the heavy top lid comes, 0..1), pupil size, look up (0..1)].
const EYES = {
  open: [0.22, 0.36, 0],
  focus: [0.42, 0.34, 0],
  wide: [0, 0.24, 0],
  blank: [0, 0.2, 0],
  peek: [0.08, 0.2, 0.42],
  boo: [0, 0.26, 0],
  smug: [0.46, 0.36, -0.05],
  sad: [0.3, 0.42, 0.1],
};
// A closed eye: a soft lash curve (asleep, blinking), a happy arc, a giggle's squeezed arc, a
// blissful droop with a lash, an itchy squint, squeezed tight when hurt.
function shut(ctx, a, K, x, y, rx, ry, kind) {
  ctx.strokeStyle = K.colour(a, EYE_INK);
  ctx.lineWidth = Math.max(0.42, rx * 0.26);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  if (kind === 'happy' || kind === 'giggle') {
    const k = kind === 'giggle' ? 1.1 : 0.85;
    ctx.moveTo(x - rx * 0.95, y + ry * 0.2);
    ctx.quadraticCurveTo(x, y - ry * k, x + rx * 0.95, y + ry * 0.2);
  } else if (kind === 'bliss') {
    ctx.moveTo(x - rx * 0.95, y - ry * 0.05);
    ctx.quadraticCurveTo(x, y + ry * 0.5, x + rx * 0.95, y + ry * 0.05);
    ctx.stroke();
    ctx.lineWidth = Math.max(0.35, rx * 0.18);
    ctx.beginPath();
    ctx.moveTo(x - rx * 0.92, y - ry * 0.02);
    ctx.quadraticCurveTo(x - rx * 1.3, y - ry * 0.05, x - rx * 1.5, y + ry * 0.2);
  } else if (kind === 'squint' || kind === 'hurt') {
    ctx.moveTo(x - rx * 0.85, y - ry * 0.42);
    ctx.quadraticCurveTo(x + rx * 0.1, y - ry * 0.12, x + rx * 0.65, y);
    ctx.quadraticCurveTo(x + rx * 0.1, y + ry * 0.12, x - rx * 0.85, y + ry * 0.42);
  } else {
    ctx.moveTo(x - rx * 0.95, y);
    ctx.quadraticCurveTo(x, y + ry * 0.55, x + rx * 0.95, y - ry * 0.05);
    ctx.stroke();
    ctx.lineWidth = Math.max(0.35, rx * 0.18);
    ctx.beginPath();
    ctx.moveTo(x - rx * 0.9, y + ry * 0.02);
    ctx.quadraticCurveTo(x - rx * 1.3, y + ry * 0.02, x - rx * 1.45, y + ry * 0.25);
  }
  ctx.stroke();
}
// Beaten: a soft swirl.
function swirl(ctx, a, K, x, y, r) {
  ctx.strokeStyle = K.colour(a, EYE_INK);
  ctx.lineWidth = Math.max(0.38, r * 0.2);
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i <= 30; i++) {
    const q = (i / 30) * TAU * 1.6;
    const rr = r * (0.15 + 0.85 * (i / 30));
    const p = [x + Math.cos(q) * rr, y + Math.sin(q) * rr * 1.15];
    if (i) ctx.lineTo(...p);
    else ctx.moveTo(...p);
  }
  ctx.stroke();
}
// The near eye, clover-green almond: taller than wide; a heavy top lid slanting down to the front
// (a cheeky look), drawn in fur over the eye so it really hides the top; a green iris from deep
// clover to spring green with a ring of pale flecks; a pupil that shrinks when it's startled or
// playing scarecrow; a sharp glint and a small one; the lid's line, one thick lash flicking back,
// a soft lower lid.
function eye(ctx, a, K, x, y, f) {
  const rx = K.sc(2.25);
  const ry = K.sc(3.0);
  if (f === 'dead') return swirl(ctx, a, K, x, y, rx * 1.05);
  if (['hurt', 'squint', 'sleep', 'blink', 'happy', 'giggle', 'bliss'].includes(f)) return shut(ctx, a, K, x, y, rx, ry * 0.8, f);
  const cl = (c) => K.colour(a, c);
  const [lid, pr, up] = EYES[f] ?? EYES.open;
  const shape = () => {
    ctx.beginPath();
    ctx.moveTo(x, y - ry);
    ctx.bezierCurveTo(x + rx * 1.1, y - ry, x + rx * 1.05, y + ry * 0.9, x, y + ry);
    ctx.bezierCurveTo(x - rx * 1.05, y + ry * 0.9, x - rx * 1.15, y - ry * 0.95, x, y - ry);
    ctx.closePath();
  };
  shape();
  ctx.fillStyle = cl('#fdfcf2');
  ctx.fill();
  ctx.save();
  shape();
  ctx.clip();
  const ix = x + rx * 0.12;
  const iy = y + ry * 0.06 - up * ry * 0.5;
  const g = ctx.createLinearGradient(0, iy - ry, 0, iy + ry);
  g.addColorStop(0, cl('#235a30'));
  g.addColorStop(0.5, cl('#3f9a4a'));
  g.addColorStop(1, cl('#b4e46e'));
  ell(ctx, ix, iy, rx * 0.86, ry * 0.8);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = K.tint(a, '#d6f59a', 0.55);
  ctx.lineWidth = rx * 0.1;
  ell(ctx, ix, iy, rx * 0.5, ry * 0.46);
  ctx.stroke();
  ell(ctx, ix + rx * 0.05, iy - ry * 0.02, rx * pr, ry * pr * 0.95);
  ctx.fillStyle = cl('#14301a');
  ctx.fill();
  if (lid > 0.01) {
    ctx.fillStyle = cl(FUR.base);
    ctx.beginPath();
    ctx.moveTo(x - rx * 1.4, y - ry * 1.2);
    ctx.lineTo(x + rx * 1.4, y - ry * 1.2);
    ctx.lineTo(x + rx * 1.4, y - ry * (1 - lid * 2.6));
    ctx.quadraticCurveTo(x, y - ry * (1 - lid * 1.6), x - rx * 1.4, y - ry * (1 - lid * 0.6));
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = '#ffffff';
  ell(ctx, x - rx * 0.28, y - ry * (lid > 0.3 ? 0.06 : 0.22), rx * 0.3, ry * 0.2, -0.5);
  ctx.fill();
  ell(ctx, x + rx * 0.42, y + ry * 0.44, rx * 0.14, ry * 0.1);
  ctx.fill();
  if (f === 'blank' || f === 'peek') {
    // (the scarecrow stare: a button's two little holes of light)
    ell(ctx, x + rx * 0.3, iy - ry * 0.2, rx * 0.09, ry * 0.07);
    ctx.fill();
  }
  // the lid's line (along the heavy lid), a thick lash flick, a soft lower lid
  ctx.strokeStyle = cl(EYE_INK);
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(0.5, rx * 0.3);
  ctx.beginPath();
  if (lid > 0.01) {
    ctx.moveTo(x - rx * 1.02, y - ry * (1 - lid * 0.6) + ry * 0.3 * Math.min(1, lid * 4));
    ctx.quadraticCurveTo(x, y - ry * (1 - lid * 1.6) - ry * 0.02, x + rx * 1.0, y - ry * (1 - lid * 2.6) + ry * 0.12 * Math.min(1, lid * 4));
  } else {
    ctx.moveTo(x - rx * 0.98, y - ry * 0.2);
    ctx.bezierCurveTo(x - rx * 0.9, y - ry * 1.08, x + rx * 0.95, y - ry * 1.08, x + rx * 1.0, y - ry * 0.25);
  }
  ctx.stroke();
  ctx.lineWidth = Math.max(0.42, rx * 0.22);
  ctx.beginPath();
  ctx.moveTo(x - rx * 0.95, y - ry * 0.42);
  ctx.quadraticCurveTo(x - rx * 1.5, y - ry * 0.55, x - rx * 1.7, y - ry * 0.95);
  ctx.stroke();
  ctx.strokeStyle = K.tint(a, '#c89a7a', 0.85);
  ctx.lineWidth = Math.max(0.32, rx * 0.15);
  ctx.beginPath();
  ctx.moveTo(x - rx * 0.7, y + ry * 0.78);
  ctx.quadraticCurveTo(x, y + ry * 1.12, x + rx * 0.75, y + ry * 0.72);
  ctx.stroke();
  // (sad: a worried brow)
  if (f === 'sad') {
    ctx.strokeStyle = cl(EYE_INK);
    ctx.lineWidth = Math.max(0.4, rx * 0.2);
    ctx.beginPath();
    ctx.moveTo(x - rx * 1.0, y - ry * 1.3);
    ctx.lineTo(x + rx * 0.9, y - ry * 1.55);
    ctx.stroke();
  }
}
// The mouth (head frame): the base draws the little split lip; over it a smile, a wide "BOO", a
// giggle, a tongue poking out with concentration, a sneeze.
function mouth(ctx, a, K, f, sb) {
  const s = K.sc;
  const cl = (c) => K.colour(a, c);
  const mx = 8.5;
  const my = 4.0;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (sb.open > 0.08) {
    // open: a round "O" (the Boo, the sneeze), its little tongue
    const o = sb.open;
    ell(ctx, s(mx - 0.2), s(my + 0.6 + o * 0.5), s(0.9 + o * 0.5), s(0.5 + o * 1.3));
    ctx.fillStyle = cl('#b8505e');
    ctx.fill();
    ell(ctx, s(mx - 0.2), s(my + 1.0 + o * 1.1), s(0.6 + o * 0.3), s(0.25 + o * 0.45));
    ctx.fillStyle = cl('#ff98a8');
    ctx.fill();
    return;
  }
  if (f === 'giggle' || f === 'happy' || f === 'smug' || sb.smile > 0.5) {
    // a wide little smile under the lip, a dimple
    ctx.strokeStyle = cl('#a86a58');
    ctx.lineWidth = s(0.38);
    ctx.beginPath();
    ctx.moveTo(s(mx - 2.0), s(my + 0.1));
    ctx.quadraticCurveTo(s(mx - 0.6), s(my + (f === 'giggle' ? 1.7 : 1.1)), s(mx + 0.5), s(my + 0.2));
    if (f === 'giggle') {
      ctx.closePath();
      ctx.fillStyle = cl('#c8606e');
      ctx.fill();
    }
    ctx.stroke();
  }
  if (sb.mlem > 0.2) {
    // the tip of its tongue out with concentration
    ell(ctx, s(mx + 0.2), s(my + 0.9), s(0.55), s(0.45 * sb.mlem + 0.15));
    ctx.fillStyle = cl('#ff8ea4');
    ctx.fill();
  }
}
function face(ctx, a, sk, K) {
  const sb = a.sb;
  if (!sb) return;
  const s = K.sc;
  const f = sb.face;
  // a blush (brighter giggling, blissful or proud) and a few freckles
  const warm = 0.45 + 0.35 * Math.max(sb.blush, f === 'giggle' || f === 'bliss' || f === 'smug' ? 1 : 0);
  K.glow(ctx, [s(4.2), s(3.0)], s(2.3), warm, '#ff9cae');
  ctx.fillStyle = K.tint(a, '#d49a72', 0.8);
  for (const [fx, fy] of [[3.2, 2.2], [4.3, 2.7], [3.7, 3.4]]) {
    ell(ctx, s(fx), s(fy), s(0.28), s(0.28));
    ctx.fill();
  }
  mouth(ctx, a, K, f, sb);
  eye(ctx, a, K, s(3.4), s(-1.4), f);
}

// ---------- The straw hat ----------
// Where a point of the hat (its own frame: the crown's foot at 0, 0, the brim out to ±11.4) is, in
// the head's frame and in the world.
const HAT_AT = [-1.2, -6.2];
const hatLocal = (K, sb) => [K.sc(HAT_AT[0]), K.sc(HAT_AT[1] - sb.lift)];
const hatAng = (sb) => -0.16 + sb.tip;
function hatWorld(a, K, p) {
  const sb = a.sb;
  const bk = a.bk;
  return add(bk.hp, rot(add(hatLocal(K, sb), rot([K.sc(p[0]), K.sc(p[1])], hatAng(sb))), bk.ha));
}
// The hat itself, drawn about its own frame (ctx already there): a wide floppy brim, a round crown,
// the red band, a stitched patch, frayed straws at the back.
function hatShape(ctx, a, K, mode) {
  const s = K.sc;
  const brim = () => {
    ctx.beginPath();
    const n = 40;
    for (let i = 0; i <= n; i++) {
      const q = (i / n) * TAU;
      const rr = 1 + 0.06 * Math.sin(q * 9) * (Math.sin(q) > 0 ? 1 : 0.3);
      const p = [Math.cos(q) * s(11.4) * rr, Math.sin(q) * s(2.6) * rr + (Math.cos(q) > 0.6 ? s(0.9) * (Math.cos(q) - 0.6) : 0)];
      if (i) ctx.lineTo(...p);
      else ctx.moveTo(...p);
    }
    ctx.closePath();
  };
  const crown = () => {
    ctx.beginPath();
    ctx.moveTo(s(-6.2), s(0.4));
    ctx.bezierCurveTo(s(-6.6), s(-5.4), s(-2.6), s(-7.2), s(0.4), s(-7.0));
    ctx.bezierCurveTo(s(3.6), s(-6.8), s(6.6), s(-5.0), s(6.0), s(0.4));
    ctx.closePath();
  };
  brim();
  fillOr(ctx, a, K, mode, SB.hat);
  crown();
  fillOr(ctx, a, K, mode, SB.hat);
  if (mode === 'line') return;
  ctx.save();
  brim();
  ctx.clip();
  K.glow(ctx, [s(-4), s(-1)], s(7), 0.8, SB.hatLt);
  ctx.strokeStyle = K.tint(a, SB.hatSh, 0.55);
  ctx.lineWidth = s(0.3);
  for (const k of [0.45, 0.72]) {
    ell(ctx, 0, 0, s(11.4) * k, s(2.6) * k);
    ctx.stroke();
  }
  ctx.restore();
  ctx.save();
  crown();
  ctx.clip();
  K.glow(ctx, [s(-2), s(-5)], s(6), 0.85, SB.hatLt);
  K.glow(ctx, [s(4.6), s(-1)], s(4), 0.5, SB.hatSh);
  ctx.strokeStyle = K.tint(a, SB.hatSh, 0.5);
  ctx.lineWidth = s(0.3);
  for (let i = 1; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(s(-7), s(-i * 1.25));
    ctx.quadraticCurveTo(0, s(-i * 1.25 - 0.8), s(7), s(-i * 1.25));
    ctx.stroke();
  }
  ctx.fillStyle = K.colour(a, SB.band);
  ctx.beginPath();
  ctx.moveTo(s(-7), s(-1.0));
  ctx.quadraticCurveTo(0, s(-2.2), s(7), s(-1.0));
  ctx.lineTo(s(7), s(0.6));
  ctx.quadraticCurveTo(0, s(-0.6), s(-7), s(0.6));
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = K.colour(a, SB.denim);
  ctx.beginPath();
  ctx.moveTo(s(1.6), s(-5.4));
  ctx.lineTo(s(4.2), s(-5.0));
  ctx.lineTo(s(4.0), s(-2.8));
  ctx.lineTo(s(1.4), s(-3.1));
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = K.colour(a, SB.stitch);
  ctx.setLineDash([s(0.4), s(0.35)]);
  ctx.lineWidth = s(0.22);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
  ctx.strokeStyle = K.colour(a, SB.hatSh);
  ctx.lineWidth = s(0.35);
  ctx.lineCap = 'round';
  for (const [x0, y0, x1, y1] of [[-10.6, 0.6, -12.0, 1.8], [-9.4, 1.6, -10.2, 3.0], [-11.2, -0.4, -12.6, -0.2]]) {
    ctx.beginPath();
    ctx.moveTo(s(x0), s(y0));
    ctx.lineTo(s(x1), s(y1));
    ctx.stroke();
  }
}
// On its head (unless it's flying out on a hat boomerang).
function hatOn(ctx, a, mode, K) {
  const sb = a.sb;
  if (!sb || sb.away) return;
  K.headFrame(ctx, a);
  ctx.translate(...hatLocal(K, sb));
  ctx.rotate(hatAng(sb));
  hatShape(ctx, a, K, mode);
}
// The near forepaw over the hat when it reaches up to it (the leg itself is drawn under the head):
// a little round mitten with a soft edge of its own.
function pawOnHat(ctx, a, mode, K) {
  const sb = a.sb;
  if (!sb || sb.reach < 0.35 || !a.bk) return;
  // (no outline pass: it sits over the hat, so it carries a soft edge of its own)
  if (mode === 'line') return;
  // (at the brim's front, the arm itself reaching up behind its head)
  const k = sstep((sb.reach - 0.35) / 0.45);
  const q = hatWorld(a, K, [6.2, 0.6]);
  const p0 = a.bk.legs.foreN.P;
  const p = [mix(p0[0], q[0], k), mix(p0[1], q[1], k)];
  const r = K.sc(2.3);
  ell(ctx, p[0], p[1], r, r * 0.85, -0.4);
  ctx.globalAlpha *= sstep((sb.reach - 0.35) / 0.25);
  ctx.fillStyle = K.colour(a, FUR.base);
  ctx.fill();
  ctx.strokeStyle = K.colour(a, FUR.deep);
  ctx.lineWidth = K.sc(0.45);
  ctx.stroke();
  K.glow(ctx, [p[0] - r * 0.2, p[1] - r * 0.3], r, 0.8, FUR.lt);
}

// ---------- The dungarees ----------
// Over the body: from just behind the chest down and back over the haunch, a bib up the chest, a
// checked patch on the haunch, stitched seams, a strap and its button; straw poking out of the
// bib's top (and one long straw springing out in its act).
function dungarees(ctx, a, K, mode) {
  if (mode === 'line') return;
  const sk = a.bk;
  const s = K.sc;
  const sb = a.sb ?? {};
  ctx.save();
  K.bodyPath(ctx, a);
  ctx.clip();
  const P = (x, y) => sk.at([x, y]);
  ctx.strokeStyle = K.colour(a, SB.straw);
  ctx.lineCap = 'round';
  ctx.lineWidth = s(0.7);
  for (const [x0, y0, x1, y1] of [[6.4, -2.6, 7.6, -5.4], [4.8, -2.8, 5.0, -5.8], [3.2, -2.2, 2.2, -5.0], [7.4, -1.6, 9.4, -3.6]]) {
    ctx.beginPath();
    ctx.moveTo(...P(x0, y0));
    ctx.lineTo(...P(x1, y1));
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(...P(9.6, -1.4));
  ctx.quadraticCurveTo(...P(5.6, -3.0), ...P(2.0, -1.6));
  ctx.quadraticCurveTo(...P(-4, -2.8), ...P(-9.4, -6.2));
  ctx.lineTo(...P(-18, -6));
  ctx.lineTo(...P(-18, 12));
  ctx.lineTo(...P(12, 12));
  ctx.closePath();
  ctx.fillStyle = K.colour(a, SB.denim);
  ctx.fill();
  ctx.save();
  ctx.clip();
  K.glow(ctx, P(-9, -2.6), s(7), 0.6, SB.denimLt);
  K.glow(ctx, P(-1, 7.6), s(6), 0.55, SB.denimSh);
  ctx.fillStyle = K.colour(a, SB.patch);
  ctx.beginPath();
  ctx.moveTo(...P(-12.4, -0.6));
  ctx.lineTo(...P(-8.4, -1.6));
  ctx.lineTo(...P(-7.8, 2.6));
  ctx.lineTo(...P(-11.8, 3.4));
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = K.tint(a, '#ffffff', 0.5);
  ctx.lineWidth = s(0.35);
  ctx.beginPath();
  ctx.moveTo(...P(-10.2, -1.1));
  ctx.lineTo(...P(-9.8, 3.0));
  ctx.moveTo(...P(-12.1, 1.4));
  ctx.lineTo(...P(-8.1, 0.5));
  ctx.stroke();
  ctx.strokeStyle = K.colour(a, SB.stitch);
  ctx.setLineDash([s(0.5), s(0.45)]);
  ctx.lineWidth = s(0.25);
  ctx.beginPath();
  ctx.moveTo(...P(9.0, -0.8));
  ctx.quadraticCurveTo(...P(5.6, -2.3), ...P(2.2, -1.0));
  ctx.quadraticCurveTo(...P(-4, -2.1), ...P(-9.2, -5.4));
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(...P(-12.4, -0.6));
  ctx.lineTo(...P(-8.4, -1.6));
  ctx.lineTo(...P(-7.8, 2.6));
  ctx.lineTo(...P(-11.8, 3.4));
  ctx.closePath();
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
  ctx.strokeStyle = K.colour(a, SB.denimSh);
  ctx.lineWidth = s(1.3);
  ctx.beginPath();
  ctx.moveTo(...P(-2, -9.6));
  ctx.quadraticCurveTo(...P(2.4, -5.2), ...P(5.4, -2.6));
  ctx.stroke();
  const b = P(5.4, -2.2);
  ell(ctx, b[0], b[1], s(0.75), s(0.75));
  ctx.fillStyle = K.colour(a, '#ffd25a');
  ctx.fill();
  ctx.restore();
}
// The long loose straw springing out of the bib (its act): a stalk from inside the bib's top,
// wobbling on a spring, its length `sb.loose`; drawn over the body in both passes so it's outlined.
function looseStraw(ctx, a, mode, K) {
  const sb = a.sb;
  if (!sb || sb.loose < 0.04) return;
  const sk = a.bk;
  const s = K.sc;
  // (out of the bib's front low on its chest, sticking out ahead under its chin)
  const root = sk.at([7.4, 3.6]);
  const L = s(8.5) * sb.loose;
  const an = -0.12 + sb.wob * 0.5;
  const tip = add(root, [Math.cos(an) * L, Math.sin(an) * L]);
  const midP = add(root, [Math.cos(an + 0.25) * L * 0.55, Math.sin(an + 0.25) * L * 0.55]);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(...root);
  ctx.quadraticCurveTo(...midP, ...tip);
  if (mode === 'line') {
    ctx.strokeStyle = K.colour(a, INK);
    ctx.lineWidth = s(0.8) + 2;
    ctx.stroke();
    return;
  }
  ctx.strokeStyle = K.colour(a, SB.straw);
  ctx.lineWidth = s(0.8);
  ctx.stroke();
  ctx.strokeStyle = K.tint(a, SB.hatLt, 0.8);
  ctx.lineWidth = s(0.3);
  ctx.stroke();
}

// ---------- Its moves ----------
// The Boo: a sneaky crouch, ears laid back, paws tucked up; then a leap up, arms flung out wide,
// ears up, mouth wide; landing, it holds the pose a beat, then settles.
const BOO = {
  anticT: 0.4,
  keys: [
    [0, { crouch: 0.6, hunch: 12, neck: 8, head: 8, ears: -0.9, paws: 0.7, sit: 0.2 }],
    [0.1, { hop: 0.3, sit: 0.75, wide: 1, paws: 0, neck: -12, head: -10, ears: 1, jaw: 1, x: 0.1 }, 'out'],
    [0.3, { hop: 0.03, sit: 0.65, wide: 1, neck: -8, head: -6, ears: 0.9, jaw: 0.9, x: 0.12 }, 'in'],
    [0.55, { sit: 0.3, wide: 0.3, jaw: 0.2, ears: 0.5, x: 0.08 }, 'io'],
    [0.9, {}, 'io'],
  ],
};
// The hat boomerang: it grabs the brim and winds back; flings the hat out (it flies by the move's
// clock, see hatFlight), watches it loop, reaches up to catch it and plunks it back on.
const HATTHROW = {
  anticT: 0.36,
  keys: [
    [0, { sit: 0.7, reach: 1, pitch: -6, neck: -10, head: -8, ears: 0.4 }],
    [0.08, { sit: 0.35, reach: 0.15, wide: 0.7, pitch: 6, neck: 4, head: 6, x: 0.06, ears: -0.4 }, 'out'],
    [0.5, { sit: 0.35, wide: 0.35, x: 0.05, neck: -4, head: -4, ears: 0.3 }, 'io'],
    [0.82, { sit: 0.7, reach: 1, ears: 0.6, neck: -6 }, 'io'],
    [1.02, { sit: 0.45, reach: 0.5, head: 4 }, 'io'],
    [1.3, {}, 'io'],
  ],
};
// The hat's flight through a boomerang, by the move's clock: [forward, up] in body heights, its
// spin, and whether it's off its head.
function hatFlight(t) {
  if (t < 0.06 || t >= 0.84) return null;
  const u = (t - 0.06) / 0.78;
  const e = sstep(u);
  return { fx: Math.sin(Math.PI * e) * 0.56, fy: 0.06 + Math.sin(TAU * e) * 0.12, spin: e * TAU * 2, u };
}

// ---------- Its act ----------
const CYCLE = 30;
const look = {
  P: { scale: 0.68, moves: ['boo', 'hatthrow', 'thump'] },
  C: { ...FUR, guide: '#cfb998', nose: '#f08aa0', inner: '#ffc6cc' },
  ink: INK,
  moves: { boo: BOO, hatthrow: HATTHROW },
  channels: { wide: [150, 20], reach: [170, 21], scratch: [200, 20] },
  face,
  over: {
    body: (ctx, a, mode, K) => {
      dungarees(ctx, a, K, mode);
    },
    head: hatOn,
    earN: pawOnHat,
  },
  under: {
    neck: looseStraw,
  },
  // Its act on the base's channels (x, lift, hop, pitch, hunch, crouch, sit, lie, loaf, fly, kick,
  // stamp, paws, neck, head, jaw, ears; its own wide, reach, scratch), its face and props (a.sb).
  pose: (m, a, out, K, mv, mt) => {
    const st = a.mo.rig;
    const sb = { face: 'open', lift: 0, tip: 0, away: false, reach: 0, open: 0, smile: 0, mlem: 0, blush: 0, loose: 0, wob: 0, feather: null, burst: -1, itch: -1, choo: -1, twinkle: -1, z: 0, lu: 0 };
    a.sb = sb;
    const name = a.bnName;
    const napping = m.habit?.kind === 'nap' && (a.now ?? 0) < (m.habit.until ?? 0);
    const mood = m.cine?.mood ?? a.mood;
    // (its act, only while it stands about: eased in and out on a spring, so starting to walk or
    // fight never snaps a pose; never while it walks, fights, naps or is posed in a scene)
    const goal = clamp((1 - clamp(a.walkW ?? 0, 0, 1)) * (a.moving ? 0 : 1) * (m.pose || m.cine || mv || napping || m.hp <= 0 ? 0 : 1), 0, 1);
    const dt = clamp(a.dt ?? 0, 0, 0.1);
    st.sbCalm = Number.isFinite(st.sbCalm) ? st.sbCalm + (goal - st.sbCalm) * Math.min(1, dt * 8) : goal;
    // (a move takes over at once: its own springs carry the change)
    const calm = mv ? 0 : st.sbCalm;
    // faces outside the act
    if (m.hp <= 0) {
      sb.face = 'dead';
      sb.tip = 0.42;
      sb.lift = -0.6;
    } else if ((a.hurtAgo ?? 9) < 0.45 || name === 'hurt' || name === 'knockdown') {
      sb.face = 'hurt';
      sb.tip = 0.12;
    } else if (napping || mood === 'sleep') {
      sb.face = 'sleep';
      sb.z = napping ? 1 : 0;
      sb.tip = 0.48;
      sb.lift = -0.9;
    } else if (name === 'binky') {
      sb.face = 'giggle';
    } else if (name === 'boo') {
      sb.face = mt < 0 ? 'focus' : mt < 0.55 ? 'boo' : 'giggle';
      sb.open = mt < 0 ? 0 : win(mt, 0.02, 0.1, 0.4, 0.6);
      sb.burst = mt >= 0.06 && mt < 0.66 ? (mt - 0.06) / 0.6 : -1;
      sb.lift = mt >= 0 ? pulse(mt, 0.06, 0.4) * 1.2 : 0;
    } else if (name === 'hatthrow') {
      sb.face = mt < 0.06 ? 'focus' : mt < 0.8 ? 'smug' : 'happy';
      sb.reach = mt < 0 ? 1 : mt < 0.08 ? 1 - mt / 0.08 : win(mt, 0.7, 0.82, 0.95, 1.1);
      sb.lift = mt < 0 ? 1.4 * sstep(1 + mt / HATTHROW.anticT) : 0;
      sb.tip = mt < 0 ? -0.15 : mt > 0.84 ? pulse(mt, 0.84, 0.3) * 0.2 : 0;
      sb.away = Boolean(hatFlight(mt));
    } else if (name === 'thump') {
      sb.face = 'focus';
      sb.tip = pulse(mt, 0.07, 0.2) * 0.08 + pulse(mt, 0.25, 0.2) * 0.08;
    } else if (mv || a.face === 'angry' || mood === 'angry') sb.face = 'focus';
    else if (mood === 'happy') sb.face = 'happy';
    else if (mood === 'sad') sb.face = 'sad';
    else if (a.face === 'blink') sb.face = 'blink';
    if (mood === 'talk' && m.hp > 0) sb.open = Math.max(0, Math.sin((a.t ?? 0) * 13)) * 0.45;
    if (calm < 0.02) return;
    const lu = ((((a.t ?? 0) + ((m.uid ?? 0) % 7) * 4.3) % CYCLE) + CYCLE) % CYCLE;
    sb.lu = lu;
    const go = (pose, w) => {
      if (w > 0.001) for (const [k, v] of Object.entries(pose)) out[k] = (out[k] ?? 0) + (v - (out[k] ?? 0)) * w;
    };
    const say = (f, w) => {
      if (w > 0.4) sb.face = f;
    };
    // 1. playing scarecrow: up on its haunches, arms flung out wide, frozen stiff with a blank stare;
    //    a crow's feather drifts down onto its hat brim; its eyes roll up to it; BOO! a leap, the
    //    feather flung away, straw and sparkles; a fit of giggles, paws over its mouth
    const up = win(lu, 0.6, 1.2, 4.95, 5.05) * calm;
    const stiff = win(lu, 1.1, 1.4, 4.9, 5.0) * calm;
    go({ sit: 1, wide: 1, paws: 0, hunch: -2, neck: -12, head: 0, ears: 0.9, lift: 0, pitch: 0 }, up);
    say('blank', stiff);
    say('peek', win(lu, 3.3, 3.45, 4.5, 4.6) * calm);
    const boo = pulse(lu, 5.0, 0.55) * calm;
    go({ sit: 0.7, wide: 1, hop: 0.3, ears: 1, jaw: 1, neck: -14, head: -10 }, boo);
    say('boo', boo);
    sb.open = Math.max(sb.open, boo);
    if (lu >= 5.02 && lu < 5.62 && calm > 0.5) sb.burst = (lu - 5.02) / 0.6;
    // (the feather: drifting down 1.8-3.0, on the brim to the Boo, then flung off up and back)
    if (lu >= 1.8 && lu < 5.7 && calm > 0.3) sb.feather = lu < 3.0 ? { k: 'fall', u: (lu - 1.8) / 1.2 } : lu < 5.0 ? { k: 'sit', u: (lu - 3.0) / 2 } : { k: 'off', u: (lu - 5.0) / 0.7 };
    const giggle = win(lu, 5.55, 5.8, 7.0, 7.5) * calm;
    go({ sit: 0.75, paws: 1, wide: 0, hunch: 6, neck: 2, head: 6, ears: 0.4 }, giggle);
    out.pitch += giggle * Math.sin(lu * 24) * 2.5;
    out.head += giggle * Math.sin(lu * 24 + 0.6) * 3;
    say('giggle', giggle);
    sb.blush = Math.max(sb.blush, giggle);
    // 2. the straw itches: a wriggle and a squint; sat up scratching behind its ear with a hind foot,
    //    frantic, blissful, straw bits falling; a shake-out and a sigh
    const wrig = win(lu, 9.0, 9.2, 10.0, 10.3) * calm;
    out.pitch += wrig * Math.sin(lu * 19) * 4;
    out.hunch += wrig * (4 + Math.sin(lu * 13) * 4);
    out.ears += -wrig * 0.3;
    say('squint', wrig);
    const scr = win(lu, 10.2, 10.6, 12.3, 12.7) * calm;
    go({ sit: 0.55, paws: 0.4, scratch: 1, neck: 6, head: 16, ears: -0.2, pitch: -6 }, scr);
    out.lift += scr * Math.sin(lu * 34) * 0.25;
    say('bliss', win(lu, 10.7, 10.9, 12.3, 12.5) * calm);
    sb.itch = lu >= 10.7 && lu < 12.4 && calm > 0.5 ? (lu - 10.7) / 1.7 : -1;
    const shake = win(lu, 12.6, 12.75, 13.2, 13.4) * calm;
    out.head += shake * Math.sin(lu * 40) * 8;
    out.ears += shake * Math.sin(lu * 40 + 1) * 0.6;
    say('happy', win(lu, 13.3, 13.5, 14.0, 14.3) * calm);
    // 3. a long straw springs out of its bib; startled; stuffed back in a bit at a time, tongue out;
    //    a proud pat
    const pop = sstep((lu - 15.0) / 0.12) * (1 - sstep((lu - 16.2) / 0.3) * 0.35 - sstep((lu - 16.9) / 0.3) * 0.35 - sstep((lu - 17.6) / 0.35) * 0.3);
    sb.loose = pop * calm;
    sb.wob = Math.sin(lu * 17) * Math.exp(-Math.max(0, lu - 15.0) * 3) * calm + win(lu, 16.0, 16.1, 17.8, 17.9) * Math.sin(lu * 11) * 0.4 * calm;
    const spotS = win(lu, 15.05, 15.2, 15.8, 16.0) * calm;
    go({ hop: 0.12, neck: 10, head: 18, ears: 0.9 }, spotS);
    say('wide', spotS);
    const stuff = win(lu, 15.9, 16.2, 17.8, 18.1) * calm;
    go({ sit: 0.85, paws: 1, neck: 8, head: 14, ears: 0.2 }, stuff);
    out.pitch += stuff * (pulse(lu % 0.7, 0.1, 0.3)) * 3;
    say('focus', stuff);
    sb.mlem = Math.max(sb.mlem, stuff);
    const pat = win(lu, 18.0, 18.2, 19.0, 19.4) * calm;
    go({ sit: 0.7, paws: 1, hunch: -4, head: -4, ears: 0.6 }, pat);
    out.lift += pat * Math.abs(Math.sin(lu * 16)) * 0.3;
    say('smug', pat);
    // 4. a straw tickles its nose: "ah... ah..." and a big CHOO that pops the hat up off its head; it
    //    lands back askew over one eye; a dazed blink, a sniffle
    const ah = win(lu, 20.6, 21.4, 21.85, 21.92) * calm;
    go({ neck: -10, head: -16, ears: 0.3, jaw: 0.4, hunch: -4 }, ah);
    out.head += ah * pulse(lu, 21.0, 0.35) * -4;
    say('squint', ah);
    const choo = win(lu, 21.88, 21.95, 22.15, 22.6) * calm;
    go({ neck: 12, head: 20, ears: 1, jaw: 0.8, hunch: 8, crouch: 0.3 }, choo);
    say('squint', choo);
    sb.open = Math.max(sb.open, choo * 0.8);
    sb.choo = lu >= 21.9 && lu < 22.8 && calm > 0.5 ? (lu - 21.9) / 0.9 : -1;
    const fly = pulse(lu, 21.92, 0.55);
    // (the hat: popped up, then back down askew until it's set straight)
    const askew = sstep((lu - 22.3) / 0.25) * (1 - sstep((lu - 25.0) / 0.9));
    sb.lift += fly * 4.5 * calm;
    sb.tip += (fly * -0.4 + askew * 0.55) * calm;
    sb.lift -= askew * 0.8 * calm;
    say('blink', win(lu, 22.5, 22.6, 22.75, 22.85) * calm);
    say('sad', win(lu, 22.9, 23.0, 23.8, 24.0) * calm);
    out.lift += win(lu, 23.0, 23.1, 23.6, 23.8) * Math.abs(Math.sin(lu * 14)) * 0.25 * calm;
    // 5. it reaches up and sets the hat straight with little tugs; then a proud pose, chest out, chin
    //    up, a twinkle off the brim
    const fix = win(lu, 24.4, 24.8, 25.8, 26.1) * calm;
    go({ sit: 0.8, reach: 1, neck: -6, head: -2, ears: 0.5 }, fix);
    out.reach += fix * Math.sin(lu * 15) * 0.12;
    sb.tip += fix * Math.sin(lu * 15) * 0.05;
    sb.reach = Math.max(sb.reach, out.reach ?? 0);
    say('focus', fix);
    sb.mlem = Math.max(sb.mlem, fix * 0.8);
    const proud = win(lu, 26.2, 26.6, 28.3, 28.9) * calm;
    go({ sit: 1, paws: 0.6, hunch: -8, neck: -14, head: -8, ears: 0.8 }, proud);
    say('smug', proud);
    sb.smile = Math.max(sb.smile, proud);
    sb.twinkle = lu >= 26.8 && lu < 27.6 && calm > 0.5 ? (lu - 26.8) / 0.8 : -1;
  },
  // Napping: a loaf, the hat tipped down over its eyes, a slow breath.
  after: (m, a, out) => {
    const napping = m.habit?.kind === 'nap' && (a.now ?? 0) < (m.habit.until ?? 0) && m.hp > 0;
    if (!napping) return;
    const b = Math.sin((a.t ?? 0) * 1.1);
    Object.assign(out, { loaf: 1, sit: 0, lie: 0, paws: 0, wide: 0, reach: 0, scratch: 0, hop: 0, neck: 4, head: 10 + b, ears: -0.7, hunch: 10 + b * 1.5, lift: b * 0.15, jaw: 0 });
  },
  // Its extras: the Boo's burst, the feather, straw bits from the scratch, the sneeze, the brim's
  // twinkle, a nap's "z"; in a fight, the hat boomerang and the thump's straw.
  fx: (ctx, m, a, K) => {
    const sb = a.sb;
    const bk = a.bk;
    if (!sb || !bk) return;
    const s = K.sc;
    const H = K.H;
    const name = a.bnName;
    const mt = a.bnMove?.t ?? 0;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const straw = (x, y, an, L, al) => {
      ctx.globalAlpha = al;
      const d = [Math.cos(an) * L * 0.5, Math.sin(an) * L * 0.5];
      ctx.strokeStyle = SB.hatSh;
      ctx.lineWidth = s(1.05);
      ctx.beginPath();
      ctx.moveTo(x - d[0], y - d[1]);
      ctx.lineTo(x + d[0], y + d[1]);
      ctx.stroke();
      ctx.strokeStyle = SB.straw;
      ctx.lineWidth = s(0.55);
      ctx.stroke();
    };
    // the Boo's burst: straw and star sparkles fanning out close in front of its face
    if (sb.burst >= 0) {
      const u = sb.burst;
      const e = 1 - (1 - u) ** 3;
      const c = add(bk.hp, [s(6), -s(2)]);
      for (let i = 0; i < 7; i++) {
        const q = -1.25 + (i / 6) * 1.9;
        const d = s(4) + e * s(7 + (i % 3) * 1.6);
        straw(c[0] + Math.cos(q) * d, c[1] + Math.sin(q) * d + e * e * s(3), q + u * 4 + i, s(2.6), 1 - u * u);
      }
      for (let i = 0; i < 4; i++) {
        const q = -1.0 + i * 0.6;
        ctx.globalAlpha = 1 - u;
        ctx.fillStyle = i % 2 ? '#fff3b0' : '#ffffff';
        sparkle(ctx, c[0] + Math.cos(q) * (s(3) + e * s(9)), c[1] + Math.sin(q) * (s(3) + e * s(9)), s(1.3) * (1 - u * 0.5));
      }
      ctx.globalAlpha = 1;
    }
    // the crow's feather: drifting down onto the brim, sitting there, flung off
    if (sb.feather) {
      const { k, u } = sb.feather;
      const on = hatWorld(a, K, [5.2, -1.4]);
      let p = on;
      let an = -0.5;
      let al = 1;
      if (k === 'fall') {
        const top = hatWorld(a, K, [1.5, -13]);
        const e = sstep(u);
        p = [mix(top[0], on[0], e) + Math.sin(u * 9) * s(2.2) * (1 - e), mix(top[1], on[1], e)];
        an = -0.5 + Math.sin(u * 9 + 1) * 0.6 * (1 - e);
      } else if (k === 'off') {
        const e = 1 - (1 - u) ** 2;
        p = [on[0] - e * s(7), on[1] - e * s(9) + e * e * s(2)];
        an = -0.5 + e * 5;
        al = 1 - sstep((u - 0.5) / 0.5);
      } else an = -0.5 + Math.sin(u * 8) * 0.06;
      ctx.save();
      ctx.globalAlpha = al;
      ctx.translate(...p);
      ctx.rotate(an);
      const L = s(6.2);
      const vane = () => {
        ctx.beginPath();
        ctx.moveTo(-L * 0.42, 0);
        ctx.quadraticCurveTo(-L * 0.15, -L * 0.3, L * 0.3, -L * 0.2);
        ctx.quadraticCurveTo(L * 0.52, -L * 0.12, L * 0.5, 0);
        ctx.lineTo(L * 0.14, L * 0.04);
        ctx.lineTo(L * 0.2, L * 0.12);
        ctx.quadraticCurveTo(-L * 0.1, L * 0.2, -L * 0.42, 0);
        ctx.closePath();
      };
      vane();
      ctx.strokeStyle = SB.featherInk;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = SB.feather;
      ctx.fill();
      ctx.save();
      vane();
      ctx.clip();
      ell(ctx, -L * 0.05, -L * 0.12, L * 0.4, L * 0.08, -0.08);
      ctx.fillStyle = SB.featherLt;
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = K.tint(a, SB.featherInk, 0.55);
      ctx.lineWidth = s(0.18);
      for (const f of [-0.15, 0.05, 0.25]) {
        ctx.beginPath();
        ctx.moveTo(L * f, -L * 0.01);
        ctx.lineTo(L * (f + 0.1), -L * 0.17);
        ctx.stroke();
      }
      ctx.strokeStyle = '#eeeefc';
      ctx.lineWidth = s(0.22);
      ctx.beginPath();
      ctx.moveTo(-L * 0.62, L * 0.04);
      ctx.quadraticCurveTo(0, -L * 0.06, L * 0.42, -L * 0.03);
      ctx.stroke();
      ctx.restore();
      ctx.globalAlpha = 1;
    }
    // the scratch: bits of straw shaken loose, drifting down by its neck; a little sparkle of relief
    if (sb.itch >= 0) {
      const c = add(bk.nb, [-s(2), -s(1)]);
      for (let i = 0; i < 3; i++) {
        const u = (sb.itch * 2.2 + i / 3) % 1;
        straw(c[0] - s(2) + i * s(1.8) + Math.sin(u * 7 + i) * s(1), c[1] + u * s(9), 0.6 + i + u * 3, s(1.8), Math.sin(Math.PI * u));
      }
      ctx.globalAlpha = Math.sin(Math.PI * sb.itch) * 0.9;
      ctx.fillStyle = '#fff3b0';
      sparkle(ctx, bk.hp[0] - s(6), bk.hp[1] - s(9), s(1.1));
      ctx.globalAlpha = 1;
    }
    // the sneeze: a soft puff and sparkles off its nose
    if (sb.choo >= 0) {
      const u = sb.choo;
      const e = 1 - (1 - u) ** 2;
      const n = add(bk.hp, rot([s(11), s(1.5)], bk.ha));
      for (let i = 0; i < 4; i++) {
        const q = -0.5 + i * 0.35;
        ctx.globalAlpha = (1 - u) * 0.85;
        ctx.fillStyle = '#fff7ea';
        ell(ctx, n[0] + Math.cos(q) * (s(1.5) + e * s(5)), n[1] + Math.sin(q) * (s(1.5) + e * s(5)), s(1) + e * s(1), s(1) + e * s(1));
        ctx.fill();
        ctx.strokeStyle = '#e6d6bc';
        ctx.lineWidth = s(0.3);
        ctx.stroke();
      }
      ctx.fillStyle = '#fff3b0';
      sparkle(ctx, n[0] + s(3) + e * s(5), n[1] - s(3) - e * s(2), s(1.1));
      ctx.globalAlpha = 1;
    }
    // a twinkle off the hat brim, proud
    if (sb.twinkle >= 0) {
      const p = hatWorld(a, K, [9.6, -0.8]);
      const u = sb.twinkle;
      ctx.globalAlpha = Math.sin(Math.PI * u);
      ctx.fillStyle = '#ffffff';
      sparkle(ctx, p[0], p[1], s(1.2) + Math.sin(Math.PI * u) * s(1.2));
      ctx.fillStyle = '#fff3b0';
      sparkle(ctx, p[0] + s(2.6), p[1] - s(2.4), s(0.8) * Math.sin(Math.PI * u));
      ctx.globalAlpha = 1;
    }
    // the hat boomerang: spinning out ahead in a short loop, a sparkle trail
    if (name === 'hatthrow') {
      const fl = hatFlight(mt);
      if (fl) {
        const home = hatWorld(a, K, [0, -2]);
        const x = home[0] + fl.fx * H;
        const y = home[1] - fl.fy * H;
        for (let j = 1; j <= 3; j++) {
          const g = hatFlight(mt - j * 0.05);
          if (!g) continue;
          ctx.globalAlpha = 0.7 - j * 0.18;
          ctx.fillStyle = j % 2 ? '#fff3b0' : '#ffffff';
          sparkle(ctx, home[0] + g.fx * H, home[1] - g.fy * H, s(1.2) - j * s(0.2));
        }
        ctx.globalAlpha = 1;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(fl.spin);
        ctx.scale(0.92, 0.92);
        ctx.translate(0, s(2));
        hatShape(ctx, a, K, 'line');
        hatShape(ctx, a, K, 'fill');
        ctx.restore();
      }
    }
    // the thump: straw bursting from its heels at each stamp
    if (name === 'thump') {
      const heel = bk.legs.hindN.P;
      for (const t0 of [0.07, 0.25]) {
        const u = (mt - t0) / 0.4;
        if (u < 0 || u > 1) continue;
        const e = 1 - (1 - u) ** 3;
        for (let i = 0; i < 5; i++) {
          const q = -Math.PI * (0.15 + (i / 4) * 0.7);
          straw(heel[0] + Math.cos(q) * (s(2) + e * s(6)), heel[1] - s(0.5) + Math.sin(q) * (s(1.5) + e * s(5)) + e * e * s(3), q + i + u * 5, s(2.2), 1 - u * u);
        }
        ctx.globalAlpha = 1 - u;
        ctx.fillStyle = '#ffffff';
        sparkle(ctx, heel[0] + s(1), heel[1] - s(3) - e * s(3), s(1.2));
        ctx.globalAlpha = 1;
      }
    }
    // napping: a little straw-gold "z" drifting up off its hat
    if (sb.z > 0 && m.hp > 0) {
      const top = hatWorld(a, K, [3, -7]);
      for (let i = 0; i < 2; i++) {
        const u = ((a.t ?? 0) * 0.35 + i * 0.5) % 1;
        const z = s(1.8) + u * s(1.4);
        ctx.globalAlpha = Math.sin(Math.PI * u) * 0.95;
        ctx.save();
        ctx.translate(top[0] + s(2) + u * s(4), top[1] - u * s(7));
        if (a.flip) ctx.scale(-1, 1);
        ctx.beginPath();
        ctx.moveTo(-z * 0.5, -z * 0.5);
        ctx.lineTo(z * 0.5, -z * 0.5);
        ctx.lineTo(-z * 0.5, z * 0.5);
        ctx.lineTo(z * 0.5, z * 0.5);
        ctx.strokeStyle = '#fff6dc';
        ctx.lineWidth = 1.1;
        ctx.stroke();
        ctx.strokeStyle = SB.zed;
        ctx.lineWidth = 0.55;
        ctx.stroke();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }
  },
};

export const STRAWHOG = dressedBunny(look);
STRAWHOG.art.noHop = true;
