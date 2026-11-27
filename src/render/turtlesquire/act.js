// The Turtle Squire's act kit (2026-11-27): a copy of the Jelly Bean Meerkat's (render/meerkat/act.js), itself a copy of
// the Strawberry Calf's, kept here so neither is touched. Its notes follow.
// The plumbing under the idle act and the fight (render/meerkat/index.js says what it does with it). Nothing here draws a look of its
// own except the marks over its head, which take its colours.
//   fightState(m, a, st, pool, pick)  which move it is on (the wind-up `W` 0..1, the strike's time `s`
//                                     from the blow, -1 before), whether it is hurt, hunting, napping,
//                                     low on health, in a scene, beaten
//   pickPiece(m, st, now, calmGoal, cw, PIECES, ORDER)  the act's next piece that fits the time it has
//                                     before it moves on (world/mobs.js `m.restUntil`), or a short
//                                     breath between pieces
//   settleFace(st, q, now, uid, SHUTS, every)  an in-between (a blink) on every change of face, and its
//                                     own blink rhythm (from its id, never a random number)
//   easeKeys(st, q, keys, dt, rate)   its soft settings eased so nothing snaps
//   bubble / zee                      its own !, ? and z's
//   spline / ribbon                   a smooth line through points; a soft ribbon round it with a cap
import { TAU, clamp, mix, sstep, ell, smooth, pen } from './fx.js';

export function fightState(m, a, st, pool, pick) {
  const now = a.now ?? a.t ?? 0;
  const total = Math.max(0.2, m.def.fight?.windup ?? 0.5);
  const wind = m.windup > 0 ? clamp(1 - m.windup / total, 0, 1) : 0;
  if (wind > 0) st.kWindAt = now;
  const since = now - (m.attackAt ?? -9);
  const striking = since >= 0 && since < 1.1;
  const alive = m.hp > 0;
  if ((wind > 0 || striking) && alive) {
    if (!st.kAtk) {
      st.kN = (st.kN ?? m.uid ?? 0) + 1;
      st.kMove = typeof m.move === 'string' && pool.includes(m.move) ? m.move : pick ? pick(m, st.kN) : pool[st.kN % pool.length];
    }
    st.kAtk = true;
  } else st.kAtk = false;
  const mvName = st.kAtk ? st.kMove : null;
  // (a blow with no wind-up seen, a touch: a quick wind-up of its own first)
  const hadWind = now - (st.kWindAt ?? -9) < Math.max(0, since) + 0.15;
  let W = wind;
  let s = striking ? since : -1;
  if (mvName && striking) {
    if (!hadWind) {
      W = since < 0.22 ? sstep(since / 0.22) : 1;
      s = since - 0.22;
    } else W = 1;
  }
  const ago = a.hurtAgo ?? 9;
  const hurt = alive && ago >= 0 && ago < 0.6;
  const fighting = (m.aggroUntil ?? 0) > now;
  const napping = alive && (m.pose === 'sleep' || (m.habit?.kind === 'nap' && (m.habit.until ?? 0) > now));
  const low = alive && m.hp < m.def.hp * 0.25 && !m.cine;
  const moveW = mvName ? (s >= 0 ? 1 - sstep((s - 0.55) / 0.4) : 1) : 0;
  return { now, mvName, W, s, since, alive, busy: Boolean(mvName) || !alive, ago, hurt, fighting, napping, cine: m.cine?.mood, low, moveW };
}

export function pickPiece(m, st, now, calmGoal, cw, PIECES, ORDER) {
  let PC = st.kPiece ?? null;
  if (PC && (now < PC.t0 - 0.25 || (cw < 0.03 && !calmGoal))) PC = null;
  if (PC && PC.name && now - PC.t0 > PIECES[PC.name] + 1.2) PC = null;
  if (PC && !PC.name && now >= PC.until) PC = null;
  if (!PC && calmGoal) {
    const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
    st.kOrd ??= (m.uid ?? 0) % ORDER.length;
    for (let i = 0; i < ORDER.length; i++) {
      const nm = ORDER[(st.kOrd + i) % ORDER.length];
      if (PIECES[nm] + 0.4 <= left) {
        PC = { name: nm, t0: now + 0.2 };
        st.kOrd = (st.kOrd + i + 1) % ORDER.length;
        break;
      }
    }
    if (!PC) PC = { name: null, t0: now, until: now + Math.max(0.5, Math.min(left, 3)) };
  }
  st.kPiece = PC;
  return { piece: PC?.name ?? null, pu: PC?.name ? now - PC.t0 : -1 };
}

