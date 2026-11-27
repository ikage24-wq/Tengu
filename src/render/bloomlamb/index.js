// The Airbloom Lamb (2026-11-27, new for the Sky Whale's Back, in the Cloudherd Samoyed's place: the player
// wanted the late regulars to be new creatures that fit their place, each on its own base; the id stays
// `shepherdess`). A lamb from the whale's Lung Gardens, the greenhouse that breathes: little air-blooms took
// root in its fleece and now open whenever it breathes out, in time with the whale. A soft mint-white fleece
// with a fluffy scalloped edge, three pastel blooms in it (pink, lilac, peach) and one on its brow, soft
// green eyes with two little lashes, a blush. It moves on its own copy of the hoofed base (lambbase.js,
// its lamb: the trot, the pronk, the springs and moves), dressed here.
import { dressedHoof } from './lambbase.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ell = (ctx, x, y, rx, ry, r = 0) => {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, r, 0, TAU);
};
const INK = '#7a9a90';
const COL = {
  wool: '#f6fdf6', woolSh: '#dcefe2', woolLt: '#ffffff',
  blooms: [['#ffb0c8', '#ffe2ea'], ['#c8b0f4', '#ece2ff'], ['#ffc49a', '#ffe8d4']],
  heart: '#ffe27a',
  eye: '#33404a', iris: '#6aa890', blush: '#ff9eb4', mouth: '#7a5a5a',
  pollen: '#fff3b0', note: '#6aa890',
};
// (its breath, in time with the whale's: 0 breathed in, 1 breathed out; the blooms open on the out)
const breathOf = (a) => {
  const t = (a.t ?? 0) + (a.mo?.uid ?? 0) * 0.7;
  return 0.5 - 0.5 * Math.cos((t / 4.2) * TAU);
};

// ---------- Its face (the head's frame) ----------
// Its eyes: round, a soft green below, two little lashes at the outer corner.
function eye(ctx, a, K, x, y, f) {
  const s = K.sc;
  const r = s(1.7);
  ctx.lineCap = 'round';
  ctx.strokeStyle = K.colour(a, COL.eye);
  if (f === 'hurt') {
    ctx.lineWidth = r * 0.34;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.8, y - r * 0.7);
    ctx.lineTo(x + r * 0.5, y);
    ctx.lineTo(x - r * 0.8, y + r * 0.7);
    ctx.stroke();
    return;
  }
  if (f === 'blink' || f === 'sleep' || f === 'dead' || f === 'happy') {
    ctx.lineWidth = r * 0.32;
    ctx.beginPath();
    const up = f === 'happy' ? -1 : 1;
    ctx.moveTo(x - r * 0.95, y);
    ctx.quadraticCurveTo(x, y + up * r * 0.8, x + r * 0.95, y);
    ctx.stroke();
    return;
  }
  const k = f === 'startled' ? 1.12 : 1;
  ell(ctx, x, y, r * 0.95 * k, r * k);
  ctx.fillStyle = K.colour(a, COL.eye);
  ctx.fill();
  ell(ctx, x, y + r * 0.42, r * 0.62, r * 0.42);
  ctx.fillStyle = K.colour(a, COL.iris);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ell(ctx, x - r * 0.32, y - r * 0.12, r * 0.3, r * 0.3);
  ctx.fill();
  ell(ctx, x + r * 0.36, y + r * 0.42, r * 0.13, r * 0.13);
  ctx.fill();
  // two little lamb's lashes at its outer corner
  ctx.lineWidth = r * 0.2;
  ctx.beginPath();
  ctx.moveTo(x + r * 0.55, y - r * 0.78);
  ctx.quadraticCurveTo(x + r * 0.9, y - r * 1.15, x + r * 1.2, y - r * 1.12);
  ctx.moveTo(x + r * 0.82, y - r * 0.5);
  ctx.quadraticCurveTo(x + r * 1.2, y - r * 0.72, x + r * 1.45, y - r * 0.6);
  ctx.stroke();
  if (f === 'focus') {
    // its lid down a little, minding the job
    ctx.save();
    ell(ctx, x, y, r * 0.95 * k + 0.2, r * k + 0.2);
    ctx.clip();
    ctx.fillStyle = K.colour(a, K.C.base);
    ctx.fillRect(x - r * 1.3, y - r * 1.4, r * 2.6, r * 1.0);
    ctx.restore();
  }
}
const faceOf = (a) => a.bl?.face ?? ((((a.t ?? 0) + (a.mo?.uid ?? 0) * 0.41) % 5.2) < 0.13 ? 'blink' : 'open');
function face(ctx, a, sk, K) {
  const s = K.sc;
  const f = faceOf(a);
  K.glow(ctx, [s(3.6), s(3.4)], s(2), 0.6, COL.blush);
  eye(ctx, a, K, s(3.2), s(-0.8), f);
  // the nose and a little lamb's mouth
  ctx.fillStyle = K.colour(a, '#e8a0b0');
  ell(ctx, s(8.2), s(3.2), s(0.7), s(0.45), 0.5);
  ctx.fill();
  ctx.strokeStyle = K.colour(a, COL.mouth);
  ctx.lineWidth = s(0.36);
  ctx.lineCap = 'round';
  const b = a.bl ?? {};
  if (f === 'startled' || (b.sneeze ?? 0) > 0.4) {
    ell(ctx, s(7.2), s(5.4), s(0.5), s(0.6));
    ctx.fillStyle = K.colour(a, COL.mouth);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(s(8), s(3.7));
    ctx.lineTo(s(7.6), s(4.9));
    ctx.moveTo(s(6.6), s(5.2));
    ctx.quadraticCurveTo(s(7.6), s(5.2 + (b.chew ?? 0) * Math.abs(Math.sin((a.t ?? 0) * 12)) * 0.5), s(8.4), s(4.8));
    ctx.stroke();
  }
}

