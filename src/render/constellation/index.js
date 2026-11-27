// The Constellation Starfish (2026-11-27, new for the Star Observatory's Starlit Stair, in the Spyglass
// Loris's place: the player wanted the late regulars to be new creatures that fit their place, each on
// its own base; the id stays `starcarto`). A little star that fell into the observatory and stayed to
// help chart the sky: a soft night-periwinkle starfish, a pale moon-glow round its face, five arm tips
// that glow gold and twinkle in turn, and a small constellation of its own drawn across its top arms
// (three gold stars, joined by fine gold lines, like a star map). Big starry eyes, a blush. It moves on
// its own copy of the tentacle base (starbase.js, its starfish: arms, tiptoe walk, cartwheels, springs
// and moves), dressed here.
import { dressedStar } from './starbase.js';

const TAU = Math.PI * 2;
const ell = (ctx, x, y, rx, ry, r = 0) => {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, r, 0, TAU);
};
const COL = {
  gold: '#ffd774',
  goldLt: '#fff3c4',
  goldSh: '#e0a84a',
  line: '#ffe9a8',
  moon: '#e4e6ff',
  eye: '#262a5e',
  eyeLow: '#5a62b8',
  blush: '#ff9ec0',
  mouth: '#3a3c7a',
};
// A four-point sparkle (soft, its sides curved in).
function sparkle(ctx, x, y, r, col) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fillStyle = col;
  ctx.fill();
}
// A soft round five-point star.
function star5(ctx, x, y, r, turn = 0) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const an = -Math.PI / 2 + turn + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.5 : r;
    const q = [x + Math.cos(an) * rr, y + Math.sin(an) * rr];
    if (i) ctx.lineTo(...q);
    else ctx.moveTo(...q);
  }
  ctx.closePath();
}
function glow(ctx, x, y, r, col, al) {
  if (al <= 0.01) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, col);
  g.addColorStop(1, 'rgba(255,240,180,0)');
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.restore();
}

