// The Gummy Caterpillar (2026-11-27, new for the Candy Volcano, in the Jelly Bean Meerkat's place: the
// player wanted the late regulars to be new creatures that fit their place, each on its own base; the id
// stays `jellyninja`). A caterpillar made of gummy candy: each round segment a different fruit flavour
// (blue raspberry at the tail, then lime, lemon, orange, strawberry), glossy and see-through like a
// real gummy, a soft pink head, eyes shaped like little gumdrops, a gumdrop on each feeler. It slurps
// licorice laces from the mine like spaghetti and flicks jelly beans at you. It moves on its own copy of
// the round bug base (caterbase.js, its caterpillar: the crawl, the inchworm loop, the curl), dressed here.
import { dressedCaterpillar } from './caterbase.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ell = (ctx, x, y, rx, ry, r = 0) => {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, r, 0, TAU);
};
// (each segment's flavour, tail first: its colour, its light, its shade)
const FLAVOURS = [
  ['#7cc0ff', '#d4ecff', '#4f94e0'],
  ['#8edc7c', '#d6f6c8', '#5cb058'],
  ['#ffe066', '#fff6c4', '#e8b83a'],
  ['#ffae5c', '#ffe0bc', '#e8843a'],
  ['#ff8fa8', '#ffd6e0', '#e0607e'],
];
const COL = {
  head: '#ffc4d6', headLt: '#fff0f4', headSh: '#f09ab4',
  eye: '#3a2440', eyeLt: '#7a4a7a', blush: '#ff7e9e', mouth: '#9a3a5c', tongue: '#ff7e9e',
  lace: '#3c2a3a', laceLt: '#6a4a62', note: '#e0607e',
};

// ---------- Its gummy segments (redrawn over the base's, each its own flavour) ----------
function segs(ctx, a, mode, K) {
  if (mode !== 'fill') return;
  const sk = a.bk;
  const n = K.n;
  for (let k = 0; k < n; k++) {
    const [x, y] = sk.pts[k];
    const r = K.RAD[k];
    const [c, lt, sh] = FLAVOURS[k % FLAVOURS.length];
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    // see-through jelly: a soft deeper rim, a bright clear middle
    const g = ctx.createRadialGradient(x - r * 0.15, y - r * 0.2, r * 0.1, x, y, r);
    g.addColorStop(0, K.tone(a, lt));
    g.addColorStop(0.55, K.tone(a, c));
    g.addColorStop(1, K.tone(a, sh));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.clip();
    // the gloss: a long soft shine across the top, a small bright one, a glow low in the jelly
    ell(ctx, x - r * 0.18, y - r * 0.56, r * 0.58, r * 0.22, -0.25);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fill();
    ell(ctx, x + r * 0.42, y - r * 0.32, r * 0.12, r * 0.12);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fill();
    ell(ctx, x + r * 0.1, y + r * 0.55, r * 0.55, r * 0.26);
    ctx.fillStyle = K.tone(a, lt);
    ctx.globalAlpha *= 0.45;
    ctx.fill();
    ctx.restore();
    // where it lies over the one behind: a soft line of its own shade
    if (k > 0) {
      const [bx, by] = sk.pts[k - 1];
      ctx.save();
      ctx.beginPath();
      ctx.arc(bx, by, K.RAD[k - 1], 0, TAU);
      ctx.clip();
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.strokeStyle = K.tone(a, sh);
      ctx.lineWidth = K.sc(0.6);
      ctx.stroke();
      ctx.restore();
    }
  }
}
// (the head's own pink, over the base's lilac; the face goes on after)
function headTint(ctx, a, r, K) {
  const g = ctx.createRadialGradient(-r * 0.2, -r * 0.35, r * 0.1, 0, 0, r);
  g.addColorStop(0, K.tone(a, COL.headLt));
  g.addColorStop(0.6, K.tone(a, COL.head));
  g.addColorStop(1, K.tone(a, COL.headSh));
  ctx.fillStyle = g;
  ctx.fillRect(-r, -r, r * 2, r * 2);
  ell(ctx, -r * 0.2, -r * 0.58, r * 0.5, r * 0.2, -0.2);
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.fill();
}

