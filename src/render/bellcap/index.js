// The Bell-Cap Monk (2026-11-27, new for the Sky Whale's Back, in the Mantra Lemur's place: the player
// wanted the late regulars to be new creatures that fit their place, each on its own base; the id stays
// `monk`). A little mushroom monk of the whale's gardens whose cap grew in the shape of a temple bell: the
// monks ring them, softly, to wake the sleeping whale without frightening it; some keep watch from the rim
// of Starfall Heights, where the whale passes over, ringing as it goes by. A cream stalk, a saffron sash,
// a soft bronze bell-cap with a band round it and a little loop on top; calm eyes under small round brows.
// It moves on its own copy of the veggie critter base (mushbase.js, its mushroom: the waddle, the cap's
// sway, the spores, the moves), dressed here.
import { dressedVeggie } from './mushbase.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ell = (ctx, x, y, rx, ry, r = 0) => {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, r, 0, TAU);
};
const INK = '#9a7458';
const COL = {
  bell: '#e6b464', bellLt: '#fff0c4', bellSh: '#c48a46', bellDeep: '#a46e3a', band: '#b87a3e',
  sash: '#f4a24a', sashLt: '#ffcf8a', sashSh: '#d8803a',
  eye: '#3a2e2a', brow: '#a46e3a', blush: '#ffa0a8', mouth: '#8a5a4a',
  note: '#c48a46', glow: '#fff3c4',
};

// ---------- Its face (the body's own units, about its face) ----------
function eye(ctx, a, K, x, y, r, f) {
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
  if (f === 'blink' || f === 'sleep' || f === 'dead' || f === 'happy' || f === 'calm') {
    ctx.lineWidth = r * 0.32;
    ctx.beginPath();
    const up = f === 'happy' ? -1 : 1;
    ctx.moveTo(x - r * 0.95, y);
    ctx.quadraticCurveTo(x, y + up * r * 0.75, x + r * 0.95, y);
    ctx.stroke();
    return;
  }
  const k = f === 'startled' ? 1.12 : 1;
  ell(ctx, x, y, r * 0.78 * k, r * k);
  ctx.fillStyle = K.colour(a, COL.eye);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ell(ctx, x - r * 0.24, y - r * 0.36, r * 0.3, r * 0.3);
  ctx.fill();
  ell(ctx, x + r * 0.28, y + r * 0.38, r * 0.12, r * 0.12);
  ctx.fill();
  if (f === 'focus') {
    ctx.fillStyle = K.colour(a, K.C.base);
    ctx.fillRect(x - r * 1.1, y - r * 1.4, r * 2.2, r * 0.75);
  }
}
const faceOf = (a) => a.bc?.face ?? ((((a.t ?? 0) + (a.mo?.uid ?? 0) * 0.43) % 5.4) < 0.13 ? 'blink' : 'open');
function face(ctx, a, bk, K) {
  const F = K.P.face;
  K.frameAt(ctx, a, F.y);
  const lk = clamp(bk.look ?? 0, -1.2, 1.2);
  ctx.translate(F.x + lk * 0.8, F.y);
  const f = faceOf(a);
  ctx.fillStyle = K.tint(a, COL.blush, 0.55);
  ell(ctx, -2.4, 1.9, 1.4, 0.7);
  ctx.fill();
  ell(ctx, 2.2, 1.8, 0.95, 0.55);
  ctx.fill();
  eye(ctx, a, K, 1.5, -0.2, 1.0, f);
  eye(ctx, a, K, -1.7, -0.1, 1.15, f);
  // small round brows, a monk's calm
  ctx.fillStyle = K.colour(a, COL.brow);
  ell(ctx, 1.6, -2.0, 0.42, 0.34);
  ctx.fill();
  ell(ctx, -1.8, -2.0, 0.48, 0.38);
  ctx.fill();
  ctx.strokeStyle = K.colour(a, COL.mouth);
  ctx.lineWidth = 0.36;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if ((a.bc?.hum ?? 0) > 0.3 || f === 'startled') {
    ell(ctx, 0, 1.9, 0.45, 0.5);
    ctx.fillStyle = K.colour(a, COL.mouth);
    ctx.fill();
  } else if (f === 'focus' || f === 'hurt') {
    ctx.moveTo(-0.55, 2);
    ctx.lineTo(0.55, 1.95);
    ctx.stroke();
  } else {
    ctx.moveTo(-0.65, 1.7);
    ctx.quadraticCurveTo(0, 2.3, 0.65, 1.7);
    ctx.stroke();
  }
}

// ---------- Its saffron sash (painted on the stalk, clipped to it) ----------
function sash(ctx, a, bk, K) {
  ctx.save();
  K.frameAt(ctx, a, -5);
  ctx.beginPath();
  ctx.moveTo(-7, -9.6);
  ctx.lineTo(-7, -7.2);
  ctx.quadraticCurveTo(0, -3.4, 7, 0.4);
  ctx.lineTo(7, -2.2);
  ctx.quadraticCurveTo(0, -6, -7, -9.6);
  ctx.closePath();
  ctx.fillStyle = K.colour(a, COL.sash);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-7, -9.2);
  ctx.quadraticCurveTo(0, -5.6, 7, -1.8);
  ctx.strokeStyle = K.colour(a, COL.sashLt);
  ctx.lineWidth = 0.55;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-7, -7.5);
  ctx.quadraticCurveTo(0, -3.7, 7, 0.1);
  ctx.strokeStyle = K.colour(a, COL.sashSh);
  ctx.stroke();
  ctx.restore();
}

