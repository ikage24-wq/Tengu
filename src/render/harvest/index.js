// The Nest Weaver (2026-11-25, the Harvest Mouse remade on the mouse base, the player's pick "B" of
// three): a honey-tan harvest mouse of Clover Hills' Hayloft Ridge that carries its home on its back:
// a round woven nest of golden grass strapped on like a backpack, a little round door with a peep of
// down, a green blade curling out of the weave; a daisy tucked behind its ear; a scarf of two crossed
// leaves; a pink ribbon bow near the tip of its long tail; big glossy dark eyes. (Its Woven Nest
// drops are its own.) It moves on its own copy of the mouse base (mousebase.js: its bones, scurry
// and bound, springs and moves: bite, chitter, tail whip), dressed here.
//   idle    an 18 s act: sits up with a seed and nibbles it, cheeks going, crumbs falling; washes its
//           face (the base's own wash); hears something: ears up, stands tall, nose twitching, frozen
//           a moment, then a happy little hop.
// Everything drawn here from scratch (the face too).
import { dressedMouse } from './mousebase.js';

const TAU = Math.PI * 2;

const fillOr = (ctx, a, K, mode, c) => {
  if (mode === 'line') K.edge(ctx);
  else {
    ctx.fillStyle = K.colour(a, c);
    ctx.fill();
  }
};
const ell = (ctx, x, y, rx, ry, r = 0) => {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, r, 0, TAU);
};
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
const faceOf = (a) => a.hmFace ?? a.face;

