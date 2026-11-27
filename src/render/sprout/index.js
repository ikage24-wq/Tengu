// The Sticky-Note Sprout (2026-11-27, new for Act II: The Office, in the Intern Quokka's place: the player
// wanted the late regulars to be new creatures that fit their place, each on its own base). The office's
// desk plant come to life: its round body is a white coffee mug (a blue band with a little heart, a
// handle at its back), a sprout growing out of the coffee grounds on top, its two seed-leaves a yellow
// and a pink sticky note with notes scribbled on them. Round eyes and a blush on the mug's front; it
// waddles on little feet and still throws paper planes. It moves on its own copy of the veggie critter
// base (veggiebase.js, its sprout: bones, waddle, springs and moves), dressed here; its face from scratch.
import { dressedVeggie } from './veggiebase.js';

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
const INK = '#8a86a8';
const COL = {
  band: '#7aa8e8',
  bandSh: '#5a88cc',
  heart: '#ff8fa8',
  grounds: '#8a6248',
  groundsLt: '#a87a5a',
  handle: '#f4f2fa',
  eye: '#3a2e48',
  blush: '#ff9cb6',
  noteY: '#ffe98a',
  noteYsh: '#f2cf58',
  noteP: '#ffbfd4',
  notePsh: '#f29ab8',
  scribble: '#b0a0c8',
};

// ---------- Its face (on the mug's front) ----------
function eye(ctx, a, K, x, y, r, f) {
  ctx.lineCap = 'round';
  ctx.strokeStyle = K.colour(a, COL.eye);
  if (f === 'hurt') {
    ctx.lineWidth = 0.42;
    ctx.beginPath();
    ctx.moveTo(x + r * 0.8, y - r * 0.6);
    ctx.lineTo(x - r * 0.5, y);
    ctx.lineTo(x + r * 0.8, y + r * 0.6);
    ctx.stroke();
    return;
  }
  if (f === 'blink' || f === 'sleep' || f === 'dead' || f === 'happy') {
    ctx.lineWidth = 0.42;
    ctx.beginPath();
    const up = f === 'happy' ? -1 : 1;
    ctx.moveTo(x - r, y);
    ctx.quadraticCurveTo(x, y + up * r * 0.85, x + r, y);
    ctx.stroke();
    return;
  }
  ell(ctx, x, y, r, r * 1.15);
  ctx.fillStyle = K.colour(a, COL.eye);
  ctx.fill();
  ell(ctx, x, y + r * 0.45, r * 0.62, r * 0.42);
  ctx.fillStyle = K.colour(a, '#6a5a8a');
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ell(ctx, x - r * 0.3, y - r * 0.38, r * 0.38, r * 0.34);
  ctx.fill();
  ell(ctx, x + r * 0.32, y + r * 0.32, r * 0.16, r * 0.14);
  ctx.fill();
  if (f === 'focus') {
    ctx.lineWidth = 0.35;
    ctx.beginPath();
    ctx.moveTo(x - r * 1.1, y - r * 1.7);
    ctx.lineTo(x + r * 1.0, y - r * 1.2);
    ctx.stroke();
  }
}
function face(ctx, a, bk, K) {
  const F = K.P.face;
  K.frameAt(ctx, a, F.y);
  const lk = clamp(bk.look ?? 0, -1.2, 1.2);
  ctx.translate(F.x + lk * 0.8, F.y);
  const sp = a.sp ?? {};
  let f = sp.face ?? 'open';
  if (f === 'open' && ((a.t ?? 0) + 1.1) % 4.6 < 0.13) f = 'blink';
  ctx.fillStyle = K.tint(a, COL.blush, 0.6);
  ell(ctx, -2.6, 1.9, 1.5, 0.75);
  ctx.fill();
  ell(ctx, 2.2, 1.8, 1.0, 0.6);
  ctx.fill();
  eye(ctx, a, K, 1.6, -0.3, 1.05, f);
  eye(ctx, a, K, -1.8, -0.2, 1.25, f);
  // a small mouth: a little smile, an "o" when it gasps, a line when it focuses
  ctx.strokeStyle = K.colour(a, '#8a5a7a');
  ctx.lineWidth = 0.38;
  ctx.beginPath();
  if ((sp.gasp ?? 0) > 0.3) {
    ell(ctx, 0, 1.9, 0.5, 0.6);
    ctx.fillStyle = K.colour(a, '#a04a6e');
    ctx.fill();
  } else if (f === 'focus' || f === 'hurt') {
    ctx.moveTo(-0.6, 2.1);
    ctx.lineTo(0.6, 2);
    ctx.stroke();
  } else {
    ctx.moveTo(-0.7, 1.7);
    ctx.quadraticCurveTo(0, 2.4, 0.7, 1.7);
    ctx.stroke();
  }
}

