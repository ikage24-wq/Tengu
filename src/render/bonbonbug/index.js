// The Bonbon Ladybug (2026-11-27, new for the Candy Volcano's Licorice Mine, in the Cocoa Badger's place:
// the player wanted the late regulars to be new creatures that fit their place, each on its own base; the
// id stays `chocoknight`). A little ladybug whose shell is a chocolate bonbon: milk chocolate, a drizzle
// of pink icing across it and a candied cherry on top. A vanilla-cream body and head, eyes shaped like
// chocolate chips, a blush, pale strawberry wafer wings. The volcano's heat worries it (it fans itself so
// it won't melt) and its cherry is always a little loose. It moves on its own copy of the round bug base
// (ladybase.js, its ladybug: the tiptoe walk, the shell that lifts, the wings, the flight), dressed here.
import { dressedLadybug } from './ladybase.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ell = (ctx, x, y, rx, ry, r = 0) => {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, r, 0, TAU);
};
const INK = '#8a5a5e';
const COL = {
  choc: '#a4684a', chocLt: '#d09a76', chocSh: '#7c4a34', chocFar: '#6e4030',
  icing: '#ffa8c8', icingLt: '#ffe0ec',
  cherry: '#f0506a', cherryLt: '#ffb0bc', cherrySh: '#c03450', stem: '#6a8a3a',
  eye: '#4a2a22', eyeLt: '#8a5a44', blush: '#ff9eb0', mouth: '#8a4a3a',
  heat: '#ffb08a', note: '#d0607a',
};

// ---------- Its face (the head's frame: about its middle, the face to the right) ----------
// Its eyes: chocolate chips, round below and drawn up to a soft point, a shine and a dot.
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
    ctx.moveTo(x - s * 0.9, y + s * 0.25);
    ctx.quadraticCurveTo(x, y + s * 0.25 + up * s * 0.8, x + s * 0.9, y + s * 0.25);
    ctx.stroke();
    return;
  }
  const k = f === 'startled' ? 1.12 : 1;
  ctx.beginPath();
  ctx.moveTo(x, y - s * 1.25 * k);
  ctx.bezierCurveTo(x + s * 0.3 * k, y - s * 0.7 * k, x + s * 0.95 * k, y - s * 0.1 * k, x + s * 0.9 * k, y + s * 0.4 * k);
  ctx.bezierCurveTo(x + s * 0.85 * k, y + s * 1.0 * k, x - s * 0.85 * k, y + s * 1.0 * k, x - s * 0.9 * k, y + s * 0.4 * k);
  ctx.bezierCurveTo(x - s * 0.95 * k, y - s * 0.1 * k, x - s * 0.3 * k, y - s * 0.7 * k, x, y - s * 1.25 * k);
  ctx.closePath();
  ctx.fillStyle = K.tone(a, COL.eye);
  ctx.fill();
  ell(ctx, x, y + s * 0.55, s * 0.55, s * 0.26);
  ctx.fillStyle = K.tone(a, COL.eyeLt);
  ctx.fill();
  ell(ctx, x - s * 0.28, y - s * 0.2, s * 0.3, s * 0.36, -0.3);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ell(ctx, x + s * 0.34, y + s * 0.3, s * 0.13, s * 0.13);
  ctx.fill();
  if (f === 'focus') {
    ctx.fillStyle = K.tone(a, K.C.base);
    ctx.fillRect(x - s * 1.2, y - s * 1.6, s * 2.4, s * 1.0);
  }
}
const faceOf = (a) => a.bb?.face ?? ((((a.t ?? 0) + (a.mo?.uid ?? 0) * 0.43) % 4.7) < 0.13 ? 'blink' : 'open');
function face(ctx, a, sk, K, r) {
  const f = faceOf(a);
  ell(ctx, r * 0.1, r * 0.42, r * 0.2, r * 0.11);
  ctx.fillStyle = K.tone(a, COL.blush);
  ctx.globalAlpha *= 0.55;
  ctx.fill();
  ell(ctx, r * 0.84, r * 0.38, r * 0.12, r * 0.09);
  ctx.fill();
  ctx.globalAlpha /= 0.55;
  eye(ctx, a, K, r * 0.3, -r * 0.05, r * 0.22, f);
  eye(ctx, a, K, r * 0.74, -r * 0.08, r * 0.16, f);
  const mx = r * 0.6;
  const my = r * 0.44;
  ctx.strokeStyle = K.tone(a, COL.mouth);
  ctx.lineWidth = Math.max(0.35, r * 0.06);
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (f === 'startled' || f === 'hurt' || (a.bb?.phew ?? 0) > 0.4) {
    ell(ctx, mx, my, r * 0.09, r * 0.11);
    ctx.fillStyle = K.tone(a, COL.mouth);
    ctx.fill();
  } else if (f === 'focus') {
    ctx.moveTo(mx - r * 0.12, my);
    ctx.lineTo(mx + r * 0.12, my - r * 0.01);
    ctx.stroke();
  } else {
    ctx.moveTo(mx - r * 0.15, my - r * 0.05);
    ctx.quadraticCurveTo(mx, my + (f === 'happy' ? r * 0.18 : r * 0.12), mx + r * 0.15, my - r * 0.05);
    ctx.stroke();
  }
}

