// The Sky Seahorse (2026-11-27, new for the Sky Whale's Back, in the Kite Pika's place: the player wanted
// the late regulars to be new creatures that fit their place, each on its own base; the id stays
// `kiterider`). A little seahorse that swims the sky instead of the sea, riding the warm air over the great
// whale's back: sky blue, a sunrise-peach belly, a soft cloud mane down its neck and a fin tinted like a
// sail at dawn. Amber-lit eyes with one curl of a lash. It whistles through its snout, blows little rings
// of cloud and curls its tail round the wind. It moves on its own copy of the fish base (horsebase.js, its
// seahorse: the upright hover, the curl, the moves), dressed here.
import { dressedSeahorse } from './horsebase.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ell = (ctx, x, y, rx, ry, r = 0) => {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, r, 0, TAU);
};
const INK = '#6a7ab8';
const COL = {
  belly: '#ffd2b4', bellyLt: '#ffeadc',
  fin: '#ffb8c8', finLt: '#fff0c8',
  cloud: '#ffffff', cloudSh: '#dde8fa',
  eye: '#2a3054', amber: '#f0a85a', amberLt: '#ffd89a', blush: '#ff9eb4', mouth: '#8a4a6a',
  note: '#7a8ad8',
};

// ---------- Its face (on the head, the snout to the right) ----------
function eye(ctx, a, K, at, f) {
  const s = K.sc;
  const c = at(0.4, -0.9);
  const r = s(1.9);
  ctx.lineCap = 'round';
  ctx.strokeStyle = K.tone(a, COL.eye);
  if (f === 'hurt') {
    ctx.lineWidth = r * 0.34;
    ctx.beginPath();
    ctx.moveTo(c[0] - r * 0.8, c[1] - r * 0.7);
    ctx.lineTo(c[0] + r * 0.5, c[1]);
    ctx.lineTo(c[0] - r * 0.8, c[1] + r * 0.7);
    ctx.stroke();
    return;
  }
  if (f === 'blink' || f === 'sleep' || f === 'dead' || f === 'happy') {
    ctx.lineWidth = r * 0.32;
    ctx.beginPath();
    const up = f === 'happy' ? -1 : 1;
    ctx.moveTo(c[0] - r * 0.95, c[1]);
    ctx.quadraticCurveTo(c[0], c[1] + up * r * 0.8, c[0] + r * 0.95, c[1]);
    ctx.stroke();
    // its one lash, curled up at the back
    ctx.lineWidth = r * 0.22;
    ctx.beginPath();
    ctx.moveTo(c[0] - r * 0.9, c[1] + (up < 0 ? r * 0.1 : 0));
    ctx.quadraticCurveTo(c[0] - r * 1.4, c[1] - r * 0.3, c[0] - r * 1.25, c[1] - r * 0.75);
    ctx.stroke();
    return;
  }
  const k = f === 'ooh' ? 1.1 : 1;
  ell(ctx, c[0], c[1], r * k, r * 1.05 * k);
  ctx.fillStyle = K.tone(a, COL.eye);
  ctx.fill();
  const g = ctx.createLinearGradient(c[0], c[1], c[0], c[1] + r);
  g.addColorStop(0, K.tone(a, COL.amber));
  g.addColorStop(1, K.tone(a, COL.amberLt));
  ell(ctx, c[0], c[1] + r * 0.4, r * 0.7, r * 0.5);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ell(ctx, c[0] - r * 0.3, c[1] - r * 0.38, r * 0.36, r * 0.3, -0.3);
  ctx.fill();
  ell(ctx, c[0] + r * 0.36, c[1] + r * 0.32, r * 0.14, r * 0.14);
  ctx.fill();
  // its one lash, curled up at the back
  ctx.lineWidth = r * 0.22;
  ctx.beginPath();
  ctx.moveTo(c[0] - r * 0.85, c[1] - r * 0.5);
  ctx.quadraticCurveTo(c[0] - r * 1.45, c[1] - r * 0.7, c[0] - r * 1.3, c[1] - r * 1.2);
  ctx.stroke();
  if (f === 'focus') {
    ctx.fillStyle = K.tone(a, K.C.base);
    ctx.save();
    ctx.translate(c[0], c[1]);
    ctx.rotate(a.fk.head.hA);
    ctx.fillRect(-r * 1.2, -r * 1.5, r * 2.4, r * 0.8);
    ctx.restore();
  }
}
const faceOf = (a) => a.sk?.face ?? ((((a.t ?? 0) + (a.mo?.uid ?? 0) * 0.43) % 4.9) < 0.13 ? 'blink' : 'open');
function face(ctx, a, sk, K, at) {
  const f = faceOf(a);
  const s = K.sc;
  const b = at(2.2, 1.6);
  const g = ctx.createRadialGradient(b[0], b[1], 0, b[0], b[1], s(1.9));
  g.addColorStop(0, 'rgba(255,158,180,0.6)');
  g.addColorStop(1, 'rgba(255,158,180,0)');
  ctx.fillStyle = g;
  ctx.fillRect(b[0] - s(2), b[1] - s(2), s(4), s(4));
  eye(ctx, a, K, at, f);
  // a little smile at the snout's tip (the base opens its mouth itself)
  if ((sk.jaw ?? 0) > 0.05) return;
  const H = sk.head;
  const m = [H.tip[0] + H.sd[0] * s(0.5), H.tip[1] + H.sd[1] * s(0.5)];
  ctx.strokeStyle = K.tone(a, COL.mouth);
  ctx.lineWidth = s(0.38);
  ctx.lineCap = 'round';
  ctx.beginPath();
  if ((a.sk?.whistle ?? 0) > 0.3 || f === 'ooh') {
    ell(ctx, m[0], m[1], s(0.5), s(0.5));
    ctx.fillStyle = K.tone(a, COL.mouth);
    ctx.fill();
  } else {
    ctx.moveTo(m[0] - H.sd[0] * s(0.2) - H.sv[0] * s(0.6), m[1] - H.sd[1] * s(0.2) - H.sv[1] * s(0.6));
    ctx.quadraticCurveTo(m[0] + H.sd[0] * s(0.5), m[1] + H.sd[1] * s(0.5), m[0] - H.sd[0] * s(0.2) + H.sv[0] * s(0.6), m[1] - H.sd[1] * s(0.2) + H.sv[1] * s(0.6));
    ctx.stroke();
  }
}

