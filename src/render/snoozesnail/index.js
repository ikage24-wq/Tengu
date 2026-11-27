// The Snooze Snail (2026-11-27, new for Act I: The Morning Train, in the Travel-Pillow Sloth's place:
// the player wanted the late regulars to be new creatures that fit their place, each on its own base).
// A sleepy lavender snail who carries its alarm clock as its shell: a round mint-enamel clock, a cream
// dial stuck at seven, two silver bells and a little hammer on top. A sleep mask pushed up on its
// forehead, heavy-lidded eyes, a soft blush. Every morning the clock rings, and every morning it hits
// snooze (the Queen's "Five More Minutes"). It moves on its own copy of the shell crawler base
// (snailbase.js: its bones, glide, springs and moves), dressed here; its face drawn here from scratch.
import { dressedSnail } from './snailbase.js';

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
const INK = '#7a6a9a';
const EYE_INK = '#3a2e52';
const COL = {
  dial: '#fff8ec',
  dialSh: '#f0e2cc',
  tick: '#b8a6d0',
  hand: '#5a4a7a',
  bell: '#e4e8f4',
  bellSh: '#b6bed6',
  bellLt: '#ffffff',
  mask: '#7c6cc8',
  maskSh: '#5f50a8',
  maskStar: '#ffe08a',
  blush: '#ff9ab0',
};

