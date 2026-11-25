// Tuskar's Hound (2026-11-25, the Warg remade on the wolf base, the player's pick "B" of three): one
// of the boar chief's scrappy den hounds, called into his den in Rootwood Hollow. A charcoal-blue wolf
// pup: a red polka-dot bandana knotted round its neck, a studded leather collar with a carved
// boar-tusk charm (Tuskar's mark), a stitched notch in one ear, a little scar on its cheek, darker
// saddle markings, a white blaze down its muzzle and chest, white socks, a cheeky fang, gold eyes
// under a cocky lid. It moves on its own copy of the wolf base (wolfbase.js: its bones, gaits, springs
// and moves: bite, pounce, claw), dressed here.
//   idle    a 30 s act (see its pose below): tough-pup posturing (head low, ears back, a little snarl over its fang and a
//           "grr" or two, then chin up, proud, tail going); a howl, sat back on its haunches, a
//           small "awoo" rising; a leaf drifts down in front of it, it watches it fall, bats at it,
//           and the leaf tumbles away.
// Everything drawn here from scratch (the face too).
import { dressedWolf } from './wolfbase.js';

const TAU = Math.PI * 2;
const lerp = (a, b, u) => a + (b - a) * u;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ell = (ctx, x, y, rx, ry, r = 0) => {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, r, 0, TAU);
};
const fillOr = (ctx, a, K, mode, c) => {
  if (mode === 'line') K.edge(ctx);
  else {
    ctx.fillStyle = K.colour(a, c);
    ctx.fill();
  }
};
// A closed smooth loop through the points (midpoint quadratics).
const smooth = (ctx, pts) => {
  ctx.beginPath();
  const n = pts.length;
  for (let i = 0; i <= n; i++) {
    const p = pts[i % n];
    const q = pts[(i + 1) % n];
    const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    if (i === 0) ctx.moveTo(...m);
    else ctx.quadraticCurveTo(p[0], p[1], m[0], m[1]);
  }
  ctx.closePath();
};

const COL = {
  lt: '#c8cce8', base: '#6c7098', sh: '#4e5278', deep: '#383a5c', nose: '#221a2a', guide: '#6c7098',
  blaze: '#e8ecfa', saddle: '#4e5278', red: '#e8504a', redSh: '#c83a36', leather: '#6a3a24', gold: '#ffd36a', tusk: '#fff4dc', tuskSh: '#e8d8b8',
  eye: { ring: '#5a3a08', iris: '#ffc83a', dk: '#c88a14', lt: '#fff0a0' }, ink: '#2a1c24',
};
const faceOf = (a) => a.wargFace ?? a.face;