// ---------- Its fleece and its air-blooms ----------
// (where the fleece's scallops sit round the body: the body's own outline points, drawn in a little)
const WOOL = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
function fleece(ctx, a, mode, K) {
  const sk = K.skel(a);
  const s = K.sc;
  const P = K.P;
  const blobs = WOOL.map((i, j) => {
    const q = P.body[i];
    const p = sk.bodyPt([q[0] * 0.86, q[1] * 0.86, q[2], q[3], q[4]]);
    return [p[0], p[1], s(j % 2 ? 3.1 : 3.5)];
  });
  if (mode === 'line') {
    ctx.beginPath();
    for (const [x, y, r] of blobs) {
      ctx.moveTo(x + r, y);
      ctx.arc(x, y, r, 0, TAU);
    }
    K.edge(ctx);
    return;
  }
  ctx.save();
  // (the body first: its path starts afresh; then the scallops added to it)
  K.bodyPath(ctx, a);
  for (const [x, y, r] of blobs) {
    ctx.moveTo(x + r, y);
    ctx.arc(x, y, r, 0, TAU);
  }
  ctx.fillStyle = K.colour(a, COL.wool);
  ctx.fill('nonzero');
  ctx.clip('nonzero');
  // soft: lit along the top, a mint shade low down
  const top = sk.bodyPt([0, -9, 0, 0, 0.3]);
  const low = sk.bodyPt([0, 7, 0, 0, 0]);
  const g = ctx.createLinearGradient(top[0], top[1], low[0], low[1]);
  g.addColorStop(0, 'rgba(255,255,255,0.9)');
  g.addColorStop(0.55, 'rgba(255,255,255,0)');
  g.addColorStop(1, K.colour(a, COL.woolSh));
  ctx.fillStyle = g;
  ctx.fillRect(-200, -200, 400, 400);
  ctx.restore();
  // the blooms, growing in it
  const out = clamp(breathOf(a) * 1.1 + (a.bl?.open ?? 0), 0, 1) * (a.bl?.shut ? 0.15 : 1);
  [[1.6, -8.2, 0], [-5.4, -7.6, 1], [-10.6, -1.6, 2]].forEach(([x, y, c], i) => {
    const p = sk.bodyPt([x, y, 0, x < -8 ? 0.5 : 0, x > 0 ? 0.6 : 0]);
    bloom(ctx, a, K, p[0], p[1], s(1.9 - i * 0.15), clamp(out * 1.2 - i * 0.1, 0, 1), COL.blooms[c], i * 1.3);
  });
}
// A little air-bloom: five round petals round a sunny middle; closed, a small bud.
function bloom(ctx, a, K, x, y, r, open, [c, lt], turn = 0) {
  const n = 5;
  const spread = 0.25 + open * 0.75;
  for (let i = 0; i < n; i++) {
    const an = turn + (i * TAU) / n - Math.PI / 2;
    const px = x + Math.cos(an) * r * 0.55 * spread;
    const py = y + Math.sin(an) * r * 0.55 * spread;
    ell(ctx, px, py, r * (0.35 + 0.25 * open), r * (0.3 + 0.2 * open), an);
    ctx.fillStyle = K.colour(a, c);
    ctx.fill();
    ell(ctx, px - Math.cos(an) * r * 0.08, py - Math.sin(an) * r * 0.08, r * (0.18 + 0.12 * open), r * (0.14 + 0.1 * open), an);
    ctx.fillStyle = K.colour(a, lt);
    ctx.fill();
  }
  ell(ctx, x, y, r * 0.3, r * 0.3);
  ctx.fillStyle = K.colour(a, COL.heart);
  ctx.fill();
}