// ---------- Its bonbon shell: chocolate, a pink drizzle, a cherry on top ----------
const pathOf = (ctx, pts) => {
  ctx.beginPath();
  ctx.moveTo(...pts[0]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(...pts[i]);
  ctx.closePath();
};
// (the cherry: its place on the shell's top, in the shell's own frame, before the base's scale)
const CHERRY = [-1.4, -8.2];
function cherry(ctx, a, mode, K, sk) {
  const bb = a.bb ?? {};
  const base = sk.lidN(CHERRY);
  const lean = (bb.wobble ?? 0) * 0.5 + Math.sin((a.t ?? 0) * 1.3) * 0.03;
  const s = K.sc(1);
  ctx.save();
  ctx.translate(base[0], base[1]);
  ctx.rotate(lean);
  const R = s * 2.1;
  const c = [0, -R * 0.8];
  if (mode === 'line') {
    ell(ctx, c[0], c[1], R, R * 0.95);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(c[0], c[1] - R * 0.8);
    ctx.quadraticCurveTo(c[0] + R * 0.2, c[1] - R * 1.8, c[0] + R * 0.9, c[1] - R * 2.2);
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();
    return;
  }
  ctx.beginPath();
  ctx.moveTo(c[0], c[1] - R * 0.8);
  ctx.quadraticCurveTo(c[0] + R * 0.2, c[1] - R * 1.8, c[0] + R * 0.9, c[1] - R * 2.2);
  ctx.strokeStyle = K.tone(a, COL.stem);
  ctx.lineWidth = 0.7;
  ctx.lineCap = 'round';
  ctx.stroke();
  const g = ctx.createRadialGradient(c[0] - R * 0.3, c[1] - R * 0.35, R * 0.1, c[0], c[1], R);
  g.addColorStop(0, K.tone(a, COL.cherryLt));
  g.addColorStop(0.45, K.tone(a, COL.cherry));
  g.addColorStop(1, K.tone(a, COL.cherrySh));
  ell(ctx, c[0], c[1], R, R * 0.95);
  ctx.fillStyle = g;
  ctx.fill();
  ell(ctx, c[0] - R * 0.35, c[1] - R * 0.4, R * 0.3, R * 0.2, -0.5);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fill();
  ctx.restore();
}
function shell(ctx, a, mode, K) {
  const sk = a.bk;
  if (mode === 'line') {
    cherry(ctx, a, mode, K, sk);
    return;
  }
  const pts = sk.shellN;
  ctx.save();
  pathOf(ctx, pts);
  // the chocolate: lit on top, deeper underneath
  const top = sk.lidN([-1, -8]);
  const bot = sk.lidN([-1, 3.4]);
  const g = ctx.createLinearGradient(top[0], top[1], bot[0], bot[1]);
  g.addColorStop(0, K.tone(a, COL.chocLt));
  g.addColorStop(0.5, K.tone(a, COL.choc));
  g.addColorStop(1, K.tone(a, COL.chocSh));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.clip();
  // the pink icing drizzled across it in soft waves, back to front
  for (const [y, amp, w] of [[-5.6, 0.9, 0.9], [-3, 1.1, 1.0], [-0.4, 1.0, 0.9]]) {
    const line = [];
    for (let i = 0; i <= 16; i++) {
      const x = -9.4 + i * 1.1;
      line.push(sk.lidN([x, y + Math.sin(i * 1.5 + y) * amp]));
    }
    ctx.beginPath();
    ctx.moveTo(...line[0]);
    for (let i = 1; i < line.length - 1; i++) {
      const m = [(line[i][0] + line[i + 1][0]) / 2, (line[i][1] + line[i + 1][1]) / 2];
      ctx.quadraticCurveTo(...line[i], ...m);
    }
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = K.tone(a, COL.icing);
    ctx.lineWidth = K.sc(w);
    ctx.stroke();
    ctx.strokeStyle = K.tone(a, COL.icingLt);
    ctx.lineWidth = K.sc(w * 0.35);
    ctx.globalAlpha *= 0.8;
    ctx.stroke();
    ctx.globalAlpha /= 0.8;
  }
  // its glossy sheen
  const sh = sk.lidN([-2.6, -5.6]);
  ell(ctx, sh[0], sh[1], K.sc(3.2), K.sc(1.1), (sk.th ?? 0) - 0.35);
  ctx.fillStyle = 'rgba(255,240,226,0.55)';
  ctx.fill();
  ctx.restore();
  cherry(ctx, a, mode, K, sk);
}
// (the far shell half, when it lifts: darker chocolate)
function shellFar(ctx, a, mode, K) {
  if (mode !== 'fill' || (a.bk.shellO ?? 0) < 0.02) return;
  pathOf(ctx, a.bk.shellF);
  ctx.fillStyle = K.tone(a, COL.chocFar);
  ctx.fill();
}

const LOOK = {
  // (its vanilla cream: the body, the head, the legs; strawberry wafer wings)
  C: { lt: '#fffaf0', base: '#fff0d8', sh: '#f0d4b0', deep: '#d8b088', guide: '#fff0d8', nose: '#d8b088', mouth: '#8a4a3a', wing: '#ffe4ee', wingRim: '#f7c4d6', wingFar: '#f9d6e2' },
  ink: INK,
  face,
  over: { shellN: shell, shellF: shellFar },
  // Its act, about 30 s, the mine's little bonbon (on the base's channels: x, hop, lift, pitch, crouch,
  // tuck, head, ant, shell, wings, buzz, groom):
  //   - fanning itself with its wings in the volcano's heat ("phew!"), so its chocolate won't melt;
  //   - a little hop that sets its cherry wobbling: a start, frozen still till it settles, a relieved smile;
  //   - washing its face with its front legs;
  //   - a short hover, up on its wings and gently down again;
  //   - a nap, tucked low, a "z", then a little shake awake.
  pose: (m, a, out, K, mv) => {
    const bb = { face: null, fan: 0, phew: 0, wobble: 0, startle: -1, hover: 0, z: 0 };
    a.bb = bb;
    const st = a.mo.rig;
    const dt = clamp(a.dt ?? 0, 0, 0.1);
    const dead = m.hp <= 0;
    const hurt = (a.hurtAgo ?? 9) < 0.45;
    const napping = (m.habit?.kind === 'nap' && (a.now ?? 0) < (m.habit.until ?? 0)) || m.pose === 'sleep';
    const fighting = (m.aggroUntil ?? 0) > (a.now ?? 0) || (a.now ?? 0) - (m.attackAt ?? -99) < 4 || (a.hurtAgo ?? 9) < 3;
    // (its act, eased in and out: never while it walks, fights, naps or is posed in a scene)
    const want = dead || hurt || mv || fighting || napping ? 0 : clamp((a.calm ?? 1) * (1 - clamp(a.walkW ?? 0, 0, 1)) * (a.moving ? 0 : 1) * (m.pose || m.cine ? 0 : 1), 0, 1);
    st.bbW = Number.isFinite(st.bbW) ? st.bbW + (want - st.bbW) * Math.min(1, dt * (want < st.bbW ? 9 : 4)) : want;
    const calm = st.bbW;
    bb.face = dead ? 'dead' : hurt ? 'hurt' : mv ? 'focus' : napping ? 'sleep' : null;
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
    // fanning itself in the heat
    const fan = hold(lu, 1, 1.5, 5, 5.6) * calm;
    bb.fan = fan;
    bb.phew = fan * (lu > 3.6 && lu < 4.8 ? 1 : 0);
    go({ shell: 0.75, wings: 0.95, buzz: 0.35, head: -10, ant: 0.5 }, fan);
    // a hop that sets its cherry wobbling
    const hop = hold(lu, 7, 7.2, 7.5, 7.8) * calm;
    go({ hop: 0.12, crouch: 0 }, hop);
    const freeze = hold(lu, 7.7, 7.9, 9.8, 10.3) * calm;
    go({ crouch: 0.45, head: 8, ant: 0.9 }, freeze);
    const wob = lu > 7.6 && lu < 10.2 ? Math.sin((lu - 7.6) * 11) * Math.exp(-(lu - 7.6) * 1.4) : 0;
    bb.wobble = wob * calm;
    if (lu > 7.7 && lu < 8.6) bb.startle = (lu - 7.7) / 0.9;
    const relief = hold(lu, 10.2, 10.4, 11, 11.4) * calm;
    // washing its face
    const wash = hold(lu, 12.5, 13, 15.6, 16.1) * calm;
    go({ groom: 1, head: 12 + Math.sin(lu * 7) * 8, ant: -0.3 }, wash);
    // a short hover
    const hover = hold(lu, 18, 18.6, 20.8, 21.6) * calm;
    bb.hover = hover;
    go({ shell: 1, wings: 1, buzz: 1.2, lift: 4.2 + Math.sin(lu * 4) * 0.6, head: -4, ant: 0.6 }, hover);
    // a nap, tucked low, then a little shake awake
    const nap = hold(lu, 23, 23.8, 27.6, 28.2) * calm;
    go({ crouch: 1, tuck: 0.4, head: 14, ant: -0.6 }, nap);
    bb.z = nap;
    const shake = hold(lu, 28.2, 28.4, 29, 29.4) * calm;
    go({ head: Math.sin(lu * 26) * 10, ant: 0.6 }, shake);
    if (!bb.face) bb.face = fan > 0.4 ? (bb.phew ? 'open' : 'blink') : bb.startle >= 0 ? 'startled' : freeze > 0.4 ? 'focus' : relief > 0.4 ? 'happy' : wash > 0.4 ? 'blink' : hover > 0.4 ? 'happy' : nap > 0.4 ? 'sleep' : shake > 0.4 ? 'blink' : null;
  },
  // Its extras: soft heat waves as it fans, its "phew!", a start as its cherry wobbles, a sleepy z.
  fx: (ctx, m, a, K) => {
    const bb = a.bb;
    const sk = a.bk;
    if (!bb || !sk || m.hp <= 0) return;
    const t = a.t ?? 0;
    const hc = sk.hc;
    const r = sk.r;
    const top = sk.lidN([-1.4, -10]);
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
    if (bb.fan > 0.3) {
      // soft heat waves rising off its shell
      ctx.save();
      ctx.lineCap = 'round';
      ctx.strokeStyle = COL.heat;
      ctx.lineWidth = 0.6;
      for (let i = 0; i < 2; i++) {
        const u = (t * 0.7 + i * 0.5) % 1;
        const x = top[0] - 4 + i * 6;
        const y = top[1] - u * 6;
        ctx.globalAlpha = bb.fan * Math.sin(Math.PI * u) * 0.8;
        ctx.beginPath();
        ctx.moveTo(x, y + 2.4);
        ctx.quadraticCurveTo(x + 1, y + 1.2, x, y);
        ctx.quadraticCurveTo(x - 1, y - 1.2, x, y - 2.4);
        ctx.stroke();
      }
      ctx.restore();
      if (bb.phew > 0) {
        const u = (t * 0.9) % 1;
        text('phew!', hc[0] + r + 3, hc[1] - r * 0.6 - u * 2, 4, COL.note, Math.sin(Math.PI * u));
      }
    }
    if (bb.startle >= 0) text('!', top[0] + 4, top[1] - 2 - bb.startle * 2, 4.6, '#e8608e', Math.sin(Math.PI * bb.startle));
    if (bb.z > 0.3) {
      const u = (t * 0.45) % 1;
      text('z', hc[0] + 2 + u * 4, hc[1] - r - 1 - u * 6, 4 + u * 2, '#b07a8a', bb.z * Math.sin(Math.PI * u));
    }
  },
};

const D = dressedLadybug(LOOK);
export const BONBON_LADYBUG_ART = { ...D.art, noHop: true };
export const BONBON_LADYBUG_SIZE = { w: Math.round(D.w), h: Math.round(D.h), speed: D.speed };