// ---------- Its face (round its middle, in the star's own turning frame: y down) ----------
function eye(ctx, a, tone, x, y, r, f) {
  ctx.lineCap = 'round';
  ctx.strokeStyle = tone(a, COL.eye);
  if (f === 'hurt') {
    ctx.lineWidth = r * 0.36;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.8, y - r * 0.6);
    ctx.lineTo(x + r * 0.5, y);
    ctx.lineTo(x - r * 0.8, y + r * 0.6);
    ctx.stroke();
    return;
  }
  if (f === 'blink' || f === 'sleep' || f === 'dead' || f === 'happy') {
    ctx.lineWidth = r * 0.34;
    ctx.beginPath();
    const up = f === 'happy' ? -1 : 1;
    ctx.moveTo(x - r, y);
    ctx.quadraticCurveTo(x, y + up * r * 0.85, x + r, y);
    ctx.stroke();
    return;
  }
  const big = f === 'ooh' ? 1.12 : 1;
  ell(ctx, x, y, r * big, r * 1.15 * big);
  ctx.fillStyle = tone(a, COL.eye);
  ctx.fill();
  // the starry low light in each eye
  ell(ctx, x, y + r * 0.45, r * 0.64, r * 0.42);
  ctx.fillStyle = tone(a, COL.eyeLow);
  ctx.fill();
  // its shine: a little star, and a soft dot
  ctx.save();
  sparkle(ctx, x - r * 0.3, y - r * 0.36, r * 0.62, '#ffffff');
  ctx.restore();
  ctx.fillStyle = '#ffffff';
  ell(ctx, x + r * 0.34, y + r * 0.36, r * 0.17, r * 0.14);
  ctx.fill();
  if (f === 'focus') {
    // its lids down a little, set on the job
    ctx.fillStyle = tone(a, '#8e96e4');
    ctx.beginPath();
    ctx.rect(x - r * 1.3, y - r * 1.4, r * 2.6, r * 0.75);
    ctx.fill();
  }
}
const faceOf = (a) => a.cs?.face ?? ((((a.t ?? 0) + (a.mo?.uid ?? 0) * 0.43) % 4.6) < 0.13 ? 'blink' : 'open');
function face(ctx, a, sk, F) {
  const { inO, tone } = F;
  const lk = (sk.look ?? 0) * 1.1;
  const f = faceOf(a);
  const at = (x, y) => inO([x, y]);
  // a pale moon-glow round its face
  const mid = at(1.3 + lk * 0.6, -1.2);
  glow(ctx, mid[0], mid[1], 8.4, COL.moon, 0.55 + (a.cs?.glow ?? 0) * 0.35);
  const eN = at(-1.5 + lk, -2.6);
  const eF = at(4.3 + lk, -2.4);
  const rot = sk.rot ?? 0;
  ctx.save();
  ctx.fillStyle = tone(a, COL.blush, 0.6);
  const bN = at(-2.6 + lk, 0.4);
  const bF = at(5.6 + lk, 0.5);
  ell(ctx, bN[0], bN[1], 1.6, 0.8, rot);
  ctx.fill();
  ell(ctx, bF[0], bF[1], 1.2, 0.65, rot);
  ctx.fill();
  ctx.restore();
  for (const [p, r] of [[eN, 1.75], [eF, 1.55]]) {
    ctx.save();
    ctx.translate(p[0], p[1]);
    ctx.rotate(rot);
    eye(ctx, a, tone, 0, 0, r, f);
    ctx.restore();
  }
  const m = at(1.5 + lk, 0.9);
  ctx.save();
  ctx.translate(m[0], m[1]);
  ctx.rotate(rot);
  ctx.strokeStyle = tone(a, COL.mouth);
  ctx.lineWidth = 0.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (f === 'ooh') {
    ell(ctx, 0, 0.3, 0.7, 0.85);
    ctx.fillStyle = tone(a, '#5a3c78');
    ctx.fill();
  } else if (f === 'focus' || f === 'hurt') {
    ctx.moveTo(-0.8, 0);
    ctx.lineTo(0.8, -0.1);
    ctx.stroke();
  } else if (f === 'happy') {
    ctx.moveTo(-1.1, -0.3);
    ctx.quadraticCurveTo(0, 1.4, 1.1, -0.3);
    ctx.closePath();
    ctx.fillStyle = tone(a, '#5a3c78');
    ctx.fill();
  } else if (f === 'sleep' || f === 'dead') {
    ell(ctx, 0, 0.2, 0.45, 0.35);
    ctx.fillStyle = tone(a, '#5a3c78');
    ctx.fill();
  } else {
    ctx.moveTo(-0.9, -0.3);
    ctx.quadraticCurveTo(0, 0.7, 0.9, -0.3);
    ctx.stroke();
  }
  ctx.restore();
}