// ---------- Its face (head frame: the head's middle at 0, 0, facing +x) ----------
function eyeAt(ctx, a, K, x, y, k, f) {
  const rx = 1.3 * k;
  const ry = 1.55;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = K.colour(a, EYE_INK);
  if (f === 'hurt') {
    ctx.lineWidth = 0.42;
    ctx.beginPath();
    ctx.moveTo(x + rx * 0.8, y - ry * 0.5);
    ctx.lineTo(x - rx * 0.5, y);
    ctx.lineTo(x + rx * 0.8, y + ry * 0.5);
    ctx.stroke();
    return;
  }
  if (f === 'sleep' || f === 'blink' || f === 'dead') {
    ctx.lineWidth = 0.42;
    ctx.beginPath();
    ctx.moveTo(x - rx, y + ry * 0.2);
    ctx.quadraticCurveTo(x, y + ry * 0.8, x + rx, y + ry * 0.2);
    ctx.stroke();
    return;
  }
  if (f === 'happy') {
    ctx.lineWidth = 0.46;
    ctx.beginPath();
    ctx.moveTo(x - rx, y + ry * 0.25);
    ctx.quadraticCurveTo(x, y - ry * 0.8, x + rx, y + ry * 0.25);
    ctx.stroke();
    return;
  }
  // open: a soft violet eye, big pupil, two lights; its lid heavy and drowsy unless startled
  const wide = f === 'wide';
  const ex = rx * (wide ? 1.12 : 1);
  const ey = ry * (wide ? 1.12 : 1);
  ell(ctx, x, y, ex, ey);
  ctx.fillStyle = K.colour(a, '#fffaff');
  ctx.fill();
  ctx.save();
  ell(ctx, x, y, ex, ey);
  ctx.clip();
  ell(ctx, x + ex * 0.06, y + ey * 0.08, ex * 0.86, ey * 0.9);
  ctx.fillStyle = K.colour(a, '#6a4aa8');
  ctx.fill();
  ell(ctx, x + ex * 0.06, y + ey * 0.4, ex * 0.6, ey * 0.36);
  ctx.fillStyle = K.colour(a, '#b08ae0');
  ctx.fill();
  ell(ctx, x + ex * 0.08, y, ex * (wide ? 0.3 : 0.42), ey * (wide ? 0.3 : 0.42));
  ctx.fillStyle = K.colour(a, '#22183a');
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ell(ctx, x - ex * 0.3, y - ey * 0.34, ex * 0.34, ey * 0.28);
  ctx.fill();
  ell(ctx, x + ex * 0.34, y + ey * 0.36, ex * 0.15, ey * 0.12);
  ctx.fill();
  // the drowsy lid, down over the top half (not when startled)
  if (!wide) {
    const lid = f === 'focus' ? 0.3 : 0.42;
    ctx.beginPath();
    ctx.moveTo(x - ex * 1.3, y - ey * 1.4);
    ctx.lineTo(x + ex * 1.3, y - ey * 1.4);
    ctx.lineTo(x + ex * 1.3, y - ey * (1 - lid * 1.15) + (f === 'focus' ? ey * 0.25 : 0));
    ctx.quadraticCurveTo(x, y - ey * (1 - lid * 2.35), x - ex * 1.3, y - ey * (1 - lid * 1.15));
    ctx.closePath();
    ctx.fillStyle = K.colour(a, K.C.base);
    ctx.fill();
  }
  ctx.restore();
  // its lash line along the lid's edge
  if (!wide) {
    const lid = f === 'focus' ? 0.3 : 0.42;
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    ctx.moveTo(x - ex * 1.05, y - ey * (1 - lid * 1.15));
    ctx.quadraticCurveTo(x, y - ey * (1 - lid * 2.35), x + ex * 1.05, y - ey * (1 - lid * 1.15) + (f === 'focus' ? ey * 0.25 : 0));
    ctx.stroke();
  }
}
function face(ctx, a, sk, K) {
  const f = a.sz?.face ?? ((((a.t ?? 0) + (a.mo?.uid ?? 0) * 0.37) % 5.2) < 0.15 ? 'blink' : 'open');
  ctx.fillStyle = K.tint(a, COL.blush, 0.55);
  ell(ctx, 0.6, 2.1, 1.4, 0.65);
  ctx.fill();
  ell(ctx, 4.0, 2.0, 0.8, 0.5);
  ctx.fill();
  eyeAt(ctx, a, K, 3.5, -0.4, 0.66, f);
  eyeAt(ctx, a, K, 1.0, -0.25, 1, f);
  // a small soft mouth: a sleepy little line, an "o" when it yawns
  const yawn = a.sz?.yawn ?? 0;
  ctx.strokeStyle = K.colour(a, '#8a5a7a');
  ctx.lineWidth = 0.35;
  ctx.lineCap = 'round';
  if (yawn > 0.15) {
    ell(ctx, 3.3, 2.5, 0.5 + yawn * 0.4, 0.4 + yawn * 0.8);
    ctx.fillStyle = K.colour(a, '#a04a6e');
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(2.7, 2.3);
    ctx.quadraticCurveTo(3.2, 2.7, 3.8, 2.3);
    ctx.stroke();
  }
  // the sleep mask pushed up on its forehead: a soft purple band with a little gold star
  ctx.beginPath();
  ctx.moveTo(-3.2, -3.0);
  ctx.quadraticCurveTo(0.8, -5.4, 4.6, -3.5);
  ctx.lineTo(4.4, -1.9);
  ctx.quadraticCurveTo(0.8, -3.6, -3.4, -1.6);
  ctx.closePath();
  ctx.fillStyle = K.colour(a, COL.mask);
  ctx.fill();
  ctx.strokeStyle = K.colour(a, COL.maskSh);
  ctx.lineWidth = 0.3;
  ctx.stroke();
  star(ctx, a, K, 2.2, -3.4, 0.7, COL.maskStar);
}
function star(ctx, a, K, x, y, r, c) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const an = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    const p = [x + Math.cos(an) * rr, y + Math.sin(an) * rr];
    if (i) ctx.lineTo(...p);
    else ctx.moveTo(...p);
  }
  ctx.closePath();
  ctx.fillStyle = K.colour(a, c);
  ctx.fill();
}

