// The Myconid Shaman (2026-11-26, remade on the bird base, the player's pick "D" of round 3: Jaxby
// the blue jay): Rootwood Hollow's level 10 caster. A round cobalt jay, cool and a bit smug, that
// hoards the Hollow's acorns and flicks them at you from afar.
// It moves on its own copy of the bird base (birdbase.js: its bones, hop, springs and moves),
// dressed here; everything else drawn here from scratch (the face too). Its effects are in fx.js.
//   look    cobalt with a white face and breast, a soft slate necklace band, white bars on its wings,
//           a tall swept crest of three feathers (each rooted inside the top of its head, on a
//           spring: up with its mood, flattened when it preens or sleeps, drooping when beaten).
//           Eyes: half-lidded almond eyes, steel-blue irises glancing about, a slanted sharp glint,
//           a heavy flat lid, a slate mask line running back from the beak through each eye.
//   idle    a 30 s act while it stands about: tossing an acorn up and catching it without looking;
//           preening a wing (crest flat); hiding an acorn under a tuft of moss and glancing round to
//           check no one saw; a chest-out strut with a flick of its crest.
//   moves   Acorn Flick (far: an acorn held in its beak through the wind-up, then tossed; the shot
//           is the game's 'spit' with fx.js's acorn) and Peck (close up), chosen by how far away
//           its target is (m.swingFar, world/dungeon.js).
//   special Feather Flurry (the dungeon's 'cloud' move): up tall, wings flung open and shaken; the
//           feathers that spiral down onto the spot and settle are fx.js's 'feathers' look.
//   faces   calm (cool, half-lidded), smug (lower lid, a sidelong look), cross for a fight (lids
//           slanting in), hurt (squeezed), asleep (head tucked, crest flat), beaten (soft
//           zigzags, slumped, crest drooping, feathers circling).
import { dressedBird } from './birdbase.js';
import { acorn, feather } from './fx.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mix = (a, b, u) => a + (b - a) * u;
const sstep = (u) => {
  const v = clamp(u, 0, 1);
  return v * v * (3 - 2 * v);
};
// (a beat's weight: eased up t0..t1, held, eased down t2..t3)
const win = (t, t0, t1, t2, t3) => sstep((t - t0) / (t1 - t0)) * (1 - sstep((t - t2) / (t3 - t2)));
const pulse = (t, t0, d) => {
  const u = (t - t0) / d;
  return u > 0 && u < 1 ? Math.sin(Math.PI * u) : 0;
};
const ell = (ctx, x, y, rx, ry, r = 0) => {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), r, 0, TAU);
};
const stroke = (ctx, col, w) => {
  ctx.strokeStyle = col;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
};
function blush(ctx, x, y, rx, ry, col, al, rot = 0) {
  if (al <= 0.005) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, col.replace('A', String(al)));
  g.addColorStop(1, col.replace('A', '0'));
  ctx.fillStyle = g;
  ctx.fillRect(-rx, -rx, rx * 2, rx * 2);
  ctx.restore();
}

const C = { lt: '#b8cbff', base: '#7c9cec', sh: '#5d7ed4', deep: '#4a66b8', guide: '#8eaaf0', beak: '#6f7796', beakSh: '#565d78', leg: '#7b84a2' };
// (its soft outline: a deep cobalt of its own, never near-black)
const INK = '#46609f';
const SLATE = '#4a5a8c';
const LASH = '#2f3c68';
const WARN = 1.6;

// Its mood, from the game's own fields.
function moodOf(m, a) {
  if (m.hp <= 0) return 'beaten';
  if ((a.hurtAgo ?? 9) < 0.5) return 'hurt';
  if (m.pose === 'sleep' || (m.habit?.kind === 'nap' && (a.now ?? 0) < (m.habit.until ?? Infinity))) return 'sleep';
  const cm = m.cine?.mood;
  if (cm === 'happy' || cm === 'angry') return cm;
  if (cm === 'sad') return 'sad';
  const gl = (a.now ?? 0) - (m.gloatAt ?? -9);
  if (gl >= 0 && gl < 1.5) return 'happy';
  if ((m.windup ?? 0) > 0 || a.mood === 'angry') return 'angry';
  return 'calm';
}
// (the dungeon's own move: m.move = { kind: 'cloud', t }; -1 when not casting it)
const cloudT = (m) => (m.move && typeof m.move === 'object' && m.move.kind === 'cloud' ? m.move.t : -1);

