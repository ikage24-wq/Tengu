// The Snowpuff Hare (2026-11-27, new for the Cloud Meadows and Frozen Peak's lake shore, in the Whistledown
// Marmot's place: the player wanted the late regulars to be new creatures that fit their place, each on its
// own base; the id stays `cloudsheep`). A snow-white hare of the high meadows whose winter coat comes in as
// cloud: a big cloud puff for a tail and a fluffy cloud ruff round its neck. Long ears with blush-pink tips
// that it turns into the wind like sails; sky-blue eyes with a crescent of shine. It nibbles cloud like
// clover. It moves on its own copy of the bunny base (harebase.js, its hare: long legs, a bounding hop,
// the springs and moves), dressed here.
import { dressedBunny } from './harebase.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ell = (ctx, x, y, rx, ry, r = 0) => {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, r, 0, TAU);
};
const INK = '#8a94c8';
const COL = {
  cloud: '#ffffff', cloudSh: '#dfe6fa', cloudDeep: '#c6d2f0',
  tip: '#ffb8cc', eye: '#2c3a6a', iris: '#6aa6f0', irisLt: '#a8d4ff', blush: '#ff9eb8', mouth: '#a06a82',
  wind: '#ffffff', note: '#7a8ad8',
};
// (a soft cloud: overlapping rounds, outlined only round the outside in the line pass)
function cloudPuff(ctx, a, K, mode, blobs) {
  if (mode === 'line') {
    ctx.beginPath();
    for (const [x, y, r] of blobs) {
      ctx.moveTo(x + r, y);
      ctx.arc(x, y, r, 0, TAU);
    }
    K.edge(ctx);
    return;
  }
  for (const [x, y, r] of blobs) {
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.4, r * 0.1, x, y, r);
    g.addColorStop(0, K.colour(a, COL.cloud));
    g.addColorStop(0.7, K.colour(a, COL.cloud));
    g.addColorStop(1, K.colour(a, COL.cloudSh));
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fillStyle = g;
    ctx.fill();
  }
  // a soft shade low across the whole puff
  ctx.save();
  ctx.beginPath();
  for (const [x, y, r] of blobs) {
    ctx.moveTo(x + r, y);
    ctx.arc(x, y, r, 0, TAU);
  }
  ctx.clip('nonzero');
  const low = Math.max(...blobs.map(([, y, r]) => y + r));
  const g = ctx.createLinearGradient(0, low - 6, 0, low);
  g.addColorStop(0, 'rgba(198,210,240,0)');
  g.addColorStop(1, K.colour(a, COL.cloudDeep));
  ctx.fillStyle = g;
  ctx.fillRect(-200, low - 6, 400, 7);
  ctx.restore();
}