// ---------- Its sunrise belly, its cloud mane, its sail fin ----------
// (a point along its body: s from the head down, off out to its front (+) or back (-))
const along = (sk, s, off) => sk.along(s, off);
function belly(ctx, a, mode, K) {
  if (mode !== 'fill') return;
  const sk = a.fk;
  const s = K.sc;
  // the warm belly: a soft patch down its front, from the chest to where the tail begins, from just in
  // from the front edge to about halfway across, its ends tapered
  const outer = [];
  const inner = [];
  const U0 = 4.6;
  const U1 = 19;
  for (let u = U0; u <= U1 + 0.01; u += 0.7) {
    const k = Math.sin(Math.PI * (u - U0) / (U1 - U0)) ** 0.35;
    const g = sk.girth(s(u), -1);
    outer.push(along(sk, s(u), -(g - s(0.45))));
    inner.push(along(sk, s(u), -(g - s(0.45) - g * 0.9 * k)));
  }
  ctx.save();
  // (one smooth loop: out down the front edge, back up the inner edge, rounded through midpoints)
  const loop = [...outer, ...inner.reverse()];
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  ctx.beginPath();
  ctx.moveTo(...mid(loop[loop.length - 1], loop[0]));
  for (let i = 0; i < loop.length; i++) ctx.quadraticCurveTo(...loop[i], ...mid(loop[i], loop[(i + 1) % loop.length]));
  ctx.closePath();
  ctx.lineJoin = 'round';
  ctx.fillStyle = K.tone(a, COL.belly);
  ctx.globalAlpha *= 0.85;
  ctx.fill();
  ctx.clip();
  // lit along its middle
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  for (let i = 0; i < outer.length; i++) {
    const q = outer[i];
    if (i) ctx.lineTo(q[0] - s(0.9), q[1]);
    else ctx.moveTo(q[0] - s(0.9), q[1]);
  }
  ctx.strokeStyle = K.tone(a, COL.bellyLt);
  ctx.lineWidth = s(1.4);
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();
}
function mane(ctx, a, mode, K) {
  const sk = a.fk;
  const s = K.sc;
  const fl = (a.sk?.breeze ?? 0) * Math.sin((a.t ?? 0) * 12) * s(0.3);
  const blobs = [[1.6, 2.6, 3.2], [5.4, 2.8, 3.4], [8.6, 2.2, 2.6]].map(([u, off, r], i) => {
    const p = along(sk, s(u), s(off));
    return [p[0] + (i % 2 ? fl : -fl), p[1], s(r)];
  });
  if (mode === 'line') {
    ctx.beginPath();
    for (const [x, y, r] of blobs) {
      ctx.moveTo(x + r, y);
      ctx.arc(x, y, r, 0, TAU);
    }
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.stroke();
    return;
  }
  for (const [x, y, r] of blobs) {
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.4, r * 0.1, x, y, r);
    g.addColorStop(0, K.tone(a, COL.cloud));
    g.addColorStop(0.7, K.tone(a, COL.cloud));
    g.addColorStop(1, K.tone(a, COL.cloudSh));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  }
}