// Its moves over the bird's: Acorn Flick (its peck is the bird's own).
const MOVES = {
  // Head drawn back with an acorn in its beak, then a toss: the acorn flies on the release.
  flick: {
    anticT: 0.5,
    keys: [
      [0, { head: -22, reach: -0.3, beak: 0.35, pitch: -6, tailUp: 10 }],
      [0.07, { head: 18, reach: 0.5, beak: 0.8, pitch: 6, tailUp: -6 }, 'out'],
      [0.4, { head: 4, reach: 0.1, beak: 0.1 }, 'io'],
      [0.75, {}, 'io'],
    ],
  },
};

// The act, the special, the face: worked out once a frame, kept on `a.zz` for the drawing.
function pose(m, a, out, K, mv, mt) {
  const st = a.mo.rig;
  const t = a.t ?? 0;
  const dt = clamp(a.dt ?? 0, 0, 0.05);
  const zz = (a.zz = { mood: moodOf(m, a), face: null, crest: 0.35, look: 0, busy: Boolean(mv) || cloudT(m) >= 0 });
  if (mv === MOVES.flick) {
    zz.face = mt < 0 ? 'focus' : 'smug';
    zz.acorn = mt < 0;
    zz.crest = mt < 0 ? 0.8 : 1;
  } else if (mv && m.hp > 0 && (a.hurtAgo ?? 9) > 0.6) {
    zz.face = mt < 0 ? 'focus' : 'shut';
    zz.crest = 1;
  }
  const cl = cloudT(m);
  if (cl >= 0 && m.hp > 0) {
    // Feather Flurry: up tall, wings flung open, then shaken hard as the feathers fly.
    const up = sstep(cl / 0.5) * (1 - sstep((cl - WARN) / 0.4));
    const shake = pulse(cl, WARN - 0.2, 0.8);
    out.wingN = Math.max(out.wingN, up);
    out.wingF = Math.max(out.wingF, up);
    out.flap = Math.max(out.flap, shake);
    out.fluff = Math.max(out.fluff, 0.6 * up + shake * 0.4);
    out.spread = Math.max(out.spread, up);
    out.pitch += -8 * up;
    zz.crest = 1;
    zz.face = cl < WARN ? 'focus' : 'smug';
    zz.flurry = shake;
  }
  const calm = (a.calm ?? 0) * (mv || cl >= 0 || m.hp <= 0 || zz.mood !== 'calm' ? 0 : 1);
  const T = (t + (m.uid ?? 0) * 3.7) % 30;
  // its eyes glance about on their own
  const gb = Math.floor(t / 3.1);
  zz.look = mix(Math.sin(gb * 12.9 + (m.uid ?? 0)), Math.sin((gb + 1) * 12.9 + (m.uid ?? 0)), sstep(((t / 3.1) % 1) / 0.2));
  if (calm > 0.01) {
    // tossing an acorn up and catching it, without looking
    const toss = win(T, 2, 2.3, 5.6, 6) * calm;
    if (toss > 0.05) {
      const u = ((T - 2.3) / 1.1) % 1;
      zz.toss = toss;
      zz.tossU = u;
      out.head += -10 * toss - 6 * pulse(u, 0.85, 0.15);
      out.beak = Math.max(out.beak, 0.5 * pulse(u, 0.82, 0.18) + 0.3 * pulse(u, 0, 0.15));
      zz.face = 'smug';
      zz.crest = 0.8;
    }
    // preening a wing, crest flat
    const preen = win(T, 9, 9.5, 12, 12.5) * calm;
    out.head += 70 * preen + Math.sin(T * 8) * 6 * preen;
    out.wingN = Math.max(out.wingN, 0.25 * preen);
    if (preen > 0.3) {
      zz.face = 'shut';
      zz.crest = 0;
    }
    // caching an acorn: down to a tuft of moss, poking it in and patting it over...
    const cache = win(T, 16, 16.5, 19.2, 19.7) * calm;
    out.reach = Math.max(out.reach, cache * (0.7 + 0.3 * Math.sin(T * 10)));
    out.pitch += cache * 26;
    if (cache > 0.3) zz.face = 'focus';
    if (T > 15.6 && T < 22) zz.cache = { u: (T - 15.6) / 6.4 };
    // ... then a glance round to check no one saw
    const glance = win(T, 19.6, 19.9, 21, 21.4) * calm;
    out.head += Math.sin((T - 19.6) * 5) * 18 * glance;
    if (glance > 0.3) zz.face = 'smug';
    // a strut: chest out, tail up, a flick of the crest
    const strut = win(T, 25, 25.4, 27.4, 27.8) * calm;
    out.pitch += -10 * strut;
    out.fluff = Math.max(out.fluff, 0.4 * strut);
    out.tailUp += 16 * strut;
    if (strut > 0.3) {
      zz.crest = 1 + 0.3 * pulse(T, 25.6, 0.5);
      zz.face = 'smug';
    }
  }
  if (zz.mood === 'angry') zz.crest = Math.max(zz.crest, 1);
  if (zz.mood === 'happy') zz.crest = Math.max(zz.crest, 0.9);
  if (zz.mood === 'sad') zz.crest = -0.3;
  if (zz.mood === 'sleep') zz.crest = -0.15;
  if (zz.mood === 'beaten') zz.crest = -0.6;
  // The crest on its own spring: it lags the head's turns and nods, overshoots a little and settles.
  const cs = (st.zzCrest ??= { x: zz.crest, v: 0, prev: out.head });
  if (dt > 0) {
    const dh = (out.head - cs.prev) / dt;
    const n = Math.max(1, Math.ceil(dt * 240));
    for (let i = 0; i < n; i++) {
      cs.v += (-(cs.x - zz.crest) * 140 - cs.v * 11 + dh * 0.02) * (dt / n);
      cs.x = clamp(cs.x + cs.v * (dt / n), -0.8, 1.5);
    }
  }
  cs.prev = out.head;
  zz.crestX = cs.x;
  zz.t = t;
}
// Asleep and beaten, its own way.
function after(m, a, out) {
  if (m.hp <= 0) Object.assign(out, { sit: 1, pitch: 18, head: 26, wingN: 0.5, wingF: 0.5, fluff: 0.6, beak: 0.3, flap: 0, spread: 0.3 });
  // (its nap: settled down over its feet, fluffed up, head tucked in, its breath rising and falling)
  else if (a.zz?.mood === 'sleep' && !a.zz.busy) {
    const b = Math.sin((a.t ?? 0) * 1.3);
    Object.assign(out, { sit: 1, sleep: 1, fluff: 0.8 + b * 0.08, pitch: 4, head: 0, wingN: 0, wingF: 0, tailUp: -4, reach: 0, beak: 0 });
  }
}