// ---------- Its face (the head's frame) ----------
// Its eyes: round, sky blue below, a crescent of shine across the top.
function eye(ctx, a, K, x, y, f) {
  const s = K.sc;
  const r = s(2.1);
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
    ctx.lineWidth = r * 0.3;
    ctx.beginPath();
    const up = f === 'happy' ? -1 : 1;
    ctx.moveTo(x - r * 0.95, y);
    ctx.quadraticCurveTo(x, y + up * r * 0.8, x + r * 0.95, y);
    ctx.stroke();
    return;
  }
  const k = f === 'startled' ? 1.1 : 1;
  ell(ctx, x, y, r * 0.9 * k, r * k);
  ctx.fillStyle = K.colour(a, COL.eye);
  ctx.fill();
  const g = ctx.createLinearGradient(x, y - r * 0.2, x, y + r);
  g.addColorStop(0, K.colour(a, COL.iris));
  g.addColorStop(1, K.colour(a, COL.irisLt));
  ell(ctx, x, y + r * 0.35, r * 0.66, r * 0.55);
  ctx.fillStyle = g;
  ctx.fill();
  // the crescent of shine
  ctx.beginPath();
  ctx.arc(x - r * 0.1, y - r * 0.15, r * 0.62, Math.PI * 1.05, Math.PI * 1.85);
  ctx.arc(x - r * 0.05, y + r * 0.05, r * 0.62, Math.PI * 1.75, Math.PI * 1.15, true);
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ell(ctx, x + r * 0.35, y + r * 0.4, r * 0.14, r * 0.14);
  ctx.fill();
  if (f === 'focus') {
    ctx.fillStyle = K.colour(a, K.C.base);
    ctx.fillRect(x - r * 1.2, y - r * 1.5, r * 2.4, r * 0.85);
  }
}
const faceOf = (a) => a.sh?.face ?? ((((a.t ?? 0) + (a.mo?.uid ?? 0) * 0.41) % 4.6) < 0.13 ? 'blink' : 'open');
function face(ctx, a, sk, K) {
  const s = K.sc;
  const f = faceOf(a);
  K.glow(ctx, [s(4.2), s(3)], s(2.2), 0.6, COL.blush);
  eye(ctx, a, K, s(3.6), s(-1.2), f);
  ctx.strokeStyle = K.colour(a, COL.mouth);
  ctx.lineWidth = s(0.4);
  ctx.lineCap = 'round';
  const mx = s(8.6);
  const my = s(3.6);
  const sh = a.sh ?? {};
  if (f === 'startled' || (sh.chew ?? 0) > 0.3) {
    ell(ctx, mx, my + s(0.4), s(0.55), s(0.5 + (sh.chew ?? 0) * Math.abs(Math.sin((a.t ?? 0) * 14)) * 0.3));
    ctx.fillStyle = K.colour(a, COL.mouth);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(mx - s(0.9), my);
    ctx.quadraticCurveTo(mx - s(0.45), my + s(0.6), mx, my);
    ctx.quadraticCurveTo(mx + s(0.45), my + s(0.6), mx + s(0.9), my);
    ctx.stroke();
  }
}

// ---------- Its cloud tail, its cloud ruff, its ear tips ----------
function tail(ctx, a, mode, K) {
  const sk = a.bk;
  const s = K.sc;
  const c = sk.tail?.c ?? sk.tail ?? null;
  if (!c) return;
  const fl = (a.sh?.flutter ?? 0) * Math.sin((a.t ?? 0) * 18) * s(0.4);
  cloudPuff(ctx, a, K, mode, [
    [c[0] - s(1.2), c[1] + fl, s(3.2)],
    [c[0] + s(1.4), c[1] - s(1.4), s(2.7)],
    [c[0] - s(0.2), c[1] - s(2.6) + fl, s(2.5)],
    [c[0] + s(1.6), c[1] + s(1.4), s(2.3)],
  ]);
}
function ruff(ctx, a, mode, K) {
  const s = K.sc;
  K.headFrame(ctx, a);
  const fl = (a.sh?.flutter ?? 0) * Math.sin((a.t ?? 0) * 16) * s(0.3);
  // (one soft collar of cloud under its chin: big rounds overlapping well, never a row of beads)
  cloudPuff(ctx, a, K, mode, [
    [s(-3.4), s(5.6) + fl, s(3.6)],
    [s(0.6), s(7), s(3.4)],
    [s(-6.2), s(3), s(2.8)],
  ]);
}

