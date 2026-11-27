// The Brass Mole, on screen (2026-11-27, redrawn from scratch with Queen Gearheart: one of her
// whack-a-mole toys; world/carnival.js calls them up out of the Ferris Wheel plaza's holes to wind her).
// A chubby tin wind-up mole, painted cocoa velvet over brass, a cream tummy, big pink digging paws, a
// pink button nose, a tiny red bow tie (it's a carnival), and its own little brass key in its back
// that it's desperate to share: up out of its hole it cranks the air for the Queen. It moves on its own
// copy of the creature base (rig.js; body.js `tinmole`: round and stubby), dressed here; its head, paws
// and key drawn here from scratch, its legs never seen (they stay down its hole).
//   look    cocoa tin with a soft sheen, brass seams and two rivets, a cream tummy patch, a round
//           head with a long soft snout, tiny round ears, wide pink paws with rounded claws (never
//           sharp), a red bow tie, a brass key turning in its back.
//   eyes    its own: small round shiny black-brown buttons, a big glint and a tiny one, a soft lash
//           flick each; rosy cheeks. Faces: eager (rest), cheer (^ ^), worried (as it's about to duck),
//           dizzy (whacked), hurt.
//   pops    up out of its hole over a moment (m.popAt), cranks the air with both paws for the Queen,
//           its key whirring; with a moment left it looks round, worried, and ducks back down
//           (m.popLife); whacked it spins dizzy and sinks away.
//   marks   all its own (`ownEmotes`): a little "!" on a brass cog as it pops up; dizzy stars when
//           whacked; a sweat drop as it's about to duck.
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, win, tone, ell, smooth, pen, glow, sparkle, star, dizzy, dust, sweat, spring } from './fx.js';

const BIG = 1.5;
const LW = 1.6 / BIG;
const INK = '#5a3a2a';
const FUR = ['#c8987a', '#9a6a4e', '#7a4e36', '#56341f'];
const CREAM = ['#fff6e6', '#f6e2c4', '#e2c8a2'];
const PINK = ['#ffd2dc', '#f49ab0', '#d0708e'];
const BRASS = ['#ffe9a8', '#e8b84a', '#b8862c', '#7e5a1c'];
const RED = ['#ff9aa0', '#e2404e', '#a82a3c'];

