// The Curtain Octopus (2026-11-27, new for the Dream Theatre's Grand Lobby, in the Backdrop Beaver's place:
// the player wanted the late regulars to be new creatures that fit their place, each on its own base). The
// theatre's stagehand: a soft rose octopus who wears a piece of the stage curtain as a hood, red velvet
// draped over its head with a gold fringe across its brow and a tasselled gold tie-back at its side, and a
// little stagehand headset with a microphone by its mouth. Big friendly eyes, a blush. It moves on its own
// copy of the tentacle base (octobase.js, its octopus: arms, crawl, springs and moves), dressed here.
import { dressedOcto } from './octobase.js';

const TAU = Math.PI * 2;
const ell = (ctx, x, y, rx, ry, r = 0) => {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, r, 0, TAU);
};
const COL = {
  velvet: '#d8505e',
  velvetSh: '#a83848',
  velvetLt: '#f08088',
  gold: '#ffd774',
  goldSh: '#e0a84a',
  eye: '#3a2438',
  blush: '#ff8fa8',
  set: '#5a5470',
  setLt: '#8a84a2',
  mic: '#3e3a52',
};

// ---------- Its face (on the front of its head, the mantle's frame: x forward, y down from its base) ----------
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
    ctx.lineWidth = r * 0.36;
    ctx.beginPath();
    const up = f === 'happy' ? -1 : 1;
    ctx.moveTo(x - r, y);
    ctx.quadraticCurveTo(x, y + up * r * 0.85, x + r, y);
    ctx.stroke();
    return;
  }
  ell(ctx, x, y, r, r * 1.15);
  ctx.fillStyle = tone(a, COL.eye);
  ctx.fill();
  ell(ctx, x, y + r * 0.45, r * 0.62, r * 0.4);
  ctx.fillStyle = tone(a, '#7a4a72');
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ell(ctx, x - r * 0.3, y - r * 0.38, r * 0.38, r * 0.32);
  ctx.fill();
  ell(ctx, x + r * 0.32, y + r * 0.34, r * 0.16, r * 0.13);
  ctx.fill();
  if (f === 'focus') {
    ctx.lineWidth = r * 0.3;
    ctx.beginPath();
    ctx.moveTo(x - r * 1.1, y - r * 1.65);
    ctx.lineTo(x + r * 1.0, y - r * 1.15);
    ctx.stroke();
  }
}
const faceOf = (a) => a.co?.face ?? ((((a.t ?? 0) + (a.mo?.uid ?? 0) * 0.43) % 4.8) < 0.13 ? 'blink' : 'open');
function face(ctx, a, sk, F) {
  const { inM, tone } = F;
  const lk = (sk.look ?? 0) * 1.1;
  const f = faceOf(a);
  const eN = inM([4.2 + lk, -8.2]);
  const eF = inM([8.4 + lk, -8.8]);
  ctx.fillStyle = tone(a, COL.blush, 0.55);
  ell(ctx, eN[0] - 1.4, eN[1] + 2.6, 1.7, 0.8);
  ctx.fill();
  ell(ctx, eF[0] + 1, eF[1] + 2.4, 1.1, 0.6);
  ctx.fill();
  eye(ctx, a, tone, eN[0], eN[1], 1.7, f);
  eye(ctx, a, tone, eF[0], eF[1], 1.45, f);
  const mth = inM([6.8 + lk, -5.2]);
  ctx.strokeStyle = tone(a, '#9a4a6a');
  ctx.lineWidth = 0.45;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if ((a.co?.call ?? 0) > 0.3) {
    ell(ctx, mth[0], mth[1] + 0.3, 0.7, 0.8);
    ctx.fillStyle = tone(a, '#a04a6e');
    ctx.fill();
  } else if (f === 'focus' || f === 'hurt') {
    ctx.moveTo(mth[0] - 0.8, mth[1]);
    ctx.lineTo(mth[0] + 0.8, mth[1] - 0.1);
    ctx.stroke();
  } else {
    ctx.moveTo(mth[0] - 0.9, mth[1] - 0.3);
    ctx.quadraticCurveTo(mth[0], mth[1] + 0.7, mth[0] + 0.9, mth[1] - 0.3);
    ctx.stroke();
  }
}