// Its eye, side on (the head's frame, game px): a rounded almond, the iris in three tones with a
// lighter foot, a big pupil, two glints; a heavy upper lid line flicking back, set low and cocky
// (lower still when cross); a fine lower lid; a paler brow mark over it. Blinks; squeezes shut when
// hurt; a happy arc when pleased.
function eye(ctx, a, K, x, y, rx, ry) {
  const cl = (c) => K.colour(a, c);
  const f = faceOf(a);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // (the brow mark, always)
  ctx.fillStyle = K.tint(a, COL.lt, 0.85);
  ell(ctx, x - rx * 0.1, y - ry * 1.85 + (f === 'angry' ? ry * 0.25 : 0), rx * 0.78, ry * 0.32, f === 'angry' ? 0.2 : -0.25);
  ctx.fill();
  const blink = ((a.t + (a.mo?.uid ?? 0) * 0.37) % 3.9) < 0.12;
  if (f === 'dizzy') {
    // a swirl, turning
    ctx.strokeStyle = cl(COL.ink);
    ctx.lineWidth = 0.55;
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const q = (i / 24) * Math.PI * 3.6 + a.t * 6;
      const r = (i / 24) * rx * 1.05;
      ctx.lineTo(x + Math.cos(q) * r, y + Math.sin(q) * r * (ry / rx));
    }
    ctx.stroke();
    return;
  }
  if (f === 'dead' || f === 'hurt' || f === 'squint') {
    ctx.strokeStyle = cl(COL.ink);
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(x - rx, y - ry * 0.7);
    ctx.lineTo(x + rx * 0.7, y);
    ctx.lineTo(x - rx, y + ry * 0.7);
    ctx.stroke();
    return;
  }
  if (f === 'happy') {
    ctx.strokeStyle = cl(COL.ink);
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(x - rx * 1.1, y + ry * 0.3);
    ctx.quadraticCurveTo(x, y - ry * 0.9, x + rx * 1.1, y + ry * 0.2);
    ctx.stroke();
    return;
  }
  if (blink || f === 'sleep') {
    ctx.strokeStyle = cl(COL.ink);
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(x - rx * 1.1, y + ry * 0.1);
    ctx.quadraticCurveTo(x, y + ry * 0.7, x + rx * 1.15, y);
    ctx.stroke();
    return;
  }
  const k = COL.eye;
  ell(ctx, x, y, rx * 1.12, ry * 1.04);
  ctx.fillStyle = cl('#fffaf4');
  ctx.fill();
  ell(ctx, x + rx * 0.12, y + ry * 0.08, rx * 0.86, ry * 0.9);
  ctx.fillStyle = cl(k.ring);
  ctx.fill();
  ell(ctx, x + rx * 0.12, y + ry * 0.14, rx * 0.72, ry * 0.76);
  ctx.fillStyle = cl(k.iris);
  ctx.fill();
  ell(ctx, x + rx * 0.12, y - ry * 0.32, rx * 0.66, ry * 0.36);
  ctx.fillStyle = cl(k.dk);
  ctx.fill();
  ell(ctx, x + rx * 0.12, y + ry * 0.52, rx * 0.48, ry * 0.24);
  ctx.fillStyle = cl(k.lt);
  ctx.fill();
  ell(ctx, x + rx * 0.2, y + ry * 0.1, rx * 0.36, ry * 0.46);
  ctx.fillStyle = cl('#140c12');
  ctx.fill();
  ell(ctx, x - rx * 0.22, y - ry * 0.34, rx * 0.34, ry * 0.26);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ell(ctx, x + rx * 0.48, y + ry * 0.48, rx * 0.15, ry * 0.12);
  ctx.fill();
  const lid = f === 'angry' ? 0.48 : f === 'proud' ? 0.36 : 0.26;
  const top = y - ry + ry * 2 * lid;
  const slant = f === 'angry' ? ry * 0.4 : 0;
  ctx.fillStyle = cl(COL.base);
  ctx.beginPath();
  ctx.moveTo(x - rx * 1.5, y - ry * 1.6);
  ctx.lineTo(x + rx * 1.5, y - ry * 1.6);
  ctx.lineTo(x + rx * 1.3, top + slant);
  ctx.quadraticCurveTo(x, top - ry * 0.3, x - rx * 1.25, top + ry * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = cl(COL.ink);
  ctx.lineWidth = 0.75;
  ctx.beginPath();
  ctx.moveTo(x - rx * 1.2, top + ry * 0.35);
  ctx.quadraticCurveTo(x, top - ry * 0.3, x + rx * 1.15, top + slant);
  ctx.stroke();
  ctx.lineWidth = 0.55;
  ctx.beginPath();
  ctx.moveTo(x - rx * 1.05, top + ry * 0.35);
  ctx.quadraticCurveTo(x - rx * 1.5, top + ry * 0.1, x - rx * 1.75, top - ry * 0.2);
  ctx.stroke();
  ctx.lineWidth = 0.35;
  ctx.strokeStyle = cl(COL.sh);
  ctx.beginPath();
  ctx.moveTo(x - rx * 0.7, y + ry * 1.05);
  ctx.quadraticCurveTo(x, y + ry * 1.25, x + rx * 0.8, y + ry * 0.95);
  ctx.stroke();
}
// The white blaze over the muzzle and chin (the head's frame, clipped to the skull).
function blaze(ctx, a, K) {
  const sn = K.P.head.snout;
  ctx.save();
  K.shapePath(ctx, K.headShapes(a.bk, 'skull'));
  ctx.clip('nonzero');
  ctx.fillStyle = K.colour(a, COL.blaze);
  const x0 = K.sc(sn.at[0] - 1);
  const y0 = K.sc(sn.at[1] + sn.h * 0.05);
  ctx.beginPath();
  ctx.moveTo(x0 - K.sc(4), y0 + K.sc(4));
  ctx.quadraticCurveTo(x0, y0 - K.sc(1.2), x0 + K.sc(sn.len * 0.6), y0 - K.sc(0.6));
  ctx.lineTo(x0 + K.sc(sn.len + 3), y0 + K.sc(0.4));
  ctx.lineTo(x0 + K.sc(sn.len + 3), y0 + K.sc(9));
  ctx.lineTo(x0 - K.sc(6), y0 + K.sc(9));
  ctx.closePath();
  ctx.fill();
  // a darker cap over the crown, like a wolf's mask
  ctx.fillStyle = K.tint(a, COL.sh, 0.7);
  ell(ctx, -K.sc(2.6), -K.sc(6.4), K.sc(7.4), K.sc(3.6), -0.15);
  ctx.fill();
  ctx.restore();
}
function fang(ctx, a, K, x, y, s) {
  ctx.fillStyle = K.colour(a, '#ffffff');
  ctx.beginPath();
  ctx.moveTo(x - s * 0.5, y);
  ctx.lineTo(x + s * 0.5, y);
  ctx.quadraticCurveTo(x + s * 0.2, y + s * 0.9, x, y + s * 1.3);
  ctx.quadraticCurveTo(x - s * 0.2, y + s * 0.9, x - s * 0.5, y);
  ctx.fill();
}
// A white sock over a paw (the leg's own paw shape, a little smaller), the far ones in shade.
function sock(ctx, a, K, k) {
  const Lg = a.bk.legs[k];
  const far = k.endsWith('F');
  const pw = K.sc(K.P.paw.w);
  const ph = K.sc(K.P.paw.h);
  const c = [Lg.P[0] + Math.cos(Lg.rot) * pw * 0.16 - Math.sin(Lg.rot) * ph * 0.08, Lg.P[1] + Math.sin(Lg.rot) * pw * 0.16 + Math.cos(Lg.rot) * ph * 0.08];
  ctx.fillStyle = K.colour(a, far ? '#b8bcd8' : COL.blaze);
  ell(ctx, c[0], c[1] - ph * 0.08, pw * 0.44, ph * 0.42, Lg.rot);
  ctx.fill();
}