let WK = 1;
const paint = (ctx, a, mode, col, ink = INK, w = LW * WK) => {
  if (mode === 'line') {
    pen(ctx, ink, w);
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, col);
    ctx.fill();
  }
};
function enter(ctx, a, D, bone) {
  D.frame(ctx, a, bone);
  const p = D.J[D.PIV[bone]];
  ctx.scale(D.SC, D.SC);
  ctx.translate(-p[0], -p[1]);
}
const ptOf = (a, D, bone, p) => D.at(a, bone, [(p[0] - D.J[D.PIV[bone]][0]) * D.SC, (p[1] - D.J[D.PIV[bone]][1]) * D.SC]);
const HO = [1, -10];
const HS = 1.15;
const headAt = (a, D, [u, v]) => {
  const n = D.J.neck;
  return ptOf(a, D, 'head', [n[0] + HO[0] + u * HS, n[1] + HO[1] + v * HS]);
};
const FACES = {
  eager: { lid: 0, shut: 'happy', ms: 0.7, mo: 0.2, bl: 0.6, by: 0.4 },
  cheer: { lid: 1, shut: 'happy', ms: 1, mo: 0.5, bl: 0.9, by: 0.7 },
  worried: { lid: 0, shut: 'happy', ms: -0.4, mo: 0.15, bl: 0.5, by: 0.9 },
  dizzy: { lid: 1, shut: 'dizzy', ms: -0.3, mo: 0.35, bl: 0.5, by: 0.3 },
  hurt: { lid: 1, shut: 'squeeze', ms: -0.6, mo: 0.4, bl: 0.6, by: 0.3 },
};
const SHUTS = ['happy', 'squeeze', 'dizzy'];
function eye(ctx, a, x, y, side, f) {
  const t = a.t ?? 0;
  const blink = f.lid < 0.6 ? win((t + (a.gmUid ?? 0) * 0.9) % 4.6, 4.1, 4.2, 4.27, 4.4) : 0;
  const L = Math.max(f.lid, blink);
  const closedW = sstep((L - 0.9) / 0.1);
  if (closedW > 0.01) {
    ctx.save();
    ctx.globalAlpha *= closedW;
    pen(ctx, tone(a, '#2a1a14'), 0.8);
    ctx.lineCap = 'round';
    for (const s of SHUTS) {
      const k = blink > f.lid + 0.05 ? (s === 'happy' ? 1 : 0) : f.shut[s];
      if (k <= 0.01) continue;
      ctx.save();
      ctx.globalAlpha *= k;
      ctx.beginPath();
      if (s === 'happy') {
        ctx.moveTo(x - 1.8, y + 0.6);
        ctx.quadraticCurveTo(x, y - 1.6, x + 1.8, y + 0.6);
      } else if (s === 'squeeze') {
        ctx.moveTo(x + side * 1.6, y - 1.4);
        ctx.lineTo(x - side * 1.2, y);
        ctx.lineTo(x + side * 1.6, y + 1.4);
      } else {
        for (let i = 0; i <= 18; i++) {
          const an = (i / 18) * TAU * 2 + t * 5 * side;
          const r = (i / 18) * 1.7;
          const p = [x + Math.cos(an) * r, y + Math.sin(an) * r];
          if (i) ctx.lineTo(...p);
          else ctx.moveTo(...p);
        }
      }
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }
  if (closedW > 0.99) return;
  ctx.save();
  ctx.globalAlpha *= 1 - closedW;
  ell(ctx, x, y, 1.7, 2);
  ctx.fillStyle = tone(a, '#2a1a14');
  ctx.fill();
  ell(ctx, x - side * 0.5, y - 0.7, 0.62, 0.62);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ell(ctx, x + side * 0.6, y + 0.8, 0.28, 0.28);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + side * 1.3, y - 1.4);
  ctx.quadraticCurveTo(x + side * 1.9, y - 1.8, x + side * 2.2, y - 2.6);
  ctx.lineCap = 'round';
  pen(ctx, tone(a, '#2a1a14'), 0.45);
  ctx.stroke();
  ctx.restore();
}
function head(ctx, a, mode, D) {
  const q = a.gmQ ?? {};
  const f = a.gmF;
  ctx.save();
  enter(ctx, a, D, 'head');
  const n = D.J.neck;
  ctx.translate(n[0] + HO[0], n[1] + HO[1]);
  ctx.scale(HS, HS);
  WK = 1 / HS;
  const tx = 1.6;
  // tiny round ears, rooted inside its head
  for (const [ex, far] of [[7, true], [-8, false]]) {
    ell(ctx, ex, -10.6, 2.8, 2.6);
    paint(ctx, a, mode, far ? FUR[2] : FUR[1]);
    if (mode === 'fill') {
      ell(ctx, ex + 0.2, -10.4, 1.5, 1.4);
      ctx.fillStyle = tone(a, PINK[1], far ? 0.6 : 0.9);
      ctx.fill();
    }
  }
  // its round head and a long soft snout
  ctx.beginPath();
  ctx.ellipse(-0.4, -1.6, 11.4, 10.6, 0, 0, TAU);
  ctx.moveTo(tx + 15, 3.6);
  ctx.ellipse(tx + 9, 3.6, 6.2, 4.2, -0.12, 0, TAU);
  paint(ctx, a, mode, FUR[1]);
  if (mode === 'fill' && f) {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(-0.4, -1.6, 11.4, 10.6, 0, 0, TAU);
    ctx.moveTo(tx + 15, 3.6);
    ctx.ellipse(tx + 9, 3.6, 6.2, 4.2, -0.12, 0, TAU);
    ctx.clip();
    glow(ctx, tx - 3, -8, 10, FUR[0], 0.85);
    glow(ctx, -10, 4, 7, FUR[2], 0.5);
    ell(ctx, tx + 7.4, 5.2, 7, 3.6, -0.1);
    ctx.fillStyle = tone(a, CREAM[1]);
    ctx.fill();
    ctx.restore();
    ell(ctx, tx + 4.4, 3, 2.2, 1.3);
    ctx.fillStyle = tone(a, '#ff8aa6', 0.3 + 0.4 * f.bl);
    ctx.fill();
    ell(ctx, tx - 6.6, 3, 1.8, 1.1);
    ctx.fill();
    eye(ctx, a, tx + 2.6, -2.2 - f.by * 0.3, 1, f);
    eye(ctx, a, tx - 4.4, -2.6 - f.by * 0.3, -1, f);
    // its pink button nose, a glint
    ell(ctx, tx + 14.6, 2.6, 2, 1.7);
    ctx.fillStyle = tone(a, PINK[1]);
    ctx.fill();
    pen(ctx, tone(a, PINK[2]), 0.4);
    ctx.stroke();
    ell(ctx, tx + 14, 2, 0.6, 0.45);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fill();
    // its mouth: a little smile, open for a cheer
    const mx = tx + 9.6;
    const my = 6.4;
    if (f.mo > 0.1) {
      ctx.beginPath();
      ctx.moveTo(mx - 1.6, my - f.ms * 0.4);
      ctx.quadraticCurveTo(mx, my + 0.2, mx + 1.6, my - f.ms * 0.4);
      ctx.quadraticCurveTo(mx, my + f.mo * 3, mx - 1.6, my - f.ms * 0.4);
      ctx.fillStyle = tone(a, '#8a3048');
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(mx - 1.6, my - f.ms * 0.4);
      ctx.quadraticCurveTo(mx, my + 1 + f.ms * 0.4, mx + 1.6, my - f.ms * 0.4);
      ctx.lineCap = 'round';
      pen(ctx, tone(a, '#5a2a2a'), 0.55);
      ctx.stroke();
    }
    if (q.sweat >= 0) sweat(ctx, tx - 10, -4 + q.sweat * 3, 1);
  }
  WK = 1;
  ctx.restore();
}
const torsoPath = (ctx, a) => {
  const pts = a.blTorsoPts;
  if (!pts?.length) return false;
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.closePath();
  return true;
};
// Its tin body: a cream tummy, a brass seam with two rivets, a red bow tie at its throat.
function body(ctx, a, mode, D) {
  if (mode !== 'fill') return;
  const C = (p) => ptOf(a, D, 'chest', p);
  const W = (p) => ptOf(a, D, 'waistB', p);
  const st = D.J.stern;
  const nv = D.J.navel;
  ctx.save();
  if (torsoPath(ctx, a)) {
    ctx.clip();
    const tm = W([nv[0] + 5, nv[1] - 4]);
    ell(ctx, tm[0], tm[1], 9, 11, -0.1);
    ctx.fillStyle = tone(a, CREAM[1]);
    ctx.fill();
    const sh = W([nv[0] - 12, nv[1]]);
    glow(ctx, sh[0], sh[1], 9, FUR[3], 0.35);
    const lt = C([st[0] + 2, st[1] + 4]);
    glow(ctx, lt[0], lt[1], 7, FUR[0], 0.5);
    ctx.beginPath();
    ctx.moveTo(...C([st[0] - 20, st[1] + 12]));
    ctx.quadraticCurveTo(...C([st[0], st[1] + 15]), ...C([st[0] + 20, st[1] + 12]));
    pen(ctx, tone(a, BRASS[2], 0.7), 0.5);
    ctx.stroke();
    for (const dx of [-8, 9]) {
      const p = C([st[0] + dx, st[1] + 14]);
      ell(ctx, p[0], p[1], 0.45, 0.45);
      ctx.fillStyle = tone(a, BRASS[1]);
      ctx.fill();
    }
  }
  ctx.restore();
  const b = C([st[0] + 3, st[1] + 1]);
  ctx.save();
  ctx.translate(b[0], b[1]);
  for (const sd of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(sd * 1.6, -1.8, sd * 3, -1.2);
    ctx.quadraticCurveTo(sd * 3.4, 0, sd * 3, 1.2);
    ctx.quadraticCurveTo(sd * 1.6, 1.8, 0, 0);
    ctx.fillStyle = tone(a, sd < 0 ? RED[2] : RED[1]);
    ctx.fill();
  }
  ell(ctx, 0, 0, 0.9, 0.9);
  ctx.fillStyle = tone(a, RED[2]);
  ctx.fill();
  ctx.restore();
}
// A wide pink digging paw, three rounded claws.
function paw(ctx, a, mode, D, k) {
  ctx.save();
  enter(ctx, a, D, `hand${k}`);
  const wr = D.J[`wr${k}`];
  const hd = D.J[`hand${k}`];
  const an = Math.atan2(hd[1] - wr[1], hd[0] - wr[0]);
  ctx.translate(hd[0], hd[1]);
  ctx.rotate(an - Math.PI / 2);
  const near = k === 'N';
  smooth(ctx, [[-4, -2.6], [-1, -3.8], [2.6, -3.4], [4.6, -0.6], [4.2, 2.4], [2.6, 4], [0, 4.4], [-2.6, 4], [-4.4, 1.6]]);
  paint(ctx, a, mode, near ? PINK[1] : PINK[2], PINK[2]);
  if (mode === 'fill') {
    for (const cx of [-2.2, 0, 2.2]) {
      ell(ctx, cx, 4.2, 0.9, 0.9);
      ctx.fillStyle = tone(a, CREAM[0], near ? 0.9 : 0.6);
      ctx.fill();
    }
    glow(ctx, -0.6, -1, 2.6, PINK[0], near ? 0.7 : 0.3);
  }
  ctx.restore();
}
function key(ctx, a, mode, D) {
  const q = a.gmQ ?? {};
  ctx.save();
  enter(ctx, a, D, 'chest');
  const st = D.J.stern;
  ctx.translate(st[0] - 20, st[1] + 10);
  const c = Math.cos(q.keyA ?? 0);
  ctx.beginPath();
  ctx.moveTo(2, 0);
  ctx.lineTo(-4.4, 0);
  ctx.lineCap = 'round';
  pen(ctx, mode === 'line' ? INK : tone(a, BRASS[2]), mode === 'line' ? 2 + LW * 2 : 2);
  ctx.stroke();
  for (const s of [-1, 1]) {
    ell(ctx, -6.6, s * 2.2 * Math.abs(c), 1.8, 2 * Math.max(0.35, Math.abs(c)));
    paint(ctx, a, mode, s * c > 0 ? BRASS[1] : BRASS[2], BRASS[3]);
  }
  ctx.restore();
}
function cogMark(ctx, x, y, e, len) {
  const inn = sstep(e / 0.18);
  const k = inn * (1 - sstep((e - len + 0.25) / 0.25));
  if (k <= 0.01) return;
  ctx.save();
  ctx.translate(x, y - (1 - inn) * 2);
  ctx.scale(k, k);
  ctx.beginPath();
  for (let i = 0; i <= 48; i++) {
    const u = (i / 48) * TAU;
    const rr = 4.6 * (1 + 0.18 * sstep((Math.cos(u * 7) + 0.2) / 0.6));
    if (i) ctx.lineTo(Math.cos(u) * rr, Math.sin(u) * rr);
    else ctx.moveTo(Math.cos(u) * rr, Math.sin(u) * rr);
  }
  ctx.closePath();
  ctx.fillStyle = '#fff8e0';
  ctx.fill();
  pen(ctx, '#b8862c', 0.9);
  ctx.stroke();
  ctx.lineCap = 'round';
  pen(ctx, '#d0708e', 1.3);
  ctx.beginPath();
  ctx.moveTo(0, -2.6);
  ctx.lineTo(0, 0.3);
  ctx.stroke();
  ell(ctx, 0, 1.9, 0.7, 0.7);
  ctx.fillStyle = '#d0708e';
  ctx.fill();
  ctx.restore();
}