const LOOK = {
  ink: INK,
  C: { lt: '#ffffff', base: '#f2f4ff', sh: '#d8def4', deep: '#bcc6e6', guide: '#f2f4ff', nose: '#ff9eb8', inner: '#ffd2e2', tip: '#ffaac4', tipFar: '#e898b4' },
  face,
  over: { tail },
  // (the ruff under the head, so the head sits in it)
  under: {
    head: (ctx, a, mode, K) => {
      ctx.save();
      ruff(ctx, a, mode, K);
      ctx.restore();
    },
  },
  // (its own sprung channel: the near forepaw up over its head, washing an ear)
  channels: { reach: [170, 21] },
  // Its act, about 30 s, the meadow's cloud hare (on the base's channels: x, lift, hop, pitch, hunch,
  // crouch, sit, lie, loaf, kick, stamp, paws, neck, head, jaw, ears, and reach):
  //   - up on its haunches, ears turned into the wind like sails, its cloud fluff fluttering;
  //   - a nibble of a passing wisp of cloud, chewed like clover;
  //   - a thump of a hind foot, a little puff of cloud kicked up ("thump!");
  //   - washing an ear, the near forepaw drawing it down;
  //   - a happy bound on the spot, ears flopping;
  //   - a loaf in the grass, eyes shut, a "z".
  pose: (m, a, out, K, mv) => {
    const sh = { face: null, flutter: 0, wind: 0, wisp: -1, chew: 0, thump: -1, z: 0 };
    a.sh = sh;
    const st = a.mo.rig;
    const dt = clamp(a.dt ?? 0, 0, 0.1);
    const dead = m.hp <= 0;
    const hurt = (a.hurtAgo ?? 9) < 0.45;
    const napping = (m.habit?.kind === 'nap' && (a.now ?? 0) < (m.habit.until ?? 0)) || m.pose === 'sleep';
    const fighting = (m.aggroUntil ?? 0) > (a.now ?? 0) || (a.now ?? 0) - (m.attackAt ?? -99) < 4 || (a.hurtAgo ?? 9) < 3;
    // (its act, eased in and out: never while it walks, fights, naps or is posed in a scene)
    const want = dead || hurt || mv || fighting || napping ? 0 : clamp((a.calm ?? 1) * (1 - clamp(a.walkW ?? 0, 0, 1)) * (a.moving ? 0 : 1) * (m.pose || m.cine ? 0 : 1), 0, 1);
    st.shW = Number.isFinite(st.shW) ? st.shW + (want - st.shW) * Math.min(1, dt * (want < st.shW ? 9 : 4)) : want;
    const calm = st.shW;
    sh.face = dead ? 'dead' : hurt ? 'hurt' : mv ? 'focus' : napping ? 'sleep' : null;
    if (calm < 0.02) return;
    const t = a.t ?? 0;
    const lu = (((t + (m.uid % 5) * 3.5) % 30) + 30) % 30;
    const hold = (x, a0, a1, b0, b1) => {
      const e = (u) => u * u * (3 - 2 * u);
      return x <= a0 || x >= b1 ? 0 : x < a1 ? e((x - a0) / (a1 - a0)) : x <= b0 ? 1 : e((b1 - x) / (b1 - b0));
    };
    const go = (pose, w) => {
      if (w > 0.001) for (const [k, v] of Object.entries(pose)) out[k] = (out[k] ?? 0) + (v - (out[k] ?? 0)) * w;
    };
    // ears into the wind
    const sail = hold(lu, 1, 1.6, 5, 5.6) * calm;
    sh.wind = sail;
    sh.flutter = sail;
    go({ sit: 0.75, ears: 0.55 + Math.sin(lu * 9) * 0.12, head: -6, neck: 0.15 }, sail);
    // a nibble of a passing wisp of cloud
    const nib = hold(lu, 7, 7.5, 10.6, 11.1) * calm;
    if (lu > 6.8 && lu < 8.4) sh.wisp = (lu - 6.8) / 1.6;
    sh.chew = nib * (lu > 8.2 ? 1 : 0);
    go({ neck: 0.5, head: lu < 8.2 ? -6 : 4, jaw: sh.chew * Math.max(0, Math.sin(lu * 14)) * 0.5, ears: 0.2 }, nib);
    // a thump
    const th = hold(lu, 12.5, 12.9, 14.2, 14.6) * calm;
    const beat = lu > 13 && lu < 13.9 ? Math.max(0, Math.sin((lu - 13) * Math.PI * 2.2)) : 0;
    go({ stamp: beat, crouch: 0.3, ears: 0.8, head: 4 }, th);
    if (lu > 13.2 && lu < 14.2) sh.thump = (lu - 13.2) / 1;
    // washing an ear
    const wash = hold(lu, 16, 16.5, 19.2, 19.7) * calm;
    go({ sit: 0.85, reach: 0.85 + Math.sin(lu * 8) * 0.1, head: 14, ears: -0.4 }, wash);
    // a happy bound on the spot
    const hp = hold(lu, 21, 21.2, 22.6, 22.9) * calm;
    const bnd = Math.max(0, Math.sin((lu - 21.2) * Math.PI * 1.4));
    go({ hop: bnd * 0.16, kick: bnd * 0.6, ears: -0.6 * bnd, pitch: -bnd * 6 }, hp);
    // a loaf in the grass
    const loaf = hold(lu, 24, 24.8, 28.4, 29) * calm;
    go({ loaf: 1, head: 6, ears: -0.5 }, loaf);
    sh.z = loaf;
    if (!sh.face) sh.face = sail > 0.4 ? 'blink' : nib > 0.4 ? (sh.chew > 0.3 ? 'happy' : 'open') : sh.thump >= 0 ? 'focus' : wash > 0.4 ? 'blink' : hp > 0.4 ? 'happy' : loaf > 0.4 ? 'sleep' : null;
  },
  // Its extras: soft wind lines past its ears, the wisp of cloud it nibbles, the puff from its thump, a z.
  fx: (ctx, m, a, K) => {
    const sh = a.sh;
    const sk = a.bk;
    if (!sh || !sk || m.hp <= 0) return;
    const s = K.sc;
    const t = a.t ?? 0;
    const hd = sk.hp ?? sk.head ?? [0, -K.H];
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
    const puff = (x, y, r, al) => {
      if (al <= 0.01) return;
      ctx.save();
      ctx.globalAlpha *= al;
      for (const [dx, dy, k] of [[0, 0, 1], [r * 0.8, r * 0.2, 0.75], [-r * 0.75, r * 0.25, 0.7], [r * 0.2, -r * 0.5, 0.7]]) {
        ctx.beginPath();
        ctx.arc(x + dx, y + dy, r * k, 0, TAU);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }
      ctx.restore();
    };
    if (sh.wind > 0.3) {
      // soft wind lines streaming past
      ctx.save();
      ctx.strokeStyle = COL.wind;
      ctx.lineCap = 'round';
      ctx.lineWidth = s(0.5);
      for (let i = 0; i < 3; i++) {
        const u = (t * 0.9 + i / 3) % 1;
        const y = hd[1] - s(4) + i * s(4);
        const x = hd[0] + s(9) - u * s(18);
        ctx.globalAlpha = sh.wind * Math.sin(Math.PI * u) * 0.75;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x - s(3), y - s(1.2), x - s(6), y);
        ctx.stroke();
      }
      ctx.restore();
    }
    if (sh.wisp >= 0) {
      // a little wisp of cloud drifting in to its mouth, nibbled away
      const u = sh.wisp;
      const mx = hd[0] + s(9);
      const my = hd[1] + s(3);
      puff(mx + s(10) * (1 - u), my - s(3) * (1 - u), s(1.6) * (1 - u * 0.7), Math.min(1, (1 - u) * 3));
    }
    if (sh.thump >= 0) {
      const u = sh.thump;
      // (by its hind feet, just ahead of its tail)
      const fx = [(sk.tail?.[0] ?? hd[0] - s(14)) + s(5), 0];
      puff(fx[0] - s(2) - u * s(3), -s(1) - u * s(2), s(1.4 + u * 1.2), 1 - u);
      puff(fx[0] + s(2) + u * s(3), -s(1) - u * s(1.6), s(1.2 + u * 1), 1 - u);
      if (u < 0.8) text('thump!', fx[0], -s(10) - u * s(3), s(4.2), COL.note, Math.sin((Math.PI * u) / 0.8));
    }
    if (sh.z > 0.3) {
      const u = (t * 0.45) % 1;
      text('z', hd[0] + s(4 + u * 4), hd[1] - s(8 + u * 6), s(4 + u * 2), COL.note, sh.z * Math.sin(Math.PI * u));
    }
  },
};

const B = dressedBunny(LOOK);
export const SNOWPUFF_HARE_ART = { ...B.art, noHop: true };
export const SNOWPUFF_HARE_SIZE = { w: Math.round(B.w), h: Math.round(B.h), speed: B.speed };