const HOUND = {
  // (it walks the wolf base's own walk, at its own pace: the player, after a faster trot, "looks
  // super bad, look at the wolf base"; data/mobs.js gives it a steady walking speed to match)
  P: { scale: 0.9, tail: { tip: 0.22 } },
  C: { lt: COL.lt, base: COL.base, sh: COL.sh, deep: COL.deep, nose: COL.nose, guide: COL.base },
  face: (ctx, a, sk, K) => {
    blaze(ctx, a, K);
    const [x, y, rx, ry] = [K.sc(3.2), -K.sc(1.9), K.sc(2.6), K.sc(3.2)];
    eye(ctx, a, K, x, y, rx, ry);
    // the fang over its lip, longer in a snarl
    const f = faceOf(a);
    if (f !== 'hurt' && f !== 'dead') fang(ctx, a, K, K.sc(9.4), K.sc(4.6), K.sc(f === 'angry' ? 1.7 : 1.3));
    // the little scar on its cheek, a soft blush
    ctx.strokeStyle = K.colour(a, '#a8acd0');
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    ctx.moveTo(-K.sc(1.4), K.sc(2));
    ctx.lineTo(K.sc(0.6), K.sc(3.6));
    ctx.stroke();
    ctx.fillStyle = K.tint(a, '#ff8fa6', f === 'proud' || f === 'happy' ? 0.55 : 0.3);
    ell(ctx, x + K.sc(0.6), y + K.sc(4.6), K.sc(1.8), K.sc(0.8));
    ctx.fill();
  },
  over: {
    body: (ctx, a, mode, K) => {
      if (mode !== 'fill') return;
      const sk = a.bk;
      ctx.save();
      K.bodyPath(ctx, a);
      ctx.clip();
      // the white chest; the darker saddle over its back, its edge broken like fur
      ctx.fillStyle = K.colour(a, COL.blaze);
      smooth(ctx, [sk.spinePt([16, -2]), sk.spinePt([18, 6]), sk.spinePt([8, 10]), sk.spinePt([4, 6]), sk.spinePt([10, 0])]);
      ctx.fill();
      ctx.fillStyle = K.colour(a, COL.saddle);
      smooth(ctx, [sk.spinePt([-16, -10]), sk.spinePt([-6, -12]), sk.spinePt([4, -11]), sk.spinePt([3, -6]), sk.spinePt([0, -4.6]), sk.spinePt([-3, -6]), sk.spinePt([-7, -4]), sk.spinePt([-11, -5.6]), sk.spinePt([-17, -6])]);
      ctx.fill();
      // a light along its back
      ctx.fillStyle = K.tint(a, COL.lt, 0.35);
      smooth(ctx, [sk.spinePt([-12, -9]), sk.spinePt([-2, -10.4]), sk.spinePt([2, -9]), sk.spinePt([-10, -7.6])]);
      ctx.fill();
      ctx.restore();
    },
    foreF: (ctx, a, mode, K) => mode === 'fill' && sock(ctx, a, K, 'foreF'),
    hindF: (ctx, a, mode, K) => mode === 'fill' && sock(ctx, a, K, 'hindF'),
    foreN: (ctx, a, mode, K) => mode === 'fill' && sock(ctx, a, K, 'foreN'),
    hindN: (ctx, a, mode, K) => mode === 'fill' && sock(ctx, a, K, 'hindN'),
    // the bandana, the collar and its tusk charm, round the neck
    neck: (ctx, a, mode, K) => {
      const sk = a.bk;
      const ang = Math.atan2(sk.hp[1] - sk.nb[1], sk.hp[0] - sk.nb[0]);
      const c = [lerp(sk.nb[0], sk.hp[0], 0.3), lerp(sk.nb[1], sk.hp[1], 0.3)];
      const w = K.sc(K.P.neck.w * 0.6);
      const u = [Math.cos(ang), Math.sin(ang)];
      const n = [-u[1], u[0]];
      const at = (along, across) => [c[0] + u[0] * along + n[0] * across, c[1] + u[1] * along + n[1] * across];
      // (the bandana's point swings a little as it moves)
      const sw = Math.sin(a.t * 3 + 1) * 0.3 * (1 + (a.walkW ?? 0) * 2);
      smooth(ctx, [at(K.sc(1.6), -w * 1.1), at(K.sc(1.8), w * 1.1), at(K.sc(-0.4 + sw), w * 2.2), at(-K.sc(4.6) + K.sc(sw), w * 1.4), at(-K.sc(1.2), w * 0.2)]);
      fillOr(ctx, a, K, mode, COL.red);
      ctx.save();
      ctx.translate(...at(0, 0));
      ctx.rotate(ang);
      ctx.beginPath();
      ctx.roundRect(-K.sc(1.4), -w * 1.15, K.sc(3), w * 2.3, K.sc(1.4));
      ctx.restore();
      fillOr(ctx, a, K, mode, COL.red);
      if (mode === 'fill') {
        ctx.fillStyle = K.colour(a, COL.redSh);
        smooth(ctx, [at(-K.sc(0.2), w * 1.1), at(-K.sc(1.4) + K.sc(sw), w * 2), at(-K.sc(3.6) + K.sc(sw), w * 1.4), at(-K.sc(1.2), w * 0.8)]);
        ctx.fill();
        ctx.fillStyle = K.colour(a, '#ffffff');
        for (const [al, ac] of [[0.6, -0.6], [0.2, 0.3], [-0.8, 1.2], [-2.6, 1.3], [-0.6, 1.9], [0.8, 0.9]]) {
          ell(ctx, ...at(K.sc(al), w * ac), K.sc(0.42), K.sc(0.42));
          ctx.fill();
        }
        // the knot, at the back of the neck
        ctx.fillStyle = K.colour(a, COL.redSh);
        ell(ctx, ...at(K.sc(0.2), -w * 1.05), K.sc(1), K.sc(0.8));
        ctx.fill();
        // the collar above it: leather, gold studs
        ctx.save();
        ctx.translate(...at(K.sc(2.4), 0));
        ctx.rotate(ang);
        ctx.fillStyle = K.colour(a, COL.leather);
        ctx.beginPath();
        ctx.roundRect(-K.sc(0.7), -w * 1.1, K.sc(1.4), w * 2.2, K.sc(0.6));
        ctx.fill();
        ctx.fillStyle = K.colour(a, COL.gold);
        for (const v of [-0.65, 0, 0.65]) {
          ell(ctx, 0, w * v, K.sc(0.4), K.sc(0.4));
          ctx.fill();
        }
        ctx.restore();
      }
      // the boar-tusk charm hanging from the collar at the front, swinging
      const t0 = at(K.sc(2.4), w * 1.05);
      const s2 = Math.sin(a.t * 2.4) * 0.15 + (a.wargCharm ?? 0);
      ctx.save();
      ctx.translate(...t0);
      ctx.rotate(s2);
      smooth(ctx, [[0, 0], [K.sc(1.4), K.sc(1.8)], [K.sc(0.6), K.sc(3.8)], [-K.sc(0.3), K.sc(1.6)]]);
      fillOr(ctx, a, K, mode, COL.tusk);
      if (mode === 'fill') {
        ctx.strokeStyle = K.colour(a, COL.tuskSh);
        ctx.lineWidth = 0.3;
        ctx.beginPath();
        ctx.moveTo(K.sc(0.1), K.sc(1.2));
        ctx.lineTo(K.sc(0.8), K.sc(1.6));
        ctx.moveTo(K.sc(0.2), K.sc(2.2));
        ctx.lineTo(K.sc(0.8), K.sc(2.6));
        ctx.stroke();
      }
      ctx.restore();
    },
    earN: (ctx, a, mode, K) => {
      if (mode !== 'fill') return;
      const pts = K.earFrame(ctx, a, 'near');
      const tip = pts[2];
      // the inner ear, and the stitched notch near the tip
      ctx.fillStyle = K.tint(a, '#ff9ab0', 0.45);
      smooth(ctx, [[pts[0][0] * 0.55, pts[0][1] - K.sc(0.6)], [tip[0] * 0.6, tip[1] * 0.62], [pts[4][0] * 0.55, pts[4][1] - K.sc(0.6)]]);
      ctx.fill();
      ctx.strokeStyle = K.colour(a, COL.lt);
      ctx.lineWidth = 0.35;
      ctx.beginPath();
      ctx.moveTo(tip[0] + K.sc(0.4), tip[1] + K.sc(2));
      ctx.lineTo(tip[0] + K.sc(1.6), tip[1] + K.sc(3.4));
      for (const k of [0.3, 0.7]) {
        const x = tip[0] + K.sc(0.4 + 1.2 * k);
        const y = tip[1] + K.sc(2 + 1.4 * k);
        ctx.moveTo(x - K.sc(0.5), y + K.sc(0.4));
        ctx.lineTo(x + K.sc(0.5), y - K.sc(0.4));
      }
      ctx.stroke();
    },
  },
  // Its own idle act, on top of the base's standing about (only while calm), a 30 s loop
  // (2026-11-25 polish, the player: "more expressive"):
  //   - tough-pup posturing: head low, ears back, a snarl, a forepaw scraping the ground; then chin
  //     up, proud, tail going;
  //   - chasing its own tail: round and round (turning back and forth, little hops, dust), then a
  //     dizzy sit-down, head wobbling;
  //   - a howl, sat back on its haunches, a small "awoo" rising;
  //   - nose down on a scent, snuffling left and right... a sneeze that jolts it;
  //   - a leaf drifts down, it watches it fall, bats at it, then a playful bow and bounces.
  pose: (m, a, out, K, mv) => {
    a.wargFace = null;
    a.wargHowl = 0;
    a.wargLeaf = -1;
    a.wargGrr = 0;
    a.wargCharm = 0;
    a.wargDizzy = 0;
    a.wargChase = 0;
    a.wargSneeze = -1;
    a.wargSniff = 0;
    if (mv || m.hp <= 0) return;
    const calm = a.calm ?? 1;
    if (calm < 0.02) return;
    const lu = (a.t + (m.uid % 5) * 3.1) % 30;
    const go = (pose, w) => {
      if (w > 0.001) for (const [k, v] of Object.entries(pose)) out[k] = (out[k] ?? 0) + (v - (out[k] ?? 0)) * w;
    };
    const hold = K.hold;
    // tough-pup posturing, a paw scraping the ground; then chin up, proud, tail going
    const tough = hold(lu, 0.8, 1.3, 2.9, 3.3) * calm;
    const scrape = Math.max(0, Math.sin((lu - 1.3) * 7)) * hold(lu, 1.3, 1.5, 2.6, 2.9);
    const proud = hold(lu, 3.2, 3.6, 4.8, 5.4) * calm;
    go({ crouch: 0.35, pitch: 6, neck: 16, head: 12, ears: -0.8, jaw: 0.25, tailUp: 18, wag: 0, spine: 4, fpX: -0.3 * scrape, fpY: 0.25 * scrape }, tough);
    go({ crouch: 0, pitch: -8, neck: -20, head: -12, ears: 0.7, jaw: 0.05, tailUp: 30, wag: 0.8, lift: 0.02 }, proud);
    a.wargGrr = tough;
    a.wargCharm = proud * Math.sin(a.t * 9) * 0.3;
    // chasing its tail: round and round, then a dizzy sit
    const chase = hold(lu, 6.4, 6.6, 8.6, 8.8) * calm;
    const dizzy = hold(lu, 8.7, 9, 10.6, 11.2) * calm;
    const cp = (lu - 6.6) / 0.32;
    if (chase > 0.5 && cp >= 0 && Math.floor(cp) % 2 === 1) a.flip = !a.flip;
    go({ crouch: 0.25, pitch: 4, neck: 18, head: 22, ears: 0.9, jaw: 0.4, tailUp: 30, wag: 1, hop: 0.05 * Math.abs(Math.sin(cp * Math.PI)) }, chase);
    const wob = Math.sin(a.t * 5);
    go({ sit: 1, neck: -4 + wob * 8, head: 6 + Math.sin(a.t * 5 - 0.9) * 10, ears: -0.2 + wob * 0.6, tailUp: -6, wag: 0.2, jaw: 0.2 }, dizzy);
    a.wargChase = chase;
    a.wargDizzy = dizzy;
    // the howl (the base's own), sat back on its haunches
    const how = hold(lu, 12.4, 12.8, 15, 15.6) * calm;
    if (how > 0.001) {
      const h = K.poseAt(K.moves.howl, clamp(lu - 12.8, 0, 1.05), 1, out);
      go(h, how);
    }
    a.wargHowl = how > 0.5 && lu > 13 && lu < 15 ? (lu - 13) / 2 : 0;
    // a scent: nose down, snuffling one way then the other... a sneeze
    const sniff = hold(lu, 17, 17.5, 19.8, 20) * calm;
    const snuf = Math.sin(a.t * 18) * 0.5 + 0.5;
    const wander = Math.sin((lu - 17.5) * 2.2);
    go({ pitch: 10, crouch: 0.2, neck: 26 + snuf * 3, head: 16, ears: 0.6, tailUp: 22, wag: 0.4, x: wander * 0.04 }, sniff);
    const pre = hold(lu, 19.6, 19.9, 20.05, 20.1) * calm;
    const sneeze = hold(lu, 20.05, 20.12, 20.3, 20.8) * calm;
    go({ neck: -18, head: -16, jaw: 0.4, ears: 0.8, pitch: -6 }, pre);
    go({ neck: 22, head: 18, jaw: 0, ears: -1, pitch: 8, hop: 0.06, x: -0.03, tailUp: 30 }, sneeze);
    a.wargSniff = sniff;
    a.wargSneeze = lu >= 20.05 && lu < 21 ? (lu - 20.05) / 0.95 : -1;
    // the leaf: watching it fall, a bat at it with a forepaw; then a playful bow and bounces
    const watch = hold(lu, 22.6, 23, 24.6, 25) * calm;
    const bat = hold(lu, 24.6, 24.72, 24.9, 25.2) * calm;
    const play = hold(lu, 25.1, 25.3, 26.4, 26.6) * calm;
    const fall = clamp((lu - 22.6) / 2.1, 0, 1);
    go({ neck: -14 + fall * 30, head: -6 + fall * 18, ears: 0.9, tailUp: 20, wag: 0.25, crouch: 0.1 }, watch);
    go({ fpX: 0.75, fpY: 0.35, pitch: -6, neck: 4, head: 4 }, bat);
    if (play > 0.001) go(K.poseAt(K.moves.wag, clamp(lu - 25.3, 0, 1.05), 1, out), play);
    a.wargLeaf = lu >= 22.4 && lu < 26.6 ? lu - 22.4 : -1;
    a.wargFace = tough > 0.4 ? 'angry' : proud > 0.4 ? 'proud' : chase > 0.4 ? 'happy' : dizzy > 0.4 ? 'dizzy' : sneeze > 0.3 ? 'squint' : pre > 0.4 ? 'squint'
      : sniff > 0.4 ? null : play > 0.4 ? 'happy' : how > 0.5 ? 'happy' : null;
  },
  // Its extras: "grr" marks as it snarls, a small "awoo" rising from its howl, the falling leaf.
  fx: (ctx, m, a, S, K) => {
    if (m.hp <= 0 || !a.bk) return;
    const sk = a.bk;
    const Hd = K.P.head;
    const tip = [sk.hp[0] + Math.cos(sk.ha) * K.sc(Hd.snout.at[0] + Hd.snout.len), sk.hp[1] + Math.sin(sk.ha) * K.sc(Hd.snout.at[0] + Hd.snout.len)];
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // grr: little zigzags popping off its muzzle
    if ((a.wargGrr ?? 0) > 0.3) {
      for (let i = 0; i < 2; i++) {
        const u = (a.t * 1.6 + i * 0.5) % 1;
        const x = tip[0] + K.sc(2 + u * 5);
        const y = tip[1] - K.sc(4 + u * 4 + i * 2);
        ctx.globalAlpha = a.wargGrr * Math.sin(Math.PI * u);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.6;
        const z = () => {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + K.sc(1.6), y - K.sc(1.6));
          ctx.lineTo(x + K.sc(3.2), y);
          ctx.lineTo(x + K.sc(4.8), y - K.sc(1.6));
          ctx.stroke();
        };
        z();
        ctx.strokeStyle = '#e8504a';
        ctx.lineWidth = 0.7;
        z();
      }
    }
    // awoo: soft curved lines rising from its muzzle, one after another
    if ((a.wargHowl ?? 0) > 0) {
      for (let i = 0; i < 3; i++) {
        const u = (a.t * 0.9 + i / 3) % 1;
        const r = K.sc(2 + u * 9);
        ctx.globalAlpha = 0.8 * Math.sin(Math.PI * u);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(tip[0], tip[1] - K.sc(1), r, -Math.PI * 0.62, -Math.PI * 0.2);
        ctx.stroke();
        ctx.strokeStyle = '#c8cce8';
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }
    }
    // dizzy: little stars circling its head
    if ((a.wargDizzy ?? 0) > 0.1) {
      for (let i = 0; i < 3; i++) {
        const an = a.t * 5 + (i / 3) * TAU;
        const x = sk.hp[0] + Math.cos(an) * K.sc(8);
        const y = sk.hp[1] - K.sc(11) + Math.sin(an) * K.sc(2.4);
        ctx.globalAlpha = a.wargDizzy * (0.6 + 0.4 * Math.sin(an));
        ctx.fillStyle = i === 1 ? '#ff9ab0' : '#ffe27a';
        ctx.beginPath();
        for (let k = 0; k < 10; k++) {
          const r = k % 2 ? K.sc(0.7) : K.sc(1.7);
          const q = an + (k / 10) * TAU;
          ctx.lineTo(x + Math.cos(q) * r, y + Math.sin(q) * r);
        }
        ctx.fill();
      }
    }
    // the tail chase: dust kicked up round its feet
    if ((a.wargChase ?? 0) > 0.3) {
      const paw = sk.legs.foreN.P;
      for (let i = 0; i < 4; i++) {
        const u = (a.t * 2.6 + i / 4) % 1;
        ctx.globalAlpha = a.wargChase * 0.55 * (1 - u);
        ctx.fillStyle = '#e8dcc8';
        ell(ctx, paw[0] - K.sc(14) + (i - 1.5) * K.sc(8) + Math.sin(i * 3) * K.sc(3), paw[1] - u * K.sc(6), K.sc(2 + u * 2.4), K.sc(1.4 + u * 1.6));
        ctx.fill();
      }
    }
    // sniffing: tiny puffs at its nose
    if ((a.wargSniff ?? 0) > 0.3) {
      for (let i = 0; i < 2; i++) {
        const u = (a.t * 3 + i / 2) % 1;
        ctx.globalAlpha = a.wargSniff * 0.7 * Math.sin(Math.PI * u);
        ctx.fillStyle = '#ffffff';
        ell(ctx, tip[0] + K.sc(2 + u * 3), tip[1] + K.sc(1 - u * 2) + (i - 0.5) * K.sc(2), K.sc(0.9 + u), K.sc(0.7 + u * 0.7));
        ctx.fill();
      }
    }
    // the sneeze: a burst of puffs and sparkles off its nose
    const sz = a.wargSneeze ?? -1;
    if (sz >= 0) {
      for (let i = 0; i < 5; i++) {
        const an = -0.7 + (i / 4) * 1.4;
        const d = K.sc(3 + sz * 12);
        ctx.globalAlpha = (1 - sz) * 0.85;
        ctx.fillStyle = '#ffffff';
        ell(ctx, tip[0] + Math.cos(an) * d, tip[1] + Math.sin(an) * d, K.sc(1.4 + sz * 2), K.sc(1.2 + sz * 1.6));
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    // the leaf: drifting down in front of it, swaying; batted, it tumbles away
    const lf = a.wargLeaf ?? -1;
    if (lf >= 0) {
      const paw = sk.legs.foreN.P;
      const tx = paw[0] + K.sc(10);
      let x;
      let y;
      let r;
      let al = Math.min(1, lf * 3);
      if (lf < 2.3) {
        const u = lf / 2.3;
        x = tx + Math.sin(u * 7) * K.sc(4);
        y = -K.H * 0.95 + u * K.H * 0.72;
        r = Math.sin(u * 7) * 0.8;
      } else {
        const u = clamp((lf - 2.3) / 1.4, 0, 1);
        x = tx + K.sc(4) + u * K.sc(26);
        y = -K.H * 0.25 - Math.sin(u * Math.PI) * K.H * 0.4 + u * K.H * 0.2;
        r = u * 9;
        al = 1 - u;
      }
      ctx.globalAlpha = al;
      ctx.translate(x, y);
      ctx.rotate(r);
      ctx.fillStyle = '#3a2430';
      ctx.scale(1.9, 1.9);
      smooth(ctx, [[-K.sc(2.4), 0], [-K.sc(0.6), -K.sc(1.5)], [K.sc(2.4), -K.sc(0.2)], [K.sc(0.6), K.sc(1.4)]]);
      ctx.fill();
      ctx.fillStyle = '#ffa24a';
      smooth(ctx, [[-K.sc(2), 0], [-K.sc(0.5), -K.sc(1.05)], [K.sc(2), -K.sc(0.15)], [K.sc(0.5), K.sc(1)]]);
      ctx.fill();
      ctx.fillStyle = '#ffc47a';
      smooth(ctx, [[-K.sc(1.4), -K.sc(0.2)], [-K.sc(0.2), -K.sc(0.85)], [K.sc(1.2), -K.sc(0.35)]]);
      ctx.fill();
      ctx.strokeStyle = '#d8701e';
      ctx.lineWidth = 0.25;
      ctx.beginPath();
      ctx.moveTo(-K.sc(1.8), 0);
      ctx.lineTo(K.sc(1.8), -K.sc(0.1));
      ctx.moveTo(-K.sc(0.4), -K.sc(0.05));
      ctx.lineTo(K.sc(0.3), -K.sc(0.7));
      ctx.moveTo(K.sc(0.4), -K.sc(0.08));
      ctx.lineTo(K.sc(1), K.sc(0.5));
      ctx.stroke();
    }
    ctx.restore();
  },
};

export const WARG = dressedWolf(HOUND);
WARG.art.noHop = true;