// A mouse's eye, side on (the head's frame, game px): big and round, glossy, the iris dark at the top
// and light at the bottom, a big pupil, two glints and a star; a soft upper lid line with a lash
// flicking back; blinks; a happy arc; squeezed shut when hurt.
function eye(ctx, a, K, x, y, rx, ry, col) {
  const cl = (c) => K.colour(a, c);
  const ink = '#2a1a20';
  const f = faceOf(a);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const blink = ((a.t + (a.mo?.uid ?? 0) * 0.41) % 3.4) < 0.11;
  if (f === 'dead' || f === 'hurt') {
    ctx.strokeStyle = cl(ink);
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(x - rx, y - ry * 0.7);
    ctx.lineTo(x + rx * 0.7, y);
    ctx.lineTo(x - rx, y + ry * 0.7);
    ctx.stroke();
    return;
  }
  if (blink || f === 'sleep') {
    ctx.strokeStyle = cl(ink);
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(x - rx * 1.05, y + ry * 0.1);
    ctx.quadraticCurveTo(x, y + ry * 0.7, x + rx * 1.1, y);
    ctx.stroke();
    return;
  }
  if (f === 'happy') {
    ctx.strokeStyle = cl(ink);
    ctx.lineWidth = 0.55;
    ctx.beginPath();
    ctx.moveTo(x - rx, y + ry * 0.3);
    ctx.quadraticCurveTo(x, y - ry * 0.9, x + rx, y + ry * 0.3);
    ctx.stroke();
    return;
  }
  ell(ctx, x, y, rx, ry);
  ctx.fillStyle = cl(ink);
  ctx.fill();
  ell(ctx, x + rx * 0.05, y + ry * 0.08, rx * 0.84, ry * 0.86);
  ctx.fillStyle = cl(col.iris);
  ctx.fill();
  ell(ctx, x + rx * 0.05, y - ry * 0.36, rx * 0.76, ry * 0.42);
  ctx.fillStyle = cl(col.dk);
  ctx.fill();
  ell(ctx, x + rx * 0.05, y + ry * 0.52, rx * 0.56, ry * 0.26);
  ctx.fillStyle = cl(col.lt);
  ctx.fill();
  ell(ctx, x + rx * 0.14, y + ry * 0.06, rx * 0.4, ry * 0.46);
  ctx.fillStyle = cl('#1a0e14');
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ell(ctx, x - rx * 0.3, y - ry * 0.36, rx * 0.36, ry * 0.28);
  ctx.fill();
  ell(ctx, x + rx * 0.4, y + ry * 0.46, rx * 0.16, ry * 0.12);
  ctx.fill();
  const sx = x + rx * 0.32;
  const sy = y - ry * 0.1;
  const r = rx * 0.32;
  ctx.beginPath();
  ctx.moveTo(sx, sy - r);
  ctx.quadraticCurveTo(sx, sy, sx + r * 0.6, sy);
  ctx.quadraticCurveTo(sx, sy, sx, sy + r);
  ctx.quadraticCurveTo(sx, sy, sx - r * 0.6, sy);
  ctx.quadraticCurveTo(sx, sy, sx, sy - r);
  ctx.fill();
  // the lid line, a lash flicking back, a lower lash
  const lid = f === 'angry' ? 0.42 : 0.06;
  const top = y - ry + ry * 2 * lid;
  if (lid > 0.1) {
    ctx.fillStyle = cl(K.C.base);
    ctx.beginPath();
    ctx.moveTo(x - rx * 1.4, y - ry * 1.5);
    ctx.lineTo(x + rx * 1.4, y - ry * 1.5);
    ctx.lineTo(x + rx * 1.2, top + ry * 0.3);
    ctx.quadraticCurveTo(x, top - ry * 0.2, x - rx * 1.2, top + ry * 0.1);
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = cl(ink);
  ctx.lineWidth = 0.55;
  ctx.beginPath();
  ctx.moveTo(x - rx * 1.05, top + ry * 0.35);
  ctx.quadraticCurveTo(x, top - ry * 0.25, x + rx * 1.02, top + ry * (f === 'angry' ? 0.35 : 0.2));
  ctx.stroke();
  ctx.lineWidth = 0.45;
  ctx.beginPath();
  ctx.moveTo(x - rx * 0.95, top + ry * 0.35);
  ctx.quadraticCurveTo(x - rx * 1.35, top + ry * 0.1, x - rx * 1.55, top - ry * 0.2);
  ctx.stroke();
  ctx.lineWidth = 0.3;
  ctx.strokeStyle = cl(K.C.deep);
  ctx.beginPath();
  ctx.moveTo(x - rx * 0.6, y + ry * 1.08);
  ctx.quadraticCurveTo(x, y + ry * 1.22, x + rx * 0.7, y + ry * 1);
  ctx.stroke();
}
const EYE = (K) => [K.sc(3.2), -K.sc(0.8), K.sc(2.1), K.sc(2.5)];
function blush(ctx, a, K, c = '#ff8fa6') {
  const [x, y] = EYE(K);
  ctx.fillStyle = K.tint(a, c, 0.55);
  ell(ctx, x + K.sc(0.6), y + K.sc(3.6), K.sc(1.7), K.sc(0.75));
  ctx.fill();
  ctx.strokeStyle = K.tint(a, '#ffffff', 0.8);
  ctx.lineWidth = 0.25;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(x + K.sc(-0.4 + i * 0.8), y + K.sc(4));
    ctx.lineTo(x + K.sc(0.1 + i * 0.8), y + K.sc(3.2));
    ctx.stroke();
  }
}
// A four-petal / five-petal little flower.
function flower(ctx, a, K, x, y, r, petal, heart, n = 5) {
  ctx.fillStyle = K.colour(a, petal);
  for (let i = 0; i < n; i++) {
    const an = (i / n) * TAU;
    ell(ctx, x + Math.cos(an) * r * 0.62, y + Math.sin(an) * r * 0.62, r * 0.5, r * 0.36, an);
    ctx.fill();
  }
  ctx.fillStyle = K.colour(a, heart);
  ell(ctx, x, y, r * 0.38, r * 0.38);
  ctx.fill();
}

