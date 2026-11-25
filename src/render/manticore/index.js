// The Sunset Manticub (2026-11-25, the Manticore Cub remade on the cat base, the player's pick "A" of
// three): a chubby golden lion cub of Windy Canyon, a proper little manticore: a big fluffy ruff in
// sunset orange and rose, little coral bat wings it can't fly with yet, and a scorpion's tail of rose
// plates curling up over its back, tipped with a soft pink heart for a stinger (the Stinger it
// drops); a few freckles, warm amber eyes. It moves on its own copy of the cat base's tiger cub
// (cubbase.js: its bones, walk, springs and moves: swipe, stalk, bite), dressed here.
//   idle    an 18 s act: it tries to fly (sits up, wings buzzing, a hop or two... a plop, and a
//           little sulk); grooms a paw; raises its tail and the heart stinger glows, a heart or two
//           floating off it, pleased.
// Everything drawn here from scratch (the face too).
import { dressedCub } from './cubbase.js';

const TAU = Math.PI * 2;
const lerp = (a, b, u) => a + (b - a) * u;

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
const faceOf = (a) => a.mcFace ?? a.face;
const SRX = (K) => K.sc(K.P.head.skull[2]);
const SRY = (K) => K.sc(K.P.head.skull[3]);

// A cub's eye, side on (the head's frame): big and round, a dark rim, the iris in three tones round a
// big pupil, two glints and a star; an upper lid line flicking up at the outer corner, a lower lash;
// blinks; a happy arc; squeezed when hurt; narrowed when cross.
function eye(ctx, a, K, col) {
  const cl = (c) => K.colour(a, c);
  const ink = '#2a1a1a';
  const f = faceOf(a);
  const x = SRX(K) * 0.42;
  const y = -SRY(K) * 0.1;
  const rx = K.sc(2.4);
  const ry = K.sc(2.9);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const blink = ((a.t + (a.mo?.uid ?? 0) * 0.43) % 3.7) < 0.11;
  if (f === 'dead' || f === 'hurt') {
    ctx.strokeStyle = cl(ink);
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(x - rx, y - ry * 0.6);
    ctx.lineTo(x + rx * 0.7, y);
    ctx.lineTo(x - rx, y + ry * 0.6);
    ctx.stroke();
    return;
  }
  if (blink || f === 'happy' || f === 'sleep') {
    ctx.strokeStyle = cl(ink);
    ctx.lineWidth = 0.65;
    ctx.beginPath();
    if (f === 'happy') {
      ctx.moveTo(x - rx, y + ry * 0.3);
      ctx.quadraticCurveTo(x, y - ry * 0.8, x + rx, y + ry * 0.3);
    } else {
      ctx.moveTo(x - rx, y);
      ctx.quadraticCurveTo(x, y + ry * 0.7, x + rx, y);
    }
    ctx.stroke();
    return;
  }
  ell(ctx, x, y, rx * 1.08, ry * 1.04);
  ctx.fillStyle = cl('#fffaf4');
  ctx.fill();
  ell(ctx, x + rx * 0.12, y + ry * 0.06, rx * 0.86, ry * 0.9);
  ctx.fillStyle = cl(col.ring);
  ctx.fill();
  ell(ctx, x + rx * 0.12, y + ry * 0.12, rx * 0.72, ry * 0.76);
  ctx.fillStyle = cl(col.iris);
  ctx.fill();
  ell(ctx, x + rx * 0.12, y - ry * 0.34, rx * 0.64, ry * 0.34);
  ctx.fillStyle = cl(col.dk);
  ctx.fill();
  ell(ctx, x + rx * 0.12, y + ry * 0.5, rx * 0.48, ry * 0.24);
  ctx.fillStyle = cl(col.lt);
  ctx.fill();
  ell(ctx, x + rx * 0.2, y + ry * 0.08, rx * 0.34, ry * 0.46);
  ctx.fillStyle = cl('#140a0a');
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ell(ctx, x - rx * 0.22, y - ry * 0.34, rx * 0.34, ry * 0.26);
  ctx.fill();
  ell(ctx, x + rx * 0.48, y + ry * 0.46, rx * 0.15, ry * 0.12);
  ctx.fill();
  const sx = x + rx * 0.36;
  const sy = y - ry * 0.1;
  const s = rx * 0.3;
  ctx.beginPath();
  ctx.moveTo(sx, sy - s);
  ctx.quadraticCurveTo(sx, sy, sx + s * 0.6, sy);
  ctx.quadraticCurveTo(sx, sy, sx, sy + s);
  ctx.quadraticCurveTo(sx, sy, sx - s * 0.6, sy);
  ctx.quadraticCurveTo(sx, sy, sx, sy - s);
  ctx.fill();
  const cross = f === 'angry';
  const top = y - ry + ry * (cross ? 0.8 : -0.04);
  if (cross) {
    ctx.fillStyle = cl(K.C.base);
    ctx.beginPath();
    ctx.moveTo(x - rx * 1.4, y - ry * 1.5);
    ctx.lineTo(x + rx * 1.4, y - ry * 1.5);
    ctx.lineTo(x + rx * 1.2, top + ry * 0.4);
    ctx.lineTo(x - rx * 1.2, top);
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = cl(ink);
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(x - rx * 1.1, top + ry * 0.3);
  ctx.quadraticCurveTo(x, top - ry * 0.25, x + rx * 1.05, top + (cross ? ry * 0.4 : ry * 0.15));
  ctx.stroke();
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(x - rx * 1, top + ry * 0.3);
  ctx.quadraticCurveTo(x - rx * 1.45, top + ry * 0.05, x - rx * 1.6, top - ry * 0.3);
  ctx.stroke();
  ctx.lineWidth = 0.32;
  ctx.strokeStyle = cl(K.C.deep);
  ctx.beginPath();
  ctx.moveTo(x - rx * 0.7, y + ry * 1.06);
  ctx.quadraticCurveTo(x, y + ry * 1.22, x + rx * 0.8, y + ry * 0.98);
  ctx.stroke();
}
function blush(ctx, a, K) {
  ctx.fillStyle = K.tint(a, '#ff8f9f', 0.5);
  ell(ctx, SRX(K) * 0.45, SRY(K) * 0.42, K.sc(2), K.sc(0.9));
  ctx.fill();
}
// A mane: one soft scalloped ruff round the face, behind the head (the head's frame): rounded
// bumps all the way round, fur-lock lines in its deeper tone running out from the face, a light on
// its upper bumps.
function mane(ctx, a, K, mode, cs, n = 13, R = 1.42) {
  const cx = -SRX(K) * 0.1;
  const cy = SRY(K) * 0.06;
  const rx = SRX(K) * R;
  const ry = SRY(K) * R;
  const path = (k) => {
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const a0 = (i / n) * TAU;
      const a1 = ((i + 0.5) / n) * TAU;
      const v = [cx + Math.cos(a0) * rx * k * 0.86, cy + Math.sin(a0) * ry * k * 0.86];
      const c = [cx + Math.cos(a1) * rx * k * 1.16, cy + Math.sin(a1) * ry * k * 1.16];
      const a2 = ((i + 1) / n) * TAU;
      const v2 = [cx + Math.cos(a2) * rx * k * 0.86, cy + Math.sin(a2) * ry * k * 0.86];
      if (i === 0) ctx.moveTo(...v);
      if (i < n) ctx.quadraticCurveTo(...c, ...v2);
    }
    ctx.closePath();
  };
  path(1);
  fillOr(ctx, a, K, mode, cs[0]);
  if (mode !== 'fill') return;
  ctx.save();
  path(1);
  ctx.clip();
  // a deeper ring next to the face, so the head sits in the ruff
  ctx.fillStyle = K.colour(a, cs[1]);
  ell(ctx, cx, cy, SRX(K) * 1.12, SRY(K) * 1.12);
  ctx.fill();
  ctx.strokeStyle = K.colour(a, cs[1]);
  ctx.lineWidth = K.sc(0.5);
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const an = ((i + 0.5) / n) * TAU;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(an) * rx * 0.8, cy + Math.sin(an) * ry * 0.8);
    ctx.lineTo(cx + Math.cos(an + 0.08) * rx * 1.02, cy + Math.sin(an + 0.08) * ry * 1.02);
    ctx.stroke();
  }
  ctx.fillStyle = K.tint(a, cs[2], 0.9);
  for (let i = 0; i < n; i++) {
    const an = ((i + 0.5) / n) * TAU;
    if (Math.sin(an) > 0.2) continue;
    ell(ctx, cx + Math.cos(an) * rx * 1.0, cy + Math.sin(an) * ry * 1.0, K.sc(1.5), K.sc(0.7), an + Math.PI / 2);
    ctx.fill();
  }
  ctx.restore();
}
// The scorpion tail: plates over the tail's own curve (a dark line between each, a light on each),
// and a stinger at its tip.
function sting(ctx, a, K, mode, cs, kind) {
  const T = a.bk.tail;
  if (!T || T.length < 3) return;
  const n = T.length;
  if (mode === 'fill') {
    for (let i = 1; i < n - 1; i++) {
      const p = T[i];
      const q = T[i + 1];
      const an = Math.atan2(q[1] - p[1], q[0] - p[0]);
      const w = K.sc(lerp(K.P.tail.w[0], K.P.tail.w[1], i / (n - 1)));
      ctx.save();
      ctx.translate(...p);
      ctx.rotate(an);
      ctx.strokeStyle = K.colour(a, cs[2]);
      ctx.lineWidth = K.sc(0.45);
      ctx.beginPath();
      ctx.moveTo(0, -w * 0.5);
      ctx.quadraticCurveTo(K.sc(0.6), 0, 0, w * 0.5);
      ctx.stroke();
      ctx.fillStyle = K.tint(a, cs[0], 0.8);
      ell(ctx, K.sc(1.4), -w * 0.18, K.sc(1), w * 0.14);
      ctx.fill();
      ctx.restore();
    }
  }
  const p = T[n - 1];
  const q = T[n - 2];
  const an = Math.atan2(p[1] - q[1], p[0] - q[0]);
  ctx.translate(...p);
  ctx.rotate(an);
  ctx.beginPath();
  if (kind === 'heart') {
    const r = K.sc(2.4);
    ctx.moveTo(r * 1.6, 0);
    ctx.bezierCurveTo(r * 0.6, -r * 1.4, -r * 0.9, -r * 0.9, -r * 0.2, 0);
    ctx.bezierCurveTo(-r * 0.9, r * 0.9, r * 0.6, r * 1.4, r * 1.6, 0);
  } else {
    // a rounded hook: a bulb, the tip curling over
    ctx.moveTo(-K.sc(1), -K.sc(1.6));
    ctx.quadraticCurveTo(K.sc(2.6), -K.sc(2.6), K.sc(3.6), K.sc(0.4));
    ctx.quadraticCurveTo(K.sc(3.4), K.sc(1.6), K.sc(2.4), K.sc(1.6));
    ctx.quadraticCurveTo(K.sc(2), K.sc(0.2), K.sc(0.8), K.sc(1.6));
    ctx.quadraticCurveTo(-K.sc(1.2), K.sc(1.8), -K.sc(1), -K.sc(1.6));
  }
  ctx.closePath();
  fillOr(ctx, a, K, mode, cs[3]);
  if (mode === 'fill') {
    ctx.fillStyle = K.tint(a, '#ffffff', 0.6);
    ell(ctx, K.sc(0.6), -K.sc(0.7), K.sc(0.8), K.sc(0.4), -0.3);
    ctx.fill();
  }
}
// Little wings on its shoulders, folded up and back: a bat's (fingers, a scalloped edge) or a
// feathered one; `flut` flutters them.
function wing(ctx, a, K, mode, cs, kind, far) {
  const sk = a.bk;
  const root = sk.at([far ? -1.6 : 0, -8.6]);
  const flut = Math.sin(a.t * 18) * 0.12 * (a.mcFlutter ?? 0);
  ctx.translate(...root);
  ctx.rotate(-0.15 + flut + (far ? -0.2 : 0));
  const s = K.sc(1.35) * (far ? 0.9 : 1);
  ctx.beginPath();
  if (kind === 'bat') {
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-s * 2, -s * 5, -s * 7, -s * 7.4);
    ctx.quadraticCurveTo(-s * 7.6, -s * 5.4, -s * 9.4, -s * 4.2);
    ctx.quadraticCurveTo(-s * 7.4, -s * 3.4, -s * 7.6, -s * 1.4);
    ctx.quadraticCurveTo(-s * 5.6, -s * 1.4, -s * 5, s * 0.6);
    ctx.quadraticCurveTo(-s * 2.6, -s * 0.2, 0, s * 1.4);
  } else {
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-s * 3, -s * 6, -s * 8, -s * 7);
    ctx.quadraticCurveTo(-s * 9.4, -s * 6, -s * 8.6, -s * 4.6);
    ctx.quadraticCurveTo(-s * 9.6, -s * 3.4, -s * 8.2, -s * 2.4);
    ctx.quadraticCurveTo(-s * 8.8, -s * 1, -s * 6.8, -s * 0.6);
    ctx.quadraticCurveTo(-s * 6.6, s * 0.8, -s * 4.6, s * 0.8);
    ctx.quadraticCurveTo(-s * 2, s * 1.6, 0, s * 1.4);
  }
  ctx.closePath();
  fillOr(ctx, a, K, mode, far ? cs[1] : cs[0]);
  if (mode === 'fill') {
    ctx.strokeStyle = K.colour(a, cs[2]);
    ctx.lineWidth = K.sc(0.4);
    ctx.beginPath();
    if (kind === 'bat') {
      for (const [x, y] of [[-7, -7.4], [-9.4, -4.2], [-7.6, -1.4], [-5, 0.6]]) {
        ctx.moveTo(-s * 0.6, -s * 0.4);
        ctx.quadraticCurveTo(x * s * 0.5, y * s * 0.7, x * s * 0.95, y * s * 0.95);
      }
    } else {
      for (const [x, y] of [[-8.6, -4.6], [-8.2, -2.4], [-6.8, -0.6]]) {
        ctx.moveTo(x * s * 0.55, y * s * 0.5);
        ctx.lineTo(x * s * 0.95, y * s * 0.95);
      }
    }
    ctx.stroke();
    ctx.fillStyle = K.tint(a, '#ffffff', 0.4);
    ell(ctx, -s * 3, -s * 3.6, s * 2.2, s * 0.7, 0.7);
    ctx.fill();
  }
}