// ---------- Its face (the head's frame: about its middle, the face to the right) ----------
// Its eyes: little gumdrops, round on top and flat-ish below, a shine and a dot.
function eye(ctx, a, K, x, y, s, f) {
  ctx.lineCap = 'round';
  ctx.strokeStyle = K.tone(a, COL.eye);
  if (f === 'hurt') {
    ctx.lineWidth = s * 0.34;
    ctx.beginPath();
    ctx.moveTo(x - s * 0.8, y - s * 0.7);
    ctx.lineTo(x + s * 0.5, y);
    ctx.lineTo(x - s * 0.8, y + s * 0.7);
    ctx.stroke();
    return;
  }
  if (f === 'blink' || f === 'sleep' || f === 'dead' || f === 'happy') {
    ctx.lineWidth = s * 0.32;
    ctx.beginPath();
    const up = f === 'happy' ? -1 : 1;
    ctx.moveTo(x - s * 0.9, y + s * 0.2);
    ctx.quadraticCurveTo(x, y + s * 0.2 + up * s * 0.8, x + s * 0.9, y + s * 0.2);
    ctx.stroke();
    return;
  }
  const k = f === 'ooh' ? 1.1 : 1;
  ctx.beginPath();
  ctx.moveTo(x - s * 0.9 * k, y + s * 0.85 * k);
  ctx.bezierCurveTo(x - s * 1.0 * k, y - s * 0.4 * k, x - s * 0.6 * k, y - s * 1.15 * k, x, y - s * 1.15 * k);
  ctx.bezierCurveTo(x + s * 0.6 * k, y - s * 1.15 * k, x + s * 1.0 * k, y - s * 0.4 * k, x + s * 0.9 * k, y + s * 0.85 * k);
  ctx.quadraticCurveTo(x, y + s * 1.05 * k, x - s * 0.9 * k, y + s * 0.85 * k);
  ctx.closePath();
  ctx.fillStyle = K.tone(a, COL.eye);
  ctx.fill();
  ell(ctx, x, y + s * 0.5, s * 0.6, s * 0.3);
  ctx.fillStyle = K.tone(a, COL.eyeLt);
  ctx.fill();
  ell(ctx, x - s * 0.3, y - s * 0.45, s * 0.34, s * 0.4, -0.3);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ell(ctx, x + s * 0.36, y + s * 0.1, s * 0.14, s * 0.14);
  ctx.fill();
  if (f === 'focus') {
    ctx.fillStyle = K.tone(a, COL.head);
    ctx.fillRect(x - s * 1.2, y - s * 1.5, s * 2.4, s * 0.85);
  }
}
const faceOf = (a) => a.gp?.face ?? ((((a.t ?? 0) + (a.mo?.uid ?? 0) * 0.43) % 4.4) < 0.13 ? 'blink' : 'open');
function face(ctx, a, sk, K, r) {
  headTint(ctx, a, r, K);
  const f = faceOf(a);
  const g = a.gp ?? {};
  ell(ctx, r * 0.02, r * 0.38, r * 0.2, r * 0.11);
  ctx.fillStyle = K.tone(a, COL.blush);
  ctx.globalAlpha *= 0.55;
  ctx.fill();
  ell(ctx, r * 0.86, r * 0.34, r * 0.12, r * 0.09);
  ctx.fill();
  ctx.globalAlpha /= 0.55;
  eye(ctx, a, K, r * 0.28, -r * 0.08, r * 0.2, f);
  eye(ctx, a, K, r * 0.72, -r * 0.1, r * 0.15, f);
  const mx = r * 0.56;
  const my = r * 0.4;
  ctx.strokeStyle = K.tone(a, COL.mouth);
  ctx.lineWidth = Math.max(0.35, r * 0.06);
  ctx.lineCap = 'round';
  ctx.beginPath();
  if ((g.slurp ?? 0) > 0.3 || f === 'ooh' || f === 'hurt') {
    ell(ctx, mx, my, r * 0.09, r * 0.11);
    ctx.fillStyle = K.tone(a, COL.mouth);
    ctx.fill();
  } else if ((g.tongue ?? 0) > 0.05) {
    ctx.moveTo(mx - r * 0.16, my - r * 0.04);
    ctx.quadraticCurveTo(mx, my + r * 0.14, mx + r * 0.16, my - r * 0.04);
    ctx.stroke();
    ell(ctx, mx + r * 0.04, my + r * 0.08 + g.tongue * r * 0.08, r * 0.08, r * 0.06 + g.tongue * r * 0.06);
    ctx.fillStyle = K.tone(a, COL.tongue);
    ctx.fill();
  } else if (f === 'focus') {
    ctx.moveTo(mx - r * 0.12, my);
    ctx.lineTo(mx + r * 0.12, my - r * 0.01);
    ctx.stroke();
  } else {
    // a little "w"
    ctx.moveTo(mx - r * 0.17, my - r * 0.04);
    ctx.quadraticCurveTo(mx - r * 0.085, my + r * 0.1, mx, my - r * 0.01);
    ctx.quadraticCurveTo(mx + r * 0.085, my + r * 0.1, mx + r * 0.17, my - r * 0.04);
    ctx.stroke();
  }
}