// A sticky note over a seed-leaf: ruled with a soft scribble, a peeled corner of a darker shade.
function note(ctx, a, K, mode, S, col, sh) {
  if (!S) return;
  if (mode === 'line') return;
  ctx.save();
  ctx.beginPath();
  S.shape.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
  ctx.closePath();
  ctx.clip();
  ctx.strokeStyle = K.colour(a, COL.scribble);
  ctx.lineWidth = 0.4;
  ctx.lineCap = 'round';
  for (const u of [0.38, 0.55, 0.72]) {
    ctx.beginPath();
    ctx.moveTo(...S.f(S.L.len * u, -S.L.w * 0.32));
    ctx.lineTo(...S.f(S.L.len * u, S.L.w * (u > 0.7 ? 0.05 : 0.3)));
    ctx.stroke();
  }
  ctx.fillStyle = K.colour(a, sh);
  ctx.beginPath();
  const tip = S.f(S.L.len, 0);
  ctx.moveTo(...S.f(S.L.len * 0.82, S.L.w * 0.42));
  ctx.lineTo(...tip);
  ctx.lineTo(...S.f(S.L.len * 0.86, S.L.w * 0.1));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

const SPROUT = {
  kind: 'sprout',
  ink: INK,
  P: {
    // (a mug of a body: round-shouldered, straight-sided, a flat-ish base)
    body: [[-0.4, -15.4], [4.6, -15.2], [6.6, -13.2], [6.9, -7.6], [6.6, -2.6], [4.6, -0.2], [0.4, 0.3], [-3.8, -0.2], [-6.2, -2.6], [-6.6, -7.6], [-6.4, -13.2], [-4.6, -15.2]],
    face: { x: 3.4, y: -8.2, h: 5.6 },
    seeds: [
      { side: 'F', rest: -50, len: 8.6, w: 6.8, curl: -10, tone: 'sh' },
      { side: 'N', rest: 50, len: 9, w: 7.2, curl: 10, tone: 'base' },
    ],
  },
  C: { lt: '#ffffff', base: '#f4f2fa', sh: '#dcd8ea', deep: '#bcb6d2' },
  CL: { lt: '#fff6c8', base: '#ffe98a', sh: '#ffbfd4', deep: '#e8b848', rib: '#f2cf58', stem: '#8ccf7a' },
  paint: (ctx, a, bk, K) => {
    // the blue band round the mug, a little heart on it
    ctx.fillStyle = K.colour(a, COL.band);
    ctx.beginPath();
    ctx.moveTo(...K.at(a, [-8, -5.6]));
    ctx.quadraticCurveTo(...K.at(a, [0, -4.8]), ...K.at(a, [8, -5.6]));
    ctx.lineTo(...K.at(a, [8, -3.6]));
    ctx.quadraticCurveTo(...K.at(a, [0, -2.8]), ...K.at(a, [-8, -3.6]));
    ctx.closePath();
    ctx.fill();
    const h = K.at(a, [3.6, -4.3]);
    ctx.fillStyle = K.colour(a, COL.heart);
    ctx.beginPath();
    ctx.moveTo(h[0], h[1] + 0.7);
    ctx.bezierCurveTo(h[0] - 1.4, h[1] - 0.2, h[0] - 0.8, h[1] - 1.2, h[0], h[1] - 0.5);
    ctx.bezierCurveTo(h[0] + 0.8, h[1] - 1.2, h[0] + 1.4, h[1] - 0.2, h[0], h[1] + 0.7);
    ctx.fill();
    // the coffee grounds it grows from, at the mug's top
    const g = K.at(a, [0, -14.6]);
    ctx.fillStyle = K.colour(a, COL.grounds);
    ell(ctx, g[0], g[1], 5.8, 1.4, bk.ang);
    ctx.fill();
    ctx.fillStyle = K.colour(a, COL.groundsLt);
    ell(ctx, g[0] + 1.2, g[1] - 0.3, 2.6, 0.6, bk.ang);
    ctx.fill();
    // the rim's soft light and a gentle shade down its back
    K.blob(ctx, a, '#ffffff', K.at(a, [2, -11]), 5, 6, bk.ang, 0.5);
    K.blob(ctx, a, '#cfc9e2', K.at(a, [-6, -7]), 3, 7, bk.ang, 0.5);
  },
  face,
  under: {
    body: (ctx, a, mode, K) => {
      // the mug's handle, out of its back
      const c = K.at(a, [-6.6, -8.4]);
      ctx.save();
      ctx.translate(c[0], c[1]);
      ctx.rotate(a.bk.ang);
      ctx.beginPath();
      ctx.ellipse(-1.6, 0, 3.2, 3.8, 0, 0, TAU);
      ctx.ellipse(-1.6, 0, 1.7, 2.3, 0, 0, TAU, true);
      fillOr(ctx, a, K, mode, COL.handle);
      ctx.restore();
    },
  },
  over: {
    seedF: (ctx, a, mode, K) => note(ctx, a, K, mode, a.bk.seeds?.[0], COL.noteP, COL.notePsh),
    seedN: (ctx, a, mode, K) => note(ctx, a, K, mode, a.bk.seeds?.[1], COL.noteY, COL.noteYsh),
  },
  // Its act, about 30 s, a desk plant's day (on the base's channels: x, lift, hop, lean, bend, crouch,
  // armN, armF (degrees, 26 at rest), crown, spread, droop, flap, mouth, look, wiggle, shake):
  //   - a whiff of its own coffee: steam curls up from the grounds, it leans back, eyes shut, "mmm";
  //   - the office fan comes round: its sticky-note leaves flutter and it sways in the breeze;
  //   - scribbling a memo: leaning in, its little arm busy, a few lines appear on its front note;
  //   - a sunbeam from the window: it stretches right up toward it, leaves spread wide, glowing;
  //   - a paper plane folded and thrown for fun, watched as it glides away; a happy bounce.
  pose: (m, a, out, K, cur) => {
    const sp = { face: null, gasp: 0, steam: 0, fan: 0, sun: 0, plane: -1, fold: 0, scrib: 0 };
    a.sp = sp;
    if (m.hp <= 0) {
      sp.face = 'dead';
      return;
    }
    if ((a.hurtAgo ?? 9) < 0.45) {
      sp.face = 'hurt';
      return;
    }
    if (a.vgMove) {
      sp.face = 'focus';
      return;
    }
    const calm = clamp((a.calm ?? 1) * (1 - clamp(a.walkW ?? 0, 0, 1)) * (a.moving ? 0 : 1) * (m.pose || m.cine ? 0 : 1), 0, 1);
    if (calm < 0.02) return;
    const t = a.t ?? 0;
    const lu = (((t + (m.uid % 5) * 3.3) % 30) + 30) % 30;
    const hold = (x, a0, a1, b0, b1) => {
      const e = (u) => u * u * (3 - 2 * u);
      return x <= a0 || x >= b1 ? 0 : x < a1 ? e((x - a0) / (a1 - a0)) : x <= b0 ? 1 : e((b1 - x) / (b1 - b0));
    };
    const go = (pose, w) => {
      if (w > 0.001) for (const [k, v] of Object.entries(pose)) out[k] = (out[k] ?? 0) + (v - (out[k] ?? 0)) * w;
    };
    // a whiff of its coffee
    const whiff = hold(lu, 0.8, 1.6, 4.6, 5.3) * calm;
    sp.steam = hold(lu, 0.4, 1, 4.8, 5.6);
    go({ lean: -7, bend: -3, armN: 40, armF: 40, crown: -4, droop: 0.15, mouth: 0.2 }, whiff);
    // the office fan: leaves fluttering, a sway
    const fan = hold(lu, 6.2, 6.8, 10, 10.6) * calm;
    sp.fan = fan;
    go({ flap: 18 + Math.sin(t * 22) * 14, spread: 0.5 + Math.sin(t * 17) * 0.2, lean: Math.sin(t * 3) * 4 - 2, crown: Math.sin(t * 9) * 6, armN: 34 + Math.sin(t * 11) * 8, armF: 34 - Math.sin(t * 11) * 8 }, fan);
    // scribbling a memo
    const scrib = hold(lu, 11.4, 12, 15, 15.6) * calm;
    sp.scrib = scrib;
    go({ lean: 5, bend: 4, look: -0.5, armN: 72 + Math.sin(t * 24) * 7, armF: 28, crown: 4 }, scrib);
    // a sunbeam: stretched right up toward it
    const sun = hold(lu, 16.4, 17.2, 20.6, 21.4) * calm;
    sp.sun = sun;
    go({ lean: -9, bend: -6, lift: 0.4, armN: 132, armF: 128, crown: -10, spread: 1, flap: 22, mouth: 0.25, look: 0.6 }, sun);
    // a paper plane: folded in front of it, thrown, watched
    const fold = hold(lu, 22.2, 22.6, 24, 24.2) * calm;
    sp.fold = fold;
    go({ armN: 64 + Math.sin(t * 16) * 6, armF: 64 - Math.sin(t * 16) * 6, bend: 3, look: -0.4 }, fold);
    const toss = hold(lu, 24.1, 24.25, 24.5, 24.9) * calm;
    go({ armN: 150, lean: -5, hop: 0.04 }, toss);
    if (lu > 24.2 && lu < 27.6) sp.plane = (lu - 24.2) / 3.4;
    const watch = hold(lu, 24.6, 25, 27.2, 27.7) * calm;
    go({ look: 1, crown: -6, armN: 40, armF: 40, hop: Math.abs(Math.sin((lu - 25) * Math.PI * 2)) * 0.05 * (lu > 26.4 ? 1 : 0) }, watch);
    sp.face = whiff > 0.4 ? 'happy' : scrib > 0.4 || fold > 0.4 ? 'focus' : sun > 0.4 ? 'happy' : watch > 0.4 ? (lu < 26.4 ? 'open' : 'happy') : fan > 0.4 ? 'happy' : null;
    sp.gasp = hold(lu, 24.4, 24.6, 25.2, 25.5);
  },
  // Its extras: coffee steam, the fan's breeze lines, a warm sunbeam, the paper plane gliding away.
  fx: (ctx, m, a, S, K) => {
    const sp = a.sp;
    if (!sp || m.hp <= 0) return;
    const t = a.t ?? 0;
    const top = K.at(a, [0, -15.4]);
    const dir = 1; // (the rig draws facing +x; it is mirrored as a whole when it turns)
    if (sp.steam > 0.02) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.95)';
      ctx.lineWidth = 1.3;
      ctx.lineCap = 'round';
      for (let i = 0; i < 2; i++) {
        const u = (t * 0.6 + i * 0.5) % 1;
        ctx.globalAlpha = sp.steam * Math.min(1, Math.sin(Math.PI * u) * 1.4);
        const x0 = top[0] - 2 + i * 3;
        const y0 = top[1] - 2 - u * 9;
        ctx.beginPath();
        ctx.moveTo(x0, y0 + 3);
        ctx.bezierCurveTo(x0 - 1.6, y0 + 1.6, x0 + 1.6, y0 - 0.2, x0, y0 - 2);
        ctx.stroke();
      }
      ctx.restore();
    }
    if (sp.fan > 0.05) {
      ctx.save();
      ctx.strokeStyle = 'rgba(214,236,255,0.8)';
      ctx.lineWidth = 0.6;
      ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        const u = (t * 1.4 + i / 3) % 1;
        ctx.globalAlpha = sp.fan * Math.sin(Math.PI * u);
        const x = top[0] + dir * (14 - u * 22);
        const y = top[1] - 4 + i * 4;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x - dir * 3, y - 1.4, x - dir * 6, y);
        ctx.stroke();
      }
      ctx.restore();
    }
    if (sp.sun > 0.02) {
      ctx.save();
      ctx.globalAlpha = sp.sun * 0.6;
      const g = ctx.createLinearGradient(top[0] + dir * 14, top[1] - 26, top[0], top[1] + 6);
      g.addColorStop(0, 'rgba(255,226,140,0.95)');
      g.addColorStop(1, 'rgba(255,214,120,0.05)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(top[0] + dir * 10, top[1] - 18);
      ctx.lineTo(top[0] + dir * 20, top[1] - 18);
      ctx.lineTo(top[0] + dir * 6, top[1] + 8);
      ctx.lineTo(top[0] - dir * 6, top[1] + 8);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    if (sp.plane >= 0) {
      const u = sp.plane;
      const x = top[0] + dir * (4 + u * 15);
      const y = top[1] - 2 - Math.sin(u * Math.PI) * 6 + u * 3;
      ctx.save();
      ctx.globalAlpha = Math.min(1, (1 - u) * 2.2);
      ctx.translate(x, y);
      ctx.scale(dir, 1);
      ctx.rotate(Math.cos(u * Math.PI) * -0.3);
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.lineTo(-3, -2.4);
      ctx.lineTo(-2.2, 0);
      ctx.lineTo(-3, 1.4);
      ctx.closePath();
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#e0d8ca';
      ctx.lineWidth = 0.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.lineTo(-2.2, 0);
      ctx.stroke();
      ctx.restore();
    }
  },
};

const V = dressedVeggie(SPROUT);
export const STICKY_SPROUT_ART = { ...V.art, noHop: true };
export const STICKY_SPROUT_SIZE = { w: Math.round(V.w), h: Math.round(V.h), speed: V.speed };