// ---------- Its clock (shell frame: the shell's middle at 0, 0, its radius K.SR) ----------
function dial(ctx, a, K) {
  const R = K.SR;
  // the enamel case's shine
  const g = ctx.createRadialGradient(-R * 0.35, -R * 0.4, 0, 0, 0, R * 1.05);
  g.addColorStop(0, K.colour(a, K.CS?.lt ?? '#d8fff0'));
  g.addColorStop(0.55, K.colour(a, '#8fdcc4'));
  g.addColorStop(1, K.colour(a, '#5eb49c'));
  ctx.fillStyle = g;
  ctx.fillRect(-R * 1.5, -R * 1.5, R * 3, R * 3);
  // the cream dial
  ell(ctx, 0, 0, R * 0.72, R * 0.72);
  ctx.fillStyle = K.colour(a, COL.dial);
  ctx.fill();
  ctx.strokeStyle = K.colour(a, '#4f9c86');
  ctx.lineWidth = R * 0.06;
  ctx.stroke();
  // twelve soft ticks (short strokes, the four big ones longer)
  ctx.strokeStyle = K.colour(a, COL.tick);
  ctx.lineCap = 'round';
  for (let i = 0; i < 12; i++) {
    const an = (i / 12) * TAU;
    const big = i % 3 === 0;
    ctx.lineWidth = big ? R * 0.06 : R * 0.035;
    ctx.beginPath();
    ctx.moveTo(Math.cos(an) * R * (big ? 0.5 : 0.56), Math.sin(an) * R * (big ? 0.5 : 0.56));
    ctx.lineTo(Math.cos(an) * R * 0.64, Math.sin(an) * R * 0.64);
    ctx.stroke();
  }
  // the hands: seven o'clock (the minute hand creeps on a little, the snoozes adding up)
  const mins = (a.sz?.mins ?? 0) * TAU;
  ctx.strokeStyle = K.colour(a, COL.hand);
  ctx.lineWidth = R * 0.08;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  const hA = -Math.PI / 2 + (7 / 12) * TAU + mins / 12;
  ctx.lineTo(Math.cos(hA) * R * 0.32, Math.sin(hA) * R * 0.32);
  ctx.stroke();
  ctx.lineWidth = R * 0.05;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  const mA = -Math.PI / 2 + mins;
  ctx.lineTo(Math.cos(mA) * R * 0.5, Math.sin(mA) * R * 0.5);
  ctx.stroke();
  ell(ctx, 0, 0, R * 0.07, R * 0.07);
  ctx.fillStyle = K.colour(a, COL.hand);
  ctx.fill();
  // a soft glass shine across the dial
  ctx.save();
  ell(ctx, 0, 0, R * 0.72, R * 0.72);
  ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.ellipse(-R * 0.25, -R * 0.35, R * 0.5, R * 0.18, -0.5, 0, TAU);
  ctx.fill();
  ctx.restore();
}
// Its two bells and the little hammer between them, on top of the clock (shell frame).
function bells(ctx, a, K, mode) {
  const R = K.SR;
  const ring = a.sz?.ring ?? 0;
  const t = a.t ?? 0;
  for (const s of [-1, 1]) {
    const an = -Math.PI / 2 + s * 0.62;
    const shake = ring * Math.sin(t * 60 + s) * 0.18;
    ctx.save();
    ctx.translate(Math.cos(an) * R * 1.02, Math.sin(an) * R * 1.02);
    ctx.rotate(an + Math.PI / 2 + shake);
    // the bell: a dome with a rolled rim
    ctx.beginPath();
    ctx.moveTo(-R * 0.36, 0);
    ctx.quadraticCurveTo(-R * 0.4, -R * 0.42, 0, -R * 0.46);
    ctx.quadraticCurveTo(R * 0.4, -R * 0.42, R * 0.36, 0);
    ctx.closePath();
    fillOr(ctx, a, K, mode, COL.bell);
    if (mode === 'fill') {
      ctx.fillStyle = K.colour(a, COL.bellSh);
      ctx.fillRect(-R * 0.38, -R * 0.07, R * 0.76, R * 0.1);
      ell(ctx, -R * 0.14, -R * 0.26, R * 0.08, R * 0.12, 0.4);
      ctx.fillStyle = COL.bellLt;
      ctx.fill();
    }
    ctx.restore();
  }
  // the hammer on its little arm, between the bells (blurs side to side as it rings)
  const hs = ring * Math.sin(t * 70) * 0.55;
  ctx.save();
  ctx.translate(0, -R * 1.02);
  ctx.rotate(hs);
  ctx.beginPath();
  ctx.rect(-R * 0.035, -R * 0.36, R * 0.07, R * 0.36);
  fillOr(ctx, a, K, mode, COL.bellSh);
  ell(ctx, 0, -R * 0.4, R * 0.1, R * 0.08);
  fillOr(ctx, a, K, mode, COL.bell);
  ctx.restore();
}