const LOOK = {
  kind: 'lamb',
  // (mint-white: its face, legs and fleece)
  C: { lt: '#ffffff', base: '#f2faf2', sh: '#d6eadc', deep: '#b8d4c4', guide: '#f2faf2', nose: '#e8a0b0', mouth: '#7a5a5a', hoofN: '#c4a8b4', hoofF: '#a8909c' },
  ink: INK,
  face,
  over: {
    body: fleece,
    head: (ctx, a, mode, K) => {
      // the bloom on its brow
      if (mode !== 'fill') return;
      const s = K.sc;
      K.headFrame(ctx, a);
      const out = clamp(breathOf(a) * 1.1 + (a.bl?.open ?? 0), 0, 1) * (a.bl?.shut ? 0.15 : 1);
      bloom(ctx, a, K, s(-1.2), s(-5.6), s(1.7), out, COL.blooms[0], 0.6);
    },
  },
  // Its act, about 30 s, a lamb of the breathing gardens (on the base's channels: x, lift, hop, pitch,
  // arch, hipLift, crouch, lie, sleep, graze, rear, kick, tuck, stiff, neck, head, ears, tailUp, swish, paw):
  //   - a long breath with the whale: in, chest up, then out, every bloom opening, a puff of pollen;
  //   - grazing on the little blooms underfoot, a happy chew;
  //   - a pronk: a springy hop on four stiff legs, just for joy;
  //   - a sniff of the bloom on its back, and a sneeze ("achoo!");
  //   - lying down for a nap, the blooms shut, a "z".
  pose: (m, a, out, K, mv) => {
    const b = { face: null, open: 0, shut: false, puff: -1, chew: 0, sneeze: 0, achoo: -1, z: 0 };
    a.bl = b;
    const st = a.mo.rig;
    const dt = clamp(a.dt ?? 0, 0, 0.1);
    const dead = m.hp <= 0;
    const hurt = (a.hurtAgo ?? 9) < 0.45;
    const napping = (m.habit?.kind === 'nap' && (a.now ?? 0) < (m.habit.until ?? 0)) || m.pose === 'sleep';
    const fighting = (m.aggroUntil ?? 0) > (a.now ?? 0) || (a.now ?? 0) - (m.attackAt ?? -99) < 4 || (a.hurtAgo ?? 9) < 3;
    if (napping || dead) b.shut = true;
    // (its act, eased in and out: never while it walks, fights, naps or is posed in a scene)
    const want = dead || hurt || mv || fighting || napping ? 0 : clamp((a.calm ?? 1) * (1 - clamp(a.walkW ?? 0, 0, 1)) * (a.moving ? 0 : 1) * (m.pose || m.cine ? 0 : 1), 0, 1);
    st.blW = Number.isFinite(st.blW) ? st.blW + (want - st.blW) * Math.min(1, dt * (want < st.blW ? 9 : 4)) : want;
    const calm = st.blW;
    b.face = dead ? 'dead' : hurt ? 'hurt' : mv ? 'focus' : napping ? 'sleep' : null;
    if (calm < 0.02) return;
    const t = a.t ?? 0;
    const lu = (((t + (m.uid % 5) * 3.2) % 30) + 30) % 30;
    const hold = (x, a0, a1, b0, b1) => {
      const e = (u) => u * u * (3 - 2 * u);
      return x <= a0 || x >= b1 ? 0 : x < a1 ? e((x - a0) / (a1 - a0)) : x <= b0 ? 1 : e((b1 - x) / (b1 - b0));
    };
    const go = (pose, w) => {
      if (w > 0.001) for (const [k, v] of Object.entries(pose)) out[k] = (out[k] ?? 0) + (v - (out[k] ?? 0)) * w;
    };
    // a long breath with the whale
    const inB = hold(lu, 1, 2, 3, 3.4) * calm;
    go({ arch: 0.35, head: -14, neck: -0.2, lift: 0.8, ears: 0.6 }, inB);
    const outB = hold(lu, 3.3, 3.6, 5, 5.6) * calm;
    go({ arch: -0.1, head: 6, lift: -0.3, ears: -0.2 }, outB);
    b.open = outB;
    if (lu > 3.4 && lu < 5) b.puff = (lu - 3.4) / 1.6;
    // grazing
    const graze = hold(lu, 7, 7.6, 11.2, 11.8) * calm;
    b.chew = graze * (lu > 8.6 ? 1 : 0);
    go({ graze: 1, ears: 0.2, swish: Math.sin(lu * 5) * 0.5 }, graze);
    // a pronk, just for joy
    const pr = hold(lu, 13.4, 13.6, 14.8, 15.1) * calm;
    const spring = Math.max(0, Math.sin((lu - 13.6) * Math.PI * 1.6));
    go({ stiff: 1, hop: spring * 0.18, arch: 0.3, ears: 0.8, tailUp: -0.6 }, pr);
    // a sniff of the bloom on its back, then a sneeze
    const sniff = hold(lu, 16.5, 17, 19, 19.3) * calm;
    go({ neck: -0.6, head: -30, pitch: -4, ears: 0.4 }, sniff);
    const sneeze = hold(lu, 19.2, 19.35, 19.6, 20.2) * calm;
    b.sneeze = sneeze;
    go({ head: 16, pitch: 6, ears: -0.6, hop: 0.03 }, sneeze);
    if (lu > 19.2 && lu < 20.4) b.achoo = (lu - 19.2) / 1.2;
    // a nap
    const nap = hold(lu, 22.5, 23.4, 28, 28.8) * calm;
    go({ lie: 1, sleep: 1, head: 10, ears: -0.4 }, nap);
    b.z = nap;
    if (nap > 0.5) b.shut = true;
    if (!b.face) b.face = inB > 0.4 ? 'blink' : outB > 0.4 ? 'happy' : graze > 0.4 ? (b.chew ? 'happy' : 'open') : pr > 0.4 ? 'happy' : sniff > 0.4 ? 'blink' : sneeze > 0.3 ? 'blink' : nap > 0.4 ? 'sleep' : null;
  },
  // Its extras: a puff of pollen from its blooms on the breath out, its "achoo!", a sleepy z.
  fx: (ctx, m, a, S, K) => {
    const b = a.bl;
    const sk = K.skel(a);
    if (!b || !sk || m.hp <= 0) return;
    const s = K.sc;
    const t = a.t ?? 0;
    const hp = sk.hp;
    const text = (str, x, y, size, col, al) => {
      ctx.save();
      ctx.globalAlpha *= al;
      ctx.translate(x, y);
      if (a.flip) ctx.scale(-1, 1);
      ctx.font = `800 ${size}px Nunito, "Trebuchet MS", sans-serif`;
      ctx.lineWidth = Math.max(1, size * 0.22);
      ctx.strokeStyle = '#ffffff';
      ctx.fillStyle = col;
      ctx.textAlign = 'center';
      ctx.strokeText(str, 0, 0);
      ctx.fillText(str, 0, 0);
      ctx.restore();
    };
    const spark = (x, y, r, al, col) => {
      if (al <= 0.01) return;
      ctx.save();
      ctx.globalAlpha *= al;
      ctx.beginPath();
      ctx.moveTo(x, y - r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.quadraticCurveTo(x, y, x, y + r);
      ctx.quadraticCurveTo(x, y, x - r, y);
      ctx.quadraticCurveTo(x, y, x, y - r);
      ctx.fillStyle = col;
      ctx.fill();
      ctx.restore();
    };
    if (b.puff >= 0) {
      // a few soft sparkles of pollen drifting up off its back
      const u = b.puff;
      const back = sk.bodyPt([-3, -9, 0, 0, 0]);
      for (let i = 0; i < 3; i++) spark(back[0] - s(4) + i * s(4), back[1] - s(2) - u * s(7) - i * s(1.2), s(1.1), Math.sin(Math.PI * u), i === 1 ? '#ffffff' : COL.pollen);
    }
    if (b.achoo >= 0) {
      const u = b.achoo;
      text('achoo!', hp[0] + s(8), hp[1] - s(6) - u * s(3), s(4.2), COL.note, Math.sin(Math.PI * u));
      spark(hp[0] + s(12) + u * s(4), hp[1] + s(2) - u * s(2), s(1), 1 - u, COL.pollen);
    }
    if (b.z > 0.3) {
      const u = (t * 0.45) % 1;
      text('z', hp[0] + s(3 + u * 4), hp[1] - s(7 + u * 6), s(4 + u * 2), COL.note, b.z * Math.sin(Math.PI * u));
    }
  },
};

const D = dressedHoof(LOOK);
export const AIRBLOOM_LAMB_ART = { ...D.art, noHop: true };
export const AIRBLOOM_LAMB_SIZE = { w: Math.round(D.w), h: Math.round(D.h), speed: D.speed };