// ---------- A gumdrop on each feeler's tip ----------
function gumdrop(ctx, a, mode, K, f, col) {
  const [x, y] = f.tip;
  const s = f.r * 1.25;
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(x - s, y + s * 0.6);
    ctx.bezierCurveTo(x - s * 1.05, y - s * 0.3, x - s * 0.5, y - s * 1.1, x, y - s * 1.1);
    ctx.bezierCurveTo(x + s * 0.5, y - s * 1.1, x + s * 1.05, y - s * 0.3, x + s, y + s * 0.6);
    ctx.quadraticCurveTo(x, y + s * 0.85, x - s, y + s * 0.6);
    ctx.closePath();
  };
  path();
  if (mode === 'line') {
    ctx.strokeStyle = K.ink;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();
    return;
  }
  ctx.fillStyle = K.tone(a, col[0]);
  ctx.fill();
  ell(ctx, x - s * 0.35, y - s * 0.45, s * 0.32, s * 0.22, -0.4);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fill();
}

const INK = '#9a5a82';
const LOOK = {
  // (its soft candy pink: the little feet, the feelers, under the head)
  C: { lt: '#fff0f4', base: '#ffd0de', sh: '#f2a8c0', deep: '#d88aa8', guide: '#ffd0de', nose: '#d88aa8', mouth: '#9a3a5c' },
  ink: INK,
  face,
  over: {
    segs,
    antN: (ctx, a, mode, K) => !a.bk.tucked && gumdrop(ctx, a, mode, { ...K, ink: INK }, a.bk.ant.near, FLAVOURS[2]),
    antF: (ctx, a, mode, K) => !a.bk.tucked && gumdrop(ctx, a, mode, { ...K, ink: INK }, a.bk.ant.far, FLAVOURS[0]),
  },
  // Its act, about 30 s, the candy mine's gummy (on the base's channels: x, hop, lift, pitch, crouch,
  // head, ant, curl, rear, arch, sway, sleep):
  //   - a licorice lace slurped up like spaghetti, its front up, the lace shortening into its mouth;
  //   - a little dance, swaying side to side to a tune, feelers bobbing;
  //   - a sprinkle falling from above, caught on its tongue, "ooh!" then a happy chew;
  //   - curled up into a gummy ball for a little roll forward and back;
  //   - a nap curled up, a "z"; then a big inchworm stretch.
  pose: (m, a, out, K, mv) => {
    const g = { face: null, lace: 0, laceU: 0, slurp: 0, dance: 0, sprinkle: -1, tongue: 0, chew: 0, ball: 0, z: 0 };
    a.gp = g;
    const st = a.mo.rig;
    const dt = clamp(a.dt ?? 0, 0, 0.1);
    const dead = m.hp <= 0;
    const hurt = (a.hurtAgo ?? 9) < 0.45;
    const napping = (m.habit?.kind === 'nap' && (a.now ?? 0) < (m.habit.until ?? 0)) || m.pose === 'sleep';
    const fighting = (m.aggroUntil ?? 0) > (a.now ?? 0) || (a.now ?? 0) - (m.attackAt ?? -99) < 4 || (a.hurtAgo ?? 9) < 3;
    // (its act, eased in and out: never while it walks, fights, naps or is posed in a scene)
    const want = dead || hurt || mv || fighting || napping ? 0 : clamp((a.calm ?? 1) * (1 - clamp(a.walkW ?? 0, 0, 1)) * (a.moving ? 0 : 1) * (m.pose || m.cine ? 0 : 1), 0, 1);
    st.gpW = Number.isFinite(st.gpW) ? st.gpW + (want - st.gpW) * Math.min(1, dt * (want < st.gpW ? 9 : 4)) : want;
    const calm = st.gpW;
    g.face = dead ? 'dead' : hurt ? 'hurt' : mv ? 'focus' : napping ? 'sleep' : null;
    if (calm < 0.02) return;
    const t = a.t ?? 0;
    const lu = (((t + (m.uid % 5) * 3.1) % 30) + 30) % 30;
    const hold = (x, a0, a1, b0, b1) => {
      const e = (u) => u * u * (3 - 2 * u);
      return x <= a0 || x >= b1 ? 0 : x < a1 ? e((x - a0) / (a1 - a0)) : x <= b0 ? 1 : e((b1 - x) / (b1 - b0));
    };
    const go = (pose, w) => {
      if (w > 0.001) for (const [k, v] of Object.entries(pose)) out[k] = (out[k] ?? 0) + (v - (out[k] ?? 0)) * w;
    };
    // a licorice lace, slurped up
    const lace = hold(lu, 1, 1.5, 5, 5.5) * calm;
    g.lace = lace;
    g.laceU = clamp((lu - 1.8) / 2.8, 0, 1);
    const sl = lu > 1.8 && lu < 4.6 ? Math.max(0, Math.sin((lu - 1.8) * 9)) : 0;
    g.slurp = lace * (lu < 4.6 ? 1 : 0);
    go({ rear: 0.35 + sl * 0.06, head: 10 - sl * 6, ant: 0.3 + sl * 0.3 }, lace);
    g.chew = lace * (lu > 4.6 ? 1 : 0);
    // a little dance
    const dance = hold(lu, 7, 7.5, 11.2, 11.8) * calm;
    g.dance = dance;
    const beat = Math.sin((lu - 7.5) * 5.2);
    go({ sway: beat * 0.9, rear: 0.15 + Math.abs(beat) * 0.12, head: -beat * 10, ant: 0.4 + beat * 0.5, hop: Math.max(0, -Math.cos((lu - 7.5) * 10.4)) * 0.04 }, dance);
    // a sprinkle caught on its tongue
    const catchIt = hold(lu, 13, 13.5, 16.4, 17) * calm;
    go({ rear: 0.42, head: -22, ant: 0.8 }, catchIt);
    if (lu > 13.4 && lu < 14.9) g.sprinkle = (lu - 13.4) / 1.5;
    g.tongue = catchIt * (lu > 13.9 && lu < 15 ? 1 : 0);
    if (lu > 15 && lu < 16.6) g.chew = Math.max(g.chew, catchIt);
    // a gummy ball, rolled forward and back
    const ball = hold(lu, 18.5, 19, 21.4, 21.9) * calm;
    g.ball = ball;
    go({ curl: 0.9, x: Math.sin((lu - 19) * 2.4) * 0.12, head: 20, ant: -0.6 }, ball);
    // a nap curled up, then a big inchworm stretch
    const nap = hold(lu, 23, 23.8, 27.6, 28.2) * calm;
    go({ curl: 0.92, head: 28, ant: -1, sleep: 1 }, nap);
    g.z = nap;
    const stretch = hold(lu, 28.2, 28.6, 29.2, 29.7) * calm;
    go({ arch: 0.6, rear: 0.2, head: -10, ant: 0.9 }, stretch);
    if (!g.face) g.face = lace > 0.4 ? (g.chew > 0.4 ? 'happy' : 'focus') : dance > 0.4 ? 'happy' : g.sprinkle >= 0 ? 'ooh' : catchIt > 0.4 ? 'happy' : ball > 0.4 ? 'blink' : nap > 0.4 ? 'sleep' : stretch > 0.4 ? 'blink' : null;
  },
  // Its extras: the licorice lace and its "slurp!", notes as it dances, the falling sprinkle, a sleepy z.
  fx: (ctx, m, a, K) => {
    const g = a.gp;
    const sk = a.bk;
    if (!g || !sk || m.hp <= 0) return;
    const t = a.t ?? 0;
    const hc = sk.hc;
    const r = sk.r;
    const mouth = [hc[0] + Math.cos(sk.ha) * r * 0.56 - Math.sin(sk.ha) * r * 0.4, hc[1] + Math.sin(sk.ha) * r * 0.56 + Math.cos(sk.ha) * r * 0.4];
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
    if (g.lace > 0.05 && g.laceU < 1) {
      // the lace: from its mouth down to the floor in a soft wavy line, shortening as it slurps
      const left = 1 - g.laceU;
      const len = 4 + left * 16;
      ctx.save();
      ctx.globalAlpha *= Math.min(1, g.lace * 1.5);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(...mouth);
      const N = 10;
      for (let i = 1; i <= N; i++) {
        const u = i / N;
        const y = Math.min(-0.6, mouth[1] + u * len);
        const x = mouth[0] + 1 + u * 2 + Math.sin(u * 7 + t * 14 * g.slurp) * 1.1 * u;
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = COL.lace;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.strokeStyle = COL.laceLt;
      ctx.lineWidth = 0.5;
      ctx.stroke();
      ctx.restore();
      if (g.slurp > 0.4) {
        const u = (t * 1.1) % 1;
        text('slurp!', mouth[0] + 6, mouth[1] - 6 - u * 3, 4, COL.note, g.slurp * Math.sin(Math.PI * u));
      }
    }
    if (g.chew > 0.4) {
      const u = (t * 1.6) % 1;
      text('nom', hc[0] + r + 3, hc[1] - r * 0.4 - u * 2, 3.6, COL.note, g.chew * Math.sin(Math.PI * u));
    }
    if (g.dance > 0.4) {
      for (let i = 0; i < 2; i++) {
        const u = (t * 0.6 + i * 0.5) % 1;
        text('♪', hc[0] + i * 6 + u * 2, hc[1] - r - u * 4, 3.6 + u * 0.6, i ? '#4f94e0' : COL.note, g.dance * Math.sin(Math.PI * u));
      }
    }
    if (g.sprinkle >= 0) {
      // a candy sprinkle tumbling down onto its tongue
      const u = g.sprinkle;
      const fall = Math.min(1, u / 0.4);
      const x = mouth[0] + 0.4;
      const y = mouth[1] - 9 * (1 - fall * fall) - 0.6;
      ctx.save();
      ctx.globalAlpha *= u < 0.4 ? 1 : Math.max(0, 1 - (u - 0.4) * 4);
      ctx.translate(x, y);
      ctx.rotate(t * 6);
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#7cc0ff';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(-1, 0);
      ctx.lineTo(1, 0);
      ctx.stroke();
      ctx.restore();
      if (u > 0.4 && u < 0.95) text('ooh!', hc[0] + r + 4, hc[1] - r * 0.5, 4, COL.note, Math.sin((Math.PI * (u - 0.4)) / 0.55));
    }
    if (g.z > 0.3) {
      const u = (t * 0.45) % 1;
      text('z', hc[0] + 2 + u * 4, hc[1] - r - 2 - u * 8, 4 + u * 2.4, '#b07ad0', g.z * Math.sin(Math.PI * u));
    }
  },
};

const D = dressedCaterpillar(LOOK);
export const GUMMY_CATERPILLAR_ART = { ...D.art, noHop: true };
export const GUMMY_CATERPILLAR_SIZE = { w: Math.round(D.w), h: Math.round(D.h), speed: D.speed };