export function settleFace(st, q, now, uid, SHUTS, every = 4.3) {
  let f = q.face ?? 'calm';
  if (f !== st.kFace) {
    st.kFaceFrom = st.kFace;
    st.kFace = f;
    st.kFaceAt = now;
  }
  const since0 = now - (st.kFaceAt ?? -9);
  const talky = (n) => n === 'calm' || n.startsWith('talk');
  if (since0 >= 0 && since0 < 0.07 && st.kFaceFrom && !SHUTS.has(f) && !SHUTS.has(st.kFaceFrom) && !(talky(f) && talky(st.kFaceFrom))) f = 'shut';
  const bl = (now + (uid ?? 0) * 0.61) % every;
  if (bl < 0.12 && !SHUTS.has(f) && f !== 'dizzy') f = 'shut';
  q.face = f;
}

export function easeKeys(st, q, keys, dt, rate = (k) => 12) {
  for (const key of keys) {
    const r = rate(key);
    st[`k_${key}`] = mix(st[`k_${key}`] ?? q[key], q[key], 1 - Math.exp(-dt * r));
    q[key] = st[`k_${key}`];
  }
}

export function zee(ctx, x, y, s, al, fl, ink, fill) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.scale(fl ? -s : s, s);
  ctx.beginPath();
  ctx.moveTo(-1.6, -1.6);
  ctx.quadraticCurveTo(0, -1.9, 1.6, -1.6);
  ctx.quadraticCurveTo(0, 0, -1.6, 1.6);
  ctx.quadraticCurveTo(0, 1.3, 1.7, 1.6);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = ink;
  ctx.stroke();
  ctx.lineWidth = 0.7;
  ctx.strokeStyle = fill;
  ctx.stroke();
  ctx.restore();
}

// A round speech shape with a ! or a ?, popping in with a little bounce and shrinking away; `shape`
// its own outline (points round 0, 0), `cols` [ink, fill, mark !, mark ?].
export function bubble(ctx, x, y, mark, e, dur, fl, shape, cols) {
  const k = Math.max(0, 1 - Math.exp(-9 * e) * Math.cos(18 * e)) * (1 - sstep((e - dur + 0.25) / 0.25));
  if (k <= 0.02 || e < 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(fl ? -k : k, k);
  for (const pass of ['line', 'fill']) {
    smooth(ctx, shape);
    if (pass === 'line') {
      pen(ctx, cols[0], 1.2);
      ctx.stroke();
    } else {
      ctx.fillStyle = cols[1];
      ctx.fill();
    }
  }
  ctx.strokeStyle = mark === '!' ? cols[2] : cols[3];
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (mark === '!') {
    ctx.moveTo(0, -3);
    ctx.lineTo(0, 0.4);
  } else {
    ctx.moveTo(-1.5, -1.8);
    ctx.quadraticCurveTo(-1.2, -3.6, 0.4, -3.4);
    ctx.quadraticCurveTo(2, -3, 1.4, -1.4);
    ctx.quadraticCurveTo(0.4, -0.6, 0.2, 0.6);
  }
  ctx.stroke();
  ell(ctx, mark === '!' ? 0 : 0.2, 2.4, 0.85, 0.85);
  ctx.fill();
  ctx.restore();
}

export function spline(pts, n = 6) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let j = 0; j < n; j++) {
      const t = j / n;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([0, 1].map((c) => 0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3)));
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

// A soft ribbon round a centre line (widths at each control point, eased between), a round cap at its
// end. Returns the centre line's points.
export function ribbon(ctx, pts, widths, n = 6) {
  const c = spline(pts, n);
  const ws = c.map((_, i) => {
    const u = (i / (c.length - 1)) * (widths.length - 1);
    const j = Math.min(widths.length - 2, Math.floor(u));
    return mix(widths[j], widths[j + 1], sstep(u - j)) / 2;
  });
  const L = [];
  const Rr = [];
  for (let i = 0; i < c.length; i++) {
    const p = c[Math.max(0, i - 1)];
    const q = c[Math.min(c.length - 1, i + 1)];
    const dx = q[0] - p[0];
    const dy = q[1] - p[1];
    const d = Math.hypot(dx, dy) || 1;
    const nx = -dy / d;
    const ny = dx / d;
    L.push([c[i][0] + nx * ws[i], c[i][1] + ny * ws[i]]);
    Rr.push([c[i][0] - nx * ws[i], c[i][1] - ny * ws[i]]);
  }
  ctx.beginPath();
  ctx.moveTo(...L[0]);
  for (const p of L.slice(1)) ctx.lineTo(...p);
  const e = c[c.length - 1];
  const pe = c[c.length - 2];
  const ang = Math.atan2(L[L.length - 1][1] - e[1], L[L.length - 1][0] - e[0]);
  const out = Math.atan2(e[1] - pe[1], e[0] - pe[0]);
  const ccw = Math.cos(ang - Math.PI / 2 - out) > 0;
  ctx.arc(e[0], e[1], ws[ws.length - 1], ang, ang + (ccw ? -Math.PI : Math.PI), ccw);
  for (const p of Rr.reverse()) ctx.lineTo(...p);
  ctx.closePath();
  return c;
}

export const TAU2 = TAU;