// ---------- Its constellation and its glowing tips (over the star) ----------
// (which arms carry the constellation's three stars, and how far along each: the top arm and the two
// beside it, so the little star map arcs over its head)
const MAP = [[4, 2.2], [0, 3], [1, 2.2]];
function along(J, u) {
  const i = Math.min(J.length - 2, Math.floor(u));
  const f = u - i;
  return [J[i][0] + (J[i + 1][0] - J[i][0]) * f, J[i][1] + (J[i + 1][1] - J[i][1]) * f];
}
function dress(ctx, a, mode, KIT) {
  const sk = a.tk;
  if (!sk || mode !== 'fill') return;
  const t = a.t ?? 0;
  const tone = KIT.tone;
  const dead = (a.mo?.hp ?? 1) <= 0;
  const pts = MAP.map(([k, u]) => along(sk.arms[k].J, u));
  // the fine gold lines joining its stars
  ctx.save();
  ctx.globalAlpha *= 0.7;
  ctx.strokeStyle = tone(a, COL.line);
  ctx.lineWidth = 0.42;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(...pts[0]);
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const lift = (p, q) => {
    const m = mid(p, q);
    return [m[0] + (m[0] - sk.O[0]) * 0.12, m[1] + (m[1] - sk.O[1]) * 0.12];
  };
  ctx.quadraticCurveTo(...lift(pts[0], pts[1]), ...pts[1]);
  ctx.quadraticCurveTo(...lift(pts[1], pts[2]), ...pts[2]);
  ctx.stroke();
  ctx.restore();
  pts.forEach((p, i) => {
    const tw = 0.8 + 0.2 * Math.sin(t * 2.2 + i * 2.1);
    sparkle(ctx, p[0], p[1], (i === 1 ? 1.9 : 1.45) * tw, tone(a, COL.gold));
    sparkle(ctx, p[0], p[1], (i === 1 ? 0.9 : 0.7) * tw, tone(a, COL.goldLt));
  });
  // its five tips, glowing gold, twinkling in turn (all at once when it twinkles on purpose)
  const cs = a.cs ?? {};
  for (let k = 0; k < 5; k++) {
    const J = sk.arms[k].J;
    const n = J.length - 1;
    const p = along(J, n - 0.45);
    const own = 0.5 + 0.5 * Math.sin(t * 1.6 + k * 1.26);
    const flash = cs.tips ? Math.max(0, Math.sin(Math.PI * Math.min(1, Math.max(0, cs.tipU * 5 - k * 0.9)))) : 0;
    const k2 = dead ? 0.2 : Math.min(1, own * 0.6 + 0.25 + flash * 0.9);
    glow(ctx, p[0], p[1], 3.4 + flash * 2.4, COL.goldLt, 0.55 * k2);
    sparkle(ctx, p[0], p[1], 1.2 + k2 * 0.7 + flash * 0.8, tone(a, COL.gold));
    sparkle(ctx, p[0], p[1], 0.55 + k2 * 0.3 + flash * 0.4, '#ffffff');
  }
}