// ================= B: the Nest Weaver =================
// A honey-tan harvest mouse that carries its home on its back: a round woven nest of green and gold
// grass, strapped on like a backpack, a peep of soft down at its door; a daisy tucked behind its ear;
// a leaf scarf; a ribbon bow near the tip of its long tail; bright black-brown eyes.
const weaver = {
  C: { lt: '#fff2e0', base: '#d8a66c', sh: '#b4844e', deep: '#906438', inner: '#ffc8c8', nose: '#ff8aa0', mouth: '#906438', guide: '#d8a66c' },
  face: (ctx, a, sk, K) => {
    const [x, y, rx, ry] = EYE(K);
    eye(ctx, a, K, x, y, rx, ry, { iris: '#6a3a24', dk: '#3a1a10', lt: '#c88a5a' });
    blush(ctx, a, K);
  },
  over: {
    body: (ctx, a, mode, K) => {
      const sk = a.bk;
      // the strap round its middle
      const s0 = sk.at([-1, -6.6]);
      const s1 = sk.at([0.6, 6]);
      if (mode === 'fill') {
        ctx.strokeStyle = K.colour(a, '#6aa84e');
        ctx.lineWidth = K.sc(1.1);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(...s0);
        ctx.lineTo(...s1);
        ctx.stroke();
      }
      // the nest: a woven ball on its back
      const c = sk.at([-4, -10.6]);
      const r = K.sc(5.6);
      ell(ctx, c[0], c[1], r, r * 0.92);
      fillOr(ctx, a, K, mode, '#e2c278');
      if (mode === 'fill') {
        ctx.save();
        ell(ctx, c[0], c[1], r, r * 0.92);
        ctx.clip();
        // woven strands, green and gold, round and round
        for (let i = 0; i < 9; i++) {
          ctx.strokeStyle = K.colour(a, i % 4 === 0 ? '#9cc060' : i % 2 ? '#c8a050' : '#f2d890');
          ctx.lineWidth = K.sc(0.7);
          ctx.beginPath();
          ctx.ellipse(c[0], c[1] - r + (i + 0.5) * (r * 2 / 9), r * 1.05, K.sc(0.9), (i % 2 ? 0.15 : -0.15), 0, TAU);
          ctx.stroke();
        }
        ctx.fillStyle = K.tint(a, '#8a6a2a', 0.35);
        ell(ctx, c[0] + r * 0.2, c[1] + r * 0.45, r * 0.9, r * 0.45);
        ctx.fill();
        ctx.fillStyle = K.tint(a, '#fff8d0', 0.5);
        ell(ctx, c[0] - r * 0.35, c[1] - r * 0.45, r * 0.45, r * 0.25, -0.4);
        ctx.fill();
        ctx.restore();
        // its door, a peep of down
        ctx.fillStyle = K.colour(a, '#4a3a1a');
        ell(ctx, c[0] + r * 0.45, c[1] - r * 0.05, r * 0.28, r * 0.32);
        ctx.fill();
        ctx.fillStyle = K.colour(a, '#fff8ee');
        ell(ctx, c[0] + r * 0.48, c[1] + r * 0.1, r * 0.17, r * 0.13);
        ctx.fill();
        // one green blade curling out of the weave
        ctx.fillStyle = K.colour(a, '#8ac05a');
        ctx.beginPath();
        ctx.moveTo(c[0] - r * 0.5, c[1] - r * 0.7);
        ctx.quadraticCurveTo(c[0] - r * 0.9, c[1] - r * 1.3, c[0] - r * 1.3, c[1] - r * 1.1);
        ctx.quadraticCurveTo(c[0] - r * 0.9, c[1] - r * 1.05, c[0] - r * 0.35, c[1] - r * 0.6);
        ctx.fill();
      }
    },
    neck: (ctx, a, mode, K) => {
      const sk = a.bk;
      const c = sk.at([6.4, 0.6]);
      // the leaf scarf: two leaves crossed under the chin
      for (const [an, dx] of [[0.6, -0.6], [-0.3, 0.8]]) {
        ctx.save();
        ctx.translate(c[0] + K.sc(dx), c[1]);
        ctx.rotate(an + Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(0, -K.sc(0.4));
        ctx.quadraticCurveTo(K.sc(2), K.sc(1.6), 0, K.sc(4.4));
        ctx.quadraticCurveTo(-K.sc(2), K.sc(1.6), 0, -K.sc(0.4));
        ctx.closePath();
        fillOr(ctx, a, K, mode, '#7cc85a');
        if (mode === 'fill') {
          ctx.strokeStyle = K.colour(a, '#4e9a3a');
          ctx.lineWidth = 0.3;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, K.sc(4));
          ctx.stroke();
        }
        ctx.restore();
      }
    },
    earN: (ctx, a, mode, K) => {
      const [base, an] = K.earFrame(ctx, a, 'near');
      // the daisy tucked behind the ear, at its base
      const p = [base[0] - K.sc(1.6), base[1] + K.sc(0.4)];
      if (mode === 'line') {
        ell(ctx, p[0], p[1], K.sc(2.6), K.sc(2.6));
        K.edge(ctx);
        return;
      }
      flower(ctx, a, K, p[0], p[1], K.sc(2.6), '#ffffff', '#ffd23a', 8);
    },
    tail: (ctx, a, mode, K) => {
      const T = a.bk.tail;
      const pts = T.pts ?? [];
      if (pts.length < 3) return;
      const p = pts[pts.length - 3];
      ctx.translate(...p);
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(K.sc(1.6) * s, -K.sc(2), K.sc(2.6) * s, -K.sc(0.6));
        ctx.quadraticCurveTo(K.sc(1.8) * s, K.sc(0.8), 0, 0);
        fillOr(ctx, a, K, mode, '#ff8ab0');
      }
      ell(ctx, 0, 0, K.sc(0.8), K.sc(0.8));
      fillOr(ctx, a, K, mode, '#e8608a');
    },
  },
  P: { scale: 0.9, nut: 'seed' },
  // Its own idle act, on top of the base's standing about (only while calm), an 18 s loop.
  pose: (m, a, out, K, mv) => {
    // (2026-11-25 polish, the player: "more expressive": a 30 s act)
    //   - sat up nibbling a sunflower seed, then stuffing it into a cheek, cheeks bulging, so pleased;
    //   - a wash (the base's own);
    //   - nest-mending: nose down, tugging a blade of grass out of the ground, jerk, jerk, it pops
    //     free and the mouse tumbles back onto its bottom, then sits proudly with it in its mouth;
    //   - curled up in a ball for a catnap, a snore bubble growing and popping, waking with a stretch;
    //   - hears something: ears up, tall, frozen, nose twitching; then two happy hops.
    a.hmFace = null;
    a.hmNibble = 0;
    a.hmAlert = 0;
    a.hmBlade = -1;
    a.hmNap = 0;
    a.hmBubble = -1;
    if (mv || m.hp <= 0) return;
    const calm = a.calm ?? 1;
    if (calm < 0.02) return;
    const lu = (a.t + (m.uid % 5) * 3.1) % 30;
    const go = (pose, w) => {
      if (w > 0.001) for (const [k, v] of Object.entries(pose)) out[k] = (out[k] ?? 0) + (v - (out[k] ?? 0)) * w;
    };
    const hold = K.hold;
    // a seed: sat up, nibbling, nose and cheeks going; then stuffed into a cheek
    const nib = hold(lu, 0.8, 1.3, 4.3, 4.7) * calm;
    const chew = Math.max(0, Math.sin(a.t * 14));
    go({ sit: 1, hold: 1, head: 8, ears: 0.3, nose: 0.6 + chew * 0.4, jaw: chew * 0.35, cheeks: 0.5 + chew * 0.3, tailUp: 6 }, nib);
    a.hmNibble = nib;
    const stuff = hold(lu, 4.4, 4.7, 5.9, 6.4) * calm;
    go({ sit: 0.9, hold: 0.6, head: -6, ears: 0.8, cheeks: 1.4, nose: 0.8, tailUp: 18, swish: 0.6, hop: 0.03 * Math.abs(Math.sin((lu - 4.7) * 9)) }, stuff);
    // a wash (the base's own)
    const wsh = hold(lu, 7.4, 7.55, 9.3, 9.5) * calm;
    if (wsh > 0.001) go(K.poseAt(K.moves.wash, Math.max(0, Math.min(1.72, lu - 7.4)), 1, out), wsh);
    // nest-mending: a blade of grass tugged out of the ground
    const tug = hold(lu, 10.6, 11, 12.6, 12.7) * calm;
    const jerk = Math.max(0, Math.sin((lu - 11) * 9)) * hold(lu, 11, 11.2, 12.5, 12.6);
    go({ sit: 0, hold: 0, wash: 0, pitch: 12, crouch: 0.35, head: 24, reach: 0.4, jaw: 0.5, ears: 0.6, tailUp: 22, x: -0.04 * jerk, curl: 0.3 + jerk * 0.3 }, tug);
    const plop = hold(lu, 12.6, 12.7, 13, 13.5) * calm;
    go({ sit: 1, hop: 0.06, x: -0.07, head: -14, ears: -0.6, tailUp: 30, pitch: -8 }, plop);
    const proud = hold(lu, 13.3, 13.7, 15, 15.4) * calm;
    go({ sit: 1, head: -10, ears: 0.8, jaw: 0.25, tailUp: 14, swish: 0.4 }, proud);
    a.hmBlade = lu >= 10.8 && lu < 15.3 ? lu - 10.8 : -1;
    // a catnap, curled into a ball; a stretch as it wakes
    const nap = hold(lu, 16.4, 17, 20.2, 20.6) * calm;
    const breathe = Math.sin(a.t * 2.2);
    go({ sit: 0, hold: 0, wash: 0, curl: 1.3 + breathe * 0.1, crouch: 0.7, head: 26, reach: -0.6, ears: -0.7, tailUp: -12, lift: breathe * 0.004 }, nap);
    const wake = hold(lu, 20.5, 20.8, 21.6, 22) * calm;
    go({ sit: 0, hold: 0, wash: 0, curl: -1, pitch: -6, head: -16, reach: 0.6, jaw: 0.8, ears: 0.9, tailUp: 30 }, wake);
    a.hmNap = nap;
    a.hmBubble = lu >= 17.4 && lu < 20.2 ? ((lu - 17.4) % 1.4) / 1.4 : -1;
    // hears something: ears up, frozen, nose twitching; then two happy hops
    const alert = hold(lu, 23.6, 23.9, 25.6, 26) * calm;
    go({ sit: 0.55, hold: 0.3, head: -10, ears: 1, nose: 0.5 + Math.sin(a.t * 30) * 0.5, tailUp: 14 }, alert);
    a.hmAlert = alert;
    const hop = hold(lu, 26, 26.2, 27.4, 27.8) * calm;
    go({ hop: 0.2 * Math.abs(Math.sin(Math.min(1, (lu - 26) / 1.6) * Math.PI * 2)), ears: 0.8, tailUp: 22, swish: 0.8 }, hop);
    a.hmFace = nib > 0.5 ? (chew > 0.5 ? 'happy' : null) : stuff > 0.4 ? 'happy' : tug > 0.5 ? 'hurt' : plop > 0.4 ? 'o' : proud > 0.4 ? 'happy'
      : nap > 0.4 ? 'sleep' : wake > 0.4 ? 'happy' : alert > 0.5 ? 'o' : hop > 0.3 ? 'happy' : null;
  },
  // Its extras: crumbs off the seed as it nibbles, a little "!" when it hears something, a wisp of
  // grass now and then off its nest as it scurries.
  fx: (ctx, m, a, K) => {
    if (m.hp <= 0 || !a.bk) return;
    const sk = a.bk;
    ctx.save();
    // the sunflower seed in its paws as it nibbles: grey, white-striped, tipped toward its mouth
    if ((a.hmNibble ?? 0) > 0.3) {
      const pw = sk.legs.foreN.P;
      ctx.globalAlpha = Math.min(1, (a.hmNibble - 0.3) * 4);
      ctx.translate(pw[0] + K.sc(0.6), pw[1] - K.sc(1.6));
      ctx.rotate(-0.9 + Math.sin(a.t * 14) * 0.08);
      for (const [c, g] of [['#2a1c24', 0.5], ['#5a5a6a', 0]]) {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.moveTo(0, -K.sc(2.4) - g);
        ctx.quadraticCurveTo(K.sc(1.4) + g, -K.sc(0.6), K.sc(0.2), K.sc(1.8) + g);
        ctx.quadraticCurveTo(-K.sc(1.3) - g, -K.sc(0.2), 0, -K.sc(2.4) - g);
        ctx.fill();
      }
      ctx.strokeStyle = '#f4f0e8';
      ctx.lineWidth = 0.3;
      for (const dx of [-0.45, 0, 0.45]) {
        ctx.beginPath();
        ctx.moveTo(K.sc(dx) * 0.6, -K.sc(1.9));
        ctx.lineTo(K.sc(dx) + K.sc(0.15), K.sc(1.2));
        ctx.stroke();
      }
      // (back to the rig's frame for the rest)
      ctx.restore();
      ctx.save();
    }
    // the blade of grass: tugged out of the ground, then held in its mouth, swaying
    const bl = a.hmBlade ?? -1;
    if (bl >= 0) {
      const sn = sk.hp ?? [0, 0];
      const held = bl > 1.85;
      const ang = sk.ha ?? 0;
      const mx = sn[0] + Math.cos(ang) * K.sc(9);
      const my = sn[1] + Math.sin(ang) * K.sc(9) + K.sc(3);
      ctx.globalAlpha = Math.min(1, bl * 4) * Math.min(1, (4.5 - bl) * 3);
      ctx.strokeStyle = '#5aa84a';
      ctx.lineCap = 'round';
      ctx.lineWidth = K.sc(1.1);
      ctx.beginPath();
      if (!held) {
        // rooted: from the mouth down to the ground, stretched taut with each jerk
        ctx.moveTo(mx, my);
        ctx.quadraticCurveTo(mx + K.sc(3), (my + 0) / 2, mx + K.sc(2), 0);
      } else {
        const sw = Math.sin(a.t * 4) * 0.3;
        ctx.moveTo(mx - K.sc(2), my);
        ctx.quadraticCurveTo(mx + K.sc(4), my - K.sc(3), mx + K.sc(8) + sw * K.sc(3), my - K.sc(9) + sw * K.sc(2));
      }
      ctx.stroke();
      ctx.strokeStyle = '#8ad06a';
      ctx.lineWidth = K.sc(0.4);
      ctx.stroke();
      if (bl > 1.8 && bl < 2.3) {
        // the pop: a few clods of earth
        const u = (bl - 1.8) / 0.5;
        ctx.fillStyle = '#8a6a4a';
        for (let i = 0; i < 4; i++) {
          ctx.globalAlpha = 1 - u;
          ell(ctx, mx + K.sc(2) + (i - 1.5) * K.sc(2.6) * (1 + u), -K.sc(1) - Math.sin(Math.PI * u) * K.sc(5 + i), K.sc(0.8), K.sc(0.7));
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }
    // the catnap: a snore bubble growing at its nose and popping
    const bb = a.hmBubble ?? -1;
    if (bb >= 0 && (a.hmNap ?? 0) > 0.5) {
      const sn = sk.hp ?? [0, 0];
      const r = K.sc(0.8 + bb * 3.4);
      ctx.globalAlpha = bb < 0.92 ? 0.8 : (1 - bb) / 0.08 * 0.8;
      ctx.strokeStyle = '#a8d8f0';
      ctx.lineWidth = 0.5;
      ell(ctx, sn[0] + Math.cos(sk.ha) * K.sc(11) + r * 0.6, sn[1] + Math.sin(sk.ha) * K.sc(11) + K.sc(1) - r * 0.4, r, r);
      ctx.stroke();
      ctx.fillStyle = 'rgba(200,236,255,0.35)';
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ell(ctx, sn[0] + Math.cos(sk.ha) * K.sc(11) + r * 0.3, sn[1] + Math.sin(sk.ha) * K.sc(11) + K.sc(1) - r * 0.8, r * 0.25, r * 0.18);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    if ((a.hmNibble ?? 0) > 0.4) {
      const mo = [sk.hp[0] + Math.cos(sk.ha) * K.sc(9), sk.hp[1] + Math.sin(sk.ha) * K.sc(9) + K.sc(3)];
      for (let i = 0; i < 3; i++) {
        const u = ((a.t * 1.4 + i / 3) % 1);
        ctx.globalAlpha = a.hmNibble * (1 - u);
        ctx.fillStyle = i % 2 ? '#f2d890' : '#c8a050';
        ell(ctx, mo[0] + Math.sin(i * 2.3 + u * 3) * K.sc(1.6), mo[1] + u * K.sc(9), K.sc(0.45), K.sc(0.38));
        ctx.fill();
      }
    }
    if ((a.hmAlert ?? 0) > 0.5) {
      const p = [sk.hp[0] + K.sc(2), sk.hp[1] - K.sc(13)];
      const k = Math.min(1, (a.hmAlert - 0.5) * 4);
      ctx.globalAlpha = k;
      ctx.lineCap = 'round';
      for (const [c, w] of [['#ffffff', 2.2], ['#ff8aa0', 1]]) {
        ctx.strokeStyle = c;
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.moveTo(p[0], p[1] - K.sc(2.6));
        ctx.lineTo(p[0], p[1]);
        ctx.stroke();
        ctx.fillStyle = c;
        ell(ctx, p[0], p[1] + K.sc(1.4), w * 0.5, w * 0.5);
        ctx.fill();
      }
    }
    if ((a.walkW ?? 0) > 0.5) {
      const P = 1.6;
      const u = ((a.t + (m.uid % 3) * 0.5) % P) / 1.1;
      if (u < 1) {
        const n = sk.at([-4, -14]);
        ctx.globalAlpha = Math.sin(Math.PI * u);
        ctx.strokeStyle = '#c8a050';
        ctx.lineWidth = K.sc(0.45);
        ctx.beginPath();
        const x = n[0] - u * K.sc(10);
        const y = n[1] - Math.sin(u * 3) * K.sc(2) + u * K.sc(6);
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + K.sc(1.2), y - K.sc(1), x + K.sc(2.4), y - K.sc(0.2));
        ctx.stroke();
      }
    }
    ctx.restore();
  },
};

export const HARV_MOUSE = dressedMouse(weaver);
HARV_MOUSE.art.noHop = true;