function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const now = a.now ?? t;
  const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
  const q = { mood: 'eager', sweat: -1, keyRate: 6, fx: null };
  a.gmQ = q;
  a.gmUid = (m.uid ?? 0) % 7;
  const go = (p, k = 1) => {
    if (k > 0.001) for (const [ch, val] of Object.entries(p)) out[ch] = (out[ch] ?? 0) + (val - (out[ch] ?? 0)) * k;
  };
  const alive = m.hp > 0;
  const popU = m.popAt != null ? now - m.popAt : 9;
  const life = m.popLife ?? 99;
  // up out of its hole, and back down (its legs stay hidden: rise lifts it from below the floor)
  const up = sstep(popU / 0.3);
  const ducking = alive ? sstep((popU - (life - 0.4)) / 0.35) : 0;
  if (alive) st.gmDeadAt = undefined;
  else st.gmDeadAt ??= now;
  const deadU = alive ? 0 : now - st.gmDeadAt;
  const sink = alive ? ducking : sstep((deadU - 0.5) / 0.4);
  q.rise = up * (1 - sink);
  // cranking the air with both paws for the Queen, bobbing, its key whirring
  const b = now * 8 + (m.uid ?? 0);
  go({ shN: -110 + Math.sin(b) * 40, elN: -60, shF: -110 - Math.sin(b) * 40, elF: -60, tilt: Math.sin(b * 0.5) * 4, head: -4 + Math.sin(b * 0.5) * 3, hwN: -20, hwF: -20 }, 1);
  q.mood = 'eager';
  if (Math.sin(b * 0.25) > 0.7) q.mood = 'cheer';
  // about to duck: a worried look round
  const late = alive && popU > life - 1.2;
  if (late) {
    go({ shN: -40, elN: -80, shF: -40, elF: -80, head: Math.sin(now * 6) * 8 }, sstep((popU - (life - 1.2)) / 0.3));
    q.mood = 'worried';
    q.sweat = (t * 0.8) % 1;
  }
  const hurtU = a.hurtAgo ?? 9;
  if (alive && hurtU < 0.4) q.mood = 'hurt';
  if (!alive) {
    go({ shN: 10, elN: -20, shF: 10, elF: -20, head: 12, tilt: 8 }, 1);
    q.mood = 'dizzy';
    q.keyRate = 0;
    q.fx = { kind: 'bonked', u: deadU };
  }
  q.pop = popU;
  const F = FACES[q.mood] ?? FACES.eager;
  const f = (st.gmF ??= { ...FACES.eager, shut: { happy: 1, squeeze: 0, dizzy: 0 } });
  const kf = 1 - Math.exp(-dt * 14);
  for (const k of ['lid', 'ms', 'mo', 'bl', 'by']) f[k] = mix(f[k], F[k], k === 'lid' ? 1 - Math.exp(-dt * (F[k] > f[k] ? 40 : 18)) : kf);
  for (const sh of SHUTS) f.shut[sh] = mix(f.shut[sh], sh === F.shut ? 1 : 0, 1 - Math.exp(-dt * 12));
  a.gmF = f;
  // (eased, so it never jumps up or down its hole)
  st.gmRise = clamp(spring(st, 'gmR', q.rise, 220, 26, dt), 0, 1);
  st.gmKeyRate = mix(st.gmKeyRate ?? q.keyRate, q.keyRate, 1 - Math.exp(-dt * 4));
  st.gmKeyA = ((st.gmKeyA ?? 0) + st.gmKeyRate * dt) % (TAU * 100);
  q.keyA = st.gmKeyA;
}
function under2(ctx, m, a, S, matOf, D) {
  ctx.globalAlpha = a.alpha ?? 1;
  for (const mode of ['line', 'fill']) key(ctx, a, mode, D);
}
function fx(ctx, m, a, S, matOf, D) {
  const q = a.gmQ;
  if (!q) return;
  ctx.save();
  ctx.globalAlpha = a.alpha ?? 1;
  const crown = headAt(a, D, [0, -16]);
  const hN = ptOf(a, D, 'handN', D.J.handN);
  if (m.hp > 0 && q.pop < 1.1) cogMark(ctx, crown[0] + 3, crown[1] - 6, q.pop, 1.1);
  if (q.fx?.kind === 'bonked') {
    dizzy(ctx, crown[0], crown[1] + 4, 6, a.t ?? 0, 3);
    if (q.fx.u < 0.4) for (let i = 0; i < 3; i++) star(ctx, crown[0] - 6 + i * 6, crown[1] - 4 - q.fx.u * 10, 1.8 * (1 - q.fx.u / 0.4), i, 1);
  } else if (m.hp > 0) {
    sparkle(ctx, hN[0] + 2, hN[1] - 6, 1.2 * Math.abs(Math.sin((a.t ?? 0) * 2.4)), 0.8, '#fff4c0');
  }
  ctx.restore();
}
const DRESS = {
  id: 'gearmole',
  skin: { lt: FUR[0], base: FUR[1], sh: FUR[2], deep: FUR[3], ink: INK, guides: false, out: 1.6 / BIG },
  liveHead: true,
  noMoves: true,
  under2,
  over: {
    torsoSkin: (ctx, a, mode, S, D) => body(ctx, a, mode, D),
    handFskin: (ctx, a, mode, S, D) => paw(ctx, a, mode, D, 'F'),
    head: (ctx, a, mode, S, D) => head(ctx, a, mode, D),
    handNskin: (ctx, a, mode, S, D) => paw(ctx, a, mode, D, 'N'),
  },
  pose,
  fx,
};
const R = dressRig('tinmole', DRESS);
const rig = R.rig;
const draw0 = rig.draw;
// (its legs' length, hips to soles: how far down its hole it always stands)
const LEG = (R.D.J.ankN[1] - R.D.J.hipN[1]) * R.D.SC + 2;
// (its hole's front lip over it, so it rises out of the floor (the plaza draws the hole itself,
// render/carnival.js); everything of it below the floor is cut away)
function holeLip(ctx) {
  ctx.beginPath();
  ctx.ellipse(0, 0, 10, 2.8, 0, 0.1, Math.PI - 0.1);
  ctx.lineCap = 'round';
  pen(ctx, '#c8a878', 2.2);
  ctx.stroke();
  pen(ctx, '#f2dcb0', 0.9);
  ctx.stroke();
}
rig.draw = (ctx, m, a) => {
  ctx.save();
  ctx.scale(BIG, BIG);
  a.gaitScale = BIG;
  const st = a.mo?.rig;
  const rise = st?.gmRise ?? 1;
  ctx.save();
  ctx.beginPath();
  ctx.rect(-80, -200, 160, 200.5);
  ctx.clip();
  // (always stood down its hole to the hips: its legs are never seen)
  ctx.translate(0, LEG + (1 - rise) * R.H * 1.05);
  draw0(ctx, m, a);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha *= a.alpha ?? 1;
  holeLip(ctx);
  ctx.restore();
  ctx.restore();
};
rig.w = Math.round(rig.w * BIG * 1.3);
rig.h = Math.round(rig.h * BIG * 1.4);
export const MOLE_ART = { pad: 8, walk: 8, idle: 6, attack: 4, stride: R.stride * BIG, atkMs: [80, 200, 160], draw: R.still, rig, noHop: true, ownEmotes: true };
export const MOLE_SIZE = { w: 28, h: Math.round(R.H * BIG) };