const look = {
  face,
  over: { star: dress },
  // Its act, about 30 s, the observatory's little star (on the base's channels: x, hop, lift, pitch,
  // tilt, look, crouch, raise, splay, slap + whip, grab, squeeze, free, flat, curl, sleep; and its own
  // whole turn, a.dressRoll):
  //   - stargazing: up tall, leaning back, an "ooh" as a shooting star streaks over;
  //   - connect the dots: its front arm up, tracing a little constellation in the air, star by star;
  //   - a twinkle: little hops, its five tips flashing one after another;
  //   - a cartwheel, a whole turn, a trail of sparkles;
  //   - a nap curled up, glowing softly like a sleeping star, a "z", then up with a hop.
  pose: (m, a, out, KIT, mv) => {
    const cs = { face: null, gaze: 0, comet: -1, trace: 0, traceU: 0, tips: 0, tipU: 0, wheel: 0, nap: 0, glow: 0 };
    a.cs = cs;
    // (its own turn: set by the cartwheel below; anything else eases it back to upright, a whole turn
    // round counting as upright, never a snap)
    const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
    let turn = a.dressRoll ?? 0;
    turn -= Math.round(turn / TAU) * TAU;
    a.dressRoll = turn * Math.max(0, 1 - dt * 7);
    const dead = m.hp <= 0;
    const hurt = (a.hurtAgo ?? 9) < 0.45;
    // (how much of its act shows: eased in and out, so a move, a hit or a step never cuts it off; this
    // base's channels are not sprung)
    const want = dead || hurt || mv ? 0 : Math.max(0, Math.min(1, (a.calm ?? 1) * (1 - Math.min(1, a.walkW ?? 0)) * (a.moving ? 0 : 1) * (m.pose || m.cine ? 0 : 1)));
    const was = a.csW ?? want;
    a.csW = was + (want - was) * Math.min(1, dt * (want < was ? 9 : 4));
    const calm = a.csW;
    const busy = dead ? 'dead' : hurt ? 'hurt' : mv ? 'focus' : null;
    if (busy) cs.face = busy;
    if (calm < 0.02) return;
    const t = a.t ?? 0;
    const lu = (((t + (m.uid % 5) * 3.7) % 30) + 30) % 30;
    const hold = (x, a0, a1, b0, b1) => {
      const e = (u) => u * u * (3 - 2 * u);
      return x <= a0 || x >= b1 ? 0 : x < a1 ? e((x - a0) / (a1 - a0)) : x <= b0 ? 1 : e((b1 - x) / (b1 - b0));
    };
    const go = (pose, w) => {
      if (w > 0.001) for (const [k, v] of Object.entries(pose)) out[k] = (out[k] ?? 0) + (v - (out[k] ?? 0)) * w;
    };
    // stargazing, and a shooting star
    const gaze = hold(lu, 1, 1.6, 5, 5.6) * calm;
    cs.gaze = gaze;
    go({ raise: 0.65, tilt: -12, look: -0.3, lift: 1.2 }, gaze);
    if (lu > 2.4 && lu < 3.8) cs.comet = (lu - 2.4) / 1.4;
    // connect the dots: the front arm up, tracing star to star
    const trace = hold(lu, 7, 7.5, 12, 12.6) * calm;
    cs.trace = trace;
    cs.traceU = Math.max(0, Math.min(1, (lu - 7.6) / 3.8));
    const wig = Math.sin((lu - 7.5) * 2.6);
    go({ slap: 0.9, whip: 0.5 + wig * 0.07, tilt: -4 + wig * 2, look: 0.4, lift: 0.6 }, trace);
    // a twinkle: little hops, its tips flashing in turn
    const tw = hold(lu, 14, 14.3, 17.2, 17.6) * calm;
    cs.tips = tw;
    cs.tipU = ((lu - 14.3) % 1.4) / 1.4;
    const hp = Math.max(0, Math.sin((lu - 14.3) * Math.PI * (2 / 1.4) * 2));
    go({ hop: hp * 0.1, splay: 0.35 + hp * 0.3, crouch: (1 - hp) * 0.2 }, tw);
    // a cartwheel: a whole turn (its own, eased), a hop and a sparkle trail
    const wh = hold(lu, 19, 19.25, 20.6, 20.9) * calm;
    const wu = Math.max(0, Math.min(1, (lu - 19.25) / 1.2));
    const we = wu * wu * (3 - 2 * wu);
    if (wu > 0 && wu < 1 && calm > 0.5 && !busy) a.dressRoll = we * TAU;
    cs.wheel = wh * Math.sin(Math.PI * wu);
    go({ hop: Math.sin(Math.PI * wu) * 0.16, free: 0.8, x: (we - 0.5) * 0.06 }, wh);
    // a nap, curled up and glowing, then up with a hop
    const nap = hold(lu, 23, 23.8, 27.6, 28.2) * calm;
    cs.nap = nap;
    cs.glow = nap * (0.5 + 0.5 * Math.sin(t * 1.4));
    go({ curl: 0.55, flat: 0.3, sleep: 0.5 }, nap);
    const up = hold(lu, 28.2, 28.4, 28.7, 29.2) * calm;
    go({ hop: 0.12, splay: 0.5 }, up);
    if (!busy) cs.face = gaze > 0.4 ? (cs.comet >= 0 ? 'ooh' : 'open') : trace > 0.4 ? 'focus' : tw > 0.4 ? 'happy' : wh > 0.4 ? 'happy' : nap > 0.4 ? 'sleep' : up > 0.4 ? 'happy' : null;
  },
  // Its extras: the shooting star it gazes at, the constellation it traces, a sparkle trail as it
  // cartwheels, its sleepy z.
  fx: (ctx, m, a, KIT) => {
    const cs = a.cs;
    const sk = a.tk;
    if (!cs || !sk || m.hp <= 0) return;
    const t = a.t ?? 0;
    const O = sk.O;
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
    if (cs.comet >= 0) {
      // a shooting star streaking over its head, front to back
      const u = cs.comet;
      const al = Math.sin(Math.PI * u);
      const x = O[0] + 22 - u * 40;
      const y = O[1] - 28 + u * 6;
      ctx.save();
      for (let i = 1; i <= 5; i++) {
        ctx.globalAlpha = al * 0.5 * (1 - i / 6);
        ell(ctx, x + i * 2.4, y - i * 0.36, 1.4 - i * 0.16, 0.8 - i * 0.1, -0.15);
        ctx.fillStyle = COL.goldLt;
        ctx.fill();
      }
      ctx.globalAlpha = al;
      glow(ctx, x, y, 4, COL.goldLt, 0.7);
      sparkle(ctx, x, y, 2, COL.gold);
      sparkle(ctx, x, y, 1, '#ffffff');
      ctx.restore();
      if (u > 0.3 && u < 0.9) text('ooh!', O[0] + 6, O[1] - 20 - (u - 0.3) * 4, 4.4, '#6a6ad8', Math.sin((Math.PI * (u - 0.3)) / 0.6));
    }
    if (cs.trace > 0.05) {
      // a little constellation traced in the air, star by star, the front tip drawing the line on
      const S = [[13, -25], [19, -29], [25, -23], [20, -17]].map(([x, y]) => [O[0] + x, O[1] + y]);
      // (the tip of its raised front arm, the one it points with)
      const J1 = sk.arms[1].J;
      const tip = J1[J1.length - 1];
      const u = cs.traceU * S.length;
      const got = Math.min(S.length, Math.floor(u));
      ctx.save();
      ctx.globalAlpha *= cs.trace;
      ctx.strokeStyle = COL.line;
      ctx.lineWidth = 0.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (got > 0) {
        ctx.moveTo(...S[0]);
        for (let i = 1; i < got; i++) ctx.lineTo(...S[i]);
        if (got < S.length) ctx.lineTo(tip[0], tip[1]);
        else ctx.lineTo(...S[0]);
      }
      ctx.globalAlpha *= 0.85;
      ctx.stroke();
      ctx.globalAlpha = cs.trace;
      for (let i = 0; i < got; i++) {
        const pop = Math.min(1, (u - i) * 3);
        const tw = 0.85 + 0.15 * Math.sin(t * 3 + i);
        glow(ctx, S[i][0], S[i][1], 3, COL.goldLt, 0.5 * pop);
        sparkle(ctx, S[i][0], S[i][1], 1.7 * pop * tw, COL.gold);
        sparkle(ctx, S[i][0], S[i][1], 0.8 * pop * tw, '#ffffff');
      }
      ctx.restore();
    }
    if (cs.wheel > 0.05) {
      // a short trail of sparkles behind it as it turns
      ctx.save();
      for (let i = 0; i < 3; i++) {
        const u = (t * 1.6 + i / 3) % 1;
        ctx.globalAlpha = cs.wheel * Math.sin(Math.PI * u);
        sparkle(ctx, O[0] - 10 - u * 6 + i * 3, O[1] - 6 + i * 6 - u * 4, 1.6 - u * 0.6, COL.gold);
      }
      ctx.restore();
    }
    if (cs.nap > 0.3) {
      const u = (t * 0.45) % 1;
      text('z', O[0] + 5 + u * 4, O[1] - 10 - u * 8, 4 + u * 2.4, '#7f86d8', cs.nap * Math.sin(Math.PI * u));
    }
  },
};

const D = dressedStar(look);
export const CONSTELLATION_STARFISH_ART = { ...D.art, noHop: true };
export const CONSTELLATION_STARFISH_SIZE = { w: Math.round(D.w), h: Math.round(D.h), speed: D.speed };
