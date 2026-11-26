// The Sakura Bud Kit (2026-11-25, the Blossom Kit remade on the fox base, the player's pick "A" of
// three): Petal Meadow's starter monster, a pale petal-pink fox kit that just loves a game of chase.
// Big head, round little body, short chubby legs (the kit build, look.kit), cream muzzle, chest and
// socks; its tail ends in a cherry-blossom bud of five petals closed round the white tip, which blooms
// open when it is thrilled, pounces or bites, and folds shut again; two little petals tucked in its
// ears as tufts; big chestnut puppy eyes with a soft pink lower lid. It moves on its own copy of the
// fox base (foxbase.js: its bones, gaits, springs and moves: bite, pounce, claw), dressed here.
//   idle  a 30 s act (see its pose below):
//         - a petal drifts down; it watches it, wiggles its rump, pounces, lands, peeks under its
//           paws... the petal slips out and floats off;
//         - it curls round to sniff its own tail bud... a sneeze, and the bud bursts open in a puff
//           of petals, then slowly folds shut;
//         - a sound: ears up, a head tilt one way, then the other;
//         - zoomies: little hops, spinning round and back, the bud bobbing open;
//         - it sits, eyes drooping, nods off... a jolt awake.
// Everything drawn here from scratch (the face too).
import { dressedFox } from './foxbase.js';

const TAU = Math.PI * 2;
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
// A cherry petal pointing up from (0,0): a soft rounded teardrop with the little notch at its tip.
function petalPath(ctx, len, w) {
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-w * 0.9, -len * 0.25, -w * 0.75, -len * 0.95, -w * 0.18, -len);
  ctx.quadraticCurveTo(0, -len * 0.86, w * 0.18, -len);
  ctx.bezierCurveTo(w * 0.75, -len * 0.95, w * 0.9, -len * 0.25, 0, 0);
  ctx.closePath();
}
const PETAL = { a: '#ff9cb8', b: '#ffb6c8', vein: '#e86a8e', heart: '#ff6a90' };
// The tail's blossom: five petals round the tip, `open` from 0 (a closed bud) to 1 (a full flower).
function blossom(ctx, a, K, mode, x, y, r, open, spin) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(spin);
  for (let i = 0; i < 5; i++) {
    ctx.save();
    const fan = (i / 5) * TAU;
    const shut = (i - 2) * 0.22;
    ctx.rotate(shut + (fan - shut) * open);
    petalPath(ctx, r * (0.95 + 0.1 * open), r * 0.62);
    fillOr(ctx, a, K, mode, i % 2 ? PETAL.b : PETAL.a);
    if (mode === 'fill') {
      ctx.strokeStyle = K.colour(a, PETAL.vein);
      ctx.lineWidth = 0.3;
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.1);
      ctx.lineTo(0, -r * 0.6);
      ctx.stroke();
    }
    ctx.restore();
  }
  if (mode === 'fill' && open > 0.4) {
    const k = (open - 0.4) / 0.6;
    ctx.fillStyle = K.tint(a, PETAL.heart, k);
    ell(ctx, 0, 0, r * 0.3, r * 0.3);
    ctx.fill();
    ctx.fillStyle = K.tint(a, '#ffe27a', k);
    for (let i = 0; i < 5; i++) {
      const q = (i / 5) * TAU + 0.3;
      ell(ctx, Math.cos(q) * r * 0.22, Math.sin(q) * r * 0.22, r * 0.07, r * 0.07);
      ctx.fill();
    }
  }
  ctx.restore();
}