// ---------- Its curtain hood and headset (over the head, in the mantle's frame) ----------
function hood(ctx, a, mode, KIT) {
  const sk = a.tk;
  if (!sk) return;
  const inM = (p) => [sk.Mb[0] + p[0] * Math.cos(sk.mAng) - p[1] * Math.sin(sk.mAng), sk.Mb[1] + p[0] * Math.sin(sk.mAng) + p[1] * Math.cos(sk.mAng)];
  const t = a.t ?? 0;
  const sway = Math.sin(t * 1.4) * 0.4 + (a.co?.flutter ?? 0);
  const rx = sk.rx;
  const ry = sk.ry;
  // the velvet drape: over the top of its head and down its back, its hem in soft folds
  const pts = [
    [rx * 0.55, -ry * 1.72],
    [rx * 0.05, -ry * 2.08],
    [-rx * 0.6, -ry * 1.86],
    [-rx * 1.02, -ry * 1.2],
    [-rx * 1.12 + sway, -ry * 0.45],
    [-rx * 1.0 + sway, ry * 0.12],
    [-rx * 0.72 + sway * 0.6, -ry * 0.05],
    [-rx * 0.5, ry * 0.1],
    [-rx * 0.38, -ry * 0.55],
    [-rx * 0.12, -ry * 1.22],
    [rx * 0.42, -ry * 1.42],
    [rx * 0.82, -ry * 1.36],
  ].map(inM);
  ctx.beginPath();
  pts.forEach((p, i) => {
    const q = pts[(i + 1) % pts.length];
    const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    if (i === 0) ctx.moveTo(...m);
    else ctx.quadraticCurveTo(p[0], p[1], m[0], m[1]);
  });
  ctx.quadraticCurveTo(pts[0][0], pts[0][1], (pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2);
  ctx.closePath();
  if (mode === 'line') {
    KIT.edge(ctx);
  } else {
    const g = ctx.createLinearGradient(...inM([0, -ry * 2.1]), ...inM([-rx * 0.6, ry * 0.1]));
    g.addColorStop(0, KIT.tone(a, COL.velvetLt));
    g.addColorStop(0.45, KIT.tone(a, COL.velvet));
    g.addColorStop(1, KIT.tone(a, COL.velvetSh));
    ctx.fillStyle = g;
    ctx.fill();
    // soft fold lines down the drape
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = KIT.tone(a, COL.velvetSh, 0.6);
    ctx.lineWidth = 0.9;
    ctx.lineCap = 'round';
    for (const k of [-0.25, -0.62]) {
      ctx.beginPath();
      ctx.moveTo(...inM([rx * k, -ry * 1.9]));
      ctx.quadraticCurveTo(...inM([rx * (k - 0.25), -ry * 1.0]), ...inM([rx * (k - 0.2) + sway * 0.5, ry * 0.05]));
      ctx.stroke();
    }
    ctx.restore();
  }
  // the gold fringe across its brow: a band and soft hanging tufts
  const b0 = inM([-rx * 0.15, -ry * 1.3]);
  const b1 = inM([rx * 0.86, -ry * 1.36]);
  ctx.beginPath();
  ctx.moveTo(...b0);
  ctx.quadraticCurveTo(...inM([rx * 0.36, -ry * 1.52]), ...b1);
  ctx.lineCap = 'round';
  if (mode === 'line') {
    ctx.lineWidth = 3.4;
    KIT.edge(ctx);
    ctx.lineWidth = 3.4;
    ctx.stroke();
  } else {
    ctx.strokeStyle = KIT.tone(a, COL.gold);
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.strokeStyle = KIT.tone(a, COL.goldSh);
    ctx.lineWidth = 0.9;
    for (let i = 0; i < 5; i++) {
      const u = (i + 0.5) / 5;
      const p = inM([-rx * 0.15 + rx * 1.0 * u, -ry * (1.3 + 0.16 * Math.sin(Math.PI * u)) + 0.6]);
      ctx.beginPath();
      ctx.moveTo(p[0], p[1]);
      ctx.lineTo(p[0] + Math.sin(t * 2 + i) * 0.2, p[1] + 1.6);
      ctx.stroke();
    }
  }
  // the tie-back at its side: a gold rope loop and a tassel
  const tb = inM([-rx * 0.62, -ry * 0.62]);
  ell(ctx, tb[0], tb[1], 1.6, 1.3);
  if (mode === 'line') KIT.edge(ctx);
  else {
    ctx.fillStyle = KIT.tone(a, COL.gold);
    ctx.fill();
  }
  const tw = Math.sin(t * 2.2) * 0.25 + sway * 0.1;
  ctx.save();
  ctx.translate(tb[0], tb[1] + 1);
  ctx.rotate(tw);
  ctx.beginPath();
  ctx.moveTo(-0.6, 0);
  ctx.lineTo(0.6, 0);
  ctx.quadraticCurveTo(1.8, 3.6, 1.2, 4.6);
  ctx.lineTo(-1.2, 4.6);
  ctx.quadraticCurveTo(-1.8, 3.6, -0.6, 0);
  ctx.closePath();
  if (mode === 'line') KIT.edge(ctx);
  else {
    ctx.fillStyle = KIT.tone(a, COL.gold);
    ctx.fill();
    ctx.strokeStyle = KIT.tone(a, COL.goldSh);
    ctx.lineWidth = 0.4;
    for (const x of [-0.6, 0, 0.6]) {
      ctx.beginPath();
      ctx.moveTo(x, 2);
      ctx.lineTo(x * 1.2, 4.4);
      ctx.stroke();
    }
  }
  ctx.restore();
  // the headset: a band over the hood, an ear pad, a little boom mic curving round to its mouth
  if (mode === 'fill') {
    ctx.strokeStyle = KIT.tone(a, COL.set);
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(...inM([-rx * 0.2, -ry * 1.98]));
    ctx.quadraticCurveTo(...inM([rx * 0.1, -ry * 2.06]), ...inM([rx * 0.02, -ry * 1.3]));
    ctx.stroke();
  }
  const pad = inM([rx * 0.02, -ry * 1.05]);
  ell(ctx, pad[0], pad[1], 1.5, 1.8, sk.mAng);
  if (mode === 'line') KIT.edge(ctx);
  else {
    ctx.fillStyle = KIT.tone(a, COL.set);
    ctx.fill();
    ell(ctx, pad[0] - 0.3, pad[1] - 0.4, 0.6, 0.7, sk.mAng);
    ctx.fillStyle = KIT.tone(a, COL.setLt);
    ctx.fill();
    ctx.strokeStyle = KIT.tone(a, COL.set);
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(pad[0], pad[1] + 1.4);
    const mic = inM([rx * 0.62, -ry * 0.42]);
    ctx.quadraticCurveTo(pad[0] + 1, mic[1] + 1.4, mic[0], mic[1]);
    ctx.stroke();
    ell(ctx, mic[0], mic[1], 0.9, 0.75);
    ctx.fillStyle = KIT.tone(a, COL.mic);
    ctx.fill();
  }
}

const look = {
  face,
  over: {
    body: (ctx, a, mode, KIT) => hood(ctx, a, mode, KIT),
  },
  // Its act, about 30 s, a stagehand before the show (on the base's channels: x, hop, lift, pitch, tilt,
  // look, pump, crouch, raise, stream, flat, curl, splay, slap, whip, grab, squeeze, free):
  //   - "Places!" called into its headset mic, a hand to the ear pad;
  //   - hauling on a fly rope, hand over hand, to raise a backdrop (a little "heave!");
  //   - a dust-off: a shake of its curtain hood, a puff of stage dust;
  //   - checking the spotlight: a little lamp held up, its soft beam swept across the floor;
  //   - a bow to the empty house, curtain fluttering, a few sparkles of pretend applause.
  pose: (m, a, out, KIT, mv) => {
    const co = { face: null, call: 0, flutter: 0, places: -1, rope: 0, tug: 0, dust: -1, lamp: 0, beam: 0, bow: 0 };
    a.co = co;
    if (m.hp <= 0) {
      co.face = 'dead';
      return;
    }
    if ((a.hurtAgo ?? 9) < 0.45) {
      co.face = 'hurt';
      return;
    }
    if (mv) {
      co.face = 'focus';
      return;
    }
    const calm = Math.max(0, Math.min(1, (a.calm ?? 1) * (1 - Math.min(1, a.walkW ?? 0)) * (a.moving ? 0 : 1) * (m.pose || m.cine ? 0 : 1)));
    if (calm < 0.02) return;
    const t = a.t ?? 0;
    const lu = (((t + (m.uid % 5) * 3.9) % 30) + 30) % 30;
    const hold = (x, a0, a1, b0, b1) => {
      const e = (u) => u * u * (3 - 2 * u);
      return x <= a0 || x >= b1 ? 0 : x < a1 ? e((x - a0) / (a1 - a0)) : x <= b0 ? 1 : e((b1 - x) / (b1 - b0));
    };
    const go = (pose, w) => {
      if (w > 0.001) for (const [k, v] of Object.entries(pose)) out[k] = (out[k] ?? 0) + (v - (out[k] ?? 0)) * w;
    };
    // "Places!"
    const call = hold(lu, 1, 1.4, 4.4, 4.9) * calm;
    go({ raise: 0.45, tilt: -6, look: 0.6, pump: 0.15 }, call);
    co.call = hold(lu, 1.6, 1.8, 2.6, 2.8) + hold(lu, 3.1, 3.3, 4, 4.2);
    if (call > 0.4) co.places = ((lu - 1.4) % 1.5) / 1.5;
    // hauling a fly rope, hand over hand
    const haul = hold(lu, 6, 6.5, 10.6, 11.2) * calm;
    const pull = Math.max(0, Math.sin((lu - 6.5) * Math.PI * 1.6));
    co.rope = haul;
    co.tug = pull;
    go({ grab: 0.7 + pull * 0.3, raise: 0.6 - pull * 0.3, crouch: 0.1 + pull * 0.18, tilt: -4 + pull * 6, pitch: -2 + pull * 3 }, haul);
    // a dust-off: shaking its hood
    const shake = hold(lu, 12.2, 12.5, 14, 14.4) * calm;
    go({ tilt: Math.sin(lu * 26) * 9, pump: 0.2 }, shake);
    co.flutter = shake * Math.sin(lu * 26) * 1.2;
    if (lu > 13.6 && lu < 14.8) co.dust = (lu - 13.6) / 1.2;
    // checking the spotlight: a little lamp held up, its beam swept across the floor
    const lamp = hold(lu, 16.5, 17, 21.2, 21.8) * calm;
    co.lamp = lamp;
    co.beam = Math.sin((lu - 17) * 1.4);
    go({ grab: 0.55, raise: 0.4, look: co.beam * 0.5, tilt: co.beam * 3 }, lamp);
    // a bow to the empty house
    const bow = hold(lu, 23.5, 24.2, 25.6, 26.4) * calm;
    co.bow = bow;
    go({ pitch: 22, crouch: 0.3, tilt: 10, look: 0 }, bow);
    co.flutter += bow * 0.8;
    co.face = call > 0.4 ? 'open' : haul > 0.4 ? 'focus' : shake > 0.4 ? 'blink' : lamp > 0.4 ? 'open' : bow > 0.4 ? 'happy' : null;
  },
  // Its extras: a "Places!" call, the fly rope it hauls, a puff of stage dust, its lamp's soft beam, and
  // a few sparkles of pretend applause as it bows.
  fx: (ctx, m, a, KIT) => {
    const co = a.co;
    const sk = a.tk;
    if (!co || !sk || m.hp <= 0) return;
    const t = a.t ?? 0;
    const inM = (p) => [sk.Mb[0] + p[0] * Math.cos(sk.mAng) - p[1] * Math.sin(sk.mAng), sk.Mb[1] + p[0] * Math.sin(sk.mAng) + p[1] * Math.cos(sk.mAng)];
    const head = inM([sk.rx * 0.4, -sk.ry * 2.1]);
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
    if (co.places >= 0) text('places!', head[0] + 4, head[1] - 2 - co.places * 4, 5, '#d8505e', Math.sin(Math.PI * co.places));
    const hand = sk.grabP ?? head;
    if (co.rope > 0.05) {
      // the fly rope, from up in the flies down through its hand
      ctx.save();
      ctx.globalAlpha *= Math.min(1, co.rope * 1.5);
      ctx.strokeStyle = KIT.tone(a, '#c8a070');
      ctx.lineWidth = 1.1;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(hand[0] + 1, hand[1] - 18);
      ctx.lineTo(hand[0], hand[1] + 6);
      ctx.stroke();
      ctx.strokeStyle = KIT.tone(a, '#9a7448');
      ctx.lineWidth = 0.4;
      for (let i = 0; i < 6; i++) {
        const y = hand[1] - 16 + i * 4 + ((co.tug * 3) % 4);
        ctx.beginPath();
        ctx.moveTo(hand[0] + 0.2, y);
        ctx.lineTo(hand[0] + 1, y + 1);
        ctx.stroke();
      }
      ctx.restore();
      if (co.tug > 0.85) text('heave!', head[0] + 2, head[1] - 4, 4.4, '#9a7448', (co.tug - 0.85) / 0.15);
    }
    if (co.dust >= 0) {
      // a soft puff of stage dust off its hood (one merged cloud, two sparkles)
      const u = co.dust;
      const cx = head[0] - 3;
      const cy = head[1] + 1 - u * 4;
      ctx.save();
      ctx.globalAlpha *= (1 - u) * 0.75;
      ctx.fillStyle = '#f6eef8';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 3 + u * 4, 1.8 + u * 2, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 2.6 + u * 2, cy - 1, 2.2 + u * 3, 1.6 + u * 1.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      for (const [dx, dy] of [[-4, -3], [5, -4]]) {
        const x = cx + dx * (1 + u);
        const y = cy + dy * (1 + u);
        const s2 = 1.2;
        ctx.beginPath();
        ctx.moveTo(x, y - s2 * 1.6);
        ctx.quadraticCurveTo(x, y, x + s2 * 1.6, y);
        ctx.quadraticCurveTo(x, y, x, y + s2 * 1.6);
        ctx.quadraticCurveTo(x, y, x - s2 * 1.6, y);
        ctx.quadraticCurveTo(x, y, x, y - s2 * 1.6);
        ctx.fill();
      }
      ctx.restore();
    }
    if (co.lamp > 0.05) {
      // a little stage lamp in its hand, its soft beam swept across the floor
      ctx.save();
      ctx.globalAlpha *= co.lamp;
      const ang = 0.9 + co.beam * 0.35;
      const g = ctx.createLinearGradient(hand[0], hand[1], hand[0] + Math.cos(ang) * 22, hand[1] + Math.sin(ang) * 22);
      g.addColorStop(0, 'rgba(255,240,180,0.75)');
      g.addColorStop(1, 'rgba(255,240,180,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(hand[0], hand[1]);
      ctx.lineTo(hand[0] + Math.cos(ang - 0.28) * 22, hand[1] + Math.sin(ang - 0.28) * 22);
      ctx.lineTo(hand[0] + Math.cos(ang + 0.28) * 22, hand[1] + Math.sin(ang + 0.28) * 22);
      ctx.closePath();
      ctx.fill();
      ctx.translate(hand[0], hand[1]);
      ctx.rotate(ang);
      ctx.fillStyle = KIT.tone(a, '#5a5470');
      ctx.beginPath();
      ctx.moveTo(-2.4, -1.6);
      ctx.lineTo(1.2, -2.2);
      ctx.lineTo(1.2, 2.2);
      ctx.lineTo(-2.4, 1.6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fff6c8';
      ctx.fillRect(0.8, -1.8, 0.8, 3.6);
      ctx.restore();
    }
    if (co.bow > 0.4) {
      // a few sparkles of pretend applause
      ctx.save();
      for (let i = 0; i < 3; i++) {
        const u = (t * 0.8 + i / 3) % 1;
        ctx.globalAlpha = co.bow * Math.sin(Math.PI * u);
        const x = head[0] - 8 + i * 8;
        const y = head[1] - 2 - u * 8;
        const s = 1.6;
        ctx.fillStyle = '#ffe08a';
        ctx.beginPath();
        ctx.moveTo(x, y - s * 1.6);
        ctx.quadraticCurveTo(x, y, x + s * 1.6, y);
        ctx.quadraticCurveTo(x, y, x, y + s * 1.6);
        ctx.quadraticCurveTo(x, y, x - s * 1.6, y);
        ctx.quadraticCurveTo(x, y, x, y - s * 1.6);
        ctx.fill();
      }
      ctx.restore();
    }
  },
};

const O = dressedOcto(look);
export const CURTAIN_OCTOPUS_ART = { ...O.art, noHop: true };
export const CURTAIN_OCTOPUS_SIZE = { w: Math.round(O.w), h: Math.round(O.h), speed: O.speed };