const LOOK = {
  // (sky blue, its fins sunrise pink)
  C: { lt: '#e6f4ff', base: '#a8d4f6', sh: '#80b4e4', deep: '#6a98d0', guide: '#a8d4f6', nose: '#6a98d0', mouth: '#8a4a6a' },
  ink: INK,
  face,
  over: { body: belly },
  under: { head: mane },
  // Its act, about 30 s, a seahorse of the open sky (on the base's channels: x, rise, lift, sink, pitch,
  // head, bend, curl, jaw, gill, fins, dorsal, spread, thrash):
  //   - a whistle through its snout, a little tune;
  //   - riding a warm updraught, bobbing up and gently down, its mane in the breeze;
  //   - a ring of cloud blown from its snout, watched drifting off ("ooh");
  //   - a polite little bow, its tail curled under;
  //   - a nap, curled up, a "z".
  pose: (m, a, out, K, mv) => {
    const g = { face: null, whistle: 0, breeze: 0, ring: -1, z: 0 };
    a.sk = g;
    const st = a.mo.rig;
    const dt = clamp(a.dt ?? 0, 0, 0.1);
    const dead = m.hp <= 0;
    const hurt = (a.hurtAgo ?? 9) < 0.45;
    const napping = (m.habit?.kind === 'nap' && (a.now ?? 0) < (m.habit.until ?? 0)) || m.pose === 'sleep';
    const fighting = (m.aggroUntil ?? 0) > (a.now ?? 0) || (a.now ?? 0) - (m.attackAt ?? -99) < 4 || (a.hurtAgo ?? 9) < 3;
    // (its act, eased in and out: never while it swims, fights, naps or is posed in a scene)
    const want = dead || hurt || mv || fighting || napping ? 0 : clamp((a.calm ?? 1) * (1 - clamp(a.walkW ?? 0, 0, 1)) * (a.moving ? 0 : 1) * (m.pose || m.cine ? 0 : 1), 0, 1);
    st.skW = Number.isFinite(st.skW) ? st.skW + (want - st.skW) * Math.min(1, dt * (want < st.skW ? 9 : 4)) : want;
    const calm = st.skW;
    g.face = dead ? 'dead' : hurt ? 'hurt' : mv ? 'focus' : napping ? 'sleep' : null;
    if (calm < 0.02) return;
    const t = a.t ?? 0;
    const lu = (((t + (m.uid % 5) * 3.4) % 30) + 30) % 30;
    const hold = (x, a0, a1, b0, b1) => {
      const e = (u) => u * u * (3 - 2 * u);
      return x <= a0 || x >= b1 ? 0 : x < a1 ? e((x - a0) / (a1 - a0)) : x <= b0 ? 1 : e((b1 - x) / (b1 - b0));
    };
    const go = (pose, w) => {
      if (w > 0.001) for (const [k, v] of Object.entries(pose)) out[k] = (out[k] ?? 0) + (v - (out[k] ?? 0)) * w;
    };
    const H = K.H;
    // a whistle
    const wh = hold(lu, 1, 1.5, 5, 5.5) * calm;
    g.whistle = wh;
    go({ head: -8 + Math.sin(lu * 3) * 3, pitch: -3, gill: 0.8, dorsal: 0.6 + Math.sin(lu * 6) * 0.2, fins: 0.3 }, wh);
    // riding a warm updraught
    const ride = hold(lu, 7, 7.6, 11.6, 12.2) * calm;
    g.breeze = ride;
    go({ rise: (0.12 + Math.sin((lu - 7.6) * 1.8) * 0.06) * H / H, spread: 1, dorsal: 1, fins: 0.8, pitch: -6, curl: -0.3 }, ride);
    // a ring of cloud blown from its snout
    const blow = hold(lu, 13.5, 14, 17, 17.5) * calm;
    go({ head: -4, jaw: lu < 14.6 ? 0.4 : 0, gill: lu < 14.6 ? 1 : 0.3, fins: 0.4 }, blow);
    if (lu > 14.4 && lu < 17.2) g.ring = (lu - 14.4) / 2.8;
    // a polite little bow
    const bow = hold(lu, 19, 19.5, 21, 21.6) * calm;
    go({ pitch: 18, head: 16, curl: 0.8, fins: -0.3 }, bow);
    // a nap, curled up
    const nap = hold(lu, 23, 23.8, 27.8, 28.4) * calm;
    go({ curl: 1.2, head: 18, pitch: 6, sink: K.sc(2) + H * 0.06, fins: -0.35, dorsal: -0.8 }, nap);
    g.z = nap;
    if (!g.face) g.face = wh > 0.4 ? 'blink' : ride > 0.4 ? 'happy' : g.ring >= 0 && g.ring < 0.7 ? 'ooh' : bow > 0.4 ? 'happy' : nap > 0.4 ? 'sleep' : null;
  },
  // Its extras: whistled notes, soft breeze lines, the drifting ring of cloud, a sleepy z.
  fx: (ctx, m, a, K) => {
    const g = a.sk;
    const sk = a.fk;
    if (!g || !sk?.head || m.hp <= 0) return;
    const s = K.sc;
    const t = a.t ?? 0;
    const Hh = sk.head;
    const tip = Hh.tip;
    // (net turned round: the base mirrors some frames itself; words are kept reading the right way)
    const back = K.mirrored(a) !== Boolean(a.flip);
    const text = (str, x, y, size, col, al) => {
      ctx.save();
      ctx.globalAlpha *= al;
      ctx.translate(x, y);
      if (back) ctx.scale(-1, 1);
      ctx.font = `800 ${size}px Nunito, "Trebuchet MS", sans-serif`;
      ctx.lineWidth = Math.max(1, size * 0.22);
      ctx.strokeStyle = '#ffffff';
      ctx.fillStyle = col;
      ctx.textAlign = 'center';
      ctx.strokeText(str, 0, 0);
      ctx.fillText(str, 0, 0);
      ctx.restore();
    };
    if (g.whistle > 0.4) {
      for (let i = 0; i < 2; i++) {
        const u = (t * 0.6 + i * 0.5) % 1;
        text('♪', tip[0] + s(2 + u * 3), tip[1] - s(2 + u * 6), s(3.6 + u * 0.6), i ? '#ff8aa8' : COL.note, g.whistle * Math.sin(Math.PI * u));
      }
    }
    if (g.breeze > 0.3) {
      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.lineCap = 'round';
      ctx.lineWidth = s(0.5);
      for (let i = 0; i < 3; i++) {
        const u = (t * 0.8 + i / 3) % 1;
        const x = Hh.centre[0] - s(10) + i * s(5);
        const y = Hh.centre[1] + s(22) - u * s(26);
        ctx.globalAlpha = g.breeze * Math.sin(Math.PI * u) * 0.7;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + s(1.2), y - s(3), x, y - s(6));
        ctx.stroke();
      }
      ctx.restore();
    }
    if (g.ring >= 0) {
      // a soft ring of cloud, drifting off from its snout and widening as it fades
      const u = g.ring;
      const x = tip[0] + s(2 + u * 10);
      const y = tip[1] - s(1 + u * 5);
      const r = s(1 + u * 2.4);
      ctx.save();
      ctx.globalAlpha *= Math.min(1, u * 6) * (1 - u);
      ell(ctx, x, y, r, r * 0.8);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = s(1 - u * 0.4);
      ctx.stroke();
      ctx.restore();
    }
    if (g.z > 0.3) {
      const u = (t * 0.45) % 1;
      text('z', Hh.centre[0] + s(3 + u * 3), Hh.centre[1] - s(6 + u * 6), s(4 + u * 2), COL.note, g.z * Math.sin(Math.PI * u));
    }
  },
};

const D = dressedSeahorse(LOOK);
export const SKY_SEAHORSE_ART = { ...D.art, noHop: true };
export const SKY_SEAHORSE_SIZE = { w: Math.round(D.w), h: Math.round(D.h), speed: D.speed };