// ---------- Its bell-cap: a band round it and a little loop on top (over the cap) ----------
function bellBits(ctx, a, mode, K) {
  K.capFrame(ctx, a);
  const loop = () => {
    ctx.beginPath();
    ctx.ellipse(0, -11.6, 1.5, 1.7, 0, 0, TAU);
    ctx.ellipse(0, -11.6, 0.65, 0.85, 0, 0, TAU, true);
  };
  if (mode === 'line') {
    ctx.beginPath();
    ctx.ellipse(0, -11.6, 1.5, 1.7, 0, 0, TAU);
    K.edge(ctx);
    return;
  }
  loop();
  ctx.fillStyle = K.colour(a, COL.bellSh);
  ctx.fill('evenodd');
  // the band round the bell, low down, and a soft line over it
  ctx.save();
  ctx.beginPath();
  K.trace(ctx, a.bk.cap.shape.map(([x, y]) => {
    // (back into the cap's own frame)
    const c = a.bk.cap;
    const dx = x - c.at[0];
    const dy = y - c.at[1];
    return [dx * Math.cos(-c.ang) - dy * Math.sin(-c.ang), dx * Math.sin(-c.ang) + dy * Math.cos(-c.ang)];
  }));
  ctx.clip();
  ctx.fillStyle = K.colour(a, COL.band);
  ctx.fillRect(-14, -2.4, 28, 1.6);
  ctx.fillStyle = K.colour(a, COL.bellLt);
  ctx.globalAlpha *= 0.6;
  ctx.fillRect(-14, -2.4, 28, 0.4);
  ctx.restore();
}