// Over the body: the white breast and the slate necklace band.
function body(ctx, a, mode, K) {
  const bk = a.bk;
  if (!bk || mode === 'line') return;
  const sc = K.sc;
  const at = bk.at;
  const tone = (c) => K.colour(a, c);
  blush(ctx, ...at([4.6, 2.4]), sc(7.4), sc(5.6), 'rgba(250,252,255,A)', 1, bk.th);
  blush(ctx, ...at([2, 4.4]), sc(6), sc(3), 'rgba(250,252,255,A)', 0.85, bk.th);
  ctx.beginPath();
  ctx.moveTo(...at([9.2, -2.8]));
  ctx.quadraticCurveTo(...at([5.6, -1.2]), ...at([3.4, -4.8]));
  stroke(ctx, tone(SLATE), sc(1.1));
}
// Over the near wing: white bars and slate ones across its feathers.
function wing(ctx, a, mode, K) {
  const wg = a.bk?.wings?.N;
  if (!wg?.root || !wg.tip || mode === 'line') return;
  const tone = (c) => K.colour(a, c);
  for (let i = 0; i < 3; i++) {
    const u = 0.3 + i * 0.2;
    const p = [mix(wg.root[0], wg.tip[0], u), mix(wg.root[1], wg.tip[1], u)];
    ctx.beginPath();
    ctx.moveTo(p[0] - 1.2, p[1] - 1.4);
    ctx.lineTo(p[0] + 0.6, p[1] + 1.6);
    stroke(ctx, tone(i === 1 ? '#f6f8ff' : SLATE), 0.7);
  }
}
// The crest's three feathers, in the head's frame: rooted inside the top-back of the head (each at
// its own base), swept back, lifting and dropping with its spring.
function crestFeathers(zz, r, rx) {
  const lift = clamp(zz.crestX ?? 0.35, -0.8, 1.5);
  return [0, 1, 2].map((i) => {
    const root = [-rx * (0.12 + i * 0.18), -r * (0.7 - i * 0.08)];
    const ang = -Math.PI / 2 - 0.55 - i * 0.32 + lift * 0.35 - (1 - lift) * 0.25;
    const len = r * (1.05 - i * 0.18);
    return { root, tip: [root[0] + Math.cos(ang) * len, root[1] + Math.sin(ang) * len], w: r * (0.42 - i * 0.07), ang };
  });
}
function featherPath(ctx, f) {
  const n = [Math.cos(f.ang + Math.PI / 2), Math.sin(f.ang + Math.PI / 2)];
  const mid = [(f.root[0] + f.tip[0]) / 2, (f.root[1] + f.tip[1]) / 2];
  // (a soft round tip, never a point)
  const tr = f.w * 0.16;
  const tc = [f.tip[0] - Math.cos(f.ang) * tr, f.tip[1] - Math.sin(f.ang) * tr];
  ctx.moveTo(f.root[0] + (n[0] * f.w) / 2, f.root[1] + (n[1] * f.w) / 2);
  ctx.quadraticCurveTo(mid[0] + n[0] * f.w * 0.7, mid[1] + n[1] * f.w * 0.7, tc[0] + n[0] * tr, tc[1] + n[1] * tr);
  ctx.arc(tc[0], tc[1], tr, f.ang + Math.PI / 2, f.ang - Math.PI / 2, true);
  ctx.quadraticCurveTo(mid[0] - n[0] * f.w * 0.5, mid[1] - n[1] * f.w * 0.5, f.root[0] - (n[0] * f.w) / 2, f.root[1] - (n[1] * f.w) / 2);
  ctx.closePath();
}
// Its eye state: the mood, then the act's own face, then a blink.
function eyeState(zz, t) {
  const mood = zz.mood;
  const f = zz.face;
  if (mood === 'beaten') return 'beaten';
  if (mood === 'hurt') return 'hurt';
  if (mood === 'sleep' || f === 'shut') return 'shut';
  if (f) return f;
  if (mood === 'happy') return 'happy';
  if (mood === 'angry') return 'focus';
  if (mood === 'sad') return 'sad';
  return (t + 3.3) % 5.4 < 0.13 ? 'shut' : 'open';
}
// The head: the crest, the white face, the mask line and the eyes, the acorn in its beak.
function head(ctx, a, mode, K) {
  const bk = a.bk;
  if (!bk) return;
  const zz = a.zz ?? { mood: 'calm', crestX: 0.35 };
  const sc = K.sc;
  const Hd = K.P.head;
  const tone = (c) => K.colour(a, c);
  ctx.translate(bk.hp[0], bk.hp[1]);
  ctx.rotate(bk.ha);
  const r = sc(Hd.r);
  const rx = sc(Hd.rx);
  const feathers = crestFeathers(zz, r, rx);
  if (mode === 'line') {
    ctx.beginPath();
    for (const f of feathers) featherPath(ctx, f);
    return stroke(ctx, INK, 2);
  }
  // the crest, back feathers first, the head's top over their roots (they're drawn after the head,
  // so its crown's own soft round is laid back over where they grow from)
  for (const [i, f] of [...feathers.entries()].reverse()) {
    ctx.beginPath();
    featherPath(ctx, f);
    ctx.fillStyle = tone(i === 0 ? C.base : C.sh);
    ctx.fill();
  }
  ell(ctx, -rx * 0.12, -r * 0.42, rx * 0.62, r * 0.42);
  ctx.save();
  ell(ctx, 0, 0, rx, r);
  ctx.clip();
  ell(ctx, -rx * 0.12, -r * 0.42, rx * 0.62, r * 0.42);
  ctx.fillStyle = tone(C.base);
  ctx.fill();
  blush(ctx, -rx * 0.1, -r * 0.5, rx * 0.8, r * 0.5, 'rgba(184,203,255,A)', 0.9);
  // the white face
  blush(ctx, rx * 0.35, r * 0.35, rx * 0.75, r * 0.6, 'rgba(250,252,255,A)', 1);
  ctx.restore();
  const st = eyeState(zz, zz.t ?? 0);
  // the slate mask line from the beak back through the eye
  ctx.beginPath();
  ctx.moveTo(rx * 0.86, r * 0.02);
  ctx.quadraticCurveTo(rx * 0.45, -r * 0.05, rx * 0.02, r * 0.12);
  stroke(ctx, tone(SLATE), sc(0.7));
  const look = clamp(zz.look ?? 0, -1, 1);
  const eye = (x, y, erx, ery, inner) => {
    if (st === 'shut' || st === 'happy') {
      ctx.beginPath();
      if (st === 'happy') {
        ctx.moveTo(x - erx, y + ery * 0.2);
        ctx.quadraticCurveTo(x, y - ery * 0.9, x + erx, y + ery * 0.2);
      } else {
        ctx.moveTo(x - erx, y);
        ctx.quadraticCurveTo(x, y + ery * 0.6, x + erx, y);
      }
      return stroke(ctx, tone(LASH), sc(0.45));
    }
    if (st === 'hurt') {
      ctx.beginPath();
      ctx.moveTo(x - inner * erx * 0.7, y - ery * 0.5);
      ctx.lineTo(x + inner * erx * 0.5, y);
      ctx.lineTo(x - inner * erx * 0.7, y + ery * 0.5);
      return stroke(ctx, tone(LASH), sc(0.45));
    }
    if (st === 'beaten') {
      ctx.beginPath();
      ctx.moveTo(x - erx, y);
      ctx.lineTo(x - erx * 0.3, y - ery * 0.4);
      ctx.lineTo(x + erx * 0.3, y + ery * 0.4);
      ctx.lineTo(x + erx, y);
      return stroke(ctx, tone(LASH), sc(0.4));
    }
    // an almond, pointed at both corners
    const alm = () => {
      ctx.beginPath();
      ctx.moveTo(x - erx, y);
      ctx.quadraticCurveTo(x, y - ery * 1.25, x + erx, y);
      ctx.quadraticCurveTo(x, y + ery * 1.15, x - erx, y);
      ctx.closePath();
    };
    alm();
    ctx.fillStyle = tone('#f7f9ff');
    ctx.fill();
    ctx.save();
    alm();
    ctx.clip();
    // the iris glancing about (sidelong when smug)
    const gx = x + erx * (0.12 + 0.22 * (st === 'smug' ? -0.6 : look));
    ell(ctx, gx, y + ery * 0.05, ery * 0.82, ery * 0.82);
    const g = ctx.createLinearGradient(0, y - ery, 0, y + ery);
    g.addColorStop(0, tone('#2c3d6e'));
    g.addColorStop(1, tone('#6f9fd8'));
    ctx.fillStyle = g;
    ctx.fill();
    ell(ctx, gx + erx * 0.02, y + ery * 0.05, ery * 0.38, ery * 0.38);
    ctx.fillStyle = tone('#1f2a4c');
    ctx.fill();
    // the slanted sharp glint
    ctx.beginPath();
    ctx.moveTo(gx - erx * 0.17, y - ery * 0.6);
    ctx.lineTo(gx + erx * 0.13, y - ery * 0.6);
    ctx.lineTo(gx - erx * 0.07, y - ery * 0.05);
    ctx.lineTo(gx - erx * 0.37, y - ery * 0.05);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    // the heavy flat lid (half down; lower when smug or sad; slanting in when it means business)
    const lid = st === 'focus' ? 0.55 : st === 'smug' ? 0.5 : st === 'sad' ? 0.58 : 0.36;
    const tilt = st === 'focus' ? inner * 0.35 : st === 'sad' ? -inner * 0.3 : 0;
    const ly = y - ery + ery * lid * 2;
    ctx.beginPath();
    ctx.moveTo(x - erx * 1.3, y - ery * 1.5);
    ctx.lineTo(x + erx * 1.3, y - ery * 1.5);
    ctx.lineTo(x + erx * 1.3, ly + tilt * sc(1));
    ctx.lineTo(x - erx * 1.3, ly - tilt * sc(1));
    ctx.closePath();
    ctx.fillStyle = tone('#fafcff');
    ctx.fill();
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(x - erx * 1.05, ly - tilt * sc(1));
    ctx.lineTo(x + erx * 1.05, ly + tilt * sc(1));
    stroke(ctx, tone(LASH), sc(0.55));
    ctx.beginPath();
    ctx.moveTo(x - erx * 0.7, y + ery * 0.95);
    ctx.quadraticCurveTo(x, y + ery * 1.15, x + erx * 0.7, y + ery * 0.95);
    stroke(ctx, tone('#9db3e6'), sc(0.35));
  };
  eye(rx * 0.42, -r * 0.12, sc(1.9), sc(1.6), 1);
  // (the far eye just a sliver round the front of the face)
  eye(rx * 0.86, -r * 0.16, sc(0.75), sc(1.45), -1);
  // the acorn held in its beak through the Flick's wind-up
  if (zz.acorn) {
    const B = K.P.beak;
    acorn(ctx, sc(B.at[0] + B.len * 0.8), sc(B.at[1] + 0.4), 1.8, 0.4);
  }
}
// Over everything: the tossed acorn, the cache in the moss, feathers shaken loose, feathers circling.
function fx(ctx, m, a, K) {
  const zz = a.zz;
  const bk = a.bk;
  if (!zz || !bk) return;
  const t = zz.t ?? 0;
  const sc = K.sc;
  if (zz.toss > 0.05) {
    const u = zz.tossU ?? 0;
    const b = bk.beakTip ?? bk.hp;
    ctx.save();
    ctx.globalAlpha *= sstep(zz.toss * 3);
    acorn(ctx, b[0] + 0.5, b[1] - 1 - Math.sin(Math.PI * u) * 14, 1.7, u * TAU * 1.5);
    ctx.restore();
  }
  if (zz.cache) {
    // a little tuft of moss on the floor ahead of it, the acorn pushed in under it
    const u = zz.cache.u;
    const st = a.mo.rig;
    if (u < 0.05 || st.zzCacheX == null) st.zzCacheX = bk.beakTip[0] + sc(2);
    const x = st.zzCacheX;
    const al = sstep(u / 0.08) * (1 - sstep((u - 0.85) / 0.15));
    const sunk = sstep((u - 0.25) / 0.3);
    ctx.save();
    ctx.globalAlpha *= al;
    if (sunk < 1) acorn(ctx, x, -1.6 + sunk * 1.6, 1.6, 0.2);
    for (const [dx, r, c] of [[-2.2, 1.7, '#7fae62'], [0, 2.2, '#8fbf72'], [2.2, 1.6, '#7fae62']]) {
      ell(ctx, x + dx, -r * 0.55, r + 0.45, r * 0.75 + 0.45);
      ctx.fillStyle = '#5e8c4c';
      ctx.fill();
    }
    for (const [dx, r, c] of [[-2.2, 1.7, '#7fae62'], [0, 2.2, '#8fbf72'], [2.2, 1.6, '#7fae62']]) {
      ell(ctx, x + dx, -r * 0.55, r, r * 0.75);
      ctx.fillStyle = c;
      ctx.fill();
      ell(ctx, x + dx - r * 0.2, -r * 0.8, r * 0.5, r * 0.3);
      ctx.fillStyle = '#b8de96';
      ctx.fill();
    }
    ctx.restore();
  }
  if (zz.flurry > 0.05 || (zz.mood === 'hurt' && (a.hurtAgo ?? 9) < 0.5)) {
    // feathers shaken loose off its body
    const u = zz.flurry > 0.05 ? (t * 1.3) % 1 : (a.hurtAgo ?? 0) / 0.5;
    const c = bk.pivot;
    for (let i = 0; i < 4; i++) {
      const q = -Math.PI / 2 + (i - 1.5) * 0.7;
      feather(ctx, c[0] + Math.cos(q) * (4 + u * 10), c[1] - 4 + Math.sin(q) * (4 + u * 8) + u * u * 6, 1.4, q + u * 2, i % 2 === 0, 1 - u);
    }
  }
  if (zz.mood === 'beaten') {
    for (let i = 0; i < 3; i++) {
      const q = t * 2 + (i * TAU) / 3;
      feather(ctx, bk.hp[0] + Math.cos(q) * sc(7), bk.hp[1] - sc(10) + Math.sin(q) * sc(2.2), 1.4, q, i % 2 === 0);
    }
  }
}

const JAY = dressedBird({
  kind: 'songbird',
  C,
  ink: INK,
  noGuide: true,
  P: { moves: ['flick', 'peck'] },
  moves: MOVES,
  // (far: the flick; close up: the peck; m.swingFar is set as its wind-up starts)
  pick: (m) => (m.swingFar ? 'flick' : 'peck'),
  pose,
  after,
  over: { body, wingN: wing, head },
  fx,
});

// Its art entry, size (its body and crest as drawn) and roaming pace (the songbird's own hop).
export const SHAMAN = { art: { ...JAY.art, noHop: true }, w: 40, h: 38, speed: JAY.speed };