const SNOOZE = {
  ink: INK,
  C: { lt: '#f8f2ff', base: '#e4d8f6', sh: '#c8b6e6', deep: '#a48ec8', mouth: '#a04a6e' },
  CS: { lt: '#d8fff0', base: '#8fdcc4', sh: '#62b8a0', deep: '#3f8f7c' },
  spiral: false,
  quietIdle: true,
  P: {
    stalks: [
      { id: 'upF', far: true, up: true, root: [-0.5, -3.7], ang: -112, len: 4, w: 1.3, root0: 1.3, knob: 1.5 },
      { id: 'upN', far: false, up: true, root: [1.7, -3.8], ang: -60, len: 4.3, w: 1.35, root0: 1.3, knob: 1.5 },
    ],
  },
  face,
  over: {
    shell: (ctx, a, mode, K) => {
      ctx.save();
      K.shellFrame(ctx, a);
      if (mode === 'fill') {
        ctx.save();
        ctx.beginPath();
        K.shellPath(ctx);
        ctx.clip();
        dial(ctx, a, K);
        ctx.restore();
      }
      bells(ctx, a, K, mode);
      ctx.restore();
    },
  },
  // Its act, 30 s, on the base's channels (x, hop, lift, pitch, crouch, hide, peek, neck, nAng, head,
  // jaw, stalk, stalkA, droop, stretch, lean):
  //   - dozing, head drooped, little z's;
  //   - RRRING! the clock goes off: a jolt awake, eyes wide, stalks up;
  //   - a grumpy turn back and a bonk on the clock's top: snooze (the minute hand creeps on five);
  //   - a big yawn, a stretch, and back to sleep;
  //   - it rings again; another bonk; this time it tucks right into its clock to sleep, then peeks out.
  pose: (m, a, out, K, mv) => {
    const sz = { face: null, ring: 0, yawn: 0, mins: 0, z: 0, rrring: -1, bonk: -1 };
    a.sz = sz;
    const t = a.t ?? 0;
    const loop = Math.floor((t + 0.0001) / 30);
    const lu = ((t % 30) + 30) % 30;
    const ease = (u) => clamp(u, 0, 1) ** 2 * (3 - 2 * clamp(u, 0, 1));
    // the snoozes add up: five minutes a bonk, round and round the dial
    sz.mins = (((loop * 10 + ease((lu - 9.2) / 0.4) * 5 + ease((lu - 19.9) / 0.4) * 5) % 60) + 60) % 60 / 60;
    if (m.hp <= 0) {
      sz.face = 'dead';
      return;
    }
    if ((a.hurtAgo ?? 9) < 0.45 || mv === K.moves.hurt) {
      sz.face = 'hurt';
      return;
    }
    if (mv) {
      sz.face = 'focus';
      return;
    }
    const calm = clamp((a.calm ?? 1) * (1 - clamp(a.walkW ?? 0, 0, 1)) * (a.moving ? 0 : 1) * (m.pose || m.cine ? 0 : 1), 0, 1);
    if (calm < 0.02) return;
    const hold = K.hold;
    const go = (pose, w) => {
      if (w > 0.001) for (const [k, v] of Object.entries(pose)) out[k] = (out[k] ?? 0) + (v - (out[k] ?? 0)) * w;
    };
    const breath = Math.sin(t * 1.4);
    // dozing (twice), head drooped low, stalks drooping
    const doze1 = hold(lu, 0, 0.4, 5.8, 6.0) * calm;
    const doze2 = hold(lu, 11.2, 11.8, 16.8, 17.0) * calm;
    const doze = Math.max(doze1, doze2);
    go({ nAng: -14, head: 16 + breath * 2, neck: -0.25, droop: 0.6, stalkA: 18, crouch: 0.15 }, doze);
    // RRRING! a jolt awake (twice: the second shorter)
    const ring1 = hold(lu, 6.0, 6.05, 9.12, 9.22);
    const ring2 = hold(lu, 17.0, 17.05, 19.9, 20.0);
    sz.ring = Math.max(ring1, ring2);
    const jolt = Math.max(hold(lu, 6.0, 6.08, 6.4, 6.8), hold(lu, 17.0, 17.08, 17.4, 17.8)) * calm;
    go({ hop: 0.14, nAng: 16, head: -10, stalkA: -22, stalk: 0.4, droop: 0 }, jolt);
    const awake = Math.max(hold(lu, 6.4, 6.6, 8.2, 8.5), hold(lu, 17.4, 17.6, 19.2, 19.5)) * calm;
    go({ nAng: 6, head: -4, stalkA: -10, lean: Math.sin(t * 30) * 2 }, awake);
    if (Math.max(ring1, ring2) > 0.3 && sz.ring > 0.2) sz.rrring = ((lu < 12 ? lu - 6 : lu - 17) % 0.9) / 0.9;
    // a grumpy turn back and a bonk on the clock's top
    const turn1 = hold(lu, 8.3, 8.7, 9.3, 9.6);
    const turn2 = hold(lu, 19.3, 19.7, 20.0, 20.3);
    const turn = Math.max(turn1, turn2) * calm;
    const bonkDip = Math.max(hold(lu, 9.05, 9.15, 9.25, 9.4), hold(lu, 19.8, 19.9, 20.0, 20.15));
    go({ nAng: 34 - bonkDip * 16, head: -34 + bonkDip * 18, neck: 0.35, stretch: 0.15 }, turn);
    if (lu > 9.1 && lu < 9.9) sz.bonk = (lu - 9.1) / 0.8;
    if (lu > 19.85 && lu < 20.65) sz.bonk = (lu - 19.85) / 0.8;
    // a big yawn and a stretch, then settling
    const yawn = hold(lu, 9.7, 10.1, 10.9, 11.3) * calm;
    go({ nAng: 22, head: -14, neck: 0.3, stretch: 0.3, stalkA: 8 }, yawn);
    sz.yawn = yawn;
    // the second time: tucked right into its clock to sleep, then a peek out
    const tuck = hold(lu, 20.5, 21.2, 27.4, 28.0) * calm;
    go({ hide: 1 }, tuck);
    const peek = hold(lu, 27.6, 28.0, 29.4, 30) * calm;
    go({ peek: 0.8, nAng: 4, head: 4, droop: 0.3 }, peek);
    sz.z = Math.max(doze, tuck * 0.8);
    sz.face = jolt > 0.3 || awake > 0.4 ? 'wide' : turn > 0.4 ? 'focus' : yawn > 0.3 || doze > 0.4 || tuck > 0.4 ? 'sleep' : peek > 0.4 ? 'open' : null;
  },
  // Its extras: a wobbly "RRRING!" and ring-lines round the bells, a soft "bonk", sleepy z's.
  fx: (ctx, m, a, S, K) => {
    const sz = a.sz;
    if (!sz || m.hp <= 0) return;
    const sk = a.bk;
    const t = a.t ?? 0;
    const R = K.SR;
    const text = (str, x, y, size, col, al, rot = 0) => {
      ctx.save();
      ctx.globalAlpha *= al;
      ctx.translate(x, y);
      if (a.flip) ctx.scale(-1, 1);
      ctx.rotate(rot);
      ctx.font = `800 ${size}px Nunito, "Trebuchet MS", sans-serif`;
      ctx.lineWidth = Math.max(1, size * 0.22);
      ctx.strokeStyle = '#ffffff';
      ctx.fillStyle = col;
      ctx.textAlign = 'center';
      ctx.strokeText(str, 0, 0);
      ctx.fillText(str, 0, 0);
      ctx.restore();
    };
    ctx.save();
    K.upright(ctx, a);
    const top = [sk.sc[0], sk.sc[1] - R * 1.5];
    if (sz.ring > 0.05) {
      // ring-lines arcing off both bells
      ctx.strokeStyle = K.tint(a, '#ffe08a', 0.9 * sz.ring);
      ctx.lineWidth = 0.7;
      ctx.lineCap = 'round';
      for (const s of [-1, 1]) {
        const u = (t * 3 + (s > 0 ? 0.5 : 0)) % 1;
        const cx = sk.sc[0] + s * R * 0.75;
        const cy = sk.sc[1] - R * 1.05;
        const r = R * (0.4 + u * 0.5);
        ctx.globalAlpha = sz.ring * (1 - u);
        ctx.beginPath();
        ctx.arc(cx, cy, r, s > 0 ? -1.1 : Math.PI + 0.1, s > 0 ? -0.1 : Math.PI + 1.1);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    if (sz.rrring >= 0) {
      const u = sz.rrring;
      text('RRRING!', top[0], top[1] - 3 - u * 3, 6.2, '#ff7a8a', Math.sin(Math.PI * Math.min(1, u * 1.3)) * Math.min(1, sz.ring * 2), Math.sin(t * 40) * 0.08);
    }
    if (sz.bonk >= 0) {
      const u = sz.bonk;
      text('bonk!', top[0] - R * 0.3, top[1] - u * 4, 5.4, '#8f6ad8', Math.sin(Math.PI * u));
    }
    if (sz.z > 0.25) {
      const u = (t * 0.45) % 1;
      const hc = sk.hc ?? sk.sc;
      text('z', hc[0] + 4 + u * 5, hc[1] - 6 - u * 9, 4.4 + u * 2.6, '#a99ee8', sz.z * Math.sin(Math.PI * u));
    }
    ctx.restore();
  },
};

const S = dressedSnail(SNOOZE);
export const SNOOZE_SNAIL_ART = { ...S.art, noHop: true };
export const SNOOZE_SNAIL_SIZE = { w: Math.round(S.w), h: Math.round(S.h), speed: S.speed };