const LOOK = {
  kind: 'mushroom',
  // (the bell-cap: taller than the base's dome, straight-sided, its lip flared like a temple bell's)
  P: {
    cap: {
      pts: [[0, -10.8], [3.4, -10.4], [5.4, -8.4], [6, -5], [6.5, -1.8], [8, 0.6], [10, 2.2], [8.2, 3], [3.2, 3.2], [-3.2, 3.2], [-8.2, 3], [-10, 2.2], [-8, 0.6], [-6.5, -1.8], [-6, -5], [-5.4, -8.4], [-3.4, -10.4]],
    },
  },
  C: { lt: '#fffaf0', base: '#f6ead6', sh: '#e4cfb0', deep: '#c8ac88' },
  CK: { lt: COL.bellLt, base: COL.bell, sh: COL.bellSh, deep: COL.bellDeep },
  ink: INK,
  spore: ['#fff3c4', '#f0d48a'],
  face,
  paint: sash,
  over: { cap: bellBits },
  // Its act, about 30 s, a little monk of the whale's gardens (on the base's channels: x, lift, hop, lean,
  // bend, crouch, sink, sit, lie, armN, armF, crown, capTilt, capDrop, mouth, look, wiggle, shake, tuck):
  //   - ringing its bell-cap: rocking forward and back, the cap swinging, a soft "bonng";
  //   - sitting to meditate, hands together, eyes shut, a hum and motes of light rising;
  //   - polishing its bell with a sleeve, a gleam;
  //   - a deep bow to the whale;
  //   - a nap sitting up, its cap drooping, a "z".
  pose: (m, a, out, K, mv) => {
    const b = { face: null, ring: -1, hum: 0, motes: 0, gleam: -1, z: 0 };
    a.bc = b;
    const st = a.mo.rig;
    const dt = clamp(a.dt ?? 0, 0, 0.1);
    const dead = m.hp <= 0;
    const hurt = (a.hurtAgo ?? 9) < 0.45;
    const napping = (m.habit?.kind === 'nap' && (a.now ?? 0) < (m.habit.until ?? 0)) || m.pose === 'sleep';
    const fighting = (m.aggroUntil ?? 0) > (a.now ?? 0) || (a.now ?? 0) - (m.attackAt ?? -99) < 4 || (a.hurtAgo ?? 9) < 3;
    // (its act, eased in and out: never while it walks, fights, naps or is posed in a scene)
    const want = dead || hurt || mv || fighting || napping ? 0 : clamp((a.calm ?? 1) * (1 - clamp(a.walkW ?? 0, 0, 1)) * (a.moving ? 0 : 1) * (m.pose || m.cine ? 0 : 1), 0, 1);
    st.bcW = Number.isFinite(st.bcW) ? st.bcW + (want - st.bcW) * Math.min(1, dt * (want < st.bcW ? 9 : 4)) : want;
    const calm = st.bcW;
    b.face = dead ? 'dead' : hurt ? 'hurt' : mv ? 'focus' : napping ? 'sleep' : null;
    if (calm < 0.02) return;
    const t = a.t ?? 0;
    const lu = (((t + (m.uid % 5) * 3.6) % 30) + 30) % 30;
    const hold = (x, a0, a1, b0, b1) => {
      const e = (u) => u * u * (3 - 2 * u);
      return x <= a0 || x >= b1 ? 0 : x < a1 ? e((x - a0) / (a1 - a0)) : x <= b0 ? 1 : e((b1 - x) / (b1 - b0));
    };
    const go = (pose, w) => {
      if (w > 0.001) for (const [k, v] of Object.entries(pose)) out[k] = (out[k] ?? 0) + (v - (out[k] ?? 0)) * w;
    };
    // ringing its bell-cap
    const ring = hold(lu, 1, 1.5, 5, 5.6) * calm;
    const sw = Math.sin((lu - 1.5) * 3.2);
    go({ lean: sw * 9, capTilt: -sw * 16, armN: 30, armF: 30 }, ring);
    if (ring > 0.4) b.ring = ((lu - 1.5) % (Math.PI * 2 / 3.2)) / (Math.PI * 2 / 3.2);
    // meditating
    const med = hold(lu, 7, 7.8, 12.4, 13.1) * calm;
    b.hum = med * (Math.sin(lu * 1.6) > 0.2 ? 1 : 0);
    b.motes = med;
    go({ sit: 1, armN: 82, armF: 82, lift: Math.sin(lu * 1.4) * 0.4, look: 0 }, med);
    // polishing its bell with a sleeve
    const pol = hold(lu, 15, 15.4, 17.8, 18.3) * calm;
    go({ armN: 128 + Math.sin(lu * 14) * 10, capTilt: Math.sin(lu * 14) * 3, lean: -4, look: 0.3 }, pol);
    if (lu > 17.6 && lu < 18.6) b.gleam = (lu - 17.6) / 1;
    // a deep bow to the whale
    const bow = hold(lu, 20, 20.5, 21.6, 22.2) * calm;
    go({ lean: 30, bend: 8, capTilt: 6, armN: 60, armF: 60 }, bow);
    // a nap sitting up
    const nap = hold(lu, 24, 24.8, 28.4, 29) * calm;
    go({ sit: 1, droop: 0.8, capDrop: 0.4, capTilt: 8, armN: 10, armF: 10 }, nap);
    b.z = nap;
    if (!b.face) b.face = ring > 0.4 ? 'calm' : med > 0.4 ? 'calm' : pol > 0.4 ? (b.gleam >= 0 ? 'happy' : 'focus') : bow > 0.4 ? 'calm' : nap > 0.4 ? 'sleep' : null;
  },
  // Its extras: the soft "bonng" of its bell and a ring of sound, motes of light as it meditates, a gleam,
  // a sleepy z.
  fx: (ctx, m, a, S, K) => {
    const b = a.bc;
    const bk = a.bk;
    if (!b || !bk || m.hp <= 0) return;
    const t = a.t ?? 0;
    const cap = bk.cap.at;
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
    if (b.ring >= 0) {
      // a soft ring of sound widening out from the bell, and its "bonng"
      const u = b.ring;
      ctx.save();
      ctx.globalAlpha *= (1 - u) * 0.6;
      ctx.strokeStyle = COL.glow;
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.ellipse(cap[0], cap[1] - 3, 8 + u * 8, 5 + u * 5, 0, Math.PI * 1.05, Math.PI * 1.95);
      ctx.stroke();
      ctx.restore();
      if (u < 0.6) text('bonng', cap[0] + 9, cap[1] - 10 - u * 3, 4, COL.note, Math.sin((Math.PI * u) / 0.6));
    }
    if (b.motes > 0.3) {
      for (let i = 0; i < 3; i++) {
        const u = (t * 0.35 + i / 3) % 1;
        spark(cap[0] - 6 + i * 6 + Math.sin(u * 6 + i) * 1.2, cap[1] + 8 - u * 16, 0.9, b.motes * Math.sin(Math.PI * u), COL.glow);
      }
      if (b.hum > 0.5) {
        const u = (t * 0.5) % 1;
        text('hmm~', cap[0] + 10, cap[1] - 4 - u * 2, 3.6, COL.note, b.hum * Math.sin(Math.PI * u));
      }
    }
    if (b.gleam >= 0) spark(cap[0] + 4, cap[1] - 7, 0.8 + Math.sin(Math.PI * b.gleam) * 1.8, Math.sin(Math.PI * b.gleam), '#ffffff');
    if (b.z > 0.3) {
      const u = (t * 0.45) % 1;
      text('z', cap[0] + 8 + u * 3, cap[1] - 8 - u * 6, 4 + u * 2, COL.note, b.z * Math.sin(Math.PI * u));
    }
  },
};

const D = dressedVeggie(LOOK);
export const BELLCAP_MONK_ART = { ...D.art, noHop: true };
export const BELLCAP_MONK_SIZE = { w: Math.round(D.w), h: Math.round(D.h), speed: D.speed };