// A chubby golden lion cub of the canyon: a big fluffy mane in sunset orange and rose; little coral
// bat wings on its shoulders; a scorpion's tail of rose plates curling up over its back, tipped with
// a soft pink heart for a stinger; a few freckles; warm amber eyes.
const sunset = {
  P: { scale: 0.86, tail: { base: 222, curl0: 12, curl1: 62, w: [3.8, 3], n: 7, seg: 3.8 } },
  C: { lt: '#fff4dc', base: '#f2c46a', sh: '#d8a04a', deep: '#b87c34', guide: '#f2c46a', nose: '#d86a6a', mouth: '#a8603a' },
  face: (ctx, a, sk, K) => {
    eye(ctx, a, K, { ring: '#6a3a08', iris: '#f0a030', dk: '#a8601a', lt: '#ffe09a' });
    blush(ctx, a, K);
    ctx.fillStyle = K.colour(a, '#d8904a');
    for (const [dx, dy] of [[-0.6, 3.2], [0.6, 3.8], [-0.2, 4.4]]) {
      ell(ctx, SRX(K) * 0.45 + K.sc(dx), K.sc(dy), K.sc(0.25), K.sc(0.25));
      ctx.fill();
    }
  },
  under: {
    head: (ctx, a, mode, K) => {
      K.headFrame(ctx, a);
      mane(ctx, a, K, mode, ['#f08a4a', '#e8605a', '#ffc080']);
    },
    body: (ctx, a, mode, K) => wing(ctx, a, K, mode, ['#ff9a8a', '#e87a6a', '#c8504a'], 'bat', true),
  },
  over: {
    body: (ctx, a, mode, K) => wing(ctx, a, K, mode, ['#ff9a8a', '#e87a6a', '#c8504a'], 'bat', false),
    tail: (ctx, a, mode, K) => sting(ctx, a, K, mode, ['#ffc0c0', '#e87a8a', '#c8506a', '#ff7aa0'], 'heart'),
  },

  // Its own idle act, on top of the base's standing about (only while calm), an 18 s loop.
  pose: (m, a, out, K, mv) => {
    // (2026-11-25 polish, the player: "more expressive": a 32 s act)
    //   - trying to fly: sat up, wings buzzing, three little hops; a plop; a sulk;
    //   - grooming a paw;
    //   - stalking its own heart stinger as it flicks about: low, bottom wiggling... pounce! missed;
    //   - a big stretch and yawn (the base's own), then a cosy loaf, slow happy blinks;
    //   - the tail raised, the heart stinger glowing, hearts floating off;
    //   - a proud little "rawr", chin up.
    a.mcFace = null;
    a.mcFlutter = 0;
    a.mcGlow = 0;
    a.mcPlop = -1;
    a.mcRawr = -1;
    if (mv || m.hp <= 0) return;
    const calm = (a.calm ?? 1) * (1 - (a.walkW ?? 0));
    if (calm < 0.02) return;
    const lu = (a.t + (m.uid % 5) * 3.1) % 32;
    const go = (pose, w) => {
      if (w > 0.001) for (const [k, v] of Object.entries(pose)) out[k] = (out[k] ?? 0) + (v - (out[k] ?? 0)) * w;
    };
    const hold = K.hold;
    // trying to fly: sat up, wings buzzing, three little hops; a plop; a sulk
    const tryfly = hold(lu, 0.8, 1.2, 3.6, 3.8) * calm;
    const hp1 = Math.max(0, Math.sin(((lu - 1.4) / 0.72) * Math.PI)) * (lu > 1.4 && lu < 3.6 ? 1 : 0);
    go({ sit: 0.7, neck: -18, head: -16, ears: 0.9, tailRaise: 0.4, hop: 0.09 * hp1, pitch: -6, fly: 0.3 * hp1 }, tryfly);
    a.mcFlutter = tryfly;
    const sulk = hold(lu, 3.7, 4, 5.4, 6) * calm;
    go({ sit: 1, neck: 12, head: 18, ears: -0.8, tailDrop: 1, tailCurl: -60, puff: 0.3 }, sulk);
    a.mcPlop = lu >= 3.6 && lu < 4.2 ? (lu - 3.6) / 0.6 : -1;
    // grooming a paw
    const groom = hold(lu, 7.2, 7.8, 10.2, 10.8) * calm;
    go({ sit: 1, neck: -6, head: 30 + Math.sin(a.t * 9) * 5, ears: 0.1, groom: 1, jaw: 0.15 + 0.15 * Math.sin(a.t * 9) }, groom);
    // stalking its own stinger: the tail flicking about, the wiggle, the pounce
    const eye = hold(lu, 12, 12.3, 13.1, 13.3) * calm;
    go({ tailRaise: 0.9, flick: 1, neck: -8, head: -18, ears: 1, sit: 0.3 }, eye);
    const stalk = hold(lu, 13.2, 13.3, 14.5, 14.9) * calm;
    if (stalk > 0.001) {
      const st = K.poseAt(K.moves.stalk, Math.max(0, Math.min(1.2, lu - 13.3)), 1, out);
      st.x = (st.x ?? 0) * 0.3;
      go(st, stalk);
    }
    // a big stretch and yawn, then a cosy loaf
    const str = hold(lu, 16.4, 16.5, 17.7, 17.9) * calm;
    if (str > 0.001) go(K.poseAt(K.moves.stretch, Math.max(0, Math.min(1.3, lu - 16.5)), 1, out), str);
    const loaf = hold(lu, 17.8, 18.4, 21.4, 21.9) * calm;
    go({ loaf: 1, neck: 4, head: 6 + Math.sin(a.t * 1.6) * 2, ears: 0.2, tailCurl: 40, tailDrop: 0.6 }, loaf);
    const slow = Math.sin((lu - 18.4) * 1.9) > 0.2;
    // the tail raised, the heart stinger glowing
    const show = hold(lu, 23, 23.5, 26, 26.6) * calm;
    go({ tailRaise: 0.9, flick: 0.4, ears: 0.8, neck: -10, head: -10, pitch: -3 }, show);
    a.mcGlow = show;
    // a proud little rawr
    const rawr = hold(lu, 27.6, 27.8, 28.6, 29) * calm;
    go({ sit: 0.6, neck: -20, head: -20, jaw: 0.9, ears: -0.2, puff: 0.6, tailRaise: 0.7, pitch: -6, hop: 0.02 }, rawr);
    a.mcRawr = lu >= 27.7 && lu < 29 ? (lu - 27.7) / 1.3 : -1;
    a.mcFace = tryfly > 0.5 ? (hp1 > 0.3 ? 'happy' : null) : sulk > 0.4 ? 'angry' : eye > 0.4 ? null : stalk > 0.4 ? (lu < 13.75 ? 'angry' : 'happy')
      : str > 0.4 ? 'sleep' : loaf > 0.4 ? (slow ? 'happy' : null) : show > 0.5 ? 'happy' : rawr > 0.4 ? 'angry' : null;
  },
  // Its extras: a little puff of dust as it plops down; the heart stinger's glow, hearts floating off
  // it.
  fx: (ctx, m, a, K) => {
    if (m.hp <= 0 || !a.bk) return;
    const sk = a.bk;
    ctx.save();
    const pl = a.mcPlop ?? -1;
    if (pl >= 0) {
      const x = sk.pivot ? sk.pivot[0] : 0;
      for (const s2 of [-1, 1]) for (let i = 0; i < 2; i++) {
        const r = K.H * (0.05 - i * 0.012) * (0.6 + pl * 0.8);
        ctx.globalAlpha = 0.7 * (1 - pl);
        ctx.fillStyle = '#f6ead8';
        ell(ctx, x + s2 * K.H * (0.1 + i * 0.1) * (0.4 + pl), -r * 0.7, r, r * 0.8);
        ctx.fill();
      }
    }
    // rawr: little bold letters popping off its muzzle, wobbling up
    const rw = a.mcRawr ?? -1;
    if (rw >= 0 && sk.hp) {
      const k = Math.min(1, rw * 6);
      ctx.globalAlpha = Math.min(1, (1 - rw) * 3);
      ctx.save();
      ctx.translate(sk.hp[0] + K.sc(4) + rw * K.sc(3), sk.hp[1] - K.sc(9) - rw * K.sc(6));
      ctx.rotate(-0.2 + Math.sin(rw * 20) * 0.08);
      ctx.scale(k, k);
      ctx.font = `900 ${K.sc(7)}px Nunito, "Trebuchet MS", sans-serif`;
      ctx.lineJoin = 'round';
      ctx.lineWidth = K.sc(1.6);
      ctx.strokeStyle = '#4a2418';
      ctx.strokeText('rawr!', 0, 0);
      ctx.fillStyle = '#ffb040';
      ctx.fillText('rawr!', 0, 0);
      ctx.restore();
      ctx.globalAlpha = 1;
    }
    const gl = a.mcGlow ?? 0;
    const T = sk.tail;
    if (gl > 0.05 && T?.length) {
      const p = T[T.length - 1];
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], K.sc(6));
      g.addColorStop(0, `rgba(255,150,190,${0.55 * gl})`);
      g.addColorStop(1, 'rgba(255,150,190,0)');
      ctx.fillStyle = g;
      ctx.fillRect(p[0] - K.sc(6), p[1] - K.sc(6), K.sc(12), K.sc(12));
      ctx.globalCompositeOperation = 'source-over';
      for (let i = 0; i < 2; i++) {
        const u = ((a.t * 0.8 + i * 0.5) % 1);
        const x = p[0] + Math.sin(u * 6 + i) * K.sc(1.5);
        const y = p[1] - K.sc(2) - u * K.sc(10);
        const r = K.sc(1.1) * (0.6 + u * 0.4);
        ctx.globalAlpha = gl * Math.sin(Math.PI * u);
        for (const [c, g2] of [['#ffffff', 0.5], ['#ff7aa0', 0]]) {
          const rr = r + g2;
          ctx.fillStyle = c;
          ctx.beginPath();
          ctx.moveTo(x, y + rr * 0.9);
          ctx.bezierCurveTo(x - rr * 1.4, y - rr * 0.1, x - rr * 0.7, y - rr * 1.2, x, y - rr * 0.4);
          ctx.bezierCurveTo(x + rr * 0.7, y - rr * 1.2, x + rr * 1.4, y - rr * 0.1, x, y + rr * 0.9);
          ctx.fill();
        }
      }
    }
    ctx.restore();
  },
};

export const MANTICUB = dressedCub(sunset);
MANTICUB.art.noHop = true;