// ---------- Its face (head frame) ----------
const EYE_AT = (K) => [K.sc(3.1), -K.sc(1.2)];
const faceOf = (a) => a.kitFace ?? null;
function shutEye(ctx, a, K, x, y, rx, ry, smile) {
  ctx.strokeStyle = K.colour(a, '#3a1a22');
  ctx.lineWidth = 0.7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (smile) {
    ctx.moveTo(x - rx, y + ry * 0.2);
    ctx.quadraticCurveTo(x, y - ry * 0.7, x + rx, y + ry * 0.2);
  } else {
    ctx.moveTo(x - rx, y);
    ctx.quadraticCurveTo(x, y + ry * 0.6, x + rx, y - ry * 0.1);
  }
  ctx.stroke();
}
// Big round puppy eyes, warm chestnut, a soft pink lower lid, three glints (a big one, a small one,
// a speck of pink), two upturned lashes at the outer corner. Wide and sparkly when thrilled; squeezed
// shut (> <) when hurt; a little focused squint before a pounce.
function eye(ctx, a, K, x, y) {
  const f = faceOf(a);
  const wide = f === 'wide' ? 1.12 : 1;
  const rx = K.sc(3.4) * wide;
  const ry = K.sc(4.1) * wide;
  const ink = '#3a1a22';
  ctx.lineCap = 'round';
  if (f === 'hurt' || f === 'dead') {
    ctx.strokeStyle = K.colour(a, ink);
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(x - rx * 0.9, y - ry * 0.55);
    ctx.lineTo(x + rx * 0.55, y);
    ctx.lineTo(x - rx * 0.9, y + ry * 0.55);
    ctx.stroke();
    return;
  }
  if (f === 'sleep') return shutEye(ctx, a, K, x, y, rx, ry, false);
  if (f === 'happy') return shutEye(ctx, a, K, x, y, rx, ry, true);
  if (((a.t + (a.mo?.uid ?? 0) * 0.41) % 4.3) < 0.12) return shutEye(ctx, a, K, x, y, rx, ry, false);
  ell(ctx, x, y, rx, ry);
  ctx.fillStyle = K.colour(a, '#fffaf6');
  ctx.fill();
  ell(ctx, x + rx * 0.1, y + ry * 0.08, rx * 0.86, ry * 0.88);
  ctx.fillStyle = K.colour(a, '#5a2a1c');
  ctx.fill();
  ell(ctx, x + rx * 0.1, y + ry * 0.3, rx * 0.7, ry * 0.58);
  ctx.fillStyle = K.colour(a, '#a8582e');
  ctx.fill();
  ell(ctx, x + rx * 0.1, y + ry * 0.55, rx * 0.5, ry * 0.26);
  ctx.fillStyle = K.colour(a, '#e8a060');
  ctx.fill();
  const pr = f === 'focus' ? 0.34 : 0.42;
  ell(ctx, x + rx * 0.14, y + ry * 0.05, rx * pr, ry * (pr + 0.02));
  ctx.fillStyle = K.colour(a, '#1e0c10');
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ell(ctx, x - rx * 0.28, y - ry * 0.36, rx * 0.36, ry * 0.3);
  ctx.fill();
  ell(ctx, x + rx * 0.42, y + ry * 0.42, rx * 0.16, ry * 0.13);
  ctx.fill();
  ctx.fillStyle = K.colour(a, '#ffb8cc');
  ell(ctx, x + rx * 0.5, y - ry * 0.2, rx * 0.1, ry * 0.09);
  ctx.fill();
  // the lid: lower for the focused squint before a pounce
  if (f === 'focus') {
    ctx.fillStyle = K.colour(a, K.C.base);
    ctx.beginPath();
    ctx.moveTo(x - rx * 1.3, y - ry * 1.3);
    ctx.lineTo(x + rx * 1.3, y - ry * 1.3);
    ctx.lineTo(x + rx * 1.2, y - ry * 0.3);
    ctx.quadraticCurveTo(x, y - ry * 0.6, x - rx * 1.2, y - ry * 0.25);
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = K.colour(a, ink);
  ctx.lineWidth = 0.75;
  ctx.beginPath();
  if (f === 'focus') {
    ctx.moveTo(x - rx * 1.15, y - ry * 0.25);
    ctx.quadraticCurveTo(x, y - ry * 0.6, x + rx * 1.15, y - ry * 0.3);
  } else ctx.arc(x, y, rx * 1.02, Math.PI * 1.08, Math.PI * 1.92);
  ctx.stroke();
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  const ly = f === 'focus' ? ry * 0.15 : 0;
  ctx.moveTo(x - rx * 0.92, y - ry * 0.42 + ly);
  ctx.quadraticCurveTo(x - rx * 1.35, y - ry * 0.62 + ly, x - rx * 1.55, y - ry * 0.95 + ly);
  ctx.moveTo(x - rx * 0.98, y - ry * 0.1 + ly);
  ctx.quadraticCurveTo(x - rx * 1.45, y - ry * 0.2 + ly, x - rx * 1.7, y - ry * 0.45 + ly);
  ctx.stroke();
  ctx.strokeStyle = K.colour(a, '#e88aa6');
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  ctx.arc(x, y + ry * 0.05, rx * 0.95, Math.PI * 0.18, Math.PI * 0.82);
  ctx.stroke();
}
// The pale muzzle and chin (clipped to the skull), the blush, a little open mouth when it yips,
// bites or sneezes, and a tiny tongue tip when happy.
function face(ctx, a, K) {
  const sn = K.P.head.snout;
  ctx.save();
  K.shapePath(ctx, K.headShapes(a.bk, 'skull'));
  ctx.clip('nonzero');
  ctx.fillStyle = K.colour(a, '#fff4f2');
  ctx.beginPath();
  const x0 = K.sc(sn.at[0] - 1.4);
  const y0 = K.sc(sn.at[1]);
  ctx.moveTo(x0 - K.sc(4.6), y0 + K.sc(5));
  ctx.quadraticCurveTo(x0 - K.sc(0.6), y0 - K.sc(1.6), x0 + K.sc(sn.len * 0.6), y0 - K.sc(0.8));
  ctx.lineTo(x0 + K.sc(sn.len + 4), y0 + K.sc(0.2));
  ctx.lineTo(x0 + K.sc(sn.len + 4), y0 + K.sc(10));
  ctx.lineTo(x0 - K.sc(7), y0 + K.sc(10));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  const [ex, ey] = EYE_AT(K);
  const f = faceOf(a);
  ctx.fillStyle = K.tint(a, '#ff8aa8', f === 'happy' || f === 'wide' ? 0.75 : 0.55);
  ell(ctx, ex + K.sc(1.6), ey + K.sc(5.4), K.sc(2.3), K.sc(0.95));
  ctx.fill();
  eye(ctx, a, K, ex, ey);
}

// ---------- Its dress ----------
const SAKURA = {
  kit: { bx: 0.8, by: 0.96, lx: 0.9, ls: 0.72, lw: 1.1 },
  ink: '#a8607a',
  P: {
    scale: 0.8,
    neck: { base: [9.4, -4.2], len: 6.4, w: 7, ang: -60 },
    head: { rx: 11.2, ry: 10.4, snout: { at: [1.8, 2.2], len: 8.4, h: 5.6 }, cheek: false },
    ears: { size: 1.22 },
    tail: { root: [-14.2, -5], tip: 0.22, bush: 4.6 },
  },
  C: { lt: '#fff4f2', base: '#f6c4cc', sh: '#e6a0b0', deep: '#c87e92', nose: '#6a2e3e', guide: '#f6c4cc' },
  face: (ctx, a, sk, K) => face(ctx, a, K),
  over: {
    tail: (ctx, a, mode, K) => {
      const T = a.bk.tail;
      const p = T[T.length - 1];
      const q = T[T.length - 2];
      const ang = Math.atan2(p[1] - q[1], p[0] - q[0]) + Math.PI / 2;
      blossom(ctx, a, K, mode, p[0], p[1], K.sc(5.4), a.kitBloom ?? 0.08, ang);
    },
    earN: (ctx, a, mode, K) => {
      K.earFrame(ctx, a, 'N');
      ctx.translate(K.sc(0.6), -K.sc(1.2));
      ctx.rotate(0.35);
      petalPath(ctx, K.sc(3), K.sc(1.9));
      fillOr(ctx, a, K, mode, '#ffd6e0');
    },
    body: (ctx, a, mode, K) => {
      if (mode !== 'fill') return;
      const sk = a.bk;
      ctx.save();
      K.bodyPath(ctx, a);
      ctx.clip();
      ctx.fillStyle = K.colour(a, '#fff4f2');
      ctx.beginPath();
      ctx.moveTo(...sk.spinePt([15, -4]));
      ctx.quadraticCurveTo(...sk.spinePt([19, 6]), ...sk.spinePt([7, 10]));
      ctx.lineTo(...sk.spinePt([-5, 10]));
      ctx.quadraticCurveTo(...sk.spinePt([4, 4]), ...sk.spinePt([15, -4]));
      ctx.fill();
      ctx.restore();
    },
  },
  // Its act (base channels: crouch, pitch, neck, head, ears, jaw, tailUp, wag, spine, fpX, fpY, sit,
  // hop, x, lift; the base's moves by poseAt). Its face and the bud's bloom are worked out here too.
  pose: (m, a, out, K, mv) => {
    const st = (a.mo.kit ??= { bloom: 0.08, v: 0 });
    const dt = clamp(a.dt ?? 1 / 60, 0, 0.1);
    a.kitFace = null;
    a.kitPetal = -1;
    a.kitSneeze = -1;
    a.kitZoom = 0;
    a.kitNod = 0;
    let bloomGoal = 0.08 + 0.04 * Math.sin(a.t * 1.7);
    const napping = m.habit?.kind === 'nap' && (a.now ?? 0) < m.habit.until;
    if (m.hp <= 0) a.kitFace = 'dead';
    else if (a.mood === 'hurt' || (a.hurtAgo ?? 9) < 0.35) a.kitFace = 'hurt';
    else if (napping) a.kitFace = 'sleep';
    else if (mv) {
      // pouncing or biting: the bud bursts open
      a.kitFace = 'focus';
      bloomGoal = 1;
    } else if (m.cine?.mood === 'happy' || a.mood === 'happy') {
      a.kitFace = 'happy';
      bloomGoal = 0.9;
    }
    // (its act only while it stands about: never while it walks)
    const calm = (a.calm ?? 1) * (1 - clamp(a.walkW ?? 0, 0, 1)) * (a.moving ? 0 : 1);
    // napping: curled up on the ground, head down on its paws, tail wrapped round, slow breaths
    if (napping && m.hp > 0 && !mv) {
      const br = Math.sin(a.t * 1.6);
      Object.assign(out, { lie: 1, neck: 6 + br * 1.2, head: 8, ears: -0.6, tailUp: -26, wag: 0, jaw: 0, pitch: 0, spine: -4 });
      bloomGoal = 0;
    }
    if (!mv && m.hp > 0 && !napping && calm > 0.02) {
      const lu = (a.t + (m.uid % 6) * 2.7) % 30;
      const go = (pose, w) => {
        if (w > 0.001) for (const [k, v] of Object.entries(pose)) out[k] = (out[k] ?? 0) + (v - (out[k] ?? 0)) * w;
      };
      const hold = K.hold;
      // 1. a petal drifts down: it watches, wiggles its rump, pounces, peeks under its paws... the
      //    petal slips out and floats off
      const watch = hold(lu, 0.6, 1.1, 2.6, 2.8) * calm;
      const wiggle = hold(lu, 2.6, 2.8, 3.4, 3.5) * calm;
      const leap = hold(lu, 3.45, 3.55, 3.85, 4.1) * calm;
      const peek = hold(lu, 4.1, 4.4, 5.4, 5.8) * calm;
      const fall = clamp((lu - 0.6) / 2.8, 0, 1);
      go({ neck: -16 + fall * 26, head: -10 + fall * 16, ears: 1, tailUp: 24, wag: 0.2 }, watch);
      go({ crouch: 0.55, pitch: 8, neck: 10, head: 6, ears: 1, tailUp: 30, wag: 0, x: Math.sin(a.t * 26) * 0.012, spine: 4 }, wiggle);
      go({ hop: 0.16, pitch: -10, crouch: 0, neck: -6, head: 4, fpX: 0.6, fpY: 0.3, tailUp: 34, x: 0.06 }, leap);
      go({ crouch: 0.4, pitch: 12, neck: 26, head: 20, ears: 0.6, fpX: 0.45, fpY: 0, tailUp: 18, x: 0.06, wag: 0.3 }, peek);
      a.kitPetal = lu >= 0.4 && lu < 7.4 ? lu - 0.4 : -1;
      if (wiggle > 0.4) a.kitFace = 'focus';
      if (leap > 0.4) {
        a.kitFace = 'wide';
        bloomGoal = 1;
      }
      if (peek > 0.4) a.kitFace = lu > 5 ? 'wide' : null;
      // 2. sniffing its own tail bud... a sneeze, the bud bursts open, then slowly folds shut
      const curl = hold(lu, 7.6, 8.2, 9.8, 10) * calm;
      const pre = hold(lu, 9.6, 9.85, 9.95, 10) * calm;
      const sneeze = hold(lu, 9.95, 10.02, 10.2, 10.7) * calm;
      go({ spine: -14, neck: 30, head: 34, ears: 0.6, tailUp: -10, wag: 0, pitch: 4, crouch: 0.2 }, curl);
      go({ neck: -10, head: -14, jaw: 0.35, ears: 0.8 }, pre);
      go({ neck: 18, head: 16, jaw: 0, ears: -0.8, hop: 0.05, x: -0.03, tailUp: 30 }, sneeze);
      a.kitSneeze = lu >= 9.95 && lu < 11 ? (lu - 9.95) / 1.05 : -1;
      if (curl > 0.4) a.kitFace = lu > 9 ? 'focus' : null;
      if (pre > 0.4 || sneeze > 0.4) a.kitFace = 'hurt';
      if (lu >= 9.95 && lu < 12.6) bloomGoal = lu < 11 ? 1 : 1 - (lu - 11) / 1.6;
      // 3. a sound: ears up, a head tilt one way, then the other
      const perk = hold(lu, 13.4, 13.7, 16.2, 16.6) * calm;
      const tilt = Math.sin((lu - 13.9) * 2.2);
      go({ neck: -14, head: -4 + tilt * 3, ears: 1, tailUp: 26, wag: 0, pitch: -4, x: 0 }, perk);
      if (perk > 0.4) a.kitFace = 'wide';
      a.kitTilt = perk * tilt;
      // 4. zoomies: little hops, spinning round and back, the bud bobbing open
      const zoom = hold(lu, 18, 18.3, 20.6, 20.9) * calm;
      const zp = (lu - 18.3) / 0.38;
      if (zoom > 0.5 && zp >= 0 && Math.floor(zp) % 2 === 1) a.flip = !a.flip;
      go({ hop: 0.08 * Math.abs(Math.sin(zp * Math.PI)), crouch: 0.15, pitch: 4, neck: 6, head: 6, ears: 0.9, tailUp: 34, wag: 1, jaw: 0.3 }, zoom);
      a.kitZoom = zoom;
      if (zoom > 0.4) {
        a.kitFace = 'happy';
        bloomGoal = 0.85;
      }
      // a happy little play bow after (the base's own)
      const bow = hold(lu, 20.9, 21.1, 22.1, 22.3) * calm;
      if (bow > 0.001) go(K.poseAt(K.moves.wag, clamp(lu - 21.1, 0, 1.05), 1, out), bow);
      if (bow > 0.4) a.kitFace = 'happy';
      // 5. sits; eyes droop, it nods off... a jolt awake
      const sit = hold(lu, 23.4, 24, 28.4, 28.9) * calm;
      const doze = hold(lu, 25, 25.6, 27.6, 27.7) * calm;
      const jolt = hold(lu, 27.7, 27.75, 28, 28.4) * calm;
      const nod = Math.sin(a.t * 1.3) * 0.5 + 0.5;
      go({ sit: 1, neck: -6, head: 2, ears: 0.4, tailUp: -4, wag: 0.15 }, sit);
      go({ neck: 8 + nod * 10, head: 12 + nod * 8, ears: -0.4, wag: 0 }, doze * sit);
      go({ neck: -16, head: -10, ears: 1, hop: 0.03 }, jolt);
      a.kitNod = doze;
      if (doze > 0.4) a.kitFace = 'sleep';
      if (jolt > 0.3) a.kitFace = 'wide';
    }
    // the bud's bloom eases toward its goal on a soft spring, with a little overshoot
    st.v += ((bloomGoal - st.bloom) * 90 - st.v * 11) * dt;
    st.bloom = clamp(st.bloom + st.v * dt, 0, 1.08);
    a.kitBloom = st.bloom;
  },
  // Its extras: the drifting petal of its pounce game, the sneeze's puff of petals and pollen,
  // petals spun off the bud on zoomies and in a fight, a nodding "z" drifting off.
  fx: (ctx, m, a, S, K) => {
    if (!a.bk) return;
    const sk = a.bk;
    const Hd = K.P.head;
    const tip = [sk.hp[0] + Math.cos(sk.ha) * K.sc(Hd.snout.at[0] + Hd.snout.len), sk.hp[1] + Math.sin(sk.ha) * K.sc(Hd.snout.at[0] + Hd.snout.len)];
    const T = sk.tail;
    const bud = T[T.length - 1];
    const petal = (x, y, r, s, al) => {
      if (al <= 0.01) return;
      ctx.save();
      ctx.globalAlpha = al;
      ctx.translate(x, y);
      ctx.rotate(r);
      petalPath(ctx, K.sc(3.8 * s), K.sc(2.5 * s));
      ctx.fillStyle = '#ffb6c8';
      ctx.fill();
      ctx.strokeStyle = '#ff8aa8';
      ctx.lineWidth = 0.3;
      ctx.stroke();
      ctx.restore();
    };
    ctx.save();
    // the pounce game's petal: drifting down in front of it, trapped under its paws, slipping out
    const pt = a.kitPetal ?? -1;
    if (pt >= 0 && m.hp > 0) {
      const paw = sk.legs.foreN.P;
      const tx = paw[0] + K.sc(11);
      if (pt < 3.2) {
        const u = pt / 3.2;
        petal(tx + Math.sin(u * 8) * K.sc(4), -K.H * 1.05 + u * K.H * 1.02, Math.sin(u * 8) * 0.9, 1, Math.min(1, pt * 3));
      } else if (pt < 5) {
        petal(tx - K.sc(1), -K.sc(0.6), 1.4, 1, 0.9);
      } else {
        const u = clamp((pt - 5) / 2, 0, 1);
        petal(tx + u * K.sc(28), -K.sc(1) - Math.sin(u * Math.PI) * K.H * 0.6, u * 7, 1, 1 - u);
      }
    }
    // the sneeze: a puff off its nose, then petals and yellow pollen bursting off the bud
    const sz = a.kitSneeze ?? -1;
    if (sz >= 0) {
      for (let i = 0; i < 4; i++) {
        const an = -0.7 + (i / 3) * 1.4;
        const d = K.sc(2 + sz * 9);
        ctx.globalAlpha = (1 - sz) * 0.8;
        ctx.fillStyle = '#ffffff';
        ell(ctx, tip[0] + Math.cos(an) * d, tip[1] + Math.sin(an) * d, K.sc(1.2 + sz * 1.6), K.sc(1 + sz * 1.2));
        ctx.fill();
      }
      for (let i = 0; i < 6; i++) {
        const an = -Math.PI / 2 + (i - 2.5) * 0.5;
        const d = K.sc(2 + sz * 13);
        petal(bud[0] + Math.cos(an) * d, bud[1] + Math.sin(an) * d + sz * sz * K.sc(8), an + sz * 4, 0.8, 1 - sz);
        ctx.globalAlpha = (1 - sz) * 0.9;
        ctx.fillStyle = '#ffe27a';
        ell(ctx, bud[0] + Math.cos(an + 0.25) * d * 0.7, bud[1] + Math.sin(an + 0.25) * d * 0.7, K.sc(0.5), K.sc(0.5));
        ctx.fill();
      }
    }
    // zoomies and fights: petals spun off the open bud, drifting down and fading
    const shed = Math.max(a.kitZoom ?? 0, a.blMove ? 1 : 0) * clamp(((a.kitBloom ?? 0) - 0.5) * 2, 0, 1);
    if (shed > 0.05 && m.hp > 0) {
      for (let i = 0; i < 3; i++) {
        const u = (a.t * 0.9 + i / 3) % 1;
        petal(bud[0] - K.sc(3 + u * 12) + Math.sin(u * 9 + i) * K.sc(2), bud[1] - K.sc(2) + u * K.sc(16), u * 6 + i, 0.75, shed * Math.sin(Math.PI * u));
      }
    }
    // nodding off: a little petal-pink "z"
    if ((a.kitNod ?? 0) > 0.4 && m.hp > 0) {
      const u = (a.t * 0.45) % 1;
      ctx.globalAlpha = a.kitNod * Math.sin(Math.PI * u);
      ctx.font = `800 ${K.sc(4 + u * 2.5)}px Nunito, "Trebuchet MS", sans-serif`;
      ctx.fillStyle = '#ff9cb8';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      const zx = sk.hp[0] + K.sc(6 + u * 5);
      const zy = sk.hp[1] - K.sc(12 + u * 9);
      ctx.save();
      ctx.translate(zx, zy);
      if (a.flip) ctx.scale(-1, 1);
      ctx.strokeText('z', 0, 0);
      ctx.fillText('z', 0, 0);
      ctx.restore();
    }
    ctx.restore();
  },
};

export const FOXKIT = dressedFox(SAKURA);
FOXKIT.art.noHop = true;
